import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Home from './components/Home.jsx';
import Content from './components/Content.jsx';
import Gallery from './components/Gallery.jsx';
import Marketplace from './components/Marketplace';
import NFTs from './components/NFTs';

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content" element={<Content />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/marketplace" element={<Marketplace />} /> {/* Thêm route */}
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;