from flask import Blueprint, request, jsonify
from .SemanticParser import SemanticParser
from .PromptBuilder import PromptBuilder
from .LinkBuilder import LinkBuilder
from .KnowledgeManager import KnowledgeManager
import os

semantic_api = Blueprint('semantic', __name__)
parser = SemanticParser()
prompt_builder = PromptBuilder()
link_builder = LinkBuilder()
knowledge = KnowledgeManager(os.path.join(os.path.dirname(__file__), "knowledge.json"))

@semantic_api.route('/analyze', methods=['POST'])
def analyze_artwork():
    """Phân tích tác phẩm nghệ thuật"""
    try:
        data = request.json
        semantic_data = parser.parse_artwork(data)
        
        return jsonify({
            "success": True,
            "data": semantic_data
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@semantic_api.route('/enrich', methods=['POST'])
def enrich_artwork():
    """Làm giàu dữ liệu với nguồn bên ngoài"""
    try:
        data = request.json
        enriched = None
        
        # Thử sử dụng SemanticParser trước
        try:
            enriched = parser.enrich_from_external_sources(data)
        except:
            # Thử sử dụng LinkBuilder nếu SemanticParser thất bại
            semantic_data = parser.parse_artwork(data)
            enriched = link_builder.enrich_artwork(semantic_data)
        
        return jsonify({
            "success": True,
            "data": enriched
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@semantic_api.route('/build-prompt', methods=['POST'])
def build_prompt():
    """Xây dựng prompt cho model AI sinh ảnh"""
    try:
        data = request.json
        result = prompt_builder.build_prompt(data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@semantic_api.route('/store', methods=['POST'])
def store_artwork():
    """Lưu thông tin tác phẩm vào knowledge base"""
    try:
        data = request.json
        # Nếu dữ liệu chưa được phân tích, thực hiện phân tích
        if "@context" not in data:
            data = parser.parse_artwork(data)
        
        artwork_id = knowledge.add_artwork(data)
        
        return jsonify({
            "success": True,
            "artwork_id": artwork_id
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@semantic_api.route('/similar/<artwork_id>', methods=['GET'])
def find_similar(artwork_id):
    """Tìm tác phẩm tương tự"""
    try:
        similar = knowledge.find_similar(artwork_id)
        
        return jsonify({
            "success": True,
            "similar": similar
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@semantic_api.route('/search', methods=['GET'])
def search_artworks():
    """Tìm kiếm tác phẩm dựa trên từ khóa"""
    try:
        query = request.args.get('q', '')
        results = knowledge.search_artworks(query)
        
        return jsonify({
            "success": True,
            "results": results
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500