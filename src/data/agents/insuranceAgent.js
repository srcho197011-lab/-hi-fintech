/* ══════════════ A2 · 보험·치료비 에이전트 (Phase B) ══════════════
   원칙: **계산은 툴이 하고, 설명은 근거로 하며, 결정은 회원이 한다.**
     ① 계산 결과 — TOOL_RUN·insuranceStats 반환값만 인용(모든 금액·비율은 calc에 기록 → 하네스가 대조)
     ② 지식 근거 — INS_KB(약관)·SILSON_SPEC(세대)·CLAIM_DENY(부지급)·코호트에서 검색해 cite로 표기
     ③ 행동 안내 — 회원이 스스로 할 다음 단계. 결정을 대신하지 않는다.
   담당 밖(질환·수치 해석 A1 / 예약·데이터 연결 A0 / 제품 A3 / 돌봄 A4)은 핸드백.
   모든 응답은 insuranceGuard(헌법 5조)를 통과해야 나간다. */

/* ── 범위 밖 판정 → 담당 이전 ── */
const A2_TO_A1 = /(무슨\s*병|질환이|증상|아픈\s*이유|수치가\s*무슨|수치\s*의미|해석해|생체나이|노화속도|약\s*(부작용|복용)|치료\s*방법|관리법|병원\s*가야|약\s*먹어야|진료\s*받아야|(당뇨|고혈압|고지혈|지방간|빈혈|암)\s*(맞지|맞나|인가|일까|이야|인지))/;
const A2_TO_A0 = /(검진\s*예약|예약해\s*줘|센터\s*찾|데이터\s*연결|결과지\s*올리|업로드|적립금|충전|초대|로그인|비밀번호)/;
const A2_TO_A3 = /(영양제|보충제|제품\s*추천|구매|주문|배송|최저가|기기\s*사)/;
const A2_TO_A4 = /(간병|돌봄|방문간호|방문요양|요양등급|장기요양|요양원|복지용구)/;
function _a2Outbound(q) {
  const s = String(q || "");
  if (A2_TO_A4.test(s)) return { to: "A4", reason: "homecare" };
  if (A2_TO_A3.test(s)) return { to: "A3", reason: "shopping" };
  if (A2_TO_A1.test(s)) return { to: "A1", reason: "checkup-result" };
  if (A2_TO_A0.test(s)) return { to: "A0", reason: "booking" };
  return null;
}

/* ── RAG — 약관·세대 스펙·부지급 사유·코호트에서 근거 검색 ──
   세대·담보·부지급 사유는 '정확 일치 우선', 그 외는 키워드 스코어. 근거가 없으면 단정하지 않는다. */
function insRetrieve(question, topK) {
  const q = String(question || "");
  const t = q.toLowerCase().replace(/\s+/g, "");
  const hits = [];
  /* ① 실손 세대 — 정확 일치 우선 */
  try {
    if (typeof SILSON_SPEC !== "undefined") {
      for (const gen in SILSON_SPEC) {
        if (gen === "미가입") continue;
        if (t.indexOf(gen.replace(/\s/g, "")) >= 0) {
          const s = SILSON_SPEC[gen];
          hits.push({ source: "실손 세대 스펙", title: `${gen} ${s.type}`, snippet: `${s.period} · 자기부담 급여 ${s.coGen}/비급여 ${s.coNon} · 재가입 ${s.reEnroll}`, score: 100 });
        }
      }
    }
  } catch (e) {}
  /* ② 부지급 사유 — 정확 일치 우선 */
  try {
    if (typeof CLAIM_DENY !== "undefined" && /(부지급|안\s*주|지급\s*안|거절|왜\s*못\s*받|면책)/.test(q)) {
      for (const k in CLAIM_DENY) hits.push({ source: "청구 심사 기준", title: CLAIM_DENY[k].ko, snippet: CLAIM_DENY[k].fix, score: 90 });
    }
  } catch (e) {}
  /* ③ 약관 지식(INS_KB) — 키워드 스코어 */
  try {
    if (typeof INS_KB !== "undefined") {
      INS_KB.forEach(function (e) {
        let sc = 0;
        (e.kw || []).forEach(function (k) { const kn = String(k).toLowerCase().replace(/\s+/g, ""); if (kn && t.indexOf(kn) >= 0) sc = Math.max(sc, kn.length * 4); });
        const qn = String(e.q || "").toLowerCase().replace(/\s+/g, "");
        if (qn && t.length > 3 && qn.indexOf(t.slice(0, 4)) >= 0) sc += 6;
        if (sc >= 8) hits.push({ source: "약관 지식(" + ((typeof INS_PRODUCT !== "undefined" && INS_PRODUCT.name) || "보험") + ")", title: e.q, snippet: String(e.a || "").replace(/\*\*/g, "").slice(0, 120), score: sc });
      });
    }
  } catch (e) {}
  /* ④ 코호트 통계 — 또래 비교 질문에만 */
  try {
    if (/(또래|평균|다른\s*사람|남들)/.test(q) && typeof cohortInsStats === "function") {
      const c = cohortInsStats();
      if (c) hits.push({ source: "회원 코호트 통계(10만 명)", title: "실손 세대·보장 분포", snippet: "동일 연령대 분포 기준 비교", score: 50, data: true });
    }
  } catch (e) {}
  hits.sort(function (a, b) { return b.score - a.score; });
  const seen = {}, out = [];
  for (const h of hits) { if (seen[h.title]) continue; seen[h.title] = 1; out.push(h); if (out.length >= (topK || 3)) break; }
  return out;
}

/* ── 툴 라우팅 — 질문 → 담당 계산 툴 ── */
const A2_TOOLS = [
  { key: "gap", re: /(보장\s*공백|공백|부족한|빠진|점검|충실|보장\s*분석|보험\s*점검)/, label: "보장 공백 분석" },
  { key: "sil", re: /(실손|몇\s*세대|세대\s*확인|자기부담)/, label: "실손 세대 확인" },
  { key: "oop", re: /(본인부담|얼마\s*내|내가\s*내는|mri|도수|비급여\s*주사|입원비)/, label: "본인부담 계산" },
  { key: "gen", re: /(전환|갈아타|유불리|바꾸면|해지할|해지해도|정리할)/, label: "세대 전환 비교(유지 vs 전환)" },
  { key: "claimprep", re: /(청구|서류|접수)/, label: "청구 준비" },
  { key: "inscover", re: /(검진대비보험|무료\s*보험|공짜\s*보험|검진보험)/, label: "검진대비보험 안내" },
  { key: "riskcancer", re: /(암\s*보장|암\s*진단비|암보험)/, label: "암 보장 확인" },
  { key: "riskbh", re: /(뇌|심장|심근경색|뇌졸중)/, label: "뇌·심장 보장 확인" },
  { key: "ladder", re: /(사다리|뭐부터|우선순위|먼저\s*뭐)/, label: "보장 사다리" },
  { key: "donate", re: /(나눔|기부|사각지대)/, label: "나눔 재원 현황" },
];

/* 응답에 등장한 숫자 추출 — 하네스가 calc와 대조(환각 0 검증) */
function _a2Numbers(text) {
  const out = [];
  String(text || "").replace(/[\d,]+(?:\.\d+)?\s*%?/g, function (m) { const v = m.replace(/\s/g, ""); if (/\d/.test(v)) out.push(v); return m; });
  return [...new Set(out)];
}

/* ── 진입점 ──
   반환: { agent:"A2", lines, cards, buttons, cite, nav, calc } | { handback:{to,reason} } | null */
function insuranceAgent(question, ctx) {
  const q = String(question || "");
  ctx = ctx || {};
  /* ① 담당 밖 → 이전 */
  /* [Phase E] 협주 파트 호출에서는 핸드백하지 않는다 — 라우팅은 협주가 이미 정했다(경계는 ensembleGuard ②가 지킨다) */
  const ob = (ctx && ctx.ensemble) ? null : _a2Outbound(q);
  if (ob) return { handback: ob };

  const snap = ctx.snap || null;
  const s3 = snap && (snap.s3 || {});
  const m = ctx.m || null;
  const calc = { tool: null, values: [], state: [] };
  let lines = [], buttons = [], nav = { key: "insurance", label: "보험·치료비" };

  /* ② 상태 선행 — 연결 전이면 분석 자체가 불가(SEG-S3-01 방향) */
  if (s3 && s3.insLinked === false) {
    lines = [
      "확인해 보니 보험 통합조회가 아직 연결 전이라 계약을 불러올 수 없어요.",
      "본인인증 한 번이면 전 보험사 가입내역이 자동으로 들어와요(신용정보원 연계) — 1분이면 되고, 그때부터 보장 공백·휴면보험금·실손 세대까지 계산해 드릴 수 있어요.",
    ];
    buttons = ["보험 연결하기"];
    nav = { key: "onboarding", label: "데이터 연결" };
    const g0 = insuranceGuard(lines, {});
    return { agent: "A2", lines: g0.lines, cards: [], buttons: buttons, cite: [], nav: nav, calc: calc, guard: g0.violations };
  }

  /* ③ 툴 라우팅 — 계산은 툴이 한다 */
  let picked = null;
  for (const t of A2_TOOLS) { if (t.re.test(q)) { picked = t; break; } }
  let toolOut = null;
  if (picked) {
    try { if (typeof TOOL_RUN !== "undefined" && TOOL_RUN[picked.key]) toolOut = TOOL_RUN[picked.key](m, q); } catch (e) { toolOut = null; }
    if (toolOut && toolOut.lines && toolOut.lines.length) {
      calc.tool = picked.key;
      calc.values = _a2Numbers(toolOut.lines.join(" "));
      lines = toolOut.lines.slice();
      if (toolOut.buttons && toolOut.buttons.length) buttons = toolOut.buttons.slice(0, 2);
    }
  }

  /* ④ 상태 기반 보완 — 휴면보험금·보험료 등 툴이 없는 항목은 스냅샷 값만 사용(지어내지 않는다) */
  if (!lines.length && /(휴면|숨은\s*보험금|잠자는|안\s*찾아간)/.test(q)) {
    if (s3 && s3.dormantAmt > 0) {
      calc.state = [String(s3.dormantAmt.toLocaleString()) + "원"];
      lines = [`조회 결과 안 찾아가신 휴면보험금이 약 ${s3.dormantAmt.toLocaleString()}원 확인돼요.`,
        "휴면보험금은 만기·해지 후 찾아가지 않은 돈이라, 신청하면 본인 계좌로 받을 수 있어요 — 신청 절차는 제가 단계별로 함께 진행해 드릴게요."];
      buttons = ["휴면보험금 화면 열기"];
      nav = { key: "insurance", label: "보험·치료비" };
    } else if (s3) {
      lines = ["조회 기준으로는 지금 확인되는 휴면보험금이 없어요.",
        "보험 목록이 오래됐다면 통합조회를 한 번 더 갱신해 보시면 새로 잡히는 계약이 있을 수 있어요."];
      buttons = ["보험 연결하기"];
    }
  }
  if (!lines.length && /(보험료|얼마\s*내고|월\s*납입)/.test(q)) {
    let ins = null;
    try { ins = (typeof memberInsurance === "function" && m) ? memberInsurance(m) : null; } catch (e) {}
    if (ins && ins.silson) {
      const mon = ins.silson.monthly || 0;
      calc.tool = "memberInsurance"; calc.values = _a2Numbers(String(mon));
      lines = [`연결된 계약 기준으로 실손 월 보험료는 약 ${mon.toLocaleString()}원이에요(${ins.silson.gen}).`,
        "부담을 줄이는 길은 세대 전환·중복 정리·건강 개선에 따른 요율 재산정 세 가지가 있어요 — 각각 숫자로 비교해 보여드릴게요."];
      buttons = ["세대 전환 유불리", "요율 재산정 신청해줘"];
    }
  }

  /* ⑤ 지식 답변 — 계산이 필요 없는 약관·절차 질문 */
  if (!lines.length) {
    let kb = null;
    try { kb = (typeof insuranceCounsel === "function") ? insuranceCounsel(q) : null; } catch (e) {}
    if (kb && kb.bubbles && kb.bubbles.length) {
      lines = kb.bubbles.filter(function (b) { return b.kind !== "card"; }).map(function (b) { return String(b.text || "").replace(/\*\*/g, ""); }).filter(Boolean);
      const cards = kb.bubbles.filter(function (b) { return b.kind === "card" && b.card; }).map(function (b) { return b.card; });
      buttons = (kb.quicks || []).slice(0, 3);
      if (lines.length) {
        const cite0 = insRetrieve(q, 3);
        const g1 = insuranceGuard(lines, { oldGen: s3 && (s3.silsonGen === "1세대" || s3.silsonGen === "2세대") });
        try { insGuardLog(q, g1.violations); } catch (e) {}
        if (g1.blocked) return { handback: { to: g1.handback || "A1", reason: "diagnosis-guard" } };
        return { agent: "A2", lines: g1.lines, cards: cards, buttons: buttons, cite: cite0, nav: nav, calc: calc, guard: g1.violations };
      }
    }
  }
  if (!lines.length) return null;   // A2가 답할 근거가 없으면 상위 파이프라인에 위임

  /* ⑥ 근거 + 규제 가드 */
  const cite = insRetrieve(q, 3);
  const oldGen = !!(s3 && (s3.silsonGen === "1세대" || s3.silsonGen === "2세대")) || /1세대|2세대/.test(lines.join(" "));
  const g = insuranceGuard(lines, { oldGen: oldGen });
  try { insGuardLog(q, g.violations); } catch (e) {}
  if (g.blocked) return { handback: { to: g.handback || "A1", reason: "diagnosis-guard" } };

  return { agent: "A2", lines: g.lines, cards: [], buttons: buttons.slice(0, 3), cite: cite, nav: nav, calc: calc, guard: g.violations };
}

try { if (typeof window !== "undefined") { window.__hifinA2 = { answer: insuranceAgent, retrieve: insRetrieve, tools: A2_TOOLS }; } } catch (e) {}
