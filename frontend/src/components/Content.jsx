import React, { useEffect, useState } from 'react';
import '../styles/Content.scss';
import artifactsData from '../assets/data/Arts_List.json';
import Navbar from './Navbar';
import Loading from './Loading';
import photo from '../assets/photo.png';
import creature from '../assets/creature.png';
import Button from './Button';
import Web3Service from '../../services/Web3Service';
import { useWeb3 } from '../contexts/Web3Context';

const Content = () => {
  const { account, connectWallet, isConnected } = useWeb3();
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [imageDataList, setImageDataList] = useState({});
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [nftStatus, setNftStatus] = useState({});
  const [mintingIndex, setMintingIndex] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  // Load NFT status từ localStorage
  useEffect(() => {
    const savedNftStatus = localStorage.getItem('nftMintStatus');
    if (savedNftStatus) {
      try {
        setNftStatus(JSON.parse(savedNftStatus));
      } catch (error) {
        console.error('Error parsing saved NFT status:', error);
      }
    }
  }, []);

  // Save NFT status khi thay đổi
  useEffect(() => {
    localStorage.setItem('nftMintStatus', JSON.stringify(nftStatus));
  }, [nftStatus]);

  useEffect(() => {
    const sections = document.querySelectorAll('.hero-section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      observer.observe(section);
    });

    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  const handleClickTitle = async (index) => {
    if (visibleIndex === index) {
      setVisibleIndex(null);
      return;
    }

    setVisibleIndex(index);
    setLoadingIndex(index);
    const artifact = artifactsData[index];

    try {
      console.log(`🎨 Generating image for: ${artifact.title}`);

      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news_id: index.toString(),
          title: artifact.title,
          creator: artifact.creator,
          dateCreated: artifact.dateCreated,
          materials: artifact.materials,
          description: artifact.description,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Received data from process endpoint:', data);

      if (!data.image) {
        throw new Error('No image data returned from server');
      }

      // Lưu base64 image data trực tiếp vào state
      const base64Image = `data:image/jpeg;base64,${data.image}`;
      setImageDataList(prev => ({ ...prev, [index]: base64Image }));

      // Hiển thị thông tin về source của ảnh
      if (data.source === 'fallback') {
        console.log('⚠️ Using fallback image:', data.message);
      } else {
        console.log('✅ Generated successfully from Stable Diffusion');
      }

    } catch (err) {
      console.error('❌ Error in image generation process:', err);
      alert('Lỗi khi tạo ảnh: ' + err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  // Hàm mint NFT trực tiếp từ base64 image
  const handleMintNFT = async (index) => {
    // Kiểm tra đã mint chưa
    if (nftStatus[index]?.isMinted) {
      alert('NFT này đã được mint rồi!');
      return;
    }

    // Kiểm tra có ảnh chưa
    if (!imageDataList[index]) {
      alert('Vui lòng tạo ảnh trước khi mint NFT!');
      return;
    }

    // Kiểm tra kết nối ví
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (error) {
        alert('Vui lòng kết nối ví MetaMask để mint NFT!');
        return;
      }
    }

    if (!account) {
      alert('Không tìm thấy địa chỉ ví!');
      return;
    }

    const artifact = artifactsData[index];
    setMintingIndex(index);

    try {
      console.log(`🚀 Starting direct NFT mint for: ${artifact.title}`);

      // 1. Upload lên IPFS và tạo metadata thông qua endpoint mới
      const metadataResponse = await fetch(`${API_BASE_URL}/mint-nft-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: artifact.title,
          imageData: imageDataList[index], // Gửi base64 image data
          address: account,
          description: artifact.description || `AI-generated artwork: ${artifact.title}`
        })
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.message || 'Lỗi khi upload IPFS và tạo metadata');
      }

      const metadataData = await metadataResponse.json();

      if (!metadataData.success) {
        throw new Error(metadataData.error || 'Lỗi khi upload IPFS và tạo metadata');
      }

      console.log('📁 IPFS upload successful:', metadataData);

      // 2. Mint NFT trên blockchain
      const mintResult = await Web3Service.mintNFT(
        metadataData.data.gateway_url, // tokenURI
        artifact.title
      );

      if (mintResult.success) {
        // Cập nhật trạng thái NFT đã mint
        setNftStatus(prev => ({
          ...prev,
          [index]: {
            isMinted: true,
            tokenId: mintResult.tokenId,
            mintedAt: new Date().toISOString(),
            metadataUrl: metadataData.data.gateway_url,
            transactionHash: mintResult.transactionHash,
            ipfsData: metadataData.data
          }
        }));

        alert(`🎉 Mint NFT thành công!\n\n✅ Token ID: ${mintResult.tokenId}\n🔗 Transaction: ${mintResult.transactionHash}\n📦 IPFS: ${metadataData.data.metadata_cid}\n\n🌐 NFT của bạn đã được lưu trữ hoàn toàn on-chain và IPFS!`);
        console.log('🎊 NFT minted successfully:', mintResult);
      } else {
        throw new Error(mintResult.error || 'Lỗi khi mint NFT trên blockchain');
      }

    } catch (error) {
      console.error('💥 Error minting NFT:', error);
      alert('Lỗi khi mint NFT: ' + error.message);
    } finally {
      setMintingIndex(null);
    }
  };

  // const getButtonText = (index) => {
  //   if (mintingIndex === index) {
  //     return 'Đang mint NFT...';
  //   }
  //   if (nftStatus[index]?.isMinted) {
  //     return `✅ NFT #${nftStatus[index].tokenId}`;
  //   }
  //   return '🚀 Mint NFT';
  // };

  // const isButtonDisabled = (index) => {
  //   return mintingIndex === index || nftStatus[index]?.isMinted || !imageDataList[index];
  // };

  const getImageStatus = (index) => {
    if (nftStatus[index]?.isMinted) {
      return 'minted';
    }
    if (imageDataList[index]) {
      return 'generated';
    }
    return 'empty';
  };

  return (
    <div className="content-wrapper">
      <Navbar />
      {artifactsData.map((artifact, i) => (
        <div key={i} className="hero-section">
          <div className="left-content">
            <img src={creature} alt="Creature" className="creature-image" />
            <h1
              className="museum-title"
              onClick={() => handleClickTitle(i)}
              style={{ cursor: 'pointer' }}
            >
              {artifact.title}
            </h1>
            {visibleIndex === i && (
              <div className="description-section">
                <p className="description-text">{artifact.description}</p>
                {/* Hiển thị metadata */}
                {/* <div className="metadata-info">
                  <small>📅 {artifact.dateCreated}</small><br />
                  <small>👨‍🎨 {artifact.creator}</small><br />
                  <small>🎨 {artifact.materials}</small>
                </div> */}
              </div>
            )}
          </div>
          <div className="right-content">
            <img src={photo} alt="Frame" className="frame-img" />
            <div className={`image-wrapper status-${getImageStatus(i)}`}>
              {loadingIndex === i ? (
                <div className="loading-container">
                  <Loading />
                  {/* <p className="loading-text">🎨 Đang tạo artwork...</p> */}
                </div>
              ) : imageDataList[i] ? (
                <div className="image-container">
                  <img
                    src={imageDataList[i]}
                    className="inner-photo"
                    onError={(e) => {
                      console.error("❌ Failed to load image");
                      e.target.style.display = 'none';
                    }}
                  />

                  {/* Action Button */}
                  <div className="action-section">
                    <Button
                      onClick={() => handleMintNFT(i)}
                      isAdded={nftStatus[i]?.isMinted || false}
                      isLoading={mintingIndex === i}
                      // text={getButtonText(i)}
                      // disabled={isButtonDisabled(i)}
                      text="ADD TO GALLERY"
                      disabled={!imageDataList[i]}
                    />

                    {/* Connection status */}
                    {!isConnected && imageDataList[i] && !nftStatus[i]?.isMinted && (
                      <p className="wallet-hint">
                        💡 Kết nối ví để mint NFT
                      </p>
                    )}
                  </div>

                  {/* Status displays */}
                  {nftStatus[i]?.isMinted && (
                    <div className="nft-success-status">
                      {/* <div className="success-header">
                        🎉 NFT đã mint thành công!
                      </div>
                      <div className="success-details">
                        <div className="detail-item">
                          <span className="label">Token ID:</span>
                          <span className="value">#{nftStatus[i].tokenId}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Blockchain:</span>
                          <span className="value">✅ Ethereum</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Storage:</span>
                          <span className="value">📦 IPFS</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className="value">🌐 Decentralized</span>
                        </div>
                      </div> */}
                    </div>
                  )}

                  {mintingIndex === i && (
                    <div className="minting-status">
                      <div className="minting-content">
                        <div className="loading-spinner"></div>
                        <div className="minting-text">
                          <strong>🚀 Đang mint NFT...</strong>
                          <p>Vui lòng chờ xác nhận transaction</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="placeholder-content">
                  {/* <div className="placeholder-icon">🎨</div>
                  <p>Nhấn vào tiêu đề để tạo artwork</p> */}
                </div>
              )}
            </div>
          </div>
          <div className="torn-paper-bottom"></div>
          <div className="background-museum"></div>
        </div>
      ))}
    </div>
  );
};

export default Content;