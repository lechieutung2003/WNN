// src/routes/index.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import NewsDetailPage from '../pages/NewsDetailPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/news/:newsId" element={<NewsDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;