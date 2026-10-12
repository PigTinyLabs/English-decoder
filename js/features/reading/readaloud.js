// ---- Reading: 🎤 Tự đọc to như đọc truyện ------------------------------------------------
// Nhận giọng liên tục (continuous + interim) và dò theo chữ trong đoạn đang đọc:
// chữ đọc đúng sáng xanh, chữ bị bỏ qua tô đỏ. Đọc hết đoạn → chấm điểm và tự sang đoạn kế.
// Chrome tự ngắt nhận giọng sau vài giây im lặng → tự khởi động lại, giữ nguyên tiến độ.

const ALOUD_LOOKAHEAD = 4; // cho phép đọc lố / nuốt tối đa 3 chữ mà vẫn bắt kịp

const Aloud = {
  active: false,
  rec: null,
  p: -1,          // đoạn đang đọc
  tokens: [],     // [{ tok, w }] — từ đã chuẩn hoá, w = chỉ số chữ hiển thị
  basePtr: 0,     // tiến độ khi bắt đầu phiên nhận giọng hiện tại
  baseRead: new Set(),
  ptr: 0,
  read: new Set(),
  consumed: 0,    // số từ trong transcript phiên hiện tại đã dùng cho các đoạn trước
  lastWords: [],
  status: "",
};

function readAloudActive() { return Aloud.active; }
function readAloudStatusText() { return Aloud.status; }

function setAloudStatus(text) {
  Aloud.status = text;
  const el = document.getElementById("rdAloudStatus");
  if (el) el.textContent = text;
}

function buildAloudTokens(en) {
  const tokens = [];
  let w = 0;
  splitSentences(en).forEach(sentence => {
    sentence.split(/\s+/).forEach(word => {
      wordsOf(word).forEach(tok => tokens.push({ tok, w }));
      w++;
    });
  });
  return tokens;
}

function tokensMatch(target, spoken) {
  if (target === spoken) return true;
  // Chấp nhận khác đuôi (walk/walked, girl/girls) với từ đủ dài
  if (target.length > 3 && spoken.length > 3) {
    return target.startsWith(spoken.slice(0, -1)) || spoken.startsWith(target.slice(0, -1));
  }
  return false;
}

function advanceAloud(spokenWords) {
  let ptr = Aloud.basePtr;
  const read = new Set(Aloud.baseRead);
  for (const sw of spokenWords) {
    for (let k = 0; k < ALOUD_LOOKAHEAD && ptr + k < Aloud.tokens.length; k++) {
      if (tokensMatch(Aloud.tokens[ptr + k].tok, sw)) {
        read.add(ptr + k);
        ptr += k + 1;
        break;
      }
    }
  }
  Aloud.ptr = ptr;
  Aloud.read = read;
}

function paintAloud() {
  const el = paraEl(Aloud.p);
  if (!el) return;
  const readWords = new Set([...Aloud.read].map(i => Aloud.tokens[i].w));
  const nextWord = Aloud.tokens[Aloud.ptr]?.w;
  el.querySelectorAll(".rd-w").forEach(span => {
    const w = +span.dataset.w;
    const passed = Aloud.tokens.some((t, i) => t.w === w && i < Aloud.ptr);
    span.classList.toggle("rd-ok", readWords.has(w));
    span.classList.toggle("rd-miss", passed && !readWords.has(w));
    span.classList.toggle("rd-next", w === nextWord);
  });
  const pct = Aloud.tokens.length ? Math.round((Aloud.read.size / Aloud.tokens.length) * 100) : 0;
  setAloudStatus(`🎙 Đang nghe đoạn ${Aloud.p + 1} · ${pct}% chữ đúng`);
}

function beginAloudPara(p) {
  const paras = currentChapter().paras;
  while (p < paras.length && !paras[p].en) p++;
  if (p >= paras.length) return false;
  Aloud.p = p;
  Aloud.tokens = buildAloudTokens(paras[p].en);
  Aloud.basePtr = 0;
  Aloud.baseRead = new Set();
  Aloud.ptr = 0;
  Aloud.read = new Set();
  setCurrentPara(p);
  paraEl(p)?.classList.add("aloud");
  paintAloud();
  return true;
}

function showParaScore(p, score) {
  const tools = paraEl(p)?.querySelector(".rd-tools");
  if (!tools) return;
  tools.querySelector(".rd-score")?.remove();
  tools.insertAdjacentHTML("beforeend", `<span class="rd-score ${score >= 85 ? "good" : score >= 60 ? "ok" : "bad"}" title="Độ chính xác khi bạn tự đọc">🎤 ${score}%</span>`);
}

// Chấm điểm đoạn vừa đọc, lưu thống kê, chuyển sang đoạn kế
function finishAloudPara() {
  const score = Aloud.tokens.length ? Math.round((Aloud.read.size / Aloud.tokens.length) * 100) : 0;
  R.scores[Aloud.p] = score;
  const entry = R.progress[R.book.id] || { ch: R.ch, p: R.cur };
  entry.aloud = { n: (entry.aloud?.n || 0) + 1, sum: (entry.aloud?.sum || 0) + score };
  R.progress[R.book.id] = entry;
  saveReadingProgress();

  const el = paraEl(Aloud.p);
  if (el) {
    el.classList.remove("aloud");
    el.querySelector(".rd-next")?.classList.remove("rd-next");
  }
  showParaScore(Aloud.p, score);

  Aloud.consumed = Aloud.lastWords.length;
  if (!beginAloudPara(Aloud.p + 1)) {
    const scores = Object.values(R.scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
    stopReadAloud();
    alert(`🎉 Hết chương! Bạn đã tự đọc ${scores.length} đoạn, trung bình ${avg}% chữ đúng.`);
  }
}

function handleAloudResult(event) {
  let transcript = "";
  for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript + " ";
  Aloud.lastWords = wordsOf(transcript);
  advanceAloud(Aloud.lastWords.slice(Aloud.consumed));
  paintAloud();
  if (Aloud.ptr >= Aloud.tokens.length) finishAloudPara();
}

function startRecognitionSession() {
  const rec = new SpeechRecognition();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = handleAloudResult;
  rec.onerror = e => {
    if (e.error === "no-speech" || e.error === "aborted") return;
    setAloudStatus(micErrorMessage(e.error));
    stopReadAloud(false);
    alert(micErrorMessage(e.error));
  };
  rec.onend = () => {
    if (!Aloud.active || Aloud.rec !== rec) return;
    // Phiên mới có transcript trống → chốt tiến độ hiện tại làm điểm xuất phát
    Aloud.basePtr = Aloud.ptr;
    Aloud.baseRead = new Set(Aloud.read);
    Aloud.consumed = 0;
    Aloud.lastWords = [];
    // Còn thiếu 1 chữ cuối mà đã ngừng nói → coi như đọc xong đoạn
    if (Aloud.tokens.length - Aloud.ptr <= 1 && Aloud.ptr > 0) finishAloudPara();
    if (Aloud.active) setTimeout(() => { if (Aloud.active) startRecognitionSession(); }, 150);
  };
  Aloud.rec = rec;
  try { rec.start(); } catch (e) { console.warn("Recognition start failed:", e); }
}

function startReadAloud(p) {
  if (!SpeechRecognition) {
    alert(micErrorMessage("unsupported"));
    return;
  }
  stopPlaying();
  stopSpeaking();
  hideWordPopup();
  Aloud.active = true;
  Aloud.consumed = 0;
  Aloud.lastWords = [];
  readingRoot.querySelector(".rd-page")?.classList.add("aloud-mode");
  if (!beginAloudPara(p)) { Aloud.active = false; return; }
  const btn = readingRoot.querySelector('[data-rd="aloud"]');
  if (btn) { btn.textContent = "■ Dừng tự đọc"; btn.classList.remove("ghost"); }
  renderReadingBar();
  startRecognitionSession();
}

function stopReadAloud(keepStatus = false) {
  if (!Aloud.active) return;
  Aloud.active = false;
  const rec = Aloud.rec;
  Aloud.rec = null;
  try { rec?.stop(); } catch (e) { }
  // Đoạn đọc dở vẫn được chấm nếu đã đọc được ít nhất 1 chữ
  if (Aloud.read.size && R.scores[Aloud.p] === undefined) {
    R.scores[Aloud.p] = Math.round((Aloud.read.size / Aloud.tokens.length) * 100);
    showParaScore(Aloud.p, R.scores[Aloud.p]);
  }
  const el = paraEl(Aloud.p);
  el?.classList.remove("aloud");
  el?.querySelectorAll(".rd-next").forEach(s => s.classList.remove("rd-next"));
  readingRoot.querySelector(".rd-page")?.classList.remove("aloud-mode");
  const btn = readingRoot.querySelector('[data-rd="aloud"]');
  if (btn) { btn.textContent = "🎤 Tự đọc"; btn.classList.add("ghost"); }
  if (!keepStatus) Aloud.status = "";
  renderReadingBar();
}
