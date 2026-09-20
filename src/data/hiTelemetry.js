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
  /* via — 입력 채널 꼬리표("voice"|"text"). hiULog가 이미 넘기고 있었는데 여기서 버려지고 있었다.
     새 kind를 만들지 않는다(D9·hiEvents.js 가공 이벤트 금지) — 같은 신호를 채널로 갈라 볼 뿐이다.
     모르는 값은 담지 않는다. 채널을 '글자'로 단정해 버리면 미배선 화면이 글자 실적으로 둔갑한다. */
  if (e.via === "voice" || e.via === "text") ev.via = e.via;
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
  const out = { total: 0, byKind: {}, byAgent: {}, byLaw: {}, byU: {}, byVia: {}, viaLabeled: 0, raw: 0 };
  try {
    const l = JSON.parse(localStorage.getItem(TELEM_KEY) || "[]");
    out.total = l.length;
    for (const e of l) {
      out.byKind[e.kind] = (out.byKind[e.kind] || 0) + 1;
      if (e.agent) out.byAgent[e.agent] = (out.byAgent[e.agent] || 0) + 1;
      if (e.utype) out.byU[e.utype] = (out.byU[e.utype] || 0) + 1;
      if (e.via) { out.byVia[e.via] = (out.byVia[e.via] || 0) + 1; out.viaLabeled++; }
      for (const law of e.laws || []) out.byLaw[law] = (out.byLaw[law] || 0) + 1;
      if (e.raw) out.raw++;
    }
  } catch (e) {}
  return out;
}

/* ══════════ 채널 턴 대장(臺帳) — 음성 비중·미답변율·응답시간의 **원천** ══════════
   지금까지 채널 라벨은 「미답변이었을 때」만 남았다. 그것만으로는 음성 미답변'율'을 낼 수 없다 —
   분모(음성으로 몇 턴 물었나)가 어디에도 없기 때문이다. 없는 분모를 짐작해 비율을 쓰면
   그게 바로 가공 지표다(ops-console-phase-g: 집계는 원천과 일치).
   그래서 턴 한 건을 **채널·소요시간·답변여부** 세 가지로만 적는다.

   ⚠️ 담는 것 — 채널·밀리초·답변여부·시각. 그뿐이다.
      질문 원문도, 회원 식별자도, 인텐트도 담지 않는다(개인정보 최소 원칙 계승).
   ⚠️ ms는 **잰 값만** 적는다. 화면의 연출 대기(hidockWait)를 포함해 재든 엔진만 재든,
      재는 지점이 화면마다 다르면 비교가 무의미해지므로 호출부가 「회원이 기다린 시간」으로 통일한다.
   ⚠️ 호출부 — 답을 화면에 붙이는 순간 한 줄:
        telemTurn(via, Date.now() - t0, !!(res && res.matched))
      도크·전체화면 챗·쇼핑 상담 세 곳이 대상이며, 붙지 않은 화면은 대장에 없다(0으로 세지 않는다). */
const TELEM_TURN_KEY = "hifin_telem_turns";
const TELEM_TURN_CAP = 500;

function telemTurn(via, ms, hit) {
  try {
    const v = (via === "voice") ? "voice" : (via === "text") ? "text" : null;
    if (!v) return null;                                   /* 모르는 채널은 적지 않는다 */
    const n = Number(ms);
    const rec = { via: v, ms: isFinite(n) && n >= 0 ? Math.round(n) : null, hit: !!hit, ts: Date.now() };
    const l = JSON.parse(localStorage.getItem(TELEM_TURN_KEY) || "[]");
    l.push(rec);
    localStorage.setItem(TELEM_TURN_KEY, JSON.stringify(l.slice(-TELEM_TURN_CAP)));
    return rec;
  } catch (e) { return null; }
}
function telemTurnAll() { try { return JSON.parse(localStorage.getItem(TELEM_TURN_KEY) || "[]"); } catch (e) { return []; } }
function telemTurnClear() { try { localStorage.removeItem(TELEM_TURN_KEY); } catch (e) {} }

/* 채널 집계 — 세 원천을 **섞지 않고 나란히** 돌려준다.
   턴 대장(분모가 있는 곳)·미답변 로그(유형이 있는 곳)·완결 이벤트(퍼널이 있는 곳)는
   세는 대상이 서로 다르다. 하나로 합치면 보기 좋은 숫자가 나오지만 원천과 어긋난다. */
function telemChannelStats() {
  const mk = () => ({ turns: 0, hit: 0, miss: 0, missRate: null, avgMs: null, p95Ms: null, timed: 0 });
  const out = {
    turns: { voice: mk(), text: mk(), total: 0 },
    unanswered: { voice: 0, text: 0, total: 0 },          /* 원천: hifin_hi_unanswered(hiULog) */
    signals: { byVia: {}, labeled: 0, total: 0 },          /* 원천: hifin_telemetry */
    events: { voice: 0, text: 0, labeled: 0, total: 0 },   /* 원천: hifin_events(hiEvent) */
  };
  try {
    const ms = { voice: [], text: [] };
    for (const r of telemTurnAll()) {
      const b = out.turns[r.via]; if (!b) continue;
      b.turns++; out.turns.total++;
      if (r.hit) b.hit++; else b.miss++;
      if (typeof r.ms === "number") { ms[r.via].push(r.ms); b.timed++; }
    }
    for (const k of ["voice", "text"]) {
      const b = out.turns[k], a = ms[k].sort((x, y) => x - y);
      if (b.turns) b.missRate = Math.round(b.miss / b.turns * 1000) / 10;
      if (a.length) {
        b.avgMs = Math.round(a.reduce((s, x) => s + x, 0) / a.length);
        b.p95Ms = a[Math.min(a.length - 1, Math.ceil(a.length * 0.95) - 1)];
      }
    }
  } catch (e) {}
  try {
    const l = JSON.parse(localStorage.getItem("hifin_hi_unanswered") || "[]");
    for (const x of l) { const v = x && x.via; if (v === "voice" || v === "text") out.unanswered[v]++; out.unanswered.total++; }
  } catch (e) {}
  try { const s = telemSummary(); out.signals = { byVia: s.byVia, labeled: s.viaLabeled, total: s.total }; } catch (e) {}
  try {
    const ev = (typeof hiEventStats === "function") ? hiEventStats() : null;
    if (ev) out.events = { voice: ev.byChannel.voice, text: ev.byChannel.text, labeled: ev.labeled, total: ev.total };
  } catch (e) {}
  return out;
}

try { if (typeof window !== "undefined") { window.__hifinTelem = { push: telemPush, event: telemEvent, export: telemExport, clear: telemClear, count: telemCount, summary: telemSummary, turn: telemTurn, turns: telemTurnAll, turnClear: telemTurnClear, channels: telemChannelStats, key: TELEM_KEY, turnKey: TELEM_TURN_KEY, kinds: TELEM_KINDS }; } } catch (e) {}
