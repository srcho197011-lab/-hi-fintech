/* ══════════════ 하이 NLU 코어 — 분류기·응답 파이프라인(U1~U7 순서 강제)·오프토픽·미답변 로그 ══════════════
   파이프라인(코드로 강제): 의도분류 → 전제조건(U1/U2) → 기능존재(U3) → 전문영역·외부(U4/U5)
   → 시스템(U6) → 신뢰도(U7) → 정상 답변. 컨텍스트 3턴 기억 + 쉬운말 모드 전파.
   진입점: hiRespond(text, norm, m) — aiNative.agentAnswer의 무매칭 분기에서 호출(기존 QNA·섹션가이드 우선). */

/* ── 정규화: lexNormalize 결과에 오타 사전(HI_SLOTS_A.typo) 추가 치환 ── */
function hiNormalize(norm) {
  let t = String(norm || "");
  try {
    for (const gid in HI_SLOTS_A) {
      const g = HI_SLOTS_A[gid];
      for (const v of (g.typo || [])) { if (v && t.indexOf(v.toLowerCase()) >= 0) t = t.split(v.toLowerCase()).join(g.std.toLowerCase()); }
    }
  } catch (e) {}
  return t;
}

/* ── 슬롯 히트 스캔: A그룹·B클래스별 최장 매칭 길이 ── */
function hiScanSlots(t) {
  const a = {}, b = {};
  for (const gid in HI_SLOTS_A) {
    const g = HI_SLOTS_A[gid];
    const words = [g.std].concat(g.syn || []).concat(g.typo || []);
    let best = 0;
    for (const w of words) { const wn = w.toLowerCase().replace(/\s/g, ""); if (wn.length >= 2 && t.indexOf(wn) >= 0) best = Math.max(best, wn.length); }
    if (best) a[gid] = best;
  }
  for (const bid in HI_SLOTS_B) {
    let best = 0;
    for (const w of HI_SLOTS_B[bid].words) { const wn = w.toLowerCase().replace(/\s/g, ""); if (t.indexOf(wn) >= 0) best = Math.max(best, wn.length); }
    if (best) b[bid] = best;
  }
  return { a, b };
}

/* ── 의도분류: 인텐트 스코어링 → best + 후보(U7 칩용) + 신뢰도 ── */
/* 부분문자열 그림자: 긴 합성어(보험료·가족력·실손보험·검진결과…)가 매칭되면 그 안의 짧은 그룹 히트를 억제 */
const HI_A_SHADOW = { premium: ["ins"], claim: ["ins"], dormant: ["claim", "ins"], silson: ["ins"], freeins: ["ins", "ckup"], famhist: ["family"], ckresult: ["ckup"], national: ["ckup"], center: ["ckup"], prep: ["ckup"], booking: ["ckup"], invitelink: ["invite"], topup: ["htk", "earnway"], code: ["invite"], trend: ["ckresult"], gap: ["ins", "cover"], aggregate: ["ins"], htk: ["earnway"], risk: ["tier"] };
function hiClassify(rawText, norm) {
  const t = hiNormalize(norm);
  const { a, b } = hiScanSlots(t);
  for (const k in HI_A_SHADOW) { if (a[k]) for (const g of HI_A_SHADOW[k]) { if (a[g] && a[g] < a[k]) delete a[g]; } }
  const scored = [];
  const bareQuery = !Object.keys(b).length;
  for (const it of HI_INTENTS) {
    const aHits = (it.a || []).filter((g) => a[g]);
    if (!aHits.length) continue;
    const bHits = (it.b || []).filter((g) => b[g]);
    /* bReq: 행위어 필수 인텐트 — 질의에 다른 행위어가 있으면 배제, 단답(행위어 없음)이면 감점만(유일 담당 그룹의 단답 대응) */
    if (it.bReq && !bHits.length && !bareQuery) continue;
    /* 특이 행위어(변경·취소·삭제·등록·계산 등)는 범용 행위어(보기·해줘)보다 의도 판별력이 높아 가중 */
    const DISTINCT = { change: 1, cancel: 1, del: 1, offv: 1, register: 1, care: 1, calc: 1, connect: 1, compare: 1, can: 1 };
    let s = aHits.reduce((x, g) => x + a[g], 0) + bHits.reduce((x, g) => x + b[g] * (DISTINCT[g] ? 1.5 : 1.2), 0);
    if (bareQuery && it.hub) s += 1.5;          // 단답은 hub 인텐트 우선
    if (it.bReq && !bHits.length) s -= 1;       // 단답으로 온 bReq는 후순위
    if (it.bReq && bHits.length) s += 2;        // 행위어 특정 인텐트가 실제 그 행위어와 오면 강한 우선
    scored.push({ it, s, aHits, bHits });
  }
  scored.sort((x, y) => y.s - x.s);
  const best = scored[0] || null;
  const conf = best ? Math.min(1, best.s / Math.max(2, t.length * 0.55)) : 0;   // 단답(1어)도 신뢰도 확보(분모 하한 2)
  return { t, a, b, best, conf, cand: scored.slice(0, 3).map((x) => x.it) };
}

/* ── 미답변 로그(unanswered_log) + 주간 리포트 + 에스컬레이션 카운터 ── */
function hiULog(q, type) {
  try {
    const k = "hifin_hi_unanswered";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(q).slice(0, 100), type, ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-500)));
  } catch (e) {}
}
function hiUnansweredReport(days) {
  try {
    const since = Date.now() - (days || 7) * 86400000;
    const l = JSON.parse(localStorage.getItem("hifin_hi_unanswered") || "[]").filter((x) => x.ts >= since);
    const byType = {}, byQ = {};
    l.forEach((x) => { byType[x.type] = (byType[x.type] || 0) + 1; byQ[x.q] = (byQ[x.q] || 0) + 1; });
    const top = Object.keys(byQ).sort((a, b) => byQ[b] - byQ[a]).slice(0, 20).map((q) => ({ q, n: byQ[q] }));
    return { total: l.length, byType, top };
  } catch (e) { return { total: 0, byType: {}, top: [] }; }
}
function hiEscBump(type) {
  try {
    const k = "hifin_hi_esc_" + type;
    const n = parseInt(sessionStorage.getItem(k) || "0", 10) + 1;
    sessionStorage.setItem(k, String(n));
    return n;
  } catch (e) { return 1; }
}

/* ── 컨텍스트: 직전 3턴 기억(슬롯필링·후속 질문) ── */
let _hiCtx = [];
function hiCtxPush(q, intentId) { _hiCtx.push({ q, intentId, ts: Date.now() }); if (_hiCtx.length > 3) _hiCtx = _hiCtx.slice(-3); }
function hiCtxLast() { return _hiCtx.length ? _hiCtx[_hiCtx.length - 1] : null; }

/* ── 쉬운말 모드 플래그(전 답변 전파) ── */
function hiEasyOn() { try { return document.body.classList.contains("easyread") || !!localStorage.getItem("hifin_easyread"); } catch (e) { return false; } }

/* ── 전제조건 검사(U1/U2 판정) — 2단계: 상태 모델(스냅샷) 기반으로 승격, 구 onboardStatus는 폴백 ── */
function hiCheckPre(it, m, snap) {
  const pre = it.pre || [];
  if (pre.includes("login") && !m) return { u: "U1", res: {
    lines: [hiEasyOn() ? "이 기능은 로그인하고 쓸 수 있어요. 로그인하면 이어서 도와드릴게요." : "이 기능은 로그인 후에 이용할 수 있어요 — 로그인하시면 제가 이어서 도와드릴게요."],
    buttons: ["하이핀 소개해줘"], nav: null } };
  let ob = null;
  if (snap) ob = { step1: !!(snap.s5 && snap.s5.anyLink), step2: !!(snap.s3 && snap.s3.insLinked) };
  else { try { ob = (typeof onboardStatus === "function") ? onboardStatus(m) : null; } catch (e) { ob = null; } }
  if (pre.includes("dataLink") && ob && !ob.step1) return { u: "U1", res: {
    lines: [hiEasyOn() ? "아직 검진 데이터가 연결 전이에요. 사진 한 장이면 1분에 연결돼요." : "아직 검진 데이터가 연결 전이라 보여드릴 수 없어요. 1분이면 연결할 수 있어요!"],
    buttons: ["검진결과 올리기"], nav: { key: "onboarding", label: "데이터 연결" } } };
  if (pre.includes("insLink") && ob && !ob.step2) return { u: "U1", res: {
    lines: [hiEasyOn() ? "보험이 아직 연결 전이에요. 인증 한 번이면 1분에 돼요." : "보험이 아직 연결 전이라 확인할 수 없어요. 통합조회 연결이 1분이면 돼요."],
    buttons: ["보험 연결하기"], nav: { key: "onboarding", label: "데이터 연결" } } };
  if (pre.includes("family")) {
    let famN = 0;
    if (snap && snap.s6) famN = snap.s6.familyCount || 0;
    else { try { famN = ((typeof familyLoad === "function" && m) ? (familyLoad(m.email, (m.name || "가")[0]) || []) : []).length; } catch (e) { famN = 0; } }
    if (!famN) return { u: "U2", res: {
      lines: [hiEasyOn() ? "가족으로 등록하고 동의를 받아야 볼 수 있어요. 등록은 말 한마디면 돼요." : "그분 정보는 가족 등록에 동의하셔야 볼 수 있어요 — 등록은 \"어머니 82세 추가해줘\" 한마디면 돼요."],
      buttons: ["어머니 82세 추가해줘", "아내 51세 추가해줘"], nav: { key: "mypage", label: "우리가족건강관리" } } };
  }
  return null;
}

/* ── U4 전문영역 · U5 실시간/외부 가드(정규화 텍스트 패턴) ── */
const HI_U4_DIAG = /(인가요|일까요|맞나요|인건가|아닌가요|걸린건가|이라는건가|인지알려|인가여)/;
const HI_U4_DIS = /(암|당뇨|고혈압|뇌졸중|심근경색|치매|간경화|신부전|우울증|디스크)/;
const HI_U4_DECIDE = /(해지할까|해지해도|갈아탈까|들까말까|가입할까말까|사도될까|팔까|투자할까|사야할까|끊어도되|그만먹어도|약끊)/;
const HI_U4_LEGAL = /(소송|고소|상속세|양도세|증여세|세금신고|위자료|법적책임|합의금)/;
const HI_U5_PAT = /(대기시간|영업시간|몇시까지해|몇시에닫|문열었|지금운영|주가|코스피|환율|비트코인시세|택배어디|배송조회해줘타|버스언제|지하철몇분|국민연금언제|연금언제나와|다른앱비밀번호|보험사앱비번|콜센터연결)/;
function hiGuardU45(t) {
  if (HI_U4_DECIDE.test(t) || HI_U4_LEGAL.test(t) || (HI_U4_DIAG.test(t) && HI_U4_DIS.test(t))) {
    return { u: "U4", res: {
      lines: [
        hiEasyOn() ? "그건 의사·전문가만 판단할 수 있는 부분이라 제가 답하면 위험해요." : "그건 의사/전문가 판단이 필요한 부분이라 제가 단정해서 답하면 위험해요.",
        "대신 결과를 이해하기 쉽게 설명해 드리고, 병원·상담 안내까지는 바로 도와드릴게요.",
      ], buttons: ["검진결과 설명해줘", "병원 찾기", "사람 상담 연결"], nav: null } };
  }
  if (HI_U5_PAT.test(t)) {
    return { u: "U5", res: {
      lines: [
        hiEasyOn() ? "그건 제가 실시간으로 확인할 수 없는 정보예요." : "그건 제가 실시간으로 확인할 수 없는 정보예요 — 해당 기관에서 직접 확인하실 수 있어요.",
        "연락처·가는 길 안내나, 하이핀 안에서 할 수 있는 대안은 바로 도와드릴게요.",
      ], buttons: ["병원 찾기", "사람 상담 연결"], nav: null } };
  }
  return null;
}

/* ── U3 기능 미출시 검사 ── */
function hiGuardU3(t) {
  for (const ny of HI_NOT_YET) {
    for (const w of ny.words) {
      if (t.indexOf(w.toLowerCase().replace(/\s/g, "")) >= 0) {
        try { const k = "hifin_hi_featreq"; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ k: ny.k, ts: Date.now() }); localStorage.setItem(k, JSON.stringify(l.slice(-200))); } catch (e) {}
        const n = hiEscBump("U3");
        const btns = (ny.chips || []).slice(0, 2); if (n >= 2) btns.push("사람 상담 연결");
        return { u: "U3", res: { lines: [`${ny.name}은(는) 아직 준비 중이에요 — 요청은 제가 기록해서 개발팀에 전달할게요.`, ny.alt], buttons: btns.slice(0, 3), nav: null } };
      }
    }
  }
  return null;
}

/* ── 오프토픽 3단계 ── */
function hiOfftopic(t, rawText) {
  /* ③ 부적절·위험 — 자해는 전문 상담 최우선 */
  const O = HI_OFFTOPIC;
  if (O.risk.selfharm.some((w) => t.indexOf(w) >= 0)) return { kind: "offtopic", res: { lines: [O.risk.aSelfharm], buttons: ["사람 상담 연결"], nav: null } };
  if (O.risk.swear.some((w) => t.indexOf(w) >= 0)) return { kind: "offtopic", res: { lines: [O.risk.aSwear], buttons: ["사람 상담 연결"], nav: null } };
  if (O.risk.illegal.some((w) => t.indexOf(w) >= 0)) return { kind: "offtopic", res: { lines: [O.risk.aIllegal], buttons: ["하이핀 소개해줘"], nav: null } };
  /* ① 가벼운 잡담 — 1문장 호응 + 기능 1개 */
  for (const r of O.chat.res) {
    if (r.m.some((w) => t.indexOf(w) >= 0)) {
      const who = (typeof agentWho === "function") ? agentWho() : "회원";
      return { kind: "offtopic", res: { lines: [r.a.replace(/성래님/g, who + "님")], buttons: (r.chips || []).slice(0, 1), nav: null } };
    }
  }
  /* ② 무관 지식 — 범위 고지 + 기능 칩 3 */
  if (/(로또|복권)/.test(t)) return { kind: "offtopic", res: { lines: [O.know.aLotto], buttons: ["휴면보험금 찾아줘"], nav: null } };
  if (O.know.pats.some((w) => t.indexOf(w.toLowerCase()) >= 0)) return { kind: "offtopic", res: { lines: [O.know.a], buttons: O.know.chips.slice(0, 3), nav: null } };
  return null;
}

/* ── 정상 답변 조립: answer(쉬운말 반영) + 툴 실행(U6 검출) + 딥링크 버튼 ── */
function hiAnswer(it, m, rawText) {
  const easy = hiEasyOn();
  let lines = [(easy && it.easy) ? it.easy : it.ans];
  /* [5] 시스템 상태 검사(U6): 툴 실행 예외 → 표준 U6 응답 */
  if (it.tool && typeof TOOL_RUN !== "undefined" && TOOL_RUN[it.tool]) {
    let extra = null, failed = false;
    try { extra = TOOL_RUN[it.tool](m, rawText); } catch (e) { failed = true; }
    if (failed) {
      const n = hiEscBump("U6"); hiULog(rawText, "U6");
      return { kind: "unanswerable", u: "U6", res: { lines: ["지금 조회가 잠시 안 되고 있어요 — 조금 뒤 다시 해볼게요. 계속 안 되면 알려드릴게요."], buttons: n >= 2 ? ["사람 상담 연결"] : [], nav: null } };
    }
    if (extra && extra.lines) lines = (it.tool === "rep" || it.tool === "sil" || it.tool === "gap" || it.tool === "wallet") ? [lines[0]].filter(Boolean).concat(extra.lines) : lines.concat(extra.lines);
    if (extra && extra.buttons && extra.buttons.length) {
      const nav0 = it.nav ? { key: it.nav, label: (typeof AGENT_NAV_LABEL !== "undefined" && AGENT_NAV_LABEL[it.nav]) || "바로가기" } : null;
      return { kind: "intent", res: { lines, buttons: extra.buttons.slice(0, 3), nav: nav0 }, intent: it };
    }
  }
  /* 딥링크: nav + (지갑 서브탭 훅) */
  let nav = null;
  if (it.nav) {
    nav = { key: it.nav, label: (typeof AGENT_NAV_LABEL !== "undefined" && AGENT_NAV_LABEL[it.nav]) || "바로가기" };
    if (it.tab) { try { window._walletTab = it.tab; } catch (e) {} }
  }
  return { kind: "intent", res: { lines, buttons: (it.chips || []).slice(0, 3), nav }, intent: it };
}

/* ── 진입점: hiRespond — 파이프라인 순서를 코드로 강제 ──
   반환: { kind: "intent"|"unanswerable"|"offtopic"|"u7", res:{lines,buttons,nav}, intent? } | null */
function hiRespond(rawText, norm, m) {
  try {
    const cls = hiClassify(rawText, norm);
    const t = cls.t;

    /* [4a] 전문영역·외부정보 가드(U4/U5) — 의도와 무관하게 선차단(단정 방지 최우선) */
    const g45 = hiGuardU45(t);
    if (g45) { hiULog(rawText, g45.u); hiCtxPush(rawText, "U-" + g45.u); return { kind: "unanswerable", u: g45.u, res: g45.res }; }

    /* [3] 기능 존재 검사(U3) */
    const g3 = hiGuardU3(t);
    if (g3) { hiULog(rawText, "U3"); hiCtxPush(rawText, "U-U3"); return { kind: "unanswerable", u: "U3", res: g3.res }; }

    /* [2단계] 상태 스냅샷 — 파이프라인 진입 시 1회 로드(추론·U1/U2 판정의 공통 근거) */
    let snap = null;
    try { snap = (m && typeof memberStateSnapshot === "function") ? memberStateSnapshot(m) : null; } catch (e) { snap = null; }

    /* [1] 의도분류 성공 경로 */
    if (cls.best && cls.conf >= 0.45) {
      const it = cls.best.it;
      /* [1.5·2단계] 상황 추론(SARG) — 상태 의존 상황이 매칭되면 정적 답변보다 우선.
         인텐트 매칭 실패 시 구어 보조 패턴(qpat)도 시도(허브 분류로 뭉개진 상태 질문 구제) */
      if (!(it.pre || []).includes("login") || m) {
        const rz = ((typeof hiReason === "function") ? hiReason(it.id, snap, m, rawText) : null)
          || ((typeof hiReasonDirect === "function") ? hiReasonDirect(t, snap, m, rawText) : null);
        if (rz) { hiCtxPush(rawText, it.id); return rz; }
      }
      /* [2] 전제조건 검사(U1/U2) — 상태 모델 기반 */
      const pre = hiCheckPre(it, m, snap);
      if (pre) { hiULog(rawText, pre.u); hiCtxPush(rawText, it.id); return { kind: "unanswerable", u: pre.u, res: pre.res }; }
      /* [5]~[7] 정상 답변(툴 U6 포함) */
      const out = hiAnswer(it, m, rawText);
      hiCtxPush(rawText, it.id);
      return out;
    }

    /* 컨텍스트 슬롯필링: 직전 3턴 내 인텐트 + 이번 턴 행위어만 → 같은 인텐트 이어가기 */
    const last = hiCtxLast();
    if (last && last.intentId && Object.keys(cls.b).length && !Object.keys(cls.a).length) {
      const it = HI_INTENTS.find((x) => x.id === last.intentId);
      if (it && (it.b || []).some((bg) => cls.b[bg])) {
        const rz = (typeof hiReason === "function") ? hiReason(it.id, snap, m, rawText) : null;
        if (rz) { hiCtxPush(rawText, it.id); return rz; }
        const pre = hiCheckPre(it, m, snap);
        if (pre) { hiULog(rawText, pre.u); return { kind: "unanswerable", u: pre.u, res: pre.res }; }
        const out = hiAnswer(it, m, rawText);
        hiCtxPush(rawText, it.id);
        return out;
      }
    }

    /* [2단계] 미분류 보조 추론 — 구어형 상태 질문("돈 찾아준다더니 어디서 봐?")을 세그먼트 qpat으로 직접 매칭 */
    {
      const rz = (typeof hiReasonDirect === "function") ? hiReasonDirect(t, snap, m, rawText) : null;
      if (rz) { hiCtxPush(rawText, rz.seg); return rz; }
    }

    /* 오프토픽 3단계 */
    const ot = hiOfftopic(t, rawText);
    if (ot) { hiULog(rawText, "OFFTOPIC"); hiCtxPush(rawText, "OFFTOPIC"); return ot; }

    /* [6] 신뢰도 검사(U7): 약한 후보가 있으면 후보 칩 제시 — 2회 누적 시 상담 남기기 */
    if (cls.best) {
      const n = hiEscBump("U7"); hiULog(rawText, "U7");
      const chips = cls.cand.map((c) => (c.chips && c.chips[0]) || c.l2).filter(Boolean);
      const uniq = [...new Set(chips)].slice(0, 3);
      hiCtxPush(rawText, null);
      return { kind: "u7", res: {
        lines: [hiEasyOn() ? "혹시 이 중에 찾으시는 게 있나요?" : "제가 정확히 이해하지 못했어요 — 혹시 이 중에 찾으시는 게 있나요?"].concat(n >= 2 ? ["계속 어려우시면 직원에게 남겨주세요 — 하루 안에 답을 드려요."] : []),
        buttons: n >= 2 ? uniq.slice(0, 2).concat(["사람 상담 연결"]) : uniq, nav: null } };
    }
    return null;   // 전혀 모르는 질문 → 기존 폴백(주치의 엔진·미답변 로그)에 넘김
  } catch (e) { return null; }
}

/* ── [2단계] SARG 프로브 — 섹션 가이드(nav 레이어)보다 먼저 상태 상황만 조용히 탐지 ──
   agentAnswer 진입부에서 호출: SARG 매칭 시에만 응답을 반환하고, 그 외 경로(U유형·오프토픽·로그)는
   건드리지 않는다(비매칭 시 기존 레이어 순서 그대로). */
function hiSargProbe(rawText, norm, m) {
  try {
    if (!m || typeof hiReason !== "function") return null;
    const snap = (typeof memberStateSnapshot === "function") ? memberStateSnapshot(m) : null;
    if (!snap) return null;
    const cls = hiClassify(rawText, norm);
    let rz = null;
    if (cls.best && cls.conf >= 0.45) rz = hiReason(cls.best.it.id, snap, m, rawText);
    if (!rz && typeof hiReasonDirect === "function") rz = hiReasonDirect(cls.t, snap, m, rawText);
    if (rz) { hiCtxPush(rawText, rz.seg); return rz; }

    /* 즉시 분석 경로 — 올해 데이터를 보유한 회원의 결과·리포트 요청은 섹션 안내 대신 실제 분석 답변으로 잇는다
       (분기응답 대상이 아닌 회원이 "결과 알려줘"에 예약 화면 안내를 받던 경로 교정) */
    if (cls.best && cls.conf >= 0.45 && typeof hiCheckupRoute === "function" && hiCheckupRoute(snap) === "current") {
      const ANALYZE = ["S1-RESULT", "S1-EXPLAIN", "S1-BIO", "S1-HUB", "S2-REPORT", "S2-ITEM", "S2-TREND", "S2-RISK"];
      const id = cls.best.it.id;
      if (ANALYZE.some(function (p) { return id.indexOf(p) === 0; })) {
        const it = id.indexOf("S1-HUB") === 0 ? (HI_INTENTS.find(function (x) { return x.id === "S1-RESULT-01"; }) || cls.best.it) : cls.best.it;
        const out = hiAnswer(it, m, rawText);
        hiCtxPush(rawText, it.id);
        return out;
      }
    }
    return null;
  } catch (e) { return null; }
}

/* 관리자 콘솔용 노출 */
try { if (typeof window !== "undefined") { window.__hifinHiNlu = { classify: hiClassify, respond: hiRespond, report: hiUnansweredReport, probe: hiSargProbe }; } } catch (e) {}
