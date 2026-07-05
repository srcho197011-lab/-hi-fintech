/* ====================== 온톨로지 운영시스템 (팔란티어 Foundry 스타일) ======================
   1,000명 파일럿 코호트(pilotCohort)를 객체(Object)·관계(Link)·액션(Action) 온톨로지로 운영.
   개요(코호트 집계) · 객체 탐색기 · 온톨로지 관계 · 액션(세그먼트→보험/나눔/케어). */

const ontWon = (n) => n >= 100000000 ? (n / 100000000).toFixed(2) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : Math.round(n).toLocaleString() + "원";
const ONT_DEPT_COLORS = ["#22D3EE", "#6366F1", "#F472B6", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#38BDF8", "#4ADE80", "#FB923C", "#2DD4BF", "#E879F9", "#60A5FA", "#FACC15", "#F43F5E", "#818CF8", "#10B981"];

function OntBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="ontbar">
      <div className="ontbar-l"><span className="ontbar-lbl">{label}</span><span className="ontbar-val">{value.toLocaleString()}{sub || ""}</span></div>
      <div className="ontbar-track"><i style={{ width: Math.max(2, pct) + "%", background: color || "#22D3EE" }} /></div>
    </div>
  );
}

/* ── 온톨로지 스키마(객체·관계) 다이어그램 ── */
function OntGraph({ agg }) {
  // 허브-스포크 배치: 회원(중심) 둘레에 6각형으로 헬스 객체, 하단에 소비→매출→성장 루프(재무·마케팅)
  const nodes = [
    { id: "member", t: "회원", n: agg.n, x: 260, y: 195, c: "#22D3EE" },
    { id: "disease", t: "질병", n: Object.keys(agg.byDisease).length, x: 260, y: 55, c: "#F472B6" },
    { id: "checkup", t: "건강검진", n: 13, x: 395, y: 128, c: "#34D399" },
    { id: "coverage", t: "보험담보", n: 0, x: 125, y: 128, c: "#A78BFA" },
    { id: "region", t: "지역", n: 17, x: 395, y: 262, c: "#38BDF8" },
    { id: "dept", t: "진료과목", n: Object.keys(agg.byDept).length, x: 125, y: 262, c: "#6366F1" },
    { id: "cost", t: "예상의료비", n: 0, x: 260, y: 335, c: "#FBBF24" },
    { id: "finance", t: "재무회계", n: 0, x: 165, y: 425, c: "#F59E0B" },
    { id: "marketing", t: "마케팅", n: 0, x: 355, y: 425, c: "#EC4899" },
  ];
  const N = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const links = [
    ["member", "disease", "진단"], ["member", "checkup", "수검"], ["member", "dept", "진료"], ["member", "region", "거주"], ["member", "cost", "예상"],
    ["disease", "checkup", "지표"], ["disease", "coverage", "보장"],
    ["cost", "finance", "매출"], ["finance", "marketing", "분석"], ["marketing", "member", "타겟"],
  ];
  const loop = new Set(["매출", "분석", "타겟"]);
  return (
    <div className="ontgraph">
      <svg viewBox="0 0 520 480" style={{ width: "100%", height: "auto", display: "block" }}>
        {links.map(([a, b, lbl], i) => { const A = N[a], B = N[b], big = loop.has(lbl); return (<g key={i}><line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={big ? "#3E4E6E" : "#2B3B57"} strokeWidth={big ? "1.8" : "1.4"} strokeDasharray={big ? "5 4" : "none"} /><text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} fill={big ? "#9AA9C6" : "#7C8BA8"} fontSize="9.5" fontWeight={big ? "700" : "400"} textAnchor="middle">{lbl}</text></g>); })}
        {nodes.map((nd) => (<g key={nd.id}>
          <circle cx={nd.x} cy={nd.y} r="28" fill="#0F1B33" stroke={nd.c} strokeWidth="2" />
          <text x={nd.x} y={nd.n > 0 ? nd.y - 3 : nd.y + 4} fill="#EAF2FF" fontSize="10.5" fontWeight="800" textAnchor="middle">{nd.t}</text>
          {nd.n > 0 && <text x={nd.x} y={nd.y + 11} fill={nd.c} fontSize="9" fontWeight="700" textAnchor="middle">{nd.n.toLocaleString()}</text>}
        </g>))}
      </svg>
      <div className="ontgraph-note">Object Types <b>9</b> · Links <b>10</b> · Objects <b>{agg.n.toLocaleString()}+</b> — 회원을 중심으로 진료과목·질병·검진·의료비·보험담보·지역이 연결되고, <b style={{ color: "#F59E0B" }}>예상의료비→재무회계</b>(매출) <b style={{ color: "#EC4899" }}>→마케팅→회원</b>(타겟)의 <b>소비→매출→성장 루프</b>로 순환합니다.</div>
    </div>
  );
}

/* ── 코호트 개요 ── */
const KCD_LABELS = { A: "감염성·기생충 (A·B)", C: "신생물(암) (C·D48)", D: "혈액·조혈 (D)", E: "내분비·대사 (E)", F: "정신·행동 (F)", G: "신경계 (G)", H: "눈·귀 (H)", I: "순환기 (I)", J: "호흡기 (J)", K: "소화기 (K)", L: "피부 (L)", M: "근골격 (M)", N: "비뇨생식 (N)", O: "임신·출산 (O)", P: "주산기 (P)", Q: "선천기형 (Q)", R: "증상·징후 (R)", S: "손상·중독 (S)", Z: "건강상태 (Z)", 기타: "기타" };
const KCD_ORDER = ["A", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "Z", "기타"];
function OntOverview({ agg, onSeg }) {
  const audit = typeof pilotAudit === "function" ? pilotAudit() : null;
  const kcd = KCD_ORDER.filter((k) => agg.byKcd && agg.byKcd[k]).map((k) => [k, agg.byKcd[k]]);
  const kcdMax = kcd.length ? Math.max(...kcd.map((x) => x[1])) : 1;
  const deptTop = Object.entries(agg.byDept).sort((a, b) => b[1] - a[1]);
  const dzTop = Object.entries(agg.byDisease).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const markTop = Object.entries(agg.markAbn).sort((a, b) => b[1] - a[1]);
  const deptMax = deptTop[0] ? deptTop[0][1] : 1, dzMax = dzTop[0] ? dzTop[0][1] : 1, markMax = markTop[0] ? markTop[0][1] : 1;
  const ageMax = Math.max(...Object.values(agg.ageBands));
  const riskTot = agg.n;
  const male = Object.entries(agg.bySidoSex).filter(([k]) => k.endsWith("남")).reduce((s, [, v]) => s + v, 0);
  return (<>
    <div className="ontkpis">
      {[["총 회원(객체)", agg.n.toLocaleString() + "명", "#22D3EE"], ["유병 회원", agg.dzMembers.toLocaleString() + "명", "#F472B6"], ["평균 예상의료비", ontWon(agg.avgCost), "#FBBF24"], ["총 예상의료비", ontWon(agg.totalCost), "#F87171"], ["치료비 사각지대", agg.needyN.toLocaleString() + "명", "#E11D48"], ["보장 공백 회원", agg.gapN.toLocaleString() + "명", "#A78BFA"]].map(([k, v, c], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>
      ))}
    </div>

    {audit && (
      <div className={`ontaudit ${audit.ok ? "ok" : "bad"}`}>
        <div className="ontaudit-l"><span className="ontaudit-ic">{audit.ok ? <Check size={18} /> : <AlertTriangle size={18} />}</span>
          <div><b>데이터 정합성 검증 {audit.ok ? "통과" : "위반 발견"}</b><span>{audit.n.toLocaleString()}명 · {audit.households.toLocaleString()}가구 · 아동(0~19) {agg.childN.toLocaleString()}명 · 성별/연령/가족 규칙 자동 스캔</span></div></div>
        <div className="ontaudit-checks">
          <div className={audit.sex ? "v" : "p"}>{audit.sex ? <X size={12} /> : <Check size={12} />} 성별 정합 <em>{audit.sex ? audit.sex + "건" : "0"}</em></div>
          <div className={audit.age ? "v" : "p"}>{audit.age ? <X size={12} /> : <Check size={12} />} 연령 정합 <em>{audit.age ? audit.age + "건" : "0"}</em></div>
          <div className={audit.fam ? "v" : "p"}>{audit.fam ? <X size={12} /> : <Check size={12} />} 가족 정합 <em>{audit.fam ? audit.fam + "건" : "0"}</em></div>
        </div>
      </div>
    )}
    <div className="ontfamstat">
      {[["가구 수", agg.households.toLocaleString(), "#F59E0B"], ["평균 가구원", agg.avgHouseholdSize + "명", "#22D3EE"], ["가구주", (agg.byRel["가구주"] || 0).toLocaleString(), "#6366F1"], ["배우자", (agg.byRel["배우자"] || 0).toLocaleString(), "#F472B6"], ["자녀", (agg.byRel["자녀"] || 0).toLocaleString(), "#34D399"], ["부모", ((agg.byRel["부"] || 0) + (agg.byRel["모"] || 0)).toLocaleString(), "#A78BFA"]].map(([k, v, c], i) => (
        <div className="ontfamcell" key={i}><b style={{ color: c }}>{v}</b><span>{k}</span></div>
      ))}
    </div>

    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Banknote size={15} color="#F59E0B" /> 예상 연간 의료비 구성 <span>· 총 {ontWon(agg.totalCost)}</span></div>
      {(() => { const tot = (agg.sumCovered + agg.sumUncovered + agg.sumWellness) || 1; const seg = [["급여 본인부담", agg.sumCovered, "#22D3EE"], ["비급여", agg.sumUncovered, "#F472B6"], ["기타 건강관리", agg.sumWellness, "#34D399"]]; return (<>
        <div className="ontcostbar big">{seg.map(([t, v, c]) => <i key={t} style={{ width: (v / tot * 100) + "%", background: c }} title={t + " " + ontWon(v)} />)}</div>
        <div className="ontcostgrid">{seg.map(([t, v, c]) => <div className="ontcostcell" key={t}><span className="dot" style={{ background: c }} /><div><b>{ontWon(v)}</b><span>{t} · {Math.round(v / tot * 100)}%</span></div></div>)}</div>
      </>); })()}
    </div>

    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Network size={15} color="#22D3EE" /> 질병분류(KCD) 대분류 분포 <span>· {kcd.length}개 장 · 질병유형 {agg.dzTypes}종</span></div>
      <div className="ontkcd">{kcd.map(([k, v], i) => <OntBar key={k} label={KCD_LABELS[k] || k} value={v} max={kcdMax} sub="명" color={ONT_DEPT_COLORS[i % ONT_DEPT_COLORS.length]} />)}</div>
    </div>

    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Stethoscope size={15} color="#6366F1" /> 진료과목별 회원 분포 <span>· {deptTop.length}과</span></div>
        {deptTop.map(([k, v], i) => <OntBar key={k} label={_deptL(k)} value={v} max={deptMax} sub="명" color={ONT_DEPT_COLORS[i % ONT_DEPT_COLORS.length]} />)}
      </div>
      <div className="ontpanel">
        <div className="ontph"><HeartPulse size={15} color="#F472B6" /> 질병 진단 분포 <span>· 상위 10</span></div>
        {dzTop.map(([k, v]) => <OntBar key={k} label={k} value={v} max={dzMax} sub="명" color="#F472B6" />)}
      </div>
    </div>

    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Users size={15} color="#38BDF8" /> 연령대 분포 <span>· 남 {male.toLocaleString()} / 여 {(agg.n - male).toLocaleString()}</span></div>
        {Object.entries(agg.ageBands).map(([k, v]) => <OntBar key={k} label={k} value={v} max={ageMax} sub="명" color="#38BDF8" />)}
      </div>
      <div className="ontpanel">
        <div className="ontph"><AlertTriangle size={15} color="#F59E0B" /> 위험등급 분포</div>
        <div className="ontrisk">{[1, 2, 3, 4, 5].map((r) => { const v = agg.byRisk[r] || 0; return (<div className="ontrisk-seg" key={r} style={{ flex: Math.max(0.4, v), background: RISK_COLORS[r] }} title={`${RISK_LABELS[r]} ${v}명`}><b>{v}</b><span>{RISK_LABELS[r]}</span></div>); })}</div>
        <div className="ontph" style={{ marginTop: 14 }}><Activity size={15} color="#34D399" /> 건강검진 지표 이상(위험↑) 회원</div>
        {markTop.map(([k, v]) => <OntBar key={k} label={k} value={v} max={markMax} sub="명" color="#34D399" />)}
      </div>
    </div>

    <div className="ontsegcta">
      <div><b>온톨로지 액션</b><span>세그먼트를 선택해 보험·나눔·케어 액션을 실행하세요.</span></div>
      <button onClick={() => onSeg("needy")}><HeartHandshake size={14} /> 치료비 사각지대 {agg.needyN}명 →</button>
    </div>
  </>);
}
function _deptL(k) { if (typeof DEPT_CATS !== "undefined") { const d = DEPT_CATS.find((x) => x.key === k); if (d) return d.label; } return k; }

/* ── 질병 관리 가이드 데이터(disease_care.json) 로더 ── */
let _dzcarePromise = null, _DZCARE = null;
function loadDzCare() { if (!_dzcarePromise) _dzcarePromise = fetch("./data/disease_care.json").then((r) => (r.ok ? r.json() : null)).then((j) => { _DZCARE = (j && j.diseases) || {}; return _DZCARE; }).catch(() => { _DZCARE = {}; return _DZCARE; }); return _dzcarePromise; }
function useDzCare() { const [mp, setMp] = useState(_DZCARE); useEffect(() => { if (!_DZCARE) loadDzCare().then(setMp); else setMp(_DZCARE); }, []); return mp || {}; }

/* 질병 1개 관리 가이드 카드(접이식) */
function DzCareCard({ name, data }) {
  const [open, setOpen] = useState(false);
  const rec = data.supplements_recommended || [], avo = data.supplements_avoid || [], dev = data.devices || [], life = data.lifestyle || [], diet = data.diet || {};
  return (
    <div className={`dzcare ${open ? "on" : ""}`}>
      <button className="dzcare-h" onClick={() => setOpen((v) => !v)}>
        <b>{name}</b>
        <span className="dzcare-tags">{data.dept && typeof _deptL === "function" && <i className="dzt dept">{_deptL(data.dept)}</i>}<i className="dzt rec">영양 {rec.length}</i>{avo.length > 0 && <i className="dzt avo">금기 {avo.length}</i>}<i className="dzt dev">기기 {dev.length}</i></span>
        <ChevronRight size={15} className="dzcare-arr" />
      </button>
      {open && (
        <div className="dzcare-b">
          {rec.length > 0 && <div className="dzcare-sec"><div className="dzcare-t rec"><Pill size={12} /> 맞춤 영양소·영양제</div>{rec.map((s, i) => <div className="dzcare-row" key={i}><b>{s.name}</b><p>{s.reason}</p><em>{s.source}</em></div>)}</div>}
          {avo.length > 0 && <div className="dzcare-sec"><div className="dzcare-t avo"><AlertTriangle size={12} /> 복용 주의·금기 영양소</div>{avo.map((s, i) => <div className="dzcare-row avo" key={i}><b>{s.name}</b><p>{s.reason}</p><em>{s.source}</em></div>)}</div>}
          {dev.length > 0 && <div className="dzcare-sec"><div className="dzcare-t dev"><MonitorSmartphone size={12} /> 홈케어 의료기기</div>{dev.map((s, i) => <div className="dzcare-row" key={i}><b>{s.name}</b><p>{s.use}</p></div>)}</div>}
          {(diet.principle || (diet.recommend || []).length) && <div className="dzcare-sec"><div className="dzcare-t diet"><Salad size={12} /> 건강 식단</div><div className="dzcare-row"><p>{diet.principle}</p>{(diet.recommend || []).length > 0 && <div className="dzcare-chips">권장 {diet.recommend.map((x, i) => <span key={i}>{x}</span>)}</div>}{(diet.avoid || []).length > 0 && <div className="dzcare-chips avo">주의 {diet.avoid.map((x, i) => <span key={i}>{x}</span>)}</div>}</div></div>}
          {life.length > 0 && <div className="dzcare-sec"><div className="dzcare-t life"><Activity size={12} /> 생활습관</div><ul className="dzcare-life">{life.map((s, i) => <li key={i}>{s.tip}{s.source ? <em> · {s.source}</em> : null}</li>)}</ul></div>}
          {(data.sources || []).length > 0 && <div className="dzcare-src">출처: {data.sources.join(" · ")}</div>}
        </div>
      )}
    </div>
  );
}

/* ── 회원 객체 상세 (온톨로지 링크 뷰) ── */
function OntMemberModal({ m, onClose, onGo }) {
  const dzcare = useDzCare();
  const marks = Object.entries(m.marks).sort((a, b) => b[1] - a[1]);
  const fam = typeof pilotFamily === "function" ? pilotFamily(m.hid) : [];
  return (
    <div className="ontov" onClick={onClose}>
      <div className="ontmodal" onClick={(e) => e.stopPropagation()}>
        <div className="ontmh">
          <div><span className="ontmid">{m.id}</span><div className="ontmname">{m.name} <span>· {m.sex} {m.age}세 · {m.sido}</span></div></div>
          <button onClick={onClose}><X size={20} color="#8A97AE" /></button>
        </div>
        <div className="ontmbody">
          <div className="ontmstat">
            <div><span className="k">진료과목</span><b>{m.deptLabel}</b></div>
            <div><span className="k">위험등급</span><b style={{ color: m.riskColor }}>{m.riskLabel}</b></div>
            <div><span className="k">생체나이</span><b>{m.bioAge}세 <em style={{ color: m.bioDelta > 0 ? "#EF4444" : "#16A34A", fontStyle: "normal", fontSize: 11 }}>({m.bioDelta > 0 ? "+" : ""}{m.bioDelta})</em></b></div>
            <div><span className="k">예상 연간 의료비</span><b style={{ color: "#F59E0B" }}>{ontWon(m.estCost)}</b></div>
          </div>

          {m.costBreakdown && (() => { const cb = m.costBreakdown; const tot = m.estCost || 1; const seg = [["급여 본인부담", cb.covered, "#22D3EE"], ["비급여", cb.uncovered, "#F472B6"], ["기타 건강관리", cb.wellness, "#34D399"]]; return (
            <div className="ontmsec"><div className="ontmsh"><Banknote size={13} color="#F59E0B" /> 예상 연간 의료비 구성 <span>{ontWon(m.estCost)}</span></div>
              <div className="ontcostbar">{seg.map(([t, v, c]) => <i key={t} style={{ width: (v / tot * 100) + "%", background: c }} title={t + " " + ontWon(v)} />)}</div>
              <div className="ontcostrows">{seg.map(([t, v, c]) => <div className="ontcostrow" key={t}><span className="dot" style={{ background: c }} /><span className="ct">{t}</span><b>{ontWon(v)}</b><em>{Math.round(v / tot * 100)}%</em></div>)}</div>
            </div>
          ); })()}

          <div className="ontmsec"><div className="ontmsh"><HeartPulse size={13} color="#F472B6" /> 진단 질병 <span>{m.dzCount}</span></div>
            {m.diseases.length ? <div className="ontchips">{m.diseases.map((d) => <span key={d} className="ontchip dz">{d}</span>)}</div> : <div className="ontempty">진단된 질병 없음 (건강 양호)</div>}
          </div>

          {(() => { const cds = (m.diseases || []).filter((d) => dzcare[d]); if (!cds.length) return null; return (
            <div className="ontmsec"><div className="ontmsh"><Pill size={13} color="#16A34A" /> 질병별 관리 가이드 <span>{cds.length}</span></div>
              <div className="dzcare-list">{cds.map((d) => <DzCareCard key={d} name={d} data={dzcare[d]} />)}</div>
              <div className="chnote" style={{ marginTop: 8 }}>맞춤 영양소·<b>복용 금기 영양소</b>·홈케어기기·식단·생활습관 — 전세계 권위기관(NIH ODS·Mayo·NHS·WHO·학회·국가건강정보포털) 근거. ※ 교육용 정보이며 진단·처방이 아님. 복용 금기·상호작용은 개인 복용약에 따라 다르니 의사·약사와 상담하세요.</div>
            </div>
          ); })()}

          {typeof consultGet === "function" && (() => { const ev = consultGet(m); const A = typeof analyzeConsults === "function" ? analyzeConsults(m) : null; return (
            <div className="ontmsec"><div className="ontmsh"><MessageSquare size={13} color="#67E8F9" /> 상담 기록 (시계열) <span>{ev.length}건</span></div>
              {ev.length ? <div className="ontcns">{ev.slice(0, 6).map((e) => (
                <div className="ontcns-r" key={e.id}><span className="ontcns-d">{e.daysAgo <= 0 ? "오늘" : e.daysAgo + "일 전"}</span><div className="ontcns-m"><div className="ontcns-t">{e.topic} <i className="ontcns-k">{e.kind}</i> <i className="ontcns-risk" style={{ color: e.riskColor, background: e.riskBg }}>{e.risk}</i></div><p>"{e.question}"</p></div></div>
              ))}</div> : <div className="ontempty">상담 기록 없음</div>}
              {A && A.stats.recoCount > 0 && <div className="ontcns-sum"><Sparkles size={11} color="#34D399" /> 상담 기반 분석 → 추가검진 <b>{A.reco.checkup.length}</b> · 진료과 <b>{A.reco.dept.length}</b> · 영양 <b>{A.reco.nutrition.length}</b> · 기기 <b>{A.reco.device.length}</b> · 식단 <b>{A.reco.diet.length}</b></div>}
            </div>
          ); })()}

          {m.childHealth ? (
            <div className="ontmsec"><div className="ontmsh"><Activity size={13} color="#34D399" /> 아동·청소년 건강검진 <span>{m.checkupType}</span></div>
              <div className="ontmarks">{Object.entries(m.childHealth).map(([k, v]) => <div className="ontmark" key={k}><span>{k}</span><b style={{ color: /^정상|^양호/.test(v) ? "#34D399" : /필요|성장지연|소아비만|근시 \(/.test(v) ? "#EF4444" : "#F59E0B" }}>{v}</b></div>)}</div>
            </div>
          ) : (
            <div className="ontmsec"><div className="ontmsh"><Activity size={13} color="#34D399" /> 건강검진 이상 지표 <span>{marks.length}</span></div>
              {marks.length ? <div className="ontmarks">{marks.map(([k, gi]) => <div className="ontmark" key={k}><span>{k}</span><b style={{ color: gi >= 3 ? "#B91C1C" : gi === 2 ? "#EF4444" : "#F59E0B" }}>{_markL(k, gi)}</b></div>)}</div> : <div className="ontempty">검진 지표 정상 범위</div>}
            </div>
          )}

          <div className="ontmsec"><div className="ontmsh"><ShieldCheck size={13} color="#A78BFA" /> 필요 보장 · 공백</div>
            <div className="ontchips">{m.coverages.map((c) => <span key={c} className={`ontchip ${m.gap.includes(c) ? "gap" : "held"}`}>{c}{m.gap.includes(c) ? " · 공백" : ""}</span>)}</div>
          </div>

          <div className="ontmsec"><div className="ontmsh"><HeartHandshake size={13} color="#F59E0B" /> 가족 (가구 {m.hid}) <span>{fam.length}명</span></div>
            <div className="ontfam">{fam.map((f) => (
              <div className={`ontfam-r ${f.id === m.id ? "self" : ""}`} key={f.id}>
                <span className="ontfam-rel">{f.rel}</span>
                <b>{f.name}</b><span className="ontfam-sa">{f.sex} {f.age}세</span>
                <span className="ontfam-dz">{f.diseases.length ? f.diseases[0] + (f.diseases.length > 1 ? " 외 " + (f.diseases.length - 1) : "") : "건강"}</span>
                <span className="ontfam-risk" style={{ color: f.riskColor }}>{f.riskLabel}</span>
              </div>
            ))}</div>
          </div>

          <div className="ontmsec ontflags">
            {m.needy && <span className="ontflag needy"><HeartHandshake size={12} /> 치료비 사각지대(나눔 대상)</span>}
            {m.hasGap && <span className="ontflag gap"><ShieldCheck size={12} /> 보장 공백 {m.gap.length}건</span>}
            {m.smoker && <span className="ontflag warn">흡연</span>}
            {m.drinker && <span className="ontflag warn">음주</span>}
            <span className="ontflag ok">운동 주 {m.exercise}회</span>
            <span className="ontflag ok">소득 {m.income}</span>
          </div>

          <div className="ontmacts">
            <button className="pri ontmacts-main" onClick={() => { onClose(); onGo && onGo("ai"); }}><Bot size={16} /> AI 케어플랜</button>
            {m.needy && <button className="give" onClick={() => { if (typeof toast === "function") toast(`${m.name}님 · 치료비 나눔 대상 등록(파일럿)`); }}><HeartHandshake size={14} /> 나눔 매칭</button>}
          </div>
          <button className="ontmsub" onClick={() => { onClose(); onGo && onGo("insurance"); }}><ShieldCheck size={12} /> 보장 설계</button>
        </div>
      </div>
    </div>
  );
}
function _markL(key, gi) { if (typeof CHECKUP_ONTOLOGY !== "undefined") { const o = CHECKUP_ONTOLOGY.find((x) => x.key === key); if (o) return o.grades[gi][0]; } return ["정상", "주의", "위험", "고위험"][gi]; }

/* ── 질병 케어 라이브러리 (회원 무관, 192개 질병 전체 열람) ── */
function DzCareLibrary() {
  const care = useDzCare();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("전체");
  const entries = React.useMemo(() => Object.keys(care).map((name) => ({ name, data: care[name] })), [care]);
  const depts = React.useMemo(() => { const s = new Set(entries.map((e) => e.data.dept).filter(Boolean)); return ["전체", ...[...s].sort((a, b) => _deptL(a).localeCompare(_deptL(b), "ko"))]; }, [entries]);
  const qq = q.trim();
  const filtered = React.useMemo(() => entries.filter((e) => {
    if (dept !== "전체" && e.data.dept !== dept) return false;
    if (!qq) return true;
    if (e.name.indexOf(qq) >= 0) return true;
    if (_deptL(e.data.dept || "").indexOf(qq) >= 0) return true;
    const hit = (arr, k) => (arr || []).some((x) => (x[k] || "").indexOf(qq) >= 0);
    return hit(e.data.supplements_recommended, "name") || hit(e.data.supplements_avoid, "name") || hit(e.data.devices, "name");
  }).sort((a, b) => a.name.localeCompare(b.name, "ko")), [entries, dept, qq]);
  const CAP = 60;
  return (
    <div className="dzlib">
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#0C2A20,#0F1B33)", borderColor: "#1F5137" }}><span className="ontstore-ic" style={{ background: "#0E241C" }}><Pill size={15} color="#34D399" /></span><div><b>질병 케어 라이브러리 · {entries.length || 197}개 질병</b><p>192개 질병별 <b>맞춤 영양소·복용 금기 영양소·홈케어 의료기기·건강식단·생활습관</b>을 전세계 권위기관 근거로 정리한 지식 스토리지입니다. 진료과·질병·영양소로 검색하세요.</p></div></div>
      <div className="ontfilters" style={{ gridTemplateColumns: "220px 1fr" }}>
        <select value={dept} onChange={(e) => setDept(e.target.value)}>{depts.map((d) => <option key={d} value={d}>{d === "전체" ? "진료과목 전체" : _deptL(d)}</option>)}</select>
        <div className="ontsearch"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="질병·영양소·기기 검색 (예: 오메가3, 혈당계, 당뇨)" /></div>
      </div>
      <div className="ontcount">검색 결과 <b>{filtered.length}</b>개 <span>/ 전체 {entries.length}개 질병</span></div>
      {!entries.length ? <div className="ontempty" style={{ margin: "14px 0" }}>케어 데이터를 불러오는 중…</div> :
        <div className="dzcare-list">{filtered.slice(0, CAP).map((e) => <DzCareCard key={e.name} name={e.name} data={e.data} />)}</div>}
      {filtered.length > CAP && <div className="ontcount" style={{ marginTop: 8 }}>상위 {CAP}개 표시 · 검색·진료과로 좁혀보세요</div>}
      <div className="chnote" style={{ marginTop: 10 }}>전세계 권위기관(NIH ODS·NCCIH·Mayo·NHS·WHO·Cochrane·질환별 학회·국가건강정보포털·식약처) 근거. ※ 교육용 정보이며 진단·처방이 아님. 복용 금기·상호작용은 개인 복용약에 따라 다르니 의사·약사와 상담하세요.</div>
    </div>
  );
}

/* ── 객체 탐색기 (회원 코호트 필터·테이블) ── */
function OntExplorer({ cohort, onGo, seg }) {
  const [smode, setSmode] = useState("members");
  const [dept, setDept] = useState("전체");
  const [band, setBand] = useState("전체");
  const [sex, setSex] = useState("전체");
  const [risk, setRisk] = useState("전체");
  const [flag, setFlag] = useState(seg || "전체");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(30);
  const [sel, setSel] = useState(null);
  useEffect(() => { if (seg) { setFlag(seg); setShown(30); } }, [seg]);
  const depts = React.useMemo(() => ["전체", ...[...new Set(cohort.map((m) => m.deptKey))].sort((a, b) => _deptL(a).localeCompare(_deptL(b), "ko"))], [cohort]);
  const list = React.useMemo(() => {
    const qq = q.trim();
    return cohort.filter((m) => {
      if (dept !== "전체" && m.deptKey !== dept) return false;
      if (sex !== "전체" && m.sex !== sex) return false;
      if (risk !== "전체" && String(m.risk) !== risk) return false;
      if (band !== "전체") { const b = m.age < 20 ? "0~19" : m.age < 30 ? "20대" : m.age < 40 ? "30대" : m.age < 50 ? "40대" : m.age < 60 ? "50대" : m.age < 70 ? "60대" : "70대+"; if (b !== band) return false; }
      if (flag === "needy" && !m.needy) return false;
      if (flag === "gap" && !m.hasGap) return false;
      if (flag === "high" && m.risk < 4) return false;
      if (flag === "cancer" && !m.cancer) return false;
      if (qq && m.name.indexOf(qq) < 0 && m.id.indexOf(qq.toUpperCase()) < 0 && !m.diseases.some((d) => d.indexOf(qq) >= 0)) return false;
      return true;
    });
  }, [cohort, dept, sex, risk, band, flag, q]);
  const view = list.slice(0, shown);
  const reset = () => setShown(30);
  const FLAGS = [["전체", "전체"], ["high", "고위험군"], ["gap", "보장공백"], ["needy", "치료비 사각지대"], ["cancer", "암 진단"]];
  return (<>
    <div className="ontstore-tabs">
      <button className={smode === "members" ? "on" : ""} onClick={() => setSmode("members")}><Users size={14} /> 회원 객체 <span>{cohort.length.toLocaleString()}</span></button>
      <button className={smode === "library" ? "on" : ""} onClick={() => setSmode("library")}><Pill size={14} /> 질병 케어 라이브러리</button>
    </div>
    {smode === "library" && <DzCareLibrary />}
    {smode === "members" && (<>
    <div className="ontstore-def"><span className="ontstore-ic"><Search size={15} color="#22D3EE" /></span><div><b>데이터 하우스 · 객체 탐색기</b><p>{cohort.length.toLocaleString()}명의 회원 객체가 보관된 회원 데이터 하우스입니다. 각 회원 객체에는 <b>상담 기록이 시계열로 첨부</b>되어 있어, 객체를 열면 상담 이력 → 5대 실행 안내까지 이어집니다.</p></div></div>
    <div className="ontfilters">
      <select value={dept} onChange={(e) => { setDept(e.target.value); reset(); }}>{depts.map((d) => <option key={d} value={d}>{d === "전체" ? "진료과목 전체" : _deptL(d)}</option>)}</select>
      <select value={band} onChange={(e) => { setBand(e.target.value); reset(); }}>{["전체", "0~19", "20대", "30대", "40대", "50대", "60대", "70대+"].map((b) => <option key={b} value={b}>{b === "전체" ? "연령대 전체" : b}</option>)}</select>
      <select value={sex} onChange={(e) => { setSex(e.target.value); reset(); }}>{["전체", "남", "여"].map((s) => <option key={s} value={s}>{s === "전체" ? "성별 전체" : s}</option>)}</select>
      <select value={risk} onChange={(e) => { setRisk(e.target.value); reset(); }}><option value="전체">위험등급 전체</option>{[1, 2, 3, 4, 5].map((r) => <option key={r} value={String(r)}>{RISK_LABELS[r]}</option>)}</select>
    </div>
    <div className="ontflagbar">{FLAGS.map(([k, l]) => <button key={k} className={flag === k ? "on" : ""} onClick={() => { setFlag(k); reset(); }}>{l}</button>)}
      <div className="ontsearch"><Search size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="이름·ID·질병 검색" /></div>
    </div>
    <div className="ontcount">필터 결과 <b>{list.length.toLocaleString()}</b>명 <span>/ 전체 {cohort.length.toLocaleString()}명</span></div>
    <div className="onttbl-wrap">
      <table className="onttbl">
        <thead><tr><th>ID</th><th>이름</th><th>성/나이</th><th>지역</th><th>진료과목</th><th>질병</th><th>검진이상</th><th>상담</th><th>위험</th><th>예상의료비</th></tr></thead>
        <tbody>{view.map((m) => { const cn = typeof consultGet === "function" ? consultGet(m).length : 0; return (
          <tr key={m.id} onClick={() => setSel(m)} title="객체 상세">
            <td className="mono">{m.id}</td><td><b>{m.name}</b>{m.needy && <span className="tdot needy" title="치료비 사각지대" />}{m.hasGap && <span className="tdot gap" title="보장공백" />}</td>
            <td>{m.sex} {m.age}</td><td>{m.sido}</td><td>{m.deptLabel}</td>
            <td>{m.dzCount ? <span className="tbadge dz">{m.dzCount}</span> : <span className="tmut">-</span>}</td>
            <td>{m.abnormalCount ? <span className="tbadge ab">{m.abnormalCount}</span> : <span className="tmut">-</span>}</td>
            <td>{cn ? <span className="tbadge cn"><MessageSquare size={9} style={{ verticalAlign: "-1px" }} /> {cn}</span> : <span className="tmut">-</span>}</td>
            <td><span className="tbadge" style={{ background: m.riskColor + "22", color: m.riskColor }}>{m.riskLabel}</span></td>
            <td className="mono" style={{ color: "#F59E0B" }}>{ontWon(m.estCost)}</td>
          </tr>
        ); })}</tbody>
      </table>
    </div>
    {view.length === 0 && <div className="ontempty" style={{ margin: "14px 0" }}>조건에 맞는 회원이 없습니다.</div>}
    {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 30)}>더 보기 ({(list.length - shown).toLocaleString()}명 더)</button>}
    {sel && <OntMemberModal m={sel} onClose={() => setSel(null)} onGo={onGo} />}
    </>)}
  </>);
}

/* ── 액션 (세그먼트 → 보험/나눔/케어) ── */
function OntActions({ agg, onSeg }) {
  const cards = [
    { k: "high", ic: AlertTriangle, c: "#EF4444", t: "고위험군 케어", n: (agg.byRisk[4] || 0) + (agg.byRisk[5] || 0), d: "위험등급 높음·매우높음 회원. 집중 검진·전문의 연계·케어플랜 배정.", act: "케어플랜 일괄 배정", go: "ai" },
    { k: "gap", ic: ShieldCheck, c: "#A78BFA", t: "보장 공백 해소", n: agg.gapN, d: "질병 위험 대비 보장이 부족한 회원. 맞춤 보장 설계 제안.", act: "보장 설계 제안", go: "insurance" },
    { k: "needy", ic: HeartHandshake, c: "#E11D48", t: "치료비 사각지대 나눔", n: agg.needyN, d: "저소득·고의료비 부담 회원. 판매마진 30% 나눔 준비금으로 치료비 지원 매칭.", act: "나눔 매칭 실행", go: "wallet" },
    { k: "cancer", ic: HeartPulse, c: "#DB2777", t: "암 진단 정밀관리", n: Object.entries(agg.byDisease).filter(([d]) => /암$/.test(d)).reduce((s, [, v]) => s + v, 0), d: "암 진단 회원. 정밀검사·수술비 보장·간병 연계 관리.", act: "정밀관리 연계", go: "hospital" },
  ];
  return (<>
    <div className="ontactnote"><Sparkles size={14} color="#22D3EE" /> 온톨로지가 코호트를 실시간 세그먼트로 묶어, 각 군에 맞는 <b>보험·나눔·케어 액션</b>을 실행합니다. <span>(파일럿 시연)</span></div>
    <div className="ontactgrid">{cards.map((c) => (
      <div className="ontactcard" key={c.k} style={{ borderTopColor: c.c }}>
        <div className="ontacth"><span className="ontacti" style={{ background: c.c + "1A" }}><c.ic size={18} color={c.c} /></span><div><b>{c.t}</b><em>{c.n.toLocaleString()}명</em></div></div>
        <p>{c.d}</p>
        <div className="ontactbtns"><button className="v" onClick={() => onSeg(c.k)}>대상 보기</button><button className="a" onClick={() => { if (typeof toast === "function") toast(`${c.t} · ${c.n.toLocaleString()}명 ${c.act}(파일럿)`); }}>{c.act}</button></div>
      </div>
    ))}</div>
  </>);
}

/* ── 실시간 시뮬레이션: 신규 진단→세그먼트 이동 + 섹션별 건강케어 소비 스트림 ── */
const SIM_SECTIONS = [
  { key: "checkup", label: "건강검진", go: "checkup", c: "#2563EB", min: 80000, max: 600000, mrate: 0.10, w: 10 },
  { key: "supp", label: "영양제", go: "shop", c: "#16A34A", min: 12000, max: 95000, mrate: 0.25, w: 22 },
  { key: "diet", label: "건강식단", go: "shop", c: "#F59E0B", min: 40000, max: 160000, mrate: 0.20, w: 14 },
  { key: "device", label: "의료기기", go: "shop", c: "#0EA5E9", min: 30000, max: 420000, mrate: 0.18, w: 8 },
  { key: "pharm", label: "약국·의약외품", go: "hospital", c: "#0891B2", min: 2500, max: 32000, mrate: 0.25, w: 16 },
  { key: "homecare", label: "재가·돌봄", go: "homecare", c: "#DB2777", min: 180000, max: 1500000, mrate: 0.12, w: 6 },
  { key: "insurance", label: "보험료", go: "insurance", c: "#7C3AED", min: 20000, max: 130000, mrate: 0.15, w: 12 },
];
function _rr(a, b) { return a + Math.random() * (b - a); }
function _wsec() { const tot = SIM_SECTIONS.reduce((s, x) => s + x.w, 0); let r = Math.random() * tot; for (const s of SIM_SECTIONS) { r -= s.w; if (r <= 0) return s; } return SIM_SECTIONS[0]; }

function OntoLiveSim({ cohort, agg, onGo }) {
  const base = { high: (agg.byRisk[4] || 0) + (agg.byRisk[5] || 0), gap: agg.gapN, needy: agg.needyN };
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState([]);
  const ZERO = { dx: 0, buys: 0, spend: 0, accr: 0, don: 0, ops: 0, sec: {}, secN: {}, seg: { high: 0, gap: 0, needy: 0 } };
  const [st, setSt] = useState(ZERO);
  const stRef = useRef(ZERO);
  const idRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const s = { ...stRef.current, sec: { ...stRef.current.sec }, secN: { ...stRef.current.secN }, seg: { ...stRef.current.seg } };
      const newEvents = [];
      const nEv = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let e = 0; e < nEv; e++) {
        const m = cohort[Math.floor(Math.random() * cohort.length)];
        if (Math.random() < 0.34) { // 신규 진단
          const pool = (typeof _DEPT_DZ !== "undefined" && _DEPT_DZ[m.deptKey]) || ["이상지질혈증"];
          const cand = pool.filter((d) => !m.diseases.includes(d));
          const dz = cand.length ? cand[Math.floor(Math.random() * cand.length)] : pool[0];
          s.dx++;
          const moves = [];
          if ((m.risk >= 4) || (m.risk === 3 && Math.random() < 0.6)) { s.seg.high++; moves.push("고위험군"); }
          const needCov = (typeof DISEASE_INSURANCE !== "undefined" && DISEASE_INSURANCE[dz]) || [];
          if (needCov.some((c) => !m.coverages.includes(c)) && Math.random() < 0.55) { s.seg.gap++; moves.push("보장공백"); }
          if (m.income === "저" && Math.random() < 0.35) { s.seg.needy++; moves.push("치료비 사각지대"); }
          newEvents.push({ id: ++idRef.current, type: "dx", c: "#F472B6", who: `${m.name} (${m.id})`, text: `${m.deptLabel} · ${dz} 신규 진단`, move: moves.length ? "→ " + moves.join("·") + " 세그먼트 이동" : "위험도 재평가" });
        } else { // 건강케어 소비
          const sec = _wsec();
          const price = Math.round(_rr(sec.min, sec.max) / 1000) * 1000;
          const margin = Math.round(price * sec.mrate);
          const accr = Math.round(margin * 0.5), don = Math.round(margin * 0.3), ops = margin - accr - don;
          s.buys++; s.spend += price; s.accr += accr; s.don += don; s.ops += ops;
          s.sec[sec.key] = (s.sec[sec.key] || 0) + price; s.secN[sec.key] = (s.secN[sec.key] || 0) + 1;
          newEvents.push({ id: ++idRef.current, type: "buy", c: sec.c, who: `${m.name} (${m.id})`, text: `${sec.label} 소비 ${ontWon(price)}`, move: `적립 ${accr.toLocaleString()} · 나눔 ${don.toLocaleString()} · 운영 ${ops.toLocaleString()}` });
        }
      }
      stRef.current = s;
      setSt(s);
      setEvents((prev) => [...newEvents.reverse(), ...prev].slice(0, 22));
      setTick((t) => t + 1);
    }, Math.max(350, 1400 / speed));
    return () => clearInterval(iv);
  }, [running, speed, cohort]);
  const reset = () => { stRef.current = { dx: 0, buys: 0, spend: 0, accr: 0, don: 0, ops: 0, sec: {}, secN: {}, seg: { high: 0, gap: 0, needy: 0 } }; setEvents([]); setTick(0); setSt(stRef.current); };
  const secMax = Math.max(1, ...SIM_SECTIONS.map((s) => st.sec[s.key] || 0));
  const segCards = [["고위험군", base.high, st.seg.high, "#EF4444"], ["보장공백", base.gap, st.seg.gap, "#A78BFA"], ["치료비 사각지대", base.needy, st.seg.needy, "#E11D48"]];
  return (<>
    <div className="ontsimbar">
      <div className={`ontsimstate ${running ? "on" : ""}`}><span className="dot" /> {running ? "LIVE 실행 중" : "일시정지"} <em>· tick {tick.toLocaleString()}</em></div>
      <div className="ontsimctl">
        <button onClick={() => setRunning((v) => !v)} className="pri">{running ? <><Pause size={14} /> 일시정지</> : <><Play size={14} /> 재생</>}</button>
        {[1, 2, 4].map((sp) => <button key={sp} className={speed === sp ? "on" : ""} onClick={() => setSpeed(sp)}>{sp}x</button>)}
        <button onClick={reset}><RotateCcw size={14} /> 리셋</button>
      </div>
    </div>

    <div className="ontkpis" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
      {[["신규 진단", st.dx.toLocaleString() + "건", "#F472B6"], ["건강케어 소비", ontWon(st.spend), "#22D3EE"], ["적립(50%)", ontWon(st.accr), "#16A34A"], ["나눔(30%)", ontWon(st.don), "#E11D48"], ["운영(20%)", ontWon(st.ops), "#94A3B8"]].map(([k, v, c], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>
      ))}
    </div>

    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Zap size={15} color="#22D3EE" /> 섹션별 건강케어 소비 <span>· 실시간 누적 · {st.buys.toLocaleString()}건</span></div>
        {SIM_SECTIONS.map((s) => <OntBar key={s.key} label={`${s.label} (${(st.secN[s.key] || 0).toLocaleString()}건)`} value={st.sec[s.key] || 0} max={secMax} color={s.c} sub="" />)}
        <div className="ontsimsplit"><span>판매마진 분배</span><b style={{ color: "#16A34A" }}>적립 50%</b><b style={{ color: "#E11D48" }}>나눔 30%</b><b style={{ color: "#94A3B8" }}>운영 20%</b></div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#EF4444" /> 자동 세그먼트 이동 <span>· 신규 진단 반영</span></div>
        <div className="ontsegcards">{segCards.map(([t, b, dlt, c]) => (
          <div className="ontsegcard" key={t}><div className="ontsegcard-t">{t}</div><div className="ontsegcard-n" style={{ color: c }}>{(b + dlt).toLocaleString()}<span>명</span></div>{dlt > 0 && <div className="ontsegcard-d" style={{ color: c }}>▲ +{dlt} 이동</div>}</div>
        ))}</div>
        <div className="ontph" style={{ marginTop: 14 }}><Bell size={15} color="#FBBF24" /> 라이브 이벤트 스트림</div>
        <div className="ontfeed">
          {events.length === 0 && <div className="ontempty">시뮬레이션 이벤트를 기다리는 중…</div>}
          {events.map((ev) => (
            <div className={`ontfeed-i ${ev.type}`} key={ev.id}>
              <span className="ontfeed-ic" style={{ background: ev.c + "22", color: ev.c }}>{ev.type === "dx" ? <HeartPulse size={13} /> : <Zap size={13} />}</span>
              <div className="ontfeed-b"><div className="ontfeed-t"><b>{ev.who}</b> {ev.text}</div><div className="ontfeed-s">{ev.move}</div></div>
              <span className="ontfeed-tag" style={{ color: ev.c }}>{ev.type === "dx" ? "진단" : "소비"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="chnote" style={{ marginTop: 12 }}>※ 실시간 시뮬레이션은 <b>파일럿 시연</b>입니다. 매 틱마다 신규 진단·건강케어 소비 이벤트가 발생하고, 진단 결과에 따라 회원이 <b>고위험군·보장공백·치료비 사각지대</b> 세그먼트로 자동 이동합니다. 소비 판매마진은 <b>적립 50%·나눔 30%·운영 20%</b>로 분배됩니다(건강금융지갑 구조 연동).</div>
  </>);
}

function OntologySection({ onGo }) {
  const [tab, setTab] = useState("overview");
  const [seg, setSeg] = useState(null);
  const cohort = React.useMemo(() => (typeof pilotCohort === "function" ? pilotCohort() : []), []);
  const agg = React.useMemo(() => (typeof pilotAgg === "function" ? pilotAgg() : null), []);
  const goSeg = (k) => { setSeg(k); setTab("explorer"); };
  const tabs = [["overview", "코호트 개요", Activity], ["intel", "상담 인텔리전스", MessageSquare], ["live", "실시간 시뮬레이션", Zap], ["explorer", "데이터 하우스", Search], ["graph", "온톨로지 관계", Network], ["actions", "액션", Sparkles], ["finance", "재무회계", Landmark], ["marketing", "마케팅", Megaphone], ["whitepaper", "백서", BookOpen]];
  if (!agg) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="ontohero">
        <div className="ontohero-bg"><span /><span /></div>
        <div className="ontohero-l">
          <span className="ontotag"><Network size={13} /> Ontology Operations · Palantir-style</span>
          <div className="ontotitle">온톨로지 운영시스템</div>
          <p>파일럿 체험회원 <b>{agg.n.toLocaleString()}명</b>을 <b>객체·관계·액션</b> 온톨로지로 운영합니다 — 진료과목·질병·건강검진·예상의료비·보험담보·지역이 하나의 지식그래프로 연결됩니다.</p>
        </div>
        <div className="ontohero-kpi">
          <div><b>{agg.n.toLocaleString()}</b><span>회원 객체</span></div>
          <div><b>{Object.keys(agg.byDisease).length}</b><span>질병 유형</span></div>
          <div><b>{ontWon(agg.totalCost)}</b><span>총 예상의료비</span></div>
        </div>
      </div>

      <div className="ontobjbar">
        {[["회원", agg.n, "#22D3EE", Users], ["가구", agg.households, "#F59E0B", HeartHandshake], ["진료과목", Object.keys(agg.byDept).length, "#6366F1", Stethoscope], ["질병", Object.keys(agg.byDisease).length, "#F472B6", HeartPulse], ["검진지표", 13, "#34D399", Activity], ["지역", 17, "#38BDF8", MapPin]].map(([t, n, c, Ic], i) => (
          <div className="ontobj" key={i}><span className="ontobj-i" style={{ background: c + "1A" }}><Ic size={16} color={c} /></span><div><b>{Number(n).toLocaleString()}</b><span>{t}</span></div></div>
        ))}
      </div>

      <div className="chtabs" style={{ marginTop: 14 }}>{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "overview" && <OntOverview agg={agg} onSeg={goSeg} />}
      {tab === "intel" && <ConsultIntel onGo={onGo} />}
      {tab === "live" && <OntoLiveSim cohort={cohort} agg={agg} onGo={onGo} />}
      {tab === "explorer" && <OntExplorer cohort={cohort} onGo={onGo} seg={seg} />}
      {tab === "graph" && <div className="ontpanel"><div className="ontph"><Network size={15} color="#22D3EE" /> 온톨로지 스키마 (객체 · 관계)</div><OntGraph agg={agg} /></div>}
      {tab === "actions" && <OntActions agg={agg} onSeg={goSeg} />}
      {tab === "finance" && <FinanceSection onGo={onGo} />}
      {tab === "marketing" && <MarketingSection onGo={onGo} />}
      {tab === "whitepaper" && <WhitepaperSection />}

      <div className="chnote" style={{ marginTop: 12 }}>※ 파일럿 체험회원 {agg.n.toLocaleString()}명은 <b>결정적 시드로 생성한 합성(가명) 데이터</b>이며 실제 개인정보가 아닙니다. 진료과목·질병·검진 지표·질병↔보험 매핑은 실제 온톨로지(DEPT_CATS·CHECKUP_ONTOLOGY·DISEASE_INSURANCE)를 재사용합니다. 예상 의료비·나눔 대상·보장 공백은 시연용 추정입니다.</div>
    </div>
  );
}
