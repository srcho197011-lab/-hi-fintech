/* ====================== 협력업체 온톨로지 · 하네스 (Ontology · Harness 하위) ======================
   Partner Ontology & Governance Harness — 이 패널은 그중 **거래 사실 레이어**를 렌더한다.
   성격 — 「누구와 무슨 거래가 어떤 상태로 돌고 있는가」까지다. 「그 거래가 적법·건전한가」의 판정 지면은
     다음 단계에서 신설되고, 그 지면의 표시명은 partnerGov.js 의 pgDisplayName() 하나에서만 나온다.
   용어 — 화면 라벨의 단일 원천은 partnerGov.js 의 PG_TERMS / PG_COUNT_LABEL 이다. 여기서 낱말을 만들지 않는다.
   코드 식별자(SC_* · Vendor360 · SupplyGraph 등)는 **개칭하지 않는다** — 단일 번들(전역 공유)이라
     개칭 과도기에 같은 이름이 둘 생기면 조용히 덮어쓴다(§3-1).
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
  { id: "orch", t: "협력업체 오케스트레이터", c: "#22D3EE", ic: Workflow, scope: "무재고 발주 라우팅 · 공급사 가용재고 가시성", sys: ["ERP", "물류"], owns: ["주문", "공급사 가용재고", "거래처·공급사"], kpi: ["가용재고 정확도 ↑", "발주 자동화율 ↑", "품절·오배정 ↓"], guard: "최적 거래처 자동배정 · 예외 시 인간 승인(HITL)" },
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

/* ── 실시간 진행 현황 대시보드: 공급·진행·관리를 라이브로 갱신 ── */
function SupplyLiveBoard() {
  const D = React.useMemo(() => (typeof supplyData === "function" ? supplyData() : null), []);
  const st = React.useRef(null);
  const [running, setRunning] = useState(true);
  const [, force] = useState(0);
  if (D && !st.current) {
    let normal = 0, low = 0, out = 0;
    D.availability.forEach((a) => { a.qty >= 80 ? normal++ : a.qty >= 30 ? low++ : out++; });
    st.current = { t: 0, pipe: { r: 14, p: 9, s: 22, d: 0 }, live: { ord: 0, gmv: 0, done: 0, po: 0 }, sup: { normal, low, out, base: out }, mg: { sla: 98.4, otd: 97.1, work: 0 }, alerts: [], feed: [] };
  }
  useEffect(() => {
    if (!running || !D) return;
    const id = setInterval(() => {
      const s = st.current; const t = (s.t += 1); const p = s.pipe;
      const no = 1 + Math.floor(Math.random() * 3);
      const toShip = Math.floor(p.r * 0.45), toTr = Math.floor(p.p * 0.4), toDone = Math.floor(p.s * 0.32);
      p.r = Math.max(3, p.r + no - toShip); p.p = Math.max(2, p.p + toShip - toTr); p.s = Math.max(4, p.s + toTr - toDone); p.d += toDone;
      const prod = D.products[(t * 104729) % D.products.length]; const qty = 1 + (t % 4); const amt = prod.salePrice * qty;
      s.live.ord += no; s.live.gmv += amt; s.live.done += toDone;
      if (t % 2 === 0 && s.sup.normal > 0) { s.sup.normal--; s.sup.low++; }
      if (s.sup.low > 0 && Math.random() < 0.4) { s.sup.low--; s.sup.out++; }
      if (s.sup.out > s.sup.base) { s.sup.out--; s.sup.normal++; s.live.po++; s.feed.unshift({ id: "a" + t, c: "#22D3EE", k: "자동발주", x: "오케스트레이터 · " + prod.vendorName + " 품절임박 → 자동발주 실행" }); }
      s.mg.work = t % SC_AGENTS.length; s.mg.sla = +(97 + Math.random() * 2.5).toFixed(1); s.mg.otd = +(95 + Math.random() * 4).toFixed(1);
      if (t % 4 === 0) { const K = [["품절임박", "#FBBF24", prod.name + " 가용 " + Math.floor(Math.random() * 25) + "개"], ["배송지연", "#F87171", "주문 O" + (100000 + Math.floor(Math.random() * 899999)) + " ETA 초과"], ["여신경보", "#A78BFA", prod.vendorName + " 여신 90% 도달"]]; const k = K[Math.floor(t / 4) % K.length]; s.alerts.unshift({ id: t, k: k[0], c: k[1], x: k[2] }); s.alerts = s.alerts.slice(0, 5); }
      const EV = [["신규주문", "#38BDF8", prod.vendorName + " · " + prod.name + " ×" + qty + " · " + _scW(amt)], ["출고지시", "#FBBF24", prod.vendorName + " 출고 지시(거래처)"], ["직배송", "#818CF8", "거래처 직배송 시작 · " + prod.vendorName], ["배송완료", "#34D399", "배송 완료 +" + toDone + "건"], ["정산반영", "#F59E0B", "ERP 전기 · 손익계산서 반영"]];
      const e = EV[t % EV.length]; s.feed.unshift({ id: "e" + t, c: e[1], k: e[0], x: e[2] }); s.feed = s.feed.slice(0, 9);
      force((x) => x + 1);
    }, 1200);
    return () => clearInterval(id);
  }, [running, D]);
  if (!D || !st.current) return null;
  const s = st.current;
  const supTot = s.sup.normal + s.sup.low + s.sup.out || 1;
  const pipeArr = [["접수", s.pipe.r, "#38BDF8"], ["출고준비", s.pipe.p, "#FBBF24"], ["배송중", s.pipe.s, "#818CF8"], ["배송완료", s.pipe.d, "#34D399"]];
  const pipeMax = Math.max.apply(null, pipeArr.map((x) => x[1]).concat(1));
  const kpi = [["실시간 주문", s.live.ord.toLocaleString(), "#38BDF8"], ["실시간 거래액", _scW(s.live.gmv), "#34D399"], ["처리 중", (s.pipe.r + s.pipe.p + s.pipe.s).toLocaleString(), "#818CF8"], ["배송완료", s.live.done.toLocaleString(), "#22D3EE"], ["자동발주", s.live.po.toLocaleString() + "건", "#FBBF24"]];
  return (
    <div className="ontpanel lbwrap" style={{ marginTop: 12 }}>
      <div className="ontph"><Gauge size={15} color="#22D3EE" /> 실시간 진행 현황 대시보드 <span className={"lblive" + (running ? " on" : "")}>{running ? "● LIVE" : "○ 정지"}</span>
        <span style={{ marginLeft: "auto" }}><button className="scsimbtn" onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={13} /> 정지</> : <><Play size={13} /> 재생</>}</button></span>
      </div>
      <div className="lbkpi">{kpi.map(([k, v, c], i) => <div key={i}><b style={{ color: c }}>{v}</b><span>{k}</span></div>)}</div>
      <div className="lbcols">
        <div className="lbcol">
          <div className="lbh"><Boxes size={13} color="#22D3EE" /> 공급 현황</div>
          {[["정상", s.sup.normal, "#34D399"], ["부족", s.sup.low, "#FBBF24"], ["품절임박", s.sup.out, "#F87171"]].map(([k, v, c]) => (
            <div className="lbgauge" key={k}><span className="lbg-l">{k}</span><span className="lbg-bar"><i style={{ width: (v / supTot * 100) + "%", background: c }} /></span><span className="lbg-v" style={{ color: c }}>{v}</span></div>
          ))}
          <div className="lbmini"><span className="lbdot pulse" style={{ background: "#22D3EE" }} /> 공급사 가용재고 API 실시간 조회 중 · 자동발주 <b style={{ color: "#FBBF24" }}>{s.live.po}</b>건</div>
        </div>
        <div className="lbcol">
          <div className="lbh"><Workflow size={13} color="#818CF8" /> 진행 현황 (파이프라인)</div>
          {pipeArr.map(([k, v, c]) => (
            <div className="lbgauge" key={k}><span className="lbg-l">{k}</span><span className="lbg-bar"><i style={{ width: (v / pipeMax * 100) + "%", background: c }} /></span><span className="lbg-v" style={{ color: c }}>{v.toLocaleString()}</span></div>
          ))}
          <div className="lbmini">주문 → 출고 → <b style={{ color: "#818CF8" }}>거래처 직배송</b> → 완료 · 실시간 이동</div>
        </div>
        <div className="lbcol">
          <div className="lbh"><Bot size={13} color="#F472B6" /> 관리 현황</div>
          <div className="lbagents">{SC_AGENTS.map((a, i) => <div className="lbagent" key={a.id}><span className={"lbdot" + (i === s.mg.work ? " pulse" : "")} style={{ background: i === s.mg.work ? "#FBBF24" : "#34D399" }} /><span className="lba-n">{a.t.replace(" 에이전트", "")}</span><span className="lba-s" style={{ color: i === s.mg.work ? "#FBBF24" : "#34D399" }}>{i === s.mg.work ? "작업중" : "정상"}</span></div>)}</div>
          <div className="lbgauge"><span className="lbg-l">SLA 준수</span><span className="lbg-bar"><i style={{ width: s.mg.sla + "%", background: "#34D399" }} /></span><span className="lbg-v" style={{ color: "#34D399" }}>{s.mg.sla}%</span></div>
          <div className="lbgauge"><span className="lbg-l">정시배송</span><span className="lbg-bar"><i style={{ width: s.mg.otd + "%", background: "#38BDF8" }} /></span><span className="lbg-v" style={{ color: "#38BDF8" }}>{s.mg.otd}%</span></div>
        </div>
      </div>
      <div className="lbgrid2">
        <div className="lbcol">
          <div className="lbh"><AlertTriangle size={13} color="#FBBF24" /> 실시간 알림</div>
          <div className="lbalerts">{s.alerts.length === 0 ? <div className="scempty">알림 대기 중…</div> : s.alerts.map((a) => <div className="lbalert" key={a.id}><span className="lba-tag" style={{ color: a.c, borderColor: a.c }}>{a.k}</span><span className="lba-x">{a.x}</span></div>)}</div>
        </div>
        <div className="lbcol">
          <div className="lbh"><Zap size={13} color="#818CF8" /> 실시간 이벤트</div>
          <div className="lbfeed">{s.feed.length === 0 ? <div className="scempty">이벤트 대기 중…</div> : s.feed.map((f) => <div className="lbfeedrow" key={f.id}><span className="lbf-t" style={{ color: f.c, borderColor: f.c }}>{f.k}</span><span className="lbf-x">{f.x}</span></div>)}</div>
        </div>
      </div>
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
        {SC_AGENTS.map((a) => {
          /* [P6] 거버넌스 축 확장 — 새 에이전트를 만들지 않고 **기존 카드에 선언을 얹는다**(G-05).
             ⚠ 선언을 이 파일에 적지 않는다: 거버넌스 범위가 바뀔 때 두 곳이 갈린다. 원천은
               src/data/partnerAI.js 의 PG_AI_AGENTS 이고 여기서는 **렌더만** 한다.
             ⚠ 모듈 최상위가 아니라 렌더 시점에 읽는다 — 데이터 파일이 이 파일보다 뒤에 붙으므로
               최상위에서 읽으면 TDZ 로 번들이 통째로 죽는다. */
          const ex = (typeof pgAgentExt === "function") ? pgAgentExt(a.id) : null;
          return (
          <div className="scagentcard" key={a.id} style={{ "--ac": a.c }}>
            <div className="scagenthd"><span className="scagent-i"><a.ic size={18} /></span><div><b>{a.t}</b><span>{a.scope}</span></div></div>
            <div className="scagentrow"><span className="scal">소관</span><span className="scav">{a.owns.concat(ex ? ex.ownsAdd : []).join(" · ")}</span></div>
            <div className="scagentkpi">{a.kpi.concat(ex ? ex.kpiAdd : []).map((k, i) => <span key={i} className="sckpi">{k}</span>)}</div>
            <div className="scactbtns">{(SC_AGENT_ACTIONS[a.id] || []).map((act, i) => <button key={i} className="scactbtn" style={{ "--ac": a.c }} onClick={() => run(a, act)}><Play size={11} /> {act.t}</button>)}</div>
            <div className="scagentguard"><ShieldCheck size={11} /> {a.guard}</div>
            {ex ? <div className="scagentguard" style={{ color: "#B45309" }}><ShieldCheck size={11} /> {typeof _pgPlain === "function" ? _pgPlain(ex.guardAdd) : ex.guardAdd}</div> : null}
          </div>
          );
        })}
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
  const prods = idx.pByV[v.id] || [], conts = idx.cByV[v.id] || [], avails = idx.aByV[v.id] || [];
  /* ★ 이 모달은 **기간축 롤업을 읽는 소비자**다(P5a 전환). 자기 계산을 갖지 않는다.
       종전에는 주문 3만 건을 선형 주사해 sales·margin 을 여기서 다시 더했고, 같은 거래처의 매출이
       보고서(롤업)와 모달(자체 계산) 두 곳에서 따로 계산됐다 — 두 값이 서는 경로였다.
       금액·건수는 전부 pgVendorRoll() 반환 필드이고, 모달이 더하는 숫자는 0건이다.
       상태 분포만 색인(oByV)에서 센다 — 취소를 포함한 분포는 금액 축이 아니라 운영 축이다. */
  const VR = (typeof pgVendorRoll === "function") ? pgVendorRoll(v.id) : null;
  const cell = (VR && VR.cell) || null;
  const setts = (VR && VR.months) || (idx.sByV[v.id] || []);
  const ords = (VR && VR.orders) || [];
  const st = {};
  ords.forEach((o) => { st[o.status] = (st[o.status] || 0) + 1; });
  const agents = SC_AGENTS.filter((a) => a.sys.includes("ERP") || a.sys.includes("물류")).slice(0, 3);
  /* 「정산누계」를 독립 장부로 읽히게 적지 않는다 — 정산은 주문에서 파생된 종속 표시이고
     창이 같으면 총 거래액과 원 단위까지 같은 값이다(형 확정 Q1). 라벨의 원천은 PG_SETTLE_LABEL 하나다. */
  const _setLabel = _scSetLabel();
  const kpi = [["총 거래액", cell ? _scW(cell.sales) : "—", "#34D399"],
    ["주문", cell ? cell.orders.toLocaleString() + "건" : "—", "#6366F1"],
    ["제품 SKU", prods.length, "#FBBF24"],
    [_setLabel, cell ? _scW(cell.settleTarget) : "—", "#F59E0B"]];
  return (
    <div className="ontov" onClick={onClose}><div className="ontmodal v360" onClick={(e) => e.stopPropagation()}>
      <div className="ontmh"><div><span className="ontmid">{v.id} · {v.type} · {v.category}</span><div className="ontmname">{v.name} <span>· 360° 뷰 · 신뢰도 {v.trust} · SLA D+{v.sla}</span></div></div><button onClick={onClose}><X size={19} /></button></div>
      <div className="ontmbody">
        <div className="v360kpi">{kpi.map(([k, val, c], i) => <div key={i}><b style={{ color: c }}>{val}</b><span>{k}</span></div>)}</div>
        <div className="v360sec"><b><Package size={12} /> 제품 · SKU ({prods.length})</b><div className="v360chips">{prods.slice(0, 10).map((p) => <span key={p.id} onClick={() => { onGo("product", p.name); onClose(); }}>{p.name} · {_scW(p.salePrice)}</span>)}{prods.length > 10 && <span className="more" onClick={() => { onGo("product", v.name); onClose(); }}>+{prods.length - 10} 더보기 ›</span>}</div></div>
        <div className="v360grid2">
          {/* 계약은 **약정값**이다 — 주문에서 실현된 값과 다른 것이 정상이므로 라벨을 가른다.
              값을 통일하지 않는다: 틀린 것은 값이 아니라 같은 이름으로 부른 것이다. */}
          <div className="v360sec"><b><ScrollText size={12} /> 계약·단가</b>{conts.map((c) => <div className="v360li" key={c.id}>{c.category} · 계약 마진율(약정) {c.marginPct}% · 수수료 {c.feePct}% · 계약 주기(약정) {c.settleCycle}</div>)}</div>
          <div className="v360sec"><b><Boxes size={12} /> 공급사 가용재고 ({avails.length})</b>{avails.slice(0, 4).map((a) => <div className="v360li" key={a.id}><span style={{ color: a.qty < 30 ? "#F87171" : "#22D3EE", fontWeight: 800 }}>{a.qty}</span> · {a.skuName} · D+{a.leadDays}</div>)}</div>
        </div>
        <div className="v360sec"><b><Truck size={12} /> 주문·직배송 상태</b><div className="scpipe" style={{ height: 44 }}>{["접수", "출고준비", "배송중", "배송완료", "취소"].map((s) => { const val = st[s] || 0; return <div className="scpipe-seg" key={s} style={{ flex: Math.max(0.4, val), background: SC_ST_COLOR[s] }} title={s + " " + val}><b>{val}</b><span>{s}</span></div>; })}</div></div>
        <div className="v360grid2">
          {/* 정산 행은 주문 집계다 — 수수료는 계약 feePct 그대로이므로 위 계약 섹션의 「수수료 N%」와 일치한다.
              상태 축은 아직 없다(재부여 규칙 미정 · 1:1 승계 기각) → 상태 대신 **미출고분**을 적는다. */}
          {/* 기간축을 **전부** 찍는다 — 최근 3건만 찍던 자리가 기간 추세를 말할 수 없게 만들던 자리다.
              행은 롤업이 돌려준 월행 그대로이고 모달이 다시 더하지 않는다. */}
          <div className="v360sec"><b><Receipt size={12} /> 월별 {_setLabel} ({setts.length}개월)</b>{setts.map((s) => <div className="v360li" key={s.period}>{s.period} · 매출 {_scW(s.sales)} · 수수료 {_scW(s.fee)} · 주문 {s.orders}건{s.preShip ? <span style={{ color: "#FBBF24" }}> · 미출고 {_scW(s.preShip)}</span> : null}</div>)}</div>
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
/* 라벨의 단일 원천은 partnerGov.js 다 — 컴포넌트에서 낱말을 만들지 않는다(§0-5).
   ⚠ **함수로 둔다.** 번들은 src/_manifest.txt 순서로 이어 붙인 단일 모듈이고 이 파일은 데이터 파일보다
      앞에 온다. 그래서 모듈 최상위에서 `typeof PG_SETTLE_LABEL`을 평가하면 const 의 TDZ 에 걸려
      ReferenceError 로 번들 전체가 죽는다. 렌더 시점에 부르면 이미 초기화돼 있다. */
function _scSetLabel() { return (typeof PG_SETTLE_LABEL !== "undefined") ? PG_SETTLE_LABEL : "정산(주문 파생)"; }
function _scCountLabel(id, fallback) { return (typeof pgCountLabel === "function" && pgCountLabel(id)) || fallback; }
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
      /* 집계 버킷 키는 **식별자**다. 상호 문자열을 키로 쓰면 표시명 모드를 내리는 순간
         글자가 아니라 **동작**이 바뀐다(버킷이 갈라진다). 실측: 식별자로 키잉해도 버킷 108 동일 ·
         손실 0. 라벨은 렌더에서 표시명 함수를 지나 만든다(§4-6-5 ⓒ). */
      venSales[o.vendorId] = (venSales[o.vendorId] || 0) + o.amount;
    });
    const shipSt = {}; D.shipments.forEach((s) => { shipSt[s.status] = (shipSt[s.status] || 0) + 1; });
    const low = D.availability.filter((a) => a.qty < 80).sort((a, b) => a.qty - b.qty).slice(0, 8);
    /* 정산 상태 축은 아직 없다 — 「정산 완료 / 정산 예정」 2칸은 status 1:1 승계를 전제했고 그 승계는
       기각됐다(미출고 금액이 「정산완료」로 섞인다). 그래서 **정산 대상** 한 값 + 그 안의 미출고분으로 적는다. */
    let setTarget = 0, setPreShip = 0, setMonths = {};
    D.settlements.forEach((s) => { setTarget += s.sales; setPreShip += (s.preShip || 0); setMonths[s.period] = 1; });
    const setWin = Object.keys(setMonths).sort();
    /* 라벨 조립 — 버킷은 식별자이고 표기는 표시명 함수 한 곳을 지난다.
       ⚠ 동점 정렬은 **식별자 오름차순**으로 못 박는다. 금액만으로 정렬하면 동점 행의 순서가
         엔진 구현에 달리고, 같은 입력이 같은 화면을 만들지 않는다(결정론). */
    const venById = {}; D.vendors.forEach((v) => { venById[v.id] = v; });
    const venTop = Object.entries(venSales)
      .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, 8)
      .map(([vid, amt]) => [(typeof pgDisplayName === "function" ? pgDisplayName(venById[vid] || { vendorId: vid }) : vid), amt, vid]);
    const cats = [["영양제", "#7C3AED"], ["홈케어의료기", "#0891B2"], ["건강식단", "#16A34A"], ["의약외품", "#0EA5E9"]].map(([c, col]) => [c, catSales[c] || 0, col]);
    return { gmv, margin, active, done, cancel, ocount, st, shipSt, low, setTarget, setPreShip, setWin, venTop, cats };
  }, [D]);
  if (!dash) return null;
  const PIPE = ["접수", "출고준비", "배송중", "배송완료", "취소"];
  const _setLabel = _scSetLabel();
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
          {/* 창 라벨을 데이터에서 만든다 — 「최근 6개월」을 손으로 적어 두면 창이 바뀔 때 머리말만 거짓이 된다.
              그리고 이 패널의 창이 위 KPI 「총 거래액」의 창과 같아야 한 화면에 두 숫자가 서지 않는다. */}
          <div className="ontph"><Receipt size={14} color="#F59E0B" /> {_setLabel} <span>· {dash.setWin[0]} ~ {dash.setWin[dash.setWin.length - 1]} · 월별 {dash.setWin.length}개월</span></div>
          <div className="scsettle"><div className="scset-c"><b style={{ color: "#34D399" }}>{_scW(dash.setTarget)}</b><span>정산 대상(상태 미정)</span></div><div className="scset-c"><b style={{ color: "#FBBF24" }}>{_scW(dash.setPreShip)}</b><span>그중 미출고분</span></div></div>
          <div className="scdashnote">정산은 <b>주문에서 전건 파생</b>되는 종속 장부입니다 — 매출·공급대금은 주문, 수수료율은 계약이 단일 원천이고, 창이 같으므로 정산 대상 합은 위 <b>총 거래액(GMV)</b>과 같은 값입니다. 정산 완료·예정 상태 축은 재부여 규칙이 확정되기 전까지 표시하지 않습니다.</div>
        </div>
      </div>
    </div>
  );
}
/* ── 데이터 하우스: 오브젝트별 검색 + 온톨로지 관계 드릴다운 ── */
const SC_MONEY = new Set(["salePrice", "supplyPrice", "amount", "margin", "ltv", "sales", "fee", "supplyCost", "credit", "payable", "marginNet", "preShip", "delivered"]);
function _scCell(v, k, row) {
  /* 파생 표기는 **데이터가 아니라 렌더**가 만든다 — 출고 표기는 식별자(fromVid)에서 조립한다.
     그래서 표시명 모드를 내리면 이 칸도 함께 코드 표기가 된다(§4-6-5 ⓐ). */
  if (k === "fromVid") return (typeof pgShipFrom === "function") ? pgShipFrom(row || { fromVid: v }) : String(v || "");
  if (v == null) return "";
  if (SC_MONEY.has(k) && typeof v === "number") return v >= 100000000 ? (v / 100000000).toFixed(1) + "억" : v >= 10000 ? Math.round(v / 10000).toLocaleString() + "만" : v.toLocaleString();
  if (k === "marginPct") return v + "%";
  if (typeof v === "number") return v.toLocaleString();
  return v;
}
/* 검색 · 조회 축 — **식별자 + 표시명 함수의 산출**이다. 저장된 상호 문자열(`vendorName`)을
   직접 매칭 축으로 쓰지 않는다: 그러면 표시명 모드를 내렸을 때 화면에 보이는 글자와 찾아지는
   글자가 어긋나고, 드릴다운이 넘기는 식별자와도 축이 맞지 않는다(§4-6-5 ⓒ).
   표시명을 지나므로 실명 모드에서는 상호로도 그대로 찾아지고, 코드 모드에서는 코드로 찾아진다. */
function _scVName(r) {
  if (!r) return "";
  return (typeof pgDisplayName === "function") ? pgDisplayName({ vendorId: r.vendorId || r.id, name: r.name, vendorName: r.vendorName }) : (r.vendorName || r.name || "");
}
function _scVKey(r) { return String((r && (r.vendorId || r.id)) || "") + _scVName(r); }
const SC_TABLES = [
  { key: "vendor", label: "거래처·공급사", ic: Factory, c: "#A78BFA", ph: "상호·유형·공급분류 검색", get: (d) => d.vendors, search: (r, q) => (_scVKey(r) + r.id + r.category + r.type).includes(q), cols: [["id", "ID"], ["name", "상호"], ["type", "유형"], ["category", "공급분류"], ["sla", "SLA(D+)"], ["trust", "신뢰도"]] },
  { key: "product", label: "제품·SKU", ic: Package, c: "#FBBF24", ph: "품목·거래처·분류 검색", get: (d) => d.products, search: (r, q) => (r.name + r.id + _scVKey(r) + r.category).includes(q), cols: [["id", "SKU"], ["name", "품목"], ["category", "분류"], ["vendorName", "공급 거래처"], ["salePrice", "판매가"], ["marginPct", "마진"]] },
  { key: "contract", label: "계약·단가", ic: ScrollText, c: "#2DD4BF", ph: "거래처·분류 검색", get: (d) => d.contracts, search: (r, q) => (_scVKey(r) + r.id + r.category).includes(q), cols: [["id", "계약ID"], ["vendorName", "거래처"], ["category", "분류"], ["marginPct", "마진"], ["feePct", "수수료%"], ["settleCycle", "정산주기"]] },
  { key: "availability", label: "공급사 가용재고", ic: Boxes, c: "#22D3EE", ph: "품목·거래처 검색 (당사 미보유)", get: (d) => d.availability, search: (r, q) => (r.skuName + r.id + _scVKey(r) + r.sku).includes(q), cols: [["id", "ID"], ["skuName", "품목"], ["vendorName", "보유 거래처"], ["qty", "가용수량"], ["leadDays", "출고 D+"], ["asof", "조회시각"]] },
  { key: "account", label: "고객·계정", ic: Users, c: "#F472B6", ph: "고객명·세그먼트·지역 검색", get: () => null, search: (r, q) => (r.name + r.id + r.seg + r.sido + r.grade).includes(q), cols: [["id", "계정ID"], ["name", "고객명"], ["seg", "세그먼트"], ["grade", "등급"], ["ltv", "LTV"], ["sido", "지역"]] },
  { key: "order", label: "주문", ic: ClipboardList, c: "#6366F1", ph: "주문ID·품목·거래처·계정 검색", get: (d) => d.orders, search: (r, q) => (r.id + r.sku + r.skuName + _scVKey(r) + r.accountId + r.status).includes(q), cols: [["id", "주문ID"], ["accountId", "계정"], ["skuName", "품목"], ["vendorName", "라우팅 거래처"], ["amount", "판매액"], ["status", "상태"]] },
  { key: "shipment", label: "배송", ic: Truck, c: "#38BDF8", ph: "배송·주문·거래처·송장 검색", get: (d) => d.shipments, search: (r, q) => (r.id + r.orderId + _scVKey(r) + r.carrier + r.status + r.tracking).includes(q), cols: [["id", "배송ID"], ["orderId", "주문"], ["vendorName", "출고 거래처"], ["carrier", "운송사"], ["status", "상태"], ["eta", "ETA"]] },
  /* 정산 탭 — 상태 열을 두지 않는다(상태 축 미정 · 1:1 승계 기각). 대신 **공급대금**을 싣는다:
     이 열의 합이 원가회계 「거래처 공급원가(매입)」·회계전기 「거래처 공급대금」과 원 단위까지 같아야 한다. */
  { key: "settlement", label: "정산", ic: Receipt, c: "#F59E0B", ph: "거래처·기간·전표ID 검색", get: (d) => d.settlements, search: (r, q) => (_scVKey(r) + r.id + r.period).includes(q), cols: [["id", "전표ID"], ["vendorName", "거래처"], ["period", "기간"], ["sales", "매출"], ["supplyCost", "공급대금"], ["fee", "수수료"]] },
];
/* 드릴다운 질의는 **식별자**다. 상호·품목명 문자열을 질의로 넘기면 표시명 모드를 내리는 순간
   글자가 아니라 **동작**이 바뀌어 관계 카드가 아무것도 찾지 못한다(§4-6-5 ⓒ).
   표 검색식도 같은 축(식별자)으로 맞춰 둬야 이 질의가 맞는다 — 둘은 한 쌍이다. */
function _scRel(tab, r, IDX) {
  const L = [];
  const P = (t, n, k, q) => L.push({ t, n, k, q });
  if (tab === "vendor") { P("제품", (IDX.pByV[r.id] || []).length, "product", r.id); P("계약", (IDX.cByV[r.id] || []).length, "contract", r.id); P("가용재고", (IDX.aByV[r.id] || []).length, "availability", r.id); P("정산", (IDX.sByV[r.id] || []).length, "settlement", r.id); }
  else if (tab === "product") { P("공급 거래처", 1, "vendor", r.vendorId); P("가용재고", (IDX.aBySku[r.id] || []).length, "availability", r.id); P("주문(참조)", null, "order", r.id); }
  else if (tab === "contract") { P("거래처", 1, "vendor", r.vendorId); }
  else if (tab === "availability") { P("보유 거래처", 1, "vendor", r.vendorId); P("제품", 1, "product", r.sku); }
  else if (tab === "account") { P("주문", null, "order", r.id); }
  else if (tab === "order") { P("고객·계정", 1, "account", r.accountId); P("제품", 1, "product", r.sku); P("라우팅 거래처", 1, "vendor", r.vendorId); P("배송", IDX.shByOrd[r.id] ? 1 : 0, "shipment", r.id); }
  else if (tab === "shipment") { P("주문", 1, "order", r.orderId); P("출고 거래처", 1, "vendor", r.vendorId); P("고객·계정", 1, "account", r.accountId); }
  else if (tab === "settlement") { P("거래처", 1, "vendor", r.vendorId); }
  return L;
}
function SupplyDetail({ rec, tab, idx, onClose, onGo }) {
  const rel = _scRel(tab, rec, idx);
  const T = SC_TABLES.find((t) => t.key === tab);
  return (
    <div className="ontov" onClick={onClose}><div className="ontmodal scdetail" onClick={(e) => e.stopPropagation()}>
      <div className="ontmh"><div><span className="ontmid">{rec.id}</span><div className="ontmname">{rec.name || rec.skuName || rec.vendorName || rec.id} <span>· {T.label}</span></div></div><button onClick={onClose}><X size={19} /></button></div>
      <div className="ontmbody">
        <div className="scdfields">{Object.entries(rec).filter(([k]) => !/^_|^mid$/.test(k)).map(([k, v]) => <div className="scdf" key={k}><span>{k}</span><b>{_scCell(v, k, rec)}</b></div>)}</div>
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
        <tbody>{view.map((r, i) => <tr key={i} onClick={() => setSel(r)}>{T.cols.map(([k]) => <td key={k}>{_scCell(r[k], k, r)}</td>)}</tr>)}</tbody></table></div>
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
  const WS = (typeof WALLET_SPLIT !== "undefined" && WALLET_SPLIT) ? WALLET_SPLIT : { earn: 60, give: 15, ops: 25 };
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
      <div className="scdashnote">무재고 모델이라 <b>재고자산·창고·직배송 택배비(거래처 부담)</b>가 당사 원가에서 제외됩니다. 당사 변동비 = 결제수수료 + 건강적립금 + 치료비 나눔(판매마진 배분). 공헌이익률 <b style={{ color: "#818CF8" }}>{(C.contribution / C.gross * 100).toFixed(1)}%</b>(마진 대비) · <b style={{ color: "#34D399" }}>{_scW(C.contribution)}</b>이 전사 고정비에 기여합니다.</div>
      <div className="scdashnote" style={{ marginTop: 6 }}>※ 고정비(인건비·IT 운영·영업·관리비)는 건강커머스 전용이 아니라 헬스메이트센터 사용료·AI 플랫폼 구독·건강검진 연계가 함께 부담합니다. 참고로 전사 고정비를 매출 비중(<b>{(C.fixRate * 100).toFixed(1)}%</b>, 예산양식 1차연도 기준)만큼 배분하면 커머스 단독 영업이익은 <b style={{ color: C.op < 0 ? "#F87171" : "#34D399" }}>{C.op < 0 ? "−" : ""}{_scW(Math.abs(C.op))}</b>입니다{C.allOp != null ? <> — 같은 기준의 <b>전사 영업이익은 {_scW(C.allOp)}</b>(1차연도 계획)</> : null}. 건강커머스는 마진의 {WS.earn + WS.give}%를 회원 적립·치료비 나눔으로 돌려주는 <b>회원 확보·데이터 엔진</b>이고, 수익은 사용료·구독에서 나오는 구조입니다.</div>
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
      {/* ⚠ 종전 문안은 「정산 데이터가 ERP 전표로 자동 전기되어 재무회계 손익계산서에 반영됩니다」였다.
          두 지면은 **같은 장부가 아니다** — 재무회계는 회원 10만 환산 **계획 모델**(finBudget)이고
          이 패널은 주문 30,000건의 **시연 시드 장부**다. 두 값이 다른 동안 「반영됩니다」라고 적으면
          독자가 한쪽 숫자로 다른 쪽을 검산하려 한다. 주인이 다르다는 사실을 적는다. */}
      <div className="scdashnote" style={{ marginTop: 10 }}>이 전기(轉記)는 <b>협력업체 거래 사실 레이어 안에서</b> 닫힙니다 — 매출·매입·플랫폼 마진이 모두 <b>주문 단일 원천</b>에서 나오고 정산 장부와 원 단위까지 일치합니다. <b style={{ color: "#FBBF24" }}>재무회계 탭의 손익계산서는 같은 장부가 아닙니다</b> — 그쪽은 회원 10만 명 환산 <b>계획 모델(예산양식)</b>이고 이 패널은 주문 {(typeof supplyData === "function" ? supplyData().counts.order : 0).toLocaleString()}건의 <b>시연 시드 장부</b>입니다. 두 지면의 금액은 산정 기준이 달라 서로 검산 대상이 아닙니다.</div>
      <button className="scfinbtn" onClick={() => onTab && onTab("finance")}><Landmark size={14} /> 재무회계 계획 모델 손익계산서 보기(별 기준) <ChevronRight size={15} /></button>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════════════════════════
   협력업체 온톨로지 · 하네스 — 서브탭 5개 (P5a · 지시서 §10-1)
   ══════════════════════════════════════════════════════════════════════════════
   종전에는 서브탭 없이 10블록을 한 화면 세로로 쏟았다. 보고서를 11번째 블록으로 붙이면 스크롤 끝에
   묻히므로, 형제 탭(사업 운영 콘솔)의 서브탭 패턴을 선례로 재배치한다. 구성은 §10-1 표 그대로다.

   ★ 서브탭 라벨·순서·성질(verdict / factLayer)의 단일 원천은 partnerGov.js 의 PG_SUBTABS 다.
     여기서 낱말을 만들지 않는다 — 컴포넌트는 키로 아이콘만 붙인다(§0-5). 러너도 그 표를 읽어
     지면을 순회하므로, 라벨을 두 곳에 적으면 개칭이 갈릴 때 검사가 「이동 실패 = 0건」으로
     조용히 통과한다.
   ★ **패널 머리와 법인 축 고지는 서브탭과 무관하게 항상 보인다.** 상호가 뜨는 지면마다 성격 표기가
     동반되어야 하는데, 탭을 옮기면 사라지는 고지는 2026-10-23 에 적발된 「다른 문단의 고지가 바닥을
     메워 통과」 함정의 바로 그 형태다. 그래서 고지를 탭 안에 두지 않는다.
   ★ ④와 ⑤를 **서로 잇는다** — 보고서의 한계 절에서 엔진 지면으로, 엔진의 조항 행에서 보고서
     판정표의 그 열로. 결론과 근거가 두 탭으로 갈리면 「과정이 보이게」가 무너진다(§11-4).
   ⚠ 서브탭 전환은 **관측의 이동**이지 조작이 아니다. 열람 등급·집행 수준·안전 임계값을 이 탭에서
     바꾸게 만들지 않는다(운영 콘솔 원칙). */
function _pgSubIcon(k) {
  const I = { overview: Network, trade: Truck, cost: Receipt, report: Scale, engine: ScrollText };
  return I[k] || Network;
}

/* ── ①개요 · 객체 머리의 체계 소개 — 정의 · 목적 · 성과 (대표 지시 2026-10-26) ─────────────────
   왜 여기인가: 현대해상 설명에는 **체계의 정의 · 목적 · 성과가 먼저** 오는 편이 맞다는 판단이다.
   그래서 이 블록을 서브탭 ① 의 **맨 앞**에 얹고, 종전 머리였던 무재고 · 거래처 직배송 모델 설명
   패널은 **지우지 않고 바로 아래에 그대로** 둔다(형 지시 — 밀어내지 말고 위에 얹을 것).
   ⚠ 이 컴포넌트는 문장도 숫자도 갖지 않는다. 문장은 PG_INTRO · PG_DECL(선언), 수치는 pgIntro()
     반환 필드다. 슬롯을 채우지 못하면 그 자리에 「—」가 찍히고 그 사실을 함께 렌더한다. */
function _pgIntroIcon(k) {
  const I = { def: Network, why: Target, done: TrendingUp };
  return I[k] || Network;
}
function PartnerIntro() {
  const rows = (typeof pgIntro === "function") ? pgIntro() : [];
  if (!rows.length) return null;
  const notes = (typeof pgIntroNotes === "function") ? pgIntroNotes() : [];
  const B = rows[0] ? rows[0].before : null;
  const decl = (k) => ((typeof PG_DECL !== "undefined" && PG_DECL[k]) ? PG_DECL[k] : "");
  return (
    <div className="ontpanel">
      <div className="ontph"><BookOpen size={15} color="#A78BFA" /> 체계 소개 <span>· 정의 · 목적 · 성과</span></div>
      <div className="pgintro3">
        {rows.map((r) => {
          const Ic = _pgIntroIcon(r.k);
          return (
            <div className="pgintrocard" key={r.k}>
              <div className="pgintrohd"><Ic size={14} /><b>{r.ko}</b><span>{r.en}</span></div>
              <p className="pgintrotx">{r.text}</p>
              {r.filled ? null : <div className="pgintromiss">{r.missing.join(" · ")} — {decl("introMiss")}</div>}
            </div>
          );
        })}
      </div>
      {/* 단서 줄 — **문단과 한 묶음이다.** 200자 안에 담지 못했지만 빼면 문단이 과장이 되는 사실들을
          선언 테이블(PG_INTRO_NOTE)이 들고 있고 수치는 반환 필드다. 지면은 순회해 찍기만 한다.
          ⚠ 독이 가리는 오른쪽 띠를 피하도록 .pgintronote 가 같은 여백 규약을 쓴다. */}
      {notes.length ? (
        <div className="pgintronote">
          <div className="chnote" style={{ marginTop: 10 }}>※ {decl("introNoteOwner")}</div>
          {notes.map((n) => (
            <div className="chnote" style={{ marginTop: 5 }} key={n.k}>· {n.text}
              {n.filled ? null : <span className="pgintromiss"> {n.missing.join(" · ")} — {decl("introMiss")}</span>}
            </div>
          ))}
          {B ? <div className="chnote" style={{ marginTop: 5 }}>· {decl("introBeforeOwner")} 측정 <b>{B.at}</b> · 정산 매출이 주문의 {B.ratio}배 · {B.rows}행 불성립 · 출처 {B.src} · {B.note}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
function SupplyOntology({ onGo, onTab }) {
  const CNT = (typeof supplyData === "function") ? supplyData().counts : {};
  const _ck = { vendor: "vendor", product: "product", avail: "availability", contract: "contract", account: "account", order: "order", shipment: "shipment", payment: "settlement" };
  const SUB = (typeof PG_SUBTABS !== "undefined") ? PG_SUBTABS : [];
  const [sub, setSub] = useState(SUB.length ? SUB[0].k : "overview");
  const [polFocus, setPolFocus] = useState(null);   /* 엔진 → 보고서 초점 {policyId, partnerId?} */
  const [engFocus, setEngFocus] = useState(null);   /* 보고서 → 엔진 초점 {policyId} */
  return (
    <div>
      {/* ── 패널 머리 (항상 보인다) ── */}
      <div className="ontpanel scintro">
        <div className="ontph"><Network size={15} color="#22D3EE" /> 협력업체 온톨로지 · 하네스 <span>· Partner Ontology &amp; Governance Harness · Asset-light Dropship</span></div>
        <div className="scmodel">
          <span className="scmodel-b"><Boxes size={13} /> 무재고(Asset-light)</span>
          <span className="scmodel-b"><Truck size={13} /> 거래처 직배송(Dropship)</span>
          <span className="scmodel-b"><ShieldCheck size={13} /> 당사 재고자산·창고 = 0</span>
        </div>
        {/* 법인 축 고지 — 회원(개인) 축의 가명 표기 규약을 여기에 적용할 수 없다. 이 레이어는 **의도적으로
            실상호**를 쓰므로 가명 표기를 적용하면 거짓이 된다. 그래서 성격 표기를 상호 축으로 따로 세운다.
            ⚠ 호칭과 성격을 **같은 줄에서** 적는다 — 다른 문단의 고지가 바닥을 메우면 이 문장만 떼어도
               가드가 통과하는 함정에 걸린다(2026-10-23 애블레이션 실측).
            ⚠ 서브탭 **밖**에 둔다 — 탭을 옮기면 사라지는 고지는 그 함정의 또 다른 형태다. */}
        <div className="chnote" style={{ marginTop: 10 }}>※ 이 레이어는 <b>거래 사실</b>만 들고 있습니다 — <b>거래처 상호는 실제 상호이며, 거래·통제 수치는 시연 시드 데이터입니다.</b> 회원 축의 가명 표기 규약과는 별 축입니다(법인에 가명 표기를 적용하면 거짓이 됩니다).</div>
      </div>

      {/* ── 서브탭 5개 ── */}
      <div className="aitabs" style={{ margin: "12px 0" }}>{SUB.map((t) => {
        const Ic = _pgSubIcon(t.k);
        return <div key={t.k} className={"aitab " + (sub === t.k ? "on" : "")} title={t.asks} onClick={() => setSub(t.k)}><Ic size={14} /> {t.ko}</div>;
      })}</div>

      {sub === "overview" && <>
        {/* ★ 체계의 정의 · 목적 · 성과가 먼저 읽히게 맨 앞에 둔다. 아래 모델 설명 패널은 그대로다. */}
        <PartnerIntro />
        <div className="ontpanel scintro" style={{ marginTop: 12 }}>
          <p className="scdesc">제품과 재고는 <b>거래처(공급사)가 보유</b>하고 <b style={{ color: "#38BDF8" }}>고객에게 직접 배송</b>합니다. 당사는 <b>재고 부담 없이</b> <b style={{ color: "#6366F1" }}>주문·데이터·정산을 오케스트레이션</b>하고, <b style={{ color: "#22D3EE" }}>공급사 가용재고를 실시간 조회(가시성)</b>만 합니다. 모든 오브젝트·연결·AI 에이전트가 이 무재고·직배송 모델로 정의됩니다.</p>
          <div className="ontobjbar" style={{ marginTop: 10 }}>
            {SC_OBJECTS.map((o) => {
              /* 라벨을 o.t.split(" ")[0] 로 만들던 방식은 **폐기**했다 — 8라벨 중 5건이 공백에서 잘려
                 「공급사 가용재고」가 「공급사」로, 「거래처·공급사」가 「거래처」로 줄었다(형 캡처의 그 라벨).
                 148은 가용재고 스냅샷 행수로 **정상**이고 틀린 것은 숫자가 아니라 이름이었다.
                 이제 라벨은 partnerGov.js 의 PG_COUNT_LABEL 단일 원천에서 온다. */
              return <div className="ontobj" key={o.id}><span className="ontobj-i" style={{ background: o.c + "1A" }}><o.ic size={16} color={o.c} /></span><div><b style={{ fontSize: 14 }}>{(CNT[_ck[o.id]] || 0).toLocaleString()}</b><span>{_scCountLabel(o.id, o.t)}</span></div></div>;
            })}
          </div>
        </div>

        <div className="ontpanel" style={{ marginTop: 12 }}>
          <div className="ontph"><Workflow size={15} color="#22D3EE" /> 개념도 · Concept Map <span>· 무재고 · 거래처 직배송</span></div>
          <SupplyGraph />
        </div>

        <div className="ontpanel" style={{ marginTop: 12 }}>
          <div className="ontph"><Boxes size={15} color="#FBBF24" /> 오브젝트 정의 · 키 프로퍼티 <span>· {SC_OBJECTS.length} Object Types</span></div>
          <div className="scobjs">
            {SC_OBJECTS.map((o) => (
              <div className="scobjcard" key={o.id} style={{ "--oc": o.c }}>
                <div className="scobjhd"><span className="scobj-i"><o.ic size={16} /></span><b>{o.t}</b></div>
                <div className="scobjtag">{o.tag}</div>
                <div className="scobjsys">{o.sys.map((s) => <span key={s} className="scsysbadge">{s}</span>)}</div>
                <ul className="scprops">{o.props.map((pp, i) => <li key={i} className={/^★/.test(pp) ? "hot" : ""}><Hash size={10} /> {pp.replace(/^★/, "")}</li>)}</ul>
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

        {/* [P6] AI 거버넌스 축 — 협력업체 AI 점검 7축 · 표준 매핑 · 자기 거버넌스 · 사람 승인 게이트.
            책임 AI 에이전트 카드 **바로 뒤**에 둔다: 이 축이 그 카드가 무엇을 할 수 있고 무엇을 할 수
            없는지를 정하므로, 떼어 놓으면 가드레일이 카드에서 보이지 않는다(§8-1 · §13-9). */}
        {typeof PartnerAIGov === "function" ? <PartnerAIGov /> : null}

        <div className="chnote" style={{ marginTop: 12 }}>※ <b>무재고(Asset-light)·거래처 직배송</b> 모델의 시연용 스키마입니다 — 제품·재고는 거래처(공급사)가 보유·배송하고 당사는 재고자산·창고를 두지 않습니다. 실제 운영 시 ERP(더존·SAP)·CRM(Salesforce)·물류(택배사 API·거래처 WMS) 커넥터 연동과 공급사 <b>가용재고 API</b>·권한·감사(HITL) 구성이 필요합니다.</div>
      </>}

      {sub === "trade" && <>
        <SupplyLiveBoard />
        <SupplyDashboard />
        <SupplyExplorer />
      </>}

      {sub === "cost" && <>
        <SupplyCostAccounting />
        <SupplyLedger onTab={onTab} />
      </>}

      {/* ★ 두 지면의 초점을 **양방향으로** 넘긴다(§11-4). 초점 모양은 {policyId, partnerId} 하나이고
          두 지면이 같은 모양을 받는다 — 모양이 갈리면 한쪽 링크가 조용히 죽는다.
          보고서 → 엔진은 그 조항의 레지스트리 카드를, 엔진 → 보고서는 판정표의 그 열(또는 그 칸)을 연다. */}
      {sub === "report" && <PartnerGovReport focusPolicy={polFocus}
        onEngine={(id) => { setEngFocus(id ? { policyId: id } : null); setSub("engine"); }} />}

      {sub === "engine" && <PartnerGovEngine focusPolicy={engFocus}
        onReport={(f) => { setPolFocus(f && f.policyId ? f : null); setSub("report"); }} />}
    </div>
  );
}
