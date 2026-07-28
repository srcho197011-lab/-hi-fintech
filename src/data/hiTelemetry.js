/* ══════════════ 텔레메트리 — 흩어진 신호를 한 스키마로 (Phase F) ══════════════
   지금까지 신호는 6곳에 각자 형식으로 쌓이고만 있었다. 읽는 사람도, 읽는 길도 없었다.
   여기서 **하나의 이벤트 스키마**로 모아, 수확 → 증분 → 게이트로 이어지는 학습 루프의 입구를 만든다.

   ⚠️ 개인정보 최소(1단계 원칙 계승)
   기본은 **원문 미저장**이다. 정규화 문장(qn)과 해시(qh)만 남긴다.
   회원 식별자는 남기지 않는다. 상태는 세그먼트 코드만.
   원문은 개발 모드(hifin_telem_raw=1)에서만 담기고, **원문 없이도 루프 전체가 돌아가야 한다.**

   ⚠️ 무회귀 — 기존 6개 로그는 그대로 둔다. 여기로는 **미러링**만 한다.
   기존 로그가 깨지면 운영 콘솔·백서 로그가 함께 깨진다. */

const TELEM_KEY = "hifin_telemetry";
const TELEM_CAP = 2000;                    /* 로컬 보관 상한 — 오래된 것부터 버린다 */
const TELEM_KINDS = ["unanswered", "miss", "route", "guard", "ensemble", "handback"];

/* 원문 저장 여부 — 기본 꺼짐. 개발 중 재현이 필요할 때만 켠다. */
function telemRawOn() {
  try { return localStorage.getItem("hifin_telem_raw") === "1"; } catch (e) { return false; }
}

/* 질문 → 정규화 문장. 라우터·NLU와 같은 어휘 정규화를 쓴다(수확 결과가 런타임과 어긋나지 않도록). */
function telemNorm(q) {
  const s = String(q || "").trim();
  if (!s) return "";
  try { if (typeof lexNormalize === "function") return String(lexNormalize(s)).toLowerCase(); } catch (e) {}
  return s.toLowerCase();
}

/* 해시 — 원문을 저장하지 않고도 '같은 질문'을 묶기 위한 키(FNV-1a 32bit) */
function telemHash(s) {
  let h = 0x811c9dc5;
  const t = String(s || "");
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
  return ("00000000" + h.toString(16)).slice(-8);
}

/* 번들 판(版) — 어느 배포에서 난 신호인지. 회귀 전후 비교의 기준이 된다. */
function telemVer() {
  try {
    const el = document.querySelector('link[href*="app.css?v="]');
    const m = el && el.getAttribute("href").match(/v=([a-f0-9]+)/);
    return m ? m[1] : "dev";
  } catch (e) { return "dev"; }
}

/* 회원 상태 — **세그먼트 코드만**. 식별자·수치는 담지 않는다. */
function telemSeg(ctx) {
  try {
    const s = (ctx && (ctx.seg || ctx.matched)) || null;
    if (typeof s === "string" && /^(SEG-|BRANCH-|ENS-|U\d)/.test(s)) return s;
  } catch (e) {}
  return null;
}

/* ── 이벤트 생성 — 순수 함수(Node 스크립트도 같은 함수를 쓴다) ── */
function telemEvent(kind, q, extra) {
  const qn = telemNorm(q);
  const ev = {
    ts: Date.now(),
    kind: TELEM_KINDS.indexOf(kind) >= 0 ? kind : "miss",
    qh: telemHash(qn),
    qn: qn.slice(0, 120),
    ver: telemVer(),
  };
  const e = extra || {};
  if (e.agent) ev.agent = e.agent;
  if (e.agents) ev.agents = e.agents;
  if (e.pattern) ev.pattern = e.pattern;
  if (e.reason) ev.reason = e.reason;
  if (e.utype) ev.utype = e.utype;
  if (e.laws && e.laws.length) ev.laws = e.laws;
  if (e.to) ev.to = e.to;
  const seg = telemSeg(e);
  if (seg) ev.seg = seg;
  if (telemRawOn() && q) ev.raw = String(q).slice(0, 140);   /* 개발 모드에서만 */
  return ev;
}

function telemPush(kind, q, extra) {
  try {
    const ev = telemEvent(kind, q, extra);
    const l = JSON.parse(localStorage.getItem(TELEM_KEY) || "[]");
    l.push(ev);
    localStorage.setItem(TELEM_KEY, JSON.stringify(l.slice(-TELEM_CAP)));
    return ev;
  } catch (e) { return null; }
}

/* 내보내기 — 브라우저에서 모은 신호를 학습 루프(Node)로 넘길 때 쓴다(JSONL) */
function telemExport() {
  try { return JSON.parse(localStorage.getItem(TELEM_KEY) || "[]").map(function (e) { return JSON.stringify(e); }).join("\n"); } catch (e) { return ""; }
}
function telemClear() { try { localStorage.removeItem(TELEM_KEY); } catch (e) {} }
function telemCount() { try { return JSON.parse(localStorage.getItem(TELEM_KEY) || "[]").length; } catch (e) { return 0; } }

/* 요약 — 운영 콘솔·드리프트가 읽는 집계(원문 없이도 산출된다) */
function telemSummary() {
  const out = { total: 0, byKind: {}, byAgent: {}, byLaw: {}, byU: {}, raw: 0 };
  try {
    const l = JSON.parse(localStorage.getItem(TELEM_KEY) || "[]");
    out.total = l.length;
    for (const e of l) {
      out.byKind[e.kind] = (out.byKind[e.kind] || 0) + 1;
      if (e.agent) out.byAgent[e.agent] = (out.byAgent[e.agent] || 0) + 1;
      if (e.utype) out.byU[e.utype] = (out.byU[e.utype] || 0) + 1;
      for (const law of e.laws || []) out.byLaw[law] = (out.byLaw[law] || 0) + 1;
      if (e.raw) out.raw++;
    }
  } catch (e) {}
  return out;
}

try { if (typeof window !== "undefined") { window.__hifinTelem = { push: telemPush, event: telemEvent, export: telemExport, clear: telemClear, count: telemCount, summary: telemSummary, key: TELEM_KEY, kinds: TELEM_KINDS }; } } catch (e) {}
