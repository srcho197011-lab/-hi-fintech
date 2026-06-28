function HealthManageSection({ onGo }) {
  const [synced, setSynced] = useState(true);
  const [viewer, setViewer] = useState(false);
  const [cat, setCat] = useState("summary");
  const RECS = [[Dumbbell, "주 3회 유산소 운동"], [Salad, "식이섬유·저당 식단"], [Wine, "절주 (하루 2잔 이하)"], [Cigarette, "금연 실천"], [Stethoscope, "복부 초음파(췌장·간)"], [Pill, "간 건강 영양제"], [ClipboardList, "위·대장 내시경"], [HeartHandshake, "정기 건강 모니터링"]];
  const cats = [["summary", "한눈에 보기", LayoutDashboard], ["bio", "생체나이", Activity], ["disease", "질병 위험", HeartPulse], ["cancer", "암 위험", ShieldCheck], ["warn", "경고신호", AlertTriangle], ["care", "관리·권고", Sparkles]];
  const go = onGo || (() => {});
  const Go = ({ to, ic: Ic, pri, children }) => <button className={`gobtn ${pri ? "pri" : ""}`} onClick={() => go(to)}><Ic size={14} /> {children}</button>;
  // 데모 회원 로그인 시 리포트 데이터를 회원 기준으로 치환
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const R = dm ? demoReport(dm) : null;
  const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const bioAge = R ? R.bio : PT.bioAge;
  const regAge = R ? R.reg : PT.regAge;
  const diffN = R ? R.diff : -1.6;
  const diffLabel = (diffN <= 0 ? "" : "+") + diffN + "세";
  const diffGood = diffN <= 0;
  const agingRank = R ? R.agingRank : PT.agingRank;
  const agingSpeed = R ? R.agingSpeed : PT.agingSpeed;
  const organs = R ? R.organs : ORGANS;
  const diseases = R ? R.diseases : DISEASES;
  const cancers = R ? R.cancers : CANCERS;
  const cancerTotal = R ? R.cancerTotal : 4;
  const costThis = R ? R.costThis : 2381477;
  const cost10v = R ? R.cost10 : 3089692;
  const worstStr = R ? R.worstNames.join("·") : "간·췌장";
  const evalLabel = R ? R.evalLabel : "좋음";
  const careRecs = R ? R.recs : null;
  const sumFlags = R ? R.flags : [{ t: "당뇨병 위험 +6.2%", c: "#B45309", bg: "#FEF3E2", ic: "up" }, { t: "췌장암 경고", c: "#fff", bg: "#EF4444", ic: "warn" }, { t: "간 54.4세 · 췌장 56.2세", c: "#B91C1C", bg: "#FDECEC" }, { t: "심장·신장·전체암 양호", c: "#15803D", bg: "#E7F8EE", ic: "check" }];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="manage" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강관리</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강분석 리포트 — 생체나이 · 질병/암 위험 · 경고신호 · 맞춤 관리 (프롬에이지 Premium 기반)</div></div></div>
      <DemoMemberBanner />

      <div className="src"><ExternalLink size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>데이터 출처: <b>프롬에이지 Premium · 메디에이지연구소</b> (gene.imhealth.co.kr) · 등록번호 {PT.reg} · 검진일 {PT.checkup} · 분석일 {PT.analyzed}. 의학적 진단을 대신할 수 없으며, 동일 성·연령군 대비 상대 위험도입니다.</div></div>

      <div className="conn">
        <span className="cdot" style={{ background: synced ? "#16A34A" : "#F59E0B", boxShadow: synced ? "0 0 0 4px rgba(22,163,74,.15)" : "0 0 0 4px rgba(245,158,11,.15)" }} />
        <div className="ctxt"><b>{R ? "데모 회원 리포트 표시 중" : `메디에이지 연동 ${synced ? "완료" : "필요"}`}</b><div style={{ color: "var(--muted)", marginTop: 2 }}>{R ? `${dm.name}님 시연용 데모 건강 리포트가 표시되고 있습니다.` : (synced ? "조성래님 프롬에이지 Premium 리포트가 표시되고 있습니다." : "계정 인증 후 실데이터를 불러옵니다.")}</div></div>
        <button className="cbtn2" onClick={() => setSynced(true)}><RefreshCw size={14} /> 새로고침</button>
      </div>

      <div className="chtabs">{cats.map(([k, t, Ic]) => <div key={k} className={`chtab ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}><Ic size={15} /> {t}</div>)}</div>

      {cat === "summary" && (<>
        <div className="card">
          <div className="rct"><LayoutDashboard size={18} color="#2F5BEA" /> 한눈에 보기 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: R ? R.cg[1] : "var(--green)", background: R ? R.cg[2] : "#E7F8EE", padding: "4px 10px", borderRadius: 999 }}>종합평가 {evalLabel}</span></div>
          <div className="sumgrid">
            <div className="sumcard"><div className="sl">생체나이</div><div className="sv" style={{ color: "var(--blue)" }}>{bioAge}세</div><span className="sb" style={{ color: diffGood ? "#15803D" : "#B91C1C", background: diffGood ? "#E7F8EE" : "#FDECEC" }}>주민등록 {diffLabel}</span></div>
            <div className="sumcard"><div className="sl">노화등수</div><div className="sv">{agingRank}등</div><span className="sb" style={{ color: "#2563EB", background: "#E8F1FE" }}>/100</span></div>
            <div className="sumcard"><div className="sl">노화속도</div><div className="sv">{agingSpeed}배</div><span className="sb" style={{ color: agingSpeed > 1 ? "#B45309" : "#15803D", background: agingSpeed > 1 ? "#FEF3E2" : "#E7F8EE" }}>{agingSpeed > 1 ? "평균보다 빠름" : "평균보다 느림"}</span></div>
            <div className="sumcard"><div className="sl">주의 장기</div><div className="sv" style={{ color: "#EF4444", fontSize: 15 }}>{worstStr}</div><span className="sb" style={{ color: "#B91C1C", background: "#FDECEC" }}>노화 빠름</span></div>
          </div>
          <div className="sumflags">{sumFlags.map((f, i) => (
            <span className="fl" key={i} style={{ color: f.c, background: f.bg }}>{f.ic === "up" ? <ArrowUp size={12} /> : f.ic === "warn" ? <AlertTriangle size={12} /> : f.ic === "check" ? <Check size={12} /> : null} {f.t}</span>
          ))}</div>
        </div>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> 지금 할 일 · 맞춤 가이드</div>
          <div className="adv"><span className="ic" style={{ background: "#F1ECFE" }}><Stethoscope size={18} color="#7C3AED" /></span><div style={{ flex: 1 }}><b>{R ? `${worstStr} 정밀검사` : "간·췌장 정밀검사"}</b><p>{R ? `${worstStr} 노화 빠름${R.hr.length ? ` · 고위험 암 ${R.hr.join("·")}` : ""} — 복부 초음파/내시경 권장` : "간 54.4세·췌장 56.2세·췌장암 경고 — 복부 초음파/내시경 권장"}</p></div><Go to="checkup" ic={CalendarCheck} pri>검진 예약</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#FEF3E2" }}><Activity size={18} color="#F59E0B" /></span><div style={{ flex: 1 }}><b>당뇨 예방 관리</b><p>당뇨병 위험 동년배 +6.2% — 저당 식단·혈당 모니터링</p></div><Go to="shop" ic={ShoppingCart}>건강쇼핑</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#E8F1FE" }}><Building2 size={18} color="#2563EB" /></span><div style={{ flex: 1 }}><b>전문병원 연결</b><p>거주지(은평구) 기준 내과·영상의학과 맞춤 병원</p></div><Go to="hospital" ic={Building2}>병원 찾기</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#FCE7F3" }}><HeartHandshake size={18} color="#DB2777" /></span><div style={{ flex: 1 }}><b>돌봄·간병 상담</b><p>방문간호·재활 등 재가/돌봄 연계 필요 시</p></div><Go to="homecare" ic={HeartHandshake}>재가·돌봄</Go></div>
          <div className="gorow"><Go to="ai" ic={MessageSquare}>AI 상담</Go><Go to="insurance" ic={ShieldCheck}>보험 보기</Go><button className="gobtn" onClick={() => setViewer(true)}><ExternalLink size={14} /> 원본 리포트</button></div>
        </div>
      </>)}

      {cat === "bio" && (<>
        <div className="card">
          <div className="rct"><Activity size={18} color="#7C3AED" /> 생체나이 분석 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--green)", background: "#E7F8EE", padding: "4px 10px", borderRadius: 999 }}>종합평가 좋음</span></div>
          <div className="bigbio">
            <div><div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 700 }}>생체나이</div><div className="n">{bioAge}<span> 세</span></div></div>
            <div className="biokv">
              <div><div className="v" style={{ color: diffGood ? "var(--green)" : "#EF4444" }}>{diffLabel}</div><div className="k">주민등록 {regAge}세 대비</div></div>
              <div><div className="v">{agingRank}등<span style={{ fontSize: 11, color: "var(--soft)" }}> /100</span></div><div className="k">노화등수</div></div>
              <div><div className="v">{agingSpeed}배</div><div className="k">노화속도(평균{agingSpeed > 1 ? "↑" : "↓"})</div></div>
            </div>
          </div>
          <div className="organs">{organs.map(([nm, age, st, good]) => (
            <div className="organ" key={nm}><div className="ok">{nm}나이</div><div className="ov">{age}세</div><div className="ob" style={{ color: good ? "#16A34A" : "#EF4444", background: good ? "#E7F8EE" : "#FDECEC" }}>{st}</div></div>))}</div>
        </div>
        {R ? (
          <div className="card"><div className="rct"><TrendingUp size={18} color="#2563EB" /> 생체나이 vs 주민등록나이</div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{dm.name}님 생체나이 <b style={{ color: "var(--blue)" }}>{bioAge}세</b>는 주민등록나이 {regAge}세보다 {diffGood ? `${Math.abs(diffN)}세 낮아(노화 느림)` : `${diffN}세 높아(노화 빠름)`}, 노화속도 {agingSpeed}배입니다. <span style={{ color: "var(--soft)" }}>※ 시연용 데모 데이터 · 연도별 추이는 실연동 시 제공됩니다.</span></p>
          </div>
        ) : (
          <div className="card">
            <div className="rct"><TrendingUp size={18} color="#2563EB" /> 생체나이 추이</div>
            <div className="tlegend">
              <span><span style={{ width: 16, height: 3, background: "#2F5BEA", borderRadius: 2, display: "inline-block" }} /> 생체나이</span>
              <span><span style={{ width: 16, borderTop: "2px dashed #94A3B8", display: "inline-block" }} /> 주민등록나이</span>
            </div>
            <BioTrendChart />
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 8 }}>※ 2024.12 측정값은 실측이며, 이전 시점은 추이 예시입니다(연동 시 실측으로 채워집니다). 생체나이가 주민등록나이보다 낮을수록 노화가 느린 상태입니다.</p>
          </div>
        )}
        <div className="gorow"><Go to="checkup" ic={CalendarCheck} pri>검진 예약</Go><Go to="shop" ic={ShoppingCart}>건강쇼핑</Go><Go to="ai" ic={MessageSquare}>AI 상담</Go></div>
      </>)}

      {cat === "disease" && (<>
        <div className="rgrid2">
          <div className="card">
            <div className="rct"><HeartPulse size={18} color="#EF4444" /> 질병 9종 위험도</div>
            {diseases.map(([nm, pct, inc]) => {
              const up = pct > 0;
              return (<div className="drow" key={nm}><span className="dn">{nm}</span>
                <span className="dp" style={{ color: up ? "#B45309" : "#15803D", background: up ? "#FEF3E2" : "#E7F8EE" }}>{up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{up ? "+" : ""}{pct}%</span>
                <span className="di">10년 발생률 {inc}</span></div>);
            })}
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 10 }}>※ 동년배 평균 대비 상대 위험도{R ? " · 시연용 데모 추정치" : ". 당뇨병만 평균보다 높습니다."}</p>
          </div>
          <div className="card">
            <div className="rct"><Banknote size={18} color="#16A34A" /> 의료비·의료이용 예측</div>
            <div className="costrow"><span className="cl">올해 예상 의료비</span><span className="cv" style={{ color: "var(--green)" }}>{won(costThis)}</span><span className="ca">동년배 {won(Math.round(costThis * 0.95))}</span></div>
            <div className="costrow"><span className="cl">10년 후 의료비</span><span className="cv">{won(cost10v)}</span><span className="ca">동년배 {won(Math.round(cost10v * 0.95))}</span></div>
            <div className="costrow"><span className="cl">외래진료(올해)</span><span className="cv">{R ? 18 + cancerTotal : 24}일</span><span className="ca">동년배 {R ? 16 + cancerTotal : 22}일</span></div>
            <div className="costrow"><span className="cl">입원(올해)</span><span className="cv">{R ? Math.max(2, cancerTotal) : 24}일</span><span className="ca">동년배 {R ? Math.max(1, cancerTotal - 2) : 22}일</span></div>
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 10 }}>※ 생체나이 기반 예측{R ? "(시연용 데모)" : ""}. 예방 관리로 의료비를 낮출 수 있습니다.</p>
          </div>
        </div>
        <div className="gorow"><Go to="hospital" ic={Building2} pri>병원 찾기</Go><Go to="insurance" ic={ShieldCheck}>보험 보기</Go><Go to="shop" ic={ShoppingCart}>혈당·영양 관리</Go></div>
      </>)}

      {cat === "cancer" && (<>
        <div className="card">
          <div className="rct"><ShieldCheck size={18} color="#F59E0B" /> 암 위험도 (전체 {cancerTotal}등급/10)</div>
          <div className="scale">{Array.from({ length: 10 }).map((_, i) => { const segC = cancerTotal <= 3 ? "#34D399" : cancerTotal <= 5 ? "#F59E0B" : cancerTotal <= 7 ? "#EF4444" : "#B91C1C"; return (<span className="seg" key={i} style={{ background: i < cancerTotal ? segC : "#EEF1F8" }} />); })}</div>
          <p style={{ fontSize: 11, color: "var(--soft)", margin: "0 0 12px" }}>전체 암 위험도 {cancerTotal}등급 · {R ? R.cg[0] : "낮은 편"}{R && R.hr.length ? ` · 고위험: ${R.hr.join("·")}` : ""}</p>
          <div className="cgrid">{cancers.map(([nm, g]) => (
            <div className="cc" key={nm} style={g === "경고" ? { borderColor: "#FBCFB6", background: "#FFF6F0" } : {}}>
              <span className="cn">{nm}</span><span className="cg" style={{ color: "#fff", background: gradeColor(g) }}>{g}</span></div>))}</div>
        </div>
        <CancerDetail hr={R ? R.hr : null} />
        <div className="gorow"><Go to="checkup" ic={CalendarCheck} pri>검진 예약</Go><Go to="hospital" ic={Building2}>전문병원 찾기</Go><Go to="shop" ic={ShoppingCart}>면역·영양 관리</Go></div>
      </>)}

      {cat === "warn" && (<>
        <WarnSigns />
        <div className="gorow"><Go to="ai" ic={MessageSquare} pri>AI 상담</Go><Go to="hospital" ic={Building2}>병원 예약</Go></div>
      </>)}

      {cat === "care" && (
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> AI 맞춤 권고</div>
          <div className="recs">{(careRecs && careRecs.length ? careRecs.map((t) => [Sparkles, t]) : RECS).map(([Ic, t]) => <div className="rec" key={t}><Ic size={15} color="#7C3AED" />{t}</div>)}</div>
          <button className="cbtn pur" onClick={() => setViewer(true)}><ExternalLink size={15} /> 메디에이지 원본 리포트 보기</button>
          <button className="cbtn" onClick={() => toast("데이터 제공에 동의했습니다. Health Token이 적립됩니다.")}><Coins size={15} /> 데이터 제공 동의하고 Health Token 받기</button>
          <div className="gorow"><Go to="shop" ic={ShoppingCart} pri>건강쇼핑</Go><Go to="homecare" ic={HeartHandshake}>재가·돌봄</Go><Go to="checkup" ic={CalendarCheck}>검진 예약</Go><Go to="hospital" ic={Building2}>병원 찾기</Go></div>
        </div>
      )}
      {viewer && <OriginalReport onClose={() => setViewer(false)} />}
    </div>
  );
}

/* ====================== 추이/상세 컴포넌트 ====================== */
function BioTrendChart() {
  const years = ["2021.12", "2022.12", "2023.12", "2024.12"];
  const reg = [51.1, 52.1, 53.1, 54.1];
  const bio = [51.4, 51.9, 52.4, 52.5];
  const W = 540, H = 196, padX = 34, padTop = 16, padBot = 30, min = 50.5, max = 55;
  const x = (i) => padX + i * (W - padX * 2) / (years.length - 1);
  const y = (v) => padTop + (max - v) / (max - min) * (H - padTop - padBot);
  const path = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {[51, 52, 53, 54, 55].map((g) => (<g key={g}><line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="#EEF1F8" /><text x={padX - 8} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#9AA6BC">{g}</text></g>))}
      <path d={path(reg)} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
      <path d={path(bio)} fill="none" stroke="#2F5BEA" strokeWidth="2.5" strokeLinecap="round" />
      {reg.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#94A3B8" />)}
      {bio.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === bio.length - 1 ? 5 : 3.5} fill="#fff" stroke="#2F5BEA" strokeWidth="2.5" />)}
      {bio.map((v, i) => <text key={i} x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1E40C8">{v}</text>)}
      {years.map((yr, i) => <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#9AA6BC">{yr}</text>)}
    </svg>
  );
}

function CancerDetail({ hr }) {
  const [open, setOpen] = useState(2);
  return (
    <div className="card">
      <div className="rct"><ShieldCheck size={18} color="#F59E0B" /> 암 10종 상세 · 예방가이드</div>
      {CANCER_DETAIL.map((c0, i) => { const c = hr ? { ...c0, g: hr.some((h) => h.indexOf(c0.n.replace("암", "")) >= 0) ? "경고" : "양호" } : c0; return (
        <div className="acc" key={c.n} style={c.g === "경고" ? { borderColor: "#FBCFB6" } : {}}>
          <div className="acch" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="an">{c.n}</span>
            <span className="arisk">위험도 {c.risk}</span>
            <span className="ag" style={{ background: gradeColor(c.g) }}>{c.g}</span>
            <ChevronDown size={16} color="#9AA6BC" style={{ transform: open === i ? "rotate(180deg)" : "none", transition: ".2s" }} />
          </div>
          {open === i && (
            <div className="accbody">
              <div className="inc">📊 발생률 통계 — {c.inc}</div>
              <div className="guide">
                <div className="gcol"><div className="gt" style={{ color: "#15803D" }}><Check size={13} /> 이렇게 하세요</div><ul>{c.do.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                <div className="gcol"><div className="gt" style={{ color: "#B45309" }}><Ban size={13} /> 이건 피하세요</div><ul>{c.avoid.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                <div className="gcol"><div className="gt" style={{ color: "#2563EB" }}><Info size={13} /> 기억하세요</div><ul>{c.remember.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
              </div>
            </div>
          )}
        </div>
      ); })}
    </div>
  );
}

function WarnSigns() {
  const [open, setOpen] = useState(0);
  return (
    <div className="card">
      <div className="rct"><AlertTriangle size={18} color="#EF4444" /> 주요 질병 경고신호</div>
      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: -8, marginBottom: 12 }}>다음 전조증상이 나타나면 경고신호를 무시하지 말고 주치의와 상담하세요.</p>
      {WARN_SIGNS.map((w, i) => (
        <div className="acc" key={w.n}>
          <div className="acch" onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="an">{w.n}</span>
            {w.tag && <span className="ag" style={{ background: w.color }}>{w.tag}</span>}
            <ChevronDown size={16} color="#9AA6BC" style={{ transform: open === i ? "rotate(180deg)" : "none", transition: ".2s" }} />
          </div>
          {open === i && (<div className="accbody">{w.signs.map((s, k) => <div className="warn" key={k}><AlertTriangle size={13} className="wi" color="#EF4444" />{s}</div>)}</div>)}
        </div>
      ))}
    </div>
  );
}

/* ====================== 원본 리포트 뷰어 ====================== */
function OriginalReport({ onClose }) {
  const PGH = (<div className="pghead"><div className="brand">메디에이지연구소 · 프롬에이지 Premium</div><div className="pinfo">이름 {PT.name} · {PT.sexAge}<br />등록번호 {PT.reg}<br />검진일 {PT.checkup}</div></div>);
  return (
    <div className="voverlay" onClick={onClose}>
      <div className="viewer" onClick={(e) => e.stopPropagation()}>
        <div className="vhead">
          <div className="vt"><FileText size={17} color="#7C3AED" /> 건강분석 리포트 (원본)</div>
          <div className="vh-actions">
            <button onClick={() => window.print()}><Printer size={14} /> 인쇄</button>
            <button className="close" onClick={onClose}><X size={15} /> 닫기</button>
          </div>
        </div>
        <div className="vbody">
          {/* 표지 */}
          <div className="page coverbox">
            <div className="ct1">PROM-AGE PREMIUM · 메디에이지연구소</div>
            <div className="ct2">생체나이 건강지표 기반<br />질병 · 암 발생 위험도 및 의료비 예측 분석</div>
            <div style={{ margin: "18px 0", fontSize: 14, fontWeight: 700 }}>성명 {PT.name} · {PT.sexAge} · 분석일 {PT.analyzed}</div>
            <div className="disclaim">본 분석은 의학적으로 검증된 지표로 질병과 암 발생 위험도 및 지출 의료비를 예측합니다. 실제 위험도는 각 개인의 유전적 요인·생활습관·환경적 요인 등에 의해 달라질 수 있습니다. 본 검사의 결과는 의학적 진단을 대신할 수 없으며, 진단 및 치료 결정을 위해서는 반드시 주치의와 상의하세요.</div>
          </div>

          {/* 종합분석 */}
          <div className="page">{PGH}
            <div className="pgidx">종합분석 · Overall Analysis</div>
            <div className="pgtitle">분석 요약</div>
            <div className="organs" style={{ marginTop: 16 }}>
              <div className="organ"><div className="ok">생체나이</div><div className="ov">{PT.bioAge}세</div><div className="ob" style={{ color: "#16A34A", background: "#E7F8EE" }}>-1.6세</div></div>
              <div className="organ"><div className="ok">노화등수</div><div className="ov">{PT.agingRank}등</div><div className="ob" style={{ color: "#2563EB", background: "#E8F1FE" }}>/100</div></div>
              <div className="organ"><div className="ok">노화속도</div><div className="ov">{PT.agingSpeed}배</div><div className="ob" style={{ color: "#16A34A", background: "#E7F8EE" }}>느림</div></div>
              <div className="organ"><div className="ok">종합평가</div><div className="ov" style={{ fontSize: 15 }}>좋음</div><div className="ob" style={{ color: "#16A34A", background: "#E7F8EE" }}>양호</div></div>
            </div>
            <div className="rct" style={{ fontSize: 14, marginTop: 18 }}>의료비 예측</div>
            <div className="costrow"><span className="cl">금년도 의료비</span><span className="cv">2,381,477원</span><span className="ca">동년배 2,247,942원</span></div>
            <div className="costrow"><span className="cl">10년 후 의료비</span><span className="cv">3,089,692원</span><span className="ca">동년배 2,915,692원</span></div>
          </div>

          {/* INDEX 1 생체나이 */}
          <div className="page">{PGH}
            <div className="pgidx" style={{ background: "#2563EB" }}>INDEX 1 · 생체나이 분석</div>
            <div className="pgtitle">생체나이 {PT.bioAge}세 <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 700 }}>(주민등록 {PT.regAge}세 대비 -1.6세)</span></div>
            <div className="pgsub">생체나이가 적다는 것은 동년배보다 전반적 건강 상태가 좋고 노화가 느리게 진행 중임을 의미합니다.</div>
            <div className="organs" style={{ marginTop: 16 }}>{ORGANS.map(([nm, age, st, good]) => (
              <div className="organ" key={nm}><div className="ok">{nm}나이</div><div className="ov">{age}세</div><div className="ob" style={{ color: good ? "#16A34A" : "#EF4444", background: good ? "#E7F8EE" : "#FDECEC" }}>{st}</div></div>))}</div>
          </div>

          {/* INDEX 2 질병 */}
          <div className="page">{PGH}
            <div className="pgidx" style={{ background: "#EF4444" }}>INDEX 2 · 질병 위험도 (9종)</div>
            <div className="pgtitle">질병 9종 발생 위험도</div>
            <div style={{ marginTop: 12 }}>{DISEASES.map(([nm, pct, inc]) => { const up = pct > 0; return (
              <div className="drow" key={nm}><span className="dn">{nm}</span>
                <span className="dp" style={{ color: up ? "#B45309" : "#15803D", background: up ? "#FEF3E2" : "#E7F8EE" }}>{up ? "+" : ""}{pct}%</span>
                <span className="di">10년 발생률 {inc}</span></div>); })}</div>
            <p style={{ fontSize: 11, color: "var(--soft)", margin: "8px 0 18px" }}>※ 동년배(50대 남성) 평균 대비 상대 위험도</p>
            <div className="rct" style={{ fontSize: 14 }}><AlertTriangle size={16} color="#EF4444" /> 경고신호</div>
            {WARN_SIGNS.map((w) => (<div key={w.n} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{w.n}{w.tag && <span className="ag" style={{ background: w.color, marginLeft: 6 }}>{w.tag}</span>}</div>
              <div style={{ fontSize: 12, color: "#5a6678", lineHeight: 1.6 }}>{w.signs.join(" · ")}</div></div>))}
          </div>

          {/* INDEX 3 암 */}
          <div className="page">{PGH}
            <div className="pgidx" style={{ background: "#F59E0B" }}>INDEX 3 · 암 위험도 (10종)</div>
            <div className="pgtitle">전체 암 위험도 4등급 / 10 <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>(낮은 편)</span></div>
            {CANCER_DETAIL.map((c) => (
              <div key={c.n} style={{ borderTop: "1px solid #EEF1F8", padding: "14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{c.n}</span>
                  <span className="ag" style={{ background: gradeColor(c.g) }}>{c.g}</span>
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>위험도 {c.risk} · 발생률 {c.inc}</span>
                </div>
                <div className="guide">
                  <div className="gcol"><div className="gt" style={{ color: "#15803D" }}><Check size={13} /> 이렇게 하세요</div><ul>{c.do.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                  <div className="gcol"><div className="gt" style={{ color: "#B45309" }}><Ban size={13} /> 이건 피하세요</div><ul>{c.avoid.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                  <div className="gcol"><div className="gt" style={{ color: "#2563EB" }}><Info size={13} /> 기억하세요</div><ul>{c.remember.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                </div>
              </div>))}
          </div>

          {/* INDEX 4 의료비 */}
          <div className="page">{PGH}
            <div className="pgidx" style={{ background: "#16A34A" }}>INDEX 4 · 의료비·의료이용 예측</div>
            <div className="pgtitle">생체나이 기반 의료비 예측</div>
            <div style={{ marginTop: 12 }}>
              <div className="costrow"><span className="cl">금년도 의료비</span><span className="cv">2,381,477원</span><span className="ca">동년배 2,247,942원</span></div>
              <div className="costrow"><span className="cl">10년 후 의료비</span><span className="cv">3,089,692원</span><span className="ca">동년배 2,915,692원</span></div>
              <div className="costrow"><span className="cl">외래진료(금년)</span><span className="cv">24일</span><span className="ca">동년배 22일</span></div>
              <div className="costrow"><span className="cl">입원(금년)</span><span className="cv">24일</span><span className="ca">동년배 22일</span></div>
            </div>
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 14 }}>메디에이지연구소 · 경기도 성남시 수정구 창업로 42, 635호 · TEL 02-555-6438 · info@mediage.co.kr</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================== 건강검진 섹션 ====================== */
