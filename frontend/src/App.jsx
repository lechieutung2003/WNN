import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import NewsList from './components/Newslist';

export default function App() {
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    fetch('/news.json')
      .then(res => res.json())
      .then(data => setNewsItems(data));
  }, []);

  return (
    <div className="app-container">
      <Header />
      <NewsList newsItems={newsItems} setNewsItems={setNewsItems} />
    </div>
  );
}
