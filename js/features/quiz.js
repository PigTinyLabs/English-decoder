// ---- Gemini Daily Quiz + History ------------------------------------------------
let todayQuizData = null; // mảng câu hỏi của đề đang hiển thị
let userAnswers = {};
let quizContainer, submitQuizBtn, quizResultLog;

function getStreak() { return typeof Streak !== "undefined" ? Streak.getStreak() : parseInt(Store.get("quiz_streak", "0")); }
function getQuizHistory() { return Store.getJSON("quiz_history", {}); }

function updateStreakBadge() {
  if (typeof Streak !== "undefined") Streak.updateBadges();
  else {
    const el = document.getElementById("streakBadge");
    if (el) el.innerHTML = `🔥 ${getStreak()} ngày`;
  }
}

function loadTodayQuiz() {
  const data = Store.getJSON("gemini_daily_quiz", null);
  if (data && data.date === getTodayStr()) {
    todayQuizData = data.questions;
    renderQuiz();
  }
}

function buildQuizPrompt({ amount, level, isReviewDay }) {
  let promptText;
  if (isReviewDay) {
    const recentVocab = vocabList.slice(0, 30).map(v => v.word).join(", ");
    const errors = getGrammarErrors();
    const topErrors = Object.keys(errors).sort((a, b) => errors[b] - errors[a]).slice(0, 5).join(", ");

    promptText = `Đây là bài kiểm tra ÔN TẬP định kỳ 7 ngày. Tạo một bài kiểm tra trắc nghiệm tiếng Anh gồm ${amount} câu hỏi ở trình độ ${level}.
    ĐẶC BIỆT YÊU CẦU: Bạn PHẢI sử dụng các từ vựng sau đây làm trọng tâm (trong câu hỏi hoặc đáp án): [${recentVocab}].
    ĐỒNG THỜI, hãy thiết kế các câu hỏi xoáy sâu vào các lỗi ngữ pháp sau mà người dùng hay sai: [${topErrors}].
    Nếu danh sách từ vựng hoặc ngữ pháp trống, hãy tạo một bài kiểm tra ngẫu nhiên thật khó để thử thách.`;
  } else {
    promptText = `Tạo một bài kiểm tra trắc nghiệm tiếng Anh gồm ${amount} câu hỏi ở trình độ ${level} (bao gồm từ vựng, ngữ pháp, idiom khó).`;
  }

  return promptText + `
  Trả về dưới dạng mảng JSON thuần túy (không có markdown \`\`\`json).
  Mỗi câu hỏi có cấu trúc:
  {
    "q": "Câu hỏi",
    "opts": ["A", "B", "C", "D"],
    "ans": "Đáp án đúng (chuỗi nguyên bản từ opts)",
    "exp": "Giải thích chi tiết tại sao lại chọn đáp án này bằng tiếng Việt"
  }`;
}

async function generateDailyQuiz() {
  const generateDailyBtn = document.getElementById("generateDailyBtn");
  if (!Gemini.isAvailable()) { alert("Không tìm thấy Gemini API Key trong hệ thống (.env)!"); return; }

  loadTodayQuiz();
  if (todayQuizData) {
    alert("Đã có bộ đề hôm nay!");
    return;
  }

  const generateCountKey = `gemini_generate_count_${getTodayStr()}`;
  let generateCount = parseInt(Store.get(generateCountKey, "0"));
  if (generateCount >= 5) {
    alert("Hệ thống giới hạn: Mỗi người chỉ được tạo tối đa 5 lần Đề bài mỗi ngày để tiết kiệm API!");
    return;
  }

  // Cứ mỗi 7 ngày streak thì ra đề ôn tập từ vựng + lỗi ngữ pháp hay gặp
  const streak = getStreak();
  const isReviewDay = streak > 0 && (streak + 1) % 7 === 0;

  generateDailyBtn.textContent = isReviewDay ? "Đang tạo Bài Ôn Tập 7 Ngày..." : "Đang kết nối Gemini (khoảng 5-10s)...";
  generateDailyBtn.disabled = true;
  quizContainer.innerHTML = "";
  submitQuizBtn.style.display = "none";
  quizResultLog.innerHTML = "";
  userAnswers = {};

  try {
    const level = document.getElementById("quizLevel").value;
    const amount = document.getElementById("quizAmount").value;
    const qList = await Gemini.generateJSON(buildQuizPrompt({ amount, level, isReviewDay }));
    const dateStr = getTodayStr();

    Store.set("gemini_daily_quiz", { date: dateStr, isReview: isReviewDay, questions: qList });

    generateCount++;
    Store.setLocal(generateCountKey, generateCount.toString());
    syncDataToFirebase(`generate_count_${dateStr}`, generateCount);

    todayQuizData = qList;
    renderQuiz();
  } catch (e) {
    console.error(e);
    alert("Không thể tạo quiz: " + e.message);
  } finally {
    generateDailyBtn.textContent = "Tạo/Lấy bộ đề hôm nay";
    generateDailyBtn.disabled = false;
  }
}

function quizCardsHtml(questions, { interactive }) {
  return questions.map((q, i) => `
    <div class="quiz-card" id="qcard-${i}">
      <div class="quiz-q">${i + 1}. ${highlightVocab(q.q)}</div>
      ${q.opts.map((opt, j) => `
        <div class="quiz-opt" id="opt-${i}-${j}" ${interactive ? `data-q="${i}" data-opt="${j}"` : `style="cursor:default;pointer-events:none;"`}>
          ${String.fromCharCode(65 + j)}. ${highlightVocab(opt)}
        </div>
      `).join("")}
      <div class="quiz-exp" id="exp-${i}" ${interactive ? "" : `style="display:block;"`}><b>Giải thích:</b> ${highlightVocab(q.exp)}</div>
    </div>
  `).join("");
}

function renderQuiz() {
  if (!todayQuizData) return;

  const isReview = !!Store.getJSON("gemini_daily_quiz", {})?.isReview;
  document.getElementById("quizTitle").innerHTML = isReview ? "🎯 7-Day Review Challenge" : "Daily AI Challenge";

  quizContainer.innerHTML = quizCardsHtml(todayQuizData, { interactive: true });
  submitQuizBtn.style.display = "block";
  quizResultLog.innerHTML = "";

  // Hôm nay đã nộp bài thì hiện luôn kết quả
  const history = getQuizHistory();
  if (history[getTodayStr()]) {
    userAnswers = history[getTodayStr()].answers;
    gradeQuiz();
  }
}

function selectAnswer(qIndex, optIndex) {
  // Đã nộp hôm nay thì không đổi được nữa
  if (getQuizHistory()[getTodayStr()]) return;

  userAnswers[qIndex] = todayQuizData[qIndex].opts[optIndex];
  for (let j = 0; j < todayQuizData[qIndex].opts.length; j++) {
    document.getElementById(`opt-${qIndex}-${j}`)?.classList.remove("selected");
  }
  document.getElementById(`opt-${qIndex}-${optIndex}`)?.classList.add("selected");
}

function submitQuiz() {
  if (Object.keys(userAnswers).length < todayQuizData.length) {
    alert("Vui lòng trả lời hết tất cả các câu!");
    return;
  }

  const history = getQuizHistory();
  history[getTodayStr()] = {
    answers: userAnswers,
    questions: todayQuizData, // lưu câu hỏi để xem lại sau
    isReview: Store.getJSON("gemini_daily_quiz", {})?.isReview || false
  };
  Store.set("quiz_history", history);

  // Ghi nhận hoạt động vào Streak toàn diện
  recordLearningActivity("quiz", { questionsCount: todayQuizData.length });

  gradeQuiz();
}

// Tô màu đáp án đúng/sai, hiện giải thích, trả về số câu đúng
function markAnswers(questions, answers) {
  let score = 0;
  questions.forEach((q, i) => {
    const uAns = answers[i];
    const isCorrect = uAns === q.ans;
    if (isCorrect) score++;
    for (let j = 0; j < q.opts.length; j++) {
      const el = document.getElementById(`opt-${i}-${j}`);
      if (!el) continue;
      el.style.cursor = "default";
      el.style.pointerEvents = "none";
      if (q.opts[j] === q.ans) el.classList.add("correct");
      else if (q.opts[j] === uAns && !isCorrect) el.classList.add("wrong");
    }
    const expEl = document.getElementById(`exp-${i}`);
    if (expEl) expEl.style.display = "block";
  });
  return score;
}

function gradeQuiz() {
  submitQuizBtn.style.display = "none";
  const score = markAnswers(todayQuizData, userAnswers);
  quizResultLog.innerHTML = `<span style="color: var(--emerald);">Bạn đã đạt ${score}/${todayQuizData.length} điểm!</span>`;
}

// ---- History System -------------------------------------------------------------
function showQuizHistory() {
  const historyGrid = document.getElementById("historyGrid");
  document.getElementById("historyModal").style.display = "flex";
  const history = getQuizHistory();
  const dates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) {
    historyGrid.innerHTML = `<div style="color: var(--muted); font-family: monospace;">Chưa có lịch sử làm bài.</div>`;
    return;
  }
  historyGrid.innerHTML = dates.map(d => {
    const h = history[d];
    let correct = 0;
    if (h.questions && h.answers) h.questions.forEach((q, i) => { if (q.ans === h.answers[i]) correct++; });
    return `
      <div class="profile-card" data-history-date="${d}" style="width: 100%; text-align: left; align-items: flex-start; padding: 16px;">
        <div style="font-weight: bold; color: var(--emerald);">${d}</div>
        <div style="font-size: 14px; margin-top: 4px; color: var(--muted);">${h.isReview ? "🎯 Review" : "AI Quiz"}</div>
        ${h.questions ? `<div style="font-size: 14px; margin-top: 4px;">Score: ${correct}/${h.questions.length}</div>` : ''}
      </div>
    `;
  }).join("");
}

function renderHistoryQuiz(dateStr) {
  const h = getQuizHistory()[dateStr];
  if (!h || !h.questions) {
    alert("Xin lỗi, dữ liệu bài tập cũ của ngày này không có sẵn.");
    return;
  }
  document.getElementById("historyModal").style.display = "none";

  todayQuizData = h.questions;
  userAnswers = h.answers || {};
  document.getElementById("quizTitle").innerHTML = (h.isReview ? "🎯 7-Day Review Challenge" : "Daily AI Challenge") + ` <span style="font-size:14px;color:var(--muted);">(${dateStr})</span>`;

  quizContainer.innerHTML = quizCardsHtml(todayQuizData, { interactive: false });
  submitQuizBtn.style.display = "none";
  const score = markAnswers(todayQuizData, userAnswers);
  quizResultLog.innerHTML = `<span style="color: var(--emerald);">Điểm ngày ${dateStr}: ${score}/${todayQuizData.length}</span><br/><button class="btn ghost" style="margin-top:16px;" id="restoreTodayQuizBtn">Quay lại bài hôm nay</button>`;
}

function initQuiz() {
  quizContainer = document.getElementById("quizContainer");
  submitQuizBtn = document.getElementById("submitQuizBtn");
  quizResultLog = document.getElementById("quizResultLog");

  document.getElementById("generateDailyBtn").addEventListener("click", generateDailyQuiz);
  submitQuizBtn.addEventListener("click", submitQuiz);
  quizContainer.addEventListener("click", e => {
    const opt = e.target.closest(".quiz-opt[data-q]");
    if (opt) selectAnswer(+opt.dataset.q, +opt.dataset.opt);
  });
  // Reload trang là cách đơn giản nhất để khôi phục trạng thái đề hôm nay
  quizResultLog.addEventListener("click", e => {
    if (e.target.id === "restoreTodayQuizBtn") location.reload();
  });

  document.getElementById("showHistoryBtn").addEventListener("click", showQuizHistory);
  document.getElementById("closeHistoryBtn").addEventListener("click", () => {
    document.getElementById("historyModal").style.display = "none";
  });
  document.getElementById("historyGrid").addEventListener("click", e => {
    const card = e.target.closest("[data-history-date]");
    if (card) renderHistoryQuiz(card.dataset.historyDate);
  });

  onRemoteField("quiz_history", history => Store.setLocal("quiz_history", history));
  onRemoteField("quiz_streak", streak => {
    Store.setLocal("quiz_streak", streak.toString());
    updateStreakBadge();
  });
  onRemoteField("gemini_daily_quiz", quiz => Store.setLocal("gemini_daily_quiz", quiz));

  updateStreakBadge();
  loadTodayQuiz();
}
