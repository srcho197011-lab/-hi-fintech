export default function App() {
  const [sec, setSecRaw] = useState("home");
  const [hist, setHist] = useState([]); // 뒤로 스택(이전 화면)
  const [fut, setFut] = useState([]); // 앞으로 스택(다음 화면)
  const setSec = (s) => { if (s === sec) return; setHist((h) => [...h, sec]); setFut([]); setSecRaw(s); };
  const goBack = () => { if (!hist.length) return; setFut((f) => [sec, ...f]); setSecRaw(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); };
  const goForward = () => { if (!fut.length) return; setHist((h) => [...h, sec]); setSecRaw(fut[0]); setFut((f) => f.slice(1)); };
  const [hdr, setHdr] = useState(null); // "noti" | "msg" | "user" | null
  const goSec = (s) => { setSec(s); setHdr(null); };
  const cur = SECTIONS.find((x) => x.k === sec);
  // 통합 검색
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const results = ql ? SEARCH_INDEX.filter(([l, d, c]) => (l + " " + d + " " + c).toLowerCase().includes(ql)) : [];
  const grouped = {};
  results.forEach((r) => { if (!grouped[r[2]]) grouped[r[2]] = []; grouped[r[2]].push(r); });
  const goResult = (target) => { setSec(target); setQ(""); };
  // 전역 안내(토스트) · 상담 폼
  const [toastMsg, setToastMsg] = useState(null);
  const [consult, setConsult] = useState(null);
  useEffect(() => { _toast = (m) => setToastMsg(m); _consult = (i) => setConsult(i); return () => { _toast = null; _consult = null; }; }, []);
  useEffect(() => { _nav = (s) => setSec(s); return () => { _nav = null; }; });
  useEffect(() => { if (!toastMsg) return; const id = setTimeout(() => setToastMsg(null), 2800); return () => clearTimeout(id); }, [toastMsg]);
  // 런타임 JS 오류 추적(데모 체크리스트 '콘솔 오류 없음' 검증용)
  useEffect(() => { if (typeof window === "undefined") return; window.__demoErrors = window.__demoErrors || []; const h = (e) => { try { window.__demoErrors.push(String((e && (e.message || (e.error && e.error.message))) || e)); } catch (_) {} }; window.addEventListener("error", h); return () => window.removeEventListener("error", h); }, []);
  // 데모 로그인/로그아웃 시 전체 화면(헤더·섹션) 재렌더
  const [, setDemoTick] = useState(0);
  useEffect(() => { const h = () => setDemoTick((t) => t + 1); window.addEventListener("demochange", h); return () => window.removeEventListener("demochange", h); }, []);
  const demoU = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const greetName = demoU ? demoU.name : (authU && authU.name ? authU.name : "조성래");
  const doLogout = () => { setHdr(null); setSecRaw("home"); if (typeof appLogout === "function") appLogout(); };
  // 접근성: 클릭 가능한 div(네비·탭·칩)를 키보드로도 조작 가능하게 (focus + Enter/Space)
  useEffect(() => {
    const SEL = ".iitem, .snav, .chtab, .aitab, .reslink, .fsel, .calc, .slot, .sresult, .adchip, .addept, .actbl tr, .aidcats button, .aidcatlist button, .lf-r button, .aidfilters button";
    const apply = () => { document.querySelectorAll(SEL).forEach((el) => { const t = el.tagName; if (t !== "BUTTON" && t !== "A" && t !== "INPUT" && !el.hasAttribute("tabindex")) { el.setAttribute("tabindex", "0"); if (!el.getAttribute("role")) el.setAttribute("role", "button"); } }); };
    apply();
    const mo = new MutationObserver(() => apply());
    try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    const onKey = (e) => { const el = e.target; if ((e.key === "Enter" || e.key === " ") && el && el.matches && el.matches(SEL) && el.tagName !== "BUTTON" && el.tagName !== "A" && el.tagName !== "INPUT" && el.tagName !== "SELECT" && el.tagName !== "TEXTAREA") { e.preventDefault(); el.click(); } };
    document.addEventListener("keydown", onKey);
    return () => { try { mo.disconnect(); } catch (e) {} document.removeEventListener("keydown", onKey); };
  }, []);
  const SIDE = [
    ["dashboard", "나의 건강 대시보드", "manage"],
    ["calendar", "검진·예약 현황", "checkup"],
    ["wallet", "건강금융지갑 현황", "wallet"],
    ["insurance", "보험·실손 지원", "insurance"],
    ["mypage", "마이페이지", "mypage"],
    ["people", "데모 회원 테스트", "demo"],
    ["alert", "알림센터", "__noti__", 3],
  ];
  if (!authU) return <AuthGate />;
  return (
    <div className="app">
      <header className="top">
        <div className="logo" onClick={() => setSec("home")} role="button" tabIndex={0} title="처음 화면(홈)으로" aria-label="HI-Fin Tech 홈으로" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSec("home"); }}>
          <span className="mk">
            <svg viewBox="0 0 44 44" width="38" height="38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs><linearGradient id="hifglg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#10B9A3" /><stop offset=".55" stopColor="#2563EB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
              <rect x="1.5" y="1.5" width="41" height="41" rx="12" fill="url(#hifglg)" />
              <path d="M22 32.5C13.2 26.2 12.7 18.5 17.3 16.1 20.2 14.6 22 17.3 22 18.6 22 17.3 23.8 14.6 26.7 16.1 31.3 18.5 30.8 26.2 22 32.5Z" fill="#fff" fillOpacity=".18" />
              <path d="M8.4 23.2H16l2.5-6.4 3.6 11.6 2.7-7.2 1.9 2h7.5" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="33.6" cy="32.2" r="7.7" fill="#fff" />
              <text x="33.6" y="36" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#2563EB" fontFamily="system-ui, sans-serif">₩</text>
            </svg>
          </span>
          <div className="nm"><span className="hl">HI</span>-Fin Tech<span className="sub">헬스케어 · 금융보험 · 핀테크</span></div>
        </div>
        <div className="navbtns"><button className="navbtn" onClick={goBack} disabled={!hist.length} aria-label="이전 화면으로" title="이전 화면으로"><ArrowLeft size={20} strokeWidth={2.6} /></button><button className="navbtn" onClick={goForward} disabled={!fut.length} aria-label="다음 화면으로" title="다음 화면으로"><ArrowRight size={20} strokeWidth={2.6} /></button></div>
        <div className="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && results.length) goResult(results[0][3]); if (e.key === "Escape") setQ(""); }} placeholder="통합 검색 (병원, 질환, 검진, 제품 등)" />
          {q ? <button className="sclear" onClick={() => setQ("")} aria-label="검색어 지우기"><X size={16} /></button> : <Search size={18} className="si" />}
          {q.trim() && (<>
            <div className="searchov" onClick={() => setQ("")} />
            <div className="searchdrop">
              {results.length ? (<>
                <div className="sdh">검색 결과 <b>{results.length}</b>건</div>
                {Object.keys(grouped).map((c) => (
                  <div className="sgroup" key={c}>
                    <div className="sgh"><CatIcon c={c} /> {c} <span>{grouped[c].length}</span></div>
                    {grouped[c].map((r, i) => (
                      <div className="sresult" key={i} onClick={() => goResult(r[3])}>
                        <div><div className="sl">{r[0]}</div><div className="sd">{r[1]}</div></div>
                        <span className="sgo">{SECTIONS.find((x) => x.k === r[3])?.t} ›</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>) : <div className="snone"><Search size={20} color="#B8C2D6" /><div>검색 결과가 없습니다.<br />다른 키워드로 검색해 주세요.</div></div>}
            </div>
          </>)}
        </div>
        <div className="tr">
          <button className={`ibtn ${hdr === "noti" ? "on" : ""}`} onClick={() => setHdr((h) => h === "noti" ? null : "noti")} aria-label="알림"><Bell size={21} /><span className="bdg">3</span></button>
          <button className={`ibtn ${hdr === "msg" ? "on" : ""}`} onClick={() => setHdr((h) => h === "msg" ? null : "msg")} aria-label="메시지"><MessageSquare size={21} /></button>
          <div className={`user ${hdr === "user" ? "on" : ""}`} onClick={() => setHdr((h) => h === "user" ? null : "user")}><span className="av">{greetName[0]}</span><div><div className="un">{greetName}님</div><div className="uh">{demoU ? (demoU.isDemoUser ? "데모 로그인" : "로그인 중") : "환영합니다!"}</div></div><ChevronDown size={17} color="#8A97AE" style={{ transform: hdr === "user" ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></div>
          {hdr && <><div className="hdrov" onClick={() => setHdr(null)} />
            <div className="hdrdrop">
              {hdr === "noti" && <>
                <div className="dh">알림 <span className="cnt">3건</span></div>
                {HDR_NOTI.map(([ic, t, d, tm, target], i) => (
                  <div className="ni" key={i} onClick={() => goSec(target)}><span className="ic"><Art name={ic} size={18} /></span><div><b>{t}</b><p>{d}</p><span className="tm">{tm}</span></div></div>
                ))}
                <div className="df" onClick={() => goSec("home")}>알림센터에서 모두 보기</div>
              </>}
              {hdr === "msg" && <>
                <div className="dh">메시지</div>
                <div className="ni" onClick={() => goSec("ai")}><span className="ic" style={{ background: "transparent", padding: 0 }}><SecIcon k="ai" /></span><div><b>AI 주치의</b><p>건강 상담을 도와드릴게요. 무엇이든 물어보세요.</p><span className="tm" style={{ color: "#16A34A" }}>● 온라인 · 24시간</span></div></div>
                <div className="ni" onClick={() => goSec("community")}><span className="ic"><Art name="people" size={18} /></span><div><b>커뮤니티</b><p>새 댓글·전문가 답변을 확인해 보세요.</p><span className="tm">2개 새 소식</span></div></div>
                <div className="df" onClick={() => goSec("ai")}>AI 주치의와 상담하기</div>
              </>}
              {hdr === "user" && <>
                <div className="dh">{greetName}님 <span className="cnt" style={{ background: "none", color: "var(--soft)" }}>{demoU ? (demoU.isDemoUser ? "데모 회원" : "일반 회원") : "프리미엄 회원"}</span></div>
                <div className="mi" onClick={() => goSec("mypage")}><CircleUserRound size={17} /> 마이페이지</div>
                <div className="mi" onClick={() => goSec("manage")}><FileText size={17} /> 내 건강 리포트</div>
                <div className="mi" onClick={() => goSec("wallet")}><Wallet size={17} /> 건강금융지갑</div>
                <div className="mi" onClick={() => goSec("mypage")}><Bell size={17} /> 알림 설정</div>
                <div className="df" onClick={doLogout}>로그아웃</div>
              </>}
            </div></>}
        </div>
      </header>
      <div className="body">
        <aside className="side">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            {SIDE.map(([ik, t, target, b], i) => {
              const active = target === "__noti__" ? hdr === "noti" : sec === target;
              return (<div key={i} className={`snav ${active ? "on" : ""}`} onClick={() => target === "__noti__" ? setHdr("noti") : setSec(target)}><span className="sico"><SecIcon k={ik} /></span> {t}{b && <span className="sb">{b}</span>}</div>);
            })}
          </div>
          <div className="agent"><div className="at">AI Health Agent</div><div className="as">{greetName}님 전담 24시간 상담</div><div className="bot"><SecIcon k="ai" /></div><button className="abtn" onClick={() => setSec("ai")}>상담하기</button></div>
          <div className="sos"><div className="l">긴급상황 시</div><div className="p"><Phone size={17} /> 119 연동</div></div>
        </aside>
        <main className="scrollarea">
          <nav className="iconbar">
            {SECTIONS.map((x) => (<div key={x.k} className={`iitem ${sec === x.k ? "on" : ""}`} onClick={() => setSec(x.k)}>
              <span className="ico"><SecIcon k={x.k} /></span><span className="t">{x.t}</span><span className="s">{x.s}</span></div>))}
          </nav>
          {sec === "home" ? <HomeView onGo={setSec} /> : sec === "ai" ? <AIDoctor /> : sec === "checkup" ? <CheckupSection /> : sec === "manage" ? <HealthManageSection onGo={setSec} /> : sec === "hospital" ? <HospitalSection /> : sec === "homecare" ? <HomecareSection /> : sec === "shop" ? <ShopSection /> : sec === "insurance" ? <InsuranceSection onGo={setSec} /> : sec === "wallet" ? <WalletSection onGo={setSec} /> : sec === "nft" ? <NFTSection onGo={setSec} /> : sec === "community" ? <CommunitySection onGo={setSec} /> : sec === "mypage" ? <MyPageSection onGo={setSec} /> : sec === "demo" ? <DemoSection onGo={setSec} /> : <Scaffold meta={cur} data={SCAFFOLDS[sec]} />}
        </main>
      </div>
      {consult !== null && <ConsultModal interest={consult} onClose={() => setConsult(null)} />}
      {toastMsg && <div className="toast"><Check size={16} /> {toastMsg}</div>}
    </div>
  );
}

/* ====================== AI 주치의 ====================== */
/* ── 국가건강정보포털(health.kdca.go.kr) 기반 건강 지식베이스 ── */
