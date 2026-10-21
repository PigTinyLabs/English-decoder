// ---- Chắp Bút: chấm câu, lịch ôn tập (SRS) và tiến độ ------------------------------
//
// writing_progress: { [sentenceId]: { a, s, v, c, nat, n, box, due, t } }
//   a = câu người học viết gần nhất, s = điểm 0-10, v = "correct" | "minor" | "wrong",
//   c = câu đã sửa, nat = cách nói tự nhiên, n = số lần làm,
//   box = hộp Leitner 0-6, due = ngày cần ôn (YYYY-MM-DD), t = timestamp
// writing_extra: { [lessonId]: [{ id, vi, en, alt }] } — câu do AI sinh thêm

const SRS_INTERVALS = [0, 1, 2, 4, 7, 15, 30]; // số ngày tới lần ôn tiếp theo, theo box

const WritingData = {
  progress: {},
  extra: {},
  settings: { autoRead: true, rate: 1 },

  load() {
    this.progress = Store.getJSON("writing_progress", {});
    this.extra = Store.getJSON("writing_extra", {});
    this.settings = { ...this.settings, ...Store.getJSON("writing_settings", {}) };
  },
  saveProgress() { Store.set("writing_progress", this.progress); },
  saveExtra() { Store.set("writing_extra", this.extra); },
  saveSettings() { Store.setLocal("writing_settings", this.settings); },
};

function getLesson(lessonId) { return WRITING_LESSONS.find(l => l.id === lessonId); }

// ["vi", "en", ...alt] hoặc { vi, en, alt } → { vi, en, alt }
function toSentence(s) {
  return Array.isArray(s) ? { vi: s[0], en: s[1], alt: s.slice(2) } : s;
}

// Câu gốc + câu AI sinh thêm, mỗi câu kèm id ổn định
function getLessonSentences(lesson) {
  const base = lesson.sentences.map((s, i) => ({ ...toSentence(s), id: `${lesson.id}-${i + 1}` }));
  return base.concat(WritingData.extra[lesson.id] || []);
}

function findSentence(id) {
  for (const lesson of WRITING_LESSONS) {
    const s = getLessonSentences(lesson).find(x => x.id === id);
    if (s) return { lesson, sentence: s };
  }
  return null;
}

function lessonStats(lesson) {
  const items = getLessonSentences(lesson);
  let done = 0, correct = 0, due = 0;
  const today = isoDate();
  items.forEach(s => {
    const p = WritingData.progress[s.id];
    if (!p) return;
    done++;
    if (p.v === "correct") correct++;
    if (p.due <= today) due++;
  });
  return { total: items.length, done, correct, due };
}

// Cập nhật hộp Leitner: đúng → lên hộp, gần đúng → giữ, sai → về hộp 0 (ôn lại ngay hôm nay)
function recordResult(sentenceId, answer, result) {
  const prev = WritingData.progress[sentenceId] || { box: 0, n: 0 };
  let box = prev.box || 0;
  if (result.verdict === "correct") box = Math.min(box + 1, SRS_INTERVALS.length - 1);
  else if (result.verdict === "minor") box = Math.max(box, 1);
  else box = 0;

  WritingData.progress[sentenceId] = {
    a: answer,
    s: result.score,
    v: result.verdict,
    c: result.corrected || "",
    nat: result.natural || "",
    n: (prev.n || 0) + 1,
    box,
    due: isoDate(SRS_INTERVALS[box]),
    t: Date.now(),
  };
  WritingData.saveProgress();
  (result.errors || []).forEach(e => e.type && logError(`✍️ ${e.type}`));
}

// Các câu đã viết và đến hạn ôn, yếu nhất trước
function getDueItems() {
  const today = isoDate();
  const items = [];
  for (const lesson of WRITING_LESSONS) {
    for (const s of getLessonSentences(lesson)) {
      const p = WritingData.progress[s.id];
      if (p && p.due <= today) items.push({ lesson, sentence: s, entry: p });
    }
  }
  return items.sort((a, b) => a.entry.box - b.entry.box || a.entry.s - b.entry.s);
}

// Các câu đã viết, yếu nhất trước (dùng khi chưa có câu nào đến hạn)
function getWeakestItems(lessonId = null) {
  const items = [];
  for (const lesson of WRITING_LESSONS) {
    if (lessonId && lesson.id !== lessonId) continue;
    for (const s of getLessonSentences(lesson)) {
      const p = WritingData.progress[s.id];
      if (p) items.push({ lesson, sentence: s, entry: p });
    }
  }
  return items.sort((a, b) => a.entry.box - b.entry.box || a.entry.s - b.entry.s || a.entry.t - b.entry.t);
}

// ---- So khớp câu offline (normalizeSentence, wordsOf, diffTokens, similarity ở core/text.js) ----
function diffHtml(answer, reference) {
  return diffTokens(wordsOf(answer), wordsOf(reference)).ops.map(op => {
    if (op.type === "same") return `<span class="wr-d-same">${escapeHtml(op.val)}</span>`;
    if (op.type === "extra") return `<span class="wr-d-extra" title="Thừa / sai">${escapeHtml(op.val)}</span>`;
    return `<span class="wr-d-missing" title="Thiếu">${escapeHtml(op.val)}</span>`;
  }).join(" ");
}

function bestReference(sentence, answer) {
  const refs = [sentence.en, ...(sentence.alt || [])];
  let best = refs[0], bestSim = -1;
  refs.forEach(r => {
    const sim = similarity(answer, r);
    if (sim > bestSim) { best = r; bestSim = sim; }
  });
  return { ref: best, sim: bestSim };
}

function gradeLocal(sentence, answer, lesson = null) {
  const { ref, sim } = bestReference(sentence, answer);
  const verdict = sim >= 0.999 ? "correct" : sim >= 0.7 ? "minor" : "wrong";
  const analysis = buildGrammarAnalysis({ ...sentence, en: ref }, answer, lesson, null);
  return {
    score: verdict === "correct" ? 10 : Math.round(sim * 10),
    verdict,
    corrected: ref,
    natural: sentence.en,
    errors: [],
    tip: verdict === "correct" ? "" : "Chế độ offline chỉ so khớp với đáp án mẫu — câu khác cách diễn đạt vẫn có thể đúng.",
    diffRef: ref,
    source: "local",
    analysis,
  };
}

function buildGradePrompt(sentence, answer, lesson) {
  return `Bạn là giáo viên tiếng Anh chấm bài dịch Việt → Anh cho người Việt (trình độ A2-B1).
Câu tiếng Việt: "${sentence.vi}"
Điểm ngữ pháp trọng tâm: ${lesson ? lesson.grammar.name : "tự do"}
Đáp án tham khảo: "${sentence.en}"${sentence.alt?.length ? ` (hoặc: ${sentence.alt.map(a => `"${a}"`).join(", ")})` : ""}
Bài làm của học viên: "${answer}"

Yêu cầu:
- Chấp nhận mọi cách dịch đúng nghĩa và đúng ngữ pháp, KHÔNG bắt buộc giống đáp án tham khảo.
- verdict: "correct" nếu đúng hoàn toàn; "minor" nếu chỉ sai nhỏ (chính tả, mạo từ, dấu câu, thiếu s); "wrong" nếu sai ngữ pháp chính hoặc sai nghĩa.
- corrected: sửa câu của học viên với ít thay đổi nhất (nếu đúng thì giữ nguyên).
- natural: cách người bản xứ hay nói nhất.
- errors: tối đa 3 lỗi, "type" là nhãn lỗi ngắn bằng tiếng Việt (VD "Thiếu to be", "Sai thì quá khứ"), "explain" giải thích 1 câu bằng tiếng Việt.
- tip: 1 mẹo ngắn bằng tiếng Việt để nhớ (có thể để trống).
- analysis: Phân tích cấu trúc câu và các điểm ngữ pháp để học viên hiểu sâu:
  + structure: Công thức cấu trúc câu (VD: "S + V(s/es) + O + Time" hoặc "S + will be able to + V-inf").
  + components: Mảng các thành phần câu [{"label": "S|V|O|Prep|Adv", "text": "..."}].
  + rules: Mảng giải thích quy tắc chia từ/thì (đặc biệt: tại sao thêm -s/es, tại sao thêm -ed, bất quy tắc, to-V, V-ing) [{"target": "từ", "type": "Tên quy tắc", "rule": "Giải thích chi tiết dễ hiểu"}].
  + patterns: Mảng các cấu trúc/cụm từ quan trọng (như be able to + V, used to + V, spend time V-ing, giới từ) [{"name": "Cụm cấu trúc", "usage": "Cách dùng và lưu ý"}].
  + learnerNote: Nhận xét đối chiếu với cách viết của học viên (nếu học viên viết sai/quên s, ed, to...).

Chỉ trả về JSON:
{
  "score": 0-10,
  "verdict": "correct|minor|wrong",
  "corrected": "",
  "natural": "",
  "errors": [{"type": "", "explain": ""}],
  "tip": "",
  "analysis": {
    "structure": "",
    "components": [{"label": "", "text": ""}],
    "rules": [{"target": "", "type": "", "rule": ""}],
    "patterns": [{"name": "", "usage": ""}],
    "learnerNote": ""
  }
}`;
}

// Chấm một câu: khớp đáp án mẫu thì chấm ngay; còn lại hỏi Gemini (nếu có), lỗi thì quay về chấm offline.
async function gradeSentence(sentence, answer, lesson) {
  const local = gradeLocal(sentence, answer, lesson);
  if (local.verdict === "correct" || !Gemini.isAvailable()) return local;
  try {
    const r = await Gemini.generateJSON(buildGradePrompt(sentence, answer, lesson));
    const verdict = ["correct", "minor", "wrong"].includes(r.verdict) ? r.verdict : local.verdict;
    const targetRef = r.corrected || local.corrected;
    const analysis = buildGrammarAnalysis({ ...sentence, en: targetRef }, answer, lesson, r.analysis);
    return {
      score: Number.isFinite(+r.score) ? Math.max(0, Math.min(10, Math.round(+r.score))) : local.score,
      verdict,
      corrected: r.corrected || local.corrected,
      natural: r.natural || sentence.en,
      errors: Array.isArray(r.errors) ? r.errors.slice(0, 3) : [],
      tip: r.tip || "",
      diffRef: r.corrected || local.corrected,
      analysis,
      source: "ai",
    };
  } catch (e) {
    console.warn("AI grading failed, fallback to local:", e);
    return { ...local, tip: "Không gọi được AI — đang chấm offline bằng so khớp đáp án mẫu." };
  }
}

// ---- Sinh thêm câu cho một chủ đề bằng Gemini ----------------------------------------------
async function generateExtraSentences(lesson, amount = 8) {
  const existing = getLessonSentences(lesson).map(s => s.vi).join(" | ");
  const prompt = `Tạo ${amount} câu luyện dịch Việt → Anh mới cho người Việt trình độ A2-B1.
Chủ đề: "${lesson.title}". Điểm ngữ pháp bắt buộc dùng: ${lesson.grammar.name} (${lesson.grammar.formula.join("; ")}).
Câu ngắn (6-14 từ), đời thường, tự nhiên. KHÔNG trùng các câu đã có: ${existing}
Chỉ trả về mảng JSON: [{"vi": "câu tiếng Việt", "en": "bản dịch chuẩn", "alt": ["1-2 cách dịch khác cũng đúng"]}]`;
  const list = await Gemini.generateJSON(prompt);
  if (!Array.isArray(list)) throw new Error("AI trả về sai định dạng");
  const current = WritingData.extra[lesson.id] || [];
  const stamp = Date.now().toString(36);
  const added = list
    .filter(s => s && s.vi && s.en)
    .map((s, i) => ({ id: `${lesson.id}-x${stamp}${i}`, vi: String(s.vi), en: String(s.en), alt: Array.isArray(s.alt) ? s.alt.map(String) : [] }));
  WritingData.extra[lesson.id] = current.concat(added);
  WritingData.saveExtra();
  return added.length;
}
