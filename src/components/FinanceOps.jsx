/* ====================== 재무회계 — AI 출수납 · AI 투자 ======================
   AI 출수납 시스템: 우리은행 데모계좌 5개(모계좌·출납일반·수납일반·사업비·투자용),
     AI 자금 스윕(집금·배분)·자동 분개(K-IFRS).
   AI 투자시스템: 채권·주식·코인·기타(대체) — 투자원칙·평가·손익분석.
   ⚠️ 시연용 데모. 실제 뱅킹·투자는 인가·계약·규제 검토를 전제로 한다. */

const _fnWon = (n) => Number(Math.round(n) || 0).toLocaleString("ko-KR") + "원";
const _fnEok = (n) => (n >= 100000000 ? (n / 100000000).toFixed(2) + "억" : (n / 10000).toFixed(0) + "만") + "원";

/* ── 우리은행 데모계좌(5) ── */
const WOORI_SEED = [
  { id: "master", name: "모계좌 (통합자금)", no: "1002-756-482910", role: "자금 허브 · 스윕 기준 계좌", bal: 846200000, col: "#0067AC", kind: "허브" },
  { id: "recv", name: "수납일반계좌", no: "1002-756-482912", role: "회원결제·입점수수료·EMR 사용료 수납", bal: 342800000, col: "#16A34A", kind: "수납" },
  { id: "disb", name: "출납일반계좌", no: "1002-756-482911", role: "거래처 결제·환급·급여 지급", bal: 118500000, col: "#EF4444", kind: "출납" },
  { id: "opex", name: "사업비계좌", no: "1002-756-482913", role: "마케팅·인프라·인건비 운영자금", bal: 96400000, col: "#F59E0B", kind: "사업비" },
  { id: "invest", name: "투자용계좌", no: "1002-756-482914", role: "채권·주식·코인·대체투자 집행", bal: 512000000, col: "#7C3AED", kind: "투자" },
];
const CASH_TX = [
  { d: "07-12", t: "회원 구독·검진 결제 수납", amt: 12800000, acct: "수납일반", dr: "보통예금(수납)", cr: "매출" },
  { d: "07-12", t: "EMR·UIP 사용료(제휴병원)", amt: 8400000, acct: "수납일반", dr: "보통예금(수납)", cr: "용역매출" },
  { d: "07-11", t: "거래처 제품대금 지급", amt: -6100000, acct: "출납일반", dr: "매입채무", cr: "보통예금(출납)" },
  { d: "07-11", t: "마케팅 광고비 집행", amt: -3200000, acct: "사업비", dr: "광고선전비", cr: "보통예금(사업비)" },
  { d: "07-10", t: "보험·치료비 적립금 환급", amt: -1500000, acct: "출납일반", dr: "적립금부채", cr: "보통예금(출납)" },
  { d: "07-10", t: "투자용 계좌 자금 이체", amt: 30000000, acct: "투자용", dr: "보통예금(투자)", cr: "보통예금(모계좌)" },
];

function AICashSystem() {
  const [bal, setBal] = React.useState(() => { const o = {}; WOORI_SEED.forEach((a) => o[a.id] = a.bal); return o; });
  const [log, setLog] = React.useState([]);
  const total = Object.values(bal).reduce((s, v) => s + v, 0);
  const RESERVE = 50000000, DISB_T = 150000000, OPEX_T = 120000000;
  const recvSurplus = Math.max(0, bal.recv - RESERVE);
  const disbShort = Math.max(0, DISB_T - bal.disb);
  const opexShort = Math.max(0, OPEX_T - bal.opex);
  const sweep = () => {
    const a = { ...bal }; const steps = [];
    const up = Math.max(0, a.recv - RESERVE); if (up > 0) { a.master += up; a.recv -= up; steps.push(`수납 → 모계좌 집금 ${_fnEok(up)}`); }
    const topup = (k, target, nm) => { const need = Math.max(0, target - a[k]); const give = Math.min(need, a.master); if (give > 0) { a[k] += give; a.master -= give; steps.push(`모계좌 → ${nm} 보충 ${_fnEok(give)}`); } };
    topup("disb", DISB_T, "출납"); topup("opex", OPEX_T, "사업비");
    const toInv = Math.round(a.master * 0.3); if (toInv > 0) { a.invest += toInv; a.master -= toInv; steps.push(`모계좌 → 투자용 배분 ${_fnEok(toInv)}(잉여 30%)`); }
    setBal(a); setLog(steps);
    if (typeof toast === "function") toast("✅ AI 자금 스윕 실행 — 집금·운영 보충·투자 배분 완료");
  };
  const reset = () => { const o = {}; WOORI_SEED.forEach((x) => o[x.id] = x.bal); setBal(o); setLog([]); };
  const recs = [];
  if (recvSurplus > 0) recs.push({ c: "#16A34A", t: `수납일반 잔액이 예비금(${_fnEok(RESERVE)})을 초과 — 모계좌 집금 ${_fnEok(recvSurplus)} 권장` });
  if (disbShort > 0) recs.push({ c: "#EF4444", t: `출납일반이 목표잔액(${_fnEok(DISB_T)}) 미달 — ${_fnEok(disbShort)} 보충 권장` });
  if (opexShort > 0) recs.push({ c: "#F59E0B", t: `사업비계좌가 목표잔액(${_fnEok(OPEX_T)}) 미달 — ${_fnEok(opexShort)} 보충 권장` });
  if (!recs.length) recs.push({ c: "#16A34A", t: "모든 계좌가 목표 잔액을 충족합니다. 자금 배분 양호." });

  return (
    <div>
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#062A47,#0F1B33)", borderColor: "#0067AC" }}>
        <span className="ontstore-ic" style={{ background: "#052033" }}><Landmark size={15} color="#4DA8E0" /></span>
        <div><b>AI 출수납 시스템 · 우리은행 데모계좌 5</b><p>수납·출납·사업비·투자용 자금을 <b>모계좌 중심으로 AI가 집금·배분(스윕)</b>하고, 모든 이체를 <b>K-IFRS 자동 분개</b>로 회계에 인식합니다. 총 관리자금 <b style={{ color: "#7DD3FC" }}>{_fnEok(total)}</b>.</p></div>
      </div>

      <div className="fbank-grid">
        {WOORI_SEED.map((a) => (
          <div className="fbank" key={a.id} style={{ borderTopColor: a.col }}>
            <div className="fbank-h"><span className="fbank-badge" style={{ background: a.col }}>{a.kind}</span><span className="fbank-wr">우리은행</span></div>
            <div className="fbank-nm">{a.name}</div>
            <div className="fbank-no">{a.no}</div>
            <div className="fbank-bal">{_fnWon(bal[a.id])}</div>
            <div className="fbank-role">{a.role}</div>
          </div>
        ))}
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Bot size={15} color="#34D399" /> AI 자금 관리 제안 <span>· 집금·배분 규칙</span></div>
        <div className="fcash-recs">{recs.map((r, i) => <div className="fcash-rec" key={i}><span style={{ background: r.c }} /> {r.t}</div>)}</div>
        <div className="fcash-acts">
          <button className="fcash-btn pri" onClick={sweep}><RefreshCw size={13} /> AI 자금 스윕 실행</button>
          <button className="fcash-btn" onClick={reset}>초기화</button>
        </div>
        {log.length > 0 && <div className="fcash-log"><b>스윕 실행 내역</b>{log.map((s, i) => <div key={i}>· {s}</div>)}</div>}
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><Receipt size={15} color="#F59E0B" /> 최근 출수납 · AI 자동 분개(K-IFRS)</div>
        <div className="onttbl-wrap"><table className="onttbl fcash-tbl">
          <thead><tr><th>일자</th><th>적요</th><th>계좌</th><th className="r">금액</th><th>차변</th><th>대변</th></tr></thead>
          <tbody>{CASH_TX.map((t, i) => (
            <tr key={i}><td className="mono">{t.d}</td><td>{t.t}</td><td>{t.acct}</td>
              <td className="mono r" style={{ color: t.amt >= 0 ? "#34D399" : "#F87171" }}>{t.amt >= 0 ? "+" : "-"}{_fnWon(Math.abs(t.amt))}</td>
              <td className="fcash-dc">{t.dr}</td><td className="fcash-dc">{t.cr}</td></tr>
          ))}</tbody>
        </table></div>
        <div className="finpl-note">수납은 매출·용역매출로, 출납은 매입채무·비용·부채 상계로 자동 인식됩니다. 계좌 간 이체는 손익 영향 없이 보통예금 계정 간 대체로 처리됩니다.</div>
      </div>
      <div className="chnote" style={{ marginTop: 10 }}>※ 우리은행 데모계좌·잔액·거래는 시연용 예시입니다. 실제 자금이체·펌뱅킹 연동은 은행 API 계약·전자금융 규제 준수를 전제로 합니다.</div>
    </div>
  );
}

/* ── AI 투자시스템 ── */
const INV_SEED = [
  { k: "bond", name: "채권", col: "#0EA5E9", cost: 200000000, val: 208400000, principle: "원금보전·안정 수익. 국공채·우량 회사채(신용 A↑) 중심, 듀레이션 3~5년 관리, 만기보유 원칙." },
  { k: "equity", name: "주식", col: "#16A34A", cost: 150000000, val: 167300000, principle: "성장·배당. 헬스케어·핀테크 우량주 분산(단일종목 20% 상한), 손절 -15%·익절 분할 룰." },
  { k: "crypto", name: "코인", col: "#F59E0B", cost: 50000000, val: 58900000, principle: "고위험 소액. BTC·ETH 등 시총 상위 한정, 총자산 10% 상한, 변동성 대비 분할매수(DCA)." },
  { k: "alt", name: "기타투자(대체)", col: "#7C3AED", cost: 100000000, val: 103100000, principle: "리츠·인프라·사모 등 대체투자. 유동성·상관관계 분산, 장기 보유·현금흐름 중심." },
];
function AIInvestSystem() {
  const totCost = INV_SEED.reduce((s, a) => s + a.cost, 0);
  const totVal = INV_SEED.reduce((s, a) => s + a.val, 0);
  const totPl = totVal - totCost;
  const totPct = totCost ? (totPl / totCost * 100) : 0;
  const grade = totPct >= 5 ? ["양호", "#16A34A"] : totPct >= 0 ? ["보통", "#F59E0B"] : ["주의", "#EF4444"];
  return (
    <div>
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#1A1030,#0F1B33)", borderColor: "#4A2A6B" }}>
        <span className="ontstore-ic" style={{ background: "#14091F" }}><TrendingUp size={15} color="#C4B5FD" /></span>
        <div><b>AI 투자시스템 · 채권·주식·코인·대체투자</b><p>투자용계좌 자금을 자산군별 <b>투자원칙</b>에 따라 배분하고, <b>평가·손익</b>을 실시간 분석합니다. 평가액 <b style={{ color: "#C4B5FD" }}>{_fnEok(totVal)}</b> · 평가손익 <b style={{ color: totPl >= 0 ? "#34D399" : "#F87171" }}>{totPl >= 0 ? "+" : ""}{_fnEok(totPl)}({totPct.toFixed(1)}%)</b>.</p></div>
      </div>

      <div className="ontgrid2" style={{ marginTop: 12 }}>
        <div className="ontpanel">
          <div className="ontph"><PieChart size={15} color="#22D3EE" /> 포트폴리오 배분 <span>· 평가액 기준</span></div>
          {INV_SEED.map((a) => <OntBar key={a.k} label={`${a.name} · ${(a.val / totVal * 100).toFixed(0)}%`} value={a.val} max={totVal} color={a.col} sub="원" />)}
          <div className="finpl-note">총 취득원가 {_fnEok(totCost)} · 총 평가액 {_fnEok(totVal)} · 종합 <b style={{ color: grade[1] }}>{grade[0]}</b></div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Landmark size={15} color="#F59E0B" /> 평가 · 손익분석</div>
          <div className="onttbl-wrap"><table className="onttbl finv-tbl">
            <thead><tr><th>자산</th><th className="r">취득원가</th><th className="r">평가액</th><th className="r">평가손익</th><th className="r">수익률</th></tr></thead>
            <tbody>{INV_SEED.map((a) => { const pl = a.val - a.cost, pct = a.cost ? pl / a.cost * 100 : 0; return (
              <tr key={a.k}><td><span className="finv-dot" style={{ background: a.col }} />{a.name}</td>
                <td className="mono r">{_fnEok(a.cost)}</td><td className="mono r">{_fnEok(a.val)}</td>
                <td className="mono r" style={{ color: pl >= 0 ? "#34D399" : "#F87171" }}>{pl >= 0 ? "+" : ""}{_fnEok(pl)}</td>
                <td className="mono r" style={{ color: pct >= 0 ? "#34D399" : "#F87171" }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</td></tr>
            ); })}
              <tr className="finv-total"><td>합계</td><td className="mono r">{_fnEok(totCost)}</td><td className="mono r">{_fnEok(totVal)}</td>
                <td className="mono r" style={{ color: totPl >= 0 ? "#34D399" : "#F87171" }}>{totPl >= 0 ? "+" : ""}{_fnEok(totPl)}</td>
                <td className="mono r" style={{ color: totPct >= 0 ? "#34D399" : "#F87171" }}>{totPct >= 0 ? "+" : ""}{totPct.toFixed(1)}%</td></tr>
            </tbody>
          </table></div>
        </div>
      </div>

      <div className="ontpanel" style={{ marginTop: 12 }}>
        <div className="ontph"><ShieldCheck size={15} color="#A78BFA" /> 자산군별 투자원칙</div>
        <div className="finv-prin">{INV_SEED.map((a) => (
          <div className="finv-pc" key={a.k} style={{ borderLeftColor: a.col }}>
            <div className="finv-ph"><span className="finv-dot" style={{ background: a.col }} />{a.name} <em>배분 {(a.val / totVal * 100).toFixed(0)}%</em></div>
            <div className="finv-pt">{a.principle}</div>
          </div>
        ))}</div>
      </div>
      <div className="chnote" style={{ marginTop: 10 }}>※ 투자 자산·평가·손익은 시연용 예시입니다. 실제 투자 집행·평가·손익 인식은 투자일임·자본시장법 등 규제 검토와 리스크 관리 정책을 전제로 하며, 특정 상품 매수 권유가 아닙니다.</div>
    </div>
  );
}
