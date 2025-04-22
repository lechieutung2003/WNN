from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_request():
    data = request.get_json()
    # Tạo payload chỉ chứa title và description
    payload = {
        "news_id": data.get("news_id", ""),
        "title": data.get("title", ""),
        "description": data.get("description", "")
    }
    # Sử dụng endpoint /execute được public từ Colab (cập nhật URL phù hợp)
    colab_url = "https://358c-34-145-39-96.ngrok-free.app/execute"
    try:
        response = requests.post(colab_url, json=payload)
        response.raise_for_status()  # Kiểm tra lỗi HTTP
        try:
            json_response = response.json()
        except Exception as e:
            return jsonify({"error": "Không thể giải mã JSON trả về từ Colab", "response_text": response.text}), 500
        return jsonify(json_response)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Lỗi kết nối đến Colab", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)