import React from 'react';
import '../styles/Home.scss';
import homeImage from '../assets/home1.png';
import home2 from '../assets/home2.png';
import home3 from '../assets/home3.png';
import home4 from '../assets/home4.png';
import home5 from '../assets/home5.png';

const Home = () => {
    const handleExploreClick = () => {
        window.location.href = '/content';
    }

    return (
        <div className="home">
            <div className="left-header">
                <p>CREATIVE</p>
            </div>
            <div className="right-header">
                <p>MUSEUM</p>
            </div>
            <div className="explore" onClick={handleExploreClick}>
                <button>Explore</button>
            </div>
            <img className="home1" src={homeImage} alt="Museum Background" />
            <div className="slide">
                {/* Slide track chứa danh sách ảnh được nhân đôi để tạo chuyển động liên tục */}
                <div className="slide-track">
                    <img className="slide-img" src={home2} alt="Museum Background" />
                    <img className="slide-img" src={home3} alt="Museum Background" />
                    <img className="slide-img" src={home4} alt="Museum Background" />
                    <img className="slide-img" src={home5} alt="Museum Background" />

                    {/* Nhân đôi */}
                    <img className="slide-img" src={home2} alt="Museum Background" />
                    <img className="slide-img" src={home3} alt="Museum Background" />
                    <img className="slide-img" src={home4} alt="Museum Background" />
                    <img className="slide-img" src={home5} alt="Museum Background" />
                </div>
            </div>
        </div>
    );
};

export default Home;