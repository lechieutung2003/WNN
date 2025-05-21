import requests
import base64
import io
from PIL import Image

def send_test_request():
    url = "http://127.0.0.1:5000/process"  # Địa chỉ của Flask app đang chạy
    payload = {
        "news_id": "1",
        "title": "Lovers in an Arbor",
        "creator": "",
        "dateCreated": "",
        "materials": "Oil on canvas",
        "description": "This painting depicts a courting couple in a lush garden setting. The woman, elegantly dressed, sits on a stone bench within a leafy arbor, while the man stands beside her, gesturing towards a bird perched on a branch. The scene evokes a sense of romantic intimacy and leisure, characteristic of Rococo sensibilities. The artist's attention to detail is evident in the rendering of the foliage, the textures of the clothing, and the delicate expressions of the figures."
    }

    try:
        # Gửi request
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print("Prompt used:", data.get("prompt"))
        
        # Giải mã Base64 thành bytes
        img_b64 = data.get("image", "")
        img_bytes = base64.b64decode(img_b64)

        # Đưa vào PIL và hiển thị
        img = Image.open(io.BytesIO(img_bytes))
        img.show()  # Trên desktop sẽ mở cửa sổ xem ảnh

    except requests.exceptions.RequestException as e:
        print("Error sending request:", e)
    except Exception as e:
        print("Error processing image:", e)

if __name__ == '__main__':
    send_test_request()
