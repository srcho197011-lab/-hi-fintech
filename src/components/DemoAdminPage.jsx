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
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>데모 회원 테스트 <span className="demobadge"><AlertTriangle size={12} /> 시연용 데모 데이터입니다.</span></div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>관리자 일괄등록 · 데모 로그인 · 회원별 건강분석 대시보드 · AI 상담 연동 · 테스트 체크리스트 (경로: /admin/demo-members)</div></div></div>
      <div className="demotabs">
        <div className={`demotab ${view === "admin" ? "on" : ""}`} onClick={() => setView("admin")}><Settings size={15} /> 관리자</div>
        <div className={`demotab ${view === "login" ? "on" : ""}`} onClick={() => setView("login")}><CircleUserRound size={15} /> 데모 로그인</div>
        <div className={`demotab ${view === "dash" ? "on" : ""}`} onClick={() => setView("dash")}><Activity size={15} /> 내 대시보드{user ? ` · ${user.name}` : ""}</div>
      </div>
      {view === "admin" && <DemoAdminPage onLogin={onLogin} onGoLogin={() => setView("login")} onChange={() => force((x) => x + 1)} />}
      {view === "login" && <DemoLoginSelector onLogin={onLogin} />}
      {view === "dash" && (user ? <MemberHealthDashboard member={user} onGo={go} onLogout={onLogout} /> : (
        <div className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
          <CircleUserRound size={28} color="#B8C2D6" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>로그인된 데모 회원이 없습니다.</div>
          <button className="cbtn pri" style={{ maxWidth: 260, margin: "14px auto 0" }} onClick={() => setView("login")}><CircleUserRound size={15} /> 데모 회원으로 로그인</button>
        </div>
      ))}
    </div>
  );
}
