/* ====================== HI-Fin 기반 온톨로지 (Foundation · 운영·거버넌스 백본) ======================
   보안 · AI전산 · 인사 · 총무 · 데이터 거버넌스 · Audit · 블록체인 — 플랫폼 전역을 지탱하는 온톨로지.
   데이터 거버넌스가 온톨로지 표준·마스터데이터의 중심축, Audit가 전방위 감사. (시연용 스키마·합성지표) */

const FND_DOMAINS = [
  {
    id: "sec", name: "보안 (Security)", ic: ShieldCheck, c: "#F87171", desc: "접근통제·위협탐지·개인정보 보호",
    objects: ["접근권한·IAM", "인증·MFA", "위협·인시던트", "취약점·패치", "암호화·키관리"],
    kpis: [["차단 위협", "12,480"], ["MFA 적용", "100%"], ["취약점 패치", "98.6%"], ["보안 인시던트", "0"]],
    system: "SIEM · EDR · IAM · DLP", agent: "보안관제(SOC) AI",
  },
  {
    id: "ai", name: "AI전산 (AI·IT Ops)", ic: Server, c: "#38BDF8", desc: "인프라·서비스·AI모델 운영(MLOps)",
    objects: ["서버·인프라", "서비스·API", "AI모델·배포", "모니터링·로그", "장애·SLA"],
    kpis: [["서비스 가동률", "99.98%"], ["운영 서버", "42"], ["주간 배포", "37"], ["모델 추론/일", "1.2M"]],
    system: "클라우드 · MLOps · APM · CI/CD", agent: "AIOps 운영 에이전트",
  },
  {
    id: "hr", name: "인사 (HR)", ic: Users, c: "#34D399", desc: "임직원·조직·채용·평가·근태",
    objects: ["임직원·조직", "채용·온보딩", "평가·보상", "근태·휴가", "교육·역량"],
    kpis: [["임직원", "128명"], ["채용 진행", "9"], ["이직률", "6.2%"], ["교육 이수", "96%"]],
    system: "HRIS · 근태 · 전자결재", agent: "HR 오퍼레이션 에이전트",
  },
  {
    id: "ga", name: "총무 (General Affairs)", ic: Building, c: "#FBBF24", desc: "자산·계약·구매·시설 관리",
    objects: ["고정자산·비품", "계약·문서", "구매·발주", "시설·차량", "전자결재"],
    kpis: [["관리 자산", "1,240"], ["유효 계약", "86"], ["구매요청", "214"], ["결재 처리", "1,930"]],
    system: "자산관리 · 전자계약 · 구매", agent: "총무 자동화 에이전트",
  },
  {
    id: "dg", name: "데이터 거버넌스 (Governance)", ic: Database, c: "#A78BFA", desc: "★온톨로지 표준·마스터데이터·품질·개인정보",
    objects: ["데이터 카탈로그", "품질·리니지", "마스터데이터(MDM)", "개인정보·동의", "마스킹·접근"],
    kpis: [["데이터 자산", "3,472"], ["품질 점수", "96.4"], ["PII 마스킹", "100%"], ["동의 관리", "99.1%"]],
    system: "데이터카탈로그 · MDM · DLP", agent: "데이터 스튜어드 AI",
  },
  {
    id: "audit", name: "Audit (내부감사·통제)", ic: ScrollText, c: "#22D3EE", desc: "전방위 감사로그·내부통제·규정준수",
    objects: ["감사로그(불변)", "내부통제(ITGC)", "규정준수·컴플라이언스", "증적·리스크", "이상탐지"],
    kpis: [["감사 이벤트", "58,900"], ["통제 준수", "99.2%"], ["오픈 이슈", "3"], ["증적 확보", "100%"]],
    system: "감사추적 · GRC · 이상탐지", agent: "감사·컴플라이언스 AI",
  },
  {
    id: "chain", name: "블록체인 (Blockchain)", ic: Blocks, c: "#6366F1", desc: "Health Token·NFT·트랜잭션·스마트컨트랙트",
    objects: ["지갑·계정", "Health Token(HTK)", "트랜잭션", "스마트컨트랙트", "Health NFT"],
    kpis: [["HTK 발행", "4.82억"], ["트랜잭션", "1,284K"], ["지갑", "100,000"], ["컨트랙트", "24"]],
    system: "체인 · 지갑 · NFT · 오라클", agent: "온체인 정산·증명 에이전트",
  },
];

/* ── 개념도: HI-Fin 플랫폼 중심 + 7 도메인, 데이터 거버넌스(축)·Audit(전방위) 강조 ── */
function FoundationGraph() {
  const C = { x: 350, y: 235, t: "HI-Fin 플랫폼", c: "#22D3EE" };
  const N = [
    { id: "dg", t: "데이터 거버넌스", x: 350, y: 70, c: "#A78BFA", hub: 1 },
    { id: "sec", t: "보안", x: 160, y: 120, c: "#F87171" },
    { id: "ai", t: "AI전산", x: 540, y: 120, c: "#38BDF8" },
    { id: "audit", t: "Audit", x: 600, y: 250, c: "#22D3EE", hub: 1 },
    { id: "chain", t: "블록체인", x: 500, y: 390, c: "#6366F1" },
    { id: "ga", t: "총무", x: 200, y: 390, c: "#FBBF24" },
    { id: "hr", t: "인사", x: 100, y: 250, c: "#34D399" },
  ];
  const P = Object.fromEntries([{ ...C, id: "core" }, ...N].map((n) => [n.id, n]));
  const cross = [["dg", "sec"], ["dg", "chain"], ["dg", "ai"], ["audit", "chain"], ["audit", "hr"], ["audit", "ga"]];
  return (
    <div className="ontgraph">
      <svg viewBox="0 0 700 470" style={{ width: "100%", height: "auto", display: "block" }}>
        {N.map((n) => <line key={"c" + n.id} x1={C.x} y1={C.y} x2={n.x} y2={n.y} stroke="#33456A" strokeWidth={n.hub ? "2" : "1.5"} />)}
        {cross.map(([a, b], i) => { const A = P[a], B = P[b]; return <line key={"x" + i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={A.c} strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="4 4" />; })}
        <g><circle cx={C.x} cy={C.y} r="40" fill="#101f3c" stroke={C.c} strokeWidth="2.6" /><text x={C.x} y={C.y - 2} fill="#EAF2FF" fontSize="12" fontWeight="900" textAnchor="middle">HI-Fin</text><text x={C.x} y={C.y + 12} fill={C.c} fontSize="9" fontWeight="700" textAnchor="middle">플랫폼</text></g>
        {N.map((n) => (<g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.hub ? 32 : 28} fill="#0F1B33" stroke={n.c} strokeWidth={n.hub ? "2.4" : "2"} />
          <text x={n.x} y={n.y + 4} fill="#EAF2FF" fontSize={n.t.length > 4 ? "9" : "10.5"} fontWeight="800" textAnchor="middle">{n.t}</text>
        </g>))}
      </svg>
      <div className="ontgraph-note">Domains <b>7</b> — <b style={{ color: "#A78BFA" }}>데이터 거버넌스</b>가 온톨로지 표준·마스터데이터·개인정보의 중심축, <b style={{ color: "#22D3EE" }}>Audit</b>가 전방위 감사로그·내부통제를 담당합니다. 보안·AI전산·인사·총무·블록체인이 <b>HI-Fin 플랫폼</b>을 지탱하며, 헬스케어·공급망·재무·마케팅 온톨로지와 연결됩니다.</div>
    </div>
  );
}

function FoundationOntology({ onGo }) {
  return (
    <div>
      <div className="ontpanel scintro">
        <div className="ontph"><ShieldCheck size={15} color="#22D3EE" /> HI-Fin 기반 온톨로지 <span>· Foundation · 운영·거버넌스 백본</span></div>
        <div className="scmodel">
          <span className="scmodel-b"><Database size={13} /> 데이터 거버넌스 중심축</span>
          <span className="scmodel-b"><ScrollText size={13} /> 전방위 Audit</span>
          <span className="scmodel-b"><Blocks size={13} /> 온체인 신뢰(블록체인)</span>
        </div>
        <p className="scdesc">보안·AI전산·인사·총무·데이터 거버넌스·Audit·블록체인이 <b>HI-Fin 플랫폼</b>을 지탱합니다. <b style={{ color: "#A78BFA" }}>데이터 거버넌스</b>가 온톨로지 표준·마스터데이터·개인정보를 관장하고, <b style={{ color: "#22D3EE" }}>Audit</b>가 모든 활동을 불변 로그로 감사하며, <b style={{ color: "#6366F1" }}>블록체인</b>이 Health Token·정산·증명의 신뢰를 담보합니다.</p>
        <div className="ontobjbar" style={{ marginTop: 10, gridTemplateColumns: "repeat(7,1fr)" }}>
          {FND_DOMAINS.map((d) => (
            <div className="ontobj" key={d.id}><span className="ontobj-i" style={{ background: d.c + "1A" }}><d.ic size={16} color={d.c} /></span><div><b style={{ fontSize: 12 }}>{d.name.split(" ")[0]}</b><span>{d.kpis[0][1]}</span></div></div>
          ))}
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Workflow size={15} color="#22D3EE" /> 개념도 · Foundation Map <span>· 7 도메인 × HI-Fin 플랫폼</span></div>
        <FoundationGraph />
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Boxes size={15} color="#A78BFA" /> 도메인 온톨로지 · 오브젝트·지표·시스템 <span>· {FND_DOMAINS.length} Domains</span></div>
        <div className="fndgrid">
          {FND_DOMAINS.map((d) => (
            <div className="fndcard" key={d.id} style={{ "--oc": d.c }}>
              <div className="scobjhd"><span className="scobj-i"><d.ic size={16} /></span><b>{d.name}</b></div>
              <div className="scobjtag">{d.desc}</div>
              <div className="fndkpi">{d.kpis.map(([k, v], i) => <div key={i}><b>{v}</b><span>{k}</span></div>)}</div>
              <div className="scobjsys" style={{ marginTop: 8 }}>{d.objects.map((o) => <span key={o} className="fndobj">{o}</span>)}</div>
              <div className="fndfoot"><span><Cpu size={11} /> {d.system}</span><span><Bot size={11} /> {d.agent}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="chnote" style={{ marginTop: 12 }}>※ HI-Fin 기반 온톨로지는 <b>운영·거버넌스 백본의 시연용 스키마</b>입니다. 오브젝트·지표·담당 에이전트 정의는 표준 참조모델이며, 실제 운영 시 각 도메인 시스템(IAM·MLOps·HRIS·데이터카탈로그·GRC·체인) 연동과 권한·감사(HITL) 구성이 필요합니다.</div>
    </div>
  );
}
