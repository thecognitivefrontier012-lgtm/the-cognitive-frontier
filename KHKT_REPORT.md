# PHỤ LỤC KỸ THUẬT: KIẾN TRÚC HỆ THỐNG THE COGNITIVE FRONTIER

## 1. Kiến trúc tổng thể (Client-Side Zero-Backend Architecture)
Hệ thống được thiết kế theo mô hình **Web Application thuần (HTML5 / CSS3 / Vanilla ES6+)** chạy trực tiếp trên trình duyệt mà không phụ thuộc máy chủ trung gian, giúp tối ưu chi phí triển khai tại trường học và bảo mật dữ liệu người học qua `LocalStorage`.

## 2. Cơ chế RAG SGK (Retrieval-Augmented Generation)
* **Trích xuất dữ liệu (Ingestion):** Sử dụng thư viện `PDF.js` để đọc và phân tách văn bản trực tiếp từ file PDF Sách giáo khoa trên trình duyệt.
* **Truy xuất ngữ cảnh (Retrieval):** Thuật toán chấm điểm từ khóa (Keyword Scoring) đối chiếu câu hỏi của học sinh với kho tài liệu SGK đang kích hoạt để chọn ra đoạn văn bản có độ tương đồng cao nhất.
* **Tăng cường sinh câu trả lời (Augmented Generation):** Đoạn trích SGK được ghép vào System Prompt gửi tới mô hình **Gemini 2.5 Flash** kèm thiết lập tính cách gia sư, hạn chế tối đa hiện tượng "ảo giác AI" (Hallucination).

## 3. Thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2)
Mỗi thẻ Flashcard lưu trữ 3 tham số:
* `interval` ($I$): Khoảng cách ngày ôn tập tiếp theo.
* `ease` ($EF$): Hệ số dễ (khởi tạo mặc định $EF = 2.5$, tối thiểu $1.3$).
* `quality` ($q$): Mức độ ghi nhớ tự đánh giá của học sinh.

Công thức cập nhật hệ số dễ:
$$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$