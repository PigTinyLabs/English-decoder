// ---- Speech Practice (Luyện Âm) ---------------------------------------------
let recognition = null;
let micBtn, pracTargetWord, pracTargetIpa, pracSpokenWord, pracDiffResult, pracInput, pracParseBtn, pracPlayBtn;

// Gọi mỗi khi mở tab Luyện Âm: lấy từ đang parse ở tab Parser làm từ mục tiêu.
function initSpeechPractice() {
  if (!state.data || !state.data.word) {
    pracTargetWord.textContent = "Chưa có từ";
    pracTargetIpa.textContent = "Hãy nhập một từ vào ô trên";
    pracPlayBtn.style.display = "none";
    return;
  }
  pracTargetWord.textContent = state.data.word;
  pracTargetIpa.textContent = "/" + state.data.phoneticText.replace(/[/[\]]/g, "") + "/";
  pracPlayBtn.style.display = "flex";
  pracSpokenWord.textContent = "Nhấn mic và đọc to từ trên";
  pracDiffResult.innerHTML = "";
  micBtn.classList.remove("recording");
  pracInput.value = state.data.word;
}

// So khớp chuỗi token IPA bằng LCS và tô màu đúng / dư / thiếu
function renderDiff(targetTokens, spokenTokens) {
  const n = targetTokens.length, m = spokenTokens.length;
  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (targetTokens[i - 1] === spokenTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  let i = n, j = m;
  const result = [];
  while (i > 0 && j > 0) {
    if (targetTokens[i - 1] === spokenTokens[j - 1]) {
      result.unshift({ type: "correct", val: targetTokens[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.unshift({ type: "missing", val: targetTokens[i - 1] });
      i--;
    } else {
      result.unshift({ type: "wrong", val: spokenTokens[j - 1] });
      j--;
    }
  }
  while (i > 0) { result.unshift({ type: "missing", val: targetTokens[i - 1] }); i--; }
  while (j > 0) { result.unshift({ type: "wrong", val: spokenTokens[j - 1] }); j--; }

  let html = "/";
  for (const r of result) {
    if (r.type === "correct") html += `<span class="correct">${r.val}</span>`;
    else if (r.type === "wrong") html += `<span class="wrong" title="bạn đã phát âm dư âm này">${r.val}</span>`;
    else if (r.type === "missing") html += `<span class="missing" title="bạn phát âm sai hoặc thiếu âm này">${r.val}</span>`;
  }
  html += "/";
  pracDiffResult.innerHTML = html;
}

function setupRecognition() {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    const spoken = event.results[0][0].transcript.trim().toLowerCase();
    const cleanSpoken = spoken.replace(/[.,!?]/g, "");
    pracSpokenWord.textContent = `Bạn đã đọc: "${cleanSpoken}"`;
    micBtn.classList.remove("recording");
    if (typeof recordLearningActivity === "function") recordLearningActivity("practice", { word: cleanSpoken });

    if (cleanSpoken === state.data.word.toLowerCase()) {
      renderDiff(state.targetTokens, state.targetTokens);
      return;
    }
    pracDiffResult.innerHTML = `<span style="font-size: 13px; color: var(--muted)">Đang phân tích lỗi sai...</span>`;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanSpoken)}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      let spokenPhonetic = "";
      for (const item of json) {
        if (item.phonetic) { spokenPhonetic = item.phonetic; break; }
        if (item.phonetics) {
          const p = item.phonetics.find(x => x.text);
          if (p) { spokenPhonetic = p.text; break; }
        }
      }
      if (!spokenPhonetic) throw new Error("No IPA");
      const spokenTokens = tokenizePhonetic(spokenPhonetic.replace(/[/[\]]/g, ""));
      renderDiff(state.targetTokens, spokenTokens);
    } catch (e) {
      pracDiffResult.innerHTML = `<span class="wrong" style="font-size: 14px;">Không tìm thấy phiên âm cho từ "${escapeHtml(cleanSpoken)}"</span>`;
    }
  };

  recognition.onspeechend = () => {
    try { recognition.stop(); } catch (e) { }
    micBtn.classList.remove("recording");
  };

  recognition.onend = () => {
    micBtn.classList.remove("recording");
  };

  recognition.onerror = (event) => {
    micBtn.classList.remove("recording");
    if (event.error === 'not-allowed') {
      alert("⚠️ Trình duyệt đang chặn Microphone!\n\nVui lòng bấm vào biểu tượng 🔒 (hoặc nút Tuỳ chỉnh) trên thanh địa chỉ trang web và chọn 'Allow' (Cho phép) Microphone để có thể thu âm.");
      pracSpokenWord.textContent = "Chưa cấp quyền Microphone.";
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      pracSpokenWord.textContent = `Lỗi thu âm: ${event.error}`;
    } else if (event.error === 'no-speech') {
      pracSpokenWord.textContent = "Không nghe thấy tiếng. Hãy thử lại.";
    }
  };
}

function initPractice() {
  micBtn = document.getElementById("micBtn");
  pracTargetWord = document.getElementById("pracTargetWord");
  pracTargetIpa = document.getElementById("pracTargetIpa");
  pracSpokenWord = document.getElementById("pracSpokenWord");
  pracDiffResult = document.getElementById("pracDiffResult");
  pracInput = document.getElementById("pracInput");
  pracParseBtn = document.getElementById("pracParseBtn");
  pracPlayBtn = document.getElementById("pracPlayBtn");

  pracParseBtn.addEventListener("click", async () => {
    const w = pracInput.value.trim();
    if (!w) return;
    pracTargetWord.textContent = "Đang tra từ...";
    pracTargetIpa.textContent = "/.../";
    pracDiffResult.innerHTML = "";
    pracPlayBtn.style.display = "none";
    await runParse(w);
    initSpeechPractice();
  });
  pracInput.addEventListener("keydown", e => { if (e.key === "Enter") pracParseBtn.click(); });
  pracPlayBtn.addEventListener("click", playAudio);

  if (SpeechRecognition) setupRecognition();

  micBtn.addEventListener("click", () => {
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng dùng Google Chrome hoặc Edge.");
      return;
    }
    if (!state.data || !state.data.word) return;

    // Nếu đang thu âm thì bấm để dừng sớm
    if (micBtn.classList.contains("recording")) {
      micBtn.classList.remove("recording");
      if (pracSpokenWord.textContent.includes("Đang nghe")) {
        pracSpokenWord.textContent = "Đang xử lý giọng nói...";
      }
      try { recognition.stop(); } catch (e) { }
      return;
    }

    micBtn.classList.add("recording");
    pracSpokenWord.textContent = "Đang nghe... (Bấm mic lần nữa để kết thúc)";
    pracDiffResult.innerHTML = "";

    try {
      recognition.start();
    } catch (e) {
      // Gọi start() khi đang chạy sẽ văng lỗi
      console.warn("Speech recognition start error:", e);
      micBtn.classList.remove("recording");
      pracSpokenWord.textContent = "Lỗi khi khởi động mic. Hãy thử lại.";
    }
  });

  onTabShow("practice", initSpeechPractice);
}
