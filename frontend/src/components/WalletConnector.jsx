import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import '../styles/WalletConnector.scss';

const WalletConnector = () => {
  const { 
    account, 
    isConnecting, 
    isSwitchingAccount,
    connectWallet, 
    disconnectWallet,
    switchAccount
  } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSwitchAccount = async () => {
    const success = await switchAccount();
    if (success) {
      setShowDropdown(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="wallet-connector">
      {account ? (
        <div className="wallet-connected">
          <div 
            className="connected-wallet" 
            onClick={toggleDropdown}
          >
            <span className="wallet-indicator"></span>
            <span className="wallet-address">{formatAddress(account)}</span>
            <span className="dropdown-icon">▼</span>
          </div>
          
          {showDropdown && (
            <div className="wallet-dropdown">
              <button 
                className={`dropdown-item switch-account ${isSwitchingAccount ? 'switching' : ''}`}
                onClick={handleSwitchAccount}
                disabled={isSwitchingAccount}
              >
                {isSwitchingAccount ? 'Đang chuyển...' : 'Chuyển tài khoản'}
              </button>
              <button 
                className="dropdown-item disconnect" 
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
              >
                Ngắt kết nối
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="connect-wallet-btn"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Đang kết nối...' : 'Kết nối ví'}
        </button>
      )}
    </div>
  );
};

export default WalletConnector;