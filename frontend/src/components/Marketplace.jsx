import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Web3Service from '../../services/Web3Service';
import { useWeb3 } from '../contexts/Web3Context';
import '../styles/Marketplace.scss';

const Marketplace = () => {
  const { account, connectWallet, isConnected } = useWeb3();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingTokenId, setBuyingTokenId] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const activeListings = await Web3Service.getActiveListings();
      setListings(activeListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleBuy = async (listing) => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (error) {
        alert('Vui lòng kết nối ví để mua NFT!');
        return;
      }
    }

    if (listing.seller.toLowerCase() === account?.toLowerCase()) {
      alert('Bạn không thể mua NFT của chính mình!');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn mua NFT "${listing.title}" với giá ${listing.price} ETH?`)) {
      return;
    }

    setBuyingTokenId(listing.tokenId);

    try {
      const result = await Web3Service.buyNFT(listing.tokenId, listing.price);

      if (result.success) {
        alert(`Mua NFT thành công!\nTransaction: ${result.transactionHash}`);
        // Refresh listings
        fetchListings();
      } else {
        alert('Lỗi khi mua NFT: ' + result.error);
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Lỗi khi mua NFT: ' + error.message);
    } finally {
      setBuyingTokenId(null);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="marketplace-wrapper">
      <Navbar />
      <div className="marketplace-header"></div>
      <div className="marketplace-container">

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải marketplace...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-marketplace">
            <div className="empty-icon">🏪</div>
            <h2>Marketplace hiện tại không có NFT nào</h2>
            <p>Hãy trở lại sau hoặc đăng bán NFT của bạn!</p>
          </div>
        ) : (
          <>
            <div className="marketplace-stats">
              <div className="stat-item">
                <span className="stat-number">{listings.length}</span>
                <span className="stat-label">NFT đang bán</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {listings.reduce((min, listing) =>
                    Math.min(min, parseFloat(listing.price)), Infinity
                  ).toFixed(3)}
                </span>
                <span className="stat-label">Giá thấp nhất (ETH)</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {listings.reduce((max, listing) =>
                    Math.max(max, parseFloat(listing.price)), 0
                  ).toFixed(3)}
                </span>
                <span className="stat-label">Giá cao nhất (ETH)</span>
              </div>
            </div>

            <div className="marketplace-grid">
              {listings.map((listing) => (
                <div className="marketplace-item" key={listing.tokenId}>
                  <div className="nft-image">
                    <img src={listing.imageUrl} alt={listing.title} />
                  </div>

                  <div className="nft-info">
                    <h3>{listing.title}</h3>
                    <p className="token-id">Token ID: {listing.tokenId}</p>
                    {listing.metadata.description && (
                      <p className="description">{listing.metadata.description}</p>
                    )}
                  </div>

                  <div className="listing-details">
                    <div className="price-section">
                      <span className="price-label">Giá bán</span>
                      <span className="price">{listing.price} ETH</span>
                    </div>

                    <div className="seller-info">
                      <span className="seller-label">Người bán:</span>
                      <span className="seller-address">
                        {formatAddress(listing.seller)}
                      </span>
                    </div>

                    <div className="listing-time">
                      <span>Đăng bán: {formatDate(listing.listedAt)}</span>
                    </div>
                  </div>

                  <div className="marketplace-actions">
                    {listing.seller.toLowerCase() === account?.toLowerCase() ? (
                      <button className="btn-own-nft" disabled>
                        NFT của bạn
                      </button>
                    ) : (
                      <button
                        className="btn-buy"
                        onClick={() => handleBuy(listing)}
                        disabled={buyingTokenId === listing.tokenId}
                      >
                        {buyingTokenId === listing.tokenId ? (
                          <>
                            <span className="buying-spinner"></span>
                            Đang mua...
                          </>
                        ) : (
                          `Mua ngay ${listing.price} ETH`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;