import requests
import base64
from PIL import Image
import io

def send_test_request():
    url = "http://127.0.0.1:5000/process"  # Địa chỉ của Flask app đang chạy
    payload = {
        "news_id": 1,
        "title": "Tổng Bí thư: 'Việt Nam đủ sức vượt qua thách thức'",
        "description": (
            "Tổng Bí thư Tô Lâm khẳng định trong bối cảnh căng thẳng "
            "thương mại và thuế quan gia tăng, Việt Nam có đủ năng lực "
            "để vượt qua thách thức, đảm bảo đời sống nhân dân và duy trì "
            "mục tiêu tăng trưởng kinh tế."
        )
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

        # Nếu chạy trong Jupyter Notebook, bạn có thể dùng:
        # from IPython.display import display
        # display(img)

    except requests.exceptions.RequestException as e:
        print("Error sending request:", e)
    except Exception as e:
        print("Error processing image:", e)

if __name__ == '__main__':
    send_test_request()
