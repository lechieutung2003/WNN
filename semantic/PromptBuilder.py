from .SemanticParser import SemanticParser
from typing import Dict, Any, List, Optional

class PromptBuilder:
    def __init__(self):
        self.parser = SemanticParser()
        
    def build_prompt(self, artwork_data: Dict[str, Any]) -> Dict[str, Any]:
        """Xây dựng prompt ngắn gọn để sinh ảnh theo phong cách 3D, đảm bảo dưới 77 tokens"""
        try:
            # Phân tích dữ liệu ngữ nghĩa và làm giàu từ nguồn bên ngoài nếu có thể
            try:
                semantic_data = self.parser.enrich_from_external_sources(artwork_data)
                # Trích xuất _legacy data để tương thích ngược với code cũ
                legacy_data = semantic_data.get("_legacy", {})
            except Exception as e:
                print(f"Lỗi khi làm phong phú dữ liệu: {str(e)}")
                # Fallback: sử dụng parse_artwork đơn giản nếu làm giàu thất bại
                semantic_data = self.parser.parse_artwork(artwork_data)
                legacy_data = semantic_data.get("_legacy", {})

            # Tạo prompt chi tiết nhưng ngắn gọn
            prompt_parts = []
            
            # Thêm tiêu đề và tác giả với chỉ định 3D - phần quan trọng nhất
            title = artwork_data.get("title", "Artwork")
            # Rút gọn tiêu đề nếu quá dài
            if len(title) > 30:
                title = title[:27] + "..."
                
            creator = artwork_data.get("creator", "Unknown artist")
            # Chỉ lấy tên chính của tác giả, không lấy thông tin trong ngoặc
            if "(" in creator:
                creator = creator.split("(")[0].strip()
            # Giới hạn độ dài tên tác giả
            if len(creator) > 20:
                creator = creator.split()[0] + " " + creator.split()[1] if len(creator.split()) > 1 else creator.split()[0]
                
            prompt_parts.append(f"3D rendering of '{title}' by {creator}")
            
            # Thêm vật liệu nếu có
            materials = []
            if "schema:material" in semantic_data:
                materials = semantic_data["schema:material"]
            elif legacy_data.get("materials"):
                materials = legacy_data["materials"]
            elif artwork_data.get("materials"):
                materials = artwork_data.get("materials").split(',')
                
            if materials and isinstance(materials, list) and len(materials) > 0:
                material = materials[0]
                if len(material) < 15:
                    prompt_parts.append(f"with {material} textures")
            
            # Thêm yếu tố hình ảnh
            visual_elements = []
            if "museum:visualElements" in semantic_data:
                visual_elements = semantic_data["museum:visualElements"]
            elif legacy_data.get("visual_elements"):
                visual_elements = legacy_data["visual_elements"]
            
            if visual_elements and len(prompt_parts) < 3 and len(visual_elements) > 0:
                element = visual_elements[0]
                if len(element) > 20:
                    element = element[:17] + "..."
                prompt_parts.append(f"featuring {element}")
            
            # Thêm phong cách
            style_keywords = ["Renaissance", "Baroque", "Gothic", "Rococo", "Neoclassical", "Modern", 
                             "Contemporary", "Flemish", "Italian", "French"]
            style_name = ""
            
            # Tìm phong cách từ nhiều nguồn
            art_styles = []
            if "museum:artStyle" in semantic_data:
                art_styles = semantic_data["museum:artStyle"]
            elif legacy_data.get("style"):
                art_styles = legacy_data["style"]
            
            if art_styles and len(prompt_parts) < 4:
                for style in art_styles:
                    for keyword in style_keywords:
                        if keyword.lower() in style.lower():
                            style_name = keyword
                            break
                    if style_name:
                        break
                
                if style_name:
                    prompt_parts.append(f"in {style_name} style")
            
            # Thêm thời kỳ nếu chưa có phong cách
            if not style_name:
                period_name = ""
                if "museum:period" in semantic_data and isinstance(semantic_data["museum:period"], dict):
                    period_name = semantic_data["museum:period"].get("museum:periodName", "")
                elif legacy_data.get("period", {}).get("period"):
                    period_name = legacy_data["period"]["period"]
                
                if period_name and len(prompt_parts) < 4:
                    prompt_parts.append(f"in {period_name} style")
            
            # Thêm màu sắc
            colors = []
            if "museum:colors" in semantic_data:
                colors = semantic_data["museum:colors"]
            elif legacy_data.get("colors"):
                colors = legacy_data["colors"]
                
            if colors and len(prompt_parts) < 5 and len(colors) > 0:
                prompt_parts.append(f"with {colors[0]} tones")
            
            # Thêm các hiệu ứng 3D cần thiết
            prompt_parts.append("3D, detailed, realistic lighting")
            
            # Kết hợp thành prompt cuối cùng
            final_prompt = ", ".join(prompt_parts)
            
            # Đảm bảo prompt không quá dài
            if len(final_prompt.split()) > 60:  # Con số an toàn để đảm bảo dưới 77 tokens
                words = final_prompt.split()
                final_prompt = " ".join(words[:55]) + "..."
            
            # Tìm các tác phẩm liên quan (từ cùng tác giả, cùng thời kỳ hoặc phong cách)
            related_artworks = self._find_related_artworks(semantic_data)
            
            # Trả về kết quả với cả dữ liệu semantic mới và tương thích ngược
            return {
                "success": True,
                "prompt": final_prompt,
                "semantic_data": legacy_data,  # Đảm bảo tương thích ngược
                "semantic_jsonld": semantic_data,  # Dữ liệu JSON-LD mới
                "related_artworks": related_artworks,
                "additional_context": {
                    "render_style": "3D",
                    "technique": "digital 3D rendering", 
                    "medium": "digital art",
                    "resources": self._get_external_resources(semantic_data)
                }
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_external_resources(self, jsonld_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Trả về danh sách các URL tài nguyên liên quan từ dữ liệu làm giàu"""
        resources = []
        
        # Thêm tham chiếu đến WikiData nếu có
        if "owl:sameAs" in jsonld_data:
            resources.append({
                "type": "wikidata",
                "url": jsonld_data["owl:sameAs"],
                "label": "View on WikiData"
            })
        
        # Thêm tham chiếu đến Getty AAT nếu có
        if "crm:P45_consists_of" in jsonld_data:
            for term in jsonld_data["crm:P45_consists_of"]:
                if isinstance(term, dict) and "uri" in term:
                    resources.append({
                        "type": "getty_aat",
                        "url": term["uri"],
                        "label": f"Getty AAT: {term.get('label', '')}"
                    })
        
        return resources
        
    def _find_related_artworks(self, jsonld_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Mô phỏng tìm các tác phẩm liên quan dựa trên dữ liệu ngữ nghĩa"""
        # Đây là một giả lập - trong thực tế sẽ truy vấn database hoặc API
        period = ""
        creator = ""
        
        if "museum:period" in jsonld_data and isinstance(jsonld_data["museum:period"], dict):
            period = jsonld_data["museum:period"].get("museum:periodName", "")
        elif "schema:creator" in jsonld_data and isinstance(jsonld_data["schema:creator"], dict):
            creator = jsonld_data["schema:creator"].get("schema:name", "")
        
        # Giả lập kết quả - thực tế sẽ dựa trên SPARQL hoặc truy vấn database
        related = [
            {"title": f"Similar work by {creator}", "id": "123", "thumbnail": "/images/related1.jpg"},
            {"title": f"Another {period} artwork", "id": "456", "thumbnail": "/images/related2.jpg"}
        ]
        
        return related
    
    @classmethod
    def build_generation_prompt(cls, artwork_title: str) -> Dict[str, Any]:
        """Phương thức để tạo prompt từ tên tác phẩm"""
        builder = cls()
        mock_artwork = {
            "title": artwork_title,
            "creator": "Unknown artist",
            "materials": "Mixed media",
            "description": f"A detailed rendering of {artwork_title}"
        }
        
        result = builder.build_prompt(mock_artwork)
        return result