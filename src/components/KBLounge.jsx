/* ====================== AI KB 라운지 (AI KB Lounge) — 지능형 지식베이스 운영 시스템 ======================
   데이터하우스 내 운영 콘솔(시연용). 건강·질병·검진·보험·건강소비·법률 지식을 수집·검증·구조화하고,
   부족 데이터를 탐색·확보전략까지 수립하는 지식 획득 엔진(Knowledge Acquisition Engine).
   ※ 수치는 결정적 시연 데이터이며, 토큰·보험·환급·기본소득 등은 확정 제도가 아닌 '검토 필요' 사업모델로 표기. */

const KB_STATS = [
  ["총 지식 항목", "12,840", "#22D3EE"], ["이번 주 신규 수집", "486", "#34D399"], ["승인 대기", "132", "#FBBF24"],
  ["전문가 검토 대기", "47", "#A78BFA"], ["최신성 경고", "68", "#F97316"], ["법률·약관 변경", "9", "#F472B6"],
];
const KB_DOMAINS = [
  { id: "checkup", name: "건강검진", ic: "Stethoscope", c: "#0EA5E9", count: 2140, subs: ["국가·암·특수검진", "항목별 정상범위", "수치별 위험구간", "재검·진료연계 기준"] },
  { id: "disease", name: "질환", ic: "HeartPulse", c: "#E11D48", count: 4760, subs: ["원인·위험요인·증상", "진단·검사 기준", "예방·생활·식이관리", "합병증·응급 기준"] },
  { id: "behavior", name: "건강행동", ic: "Activity", c: "#16A34A", count: 1980, subs: ["운동·식습관·수면", "금연·절주·체중", "복약·정기검진", "행동변화·리워드 효과"] },
  { id: "insurance", name: "보험·치료비", ic: "ShieldCheck", c: "#2563EB", count: 1520, subs: ["질병/상해/실손·임베디드", "지급조건·면책·한도", "청구절차·자기부담", "치료비 지원제도"] },
  { id: "commerce", name: "건강소비·자산", ic: "Coins", c: "#F59E0B", count: 1180, subs: ["영양제·식단·웰니스", "적립률·환급률·리워드", "건강자산 사용처", "보험료·기부 연계"] },
  { id: "legal", name: "법률·제도", ic: "Scale", c: "#A78BFA", count: 1260, subs: ["의료법·보험업법", "개인정보·신용정보법", "전자금융·가상자산", "마이데이터·규제샌드박스"] },
];
const KB_ENTRIES = [
  ["공복혈당 100~125mg/dL — 당뇨 전단계 관리 기준", "건강검진", "대한당뇨병학회", "2025-11", "A", "최신", "승인"],
  ["고혈압 진단 및 생활요법(DASH) 가이드", "질환", "대한고혈압학회", "2025-09", "A", "최신", "승인"],
  ["국가암검진 6대 암 대상·주기(2026)", "건강검진", "국립암센터", "2026-01", "A", "최신", "승인"],
  ["상해보험 후유장해 지급률·판정(180일) 해설", "보험·치료비", "보험 약관(학습)", "2026-01", "B", "최신", "검토중"],
  ["오메가3 EPA·DHA 혈중 중성지방 기능성", "건강소비·자산", "식약처 기능성 인정", "2025-07", "B", "검토요", "승인"],
  ["개인정보보호법 민감정보(건강정보) 처리 요건", "법률·제도", "국가법령정보센터", "2025-10", "A", "최신", "승인"],
  ["대사증후군 5대 진단기준·관리", "질환", "질병관리청", "2025-06", "A", "검토요", "대기"],
  ["가상자산이용자보호법 — 포인트/토큰 구분 검토", "법률·제도", "금융위원회", "2025-12", "B", "최신", "검토중"],
];
const KB_PIPELINE = ["수집", "출처 확인", "중복 제거", "요약", "신뢰도 평가", "위험도 분류", "관리자 검토", "전문가 검토", "승인", "KB 반영"];
const KB_ACQUIRE = [
  ["국가건강검진 통계·수검률", "국민건강보험공단", "공개(파일)", "공공데이터 다운로드", 5, 82],
  ["검진항목별 질병발생률·코호트", "질병관리청", "일부공개", "연구용 데이터 신청·공동연구", 5, 40],
  ["보험금 지급통계·손해율", "보험개발원", "제한", "협회 제휴·업무협약(MOU)", 4, 25],
  ["회원 검진결과(개인)", "검진기관·회원 본인", "동의기반", "마이데이터·PDF 업로드·EMR/FHIR", 5, 55],
  ["국민건강영양조사(KNHANES)", "질병관리청", "공개(API)", "Open API 연동", 4, 90],
  ["임상진료지침·논문", "학회·PubMed", "공개", "API·크롤러 수집", 3, 70],
  ["의약품 허가·기능성 원료", "식품의약품안전처", "공개(API)", "Open API 연동", 3, 65],
  ["사망원인·의료비 통계", "통계청(KOSIS)", "공개(API)", "Open API 연동", 3, 78],
];
const KB_AGENCIES = ["보건복지부", "질병관리청", "국민건강보험공단", "건강보험심사평가원", "국가통계포털(KOSIS)", "공공데이터포털", "식품의약품안전처", "국립암센터", "보험개발원", "생·손보협회", "금융위·금감원", "국가법령정보센터", "WHO", "CDC", "NIH", "PubMed"];
const KB_ANSWER = ["현재 건강상태", "주요 위험요인", "관리 우선순위", "오늘 해야 할 행동", "이번 주 건강목표", "의료기관 상담 필요 조건", "이용 가능한 지원제도", "답변 근거·출처", "주의사항"];
const KB_SAFETY = [["일반 건강정보", "#34D399"], ["예방관리 정보", "#0EA5E9"], ["의료기관 상담 권고", "#FBBF24"], ["즉시 진료 필요", "#F97316"], ["응급진료 필요", "#EF4444"]];

function _kbStars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

/* ③ 관리자 승인 워크플로 콘솔 (HITL) — 실제 상태 전환 */
function KBApprovalQueue() {
  const STAGES = (typeof KB_STAGES !== "undefined") ? KB_STAGES : ["수집", "자동검증", "관리자 검토", "전문가 검토", "승인"];
  const seed = (typeof KB_QUEUE !== "undefined") ? KB_QUEUE : [];
  const [items, setItems] = React.useState(() => seed.map((q) => ({ ...q, status: "검토대기" })));
  const [log, setLog] = React.useState([{ t: "초기 적재", m: `자동 수집 ${seed.length}건이 검증 큐에 등록됨` }]);
  const addLog = (m) => setLog((l) => [{ t: "방금", m }, ...l].slice(0, 30));
  const upd = (id, patch, logmsg) => { setItems((arr) => arr.map((it) => it.id === id ? { ...it, ...patch } : it)); if (logmsg) addLog(logmsg); };
  const approve = (it) => {
    if (it.flags.indexOf("전문가필요") >= 0 && it.stage < 3) { upd(it.id, { stage: 3 }, `[${it.id}] 위험도 높음 → 전문가 검토로 상향`); if (typeof toast === "function") toast("⚠️ 위험도 높음 — 전문가 검토가 필요합니다."); return; }
    if (it.stage >= STAGES.length - 1) return;
    const ns = it.stage + 1;
    if (ns >= STAGES.length - 1) { upd(it.id, { stage: ns, status: "승인" }, `[${it.id}] 최종 승인 → 지식 항목 브라우저에 반영`); if (typeof toast === "function") toast("✅ 승인 완료 — 지식 항목 브라우저에 반영되었습니다."); }
    else { upd(it.id, { stage: ns }, `[${it.id}] ${STAGES[it.stage]} 통과 → ${STAGES[ns]}`); if (typeof toast === "function") toast(`${STAGES[ns]} 단계로 이동`); }
  };
  const expert = (it) => { upd(it.id, { stage: 3 }, `[${it.id}] 전문가 검토 요청`); if (typeof toast === "function") toast("전문가 검토를 요청했습니다."); };
  const hold = (it) => { upd(it.id, { status: "보류" }, `[${it.id}] 보류 처리`); };
  const reject = (it) => { let r = ""; try { r = (typeof window !== "undefined" && window.prompt) ? (window.prompt("반려 사유를 입력하세요", "근거 부족·상충") || "") : "사유 미기재"; } catch (e) { r = "사유 미기재"; } upd(it.id, { status: "반려", reason: r }, `[${it.id}] 반려 — ${r || "사유 미기재"}`); if (typeof toast === "function") toast("반려 처리되었습니다."); };
  const restore = (it) => { upd(it.id, { status: "검토대기" }, `[${it.id}] 보류 해제 → 검토 재개`); };
  const pending = items.filter((i) => i.status === "검토대기");
  const held = items.filter((i) => i.status === "보류");
  const approved = items.filter((i) => i.status === "승인");
  const rejected = items.filter((i) => i.status === "반려");
  const flagCls = (f) => f === "법률변경" || f === "전문가필요" || f === "상충" ? "warn" : "info";
  const Stepper = ({ stage }) => (<div className="kbq-steps">{STAGES.map((s, i) => <React.Fragment key={s}><span className={"kbq-step" + (i < stage ? " done" : i === stage ? " cur" : "")}>{s}</span>{i < STAGES.length - 1 && <span className="kbq-sa">›</span>}</React.Fragment>)}</div>);
  const Card = ({ it }) => (
    <div className="kbq-card">
      <div className="kbq-hd"><b>{it.title}</b><span className={"kbbadge grade-" + it.grade}>{it.grade}</span><span className={"kbq-risk r-" + (it.risk === "높음" ? "hi" : it.risk === "보통" ? "mid" : "lo")}>위험 {it.risk}</span></div>
      <div className="kbq-meta">{it.domain} · {it.org} · {it.date} {it.flags.map((f) => <span key={f} className={"kbq-flag " + flagCls(f)}>{f}</span>)}</div>
      <Stepper stage={it.stage} />
      {it.status === "검토대기" && <div className="kbq-btns"><button className="ok" onClick={() => approve(it)}>승인</button><button onClick={() => expert(it)}>전문가 요청</button><button onClick={() => hold(it)}>보류</button><button className="no" onClick={() => reject(it)}>반려</button></div>}
      {it.status === "보류" && <div className="kbq-btns"><button onClick={() => restore(it)}>보류 해제</button><button className="no" onClick={() => reject(it)}>반려</button></div>}
      {it.status === "반려" && <div className="kbq-res">반려 사유: {it.reason || "사유 미기재"}</div>}
    </div>
  );
  return (
    <div>
      <div className="sgstats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="sgstat"><b style={{ color: "#FBBF24" }}>{pending.length}</b><span>검토 대기</span></div>
        <div className="sgstat"><b style={{ color: "#A78BFA" }}>{held.length}</b><span>보류</span></div>
        <div className="sgstat"><b style={{ color: "#34D399" }}>{approved.length}</b><span>승인(반영)</span></div>
        <div className="sgstat"><b style={{ color: "#F87171" }}>{rejected.length}</b><span>반려</span></div>
      </div>
      <div className="kbnote"><ShieldCheck size={12} /> <b>HITL(사람 개입) 승인</b> — 자동 수집 자료는 <b>관리자 검토 → 전문가 검토 → 승인</b>을 거쳐야 회원에게 공개됩니다. 위험도 높음(법률·상충)은 전문가 검토 필수.</div>
      {pending.length > 0 && <><div className="kbct" style={{ margin: "12px 0 8px" }}><Workflow size={13} /> 검토 대기 큐 ({pending.length})</div>{pending.map((it) => <Card key={it.id} it={it} />)}</>}
      {held.length > 0 && <><div className="kbct" style={{ margin: "14px 0 8px" }}>⏸ 보류 ({held.length})</div>{held.map((it) => <Card key={it.id} it={it} />)}</>}
      {(approved.length > 0 || rejected.length > 0) && <div className="kbgrid2" style={{ marginTop: 14 }}>
        <div className="kbcard"><div className="kbct" style={{ color: "#34D399" }}><Database size={13} /> 승인 완료 → 브라우저 반영 ({approved.length})</div>{approved.length ? approved.map((it) => <div className="kbq-mini ok" key={it.id}>✅ {it.title}</div>) : <div className="kbq-mini empty">아직 없음</div>}</div>
        <div className="kbcard"><div className="kbct" style={{ color: "#F87171" }}>✕ 반려 ({rejected.length})</div>{rejected.length ? rejected.map((it) => <div className="kbq-mini no" key={it.id}>✕ {it.title} <small>· {it.reason}</small></div>) : <div className="kbq-mini empty">아직 없음</div>}</div>
      </div>}
      <div className="kbcard" style={{ marginTop: 12 }}><div className="kbct"><ScrollText size={13} /> 검토·버전 이력 (Audit)</div><div className="kbq-log">{log.map((l, i) => <div key={i} className="kbq-logrow"><span className="kbq-logt">{l.t}</span> {l.m}</div>)}</div></div>
    </div>
  );
}
function AIKBLounge({ onGo }) {
  const [tab, setTab] = React.useState("dash");
  const [q, setQ] = React.useState("");
  const [dom, setDom] = React.useState("checkup");
  const CHK = (typeof KB_CHECKUP !== "undefined") ? KB_CHECKUP : [];
  const DIS = (typeof KB_DISEASE !== "undefined") ? KB_DISEASE : [];
  const INS = (typeof KB_INSURANCE !== "undefined") ? KB_INSURANCE : [];
  const LAW = (typeof KB_LEGAL !== "undefined") ? KB_LEGAL : [];
  const CHK_META = (typeof KB_CHECKUP_META !== "undefined") ? KB_CHECKUP_META : { count: CHK.length };
  const DOMS = [["checkup", "건강검진", CHK, "국가건강검진·5개 학회 기준 · 검토완료"], ["disease", "질환", DIS, "질병관리청·전문학회 진료지침 · 검토완료"], ["insurance", "보험·치료비", INS, "상해보험 약관·금융위 · 학습·검토"], ["legal", "법률·제도", LAW, "국가법령정보센터 · 규제 검토용"]];
  const activeDom = DOMS.find((d) => d[0] === dom) || DOMS[0];
  const _txt = (r) => Object.values(r).map((v) => Array.isArray(v) ? v.join(" ") : v).join(" ").toLowerCase();
  const domRows = q.trim() ? activeDom[2].filter((r) => _txt(r).includes(q.trim().toLowerCase())) : activeDom[2];
  const iconOf = (nm) => ({ Stethoscope, HeartPulse, Activity, ShieldCheck, Coins, Scale }[nm] || Database);
  const subTabs = [["dash", "현황 대시보드", Activity], ["onto", "지식 분류 온톨로지", Network], ["browse", "지식 항목 브라우저", Search], ["pipe", "수집·검증 워크플로", Workflow], ["approve", "승인 워크플로(HITL)", ShieldCheck], ["acq", "데이터 확보전략 AI", Route], ["rag", "AI 답변 근거(RAG)", Bot]];
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <div className="ontph"><Database size={15} color="#22D3EE" /> AI KB 라운지 <span>· 지능형 지식베이스 운영 시스템 · Knowledge Acquisition Engine</span></div>
      <p className="scdesc" style={{ marginTop: 6 }}>하이핀의 <b>건강검진 사후관리·질병예방·건강행동·치료비 지원·건강소비 환급·사회적 가치 환원</b>에 필요한 지식을 <b>수집·검증·구조화</b>하고, 부족 데이터를 <b>탐색·확보전략</b>까지 수립하는 AI 지식베이스입니다. <span style={{ color: "#FBBF24" }}>※ 토큰·보험료 지원·환급·기본소득 등은 확정 제도가 아닌 규제 검토가 필요한 사업모델로 구분합니다.</span></p>

      <div className="aitabs" style={{ margin: "12px 0" }}>{subTabs.map(([k, t, Ic]) => <div key={k} className={`aitab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={14} /> {t}</div>)}</div>

      {tab === "dash" && <>
        <div className="sgstats" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>{KB_STATS.map(([k, v, c], i) => <div className="sgstat" key={i}><b style={{ color: c }}>{v}</b><span>{k}</span></div>)}</div>
        <div className="kbgrid2" style={{ marginTop: 12 }}>
          <div className="kbcard"><div className="kbct"><TrendingUp size={13} /> 활용 빈도 상위 지식</div>
            {[["당뇨 전단계 식이·운동 관리", 3120], ["고혈압 생활요법(DASH)", 2740], ["암검진 대상·주기", 2210], ["후유장해 지급률 해설", 1680], ["오메가3 기능성", 1440]].map(([t, n], i) => <div className="kbrow" key={i}><span>{t}</span><OntBar value={n} max={3120} color="#22D3EE" /></div>)}
          </div>
          <div className="kbcard"><div className="kbct"><MessageSquare size={13} /> 회원 질문 상위 · 행동전환</div>
            {[["검진 결과 해석", "전환율 71%"], ["당뇨·혈당 관리", "68%"], ["보험 보장·청구", "63%"], ["체중·식단", "59%"], ["영양제 추천", "54%"]].map(([t, v], i) => <div className="kbrow2" key={i}><span>{t}</span><b>{v}</b></div>)}
          </div>
        </div>
        <div className="kbnote"><ShieldCheck size={12} /> AI 자동 수집 자료는 회원에게 바로 공개하지 않고 <b>출처확인→신뢰도평가→의료·법률 위험분류→관리자·전문가 검토→승인</b> 후 반영합니다.</div>
      </>}

      {tab === "onto" && <>
        <div className="kbdomains">{KB_DOMAINS.map((d) => { const Ic = iconOf(d.ic); return (
          <div className="kbdom" key={d.id} style={{ "--kc": d.c }}>
            <div className="kbdom-h"><span className="kbdom-i"><Ic size={16} /></span><b>{d.name}</b><span className="kbdom-n">{d.count.toLocaleString()}</span></div>
            <div className="kbdom-subs">{d.subs.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        ); })}</div>
        <div className="kbchain">
          <div className="kbct" style={{ marginBottom: 8 }}><Network size={13} /> 지식 연결(온톨로지) — 검진 이상수치 → 질환 → 행동 → 보험·자산 → 사후관리</div>
          <div className="kbchain-flow">{["공복혈당 상승", "당뇨 전단계", "비만·운동부족·식습관", "식단·운동 권고", "3개월 후 재검사", "필요시 내과 진료", "건강미션 생성", "건강행동 이행", "건강자산 적립", "보험·치료비 지원 확인"].map((s, i, a) => <React.Fragment key={i}><span className="kbchain-n">{s}</span>{i < a.length - 1 && <ChevronRight size={14} className="kbchain-a" />}</React.Fragment>)}</div>
        </div>
      </>}

      {tab === "browse" && <>
        <div className="kbdomsel">{DOMS.map(([k, t, arr]) => <button key={k} className={dom === k ? "on" : ""} onClick={() => setDom(k)}>{t} <em>{arr.length}</em></button>)}</div>
        <div className="kbload"><span className="kbload-ic"><Database size={15} /></span><div><b>{activeDom[1]} 지식 <span className="kbload-tag">실측 적재 {activeDom[2].length}건</span></b><p>{activeDom[3]} · <b>AI 주치의/설계사가 상담 근거로 인용</b>(② RAG)</p></div></div>
        <div className="kbsearch"><Search size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${activeDom[1]} 검색 (예: 혈당, 고혈압, 면책, 개인정보)`} /><span>{domRows.length}건</span></div>
        <div className="sctablewrap">
          {dom === "checkup" && <table className="sctable"><thead><tr><th>검진 항목</th><th>정상</th><th>주의</th><th>위험</th><th>임상적 의미</th><th>관련질환</th><th>출처</th><th>신뢰도</th></tr></thead>
            <tbody>{domRows.map((r) => <tr key={r.id}>
              <td style={{ fontWeight: 700, color: "#EAF2FF", whiteSpace: "nowrap" }}>{r.item}<small style={{ display: "block", color: "#7C8BA8", fontWeight: 500 }}>{r.unit}</small></td>
              <td style={{ color: "#34D399" }}>{r.normal}</td><td style={{ color: "#FBBF24" }}>{r.caution}</td><td style={{ color: "#F87171" }}>{r.danger}</td>
              <td style={{ maxWidth: 230, whiteSpace: "normal", color: "#CBD6EA" }}>{r.meaning}</td>
              <td style={{ whiteSpace: "nowrap" }}>{(r.related || []).map((d) => <span key={d} className="kbtag">{d}</span>)}</td>
              <td style={{ whiteSpace: "nowrap", fontSize: "10px" }}>{r.org}<small style={{ display: "block", color: "#7C8BA8" }}>{r.src} · {r.date}</small></td>
              <td><span className={"kbbadge grade-" + r.grade}>{r.grade}</span></td></tr>)}</tbody></table>}
          {dom === "disease" && <table className="sctable"><thead><tr><th>질환</th><th>정의</th><th>주요 위험요인</th><th>예방·관리</th><th>응급·진료 기준</th><th>출처</th><th>신뢰도</th></tr></thead>
            <tbody>{domRows.map((r) => <tr key={r.id}>
              <td style={{ fontWeight: 700, color: "#EAF2FF", whiteSpace: "nowrap" }}>{r.name}</td>
              <td style={{ maxWidth: 210, whiteSpace: "normal", color: "#CBD6EA" }}>{r.summary}</td>
              <td style={{ maxWidth: 160, whiteSpace: "normal", color: "#9FB2CE", fontSize: "10.5px" }}>{r.risk}</td>
              <td style={{ maxWidth: 180, whiteSpace: "normal", color: "#A7F3D0", fontSize: "10.5px" }}>{r.manage}</td>
              <td style={{ maxWidth: 180, whiteSpace: "normal", color: /🚨/.test(r.care) ? "#FCA5A5" : "#CBD6EA", fontSize: "10.5px" }}>{r.care}</td>
              <td style={{ whiteSpace: "nowrap", fontSize: "10px" }}>{r.org}<small style={{ display: "block", color: "#7C8BA8" }}>{r.src} · {r.date}</small></td>
              <td><span className={"kbbadge grade-" + r.grade}>{r.grade}</span></td></tr>)}</tbody></table>}
          {dom === "insurance" && <table className="sctable"><thead><tr><th>항목</th><th>요약</th><th>관련</th><th>출처</th><th>신뢰도</th></tr></thead>
            <tbody>{domRows.map((r) => <tr key={r.id}>
              <td style={{ fontWeight: 700, color: "#EAF2FF", whiteSpace: "nowrap" }}>{r.item}</td>
              <td style={{ maxWidth: 340, whiteSpace: "normal", color: "#CBD6EA" }}>{r.summary}</td>
              <td style={{ whiteSpace: "nowrap" }}>{(r.related || []).map((d) => <span key={d} className="kbtag">{d}</span>)}</td>
              <td style={{ whiteSpace: "nowrap", fontSize: "10px" }}>{r.org}<small style={{ display: "block", color: "#7C8BA8" }}>{r.src} · {r.date}</small></td>
              <td><span className={"kbbadge grade-" + r.grade}>{r.grade}</span></td></tr>)}</tbody></table>}
          {dom === "legal" && <table className="sctable"><thead><tr><th>법령</th><th>조문</th><th>요약</th><th>사업 검토사항</th><th>구분</th><th>신뢰도</th></tr></thead>
            <tbody>{domRows.map((r) => <tr key={r.id}>
              <td style={{ fontWeight: 700, color: "#EAF2FF", whiteSpace: "nowrap" }}>{r.law}</td>
              <td style={{ whiteSpace: "nowrap", color: "#9FB2CE", fontSize: "10.5px" }}>{r.article}</td>
              <td style={{ maxWidth: 240, whiteSpace: "normal", color: "#CBD6EA" }}>{r.summary}</td>
              <td style={{ maxWidth: 220, whiteSpace: "normal", color: "#FBBF24", fontSize: "10.5px" }}>{r.note}</td>
              <td><span className={"kbq-risk r-" + (r.risk === "필수" ? "hi" : r.risk === "기회" ? "lo" : "mid")}>{r.risk}</span></td>
              <td><span className={"kbbadge grade-" + r.grade}>{r.grade}</span></td></tr>)}</tbody></table>}
          {!domRows.length && <div style={{ textAlign: "center", color: "#8FA0BE", padding: "16px" }}>검색 결과가 없습니다.</div>}
        </div>
        <div className="kbnote"><Database size={12} /> 각 항목은 표준 스키마(출처·작성기관·발표일·신뢰도·관련·태그)로 저장되며, <b>AI 주치의/설계사</b>가 상담 근거로 인용합니다. <span style={{ color: "#FBBF24" }}>법률·제도는 사업모델의 규제 검토용이며 확정 해석이 아닙니다.</span></div>
      </>}

      {tab === "pipe" && <>
        <div className="kbct" style={{ marginBottom: 10 }}><Workflow size={13} /> 자동 수집 → 검증 → 승인 워크플로 (환각 방지 · 근거 중심)</div>
        <div className="kbpipe">{KB_PIPELINE.map((s, i, a) => <React.Fragment key={i}><div className="kbpipe-n"><span className="kbpipe-i">{i + 1}</span>{s}</div>{i < a.length - 1 && <span className="kbpipe-a">›</span>}</React.Fragment>)}</div>
        <div className="kbgrid2" style={{ marginTop: 14 }}>
          <div className="kbcard"><div className="kbct"><Search size={13} /> 자동화 소스</div><div className="kbchips">{["지정 웹사이트 정기수집", "RSS·API 연동", "공공데이터 연동", "논문·진료지침", "보험약관 변경 확인", "법령 개정 확인", "중복·상충 탐지", "버전 관리"].map((s) => <span key={s}>{s}</span>)}</div></div>
          <div className="kbcard"><div className="kbct"><ShieldCheck size={13} /> 의료·법률 안전 등급</div><div className="kbsafety">{KB_SAFETY.map(([t, c], i) => <div key={i}><span style={{ background: c }} />{t}</div>)}</div></div>
        </div>
      </>}

      {tab === "approve" && <KBApprovalQueue />}

      {tab === "acq" && <>
        <div className="kbct" style={{ marginBottom: 8 }}><Route size={13} /> 데이터 탐색·확보 전략 AI — "목표 달성에 무엇이 더 필요한가?"를 스스로 수행</div>
        <div className="sctablewrap"><table className="sctable"><thead><tr><th>필요 데이터</th><th>보유기관</th><th>공개/API</th><th>확보 방법</th><th>우선순위</th><th>진행률</th></tr></thead>
          <tbody>{KB_ACQUIRE.map((r, i) => <tr key={i}><td style={{ maxWidth: 200, whiteSpace: "normal" }}>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td style={{ maxWidth: 200, whiteSpace: "normal", color: "#93C5FD" }}>{r[3]}</td>
            <td style={{ color: "#FBBF24", letterSpacing: "1px" }}>{_kbStars(r[4])}</td>
            <td><div className="kbprog"><span style={{ width: r[5] + "%" }} />{r[5]}%</div></td></tr>)}</tbody></table></div>
        <div className="kbcard" style={{ marginTop: 12 }}><div className="kbct"><Building size={13} /> 자동 조사 대상 기관</div><div className="kbchips">{KB_AGENCIES.map((a) => <span key={a}>{a}</span>)}</div></div>
        <div className="kbnote"><Bot size={12} /> AI는 일방 진행이 아니라 <b>사용자와 공동 설계</b>합니다 — 예) "건보공단 검진데이터 직접 확보는 현실적으로 어렵습니다. ① 검진기관 제휴 ② 마이데이터 ③ PDF 업로드 ④ EMR 연계 중 어디로 추진할까요?" 각 방안의 난이도·비용·기간·법률·개인정보 이슈를 함께 분석합니다.</div>
        <div className="scactbtns" style={{ marginTop: 10 }}><button className="scactbtn" onClick={() => onGo && onGo("checkup")}>검진 연계 설계</button><button className="scactbtn" onClick={() => onGo && onGo("ai")}>AI 주치의 연동</button><button className="scactbtn">확보 로드맵 내보내기</button></div>
      </>}

      {tab === "rag" && <>
        <div className="kbgrid2">
          <div className="kbcard"><div className="kbct"><Bot size={13} /> AI 답변 표준 형식 (출처·근거 필수)</div><ol className="kbol">{KB_ANSWER.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
          <div className="kbcard"><div className="kbct"><Fingerprint size={13} /> 근거·검증 원칙</div>
            <ul className="kbul">
              <li>모든 추천은 <b>왜 필요한지·어떤 데이터 근거·기대효과·주의사항·병원 방문 시점</b>을 함께 제시</li>
              <li>출처 없는 답변·근거 불충분 추천은 <b>제한</b>(RAG 원문 링크 연결)</li>
              <li>확정적 진단·치료효과·보험금 지급 보장 <b>금지</b> → "전문가·기관 검토 필요"로 표기</li>
              <li>개인 건강정보와 일반 지식베이스는 <b>논리·물리적으로 분리</b> 저장</li>
            </ul>
          </div>
        </div>
        <div className="kbnote"><Scale size={12} /> 의료적 진단·치료효과·보험금 지급·보험료 지원·토큰 금융가치·정부 승인·AI 기본소득 실현은 <b>사실로 확정하지 않으며</b>, 의료·보험·법률·금융당국 검토가 필요한 항목으로 표시합니다.</div>
      </>}
    </div>
  );
}
