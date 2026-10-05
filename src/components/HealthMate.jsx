/* ══════════════ 헬스메이트(프로) 센터 — Today + 9워크벤치 ══════════════
   설계서 v1.2 구현. 디자인: 현대해상 오렌지(HM_C) · 깔끔한 카드형.
   접근: 관리자 세션 + 프로 사번 게이트(2단계 · 사번 체계 8H0001~8H9999). 일반 회원 네비 미노출(isRestrictedSection). */

function HmStyle() {
  return (<style>{`
  .hmwrap{--hmo:${HM_C.pri};--hmod:${HM_C.dark};--hmbg:${HM_C.bg};--hmln:${HM_C.line};font-size:13px;color:${HM_C.ink}}
  .hmhero{background:linear-gradient(120deg,#B34E00,#F5821F 60%,#FFA94D);border-radius:16px;color:#fff;padding:18px 22px;position:relative;overflow:hidden}
  .hmhero .k{font-size:10.5px;letter-spacing:2.5px;opacity:.85;font-weight:800}
  .hmhero h2{margin:4px 0 2px;font-size:20px;font-weight:900}
  .hmcard{background:#fff;border:1px solid var(--hmln);border-radius:14px;padding:14px 16px;margin-top:10px}
  .hmtabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .hmtabsub{margin:8px 2px 0;background:#F8FAFC;border:1px solid var(--hmln);border-left:3px solid var(--hmo);border-radius:0 10px 10px 0;padding:7px 12px;font-size:11.8px;line-height:1.55;color:${HM_C.mut}}
  .hmtabsub b{color:${HM_C.deep}}
  .hmtab{border:1.5px solid var(--hmln);background:#fff;border-radius:999px;padding:7px 13px;font-size:12.3px;font-weight:800;cursor:pointer;color:${HM_C.mut};display:flex;align-items:center;gap:5px}
  .hmtab.on{background:var(--hmo);border-color:var(--hmo);color:#fff}
  .hmnumwrap{display:grid;grid-template-columns:4fr 2fr 1.4fr;gap:10px;margin-top:12px;align-items:start}
  .hmnumgrp{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:8px 9px 10px}
  .hmnumgt{font-size:10.6px;font-weight:800;letter-spacing:.3px;opacity:.95;margin:1px 2px 6px}
  .hmnum{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:7px}
  .hmnum .n{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);border-radius:12px;padding:8px 11px 9px;cursor:pointer;transition:transform .12s ease,background .12s ease}
  .hmnum .n:hover{background:rgba(255,255,255,.26);transform:translateY(-1px)}
  .hmnum .n b{font-size:21px;display:block;line-height:1.15;font-variant-numeric:tabular-nums}
  .hmnum .n span{font-size:11.2px;font-weight:700;opacity:.97;display:block;margin-top:1px;line-height:1.32}
  .hmnum .n em{font-size:10px;font-style:normal;opacity:.78;display:block;margin-top:2px}
  .hmnum .n.hold{background:rgba(255,255,255,.07);border-style:dashed;opacity:.82}
  .hmnum .n.hold b{color:#FFE9D2}
  .hmdb{border:1px dashed var(--hmo);background:var(--hmbg);border-radius:12px;padding:10px 13px;margin-bottom:10px;cursor:pointer}
  .hmdb table{font-size:11.8px;border-collapse:collapse;width:100%;margin-top:7px}
  .hmdb td{padding:3px 6px;vertical-align:top;line-height:1.55}
  .hmdb td.k{color:${HM_C.deep};font-weight:900;width:44px;white-space:nowrap}
  .hmpill{display:inline-block;border-radius:999px;padding:1px 8px;font-size:10.5px;font-weight:800}
  .hmrow{border:1px solid #EEF1F6;border-radius:12px;padding:11px 13px;margin-bottom:8px;background:#fff}
  .hmrow.lock{background:#F8FAFC;opacity:.85}
  .hmbtn{border:none;border-radius:9px;padding:7px 13px;font-size:12px;font-weight:800;cursor:pointer;background:var(--hmo);color:#fff;display:inline-flex;align-items:center;gap:5px}
  .hmbtn.gh{background:#fff;border:1.5px solid var(--hmln);color:${HM_C.dark}}
  .hmbtn:disabled{background:#CBD5E1;cursor:not-allowed;color:#fff}
  .hmpipe{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
  .hmpipe .st{border:1.5px solid var(--hmln);border-radius:11px;padding:8px 6px;text-align:center;cursor:pointer;background:#fff}
  .hmpipe .st.on{border-color:var(--hmo);background:var(--hmbg)}
  .hmpipe .st b{font-size:17px;color:${HM_C.dark};display:block}
  .hmpipe .st i{font-style:normal;font-size:10.3px;color:${HM_C.mut};font-weight:700}
  .hmdots{display:inline-flex;gap:3px;vertical-align:middle}
  .hmdots s{width:9px;height:9px;border-radius:3px;background:#E5E7EB;text-decoration:none}
  .hmdots s.on{background:var(--hmo)}
  .hmdots s.gap{margin-left:6px}
  .hmhi{background:var(--hmbg);border-left:3px solid var(--hmo);border-radius:0 10px 10px 0;padding:8px 11px;font-size:12px;line-height:1.6;margin-top:8px}
  .hmgrid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .hmfoot{font-size:10.6px;color:${HM_C.mut};line-height:1.6;margin-top:10px;border-top:1px solid #F1F5F9;padding-top:8px}
  .hmqa{background:#1F2937;color:#F9FAFB;border-radius:12px;padding:11px 13px;font-size:12.4px;line-height:1.7}
  @media(max-width:1100px){.hmnumwrap{grid-template-columns:1fr}}
  @media(max-width:900px){.hmnum{grid-template-columns:repeat(2,1fr)}.hmpipe{grid-template-columns:repeat(4,1fr)}.hmgrid2{grid-template-columns:1fr}}
  `}</style>);
}

/* 표시 이름 — 프로/관리자 콘솔 안에서는 가리지 않고 전체 이름을 쓴다(형 지시 2026-10-05).
   ⚠️ 마스킹 정의(_hmMask · _hcMask)와 데이터 계층은 손대지 않는다 — 회원이 보는 화면의 마스킹 규칙,
      인계 카드 데이터(card.member.mask)와 대본 {가명} 슬롯, 골든셋(fixtures/handoff_*_v1.json)은 그대로다.
      해제는 "렌더 지점"에서만 일어나고, 그 유일한 통로가 이 함수다. 이 콘솔은 사번 게이트 뒤의
      프로 전용 화면이고(회원 역할은 isRestrictedSection으로 도달 불가), 코호트 10만 명은 합성 데이터다. */
function _hmProName(x) {
  if (!x) return "회원";
  if (typeof x === "string") return x;                       /* 이미 이름 문자열 */
  if (x.name) return String(x.name);                         /* 회원 레코드(m) · 코호트 멤버 */
  if (x.cohortIndex != null && typeof cohortMemberAt === "function") {
    try { const m = cohortMemberAt(x.cohortIndex); if (m && m.name) return String(m.name); } catch (e) {}
  }
  return String(x.mask || "회원");                            /* 원천을 못 찾으면 마스크 그대로(열지 않는다) */
}

/* 「이 화면의 DB」 패널 — HM_DB_NOTE 단일 소스, 접이식 + 담당 단계 배지 */
function HmDbNote({ k }) {
  const [open, setOpen] = React.useState(false);
  const n = HM_DB_NOTE[k];
  if (!n) return null;
  return (
    <div className="hmdb" onClick={() => setOpen(!open)} data-dbnote={k}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 900, fontSize: 12, color: HM_C.deep }}><Database size={12} style={{ verticalAlign: -2 }} /> 이 화면의 DB — 원천·의미·활용·근거 {open ? "▲" : "▼"}</span>
        <span className="hmpill" style={{ background: "#fff", border: `1px solid ${HM_C.line}`, color: HM_C.dark }}>담당 단계 {n.stage}</span>
      </div>
      {open && <table><tbody>
        <tr><td className="k">원천</td><td>{n.src}</td></tr>
        <tr><td className="k">의미</td><td>{n.mean}</td></tr>
        <tr><td className="k">활용</td><td>{n.use}</td></tr>
        <tr><td className="k">근거</td><td>{n.legal}</td></tr>
      </tbody></table>}
    </div>
  );
}

function HmStageDots({ reached }) {
  return (<span className="hmdots">{HM_STAGES.map((s, i) => <s key={s.k} className={(reached.indexOf(s.k) >= 0 ? "on" : "") + (i === 4 ? " gap" : "")} title={s.k + " " + s.name} />)}</span>);
}
function HmStatusChip({ st }) {
  return <span className="hmpill" style={{ background: st.bg, color: st.c, border: `1px solid ${st.c}33` }}>{st.k === "HELD" && <Lock size={9} style={{ verticalAlign: -1 }} />} {st.ko}</span>;
}

/* 페이지네이션(코호트 목록 공용 — 페이지당 20) */
function HmPager({ total, page, setPage, per = 20 }) {
  const last = Math.max(1, Math.ceil(total / per));
  if (last <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", margin: "8px 0 2px", fontSize: 11.5 }}>
      <button className="hmbtn gh" style={{ padding: "3px 10px" }} disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
      <span style={{ color: HM_C.mut, fontWeight: 700 }}>{page} / {last} 페이지 · 총 {total.toLocaleString()}명</span>
      <button className="hmbtn gh" style={{ padding: "3px 10px" }} disabled={page >= last} onClick={() => setPage(page + 1)}>다음</button>
    </div>
  );
}
/* 코호트 관측층 카드 — 체험 카드와 같은 2축, 행동 결과는 세션에만 */
function HmCohortCard({ card, code, onDone, compact }) {
  const c = card;
  const locked = c.status.k === "HELD";
  const [vidOpen, setVidOpen] = React.useState(false);   /* 영상 V2 */
  let vg = { ok: false, code: "" };
  try { vg = vsGateOf(c.i); } catch (e) {}
  let vfit = null; try { vfit = vsSegFit(c.i); } catch (e) {}   /* 영상 V5 — 채널 적합도 */
  return (
    <div className={"hmrow" + (locked ? " lock" : "")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontWeight: 900 }}>
          {locked && <Lock size={12} color={HM_C.hold} style={{ verticalAlign: -2, marginRight: 3 }} />}
          {_hmProName(c.m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.sex} · {c.region ? c.region.sido + " " + c.region.sgg : "-"}</span>
          <span className="hmpill" style={{ marginLeft: 6, background: "#F1F5F9", color: HM_C.mut }}>코호트</span>
          <span className="hmpill" style={{ marginLeft: 4, background: HM_C.bg, color: HM_C.dark }}>{c.stage.cur} {HM_STAGES.find((s) => s.k === c.stage.cur).name}</span>
          {c.stage.stalled && <span className="hmpill" style={{ marginLeft: 4, background: "#FFF7ED", color: HM_C.stall }}>🟠 정체 {c.stage.stalledDays}일</span>}
        </div>
        <div><HmStageDots reached={c.stage.reached} /> <HmStatusChip st={c.status} /></div>
      </div>
      {!compact && (<div className="hmgrid2" style={{ marginTop: 7 }}>
        <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "6px 10px", fontSize: 11.4, lineHeight: 1.65 }}>
          <b style={{ color: HM_C.deep, fontSize: 10.5 }}>건강현황</b><br />
          종합 등급 <b>{c.hb.grade}</b> · 관리 필요 <b>{c.hb.sevN}항목</b> · 위험 밴드 <b>{c.hb.band}</b>
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "6px 10px", fontSize: 11.4, lineHeight: 1.65 }}>
          <b style={{ color: HM_C.deep, fontSize: 10.5 }}>관리상태</b><br />
          {c.status.ko}{c.famN >= 2 ? ` · 가구 ${c.famN}명` : ""} · <span style={{ color: HM_C.mut }}>{c.why.split("→")[1] || ""}</span>
        </div>
      </div>)}
      {!compact && <div className="hmhi" style={{ marginTop: 7 }}><Bot size={12} style={{ verticalAlign: -2 }} /> {c.hi}</div>}
      <div style={{ display: "flex", gap: 6, marginTop: 7, alignItems: "center" }}>
        <button className="hmbtn" style={{ padding: "5px 11px", fontSize: 11 }} disabled={locked} onClick={() => { const r = hmcTouch(code, c.i, "코호트 접촉"); if (onDone) onDone(r); }}><Phone size={11} /> 연결하기</button>
        {vg.ok
          ? <><button className="hmbtn gh" style={{ padding: "5px 11px", fontSize: 11 }} onClick={() => setVidOpen(true)}><Video size={11} /> 영상 상담 요청</button>
              {vfit && vfit.fit === "high" && <span className="hmpill" style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 10.2 }} title={vfit.why}>📹 영상 권장 · {vfit.seg}</span>}</>
          : <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut, fontSize: 10.2 }} title={vg.why || ""}>📹 {vg.code === "consent" ? "영상 동의 없음" : vg.code === "lock" ? "접촉 락" : vg.code === "hold" ? "접촉 보류" : "요청 불가"}</span>}
        <span style={{ fontSize: 10.3, color: HM_C.mut }}>{locked ? "결과 수령 대기 — 시스템이 자동 해제" : "시연 기록(세션) — 새로고침 시 초기화"}</span>
      </div>
      {vidOpen && <HmVideoModal subject={c.i} name={_hmProName(c.m)} card={(() => { try { return buildHandoffCard(c.i, { v2: true }); } catch (e) { return null; } })()}
        onClose={() => setVidOpen(false)}
        onDone={(r) => { const t = hmcTouch(code, c.i, "영상 상담" + (r.mode ? "(" + (r.mode === "video" ? "영상" : r.mode === "voice" ? "음성" : "문자") + ")" : "")); if (onDone) onDone(t); }} />}
    </div>
  );
}
/* 코호트 목록 래퍼 — 인덱스 배열을 페이지 단위로 카드 생성(on-demand) */
function HmCohortList({ ids, code, onDone, title, compact }) {
  const [page, setPage] = React.useState(1);
  if (!ids || !ids.length) return null;
  const slice = ids.slice((page - 1) * 20, page * 20);
  return (<div style={{ marginTop: 10 }}>
    <div style={{ fontWeight: 900, fontSize: 12.5, margin: "2px 0 7px", color: HM_C.deep }}>{title} <span style={{ color: HM_C.mut, fontWeight: 700 }}>· 코호트 관측층 {ids.length.toLocaleString()}명(시연 분포)</span></div>
    {slice.map((i) => { const card = cohortCardOf(i); return card ? <HmCohortCard key={i} card={card} code={code} onDone={onDone} compact={compact} /> : null; })}
    <HmPager total={ids.length} page={page} setPage={setPage} />
  </div>);
}

/* 프로 검색 — 사번/이름/지점/시군구, 최대 8건. 인원은 hmProsGen().length가 단일 소스다(현재 702명 — 숫자를 여기 박지 않는다). */
function HmProSearch({ onPick }) {
  const [q, setQ] = React.useState("");
  const all = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES;
  /* 구 코드(legacyCode)도 건초더미에 넣는다 — 옛 메모를 들고 와도 찾아지되, 표시는 신 사번만 */
  const hits = q.trim().length >= 2 ? all.filter((p) => [p.code, p.name, p.branch, p.sgg, p.dan, p.legacyCode || ""].join("|").toUpperCase().indexOf(q.trim().toUpperCase()) >= 0).slice(0, 8) : [];
  return (<div style={{ marginTop: 6 }}>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 8H0001 · 은평 · 강남구 · 박성호" style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "8px 12px", fontSize: 12.5 }} />
    {hits.map((p) => (
      <div key={p.code} onClick={() => onPick(p.code)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F1F5F9", borderRadius: 9, padding: "7px 11px", marginTop: 5, cursor: "pointer", fontSize: 12 }}>
        <span><b>{p.name} 프로</b> <span style={{ color: HM_C.mut }}>· {p.code} · {p.branch || p.dan}{p.sgg ? " · " + p.sgg : ""}</span></span>
        <span className="hmpill" style={{ background: p.status === "활성" ? "#F0FDF4" : "#FFF7ED", color: p.status === "활성" ? HM_C.ok : HM_C.warn }}>{p.status} · {p.grade}{p.lic ? " · 모집" : ""}</span>
      </div>
    ))}
    {q.trim().length >= 2 && !hits.length && <div style={{ fontSize: 11.3, color: HM_C.mut, marginTop: 5 }}>일치하는 프로가 없어요.</div>}
  </div>);
}

/* 사번 게이트 — 사번(프로 코드) 입력 + 상태·자격 검증(세션 한정)
   시연 기본값(HM_DEMO_SABUN · 단일 소스는 healthMate.js)이 입력칸에 "값"으로 채워져 있고,
   [인증]만 누르면 그 프로의 콘솔로 들어간다. 자동 제출은 하지 않는다 — 인증은 사람이 누르는 행위로 남긴다.
   판정·안내 문구는 전부 hmCodeCheck(구 코드 전환·미등록·정지 구분)에서 받아 쓴다. */
function HmGate({ onPass }) {
  const DEF = (typeof HM_DEMO_SABUN === "string" && HM_DEMO_SABUN) ? HM_DEMO_SABUN : "8H0001";
  const SUSP = (typeof HM_SUSPENDED_DEMO === "string" && HM_SUSPENDED_DEMO) ? HM_SUSPENDED_DEMO : "";
  const [code, setCode] = React.useState(DEF);        /* 자동 채움 — placeholder가 아니라 실제 값(수정 가능) */
  const [err, setErr] = React.useState("");
  const [peek, setPeek] = React.useState(null);       /* 입력된 사번의 소유자 요약(담당 수는 비동기 집계) */
  const pros = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES;
  /* 소개 줄 숫자 — 리터럴을 박지 않고 데이터에서 센다(위촉 인원 · 지역단 · 실사 지점 · 코호트 회원) */
  const stat = React.useMemo(() => {
    const dan = {};
    pros.forEach((p) => { if (p.dan && p.dan.indexOf("지역단") >= 0) dan[p.dan] = 1; });
    let br = 0;
    try { if (typeof LR_BRANCHES === "object" && LR_BRANCHES) Object.keys(LR_BRANCHES).forEach((k) => { br += (LR_BRANCHES[k] || []).length; }); } catch (e) {}
    if (!br) { const s = {}; pros.forEach((p) => { if (p.branch) s[p.branch] = 1; }); br = Object.keys(s).length; }
    const mem = (typeof PILOT_N === "number" && PILOT_N > 0) ? PILOT_N : 100000;
    return { pros: pros.length, dan: Object.keys(dan).length, br: br, mem: mem };
  }, []);
  /* 상호작용 시연 버튼 — 명부 10명 중 담당 회원(체험+본인)이 있는 프로 상위 5명.
     hmScope를 9번 부르므로 렌더마다 다시 세지 않게 메모한다. 지점·시군구가 채워진 완전 레코드를
     쓰려고 HM_CODES가 아니라 hmProsGen()의 legacy 레코드를 모집단으로 삼는다. */
  const proBtns = React.useMemo(() => {
    const base = pros.filter((p) => p.legacy && p.status === "활성");
    return base.map((p) => { let n = 0; try { n = hmScope(p.code).length; } catch (e) {} return { p, n }; })
      .sort((a, b) => b.n - a.n).slice(0, 5);
  }, []);
  /* 입력값이 가리키는 프로(구 코드도 hmProOf가 해석) — 모르는 값이면 null */
  const cur = React.useMemo(() => { try { return (typeof hmProOf === "function") ? hmProOf(code) : null; } catch (e) { return null; } }, [code]);
  const curCode = cur ? cur.code : "";
  /* 담당 회원 수는 코호트 10만 인덱스를 세워야 나온다(첫 호출 수 초) — 첫 페인트를 막지 않게 뒤로 미룬다.
     시연 이점: 게이트가 떠 있는 동안 인덱스가 데워져 [인증] 직후 콘솔이 바로 열린다. */
  React.useEffect(() => {
    setPeek(null);
    if (!curCode) return;
    let on = true;
    const t = setTimeout(() => {
      let own = 0, coh = 0, self = 0;
      try { if (typeof hmScope === "function") { const sc = hmScope(curCode); self = sc.filter((m) => typeof hmIsSelf === "function" && hmIsSelf(m)).length; own = sc.length - self; } } catch (e) {}
      try { if (typeof hmMembersOfPro === "function") coh = hmMembersOfPro(curCode).length; } catch (e) {}
      if (on) setPeek({ code: curCode, own: own, self: self, coh: coh, n: own + self + coh });
    }, 350);
    return () => { on = false; clearTimeout(t); };
  }, [curCode]);
  const submit = (c) => {
    const raw = (c == null ? code : c);
    const r = (typeof hmCodeCheck === "function") ? hmCodeCheck(raw) : null;
    if (!r) { setErr("인증 모듈을 불러오지 못했어요 — 새로고침해 주세요."); return; }
    if (!r.ok) { setErr(r.why); return; }
    try { sessionStorage.setItem("hifin_hm_code", r.code); } catch (e) {}
    try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `프로 콘솔 접속 — ${r.code}(${r.pro.dan})` }); } catch (e) {}
    onPass(r.code);
  };
  return (
    <div className="hmwrap"><HmStyle />
      <div className="hmhero">
        <div className="k">HEALTHMATE PRO CONSOLE</div>
        <h2>헬스메이트(프로) 센터</h2>
        <div style={{ fontSize: 12.5, opacity: .92 }}>사번이 부여된 전문헬스메이트 전용 콘솔 — 하이가 분석하고, 프로가 마무리합니다.</div>
        <div style={{ marginTop: 6, fontSize: 11.5, opacity: .85 }}>현대해상 설계사 <b>{stat.pros.toLocaleString()}명</b>을 하이핀 프로로 위촉 · 전국 <b>{stat.dan}개 지역단</b> · 실사 지점 <b>{stat.br.toLocaleString()}개</b> 기준 시군구 배속 · 회원 {stat.mem >= 10000 ? (stat.mem / 10000).toLocaleString() + "만 명" : stat.mem.toLocaleString() + "명"} 지역 매칭</div>
      </div>
      <div className="hmcard" style={{ maxWidth: 560 }}>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>사번(프로 코드) 인증</div>
        <div style={{ fontSize: 11.8, color: HM_C.mut, marginBottom: 9, lineHeight: 1.6 }}>사번은 자격·권한·실적의 단일 키예요(체계 <b style={{ color: HM_C.deep }}>8H0001~8H9999</b>). 이 탭 세션에만 보관되고, 탭을 닫거나 [사번 잠금]을 누르면 즉시 잠겨요.</div>
        <div style={{ display: "flex", gap: 7 }}>
          <input value={code} aria-label="프로 사번" autoComplete="off" spellCheck={false}
            onChange={(e) => { setCode(e.target.value); if (err) setErr(""); }}
            placeholder={DEF}
            style={{ flex: 1, border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "10px 12px", fontSize: 14.5, fontWeight: 800, letterSpacing: 1.5, color: HM_C.ink }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <button className="hmbtn" style={{ fontSize: 13, fontWeight: 900, padding: "10px 18px" }} onClick={() => submit()}>인증</button>
        </div>
        {/* 자동 채움 사번의 주인 — 시연에서 한 줄로 설명할 수 있게 사실만 */}
        {cur && (
          <div style={{ marginTop: 8, background: HM_C.bg, border: `1px solid ${HM_C.line}`, borderRadius: 10, padding: "8px 11px", fontSize: 12.3, lineHeight: 1.65, color: HM_C.ink }}>
            <b style={{ color: HM_C.deep }}>{cur.sabun || cur.code}</b> — <b>{cur.name} 프로</b> · {cur.branch || cur.dan}{cur.sgg ? " · " + cur.sgg : ""} · {cur.grade}({cur.gradeKo}){cur.lic ? " · 모집자격" : " · 안내 전용"}{cur.status !== "활성" ? <b style={{ color: HM_C.red }}>{" · " + cur.status}</b> : ""}
            <div style={{ color: HM_C.mut, marginTop: 1 }}>담당 회원 {peek && peek.code === curCode
              ? <b style={{ color: HM_C.ink }}>{peek.n.toLocaleString()}명</b>
              : <span>집계 중…</span>}{peek && peek.code === curCode ? ` (${peek.self ? "본인(실측) " + peek.self + " · " : ""}체험 ${peek.own.toLocaleString()} · 코호트 ${peek.coh.toLocaleString()})` : ""}</div>
            <div style={{ fontSize: 11.3, color: HM_C.mut, marginTop: 3 }}>
              {code.trim().toUpperCase() === DEF ? "시연 기본값이 채워져 있어요 — [인증]을 누르면 이 프로의 콘솔로 들어가요. 다른 사번을 쓰려면 지우고 입력하세요." : "입력한 사번의 프로예요 — [인증]을 누르면 이 프로의 콘솔로 들어가요."}
              {code.trim().toUpperCase() !== DEF && <button className="hmbtn gh" style={{ fontSize: 10.8, marginLeft: 6, padding: "2px 8px" }} onClick={() => { setCode(DEF); setErr(""); }}>시연 사번({DEF}) 되돌리기</button>}
            </div>
          </div>
        )}
        {err && <div style={{ color: HM_C.red, fontSize: 12, fontWeight: 700, marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 800, color: HM_C.deep }}>프로 검색 — 사번·이름·지점·시군구</div>
        <HmProSearch onPick={(c) => submit(c)} />
        <div style={{ marginTop: 11, fontSize: 11, color: HM_C.mut }}>상호작용 시연 — 담당 회원을 직접 눌러 볼 수 있는 프로(체험 회원 + 본인 계정 실측):</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
          {proBtns.map(({ p, n }) => (
            <button key={p.code} className="hmbtn gh" style={{ fontSize: 11 }} onClick={() => submit(p.code)}>{p.name} 프로 · {p.sgg || p.dan.replace("지역단", "")} <b style={{ color: HM_C.pri }}>{n}명</b></button>
          ))}
          {SUSP && (() => { const sp = (typeof hmProOf === "function") ? hmProOf(SUSP) : null; return (
            <button className="hmbtn gh" style={{ fontSize: 11, opacity: .6 }} onClick={() => submit(SUSP)}>{sp ? sp.name + " 프로" : SUSP}(정지 사번 시연)</button>); })()}
        </div>
      </div>
    </div>
  );
}

/* ① 신호 카드 */
function HmTabSignals({ code, onContact, cview }) {
  const cards = hmSignals(code);
  const [openId, setOpenId] = React.useState(null);
  return (<div>
    <HmDbNote k="t1" />
    {!cards.length && <div className="hmrow" style={{ color: HM_C.mut }}>지금 접촉 근거가 있는 회원이 없어요 — 하이가 신호를 감지하면 여기에 카드가 생겨요(근거 없는 대상은 존재하지 않아요).</div>}
    {cview && <HmCohortList title="① 신호 도래 회원" ids={cview.signals} code={code} compact />}
    {cards.map((c, i) => (
      <div key={i} className="hmrow">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontWeight: 900 }}>
            {_hmProName(c.m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.m.sex} · {hmDanOf(c.m)}</span>
            <span className="hmpill" style={{ marginLeft: 7, background: c.direct ? "#F0FDF4" : "#EFF6FF", color: c.direct ? HM_C.ok : HM_C.blue }}>{c.direct ? "요청" : "AI 선별"}</span>
            <span className="hmpill" style={{ marginLeft: 4, background: HM_C.bg, color: HM_C.dark }}>{c.typeKo}</span>
            <span className="hmpill" style={{ marginLeft: 4, background: "#F8FAFC", color: HM_C.mut }}>{c.tier} · SLA {c.sla}h · {c.stage}</span>
          </div>
          <button className="hmbtn gh" onClick={() => setOpenId(openId === i ? null : i)}>{openId === i ? "접기" : "근거·문안"}</button>
        </div>
        {openId === i && (<div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: HM_C.deep }}>하이의 근거</div>
          {c.why.map((w, j) => <div key={j} style={{ fontSize: 11.8, color: HM_C.mut, lineHeight: 1.6 }}>· {w[0]} <b style={{ color: HM_C.dark }}>{w[1]}</b></div>)}
          <div className="hmhi"><Bot size={12} style={{ verticalAlign: -2 }} /> 권장 첫 마디 — "{_hmProName(c.m)}님, {c.typeKo} 관련해서 확인해 드릴 게 있어 연락드렸어요. 지금 2분 괜찮으세요?"</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="hmbtn" onClick={() => onContact(c.m, { key: "sig-" + c.type, tab: "①", label: "신호 접촉(" + c.typeKo + ")", result: "연결됨" })}><Phone size={12} /> 연결하기</button>
            <button className="hmbtn gh" onClick={() => onContact(c.m, { key: "sig-noti", tab: "①", label: "안내 발송", result: "발송", notify: "담당 프로가 " + c.typeKo + " 안내를 보내드렸어요 — 하이에게 물어보셔도 돼요.", notifyTitle: "건강 안내 도착" })}><Send size={12} /> 안내 발송</button>
          </div>
          <div className="hmfoot">연락처는 카드에 없어요 — [연결하기] 순간 동의를 재검증하고 콜백 토큰으로 연결돼요.</div>
        </div>)}
      </div>
    ))}
  </div>);
}

/* 영상 상담(영상 V2) — 요청 → 회원 수락 → 통화(대본 동반) → 요약 → 회원 확인.
   §0-V7 프로는 요청만 한다(수락 버튼은 「회원님 화면」 안에만 있다) · §0-V8 녹화 없음(요약만 남는다)
   §0-V10 이 화면 안에서 진료·검진·구매가 일어나지 않는다 — 활동은 개입으로 가리킬 뿐 */
function HmVideoModal({ subject, name, card, onDone, onClose }) {
  const [stage, setStage] = React.useState("ask");     /* ask → call → sum → done */
  const [sess, setSess] = React.useState(null);
  const [mode, setMode] = React.useState("voice");
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");
  const [degraded, setDegraded] = React.useState(false);
  const [shared, setShared] = React.useState([]);        /* 영상 V3 — 띄운 화면 */

  React.useEffect(() => {
    try { const r = vsRequest(subject);
      if (!r.ok) { setErr(r.why); setStage("blocked"); } else setSess(r.sess); } catch (e) { setErr(String(e)); setStage("blocked"); }
  }, []);

  const accept = () => { try { vsAccept(sess); setMode(sess.mode || "voice"); setStage("call"); } catch (e) {} };
  const decline = () => { try { vsDecline(sess, subject); } catch (e) {} onDone({ result: "사양", state: "declined" }); onClose(); };
  const setM = (k) => { const r = vsSetMode(sess, k, "member"); if (r.ok) { setMode(r.mode); setDegraded(false); } else setErr(r.why); };
  const degrade = () => { const r = vsDegrade(sess); if (r.ok) { setMode(r.mode); setDegraded(true); } };
  const [issued, setIssued] = React.useState([]);        /* 영상 V5 — 발행한 개입 */
  const issue = (k) => {
    const r = vsIssueAction(sess, k, subject);
    if (!r.ok) { setErr(r.why); return; }
    setErr(""); setIssued((a2) => a2.concat({ k: k, ko: r.ko, nav: r.nav }));
  };
  const share = (k) => {
    const r = vsShareDoc(sess, k, subject);
    if (!r.ok) { setErr(r.why); return; }
    setErr(""); setShared((a2) => a2.concat(k));
  };
  const end = () => { try { vsEnd(sess); setStage("sum"); } catch (e) {} };
  const confirm = () => {
    const r = vsSummarize(sess, note, true);
    if (!r.ok) { setErr(r.why); return; }
    onDone({ result: "상담완료", state: "summarized", summary: note, mode: mode, shared: shared.slice(), issued: issued.map((x) => x.k) });
    setStage("done"); setTimeout(onClose, 900);
  };

  const sc = card && card.script;
  const lines = sc ? [sc.opening, ...(sc.core || []), sc.ask].filter(Boolean).slice(0, 4) : [];
  const wrap = { position: "fixed", inset: 0, zIndex: 1480, background: "rgba(11,34,57,.58)", display: "flex", alignItems: "center", justifyContent: "center" };
  const box = { width: "min(760px,94vw)", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,.35)" };

  if (stage === "blocked") return (<div style={wrap} onClick={onClose}><div onClick={(e) => e.stopPropagation()} style={{ ...box, width: "min(420px,92vw)" }}>
    <div style={{ background: "#475569", color: "#fff", padding: "12px 16px", fontSize: 12.5, fontWeight: 800 }}>📹 영상 상담 — 요청할 수 없어요</div>
    <div style={{ padding: "16px 18px", fontSize: 12.4, color: "#334155", lineHeight: 1.75 }}>{err}
      <div style={{ marginTop: 12 }}><button className="hmbtn gh" onClick={onClose}>닫기</button></div></div></div></div>);

  return (<div style={wrap} onClick={onClose}><div onClick={(e) => e.stopPropagation()} style={box}>
    {stage === "ask" && (<>
      <div style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", padding: "12px 16px", fontSize: 12.5, fontWeight: 800 }}>
        📱 회원님 화면 <span style={{ fontWeight: 600, opacity: .85 }}>· [예시·시연] 수락은 회원 본인이 자기 화면에서</span></div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#0F2A43", lineHeight: 1.5 }}>담당 {(typeof hmProOf === "function" && card ? "" : "")}전문가가 영상 상담을 요청했어요</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.75, marginTop: 8 }}>
          검진 결과 리포트를 화면에 함께 띄워놓고 설명드릴 수 있어요.<br />
          <span style={{ color: "#15803D" }}>✅ 카메라는 켜지 않고 음성으로만</span> 시작할 수 있고, 통화 중 언제든 바꾸실 수 있어요.<br />
          <span style={{ color: "#C2410C" }}>⚠️ 영상·음성은 저장하지 않아요</span> — 끝나면 상담 요약만 남고, 그 요약도 확인하신 뒤에 저장돼요.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
          <button className="hmbtn" style={{ background: "#1D4ED8" }} onClick={accept}>네, 지금 받을게요</button>
          <button className="hmbtn gh" onClick={decline}>이번엔 괜찮아요</button>
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 9, textAlign: "center", lineHeight: 1.6 }}>지금이 편하지 않으시면 사양하셔도 돼요 — 상담 내용과 다음 절차는 그대로예요.<br />편하신 때를 말씀해 주시면 그때 다시 해요.</div>
      </div></>)}

    {stage === "call" && (<>
      <div style={{ background: "#0F2A43", color: "#fff", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800 }}>📹 상담 중 — {name}님
          <span style={{ marginLeft: 8, fontWeight: 600, opacity: .8, fontSize: 11 }}>{mode === "video" ? "영상" : mode === "voice" ? "음성" : "문자"} · 녹화 없음</span></div>
        <div style={{ fontSize: 10.4, color: "#94A3B8" }}>모드 전환은 회원 화면에서 —<span style={{ color: "#CBD5E1" }}> 프로는 바꿀 수 없어요(§0-V7)</span></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 0 }}>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 7 }}>🗒 대본 — 화면에 띄운 채로 읽어요</div>
          {lines.length ? lines.map((b, i) => (<div key={i} style={{ marginBottom: 7, fontSize: 12, lineHeight: 1.7, color: "#1F2937" }}>
            <i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.5 }}>{b.ko}</i><div>“{b.text}”</div></div>))
            : <div style={{ fontSize: 11.5, color: "#94A3B8" }}>이 회원의 지시서 카드가 없어요 — 대본 없이는 통화하지 않아요.</div>}
          <div style={{ marginTop: 11, borderTop: "1px dashed #E2E8F0", paddingTop: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>🖥 함께 볼 화면 <span style={{ fontWeight: 600, color: "#94A3B8" }}>· 띄우는 것도 발화예요(§0-V9)</span></div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {Object.keys(VS_SHARE_DOCS).map((k) => {
                const d = VS_SHARE_DOCS[k];
                let g = { ok: false, why: "" };
                try { g = vsShareGate(k, subject); } catch (e) {}
                const on = shared.indexOf(k) >= 0;
                return g.ok
                  ? <button key={k} className={"hmbtn" + (on ? "" : " gh")} style={{ fontSize: 10.5, padding: "4px 10px" }} title={d.what} onClick={() => share(k)}>{on ? "✓ " : ""}{d.ko}</button>
                  : <span key={k} className="hmpill" style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: 10.2 }} title={g.why}>🔒 {d.ko}</span>;
              })}
            </div>
            {shared.length > 0 && <div style={{ fontSize: 10.3, color: "#15803D", marginTop: 6 }}>띄운 화면 {shared.length}개 — 요약에 함께 기록돼요</div>}
          </div>
          <div style={{ marginTop: 11, borderTop: "1px dashed #E2E8F0", paddingTop: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>🧭 다음 할 일 발행 <span style={{ fontWeight: 600, color: "#94A3B8" }}>· 가리킬 뿐 대신 하지 않아요(§0-V10)</span></div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {((card && card.actions) || []).slice(0, 3).map((a3) => {
                const on = issued.some((x) => x.k === a3.key);
                return <button key={a3.key} className={"hmbtn" + (on ? "" : " gh")} style={{ fontSize: 10.5, padding: "4px 10px" }}
                  title={a3.evNote || ""} onClick={() => issue(a3.key)}>{on ? "✓ " : ""}{a3.ko}</button>;
              })}
              {!(card && card.actions && card.actions.length) && <span style={{ fontSize: 10.6, color: "#94A3B8" }}>이 회원의 권장 개입이 없어요</span>}
            </div>
            {issued.length > 0 && <div style={{ fontSize: 10.4, color: "#15803D", marginTop: 6 }}>
              발행 {issued.length}건 — 회원 앱의 「{issued.map((x) => x.ko).join(" · ")}」 화면으로 가는 길이 열렸어요. 실행은 회원이 해요.</div>}
          </div>
          <div style={{ marginTop: 10, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "7px 10px", fontSize: 10.8, color: "#9A3412", lineHeight: 1.65 }}>
            이 화면에서 진료·검진·구매가 일어나지 않아요 — 필요한 활동은 <b>개입으로 발행</b>하고 회원이 자기 앱에서 해요.<br />
            원본 수치 화면과 제안 화면은 <b>공유 목록에 없어요</b> — 숨긴 게 아니라 만들지 않았어요.</div>
        </div>
        <div style={{ padding: "14px 16px", background: "#F8FAFC" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 7 }}>회원님 화면</div>
          <div style={{ borderRadius: 12, overflow: "hidden", background: "#0B1622", height: 168, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 11.5, textAlign: "center", lineHeight: 1.7 }}>
            {mode === "video" ? <span style={{ color: "#E2E8F0" }}>📹 영상 연결됨<br /><span style={{ fontSize: 10.5, opacity: .8 }}>[시연] 실제 통신은 론칭 시점</span></span>
              : mode === "voice" ? <span>🔊 음성 상담 중<br /><span style={{ fontSize: 10.5 }}>카메라 꺼짐 — 회원이 원할 때 켜요</span></span>
              : <span>💬 문자 상담 중</span>}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.2, color: "#64748B", fontWeight: 700 }}>회원이 직접 —</span>
            {VIDEO_SPEC.modes.map((k) => (<button key={k} className={"hmbtn" + (k === mode ? "" : " gh")} style={{ fontSize: 10.5, padding: "4px 10px", background: k === mode ? "#2563EB" : "#fff" }}
              onClick={() => setM(k)}>{k === "video" ? "📹 영상" : k === "voice" ? "🔊 음성" : "💬 문자"}</button>))}
          </div>
          {degraded && <div style={{ fontSize: 10.6, color: "#B45309", marginTop: 6 }}>⚠ 연결이 불안정해 한 단계 낮췄어요 — 올리는 것은 회원만 할 수 있어요.</div>}
          {err && <div style={{ fontSize: 10.6, color: "#B91C1C", marginTop: 6 }}>{err}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button className="hmbtn gh" style={{ fontSize: 10.5 }} onClick={degrade}>연결 불안정(시연)</button>
            <button className="hmbtn" style={{ background: "#B91C1C", fontSize: 10.5 }} onClick={end}>상담 종료</button>
          </div>
        </div></div></>)}

    {stage === "sum" && (<>
      <div style={{ background: "#0F2A43", color: "#fff", padding: "12px 16px", fontSize: 12.5, fontWeight: 800 }}>🧾 상담 요약 — 남는 것은 이것뿐이에요</div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 11.8, color: "#475569", lineHeight: 1.7 }}>영상·음성은 저장되지 않았어요. 무엇을 이야기했고 무엇을 하기로 했는지만 적고, <b>회원이 확인해야</b> 기록이 닫혀요.
          {shared.length > 0 && <><br /><span style={{ color: "#334155" }}>함께 본 화면 — {shared.map((k) => VS_SHARE_DOCS[k].ko).join(" · ")}</span></>}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="hmbtn gh" style={{ fontSize: 10.6, padding: "4px 10px" }}
            onClick={() => { try { setNote(vsSummaryDraft(sess, card)); setErr(""); } catch (e) {} }}>✍ 초안 만들기</button>
          <span style={{ fontSize: 10.2, color: "#94A3B8" }}>이번 통화에서 실제로 일어난 것만으로 만들어요 — 고쳐 쓰셔도 돼요(§0-V6)</span>
        </div>
        <textarea value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} rows={4} placeholder="예) 결과에서 확인이 필요한 구간을 설명드렸고, 진료 연결을 안내했어요."
          style={{ width: "100%", marginTop: 7, borderRadius: 10, border: "1px solid " + (err ? "#FCA5A5" : "#CBD5E1"), padding: "9px 11px", fontSize: 12.2, lineHeight: 1.7, fontFamily: "inherit", resize: "vertical" }} />
        {(() => {
          const n = note.trim().length;
          let live = null; try { live = note.trim() ? vsSummaryCheck(note) : null; } catch (e) {}
          return (<div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 5, fontSize: 10.4, flexWrap: "wrap" }}>
            <span style={{ color: live && !live.ok ? "#B91C1C" : "#94A3B8" }}>{err || (live && !live.ok ? live.why : "저장 전에 대본과 같은 검사를 받아요 — 진단·단정·권유·원본 수치는 남길 수 없어요.")}</span>
            <span style={{ color: n > VS_SUMMARY_SPEC.maxLen ? "#B91C1C" : "#94A3B8" }}>{n} / {VS_SUMMARY_SPEC.maxLen}자</span>
          </div>);
        })()}
        <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
          <button className="hmbtn" onClick={confirm}>회원 확인 완료 — 기록 저장</button>
          <button className="hmbtn gh" onClick={onClose}>닫기(미저장)</button>
        </div>
      </div></>)}

    {stage === "done" && (<div style={{ padding: "26px 20px", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#15803D" }}>✅ 상담 요약이 저장됐어요</div>)}
  </div></div>);
}

/* ② 보험 배정·접촉 락(순번 배분 + 락 명단) — 「첫 연결 대기(READY)」 명단은 ③ 탭이 소유한다.
   전에는 cview.ready를 ②와 ③이 같이 그려서, 같은 5명이 「결과 수령」과 「결합 패키지 대기」라는
   다른 이름으로 두 번 나왔다(탭 이름만 보고 무엇을 보는 화면인지 알 수 없던 원인).
   이제 ②는 배정·락까지, ③은 첫 연결부터 — 경계를 이름과 내용이 같이 지킨다. */
function HmTabIns({ code, pro, onContact, refresh, cview, onTab }) {
  const [vidFor, setVidFor] = React.useState(null);   /* 영상 V2 — 요청 대상 회원 */
  const q = hmInsQueue();
  const members = (typeof demoMembers !== "undefined" ? demoMembers : []);
  const mine = q.filter((x) => x.code === code);
  const others = q.filter((x) => x.code !== code);
  const row = (x, isMine) => {
    const m = members.find((mm) => mm.email === x.email); if (!m) return null;
    const lk = hmLockState(m);
    return (
      <div key={x.email} className={"hmrow" + (lk.locked ? " lock" : "")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontWeight: 900 }}>
            {lk.locked && <Lock size={13} color={HM_C.hold} style={{ verticalAlign: -2, marginRight: 4 }} />}
            {_hmProName(m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex} · 가입 {_hmDay(x.at)}</span>
            {lk.locked ? <span className="hmpill" style={{ marginLeft: 7, background: "#F1F5F9", color: HM_C.hold }}>HELD · 접촉 금지</span>
              : <span className="hmpill" style={{ marginLeft: 7, background: "#F0FDF4", color: HM_C.ok }}>READY · 결과 수령됨</span>}
          </div>
          {!isMine && <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut }}>{(hmProOf(x.code) || {}).name || "-"} 프로 담당</span>}
        </div>
        <div style={{ fontSize: 11.3, color: HM_C.mut, marginTop: 4 }}>배분 근거 — {x.reason}</div>
        {isMine && (<div>
          {lk.locked && <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, padding: "7px 11px", fontSize: 11.6, color: HM_C.mut, marginTop: 7 }}>
            🔒 검진 전 연락은 회원에게 부담이 됩니다. 결과가 나오면 <b>하이가 자동으로</b> 열어 드려요. (프로·관리자 해제 불가) — 지금 할 수 있는 일: 프로필 사전 학습 · ③탭 문안 미리보기</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="hmbtn" disabled={lk.locked} onClick={() => { const r = onContact(m, { key: "combo", tab: "②", label: "첫 연결(결과+보장 통합)", result: "연결됨" }); }}><Phone size={12} /> 전화 연결</button>
            {(() => {   /* 영상 V2 — 게이트를 통과하지 못하면 버튼이 없다(문구 숨김이 아니라 부재) */
              let g = { ok: false, why: "" };
              try { g = vsGateOf(m); } catch (e) {}
              if (!g.ok) return <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut, fontSize: 10.4 }} title={g.why}>📹 영상 상담 불가 · {g.code === "consent" ? "동의 없음" : g.code === "lock" ? "접촉 락" : g.code === "hold" ? "접촉 보류" : g.code}</span>;
              return <button className="hmbtn gh" onClick={() => setVidFor(m)}><Video size={12} /> 영상 상담 요청</button>;
            })()}
            <button className="hmbtn gh" disabled={lk.locked} onClick={() => onContact(m, { key: "ins-noti", tab: "②", label: "알림 안내", result: "발송", notify: "검진 결과 안내와 보장 설명을 준비해 두었어요.", notifyTitle: "담당 프로 안내" })}><Send size={12} /> 알림</button>
            {lk.locked && <button className="hmbtn gh" style={{ borderStyle: "dashed", color: HM_C.mut }} onClick={() => { hmSimResult(m.email); refresh(); }}>⚙ 시스템 이벤트(시연) — 검진결과 수령</button>}
          </div>
        </div>)}
      </div>
    );
  };
  return (<div>
    <HmDbNote k="t2" />
    <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg, border: `1px solid ${HM_C.line}` }}>
      <b style={{ fontSize: 12.5 }}>순번 배분 원칙</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 3 }}>검진대비보험 건은 성과가 아니라 <b style={{ color: HM_C.dark }}>지역단 순서</b>로 나눠요(모집자격 보유 프로만). 순번은 평가와 무관해요. {pro.lic ? "" : "— 현재 사번은 모집자격 미보유라 안내 발송까지만 가능해요."}</div>
    </div>
    <div style={{ fontWeight: 900, fontSize: 13, margin: "12px 0 7px" }}>내 배정 {mine.length}건</div>
    {mine.length ? mine.map((x) => row(x, true)) : <div className="hmrow" style={{ color: HM_C.mut }}>이번 순번 배정이 없어요 — 다음 회차에 자동 배정돼요.</div>}
    {cview && <HmCohortList title="② 검진 전 대기(락) — 배정 완료·접촉 금지" ids={cview.held} code={code} compact />}
    {cview && cview.ready.length ? (<div className="hmcard" style={{ marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.2, lineHeight: 1.6, flex: 1, minWidth: 200 }}>
        <b style={{ color: HM_C.ok }}>락이 풀린 회원 {cview.ready.length.toLocaleString()}명</b> — 검진 결과가 도착해 연락이 가능해졌어요.
        이 명단과 첫 연결 문안은 <b>③ 첫 연결·만기 터치</b> 탭에 있어요(한 명단을 두 탭에 겹쳐 두지 않아요).
      </span>
      {typeof onTab === "function" && <button className="hmbtn" onClick={() => onTab(3)}>③ 첫 연결로 가기 →</button>}
    </div>) : null}
    <div style={{ fontWeight: 900, fontSize: 13, margin: "12px 0 7px", color: HM_C.mut }}>지역단 전체 배정 현황(참고) {others.length}건</div>
    {others.map((x) => row(x, false))}
    {vidFor && <HmVideoModal subject={vidFor} name={_hmProName(vidFor)} card={(() => { try { return hmCustomerCard(vidFor); } catch (e) { return null; } })()}
      onClose={() => setVidFor(null)}
      onDone={(r) => { onContact(vidFor, { key: "ins-video", tab: "②", label: "영상 상담" + (r.mode ? "(" + (r.mode === "video" ? "영상" : r.mode === "voice" ? "음성" : "문자") + ")" : ""), result: r.result, note: r.summary || "" }); }} />}
  </div>);
}

/* ③ 첫 연결 · 만기·재검진 터치 — cview.ready(첫 연결 대기) 명단을 이 탭이 소유한다(② 중복 제거) */
function HmTabTouch({ code, onContact, cview, onTab }) {
  const members = hmScope(code);
  const rows = members.map((m) => ({ m, plan: hmTouchPlan(m) })).filter((x) => x.plan.items.length);
  return (<div>
    <HmDbNote k="t3" />
    <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg }}>
      <b style={{ fontSize: 12.5 }}>결합 원칙</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 3 }}>첫 연결은 <b style={{ color: HM_C.dark }}>결과분석 + 검진대비보험 안내를 한 번의 연락으로</b> — 두 번째 전화는 영업으로 읽혀요. 이후 터치는 조건 충족 회원에게만 생겨요.</div>
    </div>
    {cview && <HmCohortList title="③ 첫 연결 대기 — 결과분석+보장 안내(1회 통합)" ids={cview.ready} code={code} />}
    {!rows.length && !(cview && cview.ready.length) && <div className="hmrow" style={{ marginTop: 10, color: HM_C.mut }}>터치 예정 회원이 없어요 — 검진결과 수령(② 배정·접촉 락 탭) 후 자동으로 큐가 생겨요.</div>}
    {rows.length ? (<div style={{ fontWeight: 900, fontSize: 13, margin: "14px 0 0", color: HM_C.deep }}>만기·재검진 터치 계획 {rows.length}명 <span style={{ fontWeight: 600, color: HM_C.mut, fontSize: 11.4 }}>— 첫 연결 뒤에 조건이 충족된 회원에게만 생기는 후속 터치예요(D-30 · D-7 순서)</span></div>) : null}
    {rows.map(({ m, plan }, i) => (
      <div key={i} className="hmrow" style={{ marginTop: i === 0 ? 10 : 0 }}>
        <div style={{ fontWeight: 900 }}>{_hmProName(m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span> {plan.endSrc && <span className="hmpill" style={{ marginLeft: 6, background: "#F8FAFC", color: HM_C.mut }}>만기 계산: {plan.endSrc}</span>}</div>
        <div style={{ marginTop: 7 }}>
          {plan.items.map((it, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: j ? "1px dashed #F1F5F9" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: it.done ? HM_C.ok : it.due ? HM_C.red : "#E5E7EB", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12 }}>
                <b style={{ color: it.pack ? HM_C.dark : HM_C.ink }}>{it.title}</b>
                <span style={{ color: HM_C.mut, marginLeft: 6 }}>{_hmDay(it.when)}{it.done ? " · 완료" : it.due ? " · 지금" : ""}</span>
              </div>
              {it.due && !it.done && <button className="hmbtn" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onContact(m, { key: it.key, tab: "③", label: it.title.split("—")[0].trim(), result: "연결됨" })}>연결</button>}
            </div>
          ))}
        </div>
        {plan.items.some((x) => x.pack && !x.done) && (
          <div className="hmhi"><Bot size={12} style={{ verticalAlign: -2 }} /> 결합 패키지(하이 생성) — ①결과 요약(등급·관리항목 수·변화) ②이번 결과 기준 보장 설명 ③다음 액션 1개만. 원본 수치는 말하지 않아요.</div>
        )}
      </div>
    ))}
  </div>);
}

/* ④ 질병 예측 */
function HmTabRisk({ code, cview }) {
  const members = hmScope(code).filter((m) => !hmLockState(m).locked);
  return (<div>
    <HmDbNote k="t4" />
    <div className="hmcard" style={{ marginTop: 0, background: "#FFF1F2", border: "1px solid #FECDD3" }}>
      <b style={{ fontSize: 12, color: HM_C.red }}>가드레일</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 2 }}>예측을 보험 인수·요율·거절 사유로 쓰는 것은 금지돼요. 확률은 밴드(상·중·하)로만, 진단 단정 표현은 어디에도 없어요.</div>
    </div>
    {cview && <HmCohortList title="④ 위험 밴드 상·중(분석 단계)" ids={cview.riskHi} code={code} compact />}
    {members.map((m, i) => {
      const rc = hmRiskCards(m);
      return (<div key={i} className="hmrow" style={{ marginTop: i === 0 ? 10 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <b>{_hmProName(m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span></b>
          <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut }}>{rc.src}</span>
        </div>
        <div className="hmgrid2" style={{ marginTop: 7 }}>
          {rc.rows.map((r, j) => (
            <div key={j} style={{ border: "1px solid #F1F5F9", borderRadius: 10, padding: "8px 11px" }}>
              <b style={{ fontSize: 12.3 }}>{r.ko}</b>
              <span className="hmpill" style={{ marginLeft: 6, background: r.band === "상" ? "#FFF7ED" : r.band === "중" ? "#FFFBEB" : "#F0FDF4", color: r.band === "상" ? HM_C.stall : r.band === "중" ? HM_C.warn : HM_C.ok }}>위험 밴드 {r.band}</span>
              <div style={{ fontSize: 11.4, color: HM_C.mut, marginTop: 3, lineHeight: 1.55 }}>{r.why}</div>
            </div>
          ))}
        </div>
        <div className="hmfoot">예측은 통계적 경향이며 진단이 아닙니다. 확인은 의료기관에서. — [예방 검진 안내] [주치의(A1) 연결] [보장공백 점검(⑦)]으로만 잇습니다.</div>
      </div>);
    })}
  </div>);
}

/* ⑤ 건강 행동 · ⑥ 가족 돌봄 (조립 요약) */
function HmTabLife({ code, kind, cview }) {
  const members = hmScope(code).filter((m) => !hmLockState(m).locked);
  return (<div>
    <HmDbNote k={kind === "shop" ? "t5" : "t6"} />
    {kind === "care" && (
      <div className="hmcard" style={{ marginTop: 0, background: "#FEF2F2", border: "1px solid #FECACA" }}>
        <b style={{ fontSize: 12, color: HM_C.red }}>응급 우선 규칙</b>
        <div style={{ fontSize: 11.6, color: HM_C.mut, marginTop: 2, lineHeight: 1.6 }}>응급 징후 신호가 있으면 그 카드는 모든 카드보다 위에 고정되고, 문안은 상담이 아니라 <b style={{ color: HM_C.red }}>119·응급 안내가 먼저</b> 나가요.</div>
      </div>
    )}
    {cview && <HmCohortList title={kind === "shop" ? "⑤ 제품·재구매 안내 시점 회원" : "⑥ 가구·돌봄 신호 회원"} ids={kind === "shop" ? cview.shop : cview.family} code={code} compact />}
    {members.map((m, i) => {
      const adh = _hmLs("hifin_adh_" + m.email, {});
      const famRaw = localStorage.getItem("hifin_family_" + m.email);
      const fam = famRaw ? JSON.parse(famRaw) : null;
      const pts = m.managementPoints || [];
      return (<div key={i} className="hmrow" style={{ marginTop: i === 0 ? 10 : 0 }}>
        <b>{_hmProName(m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span></b>
        {kind === "shop" ? (<div style={{ fontSize: 11.8, color: HM_C.mut, marginTop: 5, lineHeight: 1.65 }}>
          <div>· <b style={{ color: HM_C.ink }}>무엇을</b> — 관리 포인트 연계 제품군: {pts.slice(0, 3).join(" · ") || "생활관리 일반"}</div>
          <div>· <b style={{ color: HM_C.ink }}>왜</b> — {(m.highRiskDiseases || []).join("·") || "예방 관리"} 프로필 기반(성분 근거는 A3 온톨로지)</div>
          <div>· <b style={{ color: HM_C.ink }}>언제</b> — {Object.keys(adh).length ? "복약·실천 기록 보유 — 이행률 하락 시 안내" : "실천 기록 없음 — 첫 습관 제안 시점"}</div>
          <div className="hmfoot" style={{ marginTop: 6 }}>비교는 1일 단가·성분당 단가 기준(A3 규칙) · 원가성 정보 비노출 · 결제는 회원 본인만.</div>
        </div>) : (<div style={{ fontSize: 11.8, color: HM_C.mut, marginTop: 5, lineHeight: 1.65 }}>
          <div>· 가족 등록 — {fam ? `${fam.length}명(가구 단위 데이터)` : "미등록(기본 안내 대상)"}</div>
          <div>· 재가급여 — {(m.regAge || 0) >= 55 || (fam || []).some((f) => (f.age || 0) >= 75) ? "대상 가능성 있음 · 공단 판정 필요(단정 금지)" : "현재 신호 없음"}</div>
          <div style={{ marginTop: 5 }}><span className="hmpill" style={{ background: HM_C.bg, color: HM_C.dark }}>재가 서비스 안내</span> <span className="hmpill" style={{ background: HM_C.bg, color: HM_C.dark }}>가족 상담 예약(원격지 가능)</span> <span className="hmpill" style={{ background: HM_C.bg, color: HM_C.dark }}>돌봄 체크리스트</span></div>
        </div>)}
      </div>);
    })}
  </div>);
}

/* ⑦ 보장분석 · 인수조건 대화 */
function HmTabUw({ code, cview }) {
  const demoM = hmScope(code).filter((m) => !hmLockState(m).locked);
  /* 코호트 후보 15명(관측층) — 어댑터: 질환·연령·성별만 전달(계산은 동일 엔진) */
  const cohortM = (cview ? cview.ids.slice(0, 15) : []).map((i) => { const m = cohortMemberAt(i); return m ? { name: m.name, email: "cohort-" + i, sex: m.sex, regAge: m.age, highRiskDiseases: m.diseases || [], isDemoUser: false, _cohort: true } : null; }).filter(Boolean);
  const members = demoM.concat(cohortM);
  const [sel, setSel] = React.useState(members.length ? members[0].email : null);
  const [log, setLog] = React.useState([]);
  const [q, setQ] = React.useState("");
  const m = members.find((x) => x.email === sel) || members[0];
  const ask = (text) => {
    if (!m || !text.trim()) return;
    const a = hmUnderwriteTalk(m, text);
    setLog((l) => [...l, { q: text, a }]);
    setQ("");
  };
  let gaps = null; try { gaps = (typeof analyzeCoverageGap === "function") ? analyzeCoverageGap(m) : null; } catch (e) {}
  return (<div>
    <HmDbNote k="t7" />
    <div className="hmcard" style={{ marginTop: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <b style={{ fontSize: 12.8 }}>현대해상 보장분석 연계</b>
        <span className="hmpill" style={{ background: "#FFFBEB", color: HM_C.warn, border: "1px solid #FDE68A" }}>연동 상태: 시뮬레이션</span>
      </div>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 4 }}>하이핀은 <b style={{ color: HM_C.dark }}>보장공백 유형 코드 + 연령대·성별 + 건강 등급(플래그 수)만</b> 정리해 넘기고, 결과를 받아 해설해요. 원본 수치·인수 판정은 넘기지 않아요.</div>
      {m && <div style={{ marginTop: 8, fontSize: 12 }}>
        <select value={sel || ""} onChange={(e) => { setSel(e.target.value); setLog([]); }} style={{ border: `1.5px solid ${HM_C.line}`, borderRadius: 8, padding: "6px 9px", fontSize: 12 }}>
          {members.map((x) => <option key={x.email} value={x.email}>{_hmProName(x)} · {_hmBand(x)} {x.sex}{x._cohort ? " · 코호트" : (typeof hmIsSelf === "function" && hmIsSelf(x) ? " · 본인(실측)" : " · 체험")}</option>)}
        </select>
        {gaps && gaps.gaps && <span style={{ marginLeft: 8, color: HM_C.mut, fontSize: 11.5 }}>보장공백 신호 {gaps.gaps.length}건 감지</span>}
      </div>}
    </div>
    <div className="hmcard">
      <b style={{ fontSize: 12.8 }}><MessageSquare size={13} style={{ verticalAlign: -2 }} /> 하이(A2)와 인수조건 대화</b>
      <div style={{ fontSize: 11.3, color: HM_C.mut, marginTop: 3 }}>폼이 아니라 대화예요. 답은 항상 <b>가능성 3구간(높음/있음/낮음)</b> — 확정·요율·금액 단정은 없어요.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "9px 0" }}>
        {["고혈압 약 드시는데 진단비 가입 가능해?", "간편심사로 가면 뭐가 달라져?", "암 진단비는 어때?"].map((s) => (
          <button key={s} className="hmbtn gh" style={{ fontSize: 11 }} onClick={() => ask(s)}>{s}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 부담보면 얼마나 빠져?" style={{ flex: 1, border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "8px 11px", fontSize: 12.5 }} onKeyDown={(e) => { if (e.key === "Enter") ask(q); }} />
        <button className="hmbtn" onClick={() => ask(q)}>질문</button>
      </div>
      {log.map((it, i) => (
        <div key={i} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: HM_C.dark }}>프로: {it.q}</div>
          <div className="hmqa" style={{ marginTop: 5 }}>
            <div style={{ fontSize: 11, opacity: .75, marginBottom: 4 }}>하이(A2) · 근거 {it.a.src} · {it.a.product}</div>
            {it.a.tri.map((t, j) => <div key={j}>{["①", "②", "③"][j]} {t[0]} — 가능성 <b style={{ color: t[1].indexOf("높음") >= 0 ? "#4ADE80" : t[1].indexOf("낮음") >= 0 ? "#FCA5A5" : "#FCD34D" }}>{t[1]}</b></div>)}
            <div style={{ marginTop: 5, fontSize: 11.5, opacity: .85 }}>필요 서류 — {it.a.docs.join(" · ")}</div>
            <div style={{ marginTop: 7, background: "rgba(245,130,31,.15)", border: "1px solid rgba(245,130,31,.4)", borderRadius: 8, padding: "6px 9px", fontSize: 11.8 }}>
              <b style={{ color: "#FDBA74" }}>회원에게 그대로 읽어 줄 문장</b><br />"{it.a.memberLine}"</div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#FCA5A5", fontWeight: 700 }}>{it.a.disclaim}</div>
          </div>
        </div>
      ))}
      <div className="hmfoot">보장분석 결과는 참고이며, 인수 여부·요율·조건은 인수사(현대해상) 심사로 확정됩니다. 대화는 감사 기록(체인)에 남아요.</div>
    </div>
  </div>);
}

/* ⑧ 프로 제안함 */
function HmTabIdeas({ code }) {
  const [list, setList] = React.useState(() => hmIdeas());
  const [f, setF] = React.useState({ cat: "화면", title: "", body: "" });
  const [msg, setMsg] = React.useState("");
  const ST_C = { "접수": HM_C.mut, "검토중": HM_C.blue, "채택": HM_C.ok, "반영 예정": HM_C.ok, "반영 완료": HM_C.ok, "보류": HM_C.warn, "중복": HM_C.mut };
  const submit = () => {
    if (!f.title.trim() || !f.body.trim()) { setMsg("제목과 내용을 채워 주세요."); return; }
    const dup = list.filter((x) => x.title.indexOf(f.title.slice(0, 6)) >= 0).length;
    const r = hmIdeaAdd(code, { ...f, tab: "⑧" });
    if (!r.ok) { setMsg(r.reason); return; }
    setList(hmIdeas()); setF({ cat: "화면", title: "", body: "" });
    setMsg("접수됐어요" + (dup ? ` — 비슷한 제안 ${dup}건이 이미 있어요(하이가 묶어서 검토해요)` : "") + ". 상태가 바뀌면 알림으로 알려드려요.");
  };
  return (<div>
    <HmDbNote k="t8" />
    <div className="hmcard" style={{ marginTop: 0 }}>
      <b style={{ fontSize: 12.8 }}><Sparkles size={13} style={{ verticalAlign: -2 }} color={HM_C.pri} /> 시스템 개선 · 혁신 의견 개진</b>
      <div style={{ fontSize: 11.4, color: HM_C.mut, marginTop: 3 }}>현장은 지표가 못 보는 것을 봅니다. 모든 상태 변화에는 사유가 붙고, 반영되면 어느 화면·어느 커밋인지 돌아와요.</div>
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 7, marginTop: 9 }}>
        <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} style={{ border: `1.5px solid ${HM_C.line}`, borderRadius: 8, padding: "7px 9px", fontSize: 12 }}>
          {["화면", "문안", "배분", "데이터", "규제", "기타"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="제목(60자)" style={{ border: `1.5px solid ${HM_C.line}`, borderRadius: 8, padding: "7px 11px", fontSize: 12.5 }} />
      </div>
      <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="내용(2000자) — 회원 개인정보는 담을 수 없어요" rows={3} style={{ width: "100%", border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "8px 11px", fontSize: 12.5, marginTop: 7, resize: "vertical", boxSizing: "border-box" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
        <span style={{ fontSize: 11, color: msg.indexOf("없") >= 0 || msg.indexOf("채워") >= 0 ? HM_C.red : HM_C.ok, fontWeight: 700 }}>{msg}</span>
        <button className="hmbtn" onClick={submit}><Send size={12} /> 제안 제출</button>
      </div>
    </div>
    {list.map((it) => (
      <div key={it.id} className="hmrow">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <b style={{ fontSize: 12.6 }}>[{it.cat}] {it.title}</b>
          <span className="hmpill" style={{ background: "#F8FAFC", color: ST_C[it.status] || HM_C.mut, border: `1px solid ${(ST_C[it.status] || HM_C.mut)}33` }}>{it.status}</span>
        </div>
        <div style={{ fontSize: 11.8, color: HM_C.mut, marginTop: 4, lineHeight: 1.6 }}>{it.body}</div>
        <div style={{ fontSize: 11, color: HM_C.mut, marginTop: 6, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>{(hmProOf(it.code) || {}).name || it.code} 프로 · {it.dan} · {it.tab}탭에서 · {_hmDay(it.at)}</span>
          <button className="hmbtn gh" style={{ padding: "3px 9px", fontSize: 10.5 }} onClick={() => setList([...hmIdeaVote(it.id)])}>공감 +1 ({it.votes || 0})</button>
        </div>
        <div style={{ marginTop: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 10px", fontSize: 11.3, color: HM_C.mut }}><b style={{ color: HM_C.deep }}>사유</b> — {it.why}</div>
      </div>
    ))}
    <div className="hmfoot">공감 수는 우선순위 정렬에만 쓰여요 — 실적·평가와 연결되지 않아요. 채택·반영은 사람 검수(자동 반영 없음).</div>
  </div>);
}

/* ⑨ 내 고객 · 실적 현황판 */
function HmTabBoard({ code, pro, onContact, cview }) {
  const [view, setView] = React.useState("cust");
  const [stFilter, setStFilter] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [nation, setNation] = React.useState(false);
  const members = hmScope(code);
  const cards = members.map((m) => hmCustomerCard(m));
  const byStage = {}; HM_STAGES.forEach((s) => { byStage[s.k] = { n: 0, stall: 0 }; });
  cards.forEach((c) => { byStage[c.stage.cur].n++; if (c.stage.stalled) byStage[c.stage.cur].stall++; });
  /* 코호트 관측층 합산 — 담당 실분포 */
  if (cview) HM_STAGES.forEach((st) => { const ids = cview.byStage[st.k] || []; byStage[st.k].n += ids.length; byStage[st.k].stall += ids.filter((i) => cohortStageOf(i).stalled).length; });
  const isHm4 = pro.grade === "HM4" || ((typeof authRole === "function") && authRole() === "ADMIN");
  let list = cards.slice();
  if (stFilter === "_stall") list = list.filter((c) => c.stage.stalled);
  else if (stFilter) list = list.filter((c) => c.stage.cur === stFilter);
  list.sort((a, b) => (b.stage.stalled ? b.stage.stalledDays : -1) - (a.stage.stalled ? a.stage.stalledDays : -1));
  const stats = hmMyStats(code);
  return (<div>
    <HmDbNote k="t9" />
    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
      <button className={"hmtab" + (view === "cust" ? " on" : "")} onClick={() => setView("cust")}><Users size={13} /> 고객별 현황</button>
      <button className={"hmtab" + (view === "stat" ? " on" : "")} onClick={() => setView("stat")}><TrendingUp size={13} /> 내 실적</button>
    </div>
    {view === "cust" && (<div>
      <div className="hmpipe">
        {HM_STAGES.map((s) => (
          <div key={s.k} className={"st" + (stFilter === s.k ? " on" : "")} onClick={() => setStFilter(stFilter === s.k ? null : s.k)}>
            <i>{s.k} {s.name}</i><b>{byStage[s.k].n}</b>
            {byStage[s.k].stall > 0 && <span className="hmpill" style={{ background: "#FFF7ED", color: HM_C.stall, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setStFilter("_stall"); }}>정체 {byStage[s.k].stall}</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.8, color: HM_C.mut, margin: "6px 2px 10px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span>D1~D4 데이터 생성 구간 │ L5~L8 가치 전환 구간 · 기본 정렬 = 정체 기간(방치된 사람 먼저) {stFilter && <button className="hmbtn gh" style={{ marginLeft: 6, padding: "2px 8px", fontSize: 10.5 }} onClick={() => setStFilter(null)}>필터 해제</button>}</span>
        {isHm4 && <button className="hmbtn gh" style={{ padding: "2px 10px", fontSize: 10.5 }} onClick={() => setNation(!nation)}>{nation ? "담당 뷰로" : "전국 뷰(10만 분포)"}</button>}
      </div>
      {nation && isHm4 && typeof hmNationStats === "function" && (
        <div className="hmcard" style={{ marginTop: 0, marginBottom: 10 }}>
          <b style={{ fontSize: 12.5 }}>전국 회원 10만 명 — 단계 분포(finModel 정합 · 수식 집계)</b>
          <table style={{ width: "100%", fontSize: 11.6, borderCollapse: "collapse", marginTop: 7 }}><tbody>
            {hmNationStats().map((r) => (
              <tr key={r.k} style={{ borderTop: "1px solid #F1F5F9" }}>
                <td style={{ padding: "5px 4px", fontWeight: 900, color: HM_C.dark, width: 88 }}>{r.k} {HM_STAGES.find((x) => x.k === r.k).name}</td>
                <td style={{ padding: "5px 4px", width: 90, textAlign: "right", fontWeight: 800 }}>{r.n.toLocaleString()}명</td>
                <td style={{ padding: "5px 4px", width: 54, textAlign: "right", color: HM_C.mut }}>{r.pct}%</td>
                <td style={{ padding: "5px 4px", color: HM_C.mut, fontSize: 10.8 }}>{r.why}</td>
              </tr>
            ))}
          </tbody></table>
          <div className="hmfoot">비율 근거: 재무모델(finModel) 파라미터 — checkupRate 0.45 · productBuyerRate 0.38 · activeRate 0.45 · serviceRate 0.30 · aiAgentRate 0.08</div>
        </div>
      )}
      {list.map((c, i) => (
        <div key={i} className={"hmrow" + (c.status.k === "HELD" ? " lock" : "")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            {/* 핀 — 본인 계정(조성래)은 실측 데이터다. 「체험」으로 찍으면 "조성래 실데이터로 설명한다"는
                 시연 전제와 정면으로 어긋나므로 분기한다. 지역 표기는 코호트 카드와 같은 "시도 시군구". */}
            <div style={{ fontWeight: 900 }}>{_hmProName(c.m)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.m.sex} · {c.place || c.dan.replace("지역단", "")}</span>
              {c.self
                ? <span className="hmpill" style={{ marginLeft: 6, background: "#ECFDF5", color: HM_C.ok }}>실측(본인)</span>
                : <span className="hmpill" style={{ marginLeft: 6, background: "#EFF6FF", color: HM_C.blue }}>체험</span>}
              <span className="hmpill" style={{ marginLeft: 7, background: HM_C.bg, color: HM_C.dark }}>{c.stage.cur} {HM_STAGES.find((s) => s.k === c.stage.cur).name}</span>
              {c.stage.stalled && <span className="hmpill" style={{ marginLeft: 4, background: "#FFF7ED", color: HM_C.stall }}>🟠 정체 {c.stage.stalledDays}일</span>}
            </div>
            <div><HmStageDots reached={c.stage.reached} /> <HmStatusChip st={c.status} /></div>
          </div>
          <div className="hmgrid2" style={{ marginTop: 8 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "7px 11px", fontSize: 11.6, lineHeight: 1.7 }}>
              <b style={{ color: HM_C.deep, fontSize: 11 }}>건강현황</b><br />
              종합 등급 <b>{c.hb.grade}</b> · 관리 필요 <b>{c.hb.sevN}항목</b> · 위험 밴드 <b>{c.hb.band}</b><br />
              최근 검진 {c.hb.year} · 리포트 {c.hb.seen ? "열람 ✓" : "미열람"}
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "7px 11px", fontSize: 11.6, lineHeight: 1.7 }}>
              <b style={{ color: HM_C.deep, fontSize: 11 }}>관리상태</b><br />
              {c.status.ko} · 마지막 접촉 {c.last ? _hmDay(c.last.at) : "없음"}<br />
              {/* 만기 문구는 증서 상태를 따른다 — 이미 지난 증서에 "관리 중"을 붙이면 ③탭의 "만기 경과"와 어긋난다 */}
              다음 터치 {c.next ? _hmDay(c.next.when) : c.dueNow ? "지금" : "예정 없음"}{c.plan.endSrc ? (c.plan.items.some((x) => x.ended) ? " · 보장 종료(재가입 안내 대상)" : " · 만기 관리 중") : ""}
            </div>
          </div>
          <div className="hmhi"><Bot size={12} style={{ verticalAlign: -2 }} /> {c.hi}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="hmbtn gh" onClick={() => setDetail(detail === c.m.email ? null : c.m.email)}>{detail === c.m.email ? "상세 접기" : "상세"}</button>
            <button className="hmbtn" disabled={c.status.k === "HELD"} onClick={() => onContact(c.m, { key: c.dueNow ? c.dueNow.key : "manual", tab: "⑨", label: c.dueNow ? c.dueNow.title.split("—")[0].trim() : "정기 확인 연락", result: "연결됨" })}><Phone size={12} /> 연결하기</button>
          </div>
          {detail === c.m.email && (<div style={{ marginTop: 9, borderTop: "1px dashed #E5E7EB", paddingTop: 8, fontSize: 11.7, lineHeight: 1.7 }}>
            <b style={{ color: HM_C.deep, fontSize: 11 }}>단계 근거(데이터가 정한다 — 수기 변경 불가)</b>
            {c.stage.evidence.map((e, j) => (
              <div key={j} style={{ color: e.ok ? HM_C.ink : "#9CA3AF" }}>{e.ok ? "✓" : "○"} <b>{e.k}</b> {HM_STAGES.find((s) => s.k === e.k).name} — {e.why}</div>
            ))}
            <b style={{ color: HM_C.deep, fontSize: 11, display: "block", marginTop: 7 }}>동의 상태(무엇까지 말할 수 있는가)</b>
            <div>상담·안내 ✓ ({hmConsentOK(c.m).why}) · 검진결과 활용 ✓ · 가족 돌봄 {localStorage.getItem("hifin_family_" + c.m.email) ? "✓" : "✗(가족 본인 동의 필요)"}</div>
            {c.last && <div style={{ marginTop: 5 }}><b style={{ color: HM_C.deep, fontSize: 11 }}>접촉 이력</b> — {_hmLs("hifin_hm_touch_" + c.m.email, []).slice(-3).map((t) => `${_hmDay(t.at)} ${t.act}(${t.result})`).join(" · ")}</div>}
          </div>)}
        </div>
      ))}
      {!list.length && <div className="hmrow" style={{ color: HM_C.mut }}>이 필터에 해당하는 상호작용층 고객이 없어요.</div>}
      {cview && <HmCohortList title="⑨ 담당 코호트 고객" code={code}
        ids={(stFilter === "_stall" ? cview.stall : stFilter ? (cview.byStage[stFilter] || []) : cview.ids).slice().sort((a, b) => { const A = cohortStageOf(a), B = cohortStageOf(b); return (B.stalled ? B.stalledDays : -1) - (A.stalled ? A.stalledDays : -1); })} />}
    </div>)}
    {view === "stat" && (() => {
      const cs = (typeof hmcProStats === "function") ? hmcProStats(pro.code) : null;
      const maxAdv = cs ? Math.max(1, ...cs.adv6.map((x) => x.n)) : 1;
      const distMax = cs ? Math.max(1, ...cs.dist.map((x) => x[1])) : 1;
      const agg = (cs && (pro.grade === "HM4" || ((typeof authRole === "function") && authRole() === "ADMIN")) && typeof hmcDanAgg === "function") ? hmcDanAgg(pro.dan) : null;
      return (<div>
      <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg }}>
        <b style={{ fontSize: 12.5 }}>실적의 정의 — 판매액이 아니라 「단계 전진 기여」</b>
        <div style={{ fontSize: 11.4, color: HM_C.mut, marginTop: 3 }}>금액이나 등수 매기기는 없어요. ② 순번 배분은 평가와 무관해요(공정성 고지). 코호트 실적은 담당 규모·단계 분포에서 파생한 <b style={{ color: HM_C.dark }}>시연 분포</b>예요.</div>
      </div>
      <div className="hmgrid2" style={{ marginTop: 10 }}>
        {[["담당 고객", (stats.assigned + (cs ? cs.n : 0)).toLocaleString() + "명"], ["단계 전진 누적(6개월)", ((cs ? cs.advTotal : 0) + stats.adv).toLocaleString() + "명"], ["정체 해소", (cs ? cs.stallFixed : 0) + "명"], ["건강 터치 누적", ((cs ? cs.touches : 0) + stats.touches).toLocaleString() + "회"], ["첫 연결 완료율(락 해제 후)", (cs ? cs.firstRate : stats.firstRate) + "%"], ["만기 터치 완료율", (cs ? cs.expireRate : 100) + "%"], ["응답 시한 준수율", (cs ? cs.slaRate : 100) + "%"], ["접촉 락 준수", stats.lockOk ? "100% ✓" : `위반 시도 ${stats.viol}건`]].map(([k, v], i) => (
          <div key={i} style={{ border: "1px solid #F1F5F9", borderRadius: 11, padding: "10px 13px" }}>
            <div style={{ fontSize: 11, color: HM_C.mut, fontWeight: 700 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: HM_C.dark }}>{v}</div>
          </div>
        ))}
      </div>
      {cs && (<div className="hmgrid2" style={{ marginTop: 8 }}>
        <div className="hmcard" style={{ marginTop: 0 }}>
          <b style={{ fontSize: 12.3 }}>월별 단계 전진 추이 <span style={{ fontWeight: 700, color: HM_C.mut, fontSize: 10.5 }}>· 최근 6개월(시연 분포)</span></b>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 92, marginTop: 10 }}>
            {cs.adv6.map((x, j) => (
              <div key={j} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: HM_C.dark }}>{x.n}</div>
                <div style={{ height: Math.max(4, Math.round(x.n / maxAdv * 60)), background: j === 5 ? HM_C.pri : "#FFD9B0", borderRadius: "5px 5px 0 0", margin: "2px 4px 0" }} />
                <div style={{ fontSize: 10, color: HM_C.mut, marginTop: 3 }}>{x.ym}</div>
              </div>
            ))}
          </div>
          <div className="hmfoot">전진 1건 = 담당 회원의 단계가 오른 것(D1→D2 …) — 데이터가 판정하고 프로는 기여로 집계돼요.</div>
        </div>
        <div className="hmcard" style={{ marginTop: 0 }}>
          <b style={{ fontSize: 12.3 }}>접촉 결과 분포 <span style={{ fontWeight: 700, color: HM_C.mut, fontSize: 10.5 }}>· 누적 {cs.touches.toLocaleString()}회</span></b>
          <div style={{ marginTop: 9 }}>
            {cs.dist.map(([k, n], j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, margin: "5px 0" }}>
                <span style={{ width: 74, fontSize: 11, fontWeight: 700, color: HM_C.mut }}>{k}</span>
                <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 6, height: 12 }}>
                  <div style={{ width: Math.round(n / distMax * 100) + "%", height: 12, borderRadius: 6, background: k === "거절" ? "#FCA5A5" : k.indexOf("부재") >= 0 ? "#FDE68A" : HM_C.pri, opacity: k === "연결됨" ? 1 : .8 }} />
                </div>
                <span style={{ width: 46, textAlign: "right", fontSize: 11, fontWeight: 800 }}>{n.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="hmfoot">거절·부재도 실적 화면에 그대로 남아요 — 숨기지 않는 것이 관리의 시작이에요.</div>
        </div>
      </div>)}
      {cs && (<div className="hmcard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
          <b style={{ fontSize: 12.3 }}>회원 평가 <span style={{ color: HM_C.pri, fontSize: 15 }}>★ {cs.stars}</span> <span style={{ fontWeight: 700, color: HM_C.mut, fontSize: 10.5 }}>· {cs.starsN}건(시연)</span></b>
          <span style={{ fontSize: 10.5, color: HM_C.mut }}>평가가 낮으면 가중 배분이 줄어요 — 단, ② 순번 배분은 평가와 무관</span>
        </div>
        {cs.comments.map((c, j) => (
          <div key={j} style={{ borderTop: j ? "1px dashed #F1F5F9" : "none", padding: "7px 0", fontSize: 11.8, display: "flex", gap: 8 }}>
            <span style={{ color: HM_C.pri, fontWeight: 800, flexShrink: 0 }}>{"★".repeat(c.star)}</span>
            <span style={{ color: HM_C.ink, lineHeight: 1.55 }}>{c.text}</span>
          </div>
        ))}
      </div>)}
      {agg && (<div className="hmcard" style={{ background: "#FFFDF9" }}>
        <b style={{ fontSize: 12.3 }}>{agg.dan} 집계 <span style={{ fontWeight: 700, color: HM_C.mut, fontSize: 10.5 }}>· 지역리드(HM4) 관측 — 합계·평균만, 개인 상세 없음</span></b>
        <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
          <span>활성 프로 <b style={{ fontSize: 15, color: HM_C.dark }}>{agg.pros}명</b></span>
          <span>단계 전진 합계(표본 {agg.sampled}명·6개월) <b style={{ fontSize: 15, color: HM_C.dark }}>{agg.advSum.toLocaleString()}명</b></span>
          <span>평균 첫 연결 완료율 <b style={{ fontSize: 15, color: HM_C.dark }}>{agg.avgFirst}%</b></span>
        </div>
      </div>)}
      <div className="hmcard">
        <b style={{ fontSize: 12.3 }}>컴플라이언스 자가점검</b>
        <div style={{ fontSize: 11.8, color: HM_C.mut, marginTop: 5, lineHeight: 1.8 }}>
          ✓ 무동의 접촉 0건(생성 시점 배제 — leadDbAudit 원칙) · ✓ 월 접촉 한도 초과 0건(leadRouting 쿨다운 계승)<br />
          {stats.lockOk ? "✓" : "✗"} 접촉 락 위반 시도 {stats.viol}건 · ✓ 금칙어 발송 0건(발송 전 검사) · 내 조회 기록은 회원 금고 접근 로그에 전부 남아요
        </div>
      </div>
    </div>); })()}
  </div>);
}

/* ══ ⓪ 오늘의 지시서 — 인계 카드 Today 보드(지시서 v1.3 §5-F · P5 승격, 확정 디자인 B안+C여정축) ══ */
const HM_GRADE_UI = {
  H: { ko: "H 고위험", c: "#EA580C", bg: "#FFF1E2" }, M: { ko: "M 중위험", c: "#D97706", bg: "#FEF7E0" },
  L: { ko: "L 관심", c: "#0891B2", bg: "#E0F5FA" },
};
/* 결과 기록 시트(2단계 P2 — A안 한 판 그리드, 형 실물 확인용 실장 2026-08-30) — §0-B 기록은 선택지다 */
function HmResultSheet({ card, code, onClose, onSaved }) {
  const [result, setResult] = React.useState(null);
  const [branch, setBranch] = React.useState(null);
  const [follow, setFollow] = React.useState(null);
  const [memo, setMemo] = React.useState("");
  const [golden, setGolden] = React.useState([]);   /* D2 골든타임 전달 체크(F3) — 5칸 선택지 */
  const today = new Date();
  const day = (n) => new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);
  const FOLLOWS = [["내일", day(1)], ["다음 주", day(7)], ["2주 뒤", day(14)], ["필요 없어요", null]];
  /* 응대 칩 부연 제목 — 이 카드 대본의 실제 응대 이름(형 지시 2026-08-30: 번호만으론 알 수 없다) */
  const branches = (card.script && card.script.branches) || [];
  const brKo = (b2) => String(b2.ko || "").split("(")[0].split("—")[0].split("·")[0].trim() || "응대";
  const isD2 = card.member.stage === "D2" && card.script && (card.script.firstconnect || []).length > 0;
  const gToggle = (k) => setGolden((g) => g.indexOf(k) >= 0 ? g.filter((x) => x !== k) : g.concat(k));
  const save = () => {
    if (!result) return;
    const r = hmrRecord(code, { i: card.member.cohortIndex, result: result, branch: branch, grade: card.grade,
      followUp: follow, memo: memo.trim(), golden: isD2 ? golden : undefined, date: today.toISOString().slice(0, 10) });
    onSaved(r);
  };
  return (<div style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(11,34,57,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px,96vw)", background: "#fff", borderRadius: "18px 18px 0 0", padding: "10px 18px 18px", boxShadow: "0 -10px 40px rgba(0,0,0,.25)" }}>
      <div style={{ width: 46, height: 5, background: "#CBD5E1", borderRadius: 3, margin: "0 auto 10px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <b style={{ fontSize: 15.5, color: HM_C.ink }}>{_hmProName(card.member)}님 통화, 어떻게 됐어요?</b>
        <span style={{ fontSize: 10.5, color: HM_C.mut, marginLeft: "auto" }}>탭 한 번이면 끝나요 · [예시·시연]</span>
        <button onClick={onClose} aria-label="닫기" style={{ flex: "none", width: 30, height: 30, borderRadius: 15, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontSize: 14, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {HM_RESULT_CODES.map((rc) => (
          <button key={rc.k} onClick={() => setResult(rc.k)} style={{ display: "flex", alignItems: "center", gap: 7, textAlign: "left", cursor: "pointer",
            border: result === rc.k ? "2px solid " + HM_C.pri : "1px solid #E2E8F0", background: result === rc.k ? "#FFF4E8" : "#fff", borderRadius: 10, padding: "9px 10px" }}>
            <span style={{ fontSize: 16 }}>{rc.icon}</span>
            <span style={{ flex: 1 }}><b style={{ fontSize: 12.6, color: HM_C.ink }}>{rc.ko}</b><span style={{ display: "block", fontSize: 10, color: "#94A3B8" }}>{rc.desc}</span></span>
          </button>))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118, paddingTop: 3 }}>어떤 말이 통했어요?</b>
        <div style={{ flex: 1, display: "flex", gap: 5, flexWrap: "wrap" }}>
          {branches.map((b2, n) => <span key={b2.id} onClick={() => setBranch(branch === n + 1 ? null : n + 1)} className="hmpill" style={{ cursor: "pointer", border: branch === n + 1 ? "1.5px solid " + HM_C.pri : "1px solid #CBD5E1", background: branch === n + 1 ? "#FFF4E8" : "#fff", color: branch === n + 1 ? "#C2410C" : "#334155" }}>응대 {n + 1} · {brKo(b2)}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118 }}>다시 연락할 날</b>
        {FOLLOWS.map(([ko, d]) => <span key={ko} onClick={() => setFollow(d)} className="hmpill" style={{ cursor: "pointer", border: follow === d ? "1.5px solid " + HM_C.pri : "1px solid #CBD5E1", background: follow === d ? "#FFF4E8" : "#fff", color: d == null && follow === null ? "#94A3B8" : (follow === d ? "#C2410C" : "#334155") }}>{ko}</span>)}
      </div>
      {isD2 && (<div style={{ marginTop: 9, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 11px" }}>
        <b style={{ fontSize: 11.6, color: "#92400E" }}>⭐ 골든타임 전달 체크 — 오늘 통화에서 말한 것만 눌러주세요</b>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
          {(typeof HMR_GOLDEN_KEYS !== "undefined" ? HMR_GOLDEN_KEYS : []).map((g) => (
            <span key={g.k} onClick={() => gToggle(g.k)} className="hmpill" style={{ cursor: "pointer",
              border: golden.indexOf(g.k) >= 0 ? "1.5px solid #D97706" : "1px solid #E2C97E",
              background: golden.indexOf(g.k) >= 0 ? "#FDE68A" : "#fff", color: golden.indexOf(g.k) >= 0 ? "#92400E" : "#78716C" }}>
              {golden.indexOf(g.k) >= 0 ? "✓ " : ""}{g.ko}</span>))}
        </div>
        <div style={{ fontSize: 10, color: "#B45309", marginTop: 5 }}>체크는 「헬스메이트 센터 통합 운영」(관리자 화면)의 골든타임 전달률에 집계돼요 — 5칸 다 전하는 게 목표예요.</div>
      </div>)}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118, flex: "none" }}>간단 메모</b>
        <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={120} placeholder="필요할 때만 한 줄 — 예: 다음엔 오후에 통화 원하심"
          style={{ flex: 1, border: "1px solid #CBD5E1", borderRadius: 9, padding: "8px 11px", fontSize: 12.2, color: "#334155" }} />
      </div>
      <button onClick={save} disabled={!result} style={{ width: "100%", marginTop: 12, background: result ? HM_C.pri : "#E2E8F0", border: "none", color: "#fff", borderRadius: 11, padding: "12px", fontSize: 14.5, fontWeight: 900, cursor: result ? "pointer" : "default" }}>저장하기</button>
      <div style={{ fontSize: 10.4, color: HM_C.mut, textAlign: "center", marginTop: 7 }}>저장하면 카드가 접혀요 · 완결·거절은 내일 명단에서 자동으로 빠지고, 후속일이 온 회원은 맨 위로 와요</div>
    </div>
  </div>);
}

/* ══ 보장맵(R2 — 무인 보장분석 산출) — T4~T6 카드 전용. 조회 원본은 여기 없다(A6 원칙) ══ */
function HmCovMap({ i }) {
  const [cmpOpen, setCmpOpen] = React.useState(false);
  const [n2Open, setN2Open] = React.useState(false);   /* R3 — T5 동의 요청(회원 자기 화면 시뮬) */
  const [n2Done, setN2Done] = React.useState(null);    /* "yes" | "no" */
  const cov = React.useMemo(() => { try { return covAnalysisOf(Number(i)); } catch (e) { return null; } }, [i]);
  if (!cov) return null;
  if (!cov.map) {
    return (<div style={{ marginTop: 8, background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 9, padding: "7px 11px", fontSize: 11.2, color: "#64748B" }}>
      🗺 무인 보장분석 — <b>{cov.blockedAt}</b>에서 제외됨: {(cov.steps.find((s) => !s.ok) || {}).note || ""} <span style={{ color: "#94A3B8" }}>(제외도 로그로 남아요)</span>
    </div>);
  }
  const m = cov.map;
  const sw = m.switchWindow;
  const n2ok = (typeof consentGate === "function") ? consentGate("n2", Number(i), "covCard").ok : false;
  return (<details style={{ marginTop: 8, border: "1px solid #BFDBFE", borderRadius: 9, padding: "7px 10px", background: "#F8FBFF" }}>
    <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#1D4ED8" }}>🗺 보장맵 — 무인 분석 결과 <span style={{ fontWeight: 600, color: "#64748B", fontSize: 10.5 }}>· 계약 정보만으로 산출(건강 데이터 미입력) · {m.at}</span></summary>
    <div style={{ marginTop: 7, fontSize: 11.4, lineHeight: 1.7 }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {m.cats.map((c) => <span key={c.k} className="hmpill" style={{ background: c.has ? "#EFF6FF" : "#FEF2F2", color: c.has ? "#1D4ED8" : "#B91C1C", border: "1px solid " + (c.has ? "#BFDBFE" : "#FECACA") }}>{c.has ? "✓" : "✕"} {c.ko}{c.has && c.limit ? " " + Math.round(c.limit / 10000000) / 1 * 1 + (c.k === "silson" ? "" : "천만") : ""}</span>)}
      </div>
      {m.gaps.length > 0 && <div style={{ marginTop: 5, color: "#B91C1C" }}><b>공백 {m.gaps.length}곳</b> — {m.gaps.map((g) => g.ko).join(" · ")}</div>}
      {m.overlaps.length > 0 && <div style={{ marginTop: 3, color: "#B45309" }}><b>중복 {m.overlaps.length}건</b> — {m.overlaps.map((o) => o.ko).join(" · ")} → 정리하면 <b>연 {Math.round(m.annualSaveTotal / 10000).toLocaleString()}만원</b>이 줄어요</div>}
      <div style={{ marginTop: 3, color: "#475569" }}>📅 {m.calendar.slice(0, 3).map((c) => c.ko + (c.done ? "(지남)" : " D-" + c.inDays)).join(" · ")}</div>
      <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {sw !== "NONE" && <span className="hmpill" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 800 }}>⚠️ 승환 창 {sw === "WITHIN_1M" ? "1개월" : "6개월"} — 비교안내 필수</span>}
        {sw !== "NONE" && <button className="hmbtn gh" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setCmpOpen(true)}>비교안내 보기</button>}
        {n2ok || n2Done === "yes"
          ? <span className="hmpill" style={{ background: "#F0FDF4", color: "#15803D" }}>안내·권유 동의(N2) 보유 — 제안 화면 열림</span>
          : n2Done === "no"
            ? <span className="hmpill" style={{ background: "#FFF7ED", color: "#C2410C" }}>회원이 이번엔 사양 — 건강관리는 그대로 계속돼요(재요청 없음)</span>
            : <>
                <span className="hmpill" style={{ background: "#F1F5F9", color: "#64748B" }}>🔒 제안 화면 없음 — 회원이 T5에서 동의해야 열려요(§0-V2)</span>
                <button className="hmbtn" style={{ padding: "4px 11px", fontSize: 11, background: "#0F2A43" }} onClick={() => setN2Open(true)}>📱 회원 화면으로 동의 요청</button>
              </>}
      </div>
    </div>
    {/* T5 — 가장 중요한 30초: 동의는 프로가 대신 누르지 않는다. 회원이 자기 화면에서 직접(시뮬) */}
    {n2Open && (<div style={{ position: "fixed", inset: 0, zIndex: 1460, background: "rgba(11,34,57,.55)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setN2Open(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(360px,92vw)", background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", padding: "12px 16px", fontSize: 12.5, fontWeight: 800 }}>📱 회원님 화면 <span style={{ fontWeight: 600, opacity: .85 }}>· [예시·시연] 회원 본인이 직접 선택해요</span></div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: "#0F2A43", lineHeight: 1.5 }}>보장 종료 후에도 필요한 안내를 받으시겠습니까?</div>
          <div style={{ fontSize: 11.6, color: "#475569", lineHeight: 1.7, marginTop: 7 }}>
            무료 검진대비보험이 7일 뒤 끝나요. 동의하시면 보장이 끝난 뒤에도 비어 있는 보장에 대한 <b>안내</b>를 받으실 수 있어요.<br />
            <span style={{ color: "#15803D" }}>✅ 동의해도</span> 건강정보는 안내에 쓰이지 않아요(계약 정보만).<br />
            <span style={{ color: "#C2410C" }}>⚠️ 동의하지 않아도</span> 건강관리·코칭은 지금처럼 계속돼요.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 13 }}>
            <button className="hmbtn" style={{ background: "#EA580C" }} onClick={() => { try { consentSet("n2", true); } catch (e) {} setN2Done("yes"); setN2Open(false); }}>네, 받을게요</button>
            <button className="hmbtn gh" onClick={() => { setN2Done("no"); setN2Open(false); }}>이번엔 괜찮아요</button>
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8, textAlign: "center" }}>어느 쪽을 고르셔도 다시 묻지 않아요 — 마음이 바뀌면 언제든 설정에서 바꿀 수 있어요.</div>
        </div>
      </div>
    </div>)}
    {cmpOpen && (<div style={{ position: "fixed", inset: 0, zIndex: 1450, background: "rgba(11,34,57,.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCmpOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,94vw)", background: "#fff", borderRadius: 14, padding: "16px 18px", maxHeight: "80vh", overflowY: "auto" }}>
        <b style={{ fontSize: 13.5, color: "#0F2A43" }}>⚖️ 신·구 계약 비교안내 — 승환 창에서는 이 화면을 확인해야 다음으로 갈 수 있어요</b>
        <div style={{ fontSize: 10.6, color: "#64748B", margin: "3px 0 8px" }}>보험업법 §97③·시행령 §44의 비교 항목 — 표준 화면(시스템 강제 통과)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.2 }}>
          <thead><tr>{["비교 항목", "기존 계약", "새 제안"].map((h) => <th key={h} style={{ background: "#0F2A43", color: "#fff", padding: "5px 8px", textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["월 보험료", "월 " + Math.round(m.monthlyTotal / 1000).toLocaleString() + "천원(전 계약 합계)", "제안 확정 시 표시"],
              ["보장 범위", m.cats.filter((c) => c.has).map((c) => c.ko).join("·") || "-", "제안 확정 시 표시"],
              ["보험기간·갱신", "갱신형 " + m.calendar.filter((c) => c.ko.indexOf("갱신") >= 0).length + "건 보유", "제안 확정 시 표시"],
              ["면책·감액 기간", "기존 계약은 면책 경과", "새 계약은 면책이 다시 시작돼요"],
              ["해지환급금", "해지 시 환급금 손실 가능", "제안 확정 시 표시"],
              ["인수 조건", "기존 계약 유지 시 재심사 없음", "새 계약은 심사를 다시 받아요"]].map((r, ix) => (
              <tr key={ix}>{r.map((c, j) => <td key={j} style={{ border: "1px solid #E2E8F0", padding: "5px 8px" }}>{j === 0 ? <b>{c}</b> : c}</td>)}</tr>))}
          </tbody>
        </table>
        <div style={{ fontSize: 10.6, color: "#B45309", marginTop: 7 }}>⚠️ 기존 계약 해지 후 새로 가입하면 보장 공백·면책 재시작·환급금 손실이 생길 수 있어요 — 확인 없이 청약이 진행되지 않아요.</div>
        <button className="hmbtn" style={{ width: "100%", marginTop: 10 }} onClick={() => setCmpOpen(false)}>비교안내를 확인했어요</button>
      </div>
    </div>)}
  </details>);
}

function HmHandoffCard({ ent, code, onToast }) {
  const c = ent.card; const g = HM_GRADE_UI[c.grade] || HM_GRADE_UI.L;
  const [done, setDone] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);   /* 결과 기록 시트(P2) */
  const [coach, setCoach] = React.useState(null);   /* A5 코치 답변(부분 활성 — 카드 해설 한정) */
  const act = (a) => {
    const r = (typeof hmcTouch === "function") ? hmcTouch(code, c.member.cohortIndex, "지시서·" + a.ko) : { ok: true };
    if (r.ok) {
      setDone(true);
      try { hiEvent("handoff_contacted", { grade: c.grade, key: a.key, src: "today" }); hiEvent("nav_opened", { nav: a.nav, src: "handoff" }); } catch (e) {}
    }
    onToast(r.ok ? `기록됐어요 — ${a.ko} 알림 발송(완결 대기: ${a.evNote.split("—")[0].trim()})` : r.reason);
  };
  const askCoach = (q) => {
    try { const ans = coachAnswer(c, q); setCoach(ans ? { q: q, ans: ans } : { q: q, ans: null }); } catch (e) { setCoach(null); }
  };
  return (<div style={{ display: "flex", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 14px -10px rgba(15,42,68,.35)", marginTop: 10, opacity: done ? .62 : 1 }}>
    <div style={{ width: 5, background: g.c, flex: "none" }} />
    <div style={{ flex: 1, padding: "11px 13px", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 14.5 }}>
          {_hmProName(c.member)} <span style={{ color: HM_C.mut, fontWeight: 600, fontSize: 12 }}>· {c.member.ageBand} {c.member.sex} · {c.member.region}</span>
          <span className="hmpill" style={{ marginLeft: 6, background: g.bg, color: g.c }}>{g.ko}</span>
          <span className="hmpill" style={{ marginLeft: 4, background: "#F1F5F9", color: "#475569" }}>{c.member.stage} 단계</span>
          {(c.script.firstconnect || []).length > 0 && <span className="hmpill" style={{ marginLeft: 4, background: "#FDE68A", color: "#92400E", fontWeight: 900 }}>⭐ 첫 연결 골든타임</span>}
          {/* R3 — 60일 사이클 배지(만기 국면): 보험 시계가 카드에 보인다 */}
          {(() => { try {
            const cy = cycleOf(c.member.cohortIndex);
            if (!cy || !cy.t) return null;
            if (cy.t === "T4") return <span className="hmpill" style={{ marginLeft: 4, background: "#DBEAFE", color: "#1D4ED8", fontWeight: 800 }} title="무료 보장 종료 20일 전 — 보장 종료 예고(사실 고지)와 무인 보장분석이 실행되는 시점이에요.">⏳ 만기 D-{cy.s14}</span>;
            if (cy.t === "T5") return <span className="hmpill" style={{ marginLeft: 4, background: "#FEF3C7", color: "#92400E", fontWeight: 900 }} title="만기 7일 전 — 보장맵을 안내하고, 원하시면 상품 안내 동의(N2)를 회원 화면에서 받는 가장 중요한 30초예요.">🔔 만기 D-{cy.s14} · 보장맵 안내</span>;
            if (cy.t === "T6") return <span className="hmpill" style={{ marginLeft: 4, background: "#FDECEC", color: "#B91C1C", fontWeight: 900 }} title="오늘 무료 보장이 끝나요 — 사실 통지 + 동의 보유 회원에 한해 대안 제안. 2차 골든타임이 시작돼요.">⚠️ 만기 — 2차 골든타임</span>;
            if (cy.secondGolden) return <span className="hmpill" style={{ marginLeft: 4, background: "#FFF7ED", color: "#C2410C", fontWeight: 800 }} title="만기 후 무보장 상태 — 30일 안에 회복하지 못하면 조용한 이탈로 이어져요.">🕐 무보장 {cy.s20}일째</span>;
            return null;
          } catch (e) { return null; } })()}
          {c.member.stalledDays >= 14 && <span className="hmpill" style={{ marginLeft: 4, background: "#FDECEC", color: "#B91C1C" }}>정체 {c.member.stalledDays}일</span>}
        </div>
        <HmStageDots reached={(typeof cohortStageOf === "function" && cohortStageOf(c.member.cohortIndex) || { reached: [c.member.stage] }).reached} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12.6, fontWeight: 800, color: "#C2410C" }}>⚡ {c.trigger}</div>
      {/* R2 — 만기 국면(T4~T6) 카드에만 보장맵(무인 분석 산출) 노출 */}
      {(() => { try { const cy = cycleOf(c.member.cohortIndex); return cy && ["T4", "T5", "T6"].indexOf(cy.t) >= 0 ? <HmCovMap i={c.member.cohortIndex} /> : null; } catch (e) { return null; } })()}
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {c.evidence.map((e, i) => <span key={i} className="hmpill" style={{ border: `1px solid ${g.c}55`, color: g.c, background: "#fff" }}>{e}</span>)}
        <span className="hmpill" style={{ border: "1px solid #CBD5E1", color: HM_C.mut, background: "#fff" }}>동의 ✓ · 원본 수치 미포함 ✓</span>
      </div>
      <div style={{ marginTop: 9, display: "flex", gap: 7, flexWrap: "wrap" }}>
        {c.actions.map((a, i) => i === 0
          ? <button key={a.key} className="hmbtn" style={{ background: g.c }} onClick={() => act(a)}>{a.ko} — 원탭 알림</button>
          : <button key={a.key} className="hmbtn gh" onClick={() => act(a)}>{a.ko}</button>)}
      </div>
      {/* 발밑 표시 4종 — 호버 툴팁(형 지시 2026-09-01 · 설명서 부록과 같은 문안) */}
      <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11.4, color: "#475569", alignItems: "center" }}>
        <b style={{ color: g.c, cursor: "help" }} title="카드 발행 후 이 시간 안에 첫 접촉이 이뤄져야 해요 — 회원의 위험 등급이 시한을 정해요. 넘기면 「응답 시한 임박」 칸과 「헬스메이트 센터 통합 운영」(관리자 화면)의 준수율 집계에 잡혀요.">⏱ {c.timing.sla}</b>
        <span style={{ cursor: "help" }} title="통화만 하면 '접촉'이에요 — 1순위 개입이 실제 행동(예약·등록 등 데이터)으로 이어져야 '완결'로 집계돼요.">완결 = {c.actions[0] ? c.actions[0].evNote.split("—")[0].split("[")[0].trim() : "-"}</span>
        {/* 영상 V5 — 진료 연결 완결 회수. 「연결됨」 사실만 돌아온다(병원·진료과·내용은 오지 않음) */}
        {(() => {
          if (!c.actions[0] || c.actions[0].key !== "clinic") return null;
          let td = { done: false };
          try { td = teleDoneOf(c.member && c.member.email ? c.member : { email: (c.member || {}).email }); } catch (e) {}
          return td.done
            ? <span className="hmpill" style={{ background: "#F0FDF4", color: "#15803D" }} title="회원이 원격진료 상담을 접수했다는 사실만 돌아와요 — 어느 병원에서 무엇을 진료했는지는 프로에게 오지 않아요(§0-V10·데이터 경계).">🏁 진료 연결 완결 · {td.at}</span>
            : <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut }} title="회원이 원격진료 상담을 접수하면 여기에 「연결됨」이 표시돼요. 진료 내용은 표시되지 않아요.">완결 대기 — 회원 행동</span>;
        })()}
        <span style={{ color: "#15803D", fontWeight: 700, cursor: "help" }} title="이 카드의 대본이 발행 전 자동 검사 3종을 통과했어요: ①원본 검진 수치 누출 0(구간 표현만) ②빈칸(미치환 슬롯) 0 ③금지어(진단 단정·공포 조장·권유·금액 흥정) 0 — 하나라도 걸리면 카드가 발행되지 않아요.">🛡 경계 3종 통과</span>
        <span style={{ cursor: "help" }} title="시한 안에 접촉했지만 완결까지 못 갔으면 7일 뒤 명단에 다시 올라와요. 거절한 회원은 30일 쉬고, 완결된 회원은 다시 오지 않아요.">{c.timing.requeue}</span>
        <button className="hmbtn gh" style={{ marginLeft: "auto", padding: "5px 12px", fontSize: 11.6, borderColor: g.c, color: g.c }} onClick={() => setSheet(true)}>📝 결과 남기기</button>
      </div>
      {sheet && <HmResultSheet card={c} code={code} onClose={() => setSheet(false)}
        onSaved={(r) => { setSheet(false); if (r.ok) { setDone(true); onToast(`결과 저장됐어요 — ${r.ko}. 내일 명단에 반영돼요.`); } else onToast(r.why); }} />}
      {/* 회원의 걸어온 길(2단계 P4) — 여정 브리프 + 대비 현황(프로 조회용 — 먼저 꺼내지 않는다 §0-P) */}
      <details style={{ marginTop: 8, border: "1px dashed #CBD5E1", borderRadius: 9, padding: "7px 10px" }}>
        <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#334155" }}>👣 회원의 걸어온 길 — {c.member.stage} 단계까지</summary>
        {(() => {
          let jb = null, ns = null;
          try { jb = journeyBrief(c.member.cohortIndex); } catch (e) {}
          try { ns = needsSummary(c.member.cohortIndex); } catch (e) {}
          return (<div style={{ marginTop: 7, fontSize: 12, lineHeight: 1.7 }}>
            {jb && jb.items.map((it, n) => (<div key={n} style={{ display: "flex", gap: 6, alignItems: "baseline", color: it.on ? "#374151" : "#94A3B8" }}>
              <span>{it.on ? "·" : "🔒"}</span><span>{it.ko}</span></div>))}
            {ns && <div style={{ marginTop: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 9px", fontSize: 11.4, color: "#475569" }}>
              <b style={{ color: HM_C.ink }}>🧾 대비 현황(조회용)</b> — 치료비 {ns.cost.steps[2].oopBand} · 생활비 {ns.income.applicable ? ns.income.gapBand : "해당 없음"} · 준비됨 {ns.fund.htk.toLocaleString()} HTK
              <div style={{ fontSize: 10, color: "#B45309", marginTop: 2 }}>⚠ 이 숫자는 먼저 꺼내지 않아요 — 회원이 물을 때만(응대 6) 답해요</div></div>}
          </div>);
        })()}
      </details>
      <details style={{ marginTop: 8, border: "1px dashed #CBD5E1", borderRadius: 9, padding: "7px 10px" }}>
        <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#334155" }}>🗒 대본 보기(v2) — {c.script.variant} 변형 · 읽기 약 {c.script.readSec}초</summary>
        {(() => {
          /* 대본 v2 미리보기(P5 검수 중) — 발행·알림은 v1 그대로, 화면에서만 [초안] 라벨로 병기 */
          const s2 = c.script.v2 ? c.script : null;   /* v2 정식(2026-08-30 승인) — 카드 자체가 v2 */
          const draft = (t, b) => b && <div key={b.id + t} style={{ marginBottom: 5, background: "#F8F7FF", borderRadius: 7, padding: "4px 8px" }}><span className="hmpill" style={{ background: "#6D28D9", color: "#fff", marginRight: 6 }}>{t}</span><i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>{b.ko}</i><div>“{b.text}”</div></div>;
          return (<div style={{ marginTop: 7, fontSize: 12.2, lineHeight: 1.75, color: "#1F2937" }}>
          {[["오프닝", c.script.opening]].map(([t, b], i) => b &&
            <div key={i} style={{ marginBottom: 5 }}><span className="hmpill" style={{ background: HM_C.ink, color: "#fff", marginRight: 6 }}>{t}</span><i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>{b.ko}</i><div>“{b.text}”</div></div>)}
          {s2 && (s2.firstconnect || []).map((b) => draft("⭐ 첫 연결", b))}
          {s2 && (s2.talk || []).map((b) => draft("💬 생활 대화", b))}
          {c.script.core.map((b, i) =>
            <div key={"c" + i} style={{ marginBottom: 5 }}><span className="hmpill" style={{ background: HM_C.ink, color: "#fff", marginRight: 6 }}>본론</span><i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>{b.ko}</i><div>“{b.text}”</div></div>)}
          {s2 && (s2.seed || []).map((b) => draft("🌱 여정 씨앗", b))}
          {[["제안", c.script.ask]].map(([t, b], i) => b &&
            <div key={"a" + i} style={{ marginBottom: 5 }}><span className="hmpill" style={{ background: HM_C.ink, color: "#fff", marginRight: 6 }}>{t}</span><i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>{b.ko}</i><div>“{b.text}”</div></div>)}
          {s2 && (s2.careplan || []).map((b) => draft("🧰 케어 플랜", b))}
          {s2 && (s2.maturity || []).map((b) => draft("⏳ 만기 국면", b))}
          {s2 && (s2.fcTail || []).map((b) => draft("⭐ 첫 연결", b))}
          <div style={{ border: "1px dashed #CBD5E1", borderRadius: 8, padding: "6px 9px", margin: "6px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 4 }}>회원 반응별 응대 10종(수락·보류·거절·질문·치료비·가족·기존보험·바쁨·두려움)</div>
            {(s2 ? s2.branches : c.script.branches).map((b, i) => <div key={b.id} style={{ marginBottom: 4 }}><b style={{ color: "#C2410C", fontSize: 11 }}>응대 {i + 1}</b> <i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>· {b.ko.split("(")[0].split("—")[0].trim()}</i><div>“{b.text}”</div></div>)}
          </div>
          {s2 && (s2.voluntary || []).length > 0 && (
            <details style={{ border: "1px dashed #A7F3D0", background: "#F0FDF4", borderRadius: 8, padding: "6px 9px", margin: "6px 0" }}>
              <summary style={{ cursor: "pointer", fontSize: 11.4, fontWeight: 800, color: "#15803D" }}>💬 회원이 먼저 건강 이야기를 꺼내면 — 자발 대화 6갈래 <span style={{ fontWeight: 600, color: "#64748B" }}>(먼저 꺼내지 않아요 · 회원이 열었을 때만)</span></summary>
              {(s2.voluntary || []).map((b, i2) => <div key={b.id} style={{ marginTop: 4 }}><b style={{ color: "#15803D", fontSize: 11 }}>{i2 + 1}</b> <i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>· {b.ko.split("·")[1] ? b.ko.split("·")[1].trim() : b.ko}</i><div>“{b.text}”</div></div>)}
            </details>)}
          {c.script.closing && <div><span className="hmpill" style={{ background: HM_C.ink, color: "#fff", marginRight: 6 }}>클로징</span><i style={{ fontStyle: "normal", color: "#94A3B8", fontSize: 10.8 }}>{c.script.closing.ko}</i><div>“{c.script.closing.text}”</div></div>}
          <div style={{ marginTop: 6, fontSize: 11.6, color: "#475569" }}><b>📱 앱알림</b> {c.script.notif}<br /><b>✉️ 문자</b> {c.script.sms}</div>
        </div>);
        })()}
      </details>
      <div style={{ marginTop: 7, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10.8, fontWeight: 800, color: "#7C3AED" }}>🧭 A5 코치</span>
        {["왜 이 지시예요?", "거절하면요?", "심각하냐고 물으면요?", "문자로는 뭐라고 보내요?"].map((q) => (
          <button key={q} className="hmpill" style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9", cursor: "pointer" }} onClick={() => askCoach(q)}>{q}</button>))}
      </div>
      {coach && <div style={{ marginTop: 6, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 9, padding: "7px 10px", fontSize: 12, lineHeight: 1.65 }}>
        {coach.ans
          ? <span><b style={{ color: "#6D28D9" }}>코치</b> — {coach.ans.text} <i style={{ fontStyle: "normal", fontSize: 10.4, color: "#94A3B8" }}>· 원천 {coach.ans.source === "block" ? "대본 블록 " + coach.ans.id : "카드 필드 " + coach.ans.id}(사전 밖 문장 없음)</i></span>
          : <span style={{ color: HM_C.mut }}>이 질문은 아직 코치의 소유가 아니에요 — 하이에게 물어봐 주세요.</span>}
      </div>}
    </div>
  </div>);
}
/* ══ D1~L8 단계 가이드 — 단계를 누르면 설명 + 그 단계의 「인원 현황(명단)」이 열린다
      (형 지시 2026-10-05: D1을 누르면 71명 현황이 보여야 하고, 닫고 되돌아오는 길이 확실해야 한다)
      · 명단은 기본 20명 + [더 보기] — 수백 명이어도 한 번에 그리지 않는다(카드 조립 비용은 1인당 약 0.4ms)
      · 선택 상태(펼친 단계·상세로 들어간 회원)는 sessionStorage에 둔다 → 다른 탭에 갔다 와도,
        접촉 기록으로 리마운트가 일어나도 보고 있던 자리로 되돌아온다 ══ */
function HmStageGuide({ code, cview, onToast }) {
  const SKEY = "hifin_hm_stagesel_" + (code || "x");
  const boot = React.useMemo(() => { try { return JSON.parse(sessionStorage.getItem(SKEY) || "null") || {}; } catch (e) { return {}; } }, [code]);
  const [sel, setSel] = React.useState(boot.sel || null);                                  /* 펼친 단계(D1~L8) */
  const [detail, setDetail] = React.useState(boot.detail != null ? boot.detail : null);    /* 상세로 들어간 회원 인덱스 */
  const [show, setShow] = React.useState(20);                                              /* 명단 노출 수 — 20씩 늘린다 */
  const [q, setQ] = React.useState("");                                                    /* 검색 — 이름·시군구 */
  const byStage = (cview && cview.byStage) || {};
  const st = sel ? HM_STAGES.find((s) => s.k === sel) : null;
  const gd = sel ? HM_STAGE_GUIDE[sel] : null;
  /* 되돌아오기의 근거 — 이 키는 이 블록만 쓴다(세션 한정 · 회원 데이터 아님) */
  React.useEffect(() => { try { sessionStorage.setItem(SKEY, JSON.stringify({ sel: sel, detail: detail })); } catch (e) {} }, [sel, detail, code]);
  const pick = (k) => { const on = sel === k; setSel(on ? null : k); setDetail(null); setShow(20); setQ(""); };
  const close = () => { setSel(null); setDetail(null); setShow(20); setQ(""); };
  const ids = sel ? (byStage[sel] || []) : [];
  /* 요약 — 기존 엔진 산출만 조립한다(새 계산·새 수치 없음). 단계 인원이 수백이어도 선택할 때 1회만 돈다 */
  const sum = React.useMemo(() => {
    const o = { n: ids.length, stall: 0, days: 0, held: 0, sig: 0, band: { "상": 0, "중": 0, "하": 0 }, cyc: {} };
    ids.forEach((i) => {
      try {
        const s2 = cohortStageOf(i);
        if (s2 && s2.stalled) { o.stall++; o.days += s2.stalledDays; }
        if (s2 && s2.enrolled) o.held++;
        if (typeof cohortSignalOf === "function" && cohortSignalOf(i)) o.sig++;
        const hb = (typeof cohortHealthBrief === "function") ? cohortHealthBrief(i) : null;
        if (hb && o.band[hb.band] != null) o.band[hb.band]++;
        const cy = (typeof cycleOf === "function") ? cycleOf(i) : null;
        const t = (cy && cy.t) ? cy.t : "PRE"; o.cyc[t] = (o.cyc[t] || 0) + 1;
      } catch (e) {}
    });
    o.avg = o.stall ? Math.round(o.days / o.stall) : 0;
    return o;
  }, [sel, ids.length]);
  /* 검색 — 이름·시군구·시도(프로 콘솔 전용 · 합성 코호트) */
  const hits = React.useMemo(() => {
    const t = q.trim();
    if (!t) return ids;
    return ids.filter((i) => {
      try { const m = cohortMemberAt(i); if (!m) return false;
        return (String(m.name || "").indexOf(t) >= 0 || String(m.sgg || "").indexOf(t) >= 0 || String(m.sido || "").indexOf(t) >= 0); } catch (e) { return false; }
    });
  }, [sel, q, ids.length]);
  const rows = hits.slice(0, show);
  const topCyc = Object.keys(sum.cyc).sort((a, b) => sum.cyc[b] - sum.cyc[a]).slice(0, 3);
  return (<div className="hmcard" style={{ marginTop: 10, padding: "11px 13px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 12.6, fontWeight: 900, color: HM_C.ink }}>🧭 회원 여정 D1~L8 <span style={{ fontSize: 11, color: HM_C.mut, fontWeight: 600 }}>— 단계를 누르면 설명과 그 단계 <b style={{ color: HM_C.deep }}>인원 현황(명단)</b>이 열려요</span></div>
      {sel && <button className="hmbtn gh" style={{ padding: "3px 10px", fontSize: 11 }} onClick={close}>닫기 ✕</button>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 6, marginTop: 9 }}>
      {HM_STAGES.map((s) => { const n = (byStage[s.k] || []).length; const on = sel === s.k; const life = s.part === "LIFE";
        return (<button key={s.k} onClick={() => pick(s.k)} title={(on ? "다시 누르면 닫혀요 — " : "누르면 ") + s.k + " 단계 " + n + "명 현황이 열려요"} style={{
          border: on ? `2px solid ${life ? HM_C.pri : HM_C.ink}` : "1px solid #E2E8F0", cursor: "pointer",
          background: on ? (life ? "#FFF4E8" : "#EEF4FA") : "#fff", borderRadius: 10, padding: "7px 4px", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: life ? HM_C.pri : HM_C.ink }}>{s.k}</div>
          <div style={{ fontSize: 10.2, fontWeight: 700, color: "#475569" }}>{s.name}</div>
          <div style={{ fontSize: 9.6, color: on ? HM_C.pri : HM_C.mut, fontWeight: on ? 900 : 400 }}>{n}명</div>
        </button>); })}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.8, color: HM_C.mut, marginTop: 4 }}>
      <span>◀ 데이터 자산 4단(D — 확보→통합)</span><span>생애 확장 4단(L — 정기→평생주기) ▶</span>
    </div>
    {st && gd && (<div style={{ marginTop: 10, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: st.part === "LIFE" ? "linear-gradient(135deg,#F5821F,#E56B0F)" : "linear-gradient(135deg,#0B2239,#1B3E5F)", color: "#fff", padding: "9px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span><b style={{ fontSize: 13.5 }}>{st.k} {st.name}</b> <span style={{ fontSize: 11.4, opacity: .9 }}>— {st.desc} · 내 관할 <b>{sum.n.toLocaleString()}명</b></span></span>
        <button className="hmbtn gh" style={{ padding: "3px 10px", fontSize: 10.8, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.45)", color: "#fff" }} onClick={close}>닫기 ✕</button>
      </div>
      <div style={{ padding: "10px 13px", fontSize: 12.2, lineHeight: 1.75 }}>
        {/* 세 줄의 뜻을 눈으로 구분한다 — 들어오는 조건(이 단계에 들어오는 기준)은 D1~L8 전 단계에서 강조 상자로 보여 준다 */}
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderLeft: `4px solid ${HM_C.pri}`, borderRadius: 10, padding: "8px 11px", marginBottom: 7 }}>
          <div style={{ fontSize: 11.2, fontWeight: 900, color: "#C2410C", marginBottom: 2 }}>▶ 들어오는 조건 <span style={{ fontWeight: 600, opacity: .8 }}>— 회원이 이 단계로 올라오는 기준</span></div>
          <div style={{ fontSize: 12.3, color: HM_C.ink, fontWeight: 700 }}>{gd.entry}</div>
        </div>
        {[["프로가 하는 일", gd.doKo, "#EFF6FF", "#1D4ED8", "이 단계에서 할 행동"], ["다음 단계로", gd.next, "#F0FDF4", "#15803D", "무엇이 생기면 다음 단계로 가는지"]].map(([k, v, bg, fg, hint]) => (
          <div key={k} style={{ background: bg, borderRadius: 10, padding: "8px 11px", marginBottom: 5 }}>
            <div style={{ fontSize: 11.2, fontWeight: 900, color: fg, marginBottom: 2 }}>{k} <span style={{ fontWeight: 600, opacity: .75 }}>— {hint}</span></div>
            <div style={{ fontSize: 12.2, color: "#374151" }}>{v}</div>
          </div>))}
        <div style={{ marginTop: 8, background: "#FFFBF5", border: "1px dashed #FED7AA", borderRadius: 9, padding: "7px 10px" }}>
          <b style={{ fontSize: 11.4, color: "#C2410C" }}>📖 사례 [예시·시연]</b>
          <div style={{ fontSize: 11.8, color: "#374151" }}>{gd.ex}</div>
        </div>

        {/* ── 인원 현황 — 이 단계 회원 전원(요약 → 검색 → 명단 20명씩 → 상세 → 되돌아가기) ── */}
        <div style={{ marginTop: 9, borderTop: "1px solid #F1F5F9", paddingTop: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <b style={{ fontSize: 12.4, color: HM_C.deep }}>👥 {st.k} {st.name} 인원 현황 — 총 {sum.n.toLocaleString()}명</b>
            <span style={{ fontSize: 10.4, color: HM_C.mut }}>내 관할만 · 단계 판정은 데이터가 한다(수기 변경 없음)</span>
          </div>
          {sum.n === 0
            ? <div className="hmrow" style={{ marginTop: 7, color: HM_C.mut }}>이 단계에 있는 관할 회원이 지금은 없어요 — 위 「들어오는 조건」이 충족되면 여기에 명단이 생겨요.</div>
            : (<div>
              {/* 요약 — 전부 기존 엔진 산출(정체·락·신호·위험 밴드·사이클) */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                {[["정체", sum.stall.toLocaleString() + "명", sum.stall ? "#FFF7ED" : "#F8FAFC", sum.stall ? HM_C.stall : HM_C.mut, "30일 이상 다음 행동이 없는 회원"],
                  ["평균 정체일", sum.avg ? sum.avg + "일" : "-", "#F8FAFC", HM_C.mut, "정체 회원들의 평균 정체 기간"],
                  ["접촉 락", sum.held.toLocaleString() + "명", sum.held ? "#F1F5F9" : "#F8FAFC", sum.held ? HM_C.hold : HM_C.mut, "검진결과 수령 전 — 연락 금지(하이가 자동 해제)"],
                  ["신호 도래", sum.sig.toLocaleString() + "명", sum.sig ? "#F0FDF4" : "#F8FAFC", sum.sig ? HM_C.ok : HM_C.mut, "하이가 접촉 근거를 찾은 회원"],
                  ["위험 상", sum.band["상"].toLocaleString() + "명", "#FFF1F2", HM_C.red, "위험 밴드 상 — 진단이 아니라 통계적 경향"],
                  ["위험 중", sum.band["중"].toLocaleString() + "명", "#FFFBEB", HM_C.warn, "위험 밴드 중"],
                  ["위험 하", sum.band["하"].toLocaleString() + "명", "#F0FDF4", HM_C.ok, "위험 밴드 하"]].map(([k, v, bg, c2, tip]) => (
                  <span key={k} title={tip} style={{ background: bg, border: "1px solid #E2E8F0", borderRadius: 9, padding: "5px 9px", fontSize: 11.2, cursor: "help" }}>
                    <span style={{ color: HM_C.mut }}>{k} </span><b style={{ color: c2 }}>{v}</b>
                  </span>))}
              </div>
              {topCyc.length > 0 && <div style={{ fontSize: 10.8, color: HM_C.mut, marginTop: 5 }}>60일 사이클 분포 — {topCyc.map((t) => (t === "PRE" ? "사이클 전" : t) + " " + sum.cyc[t].toLocaleString() + "명").join(" · ")}{Object.keys(sum.cyc).length > 3 ? " 외" : ""}</div>}

              {detail == null ? (<div>
                {/* 검색 — 이름·시군구 */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <input value={q} onChange={(e) => { setQ(e.target.value); setShow(20); }} placeholder="이름·시군구로 찾기 (예: 은평구)"
                    style={{ flex: 1, minWidth: 180, boxSizing: "border-box", border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "7px 11px", fontSize: 12 }} />
                  {q.trim() && <button className="hmbtn gh" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setQ(""); setShow(20); }}>검색 지우기</button>}
                  <span style={{ fontSize: 11, color: HM_C.mut }}>{q.trim() ? hits.length.toLocaleString() + "명 일치" : sum.n.toLocaleString() + "명 전체"}</span>
                </div>
                {!hits.length && <div className="hmrow" style={{ marginTop: 7, color: HM_C.mut }}>「{q.trim()}」로 찾은 회원이 이 단계에 없어요.</div>}
                {/* 명단 — 한 줄에 이름·연령대/성별·시군구·상태·정체일·사이클 단계·하이 한 줄 */}
                {rows.map((i) => {
                  let c = null; try { c = cohortCardOf(i); } catch (e) {}
                  if (!c) return null;
                  let cy = null; try { cy = (typeof cycleOf === "function") ? cycleOf(i) : null; } catch (e) {}
                  const place = c.region ? (c.region.sido + " " + c.region.sgg) : ((c.m.sido || "") + " " + (c.m.sgg || "")).trim();
                  return (<div key={i} onClick={() => setDetail(i)} title="누르면 이 회원 상세가 열려요 — [← 명단으로 되돌아가기]로 돌아와요"
                    style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", background: "#fff", border: "1px solid #EEF1F6", borderRadius: 9, padding: "6px 10px", marginTop: 4, fontSize: 11.6, cursor: "pointer" }}>
                    <b style={{ minWidth: 52 }}>{_hmProName(c.m)}</b>
                    <span style={{ color: HM_C.mut, minWidth: 58 }}>{c.band} {c.sex}</span>
                    <span style={{ color: HM_C.mut, minWidth: 92 }}>{place || "-"}</span>
                    <span className="hmpill" style={{ background: c.status.bg, color: c.status.c }}>{c.status.ko}</span>
                    {c.stage.stalled
                      ? <span className="hmpill" style={{ background: "#FDECEC", color: "#B91C1C" }}>정체 {c.stage.stalledDays}일</span>
                      : <span className="hmpill" style={{ background: "#F1F5F9", color: HM_C.mut }}>정체 없음</span>}
                    {cy && <span className="hmpill" style={{ background: "#EFF6FF", color: "#1D4ED8" }} title={cy.act || ""}>{cy.t ? cy.t + " " + cy.ko : cy.ko}</span>}
                    <span style={{ color: "#475569", flex: 1, minWidth: 170 }}>🤖 {c.hi}</span>
                    <span style={{ color: HM_C.pri, fontWeight: 800, flex: "none" }}>상세 ›</span>
                  </div>);
                })}
                {/* 더 보기 — 기본 20명, 누를 때마다 20명씩 */}
                {hits.length > rows.length && (
                  <button className="hmbtn gh" style={{ width: "100%", marginTop: 7, fontSize: 11.5, justifyContent: "center" }} onClick={() => setShow(show + 20)}>
                    더 보기 — {rows.length.toLocaleString()} / {hits.length.toLocaleString()}명 표시 중 (다음 {Math.min(20, hits.length - rows.length)}명)
                  </button>)}
                {rows.length > 20 && (
                  <button className="hmbtn gh" style={{ width: "100%", marginTop: 4, fontSize: 11, justifyContent: "center", borderStyle: "dashed" }} onClick={() => setShow(20)}>처음 20명만 보기 ▲</button>)}
              </div>) : (<div>
                {/* 상세 — 명단에서 들어온 한 명. 카드는 기존 경로(HmCohortCard)를 그대로 재사용한다 */}
                {(() => {
                  let c = null; try { c = cohortCardOf(detail); } catch (e) {}
                  if (!c) return (<div className="hmrow" style={{ marginTop: 7, color: HM_C.mut }}>이 회원 정보를 불러오지 못했어요.
                    <div style={{ marginTop: 6 }}><button className="hmbtn gh" style={{ fontSize: 11 }} onClick={() => setDetail(null)}>← 명단으로 되돌아가기</button></div></div>);
                  let cy = null; try { cy = (typeof cycleOf === "function") ? cycleOf(detail) : null; } catch (e) {}
                  return (<div style={{ marginTop: 8, border: `1.5px solid ${HM_C.pri}`, borderRadius: 12, background: "#FFFDF9", padding: "9px 11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <b style={{ fontSize: 12.6, color: HM_C.deep }}>👤 {_hmProName(c.m)} 상세 <span style={{ fontWeight: 600, color: HM_C.mut, fontSize: 11 }}>· {st.k} {st.name} 명단에서 열었어요</span></b>
                      <button className="hmbtn gh" style={{ padding: "4px 11px", fontSize: 11.4, fontWeight: 900 }} onClick={() => setDetail(null)}>← 명단으로 되돌아가기</button>
                    </div>
                    <div style={{ fontSize: 11.4, color: "#475569", margin: "5px 2px 0", lineHeight: 1.6 }}>
                      단계 도달 — <b>{(c.stage.reached || []).join(" → ")}</b>{cy ? <span> · 60일 사이클 <b>{cy.t ? cy.t + " " + cy.ko : cy.ko}</b> — {cy.act}</span> : null}{c.why ? <span> · 배정 근거 {c.why}</span> : null}
                    </div>
                    <HmCohortCard card={c} code={code} onDone={(r) => { if (onToast) onToast(r && r.ok ? '기록됐어요 — 코호트 접촉(세션 기록 · 새로고침 시 초기화)' : ((r && r.reason) || '기록하지 못했어요')); }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10.6, color: HM_C.mut }}>원본 검진 수치는 이 화면에 없어요 — 등급·관리 필요 항목 수·위험 밴드만 보여요.</span>
                      <button className="hmbtn gh" style={{ padding: "4px 11px", fontSize: 11.4, fontWeight: 900 }} onClick={() => setDetail(null)}>← 명단으로 되돌아가기</button>
                    </div>
                  </div>);
                })()}
              </div>)}
            </div>)}
        </div>
      </div>
    </div>)}
  </div>);
}
function HmTabToday({ code, onToast, cview }) {
  const today = new Date().toISOString().slice(0, 10);
  const roster = React.useMemo(() => (typeof hmDailyRoster === "function") ? hmDailyRoster(code, today) : null, [code, today]);
  /* 퍼널 1단 — 지시서 발행(실노출). 프로·일 1회만 기록(중복 노출은 발행이 아니다) */
  React.useEffect(() => {
    if (!roster || !roster.list.length) return;
    try {
      const k = "hifin_handoff_issued_" + code + "_" + today;
      if (!localStorage.getItem(k)) { hiEvent("handoff_issued", { n: roster.list.length, src: "today" }); localStorage.setItem(k, "1"); }
    } catch (e) {}
  }, [code, today]);
  if (!roster) return <div className="hmcard">지시서 조립기를 불러오지 못했어요.</div>;
  const gr = roster.counts.byGrade;
  return (<div>
    <div className="hmcard" style={{ background: "#FFFBF5", border: "1px solid #FED7AA" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 14.5, color: "#C2410C" }}>☀️ 오늘의 지시서 · {roster.list.length}건 <span style={{ fontSize: 11.4, color: HM_C.mut, fontWeight: 600 }}>· {today} · 시드=날짜+프로 사번(같은 날 같은 카드) · [예시·시연 데이터]</span></div>
        <div style={{ fontSize: 11.6, color: "#475569" }}>{["H", "M", "L"].filter((k) => gr[k]).map((k) => `${k} ${gr[k]}건`).join(" · ") || "대상 없음"} · 관할 {roster.counts.managed}명(락 {roster.counts.locked} · 후보 {roster.counts.candidates})</div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11.6, color: HM_C.mut }}>하이가 등급·응답 시한·정체를 계산해 우선순위로 선별했어요 — 프로는 카드 순서대로 확인·접촉·기록만. 대본 없는 통화는 없어요(대본 보기 ▼).</div>
    </div>
    <HmStageGuide code={code} cview={cview} onToast={onToast} />
    {/* R3 — 60일 터치 플랜: 검진일 기준 9시점이 자동 계산되어 뜬다. 프로가 「누구에게 언제」를 고민할 일이 없다 */}
    {(() => {
      const dist = {};
      try { if (cview) for (const i of cview.ids) { const cy = cycleOf(i); const k = cy && cy.t ? cy.t : "PRE"; dist[k] = (dist[k] || 0) + 1; } } catch (e) {}
      const ROWS = [
        ["T0", "검진 전", "예약 완료 — 접촉 금지, 프로필·관할 사전 학습만"],
        ["T1", "검진~결과", "접촉 금지(락) 유지 — 결과 없이 거는 전화는 회원에게 불편"],
        ["T2", "결과 도착", "골든타임 — 48시간 안 첫 통화(해설·무료 3종·케어 키트)"],
        ["T3", "코칭", "리포트 해설·케어 키트·습관 미션 — 보험 이야기는 하지 않는 구간"],
        ["T4", "만기 D-20", "보장 종료 예고(사실 고지) · 무인 보장분석 실행"],
        ["T5", "만기 D-7", "보장맵 안내 + 상품 안내 동의 요청 — 가장 중요한 30초"],
        ["T6", "만기", "무보장 사실 통지 — 2차 골든타임 개시"],
        ["T7", "관리 지속", "코칭·재검진 안내 계속 — 보험과 무관하게, 관계를 잇는 구간"],
        ["T8", "다음 검진", "1년 — 올해 검진 준비 안내, 사이클 재시작"],
      ];
      return (<details className="hmcard" style={{ marginTop: 10, padding: "10px 14px" }}>
        <summary style={{ cursor: "pointer", fontSize: 12.6, fontWeight: 900, color: HM_C.ink }}>⏱ 60일 터치 플랜 <span style={{ fontSize: 11, color: HM_C.mut, fontWeight: 600 }}>— 검진일 기준 9시점이 자동 계산돼요 · 내 관할 분포 포함</span></summary>
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          {ROWS.map(([t, when, act]) => (
            <div key={t} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 11.6, lineHeight: 1.6, borderBottom: "1px dashed #F1F5F9", paddingBottom: 3 }}>
              <b style={{ flex: "none", width: 30, color: ["T2", "T5", "T6"].indexOf(t) >= 0 ? "#C2410C" : "#1D4ED8" }}>{t}</b>
              <span style={{ flex: "none", width: 72, fontWeight: 700, color: "#475569" }}>{when}</span>
              <span style={{ flex: 1, color: "#334155" }}>{act}</span>
              <span className="hmpill" style={{ flex: "none", background: "#F1F5F9", color: "#475569" }}>{(dist[t] || 0).toLocaleString()}명</span>
            </div>))}
        </div>
        <div style={{ fontSize: 10.6, color: HM_C.mut, marginTop: 6 }}>보험 시계는 60일이지만 건강관리 시계는 1년 — 만기(T6)는 관계의 끝이 아니라 문턱이에요. 사이클 전(예약 전) {((dist.PRE || 0)).toLocaleString()}명은 배정 대상이 아니에요.</div>
      </details>);
    })()}
    {roster.list.map((ent) => <HmHandoffCard key={ent.i} ent={ent} code={code} onToast={onToast} />)}
    {!roster.list.length && <div className="hmcard" style={{ marginTop: 10 }}>오늘 발행 대상이 없어요 — 관할 회원이 모두 락(검진 대기)이거나 관리 리듬 양호예요.</div>}
  </div>);
}

/* ⑩ 통합 운영은 이 파일에서 떼어 냈다(형 지시 2026-10-05) — 지점장·사업단장·본사 직원용
   「헬스메이트 센터 통합 운영」 관리자 전용 화면으로 분리했고, 프로 콘솔에는 탭조차 없다.
   옛 구현(HmOpsAllocBlock · HmTabOps)은 그 화면으로 이관했으니 여기서 되살리지 말 것. */
/* ══ 하이프로 대화 독(2단계 P6) — 프로 전용 · 보라 톤(회원 하이와 구분) · 답변은 원천 조립만(출처 칩 동반) ══ */
function HiProDock() {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState([{ me: false, text: "하이프로예요 — 프로님 전용 도우미. 단계·대본·기준·화면, 뭐든 물어보세요. 회원 카드 관련은 카드의 「하이프로」 칩이 빨라요.", refs: [] }]);
  const [inp, setInp] = React.useState("");
  const boxRef = React.useRef(null);
  const QUICK = ["고혈압 건강관리 방법 알려줘", "감마지피티 높은 회원에게 뭐라고 해요?", "당뇨병 식단 뭐가 좋아요?", "D3가 뭐예요?", "거절 응대 대본 찾아줘", "회원이 치료비 얼마냐고 물으면?"];
  const ask = (q) => {
    if (!q.trim()) return;
    let a = null; try { a = hiproAnswer(q); } catch (e) {}
    setMsgs((m) => [...m, { me: true, text: q }, { me: false, text: a ? a.text : "잠시 후 다시 물어봐 주세요.", refs: a ? a.refs : [] }]);
    setInp("");
    setTimeout(() => { try { boxRef.current.scrollTop = boxRef.current.scrollHeight; } catch (e) {} }, 60);
  };
  return (<>
    <button onClick={() => setOpen(!open)} style={{ position: "fixed", left: 18, bottom: 18, zIndex: 1350, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", borderRadius: 26, padding: "12px 18px", fontSize: 13.5, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 24px rgba(109,40,217,.4)" }}>🧭 하이프로</button>
    {open && (<div style={{ position: "fixed", left: 18, bottom: 72, zIndex: 1350, width: "min(360px,92vw)", background: "#fff", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,.28)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "62vh" }}>
      <div style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 13.5 }}>🧭 하이프로 <span style={{ fontSize: 10, opacity: .85, fontWeight: 600 }}>· 프로 전용 · 원천 있는 답만</span></b>
        <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 900 }}>✕</button>
      </div>
      <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", background: "#FAF9FF" }}>
        {msgs.map((m, i) => (<div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", marginBottom: 7 }}>
          <div style={{ maxWidth: "86%", background: m.me ? "#6D28D9" : "#fff", color: m.me ? "#fff" : "#1F2937", border: m.me ? "none" : "1px solid #E9E5F8", borderRadius: m.me ? "12px 12px 3px 12px" : "12px 12px 12px 3px", padding: "8px 11px", fontSize: 12.4, lineHeight: 1.65 }}>
            {m.text}
            {!m.me && m.refs && m.refs.length > 0 && <div style={{ marginTop: 5 }}>{m.refs.map((r2) => <span key={r2} style={{ display: "inline-block", background: "#F3F0FC", color: "#6D28D9", borderRadius: 6, padding: "1px 7px", fontSize: 9.6, fontWeight: 700, marginRight: 4 }}>📎 {r2}</span>)}</div>}
          </div></div>))}
      </div>
      <div style={{ padding: "7px 10px", display: "flex", gap: 4, flexWrap: "wrap", borderTop: "1px solid #EEE9FB" }}>
        {QUICK.map((q) => <span key={q} onClick={() => ask(q)} style={{ cursor: "pointer", border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9", borderRadius: 10, padding: "3px 9px", fontSize: 10.6, fontWeight: 700 }}>{q}</span>)}
      </div>
      <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid #EEE9FB" }}>
        <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(inp); }} placeholder="무엇이든 물어보세요"
          style={{ flex: 1, border: "1px solid #DDD6FE", borderRadius: 10, padding: "8px 11px", fontSize: 12.4 }} />
        <button onClick={() => ask(inp)} style={{ background: "#6D28D9", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12.4, fontWeight: 900, cursor: "pointer" }}>보내기</button>
      </div>
    </div>)}
  </>);
}

/* ══ 5분 데모 가이드(2단계 P7) — 운영 본부 전용 발표 스텝퍼 · 원천: demoScript.js(단일 소스) ══ */
function HmDemoGuide({ onTab }) {
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);
  if (typeof isAdminRole !== "function" || !isAdminRole()) return null;
  if (typeof DEMO_STEPS === "undefined") return null;
  const s = DEMO_STEPS[idx];
  return (<>
    <button onClick={() => setOpen(!open)} style={{ position: "fixed", left: 18, bottom: 66, zIndex: 1349, background: "#0F2A43", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 22, padding: "9px 15px", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 18px rgba(15,42,67,.4)" }}>🎬 5분 데모</button>
    {open && (<div style={{ position: "fixed", left: 18, bottom: 112, zIndex: 1349, width: "min(390px,92vw)", background: "#fff", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,.28)", overflow: "hidden" }}>
      <div style={{ background: "#0F2A43", color: "#fff", padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 13 }}>🎬 현대해상 5분 데모 동선 <span style={{ fontSize: 10, opacity: .8, fontWeight: 600 }}>· 운영 전용</span></b>
        <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 900 }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "9px 12px 0", flexWrap: "wrap" }}>
        {DEMO_STEPS.map((d, i) => (<span key={d.n} onClick={() => setIdx(i)} style={{ cursor: "pointer", borderRadius: 8, padding: "3px 8px", fontSize: 10.5, fontWeight: 800, background: i === idx ? "#0F2A43" : "#EEF3F8", color: i === idx ? "#fff" : "#48607A" }}>{d.min} {d.n}</span>))}
      </div>
      <div style={{ padding: "10px 14px 13px" }}>
        <div style={{ fontSize: 13.2, fontWeight: 900, color: "#0F2A43" }}>{s.n}. {s.t}</div>
        <div style={{ fontSize: 10.8, color: "#64748B", marginTop: 2 }}>📍 {s.where} · {s.frame}</div>
        <div style={{ fontSize: 11.8, color: "#334155", lineHeight: 1.65, marginTop: 7, background: "#F5F8FB", borderRadius: 10, padding: "8px 11px" }}><b>무엇을</b> — {s.act}</div>
        <div style={{ fontSize: 11.8, color: "#334155", lineHeight: 1.65, marginTop: 6, background: "#FFF9F0", borderRadius: 10, padding: "8px 11px" }}><b>🎤 멘트</b> — {s.say}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
          <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="hmbtn gh" style={{ flex: 1, opacity: idx === 0 ? .4 : 1 }}>← 이전</button>
          {s.tab != null && <button className="hmbtn" style={{ flex: 1.2, background: "#0F2A43" }} onClick={() => { try { onTab(s.tab); } catch (e) {} }}>이 화면 열기</button>}
          <button disabled={idx === DEMO_STEPS.length - 1} onClick={() => setIdx(idx + 1)} className="hmbtn gh" style={{ flex: 1, opacity: idx === DEMO_STEPS.length - 1 ? .4 : 1 }}>다음 →</button>
        </div>
      </div>
    </div>)}
  </>);
}

/* ══ 메인 섹션 ══ */
function HealthMateSection({ onGo }) {
  /* 세션 복원 — 구 코드(HM-…)가 남아 있어도 신 사번으로 정규화해 들어온다.
     정규화하지 않으면 hmInsQueue()·hmIdeas() 같은 저장소 비교(x.code === code)가 빗나가 집계가 0으로 뜬다. */
  const [code, setCode] = React.useState(() => {
    try {
      const v = sessionStorage.getItem("hifin_hm_code");
      if (!v) return null;
      const n = (typeof hmCodeNorm === "function") ? hmCodeNorm(v) : v;
      if (n && n !== v) { try { sessionStorage.setItem("hifin_hm_code", n); } catch (e2) {} }
      return n || null;
    } catch (e) { return null; }
  });
  const [tab, setTab] = React.useState(0);   /* P5: 프로의 아침은 오늘의 지시서에서 시작 */
  const [tick, setTick] = React.useState(0);
  const [toastM, setToastM] = React.useState("");
  const refresh = () => setTick((t) => t + 1);
  /* 본인 계정 시연 전제 — 금고 검진·보험 시드와 상담·안내 시드 동의를 1회만 보강한다.
     ⚠️ 전에는 hmPopulation()이 렌더 중에 이 일을 했고, 거기서 ConsentNFT를 자체 발행해
        회원이 철회해도 새로고침 한 번에 되살아났다(실측). 쓰기는 반드시 이 effect에서만 한다. */
  React.useEffect(() => {
    let changed = false;
    try { changed = (typeof hmSelfEnsure === "function") ? !!hmSelfEnsure() : false; } catch (e) {}
    if (changed) refresh();
  }, []);
  const cview = React.useMemo(() => (code && typeof hmcProView === "function") ? hmcProView(code) : null, [code]);
  if (!code) return <HmGate onPass={(c) => setCode(c)} />;
  const pro = hmProOf(code);
  if (!pro || pro.status !== "활성") { if (typeof hmProSessionClear === "function") hmProSessionClear(); else { try { sessionStorage.removeItem("hifin_hm_code"); } catch (e) {} } return <HmGate onPass={(c) => setCode(c)} />; }
  const onContact = (m, act) => {
    const r = hmAct(code, m, act);
    setToastM(r.ok ? `기록됐어요 — ${act.label}(${act.result || "연결됨"}) · 체인·금고 로그 저장` : r.reason);
    setTimeout(() => setToastM(""), 3500);
    refresh();
    return r;
  };
  /* Today 집계 — 상호작용층(체험 + 본인 계정) + 코호트(관측층) 합산 */
  const members = hmScope(code);
  const cards = members.map((m) => hmCustomerCard(m));
  const selfN = cards.filter((c) => c.self).length;   /* 본인 계정(실측) — 「체험」과 섞어 세지 않는다 */
  const needN = cards.filter((c) => c.status.k === "NEED").length + (cview ? cview.signals.length : 0);
  const heldN = hmInsQueue().filter((x) => x.code === code && hmLockState({ email: x.email }).locked).length + (cview ? cview.held.length : 0);
  const stallN = cards.filter((c) => c.stage.stalled).length + (cview ? cview.stall.length : 0);
  const expN = cards.filter((c) => c.plan.items.some((x) => x.key.indexOf("m") === 0 && x.due && !x.done)).length + (cview ? cview.ready.length : 0);
  const slaN = hmSignals(code).filter((s) => s.sla <= 4).length + (cview ? cview.ids.filter((i) => { const g = cohortSignalOf(i); return g && g.sla <= 4; }).length : 0);
  /* R3 — 만기 임박(T4·T5): 검진대비보험 만기 D-20 이내 회원(달력 값이 정하는 오늘의 일) */
  const matN = cview ? cview.ids.filter((i) => { try { const cy = cycleOf(i); return cy && (cy.t === "T4" || cy.t === "T5" || cy.t === "T6"); } catch (e) { return false; } }).length : 0;
  /* 첫 통화 대상 — 검진 결과가 막 도착해 첫 연결 골든타임(D2 · 사이클 T2)에 들어온 회원 */
  const firstN = cards.filter((c) => c.stage && c.stage.k === "D2").length
    + (cview ? cview.ids.filter((i) => { try { const cy = cycleOf(i); return cy && cy.t === "T2"; } catch (e) { return false; } }).length : 0);
  const totalN = members.length + (cview ? cview.n : 0);
  /* 탭 이름 — 「지금 할 일」 묶음과 같은 결로, 이름만 보고 무엇을 보는 화면인지 알게 한다(형 지시 2026-10-05).
     번호 체계(⓪~⑨)는 그대로 두고, 네 번째 칸은 탭 아래에 깔리는 한 줄 설명(부제)이다.
     ⑩ 통합 운영은 이 콘솔에서 떼어 관리자 전용 화면으로 분리했다 — 관리자가 들어와도 여기엔 없다.
     ⓪의 숫자 카드 → 탭 점프 매핑도 이 이름과 짝이 맞게 맞췄다(아래 hmnumwrap 참조). */
  const TABS = [
    [0, "⓪ 오늘의 지시서", Sparkles, "하이가 오늘 발행한 카드 — 순서대로 확인·접촉·기록만 하면 돼요"],
    [1, "① 지금 연락할 회원", Users, "하이가 접촉 근거(신호)를 찾은 회원 — 응답 시한이 짧은 카드부터"],
    [2, "② 배정·접촉 락 회원", ShieldCheck, "검진대비보험 순번 배정과 접촉 락 — 결과 수령 전은 연락 금지, 락이 풀리면 ③ 첫 연결로 넘어가요"],
    [3, "③ 첫 연결·만기 터치 회원", HeartPulse, "락이 풀린 회원의 첫 연결(결과분석+보장 안내 1회 통합)과 그 뒤 만기·재검진 터치 계획"],
    [4, "④ 질병 위험 살펴볼 회원", Activity, "예측 위험 밴드 상·중 회원 — 예방 검진·주치의 연결로만 이어요(진단 아님)"],
    [5, "⑤ 제품·재구매 안내할 회원", ShoppingCart, "관리 포인트에 맞는 생활·제품 안내와 재구매 시점이 온 회원"],
    [6, "⑥ 가족·돌봄 상담할 회원", HeartHandshake, "개인에서 가구로 — 재가돌봄 설계, 응급 안내가 상담보다 먼저예요"],
    [7, "⑦ 치료비 보장 점검할 회원", MessageSquare, "보장공백·인수 가능성을 하이(A2)와 대화로 점검 — 확정·요율 단정 없음"],
    [8, "⑧ 개선 의견 보내기", Sparkles, "현장에서 본 것을 제품에 반영 — 모든 상태 변화에 사유가 붙어요"],
    [9, "⑨ 내 고객 전체·내 실적", TrendingUp, "담당 회원 D1~L8 분포와 단계 전진 실적 — 금액·순위는 없어요"],
  ];
  return (
    <div className="hmwrap" key={tick}><HmStyle />
      <div className="hmhero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="k">HEALTHMATE PRO CONSOLE · 헬스케어 전문가(하이핀 프로)</div>
            <h2>{pro.name} 프로 <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .9, cursor: "help" }} title="프로 등급 4단계 — HM1 안내(기본 안내만) · HM2 상담(결과 해설·보장 상담) · HM3 설계·가족(심화 상담+가족 단위 확장) · HM4 지역리드(지역단 집계 관측 — 개인 상세는 못 봐요). 사번(8H0001~8H9999)은 자격·권한·실적의 단일 키, '모집자격'은 보험 모집 라이선스 보유 표시예요.">· 사번 {pro.sabun || pro.code || "-"} · {pro.branch || pro.dan}{pro.sgg ? " · " + pro.sgg : ""} · {pro.grade}({pro.gradeKo}){pro.lic ? " · 모집자격" : " · 안내 전용"}{pro.hyundai ? " · 현대해상 위촉" : ""}</span></h2>
            <div style={{ fontSize: 12.3, fontWeight: 800, marginTop: 2 }}>담당 회원 {totalN.toLocaleString()}명 <span style={{ fontWeight: 600, opacity: .85 }}>({selfN ? "본인(실측) " + selfN + " · " : ""}체험 {members.length - selfN} · 코호트 {(cview ? cview.n : 0).toLocaleString()}) — 관할: {(pro.coverage || []).slice(0, 5).join("·") || pro.dan}{(pro.coverage || []).length > 5 ? " 외 " + ((pro.coverage || []).length - 5) + "곳" : ""}{pro.gap ? " (겸임 포함)" : ""}</span></div>
            <div style={{ fontSize: 12, opacity: .92 }}>하이가 분석·선별·문안·타이밍을 만들고, 프로는 확인·접촉·기록합니다 — 동의의 범위가 곧 활동의 범위.</div>
          </div>
          <button className="hmbtn gh" style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.4)", color: "#fff" }} onClick={() => { if (typeof hmProSessionClear === "function") hmProSessionClear(); else { try { sessionStorage.removeItem("hifin_hm_code"); } catch (e) {} } setCode(null); }}>사번 잠금</button>
        </div>
        {/* 오늘의 숫자 — 「지금 할 일 · 달력이 정한 일 · 지금 하면 안 되는 일」 세 묶음(겹칠 수 있는 렌즈이지 담당 분류가 아니다) */}
        <div className="hmnumwrap">
          {[["지금 할 일", [
            ["오늘 첫 통화할 회원", firstN, 3, "검진 결과가 막 도착해 첫 연결의 골든타임에 들어온 회원이에요 — 무료 3종과 앞으로의 건강관리를 이 한 통화에서 전합니다.", "첫 연결(D2·결과 직후)"],
            ["오늘 이어서 연락할 회원", needN, 1, "이미 관계가 시작된 회원 중 오늘 터치 시점이 온 분들이에요 — 하이가 문안과 타이밍을 준비해 둡니다.", "터치 시점 도래"],
            ["4시간 안에 답해야 할 카드", slaN, 1, "카드 발행 후 응답 시한이 4시간 안으로 남았어요 — 위 명단과 겹칠 수 있는 긴급 표시예요.", "응답 시한 임박"],
            ["상담이 멈춘 회원", stallN, 9, "14일 이상 다음 행동이 없는 회원이에요 — 재개 대본(「한동안 챙겨드리지 못해서요」)으로 다시 잇습니다.", "14일 이상 정체"]]],
          ["달력이 정한 일", [
            ["검진대비보험 만기 임박", matN, 0, "검진대비보험 만기가 20일 안으로 온 회원이에요 — D-20 종료 예고, D-7 보장맵 안내, 만기 당일 2차 골든타임 순서로 달력이 할 일을 정합니다.", "D-20 이내"],
            ["만기·재검진 안내 예정", expN, 3, "보장·서비스 만기와 재검진이 다가와 안내가 필요한 회원이에요.", "D-30 · D-7 순서"]]],
          ["지금 하면 안 되는 일", [
            ["검진결과 기다리는 중 — 연락 금지", heldN, 2, "검진 결과 수령 전이라 접촉이 금지된 회원이에요. 결과가 도착하면 하이가 자동으로 풀고 알려드립니다.", "락 · 자동 해제"]]]].map(([grp, items]) => (
            <div key={grp} className="hmnumgrp">
              <div className="hmnumgt">{grp === "지금 할 일" ? "🔔" : grp === "달력이 정한 일" ? "📅" : "🔒"} {grp}</div>
              <div className="hmnum">
                {items.map(([k, v, t, tip, sub]) => (
                  <div key={k} className={"n" + (grp === "지금 하면 안 되는 일" ? " hold" : "")} title={tip} onClick={() => setTab(t)}>
                    <b>{v}</b><span>{k}</span><em>{sub}</em>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,.13)", borderRadius: 10, padding: "8px 12px", fontSize: 12, lineHeight: 1.6 }}>
          <b>🤖 하이 브리핑</b> — {heldN ? `검진결과 대기 ${heldN}건은 지금 하면 안 되는 일이에요(자동 해제 예정). ` : ""}{stallN ? `정체 ${stallN}명이 오늘의 우선순위예요 — ⑨ 현황판에서 멈춘 단계를 확인하세요. ` : ""}{needN ? `터치 시점이 온 회원 ${needN}명이 있어요.` : "예정 터치가 없어요 — 고객 현황을 둘러보세요."}
        </div>
      </div>
      <div className="hmtabs">
        {TABS.map(([n, label, Ic, sub]) => <button key={n} className={"hmtab" + (tab === n ? " on" : "")} title={sub || ""} onClick={() => setTab(n)}><Ic size={13} /> {label}</button>)}
      </div>
      {/* 열려 있는 탭의 한 줄 설명 — 이름 옆이 아니라 아래 한 줄로(탭 줄이 길어지지 않게) */}
      {(() => { const cur = TABS.filter(([n]) => n === tab)[0]; return cur && cur[3] ? <div className="hmtabsub"><b>{cur[1]}</b> — {cur[3]}</div> : null; })()}
      <div style={{ marginTop: 12 }}>
        {tab === 0 && <HmTabToday code={code} cview={cview} onToast={(m2) => { setToastM(m2); setTimeout(() => setToastM(""), 3500); }} />}
        {tab === 1 && <HmTabSignals code={code} onContact={onContact} cview={cview} />}
        {tab === 2 && <HmTabIns code={code} pro={pro} onContact={onContact} refresh={refresh} cview={cview} onTab={setTab} />}
        {tab === 3 && <HmTabTouch code={code} onContact={onContact} cview={cview} onTab={setTab} />}
        {tab === 4 && <HmTabRisk code={code} cview={cview} />}
        {tab === 5 && <HmTabLife code={code} kind="shop" cview={cview} />}
        {tab === 6 && <HmTabLife code={code} kind="care" cview={cview} />}
        {tab === 7 && <HmTabUw code={code} cview={cview} />}
        {tab === 8 && <HmTabIdeas code={code} />}
        {tab === 9 && <HmTabBoard code={code} pro={pro} onContact={onContact} cview={cview} />}
      </div>
      <div className="hmfoot" style={{ textAlign: "center" }}>
        개인정보보호법 §17·§22②·§23·§24 · 신용정보법 §32 · 보험업법(설명의무·부당 권유 금지) · 정보통신망법 §50 —
        원본 건강수치·원가성 정보 비노출 · 진단·인수·등급 단정 금지 · 시연 환경 고지 — {selfN ? "본인 계정은 실측 데이터, " : ""}체험 회원 16명·코호트 10만 명은 시연 시드
        <div style={{ marginTop: 3 }}>이 콘솔에 표시되는 회원 이름은 <b>시연용 합성 데이터</b>예요{selfN ? "(본인 계정만 실측)" : ""} — 프로 전용 화면이라 가리지 않고 전체 이름으로 보여드려요. 회원이 보는 화면과 외부 전달물에는 마스킹 규칙이 그대로 적용돼요.</div>
      </div>
      <HiProDock />
      {/* 데모 대본(demoScript.js)이 아직 없는 탭(⑩)을 가리킬 수 있다 — 없는 번호는 ⓪로 되돌린다 */}
      <HmDemoGuide onTab={(t2) => setTab(TABS.filter(([n]) => n === t2).length ? t2 : 0)} />
      {toastM && <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: HM_C.ink, color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, zIndex: 1300, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>{toastM}</div>}
    </div>
  );
}
