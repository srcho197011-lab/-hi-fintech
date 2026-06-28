function MedicalCostCard({ member }) {
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const cost10 = demoCostForecast(member.estimatedMedicalCost);
  return (
    <div className="card">
      <div className="rct"><Banknote size={18} color="#16A34A" /> 의료비 예측</div>
      <div className="democost">
        <div className="dc"><div className="l">금년도 예상 의료비</div><div className="v">{fmt(member.estimatedMedicalCost)}</div></div>
        <div className="dc"><div className="l">10년 후 예상 (×1.4)</div><div className="v" style={{ color: "#EF4444" }}>{fmt(cost10)}</div></div>
      </div>
    </div>
  );
}
