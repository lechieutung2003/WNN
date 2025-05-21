import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import VR from '../components/VR_new.jsx';
import Content from '../components/Content';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<VR />} /> */}
        <Route path="/" element={<Content />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;