# Kế Hoạch Triển Khai Tiếp Theo (Future Plan)

Dự án **English Decoder** hiện tại đã hoàn thành **Epic 1** (IPA Decoding) và **Epic 2** (Grammar Debugger) dưới dạng bản nguyên mẫu (Rapid Prototype) chạy Client-side. 

Dưới đây là các hạng mục (Backlog) chưa thực hiện và lộ trình cần làm tiếp theo dựa trên bản thiết kế gốc:

## 1. Nâng Cấp Kiến Trúc (Architecture Migration)
Để hệ thống có thể lưu trữ dữ liệu vĩnh viễn và mở rộng, chúng ta cần tiến hành chuyển đổi từ file HTML tĩnh sang kiến trúc thật:
- **Backend**: Khởi tạo Spring Boot 3 + Spring Security JWT.
- **Database**: PostgreSQL (Lưu trữ từ vựng, lịch sử bài test ngữ pháp, Error Logs).
- **Frontend**: Migrate `english-decoder.html` sang hệ sinh thái React + TypeScript.
- **Infrastructure**: Viết `docker-compose.yml` (tương thích ARM64 để chạy mượt trên máy chủ Oracle Cloud dòng Ampere A1).

## 2. Epic 3: IELTS Outliner (Tư Duy Diễn Đạt)
Giải quyết vấn đề "ngợp" thông tin khi viết bài luận hoặc cần diễn đạt đoạn văn dài.
- **Template Builder**: Trình soạn thảo hỗ trợ Markdown tự động sinh bộ khung (Skeleton) cho bài Essay (Intro, Body, Conclusion).
- **Logic Lock**: Tính năng khóa (lock) – Yêu cầu người dùng phải gạch đầu dòng (bullet points) xong ý tưởng trước khi mở khóa cho phép viết full-text.

## 3. Epic 4: Vocabulary Tech-Hub (Thực Chiến)
Nhúng tiếng Anh trực tiếp vào môi trường làm việc kỹ thuật hàng ngày của Lập trình viên.
- **Lưu trữ thuật ngữ chuyên ngành**: Xây dựng UI lưu từ vựng thu thập được từ Documentation, IDE logs.
- **Contextual Learning**: Validate yêu cầu bắt buộc: Mỗi từ vựng khi thêm vào hệ thống phải đi kèm ít nhất 1 câu ví dụ thực tế liên quan đến dự án đang code.

---
*Ghi chú: Các hạng mục này sẽ được triển khai trong Sprint 3 và các Sprint tiếp theo.*
