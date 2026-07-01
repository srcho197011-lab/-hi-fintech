function HospitalSection() {
  const [tab, setTab] = useState("hosp");
  const [preset, setPreset] = useState({ sido: "전체", dept: "전체" });
  const { loading, error, data } = useHira();
  const go = (p) => { setPreset(p); setTab("hosp"); };
  const tabs = [["hosp", "병원·의원 검색", Building2], ["pharm", "약국 찾기", Pill], ["rec", "AI 추천 병원", Sparkles]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="hospital" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>병원/예약</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{data ? `전국 병·의원 ${data.meta.hospitals.toLocaleString()}곳 · 약국 ${data.meta.pharmacies.toLocaleString()}곳` : "전국 병·의원·약국"} · 지역·진료과목 검색 · 실시간 예약 <span style={{ color: "var(--soft)" }}>(심평원 공공데이터 {data ? data.meta.asof : "2026.3"})</span></div></div></div>
      <AiLinkBanner target="hospital" />
      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>
      {loading && <div className="hload"><div className="sp" />전국 병원·약국 데이터를 불러오는 중입니다… <div style={{ fontSize: 11.5, marginTop: 4 }}>(심평원 약 10만 건, 최초 1회 로딩)</div></div>}
      {error && <div className="hload" style={{ color: "var(--red)" }}><AlertTriangle size={26} style={{ marginBottom: 8 }} /><div>병원·약국 데이터를 불러오지 못했습니다.</div><div style={{ fontSize: 11.5, marginTop: 4, color: "var(--muted)" }}>{error} · 로컬 서버(http)로 열렸는지 확인해 주세요.</div></div>}
      {data && tab === "hosp" && <HospitalDirectory data={data} preset={preset} />}
      {data && tab === "pharm" && <PharmacyDirectory data={data} />}
      {data && tab === "rec" && <HospitalRec data={data} onGo={go} />}
    </div>
  );
}

function HospitalDirectory({ data, preset }) {
  const [sido, setSido] = useState(preset.sido);
  const [sgg, setSgg] = useState("전체");
  const [type, setType] = useState("전체");
  const [dept, setDept] = useState(preset.dept);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("관련도순");
  const [shown, setShown] = useState(20);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  useEffect(() => { setSido(preset.sido); setDept(preset.dept); setSgg(preset.sgg || "전체"); setShown(20); }, [preset]);

  const { sggBySido, countBySido } = React.useMemo(() => {
    const m = {}, c = {};
    for (const h of data.hospitals) { const s = data.sido[h[2]]; c[s] = (c[s] || 0) + 1; (m[s] || (m[s] = new Set())).add(h[3]); }
    return { sggBySido: m, countBySido: c };
  }, [data]);
  const sidoChips = React.useMemo(() => ["전체", ...[...data.sido].sort((a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b))], [data]);
  const sggOptions = React.useMemo(() => sido === "전체" ? [] : [...(sggBySido[sido] || [])].sort((a, b) => a.localeCompare(b, "ko")), [sido, sggBySido]);
  const deptOptions = React.useMemo(() => [...data.dept].sort((a, b) => a.localeCompare(b, "ko")), [data]);

  const list = React.useMemo(() => {
    const sidoIdx = sido === "전체" ? -1 : data.sido.indexOf(sido);
    const typeIdx = type === "전체" ? -1 : data.type.indexOf(type);
    const deptIdx = dept === "전체" ? -1 : data.dept.indexOf(dept);
    const qq = q.trim();
    let out = data.hospitals.filter((h) =>
      (sidoIdx < 0 || h[2] === sidoIdx) &&
      (sgg === "전체" || h[3] === sgg) &&
      (typeIdx < 0 || h[1] === typeIdx) &&
      (deptIdx < 0 || h[7].indexOf(deptIdx) >= 0) &&
      (!qq || h[0].indexOf(qq) >= 0 || h[4].indexOf(qq) >= 0));
    if (sort === "이름순") out = [...out].sort((a, b) => a[0].localeCompare(b[0], "ko"));
    else out = [...out].sort((a, b) => tpri(data.type[a[1]]) - tpri(data.type[b[1]]) || a[0].localeCompare(b[0], "ko"));
    return out;
  }, [data, sido, sgg, type, dept, q, sort]);
  const view = list.slice(0, shown);
  const reset = () => setShown(20);

  return (
    <>
      <div className="benefit">
        <span><Art name="search" size={16} /> 전국 병·의원 {data.meta.hospitals.toLocaleString()}곳 검색</span>
        <span><Art name="nurse" size={16} /> 진료과목 {data.dept.length}종 필터</span>
        <span><Art name="calendar" size={16} /> 실시간 예약</span>
        <span><Art name="badge" size={16} /> NFT 예약증 발행</span>
      </div>
      <MapCard title={`병원 위치 지도 (${(sido === "전체" ? "전국" : sido) + (sgg !== "전체" ? " " + sgg : "")} ${list.length.toLocaleString()}곳)`} accent="#2563EB" points={view.length > 0 ? list.map((h) => ({ name: h[0], addr: h[4], tel: h[5], tag: data.type[h[1]], lat: h[9], lng: h[8] })) : []} />
      <div className="bklbl" style={{ margin: "0 0 8px" }}>지역(시·도) 선택</div>
      <div className="regions">{sidoChips.map((r) => <div key={r} className={`fsel ${sido === r ? "on" : ""}`} onClick={() => { setSido(r); setSgg("전체"); reset(); }}>{r}{r !== "전체" && countBySido[r] ? <span style={{ color: "var(--soft)", fontWeight: 600, marginLeft: 4 }}>{countBySido[r].toLocaleString()}</span> : ""}</div>)}</div>
      <div className="hfilt">
        <select value={sgg} onChange={(e) => { setSgg(e.target.value); reset(); }} disabled={sido === "전체"}>
          <option value="전체">{sido === "전체" ? "시·도 먼저 선택" : "시·군·구 전체"}</option>
          {sggOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); reset(); }}>
          <option value="전체">종별 전체</option>
          {[...data.type].sort((a, b) => tpri(a) - tpri(b)).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={dept} onChange={(e) => { setDept(e.target.value); reset(); }}>
          <option value="전체">진료과목 전체</option>
          {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="filterbar">
        <div className="fsearch"><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="병원명·주소 검색" /></div>
        <div className="fsel" onClick={() => setSort(sort === "관련도순" ? "이름순" : "관련도순")}><Filter size={12} style={{ verticalAlign: "-2px" }} /> {sort}</div>
      </div>
      <div className="chcount">{sido === "전체" ? "전국" : sido}{sgg !== "전체" ? " " + sgg : ""}{dept !== "전체" ? " · " + dept : ""}{type !== "전체" ? " · " + type : ""} <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳</div>
      {view.map((h, i) => (
        <div className="center" key={i}>
          <div className="cimg"><Art name="building" size={46} /></div>
          <div className="cmain" style={{ cursor: "pointer" }} onClick={() => setDetail(h)} title="병원 상세 보기">
            <div className="cname">{h[0]}<span className="cbadge" style={{ color: "#0369A1", background: "#E0F2FE" }}>{data.type[h[1]]}</span></div>
            <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{data.sido[h[2]]} {h[3]}</span> · <MapPin size={12} />{h[4]}{h[5] ? <> · <Phone size={12} />{h[5]}</> : null}</div>
            {h[7] && h[7].length > 0 && <div className="hdept">{h[7].slice(0, 7).map((di) => <span key={di}>{data.dept[di]}</span>)}{h[7].length > 7 && <span className="more">+{h[7].length - 7}</span>}</div>}
          </div>
          <div className="cright">
            {h[5] ? <a className="hlink" href={`tel:${h[5]}`}><Phone size={13} /> {h[5]}</a> : <span style={{ fontSize: 11.5, color: "var(--soft)" }}>전화정보 없음</span>}
            <div className="obtns"><button onClick={() => setDetail(h)}>상세</button><button className="book" onClick={() => setSel(h)}>예약</button></div>
          </div>
        </div>
      ))}
      {view.length === 0 && <div className="hload" style={{ marginTop: 8 }}>조건에 맞는 병원이 없습니다. 필터를 조정해 보세요.</div>}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 20)}>더 보기 ({(list.length - shown).toLocaleString()}곳 더)</button>}
      <div className="chnote">※ 병원 목록·주소·전화·진료과목은 건강보험심사평가원 ‘전국 병의원 및 약국 현황({data.meta.asof})’ 공공데이터(공공누리 제1유형)를 기반으로 합니다. 실시간 예약 가능시간·세부 진료정보는 제휴 병원 API 연동 시 반영됩니다. 의료기관 정보 제공은 이용자의 합리적 선택을 돕기 위한 것으로 의료법(의료광고 심의·환자 유인·알선 금지)을 준수합니다.</div>
      {sel && <HospitalBookingModal data={data} h={sel} onClose={() => setSel(null)} />}
      {detail && <HospitalDetailModal data={data} h={detail} onClose={() => setDetail(null)} onBook={(x) => { setDetail(null); setSel(x); }} />}
    </>
  );
}

function PharmacyDirectory({ data }) {
  const [sido, setSido] = useState("전체");
  const [sgg, setSgg] = useState("전체");
  const [q, setQ] = useState("");
  const [night, setNight] = useState(false);
  const [holiday, setHoliday] = useState(false);
  const [shown, setShown] = useState(20);
  const [mapOpen, setMapOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const mapAnchor = useRef(null);
  const showOnMap = (p) => { setMapOpen(true); setFocus({ lat: p[6], lng: p[5], name: p[0], addr: p[3], n: Date.now() }); setTimeout(() => mapAnchor.current && mapAnchor.current.scrollIntoView({ behavior: "smooth", block: "start" }), 90); };
  const { sggBySido, countBySido } = React.useMemo(() => {
    const m = {}, c = {};
    for (const p of data.pharmacies) { const s = data.sido[p[1]]; c[s] = (c[s] || 0) + 1; (m[s] || (m[s] = new Set())).add(p[2]); }
    return { sggBySido: m, countBySido: c };
  }, [data]);
  const sidoChips = React.useMemo(() => ["전체", ...[...data.sido].sort((a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b))], [data]);
  const sggOptions = React.useMemo(() => sido === "전체" ? [] : [...(sggBySido[sido] || [])].sort((a, b) => a.localeCompare(b, "ko")), [sido, sggBySido]);
  const list = React.useMemo(() => {
    const sidoIdx = sido === "전체" ? -1 : data.sido.indexOf(sido);
    const qq = q.trim();
    return data.pharmacies.filter((p) => {
      if (!((sidoIdx < 0 || p[1] === sidoIdx) && (sgg === "전체" || p[2] === sgg) && (!qq || p[0].indexOf(qq) >= 0 || p[3].indexOf(qq) >= 0))) return false;
      if (night || holiday) { const o = pharmOps(p[0], p[2]); if (night && !o.night) return false; if (holiday && !o.holiday) return false; }
      return true;
    });
  }, [data, sido, sgg, q, night, holiday]);
  const view = list.slice(0, shown);
  const reset = () => setShown(20);
  return (
    <>
      <div className="benefit">
        <span><Art name="pill" size={16} /> 전국 약국 {data.meta.pharmacies.toLocaleString()}곳</span>
        <span><Art name="pin" size={16} /> 내 주변 약국 찾기</span>
        <span><Art name="moon" size={16} /> 야간·심야약국</span>
        <span><Art name="phone" size={16} /> 전화·길찾기</span>
      </div>
      <MapCard anchorRef={mapAnchor} open={mapOpen} onToggle={() => setMapOpen((v) => !v)} focus={focus} title={`약국 위치 지도 (${(sido === "전체" ? "전국" : sido) + (sgg !== "전체" ? " " + sgg : "")} ${list.length.toLocaleString()}곳)`} accent="#16A34A" points={list.map((p) => ({ name: p[0], addr: p[3], tel: p[4], tag: "약국", lat: p[6], lng: p[5] }))} />
      <div className="bklbl" style={{ margin: "0 0 8px" }}>지역(시·도) 선택</div>
      <div className="regions">{sidoChips.map((r) => <div key={r} className={`fsel ${sido === r ? "on" : ""}`} onClick={() => { setSido(r); setSgg("전체"); reset(); }}>{r}{r !== "전체" && countBySido[r] ? <span style={{ color: "var(--soft)", fontWeight: 600, marginLeft: 4 }}>{countBySido[r].toLocaleString()}</span> : ""}</div>)}</div>
      <div className="regions" style={{ marginBottom: 6 }}>
        <div className={`fsel ${night ? "on" : ""}`} onClick={() => { setNight((v) => !v); reset(); }}><Moon size={12} style={{ verticalAlign: "-2px" }} /> 야간·심야 운영</div>
        <div className={`fsel ${holiday ? "on" : ""}`} onClick={() => { setHoliday((v) => !v); reset(); }}><Sparkles size={12} style={{ verticalAlign: "-2px" }} /> 공휴일 운영</div>
      </div>
      <div className="hfilt" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <select value={sgg} onChange={(e) => { setSgg(e.target.value); reset(); }} disabled={sido === "전체"}>
          <option value="전체">{sido === "전체" ? "시·도 먼저 선택" : "시·군·구 전체"}</option>
          {sggOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="fsearch" style={{ margin: 0 }}><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="약국명·주소 검색" /></div>
      </div>
      <div className="chcount">{sido === "전체" ? "전국" : sido}{sgg !== "전체" ? " " + sgg : ""} 약국 <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳</div>
      {view.map((p, i) => {
        const o = pharmOps(p[0], p[2]);
        return (
        <div className="center" key={i}>
          <div className="cimg" style={{ background: "linear-gradient(150deg,#DCFCE7,#D1FAE5)" }}><Art name="pill" size={46} /></div>
          <div className="cmain">
            <div className="cname">{p[0]}<span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE" }}>약국</span>{o.night && <span className="cbadge" style={{ color: "#4338CA", background: "#E8EAFE" }}><Moon size={10} /> 야간</span>}{o.holiday && <span className="cbadge" style={{ color: "#B45309", background: "#FEF3E2" }}>공휴일</span>}</div>
            <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{data.sido[p[1]]} {p[2]}</span> · <MapPin size={12} />{p[3]}{p[4] ? <> · <Phone size={12} />{p[4]}</> : null}</div>
            <div className="cmeta" style={{ marginTop: 3 }}><Clock size={12} /> 평일 {o.weekday} · {o.sat} <span style={{ color: "var(--soft)" }}>(예시·추정)</span></div>
          </div>
          <div className="cright">
            {p[4] ? <a className="hlink" href={`tel:${p[4]}`}><Phone size={13} /> {p[4]}</a> : <span style={{ fontSize: 11.5, color: "var(--soft)" }}>전화정보 없음</span>}
            <div className="obtns"><button className="book" style={{ display: "inline-flex", alignItems: "center", gap: 5 }} disabled={!(p[5] && p[6])} onClick={() => showOnMap(p)}><MapPin size={13} /> 지도에서 보기</button></div>
          </div>
        </div>
        );
      })}
      {view.length === 0 && <div className="hload" style={{ marginTop: 8 }}>조건에 맞는 약국이 없습니다.</div>}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 20)}>더 보기 ({(list.length - shown).toLocaleString()}곳 더)</button>}
      <div className="chnote">※ 약국 목록·주소·전화·좌표는 건강보험심사평가원 ‘전국 병의원 및 약국 현황({data.meta.asof})’ 공공데이터(공공누리 제1유형) 기반입니다. <b>영업시간·야간·공휴일 운영 표시는 예시(추정)</b>이며 실제와 다를 수 있습니다 — 실시간 운영정보는 약국 API(e약은요·심야약국 등) 연동 시 반영됩니다.</div>
    </>
  );
}

// 제휴 병원: 전국 주요 대형병원 브랜드 키워드로 식별. 실제 제휴 DB 연동 시 대체.
const PARTNER_KEYS = ["서울아산", "삼성서울", "세브란스", "서울대학교병원", "서울성모", "은평성모", "여의도성모", "분당서울대", "보라매병원", "아주대", "가천대", "길병원", "인하대", "고려대", "한양대", "경희대", "중앙대학교병원", "이대목동", "이대서울", "순천향", "건국대", "강북삼성", "삼성창원", "부산대학교병원", "양산부산대", "동아대", "인제대", "백병원", "경북대학교병원", "칠곡경북대", "영남대", "계명대", "대구가톨릭", "충남대학교병원", "건양대", "을지대", "전남대학교병원", "화순전남대", "조선대", "전북대학교병원", "원광대", "충북대학교병원", "강원대학교병원", "한림대", "제주대학교병원", "국립암센터", "분당차", "차의과학", "원주세브란스", "단국대", "동국대"];
const isPartner = (name) => PARTNER_KEYS.some((k) => name.indexOf(k) >= 0);

function HospRow({ data, m, recoSet, onDetail, onBook }) {
  const h = m.h;
  return (
    <div className="center">
      <div className="cimg"><Art name="building" size={46} /></div>
      <div className="cmain" style={{ cursor: "pointer" }} onClick={() => onDetail(h)} title="병원 상세 보기">
        <div className="cname">{h[0]}
          <span className="cbadge" style={{ color: "#0369A1", background: "#E0F2FE" }}>{data.type[h[1]]}</span>
          {m.partner && <span className="cbadge" style={{ color: "#fff", background: "linear-gradient(90deg,#2F5BEA,#7C3AED)" }}><BadgeCheck size={10} /> 제휴</span>}
          {m.score >= 2 && <span className="cbadge" style={{ color: "#7C3AED", background: "#F1ECFE" }}><Sparkles size={10} /> 맞춤 {m.score}과</span>}
        </div>
        <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{data.sido[h[2]]} {h[3]}</span> · <MapPin size={12} />{h[4]}{h[5] ? <> · <Phone size={12} />{h[5]}</> : null}</div>
        <div className="hdept">{h[7].slice(0, 8).map((di) => <span key={di} className={recoSet.has(di) ? "more" : ""}>{data.dept[di]}</span>)}{h[7].length > 8 && <span>+{h[7].length - 8}</span>}</div>
      </div>
      <div className="cright">
        {m.partner ? <span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE" }}><ShieldCheck size={10} /> 검진보험 자동가입</span> : (h[5] ? <a className="hlink" href={`tel:${h[5]}`}><Phone size={13} /> {h[5]}</a> : <span style={{ fontSize: 11.5, color: "var(--soft)" }}>전화정보 없음</span>)}
        <div className="obtns"><button onClick={() => onDetail(h)}>상세</button><button className="book" onClick={() => onBook(h)}>예약</button></div>
      </div>
    </div>
  );
}

function HospitalRec({ data, onGo }) {
  const [region, setRegion] = useState(PT.sido);
  const [detail, setDetail] = useState(null);
  const [sel, setSel] = useState(null);
  const atHome = region === PT.sido;

  const RECO = [
    { dept: "내과", ic: Stethoscope, col: "#7C3AED", bg: "#F1ECFE", why: "췌장암 경고 · 간 54.4세 · 당뇨 위험 ↑ — 복부초음파·위/대장 내시경·혈당 관리" },
    { dept: "영상의학과", ic: Activity, col: "#2563EB", bg: "#E8F1FE", why: "췌장·간 정밀영상 — 복부 초음파·CT 추적관찰" },
    { dept: "가정의학과", ic: HeartPulse, col: "#F59E0B", bg: "#FEF3E2", why: "만성질환·생활습관 통합관리 — 금연·절주·체중·대사" },
  ];
  const recoIdx = React.useMemo(() => RECO.map((r) => data.dept.indexOf(r.dept)).filter((i) => i >= 0), [data]);
  const recoSet = React.useMemo(() => new Set(recoIdx), [recoIdx]);

  const { partners, byGu, regionCount, distribution } = React.useMemo(() => {
    const sidoIdx = data.sido.indexOf(region);
    const matched = [];
    const dist = {};
    for (const h of data.hospitals) {
      let score = 0; for (const di of recoIdx) if (h[7].indexOf(di) >= 0) score++;
      if (score === 0) continue;
      dist[data.sido[h[2]]] = (dist[data.sido[h[2]]] || 0) + 1;
      if (h[2] !== sidoIdx) continue;
      matched.push({ h, score, partner: isPartner(h[0]) });
    }
    matched.sort((a, b) => (b.partner - a.partner) || (b.score - a.score) || (tpri(data.type[a.h[1]]) - tpri(data.type[b.h[1]])) || a.h[0].localeCompare(b.h[0], "ko"));
    const partners = matched.filter((m) => m.partner);
    const general = matched.filter((m) => !m.partner);
    const guMap = {};
    for (const m of general) (guMap[m.h[3]] || (guMap[m.h[3]] = [])).push(m);
    let byGu = Object.keys(guMap).map((gu) => ({ gu, items: guMap[gu], home: region === PT.sido && gu === PT.sigungu })).sort((a, b) => b.items.length - a.items.length);
    // 회원 거주 동네(은평구)를 맨 앞으로
    if (region === PT.sido) {
      const hi = byGu.findIndex((g) => g.home);
      if (hi > 0) { const home = byGu.splice(hi, 1)[0]; byGu.unshift(home); }
    }
    return { partners, byGu, regionCount: matched.length, distribution: dist };
  }, [data, region, recoIdx]);

  const sidoChips = React.useMemo(() => [...data.sido].sort((a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b)), [data]);
  const onBook = (h) => setSel(h);
  const onDetail = (h) => setDetail(h);

  return (<>
    <div className="airec">
      <div className="at"><Sparkles size={16} color="#7C3AED" /> 조성래님 맞춤 병원 추천</div>
      <div className="ap">프롬에이지 Premium 리포트(생체나이 52.5세 · <b>췌장암 경고</b> · 간 54.4세 · 당뇨 위험 ↑)를 분석해, 진료가 필요한 과목을 모두 갖춘 병원을 거주 지역에서 찾아드려요.</div>
    </div>
    <div className="card">
      <div className="rct"><Stethoscope size={18} color="#7C3AED" /> 건강상태 기반 권장 진료과</div>
      {RECO.map((r, i) => (
        <div className="adv" key={i}><span className="ic" style={{ background: r.bg }}><r.ic size={18} color={r.col} /></span>
          <div style={{ flex: 1 }}><b>{r.dept}</b><p>{r.why}</p></div>
          <button onClick={() => onGo({ sido: region, dept: r.dept })} style={{ alignSelf: "center", border: "1px solid var(--border)", background: "#fff", color: "var(--blue)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{r.dept} ›</button></div>
      ))}
      <div className="chnote" style={{ marginTop: 4 }}>※ 권장 진료과는 조성래님 리포트의 장기 생체나이·질병위험·암 등급을 바탕으로 자동 산출됩니다. 아래 병원은 위 진료과를 <b>실제로 운영하는</b> 심평원 등록 병원입니다.</div>
    </div>

    <div className="bklbl" style={{ margin: "2px 0 8px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <span><CircleUserRound size={13} style={{ verticalAlign: "-2px" }} /> 회원정보 거주지 <b style={{ color: "#2563EB" }}>{PT.addr}</b></span>
      {!atHome && <button className="fsel" style={{ padding: "3px 9px" }} onClick={() => setRegion(PT.sido)}>내 거주지로</button>}
      <span style={{ marginLeft: "auto", color: "var(--muted)" }}>맞춤 병원 <b style={{ color: "var(--blue)" }}>{regionCount.toLocaleString()}</b>곳</span>
    </div>
    <div className="regions">{sidoChips.map((r) => <div key={r} className={`fsel ${region === r ? "on" : ""}`} onClick={() => setRegion(r)}>{r === PT.sido && <Home size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{r}{distribution[r] ? <span style={{ color: "var(--soft)", fontWeight: 600, marginLeft: 4 }}>{distribution[r].toLocaleString()}</span> : ""}</div>)}</div>

    {partners.length > 0 && (
      <div className="card" style={{ border: "1.5px solid #BFD0FF", background: "linear-gradient(180deg,#F7F9FF,#fff)" }}>
        <div className="rct"><BadgeCheck size={18} color="#2F5BEA" /> 제휴 병원 <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>· {region} {partners.length}곳</span></div>
        <div className="benefit" style={{ marginTop: 0, marginBottom: 12 }}><span><Art name="badge" size={16} /> 무료 검진보험 자동가입</span><span><Art name="calendar" size={16} /> 우선 예약</span><span><Art name="badge" size={16} /> NFT 예약증</span><span><Art name="doc" size={16} /> 검진·진료 통합관리</span></div>
        {partners.slice(0, 10).map((m, i) => <HospRow key={i} data={data} m={m} recoSet={recoSet} onDetail={onDetail} onBook={onBook} />)}
      </div>
    )}

    <div className="bklbl" style={{ margin: "2px 0 8px" }}><MapPin size={14} color="#2F5BEA" style={{ verticalAlign: "-2px" }} /> {region} 지역별 추천 병원 {atHome && <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 내 동네({PT.sigungu}) 우선</span>}</div>
    {byGu.length === 0 && partners.length === 0 && <div className="hload">{region}에서 조건에 맞는 병원을 찾지 못했습니다. 다른 지역을 선택해 보세요.</div>}
    {byGu.slice(0, 6).map(({ gu, items, home }) => (
      <div className="card" key={gu} style={home ? { paddingBottom: 10, border: "1.5px solid #BFD0FF", background: "linear-gradient(180deg,#F7F9FF,#fff)" } : { paddingBottom: 10 }}>
        <div className="rct" style={{ marginBottom: 8 }}><MapPin size={16} color={home ? "#2F5BEA" : "#2563EB"} /> {gu} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>· {items.length}곳</span>{home && <span className="cbadge" style={{ color: "#fff", background: "linear-gradient(90deg,#2F5BEA,#7C3AED)" }}><Home size={10} /> 내 동네</span>}</div>
        {items.slice(0, 3).map((m, i) => <HospRow key={i} data={data} m={m} recoSet={recoSet} onDetail={onDetail} onBook={onBook} />)}
        {items.length > 3 && <button className="cbtn" style={{ marginTop: 4 }} onClick={() => onGo({ sido: region, sgg: gu, dept: "내과" })}>{gu} 추천 병원 더 보기 ({items.length - 3}곳 더) ›</button>}
      </div>
    ))}
    <div className="chnote">※ <b>제휴 병원 표시는 예시</b>(주요 대형병원 기준)이며, 실제 제휴 여부·우대 혜택은 제휴 병원 DB 연동 시 반영됩니다. 병원 목록·진료과목은 심평원 공공데이터({data.meta.asof}) 기반입니다.</div>
    {sel && <HospitalBookingModal data={data} h={sel} onClose={() => setSel(null)} />}
    {detail && <HospitalDetailModal data={data} h={detail} onClose={() => setDetail(null)} onBook={(x) => { setDetail(null); setSel(x); }} />}
  </>);
}

function HospitalDetailModal({ data, h, onClose, onBook }) {
  const depts = (h[7] || []).map((di) => data.dept[di]);
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15, lineHeight: 1.3 }}>{h[0]}<span className="cbadge" style={{ color: "#0369A1", background: "#E0F2FE", marginLeft: 8 }}>{data.type[h[1]]}</span></div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dbody">
          <div className="dsec"><div className="dh">기본 정보</div>
            <div className="feat"><MapPin size={15} color="#EF4444" /><div><b style={{ fontSize: 13 }}>{data.sido[h[2]]} {h[3]}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{h[4]}</div></div></div>
            {h[5] && <div className="feat"><Phone size={15} color="#2563EB" /><a className="hlink" href={`tel:${h[5]}`}>{h[5]}</a></div>}
            {validHomepage(h[6]) && <div className="feat"><MonitorSmartphone size={15} color="#7C3AED" /><a className="hlink" href={normUrl(h[6])} target="_blank" rel="noreferrer noopener">{h[6]} <ExternalLink size={11} /></a></div>}
          </div>
          <div className="dsec"><div className="dh">병원 정보 보기</div>
            {validHomepage(h[6]) ? <>
              <a className="cbtn pri" style={{ marginTop: 4, textDecoration: "none" }} href={normUrl(h[6])} target="_blank" rel="noreferrer noopener"><MonitorSmartphone size={15} /> 병원 공식 홈페이지 <ExternalLink size={13} /></a>
              <a className="cbtn" style={{ marginTop: 8, textDecoration: "none" }} href={naverHref(h[0], `${data.sido[h[2]]} ${h[3]}`)} target="_blank" rel="noreferrer noopener"><Search size={15} /> 네이버에서 검색</a>
            </> : <>
              <a className="cbtn pri" style={{ marginTop: 4, textDecoration: "none" }} href={naverHref(h[0], `${data.sido[h[2]]} ${h[3]}`)} target="_blank" rel="noreferrer noopener"><Search size={15} /> 네이버에서 병원 정보·후기 보기 <ExternalLink size={13} /></a>
              <div style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 6 }}>이 병원은 심평원에 등록된 공식 홈페이지가 없어, 네이버 검색(플레이스·진료시간·후기)으로 연결합니다.</div>
            </>}
            {!EXTERNAL_OK && <div style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 6 }}><b style={{ color: "var(--muted)" }}>미리보기 화면에서는 외부 사이트가 차단됩니다 — 링크를 우클릭 → ‘새 탭에서 열기’로 확인하세요.</b></div>}
          </div>
          <div className="dsec"><div className="dh">진료과목 {depts.length > 0 ? `(${depts.length})` : ""}</div>
            {depts.length > 0 ? <div className="hdept">{depts.map((d) => <span key={d}>{d}</span>)}</div> : <div style={{ fontSize: 12.5, color: "var(--muted)" }}>등록된 진료과목 정보가 없습니다.</div>}
          </div>
          <div className="dsec"><div className="dh">위치 지도</div>
            {h[8] && h[9] ? <MapView points={[{ name: h[0], addr: h[4], tel: h[5], tag: data.type[h[1]], lat: h[9], lng: h[8] }]} accent="#2563EB" height={240} />
              : <div style={{ fontSize: 12.5, color: "var(--muted)" }}><MapPin size={13} color="#EF4444" style={{ verticalAlign: "-2px" }} /> {data.sido[h[2]]} {h[3]} · {h[4]} <span style={{ color: "var(--soft)" }}>(좌표 정보 없음)</span></div>}
          </div>
          <div className="chnote" style={{ marginTop: 4 }}>※ 본 정보는 심평원 공공데이터({data.meta.asof}) 기반이며, 실시간 진료시간·예약가능 슬롯은 제휴 병원 API 연동 시 반영됩니다.</div>
        </div>
        <div className="bkfoot"><button className="cbtn pri" style={{ margin: 0 }} onClick={() => onBook(h)}><CalendarCheck size={15} /> 예약하기</button></div>
      </div>
    </div>
  );
}

function HospitalBookingModal({ data, h, onClose }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [done, setDone] = useState(false);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 2); return d; });
  const slots = ["09:00", "09:30", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  const depts = (h[7] || []).slice(0, 8).map((di) => data.dept[di]);
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{done ? "예약 완료" : "병원 예약"}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          {!done ? (<>
            <div style={{ background: "#F7F9FC", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{h[0]} <span className="cbadge" style={{ color: "#0369A1", background: "#E0F2FE" }}>{data.type[h[1]]}</span></div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {data.sido[h[2]]} {h[3]} · {h[4]}</div>
              {h[5] && <div style={{ fontSize: 12, color: "var(--blue)", marginTop: 4, fontWeight: 700 }}><Phone size={11} style={{ verticalAlign: "-1px" }} /> {h[5]}</div>}
            </div>
            <div className="bklbl">날짜 선택</div>
            <div className="cal">{days.map((d, i) => { const k = `${d.getMonth() + 1}/${d.getDate()}`; return (<div key={i} className={`calc ${date === k ? "on" : ""}`} onClick={() => setDate(k)}><div className="d">{d.getDate()}</div><div className="w">{W[d.getDay()]}</div></div>); })}</div>
            <div className="bklbl">시간 선택</div>
            <div className="slots">{slots.map((s) => <div key={s} className={`slot ${time === s ? "on" : ""}`} onClick={() => setTime(s)}>{s}</div>)}</div>
            {depts.length > 0 && <><div className="bklbl">진료과목</div><div className="ctags">{depts.map((t) => <span key={t}>{t}</span>)}</div></>}
            <button className="cbtn pri" style={{ opacity: date && time ? 1 : .5 }} disabled={!date || !time} onClick={() => setDone(true)}><CalendarCheck size={15} /> {date && time ? `${date} ${time} 예약 확정` : "날짜·시간을 선택하세요"}</button>
          </>) : (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>예약이 확정되었습니다</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{h[0]}<br />{date} {time}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
                <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#E7F8EE" }}><ShieldCheck size={18} color="#16A34A" /></span><div><b style={{ fontSize: 13 }}>건강지갑에 예약 기록</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>진료·검사 이력이 조성래님 건강지갑에 자동 기록됩니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic"><BadgeCheck size={18} color="#7C3AED" /></span><div><b style={{ fontSize: 13 }}>NFT 예약증 발행</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>지갑에 SBT 예약증이 발행되고 알림톡이 발송됩니다.</div></div></div>
              </div>
              <button className="cbtn pri" style={{ marginTop: 16 }} onClick={onClose}>확인</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================== 재가/돌봄서비스 (노인장기요양 재가급여) ====================== */
let _homecarePromise = null;
