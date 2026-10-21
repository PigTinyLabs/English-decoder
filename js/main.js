// ---- Bootstrap -----------------------------------------------------------------------
// Chạy sau khi mọi script khác đã tải (xem thứ tự <script> trong index.html).
(function main() {
  if (!initProfile()) return; // đang ở màn hình chọn user

  initTheme();
  initIpaBoard();
  initParser();
  initPractice();
  initGrammar();
  initVocab();
  initQuiz();
  initWriting();
  initReading();
  initIelts();

  // Khởi tạo và cập nhật chuỗi ngày học toàn hệ thống
  if (typeof updateStreakBadge === "function") {
    updateStreakBadge();
    document.getElementById("globalStreakBadge")?.addEventListener("click", () => {
      Streak?.showDetailsModal();
    });
    document.getElementById("streakBadge")?.addEventListener("click", () => {
      Streak?.showDetailsModal();
    });
  }

  // Firestore: lắng nghe dữ liệu của user + đếm người online
  listenToFirebase();
  startCloudPresence();

  // Khôi phục tab từ #hash sau cùng, khi mọi feature đã sẵn sàng
  initRouter();
})();
