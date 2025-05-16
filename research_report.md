## Báo cáo Nghiên cứu và Triển khai Tính năng Phân tích Khuôn mặt Nâng cao

### Tổng quan

Báo cáo này trình bày kết quả nghiên cứu và triển khai các tính năng phân tích khuôn mặt nâng cao cho ứng dụng web phân tích khuôn mặt thời gian thực, bao gồm nhận diện nhân chủng học, phân tích sức khỏe làn da và trạng thái thể chất.

### Tính năng đã triển khai thành công

1. **Nhận diện khuôn mặt thời gian thực** sử dụng thư viện face-api.js
2. **Phân tích tuổi và giới tính** với độ chính xác cao
3. **Nhận diện cảm xúc cơ bản** (vui, buồn, tức giận, ngạc nhiên, sợ hãi, ghê tởm, trung tính)
4. **Giao diện người dùng tối giản, hiện đại** và tối ưu hóa cho thiết bị di động

### Thách thức với các tính năng nâng cao

#### 1. Nhận diện nhân chủng học

- **Thư viện face-api.js hiện tại không hỗ trợ** nhận diện nhân chủng học.
- **DeepFace** là một thư viện Python có khả năng phân tích nhân chủng học, nhưng không có phiên bản JavaScript tương đương.
- **Các API thương mại** như Microsoft Azure Face API, Amazon Rekognition, và Face++ có hỗ trợ nhận diện nhân chủng học nhưng yêu cầu kết nối đến máy chủ backend và có chi phí sử dụng.

#### 2. Phân tích sức khỏe làn da và trạng thái thể chất

- Không có giải pháp mã nguồn mở nào hỗ trợ phân tích sức khỏe làn da hoặc trạng thái thể chất trực tiếp trên trình duyệt.
- Các giải pháp thương mại thường yêu cầu API chuyên biệt và xử lý phía máy chủ.

### Giải pháp đã triển khai

1. **Mô hình giả lập (EthnicityAnalyzer)**: Đã phát triển một mô-đun giả lập sử dụng TensorFlow.js và MobileNet để minh họa cách thức hoạt động của các tính năng nâng cao. Mô-đun này trả về kết quả ngẫu nhiên cho mục đích minh họa.

2. **Tích hợp vào giao diện người dùng**: Đã tích hợp mô-đun giả lập vào ứng dụng chính, hiển thị kết quả phân tích nhân chủng học, sức khỏe làn da và trạng thái thể chất trong giao diện người dùng.

### Hướng phát triển tiếp theo

#### Phương án 1: Phát triển mô hình tùy chỉnh với TensorFlow.js

- **Ưu điểm**: Hoạt động hoàn toàn phía client, không cần máy chủ backend.
- **Nhược điểm**: Yêu cầu tập dữ liệu lớn đã được gán nhãn, thời gian phát triển dài, và có thể không đạt độ chính xác cao như các giải pháp thương mại.
- **Yêu cầu**:
  - Thu thập tập dữ liệu khuôn mặt đa dạng với nhãn nhân chủng học
  - Huấn luyện mô hình phân loại sử dụng transfer learning từ MobileNet
  - Tối ưu hóa mô hình để chạy hiệu quả trên trình duyệt

#### Phương án 2: Phát triển máy chủ backend với DeepFace

- **Ưu điểm**: Tận dụng được thư viện DeepFace đã được phát triển tốt với độ chính xác cao.
- **Nhược điểm**: Yêu cầu máy chủ backend, chi phí vận hành, và độ trễ khi phân tích.
- **Yêu cầu**:
  - Phát triển API backend sử dụng Python và DeepFace
  - Triển khai máy chủ và cấu hình bảo mật
  - Tích hợp gọi API từ ứng dụng web

#### Phương án 3: Sử dụng API thương mại

- **Ưu điểm**: Độ chính xác cao, phát triển nhanh, hỗ trợ nhiều tính năng.
- **Nhược điểm**: Chi phí sử dụng, phụ thuộc vào nhà cung cấp bên thứ ba, yêu cầu kết nối internet.
- **Các API tiềm năng**:
  - Microsoft Azure Face API
  - Amazon Rekognition
  - Face++
  - Clarifai

### Kết luận

Phiên bản hiện tại của ứng dụng đã triển khai thành công các tính năng cơ bản và cung cấp một mô hình giả lập cho các tính năng nâng cao. Để phát triển các tính năng nâng cao với độ chính xác thực tế, cần lựa chọn một trong ba phương án nêu trên dựa trên yêu cầu về độ chính xác, chi phí và thời gian phát triển.

Chúng tôi khuyến nghị bắt đầu với Phương án 2 (Backend với DeepFace) nếu muốn có kết quả nhanh chóng với độ chính xác tốt, hoặc Phương án 3 (API thương mại) nếu ưu tiên độ chính xác và độ tin cậy cao nhất.
