import requests
from typing import Dict, Any, List, Optional

class LinkBuilder:
    """Lớp đơn giản để liên kết với nguồn dữ liệu bên ngoài"""
    
    def enrich_artwork(self, artwork_data: Dict[str, Any]) -> Dict[str, Any]:
        """Làm giàu dữ liệu tác phẩm với nguồn bên ngoài"""
        jsonld = artwork_data.copy()
        
        # Thêm liên kết với WikiData
        title = jsonld.get("schema:name", "")
        creator = ""
        if "schema:creator" in jsonld:
            if isinstance(jsonld["schema:creator"], dict):
                creator = jsonld["schema:creator"].get("schema:name", "")
            else:
                creator = str(jsonld["schema:creator"])
        
        wikidata_link = self._find_on_wikidata(title, creator)
        if wikidata_link:
            jsonld["owl:sameAs"] = wikidata_link
        
        # Thêm liên kết đến Getty AAT cho vật liệu
        materials = jsonld.get("schema:material", [])
        if isinstance(materials, list) and len(materials) > 0:
            material_links = self._find_getty_terms(materials[0])
            if material_links:
                jsonld["crm:P45_consists_of"] = material_links
                
        # Thêm liên kết đến WikiArt
        wikiart_link = self._find_on_wikiart(title, creator)
        if wikiart_link:
            if "owl:sameAs" not in jsonld:
                jsonld["owl:sameAs"] = []
            elif isinstance(jsonld["owl:sameAs"], str):
                jsonld["owl:sameAs"] = [jsonld["owl:sameAs"]]
            jsonld["owl:sameAs"].append(wikiart_link)
            
        return jsonld
    
    def _find_on_wikidata(self, title: str, creator: str) -> str:
        """Tìm kiếm tác phẩm trên WikiData"""
        try:
            # URL tìm kiếm đơn giản
            url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={title} {creator}&language=en&format=json"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("search"):
                    return f"http://www.wikidata.org/entity/{data['search'][0]['id']}"
        except Exception as e:
            print(f"Error querying WikiData: {str(e)}")
        return ""
    
    def _find_getty_terms(self, material: str) -> List[Dict[str, str]]:
        """Tìm kiếm thuật ngữ vật liệu trên Getty AAT"""
        try:
            # Trong triển khai thực tế, sẽ gọi API của Getty thay vì giả lập
            return [{
                "uri": f"http://vocab.getty.edu/aat/term/{material.lower().replace(' ', '_')}",
                "label": material
            }]
        except Exception as e:
            print(f"Error querying Getty AAT: {str(e)}")
        return []
    
    def _find_on_wikiart(self, title: str, creator: str) -> str:
        """Tìm kiếm tác phẩm trên WikiArt"""
        try:
            # Giả lập - thực tế sẽ gọi API WikiArt
            creator_slug = creator.replace(" ", "-").lower()
            title_slug = title.replace(" ", "-").lower()
            return f"https://www.wikiart.org/en/{creator_slug}/{title_slug}"
        except Exception as e:
            print(f"Error querying WikiArt: {str(e)}")
        return ""