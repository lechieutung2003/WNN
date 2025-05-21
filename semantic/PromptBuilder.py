from .SemanticParser import SemanticParser
from typing import Dict, Any

class PromptBuilder:
    def __init__(self):
        self.parser = SemanticParser()
        
    def build_prompt(self, artwork_data: Dict[str, Any]) -> Dict[str, Any]:
        """Xây dựng prompt ngắn gọn để sinh ảnh theo phong cách 3D, đảm bảo dưới 77 tokens"""
        try:
            # Phân tích dữ liệu ngữ nghĩa
            semantic_data = self.parser.parse_artwork(artwork_data)
            
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
            
            # Chỉ thêm vật liệu nếu còn dư token
            materials = semantic_data["materials"][0] if semantic_data["materials"] else ""
            if materials and len(materials) < 15:
                prompt_parts.append(f"with {materials} textures")
            
            # Chỉ thêm 1-2 yếu tố hình ảnh quan trọng nhất
            if semantic_data["visual_elements"] and len(prompt_parts) < 3:
                # Chỉ lấy yếu tố đầu tiên và giới hạn độ dài
                element = semantic_data["visual_elements"][0]
                if len(element) > 20:
                    element = element[:17] + "..."
                prompt_parts.append(f"featuring {element}")
            
            # Thêm phong cách nếu có và ngắn gọn
            if semantic_data["style"] and len(prompt_parts) < 4:
                style_name = ""
                for style in semantic_data["style"]:
                    # Tìm các từ khóa phong cách phổ biến
                    keywords = ["Renaissance", "Baroque", "Gothic", "Rococo", "Neoclassical", "Modern"]
                    for keyword in keywords:
                        if keyword.lower() in style.lower():
                            style_name = keyword
                            break
                    if style_name:
                        break
                
                if style_name:
                    prompt_parts.append(f"in {style_name} style")
            
            # Thêm các hiệu ứng 3D cần thiết, nhưng ngắn gọn
            prompt_parts.append("3D, detailed, realistic lighting")
            
            # Kết hợp thành prompt cuối cùng
            final_prompt = ", ".join(prompt_parts)
            
            # Đảm bảo prompt không quá dài
            if len(final_prompt.split()) > 60:  # Con số an toàn để đảm bảo dưới 77 tokens
                # Cắt bớt prompt để đảm bảo đủ ngắn
                words = final_prompt.split()
                final_prompt = " ".join(words[:55]) + "..."
            
            # Thêm các trường missing field cho compatibility với process.py
            return {
                "success": True,
                "prompt": final_prompt,
                "semantic_data": semantic_data,
                "related_artworks": [],
                "additional_context": {
                    "render_style": "3D",
                    "technique": "digital 3D rendering",
                    "medium": "digital art"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
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