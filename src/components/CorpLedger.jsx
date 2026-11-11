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
  const V = React.useMemo(() => corpLedgerVerdict(jvs, CORP_BANK_SEED, cut), [jvs, cut]);
  const S = React.useMemo(() => corpStatements(jvs, cut), [jvs, cut]);
  const R = React.useMemo(() => corpBankRecon(jvs, CORP_BANK_SEED, cut), [jvs, cut]);
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
          {CORP_LEDGER_PILOT && <span className="cl-pilot">파일럿 전표</span>}
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
              {months.map(m => <option key={m} value={m + "-31"}>{m} 말</option>)}
            </select>
          </label>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>
            검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}
          </span>
        </div>
      </div>

      {CORP_LEDGER_PILOT && (
        <div className="cl-warn">
          여기 실린 전표 {CORP_JV_SEED.length}건은 <b>파일럿 전표</b>입니다 — 엔진이 맞게 도는지 보려고 넣은 검증용 묶음이고
          회사의 실제 장부가 아닙니다. 실제 회계자료 반입은 Phase 10이며 보안 선행(Phase 0)을 통과한 뒤에 시작합니다.
          <span className="cl-warn2">서버가 없어 권한은 이 브라우저 안에서만 걸립니다. 형이 넣은 전표도 이 브라우저에만 남습니다.</span>
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
      {tab === "bank" && <ClBank R={R} />}
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
        <div className={R.ok ? "" : "neg"}><b>{R.bankOnly.length + R.bookOnly.length}</b><span>미대사</span></div>
      </div>

      <div className="cl-sec">
        <div className="cl-h">항등식 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
        <table className="cl-tbl id">
          <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
          <tbody>
            {V.rows.map(r => (
              <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
                <td>{r.ko}</td>
                <td className="n">{r.n}건</td>
                <td className="n">{r.got}</td>
                <td className="n">{r.want}</td>
                <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cl-note">검사 대상이 <b>0건이면 실패</b>로 셉니다. 빈 장부는 어떤 항등식도 통과시키기 때문입니다.</p>
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
  const blank = () => ({ d: upMax || "2026-11-10", desc: "", rev: null, l: [["", "", "", ""], ["", "", "", ""]] });
  const f = form;
  const draft = f ? {
    id: corpJvNextId(st), d: f.d, desc: f.desc, by: actor, ap: null, st: "draft", rev: f.rev || undefined,
    l: f.l.filter(x => x[0]).map(x => [x[0], +String(x[1]).replace(/,/g, "") || 0, +String(x[2]).replace(/,/g, "") || 0, x[3]]),
  } : null;
  const chk = draft ? corpJvCheck(draft, st) : null;

  const setL = (i, k, v) => { const l = f.l.map(r => r.slice()); l[i][k] = v; setForm(Object.assign({}, f, { l: l })); };
  const commit = () => {
    if (!chk.ok) { setMsg({ bad: true, t: "저장하지 않았습니다 — " + chk.errs[0] }); return; }
    save(Object.assign({}, st, { jv: (st.jv || []).concat([draft]) }));
    setForm(null); setMsg({ bad: false, t: draft.id + " 기표 완료 — 승인 전까지 장부에 올라가지 않습니다" });
  };

  return (
    <div className="cl-body">
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
          {jvs.slice().reverse().map(j => {
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
                <td className="act">
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
          <p className="cl-note">계획 축(재무계획)과 맞춰 보는 <b>예실 대비</b>는 Phase 6에서 만듭니다. 지금 두 축을 한 표에 섞지 않습니다.</p>
        </div>
      </div>
    </div>
  );
}

/* ── 은행 대사 ────────────────────────────────────────────────────────────── */
function ClBank({ R }) {
  return (
    <div className="cl-body">
      <div className="cl-sec">
        <div className="cl-h">{R.bank} <span className="cl-t">{R.mask}</span>
          <span className={"cl-flag" + (R.ok ? " on" : " bad")}>{R.ok ? "조정 후 차이 0" : "차이 " + corpWon(R.gap)}</span></div>
        {/* 양쪽을 각각 조정해 같은 금액에 닿는지 본다 — 한 줄로 이으면 겹부호(− −240,000)가 생겨 읽히지 않는다 */}
        <div className="cl-recon">
          <div className="side"><b>{corpWon(R.bankBal)}</b><span>은행 잔액</span></div>
          <div className="op">{R.bankOnlyNet < 0 ? "+" : "−"}</div>
          <div><b>{corpWon(Math.abs(R.bankOnlyNet))}</b><span>은행에만 ({R.bankOnly.length}건)</span></div>
          <div className="op">=</div>
          <div className="eq"><b>{corpWon(R.bankBal - R.bankOnlyNet)}</b><span>조정 후</span></div>
        </div>
        <div className="cl-recon">
          <div className="side"><b>{corpWon(R.bookBal)}</b><span>장부 잔액</span></div>
          <div className="op">{R.bookOnlyNet < 0 ? "+" : "−"}</div>
          <div><b>{corpWon(Math.abs(R.bookOnlyNet))}</b><span>장부에만 ({R.bookOnly.length}건)</span></div>
          <div className="op">=</div>
          <div className="eq"><b>{corpWon(R.bookBal - R.bookOnlyNet)}</b><span>조정 후</span></div>
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
