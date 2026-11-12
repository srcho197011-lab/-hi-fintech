/* ══════════════ 주간회의 지면(CorpMeeting.jsx) · CorpOps Phase 7 (조성래님 지시 2026-11-11) ══════════════
   전사 지면이라 특정 팀 보드가 아니라 총괄운영의 네 번째 뷰로 둔다.

   이 화면이 지키는 것
     · 참석 인원은 **재직자만** 센다. 합류 전 책임자는 참석자가 아니라 **공석 목록**이다.
     · 확정자 자리가 빈 팀은 **확정 버튼 자체가 없다** — 확정자 없는 초안이 상류로 흘러가면 안 된다.
     · AI 보고는 **조회 가능한 팀만** 수치를 싣는다. 나머지는 「—」와 「원천 미연결」이다.
     · 회의 중 즉석 조회에는 **「미확정」 배지**가 붙는다.
     · 미종결 후속조치는 **이번 주 자료 맨 앞**에 선다.
     · 0건의 뜻을 나눠 적는다 — 종결 / 등록 경로 없음 / 나온 과제가 없음.
     · 화상 연결을 만들지 않는다. 외부 도구 링크를 등록만 한다. */

function CorpMeetingSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const [st, setSt] = React.useState(() => corpMtgRead());
  const [tab, setTab] = React.useState("meet");
  const [actor, setActor] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [draft, setDraft] = React.useState({ voice: "human", who: "", text: "" });
  const [task, setTask] = React.useState({ what: "", owner: "", due: "" });

  const week = React.useMemo(() => corpMtgWeek(now), [now && now.getTime()]);
  /* ── 다음 열람 시 생성 — 열었을 때 골격이 없으면 만든다. 스스로 돌지 않는다. ── */
  React.useEffect(() => {
    const r = corpMtgEnsure(st, week);
    if (r.made) { corpMtgWrite(r.st); setSt(r.st); }
  }, [week && week.key]);

  const save = (next, logKind, logWho, logWhat) => {
    const s2 = (logKind ? corpMtgLog(next, logKind, logWho, logWhat, week ? week.key : "") : next);
    corpMtgWrite(s2); setSt(Object.assign({}, s2));
  };
  const wk = corpMtgOf(st, week);
  const A = React.useMemo(() => corpMtgAttend(), []);
  const open = React.useMemo(() => corpMtgOpenTasks(st, week), [st, week && week.key]);
  const V = React.useMemo(() => corpMtgPass(st, now), [st, now && now.getTime()]);
  const mg = corpMtgCanMerge(wk);
  const sch = typeof CORP_SCHEDULE !== "undefined" ? CORP_SCHEDULE : { weekly: {}, work: {}, routines: [] };
  const inWork = corpInWork(now);
  const people = A.people.map((p) => p.name);

  const fix = (rep) => {
    const c = corpMtgCanFix(rep, actor);
    if (!c.ok) { setMsg({ bad: true, t: rep.sh + "팀 — " + c.why }); return; }
    const weeks = Object.assign({}, st.weeks);
    const w2 = Object.assign({}, weeks[week.key]);
    w2.reports = w2.reports.map((r) => (r.team === rep.team ? Object.assign({}, r, { st: "fixed", fixedBy: actor, fixedAt: week.key }) : r));
    weeks[week.key] = w2;
    save(Object.assign({}, st, { weeks: weeks }), "human", actor, rep.sh + "팀 주간보고 확정");
    setMsg({ bad: false, t: rep.sh + "팀 보고 확정 — " + actor });
  };
  const merge = () => {
    if (!mg.ok) { setMsg({ bad: true, t: mg.why }); return; }
    if (!actor) { setMsg({ bad: true, t: "통합 주체를 고르지 않았습니다" }); return; }
    const weeks = Object.assign({}, st.weeks);
    weeks[week.key] = Object.assign({}, weeks[week.key], { merged: true, mergedBy: actor });
    save(Object.assign({}, st, { weeks: weeks }), "ai", "나침반", "확정 보고 " + mg.done + "팀을 1부로 통합");
    setMsg({ bad: false, t: "통합 완료 — 확정 " + mg.done + "팀 · 공석 제외 " + mg.skip + "팀" });
  };
  const addMinute = () => {
    if (!draft.text.trim() || !draft.who.trim()) { setMsg({ bad: true, t: "발언 주체와 내용을 적어야 합니다" }); return; }
    const weeks = Object.assign({}, st.weeks);
    const w2 = Object.assign({}, weeks[week.key]);
    w2.minutes = (w2.minutes || []).concat([{ voice: draft.voice, who: draft.who.trim(), text: draft.text.trim() }]);
    weeks[week.key] = w2;
    save(Object.assign({}, st, { weeks: weeks }),
      draft.voice === "human" ? "human" : "ai", draft.who.trim(), "회의록 — " + CORP_MTG_VOICE[draft.voice].ko);
    setDraft({ voice: draft.voice, who: "", text: "" });
  };
  const addTask = () => {
    if (!task.what.trim() || !task.owner.trim()) { setMsg({ bad: true, t: "과제와 담당을 적어야 합니다" }); return; }
    const weeks = Object.assign({}, st.weeks);
    const w2 = Object.assign({}, weeks[week.key]);
    w2.tasks = (w2.tasks || []).concat([{ id: corpMtgTaskId(st), what: task.what.trim(), owner: task.owner.trim(), due: task.due, status: "open" }]);
    weeks[week.key] = w2;
    save(Object.assign({}, st, { weeks: weeks }), "human", actor || "—", "후속과제 등록 — " + task.what.trim());
    setTask({ what: "", owner: "", due: "" });
  };
  const closeTask = (fromKey, id) => {
    const weeks = Object.assign({}, st.weeks);
    const w2 = Object.assign({}, weeks[fromKey]);
    w2.tasks = (w2.tasks || []).map((t) => (t.id === id ? Object.assign({}, t, { status: "done" }) : t));
    weeks[fromKey] = w2;
    save(Object.assign({}, st, { weeks: weeks }), "human", actor || "—", "후속과제 종결 — " + id);
  };

  const TABS = [["meet", "회의"], ["rep", "팀 보고"], ["min", "회의록"], ["rt", "루틴 · 업무시간"], ["chk", "검산"]];
  const stPill = (s) => <span className={"wm-pill " + s}>{(CORP_MTG_ST[s] || {}).ko}</span>;

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl">
          <b>주간 업무회의</b>
          <span className="cl-sub">{sch.weekly.day} {sch.weekly.time} · {sch.weekly.mode}</span>
          {week && <span className={"wm-dday" + (week.live ? " live" : "")}>
            {week.live ? "진행 중" : (week.dday === 0 ? "오늘" : "D-" + week.dday)} · {week.key}</span>}
        </div>
        <div className="cl-ctl">
          <label>조작 주체
            <select value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">— 고르세요 —</option>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <span className={"wm-work" + (inWork.ok ? " on" : "")}>
            업무시간 {inWork.ok ? "안" : "밖 · " + inWork.why}</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>
            검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        이 지면은 <b>스스로 돌지 않습니다</b> — 백엔드가 없어 브라우저를 닫으면 아무것도 생성되지 않습니다.
        열었을 때 그 주차 자료가 없으면 그때 만듭니다.
        <span className="cl-warn2">
          AI 팀장이 만드는 것은 <b>조립이지 창작이 아닙니다</b>. 사내 조회 원천이 있는 팀은 회계팀 하나뿐이라,
          나머지 일곱 팀의 지표 자리는 「—」와 「원천 미연결」로 둡니다. 채우면 그게 지어낸 숫자입니다.
        </span>
      </div>

      <div className="cl-tabs">
        {TABS.map(([k, ko]) => (
          <button key={k} className={"cl-tab" + (k === tab ? " on" : "")} onClick={() => { setTab(k); setMsg(null); }}>{ko}</button>
        ))}
      </div>
      {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={() => setMsg(null)}>{msg.t}</div>}

      {/* ══ 회의 ══ */}
      {tab === "meet" && (
        <div className="cl-body">
          {/* 미종결 후속조치가 맨 앞에 선다 — 지난주 숙제가 이번 주 자료보다 먼저다 */}
          <div className="cl-sec">
            <div className="cl-h">지난 회의 후속조치 — 먼저 봅니다
              <span className={"cl-flag" + (open.length ? " bad" : "")}>{open.length}건 미종결</span></div>
            {open.length === 0 ? (
              <p className="cl-note">
                미종결 건이 <b>0건</b>입니다. 다만 0의 뜻이 셋이라 나눠 적습니다 —
                ⒜ 등록한 과제를 전부 종결했거나, ⒝ 지난 회의에서 과제가 나오지 않았거나,
                ⒞ <b>아직 지난 주차 자료가 없어서</b>입니다. 지금은 주로 ⒞입니다 — 이 지면이 이번 주에 처음 섰습니다.
              </p>
            ) : open.map((t) => (
              <div key={t.from + t.id} className="cl-open">
                <span className="wm-tag open">미종결</span>
                <b>{t.what}</b>
                <span className="wm-meta">담당 {t.owner}{t.due ? " · 기한 " + t.due : " · 기한 미정"} · {t.from} 회의</span>
                <button className="cl-go" onClick={() => closeTask(t.from, t.id)}>종결</button>
              </div>
            ))}
          </div>

          {/* 참석 — 자리와 사람을 구분한다 */}
          <div className="cl-sec">
            <div className="cl-h">참석
              <span className="cl-t">사람 {A.people.length}명 · AI 팀장 {A.agents.length}명</span></div>
            <div className="wm-att">
              {A.people.map((p) => (
                <div key={p.name} className="wm-p">
                  <span className="wm-pn">{p.name}</span><i>{p.title}</i>
                  <span className="wm-pt">{p.teams.join(" · ")}{p.teams.length > 1 && <em>겸임</em>}</span>
                </div>
              ))}
              {A.agents.map((a) => (
                <div key={a.ai} className="wm-a" style={{ "--tc": a.c }}>
                  {typeof CorpAvatar === "function" && <CorpAvatar ai={a.ai} size={30} title={a.ai} />}
                  <span className="wm-pn" style={{ color: a.c }}>{a.ai}</span>
                  <span className="corp-ai">AI</span><i>{a.sh}</i>
                </div>
              ))}
            </div>
            {A.vacant.length > 0 && (
              <div className="wm-vac">
                <span className="wm-tag vac">책임자 공석 {A.vacant.length}석</span>
                {A.vacant.map((v) => <span key={v.team} className="wm-vn">{v.sh} — {v.name} {v.title} <i>{v.joined}</i></span>)}
                <p className="cl-note">이 넷은 <b>참석자가 아닙니다</b> — 아직 합류 전입니다.
                  자리 수를 사람 수로 세면 인원을 부풀리게 되어, 그 팀 보고를 확정할 사람이 있는 것처럼 보입니다.</p>
              </div>
            )}
          </div>

          {/* 진행 순서 */}
          <div className="cl-sec">
            <div className="cl-h">진행 순서 <span className="cl-t">{sch.weekly.time}</span></div>
            <div className="wm-tl">
              {(sch.weekly.steps || []).map((s, i) => {
                const nextAt = (sch.weekly.steps[i + 1] || [])[0];
                return (
                  <div key={i} className="wm-step">
                    <span className="wm-at">{s[0]}{nextAt && <i>~{nextAt}</i>}</span>
                    <span className="wm-what">{s[1]}</span>
                    <span className="wm-who">{s[2]}</span>
                  </div>
                );
              })}
            </div>
            <p className="cl-note">팀별 보고는 10:08부터 각 4분 · 7차례라 10:36에 끝나고 <b>다음 단계가 10:45</b>입니다 —
              사이 9분은 질의·예비 시간입니다. 나침반은 전사 지표와 후속조치 점검에 따로 서므로 <b>AI 팀장 8명이 모두</b> 타임라인에 등장합니다.</p>
          </div>

          {/* 화상 접속 — 연결을 만들지 않고 링크만 등록한다 */}
          <div className="cl-sec">
            <div className="cl-h">화상 접속</div>
            <div className="wm-link">
              <input value={st.link} placeholder="외부 화상회의 도구 링크를 등록하세요"
                onChange={(e) => save(Object.assign({}, st, { link: e.target.value }))} />
              {st.link ? <a className="cl-go" href={st.link} target="_blank" rel="noreferrer">열기 →</a>
                : <span className="wm-none">미등록 — 「—」</span>}
            </div>
            <p className="cl-note">하이핀은 <b>화상 연결을 만들지 않습니다</b>. 회원 영상 상담 모듈은 회원 보호 장치(접촉 락 · 동의 게이트 · 녹화 없음)가
              걸려 있어 사내 회의에 끌어오면 직원을 막고, 회의 기록이 회원 접촉 집계에 섞입니다.
              외부 도구 링크를 등록하고 이 지면은 <b>참석 · 자료 · 진행 · 회의록</b>만 맡습니다.</p>
          </div>
        </div>
      )}

      {/* ══ 팀 보고 ══ */}
      {tab === "rep" && wk && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">통합 <span className="cl-t">{sch.weekly.day} 09:30 · 나침반</span>
              <span className={"cl-flag" + (wk.merged ? " on" : "")}>
                확정 {mg.done} / {mg.need}팀{mg.skip ? " · 공석 제외 " + mg.skip + "팀" : ""}</span></div>
            <button className={"cl-save" + (mg.ok && actor ? "" : " off")} onClick={merge}>
              {wk.merged ? "통합 완료" : (mg.ok ? "1부로 통합" : mg.why)}</button>
            <p className="cl-note">통합은 <b>확정된 보고만</b> 묶습니다. 확정자 자리가 빈 {mg.skip}팀은
              확정될 수 없으므로 분모에서 뺐습니다 — 뺀 사실을 여기 적습니다.</p>
          </div>

          {wk.reports.map((r) => {
            const c = corpMtgCanFix(r, actor);
            return (
              <div key={r.team} className="cl-sec">
                <div className="cl-h">{r.sh}팀 <span className="cl-t">{r.ai} · AI 팀장</span>
                  {stPill(r.st)}
                  {r.fixedBy && <span className="cl-t">확정 {r.fixedBy}</span>}</div>
                <div className="wm-scope">{r.scope}</div>
                {r.linked ? (
                  <table className="cl-tbl">
                    <tbody>
                      {r.metrics.map((m, i) => (
                        <tr key={i}><td>{m.k}</td><td className="n">{m.v}</td><td className="id">{m.src}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="wm-nosrc">
                    <span className="wm-tag none">원천 미연결</span>
                    이 팀에는 사내 조회 원천이 아직 없습니다 — 지표 자리를 <b>「—」</b>로 둡니다.
                    실데이터 반입(Phase 10) 뒤에 채워집니다.
                  </div>
                )}
                {r.pilot && <p className="cl-note">실린 수치는 <b>파일럿 전표</b>에서 나온 값입니다 — 회사의 실제 장부가 아닙니다.</p>}
                {r.head === 0 ? (
                  <p className="cl-note"><b>{r.own} 책임자가 합류 전입니다.</b> 확정할 사람이 없어
                    이 보고는 합류 전까지 초안으로 남습니다 — <b>확정 버튼을 두지 않았습니다.</b></p>
                ) : (
                  <button className={"cl-go" + (c.ok ? "" : " off")} title={c.why} onClick={() => fix(r)}>
                    {r.st === "fixed" ? "확정됨" : "책임자 확정"}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ 회의록 ══ */}
      {tab === "min" && wk && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">회의록 <span className="cl-t">{(wk.minutes || []).length}건</span></div>
            <div className="wm-form">
              <select value={draft.voice} onChange={(e) => setDraft(Object.assign({}, draft, { voice: e.target.value }))}>
                {Object.keys(CORP_MTG_VOICE).map((k) => <option key={k} value={k}>{CORP_MTG_VOICE[k].ko}</option>)}
              </select>
              <input value={draft.who} placeholder="발언 주체" onChange={(e) => setDraft(Object.assign({}, draft, { who: e.target.value }))} />
              <input className="g" value={draft.text} placeholder="내용" onChange={(e) => setDraft(Object.assign({}, draft, { text: e.target.value }))} />
              <button className="cl-go" onClick={addMinute}>기록</button>
            </div>
            <p className="cl-note">{CORP_MTG_VOICE[draft.voice].d}
              {draft.voice === "lookup" && <b> — 「미확정」 배지가 붙습니다.</b>}</p>
            {(wk.minutes || []).map((m, i) => (
              <div key={i} className="cl-open">
                <span className={"wm-tag v-" + m.voice}>{CORP_MTG_VOICE[m.voice].ko}</span>
                {CORP_MTG_VOICE[m.voice].tag && <span className="wm-tag unsure">{CORP_MTG_VOICE[m.voice].tag}</span>}
                <b>{m.who}</b><span className="wm-meta">{m.text}</span>
              </div>
            ))}
            {!(wk.minutes || []).length && <p className="cl-note">아직 기록이 없습니다 — 회의가 열리면 여기에 쌓입니다.</p>}
          </div>

          <div className="cl-sec">
            <div className="cl-h">후속과제 <span className="cl-t">{(wk.tasks || []).length}건</span></div>
            <div className="wm-form">
              <input className="g" value={task.what} placeholder="과제" onChange={(e) => setTask(Object.assign({}, task, { what: e.target.value }))} />
              <input value={task.owner} placeholder="담당" onChange={(e) => setTask(Object.assign({}, task, { owner: e.target.value }))} />
              <input type="date" value={task.due} onChange={(e) => setTask(Object.assign({}, task, { due: e.target.value }))} />
              <button className="cl-go" onClick={addTask}>등록</button>
            </div>
            {(wk.tasks || []).map((t) => (
              <div key={t.id} className="cl-open">
                <span className={"wm-tag " + (t.status === "done" ? "done" : "open")}>{t.status === "done" ? "종결" : "미종결"}</span>
                <b>{t.what}</b><span className="wm-meta">담당 {t.owner}{t.due ? " · 기한 " + t.due : " · 기한 미정"}</span>
                {t.status !== "done" && <button className="cl-go" onClick={() => closeTask(week.key, t.id)}>종결</button>}
              </div>
            ))}
            <p className="cl-note">미종결 과제는 <b>차주 자료 맨 앞</b>에 섭니다 — 지난주 숙제가 이번 주 보고보다 먼저입니다.</p>
          </div>

          <div className="cl-sec">
            <div className="cl-h">워크로그 <span className="cl-t">{(st.log || []).length}건 · AI와 사람을 구분합니다</span></div>
            {(st.log || []).slice().reverse().slice(0, 25).map((l, i) => (
              <div key={i} className="wm-log">
                <span className={"wm-tag " + (l.kind === "ai" ? "v-ai" : "v-human")}>{l.kind === "ai" ? "AI" : "사람"}</span>
                <b>{l.who}</b><span className="wm-meta">{l.what}</span><i>{l.at}</i>
              </div>
            ))}
            {!(st.log || []).length && <p className="cl-note">아직 기록이 없습니다.</p>}
          </div>
        </div>
      )}

      {/* ══ 루틴 · 업무시간 ══ */}
      {tab === "rt" && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">업무시간 <span className="cl-t">조성래님 확정 2026-11-11</span>
              <span className={"cl-flag" + (inWork.ok ? " on" : "")}>{inWork.ok ? "지금 업무시간 안" : "지금 업무시간 밖 — " + inWork.why}</span></div>
            <table className="cl-tbl">
              <tbody>
                <tr><td>근무</td><td className="n">{sch.work.from} ~ {sch.work.to}</td><td className="id">{sch.work.days}</td></tr>
                <tr><td>점심</td><td className="n">{sch.work.lunch}</td><td className="id">경보 올리지 않음</td></tr>
                <tr><td>다음 업무 개시</td><td className="n">{(function () {
                  const d = corpNextWorkStart(now); return d ? (d.getMonth() + 1) + "/" + d.getDate() + " " + sch.work.from : "—";
                })()}</td><td className="id">밖에서 생긴 경보를 모아 올립니다</td></tr>
                <tr><td>긴급 예외</td><td className="n">{CORP_WORK_URGENT.join(" · ")}</td><td className="id">보안 사고 · 응급은 시간 무관</td></tr>
              </tbody>
            </table>
          </div>

          <div className="cl-sec">
            <div className="cl-h">루틴 <span className="cl-t">{(sch.routines || []).length}종</span></div>
            <table className="cl-tbl">
              <thead><tr><th>루틴</th><th>AI</th><th>사람이 마무리</th><th>상태</th><th>다음</th></tr></thead>
              <tbody>
                {(sch.routines || []).map((r, i) => {
                  /* 은행 대사는 장부 상태(반입 기간)를 보아야 밀림을 알 수 있다 —
                     주간회의 상태만으로는 「사람이 올렸는가」를 셀 수 없다. */
                  const s = corpRoutineState(r, st, now, week, corpLedgerRead());
                  const f = (d) => d ? (d.getMonth() + 1) + "/" + d.getDate() + " " +
                    String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "—";
                  return (
                    <tr key={i}>
                      <td>{r.t}</td><td className="id">{r.ai}</td><td className="id">{r.human}</td>
                      <td><span className={"wm-pill rt-" + s.state}>{s.ko}</span></td>
                      <td className="n">{s.state === "rel" ? "배포 전" : f(s.next)}
                        {s.shifted && <i title="주말에 떨어져 다음 영업일로 미뤘습니다">주말 미룸</i>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="cl-note">「밀림」은 <b>생성 경로가 있는 루틴</b>이 그 주차 기한을 넘겼는데 생성물이 없을 때만 붙습니다.
              나머지 아홉은 밀린 것이 아니라 <b>아직 돌 수 있는 상태가 아닙니다</b> — 있지도 않은 실패를 빨갛게 칠하면
              나중에 진짜 밀렸을 때 아무도 보지 않습니다. 월 단위 루틴이 주말에 떨어지면 다음 영업일로 미루고 그 사실을 적습니다.</p>
          </div>
        </div>
      )}

      {/* ══ 검산 ══ */}
      {tab === "chk" && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">검산 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
            <table className="cl-tbl id">
              <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
              <tbody>
                {V.rows.map((r) => (
                  <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
                    <td>{r.ko}</td><td className="n">{r.n}건</td>
                    <td className="n">{r.got}</td><td className="n">{r.want}</td>
                    <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cl-note">검사 대상이 <b>0건이면 실패</b>로 셉니다. 표본이 없으면 어떤 단언도 참이 되기 때문입니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
