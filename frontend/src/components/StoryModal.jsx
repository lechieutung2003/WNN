import React from 'react';

export default function StoryModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Story hình ảnh</h3>
        <p>(Nơi hiển thị các câu chuyện ảnh theo thứ tự...)</p>
        <button onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}