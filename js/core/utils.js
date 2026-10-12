// ---- Shared helpers ---------------------------------------------------------
// Các script trong /js là classic script (không phải ES module) để app vẫn chạy
// được khi mở trực tiếp qua file:// — mọi khai báo top-level dùng chung global scope.

let idc = 0;
function nextId() { return idc++; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Định dạng ngày không đệm số 0 (VD "2026-10-5") — giữ nguyên vì quiz_history đã lưu theo format này.
function getTodayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Ngày ISO (YYYY-MM-DD) — so sánh chuỗi được, dùng cho lịch ôn tập.
function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
