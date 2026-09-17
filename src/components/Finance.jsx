/* ====================== 재무회계 온톨로지 시스템 (K-IFRS · 투자금 산정 예산양식 엔진) ======================
   금액·비율·정책 문구는 모두 재무 엔진(finBudget.js → finModel.js 래퍼)에서 가져온다 — 이 파일에 금액 상수를 두지 않는다.
   · 현재(실적) 화면 = fbModel().asOf — 기준일까지 누적(회원 연동 계정 × k, 고정비 계획대로), 계획 대비 달성률 병기
   · 계획 화면 = 예산양식 연간·월별 계획(finYears · finMonthlyY1 · finSaaSModel · finKPIs · finValModel · finBSYear)
   · 실시간 재생 = 1틱 1일. 월 흐름 ÷ 그 달 일수를 계정별 분개로 누적하고, 기준일(실적) 또는 연말(계획)에 멈춘다.
   엔진 전역(fbModel·finYears·FIN_YEAR0 등)은 번들에서 이 파일보다 뒤에 선언되므로 **함수 안에서만** 참조한다(최상위 즉시 계산 금지). */

/* ── 표시 헬퍼 — 값이 없거나 숫자가 아니면 「-」 ── */
const finWon = (n) => { if (n == null || typeof n !== "number" || !isFinite(n)) return "-"; n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 100000000) return s + (n / 100000000).toFixed(2) + "억"; if (n >= 10000) return s + Math.round(n / 10000).toLocaleString() + "만"; return s + n.toLocaleString(); };
const finWonU = (n) => { const s = finWon(n); return s === "-" ? s : s + "원"; };
const finWonNeg = (n) => { const s = finWon(n); return s === "-" || s === "0" ? s : "-" + s; };
const finPctS = (x, d) => (x == null || typeof x !== "number" || !isFinite(x)) ? "-" : (x * 100).toFixed(d == null ? 1 : d) + "%";
const finNumS = (n, unit) => (n == null || typeof n !== "number" || !isFinite(n)) ? "-" : Math.round(n).toLocaleString() + (unit || "");
const finSafe = (fn, fallback) => { try { const v = fn(); return v == null ? fallback : v; } catch (e) { return fallback; } };
const finBarH = (v, max) => (max > 0 && typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(100, v / max * 100)) : 0) + "%";
const finMonKo = (cal) => (cal ? Number(String(cal).slice(5, 7)) + "월" : "-");
const finDaysIn = (cal) => { const p = String(cal || "").split("-").map(Number); return p.length >= 2 && p[0] && p[1] ? new Date(p[0], p[1], 0).getDate() : 30; };

/* 막대 — 폭은 0~100%로 자른다 */
function FinBar({ label, value, max, color, note }) {
  return (
    <div className="ontbar">
      <div className="ontbar-l"><span className="ontbar-lbl">{label}</span><span className="ontbar-val">{finWonU(value)}{note ? " · " + note : ""}</span></div>
      <div className="ontbar-track"><i style={{ width: finBarH(value, max), background: color || "#22D3EE" }} /></div>
    </div>
  );
}

/* ── 손익 계정 구조(예산양식 연간손익·월별예산과 같은 키) — [키, 라벨, 수준(t 합계 · s 세부 · n 순이익), 값이 0이면 숨김] ── */
const FIN_PL_ROWS = [
  ["rev", "매출액", "t"],
  ["revP", "제품판매(건강커머스)", "s"], ["revChk", "건강검진 연계(자사·제휴사)", "s"], ["revResv", "예약 서비스", "s"], ["revSvc", "헬스케어 서비스 수수료", "s", true],
  ["revCare", "재가·돌봄 파트너 이용료", "s"], ["revSub", "AI 플랫폼 구독(기관 유형별)", "s"], ["revIns", "헬스메이트센터 사용료", "s"],
  ["cogs", "매출원가", "t"],
  ["cogsP", "제품 원가", "s"], ["chkCogs", "검진 연계 서비스 원가", "s"], ["svcCost", "서비스 원가", "s", true], ["careCost", "돌봄 원가", "s"], ["subCost", "구독 운영 원가", "s"], ["payFee", "결제 수수료", "s"],
  ["gross", "매출총이익", "t"],
  ["sga", "판매비와관리비", "t"],
  ["pay", "인건비", "s"], ["mktSum", "마케팅(발송·광고·소재·QR)", "s"], ["mediRep", "메디에이지 리포트", "s"], ["reward", "포인트 적립", "s"], ["donation", "기부금", "s"],
  ["itOpex", "IT 운영비(유지보수·데이터·보안·클라우드·LLM·블록체인)", "s"], ["salesCost", "영업비", "s"], ["adminCost", "관리비", "s"],
  ["ebitda", "상각 전 영업이익", "t"], ["depr", "감가상각비", "s"], ["ebit", "영업이익", "t"], ["taxExp", "법인세비용", "s"], ["net", "당기순이익", "n"],
];
const FIN_REV_COLOR = { revP: "#34D399", revChk: "#22D3EE", revResv: "#F97316", revSvc: "#2DD4BF", revCare: "#F472B6", revSub: "#A78BFA", revIns: "#6366F1" };
const FIN_COST_COLOR = { cogs: "#F472B6", pay: "#F59E0B", mktSum: "#EC4899", mediRep: "#FB923C", reward: "#22D3EE", donation: "#E11D48", itOpex: "#8B5CF6", salesCost: "#64748B", adminCost: "#94A3B8", depr: "#0EA5E9" };

/* 연차 행(fbModel().annual[y]) → 손익 계정 키 */
function finAnnualPL(a, tax, P) {
  if (!a) return {};
  const t = tax || 0; const intY = (P && P.interestYear) || 0;
  return { revP: a.revP, revChk: a.revChk, revSvc: a.revSvc, revResv: a.revResv, revCare: a.revCare, revSub: a.revSub, revIns: a.revIns, rev: a.rev,
    cogsP: a.cogsP, chkCogs: a.chkCogs, svcCost: a.svcCost, careCost: a.careCost, subCost: a.subCost, payFee: a.payFee, cogs: a.cogs, gross: a.gross,
    pay: a.pay, mktSum: a.mktSum, mk1: a.mk1, media: a.media, creative: a.creative, cardAd: a.cardAd, kit: a.kit, sticker: a.sticker, qrfee: a.qrfee,
    mediRep: a.mediRep, reward: a.reward, donation: a.don, itOpex: a.itOpex, salesCost: a.sales, adminCost: a.admin, sga: a.sga,
    ebitda: a.ebit_model, depr: a.depr, ebit: a.ebit, taxExp: t, net: a.ebit - intY - t };
}

/* ── 연간 예상(추정) 재무제표 — 연차 선택형(외부 호환: 반환 모양 유지) ── */
function finAnnual(yi) {
  const y = yi == null ? 0 : yi;
  const bs = finBSYear(y), r = bs.r, P = finParams();
  return { ...r, ...bs, r,
    op: r.ebit, finIncome: 0, finCost: P.interestYear, pbt: r.pbt, tax: r.tax, net: r.net,
    opMargin: r.opMargin, netMargin: r.netMargin,
    A: { members: r.membersEnd, activeRate: r.membersEnd ? r.active / r.membersEnd : 0, hospitals: r.hospitals, institutions: r.insts, buyerRate: P.productBuyerRate, checkupRate: r.membersEnd ? r.active / r.membersEnd : 0, subFee: r.subFee, y } };
}
// 5개년 추정 — 재무 엔진 위임(외부 호환)
function finMultiYear() { return finYears(5); }
// ── 건강금융지갑·사회적기업 공통 지표 — 제품마진 연동(Wallet·Social이 finSocial(0) 사용 — 반환 모양 유지) ──
/* 회원 화면 배분 규칙 — 특별지원 = 판매마진 × animalShare × animalRate(Social 문구 "25%×5%"), 치료비 1인 지원액 perBeneficiary.
   ※ 회원 화면(Wallet·Social) 문구는 WALLET_SPLIT(적립·나눔·운영 %)을 표시하므로, 금액도 같은 비율로 계산해 화면 안에서 비율과 금액을 맞춘다.
     재무 엔진(예산양식) 손익의 적립·기부 비용은 P.rewardRate·P.donationRate(판매마진 대비)로 따로 계산되며 두 비율이 다를 수 있다(형 확인 사항). */
const FIN_SOCIAL_RULE = { animalShare: 0.25, animalRate: 0.05, perBeneficiary: 255000 };
function finSocial(yi) {
  const rows = finMultiYear(), r = rows[yi == null ? 0 : Math.max(0, Math.min(4, yi))];
  const margin = r.revProduct - r.cogsProduct, R = FIN_SOCIAL_RULE;
  const WS = (typeof WALLET_SPLIT !== "undefined" && WALLET_SPLIT && WALLET_SPLIT.earn != null) ? WALLET_SPLIT : null;
  const earn = WS ? Math.round(margin * WS.earn / 100) : r.reward, give = WS ? Math.round(margin * WS.give / 100) : r.donation;
  const ops = Math.round(margin - earn - give), animal = Math.round(margin * R.animalShare * R.animalRate);
  return { year: r.label, members: r.membersEnd, revenue: r.revenue, margin, earn, give, ops, animal, beneficiaries: Math.max(1, Math.round(give / R.perBeneficiary)) };
}
function finValuation() { return finValModel(); }

/* ══════════ 실시간 재생 — 1틱 = 1일 ══════════ */
/* 수익 분개 — [값 키, 대변 계정, 회수 지연 스트림, 거래 상대, 색]. 회수 지연(lag ≥ 1) 줄은 차변 매출채권, 아니면 현금 */
const FIN_JE_REV = [
  ["revP", "제품매출", "P", "cohort", "#34D399"],
  ["revChkOwn", "검진수수료수익(자사 운영)", "Chk", "검진센터(자사 운영 채널)", "#22D3EE"],
  ["revChkPtn", "검진수수료수익(제휴사)", "Chk", "검진센터(제휴사 채널)", "#38BDF8"],
  ["revResv", "예약수수료수익", "Resv", "예약 제휴 시설", "#F97316"],
  ["revSvc", "서비스수수료수익", "Svc", "헬스케어 서비스 제휴처", "#2DD4BF"],
  ["revCare", "돌봄이용료수익", "Svc", "재가·돌봄 파트너 센터", "#F472B6"],
  ["revIns", "헬스메이트센터사용료수익", "Ins", "헬스메이트센터", "#6366F1"],
  ["revSub", "플랫폼구독료수익", "Sub", "제휴 기관(AI 플랫폼 구독)", "#A78BFA"],
];
/* 비용 분개 — [값 키, 차변, 대변, 색] */
const FIN_JE_COST = [
  ["cogs", "매출원가", "현금", "#F472B6"], ["pay", "인건비", "현금", "#F59E0B"], ["mktSum", "광고선전비(5대 엔진)", "현금", "#EC4899"],
  ["mediRep", "지급수수료(메디에이지 리포트)", "현금", "#FB923C"], ["reward", "포인트 적립비용", "현금", "#22D3EE"], ["donation", "기부금", "현금", "#E11D48"],
  ["itOpex", "IT 운영비", "현금", "#8B5CF6"], ["salesAdmin", "영업비·관리비", "현금", "#64748B"], ["depr", "감가상각비", "감가상각누계액", "#0EA5E9"],
  ["taxExp", "법인세비용", "미지급법인세", "#94A3B8"],
];
/* 손익 밖 현금 지출 — [현금 계정 키, 차변, 색] */
const FIN_JE_CASH = [["oCapex", "유형·무형자산", "#0EA5E9"], ["oDep", "임차보증금", "#94A3B8"], ["offPL", "이익잉여금(임차·채용·설립 — 손익표 밖)", "#64748B"], ["oTax", "미지급법인세", "#94A3B8"]];
const FIN_JE_COLLECT = [["inP", "P"], ["inChk", "Chk"], ["inSvc", "Svc"], ["inCare", "Svc"], ["inResv", "Resv"], ["inSub", "Sub"], ["inIns", "Ins"]];
const FIN_REPLAY_KEYS = ["rev", "cogs", "gross", "sga", "ebitda", "depr", "ebit", "taxExp", "net", "revP", "revChk", "revResv", "revSvc", "revCare", "revSub", "revIns"];

/* 재생 월 목록 — yi 0 = 기준일 실적(asOf.monthly.actual 2027-01~기준일), 1~4 = 계획 원장 1년 */
function finReplayMonths(yi) {
  const M = fbModel(); const P = M.P;
  const lag = (typeof FB_LEVERS !== "undefined" && FB_LEVERS.A && FB_LEVERS.A.lag) || {};
  const lagOf = (k) => (lag[k] == null ? 1 : lag[k]);
  const src = yi === 0 ? M.asOf.monthly.actual : M.ledger.plan;
  const byIdx = (i) => src.find((r) => r.idx === i);
  const out = [];
  for (let i = yi * 12 + 1; i <= (yi + 1) * 12; i++) {
    const r = byIdx(i); if (!r) break;
    const prev = byIdx(i - 1);
    const dim = finDaysIn(r.cal);
    const span = r.partial ? Math.max(1, Math.round(dim * r.partial)) : dim;
    const a = M.annual[Math.floor((i - 1) / 12)];
    const own = a && a.revChk ? (a.chkOwn * P.chkOwnFee) / a.revChk : 0;
    const pl = r.pl || {}, cf = r.cf || {};
    const lines = [];
    const add = (dr, cr, monthAmt, c, who) => { if (typeof monthAmt === "number" && isFinite(monthAmt) && Math.abs(monthAmt) >= 1) lines.push({ dr, cr, amt: monthAmt / span, c, who }); };
    const revVal = { revP: pl.revP, revChkOwn: (pl.revChk || 0) * own, revChkPtn: (pl.revChk || 0) * (1 - own), revResv: pl.revResv, revSvc: pl.revSvc, revCare: pl.revCare, revIns: pl.revIns, revSub: pl.revSub };
    FIN_JE_REV.forEach(([k, crName, lk, who, c]) => add(lagOf(lk) >= 1 ? "매출채권" : "현금", crName, revVal[k], c, who));
    add("현금", "매출채권", FIN_JE_COLLECT.reduce((s, [ck, lk]) => s + (lagOf(lk) >= 1 ? (cf[ck] || 0) : 0), 0), "#FBBF24", "매출채권 회수");
    const costVal = { cogs: pl.cogs, pay: pl.pay, mktSum: pl.mktSum, mediRep: pl.mediRep, reward: pl.reward, donation: pl.donation, itOpex: pl.itOpex, salesAdmin: (pl.salesCost || 0) + (pl.adminCost || 0), depr: pl.depr, taxExp: pl.taxExp };
    FIN_JE_COST.forEach(([k, dr, cr, c]) => add(dr, cr, costVal[k], c, null));
    FIN_JE_CASH.forEach(([k, dr, c]) => add(dr, "현금", cf[k], c, null));
    out.push({ idx: i, cal: r.cal, dim, span, pl, cf, bsPrev: prev ? prev.bs : r.bs, bsEnd: r.bs, mPrev: prev ? (prev.members || 0) : 0, mEnd: r.members || 0, invIn: cf.invIn || 0, lines, partial: r.partial || null });
  }
  return out;
}
/* 재생 D일째 누적 — 흐름은 일할 합, 잔액은 월초 + (월말 − 월초) × 경과일 비율(투자금은 1일 납입) */
function finReplayAt(months, D) {
  const acc = { n: 0 }; FIN_REPLAY_KEYS.forEach((k) => { acc[k] = 0; });
  const m0 = months[0];
  let cash = m0 ? m0.bsPrev.cash : 0, ar = m0 ? m0.bsPrev.ar : 0, members = m0 ? m0.mPrev : 0, cur = null, dd = 0, left = D;
  for (const mo of months) {
    if (left <= 0) break;
    const d = Math.min(left, mo.span), f = d / mo.span;
    FIN_REPLAY_KEYS.forEach((k) => { acc[k] += (mo.pl[k] || 0) * f; });
    const bp = mo.bsPrev;
    cash = bp.cash + mo.invIn + (mo.bsEnd.cash - bp.cash - mo.invIn) * f;
    ar = bp.ar + (mo.bsEnd.ar - bp.ar) * f;
    members = mo.mPrev + (mo.mEnd - mo.mPrev) * f;
    acc.n += mo.lines.length * d + (mo.invIn ? 1 : 0);
    cur = mo; dd = d; left -= d;
  }
  return Object.assign(acc, { cash, ar, members, cur, date: cur ? `${cur.cal}-${String(dd).padStart(2, "0")}` : null });
}
/* D일째부터 거꾸로 분개 목록(최근 limit건) — 결정론(같은 날은 같은 분개) */
function finReplayFeed(months, D, cohort, limit) {
  const out = [];
  const locate = (g) => { let s = 0; for (const mo of months) { if (g <= s + mo.span) return { mo, dd: g - s }; s += mo.span; } return null; };
  for (let day = D; day >= 1 && out.length < limit; day--) {
    const p = locate(day); if (!p) break;
    const date = `${p.mo.cal}-${String(p.dd).padStart(2, "0")}`;
    const es = p.mo.lines.map((l, i) => ({ ...l, date, key: day + "-" + i, i }));
    if (p.dd === 1 && p.mo.invIn) es.unshift({ dr: "현금", cr: "납입자본", amt: p.mo.invIn, c: "#E11D48", who: "투자금 납입", date, key: day + "-inv", i: -1 });
    for (const e of es) {
      let who = e.who || e.dr;
      if (e.who === "cohort") { const m = cohort.length ? cohort[(day * 31 + 7) % cohort.length] : null; who = m ? `${m.name}(${m.id}) · 파일럿 합성 코호트` : "회원"; }
      out.push({ ...e, who });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/* 상단 공통 기준일 배지 */
function FinAsOfBadge() {
  const S = finSafe(() => fbModel().asOf, null);
  if (!S) return null;
  const dim = finDaysIn(S.date.slice(0, 7));
  return (
    <div className="finlink" style={{ background: "#0C1E3A", borderColor: "#1E3A6B" }}>
      <Landmark size={13} color="#60A5FA" /> 기준일 <b>{S.date}</b> · 현재 회원 <b>{finNumS(S.actualMembers, "명")}</b> · 계획 회원 {finNumS(S.planMembers, "명")} · 달성률 <b>{finPctS(S.achieveMembers, 0)}</b>
      <span style={{ color: "#7C8BA8" }}> — 실적 = 회원 연동 계정 × {typeof S.k === "number" ? S.k.toFixed(4) : "-"} · 고정비 계획대로 · {finMonKo(S.date.slice(0, 7))}은 {Math.round(S.frac * dim)}/{dim}일 반영</span>
    </div>
  );
}

function FinanceLive() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [yr, setYr] = useState(0);          // 재생 연도: 0 = 2027 실적(기준일까지), 1~4 = 계획 1년
  const [day, setDay] = useState(0);
  const [tab, setTab] = useState("pl");
  const [anYear, setAnYear] = useState(0);  // 연간 예상 — 연차 선택
  const [pTick, setPTick] = useState(0);    // 파라미터·시나리오 변경 → 전체 재계산 트리거
  const [escTick, setEscTick] = useState(0); // 선수납 정산 처리 후 리렌더
  useEffect(() => { try { if (typeof escSeedDemo === "function") escSeedDemo(); } catch (e) {} }, []);
  const cohort = React.useMemo(() => (typeof pilotCohort === "function" ? finSafe(() => pilotCohort(), []) : []), []);
  const months = React.useMemo(() => finSafe(() => finReplayMonths(yr), []), [yr, pTick]);
  const total = months.reduce((s, m) => s + m.span, 0);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setDay((d) => (d >= total ? d : d + 1)), Math.max(40, 480 / speed));
    return () => clearInterval(iv);
  }, [running, speed, total]);
  useEffect(() => { if (running && total > 0 && day >= total) setRunning(false); }, [day, total, running]);
  const reset = () => { setDay(0); setRunning(true); };
  const M = finSafe(() => fbModel(), null);
  if (!M) return <div className="ontempty">재무 엔진을 불러오지 못했습니다.</div>;
  const P = M.P; const S = M.asOf; void escTick;
  const rp = finReplayAt(months, day);
  const done = total > 0 && day >= total;
  const feed = finReplayFeed(months, day, cohort, 18);
  const yearOf = (y) => FIN_YEAR0 + y;

  return (<>
    <FinAsOfBadge />
    {/* KPI 5종 — 기준일 실적(asOf) */}
    <div className="ontkpis" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
      {[["누적 매출(실적)", finWonU(S.ytd.actual.rev), "#22D3EE", `계획 YTD ${finWon(S.ytd.plan.rev)}`],
        ["영업이익(실적)", finWonU(S.ytd.actual.ebit), S.ytd.actual.ebit >= 0 ? "#34D399" : "#EF4444", `계획 YTD ${finWon(S.ytd.plan.ebit)}`],
        ["당기순이익(실적)", finWonU(S.ytd.actual.net), S.ytd.actual.net >= 0 ? "#34D399" : "#EF4444", `계획 YTD ${finWon(S.ytd.plan.net)}`],
        ["현금 잔액", finWonU(S.bs.actual.cash), "#FBBF24", `재무상태표 일치 · 런웨이 ${S.kpi.runwayMonths == null ? "흑자" : S.kpi.runwayMonths.toFixed(1) + "개월"}`],
        ["계획 대비 달성률", finPctS(S.ytd.rate.rev, 0), "#A78BFA", `매출 기준 · 회원 ${finPctS(S.achieveMembers, 0)}`]].map(([k, v, c, sub], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div>
          <div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 2 }}>{sub}</div></div>
      ))}
    </div>

    <div className="ontsimbar" style={{ marginTop: 12 }}>
      <div className={`ontsimstate ${running ? "on" : ""}`}><span className="dot" /> {running ? "회계기간 진행 중" : done ? (yr === 0 ? "기준일 도달" : "연말 결산 도달") : "일시정지"} <em>· {rp.date || `${yearOf(yr)}-01-01 시작 전`} · 거래 {finNumS(rp.n)}건 · {yr === 0 ? `${yearOf(0)} 실적 재생(기준일 ${S.date}까지)` : `${yearOf(yr)} 계획 1년 재생`}</em></div>
      <div className="ontsimctl" style={{ marginLeft: "auto" }}>
        <span style={{ fontSize: 11.5, color: "var(--soft)", marginRight: 4 }}>재생 연도</span>
        {[0, 1, 2, 3, 4].map((yy) => <button key={yy} className={yr === yy ? "on" : ""} onClick={() => { setYr(yy); setDay(0); setRunning(true); }}>{yearOf(yy)}{yy === 0 ? "(실적)" : "(계획)"}</button>)}
      </div>
      <div className="ontsimctl">
        <button onClick={() => { if (done) reset(); else setRunning((v) => !v); }} className="pri">{running ? <><Pause size={14} /> 일시정지</> : <><Play size={14} /> 재생</>}</button>
        {[1, 2, 4, 8].map((sp) => <button key={sp} className={speed === sp ? "on" : ""} onClick={() => setSpeed(sp)}>{sp}x</button>)}
        <button onClick={reset}><RotateCcw size={14} /> 리셋</button>
      </div>
    </div>
    <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(6,1fr)", marginTop: 8 }}>
      {[["재생 누적 매출", finWonU(rp.rev), "#22D3EE"], ["재생 영업이익", finWonU(rp.ebit), rp.ebit >= 0 ? "#34D399" : "#F87171"], ["재생 당기순이익", finWonU(rp.net), rp.net >= 0 ? "#34D399" : "#F87171"],
        ["현금(재무상태표)", finWonU(rp.cash), "#FBBF24"], ["매출채권", finWonU(rp.ar), "#A78BFA"], [yr === 0 ? "현재 회원(기준일 환산)" : "계획 회원", finNumS(rp.members, "명"), "#60A5FA"]].map(([t, v, c], i) => (
        <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}><b style={{ color: c, fontSize: 13 }}>{v}</b><span>{t}</span></div>
      ))}
    </div>
    <div className="finlink"><Network size={13} color="#22D3EE" /> {yr === 0
      ? <>재생은 <b>{yearOf(0)}-01-01부터 기준일 {S.date}까지</b> 실적 월 흐름(월 ÷ 그 달 일수)을 계정별로 분개합니다. 기준일에 도달하면 위 KPI(기준일 실적)와 같은 값이 됩니다. <b>현재 회원(기준일)</b> {finNumS(S.actualMembers, "명")}은 실적 배율의 근거이고, 분개 거래 상대 이름은 <b>파일럿 합성 코호트</b>({finNumS(cohort.length, "명")} · 가상 인물)에서 표시용으로만 가져옵니다.</>
      : <>{yearOf(yr)} <b>계획</b> 원장(예산양식 월별 계획)을 1년 재생합니다 — 실적이 아닌 계획치입니다. 분개 거래 상대 이름은 <b>파일럿 합성 코호트</b>(가상 인물) 표시용입니다.</>}
    </div>

    <div className="chtabs" style={{ marginTop: 12 }}>{[["pl", "손익계산서 (P&L)", Receipt], ["bs", "재무상태표 (B/S)", Landmark], ["cf", "현금흐름표 (C/F)", TrendingUp], ["cash", "AI 출수납", Landmark], ["escrow", "선수납·정산", Lock], ["invest", "AI 투자", TrendingUp], ["trend", "결산 추이", PieChart], ["annual", "연간 예상(계획)", Banknote], ["plan", "사업계획(월·분기)", Receipt], ["my", "중장기(5개년)", TrendingUp], ["ten", "10개년", TrendingUp], ["saas", "SaaS·투자 KPI", Percent], ["params", "파라미터·시나리오", Zap], ["gtm", "회원·GTM", Users], ["val", "밸류에이션", PieChart], ["graph", "재무 온톨로지·AI", Network]].map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>
    {["annual", "plan", "my", "ten", "saas", "val", "gtm", "graph"].includes(tab) && (
      <div className="finscn" key={"scn" + pTick}>
        <span className="finscn-l">시나리오</span>
        {Object.entries(FIN_SCENARIOS).map(([k, s]) => <button key={k} className={finScenario() === k ? "on" : ""} style={{ "--sc": s.c }} onClick={() => { finSetScenario(k); setPTick((x) => x + 1); }}>{s.label}</button>)}
        <span className="finscn-note">변경 즉시 계획·실적·KPI·기업가치 전체 자동 재계산 · 세부 수치는 ‘파라미터’ 탭</span>
      </div>
    )}

    {tab === "cash" && typeof AICashSystem === "function" && <AICashSystem />}
    {tab === "invest" && typeof AIInvestSystem === "function" && <AIInvestSystem />}

    {tab === "pl" && (() => {
      const A = S.ytd.actual, Pl = S.ytd.plan, An = finAnnualPL(M.annual[0], M.taxes10[0], P);
      const rows = FIN_PL_ROWS.filter(([k, , , opt]) => !opt || A[k] || Pl[k] || An[k]);
      const rate = (k) => { const p = Pl[k], a = A[k]; if (typeof p !== "number" || p <= 0 || typeof a !== "number" || a < 0) return "-"; return finPctS(a / p, 0); };
      const revKeys = FIN_PL_ROWS.filter(([k, , lv]) => lv === "s" && /^rev/.test(k)).map(([k, l]) => [k, l]).filter(([k]) => A[k] || Pl[k]);
      const costKeys = [["cogs", "매출원가"], ...FIN_PL_ROWS.filter(([k]) => ["pay", "mktSum", "mediRep", "reward", "donation", "itOpex", "salesCost", "adminCost", "depr"].includes(k)).map(([k, l]) => [k, l])];
      const costMax = Math.max(1, ...costKeys.map(([k]) => A[k] || 0));
      return (<>
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#34D399" /> 손익계산서 (K-IFRS · 기능별) <span>· {yearOf(0)}-01-01 ~ {S.date} 실적 vs 계획</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>계정</th><th>YTD 실적</th><th>계획 YTD</th><th>달성률</th><th>{yearOf(0)} 연간 계획</th></tr></thead>
            <tbody>{rows.map(([k, l, lv]) => (
              <tr key={k} className={lv === "t" ? "mysub" : lv === "n" ? "mynet" : ""}>
                <td className="mono0">{lv === "s" ? "　" : ""}{l}</td>
                <td className="mono" style={{ color: (k === "ebit" || k === "net" || k === "ebitda" || k === "gross") ? (A[k] >= 0 ? "#6EE7B7" : "#F9A8D4") : undefined }}>{finWon(A[k])}</td>
                <td className="mono">{finWon(Pl[k])}</td>
                <td className="mono">{rate(k)}</td>
                <td className="mono">{finWon(An[k])}</td>
              </tr>))}</tbody>
          </table></div>
          <div className="finpl-note">매출총이익률 실적 {finPctS(A.rev ? A.gross / A.rev : null)} · 계획 {finPctS(Pl.rev ? Pl.gross / Pl.rev : null)} · 차입금이 없어 금융수익·금융비용 행이 없습니다. 법인세: 실적·계획 모두 연내 누적 과세표준(이월결손금 공제) 기준으로 월별 인식합니다. 달성률은 계획이 양수인 계정만 표시합니다.</div>
        </div>
        <div className="ontgrid2">
          <div className="ontpanel">
            <div className="ontph"><PieChart size={15} color="#22D3EE" /> 매출 구성 <span>· YTD 실적 {finWonU(A.rev)}</span></div>
            {revKeys.map(([k, l]) => <FinBar key={k} label={l} value={A[k]} max={A.rev} color={FIN_REV_COLOR[k]} note={`계획 ${finWon(Pl[k])}`} />)}
          </div>
          <div className="ontpanel">
            <div className="ontph"><TrendingUp size={15} color="#F59E0B" /> 비용 구성 <span>· 매출원가 + 판관비 + 상각</span></div>
            {costKeys.map(([k, l]) => <FinBar key={k} label={l} value={A[k]} max={costMax} color={FIN_COST_COLOR[k]} note={`계획 ${finWon(Pl[k])}`} />)}
            <div className="finpl-note">회원 연동 계정(매출·원가·적립·기부·메디에이지·클라우드 증설·LLM·블록체인·영업·관리비)은 실적 배율을 적용하고, 인건비·발송·매체비·IT 고정비·상각은 계획대로 인식합니다.</div>
          </div>
        </div>
      </>);
    })()}

    {tab === "bs" && (() => {
      const cols = [["actual", `${S.date} 실적`], ["plan", `${S.date} 계획`], ["dec2026", `${yearOf(0) - 1}-12-31`]];
      const B = { actual: S.bs.actual, plan: S.bs.plan, dec2026: S.bs.dec2026 };
      const showWc = cols.some(([c]) => B[c].wcAsset);
      const rows = [
        ["Ⅰ. 유동자산", "curAssets", "h"], ["현금및현금성자산", "cash", "s"], ["매출채권", "ar", "s"],
        ["Ⅱ. 비유동자산", "nonCurAssets", "h"], ["임차보증금", "deposit", "s"], ["건설 중인 자산(선급 구축비)", "cip", "s"], ["유형·무형자산(순액)", "ppe", "s"], ...(showWc ? [["운전자본", "wcAsset", "s"]] : []),
        ["자산 총계", "assets", "t"],
        ["Ⅲ. 부채", "liabilities", "h"], ["미지급법인세", "taxPay", "s"],
        ["Ⅳ. 자본", "equity", "h"], ["납입자본(투자금)", "capital", "s"], ["이익잉여금(결손금)", "re", "s"],
        ["└ 손익계산서 누계 순이익", "rePL", "x"], [`└ 준비기간 비용(${yearOf(0) - 1})`, "rePre", "x"], ["└ 임차료·채용·설립 등 손익표 밖 지출(예산양식 자금표 기준)", "reOff", "x"],
        ["부채와 자본 총계", "__le", "t"],
      ];
      const val = (b, k) => (k === "__le" ? b.liabilities + b.equity : b[k]);
      const ratio = (b) => [["부채비율", b.equity ? finPctS(b.liabilities / b.equity, 1) : "-", "부채 ÷ 자본"], ["유동비율", b.liabilities ? finPctS(b.curAssets / b.liabilities, 0) : "부채 없음", "유동자산 ÷ 유동부채"], ["자기자본비율", b.assets ? finPctS(b.equity / b.assets, 1) : "-", "자본 ÷ 자산"]];
      const a = B.actual;
      return (<>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#FBBF24" /> 재무상태표 <span>· 기준일 실적 · 계획 · 전기말 비교</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>계정</th>{cols.map(([c, l]) => <th key={c}>{l}</th>)}</tr></thead>
            <tbody>{rows.map(([l, k, lv]) => (
              <tr key={k} className={lv === "t" ? "mynet" : lv === "h" ? "mysub" : ""}>
                <td className="mono0" style={lv === "x" ? { color: "#90A0BD", paddingLeft: 26 } : undefined}>{lv === "s" ? "　" : ""}{l}</td>
                {cols.map(([c]) => <td key={c} className="mono" style={lv === "x" ? { color: "#90A0BD" } : undefined}>{finWon(val(B[c], k))}</td>)}
              </tr>))}</tbody>
          </table></div>
          <div className="finpl-note">장기차입금 없음(투자금 {finWon(S.kpi.t1)} {typeof FB_INVEST_CAL !== "undefined" ? FB_INVEST_CAL.t1 : ""} · {finWon(S.kpi.t2)} {typeof FB_INVEST_CAL !== "undefined" ? FB_INVEST_CAL.t2 : ""} 납입). 포인트 적립·기부는 예산양식 자금표처럼 발생 즉시 지급하므로 부채로 남지 않습니다. 건설 중인 자산(준비기간 구축비)은 서비스 개시 월에 유형·무형자산으로 대체됩니다.</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Percent size={15} color="#A78BFA" /> 재무비율 · 대차 일치 <span>· 기준일 실적</span></div>
          <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {ratio(a).map(([t, v, s], i) => <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}><b style={{ color: "#C4B5FD" }}>{v}</b><span>{t} <em style={{ fontStyle: "normal", color: "#6B7A99" }}>· {s}</em></span></div>)}
          </div>
          {cols.map(([c, l]) => { const b = B[c]; const ok = Math.abs(b.diff) <= 1; return (
            <div className="finbalance" key={c} style={ok ? undefined : { background: "#3A0F1A", borderColor: "#7F1D1D" }}>{ok ? <Check size={14} color="#34D399" /> : <AlertTriangle size={14} color="#F87171" />} {l} — 자산 <b>{finWonU(b.assets)}</b> = 부채 {finWon(b.liabilities)} + 자본 {finWon(b.equity)} {ok ? "(대차 일치)" : `(차이 ${finWon(b.diff)})`}</div>); })}
        </div>
      </>);
    })()}

    {tab === "cf" && (() => {
      const dec = S.bs.dec2026;
      const build = (w) => {
        const y = S.ytd[w], c = S.ytdCash[w], b = S.bs[w], f = S.cf[w];
        const op = [["당기순이익", y.net], ["(+) 감가상각비(비현금)", y.depr], ["(−) 매출채권 증가", -(b.ar - dec.ar)], ["(+) 미지급법인세 증가", b.taxPay - dec.taxPay], ["(−) 임차료·채용·설립(손익표 밖)", -(c.offPL || 0)]];
        if (c.oWc) op.push(["(−) 운전자본", -c.oWc]);
        const inv = [["유형·무형자산 취득(CAPEX)", -(c.oCapex || 0)], ["임차보증금 증가", -(c.oDep || 0)]];
        if (c.oBuild) inv.push(["선급 구축비", -c.oBuild]);
        return { f, op, inv, fin: [["투자금 납입(유상증자)", c.invIn || 0]], bsCash: b.cash };
      };
      const X = { actual: build("actual"), plan: build("plan") };
      const pre = finSafe(() => finMonthlyY1().pre, []);
      const preSum = (k) => pre.reduce((s, r) => s + (r[k] || 0), 0);
      const prep = S.cf.actual.prep;
      const Row = ({ l, a, p, cls }) => <tr className={cls || ""}><td className="mono0">{l}</td><td className="mono">{finWon(a)}</td><td className="mono">{finWon(p)}</td></tr>;
      const okA = Math.abs(X.actual.f.endCash - X.actual.bsCash) < 1, okP = Math.abs(X.plan.f.endCash - X.plan.bsCash) < 1;
      return (<>
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#34D399" /> 현금흐름표 (간접법) <span>· {S.cf.actual.period}</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>구분</th><th>실적</th><th>계획</th></tr></thead>
            <tbody>
              <Row l="Ⅰ. 영업활동 현금흐름" a={X.actual.f.opCF} p={X.plan.f.opCF} cls="mysub" />
              {X.actual.op.map(([l, v], i) => <Row key={"o" + i} l={"　" + l} a={v} p={X.plan.op[i] ? X.plan.op[i][1] : null} />)}
              <Row l="Ⅱ. 투자활동 현금흐름" a={X.actual.f.invCF} p={X.plan.f.invCF} cls="mysub" />
              {X.actual.inv.map(([l, v], i) => <Row key={"i" + i} l={"　" + l} a={v} p={X.plan.inv[i] ? X.plan.inv[i][1] : null} />)}
              <Row l="Ⅲ. 재무활동 현금흐름" a={X.actual.f.finCF} p={X.plan.f.finCF} cls="mysub" />
              {X.actual.fin.map(([l, v], i) => <Row key={"f" + i} l={"　" + l} a={v} p={X.plan.fin[i][1]} />)}
              <Row l="현금 순증감" a={X.actual.f.opCF + X.actual.f.invCF + X.actual.f.finCF} p={X.plan.f.opCF + X.plan.f.invCF + X.plan.f.finCF} />
              <Row l={`기초 현금(${yearOf(0) - 1}-12-31)`} a={X.actual.f.begCash} p={X.plan.f.begCash} />
              <Row l={`기말 현금(${S.date})`} a={X.actual.f.endCash} p={X.plan.f.endCash} cls="mynet" />
            </tbody>
          </table></div>
          <div className={"finbalance"}>{okA && okP ? <Check size={14} color="#34D399" /> : <AlertTriangle size={14} color="#F87171" />} 기말 현금 = 재무상태표 현금 — 실적 <b>{finWonU(X.actual.bsCash)}</b> {okA ? "일치" : "불일치"} · 계획 {finWonU(X.plan.bsCash)} {okP ? "일치" : "불일치"}</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#F59E0B" /> 준비기간 현금흐름 <span>· {prep.period}</span></div>
          <div className="finpl">
            <div className="finpl-r sub emph2"><span>영업활동(준비기간 비용)</span><b>{finWonU(prep.opCF)}</b></div>
            <div className="finpl-r"><span>　인건비·사전 광고·IT·운영·임차·채용·설립</span><b>{finWonU(-preSum("preExp"))}</b></div>
            <div className="finpl-r sub"><span>투자활동</span><b>{finWonU(prep.invCF)}</b></div>
            <div className="finpl-r"><span>　임차보증금</span><b>{finWonU(-preSum("deposit"))}</b></div>
            <div className="finpl-r"><span>　선급 구축비(건설 중인 자산)</span><b>{finWonU(-preSum("build"))}</b></div>
            <div className="finpl-r sub"><span>재무활동(1차 투자금 납입)</span><b>{finWonU(prep.finCF)}</b></div>
            <div className="finpl-r net"><span>준비기간 말 현금</span><b>{finWonU(prep.endCash)}</b></div>
          </div>
          <div className="finpl-note">준비기간은 매출이 없어 실적·계획이 같습니다. 준비기간 말 현금이 위 표의 기초 현금으로 이어집니다.</div>
        </div>
      </>);
    })()}

    {tab === "escrow" && (() => {
      const st = (typeof escStats === "function") ? escStats() : null;
      const orders = (typeof escAll === "function") ? escAll().slice().sort((a, b) => b.at - a.at) : [];
      const SS = (typeof ESC_STATUS !== "undefined") ? ESC_STATUS : {};
      const d = (ts) => { if (!ts) return "—"; const x = new Date(ts); return `${x.getMonth() + 1}.${x.getDate()}`; };
      const chKo = (c) => (c === "own" ? "자사 운영" : (c === "partner" || c === "ptn") ? "제휴사" : c);
      const BTN_A = { border: "none", background: "#1D4ED8", color: "#fff", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
      const BTN_B = { border: "1px solid #475569", background: "transparent", color: "#94A3B8", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
      const act = (fn, id) => { const r = fn(id); if (typeof toast === "function") toast(r.ok ? "처리됐어요 — 체인에 기록됩니다" : r.reason); setEscTick((t) => t + 1); };
      return (<>
      <div className="finlink" style={{ background: "#0C1E3A", borderColor: "#1E3A6B" }}><Lock size={13} color="#60A5FA" /> <b>선수납 · 공제 정산</b> — 고객이 하이핀에서 <b>검진비를 먼저 결제</b>하면 수검 완료까지 <b>결제대금예치(에스크로)</b>로 분리 보관되고, 수검이 확인되면 <b>채널별 수수료(자사 운영 {finWonU(P.chkOwnFee)} · 제휴사 {finWonU(P.chkPtnFee)})를 공제한 잔액</b>이 검진기관에 정산됩니다. 결제 매입(PG)·예치·정산 대행은 제휴 결제사 라이선스로 수행하며, 아래는 시연 원장입니다.</div>
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
                <td className="mono0">{o.center}{o.channel ? <span style={{ color: "#90A0BD", fontSize: 10.5 }}> · {o.channelKo || chKo(o.channel)}</span> : null}</td>
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
        <div className="finpl-note">회계 처리 — ①결제 시 <b>예수금(계약부채)</b>로 인식(매출 아님) ②수검 확인 후 정산 시 <b>수수료만 매출</b>, 잔액은 기관 지급으로 부채 소멸 ③환불 시 부채 전액 소멸·수수료 미발생. 회원 화면에는 결제 금액과 예치 보호 안내만 표시되며 <b>수수료·지급액은 본 관리자 콘솔에서만</b> 조회됩니다.</div>
      </div>
      </>); })()}

    {tab === "trend" && (() => {
      const PM = S.monthly.plan, AM = S.monthly.actual;
      const rows = PM.map((p, i) => { const a = AM[i] || p; return { cal: p.cal, partial: a.partial, prep: p.idx < 1, pRev: p.pl.rev, aRev: a.pl.rev, pEbit: p.pl.ebit, aEbit: a.pl.ebit, pCash: p.bs.cash, aCash: a.bs.cash }; });
      const revMax = Math.max(1, ...rows.map((r) => Math.max(r.pRev || 0, r.aRev || 0)));
      const cashMax = Math.max(1, ...rows.map((r) => Math.max(r.pCash || 0, r.aCash || 0)));
      const lbl = (r) => r.prep ? `${finMonKo(r.cal)}(준비)` : r.partial ? `${finMonKo(r.cal)}(1~${Math.round(r.partial * finDaysIn(r.cal))}일)` : finMonKo(r.cal);
      const Chart = ({ title, pk, ak, max }) => (
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#FBBF24" /> {title} <span>· 회색 = 계획 · 색 = 실적</span></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 150, borderBottom: "1px solid #24324D", paddingTop: 6 }}>
            {rows.map((r) => (
              <div key={r.cal} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2 }}>
                <i style={{ display: "block", width: "40%", height: finBarH(r[pk], max), background: "#475569", borderRadius: "3px 3px 0 0" }} title={`계획 ${finWon(r[pk])}`} />
                <i style={{ display: "block", width: "40%", height: finBarH(r[ak], max), background: r.partial ? "#FBBF24" : "#22D3EE", borderRadius: "3px 3px 0 0" }} title={`실적 ${finWon(r[ak])}`} />
              </div>))}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>{rows.map((r) => <span key={r.cal} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 9.5, color: "#8FA1C0", overflow: "hidden", whiteSpace: "nowrap" }}>{finMonKo(r.cal)}</span>)}</div>
        </div>);
      return (<>
        <div className="ontgrid2">
          <Chart title="월별 매출" pk="pRev" ak="aRev" max={revMax} />
          <Chart title="월말 누적 현금(재무상태표)" pk="pCash" ak="aCash" max={cashMax} />
        </div>
        <div className="ontpanel">
          <div className="ontph"><Receipt size={15} color="#34D399" /> 월별 결산 <span>· {rows.length ? rows[0].cal : "-"} ~ {rows.length ? rows[rows.length - 1].cal : "-"}</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>월</th><th>매출 계획</th><th>매출 실적</th><th>영업이익 계획</th><th>영업이익 실적</th><th>현금 계획</th><th>현금 실적</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.cal}><td className="mono0">{r.cal.slice(0, 4)} {lbl(r)}</td><td className="mono">{finWon(r.pRev)}</td><td className="mono">{finWon(r.aRev)}</td>
                <td className="mono" style={{ color: r.pEbit >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.pEbit)}</td><td className="mono" style={{ color: r.aEbit >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.aEbit)}</td>
                <td className="mono">{finWon(r.pCash)}</td><td className="mono">{finWon(r.aCash)}</td></tr>))}</tbody>
          </table></div>
          <div className="finpl-note">마지막 달은 기준일까지 부분 반영(흐름 × 경과일 비율, 잔액은 기준일 보간)입니다. 준비기간 월은 매출이 없고 비용은 현금흐름표·재무상태표 결손금에 반영됩니다. 현금 막대는 투자금 납입 월에 올라갑니다.</div>
        </div>
      </>);
    })()}

    {tab === "annual" && (() => {
      const Y = finYears(5); const r = Y[anYear]; const a = M.annual[anYear]; const bs = finBSYear(anYear);
      const pl = finAnnualPL(a, r.tax, P);
      const rows = FIN_PL_ROWS.filter(([k, , , opt]) => !opt || pl[k]);
      const revParts = [["제품판매(건강커머스)", r.revProduct, "#34D399"], ["건강검진 연계 — 자사 운영", r.revChkOwn, "#22D3EE"], ["건강검진 연계 — 제휴사", r.revChkPtn, "#38BDF8"], ["예약 서비스", r.revReservation, "#F97316"], ["재가·돌봄 파트너 이용료", r.revCare, "#F472B6"],
        ...FB_TYPES.map((t) => [`AI 플랫폼 구독 — ${FIN_TYPE_KO[t]}`, r.subT ? r.subT[t] : 0, "#A78BFA"]), ["헬스메이트센터 사용료", r.revInsurance, "#6366F1"]];
      if (r.revService) revParts.push(["헬스케어 서비스 수수료", r.revService, "#2DD4BF"]);
      const bsRows = [["현금및현금성자산", bs.cash], ["매출채권", bs.receivable], ["임차보증금", bs.deposit], ["건설 중인 자산", bs.cip], ["유형·무형자산(순액)", bs.ppe], ...(bs.wcAsset ? [["운전자본", bs.wcAsset]] : [])];
      return (<>
        <div className="finyrsel">{Y.map((l, i) => <button key={i} className={anYear === i ? "on" : ""} onClick={() => setAnYear(i)}>{l.label}</button>)}</div>
        <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><Banknote size={13} color="#34D399" /> {r.label} 계획({P.scnMeta ? P.scnMeta.label : "기준"} 시나리오 · 예산양식 {FB_META.version}) — 연말 회원 <b>{finNumS(r.membersEnd, "명")}</b> · 검진 예약 {finNumS(r.active, "건")} · 마케팅 동의 {finNumS(r.mktConsent, "명")} · 유료 기관 {FB_TYPES.map((t) => `${FIN_TYPE_KO[t]} ${finNumS(r.paidT[t], "곳")}`).join(" · ")} · 구독료(월) {FB_TYPES.map((t) => `${FIN_TYPE_KO[t]} ${r.subFeeT[t] ? finWonU(r.subFeeT[t]) : "무료"}`).join(" · ")} · 검진 자사 비중 {finPctS(fbOwnShare(P, anYear), 0)} · 헬스메이트센터 우대 {finWonU(r.hmPrice)} × 한도 {finNumS(r.hmCap, "건")}(시가 {finWonU(r.hmMarket)}). <b>추정(Pro-forma) 재무제표</b>입니다.</div>
        <div className="ontgrid2">
          <div className="ontpanel">
            <div className="ontph"><Receipt size={15} color="#34D399" /> 연간 예상 손익계산서 <span>· {r.label}</span></div>
            <div className="finpl">{rows.map(([k, l, lv]) => <div key={k} className={`finpl-r ${lv === "t" ? "sub emph1" : lv === "n" ? "net" : "subitem"}`}><span>{lv === "s" ? "　" : ""}{l}</span><b>{finWonU(pl[k])}</b></div>)}</div>
            <div className="finpl-note">영업이익률 {finPctS(r.opMargin)} · 순이익률 {finPctS(r.netMargin)} · 법인세는 이월결손금 반영 계획치 · 차입·이자 {P.interestYear ? finWonU(P.interestYear) : "없음"}</div>
          </div>
          <div className="ontpanel">
            <div className="ontph"><PieChart size={15} color="#22D3EE" /> 연간 예상 매출 구성 <span>· 총 {finWonU(r.revenue)}</span></div>
            {revParts.map(([l, v, c]) => <FinBar key={l} label={l} value={v} max={r.revenue} color={c} />)}
            <div className="finpl-note">{FB_TYPES.every((t) => !r.subFeeT[t]) ? `AI 플랫폼 구독은 ${r.year}년은 무료 — ${finSubStartCal(P)}년부터 기관 유형별 과금.` : `구독료 규칙: ${FB_TYPES.map((t) => finFeeRule(P, t)).join(" · ")} · 상한 ${finWonU(P.subFeeCap)}`}</div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#FBBF24" /> 연말 계획 재무상태표 <span>· {bs.cal}</span></div>
          <div className="ontgrid2">
            <div className="finpl">
              <div className="finpl-r sub emph2"><span>자산 총계</span><b>{finWonU(bs.assets)}</b></div>
              {bsRows.map(([l, v]) => <div className="finpl-r" key={l}><span>　{l}</span><b>{finWonU(v)}</b></div>)}
            </div>
            <div className="finpl">
              <div className="finpl-r sub"><span>부채(미지급법인세)</span><b>{finWonU(bs.liabilities)}</b></div>
              <div className="finpl-r sub emph2"><span>자본 총계</span><b>{finWonU(bs.equity)}</b></div>
              <div className="finpl-r"><span>　납입자본</span><b>{finWonU(bs.capital)}</b></div>
              <div className="finpl-r"><span>　이익잉여금(결손금)</span><b style={{ color: bs.retained >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWonU(bs.retained)}</b></div>
              <div className="finpl-r subitem"><span>　└ 손익계산서 누계 순이익</span><b>{finWonU(bs.retainedPL)}</b></div>
              <div className="finpl-r subitem"><span>　└ 준비기간 비용</span><b>{finWonU(bs.retainedPre)}</b></div>
              <div className="finpl-r subitem"><span>　└ 손익표 밖 지출(임차·채용·설립)</span><b>{finWonU(bs.retainedOff)}</b></div>
            </div>
          </div>
          <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginTop: 10 }}>
            {[["부채비율", finPctS(bs.debtRatio, 1), "#A78BFA"], ["유동비율", bs.liabilities ? finPctS(bs.currentRatio, 0) : "부채 없음", "#22D3EE"], ["자기자본비율", finPctS(bs.equityRatio, 1), "#34D399"], ["ROE", finPctS(bs.roe, 1), "#FBBF24"]].map(([t, v, c], i) => <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}><b style={{ color: c }}>{v}</b><span>{t}</span></div>)}
          </div>
          <div className="finbalance">{Math.abs(bs.diff) <= 1 ? <Check size={14} color="#34D399" /> : <AlertTriangle size={14} color="#F87171" />} 대차 — <b>자산 {finWonU(bs.assets)}</b> = 부채 {finWon(bs.liabilities)} + 자본 {finWon(bs.equity)}</div>
        </div>
      </>);
    })()}

    {tab === "my" && (() => {
      const my = finYears(5); const F = finFormulas(P);
      const revMax = Math.max(1, ...my.map((r) => r.revenue || 0));
      const M_ = (l, f, cls) => <tr className={cls || ""}><td className="mono0">{l}</td>{my.map((r, i) => <td key={i} className="mono">{f(r)}</td>)}</tr>;
      const MF = (l, f, formula, cls) => <tr className={cls || ""}><td className="mono0 hasf">{l}<em className="finf">{formula}</em></td>{my.map((r, i) => <td key={i} className="mono">{f(r)}</td>)}</tr>;
      const last = my[my.length - 1];
      return (<>
        <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><TrendingUp size={13} color="#34D399" /> <b>5개년 중장기 계획(예산양식 {FB_META.version})</b> — 연말 회원 <b>{finNumS(my[0].membersEnd)}→{finNumS(last.membersEnd, "명")}</b> · 검진 예약 {finNumS(my[0].active)}→{finNumS(last.active, "건")} · 마케팅 동의 {finNumS(my[0].mktConsent)}→{finNumS(last.mktConsent, "명")}. AI 플랫폼 구독은 {finSubStartCal(P)}년부터 기관 유형별 과금, 헬스메이트센터 사용료는 우대 한도 내 우대 단가·초과분 시가. 산식은 각 줄 아래(파라미터에서 생성).</div>
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#34D399" /> 중장기 손익 계획 (5개년) <span>· 단위 원</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>항목</th>{my.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
            <tbody>
              {M_("연말 회원", (r) => finNumS(r.membersEnd, "명"), "myhead")}
              {M_("　순증 · 총가입(이탈 보전 포함)", (r) => `${finNumS(r.newMembers)} · ${finNumS(r.grossNew)}`)}
              {M_("검진 예약(반영)", (r) => finNumS(r.active, "건"))}
              {M_("마케팅 동의 회원", (r) => finNumS(r.mktConsent, "명"))}
              {M_("유료 기관(센터·병원·약국)", (r) => `${finNumS(r.paidInsts, "곳")}`)}
              {M_("AI 플랫폼 구독료(월 · 센터/병원/약국)", (r) => FB_TYPES.every((t) => !r.subFeeT[t]) ? "무료" : FB_TYPES.map((t) => finWon(r.subFeeT[t])).join(" / "))}
              {M_("매출액", (r) => finWon(r.revenue), "myrev")}
              {MF("　제품판매(건강커머스)", (r) => finWon(r.revProduct), F.product)}
              {MF("　건강검진 연계(자사·제휴사)", (r) => finWon(r.revCheckup), F.checkup)}
              {MF("　예약 서비스", (r) => finWon(r.revReservation), F.resv)}
              {MF("　재가·돌봄 파트너 이용료", (r) => finWon(r.revCare), F.care)}
              {MF("　AI 플랫폼 구독(기관 유형별)", (r) => finWon(r.revSub), F.sub)}
              {MF("　헬스메이트센터 사용료", (r) => finWon(r.revInsurance), F.hm)}
              {M_("(-) 매출원가", (r) => finWonNeg(r.cogs))}
              {M_("매출총이익", (r) => finWon(r.gross), "mysub")}
              {M_("(-) 판매비와관리비", (r) => finWonNeg(r.sga))}
              {MF("　인건비", (r) => `${finWonNeg(r.payroll)} (${finNumS(r.headTotal, "명")})`, F.pay, "mysub2")}
              {MF("　마케팅(5대 엔진)", (r) => finWonNeg(r.marketing), F.mkt, "mysub2")}
              {MF("　메디에이지 리포트", (r) => finWonNeg(r.mediRep), F.medi, "mysub2")}
              <tr className="mysub2"><td className="mono0 tokc hasf">　포인트 적립 · 기부금<em className="finf">{F.share}</em></td>{my.map((r, i) => <td key={i} className="mono tokc">{finWonNeg(r.reward)} · {finWonNeg(r.donation)}</td>)}</tr>
              {MF("　IT 운영비", (r) => finWonNeg(r.itOpex), F.it, "mysub2")}
              {M_("　영업비·관리비", (r) => finWonNeg((r.salesCost || 0) + (r.adminCost || 0)), "mysub2")}
              {M_("상각 전 영업이익", (r) => finWon(r.ebitda))}
              {MF("(-) 감가상각비", (r) => finWonNeg(r.depr), F.depr)}
              {M_("영업이익", (r) => finWon(r.ebit), "myop")}
              {M_("(-) 법인세(이월결손금 반영)", (r) => finWonNeg(r.tax))}
              {M_("당기순이익", (r) => finWon(r.net), "mynet")}
              {M_("영업이익률", (r) => finPctS(r.opMargin))}
            </tbody>
          </table></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130, marginTop: 12, borderBottom: "1px solid #24324D" }}>{my.map((r) => (
            <div key={r.y} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3 }}>
              <i style={{ display: "block", width: "30%", height: finBarH(r.revenue, revMax), background: "#22D3EE", borderRadius: "3px 3px 0 0" }} title={"매출 " + finWon(r.revenue)} />
              <i style={{ display: "block", width: "30%", height: finBarH(r.ebit, revMax), background: "#34D399", borderRadius: "3px 3px 0 0" }} title={"영업이익 " + finWon(r.ebit)} />
            </div>))}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>{my.map((r) => <span key={r.y} style={{ flex: 1, textAlign: "center", fontSize: 10.5, color: "#8FA1C0" }}>{r.year}</span>)}</div>
          <div className="finpl-note">{last.label} 매출 {finWonU(last.revenue)} · 영업이익 {finWonU(last.ebit)}({finPctS(last.opMargin)}) · 당기순이익 {finWonU(last.net)}. 막대: 매출(청록)·영업이익(녹색).</div>
        </div>
      </>);
    })()}

    {tab === "gtm" && (() => {
      const my = finYears(5); const a0 = M.annual[0]; const C = P.cost2 || {}; const r0 = my[0];
      const chN = (FB_META.channels || []).length;
      const engines = [
        ["메디에이지 검진 시기 안내", `안내 ${finNumS(C.mk1Target && C.mk1Target[0], "명")} × ${C.mk1Times}회 × ${FB_MK1_QUARTERS}분기 발송 · 리포트 ${finNumS(a0.mediN, "건")} 구매`, a0.mk1 + a0.mediRep, `${finNumS(a0.mediN, "명")} 가입 경로`],
        [`온라인 타겟 광고(${chN}개 채널)`, `월 노출 ${finNumS(a0.mk2Impr, "회")} × 가중 CPM ${finWonU(finSafe(() => fbBlendCpm(C), null))} + 소재 제작${a0.cardAd ? " + 카드사 제휴" : ""}`, a0.media + a0.creative + a0.cardAd, "목표 미포함(상향 요인)"],
        ["제휴마케팅 인피니티케어(MOU)", `연계 가입 연 ${finNumS(P.infinityVolume, "명")} · 제휴 센터 ${finNumS(P.infinityCenters, "곳")}`, null, `${finNumS(P.infinityVolume, "명")} 가입 경로`],
        ["검진센터 QR", `누적 센터 ${finNumS(C.qrCenters && C.qrCenters[0], "곳")} · 키트 ${finWonU(C.qrKit)}/곳 · 스티커 ${finWonU(C.qrSticker)} × 검진 예약`, a0.kit + a0.sticker + a0.qrfee, "검진 예약 연계"],
        ["기업 B2B", "기업 복지·단체검진 제휴", null, "-"], // 데모 정책값 — 예산양식에 금액·산식 없음(형 확인 사항)
      ];
      const S_ = S;
      return (<>
        <div className="finlink"><Users size={13} color="#22D3EE" /> <b>회원 목표·획득 전략(GTM)</b> — {yearOf(0)} 가입 {finNumS(a0.gnew, "명")} = 인피니티케어 연계 <b>{finNumS(P.infinityVolume, "명")}</b> + 메디에이지 경유 <b>{finNumS(a0.mediN, "명")}</b>. 온라인 타겟 광고는 광고비를 전액 반영하지만 광고로 모집되는 회원은 목표에 넣지 않았습니다 — <b>목표를 웃돌 수 있는 상향 요인</b>입니다. 현재 회원 <b>{finNumS(S_.actualMembers, "명")}</b>(기준일 계획 {finNumS(S_.planMembers, "명")} · 달성률 {finPctS(S_.achieveMembers, 0)} · 연말 목표 {finNumS(r0.membersEnd, "명")}).</div>
        <div className="ontpanel">
          <div className="ontph"><Megaphone size={15} color="#F59E0B" /> 5대 회원 획득 엔진 <span>· {yearOf(0)} 계획 비용</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>#</th><th>엔진</th><th>물량 산식</th><th>{yearOf(0)} 비용</th><th>회원 목표 반영</th></tr></thead>
            <tbody>{engines.map(([n, d, cost, note], i) => (
              <tr key={i}><td className="mono0">{i + 1}</td><td className="mono0"><b>{n}</b></td><td className="mono" style={{ whiteSpace: "normal" }}>{d}</td><td className="mono">{cost == null ? "별도 마케팅 예산 없음" : finWonU(cost)}</td><td className="mono">{note}</td></tr>))}</tbody>
          </table></div>
          <div className="finpl-note">마케팅 합계(판관비) = 안내 발송 + 매체비 + 소재 + 카드사 제휴 + QR 키트·스티커·연계 수수료. 메디에이지 리포트는 마케팅 합계 밖 별도 판관비 계정입니다.</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Users size={15} color="#22D3EE" /> 5개년 회원 성장 · 실효 CAC</div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>항목</th>{my.map((r, i) => <th key={i}>{r.label}</th>)}</tr></thead>
            <tbody>
              <tr className="myrev"><td className="mono0">연말 회원(목표)</td>{my.map((r, i) => <td key={i} className="mono">{finNumS(r.membersEnd, "명")}</td>)}</tr>
              <tr><td className="mono0">　순증</td>{my.map((r, i) => <td key={i} className="mono">+{finNumS(r.newMembers)}</td>)}</tr>
              <tr><td className="mono0">　신규 가입(이탈 보전 포함)</td>{my.map((r, i) => <td key={i} className="mono">{finNumS(r.grossNew)}</td>)}</tr>
              <tr className="mysub"><td className="mono0">마케팅 합계</td>{my.map((r, i) => <td key={i} className="mono">{finWon(r.marketing)}</td>)}</tr>
              <tr><td className="mono0">　온라인 타겟 광고 매체비</td>{my.map((r, i) => <td key={i} className="mono">{finWon(r.media)}</td>)}</tr>
              <tr><td className="mono0">메디에이지 리포트(건 · 금액)</td>{my.map((r, i) => <td key={i} className="mono">{finNumS(r.mediN)} · {finWon(r.mediRep)}</td>)}</tr>
              <tr><td className="mono0">실효 CAC(마케팅 합계 ÷ 순증)</td>{my.map((r, i) => <td key={i} className="mono">{finNumS(r.effCac, "원")}</td>)}</tr>
            </tbody>
          </table></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110, marginTop: 12, borderBottom: "1px solid #24324D" }}>{my.map((r) => <div key={r.y} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}><i style={{ display: "block", width: 18, height: finBarH(r.membersEnd, my[my.length - 1].membersEnd), background: "#22D3EE", borderRadius: "3px 3px 0 0" }} title={finNumS(r.membersEnd, "명")} /></div>)}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>{my.map((r) => <span key={r.y} style={{ flex: 1, textAlign: "center", fontSize: 10.5, color: "#8FA1C0" }}>{r.year}</span>)}</div>
        </div>
      </>);
    })()}

    {tab === "val" && (() => { const v = finValuation(); const evs = [v.evDCF, v.evEbitda, v.evRev].filter((x) => typeof x === "number" && isFinite(x)); const evLow = evs.length ? Math.min(...evs) : null, evHigh = evs.length ? Math.max(...evs) : null; const lastY = v.disc.length ? v.disc[v.disc.length - 1].year : "-"; return (<>
      <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><PieChart size={13} color="#A78BFA" /> <b>투자유치용 밸류에이션</b> — DCF(현금흐름할인) + 비교기업 멀티플(EV/Revenue·EV/EBITDA). 가정: WACC {finPctS(v.wacc, 0)} · 영구성장 {finPctS(v.termGrowth, 0)} · FCF = 영업이익 − 법인세 + 감가상각 − CAPEX − 운전자본(매출 × {finPctS(typeof FB_WC_RATE !== "undefined" ? FB_WC_RATE : null, 0)}). 투자 요청액(IM) <b>{finWonU(v.im)}</b>.</div>
      <div className="ontgrid2">
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#34D399" /> DCF (현금흐름 할인법)</div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>연도</th><th>FCF</th><th>할인계수</th><th>현재가치(PV)</th></tr></thead>
            <tbody>{v.disc.map((d, i) => <tr key={i}><td className="mono0">{d.y}</td><td className="mono">{finWon(d.fcf)}</td><td className="mono">{typeof d.df === "number" ? d.df.toFixed(3) : "-"}</td><td className="mono">{finWon(d.pv)}</td></tr>)}</tbody>
          </table></div>
          <div className="finpl" style={{ marginTop: 8 }}>
            <div className="finpl-r"><span>5개년 FCF 현재가치 합계</span><b>{finWonU(v.pvSum)}</b></div>
            <div className="finpl-r"><span>터미널 가치(영구성장)</span><b>{finWonU(v.terminal)}</b></div>
            <div className="finpl-r"><span>터미널 현재가치</span><b>{finWonU(v.pvTerminal)}</b></div>
            <div className="finpl-r net"><span>기업가치 EV (DCF)</span><b>{finWonU(v.evDCF)}</b></div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#FBBF24" /> 비교기업 멀티플 (Trading Multiple)</div>
          <div className="finpl">
            <div className="finpl-r sub"><span>{lastY}년 매출 {finWonU(v.lastRevenue)}</span><b></b></div>
            <div className="finpl-r"><span>EV / Revenue ({typeof v.evRevMultiple === "number" ? v.evRevMultiple.toFixed(1) : "-"}x)</span><b>{finWonU(v.evRev)}</b></div>
            <div className="finpl-r sub"><span>{lastY}년 상각 전 영업이익(EBITDA) {finWonU(v.lastEbitda)}</span><b></b></div>
            <div className="finpl-r"><span>EV / EBITDA ({v.evEbitdaMultiple}x)</span><b>{finWonU(v.evEbitda)}</b></div>
            <div className="finpl-r sub"><span>IM 요청액 대비</span><b>EV(DCF) ÷ IM = {v.im ? (v.evDCF / v.im).toFixed(1) + "배" : "-"}</b></div>
          </div>
          <div className="finbalance" style={{ background: "#231A3F", borderColor: "#3f2d5e", marginTop: 12 }}><PieChart size={14} color="#C4B5FD" /> 종합 기업가치 범위 <b>{finWon(evLow)} ~ {finWon(evHigh)}원</b></div>
          <div className="finpl-note">DCF는 초기 적자·높은 WACC로 보수적, 멀티플은 {lastY}년 계획 실적 기준 시장가입니다. 실제 밸류는 성장률·마일스톤·비교기업에 따라 조정됩니다.</div>
        </div>
      </div>
    </>); })()}

    {tab === "plan" && (() => { const mp = finMonthlyY1(); const qa = mp.q.map((q, i) => { const s = mp.rows.slice(i * 3, i * 3 + 3).filter((r) => r.actual); return s.length ? { rev: s.reduce((x, r) => x + r.actual.rev, 0), op: s.reduce((x, r) => x + r.actual.op, 0), cum: s[s.length - 1].actual.cum, partial: s.some((r) => r.actual.partial) } : null; }); return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><Receipt size={13} color="#34D399" /> <b>{yearOf(0)} 월별·분기별 사업계획</b> — 연말 회원 {finNumS(mp.total, "명")} 램프 · 마케팅 합계 {finWonU(mp.cacTotal)}(실효 CAC {finNumS(mp.total ? mp.cacTotal / mp.total : null, "원")}). 실적 열은 기준일 {mp.asOf}까지(마지막 달은 부분 반영). AI 플랫폼 구독은 {finSubStartCal(P)}년 과금 개시.</div>
      <div className="ontpanel">
        <div className="ontph"><Receipt size={15} color="#34D399" /> 월별 계획 · 실적 <span>· 회원·매출·판관비·영업이익</span></div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>월</th><th>신규 회원</th><th>월말 회원</th><th>매출</th><th>판관비</th><th>영업이익</th><th>실적 회원</th><th>실적 매출</th><th>실적 영업이익</th></tr></thead>
          <tbody>
            {mp.pre.map((r) => <tr key={r.label} style={{ opacity: 0.85 }}><td className="mono0">{r.label}(준비)</td><td className="mono">-</td><td className="mono">-</td><td className="mono">-</td><td className="mono">{finWonNeg(r.preExp)}</td><td className="mono" style={{ color: "#F9A8D4" }}>{finWonNeg(r.preExp)}</td><td className="mono" colSpan={3} style={{ color: "#90A0BD" }}>보증금 {finWon(r.deposit)} · 구축비 {finWon(r.build)} · 지출 {finWon(r.out)}</td></tr>)}
            {mp.rows.map((r) => <tr key={r.m}><td className="mono0">{r.label}</td><td className="mono">+{finNumS(r.add)}</td><td className="mono">{finNumS(r.cum)}</td><td className="mono">{finWon(r.rev)}</td><td className="mono">{finWonNeg(r.sga)}</td><td className="mono" style={{ color: r.op >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.op)}</td>
              <td className="mono">{r.actual ? finNumS(r.actual.cum) : "-"}</td><td className="mono">{r.actual ? finWon(r.actual.rev) + (r.actual.partial ? `(1~${Math.round(r.actual.partial * finDaysIn(r.label))}일)` : "") : "-"}</td><td className="mono" style={{ color: r.actual ? (r.actual.op >= 0 ? "#6EE7B7" : "#F9A8D4") : undefined }}>{r.actual ? finWon(r.actual.op) : "-"}</td></tr>)}
          </tbody>
        </table></div>
        <div className="ontph" style={{ marginTop: 14 }}><PieChart size={15} color="#22D3EE" /> 분기별 요약</div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>분기</th><th>신규 회원</th><th>분기말 회원</th><th>마케팅 합계</th><th>매출</th><th>영업이익</th><th>실적 매출</th><th>실적 영업이익</th></tr></thead>
          <tbody>{mp.q.map((r, i) => <tr key={r.q}><td className="mono0">{r.q}분기</td><td className="mono">+{finNumS(r.add)}</td><td className="mono">{finNumS(r.cum)}</td><td className="mono">{finWonNeg(r.cacCost)}</td><td className="mono">{finWon(r.rev)}</td><td className="mono" style={{ color: r.op >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.op)}</td><td className="mono">{qa[i] ? finWon(qa[i].rev) + (qa[i].partial ? "(부분)" : "") : "-"}</td><td className="mono">{qa[i] ? finWon(qa[i].op) : "-"}</td></tr>)}</tbody>
        </table></div>
        <div className="finpl-note">회원 수·단가를 바꾸면(파라미터 탭) 월별 계획·실적 환산·전 재무제표가 자동 재계산됩니다. 준비기간 행의 비용은 손익계산서 밖(준비기간 결손금)으로 인식합니다.</div>
      </div>
    </>); })()}

    {tab === "ten" && (() => { const ty = finYears(10); return (<>
      <div className="finlink" style={{ background: "#0C2A20", borderColor: "#1F5137" }}><TrendingUp size={13} color="#34D399" /> <b>10개년 재무추정</b> — {ty[0].year}~{ty[Math.min(4, ty.length - 1)].year}년은 예산양식 계획, {finExtrapNote(P)}. 구독료 상한 월 {finWonU(P.subFeeCap)}.</div>
      <div className="ontpanel">
        <div className="ontph"><TrendingUp size={15} color="#34D399" /> 10개년 손익·현금 추정</div>
        <div className="onttbl-wrap"><table className="onttbl mytbl">
          <thead><tr><th>연도</th><th>구분</th><th>회원</th><th>유료 기관</th><th>구독료(월 · 센터/병원/약국)</th><th>매출</th><th>영업이익</th><th>순이익</th><th>ARR</th><th>FCF</th></tr></thead>
          <tbody>{ty.map((r) => <tr key={r.y}><td className="mono0">{r.label}</td><td className="mono">{r.extrapolated ? "외삽" : "계획"}</td><td className="mono">{finNumS(r.membersEnd)}</td><td className="mono">{finNumS(r.paidInsts)}</td><td className="mono">{FB_TYPES.every((t) => !r.subFeeT[t]) ? "무료" : FB_TYPES.map((t) => finWon(r.subFeeT[t])).join(" / ")}</td><td className="mono">{finWon(r.revenue)}</td><td className="mono" style={{ color: r.ebit >= 0 ? "#6EE7B7" : "#F9A8D4" }}>{finWon(r.ebit)}</td><td className="mono">{finWon(r.net)}</td><td className="mono">{finWon(r.arr)}</td><td className="mono">{finWon(r.fcf)}</td></tr>)}</tbody>
        </table></div>
      </div>
    </>); })()}

    {tab === "saas" && (() => {
      const ss = finSaaSModel(); const K = finKPIs(); const y3 = FIN_YEAR0 + 2;
      const kpis = [["실효 CAC(" + FIN_YEAR0 + ")", finNumS(K.cac, "원"), "#F59E0B"], [`LTV(${y3})`, finWonU(K.ltv), "#34D399"], ["LTV/CAC", typeof K.ltvCac === "number" ? K.ltvCac.toFixed(1) + "x" : "-", K.ltvCac >= 3 ? "#34D399" : "#F59E0B"],
        [`CAC Payback(${y3})`, typeof K.payback === "number" ? K.payback.toFixed(1) + "개월" : "-", "#FBBF24"], [`ARPU(${y3})`, finWonU(K.arpu), "#22D3EE"], [`ARPPU(${y3})`, finWonU(K.arppu), "#22D3EE"],
        [`매출총이익률(${y3})`, finPctS(K.grossMargin), "#A78BFA"], [`영업이익률(${y3})`, finPctS(K.opMargin), "#A78BFA"], [`상각 전 영업이익(${y3})`, finWonU(K.ebitda3), "#6366F1"],
        ["최근 3개월 평균 순유출", finWonU(K.burn3m), "#F472B6"], ["런웨이(기준일)", isFinite(K.runway) ? K.runway.toFixed(1) + "개월" : "흑자", "#F472B6"], ["현금 잔액(기준일)", finWonU(K.cashAsOf), "#FBBF24"],
        ["Magic Number", typeof K.magic === "number" ? K.magic.toFixed(2) : "-", "#FBBF24"], [`Rule of 40(${y3})`, typeof K.rule40 === "number" ? K.rule40.toFixed(0) : "-", K.rule40 >= 40 ? "#34D399" : "#F59E0B"], ["EV(DCF)", finWonU(K.ev), "#EAB308"],
        ["EV/Sales 배수", typeof K.evSales === "number" ? K.evSales.toFixed(1) + "x" : "-", "#EAB308"], [`ROI(${FIN_YEAR0 + 4} 순이익 ÷ IM)`, finPctS(K.roi5, 0), "#34D399"], ["이탈률(연)", finPctS(K.churn, 0), "#94A3B8"]];
      const inv = K.invest || {}; const def = K.investDefault;
      return (<>
        <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Percent size={13} color="#A78BFA" /> <b>SaaS 구독 모델 + 투자자 KPI</b> — AI 플랫폼 구독은 기관 유형별 요금({FB_TYPES.map((t) => finFeeRule(P, t)).join(" · ")}, 상한 {finWonU(P.subFeeCap)}), {finSubStartCal(P)}년 과금 개시. 파라미터가 바뀌면 MRR·ARR·전 KPI가 자동 재계산됩니다.</div>
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#A78BFA" /> 구독(Subscription) 지표 <span>· 유형별 유료 기관·월 구독료·MRR(연말)·ARR</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>연도</th>{FB_TYPES.map((t) => <th key={t}>{FIN_TYPE_KO[t]}(곳 × 월)</th>)}<th>MRR(연말)</th><th>ARR</th><th>ARR 성장</th><th>Expansion(인상분)</th><th>구독 매출(반영)</th></tr></thead>
            <tbody>{ss.map((s, i) => <tr key={i}><td className="mono0">{s.label}</td>{FB_TYPES.map((t) => <td key={t} className="mono">{finNumS(s.paidT[t])} × {s.subFeeT[t] ? finWon(s.subFeeT[t]) : "무료"}</td>)}<td className="mono">{finWon(s.mrr)}</td><td className="mono">{finWon(s.arr)}</td><td className="mono">{s.growth == null ? "-" : finPctS(s.growth, 0)}</td><td className="mono">{finWon(s.expansion)}</td><td className="mono">{finWon(s.recurring)}</td></tr>)}</tbody>
          </table></div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Percent size={15} color="#FBBF24" /> 투자자 핵심 KPI <span>· 자동 계산</span></div>
          <div className="ontcostgrid" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
            {kpis.map(([t, v, c], i) => <div className="ontcostcell" key={i} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}><b style={{ color: c, fontSize: 13 }}>{v}</b><span>{t}</span></div>)}
          </div>
          <div className="onttbl-wrap" style={{ marginTop: 10 }}><table className="onttbl mytbl">
            <thead><tr><th>연도</th><th>평균 회원</th><th>ARPU</th><th>매출총이익률</th><th>실효 CAC</th><th>LTV</th><th>LTV/CAC</th><th>Payback</th></tr></thead>
            <tbody>{(K.years || []).map((x) => <tr key={x.year}><td className="mono0">{x.year}</td><td className="mono">{finNumS(x.avgMembers)}</td><td className="mono">{finWon(x.arpu)}</td><td className="mono">{finPctS(x.grossMargin)}</td><td className="mono">{finNumS(x.cac)}</td><td className="mono">{finWon(x.ltv)}</td><td className="mono">{typeof x.ltvCac === "number" ? x.ltvCac.toFixed(1) + "x" : "-"}</td><td className="mono">{typeof x.payback === "number" ? x.payback.toFixed(1) + "개월" : "-"}</td></tr>)}</tbody>
          </table></div>
          <div className="finpl-note">{K.ltvFormula} · 실효 CAC = 마케팅 합계 ÷ 순증 · Payback = CAC ÷ (월 회원당 매출총이익) · 런웨이 = 기준일 현금 ÷ 최근 3개월 평균 순유출 · Rule of 40 = 매출성장률 + EBITDA 마진.</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Banknote size={15} color="#F472B6" /> 투자금 계획 A/B/C <span>· 요청액·트랜치·현금 저점</span></div>
          <div className="onttbl-wrap"><table className="onttbl mytbl">
            <thead><tr><th>계획</th><th>현금 저점</th><th>저점 월</th><th>필요 총자금</th><th>요청액</th><th>1차</th><th>2차</th><th>1차만으로 소진 월</th><th>런웨이</th><th>준비기간 비용</th></tr></thead>
            <tbody>{["A", "B", "C"].filter((k) => inv[k]).map((k) => { const x = inv[k]; const on = k === def; return (
              <tr key={k} style={on ? { background: "#231A3F" } : undefined}><td className="mono0"><b style={{ color: on ? "#F472B6" : undefined }}>{k}{on ? " (요청안)" : ""}</b></td><td className="mono">{finWon(x.low)}</td><td className="mono">{x.lowCal || "-"}</td><td className="mono">{finWon(x.need)}</td><td className="mono"><b>{finWon(x.req)}</b></td><td className="mono">{finWon(x.t1)}</td><td className="mono">{finWon(x.t2)}</td><td className="mono">{x.t1RunOutCal || "없음"}</td><td className="mono">{x.runway || "-"}</td><td className="mono">{finWon(x.preExp)}</td></tr>); })}</tbody>
          </table></div>
          <div className="finpl-note">저점 월·소진 월은 각 계획 자체 달력(오픈 시점이 다름) 기준입니다. 재무상태표·실적의 납입 시점은 1차 {typeof FB_INVEST_CAL !== "undefined" ? FB_INVEST_CAL.t1 : "-"} · 2차 {typeof FB_INVEST_CAL !== "undefined" ? FB_INVEST_CAL.t2 : "-"}(IM {finWonU(K.im)}), 차입금은 없습니다. 기준일 현금 {finWonU(K.cashAsOf)} · 최근 3개월 평균 순유출 {finWonU(K.burn3m)}.</div>
        </div>
      </>);
    })()}

    {tab === "params" && <FinParamsPanel onApply={() => setPTick((x) => x + 1)} />}

    {tab === "graph" && <FinGraphPanel key={"g" + pTick} />}

    <div className="ontpanel">
      <div className="ontph"><Zap size={15} color="#FBBF24" /> 실시간 회계 분개(Journal) <span>· 복식부기 차·대변 · 1틱 = 1일 · 금액은 일할</span></div>
      <div className="ontfeed">
        {feed.length === 0 && <div className="ontempty">재생을 시작하면 {yearOf(yr)}-01-01부터 분개가 쌓입니다…</div>}
        {feed.map((j, i) => (
          <div className="ontfeed-i buy" key={j.key} style={i > 0 ? { animation: "none" } : undefined}>
            <span className="ontfeed-ic" style={{ background: j.c + "22", color: j.c }}><Coins size={13} /></span>
            <div className="ontfeed-b"><div className="ontfeed-t"><b>{j.date}</b> · {j.who}</div><div className="ontfeed-s">(차) {j.dr} {finWon(j.amt)} / (대) {j.cr} {finWon(j.amt)}</div></div>
            <span className="ontfeed-tag" style={{ color: j.c }}>{finWon(j.amt)}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="chnote" style={{ marginTop: 12 }}>※ <b>K-IFRS 기준 관리회계 화면</b>입니다. 현재(실적) 화면은 기준일 {S.date}까지 누적이며 회원 연동 계정은 계획 × {typeof S.k === "number" ? S.k.toFixed(4) : "-"}(현재 회원 ÷ 기준일 계획 회원), 고정비는 계획대로 인식합니다. 계획 화면은 투자금 산정 예산양식 {FB_META.version} 그대로입니다. 법인세율 {finPctS(P.taxRate, 0)} · 차입금·이자 {P.interestYear ? "있음" : "없음"} · 포인트 적립·기부는 발생 즉시 지급. 실제 결산·세무는 회계기준·세법에 따릅니다.</div>
  </>);
}

/* 중장기 산식 문자열 — 전부 P에서 생성 */
function finFormulas(P) {
  const C = P.cost2 || {}; const pct = (x) => finPctS(x, 0);
  const arpu = (P.productCats || []).reduce((s, c) => s + (c.arpu || 0), 0);
  const hm = fbHmTerms(P, 0); const rpa = P.resvPerActive || [];
  return {
    product: `구매 회원(연말 회원 × ${pct(P.productBuyerRate)}) × 카테고리 ARPU 합 ${finW(arpu)}원 × 점유율 ${pct(P.productCapture)} × 반영률 · ${FIN_YEAR0} 보정 ×${P.prodAdjY1}`,
    checkup: `검진 예약 × [자사 운영 ${finW(P.chkOwnFee)}원 × 자사 비중(${pct(P.chkOwnShareY1)}에서 매년 +${finPctS(P.chkOwnShareStep, 0)}p) + 제휴사 ${finW(P.chkPtnFee)}원 × 나머지]`,
    resv: `검진 예약 목표 × 연 ${rpa[0] == null ? "-" : rpa[0]}→${rpa.length ? rpa[rpa.length - 1] : "-"}건 × ${finW(P.resvFee)}원 × 반영률`,
    care: `연말 회원 × ${pct(P.careRate)} ÷ 12 ÷ 센터당 ${P.carePerCenter}명 → 파트너 센터·월 × 월 ${finW(P.careFee)}원 × 반영률`,
    sub: FB_TYPES.map((t) => `${FIN_TYPE_KO[t]} 월 ${finW((P.subFeeBaseT || {})[t])}원(${finFeeRule(P, t).replace(FIN_TYPE_KO[t] + " ", "")})`).join(" · ") + ` · 상한 ${finW(P.subFeeCap)}원 · ${finSubStartCal(P)}년 과금 개시 · 유료 기관 × 12 × 반영률`,
    hm: `DB 공급 건수 — 우대 ${finW(hm.price)}원(시가 × ${pct(P.hmRate1)}) × 한도 연 ${finNumS(hm.cap)}건 + 초과분 시가 ${finW(hm.mkt)}원`,
    pay: `부문별 인원(${(C.sections || []).length}개 부문 · 연동 지표 탄력성 ${C.headElast}) × 업계 연봉 × 임금 상승 연 ${finPctS(C.wageGrowth, 1)} × 사용자 부담 + 자문 ${C.advisors}명`,
    mkt: `① 안내 ${finNumS(C.mk1Target && C.mk1Target[0])}명 × ${C.mk1Times}회 × ${FB_MK1_QUARTERS}분기 × ${C.mk1Unit}원 ② 온라인 타겟 광고 ${(FB_META.channels || []).length}개 채널(월 노출 × 가중 CPM) + 소재 ③ 인피니티케어 MOU ④ 검진센터 QR 키트 ${finW(C.qrKit)}원·스티커 ${C.qrSticker}원 ⑤ 기업 B2B`,
    medi: `(총가입 − 인피니티케어 연계 ${finNumS(P.infinityVolume)}명) × 리포트 ${finW(C.mediFee)}원 · DB 한도 ${finNumS(C.mediDb)}건`,
    share: `제품 마진 × 적립 ${pct(P.rewardRate)} · 기부 ${pct(P.donationRate)}`,
    it: `유지보수(누적 구축비 × ${pct(C.maintRate)}) + 데이터·보안·클라우드 기본 + 클라우드 증설 + LLM 상담 + 블록체인 기록`,
    depr: `CAPEX ${C.life}년 정액(취득 연도 반년)`,
  };
}

/* ── 파라미터·시나리오 패널 — 허용 키(FB_OVERRIDE_KEYS)와 1:1, placeholder = 예산양식 원값(FB_P0) ── */
const FIN_PARAM_LABEL = {
  productBuyerRate: "제품 구매율(0~1)", productCapture: "지갑 점유율(0~1)", prodAdjY1: "1차연도 제품 보정 배율",
  subFeeBase_c: "구독료 기본 — 검진센터(원/월)", subFeeBase_h: "구독료 기본 — 병원(원/월)", subFeeBase_p: "구독료 기본 — 약국(원/월)", subStart: "구독 과금 개시 연차(1 = 1차연도)",
  chkOwnFee: "검진 연계 수수료 — 자사 운영(원/건)", chkPtnFee: "검진 연계 수수료 — 제휴사(원/건)", chkOwnShareY1: "자사 운영 비중 1차연도(0~1)",
  hmMarket: "헬스메이트센터 DB 시가(원/건)", hmRate1: "우대 단가 비율(시가 대비 0~1)", hmCap1: "우대 한도(건/년)",
  rewardRate: "포인트 적립률(제품 마진 대비)", donationRate: "기부율(제품 마진 대비)", careFee: "돌봄 파트너 월 이용료(원)",
  headElast: "인원 탄력성(연동 지표 대비)", wageGrowth: "임금 상승률(연)", mk2Impr: "온라인 광고 월 노출(1차연도)", maintRate: "유지보수율(누적 구축비 대비)",
  t1Rate: "1차 투자 비율(0~1)", actualMembers: "기준일 현재 회원(명)", wacc: "WACC(0~1)", evRevMultiple: "EV/Revenue 배수", tenYearGrowth: "10개년 외삽 회원 성장률(연)",
};
function finParamLabel(k) {
  let m = k.match(/^members(\d)$/); if (m) return `${FIN_YEAR0 + Number(m[1]) - 1}년 연말 회원(명)`;
  m = k.match(/^activeAbs(\d)$/); if (m) return `${FIN_YEAR0 + Number(m[1]) - 1}년 검진 예약 목표(건)`;
  return FIN_PARAM_LABEL[k] || k;
}
function finParamDefault(k) {
  const P0 = FB_P0; const C0 = P0.cost2 || {};
  let m = k.match(/^members(\d)$/); if (m) return (P0.membersEnd || [])[Number(m[1]) - 1];
  m = k.match(/^activeAbs(\d)$/); if (m) return (P0.activeAbs || [])[Number(m[1]) - 1];
  const T = { subFeeBase_c: "centers", subFeeBase_h: "hospitals", subFeeBase_p: "pharmacies" };
  if (T[k]) return (P0.subFeeBaseT || {})[T[k]];
  if (k === "subStart") return (P0.subStartYear || {}).hospitals;
  if (["headElast", "wageGrowth", "mk2Impr", "maintRate"].includes(k)) return C0[k];
  if (k === "t1Rate") return P0.t1Rate != null ? P0.t1Rate : FB_META.t1Rate;
  if (k === "actualMembers") return P0.actualMembers != null ? P0.actualMembers : FB_ASOF.actualMembers;
  return P0[k];
}
function FinParamsPanel({ onApply }) {
  const [ver, force] = useState(0);
  const o = finOverrides(); const scn = finScenario(); const P = finSafe(() => finParams(), {});
  const keys = (typeof FB_OVERRIDE_KEYS !== "undefined") ? FB_OVERRIDE_KEYS : [];
  const set = (k, v) => { finSetParam(k, v); force((x) => x + 1); onApply && onApply(); };
  return (<>
    <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Zap size={13} color="#C4B5FD" /> <b>파라미터 기반 단일 재무모델</b> — 아래 값을 바꾸면 계획(P/L·B/S·C/F·월별·SaaS·KPI·기업가치)과 기준일 실적 환산이 <b>즉시 자동 재계산</b>됩니다. 빈칸이면 예산양식 {FB_META.version} 기본값(흐린 글씨)을 씁니다.</div>
    <div className="ontpanel">
      <div className="ontph"><Zap size={15} color="#FBBF24" /> 시나리오 <span>· 보수 · 기준 · 공격</span></div>
      <div className="finscn" style={{ margin: 0 }}>
        {Object.entries(FIN_SCENARIOS).map(([k, s]) => <button key={k} className={scn === k ? "on" : ""} style={{ "--sc": s.c }} onClick={() => { finSetScenario(k); force((x) => x + 1); onApply && onApply(); }}>{s.label} <em>회원×{s.memberMult} · 기관×{s.instMult} · 전환율×{s.rateMult} · 광고단가×{s.cacMult}</em></button>)}
      </div>
    </div>
    <div className="ontpanel">
      <div className="ontph"><Receipt size={15} color="#34D399" /> 사업 가정 파라미터 <span>· {keys.length}개 변수 (저장: 브라우저)</span></div>
      <div className="finparams">
        {keys.map((k) => { const d = finParamDefault(k); return (
          <label className="finparam" key={k + "-" + ver}>
            <span>{finParamLabel(k)}</span>
            <input type="number" step="any" defaultValue={o[k] != null ? o[k] : ""} placeholder={d == null ? "" : String(d)} onBlur={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
          </label>); })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="book" onClick={() => { finResetParams(); force((x) => x + 1); onApply && onApply(); if (typeof toast === "function") toast("재무 파라미터를 기본값으로 초기화했어요"); }}>기본값으로 초기화</button>
      </div>
      <div className="finpl-note">구독료 정책: {P.subFeeBaseT ? FB_TYPES.map((t) => `${FIN_TYPE_KO[t]} 월 ${finWonU(P.subFeeBaseT[t])}(${finFeeRule(P, t).replace(FIN_TYPE_KO[t] + " ", "")})`).join(" · ") : "-"} · 상한 {finWonU(P.subFeeCap)} · {P.subStartYear ? finSubStartCal(P) + "년 과금 개시" : "-"}. 헬스메이트센터 우대 한도 연 {finNumS(P.hmCap1, "건")} · 시가 {finWonU(P.hmMarket)}. 기준일 현재 회원을 바꾸면 실적 배율(k)이 다시 계산됩니다.</div>
    </div>
  </>);
}

/* ── 재무회계 온톨로지 그래프 + 데이터 계보(Lineage) + AI 자연어 질의(하이 연동) ── */
const FIN_ASK_CHIPS = ["2027년 매출은?", "현재 실적은?", "투자금·트랜치는?", "런웨이는?", "헬스메이트센터 사용료는?", "구독료 정책은?"];
function FinGraphPanel() {
  const [yr, setYr] = useState(0);
  const [q, setQ] = useState("");
  const [ans, setAns] = useState(null);
  const rows = finYears(5); const r = rows[yr]; const P = finParams();
  const K = finSafe(() => finKPIs(), {}); const V = finSafe(() => finValModel(), {});
  const nodeVal = (n) => {
    if (n.k === "inv") return `IM ${finWonU(K.im)} · 런웨이 ${K.runway == null ? "-" : isFinite(K.runway) ? K.runway.toFixed(1) + "개월" : "흑자"}`;
    if (n.k === "ev") return finWonU(V.evDCF);
    if (n.k === "ocf") { const cf = finSafe(() => finCFYear(yr), null); return cf && isFinite(cf.opCF) ? finWonU(cf.opCF) : "-"; }
    if (n.k === "acq") return (isFinite(r.mktSum) && isFinite(r.mediRep)) ? finWonU(r.mktSum + r.mediRep) : "-";
    if (!n.field || r[n.field] == null) return "-";
    if (n.field === "membersEnd" || n.field === "mktConsent") return finNumS(r[n.field], "명");
    if (n.field === "insC") return finNumS(r[n.field], "건");
    return finWonU(r[n.field]);
  };
  const ask = (text) => { const t = (text == null ? q : text).trim(); if (!t) return; let res = null; try { res = finAsk(t); } catch (e) {} setAns(res || { lines: ["그 질문은 아직 재무 엔진이 이해하지 못했어요 — 연도 매출·영업이익·현재 실적·투자금·런웨이·회원·헬스메이트센터 사용료·구독료·원가·기업가치로 물어봐 주세요."], buttons: [] }); };
  return (<>
    <div className="finlink" style={{ background: "#231A3F", borderColor: "#3f2d5e" }}><Network size={13} color="#C4B5FD" /> <b>재무회계 온톨로지</b> — 모든 계정이 인과 사슬로 연결되고, 각 수치는 <b>데이터 계보(입력→계산식→결과)</b>로 추적됩니다. 하이(AI)에게 자연어로 물어보세요.</div>
    <div className="ontpanel">
      <div className="ontph"><Network size={15} color="#A78BFA" /> 가치 인과 사슬 <span>· 회원 획득 → 회원 → 검진·동의 → 사용료·구독·돌봄 → 매출 → 현금 → 투자금·런웨이 → EV · {r.label}</span></div>
      <div className="finchain">{FIN_GRAPH.map((n, i) => (<React.Fragment key={n.k}><span className="finchain-n" style={{ borderColor: n.c, color: n.c }} title={nodeVal(n)}>{n.k === "inst" ? `제휴 기관 → AI 플랫폼 구독(${finSubStartCal(P)}~)` : n.label}<em style={{ display: "block", fontStyle: "normal", fontSize: 10, color: "#AFC0DE", marginTop: 2 }}>{nodeVal(n)}</em></span>{i < FIN_GRAPH.length - 1 && <ChevronRight size={13} color="#4A5878" />}</React.Fragment>))}</div>
    </div>
    <div className="ontgrid2">
      <div className="ontpanel">
        <div className="ontph"><Receipt size={15} color="#34D399" /> 데이터 계보(Lineage) <span>· 수치의 근거 추적</span></div>
        <div className="finyrsel" style={{ marginBottom: 8 }}>{P.years.slice(0, 5).map((l, i) => <button key={i} className={yr === i ? "on" : ""} onClick={() => setYr(i)}>{l}</button>)}</div>
        <div className="finlin">{(r.lin || []).map((x, i) => (
          <div className="finlin-r" key={i}><b>{x.label}</b><span>{x.formula}</span><em>{finWonU(x.value)}</em></div>
        ))}</div>
      </div>
      <div className="ontpanel">
        <div className="ontph"><Bot size={15} color="#F97316" /> 하이에게 재무 질의 <span>· 자연어 → 수치+근거</span></div>
        <div className="finask">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} placeholder="예: 2028년 매출은? / 현재 실적은? / 런웨이는?" />
          <button onClick={() => ask()}>질의</button>
        </div>
        <div className="finask-chips">{FIN_ASK_CHIPS.map((c) => <button key={c} onClick={() => { setQ(c); ask(c); }}>{c}</button>)}</div>
        {ans && <div className="finask-ans">{(ans.lines || []).map((l, i) => <p key={i}>{l}</p>)}</div>}
        <div className="finpl-note">같은 엔진(finAsk)이 관리자 세션의 하이 독에도 연결돼 있어 어느 화면에서든 “현재 실적은?”처럼 물으면 답합니다.</div>
      </div>
    </div>
  </>);
}

/* 회계 온톨로지 계정과목(COA) — 수익원·원가·판관비·재무상태 계정 */
function finCoaGroups() {
  const subStart = finSafe(() => finSubStartCal(fbModel().P), null);
  return [
    { g: "수익 (Revenue)", c: "#22D3EE", items: [`AI 플랫폼 구독(${subStart ? subStart + "년 과금 · " : ""}기관 유형별)`, "건강검진 연계(자사·제휴사)", "헬스메이트센터 사용료", "건강커머스", "예약 서비스", "재가·돌봄 파트너 이용료"] },
    { g: "매출원가 (COGS)", c: "#F472B6", items: ["제품 원가", "검진 연계 서비스 원가", "돌봄 원가", "구독 운영 원가", "결제 수수료"] },
    { g: "판매관리비 (SG&A)", c: "#F59E0B", items: ["인건비", "마케팅(발송·광고·소재·QR)", "메디에이지 리포트", "포인트 적립", "기부금", "IT 운영비(유지보수·데이터·보안·클라우드·LLM·블록체인)", "영업비", "관리비"] },
    { g: "자산·부채·자본", c: "#E11D48", items: ["매출채권", "임차보증금", "유형·무형자산", "미지급법인세", "납입자본", "결손금"] },
  ];
}

function FinanceSection({ onGo }) {
  const coa = finCoaGroups();
  const ver = finSafe(() => FB_META.version, "");
  return (
    <div style={{ marginTop: 16 }}>
      <div className="ontohero">
        <div className="ontohero-bg"><span /><span /></div>
        <div className="ontohero-l">
          <span className="ontotag"><Landmark size={13} /> Financial Accounting Ontology · K-IFRS</span>
          <div className="ontotitle">재무회계 온톨로지 시스템</div>
          <p>투자금 산정 예산양식{ver ? " " + ver : ""}의 가정·산식으로 <b>계획</b>(연간·월별·5개년·10개년)과 <b>기준일 실적</b>(현재 회원 기준 환산)을 함께 계산합니다. 수익원은 <b>AI 플랫폼 구독(기관 유형별) · 건강검진 연계(자사·제휴사) · 헬스메이트센터 사용료 · 건강커머스 · 예약 서비스 · 재가·돌봄 파트너 이용료</b>이고, 거래는 1일 단위 <b>실시간 분개</b>로 재생됩니다.</p>
        </div>
        <div className="ontohero-kpi">
          <div><b>{coa[0].items.length}</b><span>수익 계정</span></div>
          <div><b>{coa[1].items.length + coa[2].items.length}</b><span>비용 계정</span></div>
          <div><b>{coa[3].items.length}</b><span>재무상태 계정</span></div>
        </div>
      </div>

      <div className="ontobjbar" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {coa.map((g, i) => (
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
