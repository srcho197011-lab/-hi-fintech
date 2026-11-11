/* ══════════════ AI 팀장 대화창(CorpAgentChat.jsx) · CorpOps (형 지시 2026-11-12) ══════════════
   사람 직원이 AI 팀장과 이야기하는 자리. 총괄운영의 일곱째 뷰다.
   왼쪽에 여덟 명, 오른쪽에 그 사람과의 대화 — 대화는 **에이전트별로 따로** 남는다.

   이 화면이 지키는 것
     · **도구가 있는 것만 답한다.** 사내용 언어모델이 붙어 있지 않다 —
       그럴듯한 문장을 지어낼 수단 자체를 두지 않았다. 등록된 도구를 실제로 돌려 나온 값만 말한다.
     · **못 하는 일을 시키면 거절한다.** 거절 사유는 조직 원천(corpOrg.js cannot)에서 그대로 온다 —
       화면에 적은 제약과 실제 거절이 어긋나지 않게.
     · **물음은 거절하지 않는다.** 「릴리스 승인 누가 해?」는 승인해 달라는 말이 아니다.
       물어보는 것까지 막으면 쓸 수 없는 도구가 된다.
     · 사내 도구가 없는 에이전트는 **없다고 말한다.** 헬시·인슈러는 회원 데이터를 보지 않는다 —
       회원 축과 사내 축의 경계를 지키는 자리다. */

function CorpAgentChatSection() {
  const list = React.useMemo(function () { return corpAgList(); }, []);
  const [sel, setSel] = React.useState(list.length ? list[0].ai : "");
  const [st, setSt] = React.useState(function () { return corpAgRead(); });
  const [q, setQ] = React.useState("");
  const V = React.useMemo(function () { return corpAgPass(); }, []);
  const a = corpAgOf(sel);
  const log = (st.log || {})[sel] || [];
  const endRef = React.useRef(null);

  React.useEffect(function () {
    if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: "end" });
  }, [sel, log.length]);

  const send = function (text) {
    const s = String(text === undefined ? q : text).trim();
    if (!s || !a) return;
    const r = corpAgAnswer(sel, s);
    const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
    next.log[sel] = (next.log[sel] || []).concat([{ who: "me", t: s }, { who: "ai", r: r }]);
    corpAgWrite(next); setSt(next); setQ("");
  };
  const clear = function () {
    const next = Object.assign({}, st, { log: Object.assign({}, st.log) });
    next.log[sel] = [];
    corpAgWrite(next); setSt(next);
  };

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>AI 팀장 대화</b><span className="cl-sub">사람 직원 ↔ AI 팀장 {list.length}명</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">도구 {CORP_AG_TOOL.length}종</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        <b>도구가 있는 것만 답합니다.</b> 이 제품에는 사내용 언어모델이 붙어 있지 않습니다 —
        그럴듯한 문장을 지어낼 수단 자체를 두지 않았습니다. 등록된 도구를 <b>실제로 돌려</b> 나온 값만 말하고,
        도구가 없으면 없다고 말합니다.
        <span className="cl-warn2">
          못 하는 일을 시키면 거절합니다. 거절 사유는 조직도의 「사람이 마무리」 목록에서 그대로 옵니다 —
          화면에 적은 제약과 실제 거절이 어긋나면 둘 다 못 믿게 됩니다.
        </span>
      </div>

      <div className="ag-wrap">
        <div className="ag-side">
          {list.map(function (x) {
            return (
              <button key={x.ai} className={"ag-who" + (x.ai === sel ? " on" : "")} style={{ "--tc": x.c }}
                onClick={function () { setSel(x.ai); }}>
                {typeof CorpAvatar === "function" && <CorpAvatar ai={x.ai} size={30} title={x.ai} />}
                <span className="ag-n" style={{ color: x.c }}>{x.ai}</span>
                <span className="corp-ai">AI</span>
                <i>{x.sh}</i>
                <em className={x.noTool ? "none" : ""}>{x.noTool ? "도구 없음" : "도구 " + x.tools.length}</em>
              </button>
            );
          })}
        </div>

        <div className="ag-main">
          {a && (
            <div className="ag-head" style={{ "--tc": a.c }}>
              <div className="ag-hn"><b style={{ color: a.c }}>{a.ai}</b><span className="corp-ai">AI</span>
                <i>{a.sh}팀 · {a.why}</i></div>
              <div className="ag-pair">사람 책임자 <b>{a.own}</b>{a.head === 0 && <em>합류 전</em>}</div>
              <button className="cl-rv" onClick={clear}>대화 지우기</button>
            </div>
          )}

          {a && (
            <div className="ag-cap">
              <div className="ag-capb">
                <span className="ag-k">끝까지 하는 일</span>
                {a.can.map(function (c, i) { return <span key={i} className="ag-chip">{c}</span>; })}
              </div>
              <div className="ag-capb">
                <span className="ag-k no">사람이 마무리</span>
                {a.cannot.map(function (c, i) { return <span key={i} className="ag-chip no" title={c.by}>{c.act}</span>; })}
              </div>
              <div className="ag-capb">
                <span className="ag-k tool">돌릴 수 있는 도구</span>
                {a.noTool
                  ? <span className="ag-none">{a.noWhy}</span>
                  : a.tools.map(function (t) {
                    return <button key={t.k} className="ag-chip tool" onClick={function () { send(t.ask[0]); }}>{t.ko}</button>;
                  })}
              </div>
            </div>
          )}

          <div className="ag-log">
            {!log.length && (
              <div className="ag-hint">
                {a && a.noTool
                  ? <span>{a.ai}에게는 사내 조회 도구가 없습니다. {a.noWhy}</span>
                  : <span>위의 도구 이름을 누르거나, 물어보세요. 예 — 「미대사 몇 건이야」 · 「손익 어때」 · 「다음 회의 언제」</span>}
              </div>
            )}
            {log.map(function (m, i) {
              if (m.who === "me") return <div key={i} className="ag-me">{m.t}</div>;
              const r = m.r || {};
              return (
                <div key={i} className={"ag-ai k-" + (r.kind || "none")}>
                  <div className="ag-t">
                    {r.kind === "ok" && <span className="ag-tag ok">{r.tool}</span>}
                    {r.kind === "refuse" && <span className="ag-tag no">거절</span>}
                    {r.kind === "notool" && <span className="ag-tag none">도구 없음</span>}
                    {r.kind === "fail" && <span className="ag-tag none">원천 못 읽음</span>}
                    {r.t}
                  </div>
                  {r.rows && r.rows.length > 0 && (
                    <table className="cl-tbl ag-tbl"><tbody>
                      {r.rows.map(function (row, j) { return <tr key={j}><td>{row[0]}</td><td className="n">{row[1]}</td></tr>; })}
                    </tbody></table>
                  )}
                  {r.tools && r.tools.length > 0 && (
                    <div className="ag-sug">쓸 수 있는 것 — {r.tools.join(" · ")}</div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="ag-input">
            <input value={q} placeholder={a && a.noTool ? "도구가 없어 답하지 못합니다" : "물어보세요"}
              onChange={function (e) { setQ(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") send(); }} />
            <button className="cl-go" onClick={function () { send(); }}>보내기</button>
          </div>
        </div>
      </div>

      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">검산 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
          <table className="cl-tbl id">
            <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
            <tbody>
              {V.rows.map(function (r) {
                return (
                  <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
                    <td>{r.ko}</td><td className="n">{r.n}건</td><td className="n">{r.got}</td>
                    <td className="n">{r.want}</td>
                    <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="cl-note">「지어내지 않는다」는 음성 명제라 그냥 두면 증명되지 않습니다 —
            <b>도구 없는 에이전트에게 실제로 물어보고</b> 답을 만들어 내지 않는지 셉니다.
            반대로 도구 있는 에이전트가 늘 모른다고 해도 쓸모없으므로, 실제 값을 내는지도 함께 봅니다.</p>
        </div>
      </div>
    </div>
  );
}
