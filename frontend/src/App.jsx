import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx'
import Content from './components/Content.jsx'
import Gallery from './components/Gallery.jsx'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content" element={<Content />} />
          <Route path="/gallery" element={<Gallery />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;