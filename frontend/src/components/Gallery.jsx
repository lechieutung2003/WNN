import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Web3Service from '../../services/Web3Service';
import { useWeb3 } from '../contexts/Web3Context';
import '../styles/Gallery.scss';

const Gallery = () => {
  const { account } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      if (!account) {
        setNfts([]);
        setLoading(false);
        return;
      }
      const nfts = await Web3Service.getUserNFTs(account);
      setNfts(nfts);
      setLoading(false);
    };
    fetchNFTs();
  }, [account]);

  return (
    <div className="gallery-wrapper">
      <Navbar />
      <div className="gallery-header"></div>
      <div className="gallery-container">
        <h1 className="gallery-title">NFT Gallery</h1>
        {loading ? (
          <p>Loading NFTs...</p>
        ) : nfts.length === 0 ? (
          <p>Bạn chưa sở hữu NFT nào.</p>
        ) : (
          <div className="gallery-grid">
            {nfts.map((nft) => (
              <div className="gallery-item" key={nft.tokenId}>
                <img src={nft.imageUrl} alt={nft.metadata.name} />
                <div className="image-info">
                  <h3>{nft.metadata.name}</h3>
                  <p>{nft.metadata.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;