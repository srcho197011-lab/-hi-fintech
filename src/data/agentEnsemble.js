/* ══════════════ 협주(Ensemble) — 여러 전문가가 한 답을 함께 만든다 (Phase E) ══════════════
   전문가를 다섯 명 모아 놓고 한 번에 한 명만 부르면, 회원 입장에선 전문가가 한 명뿐인 것과 같다.
   "어머니 낙상하셨는데 보험 처리 되나요?"는 A4와 A2가 함께 답해야 하는 질문이다.

   파이프라인
     ① 판정(Detect)    — 남발 금지. 단독으로 충분한 질문은 반드시 단독으로 둔다.
     ② 분해(Decompose) — 담당별 조각을 나눠 준다(원문을 통째로 던지면 서로 같은 말을 한다)
     ③ 호출(Invoke)    — 각 에이전트가 **자기 가드를 통과한** 답을 낸다
     ④ 편성(Compose)   — 이어붙이기는 최악. 정렬·중복 제거·모순 조정·분량 예산·이음말
     ⑤ 가드(Guard)     — 합주가 만드는 새 위험(ensembleGuard)

   ⚠️ 협주는 **조립이지 생성이 아니다.**
   합성 중 새 문장을 만들면 그 문장은 어느 가드도 통과하지 않는다 — Phase B~D의 규제 통제가 한 줄로 무너진다.
   쓸 수 있는 문장은 ① 각 에이전트 가드를 통과한 원문과 ② 사전 검수된 이음말, 이 둘뿐이다. */

const ENS_ENABLED = true;          /* 끄면 기존 단일 경로와 100% 동일하게 동작해야 한다 */
const ENS_MAX_PARTS = 3;           /* 파트 상한 — 그 이상은 회원이 읽지 못한다 */
const ENS_MAX_LINES = 12;          /* 총 분량 상한(모바일에서 읽히는 길이) */
const ENS_PART_LINES = 6;          /* 파트당 상한 */

/* ── 분해·판정 패턴 테이블 ──
   한 항목이 "언제 협주인가(when)"와 "누구에게 무엇을 물을 것인가(parts)"를 함께 정의한다.
   코드에 if를 늘리지 않고 이 표만 늘린다.
   ⚠️ **구체적인 패턴을 먼저 둔다.** 먼저 걸린 것을 채택하므로, 일반 패턴이 앞에 있으면
   더 정확한 분해(더 좋은 파트 질문)를 가진 특수 패턴이 영영 안 걸린다. */
const ENS_PATTERNS = [
  { id: "vital-device-care", label: "수치 × 기기 × 돌봄",
    when: { A1: /(혈압|혈당|산소포화도|체온)/, A3: /(측정기|혈압계|혈당측정|기기|사야|준비)/, A4: /(어머니|아버지|부모님|할머니|할아버지|모시|돌봄)/ },
    parts: [
      { agent: "A1", role: "lead", ask: "이 수치는 어떻게 봐야 하나요?" },
      { agent: "A3", role: "support", ask: "가정용 측정기를 비교해 주세요." },
      { agent: "A4", role: "support", ask: "집에서 돌보려면 뭘 준비해야 하나요?" },
    ] },
  { id: "grade-silson", label: "장기요양 × 실손 중복",
    when: { A4: /(등급|장기요양|재가급여|요양원|시설급여)/, A2: /(중복|실손|보험이랑|보험과|같이\s*되|둘\s*다)/ },
    parts: [
      { agent: "A4", role: "lead", ask: "장기요양 급여는 어디까지 되나요?" },
      { agent: "A2", role: "support", ask: "실손 보장 어떻게 되나요?" },
    ] },
  { id: "care-insurance", label: "돌봄 × 보장",
    when: { A4: /(낙상|넘어지|간병|돌봄|요양|등급|방문요양|방문간호|주야간보호|거동|수발)/, A2: /(보험|보장|실손|청구|보험금|중복|치료비)/ },
    parts: [
      { agent: "A4", role: "lead", ask: "돌봄으로 뭘 준비해야 하나요?" },
      { agent: "A2", role: "support", ask: "보장 공백 분석하고 청구 준비 알려주세요." },
    ] },
  { id: "value-supplement", label: "수치 × 영양제",
    when: { A1: /(수치|검진|중성지방|콜레스테롤|간수치|혈당|혈압|빈혈|골밀도|고지혈)/, A3: /(먹어야|먹으면|영양제|보충제|뭘\s*먹|제품|성분|추천|비교)/ },
    parts: [
      { agent: "A1", role: "lead", ask: "이 수치는 어떤 의미인가요?" },
      { agent: "A3", role: "support", ask: "관리에 도움이 되는 제품을 비교해 주세요." },
    ] },
  { id: "disease-cost", label: "질환 × 치료비",
    when: { A1: /(진단|질환|당뇨|고혈압|암|뇌졸중|심장|간염|골절)/, A2: /(비용|치료비|얼마나\s*들|보장|보험|공백|본인부담)/ },
    parts: [
      { agent: "A1", role: "lead", ask: "이 질환은 앞으로 어떻게 관리하나요?" },
      { agent: "A2", role: "support", ask: "보장 공백 분석해 주세요." },
    ] },
  { id: "care-medical", label: "돌봄 × 의료",
    when: { A4: /(돌봄|간병|요양|거동|치매|욕창|방문간호)/, A1: /(증상|약|복용|수치|재활|퇴원)/ },
    parts: [
      { agent: "A1", role: "lead", ask: "의학적으로 어떻게 봐야 하나요?" },
      { agent: "A4", role: "support", ask: "집에서 돌보려면 뭘 준비해야 하나요?" },
    ] },
];

/* 이음말 — **사전 검수된 문장만** 쓴다(합성 중 생성 금지) */
const ENS_BRIDGE = {
  "A4>A2": "돌봄 준비와 별개로, 비용 쪽도 함께 봐드릴게요.",
  "A2>A4": "돌봄 준비는 이렇게 이어가시면 돼요.",
  "A1>A3": "그래서 뭘 챙기면 좋을지는 이렇게 정리돼요.",
  "A3>A1": "수치 쪽은 이렇게 보시면 돼요.",
  "A1>A2": "치료비 쪽은 이렇게 준비하시면 돼요.",
  "A2>A1": "건강 쪽은 이렇게 보시면 돼요.",
  "A1>A4": "집에서 돌보시는 준비는 이렇게 해두시면 좋아요.",
  "A4>A1": "건강 상태 쪽은 이렇게 보시면 돼요.",
  "A3>A4": "돌봄 준비도 함께 챙겨드릴게요.",
  "A4>A3": "필요한 물품은 이렇게 고르시면 돼요.",
  "A3>A2": "비용 쪽도 함께 봐드릴게요.",
  "A2>A3": "필요한 제품은 이렇게 고르시면 돼요.",
};
function ensBridge(from, to) { return ENS_BRIDGE[from + ">" + to] || null; }

/* 모순 조정 — 상충하면 **보수적인 쪽**을 남긴다(단정 vs 유보 → 유보) */
const ENS_CONFLICT = [
  { assert: /(보장(이\s*)?(돼요|됩니다)|받으실\s*수\s*있어요|지급됩니다)/, safe: /(심사|확정|약관|따라\s*달라)/ },
  { assert: /(무료(예요|입니다)|공짜)/, safe: /(본인부담|비용이\s*들|달라져요)/ },
  { assert: /(치료(가\s*)?(돼요|됩니다)|낫습니다)/, safe: /(도움을\s*줄\s*수|의약품이\s*아니)/ },
];

/* 파트별 금지 어휘 — support가 담당 밖으로 넘어가는 것을 막는다(경계 침범) */
const ENS_OUT_OF_LANE = {
  A1: /(최저가|장바구니|적립금\s*\d|구매하세요)/,
  A2: /(몇\s*등급(이에요|입니다)|진단(입니다|이에요))/,
  A3: /(정상\s*범위|수치\s*의미|하루\s*\d+\s*(정|알|캡슐)\s*드세요|진단(입니다|이에요))/,
  A4: /(보험금\s*(지급|나와요)|\d+\s*등급(이에요|입니다))/,
};

/* ── ① 판정 ──
   반환: { on:true, pattern, parts } | { on:false, why } */
function ensDetect(rawText, norm, route, ctx) {
  const off = function (why) { return { on: false, why: why }; };
  if (!ENS_ENABLED) return off("disabled");
  const q = String(rawText || "");
  if (q.length < 8) return off("too-short");                       /* 단일 지시는 단독 */

  /* 진행 중 순차 상담을 끊지 않는다 */
  try { if (typeof hiBranchLoad === "function" && hiBranchLoad()) return off("dialog-open"); } catch (e) {}

  /* 응급이면 협주하지 않는다 — 회원에게 필요한 건 '완전한 정보'가 아니라 **다음 행동 하나**다.
     여러 담당의 답을 붙이면 정작 해야 할 일이 문단 사이에 묻힌다(실측으로 확인한 실패).
     단, **배경 측정 경보(urgent)는 협주를 막지 않는다.** 혈압 경보가 켜져 있다고 해서
     중성지방 질문의 협주까지 꺼버리면, 무관한 경보 하나가 모든 답을 반토막 낸다(A4에서 이미 겪은 실수). */
  try {
    if (typeof hcTriage === "function") {
      let rpm = (ctx && ctx.rpm) || null;
      if (!rpm && typeof _a4Need === "function") { try { rpm = (_a4Need(ctx) || {}).rpm || null; } catch (e2) {} }
      const tri = hcTriage(q, { rpm: rpm });
      if (tri && (tri.via === "말" || tri.level === "critical")) return off("emergency-" + tri.level);
    }
  } catch (e) {}

  /* 패턴 매칭 — 도메인이 명시적으로 둘 이상 등장해야 한다 */
  let hit = null;
  for (const p of ENS_PATTERNS) {
    const ids = Object.keys(p.when);
    if (ids.every(function (id) { return p.when[id].test(q); })) { hit = p; break; }
  }
  if (!hit) return off("single-domain");

  /* 확인 사살 — 담당이 준비된(ready) 에이전트만 파트로 세운다 */
  const parts = hit.parts.filter(function (pt) {
    try { const A = (typeof hiAgent === "function") ? hiAgent(pt.agent) : null; return !!(A && A.ready && A.handler); } catch (e) { return false; }
  }).slice(0, ENS_MAX_PARTS);
  if (parts.length < 2) return off("not-enough-ready");

  return { on: true, pattern: hit.id, label: hit.label, parts: parts };
}

/* ── ②·③ 분해·호출 ── */
function ensInvoke(det, rawText, norm, ctx) {
  const out = [];
  for (const pt of det.parts) {
    /* 파트 질문 = **원문 + 담당 힌트**.
       힌트만 던지면 맥락이 사라진다("이 수치는 어떤 의미인가요?"만 받은 A1은 무슨 수치인지 모른다).
       원문만 던지면 서로 같은 말을 한다. 그래서 둘을 붙인다. */
    const ask = String(rawText || "") + " " + pt.ask;
    let r = null;
    try {
      r = (typeof agentInvoke === "function")
        ? agentInvoke(pt.agent, ask, Object.assign({}, ctx, { norm: ask, ensemble: true, route: { agent: pt.agent, reason: "ensemble" } }))
        : null;
    } catch (e) { r = null; }
    if (!r || !r.lines || !r.lines.length) continue;      /* 핸드백·무응답 파트는 버린다(재핸드백 금지) */
    out.push({ agent: pt.agent, role: pt.role, ask: ask, res: r });
  }
  return out;
}

/* 문장 정규화 — 중복 판정용(공백·문장부호·조사 꼬리 제거) */
function _ensNorm(s) {
  return String(s || "").replace(/\s+/g, "").replace(/[.,·—\-~!?()"'※]/g, "").replace(/(이에요|예요|입니다|해요|돼요|어요)$/, "");
}

/* ── ④ 편성 ── */
function ensCompose(parts) {
  /* 1. 안전 우선 정렬 — 응급 → lead → support */
  const sorted = parts.slice().sort(function (a, b) {
    const ea = a.res.emergency ? 2 : 0, eb = b.res.emergency ? 2 : 0;
    if (ea !== eb) return eb - ea;
    const ra = a.role === "lead" ? 1 : 0, rb = b.role === "lead" ? 1 : 0;
    return rb - ra;
  });

  const seen = new Set();
  const lines = [];
  const agents = [];
  const cite = [];
  const citeKey = new Set();
  const buttons = [];
  let conflictAdjusted = false;
  let prev = null;

  for (const p of sorted) {
    /* 파트 줄 — 중복 제거 + 파트 상한 */
    const own = [];
    for (const l of p.res.lines) {
      const k = _ensNorm(l);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      own.push(l);
      if (own.length >= ENS_PART_LINES) break;
    }
    if (!own.length) continue;

    /* 5. 이음말 — 화이트리스트에서만 */
    if (prev) {
      const b = ensBridge(prev, p.agent);
      if (b && lines.length + own.length + 1 <= ENS_MAX_LINES) lines.push(b);
    }
    for (const l of own) { if (lines.length < ENS_MAX_LINES) lines.push(l); }
    agents.push(p.agent);
    prev = p.agent;

    /* 6. 근거 통합 — 출처 중복 제거 */
    for (const c of (p.res.cite || [])) {
      const k = String(c.source || "") + "|" + String(c.title || "");
      if (citeKey.has(k)) continue;
      citeKey.add(k); cite.push(c);
    }
    /* 7. 버튼 통합 — 파트별 1개 우선 */
    const b0 = (p.res.buttons || [])[0];
    if (b0 && buttons.indexOf(b0) < 0) buttons.push(b0);
  }

  /* 3. 모순 조정 — 단정과 유보가 함께 있으면 단정을 버린다 */
  for (const c of ENS_CONFLICT) {
    const hasSafe = lines.some(function (l) { return c.safe.test(l); });
    if (!hasSafe) continue;
    const before = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (c.assert.test(lines[i]) && !c.safe.test(lines[i])) lines.splice(i, 1);
    }
    if (lines.length !== before) conflictAdjusted = true;
  }

  /* 버튼이 모자라면 파트의 두 번째 버튼으로 채운다(최대 3) */
  if (buttons.length < 3) {
    for (const p of sorted) {
      for (const b of (p.res.buttons || [])) {
        if (buttons.length >= 3) break;
        if (buttons.indexOf(b) < 0) buttons.push(b);
      }
    }
  }

  const emergency = sorted.reduce(function (acc, p) { return acc || p.res.emergency || null; }, null);
  return { lines: lines.slice(0, ENS_MAX_LINES), agents: agents, cite: cite.slice(0, 3), buttons: buttons.slice(0, 3),
    emergency: emergency, conflictAdjusted: conflictAdjusted,
    nav: (sorted[0] && sorted[0].res.nav) || null };
}

/* ── 진입점 ──
   반환: 협주 응답 | null(단독으로 두라는 뜻) */
function ensembleAnswer(rawText, norm, route, ctx) {
  try {
    const det = ensDetect(rawText, norm, route, ctx);
    if (!det.on) return null;
    const parts = ensInvoke(det, rawText, norm, ctx);
    if (parts.length < 2) return null;                    /* 억지 협주 금지 — 단독으로 강등 */
    const c = ensCompose(parts);
    if (!c.lines.length) return null;

    const g = (typeof ensembleGuard === "function")
      ? ensembleGuard(c, { parts: parts, question: rawText })
      : { lines: c.lines, violations: [] };
    if (g.blocked || !g.lines.length) return null;        /* 협주가 위험하면 단독으로 되돌린다 */

    try { if (typeof ensLog === "function") ensLog(rawText, det, g.violations); } catch (e) {}
    return { agent: c.agents[0], agents: c.agents, ensemble: det.pattern,
      lines: g.lines, cards: [], buttons: c.buttons, cite: c.cite, nav: c.nav,
      emergency: c.emergency, conflictAdjusted: c.conflictAdjusted, guard: g.violations,
      matched: "ENS-" + det.pattern };
  } catch (e) { return null; }
}

function ensLog(q, det, v) {
  try {
    const k = "hifin_ensemble";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(q || "").slice(0, 70), p: det.pattern, a: det.parts.map(function (x) { return x.agent; }), v: (v || []).map(function (x) { return x.id; }), ts: Date.now() });
  try { if (typeof telemPush === "function") telemPush("ensemble", q, { pattern: det.pattern, agents: det.parts.map(function (x) { return x.agent; }), laws: (v || []).map(function (x) { return "ENS:" + x.id; }) }); } catch (e2) {}   /* [Phase F] 텔레메트리 미러링 */
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}

try { if (typeof window !== "undefined") { window.__hifinEns = { answer: ensembleAnswer, detect: ensDetect, compose: ensCompose, patterns: ENS_PATTERNS, bridge: ENS_BRIDGE, enabled: ENS_ENABLED }; } } catch (e) {}
