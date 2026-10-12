# English Decoder

Web app học tiếng Anh chạy hoàn toàn phía client (vanilla JS, không cần build), deploy lên GitHub Pages.

| Tab | Chức năng |
| --- | --- |
| 📖 Parser | Tra phiên âm IPA (dictionaryapi.dev) + puzzle ghép token IPA |
| 🔤 IPA Board | Bảng 44 âm IPA kèm khẩu hình động và audio chuẩn (`audio/`) |
| 🎤 Luyện Âm | Đọc từ vào mic, so khớp phiên âm với từ mục tiêu |
| 📝 Ngữ Pháp | Bóc tách S-V-O, quiz 5 thì, bảng thống kê lỗi |
| ✍️ Chắp Bút | Dịch câu Việt → Anh theo chủ đề, nghe lại câu vừa viết, đối đáp ôn tập |
| 📗 Đọc Truyện | Đọc truyện song ngữ: máy đọc, tự đọc to có chấm điểm, bật/tắt bản dịch, tra từ |
| 🧠 AI Quiz | Đề trắc nghiệm hằng ngày bằng Gemini + streak |
| 📚 Từ Vựng | Sổ từ vựng, chế độ ẩn nghĩa, highlight từ đã lưu trong quiz |

## Chạy local

```bash
cp env.js.example env.js   # điền key nếu cần (không có key → chế độ offline)
python3 -m http.server 8765
```

Mở http://localhost:8765. Có thể mở thẳng `index.html` qua `file://` (script không dùng ES module), nhưng mic và một số API cần chạy qua http.

## Cấu trúc

```
index.html                  # markup + thứ tự nạp script
english-decoder.html        # chuyển hướng sang index.html (giữ link cũ)
css/                        # base, từng feature, responsive (nạp cuối)
js/
  core/
    utils.js                # shuffle, escapeHtml, ngày tháng
    text.js                 # chuẩn hoá câu tiếng Anh, so khớp từ (LCS) — dùng chung Writing/Reading
    idb.js                  # IndexedDB (sách EPUB đã nhập — chỉ lưu trên máy)
    store.js                # Firebase + localStorage theo profile (Store.get/set, onRemoteField)
    profile.js              # màn chọn user, presence online
    audio.js                # TTS (speak, speakSequence, stopSpeaking) + nhận diện giọng nói (listenOnce)
    gemini.js               # Gemini client: proxy hoặc gọi thẳng, generate / generateJSON
    router.js               # tab + #hash, onTabShow()
  features/
    ipa.js parser.js practice.js grammar.js vocab.js quiz.js
    writing/
      curriculum.js         # danh sách tuần + quy ước dữ liệu câu
      lessons/week1-4.js    # 1000 câu: 4 tuần × 10 chủ đề × 25 câu (ngữ pháp, từ vựng, câu)
      engine.js             # chấm câu (AI / offline), lịch ôn Leitner, sinh thêm câu
      writing.js            # UI: danh sách chủ đề, viết câu, đọc lại, tổng kết bài
      dialogue.js           # chat đối đáp ôn tập
    reading/
      stories.js            # truyện song ngữ mẫu (tự viết)
      epub.js               # đọc EPUB (JSZip) → chương + cặp đoạn Anh/Việt
      drive.js              # danh sách truyện trên Google Drive + tải qua Drive API
      reader.js             # UI: thư viện, trình đọc, nghe máy đọc, song ngữ, tra từ
      readaloud.js          # 🎤 tự đọc to: nhận giọng liên tục, dò chữ, chấm điểm
  main.js                   # bootstrap: init từng feature theo thứ tự
tools/                      # gen_audio.py (sinh audio IPA bằng eSpeak), server.py (eSpeak API local)
```

Quy ước:
- Mỗi feature có một hàm `initXxx()`, chỉ `main.js` gọi; không chạy code ở top-level.
- Dữ liệu người dùng đi qua `Store` (key `${profile}_${name}`, tên field Firestore = `name`). Feature nào cần nhận dữ liệu từ cloud thì đăng ký `onRemoteField(name, handler)`.
- Script dùng chung global scope → không đặt trùng tên biến/hàm top-level giữa các file.

## Chắp Bút (Writing)

Lấy cảm hứng từ phương pháp *Chắp Bút 1000 câu Writing*: luyện viết bằng cách dịch câu Việt → Anh, mỗi chủ đề gắn một điểm ngữ pháp. Giáo trình **1000 câu** do dự án tự biên soạn: 4 tuần × 10 chủ đề × 25 câu (`lessons/week1.js` … `week4.js`), mỗi câu có đáp án chuẩn + các cách dịch khác được chấp nhận. Mỗi chủ đề còn có nút "Tạo thêm 8 câu" bằng Gemini.

Thêm câu mới: luôn thêm vào **cuối** mảng `sentences` — id câu là `${lessonId}-${số thứ tự}` nên đổi thứ tự / xoá câu sẽ làm lệch tiến độ đã lưu.

- **Chấm bài**: khớp đáp án mẫu (cho phép viết tắt, nhiều cách dịch trong `alt`) → chấm ngay; nếu không khớp và có Gemini → AI chấm, sửa câu, giải thích lỗi; không có Gemini → chấm bằng độ tương đồng từ.
- **Đọc lại**: sau khi chấm tự đọc câu (đúng → câu của bạn, sai → câu đã sửa); nghe câu gốc / bản tự nhiên / đọc chậm; 🎤 đọc theo và so khớp; cuối bài "Đọc lại cả bài".
- **Đối đáp ôn tập**: chặng 1 gia sư đưa lại câu tiếng Việt đã viết (đến hạn hoặc yếu nhất) để dịch lại; chặng 2 trò chuyện với AI dùng lại cấu trúc + từ vựng vừa học (offline: đặt câu với từ vựng).
- **Lịch ôn**: hộp Leitner 0–6, khoảng cách 0/1/2/4/7/15/30 ngày. Lỗi được ghi vào bảng thống kê ở tab Ngữ Pháp.

Dữ liệu: `writing_progress`, `writing_extra` (đồng bộ Firestore), `writing_settings` (chỉ local).

## Đọc Truyện (Reading)

- **Thư viện**:
  - **📂 Truyện từ Drive** (`reading/drive.js`): 9 cuốn trong thư mục Google Drive chia sẻ công khai. Repo chỉ lưu id file; lần mở đầu app tải EPUB qua Google Drive API rồi lưu vào IndexedDB. Cần `DRIVE_API_KEY` (API key GCP đã bật *Google Drive API*, thêm vào GitHub Secrets). Chưa có key thì thẻ sách hướng dẫn tải tay → 📥 Nhập EPUB (file trùng tên tự gắn vào kệ Drive).
  - **Truyện mẫu**: 3 truyện song ngữ ngắn tự viết.
  - **Sách của bạn**: EPUB tự nhập.
  - Nội dung sách chỉ lưu trong IndexedDB của trình duyệt, **không** đưa lên repo hay Firebase (truyện có bản quyền; repo deploy public). `*.epub` đã nằm trong `.gitignore`.
- **Tách song ngữ**: đoạn có chữ cái riêng của tiếng Việt → bản dịch. Mỗi chương thử ghép cả hai chiều (Anh→Việt và Việt→Anh), chọn chiều khớp hơn theo tên riêng/con số trùng nhau và tỉ lệ độ dài. Lọc dòng nhiễu kiểu "Dịch bởi…", "Link:", URL.
- **🔊 Nghe đọc**: đọc từng câu, tô sáng câu đang đọc, tự cuộn và sang chương sau; chỉnh tốc độ 0.75–1.25×; tuỳ chọn 🇻🇳 đọc kèm bản dịch (giọng tiếng Việt của trình duyệt).
- **🎤 Tự đọc**: đọc to như đọc truyện; chữ đọc đúng sáng xanh, chữ bỏ sót gạch đỏ; hết đoạn tự chấm % và sang đoạn kế. Cần Chrome/Edge + quyền micro.
- **Song ngữ**: BẬT → hiện bản dịch dưới mỗi đoạn; TẮT → chế độ tự đọc hiểu, bấm 👁 để xem nghĩa từng đoạn. Đoạn chưa có bản dịch có nút 🤖 dịch bằng Gemini (lưu lại vào sách).
- **Tra từ**: bấm vào từ → phát âm, IPA, định nghĩa (dictionaryapi.dev), lưu vào sổ Từ Vựng.

Dữ liệu: `reading_settings` (local), `reading_progress` (vị trí đọc + điểm tự đọc, đồng bộ Firestore).
