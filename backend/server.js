import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { processImage } from './itt.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store coordinates temporarily (in production, use a proper database)
let coordinates = [];

// Endpoint 1: Process image using itt.js
app.post('/api/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    
    // Process image using detectImage function
    const result = await processImage(base64Image, req.file.mimetype);
    
    res.json({ result });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Endpoint 2: Save coordinates
app.post('/api/coordinates', (req, res) => {
  try {
    const { latitude, longitude, description } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const newCoordinate = {
      id: Date.now(), // Simple ID generation
      latitude,
      longitude,
      description: description || '',
      timestamp: new Date()
    };

    coordinates.push(newCoordinate);
    res.json(newCoordinate);
  } catch (error) {
    console.error('Error saving coordinates:', error);
    res.status(500).json({ error: 'Failed to save coordinates' });
  }
});

// Endpoint 3: Get all coordinates
app.get('/api/coordinates', (req, res) => {
  res.json(coordinates);
});

// Endpoint 4: Get specific coordinate by ID
app.get('/api/coordinates/:id', (req, res) => {
  const coordinate = coordinates.find(c => c.id === parseInt(req.params.id));
  if (!coordinate) {
    return res.status(404).json({ error: 'Coordinate not found' });
  }
  res.json(coordinate);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
