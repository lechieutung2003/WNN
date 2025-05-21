import React, { useState } from 'react';
import '../styles/Button.scss';

const Button = ({ onClick }) => {
    const [added, setAdded] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        if (!added) {
            // Xác nhận đã được thực hiện trong Content.jsx, nên chỉ chuyển trạng thái ở đây
            setAdded(true);
            if(onClick) {
                onClick();
            }
        }
    };

    return (
        <div className="button-container">
            <a
                href="#"
                className={`button type--C ${added ? "added" : ""}`}
                onClick={handleClick}
            >
                <div className="button__line"></div>
                <div className="button__line"></div>
                <span className="button__text">
                    {added ? "ADDED" : "ADD TO GALLERY"}
                </span>
                <div className="button__drow1"></div>
                <div className="button__drow2"></div>
            </a>
        </div>
    );
};

export default Button;