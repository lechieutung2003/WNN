import React, { useState, useEffect } from 'react';
import '../styles/NFTs.scss';
import Navbar from './Navbar';
import Web3Service from '../../services/Web3Service';
import { useWeb3 } from '../contexts/Web3Context';
import Loading from './Loading';

const NFTs = () => {
  const { account, connectWallet, isConnected } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Tải NFTs khi component mount hoặc account thay đổi
  useEffect(() => {
    loadNFTs();
  }, [account]); // Account là dependency

  const loadNFTs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isConnected) {
        setError("Vui lòng kết nối ví để xem NFT của bạn");
        setLoading(false);
        return;
      }
      
      const userNFTs = await Web3Service.getUserNFTs();
      
      // Lấy metadata thực tế từ tokenURI cho mỗi NFT
      const enrichedNFTs = await Promise.all(userNFTs.map(async (nft) => {
        try {
          // Xử lý IPFS URI
          let metadataUrl = nft.tokenURI;
          if (metadataUrl.startsWith('ipfs://')) {
            metadataUrl = metadataUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          }
          
          // Fetch metadata
          const response = await fetch(metadataUrl);
          const metadata = await response.json();
          
          // Xử lý URL hình ảnh
          let imageUrl = metadata.image;
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          }
          
          return {
            ...nft,
            metadata,
            imageUrl
          };
        } catch (error) {
          console.error(`Error fetching metadata for NFT #${nft.tokenId}:`, error);
          return {
            ...nft,
            metadata: { name: nft.title, description: "Metadata not available" },
            imageUrl: null
          };
        }
      }));
      
      setNfts(enrichedNFTs);
    } catch (err) {
      setError("Không thể tải NFT. Vui lòng kiểm tra kết nối và thử lại.");
      console.error("Error loading NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferNFT = async (e) => {
    e.preventDefault();
    if (!selectedNFT || !transferTo) {
      alert("Vui lòng nhập địa chỉ ví hợp lệ!");
      return;
    }

    setTransferring(true);
    try {
      const success = await Web3Service.transferNFT(transferTo, selectedNFT.tokenId);
      if (success) {
        alert(`Đã chuyển NFT #${selectedNFT.tokenId} thành công cho địa chỉ ${transferTo}`);
        setSelectedNFT(null);
        setTransferTo('');
        // Tải lại danh sách NFT
        loadNFTs();
      } else {
        throw new Error("Giao dịch không thành công");
      }
    } catch (err) {
      console.error("Lỗi khi chuyển NFT:", err);
      alert(`Lỗi: ${err.message || "Không thể chuyển NFT"}`);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="nfts-page">
      <Navbar />
      <div className="nfts-content">
        <h1>NFT của bạn</h1>
        
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="nfts-error">
            <p>{error}</p>
            <button onClick={connectWallet}>
              Kết nối ví
            </button>
          </div>
        ) : nfts.length === 0 ? (
          <div className="no-nfts">
            <p>Bạn chưa có NFT nào.</p>
            <a href="/gallery" className="go-to-gallery">
              Đi đến Gallery để tạo NFT
            </a>
          </div>
        ) : (
          <>
            <div className="nfts-grid">
              {nfts.map((nft) => (
                <div className="nft-card" key={nft.tokenId} onClick={() => setSelectedNFT(nft)}>
                  <div className="nft-image-container">
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.metadata.name} className="nft-image" />
                    ) : (
                      <div className="nft-image-placeholder">Hình ảnh không khả dụng</div>
                    )}
                    <div className="nft-token-id">#{nft.tokenId}</div>
                  </div>
                  <div className="nft-info">
                    <h3>{nft.metadata.name}</h3>
                    <p className="nft-creator">{nft.creator || "Không rõ tác giả"}</p>
                    <p className="nft-description">{nft.metadata.description.slice(0, 100)}{nft.metadata.description.length > 100 ? '...' : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedNFT && (
              <div className="nft-detail-overlay">
                <div className="nft-detail-modal">
                  <button className="close-modal" onClick={() => setSelectedNFT(null)}>×</button>
                  <div className="nft-detail-content">
                    <div className="nft-detail-image-container">
                      {selectedNFT.imageUrl ? (
                        <img src={selectedNFT.imageUrl} alt={selectedNFT.metadata.name} className="nft-detail-image" />
                      ) : (
                        <div className="nft-detail-image-placeholder">Hình ảnh không khả dụng</div>
                      )}
                      <div className="nft-detail-token-id">#{selectedNFT.tokenId}</div>
                    </div>
                    <div className="nft-detail-info">
                      <h2>{selectedNFT.metadata.name}</h2>
                      <p className="nft-detail-creator"><strong>Tác giả:</strong> {selectedNFT.creator || "Không rõ"}</p>
                      <p className="nft-detail-created"><strong>Ngày tạo:</strong> {selectedNFT.dateCreated || "Không rõ"}</p>
                      <p className="nft-detail-description">{selectedNFT.metadata.description}</p>
                      
                      <h3>Chuyển NFT</h3>
                      <form onSubmit={handleTransferNFT} className="transfer-form">
                        <input
                          type="text"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="Địa chỉ ví người nhận (0x...)"
                          required
                        />
                        <button 
                          type="submit" 
                          className="transfer-button"
                          disabled={transferring}
                        >
                          {transferring ? 'Đang chuyển...' : 'Chuyển NFT'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NFTs;