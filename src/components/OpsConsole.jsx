/* ══════════ 운영 콘솔(OpsConsole) — 에이전트 메시 관제 (Phase G) ══════════
   관리자 전용(온톨로지 · 하네스 탭 안). 회원 화면이 아니다.

   ⚠️ 콘솔은 **관측이지 조작이 아니다.**
   응급 트리아지·가드 조항·이음말·게이트 기준은 화면에서 못 바꾼다(회색으로 존재만 보여준다).
   ⚠️ 원문·회원 식별자·원가는 표시하지 않는다. */

const OPS_TABS = [["live", "지금 상태"], ["safety", "가드 현황"], ["learn", "학습 루프"], ["review", "검수 큐"], ["config", "설정"]];
const OPS_WIN = [["today", "오늘"], ["week", "7일"], ["all", "전체"]];
const OPS_REVIEW_KEY = "hifin_ops_review";

/* 학습 루프 산출물은 파일이다 — 브라우저는 fetch로만 읽을 수 있고, 배포본에는 아예 없다(docs/는 gitignore).
   그래서 404를 에러로 보여주지 않고 "아직 없음"으로 안내한다. */
function useLearnFile(name) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    let on = true;
    fetch("./docs/hi_learn/" + name)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => on && setState({ loading: false, data: d }))
      .catch(() => on && setState({ loading: false, data: null }));
    return () => { on = false; };
  }, [name]);
  return state;
}

function OpsBar({ n, label, tone }) {
  return (
    <div className="opsbar">
      <span className="opsbar-l">{label}</span>
      <span className="opsbar-t" style={{ background: tone || "#2563EB" }} />
      <b>{Number(n).toLocaleString()}</b>
    </div>
  );
}

function OpsConsoleSection() {
  const [tab, setTab] = useState("live");
  const [win, setWin] = useState("week");
  const days = win === "today" ? 1 : win === "week" ? 7 : 0;
  const [tick, setTick] = useState(0);

  const live = React.useMemo(() => (typeof opsLive === "function" ? opsLive(days) : null), [days, tick]);
  const safety = React.useMemo(() => (typeof opsSafety === "function" ? opsSafety(days) : null), [days, tick]);
  const ledger = useLearnFile("ledger.json");
  const queueFile = useLearnFile("review-queue.json");
  const learn = React.useMemo(() => (typeof opsLearn === "function" ? opsLearn(ledger.data) : null), [ledger.data]);

  const T = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n || 8);
  const pct = (v) => (v == null ? "—" : (Math.round(v * 1000) / 10) + "%");

  return (
    <div style={{ marginTop: 14 }}>
      <div className="opshead">
        <div><b>운영 콘솔</b><span>에이전트 메시 관제 · 관리자 전용</span></div>
        <div className="opswin">{OPS_WIN.map(([k, t]) => (
          <button key={k} className={win === k ? "on" : ""} onClick={() => setWin(k)}>{t}</button>
        ))}<button onClick={() => setTick((x) => x + 1)}>새로고침</button></div>
      </div>

      <div className="opstabs">{OPS_TABS.map(([k, t]) => (
        <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t}</button>
      ))}</div>

      {/* ── ① 지금 상태 ── */}
      {tab === "live" && (live ? (
        <div className="opsgrid">
          <div className="opscard">
            <h4>신호 {live.total.toLocaleString()}건</h4>
            {live.total === 0
              ? <p className="opsnone">아직 신호가 없어요 — 하이와 대화하시면 여기에 쌓입니다.</p>
              : Object.entries(live.byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => <OpsBar key={k} label={k} n={v} />)}
          </div>
          <div className="opscard">
            <h4>담당별 라우팅</h4>
            {T(live.byAgent).length === 0 ? <p className="opsnone">데이터 없음</p>
              : T(live.byAgent).map(([k, v]) => <OpsBar key={k} label={typeof hiAgent === "function" ? hiAgent(k).badge : k} n={v} tone="#0E7490" />)}
          </div>
          <div className="opscard">
            <h4>비율</h4>
            <div className="opskpi"><div><b>{pct(live.rate.unanswered)}</b><span>답변불가</span></div>
              <div><b>{pct(live.rate.ensemble)}</b><span>협주 발동</span></div>
              <div><b>{pct(live.rate.miss)}</b><span>미매칭</span></div></div>
            <p className="opsnote">분모(라우팅)가 0이면 계산하지 않고 —로 표시해요.</p>
          </div>
          <div className="opscard">
            <h4>라우팅 근거</h4>
            {T(live.byReason, 6).length === 0 ? <p className="opsnone">데이터 없음</p>
              : T(live.byReason, 6).map(([k, v]) => <OpsBar key={k} label={k} n={v} tone="#7C3AED" />)}
          </div>
        </div>
      ) : <p className="opsnone">집계를 불러올 수 없어요.</p>)}

      {/* ── ② 가드 현황 ── */}
      {tab === "safety" && (safety ? (
        <div>
          <div className="opsalert">
            <div><b>{safety.emergency.urgent.toLocaleString()}</b><span>응급 안내 발동</span></div>
            <p>이 숫자가 0이 아니면 <b>회원이 위험했다는 뜻</b>이에요 — 건수보다 사례를 보셔야 해요.</p>
          </div>
          <div className="opscard" style={{ marginTop: 12 }}>
            <h4>조항별 위반 {safety.guardEvents.toLocaleString()}건</h4>
            {safety.rank.length === 0 ? <p className="opsnone">위반 없음</p> : (
              <table className="opstable"><thead><tr><th>조항</th><th>건수</th><th>최근 사례(정규화 문장)</th></tr></thead>
                <tbody>{safety.rank.map(([l, n]) => (
                  <tr key={l}><td><code>{l}</code></td><td>{n}</td>
                    <td className="opssample">{(safety.samples[l] || []).map((s, i) => <div key={i}>{typeof opsSafeText === "function" ? opsSafeText(s) : s}</div>)}</td></tr>
                ))}</tbody></table>
            )}
            <p className="opsnote">가드 조항은 <b>읽기 전용</b>이에요 — 코드에서만 변경하고 하네스를 통과해야 해요.</p>
          </div>
        </div>
      ) : <p className="opsnone">집계를 불러올 수 없어요.</p>)}

      {/* ── ③ 학습 루프 ── */}
      {tab === "learn" && (
        ledger.loading ? <p className="opsnone">불러오는 중…</p>
          : !learn || !learn.available ? (
            <div className="opscard"><h4>학습 루프 산출물 없음</h4>
              <p className="opsnone">{(learn && learn.hint) || "산출물이 없어요."}</p>
              <p className="opsnote">배포본에는 <code>docs/</code>가 포함되지 않아 항상 이렇게 보여요(정상).</p></div>
          ) : (
            <div>
              <div className="opskpi big">
                <div><b>{learn.runs}</b><span>게이트 회차</span></div>
                <div><b>{learn.promoted}</b><span>승격</span></div>
                <div><b>{learn.rolledBack}</b><span>롤백</span></div>
              </div>
              {learn.drops.length > 0 && <div className="opsalert warn"><p>⚠️ 하락 감지 — {learn.drops.map((d) => `${d.key} ${d.from} → ${d.to}`).join(" · ")}</p></div>}
              <div className="opscard" style={{ marginTop: 12 }}>
                <h4>회차별 추이</h4>
                <table className="opstable"><thead><tr><th>회차</th><th>판정</th>{learn.keys.map((k) => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>{learn.series.map((r) => (
                    <tr key={r.i}><td>{r.i}</td><td>{r.pass ? "승격" : `롤백(${r.failed})`}</td>
                      {learn.keys.map((k) => <td key={k}>{r.metrics[k] != null ? r.metrics[k] : "-"}</td>)}</tr>
                  ))}</tbody></table>
              </div>
            </div>
          )
      )}

      {/* ── ④ 검수 큐 ── */}
      {tab === "review" && <OpsReview file={queueFile} />}

      {/* ── ⑤ 설정 ── */}
      {tab === "config" && <OpsConfig onChange={() => setTick((x) => x + 1)} />}
    </div>
  );
}

/* ── 검수 큐 — 학습 루프가 사람에게 넘긴 일을 화면에서 처리한다 ── */
function OpsReview({ file }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (file.loading) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(OPS_REVIEW_KEY) || "null"); } catch (e) {}
    const base = (file.data && file.data.items) || [];
    /* 작업 중이던 내용이 있으면 그것을 우선한다(이탈해도 남는다) */
    setItems(saved && saved.length ? saved : base.map((x) => Object.assign({}, x)));
    setLoaded(true);
  }, [file.loading, file.data]);

  const save = (next) => { setItems(next); try { localStorage.setItem(OPS_REVIEW_KEY, JSON.stringify(next)); } catch (e) {} };
  const setAt = (i, patch) => save(items.map((x, j) => (j === i ? Object.assign({}, x, patch) : x)));
  const approved = items.filter((x) => x.status === "approved").length;

  const exportJson = () => {
    try {
      const payload = { note: "운영 콘솔에서 검수한 결과입니다. docs/hi_learn/review-queue.json 에 덮어쓴 뒤 promote를 돌리세요.", items: items };
      const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "review-queue.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      if (typeof toast === "function") toast("📥 내보냈어요 — docs/hi_learn/review-queue.json 에 덮어쓰고 promote를 돌리세요.");
    } catch (e) {}
  };

  if (file.loading || !loaded) return <p className="opsnone">불러오는 중…</p>;
  if (!items.length) return (
    <div className="opscard"><h4>검수 큐 없음</h4>
      <p className="opsnone">학습 루프가 아직 넘긴 일이 없어요 — <code>node scripts/learn/run.mjs</code>를 먼저 돌려 주세요.</p>
      <p className="opsnote">배포본에는 <code>docs/</code>가 포함되지 않아 항상 이렇게 보여요(정상).</p></div>
  );

  return (
    <div>
      <div className="opsreviewbar">
        <b>검수 큐 {items.length}건 · 승인 {approved}건</b>
        <button className="pri" onClick={exportJson}>승인분 내보내기(JSON)</button>
      </div>
      <p className="opsnote">답변 내용은 <b>자동 생성하지 않아요</b> — 의료·보험·표시광고 경계라서 사람이 확정해야 해요.</p>
      {items.slice(0, 40).map((it, i) => (
        <div className={`opsq ${it.status || "pending"}`} key={i}>
          <div className="opsq-h">
            <span className="opsq-n">{it.n}회</span>
            <span className="opsq-s">{it.signal}{(it.utypes || []).length ? " · " + it.utypes.join(",") : ""}</span>
            <span className="opsq-a">제안 담당 {it.suggestAgent}</span>
          </div>
          <div className="opsq-q">{it.qn}</div>
          <textarea placeholder="이 질문에 뭐라고 답해야 할까요? (사람이 확정합니다)"
            value={it.answer || ""} onChange={(e) => setAt(i, { answer: e.target.value })} />
          <div className="opsq-b">
            <button className={it.status === "approved" ? "on" : ""} onClick={() => setAt(i, { status: "approved" })} disabled={!it.answer}>승인</button>
            <button className={it.status === "hold" ? "on" : ""} onClick={() => setAt(i, { status: "hold" })}>보류</button>
            <button className={it.status === "reject" ? "on" : ""} onClick={() => setAt(i, { status: "reject" })}>기각</button>
            {!it.answer && <span className="opsq-hint">답변을 채워야 승인할 수 있어요</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 설정 — 조정 가능한 것만. 잠긴 것도 **보여준다**(숨기면 존재를 모른다) ── */
function OpsConfig({ onChange }) {
  const [, force] = useState(0);
  const spec = (typeof OPS_SPEC !== "undefined") ? OPS_SPEC : {};
  const locked = (typeof OPS_LOCKED !== "undefined") ? OPS_LOCKED : [];
  const [msg, setMsg] = useState(null);

  const change = (k, v) => {
    const r = (typeof opsSet === "function") ? opsSet(k, v) : { ok: false };
    setMsg(r.ok ? null : { k, m: r.msg || "변경할 수 없어요." });
    force((x) => x + 1);
    if (r.ok && onChange) onChange();
  };

  return (
    <div>
      <div className="opscard">
        <h4>조정 가능</h4>
        <table className="opstable cfg"><thead><tr><th>항목</th><th>현재</th><th>기본</th><th>범위</th><th></th></tr></thead>
          <tbody>{Object.entries(spec).map(([k, s]) => {
            const cur = (typeof opsGet === "function") ? opsGet(k) : s.def;
            const isDef = (typeof opsIsDefault === "function") ? opsIsDefault(k) : true;
            return (
              <tr key={k}>
                <td><b>{s.label}</b>{s.hint && <div className="opsnote">{s.hint}</div>}</td>
                <td>{s.type === "bool"
                  ? <button className={`opstoggle ${cur ? "on" : ""}`} onClick={() => change(k, !cur)}>{cur ? "켬" : "끔"}</button>
                  : <input type="number" value={cur} min={s.min} max={s.max}
                      onChange={(e) => change(k, e.target.value)} />}
                  {msg && msg.k === k && <div className="opsbad">{msg.m}</div>}</td>
                <td>{String(s.def)}{isDef && <span className="opsdef">기본</span>}</td>
                <td>{s.min != null ? `${s.min}~${s.max}` : "—"}</td>
                <td>{!isDef && <button onClick={() => { if (typeof opsReset === "function") opsReset(k); force((x) => x + 1); onChange && onChange(); }}>되돌리기</button>}</td>
              </tr>
            );
          })}</tbody></table>
      </div>

      <div className="opscard locked" style={{ marginTop: 12 }}>
        <h4>🔒 화면에서 바꿀 수 없는 값</h4>
        <p className="opsnote">안전을 UI 토글로 만들면 언젠가 꺼져요. 이 값들은 <b>코드에서만</b> 바꾸고 하네스를 통과해야 해요.</p>
        <table className="opstable"><thead><tr><th>대상</th><th>위치</th><th>이유</th></tr></thead>
          <tbody>{locked.map((l) => (
            <tr key={l.key}><td><b>{l.label}</b></td><td><code>{l.where}</code></td><td>{l.why}</td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
