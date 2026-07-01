/* 체험 회원 보험추천 카드 (기존 InsuranceRecommendationCard와 이름 충돌 방지 위해 DemoInsuranceCard) */
function DemoInsuranceCard({ member, onGo }) {
  const recs = demoInsuranceRecs(member);
  const go = onGo || (() => {});
  return (
    <div className="card">
      <div className="rct"><ShieldCheck size={18} color="#2F5BEA" /> 맞춤형 보험 추천</div>
      <div className="demorecs">{recs.map((r, i) => <div className="drec" key={i}><div className="rt"><ShieldCheck size={14} color="#2F5BEA" /> {r[0]}</div><div className="rd">{r[1]}</div></div>)}</div>
      <div className="gorow" style={{ marginTop: 10 }}><button className="gobtn pri" onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><Sparkles size={14} /> 맞춤 보험 추천받기</button><button className="gobtn" onClick={() => go("insurance")}><ShieldCheck size={14} /> 보험 보기</button></div>
    </div>
  );
}
