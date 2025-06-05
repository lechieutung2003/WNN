import React from 'react';
import '../styles/Navbar.scss';
import nav from '../assets/nav.png';
import WalletConnector from './WalletConnector';

const Navbar = () => {
  // Lấy đường dẫn hiện tại
  const currentPath = window.location.pathname;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="torn-paper">
          <img src={nav} alt="Navbar Background" className="navbar-background" />
        </div>
        <div className="menu-container">
          <ul className="menu-items">
            <li>
              <a
                href="/content"
                className={currentPath === '/content' ? 'active' : ''}
              >
                ARTWORK
              </a>
            </li>
            <li>
              <a
                href="/gallery"
                className={currentPath === '/gallery' ? 'active' : ''}
              >
                GALLERY
              </a>
            </li>
            <li>
              <a
                href="/marketplace"
                className={currentPath === '/marketplace' ? 'active' : ''}
              >
                MARKETPLACE
              </a>
            </li>
            <li>
              <a
                href="#about"
                className={currentPath === '#about' ? 'active' : ''}
              >
                ABOUT
              </a>
            </li>
          </ul>
        </div>
        <div className="wallet-section">
          <WalletConnector />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;