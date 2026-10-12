// ---- Chắp Bút: giáo trình dịch Việt → Anh ------------------------------------------
// Lộ trình 4 tuần, mỗi chủ đề gắn với 1 điểm ngữ pháp. Câu mẫu do dự án tự biên soạn;
// có thể sinh thêm câu cho từng chủ đề bằng Gemini (lưu vào `writing_extra`).
//
// sentence: { vi, en, alt?: [] }  — `en` là đáp án chuẩn, `alt` là các cách dịch khác được chấp nhận.

const WRITING_WEEKS = [
  { id: 1, title: "Tuần 1 · Làm chủ câu đơn" },
  { id: 2, title: "Tuần 2 · Tình huống thường ngày" },
  { id: 3, title: "Tuần 3 · Câu hỏi & hội thoại" },
  { id: 4, title: "Tuần 4 · Bản thân & cuộc sống" },
];

// Các chủ đề nằm trong lessons/week1.js … week4.js (mỗi tuần 10 chủ đề × 25 câu = 1000 câu).
// Câu viết gọn dạng mảng: ["câu tiếng Việt", "đáp án chuẩn", "cách dịch khác 1", ...]
// hoặc dạng object { vi, en, alt }. Không đổi thứ tự / xoá câu cũ vì id câu = `${lesson.id}-${số thứ tự}`.
const WRITING_LESSONS = [];
