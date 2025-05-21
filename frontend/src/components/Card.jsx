import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Card.scss';

const Card = () => {
  const [images, setImages] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5001/api/images')
      .then(res => setImages(res.data))
      .catch(err => console.error('Error fetching images:', err));
  }, []);

  // Using IntersectionObserver for scroll effects
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= 0.5) {
            entry.target.classList.add('animate-up');
            entry.target.classList.remove('animate-down');
          } else {
            entry.target.classList.add('animate-down');
            entry.target.classList.remove('animate-up');
          }
        });
      },
      { threshold: 0.5 }
    );

    const elements = document.querySelectorAll('.card');
    elements.forEach(el => observer.observe(el));

    return () => elements.forEach(el => observer.unobserve(el));
  }, [images]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <>
      <div className="gallery-card">
        {images.map((item, index) => (
          <div
            className="card"
            key={index}
            style={{ "--delay": `${index * 0.2}s` }}
            onClick={() => handleCardClick(item)}
          >
            <div className="flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <img src={`http://localhost:5001${item.imageUrl}`} alt={item.title} />
                  {item.status === "minted" && (
                    <div className="nft-badge">NFT</div>
                  )}
                </div>
                <div className="flip-card-back">
                  <p className="title">{item.title}</p>
                  {item.prompt && (
                    <p className="prompt">{item.prompt.substring(0, 100)}...</p>
                  )}
                  {item.status === "minted" ? (
                    <div className="nft-info">
                      <p>Minted as NFT</p>
                      <p className="token-id">Token ID: {item.tokenId}</p>
                    </div>
                  ) : (
                    <button className="mint-btn">Mint as NFT</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>×</button>

            <div className="modal-artwork">
              <img src={`http://localhost:5001${selectedItem.imageUrl}`} alt={selectedItem.title} />
            </div>

            <div className="modal-details">
              <h2>{selectedItem.title}</h2>

              {selectedItem.prompt && (
                <div className="detail-section">
                  <h3>Generation Prompt</h3>
                  <p>{selectedItem.prompt}</p>
                </div>)}

              {selectedItem.status === "minted" ? (
                <div className="detail-section nft-details">
                  <h3>NFT Details</h3>
                  <p><strong>Token ID:</strong> {selectedItem.tokenId}</p>
                  <p><strong>IPFS Hash:</strong> {selectedItem.ipfsHash}</p>
                  <p><strong>Owner:</strong> {selectedItem.ownerAddress}</p>

                  <div className="nft-links">
                    {selectedItem.txHash && (
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${selectedItem.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Polygon
                      </a>
                    )}

                    {selectedItem.ipfsHash && (
                      <a
                        href={`https://ipfs.io/ipfs/${selectedItem.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on IPFS
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <h3>Standard Artwork</h3>
                  <p>This is a standard artwork in our collection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Card;