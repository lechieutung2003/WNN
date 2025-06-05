import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Web3Service from '../../services/Web3Service';

export const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const switchingTimeoutRef = useRef(null);

  // Kiểm tra trạng thái kết nối khi khởi động
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Kiểm tra nếu người dùng đã chủ động ngắt kết nối
        const userDisconnected = localStorage.getItem('walletDisconnected') === 'true';
        
        // Nếu đã ngắt kết nối, không tự động kết nối lại
        if (userDisconnected) {
          console.log("User previously disconnected wallet, not reconnecting");
          return;
        }
        
        // Thay đổi phương pháp kiểm tra kết nối để không tự kết nối
        if (window.ethereum) {
          // Chỉ kiểm tra xem có tài khoản đã được phê duyệt trước đó mà không tự động kết nối
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' // Không dùng eth_requestAccounts để tránh tự động kết nối
          });
          
          if (accounts && accounts.length > 0) {
            console.log("Đã có tài khoản được phê duyệt trước đó:", accounts[0]);
            setAccount(accounts[0]);
            localStorage.setItem('walletDisconnected', 'false');
          } else {
            console.log("Không có tài khoản nào được phê duyệt trước đó");
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra kết nối ví:", error);
      }
    };
    
    checkConnection();
    
    // Đăng ký lắng nghe sự kiện tài khoản thay đổi
    const handleAccountsChanged = (accounts) => {
      console.log("Tài khoản thay đổi:", accounts);
      if (accounts.length === 0) {
        setAccount(null);
        // Đánh dấu là đã ngắt kết nối
        localStorage.setItem('walletDisconnected', 'true');
      } else {
        setAccount(accounts[0]);
        // Reset trạng thái ngắt kết nối nếu có tài khoản mới
        localStorage.setItem('walletDisconnected', 'false');
      }

      // Reset trạng thái chuyển tài khoản sau khi nhận được sự kiện thay đổi tài khoản
      setIsSwitchingAccount(false);
      if (switchingTimeoutRef.current) {
        clearTimeout(switchingTimeoutRef.current);
        switchingTimeoutRef.current = null;
      }
    };
    
    // Thiết lập event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Lấy thông tin mạng hiện tại
      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => setNetwork(chainId))
        .catch(error => console.error("Lỗi lấy chainId:", error));
    }
    
    // Cleanup event listeners và timeouts khi component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      
      if (switchingTimeoutRef.current) {
        clearTimeout(switchingTimeoutRef.current);
      }
    };
  }, []);

  // Hàm kết nối ví
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await Web3Service.connectWallet();
      setAccount(address);
      // Đánh dấu là đã kết nối
      localStorage.setItem('walletDisconnected', 'false');
      return address;
    } catch (error) {
      console.error('Lỗi kết nối ví:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Hàm ngắt kết nối ví
  const disconnectWallet = () => {
    // Đặt state thành null
    setAccount(null);
    
    // Đánh dấu là đã ngắt kết nối trong localStorage
    localStorage.setItem('walletDisconnected', 'true');
    
    console.log("Wallet disconnected. Connection will not be restored on page reload.");
  };

  // Hàm chuyển đổi tài khoản với xử lý chống trùng lặp yêu cầu
  const switchAccount = async () => {
    // Kiểm tra nếu đang có yêu cầu chuyển tài khoản
    if (isSwitchingAccount) {
      console.log("Đã có yêu cầu chuyển tài khoản đang xử lý. Vui lòng đợi.");
      return false;
    }
    
    try {
      // Đánh dấu đang chuyển tài khoản
      setIsSwitchingAccount(true);
      
      // Gửi yêu cầu chuyển tài khoản đến MetaMask
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      return true;
    } catch (error) {
      console.error("Error switching account:", error);
      
      // Phân loại lỗi
      if (error && error.code === -32002) {
        console.log("Đã có yêu cầu đang chờ phản hồi từ người dùng, vui lòng kiểm tra MetaMask");
      }
      
      return false;
    } finally {
      // Đặt timeout để reset trạng thái sau một khoảng thời gian
      // Đây là biện pháp phòng ngừa trong trường hợp sự kiện accountsChanged không được kích hoạt
      if (switchingTimeoutRef.current) {
        clearTimeout(switchingTimeoutRef.current);
      }
      
      switchingTimeoutRef.current = setTimeout(() => {
        setIsSwitchingAccount(false);
        switchingTimeoutRef.current = null;
      }, 10000); // 10 giây là thời gian đủ dài để người dùng có thể tương tác với MetaMask
    }
  };

  // Value object cho context
  const value = {
    account,
    network,
    isConnecting,
    isSwitchingAccount,
    connectWallet,
    disconnectWallet,
    switchAccount,
    isConnected: !!account,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};