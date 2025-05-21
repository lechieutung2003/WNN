import spacy
from typing import Dict, List, Any

class SemanticParser:
    def __init__(self):
        # Load NLP model cho phân tích ngữ nghĩa
        self.nlp = spacy.load("en_core_web_md")
        
    def parse_artwork(self, artwork: Dict[str, str]) -> Dict[str, Any]:
        """Trích xuất thông tin ngữ nghĩa từ mô tả tác phẩm"""
        semantic_data = {
            "visual_elements": [],
            "style": [],
            "colors": [],
            "composition": [],
            "subjects": [],
            "materials": [],
            "period": {}
        }
        
        # Phân tích mô tả
        doc = self.nlp(artwork.get("description", ""))
        
        # Trích xuất các yếu tố hình ảnh (đối tượng) từ mô tả
        for chunk in doc.noun_chunks:
            if chunk.root.dep_ in ["dobj", "pobj", "nsubj"] and not chunk.root.is_stop:
                semantic_data["visual_elements"].append(chunk.text)
        
        # Trích xuất chỉ báo phong cách
        style_keywords = ["style", "baroque", "rococo", "renaissance", "gothic", "realistic"]
        for token in doc:
            if token.text.lower() in style_keywords or token.lemma_.lower() in style_keywords:
                sent = token.sent.text
                semantic_data["style"].append(sent)
        
        # Trích xuất thời kỳ từ dateCreated
        date = artwork.get("dateCreated", "")
        if date:
            semantic_data["period"]["date"] = date
            # Thêm logic để xác định thời kỳ nghệ thuật từ ngày

        # Trích xuất thông tin về vật liệu
        semantic_data["materials"] = artwork.get("materials", "").split(", ")
        
        return semantic_data