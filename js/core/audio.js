// ---- Text-to-speech ----------------------------------------------------------
// Dùng giọng đọc Youdao (en-US); nếu lỗi mạng thì fallback sang speechSynthesis của trình duyệt.
let currentAudio = null;
let currentResolve = null; // resolve của câu đang đọc — gọi khi bị dừng để chuỗi đọc không treo
let speechToken = 0; // tăng mỗi lần stopSpeaking() để huỷ các chuỗi đọc đang chạy

function ttsUrl(text) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
}

function speakWithBrowser(text, rate, onDone, lang = "en-US") {
  if (!window.speechSynthesis) { onDone?.(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.onend = u.onerror = () => onDone?.();
  speechSynthesis.speak(u);
}

// Đọc một đoạn; trả về Promise resolve khi đọc xong (hoặc lỗi).
// lang "vi" dùng giọng tiếng Việt của trình duyệt (Youdao chỉ có tiếng Anh).
function speak(text, { rate = 1, lang = "en" } = {}) {
  return new Promise(resolve => {
    if (!text) return resolve();
    if (lang === "vi") return speakWithBrowser(text, rate, resolve, "vi-VN");
    const audio = new Audio(ttsUrl(text));
    audio.playbackRate = rate;
    currentAudio = audio;
    currentResolve = resolve;
    let fellBack = false;
    const fallback = () => {
      if (fellBack) return;
      fellBack = true;
      speakWithBrowser(text, rate, resolve);
    };
    audio.onended = () => resolve();
    audio.onerror = fallback;
    audio.play().catch(e => {
      console.warn("TTS play failed:", e);
      fallback();
    });
  });
}

// Đọc lần lượt nhiều đoạn (chuỗi, hoặc { text, lang }). onStep(i) được gọi trước khi đọc đoạn thứ i.
// Trả về true nếu đọc hết, false nếu bị stopSpeaking() / chuỗi đọc khác cắt ngang.
async function speakSequence(texts, { pauseMs = 350, rate = 1, onStep } = {}) {
  const token = ++speechToken;
  const queue = texts.filter(Boolean).map(t => typeof t === "string" ? { text: t } : t);
  for (let i = 0; i < queue.length; i++) {
    if (token !== speechToken) return false;
    onStep?.(i);
    await speak(queue[i].text, { rate, lang: queue[i].lang });
    if (pauseMs) await new Promise(r => setTimeout(r, pauseMs));
  }
  return token === speechToken;
}

function stopSpeaking() {
  speechToken++;
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (currentResolve) { currentResolve(); currentResolve = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
}

// Phát file âm IPA chuẩn trong /audio/ rồi đọc từ ví dụ
async function speakIpaThenWord(sym, example) {
  try {
    const audio = new Audio(`audio/${encodeURIComponent(sym)}.mp3`);
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
    setTimeout(() => speak(example, { rate: 0.85 }), 200);
  } catch (e) {
    // Không tải được audio (môi trường không hỗ trợ) thì chỉ đọc từ ví dụ.
    speak(example);
  }
}

// ---- Speech-to-text ------------------------------------------------------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Nghe một lượt và trả về transcript. Reject với Error(code) khi lỗi
// (code là event.error của Web Speech API, VD "not-allowed", "no-speech").
function listenOnce({ lang = "en-US" } = {}) {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) return reject(new Error("unsupported"));
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    rec.onresult = e => { done = true; resolve(e.results[0][0].transcript.trim()); };
    rec.onerror = e => { done = true; reject(new Error(e.error)); };
    rec.onend = () => { if (!done) reject(new Error("no-speech")); };
    rec.start();
    listenOnce.active = rec;
  });
}

function stopListening() {
  try { listenOnce.active?.stop(); } catch (e) { }
}

function micErrorMessage(code) {
  if (code === "not-allowed") return "Trình duyệt đang chặn Microphone — bấm 🔒 trên thanh địa chỉ và chọn Allow.";
  if (code === "unsupported") return "Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.";
  if (code === "no-speech") return "Không nghe thấy tiếng. Hãy thử lại.";
  return `Lỗi thu âm: ${code}`;
}
