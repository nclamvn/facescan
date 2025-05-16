# Kế hoạch tích hợp Face++ API

## Tổng quan
Tài liệu này trình bày kế hoạch tích hợp Face++ API vào ứng dụng phân tích khuôn mặt để bổ sung các tính năng nâng cao như nhận diện nhân chủng học, phân tích sức khỏe làn da và trạng thái thể chất.

## Các tính năng Face++ API cần tích hợp
1. **Detect API** - Phát hiện khuôn mặt và trích xuất thông tin cơ bản
2. **Face Analyze API** - Phân tích chi tiết các thuộc tính khuôn mặt
   - Nhân chủng học (ethnicity)
   - Sức khỏe làn da (skinstatus)
   - Trạng thái cảm xúc (emotion)
   - Các thuộc tính khác (beauty, mouthstatus, eyegaze)

## Kiến trúc tích hợp

### 1. Backend Proxy API
Để bảo vệ API Key và xử lý các yêu cầu đến Face++, chúng ta sẽ tạo một backend proxy API đơn giản:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const FACE_API_KEY = process.env.FACE_API_KEY;
const FACE_API_SECRET = process.env.FACE_API_SECRET;
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
    console.error('Error calling Face++ API:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Endpoint để phân tích khuôn mặt chi tiết hơn (nếu cần)
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
    console.error('Error calling Face++ API:', error);
    res.status(500).json({ error: 'Failed to analyze face' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Cập nhật Frontend

Cập nhật ứng dụng React để tích hợp với backend proxy API:

```javascript
// FaceAnalysisService.js
export class FaceAnalysisService {
  constructor(apiUrl = 'http://localhost:3000/api') {
    this.apiUrl = apiUrl;
  }

  async detectFace(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);

      const response = await fetch(`${this.apiUrl}/detect`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to detect face');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in face detection:', error);
      throw error;
    }
  }

  async analyzeFace(faceToken) {
    try {
      const response = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ face_token: faceToken })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze face');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in face analysis:', error);
      throw error;
    }
  }

  // Phương thức trích xuất thông tin nhân chủng học
  extractEthnicity(faceAttributes) {
    if (!faceAttributes || !faceAttributes.ethnicity) {
      return { ethnicity: 'Không xác định', confidence: 0 };
    }

    const ethnicity = faceAttributes.ethnicity.value;
    const confidence = faceAttributes.ethnicity.confidence;
    
    // Chuyển đổi sang tiếng Việt
    const ethnicityMap = {
      'ASIAN': 'Châu Á',
      'WHITE': 'Châu Âu',
      'BLACK': 'Châu Phi',
      'INDIA': 'Nam Á'
    };

    return {
      ethnicity: ethnicityMap[ethnicity] || ethnicity,
      confidence: confidence
    };
  }

  // Phương thức trích xuất thông tin sức khỏe làn da
  extractSkinHealth(faceAttributes) {
    if (!faceAttributes || !faceAttributes.skinstatus) {
      return { skinHealth: 'Không xác định', confidence: 0 };
    }

    const skinStatus = faceAttributes.skinstatus;
    
    // Tính toán trạng thái da tổng thể dựa trên các chỉ số
    const healthScore = 100 - (
      (skinStatus.dark_circle || 0) + 
      (skinStatus.stain || 0) + 
      (skinStatus.acne || 0) + 
      (skinStatus.health || 0)
    ) / 4;

    let skinHealth = 'Khỏe mạnh';
    if (healthScore < 40) skinHealth = 'Cần cải thiện';
    else if (healthScore < 60) skinHealth = 'Trung bình';
    else if (healthScore < 80) skinHealth = 'Tốt';

    return {
      skinHealth,
      confidence: healthScore / 100
    };
  }

  // Phương thức trích xuất thông tin trạng thái thể chất
  extractPhysicalState(faceAttributes) {
    if (!faceAttributes || !faceAttributes.emotion) {
      return { physicalState: 'Không xác định', confidence: 0 };
    }

    const emotion = faceAttributes.emotion;
    
    // Đánh giá trạng thái thể chất dựa trên cảm xúc
    let physicalState = 'Khỏe mạnh';
    let confidence = 0.7;
    
    if (emotion.sadness > 50 || emotion.anger > 50 || emotion.fear > 50) {
      physicalState = 'Căng thẳng';
      confidence = Math.max(emotion.sadness, emotion.anger, emotion.fear) / 100;
    } else if (emotion.neutral > 70) {
      physicalState = 'Bình thường';
      confidence = emotion.neutral / 100;
    } else if (emotion.happiness > 50) {
      physicalState = 'Khỏe mạnh';
      confidence = emotion.happiness / 100;
    }

    return {
      physicalState,
      confidence
    };
  }
}
```

### 3. Cập nhật App.tsx

```javascript
// Trong App.tsx, thêm tích hợp với FaceAnalysisService
import { FaceAnalysisService } from './FaceAnalysisService';

function App() {
  // ... code hiện tại ...
  const [faceAnalysisService] = useState(new FaceAnalysisService());
  
  // Trong useEffect xử lý phân tích khuôn mặt
  useEffect(() => {
    // ... code hiện tại ...
    
    intervalId = window.setInterval(async () => {
      if (video.readyState >= 3) {
        // ... code phát hiện khuôn mặt hiện tại ...
        
        if (detections && detections.length > 0) {
          // ... code xử lý kết quả hiện tại ...
          
          // Thêm xử lý phân tích nâng cao với Face++ API
          try {
            // Tạo canvas tạm thời để cắt khuôn mặt
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            const box = detections[0].detection.box;
            tempCanvas.width = box.width;
            tempCanvas.height = box.height;
            tempContext.drawImage(
              video, 
              box.x, box.y, box.width, box.height,
              0, 0, box.width, box.height
            );
            
            // Chuyển đổi canvas thành blob
            const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));
            
            // Gọi API Face++
            const faceResult = await faceAnalysisService.detectFace(blob);
            
            if (faceResult.faces && faceResult.faces.length > 0) {
              const faceAttributes = faceResult.faces[0].attributes;
              
              // Trích xuất thông tin nâng cao
              const ethnicityResult = faceAnalysisService.extractEthnicity(faceAttributes);
              const skinHealthResult = faceAnalysisService.extractSkinHealth(faceAttributes);
              const physicalStateResult = faceAnalysisService.extractPhysicalState(faceAttributes);
              
              // Cập nhật kết quả phân tích
              setAnalysisResults({
                age: Math.round(age),
                gender: gender,
                genderProbability: Math.round(genderProbability * 100),
                expression: primaryExpression,
                ethnicity: ethnicityResult.ethnicity,
                skinHealth: skinHealthResult.skinHealth,
                physicalState: physicalStateResult.physicalState,
              });
            }
          } catch (err) {
            console.error('Error analyzing with Face++ API:', err);
            // Fallback to current results if API fails
            setAnalysisResults({
              age: Math.round(age),
              gender: gender,
              genderProbability: Math.round(genderProbability * 100),
              expression: primaryExpression,
              ethnicity: 'Đang phát triển',
              skinHealth: 'Đang phát triển',
              physicalState: 'Đang phát triển',
            });
          }
        } else {
          setAnalysisResults(null);
        }
      }
    }, 200);
    
    // ... code cleanup hiện tại ...
  }, [loadingModels, error, isCameraReady, faceAnalysisService]);
  
  // ... code hiện tại ...
}
```

## Các bước triển khai

1. **Đăng ký tài khoản Face++**
   - Tạo tài khoản tại https://www.faceplusplus.com/
   - Lấy API Key và API Secret

2. **Thiết lập Backend Proxy API**
   - Tạo thư mục `server` trong dự án
   - Cài đặt các dependencies cần thiết: express, axios, multer, form-data, cors, dotenv
   - Tạo file `.env` để lưu trữ API Key và Secret
   - Triển khai server.js như mẫu ở trên

3. **Cập nhật Frontend**
   - Tạo FaceAnalysisService.js
   - Cập nhật App.tsx để tích hợp với service mới
   - Cập nhật giao diện người dùng để hiển thị kết quả phân tích nâng cao

4. **Kiểm thử và tối ưu hóa**
   - Kiểm tra hiệu suất và độ chính xác của API
   - Tối ưu hóa tần suất gọi API để tránh vượt quá giới hạn gói Free
   - Thêm xử lý lỗi và trạng thái loading

5. **Triển khai**
   - Triển khai backend proxy API
   - Cập nhật URL API trong frontend
   - Kiểm thử toàn diện trước khi bàn giao

## Lưu ý quan trọng

1. **Giới hạn API**: Gói Free của Face++ có giới hạn 1.000 API calls/tháng. Cần tối ưu hóa tần suất gọi API để tránh vượt quá giới hạn.

2. **Bảo mật**: API Key và Secret cần được bảo vệ và không nên đưa vào mã nguồn frontend.

3. **Xử lý lỗi**: Cần xử lý các trường hợp lỗi khi gọi API, như mạng không ổn định, vượt quá giới hạn API, v.v.

4. **Độ trễ**: Việc gọi API bên ngoài sẽ tạo ra độ trễ trong ứng dụng. Cần cân nhắc UX để thông báo cho người dùng khi đang xử lý.
