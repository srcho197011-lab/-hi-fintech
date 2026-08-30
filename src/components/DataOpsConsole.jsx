/* ══════════════ 데이터 운영 콘솔(DataOpsConsole.jsx) — 데이터 운영계획 v1.1의 시스템화 (형 지시 2026-08-30) ══════════════
   온톨로지·하네스의 서브섹션. 이 화면은 문서가 아니라 **원천을 읽는다** —
   dataCatalog.js(단일 소스)·브라우저 저장소 실측·게이트 스냅샷이 바뀌면 화면이 그대로 따라온다.
   원칙: 관측이지 조작이 아니다(수기 편집 없음) · 갱신 경로는 단 하나 — 카탈로그 등재 → 게이트 통과 → 자동 반영. */

const DO_C = { ink: "#0B2239", brand: "#F5821F", mut: "#64748B", line: "#E2E8F0", ok: "#15803D", warn: "#B45309", bad: "#B91C1C" };

/* 브라우저 저장소 실측 — 지금 이 기기의 실제 상태(카탈로그 대조 포함) */
function doScanStorage() {
  const rows = {}; let totalB = 0, unknown = [];
  try {
    for (let j = 0; j < localStorage.length; j++) {
      const k = localStorage.key(j);
      if (!/^(hifin_|pi_)/.test(k)) continue;
      const v = localStorage.getItem(k) || "";
      const bytes = (k.length + v.length) * 2;                 // UTF-16 근사
      totalB += bytes;
      const known = (typeof hifinCatalogKnown === "function") ? hifinCatalogKnown(k) : true;
      const gr = (typeof hifinKeyGroup === "function") ? hifinKeyGroup(k) : null;
      const g = gr ? gr.ko : "미분류";
      (rows[g] || (rows[g] = { g: g, sensitive: gr ? gr.sensitive : "-", n: 0, bytes: 0, unknown: 0 }));
      rows[g].n++; rows[g].bytes += bytes;
      if (!known) { rows[g].unknown++; if (unknown.length < 10) unknown.push(k); }
    }
  } catch (e) {}
  let sessN = 0; try { for (let j = 0; j < sessionStorage.length; j++) if (/^hifin_/.test(sessionStorage.key(j))) sessN++; } catch (e) {}
  return { rows: Object.values(rows).sort((a, b) => b.bytes - a.bytes), totalB: totalB, unknown: unknown, sessN: sessN };
}

/* ⑥ 백업·복원 — L3(회원 행동층) 유실 방어 브리지(형 지시 2026-08-30: 오리진 분리·삭제·PC 교체 = 전량 유실) */
function DoBackupBlock({ scan, onRefresh }) {
  const [msg, setMsg] = React.useState(null);
  const [showSnip, setShowSnip] = React.useState(false);
  const fileRef = React.useRef(null);
  const last = (typeof hifinBackupLast === "function") ? hifinBackupLast() : null;
  const staleDays = last ? Math.floor((Date.now() - new Date(last.at).getTime()) / 86400000) : null;
  const needBackup = !last || staleDays >= 7;
  const doBackup = () => {
    try { const r = hifinBackupDownload(); setMsg({ ok: true, t: `백업 파일 저장됨 — ${r.name} (${r.keys}개 키 · ${r.kb}KB). USB·클라우드 등 이 PC 밖에 보관하세요.` }); onRefresh(); }
    catch (e) { setMsg({ ok: false, t: "백업 실패: " + e }); }
  };
  const doRestore = (f) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const r = hifinRestoreApply(JSON.parse(rd.result));
        setMsg(r.ok
          ? { ok: true, t: `복원 완료 — ${r.restored}개 키(덮어쓰기 ${r.overwritten}${r.skippedUnknown.length ? " · 카탈로그 미등재 건너뜀 " + r.skippedUnknown.length : ""}). 새로고침하면 화면에 반영돼요.` }
          : { ok: false, t: "복원 거부 — " + r.why });
        if (r.ok) onRefresh();
      } catch (e) { setMsg({ ok: false, t: "복원 실패: " + e }); }
    };
    rd.readAsText(f);
  };
  const copySnip = (s, label) => { try { navigator.clipboard.writeText(s); setMsg({ ok: true, t: label + " 코드를 복사했어요 — 대상 브라우저에서 F12 → Console에 붙여넣고 Enter." }); } catch (e) { setMsg({ ok: false, t: "복사 실패 — 아래 코드를 직접 드래그해 주세요." }); } };
  const snipBox = { background: "#0B2239", color: "#9FE8C8", borderRadius: 8, padding: "8px 10px", fontSize: 10, fontFamily: "Consolas,monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 120, overflow: "auto", marginTop: 5 };
  return (<div style={{ background: "#fff", border: `1px solid ${needBackup ? "#FECACA" : DO_C.line}`, borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 12.6, fontWeight: 900, color: DO_C.ink }}>⑥ 백업·복원 — 회원 행동층(L3) 유실 방어
        {needBackup
          ? <span style={{ marginLeft: 8, background: "#FDECEC", color: DO_C.bad, borderRadius: 8, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{last ? `마지막 백업 ${staleDays}일 전 — 백업 권장` : "백업 이력 없음 — 지금 백업하세요"}</span>
          : <span style={{ marginLeft: 8, background: "#E7F8EE", color: DO_C.ok, borderRadius: 8, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>마지막 백업 {staleDays === 0 ? "오늘" : staleDays + "일 전"} · {last.keys}키</span>}
      </div>
    </div>
    <div style={{ fontSize: 11.4, color: "#475569", lineHeight: 1.7, marginTop: 5 }}>
      이 기기의 회원 상태({scan.rows.reduce((s, r) => s + r.n, 0)}키 · {(scan.totalB / 1024).toFixed(0)}KB)는 브라우저 내부(leveldb 이진 파일)에만 있어요 —
      <b> 기록 삭제·PC 교체 한 번이면 경고 없이 전량 유실</b>되고, 주소(오리진)마다 분리되어 localhost↔배포 사이트 간에도 서로 안 보여요.
      서버 이관(D-2) 전까지는 아래 백업이 유일한 안전망이에요.
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9 }}>
      <button onClick={doBackup} style={{ background: DO_C.brand, border: "none", color: "#fff", borderRadius: 9, padding: "8px 16px", fontSize: 12.4, fontWeight: 900, cursor: "pointer" }}>⬇ 지금 백업(JSON 다운로드)</button>
      <button onClick={() => fileRef.current && fileRef.current.click()} style={{ background: "#fff", border: `1.5px solid ${DO_C.ink}`, color: DO_C.ink, borderRadius: 9, padding: "8px 16px", fontSize: 12.4, fontWeight: 900, cursor: "pointer" }}>⬆ 백업 파일 복원</button>
      <button onClick={() => setShowSnip(!showSnip)} style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#6D28D9", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{showSnip ? "코드 접기 ▲" : "콘솔 붙여넣기 코드(F12) ▼"}</button>
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) doRestore(e.target.files[0]); e.target.value = ""; }} />
    </div>
    {msg && <div style={{ marginTop: 8, background: msg.ok ? "#E7F8EE" : "#FDECEC", color: msg.ok ? DO_C.ok : DO_C.bad, borderRadius: 8, padding: "7px 10px", fontSize: 11.6, fontWeight: 700 }}>{msg.t}</div>}
    {showSnip && (<div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11.2, color: "#475569", lineHeight: 1.65 }}>화면이 안 열리는 상황이나 <b>다른 주소(오리진)의 브라우저</b>에서도 쓰는 자족 코드예요 — 앱 없이 F12 콘솔에 붙여넣기만 하면 돼요. 이사 절차: ①옛 주소에서 백업 코드 실행(JSON 저장) ②새 주소에서 복원 코드 실행(파일 선택).</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}><b style={{ fontSize: 11.4 }}>① 백업 코드</b><button onClick={() => copySnip(HIFIN_SNIPPET_BACKUP, "백업")} style={{ fontSize: 10.6, border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "2px 9px", cursor: "pointer" }}>복사</button></div>
      <div style={snipBox}>{HIFIN_SNIPPET_BACKUP}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}><b style={{ fontSize: 11.4 }}>② 복원 코드</b><button onClick={() => copySnip(HIFIN_SNIPPET_RESTORE, "복원")} style={{ fontSize: 10.6, border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "2px 9px", cursor: "pointer" }}>복사</button></div>
      <div style={snipBox}>{HIFIN_SNIPPET_RESTORE}</div>
    </div>)}
    <div style={{ fontSize: 10.4, color: DO_C.mut, marginTop: 7 }}>⚠ 백업 파일에는 가명 금고 원본이 담겨요 — <b>본인 보관 전용, 외부 전송·공유 금지</b>. 복원은 하이핀 백업만 받아요(버전·체크섬 검증, 카탈로그 미등재 키는 건너뛰고 보고). 복원 직전 상태는 이 세션에 자동 보관돼 실수를 되돌릴 수 있어요.</div>
  </div>);
}

function DataOpsConsole() {
  const [tick, setTick] = React.useState(0);
  const sum = (typeof hifinCatalogSummary === "function") ? hifinCatalogSummary() : null;
  const layers = (typeof HIFIN_DATA_LAYERS !== "undefined") ? HIFIN_DATA_LAYERS : [];
  const ext = (typeof HIFIN_EXTERNAL_SOURCES !== "undefined") ? HIFIN_EXTERNAL_SOURCES : [];
  const scan = React.useMemo(() => doScanStorage(), [tick]);
  const H = (typeof HM_HARNESS_SNAPSHOT !== "undefined") ? HM_HARNESS_SNAPSHOT : null;
  const O = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const W = (typeof HM_WEEKLY_SNAPSHOT !== "undefined") ? HM_WEEKLY_SNAPSHOT : null;
  const pct = Math.min(100, Math.round(scan.totalB / (5 * 1024 * 1024) * 100));
  const box = { background: "#fff", border: `1px solid ${DO_C.line}`, borderRadius: 12, padding: "12px 14px" };
  const bt = { fontSize: 12.6, fontWeight: 900, color: DO_C.ink, marginBottom: 8 };
  const pill = (bg, c, t) => <span style={{ display: "inline-block", background: bg, color: c, borderRadius: 8, padding: "2px 9px", fontSize: 11, fontWeight: 800, marginRight: 5, marginBottom: 4 }}>{t}</span>;
  const stColor = (s) => /사용 중|연결됨/.test(s) ? [DO_C.ok, "#E7F8EE"] : /핵심/.test(s) ? ["#C2410C", "#FFF1E2"] : /협의/.test(s) ? ["#1D4ED8", "#EFF6FF"] : [DO_C.mut, "#F1F5F9"];
  return (<div>
    {/* 헤더 — 살아있는 원천 선언 */}
    <div style={{ background: "linear-gradient(135deg,#0B2239,#16405F)", borderRadius: 14, padding: "16px 18px", color: "#DCE7F2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#FFB25E", fontWeight: 800 }}>HI-FIN DATA OPERATIONS · v1.1</div>
          <div style={{ fontSize: 16.5, fontWeight: 900, color: "#fff", marginTop: 2 }}>데이터 운영 관제 — 인벤토리 · 저장소 실측 · 외부 소스 · 게이트</div>
          <div style={{ fontSize: 11.4, color: "#8FA9C0", marginTop: 3 }}>이 화면은 보고서가 아니라 원천(dataCatalog.js)을 읽어요 — 카탈로그·게이트가 바뀌면 화면이 그대로 따라옵니다. 관측 전용(수기 편집 없음).</div>
        </div>
        <button onClick={() => setTick((t) => t + 1)} style={{ background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.35)", color: "#fff", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>↻ 실측 새로고침</button>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12, fontSize: 12.4 }}>
        {[["저장 계층", layers.length + "계층"], ["등재 키", sum ? (sum.keysStatic + "+" + sum.keysPrefix + "종") : "-"], ["키 그룹 규약", sum ? sum.groups + "종" : "-"], ["외부 소스", sum ? sum.external + "종" : "-"], ["이 기기 실사용", scan.rows.reduce((s, r) => s + r.n, 0) + "키 · " + (scan.totalB / 1024).toFixed(0) + "KB"], ["미등재 검출", scan.unknown.length + "건"]].map(([k, v], i) => (
          <div key={i}><b style={{ fontSize: 15.5, color: i === 5 && scan.unknown.length ? "#FCA5A5" : "#fff" }}>{v}</b><div style={{ fontSize: 10.4, color: "#8FA9C0" }}>{k}</div></div>))}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 10, marginTop: 10 }}>
      {/* ① 6계층 지도 */}
      <div style={box}><div style={bt}>① 저장 계층 지도 — 데이터가 사는 여섯 곳</div>
        {layers.map((l) => (<div key={l.k} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px dashed #EEF2F6", fontSize: 11.8 }}>
          <b style={{ width: 26, color: DO_C.brand }}>{l.k}</b>
          <div style={{ flex: 1 }}><b>{l.ko}</b> <span style={{ color: DO_C.mut }}>— {l.note}</span><div style={{ fontSize: 10.6, color: DO_C.mut }}>📍 {l.where} · {l.own}</div></div>
        </div>))}
      </div>
      {/* ② 저장소 실측 관제 */}
      <div style={box}><div style={bt}>② 이 기기 저장소 실측 — 카탈로그 대조 <span style={{ fontWeight: 600, color: DO_C.mut, fontSize: 10.6 }}>(세션 키 {scan.sessN}종 별도)</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 10, background: "#F1F5F9", borderRadius: 5 }}><div style={{ width: pct + "%", height: 10, borderRadius: 5, background: pct > 80 ? DO_C.bad : DO_C.brand }} /></div>
          <span style={{ fontSize: 11, color: DO_C.mut }}>{(scan.totalB / 1024).toFixed(0)}KB / ~5MB({pct}%)</span>
        </div>
        {scan.rows.map((r) => (<div key={r.g} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.6, padding: "3.5px 0", borderBottom: "1px dashed #EEF2F6" }}>
          <span><b>{r.g}</b> <span style={{ color: DO_C.mut, fontSize: 10.2 }}>· 민감도 {r.sensitive}</span>{r.unknown ? <span style={{ color: DO_C.bad, fontWeight: 800 }}> · 미등재 {r.unknown}</span> : null}</span>
          <span style={{ color: "#475569" }}>{r.n}키 · {(r.bytes / 1024).toFixed(1)}KB</span>
        </div>))}
        {scan.unknown.length > 0
          ? <div style={{ marginTop: 7, background: "#FEF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 9px", fontSize: 11.2, color: DO_C.bad }}><b>⚠ 미등재 키</b> — {scan.unknown.join(", ")} · dataCatalog.js 등재 필요(커밋 게이트가 코드 유입은 이미 차단)</div>
          : <div style={{ marginTop: 7, fontSize: 11.2, color: DO_C.ok, fontWeight: 700 }}>✓ 실사용 키 전건이 카탈로그에 등재되어 있어요</div>}
      </div>
    </div>

    {/* ③ 외부 소스·커넥터 */}
    <div style={Object.assign({ marginTop: 10 }, box)}><div style={bt}>③ 외부 데이터 소스·커넥터 맵({ext.length}종) — 무엇을 어디서 가져오나</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
        {ext.map((s) => { const [c, bg] = stColor(s.status + s.phase); return (
          <div key={s.key} style={{ border: `1px solid ${DO_C.line}`, borderRadius: 10, padding: "8px 11px", fontSize: 11.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><b>{s.ko}</b>{pill(bg, c, s.status)}</div>
            <div style={{ color: DO_C.mut, fontSize: 10.6, margin: "2px 0" }}>📍 {s.url} · 갱신 {s.cycle}</div>
            <div style={{ color: "#374151" }}>{s.brings}</div>
            <div style={{ fontSize: 10.4, color: DO_C.brand, fontWeight: 800, marginTop: 2 }}>단계 {s.phase}</div>
          </div>); })}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 10, marginTop: 10 }}>
      {/* ④ 게이트·하네스 */}
      <div style={box}><div style={bt}>④ 게이트 상태 — 발행·커밋을 막는 구조</div>
        <div style={{ marginBottom: 6 }}>
          {pill("#E7F8EE", DO_C.ok, "카탈로그 게이트 가동 — 미등재 키 커밋 차단")}
          {H && pill(H.pass ? "#E7F8EE" : "#FDECEC", H.pass ? DO_C.ok : DO_C.bad, "스크립트 하네스 " + (H.pass ? "통과" : "실패"))}
          {O && pill(O.pass ? "#E7F8EE" : "#FDECEC", O.pass ? DO_C.ok : DO_C.bad, "10만 배치 " + (O.pass ? "통과" : "실패"))}
        </div>
        <div style={{ fontSize: 11.6, color: "#475569", lineHeight: 1.8 }}>
          {H && <span>A5 회귀 {H.coachAcc}% · 금지어 {H.forbiddenHits}건 · 골든셋 드리프트 {H.goldenDrift}건<br /></span>}
          {O && <span>배치 {O.date}: 코호트 {Number(O.total).toLocaleString()}명 · 카드 {Number(O.cards).toLocaleString()}건 · 발행 {O.publishable === O.cards ? "100%" : O.publishable} · 프로 {O.pros}명 조립 위반 {O.rosterViol}건<br /></span>}
          {W && W.week && <span>주간 학습({W.week}): 블록 사용 {W.blockKinds}/{W.blockTotal}종 · 개선 후보 {W.candidates.length}건(형 검수 경유)<br /></span>}
          <span style={{ fontSize: 10.6, color: DO_C.mut }}>갱신 경로는 하나: 카탈로그·스냅샷 등재 → pre-commit 게이트 통과 → 이 화면 자동 반영. 훅: __hifinCatalog · __hifinCtx(관리자)</span>
        </div>
      </div>
      {/* ⑤ 로드맵 */}
      <div style={box}><div style={bt}>⑤ 운영 로드맵 — D-1 → D-3</div>
        {[["D-1 카탈로그 상설", "dataCatalog 단일 소스 · 미등재 키 커밋 차단 · memberContext(id) 1콜 360뷰(500명 1초 검증)", "완료 · 2026-08-30", DO_C.ok, "#E7F8EE"],
          ["D-2 서버 이관", "회원 원장 암호화 DB(금고 스키마 승격) · 마이헬스웨이/마이데이터/공시실 실연동 · 백업·보존·복구 리허설", "대기 — 형 검수+보안 점검", DO_C.warn, "#FFF7ED"],
          ["D-3 자산화·실체인", "세대형 자산+SBT · 온체인=해시·동의증서·접근로그만(원본 오프체인) · 정산 컨트랙트 · L3 우선", "대기 — 형 승인+법률 검토", DO_C.mut, "#F1F5F9"]].map(([k, v, st, c, bg], i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px dashed #EEF2F6", fontSize: 11.8 }}>
            <div style={{ flex: 1 }}><b>{k}</b><div style={{ color: "#475569", fontSize: 11 }}>{v}</div></div>
            {pill(bg, c, st)}
          </div>))}
        <div style={{ fontSize: 10.6, color: DO_C.mut, marginTop: 6 }}>거버넌스: 단일 소스 · 가공 금지 · 원가 비노출 · 원본은 회원에게(체인에는 해시만) · 문안·정책 변경은 형 검수 경유. 상세 보고서: docs/hi_dataops/…v1.1(md·pdf)</div>
      </div>
    </div>

    <DoBackupBlock scan={scan} onRefresh={() => setTick((t) => t + 1)} />
  </div>);
}
