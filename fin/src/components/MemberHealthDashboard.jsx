function MemberHealthDashboard({ member, onGo, onLogout }) {
  const go = onGo || (() => {});
  const cg = demoCancerGrade(member.cancerRiskGrade);
  const AIQ = ["내 건강상태를 분석해줘", "내가 가장 조심해야 할 암은?", "내 의료비가 얼마나 늘어날까?", "나에게 필요한 보험은?", "건강지갑으로 보험료를 얼마나 줄일 수 있어?"];
  return (
    <>
      <div className="card">
        <div className="rct"><CircleUserRound size={18} color="#2563EB" /> 회원 기본정보 <span className="demobadge"><AlertTriangle size={12} /> 시연용 예시 데이터입니다.</span></div>
        <div className="demoprofile">
          <span className="pa">{member.name[0]}</span>
          <div><div className="pn">{member.name} <span className="dgrade" style={{ color: cg[1], background: cg[2], marginLeft: 6 }}>암위험 {member.cancerRiskGrade}등급 · {cg[0]}</span></div>
            <div className="pmeta">{member.email} · 체험회원 {member.isDemoUser ? "예" : "아니오"} · ID {member.id}</div></div>
          <button className="cbtn2" style={{ marginLeft: "auto" }} onClick={() => onLogout && onLogout()}><X size={13} /> 로그아웃</button>
        </div>
      </div>
      <BiologicalAgeCard member={member} />
      <CancerRiskCard member={member} />
      <MedicalCostCard member={member} />
      <div className="card">
        <div className="rct"><Sparkles size={18} color="#F59E0B" /> 핵심 관리 포인트</div>
        <div className="demopts">{(member.managementPoints || []).map((p) => <span className="dpt" key={p}><Check size={12} /> {p}</span>)}</div>
      </div>
      <DemoInsuranceCard member={member} onGo={go} />
      <HealthWalletCard member={member} onGo={go} />
      <div className="card demoai">
        <div className="rct"><Bot size={18} color="#16A34A" /> AI 주치의 상담 (내 데이터 반영)</div>
        <div className="chnote" style={{ marginTop: 0 }}>로그인한 체험 회원 데이터를 기준으로 AI가 분석합니다. 아래 질문을 눌러보세요.</div>
        <div className="demoaiq">{AIQ.map((q) => <button key={q} onClick={() => go("ai")}><MessageSquare size={13} /> {q}</button>)}</div>
        <button className="cbtn" style={{ marginTop: 10 }} onClick={() => go("ai")}><Bot size={15} /> AI 주치의로 이동</button>
      </div>
      <div className="demodisc"><AlertTriangle size={14} /> 본 내용은 시연용 예시 데이터 기반 분석이며, 실제 의학적 진단이나 보험 가입 심사를 대체하지 않습니다.</div>
    </>
  );
}
