/* ══════════════ S2/S3 — 나눔 지원 엔진 (NeedFinder · GrantEngine · DirectSettle · ImpactLedger) ══════════════
   진단 보고서 축5 잔여 구현. 원칙: 신속(심사 단계 최소)·적기적소(긴급도 스코어링)·효율(병원 직접 정산 — 수혜자 현금 비경유)·효과(성과 기록·환류).
   가드레일 ⓞ: 신청 정보는 최고 민감등급 — 공개는 통계·마스킹·증빙 해시만. ⓝ: 플랫폼 자체 재원의 약정 배분(기부금품법 모집 아님)·선정 기준 공개. */

/* 불가피한 상수(config) — 사유 주석(하드코딩 금지 원칙의 예외 등록) */
const SHARE_CONFIG = {
  GRANT_CAP: 500000,          // 1건 지원 상한(시연) — 실서비스는 기금 규모·심사위원회 규정으로 확정
  URGENT: [["항암|암\\s*치료|백혈병", 40], ["수술|중환자|응급", 30], ["입원", 20], ["투석|희귀", 25], ["치료비\\s*부담|생계", 10]],  // 긴급도 키워드 가중치(심사 기준 공개용)
  PARTNER_HOSPS: ["서울아산병원", "세브란스병원", "강북삼성병원", "분당서울대병원"],   // 직접 정산 제휴 의료기관(시연)
};

function _shApps() { try { return JSON.parse(localStorage.getItem("hifin_share_apply") || "[]"); } catch (e) { return []; } }
function _shSave(l) { try { localStorage.setItem("hifin_share_apply", JSON.stringify(l)); } catch (e) {} }

/* ── S2-1 NeedFinder — 신청 접수(중복 확인) + 긴급도 스코어링(기준 공개) ── */
function needUrgency(reason, member) {
  let score = 20, hits = [];   // 기본 20 — 신청 자체가 필요 신호
  SHARE_CONFIG.URGENT.forEach(([re, w]) => { if (new RegExp(re).test(reason)) { score += w; hits.push(re.split("|")[0].replace(/\\s\*/g, "")); } });
  try {
    if (member) {
      if (member.income === "저") { score += 15; hits.push("저소득"); }
      if ((member.diseases || []).some((d) => /암$/.test(d))) { score += 15; hits.push("암 이력"); }
      if (member.cohortIndex && typeof cohortInsurance === "function") { const r = cohortInsurance(member.cohortIndex); if (r && !r.hasSilson) { score += 15; hits.push("실손 미가입"); } }
    }
  } catch (e) {}
  score = Math.min(100, score);
  return { score, grade: score >= 70 ? "긴급" : score >= 45 ? "높음" : "보통", basis: hits };
}
function needApply(member, o) {
  o = o || {};
  const reason = String(o.reason || "").trim();
  if (reason.length < 10) return { ok: false, reason: "지원이 필요한 상황을 조금 더 자세히(10자 이상) 적어 주세요" };
  const l = _shApps();
  const email = (member && member.email) || "default";
  if (l.some((a) => a.email === email && a.status !== "집행 완료" && a.status !== "보류")) return { ok: false, reason: "이미 진행 중인 신청이 있어요 — 심사 결과를 먼저 확인해 주세요(중복 신청 방지)" };
  const u = needUrgency(reason, member);
  const app = { id: "GR-" + Date.now().toString(36).toUpperCase(), at: Date.now(), by: (member && member.name) || "회원", email,
    channel: o.channel || "본인 신청", reason, urgency: u, status: "심사 대기" };
  l.push(app); _shSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "grant-apply", token: (typeof anonToken === "function" && member) ? anonToken(member) : null, note: `치료비 지원 신청 접수 — ${app.id} · 긴급도 ${u.grade}(${u.score}점)` });
  return { ok: true, app };
}

/* ── S2-2 GrantEngine — 자격·배정 심사(공정성 규칙 공개) ── */
function grantReview(id) {
  const l = _shApps(); const a = l.find((x) => x.id === id);
  if (!a) return { ok: false, reason: "신청 건을 찾을 수 없습니다" };
  if (a.status === "집행 완료") return { ok: false, reason: "이미 집행 완료된 신청입니다" };
  const S = (typeof spSummary === "function") ? spSummary() : { balance: 0 };
  const rules = [];
  const dupPaid = l.some((x) => x.email === a.email && x.id !== id && x.status === "집행 완료" && (Date.now() - (x.settledAt || 0)) < 180 * 86400000);
  rules.push({ rule: "중복 수혜 확인(최근 180일)", pass: !dupPaid });
  rules.push({ rule: "긴급도 45점 이상(높음·긴급 우선)", pass: a.urgency.score >= 45 });
  rules.push({ rule: "기금 잔액 존재", pass: S.balance > 0 });
  const eligible = rules.every((r) => r.pass);
  const amount = eligible ? Math.min(SHARE_CONFIG.GRANT_CAP, S.balance) : 0;
  return { ok: true, app: a, rules, eligible, amount, fund: S.balance,
    note: eligible ? `배정 가능액 ${amount.toLocaleString()}원 (기금 잔액 ${S.balance.toLocaleString()}원 · 상한 ${SHARE_CONFIG.GRANT_CAP.toLocaleString()}원)` : "자격 규칙 미충족 — 보류(사유는 규칙별 표시)" };
}
function grantApprove(id) {
  const rv = grantReview(id); if (!rv.ok) return rv;
  const l = _shApps(); const a = l.find((x) => x.id === id);
  if (!rv.eligible) { a.status = "보류"; a.review = { at: Date.now(), rules: rv.rules }; _shSave(l); return { ok: false, reason: "자격 규칙 미충족 — 보류 처리(재신청 가능)", rules: rv.rules }; }
  a.status = "선정"; a.grant = { amount: rv.amount, at: Date.now() }; a.review = { at: Date.now(), rules: rv.rules };
  _shSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "grant", token: null, note: `나눔 지원 선정 — ${a.id} · ${rv.amount.toLocaleString()}원 배정(긴급도 ${a.urgency.grade})` });
  return { ok: true, app: a, amount: rv.amount };
}

/* ── S3-1 DirectSettle — 병원 직접 정산(수혜자 현금 비경유) + 기금 지출 원장 ── */
function directSettle(id) {
  const l = _shApps(); const a = l.find((x) => x.id === id);
  if (!a) return { ok: false, reason: "신청 건을 찾을 수 없습니다" };
  if (a.status !== "선정") return { ok: false, reason: "선정 상태의 신청만 집행할 수 있어요(현재: " + a.status + ")" };
  const amt = a.grant.amount;
  const S = (typeof spSummary === "function") ? spSummary() : { balance: 0 };
  if (S.balance < amt) return { ok: false, reason: `기금 잔액 부족(${S.balance.toLocaleString()}원) — 순환 적립을 기다려 주세요` };
  const hosp = SHARE_CONFIG.PARTNER_HOSPS[(a.id.charCodeAt(a.id.length - 1) || 0) % SHARE_CONFIG.PARTNER_HOSPS.length];   // 결정론 배정(시연)
  const out = (typeof spAppend === "function") ? spAppend({ source: "치료비 직접 정산 — " + hosp, amount: amt, ref: a.id, dir: -1 }) : null;
  if (!out) return { ok: false, reason: "기금 지출 기록 실패" };
  a.status = "집행 완료"; a.settledAt = Date.now(); a.settle = { hosp, amount: amt, txSeq: out.seq };
  _shSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "settle", token: null, note: `병원 직접 정산 — ${a.id} · ${hosp} · ${amt.toLocaleString()}원(수혜자 현금 비경유)` });
  if (typeof notifPush === "function") notifPush({ ic: "check", t: "치료비 지원 집행", d: `${hosp}에 ${amt.toLocaleString()}원이 직접 정산됐어요(나눔 기금)`, target: "insurance" });
  return { ok: true, app: a, hosp, amount: amt, fundAfter: (typeof spSummary === "function") ? spSummary().balance : null };
}

/* ── S3-2 ImpactLedger — 투명 공개(통계+마스킹+증빙만) · 성과 기록·환류 ── */
function _shMask(name) { const s = String(name || "회원"); return s[0] + "*".repeat(Math.max(1, s.length - 1)); }
function impactSummary() {
  const l = _shApps(); const S = (typeof spSummary === "function") ? spSummary() : { balance: 0, inTotal: 0, outTotal: 0 };
  const settled = l.filter((a) => a.status === "집행 완료");
  const avgDays = settled.length ? Math.round(settled.reduce((s, a) => s + Math.max(0, (a.settledAt - a.at)), 0) / settled.length / 86400000 * 10) / 10 : null;
  return { applied: l.length, pending: l.filter((a) => a.status === "심사 대기").length, granted: l.filter((a) => a.status === "선정").length,
    settledN: settled.length, settledTotal: settled.reduce((s, a) => s + (a.settle ? a.settle.amount : 0), 0),
    outcomes: l.filter((a) => a.outcome).length, avgDays, fund: S.balance, inTotal: S.inTotal, outTotal: S.outTotal,
    rows: settled.slice(-6).reverse().map((a) => ({ id: a.id, by: _shMask(a.by), hosp: a.settle.hosp, amount: a.settle.amount, at: a.settledAt, outcome: a.outcome || null })) };
}
function outcomeRecord(id, note) {
  const l = _shApps(); const a = l.find((x) => x.id === id);
  if (!a || a.status !== "집행 완료") return { ok: false, reason: "집행 완료 건만 성과를 기록할 수 있어요" };
  a.outcome = { note: note || "치료 진행·회복 확인", at: Date.now() };
  _shSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `나눔 성과 기록 — ${a.id} · ${a.outcome.note}(효과 측정·기준 환류)` });
  return { ok: true, app: a };
}
function myApplications(member) { const email = (member && member.email) || "default"; return _shApps().filter((a) => a.email === email).reverse(); }
