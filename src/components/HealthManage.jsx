function HealthManageSection({ onGo }) {
  const [synced, setSynced] = useState(true);
  const [viewer, setViewer] = useState(false);
  const [cat, setCat] = useState("summary");
  const RECS = [[Dumbbell, "주 3회 유산소 운동"], [Salad, "식이섬유·저당 식단"], [Wine, "절주 (하루 2잔 이하)"], [Cigarette, "금연 실천"], [Stethoscope, "복부 초음파(췌장·간)"], [Pill, "간 건강 영양제"], [ClipboardList, "위·대장 내시경"], [HeartHandshake, "정기 건강 모니터링"]];
  const cats = [["summary", "한눈에 보기", LayoutDashboard], ["checkup", "검진 항목현황", ClipboardList], ["careloop", "진료 연계", Building2], ["bio", "생체나이", Activity], ["disease", "질병 위험", HeartPulse], ["cancer", "암 위험", ShieldCheck], ["warn", "경고신호", AlertTriangle], ["care", "관리·권고", Sparkles], ["report", "검진 리포트", FileText]];
  const go = onGo || (() => {});
  const Go = ({ to, ic: Ic, pri, children }) => <button className={`gobtn ${pri ? "pri" : ""}`} onClick={() => go(to)}><Ic size={14} /> {children}</button>;
  /* [H-2 W3] 리포트는 「지금 로그인한 회원」 기준으로 계산한다.
     전에는 체험회원(dm)일 때만 계산하고 아니면 null로 두어, 아래 모든 값이 PT(조성래 실데이터)
     상수로 떨어졌다 — 그래서 회원이 누구든 생체나이 52.5세·췌장암 경고·간 54.4세가 자기 것처럼 보였다.
     demoReport는 금고에 실검진이 있으면 그걸 쓰므로(계보 연동) 본인 계정도 정상 동작한다. */
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const selfM = dm || (typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  const R = (selfM && typeof demoReport === "function") ? (() => { try { return demoReport(selfM); } catch (e) { return null; } })() : null;
  const chk = (selfM && typeof genMemberCheckup === "function") ? (() => { try { return genMemberCheckup(Object.assign({}, selfM)); } catch (e) { return null; } })() : null;
  const hg = (selfM && typeof memberHealthGrade === "function") ? (() => { try { return memberHealthGrade(selfM); } catch (e) { return null; } })() : null;
  const ckFlags = chk ? [
    { t: `국가검진 ${chk.nat.grade}`, c: chk.nat.grade === "정상A" ? "#15803D" : chk.nat.grade === "정상B" ? "#B45309" : "#B91C1C", bg: chk.nat.grade === "정상A" ? "#E7F8EE" : chk.nat.grade === "정상B" ? "#FEF3E2" : "#FDECEC" },
    { t: `검진 이상항목 ${chk.comp.abnormals.length}건`, c: chk.comp.abnormals.length ? "#B91C1C" : "#15803D", bg: chk.comp.abnormals.length ? "#FDECEC" : "#E7F8EE", ic: chk.comp.abnormals.length ? "warn" : "check" },
    { t: `진행형태 ${chk.trendLabel}`, c: chk.trend === "improve" ? "#15803D" : chk.trend === "worsen" ? "#B45309" : "#475569", bg: chk.trend === "improve" ? "#E7F8EE" : chk.trend === "worsen" ? "#FEF3E2" : "#EEF1F8", ic: chk.trend === "improve" ? "check" : chk.trend === "worsen" ? "up" : null },
  ] : [];
  /* [H-2 비식별화] 출처는 전 회원 동일하게 「하이핀 정밀분석 · 연결된 검진 수치 기준」이다.
     기관 등록번호·벤더 표기는 제거했다 — 공개 소스에 실제 기관 식별자를 둘 이유가 없다.
     검진일은 그 회원 금고 기록에서 읽고, 기록이 없으면 비운다(지어내지 않는다). */
  const _prov = (() => {
    let ckDate = "";
    try {
      if (selfM && typeof vaultLoad === "function" && typeof anonToken === "function") {
        const v = vaultLoad(anonToken(selfM));
        const cs = ((v && v.checkups) || []).slice().sort((a2, b2) => String(b2.date || "").localeCompare(String(a2.date || "")));
        if (cs.length) ckDate = String(cs[0].date || "").replace(/-/g, ".").slice(0, 10);
      }
    } catch (e) {}
    const _rgn = (() => { try { const r = (typeof memberRegion === "function") ? memberRegion() : null; return r ? (r.sgg || r.sidoShort || "") : ""; } catch (e) { return ""; } })();
    return { region: _rgn, hasReport: false, brand: "하이핀 정밀분석 · 연결된 검진 수치 기준", reg: "", checkup: ckDate, analyzed: "" };
  })();
  const _meNm = (selfM && selfM.name) || "회원";
  const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const bioAge = R ? R.bio : null;
  const regAge = R ? R.reg : null;
  const diffN = R ? R.diff : 0;
  const diffLabel = (diffN <= 0 ? "" : "+") + diffN + "세";
  const diffGood = diffN <= 0;
  const agingRank = R ? R.agingRank : null;
  const agingSpeed = R ? R.agingSpeed : null;
  const organs = R ? R.organs : [];
  const diseases = R ? R.diseases : [];
  const cancers = R ? R.cancers : [];
  const cancerTotal = R ? R.cancerTotal : null;
  const costThis = R ? R.costThis : null;
  const cost10v = R ? R.cost10 : null;
  const worstStr = R ? R.worstNames.join("·") : "";
  const evalLabel = R ? R.evalLabel : "";
  const careRecs = R ? R.recs : null;
  const sumFlags = R ? R.flags : [];   // 근거가 없으면 소견을 만들지 않는다
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="manage" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>나의 건강현황</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>검진 항목현황 · 생체나이 · 질병/암 위험 · 경고신호 · 맞춤 관리 — 내 검진데이터 기반 종합 현황</div></div></div>
      <DemoMemberBanner />
      {typeof MyCheckupHero === "function" && <MyCheckupHero onGo={go} onReport={() => setCat("report")} />}

      <div className="src"><ExternalLink size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>{_prov.hasReport
          ? <>데이터 출처: <b>{_prov.brand}</b> · 등록번호 {_prov.reg} · 검진일 {_prov.checkup} · 분석일 {_prov.analyzed}. </>
          : <>데이터 출처: <b>{_prov.brand}</b>{_prov.checkup ? ` · 검진일 ${_prov.checkup}` : ""}. </>}
          의학적 진단을 대신할 수 없으며, 동일 성·연령군 대비 상대 위험도입니다.</div></div>

      <div className="conn">
        <span className="cdot" style={{ background: synced ? "#16A34A" : "#F59E0B", boxShadow: synced ? "0 0 0 4px rgba(22,163,74,.15)" : "0 0 0 4px rgba(245,158,11,.15)" }} />
        <div className="ctxt"><b>{dm ? "체험 회원 리포트 표시 중" : `메디에이지 연동 ${synced ? "완료" : "필요"}`}</b><div style={{ color: "var(--muted)", marginTop: 2 }}>{dm ? `${dm.name}님 시연용 예시 건강 리포트가 표시되고 있습니다.` : (synced ? `${_meNm}님 프롬에이지 Premium 리포트가 표시되고 있습니다.` : "계정 인증 후 실데이터를 불러옵니다.")}</div></div>
        <button className="cbtn2" onClick={() => setSynced(true)}><RefreshCw size={14} /> 새로고침</button>
      </div>

      <div className="chtabs">{cats.map(([k, t, Ic]) => <div key={k} className={`chtab ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}><Ic size={15} /> {t}</div>)}</div>

      {cat === "report" && <ReportVault user={dm} />}

      {cat === "careloop" && (chk ? <CareLoopCard member={selfM} chk={chk} onGo={go} /> : (
        <div className="card"><div className="rct"><Building2 size={18} color="#2563EB" /> 진료 연계</div><p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 10px" }}>체험 회원으로 로그인하면 이상소견→진료→결과 수신→프로필 갱신 흐름을 체험할 수 있어요.</p><DemoLoginSelector /></div>
      ))}

      {cat === "checkup" && (chk ? <HMCheckupTab chk={chk} member={selfM} onGo={go} /> : (
        <div className="card"><div className="rct"><ClipboardList size={18} color="#2563EB" /> 검진 항목현황</div>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 10px" }}>체험 회원으로 로그인하면 국가검진 판정 · 종합검진 40여 항목의 값·판정·3년 추이를 여기에서 확인할 수 있어요.</p>
          <DemoLoginSelector />
        </div>
      ))}

      {cat === "summary" && (<>
        {hg && <div className="hgbanner" style={{ background: hg.meta.bg, borderColor: hg.meta.c + "44" }}>
          <span className="hgb-badge" style={{ background: hg.meta.c }}>{hg.grade}</span>
          <div className="hgb-txt"><b style={{ color: hg.meta.c }}>건강상태 「{hg.grade}」</b><span>{hg.desc} · 권장 조치: {hg.act}</span></div>
          <button className="hgb-btn" onClick={() => setCat("checkup")}>검진 현황 ›</button>
        </div>}
        <div className="card">
          <div className="rct"><LayoutDashboard size={18} color="#2F5BEA" /> 한눈에 보기 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: R ? R.cg[1] : "var(--green)", background: R ? R.cg[2] : "#E7F8EE", padding: "4px 10px", borderRadius: 999 }}>종합평가 {evalLabel}</span></div>
          <div className="sumgrid">
            <div className="sumcard"><div className="sl">생체나이</div><div className="sv" style={{ color: "var(--blue)" }}>{bioAge}세</div><span className="sb" style={{ color: diffGood ? "#15803D" : "#B91C1C", background: diffGood ? "#E7F8EE" : "#FDECEC" }}>주민등록 {diffLabel}</span></div>
            <div className="sumcard"><div className="sl">노화등수</div><div className="sv">{agingRank}등</div><span className="sb" style={{ color: "#2563EB", background: "#E8F1FE" }}>/100</span></div>
            <div className="sumcard"><div className="sl">노화속도</div><div className="sv">{agingSpeed}배</div><span className="sb" style={{ color: agingSpeed > 1 ? "#B45309" : "#15803D", background: agingSpeed > 1 ? "#FEF3E2" : "#E7F8EE" }}>{agingSpeed > 1 ? "평균보다 빠름" : "평균보다 느림"}</span></div>
            <div className="sumcard"><div className="sl">주의 장기</div><div className="sv" style={{ color: "#EF4444", fontSize: 15 }}>{worstStr}</div><span className="sb" style={{ color: "#B91C1C", background: "#FDECEC" }}>노화 빠름</span></div>
          </div>
          <div className="sumflags">{[...ckFlags, ...sumFlags].map((f, i) => (
            <span className="fl" key={i} style={{ color: f.c, background: f.bg }}>{f.ic === "up" ? <ArrowUp size={12} /> : f.ic === "warn" ? <AlertTriangle size={12} /> : f.ic === "check" ? <Check size={12} /> : null} {f.t}</span>
          ))}</div>
          {chk && <button className="cbtn" style={{ marginTop: 10 }} onClick={() => setCat("checkup")}><ClipboardList size={15} /> 검진 항목현황 상세 보기 ({chk.comp.abnormals.length}건 이상)</button>}
        </div>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> 지금 할 일 · 맞춤 가이드</div>
          <div className="adv"><span className="ic" style={{ background: "#F1ECFE" }}><Stethoscope size={18} color="#7C3AED" /></span><div style={{ flex: 1 }}><b>{R ? `${worstStr} 정밀검사` : "간·췌장 정밀검사"}</b><p>{R ? `${worstStr} 노화 빠름${R.hr.length ? ` · 고위험 암 ${R.hr.join("·")}` : ""} — 복부 초음파/내시경 권장` : "간 54.4세·췌장 56.2세·췌장암 경고 — 복부 초음파/내시경 권장"}</p></div><Go to="checkup" ic={CalendarCheck} pri>검진 예약</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#FEF3E2" }}><Activity size={18} color="#F59E0B" /></span><div style={{ flex: 1 }}><b>당뇨 예방 관리</b><p>당뇨병 위험 동년배 +6.2% — 저당 식단·혈당 모니터링</p></div><Go to="shop" ic={ShoppingCart}>건강쇼핑</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#E8F1FE" }}><Building2 size={18} color="#2563EB" /></span><div style={{ flex: 1 }}><b>전문병원 연결</b><p>{_prov.region ? `거주지(${_prov.region}) 기준` : "거주지 기준"} 검진 결과에 맞는 진료과 병원</p></div><Go to="hospital" ic={Building2}>병원 찾기</Go></div>
          <div className="adv"><span className="ic" style={{ background: "#FCE7F3" }}><HeartHandshake size={18} color="#DB2777" /></span><div style={{ flex: 1 }}><b>돌봄·간병 상담</b><p>방문간호·재활 등 재가/돌봄 연계 필요 시</p></div><Go to="homecare" ic={HeartHandshake}>재가·돌봄</Go></div>
          <div className="gorow"><Go to="ai" ic={MessageSquare}>AI 상담</Go><Go to="insurance" ic={ShieldCheck}>보험 보기</Go><button className="gobtn" onClick={() => setViewer(true)}><ExternalLink size={14} /> 원본 리포트</button></div>
        </div>
        {typeof ActivitySummaryCard === "function" && <ActivitySummaryCard />}
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
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{_meNm}님 생체나이 <b style={{ color: "var(--blue)" }}>{bioAge}세</b>는 주민등록나이 {regAge}세보다 {diffGood ? `${Math.abs(diffN)}세 낮아(노화 느림)` : `${diffN}세 높아(노화 빠름)`}, 노화속도 {agingSpeed}배입니다. <span style={{ color: "var(--soft)" }}>※ 시연용 예시 데이터 · 연도별 추이는 실연동 시 제공됩니다.</span></p>
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
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 10 }}>※ 동년배 평균 대비 상대 위험도{R ? " · 시연용 예시 추정치" : ". 당뇨병만 평균보다 높습니다."}</p>
          </div>
          <div className="card">
            <div className="rct"><Banknote size={18} color="#16A34A" /> 의료비·의료이용 예측</div>
            <div className="costrow"><span className="cl">올해 예상 의료비</span><span className="cv" style={{ color: "var(--green)" }}>{won(costThis)}</span><span className="ca">동년배 {won(Math.round(costThis * 0.95))}</span></div>
            <div className="costrow"><span className="cl">10년 후 의료비</span><span className="cv">{won(cost10v)}</span><span className="ca">동년배 {won(Math.round(cost10v * 0.95))}</span></div>
            <div className="costrow"><span className="cl">외래진료(올해)</span><span className="cv">{R ? 18 + cancerTotal : 24}일</span><span className="ca">동년배 {R ? 16 + cancerTotal : 22}일</span></div>
            <div className="costrow"><span className="cl">입원(올해)</span><span className="cv">{R ? Math.max(2, cancerTotal) : 24}일</span><span className="ca">동년배 {R ? Math.max(1, cancerTotal - 2) : 22}일</span></div>
            <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 10 }}>※ 생체나이 기반 예측{R ? "(시연용 예시)" : ""}. 예방 관리로 의료비를 낮출 수 있습니다.</p>
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

      {cat === "care" && (<>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> AI 맞춤 권고</div>
          <div className="recs">{(careRecs && careRecs.length ? careRecs.map((t) => [Sparkles, t]) : RECS).map(([Ic, t]) => <div className="rec" key={t}><Ic size={15} color="#7C3AED" />{t}</div>)}</div>
          <button className="cbtn pur" onClick={() => setViewer(true)}><ExternalLink size={15} /> 메디에이지 원본 리포트 보기</button>
          <button className="cbtn" onClick={() => toast("데이터 제공에 동의했습니다. Health Token이 적립됩니다.")}><Coins size={15} /> 데이터 제공 동의하고 Health Token 받기</button>
          <div className="gorow"><Go to="shop" ic={ShoppingCart} pri>건강쇼핑</Go><Go to="homecare" ic={HeartHandshake}>재가·돌봄</Go><Go to="checkup" ic={CalendarCheck}>검진 예약</Go><Go to="hospital" ic={Building2}>병원 찾기</Go></div>
        </div>
        {typeof TodayAIRecs === "function" && <TodayAIRecs onGo={go} />}
      </>)}
      {viewer && <OriginalReport onClose={() => setViewer(false)} name={(selfM && selfM.name) || ""} prov={_prov} R={R} />}
    </div>
  );
}

/* ── 검진 항목현황(내 검진데이터: 판정·이상항목·3년 추이) ── */
function HMCheckupTab({ chk, member, onGo }) {
  const cp = (member && typeof memberClinicalProfile === "function") ? (() => { try { return memberClinicalProfile(member); } catch (e) { return null; } })() : null;
  const sevCol = ["#16A34A", "#F59E0B", "#EF4444"];
  const items = Object.keys(chk.items).map((k) => chk.items[k]).filter((r) => r.series);
  const abn = items.filter((r) => r.sev >= 1).sort((a, b) => b.sev - a.sev || b.series[2].value - a.series[2].value);
  const normal = items.filter((r) => r.sev === 0);
  const arrow = (r) => { const a = r.series[0].value, b = r.series[2].value; if (Math.abs(b - a) < Math.abs(a) * 0.02) return ["→", "#64748B", "유지"]; const worseUp = !(r.item && r.item.lowIsBad); const better = worseUp ? b < a : b > a; return better ? ["↘", "#16A34A", "개선 중"] : ["↗", "#EF4444", "악화 중"]; };
  const Spark = ({ r }) => (<span className="hmspark">{r.series.map((p, i) => <i key={i} title={`${p.year} ${p.value}${r.unit} · ${p.label}`} style={{ background: sevCol[p.sev] }} />)}</span>);
  const gradeCol = chk.nat.grade === "정상A" ? "#15803D" : chk.nat.grade === "정상B" ? "#B45309" : "#B91C1C";
  const gradeBg = chk.nat.grade === "정상A" ? "#E7F8EE" : chk.nat.grade === "정상B" ? "#FEF3E2" : "#FDECEC";
  return (<>
    <div className="card">
      <div className="rct"><ClipboardList size={18} color="#2563EB" /> 검진 결과 현황
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: gradeCol, background: gradeBg, padding: "4px 11px", borderRadius: 999 }}>국가검진 {chk.nat.grade}</span></div>
      <div className="hmck-sub">{chk.nat.gradeDesc}</div>
      <div className="hmck-meta">
        <div><span>최근 3년</span><b>{chk.years[0]}~{chk.years[chk.years.length - 1]}</b></div>
        <div><span>이상·주의 항목</span><b style={{ color: abn.length ? "#EF4444" : "#16A34A" }}>{abn.length}건</b></div>
        <div><span>진행형태</span><b style={{ color: chk.trend === "improve" ? "#16A34A" : chk.trend === "worsen" ? "#EF4444" : "#B45309" }}>{chk.trendLabel}</b></div>
        {chk.nat.life.length ? <div><span>생활습관</span><b style={{ fontSize: 13 }}>{chk.nat.life.join("·")}</b></div> : null}
      </div>
    </div>
    {cp && <div className="card">
      <div className="rct"><FileText size={18} color="#7C3AED" /> 통합 임상 프로필 <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 800, color: "#7C3AED", background: "#F1EBFE", padding: "4px 11px", borderRadius: 999 }}>진료필요도 · {cp.careNeed}</span></div>
      <div className="cpf-grid">
        <div className="cpf-col"><div className="cpf-h">확정 진단</div>{cp.diagnoses.length ? cp.diagnoses.map((d) => <div className="cpf-dx" key={d.name}><b>{d.name}</b><span>{d.since}</span></div>) : <div className="cpf-none">진단된 만성질환 없음</div>}</div>
        <div className="cpf-col"><div className="cpf-h">복용 약물</div>{cp.meds.length ? cp.meds.map((md) => <div className="cpf-med" key={md.name}><b>{md.name}</b><span>{md.dose} · {md.cls}</span></div>) : <div className="cpf-none">복용 중인 약물 없음</div>}</div>
      </div>
      <div className="cpf-adh">
        {cp.adherence.med != null && <div className="cpf-a"><span>복약 순응도</span><div className="cpf-bar"><i style={{ width: cp.adherence.med + "%", background: cp.adherence.med >= 80 ? "#16A34A" : "#F59E0B" }} /></div><b>{cp.adherence.med}%</b></div>}
        <div className="cpf-a"><span>생활미션 이행</span><div className="cpf-bar"><i style={{ width: cp.adherence.mission + "%", background: cp.adherence.mission >= 70 ? "#16A34A" : "#F59E0B" }} /></div><b>{cp.adherence.mission}%</b></div>
        <div className="cpf-a"><span>최근 검진 수검</span><b style={{ marginLeft: "auto" }}>{cp.adherence.checkupYear}년</b></div>
      </div>
      <div className="chnote" style={{ marginTop: 8 }}>※ 확정진단·처방은 의료기관 진료기록 기반이며, 복약·이행 정보는 회원 관리 데이터입니다. 진단·처방 변경은 의료진과 상의하세요.</div>
    </div>}
    <div className="card">
      <div className="rct"><AlertTriangle size={18} color="#EF4444" /> 이상·주의 항목 <span className="hmck-cnt">{abn.length}건</span></div>
      {abn.length ? <div className="hmck-list">{abn.map((r) => { const p = r.series[2]; const [ar, ac, al] = arrow(r); return (
        <div className="hmck-row" key={r.key}>
          <div className="hmck-nm">{r.name}<span className="hmck-ref">참고치 {r.ref}</span></div>
          <div className="hmck-val"><b style={{ color: sevCol[p.sev] }}>{p.value}</b><em>{r.unit}</em></div>
          <span className="hmck-jg" style={{ color: sevCol[p.sev], background: sevCol[p.sev] + "1A" }}>{p.label}</span>
          <span className="hmck-tr" style={{ color: ac }}>{ar} {al}</span>
          <Spark r={r} />
        </div>); })}</div> : <div className="hmck-empty">✅ 이상·주의 항목이 없습니다. 잘 유지하고 계세요!</div>}
      <p className="hmck-note">※ 값·판정은 내 검진데이터 기반(참고치 국민건강보험공단·대한검진의학회). 3년 막대는 연도별 판정색(초록 정상·노랑 주의·빨강 위험)입니다.</p>
    </div>
    <div className="card">
      <div className="rct"><Check size={18} color="#16A34A" /> 정상 항목 <span className="hmck-cnt ok">{normal.length}건</span></div>
      <div className="hmck-chips">{normal.map((r) => <span className="hmck-chip" key={r.key} title={`참고치 ${r.ref} · ${chk.trendLabel}`}>{r.name.split(" (")[0].split("(")[0]} <b>{r.series[2].value}{r.unit}</b></span>)}</div>
    </div>
    <div className="gorow">
      <button className="gobtn pri" onClick={() => onGo && onGo("ai")}><MessageSquare size={14} /> AI 정밀분석 상담</button>
      <button className="gobtn" onClick={() => onGo && onGo("checkup")}><CalendarCheck size={14} /> 검진 예약</button>
      <button className="gobtn" onClick={() => onGo && onGo("shop")}><ShoppingCart size={14} /> 맞춤 건강쇼핑</button>
    </div>
  </>);
}

/* ── 진료 연계 폐루프(§6.8): 이상소견→진료→결과수신→프로필 갱신→재평가 ── */
const _DZ_DEPT = { "고혈압": "순환기내과", "당뇨병": "내분비내과", "이상지질혈증": "순환기내과", "간질환": "소화기내과", "만성콩팥병": "신장내과", "통풍": "류마티스내과", "갑상선질환": "내분비내과", "빈혈": "혈액내과", "비만": "가정의학과", "복부비만": "가정의학과", "전립선암": "비뇨의학과", "대장암": "소화기내과", "간암": "소화기내과", "췌장암": "소화기내과" };
function CareLoopCard({ member, chk, onGo }) {
  const KEY = "hifin_careloop_" + (member && (member.id || member.email || member.name));
  const [stage, setStage] = React.useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } });
  const set = (s) => { setStage(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const items = Object.keys(chk.items).map((k) => chk.items[k]).filter((r) => r.sev >= 1).sort((a, b) => b.sev - a.sev);
  const top = items[0];
  const dz = top && top.item ? top.item.dz : "건강관리";
  const dept = _DZ_DEPT[dz] || "내과";
  const STAGES = ["진료 권고", "예약 완료", "진료·결과 수신", "프로필 갱신·재평가"];
  const rxMap = { "고혈압": "암로디핀 5mg 1일1회", "당뇨병": "메트포르민 500mg 1일2회", "이상지질혈증": "로수바스타틴 10mg 1일1회", "간질환": "생활요법·간기능 추적", "통풍": "알로퓨리놀 100mg", "만성콩팥병": "혈압·혈당 관리, 신장내과 추적" };
  const rx = rxMap[dz] || "생활요법 + 필요 시 약물";
  const grade = (typeof memberHealthGrade === "function") ? (() => { try { return memberHealthGrade(member); } catch (e) { return null; } })() : null;
  return (
    <div className="card">
      <div className="rct"><Building2 size={18} color="#2563EB" /> 진료 연계 · 폐루프 <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>이상소견 → 진료 → 결과 → 갱신</span></div>
      <div className="clp-steps">{STAGES.map((s, i) => <React.Fragment key={s}><span className={"clp-step" + (i < stage ? " done" : i === stage ? " cur" : "")}><i>{i + 1}</i>{s}</span>{i < STAGES.length - 1 && <span className="clp-arrow">›</span>}</React.Fragment>)}</div>

      {stage === 0 && <div className="clp-body">
        <div className="clp-lead">{top ? <><b>{top.name} {top.series[2].value}{top.unit} 「{top.label}」</b> 소견으로 <b>{dept}</b> 진료를 권고합니다.</> : <>정기검진 주기에 맞춘 진료·상담을 권고합니다.</>}</div>
        <div className="clp-acts"><button className="clp-btn pri" onClick={() => set(1)}><CalendarCheck size={14} /> {dept} 진료 예약</button><button className="clp-btn" onClick={() => onGo && onGo("hospital")}><Building2 size={14} /> 병원 찾기</button></div>
      </div>}

      {stage === 1 && <div className="clp-body">
        <div className="clp-lead"><b>{dept} 진료 예약이 완료</b>되었습니다. 검진자료 전달 동의 후 진료를 받습니다. 진료가 끝나면 결과를 수신합니다.</div>
        <div className="clp-acts"><button className="clp-btn pri" onClick={() => set(2)}><FileText size={14} /> 진료 완료 · 결과 수신</button><button className="clp-btn" onClick={() => set(0)}>취소</button></div>
      </div>}

      {stage === 2 && <div className="clp-body">
        <div className="clp-result">
          <div className="clp-rh"><Stethoscope size={14} color="#2563EB" /> 진료결과 회신 · {dept}</div>
          <div className="clp-rr"><span>진단 소견</span><b>{dz} 관련 소견 확인 · 추가검사 시행</b></div>
          <div className="clp-rr"><span>처방</span><b>{rx}</b></div>
          <div className="clp-rr"><span>다음 계획</span><b>3개월 후 추적검사(재검)</b></div>
        </div>
        <div className="clp-acts"><button className="clp-btn pri" onClick={() => set(3)}><RefreshCw size={14} /> 통합 프로필 반영 · 위험도 재평가</button></div>
      </div>}

      {stage === 3 && <div className="clp-body">
        <div className="clp-done"><Check size={16} color="#16A34A" /> <b>통합 건강프로필이 갱신</b>되었습니다. 진료결과·처방이 반영되어 건강상태·위험도가 재평가되었습니다.</div>
        <div className="clp-upd">
          <div><span>건강상태</span><b style={{ color: grade ? grade.meta.c : "#334155" }}>{grade ? grade.grade : "-"} — {grade ? grade.act : ""}</b></div>
          <div><span>확정진단·처방</span><b>임상 프로필에 반영 완료</b></div>
          <div><span>다음 재평가</span><b>3개월 후 추적검사 시</b></div>
        </div>
        <div className="clp-acts"><button className="clp-btn pri" onClick={() => onGo && onGo("checkup")}><Activity size={14} /> 건강현황 보기</button><button className="clp-btn" onClick={() => set(0)}>처음부터</button></div>
      </div>}

      <div className="chnote" style={{ marginTop: 10 }}>※ 진료결과 회신 → 통합 프로필 갱신 → 위험도 재평가로 이어지는 폐루프입니다. 진료·처방·확정진단은 의료기관·의료진이 수행하며, 하이핀은 결과를 수신·관리합니다.</div>
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

/* ====================== 원본 리포트 뷰어 ======================
   [H-2 W3] 기관 원본은 「그 회원의 리포트가 실제로 있을 때」만 원본으로 표기한다.
   전에는 머리글에 PT(조성래)의 이름·성별나이·기관 등록번호·검진일이 박혀, 다른 회원이 열어도
   남의 리포트 식별자가 자기 것처럼 보였다. 원본이 없는 회원에게는 분석본임을 명시한다. */
function OriginalReport({ onClose, name, sample, prov, R }) {
  const _p = prov || { hasReport: false, brand: "하이핀 정밀분석", reg: "", checkup: "", analyzed: "" };
  const NM = name || (_p.hasReport && typeof PT !== "undefined" ? PT.name : "회원");
  const _sexAge = (_p.hasReport && typeof PT !== "undefined") ? PT.sexAge : (R && R.reg ? `${R.sex || ""} / ${R.reg}세`.trim() : "");
  const _bio = R ? R.bio : null, _reg = R ? R.reg : null;
  const _dif = (R && typeof R.diff === "number") ? R.diff : 0;
  const _rank = R ? R.agingRank : null, _spd = R ? R.agingSpeed : null;
  const PGH = (<div className="pghead"><div className="brand">{_p.hasReport ? "메디에이지연구소 · 프롬에이지 Premium" : "하이핀 정밀분석 · 연결된 검진 수치 기준"}</div><div className="pinfo">이름 {NM}{_sexAge ? ` · ${_sexAge}` : ""}{_p.reg ? <><br />등록번호 {_p.reg}</> : null}{_p.checkup ? <><br />검진일 {_p.checkup}</> : null}</div></div>);
  return (
    <div className="voverlay" onClick={onClose}>
      <div className="viewer" onClick={(e) => e.stopPropagation()}>
        <div className="vhead">
          <div className="vt"><FileText size={17} color="#7C3AED" /> 건강분석 리포트 {sample ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B45309", background: "#FEF3E2", borderRadius: 999, padding: "3px 9px", marginLeft: 6 }}>실물 샘플 — 신청 시 내 검진 데이터로 생성</span> : "(원본)"}</div>
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
            <div style={{ margin: "18px 0", fontSize: 14, fontWeight: 700 }}>성명 {NM}{_sexAge ? ` · ${_sexAge}` : ""}{_p.analyzed ? ` · 분석일 ${_p.analyzed}` : ""}</div>
            <div className="disclaim">본 분석은 의학적으로 검증된 지표로 질병과 암 발생 위험도 및 지출 의료비를 예측합니다. 실제 위험도는 각 개인의 유전적 요인·생활습관·환경적 요인 등에 의해 달라질 수 있습니다. 본 검사의 결과는 의학적 진단을 대신할 수 없으며, 진단 및 치료 결정을 위해서는 반드시 주치의와 상의하세요.</div>
          </div>

          {/* 종합분석 */}
          <div className="page">{PGH}
            <div className="pgidx">종합분석 · Overall Analysis</div>
            <div className="pgtitle">분석 요약</div>
            <div className="organs" style={{ marginTop: 16 }}>
              <div className="organ"><div className="ok">생체나이</div><div className="ov">{_bio != null ? _bio + "세" : "—"}</div><div className="ob" style={{ color: _dif <= 0 ? "#16A34A" : "#B45309", background: _dif <= 0 ? "#E7F8EE" : "#FEF3E2" }}>{_dif != null ? (_dif > 0 ? "+" : "") + _dif + "세" : "—"}</div></div>
              <div className="organ"><div className="ok">노화등수</div><div className="ov">{_rank != null ? _rank + "등" : "—"}</div><div className="ob" style={{ color: "#2563EB", background: "#E8F1FE" }}>/100</div></div>
              <div className="organ"><div className="ok">노화속도</div><div className="ov">{_spd != null ? _spd + "배" : "—"}</div><div className="ob" style={{ color: _spd != null && _spd <= 1 ? "#16A34A" : "#B45309", background: _spd != null && _spd <= 1 ? "#E7F8EE" : "#FEF3E2" }}>{_spd == null ? "—" : _spd <= 1 ? "느림" : "빠름"}</div></div>
              <div className="organ"><div className="ok">종합평가</div><div className="ov" style={{ fontSize: 15 }}>좋음</div><div className="ob" style={{ color: "#16A34A", background: "#E7F8EE" }}>양호</div></div>
            </div>
            <div className="rct" style={{ fontSize: 14, marginTop: 18 }}>의료비 예측</div>
            <div className="costrow"><span className="cl">금년도 의료비</span><span className="cv">2,381,477원</span><span className="ca">동년배 2,247,942원</span></div>
            <div className="costrow"><span className="cl">10년 후 의료비</span><span className="cv">3,089,692원</span><span className="ca">동년배 2,915,692원</span></div>
          </div>

          {/* INDEX 1 생체나이 */}
          <div className="page">{PGH}
            <div className="pgidx" style={{ background: "#2563EB" }}>INDEX 1 · 생체나이 분석</div>
            <div className="pgtitle">생체나이 {_bio != null ? _bio + "세" : "—"} <span style={{ fontSize: 13, color: _dif <= 0 ? "#16A34A" : "#B45309", fontWeight: 700 }}>{_bio != null && _reg != null ? `(주민등록 ${_reg}세 대비 ${_dif > 0 ? "+" : ""}${_dif}세)` : ""}</span></div>
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
