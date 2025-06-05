import React, { useState } from 'react';
import Web3Service from '../../services/Web3Service';
import '../styles/SellNFTModal.scss';

const SellNFTModal = ({ nft, isOpen, onClose, onSuccess }) => {
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Nhập giá, 2: Approve, 3: Create listing

  const handleSell = async () => {
    if (!price || parseFloat(price) <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Approve NFT cho marketplace
      setStep(2);
      console.log('Approving NFT...');
      
      const approveResult = await Web3Service.approveNFT(nft.tokenId);
      if (!approveResult.success) {
        throw new Error(approveResult.error);
      }
      
      console.log('NFT approved, creating listing...');
      
      // Step 2: Tạo listing
      setStep(3);
      const listingResult = await Web3Service.createListing(nft.tokenId, price);
      
      if (listingResult.success) {
        alert(`NFT đã được đăng bán thành công!\nGiá: ${price} ETH\nTransaction: ${listingResult.transactionHash}`);
        onSuccess(nft.tokenId, price, listingResult.transactionHash);
        onClose();
      } else {
        throw new Error(listingResult.error);
      }
      
    } catch (error) {
      console.error('Error selling NFT:', error);
      alert('Lỗi khi đăng bán NFT: ' + error.message);
    } finally {
      setIsLoading(false);
      setStep(1);
    }
  };

  const getStepMessage = () => {
    switch(step) {
      case 2:
        return 'Đang xin phép marketplace chuyển NFT...';
      case 3:
        return 'Đang tạo listing...';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Bán NFT</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="nft-preview">
            <img src={nft.imageUrl} alt={nft.title} />
            <div className="nft-info">
              <h3>{nft.title}</h3>
              <p>Token ID: {nft.tokenId}</p>
            </div>
          </div>
          
          {!isLoading ? (
            <div className="price-input-section">
              <label htmlFor="price">Giá bán (ETH):</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.1"
                step="0.001"
                min="0"
              />
              <small>Phí marketplace: 2.5%</small>
            </div>
          ) : (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>{getStepMessage()}</p>
              <div className="progress-steps">
                <div className={`step ${step >= 1 ? 'completed' : ''}`}>1. Nhập giá</div>
                <div className={`step ${step >= 2 ? 'completed' : ''}`}>2. Approve NFT</div>
                <div className={`step ${step >= 3 ? 'completed' : ''}`}>3. Tạo listing</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSell}
            disabled={isLoading || !price}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng bán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellNFTModal;