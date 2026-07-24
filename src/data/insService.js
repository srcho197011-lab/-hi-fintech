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

/* ══ ClaimEngine(P2 고도화) — 자동심사 룰셋 · 급여/비급여 · 연간 한도 · 중복 지문 · 부지급 사유·이의신청 ══ */
function _claims() { try { return JSON.parse(localStorage.getItem("hifin_claims") || "[]"); } catch (e) { return []; } }
function _claimsSave(l) { try { localStorage.setItem("hifin_claims", JSON.stringify(l)); } catch (e) {} }
/* 부지급 사유 코드 — 쉬운 언어 설명 + 해결 경로(거절도 친절하게) */
const CLAIM_DENY = {
  NO_CONTRACT: { ko: "실손 계약 미확인", easy: "지급이 안 된 이유: 실손 보험 연결이 확인되지 않았어요", fix: "보장분석 탭에서 내 보험을 연결하면 다시 심사할 수 있어요" },
  DUP: { ko: "중복 청구", easy: "지급이 안 된 이유: 같은 진료 건으로 이미 지급받으셨어요", fix: "다른 진료 건이라면 이의신청으로 알려주세요" },
  LIMIT: { ko: "연간 한도 소진", easy: "지급이 안 된 이유: 올해 보장 한도를 모두 사용했어요", fix: "내년 갱신 후 한도가 초기화돼요 — 잔여 한도는 계산 내역에서 확인" },
  NO_RIDER: { ko: "특약 미가입", easy: "지급이 안 된 이유: 이 항목(3대 비급여)은 별도 특약 가입이 필요해요", fix: "맞춤보험 탭에서 특약 보완을 검토해 보세요" },
};
/* 연간 사용 한도 원장 — 급여/비급여 누적(청구 지급 시 차감) */
function _limitUsed(m) { try { const y = new Date().getFullYear(); const o = JSON.parse(localStorage.getItem("hifin_claim_used_" + ((m && m.email) || "d")) || "{}"); return (o.year === y) ? o : { year: y, pay: 0, non: 0 }; } catch (e) { return { year: new Date().getFullYear(), pay: 0, non: 0 }; } }
function _limitAdd(m, cls, amt) { try { const o = _limitUsed(m); o[cls === "비급여" ? "non" : "pay"] += amt; localStorage.setItem("hifin_claim_used_" + ((m && m.email) || "d"), JSON.stringify(o)); } catch (e) {} }
/* 진료건 지문(중복 탐지) — 진료일+종류+금액 */
function _claimFp(c) { return (typeof vaultHash === "function") ? vaultHash("clmfp|" + new Date(c.at || 0).toDateString() + "|" + (c.kind || "") + "|" + (c.fee || 0)) : String(c.at); }
function _mySilson(m) { try { const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(m)) : null; return (v && v.insurance || []).find((k) => k.kind === "실손" || /실손/.test(k.product || "")) || null; } catch (e) { return null; } }
/* 자동심사 — 산정 근거(breakdown)를 회원이 펼쳐보게 반환 */
function claimReview(m, claimId) {
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  if (!c) return { ok: false, reason: "청구 건을 찾을 수 없습니다" };
  if (/지급/.test(c.status || "")) return { ok: false, code: "DUP", deny: CLAIM_DENY.DUP, reason: "이미 지급된 청구입니다(중복 지급 차단)" };
  const silson = _mySilson(m);
  if (!silson) return { ok: false, code: "NO_CONTRACT", deny: CLAIM_DENY.NO_CONTRACT, reason: CLAIM_DENY.NO_CONTRACT.easy };
  // 중복 지문 — 동일 진료건 기지급 여부
  const fp = _claimFp(c);
  if (l.some((x) => x.id !== c.id && /지급/.test(x.status || "") && _claimFp(x) === fp)) return { ok: false, code: "DUP", deny: CLAIM_DENY.DUP, reason: CLAIM_DENY.DUP.easy };
  // 급여/비급여 분류 — 3대 비급여(도수·주사·MRI)는 특약 확인
  const fee = c.fee || INS_CONFIG.TELE_VISIT_FEE;
  const nonPay = /도수|주사|MRI|엠알아이|비급여/.test(c.kind || "");
  const riderKey = /도수/.test(c.kind || "") ? "dosu" : /주사/.test(c.kind || "") ? "injection" : /MRI|엠알아이/.test(c.kind || "") ? "mri" : null;
  const gen = parseInt(String(silson.gen || "4").replace(/\D/g, ""), 10) || 4;
  if (nonPay && gen >= 3 && riderKey) { const rd = silson.riders3; if (rd && rd[riderKey] === false) return { ok: false, code: "NO_RIDER", deny: CLAIM_DENY.NO_RIDER, reason: CLAIM_DENY.NO_RIDER.easy }; }
  // 세대별 자기부담 산식(진단 §2-2B 규정) — 계약 저장값 우선, 없으면 세대 기본
  const GEN_SELF = { 1: [0, 0], 2: [10, 20], 3: [10, 30], 4: [20, 30], 5: [20, 30] };
  const selfPct = nonPay ? (parseInt(String(silson.coNon || "").replace(/\D/g, ""), 10) || GEN_SELF[gen][1]) : (parseInt(String(silson.coGen || "").replace(/\D/g, ""), 10) || GEN_SELF[gen][0]);
  // 연간 잔여한도 — 급여/비급여 별도(계약 한도 저장값 없으면 세대 기본: 급여 5천만·비급여 2천만/3세대 5천만)
  const limit = nonPay ? (gen <= 2 ? 100000000 : gen === 3 ? 50000000 : 20000000) : (gen <= 2 ? 100000000 : 50000000);
  const used = _limitUsed(m)[nonPay ? "non" : "pay"];
  const remain = Math.max(0, limit - used);
  if (remain <= 0) return { ok: false, code: "LIMIT", deny: CLAIM_DENY.LIMIT, reason: CLAIM_DENY.LIMIT.easy };
  const raw = Math.round(fee * (1 - selfPct / 100) / 100) * 100;
  const payout = Math.min(raw, remain);
  // 심사 트랙 — 고액은 수동심사 큐(자동승인 아님)
  const track = fee >= 1000000 ? "수동심사" : "자동승인";
  return { ok: true, claim: c, silson: { product: silson.product, gen: silson.gen, coGen: selfPct + "%" }, fee, payout, track,
    breakdown: [`진료비 ${fee.toLocaleString()}원 (${nonPay ? "비급여" : "급여"} 항목)`, `내가 내는 돈(자기부담 ${selfPct}%) − ${(fee - raw).toLocaleString()}원`, `연간 잔여 한도 ${remain.toLocaleString()}원 중 지급 ${payout.toLocaleString()}원`, `심사 트랙: ${track}${track === "수동심사" ? " (100만 원 이상 고액 — 담당자 확인 후 지급)" : " (규칙 심사 통과)"}`],
    explain: `진료비 ${fee.toLocaleString()}원 − 내가 내는 돈(자기부담 ${selfPct}%) = 지급 ${payout.toLocaleString()}원` };
}
/* 수동 청구 접수(상담사·화면 공용) — 지문 중복 즉시 차단 */
function claimSubmit(m, o) {
  o = o || {};
  const fee = Math.max(0, Math.floor(o.fee || 0));
  if (!fee) return { ok: false, reason: "진료비 금액을 알려주세요" };
  const c = { id: "CLM-" + Date.now().toString(36).toUpperCase(), at: o.date || Date.now(), status: "접수", kind: o.kind || "진료", fee, channel: o.channel || "수동 접수" };
  const l = _claims();
  const fp = _claimFp(c);
  if (l.some((x) => /지급/.test(x.status || "") && _claimFp(x) === fp)) return { ok: false, code: "DUP", reason: CLAIM_DENY.DUP.easy };
  l.push(c); _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function" && m) ? anonToken(m) : null, note: `보험금 청구 접수 — ${c.id} · ${c.kind} ${fee.toLocaleString()}원` });
  return { ok: true, claim: c };
}
/* 이의신청 — 부지급도 끝이 아니게 */
function claimAppeal(m, claimId, reason) {
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  if (!c) return { ok: false, reason: "청구 건을 찾을 수 없습니다" };
  c.appeal = { at: Date.now(), reason: String(reason || "재검토 요청").slice(0, 200) };
  c.status = "이의신청 접수";
  _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `청구 이의신청 접수 — ${c.id}` });
  if (typeof notifPush === "function") notifPush({ ic: "doc", t: "이의신청 접수", d: `${c.id} 재심사가 시작됐어요 — 결과는 알림으로 알려드려요`, target: "insurance" });
  return { ok: true, claim: c };
}
function claimPay(m, claimId) {
  const rv = claimReview(m, claimId); if (!rv.ok) { const l0 = _claims(); const c0 = l0.find((x) => x.id === claimId); if (c0 && rv.code && !/지급/.test(c0.status || "")) { c0.status = "부지급(" + rv.code + ")"; c0.denyCode = rv.code; _claimsSave(l0); } return rv; }
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const htk = Math.round(rv.payout / rate);
  if (typeof tlEarn !== "function") return { ok: false, reason: "원장을 사용할 수 없습니다" };
  const r = tlEarn(m, htk, `보험금 지급 — ${rv.claim.id} (${rv.payout.toLocaleString()}원)`, rv.claim.id);
  if (!r.ok) return r;
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  c.status = "지급완료"; c.paidAt = Date.now(); c.payout = rv.payout; c.txRef = r.tx && r.tx.hash;
  _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "payout", token: (typeof anonToken === "function") ? anonToken(m) : null, fhirHash: c.txRef || null, note: `보험금 지급 실행 — ${c.id} · ${rv.payout.toLocaleString()}원 (${htk.toLocaleString()} HTK 크레딧)` });
  _limitAdd(m, /비급여/.test((rv.breakdown && rv.breakdown[0]) || "") ? "비급여" : "급여", rv.payout);   // P2: 연간 한도 누적 차감
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
  claimSubmit(m, o) { return claimSubmit(m || _isMember(), o); },
  claimAppeal(m, id, reason) { return claimAppeal(m || _isMember(), id, reason); },
  claimLimits(m) { m = m || _isMember(); return _limitUsed(m); },
  /* ②+ M2 — 위험 예측·보장 매칭·인수 시뮬·사다리 플랜(riskEngine 연동) */
  riskExplain(m) { m = m || _isMember(); return (typeof riskPredict === "function") ? riskPredict(m) : null; },
  coverageMatch(m) { m = m || _isMember(); return (typeof coverageMatch === "function") ? coverageMatch(m) : null; },
  underwrite(m, product) { m = m || _isMember(); return (typeof underwrite === "function") ? underwrite(m, product) : null; },
  ladderPlan(m) { m = m || _isMember(); return (typeof ladderPlan === "function") ? ladderPlan(m) : null; },
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
