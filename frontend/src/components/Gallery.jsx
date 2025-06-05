import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Web3Service from '../../services/Web3Service';
import SellNFTModal from './SellNFTModal';
import { useWeb3 } from '../contexts/Web3Context';
import '../styles/Gallery.scss';

const Gallery = () => {
  const { account } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);

  const fetchNFTs = async () => {
    setLoading(true);
    if (!account) {
      setNfts([]);
      setLoading(false);
      return;
    }
    
    try {
      const userNFTs = await Web3Service.getUserNFTs(account);
      setNfts(userNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setNfts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNFTs();
  }, [account]);

  const handleSellClick = (nft) => {
    setSelectedNFT(nft);
    setShowSellModal(true);
  };

  const handleCancelListing = async (nft) => {
    if (!window.confirm('Bạn có chắc muốn hủy listing này?')) {
      return;
    }

    try {
      const result = await Web3Service.cancelListing(nft.tokenId);
      if (result.success) {
        alert('Hủy listing thành công!');
        // Refresh NFTs
        fetchNFTs();
      } else {
        alert('Lỗi khi hủy listing: ' + result.error);
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert('Lỗi khi hủy listing: ' + error.message);
    }
  };

  const handleSellSuccess = (tokenId, price, transactionHash) => {
    console.log(`NFT ${tokenId} listed for ${price} ETH. Tx: ${transactionHash}`);
    // Refresh NFTs để cập nhật trạng thái
    fetchNFTs();
  };

  return (
    <div className="gallery-wrapper">
      <Navbar />
      <div className="gallery-header"></div>
      <div className="gallery-container">
        <h1 className="gallery-title">My NFT Collection</h1>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải NFT collection...</p>
          </div>
        ) : !account ? (
          <div className="no-wallet">
            <p>Vui lòng kết nối ví để xem NFT collection của bạn</p>
          </div>
        ) : nfts.length === 0 ? (
          <div className="empty-gallery">
            <p>Bạn chưa sở hữu NFT nào.</p>
            <p>Hãy tạo và mint NFT đầu tiên của bạn!</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {nfts.map((nft) => (
              <div className="gallery-item" key={nft.tokenId}>
                <div className="nft-image">
                  <img src={nft.imageUrl} alt={nft.title} />
                  {nft.isListed && (
                    <div className="listed-badge">
                      Đang bán: {nft.listingPrice} ETH
                    </div>
                  )}
                </div>
                
                <div className="nft-info">
                  <h3>{nft.title}</h3>
                  <p className="token-id">Token ID: {nft.tokenId}</p>
                  {nft.metadata.description && (
                    <p className="description">{nft.metadata.description}</p>
                  )}
                </div>
                
                <div className="nft-actions">
                  {nft.isListed ? (
                    <button 
                      className="btn-cancel-listing"
                      onClick={() => handleCancelListing(nft)}
                    >
                      Hủy bán
                    </button>
                  ) : (
                    <button 
                      className="btn-sell"
                      onClick={() => handleSellClick(nft)}
                    >
                      Bán NFT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sell NFT Modal */}
      <SellNFTModal
        nft={selectedNFT}
        isOpen={showSellModal}
        onClose={() => {
          setShowSellModal(false);
          setSelectedNFT(null);
        }}
        onSuccess={handleSellSuccess}
      />
    </div>
  );
};

export default Gallery;