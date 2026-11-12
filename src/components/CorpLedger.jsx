/* ══════════════ 재무현황 — 실적 축 화면(CorpLedger.jsx) · CorpOps Phase 5 (형 지시 2026-11-11) ══════════════
   회계팀(M2)의 첫 지면. 장부를 **보여주는** 것이 아니라 **쓰는** 자리다.

   이 화면이 지키는 것
     · 차대가 안 맞으면 저장 버튼이 아니라 사유가 뜬다(corpJvCheck 가 거부한다).
     · 승인 버튼은 사람 주체에서만, 그리고 작성자가 아닐 때만 눌린다(corpJvCanAdvance).
     · 전기된 전표에는 수정 버튼이 없다 — 역분개뿐이다.
     · 숫자는 전부 전표에서 나온다. 화면이 따로 더하지 않는다.
     · 검산은 러너와 같은 함수(corpLedgerIdentities)를 부른다.

   ⚠️ 서버가 없다. 권한은 브라우저에서만 걸린다 — 화면에 그렇게 적는다. 숨기면 더 위험하다. */

function CorpLedgerSection() {
  const [tab, setTab] = React.useState("sum");
  const [st, setSt] = React.useState(() => (typeof corpLedgerRead === "function" ? corpLedgerRead() : { jv: [], closed: [], ov: {} }));
  const [actor, setActor] = React.useState("조성래");
  const [upto, setUpto] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [acctSel, setAcctSel] = React.useState("103");
  const [form, setForm] = React.useState(null);

  const save = React.useCallback((next) => { corpLedgerWrite(next); setSt(Object.assign({}, next)); }, []);
  const jvs = React.useMemo(() => corpJvAll(st), [st]);
  const upMax = React.useMemo(() => jvs.reduce((s, j) => (j.d > s ? j.d : s), ""), [jvs]);
  const cut = upto || "";
  /* 은행줄은 **반입분이 있으면 그것**, 실제 전표만 들어왔고 은행이 없으면 null(대사 보류).
     여기서 파일럿 내역을 쓰면 반입 전표 전건이 미대사로 뜬다. */
  const live = corpJvLive(st);
  const BK = React.useMemo(() => corpBankOf(st), [st]);
  const V = React.useMemo(() => corpLedgerVerdict(jvs, BK, cut), [jvs, BK, cut]);
  const S = React.useMemo(() => corpStatements(jvs, cut), [jvs, cut]);
  const R = React.useMemo(() => corpBankRecon(jvs, BK, cut), [jvs, BK, cut]);
  const months = React.useMemo(() => corpJvMonths(jvs), [jvs]);
  const A = corpActor(actor);

  /* 상태 전이 — 왜 안 되는지를 그대로 보여 준다 */
  const advance = (jv) => {
    const c = corpJvCanAdvance(jv, actor);
    if (!c.ok) { setMsg({ bad: true, t: jv.id + " — " + c.why }); return; }
    const ov = Object.assign({}, st.ov);
    ov[jv.id] = { st: c.to, ap: c.to === "posted" ? actor : (jv.ap || null) };
    save(Object.assign({}, st, { ov: ov }));
    setMsg({ bad: false, t: jv.id + " → " + CORP_JV_ST[c.to].ko + (c.to === "posted" ? " · 승인자 " + actor : "") });
  };
  const reverse = (jv) => {
    const r = corpJvReverse(jv, actor, upMax || jv.d);
    setForm({ d: r.d, desc: r.desc, rev: r.rev, l: r.l.map(x => [x[0], String(x[1] || ""), String(x[2] || ""), x[3] || ""]) });
    setTab("jv"); setMsg({ bad: false, t: jv.id + " 역분개 초안을 만들었습니다 — 저장하면 기표 상태로 들어갑니다" });
  };
  const closeMonth = (mo) => {
    const closed = (st.closed || []).slice();
    const i = closed.indexOf(mo);
    if (i >= 0) { setMsg({ bad: true, t: mo + " 은 이미 마감되었습니다 — 마감은 되돌리지 않습니다. 정정은 역분개로 합니다" }); return; }
    if (!A.canApprove) { setMsg({ bad: true, t: A.ko + "은(는) 마감을 확정하지 못합니다 — 마감 확정은 사람이 합니다" }); return; }
    closed.push(mo);
    save(Object.assign({}, st, { closed: closed }));
    setMsg({ bad: false, t: mo + " 마감 — 이 달에는 신규 전표가 들어가지 않습니다" });
  };

  const TABS = [["sum", "검산"], ["jv", "전표"], ["gl", "원장"], ["tb", "시산표"], ["fs", "재무제표"], ["bank", "은행 대사"]];

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl">
          <b>재무현황</b><span className="cl-sub">실적 축 — 실제로 일어난 거래</span>
          {CORP_LEDGER_PILOT && !live && <span className="cl-pilot">파일럿 전표</span>}
          {live && <span className="cl-live">반입 전표 {jvs.length}건</span>}
        </div>
        <div className="cl-ctl">
          <label>조작 주체
            <select value={actor} onChange={e => setActor(e.target.value)}>
              {CORP_ACTORS.map(a => <option key={a.id} value={a.id}>{a.ko} · {a.role}</option>)}
            </select>
          </label>
          <label>기준일
            <select value={upto} onChange={e => setUpto(e.target.value)}>
              <option value="">전 기간</option>
              {/* 없는 날짜를 만들지 않는다 — 9월 31일은 없다. 예실 축과 같은 함수로 월말을 센다. */}
              {months.map(m => <option key={m} value={corpPaCut(m)}>{m} 말</option>)}
            </select>
          </label>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>
            검산 {V.rows.length - V.fail.length - V.zero.length - V.skip.length} / {V.rows.length - V.skip.length}
            {V.skip.length > 0 && <i> · 보류 {V.skip.length}</i>}
          </span>
        </div>
      </div>

      {CORP_LEDGER_PILOT && !live && (
        <div className="cl-warn">
          여기 실린 전표 {CORP_JV_SEED.length}건은 <b>파일럿 전표</b>입니다 — 엔진이 맞게 도는지 보려고 넣은 검증용 묶음이고
          회사의 실제 장부가 아닙니다. 실제 회계자료 반입은 Phase 10이며 보안 선행(Phase 0)을 통과한 뒤에 시작합니다.
          <span className="cl-warn2">서버가 없어 권한은 이 브라우저 안에서만 걸립니다. 형이 넣은 전표도 이 브라우저에만 남습니다.</span>
        </div>
      )}
      {live && (
        <div className="cl-warn ok">
          <b>반입된 실제 전표</b>를 보고 있습니다 — 파일럿 전표는 빠졌습니다.
          <span className="cl-warn2">이 장부는 <b>이 브라우저에만</b> 있습니다(공개 배포본에 회사 숫자를 싣지 않기 위해서입니다).
            다른 기기 · 다른 브라우저에서는 다시 반입해야 보입니다.</span>
        </div>
      )}

      <div className="cl-tabs">
        {TABS.map(([k, ko]) => (
          <button key={k} className={"cl-tab" + (k === tab ? " on" : "")} onClick={() => { setTab(k); setMsg(null); }}>{ko}</button>
        ))}
      </div>

      {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={() => setMsg(null)}>{msg.t}</div>}

      {tab === "sum" && <ClSummary V={V} S={S} R={R} jvs={jvs} st={st} months={months} onClose={closeMonth} actor={A} />}
      {tab === "jv" && <ClJournal jvs={jvs} st={st} save={save} actor={actor} A={A} form={form} setForm={setForm}
        advance={advance} reverse={reverse} setMsg={setMsg} upMax={upMax} />}
      {tab === "gl" && <ClLedger S={S} sel={acctSel} setSel={setAcctSel} />}
      {tab === "tb" && <ClTrial S={S} />}
      {tab === "fs" && <ClStatements S={S} cut={cut} />}
      {tab === "bank" && <ClBank R={R} st={st} save={save} actor={actor} A={A} />}
    </div>
  );
}

/* ── 검산 ─────────────────────────────────────────────────────────────────── */
function ClSummary({ V, S, R, jvs, st, months, onClose, actor }) {
  const cnt = (s) => jvs.filter(j => j.st === s).length;
  return (
    <div className="cl-body">
      <div className="cl-kpis">
        <div><b>{corpWon(S.pl.rev)}</b><span>수익</span></div>
        <div><b>{corpWon(S.pl.exp)}</b><span>비용</span></div>
        <div className={S.pl.net >= 0 ? "" : "neg"}><b>{corpWon(S.pl.net)}</b><span>당기손익</span></div>
        <div><b>{corpWon(S.bs.assets)}</b><span>자산 총계</span></div>
        <div><b>{corpWon(R.bookBal)}</b><span>보통예금 장부</span></div>
        <div className={R.none ? "hold" : (R.ok ? "" : "neg")}>
          <b>{R.none ? "—" : R.bankOnly.length + R.bookOnly.length}</b>
          <span>{R.none ? "미대사 (내역 미반입)" : "미대사"}</span></div>
      </div>

      <div className="cl-sec">
        <div className="cl-h">항등식 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
        <table className="cl-tbl id">
          <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
          <tbody>
            {V.rows.map(r => (
              <tr key={r.k} className={r.skip ? "hold" : (r.ok && r.n > 0 ? "" : "bad")}>
                <td>{r.ko}</td>
                <td className="n">{r.n}건</td>
                <td className="n">{r.got}</td>
                <td className="n">{r.want}</td>
                <td className="st">{r.skip ? "보류" : (!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cl-note">검사 대상이 <b>0건이면 실패</b>로 셉니다. 빈 장부는 어떤 항등식도 통과시키기 때문입니다.</p>
        {V.skip.map(r => (
          <p key={r.k} className="cl-note hold"><b>보류 — {r.ko}</b> · {r.why}.
            <span> 보류는 통과가 아닙니다. 상대 자료가 들어오면 그때 돌립니다.</span></p>
        ))}
      </div>

      <div className="cl-grid2">
        <div className="cl-sec">
          <div className="cl-h">결재 상태</div>
          <div className="cl-stat">
            <div><b>{cnt("draft")}</b><span>기표</span></div>
            <div><b>{cnt("review")}</b><span>검토</span></div>
            <div><b>{cnt("posted")}</b><span>전기</span></div>
          </div>
          <p className="cl-note">기표 · 검토 상태는 장부에 올라가지 않습니다. 원장 · 시산표 · 재무제표는 <b>전기된 전표만</b> 집계합니다.</p>
        </div>
        <div className="cl-sec">
          <div className="cl-h">월마감</div>
          <div className="cl-months">
            {months.map(m => {
              const done = (st.closed || []).indexOf(m) >= 0;
              return (
                <button key={m} className={"cl-mo" + (done ? " done" : "")} onClick={() => onClose(m)} disabled={done}>
                  {m}<i>{done ? "마감" : "열림"}</i>
                </button>
              );
            })}
          </div>
          <p className="cl-note">마감한 달에는 신규 전표가 들어가지 않습니다. <b>마감은 되돌리지 않고</b> 정정은 역분개 전표로만 합니다.
            {!actor.canApprove && <span className="cl-block"> 지금 주체({actor.ko})는 마감을 확정하지 못합니다.</span>}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 전표 ─────────────────────────────────────────────────────────────────── */
function ClJournal({ jvs, st, save, actor, A, form, setForm, advance, reverse, setMsg, upMax }) {
  const [q, setQ] = React.useState({ q: "", from: "", to: "", st: "", acct: "" });
  const blank = () => ({ d: upMax || "2026-11-10", desc: "", rev: null, l: [["", "", "", ""], ["", "", "", ""]] });
  const f = form;
  const draft = f ? {
    id: corpJvNextId(st, f.d), d: f.d, desc: f.desc, by: actor, ap: null, st: "draft", rev: f.rev || undefined,
    l: f.l.filter(x => x[0]).map(x => [x[0], +String(x[1]).replace(/,/g, "") || 0, +String(x[2]).replace(/,/g, "") || 0, x[3]]),
  } : null;
  const chk = draft ? corpJvCheck(draft, st) : null;

  const setL = (i, k, v) => { const l = f.l.map(r => r.slice()); l[i][k] = v; setForm(Object.assign({}, f, { l: l })); };
  const commit = () => {
    if (!chk.ok) { setMsg({ bad: true, t: "저장하지 않았습니다 — " + chk.errs[0] }); return; }
    save(Object.assign({}, st, { jv: (st.jv || []).concat([draft]) }));
    setForm(null); setMsg({ bad: false, t: draft.id + " 기표 완료 — 승인 전까지 장부에 올라가지 않습니다" });
  };

  const F = corpJvFind(jvs, q);
  const accts = corpJvAccts(jvs);
  const clearQ = () => setQ({ q: "", from: "", to: "", st: "", acct: "" });
  const on = !!(q.q || q.from || q.to || q.st || q.acct);

  return (
    <div className="cl-body">
      {/* ── 조회 — 전표는 모두 찾을 수 있어야 한다 ── */}
      <div className="cl-sec jv-find">
        <div className="cl-h">전표 조회
          <span className="cl-t">번호 · 적요 · 계정과목 · 작성자 어디서든 찾습니다</span>
          <span className={"cl-flag" + (on ? " on" : "")}>{F.n} / {F.all}건 · 차변 합 {corpWon(F.sum)}</span></div>
        <div className="jv-q">
          <input className="g" value={q.q} placeholder="전표번호 · 적요 · 계정과목 · 작성자"
            onChange={(e) => setQ(Object.assign({}, q, { q: e.target.value }))} />
          <label>기간<input type="date" value={q.from} onChange={(e) => setQ(Object.assign({}, q, { from: e.target.value }))} /></label>
          <label>~<input type="date" value={q.to} onChange={(e) => setQ(Object.assign({}, q, { to: e.target.value }))} /></label>
          <select value={q.st} onChange={(e) => setQ(Object.assign({}, q, { st: e.target.value }))}>
            <option value="">상태 전체</option>
            {Object.keys(CORP_JV_ST).map((k) => <option key={k} value={k}>{CORP_JV_ST[k].ko}</option>)}
          </select>
          <select value={q.acct} onChange={(e) => setQ(Object.assign({}, q, { acct: e.target.value }))}>
            <option value="">계정과목 전체</option>
            {accts.map((a2) => <option key={a2.c} value={a2.c}>{a2.c} {a2.n} ({a2.cnt})</option>)}
          </select>
          {on && <button className="cl-rv" onClick={clearQ}>조건 지우기</button>}
        </div>
        {on && F.n === 0 && <p className="cl-note">조건에 맞는 전표가 <b>없습니다</b> — 조건을 넓혀 보세요.</p>}
      </div>

      <div className="cl-rowbtn">
        {!f && <button className="cl-new" onClick={() => setForm(blank())}>+ 전표 입력</button>}
        <span className="cl-hint">작성 주체: <b>{A.ko}</b> · {A.role}{A.ai && <span className="corp-ai">AI</span>}</span>
      </div>

      {f && (
        <div className="cl-form">
          <div className="cl-fh">
            <span className="cl-fid">{draft.id}</span>
            <label>일자<input type="date" value={f.d} onChange={e => setForm(Object.assign({}, f, { d: e.target.value }))} /></label>
            <label className="g">적요<input value={f.desc} placeholder="무슨 거래인지 적습니다"
              onChange={e => setForm(Object.assign({}, f, { desc: e.target.value }))} /></label>
            <button className="cl-x" onClick={() => setForm(null)}>닫기</button>
          </div>
          <table className="cl-tbl form">
            <thead><tr><th>계정과목</th><th>차변</th><th>대변</th><th>적요</th><th /></tr></thead>
            <tbody>
              {f.l.map((r, i) => (
                <tr key={i}>
                  <td>
                    <select value={r[0]} onChange={e => setL(i, 0, e.target.value)}>
                      <option value="">— 선택 —</option>
                      {["A", "L", "E", "R", "X"].map(t => (
                        <optgroup key={t} label={CORP_ACCT_T[t]}>
                          {CORP_ACCT.filter(a => a.t === t).map(a => <option key={a.c} value={a.c}>{a.c} {a.n}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td><input className="n" inputMode="numeric" value={r[1]} onChange={e => setL(i, 1, e.target.value)} /></td>
                  <td><input className="n" inputMode="numeric" value={r[2]} onChange={e => setL(i, 2, e.target.value)} /></td>
                  <td><input value={r[3]} onChange={e => setL(i, 3, e.target.value)} /></td>
                  <td><button className="cl-x s" onClick={() => setForm(Object.assign({}, f, { l: f.l.filter((_, k) => k !== i) }))}>−</button></td>
                </tr>
              ))}
              <tr className="sum">
                <td><button className="cl-addl" onClick={() => setForm(Object.assign({}, f, { l: f.l.concat([["", "", "", ""]]) }))}>+ 줄 추가</button></td>
                <td className="n">{corpWon(chk.sum.dr)}</td>
                <td className="n">{corpWon(chk.sum.cr)}</td>
                <td colSpan="2" className={chk.sum.diff === 0 ? "ok" : "bad"}>
                  {chk.sum.diff === 0 ? "차대 일치" : "차이 " + corpWon(Math.abs(chk.sum.diff))}
                </td>
              </tr>
            </tbody>
          </table>
          {!chk.ok && (
            <ul className="cl-errs">{chk.errs.map((e, i) => <li key={i}>{e}</li>)}</ul>
          )}
          <div className="cl-frow">
            <button className={"cl-save" + (chk.ok ? "" : " off")} onClick={commit}>
              {chk.ok ? "기표 저장" : "저장 불가 — 차대가 맞아야 합니다"}
            </button>
            <span className="cl-hint">저장해도 <b>기표</b> 상태입니다. 검토 · 승인을 거쳐야 장부에 올라갑니다.</span>
          </div>
        </div>
      )}

      <table className="cl-tbl jv">
        <thead><tr><th>번호</th><th>일자</th><th>적요</th><th>차변</th><th>대변</th><th>작성</th><th>승인</th><th>상태</th><th /></tr></thead>
        <tbody>
          {F.rows.slice().reverse().map(j => {
            const s = corpJvSum(j), S = CORP_JV_ST[j.st] || {};
            const c = corpJvCanAdvance(j, actor);
            return (
              <tr key={j.id} className={"st-" + j.st}>
                <td className="id">{j.id}{j.rev && <i className="cl-rev">역분개</i>}</td>
                <td>{j.d}</td>
                <td className="desc">{j.desc}
                  <div className="cl-lines">{(j.l || []).map((x, i) => (
                    <span key={i}>{corpAcctName(x[0])} {x[1] ? "차 " + corpWon(x[1]) : "대 " + corpWon(x[2])}</span>
                  ))}</div>
                </td>
                <td className="n">{corpWon(s.dr)}</td>
                <td className="n">{corpWon(s.cr)}</td>
                <td>{j.by}</td>
                <td>{j.ap || "—"}</td>
                <td><span className={"cl-st " + j.st}>{S.ko}</span></td>
                <td className="cl-act">
                  {j.st !== "posted" && (
                    <button className={"cl-go" + (c.ok ? "" : " off")} title={c.ok ? "" : c.why}
                      onClick={() => advance(j)}>{S.nextKo}</button>
                  )}
                  {j.st === "posted" && <button className="cl-rv" onClick={() => reverse(j)}>역분개</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="cl-note">전표번호는 <b>일자별 일련(YYYYMMDD-NN)</b>입니다 — 날짜를 알면 바로 찾습니다.
        {corpJvLive(st) ? <span> 지금은 <b>반입된 실제 전표</b>를 보고 있습니다 — 파일럿 전표는 빠졌습니다.</span>
          : <span> 지금은 <b>파일럿 전표</b>입니다(번호가 JV-로 시작합니다). 실제 전표가 반입되면 파일럿은 빠집니다.</span>}</p>
      <p className="cl-note">전기된 전표에는 <b>수정 버튼이 없습니다</b>. 지운 자국이 남아야 장부이기 때문에 정정은 역분개 전표로만 합니다.</p>
    </div>
  );
}

/* ── 원장 ─────────────────────────────────────────────────────────────────── */
function ClLedger({ S, sel, setSel }) {
  const book = S.trial.book;
  const live = CORP_ACCT.filter(a => book[a.c] && (book[a.c].dr !== 0 || book[a.c].cr !== 0));
  const r = book[sel] || (live[0] ? book[live[0].c] : null);
  if (!r) return <div className="cl-body"><p className="cl-note">전기된 전표가 없습니다.</p></div>;
  return (
    <div className="cl-body">
      <div className="cl-acctbar">
        {live.map(a => (
          <button key={a.c} className={"cl-ab" + (a.c === r.c ? " on" : "")} onClick={() => setSel(a.c)}>
            <i>{a.c}</i>{a.n}
          </button>
        ))}
      </div>
      <div className="cl-sec">
        <div className="cl-h">{r.c} {r.n} <span className="cl-t">{CORP_ACCT_T[r.t]}</span>
          <span className="cl-bal">잔액 {corpWon(r.bal)} <i>{r.d === "D" ? "차변" : "대변"}</i></span></div>
        <table className="cl-tbl gl">
          <thead><tr><th>일자</th><th>전표</th><th>적요</th><th>차변</th><th>대변</th><th>잔액</th></tr></thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.d}</td><td className="id">{l.id}</td>
                <td className="desc">{l.desc}{l.memo && <i> · {l.memo}</i>}</td>
                <td className="n">{l.dr ? corpWon(l.dr) : ""}</td>
                <td className="n">{l.cr ? corpWon(l.cr) : ""}</td>
                <td className="n b">{corpWon(l.run)}</td>
              </tr>
            ))}
            <tr className="sum"><td colSpan="3">합계</td>
              <td className="n">{corpWon(r.dr)}</td><td className="n">{corpWon(r.cr)}</td><td className="n b">{corpWon(r.bal)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── 시산표 ───────────────────────────────────────────────────────────────── */
function ClTrial({ S }) {
  const T = S.trial;
  return (
    <div className="cl-body">
      <div className="cl-sec">
        <div className="cl-h">합계잔액시산표 <span className={"cl-flag" + (T.ok ? " on" : " bad")}>{T.ok ? "차변 = 대변" : "차이 " + corpWon(T.diff)}</span></div>
        <table className="cl-tbl tb">
          <thead><tr><th>구분</th><th>코드</th><th>계정과목</th><th>차변 합</th><th>대변 합</th><th>잔액</th></tr></thead>
          <tbody>
            {T.rows.map(r => (
              <tr key={r.c}>
                <td className={"cl-tt t" + r.t}>{CORP_ACCT_T[r.t]}</td>
                <td className="id">{r.c}</td><td>{r.n}{r.contra && <i className="cl-ct">차감</i>}</td>
                <td className="n">{corpWon(r.dr)}</td><td className="n">{corpWon(r.cr)}</td>
                <td className="n b">{corpWon(r.bal)}<i>{r.d === "D" ? "차" : "대"}</i></td>
              </tr>
            ))}
            <tr className="sum"><td colSpan="3">합계</td>
              <td className="n">{corpWon(T.drSum)}</td><td className="n">{corpWon(T.crSum)}</td><td className="n">—</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── 재무제표 ─────────────────────────────────────────────────────────────── */
function ClStatements({ S, cut }) {
  const row = (r, flip) => (
    <tr key={r.c}><td className="id">{r.c}</td><td>{r.n}{r.contra && <i className="cl-ct">차감</i>}</td>
      <td className="n">{corpWon(flip ? -r.sign : r.sign)}</td></tr>
  );
  return (
    <div className="cl-body">
      <div className="cl-fsbar">기준 {cut ? cut.slice(0, 7) + " 말" : "전 기간"} · 전기된 전표만 집계합니다</div>
      <div className="cl-grid2">
        <div className="cl-sec">
          <div className="cl-h">재무상태표 <span className={"cl-flag" + (S.bs.ok ? " on" : " bad")}>
            {S.bs.ok ? "자산 = 부채 + 자본 + 손익" : "불일치"}</span></div>
          <table className="cl-tbl fs">
            <tbody>
              <tr className="grp"><td colSpan="3">자산</td></tr>
              {S.bs.A.map(r => row(r, false))}
              <tr className="sub"><td colSpan="2">자산 총계</td><td className="n">{corpWon(S.bs.assets)}</td></tr>
              <tr className="grp"><td colSpan="3">부채</td></tr>
              {S.bs.L.map(r => row(r, true))}
              <tr className="sub"><td colSpan="2">부채 총계</td><td className="n">{corpWon(S.bs.liab)}</td></tr>
              <tr className="grp"><td colSpan="3">자본</td></tr>
              {S.bs.E.map(r => row(r, true))}
              <tr><td className="id">—</td><td>당기손익</td><td className="n">{corpWon(S.bs.net)}</td></tr>
              <tr className="sub"><td colSpan="2">자본 총계</td><td className="n">{corpWon(S.bs.equity + S.bs.net)}</td></tr>
              <tr className="sum"><td colSpan="2">부채와 자본 총계</td><td className="n">{corpWon(S.bs.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="cl-sec">
          <div className="cl-h">손익계산서</div>
          <table className="cl-tbl fs">
            <tbody>
              <tr className="grp"><td colSpan="3">수익</td></tr>
              {S.pl.R.map(r => row(r, true))}
              <tr className="sub"><td colSpan="2">수익 합계</td><td className="n">{corpWon(S.pl.rev)}</td></tr>
              <tr className="grp"><td colSpan="3">비용</td></tr>
              {S.pl.X.map(r => row(r, false))}
              <tr className="sub"><td colSpan="2">비용 합계</td><td className="n">{corpWon(S.pl.exp)}</td></tr>
              <tr className={"sum" + (S.pl.net < 0 ? " neg" : "")}><td colSpan="2">당기손익</td><td className="n">{corpWon(S.pl.net)}</td></tr>
            </tbody>
          </table>
          <p className="cl-note">계획 축(재무계획)과 맞춰 보는 <b>예실 대비</b>는 같은 팀의 별도 지면에 있습니다. 두 축은 산정 기준이 달라 한 표에 금액으로 섞지 않고, 대응이 확정된 계정만 나란히 둡니다.</p>
        </div>
      </div>
    </div>
  );
}

/* ── 은행 대사 ────────────────────────────────────────────────────────────── */
/* ── 은행 내역 올리기 — **은행 대사 지면 안에** 둔다 (형 지시 2026-11-12) ────
   「은행자료를 전일 것을 매일 업로드만 시키면 전표가 쳐져서 실시간 재무제표가 만들어지도록.
    다만 은행자료를 자동으로 가져오지 못하니 사람 책임자가 업로드 할 수 있도록.」

   ⚠️ 이 패널은 두 갈래(내역 없음 · 내역 있음) **앞**에 선다. 「없음」 갈래 안에 넣으면
      한 번 올린 다음 날 올릴 자리가 사라진다.
   ⚠️ 민감자료 검사가 **미리보기보다 앞**이다. 띄워 놓고 「지우세요」라고 말하는 것은
      이미 띄운 것이다. 반입 창구와 **같은 판정 함수**를 쓴다 — 입구가 둘인데 한쪽만
      막으면 막는 것이 아니다. */
function ClBankUp({ st, save, actor, A }) {
  const [raw, setRaw] = React.useState(null);
  const [map, setMap] = React.useState({});
  const [cov, setCov] = React.useState({ from: "", to: "" });
  const [pick, setPick] = React.useState({});
  const [keep, setKeep] = React.useState(true);
  const [note, setNote] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const fileRef = React.useRef(null);

  const spec = corpUpSpec("bank");
  const bjv = React.useMemo(() => corpBjvRead(), [note]);
  const jvs = React.useMemo(() => corpJvAll(st), [st]);
  const can = React.useMemo(() => cbxCan(), []);
  const cur = corpBankOf(st);
  const due = corpBjvDue(st && st.bankCov, corpOpsToday());

  /* 검증 → 은행줄 → 전표 후보. 화면과 러너가 **같은 함수**를 본다. */
  const V = React.useMemo(() => (raw ? corpUpValidate("bank", raw.head, raw.rows, map) : null), [raw, map]);
  const T = React.useMemo(() => (V && !V.missing.length ? corpUpToBank(V.ok) : null), [V]);
  const CH = React.useMemo(() => (T ? corpBjvChain(T.lines) : null), [T]);
  const B = React.useMemo(
    () => (T ? corpBjvBuild(T.lines, { map: bjv.map, pick: pick }, st, jvs) : null),
    [T, pick, bjv, st, jvs]
  );

  const reset = () => { setRaw(null); setMap({}); setPick({}); setCov({ from: "", to: "" }); if (fileRef.current) fileRef.current.value = ""; };

  /* 파일 하나를 받아 읽는다 — 고른 곳이 내 컴퓨터든 이어 둔 저장소 폴더든 **같은 길**이다.
     길이 둘인데 한쪽만 민감자료 검사를 하면 막는 것이 아니다. */
  const readFile = async (f) => {
    setBusy(true); setNote(null);
    try {
      const buf = new Uint8Array(await f.slice(0, 4).arrayBuffer());
      const zip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
      const ole = buf[0] === 0xd0 && buf[1] === 0xcf;
      if (ole) throw new Error("구형 엑셀(.xls)은 읽지 못합니다 — 엑셀에서 「다른 이름으로 저장 → .xlsx」로 바꿔 주세요");
      let head = [], rows = [], sheet = "", sheets = [];
      if (zip) {
        const X = await cbxRead(f);
        head = X.rows[0] || []; rows = X.rows.slice(1); sheet = X.sheet; sheets = X.sheets;
      } else {
        const txt = await f.text();
        const g = corpUpParseCsv(txt);
        head = g.head || []; rows = g.rows || [];
      }
      rows = rows.filter((r) => r.join("").trim());
      if (head.length < 2 || !rows.length) throw new Error("표를 읽지 못했습니다 — 머리글과 자료 줄이 있는지 보아 주세요");
      const hits = corpUpScan(rows, head);
      if (hits.length) {
        setNote({ bad: true, t: "민감자료가 " + hits.length + "곳에서 걸렸습니다 — 표를 띄우지 않고 멈췄습니다. "
          + hits.slice(0, 4).map((h) => h.row + "행 " + h.col + "열(" + h.why + ")").join(" · ") + ". 그 열을 떼고 다시 올려 주세요." });
        reset(); setBusy(false); return;
      }
      setRaw({ name: f.name, kb: Math.round(f.size / 1024), head: head, rows: rows, sheet: sheet, sheets: sheets, zip: zip });
      const m = corpUpSuggest(head, spec);
      setMap(m);
      const ds = rows.map((r) => String(r[m.date] || "")).map((x) => (/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(x) || [])[0] || "")
        .filter(Boolean).map((x) => x.replace(/[./]/g, "-").replace(/-(\d)(?=-|$)/g, "-0$1")).sort();
      setCov({ from: ds[0] || "", to: ds[ds.length - 1] || "" });
      setNote({ bad: false, t: f.name + " — " + rows.length + "행 읽었습니다" + (sheet ? "(시트 「" + sheet + "」)" : "") + ". 열이 맞는지 확인해 주세요." });
    } catch (err) {
      reset();
      setNote({ bad: true, t: (err && err.message) || "파일을 읽지 못했습니다" });
    }
    setBusy(false);
  };

  const onFile = async (e) => {
    const f = (e.target.files || [])[0];
    if (!f) { reset(); return; }
    await readFile(f);
  };

  /* ⚠️ 은행줄 넣기와 전표 만들기를 **가른다.** 한 버튼에 묶여 있어서, 전표가 0건이면
     (이미 다 들어와 있으면) 은행줄도 안 들어갔다 — 그러면 대사가 **영원히 보류**다.
     은행줄은 읽었으면 들어가야 한다. 대사는 그 줄이 있어야 돈다. */
  const commit = () => {
    if (!B || !T) return;
    if (!T.lines.length) { setNote({ bad: true, t: "읽은 은행줄이 없습니다" }); return; }
    if (!cov.from || !cov.to) { setNote({ bad: true, t: "이 자료가 **며칠부터 며칠까지**인지 적어 주세요 — 거래가 없던 날과 안 올린 날은 자료만으로 구별되지 않습니다" }); return; }
    const M = corpUpMergeBank(st.bank || [], T.lines);
    const next = Object.assign({}, st, {
      jv: (st.jv || []).concat(B.made),
      bank: M.lines,
      bankCov: { from: (st.bankCov && st.bankCov.from) || cov.from, to: cov.to > ((st.bankCov && st.bankCov.to) || "") ? cov.to : (st.bankCov && st.bankCov.to) || cov.to, at: raw ? raw.name : "" },
    });
    save(next);
    if (keep && Object.keys(pick).length) {
      const nm = Object.assign({}, bjv.map, pick);
      corpBjvWrite({ map: nm, log: (bjv.log || []).concat([{ at: cov.to, n: Object.keys(pick).length }]) });
    }
    const held = B.held.length;
    setNote({ bad: false, t: "은행줄 " + M.added + "줄을 넣었습니다"
      + (M.dup ? "(이미 받은 " + M.dup + "줄은 건너뜀)" : "") + " — **이제 대사가 돕니다.** "
      + (B.made.length ? B.made.length + "건을 전표로 올렸습니다(기표 상태 — 검토·승인을 거쳐야 장부에 들어갑니다). " : "새로 만들 전표는 없었습니다(이미 들어와 있습니다). ")
      + (held ? "**보류 " + held + "줄은 그대로 남았습니다** — 계정을 고를 때까지 장부가 은행보다 적습니다." : "") });
    reset();
  };

  const undo = () => {
    /* ⚠️ **전기된 전표는 지우지 않는다**(형 확정 2026-11-12). 이 장부가 스스로 적은 원칙이다 —
       「정정은 역분개로 한다 · 지운 자국이 남아야 장부다」. 아직 승인 전인 것만 물린다. */
    const all = st.jv || [];
    const posted = all.filter((j) => j.by === "은행반입" && j.st === "posted");
    const keepJv = all.filter((j) => j.by !== "은행반입" || j.st === "posted");
    const n = all.length - keepJv.length;
    save(Object.assign({}, st, { jv: keepJv }));
    setNote({ bad: false, t: "아직 승인 전인 " + n + "건을 물렸습니다."
      + (posted.length ? " **이미 전기된 " + posted.length + "건은 남겼습니다** — 전기된 전표는 지우지 않습니다. 바로잡으시려면 업무 지시에서 「역분개」를 시키시거나 전표 지면에서 역분개하세요."
        : "")
      + " 은행줄은 그대로 둡니다 — 지우면 어디까지 받았는지가 사라집니다." });
  };

  const cols = spec ? spec.need.concat(spec.opt) : [];
  const words = B ? B.held.map((h) => corpBjvWord(h.cls) + "|" + h.dir) : [];
  const uniqWords = words.filter((w, i) => words.indexOf(w) === i);

  return (
    <div className="cl-sec bk-up">
      <div className="cl-h">은행 내역 올리기 <span className="cl-t">전표는 이 자료에서만 나옵니다</span>
        <span className={"cl-flag" + (due.ok ? " on" : " hold")}>{due.ok ? "어제까지 들어옴" : (due.late === null ? "아직 없음" : due.late + "일치 비었음")}</span>
        <button className="cl-rv" onClick={() => setOpen(!open)}>{open ? "접기" : "열기"}</button>
      </div>
      <p className="cl-note">{due.ko}
        {cur && cur.live && <span> · 지금 담긴 은행줄 <b>{cur.lines.length}줄</b>{st.bankCov && st.bankCov.from ? "(" + st.bankCov.from + " ~ " + st.bankCov.to + ")" : ""}</span>}</p>

      {open && (
        <div className="bk-body">
          {!can.ok && <p className="cl-note hold"><b>이 브라우저에서는 엑셀을 바로 읽지 못합니다.</b> {can.why}</p>}
          <p className="cl-note"><b>파일은 어디로도 전송되지 않습니다</b> — 서버가 없어 이 브라우저 안에서 읽고 끝납니다.
            은행에서 내려받은 <b>.xlsx 를 그대로</b> 올리시면 됩니다(CSV 도 받습니다).
            은행 계좌를 <b>자동으로 가져오지 못합니다</b> — 그래서 사람이 매일 올립니다.</p>

          {/* 형 지시 — 회계 지면은 늘 02.회계 와 이어 둔다(다른 팀 자료가 섞이지 않게) */}
          <CorpVaultFs bankOnly team="M2" onPick={async (f) => { await readFile(f); }} />

          <div className="bk-row">
            <span className="cl-t">내 컴퓨터에서 고르기 —</span>
            <input ref={fileRef} type="file" accept=".xlsx,.csv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} disabled={busy} />
            {raw && <button className="cl-rv" onClick={reset}>지우기</button>}
            {busy && <span className="cl-t">읽는 중…</span>}
          </div>
          {note && <div className={"cl-msg" + (note.bad ? " bad" : "")} onClick={() => setNote(null)}>{note.t}</div>}

          {raw && (
            <div className="bk-map">
              <div className="cl-h2">열 맞추기 <span className="cl-t">추측해서 넣지 않습니다 — 확인하고 고르세요</span></div>
              <p className="cl-note">은행마다 <b>입금·출금 열의 순서가 거꾸로</b>입니다. 어느 쪽이 기본값이든 한 은행은 부호가
                통째로 뒤집힙니다 — 그래서 고정하지 않고 보여 드립니다. <b>잔액 열을 꼭 맞춰 주세요</b>:
                잔액이 이어지는지 보아야 빠진 거래를 잡습니다.</p>
              <div className="bk-cols">
                {cols.map((k) => (
                  <label key={k} className={spec.need.indexOf(k) >= 0 ? "need" : ""}>
                    <span>{spec.label[k]}{spec.need.indexOf(k) >= 0 && <i>필수</i>}</span>
                    <select value={map[k] === undefined ? "" : map[k]}
                      onChange={(e) => { const v = e.target.value; const m = Object.assign({}, map); if (v === "") delete m[k]; else m[k] = +v; setMap(m); }}>
                      <option value="">— 없음 —</option>
                      {raw.head.map((h, i) => <option key={i} value={i}>{String(h).trim() || "(" + (i + 1) + "열)"}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="bk-cov">
                <label>이 자료가 덮는 기간<input type="date" value={cov.from} onChange={(e) => setCov(Object.assign({}, cov, { from: e.target.value }))} /></label>
                <span>~</span>
                <label><input type="date" value={cov.to} onChange={(e) => setCov(Object.assign({}, cov, { to: e.target.value }))} /></label>
                <i>거래가 0건인 날과 안 올린 날은 자료만으로 구별되지 않습니다 — 사람이 적습니다.</i>
              </div>
            </div>
          )}

          {V && V.missing.length > 0 && <p className="cl-note hold">{V.msg}</p>}

          {T && CH && (
            <div className="bk-chain">
              <div className={"bk-chip" + (CH.ok ? " on" : " bad")}>
                잔액 사슬 {CH.n === 0 ? "검사 못 함" : (CH.ok ? "전건 성립 (" + CH.n + "쌍)" : CH.breaks.length + "군데 끊김")}
              </div>
              <span className="cl-t">
                {CH.n === 0 ? "잔액 열을 맞춰 주세요 — 빠진 거래를 잡을 길이 없습니다"
                  : CH.ok ? "직전 잔액 " + corpWon(CH.open) + " → 마지막 " + corpWon(CH.last) + " 까지 한 줄도 끊기지 않았습니다"
                    : "이 사이에 표에 없는 거래가 있습니다 — " + CH.breaks.slice(0, 2).map((x) => x.row + "행 " + corpWon(x.gap)).join(" · ")}
              </span>
              {!CH.ok && CH.n > 0 && <p className="cl-note hold">잔액이 끊긴 자료로는 전표를 만들지 않습니다 — 빠진 거래가 있는 채로 장부를 세우면 그 차이는 아무도 모릅니다.</p>}
              {V && V.bad.length > 0 && <p className="cl-note">읽지 못한 줄 {V.bad.length}건: {V.bad.slice(0, 3).map((b) => b.row + "행 — " + b.why.join(" / ")).join(" · ")}</p>}
              {T.dropped.length > 0 && <p className="cl-note">뺀 줄 {T.dropped.length}건: {T.dropped.slice(0, 3).map((d) => d.row + "행 — " + d.why).join(" · ")}</p>}
            </div>
          )}

          {B && (
            <div className="bk-prev">
              <div className="cl-h2">전표가 될 줄 <span className="cl-t">{B.made.length} 만듦 · {B.held.length} 보류 · {B.dup.length} 이미 있음 / 은행 {B.n}줄</span></div>
              <div className="cl-h2">한 줄이 전표가 되기까지 <span className="cl-t">은행 줄 순서 그대로</span></div>
              <p className="cl-note">은행 줄에는 금액 · 날짜 · 상대가 있지만 <b>계정이 없습니다</b>.
                분류 칸에 적힌 낱말로 계정을 찾고, 입금이면 보통예금 <b>차변</b>에 · 출금이면 <b>대변</b>에 세웁니다.</p>
              <table className="cl-tbl bk-tbl bk-trace">
                <thead><tr><th>행</th><th>일자 · 시각</th><th>내용</th><th>금액</th>
                  <th>① 분류</th><th>② 계정</th><th>③ 분개</th><th>결과</th></tr></thead>
                <tbody>
                  {(B.trace || []).slice(0, 60).map((r) => (
                    <tr key={r.row} className={"st-" + r.state}>
                      <td className="id">{r.row}</td>
                      <td className="id">{r.d}<i className="bk-t">{r.t}</i></td>
                      <td className="desc">{r.m}</td>
                      <td className={"n " + (r.a >= 0 ? "in" : "out")}>{corpWon(r.a)}</td>
                      <td className="id">{r.cls || <span className="bk-no">비었음</span>}</td>
                      <td className="id">{r.acct
                        ? <span>{r.acct} {r.acctKo}{r.src === "sure" ? <i className="bk-why">표에 그대로 있음</i>
                          : (r.src === "saved" ? <i className="bk-why">전에 고르신 것</i>
                            : (r.src === "picked" ? <i className="bk-why">방금 고르신 것</i> : null))}</span>
                        : <span className="bk-no">모름</span>}</td>
                      <td className="id">{r.lines
                        ? r.lines.map((l, i) => (
                          <div key={i} className="bk-ln">
                            <b>{l[1] > 0 ? "차" : "대"}</b> {l[0]} {corpAcctName(l[0])} <span className="n">{corpWon(l[1] || l[2])}</span>
                          </div>))
                        : <span className="bk-no">—</span>}</td>
                      <td className="st">{r.state === "made" ? <span className="bk-ok">{r.id}</span>
                        : (r.state === "dup" ? <span className="bk-dup">이미 있음 · {r.id}</span>
                          : <span className="bk-held">보류</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(B.trace || []).some((r) => r.state !== "made") && (
                <p className="cl-note">보류 · 이미 있음인 줄의 까닭:
                  {[...new Set((B.trace || []).filter((r) => r.state !== "made").map((r) => r.why))].slice(0, 4)
                    .map((w, i) => <span key={i}> · {w}</span>)}</p>
              )}
              {(B.trace || []).length > 60 && <p className="cl-note">앞 60줄만 보여 줍니다(전체 {B.trace.length}줄).</p>}

              {B.made.length > 0 && (
                <table className="cl-tbl bk-tbl">
                  <thead><tr><th>번호</th><th>일자</th><th>적요</th><th>차변</th><th>대변</th><th>금액</th></tr></thead>
                  <tbody>
                    {B.made.slice(0, 40).map((j) => (
                      <tr key={j.id}>
                        <td className="id">{j.id}</td><td>{j.d}</td><td className="desc">{j.desc}</td>
                        <td className="id">{j.l[0][0]} {corpAcctName(j.l[0][0])}</td>
                        <td className="id">{j.l[1][0]} {corpAcctName(j.l[1][0])}</td>
                        <td className="n">{corpWon(j.l[0][1] || j.l[0][2])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {B.made.length > 40 && <p className="cl-note">앞 40건만 보여 줍니다(전체 {B.made.length}건).</p>}

              {B.held.length > 0 && (
                <div className="bk-held">
                  <div className="cl-h2">책임자가 정해야 할 줄 <span className="cl-t">{B.held.length}건</span></div>
                  <p className="cl-note"><b>기계가 고르지 않습니다.</b> 은행 줄에는 금액·날짜·상대가 있지만 <b>계정이 없습니다</b> —
                    계정은 거래를 한 사람만 압니다. 실제로 같은 낱말이 10월과 11월에 <b>다른 계정</b>으로 갔습니다.
                    기계가 하나로 못 박으면 둘 중 하나는 반드시 틀립니다.</p>
                  <table className="cl-tbl bk-tbl">
                    <thead><tr><th>행</th><th>일자</th><th>내용</th><th>금액</th><th>분류</th><th>계정</th><th>왜 못 골랐나</th></tr></thead>
                    <tbody>
                      {B.held.map((h) => {
                        const key = corpBjvWord(h.cls) + "|" + h.dir;
                        return (
                          <tr key={h.row}>
                            <td className="id">{h.row}</td><td>{h.d}</td><td className="desc">{h.m}</td>
                            <td className={"n " + (h.a >= 0 ? "in" : "out")}>{corpWon(h.a)}</td>
                            <td className="id">{h.cls || "—"}</td>
                            <td>
                              <select value={pick[key] || ""} onChange={(e) => {
                                const p = Object.assign({}, pick); const v = e.target.value;
                                if (!v) delete p[key]; else p[key] = v; setPick(p);
                              }}>
                                <option value="">— 고르세요 —</option>
                                {CORP_ACCT.filter((a) => a.c !== "103").map((a) => (
                                  <option key={a.c} value={a.c}>{a.c} {a.n}</option>
                                ))}
                              </select>
                            </td>
                            <td className="desc">{h.why}{h.hint ? " (지난 장부: " + h.hint + ")" : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="cl-note">같은 낱말은 한 번만 고르시면 그 묶음 전체에 붙습니다(지금 고를 낱말 {uniqWords.length}가지).</p>
                  <label className="bk-keep">
                    <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
                    <span>고른 대응을 기억해서 다음부터 자동으로 씁니다</span>
                    <i>기억하지 않으면 매일 다시 고르셔야 합니다. 다만 <b>틀린 선택도 그대로 복제됩니다</b> —
                      지난 장부에서 두 계정으로 갈린 낱말은 기억해도 매번 다시 묻습니다.</i>
                  </label>
                </div>
              )}

              {B.dup.length > 0 && (
                <p className="cl-note">이미 들어와 있는 줄 {B.dup.length}건은 건너뜁니다 — 같은 파일을 두 번 올려도 장부가 두 배가 되지 않습니다
                  ({B.dup.slice(0, 3).map((d) => d.row + "행 → " + d.id).join(" · ")}).</p>
              )}

              <div className="bk-act">
                <button className="cl-save" disabled={!T.lines.length || (CH && CH.n > 0 && !CH.ok)} onClick={commit}>
                  은행 내역 {T.lines.length}줄 넣기{B.made.length ? " · 전표 " + B.made.length + "건" : ""}
                </button>
                {!A.canApprove && <span className="cl-t">올리는 것까지는 됩니다 — 승인·전기는 사람이 합니다</span>}
                {B.held.length > 0 && <span className="cl-t">보류 {B.held.length}줄을 남기면 장부 잔액이 은행과 맞지 않습니다</span>}
              </div>
            </div>
          )}

          {cur && cur.live && (
            <div className="bk-act">
              <button className="cl-rv" onClick={undo}>은행에서 만든 전표 전부 물리기</button>
              <span className="cl-t">직접 입력한 전표와 검증용 전표는 그대로 둡니다</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClBank({ R, st, save, actor, A }) {
  const UP = <ClBankUp st={st} save={save} actor={actor} A={A} />;
  if (R.none) {
    return (
      <div className="cl-body">
        {UP}
        <div className="cl-sec">
          <div className="cl-h">은행 대사 <span className="cl-flag hold">보류</span></div>
          <p className="cl-note"><b>은행 거래내역이 반입되지 않았습니다.</b> 대사할 상대가 없어 <b>돌리지 않았습니다</b> —
            「차이 0」이라고 적지 않습니다. 안 돌린 검사를 통과로 적으면, 맞는 줄 알고 넘어갑니다.</p>
          <div className="cl-recon">
            <div className="cl-side"><b>{corpWon(R.bookBal)}</b><span>보통예금 장부 잔액</span></div>
            <div className="cl-op">vs</div>
            <div className="cl-eq"><b>—</b><span>은행 내역 없음</span></div>
          </div>
          <p className="cl-note"><b>바로 위에서</b> 은행 내역을 올리시면 전표가 만들어지고 대사가 돕니다
            (자료 반입 창구의 「은행 거래내역」으로 올리셔도 같습니다 — 판정은 같은 함수가 합니다).
            장부에서 보통예금이 움직인 전표는 <b>{R.book.length}건</b> 있습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="cl-body">
      {UP}
      <div className="cl-sec">
        <div className="cl-h">{R.bank} <span className="cl-t">{R.mask}</span>
          <span className={"cl-flag" + (R.ok ? " on" : " bad")}>{R.ok ? "조정 후 차이 0" : "차이 " + corpWon(R.gap)}</span></div>
        {/* 양쪽을 각각 조정해 같은 금액에 닿는지 본다 — 한 줄로 이으면 겹부호(− −240,000)가 생겨 읽히지 않는다 */}
        <div className="cl-recon">
          <div className="cl-side"><b>{corpWon(R.bankBal)}</b><span>은행 잔액</span></div>
          <div className="cl-op">{R.bankOnlyNet < 0 ? "+" : "−"}</div>
          <div><b>{corpWon(Math.abs(R.bankOnlyNet))}</b><span>은행에만 ({R.bankOnly.length}건)</span></div>
          <div className="cl-op">=</div>
          <div className="cl-eq"><b>{corpWon(R.bankBal - R.bankOnlyNet)}</b><span>조정 후</span></div>
        </div>
        <div className="cl-recon">
          <div className="cl-side"><b>{corpWon(R.bookBal)}</b><span>장부 잔액</span></div>
          <div className="cl-op">{R.bookOnlyNet < 0 ? "+" : "−"}</div>
          <div><b>{corpWon(Math.abs(R.bookOnlyNet))}</b><span>장부에만 ({R.bookOnly.length}건)</span></div>
          <div className="cl-op">=</div>
          <div className="cl-eq"><b>{corpWon(R.bookBal - R.bookOnlyNet)}</b><span>조정 후</span></div>
        </div>
        <div className="cl-reconx">두 조정 후 금액이 같아야 맞습니다 — 차이 <b>{corpWon(R.gap)}</b></div>
        <p className="cl-note">같은 날 · 같은 금액을 한 번씩만 짝지었습니다 — <b>{R.matched}건</b> 자동 대사.
          남은 줄을 없애는 것은 사람이 합니다(은행 수수료 기장 · 입금자 확인 · 미통과 건 추적).</p>
      </div>

      <div className="cl-grid2">
        <div className="cl-sec">
          <div className="cl-h">은행 거래내역</div>
          <table className="cl-tbl bk">
            <thead><tr><th>일자</th><th>적요</th><th>금액</th><th>대사</th></tr></thead>
            <tbody>
              {R.lines.map((l, i) => (
                <tr key={i} className={l.used ? "" : "un"}>
                  <td>{l.d}</td><td className="desc">{l.m}</td>
                  <td className={"n " + (l.a >= 0 ? "in" : "out")}>{corpWon(l.a)}</td>
                  <td className="id">{l.jv || <span className="cl-un">미대사</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cl-sec">
          <div className="cl-h">남은 것 — 사람이 처리합니다</div>
          {R.bankOnly.length === 0 && R.bookOnly.length === 0 && <p className="cl-note">남은 건이 없습니다.</p>}
          {R.bankOnly.map((l, i) => (
            <div key={"a" + i} className="cl-open">
              <span className="cl-tag bank">은행에만</span>
              <b>{l.d}</b> {l.m} <span className="n">{corpWon(l.a)}</span>
              <i>장부에 기장이 없습니다 — 전표를 올려야 맞습니다</i>
            </div>
          ))}
          {R.bookOnly.map((x, i) => (
            <div key={"b" + i} className="cl-open">
              <span className="cl-tag book">장부에만</span>
              <b>{x.d}</b> {x.id} {x.desc} <span className="n">{corpWon(x.a)}</span>
              <i>은행을 아직 통과하지 않았습니다 — 다음 내역에서 확인합니다</i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
