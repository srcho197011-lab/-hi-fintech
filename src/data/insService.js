/* ══════════════ 과업3 — insService: 보험·치료비 서비스 API층 (화면 = AI 상담사 단일 출처) ══════════════
   Phase 1 실행 지시서 §4. 모든 탭 기능을 화면 전용 함수가 아니라 서비스 함수로 구현 —
   화면(6탭)과 향후 「AI 보험·치료비 전용 상담사」가 같은 함수를 소비한다.
   역할 분담: 전역 '하이' = 얕은 안내·네비 / 전용 상담사(차기 Phase) = 본 서비스로 깊은 업무 수행.
   규제 가드레일(상담사 상속용 정책 상수): INS_AI_POLICY — 정보 제공까지만·청약 권유/지급 확정/의료 진단 금지·모집은 GA 경유. */

const INS_AI_POLICY = {
  allow: ["보장·계약·청구·납부 정보 조회", "갭 분석 설명", "절차 안내", "확인 단계를 거친 서비스 실행(납부 등)"],
  deny: ["청약 권유·특정 상품 추천 확정", "보험금 지급 여부 확정 판단", "의료 진단", "모집 행위(GA 경유 안내로 대체)"],
  note: "보험 상담은 정보 제공까지 — 가입·지급 확정은 보험사·GA 라이선스 채널이 수행합니다.",
};
/* 불가피한 상수(config) — 사유 주석 필수(하드코딩 금지 원칙의 예외 등록) */
const INS_CONFIG = {
  PREMIUM_MARGIN_RATE: 0.10,   // 보험료 중 플랫폼 중개 수수료 가정(재무엔진 arpuInsurance 계열과 정합) — 나눔 재원 산출 기반
  SHARE_RATE: 0.30,            // 순환 마진의 나눔 적립 비율(사업계획서 원칙4 · WALLET_SPLIT.give와 단일 정의)
  TELE_VISIT_FEE: 15900,       // 비대면 진찰료 수가 근사(2026 의원급 초진 기준 근사치) — 청구 지급 산정의 기본 진료비
  RERATE_PER_IMPROVE: 1.5,     // 개선 지표 1개당 요율 인하 %(계리 검증 전 시연 가정 — 제휴 보험사 협의 대상)
  RERATE_MAX_PCT: 15,          // 인하 상한 %(인하 전용 단방향 게이트)
};

function _isMember() { try { const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (dm) return dm; if (typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") return selfMember(); } catch (e) {} return null; }

/* ══ 실알림(과업4) — 수납·지급·재산정 이벤트가 알림센터에 실제로 쌓인다 ══ */
function notifAll() { try { return JSON.parse(localStorage.getItem("hifin_notifs") || "[]"); } catch (e) { return []; } }
function notifPush(o) { try { const l = notifAll(); l.unshift({ ts: Date.now(), ic: o.ic || "check", t: o.t || "알림", d: o.d || "", target: o.target || "insurance" }); localStorage.setItem("hifin_notifs", JSON.stringify(l.slice(0, 20))); } catch (e) {} }

/* ══ SharingPool(S1-1 기초) — 나눔 재원 기금 원장: 거래 건별 적립 tx(연출 카운터 아님) ══ */
function spLedger() { try { return JSON.parse(localStorage.getItem("hifin_sharing_pool") || "[]"); } catch (e) { return []; } }
/* dir: +1 적립(기본) / -1 지출(병원 직접 정산 — S3-1). 지출은 잔액 검증 통과 시에만 기록 */
function spAppend(o) {
  o = o || {}; const amount = Math.max(0, Math.round(o.amount || 0)); if (!amount) return null;
  const dir = o.dir === -1 ? -1 : 1;
  const l = spLedger();
  if (dir < 0) { const bal = l.reduce((s, t) => s + (t.dir === -1 ? -t.amount : t.amount), 0); if (bal < amount) return null; }   // 기금 음수 차단
  const tx = { seq: l.length, ts: Date.now(), source: o.source || "기타", amount, dir, ref: o.ref || null, by: o.by || null };
  l.push(tx);
  try { localStorage.setItem("hifin_sharing_pool", JSON.stringify(l)); } catch (e) { return null; }
  if (typeof chainAppend === "function") chainAppend({ type: "share", token: o.token || null, note: dir > 0 ? `나눔 재원 적립 — ${tx.source} · ${amount.toLocaleString()}원 (순환 ${Math.round(INS_CONFIG.SHARE_RATE * 100)}%)` : `나눔 기금 집행 — ${tx.source} · ${amount.toLocaleString()}원` });
  return tx;
}
function spSummary() {
  const l = spLedger();
  const inTotal = l.filter((t) => t.dir !== -1).reduce((s, t) => s + t.amount, 0);
  const outTotal = l.filter((t) => t.dir === -1).reduce((s, t) => s + t.amount, 0);
  return { count: l.length, balance: inTotal - outTotal, inTotal, outTotal, recent: l.slice(-8).reverse(),
    bySource: l.filter((t) => t.dir !== -1).reduce((m, t) => { m[t.source] = (m[t.source] || 0) + t.amount; return m; }, {}) };
}

/* ══ ClaimEngine-lite(P2 기초) — 심사 규칙 + 지급 실행(잔액 실이동) ══ */
function _claims() { try { return JSON.parse(localStorage.getItem("hifin_claims") || "[]"); } catch (e) { return []; } }
function _claimsSave(l) { try { localStorage.setItem("hifin_claims", JSON.stringify(l)); } catch (e) {} }
function claimReview(m, claimId) {
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  if (!c) return { ok: false, reason: "청구 건을 찾을 수 없습니다" };
  if (/지급/.test(c.status || "")) return { ok: false, reason: "이미 지급된 청구입니다(중복 지급 차단)" };
  // 규칙①: 실손 계약 보유 확인(금고 실데이터)
  let silson = null;
  try { const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(m)) : null; silson = (v && v.insurance || []).find((k) => k.kind === "실손" || /실손/.test(k.product || "")); } catch (e) {}
  if (!silson) return { ok: false, reason: "실손 계약이 확인되지 않아요 — 보장분석 탭에서 내 보험을 먼저 연결해 주세요" };
  // 규칙②: 지급액 산정 — 진료비(청구 기록 fee, 없으면 비대면 진찰료 수가)에서 세대별 자기부담률 차감
  const fee = c.fee || INS_CONFIG.TELE_VISIT_FEE;
  const genPct = parseInt(String(silson.coGen || "20").replace(/\D/g, ""), 10) || 20;   // 급여 자기부담률
  const payout = Math.max(0, Math.round(fee * (1 - genPct / 100) / 100) * 100);
  return { ok: true, claim: c, silson: { product: silson.product, gen: silson.gen, coGen: genPct + "%" }, fee, payout,
    explain: `진료비 ${fee.toLocaleString()}원 − 내가 내는 돈(자기부담 ${genPct}%) = 지급 ${payout.toLocaleString()}원` };
}
function claimPay(m, claimId) {
  const rv = claimReview(m, claimId); if (!rv.ok) return rv;
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const htk = Math.round(rv.payout / rate);
  if (typeof tlEarn !== "function") return { ok: false, reason: "원장을 사용할 수 없습니다" };
  const r = tlEarn(m, htk, `보험금 지급 — ${rv.claim.id} (${rv.payout.toLocaleString()}원)`, rv.claim.id);
  if (!r.ok) return r;
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  c.status = "지급완료"; c.paidAt = Date.now(); c.payout = rv.payout; c.txRef = r.tx && r.tx.hash;
  _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "payout", token: (typeof anonToken === "function") ? anonToken(m) : null, fhirHash: c.txRef || null, note: `보험금 지급 실행 — ${c.id} · ${rv.payout.toLocaleString()}원 (${htk.toLocaleString()} HTK 크레딧)` });
  notifPush({ ic: "coin", t: "보험금 지급 완료", d: `${c.id} · ${rv.payout.toLocaleString()}원이 지갑에 입금됐어요`, target: "insurance" });
  return { ok: true, claim: c, payout: rv.payout, htk, balance: r.balance };
}

/* ══ 요율 재산정(M2-2 초기) — 인하폭을 실지표 개선도로 계산(고정값 12,400→11,100 폐기) ══ */
function rerateCompute(m) {
  try {
    const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(m)) : null;
    const cks = (v && v.checkups || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (cks.length < 2) return { eligible: false, reason: "검진 2개년 데이터가 필요해요 — 올해 검진결과를 연결하면 재산정을 신청할 수 있어요", need: 2 - cks.length };
    const mapOf = (ck) => { const o = {}; (ck.items || []).forEach((it) => { const n = Number(it.value); if (!isNaN(n)) o[it.key] = n; }); return o; };
    const prev = mapOf(cks[cks.length - 2]), cur = mapOf(cks[cks.length - 1]);
    const KEYS = ["glucose", "hba1c", "tg", "ldl", "tchol", "sbp", "dbp", "ast", "alt", "ggt", "bmi"];   // 개선 판정 대상(낮을수록 좋은 지표)
    const improved = [], worsened = [];
    KEYS.forEach((k) => { if (prev[k] == null || cur[k] == null) return; const d = prev[k] - cur[k]; const thr = Math.max(1, prev[k] * 0.03); if (d >= thr) improved.push({ k, ko: (typeof CKUP_LOINC !== "undefined" && CKUP_LOINC[k]) ? CKUP_LOINC[k].ko : k, from: prev[k], to: cur[k] }); else if (-d >= thr) worsened.push(k); });
    // 현재 보험료(실데이터): 금고 실손 계약 monthly → 없으면 유지 불가 안내
    let monthly = null; try { const sil = (v.insurance || []).find((k) => k.kind === "실손" || /실손/.test(k.product || "")); monthly = sil && (sil.monthly || null); } catch (e) {}
    if (!monthly) monthly = 12400;   // config 폴백: 실손 미연결 회원의 시연 기준 보험료(연결 시 실값 대체) — 사유: 빈 화면 방지
    const pct = Math.min(INS_CONFIG.RERATE_MAX_PCT, improved.length * INS_CONFIG.RERATE_PER_IMPROVE);
    const after = Math.round(monthly * (1 - pct / 100) / 100) * 100;
    // 인하 전용 단방향 게이트: 개선 없으면 "유지"(인상·거절 경로 없음 — 악화 지표는 표시만)
    return { eligible: true, improvedN: improved.length, improved, worsenedN: worsened.length, pct, before: monthly, after: pct > 0 ? after : monthly, saving: pct > 0 ? monthly - after : 0, downOnly: true };
  } catch (e) { return { eligible: false, reason: "재산정 계산 오류" }; }
}
function rerateApplyReal(m) {
  const c = rerateCompute(m);
  if (!c.eligible) return { ok: false, reason: c.reason };
  if (c.pct <= 0) return { ok: false, reason: "이번에는 개선 지표가 확인되지 않았어요 — 보험료는 그대로 유지돼요(인하 전용·불이익 없음)" };
  try {
    const s = { status: "done", before: c.before, after: c.after, saving: c.saving, rate: c.pct, improved: c.improved.map((x) => x.ko), at: Date.now() };
    localStorage.setItem("hifin_rerate", JSON.stringify(s));
    const tk = anonToken(m);
    if (typeof chainAppend === "function") chainAppend({ type: "record", token: tk, note: `보험요율 재산정 — 4세대 성과(${s.improved.join("·")}) 실증 · 월 ${c.before.toLocaleString()}→${c.after.toLocaleString()}원 인하` });
    try { const k = "hifin_g4_" + tk; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ kind: "rerate", saving: s.saving, improved: s.improved, at: s.at }); localStorage.setItem(k, JSON.stringify(l)); } catch (e2) {}
    if (typeof vaultAccessLog === "function") vaultAccessLog(tk, "보험사(요약 증명만)", "성과 요약 열람 — 요율 재산정 심사(원본 미제공)");
    notifPush({ ic: "check", t: "요율 재산정 적용", d: `월 ${c.before.toLocaleString()}→${c.after.toLocaleString()}원 (−${c.pct}%) — 관리 성과가 보험료가 됐어요`, target: "insurance" });
    return { ok: true, state: s, compute: c };
  } catch (e) { return { ok: false, reason: "적용 저장 실패" }; }
}

/* ══ insService — 상담사·화면 공용 진입점 ══ */
const insService = {
  policy: INS_AI_POLICY, config: INS_CONFIG,
  member: _isMember,
  /* ① 보장분석 — 금고 실계약 + 코호트 통계(재합성 금지) */
  gap(m) {
    m = m || _isMember(); if (!m) return null;
    let contracts = []; try { const v = vaultLoad(anonToken(m)); contracts = (v && v.insurance) || []; } catch (e) {}
    const silson = contracts.find((c) => c.kind === "실손" || /실손/.test(c.product || "")) || null;
    const sol = (typeof insuranceSolution === "function") ? (() => { try { return insuranceSolution(m); } catch (e) { return null; } })() : null;
    const stats = (typeof cohortInsStats === "function") ? (() => { try { return cohortInsStats(); } catch (e) { return null; } })() : null;
    return { connected: contracts.length > 0, contracts, silson, solution: sol,
      peer: stats ? { silsonRate: Math.round(stats.silsonRate * 100), avgMonthly: Math.round(stats.avgMonthly), avgContracts: Math.round(stats.avgContracts * 10) / 10 } : null };
  },
  /* ② 보장 사다리(M3-1) — 실손 확인 선행 → 미가입자 HTK 우선 충당 */
  ladderCheck(m) {
    m = m || _isMember(); if (!m) return null;
    const g = this.gap(m);
    const bal = (typeof tlBalance === "function") ? tlBalance(m) : 0;
    const insRes = (typeof htkInsReserve === "function") ? htkInsReserve(bal) : Math.floor(bal * 0.3);
    if (g && g.silson) return { stage: "custom", silson: g.silson, reserve: insRes, note: "실손 보장이 확인됐어요 — 추가 적립 토큰은 예측 위험 기반 맞춤보험에 쓸 수 있어요." };
    return { stage: "silson-first", reserve: insRes, note: "실손(기초 보장)이 아직 없어요 — 보험·치료비 적립금(" + insRes.toLocaleString() + " HTK)을 실손 가입·보험료에 우선 충당하는 것을 권해요.",
      legal: "※ 토큰의 보험료 충당은 보험업법 특별이익 제공 금지 규정 정합 검토 전제 · 가입은 GA 라이선스 채널 경유" };
  },
  /* ③ 납부 */
  bills(m) { m = m || _isMember(); return (typeof pbSummary === "function") ? pbSummary(m) : null; },
  pay(m, billId) { m = m || _isMember(); const r = (typeof pbPay === "function") ? pbPay(m, billId) : { ok: false }; return r; },
  topup(m, won) { m = m || _isMember(); return (typeof pbTopup === "function") ? pbTopup(m, won) : { ok: false }; },
  policyCreate(m, o) { m = m || _isMember(); return (typeof pbPolicyCreate === "function") ? pbPolicyCreate(m, o) : { ok: false }; },
  /* ④ 청구·지급 */
  claims() { return _claims().slice().reverse(); },
  claimStatus(id) { return _claims().find((c) => c.id === id) || null; },
  claimReview(m, id) { return claimReview(m || _isMember(), id); },
  claimPay(m, id) { return claimPay(m || _isMember(), id); },
  /* ⑤ 재산정 */
  rerate(m) { m = m || _isMember(); return { state: (typeof rerateState === "function") ? rerateState() : null, compute: rerateCompute(m) }; },
  rerateApply(m) { return rerateApplyReal(m || _isMember()); },
  /* ⑥ 나눔 (S2/S3 — sharingEngine 연동) */
  donateStatus() { return spSummary(); },
  donateApply(m, o) { m = m || _isMember(); return (typeof needApply === "function") ? needApply(m, o) : { ok: false, reason: "엔진 미탑재" }; },
  donateReview(m) { m = m || _isMember(); return (typeof myApplications === "function") ? myApplications(m) : []; },
  donateImpact() { return (typeof impactSummary === "function") ? impactSummary() : null; },
  /* 상담사 컨텍스트 인계 규약 — {tab, member요약, 진행 중 건} */
  ctx(tab, m) {
    m = m || _isMember();
    const bills = this.bills(m); const claims = _claims().filter((c) => !/지급/.test(c.status || ""));
    return { tab: tab || null, member: m ? { name: m.name, cohortIndex: m.cohortIndex || null } : null,
      pending: { bills: bills ? bills.unpaid.length : 0, claims: claims.length },
      rerate: (typeof rerateState === "function") ? rerateState().status : null,
      ladder: m ? (this.ladderCheck(m) || {}).stage : null, policy: INS_AI_POLICY };
  },
};
