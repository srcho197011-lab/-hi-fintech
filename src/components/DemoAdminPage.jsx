function DemoAdminPage({ onLogin, onGoLogin, onChange }) {
  const [tests, setTests] = useState(null);
  const rows = tests || DEMO_CHK_NAMES.map((n) => ({ name: n, pass: null, detail: "" }));
  const passed = tests ? tests.filter((t) => t.pass).length : 0;
  return (<>
    <DemoMemberRegister onLogin={onLogin} onGoLogin={onGoLogin} onChange={onChange} />
    <div className="card">
      <div className="rct"><ClipboardList size={18} color="#16A34A" /> 테스트 시나리오 체크리스트
        <button className="cbtn2" style={{ marginLeft: "auto" }} onClick={() => setTests(runDemoTests())}><RefreshCw size={13} /> 테스트 실행</button></div>
      <div className="demochk">{rows.map((c, i) => (
        <div className={`chkrow ${c.pass === true ? "ok" : c.pass === false ? "no" : ""}`} key={i}>
          <span className="ci">{c.pass === true ? <Check size={14} /> : c.pass === false ? <X size={14} /> : <span className="dot" />}</span>
          <span className="cn">{c.name}</span>
          {c.detail ? <span className="cd">{c.detail}</span> : null}
        </div>
      ))}</div>
      {tests && <div className={`chksum ${passed === tests.length ? "all" : ""}`}>{passed} / {tests.length} 통과{passed === tests.length ? " · 전체 정상" : ""}</div>}
    </div>
    <div className="card">
      <div className="rct"><Lock size={18} color="#B45309" /> 메디에이지 결과 대시보드 <span className="demobadge" style={{ background: "#FEF3E2", color: "#B45309" }}><Lock size={11} /> 직원 전용</span></div>
      <div className="adminnote"><AlertTriangle size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>메디에이지(gene.imhealth.co.kr) 관리자에서 고객의 건강검진 분석 결과를 확인합니다. <b>로그인은 직원 계정으로 직접</b> 진행하세요. (이 버튼은 고객용 메인 화면에는 노출되지 않습니다.)</div></div>
      <a className="rvbtn pri" style={{ maxWidth: 280 }} href="https://gene.imhealth.co.kr/Login?redirect=%2Fdashboard" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> 결과 대시보드 열기</a>
    </div>
  </>);
}

function DemoSection({ onGo }) {
  const go = onGo || (() => {});
  const [view, setView] = useState(demoCurrentUser() ? "dash" : "admin");
  const [user, setUser] = useState(demoCurrentUser());
  const [, force] = useState(0);
  const onLogin = (m) => { demoSetSession(m); setUser(m); setView("dash"); };
  const onLogout = () => { demoLogout(); setUser(null); setView("login"); };
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="mypage" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>파일럿검증회원 <span className="demobadge"><AlertTriangle size={12} /> 시연용 예시 데이터입니다.</span></div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>관리자 일괄등록 · 체험 로그인 · 회원별 건강분석 대시보드 · AI 상담 연동 · 테스트 체크리스트 (경로: /admin/demo-members)</div></div></div>
      <div className="demotabs">
        <div className={`demotab ${view === "admin" ? "on" : ""}`} onClick={() => setView("admin")}><Settings size={15} /> 관리자</div>
        <div className={`demotab ${view === "login" ? "on" : ""}`} onClick={() => setView("login")}><CircleUserRound size={15} /> 체험 로그인</div>
        <div className={`demotab ${view === "dash" ? "on" : ""}`} onClick={() => setView("dash")}><Activity size={15} /> 내 대시보드{user ? ` · ${user.name}` : ""}</div>
      </div>
      {view === "admin" && <DemoAdminPage onLogin={onLogin} onGoLogin={() => setView("login")} onChange={() => force((x) => x + 1)} />}
      {view === "login" && <DemoLoginSelector onLogin={onLogin} />}
      {view === "dash" && (user ? <MemberHealthDashboard member={user} onGo={go} onLogout={onLogout} /> : (
        <div className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
          <CircleUserRound size={28} color="#B8C2D6" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>로그인된 체험 회원이 없습니다.</div>
          <button className="cbtn pri" style={{ maxWidth: 260, margin: "14px auto 0" }} onClick={() => setView("login")}><CircleUserRound size={15} /> 체험 회원으로 로그인</button>
        </div>
      ))}
    </div>
  );
}
