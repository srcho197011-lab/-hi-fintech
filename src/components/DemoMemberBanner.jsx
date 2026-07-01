/* 체험 회원 로그인 시 각 섹션 상단에 표시되는 개인 건강요약 배너 */
function DemoMemberBanner() {
  const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  if (!m) return null;
  const cg = demoCancerGrade(m.cancerRiskGrade);
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const items = [
    ["생체나이", m.biologicalAge + "세", null],
    ["간/췌장 나이", m.liverAge + "/" + m.pancreasAge + "세", null],
    ["암위험", m.cancerRiskGrade + "등급 · " + cg[0], cg[1]],
    ["고위험 암", (m.highRiskCancerTypes || []).join("·") || "-", null],
    ["금년 의료비", fmt(m.estimatedMedicalCost), null],
    ["10년 후 의료비", fmt(demoCostForecast(m.estimatedMedicalCost)), "#EF4444"],
  ];
  return (
    <div className="demoband">
      <div className="dbh"><span className="pa">{m.name[0]}</span>
        <div className="dbt"><b>{m.name}님 맞춤 건강요약</b><span>로그인한 체험 회원 데이터가 이 섹션에 반영됩니다.</span></div>
        <span className="demobadge"><AlertTriangle size={12} /> 시연용 예시 데이터</span></div>
      <div className="dbgrid">{items.map(([l, v, c]) => <div className="dbi" key={l}><span>{l}</span><b style={c ? { color: c } : null}>{v}</b></div>)}</div>
    </div>
  );
}
