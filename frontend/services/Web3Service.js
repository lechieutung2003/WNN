import { ethers } from 'ethers';
import ArtMuseumABI from '../../blockchain/artifacts/contracts/ArtMuseumNFT.sol/ArtMuseumNFT.json';
import contractAddress from '../../blockchain/contractAddress/address.json';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialized = false;
    this.contractAddress = contractAddress.ArtMuseumNFT;
    this.transferEventCallbacks = [];
    this.accountChangeCallbacks = [];  // Thêm khởi tạo mảng này
  }

  async initialize() {
    try {
      console.log("Đang khởi tạo Web3Service...");
      
      if (!window.ethereum) {
        console.error("MetaMask không được tìm thấy");
        return false;
      }
      
      // Sử dụng Web3Provider cho ethers v5
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Lấy signer (trong v5, getSigner() là synchronous)
      this.signer = this.provider.getSigner();
      
      // Khởi tạo contract
      this.contract = new ethers.Contract(
        this.contractAddress,
        ArtMuseumABI.abi,
        this.signer
      );
      
      this.initialized = true;
      console.log("Khởi tạo Web3Service thành công");
      return true;
    } catch (error) {
      console.error("Lỗi khi khởi tạo Web3Service:", error);
      this.initialized = false;
      return false;
    }
  }

  // Đăng ký theo dõi sự kiện Transfer
  async listenToTransferEvents() {
    if (!this.initialized) await this.initialize();
    
    // Tạo filter cho sự kiện Transfer
    const filter = this.contract.filters.Transfer();
    
    // Lắng nghe sự kiện
    this.contract.on(filter, (from, to, tokenId, event) => {
      console.log(`NFT #${tokenId} đã được chuyển từ ${from} đến ${to}`);
      
      // Gọi các callbacks đã đăng ký
      this.transferEventCallbacks.forEach(callback => {
        try {
          callback(from, to, tokenId, event);
        } catch (e) {
          console.error('Error in transfer event callback:', e);
        }
      });
    });
    
    console.log('Đang lắng nghe sự kiện Transfer');
  }

  // Dừng lắng nghe sự kiện Transfer
  stopListeningToTransferEvents() {
    if (this.contract) {
      this.contract.removeAllListeners();
      console.log('Đã dừng lắng nghe sự kiện');
    }
  }

  // Đăng ký callback cho sự kiện Transfer
  onTransferEvent(callback) {
    if (typeof callback === 'function') {
      this.transferEventCallbacks.push(callback);
    }
  }

  // Hủy đăng ký callback cho sự kiện Transfer
  offTransferEvent(callback) {
    this.transferEventCallbacks = this.transferEventCallbacks.filter(cb => cb !== callback);
  }

  checkMetaMaskAvailability() {
    if (window.ethereum) {
      console.log('MetaMask được phát hiện');
      
      // Lắng nghe sự kiện khi tài khoản thay đổi
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Tài khoản MetaMask đã thay đổi:', accounts);
        this.initialized = false; // Đánh dấu cần khởi tạo lại
        
        // Gọi các callbacks đã đăng ký
        this.accountChangeCallbacks.forEach(callback => {
          try {
            callback(accounts);
          } catch (e) {
            console.error('Error in account change callback:', e);
          }
        });
      });
      
      // Lắng nghe sự kiện khi mạng thay đổi
      window.ethereum.on('chainChanged', () => {
        console.log('Mạng blockchain đã thay đổi');
        this.initialized = false; // Đánh dấu cần khởi tạo lại
        
        // Reset contract và làm mới trang
        this.contract = null;
        this.provider = null;
        this.signer = null;
        window.location.reload(); // Reload trang là cách xử lý tốt nhất khi mạng thay đổi
      });
    } else {
      console.warn('MetaMask không được cài đặt');
    }
  }

  // Đăng ký callback khi tài khoản thay đổi
  onAccountChange(callback) {
    if (typeof callback === 'function') {
      this.accountChangeCallbacks.push(callback);
    }
  }

  // Hủy đăng ký callback
  offAccountChange(callback) {
    this.accountChangeCallbacks = this.accountChangeCallbacks.filter(cb => cb !== callback);
  }


  // Kết nối đến ví MetaMask
  async connectWallet() {
    console.log('Đang kết nối ví...');
    
    if (!window.ethereum) {
      throw new Error('Không thể kết nối ví. Vui lòng cài đặt MetaMask.');
    }
    
    try {
      // Yêu cầu người dùng cho phép kết nối
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('Không thể kết nối ví. Vui lòng cấp quyền truy cập.');
      }
      
      // Khởi tạo lại provider và signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Tạo lại instance của contract
      this.contract = new ethers.Contract(
        contractAddress.ArtMuseumNFT,
        ArtMuseumABI.abi,
        this.signer
      );
      
      this.initialized = true;
      console.log('Kết nối ví thành công:', accounts[0]);
      return accounts[0]; // Trả về địa chỉ ví người dùng
    } catch (error) {
      console.error('Lỗi khi kết nối ví:', error);
      throw new Error('Không thể kết nối ví: ' + (error.message || 'Lỗi không xác định'));
    }
  }

  // Kiểm tra kết nối ví
  async isWalletConnected() {
    try {
      // Kiểm tra nếu người dùng đã chủ động ngắt kết nối
      const userDisconnected = localStorage.getItem('walletDisconnected') === 'true';
      if (userDisconnected) {
        return false;
      }
      
      if (!window.ethereum) {
        return false;
      }
      
      // Chỉ kiểm tra tài khoản đã được phê duyệt, không yêu cầu kết nối mới
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts && accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  // Lấy địa chỉ ví hiện tại
  async getCurrentWalletAddress() {
    if (!window.ethereum) return null;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) return null;
      
      return accounts[0];
    } catch (error) {
      console.error('Lỗi lấy địa chỉ ví:', error);
      return null;
    }
  }

  // Mint NFT mới
  async mintNFT(tokenURI, title) {
    console.log('Đang mint NFT...');
    console.log('Token URI:', tokenURI);
    console.log('Title:', title);
    
    // Khởi tạo lại Web3Service nếu cần
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Không thể mint NFT. Vui lòng kết nối ví MetaMask.');
      }
    }
    
    try {
      // Kiểm tra signer
      if (!this.signer) {
        await this.connectWallet();
      }
      
      // Lấy địa chỉ người dùng hiện tại
      const address = await this.signer.getAddress();
      console.log('Minting NFT cho địa chỉ:', address);
      
      // Mint NFT mới và chờ giao dịch được xác nhận
      const tx = await this.contract.mintNFT(
        address,
        tokenURI,
        title
      );
      
      console.log('Giao dịch đã được gửi:', tx.hash);
      
      // Đợi giao dịch hoàn tất
      const receipt = await tx.wait();
      console.log('Giao dịch đã hoàn tất:', receipt);
      
      // Tìm sự kiện NFTMinted từ receipt
      const event = receipt.logs.find(log => {
        try {
          const decoded = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return decoded.name === 'NFTMinted';
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const decoded = this.contract.interface.parseLog({
          topics: event.topics,
          data: event.data,
        });
        
        const tokenId = decoded.args[0].toString();
        
        return {
          success: true,
          tokenId,
          owner: decoded.args[1],
          tokenURI: decoded.args[2]
        };
      }
      
      return { 
        success: true, 
        tokenId: receipt.logs[0].topics[3], 
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Lỗi khi mint NFT:', error);
      return { success: false, error: error.message || 'Lỗi khi mint NFT' };
    }
  }

  // Kiểm tra xem một địa chỉ có phải là chủ sở hữu của NFT không
  async isOwnerOf(tokenId, address) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Sử dụng hàm ownerOf từ chuẩn ERC-721
      const owner = await this.contract.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error(`Lỗi kiểm tra quyền sở hữu NFT #${tokenId}:`, error);
      return false;
    }
  }

  // Lấy chủ sở hữu hiện tại của một NFT
  async getOwnerOf(tokenId) {
    if (!this.initialized) await this.initialize();
    
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      console.error(`Lỗi lấy chủ sở hữu NFT #${tokenId}:`, error);
      return null;
    }
  }

  // Lấy danh sách NFT của người dùng hiện tại
  async getUserNFTs(account) {
    // Đảm bảo đã khởi tạo contract
    if (!this.initialized) {
      const ok = await this.initialize();
      if (!ok) return [];
    }
    try {
      const balance = await this.contract.balanceOf(account);
      console.log(balance);
      const nfts = [];
      for (let i = 0; i < balance; i++) {
        
        const tokenId = await this.contract.tokenOfOwnerByIndex(account, i);
        const tokenURI = await this.contract.tokenURI(tokenId);
        
        let metadataUrl = tokenURI;
        if (metadataUrl.startsWith('ipfs://')) {
          metadataUrl = metadataUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        let metadata = {};
        try {
          const res = await fetch(metadataUrl);
          metadata = await res.json();
        } catch (e) {
          metadata = {};
        }
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI,
          metadata,
          imageUrl: metadata.image?.startsWith('ipfs://')
            ? metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
            : metadata.image
        });
      }
      return nfts;
    } catch (error) {
      console.error('Lỗi lấy NFT:', error);
      return [];
    }
  }

  // Chuyển NFT cho người dùng khác
  async transferNFT(to, tokenId) {
    // Khởi tạo lại Web3Service nếu cần
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }
    
    try {
      const from = await this.getCurrentWalletAddress();
      if (!from) throw new Error('Không tìm thấy địa chỉ ví người gửi');
      
      // Thực hiện chuyển NFT
      const tx = await this.contract.transferFrom(from, to, tokenId);
      const receipt = await tx.wait();
      
      return receipt.status === 1;
    } catch (error) {
      console.error('Lỗi khi chuyển NFT:', error);
      return false;
    }
  }
}

export default new Web3Service();