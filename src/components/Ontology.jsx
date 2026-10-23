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
    { id: "silson", t: "실손보험", n: 5, x: 460, y: 195, c: "#7C3AED" },
    { id: "critical", t: "중대질환", n: 10, x: 460, y: 55, c: "#E11D48" },
  ];
  const N = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const links = [
    ["member", "disease", "진단"], ["member", "checkup", "수검"], ["member", "dept", "진료"], ["member", "region", "거주"], ["member", "cost", "예상"],
    ["disease", "checkup", "지표"], ["disease", "coverage", "보장"],
    ["member", "silson", "가입"], ["disease", "critical", "중증"], ["critical", "coverage", "진단비"], ["silson", "cost", "보장"],
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
      <div className="ontgraph-note">Object Types <b>11</b> · Links <b>14</b> · Objects <b>{agg.n.toLocaleString()}+</b> — 회원을 중심으로 진료과목·질병·검진·의료비·보험담보·지역과 <b style={{ color: "#7C3AED" }}>실손보험(세대)</b>·<b style={{ color: "#E11D48" }}>중대질환(10대)</b>이 연결됩니다. <b style={{ color: "#E11D48" }}>질병→중대질환→진단비</b> 융합으로 보장 갭을 도출하고, <b style={{ color: "#F59E0B" }}>예상의료비→재무회계</b>·<b style={{ color: "#EC4899" }}>→마케팅→회원</b>의 <b>소비→매출→성장 루프</b>로 순환합니다.</div>
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

          {(() => { const ins = m._ins || (typeof memberInsurance === "function" ? memberInsurance(m) : null); if (!ins) return null; const sol = typeof insuranceSolution === "function" ? insuranceSolution(m) : null; const SC = { crit: "#EF4444", warn: "#F59E0B", good: "#16A34A" }; return (
            <div className="ontmsec"><div className="ontmsh"><ShieldCheck size={13} color="#A78BFA" /> 실손·중대질환 보장 <span className={"ontins-b " + (ins.silson.enrolled ? "on" : "off")}>{ins.silson.gen === "미가입" ? "실손 미가입" : "실손 " + ins.silson.gen}</span>{sol && <span className="ontins-score" style={{ color: sol.grade === "충실" ? "#16A34A" : sol.grade === "보통" ? "#F59E0B" : "#EF4444" }}>보장 {sol.grade} {sol.score}점</span>}</div>
              {ins.silson.enrolled && <div className="ontins-grid"><div><span>급여/비급여 자부담</span><b>{ins.silson.coGen} / {ins.silson.coNon}</b></div><div><span>통원/입원 한도</span><b>{ontWon(ins.silson.outLimit)} / {ontWon(ins.silson.inLimit)}</b></div><div><span>월 보험료(추정)</span><b>{ontWon(ins.silson.monthly)}</b></div><div><span>중대질환 진단비 특약</span><b>{ins.riders.length ? ontWon(ins.riderTotal) + " (" + ins.riders.length + "종)" : "없음"}</b></div></div>}
              {ins.dx.length > 0 && <div className="ontins-dx">중대질환 진단 이력: {ins.dx.map((d) => <span key={d.cat + d.sub}>{d.cat}·{d.sub} <b>{ontWon(d.benefit)}</b></span>)}</div>}
              {sol && sol.findings.length > 0 && <div className="ontins-sol"><div className="ontins-solh"><Sparkles size={11} color="#22D3EE" /> AI 보험 솔루션 (건강×보험 융합)</div>{sol.findings.slice(0, 4).map((f, i) => <div className="ontins-f" key={i} style={{ borderLeftColor: SC[f.sev] }}><b style={{ color: SC[f.sev] }}>{f.t}</b><p>{f.d}</p><em>→ {f.a}</em></div>)}<button className="ontins-go" onClick={() => onGo && onGo("insurance")}>치료비 케어에서 보장 설계 <ChevronRight size={13} /></button></div>}
            </div>
          ); })()}

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

          {!m.childHealth && <MemberCheckupArchive m={m} />}

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

/* ── 코호트 회원 → 검진엔진 프로필 정규화(어댑터) ── */
function _archMember(m) {
  if (!m) return m;
  if (Array.isArray(m.highRiskDiseases) || typeof m.biologicalAge === "number")
    return Object.assign({}, m, { regAge: (typeof m.regAge === "number" ? m.regAge : (typeof demoRegAge === "function" ? demoRegAge(m) : m.age)) });
  const dz = m.diseases || [];
  const has = (k) => dz.some((d) => d.indexOf(k) >= 0);
  const regAge = m.age || 50, bio = m.bioAge || regAge;
  const oAge = Math.max(18, regAge + (m.bioDelta > 0 ? Math.round(m.bioDelta) : 0));
  return {
    id: m.id, name: m.name, sex: m.sex, regAge, biologicalAge: bio,
    obesityAge: has("비만") ? regAge + 9 : oAge,
    heartAge: (has("고혈압") || has("고지혈") || has("이상지질") || has("협심") || has("심근") || has("심장")) ? regAge + 8 : oAge,
    liverAge: (has("지방간") || has("간염") || has("간경변")) ? regAge + 8 : oAge,
    pancreasAge: has("당뇨") ? regAge + 9 : oAge,
    kidneyAge: (has("콩팥") || has("신장") || has("신부전")) ? regAge + 8 : oAge,
    cancerRiskGrade: Math.min(10, Math.max(1, (m.risk || 3) * 2)),
    highRiskDiseases: dz, highRiskCancerTypes: dz.filter((d) => /암$/.test(d)),
    estimatedMedicalCost: m.estCost || 1500000,
    managementPoints: m.smoker ? ["금연 실천", "주 150분 유산소 운동", "나트륨·당류 줄이기"] : ["주 150분 유산소 운동", "나트륨·당류 줄이기", "연 1회 국가건강검진"],
    category: m.isChild ? "아동" : (regAge >= 65 ? "노인" : "일반"), isDemoUser: true,
  };
}

/* ── 검진 라인 그래프(SVG) ── */
const _CK_SEVCOL = ["#16A34A", "#F59E0B", "#EF4444", "#38BDF8"];
function ArchLineChart({ pts, refv, zones, unit, w = 320, h = 108 }) {
  if (!pts || !pts.length) return null;
  const pad = { l: 30, r: 14, t: 16, b: 20 };
  const nums = pts.map((p) => p.value);
  if (refv != null) nums.push(refv);
  if (zones) { nums.push(zones.t1); if (zones.t2 != null) nums.push(zones.t2); }
  let mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
  const rg = (mx - mn) || Math.abs(mx) || 1; mn -= rg * 0.2; mx += rg * 0.22;
  const X = (i) => pad.l + (pts.length === 1 ? (w - pad.l - pad.r) / 2 : i * (w - pad.l - pad.r) / (pts.length - 1));
  const Y = (v) => h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
  const top = pad.t, bot = h - pad.b, x0 = pad.l, ww = w - pad.l - pad.r;
  const clampY = (y) => Math.max(top, Math.min(bot, y));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(" ");
  // 정상/주의/위험 구간 밴드
  let bands = null;
  if (zones && zones.t1 != null && zones.t2 != null) {
    const y1 = clampY(Y(zones.t1)), y2 = clampY(Y(zones.t2));
    const rect = (yA, yB, col) => { const a = Math.min(yA, yB), b = Math.max(yA, yB); return b - a > 0.5 ? <rect x={x0} y={a} width={ww} height={b - a} fill={col} /> : null; };
    if (zones.dir === "lo") { // 높을수록 정상: 위=정상, 중간=주의, 아래=위험
      bands = <g opacity="0.11">{rect(top, y1, "#16A34A")}{rect(y1, y2, "#F59E0B")}{rect(y2, bot, "#EF4444")}</g>;
    } else { // 높을수록 위험: 아래=정상, 중간=주의, 위=위험
      bands = <g opacity="0.11">{rect(y1, bot, "#16A34A")}{rect(y2, y1, "#F59E0B")}{rect(top, y2, "#EF4444")}</g>;
    }
  }
  return (
    <svg className="ckchart" viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet">
      {bands}
      {zones && zones.t1 != null && <line x1={x0} x2={w - pad.r} y1={clampY(Y(zones.t1))} y2={clampY(Y(zones.t1))} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth="1" opacity=".5" />}
      {zones && zones.t2 != null && <line x1={x0} x2={w - pad.r} y1={clampY(Y(zones.t2))} y2={clampY(Y(zones.t2))} stroke="#EF4444" strokeDasharray="4 3" strokeWidth="1" opacity=".5" />}
      {refv != null && !zones && <g><line x1={x0} x2={w - pad.r} y1={Y(refv)} y2={Y(refv)} stroke="#EF4444" strokeDasharray="4 3" strokeWidth="1" opacity=".55" /><text x={w - pad.r} y={Y(refv) - 3} textAnchor="end" fontSize="8" fill="#EF4444">기준 {refv}</text></g>}
      <path d={d} fill="none" stroke="#38BDF8" strokeWidth="2" />
      {pts.map((p, i) => <g key={i}>
        <circle cx={X(i)} cy={Y(p.value)} r="4" fill={_CK_SEVCOL[p.sev == null ? 3 : p.sev]} stroke="#0C1730" strokeWidth="1.5" />
        <text x={X(i)} y={Y(p.value) - 9} textAnchor="middle" fontSize="9.5" fill="#EAF2FF" fontWeight="700">{p.value}{p.suffix || ""}</text>
        <text x={X(i)} y={h - 6} textAnchor="middle" fontSize="8.5" fill="#8FA1C0">{p.year}</text>
      </g>)}
    </svg>
  );
}
function _ckCsvCell(s) { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function _ckDownload(name, text, mime) { try { const blob = new Blob(["﻿" + text], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200); } catch (e) { if (typeof toast === "function") toast("내보내기를 지원하지 않는 환경입니다."); } }

/* 여러 회원 검진데이터 일괄 CSV(요약 1행/회원) */
function archiveBulkCSV(members) {
  const CAP = 1000; const list = members.slice(0, CAP);
  const cols = ["ID", "이름", "성별", "나이", "국가검진판정", "진행형태", "생체나이'24", "생체나이'25", "생체나이'26", "이상항목수", "BMI", "수축기", "이완기", "공복혈당", "총콜레스테롤", "LDL", "AST", "eGFR", "예상의료비"];
  const lines = list.map((mm) => {
    let chk; try { chk = genMemberCheckup(Object.assign({}, _archMember(mm))); } catch (e) { return null; }
    const v = (k) => { const it = chk.items[k]; return it && it.series ? it.series[it.series.length - 1].value : ""; };
    const bio = chk.report ? chk.report.bio : ["", "", ""];
    return [mm.id, mm.name, mm.sex, mm.age, chk.nat.grade, chk.trendLabel, bio[0], bio[1], bio[2], chk.comp.abnormals.length, v("bmi"), v("sbp"), v("dbp"), v("fbs"), v("tc"), v("ldl"), v("ast"), v("egfr"), mm.estCost].map(_ckCsvCell).join(",");
  }).filter(Boolean);
  return { csv: [cols.join(","), ...lines].join("\n"), count: lines.length, capped: members.length > CAP, cap: CAP };
}

/* ── 회원별 연도별 검진 데이터 아카이브(데이터하우스) ── */
function MemberCheckupArchive({ m }) {
  const M = React.useMemo(() => _archMember(m), [m && m.id]);
  const chk = React.useMemo(() => (typeof genMemberCheckup === "function" ? genMemberCheckup(Object.assign({}, M)) : null), [M]);
  const R = React.useMemo(() => (typeof demoReport === "function" ? (() => { try { return demoReport(M); } catch (e) { return null; } })() : null), [M]);
  const EKEY = "hifin_chk_edits_" + (m && (m.id || m.name));
  const [cat, setCat] = React.useState("nat");
  const [year, setYear] = React.useState(chk ? chk.years[chk.years.length - 1] : 2026);
  const LKEY = "hifin_chk_editlog_" + (m && (m.id || m.name));
  const [edits, setEdits] = React.useState(() => { try { return JSON.parse(localStorage.getItem(EKEY)) || {}; } catch (e) { return {}; } });
  const [editing, setEditing] = React.useState(false);
  const [openRow, setOpenRow] = React.useState(null);
  const [log, setLog] = React.useState(() => { try { return JSON.parse(localStorage.getItem(LKEY)) || []; } catch (e) { return []; } });
  const [showLog, setShowLog] = React.useState(false);
  React.useEffect(() => { setOpenRow(null); setEditing(false); setShowLog(false); }, [m && m.id, cat]);
  if (!chk || typeof CHECKUP_ITEMS === "undefined") return null;
  const sevCol = ["#16A34A", "#F59E0B", "#EF4444"];
  const trendCol = { improve: "#16A34A", worsen: "#EF4444", stable: "#F59E0B" }[chk.trend];
  const NAT_KEYS = ["bmi", "waist", "sbp", "dbp", "hb", "fbs", "tc", "hdl", "tg", "ldl", "ast", "alt", "ggtp", "cr", "egfr"];
  const allItems = CHECKUP_ITEMS.filter((it) => chk.items[it.key] && chk.items[it.key].series).map((it) => chk.items[it.key]);
  const rows = allItems.filter((row) => cat === "comp" || NAT_KEYS.indexOf(row.key) >= 0);
  const yr2 = (y) => "'" + String(y).slice(2);
  // 편집값 반영 유효 시계열
  const parseNum = (s) => { const v = parseFloat(s); return isNaN(v) ? null : v; };
  const eff = (row) => row.series.map((p) => {
    const e = edits[row.key]; const ov = e ? e[p.year] : undefined;
    const v = (ov !== undefined && ov !== "") ? parseNum(ov) : null;
    if (v == null) return Object.assign({}, p);
    const sev = (typeof _judgeVal === "function") ? _judgeVal(row.key, v, chk.sex) : p.sev;
    return { year: p.year, value: v, sev, label: (typeof _chkLabel === "function") ? _chkLabel(row.key, sev) : p.label, edited: true };
  });
  /* [실측 통일 2026-10-05] 시점 수가 회원마다 다르다(합성 3개년 / 본인 실측 2시점·항목별 1~2점) —
     연도 인덱스로 집으면 undefined가 된다. 연도로 찾고, 그 해 값이 없으면 빈 칸으로 둔다. */
  const ptOf = (s, y) => (s || []).find((p) => p.year === y) || null;
  const th = (row) => (typeof _thOf === "function") ? _thOf(row.key, chk.sex) : null;
  const setEdit = (key, y, val) => setEdits((prev) => { const nx = Object.assign({}, prev); nx[key] = Object.assign({}, nx[key], { [y]: val }); return nx; });
  const _stamp = () => { try { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; } catch (e) { return ""; } };
  const saveEdits = () => {
    // 원본 대비 변경 추출 → 이력 기록
    const changes = [];
    Object.keys(edits).forEach((k) => { const row = chk.items[k]; if (!row) return; chk.years.forEach((y) => { const ov = edits[k][y]; if (ov === undefined || ov === "") return; const nv = parseNum(ov); const op = ptOf(row.series, y); if (!op) return; const orig = op.value; if (nv != null && nv !== orig) changes.push({ item: row.name, year: y, from: orig, to: nv, unit: row.unit }); }); });
    if (changes.length) { const entry = { at: _stamp(), n: changes.length, changes }; const nl = [entry, ...log].slice(0, 30); setLog(nl); try { localStorage.setItem(LKEY, JSON.stringify(nl)); } catch (e) {} }
    try { localStorage.setItem(EKEY, JSON.stringify(edits)); } catch (e) {}
    setEditing(false); if (typeof toast === "function") toast(`${m.name}님 검진값 저장 완료${changes.length ? ` · 변경 ${changes.length}건 이력 기록` : ""}`);
  };
  const resetEdits = () => { setEdits({}); try { localStorage.removeItem(EKEY); } catch (e) {} if (typeof toast === "function") toast("편집값 초기화(원본 복원)"); };
  const clearLog = () => { setLog([]); try { localStorage.removeItem(LKEY); } catch (e) {} };
  const Spark = ({ row }) => { const s = eff(row); return (<span className="ckspark">{s.map((p, i) => <i key={i} title={`${p.year} ${p.value}${row.unit} · ${p.label}`} style={{ background: sevCol[p.sev] }} />)}</span>); };
  // 내보내기
  const buildMatrix = () => allItems.map((row) => { const s = eff(row); return { name: row.name, ref: row.ref, unit: row.unit, cells: s }; });
  const exportCSV = () => {
    const head = `# ${m.name} · ${m.sex}${m.age || M.regAge}세 · 국가검진판정 ${chk.nat.grade} · 진행형태 ${chk.trendLabel}`;
    const cols = ["검사항목", "참고치", "단위", ...chk.years.flatMap((y) => [`${y}값`, `${y}판정`])];
    const lines = buildMatrix().map((r) => [r.name, r.ref, r.unit, ...r.cells.flatMap((c) => [c.value, c.label])].map(_ckCsvCell).join(","));
    const rep = chk.report ? ["", "# 건강분석리포트(3년)", ["생체나이(세)", "", "세", ...chk.report.bio.flatMap((b) => [b, ""])].map(_ckCsvCell).join(","), ["예상의료비(원)", "", "원", ...chk.report.cost.flatMap((c) => [c, ""])].map(_ckCsvCell).join(",")] : [];
    _ckDownload(`검진데이터_${m.name}_${chk.years[0]}-${chk.years[chk.years.length - 1]}.csv`, [head, cols.join(","), ...lines, ...rep].join("\n"), "text/csv;charset=utf-8");
  };
  const exportPDF = () => {
    const rowsHtml = buildMatrix().map((r) => `<tr><td class="nm">${r.name}</td><td class="mut">${r.ref}</td>${r.cells.map((c) => `<td class="v s${c.sev}">${c.value}<em>${r.unit}</em><span>${c.label}</span></td>`).join("")}</tr>`).join("");
    const repHtml = chk.report ? `<h3>건강분석리포트 (3년 추이)</h3><table><tr><th>지표</th>${chk.years.map((y) => `<th>${y}</th>`).join("")}</tr><tr><td class="nm">생체나이</td>${chk.report.bio.map((b) => `<td class="v">${b}세</td>`).join("")}</tr><tr><td class="nm">예상 의료비</td>${chk.report.cost.map((c) => `<td class="v">${Math.round(c / 10000)}만원</td>`).join("")}</tr></table>` : "";
    const html = `<h1>연도별 건강검진 데이터</h1><div class="meta"><b>${m.name}</b> · ${m.sex}${m.age || M.regAge}세 · 국가검진 판정 「${chk.nat.grade}」 · 진행형태 「${chk.trendLabel}」</div>` +
      `<table><tr><th>검사항목</th><th>참고치</th>${chk.years.map((y) => `<th>${y}년</th>`).join("")}</tr>${rowsHtml}</table>${repHtml}` +
      `<p class="src">출처: ${chk.nat.src} · ${chk.comp.src} · ${typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} · 회원 검진데이터(시연·교육용, 실제 판정은 검진기관 의사 소견을 따름)</p>`;
    const css = `body{font-family:'Malgun Gothic',sans-serif;color:#111;margin:26px;}h1{font-size:19px;margin:0 0 4px;}h3{font-size:14px;margin:20px 0 6px;}.meta{font-size:12px;color:#444;margin-bottom:12px;}table{border-collapse:collapse;width:100%;margin-bottom:10px;}th,td{border:1px solid #ccc;padding:5px 8px;font-size:11px;text-align:left;}th{background:#0F1B33;color:#fff;}td.nm{font-weight:700;}td.mut{color:#777;}td.v em{color:#888;font-style:normal;font-size:9px;margin-left:2px;}td.v span{display:block;font-size:9px;font-weight:700;}td.s1 span{color:#B45309;}td.s2 span{color:#B91C1C;}td.s0 span{color:#15803D;}.src{font-size:9px;color:#888;margin-top:14px;line-height:1.5;}@media print{@page{margin:14mm;}}`;
    try { const w = window.open("", "_blank"); if (!w) { if (typeof toast === "function") toast("팝업 차단을 해제해 주세요."); return; } w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>검진데이터_${m.name}</title><style>${css}</style></head><body>${html}</body></html>`); w.document.close(); w.focus(); setTimeout(() => { try { w.print(); } catch (e) {} }, 400); } catch (e) { if (typeof toast === "function") toast("PDF 내보내기를 지원하지 않는 환경입니다."); }
  };
  const anyEdited = Object.keys(edits).length > 0;
  return (
    <div className="ontmsec ckarch">
      <div className="ontmsh"><Database size={13} color="#67E8F9" /> 연도별 검진 데이터 아카이브 {(() => { const g = (typeof memberHealthGrade === "function") ? (() => { try { return memberHealthGrade(M); } catch (e) { return null; } })() : null; return g ? <span className="ckarch-trend" style={{ background: g.meta.c + "26", color: g.meta.c }}>{g.grade}</span> : null; })()}<span className="ckarch-trend" style={{ background: trendCol + "22", color: trendCol }}>{chk.trendLabel}</span>
        <div className="ckarch-tools">
          <button onClick={exportCSV} title="CSV 내보내기"><Download size={12} /> CSV</button>
          <button onClick={exportPDF} title="PDF(인쇄) 내보내기"><Printer size={12} /> PDF</button>
          <button className={editing ? "on" : ""} onClick={() => setEditing((v) => !v)} title="검진값 편집"><Pencil size={12} /> {editing ? "편집중" : "편집"}</button>
          <button className={showLog ? "on" : ""} onClick={() => setShowLog((v) => !v)} title="편집 이력"><Clock size={12} /> 이력{log.length ? ` ${log.length}` : ""}</button>
        </div>
      </div>
      {showLog && <div className="ckloglist">
        <div className="ckloghd"><Clock size={12} /> 편집 이력 <span>{log.length}건</span>{log.length > 0 && <button onClick={clearLog}>이력 삭제</button>}</div>
        {log.length ? log.map((e, i) => <div className="cklogrow" key={i}><span className="cklogt">{e.at}</span><div className="cklogc">{e.changes.map((c, j) => <span key={j} className="cklogchg">{c.item} <em>{c.year}</em> {c.from}→<b>{c.to}</b>{c.unit}</span>)}</div></div>) : <div className="ckmut" style={{ padding: "8px 2px" }}>아직 편집 이력이 없습니다. 값을 수정·저장하면 기록됩니다.</div>}
      </div>}
      {/* [실측 통일 2026-10-06] 판정은 gradeLabel(「정상B · 유질환자(고혈압, 잘 조절됨)」 — 다른 전 화면과 동일),
          이상항목 건수는 실측이면 국가검진 판정 행(abnMain)에서 세고 출처를 함께 적는다(종합검진으로 읽히지 않게). */}
      <div className="ckarch-sub">국가검진 판정 「<b>{chk.nat.gradeLabel || chk.nat.grade}</b>」 · {chk.selfReal ? "실측" : "최근 " + chk.years.length + "년"}({chk.years[0]}~{chk.years[chk.years.length - 1]}) 시점 · {chk.selfReal ? `이상·의심 ${(chk.abnMain || []).length}항목(국가검진 ${chk.nat.date})` : `이상항목 ${chk.comp.abnormals.length}건`} · 진행형태 「{chk.trendLabel}」{anyEdited && <span className="ckedited-tag"> · ✏️ 편집값 반영됨</span>}</div>
      {chk.selfReal && chk.trendNote ? <div className="ckmut" style={{ padding: "2px 2px 6px", fontSize: 11 }}>※ {chk.trendNote}</div> : null}
      <div className="ckarch-cat">{[["nat", "국가건강검진"], ["comp", "종합건강진단"], ["report", "건강분석리포트"]].map(([k, t]) => <button key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>{t}</button>)}</div>
      {editing && cat !== "report" && <div className="ckedit-bar"><span>연도별 값을 직접 입력하면 판정이 자동 재계산됩니다.</span><button className="save" onClick={saveEdits}>저장</button><button className="reset" onClick={resetEdits} disabled={!anyEdited}>초기화</button></div>}
      {cat !== "report" && !editing && <div className="ckarch-yr">{chk.years.map((y) => <button key={y} className={year === y ? "on" : ""} onClick={() => setYear(y)}>{y}년</button>)}</div>}
      {cat !== "report" ? (
        editing ? (
          <div className="onttbl-wrap"><table className="onttbl ckarch-tbl ckedit-tbl">
            <thead><tr><th>검사항목</th><th>참고치</th>{chk.years.map((y) => <th key={y}>{y}년</th>)}<th>판정({chk.years[chk.years.length - 1]})</th></tr></thead>
            <tbody>{rows.map((row) => { const s = eff(row); const last = s[s.length - 1]; return (
              <tr key={row.key}><td>{row.name}</td><td className="ckmut">{row.ref}</td>
                {chk.years.map((y) => { const op = ptOf(row.series, y); const cur = (edits[row.key] && edits[row.key][y] !== undefined) ? edits[row.key][y] : (op ? op.value : ""); return (
                  <td key={y}>{op ? <input className="ckedit-input" type="number" step="any" value={cur} onChange={(e) => setEdit(row.key, y, e.target.value)} /> : <span className="ckmut">—</span>}</td>
                ); })}
                <td><span className="ckbadge" style={{ background: sevCol[last.sev] + "22", color: sevCol[last.sev] }}>{last.label}</span></td></tr>
            ); })}</tbody>
          </table></div>
        ) : (
          <div className="onttbl-wrap"><table className="onttbl ckarch-tbl">
            <thead><tr><th>검사항목</th><th>참고치</th><th>{year}년</th><th>판정</th><th>{chk.selfReal ? `${chk.years.length}시점` : `${chk.years.length}년 추이`}</th></tr></thead>
            <tbody>{rows.map((row) => { const s = eff(row); const p = ptOf(s, year) || s[s.length - 1]; if (!p) return null; const isOpen = openRow === row.key; return (
              <React.Fragment key={row.key}>
                <tr className={"ckrow" + (isOpen ? " open" : "")} onClick={() => setOpenRow(isOpen ? null : row.key)} title={chk.selfReal ? `클릭 시 ${chk.years.length}시점 비교 그래프` : `클릭 시 ${chk.years.length}년 추이 그래프`}>
                  <td>{row.name}{p.edited && <i className="ckdot" title="편집값" />}</td><td className="ckmut">{row.ref}</td>
                  <td className="mono"><b>{p.value}</b><em className="ckunit">{row.unit}</em></td>
                  <td><span className="ckbadge" style={{ background: sevCol[p.sev] + "22", color: sevCol[p.sev] }}>{p.label}</span></td>
                  <td><Spark row={row} /> <ChevronRight size={12} className={"ckchev" + (isOpen ? " r" : "")} /></td>
                </tr>
                {isOpen && <tr className="ckchart-row"><td colSpan={5}><div className="ckchart-wrap"><div className="ckchart-t">{row.name} · {chk.selfReal ? `실측 ${chk.years.join("·")} 시점 비교` : `최근 ${chk.years.length}년 추이`} <span>{row.item && row.item.mean ? "· " + row.item.mean : ""}</span></div><ArchLineChart pts={s.map((x) => ({ year: x.year, value: x.value, sev: x.sev }))} zones={th(row)} unit={row.unit} /><div className="ckzone-lg"><span><i style={{ background: "#16A34A" }} />정상</span><span><i style={{ background: "#F59E0B" }} />주의</span><span><i style={{ background: "#EF4444" }} />위험</span></div></div></td></tr>}
              </React.Fragment>
            ); })}</tbody>
          </table></div>
        )
      ) : (
        <div className="ckarch-report">
          <div className="ckrep-charts">
            <div className="ckrep-chart"><div className="ckrep-ct">생체나이 {chk.report ? `(${chk.report.years.length}년)` : "(측정 1시점 — 추이 없음)"}</div>{chk.report ? <ArchLineChart pts={chk.report.years.map((y, i) => ({ year: y, value: chk.report.bio[i], suffix: "세" }))} /> : <div className="ckmut">데이터 없음</div>}</div>
            <div className="ckrep-chart"><div className="ckrep-ct">예상 의료비 (만원{chk.report ? `, ${chk.report.years.length}년` : " · 측정 1시점"})</div>{chk.report ? <ArchLineChart pts={chk.report.years.map((y, i) => ({ year: y, value: Math.round(chk.report.cost[i] / 10000) }))} /> : <div className="ckmut">데이터 없음</div>}</div>
          </div>
          {R && <>
            <div className="ckrep-h">질병 발생 위험도 <em>동년배 대비 · 최근연도</em></div>
            <div className="ckrep-chips">{R.diseases.map(([nm, pct]) => <span key={nm} className="ckrep-dz" style={{ color: pct > 10 ? "#EF4444" : pct > 0 ? "#F59E0B" : "#16A34A" }}>{nm} {pct > 0 ? "+" : ""}{pct}%</span>)}</div>
            <div className="ckrep-h">암 발생 위험도 <em>10종</em></div>
            <div className="ckrep-chips">{R.cancers.map(([nm, lab]) => <span key={nm} className={"ckrep-cx " + (lab === "경고" ? "warn" : lab === "주의" ? "cau" : "ok")}>{nm} {lab}</span>)}</div>
          </>}
          <div className="ckmut" style={{ marginTop: 8 }}>※ 위험도는 최근연도 기준이며, 3년 진행형태(「{chk.trendLabel}」)에 따라 생체나이·의료비가 위와 같이 변화합니다.</div>
        </div>
      )}
      <div className="ckmut ckarch-src">📚 {chk.nat.src} · {chk.comp.src} · {typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} · 회원 검진데이터(결정론 생성, 시연·교육용)</div>
    </div>
  );
}

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
      if (flag === "nosilson" && (m._ins ? m._ins.silson.enrolled : true)) return false;
      if (qq && m.name.indexOf(qq) < 0 && m.id.indexOf(qq.toUpperCase()) < 0 && !m.diseases.some((d) => d.indexOf(qq) >= 0)) return false;
      return true;
    });
  }, [cohort, dept, sex, risk, band, flag, q]);
  const view = list.slice(0, shown);
  const reset = () => setShown(30);
  const FLAGS = [["전체", "전체"], ["high", "고위험군"], ["gap", "보장공백"], ["needy", "치료비 사각지대"], ["cancer", "암 진단"], ["nosilson", "실손 미가입"]];
  return (<>
    <div className="ontstore-tabs">
      <button className={smode === "members" ? "on" : ""} onClick={() => setSmode("members")}><Users size={14} /> 회원 객체 <span>{cohort.length.toLocaleString()}</span></button>
      <button className={smode === "library" ? "on" : ""} onClick={() => setSmode("library")}><Pill size={14} /> 질병 케어 라이브러리</button>
      <button className={smode === "connector" ? "on" : ""} onClick={() => setSmode("connector")}><Server size={14} /> 데이터 커넥터</button>
      <button className={smode === "compliance" ? "on" : ""} onClick={() => setSmode("compliance")}><Scale size={14} /> 규제·거버넌스</button>
    </div>
    {smode === "connector" && typeof DataConnectorHub === "function" && <DataConnectorHub />}
    {smode === "compliance" && typeof ComplianceConsole === "function" && <ComplianceConsole />}
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
    <div className="ontcount">필터 결과 <b>{list.length.toLocaleString()}</b>명 <span>/ 전체 {cohort.length.toLocaleString()}명</span>
      <button className="ontbulk" onClick={() => { const r = archiveBulkCSV(list); _ckDownload(`검진데이터_일괄_${r.count}명.csv`, r.csv, "text/csv;charset=utf-8"); if (typeof toast === "function") toast(`검진데이터 ${r.count}명 CSV 내보내기${r.capped ? ` (상위 ${r.cap}명)` : ""}`); }} title="필터된 회원 검진데이터 일괄 CSV"><Download size={12} /> 검진데이터 일괄 CSV</button>
    </div>
    <div className="onttbl-wrap">
      <table className="onttbl">
        <thead><tr><th>ID</th><th>이름</th><th>성/나이</th><th>지역</th><th>진료과목</th><th>질병</th><th>실손</th><th>중대질환</th><th>검진이상</th><th>상담</th><th>위험</th><th>예상의료비</th></tr></thead>
        <tbody>{view.map((m) => { const cn = typeof consultGet === "function" ? consultGet(m).length : 0; return (
          <tr key={m.id} onClick={() => setSel(m)} title="객체 상세">
            <td className="mono">{m.id}</td><td><b>{m.name}</b>{m.needy && <span className="tdot needy" title="치료비 사각지대" />}{m.hasGap && <span className="tdot gap" title="보장공백" />}</td>
            <td>{m.sex} {m.age}</td><td>{m.sido}</td><td>{m.deptLabel}</td>
            <td>{m.dzCount ? <span className="tbadge dz">{m.dzCount}</span> : <span className="tmut">-</span>}</td>
            <td>{(() => { const s = m._ins && m._ins.silson; if (!s) return <span className="tmut">-</span>; return s.enrolled ? <span className="tsil" style={{ color: s.gen === "미가입" ? "#94A3B8" : "#7C3AED" }}>{s.gen.replace(" 실손", "")}</span> : <span className="tsil off">미가입</span>; })()}</td>
            <td>{m._ins && m._ins.dx.length ? <span className="tbadge crit" title={m._ins.dx.map((d) => d.cat).join("·")}>{m._ins.dx.length}</span> : (m._ins && m._ins.riders.length ? <span className="tmut" title="진단비 특약 보유">특약</span> : <span className="tmut">-</span>)}</td>
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
    { k: "needy", ic: HeartHandshake, c: "#E11D48", t: "치료비 사각지대 나눔", n: agg.needyN, d: `저소득·고의료비 부담 회원. 판매마진 ${WALLET_SPLIT.give}% 나눔 준비금으로 치료비 지원 매칭.`, act: "나눔 매칭 실행", go: "wallet" },
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
          const accr = Math.round(margin * WALLET_SPLIT.earn / 100), don = Math.round(margin * WALLET_SPLIT.give / 100), ops = margin - accr - don;   // 판매마진 분배 = WALLET_SPLIT 단일 정의
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
      {[["신규 진단", st.dx.toLocaleString() + "건", "#F472B6"], ["건강케어 소비", ontWon(st.spend), "#22D3EE"], [`적립(${WALLET_SPLIT.earn}%)`, ontWon(st.accr), "#16A34A"], [`나눔(${WALLET_SPLIT.give}%)`, ontWon(st.don), "#E11D48"], [`운영(${WALLET_SPLIT.ops}%)`, ontWon(st.ops), "#94A3B8"]].map(([k, v, c], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>
      ))}
    </div>

    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Zap size={15} color="#22D3EE" /> 섹션별 건강케어 소비 <span>· 실시간 누적 · {st.buys.toLocaleString()}건</span></div>
        {SIM_SECTIONS.map((s) => <OntBar key={s.key} label={`${s.label} (${(st.secN[s.key] || 0).toLocaleString()}건)`} value={st.sec[s.key] || 0} max={secMax} color={s.c} sub="" />)}
        <div className="ontsimsplit"><span>판매마진 분배</span><b style={{ color: "#16A34A" }}>적립 {WALLET_SPLIT.earn}%</b><b style={{ color: "#E11D48" }}>나눔 {WALLET_SPLIT.give}%</b><b style={{ color: "#94A3B8" }}>운영 {WALLET_SPLIT.ops}%</b></div>
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
    <div className="chnote" style={{ marginTop: 12 }}>※ 실시간 시뮬레이션은 <b>파일럿 시연</b>입니다. 매 틱마다 신규 진단·건강케어 소비 이벤트가 발생하고, 진단 결과에 따라 회원이 <b>고위험군·보장공백·치료비 사각지대</b> 세그먼트로 자동 이동합니다. 소비 판매마진은 <b>적립 {WALLET_SPLIT.earn}%·나눔 {WALLET_SPLIT.give}%·운영 {WALLET_SPLIT.ops}%</b>로 분배됩니다(건강금융지갑 구조 연동).</div>
  </>);
}

/* ══════════ 데이터 보강 로드맵 — 헬스케어 온톨로지 탭 하단 (형 지시 2026-10-23) ══════════
   종전에는 데이터 성격 고지 한 문단이 있던 자리다. 형 지시로 그 자리를 **더 보강해야 할 것**으로 바꿨다.
   이 화면은 투자·제휴 설명에 쓰이므로 각 항목이 네 가지를 말한다 — 지금 무엇이 비어 있는지(측정값)·
   왜 비어 있는지(구조적 원인)·무엇으로 채우는지(원천·방법)·채우면 무엇이 가능해지는지.
   ⚠️ 여기 적힌 수치는 전부 **코호트 전건(또는 명시한 표본) 실측값**이다. 추정·인용값을 섞지 않는다.
      외부 통계는 괄호로 출처만 적고 코호트 값과 구분한다(대조하지 않았다는 사실까지 적는다).
      표본을 쓰는 자리는 **표본 선택 규칙(시작 인덱스·개수)을 문장에 적어** 재현 가능하게 둔다.
   ⚠️ 등급 분포는 **handoffCard가 실제로 싣는 5상태**를 적는다(scripts/handoff_batch_report.json byGrade 단일 원천
      · hmOpsSnapshot과 같은 축). riskGradeOf를 전건에 그냥 호출한 값은 단계 게이트(D1→W)를 거치지 않으므로
      제품 어느 경로에도 없는 숫자다 — 원시 집계를 함께 보일 때는 축이 다르다는 사실을 같은 문장에 적는다.
   ⚠️ 역량 주장을 쓰지 않는다 — 데이터가 들어오면 「계산됩니다」가 아니라 「전제입니다」로 적고,
      상호작용·복약 같은 의료 인접 주제에는 같은 파일 212·518행의 교육용 고지 문장을 함께 둔다.
      인수(언더라이팅)·청구 심사 판정은 보험사 고유 권한이므로 플랫폼이 한다고 적지 않는다.
   ※ 「실제 개인정보가 아니다」는 최소 표식은 블록 머리의 칩 한 개(.ontgap-synth — 데이터 칩과 다른 경고 톤)로
      남긴다 — 고지를 없애는 것이 아니다. 같은 사실은 로그인 체험계정 안내·치료비 케어 보장분석·재무 원장에도
      적혀 있다. 칩 문구는 화면 표기 규약(insuranceCohort.js 머리 주석)을 따른다 — 호칭은 「파일럿 코호트」,
      신원은 「이름·식별자는 가명으로 표시」. 클래스 이름(ontgap-synth)은 화면에 안 나오므로 그대로 둔다. */
const ONT_GAP_STAGES = [
  ["1단계", "지금 저장소 안에서 채운다", "생성 순서·사전·판정 연결을 고치는 일 — 외부 연동 없이 가능합니다.", "#22D3EE"],
  ["2단계", "제휴·연동이 있어야 채워진다", "D-2 서버 이관 위에 회원 동의 기반 외부 조회를 붙여야 합니다.", "#A78BFA"],
  ["3단계", "기록이 쌓이려면 실회원 운영이 필요하다", "그릇(스키마)이 이미 있는 자리와 새로 만들 자리가 섞여 있습니다.", "#34D399"],
];
/* now 배열은 홀수 번째가 <b> 강조 — 숫자를 본문에서 분리해 「실측값」임을 눈으로 구분한다 */
const ONT_GAPS = [
  { s: 0, ic: Users, c: "#F59E0B", t: "연령 — 60대가 구조적으로 빕니다",
    now: ["40대 ", "20,960명(21.0%)", " · 50대 ", "15,912명", " · ", "60대 3,813명(3.8%)", " · 70대+ ", "11,368명", "입니다. 40세 이상은 ", "52,053명(52.1%)", " · 평균 39.0세입니다. 한 살로 보면 ", "56세부터 65세까지 열 살이 내리 패였습니다", " — 55세 1,880명 → 56세 1,441 → 57세 894 → 59세 434 → 60세 393 → 64세 283 → 65세 229로 내려가다 66세 328 → 70세 594로 다시 오릅니다. 그 열 살을 다 합쳐도 ", "5,360명(5.4%)", "뿐입니다."],
    why: "가구를 먼저 만들고 나이를 뒤에 붙이기 때문입니다. 가구의 48%인 핵가족·3세대 가구주의 나이 창이 56세에서 끊기고(34~56세 · 40~56세), 부부 가구주는 64세에서 끝나고 노인 가구는 66세에서 시작합니다. 56~65세를 메우는 가구 유형은 1인 가구 하나뿐이어서(24~70세 균등 · 가구의 15%) 60대 3,813명 중 1,102명(28.9%)이 1인 가구에서 나오고, 65세 가구주 99명은 전원 1인 가구입니다.",
    fill: "목표 연령×성별 분포를 먼저 선언하고 그 분포를 만족시키도록 가구를 만드는 순서로 바꿉니다(출처: 통계청 주민등록 인구·인구주택총조사 가구 구성 — 이번 측정에서는 대조하지 않았습니다).",
    win: "60대는 실손 세대 교체와 진단비 수요가 겹치는 구간입니다. 3,813명으로는 성별·지역으로 쪼개면 칸이 비어 전환율을 말할 수 없습니다." },
  { s: 0, ic: Activity, c: "#EF4444", t: "검진 판정이 사실상 꺼져 있습니다",
    now: ["장기(臟器)나이로 중증도를 올리는 판정이 ", "10만 전건 0건", "입니다. 그래서 23항목을 10만 명에게 매긴 ", "현재 시점", " 판정 ", "2,248,809건", "(전립선 검사는 남성 48,809명만 받으므로 23×10만보다 적습니다) 중 이상이 ", "23,028건(1.02%)", "뿐이고(주의 9,611 · 위험 13,417), 위험 항목이 하나도 없는 회원이 ", "93,700명(93.7%)", "입니다. 체질량지수·허리둘레·혈소판·AFP·CA19-9 5항목은 전원 정상입니다. 반면 같은 회원들의 ", "과거 2시점 4,497,618건은 이상이 439,593건(9.77%)", "입니다(주의 383,205 · 위험 56,388) — 값을 정상 범위와 대조하는 판정기가 과거 시점에만 걸려 있기 때문입니다. 국가검진 판정은 4종 중 2종만 나옵니다 — 유질환자 58,320 · 정상A 41,680 · ", "정상B 0건 · 질환의심 0건", ". 프로 지시서가 실제로 싣는 등급은 5상태입니다(10만 배치 산출 handoff_batch_report 기준) — ", "결과 대기 54,780(54.8%)", " · 고위험 2,769(2.8%) · 중위험 2,000(2.0%) · 관심 20,891(20.9%) · 등급 없음 19,560(19.6%). 참고로 단계 게이트를 걷어내고 집계하면 고위험 6,300 · 중위험 4,353 · 관심 46,292 · 등급 없음 43,055이 되는데, 제품은 결과 대기 54,780명을 따로 떼어 내므로 ", "카드 분포와는 다른 축", "입니다."],
    why: "장기나이가 「실제 나이 + 0~2세」 상수로 심기는데 판정 기준이 「+2세 초과」라 경계에서 막힙니다. 더 근본은 방향입니다 — 현재 시점은 중증도를 먼저 정하고 그 등급의 구간에서 값을 거꾸로 뽑으므로(중증도→값) 값이 자기 판정기를 통과하지 않습니다. 그래서 현재 중증도가 검사값이 아니라 질병명 매칭 한 줄에서만 나옵니다.",
    fill: "판정기를 새로 만드는 일이 아니라 이미 있는 판정기를 현재 시점에 연결하는 일입니다 — 값→정상범위 판정기(임계 23항목 전건)는 이미 있고 과거 2시점에 전건 적용돼 있습니다. 1단계에서 되는 것은 장기나이 상수 오프셋을 걷어내고 국가검진을 공단 규칙대로 값에서 4종으로 가르는 것이고, 「값에서 등급을 낸다」는 방향 전환 자체는 실측값이 들어오는 2단계(마이헬스웨이)가 전제입니다.",
    win: "「검진 결과가 들어오면 등급이 바뀐다」는 60일 사이클의 전제가 성립합니다. 결과가 들어오면 지금 결과 대기인 54,780명이 등급을 받고, 등급 없음 19,560명이 응답 시한을 갖습니다(지금은 그중 D2 3,138명만 골든타임 시한이 붙습니다). 등급 없음 19,560명에게도 통화 대본과 권장 개입은 이미 조립됩니다(표본 400명 전건 — 대본 400 · 권장 개입 2건 400). 대본이 조립되지 않는 구간은 결과 대기 54,780명이고, 그것은 데이터 공백이 아니라 접촉 금지 설계입니다." },
  { s: 0, ic: ShieldCheck, c: "#A78BFA", t: "보장 공백을 두 계층이 각자 다르게 셉니다",
    now: ["같은 회원인데 한쪽은 공백 보유 ", "15,831명(15.8%)", ", 다른 쪽은 ", "81,625명(81.6%)", "이라고 답합니다. 같은 번호로 교차하면 ", "67,282명(67.3%)", "에서 답이 반대입니다(둘 다 공백 15,087 · 한쪽만 67,282 · 둘 다 없음 17,631). 실손 세대도 두 벌이어서 2세대가 한쪽 24,042명 · 다른 쪽 15,972명입니다. 40세 이상 52,053명 중 ", "44,023명(84.6%)", "은 보장이 「실손보험」 1건뿐입니다."],
    why: "원인이 계층마다 다릅니다. 한쪽(15.8%)은 질병→필요보장 사전 24종만 매칭해 질병 192종 중 19종(9.9%) · 86,635건 중 10,343건(11.9%)만 잡고 나머지를 「실손보험」 한 줄로 떨어뜨립니다 — 보장이 1건이면 보유 건수가 반드시 1이 돼 공백이 구조적으로 0이 됩니다. 다른 쪽(81.6%)은 그 사전을 아예 읽지 않고(참조 0건) 하드코딩된 세 칸 규칙에 실손 미가입 가산 1을 더합니다 — 암은 전원 필요, 뇌·심장은 해당 질병 또는 50세 이상입니다. 그래서 공백 사유가 암 58,997 · 심장 23,146 · 뇌 22,635로 쏠리고 46,470명(공백 보유자의 56.9%)이 「암 보장 1건 없음」 단독이며, 4,764명은 실손 미가입만으로 공백이 됩니다.",
    fill: "두 가지를 따로 해야 합니다 — ①질병→보장 매핑을 상품 분류 기준으로 192종 전체까지 넓히고(분류 기준 출처: 생손보 공시실·보험개발원 공개 상품 분류 — 인벤토리 상태 「계획」) ②필요보장 규칙을 두 계층이 같은 표로 읽게 통일합니다(지금은 사전 매칭과 세 칸 규칙이 각자 답합니다). 회원이 실제로 들고 있는 계약을 추정이 아니라 조회로 바꾸는 일은 아래 2단계 항목입니다.",
    win: "「보장 공백 N명」을 한 숫자로 말할 수 있습니다. 지금은 15.8%와 81.6% 중 어느 쪽을 말해도 같은 탭의 다른 블록과 어긋납니다." },
  { s: 0, ic: Hash, c: "#F472B6", t: "질병 코드가 대분류 한 글자까지입니다",
    now: ["질병 192종이 KCD(한국표준질병사인분류) ", "대분류 18개 장에 100%", " 매핑돼 있지만 세분류(I10·E11.9 같은 3~4단 코드)는 ", "0건", "입니다. 빈도 가중이 없어 상위가 경증으로 찹니다 — 반월상연골손상 994 · 인대손상 980 · 빈혈 968 · 감기 966건이고 1인 평균 ", "0.87건", "입니다."],
    why: "질병을 한글 이름으로 들고 다니고 코드는 집계용으로 한 글자만 붙였습니다. 연령·성별 제약 규칙은 「가능/불가능」만 가르고 「얼마나 흔한지」는 담고 있지 않습니다.",
    fill: "세분류 코드를 192종 전건에 부여하고(출처: 통계청 한국표준질병사인분류 고시), 유병률로 빈도를 가중합니다(출처: 국민건강영양조사·건강보험 진료통계). 그 뒤 이름 매칭을 코드 매칭으로 바꿉니다.",
    win: "약관의 보장 범위는 코드 구간으로 적혀 있습니다. 코드가 붙으면 청구 가능성 안내와 기존 계약과의 보장 범위 비교(갈아타기 권유가 아닙니다)가 추측이 아니라 대조가 되고, 보험사의 인수 심사·청구 심사에 그대로 쓸 수 있는 형태로 자료를 맞출 수 있습니다 — 심사 판정 자체는 보험사 고유 권한입니다." },
  { s: 0, ic: ClipboardList, c: "#34D399", t: "검사 항목 사전이 두 벌이고 이름이 다릅니다",
    now: ["엔진 판정 23개 · 금고 저장 20개가 따로 있습니다. 엔진 쪽은 단위 23/23 · 참조구간 23/23 · 판정 임계 23/23이지만 단계별 구간 라벨은 8/23이고 국제 검사 코드(LOINC)는 ", "0/23", "입니다. 같은 검사를 다른 이름으로 부르는 쌍이 ", "3개", "입니다(공복혈당 fbs↔glucose · 총콜레스테롤 tc↔tchol · 감마지티피 ggtp↔ggt). 금고 레코드는 두 겹인데 겹마다 다릅니다 — 사람이 읽는 항목 배열에는 단위·참조구간이 ", "4,000건 전건 0개", "(20항목 × 표본 200명)인데, 같은 레코드의 FHIR 변환본에는 국제 검사 코드가 ", "4,000/4,000", " · 단위가 3,600/4,000 이미 실립니다(빠진 400은 요단백·흉부촬영 2개 정성 항목). 측정기관(provider) 칸은 만들어져 있고 값이 ", "표본 200명 전건 비어 있습니다", "."],
    why: "사전이 용도별로 따로 자랐습니다 — 상담용·저장용. 키 이름을 맞추자는 규약이 없었고, 상담·판정 경로가 그 FHIR 변환본을 읽지 않습니다(판정은 매번 새로 만듭니다).",
    fill: "세 가지입니다 — ①엔진 사전(23)과 금고 사전(20)의 키를 통일하고 ②측정기관을 기입하고 ③저장된 값을 판정 경로로 되돌립니다. 국제 검사 코드로 키를 두는 일은 금고 변환본에서 이미 서 있어 새로 할 일이 아닙니다.",
    win: "회원 화면·프로 카드·보험 심사가 같은 숫자를 말합니다. 외부에서 들어온 검사값도 사람 손 없이 붙습니다 — 외부 원천은 항목을 코드로 보내기 때문입니다." },
  { s: 0, ic: Cigarette, c: "#FBBF24", t: "생활 변수가 두 곳에서 따로 만들어집니다",
    now: ["성인 ", "77,099명", "에서 한쪽만 흡연자로 보는 사람이 ", "20,374명(26.4%)", "입니다(둘 다 흡연자는 3,303명). 음주는 불일치 ", "28,685명(37.2%)", "입니다. 「신체활동 필요」 51,996명은 체질량지수 판정 기여가 0건입니다(위 두 번째 항목 때문). 운동은 네 칸이 거의 균등하고(24,902 · 25,323 · 24,677 · 25,098), 소득은 저 22,108 · 중 55,265 · 고 22,627로 ", "3칸뿐 금액이 없습니다", ". 직업·고용형태, 흡연량(갑년)·음주 빈도는 필드 자체가 없습니다."],
    why: "같은 사실을 두 생성기가 각자 만듭니다 — 회원 레코드의 참/거짓과 관리문구의 해시 추첨. 등급은 문구 쪽을, 위험 점수는 참/거짓 쪽을 읽습니다.",
    fill: "생활 문진을 한 레코드로 모읍니다(출처: 국민건강영양조사 문항 구조 — 흡연 상태·갑년, 음주 빈도·1회 음주량, 신체활동 분/주). 소득은 금액 분위로 올립니다.",
    win: "「금연 미션 대상 N명」이 화면마다 다르지 않습니다. 양이 들어오면 위험 점수가 「피우는지」가 아니라 「얼마나 피우는지」로 계산됩니다." },
  { s: 0, ic: MapPin, c: "#38BDF8", t: "지역이 시군구 157개에서 멈춥니다",
    now: ["회원 레코드의 지역은 시도 17개뿐이고 시군구 필드 보유는 ", "10만 전건 0건", "입니다 — 조회할 때마다 별도 시드로 다시 뽑습니다. 수록 시군구는 ", "157개", "로 전국 전수가 아니며(경기 25개 등), 지점 밀도 가중 때문에 편차가 큽니다 — 인천 남동구 3,419명 대 울산 울주군 60명으로 ", "57배", "입니다. 읍면동·좌표는 없습니다."],
    why: "가구를 만들 때 시도만 뽑아 저장하고 시군구는 저장하지 않습니다. 시군구 추첨은 지점 수에 가중을 걸기 때문에 지점이 많은 구로 회원이 쏠립니다.",
    fill: "행정표준코드(행정안전부 법정동·행정동)로 시군구·읍면동을 회원 레코드에 고정 부여하고, 분포를 주민등록 인구로 맞춥니다.",
    win: "지역단 16 · 지점 272와 같은 코드 축에서 커버리지 공백이 계산됩니다. 방문 돌봄·검진기관 거리 같은 거리 기반 기능의 전제도 여기서 생깁니다." },
  { s: 0, ic: HeartHandshake, c: "#F59E0B", t: "가구는 채워졌지만 관계 폭이 5종입니다",
    now: ["가구 ", "33,748개", " · 평균 2.96명 · 가구 식별자 누락 0건입니다(1인 5,042 · 2인 10,534 · 3인 6,152 · 4인 5,332 · 5인 6,022 · 6인 666). 비어 있는 것은 관계의 폭입니다 — ", "5종", "뿐으로(가구주 33,748 · 자녀 36,931 · 배우자 24,604 · 모 3,382 · 부 1,335) 형제·손자녀·비동거 가족이 없고 가구끼리 잇는 축도 없습니다."],
    why: "가구 유형 6종을 뽑아 그 안에서만 구성원을 만들고, 가구를 만든 뒤 가구끼리 잇는 단계가 없습니다. 소득은 가구에서 한 번 뽑아 구성원 전원에 복사합니다.",
    fill: "형제·손자녀·비동거 부모를 관계 간선으로 추가하고, 자녀가 새 가구를 만들 때 원가구와의 간선을 남깁니다. 가구 소득과 개인 소득을 분리합니다.",
    win: "「떨어져 사는 부모 돌봄」 같은 핵심 시나리오에 데이터 근거가 생깁니다. 한 회원의 접촉이 몇 가구로 번지는지도 계산됩니다." },
  { s: 1, ic: Clock, c: "#A78BFA", t: "시계열이 없습니다 — 금고 1시점 · 전원 같은 날짜",
    now: ["금고에 저장되는 검진은 회원당 ", "1건", "이고 날짜가 ", "전원 2025-11-01", "로 같습니다(표본 200명 전수 확인). 엔진은 항목당 3시점을 만들지만 과거 2점은 현재값에 비율을 곱해 거꾸로 만든 값입니다. 추세 라벨은 번호 해시여서 개선 33,375 · 안정 33,228 · 악화 33,397로 ", "거의 3등분", "됩니다. 수검 이력(연도·기관·채널) 레코드는 없습니다."],
    why: "생성기가 「지금 상태」만 만들고 과거를 만들지 않습니다. 과거를 먼저 만들고 현재를 파생시키는 순서가 아니라 그 반대입니다.",
    fill: "건강정보 고속도로(보건복지부 마이헬스웨이)를 붙입니다 — 회원 동의 기반 진료·투약·검사 수신의 공식 관문이고 과거 검진이 함께 내려옵니다. 인벤토리 상태 「계획」·D-2 핵심입니다.",
    win: "추이가 사실이 되면 재산정과 「지난번 대비」 문장이 데이터에서 나옵니다. 1세대(원본)가 여러 시점으로 쌓이면 2세대(AI 분석)의 계보도 시점을 갖습니다." },
  { s: 1, ic: Pill, c: "#F472B6", t: "약제·처방·의료이용 기록이 없습니다",
    now: ["약 이름이 붙는 사전이 9종뿐이라 질병 ", "192종 중 12종 · 86,635건 중 8,163건(9.4%)", "에만 약이 붙습니다. 그 매칭도 이름이 일부만 겹치면 붙어서 갑상선암·당뇨병성신경병증에까지 같은 약이 달립니다(이름 매칭의 한계 — 코드 매칭으로 바꿔야 하는 자리). 외래·입원·수술·청구는 회원 레코드에 ", "필드 자체가 없습니다", ". 진료 행은 전건 ", "35,348건", "(진료가 1건 이상인 회원 28,633명)이고 그 행에 날짜가 ", "0건", "입니다. 「예상의료비」는 산식값입니다 — 1인 평균 1,721,048원 · 중위 1,190,000원 · 합계 1,721억 원으로 ", "실제 지급액이 아닙니다", "."],
    why: "의료이용·약제를 담는 레코드가 아직 없습니다. 의료비는 등급·질병 수·나이로 계산한 추정치이고, 청구·지급 축이 없어 「예상」과 「지급」을 가를 자리도 없습니다.",
    fill: "마이헬스웨이의 진료·투약 내역과 식약처 의약품안전나라(성분·상호작용, 상태 「계획」)를 붙입니다. 의료비는 기대값과 지급액을 다른 칸에 둡니다.",
    win: "약물 상호작용·복약 순응도·재입원 위험을 다루려면 이 레코드가 전제입니다(판정 로직은 별도 과제이고, 상호작용 안내는 교육용 정보이며 진단·처방이 아닙니다 — 복용 금기·상호작용은 개인 복용약에 따라 다르니 의사·약사와 상담하세요). 청구 심사의 진료일 축도 실데이터를 얻고, 3세대(활용 기록)의 빈 자리가 채워집니다." },
  { s: 1, ic: Server, c: "#7DD3FC", t: "보유 계약이 조회가 아니라 추정입니다",
    now: ["등재된 외부 원천 ", "13종", " 중 실제로 데이터가 흐르는 것은 ", "2종", "입니다(심평원 병원정보 「사용 중」 · 통계 「일부 사용 중」). ", "7종이 「계획」", "이고 1종이 「협의」(현대해상 파트너 연동)입니다 — 나머지 3종은 코호트 원천이 아닌 업무 커넥터입니다. 저장 계층 6층 · 정적 키 67 · 접두 키 54 · 키 그룹 10은 이미 등재돼 게이트가 돌고 있습니다."],
    why: "저장이 전부 브라우저 안에 있어 서버 연동 관문이 없습니다. 회원 동의 기반 외부 조회는 서버 없이 받을 수 없고, 파트너 연동은 기술이 아니라 제휴 결정 축입니다.",
    fill: "D-2 서버 이관(원장 암호화 DB) 위에 신용정보원 마이데이터와 금감원 파인(내보험찾아줌)을 붙입니다 — 둘 다 인벤토리 「계획」·D-2 핵심입니다.",
    win: "위 세 번째 항목의 계층 불일치가 끝납니다 — 보유 계약과 실손 세대가 추정이 아니라 관측값이 되기 때문입니다." },
  { s: 2, ic: Phone, c: "#34D399", t: "행동·결과가 기록이 아니라 추첨입니다",
    now: ["프로 활동 결과 저장소가 ", "전건 0", "입니다 — 결과 7코드 각 0건, 골든타임 전달 체크 6칸 각 0건, 연결 수락율 산출 불가입니다. 저장 위치가 기기 브라우저라 시연 기기를 바꾸면 0부터 시작합니다. 여정 8단계는 선언한 비율을 추첨한 것이라 분포가 선언값과 ", "거의 같습니다", "(D1 54,780 ≈ 55,000 · D2 7,120 ≈ 7,000 · L8 399 ≈ 400). 응답 시각·통화 성공 여부는 저장 키 자체가 없습니다."],
    why: "결과·접촉·열람이 그 기기의 브라우저에만 쓰이고 서버 집계가 없습니다. 접촉 이력은 회원 축으로만 키가 잡혀 조직·프로로 묶을 열이 없습니다.",
    fill: "D-2 서버 이관의 1순위로 올립니다 — 결과·접촉·열람을 서버 레코드로 올리고 행마다 조직·사번·발생 시각을 함께 적습니다. 담을 그릇(결과 7코드 · 전달 체크 6칸)은 이미 정의돼 있어 옮기는 일입니다.",
    win: "이행율 · 48시간 응답 준수율 · 연결 수락율의 분자가 처음 생깁니다. 여정이 「가정한 퍼널」에서 「관측한 퍼널」이 되고 지점·대본별 비교가 가능해집니다." },
  { s: 2, ic: KeyRound, c: "#6EE7B7", t: "동의율은 이미 나오지만 「언제 받았는지」가 없습니다",
    now: ["동의 보유는 종류별로 이미 산출되고 종류마다 분포가 다릅니다 — 전건 실측으로 건강관리 서비스 ", "78.0%(77,994명)", " · 만기 보장분석 70.0%(70,012) · 안내·권유 9.1%(9,059) · 광고 채널 각 45.0% · 영상 상담 30.1% · 민감정보 마케팅 ", "0%(받지 않는 동의)", "입니다. 운영본부의 T5 동의율도 같은 원천에서 나와 이미 화면에 출하돼 있습니다 — 만기 도달 16,472명 중 9,059명 ", "55.0%", ". 비어 있는 것은 ", "종류별 취득 시각과 철회·만료 이력", "입니다 — 코호트는 회원 번호에서 파생한 보유 여부라 날짜가 없고, 금고 쪽에는 고정값 한 벌(건강 참 · AI 참 · 마케팅 거부)에 타임스탬프 1개뿐입니다."],
    why: "코호트에 실기록을 둘 자리가 없어(기록이 기기 저장이라) 시드 파생 보유로 대체했습니다. 회귀 검사의 재현성을 지키는 선택이었지만, 동의를 언제 받았고 언제 철회했는지는 말할 수 없습니다.",
    fill: "시드 파생 보유를 실동의 레코드로 교체합니다 — 종류 8종·범위·효력 기간은 동의 사전에 이미 명문화돼 있으니 새로 만들 것은 취득 시각·철회 시각·증빙 id의 실기록입니다(60일 사이클 리뉴얼의 잔여 항목 「실동의 연동」과 같은 일). 1세대 자산 SBT 발급 트리거를 그 레코드에 묶습니다.",
    win: "1세대(원본 제공 동의 시점) 계보가 실제 시각을 갖습니다 — 지금은 발급 시점이 될 사건이 데이터에 없습니다. 동의 만료·철회로 접촉 적법성이 바뀌는 순간도 자동으로 끊깁니다." },
  { s: 2, ic: FileText, c: "#FCD34D", t: "제공 DB에 빈 칸이 많습니다 — 모집단이 앞단에 몰려서입니다",
    now: ["38필드 사전 밖 필드와 건강 상태 값의 유입은 ", "0건", "입니다(비민감 스캔 500명 통과). 다만 전건으로 세면 ", "21,925명(21.9%)", "은 사이클 전이라 행 자체가 생기지 않고, 행이 생긴 78,075명에서도 ", "16필드", "에 결측이 있습니다 — 상담 요청 시각 94.9% · 절감 여지 89.5% · 무보장 경과일 86.3% · 보유계약·보장공백·중복·보험료·분석 시각·동의 id·승환 창 각 76.9% · 세그먼트 코드 46.0% · 결과 수령 시각·경과일 각 42.1% · 만기일·잔여일 각 24.3% · 검진 실시일 10.6%."],
    why: "보장맵에서 파생되는 7필드는 사이클이 만기 D-20 이상일 때만 계산됩니다. 결측은 결함이 아니라 모집단이 사이클 앞단에 몰린 결과입니다.",
    fill: "두 갈래입니다 — 지금 할 수 있는 것은 필드별 기대 채움률과 결측 사유 코드를 제공 계약서에 함께 적는 것이고(「값이 없다」와 「아직 그 시점이 아니다」는 다릅니다), 사이클 분포가 올라 결측이 줄어드는 것은 실제 검진 예약·실시 실적이 쌓인 뒤입니다.",
    win: "받는 쪽이 빈 칸을 0으로 오해하지 않고 리드 우선순위를 걸 수 있습니다. 결측 사유가 붙으면 「만기 전이라 보장맵이 없다」와 「계약이 없어 못 만든다」가 구분됩니다." },
];
function OntGapRoadmap({ agg }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Database size={15} color="#22D3EE" /> 데이터 보강 로드맵 <span>· 코호트 {agg.n.toLocaleString()}명 전건 실측(2026-10-23) · 금고 레코드만 표본 200명(인덱스 1~200) · 보강 항목 {ONT_GAPS.length}건</span></div>
      <div className="ontchips" style={{ marginBottom: 10 }}>
        <span className="ontgap-synth"><ShieldCheck size={12} /> 파일럿 코호트 · 이름·식별자는 가명으로 표시 · 결정적 시드 생성 · 실제 개인정보가 아닙니다</span>
      </div>
      <p className="scdesc">지금 이 코호트로 증명되는 것은 <b>규모에서 동작한다</b>는 사실입니다 — <b>파일럿 체험회원 {agg.n.toLocaleString()}명(파일럿 코호트)</b>이 가구 <b>33,748개</b>로 묶여 있고 질병 <b>192종 86,635건</b>, 검진 <b>23항목 2,248,809건</b> 판정이 전건 결정론으로(같은 번호는 항상 같은 레코드) 조립됩니다. 자동 스캔은 <b>성별·연령·가족 규칙</b> 위반 0건이고(계층 사이의 정합은 아래 세 번째 항목이 따로 보고합니다), 보험 생성기는 <b>스스로 선언한 목표 평균에 ±2% 수렴</b>합니다(외부 통계와의 대조는 아직 하지 않았습니다). <b>아직 증명되지 않은 것은 그 숫자가 사실인지입니다.</b> 아래는 무엇이 비어 있고 · 왜 비었고 · 무엇으로 채우며 · 채우면 무엇이 가능해지는지입니다. 모든 수치는 이 코호트를 직접 센 값이고, 외부 통계는 괄호로 출처만 적어 구분했습니다.</p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ontmsub" style={{ width: "auto", padding: "6px 14px" }} onClick={() => setOpen(!open)}>{open ? "접기" : "보강 항목 " + ONT_GAPS.length + "건 펼치기"}</button>
      </div>
      {open && ONT_GAP_STAGES.map(([no, title, sub, c], si) => (
        <div key={no}>
          <div className="ontgap-st"><b style={{ color: c }}>{no}</b><b>{title}</b><span>{sub}</span><em>{ONT_GAPS.filter((g) => g.s === si).length}건</em></div>
          {ONT_GAPS.filter((g) => g.s === si).map((g, i) => (
            <div className="ontgap-i" key={i} style={{ borderLeftColor: g.c }}>
              <span className="ontgap-ic" style={{ background: g.c + "1A" }}><g.ic size={15} color={g.c} /></span>
              <div className="ontgap-b">
                <div className="ontgap-t">{g.t}</div>
                <p><em>지금</em>{g.now.map((x, j) => (j % 2 ? <b key={j}>{x}</b> : <React.Fragment key={j}>{x}</React.Fragment>))}</p>
                <p><em>왜</em>{g.why}</p>
                <p><em>무엇으로</em>{g.fill}</p>
                <p><em>채우면</em>{g.win}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="ontgap-done">※ <b>이미 선 것은 할 일에 넣지 않았습니다</b> — 데이터 카탈로그 단일 소스와 미등재 저장 키 커밋 차단 게이트(6계층 · 정적 키 67 · 접두 키 54 · 키 그룹 10 · 외부 소스 13종), 회원 360뷰 1콜 조립(표본 3,000건 실패 0)은 <b>D-1(2026-08-30) 완료·배포</b>입니다. 그 밖의 것은 각각 다른 때 들어갔습니다 — 전건 결정론과 성별·연령·가족 정합성 감사(위반 0 · 0 · 0)는 <b>가구 구조 신설(2026-07-03)</b>, 보험 생성기 자가검증 9항목은 <b>보험 데이터셋 구축(2026-07-25)</b>, 검진 결과 대기 회원을 「등급 없음」과 섞지 않는 분리와 본인 계정 실측 단일 원천 격리는 <b>2026-10-06 대표 지시</b>로 배포됐습니다. 다음 관문은 <b>D-2 서버 이관</b>이고, 위 2단계는 그 위에서 · 3단계는 실회원 운영이 시작된 뒤에 채워집니다. 세대 구분은 <b>1세대 원본 → 2세대 AI 분석 → 3세대 활용 기록</b>을 그대로 씁니다.</div>
    </div>
  );
}

function OntologySection({ onGo }) {
  const [top, setTop] = useState("health");
  const [sub, setSub] = useState("overview");
  const [seg, setSeg] = useState(null);
  const cohort = React.useMemo(() => (typeof pilotCohort === "function" ? pilotCohort() : []), []);
  const agg = React.useMemo(() => (typeof pilotAgg === "function" ? pilotAgg() : null), []);
  const goSeg = (k) => { setSeg(k); setTop("health"); setSub("explorer"); };
  const topTabs = [["health", "헬스케어 온톨로지", HeartPulse, "#E11D48"], ["supply", "공급망 온톨로지", Truck, "#0891B2"], ["finance", "재무회계", Landmark, "#F59E0B"], ["marketing", "마케팅", Megaphone, "#EC4899"], ["bizops", "사업 운영", Target, "#7C3AED"], ["foundation", "HI-Fin 기반 온톨로지", ShieldCheck, "#0EA5E9"], ["ops", "운영 콘솔", Activity, "#DC2626"], ["dataops", "데이터 운영", Database, "#0891B2"], ["whitepaper", "백서", BookOpen, "#6366F1"]];
  const healthTabs = [["overview", "코호트 개요", Activity], ["intel", "상담 인텔리전스", MessageSquare], ["live", "실시간 시뮬레이션", Zap], ["explorer", "데이터 하우스", Search], ["chain", "블록체인 금고", Blocks], ["hiops", "하이 커버리지", Bot], ["kb", "AI KB 라운지", Database], ["graph", "온톨로지 관계", Network], ["actions", "액션", Sparkles]];
  if (!agg) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="ontohero">
        <div className="ontohero-bg"><span /><span /></div>
        <div className="ontohero-l">
          <span className="ontotag"><Network size={13} /> Ontology Operations · Palantir-style</span>
          <div className="ontotitle">온톨로지 · 하네스 운영시스템</div>
          <p><b>헬스케어 · 공급망 · 재무회계 · 마케팅</b>을 하나의 <b>객체·관계·액션</b> 온톨로지로 통합 운영합니다 — 파일럿 <b>{agg.n.toLocaleString()}명</b> 코호트부터 거래처·제품·주문·정산까지 하나의 지식그래프로 연결됩니다.</p>
        </div>
        <div className="ontohero-kpi">
          <div><b>{agg.n.toLocaleString()}</b><span>회원 객체</span></div>
          <div><b>{Object.keys(agg.byDisease).length}</b><span>질병 유형</span></div>
          <div><b>{ontWon(agg.totalCost)}</b><span>총 예상의료비</span></div>
        </div>
      </div>

      <div className="chtabs lv1" style={{ marginTop: 14 }}>{topTabs.map(([k, t, Ic, c]) => (
        <div key={k} className={`chtab ${top === k ? "on" : ""}`} style={{ "--cc": c }} onClick={() => setTop(k)}>
          <span className="ch-ic"><Ic size={19} /></span><span className="ch-t">{t}</span>
        </div>
      ))}</div>

      {top === "health" && <>
        <div className="ontobjbar">
          {[["회원", agg.n, "#22D3EE", Users], ["가구", agg.households, "#F59E0B", HeartHandshake], ["진료과목", Object.keys(agg.byDept).length, "#6366F1", Stethoscope], ["질병", Object.keys(agg.byDisease).length, "#F472B6", HeartPulse], ["검진지표", (typeof CHECKUP_ITEMS !== "undefined" ? CHECKUP_ITEMS.length : 23), "#34D399", Activity], ["지역", 17, "#38BDF8", MapPin]].map(([t, n, c, Ic], i) => (
            <div className="ontobj" key={i}><span className="ontobj-i" style={{ background: c + "1A" }}><Ic size={16} color={c} /></span><div><b>{Number(n).toLocaleString()}</b><span>{t}</span></div></div>
          ))}
        </div>
        <div className="aitabs" style={{ margin: "12px 0" }}>{healthTabs.map(([k, t, Ic]) => <div key={k} className={`aitab ${sub === k ? "on" : ""}`} onClick={() => setSub(k)}><Ic size={14} /> {t}</div>)}</div>
        {sub === "overview" && <OntOverview agg={agg} onSeg={goSeg} />}
        {sub === "intel" && <ConsultIntel onGo={onGo} />}
        {sub === "live" && <OntoLiveSim cohort={cohort} agg={agg} onGo={onGo} />}
        {sub === "explorer" && <OntExplorer cohort={cohort} onGo={onGo} seg={seg} />}
        {sub === "chain" && typeof BlockchainAnchorConsole === "function" && <BlockchainAnchorConsole cohort={cohort} />}
        {sub === "hiops" && typeof AgentOpsConsole === "function" && <AgentOpsConsole />}
        {sub === "kb" && <AIKBLounge onGo={onGo} />}
        {sub === "graph" && <div className="ontpanel"><div className="ontph"><Network size={15} color="#22D3EE" /> 온톨로지 스키마 (객체 · 관계)</div><OntGraph agg={agg} /></div>}
        {sub === "actions" && <OntActions agg={agg} onSeg={goSeg} />}
        {/* 종전 데이터 성격 고지 문단 → 데이터 보강 로드맵으로 교체(형 지시 2026-10-23). 최소 표식은 블록 머리 칩으로 유지. */}
        <OntGapRoadmap agg={agg} />
      </>}
      {top === "supply" && <SupplyOntology onGo={onGo} onTab={(k) => setTop(k)} />}
      {top === "finance" && <FinanceSection onGo={onGo} />}
      {top === "marketing" && <MarketingSection onGo={onGo} />}
      {top === "bizops" && typeof BizOpsConsole === "function" && <BizOpsConsole onGo={onGo} />}
      {top === "foundation" && <FoundationOntology onGo={onGo} />}
      {/* [Phase G] 운영 콘솔 — 에이전트 메시 관제(관리자 전용 섹션 안이라 권한을 그대로 상속한다) */}
      {top === "ops" && typeof OpsConsoleSection === "function" && <OpsConsoleSection />}
      {/* 데이터 운영 관제(운영계획 v1.1의 시스템화) — 원천=dataCatalog.js, 관측 전용 */}
      {top === "dataops" && typeof DataOpsConsole === "function" && <DataOpsConsole />}

      {top === "whitepaper" && <WhitepaperSection onGo={onGo} />}
    </div>
  );
}
