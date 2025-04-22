import React from 'react';

export default function NewsList({ newsItems, onSelect }) {
  return (
    <div className="news-list">
      {newsItems.map(item => (
        <div key={item.news_id} className="news-card">
          <h4 onClick={() => onSelect(item.news_id)}>{item.title}</h4>
          <p onClick={() => onSelect(item.news_id)}>{item.description}</p>
          {item.imageSrc && (
            <div className="image-preview">
              {item.imageSrc && (
                <a
                    href={item.imageSrc}
                    download={`news_${item.news_id}.jpg`}
                    style={{ display: 'block', marginTop: '0.5rem' }}
                >
                    ⬇️ Tải ảnh về
                </a>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}