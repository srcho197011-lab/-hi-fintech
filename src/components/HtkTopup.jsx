/* ══════════════ 나의 건강지갑 › 충전 — HTK 충전 시스템(htk-topup 리포에서 이식) ══════════════
   원본: htk-topup 모노레포(NestJS+Next, 이중기입 원장·PortOne V2 어댑터·vitest 36/36)의 플로우를
   데모 스택(TokenLedger·localStorage)으로 이식. 동일 원칙 유지:
   - 금액의 진실은 서버(패키지 정의) — 화면은 금액을 만들지 않는다
   - 결제 확정은 [서명 웹훅 → 조회 재검증 → 금액 대조] 통과 시에만 원장 적립(MOCK 시뮬로 재현·위변조 공격 버튼 포함)
   - 한도(1회 100만·월 200만) · 환불(보너스 제외·미사용분) · 폐쇄형 정직 표기 */

const TOPUP_PKGS = [
  { code: "P5000", price: 5000, htk: 500, bonus: 0 },
  { code: "P10000", price: 10000, htk: 1000, bonus: 30 },
  { code: "P30000", price: 30000, htk: 3000, bonus: 150 },
  { code: "P50000", price: 50000, htk: 5000, bonus: 350 },
  { code: "P100000", price: 100000, htk: 10000, bonus: 1000 },
];
const TOPUP_LIMIT = { perTx: 1000000, perMonth: 2000000 };   // 전금법 대비 한도(설정값)

function _tuKey(m) { return "hifin_topup_orders_" + ((m && m.email) || "default"); }
function _tuOrders(m) { try { return JSON.parse(localStorage.getItem(_tuKey(m)) || "[]"); } catch (e) { return []; } }
function _tuSave(m, l) { try { localStorage.setItem(_tuKey(m), JSON.stringify(l)); } catch (e) {} }

/* 주문 생성 — 한도(월, 진행 중 포함) 검증 */
function tuCreateOrder(m, code) {
  const pkg = TOPUP_PKGS.find((p) => p.code === code);
  if (!pkg) return { ok: false, reason: "존재하지 않는 충전 상품입니다" };
  const l = _tuOrders(m);
  const monthSum = l.filter((o) => Date.now() - o.at < 30 * 86400000 && ["CREATED", "PENDING_DEPOSIT", "PAID"].includes(o.status)).reduce((s, o) => s + o.amountKrw, 0);
  if (monthSum + pkg.price > TOPUP_LIMIT.perMonth) return { ok: false, reason: `월 충전 한도(${TOPUP_LIMIT.perMonth.toLocaleString()}원)를 초과해요 — 이번 달 누적 ${monthSum.toLocaleString()}원` };
  const o = { id: "TOD-" + Date.now().toString(36).toUpperCase(), code, amountKrw: pkg.price, htk: pkg.htk + pkg.bonus, bonus: pkg.bonus, status: "CREATED", at: Date.now() };
  l.push(o); _tuSave(m, l);
  return { ok: true, order: o };
}
/* 결제 확정(웹훅 검증 시뮬) — paidAmount를 서버 주문 금액과 대조, 불일치면 적립 거부(원본의 AMOUNT_MISMATCH 재현) */
function tuConfirm(m, orderId, paidAmountKrw) {
  const l = _tuOrders(m); const o = l.find((x) => x.id === orderId);
  if (!o) return { ok: false, reason: "주문을 찾을 수 없습니다" };
  if (o.status === "PAID") return { ok: true, dup: true, order: o };   // 웹훅 중복 no-op
  if (paidAmountKrw !== o.amountKrw) {
    o.status = "FAILED"; o.fail = "AMOUNT_MISMATCH"; _tuSave(m, l);
    if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `충전 결제 금액 위·변조 감지 — ${o.id} 승인 ${Number(paidAmountKrw).toLocaleString()}원 ≠ 주문 ${o.amountKrw.toLocaleString()}원 · 적립 거부` });
    return { ok: false, reason: "결제 금액 위·변조가 감지되어 적립이 거부됐어요(정상 방어)", code: "AMOUNT_MISMATCH" };
  }
  const r = (typeof tlAppend === "function") ? tlAppend(m, { type: "topup", amount: o.htk, memo: `충전 ${o.amountKrw.toLocaleString()}원 → ${o.htk.toLocaleString()} HTK${o.bonus ? ` (보너스 +${o.bonus})` : ""} · ${o.id}`, ref: o.id }) : { ok: false, reason: "원장 사용 불가" };
  if (!r.ok) return r;
  o.status = "PAID"; o.paidAt = Date.now(); o.txRef = r.tx && r.tx.hash; _tuSave(m, l);
  if (typeof chainAppend === "function") chainAppend({ type: "tx", token: (typeof anonToken === "function") ? anonToken(m) : null, fhirHash: o.txRef || null, note: `HTK 충전 수납 — ${o.id} · ${o.amountKrw.toLocaleString()}원 (금액 대조 통과)` });
  if (typeof notifPush === "function") notifPush({ ic: "coin", t: "충전 완료", d: `+${o.htk.toLocaleString()} HTK가 지갑에 들어왔어요(${o.amountKrw.toLocaleString()}원)`, target: "wallet" });
  return { ok: true, order: o, balance: r.balance };
}
/* 환불 — 원본 정책 이식: 보너스 제외·지갑 잔액 상한·미사용분 */
function tuRefund(m, orderId) {
  const l = _tuOrders(m); const o = l.find((x) => x.id === orderId);
  if (!o || o.status !== "PAID") return { ok: false, reason: "환불 가능한 주문이 아니에요" };
  const bal = (typeof tlBalance === "function") ? tlBalance(m) : 0;
  const refundable = Math.max(0, Math.min(o.htk - o.bonus, bal));   // 보너스 제외·잔액 상한
  if (refundable <= 0) return { ok: false, reason: "환불 가능액이 없어요(보너스 제외·사용분 차감)" };
  const r = tlSpend(m, refundable, `충전 환불 — ${o.id} (${(refundable * 10).toLocaleString()}원 환급 처리)`, "spend", o.id);
  if (!r.ok) return r;
  o.status = refundable === o.htk - o.bonus ? "REFUNDED" : "PARTIAL_REFUNDED"; o.refundedHtk = refundable; _tuSave(m, l);
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `충전 환불 — ${o.id} · ${refundable.toLocaleString()} HTK(${(refundable * 10).toLocaleString()}원) 회수` });
  if (typeof notifPush === "function") notifPush({ ic: "doc", t: "환불 완료", d: `${o.id} · ${(refundable * 10).toLocaleString()}원 환급 처리(시연)`, target: "wallet" });
  return { ok: true, refundedHtk: refundable, balance: r.balance };
}

function HtkTopupSection() {
  const [tick, setTick] = useState(0); void tick;
  const [pkg, setPkg] = useState("P30000");
  const [method, setMethod] = useState("카드");
  const [agree, setAgree] = useState(false);
  const [payWin, setPayWin] = useState(null);    // 주문(MOCK 결제창)
  const [result, setResult] = useState(null);    // {kind:success|pending|fail, ...}
  const m = (typeof insService !== "undefined") ? insService.member() : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  if (!m) return <div className="chnote">로그인 후 이용할 수 있어요.</div>;
  const bal = (typeof tlSync === "function") ? (tlSync(m) ?? 0) : 0;
  const sel = TOPUP_PKGS.find((p) => p.code === pkg);
  const orders = _tuOrders(m).slice().reverse();

  const startPay = () => {
    const r = tuCreateOrder(m, pkg);
    if (!r.ok) { if (typeof toast === "function") toast("🔒 " + r.reason); return; }
    setResult(null); setPayWin(r.order);
  };
  const approve = (tamper, virtual) => {
    const o = payWin;
    if (virtual) { const l = _tuOrders(m); const x = l.find((y) => y.id === o.id); x.status = "PENDING_DEPOSIT"; _tuSave(m, l); setPayWin(null); setResult({ kind: "pending", order: o }); setTick((t) => t + 1); return; }
    const r = tuConfirm(m, o.id, tamper ? 1000 : o.amountKrw);
    setPayWin(null);
    setResult(r.ok ? { kind: "success", order: r.order, balance: r.balance } : { kind: "fail", reason: r.reason, code: r.code });
    setTick((t) => t + 1);
  };
  const deposit = (o) => { const r = tuConfirm(m, o.id, o.amountKrw); setResult(r.ok ? { kind: "success", order: r.order, balance: r.balance } : { kind: "fail", reason: r.reason }); setTick((t) => t + 1); };

  return (
    <div style={{ marginTop: 4 }}>
      {/* 잔액 + 결과 배너 */}
      <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
        <div className="rct"><Coins size={17} color="#2563EB" /> HTK 충전 <span className="cbadge" style={{ marginLeft: 8, color: "#1D4ED8", background: "#EAF0FE" }}>잔액 {bal.toLocaleString()} HTK ≈ {won(bal * 10)}</span></div>
        {result && result.kind === "success" && <div style={{ background: "#E7F8EE", border: "1px solid #BBF7D0", borderRadius: 12, padding: "10px 14px", margin: "4px 0 10px", fontSize: 13 }}>🎉 <b>충전 완료!</b> +{result.order.htk.toLocaleString()} HTK — 웹훅 서명·금액 대조를 통과해 원장에 기록됐어요. (잔액 {result.balance.toLocaleString()})</div>}
        {result && result.kind === "pending" && <div style={{ background: "#FEF3E2", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px", margin: "4px 0 10px", fontSize: 13 }}>🏦 <b>가상계좌 입금 대기</b> — 입금이 확인되면 자동 적립돼요. <button className="cbtn" style={{ width: "auto", margin: "6px 0 0", padding: "6px 12px", fontSize: 11.5 }} onClick={() => deposit(result.order)}>입금 완료 시뮬레이션</button></div>}
        {result && result.kind === "fail" && <div style={{ background: "#FDECEC", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", margin: "4px 0 10px", fontSize: 13 }}>🛑 <b>충전이 완료되지 않았어요</b> — {result.reason}{result.code === "AMOUNT_MISMATCH" && <span style={{ color: "#15803D", fontWeight: 700 }}> ✓ 보안 방어 정상 동작</span>}</div>}
        {/* 패키지 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, margin: "6px 0 10px" }}>
          {TOPUP_PKGS.map((p) => (
            <div key={p.code} onClick={() => setPkg(p.code)} style={{ position: "relative", textAlign: "center", padding: "12px 8px", borderRadius: 12, cursor: "pointer", border: pkg === p.code ? "2px solid #2563EB" : "1.5px solid var(--border)", background: pkg === p.code ? "#EFF6FF" : "#fff" }}>
              {p.bonus > 0 && <span style={{ position: "absolute", top: -8, right: -4, background: "#F97316", color: "#fff", fontSize: 9.5, fontWeight: 800, borderRadius: 99, padding: "2px 7px" }}>+{p.bonus} 보너스</span>}
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{won(p.price)}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{p.htk.toLocaleString()} HTK{p.bonus ? ` +${p.bonus}` : ""}</div>
            </div>))}
        </div>
        {/* 결제수단 + 약관 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {["카드", "계좌이체", "가상계좌", "카카오페이", "네이버페이", "토스페이"].map((k) => (
            <button key={k} className="cbtn" onClick={() => setMethod(k)} style={{ width: "auto", margin: 0, padding: "7px 12px", fontSize: 11.5, border: method === k ? "1.5px solid #2563EB" : undefined, color: method === k ? "#1D4ED8" : undefined, background: method === k ? "#EFF6FF" : undefined }}>{k}</button>))}
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--muted)" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
          <span>선불 포인트 충전 약관·환불 정책(보너스 제외·미사용분 한정)에 동의합니다. 한도: 1회 100만·월 200만 원.</span>
        </label>
        <button className="cbtn pri" style={{ marginTop: 10, opacity: agree ? 1 : .5 }} disabled={!agree} onClick={startPay}><Coins size={15} /> {won(sel.price)} 충전하기 — {sel.htk.toLocaleString()} HTK{sel.bonus ? ` (+보너스 ${sel.bonus})` : ""}</button>
        <div className="chnote" style={{ marginTop: 8 }}>※ 시연 결제(MOCK — 실제 청구 없음). 실서비스는 PortOne V2 멀티 PG로 카드·간편결제·가상계좌를 연동하며, 확정은 항상 <b>웹훅 서명·조회 재검증·금액 대조</b> 후에만 원장에 기록돼요. HTK는 폐쇄형 포인트(현금 아님·양도 불가) — 선불전자지급수단 해당 여부는 전자금융거래법 검토 전제.</div>
      </div>

      {/* 충전·환불 내역 */}
      <div className="card">
        <div className="rct"><FileText size={16} color="#7C3AED" /> 충전 주문 내역</div>
        {orders.length ? orders.slice(0, 6).map((o) => (
          <div className="costrow" key={o.id}><span className="cl">{new Date(o.at).toLocaleDateString("ko-KR")} · {o.id} · {won(o.amountKrw)}</span>
            <span className="cv" style={{ color: o.status === "PAID" ? "var(--green)" : o.status === "FAILED" ? "#B91C1C" : "#B45309" }}>{({ PAID: `+${o.htk.toLocaleString()} HTK`, FAILED: "위변조 차단", PENDING_DEPOSIT: "입금 대기", CREATED: "미결제", REFUNDED: `환불 −${(o.refundedHtk || 0).toLocaleString()}`, PARTIAL_REFUNDED: `부분환불 −${(o.refundedHtk || 0).toLocaleString()}` })[o.status] || o.status}</span>
            <span className="ca">{o.status === "PAID" ? <button className="cbtn" style={{ width: "auto", margin: 0, padding: "4px 9px", fontSize: 10.5 }} onClick={() => { const r = tuRefund(m, o.id); if (typeof toast === "function") toast(r.ok ? `환불 완료 — ${r.refundedHtk.toLocaleString()} HTK 회수(잔액 ${r.balance.toLocaleString()})` : "🔒 " + r.reason); setTick((t) => t + 1); }}>환불</button> : o.status === "PENDING_DEPOSIT" ? <button className="cbtn" style={{ width: "auto", margin: 0, padding: "4px 9px", fontSize: 10.5 }} onClick={() => deposit(o)}>입금시뮬</button> : "—"}</span>
          </div>)) : <p style={{ fontSize: 12.5, color: "var(--muted)" }}>아직 충전 내역이 없어요 — 위에서 첫 충전을 해보세요. 충전·사용 전 건은 온체인 원장 탭에서 검증할 수 있어요.</p>}
      </div>

      {/* MOCK 결제창 모달 */}
      {payWin && (
        <div className="bkov" onClick={() => setPayWin(null)}><div className="bk" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <div className="bkh"><div className="bt">🔒 MOCK 결제창 <span style={{ fontSize: 10.5, color: "#B45309" }}>시연 — 실제 청구 없음</span></div></div>
          <div className="bkb" style={{ padding: 18 }}>
            <div className="costrow"><span className="cl">상품</span><span className="cv">HTK 충전 ({payWin.htk.toLocaleString()} HTK)</span><span className="ca" /></div>
            <div className="costrow"><span className="cl">결제수단</span><span className="cv">{method}</span><span className="ca" /></div>
            <div className="costrow"><span className="cl">결제금액</span><span className="cv" style={{ fontWeight: 800, color: "var(--blue)" }}>{won(payWin.amountKrw)}</span><span className="ca" /></div>
            <button className="cbtn pri" style={{ marginTop: 10 }} onClick={() => approve(false, method === "가상계좌")}>{method === "가상계좌" ? "가상계좌 발급받기" : `${won(payWin.amountKrw)} 결제하기`}</button>
            <button className="cbtn" style={{ marginTop: 8, borderColor: "#FDBA74", color: "#B45309" }} onClick={() => approve(true, false)}>⚠ 금액 위변조 공격 시뮬(1,000원 승인) — 서버가 막는지 보기</button>
            <div className="chnote" style={{ marginTop: 8 }}>두 번째 버튼은 보안 시연: 조작된 승인은 금액 대조에서 거부되고 HTK가 적립되지 않아요.</div>
          </div>
        </div></div>)}
    </div>
  );
}
