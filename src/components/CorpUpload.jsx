/* ══════════════ 자료 반입 화면(CorpUpload.jsx) · CorpOps (형 지시 2026-11-12) ══════════════
   형이 실제 자료를 올리는 자리. 총괄운영의 여섯째 뷰다.

   흐름 — 고르기 → **민감자료 검사** → 미리보기 → 열 맞추기 → 검증 → 반입
   민감자료 검사가 미리보기보다 **앞**이다. 주민번호가 섞인 표를 띄워 놓고 「지우세요」라고
   말하는 것은 이미 띄운 것이다.

   이 화면이 지키는 것
     · 파일은 **어디로도 전송되지 않는다.** 브라우저 안에서 읽고 끝난다.
     · **틀린 줄만 뺀다.** 전부 받거나 전부 거부하는 방식은 실무에서 못 쓴다. 뺀 이유를 줄 번호로 적는다.
     · **반입처를 먼저 말한다.** 어디로 들어가는지 모르고 누르게 하지 않는다.
     · **되돌릴 수 있다.** 직전 반입을 통째로 물린다.
     · 용량을 넘으면 미리보기와 검증까지만 한다 — 「반입했다」고 적어 놓고 일부만 들어가는 것보다 낫다. */

function CorpUploadSection() {
  const [kind, setKind] = React.useState("jv");
  const [file, setFile] = React.useState(null);
  const [raw, setRaw] = React.useState(null);      /* { head, rows, kb, name } */
  const [block, setBlock] = React.useState(null);  /* 민감자료 적중 — 있으면 미리보기를 막는다 */
  const [map, setMap] = React.useState({});
  const [res, setRes] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  const [up, setUp] = React.useState(() => corpUpRead());
  const V = React.useMemo(() => corpUpPass(), []);
  const spec = corpUpSpec(kind);
  const fileRef = React.useRef(null);

  const reset = () => { setRaw(null); setBlock(null); setMap({}); setRes(null); setFile(null); };

  const onPick = (f) => {
    if (!f) return;
    reset(); setFile(f);
    const rd = new FileReader();
    rd.onload = () => {
      const text = String(rd.result || "");
      const kb = corpUpSizeKb(text);
      const p = corpUpParseCsv(text);
      if (!p.head.length) { setMsg({ bad: true, t: "표를 읽지 못했습니다 — CSV(쉼표로 나뉜 표)인지 확인해 주세요" }); return; }
      /* ① 민감자료 — 미리보기보다 **먼저** 본다 */
      const hit = corpUpScan(p.rows, p.head);
      if (hit.length) { setBlock({ hit: hit, name: f.name, kb: kb }); return; }
      setRaw({ head: p.head, rows: p.rows, kb: kb, name: f.name });
      setMap(corpUpSuggest(p.head, corpUpSpec(kind)));
      setMsg({ bad: false, t: f.name + " — " + p.rows.length + "행 읽었습니다. 열이 맞는지 확인해 주세요." });
    };
    rd.onerror = () => setMsg({ bad: true, t: "파일을 읽지 못했습니다" });
    rd.readAsText(f, "utf-8");
  };

  const validate = () => {
    if (!raw) return;
    const r = corpUpValidate(kind, raw.head, raw.rows, map);
    setRes(r);
    if (r.msg) setMsg({ bad: true, t: r.msg });
    else setMsg({ bad: false, t: "검증 — 통과 " + r.ok.length + "행 · 제외 " + r.bad.length + "행" });
  };

  const commit = () => {
    if (!res || !res.ok.length) { setMsg({ bad: true, t: "반입할 줄이 없습니다" }); return; }
    if (raw.kb > CORP_UP_MAXKB) {
      setMsg({ bad: true, t: "용량이 " + raw.kb + "KB로 상한(" + CORP_UP_MAXKB + "KB)을 넘습니다 — 미리보기와 검증까지만 합니다. 나눠서 올려 주세요." });
      return;
    }
    let n = 0, note = "";
    if (kind === "jv") {
      const g = corpUpGroupJv(res.ok).filter((x) => x.ok);
      const st = corpLedgerRead();
      const add = g.map((x) => ({
        id: x.no, d: x.d, desc: x.desc, by: "반입", ap: null, st: "draft",
        l: x.lines.map((l) => [l.acctCode, +l.dr || 0, +l.cr || 0, l.memo || ""]),
      }));
      corpLedgerWrite(Object.assign({}, st, { jv: (st.jv || []).concat(add) }));
      n = add.length; note = "전표는 **기표 상태**로 들어갑니다 — 검토·승인을 거쳐야 장부에 올라갑니다.";
    } else {
      setMsg({ bad: true, t: spec.ko + "은(는) 반입 경로가 아직 열려 있지 않습니다 — 검증까지만 됩니다. 장부(전표)부터 열었습니다." });
      return;
    }
    const log = (up.log || []).concat([{ kind: kind, name: raw.name, n: n, bad: res.bad.length, at: raw.name }]);
    const next = { v: 1, log: log };
    corpUpWrite(next); setUp(next);
    setMsg({ bad: false, t: n + "건 반입했습니다. " + note });
  };

  const undo = () => {
    if (kind !== "jv") { setMsg({ bad: true, t: "되돌릴 반입이 없습니다" }); return; }
    const st = corpLedgerRead();
    const keep = (st.jv || []).filter((j) => j.by !== "반입");
    const removed = (st.jv || []).length - keep.length;
    corpLedgerWrite(Object.assign({}, st, { jv: keep }));
    setMsg({ bad: false, t: "반입분 " + removed + "건을 물렸습니다 — 파일럿 전표는 코드에 있어 영향받지 않습니다." });
  };

  const cols = spec ? spec.need.concat(spec.opt) : [];
  const grouped = res && kind === "jv" ? corpUpGroupJv(res.ok) : null;

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>자료 반입</b><span className="cl-sub">실제 자료를 올리는 자리</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">상한 {CORP_UP_MAXKB}KB</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        <b>파일은 어디로도 전송되지 않습니다.</b> 서버가 없어 브라우저 안에서 읽고 끝납니다 —
        그래서 용량 한계가 있고, 큰 파일은 미리보기와 검증까지만 합니다.
        <span className="cl-warn2">
          <b>민감자료 검사가 미리보기보다 먼저입니다.</b> 주민번호가 섞인 표를 띄워 놓고 「지우세요」라고
          말하는 것은 이미 띄운 것입니다. 커밋 게이트와 같은 판정을 여기서도 합니다 —
          들어오는 길이 둘인데 한쪽만 막으면 막는 것이 아닙니다.
        </span>
      </div>

      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">① 무엇을 올리는가</div>
          <div className="up-kinds">
            {CORP_UP_SPEC.map((s) => (
              <button key={s.k} className={"up-kind" + (s.k === kind ? " on" : "")}
                onClick={() => { setKind(s.k); reset(); }}>
                <b>{s.ko}</b><i>{s.team}</i>
                <span>{s.into}</span>
              </button>
            ))}
          </div>
          {spec && (
            <div className="up-spec">
              <div className="up-d">{spec.d}</div>
              <div className="up-cols">
                {spec.need.map((k) => <span key={k} className="up-col req">{spec.label[k]}<i>필수</i></span>)}
                {spec.opt.map((k) => <span key={k} className="up-col">{spec.label[k]}</span>)}
              </div>
              {spec.deny.length > 0 && (
                <div className="up-deny">
                  <b>받지 않는 열</b> — {spec.deny.slice(0, 8).join(" · ")}{spec.deny.length > 8 ? " 외" : ""}.
                  이런 이름의 열은 <b>떼고 받습니다</b>.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cl-sec">
          <div className="cl-h">② 파일 고르기 <span className="cl-t">CSV — 엑셀에서 「다른 이름으로 저장 → CSV UTF-8」</span></div>
          <div className="up-pick">
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain"
              onChange={(e) => onPick(e.target.files && e.target.files[0])} />
            {file && <span className="up-f">{file.name}{raw ? " · " + raw.kb + "KB · " + raw.rows.length + "행" : ""}</span>}
            {(raw || block) && <button className="cl-rv" onClick={() => { reset(); if (fileRef.current) fileRef.current.value = ""; }}>지우기</button>}
          </div>
        </div>

        {msg && <div className={"cl-msg" + (msg.bad ? " bad" : "")} onClick={() => setMsg(null)}>{msg.t}</div>}

        {block && (
          <div className="cl-sec up-block">
            <div className="cl-h">받지 않았습니다 — 민감자료가 섞여 있습니다
              <span className="cl-flag bad">{block.hit.length}건</span></div>
            <p className="cl-note">미리보기도 하지 않았습니다. <b>값은 화면에 띄우지 않습니다</b> —
              어느 줄 어느 열에 무엇이 있는지까지만 적습니다.</p>
            {Object.keys(block.hit.reduce((a, h) => { a[h.k] = h; return a; }, {})).map((k) => {
              const h = block.hit.find((x) => x.k === k);
              const where = block.hit.filter((x) => x.k === k);
              return (
                <div key={k} className="cl-open">
                  <span className="pa-tag none">{h.ko} {where.length}건</span>
                  <i>{h.why}</i>
                  <div className="up-where">{where.slice(0, 12).map((w, i) => <span key={i}>{w.row}행 · {w.col}</span>)}
                    {where.length > 12 && <span>외 {where.length - 12}건</span>}</div>
                </div>
              );
            })}
          </div>
        )}

        {raw && (
          <div className="cl-sec">
            <div className="cl-h">③ 열 맞추기 <span className="cl-t">추측해서 넣지 않습니다 — 확인하고 고르세요</span></div>
            <div className="up-map">
              {cols.map((k) => (
                <label key={k} className={spec.need.indexOf(k) >= 0 ? "req" : ""}>
                  <span>{spec.label[k]}{spec.need.indexOf(k) >= 0 && <i>필수</i>}</span>
                  <select value={map[k] === undefined ? "" : map[k]}
                    onChange={(e) => setMap(Object.assign({}, map, { [k]: e.target.value === "" ? undefined : +e.target.value }))}>
                    <option value="">— 없음 —</option>
                    {raw.head.map((h, i) => <option key={i} value={i}>{h || "(" + (i + 1) + "열)"}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="up-prev">
              <table className="cl-tbl">
                <thead><tr>{raw.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                <tbody>
                  {raw.rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>{raw.head.map((h, j) => <td key={j} className="desc">{String(r[j] == null ? "" : r[j]).slice(0, 24)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              <p className="cl-note">앞 5행만 보여 줍니다 — 전체 {raw.rows.length}행.</p>
            </div>
            <button className="cl-save" onClick={validate}>④ 검증</button>
          </div>
        )}

        {res && (
          <div className="cl-sec">
            <div className="cl-h">⑤ 검증 결과
              <span className={"cl-flag" + (res.bad.length ? " bad" : " on")}>통과 {res.ok.length} · 제외 {res.bad.length}</span></div>
            {res.bad.length > 0 && (
              <div className="up-bad">
                {res.bad.slice(0, 15).map((b, i) => (
                  <div key={i}><b>{b.row}행</b> {b.why.join(" · ")}</div>
                ))}
                {res.bad.length > 15 && <div>… 외 {res.bad.length - 15}행</div>}
              </div>
            )}
            {grouped && (
              <table className="cl-tbl">
                <thead><tr><th>전표</th><th>일자</th><th>적요</th><th>차변</th><th>대변</th><th>판정</th></tr></thead>
                <tbody>
                  {grouped.slice(0, 20).map((g) => (
                    <tr key={g.no} className={g.ok ? "" : "bad"}>
                      <td className="id">{g.no}</td><td className="id">{g.d}</td><td className="desc">{g.desc}</td>
                      <td className="n">{corpWon(g.dr)}</td><td className="n">{corpWon(g.cr)}</td>
                      <td className="st">{g.ok ? "차대 일치" : g.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="cl-note"><b>틀린 줄만 뺍니다.</b> 전부 받거나 전부 거부하면 실무에서 쓸 수 없습니다 —
              뺀 이유를 줄 번호로 적습니다.</p>
            <div className="gv-act">
              <button className={"cl-save" + (res.ok.length ? "" : " off")} onClick={commit}>⑥ 반입 — {spec.into}</button>
              <button className="cl-rv" onClick={undo}>직전 반입 되돌리기</button>
            </div>
          </div>
        )}

        {(up.log || []).length > 0 && (
          <div className="cl-sec">
            <div className="cl-h">반입 이력 <span className="cl-t">{up.log.length}건</span></div>
            {up.log.slice().reverse().slice(0, 10).map((l, i) => (
              <div key={i} className="cl-open"><span className="gv-tag ok">반입</span>
                <b>{(corpUpSpec(l.kind) || {}).ko}</b>
                <span className="gv-meta">{l.name} · {l.n}건{l.bad ? " · 제외 " + l.bad : ""}</span></div>
            ))}
          </div>
        )}

        <div className="cl-sec">
          <div className="cl-h">검산 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
          <table className="cl-tbl id">
            <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
            <tbody>
              {V.rows.map((r) => (
                <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
                  <td>{r.ko}</td><td className="n">{r.n}건</td><td className="n">{r.got}</td>
                  <td className="n">{r.want}</td>
                  <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
