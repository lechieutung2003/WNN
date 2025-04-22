import React, { useState } from 'react';
import StoryModal from './StoryModal';

export default function Header() {
  const [showGuide, setShowGuide] = useState(false);
  const [showStory, setShowStory] = useState(false);

  return (
    <header className="header">
      <div className="guide" onClick={() => setShowGuide(g => !g)}>
        Hướng dẫn
        {showGuide && (
          <div className="guide-box">
            <p>Nhấn vào tiêu đề hoặc mô tả để xem ảnh.</p>
          </div>
        )}
      </div>
      <div className="menu">
        <span className="three-dots" onClick={() => setShowStory(true)}>⋮</span>
      </div>
      {showStory && <StoryModal onClose={() => setShowStory(false)} />}
    </header>
  );
}