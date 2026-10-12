// ---- Reading: thư viện + trình đọc truyện song ngữ ------------------------------------
// - Loa: máy đọc từng câu, tô sáng câu đang đọc, tự sang chương sau
// - Song ngữ: BẬT → hiện bản dịch dưới mỗi đoạn; TẮT → tự đọc hiểu, bấm 👁 để xem nghĩa từng đoạn
// - 🎤 Tự đọc: xem readaloud.js
//
// reading_settings (local): { bilingual, fontSize, rate, readVi }
// reading_progress (sync):  { [bookId]: { ch, p, t, aloud: { n, sum } } }

const R = {
  view: "library",
  books: [],          // sách đã nhập (IndexedDB)
  book: null,
  ch: 0,
  cur: 0,             // đoạn đang đọc
  revealed: new Set(),// đoạn đã bấm xem nghĩa khi tắt song ngữ
  playing: false,
  scores: {},         // điểm tự đọc theo đoạn (phiên hiện tại)
  settings: { bilingual: true, fontSize: 18, rate: 1, readVi: false },
  progress: {},
};

let readingRoot, readingBar, wordPopup;
let progressSyncTimer = null;
const lookupCache = new Map();

function loadReadingState() {
  R.settings = { ...R.settings, ...Store.getJSON("reading_settings", {}) };
  R.progress = Store.getJSON("reading_progress", {});
}
function saveReadingSettings() { Store.setLocal("reading_settings", R.settings); }

// Vị trí đọc lưu local ngay, đồng bộ cloud sau vài giây để khỏi ghi Firestore liên tục
function saveReadingProgress() {
  if (!R.book) return;
  const prev = R.progress[R.book.id] || {};
  R.progress[R.book.id] = { ...prev, ch: R.ch, p: R.cur, t: Date.now() };
  Store.setLocal("reading_progress", R.progress);
  clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(() => syncDataToFirebase("reading_progress", R.progress), 4000);
}

function allBooks() { return SAMPLE_BOOKS.concat(R.books); }
function currentChapter() { return R.book.chapters[R.ch]; }

// ---- Library ----------------------------------------------------------------------------
async function refreshLibrary() {
  try {
    R.books = (await LocalDB.getAll("books")).sort((a, b) => b.addedAt - a.addedAt);
  } catch (e) {
    console.warn("IndexedDB unavailable:", e);
    R.books = [];
  }
  if (R.view === "library") renderReading();
}

// Sách tự nhập (sách Drive có kệ riêng)
function userBooks() { return R.books.filter(b => b.source !== "drive"); }

function driveCardHtml(meta) {
  const saved = R.books.find(b => b.id === driveBookId(meta.driveId));
  if (saved) return bookCardHtml(saved);
  const loading = R.driveLoading === meta.driveId;
  const error = R.driveErrors?.[meta.driveId];
  return `
    <div class="rd-book rd-book-cloud" data-drive-book="${escapeHtml(meta.driveId)}">
      <div class="rd-book-cover">${meta.cover}</div>
      <div class="rd-book-info">
        <div class="rd-book-title">${escapeHtml(meta.title)}</div>
        <div class="sub">${escapeHtml(meta.titleVi)}</div>
        <div class="rd-book-meta">${loading ? "⏳ Đang tải từ Drive…" : `☁️ Bấm để tải · ${escapeHtml(meta.size)}`}</div>
        ${error ? `<div class="rd-book-err">${escapeHtml(error)}<br>
          <a href="${driveFileUrl(meta.driveId)}" target="_blank" rel="noopener">Mở trên Drive</a> → tải file về → bấm <b>📥 Nhập EPUB</b>.</div>` : ""}
      </div>
    </div>`;
}

async function openDriveBook(driveId) {
  const id = driveBookId(driveId);
  if (R.books.some(b => b.id === id)) return openBook(id);
  if (R.driveLoading) return;
  const meta = DRIVE_BOOKS.find(b => b.driveId === driveId);
  R.driveLoading = driveId;
  R.driveErrors = { ...R.driveErrors, [driveId]: "" };
  renderReading();
  try {
    const book = await downloadDriveBook(meta);
    await LocalDB.put("books", book);
    R.driveLoading = null;
    await refreshLibrary();
    if (R.view === "library") openBook(id);
  } catch (e) {
    console.warn(e);
    R.driveLoading = null;
    R.driveErrors = { ...R.driveErrors, [driveId]: e.message };
    renderReading();
  }
}

function bookCardHtml(book) {
  const p = R.progress[book.id];
  const chapters = book.chapters.length;
  const pct = p ? Math.round(((p.ch + 1) / chapters) * 100) : 0;
  const aloud = p?.aloud?.n ? Math.round(p.aloud.sum / p.aloud.n) : null;
  return `
    <div class="rd-book" data-open-book="${escapeHtml(book.id)}">
      <div class="rd-book-cover">${book.cover || "📘"}</div>
      <div class="rd-book-info">
        <div class="rd-book-title">${escapeHtml(book.title)}</div>
        ${book.titleVi ? `<div class="sub">${escapeHtml(book.titleVi)}</div>` : ""}
        <div class="rd-book-meta">
          ${book.level ? `<span class="wr-badge">${escapeHtml(book.level)}</span>` : ""}
          <span>${chapters} chương</span>
          ${book.stats ? `<span>${Math.round((book.stats.translated / Math.max(1, book.stats.paras)) * 100)}% song ngữ</span>` : ""}
          ${aloud !== null ? `<span title="Độ chính xác khi tự đọc">🎤 ${aloud}%</span>` : ""}
        </div>
        ${p ? `<div class="wr-progress"><span style="width:${pct}%"></span></div><div class="rd-book-meta">Đang ở chương ${p.ch + 1}/${chapters}</div>` : ""}
      </div>
      ${book.source === "epub" || book.source === "drive" ? `<button class="btn-icon sm rd-book-del" data-delete-book="${escapeHtml(book.id)}" title="Xoá bản lưu trên máy">🗑</button>` : ""}
    </div>`;
}

function libraryHtml() {
  const recent = allBooks()
    .filter(b => R.progress[b.id])
    .sort((a, b) => R.progress[b.id].t - R.progress[a.id].t)[0];
  return `
    <div class="wr-hero">
      <div>
        <div class="wr-h1">📖 Reading</div>
        <div class="sub">Đọc truyện song ngữ: nghe máy đọc, tự đọc to để luyện phát âm, bật/tắt bản dịch để tự đọc hiểu.</div>
      </div>
      <div class="rd-import">
        <label class="btn" for="rdImportInput">📥 Nhập EPUB</label>
        <input type="file" id="rdImportInput" accept=".epub,application/epub+zip" multiple hidden />
      </div>
    </div>
    ${recent ? `<button class="rd-continue" data-open-book="${escapeHtml(recent.id)}">▶ Đọc tiếp <b>${escapeHtml(recent.title)}</b> — chương ${R.progress[recent.id].ch + 1}</button>` : ""}
    <div id="rdImportStatus"></div>
    <div class="board-title">📂 Truyện song ngữ từ Drive</div>
    <div class="rd-shelf">${DRIVE_BOOKS.map(driveCardHtml).join("")}</div>
    <div class="sub" style="margin:8px 0 24px;">Tải từ <a href="${DRIVE_FOLDER_URL}" target="_blank" rel="noopener" style="color:var(--cyan)">thư mục Google Drive</a> ở lần mở đầu tiên, sau đó lưu trên máy để đọc lại ngay.</div>
    <div class="board-title">Truyện mẫu</div>
    <div class="rd-shelf">${SAMPLE_BOOKS.map(bookCardHtml).join("")}</div>
    <div class="board-title" style="margin-top:24px;">Sách của bạn</div>
    ${userBooks().length
      ? `<div class="rd-shelf">${userBooks().map(bookCardHtml).join("")}</div>`
      : `<div class="wr-mode">Chưa có sách nào. Tải file <b>.epub</b> (VD truyện song ngữ trên Google Drive của bạn) về máy rồi bấm <b>📥 Nhập EPUB</b>.</div>`}
    <div class="sub" style="margin-top:12px;">🔒 Sách bạn nhập chỉ được lưu trong trình duyệt trên máy này, không tải lên đâu cả.</div>
  `;
}

async function importEpubFiles(files) {
  const status = document.getElementById("rdImportStatus");
  for (const file of files) {
    status.innerHTML = `<div class="wr-mode">⏳ Đang đọc <b>${escapeHtml(file.name)}</b>…</div>`;
    try {
      let book = await parseEpub(file);
      // File tải tay từ thư mục Drive → gắn vào đúng thẻ trên kệ Drive
      const name = `${file.name} ${book.title}`.toLowerCase();
      const meta = DRIVE_BOOKS.find(m => name.includes(m.title.toLowerCase()));
      if (meta) {
        book = { ...book, id: driveBookId(meta.driveId), title: meta.title, titleVi: meta.titleVi, cover: meta.cover, source: "drive", driveId: meta.driveId };
      }
      await LocalDB.put("books", book);
      status.innerHTML = `<div class="wr-mode on">✓ Đã nhập <b>${escapeHtml(book.title)}</b>: ${book.chapters.length} chương, ${book.stats.paras} đoạn, ${book.stats.translated} đoạn có bản dịch.</div>`;
    } catch (e) {
      console.error(e);
      status.innerHTML = `<div class="wr-mode" style="color:var(--red)">✗ ${escapeHtml(file.name)}: ${escapeHtml(e.message)}</div>`;
    }
  }
  const msg = status.innerHTML;
  await refreshLibrary();
  document.getElementById("rdImportStatus").innerHTML = msg;
}

// ---- Reader -----------------------------------------------------------------------------
function openBook(bookId, ch = null, p = null) {
  const book = allBooks().find(b => b.id === bookId);
  if (!book) return;
  const saved = R.progress[bookId];
  R.view = "reader";
  R.book = book;
  R.ch = Math.min(ch ?? saved?.ch ?? 0, book.chapters.length - 1);
  R.cur = p ?? (ch === null ? saved?.p ?? 0 : 0);
  R.revealed = new Set();
  R.scores = {};
  renderReading();
  scrollToPara(R.cur, "auto");
}

function splitSentences(text) {
  return text.match(/[^.!?…]+(?:[.!?…]+["”’')\]]*|$)\s*/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

// Đoạn tiếng Anh → các câu (để tô sáng khi đọc) → các từ (để tra từ / tự đọc)
function paraEnHtml(en, savedWords) {
  let w = 0;
  return splitSentences(en).map((sentence, s) => {
    const words = sentence.split(/\s+/).map(word => {
      const key = word.toLowerCase().replace(/[^a-z'’-]/g, "");
      const saved = savedWords.has(key) ? " rd-saved" : "";
      return `<span class="rd-w${saved}" data-w="${w++}">${escapeHtml(word)}</span>`;
    }).join(" ");
    return `<span class="rd-s" data-s="${s}">${words}</span>`;
  }).join(" ");
}

function paraHtml(para, i, savedWords) {
  const showVi = R.settings.bilingual || R.revealed.has(i);
  if (!para.en) {
    return R.settings.bilingual ? `<div class="rd-para vi-only" data-p="${i}"><div class="rd-vi">${escapeHtml(para.vi)}</div></div>` : "";
  }
  const score = R.scores[i];
  return `
    <div class="rd-para ${i === R.cur ? "current" : ""}" data-p="${i}">
      <div class="rd-en">${paraEnHtml(para.en, savedWords)}</div>
      ${para.vi && showVi ? `<div class="rd-vi">${escapeHtml(para.vi)}</div>` : ""}
      <div class="rd-tools">
        <button class="rd-tool" data-rd="say-para" data-p="${i}" title="Nghe đoạn này">🔊</button>
        <button class="rd-tool" data-rd="aloud-from" data-p="${i}" title="Tự đọc to từ đoạn này">🎤</button>
        ${para.vi && !R.settings.bilingual ? `<button class="rd-tool" data-rd="reveal" data-p="${i}">${R.revealed.has(i) ? "🙈 Ẩn nghĩa" : "👁 Xem nghĩa"}</button>` : ""}
        ${!para.vi && R.settings.bilingual && Gemini.isAvailable() ? `<button class="rd-tool" data-rd="translate" data-p="${i}">🤖 Dịch đoạn này</button>` : ""}
        ${score !== undefined ? `<span class="rd-score ${score >= 85 ? "good" : score >= 60 ? "ok" : "bad"}" title="Độ chính xác khi bạn tự đọc">🎤 ${score}%</span>` : ""}
      </div>
    </div>`;
}

function readerHtml() {
  const book = R.book;
  const chapter = currentChapter();
  const savedWords = new Set(vocabList.map(v => v.word.toLowerCase()));
  const s = R.settings;
  const aloud = R.progress[book.id]?.aloud;
  return `
    <div class="wr-topbar">
      <button class="btn ghost sm" data-rd="library">← Thư viện</button>
      <div class="wr-title">${book.cover || "📘"} ${escapeHtml(book.title)}</div>
      ${aloud?.n ? `<span class="sub" title="Độ chính xác trung bình khi tự đọc">🎤 ${Math.round(aloud.sum / aloud.n)}% · ${aloud.n} đoạn</span>` : ""}
    </div>
    <div class="rd-toolbar">
      <select class="input rd-chapter" data-rd-select="chapter">
        ${book.chapters.map((c, i) => `<option value="${i}" ${i === R.ch ? "selected" : ""}>${/^\d/.test(c.title) ? "" : `${i + 1}. `}${escapeHtml(c.title)}</option>`).join("")}
      </select>
      <button class="btn sm" data-rd="play">${R.playing ? "⏸ Dừng" : "🔊 Nghe đọc"}</button>
      <button class="btn sm ${readAloudActive() ? "" : "ghost"}" data-rd="aloud">${readAloudActive() ? "■ Dừng tự đọc" : "🎤 Tự đọc"}</button>
      <label class="rd-switch" title="Hiện bản dịch tiếng Việt dưới mỗi đoạn">
        <input type="checkbox" data-rd-toggle="bilingual" ${s.bilingual ? "checked" : ""} /><span></span> Song ngữ
      </label>
      <div class="rd-toolbar-right">
        ${s.bilingual ? `<button class="wr-toggle ${s.readVi ? "on" : ""}" data-rd="read-vi" title="Khi nghe, đọc thêm bản dịch tiếng Việt sau mỗi đoạn">🇻🇳 Đọc kèm nghĩa</button>` : ""}
        <select class="input rd-rate" data-rd-select="rate" title="Tốc độ đọc">
          ${[0.75, 1, 1.25].map(r => `<option value="${r}" ${r === s.rate ? "selected" : ""}>${r}×</option>`).join("")}
        </select>
        <button class="wr-toggle" data-rd="font-down" title="Chữ nhỏ hơn">A−</button>
        <button class="wr-toggle" data-rd="font-up" title="Chữ to hơn">A+</button>
      </div>
    </div>
    <div class="rd-page" style="--rd-font:${s.fontSize}px">
      <div class="rd-chapter-title">${escapeHtml(chapter.title)}</div>
      ${chapter.paras.map((p, i) => paraHtml(p, i, savedWords)).join("")}
    </div>
    <div class="runrow rd-nav">
      <button class="btn ghost" data-rd="prev-ch" ${R.ch === 0 ? "disabled" : ""}>← Chương trước</button>
      <span class="sub">Chương ${R.ch + 1}/${book.chapters.length}</span>
      <button class="btn ghost" data-rd="next-ch" ${R.ch >= book.chapters.length - 1 ? "disabled" : ""}>Chương sau →</button>
    </div>
  `;
}

function renderReading() {
  if (!readingRoot) return;
  hideWordPopup();
  readingRoot.innerHTML = R.view === "reader" ? readerHtml() : libraryHtml();
  renderReadingBar();
}

// Thanh điều khiển nổi ở đáy màn hình khi đang nghe / tự đọc (toolbar trên cùng có thể đã cuộn khuất)
function renderReadingBar() {
  const aloud = readAloudActive();
  if (R.view !== "reader" || (!R.playing && !aloud)) {
    readingBar.classList.remove("show");
    return;
  }
  readingBar.innerHTML = aloud
    ? `<span class="rd-bar-dot rec"></span><span id="rdAloudStatus">${escapeHtml(readAloudStatusText())}</span><button class="btn sm" data-rd="aloud">■ Dừng</button>`
    : `<span class="rd-bar-dot"></span><span>Đang đọc · chương ${R.ch + 1}</span><button class="btn sm" data-rd="play">⏸ Dừng</button>`;
  readingBar.classList.add("show");
}

function paraEl(i) { return readingRoot.querySelector(`.rd-para[data-p="${i}"]`); }

function scrollToPara(i, behavior = "smooth") {
  paraEl(i)?.scrollIntoView({ block: "center", behavior });
}

function setCurrentPara(i, { scroll = true } = {}) {
  R.cur = i;
  readingRoot.querySelectorAll(".rd-para.current").forEach(el => el.classList.remove("current"));
  paraEl(i)?.classList.add("current");
  if (scroll) scrollToPara(i);
  saveReadingProgress();
}

function highlightSentence(i, s) {
  readingRoot.querySelectorAll(".rd-s.speaking").forEach(el => el.classList.remove("speaking"));
  readingRoot.querySelectorAll(".rd-vi.speaking").forEach(el => el.classList.remove("speaking"));
  const p = paraEl(i);
  if (!p) return;
  if (s === -1) p.querySelector(".rd-vi")?.classList.add("speaking");
  else p.querySelector(`.rd-s[data-s="${s}"]`)?.classList.add("speaking");
}

// ---- Nghe máy đọc -------------------------------------------------------------------------
async function playFrom(start) {
  stopReadAloud();
  stopSpeaking();
  const paras = currentChapter().paras;
  const queue = [];
  for (let i = start; i < paras.length; i++) {
    if (!paras[i].en) continue;
    splitSentences(paras[i].en).forEach((text, s) => queue.push({ text, p: i, s }));
    if (R.settings.bilingual && R.settings.readVi && paras[i].vi) queue.push({ text: paras[i].vi, lang: "vi", p: i, s: -1 });
  }
  R.playing = true;
  updatePlayButtons();
  const finished = await speakSequence(queue, {
    pauseMs: 250,
    rate: R.settings.rate,
    onStep: k => {
      const item = queue[k];
      if (item.p !== R.cur || k === 0) setCurrentPara(item.p);
      highlightSentence(item.p, item.s);
    },
  });
  if (!finished) return; // bị dừng hoặc chuyển sang chuỗi đọc khác
  highlightSentence(-1, null);
  // Hết chương → tự sang chương tiếp theo
  if (R.ch < R.book.chapters.length - 1) {
    R.ch++;
    R.cur = 0;
    renderReading();
    window.scrollTo({ top: readingRoot.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
    playFrom(0);
  } else {
    R.playing = false;
    updatePlayButtons();
  }
}

function stopPlaying() {
  if (!R.playing) return;
  R.playing = false;
  stopSpeaking();
  highlightSentence(-1, null);
  updatePlayButtons();
}

async function sayParagraph(i) {
  stopPlaying();
  stopReadAloud();
  const para = currentChapter().paras[i];
  setCurrentPara(i, { scroll: false });
  const sentences = splitSentences(para.en);
  await speakSequence(sentences, { pauseMs: 200, rate: R.settings.rate, onStep: s => highlightSentence(i, s) });
  highlightSentence(-1, null);
}

function updatePlayButtons() {
  const btn = readingRoot.querySelector('[data-rd="play"]');
  if (btn) btn.textContent = R.playing ? "⏸ Dừng" : "🔊 Nghe đọc";
  renderReadingBar();
}

// ---- Tra từ ---------------------------------------------------------------------------------
async function lookupWord(word) {
  if (lookupCache.has(word)) return lookupCache.get(word);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  const promise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: ctl.signal })
    .then(r => r.ok ? r.json() : null)
    .then(json => {
      if (!json) return null;
      const entry = json[0];
      const meaning = entry.meanings?.[0];
      return {
        ipa: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || "",
        pos: meaning?.partOfSpeech || "",
        def: meaning?.definitions?.[0]?.definition || "",
      };
    })
    .catch(() => {
      lookupCache.delete(word); // lỗi mạng thì lần sau tra lại
      return null;
    })
    .finally(() => clearTimeout(timer));
  lookupCache.set(word, promise);
  return promise;
}

async function showWordPopup(wordEl) {
  const raw = wordEl.textContent;
  const word = raw.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (!word) return;
  const paraIdx = +wordEl.closest(".rd-para").dataset.p;
  const para = currentChapter().paras[paraIdx];
  const sentence = wordEl.closest(".rd-s").textContent;

  wordPopup.innerHTML = `
    <div class="rd-pop-head">
      <b>${escapeHtml(word)}</b>
      <button class="btn-icon sm" data-pop="say" title="Nghe từ">🔊</button>
      <button class="btn-icon sm" data-pop="close" title="Đóng">✕</button>
    </div>
    <div class="rd-pop-body" id="rdPopBody"><span class="sub">Đang tra từ…</span></div>
    ${para.vi && (R.settings.bilingual || R.revealed.has(paraIdx)) ? `<div class="rd-pop-ctx"><div class="label">Ngữ cảnh</div>${escapeHtml(para.vi)}</div>` : ""}
    <input class="input" id="rdPopMean" placeholder="Nghĩa để lưu vào sổ từ…" autocomplete="off" />
    <div class="rd-pop-actions">
      <button class="btn ghost sm" data-pop="say-sentence">🔊 Nghe câu</button>
      <button class="btn sm" data-pop="save">${hasVocab(word) ? "✓ Đã có trong sổ" : "＋ Lưu từ"}</button>
    </div>`;
  wordPopup.dataset.word = word;
  wordPopup.dataset.sentence = sentence;

  const rect = wordEl.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 24);
  wordPopup.style.width = width + "px";
  wordPopup.style.left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12)) + "px";
  const below = rect.bottom + 8;
  wordPopup.style.top = (below + 260 > window.innerHeight ? Math.max(12, rect.top - 268) : below) + "px";
  wordPopup.classList.add("show");
  speak(word, { rate: R.settings.rate });

  const info = await lookupWord(word);
  if (wordPopup.dataset.word !== word) return;
  const body = document.getElementById("rdPopBody");
  if (!info) {
    body.innerHTML = `<span class="sub">Không tra được từ này (không có trong từ điển hoặc lỗi mạng).</span>`;
    return;
  }
  body.innerHTML = `
    ${info.ipa ? `<span class="rd-pop-ipa">${escapeHtml(info.ipa)}</span>` : ""}
    ${info.pos ? `<span class="pos">${escapeHtml(info.pos)}</span>` : ""}
    ${info.def ? `<div class="def">${escapeHtml(info.def)}</div>` : ""}`;
  const meanInput = document.getElementById("rdPopMean");
  if (!meanInput.value) meanInput.value = info.def.slice(0, 80);
}

function hideWordPopup() { wordPopup?.classList.remove("show"); }

function handlePopupClick(e) {
  const action = e.target.closest("[data-pop]")?.dataset.pop;
  if (!action) return;
  const word = wordPopup.dataset.word;
  if (action === "close") hideWordPopup();
  if (action === "say") speak(word, { rate: R.settings.rate });
  if (action === "say-sentence") speak(wordPopup.dataset.sentence, { rate: R.settings.rate });
  if (action === "save" && !hasVocab(word)) {
    addVocab(word, document.getElementById("rdPopMean").value || "");
    e.target.textContent = "✓ Đã lưu";
    readingRoot.querySelectorAll(".rd-w").forEach(w => {
      if (w.textContent.toLowerCase().replace(/[^a-z'’-]/g, "") === word) w.classList.add("rd-saved");
    });
  }
}

// ---- Dịch bằng AI (đoạn chưa có bản dịch) -------------------------------------------------------
async function translateParagraph(i, btn) {
  const para = currentChapter().paras[i];
  btn.disabled = true;
  btn.textContent = "Đang dịch…";
  try {
    const vi = await Gemini.generate(`Dịch đoạn văn tiếng Anh sau sang tiếng Việt tự nhiên, giữ giọng kể chuyện. Chỉ trả về bản dịch, không giải thích.\n\n${para.en}`, { json: false });
    para.vi = vi.trim();
    if (R.book.source === "epub" || R.book.source === "drive") await LocalDB.put("books", R.book);
    const el = paraEl(i);
    el.outerHTML = paraHtml(para, i, new Set(vocabList.map(v => v.word.toLowerCase())));
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "🤖 Dịch đoạn này";
    alert("Không dịch được: " + e.message);
  }
}

// ---- Events ----------------------------------------------------------------------------------
function goToChapter(ch) {
  stopPlaying();
  stopReadAloud();
  R.ch = Math.max(0, Math.min(ch, R.book.chapters.length - 1));
  R.cur = 0;
  R.revealed = new Set();
  R.scores = {};
  renderReading();
  saveReadingProgress();
  window.scrollTo({ top: readingRoot.getBoundingClientRect().top + window.scrollY - 20 });
}

function handleReadingClick(e) {
  const t = e.target;
  const del = t.closest("[data-delete-book]");
  if (del) {
    e.stopPropagation();
    const book = R.books.find(b => b.id === del.dataset.deleteBook);
    if (book && confirm(`Xoá "${book.title}" khỏi máy này?`)) LocalDB.delete("books", book.id).then(refreshLibrary);
    return;
  }
  const drive = !t.closest("a") && t.closest("[data-drive-book]");
  if (drive) return openDriveBook(drive.dataset.driveBook);
  const open = t.closest("[data-open-book]");
  if (open) return openBook(open.dataset.openBook);

  const word = t.closest(".rd-w");
  if (word && !readAloudActive()) {
    e.stopPropagation();
    return showWordPopup(word);
  }

  const btn = t.closest("[data-rd]");
  if (!btn) return;
  const p = btn.dataset.p !== undefined ? +btn.dataset.p : null;
  switch (btn.dataset.rd) {
    case "library":
      stopPlaying(); stopReadAloud();
      R.view = "library"; R.book = null;
      renderReading();
      break;
    case "play": R.playing ? stopPlaying() : playFrom(R.cur); break;
    case "aloud": readAloudActive() ? stopReadAloud() : startReadAloud(R.cur); break;
    case "aloud-from": startReadAloud(p); break;
    case "say-para": sayParagraph(p); break;
    case "reveal":
      R.revealed.has(p) ? R.revealed.delete(p) : R.revealed.add(p);
      paraEl(p).outerHTML = paraHtml(currentChapter().paras[p], p, new Set(vocabList.map(v => v.word.toLowerCase())));
      break;
    case "translate": translateParagraph(p, btn); break;
    case "read-vi":
      R.settings.readVi = !R.settings.readVi;
      saveReadingSettings();
      btn.classList.toggle("on", R.settings.readVi);
      break;
    case "font-down": case "font-up":
      R.settings.fontSize = Math.max(14, Math.min(28, R.settings.fontSize + (btn.dataset.rd === "font-up" ? 2 : -2)));
      saveReadingSettings();
      readingRoot.querySelector(".rd-page").style.setProperty("--rd-font", R.settings.fontSize + "px");
      break;
    case "prev-ch": goToChapter(R.ch - 1); break;
    case "next-ch": goToChapter(R.ch + 1); break;
  }
}

function handleReadingChange(e) {
  const t = e.target;
  if (t.id === "rdImportInput" && t.files.length) return importEpubFiles([...t.files]);
  if (t.dataset.rdSelect === "chapter") return goToChapter(+t.value);
  if (t.dataset.rdSelect === "rate") {
    R.settings.rate = +t.value;
    saveReadingSettings();
    if (R.playing) playFrom(R.cur);
    return;
  }
  if (t.dataset.rdToggle === "bilingual") {
    R.settings.bilingual = t.checked;
    saveReadingSettings();
    const y = window.scrollY;
    const wasPlaying = R.playing;
    stopPlaying();
    renderReading();
    window.scrollTo({ top: y });
    if (wasPlaying) playFrom(R.cur);
  }
}

function initReading() {
  readingRoot = document.getElementById("readingRoot");
  readingBar = document.getElementById("readingBar");
  wordPopup = document.getElementById("rdWordPopup");
  loadReadingState();

  readingRoot.addEventListener("click", handleReadingClick);
  readingRoot.addEventListener("change", handleReadingChange);
  readingBar.addEventListener("click", handleReadingClick);
  wordPopup.addEventListener("click", e => { e.stopPropagation(); handlePopupClick(e); });
  document.addEventListener("click", e => { if (!e.target.closest("#rdWordPopup")) hideWordPopup(); });
  window.addEventListener("scroll", hideWordPopup, { passive: true });

  onRemoteField("reading_progress", p => {
    // Mỗi cuốn giữ bản ghi mới nhất giữa máy này và cloud
    for (const [id, entry] of Object.entries(p)) {
      if (!R.progress[id] || (entry.t || 0) > (R.progress[id].t || 0)) R.progress[id] = entry;
    }
    Store.setLocal("reading_progress", R.progress);
    if (R.view === "library") renderReading();
  });
  // Rời tab thì dừng đọc
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    if (tab.dataset.tab !== "reading") { stopPlaying(); stopReadAloud(); }
  }));
  onTabShow("reading", () => { if (R.view === "library") renderReading(); });

  renderReading();
  refreshLibrary();
}
