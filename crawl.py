import requests
import json
from bs4 import BeautifulSoup

news_url = 'https://vnexpress.net/'

response = requests.get(news_url)
soup = BeautifulSoup(response.content, 'html.parser')

# Tìm các thẻ h3 lưu tiêu đề bài báo
news_headlines = soup.find_all("h3", {"class": "title-news"})

data = []  # Danh sách để lưu các bài báo với news_id, title và description

# Lưu dữ liệu vào trong list dict với news_id, title và description
for idx, headline in enumerate(news_headlines[:100], start=1):
    # Nếu có thẻ a bên trong, lấy text của thẻ a
    a_tag = headline.find("a")
    if a_tag:
        title = a_tag.text.strip()
    else:
        title = headline.text.strip()
    
    # Tìm description liên quan
    desc_tag = headline.find_next_sibling("p")
    if desc_tag:
        description = desc_tag.text.strip()
    else:
        description = "Không có description"
    
    data.append({"news_id": idx, "title": title, "description": description})

# Lưu dữ liệu vào file JSON
with open("news.json", "w", encoding="utf-8") as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)