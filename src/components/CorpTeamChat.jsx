/* ══════════════ 팀 대화창(CorpTeamChat.jsx) · 팀 보드 맨 위 (조성래님 지시 2026-11-12) ══════════════
   「AI 팀장 대화 창을 한 곳에 두지 말고 해체하고 각 팀으로, 각 팀의 대시보드로 옮기고
    대화를 통해 업무를 진행할 수 있도록 해줘. 예를 들면 회계팀에 들어가면 제일 위에
    핀테크가 먼저 인삿말과 업무지시에 대해 말을 걸어 오도록 대화창을 만들어 줘.」

   아래 탭에 있던 「업무 지시」 지면(CorpOrder.jsx)도 2026-11-12 에 지웠다 — 이 창과 같은 일을
   하고 있었다. 말을 거는 자리가 둘이면 어느 쪽에 적었는지 헷갈리고, 기록도 두 곳을 봐야 한다.
   그 지면의 자기시험(지시 해석 검산)과 기준일 표시는 이 창이 이어받았다.

   한 곳에 모아 두던 「AI 팀장 대화」 화면(CorpAgentChat.jsx)은 해체하면서 지웠다 —
   들어갈 길이 없는 화면을 번들에 남겨 두면, 아무도 보지 못하는 자리에서 약속만 한다.
   그 화면이 지고 있던 두 약속(자기시험 · 물음과 요청 가르기)은 이 화면이 그대로 이어받았다.

   이 화면이 지키는 것
     · **먼저 말을 건다.** 들어오시면 그 팀 AI가 인사하고 **지금 상태**를 말한다.
       그 상태는 등록된 도구를 **실제로 돌려** 가져온 값이다 — 인사말이라고 지어내지 않는다.
     · **도구가 있는 것만 답한다.** 사내용 언어모델이 붙어 있지 않다. 없으면 없다고 말한다.
     · **시키는 일은 쪼갠다.** 회계팀(핀테크)은 말로 시키면 할 일로 나눈다 —
       쪼개기까지가 AI고, 승인은 사람이다.
     · 대화는 **에이전트별로 따로** 남고, 어디서 열든 **같은 기록**을 본다(두 벌이 되지 않게). */

function CorpTeamChat({ team, onTab, compact }) {
  const t = typeof corpTeam === "function" ? corpTeam(team) : null;
  const AI = t ? t.ai : "";
  const [st, setSt] = React.useState(function () { return corpAgRead(); });
  const [led, setLed] = React.useState(function () { return corpLedgerRead(); });
  const [q, setQ] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [open, setOpen] = React.useState(true);
  const [vault, setVault] = React.useState(null);
  const [handle, setHandle] = React.useState(null);
  const endRef = React.useRef(null);

  const now = typeof corpOpsNow === "function" ? corpOpsNow() : null;
  const today = typeof corpOpsToday === "function" ? corpOpsToday(now) : "";
  const a = AI ? corpAgOf(AI) : null;
  /* 자기시험 — 러너가 돌리는 그 함수다(화면과 게이트가 다른 것을 보면 둘 다 못 믿는다) */
  const V = React.useMemo(function () { return corpAgPass(); }, []);
  const log = (st.log || {})[AI] || [];
  const greet = React.useMemo(
    function () { return AI ? corpAgGreet(AI, { who: t && t.own, now: now }) : null; },
    [AI, led]
  );
  const greetCanOrder = !!(greet && greet.canOrder);
  /* 지시 해석 자기시험 — 없앤 「업무 지시」 지면이 지고 있던 약속이다.
     말로 시키는 팀에서만 선다(지금은 회계팀뿐). */
  const OV = React.useMemo(function () {
    return (greetCanOrder && typeof corpOrdVerdict === "function") ? corpOrdVerdict(today) : null;
  }, [greetCanOrder, today]);

  /* 회계팀만 — 이어 둔 저장소를 미리 훑어 둔다(지시를 읽을 때 상황으로 넘긴다) */
  React.useEffect(function () {
    let gone = false;
    if (team !== "M2" || typeof cvfCan !== "function" || !cvfCan().ok) return;
    cvfHandle().then(function (h) {
      if (gone || !h) return;
      setHandle(h);
      return cvfPerm(h, false).then(function (p) {
        if (gone || p !== "granted") return;
        return cvfScan(h).then(function (S) { if (!gone) setVault(S); }).catch(function () {});
      });
    }).catch(function () {});
    return function () { gone = true; };
  }, [team]);

  React.useEffect(function () {
    if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: "end" });
  }, [log.length]);

  const fsFor = React.useCallback(function (iso) {
    if (!vault) return { linked: false };
    const sc = cvfScope(vault.rows, "M2");
    return { linked: true, scope: sc, match: iso ? cvfMatchDay(sc.rows, iso) : null, root: vault.root };
  }, [vault]);

  const send = function (text) {
    const s = String(text === undefined ? q : text).trim();
    if (!s || !a) return;
    const pre = (team === "M2" && typeof corpOrdParse === "function") ? corpOrdParse(s, today) : null;
    const r = corpAgAnswer(AI, s, {
      now: now, today: today,
      fs: pre ? fsFor(pre.date.iso) : undefined,
    });
    const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
    next.log[AI] = (next.log[AI] || []).concat([{ who: "me", t: s }, { who: "ai", r: r }]);
    corpAgWrite(next); setSt(next); setQ(""); setMsg(null);
    if (r.kind === "order" && typeof corpOrderRead === "function") {
      const t2 = corpOrderRead();
      t2.tasks = (t2.tasks || []).concat([{ id: corpOrdNextId(t2, r.order.iso, today), at: today, q: s, iso: r.order.iso, done: [] }]);
      corpOrderWrite(t2);
    }
  };

  /* 시키신 일을 집행한다 — 쪼개기까지가 AI, 승인은 사람 */
  const doReverse = function (iso) {
    const L = corpLedgerRead();
    const R = corpOrdReverse(corpJvAll(L), iso, today, L);
    if (!R.made.length) {
      setMsg({ bad: true, t: R.held.length ? "초안을 만들지 못했습니다 — " + R.held[0].why : iso + " 자 역분개할 전표가 없습니다" });
      return;
    }
    const next = Object.assign({}, L, { jv: (L.jv || []).concat(R.made) });
    corpLedgerWrite(next); setLed(next);
    setMsg({ bad: false, t: R.made.length + "건을 **역분개 초안**으로 올렸습니다(" + R.made.map(function (j) { return j.id; }).join(" · ") + "). "
      + "기표 상태입니다 — 재무현황 › 전표에서 **검토 · 승인**하셔야 장부에 반영됩니다. 승인은 제가 못 합니다." });
  };
  const doRebuild = function (iso) {
    const L = corpLedgerRead();
    const all = corpJvAll(L);
    const C = corpOrdCanRebuild(all, iso, L, today);
    if (!C.ok) { setMsg({ bad: true, t: "아직 못 합니다 — " + C.need.join(" · ") }); return; }
    const B = corpBjvBuild((L.bank || []).filter(function (l) { return l.d === iso; }), corpBjvRead(), L, all);
    if (!B.made.length) {
      setMsg({ bad: true, t: "다시 만들 줄이 없습니다 — " + (B.held.length ? "계정을 못 고른 줄 " + B.held.length + "건이 있습니다(은행 대사 지면에서 골라 주세요)" : "이미 모두 들어와 있습니다") });
      return;
    }
    const next = Object.assign({}, L, { jv: (L.jv || []).concat(B.made) });
    corpLedgerWrite(next); setLed(next);
    setMsg({ bad: false, t: B.made.length + "건을 다시 만들었습니다 — 기표 상태이니 전표 지면에서 검토 · 승인해 주세요." });
  };
  const doRefetch = async function (iso, pick) {
    if (!handle || !pick) { setMsg({ bad: true, t: "저장소에서 고를 파일이 정해지지 않았습니다 — 은행 대사 지면에서 골라 주세요" }); return; }
    setMsg({ bad: false, t: "「" + pick.name + "」을(를) 읽는 중입니다…" });
    try {
      const f = await cvfFile(handle, pick.rel);
      const buf = new Uint8Array(await f.slice(0, 4).arrayBuffer());
      const zip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
      let head = [], rows = [];
      if (zip) { const X = await cbxRead(f); head = X.rows[0] || []; rows = X.rows.slice(1); }
      else { const g = corpUpParseCsv(await f.text()); head = g.head || []; rows = g.rows || []; }
      rows = rows.filter(function (r) { return r.join("").trim(); });
      const hits = corpUpScan(rows, head);
      if (hits.length) { setMsg({ bad: true, t: "민감자료가 " + hits.length + "곳에서 걸렸습니다 — 읽기를 멈췄습니다." }); return; }
      const V2 = corpUpValidate("bank", head, rows, corpUpSuggest(head, corpUpSpec("bank")));
      const T2 = corpUpToBank(V2.ok);
      if (!T2.lines.length) throw new Error("읽을 은행줄이 없습니다");
      const CH = corpBjvChain(T2.lines);
      if (CH.n > 0 && !CH.ok) throw new Error("잔액이 " + CH.breaks.length + "군데 끊겨 있습니다 — 빠진 거래가 있는 자료로는 넣지 않습니다");
      const L = corpLedgerRead();
      const M = corpUpMergeBank(L.bank || [], T2.lines);
      const ds = T2.lines.map(function (x) { return x.d; }).sort();
      const next = Object.assign({}, L, { bank: M.lines,
        bankCov: { from: (L.bankCov && L.bankCov.from) || ds[0], to: ds[ds.length - 1], at: pick.name } });
      corpLedgerWrite(next); setLed(next);
      setMsg({ bad: false, t: "「" + pick.name + "」에서 " + T2.lines.length + "줄을 읽어 " + M.added + "줄 넣었습니다. "
        + "덮는 기간은 **" + ds[0] + " ~ " + ds[ds.length - 1] + "** 로 보았습니다 — 다르면 은행 대사 지면에서 고쳐 주세요." });
    } catch (e) { setMsg({ bad: true, t: (e && e.message) || "가져오지 못했습니다" }); }
  };
  const run = function (step, iso) {
    if (step.k === "reverse") return doReverse(iso);
    if (step.k === "rebuild") return doRebuild(iso);
    if (step.k === "refetch") return doRefetch(iso, step.pick);
    setMsg({ bad: true, t: "이 일은 제가 하지 못합니다." });
  };

  if (!a || !t) return null;

  return (
    <div className="tc-wrap" style={{ "--tc": t.c }}>
      <div className="tc-head" onClick={function () { setOpen(!open); }}>
        {typeof CorpAvatar === "function" && <CorpAvatar ai={AI} size={30} />}
        <div className="tc-id">
          <b>{corpAiKo(AI)}</b><span className="corp-ai">AI</span>
          <i>{t.name} · {t.aiWhy}</i>
        </div>
        <span className="tc-n">{a.noTool ? "도구 없음" : "도구 " + a.tools.length}</span>
        {greet && greet.canOrder && <span className="tc-order">말로 시킬 수 있습니다</span>}
        <button className="cl-rv">{open ? "접기" : "열기"}</button>
      </div>

      {open && (
        <div className="tc-body">
          {greet && (
            <div className="tc-greet">
              <div className="tc-hi">{greet.t}</div>
              <div className="tc-sub">{greet.body}</div>
              {greet.rows.length > 0 && (
                <table className="cl-tbl tc-tbl"><tbody>
                  {greet.rows.map(function (r, i) { return <tr key={i}><td className="k">{r[0]}</td><td>{r[1]}</td></tr>; })}
                </tbody></table>
              )}
              {/* ③ 업무 버튼 — 화면을 처음 보면 무슨 업무인지 한눈에 (조성래님 지시 2026-11-13).
                  이름만 키우면 이름만 커진다 — **무슨 일인지**가 버튼에 적혀야 한다. 뜻은 도구 원천의 d 에서 온다. */}
              {!a.noTool && (
                <React.Fragment>
                  <div className="tc-jobh">할 수 있는 업무 {a.tools.length}</div>
                  <div className="tc-jobs">
                    {a.tools.map(function (x) {
                      return (
                        <button key={x.k} className="tc-job" onClick={function () { send(x.ask[0]); }}>
                          <b>{x.ko}</b>{x.d ? <span>{x.d}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              )}

              {/* ①② 설명과 검산 배지는 눌렀을 때만 — **지우지 않는다, 접을 뿐이다.**
                  끝내지 못하는 일은 여기 안에 그대로 남는다 — 화면에 적은 제약과 실제 거절이 어긋나면 안 된다. */}
              <CorpDefn pad>
                <p className="tc-verds">
                  <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
                  {OV && <span className={"cl-verd" + (OV.pass ? " on" : " bad")}>지시 해석 {OV.rows.length - OV.fail.length - OV.zero.length} / {OV.rows.length}</span>}
                  {OV && <span className="ad-chip">기준일 {today || "—"}</span>}
                </p>
                {greet.canOrder && (
                  <p className="tc-can"><b>업무를 말로 시키셔도 됩니다.</b> 제가 할 수 있는 일은
                  <b> {greet.order.join(" · ")}</b> 입니다 — 시키시면 할 일로 나눠 드리고,
                  <b>승인 · 전기는 조성래님이</b> 하십니다.</p>
                )}
                {(t.cannot || []).length > 0 && (
                  <p className="tc-no">제가 <b>끝내지 못하는 일</b> — {(t.cannot || []).map(function (c) { return c.act; }).join(" · ")}.
                  화면에 적은 제약과 실제 거절이 어긋나지 않게, 이 목록은 조직 원천에서 그대로 옵니다.
                  <b> 다만 물음은 거절하지 않습니다</b> — 「승인 누가 해?」는 승인해 달라는 말이 아니라
                  묻는 말입니다. 물어보는 것까지 막으면 아무것도 알 수 없습니다.</p>
                )}
              </CorpDefn>
            </div>
          )}

          {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={function () { setMsg(null); }}>{msg.t}</div>}

          <div className="ag-log tc-log">
            {log.map(function (m, i) {
              if (m.who === "me") return <div key={i} className="ag-me">{m.t}</div>;
              const r = m.r || {};
              const iso = r.order ? r.order.iso : "";
              return (
                <div key={i} className={"ag-ai k-" + (r.kind || "none")}>
                  <div className="ag-t">
                    {r.kind === "ok" && <span className="ag-tag ok">{r.tool}</span>}
                    {r.kind === "refuse" && <span className="ag-tag no">못 하는 일</span>}
                    {r.kind === "ask" && <span className="ag-tag none">되묻습니다</span>}
                    {r.kind === "order" && <span className="ag-tag ok">할 일 {r.order.steps.length}</span>}
                    {r.kind === "notool" && <span className="ag-tag none">도구 없음</span>}
                    {r.kind === "fail" && <span className="ag-tag none">원천 못 읽음</span>}
                    {r.t}
                  </div>
                  {r.rows && r.rows.length > 0 && (
                    <table className="cl-tbl ag-tbl"><tbody>
                      {r.rows.map(function (row, j) { return <tr key={j}><td>{row[0]}</td><td className="n">{row[1]}</td></tr>; })}
                    </tbody></table>
                  )}
                  {r.tools && r.tools.length > 0 && <div className="ag-sug">제가 할 수 있는 일 — {r.tools.join(" · ")}</div>}
                  {r.kind === "order" && (
                    <div className="wo-steps">
                      {r.order.steps.map(function (s, j) {
                        const live = i === log.length - 1;
                        return (
                          <div key={j} className={"wo-step" + (s.can ? " on" : "") + (s.who === "human" ? " hu" : "")}>
                            <div className="wo-hd">
                              <span className="wo-n">{j + 1}</span><b>{s.ko}</b>
                              <span className={"wo-who " + s.who}>{s.who === "ai" ? corpAiKo(AI) + "이 합니다" : (t.own ? t.own + "님이 하셔야 합니다" : "책임자가 하셔야 합니다")}</span>
                              {s.n !== null && s.n !== undefined && <span className="wo-cnt">{s.n}건</span>}
                            </div>
                            <p className="wo-d">{s.d}</p>
                            {!s.can && s.why && <p className="wo-why">{s.why}</p>}
                            {(s.note || []).map(function (x, k) { return <p key={k} className="wo-note">· {x}</p>; })}
                            <div className="wo-act">
                              {s.who === "ai" && (
                                <button className="cl-save" disabled={!s.can || !live} onClick={function () { run(s, iso); }}>
                                  {s.k === "reverse" ? "역분개 초안 만들기"
                                    : (s.k === "refetch" ? "저장소에서 가져오기" + (s.pick ? " — " + s.pick.name : "") : "전표 다시 만들기")}
                                </button>
                              )}
                              {s.who === "human" && (
                                <button className="cl-rv" onClick={function () { if (typeof onTab === "function") onTab(s.k === "refetch" ? "bank" : "jv"); }}>
                                  어디서 하나요
                                </button>
                              )}
                              {!live && <span className="cl-t">지난 지시입니다 — 다시 말씀하시면 지금 상태로 새로 셉니다</span>}
                            </div>
                          </div>
                        );
                      })}
                      <p className="cl-note">만든 전표는 <b>기표 상태</b>로 앉습니다 — 재무현황 › 전표에서
                        <b> 검토 · 승인</b>하셔야 장부에 올라갑니다. 승인은 제가 하지 못합니다(작성자 ≠ 승인자).</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="ag-input tc-input">
            <input value={q}
              placeholder={a.noTool ? "도구가 없어 답하지 못합니다" : (greet && greet.canOrder ? "물어보시거나, 시키세요 — 예: 11월 11일 은행 전표 역분개해 줘" : "물어보세요")}
              onChange={function (e) { setQ(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") send(); }} />
            <button className="cl-save" onClick={function () { send(); }}>보내기</button>
            {log.length > 0 && <button className="cl-rv" onClick={function () {
              const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
              next.log[AI] = []; corpAgWrite(next); setSt(next);
            }}>대화 지우기</button>}
          </div>
        </div>
      )}
    </div>
  );
}
