// ---- Parser: tra phiên âm + puzzle ghép token IPA -------------------------------
// `state` cũng được tab Luyện Âm dùng (từ đang luyện = từ vừa parse).
let state = {
  status: "idle", data: null, targetTokens: [], bank: [], built: [], mistakes: 0, decoded: false, log: [],
};

let statusBox, resultBox, logBox, wordInput, parseBtn;

async function runParse(word) {
  const w = word.trim().toLowerCase();
  if (!w) return;
  state.status = "loading"; state.data = null; state.decoded = false;
  state.built = []; state.mistakes = 0;
  renderParser();
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
    if (!res.ok) throw new Error("NOT_FOUND");
    const json = await res.json();
    const entry = json[0];
    const phoneticObj = entry.phonetics.find(p => p.text && p.audio) || entry.phonetics.find(p => p.text) || null;
    const phoneticText = (phoneticObj && phoneticObj.text) || entry.phonetic || "";
    if (!phoneticText) throw new Error("NO_PHONETIC");
    const audioEntry = entry.phonetics.find(p => p.audio);
    const audio = audioEntry ? audioEntry.audio : "";
    const meaning = entry.meanings && entry.meanings[0];
    const def = (meaning && meaning.definitions && meaning.definitions[0] && meaning.definitions[0].definition) || "";
    const pos = (meaning && meaning.partOfSpeech) || "";

    const tokens = tokenizePhonetic(phoneticText);
    const bankTokens = shuffle(tokens).map(sym => ({ id: nextId(), sym, used: false, error: false }));

    state.data = { word: w, phoneticText, audio, def, pos };
    state.targetTokens = tokens;
    state.bank = bankTokens;
    state.status = "ready";
  } catch (e) {
    state.status = "error";
    state.errorMsg = e.message === "NO_PHONETIC"
      ? `Không có dữ liệu phiên âm cho "${w}".`
      : `Không tìm thấy "${w}" trong từ điển.`;
  }
  renderParser();
}

function handleBankClick(item) {
  if (item.used || state.decoded) return;
  const expected = state.targetTokens[state.built.length];
  if (item.sym === expected) {
    item.used = true;
    state.built.push(item.sym);
    if (state.built.length === state.targetTokens.length) {
      state.decoded = true;
      state.log.unshift({ word: state.data.word, phonetic: state.data.phoneticText, mistakes: state.mistakes });
      state.log = state.log.slice(0, 8);
    }
  } else {
    state.mistakes++;
    item.error = true;
    renderParser();
    setTimeout(() => { item.error = false; renderParser(); }, 350);
    return;
  }
  renderParser();
}

function playAudio() {
  if (state.data && state.data.audio) {
    const url = state.data.audio.startsWith("http") ? state.data.audio : `https:${state.data.audio}`;
    const audio = new Audio(url);
    audio.play().catch(() => speak(state.data.word));
  } else if (state.data) {
    speak(state.data.word);
  }
}

function resetPuzzle() {
  state.bank.forEach(b => { b.used = false; b.error = false; });
  state.bank = shuffle(state.bank);
  state.built = [];
  state.decoded = false;
  state.mistakes = 0;
  renderParser();
}

function renderParser() {
  // status
  if (state.status === "error") {
    statusBox.innerHTML = `<div class="status err">✗ ${state.errorMsg}</div>`;
  } else if (state.status === "idle") {
    statusBox.innerHTML = `<div class="status">Sẵn sàng. Gõ một từ rồi nhấn Parse để lấy phiên âm từ dictionaryapi.dev.</div>`;
  } else if (state.status === "loading") {
    statusBox.innerHTML = `<div class="status">Đang parse…</div>`;
  } else {
    statusBox.innerHTML = "";
  }
  parseBtn.disabled = state.status === "loading";
  parseBtn.textContent = state.status === "loading" ? "parsing…" : "Parse";

  // result
  if (state.data && state.status === "ready") {
    const d = state.data;
    const cleanPhon = d.phoneticText.replace(/[/[\]]/g, "");
    resultBox.innerHTML = `
      <div class="worddef">
        <span class="word">${d.word}</span>
        ${d.pos ? `<span class="pos">${d.pos}</span>` : ""}
        ${d.def ? `<div class="def">${d.def}</div>` : ""}
      </div>
      <div class="label">build trace — click đúng thứ tự token để tái tạo <span style="text-transform: none; font-family: monospace;">/${cleanPhon}/</span></div>
      <div class="buildline" id="buildline"></div>
      ${!state.decoded ? `<div class="bank" id="bankBox"></div>` : ""}
      <div class="runrow">
        <button class="btn" id="runBtn" ${!state.decoded ? "disabled" : ""}>▶ Run (nghe phát âm)</button>
        <span class="${state.decoded ? 'unlocked' : 'locked'}">${state.decoded ? '✓ decoded' : '🔒 giải mã hết token để mở khóa'} · lỗi: ${state.mistakes}</span>
        <button class="btn ghost" id="resetBtn">reset puzzle</button>
      </div>
    `;
    const buildline = document.getElementById("buildline");
    state.built.forEach(t => {
      const span = document.createElement("span");
      span.className = "tok" + (STRESS.has(t) ? " stress" : "");
      span.textContent = t;
      buildline.appendChild(span);
    });
    if (!state.decoded) {
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      buildline.appendChild(cursor);

      const bankBox = document.getElementById("bankBox");
      state.bank.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "chip" + (item.used ? " used" : "") + (item.error ? " error" : "");
        btn.textContent = item.sym;
        btn.addEventListener("click", () => handleBankClick(item));
        bankBox.appendChild(btn);
      });
    }
    document.getElementById("runBtn").addEventListener("click", playAudio);
    document.getElementById("resetBtn").addEventListener("click", resetPuzzle);
  } else {
    resultBox.innerHTML = "";
  }

  // log
  if (state.log.length > 0) {
    logBox.innerHTML = `<div class="log"><div class="label">decode log (session)</div>${state.log.map(l => `<div class="logrow"><span><b>${l.word}</b> — /${l.phonetic.replace(/[/[\]]/g, "")}/</span><span>lỗi: ${l.mistakes}</span></div>`).join("")}</div>`;
  } else {
    logBox.innerHTML = "";
  }
}

function initParser() {
  statusBox = document.getElementById("statusBox");
  resultBox = document.getElementById("resultBox");
  logBox = document.getElementById("logBox");
  wordInput = document.getElementById("wordInput");
  parseBtn = document.getElementById("parseBtn");

  parseBtn.addEventListener("click", () => runParse(wordInput.value));
  wordInput.addEventListener("keydown", e => { if (e.key === "Enter") runParse(wordInput.value); });
  renderParser();
}
