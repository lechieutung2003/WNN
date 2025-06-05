from flask import Flask, request, jsonify, send_from_directory
import requests
import sys
import json
from flask_cors import CORS
import traceback
import base64
import os

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from semantic.PromptBuilder import PromptBuilder

# from blockchain.nft_storage import NFTStorage
# APInft_KEY = "60bee204.c05e614a42214e0e9ef1a8cbe82bf05a"
# nft_storage = NFTStorage(APInft_KEY)

from blockchain.pinata_storage import PinataStorage
PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YmJkZTAxNy0zMTMyLTRiODAtOTI0MS1lZjkzNTI4YjA3ZDUiLCJlbWFpbCI6ImxlY2hpZXV0dW5nMjAwM0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTUyNDMxZjY1MjkyYWQ1YzIyM2YiLCJzY29wZWRLZXlTZWNyZXQiOiJlODZmNTZhZTQ1ZDhlMGU3MDYxZTZiMjk4Y2NmYmU5NDliMzkwYzJmNDhkMTUwZjBjZWQzYTZiY2I2NjNhMTJmIiwiZXhwIjoxNzgwNTk3OTg4fQ.Zcpqt-k0e-irkbJvAxON4fBM72QYOxtCF3R4DMiHXa4"
storage_client = PinataStorage(jwt=PINATA_JWT)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Đường dẫn cho thư mục lưu ảnh và dữ liệu
GENERATED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "generated")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "data")
GALLERY_PATH = os.path.join(DATA_DIR, "gallery.json")

# URL của API Stable Diffusion đang chạy trên Colab
STABLE_DIFFUSION_API = "https://870c-35-189-186-49.ngrok-free.app/execute"

# Đảm bảo các thư mục tồn tại
os.makedirs(GENERATED_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Tạo file gallery.json nếu không tồn tại
if not os.path.exists(GALLERY_PATH):
    with open(GALLERY_PATH, 'w', encoding='utf-8') as f:
        json.dump([], f)

@app.route('/process', methods=['POST'])
def process_request():
    try:
        data = request.json
        title = data.get("title", "")
        creator = data.get("creator", "")
        date_created = data.get("dateCreated", "")
        materials = data.get("materials", "")
        description = data.get("description", "")
        
        # Create artwork data dictionary
        artwork_data = {
            "title": title,
            "creator": creator,
            "dateCreated": date_created,
            "materials": materials,
            "description": description
        }
        
        # Use PromptBuilder to generate enriched prompt
        prompt_builder = PromptBuilder()
        prompt_data = prompt_builder.build_prompt(artwork_data)
        
        # Lấy prompt đã được làm giàu
        enriched_prompt = prompt_data["prompt"] if prompt_data["success"] else f"Generate an image of {title}"
        
        # enriched_prompt = "A highly detailed 3D rendering of the 'Bust of a Man' inspired by Donatello's Renaissance style. The sculpture features a painted terracotta texture, realistic facial features, and lifelike lighting. Emphasis on intricate craftsmanship, period-accurate details, and a dramatic yet natural light source that highlights the contours and expressions of the bust. Realistic and immersive presentation."
        print(enriched_prompt)
        
        # Gửi prompt đến Stable Diffusion API trên Colab
        response = requests.post(
            STABLE_DIFFUSION_API,
            json={"prompt": enriched_prompt},
            timeout=60
        )
        
        # Xử lý phản hồi từ Stable Diffusion API
        if response.status_code == 200:
            sd_data = response.json()
            image_b64 = sd_data.get("image", "")
            # if sd_data.get("success"):
            #     # Sử dụng ảnh trả về từ SD API
            #     image_b64 = sd_data.get("image", "")
            # else:
            #     # Nếu SD API không thành công, sử dụng ảnh mẫu
            #     print(f"SD API error: {sd_data.get('error')}")
            #     image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVRoge3BAQ0AAADCIPunNsc3YAAAAAAAAAAAADwDTbgAAShZbPkAAAAASUVORK5CYII="
        else:
            # Nếu không thể kết nối đến SD API, sử dụng ảnh mẫu
            print(f"Failed to connect to SD API. Status code: {response.status_code}")
            image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVRoge3BAQ0AAADCIPunNsc3YAAAAAAAAAAAADwDTbgAAShZbPkAAAAASUVORK5CYII="
        
        json_response = {
            "success": True,
            "prompt": enriched_prompt,
            "image": image_b64,
            "enriched_prompt": enriched_prompt,
            "semantic_data": prompt_data.get("semantic_data", {})
        }
        
        print(f"Generated response for: {title}")
        return jsonify(json_response)
    except requests.RequestException as e:
        print(f"Network error when calling SD API: {str(e)}")
        return jsonify({
            "success": False, 
            "error": f"Failed to connect to Stable Diffusion API: {str(e)}",
            "image": "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVRoge3BAQ0AAADCIPunNsc3YAAAAAAAAAAAADwDTbgAAShZbPkAAAAASUVORK5CYII="
        })
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/save-image', methods=['POST'])
def save_image():
    try:
        data = request.json
        base64_image = data.get('base64Image')
        filename = data.get('filename')
        title = data.get('title')
        
        if not base64_image or not filename or not title:
            return jsonify({"message": "Missing image, filename, or title"}), 400
            
        # Loại bỏ header base64
        base64_data = base64_image.replace('data:image/jpeg;base64,', '')
        base64_data = base64_data.replace('data:image/png;base64,', '')
        
        # Chuyển base64 thành binary
        image_data = base64.b64decode(base64_data)
        
        # Đường dẫn để lưu file
        image_path = f"generated/{filename}"
        file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", image_path)
        
        # Đảm bảo thư mục tồn tại
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Lưu file ảnh
        with open(file_path, 'wb') as f:
            f.write(image_data)
            
        # Cập nhật gallery.json
        gallery = []
        try:
            with open(GALLERY_PATH, 'r', encoding='utf-8') as f:
                gallery = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Gallery file error: {str(e)}")
            gallery = []
            
        # Thêm mục mới vào gallery
        gallery.append({"title": title, "imageUrl": image_path})
        
        # Đảm bảo thư mục data tồn tại
        os.makedirs(os.path.dirname(GALLERY_PATH), exist_ok=True)
        
        # Lưu gallery.json
        with open(GALLERY_PATH, 'w', encoding='utf-8') as f:
            json.dump(gallery, f, indent=2)
            
        print(f"Image saved successfully: {file_path}")
        return jsonify({"imageUrl": image_path})
    except Exception as e:
        import traceback
        print(f"Error saving image: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"message": f"Error saving image: {str(e)}"}), 500

@app.route('/update-status', methods=['POST'])
def update_status():
    try:
        data = request.json
        title = data.get('title')
        
        if not title:
            return jsonify({"message": "Missing title"}), 400
            
        # Đọc gallery.json
        try:
            with open(GALLERY_PATH, 'r', encoding='utf-8') as f:
                gallery = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return jsonify({"message": "Gallery not found or invalid format"}), 500
            
        # Tìm và cập nhật trạng thái
        index = next((i for i, item in enumerate(gallery) if item.get('title') == title), -1)
        
        if index == -1:
            return jsonify({"message": "Title not found in gallery"}), 404
            
        gallery[index]['status'] = 'added'
        
        # Lưu gallery.json
        with open(GALLERY_PATH, 'w', encoding='utf-8') as f:
            json.dump(gallery, f, indent=2)
            
        return jsonify({"message": "Status updated successfully"})
    except Exception as e:
        print(f"Error updating status: {str(e)}")
        return jsonify({"message": f"Error updating status: {str(e)}"}), 500

@app.route('/cancel-addition', methods=['POST'])
def cancel_addition():
    try:
        data = request.json
        title = data.get('title')
        
        if not title:
            return jsonify({"message": "Missing title"}), 400
            
        # Đọc gallery.json
        try:
            with open(GALLERY_PATH, 'r', encoding='utf-8') as f:
                gallery = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return jsonify({"message": "Gallery not found or invalid format"}), 500
            
        # Tìm và xóa item khỏi gallery với status 'added'
        updated_gallery = []
        removed = False
        
        for item in gallery:
            if item.get('title') == title and item.get('status') == 'added':
                # Loại bỏ status để đánh dấu là không còn trong gallery
                if 'status' in item:
                    del item['status']
                removed = True
            updated_gallery.append(item)
        
        # Nếu không có thay đổi, trả về lỗi
        if not removed:
            return jsonify({"message": "Title not found in gallery or not marked as added"}), 404
            
        # Lưu gallery.json
        with open(GALLERY_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_gallery, f, indent=2)
            
        return jsonify({"message": "Item removed from gallery successfully"})
        
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
    
@app.route('/api/images', methods=['GET'])
def get_gallery_images():
    try:
        # Đọc gallery.json
        with open(GALLERY_PATH, 'r', encoding='utf-8') as f:
            gallery = json.load(f)
            
        # Lọc ra các mục có status là 'added'
        images = [item for item in gallery if item.get('status') == 'added']
        
        return jsonify(images)
    except Exception as e:
        print(f"Error reading gallery: {str(e)}")
        return jsonify({"message": f"Error reading gallery: {str(e)}"}), 500

@app.route('/generated/<path:filename>')
def serve_image(filename):
    """Phục vụ file ảnh từ thư mục generated"""
    return send_from_directory(GENERATED_DIR, filename)

@app.route('/check', methods=['GET'])
def check_server():
    """Endpoint đơn giản để kiểm tra server có hoạt động không"""
    return jsonify({"status": "ok", "message": "Unified server is running"})

@app.route('/mint-nft', methods=['POST'])
def mint_nft():
    """Mint NFT từ hình ảnh trong gallery"""
    try:
        data = request.json
        title = data.get('title')
        address = data.get('address')  # Nhận địa chỉ ví từ request
        
        if not title:
            return jsonify({"success": False, "message": "Thiếu tiêu đề"}), 400
            
        # Tải gallery để tìm tác phẩm
        try:
            with open(GALLERY_PATH, 'r', encoding='utf-8') as f:
                gallery = json.load(f)
        except Exception as e:
            return jsonify({"success": False, "error": f"Không thể tải gallery: {str(e)}"}), 500
            
        # Tìm tác phẩm trong gallery
        artwork = next((item for item in gallery if item.get('title') == title), None)
            
        if not artwork:
            return jsonify({"success": False, "message": "Không tìm thấy tác phẩm"}), 404
        
        # Kiểm tra xem đã mint trước đó chưa
        if artwork.get('nft'):
            return jsonify({
                "success": True, 
                "message": "NFT đã được tạo trước đó", 
                "data": artwork['nft']
            }), 200
        
        # Lấy đường dẫn đầy đủ đến hình ảnh
        image_url = artwork.get('imageUrl', '')
        if not image_url:
            return jsonify({"success": False, "message": "Không tìm thấy URL hình ảnh"}), 400
        
        print(image_url)
        
        image_path = r"F:\WNN\WNN\DApp\frontend\public" + image_url
        
        print(f"Image path: {image_path}")
        
        if not os.path.exists(image_path):
            return jsonify({"success": False, "message": f"Không tìm thấy file hình ảnh tại {image_path}"}), 404
                
        # Tải lên IPFS qua Pinata
        metadata = {
            "title": artwork.get('title', 'Untitled'),
            "creator": artwork.get('creator', 'Unknown'),
            "dateCreated": artwork.get('dateCreated', ''),
            "materials": artwork.get('materials', ''),
            "description": artwork.get('description', '')
        }
        
        result = storage_client.upload_artwork(image_path, metadata)
        
        if not result.get('success'):
            error_msg = result.get('error', 'Unknown error')
            print(f"Error uploading to IPFS: {error_msg}")
            return jsonify({"success": False, "error": error_msg}), 500
            
        # Cập nhật gallery với metadata NFT và địa chỉ chủ sở hữu
        for i, item in enumerate(gallery):
            if item.get('title') == artwork.get('title'):
                gallery[i]['nft'] = {
                    'metadata_url': result.get('metadata_url'),
                    'gateway_url': result.get('gateway_url'),
                    'image_cid': result.get('image_cid'),
                    'metadata_cid': result.get('metadata_cid'),
                    'owner_address': address.lower() if address else None
                }
                break
        
        # Lưu gallery đã cập nhật
        with open(GALLERY_PATH, 'w', encoding='utf-8') as f:
            json.dump(gallery, f, indent=2)
            
        return jsonify({
            "success": True,
            "message": "Metadata NFT đã được tạo thành công",
            "data": result,
            "address": address  # Trả về địa chỉ để frontend xử lý
        })
        
    except Exception as e:
        print(f"Error in /mint-nft endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/test-pinata', methods=['GET'])
def test_pinata():
    """Kiểm tra kết nối với Pinata"""
    try:
        # Tạo file test
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as temp:
            temp.write(b"This is a test file for Pinata")
            test_file = temp.name
        
        print(f"Created test file: {test_file}")
        
        # Test upload
        result = storage_client.upload_artwork(test_file, {
            "title": "Test File",
            "creator": "WNN Test System",
            "description": "Test file to verify Pinata integration"
        })
        
        # Xóa file test
        import os
        os.unlink(test_file)
        
        return jsonify({
            "success": True,
            "jwt_preview": f"{PINATA_JWT[:10]}...{PINATA_JWT[-10:]}" if PINATA_JWT else "Using API key/secret",
            "result": result
        })
    except Exception as e:
        import traceback
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("Starting unified Flask server on port 5000...")
    try:
        app.run(debug=True, port=5000)
    except Exception as e:
        print(f"Error starting server: {str(e)}")