// ---- Reading: truyện song ngữ từ thư mục Google Drive chia sẻ công khai -----------------------
// Repo không chứa nội dung sách: chỉ lưu id file. Khi người dùng mở, app tải EPUB từ Drive,
// tách song ngữ bằng parseEpub và lưu vào IndexedDB.
// Trình duyệt chỉ tải được qua Google Drive API (có CORS) → cần DRIVE_API_KEY trong env.js
// (API key của project GCP đã bật "Google Drive API"). Không có key thì hướng dẫn tải tay rồi Nhập EPUB.

const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1vEnpmnavxwOf6fk_UxbwVylg5SMpzsrX";

const DRIVE_BOOKS = [
  { driveId: "1wFFE27yESG17jrcXdKtEkij2VzK-RsV-", title: "Diary of a Wimpy Kid", titleVi: "Nhật ký chú bé nhút nhát · Tập 1", cover: "📓", size: "276 KB" },
  { driveId: "1CjzZ0mttk7b4s-veYwvMlcfTMle6naLg", title: "Rodrick Rules", titleVi: "Tập 2 · Luật của Rodrick", cover: "🥁", size: "140 KB" },
  { driveId: "1HX6p4rHuyMMPbhWx7PkPLsghrkskufSv", title: "The Last Straw", titleVi: "Tập 3", cover: "🥤", size: "237 KB" },
  { driveId: "1532wJmhBlarWRnZGjQm9gXZI1y2Ik3pJ", title: "Dog Days", titleVi: "Tập 4", cover: "🐶", size: "129 KB" },
  { driveId: "1pAbZQr-Qa9SJ0O0eqOwwOJl8NBXmpEI1", title: "The Ugly Truth", titleVi: "Tập 5", cover: "🪞", size: "286 KB" },
  { driveId: "1L4T4pqWckbJQXRaEc0xEbESwCBuCwLTJ", title: "Cabin Fever", titleVi: "Tập 6 · Mắc kẹt", cover: "❄️", size: "4.5 MB" },
  { driveId: "14LuIeDxn9NG-_783PK33godLBcy-_L53", title: "The Third Wheel", titleVi: "Tập 7 · Kỳ đà cản mũi", cover: "🚲", size: "136 KB" },
  { driveId: "1W6ccDuMQ0BXmhyeye5TC3EdTp6YwqLcA", title: "Hard Luck", titleVi: "Tập 8 · Thánh nhọ", cover: "🎱", size: "408 KB" },
  { driveId: "1gVuhEVyBl6kKQPcLNP6MMpDBx_UJPTsT", title: "Speak English Like an American", titleVi: "Nói tiếng Anh như người Mỹ", cover: "🗽", size: "135 KB" },
];

function driveBookId(driveId) { return `drive-${driveId}`; }

function driveFileUrl(driveId) { return `https://drive.google.com/file/d/${driveId}/view`; }

function driveApiKey() {
  return (window.ENV?.DRIVE_API_KEY || window.ENV?.FIREBASE_API_KEY || "").trim();
}

async function fetchDriveFile(driveId) {
  const id = encodeURIComponent(driveId);
  const key = driveApiKey();
  const urls = [];
  if (key) urls.push(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(key)}`);
  urls.push(`https://drive.usercontent.google.com/download?id=${id}&export=download`);

  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.blob();
      lastError = new Error(`Drive trả về lỗi ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(key
    ? `Không tải được từ Drive (${lastError?.message}). Kiểm tra API key đã bật Google Drive API chưa.`
    : "Trình duyệt chưa tải thẳng được từ Drive (cần DRIVE_API_KEY).");
}

async function downloadDriveBook(meta) {
  const blob = await fetchDriveFile(meta.driveId);
  const book = await parseEpub(new File([blob], `${meta.title}.epub`));
  // Giữ id / tên ổn định theo file Drive để tiến độ đọc không đổi khi tải lại
  return {
    ...book,
    id: driveBookId(meta.driveId),
    title: meta.title,
    titleVi: meta.titleVi,
    cover: meta.cover,
    source: "drive",
    driveId: meta.driveId,
  };
}
