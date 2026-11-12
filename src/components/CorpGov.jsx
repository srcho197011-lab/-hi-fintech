/* ══════════════ 일정 · 공지 · 결재 · 릴리스 화면(CorpGov.jsx) · CorpOps Phase 9 (조성래님 지시 2026-11-12) ══════════════
     CorpBoardSection     총괄운영 다섯째 뷰 「일정 · 공지 · 결재」 — 전사 귀속
     CorpReleaseSection   정보보안팀 S1 「릴리스 · 감사」
     CorpSecuritySection  정보보안팀 S1 「보안 현황」

   이 화면이 지키는 것
     · 승인 없이 상태가 넘어가지 않는다. 전이 함수가 유일한 길이다.
     · **지금 릴리스를 승인할 수 있는 사람이 없다**는 사실을 숨기지 않는다 —
       S1 책임자가 합류 전이고, 승인 경로를 대표에게 열지 않았다. 열면 분리의 뜻이 사라진다.
     · 동일인 승인 시도는 막고 **기록한다**. 막는 것으로 끝내면 왜 막혔는지가 남지 않는다.
     · 필독 공지는 누른 사람만 읽은 것으로 센다. 열어 본 것을 읽음으로 바꾸지 않는다.
     · 서버가 없다 — 여기 쌓이는 것은 이 브라우저 안에만 있다. */

function CorpBoardSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const [st, setSt] = React.useState(() => corpGovRead());
  const [tab, setTab] = React.useState("cal");
  const [actor, setActor] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [form, setForm] = React.useState({ ko: "", kind: "exp", note: "" });
  const V = React.useMemo(() => corpGovPass(st, now), [st, now && now.getTime()]);
  const people = (typeof corpHrOn === "function" ? corpHrOn() : []).map((h) => h.name);
  const cal = corpCalAll(st, now);
  const must = corpNoticeOpen(st);
  const apr = corpAprAll(st);
  const save = (next) => { corpGovWrite(next); setSt(Object.assign({}, next)); };

  const addApr = () => {
    if (!form.ko.trim()) { setMsg({ bad: true, t: "안건을 적어야 합니다" }); return; }
    if (!actor) { setMsg({ bad: true, t: "기안 주체를 고르지 않았습니다" }); return; }
    const d = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    save(Object.assign({}, st, { apr: (st.apr || []).concat([{ id: corpAprId(st), d: d, ko: form.ko.trim(), kind: form.kind, by: actor, ap: null, st: "draft", note: form.note.trim() }]) }));
    setForm({ ko: "", kind: form.kind, note: "" });
    setMsg({ bad: false, t: "기안 등록 — 승인 전까지 아무 효력이 없습니다" });
  };
  const advance = (a) => {
    const c = corpAprCanAdvance(a, actor);
    if (!c.ok) {
      if (c.same) save(corpGovDeny(st, a.ko, actor, c.why));   /* 동일인 승인 시도를 기록한다 */
      setMsg({ bad: true, t: a.ko + " — " + c.why });
      return;
    }
    save(Object.assign({}, st, { apr: (st.apr || []).map((x) => (x.id === a.id ? Object.assign({}, x, { st: c.to, ap: c.to === "approved" ? actor : x.ap }) : x)) }));
    setMsg({ bad: false, t: a.ko + " → " + CORP_APR_ST[c.to].ko + (c.to === "approved" ? " · 승인자 " + actor : "") });
  };
  const reject = (a) => {
    if (!actor) { setMsg({ bad: true, t: "조작 주체를 고르지 않았습니다" }); return; }
    save(Object.assign({}, st, { apr: (st.apr || []).map((x) => (x.id === a.id ? Object.assign({}, x, { st: "rejected", ap: actor }) : x)) }));
    setMsg({ bad: false, t: a.ko + " 반려 — " + actor });
  };
  const readIt = (id) => {
    if (!actor) { setMsg({ bad: true, t: "누가 읽었는지 고르지 않으면 읽음으로 세지 않습니다" }); return; }
    const read = Object.assign({}, st.read);
    const l = (read[id] || []).slice();
    if (l.indexOf(actor) < 0) l.push(actor);
    read[id] = l;
    save(Object.assign({}, st, { read: read }));
  };

  const TABS = [["cal", "일정"], ["nt", "공지"], ["ap", "결재"], ["chk", "검산"]];
  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>일정 · 공지 · 결재</b><span className="cl-sub">전사</span></div>
        <div className="cl-ctl">
          <label>조작 주체
            <select value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">— 고르세요 —</option>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>
      <div className="cl-warn">
        <b>승인 없이는 아무 상태도 넘어가지 않습니다.</b> 기안 → 검토 → 승인이 유일한 길이고,
        조건이 안 서면 왜 안 되는지를 함께 보여 줍니다. 작성자와 승인자가 같으면 거부하고 <b>그 시도를 기록합니다</b>.
        <span className="cl-warn2">서버가 없어 여기 쌓이는 것은 이 브라우저 안에만 있습니다.</span>
      </div>
      <div className="cl-tabs">
        {TABS.map(([k, ko]) => <button key={k} className={"cl-tab" + (k === tab ? " on" : "")} onClick={() => { setTab(k); setMsg(null); }}>{ko}</button>)}
      </div>
      {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={() => setMsg(null)}>{msg.t}</div>}

      {tab === "cal" && (
        <div className="cl-body"><div className="cl-sec">
          <div className="cl-h">일정 <span className="cl-t">반복 일정은 주간회의 지면의 루틴이 듭니다 — 여기는 날짜가 박힌 건만</span></div>
          <table className="cl-tbl">
            <thead><tr><th>날짜</th><th>D-day</th><th>종류</th><th>일정</th><th>주관</th><th>비고</th></tr></thead>
            <tbody>
              {cal.map((c) => (
                <tr key={c.id} className={c.dday !== null && c.dday <= 7 ? "bad" : ""}>
                  <td className="id">{c.d}</td>
                  <td className="n">{c.dday === null ? "—" : (c.dday >= 0 ? "D-" + c.dday : "+" + (-c.dday) + "일")}</td>
                  <td><span className="gv-k" style={{ color: (CORP_CAL_KIND[c.kind] || {}).c }}>{(CORP_CAL_KIND[c.kind] || {}).ko}</span></td>
                  <td>{c.ko}</td><td className="id">{c.team}</td><td className="desc">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {tab === "nt" && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">필독 공지 <span className="cl-t">누른 사람만 읽음으로 셉니다</span>
              <span className={"cl-flag" + (must.every((m) => !m.left.length) ? " on" : " bad")}>
                미확인 {must.reduce((n, m) => n + m.left.length, 0)}명</span></div>
            {must.map(({ n, done, left }) => (
              <div key={n.id} className="cl-open">
                <span className="gv-tag must">필독</span><b>{n.ko}</b>
                <span className="gv-meta">{n.d} · {n.by}</span>
                <i>{n.body}</i>
                <div className="gv-read">
                  읽음 {done.length ? done.join(" · ") : "없음"}
                  {left.length > 0 && <em> · 미확인 {left.join(" · ")}</em>}
                  <button className="cl-go" onClick={() => readIt(n.id)}>읽었습니다</button>
                </div>
              </div>
            ))}
            <p className="cl-note">열어 본 것을 읽음으로 바꾸지 않습니다 — <b>읽었다고 누른 사람만</b> 셉니다.
              화면을 띄운 것과 내용을 안 것은 다릅니다.</p>
          </div>
          <div className="cl-sec">
            <div className="cl-h">일반 공지</div>
            {CORP_NOTICE_SEED.filter((n) => !n.must).map((n) => (
              <div key={n.id} className="cl-open"><b>{n.ko}</b><span className="gv-meta">{n.d} · {n.by}</span><i>{n.body}</i></div>
            ))}
          </div>
        </div>
      )}

      {tab === "ap" && (
        <div className="cl-body">
          <div className="cl-sec">
            <div className="cl-h">기안</div>
            <div className="wm-form">
              <input className="g" value={form.ko} placeholder="안건" onChange={(e) => setForm(Object.assign({}, form, { ko: e.target.value }))} />
              <select value={form.kind} onChange={(e) => setForm(Object.assign({}, form, { kind: e.target.value }))}>
                {CORP_APR_KIND.map((k) => <option key={k.k} value={k.k}>{k.ko} — {k.by} 승인</option>)}
              </select>
              <input value={form.note} placeholder="비고" onChange={(e) => setForm(Object.assign({}, form, { note: e.target.value }))} />
              <button className="cl-go" onClick={addApr}>기안</button>
            </div>
            <p className="cl-note">{(CORP_APR_KIND.find((k) => k.k === form.kind) || {}).d} ·
              승인 주체는 <b>{(CORP_APR_KIND.find((k) => k.k === form.kind) || {}).by}</b> 소속입니다.</p>
          </div>
          <div className="cl-sec">
            <div className="cl-h">결재 큐 <span className="cl-t">{apr.length}건</span></div>
            {!apr.length && <p className="cl-note">대기 중인 결재가 없습니다 — 아직 기안한 건이 없습니다.</p>}
            {apr.map((a) => {
              const S = CORP_APR_ST[a.st] || {};
              const c = corpAprCanAdvance(a, actor);
              const K = CORP_APR_KIND.find((x) => x.k === a.kind) || {};
              return (
                <div key={a.id} className="cl-open">
                  <span className="gv-tag" style={{ color: S.c, borderColor: S.c }}>{S.ko}</span>
                  <b>{a.ko}</b>
                  <span className="gv-meta">{K.ko} · 기안 {a.by}{a.ap ? " · " + (a.st === "rejected" ? "반려" : "승인") + " " + a.ap : ""} · {a.d}</span>
                  {a.note && <i>{a.note}</i>}
                  {S.next && (
                    <div className="gv-act">
                      <button className={"cl-go" + (c.ok ? "" : " off")} title={c.why} onClick={() => advance(a)}>{S.nextKo}</button>
                      <button className="cl-rv" onClick={() => reject(a)}>반려</button>
                      {!c.ok && <em className="gv-why">{c.why}</em>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {(st.deny || []).length > 0 && (
            <div className="cl-sec">
              <div className="cl-h">막힌 시도 <span className="cl-flag bad">{st.deny.length}건</span></div>
              {st.deny.slice().reverse().slice(0, 10).map((d, i) => (
                <div key={i} className="cl-open"><span className="gv-tag deny">차단</span>
                  <b>{d.what}</b><span className="gv-meta">{d.who}</span><i>{d.why}</i></div>
              ))}
              <p className="cl-note">막는 것으로 끝내지 않고 <b>기록합니다</b> — 기록되지 않는 차단은 나중에 왜 막혔는지 알 수 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {tab === "chk" && <div className="cl-body"><GovCheck V={V} /></div>}
    </div>
  );
}

/* ── 릴리스 · 감사 ────────────────────────────────────────────────────── */
function CorpReleaseSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const [st, setSt] = React.useState(() => corpGovRead());
  const [actor, setActor] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const V = React.useMemo(() => corpGovPass(st, now), [st, now && now.getTime()]);
  const rel = corpRelAll(st);
  const who = corpRelApprovers();
  const people = (typeof corpHrOn === "function" ? corpHrOn() : []).map((h) => h.name);
  const save = (next) => { corpGovWrite(next); setSt(Object.assign({}, next)); };

  const toggle = (r, k) => {
    const ov = Object.assign({}, st.rel);
    const cur = (ov[r.id] && ov[r.id].check) || r.check || [];
    const next = cur.indexOf(k) >= 0 ? cur.filter((x) => x !== k) : cur.concat([k]);
    ov[r.id] = Object.assign({}, ov[r.id], { check: next });
    save(Object.assign({}, st, { rel: ov }));
  };
  const approve = (r) => {
    const c = corpRelCanApprove(r, actor);
    if (!c.ok) {
      if (c.same) save(corpGovDeny(st, "릴리스 " + r.ver, actor, c.why));
      setMsg({ bad: true, t: r.ver + " — " + c.why });
      return;
    }
    const ov = Object.assign({}, st.rel);
    ov[r.id] = Object.assign({}, ov[r.id], { st: "approved", ap: actor });
    save(Object.assign({}, st, { rel: ov }));
    setMsg({ bad: false, t: r.ver + " 승인 — " + actor });
  };

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>릴리스 · 감사</b><span className="cl-sub">작성자 ≠ 승인자</span></div>
        <div className="cl-ctl">
          <label>조작 주체
            <select value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">— 고르세요 —</option>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>
      <div className="cl-warn">
        <b>지금 릴리스를 승인할 수 있는 사람이 없습니다.</b> 릴리스 승인은 정보보안팀(S1)이 하는데
        그 자리의 책임자가 아직 합류 전입니다. <b>승인 경로를 대표에게 열지 않았습니다</b> —
        열면 「만든 쪽이 스스로 내보내지 못하게 한다」는 분리의 뜻이 사라집니다.
        <span className="cl-warn2">
          그래서 아래 릴리스는 점검표를 채워도 <b>승인되지 않습니다.</b> 자료가 덜 들어온 것이 아니라
          승인할 사람이 아직 없는 것입니다. 대표 대리 승인을 열지는 조성래님이 정할 자리입니다.
        </span>
      </div>
      {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={() => setMsg(null)}>{msg.t}</div>}
      <div className="cl-body">
        <div className="cl-kpis">
          <div><b>{rel.length}</b><span>릴리스</span></div>
          <div><b>{rel.filter((r) => r.st === "approved").length}</b><span>승인</span></div>
          <div className={who.length ? "" : "neg"}><b>{who.length || "0"}</b><span>승인 가능자(S1)</span></div>
          <div><b>{CORP_REL_CHECK.length}</b><span>점검 항목</span></div>
        </div>
        {rel.map((r) => {
          const c = corpRelCanApprove(r, actor);
          const done = (r.check || []);
          return (
            <div key={r.id} className="cl-sec">
              <div className="cl-h">{r.ver} — {r.ko}
                <span className="cl-t">작성 {r.by} · {r.d}</span>
                <span className={"gv-tag" + (r.st === "approved" ? " ok" : "")}>{r.st === "approved" ? "승인 · " + r.ap : "승인 대기"}</span></div>
              <div className="gv-items">{r.items.map((x, i) => <span key={i}>{x}</span>)}</div>
              <div className="gv-chk">
                {CORP_REL_CHECK.map((ck) => (
                  <button key={ck.k} className={"gv-cbtn" + (done.indexOf(ck.k) >= 0 ? " on" : "")}
                    title={ck.d} onClick={() => toggle(r, ck.k)} disabled={r.st === "approved"}>
                    {done.indexOf(ck.k) >= 0 ? "✓" : "○"} {ck.ko}
                  </button>
                ))}
              </div>
              {r.st !== "approved" && (
                <div className="gv-act">
                  <button className={"cl-go" + (c.ok ? "" : " off")} onClick={() => approve(r)}>릴리스 승인</button>
                  {!c.ok && <em className="gv-why">{c.why}</em>}
                </div>
              )}
            </div>
          );
        })}
        {(st.deny || []).length > 0 && (
          <div className="cl-sec">
            <div className="cl-h">동일인 승인 시도 <span className="cl-flag bad">{st.deny.length}건</span></div>
            {st.deny.slice().reverse().slice(0, 10).map((d, i) => (
              <div key={i} className="cl-open"><span className="gv-tag deny">차단</span>
                <b>{d.what}</b><span className="gv-meta">{d.who}</span><i>{d.why}</i></div>
            ))}
          </div>
        )}
        <GovCheck V={V} />
      </div>
    </div>
  );
}

/* ── 보안 현황 ────────────────────────────────────────────────────────── */
function CorpSecuritySection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const [st] = React.useState(() => corpGovRead());
  const V = React.useMemo(() => corpGovPass(st, now), [st, now && now.getTime()]);
  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>보안 현황</b><span className="cl-sub">커밋 게이트 — 들어오는 것을 막는 자리</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">게이트 {CORP_GATES.length}종</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>
      <div className="cl-warn">
        이 목록은 <b>사본이 아닙니다</b> — 커밋 게이트 러너가 훅 파일을 직접 읽어 여기 적힌 러너가
        실제로 그 훅에 걸려 있는지 대조합니다. 없으면 실패합니다.
        <span className="cl-warn2">
          목록만 두고 대조하지 않으면, 훅에서 빠진 게이트가 화면에서는 계속 녹색으로 보입니다 —
          <b>그게 가장 위험한 상태입니다.</b>
        </span>
      </div>
      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">커밋 게이트</div>
          <table className="cl-tbl">
            <thead><tr><th>게이트</th><th>러너</th><th>무엇을 막는가</th></tr></thead>
            <tbody>
              {CORP_GATES.map((g) => (
                <tr key={g.k}><td>{g.ko}</td><td className="id">{g.run}</td><td className="desc">{g.d}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="cl-note">실행 결과는 커밋할 때 터미널에 뜹니다 — 서버가 없어 이 화면이 러너를 돌리지 못합니다.
            <b>돌릴 수 없는 것을 돌렸다고 적지 않습니다.</b></p>
        </div>
        <GovCheck V={V} />
      </div>
    </div>
  );
}

function GovCheck({ V }) {
  return (
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
  );
}
