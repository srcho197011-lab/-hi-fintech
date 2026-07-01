function DemoLoginSelector({ onLogin }) {
  const [selId, setSelId] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const list = demoListAll();
  const tryLogin = (em, password) => { const m = demoAuthenticate(em, password); if (!m) { setErr("이메일 또는 비밀번호가 일치하지 않습니다."); return; } setErr(""); onLogin && onLogin(m); };
  const quick = () => { const m = list.find((x) => x.id === selId); if (!m) { setErr("체험 회원을 선택하세요."); return; } tryLogin(m.email, "Demo@1234"); };
  return (
    <div className="card demologin">
      <div className="rct"><CircleUserRound size={18} color="#2563EB" /> 체험 회원으로 로그인 <span className="demobadge"><AlertTriangle size={12} /> 시연용 예시 데이터입니다.</span></div>
      <div className="cfield"><label>체험 회원 선택</label>
        <select value={selId} onChange={(e) => { setSelId(e.target.value); const m = list.find((x) => x.id === e.target.value); setEmail(m ? m.email : ""); setErr(""); }}>
          <option value="">— 회원을 선택하세요 —</option>
          {list.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
        </select>
      </div>
      <button className="cbtn pri" style={{ marginTop: 10 }} onClick={quick}><CircleUserRound size={15} /> 선택한 체험 회원으로 로그인</button>
      <div className="demoor">또는 직접 입력</div>
      <div className="cfield"><label>이메일</label><input value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="email@hizenhealth.com" /></div>
      <div className="cfield"><label>비밀번호</label><input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="Demo@1234" /></div>
      {err && <div className="demoerr"><X size={14} /> {err}</div>}
      <button className="cbtn" style={{ marginTop: 10 }} onClick={() => tryLogin(email, pw)}><Lock size={15} /> 로그인</button>
      <div className="chnote">※ 공통 비밀번호: Demo@1234 · 시연용 예시 데이터이며 실제 개인정보가 아닙니다.</div>
    </div>
  );
}
