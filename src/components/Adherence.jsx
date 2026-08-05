/* ══════════════ 복용 체크 · 성과 리포트 화면 ══════════════
   ① 오늘 복용 체크(1탭) → ② 순응률·연속일 → ③ 재검진 시 '함께 기록된 변화' → ④ 회원 동의 시 4세대 성과 자산 편입.
   정직성: 수치 변화를 제품 효과로 단정하지 않는다. 개선이 없어도 그대로 보여준다. */

function _adhMember() {
  try {
    return ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
      || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null);
  } catch (e) { return null; }
}

function AdherenceCard() {
  const m = _adhMember();
  const [tick, setTick] = useState(0); void tick;
  const [committed, setCommitted] = useState({});
  if (!m || typeof adhSummary !== "function") return null;
  const S = adhSummary(m);
  if (!S.items.length) return null;   // 구매·구독 이력이 있어야 의미가 있다
  const O = (typeof adhOutcome === "function") ? adhOutcome(m) : null;

  return (
    <div className="card" style={{ margin: "0 0 12px", border: "1.5px solid #BBF7D0", background: "linear-gradient(125deg,#F0FDF4,#F8FFFB)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#16A34A", display: "grid", placeItems: "center", flexShrink: 0 }}><Check size={19} color="#fff" /></span>
        <div style={{ flex: "1 1 200px" }}>
          <b style={{ fontSize: 14.5, color: "#166534" }}>오늘 복용 체크</b>
          <div style={{ fontSize: 11.8, color: "var(--muted)", marginTop: 2 }}>총 복용 {S.totalDays}일 · 평균 순응률 {S.avgRate}% · 오늘 {S.checkedToday}/{S.items.length} 완료</div>
        </div>
      </div>

      {/* 체크 목록 */}
      <div style={{ marginTop: 10 }}>
        {S.items.map((it) => (
          <div key={it.pid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "#fff", border: `1.5px solid ${it.checked ? "#BBF7D0" : "var(--border)"}`, borderRadius: 11, marginBottom: 7, flexWrap: "wrap" }}>
            <button onClick={() => { adhCheck(m, it.pid); setTick((t) => t + 1); if (typeof toast === "function") toast(it.checked ? "체크를 해제했어요" : `✅ ${it.name} 복용 체크 · ${it.streak + 1}일 연속`); }}
              style={{ width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer", background: it.checked ? "#16A34A" : "#EEF1F6", color: "#fff", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{it.checked ? "✓" : ""}</button>
            <div style={{ flex: "1 1 160px" }}>
              <b style={{ fontSize: 12.8, textDecoration: it.checked ? "none" : "none", color: it.checked ? "#166534" : "#334155" }}>{it.name}</b>
              <div style={{ fontSize: 11.2, color: "var(--muted)" }}>{it.category} · {it.total}일 복용 · 순응률 {it.rate}%{it.streak >= 3 ? ` · 🔥 ${it.streak}일 연속` : ""}</div>
            </div>
            <div style={{ minWidth: 66 }}>
              <div style={{ height: 6, background: "#EEF1F6", borderRadius: 999, overflow: "hidden" }}><div style={{ width: it.rate + "%", height: "100%", background: it.rate >= 70 ? "#16A34A" : it.rate >= 40 ? "#F59E0B" : "#EF4444" }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* 성과 리포트 */}
      {O && O.rows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.3, fontWeight: 800, color: "#14532D", marginBottom: 7 }}>📈 복용 기간과 함께 기록된 변화</div>
          {O.rows.slice(0, 3).map((r) => (
            <div key={r.pid + r.key} style={{ border: `1.5px solid ${r.better ? "#BBF7D0" : "var(--border)"}`, background: "#fff", borderRadius: 11, padding: "10px 12px", marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <b style={{ fontSize: 13 }}>{r.name}</b>
                <span style={{ fontSize: 14, fontWeight: 800, color: r.better ? "#16A34A" : "#B45309" }}>
                  {r.from}{r.unit} → {r.to}{r.unit} {r.better ? "↘ 개선 방향" : "↗ 관리 필요"}
                </span>
                <span style={{ fontSize: 11.3, color: "var(--muted)", marginLeft: "auto" }}>{r.fromYear} → {r.toYear}</span>
              </div>
              <div style={{ fontSize: 11.8, color: "#475569", marginTop: 5, lineHeight: 1.6 }}>
                {r.ing}({r.product}) <b>{r.days}일 복용 · 순응률 {r.rate}%</b> 기간과 함께 기록된 변화예요.
                <span style={{ color: "#94A3B8" }}> 생활습관·치료 등 다른 요인이 함께 작용하므로 제품의 효과로 단정하지 않아요.</span>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                {r.better && !committed[r.pid + r.key] && (
                  <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { adhCommitOutcome(m, r); setCommitted((c) => Object.assign({}, c, { [r.pid + r.key]: true })); if (typeof toast === "function") toast("4세대 성과 자산으로 기록했어요 — 데이터 금고에서 확인할 수 있어요"); }}>
                    🏅 성과 자산으로 기록하기
                  </button>
                )}
                {committed[r.pid + r.key] && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#16A34A", alignSelf: "center" }}>✅ 성과 자산 편입 완료(체인 기록)</span>}
                {r.better && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { try { if (typeof shopCartAdd === "function") shopCartAdd(r.pid, 1); } catch (e) {} if (typeof toast === "function") toast("이어서 관리할 제품을 담았어요"); }}>이 관리 이어가기</button>}
              </div>
            </div>
          ))}
          <div className="chnote">※ 변화는 검진 시점 간 비교이며, 인과관계를 증명하지 않습니다. 성과 자산은 회원이 동의한 경우에만 기록되고, 연구·품질 인증에 활용될 때 이용 대가가 환류됩니다.</div>
        </div>
      )}
      {O && !O.rows.length && (
        <div className="chnote" style={{ marginTop: 10 }}>다음 검진 결과가 연계되면 복용 기간과 함께 기록된 변화를 보여드릴게요 — 지금은 꾸준히 체크하는 것만으로 충분해요.</div>
      )}
    </div>
  );
}
