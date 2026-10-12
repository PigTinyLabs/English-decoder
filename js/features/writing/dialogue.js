// ---- Chắp Bút: đối đáp ôn tập --------------------------------------------------------
// Chặng 1 "Nhớ lại": gia sư đưa lại các câu tiếng Việt đã viết (đến hạn / yếu nhất) để dịch lại → cập nhật SRS.
// Chặng 2 "Trò chuyện": có Gemini → hội thoại tự do buộc dùng lại cấu trúc + từ vựng vừa học;
//                       offline → đặt câu với từ vựng của bài.

const CHAT_TALK_TURNS = 4;
const CHAT_MAKE_WORDS = 3;

const Chat = {
  scope: null,
  queue: [],         // [{ lesson, sentence }]
  qIndex: 0,
  phase: "recall",   // recall | talk | make | done
  words: [],         // [[word, mean]] cho chặng đặt câu offline
  wIndex: 0,
  aiHistory: [],
  turns: 0,
  results: [],       // [{ vi, en, verdict }] — để tổng kết + đọc lại
  busy: false,
  autoSpeak: true,
};

let chatLog, chatInput, chatQuick, chatPhase;

function chatTitle() {
  if (Chat.scope.type === "lesson") {
    const l = getLesson(Chat.scope.lessonId);
    return `${l.icon} ${l.title}`;
  }
  return "Câu đến hạn ôn";
}

function startReviewChat(scope) {
  stopSpeaking();
  Object.assign(Chat, {
    scope, queue: [], qIndex: 0, phase: "recall", words: [], wIndex: 0,
    aiHistory: [], turns: 0, results: [], busy: false,
  });

  let note = "";
  if (scope.type === "lesson") {
    const lesson = getLesson(scope.lessonId);
    const written = getWeakestItems(scope.lessonId);
    Chat.queue = (written.length ? written : getLessonSentences(lesson).map(sentence => ({ lesson, sentence }))).slice(0, 6);
  } else {
    Chat.queue = getDueItems().slice(0, 8);
    if (!Chat.queue.length) {
      Chat.queue = getWeakestItems().slice(0, 5);
      note = "Hôm nay chưa có câu nào đến hạn, mình ôn các câu bạn còn yếu nhé. ";
    }
  }

  W.view = "chat";
  renderChatShell();

  if (!Chat.queue.length) {
    addTutor("Bạn chưa viết câu nào cả. Hãy vào một chủ đề, viết vài câu rồi quay lại ôn nhé! ✍️");
    setPhase("done");
    return;
  }
  addTutor(`Chào <b>${escapeHtml(currentProfile || "bạn")}</b>! 👋 ${note}Chặng 1: mình đưa lại <b>${Chat.queue.length}</b> câu bạn đã viết — hãy dịch lại sang tiếng Anh <i>không nhìn đáp án</i>.`);
  askRecall();
}

function renderChatShell() {
  writingRoot.innerHTML = `
    <div class="wr-chat">
      <div class="wr-topbar">
        <button class="btn ghost sm" data-chat="exit">← Thoát</button>
        <div class="wr-title">💬 Ôn tập · ${chatTitle()}</div>
        <div class="wr-toggles">
          <button class="wr-toggle ${Chat.autoSpeak ? "on" : ""}" data-chat="toggle-speak" title="Tự đọc câu tiếng Anh của gia sư">🔊 Tự đọc</button>
        </div>
      </div>
      <div class="wr-chat-phase" id="chatPhase"></div>
      <div class="wr-chat-log" id="chatLog"></div>
      <div class="wr-chat-composer">
        <div class="wr-chat-quick" id="chatQuick"></div>
        <div class="wr-chat-inputrow">
          <button class="btn-icon" data-chat="mic" title="Trả lời bằng giọng nói">🎤</button>
          <textarea class="input" id="chatInput" rows="1" placeholder="Trả lời bằng tiếng Anh… (Enter để gửi)" spellcheck="false"></textarea>
          <button class="btn" data-chat="send">Gửi</button>
        </div>
      </div>
    </div>`;
  chatLog = document.getElementById("chatLog");
  chatInput = document.getElementById("chatInput");
  chatQuick = document.getElementById("chatQuick");
  chatPhase = document.getElementById("chatPhase");
  chatInput.focus();
}

// ---- Message helpers --------------------------------------------------------------------
function scrollChat() { chatLog.scrollTop = chatLog.scrollHeight; }

function sayBtn(text) {
  return `<button class="btn-icon sm" data-say="${escapeHtml(text)}" title="Nghe">🔊</button>`;
}

// Bubble câu tiếng Anh có nút nghe
function enLine(text, cls = "") {
  return `<div class="wr-chat-en ${cls}">${sayBtn(text)}<span>${escapeHtml(text)}</span></div>`;
}

function addTutor(html, { say } = {}) {
  const el = document.createElement("div");
  el.className = "wr-msg tutor";
  el.innerHTML = `<div class="wr-avatar">🧑‍🏫</div><div class="wr-bubble">${html}</div>`;
  chatLog.appendChild(el);
  scrollChat();
  if (say && Chat.autoSpeak) {
    stopSpeaking();
    speakSequence([].concat(say), { pauseMs: 400, rate: WritingData.settings.rate });
  }
}

function addMe(text) {
  const el = document.createElement("div");
  el.className = "wr-msg me";
  el.innerHTML = `<div class="wr-bubble">${escapeHtml(text)}</div>`;
  chatLog.appendChild(el);
  scrollChat();
}

function addTyping() {
  const el = document.createElement("div");
  el.className = "wr-msg tutor";
  el.innerHTML = `<div class="wr-avatar">🧑‍🏫</div><div class="wr-bubble wr-typing"><span></span><span></span><span></span></div>`;
  chatLog.appendChild(el);
  scrollChat();
  return () => el.remove();
}

function setQuick(buttons) {
  chatQuick.innerHTML = buttons.map(([label, action]) => `<button class="wr-quick" data-chat="${action}">${label}</button>`).join("");
}

function setPhase(phase) {
  Chat.phase = phase;
  const labels = {
    recall: () => `Chặng 1/2 · Nhớ lại câu đã viết (${Math.min(Chat.qIndex + 1, Chat.queue.length)}/${Chat.queue.length})`,
    talk: () => `Chặng 2/2 · Trò chuyện cùng AI (${Math.min(Chat.turns + 1, CHAT_TALK_TURNS)}/${CHAT_TALK_TURNS})`,
    make: () => `Chặng 2/2 · Đặt câu với từ vựng (${Math.min(Chat.wIndex + 1, Chat.words.length)}/${Chat.words.length})`,
    done: () => "✓ Hoàn thành buổi ôn",
  };
  chatPhase.textContent = labels[phase]();
  const quick = {
    recall: [["💡 Gợi ý", "hint"], ["⏭ Bỏ qua", "skip"]],
    talk: [["🆘 Gợi ý cách trả lời", "talk-help"], ["🏁 Kết thúc", "finish"]],
    make: [["⏭ Bỏ qua", "skip-word"]],
    done: [["🔊 Đọc lại các câu đã ôn", "replay"], ["🔁 Ôn lần nữa", "again"], ["← Về Chắp Bút", "exit"]],
  };
  setQuick(quick[phase]);
  chatInput.disabled = phase === "done";
  chatInput.placeholder = phase === "done" ? "Buổi ôn đã kết thúc" : "Trả lời bằng tiếng Anh… (Enter để gửi)";
}

// ---- Chặng 1: Nhớ lại -----------------------------------------------------------------------
function askRecall() {
  setPhase("recall");
  const { lesson, sentence } = Chat.queue[Chat.qIndex];
  addTutor(`<div class="label">🔁 Câu ${Chat.qIndex + 1}/${Chat.queue.length} · ${lesson.icon} ${lesson.title}</div><div class="wr-chat-vi">${escapeHtml(sentence.vi)}</div>`);
}

async function onRecallAnswer(text) {
  const { lesson, sentence } = Chat.queue[Chat.qIndex];
  const removeTyping = addTyping();
  const r = await gradeSentence(sentence, text, lesson);
  removeTyping();
  recordResult(sentence.id, text, r);

  const ui = VERDICT_UI[r.verdict];
  const target = r.verdict === "correct" ? text : r.corrected;
  Chat.results.push({ vi: sentence.vi, en: target, verdict: r.verdict });
  const praise = { correct: "Chuẩn rồi! 🎉", minor: "Gần đúng rồi, chỉnh xíu nhé:", wrong: "Chưa đúng, mình sửa lại nhé:" }[r.verdict];
  addTutor(`
    <div class="wr-verdict sm ${ui.cls}">${ui.icon} ${praise} <span class="wr-score">${r.score}/10</span></div>
    ${r.verdict !== "correct" ? `<div class="wr-diff">${diffHtml(text, r.diffRef || r.corrected)}</div>` : ""}
    ${enLine(target, "strong")}
    ${r.errors?.length ? `<ul class="wr-errors">${r.errors.map(e => `<li><b>${escapeHtml(e.type)}</b> — ${escapeHtml(e.explain)}</li>`).join("")}</ul>` : ""}
    ${r.verdict !== "correct" ? `<div class="sub">Lịch ôn: câu này sẽ quay lại sớm để bạn nhớ chắc hơn.</div>` : ""}
  `, { say: target });
  nextRecall();
}

function nextRecall() {
  Chat.qIndex++;
  if (Chat.qIndex < Chat.queue.length) askRecall();
  else startStage2();
}

function recallHint() {
  const { sentence } = Chat.queue[Chat.qIndex];
  const words = sentence.en.split(" ");
  const start = words.slice(0, Math.max(1, Math.ceil(words.length / 3))).join(" ");
  addTutor(`💡 Bắt đầu bằng: <b>${escapeHtml(start)} …</b> (${words.length} từ)`);
}

function recallSkip() {
  const { lesson, sentence } = Chat.queue[Chat.qIndex];
  addMe("(bỏ qua)");
  recordResult(sentence.id, "(bỏ qua)", { score: 0, verdict: "wrong", corrected: sentence.en, natural: sentence.en, errors: [] });
  Chat.results.push({ vi: sentence.vi, en: sentence.en, verdict: "wrong" });
  addTutor(`Không sao! Đáp án là:${enLine(sentence.en, "strong")}<div class="sub">Điểm ngữ pháp: ${escapeHtml(lesson.grammar.name)}</div>`, { say: sentence.en });
  nextRecall();
}

// ---- Chặng 2 ----------------------------------------------------------------------------------
function chatLessons() {
  const ids = [...new Set(Chat.queue.map(q => q.lesson.id))];
  return ids.map(getLesson);
}

function startStage2() {
  const ok = Chat.results.filter(r => r.verdict === "correct").length;
  addTutor(`Xong chặng 1: <b>${ok}/${Chat.results.length}</b> câu chuẩn. 👏`);
  if (Gemini.isAvailable()) startTalk();
  else startMake();
}

function talkSystemPrompt() {
  const lessons = chatLessons();
  const grammar = lessons.map(l => `${l.grammar.name} (${l.grammar.formula.join("; ")})`).join(" | ");
  const vocab = lessons.flatMap(l => l.vocab.map(([w, m]) => `${w} = ${m}`)).join(", ");
  const sentences = Chat.results.map(r => `- ${r.en}`).join("\n");
  return `Bạn là "Mentor" — gia sư tiếng Anh thân thiện cho người Việt (trình độ A2-B1). Mục tiêu: giúp học viên NHỚ LẠI kiến thức vừa học bằng cách trò chuyện qua lại.

Kiến thức vừa học:
- Ngữ pháp: ${grammar}
- Từ vựng: ${vocab}
- Các câu học viên vừa ôn:
${sentences}

Luật:
1. Mỗi lượt chỉ hỏi 1 câu ngắn bằng tiếng Anh đơn giản, liên quan đời sống của học viên, khiến họ PHẢI dùng lại cấu trúc/từ vựng ở trên để trả lời.
2. Khi học viên trả lời: nếu có lỗi → "feedback" giải thích ngắn bằng tiếng Việt và "corrected" là câu đã sửa; nếu đúng → "feedback" khen ngắn, "corrected" để trống.
3. Nếu học viên gõ "?" hoặc viết tiếng Việt → gợi ý một câu trả lời mẫu tiếng Anh trong "corrected" và hỏi lại.
4. "error_types": nhãn lỗi ngắn bằng tiếng Việt (VD "Thiếu to be"), rỗng nếu không lỗi.
5. Sau khoảng ${CHAT_TALK_TURNS} lượt trả lời, đặt "done": true và "reply" là lời chào kết thúc ngắn.

Luôn trả về JSON: {"feedback": "", "corrected": "", "reply": "câu tiếng Anh tiếp theo", "reply_vi": "dịch nghĩa reply", "done": false, "error_types": []}
Bắt đầu: chào ngắn và hỏi câu đầu tiên (feedback, corrected để trống).`;
}

async function startTalk() {
  setPhase("talk");
  addTutor("Chặng 2: mình nói chuyện chút nhé — hãy trả lời bằng tiếng Anh, cố dùng lại cấu trúc và từ vừa ôn. 💬");
  Chat.aiHistory = [{ role: "user", parts: [{ text: talkSystemPrompt() }] }];
  await talkTurn();
}

async function talkTurn() {
  Chat.busy = true;
  const removeTyping = addTyping();
  try {
    const raw = await Gemini.generate(Chat.aiHistory, { json: true });
    removeTyping();
    Chat.aiHistory.push({ role: "model", parts: [{ text: raw }] });
    const r = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
    (r.error_types || []).forEach(t => t && logError(`💬 ${t}`));
    if (r.corrected) Chat.results.push({ vi: "(trò chuyện)", en: r.corrected, verdict: "minor" });

    const say = [r.corrected, r.reply].filter(Boolean);
    addTutor(`
      ${r.feedback ? `<div class="wr-chat-fb">${escapeHtml(r.feedback)}</div>` : ""}
      ${r.corrected ? enLine(r.corrected, "fix") : ""}
      ${r.reply ? enLine(r.reply, "strong") : ""}
      ${r.reply_vi ? `<div class="sub">${escapeHtml(r.reply_vi)}</div>` : ""}
    `, { say });
    Chat.busy = false;
    if (r.done || Chat.turns >= CHAT_TALK_TURNS) finishChat();
    else setPhase("talk");
  } catch (e) {
    removeTyping();
    Chat.busy = false;
    console.warn("Talk failed:", e);
    addTutor(`AI đang bận (${escapeHtml(e.message)}). Mình chuyển sang luyện đặt câu nhé.`);
    startMake();
  }
}

async function onTalkAnswer(text) {
  Chat.turns++;
  Chat.aiHistory.push({ role: "user", parts: [{ text }] });
  await talkTurn();
}

// Offline: đặt câu với từ vựng
function startMake() {
  const vocab = chatLessons().flatMap(l => l.vocab);
  Chat.words = shuffle(vocab).slice(0, CHAT_MAKE_WORDS);
  Chat.wIndex = 0;
  if (!Chat.words.length) return finishChat();
  addTutor("Chặng 2: đặt câu tiếng Anh của riêng bạn với từ mình đưa ra. ✍️");
  askMake();
}

function askMake() {
  setPhase("make");
  const [word, mean] = Chat.words[Chat.wIndex];
  addTutor(`Đặt một câu có dùng ${enLine(word, "strong")}<div class="sub">nghĩa: ${escapeHtml(mean)}</div>`);
}

// Khớp từ/cụm từ (cho phép biến thể đuôi: visit → visited, "proud of" → "proud of")
function usesWord(text, word) {
  const words = wordsOf(text);
  const target = wordsOf(word.replace(/\.\.\.|…/g, " "));
  if (!target.length) return false;
  return words.some((_, i) => target.every((t, k) => {
    const w = words[i + k];
    return w && (w === t || (t.length >= 3 && w.startsWith(t.slice(0, Math.max(3, t.length - 1)))));
  }));
}

function onMakeAnswer(text) {
  const [word] = Chat.words[Chat.wIndex];
  if (!usesWord(text, word)) {
    addTutor(`Câu của bạn chưa có từ <b>${escapeHtml(word)}</b> — thử lại nhé, hoặc bấm Bỏ qua.`);
    return;
  }
  Chat.results.push({ vi: `(đặt câu với "${word}")`, en: text, verdict: "correct" });
  addTutor(`👍 Tốt lắm! Nghe lại câu của bạn:${enLine(text, "strong")}<div class="sub">Chế độ offline chưa kiểm tra ngữ pháp — hãy tự soát lại thì, chủ ngữ, to be.</div>`, { say: text });
  nextMake();
}

function nextMake() {
  Chat.wIndex++;
  if (Chat.wIndex < Chat.words.length) askMake();
  else finishChat();
}

// ---- Tổng kết -----------------------------------------------------------------------------
function finishChat() {
  const recall = Chat.results.filter(r => r.vi !== "(trò chuyện)" && !r.vi.startsWith("(đặt câu"));
  const ok = recall.filter(r => r.verdict === "correct").length;
  const weak = recall.filter(r => r.verdict !== "correct");
  addTutor(`
    <div class="wr-h2">🏁 Tổng kết buổi ôn</div>
    <div>Nhớ lại: <b>${ok}/${recall.length}</b> câu chuẩn${Chat.turns ? ` · trò chuyện ${Chat.turns} lượt` : ""}.</div>
    ${weak.length ? `<div class="label" style="margin-top:10px;">Cần ôn thêm</div>${weak.map(r => `<div class="wr-sum-mini"><span class="sub">${escapeHtml(r.vi)}</span>${enLine(r.en)}</div>`).join("")}` : `<div style="margin-top:8px;">Không có câu nào sai — xuất sắc! 🌟</div>`}
    <div class="sub" style="margin-top:10px;">Các câu sai sẽ tự quay lại trong mục "Ôn tập đối đáp" theo lịch lặp lại ngắt quãng.</div>
  `);
  setPhase("done");
}

// ---- Input ------------------------------------------------------------------------------
async function sendChat() {
  const text = chatInput.value.trim();
  if (!text || Chat.busy || Chat.phase === "done") return;
  chatInput.value = "";
  stopSpeaking();
  addMe(text);
  Chat.busy = true;
  try {
    if (Chat.phase === "recall") {
      if (text === "?") { recallHint(); return; }
      await onRecallAnswer(text);
    } else if (Chat.phase === "talk") {
      Chat.busy = false; // talkTurn tự quản lý busy
      await onTalkAnswer(text);
    } else if (Chat.phase === "make") {
      onMakeAnswer(text);
    }
  } finally {
    Chat.busy = false;
    chatInput?.focus();
  }
}

async function chatMic(btn) {
  btn.classList.add("recording");
  try {
    const heard = await listenOnce();
    chatInput.value = (chatInput.value ? chatInput.value + " " : "") + heard;
    chatInput.focus();
  } catch (e) {
    addTutor(`🎤 ${escapeHtml(micErrorMessage(e.message))}`);
  } finally {
    btn.classList.remove("recording");
  }
}

function handleChatClick(e) {
  if (W.view !== "chat") return;
  const btn = e.target.closest("[data-chat]");
  if (!btn) return;
  e.stopPropagation();
  switch (btn.dataset.chat) {
    case "send": sendChat(); break;
    case "mic": chatMic(btn); break;
    case "hint": if (!Chat.busy) recallHint(); break;
    case "skip": if (!Chat.busy) recallSkip(); break;
    case "talk-help": if (!Chat.busy) { chatInput.value = "?"; sendChat(); } break;
    case "finish": if (!Chat.busy) finishChat(); break;
    case "skip-word": addMe("(bỏ qua)"); nextMake(); break;
    case "replay":
      stopSpeaking();
      speakSequence(Chat.results.map(r => r.en), { pauseMs: 600, rate: WritingData.settings.rate });
      break;
    case "again": startReviewChat(Chat.scope); break;
    case "toggle-speak":
      Chat.autoSpeak = !Chat.autoSpeak;
      btn.classList.toggle("on", Chat.autoSpeak);
      if (!Chat.autoSpeak) stopSpeaking();
      break;
    case "exit":
      stopSpeaking();
      stopListening();
      if (Chat.scope?.type === "lesson") { W.view = "lesson"; W.lessonId = Chat.scope.lessonId; }
      else W.view = "home";
      renderWriting();
      break;
  }
}

function initDialogue() {
  // Gắn ở capture phase để chạy trước handler chung của writingRoot
  writingRoot.addEventListener("click", handleChatClick, true);
  writingRoot.addEventListener("keydown", e => {
    if (W.view === "chat" && e.target.id === "chatInput" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}
