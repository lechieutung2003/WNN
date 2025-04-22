import io
import base64
import gc
import torch
from flask import Flask, request, jsonify
from pyngrok import ngrok
from transformers import AutoModelForCausalLM, AutoTokenizer
from diffusers import DiffusionPipeline
from PIL import Image

# --- CẤU HÌNH CHUNG ---
device = "cuda" if torch.cuda.is_available() else "cpu"
print(device)

# --- CẤU HÌNH TEXT TO TEXT - Phi-3.5-mini-instruct ---
llm_model_path = ".\model_Phi-3.5-mini-instruct"  # <-- Đường dẫn thư mục mô hình local
llm_model = AutoModelForCausalLM.from_pretrained(
    llm_model_path,
    torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32,
    device_map="auto" if device == "cuda" else None
)
tokenizer = AutoTokenizer.from_pretrained(llm_model_path)

print("hello")

# --- CẤU HÌNH TEXT TO IMAGE - stabilityai/stable-diffusion-xl-base-1.0 ---
sd_model_name = "stabilityai/stable-diffusion-xl-base-1.0"
pipe = DiffusionPipeline.from_pretrained(
    sd_model_name,
    torch_dtype=torch.float16,
    use_safetensors=True,
    variant="fp16"
)
pipe.to(device)

# --- HÀM XỬ LÝ ---
def generate_prompt(text_input):
    prompt = (
        "Viết câu prompt bằng tiếng anh ngắn gọn bắt đầu bằng 'Create an illustration', "
        "không có tiếng việt trong prompt, để sinh ra ảnh minh hoạ bằng AI cho bài viết có nội dung sau đây:\n"
        + text_input
    )
    messages = [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": prompt}
    ]
    # Tạo chuỗi văn bản từ conversation
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(device)
    generated_ids = llm_model.generate(
        model_inputs.input_ids,
        attention_mask=model_inputs.attention_mask,
        max_new_tokens=200,
        do_sample=True,
        eos_token_id=tokenizer.eos_token_id
    )
    # Lấy phần output mới được sinh ra
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
    return response[0]

def generate_image(prompt_text):
    """Sinh ảnh từ prompt"""
    image = pipe(prompt_text).images[0]
    return image

def image_to_base64(image):
    """Chuyển đổi ảnh sang chuỗi base64"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return encoded

# --- CẤU HÌNH NGROK ---
# Thay "YOUR_NGROK_AUTH_TOKEN" bằng token của bạn từ dashboard ngrok.com
ngrok.set_auth_token("YOUR_NGROK_AUTH_TOKEN")
# Mở tunnel tới port 5000 (Flask mặc định chạy trên 5000)
public_url = ngrok.connect(5000)
print(f" * Ngrok tunnel URL: {public_url}")

# --- KHỞI TẠO FLASK APP ---
app = Flask(__name__)
image_counter = 0

@app.route('/execute', methods=['POST'])
def execute():
    global image_counter
    data = request.get_json(force=True)
    news_id = data.get("news_id", "")
    title = data.get("title", "")
    description = data.get("description", "")
    
    # Kết hợp title và description để tạo đầu vào
    text_input = f"{title}\n{description}"
    
    # Sinh prompt và ảnh theo thứ tự
    generated_prompt = generate_prompt(text_input)
    img = generate_image(generated_prompt)
    img_b64 = image_to_base64(img)
    
    image_counter += 1
    result = {
        "news_id": news_id,
        "image_id": image_counter,
        "generated_prompt": generated_prompt,
        "image": img_b64
    }
    print("Result:", result)
    return jsonify(result)

if __name__ == '__main__':
    # Chạy Flask trên port 5000; ngrok đã mở tunnel
    app.run(port=5000)
    # Giải phóng bộ nhớ
    del llm_model
    del tokenizer
    gc.collect()
    torch.cuda.empty_cache()