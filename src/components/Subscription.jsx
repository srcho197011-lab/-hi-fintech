/* ══════════════ 정기배송(구독) 화면 — 소진 임박 알림 · 내 정기배송 관리 ══════════════
   설계: 매출은 '재구매'에서 나온다. 떨어질 때쯤 먼저 알려주고, 건너뛰기로 이탈 대신 쉬어가게 한다.
   원칙: 자동 결제는 회원 확인 2단계 · 언제든 해지(위약금 없음) · 원가·마진 비노출(적립금만 표기). */

function _subMember() {
  try {
    return ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
      || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null);
  } catch (e) { return null; }
}
function _subWon(n) { return (Math.round(n) || 0).toLocaleString() + "원"; }
function _subDate(ts) { try { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()}`; } catch (e) { return "-"; } }

/* ── 소진 임박 배너 — 영양제몰 상단(끊김 방지의 첫 접점) ── */
function SubDueBanner({ onGoManage }) {
  const m = _subMember();
  const [tick, setTick] = useState(0); void tick;
  if (!m || typeof subDue !== "function") return null;
  const due = subDue(m, 7);
  if (!due.length) return null;
  const d = due[0];
  const products = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const p = products.find((x) => x.id === (d.pid || (d.sub && d.sub.pid)));
  return (
    <div className="card" style={{ border: "1.5px solid #FED7AA", background: "linear-gradient(120deg,#FFF7ED,#FFFBEB)", margin: "0 0 12px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 24 }}>⏳</span>
        <div style={{ flex: "1 1 260px" }}>
          <b style={{ fontSize: 14, color: "#9A3412" }}>{d.days === 0 ? `${d.name}, 오늘이면 다 떨어져요` : `${d.name}, ${d.days}일 뒤면 다 떨어져요`}</b>
          <div style={{ fontSize: 12.3, color: "#7C2D12", marginTop: 4, lineHeight: 1.6 }}>
            {d.kind === "sub"
              ? <>다음 정기배송은 <b>{_subDate(d.nextShipAt)}</b> 예정이에요. 더 빨리 필요하면 지금 받기로 앞당길 수 있어요.</>
              : <>끊기면 그동안의 관리가 리셋돼요 — 정기배송으로 등록하면 떨어지기 전에 알아서 도착해요.</>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {d.kind === "sub"
            ? <button className="cbtn pri" style={{ margin: 0, width: "auto", padding: "9px 15px", fontSize: 12 }} onClick={() => { subShipNow(m, d.id); setTick((t) => t + 1); if (typeof toast === "function") toast("지금 발송으로 앞당겼어요 — 적립도 함께 반영됐어요"); }}>지금 받기</button>
            : p && <button className="cbtn pri" style={{ margin: 0, width: "auto", padding: "9px 15px", fontSize: 12 }} onClick={() => { const c = subCycleOptions(p, d.order.qty); subCreate(m, p, d.order.qty, c.recommend); setTick((t) => t + 1); if (typeof toast === "function") toast(`정기배송 등록 완료 — ${c.recommend}일마다 배송`); }}>정기배송 등록</button>}
          <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 15px", fontSize: 12 }} onClick={() => onGoManage && onGoManage()}>내 정기배송</button>
        </div>
      </div>
      {due.length > 1 && <div className="chnote" style={{ marginTop: 8 }}>이 외에 {due.length - 1}건이 곧 소진 예정이에요 — 내 정기배송에서 한 번에 확인할 수 있어요.</div>}
    </div>
  );
}

/* ── 주문 완료 직후 구독 전환 제안 — 전환율이 가장 높은 순간 ── */
function SubOfferAfterOrder({ items, onDone }) {
  const m = _subMember();
  const [done, setDone] = useState(false);
  if (!m || !items || !items.length || typeof subCycleOptions !== "function") return null;
  const main = items.slice().sort((a, b) => (b.p.price * b.qty) - (a.p.price * a.qty))[0];
  if (!main || !main.p) return null;
  const c = subCycleOptions(main.p, main.qty);
  if (done) return <div className="chnote" style={{ marginTop: 8, color: "#166534" }}>✅ 정기배송이 등록됐어요 — 다음 배송 전에 미리 알려드릴게요(건너뛰기·해지 언제든 가능).</div>;
  return (
    <div style={{ border: "1.5px solid #C7D8FA", background: "#F8FAFF", borderRadius: 12, padding: "12px 14px", margin: "10px 0 4px", textAlign: "left" }}>
      <b style={{ fontSize: 13, color: "#14337A" }}>이 제품, {c.estDays}일이면 다 드세요</b>
      <div style={{ fontSize: 12.2, color: "#475569", margin: "5px 0 9px", lineHeight: 1.6 }}>
        {main.p.name} 기준 하루 {subPerDay(main.p)}회 섭취 시 약 <b>{c.estDays}일분</b>이에요. 떨어지기 전에 도착하도록 <b>{c.recommend}일 주기 정기배송</b>으로 등록할까요? 유지하시면 <b>적립 10% 추가</b>돼요.
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {c.options.map((cy) => (
          <button key={cy} className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 13px", fontSize: 11.8, background: cy === c.recommend ? "#1D4ED8" : undefined, color: cy === c.recommend ? "#fff" : undefined }}
            onClick={() => { subCreate(m, main.p, main.qty, cy); setDone(true); if (typeof toast === "function") toast(`정기배송 등록 — ${cy}일마다 배송`); if (onDone) onDone(); }}>
            {cy}일마다{cy === c.recommend ? " (추천)" : ""}
          </button>
        ))}
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 13px", fontSize: 11.8, color: "#64748B" }} onClick={() => setDone(true)}>지금은 괜찮아요</button>
      </div>
      <div className="chnote" style={{ marginTop: 7 }}>※ 자동 발송 전 항상 미리 알려드리고, 건너뛰기·주기 변경·해지가 언제든 가능해요(위약금 없음).</div>
    </div>
  );
}

/* ── 내 정기배송 관리 ── */
function SubscriptionPanel() {
  const m = _subMember();
  const [tick, setTick] = useState(0); void tick;
  if (!m) return <div className="card" style={{ margin: 0 }}><div className="chnote">로그인하면 내 정기배송을 관리할 수 있어요.</div></div>;
  const subs = subList(m).filter((s) => s.status !== "canceled");
  const S = subSummary(m);
  const canceled = subList(m).filter((s) => s.status === "canceled").length;

  return (
    <div>
      <div className="card" style={{ margin: "0 0 12px", background: "linear-gradient(125deg,#0B1F4B,#1D4ED8)", color: "#fff" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div><div style={{ fontSize: 11.5, opacity: .8 }}>진행 중 정기배송</div><b style={{ fontSize: 22 }}>{S.count}건</b></div>
          <div><div style={{ fontSize: 11.5, opacity: .8 }}>월 예상 금액</div><b style={{ fontSize: 22 }}>{_subWon(S.monthly)}</b></div>
          {S.next && <div><div style={{ fontSize: 11.5, opacity: .8 }}>다음 배송</div><b style={{ fontSize: 18 }}>{_subDate(S.next.nextShipAt)} · {S.next.name}</b></div>}
        </div>
        <div style={{ fontSize: 11.3, opacity: .82, marginTop: 9, lineHeight: 1.6 }}>정기배송은 떨어지기 전에 도착하게 하는 장치예요 — 건너뛰기·주기 변경·해지가 언제든 가능하고 위약금이 없어요.</div>
      </div>

      {!subs.length && (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 6 }}><RefreshCw size={15} color="#1D4ED8" /> 아직 정기배송이 없어요</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
            영양제는 <b>끊기는 순간 관리가 리셋</b>돼요. 자주 드시는 제품을 정기배송으로 두면 떨어지기 전에 도착하고, 유지하실 때마다 <b>적립이 10% 추가</b>돼요.
            {canceled > 0 && <> (해지한 정기배송 {canceled}건은 언제든 다시 시작할 수 있어요.)</>}
          </div>
        </div>
      )}

      {subs.map((s) => {
        const dLeft = Math.max(0, Math.round((s.runOutAt - Date.now()) / 86400000));
        const pct = Math.max(0, Math.min(100, Math.round((dLeft / Math.max(1, s.estDays)) * 100)));
        const paused = s.status === "paused";
        return (
          <div key={s.id} className="card" style={{ margin: "0 0 10px", border: paused ? "1.5px dashed var(--border)" : "1.5px solid var(--border)", opacity: paused ? .75 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 14 }}>{s.name}</b> <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.brand} · {s.qty}개 · {s.cycle}일마다</span>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  {paused ? "일시정지 중" : <>다음 배송 <b style={{ color: "#1D4ED8" }}>{_subDate(s.nextShipAt)}</b> · {s.shipped}회차 발송 완료{s.skipped ? ` · ${s.skipped}회 건너뜀` : ""}</>}
                </div>
              </div>
              <b style={{ fontSize: 15, color: dLeft <= 7 ? "#DC2626" : "#334155" }}>{dLeft}일치 남음</b>
            </div>
            <div style={{ height: 8, background: "#EEF1F6", borderRadius: 999, overflow: "hidden", margin: "9px 0 10px" }}>
              <div style={{ width: pct + "%", height: "100%", background: dLeft <= 7 ? "linear-gradient(90deg,#F97316,#DC2626)" : "linear-gradient(90deg,#1D4ED8,#0EA5E9)" }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!paused && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { subShipNow(m, s.id); setTick((t) => t + 1); if (typeof toast === "function") toast("지금 발송했어요 — 적립도 반영됐어요"); }}>지금 받기</button>}
              {!paused && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { subSkip(m, s.id); setTick((t) => t + 1); if (typeof toast === "function") toast("이번 회차를 건너뛰었어요"); }}>이번엔 건너뛰기</button>}
              {[30, 60, 90].filter((c) => c !== s.cycle).map((c) => (
                <button key={c} className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { subChangeCycle(m, s.id, c); setTick((t) => t + 1); if (typeof toast === "function") toast(`배송 주기를 ${c}일로 변경했어요`); }}>{c}일 주기로</button>
              ))}
              {paused
                ? <button className="cbtn pri" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { subResume(m, s.id); setTick((t) => t + 1); if (typeof toast === "function") toast("정기배송을 재개했어요"); }}>재개하기</button>
                : <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { subPause(m, s.id); setTick((t) => t + 1); if (typeof toast === "function") toast("일시정지했어요 — 언제든 재개할 수 있어요"); }}>일시정지</button>}
              <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5, color: "#B91C1C" }} onClick={() => { subCancel(m, s.id); setTick((t) => t + 1); if (typeof toast === "function") toast("해지했어요 — 위약금은 없어요"); }}>해지</button>
            </div>
            {s.history && s.history.length > 0 && (
              <details style={{ marginTop: 8 }}><summary style={{ cursor: "pointer", fontSize: 11.3, color: "var(--muted)", fontWeight: 700 }}>배송·변경 이력 {s.history.length}건</summary>
                <div style={{ marginTop: 5 }}>{[...s.history].reverse().slice(0, 6).map((h, i) => (
                  <div key={i} style={{ fontSize: 11.3, color: "#475569", padding: "3px 2px" }}>{_subDate(h.at)} · {h.ev}</div>
                ))}</div>
              </details>
            )}
          </div>
        );
      })}
      <div className="chnote">※ 시연 환경에서는 결제·배송이 목업으로 동작하며, 적립은 건강금융지갑에 실제 반영됩니다. 자동 발송 전에는 항상 사전 안내가 나가고, 회원이 건너뛰기·해지를 선택할 수 있습니다.</div>
    </div>
  );
}
