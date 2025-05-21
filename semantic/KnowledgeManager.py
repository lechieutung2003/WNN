import json
from typing import Dict, Any, List
import os

class KnowledgeManager:
    """Quản lý dữ liệu ngữ nghĩa đơn giản"""
    
    def __init__(self, storage_file: str = "knowledge.json"):
        self.storage_file = storage_file
        self.data = self._load_data()
    
    def _load_data(self) -> List[Dict[str, Any]]:
        """Tải dữ liệu từ file"""
        if os.path.exists(self.storage_file):
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _save_data(self):
        """Lưu dữ liệu vào file"""
        with open(self.storage_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2)
    
    def add_artwork(self, artwork_data: Dict[str, Any]):
        """Thêm tác phẩm vào kho dữ liệu"""
        # Tạo ID nếu chưa có
        if "@id" not in artwork_data:
            title = artwork_data.get("schema:name", "").replace(" ", "_")
            artwork_data["@id"] = f"artwork_{len(self.data) + 1}_{title}"
        
        self.data.append(artwork_data)
        self._save_data()
        return artwork_data["@id"]
    
    def find_similar(self, artwork_id: str) -> List[Dict[str, Any]]:
        """Tìm các tác phẩm tương tự (đơn giản)"""
        # Tìm tác phẩm hiện tại
        artwork = next((a for a in self.data if a.get("@id") == artwork_id), None)
        if not artwork:
            return []
        
        # Tìm các tác phẩm cùng tác giả hoặc cùng thời kỳ
        similar = []
        for other in self.data:
            if other.get("@id") != artwork_id:
                if other.get("schema:creator") == artwork.get("schema:creator"):
                    similar.append(other)
                elif "museum:period" in other and "museum:period" in artwork:
                    if isinstance(other["museum:period"], dict) and isinstance(artwork["museum:period"], dict):
                        if other["museum:period"].get("museum:periodName") == artwork["museum:period"].get("museum:periodName"):
                            similar.append(other)
        
        return similar[:5]  # Trả về tối đa 5 kết quả
    
    def get_artwork(self, artwork_id: str) -> Dict[str, Any]:
        """Lấy thông tin chi tiết của tác phẩm"""
        artwork = next((a for a in self.data if a.get("@id") == artwork_id), None)
        return artwork if artwork else {}
    
    def search_artworks(self, query: str) -> List[Dict[str, Any]]:
        """Tìm kiếm tác phẩm theo từ khóa"""
        query = query.lower()
        results = []
        
        for artwork in self.data:
            title = artwork.get("schema:name", "").lower()
            creator = ""
            if "schema:creator" in artwork:
                if isinstance(artwork["schema:creator"], dict):
                    creator = artwork["schema:creator"].get("schema:name", "").lower()
                else:
                    creator = str(artwork["schema:creator"]).lower()
                    
            description = artwork.get("schema:description", "").lower()
            
            if query in title or query in creator or query in description:
                results.append(artwork)
                
        return results