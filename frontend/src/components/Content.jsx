import React, { useEffect, useState } from 'react';
import '../styles/Content.scss';
import artifactsData from '../assets/data/Arts_List.json';
import Navbar from './Navbar';
import Loading from './Loading';
import photo from '../assets/photo.png';
import creature from '../assets/creature.png';
import Button from './Button';
import Web3Service from '../../services/Web3Service'; // Thêm import Web3Service
import { useWeb3 } from '../contexts/Web3Context';

const Content = () => {
  const { account, connectWallet, isConnected } = useWeb3(); // Thêm Web3 context
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [imageDataList, setImageDataList] = useState({});
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [nftStatus, setNftStatus] = useState({}); // Thay galleryStatus bằng nftStatus
  const [mintingIndex, setMintingIndex] = useState(null); // Track đang mint NFT nào

  // Định nghĩa server URL một lần để sử dụng nhất quán
  const API_BASE_URL = 'http://localhost:5000';

  // Fetch NFT status từ localStorage hoặc từ blockchain
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

  // Save NFT status to localStorage whenever it changes
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
    }, { threshold: 0.5 });

    sections.forEach(section => observer.observe(section));
    return () => sections.forEach(section => observer.unobserve(section));
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
      console.log(`Fetching image for: ${artifact.title}`);

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
      console.log('Received data from process endpoint:', data.success);

      if (!data.image) {
        throw new Error('No image data returned from server');
      }

      const base64Image = `data:image/jpeg;base64,${data.image}`;
      const filename = `artifact_${index}.jpg`;

      await saveImageToServer(base64Image, filename, artifact.title, index);
      console.log('Image successfully saved and added to display');

      setLoadingIndex(null);
    } catch (err) {
      console.error('Error in image generation process:', err);
      setLoadingIndex(null);
    }
  };

  const saveImageToServer = async (base64Image, filename, title, index) => {
    try {
      const res = await fetch(`${API_BASE_URL}/save-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, filename, title }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      const imageUrl = `${API_BASE_URL}${data.imageUrl.startsWith('/') ? data.imageUrl : '/' + data.imageUrl}`;
    
      console.log('Image saved successfully:', imageUrl);
      setImageDataList(prev => ({ ...prev, [index]: imageUrl }));
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  // Thay đổi chức năng: từ "Add to Gallery" thành "Mint NFT"
  const handleMintNFT = async (index) => {
    // Kiểm tra đã mint chưa
    if (nftStatus[index]?.isMinted) {
      alert('NFT này đã được mint rồi!');
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
    setMintingIndex(index); // Bắt đầu trạng thái minting

    try {
      console.log(`Starting mint NFT process for: ${artifact.title}`);

      // 1. Tạo metadata trên IPFS thông qua backend
      const metadataResponse = await fetch(`${API_BASE_URL}/mint-nft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: artifact.title,
          address: account
        })
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.message || 'Lỗi khi tạo metadata NFT');
      }

      const metadataData = await metadataResponse.json();
      
      if (!metadataData.success) {
        throw new Error(metadataData.message || 'Lỗi khi tạo metadata NFT');
      }

      console.log('Metadata created successfully:', metadataData);

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
            transactionHash: mintResult.transactionHash
          }
        }));

        alert(`Mint NFT thành công!\nToken ID: ${mintResult.tokenId}\nTransaction: ${mintResult.transactionHash}`);
        console.log('NFT minted successfully:', mintResult);
      } else {
        throw new Error(mintResult.error || 'Lỗi khi mint NFT trên blockchain');
      }

    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Lỗi khi mint NFT: ' + error.message);
    } finally {
      setMintingIndex(null); // Kết thúc trạng thái minting
    }
  };

  // Function để lấy text hiển thị trên button
  const getButtonText = (index) => {
    if (mintingIndex === index) {
      return 'Đang mint NFT...';
    }
    if (nftStatus[index]?.isMinted) {
      return `NFT đã mint (ID: ${nftStatus[index].tokenId})`;
    }
    return 'Mint NFT';
  };

  // Function để kiểm tra button có disabled không
  const isButtonDisabled = (index) => {
    return mintingIndex === index || nftStatus[index]?.isMinted;
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
              <p className="description-text">{artifact.description}</p>
            )}
          </div>
          <div className="right-content">
            <img src={photo} alt="Frame" className="frame-img" />
            <div className="image-wrapper">
              {loadingIndex === i ? (
                <Loading />
              ) : imageDataList[i] ? (  
                <div className="image-container">
                  <img 
                    src={imageDataList[i]} 
                    className="inner-photo" 
                    onError={(e) => {
                      console.error("Failed to load image");
                      e.target.style.display = 'none';
                    }}
                  />
                  {/* Giữ nguyên Button component nhưng thay đổi chức năng */}
                  <Button 
                    onClick={() => handleMintNFT(i)} // Thay đổi chức năng
                    isAdded={nftStatus[i]?.isMinted || false} // Thay đổi logic kiểm tra
                    text={getButtonText(i)} // Thay đổi text
                    disabled={isButtonDisabled(i)} // Thêm logic disabled
                  />
                  
                  {/* Hiển thị status NFT thay vì gallery status */}
                  {nftStatus[i]?.isMinted && (
                    <div className="added-status nft-success-status">
                      ✓ NFT đã mint thành công!<br/>
                      <small>Token ID: {nftStatus[i].tokenId}</small>
                    </div>
                  )}
                  
                  {/* Hiển thị thông báo khi đang mint */}
                  {mintingIndex === i && (
                    <div className="minting-status">
                      <div className="loading-spinner"></div>
                      Đang mint NFT, vui lòng chờ...
                    </div>
                  )}
                </div>
              ) : null}
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