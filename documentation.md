# Tài liệu Hướng dẫn Sử dụng và Bảo trì

## Ứng dụng Phân tích Khuôn mặt Thông minh

### 1. Tổng quan

Ứng dụng Phân tích Khuôn mặt Thông minh là một website với giao diện tối giản, hiện đại, được tối ưu hóa cho smartphone, cho phép quét ảnh khuôn mặt thời gian thực bằng camera để xác định:

- Giới tính
- Tuổi tác
- Nhân chủng học
- Tình trạng sức khỏe làn da
- Trạng thái thể chất
- Trạng thái tinh thần (cảm xúc)

### 2. Kiến trúc hệ thống

Ứng dụng được xây dựng với kiến trúc hai thành phần chính:

1. **Frontend**: Ứng dụng React với giao diện người dùng tối giản, đáp ứng (responsive)
   - Sử dụng face-api.js cho phân tích cơ bản (giới tính, tuổi, cảm xúc)
   - Kết nối với backend proxy API cho các tính năng nâng cao

2. **Backend Proxy API**: Máy chủ Express.js làm trung gian với Face++ API
   - Bảo vệ API Key và Secret
   - Xử lý các yêu cầu phân tích khuôn mặt nâng cao

### 3. Cài đặt và Triển khai

#### 3.1. Yêu cầu hệ thống

- Node.js 14.0.0 trở lên
- NPM hoặc PNPM
- Trình duyệt hiện đại hỗ trợ WebRTC (Chrome, Firefox, Safari, Edge)

#### 3.2. Cài đặt môi trường phát triển

```bash
# Clone repository (nếu có)
git clone <repository-url>
cd face-analysis-app

# Cài đặt dependencies cho frontend
npm install

# Cài đặt dependencies cho backend
cd server
npm install
cd ..
```

#### 3.3. Cấu hình Face++ API

1. Đăng ký tài khoản tại https://www.faceplusplus.com/
2. Tạo ứng dụng mới và lấy API Key và API Secret
3. Cập nhật tệp `.env` trong thư mục `server`:

```
FACE_API_KEY=your_api_key_here
FACE_API_SECRET=your_api_secret_here
PORT=3000
```

#### 3.4. Chạy ứng dụng trong môi trường phát triển

```bash
# Khởi động backend
cd server
node server.js

# Trong terminal khác, khởi động frontend
cd face-analysis-app
npm run dev
```

#### 3.5. Triển khai lên môi trường sản xuất

**Backend:**
```bash
cd server
npm install --production
# Sử dụng PM2 hoặc công cụ tương tự để chạy server.js
pm2 start server.js --name face-analysis-backend
```

**Frontend:**
```bash
npm run build
# Triển khai thư mục build lên máy chủ web (Nginx, Apache, v.v.)
```

### 4. Sử dụng ứng dụng

1. Truy cập website qua URL đã triển khai
2. Cấp quyền truy cập camera khi được yêu cầu
3. Đặt khuôn mặt trong khung hình camera
4. Xem kết quả phân tích hiển thị bên cạnh khung hình camera

### 5. Tính năng chi tiết

#### 5.1. Phân tích cơ bản (face-api.js)

- **Nhận diện khuôn mặt**: Phát hiện và đánh dấu khuôn mặt trong khung hình
- **Giới tính**: Xác định giới tính (Nam/Nữ) với độ tin cậy
- **Tuổi tác**: Ước tính tuổi dựa trên đặc điểm khuôn mặt
- **Cảm xúc**: Nhận diện cảm xúc cơ bản (vui, buồn, tức giận, ngạc nhiên, sợ hãi, ghê tởm, trung tính)

#### 5.2. Phân tích nâng cao (Face++ API)

- **Nhân chủng học**: Xác định nhóm nhân chủng học (Châu Á, Châu Âu, Châu Phi, Nam Á)
- **Sức khỏe làn da**: Đánh giá tình trạng da dựa trên các chỉ số như quầng thâm, vết thâm, mụn
- **Trạng thái thể chất**: Đánh giá dựa trên biểu hiện cảm xúc và các đặc điểm khuôn mặt

### 6. Giới hạn và lưu ý

- **Giới hạn API**: Gói Free của Face++ có giới hạn 1.000 API calls/tháng
- **Độ chính xác**: Kết quả phân tích chỉ mang tính tham khảo, không nên sử dụng cho mục đích y tế hoặc pháp lý
- **Ánh sáng**: Hiệu suất nhận diện tốt nhất trong điều kiện ánh sáng đầy đủ
- **Góc nhìn**: Khuôn mặt nên hướng thẳng vào camera để có kết quả chính xác nhất

### 7. Bảo trì và nâng cấp

#### 7.1. Cập nhật dependencies

```bash
# Cập nhật dependencies frontend
npm update

# Cập nhật dependencies backend
cd server
npm update
```

#### 7.2. Nâng cấp gói Face++ API

Nếu lượng sử dụng vượt quá giới hạn gói Free (1.000 API calls/tháng), bạn có thể nâng cấp lên gói trả phí:

1. Đăng nhập vào tài khoản Face++
2. Chọn gói phù hợp với nhu cầu sử dụng
3. Không cần thay đổi mã nguồn, chỉ cần cập nhật gói dịch vụ

#### 7.3. Mở rộng tính năng

Để thêm tính năng mới, bạn có thể:

- Tích hợp thêm các API khác từ Face++ (nhận diện nụ cười, nhận diện người nổi tiếng, v.v.)
- Thêm tính năng lưu trữ lịch sử phân tích (yêu cầu thêm cơ sở dữ liệu)
- Tích hợp với các dịch vụ AI khác để mở rộng khả năng phân tích

### 8. Xử lý sự cố

#### 8.1. Không thể truy cập camera

- Kiểm tra quyền truy cập camera trong trình duyệt
- Đảm bảo không có ứng dụng khác đang sử dụng camera
- Thử làm mới trang hoặc sử dụng trình duyệt khác

#### 8.2. Không hiển thị kết quả phân tích nâng cao

- Kiểm tra kết nối mạng
- Xác minh API Key và Secret trong tệp .env
- Kiểm tra giới hạn API calls của tài khoản Face++

#### 8.3. Độ chính xác thấp

- Đảm bảo ánh sáng đầy đủ
- Điều chỉnh góc camera để khuôn mặt hướng thẳng vào camera
- Tránh các vật che khuất khuôn mặt (kính râm, mũ, v.v.)

### 9. Liên hệ hỗ trợ

Nếu bạn gặp vấn đề hoặc cần hỗ trợ thêm, vui lòng liên hệ:

- Email: support@example.com
- Website: https://example.com/support

---

© 2025 - Phát triển bởi Manus AI. Mọi quyền được bảo lưu.
