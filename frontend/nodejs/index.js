import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use('/generated', express.static(path.join(__dirname, '../public/generated')));

app.post('/save-image', (req, res) => {
  const { base64Image, filename, title } = req.body;

  if (!base64Image || !filename || !title) {
    return res.status(400).json({ message: 'Missing image, filename, or title' });
  }

  // Loại bỏ header base64
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const imagePath = `/generated/${filename}`;
  const filePath = path.join(__dirname, `../public${imagePath}`);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).json({ message: 'Error saving image' });
    }


    const galleryPath = path.join(__dirname, '../public/data/gallery.json');


    // Đảm bảo thư mục /data tồn tại
    fs.mkdir(path.dirname(galleryPath), { recursive: true }, (err) => {
      if (err) return res.status(500).json({ message: 'Failed to create data directory' });



      fs.readFile(galleryPath, 'utf-8', (readErr, data) => {
        let gallery = [];
        if (!readErr && data) {
          try {
            gallery = JSON.parse(data);
          } catch (parseErr) {
            console.error('Error parsing gallery.json:', parseErr);
          }
        }

  

        gallery.push({ title, imageUrl: imagePath });
        console.log('Gallery:', gallery);

        fs.writeFile(galleryPath, JSON.stringify(gallery, null, 2), 'utf-8', (writeErr) => {
          if (writeErr) {
            console.error('Error saving gallery.json:', writeErr);
            return res.status(500).json({ message: 'Failed to save image metadata' });
          }

          // console.log(res.json({ imageUrl: imagePath }));
          return res.json({ imageUrl: imagePath });
        });
      });
    });
  });
});


app.post('/update-status', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Missing title' });

  const galleryPath = path.join(__dirname, '../public/data/gallery.json');

  fs.readFile(galleryPath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading gallery.json:', err);
      return res.status(500).json({ message: 'Failed to read gallery.json' });
    }

    let gallery = [];
    try {
      gallery = JSON.parse(data);
    } catch {
      return res.status(500).json({ message: 'Invalid JSON format' });
    }

    const index = gallery.findIndex(item => item.title === title);
    if (index === -1) return res.status(404).json({ message: 'Title not found in gallery' });

    gallery[index].status = 'added';

    fs.writeFile(galleryPath, JSON.stringify(gallery, null, 2), 'utf-8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing gallery.json:', writeErr);
        return res.status(500).json({ message: 'Failed to update status' });
      }

      return res.json({ message: 'Status updated successfully' });
    });
  });
});

app.get('/api/images', (req, res) => {
  const galleryPath = path.join(__dirname, '../public/data/gallery.json');
  fs.readFile(galleryPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading gallery.json:', err);
      return res.status(500).json({ message: 'Error reading gallery data' });
    }
    try {
      const galleryData = JSON.parse(data);
      // Lọc ra các record có status === "added"
      const images = galleryData.filter(item => item.status === 'added');
      return res.json(images);
    } catch (parseErr) {
      console.error('Error parsing gallery.json:', parseErr);
      return res.status(500).json({ message: 'Error parsing gallery data' });
    }
  });
});

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
