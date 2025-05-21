import React, { useEffect, useState } from 'react';
import '../styles/Content.scss';
import artifactsData from '../assets/data/Arts_List.json'; // <-- import từ file
import Navbar from './Navbar';
import Loading from './Loading';
import photo from '../assets/photo.png';
import creature from '../assets/creature.png';
import Button from './Button';

const Content = () => {
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [imageDataList, setImageDataList] = useState({});
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [galleryStatus, setGalleryStatus] = useState({});

  // Định nghĩa server URL một lần để sử dụng nhất quán
  const API_BASE_URL = 'http://localhost:5000';

  // Thêm useEffect ngay sau khai báo API_BASE_URL
  useEffect(() => {
    const fetchGalleryStatus = async () => {
      try {
        console.log('Fetching gallery status...');
        const response = await fetch(`${API_BASE_URL}/api/images`);
        
        if (response.ok) {
          const gallery = await response.json();
          console.log('Gallery data received:', gallery.length, 'items');
          
          // Khởi tạo galleryStatus dựa trên dữ liệu từ server
          const statusMap = {};
          gallery.forEach(item => {
            const index = artifactsData.findIndex(art => art.title === item.title);
            if (index !== -1) {
              statusMap[index] = true;
              console.log(`Item "${item.title}" marked as added, index: ${index}`);
            }
          });
          
          setGalleryStatus(statusMap);
        } else {
          console.error('Failed to fetch gallery status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching gallery status:', error);
      }
    };
    
    fetchGalleryStatus();
  }, []);

  // Debug trạng thái gallery
  useEffect(() => {
    console.log('Current galleryStatus:', galleryStatus);
  }, [galleryStatus]);

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

  // Đổi tên từ sendBase64ToNode thành saveImageToServer để chính xác hơn
  const saveImageToServer = async (base64Image, filename, title, index) => {
    try {
      // Sử dụng API_BASE_URL để đảm bảo nhất quán
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
      // Tạo URL đầy đủ từ API_BASE_URL và đường dẫn tương đối trả về từ server
      const imageUrl = `${API_BASE_URL}${data.imageUrl.startsWith('/') ? data.imageUrl : '/' + data.imageUrl}`;
    
      console.log('Image saved successfully:', imageUrl);

      // Update state with the image URL
      setImageDataList(prev => ({ ...prev, [index]: imageUrl }));
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleMarkAsAdded = async (index) => {
    const title = artifactsData[index].title;
    console.log('Marking as added:', title);
    try {
      // Sử dụng API_BASE_URL để đảm bảo nhất quán
      const res = await fetch(`${API_BASE_URL}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await res.json();
      console.log(data.message);
      
      // Cập nhật trạng thái hiển thị "Đã thêm vào gallery"
      setGalleryStatus(prev => ({...prev, [index]: true}));
    } catch (error) {
      console.error('Error updating status:', error);
    }
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
                  <Button 
                    onClick={() => handleMarkAsAdded(i)}
                    isAdded={galleryStatus[i] === true}  // Chỉ true khi chắc chắn là true
                    text="Thêm vào bộ sưu tập"
                  />
                  {galleryStatus[i] === true && (
                    <div className="added-status">Đã thêm vào bộ sưu tập</div>
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