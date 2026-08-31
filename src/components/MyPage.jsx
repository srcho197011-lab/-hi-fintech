function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 44, height: 26, borderRadius: 999, background: on ? "var(--green)" : "#CBD5E1", position: "relative", cursor: "pointer", transition: ".2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: ".2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </div>
  );
}
/* 마이페이지 데이터(MY_CONSENT·MY_NOTI·MY_FAMILY) → src/data/sectionData.js 로 이관 */

/* ── 가족 구성원 결정론적 건강프로필 합성(나이·성별·관계 기반) ── */
function _famHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; } return h >>> 0; }
function famSynthProfile(name, age, sex, relation) {
  let h = _famHash(name + "|" + age + "|" + relation);
  const rnd = (n) => { h = (h * 1103515245 + 12345) >>> 0; return h % n; };
  const bio = Math.max(6, age + (rnd(9) - 3));
  const og = () => Math.max(6, bio + (rnd(7) - 3));
  const child = age < 19;
  const grade = child ? 1 : Math.min(8, 1 + rnd(6));
  const CPOOL = sex === "여" ? ["유방암", "갑상선암", "위암", "대장암"] : ["위암", "대장암", "폐암", "전립선암", "간암"];
  const hr = (!child && grade >= 5) ? [CPOOL[rnd(CPOOL.length)]] : [];
  const DZP = child ? ["소아비만", "아토피피부염"] : age >= 65 ? ["고혈압", "당뇨병", "고지혈증", "골다공증"] : sex === "여" ? ["고지혈증", "빈혈", "갱년기증후군", "골다공증"] : ["고지혈증", "지방간", "고혈압", "당뇨병"];
  const hrd = []; const nd = child ? (rnd(2)) : (rnd(3)); for (let i = 0; i < nd; i++) { const d = DZP[rnd(DZP.length)]; if (!hrd.includes(d)) hrd.push(d); }
  const cost = child ? 250000 + rnd(30) * 10000 : 650000 + age * 27000 + rnd(50) * 10000;
  return {
    id: "fam-" + _famHash(name + age), name, sex, regAge: age, biologicalAge: bio,
    obesityAge: og(), heartAge: og(), liverAge: og(), pancreasAge: og(), kidneyAge: og(),
    cancerRiskGrade: grade, highRiskCancerTypes: hr, highRiskDiseases: hrd, estimatedMedicalCost: cost,
    managementPoints: child ? ["성장·발달 체크", "균형 식단", "예방접종"] : ["규칙적 운동", "균형 식단", "정기 건강검진"],
    category: child ? "아동" : age >= 65 ? "노인" : (sex === "여" ? "여성" : "일반"), isDemoUser: true,
  };
}

/* ── 본인(로그인) 프로필 — 체험회원이면 그 데이터, 게이트 사용자면 조성래 실측 리포트 기반 ── */
function selfMember() {
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  if (dm) return dm;
  const nm = (typeof authCurrent === "function" && authCurrent() && authCurrent().name) || (typeof PT !== "undefined" ? PT.name : "조성래");
  const em = (typeof authCurrent === "function" && authCurrent() && authCurrent().email) || "srcho197011@hizenhealth.com";
  return {
    id: "self-" + (em.split("@")[0] || "user"), name: nm, email: em, sex: "남", regAge: 54,
    biologicalAge: 52.5, obesityAge: 50.9, heartAge: 50.7, liverAge: 54.4, pancreasAge: 56.2, kidneyAge: 53.4,
    cancerRiskGrade: 4, highRiskCancerTypes: ["췌장암"], highRiskDiseases: ["당뇨병", "지방간"], estimatedMedicalCost: 2381477,
    managementPoints: ["금주·절주 실천", "저당 식단·혈당 모니터링", "복부 초음파(췌장·간)", "주 3회 유산소 운동"],
    category: "일반", isDemoUser: false, realVerified: true, isSelf: true,
  };
}

/* ── 우리가족 건강관리(구성원 탭 + 검진결과·예측의료비 한눈에) ── */
function FamilyHealthCare({ member, onGo }) {
  const dm = member;
  const surname = (dm && dm.name && dm.name[0]) || "가";
  const email = (dm && dm.email) || "default";
  const fam = (typeof familyLoad === "function") ? familyLoad(email, surname) : [];
  const guessSex = (f) => f.sex || (f.relation === "배우자" ? (dm && dm.sex === "여" ? "남" : "여") : (/경희|미영|영희|순자|하늘|서아|미선|숙|영애|지민|해윤|정|아$|이$/.test(f.name) ? "여" : (_famHash(f.name) % 2 ? "여" : "남")));
  const list = [{ rel: "본인", p: dm, self: true }].concat(fam.map((f) => ({ rel: f.relation, p: famSynthProfile(f.name, f.age, guessSex(f), f.relation) }))).filter((x) => x.p);
  const [sel, setSel] = useState(0);
  const cur = list[Math.min(sel, list.length - 1)] || list[0];
  const P = (typeof lineageMember === "function") ? lineageMember(cur.p) : cur.p;   // M1-1: 금고 실검진값 기반 보정(금고 없으면 원본)
  const R = (typeof demoReport === "function") ? (() => { try { return demoReport(P); } catch (e) { return null; } })() : null;
  const chk = (typeof genMemberCheckup === "function") ? (() => { try { return genMemberCheckup(Object.assign({}, P)); } catch (e) { return null; } })() : null;
  const isChild = (P.regAge || 30) < 19;
  const won = (n) => n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : Number(n || 0).toLocaleString() + "원";
  const relColor = (r) => r === "본인" ? "#EA580C" : r === "배우자" ? "#2563EB" : r === "자녀" ? "#16A34A" : r === "부모" || r === "조부모" ? "#7C3AED" : "#DB2777";
  const cg = R ? R.cg : ["양호", "#16A34A", "#E7F8EE"];
  const wonFull = (n) => Number(n || 0).toLocaleString("ko-KR") + "원";
  const hrList = P.highRiskCancerTypes || [];
  const grade = R ? R.cancerTotal : P.cancerRiskGrade;
  const costThis = R ? R.costThis : P.estimatedMedicalCost;
  const cost10 = R ? R.cost10 : Math.round(P.estimatedMedicalCost * 1.4);
  const dCost = cost10 - costThis, pctCost = costThis ? Math.round((cost10 / costThis - 1) * 100) : 0;
  const curYear = chk ? chk.years[chk.years.length - 1] : 2026;
  const regNum = R ? R.reg : P.regAge, bioDiff = +(P.biologicalAge - regNum).toFixed(1);
  const cards = [
    { l: "암위험", v: `${grade}등급 · ${cg[0]}`, vc: cg[1], dot: cg[1], pill: grade <= 3 ? { t: "정상 범위", ic: "ok", c: "#15803D", bg: "#E7F8EE" } : { t: "관리 필요", ic: "warn", c: "#B45309", bg: "#FEF3E2" } },
    { l: "고위험 암", v: hrList.length ? hrList.join("·") : "—", vc: hrList.length ? "#B91C1C" : "#94A3B8", dot: hrList.length ? "#EF4444" : "#94A3B8", sub: hrList.length ? "정기검진 권장" : "해당 없음" },
    { l: "금년 의료비", v: wonFull(costThis), vc: "#1B2942", dot: "#2563EB", sub: `${curYear}년 예측 기준` },
    { l: "10년 후 의료비", v: wonFull(cost10), vc: "#EF4444", dot: "#EF4444", pill: dCost > 0 ? { t: `+${dCost.toLocaleString("ko-KR")}원 (+${pctCost}%)`, ic: "up", c: "#B91C1C", bg: "#FDECEC" } : { t: `${dCost.toLocaleString("ko-KR")}원`, ic: "down", c: "#15803D", bg: "#E7F8EE" } },
  ];
  return (
    <>
    <div className="fhc">
      <div className="fhc-hd">
        <div className="fhc-eyebrow">— FAMILY HEALTH CARE</div>
        <div className="fhc-title">우리가족<span>건강관리</span></div>
        <div className="fhc-subrow"><div className="fhc-sub">가족 구성원의 건강검진 결과와 예측 의료비를 한눈에 확인하세요.</div><span className="fhc-demo"><AlertTriangle size={12} /> 시연용 예시 데이터</span></div>
      </div>
      <div className="fhc-chips">
        {list.map((x, i) => (
          <button key={i} className={"fhc-chip" + (sel === i ? " on" : "")} style={sel === i ? { "--fc": relColor(x.rel) } : {}} onClick={() => setSel(i)}>
            <span className="fhc-av" style={{ background: sel === i ? relColor(x.rel) : "#E7ECF4", color: sel === i ? "#fff" : "#64748B" }}>{(x.p.name || "?")[0]}</span>
            <b>{x.p.name}</b><em>{x.rel}</em>
          </button>
        ))}
        <button className="fhc-add" onClick={() => { try { window.dispatchEvent(new CustomEvent("famaddopen")); } catch (e) {} if (typeof toast === "function") toast("가족 추가 폼을 열었어요 — 이름·관계·나이만 넣으면 끝! (+100 HTK)"); }} title="가족 추가"><Plus size={16} /></button>
      </div>
      <div className="fhc-ctx">{(() => { const g = (typeof memberHealthGrade === "function") ? (() => { try { return memberHealthGrade(P); } catch (e) { return null; } })() : null; return g ? <span className="fhc-grade" style={{ color: g.meta.c, background: g.meta.bg }}>{g.grade}</span> : null; })()}<b>{P.name}</b> · {cur.rel} · 생체나이 <b style={{ color: "#2563EB" }}>{P.biologicalAge}세</b> <span>(주민등록 {regNum}세{bioDiff === 0 ? "" : bioDiff < 0 ? ` · ${bioDiff}세 젊음` : ` · +${bioDiff}세`})</span></div>
      <div className="fhc-cards">
        {cards.map((c) => <div className="fhc-c" key={c.l}>
          <span className="fhc-cl"><i className="fhc-dot" style={{ background: c.dot }} /> {c.l}</span>
          <b className="fhc-cv" style={{ color: c.vc }}>{c.v}</b>
          {c.pill ? <span className="fhc-pill" style={{ color: c.pill.c, background: c.pill.bg }}>{c.pill.ic === "ok" ? <Check size={11} /> : c.pill.ic === "up" ? <ArrowUp size={11} /> : c.pill.ic === "down" ? <ArrowDown size={11} /> : <AlertTriangle size={11} />} {c.pill.t}</span> : <em className="fhc-cs">{c.sub}</em>}
        </div>)}
      </div>
      {isChild ? (
        <div className="fhc-ck child"><div className="fhc-ckhd"><Activity size={14} color="#16A34A" /> 아동·청소년 건강검진 <b>성장·발달 관리</b></div><div className="fhc-abn"><span>성장발달 체크</span><span>시력·비만 관리</span><span>예방접종(NIP)</span><span>구강검진</span></div></div>
      ) : chk ? (
        <div className="fhc-ck"><div className="fhc-ckhd"><ClipboardList size={14} color="#2563EB" /> 국가검진 「<b>{chk.nat.grade}</b>」 · 이상항목 {chk.comp.abnormals.length}건 · 진행형태 「{chk.trendLabel}」</div>
          {chk.comp.abnormals.length ? <div className="fhc-abn">{chk.comp.abnormals.slice(0, 6).map((a, i) => <span key={i}>{a}</span>)}{chk.comp.abnormals.length > 6 ? <span className="more">+{chk.comp.abnormals.length - 6}</span> : null}</div> : <div className="fhc-okline">✅ 종합검진 주요 항목 정상 범위</div>}
        </div>
      ) : null}
      <div className="fhc-acts">
        <button className="gobtn pri" onClick={() => onGo && onGo("ai")}><MessageSquare size={14} /> {cur.self ? "내" : cur.p.name + "님"} AI 상담</button>
        <button className="gobtn" onClick={() => onGo && onGo("checkup")}><CalendarCheck size={14} /> 검진 예약</button>
        <button className="gobtn" onClick={() => onGo && onGo("manage")}><Activity size={14} /> 건강현황</button>
      </div>
      </div>
      {typeof CarePlanCard === "function" && <CarePlanCard key={P.id || P.name} member={P} />}
    </>
  );
}

/* ── 의료마이데이터 전송요구 마법사(§6.2) — 데이터·기간·기관 선택 + 필수 고지 ── */
function MyDataWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState("");
  const DATA = ["건강검진 결과", "진료 내역", "처방·투약", "건강위험 분석"];
  const ORGS = ["국민건강보험공단", "제휴 검진센터", "제휴 병원(EMR)"];
  const [items, setItems] = useState(["건강검진 결과", "건강위험 분석"]);
  const [period, setPeriod] = useState("최근 3년");
  const [orgs, setOrgs] = useState(["국민건강보험공단"]);
  const [agree, setAgree] = useState(false);
  const tog = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const BIZ = ["A 마이데이터 사업자(가칭)", "B 의료마이데이터 전문기관(가칭)"];
  const STEPS = ["사업자·본인확인", "데이터 항목", "조회 기간", "제공기관", "고지·전송 동의"];
  const canNext = step === 0 ? !!biz : step === 1 ? items.length > 0 : step === 3 ? orgs.length > 0 : step === 4 ? agree : true;
  const submit = () => {
    const rec = { biz, items, period, orgs, at: (() => { try { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; } catch (e) { return "방금"; } })() };
    try { localStorage.setItem("hifin_mydata_req", JSON.stringify(rec)); } catch (e) {}
    if (typeof toast === "function") toast(`✅ 전송요구 완료 · ${orgs.join("·")}에서 ${items.length}종 데이터 수신 예정`);
    onClose();
  };
  return (
    <div className="mdov" onClick={onClose}>
      <div className="mdmodal" onClick={(e) => e.stopPropagation()}>
        <div className="mdmh"><b>의료마이데이터 전송요구</b><button onClick={onClose}><X size={18} /></button></div>
        <div className="mdsteps">{STEPS.map((s, i) => <React.Fragment key={i}><span className={"mdstep" + (i < step ? " done" : i === step ? " cur" : "")}>{i + 1}. {s}</span>{i < STEPS.length - 1 && <span className="mdsa">›</span>}</React.Fragment>)}</div>
        <div className="mdbody">
          {step === 0 && <>
            <div className="mdq">마이데이터 사업자를 선택하고 본인확인을 진행합니다.</div>
            {BIZ.map((b) => <label key={b} className={"mdopt" + (biz === b ? " on" : "")} onClick={() => setBiz(b)}><span className="mdrad">{biz === b ? <Check size={12} /> : null}</span>{b}</label>)}
            <div className="mdhint">※ 지정·허가된 사업자만 표시됩니다(사업자 자격은 데이터하우스 › 데이터 커넥터에서 검증).</div>
          </>}
          {step === 1 && <>
            <div className="mdq">전송받을 데이터 항목을 선택하세요.</div>
            <div className="mdchips">{DATA.map((d) => <button key={d} className={"mdchip" + (items.includes(d) ? " on" : "")} onClick={() => tog(items, setItems, d)}>{items.includes(d) ? <Check size={12} /> : null} {d}</button>)}</div>
            <div className="mdhint">※ 서비스 목적에 필요한 항목만 선택하세요(데이터 최소수집 원칙).</div>
          </>}
          {step === 2 && <>
            <div className="mdq">조회 기간을 선택하세요.</div>
            <div className="mdchips">{["최근 1년", "최근 3년", "최근 5년", "전체"].map((p) => <button key={p} className={"mdchip" + (period === p ? " on" : "")} onClick={() => setPeriod(p)}>{period === p ? <Check size={12} /> : null} {p}</button>)}</div>
          </>}
          {step === 3 && <>
            <div className="mdq">데이터를 제공받을 기관을 선택하세요.</div>
            <div className="mdchips">{ORGS.map((o) => <button key={o} className={"mdchip" + (orgs.includes(o) ? " on" : "")} onClick={() => tog(orgs, setOrgs, o)}>{orgs.includes(o) ? <Check size={12} /> : null} {o}</button>)}</div>
          </>}
          {step === 4 && <>
            <div className="mdq">아래 사항을 확인하고 전송에 동의합니다.</div>
            <div className="mdnotice">
              <div><span>제공 기관</span><b>{orgs.join(" · ")}</b></div>
              <div><span>전송 항목</span><b>{items.join(" · ")}</b></div>
              <div><span>조회 기간</span><b>{period}</b></div>
              <div><span>분석 주체</span><b>하이젠케어(하이핀) — 건강분석·상담 목적</b></div>
              <div><span>보관 기간</span><b>동의 유효기간 또는 철회 시까지</b></div>
              <div><span>제3자 제공</span><b>없음(보험보장 분석은 별도 동의 시에만)</b></div>
              <div><span>철회 방법</span><b>마이페이지 › 동의관리에서 언제든 철회·전송중단</b></div>
            </div>
            <label className={"mdagree" + (agree ? " on" : "")} onClick={() => setAgree(!agree)}><span className="mdrad">{agree ? <Check size={12} /> : null}</span>위 내용을 확인했으며 의료마이데이터 전송에 동의합니다.</label>
          </>}
        </div>
        <div className="mdacts">
          {step > 0 && <button className="mdbtn" onClick={() => setStep(step - 1)}>이전</button>}
          {step < 4 ? <button className="mdbtn pri" disabled={!canNext} onClick={() => setStep(step + 1)}>다음</button>
            : <button className="mdbtn pri" disabled={!agree} onClick={submit}>전송요구 제출</button>}
        </div>
      </div>
    </div>
  );
}

function MyPageSection({ onGo }) {
  const [tab, setTab] = useState("family");
  const [mdOpen, setMdOpen] = useState(false);
  const go = onGo || (() => {});
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const [consent, setConsent] = useState(MY_CONSENT.map((c) => c[3]));
  const [noti, setNoti] = useState(MY_NOTI.map((n) => n[2]));
  const [logQ, setLogQ] = useState("");
  const [logRisk, setLogRisk] = useState(null);
  const [logConsent, setLogConsent] = useState(LOG_CONSENT);
  const [logVer, setLogVer] = useState(0);
  const [logPeriod, setLogPeriod] = useState(null);
  const exportLog = (fmt) => {
    if (!AI_SESSIONS.length) { toast("내보낼 상담 기록이 없습니다."); return; }
    let content, ext, mime;
    if (fmt === "json") {
      content = JSON.stringify({ ai_doctor_sessions: AI_SESSIONS, insurance_recommendation_logs: INS_REC_LOGS }, null, 2);
      ext = "json"; mime = "application/json;charset=utf-8";
    } else {
      const head = ["id", "question", "risk_level", "recommended_action", "referenced_content_ids", "recommended_coverages", "created_at"];
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const rows = AI_SESSIONS.map((s) => { const ins = INS_REC_LOGS.find((x) => x.session_id === s.id); return [s.id, s.question, s.risk_level, s.recommended_action, s.referenced_content_ids.join("|"), ins ? ins.recommended_coverages.join("|") : "", s.created_at]; });
      content = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
      ext = "csv"; mime = "text/csv;charset=utf-8";
    }
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `ai_consult_log.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast(`상담 기록을 ${ext.toUpperCase()} 파일로 내보냈습니다.`);
    } catch (e) { toast("내보내기에 실패했습니다."); }
  };
  const tabs = [["family", "우리가족 건강", Users], ["profile", "내 정보", CircleUserRound], ["consent", "동의관리", Lock], ["ailog", "상담 기록", MessageSquare], ["noti", "알림 설정", Bell]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="mypage" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>우리가족 건강관리</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>가족 구성원 건강현황 · 내 정보 · 동의관리(DID) · 상담 기록 · 알림 설정</div></div></div>

      <DemoMemberBanner />
      <div className="profile">
        <span className="pa">{dm ? dm.name[0] : "조"}</span>
        <div><div className="pn">{dm ? dm.name : "조성래"} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{dm ? `생체나이 ${((typeof lineageMember === "function") ? lineageMember(dm) : dm).biologicalAge}세 · 체험회원` : "54.1세 · 남"}</span></div><div className="pmeta"><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {dm ? `${dm.email} · 멤버십 체험 · ID ${dm.id}` : <>{PT.addr} · 멤버십 <b style={{ color: "#B45309" }}>골드</b> · 등록번호 {PT.reg}</>}</div></div>
        <div className="pstats">
          {[["12,480", "Health Token", "wallet"], ["3,744", "치료비 케어 적립금", "wallet"], ["6", "Health NFT", "nft"], ["1", "보유 보험", "insurance"]].map(([v, k, to]) => (<div className="pstat" key={k} style={{ cursor: "pointer" }} onClick={() => go(to)}><div className="v">{v}</div><div className="k">{k}</div></div>))}
        </div>
      </div>

      {typeof insuranceSolution === "function" && (() => {
        const M = dm || (typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
        if (!M) return null;
        let sol = null; try { sol = insuranceSolution(M); } catch (e) {}
        if (!sol) return null;
        const gaps = sol.findings.filter((f) => f.sev !== "good");
        const col = sol.grade === "충실" ? "#15803D" : sol.grade === "보통" ? "#B45309" : "#B91C1C";
        return (
          <div className="myins" onClick={() => go("insurance")} title="치료비 케어에서 보장 설계">
            <div className="myins-l"><ShieldCheck size={16} color="#2563EB" /><div><b>내 보험 보장 현황</b><span>실손 {sol.ins.silson.gen} · 진단비 {sol.ins.riders.length ? sol.ins.riders.map((r) => r.cat).join("·") : "미보유"}</span></div></div>
            <div className="myins-r"><span className="myins-grade" style={{ color: col }}>충실도 {sol.grade} {sol.score}점</span><span className="myins-gap">{gaps.length ? "공백 " + gaps.length + "건" : "공백 없음"}</span><ChevronRight size={15} color="#8A97AE" /></div>
          </div>
        );
      })()}

      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "ailog" && (() => {
        const nowMs = Date.now();
        const sessions = AI_SESSIONS.slice().reverse().filter((s) => (!logQ.trim() || s.question.includes(logQ.trim())) && (!logRisk || s.risk_level === logRisk) && (!logPeriod || (nowMs - new Date(s.created_at).getTime()) <= logPeriod * 86400000));
        return (
        <div className="card">
          <div className="rct"><MessageSquare size={18} color="#2563EB" /> AI 주치의 상담 기록 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{AI_SESSIONS.length}건</span></div>
          <div className="logconsent">
            <div className="lc-l"><Lock size={15} color={logConsent ? "#16A34A" : "#94A3B8"} /><div><b>상담 기록 저장 동의 (DID)</b><span>{logConsent ? "동의함 — 상담 내용이 안전하게 기록됩니다." : "철회됨 — 새 상담은 저장되지 않습니다."}</span></div></div>
            <button className={`tgl ${logConsent ? "on" : ""}`} onClick={() => { const v = !logConsent; LOG_CONSENT = v; setLogConsent(v); toast(v ? "상담 기록 저장에 동의했습니다." : "동의를 철회했습니다. 새 상담은 저장되지 않습니다."); }} aria-label="상담 기록 저장 동의 토글"><span /></button>
          </div>
          {AI_SESSIONS.length === 0 ? (
            <div style={{ textAlign: "center", padding: "26px 14px", color: "var(--muted)" }}>
              <MessageSquare size={26} color="#B8C2D6" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>{logConsent ? "아직 상담 기록이 없습니다." : "동의 철회 상태입니다. 저장된 기록이 없습니다."}</div>
              <button className="cbtn pri" style={{ maxWidth: 260, margin: "14px auto 0" }} onClick={() => go("ai")}><MessageSquare size={15} /> AI 주치의 상담하러 가기</button>
            </div>
          ) : (<>
            <div className="logstats">
              <div className="lsh"><TrendingUp size={14} color="#2563EB" /> 위험도 분포</div>
              {RISK.map((r) => { const cnt = AI_SESSIONS.filter((s) => s.risk_level === r[0]).length; const pct = AI_SESSIONS.length ? Math.round(cnt / AI_SESSIONS.length * 100) : 0; return (
                <div className="lsrow" key={r[0]}><span className="lsl" style={{ color: r[1] }}>{r[0]}</span><div className="lsbar"><span style={{ width: pct + "%", background: r[1] }} /></div><span className="lsv">{cnt} · {pct}%</span></div>
              ); })}
            </div>
            <div className="logfilter">
              <div className="lf-s"><Search size={14} /><input value={logQ} onChange={(e) => setLogQ(e.target.value)} placeholder="상담 내용 검색" /></div>
              <div className="lf-r">
                <button className={!logRisk ? "on" : ""} onClick={() => setLogRisk(null)}>전체</button>
                {RISK.map((r) => <button key={r[0]} className={logRisk === r[0] ? "on" : ""} style={logRisk === r[0] ? { color: "#fff", background: r[1], borderColor: r[1] } : { color: r[1] }} onClick={() => setLogRisk(r[0])}>{r[0]}</button>)}
              </div>
              <div className="lf-r"><span className="lfl">기간</span>{[["전체", null], ["오늘", 1], ["최근 7일", 7], ["최근 30일", 30]].map(([t, v]) => <button key={t} className={logPeriod === v ? "on" : ""} onClick={() => setLogPeriod(v)}>{t}</button>)}</div>
            </div>
            {sessions.length === 0 ? <div className="aidlogempty" style={{ padding: "18px 4px" }}>조건에 맞는 상담 기록이 없습니다.</div> :
              sessions.slice(0, 20).map((s) => { const ri = RISK.findIndex((r) => r[0] === s.risk_level); const ins = INS_REC_LOGS.find((x) => x.session_id === s.id); return (
                <div className="mylog" key={s.id}>
                  <div className="mlh"><span className="mlq">“{s.question}”</span><span className="mlr" style={{ color: RISK[ri < 0 ? 0 : ri][1], background: RISK[ri < 0 ? 0 : ri][2] }}>{s.risk_level}</span></div>
                  <div className="mlm">권장: {s.recommended_action}{s.referenced_content_ids.length ? " · 참조: " + s.referenced_content_ids.join(", ") : ""}</div>
                  {ins && ins.recommended_coverages.length ? <div className="mlc"><ShieldCheck size={12} /> 보장 검토: {ins.recommended_coverages.join(", ")}</div> : null}
                </div>
              ); })}
            <div className="logmeta">{sessions.length}건 표시 · 전체 {AI_SESSIONS.length}건</div>
            <div className="chnote">※ 본 기록은 예시용 세션 로그입니다. 실서비스에서는 <b>ai_doctor_sessions</b>·<b>insurance_recommendation_logs</b> 테이블에 개인정보보호 기준으로 분리·암호화 저장되며, <b>동의 철회 시 즉시 삭제</b>됩니다.</div>
            <div className="gorow" style={{ marginTop: 4 }}><button className="gobtn pri" onClick={() => go("ai")}><MessageSquare size={14} /> 상담 계속하기</button><button className="gobtn" onClick={() => exportLog("csv")}><FileText size={14} /> CSV 내보내기</button><button className="gobtn" onClick={() => exportLog("json")}><FileText size={14} /> JSON 내보내기</button><button className="gobtn" onClick={() => { if (AI_SESSIONS.length) { AI_SESSIONS.length = 0; INS_REC_LOGS.length = 0; setLogVer((v) => v + 1); toast("상담 기록을 모두 삭제했습니다."); } }}><X size={14} /> 기록 전체 삭제</button></div>
          </>)}
        </div>);
      })()}

      {tab === "profile" && (<>
        <div className="card">
          <div className="rct"><CircleUserRound size={18} color="#2563EB" /> 개인정보 <button className="cbtn2" style={{ marginLeft: "auto" }} onClick={() => toast("개인정보 수정 화면은 준비 중입니다.")}><RefreshCw size={13} /> 수정</button></div>
          {[["성명", PT.name], ["생년월일", "1970.11.20"], ["성별", "남"], ["휴대전화", "010-****-1234"], ["이메일(ID)", "srcho197011@***.com"], ["주소", PT.addr]].map(([l, v]) => (
            <div className="costrow" key={l}><span className="cl">{l}</span><span className="cv" style={{ color: "var(--text)" }}>{v}</span><span className="ca" /></div>
          ))}
          <div className="chnote" style={{ marginTop: 8 }}>※ 휴대전화·이메일은 일부 마스킹되어 표시됩니다. 주민등록번호 등 민감정보는 본인인증(PASS) 후 암호화 처리됩니다.</div>
        </div>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> 내 활동 요약</div>
          <div className="benefit" style={{ marginBottom: 0 }}><span><Art name="coin" size={15} /> 토큰 12,480</span><span><Art name="badge" size={15} /> NFT 6</span><span><Art name="calendar" size={15} /> 예약 1</span><span><Art name="people" size={15} /> 모임 3</span><span><Art name="star" size={15} /> 후기 4</span></div>
          <div className="gorow" style={{ marginTop: 12 }}><button className="gobtn pri" onClick={() => go("manage")}><Activity size={14} /> 건강관리</button><button className="gobtn" onClick={() => go("wallet")}><Coins size={14} /> 건강금융지갑</button><button className="gobtn" onClick={() => go("nft")}><BadgeCheck size={14} /> Health NFT</button></div>
        </div>
        {(() => {
          const myGive = WALLET_GIVE.my, myEarn = WALLET.total * WALLET.rate, acts = 14;
          const score = Math.min(100, Math.round(myGive / 3000 + myEarn / 9000 + acts * 2));
          const grade = score >= 85 ? "나눔 천사" : score >= 70 ? "건강 나눔러" : score >= 50 ? "참여 시민" : "새싹 기여자";
          const topPct = score >= 85 ? 3 : score >= 70 ? 12 : score >= 50 ? 30 : 60;
          const w = (n) => (n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원");
          const R = 42, C = 2 * Math.PI * R;
          return (
            <div className="card socmycard">
              <div className="rct"><HeartHandshake size={18} color="#E11D48" /> 나의 사회적 기여도 지수 <button className="cbtn2" style={{ marginLeft: "auto" }} onClick={() => go("social")}>사회적기업 지수 <ChevronRight size={13} /></button></div>
              <div className="socmy">
                <div className="socmy-g">
                  <svg viewBox="0 0 100 100"><defs><linearGradient id="socmy-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FB7185" /><stop offset="1" stopColor="#E11D48" /></linearGradient></defs>
                    <circle cx="50" cy="50" r={R} fill="none" stroke="#F1E4E7" strokeWidth="8" />
                    <circle cx="50" cy="50" r={R} fill="none" stroke="url(#socmy-grad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="socmy-gc"><b>{score}</b><span>{grade}</span></div>
                </div>
                <div className="socmy-r">
                  <div className="socmy-top">상위 <b style={{ color: "#E11D48" }}>{topPct}%</b> 기여 시민 — 형의 소비가 이웃의 치료비가 되었어요.</div>
                  <div className="socmy-mets">
                    <div><span><HeartHandshake size={13} color="#E11D48" /> 내가 만든 나눔</span><b>{w(myGive)}</b></div>
                    <div><span><HandCoins size={13} color="#16A34A" /> 건강적립 환원</span><b>{w(myEarn)}</b></div>
                    <div><span><Users size={13} color="#22D3EE" /> 참여 활동</span><b>{acts}건</b></div>
                  </div>
                </div>
              </div>
              <div className="chnote" style={{ marginTop: 8 }}>※ 사회적 기여도는 나눔·적립 환원·참여 활동을 종합한 시연용 지수입니다. ‘사회적기업’ 섹션에서 플랫폼 전체 임팩트를 확인할 수 있어요.</div>
            </div>
          );
        })()}
      </>)}

      {tab === "consent" && (<>
        <div className="airec"><div className="at"><Lock size={16} color="#2F5BEA" /> 동의관리 · DID(분산신원)</div><div className="ap">목적별로 <b>분리된 동의</b>를 직접 관리하고 언제든 철회할 수 있어요. 필수 항목은 서비스 이용에 필요하며, <b>보험상품 안내 동의와 의료데이터 활용 동의는 묶어서 받지 않습니다.</b></div></div>

        <div className="mdcard">
          <span className="mdcard-ic"><Art name="doc" size={20} /></span>
          <div className="mdcard-b"><b>의료마이데이터 연결</b><span>국민건강보험공단·검진센터에서 내 건강정보를 안전하게 불러옵니다. 전송할 데이터·기간·제공기관을 직접 선택합니다.</span></div>
          <button className="mdcard-btn" onClick={() => setMdOpen(true)}>연결하기 <ChevronRight size={14} /></button>
        </div>

        {(() => { const CATS = [...new Set(MY_CONSENT.map((c) => c[5]))]; return CATS.map((cat) => (
          <div className="csgroup" key={cat}>
            <div className="csgroup-h">{cat}{/보험/.test(cat) && <span className="csgroup-sep">의료데이터 동의와 별도</span>}</div>
            {MY_CONSENT.map(([a, t, d, _def, req], i) => cat !== MY_CONSENT[i][5] ? null : (
              <div className="resitem" key={i}><span className="ic" style={{ background: "#EAF0FE" }}><Art name={a} size={18} /></span>
                <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t} <span className={`reqtag ${req === "필수" ? "req" : "opt"}`} style={{ marginLeft: 4 }}>{req}</span></b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>{d}</div></div>
                <Toggle on={consent[i]} onClick={() => { if (req === "필수") return; setConsent((p) => p.map((v, j) => j === i ? !v : v)); }} />
              </div>
            ))}
          </div>
        )); })()}

        <div className="csgroup">
          <div className="csgroup-h">상담 기록</div>
          <div className="resitem"><span className="ic" style={{ background: "#E7F8EE" }}><Art name="lock" size={18} /></span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>AI 주치의 상담 기록 저장 <span className="reqtag opt" style={{ marginLeft: 4 }}>선택</span></b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>AI 상담 질문·위험도·보장추천을 내 기록으로 저장합니다(‘상담 기록’ 탭에서 조회·삭제·내보내기).</div></div>
            <Toggle on={logConsent} onClick={() => { const v = !logConsent; LOG_CONSENT = v; setLogConsent(v); toast(v ? "상담 기록 저장에 동의했습니다." : "동의를 철회했습니다."); }} />
          </div>
        </div>
        <div className="chnote">※ DID 기반으로 제공받는 자·목적·항목을 확인하고 동의/철회할 수 있습니다. 필수 동의 철회 시 일부 서비스 이용이 제한될 수 있습니다. 의료마이데이터·건강정보 분석·AI 상담·의료기관 제공·보험보장 분석·보험상품 안내 동의는 <b>각각 분리</b>되어 있으며, 목적 외 데이터는 수집하지 않습니다.</div>
        {mdOpen && <MyDataWizard onClose={() => setMdOpen(false)} />}
      </>)}

      {tab === "family" && (() => { const selfM = dm || (typeof selfMember === "function" ? selfMember() : null); return (<>
        {selfM && <FamilyHealthCare member={selfM} onGo={go} />}
        {selfM && typeof FamilyCareSection === "function" && <FamilyCareSection member={selfM} onGo={onGo} />}
        <div className="chnote">※ 가족 건강정보는 본인·가족의 동의(DID) 하에 공유되며, 고령 가족은 재가·돌봄 서비스와 연계됩니다. {dm ? "가족 구성원 데이터는 시연용 예시입니다." : "본인 데이터는 프롬에이지 Premium 리포트 기반, 가족 구성원은 시연용 예시입니다."}</div>
      </>); })()}

      {tab === "noti" && (<>
        <div className="benefit"><span><Art name="badge" size={16} /> 카카오톡 알림</span><span><Art name="hash" size={16} /> 앱 푸시</span><span><Art name="chat" size={16} /> 문자</span></div>
        {MY_NOTI.map(([a, t, d], i) => (
          <div className="resitem" key={i}><span className="ic" style={{ background: "#FEF8E0" }}><Art name={a} size={18} /></span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t}</b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>{d}</div></div>
            <Toggle on={noti[i]} onClick={() => setNoti((p) => p.map((v, j) => j === i ? !v : v))} />
          </div>
        ))}
        <div className="chnote">※ 알림 채널(카카오톡·푸시·문자)은 동의 및 정책에 따라 발송됩니다. 상담·안내 알림은 미동의 시 발송되지 않습니다.</div>
      </>)}
    </div>
  );
}

/* ====================== 커뮤니티 ====================== */
