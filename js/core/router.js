// ---- Tab navigation (#tab_xxx) ------------------------------------------------
const tabShowHooks = {};
function onTabShow(tabName, fn) { tabShowHooks[tabName] = fn; }

function activateTab(tabName) {
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (!tab) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  tab.classList.add("active");
  document.getElementById("panel-" + tabName).classList.add("active");
  tabShowHooks[tabName]?.();
}

function isTabActive(tabName) {
  return document.getElementById("panel-" + tabName)?.classList.contains("active");
}

function initRouter() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      history.replaceState(null, "", "#tab_" + tabName);
      activateTab(tabName);
    });
  });

  // Khôi phục tab từ URL hash khi tải trang
  const hashTab = window.location.hash.replace("#tab_", "");
  if (hashTab && document.querySelector(`.tab[data-tab="${hashTab}"]`)) {
    activateTab(hashTab);
  }
}
