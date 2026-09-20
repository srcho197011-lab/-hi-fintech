/* ====================== 재무회계 — AI 출수납 · AI 투자 ======================
   AI 출수납: 우리은행 데모계좌 5 — 계좌 합계 = 기준일 실적 현금(fbModel().asOf), 배분 규칙·최근 6개월 입출금·거래 목록은 실적 원장에서 생성.
   AI 투자: 성장 투자 단계(여유자금 운용 없음) — 운용 개시 조건 = 계획 A 누적 현금흐름(조달 전) 흑자 전환 월(엔진 계산) 이후 잉여 현금.
     목표 비중·자산군별 원칙은 확정 운용 정책(형 확정 2026-09-17 — INV_CLASSES).
   ⚠️ 은행 데모계좌·이체는 시연용 데모. 실제 뱅킹·투자는 인가·계약·규제 검토를 전제로 한다. */

const _fnOk = (n) => typeof n === "number" && Number.isFinite(n);
const _fnWon = (n) => (_fnOk(n) ? Number(Math.round(n)).toLocaleString("ko-KR") + "원" : "-");
const _fnEok = (n) => (_fnOk(n) ? (Math.abs(n) >= 100000000 ? (n / 100000000).toFixed(2) + "억" : (n / 10000).toFixed(0) + "만") + "원" : "-");
const _fnPct = (n, d) => (_fnOk(n) ? n.toFixed(d == null ? 1 : d) + "%" : "-");

/* 엔진 스냅샷 — fbModel()이 없거나 실패하면 null(화면은 "-") */
function _foModel() { try { return typeof fbModel === "function" ? fbModel() : null; } catch (e) { return null; } }
function _foDays(cal) { const y = +String(cal).slice(0, 4), m = +String(cal).slice(5, 7); return (y && m) ? new Date(y, m, 0).getDate() : 30; }
/* 계획 A 누적 현금흐름(조달 전) 흑자 전환 월 — 저점 이후 cum ≥ 0이 되는 첫 달 */
function _foTurnCal(M) {
  if (!M || !M.cash || !M.cash.A || !M.runs || !M.runs.A) return null;
  const c = M.cash.A; const lo = M.runs.A.lowIdx == null ? 0 : M.runs.A.lowIdx;
  for (let j = lo + 1; j < c.cum.length; j++) if (c.cum[j] >= 0 && c.cal[j] && c.cal[j] !== "-") return c.cal[j];
  return null;
}
function _foMonthsBetween(fromDate, toCal) {
  if (!fromDate || !toCal) return null;
  return (+toCal.slice(0, 4) - +fromDate.slice(0, 4)) * 12 + (+toCal.slice(5, 7) - +fromDate.slice(5, 7));
}

/* 출수납 데이터 — 전부 fbModel().asOf 실적 원장에서 계산 */
function _foCashData(M) {
  const S = M && M.asOf; if (!S || !S.monthly || !S.monthly.actual) return null;
  const rows = S.monthly.actual;
  const asOfCal = S.date.slice(0, 7);
  const cur = rows.find((r) => r.cal === asOfCal);
  if (!cur) return null;
  const y = +asOfCal.slice(0, 4), mo = +asOfCal.slice(5, 7);
  const ym = (k) => { const d = new Date(y, mo - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const byCal = (cal) => rows.find((r) => r.cal === cal);
  // 최근 6개월(기준월 직전 6개 완결 월) 입금·출금
  const flow = [-6, -5, -4, -3, -2, -1].map((k) => byCal(ym(k))).filter(Boolean)
    .map((r) => ({ cal: r.cal, m: +r.cal.slice(5, 7) + "월", in: r.cf.inTot, out: r.cf.outTot }));
  const last3 = [-3, -2, -1].map((k) => byCal(ym(k))).filter(Boolean);
  const avg = (f) => (last3.length ? last3.reduce((s, r) => s + f(r), 0) / last3.length : 0);
  // 기준월 일별 흐름(월 실적 ÷ 월 일수) — 9월 행은 흐름 × frac이므로 되돌린다
  const part = cur.partial || 1; const dim = _foDays(asOfCal);
  const dayCf = (x) => (_fnOk(cur.cf[x]) ? cur.cf[x] / part / dim : 0);
  const dayPl = (x) => (_fnOk(cur.pl[x]) ? cur.pl[x] / part / dim : 0);
  const lag = (typeof FB_LEVERS !== "undefined" && FB_LEVERS.A && FB_LEVERS.A.lag) || {};
  const inCr = (key) => (lag[key] >= 1 ? "매출채권(전월 매출 회수)" : "매출");
  const inPl = (key) => (lag[key] >= 1 ? "" : "매출액");
  const IN = [
    ["inP", "P", "건강커머스 결제 수납", "제품매출"],
    ["inChk", "Chk", "건강검진 연계 정산 입금(자사·제휴사)", "검진수수료수익"],
    ["inIns", "Ins", "헬스메이트센터 사용료 입금", "헬스메이트센터사용료수익"],
    ["inCare", "Svc", "재가·돌봄 파트너 이용료 입금", "돌봄이용료수익"],
    ["inResv", "Resv", "예약 서비스 수수료 입금", "예약수수료수익"],
    ["inSub", "Sub", "AI 플랫폼 구독료 수납", "구독매출"],
  ];
  const cloud = dayPl("cloudBase") + dayPl("cloudVar") + dayPl("llm") + dayPl("bc");
  const OUT = [
    ["인건비 지급", dayCf("oPay"), "disb", "급여", "판매관리비"],
    ["매출원가 지급(제품·검진 연계·돌봄)", dayCf("oCogs"), "disb", "매출원가", "매출원가"],
    ["포인트 적립·기부금 지급", dayCf("oCust"), "disb", "포인트적립비·기부금", "판매관리비"],
    ["온라인 타겟 광고 매체비", dayCf("oMedia"), "opex", "광고선전비", "판매관리비"],
    ["마케팅 발송·소재·QR", dayCf("oMkt"), "opex", "광고선전비", "판매관리비"],
    ["메디에이지 리포트 구매", dayCf("oMedi"), "opex", "지급수수료", "판매관리비"],
    ["클라우드·LLM·블록체인", cloud, "opex", "전산운영비", "판매관리비"],
    ["IT 유지보수·데이터·보안·영업·관리비", Math.max(0, dayCf("oOpex") - cloud), "opex", "운영비", "판매관리비"],
    ["임차료", dayCf("oRent"), "disb", "임차료", "손익표 밖 지출"],
  ];
  const ACCT_KO = { recv: "수납일반", disb: "출납일반", opex: "사업비", master: "모계좌", invest: "투자용" };
  const txDays = [2, 1, 0].map((k) => { const d = +S.date.slice(8, 10) - k; return `${asOfCal}-${String(d).padStart(2, "0")}`; }).filter((d) => +d.slice(8, 10) >= 1);
  const tx = [];
  txDays.slice().reverse().forEach((day) => {
    IN.forEach(([k, lk, t, crRev]) => { const v = dayCf(k); if (v > 0.5) tx.push({ d: day.slice(5), t, amt: v, acctK: "recv", acct: ACCT_KO.recv, dr: "보통예금(수납)", cr: lag[lk] >= 1 ? inCr(lk) : crRev, pl: inPl(lk) }); });
    OUT.forEach(([t, v, ak, dr, pl]) => { if (v > 0.5) tx.push({ d: day.slice(5), t, amt: -v, acctK: ak, acct: ACCT_KO[ak], dr, cr: `보통예금(${ACCT_KO[ak]})`, pl }); });
  });
  const nDays = txDays.length;
  const inDay = IN.reduce((s, [k]) => s + dayCf(k), 0);
  const outBy = (ak) => OUT.filter((o) => o[2] === ak).reduce((s, o) => s + o[1], 0) * nDays;
  // 계좌 배분 규칙(코드) — 스윕 직전(기준월 거래 반영 후) 잔액
  const avgOut = avg((r) => r.cf.outTot);
  const RULE = {
    reserve: avgOut / _foDays(ym(-1)),                                                    // 수납 예비금 = 1일 평균 출금
    disbT: avg((r) => r.cf.oPay + r.cf.oCogs + r.cf.oCust + r.cf.oRent) / 2,             // 출납 목표 = 지급성 출금 보름치
    opexT: avg((r) => r.cf.oMedia + r.cf.oMkt + r.cf.oMedi + r.cf.oOpex),                 // 사업비 목표 = 사업비 출금 한 달치
  };
  const total = S.cash.actual.balance;
  let recv = inDay * nDays + RULE.reserve;
  let disb = Math.max(0, RULE.disbT - outBy("disb"));
  let opex = Math.max(0, RULE.opexT - outBy("opex"));
  const sub = recv + disb + opex;
  if (_fnOk(total) && sub > total) { const f = total > 0 ? total / sub : 0; recv *= f; disb *= f; opex *= f; }
  const bal = { master: Math.max(0, total - recv - disb - opex), recv, disb, opex, invest: 0 };
  // 월말 실적 현금 추이(스파크라인: 계좌 비중 × 전체 현금)
  const cashPath = [-6, -5, -4, -3, -2, -1].map((k) => byCal(ym(k))).filter(Boolean).map((r) => r.bs.cash).concat([total]);
  const revDay = dayPl("rev"), costDay = dayPl("cogs") + dayPl("sga");
  return { S, flow, tx, txDays, RULE, bal, total, cashPath, revRecog: revDay * nDays, costRecog: costDay * nDays, avgOut };
}

/* 작은 스파크라인(계좌 잔액 추이) */
function FinSpark({ pts, col }) {
  if (!pts || pts.length < 2 || !pts.every(_fnOk)) return null; const w = 120, h = 26; const mn = Math.min(...pts), mx = Math.max(...pts); const rg = (mx - mn) || 1;
  const X = (i) => i * w / (pts.length - 1), Y = (v) => h - 3 - (v - mn) / rg * (h - 6);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(" ");
  const area = d + `L${w},${h}L0,${h}Z`;
  return (<svg viewBox={`0 0 ${w} ${h}`} width="100%" height="26" preserveAspectRatio="none"><path d={area} fill={col + "22"} /><path d={d} fill="none" stroke={col} strokeWidth="1.6" /><circle cx={X(pts.length - 1)} cy={Y(pts[pts.length - 1])} r="2.4" fill={col} /></svg>);
}

/* 현금흐름 그래프(입금/출금 막대 + 순현금흐름 선) */
function FinFlowChart({ data }) {
  if (!data || !data.length) return <div className="finpl-note">실적 월 데이터가 없습니다.</div>;
  const w = 560, h = 190, pad = { l: 8, r: 8, t: 16, b: 26 };
  const nets = data.map((d) => d.in - d.out);
  const mx = Math.max(1, ...data.map((d) => Math.max(d.in, d.out)));
  const bw = (w - pad.l - pad.r) / data.length;
  const Y = (v) => h - pad.b - Math.max(0, Math.min(1, v / mx)) * (h - pad.t - pad.b);
  const netMx = Math.max(...nets), netMn = Math.min(...nets), nrg = (netMx - netMn) || 1;
  const NY = (v) => h - pad.b - (v - netMn) / nrg * (h - pad.t - pad.b) * 0.9 - 6;
  const cx = (i) => pad.l + bw * i + bw / 2;
  const netD = nets.map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${NY(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 640 }}>
      {data.map((d, i) => { const bx = pad.l + bw * i; const gw = bw * 0.28; return (
        <g key={i}>
          <rect x={bx + bw / 2 - gw - 2} y={Y(d.in)} width={gw} height={h - pad.b - Y(d.in)} rx="2" fill="#22C58A" />
          <rect x={bx + bw / 2 + 2} y={Y(d.out)} width={gw} height={h - pad.b - Y(d.out)} rx="2" fill="#F0776B" />
          <text x={cx(i)} y={h - 9} textAnchor="middle" fontSize="10" fill="#8FA1C0">{d.m}</text>
        </g>
      ); })}
      <path d={netD} fill="none" stroke="#38BDF8" strokeWidth="2" />
      {nets.map((v, i) => <g key={i}><circle cx={cx(i)} cy={NY(v)} r="3" fill="#38BDF8" /><text x={cx(i)} y={NY(v) - 7} textAnchor="middle" fontSize="9" fill="#7DD3FC">{v >= 0 ? "+" : ""}{(v / 100000000).toFixed(2)}억</text></g>)}
    </svg>
  );
}

const WOORI_ACCTS = [
  { id: "master", name: "모계좌 (통합자금)", no: "1002-756-482910", role: "자금 허브 · 스윕 기준 계좌(투자금 납입·잔여 운영자금)", col: "#0067AC", kind: "허브" },
  { id: "recv", name: "수납일반계좌", no: "1002-756-482912", role: "건강커머스·검진 연계 정산·헬스메이트센터 사용료·돌봄 이용료 수납", col: "#16A34A", kind: "수납" },
  { id: "disb", name: "출납일반계좌", no: "1002-756-482911", role: "인건비·매출원가·포인트 적립·기부·임차료 지급", col: "#EF4444", kind: "출납" },
  { id: "opex", name: "사업비계좌", no: "1002-756-482913", role: "온라인 광고 매체비·발송·메디에이지 리포트·IT 운영비", col: "#F59E0B", kind: "사업비" },
  { id: "invest", name: "투자용계좌", no: "1002-756-482914", role: "여유자금 운용 — 운용 개시 전(잔액 0)", col: "#7C3AED", kind: "투자" },
];

function AICashSystem() {
  const M = React.useMemo(() => _foModel(), []);
  const D = React.useMemo(() => _foCashData(M), [M]);
  const turnCal = React.useMemo(() => _foTurnCal(M), [M]);
  const [bal, setBal] = React.useState(() => (D ? { ...D.bal } : { master: 0, recv: 0, disb: 0, opex: 0, invest: 0 }));
  const [log, setLog] = React.useState([]);
  const total = Object.values(bal).reduce((s, v) => s + v, 0);
  const R = D ? D.RULE : { reserve: NaN, disbT: NaN, opexT: NaN };
  const recvSurplus = Math.max(0, bal.recv - R.reserve);
  const disbShort = Math.max(0, R.disbT - bal.disb);
  const opexShort = Math.max(0, R.opexT - bal.opex);
  const investOpen = !!(D && turnCal && D.S.date.slice(0, 7) >= turnCal);
  const sweep = () => {
    if (!D) return;
    const a = { ...bal }; const steps = [];
    const up = Math.max(0, a.recv - R.reserve); if (up > 0) { a.master += up; a.recv -= up; steps.push(`수납 → 모계좌 집금 ${_fnEok(up)}`); }
    const topup = (k, target, nm) => { const need = Math.max(0, target - a[k]); const give = Math.min(need, a.master); if (give > 0) { a[k] += give; a.master -= give; steps.push(`모계좌 → ${nm} 보충 ${_fnEok(give)}`); } };
    topup("disb", R.disbT, "출납"); topup("opex", R.opexT, "사업비");
    steps.push(investOpen ? "투자용 배분 — 운용 개시 조건 충족(잉여 현금 범위에서 별도 승인)" : `투자용 배분 없음 — 성장 투자 단계(계획 누적 현금흐름 흑자 전환 ${turnCal || "-"} 전)`);
    setBal(a); setLog(steps); if (typeof toast === "function") toast(investOpen ? "✅ AI 자금 스윕 실행 — 집금·운영 보충 완료" : "✅ AI 자금 스윕 실행 — 집금·운영 보충 완료(투자 배분 없음)");
  };
  const reset = () => { if (D) setBal({ ...D.bal }); setLog([]); };
  const recs = [];
  if (!D) recs.push({ c: "#F59E0B", t: "재무 엔진 데이터를 불러오지 못했습니다." });
  else {
    if (recvSurplus > 0) recs.push({ c: "#16A34A", t: `수납일반 잔액이 예비금(${_fnEok(R.reserve)} = 1일 평균 출금)을 초과 — 모계좌 집금 ${_fnEok(recvSurplus)} 권장` });
    if (disbShort > 0) recs.push({ c: "#EF4444", t: `출납일반이 목표잔액(${_fnEok(R.disbT)} = 지급성 출금 보름치) 미달 — ${_fnEok(disbShort)} 보충 권장` });
    if (opexShort > 0) recs.push({ c: "#F59E0B", t: `사업비계좌가 목표잔액(${_fnEok(R.opexT)} = 사업비 출금 한 달치) 미달 — ${_fnEok(opexShort)} 보충 권장` });
    if (!recvSurplus && !disbShort && !opexShort) recs.push({ c: "#16A34A", t: "모든 계좌가 목표 잔액을 충족합니다. 자금 배분 양호." });
    recs.push({ c: "#7C3AED", t: `투자용 계좌 배분 0원 — 자금 소진기(최근 3개월 평균 순유출 ${_fnEok(D.S.kpi.burn3m)}), 운용 개시는 계획 누적 현금흐름 흑자 전환(${turnCal || "-"}) 이후` });
  }
  const flow = D ? D.flow : [];
  const lastF = flow.length ? flow[flow.length - 1] : null;
  const monthNet = lastF ? lastF.in - lastF.out : NaN;
  const txs = D ? D.tx : [];
  const invPL = 0; const netEffect = D ? D.revRecog - D.costRecog + invPL : NaN;
  const cashPath = D ? D.cashPath : null;
  const spark = (id) => (cashPath && D.total ? cashPath.map((v) => v * (D.bal[id] || 0) / D.total) : null);

  return (
    <div>
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#062A47,#0F1B33)", borderColor: "#0067AC" }}>
        <span className="ontstore-ic" style={{ background: "#052033" }}><Landmark size={15} color="#4DA8E0" /></span>
        <div><b>AI 출수납 시스템 · 우리은행 데모계좌 5</b><p>수납·출납·사업비 자금을 <b>모계좌 중심으로 AI가 집금·배분(스윕)</b>하고, 모든 이체를 <b>K-IFRS 자동 분개</b>로 회계에 인식합니다. 기준일 {D ? D.S.date : "-"} 총 관리자금 <b style={{ color: "#7DD3FC" }}>{_fnEok(total)}</b> = 재무상태표 실적 현금 {_fnEok(D ? D.total : NaN)}(투자금 납입 {_fnEok(D ? D.S.kpi.capitalIn : NaN)} 포함).</p></div>
      </div>

      <div className="fbank-grid">
        {WOORI_ACCTS.map((a) => (
          <div className="fbank" key={a.id} style={{ borderTopColor: a.col }}>
            <div className="fbank-h"><span className="fbank-badge" style={{ background: a.col }}>{a.kind}</span><span className="fbank-wr">우리은행</span></div>
            <div className="fbank-nm">{a.name}</div>
            <div className="fbank-no">{a.no}</div>
            <div className="fbank-bal">{_fnWon(bal[a.id])}</div>
            {a.id !== "invest" ? <FinSpark pts={spark(a.id)} col={a.col} /> : <div style={{ height: 26 }} />}
            <div className="fbank-role">{a.role}</div>
          </div>
        ))}
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Bot size={15} color="#38BDF8" /> 계좌 배분 규칙 <span>· 실적 원장 최근 3개월 평균에서 계산</span></div>
        <div className="fpl-map">
          <div className="fpl-row"><span>수납일반 예비금</span><b>{_fnWon(R.reserve)}</b><em>1일 평균 출금 — 초과분은 모계좌 집금</em></div>
          <div className="fpl-row"><span>출납일반 목표</span><b>{_fnWon(R.disbT)}</b><em>인건비·매출원가·적립·기부·임차료 월평균의 절반(보름치)</em></div>
          <div className="fpl-row"><span>사업비 목표</span><b>{_fnWon(R.opexT)}</b><em>매체비·발송·메디에이지·IT 운영비 월평균(한 달치)</em></div>
          <div className="fpl-row"><span>투자용</span><b>0원</b><em>운용 개시 전 — 계획 누적 현금흐름 흑자 전환 {turnCal || "-"} 이후 잉여 현금</em></div>
          <div className="fpl-row total"><span>모계좌</span><b>{_fnWon(bal.master)}</b><em>= 실적 현금 − 수납·출납·사업비 잔액</em></div>
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><TrendingUp size={15} color="#38BDF8" /> 전체 계좌 현금흐름 추이 <span>· 최근 6개월({flow.length ? `${flow[0].cal}~${flow[flow.length - 1].cal}` : "-"}) 실적 입금·출금·순현금흐름</span></div>
        <div className="fflow-legend"><span><i style={{ background: "#22C58A" }} />입금(수납)</span><span><i style={{ background: "#F0776B" }} />출금(출납)</span><span><i style={{ background: "#38BDF8", borderRadius: 2 }} />순현금흐름</span></div>
        <FinFlowChart data={flow} />
        <div className="finpl-note">{lastF ? lastF.cal : "-"} 순현금흐름 <b style={{ color: monthNet >= 0 ? "#34D399" : "#F87171" }}>{monthNet >= 0 ? "+" : ""}{_fnEok(monthNet)}</b> — {monthNet >= 0 ? "입금(수납)이 출금(출납)을 상회합니다." : "출금(출납)이 입금(수납)을 상회하는 투자 집행 구간입니다(투자금 납입은 입금에서 제외, 조달 전 영업·투자 흐름)."}</div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Bot size={15} color="#34D399" /> AI 자금 관리 제안 <span>· 집금·배분 규칙</span></div>
        <div className="fcash-recs">{recs.map((r, i) => <div className="fcash-rec" key={i}><span style={{ background: r.c }} /> {r.t}</div>)}</div>
        <div className="fcash-acts"><button className="fcash-btn pri" onClick={sweep} disabled={!D}><RefreshCw size={13} /> AI 자금 스윕 실행</button><button className="fcash-btn" onClick={reset}>초기화</button></div>
        {log.length > 0 && <div className="fcash-log"><b>스윕 실행 내역</b>{log.map((s, i) => <div key={i}>· {s}</div>)}</div>}
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Receipt size={15} color="#F59E0B" /> 최근 출수납 · AI 자동 분개(K-IFRS) <span>· {D && D.txDays.length ? `${D.txDays[0]}~${D.txDays[D.txDays.length - 1]}` : "-"} 실적 일별 흐름(월 실적 ÷ 월 일수)</span></div>
        <div className="onttbl-wrap"><table className="onttbl fcash-tbl">
          <thead><tr><th>일자</th><th>적요</th><th>계좌</th><th className="r">금액</th><th>차변</th><th>대변</th><th>손익 연계</th></tr></thead>
          <tbody>{txs.map((t, i) => (
            <tr key={i}><td className="mono">{t.d}</td><td>{t.t}</td><td>{t.acct}</td>
              <td className="mono r" style={{ color: t.amt >= 0 ? "#34D399" : "#F87171" }}>{t.amt >= 0 ? "+" : "-"}{_fnWon(Math.abs(t.amt))}</td>
              <td className="fcash-dc">{t.dr}</td><td className="fcash-dc">{t.cr}</td>
              <td>{t.pl ? <span className="fcash-pl">{t.pl}</span> : <span className="fcash-none">대체(손익無)</span>}</td></tr>
          ))}
          {!txs.length && <tr><td colSpan={7} className="mono0" style={{ color: "#64748B" }}>-</td></tr>}</tbody>
        </table></div>
        <div className="finpl-note">입금 지연(회수 1개월) 매출은 발생 월에 매출채권으로 인식되고, 입금 시 매출채권이 회수됩니다(손익 영향 없음). 보증금·CAPEX 등 투자활동 출금은 현금흐름표에서 확인합니다.</div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><PieChart size={15} color="#A78BFA" /> 손익계산서(P&L) 자동 연계 <span>· 같은 {D ? D.txDays.length : 0}일 실적 발생 기준</span></div>
        <div className="fpl-map">
          <div className="fpl-row"><span>매출 인식</span><b style={{ color: "#34D399" }}>+{_fnWon(D ? D.revRecog : NaN)}</b><em>→ P&L 매출액</em></div>
          <div className="fpl-row"><span>매출원가·판관비 인식</span><b style={{ color: "#F87171" }}>-{_fnWon(D ? D.costRecog : NaN)}</b><em>→ P&L 매출원가·판매관리비</em></div>
          <div className="fpl-row"><span>투자 평가손익</span><b style={{ color: "#8FA1C0" }}>{_fnWon(invPL)}</b><em>보유 자산 없음 — 금융손익 {_fnWon(M && M.P ? M.P.interestYear : NaN)}</em></div>
          <div className="fpl-row"><span>계좌 간 이체</span><b style={{ color: "#8FA1C0" }}>0원</b><em>손익 영향 없음(보통예금 대체)</em></div>
          <div className="fpl-row total"><span>이번 반영 순효과(상각 전)</span><b style={{ color: netEffect >= 0 ? "#34D399" : "#F87171" }}>{netEffect >= 0 ? "+" : "-"}{_fnWon(Math.abs(netEffect))}</b><em>→ 당기순이익 반영</em></div>
        </div>
        <div className="finpl-note">출수납 거래는 <b>손익계산서(P&L) 탭의 실적</b>과 같은 원장에서 나옵니다. 수납은 매출(또는 매출채권 회수), 지급은 매출원가·판관비로 인식되며, 계좌 간 이체와 투자금 납입은 손익에 영향을 주지 않습니다.</div>
      </div>
      <div className="chnote" style={{ marginTop: 10 }}>※ 우리은행 데모계좌·계좌번호는 시연용 예시이며, 잔액·입출금은 재무 엔진 실적 원장(기준일 {D ? D.S.date : "-"})에서 계산한 값입니다. 실제 자금이체·펌뱅킹 연동은 은행 API 계약·전자금융 규제 준수를 전제로 합니다.</div>
    </div>
  );
}

/* ── AI 투자시스템 — 성장 투자 단계(여유자금 운용 없음) · 운용 개시 후 적용할 자산배분 ──
   ※ 운용 정책(형 확정 2026-09-17) — 운용 개시 후 적용할 목표 비중(40/30/10/20)과 원칙 속 수치
     (듀레이션 3~5년·단일종목 20% 상한·손절 -15%·코인 10% 상한). 재무 엔진·예산양식 밖의 운용 정책이라 여기서 단일 정의한다. */
const INV_CLASSES = [
  { k: "bond", name: "채권", col: "#0EA5E9", tgt: 40, principle: "원금보전·안정 수익. 국공채·우량 회사채(신용 A↑) 중심, 듀레이션 3~5년 관리, 만기보유 원칙." },
  { k: "equity", name: "주식", col: "#16A34A", tgt: 30, principle: "성장·배당. 헬스케어·핀테크 우량주 분산(단일종목 20% 상한), 손절 -15%·익절 분할 룰." },
  { k: "crypto", name: "코인", col: "#F59E0B", tgt: 10, principle: "고위험 소액. BTC·ETH 등 시총 상위 한정, 총자산 10% 상한, 변동성 대비 분할매수(DCA)." },
  { k: "alt", name: "기타투자(대체)", col: "#7C3AED", tgt: 20, principle: "리츠·인프라·사모 등 대체투자. 유동성·상관관계 분산, 장기 보유·현금흐름 중심." },
];
function AIInvestSystem() {
  const M = React.useMemo(() => _foModel(), []);
  const S = M && M.asOf;
  const turnCal = React.useMemo(() => _foTurnCal(M), [M]);
  const hold = {}; INV_CLASSES.forEach((a) => { hold[a.k] = { cost: 0, val: 0 }; });
  const totCost = INV_CLASSES.reduce((s, a) => s + hold[a.k].cost, 0);
  const totVal = INV_CLASSES.reduce((s, a) => s + hold[a.k].val, 0);
  const totPl = totVal - totCost; const totPct = totCost ? totPl / totCost * 100 : null;
  const tgtSum = INV_CLASSES.reduce((s, a) => s + a.tgt, 0);
  const asOfCal = S ? S.date.slice(0, 7) : null;
  const open = !!(turnCal && asOfCal && asOfCal >= turnCal);
  const monthsTo = _foMonthsBetween(asOfCal, turnCal);
  const cashA = M && M.cash && M.cash.A; const runA = M && M.runs && M.runs.A;
  const lowCal = cashA && runA ? cashA.cal[runA.lowIdx] : null;
  const interest = M && M.P ? M.P.interestYear : NaN;
  const stage = open ? "운용 개시 조건 충족 — 잉여 현금 범위에서 운용 검토" : `성장 투자 단계 — 여유자금 운용 없음(차입 없음·금융손익 ${_fnWon(interest)})`;
  const DIS = { opacity: 0.45, cursor: "not-allowed" };
  return (
    <div>
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#1A1030,#0F1B33)", borderColor: "#4A2A6B" }}>
        <span className="ontstore-ic" style={{ background: "#14091F" }}><TrendingUp size={15} color="#C4B5FD" /></span>
        <div><b>AI 투자시스템 · 채권·주식·코인·대체투자</b><p><b>{stage}</b>. 보유 평가액 <b style={{ color: "#C4B5FD" }}>{_fnWon(totVal)}</b> · 평가손익 <b style={{ color: "#8FA1C0" }}>{_fnWon(totPl)}</b>. 기준일 {S ? S.date : "-"} 실적 현금 {_fnEok(S ? S.cash.actual.balance : NaN)}은 사업 운영(런웨이)에 쓰이며 투자용 계좌로 배분하지 않습니다.</p></div>
      </div>

      <div className="ontkpis" style={{ gridTemplateColumns: "repeat(4,1fr)", marginTop: 12 }}>
        {[["보유 평가액", _fnWon(totVal), "#C4B5FD", "투자용 계좌 0원"],
          ["평가손익", _fnWon(totPl), "#8FA1C0", totPct == null ? "수익률 -" : "수익률 " + _fnPct(totPct)],
          ["계획 누적 현금흐름 저점", _fnEok(runA ? runA.low : NaN), "#F87171", `${lowCal || "-"} (조달 전, 계획 A)`],
          ["운용 개시 조건", turnCal || "-", "#34D399", monthsTo == null ? "-" : (monthsTo > 0 ? `기준일부터 약 ${monthsTo}개월 뒤` : "조건 충족")]].map(([k, v, c, sub], i) => (
          <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}<br /><span style={{ opacity: .7, fontSize: 10 }}>{sub}</span></div></div>
        ))}
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><ShieldCheck size={15} color="#34D399" /> 운용 개시 조건</div>
        <div className="fpl-map">
          <div className="fpl-row"><span>현재 단계</span><b style={{ color: open ? "#34D399" : "#F59E0B" }}>{open ? "운용 가능" : "성장 투자 단계"}</b><em>{stage}</em></div>
          <div className="fpl-row"><span>개시 조건</span><b>{turnCal || "-"}</b><em>계획 A 누적 현금흐름(조달 전)이 저점({lowCal || "-"}) 이후 흑자로 전환하는 월 — 그 이후 잉여 현금만 운용</em></div>
          <div className="fpl-row"><span>기준일 실적 누적 현금흐름(조달 전)</span><b style={{ color: "#F87171" }}>{_fnEok(S ? S.cash.actual.cumPreFunding : NaN)}</b><em>투자금 납입 {_fnEok(S ? S.kpi.capitalIn : NaN)}으로 충당 중</em></div>
          <div className="fpl-row total"><span>P&L 금융수익(투자 평가손익)</span><b>{_fnWon(totPl)}</b><em>보유 자산 없음 — 손익계산서에 금융손익 행 없음</em></div>
        </div>
      </div>

      <div className="ontgrid2" style={{ marginTop: 12 }}>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#22D3EE" /> 목표 자산배분 <span>· 운용 개시 후 적용</span></div>
          {INV_CLASSES.map((a) => <OntBar key={a.k} label={`${a.name} · 목표 ${a.tgt}%`} value={Math.max(0, Math.min(100, a.tgt))} max={100} color={a.col} sub="%" />)}
          <div className="finpl-note">목표 합계 {tgtSum}% · 현재 보유 없음 — 운용 개시({turnCal || "-"} 이후) 전까지 배분하지 않습니다.</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#F59E0B" /> 평가 · 손익분석</div>
          <div className="onttbl-wrap"><table className="onttbl finv-tbl">
            <thead><tr><th>자산</th><th className="r">취득원가</th><th className="r">평가액</th><th className="r">평가손익</th><th className="r">수익률</th></tr></thead>
            <tbody>{INV_CLASSES.map((a) => (
              <tr key={a.k}><td><span className="finv-dot" style={{ background: a.col }} />{a.name}</td>
                <td className="mono r">{_fnWon(hold[a.k].cost)}</td><td className="mono r">{_fnWon(hold[a.k].val)}</td>
                <td className="mono r">{_fnWon(hold[a.k].val - hold[a.k].cost)}</td><td className="mono r">-</td></tr>
            ))}
              <tr className="finv-total"><td>합계</td><td className="mono r">{_fnWon(totCost)}</td><td className="mono r">{_fnWon(totVal)}</td>
                <td className="mono r">{_fnWon(totPl)}</td><td className="mono r">{totPct == null ? "-" : _fnPct(totPct)}</td></tr>
            </tbody>
          </table></div>
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><RefreshCw size={15} color="#38BDF8" /> 리밸런싱 시뮬레이터 <span>· 운용 개시 후 적용(현재 비활성)</span></div>
        <div className="finv-rb" style={DIS}>{INV_CLASSES.map((a) => (
          <div className="finv-rbrow" key={a.k}>
            <div className="finv-rbn"><span className="finv-dot" style={{ background: a.col }} />{a.name}</div>
            <div className="finv-rbcur">현 -</div>
            <div className="finv-rbctl"><button disabled>−</button><b style={{ color: a.col }}>{a.tgt}%</b><button disabled>＋</button></div>
            <div className="finv-rbact" style={{ color: "#8FA1C0" }}>보유 없음</div>
          </div>
        ))}</div>
        <div className="fcash-acts"><button className="fcash-btn pri" disabled style={DIS}><RefreshCw size={13} /> 리밸런싱 실행</button></div>
        <div className="finpl-note" style={{ color: "#F59E0B" }}>운용 개시 후 적용 — 계획 누적 현금흐름 흑자 전환({turnCal || "-"}) 이후 잉여 현금이 생기면 목표 비중으로 배분·리밸런싱합니다.</div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><ShieldCheck size={15} color="#A78BFA" /> 자산군별 투자원칙 <span>· 운용 개시 후 적용</span></div>
        <div className="finv-prin">{INV_CLASSES.map((a) => (
          <div className="finv-pc" key={a.k} style={{ borderLeftColor: a.col }}>
            <div className="finv-ph"><span className="finv-dot" style={{ background: a.col }} />{a.name} <em>목표 {a.tgt}%</em></div>
            <div className="finv-pt">{a.principle}</div>
          </div>
        ))}</div>
      </div>
      <div className="chnote" style={{ marginTop: 8 }}>※ 목표 자산배분·자산군별 투자원칙은 <b>확정 운용 정책</b>으로, 운용 개시 조건 충족 후 잉여 현금에만 적용합니다(현재 보유 자산 없음). 실제 투자 집행·평가·손익 인식은 투자일임·자본시장법 등 규제 검토와 리스크 관리 정책을 전제로 하며, 특정 상품 매수 권유가 아닙니다.</div>
    </div>
  );
}
