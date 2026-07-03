/* ====================== 재무회계 온톨로지 시스템 (K-IFRS) ======================
   섹션별 거래(제품판매·입점수수료·EMR/SaaS·보험중개·광고)를 실시간 분개(journal)로 인식하고,
   K-IFRS 손익계산서(매출→매출원가→매출총이익→판관비→영업이익→기타손익→법인세전이익→법인세→당기순이익)와
   부채(토큰적립금=계약부채, 기부금준비금, 매입채무)를 실시간 집계하는 회계 시뮬레이션 대시보드. */

const FIN_TAX = 0.22; // 법인세율(지방세 포함 근사)
const finWon = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 100000000) return s + (n / 100000000).toFixed(2) + "억"; if (n >= 10000) return s + Math.round(n / 10000).toLocaleString() + "만"; return s + n.toLocaleString(); };
const finRr = (a, b) => a + Math.random() * (b - a);
// 매출 유형(수익 계정) — IFRS 15 수익
const FIN_REVTYPES = [
  { k: "product", label: "제품판매 매출", src: "건강쇼핑", c: "#34D399", w: 34, min: 12000, max: 190000 },
  { k: "commission", label: "플랫폼 입점 수수료", src: "검진센터·병원·약국", c: "#22D3EE", w: 20, min: 60000, max: 1200000 },
  { k: "emr", label: "EMR·SaaS 사용료", src: "병원·약국·검진 구독", c: "#6366F1", w: 15, min: 90000, max: 700000 },
  { k: "insurance", label: "보험 중개 수수료", src: "보험·치료비", c: "#A78BFA", w: 16, min: 30000, max: 320000 },
  { k: "ad", label: "광고·제휴 매출", src: "제휴·마케팅", c: "#FBBF24", w: 8, min: 40000, max: 260000 },
];
const FIN_COGS_META = [["product", "제품 원가", "#F472B6"], ["infra", "시스템 인프라·클라우드", "#38BDF8"], ["payment", "결제 대행 수수료", "#94A3B8"]];
const FIN_SGA_META = [["payroll", "인건비", "#F59E0B"], ["marketing", "마케팅비", "#EC4899"], ["rnd", "연구개발비", "#8B5CF6"], ["rent", "임차료·관리비", "#64748B"], ["depr", "감가상각비", "#0EA5E9"], ["reward", "포인트(토큰적립) 비용", "#22D3EE"], ["donation", "기부금(치료비 나눔)", "#E11D48"]];
const FIN_LIAB_META = [["token", "토큰적립금 (계약부채)", "#22D3EE"], ["donation", "기부금 준비금 (미지급기부금)", "#E11D48"], ["payable", "매입채무·미지급금", "#94A3B8"]];
const FIN_FIX = { payroll: [320000, 430000], marketing: [140000, 240000], rnd: [80000, 150000], rent: [50000, 85000], depr: [34000, 58000] };
const _finZero = () => ({ rev: { product: 0, commission: 0, emr: 0, insurance: 0, ad: 0 }, cogs: { product: 0, infra: 0, payment: 0 }, sga: { payroll: 0, marketing: 0, rnd: 0, rent: 0, depr: 0, reward: 0, donation: 0 }, other: { income: 0, expense: 0 }, liab: { token: 0, donation: 0, payable: 0 } });
const _finSum = (o) => Object.values(o).reduce((s, v) => s + v, 0);
function finPL(a) {
  const revenue = _finSum(a.rev), cogs = _finSum(a.cogs), gross = revenue - cogs, sga = _finSum(a.sga), op = gross - sga;
  const otherNet = a.other.income - a.other.expense, pbt = op + otherNet, tax = Math.max(0, pbt) * FIN_TAX, net = pbt - tax;
  return { revenue, cogs, gross, sga, op, otherIncome: a.other.income, otherExpense: a.other.expense, pbt, tax, net, opMargin: revenue ? op / revenue : 0, netMargin: revenue ? net / revenue : 0 };
}
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
  const ppe = Math.max(20000000, 400000000 - Math.round(a.sga.depr * 0.5)), intangible = 200000000, rou = 150000000, nonCurAssets = ppe + intangible + rou;
  const inventory = 40000000, receivable = Math.round(pl.revenue * 0.12), prepaid = 25000000;
  const cash = assets - (nonCurAssets + inventory + receivable + prepaid), curAssets = cash + receivable + inventory + prepaid;
  return { pl, assets, cash, receivable, inventory, prepaid, curAssets, ppe, intangible, rou, nonCurAssets, contractLiab, donationPay, tradePay, taxPay, deposits, curLiab, leaseLiab: FIN_LEASE, longDebt: FIN_LONGDEBT, nonCurLiab, liabilities, capital: FIN_CAPITAL, surplus: FIN_SURPLUS, retained, equity, debtRatio: equity ? liabilities / equity : 0, currentRatio: curLiab ? curAssets / curLiab : 0, equityRatio: assets ? equity / assets : 0, roe: equity ? retained / equity : 0 };
}

function FinanceLive() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);
  const [acct, setAcct] = useState(_finZero());
  const [journal, setJournal] = useState([]);
  const [tab, setTab] = useState("pl");
  const ref = useRef(_finZero());
  const idRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const a = ref.current; const js = [];
      const push = (c, note, amt, cr) => js.push({ id: ++idRef.current, c, note, amt, cr });
      const nEv = 3 + Math.floor(Math.random() * 3);
      for (let e = 0; e < nEv; e++) {
        const t = _finWpick(); const p = Math.round(finRr(t.min, t.max) / 1000) * 1000;
        a.rev[t.k] += p;
        if (t.k === "product") {
          const cost = Math.round(p * 0.52); a.cogs.product += cost; a.cogs.payment += Math.round(p * 0.022); a.liab.payable += Math.round(p * 0.3);
          const margin = p - cost, reward = Math.round(margin * 0.5), don = Math.round(margin * 0.3);
          a.sga.reward += reward; a.liab.token += reward; a.sga.donation += don; a.liab.donation += don;
          push(t.c, `${t.label} (${t.src})`, p, "제품매출");
        } else {
          if (t.k === "emr") a.cogs.infra += Math.round(p * 0.16);
          push(t.c, `${t.label} (${t.src})`, p, t.k === "commission" ? "수수료수익" : t.k === "emr" ? "구독수익" : t.k === "insurance" ? "중개수수료" : "광고수익");
        }
      }
      // 고정 판관비(기간 발생)
      for (const [k, [lo, hi]] of Object.entries(FIN_FIX)) a.sga[k] += Math.round(finRr(lo, hi));
      a.cogs.infra += Math.round(finRr(14000, 28000));
      // 기타비용: 간헐적 보험금 지급
      if (Math.random() < 0.09) { const amt = Math.round(finRr(120000, 700000)); a.other.expense += amt; push("#EF4444", "보험금 지급 (치료비 보장)", amt, "현금"); }
      if (Math.random() < 0.10) { const amt = Math.round(finRr(30000, 180000)); a.other.income += amt; }
      ref.current = a; setAcct({ ...a, rev: { ...a.rev }, cogs: { ...a.cogs }, sga: { ...a.sga }, other: { ...a.other }, liab: { ...a.liab } });
      setJournal((prev) => [...js.reverse(), ...prev].slice(0, 20));
      setTick((x) => x + 1);
    }, Math.max(350, 1400 / speed));
    return () => clearInterval(iv);
  }, [running, speed]);
  const reset = () => { ref.current = _finZero(); setAcct(_finZero()); setJournal([]); setTick(0); };
  const pl = finPL(acct);
  const bs = finBS(acct);
  const revMax = Math.max(1, ...FIN_REVTYPES.map((t) => acct.rev[t.k]));
  const costRows = [...FIN_COGS_META.map(([k, l, c]) => [l, acct.cogs[k], c, "매출원가"]), ...FIN_SGA_META.map(([k, l, c]) => [l, acct.sga[k], c, "판관비"])].filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
  const costMax = Math.max(1, ...costRows.map((r) => r[1]));
  const liabTot = _finSum(acct.liab);
  // 손익계산서 행 [라벨, 값, 강조여부, 부호]
  const plRows = [
    ["매출액", pl.revenue, 0, "rev"], ["(-) 매출원가", -pl.cogs, 0, "neg"], ["매출총이익", pl.gross, 1, "sub"],
    ["(-) 판매비와관리비", -pl.sga, 0, "neg"], ["영업이익", pl.op, 2, "sub"],
    ["(+) 기타수익", pl.otherIncome, 0, "pos"], ["(-) 기타비용", -pl.otherExpense, 0, "neg"],
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

    <div className="chtabs" style={{ marginTop: 14 }}>{[["pl", "손익계산서 (P&L)", Receipt], ["bs", "재무상태표 (B/S)", Landmark]].map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

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
