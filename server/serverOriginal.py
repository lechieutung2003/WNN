

import importlib.util
from flask import Flask, request, jsonify
from flask_ngrok import run_with_ngrok
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import io, base64

device = "cuda"
llm_model_name = "microsoft/Phi-3.5-mini-instruct" # Mục đích là đổi cho dễ

llm_model = AutoModelForCausalLM.from_pretrained(
  llm_model_name,
  torch_dtype=torch.bfloat16,
  device_map=device
)
tokenizer = AutoTokenizer.from_pretrained(llm_model_name)

"""# Setup Text 2 Image - stabilityai/stable-diffusion-xl-base-1.0"""

from diffusers import DiffusionPipeline
import torch

sd_model_name = "stabilityai/stable-diffusion-xl-base-1.0"
pipe = DiffusionPipeline.from_pretrained(
    sd_model_name,
    torch_dtype=torch.float16,
    use_safetensors=True,
    variant="fp16")

pipe.to(device)

"""# Generate prompt sinh ảnh cho các bài tin"""


def generate_prompt(text_input):
    prompt = ("Viết câu prompt bằng tiếng anh ngắn gọn bắt đầu bằng 'Create an illustration', "
              "không có tiếng việt trong prompt, để sinh ra ảnh minh hoạ bằng AI cho bài viết có nội dung sau đây:\n"
              + text_input)
    messages = [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": prompt}
    ]
    # Tạo chuỗi văn bản cho mô hình từ conversation trên
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(device)
    generated_ids = llm_model.generate(model_inputs.input_ids, attention_mask=model_inputs.attention_mask, max_new_tokens=200, do_sample=True, eos_token_id=tokenizer.eos_token_id)
    # Lấy phần output mới được sinh ra
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
    return response[0]

"""# Generate image từ prompt"""

def generate_image(prompt_text):
    image = pipe(prompt_text).images[0]
    return image

"""# Chuyển image sang base64"""

def image_to_base64(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return encoded

"""# Khởi tạo Flask app và public endpoint qua ngrok"""

# 1. Trước hết, nếu chạy trên Colab, cài đặt pyngrok:
# !

from flask import Flask, request, jsonify
from pyngrok import ngrok
import openai, base64, io
from PIL import Image

# --- CẤU HÌNH NGROK ---
# Thay YOUR_NGROK_AUTH_TOKEN bằng token của bạn (lấy từ dashboard ngrok.com)
ngrok.set_auth_token("2vrErhYLUk7W4SmsyUf1n7CtENF_6UihsHmsv7kc6Vy9JTEu6")
# Mở tunnel tới cổng 5000 (mặc định Flask chạy trên 5000)
public_url = ngrok.connect(5000)
print(f" * Ngrok tunnel URL: {public_url}")

# --- TẠO ỨNG DỤNG FLASK ---
app = Flask(__name__)
image_counter = 0

@app.route('/execute', methods=['POST'])
def execute():
    global image_counter
    data = request.get_json(force=True)
    news_id     = data.get("news_id", "")
    title       = data.get("title",     "")
    description = data.get("description","")

    text_input = f"{title}\n{description}"
    generated_prompt = generate_prompt(text_input)
    img = generate_image(generated_prompt)
    img_b64 = image_to_base64(img)

    image_counter += 1
    print(jsonify({
        "news_id": news_id,
        "image_id": image_counter,
        "generated_prompt": generated_prompt,
        "image": img_b64
    }))

    return jsonify({
        "news_id": news_id,
        "image_id": image_counter,
        "generated_prompt": generated_prompt,
        "image": img_b64
    })

if __name__ == '__main__':
    # Flask sẽ chạy sẵn trên port 5000, pyngrok đã mở tunnel trước đó
    app.run(port=5000)

# del llm_model
# del tokenizer
import torch
import gc

gc.collect()
torch.cuda.empty_cache()