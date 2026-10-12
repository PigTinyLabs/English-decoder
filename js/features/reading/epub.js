// ---- Reading: đọc file EPUB thành sách song ngữ ---------------------------------------
// Hỗ trợ cả EPUB song ngữ kiểu "1 đoạn tiếng Anh → 1 đoạn tiếng Việt ngay sau" (VD bản xuất từ Google Docs)
// lẫn EPUB chỉ có tiếng Anh (bản dịch có thể nhờ AI sau). Giải nén bằng JSZip, chạy hoàn toàn trên máy.

// Chữ cái chỉ tiếng Việt mới có (bỏ qua à/á/é... vì tiếng Anh vẫn gặp trong café, résumé)
const VI_STRICT = /[ăâđêôơưạảãằẳẵắặầẩẫấậẹẻẽềểễếệịỉĩọỏõồổỗốộờởỡớợụủũừửữứựỳỷỹỵ]/i;
const VI_LOOSE = /[àáèéìíòóùúý]/gi;
// Dòng "nhiễu" trong các bản dịch cộng đồng: link, mục lục, ghi công người dịch
const EPUB_SKIP = [
  /^https?:\/\/\S+$/i, /^link( pdf)?:?(\s*https?:\/\/\S+)?$/i, /^mục lục$/i, /^table of contents$/i,
  /^(xem thêm )?(các )?(bài |bản |phần )?dịch bởi\b/i,
];
// Đoạn ngắn kiểu "Part 3" / "Section 2" coi như tiêu đề chương
const EPUB_PSEUDO_HEADING = /^(part|section|chapter|phần|chương)\s+\d+$/i;
const MAX_PARAS_PER_CHAPTER = 120;

function isVietnamese(text) {
  return VI_STRICT.test(text) || (text.match(VI_LOOSE) || []).length >= 2;
}

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function resolvePath(base, href) {
  const parts = (base ? base.split("/") : []).concat(decodeURIComponent(href.split("#")[0]).split("/"));
  const out = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}

function parseXml(text, type = "application/xhtml+xml") {
  let doc = new DOMParser().parseFromString(text, type);
  if (doc.querySelector("parsererror")) doc = new DOMParser().parseFromString(text, "text/html");
  return doc;
}

// Điểm khớp giữa 1 đoạn Anh và 1 đoạn Việt: tên riêng / con số xuất hiện ở cả hai + độ dài tương đương
function pairScore(en, vi) {
  const viWords = new Set(vi.toLowerCase().match(/[\p{L}\d]+/gu) || []);
  const anchors = new Set(en.match(/\d+/g) || []);
  for (const m of en.matchAll(/(^|[.!?"“]\s*)?\b([A-Z][a-z]{2,})/g)) {
    if (m[1] === undefined) anchors.add(m[2].toLowerCase()); // bỏ chữ hoa đầu câu
  }
  let overlap = 0;
  anchors.forEach(a => { if (viWords.has(a)) overlap++; });
  const ratio = vi.length / Math.max(1, en.length);
  return overlap * 1.5 + (1 - Math.min(1, Math.abs(ratio - 1.1)));
}

// Ghép [{ lang, text }] thành đoạn song ngữ. viFirst = bản dịch đứng TRƯỚC đoạn tiếng Anh.
function pairItems(items, viFirst) {
  const paras = [];
  let score = 0;
  for (let i = 0; i < items.length; i++) {
    const a = items[i], b = items[i + 1];
    if (b && !viFirst && a.lang === "en" && b.lang === "vi") {
      score += pairScore(a.text, b.text); paras.push({ en: a.text, vi: b.text }); i++;
    } else if (b && viFirst && a.lang === "vi" && b.lang === "en") {
      score += pairScore(b.text, a.text); paras.push({ en: b.text, vi: a.text }); i++;
    } else {
      paras.push(a.lang === "en" ? { en: a.text, vi: "" } : { en: "", vi: a.text });
    }
  }
  return { paras, score };
}

// Tạo danh sách chương từ chuỗi khối văn bản [{ heading, text, fileStart }].
// Phần lớn bản dịch đặt đoạn Anh trước đoạn Việt, nhưng có chương làm ngược lại →
// thử cả hai cách ghép cho từng chương và chọn cách khớp hơn rõ rệt.
function buildChapters(blocks, fallbackTitle) {
  const raw = [];
  let chapter = null;
  const newChapter = title => {
    if (chapter && chapter.items.length === 0) { chapter.title = title || chapter.title; return; }
    chapter = { title: title || `Phần ${raw.length + 1}`, items: [] };
    raw.push(chapter);
  };

  for (const b of blocks) {
    if (b.heading || EPUB_PSEUDO_HEADING.test(b.text)) {
      newChapter(b.text.replace(/\s*-\s*Dịch bởi.*$/i, ""));
      continue;
    }
    if (b.fileStart && chapter && chapter.items.length) newChapter("");
    if (!chapter) newChapter(fallbackTitle);
    if (EPUB_SKIP.some(re => re.test(b.text))) continue;
    chapter.items.push({ lang: isVietnamese(b.text) ? "vi" : "en", text: b.text });
  }

  const result = [];
  for (const c of raw) {
    if (!c.items.length) continue;
    const enFirst = pairItems(c.items, false);
    const viFirst = pairItems(c.items, true);
    const { paras } = viFirst.score > enFirst.score * 1.15 ? viFirst : enFirst;
    // Chương quá dài thì chia nhỏ cho dễ đọc
    for (let i = 0; i < paras.length; i += MAX_PARAS_PER_CHAPTER) {
      const part = paras.length > MAX_PARAS_PER_CHAPTER ? ` (${i / MAX_PARAS_PER_CHAPTER + 1})` : "";
      result.push({ title: c.title + part, paras: paras.slice(i, i + MAX_PARAS_PER_CHAPTER) });
    }
  }
  return result;
}

function extractBlocks(doc) {
  const SEL = "h1,h2,h3,h4,h5,h6,p,li,blockquote";
  const body = doc.body || doc.documentElement;
  const blocks = [];
  body.querySelectorAll(SEL).forEach(el => {
    if (el.parentElement?.closest(SEL)) return; // khối lồng nhau (li > p) chỉ lấy lớp ngoài
    const text = el.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;
    blocks.push({ heading: /^H[1-6]$/i.test(el.tagName), text });
  });
  if (!blocks.length) {
    body.textContent.split(/\n\s*\n/).map(t => t.replace(/\s+/g, " ").trim()).filter(Boolean)
      .forEach(text => blocks.push({ heading: false, text }));
  }
  return blocks;
}

async function parseEpub(file) {
  if (!window.JSZip) throw new Error("Chưa tải được thư viện JSZip (cần mạng).");
  const zip = await JSZip.loadAsync(file);
  const read = path => zip.file(path)?.async("string");

  const container = await read("META-INF/container.xml");
  if (!container) throw new Error("File không phải EPUB hợp lệ.");
  const opfPath = parseXml(container, "application/xml").querySelector("rootfile")?.getAttribute("full-path");
  const opfText = opfPath && await read(opfPath);
  if (!opfText) throw new Error("Không tìm thấy mục lục (OPF) trong EPUB.");

  const opf = parseXml(opfText, "application/xml");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/")) : "";
  const manifest = {};
  opf.querySelectorAll("manifest > item").forEach(it => {
    manifest[it.getAttribute("id")] = { href: it.getAttribute("href"), type: it.getAttribute("media-type") || "", props: it.getAttribute("properties") || "" };
  });
  const title = (opf.getElementsByTagName("dc:title")[0]?.textContent || file.name.replace(/\.epub$/i, "")).trim();

  const blocks = [];
  for (const ref of opf.querySelectorAll("spine > itemref")) {
    const item = manifest[ref.getAttribute("idref")];
    if (!item || !/html/.test(item.type) || item.props.includes("nav")) continue;
    const text = await read(resolvePath(opfDir, item.href));
    if (!text) continue;
    const fileBlocks = extractBlocks(parseXml(text));
    if (fileBlocks.length) fileBlocks[0].fileStart = true;
    blocks.push(...fileBlocks);
  }

  const chapters = buildChapters(blocks, title);
  if (!chapters.length) throw new Error("Không đọc được nội dung chữ trong EPUB.");
  const paras = chapters.reduce((n, c) => n + c.paras.filter(p => p.en).length, 0);
  const translated = chapters.reduce((n, c) => n + c.paras.filter(p => p.en && p.vi).length, 0);

  return {
    id: `epub-${hashString(title + "|" + paras)}`,
    title,
    level: "",
    cover: "📘",
    source: "epub",
    addedAt: Date.now(),
    stats: { paras, translated },
    chapters,
  };
}
