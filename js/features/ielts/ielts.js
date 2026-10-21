// ---- IELTS Test Taking & Management System ---------------------------------
// Quản lý bộ đề, thi thử với đồng hồ đếm ngược, chấm điểm chuẩn band IELTS,
// import/export JSON, sinh đề bằng AI và tích hợp sổ từ vựng.

let customIeltsTests = [];
let ieltsHistory = {};
let currentIeltsTest = null;
let currentIeltsAnswers = {};
let ieltsTimerId = null;
let ieltsSecondsLeft = 0;
let ieltsIsPaused = false;
let ieltsPassageFontSize = 16;
let ieltsSearchQuery = "";

// ---- Initialization --------------------------------------------------------
function initIelts() {
  const root = document.getElementById("ieltsRoot");
  if (!root) return;

  // Load custom tests and history from Store
  customIeltsTests = Store.getJSON("ielts_custom_tests", []);
  ieltsHistory = Store.getJSON("ielts_test_history", {});

  // Register remote handler if Firestore is active
  onRemoteField("ielts_custom_tests", (remoteTests) => {
    if (Array.isArray(remoteTests)) {
      customIeltsTests = remoteTests;
      if (!currentIeltsTest) renderIeltsDashboard();
    }
  });

  onRemoteField("ielts_test_history", (remoteHist) => {
    if (typeof remoteHist === "object" && remoteHist !== null) {
      ieltsHistory = remoteHist;
      if (!currentIeltsTest) renderIeltsDashboard();
    }
  });

  // Render initial library
  renderIeltsDashboard();

  // Handle text selection in passage for highlight & vocab
  initPassageTextSelection();
}

function getAllIeltsTests() {
  return [...DEFAULT_IELTS_TESTS, ...customIeltsTests];
}

function getIeltsTestById(id) {
  return getAllIeltsTests().find(t => t.id === id);
}

function saveCustomIeltsTests() {
  Store.set("ielts_custom_tests", customIeltsTests);
}

function saveIeltsHistory(testId, record) {
  if (!ieltsHistory[testId]) ieltsHistory[testId] = [];
  ieltsHistory[testId].unshift(record);
  // Keep last 15 attempts per test
  if (ieltsHistory[testId].length > 15) {
    ieltsHistory[testId] = ieltsHistory[testId].slice(0, 15);
  }
  Store.set("ielts_test_history", ieltsHistory);
}

function getBestScore(testId) {
  const records = ieltsHistory[testId];
  if (!records || records.length === 0) return null;
  return records.reduce((best, curr) => {
    return (!best || curr.band > best.band) ? curr : best;
  }, null);
}

// Tính Band Score chuẩn Academic Reading theo phần trăm số câu đúng
function calculateIeltsBand(correctCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  const ratio = correctCount / totalCount;
  if (ratio >= 0.96) return 9.0;
  if (ratio >= 0.91) return 8.5;
  if (ratio >= 0.84) return 8.0;
  if (ratio >= 0.76) return 7.5;
  if (ratio >= 0.68) return 7.0;
  if (ratio >= 0.60) return 6.5;
  if (ratio >= 0.52) return 6.0;
  if (ratio >= 0.44) return 5.5;
  if (ratio >= 0.36) return 5.0;
  if (ratio >= 0.28) return 4.5;
  if (ratio >= 0.20) return 4.0;
  if (ratio >= 0.12) return 3.5;
  return 3.0;
}

// ---- Render: Dashboard / Test Library --------------------------------------
function renderIeltsDashboard() {
  clearInterval(ieltsTimerId);
  currentIeltsTest = null;
  currentIeltsAnswers = {};

  const root = document.getElementById("ieltsRoot");
  if (!root) return;

  const allTests = getAllIeltsTests();
  const filteredTests = allTests.filter(t => {
    if (!ieltsSearchQuery) return true;
    const q = ieltsSearchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q));
  });

  root.innerHTML = `
    <div class="ielts-wrap">
      <div class="ielts-header">
        <div class="ielts-title-group">
          <h2>🎓 Luyện Thi IELTS Reading</h2>
          <p class="sub">Làm bài thi thử chuẩn format Cambridge, chấm điểm quy đổi Band Score tức thì, lưu lịch sử tiến độ.</p>
        </div>
        <div class="ielts-actions">
          <button class="btn" id="ieltsAiGenBtn" style="background: linear-gradient(135deg, #0284c7, #0d9488);">🤖 AI Tạo Đề Mới</button>
          <button class="btn" id="ieltsImportBtn">📥 Import Đề Thi</button>
          <button class="btn ghost" id="ieltsExportBtn">📤 Export JSON</button>
          <button class="btn ghost" id="ieltsTemplateBtn" title="Xem & tải file mẫu">📑 Mẫu JSON</button>
        </div>
      </div>

      <div class="ielts-filter-bar">
        <input type="text" class="input ielts-search-input" id="ieltsSearchInput" 
               placeholder="🔍 Tìm kiếm đề thi theo tên hoặc chủ đề..." value="${escapeHtml(ieltsSearchQuery)}" />
        <span class="sub" style="align-self: center; font-weight: 600;">Tổng số: ${allTests.length} bộ đề</span>
      </div>

      <div class="ielts-grid">
        ${filteredTests.map(test => renderTestCard(test)).join("")}
      </div>
    </div>
  `;

  // Attach dashboard events
  document.getElementById("ieltsSearchInput")?.addEventListener("input", (e) => {
    ieltsSearchQuery = e.target.value;
    renderIeltsDashboard();
    // Keep focus
    const input = document.getElementById("ieltsSearchInput");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  document.getElementById("ieltsImportBtn")?.addEventListener("click", openIeltsImportModal);
  document.getElementById("ieltsExportBtn")?.addEventListener("click", exportIeltsTests);
  document.getElementById("ieltsTemplateBtn")?.addEventListener("click", openIeltsTemplateModal);
  document.getElementById("ieltsAiGenBtn")?.addEventListener("click", openIeltsAIGeneratorModal);

  // Card action buttons
  root.querySelectorAll("[data-action='start']").forEach(btn => {
    btn.addEventListener("click", () => startIeltsTest(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='review']").forEach(btn => {
    btn.addEventListener("click", () => reviewLastAttempt(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='delete']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCustomIeltsTest(btn.dataset.id);
    });
  });
}

function renderTestCard(test) {
  const isCustom = test.id.startsWith("ielts_custom_");
  const best = getBestScore(test.id);
  const totalQuestions = test.questions?.length || 0;

  return `
    <div class="ielts-card ${isCustom ? 'custom-test' : ''}">
      <div class="ielts-card-top">
        <span class="ielts-badge">${escapeHtml(test.category || "Academic Reading")}</span>
        <span class="ielts-badge difficulty">${escapeHtml(test.difficulty || "Band 7.0")}</span>
        ${best ? `<span class="ielts-badge completed">Đã hoàn thành</span>` : ""}
      </div>

      <div class="ielts-card-title">${escapeHtml(test.title)}</div>
      <div class="ielts-card-desc">${escapeHtml(test.description || "Bài đọc học thuật chuẩn IELTS.")}</div>

      <div class="ielts-card-meta">
        <span>⏱️ ${test.durationMinutes || 20} phút</span>
        <span>❓ ${totalQuestions} câu hỏi</span>
        <span>📄 ${test.section || "Passage"}</span>
      </div>

      ${best ? `
        <div class="ielts-card-score-box">
          <span>Điểm cao nhất: <b>${best.correct}/${best.total}</b></span>
          <span class="band-val">Band ${best.band} 🏆</span>
        </div>
      ` : ""}

      <div class="ielts-card-actions">
        <button class="btn" data-action="start" data-id="${escapeHtml(test.id)}">
          ${best ? "🔄 Làm lại" : "🚀 Làm bài ngay"}
        </button>
        ${best ? `
          <button class="btn ghost" data-action="review" data-id="${escapeHtml(test.id)}" title="Xem lại lần làm gần nhất">
            👁️ Xem giải
          </button>
        ` : ""}
        ${isCustom ? `
          <button class="btn ghost" data-action="delete" data-id="${escapeHtml(test.id)}" 
                  style="color: var(--red); flex: 0 0 auto; padding: 0 10px;" title="Xóa đề này">🗑</button>
        ` : ""}
      </div>
    </div>
  `;
}

// ---- Exam Simulator & Timer -----------------------------------------------
function startIeltsTest(testId) {
  const test = getIeltsTestById(testId);
  if (!test) {
    alert("Không tìm thấy bộ đề!");
    return;
  }

  currentIeltsTest = test;
  currentIeltsAnswers = {};
  ieltsSecondsLeft = (test.durationMinutes || 20) * 60;
  ieltsIsPaused = false;

  renderExamRoom();
  startTimer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startTimer() {
  clearInterval(ieltsTimerId);
  updateTimerDisplay();

  ieltsTimerId = setInterval(() => {
    if (ieltsIsPaused) return;

    ieltsSecondsLeft--;
    updateTimerDisplay();

    if (ieltsSecondsLeft <= 0) {
      clearInterval(ieltsTimerId);
      alert("⏱️ Đã hết thời gian làm bài! Hệ thống sẽ tự động nộp bài và chấm điểm.");
      submitIeltsTest(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById("ieltsTimer");
  if (!timerEl) return;

  const mins = Math.floor(ieltsSecondsLeft / 60);
  const secs = ieltsSecondsLeft % 60;
  timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const timerBox = document.getElementById("ieltsTimerBox");
  if (timerBox) {
    if (ieltsSecondsLeft <= 180) { // < 3 mins
      timerBox.classList.add("warning");
    } else {
      timerBox.classList.remove("warning");
    }
  }
}

function toggleTimerPause() {
  ieltsIsPaused = !ieltsIsPaused;
  const pauseBtn = document.getElementById("ieltsPauseBtn");
  if (pauseBtn) {
    pauseBtn.textContent = ieltsIsPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng";
  }
}

// ---- Render: Exam Room (Split-screen) --------------------------------------
function renderExamRoom() {
  const root = document.getElementById("ieltsRoot");
  if (!root || !currentIeltsTest) return;

  const test = currentIeltsTest;
  const questions = test.questions || [];

  root.innerHTML = `
    <div class="ielts-wrap ielts-exam-room">
      <!-- Sticky Topbar -->
      <div class="ielts-exam-topbar">
        <div class="ielts-exam-topbar-left">
          <button class="btn ghost" id="ieltsExitBtn" style="padding: 6px 12px; font-size: 13px;">← Thoát</button>
          <div class="ielts-exam-title" title="${escapeHtml(test.title)}">${escapeHtml(test.title)}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <div class="ielts-timer-box" id="ieltsTimerBox">
            <span>⏱️</span>
            <span id="ieltsTimer">00:00</span>
          </div>
          <button class="btn ghost" id="ieltsPauseBtn" style="padding: 6px 10px; font-size: 12.5px;">⏸️ Tạm dừng</button>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <div class="ielts-exam-progress-bar">
            <span id="ieltsProgressText">0/${questions.length} câu</span>
            <div class="ielts-progress-track">
              <div class="ielts-progress-fill" id="ieltsProgressFill"></div>
            </div>
          </div>
          <button class="btn" id="ieltsSubmitBtn" style="background: var(--emerald); color: #000; font-weight: 700; padding: 8px 18px;">
            Nộp bài
          </button>
        </div>
      </div>

      <!-- Split View Layout -->
      <div class="ielts-split-view">
        <!-- Left: Passage -->
        <div class="ielts-passage-panel" id="ieltsPassagePanel">
          <div class="ielts-passage-tools">
            <span class="sub" style="font-weight: 600;">📖 BÀI ĐỌC (PASSAGE)</span>
            <div class="ielts-font-adjust">
              <span class="sub" style="font-size: 12px; margin-right: 4px;">Cỡ chữ:</span>
              <button class="btn ghost" id="ieltsFontDecBtn" style="padding: 3px 8px; font-size: 12px;">A-</button>
              <button class="btn ghost" id="ieltsFontIncBtn" style="padding: 3px 8px; font-size: 12px;">A+</button>
            </div>
          </div>

          <div class="ielts-passage-content" id="ieltsPassageContent" style="font-size: ${ieltsPassageFontSize}px;">
            <div class="ielts-passage-title">${escapeHtml(test.passage.title || test.title)}</div>
            ${test.passage.paragraphs.map(p => `
              <div class="ielts-paragraph" id="para-${p.id}">
                <span class="ielts-para-badge">[${escapeHtml(p.id)}]</span>
                ${highlightVocab(escapeHtml(p.text))}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Right: Questions -->
        <div class="ielts-questions-panel" id="ieltsQuestionsPanel">
          <!-- Question Palette -->
          <div class="ielts-palette">
            <div class="ielts-palette-title">
              <span>Bảng câu hỏi nhanh</span>
              <span class="sub" style="font-size: 11px;">Bấm số để cuộn tới câu</span>
            </div>
            <div class="ielts-palette-grid">
              ${questions.map((q, idx) => `
                <button class="ielts-palette-btn" id="pal-btn-${q.id}" data-target="q-card-${q.id}">
                  ${idx + 1}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Question Cards List -->
          <div class="ielts-questions-list">
            ${questions.map((q, idx) => renderQuestionCard(q, idx)).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Exam Events
  document.getElementById("ieltsExitBtn")?.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn thoát khỏi bài thi? Kết quả hiện tại sẽ không được lưu.")) {
      clearInterval(ieltsTimerId);
      renderIeltsDashboard();
    }
  });

  document.getElementById("ieltsPauseBtn")?.addEventListener("click", toggleTimerPause);

  document.getElementById("ieltsSubmitBtn")?.addEventListener("click", () => {
    submitIeltsTest(false);
  });

  document.getElementById("ieltsFontIncBtn")?.addEventListener("click", () => {
    if (ieltsPassageFontSize < 24) {
      ieltsPassageFontSize += 2;
      document.getElementById("ieltsPassageContent").style.fontSize = `${ieltsPassageFontSize}px`;
    }
  });

  document.getElementById("ieltsFontDecBtn")?.addEventListener("click", () => {
    if (ieltsPassageFontSize > 13) {
      ieltsPassageFontSize -= 2;
      document.getElementById("ieltsPassageContent").style.fontSize = `${ieltsPassageFontSize}px`;
    }
  });

  // Palette buttons scroll to question
  root.querySelectorAll(".ielts-palette-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        targetEl.style.borderColor = "var(--cyan)";
        setTimeout(() => { targetEl.style.borderColor = ""; }, 1200);
      }
    });
  });

  // Attach interactive question answering
  attachQuestionAnswerListeners();
}

function renderQuestionCard(q, idx) {
  let inputHtml = "";

  if (q.type === "multiple_choice" || q.type === "true_false_not_given" || q.type === "yes_no_not_given") {
    inputHtml = `
      <div class="ielts-options">
        ${q.opts.map(opt => `
          <div class="ielts-opt-btn" data-qid="${q.id}" data-val="${escapeHtml(opt)}">
            <div class="ielts-opt-circle"></div>
            <span>${escapeHtml(opt)}</span>
          </div>
        `).join("")}
      </div>
    `;
  } else if (q.type === "matching_headings") {
    inputHtml = `
      <select class="ielts-select-heading" data-qid="${q.id}">
        <option value="">-- Chọn Heading thích hợp --</option>
        ${q.opts.map(opt => `
          <option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>
        `).join("")}
      </select>
    `;
  } else {
    // Fill blank / short answer
    inputHtml = `
      <div class="ielts-fill-wrap">
        <input type="text" class="ielts-fill-input" data-qid="${q.id}" 
               placeholder="Nhập câu trả lời..." autocomplete="off" spellcheck="false" />
      </div>
    `;
  }

  return `
    <div class="ielts-q-card" id="q-card-${q.id}">
      ${q.instruction ? `<div class="ielts-q-instruction">${escapeHtml(q.instruction)}</div>` : ""}
      <div class="ielts-q-text">
        <span class="ielts-q-number">${idx + 1}.</span>
        ${escapeHtml(q.q)}
      </div>
      ${inputHtml}
    </div>
  `;
}

function attachQuestionAnswerListeners() {
  const root = document.getElementById("ieltsRoot");
  if (!root) return;

  // Options click (MCQ, TFNG)
  root.querySelectorAll(".ielts-opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const qId = btn.dataset.qid;
      const val = btn.dataset.val;

      currentIeltsAnswers[qId] = val;

      // Update UI selection
      root.querySelectorAll(`.ielts-opt-btn[data-qid="${qId}"]`).forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      updateProgressAndPalette(qId);
    });
  });

  // Select change (Matching Headings)
  root.querySelectorAll(".ielts-select-heading").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const qId = sel.dataset.qid;
      const val = e.target.value.trim();

      if (val) {
        currentIeltsAnswers[qId] = val;
      } else {
        delete currentIeltsAnswers[qId];
      }
      updateProgressAndPalette(qId);
    });
  });

  // Fill in the blanks (Input)
  root.querySelectorAll(".ielts-fill-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const qId = inp.dataset.qid;
      const val = e.target.value.trim();

      if (val) {
        currentIeltsAnswers[qId] = val;
      } else {
        delete currentIeltsAnswers[qId];
      }
      updateProgressAndPalette(qId);
    });
  });
}

function updateProgressAndPalette(qId) {
  if (!currentIeltsTest) return;
  const questions = currentIeltsTest.questions || [];
  const answeredCount = Object.keys(currentIeltsAnswers).length;
  const total = questions.length;

  // Update progress text & bar
  const progressText = document.getElementById("ieltsProgressText");
  const progressFill = document.getElementById("ieltsProgressFill");
  if (progressText && progressFill) {
    progressText.textContent = `${answeredCount}/${total} câu`;
    const pct = (answeredCount / total) * 100;
    progressFill.style.width = `${pct}%`;
  }

  // Update Palette button
  const palBtn = document.getElementById(`pal-btn-${qId}`);
  if (palBtn) {
    if (currentIeltsAnswers[qId]) {
      palBtn.classList.add("answered");
    } else {
      palBtn.classList.remove("answered");
    }
  }
}

// ---- Submit & Scoring ------------------------------------------------------
function submitIeltsTest(isTimeOut = false) {
  if (!currentIeltsTest) return;

  const questions = currentIeltsTest.questions || [];
  const total = questions.length;
  const answered = Object.keys(currentIeltsAnswers).length;

  if (!isTimeOut && answered < total) {
    const unans = total - answered;
    if (!confirm(`Bạn còn ${unans} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`)) {
      return;
    }
  }

  clearInterval(ieltsTimerId);

  // Compute Score
  let correctCount = 0;
  const details = [];

  questions.forEach(q => {
    const userAns = (currentIeltsAnswers[q.id] || "").trim();
    const isCorrect = checkAnswerMatch(userAns, q.ans);

    if (isCorrect) correctCount++;

    details.push({
      id: q.id,
      userAns,
      correctAns: q.ans,
      isCorrect,
      exp: q.exp,
      evidence: q.evidence
    });
  });

  const band = calculateIeltsBand(correctCount, total);
  const timeTaken = (currentIeltsTest.durationMinutes * 60) - ieltsSecondsLeft;

  const resultRecord = {
    testId: currentIeltsTest.id,
    date: isoDate(),
    correct: correctCount,
    total,
    band,
    timeTakenSeconds: timeTaken,
    answers: currentIeltsAnswers
  };

  saveIeltsHistory(currentIeltsTest.id, resultRecord);
  recordLearningActivity("ielts", { testId: currentIeltsTest.id, band });
  renderIeltsResult(resultRecord, details);
}

function checkAnswerMatch(user, target) {
  if (!user) return false;
  const u = user.trim().toLowerCase();

  if (Array.isArray(target)) {
    return target.some(t => t.trim().toLowerCase() === u);
  }

  const t = String(target).trim().toLowerCase();
  // Exact match
  if (u === t) return true;

  // For multiple choice where target might be "A. Something..." or just "A"
  if (t.startsWith(u + ".") || t.startsWith(u + " ")) return true;
  if (u.startsWith(t + ".") || u.startsWith(t + " ")) return true;

  // Normalized words match (handling slight punctuation)
  const normU = u.replace(/[^a-z0-9]/g, "");
  const normT = t.replace(/[^a-z0-9]/g, "");
  return normU === normT;
}

// ---- Render: Result & Review View ------------------------------------------
function renderIeltsResult(record, details) {
  const root = document.getElementById("ieltsRoot");
  if (!root || !currentIeltsTest) return;

  const test = currentIeltsTest;
  const questions = test.questions || [];
  const pct = Math.round((record.correct / record.total) * 100);
  const mins = Math.floor(record.timeTakenSeconds / 60);
  const secs = record.timeTakenSeconds % 60;

  root.innerHTML = `
    <div class="ielts-wrap">
      <!-- Result Banner -->
      <div class="ielts-result-banner">
        <div class="ielts-band-display">
          <span class="ielts-band-val">${record.band}</span>
          <span class="ielts-band-label">IELTS BAND</span>
        </div>
        <h2 style="margin: 0 0 6px 0;">Kết Quả Bài Thi: ${escapeHtml(test.title)}</h2>
        <p class="sub" style="margin: 0;">Độ chính xác: <b>${pct}%</b> • Đánh giá: <b>${getBandDescription(record.band)}</b></p>

        <div class="ielts-stats-row">
          <div class="ielts-stat-item">
            <div class="ielts-stat-num" style="color: var(--emerald);">${record.correct}/${record.total}</div>
            <div class="ielts-stat-desc">Số câu trả lời đúng</div>
          </div>
          <div class="ielts-stat-item">
            <div class="ielts-stat-num" style="color: var(--cyan);">${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}</div>
            <div class="ielts-stat-desc">Thời gian hoàn thành</div>
          </div>
          <div class="ielts-stat-item">
            <div class="ielts-stat-num" style="color: var(--amber);">${record.total - record.correct}</div>
            <div class="ielts-stat-desc">Số câu cần cải thiện</div>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: center; gap: 12px;">
          <button class="btn" id="ieltsRetakeBtn">🔄 Làm lại bài này</button>
          <button class="btn ghost" id="ieltsBackLibBtn">📚 Quay lại Thư viện</button>
        </div>
      </div>

      <!-- Review Section: Split View for comparison -->
      <div class="ielts-split-view">
        <!-- Left: Passage for reference -->
        <div class="ielts-passage-panel" style="max-height: calc(100vh - 120px);">
          <div class="ielts-passage-tools">
            <span class="sub" style="font-weight: 600;">📖 BÀI ĐỌC ĐỐI CHIẾU DẪN CHỨNG</span>
          </div>
          <div class="ielts-passage-content" style="font-size: ${ieltsPassageFontSize}px;">
            <div class="ielts-passage-title">${escapeHtml(test.passage.title || test.title)}</div>
            ${test.passage.paragraphs.map(p => `
              <div class="ielts-paragraph" id="rev-para-${p.id}">
                <span class="ielts-para-badge">[${escapeHtml(p.id)}]</span>
                ${highlightVocab(escapeHtml(p.text))}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Right: Questions Detailed Review -->
        <div class="ielts-questions-panel" style="max-height: calc(100vh - 120px);">
          <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">Chi tiết từng câu hỏi & Giải thích:</div>
          ${questions.map((q, idx) => {
            const d = details.find(item => item.id === q.id) || {};
            return `
              <div class="ielts-q-card ${d.isCorrect ? 'is-correct' : 'is-wrong'}">
                <span class="ielts-review-tag ${d.isCorrect ? 'correct' : 'wrong'}">
                  ${d.isCorrect ? '✓ ĐÚNG' : '✗ SAI'}
                </span>
                <div class="ielts-q-text">
                  <span class="ielts-q-number">${idx + 1}.</span>
                  ${escapeHtml(q.q)}
                </div>

                <div class="ielts-answer-diff">
                  <div><b>Câu trả lời của bạn:</b> <span style="color: ${d.isCorrect ? 'var(--emerald)' : 'var(--red)'}; font-weight: 600;">${escapeHtml(d.userAns || "(Chưa trả lời)")}</span></div>
                  <div><b>Đáp án chính xác:</b> <span style="color: var(--emerald); font-weight: 700;">${escapeHtml(q.ans)}</span></div>
                </div>

                ${q.exp ? `
                  <div class="ielts-explanation-box">
                    <b>💡 Giải thích chi tiết:</b> ${highlightVocab(escapeHtml(q.exp))}
                  </div>
                ` : ""}

                ${q.evidence ? `
                  <div class="ielts-evidence-box">
                    <b>📍 Dẫn chứng trong bài:</b> ${highlightVocab(escapeHtml(q.evidence))}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  document.getElementById("ieltsRetakeBtn")?.addEventListener("click", () => {
    startIeltsTest(test.id);
  });

  document.getElementById("ieltsBackLibBtn")?.addEventListener("click", () => {
    renderIeltsDashboard();
  });
}

function getBandDescription(band) {
  if (band >= 8.5) return "Expert User (Thông thạo xuất sắc)";
  if (band >= 7.5) return "Very Good User (Rất tốt, xử lý tốt văn bản phức tạp)";
  if (band >= 6.5) return "Good User (Khá tốt, nắm vững ý chính)";
  if (band >= 5.5) return "Competent User (Đạt yêu cầu trung bình)";
  return "Modest / Limited User (Cần tiếp tục trau dồi)";
}

function reviewLastAttempt(testId) {
  const test = getIeltsTestById(testId);
  const records = ieltsHistory[testId];
  if (!test || !records || records.length === 0) {
    alert("Chưa có lịch sử làm bài cho đề này!");
    return;
  }

  currentIeltsTest = test;
  const lastRecord = records[0];
  currentIeltsAnswers = lastRecord.answers || {};

  const details = test.questions.map(q => {
    const userAns = (currentIeltsAnswers[q.id] || "").trim();
    const isCorrect = checkAnswerMatch(userAns, q.ans);
    return {
      id: q.id,
      userAns,
      correctAns: q.ans,
      isCorrect,
      exp: q.exp,
      evidence: q.evidence
    };
  });

  renderIeltsResult(lastRecord, details);
}

// ---- Import, Export & Template Modal --------------------------------------
function openIeltsImportModal() {
  const modal = document.createElement("div");
  modal.className = "ielts-modal-overlay";
  modal.id = "ieltsImportModal";

  modal.innerHTML = `
    <div class="ielts-modal-card">
      <div class="ielts-modal-header">
        <div class="ielts-modal-title">📥 Import Bộ Đề Thi IELTS</div>
        <button class="btn ghost" id="closeImportModal" style="padding: 4px 10px;">✕</button>
      </div>

      <div class="ielts-modal-body">
        <div class="ielts-modal-tabs">
          <button class="ielts-modal-tab-btn active" data-tab="upload">📁 Tải File .JSON</button>
          <button class="ielts-modal-tab-btn" data-tab="paste">📋 Dán Mã JSON</button>
        </div>

        <!-- Tab 1: Upload -->
        <div id="tabContentUpload" style="display: block;">
          <div class="ielts-dropzone" id="ieltsDropzone">
            <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
            <div style="font-weight: 600; margin-bottom: 4px;">Kéo & Thả file .JSON đề thi vào đây</div>
            <div class="sub" style="font-size: 13px;">hoặc bấm để chọn file từ máy tính</div>
            <input type="file" id="ieltsFileInput" accept=".json" style="display: none;" />
          </div>
          <div id="importUploadStatus" style="margin-top: 12px; font-size: 13px;"></div>
        </div>

        <!-- Tab 2: Paste -->
        <div id="tabContentPaste" style="display: none;">
          <p class="sub" style="margin-top: 0;">Dán nội dung cấu trúc JSON của một hoặc nhiều bộ đề thi:</p>
          <textarea class="input" id="ieltsJsonPasteText" rows="10" 
                    placeholder="Dán mã JSON tại đây..." style="font-family: var(--font-mono); font-size: 12px; width: 100%;"></textarea>
          <div id="importPasteStatus" style="margin-top: 8px; font-size: 13px;"></div>
        </div>
      </div>

      <div class="ielts-modal-footer">
        <button class="btn ghost" id="cancelImportBtn">Hủy</button>
        <button class="btn" id="confirmImportBtn">Tiến hành Import</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Modal events
  modal.querySelector("#closeImportModal")?.addEventListener("click", () => modal.remove());
  modal.querySelector("#cancelImportBtn")?.addEventListener("click", () => modal.remove());

  // Tabs
  modal.querySelectorAll(".ielts-modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".ielts-modal-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("tabContentUpload").style.display = tab === "upload" ? "block" : "none";
      document.getElementById("tabContentPaste").style.display = tab === "paste" ? "block" : "none";
    });
  });

  // Dropzone file select
  const dropzone = modal.querySelector("#ieltsDropzone");
  const fileInput = modal.querySelector("#ieltsFileInput");

  dropzone?.addEventListener("click", () => fileInput?.click());

  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files?.length) {
      handleImportFile(e.dataTransfer.files[0], modal);
    }
  });

  fileInput?.addEventListener("change", (e) => {
    if (e.target.files?.length) {
      handleImportFile(e.target.files[0], modal);
    }
  });

  // Paste import confirm
  modal.querySelector("#confirmImportBtn")?.addEventListener("click", () => {
    const text = document.getElementById("ieltsJsonPasteText")?.value.trim();
    if (!text) {
      alert("Vui lòng dán nội dung JSON hoặc chọn file!");
      return;
    }
    processImportedJsonString(text, modal);
  });
}

function handleImportFile(file, modal) {
  const reader = new FileReader();
  reader.onload = (e) => {
    processImportedJsonString(e.target.result, modal);
  };
  reader.readAsText(file);
}

function processImportedJsonString(rawJson, modal) {
  try {
    const parsed = JSON.parse(rawJson);
    const testsToAdd = Array.isArray(parsed) ? parsed : [parsed];

    let count = 0;
    testsToAdd.forEach(t => {
      if (!t.title || !t.passage || !t.questions) {
        throw new Error("Dữ liệu đề thiếu các trường bắt buộc (title, passage, questions).");
      }
      if (!t.id) {
        t.id = `ielts_custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      } else if (!t.id.startsWith("ielts_custom_")) {
        t.id = `ielts_custom_${t.id}`;
      }

      // Check if exists, replace or push
      const idx = customIeltsTests.findIndex(existing => existing.id === t.id);
      if (idx !== -1) {
        customIeltsTests[idx] = t;
      } else {
        customIeltsTests.unshift(t);
      }
      count++;
    });

    saveCustomIeltsTests();
    alert(`🎉 Đã import thành công ${count} bộ đề vào thư viện!`);
    modal.remove();
    renderIeltsDashboard();
  } catch (err) {
    alert("❌ Lỗi cấu trúc JSON: " + err.message);
  }
}

function deleteCustomIeltsTest(testId) {
  if (!confirm("Bạn có chắc chắn muốn xóa bộ đề này khỏi danh sách?")) return;
  customIeltsTests = customIeltsTests.filter(t => t.id !== testId);
  saveCustomIeltsTests();
  renderIeltsDashboard();
}

function exportIeltsTests() {
  const all = getAllIeltsTests();
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ielts_practice_tests_${isoDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function openIeltsTemplateModal() {
  const modal = document.createElement("div");
  modal.className = "ielts-modal-overlay";

  const templateStr = getIeltsTemplateJSON();

  modal.innerHTML = `
    <div class="ielts-modal-card">
      <div class="ielts-modal-header">
        <div class="ielts-modal-title">📑 Cấu Trúc JSON Mẫu Đề Thi IELTS</div>
        <button class="btn ghost" id="closeTemplateModal" style="padding: 4px 10px;">✕</button>
      </div>

      <div class="ielts-modal-body">
        <p class="sub" style="margin-top: 0;">
          Dưới đây là cấu trúc JSON chuẩn mực. Bạn có thể sao chép để tự soạn đề hoặc đưa cho các LLM khác tạo bộ đề theo đúng format này:
        </p>
        <div class="ielts-code-preview">${escapeHtml(templateStr)}</div>
      </div>

      <div class="ielts-modal-footer">
        <button class="btn ghost" id="downloadTemplateBtn">💾 Tải file JSON mẫu</button>
        <button class="btn" id="copyTemplateBtn">📋 Sao chép cấu trúc</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closeTemplateModal")?.addEventListener("click", () => modal.remove());

  modal.querySelector("#copyTemplateBtn")?.addEventListener("click", () => {
    navigator.clipboard.writeText(templateStr).then(() => {
      alert("Đã sao chép cấu trúc JSON vào Clipboard!");
    });
  });

  modal.querySelector("#downloadTemplateBtn")?.addEventListener("click", () => {
    const blob = new Blob([templateStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ielts_test_template.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ---- AI IELTS Test Generator -----------------------------------------------
function openIeltsAIGeneratorModal() {
  const modal = document.createElement("div");
  modal.className = "ielts-modal-overlay";

  modal.innerHTML = `
    <div class="ielts-modal-card">
      <div class="ielts-modal-header">
        <div class="ielts-modal-title">🤖 AI Tạo Đề Thi IELTS Tự Động</div>
        <button class="btn ghost" id="closeAiModal" style="padding: 4px 10px;">✕</button>
      </div>

      <div class="ielts-modal-body">
        <p class="sub" style="margin-top: 0;">
          Sử dụng trí tuệ nhân tạo (Gemini / BitNet) để tự động viết một bài đọc học thuật IELTS và sinh các dạng câu hỏi trắc nghiệm, T/F/NG, điền từ kèm giải thích chi tiết.
        </p>

        <div>
          <label style="font-weight: 600; font-size: 13.5px; display: block; margin-bottom: 6px;">Chủ đề bài thi IELTS:</label>
          <input class="input" id="aiTopicInput" placeholder="Ví dụ: Deep sea marine biology, Autonomous vehicles, Sleep psychology..." 
                 value="The Psychology of Human Memory and Forgetting" style="width: 100%;" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div>
            <label style="font-weight: 600; font-size: 13.5px; display: block; margin-bottom: 6px;">Số lượng câu hỏi:</label>
            <select class="input" id="aiCountSelect" style="width: 100%;">
              <option value="8">8 câu (Bài ngắn - 15 phút)</option>
              <option value="10" selected>10 câu (Chuẩn - 20 phút)</option>
              <option value="12">12 câu (Nâng cao - 20 phút)</option>
            </select>
          </div>

          <div>
            <label style="font-weight: 600; font-size: 13.5px; display: block; margin-bottom: 6px;">Độ khó mục tiêu:</label>
            <select class="input" id="aiDiffSelect" style="width: 100%;">
              <option value="Band 6.0 - 6.5">Band 6.0 - 6.5 (Vừa phải)</option>
              <option value="Band 7.0 - 7.5" selected>Band 7.0 - 7.5 (Học thuật chuẩn)</option>
              <option value="Band 8.0 - 8.5">Band 8.0 - 8.5 (Từ vựng chuyên sâu)</option>
            </select>
          </div>
        </div>

        <div id="aiGenStatus" style="font-size: 13px; color: var(--cyan); display: none;"></div>
      </div>

      <div class="ielts-modal-footer">
        <button class="btn ghost" id="cancelAiBtn">Đóng</button>
        <button class="btn" id="startAiGenBtn" style="background: linear-gradient(135deg, #0284c7, #0d9488);">⚡ Bắt đầu tạo đề</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closeAiModal")?.addEventListener("click", () => modal.remove());
  modal.querySelector("#cancelAiBtn")?.addEventListener("click", () => modal.remove());

  modal.querySelector("#startAiGenBtn")?.addEventListener("click", async () => {
    const topic = document.getElementById("aiTopicInput")?.value.trim();
    const count = document.getElementById("aiCountSelect")?.value;
    const diff = document.getElementById("aiDiffSelect")?.value;

    if (!topic) {
      alert("Vui lòng nhập chủ đề bài thi!");
      return;
    }

    if (!Gemini.isAvailable()) {
      alert("Không tìm thấy cấu hình AI trong hệ thống (env.js)!");
      return;
    }

    const startBtn = document.getElementById("startAiGenBtn");
    const statusBox = document.getElementById("aiGenStatus");
    startBtn.disabled = true;
    startBtn.textContent = "Đang sinh đề thi (10-25s)...";
    statusBox.style.display = "block";
    statusBox.textContent = "AI đang biên soạn bài đọc học thuật và sinh các câu hỏi IELTS...";

    try {
      const prompt = `Bạn là chuyên gia khảo thí biên soạn đề thi IELTS Academic Reading chính thức của Cambridge.
Hãy tạo một bộ đề thi IELTS Reading hoàn chỉnh theo chủ đề: "${topic}" với trình độ ${diff}, gồm ${count} câu hỏi.

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một JSON hợp lệ (không kèm markdown \`\`\`json).
Cấu trúc JSON:
{
  "id": "ielts_custom_ai_${Date.now()}",
  "title": "Tiêu đề tiếng Anh hấp dẫn chuẩn học thuật",
  "category": "Academic Reading",
  "section": "Passage 1",
  "durationMinutes": 20,
  "difficulty": "${diff}",
  "description": "Mô tả ngắn tiếng Việt về bài đọc.",
  "passage": {
    "title": "Tiêu đề bài đọc",
    "paragraphs": [
      { "id": "A", "text": "Đoạn văn tiếng Anh A dài 100-150 từ..." },
      { "id": "B", "text": "Đoạn văn tiếng Anh B dài 100-150 từ..." },
      { "id": "C", "text": "Đoạn văn tiếng Anh C dài 100-150 từ..." },
      { "id": "D", "text": "Đoạn văn tiếng Anh D dài 100-150 từ..." }
    ]
  },
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "instruction": "Choose the correct letter, A, B, C or D.",
      "q": "Nội dung câu hỏi tiếng Anh",
      "opts": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
      "ans": "Chuỗi chính xác một trong các lựa chọn opts",
      "exp": "Giải thích chi tiết bằng tiếng Việt",
      "evidence": "Trích dẫn câu chứa dẫn chứng trong bài"
    },
    {
      "id": 2,
      "type": "true_false_not_given",
      "instruction": "Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      "q": "Câu nhận định tiếng Anh",
      "opts": ["TRUE", "FALSE", "NOT GIVEN"],
      "ans": "TRUE hoặc FALSE hoặc NOT GIVEN",
      "exp": "Giải thích chi tiết bằng tiếng Việt",
      "evidence": "Trích dẫn câu chứa dẫn chứng trong bài"
    },
    {
      "id": 3,
      "type": "fill_blank",
      "instruction": "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage.",
      "q": "Câu có chỗ trống điền từ tiếng Anh có ký hiệu ________",
      "ans": "Từ hoặc cụm từ trích nguyên bản từ bài đọc",
      "exp": "Giải thích tiếng Việt",
      "evidence": "Trích dẫn bài đọc"
    }
  ]
}

Hãy phân bổ đều các dạng câu hỏi: Multiple Choice, True/False/Not Given, và Fill in the Blanks.`;

      const generatedTest = await Gemini.generateJSON(prompt);
      if (!generatedTest || !generatedTest.passage || !generatedTest.questions) {
        throw new Error("Dữ liệu trả về từ AI không đúng cấu trúc đề IELTS.");
      }

      customIeltsTests.unshift(generatedTest);
      saveCustomIeltsTests();

      alert(`🎉 Đã tạo thành công bộ đề thi mới: "${generatedTest.title}"!`);
      modal.remove();
      renderIeltsDashboard();

      // Ask to start test immediately
      if (confirm("Bạn có muốn làm thử bài thi vừa tạo ngay bây giờ không?")) {
        startIeltsTest(generatedTest.id);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Lỗi khi sinh đề: " + e.message);
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = "⚡ Bắt đầu tạo đề";
      statusBox.style.display = "none";
    }
  });
}

// ---- Interactive Passage Highlighting & Vocab Quick Add ---------------------
function initPassageTextSelection() {
  let selectPop = document.getElementById("ieltsSelectPop");
  if (!selectPop) {
    selectPop = document.createElement("div");
    selectPop.id = "ieltsSelectPop";
    selectPop.className = "ielts-select-pop";
    selectPop.innerHTML = `
      <button id="ieltsPopHlBtn">🖍️ Highlight</button>
      <button id="ieltsPopVocabBtn">📚 Tra & Lưu Từ</button>
    `;
    document.body.appendChild(selectPop);
  }

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    const str = sel.toString().trim();
    if (!str || !currentIeltsTest || !isTabActive("ielts")) {
      selectPop.style.display = "none";
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const passageEl = document.getElementById("ieltsPassagePanel");

    if (passageEl && passageEl.contains(container)) {
      const rect = range.getBoundingClientRect();
      selectPop.style.top = `${window.scrollY + rect.bottom + 6}px`;
      selectPop.style.left = `${window.scrollX + rect.left}px`;
      selectPop.style.display = "flex";
    } else {
      selectPop.style.display = "none";
    }
  });

  document.getElementById("ieltsPopHlBtn")?.addEventListener("click", () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "ielts-highlight";
    try {
      range.surroundContents(span);
    } catch (_) {}
    selectPop.style.display = "none";
    sel.removeAllRanges();
  });

  document.getElementById("ieltsPopVocabBtn")?.addEventListener("click", () => {
    const sel = window.getSelection();
    const word = sel.toString().trim();
    selectPop.style.display = "none";
    if (word) {
      if (typeof openVocabModal === "function") {
        openVocabModal(word);
      } else if (typeof addVocab === "function") {
        addVocab(word, "");
        alert(`Đã lưu "${word}" vào Sổ Từ Vựng!`);
      }
    }
  });
}
