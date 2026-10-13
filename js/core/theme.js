// ---- Giao diện sáng / tối ----------------------------------------------------------
// Chưa chọn thì theo hệ điều hành; đã chọn thì lưu localStorage("theme") (dùng chung mọi profile).
// <head> có script nhỏ đặt data-theme trước khi vẽ trang để không bị nháy màu.

function currentTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function updateThemeButton() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const dark = currentTheme() === "dark";
  btn.textContent = dark ? "☀️" : "🌙";
  btn.title = dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
}

function initTheme() {
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) { }
    updateThemeButton();
  });
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", updateThemeButton);
  updateThemeButton();
}
