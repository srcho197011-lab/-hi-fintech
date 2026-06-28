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
function HomeView({ onGo }) {
  const go = onGo || (() => {});
  // 로그인한 회원 기준으로 홈 대시보드 개인화 (데모회원/가입회원 → 해당 고객, 없으면 조성래 기본)
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
        <span className="hglow" style={{ width: 220, height: 220, top: -70, right: -40, background: "#22C55E", opacity: .32 }} />
        <span className="hglow" style={{ width: 200, height: 200, bottom: -90, left: 120, background: "#60A5FA", opacity: .3 }} />
        <div className="hcopy">
          <span className="heyebrow"><Art name="sparkle" size={15} /> 차세대 AI · Web3 기반 헬스·금융 플랫폼</span>
          <div className="htitle">Health-InsurFin Tech<br />치료비 걱정 없는 <b>평생 건강관리 생태계</b></div>
          <div className="hdesc">건강검진부터 일상 건강관리까지 <b>모든 헬스케어 활동에 임베디드보험을 결합</b>하여, 치료비 걱정 없는 평생 건강관리 생태계를 구현하는 차세대 AI·Web3 기반 헬스·금융 플랫폼입니다.</div>
          <div className="hchips">
            <span><Art name="check" size={16} /> 건강검진</span>
            <span><Art name="heart" size={16} /> 일상 건강관리</span>
            <span><Art name="badge" size={16} /> 임베디드보험</span>
            <span><Art name="coin" size={16} /> 치료비 걱정 ZERO</span>
            <span><Art name="hash" size={16} /> AI·Web3 생태계</span>
          </div>
        </div>
        <div className="hart"><HeroArt /></div>
      </div>
      <div className="banner">
        <div><span className="pchip"><Sparkles size={13} /> {nm}님 맞춤 초개인화 대시보드</span><div className="head">AI가 {nm}님의 건강을 지키고 있습니다.</div><div className="sub">{R ? `${nm}님 시연용 데모 리포트와 생활데이터를 분석해 안내합니다.` : "프롬에이지 Premium 리포트와 생활데이터를 분석해 안내합니다."}</div></div>
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
        <div><div className="pn">{nm} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{regA}세{R ? "" : " · 남"}</span></div><div className="pmeta"><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {R ? `${nm}님 시연용 데모 회원 · 맞춤 건강분석 적용` : `${PT.addr} · 검진일 2024.12.26 · 등록번호 ${PT.reg}`}</div></div>
        <div className="pstats">
          {[[regA + "세", "주민등록"], [bioA + "세", "생체나이"], [(R ? R.agingRank : 37) + "등", "노화등수"], [(R ? R.agingSpeed : 0.97) + "배", "노화속도"]].map(([v, k]) => (<div className="pstat" key={k}><div className="v">{v}</div><div className="k">{k}</div></div>))}
          <div className="pstat"><span className="tag-w" style={{ color: R ? R.cg[1] : "#16A34A", background: R ? R.cg[2] : "#E7F8EE" }}>종합 {R ? R.evalLabel : "좋음"}</span><div className="k" style={{ marginTop: 6 }}>생체나이</div></div>
        </div>
      </div>
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
