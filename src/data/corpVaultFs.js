/* ══════════════════════════════════════════════════════════════════════════
   저장소 폴더 잇기 — 형이 올려 두면 앱이 거기서 가져온다

   형 지시(2026-11-12): 「저장소에 조회를 해서 가져오도록 하면 되잖아.
   저장소에 내가 올려 놓으면 되잖아.」

   브라우저는 바탕화면을 마음대로 뒤지지 못한다. 그런데 **형이 한 번 폴더를 지정**해 주면
   그 뒤로는 그 안을 읽을 수 있다. 그래서 이 파일이 하는 일은 셋이다 —
   폴더를 한 번 잇고 · 그 권한을 기억하고 · 그 안을 훑어 목록과 파일을 가져온다.

   ⚠️ 이 파일이 지키는 것 —

   ① **기계가 「가장 새 파일」을 고르지 않는다.** 저장소의 은행 내역 18건은 이름 꼴이
      열 가지로 갈려 있고, **수정일로 고르면 9월 파일이 뽑힌다**(실측 — 9월 파일의 수정일이
      11월 파일보다 18분 늦다). 파일명 날짜·폴더·수정일 셋이 실제로 어긋난다. 그래서
      **전건을 늘어놓고 형이 고른다.** 기계가 고르면 틀린 달의 장부를 세운다.

   ② **핸들은 IndexedDB 에만 둔다.** localStorage 에 넣으면 조용히
      「[object FileSystemDirectoryHandle]」 로 썩는다(실측). 되돌릴 수 없다.

   ③ **못 하는 브라우저에서는 못 한다고 말한다.** 사파리·파이어폭스·아이폰은 이 길이 없다.
      조용히 0건이 되면 사람은 폴더를 의심하지 시스템을 의심하지 않는다.

   ④ **층을 가른다.** 폴더를 여는 일은 브라우저 전용이라 커밋 게이트가 돌리지 못한다.
      그래서 판단(목록을 자료실 행으로 바꾸기 · 고르기 · 거르기)은 전부 **순수 함수**에 두고,
      러너가 그 쪽을 직접 시험한다. 검사할 수 없는 쪽에 판단을 두면 검사가 없는 것과 같다.
   ══════════════════════════════════════════════════════════════════════════ */

const CORP_VFS_DB = "hifin_corp_vaultfs";     /* IndexedDB 이름 — localStorage 가 아니다 */
const CORP_VFS_STORE = "handle";
const CORP_VFS_KEY = "root";
const CORP_VFS_MAXFILES = 5000;               /* 한 번에 훑는 상한 — 멈추지 않는 순회를 막는다 */
const CORP_VFS_SKIPDIR = ["__pycache__", ".git", "node_modules", "$RECYCLE.BIN"];
const CORP_VFS_SKIPPRE = ["~$", "."];         /* 엑셀 임시 파일 · 숨김 */

/* ── ① 할 수 있는가 — **실제로 만들어 본다** ────────────────────────────
   typeof 로 끝내면 있는데 막힌 경우를 놓친다. 그리고 못 하면 **고르기 전에** 말한다. */
function cvfCan() {
  try {
    if (typeof window === "undefined") return { ok: false, why: "브라우저가 아닙니다" };
    if (!window.isSecureContext) return { ok: false, why: "안전한 주소(https 또는 localhost)에서만 폴더를 읽을 수 있습니다" };
    if (typeof window.showDirectoryPicker !== "function") {
      return { ok: false, why: "이 브라우저는 폴더 잇기를 지원하지 않습니다 — 크롬이나 엣지에서 열어 주세요(사파리 · 파이어폭스 · 아이폰은 이 길이 없습니다)" };
    }
    if (!window.indexedDB) return { ok: false, why: "이 브라우저가 폴더 권한을 기억할 자리(IndexedDB)를 주지 않습니다" };
    return { ok: true, why: "" };
  } catch (e) {
    return { ok: false, why: "이 브라우저에서 폴더를 읽을 수 없습니다 — 파일을 하나씩 올려 주세요" };
  }
}

/* ── ② 권한을 기억하는 자리 ──────────────────────────────────────────────
   ⚠️ localStorage 가 아니라 IndexedDB 다. 핸들은 구조화 복제가 되는 객체라
      문자열 저장소에 넣으면 되돌릴 수 없게 뭉개진다(실측). */
function cvfOpenDb() {
  return new Promise(function (res, rej) {
    try {
      const r = indexedDB.open(CORP_VFS_DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(CORP_VFS_STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error || new Error("폴더 권한 저장소를 열지 못했습니다")); };
    } catch (e) { rej(e); }
  });
}
function cvfDbPut(key, val) {
  return cvfOpenDb().then(function (db) {
    return new Promise(function (res, rej) {
      const tx = db.transaction(CORP_VFS_STORE, "readwrite");
      tx.objectStore(CORP_VFS_STORE).put(val, key);
      tx.oncomplete = function () { db.close(); res(true); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    });
  });
}
function cvfDbGet(key) {
  return cvfOpenDb().then(function (db) {
    return new Promise(function (res, rej) {
      const tx = db.transaction(CORP_VFS_STORE, "readonly");
      const q = tx.objectStore(CORP_VFS_STORE).get(key);
      q.onsuccess = function () { db.close(); res(q.result || null); };
      q.onerror = function () { db.close(); rej(q.error); };
    });
  });
}
function cvfDbDel(key) {
  return cvfOpenDb().then(function (db) {
    return new Promise(function (res) {
      const tx = db.transaction(CORP_VFS_STORE, "readwrite");
      tx.objectStore(CORP_VFS_STORE).delete(key);
      tx.oncomplete = function () { db.close(); res(true); };
      tx.onerror = function () { db.close(); res(false); };
    });
  });
}

/* ── ③ 폴더 잇기 · 권한 ──────────────────────────────────────────────────
   ⚠️ 폴더 고르기 창은 **사람이 누를 때만** 뜬다(브라우저 규칙). 저절로 띄울 수 없다 —
      그래서 이 기능은 「버튼 한 번」이지 「저절로」가 아니다. 그렇게 적는다. */
async function cvfPick() {
  const can = cvfCan();
  if (!can.ok) throw new Error(can.why);
  let h;
  try {
    h = await window.showDirectoryPicker({ id: "hifinVault", mode: "read" });
  } catch (e) {
    if (e && e.name === "AbortError") throw new Error("폴더를 고르지 않으셨습니다");
    throw new Error("폴더를 열지 못했습니다 — 바탕화면 자체는 고를 수 없습니다. 저장소 폴더를 직접 골라 주세요");
  }
  await cvfDbPut(CORP_VFS_KEY, h);
  return h;
}
async function cvfHandle() {
  const can = cvfCan();
  if (!can.ok) return null;
  try { return await cvfDbGet(CORP_VFS_KEY); } catch (e) { return null; }
}
/* 권한 상태 — 묻지 않고 **보기만** 한다. 물으려면 사람이 누른 직후여야 한다. */
async function cvfPerm(h, ask) {
  if (!h || typeof h.queryPermission !== "function") return "none";
  try {
    let s = await h.queryPermission({ mode: "read" });
    if (s === "granted") return "granted";
    if (!ask) return s;
    s = await h.requestPermission({ mode: "read" });
    return s;
  } catch (e) { return "error"; }
}
async function cvfForget() { await cvfDbDel(CORP_VFS_KEY); return true; }

/* ── ④ 훑기 — 사실만 모은다 ──────────────────────────────────────────────
   종류·법인 판별은 **화면(corpVault.js)이 한다.** 여기서 또 하면 규칙이 두 벌이 되고,
   갈라진 줄도 모른다. gen_vault_index.py 가 적어 둔 것과 같은 사상이다. */
async function cvfScan(h, onTick) {
  if (!h) throw new Error("이어 둔 폴더가 없습니다");
  const perm = await cvfPerm(h, false);
  if (perm !== "granted") throw new Error("폴더를 읽을 권한이 없습니다 — 「폴더 다시 잇기」를 눌러 주세요");
  const rows = [];
  let cut = false;
  async function walk(dir, rel) {
    if (cut) return;
    for await (const ent of dir.values()) {
      if (cut) return;
      const nm = ent.name;
      if (CORP_VFS_SKIPPRE.some(function (p) { return nm.indexOf(p) === 0; })) continue;
      if (ent.kind === "directory") {
        if (CORP_VFS_SKIPDIR.indexOf(nm) >= 0) continue;
        await walk(ent, rel ? rel + "/" + nm : nm);
        continue;
      }
      if (rows.length >= CORP_VFS_MAXFILES) { cut = true; return; }
      let size = 0, at = "";
      try {
        const f = await ent.getFile();
        size = f.size;
        at = cvfDay(f.lastModified);
      } catch (e) {
        /* OneDrive 가 내용을 아직 안 내려받았거나 파일이 잠겼다 — **빼지 않고 적는다** */
        rows.push({ rel: rel ? rel + "/" + nm : nm, name: nm, dir: rel, size: 0, at: "", ext: cvfExt(nm), unread: true });
        if (typeof onTick === "function") onTick(rows.length);
        continue;
      }
      rows.push({ rel: rel ? rel + "/" + nm : nm, name: nm, dir: rel, size: size, at: at, ext: cvfExt(nm) });
      if (typeof onTick === "function") onTick(rows.length);
    }
  }
  await walk(h, "");
  rows.sort(function (a, b) { return a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0; });
  return { root: h.name || "", rows: rows, n: rows.length, cut: cut,
    unread: rows.filter(function (r) { return r.unread; }).length,
    bytes: rows.reduce(function (n, r) { return n + (+r.size || 0); }, 0) };
}
function cvfExt(nm) {
  const m = /\.([A-Za-z0-9]+)$/.exec(String(nm || ""));
  return m ? m[1].toLowerCase() : "";
}
/* 수정일을 **현지 날짜**로 — UTC 로 세면 한국 자정~오전 9시에 어제가 된다 */
function cvfDay(ms) {
  if (!isFinite(ms)) return "";
  const d = new Date(+ms);
  const p = function (n) { return String(n).padStart(2, "0"); };
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

/* ── ⑤ 파일 하나 꺼내기 ────────────────────────────────────────────────── */
async function cvfFile(h, rel) {
  if (!h) throw new Error("이어 둔 폴더가 없습니다");
  const parts = String(rel || "").split("/").filter(Boolean);
  if (!parts.length) throw new Error("파일 경로가 비었습니다");
  let dir = h;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i]);
  }
  const fh = await dir.getFileHandle(parts[parts.length - 1]);
  const f = await fh.getFile();
  if (!f || !f.size) throw new Error("「" + parts[parts.length - 1] + "」의 내용을 읽지 못했습니다 — OneDrive 가 아직 내려받지 않았을 수 있습니다(파일을 한 번 열어 내려받은 뒤 다시 해 주세요)");
  return f;
}

/* ══════════════════════════════════════════════════════════════════════════
   여기부터는 **순수 함수** — 러너가 직접 시험한다
   ══════════════════════════════════════════════════════════════════════════ */

/* ── ⑥ 고를 만한 파일 추리기 ────────────────────────────────────────────
   ⚠️ **고르지 않는다. 늘어놓기만 한다.** 이게 이 파일에서 제일 중요한 규약이다.
      저장소의 은행 내역은 이름 꼴이 열 가지로 갈려 있고 수정일이 파일명 날짜와 어긋난다 —
      「가장 새 것」을 기계가 집으면 틀린 달의 장부를 세운다(실측으로 9월 파일이 뽑혔다). */
function cvfBankCandidates(rows, kindOf) {
  const K = typeof kindOf === "function" ? kindOf : (typeof corpVaultKind === "function" ? corpVaultKind : null);
  const ok = ["xlsx", "xls", "csv"];
  const hit = (rows || []).filter(function (r) {
    if (ok.indexOf(r.ext) < 0) return false;
    if (!K) return true;
    const k = K(r.name, r.dir);
    return k && (k.k === "bank" || k.k === "book");
  });
  /* 보기 좋으라고 **이름 순**으로 세운다 — 수정일 순으로 세우면 그게 곧 「최신 추천」이 된다 */
  hit.sort(function (a, b) { return a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0; });
  return { rows: hit, n: hit.length, all: (rows || []).length };
}
/* 파일명에 적힌 날짜 — **있으면** 적어 준다. 없으면 없다고 둔다(수정일로 메우지 않는다). */
function cvfNameDate(nm) {
  const s = String(nm || "");
  let m = /(20\d{2})[-._/]?(\d{2})[-._/]?(\d{2})/.exec(s);
  if (m) return { iso: m[1] + "-" + m[2] + "-" + m[3], from: "파일명" };
  m = /\((\d{1,2})[.\-/](\d{1,2})\)/.exec(s);                 /* (11.11) 꼴 */
  if (m) return { iso: "", md: m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0"), from: "파일명(연도 없음)" };
  return { iso: "", from: "" };
}
/* 한 줄을 사람이 고를 수 있게 — 수정일과 파일명 날짜가 **어긋나면 그렇게 적는다** */
function cvfPickRow(r) {
  const nd = cvfNameDate(r.name);
  const mismatch = !!(nd.iso && r.at && nd.iso !== r.at);
  return {
    rel: r.rel, name: r.name, dir: r.dir, size: r.size, at: r.at, ext: r.ext,
    nameDate: nd.iso || (nd.md ? "(" + nd.md + ")" : ""), from: nd.from,
    mismatch: mismatch,
    why: mismatch ? "파일명의 날짜(" + nd.iso + ")와 수정일(" + r.at + ")이 다릅니다 — 어느 달 것인지 보고 고르세요" : "",
    unread: !!r.unread,
  };
}

/* ── ⑦ 검산 — 화면과 커밋 게이트 러너가 같은 함수를 본다 ────────────────
   ⚠️ 「목록을 잘 만든다」만 세면 안 된다. **고르지 않는다**는 것도 세야 한다. */
const CORP_VFS_T = [
  { rel: "02.회계/2026.결산/26.11/거래내역_표본 (11.11).xlsx", name: "거래내역_표본 (11.11).xlsx", dir: "02.회계/2026.결산/26.11", size: 10828, at: "2026-11-12", ext: "xlsx" },
  { rel: "02.회계/2026.결산/26.09/거래내역_표본(09.30).xlsx", name: "거래내역_표본(09.30).xlsx", dir: "02.회계/2026.결산/26.09", size: 9000, at: "2026-11-12", ext: "xlsx" },
  { rel: "02.회계/2026.결산/우리_표본 20260709.xlsx", name: "우리_표본 20260709.xlsx", dir: "02.회계/2026.결산", size: 8000, at: "2026-10-01", ext: "xlsx" },
  { rel: "01.경영기획/회사안내_표본.pdf", name: "회사안내_표본.pdf", dir: "01.경영기획", size: 3000, at: "2026-10-14", ext: "pdf" },
];
function cvfSelfTest() {
  const C = cvfBankCandidates(CORP_VFS_T, function (nm) { return /거래내역|우리/.test(nm) ? { k: "bank" } : { k: "etc" }; });
  const rows = C.rows.map(cvfPickRow);
  const nd = cvfNameDate("우리_표본 20260709.xlsx");
  const md = cvfNameDate("거래내역_표본 (11.11).xlsx");
  const src = typeof cvfBankCandidates === "function" ? String(cvfBankCandidates) : "";
  return [
    { k: "pick", ko: "고를 만한 파일만 추린다", n: CORP_VFS_T.length,
      ok: C.n === 3, got: C.n + " / " + C.all, want: "3 / 4" },
    { k: "order", ko: "**수정일 순으로 세우지 않는다**(그게 곧 「최신 추천」이 된다)", n: C.n,
      ok: /a\.rel < b\.rel/.test(src) && !/lastModified|\.at\b.*sort|sort.*\.at\b/.test(src),
      got: "이름 순", want: "이름 순" },
    { k: "nolatest", ko: "기계가 **하나를 고르지 않는다**", n: C.n,
      ok: C.rows.length > 1 && !C.pick && !C.latest && !C.best,
      got: "전건 " + C.n + "줄", want: "고르지 않음" },
    { k: "namedate", ko: "파일명에 적힌 날짜를 읽는다", n: 2,
      ok: nd.iso === "2026-07-09" && md.iso === "" && md.md === "11-11",
      got: nd.iso + " / " + (md.md || md.iso), want: "2026-07-09 / 11-11" },
    { k: "guess", ko: "연도 없는 날짜를 **지어내지 않는다**", n: 1,
      ok: md.iso === "" && /연도 없음/.test(md.from || ""), got: JSON.stringify(md), want: "연도 비움" },
    { k: "mismatch", ko: "파일명 날짜와 수정일이 어긋나면 적는다", n: rows.length,
      ok: rows.some(function (r) { return r.mismatch && (r.why || "").trim(); }),
      got: rows.filter(function (r) { return r.mismatch; }).length + "건 표시", want: "≥ 1건" },
    { k: "same", ko: "수정일이 같아도 서로 다른 달 파일을 가르지 않는다(사람이 고른다)", n: 2,
      ok: CORP_VFS_T[0].at === CORP_VFS_T[1].at && C.rows.filter(function (r) { return r.at === "2026-11-12"; }).length === 2,
      got: "같은 수정일 2건 모두 남김", want: "둘 다 남김" },
    { k: "ext", ko: "확장자를 소문자로 읽는다", n: 3,
      ok: cvfExt("큰글자_표본.XLSX") === "xlsx" && cvfExt("섞인글자_표본.Pdf") === "pdf" && cvfExt("확장자없음") === "",
      got: [cvfExt("큰글자_표본.XLSX"), cvfExt("섞인글자_표본.Pdf"), cvfExt("확장자없음")].join(" "), want: "xlsx pdf (빈칸)" },
    { k: "day", ko: "수정일을 **현지 날짜**로 센다(자정~오전 9시에 어제가 되지 않게)", n: 1,
      ok: cvfDay(Date.parse("2026-11-12T01:00:00+09:00")) === "2026-11-12",
      got: cvfDay(Date.parse("2026-11-12T01:00:00+09:00")), want: "2026-11-12" },
    { k: "store", ko: "권한을 **IndexedDB** 에 둔다(문자열 저장소에 넣으면 뭉개진다)", n: 1,
      ok: CORP_VFS_DB.length > 0 && typeof cvfDbPut === "function" && typeof cvfDbGet === "function",
      got: CORP_VFS_DB, want: "IndexedDB" },
    { k: "cap", ko: "훑기에 상한이 있다(멈추지 않는 순회를 막는다)", n: 1,
      ok: CORP_VFS_MAXFILES > 0, got: CORP_VFS_MAXFILES + "개", want: "> 0" },
  ];
}
function cvfVerdict() {
  const rows = cvfSelfTest();
  const zero = rows.filter(function (r) { return !(r.n > 0); });
  const fail = rows.filter(function (r) { return !r.ok; });
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
