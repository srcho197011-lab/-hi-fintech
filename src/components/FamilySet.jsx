/* ══════════════ 가족 건강 세트 화면 — 한 번의 상담이 3~4명의 관리로 ══════════════
   본인은 검진 수치 근거, 가족은 연령·성별 기반 일반 권장(건강정보 미사용).
   묶음 혜택은 가격 할인이 아니라 적립 가산 — 판매가를 훼손하지 않으면서 객단가를 올린다. */

function _fsMember() {
  try {
    return ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
      || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null);
  } catch (e) { return null; }
}
function _fsWon(n) { return (Math.round(n) || 0).toLocaleString() + "원"; }

function FamilySetCard({ onGo }) {
  const m = _fsMember();
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);
  if (!m || typeof famSetBuild !== "function") return null;
  const set = famSetBuild(m);
  if (!set || set.count < 2) return null;   // 가족이 있어야 세트가 의미 있다

  const keys = sel || set.members.reduce((o, x) => Object.assign(o, { [x.key]: true }), {});
  const chosen = set.members.filter((x) => keys[x.key]);
  const chosenItems = chosen.reduce((s, x) => s + x.items.length, 0);
  const chosenTotal = chosen.reduce((s, x) => s + x.items.reduce((t, i) => t + i.product.price, 0), 0);
  const chosenBase = chosen.reduce((s, x) => s + x.items.reduce((t, i) => t + ((typeof healthReward === "function") ? healthReward(i.product.price).reward : Math.floor(i.product.price * 0.25)), 0), 0);
  const rate = chosen.length >= 4 ? 0.15 : chosen.length >= 3 ? 0.10 : chosen.length >= 2 ? 0.05 : 0;
  const chosenReward = chosenBase + Math.floor(chosenBase * rate);
  const toggle = (k) => setSel(Object.assign({}, keys, { [k]: !keys[k] }));

  return (
    <div className="card" style={{ margin: "0 0 12px", border: "1.5px solid #FBCFE8", background: "linear-gradient(125deg,#FFF5F9,#FFF9FC)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#DB2777", display: "grid", placeItems: "center", flexShrink: 0 }}><HeartHandshake size={18} color="#fff" /></span>
        <div style={{ flex: "1 1 220px" }}>
          <b style={{ fontSize: 14.5, color: "#9D174D" }}>우리 가족 건강 세트</b>
          <div style={{ fontSize: 11.8, color: "var(--muted)", marginTop: 2 }}>가족 {set.count}명 · {set.itemCount}종 · 묶음 적립 보너스 최대 15%</div>
        </div>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "6px 12px", fontSize: 11.5 }} onClick={() => setOpen((v) => !v)}>{open ? "접기" : "구성 보기"}</button>
      </div>

      {!open && (
        <div style={{ fontSize: 12.3, color: "#831843", marginTop: 8, lineHeight: 1.65 }}>
          {set.members.map((x) => x.name).join(" · ")}의 나이·성별에 맞는 기본 관리를 한 번에 챙길 수 있어요 — 합계 {_fsWon(set.total)} · 적립 <b>{_fsWon(set.reward)}</b>
        </div>
      )}

      {open && (<>
        {set.members.map((mm) => (
          <div key={mm.key} style={{ border: `1.5px solid ${keys[mm.key] ? "#FBCFE8" : "var(--border)"}`, background: "#fff", borderRadius: 12, padding: "10px 12px", marginTop: 9, opacity: keys[mm.key] ? 1 : .6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <button onClick={() => toggle(mm.key)} style={{ width: 26, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: keys[mm.key] ? "#DB2777" : "#EEF1F6", color: "#fff", fontWeight: 800, flexShrink: 0 }}>{keys[mm.key] ? "✓" : ""}</button>
              <b style={{ fontSize: 13 }}>{mm.name}</b>
              <span style={{ fontSize: 11.3, color: "var(--muted)" }}>{mm.relation}{mm.age ? ` · ${mm.age}세` : ""}{mm.group ? ` · ${mm.group}` : ""}</span>
              <span style={{ fontSize: 10.8, fontWeight: 800, marginLeft: "auto", color: mm.items[0].basis === "검진" ? "#1D4ED8" : "#9D174D", background: mm.items[0].basis === "검진" ? "#EEF3FF" : "#FDF2F8", borderRadius: 999, padding: "3px 9px" }}>
                {mm.items[0].basis === "검진" ? "내 검진 수치 근거" : "연령·성별 일반 권장"}
              </span>
            </div>
            {mm.items.map((it) => (
              <div key={it.product.id} style={{ fontSize: 12, color: "#475569", marginTop: 7, paddingLeft: 35, lineHeight: 1.55 }}>
                <b style={{ color: "#334155" }}>{it.ing}</b> · {it.product.name} <b>{_fsWon(it.product.price)}</b>
                <div style={{ fontSize: 11.3, color: "var(--muted)" }}>{it.why}</div>
              </div>
            ))}
          </div>
        ))}

        <div className="csum" style={{ marginTop: 11 }}>
          <div><span>선택 {chosen.length}명 · {chosenItems}종</span><b>{_fsWon(chosenTotal)}</b></div>
          <div className="rew"><span><Coins size={12} /> 적립(묶음 보너스 {Math.round(rate * 100)}% 포함)</span><b>{_fsWon(chosenReward)}</b></div>
        </div>
        <button className="cbtn pri" style={{ margin: "8px 0 0" }} disabled={!chosen.length} onClick={() => {
          const n = famSetAdd(set, keys);
          if (typeof toast === "function") toast(`🛒 가족 세트 ${n}종을 담았어요 — 묶음 적립 보너스 ${Math.round(rate * 100)}% 적용`);
        }}><ShoppingCart size={15} /> 선택한 {chosen.length}명 세트 담기 ({_fsWon(chosenTotal)})</button>

        <div className="chnote" style={{ marginTop: 9 }}>
          ※ 가족 구성원의 추천은 <b>나이·성별에 따른 일반 권장</b>이며, 가족의 건강검진 정보는 <b>본인 동의 없이 조회·활용되지 않습니다</b>. 건강기능식품은 치료제가 아니며, 복용 중인 약이 있으면 의사·약사와 상의하세요. 이미 드시는 성분과 중복되지 않는지 확인해 주세요.
        </div>
        {onGo && <button className="cbtn" style={{ margin: "8px 0 0" }} onClick={() => onGo("mypage")}><HeartHandshake size={14} /> 가족 등록·동의 관리로 이동</button>}
      </>)}
    </div>
  );
}
