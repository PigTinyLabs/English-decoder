// ---- So khớp câu tiếng Anh (dùng chung cho Writing, Reading) ---------------------
const CONTRACTIONS = [
  [/\bwon't\b/g, "will not"], [/\bcan't\b/g, "can not"], [/\bcannot\b/g, "can not"], [/\bshan't\b/g, "shall not"],
  [/n't\b/g, " not"], [/'m\b/g, " am"], [/'re\b/g, " are"], [/'ll\b/g, " will"], [/'ve\b/g, " have"], [/'d\b/g, " would"],
  [/\b(it|that|what|there|he|she|here|who|where|how)'s\b/g, "$1 is"],
];

function normalizeSentence(text) {
  let s = String(text || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[‘’`]/g, "'");
  for (const [re, rep] of CONTRACTIONS) s = s.replace(re, rep);
  s = s.replace(/practise/g, "practice").replace(/\bmum\b/g, "mom");
  return s.replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

function wordsOf(text) { return normalizeSentence(text).split(" ").filter(Boolean); }

// Căn chỉnh 2 dãy bằng LCS → [{ type: "same" | "extra" | "missing", val }]
function diffTokens(mine, target) {
  const n = mine.length, m = target.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = mine[i] === target[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (mine[i] === target[j]) { ops.push({ type: "same", val: mine[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: "extra", val: mine[i] }); i++; }
    else { ops.push({ type: "missing", val: target[j] }); j++; }
  }
  while (i < n) ops.push({ type: "extra", val: mine[i++] });
  while (j < m) ops.push({ type: "missing", val: target[j++] });
  return { ops, lcs: dp[0][0] };
}

function similarity(a, b) {
  const wa = wordsOf(a), wb = wordsOf(b);
  if (!wa.length || !wb.length) return 0;
  return (2 * diffTokens(wa, wb).lcs) / (wa.length + wb.length);
}
