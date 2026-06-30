function loadHomecare() {
  if (!_homecarePromise) {
    _homecarePromise = fetch("./src/data/homecare.json").then((r) => { if (!r.ok) throw new Error("데이터 로드 실패 (" + r.status + ")"); return r.json(); });
  }
  return _homecarePromise;
}
function useHomecare() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => { let on = true; loadHomecare().then((d) => on && setState({ loading: false, error: null, data: d })).catch((e) => on && setState({ loading: false, error: e.message, data: null })); return () => { on = false; }; }, []);
  return state;
}
const SVC_META = {
  "방문요양": { art: "visit", col: "#2563EB", bg: "#E8F1FE", d: "요양보호사가 가정을 방문해 신체·가사활동을 지원" },
  "방문목욕": { art: "bath", col: "#0EA5E9", bg: "#E0F2FE", d: "이동식 욕조 등 장비로 가정에서 목욕 서비스 제공" },
  "방문간호": { art: "nurse", col: "#16A34A", bg: "#E7F8EE", d: "간호사가 방문해 진료보조·간호·투약 관리" },
  "주야간보호": { art: "day", col: "#7C3AED", bg: "#F1ECFE", d: "낮 동안 기관에서 신체활동 지원·기능 회복 프로그램" },
  "단기보호": { art: "short", col: "#F59E0B", bg: "#FEF3E2", d: "일정 기간(월 최대 일수) 기관 보호·돌봄" },
  "복지용구": { art: "welfare", col: "#DB2777", bg: "#FCE7F3", d: "전동침대·휠체어 등 복지용구 구입·대여" },
  "방문재활": { art: "rehab", col: "#0D9488", bg: "#CCFBF1", d: "물리·작업치료사가 방문해 재활 프로그램 제공" },
};
const svcMeta = (s) => SVC_META[s] || { art: "nurse", col: "#64748B", bg: "#F1F5FB", d: "" };

// 특별제휴업체 — 제니엘그룹(제니엘메디컬): 의료·간병 인력 아웃소싱 전문.
const GENIEL = {
  name: "제니엘그룹",
  div: "제니엘메디컬",
  tagline: "병원·의료·간병 인력 아웃소싱 전문기업. 검증된 전문 인력과 표준화된 간병 시스템으로 안심 재가·간병을 연결합니다.",
  home: "https://www.zeniel.com/ko/?c=198&s=178",   // 의료 아웃소싱 (콘텐츠 직접 표시 확인됨)
  care: "https://www.zeniel.com/ko/?c=198&s=179",   // 간병 서비스 (콘텐츠 직접 표시 확인됨)
  group: "https://www.zeniel.com/ko/",
  tel: "1588-1581",
  strengths: [
    ["nurse", "의료·간병 인력 운영", "병동·개인·공동간병 및 홈케어 전문 인력 직접 운영"],
    ["building", "병원 업무 아웃소싱", "안내·예약·콜센터·원무·수납·환자이송·진료보조"],
    ["people", "의료 전문 인력 DB", "검증된 요양보호사·간병·간호 인력 풀 기반 매칭"],
    ["badge", "표준 간병 시스템", "직무교육·배상책임보험·품질관리 표준 운영"],
  ],
  stats: [["전국", "서비스 권역"], ["병원·요양·재가", "제공 분야"], ["교육·배상책임", "품질 관리"]],
};

function SpecialPartner({ data }) {
  const [apply, setApply] = useState(false);
  const sidoIdx = Math.max(0, data.sido.indexOf(PT.sido));
  const svcIdx = ["방문요양", "방문목욕", "방문간호", "주야간보호"].map((s) => data.svc.indexOf(s)).filter((i) => i >= 0);
  const prov = [`${GENIEL.name} 의료·간병 인력서비스`, sidoIdx, "전국", "전국 의료·간병 인력 파견·매칭 (제니엘메디컬)", "", svcIdx, 0, 0, GENIEL.home];
  return (
    <div className="spcard">
      <span className="sptag"><Sparkles size={12} /> 특별제휴업체</span>
      <div className="spname">{GENIEL.name} <span>· {GENIEL.div}</span></div>
      <div className="spsub">{GENIEL.tagline}</div>
      <div className="spgrid">
        {GENIEL.strengths.map(([a, t, d], i) => (
          <div className="spitem" key={i}><span className="si"><Art name={a} size={22} /></span><div><b>{t}</b><p>{d}</p></div></div>
        ))}
      </div>
      <div className="spstats">{GENIEL.stats.map(([v, k], i) => <div key={i}><b>{v}</b><span>{k}</span></div>)}<div><b><Phone size={13} style={{ verticalAlign: "-2px" }} /> {GENIEL.tel}</b><span>대표전화</span></div></div>
      <div className="spbtns">
        <button className="pri" onClick={() => setApply(true)}><MessageSquare size={15} /> 인력·간병 상담 신청</button>
        <a className="ghost" href={GENIEL.home} target="_blank" rel="noreferrer noopener"><Stethoscope size={15} /> 의료 아웃소싱 <ExternalLink size={12} /></a>
        <a className="ghost" href={GENIEL.care} target="_blank" rel="noreferrer noopener"><HeartHandshake size={15} /> 간병 서비스 <ExternalLink size={12} /></a>
        <a className="ghost" href={`tel:${GENIEL.tel.replace(/-/g, "")}`}><Phone size={15} /> {GENIEL.tel}</a>
      </div>
      <div className="spnote">※ ‘의료 아웃소싱’·‘간병 서비스’ 버튼은 제니엘 공식 사이트의 해당 사업 콘텐츠 페이지로 바로 연결됩니다. 제휴 혜택(우선 인력 매칭·간병 연계)은 협의에 따라 적용됩니다.{!EXTERNAL_OK && " 미리보기에선 외부 사이트가 차단되니 링크 우클릭 → ‘새 탭에서 열기’."}</div>
      {apply && <HomecareBookingModal data={data} p={prov} onClose={() => setApply(false)} />}
    </div>
  );
}

function HomecareSection() {
  const { loading, error, data } = useHomecare();
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="homecare" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>재가/돌봄서비스</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{data ? `전국 장기요양 재가기관 ${data.meta.count.toLocaleString()}곳 · ` : ""}방문요양·방문목욕·방문간호·주야간보호·단기보호·복지용구 검색·상담 {data && data.meta.demo && <span style={{ color: "var(--orange)", fontWeight: 700 }}>· 데모 데이터</span>}</div></div></div>
      {loading && <div className="hload"><div className="sp" />재가/돌봄서비스 기관 데이터를 불러오는 중입니다…</div>}
      {error && <div className="hload" style={{ color: "var(--red)" }}><AlertTriangle size={26} style={{ marginBottom: 8 }} /><div>데이터를 불러오지 못했습니다.</div><div style={{ fontSize: 11.5, marginTop: 4, color: "var(--muted)" }}>{error}</div></div>}
      {data && <HomecareDirectory data={data} />}
    </div>
  );
}

function HomecareDirectory({ data }) {
  const [sido, setSido] = useState(PT.sido);
  const [sgg, setSgg] = useState(PT.sigungu);
  const [svc, setSvc] = useState("전체");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(20);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const mapAnchor = useRef(null);
  const reset = () => setShown(20);
  const showOnMap = (p) => { setMapOpen(true); setFocus({ lat: p[7], lng: p[6], name: p[0], addr: p[3], n: Date.now() }); setTimeout(() => mapAnchor.current && mapAnchor.current.scrollIntoView({ behavior: "smooth", block: "start" }), 90); };

  const { sggBySido, countBySido } = React.useMemo(() => {
    const m = {}, c = {};
    for (const p of data.providers) { const s = data.sido[p[1]]; c[s] = (c[s] || 0) + 1; (m[s] || (m[s] = new Set())).add(p[2]); }
    return { sggBySido: m, countBySido: c };
  }, [data]);
  const sidoChips = React.useMemo(() => ["전체", ...[...data.sido].sort((a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b))], [data]);
  const sggOptions = React.useMemo(() => sido === "전체" ? [] : [...(sggBySido[sido] || [])].sort((a, b) => a.localeCompare(b, "ko")), [sido, sggBySido]);

  const list = React.useMemo(() => {
    const sidoIdx = sido === "전체" ? -1 : data.sido.indexOf(sido);
    const svcIdx = svc === "전체" ? -1 : data.svc.indexOf(svc);
    const qq = q.trim();
    return data.providers.filter((p) =>
      (sidoIdx < 0 || p[1] === sidoIdx) &&
      (sgg === "전체" || p[2] === sgg) &&
      (svcIdx < 0 || p[5].indexOf(svcIdx) >= 0) &&
      (!qq || p[0].indexOf(qq) >= 0 || p[3].indexOf(qq) >= 0));
  }, [data, sido, sgg, svc, q]);
  const view = list.slice(0, shown);

  return (
    <>
      <SpecialPartner data={data} />
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="rct"><HeartHandshake size={18} color="#E11D8F" /> 재가급여 6종 안내</div>
        <div className="canc6">{["방문요양", "방문목욕", "방문간호", "주야간보호", "단기보호", "복지용구"].map((s) => { const M = svcMeta(s); return (<div className="cc6" key={s} title={M.d}><span className="ic" style={{ background: M.bg }}><Art name={M.art} size={24} /></span>{s}</div>); })}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 장기요양 <b>등급(1~5등급·인지지원)</b> 판정자는 재가급여를 이용할 수 있으며, 본인부담 15%(감경 대상 6~9%)로 이용합니다. 등급이 없으면 공단에 등급 신청 후 이용 가능합니다.</div>
      </div>
      <div className="benefit">
        <span><Art name="search" size={16} /> 전국 재가기관 {data.meta.count.toLocaleString()}곳</span>
        <span><Art name="pin" size={16} /> 우리 동네 방문요양 찾기</span>
        <span><Art name="visit" size={16} /> 급여종류별 검색</span>
        <span><Art name="chat" size={16} /> 상담 신청</span>
      </div>
      <MapCard anchorRef={mapAnchor} open={mapOpen} onToggle={() => setMapOpen((v) => !v)} focus={focus} title={`재가기관 위치 지도 (${(sido === "전체" ? "전국" : sido) + (sgg !== "전체" ? " " + sgg : "")} ${list.length.toLocaleString()}곳)`} accent="#E11D8F" points={list.map((p) => ({ name: p[0], addr: p[3], tel: p[4], tag: "재가", lat: p[7], lng: p[6] }))} />
      <div className="bklbl" style={{ margin: "0 0 8px" }}><CircleUserRound size={13} style={{ verticalAlign: "-2px" }} /> 회원 거주지 <b style={{ color: "#2563EB" }}>{PT.addr}</b> 기준 · 지역 선택</div>
      <div className="regions">{sidoChips.map((r) => <div key={r} className={`fsel ${sido === r ? "on" : ""}`} onClick={() => { setSido(r); setSgg("전체"); reset(); }}>{r === PT.sido && <Home size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{r}{r !== "전체" && countBySido[r] ? <span style={{ color: "var(--soft)", fontWeight: 600, marginLeft: 4 }}>{countBySido[r].toLocaleString()}</span> : ""}</div>)}</div>
      <div className="bklbl" style={{ margin: "2px 0 8px" }}>급여종류</div>
      <div className="regions">
        <div className={`fsel ${svc === "전체" ? "on" : ""}`} onClick={() => { setSvc("전체"); reset(); }}>전체</div>
        {data.svc.map((s) => { const M = svcMeta(s); return <div key={s} className={`fsel ${svc === s ? "on" : ""}`} onClick={() => { setSvc(s); reset(); }}><span style={{ display: "inline-flex", verticalAlign: "-3px", marginRight: 3 }}><Art name={M.art} size={14} /></span>{s}</div>; })}
      </div>
      <div className="hfilt" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <select value={sgg} onChange={(e) => { setSgg(e.target.value); reset(); }} disabled={sido === "전체"}>
          <option value="전체">{sido === "전체" ? "시·도 먼저 선택" : "시·군·구 전체"}</option>
          {sggOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="fsearch" style={{ margin: 0 }}><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="기관명·주소 검색" /></div>
      </div>
      <div className="chcount">{sido === "전체" ? "전국" : sido}{sgg !== "전체" ? " " + sgg : ""}{svc !== "전체" ? " · " + svc : ""} 재가기관 <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳</div>
      {view.map((p, i) => (
        <div className="center" key={i}>
          <div className="cimg" style={{ background: "linear-gradient(150deg,#FCE7F3,#F3E8FF)" }}><Art name="visit" size={46} /></div>
          <div className="cmain" style={{ cursor: "pointer" }} onClick={() => setDetail(p)} title="기관 상세 보기">
            <div className="cname">{p[0]}<span className="cbadge" style={{ color: "#9D174D", background: "#FCE7F3" }}>재가</span></div>
            <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{data.sido[p[1]]} {p[2]}</span> · <MapPin size={12} />{p[3]}</div>
            <div className="hdept">{p[5].map((si) => { const s = data.svc[si]; const M = svcMeta(s); return <span key={si} style={{ background: M.bg, color: M.col }}>{s}</span>; })}</div>
          </div>
          <div className="cright">
            <div className="obtns"><button onClick={() => setDetail(p)}>상세</button><button className="book" onClick={() => setSel(p)}>상담신청</button></div>
            <button className="book" style={{ background: "#fff", color: "#2563EB", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: 5 }} disabled={!(p[6] && p[7])} onClick={() => showOnMap(p)}><MapPin size={13} /> 지도</button>
          </div>
        </div>
      ))}
      {view.length === 0 && <div className="hload" style={{ marginTop: 8 }}>조건에 맞는 재가기관이 없습니다. 지역·급여종류를 조정해 보세요.</div>}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 20)}>더 보기 ({(list.length - shown).toLocaleString()}곳 더)</button>}
      <div className="chnote">※ <b>현재 표시되는 재가기관은 데모 데이터(시연용)</b>입니다. 실제 전국 데이터는 국민건강보험공단 ‘장기요양기관 현황’(공공데이터포털) 파일 입수 시 동일 화면에 교체 반영됩니다. 본인부담·급여 한도는 등급·소득에 따라 다릅니다.</div>
      {sel && <HomecareBookingModal data={data} p={sel} onClose={() => setSel(null)} />}
      {detail && <HomecareDetailModal data={data} p={detail} onClose={() => setDetail(null)} onApply={(x) => { setDetail(null); setSel(x); }} />}
    </>
  );
}

function HomecareDetailModal({ data, p, onApply, onClose }) {
  const svcs = (p[5] || []).map((si) => data.svc[si]);
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15, lineHeight: 1.3 }}>{p[0]}<span className="cbadge" style={{ color: "#9D174D", background: "#FCE7F3", marginLeft: 8 }}>재가</span></div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dbody">
          <div className="dsec"><div className="dh">기본 정보</div>
            <div className="feat"><MapPin size={15} color="#EF4444" /><div><b style={{ fontSize: 13 }}>{data.sido[p[1]]} {p[2]}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{p[3]}</div></div></div>
            {p[4] ? <div className="feat"><Phone size={15} color="#2563EB" /><a className="hlink" href={`tel:${p[4]}`}>{p[4]}</a></div> : <div className="feat"><Phone size={15} color="#94A3B8" /><span style={{ fontSize: 12.5, color: "var(--muted)" }}>전화정보 없음 (데모)</span></div>}
          </div>
          <div className="dsec"><div className="dh">제공 급여종류 ({svcs.length})</div>
            {svcs.map((s) => { const M = svcMeta(s); return (<div className="feat" key={s}><span className="num" style={{ background: M.bg }}><Art name={M.art} size={20} /></span><div><b style={{ fontSize: 13 }}>{s}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{M.d}</div></div></div>); })}
          </div>
          <div className="dsec"><div className="dh">위치 지도</div>
            {p[6] && p[7] ? <MapView points={[{ name: p[0], addr: p[3], tag: "재가", lat: p[7], lng: p[6] }]} accent="#E11D8F" height={240} />
              : <div style={{ fontSize: 12.5, color: "var(--muted)" }}><MapPin size={13} color="#EF4444" style={{ verticalAlign: "-2px" }} /> {data.sido[p[1]]} {p[2]} · {p[3]} <span style={{ color: "var(--soft)" }}>(좌표 없음)</span></div>}
          </div>
          <div className="dsec"><div className="dh">기관 정보 보기</div>
            {validHomepage(p[8]) && <a className="cbtn pri" style={{ marginTop: 4, textDecoration: "none" }} href={normUrl(p[8])} target="_blank" rel="noreferrer noopener"><MonitorSmartphone size={15} /> 기관 공식 홈페이지 <ExternalLink size={13} /></a>}
            <a className={`cbtn ${validHomepage(p[8]) ? "" : "pri"}`} style={{ marginTop: 8, textDecoration: "none" }} href={naverHref(p[0], `${data.sido[p[1]]} ${p[2]} 재가`)} target="_blank" rel="noreferrer noopener"><Search size={15} /> 네이버에서 기관 정보·후기 보기 <ExternalLink size={13} /></a>
            <a className="cbtn" style={{ marginTop: 8, textDecoration: "none" }} href="https://www.longtermcare.or.kr/" target="_blank" rel="noreferrer noopener"><ShieldCheck size={15} /> 공단 노인장기요양 기관검색(공식) <ExternalLink size={13} /></a>
            <div style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 6 }}>국민건강보험공단 노인장기요양보험(longtermcare.or.kr)에서 정원·인력·평가등급 등 공식 정보를 확인할 수 있습니다.{!EXTERNAL_OK && <b style={{ color: "var(--muted)" }}> 미리보기에선 링크 우클릭 → ‘새 탭에서 열기’.</b>}</div>
          </div>
          <div className="chnote" style={{ marginTop: 4 }}>※ 데모 기관 정보입니다. 실제 운영시간·정원·인력·평가등급은 공단 데이터 연동 시 반영됩니다.</div>
        </div>
        <div className="bkfoot"><button className="cbtn pri" style={{ margin: 0 }} onClick={() => onApply(p)}><MessageSquare size={15} /> 상담 신청하기</button></div>
      </div>
    </div>
  );
}

function HomecareBookingModal({ data, p, onClose }) {
  const svcs = (p[5] || []).map((si) => data.svc[si]);
  const [pick, setPick] = useState(svcs[0] || "방문요양");
  const [done, setDone] = useState(false);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 2); return d; });
  const [date, setDate] = useState(null);
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{done ? "상담 신청 완료" : "재가/돌봄서비스 상담 신청"}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          {!done ? (<>
            <div style={{ background: "#F7F9FC", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{p[0]} <span className="cbadge" style={{ color: "#9D174D", background: "#FCE7F3" }}>재가</span></div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {data.sido[p[1]]} {p[2]} · {p[3]}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>신청자: <b style={{ color: "var(--text)" }}>{PT.name}</b> · {PT.sexAge}</div>
            </div>
            <div className="bklbl">희망 급여종류</div>
            <div className="ctags">{svcs.map((s) => <span key={s} onClick={() => setPick(s)} style={{ cursor: "pointer", background: pick === s ? "#EAF0FE" : undefined, borderColor: pick === s ? "#BFD0FF" : undefined, color: pick === s ? "#2563EB" : undefined, fontWeight: pick === s ? 800 : 600 }}>{s}</span>)}</div>
            <div className="bklbl">상담 희망일</div>
            <div className="cal">{days.map((d, i) => { const k = `${d.getMonth() + 1}/${d.getDate()}`; return (<div key={i} className={`calc ${date === k ? "on" : ""}`} onClick={() => setDate(k)}><div className="d">{d.getDate()}</div><div className="w">{W[d.getDay()]}</div></div>); })}</div>
            <button className="cbtn pri" style={{ opacity: date ? 1 : .5 }} disabled={!date} onClick={() => setDone(true)}><MessageSquare size={15} /> {date ? `${date} 상담 신청` : "상담 희망일을 선택하세요"}</button>
          </>) : (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>상담 신청이 접수되었습니다</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{p[0]}<br />{pick} · {date}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
                <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#E7F8EE" }}><ShieldCheck size={18} color="#16A34A" /></span><div><b style={{ fontSize: 13 }}>장기요양 등급 확인</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>등급 보유 여부를 확인해 본인부담·이용 가능 급여를 안내합니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic"><MessageSquare size={18} color="#7C3AED" /></span><div><b style={{ fontSize: 13 }}>담당자 연결</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>기관 담당자가 연락처로 상담을 진행합니다. (데모)</div></div></div>
              </div>
              <button className="cbtn pri" style={{ marginTop: 16 }} onClick={onClose}>확인</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================== 건강쇼핑 ====================== */
