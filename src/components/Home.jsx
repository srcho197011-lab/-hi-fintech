function HeroArt() {
  return (
    <svg viewBox="0 0 240 184" style={{ width: "100%", display: "block", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hero-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#DBEAFE" /></linearGradient>
        <radialGradient id="hero-core" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#BBF7D0" /><stop offset="1" stopColor="#34D399" /></radialGradient>
      </defs>
      {/* 궤도 */}
      <ellipse cx="120" cy="96" rx="104" ry="62" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.4" />
      <ellipse cx="120" cy="96" rx="74" ry="42" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.2" />
      {/* 네트워크 라인 (Web3) */}
      <g stroke="rgba(255,255,255,.42)" strokeWidth="1.3">
        <line x1="120" y1="92" x2="34" y2="50" /><line x1="120" y1="92" x2="206" y2="56" />
        <line x1="120" y1="92" x2="190" y2="146" /><line x1="120" y1="92" x2="46" y2="146" />
      </g>
      {/* 노드 — 건강검진 / 금융(치료비) / 일상관리 / AI */}
      <g>
        <circle cx="34" cy="50" r="13" fill="#22D3EE" /><path d="M28.5 50l3.5 3.5 6-7" stroke="#06343c" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="206" cy="56" r="13" fill="#FBBF24" /><path d="M201 52l2.5 7 2-5 2 5 2.5-7M202 57h7M202 59.5h7" stroke="#7c4a02" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="190" cy="146" r="13" fill="#34D399" /><path d="M190 152c-3.4-2.4-2.3-5-.5-5 .8 0 1 .7 1 .7s.2-.7 1-.7c1.8 0 2.9 2.6-.5 5z" fill="#063b25" /><path d="M184.5 145.5h2.2l1-1.8 1.4 3.3 1-1.5h3.6" stroke="#063b25" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="46" cy="146" r="13" fill="#A855F7" /><path d="M46 139l1.6 4.4 4.4 1.6-4.4 1.6L46 153l-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#fff" />
      </g>
      {/* 중앙 방패(임베디드보험)가 건강(하트)을 보호 */}
      <path d="M120 40 L156 53 V94 C156 123 139 142 120 150 C101 142 84 123 84 94 V53 Z" fill="url(#hero-sh)" />
      <path d="M120 40 L156 53 V94 C156 123 139 142 120 150z" fill="#0b1733" opacity=".08" />
      <circle cx="120" cy="90" r="22" fill="url(#hero-core)" />
      <path d="M120 102c-9-6-7.5-14-2.2-14 2 0 2.2 2 2.2 2s.2-2 2.2-2c5.3 0 6.8 8-2.2 14z" fill="#fff" />
      <path d="M104 90h6l2.5-5 3.5 9 2.5-4h10" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    </svg>
  );
}
function OntoCtaArt() {
  return (
    <svg viewBox="0 0 120 96" width="118" height="94" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="rgba(125,211,252,.5)" strokeWidth="1.4">
        <line x1="60" y1="26" x2="28" y2="56" /><line x1="60" y1="26" x2="92" y2="56" /><line x1="60" y1="26" x2="60" y2="70" />
        <line x1="28" y1="56" x2="60" y2="70" /><line x1="92" y1="56" x2="60" y2="70" /><line x1="28" y1="56" x2="92" y2="56" />
      </g>
      <circle cx="60" cy="24" r="11" fill="#38E0F5" /><circle cx="60" cy="24" r="4" fill="#0B1220" opacity=".55" />
      <circle cx="28" cy="56" r="8" fill="#818CF8" /><circle cx="92" cy="56" r="8" fill="#F472B6" /><circle cx="60" cy="71" r="7" fill="#34D399" />
    </svg>
  );
}
/* ====================== 홈 히어로 — AI Ontology 플랫폼 다이어그램 (Palantir-style) ====================== */
function PlatformDiagram() {
  const CY = "#22D3EE";
  const glass = { background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 16, backdropFilter: "blur(6px)" };
  const wrapMax = { width: "100%", maxWidth: 900, margin: "0 auto" };
  const Conn = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "3px 0" }}>
      <div className="pdg-flow" style={{ width: 2, height: 20, background: "linear-gradient(#22D3EE,rgba(34,211,238,.15))", borderRadius: 2 }} />
      <ChevronDown size={15} color={CY} style={{ marginTop: -3 }} />
    </div>
  );
  const Stage = ({ n, tag, title, accent, children }) => (
    <div style={{ ...glass, ...wrapMax, padding: "13px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: children ? 11 : 0 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: accent || CY, color: "#04121f", fontWeight: 900, fontSize: 13, display: "grid", placeItems: "center", flexShrink: 0 }}>{n}</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: accent || CY, textTransform: "uppercase" }}>{tag}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  );
  const Chip = ({ ic: Ic, children }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,211,238,.09)", border: "1px solid rgba(34,211,238,.24)", color: "#D6F6FF", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999 }}>
      {Ic && <Ic size={13} color={CY} />}{children}
    </span>
  );
  const SvcCard = ({ ic: Ic, t, sub, col }) => (
    <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 13, padding: "13px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: (col || CY) + "22", border: "1px solid " + (col || CY) + "55", display: "grid", placeItems: "center" }}><Ic size={17} color={col || CY} /></span>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{t}</div>
      {sub && <div style={{ fontSize: 10.5, color: "#9FD9EC", lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
  const services = [
    [Stethoscope, "맞춤 진료안내", "", "#38BDF8"], [Video, "원격진료", "", "#22D3EE"],
    [Brain, "AI 질병 조기예측", "암 · 파킨슨 · 뇌졸중", "#A78BFA"], [Search, "추가 정밀검사", "", "#34D399"],
    [Salad, "맞춤 건강식단", "", "#4ADE80"], [Pill, "맞춤 영양제", "", "#FBBF24"],
    [Activity, "맞춤 홈케어 의료기기", "", "#F472B6"], [ShieldCheck, "맞춤 건강보험", "", "#60A5FA"],
  ];
  return (
    <div className="pdg-wrap" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(165deg,#0B1F3A 0%,#0E2A4E 55%,#0A2340 100%)", borderRadius: 22, padding: "30px 20px 26px", margin: "16px 0" }}>
      <style>{`@keyframes pdgPulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.14);opacity:.15}}@keyframes pdgFlowMove{0%{background-position:0 0}100%{background-position:0 22px}}@keyframes pdgSpin{to{transform:rotate(360deg)}}.pdg-wrap *{box-sizing:border-box}.pdg-core-ring{animation:pdgPulse 3s ease-in-out infinite}.pdg-spin{animation:pdgSpin 14s linear infinite}@media(max-width:560px){.pdg-vr{grid-template-columns:1fr !important}.pdg-vr>div:nth-child(2){transform:rotate(90deg);margin:2px 0}}`}</style>
      <span style={{ position: "absolute", width: 320, height: 320, top: -120, right: -80, background: "radial-gradient(circle,#22D3EE55,transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
      <span style={{ position: "absolute", width: 300, height: 300, bottom: -120, left: -60, background: "radial-gradient(circle,#7C3AED44,transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", textAlign: "center", marginBottom: 18 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,211,238,.12)", border: "1px solid rgba(34,211,238,.3)", color: CY, fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "5px 13px", borderRadius: 999 }}><Network size={12} /> AI ONTOLOGY PLATFORM</span>
        <div style={{ fontSize: 27, fontWeight: 900, color: "#fff", letterSpacing: -0.5, marginTop: 11 }}>HI-Fin Tech Platform</div>
        <div style={{ fontSize: 13.5, color: "#9FD9EC", marginTop: 5 }}>AI Ontology 기반 평생 건강관리 · 핀테크 사회적경제 플랫폼</div>
      </div>

      {/* AI Ontology Core */}
      <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}>
          <span className="pdg-core-ring" style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid #22D3EE" }} />
          <span className="pdg-spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px dashed rgba(34,211,238,.35)" }} />
          <div style={{ width: 104, height: 104, borderRadius: "50%", background: "radial-gradient(circle at 50% 38%,#67E8F9,#0891B2 70%)", boxShadow: "0 0 40px -6px #22D3EEaa", display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <Network size={26} color="#04202b" style={{ display: "block", margin: "0 auto 3px" }} />
              <div style={{ fontSize: 11.5, fontWeight: 900, color: "#04202b", lineHeight: 1.15 }}>AI Healthcare<br />Ontology</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#7FCCE4", marginBottom: 6 }}>모든 서비스가 하나의 지식그래프로 연결됩니다</div>
      <Conn />

      {/* ① Free Entry */}
      <div style={wrapMax}><Stage n="①" tag="Free Entry" title="무료 진입 서비스" accent="#34D399">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip ic={ShieldCheck}>무료 건강검진 대비보험</Chip><Chip ic={FileText}>무료 건강분석보고서</Chip><Chip ic={MessageSquare}>AI 무료 건강 상담 & 평생케어</Chip></div>
      </Stage></div>
      <Conn />

      {/* ② Check-up */}
      <div style={wrapMax}><Stage n="②" tag="Check-up Center" title="건강검진센터" accent="#38BDF8">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip ic={Users}>개인검진</Chip><Chip ic={Building2}>직장검진</Chip><Chip ic={ClipboardList}>국가건강검진</Chip></div>
      </Stage></div>
      <Conn />

      {/* ③ AI Analysis */}
      <div style={wrapMax}><Stage n="③" tag="AI Data Analysis" title="AI 건강데이터 분석" accent="#22D3EE">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}><Chip>건강검진</Chip><Chip>EMR</Chip><Chip>생활습관</Chip><Chip>보험</Chip><Chip>건강데이터</Chip></div>
        <div style={{ fontSize: 12, color: "#9FD9EC", display: "flex", alignItems: "center", gap: 6 }}><Brain size={14} color={CY} /> AI Ontology가 5대 데이터를 통합·분석해 개인 위험을 예측합니다.</div>
      </Stage></div>
      <Conn />

      {/* ④ Personalized */}
      <div style={wrapMax}><Stage n="④" tag="Personalized Healthcare" title="개인 맞춤 헬스케어" accent="#A78BFA">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9 }}>
          {services.map(([Ic, t, sub, col], i) => <SvcCard key={i} ic={Ic} t={t} sub={sub} col={col} />)}
        </div>
      </Stage></div>
      <Conn />

      {/* ⑤ Lifetime */}
      <div style={wrapMax}><div style={{ ...glass, ...wrapMax, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, background: "rgba(34,211,238,.08)", borderColor: "rgba(34,211,238,.3)" }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, background: "#22D3EE22", border: "1px solid #22D3EE55", display: "grid", placeItems: "center", flexShrink: 0 }}><HeartPulse size={24} color={CY} /></span>
        <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: CY }}>⑤ LIFETIME HEALTHCARE</div><div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>예방 중심 · 평생 건강관리</div><div style={{ fontSize: 11.5, color: "#9FD9EC" }}>Preventive · Lifetime Health Management</div></div>
      </div></div>
      <Conn />

      {/* ⑥ Consumption */}
      <div style={wrapMax}><Stage n="⑥" tag="Daily Consumption" title="일상 건강소비" accent="#FBBF24">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip ic={Salad}>건강식품</Chip><Chip ic={Stethoscope}>의료서비스</Chip><Chip ic={ShieldCheck}>보험</Chip><Chip ic={Activity}>홈케어 제품</Chip><Chip ic={Tag}>국내 최저가 제품공급 정책</Chip></div>
      </Stage></div>
      <Conn />

      {/* ⑦ Value Return */}
      <div style={{ ...wrapMax, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#FBBF24" }}>⑦ VALUE RETURN SYSTEM · 가치환원 순환</span><div style={{ fontSize: 11.5, fontWeight: 700, color: "#CFE3F5", marginTop: 5 }}>매출마진의 50%는 회원 리워드, 30%는 치료비 나눔으로 환원</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }} className="pdg-vr">
          <div style={{ ...glass, padding: "16px 16px", textAlign: "center", background: "rgba(34,211,238,.09)", borderColor: "rgba(34,211,238,.3)" }}>
            <Wallet size={22} color={CY} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>50<span style={{ fontSize: 16 }}>%</span></div>
            <div style={{ fontSize: 13, fontWeight: 800, color: CY, marginTop: 3 }}>회원 리워드</div>
            <div style={{ fontSize: 10.5, color: "#9FD9EC" }}>Member Rewards</div>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}><RotateCcw className="pdg-spin" size={34} color="#7DD3FC" /></div>
          <div style={{ ...glass, padding: "16px 16px", textAlign: "center", background: "rgba(244,114,182,.1)", borderColor: "rgba(244,114,182,.32)" }}>
            <HeartHandshake size={22} color="#F9A8D4" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>30<span style={{ fontSize: 16 }}>%</span></div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F9A8D4", marginTop: 3 }}>치료비 나눔</div>
            <div style={{ fontSize: 10.5, color: "#F7C6E0" }}>치료비 사각지대 지원</div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10.5, color: "#7FCCE4", marginTop: 8 }}>※ 매출마진의 나머지 20%는 플랫폼 운영 — 소비 가치가 개인 적립과 사회 나눔으로 순환합니다.</div>
      </div>

      {/* Social Impact */}
      <div style={{ ...wrapMax, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "#7DD3FC", marginBottom: 12 }}>SOCIAL IMPACT · 사회적 임팩트</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          {[[Users, "건강 형평성", "Healthcare Equality", "#34D399"], [HeartPulse, "예방 의료", "Preventive Medicine", "#22D3EE"], [Landmark, "사회적 경제", "Social Economy", "#A78BFA"]].map(([Ic, t, en, col], i) => (
            <div key={i} style={{ ...glass, padding: "16px 12px", textAlign: "center" }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: col + "22", border: "1px solid " + col + "55", display: "grid", placeItems: "center", margin: "0 auto 9px" }}><Ic size={22} color={col} /></span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{t}</div>
              <div style={{ fontSize: 10.5, color: "#9FD9EC", marginTop: 2 }}>{en}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...wrapMax, textAlign: "center", marginTop: 18, fontSize: 12.5, color: "#B6E3F2", lineHeight: 1.6 }}>
        “건강 소비의 가치를 <b style={{ color: "#fff" }}>개인과 사회에 함께 환원</b>하는 AI Healthcare &amp; FinTech Social Impact Platform”
      </div>
      <div style={{ ...wrapMax, textAlign: "center", marginTop: 7, fontSize: 11, color: "#7FCCE4", lineHeight: 1.55 }}>
        <Handshake size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />협력 거래처 대금을 <b style={{ color: "#CFE9F5", fontWeight: 700 }}>영업일 5일 이내 결제</b>하여, 함께 성장하는 <b style={{ color: "#CFE9F5", fontWeight: 700 }}>상생 경제</b>를 실천합니다.
      </div>
    </div>
  );
}

/* ── 검진 히어로 — 맞춤 대시보드 배너·다음 검진 예약·리포트 발행.
   지갑 허브에서 '검진 후 케어 › 나의 건강현황' 상단으로 이동(발행→업로드→보관이 한 흐름). ── */
function MyCheckupHero({ onGo, onReport }) {
  const go = onGo || (() => {});
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const R = dm ? demoReport(dm) : null;
  const nm = dm ? dm.name : (authU && authU.name ? authU.name : "조성래");
  /* [H-2 W6] 다음 검진 예약을 실제 예약에서 읽는다 — 전에는 「2025.06.15 (토) 09:00 · 서울 KMI」가
     상수라 모든 회원에게 같은(그리고 이미 지나간) 일정이 보였다. 예약이 없으면 없다고 말한다. */
  const _bk = (() => {
    try {
      const me = dm || ((typeof selfMember === "function") ? selfMember() : null);
      if (!me || typeof memberStateSnapshot !== "function") return null;
      const st = memberStateSnapshot(me);
      const s1 = st && st.s1;
      if (!s1 || !s1.hasBooking || !s1.bookingDate) return null;
      return { date: String(s1.bookingDate).replace(/-/g, "."), inDays: s1.bookingInDays, place: s1.bookingPlace || null };
    } catch (e) { return null; }
  })();
  return (
    <>
      <div className="banner">
        <div><span className="pchip"><Sparkles size={13} /> {nm}님 맞춤 초개인화 대시보드</span><div className="head">AI가 {nm}님의 건강을 지키고 있습니다.</div><div className="sub">{R ? `${nm}님 시연용 예시 리포트와 생활데이터를 분석해 안내합니다.` : "프롬에이지 Premium 리포트와 생활데이터를 분석해 안내합니다."}</div></div>
        <div className="art"><ShieldArt /></div>
        {_bk && _bk.date
          ? <div className="bnext"><div className="l">다음 건강검진 예약</div><div className="d">{_bk.date}{_bk.inDays != null ? ` (${_bk.inDays}일 뒤)` : ""}</div><div className="c">{_bk.place || "예약한 검진기관"}</div><button onClick={() => go("checkup")}>예약 상세보기</button></div>
          : <div className="bnext"><div className="l">건강검진 예약</div><div className="d">예약된 일정이 없어요</div><div className="c">내 주변 검진센터를 찾아 드릴게요</div><button onClick={() => go("checkup")}>예약하러 가기</button></div>}
      </div>
      <div className="reportcta">
        <div className="rcl">
          <span className="rcbadge"><FileText size={14} /> 건강검진 리포트</span>
          <div className="rch">생체나이 건강검진 리포트 발행</div>
          <p className="rcd">외부 검진 시스템에서 <b>고객 동의 절차</b>를 거쳐 건강검진 리포트를 발행할 수 있습니다. 발행된 리포트는 아래 <b>검진 리포트 탭</b>에서 업로드해 보관·확인하세요.</p>
          <div className="rcbtns">
            <a className="rcbtn pri" href="https://www.healthketch.com/outside/event/checkup-analysis/hizencare-pp-0UVIFW" target="_blank" rel="noopener noreferrer">리포트 발행 사이트 열기 <ExternalLink size={15} /></a>
            <button className="rcbtn ghost" onClick={() => (onReport ? onReport() : go("manage"))}>검진 리포트 탭에서 업로드 <ChevronRight size={14} /></button>
          </div>
          <div className="rcnote"><ShieldCheck size={13} /> 발행은 본인(고객) 동의 하에 외부 검진 시스템에서 진행됩니다.</div>
        </div>
        <div className="rcart"><span className="rcic"><FileText size={40} color="#fff" /></span></div>
      </div>
    </>
  );
}

/* ── 나의 프로필 요약 — 나의 건강지갑 허브 상단(자산 공간의 명함) ── */
function MyHealthHero({ onGo }) {
  const go = onGo || (() => {}); void go;
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const R = dm ? demoReport(dm) : null;
  const nm = dm ? dm.name : (authU && authU.name ? authU.name : "조성래");
  const regA = R ? R.reg : "54.1";
  const bioA = R ? R.bio : "52.5";
  return (
    <>
      <div className="profile">
        <span className="pa">{nm[0]}</span>
        <div><div className="pn">{nm} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{regA}세{R ? "" : " · 남"}</span></div><div className="pmeta"><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {R ? `${nm}님 시연용 체험 회원 · 맞춤 건강분석 적용` : `${PT.addr} · 하이핀 정밀분석 기준`}</div></div>
        <div className="pstats">
          {[[regA + "세", "주민등록"], [bioA + "세", "생체나이"], [(R ? R.agingRank : 37) + "등", "노화등수"], [(R ? R.agingSpeed : 0.97) + "배", "노화속도"]].map(([v, k]) => (<div className="pstat" key={k}><div className="v">{v}</div><div className="k">{k}</div></div>))}
          <div className="pstat"><span className="tag-w" style={{ color: R ? R.cg[1] : "#16A34A", background: R ? R.cg[2] : "#E7F8EE" }}>종합 {R ? R.evalLabel : "좋음"}</span><div className="k" style={{ marginTop: 6 }}>생체나이</div></div>
        </div>
      </div>
    </>
  );
}

function HomeView({ onGo }) {
  const go = onGo || (() => {});
  // 로그인한 회원 기준으로 홈 대시보드 개인화 (체험회원/가입회원 → 해당 고객, 없으면 조성래 기본)
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const R = dm ? demoReport(dm) : null;
  const nm = dm ? dm.name : (authU && authU.name ? authU.name : "조성래");
  return (
    <>
      <div className="hero">
        <span className="hglow" style={{ width: 260, height: 260, top: -90, left: -60, background: "#22D3EE", opacity: .3 }} />
        <span className="hglow" style={{ width: 230, height: 230, bottom: -110, right: -30, background: "#3B82F6", opacity: .32 }} />
        <span className="hglow" style={{ width: 180, height: 180, top: 40, right: 220, background: "#0EA5E9", opacity: .18 }} />
        <div className="hcopy">
          <span className="heyebrow"><Art name="sparkle" size={15} /> AI 헬스케어 · 핀테크 임팩트기업</span>
          <div className="htitle">Health-InsurFin Tech<br />치료비 걱정 없는 <b>평생 건강관리 생태계</b></div>
          <div className="hdesc">건강검진부터 일상 건강관리까지, <b>검진만 받아도 무료 건강검진보험을 제공</b>하고, 소비에서 발생한 가치를 <b>회원 적립·치료비 나눔으로 환원</b>하는 <b>AI 기반 헬스케어·핀테크 임팩트기업</b>입니다.</div>
          <div className="hchips">
            <span><Art name="check" size={16} /> 건강검진</span>
            <span><Art name="heart" size={16} /> 일상 건강관리</span>
            <span><Art name="badge" size={16} /> 무료 건강검진보험</span>
            <span><Art name="coin" size={16} /> 치료비 걱정 ZERO</span>
            <span><Art name="gift" size={16} /> 사회환원 임팩트</span>
          </div>
        </div>
        <div className="hart">
          <div className="pdg-stat">
            <div className="pdg-stat-hd"><TrendingUp size={11} /> KOREA 건강검진 현황</div>
            <div className="pdg-stat-sub">국가건강검진 · 전 국민 규모</div>
            <div className="pdg-stat-rows">
              <div className="pdg-stat-row"><span>매년 건강검진</span><b>2,100<i>만명</i></b></div>
              <div className="pdg-stat-row"><span>검진 경험자<em>누적</em></span><b>4,200<i>만명</i></b></div>
              <div className="pdg-stat-row dim"><span>일반검진 수검률</span><b>75.4<i>%</i></b></div>
            </div>
            <div className="pdg-stat-goal">
              <div className="pdg-goal-hd"><Target size={11} /> HI-Fin 회원 목표</div>
              <div className="pdg-goal-row"><span>5년 내 목표</span><b>1,000<i>만명</i></b></div>
              <div className="pdg-goal-row hi"><span>최종 목표</span><b>3,000<i>만명+</i></b></div>
            </div>
          </div>
        </div>
      </div>
      <PlatformDiagram />
      {dm && (() => { const cp = (typeof buildCarePlan === "function") ? buildCarePlan(dm) : null; return cp ? (
        <div className="homecare">
          <div className="hch"><span><HeartHandshake size={16} color="#16A34A" /> {nm}님 오늘의 종합 케어플랜</span><span className="hclvl">{cp.level}</span></div>
          <div className="hcrow">{cp.domains.slice(0, 4).map((dmn, i) => (<div className="hcc" key={i} style={{ borderTopColor: dmn.color }}><b>{dmn.title}</b><span>{dmn.need}</span></div>))}</div>
          <button className="cbtn pri" style={{ maxWidth: 300 }} onClick={() => go("ai")}><Bot size={15} /> AI 주치의에서 전체 케어플랜 보기</button>
        </div>
      ) : null; })()}
      {dm && (() => { const rem = (typeof buildReminders === "function") ? buildReminders(dm) : []; return rem.length ? (
        <div className="homerem">
          <div className="hrh"><Bell size={15} color="#EF4444" /> {nm}님 맞춤 검진 리마인더 <span className="hrc">{rem.length}</span></div>
          <div className="hrlist">{rem.map((r, i) => (<div className="hrrow" key={i}><span className={`hru ${r.urg === "권장" ? "u2" : "u3"}`}>{r.urg}</span><div className="hrb"><b>{r.title}</b><span>{r.when}</span></div><button className="hrgo" onClick={() => go("checkup")}>예약 ›</button></div>))}</div>
        </div>
      ) : null; })()}
      <div className="perso"><span className="ic"><Sparkles size={20} color="#2DD4BF" /></span><div><b>초개인화 건강지갑</b><p>프롬에이지 리포트·검진·생활·금융 데이터가 {nm}님의 건강지갑에 연결되어, AI가 맞춤 건강·보장·자산 흐름을 설계합니다.</p></div></div>
    </>
  );
}

/* ====================== Scaffold ====================== */
function Scaffold({ meta, data }) {
  const color = data?.color || "#2F5BEA";
  return (
    <div className="scaffold" style={{ marginTop: 16 }}>
      <div className="shead2"><span className="sico"><SecIcon k={meta.k} /></span>
        <div><div className="stitle">{meta.t}</div><div className="ssub">{meta.s}</div></div></div>
      <div className="skel-note"><Info size={15} /> 1단계 골격 — 전역 레이아웃·디자인이 적용된 빈 화면입니다. 모듈 콘텐츠는 2단계에서 구현됩니다.</div>
      <div className="mods">{(data?.mods || []).map(([Ic, t, d], i) => (
        <div className="mod" key={i}><div className="mh"><span className="mi" style={{ background: typeof Ic === "string" ? "#F4F6FC" : `${color}1A` }}>{typeof Ic === "string" ? <Art name={Ic} size={24} /> : <Ic size={20} color={color} />}</span><div className="mt">{t}</div></div>
          <div className="md">{d}</div><div className="sk" style={{ width: "100%" }} /><div className="sk" style={{ width: "85%" }} /><div className="sk" style={{ width: "60%" }} /><span className="pl"><Lock size={11} /> 구현 예정</span></div>))}</div>
      <div className="perso"><span className="ic"><Sparkles size={20} color="#2DD4BF" /></span><div><b>초개인화 원칙</b><p>이 섹션의 모든 기능은 회원님의 건강지갑 데이터에 연결되어 개인 맞춤으로 동작하도록 설계됩니다.</p></div></div>
    </div>
  );
}

/* ====================== visuals ====================== */
function ShieldArt() {
  return (<svg width="160" height="104" viewBox="0 0 170 110">
    <g opacity="0.5" stroke="#BFD0FF" fill="none"><ellipse cx="85" cy="58" rx="78" ry="26" strokeWidth="1" /><ellipse cx="85" cy="58" rx="55" ry="18" strokeWidth="1" /></g>
    <circle cx="30" cy="42" r="11" fill="rgba(255,255,255,.18)" /><circle cx="140" cy="44" r="11" fill="rgba(255,255,255,.18)" />
    <path d="M85 18 L116 30 V58 C116 80 102 92 85 98 C68 92 54 80 54 58 V30 Z" fill="rgba(255,255,255,.16)" stroke="#CFE0FF" strokeWidth="1.5" />
    <g stroke="#fff" strokeWidth="6" strokeLinecap="round"><line x1="85" y1="44" x2="85" y2="72" /><line x1="71" y1="58" x2="99" y2="58" /></g></svg>);
}
function ActivityGauge({ value }) {
  const r = 46, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  return (<div style={{ textAlign: "center", flexShrink: 0 }}>
    <svg width="128" height="128" viewBox="0 0 120 120">
      <defs><linearGradient id="gg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A855F7" /><stop offset="55%" stopColor="#6366F1" /><stop offset="100%" stopColor="#22C55E" /></linearGradient></defs>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEF1F8" strokeWidth="12" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#gg4)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 60 60)" />
      <text x="60" y="52" textAnchor="middle" fontSize="11" fill="#697586" fontWeight="600">종합 활동지수</text>
      <text x="60" y="76" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1E293B">{value}</text>
      <text x="78" y="76" textAnchor="start" fontSize="11" fill="#9AA6BC">/100</text></svg>
    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>지난주 대비 <b style={{ color: "#EF4444" }}>▲ 8%</b></div></div>);
}

/* ══════════ 활용 스토리 — '결과지를 버리던 남자' (조성래 10년 여정) ══════════
   사업을 숫자가 아닌 삶으로 보여주는 고객 여정. 모든 장면은 이 홈페이지에서 실동작하는 기능 위에 서 있고,
   장면마다 해당 화면 바로가기와 '하이에게 물어보기'로 연결된다. */
const STORY_SCENES = [
  { era: "프롤로그", title: "뜯지 않은 봉투", c: "#64748B",
    text: ["조성래(54) 씨의 서랍에는 뜯지 않은 건강검진 봉투가 세 장 있습니다. 나쁜 소식일까 봐 — 이유는 그게 전부였습니다.", "3년 전, 오랜 친구 민석은 췌장암을 너무 늦게 발견했습니다. 2년에 한 번 오던 그 봉투를, 민석도 뜯지 않았습니다. 치료비는 가족의 아파트 평수를 줄였고, 이듬해 민석을 데려갔습니다.", "장례식장에서 조 씨는 생각했습니다. '나도 검진 안 받은 지 4년째구나.' 그러나 두려움은 행동이 되지 못했습니다 — 작년까지는."],
    links: [] },
  { era: "3월", title: "10초 — 계좌가 열리다", c: "#2563EB",
    text: ["자주 쓰는 멤버십 앱에 알림 하나가 떴습니다. '검진 예약만 해도 진단금 최대 1,000만 원 무료보험 + 3만 원 상당 정밀리포트 무료.' 옆에서 보던 아내가 말했습니다. \"여보, 이건 안 할 이유가 없잖아.\"", "간편 본인인증 한 번, 10초. 조 씨는 아직 모르지만 — 이 10초가 가족의 평생 건강자본 계좌가 열린 순간입니다."],
    ask: "검진 예약 도와줘",
    links: [["건강검진 예약 — 무료 검진대비보험 자동가입", "checkup"]] },
  { era: "4월", title: "결과지가 자산이 되던 날", c: "#0EA5E9",
    text: ["'하이'에게 \"검진 예약 도와줘\" 한마디로 검진센터 세 곳이 비교됐고, 예약과 동시에 검진대비보험 전자증권이 NFT로 지갑에 담겼습니다.", "검진을 마친 저녁, 4년 만에 처음 '뜯은' 결과지를 폰으로 찍자 OCR이 12개 항목을 읽어 표준코드(FHIR)로 바꾸고 블록체인에 기록했습니다. \"위변조 없음 ✓ — 이 데이터는 이제 조성래 님의 디지털 자산입니다.\" (1세대·원본 자산)", "버려지던 종이가 배당을 낳는 자산이 됐습니다. 조 씨는 서랍 속 봉투 세 장을 떠올렸습니다 — 저 안에도 자산이 잠들어 있었구나."],
    links: [["데이터 연결 — 사진 한 장, 1분", "onboarding"], ["데이터 금고 — 내 자산 확인", "mywallet"]] },
  { era: "5월", title: "민석의 숫자", c: "#16A34A",
    text: ["정밀리포트의 생체나이 52.5세 — 나쁘지 않았습니다. 그런데 한 줄이 숨을 멎게 했습니다. '췌장 관리 필요 · 당뇨 위험 주의.' 민석의 병이 시작된 곳이었습니다.", "다음 날 아침 '하이'는 담담했습니다. \"지금은 '위험'이 아니라 '신호'예요. 신호일 때 움직이면, 결과가 달라져요.\" 리포트는 두 번째 자산이 됐고(2세대·분석 자산), 하이가 짚어준 진단비 공백은 월 1.2만 원대 간편보험 가입 3분으로 메웠습니다.", "혈당 영양제는 광고가 아니라 성적표로 골랐습니다 — \"품질 인증: 이 제품 복용 회원군 지표 개선폭 상위 3%.\" 소비 마진의 50%는 HTK로 적립되고, 그중 30%는 보험료·치료비 전용 지갑에 잠깁니다. 소비할 때마다, 미래의 치료비가 쌓입니다."],
    links: [["나의 건강현황 — 생체나이·위험 리포트", "manage"], ["치료비 케어 — 보장 공백 3분 점검", "insurance"], ["건강쇼핑 — 성적표로 고르는 소비", "shop"]] },
  { era: "7월", title: "세 사람의 지갑", c: "#EA580C",
    text: ["아내(51)의 검진을 예약하고, 우리가족건강관리에 82세 노모를 등록했습니다.", "노모의 지갑에는 NFC 응급태그 — 구조사가 태그를 대면 혈액형·복용약·보호자만 제한 열람되고, 열람 기록은 체인에 남습니다. 노모의 혈압계는 매일 아침 수치를 플랫폼으로 보내기 시작했습니다.", "세 사람의 건강자본이 한 지갑 체계 안에서 함께 자라기 시작했습니다."],
    links: [["우리가족건강관리 — 가족 등록", "mypage"]] },
  { era: "9월", title: "점심시간 7분", c: "#7C3AED",
    text: ["공복혈당이 재측정에서도 높았습니다. '하이'가 제안했습니다. \"병원에 가실 필요 없어요. 지금 바로 내과 전문의를 연결해 드릴까요?\"", "AI 예진 요약이 의사에게 먼저 갔고, 조 씨는 사무실 책상에서 7분 화상진료를 받았습니다. 전자처방전은 지갑으로, 제휴 약국이 당일 배송·복약지도까지. 진료비는 HTK로 결제 — 수가는 스마트컨트랙트가 병원·약국·플랫폼에 당일(T+0) 자동 분배됐고, 기록은 세 번째 자산이 됐습니다(3세대·활용 자산).", "반차를 내던 반나절이, 점심시간 7분이 됐습니다."],
    links: [["병원 진료·원격진료 — 7분 화상진료", "hospital"]] },
  { era: "11월", title: "새벽 2시 17분", c: "#DB2777",
    text: ["폰이 울렸습니다. \"어머님 혈압 이상 추세 — 사흘 연속 상승, 새벽 급등.\" 3년 전 민석의 새벽 전화가 이렇게 시작됐었습니다. 그러나 이번엔 달랐습니다.", "앱에는 이미 '지금 연결 가능한 의사' 버튼이 떠 있었습니다. 5분 뒤 화상진료 — 의사의 화면에는 노모의 석 달치 혈압 추이(원격 모니터링·RPM)가 이미 그려져 있었습니다. \"약을 조정하겠습니다. 응급 상황은 아닙니다.\" 새벽 2시 40분, 조 씨는 다시 잠들 수 있었습니다.", "응급실 뺑뺑이가 될 뻔한 밤이 23분으로 끝났습니다. 다음 날 노모가 전화로 말했습니다. \"얘, 그 기계가 나보다 내 몸을 더 잘 아는구나.\""],
    links: [["재가·돌봄 — 원격 모니터링(RPM)", "homecare"]] },
  { era: "12월", title: "조용한 입금", c: "#059669",
    text: ["연말, 지갑에 낯선 알림이 떴습니다. \"데이터 활용 배당 — 귀하의 가명화 검진데이터(1세대)와 분석 리포트(2세대)가 췌장질환 조기발견 연구에 활용되었습니다.\"", "금액은 크지 않았습니다. 그러나 조 씨는 연구 제목을 오래 바라보았습니다. 췌장질환 조기발견 — 민석을 데려간 그 병. 내 데이터가 어딘가의 민석을 조금 더 일찍 발견하는 데 쓰이고, 그 대가는 약속된 분배율대로 지갑에 돌아옵니다.", "지갑에는 또 하나의 숫자가 있었습니다. 늘 먹던 비타민과 혈행개선 영양제를 하이핀 건강쇼핑에서 샀을 뿐인데, 이번 달 적립 토큰이 5만 2천 원. 검진 결과에 맞춰 추천된 것을 최저가로 사고, 그 마진의 절반이 다시 내 지갑으로 돌아온 것입니다 — 소비가 지출이 아니라 적립이 되는 셈이었습니다.", "데이터 주권이 소득이 되고, 소득이 의미가 되는 순간이었습니다. 그의 소비 마진 30%가 치료비 사각지대의 누군가에게 흘러가고 있다는 것도, 그는 이제 알고 있었습니다."],
    links: [["건강금융지갑 — 배당·적립 내역", "wallet"], ["사회적기업 — 치료비 나눔 구조", "social"]] },
  { era: "이듬해 3월", title: "젊어진 숫자, 다시 매겨진 보험료", c: "#F59E0B",
    text: ["1년간의 적립금이 다음 해 보험료에 자동 충당됐습니다 — 쓸수록 보험료가 내려갑니다. 재검진 리포트의 췌장 관리 지표는 '개선'. 신호일 때 움직인 결과였습니다.", "개선이 성과 자산(4세대)으로 편입되자 '하이'가 물었습니다. \"개선된 건강상태로 보험료 재산정을 신청할까요? 인하 및 가입확대형 전용이라 손해 볼 일은 없어요.\" 2주 뒤 갱신 안내서의 숫자가 작년보다 작아져 있었습니다.", "보험료란 나이를 따라 오르기만 하는 줄 알았던 조 씨는 그날 처음 알았습니다 — 이 플랫폼에서 보험료는 내 나이가 아니라, 내 관리를 따라갑니다. 여유 적립금은 헬스 세이빙과 하이핀 주식청약(참여증 NFT)으로 — 건강을 관리했을 뿐인데, 자산 포트폴리오가 생겼습니다."],
    links: [["치료비 케어 — 재산정·자동충당", "insurance"], ["Health NFT — 참여증·인증서", "nft"]] },
  { era: "5년 후", title: "약국 문에 붙은 스티커", c: "#0891B2",
    text: ["단골 약국 문에 낯선 스티커가 붙었습니다. \"하이핀 검증기관 — 이 약국은 대한민국 건강데이터의 무결성을 검증합니다.\"", "김 약사가 웃으며 말했습니다. \"요즘 처방 배송 손님 절반이 하이핀으로 와요. 검증 노드 하고 나서 단골이 늘었죠.\" 그 검증 참여의 진짜 담보는 코인이 아니라 — 조 씨 같은 손님의 발길이었습니다(송객 동맹).", "회원의 여정과 기관의 여정이, 같은 생태계에서 맞물려 돌고 있었습니다."],
    links: [["제휴·투자 신청 — 검증기관·송객 동맹", "partner"]] },
  { era: "10년 후", title: "수술 동의서 앞에서", c: "#EF4444",
    text: ["64세. 정기검진이 심장 혈관의 협착을 찾아냈습니다. 시술이 필요했습니다. 수술 동의서 앞에 앉은 조 씨는 문득 깨달았습니다 — 비용 항목을 한 번도 걱정하지 않았다는 것을.", "진단비 보험금이 나왔고, 10년간 잠겨 있던 치료비 케어 적립금이 본인부담을 덮었습니다. 청구서를 낼 일도 없었습니다 — 병원 진료 데이터가 블록체인을 통해 보험사에 안전하게 전송되자 보험금이 자동으로 심사·지급되어 치료비까지 실시간으로 정산됐고, 매달 보험료마저 그가 적립해 둔 디지털 화폐로 알아서 결제되고 있었습니다. 민석의 가족이 아파트를 줄이며 치렀던 그 비용을, 그는 서명 한 번으로 지나갔습니다. 시술은 성공했습니다 — 조기 발견이었으니까.", "지갑에는 1~4세대 데이터 자산 수십 개가 계보로 쌓여 매년 배당을 낳고, 당뇨는 10년째 '전단계'에서 멈춰 있고, 보험료는 성과 증명마다 내려갔습니다. 건강관리가 지출이 아니라 재산증식이었습니다. 노모는 원격 모니터링과 재가돌봄 속에서 존엄하게 아흔을 넘겼습니다."],
    links: [["치료비 케어 — 치료비 걱정 ZERO 구조", "insurance"]] },
  { era: "에필로그", title: "아들의 질문", c: "#2563EB",
    text: ["서른넷이 된 아들이 첫 직장 검진을 앞두고 물었습니다. \"아버지, 검진 그거 꼭 해야 해요?\"", "조 씨는 서랍을 열었습니다. 이제 그곳에 뜯지 않은 봉투는 없습니다 — 종이 자체가 없으니까. 그는 아들의 폰에 하이핀을 깔아주며 말했습니다.", "\"해야지. 그건 검사가 아니라 — 적금이야.\" 가족의 건강자본이, 다음 세대로 이어졌습니다."],
    links: [["나도 10초로 시작하기 — 건강검진 예약", "checkup"]] },
];
function StoryJourney({ onGo }) {
  const go = onGo || (() => {});
  const ask = (q) => { try { window.dispatchEvent(new CustomEvent("agentask", { detail: q })); } catch (e) {} };
  return (
    <div className="storywrap">
      <div className="story-hero">
        <span className="story-kicker"><BookOpen size={14} /> 이야기로 풀어본 하이핀 활용법</span>
        <div className="story-title">고객 여정 — '결과지를 버리던 남자'</div>
        <p className="story-sub">숫자가 아니라 삶으로 보여드립니다. 아래 모든 장면은 이 홈페이지에서 <b>실제로 동작하는 기능</b> 위에 서 있습니다 — 장면 끝의 버튼을 누르면 그 화면으로 바로 이동해요. 결론은 하나입니다: <b>평생 건강관리로 치료비가 커버되고, 재산이 불어나며, 건강한 삶이 가족과 다음 세대로 이어지는 생태계</b>.</p>
      </div>
      <div className="story-rail">
        {STORY_SCENES.map((s, i) => (
          <div className="story-scene" key={i} style={{ "--sc": s.c }}>
            <div className="story-era"><span className="story-dot" /><b>{s.era}</b><span className="story-t">{s.title}</span></div>
            <div className="story-card">
              {s.text.map((p, j) => <p key={j}>{p}</p>)}
              {(s.links.length > 0 || s.ask) && (
                <div className="story-links">
                  {s.links.map(([label, key]) => <button key={key + label} onClick={() => go(key)}>📍 {label} <ChevronRight size={12} /></button>)}
                  {s.ask && <button className="ghost" onClick={() => ask(s.ask)}><Bot size={13} /> 하이에게 "{s.ask}"</button>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="story-close">
        <b>이 이야기의 모든 기능이 지금 여기에 있습니다.</b>
        <div className="story-close-btns">
          <button className="pri" onClick={() => go("checkup")}>10초로 시작하기 — 검진 예약</button>
          <button onClick={() => ask("")}>하이에게 물어보기</button>
        </div>
      </div>
    </div>
  );
}

/* ── 오늘의 AI 추천 · 건강 활동 요약 — 홈에서 '검진 후 케어 › 나의 건강현황'으로 이동한 개인화 카드 ── */
function TodayAIRecs({ onGo }) {
  const go = onGo || (() => {});
  const PRODUCTS = [[Stethoscope, "복부 초음파 검진", "췌장·간 정밀 확인 권고.", "검진 예약", "#7C3AED", "linear-gradient(135deg,#EDE9FE,#DDD6FE)", "checkup"], [Salad, "당뇨 예방 식단", "저당·식이섬유 맞춤 식단.", "식단 보기", "#16A34A", "linear-gradient(135deg,#D1FAE5,#A7F3D0)", "shop"], [Pill, "간 건강 영양제", "밀크씨슬 등 간 영양제.", "제품 보기", "#F59E0B", "linear-gradient(135deg,#FEF3C7,#FDE68A)", "shop"], [Cigarette, "금연·절주 코칭", "췌장·간 위험 낮추기.", "신청하기", "#EF4444", "linear-gradient(135deg,#FEE2E2,#FECACA)", "ai"], [Dumbbell, "유산소 운동 코칭", "주 3회 운동 프로그램.", "신청하기", "#2563EB", "linear-gradient(135deg,#DBEAFE,#BFDBFE)", "ai"], [ClipboardList, "위·대장 내시경", "연령 권장 검진 예약.", "병원 보기", "#0EA5E9", "linear-gradient(135deg,#E0F2FE,#BAE6FD)", "hospital"]];
  return (
    <div className="card" style={{ marginTop: 14 }}><div className="ch"><div className="ct">오늘의 AI 추천</div><span className="link">초개인화 추천 <Sparkles size={12} /></span></div>
      <div className="prods">{PRODUCTS.map(([Ic, t, d, link, col, bg, target]) => (<div className="prod" key={t} onClick={() => go(target)} style={{ cursor: "pointer" }}><div className="img" style={{ background: bg }}><Ic size={36} color={col} /></div><div className="pb"><div className="pt">{t}</div><div className="pd">{d}</div><span className="pl" role="button" onClick={(e) => { e.stopPropagation(); go(target); }}>{link} <ChevronRight size={12} style={{ verticalAlign: -2 }} /></span></div></div>))}</div></div>
  );
}
/* [H-2 W6] 걸음·운동·수면·칼로리는 **측정 원천이 아직 없다**(웨어러블·건강앱 연동 전).
   전에는 45,231걸음·210분·7시간 30분·1,850kcal이 상수라 모든 회원이 같은 수치를 자기 활동으로 봤다.
   기기가 연결되면 여기서 읽으면 된다 — 그전까지는 무엇을 보여줄지만 알린다. */
function ActivitySummaryCard() {
  const ACTS = [[Footprints, "걸음 수"], [Activity, "운동 시간"], [Moon, "수면 시간"], [Flame, "칼로리 소모"]];
  return (
    <div className="card" style={{ marginTop: 14 }}><div className="ch"><div className="ct">건강 활동 요약</div><span className="link" style={{ border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 8, color: "var(--muted)" }}>기기 연동 전</span></div>
      <div className="chnote" style={{ margin: "2px 0 10px" }}>스마트워치·건강앱을 연결하시면 아래 항목을 매주 정리해 드려요. 아직 연결된 기기가 없어요.</div>
      <div className="act"><div className="metrics">{ACTS.map(([Ic, nm]) => (<div className="arow" key={nm}><Ic size={18} className="ic" /><span className="nm">{nm}</span><span className="bar"><i style={{ width: "0%" }} /></span><span className="vl" style={{ color: "var(--muted)" }}>—</span></div>))}</div></div></div>
  );
}
