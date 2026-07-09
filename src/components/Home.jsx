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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip ic={Salad}>건강식품</Chip><Chip ic={Stethoscope}>의료서비스</Chip><Chip ic={ShieldCheck}>보험</Chip><Chip ic={Activity}>홈케어 제품</Chip></div>
      </Stage></div>
      <Conn />

      {/* ⑦ Value Return */}
      <div style={{ ...wrapMax, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#FBBF24" }}>⑦ VALUE RETURN SYSTEM · 가치환원 순환</span></div>
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
        <div style={{ textAlign: "center", fontSize: 10.5, color: "#7FCCE4", marginTop: 8 }}>※ 나머지 20%는 플랫폼 운영 — 소비 가치가 개인 적립과 사회 나눔으로 순환합니다.</div>
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
    </div>
  );
}

function HomeView({ onGo }) {
  const go = onGo || (() => {});
  // 로그인한 회원 기준으로 홈 대시보드 개인화 (체험회원/가입회원 → 해당 고객, 없으면 조성래 기본)
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const authU = (typeof authCurrent === "function") ? authCurrent() : null;
  const R = dm ? demoReport(dm) : null;
  const nm = dm ? dm.name : (authU && authU.name ? authU.name : "조성래");
  const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const regA = R ? R.reg : "54.1";
  const bioA = R ? R.bio : "52.5";
  const diffN = R ? R.diff : -1.6;
  const diffLabel = (diffN <= 0 ? "" : "+") + diffN + "세";
  const diffGood = diffN <= 0;
  const SUMMARY = R ? [
    [Activity, `생체나이 ${R.bio}세`, diffGood ? "양호" : "주의", diffGood ? "#16A34A" : "#F59E0B", diffGood ? "#E7F8EE" : "#FEF3E2"],
    [Brain, `주의 장기 ${R.worstNames.join("·")}`, "노화 빠름", "#EF4444", "#FDECEC"],
    [ShieldCheck, `암위험 ${R.cancerTotal}등급`, R.cg[0], R.cg[1], R.cg[2]],
    R.hr.length ? [AlertTriangle, `고위험암 ${R.hr.join("·")}`, "경고", "#EF4444", "#FDECEC"] : [ShieldCheck, "고위험 암", "특이사항 없음", "#16A34A", "#E7F8EE"],
    [Banknote, "예상 의료비", `약 ${won(R.costThis)}`, "#2563EB", "#E8F1FE"],
  ] : [[Activity, "생체나이 52.5세", "좋음", "#16A34A", "#E7F8EE"], [HeartPulse, "당뇨병 위험", "동년배 ↑", "#F59E0B", "#FEF3E2"], [ShieldCheck, "췌장암", "경고", "#EF4444", "#FDECEC"], [Brain, "간·췌장 나이", "나쁨", "#EF4444", "#FDECEC"], [ShieldCheck, "전체 암", "4등급(낮음)", "#16A34A", "#E7F8EE"]];
  const ADVICE = R ? ((R.recs && R.recs.length ? R.recs.slice(0, 3) : ["정기 건강 모니터링"]).map((t, i) => [[Dumbbell, Salad, HeartHandshake][i % 3], t, "개인 맞춤 건강관리 권고입니다.", ["#2563EB", "#16A34A", "#7C3AED"][i % 3], ["#E8F1FE", "#E7F8EE", "#F1ECFE"][i % 3]])) : [[HeartPulse, "당뇨병 예방 관리", "동년배 대비 위험이 높아 운동·체중·혈당 관리가 필요합니다.", "#F59E0B", "#FEF3E2"], [Wine, "간·췌장 건강 관리", "간·췌장 나이가 높습니다. 절주·금연과 복부 초음파를 권고합니다.", "#7C3AED", "#F1ECFE"], [ClipboardList, "정기 건강검진", "위·대장 내시경 등 연령 권장 검진을 받으세요.", "#2563EB", "#E8F1FE"]];
  const PRODUCTS = [[Stethoscope, "복부 초음파 검진", "췌장·간 정밀 확인 권고.", "검진 예약", "#7C3AED", "linear-gradient(135deg,#EDE9FE,#DDD6FE)", "checkup"], [Salad, "당뇨 예방 식단", "저당·식이섬유 맞춤 식단.", "식단 보기", "#16A34A", "linear-gradient(135deg,#D1FAE5,#A7F3D0)", "shop"], [Pill, "간 건강 영양제", "밀크씨슬 등 간 영양제.", "제품 보기", "#F59E0B", "linear-gradient(135deg,#FEF3C7,#FDE68A)", "shop"], [Cigarette, "금연·절주 코칭", "췌장·간 위험 낮추기.", "신청하기", "#EF4444", "linear-gradient(135deg,#FEE2E2,#FECACA)", "ai"], [Dumbbell, "유산소 운동 코칭", "주 3회 운동 프로그램.", "신청하기", "#2563EB", "linear-gradient(135deg,#DBEAFE,#BFDBFE)", "ai"], [ClipboardList, "위·대장 내시경", "연령 권장 검진 예약.", "병원 보기", "#0EA5E9", "linear-gradient(135deg,#E0F2FE,#BAE6FD)", "hospital"]];
  const ACTS = [[Footprints, "걸음 수", "45,231", "걸음", 90], [Activity, "운동 시간", "210", "분", 70], [Moon, "수면 시간", "7시간 30분", "", 75], [Flame, "칼로리 소모", "1,850", "kcal", 80]];
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
      <div className="banner">
        <div><span className="pchip"><Sparkles size={13} /> {nm}님 맞춤 초개인화 대시보드</span><div className="head">AI가 {nm}님의 건강을 지키고 있습니다.</div><div className="sub">{R ? `${nm}님 시연용 예시 리포트와 생활데이터를 분석해 안내합니다.` : "프롬에이지 Premium 리포트와 생활데이터를 분석해 안내합니다."}</div></div>
        <div className="art"><ShieldArt /></div>
        <div className="bnext"><div className="l">다음 건강검진 예약</div><div className="d">2025.06.15 (토) 09:00</div><div className="c">서울 KMI 건강검진센터</div><button onClick={() => go("checkup")}>예약 상세보기</button></div>
      </div>
      <div className="reportcta">
        <div className="rcl">
          <span className="rcbadge"><FileText size={14} /> 건강검진 리포트</span>
          <div className="rch">생체나이 건강검진 리포트 발행</div>
          <p className="rcd">외부 검진 시스템에서 <b>고객 동의 절차</b>를 거쳐 건강검진 리포트를 발행할 수 있습니다. 발행된 리포트는 <b>건강관리 → 검진 리포트</b>에서 업로드해 보관·확인하세요.</p>
          <div className="rcbtns">
            <a className="rcbtn pri" href="https://www.healthketch.com/outside/event/checkup-analysis/hizencare-pp-0UVIFW" target="_blank" rel="noopener noreferrer">리포트 발행 사이트 열기 <ExternalLink size={15} /></a>
            <button className="rcbtn ghost" onClick={() => go("manage")}>건강관리에서 업로드 <ChevronRight size={14} /></button>
          </div>
          <div className="rcnote"><ShieldCheck size={13} /> 발행은 본인(고객) 동의 하에 외부 검진 시스템에서 진행됩니다.</div>
        </div>
        <div className="rcart"><span className="rcic"><FileText size={40} color="#fff" /></span></div>
      </div>
      <div className="profile">
        <span className="pa">{nm[0]}</span>
        <div><div className="pn">{nm} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{regA}세{R ? "" : " · 남"}</span></div><div className="pmeta"><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {R ? `${nm}님 시연용 체험 회원 · 맞춤 건강분석 적용` : `${PT.addr} · 검진일 2024.12.26 · 등록번호 ${PT.reg}`}</div></div>
        <div className="pstats">
          {[[regA + "세", "주민등록"], [bioA + "세", "생체나이"], [(R ? R.agingRank : 37) + "등", "노화등수"], [(R ? R.agingSpeed : 0.97) + "배", "노화속도"]].map(([v, k]) => (<div className="pstat" key={k}><div className="v">{v}</div><div className="k">{k}</div></div>))}
          <div className="pstat"><span className="tag-w" style={{ color: R ? R.cg[1] : "#16A34A", background: R ? R.cg[2] : "#E7F8EE" }}>종합 {R ? R.evalLabel : "좋음"}</span><div className="k" style={{ marginTop: 6 }}>생체나이</div></div>
        </div>
      </div>
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
      <div className="row4">
        <div className="card">
          <div className="ch"><div className="ct">생체나이 분석 <Info size={14} color="#B4BECF" /></div></div>
          <div className="bioh"><div><div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>생체나이</div><div className="bn">{bioA}<span> 세</span></div></div><Heart size={26} color="#22C55E" /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 2px" }}><span className="pill" style={R ? { color: R.cg[1], background: R.cg[2] } : null}>종합 {R ? R.evalLabel : "좋음"}</span><span style={{ fontSize: 12, color: "var(--muted)" }}>주민등록 대비 <b style={{ color: diffGood ? "var(--green)" : "#B91C1C" }}>{diffLabel}</b></span></div>
          <div className="riskgrid">{(R ? R.organs.map((o) => [o[0].replace("비만체형", "비만"), o[2], o[3] ? "#16A34A" : "#EF4444"]).concat([["노화속도", R.agingSpeed + "배", R.agingSpeed > 1 ? "#EF4444" : "#16A34A"]]) : [["비만체형", "좋음", "#16A34A"], ["심장", "좋음", "#16A34A"], ["간", "나쁨", "#EF4444"], ["췌장", "나쁨", "#EF4444"], ["신장", "좋음", "#16A34A"], ["노화속도", "0.97배", "#16A34A"]]).map(([k, v, c]) => (<div className="rk" key={k}><span style={{ color: "var(--muted)" }}>{k}</span><b style={{ color: c }}>{v}</b></div>))}</div>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">질병·암 위험 요약</div><div className="cmeta">프롬에이지 Premium</div></div>
          {SUMMARY.map(([Ic, nm, st, col, bg]) => (<div className="crow" key={nm}><Mini bg={bg}><Ic size={16} color={col} /></Mini><span className="nm">{nm}</span><span className="st" style={{ color: col }}>{st}</span></div>))}
          <button className="cbtn" onClick={() => go("manage")}>건강분석 리포트 보기</button>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">AI 건강권고</div></div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 12 }}>{nm}님 맞춤 AI 분석 결과입니다.</p>
          {ADVICE.map(([Ic, t, d, col, bg]) => (<div className="adv" key={t}><span className="ic" style={{ background: bg }}><Ic size={18} color={col} /></span><div><b>{t}</b><p>{d}</p></div></div>))}
          <button className="cbtn" onClick={() => go("manage")}>AI 건강 리포트 보기</button>
        </div>
        <div className="card" style={{ border: "1.5px solid #BFD0FF", boxShadow: "0 14px 30px -20px rgba(47,91,234,.5)" }}>
          <div className="ch"><div className="ct" style={{ fontSize: 14 }}>Digital Health Wallet</div><span className="link">자산 상세 <ChevronRight size={13} /></span></div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>총 건강자산</div><div className="wtot">₩2,480,000</div>
          <div className="wrow"><Mini bg="#FFF3E0"><Coins size={16} color="#F59E0B" /></Mini><span className="nm">Health Token</span><span className="vl">12,450 <span style={{ color: "#F59E0B" }}>HT</span></span></div>
          <div className="wrow"><Mini bg="#E8F1FE"><Wallet size={16} color="#2563EB" /></Mini><span className="nm">보험 적립금</span><span className="vl">₩1,240,000</span></div>
          <div className="wrow"><Mini bg="#F1ECFE"><BadgeCheck size={16} color="#7C3AED" /></Mini><span className="nm">NFT 건강인증서</span><span className="vl">5 개</span></div>
          <div className="wrow"><Mini bg="#E7F8EE"><Hash size={16} color="#16A34A" /></Mini><span className="nm">의료기록 해시</span><span className="vl">온체인</span></div>
          <button className="cbtn pri" onClick={() => go("wallet")}>지갑 바로가기</button>
        </div>
      </div>
      <div className="split">
        <div className="card"><div className="ch"><div className="ct">오늘의 AI 추천</div><span className="link">초개인화 추천 <Sparkles size={12} /></span></div>
          <div className="prods">{PRODUCTS.map(([Ic, t, d, link, col, bg, target]) => (<div className="prod" key={t} onClick={() => go(target)} style={{ cursor: "pointer" }}><div className="img" style={{ background: bg }}><Ic size={36} color={col} /></div><div className="pb"><div className="pt">{t}</div><div className="pd">{d}</div><span className="pl" role="button" onClick={(e) => { e.stopPropagation(); go(target); }}>{link} <ChevronRight size={12} style={{ verticalAlign: -2 }} /></span></div></div>))}</div></div>
        <div className="card"><div className="ch"><div className="ct">건강 활동 요약</div><span className="link" style={{ border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 8 }}>이번 주 <ChevronDown size={13} /></span></div>
          <div className="act"><div className="metrics">{ACTS.map(([Ic, nm, v, u, pct]) => (<div className="arow" key={nm}><Ic size={18} className="ic" /><span className="nm">{nm}</span><span className="bar"><i style={{ width: pct + "%" }} /></span><span className="vl">{v} <small style={{ display: "inline", color: "var(--muted)" }}>{u}</small><small>{pct}%</small></span></div>))}</div><ActivityGauge value={85} /></div></div>
      </div>
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
