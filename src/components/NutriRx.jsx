/* ══════════════ 내 결핍 처방전 화면 — 검진 수치 근거 + 원클릭 담기 ══════════════
   "이 제품 좋아요"가 아니라 "성래님 중성지방 182이라서 오메가3부터예요"로 말한다.
   안전 우선: 진료가 먼저인 항목은 제품보다 위에, 중복·상호작용은 담기 전에 알린다. */

function _rxMember() {
  try {
    return ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
      || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null);
  } catch (e) { return null; }
}
function _rxWon(n) { return (Math.round(n) || 0).toLocaleString() + "원"; }

function NutriRxCard({ compact }) {
  const m = _rxMember();
  const [open, setOpen] = useState(!compact);
  const [added, setAdded] = useState({});
  if (!m || typeof nutriRx !== "function") return null;
  const R = nutriRx(m);
  if (!R) return null;
  const nm = m.name || "회원";
  const hasRx = R.rx.length > 0;

  const addOne = (p, ing) => {
    try { if (typeof shopCartAdd === "function") shopCartAdd(p.id, 1); } catch (e) {}
    setAdded((a) => Object.assign({}, a, { [p.id]: true }));
    if (typeof toast === "function") toast(`🛒 ${p.name} 담았어요 — ${ing} 보충`);
  };
  const addAll = () => {
    let n = 0;
    R.rx.forEach((x) => { const p = x.products[0]; if (p) { try { shopCartAdd(p.id, 1); } catch (e) {} setAdded((a) => Object.assign({}, a, { [p.id]: true })); n++; } });
    if (typeof toast === "function") toast(`🛒 처방전 ${n}종을 장바구니에 담았어요`);
  };

  return (
    <div className="card" style={{ margin: "0 0 12px", border: "1.5px solid #C7D8FA", background: "linear-gradient(125deg,#F8FAFF,#F4F8FF)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#1D4ED8", display: "grid", placeItems: "center", flexShrink: 0 }}><FileText size={18} color="#fff" /></span>
        <div style={{ flex: "1 1 220px" }}>
          <b style={{ fontSize: 14.5, color: "#14337A" }}>{nm}님의 결핍 처방전</b>
          <div style={{ fontSize: 11.8, color: "var(--muted)", marginTop: 2 }}>
            {R.asOf ? `${R.asOf}년 검진 기준` : "최근 검진 기준"}{R.grade ? ` · 판정 ${R.grade}` : ""}{R.abnormalN ? ` · 관리 필요 ${R.abnormalN}개 항목` : ""}
          </div>
        </div>
        {compact && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "6px 12px", fontSize: 11.5 }} onClick={() => setOpen((v) => !v)}>{open ? "접기" : "펼치기"}</button>}
      </div>

      {/* 골든타임 — 검진 확인 직후 */}
      {R.golden && (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "7px 11px", marginTop: 9 }}>
          🎯 검진 결과를 확인한 지 {R.daysSince === 0 ? "오늘" : `${R.daysSince}일`}이에요 — 지금이 관리 시작에 가장 좋은 시점이에요.
        </div>
      )}

      {open && (<>
        {/* ① 진료 우선 — 제품보다 위에 */}
        {R.medical.map((x) => (
          <div key={x.key} style={{ marginTop: 10, border: "1.5px solid #FECACA", background: "#FEF2F2", borderRadius: 11, padding: "10px 12px" }}>
            <b style={{ fontSize: 13, color: "#B91C1C" }}>🩺 {x.name} {x.value != null ? `${x.value}${x.unit}` : ""} — 제품보다 진료가 먼저예요</b>
            <div style={{ fontSize: 12, color: "#7F1D1D", marginTop: 4, lineHeight: 1.6 }}>{x.note} 권장 진료과: <b>{x.dept}</b></div>
          </div>
        ))}

        {/* ② 혈당 — 식이·운동 우선 안내 */}
        {R.glucose.map((g, i) => (
          <div key={i} style={{ marginTop: 10, border: "1px solid #F3DFB6", background: "#FFFBEB", borderRadius: 11, padding: "10px 12px", fontSize: 12, color: "#78550F", lineHeight: 1.6 }}>
            <b>{g.name} {g.value}{g.unit}</b> — {g.note}
          </div>
        ))}

        {/* ③ 중복 경고 */}
        {R.dup.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11.8, color: "#B45309", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 9, padding: "7px 11px" }}>
            ⚠️ {R.dup.join("·")}는 이미 드시고 있어요 — 중복 섭취가 되지 않게 기존 제품을 먼저 확인하세요.
          </div>
        )}

        {/* ④ 처방 목록 */}
        {hasRx ? (<>
          <div style={{ margin: "12px 0 6px", fontSize: 12.3, color: "#334155", fontWeight: 700 }}>내 수치가 말하는 우선순위</div>
          {R.rx.map((x, i) => (
            <div key={x.ing} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 12, padding: "11px 13px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: i === 0 ? "#1D4ED8" : "#EEF3FF", color: i === 0 ? "#fff" : "#1D4ED8", borderRadius: 999, padding: "3px 10px" }}>{i + 1}순위</span>
                <b style={{ fontSize: 13.5 }}>{x.ing}</b>
                <span style={{ fontSize: 11.5, color: x.sev >= 2 ? "#DC2626" : "#B45309", fontWeight: 700 }}>{x.name} {x.value}{x.unit}</span>
              </div>
              <div style={{ fontSize: 12.2, color: "#475569", margin: "6px 0 8px", lineHeight: 1.65 }}>{x.why}</div>
              {x.caution && <div style={{ fontSize: 11.3, color: "#92400E", background: "#FFFBEB", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>⚠️ {x.caution}</div>}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {x.products.map((p) => (
                  <button key={p.id} className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 12px", fontSize: 11.5, background: added[p.id] ? "#16A34A" : undefined, color: added[p.id] ? "#fff" : undefined }}
                    onClick={() => addOne(p, x.ing)}>
                    {added[p.id] ? "✓ 담김 · " : "🛒 "}{p.name} {_rxWon(p.price)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button className="cbtn pri" style={{ margin: 0, width: "auto", padding: "10px 16px", fontSize: 12.5 }} onClick={addAll}><ShoppingCart size={14} /> 처방전 {R.rx.length}종 한 번에 담기</button>
          </div>
        </>) : (
          R.general.map((g, i) => <div key={i} style={{ marginTop: 10, fontSize: 12.3, color: "#475569", lineHeight: 1.7 }}>{g}</div>)
        )}

        <div className="chnote" style={{ marginTop: 10 }}>
          ※ 건강기능식품은 <b>치료제가 아니며</b>, 본 안내는 검진 수치를 참고한 <b>일반 정보</b>입니다 — 진단·처방이 아니에요. 복용 중인 약이 있으면 의사·약사와 상의하세요. 근거가 없는 성분은 처방전에 넣지 않습니다.
        </div>
      </>)}
    </div>
  );
}
