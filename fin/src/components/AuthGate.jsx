/* ====================== 로그인/회원가입 게이트 ====================== */
/* 첫 접속 시 메인 앱 대신 표시. 로그인 또는 (실명확인 후) 회원가입을 거쳐야 입장. */
function AuthBrand() {
  return (
    <div className="authbrand">
      <span className="authlogo">
        <svg viewBox="0 0 44 44" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs><linearGradient id="authglg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#10B9A3" /><stop offset=".55" stopColor="#2563EB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
          <rect x="1.5" y="1.5" width="41" height="41" rx="12" fill="url(#authglg)" />
          <path d="M8.4 23.2H16l2.5-6.4 3.6 11.6 2.7-7.2 1.9 2h7.5" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="33.6" cy="32.2" r="7.7" fill="#fff" /><text x="33.6" y="36" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#2563EB" fontFamily="system-ui, sans-serif">₩</text>
        </svg>
      </span>
      <div className="authttl"><span className="hl">HI</span>-Fin Tech</div>
      <div className="authsub">헬스케어 · 금융보험 · 핀테크 초개인화 건강금융 플랫폼</div>
    </div>
  );
}

function AuthLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [pick, setPick] = useState("");
  const members = (typeof demoListAll === "function") ? demoListAll() : [];
  const submit = (e) => {
    if (e) e.preventDefault();
    setErr("");
    const u = appAuthenticate(email, pw);
    if (!u) { setErr("이메일 또는 비밀번호가 올바르지 않습니다."); return; }
    authSet({ name: u.name, email: u.email, realVerified: !!u.realVerified });
    demoSetSession(u);
  };
  const quickDemo = () => { const m = demoFindByEmail(pick); if (!m) { setErr("체험 회원을 선택해 주세요."); return; } authSet({ name: m.name, email: m.email }); demoSetSession(m); };
  const browse = () => { demoLogout(); authSet({ name: "조성래" }); };
  return (
    <form className="authform" onSubmit={submit}>
      <label className="authfield"><span className="authlabel">이메일</span>
        <input className="authinput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" /></label>
      <label className="authfield"><span className="authlabel">비밀번호</span>
        <input className="authinput" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" /></label>
      {err && <div className="autherr">{err}</div>}
      <button className="authbtn authprimary" type="submit">로그인</button>

      <div className="authdiv"><span>빠른 체험</span></div>
      <button type="button" className="authbtn authghost" onClick={browse}>조성래 체험 계정으로 둘러보기</button>
      <div className="authquick">
        <select className="authinput" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="체험 회원 선택">
          <option value="">체험 회원 선택(비밀번호 Demo@1234)</option>
          {members.map((m) => <option key={m.email} value={m.email}>{m.name} · {m.email}</option>)}
        </select>
        <button type="button" className="authbtn authsmall" onClick={quickDemo}>로그인</button>
      </div>
    </form>
  );
}

function AuthSignup() {
  const [step, setStep] = useState(1);
  // 실명확인
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [carrier, setCarrier] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(null);
  const [verified, setVerified] = useState(false);
  // 계정
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");

  const phoneDigits = phone.replace(/\D/g, "");
  const idOk = name.trim() && /^\d{6}$/.test(birth) && /^[1-4]$/.test(gender) && carrier && /^\d{10,11}$/.test(phoneDigits);
  const sendCode = () => {
    setErr("");
    if (!idOk) { setErr("이름·주민번호 앞 6자리·성별·통신사·휴대폰번호를 정확히 입력해 주세요."); return; }
    const c = String(100000 + (parseInt(phoneDigits.slice(-6) || "0", 10) % 900000)).slice(0, 6);
    setSentCode(c); setVerified(false); setCode("");
  };
  const verify = () => {
    setErr("");
    if (!sentCode) { setErr("먼저 인증번호를 받아 주세요."); return; }
    if (code.trim() !== sentCode) { setErr("인증번호가 일치하지 않습니다."); return; }
    setVerified(true);
  };
  const next = () => { setErr(""); if (!verified) { setErr("실명확인(본인인증)을 완료해 주세요."); return; } setStep(2); };
  const finish = (e) => {
    if (e) e.preventDefault();
    setErr("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr("올바른 이메일 형식을 입력해 주세요."); return; }
    if (pw.length < 8) { setErr("비밀번호는 8자 이상이어야 합니다."); return; }
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않습니다."); return; }
    if (!agree) { setErr("서비스 이용약관·개인정보 처리방침에 동의해 주세요."); return; }
    if ((typeof demoFindByEmail === "function" && demoFindByEmail(email)) || userFindByEmail(email)) { setErr("이미 가입된 이메일입니다."); return; }
    const prof = demoMakeProfile(name.trim(), email.trim(), birth, gender);
    prof.password = pw;
    userRegister(prof);
    authSet({ name: prof.name, email: prof.email, realVerified: true });
    demoSetSession(prof);
  };

  return (
    <div className="authform">
      <div className="authsteps">
        <span className={`astep ${step === 1 ? "on" : verified ? "done" : ""}`}>1 실명확인</span>
        <span className="astepline" />
        <span className={`astep ${step === 2 ? "on" : ""}`}>2 계정 생성</span>
      </div>

      {step === 1 && (<>
        <label className="authfield"><span className="authlabel">이름(실명)</span>
          <input className="authinput" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" /></label>
        <div className="authfield"><span className="authlabel">주민등록번호</span>
          <div className="authrrn">
            <input className="authinput" value={birth} onChange={(e) => setBirth(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="앞 6자리(생년월일)" inputMode="numeric" />
            <span className="authdash">–</span>
            <input className="authinput authg" value={gender} onChange={(e) => setGender(e.target.value.replace(/\D/g, "").slice(0, 1))} placeholder="0" inputMode="numeric" maxLength={1} />
            <span className="authmask">● ● ● ● ● ●</span>
          </div>
        </div>
        <div className="authrow2">
          <label className="authfield"><span className="authlabel">통신사</span>
            <select className="authinput" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              <option value="">선택</option><option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option>
            </select></label>
          <label className="authfield"><span className="authlabel">휴대폰번호</span>
            <input className="authinput" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" inputMode="tel" /></label>
        </div>
        <button type="button" className="authbtn authghost" onClick={sendCode} disabled={verified}>인증번호 받기</button>
        {sentCode && (
          <div className="authcode">
            <div className="authcodemsg">인증번호가 발송되었습니다. <b className="democode">체험 환경 — 인증번호: {sentCode}</b><button type="button" className="authautofill" onClick={() => setCode(sentCode)}>자동입력</button></div>
            <div className="authquick">
              <input className="authinput" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="인증번호 6자리" inputMode="numeric" disabled={verified} />
              <button type="button" className="authbtn authsmall" onClick={verify} disabled={verified}>확인</button>
            </div>
          </div>
        )}
        {verified && <div className="authok">✓ 실명확인이 완료되었습니다 ({name}님)</div>}
        {err && <div className="autherr">{err}</div>}
        <button type="button" className="authbtn authprimary" onClick={next}>다음 단계</button>
      </>)}

      {step === 2 && (<form onSubmit={finish}>
        <div className="authverified">✓ {name}님 실명확인 완료</div>
        <label className="authfield"><span className="authlabel">이메일</span>
          <input className="authinput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" /></label>
        <label className="authfield"><span className="authlabel">비밀번호(8자 이상)</span>
          <input className="authinput" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoComplete="new-password" /></label>
        <label className="authfield"><span className="authlabel">비밀번호 확인</span>
          <input className="authinput" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호 재입력" autoComplete="new-password" /></label>
        <label className="authagree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 서비스 이용약관 및 개인정보 처리방침에 동의합니다.</label>
        {err && <div className="autherr">{err}</div>}
        <div className="authrow2">
          <button type="button" className="authbtn authghost" onClick={() => { setErr(""); setStep(1); }}>이전</button>
          <button type="submit" className="authbtn authprimary">가입 완료</button>
        </div>
      </form>)}
    </div>
  );
}

function AuthGate() {
  const [tab, setTab] = useState("login");
  useEffect(() => { try { demoRegisterAll(); } catch (e) {} }, []);
  return (
    <div className="authwrap">
      <div className="authcard">
        <AuthBrand />
        <div className="authtabs">
          <button className={`authtab ${tab === "login" ? "on" : ""}`} onClick={() => setTab("login")}>로그인</button>
          <button className={`authtab ${tab === "signup" ? "on" : ""}`} onClick={() => setTab("signup")}>회원가입</button>
        </div>
        {tab === "login" ? <AuthLogin /> : <AuthSignup />}
        <div className="authnote">※ 본 서비스는 시연용 예시입니다. 입력 정보는 이 기기(브라우저)에만 저장되며, 실제 본인인증·SMS 발송은 이루어지지 않습니다.</div>
      </div>
    </div>
  );
}
