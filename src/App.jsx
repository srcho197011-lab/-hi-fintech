export default function App() {
  const _lang = useHiLang();   /* 언어가 바뀌면 화면 전체를 다시 그린다(전체 리로드 없이) */
  const [sec, setSecRaw] = useState("home");
  const [hist, setHist] = useState([]); // 뒤로 스택(이전 화면)
  const [fut, setFut] = useState([]); // 앞으로 스택(다음 화면)
  const setSec = (s) => { if (s === sec) return; setHist((h) => [...h, sec]); setFut([]); setSecRaw(s); };
  const goBack = () => { if (!hist.length) return; setFut((f) => [sec, ...f]); setSecRaw(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); };
  const goForward = () => { if (!fut.length) return; setHist((h) => [...h, sec]); setSecRaw(fut[0]); setFut((f) => f.slice(1)); };
  const [hdr, setHdr] = useState(null); // "noti" | "msg" | "user" | null
  const goSec = (s) => { setSec(s); setHdr(null); };
  const cur = SECTIONS.find((x) => x.k === secParent(sec));
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
  // 시스템 보호 하네스 초기화(콘텐츠 보호·워터마크·접속 로그)
  useEffect(() => { if (typeof initContentGuard === "function") initContentGuard(); }, []);
  // 페이지(섹션) 이동마다 접속 로그 기록 + 워터마크 갱신
  useEffect(() => { if (typeof guardLog === "function") guardLog("view", sec); if (typeof applyGuard === "function") applyGuard(); }, [sec]);
  useEffect(() => { if (!toastMsg) return; const id = setTimeout(() => setToastMsg(null), 2800); return () => clearTimeout(id); }, [toastMsg]);
  // 런타임 JS 오류 추적(데모 체크리스트 '콘솔 오류 없음' 검증용)
  useEffect(() => { if (typeof window === "undefined") return; window.__demoErrors = window.__demoErrors || []; const h = (e) => { try { window.__demoErrors.push(String((e && (e.message || (e.error && e.error.message))) || e)); } catch (_) {} }; window.addEventListener("error", h); return () => window.removeEventListener("error", h); }, []);
  // 체험 로그인/로그아웃 시 전체 화면(헤더·섹션) 재렌더
  const [, setDemoTick] = useState(0);
  useEffect(() => { const h = () => setDemoTick((t) => t + 1); window.addEventListener("demochange", h); return () => window.removeEventListener("demochange", h); }, []);
  const demoU = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const greetName = demoU ? demoU.name : (authU && authU.name ? authU.name : "조성래");
  const doLogout = () => { setHdr(null); setSecRaw("home"); if (typeof appLogout === "function") appLogout(); };
  // RBAC — 현재 역할 + 차단 섹션 라우트 가드(URL 직접 접근·프로그램 이동도 홈으로 리다이렉트, 존재 암시 없이)
  const role = (typeof authRole === "function") ? authRole() : (authU ? "ADMIN" : null);
  useEffect(() => { if (role && role !== "ADMIN" && typeof isRestrictedSection === "function" && isRestrictedSection(sec)) setSecRaw("home"); }, [sec, role]);
  // 회원가입 완료 직후 데이터 연결 온보딩으로 강제 진입(미완료 시)
  useEffect(() => {
    if (role !== "MEMBER") return;
    let f = null; try { f = sessionStorage.getItem("hifin_force_onboard"); } catch (e) {}
    if (f && demoU && typeof onboardStatus === "function") { try { if (!onboardStatus(demoU).done) setSecRaw("onboarding"); sessionStorage.removeItem("hifin_force_onboard"); } catch (e) {} }
  }, [role]);
  const guestMatch = (authU && authU.match) || null;
  // 데이터 연결 온보딩 진행상태(정회원·미완료 시 홈 상단 유도 카드)
  const onboMember = demoU || (role !== "GUEST" && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  /* 시연 기준 인물(조성래) 금고 시드를 로그인 직후 1회 보장 — 특정 화면(데이터 연결·보험)을 거치지 않아도
     하이가 보유 검진 연도를 알 수 있어야 한다("기록이 한 건도 없어요" 오답변 차단). 멱등이라 반복 호출 안전. */
  useEffect(() => {
    if (role === "GUEST" || demoU || !onboMember || !onboMember.isSelf) return;
    try { if (typeof selfEnsureInsSeed === "function") selfEnsureInsSeed(onboMember); else if (typeof seedSelfVault === "function") seedSelfVault(onboMember); } catch (e) {}
    try { if (typeof hiStateInvalidate === "function") hiStateInvalidate(); } catch (e) {}
  }, [role, demoU ? demoU.email : null, onboMember ? onboMember.email : null]);
  const onbo = (role !== "GUEST" && onboMember && typeof onboardStatus === "function") ? (() => { try { return onboardStatus(onboMember); } catch (e) { return { done: true }; } })() : { done: true };
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
  // 현재 섹션 배너 — 섹션 제목·설명 보완 문구(구 아이콘바 자리)
  const SEC_BANNER = {
    home: "AI 헬스케어·핀테크 임팩트기업 — 회사 소개·비전·사회적 가치환원·커뮤니티. 치료비 걱정 없는 평생 건강관리 생태계를 만듭니다.",
    checkup: "전국 제휴 검진센터 비교·예약과 결과 조회 — 예약만 해도 무료 검진대비보험이 자동 가입되고, 결과는 AI 정밀분석으로 이어집니다.",
    care: "검진 결과가 관리로 이어지는 케어 루프 — AI 주치의 상담·건강현황·병원진료 안내·재가돌봄·맞춤 건강쇼핑까지 한 곳에서.",
    insurance: "건강데이터와 융합된 맞춤 보장 — 보장조회·AI 보험솔루션(보장공백·본인부담·세대전환)·간편가입·보험금 청구·치료비 지원.",
    mywallet: "건강활동이 자산이 되는 곳 — 건강금융지갑(HTK)·우리가족건강관리·Health NFT·데이터 금고(블록체인 보호).",
    partner: "검진센터·병원·약국·건강쇼핑 제휴 네트워크와 회원 적립금 주식청약·법인 투자 — 하이핀과 함께 성장하세요.",
    ontology: "회원·질병·보험·공급망·재무를 하나의 지식그래프로 통합 운영 — 데이터 하우스·블록체인 금고·AI KB (관리자 콘솔).",
  };
  if (!authU) return <AuthGate />;
  return (
    <div className="app">
      {role === "GUEST" && (
        <div className="guestband">
          <span className="gb-l">👀 <b>둘러보기 모드</b>{guestMatch ? ` — 만 ${guestMatch.age}세·${guestMatch.sex}${guestMatch.chronic && guestMatch.chronic.length ? "·" + guestMatch.chronic.slice(0, 2).join("·") : ""} 유사 프로필` : ""} · 시연용 예시 데이터입니다</span>
          <button className="gb-out" onClick={() => { setSecRaw("home"); if (typeof guestExit === "function") guestExit(); }}>나가기</button>
        </div>
      )}
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
          <div className="nm"><span className="hl">HI</span>-Fin Tech<span className="sub">AI 헬스케어 · 핀테크 <b className="subimp">임팩트기업</b></span></div>
        </div>
        <div className="navbtns"><button className="navbtn" onClick={goBack} disabled={!hist.length} aria-label="이전 화면으로" title="이전 화면으로"><ArrowLeft size={20} strokeWidth={2.6} /></button><button className="navbtn" onClick={goForward} disabled={!fut.length} aria-label="다음 화면으로" title="다음 화면으로"><ArrowRight size={20} strokeWidth={2.6} /></button><button className="navbtn navrefresh" onClick={() => { try { window.location.reload(); } catch (e) {} }} aria-label="새로고침" title="새로고침 — 최신 내용 다시 불러오기"><RefreshCw size={18} strokeWidth={2.6} /></button></div>
        <div className="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && results.length) goResult(results[0][3]); if (e.key === "Escape") setQ(""); }} placeholder={t("top.search")} />
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
                        <span className="sgo">{SECTIONS.find((x) => x.k === secParent(r[3]))?.t} ›</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>) : <div className="snone"><Search size={20} color="#B8C2D6" /><div>검색 결과가 없습니다.<br />다른 키워드로 검색해 주세요.</div></div>}
            </div>
          </>)}
        </div>
        <div className="tr">
          {typeof TrustBadge === "function" && <TrustBadge onGo={goSec} />}
          <LangToggle />
          <button className={`ibtn ${hdr === "noti" ? "on" : ""}`} onClick={() => setHdr((h) => h === "noti" ? null : "noti")} aria-label="알림"><Bell size={21} /><span className="bdg">{((typeof notifAll === "function" ? notifAll().length : 0) + HDR_NOTI.length)}</span></button>
          <button className={`ibtn ${hdr === "msg" ? "on" : ""}`} onClick={() => setHdr((h) => h === "msg" ? null : "msg")} aria-label="메시지"><MessageSquare size={21} /></button>
          <div className={`user ${hdr === "user" ? "on" : ""}`} onClick={() => setHdr((h) => h === "user" ? null : "user")}><span className="av">{greetName[0]}</span><div><div className="un">{greetName}님</div><div className="uh">{demoU ? (demoU.isDemoUser ? "체험 로그인" : "로그인 중") : "환영합니다!"}</div></div><ChevronDown size={17} color="#8A97AE" style={{ transform: hdr === "user" ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></div>
          {hdr && <><div className="hdrov" onClick={() => setHdr(null)} />
            <div className="hdrdrop">
              {hdr === "noti" && <>
                <div className="dh">알림 <span className="cnt">{((typeof notifAll === "function" ? notifAll().length : 0) + HDR_NOTI.length)}건</span></div>
                {/* 과업4: 수납·지급·재산정 실이벤트 알림(원장 연동) — 정적 안내 알림 위에 최신순 병합 */}
                {(typeof notifAll === "function" ? notifAll() : []).slice(0, 5).map((n, i) => (
                  <div className="ni" key={"r" + i} onClick={() => goSec(n.target)}><span className="ic"><Art name={n.ic} size={18} /></span><div><b>{n.t}</b><p>{n.d}</p><span className="tm">{new Date(n.ts).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div></div>
                ))}
                {HDR_NOTI.map(([ic, t, d, tm, target], i) => (
                  <div className="ni" key={i} onClick={() => goSec(target)}><span className="ic"><Art name={ic} size={18} /></span><div><b>{t}</b><p>{d}</p><span className="tm">{tm}</span></div></div>
                ))}
                <div className="df" onClick={() => goSec("home")}>알림센터에서 모두 보기</div>
              </>}
              {hdr === "msg" && <>
                <div className="dh">메시지</div>
                <div className="ni" onClick={() => goSec("ai")}><span className="ic" style={{ background: "transparent", padding: 0 }}><SecIcon k="ai" /></span><div><b>나의 주치의</b><p>AI·전문의 상담, 음성·화상·기기연동까지.</p><span className="tm" style={{ color: "#16A34A" }}>● 온라인 · 24시간</span></div></div>
                <div className="ni" onClick={() => goSec("community")}><span className="ic"><Art name="people" size={18} /></span><div><b>커뮤니티</b><p>새 댓글·전문가 답변을 확인해 보세요.</p><span className="tm">2개 새 소식</span></div></div>
                <div className="df" onClick={() => goSec("ai")}>나의 주치의와 상담하기</div>
              </>}
              {hdr === "user" && <>
                <div className="dh">{greetName}님 <span className="cnt" style={{ background: "none", color: "var(--soft)" }}>{demoU ? (demoU.isDemoUser ? "체험 회원" : "일반 회원") : "프리미엄 회원"}</span></div>
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
            {SECTIONS.filter((x) => role === "ADMIN" || x.k !== "ontology").map((x) => (
              <React.Fragment key={x.k}>
                <div className={`snav ${secParent(sec) === x.k ? "on" : ""}`} onClick={() => setSec(x.k)}><span className="sico"><SecIcon k={x.k} /></span> {t("nav." + x.k, x.t)}</div>
                {/* 검진 후 케어 서브메뉴 — 항상 펼침(메인에서 바로 선택). 현재 케어 하위 화면이면 강조 */}
                {x.k === "care" && (
                  <div className={`subnav ${secParent(sec) === "care" ? "active" : ""}`}>
                    {[["manage", "나의 건강현황", HeartPulse, "#F87171"], ["tele", "비대면 원격진료", Building2, "#60A5FA"], ["ai", "하이-나의 주치의", Bot, "#A78BFA"], ["homecare", "재가·돌봄", HeartHandshake, "#F472B6"], ["shop", "건강쇼핑", ShoppingCart, "#34D399"]].map(([k, lbl, Ic, c]) => (
                      <div key={k} className={`subnav-i ${sec === k ? "on" : ""}`} onClick={() => setSec(k)}><Ic size={15} color={c} /> {t("care." + k, lbl)}</div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
            <div className={`snav ${hdr === "noti" ? "on" : ""}`} onClick={() => setHdr("noti")}><span className="sico"><SecIcon k="alert" /></span> {t("nav.alertcenter")}<span className="sb">3</span></div>
          </div>
          <div className="agent"><div className="at">하이 · AI 매니저</div><div className="as">{greetName}님 전담 · 처음부터 끝까지 함께</div><div className="bot"><SecIcon k="ai" /></div><button className="abtn" onClick={() => { if (sec === "agent") return; try { window.dispatchEvent(new CustomEvent("agentask")); } catch (e) {} }}>{t("hi.open")}</button></div>
          {role === "ADMIN" && <div className={`snav ${sec === "demo" ? "on" : ""}`} onClick={() => setSec("demo")} style={{ marginTop: 4 }}><span className="sico"><SecIcon k="people" /></span> 파일럿검증회원</div>}
          <div className="sos"><div className="l">긴급상황 시</div><div className="p"><Phone size={17} /> 119 연동</div></div>
        </aside>
        <main className="scrollarea">
          {(() => { const p = secParent(sec); if (p === "partner" || p === "ontology") return null; const cb = SECTIONS.find((x) => x.k === p); if (!cb) return null; return (
            <div className="secbanner">
              <span className="sb-ic"><SecIcon k={cb.k} /></span>
              <div className="sb-b"><b>{t("nav." + cb.k, cb.t)}</b><p>{t("nav." + cb.k + ".s", SEC_BANNER[cb.k] || cb.s)}</p></div>
              {cb.k === "insurance" && typeof InsAgencyBadge === "function" && <InsAgencyBadge onGo={setSec} />}
            </div>
          ); })()}
          {!onbo.done && secParent(sec) === "home" && sec !== "onboarding" && (
            <div className="obpromo" onClick={() => setSec("onboarding")} role="button" tabIndex={0}>
              <span className="obpromo-ic"><ShieldCheck size={20} /></span>
              <div className="obpromo-b"><b>{!onbo.step1 ? "검진결과를 연결하면 AI 건강분석이 시작됩니다" : "보험 데이터를 연결하면 보장 분석이 완성됩니다"} <span>(1분 소요)</span></b>
                <div className="obpromo-bar"><i style={{ width: (onbo.step1 ? 50 : 5) + "%" }} /></div></div>
              <span className="obpromo-go">데이터 연결 <ChevronRight size={15} /></span>
            </div>
          )}
          {(() => { const p = secParent(sec);
            // 라우트 가드(방어적 이중화): 비관리자는 차단 섹션 렌더 자체를 홈으로 대체(존재 암시 없음)
            if (role !== "ADMIN" && typeof isRestrictedSection === "function" && isRestrictedSection(sec)) return <HomeHub initial="home" onGo={setSec} />;
            if (sec === "onboarding") return <DataOnboardingSection onGo={setSec} />;
            if (sec === "agent") return <SuperAgentSection onGo={setSec} />;
            if (p === "partner") return <PartnerInvestSection onGo={setSec} />;
            if (p === "home") return <HomeHub initial={sec} onGo={setSec} />;
            if (p === "checkup") return <CheckupSection />;
            if (p === "care") return <CareSection initial={sec} onGo={setSec} />;
            if (p === "insurance") return <InsuranceSection onGo={setSec} />;
            if (p === "mywallet") return <WalletHubSection initial={sec} onGo={setSec} />;
            if (p === "ontology") return <OntologySection onGo={setSec} />;
            if (sec === "demo") return <DemoSection onGo={setSec} />;
            return <Scaffold meta={cur} data={SCAFFOLDS[sec]} />;
          })()}
        </main>
      </div>
      {consult !== null && <ConsultModal interest={consult} onClose={() => setConsult(null)} />}
      {typeof AgentDock === "function" && sec !== "agent" && <AgentDock onGo={setSec} />}
      {toastMsg && <div className="toast"><Check size={16} /> {toastMsg}</div>}
    </div>
  );
}

/* ====================== AI 주치의 ====================== */
/* ── 국가건강정보포털(health.kdca.go.kr) 기반 건강 지식베이스 ── */
