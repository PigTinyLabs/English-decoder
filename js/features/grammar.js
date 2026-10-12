// ---- Grammar Debugger --------------------------------------------------------
// 1. Syntax highlighter (S-V-O) dùng compromise.js
// 2. Tense quiz offline
// 3. Error log — các feature khác (VD Chắp Bút) cũng ghi lỗi vào đây qua logError()

const TENSE_QUIZZES = {
  present_simple: [
    { q: "He ___ (go) to school every day.", a: "goes", errorType: "Quên thêm 'es' cho ngôi thứ 3 số ít" },
    { q: "They ___ (not / like) pizza.", a: "do not like", alt: "don't like", errorType: "Sai trợ động từ phủ định (do/does)" },
    { q: "___ she (play) tennis on weekends?", a: "does she play", errorType: "Sai cấu trúc câu hỏi với Does" }
  ],
  present_continuous: [
    { q: "Look! The dog ___ (run) in the yard.", a: "is running", alt: "is running", errorType: "Thiếu to be hoặc quên gấp đôi phụ âm" },
    { q: "I ___ (study) right now.", a: "am studying", alt: "am studying", errorType: "Chia sai động từ to be (am/is/are)" }
  ],
  past_simple: [
    { q: "Yesterday, I ___ (see) a movie.", a: "saw", errorType: "Không nhớ động từ bất quy tắc" },
    { q: "She ___ (not / go) to work last week.", a: "did not go", alt: "didn't go", errorType: "Sai trợ động từ quá khứ (did)" }
  ],
  future_simple: [
    { q: "I think it ___ (rain) tomorrow.", a: "will rain", alt: "will rain", errorType: "Sai cấu trúc will + V" },
    { q: "___ you (help) me with this?", a: "will you help", alt: "will", errorType: "Sai cấu trúc câu hỏi tương lai" }
  ],
  present_perfect: [
    { q: "I ___ (finish) my homework already.", a: "have finished", alt: "have finished", errorType: "Sai cấu trúc have/has + V3" },
    { q: "She ___ (never / be) to Japan.", a: "has never been", alt: "has never been", errorType: "Chia sai have/has hoặc V3 (be -> been)" }
  ]
};

let currentTenseQuiz = null;

function parseSyntax() {
  const syntaxInput = document.getElementById("syntaxInput");
  const syntaxResult = document.getElementById("syntaxResult");
  const text = syntaxInput.value.trim();
  if (!text) return;

  if (typeof window.nlp === 'undefined') {
    syntaxResult.innerHTML = '<span style="color: var(--red);">Error: Không tải được thư viện compromise.js. Cần có mạng internet.</span>';
    return;
  }

  const data = window.nlp(text).json();
  const parts = [];
  let isVerbSeen = false;

  data.forEach(phrase => {
    if (!phrase.terms) return;
    phrase.terms.forEach(term => {
      const w = escapeHtml((term.pre || "") + term.text + (term.post || ""));
      const tags = term.tags || [];

      if (tags.includes('Verb')) {
        parts.push(`<span class="syntax-verb" title="Verb">${w}</span>`);
        isVerbSeen = true;
      } else if (tags.includes('Noun') || tags.includes('Pronoun')) {
        parts.push(isVerbSeen
          ? `<span class="syntax-object" title="Object">${w}</span>`
          : `<span class="syntax-subject" title="Subject">${w}</span>`);
      } else {
        parts.push(`<span class="syntax-other">${w}</span>`);
      }
    });
  });

  syntaxResult.innerHTML = parts.join('');
}

function generateTenseQuiz() {
  const tenseQuizBox = document.getElementById("tenseQuizBox");
  const list = TENSE_QUIZZES[document.getElementById("tenseSelect").value];
  currentTenseQuiz = list[Math.floor(Math.random() * list.length)];

  const parts = currentTenseQuiz.q.split("___");
  tenseQuizBox.innerHTML = `
    <div class="tense-quiz-text">
      ${parts[0]} <input type="text" class="tense-input" id="quizInput" autocomplete="off" spellcheck="false" /> ${parts[1] || ""}
    </div>
    <button class="btn" id="checkQuizBtn" style="margin-top: 8px;">Kiểm tra</button>
    <div id="quizResult" style="margin-top: 12px; font-weight: bold;"></div>
  `;

  const quizInput = document.getElementById("quizInput");
  quizInput.focus();
  document.getElementById("checkQuizBtn").addEventListener("click", checkTenseAnswer);
  quizInput.addEventListener("keydown", e => { if (e.key === "Enter") checkTenseAnswer(); });
}

function checkTenseAnswer() {
  if (!currentTenseQuiz) return;
  const quizInput = document.getElementById("quizInput");
  const quizResult = document.getElementById("quizResult");
  const userAns = quizInput.value.trim().toLowerCase();
  const correctAns = currentTenseQuiz.a.toLowerCase();
  const correctAlt = currentTenseQuiz.alt ? currentTenseQuiz.alt.toLowerCase() : correctAns;

  if (userAns === correctAns || userAns === correctAlt) {
    quizResult.innerHTML = `<span style="color: var(--emerald);">✓ Chính xác!</span>`;
    quizInput.style.borderColor = "var(--emerald)";
    quizInput.style.color = "var(--emerald)";
  } else {
    quizResult.innerHTML = `<span style="color: var(--red);">✗ Sai rồi. Đáp án đúng: <b>${currentTenseQuiz.a}</b></span>`;
    quizInput.style.borderColor = "var(--red)";
    quizInput.style.color = "var(--red)";
    logError(currentTenseQuiz.errorType);
  }
}

// ---- Error Logging ----------------------------------------------------------
function getGrammarErrors() { return Store.getJSON("grammar_errors", {}); }

function logError(errorType) {
  if (!errorType) return;
  const errors = getGrammarErrors();
  errors[errorType] = (errors[errorType] || 0) + 1;
  Store.set("grammar_errors", errors);
  if (isTabActive("grammar")) renderErrorDashboard();
}

function renderErrorDashboard() {
  const errorLogDashboard = document.getElementById("errorLogDashboard");
  const errors = getGrammarErrors();
  const keys = Object.keys(errors).sort((a, b) => errors[b] - errors[a]);

  if (keys.length === 0) {
    errorLogDashboard.innerHTML = `<div class="sub" style="font-style: italic; background: var(--surface-alt); padding: 12px; border-radius: 6px; text-align: center;">🎉 Giỏi quá! Chưa có lỗi nào được ghi nhận.</div>`;
    return;
  }

  errorLogDashboard.innerHTML = keys.map(k => `
    <div class="log-item">
      <span class="log-item-title">${escapeHtml(k)}</span>
      <span class="log-item-count">${errors[k]} lỗi</span>
    </div>
  `).join("");
}

function initGrammar() {
  document.getElementById("syntaxParseBtn").addEventListener("click", parseSyntax);
  document.getElementById("syntaxInput").addEventListener("keydown", e => { if (e.key === "Enter") parseSyntax(); });
  document.getElementById("generateTenseBtn").addEventListener("click", generateTenseQuiz);
  document.getElementById("clearLogsBtn").addEventListener("click", () => {
    Store.set("grammar_errors", {});
    renderErrorDashboard();
  });

  onRemoteField("grammar_errors", errors => {
    Store.setLocal("grammar_errors", errors);
    renderErrorDashboard();
  });
  onTabShow("grammar", renderErrorDashboard);
  renderErrorDashboard();
}
