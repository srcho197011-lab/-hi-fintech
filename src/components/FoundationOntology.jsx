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

/* ── HI-Fin 기반 실시간 현황판 ── */
function FoundationLiveBoard() {
  const D = React.useMemo(() => (typeof foundationData === "function" ? foundationData() : null), []);
  const st = React.useRef(null);
  const [run, setRun] = useState(true);
  const [, force] = useState(0);
  if (D && !st.current) st.current = { t: 0, sec: 0, tx: 0, aud: 0, dep: 0, load: 34, sla: 99.97, dq: 96.4, feed: [], alerts: [], work: 0 };
  useEffect(() => {
    if (!run || !D) return;
    const id = setInterval(() => {
      const s = st.current; const t = (s.t += 1);
      s.sec += Math.floor(Math.random() * 4); s.tx += Math.floor(2 + Math.random() * 9); s.aud += Math.floor(3 + Math.random() * 11);
      if (t % 5 === 0) s.dep += 1;
      s.load = Math.max(18, Math.min(88, s.load + (Math.random() * 10 - 5))); s.sla = +(99.9 + Math.random() * 0.09).toFixed(2); s.dq = +(95.5 + Math.random() * 1.5).toFixed(1); s.work = t % FND_DOMAINS.length;
      const EV = [["보안", "#F87171", "위협 차단 · " + ["비인가접근", "피싱", "악성코드", "DDoS"][t % 4]], ["배포", "#38BDF8", ["auth", "shop", "doctor-ai", "wallet"][t % 4] + "-svc 배포 완료"], ["감사", "#22D3EE", "감사 로그 기록 · 권한변경 승인"], ["온체인", "#6366F1", "HTK 트랜잭션 confirmed · +" + (Math.floor(Math.random() * 5) * 1000).toLocaleString() + " HTK"], ["데이터", "#A78BFA", "데이터 품질 스캔 완료 · 이상 0"]];
      const e = EV[t % EV.length]; s.feed.unshift({ id: "e" + t, k: e[0], c: e[1], x: e[2] }); s.feed = s.feed.slice(0, 9);
      if (t % 4 === 0) { const A = [["보안경보", "#F87171", "취약점 CVE-2026-" + (1000 + Math.floor(Math.random() * 8999)) + " 탐지 → 패치"], ["용량경보", "#FBBF24", "서비스 CPU 80% 초과 → 오토스케일"], ["감사이슈", "#22D3EE", "권한 이상 접근 거부 · EMP" + String(1 + Math.floor(Math.random() * 128)).padStart(4, "0")]]; const a = A[Math.floor(t / 4) % A.length]; s.alerts.unshift({ id: t, k: a[0], c: a[1], x: a[2] }); s.alerts = s.alerts.slice(0, 5); }
      force((x) => x + 1);
    }, 1200);
    return () => clearInterval(id);
  }, [run, D]);
  if (!D || !st.current) return null;
  const s = st.current;
  const kpi = [["실시간 위협 차단", s.sec.toLocaleString(), "#F87171"], ["온체인 TX", s.tx.toLocaleString(), "#6366F1"], ["감사 이벤트", s.aud.toLocaleString(), "#22D3EE"], ["서비스 부하", Math.round(s.load) + "%", "#38BDF8"], ["누적 배포", s.dep.toLocaleString(), "#34D399"]];
  return (
    <div className="ontpanel lbwrap" style={{ marginTop: 12 }}>
      <div className="ontph"><Gauge size={15} color="#22D3EE" /> HI-Fin 실시간 현황판 <span className={"lblive" + (run ? " on" : "")}>{run ? "● LIVE" : "○ 정지"}</span>
        <span style={{ marginLeft: "auto" }}><button className="scsimbtn" onClick={() => setRun((r) => !r)}>{run ? <><Pause size={13} /> 정지</> : <><Play size={13} /> 재생</>}</button></span>
      </div>
      <div className="lbkpi">{kpi.map(([k, v, c], i) => <div key={i}><b style={{ color: c }}>{v}</b><span>{k}</span></div>)}</div>
      <div className="lbcols">
        <div className="lbcol">
          <div className="lbh"><Server size={13} color="#38BDF8" /> 인프라·보안 상태</div>
          <div className="lbgauge"><span className="lbg-l">서비스 SLA</span><span className="lbg-bar"><i style={{ width: (s.sla - 99) / 1 * 100 + "%", background: "#34D399" }} /></span><span className="lbg-v" style={{ color: "#34D399" }}>{s.sla}%</span></div>
          <div className="lbgauge"><span className="lbg-l">서버 부하</span><span className="lbg-bar"><i style={{ width: s.load + "%", background: s.load > 75 ? "#F87171" : "#38BDF8" }} /></span><span className="lbg-v" style={{ color: s.load > 75 ? "#F87171" : "#38BDF8" }}>{Math.round(s.load)}%</span></div>
          <div className="lbgauge"><span className="lbg-l">데이터 품질</span><span className="lbg-bar"><i style={{ width: s.dq + "%", background: "#A78BFA" }} /></span><span className="lbg-v" style={{ color: "#A78BFA" }}>{s.dq}</span></div>
          <div className="lbmini"><span className="lbdot pulse" style={{ background: "#F87171" }} /> 보안관제 SOC 실시간 감시 · 위협 자동 차단</div>
        </div>
        <div className="lbcol">
          <div className="lbh"><ShieldCheck size={13} color="#F472B6" /> 도메인 상태</div>
          <div className="lbagents">{FND_DOMAINS.map((d, i) => <div className="lbagent" key={d.id}><span className={"lbdot" + (i === s.work ? " pulse" : "")} style={{ background: i === s.work ? "#FBBF24" : "#34D399" }} /><span className="lba-n">{d.name.split(" ")[0]}</span><span className="lba-s" style={{ color: i === s.work ? "#FBBF24" : "#34D399" }}>{i === s.work ? "처리중" : "정상"}</span></div>)}</div>
        </div>
        <div className="lbcol">
          <div className="lbh"><AlertTriangle size={13} color="#FBBF24" /> 실시간 알림</div>
          <div className="lbalerts">{s.alerts.length === 0 ? <div className="scempty">알림 대기 중…</div> : s.alerts.map((a) => <div className="lbalert" key={a.id}><span className="lba-tag" style={{ color: a.c, borderColor: a.c }}>{a.k}</span><span className="lba-x">{a.x}</span></div>)}</div>
        </div>
      </div>
      <div className="lbcol" style={{ marginTop: 10 }}>
        <div className="lbh"><Zap size={13} color="#818CF8" /> 실시간 이벤트 (보안·배포·감사·온체인·데이터)</div>
        <div className="lbfeed">{s.feed.length === 0 ? <div className="scempty">이벤트 대기 중…</div> : s.feed.map((f) => <div className="lbfeedrow" key={f.id}><span className="lbf-t" style={{ color: f.c, borderColor: f.c }}>{f.k}</span><span className="lbf-x">{f.x}</span></div>)}</div>
      </div>
    </div>
  );
}
/* ── HI-Fin 도메인 데이터 하우스 ── */
const FND_TABLES = [
  { key: "sec", label: "보안 인시던트", ic: ShieldCheck, c: "#F87171", ph: "유형·심각도·출처 검색", get: (d) => d.incidents, cols: [["id", "ID"], ["ts", "일시"], ["type", "유형"], ["severity", "심각도"], ["source", "출처IP"], ["status", "상태"]], search: (r, q) => (r.id + r.type + r.severity + r.source + r.status).includes(q) },
  { key: "ai", label: "IT 서비스", ic: Server, c: "#38BDF8", ph: "서비스·유형·상태 검색", get: (d) => d.services, cols: [["id", "ID"], ["name", "서비스"], ["type", "유형"], ["status", "상태"], ["uptime", "가동률"], ["cpu", "CPU"]], search: (r, q) => (r.id + r.name + r.type + r.status).includes(q) },
  { key: "hr", label: "임직원", ic: Users, c: "#34D399", ph: "이름·부서·직급 검색", get: (d) => d.employees, cols: [["id", "사번"], ["name", "이름"], ["dept", "부서"], ["position", "직급"], ["join", "입사"], ["status", "상태"]], search: (r, q) => (r.id + r.name + r.dept + r.position + r.status).includes(q) },
  { key: "ga", label: "자산", ic: Building, c: "#FBBF24", ph: "자산·분류·부서 검색", get: (d) => d.assets, cols: [["id", "ID"], ["name", "자산"], ["category", "분류"], ["value", "가액"], ["dept", "부서"], ["status", "상태"]], search: (r, q) => (r.id + r.name + r.category + r.dept + r.status).includes(q) },
  { key: "dg", label: "데이터 자산", ic: Database, c: "#A78BFA", ph: "데이터셋·도메인·PII 검색", get: (d) => d.dataAssets, cols: [["id", "ID"], ["name", "데이터셋"], ["domain", "도메인"], ["quality", "품질"], ["pii", "개인정보"], ["masking", "마스킹"]], search: (r, q) => (r.id + r.name + r.domain + r.pii).includes(q) },
  { key: "audit", label: "감사 로그", ic: ScrollText, c: "#22D3EE", ph: "actor·행위·대상 검색", get: (d) => d.auditLogs, cols: [["id", "ID"], ["ts", "일시"], ["actor", "actor"], ["action", "행위"], ["target", "대상"], ["result", "결과"]], search: (r, q) => (r.id + r.actor + r.action + r.target + r.result).includes(q) },
  { key: "chain", label: "온체인 TX", ic: Blocks, c: "#6366F1", ph: "해시·유형·블록 검색", get: (d) => d.txs, cols: [["id", "ID"], ["hash", "해시"], ["type", "유형"], ["amount", "금액"], ["block", "블록"], ["status", "상태"]], search: (r, q) => (r.id + r.hash + r.type + String(r.block)).includes(q) },
];
function _fndCell(v, k) { if (v == null) return ""; if (k === "value" && typeof v === "number") return (typeof _scW === "function" ? _scW(v) : v.toLocaleString()); if (typeof v === "number") return v.toLocaleString(); return v; }
function FoundationExplorer() {
  const D = React.useMemo(() => (typeof foundationData === "function" ? foundationData() : null), []);
  const [tab, setTab] = useState("sec");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  if (!D) return null;
  const T = FND_TABLES.find((t) => t.key === tab);
  const rows = T.get(D); const qq = q.trim();
  const filtered = qq ? rows.filter((r) => T.search(r, qq)) : rows;
  const per = 12; const pages = Math.max(1, Math.ceil(filtered.length / per));
  const pg = Math.min(page, pages - 1);
  const view = filtered.slice(pg * per, pg * per + per);
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Search size={15} color="#38BDF8" /> 도메인 데이터 하우스 · 오브젝트 검색 <span>· 7 Domains</span></div>
      <div className="sctabs">{FND_TABLES.map((t) => <button key={t.key} className={"sctab" + (tab === t.key ? " on" : "")} style={{ "--tc": t.c }} onClick={() => { setTab(t.key); setQ(""); setPage(0); }}><t.ic size={13} /> {t.label} <i>{t.get(D).length.toLocaleString()}</i></button>)}</div>
      <div className="scsearch"><Search size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={T.ph} /><span>{filtered.length.toLocaleString()}건</span></div>
      <div className="sctablewrap"><table className="sctable"><thead><tr>{T.cols.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
        <tbody>{view.map((r, i) => <tr key={i}>{T.cols.map(([k]) => <td key={k}>{_fndCell(r[k], k)}</td>)}</tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="scempty">검색 결과가 없습니다.</div>}
      <div className="scpager"><button disabled={pg <= 0} onClick={() => setPage(pg - 1)}>‹ 이전</button><span>{(pg + 1).toLocaleString()} / {pages.toLocaleString()} 페이지</span><button disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>다음 ›</button></div>
    </div>
  );
}
/* ── 도메인별 책임 AI 에이전트 + 액션 실행 ── */
const FND_AGENT_ACTIONS = {
  sec: [{ t: "위협 자동 차단", run: (D) => ({ msg: "탐지 위협 " + D.incidents.filter((x) => x.status === "차단").length + "건 차단정책 적용" }) }, { t: "취약점 스캔", run: () => ({ msg: "전 자산 취약점 스캔 · 패치 오케스트레이션", hitl: true }) }],
  ai: [{ t: "오토스케일 실행", run: () => ({ msg: "부하 80% 초과 서비스 오토스케일-out" }) }, { t: "카나리 배포", run: () => ({ msg: "신규 빌드 카나리 5% 배포 시작", hitl: true }) }],
  hr: [{ t: "근태 마감", run: () => ({ msg: "당월 근태 집계·마감 배치", hitl: true }) }, { t: "채용 파이프 동기화", run: () => ({ msg: "채용 진행 후보 상태 동기화" }) }],
  ga: [{ t: "자산 실사", run: (D) => ({ msg: "관리 자산 " + D.assets.length + "건 실사 대사 시작", hitl: true }) }, { t: "계약 만료 알림", run: () => ({ msg: "만료 임박 계약 담당자 알림 발송" }) }],
  dg: [{ t: "데이터 품질 스캔", run: (D) => ({ msg: "데이터 자산 " + D.dataAssets.length + "건 품질·이상 스캔" }) }, { t: "PII 마스킹 검증", run: () => ({ msg: "PII 데이터셋 마스킹 정책 검증·적용", hitl: true }) }],
  audit: [{ t: "감사 스냅샷", run: () => ({ msg: "불변 감사로그 스냅샷·해시 앵커링" }) }, { t: "이상 접근 감사", run: () => ({ msg: "권한 이상 접근 감사 리포트 생성", hitl: true }) }],
  chain: [{ t: "HTK 정산 배치", run: () => ({ msg: "온체인 HTK 정산 배치·증명 기록", hitl: true }) }, { t: "증명 앵커링", run: () => ({ msg: "오프체인 데이터 해시 온체인 앵커링" }) }],
};
function FoundationAgents() {
  const D = React.useMemo(() => (typeof foundationData === "function" ? foundationData() : null), []);
  const [log, setLog] = useState([]);
  const lid = React.useRef(0);
  if (!D) return null;
  const run = (d, act) => { const r = act.run(D); const id = ++lid.current; setLog((l) => [{ id, agent: d.agent, c: d.c, msg: r.msg, status: r.hitl ? "승인대기" : "실행완료" }, ...l].slice(0, 12)); if (typeof toast === "function") toast("🤖 " + d.agent + " · " + r.msg); };
  const approve = (id) => { setLog((l) => l.map((x) => x.id === id ? { ...x, status: "승인완료" } : x)); if (typeof toast === "function") toast("✅ 승인 완료 · 액션 실행"); };
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Bot size={15} color="#F472B6" /> 도메인 책임 AI 에이전트 · 액션 실행 <span>· {FND_DOMAINS.length} Agents · HITL 승인</span></div>
      <div className="scagents">
        {FND_DOMAINS.map((d) => (
          <div className="scagentcard" key={d.id} style={{ "--ac": d.c }}>
            <div className="scagenthd"><span className="scagent-i"><d.ic size={18} /></span><div><b>{d.agent}</b><span>{d.name.split(" ")[0]} · {d.system}</span></div></div>
            <div className="scactbtns">{(FND_AGENT_ACTIONS[d.id] || []).map((act, i) => <button key={i} className="scactbtn" style={{ "--ac": d.c }} onClick={() => run(d, act)}><Play size={11} /> {act.t}</button>)}</div>
          </div>
        ))}
      </div>
      <div className="scjournalh" style={{ marginTop: 12 }}><Workflow size={13} /> 액션 실행 로그</div>
      <div className="scactlog">{log.length === 0 ? <div className="scempty">도메인 에이전트의 액션 버튼을 눌러 실행하세요. (HITL 액션은 승인 필요)</div> : log.map((x) => (
        <div className="scactrow" key={x.id} style={{ "--ac": x.c }}>
          <span className="scact-a">{x.agent}</span><span className="scact-m">{x.msg}</span>
          {x.status === "승인대기" ? <button className="scact-appr" onClick={() => approve(x.id)}>승인</button> : <span className={"scact-st " + (x.status === "승인완료" ? "ok" : "done")}>{x.status}</span>}
        </div>
      ))}</div>
    </div>
  );
}
/* ── 도메인 360° 뷰 ── */
const FND_DOMKEY = { sec: "incidents", ai: "services", hr: "employees", ga: "assets", dg: "dataAssets", audit: "auditLogs", chain: "txs" };
function FoundationDomain360({ d, D, onClose }) {
  const rows = D[FND_DOMKEY[d.id]] || [];
  const tbl = FND_TABLES.find((t) => t.key === d.id);
  const sample = rows.slice(0, 6);
  const acts = FND_AGENT_ACTIONS[d.id] || [];
  return (
    <div className="ontov" onClick={onClose}><div className="ontmodal v360" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
      <div className="ontmh"><div><span className="ontmid" style={{ color: d.c }}>{d.system}</span><div className="ontmname">{d.name} <span>· 360° 뷰</span></div></div><button onClick={onClose}><X size={19} /></button></div>
      <div className="ontmbody">
        <div className="v360kpi">{d.kpis.map(([k, v], i) => <div key={i}><b style={{ color: d.c }}>{v}</b><span>{k}</span></div>)}</div>
        <div className="v360sec"><b><Hash size={12} /> 핵심 오브젝트</b><div className="v360chips">{d.objects.map((o) => <span key={o}>{o}</span>)}</div></div>
        <div className="v360sec"><b><Search size={12} /> 인스턴스 샘플 ({rows.length.toLocaleString()}건)</b>
          <div className="sctablewrap" style={{ marginTop: 6 }}><table className="sctable"><thead><tr>{tbl.cols.slice(0, 5).map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
            <tbody>{sample.map((r, i) => <tr key={i}>{tbl.cols.slice(0, 5).map(([k]) => <td key={k}>{_fndCell(r[k], k)}</td>)}</tr>)}</tbody></table></div>
        </div>
        <div className="v360grid2">
          <div className="v360sec"><b><Cpu size={12} /> 연결 시스템</b><div className="v360li">{d.system}</div></div>
          <div className="v360sec"><b><Bot size={12} /> 담당 AI 에이전트</b><div className="v360li"><span style={{ color: d.c, fontWeight: 800 }}>●</span> {d.agent} <span style={{ color: "#34D399" }}>· 정상 가동</span></div>
            <div className="scactbtns" style={{ marginTop: 6 }}>{acts.map((a, i) => <span key={i} className="fndobj" style={{ color: d.c }}>{a.t}</span>)}</div></div>
        </div>
      </div>
    </div></div>
  );
}
function FoundationOntology({ onGo }) {
  const D = React.useMemo(() => (typeof foundationData === "function" ? foundationData() : null), []);
  const [sel, setSel] = useState(null);
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

      <FoundationLiveBoard />

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Workflow size={15} color="#22D3EE" /> 개념도 · Foundation Map <span>· 7 도메인 × HI-Fin 플랫폼</span></div>
        <FoundationGraph />
      </div>

      <FoundationExplorer />

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Boxes size={15} color="#A78BFA" /> 도메인 온톨로지 · 오브젝트·지표·시스템 <span>· {FND_DOMAINS.length} Domains</span></div>
        <div className="fndgrid">
          {FND_DOMAINS.map((d) => (
            <div className="fndcard clk" key={d.id} style={{ "--oc": d.c }} onClick={() => setSel(d)}>
              <div className="scobjhd"><span className="scobj-i"><d.ic size={16} /></span><b>{d.name}</b><span className="fnd360">360° ›</span></div>
              <div className="scobjtag">{d.desc}</div>
              <div className="fndkpi">{d.kpis.map(([k, v], i) => <div key={i}><b>{v}</b><span>{k}</span></div>)}</div>
              <div className="scobjsys" style={{ marginTop: 8 }}>{d.objects.map((o) => <span key={o} className="fndobj">{o}</span>)}</div>
              <div className="fndfoot"><span><Cpu size={11} /> {d.system}</span><span><Bot size={11} /> {d.agent}</span></div>
            </div>
          ))}
        </div>
      </div>

      <FoundationAgents />

      <div className="chnote" style={{ marginTop: 12 }}>※ HI-Fin 기반 온톨로지는 <b>운영·거버넌스 백본의 시연용 스키마</b>입니다. 오브젝트·지표·담당 에이전트 정의는 표준 참조모델이며, 실제 운영 시 각 도메인 시스템(IAM·MLOps·HRIS·데이터카탈로그·GRC·체인) 연동과 권한·감사(HITL) 구성이 필요합니다.</div>
      {sel && D && <FoundationDomain360 d={sel} D={D} onClose={() => setSel(null)} />}
    </div>
  );
}
