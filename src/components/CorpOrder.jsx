/* ══════════════ 업무 지시(CorpOrder.jsx) · 회계팀 보드 (형 지시 2026-11-12) ══════════════
   「회계팀 대시보드 안에서 핀테크 팀장에게 대화로 업무를 진행하는 시스템.」

   이 화면이 지키는 것
     · **쪼개기까지가 핀테크, 승인은 형.** 조직 원천(corpOrg M2 cannot)이 「전표 승인」·
       「월마감 확정」·「전표 삭제」를 못 하는 일로 적어 두었다. 지시를 받았다고 넘지 않는다.
     · **단계마다 누가 하는지 적는다.** 형 지시 한 문장에 성격이 다른 셋이 들어 있다 —
       역분개(핀테크가 초안까지) · 은행 내역 다시 받기(형이 올려야 한다) · 전표 다시 만들기
       (앞 둘이 끝나야 한다). 뭉뚱그리면 누가 멈춰 있는지 아무도 모른다.
     · **못 알아들으면 되묻는다.** 날짜를 지어내지 않는다. 알아들은 것은 되읽어 준다.
     · **반쯤 하다 멈춘 자리가 남는다.** 지시는 며칠 걸릴 수 있다. 브라우저를 닫아도 남는다. */

function CorpOrderSection({ onTab }) {
  const AI = "핀테크";
  const [st, setSt] = React.useState(function () { return corpAgRead(); });
  const [task, setTask] = React.useState(function () { return corpOrderRead(); });
  const [led, setLed] = React.useState(function () { return corpLedgerRead(); });
  const [q, setQ] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  /* ⚠️ 저장소를 읽는 일은 비동기인데 답하는 함수는 동기다. 그래서 **미리 훑어 둔 것**을
     상황으로 넘긴다 — 안 훑었으면 「안 이어져 있다」로 답한다(지어내지 않는다). */
  const [vault, setVault] = React.useState(null);
  const [handle, setHandle] = React.useState(null);
  const endRef = React.useRef(null);

  const now = typeof corpOpsNow === "function" ? corpOpsNow() : null;
  const today = typeof corpOpsToday === "function" ? corpOpsToday(now) : "";
  const a = corpAgOf(AI);
  const log = (st.log || {})[AI] || [];
  const V = React.useMemo(function () { return corpOrdVerdict(today); }, [today]);
  const jvs = React.useMemo(function () { return corpJvAll(led); }, [led]);

  /* 이어 둔 폴더가 있으면 **회계팀 폴더(02.회계)** 안을 미리 훑어 둔다 — 형 지시대로
     회계 지면은 늘 거기와 이어져 있다. 못 하는 브라우저면 조용히 넘어가지 않고 그대로 둔다. */
  React.useEffect(function () {
    let gone = false;
    if (!cvfCan().ok) return;
    cvfHandle().then(function (h) {
      if (gone || !h) return;
      setHandle(h);
      return cvfPerm(h, false).then(function (p) {
        if (gone || p !== "granted") return;
        return cvfScan(h).then(function (S) { if (!gone) setVault(S); }).catch(function () {});
      });
    }).catch(function () {});
    return function () { gone = true; };
  }, []);

  /* 지시를 읽을 때 넘길 저장소 상황 — 날짜가 정해져야 「그날 것」을 셀 수 있다 */
  const fsFor = React.useCallback(function (iso) {
    if (!vault) return { linked: false };
    const sc = cvfScope(vault.rows, "M2");
    const match = iso ? cvfMatchDay(sc.rows, iso) : null;
    return { linked: true, scope: sc, match: match, root: vault.root };
  }, [vault]);

  React.useEffect(function () {
    if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: "end" });
  }, [log.length]);

  const send = function (text) {
    const s = String(text === undefined ? q : text).trim();
    if (!s) return;
    /* 날짜를 먼저 읽어 **그날 것**을 세어 넘긴다 — 날짜 없이는 저장소를 뒤져도 뜻이 없다 */
    const pre = corpOrdParse(s, today);
    const r = corpAgAnswer(AI, s, { now: now, today: today, fs: fsFor(pre.date.iso) });
    const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
    next.log[AI] = (next.log[AI] || []).concat([{ who: "me", t: s }, { who: "ai", r: r }]);
    corpAgWrite(next); setSt(next); setQ(""); setMsg(null);
    /* 지시로 읽힌 것은 **따로 적는다** — 대화는 40턴만 남기고 잘린다 */
    if (r.kind === "order") {
      const t2 = corpOrderRead();
      const id = corpOrdNextId(t2, r.order.iso, today);
      t2.tasks = (t2.tasks || []).concat([{ id: id, at: today, q: s, iso: r.order.iso, done: [] }]);
      corpOrderWrite(t2); setTask(t2);
    }
  };

  /* 역분개 초안 만들기 — 핀테크가 할 수 있는 데까지 */
  const doReverse = function (iso) {
    const L = corpLedgerRead();
    const all = corpJvAll(L);
    const R = corpOrdReverse(all, iso, today, L);
    if (!R.made.length) {
      setMsg({ bad: true, t: R.held.length
        ? "초안을 만들지 못했습니다 — " + R.held[0].why
        : iso + " 자 역분개할 전표가 없습니다." });
      return;
    }
    const next = Object.assign({}, L, { jv: (L.jv || []).concat(R.made) });
    corpLedgerWrite(next); setLed(next);
    setMsg({ bad: false, t: R.made.length + "건을 **역분개 초안**으로 올렸습니다(" + R.made.map(function (j) { return j.id; }).join(" · ") + "). "
      + "아직 기표 상태입니다 — 전표 지면에서 **검토 · 승인**하셔야 장부에 반영됩니다. 승인은 제가 못 합니다." });
  };

  /* 전표 다시 만들기 — 선행조건 둘이 다 설 때만 */
  const doRebuild = function (iso) {
    const L = corpLedgerRead();
    const all = corpJvAll(L);
    const C = corpOrdCanRebuild(all, iso, L, today);
    if (!C.ok) { setMsg({ bad: true, t: "아직 못 합니다 — " + C.need.join(" · ") }); return; }
    const lines = (L.bank || []).filter(function (l) { return l.d === iso; });
    const B = corpBjvBuild(lines, corpBjvRead(), L, all);
    if (!B.made.length) {
      setMsg({ bad: true, t: "다시 만들 줄이 없습니다 — " + (B.held.length ? "계정을 못 고른 줄 " + B.held.length + "건이 있습니다(은행 대사 지면에서 골라 주세요)" : "이미 모두 들어와 있습니다") });
      return;
    }
    const next = Object.assign({}, L, { jv: (L.jv || []).concat(B.made) });
    corpLedgerWrite(next); setLed(next);
    setMsg({ bad: false, t: B.made.length + "건을 다시 만들었습니다(" + B.made.map(function (j) { return j.id; }).join(" · ") + "). "
      + (B.held.length ? "계정을 못 고른 " + B.held.length + "줄은 남겨 두었습니다. " : "")
      + "기표 상태이니 전표 지면에서 검토 · 승인해 주세요." });
  };

  /* 은행 내역 가져오기 — 저장소에서 읽어 **은행 대사와 같은 길**로 넣는다.
     ⚠️ 민감자료 검사를 건너뛰지 않는다. 길이 둘인데 한쪽만 막으면 막는 것이 아니다. */
  const doRefetch = async function (iso, pick) {
    if (!handle) { setMsg({ bad: true, t: "이어 둔 저장소 폴더가 없습니다 — 은행 대사 지면에서 한 번 이어 주세요" }); return; }
    if (!pick) { setMsg({ bad: true, t: "어느 파일인지 정해지지 않았습니다 — 은행 대사 지면에서 골라 주세요" }); return; }
    setMsg({ bad: false, t: "「" + pick.name + "」을(를) 읽는 중입니다…" });
    try {
      const f = await cvfFile(handle, pick.rel);
      const buf = new Uint8Array(await f.slice(0, 4).arrayBuffer());
      const zip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
      let head = [], rows = [];
      if (zip) { const X = await cbxRead(f); head = X.rows[0] || []; rows = X.rows.slice(1); }
      else { const g = corpUpParseCsv(await f.text()); head = g.head || []; rows = g.rows || []; }
      rows = rows.filter(function (r) { return r.join("").trim(); });
      if (head.length < 2 || !rows.length) throw new Error("표를 읽지 못했습니다");
      const hits = corpUpScan(rows, head);
      if (hits.length) {
        setMsg({ bad: true, t: "민감자료가 " + hits.length + "곳에서 걸렸습니다 — 읽기를 멈췄습니다. 그 열을 떼고 다시 해 주세요." });
        return;
      }
      const map = corpUpSuggest(head, corpUpSpec("bank"));
      const Vv = corpUpValidate("bank", head, rows, map);
      if (Vv.missing.length) throw new Error(Vv.msg);
      const T = corpUpToBank(Vv.ok);
      if (!T.lines.length) throw new Error("읽을 은행줄이 없습니다");
      const CH = corpBjvChain(T.lines);
      if (CH.n > 0 && !CH.ok) throw new Error("잔액이 " + CH.breaks.length + "군데 끊겨 있습니다 — 빠진 거래가 있는 자료로는 넣지 않습니다");
      const L = corpLedgerRead();
      const M = corpUpMergeBank(L.bank || [], T.lines);
      const ds = T.lines.map(function (x) { return x.d; }).sort();
      const cov = { from: (L.bankCov && L.bankCov.from) || ds[0], to: ds[ds.length - 1] > ((L.bankCov && L.bankCov.to) || "") ? ds[ds.length - 1] : (L.bankCov && L.bankCov.to) || ds[ds.length - 1], at: pick.name };
      const next = Object.assign({}, L, { bank: M.lines, bankCov: cov });
      corpLedgerWrite(next); setLed(next);
      setMsg({ bad: false, t: "「" + pick.name + "」에서 " + T.lines.length + "줄을 읽어 " + M.added + "줄 넣었습니다"
        + (M.dup ? "(이미 받은 " + M.dup + "줄은 건너뜀)" : "") + ". "
        + "이 자료가 덮는 기간은 **" + ds[0] + " ~ " + ds[ds.length - 1] + "** 로 보았습니다 — 다르면 은행 대사 지면에서 고쳐 주세요. "
        + (CH.n > 0 ? "잔액 사슬 " + CH.n + "쌍 전건 성립." : "잔액 열이 없어 사슬은 확인하지 못했습니다.") });
    } catch (e) {
      setMsg({ bad: true, t: (e && e.message) || "가져오지 못했습니다" });
    }
  };

  const run = function (step, iso) {
    if (step.k === "reverse") return doReverse(iso);
    if (step.k === "rebuild") return doRebuild(iso);
    if (step.k === "refetch") return doRefetch(iso, step.pick);
    setMsg({ bad: true, t: "이 일은 제가 하지 못합니다." });
  };

  const EX = [
    "11월 11일 전표를 모두 역분개하고 은행 거래내역을 다시 받아서 다시 전표를 만들어 줘",
    "어제 은행 전표 역분개해 줘",
    "11월 11일 전표 다시 만들어 줘",
  ];

  return (
    <div className="cl-wrap wo-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>업무 지시</b><span className="cl-sub">{AI}에게 말로 시킵니다</span>
          <span className="wo-badge">AI</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">기준일 {today || "—"}</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        <b>쪼개기까지가 {AI}, 승인은 형이 하십니다.</b> 시키신 일을 할 일로 나누고, 단계마다 <b>누가 하는지</b>를 적습니다.
        전표 승인 · 월마감 확정 · 전표 삭제는 제가 못 합니다 — 조직에 그렇게 적혀 있습니다.
        <span className="cl-warn2">
          <b>못 알아들으면 되묻습니다.</b> 날짜를 지어내지 않고, 모르는 일을 비슷한 것으로 바꾸지 않습니다.
          제가 아는 일은 <b>{corpOrdActs().join(" · ")}</b> 뿐입니다.
          그리고 <b>은행 계좌를 직접 열지 못합니다</b> — 내려받아 올리시는 일은 형 몫입니다.
        </span>
      </div>

      <div className="cl-body">
        {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={function () { setMsg(null); }}>{msg.t}</div>}

        <div className="cl-sec">
          <div className="cl-h">대화 <span className="cl-t">시키신 말을 할 일로 나눕니다</span>
            {log.length > 0 && <button className="cl-rv" onClick={function () {
              const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
              next.log[AI] = []; corpAgWrite(next); setSt(next);
            }}>대화 지우기</button>}
          </div>

          <div className="ag-log wo-log">
            {!log.length && (
              <div className="ag-hint">
                이렇게 말씀해 보세요 —
                {EX.map(function (x, i) {
                  return <button key={i} className="ag-chip tool wo-ex" onClick={function () { send(x); }}>{x}</button>;
                })}
              </div>
            )}
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
                        const live = i === log.length - 1;      /* 가장 마지막 지시에서만 집행한다 */
                        return (
                          <div key={j} className={"wo-step" + (s.can ? " on" : "") + (s.who === "human" ? " hu" : "")}>
                            <div className="wo-hd">
                              <span className="wo-n">{j + 1}</span>
                              <b>{s.ko}</b>
                              <span className={"wo-who " + s.who}>{s.who === "ai" ? AI + "가 합니다" : "형이 하셔야 합니다"}</span>
                              {s.n !== null && s.n !== undefined && <span className="wo-cnt">{s.n}건</span>}
                            </div>
                            <p className="wo-d">{s.d}</p>
                            {!s.can && s.why && <p className="wo-why">{s.why}</p>}
                            {(s.note || []).map(function (x, k) { return <p key={k} className="wo-note">· {x}</p>; })}
                            <div className="wo-act">
                              {s.who === "ai" && (
                                <button className="cl-save" disabled={!s.can || !live}
                                  onClick={function () { run(s, iso); }}>
                                  {s.k === "reverse" ? "역분개 초안 만들기"
                                    : (s.k === "refetch" ? "저장소에서 가져오기 — " + (s.pick ? s.pick.name : "") : "전표 다시 만들기")}
                                </button>
                              )}
                              {s.k === "refetch" && (s.list || []).length > 0 && (
                                <span className="cl-t">고를 거리 {(s.list || []).length}건 — 은행 대사 지면에서 골라 주세요</span>
                              )}
                              {s.who === "human" && (
                                <button className="cl-rv" onClick={function () { if (typeof onTab === "function") onTab("corpBank"); setMsg({ bad: false, t: "재무현황 지면의 **은행 대사** 탭에서 올리시면 됩니다." }); }}>
                                  어디서 올리나요
                                </button>
                              )}
                              {!live && <span className="cl-t">지난 지시입니다 — 다시 말씀하시면 지금 상태로 새로 셉니다</span>}
                            </div>
                          </div>
                        );
                      })}
                      <p className="cl-note">만든 전표는 <b>기표 상태</b>로 앉습니다 — 재무현황 › 전표에서 <b>검토 · 승인</b>하셔야 장부에 올라갑니다.
                        승인은 제가 하지 못합니다(작성자 ≠ 승인자).</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="ag-input wo-input">
            <input value={q} placeholder="무엇을 할까요 — 예: 11월 11일 은행 전표 역분개해 줘"
              onChange={function (e) { setQ(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") send(); }} />
            <button className="cl-save" onClick={function () { send(); }}>보내기</button>
          </div>
        </div>

        <div className="cl-grid2">
          <div className="cl-sec">
            <div className="cl-h">받은 지시 <span className="cl-t">{(task.tasks || []).length}건</span></div>
            {!(task.tasks || []).length && <p className="cl-note">아직 받은 지시가 없습니다.</p>}
            {(task.tasks || []).slice(-8).reverse().map(function (t) {
              return (
                <div key={t.id} className="wo-task">
                  <span className="id">{t.id}</span>
                  <span className="wo-iso">{t.iso}</span>
                  <span className="desc">{t.q}</span>
                </div>
              );
            })}
            <p className="cl-note">지시는 <b>대화와 따로</b> 적어 둡니다 — 대화는 40턴만 남기고 잘려서,
              며칠 걸리는 일이 사라집니다.</p>
          </div>

          <div className="cl-sec">
            <div className="cl-h">지금 장부 <span className="cl-t">지시가 보는 바탕</span></div>
            <div className="cl-stat">
              <div className={vault ? "" : "hold"}><b>{vault ? cvfScope(vault.rows, "M2").n : "—"}</b><span>저장소 02.회계</span></div>
              <div><b>{jvs.length}</b><span>전표</span></div>
              <div><b>{corpPosted(jvs, "").length}</b><span>전기</span></div>
              <div><b>{((led && led.bank) || []).length}</b><span>은행줄</span></div>
              <div><b>{led && led.bankCov && led.bankCov.to ? led.bankCov.to : "—"}</b><span>은행 반입 끝</span></div>
            </div>
            <p className="cl-note">{vault
              ? <span>저장소 <b>{vault.root}</b> 와 이어져 있습니다 — 회계 지면은 <b>02.회계</b> 안만 봅니다. </span>
              : <span>저장소 폴더가 아직 이어져 있지 않습니다 — 은행 대사 지면에서 한 번 이어 주시면 제가 찾아 가져옵니다. </span>}</p>
            <p className="cl-note">{corpJvLive(led)
              ? "반입된 실제 전표를 보고 있습니다."
              : "지금은 검증용 전표입니다 — 실제 전표가 반입되면 그것을 봅니다."}</p>
          </div>
        </div>

        <div className="cl-sec">
          <div className="cl-h">검산 <span className="cl-t">화면과 커밋 게이트 러너가 같은 함수를 봅니다</span></div>
          <table className="cl-tbl id">
            <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
            <tbody>
              {V.rows.map(function (r) {
                return (
                  <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
                    <td>{r.ko}</td><td className="n">{r.n}건</td><td className="n">{r.got}</td><td className="n">{r.want}</td>
                    <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="cl-note"><b>알아듣는 것만 세지 않습니다.</b> 못 알아들었을 때 되묻는지,
            없는 날짜를 만들지 않는지도 함께 셉니다 — 알아듣는 것만 세면 아무 말이나 받는 코드가 만점을 받습니다.</p>
        </div>
      </div>
    </div>
  );
}
