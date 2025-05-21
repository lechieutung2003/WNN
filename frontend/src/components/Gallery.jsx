import React from 'react';
import '../styles/Gallery.scss';
import Navbar from './Navbar';
import ImageRotate from './ImageRotate';
import Card from './Card';

const Gallery = () => {
    return (
        <div className="wrapper">
            <Navbar />
            <ImageRotate />
            <Card />
        </div>
    );
};

export default Gallery;