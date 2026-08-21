/* ====================== 재무회계 온톨로지 시스템 (K-IFRS) ======================
   섹션별 거래(제품판매·입점수수료·EMR/SaaS·보험중개·광고)를 실시간 분개(journal)로 인식하고,
   K-IFRS 손익계산서(매출→매출원가→매출총이익→판관비→영업이익→기타손익→법인세전이익→법인세→당기순이익)와
   부채(토큰적립금=계약부채, 기부금준비금, 매입채무)를 실시간 집계하는 회계 시뮬레이션 대시보드. */

const FIN_TAX = 0.22; // 법인세율(지방세 포함 근사)
const finWon = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 100000000) return s + (n / 100000000).toFixed(2) + "억"; if (n >= 10000) return s + Math.round(n / 10000).toLocaleString() + "만"; return s + n.toLocaleString(); };
const finRr = (a, b) => a + Math.random() * (b - a);
// 매출 유형(수익 계정) — IFRS 15 수익
const FIN_REVTYPES = [
  { k: "product", label: "제품판매 매출", src: "건강쇼핑(GMV)", c: "#34D399", w: 38, min: 15000, max: 320000 },
  { k: "checkup", label: "검진 연계 수수료", src: "건강검진센터(건당 2.5만 — 재무모델 정합)", c: "#22D3EE", w: 20, min: 25000, max: 25000 },
  { k: "service", label: "헬스케어 서비스 수수료", src: "상담·홈케어·재활·PT", c: "#2DD4BF", w: 12, min: 8000, max: 40000 },
  { k: "reservation", label: "예약 서비스 수수료", src: "골프·시설 예약(건당 1만)", c: "#F97316", w: 10, min: 10000, max: 10000 },
  { k: "emr", label: "EMR·UIP 사용료", src: "병원·검진센터·약국(월정액·전액)", c: "#6366F1", w: 7, min: 200000, max: 3500000 },
  { k: "insurance", label: "보험 중개 수수료", src: "마케팅(퍼미션) 동의 건(건당 7만 — 재무모델 정합)", c: "#A78BFA", w: 12, min: 70000, max: 70000 },
  { k: "ad", label: "광고·제휴 매출", src: "제휴·마케팅", c: "#FBBF24", w: 5, min: 40000, max: 260000 },
];
const FIN_COGS_META = [["product", "제품 원가", "#F472B6"], ["infra", "검진·인프라 원가", "#38BDF8"], ["payment", "결제 대행 수수료", "#94A3B8"]];
const FIN_SGA_META = [["payroll", "인건비", "#F59E0B"], ["marketing", "마케팅비", "#EC4899"], ["rnd", "연구개발비", "#8B5CF6"], ["rent", "임차료·관리비", "#64748B"], ["depr", "감가상각비", "#0EA5E9"], ["reward", "포인트(토큰적립) 비용", "#22D3EE"], ["donation", "기부금(치료비 나눔)", "#E11D48"]];
const FIN_LIAB_META = [["token", "토큰적립금 (계약부채)", "#22D3EE"], ["donation", "기부금 준비금 (미지급기부금)", "#E11D48"], ["payable", "매입채무·미지급금", "#94A3B8"]];
const FIN_FIX = { payroll: [150000, 210000], marketing: [210000, 340000], rnd: [80000, 150000], rent: [50000, 85000], depr: [34000, 58000] };   // 인건비·마케팅 상향(2026-08-20 재무모델 정합 — 시뮬 스케일)
const _finZero = () => ({ rev: { product: 0, checkup: 0, service: 0, reservation: 0, emr: 0, insurance: 0, ad: 0 }, cogs: { product: 0, infra: 0, payment: 0 }, sga: { payroll: 0, marketing: 0, rnd: 0, rent: 0, depr: 0, reward: 0, donation: 0 }, other: { income: 0, finIncome: 0, finCost: 0 }, liab: { token: 0, donation: 0, payable: 0 } });
const _finSum = (o) => Object.values(o).reduce((s, v) => s + v, 0);
function finPL(a) {
  const revenue = _finSum(a.rev), cogs = _finSum(a.cogs), gross = revenue - cogs, sga = _finSum(a.sga), op = gross - sga;
  const finIncome = a.other.finIncome, finCost = a.other.finCost, otherIncome = a.other.income;
  const pbt = op + finIncome - finCost + otherIncome, tax = Math.max(0, pbt) * FIN_TAX, net = pbt - tax;
  return { revenue, cogs, gross, sga, op, finIncome, finCost, otherIncome, pbt, tax, net, opMargin: revenue ? op / revenue : 0, netMargin: revenue ? net / revenue : 0 };
}
const FIN_INST = { checkup: ["KMI한국의학연구소", "한신메디피아검진센터", "서울아산건강증진센터", "세브란스체크업", "차움검진센터", "하나로의료재단"], emr: ["강북삼성병원", "분당서울대병원", "가천대길병원", "인하대병원", "아주대병원"], ad: ["제휴 광고주", "제약사 캠페인", "건기식 브랜드"] };
const _finInst = (k) => { const a = FIN_INST[k]; return a ? a[Math.floor(Math.random() * a.length)] : "제휴사"; };
const _finWpick = () => { const t = FIN_REVTYPES.reduce((s, x) => s + x.w, 0); let r = Math.random() * t; for (const x of FIN_REVTYPES) { r -= x.w; if (r <= 0) return x; } return FIN_REVTYPES[0]; };
// 재무상태표(자산=부채+자본). 자본금·잉여금은 초기 자본, 이익잉여금=누적 순이익. 현금은 대차 평형 잔여(plug).
const FIN_CAPITAL = 300000000, FIN_SURPLUS = 500000000, FIN_LEASE = 120000000, FIN_LONGDEBT = 200000000;
function finBS(a) {
  const pl = finPL(a);
  const retained = pl.net, equity = FIN_CAPITAL + FIN_SURPLUS + retained;
  const contractLiab = a.liab.token, donationPay = a.liab.donation, tradePay = a.liab.payable, taxPay = Math.max(0, pl.tax), deposits = Math.round(a.rev.insurance * 0.08);
  const curLiab = contractLiab + donationPay + tradePay + taxPay + deposits;
  const nonCurLiab = FIN_LEASE + FIN_LONGDEBT, liabilities = curLiab + nonCurLiab;
  const assets = liabilities + equity;
  const ppe = Math.max(20000000, 400000000 - a.sga.depr), intangible = 200000000, rou = 150000000, nonCurAssets = ppe + intangible + rou;
  const inventory = 40000000, receivable = Math.round(pl.revenue * 0.12), prepaid = 25000000;
  const cash = assets - (nonCurAssets + inventory + receivable + prepaid), curAssets = cash + receivable + inventory + prepaid;
  return { pl, assets, cash, receivable, inventory, prepaid, curAssets, ppe, intangible, rou, nonCurAssets, contractLiab, donationPay, tradePay, taxPay, deposits, curLiab, leaseLiab: FIN_LEASE, longDebt: FIN_LONGDEBT, nonCurLiab, liabilities, capital: FIN_CAPITAL, surplus: FIN_SURPLUS, retained, equity, debtRatio: equity ? liabilities / equity : 0, currentRatio: curLiab ? curAssets / curLiab : 0, equityRatio: assets ? equity / assets : 0, roe: equity ? retained / equity : 0 };
}
// 현금흐름표(간접법): 영업활동(순이익+감가상각±운전자본) / 투자활동(자산취득) / 재무활동(증자·차입). 기말현금 = B/S 현금과 일치.
function finCF(a, bs) {
  const dep = a.sga.depr;
  const wc = bs.curLiab - bs.receivable - bs.inventory - bs.prepaid; // 운전자본 증감(유동부채 증가-유동자산 증가)
  const opCF = bs.retained + dep + wc;
  const invCF = -(400000000 + 200000000 + 150000000); // 유형·무형·사용권 자산 취득(설립기)
  const finCFv = FIN_CAPITAL + FIN_SURPLUS + FIN_LONGDEBT + FIN_LEASE; // 유상증자+차입+리스(설립기)
  const endCash = opCF + invCF + finCFv;
  return { opCF, invCF, finCF: finCFv, endCash, netIncome: bs.retained, dep, wc };
}

// ── 연간 예상(추정) 재무제표 — 연차 선택형(신 재무엔진 finModel.js 위임 · 파라미터·시나리오 자동 반영) ──
function finAnnual(yi) {
  const y = yi == null ? 0 : yi;
  const bs = finBSYear(y), r = bs.r, P = finParams();
  return { ...r, ...bs, r,
    op: r.ebit, finIncome: 0, finCost: P.interestYear, pbt: r.pbt, tax: r.tax, net: r.net,
    opMargin: r.opMargin, netMargin: r.netMargin,
    A: { members: r.membersEnd, activeRate: P.activeRate, hospitals: r.hospitals, institutions: r.insts, buyerRate: P.productBuyerRate, checkupRate: P.checkupRate, subFee: r.subFee, y } };
}
const FIN_GTM_CHANNELS = [
  ["검진·병원 B2B 연계", "검진기관·병원 제휴로 검진 예약·결과 연동 회원 유입 — 최우선·최저 CAC", "#22D3EE"],
  ["기업복지·단체검진 제휴", "기업 복지몰·단체검진 계약으로 대량 가입 확보", "#6366F1"],
  ["보험 조회·청구 유틸 훅", "내 보험 통합관리로 유입 후 신계약 중개로 전환(굿리치 모델)", "#A78BFA"],
  ["건강 리워드·바이럴", "걸음·미션 리워드로 습관화·리텐션 강화(캐시워크 모델)", "#34D399"],
  ["앱 퍼포먼스 마케팅(보조)", "유료 광고 — 가장 비싸 보조 수단, 후기 스케일업", "#FBBF24"],
];
// 5개년 추정 — 신 재무엔진(finModel.js) 위임. 구독정책(1차 무료→월 50만+연 50만 인상·한도 300만)·CAC 5천원·시나리오 자동 반영.
function finMultiYear() { return finYears(5); }
// ── 건강금융지갑·사회적기업 공통 지표 — 재무모델(제품마진) 연동. 적립20%·나눔10%(+운영·유보 70%)·특별지원(어르신·장애아동) ──
function finSocial(yi) {
  const rows = finMultiYear(), r = rows[yi == null ? 0 : Math.max(0, Math.min(4, yi))];
  const margin = r.revProduct - r.cogsProduct;
  const earn = r.reward, give = r.donation, ops = Math.round(margin - earn - give), animal = Math.round(margin * 0.25 * 0.05);
  return { year: r.label, members: r.membersEnd, revenue: r.revenue, margin, earn, give, ops, animal, beneficiaries: Math.max(1, Math.round(give / 255000)) };
}
function finValuation() { return finValModel(); }

function FinanceLive() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);
  const [acct, setAcct] = useState(_finZero());
  const [journal, setJournal] = useState([]);
  const [tab, setTab] = useState("pl");
  const [anYear, setAnYear] = useState(0); // 연간 예상 — 연차 선택(0=1차)
  const [pTick, setPTick] = useState(0);   // 파라미터·시나리오 변경 → 전체 재계산 트리거
  const [months, setMonths] = useState([]);
  const [escTick, setEscTick] = useState(0);   // 선수납 정산 처리 후 리렌더
  useEffect(() => { try { if (typeof escSeedDemo === "function") escSeedDemo(); } catch (e) {} }, []);
  const cohort = React.useMemo(() => (typeof pilotCohort === "function" ? pilotCohort() : []), []);
  const ref = useRef(_finZero());
  const idRef = useRef(0); const tkRef = useRef(0); const snapRef = useRef({ rev: 0, op: 0, net: 0 }); const moRef = useRef([]);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const a = ref.current; const js = [];
      const push = (c, note, amt, cr) => js.push({ id: ++idRef.current, c, note, amt, cr });
      const pickWho = (k) => { if ((k === "product" || k === "insurance") && cohort.length) { const m = cohort[Math.floor(Math.random() * cohort.length)]; return `${m.name}(${m.id})`; } return _finInst(k); };
      const nEv = 3 + Math.floor(Math.random() * 3);
      for (let e = 0; e < nEv; e++) {
        const t = _finWpick(); const p = Math.round(finRr(t.min, t.max) / 1000) * 1000; const who = pickWho(t.k);
        a.rev[t.k] += p;
        if (t.k === "product") {
          const cost = Math.round(p * 0.44); a.cogs.product += cost; a.cogs.payment += Math.round(p * 0.022); a.liab.payable += Math.round(p * 0.3);
          const margin = p - cost, reward = Math.round(margin * 0.5), don = Math.round(margin * 0.3);
          a.sga.reward += reward; a.liab.token += reward; a.sga.donation += don; a.liab.donation += don;
          push(t.c, `${who} · ${t.label} (건강쇼핑)`, p, "제품매출");
        } else {
          if (t.k === "checkup") a.cogs.infra += 20000;   // 3종 서비스 원가(검진보험·리포트·상담) 건당 2만 — 재무모델 정합
          else if (t.k === "emr") a.cogs.infra += Math.round(p * 0.1);
          else if (t.k === "service") a.cogs.infra += Math.round(p * 0.05);
          push(t.c, `${who} · ${t.label}`, p, t.k === "checkup" ? "검진수수료수익" : t.k === "emr" ? "EMR연계수익" : t.k === "service" ? "서비스수수료수익" : t.k === "reservation" ? "예약수수료수익" : t.k === "insurance" ? "중개수수료" : "광고수익");
        }
      }
      // 고정 판관비(기간 발생)
      for (const [k, [lo, hi]] of Object.entries(FIN_FIX)) a.sga[k] += Math.round(finRr(lo, hi));
      a.cogs.infra += Math.round(finRr(14000, 28000));
      // 금융비용(대출·리스 이자) / 금융수익(예금이자)
      a.other.finCost += Math.round(finRr(40000, 56000));
      if (Math.random() < 0.5) a.other.finIncome += Math.round(finRr(8000, 28000));
      if (Math.random() < 0.08) a.other.income += Math.round(finRr(20000, 120000)); // 기타수익(잡이익)
      ref.current = a; tkRef.current += 1;
      // 월 마감(8거래 = 1개월) → 결산 추이 스냅샷
      if (tkRef.current % 8 === 0) {
        const pn = finPL(a); const mo = { m: tkRef.current / 8, rev: pn.revenue - snapRef.current.rev, op: pn.op - snapRef.current.op, net: pn.net - snapRef.current.net };
        snapRef.current = { rev: pn.revenue, op: pn.op, net: pn.net }; moRef.current = [...moRef.current, mo].slice(-12); setMonths(moRef.current);
      }
      setAcct({ ...a, rev: { ...a.rev }, cogs: { ...a.cogs }, sga: { ...a.sga }, other: { ...a.other }, liab: { ...a.liab } });
      setJournal((prev) => [...js.reverse(), ...prev].slice(0, 20));
      setTick((x) => x + 1);
    }, Math.max(350, 1400 / speed));
    return () => clearInterval(iv);
  }, [running, speed, cohort]);
  const reset = () => { ref.current = _finZero(); tkRef.current = 0; snapRef.current = { rev: 0, op: 0, net: 0 }; moRef.current = []; setAcct(_finZero()); setJournal([]); setMonths([]); setTick(0); };
  const pl = finPL(acct);
  const bs = finBS(acct);
  const revMax = Math.max(1, ...FIN_REVTYPES.map((t) => acct.rev[t.k]));
  const costRows = [...FIN_COGS_META.map(([k, l, c]) => [l, acct.cogs[k], c, "매출원가"]), ...FIN_SGA_META.map(([k, l, c]) => [l, acct.sga[k], c, "판관비"])].filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
  const costMax = Math.max(1, ...costRows.map((r) => r[1]));
  const liabTot = _finSum(acct.liab);
  // 손익계산서 행 [라벨, 값, 강조여부, 부호]
  const cf = finCF(acct, bs);
  const sgaKind = { reward: "subitem tok", donation: "subitem don" };
  const sgaBreak = FIN_SGA_META.filter(([k]) => acct.sga[k] > 0).map(([k, l]) => ["　" + l, -acct.sga[k], 0, sgaKind[k] || "subitem"]);
  const plRows = [
    ["매출액", pl.revenue, 0, "rev"], ["(-) 매출원가", -pl.cogs, 0, "neg"], ["매출총이익", pl.gross, 1, "sub"],
    ["(-) 판매비와관리비", -pl.sga, 0, "neg"], ...sgaBreak, ["영업이익", pl.op, 2, "sub"],
    ["(+) 금융수익(이자수익)", pl.finIncome, 0, "pos"], ["(-) 금융비용(이자비용)", -pl.finCost, 0, "neg"], ["(+) 기타수익", pl.otherIncome, 0, "pos"],
    ["법인세비용차감전순이익", pl.pbt, 1, "sub"], ["(-) 법인세비용", -pl.tax, 0, "neg"], ["당기순이익", pl.net, 3, "net"],
  ];
  return (<>
    <div className="ontsimbar">
      <div className={`ontsimstate ${running ? "on" : ""}`}><span className="dot" /> {running ? "회계기간 진행 중" : "일시정지"} <em>· 거래 {tick.toLocaleString()}건</em></div>
      <div className="ontsimctl">
        <button onClick={() => setRunning((v) => !v)} className="pri">{running ? <><Pause size={14} /> 일시정지</> : <><Play size={14} /> 재생</>}</button>
        {[1, 2, 4].map((sp) => <button key={sp} className={speed === sp ? "on" : ""} onClick={() => setSpeed(sp)}>{sp}x</button>)}
        <button onClick={reset}><RotateCcw size={14} /> 리셋</button>
      </div>
    </div>

    <div className="ontkpis" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
      {[["매출액", finWon(pl.revenue), "#22D3EE"], ["영업이익", finWon(pl.op), pl.op >= 0 ? "#34D399" : "#EF4444"], ["당기순이익", finWon(pl.net), pl.net >= 0 ? "#34D399" : "#EF4444"], ["자산 총계", finWon(bs.assets), "#FBBF24"], ["부채비율", (bs.debtRatio * 100).toFixed(0) + "%", "#A78BFA"]].map(([k, v, c], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>
      ))}
    </div>

    <div className="finlink"><Network size={13} color="#22D3EE" /> 온톨로지 파일럿 <b>{cohort.length.toLocaleString()}명</b>의 건강케어 소비가 <b>실시간 매출</b>로 인식됩니다 (제품판매·보험중개는 회원, 입점수수료·EMR은 제휴 기관).</div>
    <div className="chtabs" style={{ marginTop: 12 }}>{[["pl", "손익계산서 (P&L)", Receipt], ["bs", "재무상태표 (B/S)", Landmark], ["cf", "현금흐름표 (C/F)", TrendingUp], ["cash", "AI 출수납", Landmark], ["escrow", "선수납·정산", Lock], ["invest", "AI 투자", TrendingUp], ["trend", "결산 추이", PieChart], ["annual", "연간 예상(계획)", Banknote], ["plan", "사업계획(월·분기)", Receipt], ["my", "중장기(5개년)", TrendingUp], ["ten", "10개년", TrendingUp], ["saas", "SaaS·투자 KPI", Percent], ["params", "파라미터·시나리오", Zap], ["gtm", "회원·GTM", Users], ["val", "밸류에이션", PieChart], ["graph", "재무 온톨로지·AI", Network]].map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>
    {["annual", "plan", "my", "ten", "saas", "val", "gtm", "graph"].includes(tab) && (
      <div className="finscn" key={"scn" + pTick}>
        <span className="finscn-l">시나리오</span>
        {Object.entries(FIN_SCENARIOS).map(([k, s]) => <button key={k} className={finScenario() === k ? "on" : ""} style={{ "--sc": s.c }} onClick={() => { finSetScenario(k); setPTick((x) => x + 1); }}>{s.label}</button>)}
        <span className="finscn-note">변경 즉시 P/L·B/S·C/F·KPI·기업가치 전체 자동 재계산 · 세부 수치는 ‘파라미터’ 탭</span>
      </div>
    )}

    {tab === "cash" && typeof AICashSystem === "function" && <AICashSystem />}
    {tab === "invest" && typeof AIInvestSystem === "function" && <AIInvestSystem />}

    {tab === "pl" && (<>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#34D399" /> 손익계산서 (K-IFRS) <span>· 기능별 분류</span></div>
          <div className="finpl">{plRows.map(([l, v, emph, kind], i) => (
            <div className={`finpl-r ${emph ? "sub emph" + emph : ""} ${kind}`} key={i}><span>{l}</span><b>{finWon(v)}원</b></div>
          ))}</div>
          <div className="finpl-note">매출총이익률 {(pl.revenue ? pl.gross / pl.revenue * 100 : 0).toFixed(1)}% · 순이익률 {(pl.netMargin * 100).toFixed(1)}% · 법인세율 {(FIN_TAX * 100).toFixed(0)}%</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#22D3EE" /> 매출 구성 <span>· 섹션별 수익 계정</span></div>
          {FIN_REVTYPES.map((t) => <OntBar key={t.k} label={`${t.label} · ${t.src}`} value={acct.rev[t.k]} max={revMax} color={t.c} sub="원" />)}
          <div className="finpl-note"><b>EMR·UIP 사용료(병원·검진센터·약국)는 전액 매출</b>로 인식(SaaS·저원가), 제품판매는 총액 인식(매출-원가). <b>적립금·기부금은 제품판매 마진에만</b> 적용 — EMR·UIP·수수료 매출엔 미적용.</div>
        </div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#F59E0B" /> 비용 구성 <span>· 매출원가 + 판매관리비</span></div>
        {costRows.map(([l, v, c, grp]) => <OntBar key={l} label={`${l} · ${grp}`} value={v} max={costMax} color={c} sub="원" />)}
      </div>
    </>)}

    {tab === "bs" && (<>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Banknote size={15} color="#FBBF24" /> 자산 (Assets) <span>· {finWon(bs.assets)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub emph2"><span>Ⅰ. 유동자산</span><b>{finWon(bs.curAssets)}원</b></div>
            <div className="finpl-r"><span>　현금및현금성자산</span><b>{finWon(bs.cash)}원</b></div>
            <div className="finpl-r"><span>　매출채권</span><b>{finWon(bs.receivable)}원</b></div>
            <div className="finpl-r"><span>　재고자산</span><b>{finWon(bs.inventory)}원</b></div>
            <div className="finpl-r"><span>　선급비용</span><b>{finWon(bs.prepaid)}원</b></div>
            <div className="finpl-r sub emph2"><span>Ⅱ. 비유동자산</span><b>{finWon(bs.nonCurAssets)}원</b></div>
            <div className="finpl-r"><span>　유형자산(설비)</span><b>{finWon(bs.ppe)}원</b></div>
            <div className="finpl-r"><span>　무형자산(개발비)</span><b>{finWon(bs.intangible)}원</b></div>
            <div className="finpl-r"><span>　사용권자산</span><b>{finWon(bs.rou)}원</b></div>
            <div className="finpl-r net"><span>자산 총계</span><b>{finWon(bs.assets)}원</b></div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#E11D48" /> 부채와 자본 <span>· {finWon(bs.liabilities + bs.equity)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub"><span>Ⅰ. 유동부채</span><b>{finWon(bs.curLiab)}원</b></div>
            <div className="finpl-r"><span>　계약부채(토큰적립금)</span><b>{finWon(bs.contractLiab)}원</b></div>
            {(() => { const r = (typeof HTK_INS_RATE !== "undefined") ? HTK_INS_RATE : 0.30; const ins = Math.round(bs.contractLiab * r); return (<>
              <div className="finpl-r"><span style={{ color: "#2563EB", paddingLeft: 12 }}>└ 보험·치료비 적립금(30% 우선)</span><b style={{ color: "#2563EB" }}>{finWon(ins)}원</b></div>
              <div className="finpl-r"><span style={{ color: "#94A3B8", paddingLeft: 12 }}>└ 일반 토큰적립금(70%)</span><b style={{ color: "#94A3B8" }}>{finWon(bs.contractLiab - ins)}원</b></div>
            </>); })()}
            <div className="finpl-r"><span>　미지급기부금(나눔)</span><b>{finWon(bs.donationPay)}원</b></div>
            <div className="finpl-r"><span>　매입채무·미지급금</span><b>{finWon(bs.tradePay)}원</b></div>
            <div className="finpl-r"><span>　미지급법인세</span><b>{finWon(bs.taxPay)}원</b></div>
            <div className="finpl-r"><span>　예수금</span><b>{finWon(bs.deposits)}원</b></div>
            <div className="finpl-r sub"><span>Ⅱ. 비유동부채</span><b>{finWon(bs.nonCurLiab)}원</b></div>
            <div className="finpl-r"><span>　리스부채</span><b>{finWon(bs.leaseLiab)}원</b></div>
            <div className="finpl-r"><span>　장기차입금</span><b>{finWon(bs.longDebt)}원</b></div>
            <div className="finpl-r sub emph2"><span>Ⅲ. 자본</span><b>{finWon(bs.equity)}원</b></div>
            <div className="finpl-r"><span>　자본금</span><b>{finWon(bs.capital)}원</b></div>
            <div className="finpl-r"><span>　자본잉여금</span><b>{finWon(bs.surplus)}원</b></div>
            <div className="finpl-r"><span>　이익잉여금(누적순이익)</span><b style={{ color: bs.retained >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(bs.retained)}원</b></div>
            <div className="finpl-r net"><span>부채와 자본 총계</span><b>{finWon(bs.liabilities + bs.equity)}원</b></div>
          </div>
        </div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><Percent size={15} color="#A78BFA" /> 재무비율 · 대차평형(회계 항등식)</div>
        <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {[["부채비율", (bs.debtRatio * 100).toFixed(0) + "%", "부채/자본", "#A78BFA"], ["유동비율", (bs.currentRatio * 100).toFixed(0) + "%", "유동자산/유동부채", "#22D3EE"], ["자기자본비율", (bs.equityRatio * 100).toFixed(0) + "%", "자본/자산", "#34D399"], ["ROE(누적)", (bs.roe * 100).toFixed(1) + "%", "순이익/자본", "#FBBF24"]].map(([t, v, s, c], i) => (
            <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}><b style={{ color: c }}>{v}</b><span>{t} <em style={{ fontStyle: "normal", color: "#6B7A99" }}>· {s}</em></span></div>
          ))}
        </div>
        <div className="finbalance"><Check size={14} color="#34D399" /> 대차평형 성립 — <b>자산 {finWon(bs.assets)}</b> = 부채 {finWon(bs.liabilities)} + 자본 {finWon(bs.equity)}</div>
      </div>
    </>)}

    {tab === "cf" && (
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#34D399" /> 현금흐름표 (간접법) <span>· 영업·투자·재무활동</span></div>
        <div className="finpl">
          <div className="finpl-r sub emph2"><span>Ⅰ. 영업활동 현금흐름</span><b>{finWon(cf.opCF)}원</b></div>
          <div className="finpl-r"><span>　당기순이익</span><b>{finWon(cf.netIncome)}원</b></div>
          <div className="finpl-r"><span>　(+) 감가상각비(비현금)</span><b>{finWon(cf.dep)}원</b></div>
          <div className="finpl-r"><span>　(±) 운전자본 증감</span><b>{finWon(cf.wc)}원</b></div>
          <div className="finpl-r sub"><span>Ⅱ. 투자활동 현금흐름</span><b>{finWon(cf.invCF)}원</b></div>
          <div className="finpl-r"><span>　유형·무형·사용권자산 취득(설립기)</span><b>{finWon(cf.invCF)}원</b></div>
          <div className="finpl-r sub"><span>Ⅲ. 재무활동 현금흐름</span><b>{finWon(cf.finCF)}원</b></div>
          <div className="finpl-r"><span>　유상증자·장기차입금·리스(설립기)</span><b>{finWon(cf.finCF)}원</b></div>
          <div className="finpl-r net"><span>기말 현금및현금성자산</span><b>{finWon(cf.endCash)}원</b></div>
        </div>
        <div className="finbalance"><Check size={14} color="#34D399" /> 현금흐름표 기말현금 = 재무상태표 현금 <b>{finWon(bs.cash)}원</b> 일치</div>
      </div>
    )}

    {tab === "escrow" && (() => {
      const st = (typeof escStats === "function") ? escStats() : null;
      const orders = (typeof escAll === "function") ? escAll().slice().sort((a, b) => b.at - a.at) : [];
      const SS = (typeof ESC_STATUS !== "undefined") ? ESC_STATUS : {};
      const d = (ts) => { if (!ts) return "—"; const x = new Date(ts); return `${x.getMonth() + 1}.${x.getDate()}`; };
      const BTN_A = { border: "none", background: "#1D4ED8", color: "#fff", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
      const BTN_B = { border: "1px solid #475569", background: "transparent", color: "#94A3B8", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
      const act = (fn, id) => { const r = fn(id); if (typeof toast === "function") toast(r.ok ? "처리됐어요 — 체인에 기록됩니다" : r.reason); setEscTick((t) => t + 1); };
      return (<>
      <div className="finlink" style={{ background: "#0C1E3A", borderColor: "#1E3A6B" }}><Lock size={13} color="#60A5FA" /> <b>선수납 · 공제 정산</b> — 고객이 하이핀에서 <b>검진비를 먼저 결제</b>하면 수검 완료까지 <b>결제대금예치(에스크로)</b>로 분리 보관되고, 수검이 확인되면 <b>송객수수료를 공제한 잔액</b>이 검진기관에 정산됩니다(D+3 기준·협의). 결제 매입(PG)·예치·정산 대행은 제휴 결제사(KIS정보통신 등) 라이선스로 수행하며, 아래는 시연 원장입니다.</div>
      <div className="ontkpis" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[["에스크로 예치 잔액", finWon(st ? st.escrowBalance : 0), "#60A5FA", `미정산 ${st ? st.paid + st.visited : 0}건 · 계약부채`],
          ["정산 수수료(매출 인식)", finWon(st ? st.feeRevenue : 0), "#34D399", `정산 완료 ${st ? st.settled : 0}건`],
          ["검진기관 지급 누계", finWon(st ? st.payoutTotal : 0), "#E2E8F0", "공제 후 지급액"],
          ["취급고(TPV) 누계", finWon(st ? st.gmv : 0), "#FBBF24", `전 ${st ? st.n : 0}건 · 환불 ${st ? st.refunded : 0}`]].map(([k, v, c, sub], i) => (
          <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}<br /><span style={{ opacity: .7, fontSize: 10 }}>{sub}</span></div></div>
        ))}
      </div>
      <div className="ontpanel">
        <div className="ontph"><Lock size={15} color="#60A5FA" /> 선수납 원장 <span>· 결제 → 예치 → 수검 확인 → 공제 정산</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>주문</th><th>검진기관</th><th>결제일</th><th>결제금액</th><th>수수료(공제)</th><th>기관 지급액</th><th>상태</th><th>처리</th></tr></thead>
          <tbody>
            {orders.map((o) => { const m = SS[o.status] || { ko: o.status, c: "#94A3B8" }; return (
              <tr key={o.id}>
                <td className="mono0" style={{ fontSize: 11 }}>{o.id}</td>
                <td className="mono0">{o.center}</td>
                <td className="mono">{d(o.at)}</td>
                <td className="mono">{finWon(o.amount)}</td>
                <td className="mono" style={{ color: "#34D399" }}>{o.status === "REFUNDED" ? "—" : "-" + finWon(o.fee)}</td>
                <td className="mono">{o.status === "REFUNDED" ? "환불" : finWon(o.payout)}</td>
                <td className="mono0"><span style={{ color: m.c, fontWeight: 800, fontSize: 11.5 }}>{m.ko}</span></td>
                <td className="mono0">
                  {o.status === "PAID" && <><button style={BTN_A} onClick={() => act(escConfirmVisit, o.id)}>수검확인</button> <button style={BTN_B} onClick={() => act(escRefund, o.id)}>환불</button></>}
                  {o.status === "VISITED" && <button style={BTN_A} onClick={() => act(escSettle, o.id)}>공제 정산</button>}
                  {(o.status === "SETTLED" || o.status === "REFUNDED") && <span style={{ color: "#64748B", fontSize: 11 }}>완료 {d(o.settledAt || o.refundedAt)}</span>}
                </td>
              </tr>); })}
            {!orders.length && <tr><td colSpan={8} className="mono0" style={{ color: "#64748B" }}>선수납 주문이 없습니다 — 건강검진 예약에서 유료 검진을 결제하면 이 원장에 기록됩니다.</td></tr>}
          </tbody>
        </table></div>
        <div className="finpl-note">회계 처리 — ①결제 시 <b>예수금(계약부채)</b>로 인식(매출 아님) ②수검 확인 후 정산 시 <b>송객수수료만 매출</b>, 잔액은 기관 지급으로 부채 소멸 ③환불 시 부채 전액 소멸·수수료 미발생. 회원 화면에는 결제 금액과 예치 보호 안내만 표시되며 <b>수수료·지급액은 본 관리자 콘솔에서만</b> 조회됩니다.</div>
      </div>
      </>); })()}

    {tab === "trend" && (
      <div className="ontpanel">
        <div className="ontph"><PieChart size={15} color="#FBBF24" /> 월별 결산 추이 <span>· 매출·영업이익·당기순이익 ({months.length}개월 · 8거래=1개월)</span></div>
        {months.length === 0 ? <div className="ontempty">첫 결산(8거래 = 1개월)을 기다리는 중…</div> : (() => {
          const max = Math.max(1, ...months.map((m) => Math.max(m.rev, m.op, Math.abs(m.net))));
          return (<>
            <div className="fintrend">{months.map((m) => (
              <div className="fintrend-col" key={m.m}>
                <div className="fintrend-bars">
                  <i className="rev" style={{ height: (m.rev / max * 100) + "%" }} title={"매출 " + finWon(m.rev)} />
                  <i className="op" style={{ height: (Math.max(0, m.op) / max * 100) + "%" }} title={"영업이익 " + finWon(m.op)} />
                  <i className="net" style={{ height: (Math.max(0, m.net) / max * 100) + "%" }} title={"순이익 " + finWon(m.net)} />
                </div>
                <span>{((m.m - 1) % 12) + 1}월</span>
              </div>
            ))}</div>
            <div className="fintrend-lgd"><span><i style={{ background: "#22D3EE" }} />매출</span><span><i style={{ background: "#34D399" }} />영업이익</span><span><i style={{ background: "#FBBF24" }} />당기순이익</span></div>
            <div className="finpl-note">최근 {months.length}개월 · 누적 매출 {finWon(pl.revenue)} · 누적 순이익 {finWon(pl.net)}</div>
          </>);
        })()}
      </div>
    )}

    {tab === "annual" && (() => { const an = finAnnual(anYear); const A = an.A; const P = finParams(); const anSga = [["　인건비", -an.payroll, 0, "subitem"], [`　회원확보비(CAC ${P.cac.toLocaleString()}원/인 · 기간인식)`, -an.cacCost, 0, "subitem"], ["　브랜드 마케팅", -an.brandMkt, 0, "subitem"], ["　포인트(토큰)적립", -an.reward, 0, "subitem tok"], ["　기부금(치료비 나눔)", -an.donation, 0, "subitem don"], ["　R&D·클라우드·GPU", -(an.rnd + an.cloud + an.gpu), 0, "subitem"], ["　영업비·관리비", -(an.salesCost + an.adminCost), 0, "subitem"]]; const anPL = [["매출액", an.revenue, 0, "rev"], ["(-) 매출원가", -an.cogs, 0, "neg"], ["매출총이익", an.gross, 1, "sub"], ["(-) 판매비와관리비", -an.sga, 0, "neg"], ...anSga, ["영업이익(EBIT)", an.op, 2, "sub"], ["EBITDA(참고)", an.ebitda, 0, "pos"], ["(-) 금융비용(이자)", -an.finCost, 0, "neg"], ["법인세비용차감전순이익", an.pbt, 1, "sub"], ["(-) 법인세비용", -an.tax, 0, "neg"], ["당기순이익", an.net, 3, "net"]]; return (<>
      <div className="finyrsel">{P.years.slice(0, 5).map((l, i) => <button key={i} className={anYear === i ? "on" : ""} onClick={() => setAnYear(i)}>{l}</button>)}</div>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><Banknote size={13} color="#34D399" /> {an.label} 가정({P.scnMeta.label} 시나리오) — 회원 <b>{A.members.toLocaleString()}명</b> · 활성률 {(A.activeRate * 100).toFixed(0)}% · 제품구매율 {(A.buyerRate * 100).toFixed(0)}% · 제휴 기관 <b>{A.institutions.toLocaleString()}곳</b> · AI 플랫폼 구독 {A.y === 0 ? <b style={{ color: "#FBBF24" }}>1차연도 무료 — EMR·UPI·플랫폼 사용료 0원(시장 선점 전략적 투자)</b> : <b>기관당 월 {finWon(A.subFee)}원(매년 +{finWon(P.subFeeStep)}원, 한도 {finWon(P.subFeeCap)}원)</b>}. <b>추정(Pro-forma) 재무제표</b>입니다.</div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#34D399" /> 연간 예상 손익계산서 <span>· {an.label}</span></div>
          <div className="finpl">{anPL.map(([l, v, emph, kind], i) => <div className={`finpl-r ${emph ? "sub emph" + emph : ""} ${kind}`} key={i}><span>{l}</span><b>{finWon(v)}원</b></div>)}</div>
          <div className="finpl-note">영업이익률 {(an.opMargin * 100).toFixed(1)}% · 순이익률 {(an.netMargin * 100).toFixed(1)}% · 토큰적립금 {finWon(an.reward)}(계약부채 이연)·기부금 {finWon(an.donation)}</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#22D3EE" /> 연간 예상 매출 구성 <span>· 총 {finWon(an.revenue)}원</span></div>
          {[["제품판매(GMV·건강쇼핑)", an.revProduct, "#34D399"], ["AI 플랫폼 구독(원격진료·UPI·EMR 사용료 등 — 검진·병원·약국)", an.revSub, "#6366F1"], ["검진 연계 수수료", an.revCheckup, "#22D3EE"], ["헬스케어 서비스 수수료", an.revService, "#2DD4BF"], ["예약 서비스 수수료(골프 등)", an.revReservation, "#F97316"], ["보험 중개 수수료", an.revInsurance, "#A78BFA"], ["AI Agent 프리미엄", an.revAgent, "#F472B6"], ["API·데이터·분석(B2B)", an.revApi, "#38BDF8"], ["광고·제휴", an.revAd, "#FBBF24"]].map(([l, v, c]) => <OntBar key={l} label={l} value={v} max={Math.max(an.revProduct, an.revSub)} color={c} sub="원" />)}
          <div className="finpl-note" style={{ marginTop: 8 }}>{A.y === 0 ? "1차연도 구독매출 0원 — 1차연도 회원 33만 기반 선점 후(2차연도) AI Healthcare Platform Subscription 과금 시작." : `구독 구성: 병원 ${finWon(an.subSplit.hospital)} · 약국 ${finWon(an.subSplit.pharmacy)} · 검진기관 ${finWon(an.subSplit.checkup)} — AI 건강분석·상담·예측·CRM·원격진료 연계·보험청구 자동화·API를 포함한 통합 구독(단순 EMR 연결비 아님).`}</div>
        </div>
      </div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Banknote size={15} color="#FBBF24" /> 연간 예상 재무상태표 — 자산 <span>· {finWon(an.assets)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub emph2"><span>Ⅰ. 유동자산</span><b>{finWon(an.curAssets)}원</b></div>
            <div className="finpl-r"><span>　현금및현금성자산</span><b>{finWon(an.cash)}원</b></div>
            <div className="finpl-r"><span>　매출채권</span><b>{finWon(an.receivable)}원</b></div>
            <div className="finpl-r"><span>　구독료 미수금(Subscription Receivable)</span><b>{finWon(an.subReceivable)}원</b></div>
            <div className="finpl-r"><span>　계약자산(Contract Asset)</span><b>{finWon(an.contractAsset)}원</b></div>
            <div className="finpl-r"><span>　재고자산 · 선급비용</span><b>{finWon(an.inventory + an.prepaid)}원</b></div>
            <div className="finpl-r sub emph2"><span>Ⅱ. 비유동자산</span><b>{finWon(an.nonCurAssets)}원</b></div>
            <div className="finpl-r"><span>　유형자산</span><b>{finWon(an.ppe)}원</b></div>
            <div className="finpl-r"><span>　플랫폼자산 · 소프트웨어자산</span><b>{finWon(an.platformAsset + an.softwareAsset)}원</b></div>
            <div className="finpl-r"><span>　AI모델자산 · 데이터자산 · 클라우드자산</span><b>{finWon(an.aiModelAsset + an.dataAsset + an.cloudAsset)}원</b></div>
            <div className="finpl-r"><span>　개발비(무형)</span><b>{finWon(an.devCost)}원</b></div>
            <div className="finpl-r net"><span>자산 총계</span><b>{finWon(an.assets)}원</b></div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#E11D48" /> 연간 예상 재무상태표 — 부채와 자본 <span>· {finWon(an.liabilities + an.equity)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub"><span>Ⅰ. 유동부채</span><b>{finWon(an.curLiab)}원</b></div>
            <div className="finpl-r"><span>　계약부채(토큰적립금)</span><b>{finWon(an.contractLiab)}원</b></div>
            {(() => { const rt = (typeof HTK_INS_RATE !== "undefined") ? HTK_INS_RATE : 0.30; const ins = Math.round(an.contractLiab * rt); return (<>
              <div className="finpl-r subitem tok"><span>└ 보험·치료비 적립금({(rt * 100).toFixed(0)}% 우선)</span><b>{finWon(ins)}원</b></div>
              <div className="finpl-r subitem tok"><span>└ 일반 토큰적립금({(100 - rt * 100).toFixed(0)}%)</span><b>{finWon(an.contractLiab - ins)}원</b></div>
            </>); })()}
            <div className="finpl-r subitem don"><span>　미지급기부금(치료비 나눔)</span><b>{finWon(an.donationPay)}원</b></div>
            <div className="finpl-r"><span>　이연수익(구독 선수금 · Deferred Revenue)</span><b>{finWon(an.deferredRev)}원</b></div>
            <div className="finpl-r"><span>　매입채무·미지급법인세·예수금</span><b>{finWon(an.tradePay + an.taxPay + an.deposits)}원</b></div>
            <div className="finpl-r sub"><span>Ⅱ. 비유동부채(리스·차입)</span><b>{finWon(an.nonCurLiab)}원</b></div>
            <div className="finpl-r sub emph2"><span>Ⅲ. 자본</span><b>{finWon(an.equity)}원</b></div>
            <div className="finpl-r"><span>　자본금·자본잉여금</span><b>{finWon(an.capital + an.surplus)}원</b></div>
            <div className="finpl-r"><span>　이익잉여금(당기순이익)</span><b style={{ color: "#6EE7B7" }}>{finWon(an.retained)}원</b></div>
            <div className="finpl-r net"><span>부채와 자본 총계</span><b>{finWon(an.liabilities + an.equity)}원</b></div>
          </div>
          <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginTop: 10 }}>
            {[["부채비율", (an.debtRatio * 100).toFixed(0) + "%", "#A78BFA"], ["유동비율", (an.currentRatio * 100).toFixed(0) + "%", "#22D3EE"], ["자기자본비율", (an.equityRatio * 100).toFixed(0) + "%", "#34D399"], ["ROE", (an.roe * 100).toFixed(1) + "%", "#FBBF24"]].map(([t, v, c], i) => <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}><b style={{ color: c }}>{v}</b><span>{t}</span></div>)}
          </div>
          <div className="finbalance"><Check size={14} color="#34D399" /> 대차평형 — <b>자산 {finWon(an.assets)}</b> = 부채 {finWon(an.liabilities)} + 자본 {finWon(an.equity)}</div>
        </div>
      </div>
    </>); })()}

    {tab === "my" && (() => { const my = finMultiYear(); const revMax = Math.max(...my.map((r) => r.revenue)); const M = (l, f, cls) => <tr className={cls || ""}><td className="mono0">{l}</td>{my.map((r, i) => <td key={i} className="mono">{f(r)}</td>)}</tr>; return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><TrendingUp size={13} color="#34D399" /> <b>5개년 중장기 추정(현실화 개편)</b> — 회원 <b>33만→1,000만</b>(마케팅 동의 20만→630만 · 검진 예약 연 25만→600만), CAC <b>5,000원/인(기간 인식)</b>. <b>AI Healthcare Platform Subscription</b>: 1차연도 <b>무료(0원 · 시장 선점)</b> → 2차 기관당 <b>월 50만</b> → 매년 +50만(<b>한도 300만</b>) — 검진·병원·약국 전 기관 동일, AI 건강분석·상담·예측·CRM·원격진료·보험청구 자동화 포함(단순 EMR 연결비 아님). 제품 GMV는 1인당 연 건강지출 × <b>지갑 점유율 70%</b>(기존 구매채널 병행 보수화), 인건비는 <b>AI 자동화(하이·AI 출수납) 반영 70% 수준</b>. 적립50%·나눔30% <b>비율 약속은 유지</b> — 모수(제품마진)가 70%로 현실화되며 금액도 자동으로 70% 수준.</div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#34D399" /> 중장기 손익 추정 (5개년) <span>· 단위 원</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>항목</th>{my.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
          <tbody>
            {M("누적 회원(플랫폼) — 이탈 차감 후 순증", (r) => r.membersEnd.toLocaleString() + "명", "myhead")}
            {M("　총가입 필요량(이탈 18% 보전 포함)", (r) => (r.grossNew || r.newMembers).toLocaleString() + "명")}
            {M("마케팅 동의 회원(보험중개·누적)", (r) => (r.mktConsent || 0).toLocaleString() + "명")}
            {M("활성 회원 — 하이핀 경유 검진 예약(연)", (r) => r.active.toLocaleString() + "명")}
            {M("제휴 기관(검진·병원·약국)", (r) => r.insts.toLocaleString() + "곳")}
            {M("AI 플랫폼 구독료(월/기관)", (r) => r.subFee ? finWon(r.subFee) + "원" : "무료(선점)")}
            {M("매출액", (r) => finWon(r.revenue), "myrev")}
            {M("　제품판매(GMV)", (r) => finWon(r.revProduct))}
            {M("　검진 연계 수수료", (r) => finWon(r.revCheckup))}
            {M("　헬스케어 서비스 수수료", (r) => finWon(r.revService))}
            {M("　예약 서비스(골프 등)", (r) => finWon(r.revReservation))}
            {M("　AI 플랫폼 구독(원격진료·UPI·EMR 사용료 등)", (r) => finWon(r.revSub))}
            {M("　보험 중개", (r) => finWon(r.revInsurance))}
            {M("　AI Agent·API·데이터", (r) => finWon(r.revAgent + r.revApi))}
            {M("　광고·제휴", (r) => finWon(r.revAd))}
            {M("매출총이익", (r) => finWon(r.gross), "mysub")}
            {M("(-) 판매관리비", (r) => "-" + finWon(r.sga))}
            {M("　인건비", (r) => "-" + finWon(r.payroll), "mysub2")}
            {M("　마케팅비", (r) => "-" + finWon(r.marketing), "mysub2")}
            <tr className="mysub2"><td className="mono0 tokc">　포인트(토큰)적립</td>{my.map((r, i) => <td key={i} className="mono tokc">-{finWon(r.reward)}</td>)}</tr>
            <tr className="mysub2"><td className="mono0 donc">　기부금(치료비 나눔)</td>{my.map((r, i) => <td key={i} className="mono donc">-{finWon(r.donation)}</td>)}</tr>
            {M("　기타 운영비", (r) => "-" + finWon(r.otherOpex), "mysub2")}
            {M("영업이익", (r) => finWon(r.ebit), "myop")}
            {M("EBITDA", (r) => finWon(r.ebitda))}
            {M("당기순이익", (r) => finWon(r.net), "mynet")}
            {M("영업이익률", (r) => (r.opMargin * 100).toFixed(1) + "%")}
          </tbody>
        </table></div>
        <div className="fintrend" style={{ height: 130, marginTop: 12 }}>{my.map((r) => <div className="fintrend-col" key={r.y}><div className="fintrend-bars"><i className="rev" style={{ height: (r.revenue / revMax * 100) + "%" }} title={"매출 " + finWon(r.revenue)} /><i className="op" style={{ height: (Math.max(0, r.ebit) / revMax * 100) + "%" }} title={"영업이익 " + finWon(r.ebit)} /></div><span>{r.label.replace("차연도", "차")}</span></div>)}</div>
        <div className="finpl-note">5차연도 매출 {finWon(my[4].revenue)}원 · 영업이익 {finWon(my[4].ebit)}원({(my[4].opMargin * 100).toFixed(1)}%) · 당기순이익 {finWon(my[4].net)}원. 초기(1~2차) 투자·마케팅으로 적자 후 흑자전환 구조.</div>
      </div>
    </>); })()}

    {tab === "gtm" && (() => { const my = finMultiYear(); return (<>
      <div className="finlink"><Users size={13} color="#22D3EE" /> <b>회원 목표·획득전략(GTM)</b> — 순수 앱마케팅만으론 1M에 100억↑ 소요(비현실) → 검진·B2B·보험 제휴가 회원 과반 담당.</div>
      <div className="ontpanel">
        <div className="ontph"><Users size={15} color="#22D3EE" /> 5개년 회원 성장 계획 <span>· 누적회원·CAC·마케팅비</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>항목</th>{my.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
          <tbody>
            <tr className="myrev"><td className="mono0">누적 회원(목표)</td>{my.map((r, i) => <td key={i} className="mono">{r.membersEnd.toLocaleString()}명</td>)}</tr>
            <tr><td className="mono0">　신규 회원</td>{my.map((r, i) => <td key={i} className="mono">+{r.newMembers.toLocaleString()}</td>)}</tr>
            <tr><td className="mono0">블렌디드 CAC(원/가입)</td>{my.map((r, i) => <td key={i} className="mono">{r.cac.toLocaleString()}</td>)}</tr>
            <tr className="mysub"><td className="mono0">회원획득 마케팅비</td>{my.map((r, i) => <td key={i} className="mono">{finWon(r.marketing)}원</td>)}</tr>
            <tr><td className="mono0">제휴 병원(EMR·환자연계)</td>{my.map((r, i) => <td key={i} className="mono">{r.hospitals.toLocaleString()}곳</td>)}</tr>
          </tbody>
        </table></div>
        <div className="fintrend" style={{ height: 120, marginTop: 12 }}>{my.map((r) => { const mx = my[4].membersEnd; return <div className="fintrend-col" key={r.y}><div className="fintrend-bars"><i className="rev" style={{ height: (r.membersEnd / mx * 100) + "%", width: 16 }} title={r.membersEnd.toLocaleString() + "명"} /></div><span>{r.label.replace("차연도", "차")}</span></div>; })}</div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><Network size={15} color="#A78BFA" /> 회원 획득 채널 (효율 우선순위)</div>
        {FIN_GTM_CHANNELS.map(([t, d, c], i) => <div className="adv" key={i} style={{ background: "#0C1730", border: "1px solid #24324D", borderRadius: 10, padding: "10px 12px", marginBottom: 7, display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 24, height: 24, borderRadius: 7, background: c + "22", color: c, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}</span><div style={{ flex: 1 }}><b style={{ color: "#EAF2FF", fontSize: 12.5 }}>{t}</b><p style={{ color: "#90A0BD", fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{d}</p></div></div>)}
      </div>
    </>); })()}

    {tab === "val" && (() => { const v = finValuation(); const evLow = Math.min(v.evDCF, v.evEbitda, v.evRev), evHigh = Math.max(v.evDCF, v.evEbitda, v.evRev); return (<>
      <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><PieChart size={13} color="#A78BFA" /> <b>투자유치용 밸류에이션</b> — DCF(현금흐름할인) + 비교기업 멀티플(EV/Revenue·EV/EBITDA). 가정: WACC {(v.wacc * 100).toFixed(0)}%·영구성장 {(v.termGrowth * 100).toFixed(0)}%.</div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#34D399" /> DCF (현금흐름 할인법)</div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>연도</th><th>FCF</th><th>할인계수</th><th>현재가치(PV)</th></tr></thead>
            <tbody>{v.disc.map((d, i) => <tr key={i}><td className="mono0">{d.y}</td><td className="mono">{finWon(d.fcf)}</td><td className="mono">{d.df.toFixed(3)}</td><td className="mono">{finWon(d.pv)}</td></tr>)}</tbody>
          </table></div>
          <div className="finpl" style={{ marginTop: 8 }}>
            <div className="finpl-r"><span>5개년 FCF 현재가치 합계</span><b>{finWon(v.pvSum)}원</b></div>
            <div className="finpl-r"><span>터미널 가치(영구성장)</span><b>{finWon(v.terminal)}원</b></div>
            <div className="finpl-r"><span>터미널 현재가치</span><b>{finWon(v.pvTerminal)}원</b></div>
            <div className="finpl-r net"><span>기업가치 EV (DCF)</span><b>{finWon(v.evDCF)}원</b></div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#FBBF24" /> 비교기업 멀티플 (Trading Multiple)</div>
          <div className="finpl">
            <div className="finpl-r sub"><span>5차연도 매출 {finWon(v.lastRevenue)}</span><b></b></div>
            <div className="finpl-r"><span>EV / Revenue ({v.evRevMultiple.toFixed(1)}x)</span><b>{finWon(v.evRev)}원</b></div>
            <div className="finpl-r sub"><span>5차연도 EBITDA {finWon(v.lastEbitda)}</span><b></b></div>
            <div className="finpl-r"><span>EV / EBITDA ({v.evEbitdaMultiple}x)</span><b>{finWon(v.evEbitda)}원</b></div>
          </div>
          <div className="finbalance" style={{ background: "#231A3F", borderColor: "#3f2d5e", marginTop: 12 }}><PieChart size={14} color="#C4B5FD" /> 종합 기업가치 범위 <b>{finWon(evLow)} ~ {finWon(evHigh)}원</b></div>
          <div className="finpl-note">DCF는 초기 적자·높은 WACC로 보수적, 멀티플은 5차연도 실적 기준 시장가. 실제 밸류는 성장률·마일스톤·비교기업에 따라 조정됩니다. (헬스케어 플랫폼 EV/Rev 3~6x 통상)</div>
        </div>
      </div>
    </>); })()}

    {tab === "plan" && (() => { const mp = finMonthlyY1(); const P = finParams(); return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><Receipt size={13} color="#34D399" /> <b>1차연도 월별·분기별 사업계획</b> — 회원 {mp.total.toLocaleString()}명 램프, CAC {P.cac.toLocaleString()}원/인 <b>기간 인식</b>(일시 비용화 금지 · 총 {finWon(mp.cacTotal)}원). 1차연도 회원 33만 선점 → 2차연도부터 기관 구독 과금 시작.</div>
      <div className="ontpanel">
        <div className="ontph"><Receipt size={15} color="#34D399" /> 월별 계획 <span>· 회원·CAC·매출·영업이익</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>월</th><th>신규 회원</th><th>누적 회원</th><th>회원확보비(CAC)</th><th>매출</th><th>영업이익</th></tr></thead>
          <tbody>{mp.rows.map((r) => <tr key={r.m}><td className="mono0">{r.m}월</td><td className="mono">+{r.add.toLocaleString()}</td><td className="mono">{r.cum.toLocaleString()}</td><td className="mono">-{finWon(r.cacCost)}</td><td className="mono">{finWon(r.rev)}</td><td className="mono" style={{ color: r.op >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.op)}</td></tr>)}</tbody>
        </table></div>
        <div className="ontph" style={{ marginTop: 14 }}><PieChart size={15} color="#22D3EE" /> 분기별 요약</div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>분기</th><th>신규 회원</th><th>누적</th><th>CAC 비용</th><th>매출</th><th>영업이익</th></tr></thead>
          <tbody>{mp.q.map((r) => <tr key={r.q}><td className="mono0">{r.q}분기</td><td className="mono">+{r.add.toLocaleString()}</td><td className="mono">{r.cum.toLocaleString()}</td><td className="mono">-{finWon(r.cacCost)}</td><td className="mono">{finWon(r.rev)}</td><td className="mono" style={{ color: r.op >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.op)}</td></tr>)}</tbody>
        </table></div>
        <div className="finpl-note">회원 수를 바꾸면(파라미터 탭) 월별 CAC 인식·매출·전 재무제표가 자동 재계산됩니다 — 예) 10만 명=5억, 33만 명=16.5억, 100만 명=50억.</div>
      </div>
    </>); })()}

    {tab === "ten" && (() => { const ty = finYears(10); return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><TrendingUp size={13} color="#34D399" /> <b>10개년 재무추정</b> — 1~5차는 사업계획, 6~10차는 성장률 외삽(연 {(finParams().tenYearGrowth * 100).toFixed(0)}%). 구독료는 5차 이후 월 {finWon(finParams().subFeeCap)}원 상한 유지.</div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#34D399" /> 10개년 손익·현금 추정</div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>연차</th><th>회원</th><th>기관</th><th>구독료(월)</th><th>매출</th><th>영업이익</th><th>순이익</th><th>ARR</th><th>FCF</th></tr></thead>
          <tbody>{ty.map((r) => <tr key={r.y}><td className="mono0">{r.label}</td><td className="mono">{(r.membersEnd / 10000).toFixed(0)}만</td><td className="mono">{r.insts.toLocaleString()}</td><td className="mono">{r.subFee ? finWon(r.subFee) : "무료"}</td><td className="mono">{finWon(r.revenue)}</td><td className="mono" style={{ color: r.ebit >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.ebit)}</td><td className="mono">{finWon(r.net)}</td><td className="mono">{finWon(r.arr)}</td><td className="mono">{finWon(r.fcf)}</td></tr>)}</tbody>
        </table></div>
      </div>
    </>); })()}

    {tab === "saas" && (() => { const ss = finSaaSModel(); const K = finKPIs(); const kpis = [["CAC", K.cac.toLocaleString() + "원", "#F59E0B"], ["LTV", finWon(K.ltv) + "원", "#34D399"], ["LTV/CAC", K.ltvCac.toFixed(1) + "x", K.ltvCac >= 3 ? "#34D399" : "#F59E0B"], ["ARPU(3차)", finWon(K.arpu) + "원", "#22D3EE"], ["ARPPU(3차)", finWon(K.arppu) + "원", "#22D3EE"], ["매출총이익률", (K.grossMargin * 100).toFixed(1) + "%", "#A78BFA"], ["영업이익률(3차)", (K.opMargin * 100).toFixed(1) + "%", "#A78BFA"], ["EBITDA(3차)", finWon(K.ebitda3) + "원", "#6366F1"], ["Cash Burn(1차)", finWon(K.burn1) + "원", "#F472B6"], ["Runway", isFinite(K.runway) ? K.runway.toFixed(1) + "개월" : "흑자", "#F472B6"], ["CAC Payback", K.payback ? K.payback.toFixed(1) + "개월" : "-", "#FBBF24"], ["Magic Number", K.magic ? K.magic.toFixed(2) : "-", "#FBBF24"], ["Rule of 40", K.rule40.toFixed(0), K.rule40 >= 40 ? "#34D399" : "#F59E0B"], ["EV(DCF)", finWon(K.ev) + "원", "#EAB308"], ["EV/Sales", K.evSales.toFixed(1) + "x", "#EAB308"], ["ROI(5차)", (K.roi5 * 100).toFixed(0) + "%", "#34D399"], ["ROIC(3차)", (K.roic3 * 100).toFixed(0) + "%", "#34D399"], ["이탈률(연)", (K.churn * 100).toFixed(0) + "%", "#94A3B8"]]; return (<>
      <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Percent size={13} color="#A78BFA" /> <b>SaaS 구독 모델 + 투자자 KPI</b> — EMR·UPI·AI 플랫폼 전부 Subscription 관리. 파라미터가 바뀌면 MRR·ARR·전 KPI가 자동 재계산됩니다.</div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#A78BFA" /> 구독(Subscription) 지표 <span>· MRR·ARR·이탈·확장</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>연차</th><th>유료 기관</th><th>월 구독료</th><th>MRR(연말)</th><th>ARR</th><th>ARR 성장</th><th>Expansion(인상분)</th><th>갱신율</th></tr></thead>
          <tbody>{ss.map((s, i) => <tr key={i}><td className="mono0">{s.label}</td><td className="mono">{s.insts.toLocaleString()}곳</td><td className="mono">{s.subFee ? finWon(s.subFee) : "무료"}</td><td className="mono">{finWon(s.mrr)}</td><td className="mono">{finWon(s.arr)}</td><td className="mono">{s.growth == null ? "-" : (s.growth * 100).toFixed(0) + "%"}</td><td className="mono">{finWon(s.expansion)}</td><td className="mono">{(s.renewal * 100).toFixed(0)}%</td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><Percent size={15} color="#FBBF24" /> 투자자 핵심 KPI <span>· 자동 계산</span></div>
        <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
          {kpis.map(([t, v, c], i) => <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}><b style={{ color: c, fontSize: 13 }}>{v}</b><span>{t}</span></div>)}
        </div>
        <div className="finpl-note">LTV = ARPU × 매출총이익률 ÷ 이탈률 · Payback = CAC ÷ 월 공헌이익 · Rule of 40 = 매출성장률 + EBITDA마진 · EV는 밸류에이션 탭(DCF·멀티플)과 동일 엔진.</div>
      </div>
    </>); })()}

    {tab === "params" && <FinParamsPanel onApply={() => setPTick((x) => x + 1)} />}

    {tab === "graph" && <FinGraphPanel />}

    <div className="ontpanel">
      <div className="ontph"><Zap size={15} color="#FBBF24" /> 실시간 회계 분개(Journal) <span>· 복식부기 차·대변</span></div>
      <div className="ontfeed">
        {journal.length === 0 && <div className="ontempty">거래 분개를 기다리는 중…</div>}
        {journal.map((j) => (
          <div className="ontfeed-i buy" key={j.id}>
            <span className="ontfeed-ic" style={{ background: j.c + "22", color: j.c }}><Coins size={13} /></span>
            <div className="ontfeed-b"><div className="ontfeed-t"><b>{j.note}</b></div><div className="ontfeed-s">(차) 현금 {finWon(j.amt)} / (대) {j.cr} {finWon(j.amt)}</div></div>
            <span className="ontfeed-tag" style={{ color: j.c }}>+{finWon(j.amt)}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="chnote" style={{ marginTop: 12 }}>※ <b>K-IFRS 기준 회계 시뮬레이션(파일럿 시연)</b>입니다. 매출은 IFRS 15(제품판매 총액·수수료 순액) 기준으로 인식하고, 토큰적립금은 <b>계약부채</b>, 기부금 나눔은 <b>미지급기부금(충당부채)</b>로 계상합니다. 법인세는 세전이익에 {(FIN_TAX * 100).toFixed(0)}% 근사 적용. 실제 결산·세무는 회계기준·세법에 따릅니다.</div>
  </>);
}

/* ── 파라미터·시나리오 패널 — 모든 가정은 수정 가능한 변수(하드코딩 금지), 변경 즉시 전 재무모델 재계산 ── */
function FinParamsPanel({ onApply }) {
  const [, force] = useState(0);
  const o = finOverrides(); const D = FIN_P_DEFAULT; const scn = finScenario();
  const set = (k, v) => { finSetParam(k, v); force((x) => x + 1); onApply && onApply(); };
  const FIELDS = [
    ["members1", "1차연도 회원(명)", D.membersEnd[0]], ["members2", "2차연도 회원(명)", D.membersEnd[1]], ["members3", "3차연도 회원(명)", D.membersEnd[2]], ["members4", "4차연도 회원(명)", D.membersEnd[3]], ["members5", "5차연도 회원(명)", D.membersEnd[4]],
    ["cac", "회원확보비 CAC(원/인)", D.cac], ["activeRate", "활성률(0~1)", D.activeRate], ["productBuyerRate", "제품 구매율(0~1)", D.productBuyerRate], ["productCapture", "지갑 점유율·포착률(0~1)", D.productCapture], ["checkupRate", "검진 전환율(0~1)", D.checkupRate],
    ["subFeeBase", "구독료 2차연도(원/월·기관)", D.subFeeBase], ["subFeeStep", "구독료 연 인상액(원)", D.subFeeStep], ["subPaidRate", "구독 유료 전환율(0~1)", D.subPaidRate],
    ["instMultPct", "제휴 기관 수 배율(%)", 100], ["payrollPct", "인건비 배율(%)", 100], ["cogsPct", "제품 원가율 배율(%)", 100],
    ["churn", "연 이탈률(0~1)", D.churn], ["wacc", "WACC(0~1)", D.wacc], ["evRevMultiple", "EV/Revenue 배수", D.evRevMultiple],
    ["cloudPerActive", "클라우드 원가(원/활성회원·년)", D.cloudPerActive], ["gpuPerActive", "GPU 원가(원/활성회원·년)", D.gpuPerActive], ["rndRate", "R&D 비율(매출 대비 0~1)", D.rndRate], ["opexScale", "기타 운영비 스케일(0~1)", D.opexScale],
  ];
  return (<>
    <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Zap size={13} color="#C4B5FD" /> <b>파라미터 기반 단일 재무모델</b> — 아래 값을 바꾸면 P/L·B/S·C/F·월별계획·SaaS·KPI·기업가치가 <b>즉시 자동 재계산</b>됩니다(전 화면 동일 데이터 소스). 빈칸이면 기본값 사용.</div>
    <div className="ontpanel">
      <div className="ontph"><Zap size={15} color="#FBBF24" /> 시나리오 <span>· 보수 · 기준 · 공격</span></div>
      <div className="finscn" style={{ margin: 0 }}>
        {Object.entries(FIN_SCENARIOS).map(([k, s]) => <button key={k} className={scn === k ? "on" : ""} style={{ "--sc": s.c }} onClick={() => { finSetScenario(k); force((x) => x + 1); onApply && onApply(); }}>{s.label} <em>회원×{s.memberMult} · 기관×{s.instMult} · CAC×{s.cacMult}</em></button>)}
      </div>
    </div>
    <div className="ontpanel">
      <div className="ontph"><Receipt size={15} color="#34D399" /> 사업 가정 파라미터 <span>· {FIELDS.length}개 변수 (저장: 브라우저)</span></div>
      <div className="finparams">
        {FIELDS.map(([k, l, d]) => (
          <label className="finparam" key={k}>
            <span>{l}</span>
            <input type="number" step="any" defaultValue={o[k] != null ? o[k] : ""} placeholder={String(d)} onBlur={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="book" onClick={() => { finResetParams(); force((x) => x + 1); onApply && onApply(); if (typeof toast === "function") toast("재무 파라미터를 기본값으로 초기화했어요"); }}>기본값으로 초기화</button>
      </div>
      <div className="finpl-note">구독정책: 1차연도 EMR·UPI·플랫폼 사용료 0원(시장 선점 · 회원 33만 확보) → 2차연도부터 AI Healthcare Platform Subscription(기관당 월 50만→연 50만 인상, 한도 300만 — 침투 우선 요금). 감가상각은 초년도만 50%(상각 기반 적음). CAC는 회원 증가 속도에 따라 기간 인식.</div>
    </div>
  </>);
}

/* ── 재무회계 온톨로지 그래프 + 데이터 계보(Lineage) + AI 자연어 질의(하이 연동) ── */
function FinGraphPanel() {
  const [yr, setYr] = useState(0);
  const [q, setQ] = useState("");
  const [ans, setAns] = useState(null);
  const rows = finYears(5); const r = rows[yr]; const P = finParams();
  const ask = (text) => { const t = (text == null ? q : text).trim(); if (!t) return; let res = null; try { res = finAsk(t); } catch (e) {} setAns(res || { lines: ["그 질문은 아직 재무 엔진이 이해하지 못했어요 — 매출·영업이익·구독료·CAC·LTV·기업가치·런웨이·시나리오로 물어봐 주세요."], buttons: [] }); };
  return (<>
    <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Network size={13} color="#C4B5FD" /> <b>재무회계 온톨로지</b> — 모든 계정이 인과 사슬로 연결되고, 각 수치는 <b>데이터 계보(입력→계산식→결과)</b>로 추적됩니다. 하이(AI)에게 자연어로 물어보세요.</div>
    <div className="ontpanel">
      <div className="ontph"><Network size={15} color="#A78BFA" /> 가치 인과 사슬 <span>· 회원 → 구독 → Recurring Revenue → EV</span></div>
      <div className="finchain">{FIN_GRAPH.map((n, i) => (<React.Fragment key={n.k}><span className="finchain-n" style={{ borderColor: n.c, color: n.c }}>{n.label}</span>{i < FIN_GRAPH.length - 1 && <ChevronRight size={13} color="#4A5878" />}</React.Fragment>))}</div>
    </div>
    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Receipt size={15} color="#34D399" /> 데이터 계보(Lineage) <span>· 수치의 근거 추적</span></div>
        <div className="finyrsel" style={{ marginBottom: 8 }}>{P.years.slice(0, 5).map((l, i) => <button key={i} className={yr === i ? "on" : ""} onClick={() => setYr(i)}>{l}</button>)}</div>
        <div className="finlin">{r.lin.map((x, i) => (
          <div className="finlin-r" key={i}><b>{x.label}</b><span>{x.formula}</span><em>{finWon(x.value)}원</em></div>
        ))}</div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><Bot size={15} color="#F97316" /> 하이에게 재무 질의 <span>· 자연어 → 수치+근거</span></div>
        <div className="finask">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} placeholder="예: 3차연도 매출 얼마야? / 기업가치는? / 런웨이는?" />
          <button onClick={() => ask()}>질의</button>
        </div>
        <div className="finask-chips">{["3차연도 매출 얼마야?", "구독료 정책 알려줘", "LTV/CAC는?", "기업가치 얼마야?", "런웨이는?"].map((c) => <button key={c} onClick={() => { setQ(c); ask(c); }}>{c}</button>)}</div>
        {ans && <div className="finask-ans">{ans.lines.map((l, i) => <p key={i}>{l}</p>)}</div>}
        <div className="finpl-note">같은 엔진(finAsk)이 하이 독에도 연결돼 있어 어느 화면에서든 "예상 매출 얼마야?"라고 물으면 답합니다.</div>
      </div>
    </div>
  </>);
}

/* 회계 온톨로지 계정과목(COA) 트리 */
const FIN_COA = [
  { g: "수익 (Revenue)", c: "#22D3EE", items: ["제품판매(GMV)", "AI 플랫폼 구독(원격진료·UPI·EMR 사용료 등)", "검진·서비스·예약 수수료", "보험 중개 수수료", "AI Agent 프리미엄", "API·데이터·분석(B2B)", "광고·제휴"] },
  { g: "매출원가 (COGS)", c: "#F472B6", items: ["제품 원가", "구독 운영(클라우드·연동)", "결제 대행 수수료"] },
  { g: "판매관리비 (SG&A)", c: "#F59E0B", items: ["인건비", "회원확보비(CAC 기간인식)", "브랜드 마케팅", "R&D·클라우드·GPU", "영업·관리비", "포인트(토큰)비용", "기부금(치료비 나눔)"] },
  { g: "자산·부채 (신설)", c: "#E11D48", items: ["구독료 미수금", "계약자산", "이연수익(구독 선수금)", "플랫폼·AI모델·데이터 자산", "토큰적립금(계약부채)", "기부금 준비금"] },
];

function FinanceSection({ onGo }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="ontohero">
        <div className="ontohero-bg"><span /><span /></div>
        <div className="ontohero-l">
          <span className="ontotag"><Landmark size={13} /> Financial Accounting Ontology · K-IFRS</span>
          <div className="ontotitle">재무회계 온톨로지 시스템</div>
          <p>섹션별 거래를 <b>실시간 분개</b>로 인식해 <b>K-IFRS 손익계산서</b>(매출→영업이익→법인세전→당기순이익)와 <b>부채</b>(토큰적립금·기부금)를 실시간 집계합니다. 검진센터·병원·약국은 입점수수료·EMR 매출, 건강쇼핑은 제품판매 매출.</p>
        </div>
        <div className="ontohero-kpi">
          <div><b>5</b><span>수익 계정</span></div>
          <div><b>10</b><span>비용 계정</span></div>
          <div><b>3</b><span>부채 계정</span></div>
        </div>
      </div>

      <div className="ontobjbar" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {FIN_COA.map((g, i) => (
          <div className="ontobj" key={i} style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
            <b style={{ color: g.c, fontSize: 12.5 }}>{g.g}</b>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{g.items.map((it) => <span key={it} style={{ fontSize: 9.6, color: "#AFC0DE", background: "#0C1730", border: "1px solid #24324D", borderRadius: 6, padding: "2px 6px" }}>{it}</span>)}</div>
          </div>
        ))}
      </div>

      <FinanceLive />
    </div>
  );
}
