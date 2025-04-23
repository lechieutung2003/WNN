import React, { useState } from 'react';

const NewsList = ({ newsItems, setNewsItems }) => {
  const [loadingNewsId, setLoadingNewsId] = useState(null);

  const handleSelect = async (news_id) => {
    setLoadingNewsId(news_id);  // Cập nhật ID bài viết đang được tải
    try {
      const selectedItem = newsItems.find(item => item.news_id === news_id);

      const res = await fetch('http://localhost:5000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news_id: selectedItem.news_id,
          title: selectedItem.title,
          description: selectedItem.description
        })
      });

      const result = await res.json();

      if (result.image) {
        // Giải mã base64 và tạo URL cho ảnh
        const imgSrc = `data:image/jpeg;base64,${result.image}`;
        // Cập nhật lại state của newsItems để hiển thị ảnh
        setNewsItems(items => items.map(item =>
          item.news_id === news_id ? { ...item, imageSrc: imgSrc } : item
        ));
      } else {
        console.warn('Không có ảnh trả về:', result);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API /process:', err);
    } finally {
      setLoadingNewsId(null);  // Sau khi hoàn thành, reset trạng thái loading
    }
  };

  return (
    <div className="news-list">
      {newsItems.map(item => (
        <div key={item.news_id} className="news-card">
          <h4 onClick={() => handleSelect(item.news_id)}>
            {item.title} {loadingNewsId === item.news_id && '⏳'}
          </h4>
          <p onClick={() => handleSelect(item.news_id)}>{item.description}</p>
          {item.imageSrc && (
            <div className="image-preview">
              <img src={item.imageSrc} alt="Preview" width="200" />
              <a
                href={item.imageSrc}
                download={`news_${item.news_id}.jpg`}
                style={{ display: 'block', marginTop: '0.5rem'}}
              >
                ⬇️ Tải ảnh về
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NewsList;
