import os
import json
import time
import base64
import tempfile
import traceback
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sys
import requests

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

@app.route('/mint-nft-direct', methods=['POST'])
def mint_nft_direct():
    """
    Mint NFT trực tiếp từ ảnh được tạo - Thay thế chức năng Add to Gallery
    - Upload ảnh lên IPFS
    - Tạo metadata NFT
    - Trả về thông tin để frontend mint trên blockchain
    """
    try:
        data = request.json
        title = data.get('title')
        image_data = data.get('imageData')  # Base64 image data
        address = data.get('address')
        description = data.get('description', '')
        
        if not title or not image_data or not address:
            return jsonify({
                "success": False, 
                "message": "Thiếu thông tin: title, imageData, hoặc address"
            }), 400
        
        print(f"Starting direct NFT mint for: {title}")
        
        # 1. Tạo file ảnh tạm thời từ base64
        try:
            # Loại bỏ phần header "data:image/...;base64,"
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Tạo tên file unique
            timestamp = int(time.time())
            filename = f"{title.replace(' ', '_').replace('/', '_')}_{timestamp}.jpg"
            
            # Tạo file tạm
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            temp_file.write(image_bytes)
            temp_file.close()
            temp_path = temp_file.name
            
            print(f"Created temporary image file: {temp_path}")
            
        except Exception as e:
            return jsonify({
                "success": False, 
                "error": f"Lỗi xử lý ảnh: {str(e)}"
            }), 400
        
        # 2. Upload lên IPFS
        try:
            metadata = {
                "title": title,
                "creator": "AI Generated",
                "dateCreated": datetime.now().isoformat(),
                "description": description or f"AI-generated artwork: {title}",
                "materials": "Digital Art",
                "type": "NFT",
                "chain": "Ethereum"
            }
            
            print(f"Uploading to IPFS with metadata: {metadata}")
            result = storage_client.upload_artwork(temp_path, metadata)
            
            # Xóa file tạm
            try:
                os.unlink(temp_path)
            except:
                pass
            
            if not result.get('success'):
                return jsonify({
                    "success": False, 
                    "error": f"Lỗi upload IPFS: {result.get('error', 'Unknown error')}"
                }), 500
            
            print(f"IPFS upload successful: {result}")
            
        except Exception as e:
            # Cleanup file tạm nếu có lỗi
            try:
                os.unlink(temp_path)
            except:
                pass
            
            return jsonify({
                "success": False, 
                "error": f"Lỗi upload IPFS: {str(e)}"
            }), 500
        
        # 3. Trả về thông tin để frontend mint NFT
        return jsonify({
            "success": True,
            "message": "Upload IPFS thành công, sẵn sàng mint NFT",
            "data": {
                "metadata_url": result.get('metadata_url'),
                "gateway_url": result.get('gateway_url'),
                "image_cid": result.get('image_cid'),
                "metadata_cid": result.get('metadata_cid'),
                "title": title,
                "address": address
            }
        })
        
    except Exception as e:
        print(f"Error in mint_nft_direct: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/test-pinata', methods=['GET'])
def test_pinata():
    """Kiểm tra kết nối với Pinata"""
    try:
        # Tạo file test
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
        os.unlink(test_file)
        
        return jsonify({
            "success": True,
            "jwt_preview": f"{PINATA_JWT[:10]}...{PINATA_JWT[-10:]}" if PINATA_JWT else "Using API key/secret",
            "result": result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route('/check', methods=['GET'])
def check_server():
    """Endpoint để kiểm tra server hoạt động"""
    return jsonify({
        "status": "ok", 
        "message": "Web3 NFT Minting Server is running",
        "endpoints": {
            "/process": "Generate AI images",
            "/mint-nft-direct": "Upload to IPFS and prepare NFT metadata",
            "/test-pinata": "Test IPFS connection",
            "/check": "Health check"
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Kiểm tra kết nối Pinata
        pinata_status = "unknown"
        try:
            # Test đơn giản không upload file
            pinata_status = "connected" if PINATA_JWT else "no_jwt"
        except:
            pinata_status = "error"
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "stable_diffusion_api": STABLE_DIFFUSION_API,
                "pinata_ipfs": pinata_status,
                "server": "running"
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Web3 NFT Minting Server on port 5000...")
    print(f"📡 Stable Diffusion API: {STABLE_DIFFUSION_API}")
    print(f"🔗 IPFS Storage: Pinata")
    print("📋 Available endpoints:")
    print("   - POST /process: Generate AI images")
    print("   - POST /mint-nft-direct: Upload to IPFS and prepare NFT")
    print("   - GET /test-pinata: Test IPFS connection")
    print("   - GET /check: Health check")
    print("   - GET /health: Detailed health status")
    
    try:
        app.run(debug=True, port=5000, host='0.0.0.0')
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")