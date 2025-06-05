import React, { useState } from 'react';
import Web3Service from '../../services/Web3Service';
import { useWeb3 } from '../contexts/Web3Context';
import '../styles/NFTMintButton.scss';

const NFTMintButton = ({ artwork, onSuccess, disabled }) => {
  const { account, connectWallet, isConnected } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);

  const handleMintNFT = async () => {
    if (!artwork || !artwork.title) {
      setError('Không tìm thấy thông tin tác phẩm');
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      // Kiểm tra kết nối ví
      if (!isConnected) {
        await connectWallet();
      }
      
      // Gửi yêu cầu mint đến backend
      const response = await fetch('http://localhost:5000/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: artwork.title,
          address: account
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi tạo metadata NFT');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Metadata tạo thành công:', data);
        
        // Mint NFT sử dụng smart contract
        const mintResult = await Web3Service.mintNFT(
          data.data.gateway_url, // tokenURI
          artwork.title
        );

        if (mintResult.success) {
          if (onSuccess) {
            onSuccess({
              tokenId: mintResult.tokenId,
              metadata: data.data,
              address: account
            });
          }
          
          alert(`Mint NFT thành công! Token ID: ${mintResult.tokenId}`);
        } else {
          throw new Error(mintResult.error || 'Lỗi khi tạo NFT trên blockchain');
        }
      } else {
        throw new Error(data.message || 'Lỗi khi tạo metadata NFT');
      }
    } catch (err) {
      console.error('Lỗi mint NFT:', err);
      setError(err.message || 'Lỗi khi mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="nft-mint-container">
      <button
        className={`nft-mint-button ${isMinting ? 'minting' : ''} ${artwork?.isMinted ? 'minted' : ''}`}
        onClick={handleMintNFT}
        disabled={isMinting || disabled || artwork?.isMinted}
      >
        {isMinting ? 'Đang mint...' : artwork?.isMinted ? 'Đã mint NFT' : 'Mint NFT'}
      </button>
      {error && <div className="nft-mint-error">{error}</div>}
    </div>
  );
};

export default NFTMintButton;