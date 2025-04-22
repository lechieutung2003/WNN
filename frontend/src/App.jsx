import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import NewsList from './components/NewsList';

export default function App() {
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    fetch('/news.json')
      .then(res => res.json())
      .then(data => setNewsItems(data));
  }, []);

  // Handler when user clicks title/description
  const handleSelect = async (news_id) => {
    try {
      const res = await fetch(`/api/news/${news_id}/image`);
      const blob = await res.blob();
      // Create local URL for image
      const url = URL.createObjectURL(blob);
      // Update state: attach image URL to the corresponding item
      setNewsItems(items => items.map(item =>
        item.news_id === news_id ? { ...item, imageSrc: url } : item
      ));
    } catch (err) {
      console.error('Error fetching image:', err);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <NewsList newsItems={newsItems} onSelect={handleSelect} />
    </div>
  );
}