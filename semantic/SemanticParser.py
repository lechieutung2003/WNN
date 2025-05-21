import spacy
import json
from typing import Dict, List, Any
import requests
from rdflib import Graph, URIRef, Literal, BNode
from rdflib.namespace import FOAF, DC, RDF, RDFS, XSD

class SemanticParser:
    def __init__(self):
        # Load NLP model cho phân tích ngữ nghĩa
        self.nlp = spacy.load("en_core_web_md")
        
        # Định nghĩa các namespace cho ontology nghệ thuật
        self.art_ontologies = {
            "schema": "https://schema.org/",
            "crm": "http://www.cidoc-crm.org/cidoc-crm/",
            "art": "http://schema.org/VisualArtwork#",
            "museum": "http://museum.org/ontology/"
        }
        
    def parse_artwork(self, artwork: Dict[str, str]) -> Dict[str, Any]:
        """Trích xuất thông tin ngữ nghĩa từ mô tả tác phẩm và trả về định dạng JSON-LD"""
        
        # Phân tích mô tả
        description = artwork.get("description", "")
        doc = self.nlp(description)
        
        # Trích xuất các yếu tố hình ảnh từ mô tả
        visual_elements = []
        for chunk in doc.noun_chunks:
            if chunk.root.dep_ in ["dobj", "pobj", "nsubj"] and not chunk.root.is_stop:
                visual_elements.append(chunk.text)
        
        # Trích xuất chỉ báo phong cách nghệ thuật
        style_keywords = ["style", "baroque", "rococo", "renaissance", "gothic", "realistic", 
                         "flemish", "italian", "french", "european", "american"]
        styles = []
        for token in doc:
            if token.text.lower() in style_keywords or token.lemma_.lower() in style_keywords:
                sent = token.sent.text
                styles.append(sent)
        
        # Trích xuất màu sắc
        color_keywords = ["red", "blue", "green", "yellow", "white", "black", 
                         "gold", "silver", "golden", "colorful", "pastel", "vibrant"]
        colors = []
        for token in doc:
            if token.text.lower() in color_keywords:
                colors.append(token.text.lower())
        
        # Xác định thời kỳ nghệ thuật từ năm tạo tác phẩm
        date = artwork.get("dateCreated", "")
        period_info = self._determine_art_period(date)
        
        # Trích xuất thông tin về vật liệu
        materials = [mat.strip() for mat in artwork.get("materials", "").split(",") if mat.strip()]
        
        # Tạo JSON-LD sử dụng schema.org và từ vựng tùy chỉnh cho nghệ thuật
        jsonld = {
            "@context": self.art_ontologies,
            "@type": "schema:VisualArtwork",
            "schema:name": artwork.get("title", ""),
            "schema:creator": {
                "@type": "schema:Person",
                "schema:name": artwork.get("creator", "")
            },
            "schema:dateCreated": date,
            "schema:material": materials,
            "schema:description": description,
            "art:medium": materials,
            "museum:visualElements": visual_elements,
            "museum:artStyle": styles,
            "museum:colors": colors,
            "museum:period": {
                "@type": "museum:ArtPeriod",
                "museum:periodName": period_info.get("period", ""),
                "museum:periodYears": period_info.get("years", ""),
                "schema:temporalCoverage": date
            }
        }
        
        # Thêm thông tin về chủ đề (subjects) nếu có thể trích xuất
        subjects = self._extract_subjects(doc)
        if subjects:
            jsonld["museum:subjects"] = subjects
        
        # Thêm thông tin về bố cục nếu có thể trích xuất
        composition = self._extract_composition(doc)
        if composition:
            jsonld["museum:composition"] = composition
        
        # Lưu trữ dữ liệu truyền thống trong một trường riêng cho tương thích ngược
        jsonld["_legacy"] = {
            "visual_elements": visual_elements,
            "style": styles,
            "colors": colors,
            "composition": composition if composition else [],
            "subjects": subjects,
            "materials": materials,
            "period": period_info
        }
            
        return jsonld
    
    def _determine_art_period(self, date_str: str) -> Dict[str, str]:
        """Xác định thời kỳ nghệ thuật dựa trên năm"""
        period_info = {"period": "", "years": date_str}
        
        try:
            # Trích xuất năm
            years = []
            for part in date_str.replace("c. ", "").replace("ca. ", "").split("/"):
                for subpart in part.split("-"):
                    if subpart.strip().isdigit():
                        years.append(int(subpart.strip()))
            
            if years:
                middle_year = sum(years) // len(years)
                
                # Xác định thời kỳ dựa trên năm trung bình
                if 1300 <= middle_year <= 1550:
                    period_info["period"] = "Renaissance"
                elif 1550 <= middle_year <= 1670:
                    period_info["period"] = "Baroque"
                elif 1670 <= middle_year <= 1770:
                    period_info["period"] = "Rococo"
                elif 1770 <= middle_year <= 1850:
                    period_info["period"] = "Neoclassicism"
                elif 1850 <= middle_year <= 1900:
                    period_info["period"] = "Late 19th Century"
                elif 1900 <= middle_year <= 1945:
                    period_info["period"] = "Early Modern"
                elif 1945 <= middle_year <= 2000:
                    period_info["period"] = "Modern"
                elif 2000 <= middle_year:
                    period_info["period"] = "Contemporary"
                else:
                    period_info["period"] = "Pre-Renaissance"
        except Exception:
            pass
            
        return period_info
    
    def _extract_subjects(self, doc) -> List[str]:
        """Trích xuất chủ đề từ mô tả"""
        subjects = []
        subject_keywords = ["portrait", "landscape", "still life", "religious", "historical",
                         "mythology", "figure", "scene", "nature", "interior"]
        
        for keyword in subject_keywords:
            if keyword in doc.text.lower():
                subjects.append(keyword)
                
        return subjects
    
    def _extract_composition(self, doc) -> List[str]:
        """Trích xuất thông tin về bố cục từ mô tả"""
        composition = []
        comp_keywords = ["composition", "symmetrical", "asymmetrical", "balanced", 
                       "diagonal", "horizontal", "vertical", "dynamic", "static"]
        
        for token in doc:
            if token.text.lower() in comp_keywords or token.lemma_.lower() in comp_keywords:
                sent = token.sent.text
                composition.append(sent)
                
        return composition
    
    def enrich_from_external_sources(self, artwork: Dict[str, Any]) -> Dict[str, Any]:
        """Làm giàu dữ liệu từ các nguồn bên ngoài như WikiArt, WikiData, AAT, và Getty"""
        jsonld = self.parse_artwork(artwork)
        title = artwork.get("title", "")
        creator = artwork.get("creator", "")
        
        try:
            # Tìm kiếm trên WikiData
            wikidata_info = self._query_wikidata(title, creator)
            if wikidata_info:
                jsonld["owl:sameAs"] = wikidata_info.get("uri")
                if "movement" in wikidata_info:
                    jsonld["crm:P2_has_type"] = wikidata_info.get("movement")
            
            # Tìm kiếm thuật ngữ nghệ thuật từ Getty AAT
            materials = artwork.get("materials", "")
            aat_terms = self._query_getty_aat(materials)
            if aat_terms:
                jsonld["crm:P45_consists_of"] = aat_terms
        
        except Exception as e:
            print(f"Error enriching data: {str(e)}")
        
        return jsonld
        
    def _query_wikidata(self, title: str, creator: str) -> Dict[str, Any]:
        """Truy vấn WikiData để lấy thông tin liên quan"""
        try:
            # Đơn giản hóa: Thực tế sẽ cần SPARQL endpoint cho WikiData
            query_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={title} {creator}&language=en&format=json"
            response = requests.get(query_url)
            if response.status_code == 200:
                data = response.json()
                if data.get("search"):
                    first_result = data["search"][0]
                    result = {
                        "uri": f"http://www.wikidata.org/entity/{first_result['id']}",
                        "label": first_result.get("label", "")
                    }
                    return result
        except:
            pass
        return {}
    
    def _query_getty_aat(self, term: str) -> List[Dict[str, str]]:
        """Truy vấn Getty Art & Architecture Thesaurus (AAT)"""
        try:
            # Đơn giản hóa: Thực tế sẽ cần query SPARQL endpoint của Getty
            query_url = f"http://vocabsservices.getty.edu/AATService.asmx/AATGetTermMatch?term={term}&logop=and&notes="
            response = requests.get(query_url)
            if response.status_code == 200:
                # Parse XML response - đây là giả lập kết quả
                return [{
                    "uri": f"http://vocab.getty.edu/aat/term/{term.lower().replace(' ', '_')}",
                    "label": term
                }]
        except:
            pass
        return []
    
    def export_jsonld(self, jsonld: Dict[str, Any]) -> str:
        """Xuất dữ liệu semantic dưới dạng chuỗi JSON-LD"""
        return json.dumps(jsonld, indent=2, ensure_ascii=False)
    
    def save_jsonld_file(self, jsonld: Dict[str, Any], file_path: str) -> None:
        """Lưu dữ liệu semantic vào file JSON-LD"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(jsonld, f, indent=2, ensure_ascii=False)
            
    def convert_to_rdf(self, jsonld: Dict[str, Any]) -> Graph:
        """Chuyển đổi JSON-LD sang RDF Graph"""
        g = Graph()
        
        # Thêm prefixes
        for prefix, uri in jsonld.get("@context", {}).items():
            g.bind(prefix, uri)
            
        # Tạo URI cho artwork
        artwork_uri = URIRef(f"http://museum.org/artwork/{hash(jsonld.get('schema:name', ''))}")
        
        # Thêm loại
        g.add((artwork_uri, RDF.type, URIRef(jsonld.get("@type").replace("schema:", self.art_ontologies["schema"]))))
        
        # Thêm các thuộc tính cơ bản
        if "schema:name" in jsonld:
            g.add((artwork_uri, URIRef(self.art_ontologies["schema"] + "name"), Literal(jsonld["schema:name"])))
            
        if "schema:description" in jsonld:
            g.add((artwork_uri, URIRef(self.art_ontologies["schema"] + "description"), Literal(jsonld["schema:description"])))
            
        if "schema:dateCreated" in jsonld:
            g.add((artwork_uri, URIRef(self.art_ontologies["schema"] + "dateCreated"), Literal(jsonld["schema:dateCreated"])))
            
        # Xử lý creator
        if "schema:creator" in jsonld:
            creator_node = BNode()
            g.add((artwork_uri, URIRef(self.art_ontologies["schema"] + "creator"), creator_node))
            g.add((creator_node, RDF.type, URIRef(self.art_ontologies["schema"] + "Person")))
            g.add((creator_node, URIRef(self.art_ontologies["schema"] + "name"), Literal(jsonld["schema:creator"]["schema:name"])))
            
        # Xử lý materials
        for material in jsonld.get("schema:material", []):
            g.add((artwork_uri, URIRef(self.art_ontologies["schema"] + "material"), Literal(material)))
            
        # Xử lý đặc trưng museum
        for element in jsonld.get("museum:visualElements", []):
            g.add((artwork_uri, URIRef(self.art_ontologies["museum"] + "visualElements"), Literal(element)))
            
        for style in jsonld.get("museum:artStyle", []):
            g.add((artwork_uri, URIRef(self.art_ontologies["museum"] + "artStyle"), Literal(style)))
            
        for color in jsonld.get("museum:colors", []):
            g.add((artwork_uri, URIRef(self.art_ontologies["museum"] + "colors"), Literal(color)))
            
        return g