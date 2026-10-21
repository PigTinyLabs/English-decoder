// ---- Chắp Bút: Bộ phân tích cấu trúc câu & ngữ pháp chuyên sâu -------------------
// Giúp người học hiểu rõ:
// 1. Cấu trúc câu (S - V - O - Trạng ngữ)
// 2. Quy tắc chia động từ & biến đổi từ (khi nào thêm -s/-es, -ed, bất quy tắc, -ing)
// 3. Cụm từ & mẫu câu ngữ pháp quan trọng (be able to + V, used to + V, modal verbs, collocations...)
// 4. Nhận xét đối chiếu với câu người học vừa viết

const IRREGULAR_VERBS = {
  be: { past: "was / were", pp: "been", note: "Động từ to be ở quá khứ: I/he/she/it dùng was, you/we/they dùng were" },
  go: { past: "went", pp: "gone", note: "Động từ bất quy tắc: go → went (quá khứ)" },
  buy: { past: "bought", pp: "bought", note: "Động từ bất quy tắc: buy → bought" },
  see: { past: "saw", pp: "seen", note: "Động từ bất quy tắc: see → saw" },
  have: { past: "had", pp: "had", note: "Động từ bất quy tắc: have/has → had" },
  eat: { past: "ate", pp: "eaten", note: "Động từ bất quy tắc: eat → ate" },
  run: { past: "ran", pp: "run", note: "Động từ bất quy tắc: run → ran" },
  come: { past: "came", pp: "come", note: "Động từ bất quy tắc: come → came" },
  make: { past: "made", pp: "made", note: "Động từ bất quy tắc: make → made" },
  meet: { past: "met", pp: "met", note: "Động từ bất quy tắc: meet → met" },
  break: { past: "broke", pp: "broken", note: "Động từ bất quy tắc: break → broke" },
  take: { past: "took", pp: "taken", note: "Động từ bất quy tắc: take → took" },
  give: { past: "gave", pp: "given", note: "Động từ bất quy tắc: give → gave" },
  feel: { past: "felt", pp: "felt", note: "Động từ bất quy tắc: feel → felt" },
  find: { past: "found", pp: "found", note: "Động từ bất quy tắc: find → found" },
  get: { past: "got", pp: "got / gotten", note: "Động từ bất quy tắc: get → got" },
  write: { past: "wrote", pp: "written", note: "Động từ bất quy tắc: write → wrote" },
  say: { past: "said", pp: "said", note: "Động từ bất quy tắc: say → said" },
  speak: { past: "spoke", pp: "spoken", note: "Động từ bất quy tắc: speak → spoke" },
  drink: { past: "drank", pp: "drunk", note: "Động từ bất quy tắc: drink → drank" },
  read: { past: "read", pp: "read", note: "Động từ bất quy tắc: viết giữ nguyên nhưng đọc là /red/ ở quá khứ" },
  win: { past: "won", pp: "won", note: "Động từ bất quy tắc: win → won" },
  lose: { past: "lost", pp: "lost", note: "Động từ bất quy tắc: lose → lost" },
  leave: { past: "left", pp: "left", note: "Động từ bất quy tắc: leave → left" },
  sleep: { past: "slept", pp: "slept", note: "Động từ bất quy tắc: sleep → slept" },
  hear: { past: "heard", pp: "heard", note: "Động từ bất quy tắc: hear → heard" },
  drive: { past: "drove", pp: "driven", note: "Động từ bất quy tắc: drive → drove" },
  swim: { past: "swam", pp: "swum", note: "Động từ bất quy tắc: swim → swam" },
  begin: { past: "began", pp: "begun", note: "Động từ bất quy tắc: begin → began" },
  forget: { past: "forgot", pp: "forgotten", note: "Động từ bất quy tắc: forget → forgot" },
  build: { past: "built", pp: "built", note: "Động từ bất quy tắc: build → built" },
  send: { past: "sent", pp: "sent", note: "Động từ bất quy tắc: send → sent" },
  spend: { past: "spent", pp: "spent", note: "Động từ bất quy tắc: spend → spent" },
  catch: { past: "caught", pp: "caught", note: "Động từ bất quy tắc: catch → caught" },
  teach: { past: "taught", pp: "taught", note: "Động từ bất quy tắc: teach → taught" },
  bring: { past: "brought", pp: "brought", note: "Động từ bất quy tắc: bring → brought" },
  think: { past: "thought", pp: "thought", note: "Động từ bất quy tắc: think → thought" },
  tell: { past: "told", pp: "told", note: "Động từ bất quy tắc: tell → told" },
  sit: { past: "sat", pp: "sat", note: "Động từ bất quy tắc: sit → sat" },
  stand: { past: "stood", pp: "stood", note: "Động từ bất quy tắc: stand → stood" },
  understand: { past: "understood", pp: "understood", note: "Động từ bất quy tắc: understand → understood" },
  do: { past: "did", pp: "done", note: "Động từ bất quy tắc: do/does → did (quá khứ)" },
  fall: { past: "fell", pp: "fallen", note: "Động từ bất quy tắc: fall → fell" },
  know: { past: "knew", pp: "known", note: "Động từ bất quy tắc: know → knew" },
  wear: { past: "wore", pp: "worn", note: "Động từ bất quy tắc: wear → wore" },
  fly: { past: "flew", pp: "flown", note: "Động từ bất quy tắc: fly → flew" },
};

// Tra cứu ngược từ dạng quá khứ về từ gốc
const IRREGULAR_PAST_LOOKUP = {};
Object.entries(IRREGULAR_VERBS).forEach(([base, val]) => {
  val.past.split("/").forEach(p => {
    IRREGULAR_PAST_LOOKUP[p.trim().toLowerCase()] = { base, ...val };
  });
});

// Các cấu trúc / mẫu câu ngữ pháp phổ biến cần highlight
const GRAMMAR_PATTERNS = [
  {
    regex: /\b(?:am|is|are|was|were|will\s+be|be)\s+able\s+to\s+([a-z]+)\b/i,
    name: "be able to + V (nguyên thể)",
    formula: "S + be able to + V-inf",
    usage: "Diễn tả khả năng làm được việc gì đó (thường dùng thay 'can' ở thì tương lai 'will be able to' hoặc thì hoàn thành). Luôn đi với 'to' trước động từ nguyên mẫu."
  },
  {
    regex: /\bused\s+to\s+([a-z]+)\b/i,
    name: "used to + V (nguyên thể)",
    formula: "S + used to + V-inf",
    usage: "Đã từng có thói quen làm gì trong quá khứ (hiện tại không còn). Lưu ý dạng phủ định: 'didn't use to + V' (bỏ đuôi -d)."
  },
  {
    regex: /\b(?:am|is|are|was|were)\s+going\s+to\s+([a-z]+)\b/i,
    name: "be going to + V (Tương lai gần)",
    formula: "S + am/is/are + going to + V-inf",
    usage: "Dùng để nói về dự định, kế hoạch đã có từ trước hoặc dự đoán có căn cứ rõ ràng trước mắt."
  },
  {
    regex: /\b(?:have|has|had)\s+to\s+([a-z]+)\b/i,
    name: "have/has/had to + V (Bắt buộc)",
    formula: "S + have to + V-inf",
    usage: "Bắt buộc phải làm gì do hoàn cảnh khách quan bên ngoài quy định."
  },
  {
    regex: /\b(?:can|could|should|will|would|must|may|might)\s+([a-z]+)\b/i,
    name: "Modal verb + V (nguyên thể không 'to')",
    formula: "Modal + V-bare",
    usage: "Sau các trợ động từ khuyết thiếu (can, could, should, will, must...), động từ chính luôn ở dạng nguyên mẫu không chia và KHÔNG có 'to'."
  },
  {
    regex: /\blook(?:s|ed|ing)?\s+forward\s+to\s+([a-z]+ing)\b/i,
    name: "look forward to + V-ing",
    formula: "S + look forward to + V-ing / Noun",
    usage: "Háo hức, mong chờ điều gì. Lưu ý: 'to' ở đây là giới từ, do đó động từ theo sau bắt buộc phải thêm đuôi -ing."
  },
  {
    regex: /\bspend(?:s|t|ing)?\s+([a-z0-9\s]+?)\s+([a-z]+ing)\b/i,
    name: "spend [thời gian] + V-ing",
    formula: "S + spend + time/money + V-ing",
    usage: "Dành thời gian hoặc tiền bạc vào việc gì (động từ theo sau luôn chia ở dạng V-ing)."
  },
  {
    regex: /\b(?:want|wants|wanted|decide|decides|decided|plan|plans|planned|hope|hopes|hoped|promise|promises|promised|need|needs|needed|try|tries|tried)\s+to\s+([a-z]+)\b/i,
    name: "Động từ đi với to-Infinitive (V + to-V)",
    formula: "V + to + V-inf",
    usage: "Các động từ chỉ ý định, mong muốn (want, decide, plan, hope, promise, need...) luôn đi kèm với động từ nguyên mẫu có 'to'."
  },
  {
    regex: /\bthere\s+(?:is|are|was|were|will\s+be)\b/i,
    name: "Cấu trúc There is / There are (Có...)",
    formula: "There + be + Noun",
    usage: "Dùng để chỉ sự tồn tại của người/vật. 'There is/was' đi với danh từ số ít hoặc không đếm được; 'There are/were' đi với danh từ số nhiều."
  },
  {
    regex: /\bby\s+(?:bus|train|car|plane|taxi|bike|motorbike|boat)\b/i,
    name: "Giới từ phương tiện: by + [xe]",
    formula: "by + vehicle",
    usage: "Đi bằng phương tiện gì: dùng giới từ 'by' trực tiếp với tên phương tiện (by bus, by car, by train, by motorbike)."
  },
  {
    regex: /\b(?:in\s+the\s+morning|in\s+the\s+afternoon|in\s+the\s+evening|at\s+night|at\s+noon|at\s+midnight)\b/i,
    name: "Cụm thời gian cố định: in the... / at night",
    formula: "in the morning/afternoon/evening · at night",
    usage: "Dùng 'in the' cho buổi sáng/chiều/tối, nhưng riêng ban đêm/nửa đêm dùng 'at night', 'at midnight'."
  }
];

// Phân tích hình thái từ (Word Forms & Inflections)
function analyzeWordForms(text) {
  const words = (text.match(/[a-zA-Z']+/g) || []);
  const rules = [];
  const seenTargets = new Set();

  words.forEach(rawWord => {
    const w = rawWord.toLowerCase();
    if (seenTargets.has(w)) return;

    // 1. Kiểm tra động từ bất quy tắc quá khứ (went, bought, saw...)
    if (IRREGULAR_PAST_LOOKUP[w]) {
      const info = IRREGULAR_PAST_LOOKUP[w];
      rules.push({
        target: rawWord,
        type: "Động từ bất quy tắc (Quá khứ)",
        detail: `Từ gốc: <b>${info.base}</b> → quá khứ là <b>${rawWord}</b>. ${info.note}.`
      });
      seenTargets.add(w);
      return;
    }

    // 2. Đuôi -es (động từ hoặc danh từ)
    // kết thúc bằng o, ch, sh, ss, x, z hoặc phụ âm + ies
    if (w.endsWith("es") && w.length > 3) {
      if (w.endsWith("ies") && !["lies", "ties", "pies"].includes(w)) {
        const base = w.slice(0, -3) + "y";
        rules.push({
          target: rawWord,
          type: "Biến đổi đuôi -ies",
          detail: `Từ gốc tận cùng bằng phụ âm + <b>y</b> (<b>${base}</b>) → đổi <b>y</b> thành <b>i</b> rồi thêm <b>-es</b> thành <b>${rawWord}</b>.`
        });
        seenTargets.add(w);
        return;
      }
      const stem = w.slice(0, -2);
      if (stem.endsWith("o") || stem.endsWith("ch") || stem.endsWith("sh") || stem.endsWith("ss") || stem.endsWith("x") || stem.endsWith("z")) {
        rules.push({
          target: rawWord,
          type: "Quy tắc thêm đuôi -es",
          detail: `Từ gốc <b>${stem}</b> tận cùng bằng <i>-o, -s, -ch, -sh, -x, -z</i> → thêm đuôi <b>-es</b> (thay vì chỉ thêm -s) khi đi với ngôi thứ 3 số ít (He/She/It) hoặc số nhiều.`
        });
        seenTargets.add(w);
        return;
      }
    }

    // 3. Đuôi -ed (thì quá khứ đơn có quy tắc)
    if (w.endsWith("ed") && w.length > 3 && !["red", "bed", "fed"].includes(w)) {
      if (w.endsWith("ied")) {
        const base = w.slice(0, -3) + "y";
        rules.push({
          target: rawWord,
          type: "Thêm -ed (đổi y → ied)",
          detail: `Động từ <b>${base}</b> tận cùng bằng phụ âm + <b>y</b> → đổi <b>y</b> thành <b>i</b> rồi thêm <b>-ed</b> thành <b>${rawWord}</b> ở thì Quá khứ đơn.`
        });
      } else if (w.length >= 5 && w[w.length - 3] === w[w.length - 4]) {
        // stopped, planned
        const base = w.slice(0, -3);
        rules.push({
          target: rawWord,
          type: "Thêm -ed (Gấp đôi phụ âm cuối)",
          detail: `Động từ <b>${base}</b> có 1 âm tiết, tận cùng là phụ âm - nguyên âm - phụ âm → gấp đôi phụ âm cuối trước khi thêm <b>-ed</b> thành <b>${rawWord}</b>.`
        });
      } else {
        const base = w.endsWith("eed") ? w.slice(0, -1) : w.slice(0, -2);
        rules.push({
          target: rawWord,
          type: "Động từ Quá khứ đơn (-ed)",
          detail: `Động từ có quy tắc thêm đuôi <b>-ed</b> để diễn tả hành động đã xảy ra và kết thúc trong quá khứ.`
        });
      }
      seenTargets.add(w);
      return;
    }

    // 4. Đuôi -s (ngôi thứ 3 số ít hoặc số nhiều thông thường)
    if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is") && w.length > 3) {
      if (["this", "yes", "always", "sometimes", "bus", "gas", "plus", "various"].includes(w)) return;
      const base = w.slice(0, -1);
      rules.push({
        target: rawWord,
        type: "Thêm đuôi -s",
        detail: `Từ gốc <b>${base}</b> thêm <b>-s</b> → Dùng cho động từ thì Hiện tại đơn đi với chủ ngữ ngôi thứ 3 số ít (He, She, It, Danh từ số ít), hoặc danh từ số nhiều.`
      });
      seenTargets.add(w);
      return;
    }

    // 5. Đuôi -ing
    if (w.endsWith("ing") && w.length > 4 && !["bring", "sing", "ring", "wing", "thing", "king"].includes(w)) {
      if (w.length >= 6 && w[w.length - 4] === w[w.length - 5]) {
        const base = w.slice(0, -4);
        rules.push({
          target: rawWord,
          type: "Thêm -ing (Gấp đôi phụ âm)",
          detail: `Động từ <b>${base}</b> gấp đôi phụ âm cuối trước khi thêm <b>-ing</b> thành <b>${rawWord}</b> (thì tiếp diễn hoặc danh động từ).`
        });
      } else {
        rules.push({
          target: rawWord,
          type: "Động từ đuôi -ing",
          detail: `Dạng V-ing: dùng trong thì tiếp diễn (sau to be), sau giới từ, hoặc đóng vai trò danh động từ (gerund).`
        });
      }
      seenTargets.add(w);
    }
  });

  return rules;
}

// Tìm các mẫu câu ngữ pháp trong câu
function detectGrammarPatterns(text) {
  const matches = [];
  GRAMMAR_PATTERNS.forEach(p => {
    if (p.regex.test(text)) {
      matches.push({
        name: p.name,
        formula: p.formula,
        usage: p.usage,
      });
    }
  });
  return matches;
}

// Tách thành phần câu (S - V - O - Trạng ngữ)
function analyzeSentenceSyntax(text) {
  // Nếu có nlp (compromise.js)
  if (typeof window !== "undefined" && window.nlp) {
    try {
      const doc = window.nlp(text);
      const json = doc.json();
      const components = [];
      let currentRole = null;
      let currentText = [];

      function flush() {
        if (currentRole && currentText.length) {
          components.push({ label: currentRole, text: currentText.join(" ") });
          currentText = [];
        }
      }

      if (json && json[0] && json[0].terms) {
        let verbEncountered = false;
        json[0].terms.forEach(term => {
          const tText = term.text;
          const tags = term.tags || [];

          if (tags.includes("Verb") || tags.includes("Modal") || tags.includes("Auxiliary")) {
            if (currentRole !== "V") { flush(); currentRole = "V"; }
            currentText.push(tText);
            verbEncountered = true;
          } else if (tags.includes("Preposition") || tags.includes("Conjunction")) {
            if (currentRole !== "Prep") { flush(); currentRole = "Prep"; }
            currentText.push(tText);
          } else if (tags.includes("Date") || tags.includes("Value") || tags.includes("Adverb")) {
            if (currentRole !== "Adv") { flush(); currentRole = "Adv"; }
            currentText.push(tText);
          } else if (tags.includes("Noun") || tags.includes("Pronoun") || tags.includes("Determiner") || tags.includes("Adjective")) {
            const targetRole = verbEncountered ? "O" : "S";
            if (currentRole !== targetRole && currentRole !== "Prep" && currentRole !== "Adv") {
              flush();
              currentRole = targetRole;
            }
            currentText.push(tText);
          } else {
            currentText.push(tText);
          }
        });
        flush();
        if (components.length > 0) return components;
      }
    } catch (e) {
      // Fallback bên dưới
    }
  }

  // Fallback rule-based syntax splitter
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) {
    return [
      { label: "S", text: words[0] || "" },
      { label: "V", text: words.slice(1).join(" ") || "" }
    ].filter(c => c.text);
  }

  // Chia cơ bản: Từ đầu là S, từ tiếp theo là V, phần còn lại là O/Adv
  return [
    { label: "S", text: words[0] },
    { label: "V", text: words[1] },
    { label: "O / Bổ ngữ", text: words.slice(2).join(" ") }
  ];
}

// Đối chiếu câu học viên viết với câu mẫu để bắt các lỗi ngữ pháp / hình thái từ phổ biến
function compareLearnerGrammar(learnerAnswer, referenceSentence) {
  if (!learnerAnswer || !referenceSentence) return [];
  const notes = [];
  const lText = learnerAnswer.trim().toLowerCase();
  const rText = referenceSentence.trim().toLowerCase();

  // 1. Kiểm tra thiếu -s / -es ở ngôi thứ 3 số ít
  const rTokens = rText.replace(/[.,?!]/g, "").split(/\s+/);
  const lTokens = lText.replace(/[.,?!]/g, "").split(/\s+/);

  rTokens.forEach(rWord => {
    // 1. Nếu trong câu mẫu có từ kết thúc bằng -s hoặc -es
    if ((rWord.endsWith("s") || rWord.endsWith("es")) && rWord.length > 3) {
      if (!["this", "yes", "always", "sometimes", "bus", "gas", "plus"].includes(rWord)) {
        const possibleStems = [];
        if (rWord.endsWith("ies")) possibleStems.push(rWord.slice(0, -3) + "y");
        if (rWord.endsWith("es")) {
          possibleStems.push(rWord.slice(0, -2)); // watch, go, fix
          possibleStems.push(rWord.slice(0, -1)); // write, like, come (gốc có e)
        }
        possibleStems.push(rWord.slice(0, -1)); // speaks -> speak

        const matchedStem = possibleStems.find(s => s && lTokens.includes(s));
        if (matchedStem && !lTokens.includes(rWord)) {
          notes.push({
            type: "warning",
            title: `Thiếu đuôi '-s / -es'`,
            message: `Bạn viết <b>${matchedStem}</b> ➔ Cần viết là <b>${rWord}</b> (chủ ngữ ngôi thứ 3 số ít trong thì Hiện tại đơn cần chia động từ thêm <b>-s</b> hoặc <b>-es</b>).`
          });
        }
      }
    }

    // 2. Kiểm tra thì quá khứ (-ed)
    if (rWord.endsWith("ed") && rWord.length > 3) {
      const possiblePastStems = [];
      if (rWord.endsWith("ied")) possiblePastStems.push(rWord.slice(0, -3) + "y");
      possiblePastStems.push(rWord.slice(0, -2)); // visit, clean
      possiblePastStems.push(rWord.slice(0, -1)); // like, live, hope
      if (rWord.length >= 5 && rWord[rWord.length - 3] === rWord[rWord.length - 4]) {
        possiblePastStems.push(rWord.slice(0, -3)); // stop, plan
      }
      const matchedPast = possiblePastStems.find(s => s && lTokens.includes(s));
      if (matchedPast && !lTokens.includes(rWord)) {
        notes.push({
          type: "warning",
          title: `Chưa chia thì Quá khứ (-ed)`,
          message: `Bạn viết <b>${matchedPast}</b> ➔ Hành động trong quá khứ cần chia thêm <b>-ed</b> thành <b>${rWord}</b>.`
        });
      }
    }

    // 3. Bất quy tắc
    if (IRREGULAR_PAST_LOOKUP[rWord]) {
      const base = IRREGULAR_PAST_LOOKUP[rWord].base;
      if (lTokens.includes(base) && !lTokens.includes(rWord)) {
        notes.push({
          type: "warning",
          title: `Quên chia động từ bất quy tắc`,
          message: `Bạn viết <b>${base}</b> ➔ Động từ này ở quá khứ bất quy tắc chuyển thành <b>${rWord}</b>.`
        });
      }
    }
  });

  // 3. Kiểm tra cụm be able to
  if (/able\s+to\b/.test(rText)) {
    if (/\bable\s+[a-z]+\b/.test(lText) && !/\bable\s+to\b/.test(lText)) {
      notes.push({
        type: "warning",
        title: `Thiếu 'to' trong 'be able to'`,
        message: `Cấu trúc bắt buộc là <b>be able TO + động từ</b> (ví dụ <i>be able to speak</i>). Bạn đã quên mất từ <b>to</b>!`
      });
    }
  }

  // 4. Kiểm tra thừa 'to' sau modal verb
  if (/\b(can|could|should|will|must)\s+to\s+[a-z]+/i.test(learnerAnswer)) {
    notes.push({
      type: "warning",
      title: `Thừa 'to' sau trợ động từ khuyết thiếu`,
      message: `Sau <b>can, could, should, will, must</b> luôn đi trực tiếp với động từ nguyên mẫu không 'to' (viết <i>can swim</i>, KHÔNG viết <i>can to swim</i>).`
    });
  }

  // 5. Kiểm tra used to
  if (/used\s+to\b/.test(rText) && /\buse\s+to\b/.test(lText) && !/\bdidn't\s+use\s+to\b/.test(lText)) {
    notes.push({
      type: "warning",
      title: `Thiếu đuôi '-d' trong 'used to'`,
      message: `Ở câu khẳng định quá khứ, cấu trúc là <b>used to + V</b> (có đuôi <b>-d</b>). Chỉ khi có trợ động từ <i>didn't</i> mới dùng <i>didn't use to</i>.`
    });
  }

  return notes;
}

// Hàm phân tích tổng hợp: kết hợp phân tích offline + thông tin từ bài học + AI (nếu có)
function buildGrammarAnalysis(targetSentence, learnerAnswer, lesson, aiAnalysis = null) {
  const refText = targetSentence.en || "";
  const lessonGrammar = lesson?.grammar;

  // 1. Phân tích thành phần câu S-V-O
  const components = (aiAnalysis?.components?.length)
    ? aiAnalysis.components
    : analyzeSentenceSyntax(refText);

  // 2. Cấu trúc tổng quát
  const structure = aiAnalysis?.structure || (
    lessonGrammar?.formula?.[0] || "S + V + O"
  );

  // 3. Quy tắc chia động từ & biến đổi từ
  let rules = analyzeWordForms(refText);
  if (aiAnalysis?.rules?.length) {
    // Hợp nhất quy tắc từ AI và Offline để đầy đủ nhất
    const aiRuleTargets = new Set(aiAnalysis.rules.map(r => (r.target || "").toLowerCase()));
    const enrichedOffline = rules.filter(r => !aiRuleTargets.has(r.target.toLowerCase()));
    rules = [
      ...aiAnalysis.rules.map(r => ({
        target: r.target || "",
        type: r.type || "Quy tắc ngữ pháp",
        detail: r.rule || r.detail || ""
      })),
      ...enrichedOffline
    ];
  }

  // 4. Các mẫu câu & cụm từ đặc trưng
  let patterns = detectGrammarPatterns(refText);
  if (aiAnalysis?.patterns?.length) {
    const aiPatternNames = new Set(aiAnalysis.patterns.map(p => (p.name || "").toLowerCase()));
    const extra = patterns.filter(p => !aiPatternNames.has(p.name.toLowerCase()));
    patterns = [
      ...aiAnalysis.patterns.map(p => ({
        name: p.name || "",
        formula: p.formula || "",
        usage: p.usage || p.detail || ""
      })),
      ...extra
    ];
  }

  // 5. Đối chiếu nhận xét cho người học
  const learnerNotes = compareLearnerGrammar(learnerAnswer, refText);
  if (aiAnalysis?.learnerNote && !learnerNotes.some(n => n.message.includes(aiAnalysis.learnerNote))) {
    learnerNotes.unshift({
      type: "ai",
      title: "Nhận xét ngữ pháp từ AI",
      message: aiAnalysis.learnerNote
    });
  }

  return {
    structure,
    components,
    rules,
    patterns,
    learnerNotes,
    lessonNote: lessonGrammar ? {
      name: lessonGrammar.name,
      notes: lessonGrammar.notes || []
    } : null
  };
}
