/* ══════════════ P1 PremiumBilling — 실보험료 수납 엔진 (계약 원장 + 월납 청구 + 수납 상태머신) ══════════════
   진단 보고서(HIFIN-AUDIT-INS-20260724) 축1 Phase 1 구현. (P1-1 계약·청구·상태머신 / P1-2 온램프·잔액 차감 / P1-3 체인 앵커)
   원칙:
   - 계약(PolicyLedger)·청구서(Bill)는 회원별 localStorage 원장에 영속 — 화면 카운터가 아니라 레코드.
   - 수납은 TokenLedger(C1-1) 차감을 통과해야 성립 — 잔액 부족이면 수납 자체가 기록되지 않는다.
   - 상태머신: 청구 → (납기+7일) 유예 → (납기+30일) 미납 → (미납 3회) 실효. 읽기 시점 lazy 평가(데모: 크론 없음).
   - 체인 앵커: 계약 체결(policy)·수납(premium)·실효(policy-lapse)를 해시체인에 기록 — 진단 #27 "수납 미기록" 갭 해소.
   - 충전(온램프)은 시연 PG 시뮬 — 현금→HTK 유입(선불 방향)만 허용, 역방향(현금화)은 RegGate가 차단. */

/* ── 저장/조회 ── */
function _pbEmail(m) { return (typeof m === "string") ? (m || "default") : ((m && m.email) || "default"); }
function pbPolicies(m) { try { return JSON.parse(localStorage.getItem("hifin_policies_" + _pbEmail(m)) || "[]"); } catch (e) { return []; } }
function _pbSavePolicies(m, a) { try { localStorage.setItem("hifin_policies_" + _pbEmail(m), JSON.stringify(a)); } catch (e) {} }
function pbBills(m) { try { return JSON.parse(localStorage.getItem("hifin_bills_" + _pbEmail(m)) || "[]"); } catch (e) { return []; } }
function _pbSaveBills(m, a) { try { localStorage.setItem("hifin_bills_" + _pbEmail(m), JSON.stringify(a)); } catch (e) {} }
function _pbYm(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function _pbToken(m) { return (typeof anonToken === "function" && m && typeof m !== "string") ? anonToken(m) : null; }

/* ── 계약 체결(PolicyLedger) — 같은 상품의 유효 계약이 있으면 재사용(멱등, 데모 반복 대비) ── */
function pbPolicyCreate(m, o) {
  o = o || {};
  const pols = pbPolicies(m);
  const dup = pols.find((p) => p.product === o.product && p.status === "active");
  if (dup) return { ok: true, policy: dup, existed: true };
  const pol = { id: o.policyNo || ("POL-" + Date.now().toString(36).toUpperCase()), product: o.product || "맞춤보험",
    monthly: Math.max(0, Math.floor(o.monthly || 0)), cover: o.cover || null, term: o.term || "1년(자동갱신)", pay: o.pay || "wallet",
    start: _pbYm(), status: "active", createdAt: Date.now() };
  pols.push(pol); _pbSavePolicies(m, pols);
  if (typeof chainAppend === "function") chainAppend({ type: "policy", token: _pbToken(m), note: `보험계약 체결 — ${pol.product} · 월 ${pol.monthly.toLocaleString()}원 (${pol.id})` });
  pbEnsureBills(m);
  return { ok: true, policy: pol };
}

/* ── 청구서 생성 + 상태머신(lazy) — 유효 계약의 시작월~당월 청구서를 보장하고 미납 단계 평가 ── */
function pbEnsureBills(m) {
  const pols = pbPolicies(m); if (!pols.length) return pbBills(m);
  const bills = pbBills(m);
  const now = new Date();
  let changed = false;
  pols.filter((p) => p.status === "active" && p.monthly > 0).forEach((p) => {
    const [sy, sm] = p.start.split("-").map(Number);
    const cur = new Date(sy, sm - 1, 1);
    while (cur <= now) {
      const ym = _pbYm(cur);
      if (!bills.some((b) => b.policyId === p.id && b.ym === ym)) {
        bills.push({ id: "BILL-" + p.id.slice(-5) + "-" + ym.replace("-", ""), policyId: p.id, product: p.product, ym, amount: p.monthly,
          due: ym + "-25", status: "청구", attempts: 0, createdAt: Date.now() });
        changed = true;
      }
      cur.setMonth(cur.getMonth() + 1);
    }
  });
  // 상태머신 — 납기 경과 평가(수납 전 청구서만)
  bills.forEach((b) => {
    if (b.status === "수납" || b.status === "실효처리") return;
    const past = (now - new Date(b.due + "T00:00:00")) / 86400000;
    const next = past > 30 ? "미납" : past > 7 ? "유예" : "청구";
    if (b.status !== next) { b.status = next; changed = true; }
  });
  // 미납 3회 → 계약 실효(체인 기록) + 해당 청구 실효처리
  pols.forEach((p) => {
    if (p.status !== "active") return;
    const overdue = bills.filter((b) => b.policyId === p.id && b.status === "미납");
    if (overdue.length >= 3) {
      p.status = "lapsed"; changed = true;
      overdue.forEach((b) => { b.status = "실효처리"; });
      if (typeof chainAppend === "function") chainAppend({ type: "policy-lapse", token: _pbToken(m), note: `계약 실효 — ${p.product} (${p.id}) · 3회 연속 미납` });
    }
  });
  if (changed) { _pbSaveBills(m, bills); _pbSavePolicies(m, pols); }
  return bills;
}

/* ── 수납 — TokenLedger 차감(이중지불·잔액 검증) 통과 시에만 성립, 체인 앵커(premium) ── */
function pbPay(m, billId) {
  const bills = pbBills(m);
  const b = bills.find((x) => x.id === billId);
  if (!b) return { ok: false, reason: "청구서를 찾을 수 없습니다" };
  if (b.status === "수납") return { ok: false, reason: "이미 수납된 청구서입니다" };
  if (b.status === "실효처리") return { ok: false, reason: "실효된 계약의 청구서입니다 — 부활은 별도 심사가 필요해요" };
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const htk = Math.ceil(b.amount / rate);
  if (typeof tlSpend !== "function") return { ok: false, reason: "토큰 원장을 사용할 수 없습니다" };
  const r = tlSpend(m, htk, `보험료 납입 ${b.ym} · ${b.product} (${b.amount.toLocaleString()}원)`, "spend", b.id);
  if (!r.ok) { b.attempts = (b.attempts || 0) + 1; _pbSaveBills(m, bills); return { ok: false, reason: r.reason + ` — 필요 ${htk.toLocaleString()} HTK`, attempts: b.attempts }; }
  b.status = "수납"; b.paidAt = Date.now(); b.method = "HTK"; b.htk = htk; b.txRef = r.tx && r.tx.hash;
  _pbSaveBills(m, bills);
  const block = (typeof chainAppend === "function") ? chainAppend({ type: "premium", token: _pbToken(m), fhirHash: b.txRef || null, note: `보험료 수납 — ${b.product} ${b.ym} · ${b.amount.toLocaleString()}원 (${htk.toLocaleString()} HTK)` }) : null;
  if (typeof vaultAccessLog === "function" && _pbToken(m)) vaultAccessLog(_pbToken(m), "수납 엔진", `보험료 수납 ${b.ym}`);
  // 축5 S1-1: 수납 발생 시 순환 마진의 30%를 나눔 재원에 건별 적립(연출 아님 — SharingPool 원장 tx)
  if (typeof spAppend === "function" && typeof INS_CONFIG !== "undefined") spAppend({ source: "보험료 수납 마진", amount: b.amount * INS_CONFIG.PREMIUM_MARGIN_RATE * INS_CONFIG.SHARE_RATE, ref: b.id, token: _pbToken(m) });
  if (typeof notifPush === "function") notifPush({ ic: "coin", t: "보험료 수납 완료", d: `${b.product} ${b.ym} · ${b.amount.toLocaleString()}원 — 순환의 30%가 나눔 재원에 적립됐어요`, target: "insurance" });
  return { ok: true, bill: b, balance: r.balance, block };
}

/* ── 충전(온램프 시연 PG) — 현금→HTK 유입(선불 방향만). 역방향 현금화는 RegGate 차단 ── */
function pbTopup(m, won) {
  won = Math.max(0, Math.floor(won || 0));
  if (!won) return { ok: false, reason: "충전 금액을 입력하세요" };
  if (won > 2000000) return { ok: false, reason: "1회 충전 한도(200만 원)를 초과했어요" };
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const htk = Math.floor(won / rate);
  if (typeof tlAppend !== "function") return { ok: false, reason: "토큰 원장을 사용할 수 없습니다" };
  const r = tlAppend(m, { type: "topup", amount: htk, memo: `충전 ${won.toLocaleString()}원 → ${htk.toLocaleString()} HTK (시연 PG)` });
  if (!r.ok) return r;
  if (typeof txAnchor === "function") txAnchor({ ttype: "tx", token: _pbToken(m), kind: "지갑 충전", amount: won, unit: "원", memo: "시연 PG · 선불 충전" });
  return { ok: true, htk, balance: r.balance };
}

/* ── 요약 — 화면용 ── */
function pbSummary(m) {
  const bills = pbEnsureBills(m);
  const pols = pbPolicies(m);
  const unpaid = bills.filter((b) => b.status !== "수납" && b.status !== "실효처리");
  const paid = bills.filter((b) => b.status === "수납");
  return { policies: pols, bills: bills.slice().sort((a, b2) => b2.ym.localeCompare(a.ym)), unpaid, paidCount: paid.length,
    paidTotal: paid.reduce((s, b) => s + b.amount, 0), balance: (typeof tlBalance === "function") ? tlBalance(m) : null };
}
