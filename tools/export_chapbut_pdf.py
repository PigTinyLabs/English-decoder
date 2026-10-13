"""Xuất giáo trình Chắp Bút 1000 câu ra 2 file PDF: bài tập tự dịch + đáp án.

Dùng: python3 tools/export_chapbut_pdf.py [thư_mục_ra]   (mặc định: pdf/)
Cần: node (đọc dữ liệu từ js/features/writing), reportlab, font Arial/Georgia của macOS.
"""
import json
import os
import subprocess
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITING = os.path.join(ROOT, "js", "features", "writing")
FONT_DIR = "/System/Library/Fonts/Supplemental"

EMERALD = colors.HexColor("#047857")
AMBER = colors.HexColor("#b45309")
INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#cbd5e1")
BOX = colors.HexColor("#f0fdf4")


# ---- Dữ liệu ------------------------------------------------------------------------------
def load_curriculum():
    files = ["curriculum.js"] + [f"lessons/week{i}.js" for i in range(1, 5)]
    script = (
        "const fs=require('fs');let src='';"
        f"for (const f of {json.dumps(files)}) src += fs.readFileSync({json.dumps(WRITING)} + '/' + f, 'utf8') + '\\n';"
        "eval(src + ';globalThis.OUT={weeks:WRITING_WEEKS,lessons:WRITING_LESSONS}');"
        "process.stdout.write(JSON.stringify(OUT));"
    )
    data = json.loads(subprocess.check_output(["node", "-e", script]))
    n = 0
    for lesson in data["lessons"]:
        sentences = []
        for s in lesson["sentences"]:
            if isinstance(s, list):
                s = {"vi": s[0], "en": s[1], "alt": s[2:]}
            n += 1
            sentences.append({**s, "alt": s.get("alt") or [], "no": n})
        lesson["sentences"] = sentences
    return data, n


# ---- Font & style ----------------------------------------------------------------------------
def register_fonts():
    for name, file in [
        ("Arial", "Arial.ttf"), ("Arial-Bold", "Arial Bold.ttf"),
        ("Arial-Italic", "Arial Italic.ttf"), ("Georgia", "Georgia.ttf"),
        ("Georgia-Bold", "Georgia Bold.ttf"), ("Georgia-Italic", "Georgia Italic.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, os.path.join(FONT_DIR, file)))
    pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-Bold")
    pdfmetrics.registerFontFamily("Georgia", normal="Georgia", bold="Georgia-Bold", italic="Georgia-Italic", boldItalic="Georgia-Bold")


def styles():
    s = {}
    s["cover_kicker"] = ParagraphStyle("ck", fontName="Arial-Bold", fontSize=11, textColor=EMERALD, alignment=TA_CENTER, spaceAfter=10)
    s["cover_title"] = ParagraphStyle("ct", fontName="Georgia-Bold", fontSize=34, leading=40, textColor=INK, alignment=TA_CENTER, spaceAfter=10)
    s["cover_sub"] = ParagraphStyle("cs", fontName="Arial", fontSize=13, leading=18, textColor=MUTED, alignment=TA_CENTER)
    s["h1"] = ParagraphStyle("h1", fontName="Arial-Bold", fontSize=18, leading=22, textColor=INK, spaceBefore=4, spaceAfter=10)
    s["week"] = ParagraphStyle("wk", fontName="Arial-Bold", fontSize=9, leading=12, textColor=EMERALD, spaceAfter=2)
    s["lesson"] = ParagraphStyle("ls", fontName="Arial-Bold", fontSize=16, leading=20, textColor=INK, spaceAfter=6)
    s["body"] = ParagraphStyle("b", fontName="Arial", fontSize=10.5, leading=15, textColor=INK)
    s["small"] = ParagraphStyle("sm", fontName="Arial", fontSize=9, leading=12.5, textColor=MUTED)
    s["formula"] = ParagraphStyle("f", fontName="Arial-Bold", fontSize=10, leading=14, textColor=AMBER)
    s["vi"] = ParagraphStyle("vi", fontName="Arial", fontSize=11.5, leading=16, textColor=INK, leftIndent=26, firstLineIndent=-26)
    s["en"] = ParagraphStyle("en", fontName="Georgia-Bold", fontSize=11, leading=15, textColor=INK, leftIndent=26, firstLineIndent=-26)
    s["ans_vi"] = ParagraphStyle("av", fontName="Arial", fontSize=8.5, leading=11, textColor=MUTED, leftIndent=26)
    s["alt"] = ParagraphStyle("al", fontName="Georgia-Italic", fontSize=9.5, leading=13, textColor=MUTED, leftIndent=26)
    s["guide"] = ParagraphStyle("g", parent=s["body"], spaceAfter=7)
    s["toc"] = ParagraphStyle("toc", fontName="Arial", fontSize=10, leading=14.5, textColor=INK)
    return s


class WriteLines(Flowable):
    """Các dòng kẻ để tự viết câu dịch."""

    def __init__(self, lines=2, gap=8 * mm, indent=26):
        super().__init__()
        self.lines, self.gap, self.indent = lines, gap, indent

    def wrap(self, avail_w, avail_h):
        self.width = avail_w
        return avail_w, self.lines * self.gap + 2

    def draw(self):
        self.canv.setStrokeColor(LINE)
        self.canv.setLineWidth(0.6)
        for i in range(self.lines):
            y = self.lines * self.gap - (i + 1) * self.gap + 2
            self.canv.line(self.indent, y, self.width, y)


# ---- Khung trang -----------------------------------------------------------------------------
def make_doc(path, title, footer_label):
    doc = BaseDocTemplate(
        path, pagesize=A4, title=title, author="English Decoder",
        leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")

    def on_page(canv, d):
        canv.saveState()
        canv.setFont("Arial", 8)
        canv.setFillColor(MUTED)
        canv.drawString(d.leftMargin, 10 * mm, f"Chắp Bút 1000 câu · {footer_label}")
        canv.drawRightString(A4[0] - d.rightMargin, 10 * mm, str(d.page))
        canv.setStrokeColor(LINE)
        canv.line(d.leftMargin, 13 * mm, A4[0] - d.rightMargin, 13 * mm)
        canv.restoreState()

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame]),
        PageTemplate(id="body", frames=[frame], onPage=on_page),
    ])
    return doc


def cover(st, data, total, title, subtitle, guide):
    weeks = data["weeks"]
    rows = [["Tuần", "Chủ đề", "Câu"]]
    for w in weeks:
        lessons = [l for l in data["lessons"] if l["week"] == w["id"]]
        first, last = lessons[0]["sentences"][0]["no"], lessons[-1]["sentences"][-1]["no"]
        rows.append([
            Paragraph(f"<b>{escape(w['title'].split(' · ')[0])}</b>", st["body"]),
            Paragraph(escape(w["title"].split(" · ")[1]), st["body"]),
            Paragraph(f"{first}–{last}", st["body"]),
        ])
    table = Table(rows, colWidths=[28 * mm, 100 * mm, 30 * mm])
    table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Arial-Bold", 9.5),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BOX]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story = [
        Spacer(1, 45 * mm),
        Paragraph("ENGLISH DECODER", st["cover_kicker"]),
        Paragraph(title, st["cover_title"]),
        Paragraph(subtitle, st["cover_sub"]),
        Spacer(1, 14 * mm),
        table,
        Spacer(1, 12 * mm),
    ]
    story += [Paragraph(g, st["guide"]) for g in guide]
    story += [NextPageTemplate("body"), PageBreak()]
    return story


def toc(st, data):
    story = [Paragraph("Mục lục chủ đề", st["h1"])]
    rows = []
    for l in data["lessons"]:
        first, last = l["sentences"][0]["no"], l["sentences"][-1]["no"]
        rows.append([
            Paragraph(f"Tuần {l['week']}", st["small"]),
            Paragraph(f"<b>{escape(l['title'])}</b> — {escape(l['grammar']['name'])}", st["toc"]),
            Paragraph(f"{first}–{last}", st["small"]),
        ])
    table = Table(rows, colWidths=[18 * mm, 128 * mm, 24 * mm], repeatRows=0)
    table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return story + [table, PageBreak()]


def lesson_header(st, lesson, with_grammar):
    g = lesson["grammar"]
    first, last = lesson["sentences"][0]["no"], lesson["sentences"][-1]["no"]
    parts = [
        Paragraph(f"TUẦN {lesson['week']} · CÂU {first}–{last}", st["week"]),
        Paragraph(escape(lesson["title"]), st["lesson"]),
    ]
    if not with_grammar:
        parts.append(Paragraph(f"Ngữ pháp: {escape(g['name'])}", st["small"]))
        return [KeepTogether(parts), Spacer(1, 6)]

    inner = [Paragraph(f"<b>Ngữ pháp:</b> {escape(g['name'])}", st["body"]), Spacer(1, 3)]
    inner += [Paragraph(escape(f), st["formula"]) for f in g["formula"]]
    inner.append(Spacer(1, 3))
    inner += [Paragraph(f"• {escape(n)}", st["small"]) for n in g["notes"]]
    for en, vi in g.get("examples", []):
        inner.append(Paragraph(f"VD: <font name='Georgia-Italic'>{escape(en)}</font> — {escape(vi)}", st["small"]))
    vocab = " · ".join(f"<b>{escape(w)}</b> ({escape(m)})" for w, m in lesson["vocab"])
    inner += [Spacer(1, 3), Paragraph(f"<b>Từ vựng:</b> {vocab}", st["small"])]
    box = Table([[inner]], colWidths=["100%"])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BOX),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#a7f3d0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [KeepTogether(parts + [box]), Spacer(1, 10)]


# ---- Hai file PDF ----------------------------------------------------------------------------
def build_exercises(path, data, total, st):
    doc = make_doc(path, "Chắp Bút 1000 câu — Bài tập dịch", "Bài tập dịch Việt → Anh")
    story = [NextPageTemplate("cover")]
    story += cover(st, data, total, "Chắp Bút 1000 câu",
                   "Bài tập tự dịch Việt → Anh · 4 tuần · 40 chủ đề",
                   [
                       "<b>Cách dùng:</b> mỗi ngày làm một chủ đề (25 câu). Đọc phần ngữ pháp và từ vựng trước, "
                       "rồi dịch từng câu sang tiếng Anh vào các dòng kẻ — đừng nhìn đáp án.",
                       "Làm xong thì so với file <b>Đáp án</b> (cùng số thứ tự câu). Câu sai hãy viết lại một lần "
                       "nữa và đọc to câu đúng. Đáp án chỉ là một cách dịch — câu khác vẫn có thể đúng.",
                       "Có thể luyện trực tiếp trong app English Decoder → tab <b>Chắp Bút</b>: AI chấm bài, "
                       "đọc lại câu và ôn tập bằng đối đáp.",
                   ])
    story += toc(st, data)
    for i, lesson in enumerate(data["lessons"]):
        if i:
            story.append(PageBreak())
        story += lesson_header(st, lesson, with_grammar=True)
        for s in lesson["sentences"]:
            story.append(KeepTogether([
                Paragraph(f"<b>{s['no']}.</b>&nbsp;&nbsp;{escape(s['vi'])}", st["vi"]),
                WriteLines(lines=2),
                Spacer(1, 5),
            ]))
    doc.build(story)


def build_answers(path, data, total, st):
    doc = make_doc(path, "Chắp Bút 1000 câu — Đáp án", "Đáp án")
    story = [NextPageTemplate("cover")]
    story += cover(st, data, total, "Chắp Bút 1000 câu",
                   "Đáp án · 1000 câu dịch Việt → Anh",
                   [
                       "Mỗi câu gồm: câu tiếng Việt (chữ xám), <b>đáp án chuẩn</b> (chữ đậm) và các "
                       "<i>cách dịch khác</i> cũng được chấp nhận.",
                       "Nếu câu của bạn khác đáp án nhưng đúng nghĩa và đúng ngữ pháp thì vẫn tính là đúng. "
                       "Kiểm tra kỹ: thì của động từ, chia động từ theo chủ ngữ (s/es), to be, mạo từ a/an/the, giới từ.",
                   ])
    story += toc(st, data)
    for lesson in data["lessons"]:
        story.append(CondPageBreak(60 * mm))
        story += lesson_header(st, lesson, with_grammar=False)
        for s in lesson["sentences"]:
            block = [
                Paragraph(escape(s["vi"]), st["ans_vi"]),
                Paragraph(f"<b>{s['no']}.</b>&nbsp;&nbsp;{escape(s['en'])}", st["en"]),
            ]
            if s["alt"]:
                block.append(Paragraph("Cách khác: " + " / ".join(escape(a) for a in s["alt"]), st["alt"]))
            block.append(Spacer(1, 6))
            story.append(KeepTogether(block))
        story.append(Spacer(1, 8))
    doc.build(story)


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "pdf")
    os.makedirs(out_dir, exist_ok=True)
    register_fonts()
    st = styles()
    data, total = load_curriculum()
    ex = os.path.join(out_dir, "Chap-But-1000-cau-Bai-tap-dich.pdf")
    ans = os.path.join(out_dir, "Chap-But-1000-cau-Dap-an.pdf")
    build_exercises(ex, data, total, st)
    build_answers(ans, data, total, st)
    print(f"{total} câu → {ex}\n{' ' * len(str(total))}      → {ans}")


if __name__ == "__main__":
    main()
