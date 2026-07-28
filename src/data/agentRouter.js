/* ══════════════ 에이전트 라우터 — 이 질문을 누가 받을 것인가(Phase A) ══════════════
   판정 순서(코드로 강제):
     ① 진행 중 대화 소유권 — 순차 상담 등 대화 컨트롤러가 열려 있으면 그 소유자 유지(중간 가로채기 금지)
     ② 명시 호출 — "주치의한테 물어봐", "보험 상담" 등 회원이 담당을 지목
     ③ 스코프 규칙 — agentRegistry의 words/deny 가중 점수
     ④ 분류기 — hiClassify 인텐트 접두 → 담당(검증된 61 인텐트 기준)
     ⑤ 기본값 A0
   ⚠️ 무회귀 원칙: 라우터는 기존 파이프라인을 대체하지 않고 **앞에 선다**. A0면 지금까지와 100% 동일 경로. */

/* 명시 호출 — 회원이 담당자를 직접 부르는 표현 */
const HI_CALL_BY_NAME = [
  { id: "A1", re: /(주치의|의사선생|의사한테|닥터|의료진)/ },
  { id: "A2", re: /(보험상담|보험담당|설계사|보험사에|보장상담)/ },
  { id: "A3", re: /(쇼핑상담|제품상담|쇼핑담당|성분상담)/ },
  { id: "A4", re: /(돌봄상담|간병상담|돌봄담당|요양상담)/ },
  { id: "A0", re: /(하이야|하이한테|매니저한테)/ },
];

/* 스코프 점수 — 긴 키워드일수록 판별력이 높다(부분문자열 오탐 억제) */
function _hiScopeScore(agent, t) {
  const sc = agent.scope || {};
  let hit = 0;
  for (const w of (sc.words || [])) { const wn = String(w).toLowerCase(); if (wn.length >= 2 && t.indexOf(wn) >= 0) hit = Math.max(hit, wn.length); }
  if (!hit) return 0;
  let deny = 0;
  for (const w of (sc.deny || [])) { const wn = String(w).toLowerCase(); if (t.indexOf(wn) >= 0) deny = Math.max(deny, wn.length); }
  return hit - deny;   // 상대 도메인 어휘가 더 길게 걸리면 점수가 깎여 그쪽으로 넘어간다
}

/* ── 진입점 ──
   반환: { agent, reason, confidence, byIntent } */
function agentRoute(rawText, norm, snap, ctx) {
  const t = String(norm || rawText || "").toLowerCase();
  const raw = String(rawText || "");

  /* ① 진행 중 대화 소유권 — 순차 상담(검진 이력)이 열려 있으면 하이가 계속 진행.
        다만 대화와 무관한 강한 도메인 질문(점수 4 이상)은 담당 전문가에게 넘긴다(대화에 회원을 가두지 않는다). */
  try {
    if (typeof hiBranchLoad === "function" && hiBranchLoad()) {
      let strong = null;
      for (const a of HI_AGENTS) {
        if (a.id === "A0") continue;
        const s = _hiScopeScore(a, t);
        if (s >= 3 && (!strong || s > strong.s)) strong = { id: a.id, s: s };
      }
      if (!strong) return { agent: "A0", reason: "dialog-ownership", confidence: 1 };
      return { agent: strong.id, reason: "dialog-interrupt", confidence: 0.85 };
    }
  } catch (e) {}

  /* ② 명시 호출 */
  for (const c of HI_CALL_BY_NAME) { if (c.re.test(raw)) return { agent: c.id, reason: "called-by-name", confidence: 1 }; }

  /* ③ 스코프 규칙 — 전문 에이전트만 경합(A0는 기본값이므로 점수 경쟁에서 제외) */
  let best = null;
  try {
    for (const a of HI_AGENTS) {
      if (a.id === "A0") continue;
      const s = _hiScopeScore(a, t);
      if (s > 0 && (!best || s > best.s)) best = { id: a.id, s: s };
    }
  } catch (e) {}

  /* ④ 분류기 — 검증된 인텐트가 있으면 그 접두로 담당을 정한다(스코프보다 신뢰도 높음) */
  let byIntent = null;
  try {
    if (typeof hiClassify === "function") {
      const cls = hiClassify(rawText, norm);
      if (cls && cls.best && cls.conf >= 0.45) byIntent = cls.best.it.id;
    }
  } catch (e) {}
  const intentAgent = byIntent ? hiAgentOf(byIntent) : null;

  /* A0 스코프(예약·지갑·데이터 등)가 명시적으로 걸리면 전문 에이전트 점수를 무시할지 판단 */
  let a0Score = 0;
  try { a0Score = _hiScopeScore(hiAgent("A0"), t); } catch (e) {}

  if (intentAgent && intentAgent !== "A0") {
    /* 인텐트가 전문 도메인을 가리키면 그대로 채택(단, 더 긴 다른 도메인 어휘가 있으면 그쪽 우선) */
    if (best && best.id !== intentAgent && best.s >= 3) return { agent: best.id, reason: "scope-override", confidence: 0.8, byIntent };
    return { agent: intentAgent, reason: "intent", confidence: 0.9, byIntent };
  }
  if (best && best.s >= 2 && best.s > a0Score) return { agent: best.id, reason: "scope", confidence: 0.75, byIntent };   // 동점이면 기본 담당(A0)
  if (intentAgent === "A0") return { agent: "A0", reason: "intent", confidence: 0.9, byIntent };

  /* ⑤ 기본값 */
  return { agent: "A0", reason: "default", confidence: 0.5, byIntent };
}

/* 라우팅 로그(하네스·운영 콘솔) — 질문 100자와 판정 근거만, 상태 원데이터 저장 금지 */
function agentRouteLog(q, route) {
  try {
    const k = "hifin_agent_route";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(q).slice(0, 100), a: route.agent, r: route.reason, ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-300)));
  } catch (e) {}
}
function agentRouteReport(days) {
  try {
    const since = Date.now() - (days || 7) * 86400000;
    const l = JSON.parse(localStorage.getItem("hifin_agent_route") || "[]").filter((x) => x.ts >= since);
    const byAgent = {}, byReason = {};
    l.forEach((x) => { byAgent[x.a] = (byAgent[x.a] || 0) + 1; byReason[x.r] = (byReason[x.r] || 0) + 1; });
    return { total: l.length, byAgent, byReason };
  } catch (e) { return { total: 0, byAgent: {}, byReason: {} }; }
}

try { if (typeof window !== "undefined") { window.__hifinRouter = { route: agentRoute, report: agentRouteReport }; } } catch (e) {}
