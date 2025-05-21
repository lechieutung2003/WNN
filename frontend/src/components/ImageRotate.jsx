import React from 'react';
import '../styles/ImageRotate.scss';

const ImageRotate = () => {
  // Tạo mảng gồm 8 ảnh; ảnh được lưu trực tiếp trong thư mục public và được phục vụ từ root
  const images = Array.from({ length: 8 }, (_, index) => `/generated/artifact_${index}.jpg`);

  return (
    <div className="image-rotate">
      <div className="scope">
        {images.map((src, index) => (
          <span key={index} style={{ "--i": index + 1 }}>
            <img src={src} alt="not found" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default ImageRotate;