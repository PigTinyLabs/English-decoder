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

  // Firestore: lắng nghe dữ liệu của user + đếm người online
  listenToFirebase();
  startCloudPresence();

  // Khôi phục tab từ #hash sau cùng, khi mọi feature đã sẵn sàng
  initRouter();
})();
