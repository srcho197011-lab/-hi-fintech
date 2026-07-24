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
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [lockMs, setLockMs] = useState(() => (typeof loginLockedMs === "function" ? loginLockedMs() : 0));
  // 브라우저 저장 아이디/비번 자동완성·자동입력 차단: 로드 시 readOnly로 두고 사용자가 포커스하면 해제
  const [ro, setRo] = useState(true);
  const unlock = () => setRo(false);
  useEffect(() => { const id = setTimeout(() => { setUid((v) => (ro ? "" : v)); setPw((v) => (ro ? "" : v)); }, 400); return () => clearTimeout(id); }, []);
  // 잠금 남은시간 카운트다운
  useEffect(() => { if (lockMs <= 0) return; const id = setInterval(() => { const m = (typeof loginLockedMs === "function" ? loginLockedMs() : 0); setLockMs(m); if (m <= 0) clearInterval(id); }, 1000); return () => clearInterval(id); }, [lockMs > 0]);
  const submit = (e) => {
    if (e) e.preventDefault();
    setErr("");
    const ms = (typeof loginLockedMs === "function") ? loginLockedMs() : 0;
    if (ms > 0) { setLockMs(ms); setErr(`로그인이 잠겼습니다. 약 ${Math.ceil(ms / 60000)}분 후 다시 시도해 주세요.`); return; }
    if (typeof adminLogin === "function" && adminLogin(uid.trim(), pw)) return;      // ADMIN(전체보기) — hifin 계정
    if (typeof cohortLogin === "function" && cohortLogin(uid.trim(), pw)) return;    // Phase1 §2-4: 코호트 체험 계정 000001~100000(공용 데모 비밀번호)
    // 콘텐츠 보호(2026-07-24): 이메일 데모 회원(MEMBER) 로그인 경로 차단 — memberLogin 호출 중단(재개 시 아래 주석 해제)
    // if (typeof memberLogin === "function" && memberLogin(uid.trim(), pw)) return;    // MEMBER(데모 계정)
    if (typeof loginRecordFail === "function") loginRecordFail();
    const nowLock = (typeof loginLockedMs === "function") ? loginLockedMs() : 0;
    if (nowLock > 0) { setLockMs(nowLock); setErr("로그인 5회 실패 — 10분간 접속이 잠겼습니다."); }
    else { const rem = (typeof loginRemainFails === "function") ? loginRemainFails() : 0; setErr(`아이디 또는 비밀번호가 올바르지 않습니다. (남은 시도 ${Math.max(0, rem)}회)`); }
  };
  const locked = lockMs > 0;
  return (
    <form className="authform" onSubmit={submit} autoComplete="off">
      <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} />
      <input type="password" name="password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} />
      <label className="authfield"><span className="authlabel">아이디</span>
        <input className="authinput" type="text" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="아이디 또는 이메일" name="hifin-login-id" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={ro} onFocus={unlock} disabled={locked} /></label>
      <label className="authfield"><span className="authlabel">비밀번호</span>
        <input className="authinput" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" name="hifin-login-pw" autoComplete="new-password" readOnly={ro} onFocus={unlock} disabled={locked} /></label>
      {err && <div className="autherr">{err}</div>}
      <button className="authbtn authprimary" type="submit" disabled={locked}>{locked ? `잠금 — ${Math.ceil(lockMs / 60000)}분 후 재시도` : "로그인"}</button>
      <div className="guestnote" style={{ marginTop: 10 }}>👥 <b>체험 계정</b>: 아이디 <b>000001</b>~<b>100000</b>(합성 코호트 10만 명 중 한 명의 건강지갑) · 데모 공용 비밀번호 <b>hifin002</b> — 어떤 번호로 들어와도 그 회원의 실데이터 기준으로 전 화면이 동작합니다.</div>
    </form>
  );
}

/* ── 회원가입 없이 둘러보기(GUEST) — 나이·성별·만성질환만 입력 → 유사 샘플 회원 자동 로그인 ── */
function GuestExplore() {
  const [age, setAge] = useState(45);
  const [sex, setSex] = useState("남");
  const [chronic, setChronic] = useState(false);
  const [conds, setConds] = useState([]);
  const CH = ["고혈압", "당뇨", "고지혈증", "기타"];
  const toggle = (c) => setConds((cs) => cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]);
  // 콘텐츠 보호 조치(2026-07-24): 진입 차단 — startGuest는 무력화 상태, 클릭 시 카드 내 안내만 표시
  const [blocked, setBlocked] = useState(false);
  const go = () => { setBlocked(true); if (typeof startGuest === "function") startGuest({ age: Number(age) || 45, sex, chronic, conditions: chronic ? conds : [] }); };
  return (
    <div className="guestcard">
      <div className="guesthd"><span className="guestpill">👀 회원가입 없이 둘러보기</span></div>
      <p className="guestlead">가입 없이 <b>10만 명의 예시 회원</b> 중 나와 가장 비슷한 사람의 눈으로 하이핀을 둘러보세요. (10초)</p>
      <div className="guestrow">
        <label className="guestf"><span>나이</span>
          <div className="guestage"><input type="range" min="10" max="90" value={age} onChange={(e) => setAge(e.target.value)} /><b>{age}<em>세</em></b></div>
        </label>
      </div>
      <div className="guestrow2">
        <label className="guestf"><span>성별</span>
          <div className="guestseg">{["남", "여"].map((s) => <button key={s} type="button" className={sex === s ? "on" : ""} onClick={() => setSex(s)}>{s}</button>)}</div></label>
        <label className="guestf"><span>만성질환</span>
          <div className="guestseg">{[["없음", false], ["있음", true]].map(([l, v]) => <button key={l} type="button" className={chronic === v ? "on" : ""} onClick={() => setChronic(v)}>{l}</button>)}</div></label>
      </div>
      {chronic && <div className="guestchips">{CH.map((c) => <button key={c} type="button" className={conds.includes(c) ? "on" : ""} onClick={() => toggle(c)}>{c}</button>)}<span className="guestchiphint">복수 선택 · 선택 안 해도 진행 가능</span></div>}
      <button className="authbtn guestcta" type="button" onClick={go}>나와 비슷한 회원으로 체험하기 →</button>
      {blocked && <div className="autherr">🔒 비회원 둘러보기는 콘텐츠 보호를 위해 일시 중단되었습니다. 승인된 계정으로 로그인해 주세요.</div>}
      <div className="guestnote">※ 별도 회원가입·개인정보 수집 없이 <b>시연용 예시 데이터</b>로 둘러봅니다. 온톨로지·관리자 화면은 열리지 않습니다.</div>
    </div>
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
    authSet({ name: prof.name, email: prof.email, realVerified: true, role: "MEMBER" });
    demoSetSession(prof);
    try { const rc = (typeof refConsumeIncoming === "function") ? refConsumeIncoming() : null; if (rc && typeof refAttribute === "function") { const at = refAttribute(rc, prof.email); if (at && at.credited && typeof toast === "function") toast(`${at.owner.name}님의 초대 코드가 확인돼 두 분 모두 100 HTK가 적립됐어요.`); } } catch (e) {}
    try { sessionStorage.setItem("hifin_force_onboard", "1"); } catch (e) {}   // 가입 직후 데이터 연결 온보딩 강제 진입
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

/* ── 3무(無) 오퍼 랜딩 배너 + 10초 간편가입 — 획득 채널 ① (Phase 3) ── */
function TriFreeGate() {
  const refIn = (typeof refIncoming === "function") ? refIncoming() : null;
  const quickJoin = () => {
    try {
      const seq = Date.now().toString(36);
      const em = "quick-" + seq + "@hifin.kr";
      const prof = demoMakeProfile("김하이", em, "800101", "1");
      prof.password = "Quick@" + seq;
      userRegister(prof);
      authSet({ name: prof.name, email: prof.email, realVerified: true, role: "MEMBER" });
      demoSetSession(prof);
      try { sessionStorage.setItem("hifin_force_onboard", "1"); } catch (e) {}
      const rc = (typeof refConsumeIncoming === "function") ? refConsumeIncoming() : null;
      const at = (rc && typeof refAttribute === "function") ? refAttribute(rc, prof.email) : null;
      if (typeof toast === "function") toast(at && at.credited ? `가입 완료! ${at.owner.name}님의 초대 코드가 확인돼 두 분 모두 100 HTK가 적립됐어요.` : rc ? `가입 완료! (초대 코드 ${rc}는 ${at && at.reason ? at.reason : "확인 불가"})` : "10초 가입 완료! 검진결과만 연결하면 무료 리포트가 시작돼요.");
    } catch (e) {}
  };
  return (
    <div className="trifree">
      {refIn && <div className="trifree-ref">🎁 친구 초대로 오셨네요 (코드 {refIn}) — 가입하면 <b>두 분 모두 100 HTK</b>를 드려요!</div>}
      <div className="trifree-hd">가입만 해도 <b>3가지가 무료</b>예요</div>
      <div className="trifree-items">
        <div><span>🛡️</span><b>무료 검진대비보험</b><i>진단금 최대 1,000만 원</i></div>
        <div><span>📄</span><b>무료 정밀리포트</b><i>시가 3만 원 · 31p 분석</i></div>
        <div><span>🤖</span><b>무료 AI 건강관리</b><i>하이가 평생 케어</i></div>
      </div>
      <button className="trifree-btn" onClick={quickJoin}>📱 간편 본인인증으로 10초 가입 (시연)</button>
      <div className="trifree-note">시연 환경 — 실서비스는 PASS 간편인증 1회로 가입됩니다.</div>
    </div>
  );
}

function AuthGate() {
  return (
    <div className="authwrap">
      <div className="authcard">
        <AuthBrand />
        {/* 콘텐츠 보호 조치(2026-07-24): 3무 가입 배너(TriFreeGate) 노출 중단. 둘러보기(GuestExplore)는 화면만 노출하고 진입은 startGuest 무력화로 차단 */}
        <div className="authgate-badge">🔒 승인된 계정만 접속할 수 있습니다.</div>
        <AuthLogin />
        <div className="author"><span>또는</span></div>
        <GuestExplore />
        <div className="authlegal">
          <div className="authlegal-hd"><span>🛡️</span> 접속·콘텐츠 보호 안내</div>
          <p>본 홈페이지는 보안 강화를 위해 접속자의 IP 주소, 접속 시간 및 이용 이력 등 접속 로그를 기록·관리합니다. 사전 승인 없이 홈페이지 URL을 제3자에게 공유하거나, 화면 및 콘텐츠를 무단으로 캡처, 복제, 저장 또는 배포하는 행위는 엄격히 금지됩니다. 위반 행위가 확인될 경우 관련 법령 및 계약에 따라 필요한 법적 조치를 취할 수 있습니다.</p>
        </div>
        <div className="authnote">※ 본 서비스는 비공개 시연 환경입니다. 승인된 관리자 계정만 접속 가능하며, 접속 정보는 이 기기(브라우저)에만 저장됩니다.</div>
      </div>
    </div>
  );
}
