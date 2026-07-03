function HealthWalletCard({ member, onGo }) {
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const w = demoWalletCalc(member);
  const go = onGo || (() => {});
  return (
    <div className="card">
      <div className="rct"><Wallet size={18} color="#16A34A" /> 건강지갑 예상 적립</div>
      <div className="demowallet">
        <div className="wr"><span>기본 적립금</span><b>{fmt(w.base)}</b></div>
        {w.focus > 0 && <div className="wr"><span>집중관리 리워드 (암위험 6등급↑)</span><b>+{fmt(w.focus)}</b></div>}
        {w.practice > 0 && <div className="wr"><span>건강실천 리워드 (관리포인트 3개↑)</span><b>+{fmt(w.practice)}</b></div>}
        <div className="wr total"><span>총 예상 적립액</span><b>{fmt(w.total)}</b></div>
      </div>
      <button className="cbtn pri" style={{ marginTop: 12 }} onClick={() => go("wallet")}><Wallet size={15} /> 건강지갑으로 보험료 부담 줄이기</button>
    </div>
  );
}
