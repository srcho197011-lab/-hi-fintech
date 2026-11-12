/* ══════════════ 예실 대비 — 두 축 대조 화면(CorpPlanActual.jsx) · CorpOps Phase 6 (조성래님 지시 2026-11-11) ══════════════
   회계팀(M2)의 셋째 지면. 계획 축(재무계획)과 실적 축(재무현황)을 맞댄다.

   이 화면이 지키는 것
     · **대응표가 본체다.** 차이·달성률 칸은 세 조건이 모두 설 때만 숫자가 된다 —
       ① 두 축이 겹치는 달 ② 계획 준비기간이 아님 ③ 매핑이 확정이고 계획 > 0.
       지금 자료로는 한 줄도 서지 않는다. 그게 정직한 결과이고, 화면이 그 이유를 적는다.
     · 「대응 없음」을 한 말로 덮지 않는다 — 대응 없음 / 확정 대기 / 양쪽 없음을 나눠 적는다.
     · 실적은 **전표에서 올라온 값만**이다. 재무계획 화면의 환산층(계획 × 0.49)을 쓰지 않는다.
     · 계획 금액 옆에 **시나리오 이름**을 적는다 — 시나리오를 바꾸면 계획이 통째로 달라진다.
     · 계획 객체를 고치지 않는다(캐시된 같은 객체라 재무계획 화면이 같이 오염된다).
     · 검산은 러너와 같은 함수(corpPaVerdict)를 부른다.

   ⚠️ 계정 후보는 AI가 **제안**한 것이고 확정이 아니다. 확정과 차이의 원인은 사람이 정한다. */

function CorpPlanActualSection() {
  const [st] = React.useState(() => (typeof corpLedgerRead === "function" ? corpLedgerRead() : { jv: [], closed: [], ov: {} }));
  const jvs = React.useMemo(() => (typeof corpJvAll === "function" ? corpJvAll(st) : []), [st]);
  const months = React.useMemo(() => corpPaMonths(jvs), [jvs]);
  const [cal, setCal] = React.useState("");
  const cur = cal || months[months.length - 1] || "";
  const P = React.useMemo(() => corpPaPlanAll(), []);
  const planRow = React.useMemo(() => (cur ? corpPaPlanRow(cur, P) : null), [cur, P]);
  const rows = React.useMemo(() => (cur ? corpPaRows(jvs, cur) : []), [jvs, cur]);
  const U = React.useMemo(() => corpPaUnmatched(jvs, cur), [jvs, cur]);
  const V = React.useMemo(() => corpPaPass(jvs, cur), [jvs, cur]);
  const act = React.useMemo(() => (cur ? corpPaActual(jvs, cur) : {}), [jvs, cur]);
  const cmp = rows.filter((r) => r.why === null);

  const W = (k) => (CORP_PA_WHY[k] || { ko: "—", d: "" });
  const num = (v) => (v === null || v === undefined ? "—" : corpWon(v));

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl">
          <b>예실 대비</b><span className="cl-sub">계획 축 ↔ 실적 축</span>
          <span className="cl-pilot">파일럿 전표</span>
        </div>
        <div className="cl-ctl">
          <label>비교 월
            <select value={cur} onChange={(e) => setCal(e.target.value)} disabled={!months.length}>
              {!months.length && <option value="">겹치는 달 없음</option>}
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          {P && <span className="pa-scn">계획 시나리오 <b>{P.scnKo || P.scn}</b></span>}
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>
            검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}
          </span>
        </div>
      </div>

      {/* ── 두 축의 전제 — 금액보다 먼저 온다 ── */}
      <div className="pa-axis">
        <div><span className="pa-ak">{CORP_PA_AXIS.plan.ko}</span><b>{CORP_PA_AXIS.plan.src}</b>
          <i>{CORP_PA_AXIS.plan.note}</i></div>
        <div><span className="pa-ak act">{CORP_PA_AXIS.act.ko}</span><b>{CORP_PA_AXIS.act.src}</b>
          <i>{CORP_PA_AXIS.act.note}</i></div>
      </div>

      <div className="cl-warn">
        두 축은 <b>산정 기준이 다릅니다</b> — 같은 장부가 아닙니다. 겹치는 달은{" "}
        <b>{months.length ? months.join(" · ") : "없습니다"}</b>
        {planRow && planRow.idx < 1 && <span>{" "}뿐이고, 그 달은 계획에서 <b>준비기간</b>이라 손익 밖입니다
          (비용이 결손금으로만 쌓입니다).</span>}
        <span className="cl-warn2">
          그래서 지금 <b>차이 칸이 {cmp.length}줄</b> 섭니다. 자료가 덜 들어온 것이 아니라,
          두 축이 아직 만나지 않은 것입니다. 실데이터 반입(Phase 10) 뒤 겹치는 달이 생기면 같은 표가 그대로 숫자를 냅니다.
        </span>
      </div>

      {!P && (
        <div className="cl-body"><div className="cl-sec">
          <div className="cl-h">계획 축 미연결</div>
          <p className="cl-note">재무 엔진을 불러오지 못했습니다. 계획 값 없이는 대조가 서지 않습니다.</p>
        </div></div>
      )}

      {P && (
        <div className="cl-body">
          {/* ── 집계 ── */}
          <div className="cl-kpis">
            <div><b>{U.planOk.length} / {U.leaves}</b><span>계획 비목 — 대응 확정</span></div>
            <div><b>{U.acctOk.length} / {U.accts}</b><span>손익 계정 — 대응 확정</span></div>
            <div className={U.planAsk.length + U.planNone.length ? "neg" : ""}>
              <b>{U.planAsk.length + U.planNone.length}</b><span>계획 쪽 대응 없음</span></div>
            <div className={U.acctAsk.length + U.acctNone.length ? "neg" : ""}>
              <b>{U.acctAsk.length + U.acctNone.length}</b><span>장부 쪽 대응 없음</span></div>
            <div><b>{cmp.length}</b><span>차이 산출 가능</span></div>
          </div>

          {/* ── 검산 ── */}
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
          </div>

          {/* ── 대조표 ── */}
          <div className="cl-sec">
            <div className="cl-h">계정 대응표 <span className="cl-t">{cur || "비교 월 없음"} 단월</span>
              <span className="cl-flag">확정 {U.planOk.length} · 확정 대기 {U.planAsk.length} · 대응 없음 {U.planNone.length}</span></div>
            <table className="cl-tbl pa">
              <thead><tr><th>계획 비목</th><th>대응 계정</th><th>계획</th><th>실적</th><th>차이</th><th>달성률</th><th>사유</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.k} className={"pa-" + r.st}>
                    <td>{r.label}
                      {r.st === "ok" && r.scope && <i className="pa-scope" title={r.scope}>범위 차이</i>}</td>
                    <td className="id">
                      {r.acct.length
                        ? r.acct.map((c) => <span key={c} className={"pa-ac " + r.st}>{c} {corpAcctName(c)}</span>)
                        : <span className="pa-no">—</span>}
                    </td>
                    <td className="n">{num(r.plan)}</td>
                    <td className="n">{num(r.actual)}</td>
                    <td className="n">{r.diff === null ? "—" : corpWon(r.diff)}</td>
                    <td className="n">{r.rate === null ? "—" : (r.rate * 100).toFixed(1) + "%"}</td>
                    <td className="pa-why">{r.why ? W(r.why).ko : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cl-note">
              차이와 달성률은 <b>겹치는 달 · 준비기간 아님 · 대응 확정이고 계획이 양수</b>일 때만 숫자가 됩니다.
              분모가 없으면 비율을 만들지 않습니다. <b>차이의 원인은 사람이 확정합니다</b> —
              이 화면은 어디가 벌어졌는지까지만 말합니다.
            </p>
          </div>

          {/* ── 대응 없음 ── */}
          <div className="cl-grid2">
            <div className="cl-sec">
              <div className="cl-h">계획에만 있습니다 <span className="cl-t">{U.planAsk.length + U.planNone.length}건</span></div>
              {U.planNone.map((k) => (
                <div key={k} className="cl-open">
                  <span className="pa-tag none">대응 없음</span><b>{corpPaLabel(k)}</b>
                  <i>장부에 받을 계정이 없습니다 — 계정과목을 늘릴지 사람이 정합니다</i>
                </div>
              ))}
              {U.planAsk.length > 0 && (
                <div className="pa-chips">
                  <span className="pa-tag ask">확정 대기 {U.planAsk.length}</span>
                  {U.planAsk.map((k) => {
                    const m = CORP_PA_MAP.find((x) => x.k === k) || {};
                    return <span key={k} className="pa-chip" title={m.why}>{corpPaLabel(k)}</span>;
                  })}
                  <i className="pa-chipnote">계정 후보까지만 세웠습니다 — 어느 계정으로 받을지는 사람이 확정합니다.</i>
                </div>
              )}
            </div>

            <div className="cl-sec">
              <div className="cl-h">장부에만 있습니다 <span className="cl-t">{U.acctAsk.length + U.acctNone.length}건</span></div>
              {U.acctNone.map((c) => (
                <div key={c} className="cl-open">
                  <span className="pa-tag none">대응 없음</span><b>{c} {corpAcctName(c)}</b>
                  <i>계획 손익에 이 비목이 없습니다</i>
                </div>
              ))}
              {U.acctAsk.length > 0 && (
                <div className="pa-chips">
                  <span className="pa-tag ask">확정 대기 {U.acctAsk.length}</span>
                  {U.acctAsk.map((c) => (
                    <span key={c} className="pa-chip">{c} {corpAcctName(c)}</span>
                  ))}
                  <i className="pa-chipnote">여러 계획 비목의 후보로 걸려 있습니다 — 경계는 사람이 정합니다.</i>
                </div>
              )}
            </div>
          </div>

          {U.acctMoved.length > 0 && (
            <div className="cl-sec">
              <div className="cl-h">이 달 움직였는데 대응이 확정되지 않았습니다
                <span className="cl-flag bad">{U.acctMoved.length}건</span></div>
              {U.acctMoved.map((c) => (
                <div key={c} className="cl-open">
                  <span className="pa-tag move">확정 필요</span>
                  <b>{c} {corpAcctName(c)}</b>
                  <span className="n">{corpWon(act[c])}</span>
                  <i>금액이 섰는데 어느 계획 비목에 맞출지 정해지지 않았습니다 — 차이의 출처를 못 밝히는 자리입니다</i>
                </div>
              ))}
            </div>
          )}

          <div className="cl-sec">
            <div className="cl-h">사유 표기</div>
            <div className="pa-leg">
              {Object.keys(CORP_PA_WHY).map((k) => (
                <div key={k}><b>{CORP_PA_WHY[k].ko}</b><i>{CORP_PA_WHY[k].d}</i></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
