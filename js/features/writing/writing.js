// ---- Chắp Bút: giao diện luyện viết ------------------------------------------------
// View: "home" (danh sách chủ đề) → "lesson" (viết từng câu / tổng kết bài) → "chat" (đối đáp ôn tập, xem dialogue.js)

const W = {
  view: "home",
  lessonId: null,
  index: 0,        // câu đang làm; = số câu → màn tổng kết
  result: null,    // kết quả chấm câu hiện tại (sau khi nộp)
  draft: "",
  busy: false,
  showGrammar: true,
  showHint: false,
  showAnalysis: true,
  shadow: null,    // kết quả "đọc theo" của câu hiện tại
  playingIndex: -1,
};

let writingRoot;

const VERDICT_UI = {
  correct: { icon: "✅", label: "Chính xác", cls: "ok" },
  minor: { icon: "🟡", label: "Gần đúng", cls: "minor" },
  wrong: { icon: "❌", label: "Chưa đúng", cls: "bad" },
};

function renderWriting() {
  if (!writingRoot) return;
  if (W.view === "chat") return; // dialogue.js tự quản lý DOM khi đang chat
  stopSpeaking();
  W.playingIndex = -1;
  writingRoot.innerHTML = W.view === "lesson" ? lessonViewHtml() : homeViewHtml();
  if (W.view === "lesson") {
    const ta = document.getElementById("wrAnswer");
    if (ta) { ta.value = W.draft; ta.focus(); }
  }
}

// ---- Home ------------------------------------------------------------------------------
function homeViewHtml() {
  let total = 0, done = 0, correct = 0;
  WRITING_LESSONS.forEach(l => { const s = lessonStats(l); total += s.total; done += s.done; correct += s.correct; });
  const dueCount = getDueItems().length;
  const ai = Gemini.isAvailable();

  const weeks = WRITING_WEEKS.map(week => {
    const cards = WRITING_LESSONS.filter(l => l.week === week.id).map(l => {
      const s = lessonStats(l);
      const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      return `
        <button class="wr-lesson" data-open-lesson="${l.id}">
          <div class="wr-lesson-top">
            <span class="wr-lesson-icon">${l.icon}</span>
            ${s.due ? `<span class="wr-badge due" title="Câu đến hạn ôn">🔁 ${s.due}</span>` : ""}
          </div>
          <div class="wr-lesson-title">${l.title}</div>
          <div class="wr-lesson-grammar">${l.grammar.name}</div>
          <div class="wr-progress"><span style="width:${pct}%"></span></div>
          <div class="wr-lesson-meta">${s.done}/${s.total} câu · ${s.correct} đúng</div>
        </button>`;
    }).join("");
    return `<div class="wr-week"><div class="board-title">${week.title}</div><div class="wr-lesson-grid">${cards}</div></div>`;
  }).join("");

  return `
    <div class="wr-hero">
      <div>
        <div class="wr-h1">✍️ Chắp Bút Writing</div>
        <div class="sub">Dịch câu Việt → Anh theo chủ đề · nghe lại câu vừa viết · đối đáp để ôn.</div>
        <div class="wr-stats">
          <span><b>${done}</b>/${total} câu đã viết</span>
          <span><b>${correct}</b> câu đúng</span>
          <span class="${dueCount ? "wr-due-text" : ""}"><b>${dueCount}</b> câu cần ôn hôm nay</span>
        </div>
      </div>
      <button class="btn wr-review-cta" data-start-chat="due" ${done ? "" : "disabled title='Hãy viết ít nhất 1 câu trước'"}>💬 Ôn tập đối đáp${dueCount ? ` (${dueCount})` : ""}</button>
    </div>
    <div class="wr-mode ${ai ? "on" : ""}">${ai ? `🤖 AI chấm bài: BẬT (${Gemini.providerLabel()})` : "📴 Chế độ offline: chấm bằng bộ phân tích ngữ pháp & đáp án mẫu"}</div>
    ${weeks}
  `;
}

// ---- Lesson ----------------------------------------------------------------------------
function currentLesson() { return getLesson(W.lessonId); }

function openLesson(lessonId, index = null) {
  const lesson = getLesson(lessonId);
  if (!lesson) return;
  W.view = "lesson";
  W.lessonId = lessonId;
  const items = getLessonSentences(lesson);
  // Mặc định vào câu đầu tiên chưa làm
  const firstTodo = items.findIndex(s => !WritingData.progress[s.id]);
  W.index = index ?? (firstTodo === -1 ? items.length : firstTodo);
  W.showGrammar = lessonStats(lesson).done === 0;
  resetSentenceState();
  renderWriting();
}

function resetSentenceState() {
  W.result = null;
  W.draft = "";
  W.showHint = false;
  W.showAnalysis = true;
  W.shadow = null;
  W.busy = false;
}

function goToSentence(i) {
  W.index = i;
  resetSentenceState();
  renderWriting();
}

function grammarBoxHtml(lesson) {
  const g = lesson.grammar;
  return `
    <div class="wr-grammar ${W.showGrammar ? "open" : ""}">
      <button class="wr-grammar-head" data-action="toggle-grammar">📘 Ngữ pháp: <b>${g.name}</b><span>${W.showGrammar ? "▲" : "▼"}</span></button>
      ${W.showGrammar ? `
        <div class="wr-grammar-body">
          <div class="wr-formula">${g.formula.map(f => `<code>${escapeHtml(f)}</code>`).join("")}</div>
          <ul>${g.notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
          ${g.examples.map(([en, vi]) => `<div class="wr-example"><button class="btn-icon sm" data-say="${escapeHtml(en)}">🔊</button><div><b>${escapeHtml(en)}</b><div class="sub">${escapeHtml(vi)}</div></div></div>`).join("")}
          <div class="label" style="margin-top:14px;">Từ vựng trọng tâm</div>
          <div class="wr-vocab">${lesson.vocab.map(([w, m]) => `
            <span class="wr-chip">
              <button data-say="${escapeHtml(w)}" title="Nghe">${escapeHtml(w)}</button>
              <small>${escapeHtml(m)}</small>
              ${hasVocab(w) ? `<em title="Đã có trong sổ từ">✓</em>` : `<button class="wr-chip-add" data-add-vocab="${escapeHtml(w)}" data-mean="${escapeHtml(m)}" title="Lưu vào sổ từ vựng">＋</button>`}
            </span>`).join("")}
          </div>
        </div>` : ""}
    </div>`;
}

function stepperHtml(items) {
  return `<div class="wr-stepper">${items.map((s, i) => {
    const p = WritingData.progress[s.id];
    const cls = [p ? VERDICT_UI[p.v]?.cls : "", i === W.index ? "current" : ""].join(" ");
    return `<button class="wr-step ${cls}" data-goto="${i}" title="Câu ${i + 1}">${i + 1}</button>`;
  }).join("")}<button class="wr-step summary ${W.index >= items.length ? "current" : ""}" data-goto="${items.length}" title="Tổng kết">★</button></div>`;
}

function lessonViewHtml() {
  const lesson = currentLesson();
  const items = getLessonSentences(lesson);
  const settings = WritingData.settings;
  return `
    <div class="wr-topbar">
      <button class="btn ghost sm" data-action="home">← Chủ đề</button>
      <div class="wr-title">${lesson.icon} ${lesson.title}</div>
      <div class="wr-toggles">
        <button class="wr-toggle ${settings.autoRead ? "on" : ""}" data-action="toggle-autoread" title="Tự động đọc lại câu sau khi chấm">🔊 Tự đọc lại</button>
        <button class="wr-toggle ${settings.rate < 1 ? "on" : ""}" data-action="toggle-rate" title="Đọc chậm">🐢 Chậm</button>
      </div>
    </div>
    ${grammarBoxHtml(lesson)}
    ${stepperHtml(items)}
    ${W.index >= items.length ? summaryHtml(lesson, items) : sentenceHtml(lesson, items)}
  `;
}

function hintHtml(sentence) {
  const words = sentence.en.split(" ");
  const start = words.slice(0, Math.max(1, Math.ceil(words.length / 3))).join(" ");
  return `<div class="wr-hint">💡 Bắt đầu bằng: <b>${escapeHtml(start)} …</b> · ${words.length} từ</div>`;
}

function sentenceHtml(lesson, items) {
  const s = items[W.index];
  const prev = WritingData.progress[s.id];
  const r = W.result;
  return `
    <div class="wr-card">
      <div class="label">Câu ${W.index + 1}/${items.length} · Dịch sang tiếng Anh ${s.id.includes("-x") ? `<span class="wr-badge">AI</span>` : ""}</div>
      <div class="wr-vi">${escapeHtml(s.vi)}</div>
      ${W.showHint && !r ? hintHtml(s) : ""}
      <textarea class="input wr-answer" id="wrAnswer" rows="2" placeholder="Viết câu tiếng Anh của bạn… (Ctrl/⌘ + Enter để chấm)" ${r ? "readonly" : ""} spellcheck="false"></textarea>
      ${prev && !r ? `<div class="sub wr-prev">Lần trước (${VERDICT_UI[prev.v]?.icon || ""} ${prev.s}/10): ${escapeHtml(prev.a)}</div>` : ""}
      <div class="runrow" style="margin-top:12px;">
        ${r ? `
          <button class="btn" data-action="next">${W.index + 1 < items.length ? "Câu tiếp →" : "Xem tổng kết ★"}</button>
          <button class="btn ghost" data-action="retry">↺ Viết lại</button>
        ` : `
          <button class="btn" data-action="submit" ${W.busy ? "disabled" : ""}>${W.busy ? "Đang chấm…" : "✓ Chấm bài"}</button>
          <button class="btn ghost" data-action="hint">💡 Gợi ý</button>
          <button class="btn ghost" data-action="reveal">👁 Xem đáp án</button>
        `}
      </div>
      ${r ? resultHtml(s, r) : ""}
    </div>`;
}

function resultHtml(sentence, r) {
  const ui = VERDICT_UI[r.verdict];
  const answer = W.draft;
  const readTarget = r.verdict === "correct" ? answer : r.corrected;
  const showNatural = r.natural && normalizeSentence(r.natural) !== normalizeSentence(readTarget);
  return `
    <div class="wr-result ${ui.cls}">
      <div class="wr-verdict">${ui.icon} ${ui.label} <span class="wr-score">${r.score}/10</span> ${r.source === "ai" ? `<span class="wr-badge">${Gemini.providerLabel().includes("Llama") ? "Llama 3.2 3B" : (Gemini.provider() === "bitnet" ? "BitNet 3B" : "AI")}</span>` : ""}</div>
      ${r.verdict !== "correct" && r.diffRef ? `<div class="wr-diff" title="So với câu sửa">${diffHtml(answer, r.diffRef)}</div>` : ""}
      ${r.verdict !== "correct" ? `<div class="wr-line"><span class="label">Câu sửa</span><span class="wr-en">${escapeHtml(r.corrected)}</span></div>` : ""}
      ${showNatural ? `<div class="wr-line"><span class="label">Tự nhiên</span><span class="wr-en">${escapeHtml(r.natural)}</span></div>` : ""}
      ${r.errors?.length ? `<ul class="wr-errors">${r.errors.map(e => `<li><b>${escapeHtml(e.type)}</b> — ${escapeHtml(e.explain)}</li>`).join("")}</ul>` : ""}
      ${r.tip ? `<div class="wr-tip">💡 ${escapeHtml(r.tip)}</div>` : ""}

      ${analysisHtml(sentence, r)}

      <div class="wr-readback">
        <div class="label">🔁 Đọc lại câu vừa viết</div>
        <div class="wr-readback-btns">
          <button class="btn ghost sm" data-say="${escapeHtml(answer)}">🔊 Câu của bạn</button>
          ${r.verdict !== "correct" ? `<button class="btn ghost sm" data-say="${escapeHtml(r.corrected)}">🔊 Câu sửa</button>` : ""}
          ${showNatural ? `<button class="btn ghost sm" data-say="${escapeHtml(r.natural)}">🔊 Bản tự nhiên</button>` : ""}
          <button class="btn ghost sm" data-say="${escapeHtml(readTarget)}" data-rate="0.7">🐢 Đọc chậm</button>
          <button class="btn ghost sm" data-action="shadow" data-target="${escapeHtml(readTarget)}">🎤 Đọc theo</button>
        </div>
        ${W.shadow ? shadowHtml(W.shadow) : ""}
      </div>
    </div>`;
}

function analysisHtml(sentence, r) {
  if (!r || !r.analysis) return "";
  const a = r.analysis;
  const isExpanded = W.showAnalysis !== false;

  // Thành phần câu (S - V - O - Prep/Adv)
  const compsHtml = (a.components || []).map(c => {
    const role = (c.label || "").toUpperCase();
    let roleClass = "other";
    let roleTitle = "Thành phần câu";
    if (role.startsWith("S")) { roleClass = "s"; roleTitle = "Chủ ngữ (Subject)"; }
    else if (role.startsWith("V")) { roleClass = "v"; roleTitle = "Động từ (Verb)"; }
    else if (role.startsWith("O")) { roleClass = "o"; roleTitle = "Tân ngữ (Object)"; }
    else if (role.includes("PREP")) { roleClass = "prep"; roleTitle = "Cụm giới từ (Prepositional)"; }
    else if (role.includes("ADV")) { roleClass = "adv"; roleTitle = "Trạng từ / Thời gian (Adverbial)"; }

    return `<span class="wr-syn-chip syn-${roleClass}" title="${escapeHtml(roleTitle)}"><span class="wr-syn-label">${escapeHtml(c.label)}</span> <span class="wr-syn-text">${escapeHtml(c.text)}</span></span>`;
  }).join('<span class="wr-syn-plus">+</span>');

  // Lưu ý đối chiếu riêng cho câu người học viết
  const learnerNotesHtml = (a.learnerNotes || []).map(n => `
    <div class="wr-ana-alert ${n.type}">
      <span class="wr-ana-alert-icon">${n.type === "warning" ? "⚠️" : "💡"}</span>
      <div class="wr-ana-alert-body">
        ${n.title ? `<div class="wr-ana-alert-title">${escapeHtml(n.title)}</div>` : ""}
        <div>${n.message}</div>
      </div>
    </div>
  `).join("");

  // Quy tắc chia từ (thêm -s/es, -ed, bất quy tắc, -ing)
  const rulesHtml = (a.rules || []).map(rule => `
    <div class="wr-rule-card">
      <div class="wr-rule-top">
        <span class="wr-rule-target">${escapeHtml(rule.target)}</span>
        <span class="wr-rule-type">${escapeHtml(rule.type)}</span>
      </div>
      <div class="wr-rule-desc">${rule.detail}</div>
    </div>
  `).join("");

  // Cấu trúc & Mẫu câu (be able to, used to, collocations...)
  const patternsHtml = (a.patterns || []).map(p => `
    <div class="wr-pat-card">
      <div class="wr-pat-top">
        <span class="wr-pat-name">📌 ${escapeHtml(p.name)}</span>
        ${p.formula ? `<code class="wr-pat-formula">${escapeHtml(p.formula)}</code>` : ""}
      </div>
      <div class="wr-pat-usage">${escapeHtml(p.usage)}</div>
    </div>
  `).join("");

  return `
    <div class="wr-analysis ${isExpanded ? "open" : ""}">
      <button class="wr-analysis-head" data-action="toggle-analysis">
        <span>📐 <b>Phân tích cấu trúc & ngữ pháp câu</b></span>
        <span class="wr-analysis-arrow">${isExpanded ? "▲ Thu gọn" : "▼ Chi tiết cấu trúc"}</span>
      </button>

      ${isExpanded ? `
        <div class="wr-analysis-body">
          ${learnerNotesHtml}

          <!-- Cấu trúc tổng quát & Cú pháp S-V-O -->
          <div class="wr-ana-block">
            <div class="wr-ana-label">🏗️ Cấu trúc câu</div>
            <div class="wr-ana-formula"><code>${escapeHtml(a.structure || "S + V + O")}</code></div>
            ${compsHtml ? `<div class="wr-syn-bar">${compsHtml}</div>` : ""}
          </div>

          <!-- Quy tắc chia động từ & biến đổi từ -->
          ${rulesHtml ? `
            <div class="wr-ana-block">
              <div class="wr-ana-label">⚡ Quy tắc biến đổi & chia từ (s/es, ed, quá khứ)</div>
              <div class="wr-rule-grid">${rulesHtml}</div>
            </div>` : ""}

          <!-- Mẫu câu & Cụm từ cần nhớ -->
          ${patternsHtml ? `
            <div class="wr-ana-block">
              <div class="wr-ana-label">🧩 Mẫu câu & Cụm từ cần nhớ (Collocations)</div>
              <div class="wr-pat-grid">${patternsHtml}</div>
            </div>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function shadowHtml(sh) {
  if (sh.listening) return `<div class="wr-shadow">🎙 Đang nghe… đọc to câu trên</div>`;
  if (sh.error) return `<div class="wr-shadow err">${escapeHtml(sh.error)}</div>`;
  const pct = Math.round(sh.sim * 100);
  return `<div class="wr-shadow">
    <div>Bạn đọc: <i>"${escapeHtml(sh.heard)}"</i> — khớp <b class="${pct >= 85 ? "wr-ok" : "wr-bad"}">${pct}%</b></div>
    <div class="wr-diff">${diffHtml(sh.heard, sh.target)}</div>
  </div>`;
}

function summaryHtml(lesson, items) {
  const s = lessonStats(lesson);
  const rows = items.map((it, i) => {
    const p = WritingData.progress[it.id];
    const en = p ? (p.v === "correct" ? p.a : p.c || it.en) : it.en;
    return `
      <div class="wr-sum-row ${i === W.playingIndex ? "playing" : ""}" data-row="${i}">
        <span class="wr-sum-icon">${p ? VERDICT_UI[p.v]?.icon : "⬜"}</span>
        <div class="wr-sum-text">
          <div class="sub">${escapeHtml(it.vi)}</div>
          <div class="wr-en">${escapeHtml(en)}</div>
          ${p && p.v !== "correct" ? `<div class="wr-sum-mine">Bạn viết: ${escapeHtml(p.a)}</div>` : ""}
        </div>
        <button class="btn-icon sm" data-say="${escapeHtml(en)}">🔊</button>
      </div>`;
  }).join("");
  const wrongCount = items.filter(it => WritingData.progress[it.id] && WritingData.progress[it.id].v !== "correct").length;

  return `
    <div class="wr-card">
      <div class="wr-sum-head">
        <div>
          <div class="wr-h2">★ Tổng kết: ${s.done}/${s.total} câu · ${s.correct} đúng</div>
          <div class="sub">Nghe lại toàn bộ bài theo bản đã sửa, rồi đối đáp để khắc sâu.</div>
        </div>
      </div>
      <div class="runrow" style="margin:14px 0;">
        <button class="btn" data-action="play-all">▶ Đọc lại cả bài</button>
        <button class="btn ghost" data-action="stop-all">■ Dừng</button>
        <button class="btn" data-start-chat="lesson" ${s.done ? "" : "disabled"}>💬 Đối đáp ôn bài này</button>
        ${wrongCount ? `<button class="btn ghost" data-action="redo-wrong">↺ Làm lại ${wrongCount} câu chưa đúng</button>` : ""}
      </div>
      <div class="wr-sum-list">${rows}</div>
      <div class="runrow" style="margin-top:16px;">
        <button class="btn ghost" data-action="gen-more" ${Gemini.isAvailable() ? "" : "disabled title='Cần Gemini key'"}>🤖 Tạo thêm 8 câu cho chủ đề này</button>
      </div>
    </div>`;
}

// ---- Actions ----------------------------------------------------------------------------
async function submitAnswer() {
  const lesson = currentLesson();
  const sentence = getLessonSentences(lesson)[W.index];
  const answer = (document.getElementById("wrAnswer")?.value || "").trim();
  if (!answer || W.busy) return;
  W.draft = answer;
  W.busy = true;
  renderWriting();

  const result = await gradeSentence(sentence, answer, lesson);
  recordResult(sentence.id, answer, result);
  // Người học đã chuyển sang câu/bài khác trong lúc chờ chấm
  if (W.view !== "lesson" || currentLesson() !== lesson || getLessonSentences(lesson)[W.index]?.id !== sentence.id) return;
  W.busy = false;
  W.result = result;
  renderWriting();

  // Đọc lại câu: đúng thì đọc câu của người học, sai thì đọc câu đã sửa
  if (WritingData.settings.autoRead) {
    speak(result.verdict === "correct" ? answer : result.corrected, { rate: WritingData.settings.rate });
  }
}

function revealAnswer() {
  const lesson = currentLesson();
  const sentence = getLessonSentences(lesson)[W.index];
  W.draft = (document.getElementById("wrAnswer")?.value || "").trim() || "(bỏ qua)";
  const analysis = buildGrammarAnalysis(sentence, W.draft, lesson, null);
  W.result = {
    score: 0, verdict: "wrong", corrected: sentence.en, natural: sentence.en,
    errors: [], tip: sentence.alt?.length ? `Cách khác: ${sentence.alt.map(a => `"${a}"`).join(" / ")}` : "", diffRef: null, source: "local",
    analysis,
  };
  recordResult(sentence.id, W.draft, W.result);
  renderWriting();
  if (WritingData.settings.autoRead) speak(sentence.en, { rate: WritingData.settings.rate });
}

async function startShadow(target) {
  W.shadow = { listening: true };
  renderWriting();
  try {
    const heard = await listenOnce();
    W.shadow = { heard, target, sim: similarity(heard, target) };
  } catch (e) {
    W.shadow = { error: micErrorMessage(e.message) };
  }
  renderWriting();
}

function setPlayingRow(i) {
  W.playingIndex = i;
  writingRoot.querySelectorAll(".wr-sum-row").forEach(row => row.classList.toggle("playing", +row.dataset.row === i));
  writingRoot.querySelector(`.wr-sum-row[data-row="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

async function playWholeLesson() {
  const lesson = currentLesson();
  const items = getLessonSentences(lesson);
  const texts = items.map(it => {
    const p = WritingData.progress[it.id];
    return p ? (p.v === "correct" ? p.a : p.c || it.en) : it.en;
  });
  await speakSequence(texts, { pauseMs: 700, rate: WritingData.settings.rate, onStep: setPlayingRow });
  setPlayingRow(-1);
}

async function generateMore() {
  const btn = writingRoot.querySelector('[data-action="gen-more"]');
  const countKey = `writing_gen_count_${getTodayStr()}`;
  const count = parseInt(Store.get(countKey, "0"));
  if (count >= 10) { alert("Mỗi ngày chỉ tạo thêm tối đa 10 lượt để tiết kiệm API!"); return; }
  btn.disabled = true;
  btn.textContent = "Đang tạo câu…";
  try {
    const lesson = currentLesson();
    const before = getLessonSentences(lesson).length;
    const added = await generateExtraSentences(lesson);
    Store.setLocal(countKey, String(count + 1));
    openLesson(lesson.id, before);
    if (!added) alert("AI không trả về câu hợp lệ, thử lại nhé.");
  } catch (e) {
    alert("Không thể tạo thêm câu: " + e.message);
    btn.disabled = false;
    btn.textContent = "🤖 Tạo thêm 8 câu cho chủ đề này";
  }
}

function handleWritingClick(e) {
  const t = e.target;

  const say = t.closest("[data-say]");
  if (say) {
    stopSpeaking();
    speak(say.dataset.say, { rate: say.dataset.rate ? +say.dataset.rate : WritingData.settings.rate });
    return;
  }
  const open = t.closest("[data-open-lesson]");
  if (open) return openLesson(open.dataset.openLesson);
  const go = t.closest("[data-goto]");
  if (go) return goToSentence(+go.dataset.goto);
  const add = t.closest("[data-add-vocab]");
  if (add) {
    addVocab(add.dataset.addVocab, add.dataset.mean);
    W.draft = document.getElementById("wrAnswer")?.value ?? W.draft;
    return renderWriting();
  }
  const chat = t.closest("[data-start-chat]");
  if (chat && !chat.disabled) {
    return startReviewChat(chat.dataset.startChat === "lesson" ? { type: "lesson", lessonId: W.lessonId } : { type: "due" });
  }

  const action = t.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const keepDraft = () => { W.draft = document.getElementById("wrAnswer")?.value ?? W.draft; };
  switch (action) {
    case "home": W.view = "home"; renderWriting(); break;
    case "toggle-grammar": keepDraft(); W.showGrammar = !W.showGrammar; renderWriting(); break;
    case "toggle-analysis": keepDraft(); W.showAnalysis = !W.showAnalysis; renderWriting(); break;
    case "toggle-autoread":
      keepDraft();
      WritingData.settings.autoRead = !WritingData.settings.autoRead;
      WritingData.saveSettings(); renderWriting(); break;
    case "toggle-rate":
      keepDraft();
      WritingData.settings.rate = WritingData.settings.rate < 1 ? 1 : 0.75;
      WritingData.saveSettings(); renderWriting(); break;
    case "submit": submitAnswer(); break;
    case "hint": keepDraft(); W.showHint = true; renderWriting(); break;
    case "reveal": revealAnswer(); break;
    case "retry": { const d = W.draft; resetSentenceState(); W.draft = d; renderWriting(); break; }
    case "next": goToSentence(W.index + 1); break;
    case "shadow": startShadow(t.closest("[data-target]").dataset.target); break;
    case "play-all": playWholeLesson(); break;
    case "stop-all": stopSpeaking(); setPlayingRow(-1); break;
    case "redo-wrong": {
      const items = getLessonSentences(currentLesson());
      const i = items.findIndex(it => WritingData.progress[it.id] && WritingData.progress[it.id].v !== "correct");
      if (i !== -1) goToSentence(i);
      break;
    }
    case "gen-more": generateMore(); break;
  }
}

function initWriting() {
  writingRoot = document.getElementById("writingRoot");
  WritingData.load();

  initDialogue();
  writingRoot.addEventListener("click", handleWritingClick);
  writingRoot.addEventListener("keydown", e => {
    if (e.target.id === "wrAnswer" && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitAnswer();
    }
  });

  const refreshIfIdle = () => {
    // Không render lại khi đang gõ hoặc đang chat để khỏi mất trạng thái
    if (W.view === "home") renderWriting();
  };
  onRemoteField("writing_progress", p => { WritingData.progress = p; Store.setLocal("writing_progress", p); refreshIfIdle(); });
  onRemoteField("writing_extra", x => { WritingData.extra = x; Store.setLocal("writing_extra", x); refreshIfIdle(); });
  onTabShow("writing", () => { if (W.view === "home") renderWriting(); });

  renderWriting();
}
