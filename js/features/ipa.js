// ---- IPA tokenizer -------------------------------------------------------
const IPA_SYMBOLS = [
  "tʃ", "dʒ", "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "oʊ", "ɪə", "eə", "ʊə",
  "iː", "ɑː", "ɔː", "uː", "ɜː",
  "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ",
  "h", "m", "n", "ŋ", "l", "r", "ɹ", "j", "w",
  "ɪ", "e", "æ", "ʌ", "ɒ", "ʊ", "ə", "ɚ", "ɝ", "a", "i", "u", "o",
].sort((a, b) => b.length - a.length);
const STRESS = new Set(["ˈ", "ˌ", "."]);

function tokenizePhonetic(raw) {
  const clean = raw.replace(/[/\[\]]/g, "").trim();
  const tokens = [];
  let i = 0;
  while (i < clean.length) {
    const ch = clean[i];
    if (STRESS.has(ch)) { tokens.push(ch); i++; continue; }
    if (ch === " ") { i++; continue; }
    let matched = null;
    for (const sym of IPA_SYMBOLS) {
      if (clean.startsWith(sym, i)) { matched = sym; break; }
    }
    if (matched) { tokens.push(matched); i += matched.length; }
    else { tokens.push(ch); i++; }
  }
  return tokens;
}

// ---- Mouth-shape (khẩu hình) generator -------------------------------------------------------
// Đơn giản hóa: nhìn thẳng mặt, không phải cắt lớp bên như hình ảnh tham khảo của Google.
// rounded: 0 (dẹt/spread) -> 1 (tròn/pushed forward)
// openness: 0 (khép) -> 1 (mở rộng)
// teeth: có lộ răng trên/dưới không
// closed: môi mím lại hoàn toàn (p, b, m)
// lipToTeeth: răng trên chạm môi dưới (f, v)
// tongueBetween: đầu lưỡi lộ giữa hai hàm răng (θ, ð)
const MOUTH_PARAMS = {
  // ── Nguyên âm đơn (Monophthongs) ─────────────────────────────────────────
  "iː": { rounded: 0, openness: 0.15, teeth: true },  // see  – dẹt rộng, hé nhỏ
  "ɪ": { rounded: 0, openness: 0.2, teeth: true },  // sit  – dẹt, hé hơn iː
  "e": { rounded: 0, openness: 0.35, teeth: false },  // bed  – dẹt vừa
  "æ": { rounded: 0, openness: 0.75, teeth: false },  // cat  – mở rộng
  "ɑː": { rounded: 0.1, openness: 0.9, teeth: false },  // car  – há to nhất
  "ɒ": { rounded: 0.5, openness: 0.7, teeth: false },  // hot  – tròn, mở rộng (British)
  "ɔː": { rounded: 0.6, openness: 0.55, teeth: false },  // law  – tròn vừa
  "ʊ": { rounded: 0.7, openness: 0.25, teeth: false },  // put  – tròn, hé nhỏ
  "uː": { rounded: 0.9, openness: 0.2, teeth: false },  // blue – tròn nhất, môi chúm
  "ʌ": { rounded: 0.2, openness: 0.45, teeth: false },  // cup  – hơi dẹt, mở vừa
  "ɜː": { rounded: 0.3, openness: 0.35, teeth: false },  // bird – môi dẹt nhẹ
  "ə": { rounded: 0.2, openness: 0.3, teeth: false },  // about– schwa, trung tính
  // Âm không nhấn trong American English
  "ɚ": { rounded: 0.3, openness: 0.3, teeth: false },  // butter (unstressed r-colored)
  "ɝ": { rounded: 0.3, openness: 0.35, teeth: false },  // bird   (stressed r-colored)
  // Ký hiệu rút gọn xuất hiện trong một số bộ từ điển
  "a": { rounded: 0, openness: 0.85, teeth: false },  // trap (short open)
  "i": { rounded: 0, openness: 0.15, teeth: true },  // happy (weak i)
  "u": { rounded: 0.8, openness: 0.2, teeth: false },  // situation (short u)
  "o": { rounded: 0.6, openness: 0.4, teeth: false },  // go (short o)

  // ── Nguyên âm đôi (Diphthongs) ───────────────────────────────────────────
  "eɪ": { rounded: 0.1, openness: 0.3, teeth: false },  // day  – bắt đầu /e/
  "aɪ": { rounded: 0, openness: 0.8, teeth: false },  // my   – bắt đầu /a/ mở rộng
  "ɔɪ": { rounded: 0.6, openness: 0.5, teeth: false },  // boy  – bắt đầu /ɔ/
  "aʊ": { rounded: 0.3, openness: 0.75, teeth: false },  // now  – bắt đầu /a/
  "əʊ": { rounded: 0.5, openness: 0.3, teeth: false },  // go   – bắt đầu /ə/
  "ɪə": { rounded: 0, openness: 0.25, teeth: true },  // here – bắt đầu /ɪ/
  "eə": { rounded: 0, openness: 0.4, teeth: false },  // hair – bắt đầu /e/
  "ʊə": { rounded: 0.6, openness: 0.3, teeth: false },  // tour – bắt đầu /ʊ/

  // ── Phụ âm (Consonants) ──────────────────────────────────────────────────
  // Plosives – môi/lưỡi đóng hoàn toàn khi tích năng lượng
  "p": { closed: true },                                  // pen  – hai môi chạm nhau
  "b": { closed: true },                                  // bad  – hai môi chạm nhau
  "t": { rounded: 0, openness: 0.25, teeth: true },  // tea  – lưỡi chạm lợi
  "d": { rounded: 0, openness: 0.25, teeth: true },  // did  – lưỡi chạm lợi
  "k": { rounded: 0, openness: 0.35, teeth: false },  // cat  – lưỡi chạm vòm mềm
  "g": { rounded: 0, openness: 0.35, teeth: false },  // go   – lưỡi chạm vòm mềm
  // Labiodentals – răng trên chạm môi dưới
  "f": { lipToTeeth: true },                              // fall
  "v": { lipToTeeth: true },                              // van
  // Dentals – đầu lưỡi lộ giữa hai hàm răng
  "θ": { rounded: 0, openness: 0.2, tongueBetween: true }, // think
  "ð": { rounded: 0, openness: 0.2, tongueBetween: true }, // this
  // Sibilants
  "s": { rounded: 0, openness: 0.15, teeth: true },  // so
  "z": { rounded: 0, openness: 0.15, teeth: true },  // zoo
  "ʃ": { rounded: 0.4, openness: 0.25, teeth: true },  // she  – môi hơi tròn ra trước
  "ʒ": { rounded: 0.4, openness: 0.25, teeth: true },  // vision
  // Affricates – bắt đầu đóng như /t,d/ rồi xả ra như /ʃ,ʒ/
  "tʃ": { rounded: 0.1, openness: 0.15, teeth: true },  // chair – bắt đầu gần đóng
  "dʒ": { rounded: 0.1, openness: 0.15, teeth: true },  // jump  – bắt đầu gần đóng
  // Nasals – miệng gần khép, âm thoát qua mũi
  "m": { closed: true },                                  // man  – hai môi đóng
  "n": { rounded: 0, openness: 0.2, teeth: true },  // no   – lưỡi chạm lợi
  "ŋ": { rounded: 0, openness: 0.15, teeth: false },  // sing – lưỡi chạm vòm mềm, miệng gần khép
  // Approximants
  "l": { rounded: 0, openness: 0.25, teeth: true },  // leg  – lưỡi chạm lợi, hơi hé
  "r": { rounded: 0.4, openness: 0.3, teeth: false },  // red  – môi hơi tròn (British)
  "ɹ": { rounded: 0.35, openness: 0.3, teeth: false },  // red  – r Mỹ, cuộn lưỡi
  "j": { rounded: 0, openness: 0.15, teeth: true },  // yes
  "w": { rounded: 0.9, openness: 0.15, teeth: false },  // wet  – môi chúm tròn nhất
  "h": { rounded: 0, openness: 0.5, teeth: false },  // hot  – miệng mở tự nhiên
};

// Vị trí KẾT của âm đôi (diphthong) + affricate — miệng lướt từ MOUTH_PARAMS sang đây.
const MOUTH_PARAMS_END = {
  // Diphthongs: glide sang nguyên âm thứ hai
  "eɪ": { rounded: 0, openness: 0.15, teeth: true },  // -> /ɪ/
  "aɪ": { rounded: 0, openness: 0.15, teeth: true },  // -> /ɪ/
  "ɔɪ": { rounded: 0, openness: 0.15, teeth: true },  // -> /ɪ/
  "aʊ": { rounded: 0.9, openness: 0.2 },                // -> /ʊ/
  "əʊ": { rounded: 0.9, openness: 0.15 },                // -> /ʊ/
  "ɪə": { rounded: 0.2, openness: 0.3 },                // -> /ə/
  "eə": { rounded: 0.2, openness: 0.3 },                // -> /ə/
  "ʊə": { rounded: 0.2, openness: 0.3 },                // -> /ə/
  // Affricates: sau pha đóng, xả ra như /ʃ/ hoặc /ʒ/
  "tʃ": { rounded: 0.4, openness: 0.25, teeth: true },  // -> /ʃ/ release
  "dʒ": { rounded: 0.4, openness: 0.25, teeth: true },  // -> /ʒ/ release
};

// Trạng thái nghỉ (môi thả lỏng, gần khép) — điểm xuất phát/kết thúc của animation.
const MOUTH_NEUTRAL = { rounded: 0.1, openness: 0.08, teeth: false };

// Quy đổi mọi tham số (kể cả closed/lipToTeeth) về một bộ số duy nhất để có thể animate mượt.
function paramsToGeom(p) {
  if (p.closed) return { rx: 15, ry: 1.5, teethOp: 0, tongueOp: 0 };
  if (p.lipToTeeth) return { rx: 14, ry: 5, teethOp: 0.9, tongueOp: 0 };
  const rounded = p.rounded || 0;
  const openness = p.openness != null ? p.openness : 0.3;
  return {
    rx: 17 - rounded * 6,
    ry: 4 + openness * 13,
    teethOp: p.teeth ? 0.85 : 0,
    tongueOp: p.tongueBetween ? 0.75 : 0,
  };
}

function buildMouthSVG(uid) {
  const stroke = "#8b93a3";
  const lipStroke = "#38bdf8";
  const g = paramsToGeom(MOUTH_NEUTRAL);
  const trans = "transition: rx .25s ease, ry .25s ease, opacity .25s ease;";
  return `<svg viewBox="0 0 64 64" class="mouth-svg">
<circle cx="32" cy="32" r="27" fill="none" stroke="${stroke}" stroke-width="1.5" opacity="0.35"/>
<ellipse id="mo-${uid}" cx="32" cy="32" rx="${g.rx}" ry="${g.ry}" fill="#0a0e14" stroke="${lipStroke}" stroke-width="2.5" style="${trans}"/>
<rect id="tt-${uid}" x="${32 - 15 + 2}" y="27" width="26" height="6" rx="1.5" fill="#e7e9ee" opacity="${g.teethOp}" style="${trans}"/>
<rect id="tb-${uid}" x="${32 - 15 + 2}" y="31" width="26" height="6" rx="1.5" fill="#e7e9ee" opacity="${g.teethOp * 0.6}" style="${trans}"/>
<ellipse id="tg-${uid}" cx="32" cy="32" rx="7" ry="3" fill="#f87171" opacity="${g.tongueOp}" style="${trans}"/>
  </svg>`;
}

function setMouthGeom(uid, g) {
  const mo = document.getElementById(`mo-${uid}`);
  const tt = document.getElementById(`tt-${uid}`);
  const tb = document.getElementById(`tb-${uid}`);
  const tg = document.getElementById(`tg-${uid}`);
  if (!mo) return;
  mo.setAttribute("rx", g.rx);
  mo.setAttribute("ry", g.ry);
  tt.setAttribute("opacity", g.teethOp);
  tb.setAttribute("opacity", g.teethOp * 0.6);
  tg.setAttribute("opacity", g.tongueOp);
}

// Chuỗi animation: nghỉ -> hình âm -> (lướt sang hình 2 nếu là âm đôi) -> về nghỉ.
function animateMouth(uid, sym) {
  const target = paramsToGeom(MOUTH_PARAMS[sym] || {});
  const endParams = MOUTH_PARAMS_END[sym];
  const end = endParams ? paramsToGeom(endParams) : null;
  const neutral = paramsToGeom(MOUTH_NEUTRAL);

  setMouthGeom(uid, neutral);
  requestAnimationFrame(() => setMouthGeom(uid, target));
  if (end) {
    setTimeout(() => setMouthGeom(uid, end), 550);
    setTimeout(() => setMouthGeom(uid, neutral), 1300);
  } else {
    setTimeout(() => setMouthGeom(uid, neutral), 900);
  }
}
const IPA_BOARD = {
  "Nguyên âm — Vowels": [["iː", "see"], ["ɪ", "sit"], ["e", "bed"], ["æ", "cat"], ["ɑː", "car"], ["ɒ", "hot"],
  ["ɔː", "law"], ["ʊ", "put"], ["uː", "blue"], ["ʌ", "cup"], ["ɜː", "bird"], ["ə", "about"]],
  "Nguyên âm đôi — Diphthongs": [["eɪ", "day"], ["aɪ", "my"], ["ɔɪ", "boy"], ["aʊ", "now"], ["əʊ", "go"],
  ["ɪə", "here"], ["eə", "hair"], ["ʊə", "tour"]],
  "Phụ âm — Consonants": [["p", "pen"], ["b", "bad"], ["t", "tea"], ["d", "did"], ["k", "cat"], ["g", "go"],
  ["f", "fall"], ["v", "van"], ["θ", "think"], ["ð", "this"], ["s", "so"], ["z", "zoo"], ["ʃ", "she"], ["ʒ", "vision"],
  ["tʃ", "chair"], ["dʒ", "jump"], ["m", "man"], ["n", "no"], ["ŋ", "sing"], ["l", "leg"], ["r", "red"], ["ɹ", "red"],
  ["j", "yes"], ["w", "wet"], ["h", "hot"]],
};

// ---- IPA board render -------------------------------------------------------
function initIpaBoard() {
  const boardBox = document.getElementById("boardBox");
  Object.entries(IPA_BOARD).forEach(([group, items]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "board-group";
    groupDiv.innerHTML = `<div class="board-title">${group}</div>`;
    const grid = document.createElement("div");
    grid.className = "board-grid";
    items.forEach(([sym, example]) => {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      const uid = `${group.length}-${sym}`.replace(/[^a-zA-Z0-9]/g, "_") + "-" + nextId();
      cell.innerHTML = `<div class="board-mouth">${buildMouthSVG(uid)}</div><span class="board-sym">${sym}</span><span class="board-ex">${example}</span>`;
      cell.addEventListener("click", () => {
        animateMouth(uid, sym);
        speakIpaThenWord(sym, example);
      });
      grid.appendChild(cell);
    });
    groupDiv.appendChild(grid);
    boardBox.appendChild(groupDiv);
  });
}
