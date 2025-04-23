export const fetchNewsImageBlob = async (news_id) => {
    try {
      const res = await fetch(`/api/news/${news_id}/image`);
      if (!res.ok) {
        throw new Error(`Failed to fetch image for news_id ${news_id}`);
      }
      return await res.blob();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };