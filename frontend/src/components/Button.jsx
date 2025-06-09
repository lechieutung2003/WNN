import React from 'react';
import '../styles/Button.scss';

const Button = ({ onClick, text = "ADD TO GALLERY", isAdded = false, disabled = false, isLoading = false }) => {
    const handleClick = (e) => {
        e.preventDefault();
        if (!disabled && !isAdded && !isLoading && onClick) {
            onClick();
        }
    };

    const getDisplayText = () => {
        if (isLoading) return "LOADING...";
        if (isAdded) return "ADDED";
        return text;
    };

    return (
        <div className="button-container">
            <a
                href="#"
                className={`button type--C ${isAdded ? "added" : ""} ${isLoading ? "loading" : ""}`}
                onClick={handleClick}
                style={{ 
                    pointerEvents: (disabled || isAdded || isLoading) ? 'none' : 'auto',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                <div className="button__line"></div>
                <div className="button__line"></div>
                <span className="button__text">
                    {getDisplayText()}
                </span>
                <div className="button__drow1"></div>
                <div className="button__drow2"></div>
            </a>
        </div>
    );
};

export default Button;