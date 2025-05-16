# Hướng dẫn triển khai ứng dụng phân tích khuôn mặt trên Vercel

Tài liệu này hướng dẫn chi tiết cách triển khai ứng dụng phân tích khuôn mặt lên nền tảng Vercel, bao gồm cả phần frontend và backend proxy API.

## Yêu cầu

- Tài khoản GitHub
- Tài khoản Vercel (có thể đăng ký miễn phí bằng tài khoản GitHub)
- Tài khoản Face++ (để lấy API Key và API Secret)

## Bước 1: Chuẩn bị mã nguồn

1. Tạo một repository GitHub mới
2. Clone repository về máy tính của bạn
3. Giải nén file `face_analysis_app.zip` (đã được cung cấp) vào thư mục repository
4. Cập nhật file `.env` trong thư mục `server` với API Key và API Secret của Face++:

```
FACE_API_KEY=your_face_api_key
FACE_API_SECRET=your_face_api_secret
PORT=3000
```

5. Commit và push mã nguồn lên GitHub:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Bước 2: Triển khai Frontend trên Vercel

1. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub
2. Nhấp vào "New Project"
3. Chọn repository GitHub chứa mã nguồn ứng dụng
4. Cấu hình như sau:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist
5. Nhấp vào "Deploy"

Vercel sẽ tự động build và triển khai phần frontend của ứng dụng. Sau khi hoàn tất, bạn sẽ nhận được một URL để truy cập ứng dụng (ví dụ: https://face-analysis-app.vercel.app).

## Bước 3: Triển khai Backend API Proxy trên Vercel

Để triển khai backend API proxy, chúng ta cần tạo một Vercel Serverless Function:

1. Tạo thư mục `api` trong thư mục gốc của dự án
2. Tạo file `api/proxy.js` với nội dung sau:

```javascript
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Face++ API credentials
const FACE_API_KEY = process.env.FACE_API_KEY;
const FACE_API_SECRET = process.env.FACE_API_SECRET;

// Proxy endpoint for Face++ Detect API
app.post('/api/detect', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    
    // Create form data
    const formData = new FormData();
    formData.append('api_key', FACE_API_KEY);
    formData.append('api_secret', FACE_API_SECRET);
    formData.append('image_file', imageBuffer, { filename: 'image.jpg' });
    formData.append('return_attributes', 'gender,age,smiling,emotion,ethnicity,beauty,skinstatus');
    
    // Send request to Face++ API
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
      headers: formData.getHeaders(),
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Face++ API:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the serverless function
module.exports = serverless(app);
```

3. Tạo file `vercel.json` trong thư mục gốc với nội dung sau:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/proxy.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/proxy.js" }
  ],
  "env": {
    "FACE_API_KEY": "your_face_api_key",
    "FACE_API_SECRET": "your_face_api_secret"
  }
}
```

4. Cập nhật `FACE_API_KEY` và `FACE_API_SECRET` trong file `vercel.json` với thông tin của bạn
5. Cập nhật file `src/FaceAnalysisService.js` để sử dụng API proxy mới:

```javascript
// Thay đổi URL từ
const API_URL = 'http://localhost:3000/api';
// Thành
const API_URL = '/api';
```

6. Commit và push các thay đổi lên GitHub:

```bash
git add .
git commit -m "Add Vercel serverless function for API proxy"
git push origin main
```

7. Vercel sẽ tự động phát hiện thay đổi và triển khai lại ứng dụng

## Bước 4: Cấu hình biến môi trường trên Vercel

1. Trong dashboard Vercel, chọn dự án của bạn
2. Chuyển đến tab "Settings" > "Environment Variables"
3. Thêm hai biến môi trường:
   - `FACE_API_KEY`: API Key của Face++
   - `FACE_API_SECRET`: API Secret của Face++
4. Nhấp vào "Save"
5. Chuyển đến tab "Deployments" và chọn "Redeploy" để áp dụng các biến môi trường mới

## Bước 5: Kiểm tra ứng dụng

1. Truy cập URL của ứng dụng đã triển khai (ví dụ: https://face-analysis-app.vercel.app)
2. Cho phép truy cập camera khi được yêu cầu
3. Kiểm tra các tính năng:
   - Nhận diện khuôn mặt thời gian thực
   - Phân tích giới tính và tuổi tác
   - Nhận diện cảm xúc
   - Phân tích nhân chủng học, sức khỏe làn da và trạng thái thể chất (thông qua Face++ API)

## Xử lý sự cố

- **Lỗi camera**: Đảm bảo bạn đang sử dụng HTTPS và đã cấp quyền truy cập camera
- **Lỗi API Face++**: Kiểm tra API Key và API Secret trong biến môi trường Vercel
- **Lỗi CORS**: Vercel tự động xử lý CORS, nhưng nếu gặp vấn đề, hãy kiểm tra cấu hình trong file `api/proxy.js`

## Cập nhật và bảo trì

Để cập nhật ứng dụng:
1. Thực hiện các thay đổi trong mã nguồn
2. Commit và push lên GitHub
3. Vercel sẽ tự động triển khai phiên bản mới

## Tài nguyên bổ sung

- [Tài liệu Vercel](https://vercel.com/docs)
- [Tài liệu Face++ API](https://console.faceplusplus.com/documents/5679127)
- [Tài liệu face-api.js](https://github.com/justadudewhohacks/face-api.js)
