require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const FACE_API_KEY = process.env.FACE_API_KEY || 'your_api_key_here';
const FACE_API_SECRET = process.env.FACE_API_SECRET || 'your_api_secret_here';
const FACE_DETECT_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';
const FACE_ANALYZE_URL = 'https://api-us.faceplusplus.com/facepp/v3/face/analyze';

// Endpoint để phát hiện khuôn mặt
app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('api_key', FACE_API_KEY);
    formData.append('api_secret', FACE_API_SECRET);
    formData.append('return_landmark', '1');
    formData.append('return_attributes', 'gender,age,smiling,emotion,ethnicity,beauty,skinstatus');
    
    // Thêm hình ảnh từ request
    formData.append('image_file', req.file.buffer, {
      filename: 'image.jpg',
      contentType: req.file.mimetype
    });

    const response = await axios.post(FACE_DETECT_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Face++ API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Endpoint để phân tích khuôn mặt chi tiết hơn
app.post('/api/analyze', async (req, res) => {
  try {
    const { face_token } = req.body;
    
    const formData = new FormData();
    formData.append('api_key', FACE_API_KEY);
    formData.append('api_secret', FACE_API_SECRET);
    formData.append('face_token', face_token);
    formData.append('return_attributes', 'gender,age,smiling,emotion,ethnicity,beauty,skinstatus');

    const response = await axios.post(FACE_ANALYZE_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Face++ API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to analyze face' });
  }
});

// Endpoint kiểm tra trạng thái máy chủ
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
