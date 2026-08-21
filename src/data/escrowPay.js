/* ══════════════ 선수납 · 공제정산 결제 엔진(escrowPay.js) ══════════════
   설계: 고객이 하이핀에서 검진비를 먼저 결제(PG) → 수검 완료까지 대금 예치(Escrow)
        → 수검 확인 → 송객수수료 공제 후 검진기관 정산(D+n) → 자동 분개.
   제휴 대응: KIS정보통신 PG(매입)·Escrow(예치)·정산 대행 — 제안서 v1.1 §03 구조도의 실구현.
   ⚠️ 원칙:
     ① 회원 화면에는 결제 금액과 보호 안내만 — 송객수수료·정산 내역은 관리자 콘솔에서만(원가 비노출).
     ② 수수료 단가는 재무모델(finModel checkupFee) 단일 소스 참조 — 하드코딩 금지.
     ③ 결제·예치·정산의 모든 상태 전이는 체인 기록(chainAppend) — 사후 검증 가능.
     ④ 시연 환경: 실제 결제·정산은 일어나지 않으며 승인번호는 시뮬 값(화면에 고지). */

const ESC_STATUS = {
  PAID:     { ko: "결제완료 · 예치중", c: "#1D4ED8", bg: "#EFF6FF", desc: "고객 선결제 후 수검 완료까지 에스크로 예치" },
  VISITED:  { ko: "수검확인", c: "#B45309", bg: "#FFFBEB", desc: "검진기관 수검 완료 확인 — 정산 대기" },
  SETTLED:  { ko: "정산완료", c: "#15803D", bg: "#F0FDF4", desc: "송객수수료 공제 후 검진기관 지급 완료" },
  REFUNDED: { ko: "환불", c: "#B91C1C", bg: "#FEF2F2", desc: "미수검·취소 — 에스크로에서 고객 환불" },
};
const ESC_METHODS = [
  { k: "card", ko: "신용·체크카드", sub: "KIS VAN·PG 매입", ic: "card" },
  { k: "easy", ko: "간편결제", sub: "카카오·네이버·페이코", ic: "easy" },
  { k: "bank", ko: "계좌이체", sub: "실시간 계좌 승인", ic: "bank" },
];
/* 플랜별 표준 검진비 — 기관별 실가격이 없는 경우의 선결제 기준가(협의·기관 계약으로 확정).
   basic(국가검진)은 본인부담 0원이므로 결제 없음. 최종 금액은 항목·기관에 따라 정산 시 조정. */
const ESC_PLAN_PRICE = { basic: 0, standard: 350000, premium: 650000 };
const ESC_CFG = {
  settleDays: 3,          // 수검 확인 후 정산일(D+3) — 협의 확정 전 기본값
  pg: "KIS PG",           // 결제 대행(전자지급결제대행)
  escrow: "KIS Escrow",   // 결제대금예치
};
/* 송객수수료 — 재무모델 단일 소스(checkupFee). 미로드 시 보수 폴백 */
function escFee() {
  try { const P = (typeof finParams === "function") ? finParams() : null; if (P && P.checkupFee) return P.checkupFee; } catch (e) {}
  return 25000;
}
function _escKey() { return "hifin_escrow_orders"; }
function escAll() { try { return JSON.parse(localStorage.getItem(_escKey()) || "[]"); } catch (e) { return []; } }
function _escSave(l) { try { localStorage.setItem(_escKey(), JSON.stringify(l.slice(-300))); } catch (e) {} }
function escOrders(m) { const em = (m && m.email) || null; return escAll().filter((o) => !em || o.email === em); }
function escFind(id) { return escAll().find((o) => o.id === id) || null; }
function _escAuth(seed) {   // PG 승인번호·에스크로 예치번호(시뮬) — 결정론
  let h = 2166136261; const s = String(seed);
  for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; }
  return String(h % 100000000).padStart(8, "0");
}
function escWon(n) { return (Math.round(n) || 0).toLocaleString() + "원"; }

/* ── ① 선결제 — 고객이 하이핀에서 검진비 전액 결제 → 에스크로 예치 ── */
function escPay(m, o) {
  o = o || {};
  const amount = Math.max(0, Math.round(o.amount || 0));
  if (!amount) return { ok: false, reason: "결제 금액이 없어요." };
  const method = ESC_METHODS.find((x) => x.k === (o.method || "card")) || ESC_METHODS[0];
  const at = Date.now();
  const id = "ESC-" + at.toString(36).toUpperCase();
  const fee = escFee();
  const order = {
    id, at, email: (m && m.email) || "self", name: (m && m.name) || "회원",
    center: o.center || "검진기관", brand: o.brand || "", date: o.date || "", time: o.time || "",
    plan: o.plan || "", amount, method: method.k, methodKo: method.ko,
    pgAuth: _escAuth("pg" + id), escrowId: "ESW-" + _escAuth("esw" + id),
    fee, payout: Math.max(0, amount - fee),   // 공제 후 검진기관 지급액(관리자 화면 전용)
    status: "PAID", visitedAt: 0, settledAt: 0, refundedAt: 0, refundReason: "",
    sim: true,   // 시연 결제(실 승인 아님)
  };
  const l = escAll(); l.push(order); _escSave(l);
  try {
    const tk = (typeof anonToken === "function" && m) ? anonToken(m) : null;
    if (typeof chainAppend === "function") chainAppend({ type: "record", token: tk, note: `검진비 선결제 ${escWon(amount)} — ${order.center} · ${ESC_CFG.pg} 승인 ${order.pgAuth} · ${ESC_CFG.escrow} 예치(수검 완료 시 정산)` });
    if (typeof vaultAccessLog === "function" && tk) vaultAccessLog(tk, "member", `검진비 선결제(${order.center})`);
  } catch (e) {}
  try { if (typeof notifPush === "function") notifPush({ ic: "check", t: "검진비 결제 완료", d: `${order.center} ${order.date} ${order.time} · ${escWon(amount)} — 수검 완료까지 안전하게 예치돼요.`, target: "checkup" }); } catch (e) {}
  return { ok: true, order };
}
/* ── ② 수검 확인 — 검진기관 수검 완료(시스템 이벤트) ── */
function escConfirmVisit(id) {
  const l = escAll(); const o = l.find((x) => x.id === id);
  if (!o) return { ok: false, reason: "주문을 찾을 수 없어요." };
  if (o.status !== "PAID") return { ok: false, reason: "예치중 상태에서만 수검 확인이 가능해요." };
  o.status = "VISITED"; o.visitedAt = Date.now();
  _escSave(l);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `수검 확인 — ${o.id} · ${o.center} (정산 예정 D+${ESC_CFG.settleDays})` }); } catch (e) {}
  return { ok: true, order: o };
}
/* ── ③ 공제 정산 — 검진비에서 송객수수료를 공제하고 검진기관에 지급 ── */
function escSettle(id) {
  const l = escAll(); const o = l.find((x) => x.id === id);
  if (!o) return { ok: false, reason: "주문을 찾을 수 없어요." };
  if (o.status !== "VISITED") return { ok: false, reason: "수검 확인 후에만 정산할 수 있어요." };
  o.status = "SETTLED"; o.settledAt = Date.now();
  _escSave(l);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `공제 정산 — ${o.id} · 결제 ${escWon(o.amount)} − 수수료 ${escWon(o.fee)} = ${o.center} 지급 ${escWon(o.payout)}` }); } catch (e) {}
  return { ok: true, order: o };
}
/* ── ④ 환불 — 미수검·취소 시 에스크로에서 고객 환불(수수료 미발생) ── */
function escRefund(id, reason) {
  const l = escAll(); const o = l.find((x) => x.id === id);
  if (!o) return { ok: false, reason: "주문을 찾을 수 없어요." };
  if (o.status === "SETTLED") return { ok: false, reason: "정산 완료 건은 환불 처리할 수 없어요(기관 협의 필요)." };
  if (o.status === "REFUNDED") return { ok: false, reason: "이미 환불된 건이에요." };
  o.status = "REFUNDED"; o.refundedAt = Date.now(); o.refundReason = reason || "고객 취소";
  _escSave(l);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `에스크로 환불 — ${o.id} · ${escWon(o.amount)} 전액 반환(${o.refundReason}) · 수수료 미발생` }); } catch (e) {}
  return { ok: true, order: o };
}
/* ── 집계 — 관리자 정산 콘솔·재무 연동(예수금=계약부채) ── */
function escStats() {
  const l = escAll();
  const s = { n: l.length, paid: 0, visited: 0, settled: 0, refunded: 0,
    escrowBalance: 0, feeRevenue: 0, payoutTotal: 0, gmv: 0 };
  l.forEach((o) => {
    s.gmv += o.amount;
    if (o.status === "PAID") { s.paid++; s.escrowBalance += o.amount; }
    else if (o.status === "VISITED") { s.visited++; s.escrowBalance += o.amount; }
    else if (o.status === "SETTLED") { s.settled++; s.feeRevenue += o.fee; s.payoutTotal += o.payout; }
    else if (o.status === "REFUNDED") s.refunded++;
  });
  return s;
}
/* 회원 화면용 요약 — 수수료·지급액 제외(원가 비노출 원칙) */
function escMemberView(o) {
  if (!o) return null;
  return { id: o.id, at: o.at, center: o.center, date: o.date, time: o.time, amount: o.amount,
    methodKo: o.methodKo, pgAuth: o.pgAuth, escrowId: o.escrowId, status: o.status, statusKo: ESC_STATUS[o.status].ko, sim: o.sim };
}
/* 시연 시드 — 관리자 콘솔이 비어 보이지 않도록 최초 1회 생성(결정론) */
function escSeedDemo() {
  if (escAll().length) return false;
  const base = Date.now();
  const seed = [
    ["KMI한국의학연구소", 480000, "card", "SETTLED", 12],
    ["한신메디피아검진센터", 350000, "easy", "SETTLED", 9],
    ["세브란스체크업", 620000, "card", "VISITED", 4],
    ["차움검진센터", 890000, "card", "PAID", 2],
    ["하나로의료재단", 290000, "bank", "PAID", 1],
    ["서울아산건강증진센터", 410000, "card", "REFUNDED", 6],
  ];
  const l = [];
  seed.forEach(([center, amount, method, status, daysAgo], i) => {
    const at = base - daysAgo * 86400000;
    const id = "ESC-D" + String(i + 1).padStart(3, "0");
    const fee = escFee();
    const d = new Date(at);
    l.push({ id, at, email: "demo@cohort.sim", name: "코호트 회원",
      center, brand: "", date: `${d.getMonth() + 1}/${d.getDate()}`, time: "09:00", plan: "",
      amount, method, methodKo: (ESC_METHODS.find((x) => x.k === method) || ESC_METHODS[0]).ko,
      pgAuth: _escAuth("pg" + id), escrowId: "ESW-" + _escAuth("esw" + id),
      fee, payout: Math.max(0, amount - fee), status,
      visitedAt: (status === "VISITED" || status === "SETTLED") ? at + 86400000 : 0,
      settledAt: status === "SETTLED" ? at + 4 * 86400000 : 0,
      refundedAt: status === "REFUNDED" ? at + 2 * 86400000 : 0,
      refundReason: status === "REFUNDED" ? "고객 일정 취소(미수검)" : "", sim: true, demo: true });
  });
  _escSave(l);
  return true;
}
