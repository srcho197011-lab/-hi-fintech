/* ====================== 공급망 온톨로지 (Ontology · Harness 하위) ======================
   ★ 핵심 모델: 무재고(Asset-light) · 거래처 직배송(Dropship)
   - 제품은 거래처(공급사)가 보유하고 고객에게 '직접 배송'한다.
   - 당사는 재고 부담(보유·창고·재고자산 리스크)을 지지 않는다.
   - 당사의 역할 = 주문·데이터·정산 오케스트레이션(플랫폼) + 공급사 가용재고 '가시성(조회)'.
   팔란티어 파운드리형 스키마 — 객체/키 프로퍼티 + ERP·CRM·물류 연결 + 책임 AI 에이전트 + 개념도. */

const SC_OBJECTS = [
  { id: "vendor", t: "거래처 · 공급사 (Vendor)", c: "#A78BFA", sys: ["ERP"], ic: Factory, tag: "제품 공급 + 직배송 주체", props: ["거래처ID (PK)", "사업자등록번호", "유형 · 제조/유통/브랜드", "여신한도 · 미지급금", "★ 직배송(출고·배송) 수행"] },
  { id: "product", t: "제품 · SKU (Product)", c: "#FBBF24", sys: ["ERP"], ic: Package, tag: "거래처 소유 품목", props: ["SKU (PK)", "품목명 · 카테고리", "공급가 · 판매가(마진)", "유통기한 · 로트", "공급 거래처(FK)"] },
  { id: "avail", t: "공급사 가용재고 (Availability)", c: "#22D3EE", sys: ["ERP", "물류"], ic: Boxes, tag: "★ 당사 미보유 · 실시간 조회", props: ["거래처×SKU (PK)", "가용수량(공급사 보유)", "재고 API 조회시각", "출고 가능 리드타임", "당사 재고자산 = 0"] },
  { id: "contract", t: "계약 · 단가 (Contract)", c: "#2DD4BF", sys: ["ERP"], ic: ScrollText, tag: "공급단가·마진·직배송 조건", props: ["계약ID (PK)", "거래처·품목 공급단가", "판매 마진율", "직배송 SLA(출고 D+)", "정산 주기 · 수수료"] },
  { id: "account", t: "고객 · 계정 (Account)", c: "#F472B6", sys: ["CRM"], ic: Users, tag: "구매·수령 주체", props: ["계정ID (PK)", "세그먼트 · 개인/기업/병원/약국", "등급 · LTV", "담당 영업", "배송지 · 이탈스코어"] },
  { id: "order", t: "주문 (Order)", c: "#6366F1", sys: ["ERP", "CRM"], ic: ClipboardList, tag: "★ 당사 플랫폼 중개", props: ["주문ID (PK)", "계정 · 품목 · 수량", "판매액 · 마진", "라우팅 거래처(FK)", "상태 · 접수→발주전달→배송"] },
  { id: "shipment", t: "배송 (Shipment)", c: "#38BDF8", sys: ["물류"], ic: Truck, tag: "★ 거래처 → 고객 직배송", props: ["배송ID (PK)", "출고 거래처(FK)", "운송사 · 송장번호", "상태 · 집화/배송중/완료", "ETA · 실배송시각"] },
  { id: "payment", t: "정산 (Settlement)", c: "#F59E0B", sys: ["ERP", "회계"], ic: Receipt, tag: "플랫폼 수수료·마진 + 거래처 대금", props: ["전표ID (PK)", "판매대금 수취", "거래처 공급대금 지급", "플랫폼 수수료·마진", "세금계산서 · 정산주기"] },
];

const SC_LINKS = [
  ["제품", "공급", "거래처·공급사"], ["거래처·공급사", "실시간 조회", "공급사 가용재고"], ["계약·단가", "적용", "주문"],
  ["고객·계정", "발주", "주문"], ["공급사 가용재고", "가용확인", "주문"], ["주문", "발주전달", "거래처·공급사"],
  ["거래처·공급사", "★직배송", "배송"], ["배송", "도착", "고객·계정"], ["주문", "정산", "정산"],
];

const SC_SYSTEMS = [
  { id: "erp", t: "ERP 연결", sub: "거래처 · 계약 · 주문 · 정산", c: "#34D399", ic: Landmark, ex: "더존 iCUBE · SAP · 영림원", objs: ["거래처", "제품", "계약", "주문", "정산"], sync: "실시간 양방향 · 마스터 골든레코드", note: "★ 당사 재고원장 없음 — 재고는 '공급사 가용재고 API'로 조회만" },
  { id: "crm", t: "CRM 연결", sub: "계정 · 고객 · 영업기회", c: "#F472B6", ic: Users, ex: "Salesforce · HubSpot · 자체 CRM", objs: ["고객·계정", "주문"], sync: "세그먼트 · 파이프라인 동기화", note: "계정 360°(주문·직배송·정산 이력) 통합 뷰" },
  { id: "wms", t: "물류 연결", sub: "거래처 직배송 추적 (TMS)", c: "#38BDF8", ic: Truck, ex: "스마트택배 · CJ대한통운 API · 거래처 WMS", objs: ["배송", "공급사 가용재고"], sync: "거래처 출고 웹훅 · 실시간 배송추적", note: "★ 당사 창고·물류센터 없음 — 거래처 출고 기준으로 송장·ETA 스트리밍" },
];

const SC_AGENTS = [
  { id: "orch", t: "공급망 오케스트레이터", c: "#22D3EE", ic: Workflow, scope: "무재고 발주 라우팅 · 공급사 가용재고 가시성", sys: ["ERP", "물류"], owns: ["주문", "공급사 가용재고", "거래처·공급사"], kpi: ["가용재고 정확도 ↑", "발주 자동화율 ↑", "품절·오배정 ↓"], guard: "최적 거래처 자동배정 · 예외 시 인간 승인(HITL)" },
  { id: "vrisk", t: "거래처 리스크 에이전트", c: "#A78BFA", ic: ShieldCheck, scope: "공급 신뢰도 · 여신 · 대금 모니터링", sys: ["ERP"], owns: ["거래처·공급사", "정산"], kpi: ["직배송 이행률 ↑", "미지급 오류 0", "공급 지연 조기경보"], guard: "거래중지·대체공급 전환은 감사로그 + 승인" },
  { id: "growth", t: "고객 성장 에이전트", c: "#F472B6", ic: TrendingUp, scope: "세그먼트 · 업셀 · 이탈 방지", sys: ["CRM"], owns: ["고객·계정", "주문"], kpi: ["재구매율 ↑", "이탈률 ↓", "LTV ↑"], guard: "발송·할인은 동의·정책 검증 후 실행" },
  { id: "logi", t: "직배송 관제 에이전트", c: "#38BDF8", ic: Route, scope: "거래처 출고~고객 ETA · 지연 예외 관제", sys: ["물류"], owns: ["배송"], kpi: ["정시 직배송률 ↑", "출고 리드타임 ↓", "예외 대응시간 ↓"], guard: "대체 거래처·재배송 전환은 비용영향 리포트 후" },
  { id: "settle", t: "정산·컴플라이언스 에이전트", c: "#F59E0B", ic: ScrollText, scope: "수수료·마진 정산 · 거래처 대금 · 규정 검증", sys: ["ERP", "회계"], owns: ["정산"], kpi: ["정산 정확도 ↑", "마감 리드타임 ↓", "규정 위반 0"], guard: "세금계산서 발행·대금지급은 회계 승인 게이트" },
];

/* ── 개념도(Concept Map) — 무재고·거래처 직배송 강조 ── */
function SupplyGraph() {
  const SYS = [
    { id: "erp", t: "ERP", sub: "거래처·계약·정산", x: 120, y: 56, c: "#34D399" },
    { id: "crm", t: "CRM", sub: "계정·주문", x: 430, y: 56, c: "#F472B6" },
    { id: "wms", t: "물류 TMS", sub: "직배송 추적", x: 612, y: 232, c: "#38BDF8" },
  ];
  const OBJ = [
    { id: "product", t: "제품", x: 120, y: 168, c: "#FBBF24" },
    { id: "vendor", t: "거래처·공급사", x: 150, y: 300, c: "#A78BFA", big: 1 },
    { id: "avail", t: "가용재고", x: 120, y: 424, c: "#22D3EE", dash: 1 },
    { id: "contract", t: "계약·단가", x: 300, y: 424, c: "#2DD4BF" },
    { id: "account", t: "고객·계정", x: 430, y: 150, c: "#F472B6" },
    { id: "order", t: "주문", x: 400, y: 290, c: "#6366F1", big: 1 },
    { id: "payment", t: "정산", x: 470, y: 424, c: "#F59E0B" },
    { id: "shipment", t: "배송", x: 600, y: 372, c: "#38BDF8" },
  ];
  const P = Object.fromEntries([...SYS, ...OBJ].map((n) => [n.id, n]));
  // 실선 플로우(핵심 직배송 경로는 hot=true 강조)
  const oLinks = [
    ["product", "vendor", "공급", 0], ["contract", "order", "단가", 0],
    ["account", "order", "발주", 0], ["order", "vendor", "발주전달", 1],
    ["vendor", "shipment", "★직배송", 1], ["shipment", "account", "배송", 1], ["order", "payment", "정산", 0],
  ];
  // 점선(무재고 가시성 조회)
  const visLinks = [["vendor", "avail", "실시간조회"], ["avail", "order", "가용확인"]];
  const sLinks = [["erp", "vendor"], ["erp", "contract"], ["erp", "payment"], ["crm", "account"], ["crm", "order"], ["wms", "shipment"]];
  return (
    <div className="ontgraph scgraph">
      <svg viewBox="0 0 700 490" style={{ width: "100%", height: "auto", display: "block" }}>
        {sLinks.map(([a, b], i) => { const A = P[a], B = P[b]; return <line key={"s" + i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={A.c} strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="4 4" />; })}
        {visLinks.map(([a, b, lbl], i) => { const A = P[a], B = P[b]; return (<g key={"v" + i}><line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#22D3EE" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="2 4" /><text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} fill="#5FC9DE" fontSize="9" fontWeight="700" textAnchor="middle">{lbl}</text></g>); })}
        {oLinks.map(([a, b, lbl, hot], i) => { const A = P[a], B = P[b]; return (<g key={"o" + i}><line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hot ? "#F59E0B" : "#33456A"} strokeWidth={hot ? "2.6" : "1.6"} /><text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} fill={hot ? "#FBBF24" : "#9AA9C6"} fontSize={hot ? "10" : "9.3"} fontWeight={hot ? "800" : "700"} textAnchor="middle">{lbl}</text></g>); })}
        {SYS.map((s) => (<g key={s.id}>
          <rect x={s.x - 58} y={s.y - 20} width="116" height="40" rx="9" fill="#101f3c" stroke={s.c} strokeWidth="1.8" />
          <text x={s.x} y={s.y - 2} fill="#EAF2FF" fontSize="12" fontWeight="900" textAnchor="middle">{s.t}</text>
          <text x={s.x} y={s.y + 11} fill={s.c} fontSize="8" fontWeight="700" textAnchor="middle">{s.sub}</text>
        </g>))}
        {OBJ.map((n) => (<g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.big ? 33 : 29} fill="#0F1B33" stroke={n.c} strokeWidth={n.big ? 2.6 : 2} strokeDasharray={n.dash ? "3 3" : "none"} />
          <text x={n.x} y={n.y + 4} fill="#EAF2FF" fontSize={n.t.length > 4 ? "9.5" : "10.5"} fontWeight="800" textAnchor="middle">{n.t}</text>
        </g>))}
      </svg>
      <div className="scmodelbadge"><Boxes size={13} /> 무재고(Asset-light) · 거래처 직배송(Dropship) — <b>당사 재고 부담 0</b></div>
      <div className="ontgraph-note">Object Types <b>8</b> · Links <b>{SC_LINKS.length}</b> · Systems <b>3</b> · Agents <b>5</b> — <b style={{ color: "#FBBF24" }}>주문→거래처→배송→고객</b>의 <b>직배송(주황 경로)</b>이 핵심입니다. 제품·재고는 <b style={{ color: "#22D3EE" }}>거래처(공급사)가 보유</b>하고, 당사는 <b style={{ color: "#22D3EE" }}>가용재고를 조회(점선)</b>만 하며 <b>재고자산·창고를 두지 않습니다.</b> 당사 = 주문·데이터·정산 오케스트레이션 플랫폼.</div>
    </div>
  );
}

/* ── 실시간 시뮬레이션: 주문→출고→배송→정산 이벤트 스트림 ── */
function SupplyLiveSim() {
  const D = React.useMemo(() => (typeof supplyData === "function" ? supplyData() : null), []);
  const [play, setPlay] = useState(false);
  const [ev, setEv] = useState([]);
  const [live, setLive] = useState({ ord: 0, gmv: 0, ship: 0 });
  const tick = React.useRef(0);
  useEffect(() => {
    if (!play || !D) return;
    const id = setInterval(() => {
      const t = ++tick.current;
      const p = D.products[(t * 7919) % D.products.length];
      const qty = 1 + (t % 4); const amt = p.salePrice * qty;
      const acts = [["주문 접수", "#38BDF8"], ["출고 지시(거래처)", "#FBBF24"], ["직배송 시작", "#818CF8"], ["배송 완료", "#34D399"], ["정산 반영", "#F59E0B"]];
      const [act, c] = acts[t % acts.length];
      setLive((s) => ({ ord: s.ord + (act === "주문 접수" ? 1 : 0), gmv: s.gmv + (act === "주문 접수" ? amt : 0), ship: s.ship + (act === "배송 완료" ? 1 : 0) }));
      setEv((e) => [{ id: t, act, c, txt: p.vendorName + " · " + p.name + " ×" + qty + " · " + _scW(amt) }, ...e].slice(0, 10));
    }, 850);
    return () => clearInterval(id);
  }, [play, D]);
  if (!D) return null;
  return (
    <div className="ontpanel scsim" style={{ marginTop: 12 }}>
      <div className="ontph"><Zap size={15} color="#FBBF24" /> 실시간 시뮬레이션 · Live Simulation <span>· 주문→출고→직배송→정산 이벤트 스트림</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          <button className="scsimbtn" onClick={() => setPlay((p) => !p)}>{play ? <><Pause size={13} /> 일시정지</> : <><Play size={13} /> 재생</>}</button>
          <button className="scsimbtn ghost" onClick={() => { setPlay(false); setEv([]); setLive({ ord: 0, gmv: 0, ship: 0 }); tick.current = 0; }}><RotateCcw size={13} /> 리셋</button>
        </span>
      </div>
      <div className="scsimkpi">
        <div><b style={{ color: "#38BDF8" }}>{live.ord.toLocaleString()}</b><span>실시간 신규 주문</span></div>
        <div><b style={{ color: "#34D399" }}>{_scW(live.gmv)}</b><span>실시간 거래액</span></div>
        <div><b style={{ color: "#818CF8" }}>{live.ship.toLocaleString()}</b><span>직배송 완료</span></div>
        <div><b style={{ color: play ? "#FBBF24" : "#64748B" }}>{play ? "● LIVE" : "○ 정지"}</b><span>스트림 상태</span></div>
      </div>
      <div className="scfeed">{ev.length === 0 ? <div className="scempty">재생을 누르면 실시간 거래 이벤트가 흐릅니다.</div> : ev.map((x) => <div className="scfeedrow" key={x.id}><span className="scfeed-t" style={{ color: x.c, borderColor: x.c }}>{x.act}</span><span className="scfeed-x">{x.txt}</span></div>)}</div>
    </div>
  );
}
/* ── 책임 AI 에이전트 + 액션 실행 ── */
const SC_AGENT_ACTIONS = {
  orch: [{ t: "자동발주 실행", run: (D) => ({ msg: "품절임박 " + D.availability.filter((a) => a.qty < 80).length + "건 → 최적 거래처 자동발주 생성", hitl: true }) }, { t: "가용재고 새로고침", run: (D) => ({ msg: "공급사 가용재고 API 재조회 · " + D.counts.availability + "개 SKU 동기화" }) }],
  vrisk: [{ t: "여신 재평가", run: (D) => ({ msg: "거래처 " + D.counts.vendor + "곳 신용 스코어 재산정 · 여신초과 0건", hitl: true }) }, { t: "미수 알림 발송", run: () => ({ msg: "연체 거래처 대상 미수 알림 발송 예약" }) }],
  growth: [{ t: "이탈위험 캠페인", run: () => ({ msg: "이탈스코어 상위 세그먼트 리텐션 캠페인 생성", hitl: true }) }, { t: "업셀 추천 생성", run: () => ({ msg: "재구매 주기 도달 계정 업셀 추천 배치 생성" }) }],
  logi: [{ t: "지연 배송 재배차", run: (D) => ({ msg: "지연 예상 " + Math.round(D.counts.shipment * 0.03) + "건 → 대체 운송사 재배차 제안", hitl: true }) }, { t: "ETA 재예측", run: () => ({ msg: "진행 중 배송 ETA 재예측 완료" }) }],
  settle: [{ t: "월 정산 마감", run: () => ({ msg: "이번 달 거래처 정산 마감 · ERP 전표 자동 전기", hitl: true }) }, { t: "세금계산서 발행", run: () => ({ msg: "정산 완료분 세금계산서 발행 대기열 등록" }) }],
};
function SupplyAgents() {
  const D = React.useMemo(() => (typeof supplyData === "function" ? supplyData() : null), []);
  const [log, setLog] = useState([]);
  const lid = React.useRef(0);
  if (!D) return null;
  const run = (a, act) => { const r = act.run(D); const id = ++lid.current; setLog((l) => [{ id, agent: a.t, c: a.c, msg: r.msg, status: r.hitl ? "승인대기" : "실행완료" }, ...l].slice(0, 12)); if (typeof toast === "function") toast("🤖 " + a.t + " · " + r.msg); };
  const approve = (id) => { setLog((l) => l.map((x) => x.id === id ? { ...x, status: "승인완료" } : x)); if (typeof toast === "function") toast("✅ 승인 완료 · 액션 실행"); };
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Bot size={15} color="#F472B6" /> 책임 AI 에이전트 · 액션 실행 <span>· {SC_AGENTS.length} Agents · KPI·가드레일(HITL)</span></div>
      <div className="scagents">
        {SC_AGENTS.map((a) => (
          <div className="scagentcard" key={a.id} style={{ "--ac": a.c }}>
            <div className="scagenthd"><span className="scagent-i"><a.ic size={18} /></span><div><b>{a.t}</b><span>{a.scope}</span></div></div>
            <div className="scagentrow"><span className="scal">소관</span><span className="scav">{a.owns.join(" · ")}</span></div>
            <div className="scagentkpi">{a.kpi.map((k, i) => <span key={i} className="sckpi">{k}</span>)}</div>
            <div className="scactbtns">{(SC_AGENT_ACTIONS[a.id] || []).map((act, i) => <button key={i} className="scactbtn" style={{ "--ac": a.c }} onClick={() => run(a, act)}><Play size={11} /> {act.t}</button>)}</div>
            <div className="scagentguard"><ShieldCheck size={11} /> {a.guard}</div>
          </div>
        ))}
      </div>
      <div className="scjournalh" style={{ marginTop: 12 }}><Workflow size={13} /> 액션 실행 로그</div>
      <div className="scactlog">{log.length === 0 ? <div className="scempty">에이전트 카드의 액션 버튼을 눌러 실행하세요. (HITL 액션은 승인 필요)</div> : log.map((x) => (
        <div className="scactrow" key={x.id} style={{ "--ac": x.c }}>
          <span className="scact-a">{x.agent}</span><span className="scact-m">{x.msg}</span>
          {x.status === "승인대기" ? <button className="scact-appr" onClick={() => approve(x.id)}>승인</button> : <span className={"scact-st " + (x.status === "승인완료" ? "ok" : "done")}>{x.status}</span>}
        </div>
      ))}</div>
    </div>
  );
}
/* ── 거래처 360° 뷰 ── */
function Vendor360({ v, D, idx, onClose, onGo }) {
  const prods = idx.pByV[v.id] || [], conts = idx.cByV[v.id] || [], avails = idx.aByV[v.id] || [], setts = idx.sByV[v.id] || [];
  const ords = D.orders.filter((o) => o.vendorId === v.id);
  let sales = 0, mgn = 0; const st = {};
  ords.forEach((o) => { st[o.status] = (st[o.status] || 0) + 1; if (o.status !== "취소") { sales += o.amount; mgn += o.margin; } });
  const setSum = setts.reduce((s, x) => s + x.sales, 0);
  const agents = SC_AGENTS.filter((a) => a.sys.includes("ERP") || a.sys.includes("물류")).slice(0, 3);
  const kpi = [["총 거래액", _scW(sales), "#34D399"], ["주문", ords.length.toLocaleString() + "건", "#6366F1"], ["제품 SKU", prods.length, "#FBBF24"], ["정산누계", _scW(setSum), "#F59E0B"]];
  return (
    <div className="ontov" onClick={onClose}><div className="ontmodal v360" onClick={(e) => e.stopPropagation()}>
      <div className="ontmh"><div><span className="ontmid">{v.id} · {v.type} · {v.category}</span><div className="ontmname">{v.name} <span>· 360° 뷰 · 신뢰도 {v.trust} · SLA D+{v.sla}</span></div></div><button onClick={onClose}><X size={19} /></button></div>
      <div className="ontmbody">
        <div className="v360kpi">{kpi.map(([k, val, c], i) => <div key={i}><b style={{ color: c }}>{val}</b><span>{k}</span></div>)}</div>
        <div className="v360sec"><b><Package size={12} /> 제품 · SKU ({prods.length})</b><div className="v360chips">{prods.slice(0, 10).map((p) => <span key={p.id} onClick={() => { onGo("product", p.name); onClose(); }}>{p.name} · {_scW(p.salePrice)}</span>)}{prods.length > 10 && <span className="more" onClick={() => { onGo("product", v.name); onClose(); }}>+{prods.length - 10} 더보기 ›</span>}</div></div>
        <div className="v360grid2">
          <div className="v360sec"><b><ScrollText size={12} /> 계약·단가</b>{conts.map((c) => <div className="v360li" key={c.id}>{c.category} · 마진 {c.marginPct}% · 수수료 {c.feePct}% · {c.settleCycle}</div>)}</div>
          <div className="v360sec"><b><Boxes size={12} /> 공급사 가용재고 ({avails.length})</b>{avails.slice(0, 4).map((a) => <div className="v360li" key={a.id}><span style={{ color: a.qty < 30 ? "#F87171" : "#22D3EE", fontWeight: 800 }}>{a.qty}</span> · {a.skuName} · D+{a.leadDays}</div>)}</div>
        </div>
        <div className="v360sec"><b><Truck size={12} /> 주문·직배송 상태</b><div className="scpipe" style={{ height: 44 }}>{["접수", "출고준비", "배송중", "배송완료", "취소"].map((s) => { const val = st[s] || 0; return <div className="scpipe-seg" key={s} style={{ flex: Math.max(0.4, val), background: SC_ST_COLOR[s] }} title={s + " " + val}><b>{val}</b><span>{s}</span></div>; })}</div></div>
        <div className="v360grid2">
          <div className="v360sec"><b><Receipt size={12} /> 정산 ({setts.length}개월)</b>{setts.slice(-3).map((s) => <div className="v360li" key={s.id}>{s.period} · 매출 {_scW(s.sales)} · 수수료 {_scW(s.fee)} · <span style={{ color: s.status === "정산완료" ? "#34D399" : "#FBBF24" }}>{s.status}</span></div>)}</div>
          <div className="v360sec"><b><Bot size={12} /> 담당 AI 에이전트</b>{agents.map((a) => <div className="v360li" key={a.id}><span style={{ color: a.c, fontWeight: 800 }}>●</span> {a.t} <span style={{ color: "#34D399" }}>· 정상</span></div>)}</div>
        </div>
        <div className="chnote">여신한도 {_scW(v.credit)} · 미지급 {_scW(v.payable)} · 거래시작 {v.since} · ★거래처 직배송(무재고) 수행</div>
      </div>
    </div></div>
  );
}
/* ── 운영 현황판: 현재 거래·진행 중 상태 실시간 집계 ── */
const SC_ST_COLOR = { "접수": "#38BDF8", "출고준비": "#FBBF24", "배송중": "#818CF8", "배송완료": "#34D399", "취소": "#F87171" };
function _scW(n) { return (typeof ontWon === "function") ? ontWon(n) : (n || 0).toLocaleString() + "원"; }
function SupplyDashboard() {
  const D = React.useMemo(() => (typeof supplyData === "function" ? supplyData() : null), []);
  const dash = React.useMemo(() => {
    if (!D) return null;
    const prodById = {}; D.products.forEach((p) => { prodById[p.id] = p; });
    const st = {}, catSales = {}, venSales = {};
    let gmv = 0, margin = 0, active = 0, done = 0, cancel = 0, ocount = 0;
    D.orders.forEach((o) => {
      st[o.status] = (st[o.status] || 0) + 1;
      if (o.status === "취소") { cancel++; return; }
      ocount++; gmv += o.amount; margin += o.margin;
      if (o.status === "배송완료") done++; else active++;
      const p = prodById[o.sku]; const cat = p ? p.category : "기타";
      catSales[cat] = (catSales[cat] || 0) + o.amount;
      venSales[o.vendorName] = (venSales[o.vendorName] || 0) + o.amount;
    });
    const shipSt = {}; D.shipments.forEach((s) => { shipSt[s.status] = (shipSt[s.status] || 0) + 1; });
    const low = D.availability.filter((a) => a.qty < 80).sort((a, b) => a.qty - b.qty).slice(0, 8);
    let setDone = 0, setDue = 0; D.settlements.forEach((s) => { if (s.status === "정산완료") setDone += s.sales; else setDue += s.sales; });
    const venTop = Object.entries(venSales).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const cats = [["영양제", "#7C3AED"], ["홈케어의료기", "#0891B2"], ["건강식단", "#16A34A"], ["의약외품", "#0EA5E9"]].map(([c, col]) => [c, catSales[c] || 0, col]);
    return { gmv, margin, active, done, cancel, ocount, st, shipSt, low, setDone, setDue, venTop, cats };
  }, [D]);
  if (!dash) return null;
  const PIPE = ["접수", "출고준비", "배송중", "배송완료", "취소"];
  const totOrd = D.counts.order;
  const catMax = Math.max(1, ...dash.cats.map((x) => x[1]));
  const venMax = Math.max(1, ...dash.venTop.map((x) => x[1]));
  const kpis = [
    ["총 거래액(GMV)", _scW(dash.gmv), "#22D3EE"], ["플랫폼 마진", _scW(dash.margin), "#34D399"],
    ["진행 중 주문", dash.active.toLocaleString() + "건", "#818CF8"], ["배송완료율", (dash.done / dash.ocount * 100).toFixed(1) + "%", "#FBBF24"],
    ["거래 중 거래처", D.counts.vendor.toLocaleString(), "#A78BFA"], ["거래 SKU", D.counts.product.toLocaleString(), "#F472B6"],
  ];
  return (
    <div className="ontpanel scdash">
      <div className="ontph"><Gauge size={15} color="#22D3EE" /> 운영 현황판 · Live Operations <span>· 현재 거래·진행 중 현황 (주문 {totOrd.toLocaleString()}건 기준)</span></div>
      <div className="ontkpis">{kpis.map(([k, v, c], i) => <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>)}</div>
      <div className="ontgrid2" style={{ marginTop: 12 }}>
        <div className="ontpanel">
          <div className="ontph"><Workflow size={14} color="#818CF8" /> 주문 처리 파이프라인</div>
          <div className="scpipe">{PIPE.map((s) => { const v = dash.st[s] || 0; return <div className="scpipe-seg" key={s} style={{ flex: Math.max(0.5, v), background: SC_ST_COLOR[s] }} title={s + " " + v}><b>{v.toLocaleString()}</b><span>{s}</span></div>; })}</div>
          <div className="scdashnote">진행 중(접수·출고준비·배송중) <b style={{ color: "#818CF8" }}>{dash.active.toLocaleString()}건</b> · 완료 <b style={{ color: "#34D399" }}>{dash.done.toLocaleString()}건</b> · 취소 <b style={{ color: "#F87171" }}>{dash.cancel.toLocaleString()}건</b></div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Truck size={14} color="#38BDF8" /> 거래처 직배송 현황</div>
          <div className="scpipe">{["집화대기", "배송중", "배송완료"].map((s) => { const v = dash.shipSt[s] || 0; const col = s === "배송완료" ? "#34D399" : s === "배송중" ? "#818CF8" : "#FBBF24"; return <div className="scpipe-seg" key={s} style={{ flex: Math.max(0.5, v), background: col }} title={s + " " + v}><b>{v.toLocaleString()}</b><span>{s}</span></div>; })}</div>
          <div className="scdashnote">배송은 <b style={{ color: "#38BDF8" }}>거래처(공급사)가 직배송</b> — 당사 창고·재고 미경유</div>
        </div>
      </div>
      <div className="ontgrid2" style={{ marginTop: 12 }}>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={14} color="#7C3AED" /> 카테고리별 거래액</div>
          {dash.cats.map(([c, v, col]) => <OntBar key={c} label={c} value={Math.round(v / 10000)} max={Math.round(catMax / 10000)} sub="만원" color={col} />)}
        </div>
        <div className="ontpanel">
          <div className="ontph"><Factory size={14} color="#A78BFA" /> 거래처 거래액 TOP 8</div>
          {dash.venTop.map(([nm, v], i) => <OntBar key={i} label={nm} value={Math.round(v / 10000)} max={Math.round(venMax / 10000)} sub="만원" color={ONT_DEPT_COLORS ? ONT_DEPT_COLORS[i % ONT_DEPT_COLORS.length] : "#22D3EE"} />)}
        </div>
      </div>
      <div className="ontgrid2" style={{ marginTop: 12 }}>
        <div className="ontpanel">
          <div className="ontph"><AlertTriangle size={14} color="#FBBF24" /> 공급사 가용재고 부족 알림 <span>· 조회 스냅샷</span></div>
          <div className="scalerts">{dash.low.map((a) => <div className="scalert" key={a.id}><span className={"scalert-q" + (a.qty < 30 ? " crit" : "")}>{a.qty}</span><div><b>{a.skuName}</b><span>{a.vendorName} · 출고 D+{a.leadDays}</span></div><span className="scalert-tag">발주검토</span></div>)}</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Receipt size={14} color="#F59E0B" /> 정산 현황 <span>· 최근 6개월</span></div>
          <div className="scsettle"><div className="scset-c"><b style={{ color: "#34D399" }}>{_scW(dash.setDone)}</b><span>정산 완료</span></div><div className="scset-c"><b style={{ color: "#FBBF24" }}>{_scW(dash.setDue)}</b><span>정산 예정</span></div></div>
          <div className="scdashnote">정산 = 판매대금 수취 → 플랫폼 수수료·마진 차감 → <b>거래처 공급대금 지급</b> (무재고 중개 정산)</div>
        </div>
      </div>
    </div>
  );
}
/* ── 데이터 하우스: 오브젝트별 검색 + 온톨로지 관계 드릴다운 ── */
const SC_MONEY = new Set(["salePrice", "supplyPrice", "amount", "margin", "ltv", "sales", "fee", "supplyCost", "credit", "payable"]);
function _scCell(v, k) {
  if (v == null) return "";
  if (SC_MONEY.has(k) && typeof v === "number") return v >= 100000000 ? (v / 100000000).toFixed(1) + "억" : v >= 10000 ? Math.round(v / 10000).toLocaleString() + "만" : v.toLocaleString();
  if (k === "marginPct") return v + "%";
  if (typeof v === "number") return v.toLocaleString();
  return v;
}
const SC_TABLES = [
  { key: "vendor", label: "거래처·공급사", ic: Factory, c: "#A78BFA", ph: "상호·유형·공급분류 검색", get: (d) => d.vendors, search: (r, q) => (r.name + r.id + r.category + r.type).includes(q), cols: [["id", "ID"], ["name", "상호"], ["type", "유형"], ["category", "공급분류"], ["sla", "SLA(D+)"], ["trust", "신뢰도"]] },
  { key: "product", label: "제품·SKU", ic: Package, c: "#FBBF24", ph: "품목·거래처·분류 검색", get: (d) => d.products, search: (r, q) => (r.name + r.id + r.vendorName + r.category).includes(q), cols: [["id", "SKU"], ["name", "품목"], ["category", "분류"], ["vendorName", "공급 거래처"], ["salePrice", "판매가"], ["marginPct", "마진"]] },
  { key: "contract", label: "계약·단가", ic: ScrollText, c: "#2DD4BF", ph: "거래처·분류 검색", get: (d) => d.contracts, search: (r, q) => (r.vendorName + r.id + r.category).includes(q), cols: [["id", "계약ID"], ["vendorName", "거래처"], ["category", "분류"], ["marginPct", "마진"], ["feePct", "수수료%"], ["settleCycle", "정산주기"]] },
  { key: "availability", label: "공급사 가용재고", ic: Boxes, c: "#22D3EE", ph: "품목·거래처 검색 (당사 미보유)", get: (d) => d.availability, search: (r, q) => (r.skuName + r.id + r.vendorName + r.sku).includes(q), cols: [["id", "ID"], ["skuName", "품목"], ["vendorName", "보유 거래처"], ["qty", "가용수량"], ["leadDays", "출고 D+"], ["asof", "조회시각"]] },
  { key: "account", label: "고객·계정", ic: Users, c: "#F472B6", ph: "고객명·세그먼트·지역 검색", get: () => null, search: (r, q) => (r.name + r.id + r.seg + r.sido + r.grade).includes(q), cols: [["id", "계정ID"], ["name", "고객명"], ["seg", "세그먼트"], ["grade", "등급"], ["ltv", "LTV"], ["sido", "지역"]] },
  { key: "order", label: "주문", ic: ClipboardList, c: "#6366F1", ph: "주문ID·품목·거래처·계정 검색", get: (d) => d.orders, search: (r, q) => (r.id + r.skuName + r.vendorName + r.accountId + r.status).includes(q), cols: [["id", "주문ID"], ["accountId", "계정"], ["skuName", "품목"], ["vendorName", "라우팅 거래처"], ["amount", "판매액"], ["status", "상태"]] },
  { key: "shipment", label: "배송", ic: Truck, c: "#38BDF8", ph: "배송·주문·거래처·송장 검색", get: (d) => d.shipments, search: (r, q) => (r.id + r.orderId + r.vendorName + r.carrier + r.status + r.tracking).includes(q), cols: [["id", "배송ID"], ["orderId", "주문"], ["vendorName", "출고 거래처"], ["carrier", "운송사"], ["status", "상태"], ["eta", "ETA"]] },
  { key: "settlement", label: "정산", ic: Receipt, c: "#F59E0B", ph: "거래처·기간 검색", get: (d) => d.settlements, search: (r, q) => (r.vendorName + r.id + r.period + r.status).includes(q), cols: [["id", "전표ID"], ["vendorName", "거래처"], ["period", "기간"], ["sales", "매출"], ["fee", "수수료"], ["status", "상태"]] },
];
function _scRel(tab, r, IDX) {
  const L = [];
  const P = (t, n, k, q) => L.push({ t, n, k, q });
  if (tab === "vendor") { P("제품", (IDX.pByV[r.id] || []).length, "product", r.name); P("계약", (IDX.cByV[r.id] || []).length, "contract", r.name); P("가용재고", (IDX.aByV[r.id] || []).length, "availability", r.name); P("정산", (IDX.sByV[r.id] || []).length, "settlement", r.name); }
  else if (tab === "product") { P("공급 거래처", 1, "vendor", r.vendorName); P("가용재고", (IDX.aBySku[r.id] || []).length, "availability", r.id); P("주문(참조)", null, "order", r.name); }
  else if (tab === "contract") { P("거래처", 1, "vendor", r.vendorName); }
  else if (tab === "availability") { P("보유 거래처", 1, "vendor", r.vendorName); P("제품", 1, "product", r.sku); }
  else if (tab === "account") { P("주문", null, "order", r.id); }
  else if (tab === "order") { P("고객·계정", 1, "account", r.accountId); P("제품", 1, "product", r.skuName); P("라우팅 거래처", 1, "vendor", r.vendorName); P("배송", IDX.shByOrd[r.id] ? 1 : 0, "shipment", r.id); }
  else if (tab === "shipment") { P("주문", 1, "order", r.orderId); P("출고 거래처", 1, "vendor", r.vendorName); P("고객·계정", 1, "account", r.accountId); }
  else if (tab === "settlement") { P("거래처", 1, "vendor", r.vendorName); }
  return L;
}
function SupplyDetail({ rec, tab, idx, onClose, onGo }) {
  const rel = _scRel(tab, rec, idx);
  const T = SC_TABLES.find((t) => t.key === tab);
  return (
    <div className="ontov" onClick={onClose}><div className="ontmodal scdetail" onClick={(e) => e.stopPropagation()}>
      <div className="ontmh"><div><span className="ontmid">{rec.id}</span><div className="ontmname">{rec.name || rec.skuName || rec.vendorName || rec.id} <span>· {T.label}</span></div></div><button onClick={onClose}><X size={19} /></button></div>
      <div className="ontmbody">
        <div className="scdfields">{Object.entries(rec).filter(([k]) => !/^_|^mid$/.test(k)).map(([k, v]) => <div className="scdf" key={k}><span>{k}</span><b>{_scCell(v, k)}</b></div>)}</div>
        <div className="screlh"><Network size={13} /> 온톨로지 관계 (Links)</div>
        <div className="screlgrid">{rel.map((x, i) => (
          <button className="screlcard" key={i} onClick={() => onGo(x.k, x.q)}>
            <b>{x.t}</b>{x.n != null && <i>{x.n.toLocaleString()}건</i>}<span>{SC_TABLES.find((t) => t.key === x.k).label} 보기 ›</span>
          </button>
        ))}</div>
      </div>
    </div></div>
  );
}
function SupplyExplorer() {
  const D = React.useMemo(() => (typeof supplyData === "function" ? supplyData() : null), []);
  const [tab, setTab] = useState("vendor");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(null);
  const accRef = React.useRef(null);
  const getAcc = () => { if (!accRef.current) accRef.current = (typeof supplyAccounts === "function" ? supplyAccounts() : []); return accRef.current; };
  const IDX = React.useMemo(() => {
    if (!D) return {};
    const pByV = {}, aBySku = {}, aByV = {}, cByV = {}, sByV = {}, shByOrd = {};
    D.products.forEach((p) => { (pByV[p.vendorId] = pByV[p.vendorId] || []).push(p); });
    D.availability.forEach((a) => { (aBySku[a.sku] = aBySku[a.sku] || []).push(a); (aByV[a.vendorId] = aByV[a.vendorId] || []).push(a); });
    D.contracts.forEach((c) => { (cByV[c.vendorId] = cByV[c.vendorId] || []).push(c); });
    D.settlements.forEach((s) => { (sByV[s.vendorId] = sByV[s.vendorId] || []).push(s); });
    D.shipments.forEach((s) => { shByOrd[s.orderId] = s; });
    return { pByV, aBySku, aByV, cByV, sByV, shByOrd };
  }, [D]);
  if (!D) return null;
  const T = SC_TABLES.find((t) => t.key === tab);
  const rows = tab === "account" ? getAcc() : T.get(D);
  const qq = q.trim();
  const filtered = qq ? rows.filter((r) => T.search(r, qq)) : rows;
  const per = 12; const pages = Math.max(1, Math.ceil(filtered.length / per));
  const pg = Math.min(page, pages - 1);
  const view = filtered.slice(pg * per, pg * per + per);
  const go = (k, query) => { setTab(k); setQ(query || ""); setPage(0); setSel(null); };
  const tabCount = (t) => t.key === "account" ? D.counts.account : (t.get(D) || []).length;
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Search size={15} color="#38BDF8" /> 데이터 하우스 · 오브젝트 검색 <span>· 8 Object Types · {(D.counts.account + D.counts.order + D.counts.shipment).toLocaleString()}+ objects</span></div>
      <div className="sctabs">{SC_TABLES.map((t) => <button key={t.key} className={"sctab" + (tab === t.key ? " on" : "")} style={{ "--tc": t.c }} onClick={() => go(t.key, "")}><t.ic size={13} /> {t.label} <i>{tabCount(t).toLocaleString()}</i></button>)}</div>
      <div className="scsearch"><Search size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={T.ph} /><span>{filtered.length.toLocaleString()}건</span></div>
      <div className="sctablewrap"><table className="sctable"><thead><tr>{T.cols.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
        <tbody>{view.map((r, i) => <tr key={i} onClick={() => setSel(r)}>{T.cols.map(([k]) => <td key={k}>{_scCell(r[k], k)}</td>)}</tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="scempty">검색 결과가 없습니다.</div>}
      <div className="scpager"><button disabled={pg <= 0} onClick={() => setPage(pg - 1)}>‹ 이전</button><span>{(pg + 1).toLocaleString()} / {pages.toLocaleString()} 페이지</span><button disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>다음 ›</button></div>
      {sel && (tab === "vendor" ? <Vendor360 v={sel} D={D} idx={IDX} onClose={() => setSel(null)} onGo={go} /> : <SupplyDetail rec={sel} tab={tab} idx={IDX} onClose={() => setSel(null)} onGo={go} />)}
    </div>
  );
}
/* ── 원가회계(Cost Accounting): 무재고/직배송 원가구조 → 공헌이익·영업이익 ── */
function SupplyCostAccounting() {
  const C = React.useMemo(() => (typeof supplyCost === "function" ? supplyCost() : null), []);
  if (!C) return null;
  const CATCOL = { "영양제": "#7C3AED", "홈케어의료기": "#0891B2", "건강식단": "#16A34A", "의약외품": "#0EA5E9", "기타": "#64748B" };
  return (
    <div className="ontpanel sccost" style={{ marginTop: 12 }}>
      <div className="ontph"><Scale size={15} color="#F59E0B" /> 원가회계 · Cost Accounting <span>· 무재고/직배송 원가구조 → 공헌이익·영업이익</span></div>
      <div className="scwf">{C.steps.map(([label, v, c, sub], i) => {
        const pct = Math.min(100, Math.abs(v) / C.gmv * 100);
        return (<div className={"scwf-row" + (sub === "s" ? " sub" : "")} key={i}>
          <span className="scwf-l">{label}</span>
          <span className="scwf-bar"><i style={{ width: Math.max(2, pct) + "%", background: c }} /></span>
          <span className="scwf-v" style={{ color: c }}>{v < 0 ? "−" : ""}{_scW(Math.abs(v))}</span>
        </div>);
      })}</div>
      <div className="scdashnote">무재고 모델이라 <b>재고자산·창고·직배송 택배비(거래처 부담)</b>가 당사 원가에서 제외됩니다. 당사 변동비 = 결제수수료 + 건강적립금. 영업이익률 <b style={{ color: "#34D399" }}>{(C.op / C.gmv * 100).toFixed(1)}%</b>(GMV 대비) · 공헌이익률 <b style={{ color: "#818CF8" }}>{(C.contribution / C.gross * 100).toFixed(1)}%</b>(마진 대비).</div>
      <div className="scjournalh" style={{ marginTop: 12 }}><PieChart size={13} /> 카테고리별 원가·마진 구조</div>
      <div className="sccat">{C.cats.map((x) => (
        <div className="sccatrow" key={x.cat}>
          <span className="sccat-n" style={{ color: CATCOL[x.cat] || "#94A3B8" }}>{x.cat}</span>
          <span className="sccat-bar"><i className="cost" style={{ width: (x.costRate * 100) + "%" }} /><i className="mgn" style={{ width: (x.marginRate * 100) + "%" }} /></span>
          <span className="sccat-v">매출 {_scW(x.rev)} · 원가율 <b>{(x.costRate * 100).toFixed(0)}%</b> · 마진율 <b style={{ color: "#22D3EE" }}>{(x.marginRate * 100).toFixed(0)}%</b></span>
        </div>
      ))}</div>
    </div>
  );
}
/* ── 회계·재무 전기(ERP Posting): 정산 → 손익계산서로 데이터 전달 ── */
function SupplyLedger({ onTab }) {
  const F = React.useMemo(() => (typeof supplyFinance === "function" ? supplyFinance() : null), []);
  if (!F) return null;
  const KIND = { "수익": "#34D399", "원가": "#F472B6", "자산": "#38BDF8", "부채": "#94A3B8" };
  return (
    <div className="ontpanel scledger" style={{ marginTop: 12 }}>
      <div className="ontph"><Landmark size={15} color="#34D399" /> 회계·재무 전기 (ERP Posting) <span>· 정산 → 손익계산서 전달</span></div>
      <div className="scflow">
        <span className="scflow-n"><Receipt size={13} /> 정산(Settlement)</span><i>→</i>
        <span className="scflow-n"><ScrollText size={13} /> ERP 전기(전표)</span><i>→</i>
        <span className="scflow-n on"><Landmark size={13} /> 손익계산서·재무제표</span>
      </div>
      <div className="scacct">{F.accounts.map(([label, v, c, kind], i) => (
        <div className="scacctcard" key={i} style={{ "--vc": c }}>
          <span className="scacct-kind" style={{ color: KIND[kind], borderColor: KIND[kind] }}>{kind}</span>
          <b>{_scW(v)}</b><span>{label}</span>
        </div>
      ))}</div>
      <div className="scjournalh"><ScrollText size={13} /> 자동 전표 (분개)</div>
      <div className="scjournal">{F.journals.map(([t, dr, cr, c], i) => (
        <div className="scjrow" key={i} style={{ "--jc": c }}><span className="scj-t">{t}</span><span className="scj-dr">{dr}</span><span className="scj-cr">{cr}</span></div>
      ))}</div>
      <div className="scfsum">
        <div><b style={{ color: "#34D399" }}>{_scW(F.gmv)}</b><span>매출(GMV)</span></div>
        <div><b style={{ color: "#F472B6" }}>{_scW(F.supplyCost)}</b><span>매출원가(거래처 공급대금)</span></div>
        <div><b style={{ color: "#22D3EE" }}>{_scW(F.margin)}</b><span>매출총이익(플랫폼 마진)</span></div>
      </div>
      <div className="scdashnote" style={{ marginTop: 10 }}>정산 데이터가 <b>ERP 전표로 자동 전기</b>되어 재무회계의 <b style={{ color: "#34D399" }}>손익계산서 「제품판매 매출 · 건강쇼핑(GMV)」</b>과 매출원가·매입채무·부가세에 반영됩니다.</div>
      <button className="scfinbtn" onClick={() => onTab && onTab("finance")}><Landmark size={14} /> 재무회계 손익계산서에서 확인 <ChevronRight size={15} /></button>
    </div>
  );
}
function SupplyOntology({ onGo, onTab }) {
  const CNT = (typeof supplyData === "function") ? supplyData().counts : {};
  const _ck = { vendor: "vendor", product: "product", avail: "availability", contract: "contract", account: "account", order: "order", shipment: "shipment", payment: "settlement" };
  return (
    <div>
      <div className="ontpanel scintro">
        <div className="ontph"><Network size={15} color="#22D3EE" /> 공급망 온톨로지 <span>· Supply-Chain Ontology · Asset-light Dropship</span></div>
        <div className="scmodel">
          <span className="scmodel-b"><Boxes size={13} /> 무재고(Asset-light)</span>
          <span className="scmodel-b"><Truck size={13} /> 거래처 직배송(Dropship)</span>
          <span className="scmodel-b"><ShieldCheck size={13} /> 당사 재고자산·창고 = 0</span>
        </div>
        <p className="scdesc">제품과 재고는 <b>거래처(공급사)가 보유</b>하고 <b style={{ color: "#38BDF8" }}>고객에게 직접 배송</b>합니다. 당사는 <b>재고 부담 없이</b> <b style={{ color: "#6366F1" }}>주문·데이터·정산을 오케스트레이션</b>하고, <b style={{ color: "#22D3EE" }}>공급사 가용재고를 실시간 조회(가시성)</b>만 합니다. 모든 오브젝트·연결·AI 에이전트가 이 무재고·직배송 모델로 정의됩니다.</p>
        <div className="ontobjbar" style={{ marginTop: 10 }}>
          {SC_OBJECTS.map((o) => (
            <div className="ontobj" key={o.id}><span className="ontobj-i" style={{ background: o.c + "1A" }}><o.ic size={16} color={o.c} /></span><div><b style={{ fontSize: 14 }}>{(CNT[_ck[o.id]] || 0).toLocaleString()}</b><span>{o.t.split(" ")[0]}</span></div></div>
          ))}
        </div>
      </div>

      <SupplyDashboard />

      <SupplyLiveSim />

      <SupplyCostAccounting />

      <SupplyLedger onTab={onTab} />

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Workflow size={15} color="#22D3EE" /> 개념도 · Concept Map <span>· 무재고 · 거래처 직배송</span></div>
        <SupplyGraph />
      </div>

      <SupplyExplorer />

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Boxes size={15} color="#FBBF24" /> 오브젝트 정의 · 키 프로퍼티 <span>· {SC_OBJECTS.length} Object Types</span></div>
        <div className="scobjs">
          {SC_OBJECTS.map((o) => (
            <div className="scobjcard" key={o.id} style={{ "--oc": o.c }}>
              <div className="scobjhd"><span className="scobj-i"><o.ic size={16} /></span><b>{o.t}</b></div>
              <div className="scobjtag">{o.tag}</div>
              <div className="scobjsys">{o.sys.map((s) => <span key={s} className="scsysbadge">{s}</span>)}</div>
              <ul className="scprops">{o.props.map((p, i) => <li key={i} className={/^★/.test(p) ? "hot" : ""}><Hash size={10} /> {p.replace(/^★/, "")}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="screl">
          <b className="screl-h">관계 (Links)</b>
          {SC_LINKS.map(([a, r, b], i) => <span className={"screlpill" + (/★/.test(r) ? " hot" : "")} key={i}>{a} <i>—{r.replace("★", "")}→</i> {b}</span>)}
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Cpu size={15} color="#34D399" /> 연결 시스템 · Integration <span>· ERP · CRM · 물류</span></div>
        <div className="scsysgrid">
          {SC_SYSTEMS.map((s) => (
            <div className="scsyscard" key={s.id} style={{ "--sc": s.c }}>
              <div className="scsyshd"><span className="scsys-i"><s.ic size={17} /></span><div><b>{s.t}</b><span>{s.sub}</span></div></div>
              <div className="scsysex"><MonitorSmartphone size={11} /> {s.ex}</div>
              <div className="scsyssync"><RefreshCw size={11} /> {s.sync}</div>
              <div className="scsysobjs">{s.objs.map((o) => <span key={o}>{o}</span>)}</div>
              <div className="scsysnote">{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <SupplyAgents />

      <div className="chnote" style={{ marginTop: 12 }}>※ <b>무재고(Asset-light)·거래처 직배송</b> 모델의 시연용 스키마입니다 — 제품·재고는 거래처(공급사)가 보유·배송하고 당사는 재고자산·창고를 두지 않습니다. 실제 운영 시 ERP(더존·SAP)·CRM(Salesforce)·물류(택배사 API·거래처 WMS) 커넥터 연동과 공급사 <b>가용재고 API</b>·권한·감사(HITL) 구성이 필요합니다.</div>
    </div>
  );
}
