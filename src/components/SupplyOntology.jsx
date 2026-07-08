/* ====================== 공급망 온톨로지 (Ontology · Harness 하위) ======================
   팔란티어 파운드리형 — 오브젝트/키 프로퍼티 정의 + ERP(거래처)·CRM(계정)·물류(배송) 연결
   + 책임 AI 에이전트 + 개념도(Concept Map). 시연용 스키마 설계(합성 데이터). */

const SC_OBJECTS = [
  { id: "vendor", t: "거래처 (Vendor)", c: "#A78BFA", sys: ["ERP"], ic: Handshake, props: ["거래처ID (PK)", "사업자등록번호", "유형 · 제조/유통/약국", "여신한도 · 미수금", "결제조건 (Net 30 등)"] },
  { id: "supplier", t: "공급업체 (Supplier)", c: "#34D399", sys: ["ERP"], ic: Factory, props: ["공급사ID (PK)", "공급 품목군", "리드타임 (일)", "단가계약 · MOQ", "공급 신뢰등급"] },
  { id: "product", t: "제품 · SKU (Product)", c: "#FBBF24", sys: ["ERP"], ic: Package, props: ["SKU (PK)", "품목명 · 카테고리", "원가 · 판매가", "유통기한 · 로트", "바코드 (GTIN)"] },
  { id: "inventory", t: "재고 (Inventory)", c: "#22D3EE", sys: ["ERP", "물류"], ic: Boxes, props: ["창고×SKU (PK)", "가용수량 · 예약수량", "안전재고 · 재주문점", "로트 · 유효기간", "위치 (Bin)"] },
  { id: "account", t: "고객 · 계정 (Account)", c: "#F472B6", sys: ["CRM"], ic: Users, props: ["계정ID (PK)", "세그먼트 · 개인/기업/병원/약국", "등급 · LTV", "담당 영업", "이탈스코어 · 최근활동"] },
  { id: "order", t: "주문 (Order)", c: "#6366F1", sys: ["ERP", "CRM"], ic: ClipboardList, props: ["주문ID (PK)", "계정 · 품목 · 수량", "금액 · 할인", "상태 · 접수→출고→완료", "주문일 · 납기일"] },
  { id: "shipment", t: "배송 (Shipment)", c: "#38BDF8", sys: ["물류"], ic: Truck, props: ["배송ID (PK)", "주문 참조 (FK)", "운송사 · 송장번호", "상태 · 집화/배송중/완료", "ETA · 실배송시각"] },
  { id: "payment", t: "정산 (Settlement)", c: "#F59E0B", sys: ["ERP", "회계"], ic: Receipt, props: ["전표ID (PK)", "매출/매입 구분", "세금계산서번호", "수금 · 지급일", "연체 · 상계"] },
];

const SC_LINKS = [
  ["공급업체", "납품", "재고"], ["제품", "구성", "재고"], ["거래처", "거래", "주문"],
  ["재고", "출고", "주문"], ["고객·계정", "발주", "주문"], ["주문", "배차", "배송"],
  ["배송", "도착", "고객·계정"], ["주문", "청구", "정산"],
];

const SC_SYSTEMS = [
  { id: "erp", t: "ERP 연결", sub: "거래처 · 재고 · 주문 · 정산", c: "#34D399", ic: Landmark, ex: "더존 iCUBE · SAP · 영림원", objs: ["거래처", "제품", "재고", "주문", "정산"], sync: "실시간 양방향 동기화 · 마스터 골든레코드", note: "품목·거래처·전표를 온톨로지 표준키로 정규화" },
  { id: "crm", t: "CRM 연결", sub: "계정 · 고객 · 영업기회", c: "#F472B6", ic: Users, ex: "Salesforce · HubSpot · 자체 CRM", objs: ["고객·계정", "주문"], sync: "세그먼트 · 파이프라인 동기화", note: "계정 360°(주문·배송·정산 이력) 통합 뷰" },
  { id: "wms", t: "물류 연결", sub: "배송 · 추적 · 창고 (TMS/WMS)", c: "#38BDF8", ic: Truck, ex: "스마트택배 · CJ대한통운 API · 자체 WMS", objs: ["배송", "재고(창고)"], sync: "실시간 배송추적 웹훅", note: "송장·ETA·예외를 배송 객체에 스트리밍" },
];

const SC_AGENTS = [
  { id: "orch", t: "공급망 오케스트레이터", c: "#22D3EE", ic: Workflow, scope: "수요예측 · 자동발주 · 재고 최적화", sys: ["ERP", "물류"], owns: ["재고", "주문", "공급업체"], kpi: ["재고회전율 ↑", "결품률 ↓", "리드타임 준수"], guard: "발주 한도·예산 초과 시 인간 승인(HITL)" },
  { id: "vrisk", t: "거래처 리스크 에이전트", c: "#A78BFA", ic: ShieldCheck, scope: "여신 · 미수 · 신용 모니터링", sys: ["ERP"], owns: ["거래처", "정산"], kpi: ["미수 회수율 ↑", "여신 초과 0", "연체 조기경보"], guard: "여신 상향·거래중지는 감사로그 + 승인" },
  { id: "growth", t: "고객 성장 에이전트", c: "#F472B6", ic: TrendingUp, scope: "세그먼트 · 업셀 · 이탈 방지", sys: ["CRM"], owns: ["고객·계정", "주문"], kpi: ["재구매율 ↑", "이탈률 ↓", "LTV ↑"], guard: "발송·할인은 동의·정책 검증 후 실행" },
  { id: "logi", t: "물류 관제 에이전트", c: "#38BDF8", ic: Route, scope: "ETA 예측 · 지연 예외 · 배차 최적", sys: ["물류"], owns: ["배송"], kpi: ["정시배송률 ↑", "배송비 ↓", "예외 대응시간 ↓"], guard: "운송사 변경·재배차는 비용영향 리포트 후" },
  { id: "settle", t: "정산·컴플라이언스 에이전트", c: "#F59E0B", ic: ScrollText, scope: "세금계산서 · 정산 · 규정 검증", sys: ["ERP", "회계"], owns: ["정산"], kpi: ["정산 정확도 ↑", "마감 리드타임 ↓", "규정 위반 0"], guard: "세금계산서 발행·상계는 회계 승인 게이트" },
];

/* ── 개념도(Concept Map) SVG — ERP(좌)·CRM(상)·물류(우) 시스템 레인 + 오브젝트 플로우 ── */
function SupplyGraph() {
  const SYS = [
    { id: "erp", t: "ERP", sub: "거래처·재고·정산", x: 118, y: 58, c: "#34D399" },
    { id: "crm", t: "CRM", sub: "계정·영업", x: 430, y: 58, c: "#F472B6" },
    { id: "wms", t: "물류 TMS/WMS", sub: "배송·창고", x: 610, y: 240, c: "#38BDF8" },
  ];
  const OBJ = [
    { id: "vendor", t: "거래처", x: 118, y: 196, c: "#A78BFA" },
    { id: "supplier", t: "공급업체", x: 118, y: 322, c: "#34D399" },
    { id: "product", t: "제품", x: 278, y: 150, c: "#FBBF24" },
    { id: "inventory", t: "재고", x: 278, y: 332, c: "#22D3EE" },
    { id: "account", t: "고객·계정", x: 430, y: 150, c: "#F472B6" },
    { id: "order", t: "주문", x: 430, y: 280, c: "#6366F1" },
    { id: "payment", t: "정산", x: 430, y: 412, c: "#F59E0B" },
    { id: "shipment", t: "배송", x: 582, y: 386, c: "#38BDF8" },
  ];
  const P = Object.fromEntries([...SYS, ...OBJ].map((n) => [n.id, n]));
  const oLinks = [
    ["supplier", "inventory", "납품"], ["product", "inventory", "구성"], ["vendor", "order", "거래"],
    ["inventory", "order", "출고"], ["account", "order", "발주"], ["order", "shipment", "배차"],
    ["shipment", "account", "배송"], ["order", "payment", "청구"],
  ];
  const sLinks = [
    ["erp", "vendor"], ["erp", "inventory"], ["erp", "payment"],
    ["crm", "account"], ["crm", "order"], ["wms", "shipment"], ["wms", "inventory"],
  ];
  return (
    <div className="ontgraph scgraph">
      <svg viewBox="0 0 700 470" style={{ width: "100%", height: "auto", display: "block" }}>
        {sLinks.map(([a, b], i) => { const A = P[a], B = P[b]; return <line key={"s" + i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={A.c} strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="4 4" />; })}
        {oLinks.map(([a, b, lbl], i) => { const A = P[a], B = P[b]; return (<g key={"o" + i}><line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#33456A" strokeWidth="1.7" /><text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} fill="#9AA9C6" fontSize="9.5" fontWeight="700" textAnchor="middle">{lbl}</text></g>); })}
        {SYS.map((s) => (<g key={s.id}>
          <rect x={s.x - 58} y={s.y - 20} width="116" height="40" rx="9" fill="#101f3c" stroke={s.c} strokeWidth="1.8" />
          <text x={s.x} y={s.y - 2} fill="#EAF2FF" fontSize="12" fontWeight="900" textAnchor="middle">{s.t}</text>
          <text x={s.x} y={s.y + 11} fill={s.c} fontSize="8" fontWeight="700" textAnchor="middle">{s.sub}</text>
        </g>))}
        {OBJ.map((n) => (<g key={n.id}>
          <circle cx={n.x} cy={n.y} r="29" fill="#0F1B33" stroke={n.c} strokeWidth="2" />
          <text x={n.x} y={n.y + 4} fill="#EAF2FF" fontSize="10.5" fontWeight="800" textAnchor="middle">{n.t}</text>
        </g>))}
      </svg>
      <div className="ontgraph-note">Object Types <b>8</b> · Links <b>{SC_LINKS.length}</b> · Systems <b>3</b> (ERP·CRM·물류) · Agents <b>5</b> — <b style={{ color: "#34D399" }}>ERP</b>가 거래처·재고·정산을, <b style={{ color: "#F472B6" }}>CRM</b>이 계정·주문을, <b style={{ color: "#38BDF8" }}>물류</b>가 배송을 온톨로지 표준키로 연결합니다. <b>공급업체→재고→주문→배송→고객</b> 플로우가 하나의 지식그래프로 순환합니다.</div>
    </div>
  );
}

function SupplyOntology({ onGo }) {
  return (
    <div>
      <div className="ontpanel scintro">
        <div className="ontph"><Network size={15} color="#22D3EE" /> 공급망 온톨로지 <span>· Supply-Chain Ontology · Palantir-style</span></div>
        <p className="scdesc">공급망·거래처·고객 등 모든 오브젝트를 <b>객체 · 키 프로퍼티 · 관계</b>로 정의하고, <b style={{ color: "#34D399" }}>ERP(거래처)</b> · <b style={{ color: "#F472B6" }}>CRM(계정)</b> · <b style={{ color: "#38BDF8" }}>물류(배송)</b>를 하나의 지식그래프로 연결합니다. 각 도메인은 <b>책임 AI 에이전트</b>가 KPI·가드레일과 함께 운영합니다.</p>
        <div className="ontobjbar" style={{ marginTop: 10 }}>
          {SC_OBJECTS.slice(0, 8).map((o) => (
            <div className="ontobj" key={o.id}><span className="ontobj-i" style={{ background: o.c + "1A" }}><o.ic size={16} color={o.c} /></span><div><b style={{ fontSize: 12 }}>{o.t.split(" ")[0]}</b><span>{o.sys.join("·")}</span></div></div>
          ))}
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Workflow size={15} color="#22D3EE" /> 개념도 · Concept Map <span>· 오브젝트 · 관계 · 연결 시스템</span></div>
        <SupplyGraph />
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Boxes size={15} color="#FBBF24" /> 오브젝트 정의 · 키 프로퍼티 <span>· {SC_OBJECTS.length} Object Types</span></div>
        <div className="scobjs">
          {SC_OBJECTS.map((o) => (
            <div className="scobjcard" key={o.id} style={{ "--oc": o.c }}>
              <div className="scobjhd"><span className="scobj-i"><o.ic size={16} /></span><b>{o.t}</b></div>
              <div className="scobjsys">{o.sys.map((s) => <span key={s} className="scsysbadge">{s}</span>)}</div>
              <ul className="scprops">{o.props.map((p, i) => <li key={i}><Hash size={10} /> {p}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="screl">
          <b className="screl-h">관계 (Links)</b>
          {SC_LINKS.map(([a, r, b], i) => <span className="screlpill" key={i}>{a} <i>—{r}→</i> {b}</span>)}
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

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Bot size={15} color="#F472B6" /> 책임 AI 에이전트 · Accountable Agents <span>· {SC_AGENTS.length} Agents</span></div>
        <div className="scagents">
          {SC_AGENTS.map((a) => (
            <div className="scagentcard" key={a.id} style={{ "--ac": a.c }}>
              <div className="scagenthd"><span className="scagent-i"><a.ic size={18} /></span><div><b>{a.t}</b><span>{a.scope}</span></div></div>
              <div className="scagentrow"><span className="scal">담당 시스템</span><span className="scav">{a.sys.join(" · ")}</span></div>
              <div className="scagentrow"><span className="scal">소관 오브젝트</span><span className="scav">{a.owns.join(" · ")}</span></div>
              <div className="scagentkpi">{a.kpi.map((k, i) => <span key={i} className="sckpi">{k}</span>)}</div>
              <div className="scagentguard"><ShieldCheck size={11} /> {a.guard}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chnote" style={{ marginTop: 12 }}>※ 공급망 온톨로지는 <b>시연용 스키마 설계</b>입니다. 오브젝트·키 프로퍼티·관계·에이전트 정의는 표준 참조모델이며, 실제 운영 시 ERP(더존·SAP)·CRM(Salesforce)·물류(택배사 API·WMS) <b>커넥터 연동과 권한·감사(HITL)</b> 구성이 필요합니다.</div>
    </div>
  );
}
