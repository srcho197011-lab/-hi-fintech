/* ====================== 제휴/투자 신청 — 플랫폼 최상단 섹션 ======================
   제휴 신청(6유형·시스템연동·조건부 홈페이지제작 분기) + 투자 신청(적립금 주식청약·SI/법인).
   ⚠ 모든 수치·데이터는 시연용 예시. 저장은 localStorage(데모). 검증 로직·계산 로직·한도 로직 포함. */

/* ── 관리자 설정 파라미터 기본값(시연용 예시 — 운영 시 관리자 페이지에서 변경) ── */
const PI_PARAM_DEFAULT = {
  NET_INCOME_FORECAST: 4518000000, // FY1 예상 당기순이익 45.18억 (재무제표 연동값)
  PER: 35,
  TOTAL_SHARES: 1000000,           // 총발행주식수
  ANNUAL_POOL_RATE: 0.10,          // 연간 총 배정 한도 (총발행주식수 대비)
  PER_MEMBER_RATE: 0.01,           // 1인당 신청 한도 (총발행주식수 대비 1%)
  MEMBER_POINTS: 8000000,          // 회원 보유 적립금(시연값)
  ALLOCATED_SEED: 42000,           // 올해 이미 배정된 수량(시연 시드)
};
/* ── 투자 계산 로직(순수 함수 — 자가검증에서 재사용) ── */
function piSharePrice(p) { return Math.floor((p.NET_INCOME_FORECAST * p.PER) / p.TOTAL_SHARES); } // 기업가치 ÷ 총주식수
function piCompanyValue(p) { return p.NET_INCOME_FORECAST * p.PER; }
function piAnnualPool(p) { return Math.floor(p.TOTAL_SHARES * p.ANNUAL_POOL_RATE); }
function piPerMemberCap(p) { return Math.floor(p.TOTAL_SHARES * p.PER_MEMBER_RATE); }
function piRemaining(p, allocated) { return Math.max(0, piAnnualPool(p) - allocated); }
function piMaxQty(p, points, allocated) {
  const price = piSharePrice(p); if (price <= 0) return 0;
  return Math.max(0, Math.min(Math.floor(points / price), piPerMemberCap(p), piRemaining(p, allocated)));
}

/* ── 입력 검증기(클라이언트) ── */
function piIPv4(s) { return /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test((s || "").trim()); }
function piIPv6(s) { s = (s || "").trim(); return /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|:(:[0-9a-fA-F]{1,4}){1,7}|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::|::1|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})$/.test(s); }
function piIP(s) { return piIPv4(s) || piIPv6(s); }
function piBiz(s) { return /^\d{10}$/.test((s || "").replace(/[^0-9]/g, "")); }
function piEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim()); }
function piURL(s) { return /^https?:\/\/[^\s]+\.[^\s]+/.test((s || "").trim()); }

/* ── localStorage 저장·접수번호·배정 관리(데모) ── */
function piStore(coll, rec) { try { const a = JSON.parse(localStorage.getItem("pi_" + coll) || "[]"); a.push(rec); localStorage.setItem("pi_" + coll, JSON.stringify(a)); } catch (e) {} }
function piList(coll) { try { return JSON.parse(localStorage.getItem("pi_" + coll) || "[]"); } catch (e) { return []; } }
function piSeq(prefix) {
  let n = 0; try { n = parseInt(localStorage.getItem("pi_seq_" + prefix) || "122", 10) + 1; localStorage.setItem("pi_seq_" + prefix, String(n)); } catch (e) { n = 123; }
  const y = (new Date()).getFullYear();
  return `${prefix}-${y}-${String(n).padStart(6, "0")}`;
}
function piAllocated(seed) { try { const v = localStorage.getItem("pi_allocated"); return v == null ? seed : parseInt(v, 10) || 0; } catch (e) { return seed; } }
function piAddAllocated(qty, seed) { try { const cur = piAllocated(seed); localStorage.setItem("pi_allocated", String(cur + qty)); return cur + qty; } catch (e) { return seed + qty; } }
const piWon = (n) => Number(Math.round(n) || 0).toLocaleString("ko-KR") + "원";
const piNum = (n) => Number(Math.round(n) || 0).toLocaleString("ko-KR");

/* ── 6개 제휴 유형 + 유형별 추가 필드 ── */
const PI_PTYPES = [
  { k: "checkup", t: "건강검진센터", ic: "clip", d: "국가·종합·특수검진", extra: [["items", "검진 항목", "국가검진·종합검진·특수검진(택1↑)", "text"], ["daily", "일일 검진 가능 인원", "예: 300명", "text"], ["equip", "검진 장비 목록", "예: MRI·CT·내시경·초음파", "area"]] },
  { k: "hospital", t: "병원", ic: "build", d: "의원·병원·종합병원", extra: [["depts", "진료과목", "예: 내과·정형외과·영상의학과", "text"], ["beds", "병상 수", "예: 120", "text"], ["hasCenter", "검진센터 병설 여부", "병설/미병설", "text"]] },
  { k: "nursing", t: "요양원", ic: "shield", d: "노인요양·장기요양", extra: [["cap", "정원", "예: 80명", "text"], ["grade", "등급", "예: A등급", "text"], ["svc", "제공 서비스", "요양·주간보호·방문돌봄(택1↑)", "text"]] },
  { k: "care", t: "돌봄센터", ic: "heart", d: "주간보호·방문돌봄", extra: [["cap", "정원", "예: 40명", "text"], ["grade", "등급", "예: 우수기관", "text"], ["svc", "제공 서비스", "주간보호·방문돌봄·재활", "text"]] },
  { k: "pharm", t: "약국", ic: "pill", d: "처방조제·건강제품", extra: [["items", "취급 품목(조제 외)", "영양제·의료기기 등", "text"], ["delivery", "배송 가능 여부", "가능/불가", "text"]] },
  { k: "commerce", t: "건강쇼핑기업", ic: "cart", d: "식단·영양제·의료기기", extra: [["cats", "취급 카테고리", "건강식단·영양제·의료기기(택1↑)", "text"], ["skuCnt", "보유 상품 수", "예: 1,200종", "text"], ["logi", "물류·배송 체계", "예: 자체물류·3PL", "area"]] },
];
const PI_STAGES = ["접수", "서류검토", "승인", "연동테스트", "입점 완료"];

/* ── 입력 필드 컴포넌트 ── */
function PiField({ label, val, set, ph, type, err, req, dis, area, maxLen }) {
  return (
    <label className={"pi-fld" + (err ? " pi-err" : "") + (dis ? " pi-dis" : "")}>
      <span className="pi-lab">{label}{req && <b className="pi-req">*</b>}</span>
      {area
        ? <textarea value={val} disabled={dis} maxLength={maxLen || 500} onChange={(e) => set(e.target.value)} placeholder={ph} rows={3} />
        : <input value={val} disabled={dis} type={type || "text"} onChange={(e) => set(e.target.value)} placeholder={ph} />}
      {err && <span className="pi-errmsg"><AlertTriangle size={11} /> {err}</span>}
      {maxLen && area && <span className="pi-cnt">{(val || "").length}/{maxLen}</span>}
    </label>
  );
}
function PiBadge() { return <span className="pi-badge"><AlertTriangle size={12} /> 시연용 예시 데이터</span>; }
function PiDocDownload({ href, name, title, desc }) {
  return (
    <a className="pi-doc" href={href} download={name} onClick={() => { if (typeof toast === "function") toast("계약서(안) 워드 파일을 내려받습니다."); }}>
      <span className="pi-doc-ic"><FileText size={20} /></span>
      <span className="pi-doc-t"><b>{title}</b><span>{desc}</span></span>
      <span className="pi-doc-go">.docx 내려받기</span>
    </a>
  );
}
function PiStages({ active }) {
  return (<div className="pi-stages">{PI_STAGES.map((s, i) => (
    <div key={i} className={"pi-stage" + (i <= active ? " on" : "") + (i === active ? " cur" : "")}>
      <span className="pi-sdot">{i < active ? <Check size={12} /> : i + 1}</span><span>{s}</span>
    </div>))}</div>);
}
function PiDone({ title, code, sub, onReset, stages }) {
  return (<div className="pi-done">
    <div className="pi-done-ic"><BadgeCheck size={38} /></div>
    <div className="pi-done-t">{title}</div>
    <div className="pi-done-code">접수번호 <b>{code}</b></div>
    {sub && <div className="pi-done-sub">{sub}</div>}
    {stages && <PiStages active={0} />}
    <div className="pi-done-note">관리자에게 알림이 발송되었습니다. 접수번호로 진행 상태를 조회하실 수 있어요. <b>(시연)</b></div>
    <button className="pi-btn ghost" onClick={onReset}>새 신청 작성</button>
  </div>);
}

/* ── A. 제휴 신청 ── */
function PartnershipFlow() {
  const [ptype, setPtype] = useState(null);
  const [f, setF] = useState({});
  const [noLink, setNoLink] = useState(false); // 연동정보 없음 → 홈페이지 제작 신청서 전환
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(null);
  const s = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const cur = PI_PTYPES.find((x) => x.k === ptype);
  const reset = () => { setPtype(null); setF({}); setNoLink(false); setAgree(false); setErrs({}); setDone(null); };

  if (done) return <PiDone {...done} onReset={reset} stages />;

  const submit = () => {
    const e = {};
    if (!f.org) e.org = "기관명을 입력하세요.";
    if (!piBiz(f.biz)) e.biz = "사업자등록번호 10자리를 정확히 입력하세요.";
    if (!f.ceo) e.ceo = "대표자명을 입력하세요.";
    if (!f.mgr) e.mgr = "담당자명/직책을 입력하세요.";
    if (!f.tel) e.tel = "연락처를 입력하세요.";
    if (!piEmail(f.email)) e.email = "이메일 형식이 올바르지 않습니다.";
    if (!f.addr) e.addr = "소재지 주소를 입력하세요.";
    if (!noLink) { // 시스템 연동 정보 검증
      if (!piIP(f.ip)) e.ip = "IPv4/IPv6 형식의 연동 서버 IP를 입력하세요.";
      if (f.emrUrl && !piURL(f.emrUrl)) e.emrUrl = "EMR 주소는 http(s):// URL 형식이어야 합니다.";
    }
    if (!agree) e.agree = "개인정보 수집·이용에 동의해 주세요.";
    setErrs(e);
    if (Object.keys(e).length) { if (typeof toast === "function") toast("입력값을 확인해 주세요."); return; }
    const code = piSeq("PN");
    piStore("partnership_applications", { code, type: ptype, org: f.org, biz: f.biz, ceo: f.ceo, mgr: f.mgr, tel: f.tel, email: f.email, addr: f.addr, intro: f.intro || "", link: noLink ? null : { ip: f.ip, fixedIp: !!f.fixedIp, emrUrl: f.emrUrl || "", emrVendor: f.emrVendor || "", uip: f.uip || "", uipVer: f.uipVer || "", uipEp: f.uipEp || "", hl7fhir: f.hl7fhir || "", itTel: f.itTel || "", firewall: f.firewall || "" }, extra: (cur.extra || []).reduce((a, [k]) => (a[k] = f[k] || "", a), {}), stage: 0, at: (new Date()).toISOString() });
    if (typeof toast === "function") toast(`제휴 신청 접수 완료 · ${code}`);
    setDone({ title: `${cur.t} 제휴 신청이 접수되었습니다`, code, sub: `${f.org} · 진행 상태 5단계로 안내해 드려요` });
  };

  const submitHomepage = () => {
    const e = {};
    if (!f.org) e.org = "기관명을 입력하세요.";
    if (!piEmail(f.email)) e.email = "이메일 형식이 올바르지 않습니다.";
    if (!f.hpDomain) e.hpDomain = "희망 도메인을 입력하세요.";
    if (!f.hpType) e.hpType = "사이트 유형을 선택하세요.";
    setErrs(e);
    if (Object.keys(e).length) { if (typeof toast === "function") toast("입력값을 확인해 주세요."); return; }
    const code = piSeq("HR");
    piStore("homepage_requests", { code, org: f.org, email: f.email, domain: f.hpDomain, siteType: f.hpType, features: f.hpFeat || [], layout: f.hpLayout || "", ref: f.hpRef || "", budget: f.hpBudget || "", openAt: f.hpOpen || "", autoLink: !!f.hpAuto, at: (new Date()).toISOString() });
    if (typeof toast === "function") toast(`홈페이지 제작 신청 접수 · ${code}`);
    setDone({ title: "홈페이지 제작 신청이 접수되었습니다", code, sub: `${f.org} · 제작 후 하이핀 플랫폼 자동 연동${f.hpAuto ? " 신청 포함" : ""}` });
  };

  if (!ptype) return (
    <div className="pi-pane">
      <div className="pi-sech"><Handshake size={18} /> 어떤 기관으로 제휴하시나요?<span>제휴 유형을 선택하면 맞춤 신청서로 안내해 드려요</span></div>
      <div className="pi-typegrid">{PI_PTYPES.map((t) => (
        <button key={t.k} className="pi-typecard" onClick={() => { setPtype(t.k); setErrs({}); }}>
          <span className="pi-typeic"><PiIco k={t.ic} /></span>
          <span className="pi-typet">{t.t}</span><span className="pi-typed">{t.d}</span>
        </button>))}</div>
      <PiDocDownload href="./data/docs/hifin_partnership_agreement.docx" name="하이핀_기관_업무제휴_계약서(안).docx" title="기관 업무제휴 계약서(안)" desc="6개 제휴유형·시스템 연동(IP·EMR·UIP·HL7/FHIR)·데이터 보호 표준계약서 · 시연용 예시" />
      <div className="pi-note2"><Lock size={12} /> 입력 정보는 제휴 검토 목적에만 사용되며, 데모 환경에서는 브라우저에만 임시 저장됩니다.</div>
    </div>
  );

  const feHas = (k) => (f.hpFeat || []).includes(k);
  const toggleFeat = (k) => setF((o) => { const cur = o.hpFeat || []; return { ...o, hpFeat: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] }; });

  return (
    <div className="pi-pane">
      <button className="pi-back" onClick={() => setPtype(null)}>‹ 제휴 유형 다시 선택</button>
      <div className="pi-sech"><PiIco k={cur.ic} /> {cur.t} 제휴 신청<span>{cur.d}</span></div>

      <div className="pi-block">
        <div className="pi-blockt">① 기관 기본 정보</div>
        <div className="pi-grid2">
          <PiField label="기관명(상호)" req val={f.org} set={s("org")} ph="예: 하이헬스검진센터" err={errs.org} />
          <PiField label="사업자등록번호" req val={f.biz} set={s("biz")} ph="10자리 숫자" err={errs.biz} />
          <PiField label="대표자명" req val={f.ceo} set={s("ceo")} ph="대표자 성명" err={errs.ceo} />
          <PiField label="담당자명 / 직책" req val={f.mgr} set={s("mgr")} ph="예: 김하이 / 제휴팀장" err={errs.mgr} />
          <PiField label="연락처" req val={f.tel} set={s("tel")} ph="02-000-0000 / 010-0000-0000" err={errs.tel} />
          <PiField label="이메일" req val={f.email} set={s("email")} ph="name@company.com" err={errs.email} />
        </div>
        <PiField label="소재지 주소" req val={f.addr} set={s("addr")} ph="도로명 주소" err={errs.addr} />
        <PiField label="기관 소개 (500자 이내)" val={f.intro} set={s("intro")} ph="기관·서비스 소개를 간단히 적어주세요" area maxLen={500} />
      </div>

      <div className="pi-block">
        <div className="pi-blockt">② 유형별 정보 · {cur.t}</div>
        <div className="pi-grid2">{cur.extra.map(([k, l, ph, ty]) => (
          <PiField key={k} label={l} val={f[k]} set={s(k)} ph={ph} area={ty === "area"} />))}</div>
      </div>

      <div className="pi-block">
        <div className="pi-blockt">③ 시스템 연동 정보 <span className="pi-blocksub">EMR·UIP 네트워크 연동</span></div>
        <label className="pi-check big"><input type="checkbox" checked={noLink} onChange={(e) => setNoLink(e.target.checked)} /> <span>연동 가능한 IP·EMR·UIP 정보가 없습니다 <em>(체크 시 홈페이지 제작 신청서로 전환)</em></span></label>

        {!noLink && (<div className="pi-linkfields">
          <div className="pi-grid2">
            <PiField label="연동 서버 IP 주소 (IPv4/IPv6)" req val={f.ip} set={s("ip")} ph="예: 203.0.113.10 또는 2001:db8::1" err={errs.ip} />
            <label className="pi-fld"><span className="pi-lab">고정 IP 여부</span>
              <label className="pi-check inl"><input type="checkbox" checked={!!f.fixedIp} onChange={(e) => s("fixedIp")(e.target.checked)} /> <span>고정 IP 사용</span></label></label>
            <PiField label="EMR 시스템 주소 (URL)" val={f.emrUrl} set={s("emrUrl")} ph="https://emr.hospital.co.kr" err={errs.emrUrl} />
            <PiField label="EMR 벤더명 / 버전" val={f.emrVendor} set={s("emrVendor")} ph="예: 이지스헬스케어 v4.2" />
            <PiField label="UIP 지원 여부 / 버전" val={f.uip} set={s("uip")} ph="예: 지원 · UIP 2.1" />
            <PiField label="UIP 엔드포인트" val={f.uipEp} set={s("uipEp")} ph="예: https://api.../uip" />
            <PiField label="HL7 / FHIR 지원" val={f.hl7fhir} set={s("hl7fhir")} ph="예: FHIR R4 지원" />
            <PiField label="연동 담당자(IT) 연락처" val={f.itTel} set={s("itTel")} ph="IT 담당자 전화/이메일" />
          </div>
          <label className="pi-fld"><span className="pi-lab">방화벽 화이트리스트 협의 가능 여부</span>
            <label className="pi-check inl"><input type="checkbox" checked={!!f.firewall} onChange={(e) => s("firewall")(e.target.checked ? "협의가능" : "")} /> <span>협의 가능</span></label></label>
        </div>)}

        {noLink && (<div className="pi-hpwrap">
          <div className="pi-hph"><Globe size={15} /> 홈페이지 제작 신청서 <span>연동 시스템이 없어도 하이핀이 홈페이지를 제작하고 이후 자동 연동해 드려요</span></div>
          <div className="pi-grid2">
            <PiField label="희망 도메인" req val={f.hpDomain} set={s("hpDomain")} ph="예: myclinic.co.kr" err={errs.hpDomain} />
            <label className={"pi-fld" + (errs.hpType ? " pi-err" : "")}><span className="pi-lab">사이트 유형<b className="pi-req">*</b></span>
              <select value={f.hpType || ""} onChange={(e) => s("hpType")(e.target.value)}>
                <option value="">선택</option><option>소개형</option><option>예약형</option><option>쇼핑몰형</option>
              </select>{errs.hpType && <span className="pi-errmsg"><AlertTriangle size={11} /> {errs.hpType}</span>}</label>
          </div>
          <div className="pi-fld"><span className="pi-lab">필요 기능</span>
            <div className="pi-chips">{["온라인 예약", "결제", "회원관리", "EMR 경량 연동"].map((k) => (
              <button type="button" key={k} className={"pi-chip" + (feHas(k) ? " on" : "")} onClick={() => toggleFeat(k)}>{feHas(k) ? "✓ " : ""}{k}</button>))}</div></div>
          <PiField label="페이지 구성 희망안" val={f.hpLayout} set={s("hpLayout")} ph="예: 메인·소개·진료안내·예약·오시는길" area />
          <div className="pi-grid2">
            <PiField label="참고 사이트" val={f.hpRef} set={s("hpRef")} ph="참고할 사이트 URL" />
            <PiField label="예산 범위 (선택)" val={f.hpBudget} set={s("hpBudget")} ph="예: 300~500만원" />
            <PiField label="희망 오픈 시기" val={f.hpOpen} set={s("hpOpen")} ph="예: 2026년 9월" />
          </div>
          <label className="pi-check"><input type="checkbox" checked={!!f.hpAuto} onChange={(e) => s("hpAuto")(e.target.checked)} /> <span>제작 완료 후 하이핀 플랫폼 자동 연동 신청에 동의합니다</span></label>
        </div>)}
      </div>

      <label className={"pi-check" + (errs.agree ? " pi-err" : "")}><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>개인정보 수집·이용 및 제휴 심사 목적 활용에 동의합니다.{errs.agree && <em className="pi-inlerr"> · 동의가 필요합니다</em>}</span></label>

      <div className="pi-actions">
        <button className="pi-btn" onClick={noLink ? submitHomepage : submit}><Send size={15} /> {noLink ? "홈페이지 제작 신청서 제출" : "제휴 신청서 제출"}</button>
      </div>
    </div>
  );
}

/* ── B-1. 회원 적립금 주식 청약 ── */
function StockSubscription({ params, setParams }) {
  const p = params;
  const [qty, setQty] = useState(0);
  const [agree, setAgree] = useState(false);
  const [risk, setRisk] = useState(false);
  const [done, setDone] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tick, setTick] = useState(0);
  const allocated = piAllocated(p.ALLOCATED_SEED);
  const price = piSharePrice(p);
  const pool = piAnnualPool(p), cap = piPerMemberCap(p), remaining = piRemaining(p, allocated);
  const maxQty = piMaxQty(p, p.MEMBER_POINTS, allocated);
  const closed = remaining <= 0;
  const cost = qty * price;
  const setNum = (v) => { const n = Math.max(0, parseInt(String(v).replace(/[^0-9]/g, "") || "0", 10)); setQty(n); };

  if (done) return <PiDone title="주식 청약이 접수되었습니다" code={done.code} sub={done.sub} onReset={() => { setDone(null); setQty(0); setAgree(false); setRisk(false); }} />;

  const subscribe = () => {
    if (closed) { if (typeof toast === "function") toast("올해 배정 물량이 마감되었습니다."); return; }
    if (qty < 1) { if (typeof toast === "function") toast("청약 수량을 입력하세요."); return; }
    if (qty > maxQty) { if (typeof toast === "function") toast(`신청 가능 최대 수량(${piNum(maxQty)}주)을 초과했습니다.`); return; }
    if (!risk || !agree) { if (typeof toast === "function") toast("투자위험 고지·약관에 동의해 주세요."); return; }
    const code = piSeq("SO");
    piAddAllocated(qty, p.ALLOCATED_SEED);
    piStore("member_stock_orders", { code, qty, sharePrice: price, cost, pointsBefore: p.MEMBER_POINTS, pointsAfter: p.MEMBER_POINTS - cost, per: p.PER, netIncome: p.NET_INCOME_FORECAST, at: (new Date()).toISOString() });
    setParams((o) => ({ ...o, MEMBER_POINTS: o.MEMBER_POINTS - cost }));
    if (typeof txAnchor === "function") txAnchor({ ttype: "invest", kind: "주식 청약", amount: qty, unit: "주", memo: code + " · " + piWon(cost) + " 차감" });
    if (typeof toast === "function") toast(`청약 완료 · ${code} · ${piNum(qty)}주`);
    setDone({ code, sub: `${piNum(qty)}주 · ${piWon(cost)} 차감 · 주당 ${piWon(price)}` });
    setTick((t) => t + 1);
  };
  const setP = (k) => (v) => setParams((o) => ({ ...o, [k]: v }));

  return (
    <div className="pi-pane">
      <div className="pi-sech"><Coins size={18} /> 회원 적립금 주식 청약<span>보유 적립금으로 하이핀 주식을 청약해요 · 시연용</span></div>

      <div className="pi-invgrid">
        <div className="pi-invcard">
          <div className="pi-invk">보유 적립금</div>
          <div className="pi-invv" style={{ color: "#16A34A" }}>{piWon(p.MEMBER_POINTS)}</div>
          <div className="pi-invs">Health Token(건강자산) 잔액</div>
        </div>
        <div className="pi-invcard hi">
          <div className="pi-invk">현재 주당가격</div>
          <div className="pi-invv">{piWon(price)}</div>
          <div className="pi-invs">기업가치 {piWon(piCompanyValue(p))} ÷ {piNum(p.TOTAL_SHARES)}주</div>
        </div>
        <div className="pi-invcard">
          <div className="pi-invk">산정 근거</div>
          <div className="pi-invv sm">당기순이익 × PER {p.PER}</div>
          <div className="pi-invs">FY 예상 당기순이익 {piWon(p.NET_INCOME_FORECAST)}</div>
        </div>
      </div>

      <div className="pi-alloc">
        <div className="pi-allocbar"><span style={{ width: Math.min(100, (allocated / pool) * 100) + "%" }} /></div>
        <div className="pi-allocmeta">
          <span>올해 총 배정 <b>{piNum(pool)}주</b> ({(p.ANNUAL_POOL_RATE * 100).toFixed(1)}%)</span>
          <span>배정 완료 <b>{piNum(allocated)}주</b></span>
          <span className={closed ? "cl" : "rm"}>잔여 <b>{piNum(remaining)}주</b>{closed ? " · 마감" : ""}</span>
          <span>1인 한도 <b>{piNum(cap)}주</b> ({(p.PER_MEMBER_RATE * 100).toFixed(2)}%)</span>
        </div>
      </div>

      <div className="pi-block">
        <div className="pi-blockt">청약 신청</div>
        <div className="pi-qtyrow">
          <label className="pi-fld"><span className="pi-lab">청약 수량 (주)</span>
            <input value={qty || ""} onChange={(e) => setNum(e.target.value)} placeholder="0" inputMode="numeric" disabled={closed} /></label>
          <button className="pi-maxbtn" disabled={closed} onClick={() => setQty(maxQty)}>최대 {piNum(maxQty)}주</button>
        </div>
        <div className="pi-calc">
          <div><span>주당가격</span><b>{piWon(price)}</b></div>
          <div><span>청약 금액</span><b>{piWon(cost)}</b></div>
          <div><span>차감 후 적립금</span><b style={{ color: p.MEMBER_POINTS - cost < 0 ? "#EF4444" : "#16A34A" }}>{piWon(Math.max(0, p.MEMBER_POINTS - cost))}</b></div>
          <div><span>신청 가능 최대</span><b>{piNum(maxQty)}주</b></div>
        </div>
        <div className="pi-limitnote">실제 신청 가능 수량 = min(적립금 ÷ 주당가격 <b>{piNum(Math.floor(p.MEMBER_POINTS / price))}</b>, 1인 한도 <b>{piNum(cap)}</b>, 잔여배정 <b>{piNum(remaining)}</b>) = <b>{piNum(maxQty)}주</b></div>

        <label className="pi-check"><input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} /> <span>비상장주식 투자위험(원금 손실 가능)을 이해했습니다.</span></label>
        <label className="pi-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>청약 약관 및 개인정보 수집·이용에 동의합니다.</span></label>
        <div className="pi-actions">
          <button className="pi-btn" disabled={closed} onClick={subscribe}><Coins size={15} /> {closed ? "올해 배정 마감" : "주식 청약 신청"}</button>
          <button className="pi-btn ghost sm" onClick={() => setShowAdmin((v) => !v)}>⚙ 시연 파라미터</button>
        </div>
        <div className="pi-risk"><AlertTriangle size={13} /> 본 청약은 <b>비상장주식 투자</b>로 원금 손실 위험이 있으며, 가격은 회사 <b>재무 추정치 기준</b>으로 산정됩니다. 한도·가격은 <b>예시 기준</b>이며 실제 청약 시 확정 공지됩니다.</div>
      </div>

      {showAdmin && (<div className="pi-admin">
        <div className="pi-blockt">⚙ 관리자 설정(시연) — 값 변경 시 가격·한도 즉시 재계산</div>
        <div className="pi-grid2">
          {[["NET_INCOME_FORECAST", "예상 당기순이익(원)"], ["PER", "PER"], ["TOTAL_SHARES", "총발행주식수"], ["MEMBER_POINTS", "보유 적립금(원)"]].map(([k, l]) => (
            <label className="pi-fld" key={k}><span className="pi-lab">{l}</span>
              <input value={p[k]} inputMode="numeric" onChange={(e) => setP(k)(Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, "") || "0", 10)))} /></label>))}
          {[["ANNUAL_POOL_RATE", "연간 총한도(%)"], ["PER_MEMBER_RATE", "1인 한도(%)"]].map(([k, l]) => (
            <label className="pi-fld" key={k}><span className="pi-lab">{l}</span>
              <input value={(p[k] * 100)} inputMode="decimal" onChange={(e) => setP(k)((parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0) / 100)} /></label>))}
        </div>
        <button className="pi-btn ghost sm" onClick={() => { try { localStorage.removeItem("pi_allocated"); } catch (e) {} setTick((t) => t + 1); if (typeof toast === "function") toast("배정 시드 초기화(시연)"); }}>배정 초기화</button>
      </div>)}
    </div>
  );
}

/* ── B-2. SI·법인 투자 ── */
function CorporateInvest() {
  const [f, setF] = useState({ itype: "SI", cat: "건강식단" });
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(null);
  const s = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  if (done) return <PiDone title="투자 신청이 접수되었습니다" code={done.code} sub={done.sub} onReset={() => { setDone(null); setF({ itype: "SI", cat: "건강식단" }); setAgree(false); }} />;
  const submit = () => {
    const e = {};
    if (!f.corp) e.corp = "법인명을 입력하세요.";
    if (!piBiz(f.biz)) e.biz = "사업자등록번호 10자리를 입력하세요.";
    if (!f.amount) e.amount = "희망 투자금액을 입력하세요.";
    if (!f.mgr) e.mgr = "담당자/연락처를 입력하세요.";
    if (!piEmail(f.email)) e.email = "IR 자료 수신 이메일 형식이 올바르지 않습니다.";
    if (!agree) e.agree = "동의가 필요합니다.";
    setErrs(e); if (Object.keys(e).length) { if (typeof toast === "function") toast("입력값을 확인해 주세요."); return; }
    const code = piSeq("IV");
    piStore("corporate_investments", { code, corp: f.corp, biz: f.biz, itype: f.itype, cat: f.itype === "SI" ? f.cat : null, amount: f.amount, equity: f.equity || "", mgr: f.mgr, email: f.email, at: (new Date()).toISOString() });
    if (typeof txAnchor === "function") txAnchor({ ttype: "invest", kind: f.itype === "SI" ? "SI 투자 신청" : "법인 투자 신청", memo: code + " · " + f.corp });
    if (typeof toast === "function") toast(`투자 신청 접수 · ${code}`);
    setDone({ code, sub: `${f.corp} · ${f.itype === "SI" ? "SI(" + f.cat + ")" : "일반 법인(FI)"}` });
  };
  return (
    <div className="pi-pane">
      <div className="pi-sech"><Landmark size={18} /> SI · 법인 투자 신청<span>전략적 투자자(SI) · 일반 법인(FI)</span></div>
      <div className="pi-irbox">
        <div className="pi-irh"><TrendingUp size={14} /> 투자 안내 <PiBadge /></div>
        <ul className="pi-irlist">
          <li>Pre-money 기업가치 <b>100억 원</b></li>
          <li>SI 카테고리별 투자한도 지분 <b>5% (5억 원)</b> · 부가가치: <b>3년간 우선 입점 + 섹션 최상단 노출</b></li>
          <li>납입 3단계 트랜치: <b>계약금 30%</b> → <b>중도금 30%</b>(영업개시 전) → <b>잔금 40%</b>(개시 후 3개월 내)</li>
          <li>2차 라운드: 영업개시 후 <b>Valuation 1,000억</b> 기준 <b>10% 이내</b> 예정</li>
        </ul>
      </div>
      <PiDocDownload href="./data/docs/HiZenCare_HIFin_Investor_IR.docx" name="하이핀_투자제안서_IR.docx" title="투자 제안서(IR) 내려받기" desc="사업개요·팀·트랙션·시장규모(TAM-SAM-SOM)·경쟁차별·자금사용계획(10억) · 대외비" />
      <PiDocDownload href="./data/docs/hifin_investment_agreement.docx" name="하이핀_전략적투자_업무제휴_계약서(안).docx" title="전략적 투자 · 업무제휴 계약서(안)" desc="본 신청과 동일 조건(Pre 100억·SI 5%·3단계 트랜치·2차 1,000억)의 표준계약서 · 시연용 예시" />
      <div className="pi-block">
        <div className="pi-blockt">투자 신청 정보</div>
        <div className="pi-grid2">
          <PiField label="법인명" req val={f.corp} set={s("corp")} ph="투자 법인명" err={errs.corp} />
          <PiField label="사업자등록번호" req val={f.biz} set={s("biz")} ph="10자리 숫자" err={errs.biz} />
        </div>
        <div className="pi-fld"><span className="pi-lab">투자 유형<b className="pi-req">*</b></span>
          <div className="pi-chips">
            <button type="button" className={"pi-chip" + (f.itype === "SI" ? " on" : "")} onClick={() => s("itype")("SI")}>SI (전략적 투자자)</button>
            <button type="button" className={"pi-chip" + (f.itype === "FI" ? " on" : "")} onClick={() => s("itype")("FI")}>일반 법인 (FI)</button>
          </div></div>
        {f.itype === "SI" && <div className="pi-fld"><span className="pi-lab">SI 카테고리</span>
          <div className="pi-chips">{["건강식단", "영양제", "의료기기"].map((c) => (
            <button type="button" key={c} className={"pi-chip" + (f.cat === c ? " on" : "")} onClick={() => s("cat")(c)}>{c}</button>))}</div></div>}
        <div className="pi-grid2">
          <PiField label="희망 투자금액" req val={f.amount} set={s("amount")} ph="예: 5억 원" err={errs.amount} />
          <PiField label="희망 지분율" val={f.equity} set={s("equity")} ph="예: 5%" />
          <PiField label="담당자 / 연락처" req val={f.mgr} set={s("mgr")} ph="담당자명 · 전화" err={errs.mgr} />
          <PiField label="IR 자료 수신 이메일" req val={f.email} set={s("email")} ph="ir@corp.com" err={errs.email} />
        </div>
        <label className={"pi-check" + (errs.agree ? " pi-err" : "")}><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>개인정보 수집·이용 및 IR 자료 수신에 동의합니다.</span></label>
        <div className="pi-actions"><button className="pi-btn" onClick={submit}><Send size={15} /> 투자 신청서 제출</button></div>
      </div>
    </div>
  );
}

/* ── 아이콘 매핑 ── */
function PiIco({ k }) {
  const M = { clip: ClipboardList, build: Building2, shield: ShieldCheck, heart: Handshake, pill: Building, cart: Coins };
  const Ic = M[k] || Building2; return <Ic size={22} />;
}

/* ── 자가검증(로직 테스트) ── */
function piSelfTest() {
  const base = { NET_INCOME_FORECAST: 4518000000, PER: 35, TOTAL_SHARES: 1000000, ANNUAL_POOL_RATE: 0.10, PER_MEMBER_RATE: 0.01 };
  const r = [];
  const price = piSharePrice(base);
  r.push({ n: "주당가격 = 당기순이익×PER35÷총주식수", exp: "158,130원", got: piWon(price), pass: price === 158130 });
  r.push({ n: "연간 총 배정(10%)", exp: "100,000주", got: piNum(piAnnualPool(base)), pass: piAnnualPool(base) === 100000 });
  r.push({ n: "1인당 한도(1%)", exp: "10,000주", got: piNum(piPerMemberCap(base)), pass: piPerMemberCap(base) === 10000 });
  const t1 = piMaxQty(base, 100000, 0); r.push({ n: "적립금 부족(10만원)→0주", exp: "0주", got: piNum(t1), pass: t1 === 0 });
  const t2 = piMaxQty(base, 999999999999, 0); r.push({ n: "1인 상한 초과→10,000주 캡", exp: "10,000주", got: piNum(t2), pass: t2 === 10000 });
  const t3 = piMaxQty(base, 999999999999, 100000); r.push({ n: "연간 총한도 소진→0주(마감)", exp: "0주", got: piNum(t3), pass: t3 === 0 });
  const t4 = piSharePrice({ ...base, PER: 40 }); r.push({ n: "PER 35→40 재계산", exp: "180,720원", got: piWon(t4), pass: t4 === 180720 });
  r.push({ n: "IP 검증: 192.168.0.1(v4)", exp: "유효", got: piIPv4("192.168.0.1") ? "유효" : "무효", pass: piIPv4("192.168.0.1") });
  r.push({ n: "IP 검증: 999.1.1.1(오류)", exp: "무효", got: piIP("999.1.1.1") ? "유효" : "무효", pass: !piIP("999.1.1.1") });
  r.push({ n: "IP 검증: 2001:db8::1(v6)", exp: "유효", got: piIPv6("2001:db8::1") ? "유효" : "무효", pass: piIPv6("2001:db8::1") });
  r.push({ n: "사업자번호 10자리", exp: "유효", got: piBiz("1234567890") ? "유효" : "무효", pass: piBiz("1234567890") && !piBiz("12345") });
  r.push({ n: "이메일/URL 검증", exp: "유효", got: (piEmail("a@b.com") && piURL("https://x.co/y")) ? "유효" : "무효", pass: piEmail("a@b.com") && piURL("https://x.co/y") && !piEmail("bad") });
  return r;
}
function PiSelfTest() {
  const [res, setRes] = useState(null);
  const run = () => setRes(piSelfTest());
  const pass = res ? res.filter((x) => x.pass).length : 0;
  return (<div className="pi-test">
    <button className="pi-btn ghost sm" onClick={run}>🧪 계산·검증 로직 자가검증 실행</button>
    {res && <div className="pi-testres">
      <div className="pi-testh">{pass}/{res.length} 통과</div>
      {res.map((x, i) => (<div key={i} className={"pi-testr" + (x.pass ? " ok" : " no")}>
        <span>{x.pass ? "✓" : "✗"} {x.n}</span><b>{x.got}</b></div>))}
    </div>}
  </div>);
}

/* ── 메인 섹션 ── */
function PartnerInvestSection({ onGo }) {
  const [tab, setTab] = useState("partner");
  const [itab, setItab] = useState("stock");
  const [params, setParams] = useState({ ...PI_PARAM_DEFAULT });
  return (
    <div className="pi-wrap">
      <div className="pi-hero">
        <div className="pi-herol">
          <span className="pi-tag"><Handshake size={13} /> Partners & Investors</span>
          <h2>제휴 · 투자 신청</h2>
          <p>검진센터·병원·요양·돌봄·약국·건강쇼핑 <b>제휴 네트워크</b>와 <b>회원·법인 투자</b>를 한 곳에서. 하이핀과 함께 성장하세요.</p>
        </div>
        <PiBadge />
      </div>
      <div className="pi-tabs">
        <button className={"pi-tab" + (tab === "partner" ? " on" : "")} onClick={() => setTab("partner")}><Handshake size={16} /> 제휴 신청</button>
        <button className={"pi-tab" + (tab === "invest" ? " on" : "")} onClick={() => setTab("invest")}><TrendingUp size={16} /> 투자 신청</button>
      </div>

      {tab === "partner" && <PartnershipFlow />}
      {tab === "invest" && (<div className="pi-pane">
        <div className="pi-subtabs">
          <button className={"pi-subtab" + (itab === "stock" ? " on" : "")} onClick={() => setItab("stock")}><Coins size={14} /> 회원 적립금 주식청약</button>
          <button className={"pi-subtab" + (itab === "corp" ? " on" : "")} onClick={() => setItab("corp")}><Landmark size={14} /> SI·법인 투자</button>
        </div>
        {itab === "stock" ? <StockSubscription params={params} setParams={setParams} /> : <CorporateInvest />}
      </div>)}

      <PiSelfTest />
      <div className="pi-foot"><Lock size={12} /> 데모 환경 — 모든 수치는 시연용 예시이며, 입력은 브라우저(localStorage)에만 임시 저장됩니다. 실제 제휴·청약·투자는 계약·인가·규제 검토를 전제로 합니다.</div>
    </div>
  );
}
