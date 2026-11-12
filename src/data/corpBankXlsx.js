/* ══════════════════════════════════════════════════════════════════════════
   은행 엑셀 읽기 — 라이브러리를 더하지 않고 브라우저 내장 기능만 쓴다

   은행에서 내려받는 거래내역은 .xlsx 다. 이걸 읽자고 SheetJS 같은 라이브러리를
   CDN 에서 끌어오면 공개 배포본의 외부 의존이 하나 늘고 SRI 관리 대상이 하나 는다.
   xlsx 는 ZIP 안의 XML 이고, 압축 해제는 브라우저가 이미 할 줄 안다
   (DecompressionStream). 그래서 더하지 않고 읽는다.

   ⚠️ 층을 둘로 가른다 — 이게 이 파일의 설계 전부다.
     · **바이트 층**(cbxRead·cbxZip…) — async 이고 브라우저 전용이다.
       커밋 게이트 러너는 vm 컨텍스트라 DecompressionStream·TextDecoder 가 **없다**.
     · **표 층**(cbxShared·cbxSheet…) — 순수 동기, 문자열 들어가고 배열 나온다.
       러너가 **이 층을 직접 시험한다**. 검사할 수 있는 쪽에 판단을 모아 둔다.

   실제로 터졌던 함정을 여기 적어 둔다 — 다시 밟지 않으려고.
     ① 공유문자열에 `<si><t/></si>`(빈 문자열)가 섞여 있다. `<t>…</t>` 짝만 세는
        파서는 그 뒤가 한 칸씩 밀려, 조성래님 파일에서 **출금 1,320,000원이 매출로** 읽힌다.
     ② 빈 셀이 `<c r="J2" s="4"/>` 꼴 자기닫음으로 온다(조성래님 파일에 51개). 쌍 태그만
        찾는 파서는 이 칸을 흘려 열이 밀린다. 실제로 조사 중 한 파서가 이 함정에
        빠져 「J·K·L 은 셀이 없다」고 잘못 보고했다.
     ③ 목차(central directory)의 extra 길이와 로컬 머리의 extra 길이가 **다르다**.
        조성래님 파일은 목차가 0, 로컬이 520·264 다. 목차 값으로 시작점을 재면 520바이트
        앞을 가리켜 쓰레기를 푼다. **크기는 목차에서, 길이는 로컬 머리에서** 읽는다.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── ① XML 글자 되돌리기 ───────────────────────────────────────────────── */
function cbxUnesc(s) {
  return String(s == null ? "" : s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(+d); })
    .replace(/&amp;/g, "&");          /* & 는 **맨 끝에** — 먼저 풀면 &amp;lt; 가 < 가 된다 */
}

/* 한 덩이 안의 <t> 를 전부 이어 붙인다.
   ⚠️ <rPh>(한글 발음) 안의 <t> 는 글자가 아니라 발음이다 — 먼저 떼지 않으면
      「한국」이 「한국한국」이 된다. 그리고 <t/> 는 **빈 문자열이지 없는 것이 아니다**. */
function cbxJoinT(xml) {
  const body = String(xml || "").replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").replace(/<rPh\b[^>]*\/>/g, "");
  let out = "";
  const re = /<t\b([^>]*?)(\/>|>([\s\S]*?)<\/t>)/g;
  let m;
  while ((m = re.exec(body))) out += m[1] && m[2] === "/>" ? "" : cbxUnesc(m[3] || "");
  return out;
}

/* ── ② 공유문자열 ─────────────────────────────────────────────────────────
   돌려주는 것에 **선언된 개수**(uniqueCount)를 함께 담는다. 읽어 낸 수가 그와
   다르면 한 칸 밀린 것이고, 밀린 표는 틀린 계정으로 전표를 만든다. 세어 본다. */
function cbxShared(xml) {
  const s = String(xml || "");
  const out = [];
  const re = /<si\b([^>]*?)(\/>|>([\s\S]*?)<\/si>)/g;
  let m;
  while ((m = re.exec(s))) out.push(m[2] === "/>" ? "" : cbxJoinT(m[3] || ""));
  const u = /uniqueCount="(\d+)"/.exec(s);
  return { list: out, declared: u ? +u[1] : null, ok: !u || +u[1] === out.length };
}

/* ── ③ 열 이름 → 자리 ─────────────────────────────────────────────────────
   A→0 · Z→25 · AA→26 · AB→27. 셀이 생략되든 자기닫음이든, 자리는 r 이 말해 준다.
   순서를 세어 자리를 맞추면 한 칸만 흘려도 표 전체가 밀린다. */
function cbxColIdx(ref) {
  const m = /^([A-Z]+)/.exec(String(ref || "").toUpperCase());
  if (!m) return -1;
  let n = 0;
  for (let i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
  return n - 1;
}
function cbxRowIdx(ref) {
  const m = /(\d+)$/.exec(String(ref || ""));
  return m ? +m[1] - 1 : -1;
}

/* ── ④ 셀 한 칸 ───────────────────────────────────────────────────────────
   t 속성이 글자의 종류를 말한다. 모르는 종류는 **지어내지 않고** 빈칸으로 둔다. */
function cbxCell(attrs, inner, shared) {
  const t = (/\bt="([^"]*)"/.exec(attrs || "") || [])[1] || "n";
  const body = inner || "";
  if (t === "inlineStr") return cbxJoinT((/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body) || [])[1] || body);
  const v = (/<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body) || [])[1];
  if (v === undefined) return "";
  if (t === "s") {
    const i = +cbxUnesc(v);
    const L = (shared && shared.list) || [];
    return i >= 0 && i < L.length ? L[i] : "";
  }
  if (t === "b") return cbxUnesc(v) === "1" ? "TRUE" : "FALSE";
  /* str(수식 결과) · e(오류값) · d(ISO 날짜) · n(숫자) 은 글자 그대로 넘긴다.
     오류값 #REF! 도 지우지 않는다 — 지우면 빈칸으로 보여 사람이 못 알아챈다. */
  return cbxUnesc(v);
}

/* ── ⑤ 시트 → 표 ─────────────────────────────────────────────────────────
   행 번호도 r 에서 복원한다. 빈 행은 통째로 생략될 수 있는데, 순서로 세면
   사람이 엑셀에서 보는 행 번호와 어긋나 「몇 행이 틀렸습니다」가 거짓말이 된다. */
function cbxSheet(xml, shared) {
  const s = String(xml || "");
  const rows = [];
  let maxCol = 0;
  const rre = /<row\b([^>]*?)(\/>|>([\s\S]*?)<\/row>)/g;
  let rm, seq = 0;
  while ((rm = rre.exec(s))) {
    const rattr = rm[1] || "";
    const rno = (/\br="(\d+)"/.exec(rattr) || [])[1];
    const ri = rno ? +rno - 1 : seq;
    seq = ri + 1;
    const body = rm[2] === "/>" ? "" : (rm[3] || "");
    const cells = [];
    const cre = /<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g;
    let cm, cseq = 0;
    while ((cm = cre.exec(body))) {
      const cattr = cm[1] || "";
      const ref = (/\br="([A-Z]+\d+)"/.exec(cattr) || [])[1];
      const ci = ref ? cbxColIdx(ref) : cseq;
      cseq = ci + 1;
      if (ci < 0) continue;
      while (cells.length < ci) cells.push("");
      cells[ci] = cm[2] === "/>" ? "" : cbxCell(cattr, cm[3] || "", shared);
      if (ci + 1 > maxCol) maxCol = ci + 1;
    }
    while (rows.length < ri) rows.push([]);
    rows[ri] = cells;
  }
  rows.forEach(function (r) { while (r.length < maxCol) r.push(""); });
  return rows;
}

/* ── ⑥ 자기시험 표본 ───────────────────────────────────────────────────────
   러너가 이 층을 직접 돌린다. 표본에 **실제로 터졌던 꼴**을 전부 넣는다 —
   하나라도 빼면 그 길은 분모 0 이고, 분모 0 은 통과가 아니다. */
const CBX_T_SS =
  '<?xml version="1.0"?><sst xmlns="x" count="9" uniqueCount="7">'
  + "<si><t>머리</t></si>"
  + "<si><t/></si>"                                              /* 빈 문자열 — 여기서 밀린다 */
  + '<si><t>분류</t><phoneticPr fontId="1"/></si>'               /* <t> 뒤 형제 노드 */
  + "<si><rPh sb=\"0\" eb=\"2\"><t>발음</t></rPh><t>글자</t></si>" /* 발음은 글자가 아니다 */
  + "<si><r><t>리치</t></r><r><t>텍스트</t></r></si>"              /* 이어 붙인다 */
  + '<si><t xml:space="preserve">뒤공백 </t></si>'
  + "<si><t>&lt;꺾쇠&gt; &amp;amp;</t></si>"                      /* 글자 되돌리기 */
  + "</sst>";
const CBX_T_SHEET =
  '<?xml version="1.0"?><worksheet><sheetData>'
  + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>2</v></c><c r="C1" t="s"><v>5</v></c></row>'
  + '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" s="4"/><c r="C2"><v>1200000</v></c></row>'
  + '<row r="4"><c r="A4" t="s"><v>3</v></c><c r="C4" t="inlineStr"><is><t>인라인</t></is></c></row>'
  + '<row r="5"><c r="B5" t="s"><v>6</v></c><c r="C5" t="s"><v>1</v></c></row>'
  + "</sheetData></worksheet>";

/* 돌려주는 것에 n(분모)을 담는다 — 「통과」만 세면 아무것도 안 돈 것과 구별되지 않는다 */
function cbxSelfTest() {
  const ss = cbxShared(CBX_T_SS);
  const rows = cbxSheet(CBX_T_SHEET, ss);
  const r = function (i, j) { return (rows[i] || [])[j]; };
  return [
    { k: "ss", ko: "공유문자열 개수 = 선언된 개수", n: ss.list.length,
      ok: ss.ok && ss.list.length === 7, got: ss.list.length + " / " + ss.declared, want: "같을 것" },
    { k: "empty", ko: "빈 문자열도 한 자리를 차지한다", n: 1,
      ok: ss.list[1] === "" && ss.list[2] === "분류",
      got: JSON.stringify([ss.list[1], ss.list[2]]), want: '["","분류"]' },
    { k: "rph", ko: "발음은 글자가 아니다", n: 1,
      ok: ss.list[3] === "글자", got: ss.list[3], want: "글자" },
    { k: "rich", ko: "리치텍스트는 이어 붙인다", n: 1,
      ok: ss.list[4] === "리치텍스트", got: ss.list[4], want: "리치텍스트" },
    { k: "space", ko: "뒤 공백을 보존한다", n: 1,
      ok: ss.list[5] === "뒤공백 ", got: JSON.stringify(ss.list[5]), want: '"뒤공백 "' },
    { k: "esc", ko: "꺾쇠·앰퍼샌드를 되돌린다", n: 1,
      ok: ss.list[6] === "<꺾쇠> &amp;", got: ss.list[6], want: "<꺾쇠> &amp;" },
    { k: "selfclose", ko: "자기닫는 빈 셀이 자리를 지킨다", n: 1,
      ok: r(1, 1) === "" && r(1, 2) === "1200000",
      got: JSON.stringify([r(1, 1), r(1, 2)]), want: '["","1200000"]' },
    { k: "gap", ko: "생략된 셀의 자리를 r 로 복원한다", n: 1,
      ok: r(3, 0) === "글자" && r(3, 1) === "" && r(3, 2) === "인라인",
      got: JSON.stringify(rows[3]), want: '["글자","","인라인"]' },
    { k: "rowgap", ko: "건너뛴 행 번호를 지킨다(3행은 비어 있다)", n: rows.length,
      ok: rows.length === 5 && (rows[2] || []).join("") === "",
      got: rows.length + "행 · 3행 " + JSON.stringify(rows[2]), want: "5행 · 3행 빈칸" },
    { k: "inline", ko: "인라인 문자열을 읽는다", n: 1,
      ok: r(3, 2) === "인라인", got: r(3, 2), want: "인라인" },
    { k: "width", ko: "모든 행의 칸 수가 같다", n: rows.length,
      ok: rows.every(function (x) { return x.length === 3; }),
      got: rows.map(function (x) { return x.length; }).join(","), want: "전부 3" },
  ];
}

/* ══════════════════════════════════════════════════════════════════════════
   바이트 층 — 여기부터는 브라우저에서만 돈다
   ══════════════════════════════════════════════════════════════════════════ */

/* 쓸 수 있는지 **실제로 만들어 본다.** typeof 로 끝내면 있는데 막힌 경우를 놓친다.
   그리고 못 쓰면 **파일을 고르기 전에** 말한다 — 고르고 나서 0건이 되면
   사람은 파일을 의심하지 시스템을 의심하지 않는다. */
function cbxCan() {
  try {
    if (typeof DecompressionStream !== "function") return { ok: false, why: "이 브라우저는 압축 해제 기능(DecompressionStream)을 갖고 있지 않습니다" };
    new DecompressionStream("deflate-raw");
    if (typeof TextDecoder !== "function") return { ok: false, why: "이 브라우저는 글자 해독 기능(TextDecoder)을 갖고 있지 않습니다" };
    return { ok: true, why: "" };
  } catch (e) {
    return { ok: false, why: "이 브라우저에서 압축 해제 기능을 쓸 수 없습니다 — 엑셀을 CSV로 저장해 올려 주세요" };
  }
}

const CBX_MAX_MB = 40;                 /* 풀린 크기 상한 — 작게 눌러 담은 파일(압축 폭탄) 방어 */

function cbxU16(b, i) { return b[i] | (b[i + 1] << 8); }
function cbxU32(b, i) { return ((b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)) + b[i + 3] * 16777216); }

/* ZIP 목차 — 끝에서 EOCD 를 찾아 거기서부터 읽는다.
   앞에서 순차로 걷지 않는 이유: 압축 크기를 뒤(data descriptor)에 적는 파일이 있어
   순차 걷기가 불가능하고, 우리는 네 조각만 꺼내면 되므로 전수 걷기가 애초에 낭비다. */
function cbxEntries(b) {
  let eo = -1;
  const low = Math.max(0, b.length - 66000);
  for (let i = b.length - 22; i >= low; i--) {
    if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 0x05 && b[i + 3] === 0x06) { eo = i; break; }
  }
  if (eo < 0) throw new Error("엑셀 파일의 끝(ZIP 목차)을 찾지 못했습니다 — 파일이 잘렸거나 엑셀이 아닙니다");
  const n = cbxU16(b, eo + 10);
  let p = cbxU32(b, eo + 16);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (b[p] !== 0x50 || b[p + 1] !== 0x4b || b[p + 2] !== 0x01 || b[p + 3] !== 0x02) break;
    const nlen = cbxU16(b, p + 28), elen = cbxU16(b, p + 30), clen = cbxU16(b, p + 32);
    out.push({
      name: new TextDecoder("utf-8").decode(b.subarray(p + 46, p + 46 + nlen)),
      method: cbxU16(b, p + 10), csize: cbxU32(b, p + 20), usize: cbxU32(b, p + 24),
      lho: cbxU32(b, p + 42),
    });
    p += 46 + nlen + elen + clen;
  }
  return out;
}

/* 한 조각 꺼내기 — **크기는 목차에서, 이름·extra 길이는 로컬 머리에서.**
   목차의 extra 길이를 믿으면 조성래님 파일에서 264바이트 앞을 가리켜 쓰레기를 푼다. */
async function cbxEntryText(b, e) {
  const o = e.lho;
  if (b[o] !== 0x50 || b[o + 1] !== 0x4b || b[o + 2] !== 0x03 || b[o + 3] !== 0x04) {
    throw new Error("엑셀 안의 「" + e.name + "」를 찾지 못했습니다 — 파일이 깨졌습니다");
  }
  const nlen = cbxU16(b, o + 26), elen = cbxU16(b, o + 28);
  const start = o + 30 + nlen + elen;
  const raw = b.subarray(start, start + e.csize);
  if (e.usize > CBX_MAX_MB * 1048576) throw new Error("엑셀 안의 내용이 너무 큽니다(" + Math.round(e.usize / 1048576) + "MB)");
  let bytes;
  if (e.method === 0) bytes = raw;
  else if (e.method === 8) {
    const ds = new DecompressionStream("deflate-raw");
    const ab = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
    bytes = new Uint8Array(ab);
  } else throw new Error("엑셀이 모르는 방식으로 압축되어 있습니다(method " + e.method + ")");
  /* 푼 것이 정말 XML 인가 — 오프셋이 틀리면 여기서 걸린다. 조용히 빈 표가 되지 않는다. */
  if (!(bytes[0] === 0x3c && (bytes[1] === 0x3f || bytes[1] === 0x45 || bytes[1] === 0x77 || bytes[1] === 0x73))) {
    throw new Error("엑셀 안의 「" + e.name + "」를 풀었지만 내용이 XML이 아닙니다 — 읽기를 멈춥니다");
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/* 시트 목록 — 이름과 파일을 r:id 로 잇는다. sheetId 로 이으면 틀린 시트를 연다. */
function cbxSheetList(wbXml, relXml) {
  const rel = {};
  const rre = /<Relationship\b([^>]*)\/>/g;
  let m;
  while ((m = rre.exec(String(relXml || "")))) {
    const id = (/\bId="([^"]+)"/.exec(m[1]) || [])[1];
    let t = (/\bTarget="([^"]+)"/.exec(m[1]) || [])[1];
    if (!id || !t) continue;
    t = t.replace(/^\//, "").replace(/^xl\//, "");
    rel[id] = "xl/" + t;
  }
  const out = [];
  const sre = /<sheet\b([^>]*)\/>/g;
  while ((m = sre.exec(String(wbXml || "")))) {
    const nm = (/\bname="([^"]*)"/.exec(m[1]) || [])[1];
    const rid = (/\br:id="([^"]+)"/.exec(m[1]) || /\bid="([^"]+)"/.exec(m[1]) || [])[1];
    out.push({ name: cbxUnesc(nm || ""), path: rel[rid] || "" });
  }
  return out;
}

/* 파일 하나 읽기 — 시트 이름과 표를 돌려준다. 시트가 여럿이면 **사람이 고른다.** */
async function cbxRead(file, pickName) {
  const can = cbxCan();
  if (!can.ok) throw new Error(can.why);
  const b = new Uint8Array(await file.arrayBuffer());
  if (!(b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04)) {
    if (b[0] === 0xd0 && b[1] === 0xcf) throw new Error("구형 엑셀(.xls)은 읽지 못합니다 — 엑셀에서 「다른 이름으로 저장 → .xlsx」로 바꿔 주세요");
    throw new Error("엑셀(.xlsx) 파일이 아닙니다");
  }
  const ents = cbxEntries(b);
  const total = ents.reduce(function (n, e) { return n + e.usize; }, 0);
  if (total > CBX_MAX_MB * 1048576) throw new Error("엑셀을 풀면 " + Math.round(total / 1048576) + "MB 입니다 — 상한 " + CBX_MAX_MB + "MB");
  const find = function (n) { return ents.find(function (e) { return e.name === n; }); };
  const wbE = find("xl/workbook.xml"), relE = find("xl/_rels/workbook.xml.rels");
  let sheets = [];
  if (wbE && relE) sheets = cbxSheetList(await cbxEntryText(b, wbE), await cbxEntryText(b, relE));
  sheets = sheets.filter(function (s) { return s.path && find(s.path); });
  if (!sheets.length) {
    const s1 = find("xl/worksheets/sheet1.xml");
    if (!s1) throw new Error("엑셀 안에서 시트를 찾지 못했습니다");
    sheets = [{ name: "sheet1", path: "xl/worksheets/sheet1.xml" }];
  }
  const ssE = find("xl/sharedStrings.xml");
  const ss = ssE ? cbxShared(await cbxEntryText(b, ssE)) : { list: [], declared: null, ok: true };
  if (!ss.ok) throw new Error("엑셀의 글자표가 선언된 개수(" + ss.declared + ")와 다릅니다(" + ss.list.length + ") — 한 칸씩 밀려 읽힐 수 있어 멈춥니다");
  const pick = (pickName && sheets.find(function (s) { return s.name === pickName; })) || sheets[0];
  const rows = cbxSheet(await cbxEntryText(b, find(pick.path)), ss);
  return { sheet: pick.name, sheets: sheets.map(function (s) { return s.name; }), rows: rows, shared: ss.list.length };
}
