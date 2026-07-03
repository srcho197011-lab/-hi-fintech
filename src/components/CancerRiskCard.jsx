function CancerRiskCard({ member }) {
  const cg = demoCancerGrade(member.cancerRiskGrade);
  return (
    <div className="card">
      <div className="rct"><ShieldCheck size={18} color={cg[1]} /> 암위험도</div>
      <div className="democancer">
        <div className="cgbox" style={{ color: cg[1], background: cg[2] }}><div className="g">{member.cancerRiskGrade}<span>/10</span></div><div className="gl">{cg[0]}</div></div>
        <div style={{ flex: 1 }}><div className="cgl">상대적 고위험 암</div><div className="cgchips">{(member.highRiskCancerTypes || []).map((c) => <span className="cgchip" key={c}>{c}</span>)}</div>
          <div className="scale" style={{ marginTop: 10 }}>{Array.from({ length: 10 }).map((_, i) => <span className="seg" key={i} style={{ background: i < member.cancerRiskGrade ? cg[1] : "#EEF1F8" }} />)}</div></div>
      </div>
    </div>
  );
}
