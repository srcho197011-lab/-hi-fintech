/* ====================== 재무회계 온톨로지 시스템 (K-IFRS) ======================
   섹션별 거래(제품판매·입점수수료·EMR/SaaS·보험중개·광고)를 실시간 분개(journal)로 인식하고,
   K-IFRS 손익계산서(매출→매출원가→매출총이익→판관비→영업이익→기타손익→법인세전이익→법인세→당기순이익)와
   부채(토큰적립금=계약부채, 기부금준비금, 매입채무)를 실시간 집계하는 회계 시뮬레이션 대시보드. */

const FIN_TAX = 0.22; // 법인세율(지방세 포함 근사)
const finWon = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 100000000) return s + (n / 100000000).toFixed(2) + "억"; if (n >= 10000) return s + Math.round(n / 10000).toLocaleString() + "만"; return s + n.toLocaleString(); };
const finRr = (a, b) => a + Math.random() * (b - a);
// 매출 유형(수익 계정) — IFRS 15 수익
const FIN_REVTYPES = [
  { k: "product", label: "제품판매 매출", src: "건강쇼핑(GMV)", c: "#34D399", w: 40, min: 15000, max: 320000 },
  { k: "checkup", label: "검진 연계 수수료", src: "건강검진센터", c: "#22D3EE", w: 22, min: 15000, max: 30000 },
  { k: "emr", label: "병원 EMR·환자연계", src: "제휴 병원(월정액)", c: "#6366F1", w: 8, min: 2500000, max: 3500000 },
  { k: "insurance", label: "보험 중개 수수료", src: "보험·치료비", c: "#A78BFA", w: 16, min: 30000, max: 320000 },
  { k: "ad", label: "광고·제휴 매출", src: "제휴·마케팅", c: "#FBBF24", w: 6, min: 40000, max: 260000 },
];
const FIN_COGS_META = [["product", "제품 원가", "#F472B6"], ["infra", "검진·인프라 원가", "#38BDF8"], ["payment", "결제 대행 수수료", "#94A3B8"]];
const FIN_SGA_META = [["payroll", "인건비", "#F59E0B"], ["marketing", "마케팅비", "#EC4899"], ["rnd", "연구개발비", "#8B5CF6"], ["rent", "임차료·관리비", "#64748B"], ["depr", "감가상각비", "#0EA5E9"], ["reward", "포인트(토큰적립) 비용", "#22D3EE"], ["donation", "기부금(치료비 나눔)", "#E11D48"]];
const FIN_LIAB_META = [["token", "토큰적립금 (계약부채)", "#22D3EE"], ["donation", "기부금 준비금 (미지급기부금)", "#E11D48"], ["payable", "매입채무·미지급금", "#94A3B8"]];
const FIN_FIX = { payroll: [320000, 430000], marketing: [140000, 240000], rnd: [80000, 150000], rent: [50000, 85000], depr: [34000, 58000] };
const _finZero = () => ({ rev: { product: 0, checkup: 0, emr: 0, insurance: 0, ad: 0 }, cogs: { product: 0, infra: 0, payment: 0 }, sga: { payroll: 0, marketing: 0, rnd: 0, rent: 0, depr: 0, reward: 0, donation: 0 }, other: { income: 0, finIncome: 0, finCost: 0 }, liab: { token: 0, donation: 0, payable: 0 } });
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

// ── 연간 예상(추정) 재무제표 — 중장기 3차연도(100만 회원) 대표 기준 Pro-forma P&L + B/S ──
function finAnnual() {
  const M = FIN_MY, r = finMultiYear()[2]; // 3차연도 · 100만 회원
  const finIncome = Math.round(r.revenue * 0.001), finCost = M.interestYear, op = r.ebit, pbt = op + finIncome - finCost, tax = Math.max(0, pbt) * M.taxRate, net = pbt - tax;
  const capital = 300000000, surplus = 500000000, retained = net, equity = capital + surplus + retained;
  const contractLiab = r.reward, donationPay = Math.round(r.donation * 0.4), tradePay = Math.round(r.cogs * 0.1), taxPay = Math.round(tax), deposits = Math.round(r.revInsurance * 0.1);
  const curLiab = contractLiab + donationPay + tradePay + taxPay + deposits, leaseLiab = 120000000, longDebt = 2000000000, nonCurLiab = leaseLiab + longDebt, liabilities = curLiab + nonCurLiab;
  const assets = liabilities + equity;
  const ppe = 3000000000, intangible = 1500000000, rou = 500000000, nonCurAssets = ppe + intangible + rou;
  const inventory = Math.round(r.cogs * 0.05), receivable = Math.round(r.revenue * 0.08), prepaid = 100000000;
  const cash = assets - (nonCurAssets + inventory + receivable + prepaid), curAssets = cash + receivable + inventory + prepaid;
  return {
    revProduct: r.revProduct, revCheckup: r.revCheckup, revEmr: r.revEmr, revInsurance: r.revInsurance, revAd: r.revAd, revenue: r.revenue, cogs: r.cogs, gross: r.gross, reward: r.reward, donation: r.donation, sga: r.sga, op, finIncome, finCost, pbt, tax, net, opMargin: op / r.revenue, netMargin: net / r.revenue,
    assets, cash, receivable, inventory, prepaid, curAssets, ppe, intangible, rou, nonCurAssets, contractLiab, donationPay, tradePay, taxPay, deposits, curLiab, leaseLiab, longDebt, nonCurLiab, liabilities, capital, surplus, retained, equity,
    debtRatio: liabilities / equity, currentRatio: curAssets / curLiab, equityRatio: equity / assets, roe: retained / equity,
    A: { members: M.membersEnd[2], activeRate: M.activeRate, hospitals: M.hospitals[2], buyerRate: M.productBuyerRate, checkupRate: M.checkupRate },
  };
}

// ── 3~5개년 중장기 추정 + 회원 GTM + 밸류에이션(DCF·멀티플) — 시장조사 기반 가정 ──
const FIN_MY = {
  years: ["1차연도", "2차연도", "3차연도", "4차연도", "5차연도"],
  membersEnd: [100000, 500000, 1000000, 5000000, 10000000], activeRate: 0.45,
  cac: [3000, 4000, 5000, 6000, 7000],
  hospitals: [200, 800, 1500, 2500, 3000], emrFeeMonthly: 3000000, // 병원 EMR·환자연계 월 300만
  productBuyerRate: 0.35, arpuProductGMV: 320000, productCostRate: 0.52, // 제품 GMV(총액) — 최대 매출
  checkupRate: 0.45, checkupFee: 22500, checkupCostRate: 0.50, // 검진 연계 건당 1.5~3만(평균 2.25만), 원가 50%
  arpuInsurance: [3000, 5000, 8000, 12000, 15000], adPerActive: [0, 300, 800, 1500, 2500],
  opexRate: 0.12, donationRate: 0.05, rewardRate: 0.12, payroll: [3000000000, 8000000000, 15000000000, 40000000000, 80000000000],
  deprYear: 1000000000, interestYear: 800000000, taxRate: 0.22, wacc: 0.15, termGrowth: 0.03, evRevMultiple: 4.0, evEbitdaMultiple: 15,
};
const FIN_GTM_CHANNELS = [
  ["검진·병원 B2B 연계", "검진기관·병원 제휴로 검진 예약·결과 연동 회원 유입 — 최우선·최저 CAC", "#22D3EE"],
  ["기업복지·단체검진 제휴", "기업 복지몰·단체검진 계약으로 대량 가입 확보", "#6366F1"],
  ["보험 조회·청구 유틸 훅", "내 보험 통합관리로 유입 후 신계약 중개로 전환(굿리치 모델)", "#A78BFA"],
  ["건강 리워드·바이럴", "걸음·미션 리워드로 습관화·리텐션 강화(캐시워크 모델)", "#34D399"],
  ["앱 퍼포먼스 마케팅(보조)", "유료 광고 — 가장 비싸 보조 수단, 후기 스케일업", "#FBBF24"],
];
function finMultiYear() {
  const M = FIN_MY; const rows = [];
  for (let y = 0; y < 5; y++) {
    const membersEnd = M.membersEnd[y], membersPrev = y === 0 ? 0 : M.membersEnd[y - 1], newMembers = membersEnd - membersPrev, active = Math.round(membersEnd * M.activeRate);
    const buyers = Math.round(membersEnd * M.productBuyerRate), revProduct = buyers * M.arpuProductGMV; // 제품 GMV(총액)
    const checkupUsers = Math.round(membersEnd * M.checkupRate), revCheckup = checkupUsers * M.checkupFee;
    const hospitals = M.hospitals[y], revEmr = hospitals * M.emrFeeMonthly * 12;
    const revInsurance = active * M.arpuInsurance[y], revAd = active * M.adPerActive[y];
    const revenue = revProduct + revCheckup + revEmr + revInsurance + revAd;
    const cogsProduct = Math.round(revProduct * M.productCostRate), cogsCheckup = Math.round(revCheckup * M.checkupCostRate), cogsEmr = Math.round(revEmr * 0.1), cogsPayment = Math.round(revProduct * 0.022), cogs = cogsProduct + cogsCheckup + cogsEmr + cogsPayment, gross = revenue - cogs;
    const marketing = newMembers * M.cac[y], otherOpex = Math.round(revenue * M.opexRate), donation = Math.round(revenue * M.donationRate), reward = Math.round((revProduct - cogsProduct) * M.rewardRate), payroll = M.payroll[y], sga = marketing + otherOpex + donation + reward + payroll;
    const ebit = gross - sga, ebitda = ebit + M.deprYear, pbt = ebit - M.interestYear, tax = Math.max(0, pbt) * M.taxRate, net = pbt - tax;
    const capex = y < 2 ? 2000000000 : 5000000000, dwc = Math.round(revenue * 0.02), nopat = ebit * (1 - M.taxRate), fcf = nopat + M.deprYear - capex - dwc;
    rows.push({ y, label: M.years[y], membersEnd, membersPrev, newMembers, active, buyers, checkupUsers, hospitals, cac: M.cac[y], marketing, revProduct, revCheckup, revInsurance, revEmr, revAd, revenue, cogs, gross, otherOpex, donation, reward, payroll, sga, ebit, ebitda, pbt, tax, net, capex, fcf, opMargin: ebit / revenue, netMargin: net / revenue });
  }
  return rows;
}
function finValuation() {
  const M = FIN_MY, rows = finMultiYear(); let pvSum = 0; const disc = [];
  rows.forEach((r, i) => { const df = 1 / Math.pow(1 + M.wacc, i + 1), pv = r.fcf * df; pvSum += pv; disc.push({ y: r.label, fcf: r.fcf, df, pv }); });
  const lastFcf = rows[4].fcf, terminal = lastFcf * (1 + M.termGrowth) / (M.wacc - M.termGrowth), pvTerminal = terminal / Math.pow(1 + M.wacc, 5), evDCF = pvSum + pvTerminal;
  const evRev = rows[4].revenue * M.evRevMultiple, evEbitda = Math.max(0, rows[4].ebitda) * M.evEbitdaMultiple;
  return { disc, pvSum, terminal, pvTerminal, evDCF, evRev, evEbitda, wacc: M.wacc, termGrowth: M.termGrowth, evRevMultiple: M.evRevMultiple, evEbitdaMultiple: M.evEbitdaMultiple, lastRevenue: rows[4].revenue, lastEbitda: rows[4].ebitda, lastFcf, lastNet: rows[4].net };
}

function FinanceLive() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);
  const [acct, setAcct] = useState(_finZero());
  const [journal, setJournal] = useState([]);
  const [tab, setTab] = useState("pl");
  const [months, setMonths] = useState([]);
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
          const cost = Math.round(p * 0.52); a.cogs.product += cost; a.cogs.payment += Math.round(p * 0.022); a.liab.payable += Math.round(p * 0.3);
          const margin = p - cost, reward = Math.round(margin * 0.5), don = Math.round(margin * 0.3);
          a.sga.reward += reward; a.liab.token += reward; a.sga.donation += don; a.liab.donation += don;
          push(t.c, `${who} · ${t.label} (건강쇼핑)`, p, "제품매출");
        } else {
          if (t.k === "checkup") a.cogs.infra += Math.round(p * 0.5);
          else if (t.k === "emr") a.cogs.infra += Math.round(p * 0.1);
          push(t.c, `${who} · ${t.label}`, p, t.k === "checkup" ? "검진수수료수익" : t.k === "emr" ? "EMR연계수익" : t.k === "insurance" ? "중개수수료" : "광고수익");
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
  const plRows = [
    ["매출액", pl.revenue, 0, "rev"], ["(-) 매출원가", -pl.cogs, 0, "neg"], ["매출총이익", pl.gross, 1, "sub"],
    ["(-) 판매비와관리비", -pl.sga, 0, "neg"], ["영업이익", pl.op, 2, "sub"],
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
    <div className="chtabs" style={{ marginTop: 12 }}>{[["pl", "손익계산서 (P&L)", Receipt], ["bs", "재무상태표 (B/S)", Landmark], ["cf", "현금흐름표 (C/F)", TrendingUp], ["trend", "결산 추이", PieChart], ["annual", "연간 예상(계획)", Banknote], ["my", "중장기 추정(5개년)", TrendingUp], ["gtm", "회원·GTM", Users], ["val", "밸류에이션", PieChart]].map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

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
          <div className="finpl-note">플랫폼 입점 수수료·EMR/SaaS는 순액(수수료) 인식, 제품판매는 총액 인식(매출-원가).</div>
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

    {tab === "annual" && (() => { const an = finAnnual(); const A = an.A; const anPL = [["매출액", an.revenue, 0, "rev"], ["(-) 매출원가", -an.cogs, 0, "neg"], ["매출총이익", an.gross, 1, "sub"], ["(-) 판매비와관리비", -an.sga, 0, "neg"], ["영업이익", an.op, 2, "sub"], ["(+) 금융수익", an.finIncome, 0, "pos"], ["(-) 금융비용(이자)", -an.finCost, 0, "neg"], ["법인세비용차감전순이익", an.pbt, 1, "sub"], ["(-) 법인세비용", -an.tax, 0, "neg"], ["당기순이익", an.net, 3, "net"]]; return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><Banknote size={13} color="#34D399" /> 연간 사업계획 가정(3차연도 기준) — 회원 <b>{A.members.toLocaleString()}명</b> · 활성률 {(A.activeRate * 100).toFixed(0)}% · 제품구매율 {(A.buyerRate * 100).toFixed(0)}% · 검진전환 {(A.checkupRate * 100).toFixed(0)}% · 제휴병원(EMR) <b>{A.hospitals.toLocaleString()}곳</b>. <b>추정(Pro-forma) 재무제표</b>입니다.</div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#34D399" /> 연간 예상 손익계산서 <span>· 1개년 추정</span></div>
          <div className="finpl">{anPL.map(([l, v, emph, kind], i) => <div className={`finpl-r ${emph ? "sub emph" + emph : ""} ${kind}`} key={i}><span>{l}</span><b>{finWon(v)}원</b></div>)}</div>
          <div className="finpl-note">영업이익률 {(an.opMargin * 100).toFixed(1)}% · 순이익률 {(an.netMargin * 100).toFixed(1)}% · 토큰적립금 {finWon(an.reward)}(계약부채 이연)·기부금 {finWon(an.donation)}</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#22D3EE" /> 연간 예상 매출 구성 <span>· 총 {finWon(an.revenue)}원</span></div>
          {[["제품판매(GMV·건강쇼핑)", an.revProduct, "#34D399"], ["검진 연계 수수료", an.revCheckup, "#22D3EE"], ["병원 EMR·환자연계", an.revEmr, "#6366F1"], ["보험 중개 수수료", an.revInsurance, "#A78BFA"], ["광고·제휴", an.revAd, "#FBBF24"]].map(([l, v, c]) => <OntBar key={l} label={l} value={v} max={an.revProduct} color={c} sub="원" />)}
        </div>
      </div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><Banknote size={15} color="#FBBF24" /> 연간 예상 재무상태표 — 자산 <span>· {finWon(an.assets)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub emph2"><span>Ⅰ. 유동자산</span><b>{finWon(an.curAssets)}원</b></div>
            <div className="finpl-r"><span>　현금및현금성자산</span><b>{finWon(an.cash)}원</b></div>
            <div className="finpl-r"><span>　매출채권</span><b>{finWon(an.receivable)}원</b></div>
            <div className="finpl-r"><span>　재고자산</span><b>{finWon(an.inventory)}원</b></div>
            <div className="finpl-r"><span>　선급비용</span><b>{finWon(an.prepaid)}원</b></div>
            <div className="finpl-r sub emph2"><span>Ⅱ. 비유동자산</span><b>{finWon(an.nonCurAssets)}원</b></div>
            <div className="finpl-r"><span>　유형자산·무형자산·사용권자산</span><b>{finWon(an.nonCurAssets)}원</b></div>
            <div className="finpl-r net"><span>자산 총계</span><b>{finWon(an.assets)}원</b></div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#E11D48" /> 연간 예상 재무상태표 — 부채와 자본 <span>· {finWon(an.liabilities + an.equity)}원</span></div>
          <div className="finpl">
            <div className="finpl-r sub"><span>Ⅰ. 유동부채</span><b>{finWon(an.curLiab)}원</b></div>
            <div className="finpl-r"><span>　계약부채(토큰적립금)</span><b>{finWon(an.contractLiab)}원</b></div>
            <div className="finpl-r"><span>　미지급기부금·매입채무·법인세·예수금</span><b>{finWon(an.donationPay + an.tradePay + an.taxPay + an.deposits)}원</b></div>
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
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><TrendingUp size={13} color="#34D399" /> 시장조사 기반 <b>3~5개년 중장기 추정</b> — 회원 <b>10만→1,000만</b>(검진 무료서비스 + 지자체·협회 제휴), 제휴병원 200→3,000곳. 제품은 <b>GMV(총액)</b>, 검진 <b>건당 2.25만</b>, 병원 EMR <b>월 300만</b> 인식.</div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#34D399" /> 중장기 손익 추정 (5개년) <span>· 단위 원</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>항목</th>{my.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
          <tbody>
            {M("누적 회원", (r) => r.membersEnd.toLocaleString() + "명", "myhead")}
            {M("활성 회원", (r) => r.active.toLocaleString() + "명")}
            {M("제휴 병원(EMR)", (r) => r.hospitals.toLocaleString() + "곳")}
            {M("매출액", (r) => finWon(r.revenue), "myrev")}
            {M("　제품판매(GMV)", (r) => finWon(r.revProduct))}
            {M("　검진 연계 수수료", (r) => finWon(r.revCheckup))}
            {M("　병원 EMR·환자연계", (r) => finWon(r.revEmr))}
            {M("　보험 중개", (r) => finWon(r.revInsurance))}
            {M("　광고·제휴", (r) => finWon(r.revAd))}
            {M("매출총이익", (r) => finWon(r.gross), "mysub")}
            {M("(-) 판매관리비", (r) => "-" + finWon(r.sga))}
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

/* 회계 온톨로지 계정과목(COA) 트리 */
const FIN_COA = [
  { g: "수익 (Revenue)", c: "#22D3EE", items: ["제품판매 매출", "플랫폼 입점 수수료", "EMR·SaaS 사용료", "보험 중개 수수료", "광고·제휴 매출"] },
  { g: "매출원가 (COGS)", c: "#F472B6", items: ["제품 원가", "시스템 인프라·클라우드", "결제 대행 수수료"] },
  { g: "판매관리비 (SG&A)", c: "#F59E0B", items: ["인건비", "마케팅비", "연구개발비", "임차료·감가상각", "포인트(토큰)비용", "기부금(치료비 나눔)"] },
  { g: "부채 (Liabilities)", c: "#E11D48", items: ["토큰적립금(계약부채)", "기부금 준비금", "매입채무·미지급금"] },
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
