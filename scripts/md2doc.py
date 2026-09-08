# -*- coding: utf-8 -*-
"""마크다운 설계문서 → 인쇄 가능한 HTML (하이핀 문서 표준)
   사용: python scripts/md2doc.py <in.md> <out.html> [문서제목] [compact]
   compact — 제출용 소면수 문서(A4 5장 등)를 위한 조밀 조판. 기본 조판은 그대로 둔다.
   외부 의존 없음 — 이 저장소의 문서가 쓰는 문법(제목·표·코드블록·인용·목록·강조)만 다룬다."""
import io, re, sys, html as H

CSS = """
@page { size: A4; margin: 15mm 14mm 13mm; }
:root{--ink:#111827;--sub:#3f4a5c;--mute:#7c8798;--line:#dde2ea;--navy:#1a2b4a;
  --blue:#1d4ed8;--red:#b42318;--soft:#f7f9fc;--code:#f4f6fa;}
*{box-sizing:border-box} html,body{margin:0;padding:0}
body{background:#fff;color:var(--ink);font:10.4pt/1.62 "Malgun Gothic","맑은 고딕",-apple-system,"Segoe UI",sans-serif;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.wrap{max-width:186mm;margin:0 auto;padding:16mm 6mm 20mm}
h1{font-size:19pt;font-weight:800;letter-spacing:-.5px;margin:0 0 4px;line-height:1.25}
h2{font-size:13pt;font-weight:800;margin:22px 0 7px;padding:12px 0 0 9px;border-left:4px solid var(--navy);
  border-top:1.5px solid var(--navy);letter-spacing:-.3px;page-break-after:avoid}
h3{font-size:11pt;font-weight:800;margin:15px 0 5px;color:var(--sub);page-break-after:avoid}
p{margin:0 0 9px}
.sub1{font-size:12pt;color:var(--sub);font-weight:700;margin:0 0 10px;letter-spacing:-.2px}
.meta{font-size:9pt;color:var(--mute);padding-bottom:10px;border-bottom:2.5px solid var(--navy);margin-bottom:16px}
ul,ol{margin:0 0 10px;padding-left:20px} li{margin:0 0 4px}
table{width:100%;border-collapse:collapse;font-size:9.2pt;margin:8px 0 12px;page-break-inside:avoid}
th{background:var(--navy);color:#fff;font-weight:700;padding:5px 7px;text-align:left;font-size:8.6pt}
td{padding:5px 7px;border-bottom:.7px solid var(--line);vertical-align:top;line-height:1.55}
tbody tr:nth-child(even) td{background:#fbfcfe}
code{font-family:"Cascadia Mono",Consolas,"D2Coding",monospace;font-size:9pt;background:var(--code);
  border:1px solid var(--line);border-radius:3px;padding:1px 4px}
pre{background:var(--code);border:1px solid var(--line);border-left:3px solid var(--blue);border-radius:0 5px 5px 0;
  padding:9px 12px;margin:8px 0 12px;overflow-x:auto;page-break-inside:avoid}
pre code{background:none;border:0;padding:0;font-size:8.8pt;line-height:1.62}
blockquote{margin:10px 0;padding:9px 14px;background:#eff5ff;border-left:4px solid var(--blue);border-radius:0 5px 5px 0}
blockquote p{margin:0;font-weight:700;color:#1e3a8a}
hr{border:0;border-top:1px solid var(--line);margin:18px 0}
strong{font-weight:800}
@media print{.wrap{max-width:none;padding:0}}
"""

# 조밀 조판 — 본문 축소·여백 압축·표 밀도 상향. 기본 CSS 뒤에 덧붙여 덮어쓴다.
CSS_COMPACT = """
@page { size: A4; margin: 12mm 12mm 11mm; }
body{font-size:9.0pt;line-height:1.46}
.wrap{max-width:190mm;padding:10mm 4mm 12mm}
h1{font-size:16.5pt;margin:0 0 3px}
h2{font-size:11pt;margin:12px 0 4px;padding:7px 0 0 8px;border-left-width:3.5px}
h3{font-size:9.7pt;margin:9px 0 3px}
p{margin:0 0 6px}
.sub1{font-size:10.6pt;margin:0 0 7px}
.meta{font-size:8.2pt;padding-bottom:7px;margin-bottom:11px;border-bottom-width:2px}
ul,ol{margin:0 0 7px;padding-left:17px} li{margin:0 0 2px}
table{font-size:8.1pt;margin:4px 0 8px;page-break-inside:auto}
/* 표는 면을 넘어 이어지되 한 행이 잘리지는 않게 — 조밀 조판에서 표가 통째로 밀리면 빈 면이 생긴다 */
tr{page-break-inside:avoid} thead{display:table-header-group}
th{padding:3.5px 5px;font-size:7.9pt}
td{padding:3px 5px;line-height:1.4}
blockquote{margin:7px 0;padding:6px 11px}
pre{padding:6px 9px;margin:5px 0 9px} pre code{font-size:8pt;line-height:1.5}
hr{margin:10px 0}
/* 인쇄에서는 @page 여백만 쓴다 — .wrap 패딩이 남아 있으면 면마다 여백이 두 겹이 된다 */
@media print{.wrap{padding:0;max-width:none}}
"""

def inline(t):
    t = H.escape(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return t

def convert(md):
    out, i, lines = [], 0, md.split("\n")
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```"):
            buf = []; i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(H.escape(lines[i])); i += 1
            out.append("<pre><code>" + "\n".join(buf) + "</code></pre>"); i += 1; continue
        if re.match(r'^\|.*\|\s*$', ln) and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|\s*$', lines[i+1]):
            hdr = [c.strip() for c in ln.strip().strip("|").split("|")]
            i += 2; rows = []
            while i < len(lines) and re.match(r'^\|.*\|\s*$', lines[i]):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            out.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in hdr) + "</tr></thead><tbody>"
                       + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows)
                       + "</tbody></table>"); continue
        if ln.startswith("### "): out.append(f"<h3>{inline(ln[4:])}</h3>"); i += 1; continue
        if ln.startswith("## "):  out.append(f"<h2>{inline(ln[3:])}</h2>"); i += 1; continue
        if ln.startswith("# "):   out.append(f"<h1>{inline(ln[2:])}</h1>"); i += 1; continue
        if ln.startswith("> "):
            buf = []
            while i < len(lines) and lines[i].startswith("> "):
                buf.append(lines[i][2:]); i += 1
            out.append("<blockquote><p>" + inline("\n".join(buf)).replace("\n", "<br>") + "</p></blockquote>"); continue
        if re.match(r'^\s*[-*] ', ln):
            buf = []
            while i < len(lines) and (re.match(r'^\s*[-*] ', lines[i]) or (buf and lines[i].startswith("  ") and lines[i].strip())):
                if re.match(r'^\s*[-*] ', lines[i]): buf.append(re.sub(r'^\s*[-*] ', '', lines[i]))
                else: buf[-1] += " " + lines[i].strip()
                i += 1
            out.append("<ul>" + "".join(f"<li>{inline(b)}</li>" for b in buf) + "</ul>"); continue
        if re.match(r'^\s*\d+\. ', ln):
            buf = []
            while i < len(lines) and (re.match(r'^\s*\d+\. ', lines[i]) or (buf and lines[i].startswith("   ") and lines[i].strip())):
                if re.match(r'^\s*\d+\. ', lines[i]): buf.append(re.sub(r'^\s*\d+\. ', '', lines[i]))
                else: buf[-1] += " " + lines[i].strip()
                i += 1
            out.append("<ol>" + "".join(f"<li>{inline(b)}</li>" for b in buf) + "</ol>"); continue
        if ln.strip() == "---": out.append("<hr>"); i += 1; continue
        if not ln.strip(): i += 1; continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,3} |[-*] |\d+\. |\||>|```|---)', lines[i]):
            buf.append(lines[i]); i += 1
        if buf: out.append("<p>" + inline("\n".join(buf)).replace("\n", "<br>") + "</p>")
    return "\n".join(out)

src, dst = sys.argv[1], sys.argv[2]
title = sys.argv[3] if len(sys.argv) > 3 else "하이핀 설계문서"
compact = len(sys.argv) > 4 and sys.argv[4] == "compact"
md = io.open(src, encoding="utf-8").read()
body = convert(md)
# 첫 h1 다음의 h2를 부제로, 그다음 문단을 meta로 승격
body = re.sub(r'(</h1>)\s*<h2>(.*?)</h2>', r'\1<div class="sub1">\2</div>', body, count=1)
body = re.sub(r'(</div>)\s*<p>(작성[^<]*)</p>', r'\1<div class="meta">\2</div>', body, count=1)
css = CSS + (CSS_COMPACT if compact else "")
doc = f'<meta charset="utf-8"><title>{H.escape(title)}</title><style>{css}</style><div class="wrap">{body}</div>'
io.open(dst, "w", encoding="utf-8", newline="\n").write(doc)
print("OK " + str(len(doc)//1024) + "KB" + (" [compact]" if compact else ""))
