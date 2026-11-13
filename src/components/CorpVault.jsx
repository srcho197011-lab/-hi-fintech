/* ══════════════ 자료실 게시판(CorpVault.jsx) · CorpOps (조성래님 지시 2026-11-12) ══════════════
   회사 자료 저장소의 목차를 게시한다. 총괄운영의 여덟째 뷰.

   이 화면이 지키는 것
     · **목록은 화면이 들고, 파일은 폴더가 든다.** 줄을 누르면 이어 둔 폴더에서
       그 파일을 열어 준다(cvfOpenFile) — 내용은 그 자리에서 읽고 바로 놓는다.
       브라우저는 경로로 파일을 열지 못하므로 **사람이 한 번 고른 폴더**만 열 수 있다.
     · **확정 자료를 맨 위에 둔다.** 재무제표확인원처럼 다른 자료가 따라야 하는 것은
       작업본과 섞여 있으면 안 된다. 작업본을 보고 숫자를 믿는 사고가 거기서 난다.
     · **두 법인을 가른다.** 저장소에 하이젠케어(주)와 글로벌예방금융(주) 자료가 섞여 있다.
       섞인 채로 쓰면 장부가 오염된다.
     · 목록은 코드에 박지 않는다 — 파일명이 곧 회사 자료의 목차다. 반입해서 이 브라우저에만 둔다. */

/* ── 저장소 폴더 잇기 — 조성래님이 올려 두면 앱이 거기서 가져온다 (조성래님 지시 2026-11-12) ──
   「저장소에 조회를 해서 가져오도록 하면 되잖아. 저장소에 내가 올려 놓으면 되잖아.」

   ⚠️ 브라우저는 바탕화면을 마음대로 뒤지지 못한다. 조성래님이 **한 번 폴더를 지정**해 주셔야 한다.
      그 뒤로는 권한이 남아 「지금 가져오기」 한 번이면 된다 — 저절로 도는 것이 아니다.
   ⚠️ 그리고 **기계가 「가장 새 파일」을 고르지 않는다.** 저장소의 은행 내역은 이름 꼴이
      열 가지로 갈려 있고 수정일이 파일명 날짜와 어긋난다(9월 파일의 수정일이 11월 것보다
      늦다 — 실측). 늘어놓기만 하고 고르는 것은 조성래님이 하신다. */
function CorpVaultFs({ onRows, bankOnly, onPick, team, day }) {
  const [can] = React.useState(function () { return cvfCan(); });
  const [h, setH] = React.useState(null);
  const [perm, setPerm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [note, setNote] = React.useState(null);
  const [scan, setScan] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const dirRef = React.useRef(null);

  React.useEffect(function () {
    let gone = false;
    if (!can.ok) return;
    cvfHandle().then(function (x) {
      if (gone || !x) return;
      setH(x);
      cvfPerm(x, false).then(function (p) { if (!gone) setPerm(p); });
    });
    return function () { gone = true; };
  }, [can.ok]);

  const link = async function () {
    setBusy(true); setNote(null);
    try {
      const x = await cvfPick();
      setH(x);
      setPerm(await cvfPerm(x, true));
      /* ⚠️ 「방문할 때마다 허용」은 **이을 때 뜨지 않는다** — 다음에 여실 때 뜬다.
         안 뜬 창을 가리켜 적으면 사람이 기다리거나 자기가 뭘 놓쳤다고 여긴다. */
      /* 이은 것이 곧 읽기 허락이다. 그런데 한 번 더 누르게 하면 「왜 안 뜨지」가 된다 —
         이어진 그 자리에서 바로 가져온다(조성래님 지적 2026-11-13). */
      let got = "";
      try {
        const S = await cvfScan(x, function (n) { setTick(n); });
        setScan(S);
        if (typeof onRows === "function") onRows(S.rows);
        got = " 바로 " + S.n + "건을 가져왔습니다(" + Math.round(S.bytes / 104857.6) / 10 + "MB)."
          + (S.unread ? " **" + S.unread + "건은 내용을 읽지 못했습니다** — OneDrive 가 아직 내려받지 않았을 수 있습니다." : "");
      } catch (e2) { got = " 다만 아직 못 읽었습니다 — 「지금 가져오기」를 눌러 주세요(" + ((e2 && e2.message) || "까닭 모름") + ")."; }
      setNote({ bad: false, t: "「" + (x.name || "폴더") + "」을(를) 이었습니다 — 고르신 것이 곧 읽기 허락이라 따로 묻지 않습니다."
        + got });
    } catch (e) { setNote({ bad: true, t: (e && e.message) || "폴더를 잇지 못했습니다" }); }
    setBusy(false);
  };
  const copyPath = async function () {
    const ok = await cvfCopyPath();
    setNote({ bad: !ok, t: ok
      ? "경로 「" + CORP_VFS_WANT + "」를 복사했습니다 — 폴더 창에서 Ctrl+V 로 붙여 넣고 Enter 를 누르세요."
      : "복사하지 못했습니다 — 바탕화면에서 「0.HI-fin 온톨로지하네스」를 고르시면 됩니다(안으로 들어가지 마세요)." });
  };
  const grant = async function () {
    setBusy(true);
    const p = await cvfPerm(h, true);
    setPerm(p); setBusy(false);
    if (p !== "granted") setNote({ bad: true, t: "권한을 받지 못했습니다 — 폴더를 다시 이어 주세요" });
  };
  const fetchNow = async function () {
    setBusy(true); setNote(null); setTick(0);
    try {
      const S = await cvfScan(h, function (n) { setTick(n); });
      setScan(S);
      if (typeof onRows === "function") onRows(S.rows);
      setNote({ bad: false, t: S.n + "건을 가져왔습니다(" + Math.round(S.bytes / 104857.6) / 10 + "MB)."
        + (S.unread ? " **" + S.unread + "건은 내용을 읽지 못했습니다** — OneDrive 가 아직 내려받지 않았을 수 있습니다." : "")
        + (S.cut ? " 상한에 걸려 멈췄습니다." : "") });
    } catch (e) { setNote({ bad: true, t: (e && e.message) || "가져오지 못했습니다" }); }
    setBusy(false);
  };
  /* 두 번째 길 — 폴더를 통째로 고른다. 권한은 안 남지만 지금 바로 된다. */
  const onDir = function (e) {
    const fl = e.target.files;
    if (!fl || !fl.length) return;
    setBusy(true); setNote(null);
    try {
      const S = cvfFromInput(fl);
      setScan(S);
      if (typeof onRows === "function") onRows(S.rows);
      setNote({ bad: false, t: S.n + "건을 읽었습니다(" + Math.round(S.bytes / 104857.6) / 10 + "MB). "
        + "**이 길은 권한이 남지 않습니다** — 다음에 올리실 때 폴더를 다시 고르셔야 합니다. "
        + "한 번 이어 두고 쓰시려면 위의 「저장소 폴더 잇기」를 써 주세요." });
    } catch (err) { setNote({ bad: true, t: (err && err.message) || "읽지 못했습니다" }); }
    setBusy(false);
  };

  const forget = async function () {
    await cvfForget(); setH(null); setPerm(""); setScan(null);
    setNote({ bad: false, t: "폴더 연결을 끊었습니다 — 저장소의 파일은 그대로입니다." });
  };

  /* 팀으로 좁힌다 — 조성래님 지시: 「회계 대시보드는 02.회계와 항상 연결되도록 해줘.」 */
  const sc = React.useMemo(function () {
    if (!scan) return null;
    return team ? cvfScope(scan.rows, team) : { rows: scan.rows, dir: "", n: scan.rows.length, all: scan.rows.length, ok: true };
  }, [scan, team]);
  const cands = React.useMemo(function () {
    if (!sc || !bankOnly) return null;
    const C = cvfBankCandidates(sc.rows);
    const M = day ? cvfMatchDay(sc.rows, day) : null;
    return { n: C.n, all: C.all, rows: C.rows.map(cvfPickRow), match: M };
  }, [sc, bankOnly, day]);

  const take = async function (rel) {
    setBusy(true); setNote(null);
    try {
      /* 통째로 고른 길이면 그 자리에서 파일이 나온다 — 폴더를 다시 열 일이 없다 */
      const f = (scan && scan.map && scan.map[rel]) ? scan.map[rel] : await cvfFile(h, rel);
      if (typeof onPick === "function") await onPick(f, rel);
      setNote({ bad: false, t: "「" + rel + "」을(를) 가져왔습니다." });
    } catch (e) { setNote({ bad: true, t: (e && e.message) || "파일을 읽지 못했습니다" }); }
    setBusy(false);
  };

  return (
    <div className="cl-sec vf-wrap">
      <div className="cl-h">저장소 폴더 <span className="cl-t">조성래님이 올려 두면 제가 가져옵니다</span>
        <span className={"cl-flag" + (perm === "granted" ? " on" : " hold")}>
          {!can.ok ? "이 브라우저는 못 합니다" : (perm === "granted" ? "이어져 있음" : (h ? "권한 확인 필요" : "아직 안 이음"))}
        </span>
        <button className="cl-rv" onClick={function () { setOpen(!open); }}>{open ? "접기" : "열기"}</button>
      </div>

      {!can.ok && <p className="cl-note hold"><b>{can.why}</b></p>}

      {open && can.ok && (
        <div className="vf-body">
          <p className="cl-note">
            브라우저는 바탕화면을 마음대로 뒤지지 못합니다 — <b>조성래님이 한 번 폴더를 지정</b>해 주셔야 합니다.
            그 뒤로는 권한이 남아 「지금 가져오기」 한 번이면 됩니다. <b>저절로 돌지는 않습니다</b> —
            화면을 열고 누르셔야 합니다(브라우저가 사람이 누를 때만 폴더를 열어 줍니다).
            <b className="vf-aim">고르실 것은 <u>0.HI-fin 온톨로지하네스</u> 한 칸입니다 — 그 안으로 들어가지 마세요.
              루트를 고르셔야 여덟 팀이 한 번에 찹니다.</b>
            <CorpDefn>
              <span className="cl-warn2">
              누르시면 <b>바탕화면에서 창이 열립니다</b> — 거기서 <b>0.HI-fin 온톨로지하네스</b>를
              <b>한 번만 누르고</b>(열지 말고) 아래 「폴더 선택」을 누르시면 됩니다.
              경로를 붙여 넣는 게 편하시면 <b>먼저 「경로 복사」</b>를 누르시고, 폴더 창에서 Ctrl+V → Enter 하세요.
              <b>바탕화면 자체는 고를 수 없습니다.</b>
              안으로 더 들어가 02.회계나 26.11을 고르시면 그 팀만, 또는 여덟 팀이 같은 목록을 보게 됩니다.
              </span>
              <span className="cl-warn2">
              <b>권한을 따로 묻지 않습니다</b> — 폴더를 고르시는 것이 곧 읽기 허락입니다.
              창이 하나 더 뜨기를 기다리지 마세요. 이은 뒤에는 위 배지가 <b>「이어져 있음」</b>으로 바뀝니다.
              <b>「방문할 때마다 허용」</b>은 <b>다음에 다시 여실 때</b> 뜹니다 — 그때 그걸 고르시면 그 뒤로는 안 묻습니다.
              </span>
              <span className="cl-warn2">
              <b>권한은 주소마다 따로입니다</b> — 미리보기(localhost)에서 이으신 것과 배포본에서 이으신 것은
              서로 다릅니다. 쓰시는 쪽에서 한 번씩 이어 주셔야 합니다.
              </span>
            </CorpDefn>
          </p>

          <div className="vf-row">
            {!h && <button className="cl-save" disabled={busy} onClick={link}>저장소 폴더 잇기</button>}
            {!h && <button className="cl-rv" disabled={busy} onClick={copyPath}>경로 복사</button>}
            {h && perm !== "granted" && <button className="cl-save" disabled={busy} onClick={grant}>권한 다시 받기</button>}
            {h && perm === "granted" && <button className="cl-save" disabled={busy} onClick={fetchNow}>지금 가져오기</button>}
            {h && <button className="cl-rv" disabled={busy} onClick={link}>폴더 바꾸기</button>}
            {h && <button className="cl-rv" disabled={busy} onClick={forget}>연결 끊기</button>}
            {h && <span className="cl-t">이어진 폴더 · {h.name}</span>}
            {busy && <span className="cl-t">{tick ? tick + "건 읽는 중…" : "잠시만요…"}</span>}
          </div>

          <div className="vf-row vf-alt">
            <span className="cl-t">잘 안 되면 이 길로 —</span>
            <button className="cl-rv" disabled={busy} onClick={function () { if (dirRef.current) dirRef.current.click(); }}>
              폴더 통째 고르기
            </button>
            <input ref={dirRef} type="file" webkitdirectory="" directory="" multiple
              style={{ display: "none" }} onChange={onDir} />
            <i className="vf-alt-why">권한이 남지 않아 <b>올리실 때마다 다시 고르셔야</b> 합니다. 지금 바로는 됩니다.</i>
          </div>
          {note && <div className={"cl-msg" + (note.bad ? " bad" : "")} onClick={function () { setNote(null); }}>{note.t}</div>}

          {scan && scan.once && <p className="cl-note hold">지금 읽은 것은 <b>이번 한 번</b>입니다 — 권한이 남지 않습니다.</p>}
          {scan && (
            <p className="cl-note">{scan.root}{scan.asDept ? "(부서 폴더를 직접 이으셨습니다)" : ""} — <b>{scan.n}건</b> · {Math.round(scan.bytes / 104857.6) / 10}MB.
              {sc && sc.dir && sc.mode === "scoped" ? <span> 이 지면은 <b>{sc.dir}</b> 안만 봅니다 — <b>{sc.n}건</b>.</span> : null}
              {sc && sc.mode === "asis" ? <span> 고르신 폴더를 그대로 씁니다 — <b>{sc.n}건</b>.</span> : null}
              {!bankOnly && <span> 종류 · 법인 판별은 아래 대장이 합니다(여기서는 <b>사실만</b> 가져옵니다).</span>}</p>
          )}
          {sc && !sc.ok && <p className="cl-note hold">{sc.why}</p>}
          {sc && sc.ok && sc.mode === "asis" && <p className="cl-note">{sc.why}</p>}
          {cands && cands.match && (
            <p className={"cl-note" + (cands.match.n === 1 ? "" : " hold")}>
              <b>{day}</b> 것 — {cands.match.why}.
              {cands.match.n === 1 && <span> 「{cands.match.only.name}」 하나뿐이라 그걸 쓰시면 됩니다
                — <b>고른 것이 아니라 그것밖에 없는 것</b>입니다.</span>}
            </p>
          )}

          {cands && (
            <div className="vf-pick">
              <div className="cl-h2">고를 만한 파일 <span className="cl-t">{cands.n}건 / 전체 {cands.all}건</span></div>
              <p className="cl-note"><b>제가 고르지 않습니다.</b> 저장소의 은행 내역은 이름 꼴이 여러 가지이고,
                <b>수정일이 파일명의 날짜와 어긋나는 것이 실제로 있습니다</b> — 「가장 새 것」을 기계가 집으면
                틀린 달의 장부가 섭니다. 늘어놓기만 할 테니 조성래님이 골라 주세요.</p>
              {!cands.n && <p className="cl-note hold">엑셀 · CSV 로 된 거래내역을 찾지 못했습니다.</p>}
              {cands.n > 0 && (
                <table className="cl-tbl vf-tbl">
                  <thead><tr><th>파일</th><th>폴더</th><th>파일명 날짜</th><th>수정일</th><th>크기</th><th /></tr></thead>
                  <tbody>
                    {cands.rows.slice(0, 40).map(function (r) {
                      return (
                        <tr key={r.rel} className={r.mismatch ? "warn" : ""}>
                          <td className="desc">{r.name}</td>
                          <td className="id">{r.dir || "(루트)"}</td>
                          <td className="id">{r.nameDate || "—"}</td>
                          <td className="id">{r.at || "—"}</td>
                          <td className="n">{Math.max(1, Math.round(r.size / 1024))}KB</td>
                          <td>
                            <button className="cl-rv" disabled={busy || r.unread} onClick={function () { take(r.rel); }}>
                              {r.unread ? "못 읽음" : "이걸로"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {cands.rows.some(function (r) { return r.mismatch; }) && (
                <p className="cl-note hold">노란 줄은 <b>파일명의 날짜와 수정일이 다릅니다</b> — 어느 달 것인지 보고 골라 주세요.</p>
              )}
              {cands.n > 40 && <p className="cl-note">앞 40건만 보여 줍니다(전체 {cands.n}건).</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════ 팀 자료실 — 목록 하나 (조성래님 지시 2026-11-13) ══════════════
   지시: 「자료반입 / 자료실은 해체하고 각 팀별로 자료실을 만들어 주고, 화면에는
   목록만을 두고 목록을 클릭하면 저장소의 각 팀별 섹션과 바로 연결하여 파일을
   볼 수 있도록 해줘. 가급적 단순하게 만들어 줘.」

   ⚠️ 브라우저는 **경로로 파일을 열지 못한다.** 사람이 한 번 고른 폴더 핸들로만 연다.
   그래서 「폴더 잇기」 한 번은 남는다 — 그 뒤로는 줄을 누르면 바로 열린다.
   ⚠️ 읽은 내용은 **어디에도 담지 않는다.** 대장은 목록만 든다(corpVaultPass 의 「root」). */
function CorpVaultSection({ team }) {
  const [st, setSt] = React.useState(() => corpVaultRead());
  /* 폴더에서 가져온 목록을 그대로 대장으로 쓴다 — 종류 · 법인 판별은 아래가 한다(두 벌이 되지 않게) */
  const takeRows = React.useCallback((rows) => {
    const next = { at: "저장소 폴더", list: rows };
    corpVaultWrite(next); setSt(next);
  }, []);
  const [why, setWhy] = React.useState("");

  /* 팀 보드에서는 **그 팀 자료만** 본다. 같은 함수가 인자만 달리 받는다 — 화면을 복제하지 않는다. */
  const all = React.useMemo(() => corpVaultRows(st), [st]);
  const rows = React.useMemo(() => corpVaultOfTeam(all, team), [all, team]);
  const byTeam = React.useMemo(() => corpVaultByTeam(all), [all]);
  const T = team && typeof corpTeam === "function" ? corpTeam(team) : null;
  const folder = team ? corpVaultFolder(team) : "";
  const S = React.useMemo(() => corpVaultStats(rows), [rows]);
  const V = React.useMemo(() => corpVaultPass(st), [st]);

  /* 저장소에서 보던 모양 그대로 — 하위 폴더로 묶는다. 팀 폴더 이름은 묶음 이름에서 뺀다(모두 같으므로). */
  const groups = React.useMemo(() => {
    const g = {};
    rows.forEach((r) => {
      const p = String(r.rel || "").split("/");
      const k = p.slice(1, -1).join(" › ") || "·";
      (g[k] = g[k] || []).push(r);
    });
    return Object.keys(g).sort().map((k) => ({ k: k, list: g[k] }));
  }, [rows]);

  const kb = (n) => {
    const v = +n || 0;
    if (v >= 1048576) return (v / 1048576).toFixed(1) + " MB";
    if (v >= 1024) return Math.round(v / 1024) + " KB";
    return v + " B";
  };

  /* 누르신 **그 순간** 새 탭을 연다 — await 뒤에 열면 브라우저가 팝업으로 보고 막는다. */
  const show = (r) => {
    setWhy("");
    if (typeof cvfOpenFile !== "function") { setWhy("이 브라우저에서는 파일을 열지 못합니다"); return; }
    const w = window.open("", "_blank");
    cvfOpenFile(r.rel, w).then((o) => { if (!o || !o.ok) setWhy((o && o.why) || "파일을 열지 못했습니다"); });
  };

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl">
          <b>{T ? T.sh + "팀 자료실" : "자료실"}</b>
          <span className="cl-sub">{team ? CORP_VAULT_ROOT + " › " + folder : CORP_VAULT_ROOT}</span>
        </div>
        <div className="cl-ctl">
          <span className="ad-chip">{S.n}건 · {S.mb}MB</span>
          {S.key > 0 && <span className="vt-key">확정 자료 {S.key}</span>}
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        목록은 <b>저장소 폴더를 훑어</b> 만듭니다 — 줄을 누르면 이어 둔 폴더에서 <b>그 파일을 엽니다.</b>
        파일 내용은 담아 두지 않습니다 — <b>누르신 그 자리에서 읽고 바로 놓습니다.</b>
        <CorpDefn>
          <span className="cl-warn2">
          목록은 코드에 넣지 않았습니다. 파일명이 곧 회사 자료의 목차라, 공개 배포본에 실리면
          대외비 저장소의 목차를 공개하는 셈입니다 — <b>폴더를 이어 이 브라우저에만</b> 둡니다.
          PDF · 이미지 · 표는 새 탭에 뜨고, 엑셀 · 한글처럼 브라우저가 못 그리는 것은 내려받기가 됩니다.
          </span>
        </CorpDefn>
      </div>

      <div className="cl-body">
        <CorpVaultFs onRows={takeRows} />
        {why && <div className="cl-msg bad" onClick={() => setWhy("")}>{why}</div>}

        {rows.length > 0 && groups.map((g) => (
          <div key={g.k} className="cl-sec">
            <div className="cl-h">{g.k}<span className="cl-t">{g.list.length}건</span></div>
            <div className="vt-list">
              {g.list.map((r) => (
                <button key={r.rel} className="vt-row" onClick={() => show(r)}
                  title={r.ko + " · 회사 보존 " + r.keep + "년 · 파기 예정 " + (r.dispose || "—")}>
                  <span className="nm">{r.name}</span>
                  {r.key ? <i className="vt-k">확정</i> : null}
                  <span className="sz">{kb(r.size)}</span>
                  <span className="dt">{r.at}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {!rows.length && (
          <div className="cl-sec">
            <div className="cl-h">{T ? T.sh + "팀" : "이 팀"} 자료가 아직 없습니다
              {all.length > 0 && <span className="cl-flag">전사 {all.length}건</span>}</div>
            <p className="cl-note">
              위 <b>폴더 잇기</b>를 한 번 하시면 저장소의 <b>{folder || "팀 폴더"}</b> 아래가 그대로 목록이 됩니다.
              다른 팀 자료는 <b>여기 보이지 않습니다</b> — 팀마다 자기 것만 봅니다.</p>
          </div>
        )}

        {all.length > 0 && (
          <div className="cl-sec">
            <div className="cl-h">다른 팀 <span className="cl-t">0건인 팀을 숨기지 않습니다</span></div>
            <div className="vt-teams">
              {byTeam.map((b) => (
                <span key={b.team} className={"ad-chip" + (b.team === team ? " on" : "")}>{b.sh} {b.n}</span>
              ))}
            </div>
          </div>
        )}

        <CorpDefn lab="검산">
          <table className="cl-tbl"><tbody>
            {V.rows.map((r, i) => (
              <tr key={i}><td className="k">{r.ko}</td>
                <td><span className={"cl-verd" + (r.ok ? " on" : " bad")}>{r.ok ? "맞음" : "어긋남"}</span> {r.got}</td></tr>
            ))}
          </tbody></table>
        </CorpDefn>
      </div>
    </div>
  );
}
