// src/services/api.js

// Fetch news data from JSON file
export const fetchNewsData = async () => {
    try {
      const response = await fetch('/news.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading news data:', error);
      return [];
    }
  };
  
  // Mock backend service to simulate getting images by news ID
  export const fetchImageForNews = async (newsId) => {
    // In a real application, this would be an API call to your backend
    // For demo purposes, we'll simulate a delay and return a placeholder image
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/api/placeholder/400/300?text=News+Image+${newsId}`);
      }, 500);
    });
  };