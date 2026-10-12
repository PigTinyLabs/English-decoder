// ---- Vocabulary Notebook + Floating quick-add + highlight ----------------------
let vocabList = [];
let isReviewMode = false;

function saveVocab() {
  Store.set("vocab_notebook", vocabList);
  renderVocab();
}

// Thêm từ vào đầu sổ (dùng chung cho form, nút ➕ nổi và bài Chắp Bút).
function addVocab(word, mean = "") {
  const w = word.trim();
  if (!w) return false;
  vocabList.unshift({ word: w, mean: mean.trim() });
  saveVocab();
  return true;
}

function hasVocab(word) {
  const w = word.trim().toLowerCase();
  return vocabList.some(v => v.word.toLowerCase() === w);
}

function deleteVocab(index) {
  vocabList.splice(index, 1);
  saveVocab();
}

function renderVocab() {
  const container = document.getElementById("vocabListContainer");
  const countEl = document.getElementById("vocabCount");
  if (vocabList.length === 0) {
    container.innerHTML = `<div class="sub" style="text-align:center; padding: 20px;">Bạn chưa lưu từ nào.</div>`;
    countEl.textContent = "0 words saved";
    return;
  }
  countEl.textContent = `${vocabList.length} words saved`;
  container.innerHTML = vocabList.map((v, i) => `
    <div class="vocab-item">
      <div>
        <div class="vocab-word">${escapeHtml(v.word)}</div>
        <div class="vocab-mean ${isReviewMode ? 'hidden' : ''}" data-reveal>${escapeHtml(v.mean)}</div>
      </div>
      <div class="vocab-actions">
        <button class="btn-icon" data-speak="${i}" title="Đọc từ này">🔊</button>
        <button class="btn-icon" data-delete="${i}" style="color: var(--red); border-color: rgba(248,113,113,0.3);" title="Xóa">🗑</button>
      </div>
    </div>
  `).join("");
}

// Bọc các từ đã lưu trong text bằng <span class="vocab-hl"> để click xem nghĩa.
// Dùng một regex gộp (từ dài ưu tiên trước) để không match lại vào HTML vừa chèn.
function highlightVocab(text) {
  if (!text || vocabList.length === 0) return text;
  const meanings = {};
  vocabList.forEach(v => { if (v.word) meanings[v.word.toLowerCase()] = v.mean; });
  const words = Object.keys(meanings).sort((a, b) => b.length - a.length)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return text;
  const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi");
  return text.replace(regex, m => `<span class="vocab-hl" data-mean="${escapeHtml(meanings[m.toLowerCase()] || "")}">${m}</span>`);
}

function initVocab() {
  vocabList = Store.getJSON("vocab_notebook", []);

  const newVocabWord = document.getElementById("newVocabWord");
  const newVocabMean = document.getElementById("newVocabMean");
  const addVocabBtn = document.getElementById("addVocabBtn");
  const reviewVocabBtn = document.getElementById("reviewVocabBtn");

  addVocabBtn.addEventListener("click", () => {
    if (!addVocab(newVocabWord.value, newVocabMean.value)) return;
    newVocabWord.value = "";
    newVocabMean.value = "";
    newVocabWord.focus();
  });
  newVocabMean.addEventListener("keydown", e => { if (e.key === "Enter") addVocabBtn.click(); });

  document.getElementById("vocabListContainer").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-reveal]")) t.closest("[data-reveal]").classList.remove("hidden");
    const speakBtn = t.closest("[data-speak]");
    if (speakBtn) speak(vocabList[+speakBtn.dataset.speak].word);
    const delBtn = t.closest("[data-delete]");
    if (delBtn) deleteVocab(+delBtn.dataset.delete);
  });

  reviewVocabBtn.addEventListener("click", () => {
    isReviewMode = !isReviewMode;
    reviewVocabBtn.textContent = isReviewMode ? "Review Mode: ON (Click meaning to show)" : "Review Mode (Hide Meanings)";
    reviewVocabBtn.classList.toggle("ghost", !isReviewMode);
    if (isReviewMode) { reviewVocabBtn.style.background = "rgba(251,191,36,0.15)"; reviewVocabBtn.style.color = "var(--amber)"; reviewVocabBtn.style.borderColor = "var(--amber)"; }
    else { reviewVocabBtn.style.background = ""; reviewVocabBtn.style.color = ""; reviewVocabBtn.style.borderColor = ""; }
    renderVocab();
  });

  // ---- Floating quick-add -----------------------------------------------------
  const vocabModal = document.getElementById("vocabModal");
  const fabVocabWord = document.getElementById("fabVocabWord");
  const fabVocabMean = document.getElementById("fabVocabMean");

  document.getElementById("fabBtn").addEventListener("click", () => {
    vocabModal.classList.add("show");
    fabVocabWord.focus();
  });
  document.getElementById("fabCloseBtn").addEventListener("click", () => vocabModal.classList.remove("show"));
  document.getElementById("fabSaveBtn").addEventListener("click", () => {
    if (!addVocab(fabVocabWord.value, fabVocabMean.value)) return;
    vocabModal.classList.remove("show");
    fabVocabWord.value = "";
    fabVocabMean.value = "";
    // Render lại quiz để áp highlight cho từ mới
    if (todayQuizData && isTabActive("quiz")) renderQuiz();
  });

  // ---- Tooltip nghĩa của từ được highlight ---------------------------------------
  const vocabTooltip = document.getElementById("vocabTooltip");
  document.addEventListener("click", e => {
    const hl = e.target.closest(".vocab-hl");
    if (!hl) {
      vocabTooltip.classList.remove("show");
      return;
    }
    vocabTooltip.textContent = hl.dataset.mean;
    vocabTooltip.classList.add("show");
    const rect = hl.getBoundingClientRect();
    vocabTooltip.style.left = rect.left + (rect.width / 2) + "px";
    vocabTooltip.style.top = rect.top + "px";
  });

  onRemoteField("vocab_notebook", list => {
    vocabList = list;
    Store.setLocal("vocab_notebook", vocabList);
    renderVocab();
  });
  renderVocab();
}
