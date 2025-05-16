# Hướng dẫn triển khai GitHub Pages

Tài liệu này hướng dẫn chi tiết cách triển khai ứng dụng phân tích khuôn mặt lên GitHub Pages, một nền tảng hosting miễn phí cho các trang web tĩnh.

## Lưu ý quan trọng

GitHub Pages chỉ hỗ trợ hosting các trang web tĩnh, không hỗ trợ backend. Do đó, khi triển khai trên GitHub Pages, chúng ta cần một giải pháp riêng cho phần backend API proxy. Có hai cách tiếp cận:

1. Sử dụng Vercel Serverless Functions cho phần backend (khuyến nghị)
2. Sử dụng một dịch vụ backend riêng biệt (như Heroku, Render, hoặc Railway)

Tài liệu này sẽ tập trung vào việc triển khai phần frontend lên GitHub Pages và sử dụng Vercel Serverless Functions cho phần backend.

## Yêu cầu

- Tài khoản GitHub
- Git được cài đặt trên máy tính
- Node.js và npm được cài đặt trên máy tính

## Bước 1: Chuẩn bị mã nguồn

1. Tạo một repository GitHub mới với tên `face-analysis-app`
2. Clone repository về máy tính của bạn:

```bash
git clone https://github.com/your-username/face-analysis-app.git
cd face-analysis-app
```

3. Giải nén file `face_app_package.zip` (đã được cung cấp) vào thư mục repository
4. Cập nhật file `src/FaceAnalysisService.js` để sử dụng API proxy từ Vercel:

```javascript
// Thay đổi URL từ
const API_URL = 'http://localhost:3000/api';
// Thành URL của Vercel Serverless Function (sẽ được tạo ở bước 3)
const API_URL = 'https://your-backend-app.vercel.app/api';
```

## Bước 2: Cấu hình cho GitHub Pages

1. Tạo file `vite.config.ts` mới với nội dung sau:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/face-analysis-app/', // Tên repository GitHub của bạn
})
```

2. Tạo file `.github/workflows/deploy.yml` để thiết lập GitHub Actions:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

## Bước 3: Triển khai Backend API Proxy trên Vercel

1. Tạo một repository GitHub mới với tên `face-analysis-api`
2. Clone repository về máy tính của bạn:

```bash
git clone https://github.com/your-username/face-analysis-api.git
cd face-analysis-api
```

3. Tạo file `package.json`:

```json
{
  "name": "face-analysis-api",
  "version": "1.0.0",
  "description": "API proxy for Face++ services",
  "main": "api/index.js",
  "scripts": {
    "start": "node api/index.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "form-data": "^4.0.0"
  }
}
```

4. Tạo thư mục `api` và file `api/index.js`:

```javascript
const express = require('express');
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

// For local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for serverless
module.exports = app;
```

5. Tạo file `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" }
  ]
}
```

6. Cài đặt dependencies và push lên GitHub:

```bash
npm install
git add .
git commit -m "Initial commit"
git push origin main
```

7. Triển khai lên Vercel:
   - Đăng nhập vào [Vercel](https://vercel.com)
   - Nhấp vào "New Project"
   - Chọn repository `face-analysis-api`
   - Thêm biến môi trường:
     - `FACE_API_KEY`: API Key của Face++
     - `FACE_API_SECRET`: API Secret của Face++
   - Nhấp vào "Deploy"

8. Sau khi triển khai, bạn sẽ nhận được một URL (ví dụ: https://face-analysis-api.vercel.app)
9. Cập nhật `API_URL` trong `src/FaceAnalysisService.js` với URL này

## Bước 4: Triển khai Frontend lên GitHub Pages

1. Commit và push mã nguồn lên GitHub:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. GitHub Actions sẽ tự động build và triển khai ứng dụng lên GitHub Pages
3. Ứng dụng của bạn sẽ có sẵn tại: https://your-username.github.io/face-analysis-app/

## Bước 5: Kiểm tra ứng dụng

1. Truy cập URL của ứng dụng đã triển khai
2. Cho phép truy cập camera khi được yêu cầu
3. Kiểm tra các tính năng:
   - Nhận diện khuôn mặt thời gian thực
   - Phân tích giới tính và tuổi tác
   - Nhận diện cảm xúc
   - Phân tích nhân chủng học, sức khỏe làn da và trạng thái thể chất (thông qua Face++ API)

## Xử lý sự cố

- **Lỗi CORS**: Đảm bảo backend API đã được cấu hình đúng để chấp nhận yêu cầu từ domain GitHub Pages
- **Lỗi camera**: Đảm bảo bạn đang sử dụng HTTPS và đã cấp quyền truy cập camera
- **Lỗi API Face++**: Kiểm tra API Key và API Secret trong biến môi trường Vercel

## Cập nhật và bảo trì

Để cập nhật ứng dụng:
1. Thực hiện các thay đổi trong mã nguồn
2. Commit và push lên GitHub
3. GitHub Actions sẽ tự động triển khai phiên bản mới

## Tài nguyên bổ sung

- [Tài liệu GitHub Pages](https://docs.github.com/en/pages)
- [Tài liệu Vercel](https://vercel.com/docs)
- [Tài liệu Face++ API](https://console.faceplusplus.com/documents/5679127)
