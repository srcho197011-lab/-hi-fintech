/* ══════════════ 자료실 — 저장소 자료 대장(corpVault.js) · CorpOps (형 지시 2026-11-12) ══════════════
   회사 자료 저장소의 **목차**를 게시한다. 재무제표확인원 · 장부 · 은행 내역 · 법인 서류 · 계약 · 보고서.

   ⚠️ 이 화면이 드는 것은 **목록이지 파일이 아니다.**
      서버가 없어 브라우저가 로컬 파일을 열지 못한다. 그래서 「무엇이 어디에 있는지」까지만 든다 —
      경로를 복사해 탐색기에 붙이면 열린다. 열어 주는 척하지 않는다.

   ⚠️ 목록도 **코드에 박지 않는다.** 파일명이 곧 회사 자료의 목차라, 공개 배포본에 실리면
      대외비 저장소의 목차를 공개하는 셈이다. 목록은 반입해서 **이 브라우저에만** 둔다.
      코드에는 분류 체계와 조회 엔진만 둔다.

   ⚠️ **분류는 여기서만 한다.** 스캔 스크립트는 파일명·경로·크기·날짜 같은 사실만 내보내고
      종류 판정은 이 파일이 한다. 두 곳에서 분류하면 규칙이 갈라지고, 갈라진 줄도 모른다. */

const CORP_VAULT_KEY = "hifin_corp_vault";   /* dataCatalog.js 등재 필수 — 자료 대장 */
const CORP_VAULT_ROOT = "바탕화면 \\ 0.HI-fin 온톨로지하네스";

/* ── ① 부서 — 저장소 폴더와 조직도를 잇는다 ────────────────────────── */
const CORP_VAULT_DEPT = [
  { k: "01", ko: "경영기획", team: "M1" },
  { k: "02", ko: "회계", team: "M2" },
  { k: "03", ko: "인사총무", team: "M3" },
  { k: "04", ko: "헬스케어", team: "H1" },
  { k: "05", ko: "보험", team: "H2" },
  { k: "06", ko: "마케팅", team: "K1" },
  { k: "07", ko: "데이터", team: "D1" },
  { k: "08", ko: "보안", team: "S1" },
];
function corpVaultDept(rel) {
  const m = /^(\d{2})\./.exec(String(rel || "").replace(/\\/g, "/").split("/")[0] || "");
  return m ? (CORP_VAULT_DEPT.find((d) => d.k === m[1]) || null) : null;
}

/* ── ② 종류 — 파일명으로 판정한다. 규칙을 이름을 대고 적는다 ───────────
   pat  파일명 또는 경로에 이 낱말이 있으면 그 종류다. 위에서부터 먼저 걸리는 것이 이긴다.
   cls  문서 분류(CORP_DOC_CLASS)와 잇는 자리 — 보존기한이 거기서 온다.
   key  **확정 자료**. 세무사 날인본·원본처럼 다른 자료가 이것을 따라야 하는 것. */
const CORP_VAULT_KIND = [
  { k: "fsconf", ko: "재무제표확인원", cls: "fs", key: true,
    pat: ["재무제표확인", "FS_", "재무제표확인원"], d: "세무사 날인 확정본 — 다른 자료가 이것을 따른다" },
  { k: "fs", ko: "재무제표", cls: "fs", pat: ["재무제표"], d: "작업본 · 분기 가결산" },
  { k: "tax", ko: "세무", cls: "tax", pat: ["세무조정", "부가세", "세금계산서", "eTaxInvoice", "RIS"], d: "신고·조정 자료" },
  { k: "bank", ko: "은행 거래내역", cls: "acct", pat: ["거래내역", "은행", "grid_exceldata", "법인이용내역"], d: "계좌·카드 내역" },
  { k: "book", ko: "장부", cls: "acct", pat: ["총계정", "매출매입장", "거래내역서"], d: "총계정원장 · 매출매입장" },
  { k: "corp", ko: "법인 서류", cls: "corp", key: true,
    pat: ["사업자등록", "주주명부", "정관", "주식등변동", "등기"], d: "영구 보존 대상" },
  { k: "ct", ko: "계약", cls: "contract", pat: ["계약", "제안서", "협약"], d: "계약서 · 제안" },
  /* 보고·IR 과 기타는 **법정 보존기한이 정해진 분류가 아니다** — cls 를 비워 「분류 미정」으로 둔다.
     없는 분류를 지어 붙이면 보존기한이 있는 것처럼 보인다. */
  { k: "ir", ko: "보고·IR", cls: "", pat: ["IR", "회사안내", "회사소개", "보고", "요약", "설명서", "평가서", "검토"], d: "대외 제출·내부 보고" },
  { k: "etc", ko: "기타", cls: "", pat: [], d: "분류되지 않음" },
];
function corpVaultKind(name, rel) {
  const s = (String(name || "") + " " + String(rel || "")).toLowerCase();
  for (let i = 0; i < CORP_VAULT_KIND.length; i++) {
    const K = CORP_VAULT_KIND[i];
    if (!K.pat.length) continue;
    for (let j = 0; j < K.pat.length; j++) {
      if (s.indexOf(String(K.pat[j]).toLowerCase()) >= 0) return K;
    }
  }
  return CORP_VAULT_KIND[CORP_VAULT_KIND.length - 1];
}
/* 어느 법인 것인가 — 저장소에 두 법인 자료가 섞여 있다. 섞으면 장부가 오염된다. */
const CORP_VAULT_ENTITY = [
  { k: "hgc", ko: "하이젠케어(주)", pat: ["하이젠케어", "HiZenCare", "HGC", "HF_", "HiFin"] },
  { k: "gpf", ko: "글로벌예방금융(주)", pat: ["글로벌예방금융", "예방금융", "글로벌"] },
];
function corpVaultEntity(name, rel) {
  const s = (String(name || "") + " " + String(rel || "")).toLowerCase();
  for (let i = 0; i < CORP_VAULT_ENTITY.length; i++) {
    const E = CORP_VAULT_ENTITY[i];
    for (let j = 0; j < E.pat.length; j++) {
      if (s.indexOf(String(E.pat[j]).toLowerCase()) >= 0) return E;
    }
  }
  return null;
}

/* ── ③ 저장 ──────────────────────────────────────────────────────── */
function corpVaultRead() {
  const empty = { v: 1, at: "", list: [] };
  try {
    const raw = localStorage.getItem(CORP_VAULT_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, at: typeof o.at === "string" ? o.at : "", list: Array.isArray(o.list) ? o.list : [] };
  } catch (e) { return empty; }
}
function corpVaultWrite(st) {
  try { localStorage.setItem(CORP_VAULT_KEY, JSON.stringify({ v: 1, at: st.at || "", list: st.list || [] })); return true; }
  catch (e) { return false; }
}
/* 반입된 줄에 분류를 입힌다 — 저장할 때가 아니라 **읽을 때** 한다.
   규칙이 바뀌면 다시 올리지 않아도 분류가 따라온다. */
function corpVaultRows(st) {
  return ((st && st.list) || []).map((r) => {
    const K = corpVaultKind(r.name, r.rel);
    const D = corpVaultDept(r.rel);
    const E = corpVaultEntity(r.name, r.rel);
    const C = (typeof CORP_DOC_CLASS !== "undefined") ? CORP_DOC_CLASS.find((x) => x.k === K.cls) : null;
    return Object.assign({}, r, {
      kind: K.k, kindKo: K.ko, key: !!K.key,
      dept: D ? D.ko : "(루트)", team: D ? D.team : "",
      ent: E ? E.ko : "", entK: E ? E.k : "",
      cls: C ? C.ko : "", years: C ? C.years : null, checked: C ? C.checked : false,
      keep: C && typeof corpKeepSet === "function" && corpKeepSet(C) ? C.keep : null,
      keepKo: C && typeof corpKeepKo === "function" ? corpKeepKo(C) : "미정",
      dispose: C && typeof corpDisposeAt === "function" ? corpDisposeAt(r.at, C) : "",
    });
  });
}

/* ── ④ 조회 ──────────────────────────────────────────────────────── */
function corpVaultFind(rows, q) {
  const Q = q || {};
  const kw = String(Q.q || "").trim().toLowerCase();
  const all = rows || [];
  const hit = all.filter((r) => {
    if (Q.dept && r.dept !== Q.dept) return false;
    if (Q.kind && r.kind !== Q.kind) return false;
    if (Q.ent && r.entK !== Q.ent) return false;
    if (Q.key && !r.key) return false;
    if (!kw) return true;
    return String(r.name || "").toLowerCase().indexOf(kw) >= 0
      || String(r.rel || "").toLowerCase().indexOf(kw) >= 0
      || String(r.kindKo || "").toLowerCase().indexOf(kw) >= 0;
  });
  return { rows: hit, n: hit.length, all: all.length,
    mb: Math.round(hit.reduce((n, r) => n + (+r.size || 0), 0) / 1048576 * 10) / 10 };
}
function corpVaultStats(rows) {
  const byKind = {}, byDept = {}, byEnt = {};
  (rows || []).forEach((r) => {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    byDept[r.dept] = (byDept[r.dept] || 0) + 1;
    if (r.entK) byEnt[r.entK] = (byEnt[r.entK] || 0) + 1;
  });
  return { n: (rows || []).length, byKind: byKind, byDept: byDept, byEnt: byEnt,
    key: (rows || []).filter((r) => r.key).length,
    mb: Math.round((rows || []).reduce((n, r) => n + (+r.size || 0), 0) / 1048576 * 10) / 10 };
}
/* 탐색기에 붙여 넣을 전체 경로 — 열어 주는 척하지 않고 **찾아갈 길**을 준다 */
function corpVaultPath(r) { return CORP_VAULT_ROOT + " \\ " + String((r && r.rel) || "").replace(/\//g, " \\ "); }

/* ── ④-2 팀별 — 게시판은 **팀마다** 선다 ──────────────────────────
   저장소 폴더(01~08)가 곧 팀이다. 팀 보드에서는 그 팀 자료만 보이고,
   총괄 자료실에서는 전사가 보인다. 같은 함수가 인자만 달리 받는다. */
function corpVaultOfTeam(rows, team) {
  if (!team) return rows || [];
  return (rows || []).filter((r) => r.team === team);
}
/* 팀마다 몇 건인지 — 0건인 팀을 숨기지 않는다. 숨기면 「아직 안 올렸다」가 안 보인다. */
function corpVaultByTeam(rows) {
  const out = {};
  CORP_VAULT_DEPT.forEach((d) => { out[d.team] = { dept: d, n: 0, mb: 0 }; });
  (rows || []).forEach((r) => {
    if (!out[r.team]) return;
    out[r.team].n += 1;
    out[r.team].mb += (+r.size || 0);
  });
  Object.keys(out).forEach((k) => { out[k].mb = Math.round(out[k].mb / 1048576 * 10) / 10; });
  return out;
}
/* 그 팀 자료를 올릴 자리 — 없으면 어디에 만들어야 하는지 말해 준다 */
function corpVaultFolder(team) {
  const d = CORP_VAULT_DEPT.find((x) => x.team === team);
  return d ? (d.k + "." + d.ko) : "";
}

/* ── ⑤ 단언 — 화면과 러너가 같은 함수를 부른다 ─────────────────── */
function corpVaultVerdict(st) {
  const rows = corpVaultRows(st);
  const kinds = CORP_VAULT_KIND;
  const noPat = kinds.filter((k) => k.k !== "etc" && !k.pat.length);
  const noD = kinds.filter((k) => !(k.d || "").trim());
  const badCls = kinds.filter((k) => k.cls && typeof CORP_DOC_CLASS !== "undefined" && !CORP_DOC_CLASS.some((c) => c.k === k.cls));
  /* 분류기 자기시험 — 규칙이 오타로 죽어도 「전부 기타」는 조용히 통과한다 */
  const probe = [
    ["HF_하이젠케어_재무제표확인원26.10.23.pdf", "02.회계/2026.결산/26.09", "fsconf", "hgc"],
    ["거래내역(신한,202607~202609)_.xlsx", "02.회계/2026.결산", "bank", null],
    ["주주명부(글로벌예방금융).hwp", "02.회계/2025.결산", "corp", "gpf"],
    ["0.하이젠케어 총계정장.xlsx", "02.회계/2026.결산/26.06", "book", "hgc"],
    ["아무개.txt", "99.없음", "etc", null],
  ];
  const miss = probe.filter((p) => corpVaultKind(p[0], p[1]).k !== p[2]);
  const missE = probe.filter((p) => {
    const e = corpVaultEntity(p[0], p[1]);
    return (e ? e.k : null) !== p[3];
  });
  const noDept = rows.filter((r) => r.dept === "(루트)");

  return [
    { k: "kind", ko: "자료 종류 정의", n: kinds.length, ok: noPat.length === 0 && noD.length === 0, got: kinds.length + "종", want: "규칙·설명 전건" },
    { k: "cls", ko: "종류마다 문서 분류 연결", n: kinds.length, ok: badCls.length === 0, got: badCls.length + "건 밖", want: "0건" },
    { k: "self", ko: "분류기 자기시험", n: probe.length, ok: miss.length === 0, got: miss.length + "건 오분류", want: "0건" },
    { k: "ent", ko: "법인 판별 자기시험", n: probe.length, ok: missE.length === 0, got: missE.length + "건 오판", want: "0건" },
    { k: "ent2", ko: "두 법인을 가른다", n: CORP_VAULT_ENTITY.length, ok: CORP_VAULT_ENTITY.length >= 2, got: CORP_VAULT_ENTITY.map((e) => e.ko).join(" · "), want: "≥ 2" },
    { k: "dept", ko: "부서 ↔ 조직도 연결", n: CORP_VAULT_DEPT.length, ok: CORP_VAULT_DEPT.every((d) => d.team), got: CORP_VAULT_DEPT.length + "부서", want: "팀 코드 전건" },
    { k: "find", ko: "조회 — 전건 찾을 수 있음", n: rows.length + 1, ok: corpVaultFind(rows, {}).n === rows.length, got: corpVaultFind(rows, {}).n + " / " + rows.length, want: "전건" },
    { k: "list", ko: "자료 대장 반입 여부", n: 1, ok: true, got: rows.length ? rows.length + "건 · " + corpVaultStats(rows).mb + "MB" : "미반입", want: "반입하면 채워집니다" },
    { k: "root", ko: "목록만 들고 파일은 들지 않는다", n: 1, ok: rows.every((r) => !r.body && !r.content), got: "경로·크기·날짜만", want: "본문 0건" },
    { k: "team", ko: "팀마다 자기 자료만", n: CORP_VAULT_DEPT.length,
      ok: CORP_VAULT_DEPT.every((d) => corpVaultOfTeam(rows, d.team).every((r) => r.team === d.team)),
      got: Object.keys(corpVaultByTeam(rows)).map((t) => t + ":" + corpVaultByTeam(rows)[t].n).join(" "), want: "섞이지 않음" },
    { k: "teamsum", ko: "팀별 합 = 전체(부서 밖 제외)", n: CORP_VAULT_DEPT.length,
      ok: CORP_VAULT_DEPT.reduce((n, d) => n + corpVaultOfTeam(rows, d.team).length, 0) === rows.filter((r) => r.team).length,
      got: CORP_VAULT_DEPT.reduce((n, d) => n + corpVaultOfTeam(rows, d.team).length, 0) + " / " + rows.filter((r) => r.team).length, want: "일치" },
  ];
}
function corpVaultPass(st) {
  const rows = corpVaultVerdict(st);
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
