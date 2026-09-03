/* ══════════════ 헬스메이트(프로) 센터 — Today + 9워크벤치 ══════════════
   설계서 v1.2 구현. 디자인: 현대해상 오렌지(HM_C) · 깔끔한 카드형.
   접근: 관리자 세션 + 프로 코드 게이트(2단계). 일반 회원 네비 미노출(isRestrictedSection). */

function HmStyle() {
  return (<style>{`
  .hmwrap{--hmo:${HM_C.pri};--hmod:${HM_C.dark};--hmbg:${HM_C.bg};--hmln:${HM_C.line};font-size:13px;color:${HM_C.ink}}
  .hmhero{background:linear-gradient(120deg,#B34E00,#F5821F 60%,#FFA94D);border-radius:16px;color:#fff;padding:18px 22px;position:relative;overflow:hidden}
  .hmhero .k{font-size:10.5px;letter-spacing:2.5px;opacity:.85;font-weight:800}
  .hmhero h2{margin:4px 0 2px;font-size:20px;font-weight:900}
  .hmcard{background:#fff;border:1px solid var(--hmln);border-radius:14px;padding:14px 16px;margin-top:10px}
  .hmtabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .hmtab{border:1.5px solid var(--hmln);background:#fff;border-radius:999px;padding:7px 13px;font-size:12.3px;font-weight:800;cursor:pointer;color:${HM_C.mut};display:flex;align-items:center;gap:5px}
  .hmtab.on{background:var(--hmo);border-color:var(--hmo);color:#fff}
  .hmnum{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px}
  .hmnum .n{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:9px 12px;cursor:pointer}
  .hmnum .n b{font-size:19px;display:block}
  .hmnum .n span{font-size:11px;opacity:.9}
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
  @media(max-width:900px){.hmnum{grid-template-columns:repeat(2,1fr)}.hmpipe{grid-template-columns:repeat(4,1fr)}.hmgrid2{grid-template-columns:1fr}}
  `}</style>);
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
  try { vg = vsGateOf(c.i, { hour: new Date().getHours() }); } catch (e) {}
  return (
    <div className={"hmrow" + (locked ? " lock" : "")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontWeight: 900 }}>
          {locked && <Lock size={12} color={HM_C.hold} style={{ verticalAlign: -2, marginRight: 3 }} />}
          {c.mask} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.sex} · {c.region ? c.region.sido + " " + c.region.sgg : "-"}</span>
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
          ? <button className="hmbtn gh" style={{ padding: "5px 11px", fontSize: 11 }} onClick={() => setVidOpen(true)}><Video size={11} /> 영상 상담 요청</button>
          : <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut, fontSize: 10.2 }} title={vg.why || ""}>📹 {vg.code === "consent" ? "영상 동의 없음" : vg.code === "lock" ? "접촉 락" : vg.code === "hour" ? "시간대 밖" : vg.code === "hold" ? "접촉 보류" : "요청 불가"}</span>}
        <span style={{ fontSize: 10.3, color: HM_C.mut }}>{locked ? "결과 수령 대기 — 시스템이 자동 해제" : "시연 기록(세션) — 새로고침 시 초기화"}</span>
      </div>
      {vidOpen && <HmVideoModal subject={c.i} name={c.mask} card={(() => { try { return buildHandoffCard(c.i, { v2: true }); } catch (e) { return null; } })()}
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

/* 프로 검색(700명) — 코드/이름/지점/시군구, 최대 8건 */
function HmProSearch({ onPick }) {
  const [q, setQ] = React.useState("");
  const all = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES;
  const hits = q.trim().length >= 2 ? all.filter((p) => [p.code, p.name, p.branch, p.sgg, p.dan].join("|").indexOf(q.trim()) >= 0).slice(0, 8) : [];
  return (<div style={{ marginTop: 6 }}>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 강남구 · 성남 · 김지원 · HM-SN" style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "8px 12px", fontSize: 12.5 }} />
    {hits.map((p) => (
      <div key={p.code} onClick={() => onPick(p.code)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F1F5F9", borderRadius: 9, padding: "7px 11px", marginTop: 5, cursor: "pointer", fontSize: 12 }}>
        <span><b>{p.name} 프로</b> <span style={{ color: HM_C.mut }}>· {p.code} · {p.branch}{p.sgg ? " · " + p.sgg : ""}</span></span>
        <span className="hmpill" style={{ background: p.status === "활성" ? "#F0FDF4" : "#FFF7ED", color: p.status === "활성" ? HM_C.ok : HM_C.warn }}>{p.status} · {p.grade}{p.lic ? " · 모집" : ""}</span>
      </div>
    ))}
    {q.trim().length >= 2 && !hits.length && <div style={{ fontSize: 11.3, color: HM_C.mut, marginTop: 5 }}>일치하는 프로가 없어요.</div>}
  </div>);
}

/* 코드 게이트 — 코드 입력 + 상태·자격 검증(세션 한정) */
function HmGate({ onPass }) {
  const [code, setCode] = React.useState("");
  const [err, setErr] = React.useState("");
  const submit = (c) => {
    const p = hmProOf((c || code).trim().toUpperCase());
    if (!p) { setErr("등록되지 않은 코드예요."); return; }
    if (p.status !== "활성") { setErr(`${p.status} 상태 코드예요 — 접근이 차단됩니다(담당 회원은 재배정 큐로 이동).`); return; }
    try { sessionStorage.setItem("hifin_hm_code", p.code); } catch (e) {}
    try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `프로 콘솔 접속 — ${p.code}(${p.dan})` }); } catch (e) {}
    onPass(p.code);
  };
  return (
    <div className="hmwrap"><HmStyle />
      <div className="hmhero">
        <div className="k">HEALTHMATE PRO CONSOLE</div>
        <h2>헬스메이트(프로) 센터</h2>
        <div style={{ fontSize: 12.5, opacity: .92 }}>코드가 부여된 전문헬스메이트 전용 콘솔 — 하이가 분석하고, 프로가 마무리합니다.</div>
        <div style={{ marginTop: 6, fontSize: 11.5, opacity: .85 }}>현대해상 설계사 <b>{(typeof hmProsGen === "function" ? hmProsGen().length : 10).toLocaleString()}명</b>을 하이핀 프로로 위촉 · 전국 시군구 배속(실사 지점 272개 기준) · 회원 10만 명 지역 매칭</div>
      </div>
      <div className="hmcard" style={{ maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 13.5, marginBottom: 4 }}>프로 코드 인증</div>
        <div style={{ fontSize: 11.5, color: HM_C.mut, marginBottom: 9 }}>코드는 자격·권한·실적의 단일 키예요. 이 탭 세션에만 보관되고, 탭을 닫거나 [코드 잠금]을 누르면 즉시 잠겨요.</div>
        <div style={{ display: "flex", gap: 7 }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="HM-SN-26-014" style={{ flex: 1, border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, letterSpacing: 1 }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <button className="hmbtn" onClick={() => submit()}>인증</button>
        </div>
        {err && <div style={{ color: HM_C.red, fontSize: 11.5, fontWeight: 700, marginTop: 7 }}>{err}</div>}
        <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 800, color: HM_C.deep }}>프로 검색 — 코드·이름·지점·시군구</div>
        <HmProSearch onPick={(c) => submit(c)} />
        <div style={{ marginTop: 11, fontSize: 11, color: HM_C.mut }}>체험 회원 상호작용 시연(담당 체험 회원 보유 프로):</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
          {HM_CODES.filter((p) => p.status === "활성").map((p) => ({ p, n: hmScope(p.code).length })).sort((a, b) => b.n - a.n).slice(0, 5).map(({ p, n }) => (
            <button key={p.code} className="hmbtn gh" style={{ fontSize: 11 }} onClick={() => submit(p.code)}>{p.name} 프로 · {p.dan.replace("지역단", "")} <b style={{ color: HM_C.pri }}>{n}명</b></button>
          ))}
          <button className="hmbtn gh" style={{ fontSize: 11, opacity: .6 }} onClick={() => submit("HM-WD-26-002")}>임다혜 프로(정지 코드 시연)</button>
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
            {c.mask} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.m.sex} · {hmDanOf(c.m)}</span>
            <span className="hmpill" style={{ marginLeft: 7, background: c.direct ? "#F0FDF4" : "#EFF6FF", color: c.direct ? HM_C.ok : HM_C.blue }}>{c.direct ? "요청" : "AI 선별"}</span>
            <span className="hmpill" style={{ marginLeft: 4, background: HM_C.bg, color: HM_C.dark }}>{c.typeKo}</span>
            <span className="hmpill" style={{ marginLeft: 4, background: "#F8FAFC", color: HM_C.mut }}>{c.tier} · SLA {c.sla}h · {c.stage}</span>
          </div>
          <button className="hmbtn gh" onClick={() => setOpenId(openId === i ? null : i)}>{openId === i ? "접기" : "근거·문안"}</button>
        </div>
        {openId === i && (<div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: HM_C.deep }}>하이의 근거</div>
          {c.why.map((w, j) => <div key={j} style={{ fontSize: 11.8, color: HM_C.mut, lineHeight: 1.6 }}>· {w[0]} <b style={{ color: HM_C.dark }}>{w[1]}</b></div>)}
          <div className="hmhi"><Bot size={12} style={{ verticalAlign: -2 }} /> 권장 첫 마디 — "{c.mask}님, {c.typeKo} 관련해서 확인해 드릴 게 있어 연락드렸어요. 지금 2분 괜찮으세요?"</div>
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
    try { const r = vsRequest(subject, { hour: new Date().getHours() });
      if (!r.ok) { setErr(r.why); setStage("blocked"); } else setSess(r.sess); } catch (e) { setErr(String(e)); setStage("blocked"); }
  }, []);

  const accept = () => { try { vsAccept(sess); setMode(sess.mode || "voice"); setStage("call"); } catch (e) {} };
  const decline = () => { try { vsDecline(sess); } catch (e) {} onDone({ result: "사양", state: "declined" }); onClose(); };
  const setM = (k) => { const r = vsSetMode(sess, k, "member"); if (r.ok) { setMode(r.mode); setDegraded(false); } else setErr(r.why); };
  const degrade = () => { const r = vsDegrade(sess); if (r.ok) { setMode(r.mode); setDegraded(true); } };
  const share = (k) => {
    const r = vsShareDoc(sess, k, subject, { hour: new Date().getHours() });
    if (!r.ok) { setErr(r.why); return; }
    setErr(""); setShared((a2) => a2.concat(k));
  };
  const end = () => { try { vsEnd(sess); setStage("sum"); } catch (e) {} };
  const confirm = () => {
    const r = vsSummarize(sess, note, true);
    if (!r.ok) { setErr(r.why); return; }
    onDone({ result: "상담완료", state: "summarized", summary: note, mode: mode, shared: shared.slice() });
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
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 9, textAlign: "center" }}>사양하셔도 상담 내용과 다음 절차는 그대로예요 — 전화로 안내드려요.</div>
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
                try { g = vsShareGate(k, subject, { hour: new Date().getHours() }); } catch (e) {}
                const on = shared.indexOf(k) >= 0;
                return g.ok
                  ? <button key={k} className={"hmbtn" + (on ? "" : " gh")} style={{ fontSize: 10.5, padding: "4px 10px" }} title={d.what} onClick={() => share(k)}>{on ? "✓ " : ""}{d.ko}</button>
                  : <span key={k} className="hmpill" style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: 10.2 }} title={g.why}>🔒 {d.ko}</span>;
              })}
            </div>
            {shared.length > 0 && <div style={{ fontSize: 10.3, color: "#15803D", marginTop: 6 }}>띄운 화면 {shared.length}개 — 요약에 함께 기록돼요</div>}
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
        <textarea value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} rows={4} placeholder="예) 결과에서 확인이 필요한 구간을 설명드렸고, 진료 연결을 안내했어요."
          style={{ width: "100%", marginTop: 10, borderRadius: 10, border: "1px solid #CBD5E1", padding: "9px 11px", fontSize: 12.2, lineHeight: 1.7, fontFamily: "inherit", resize: "vertical" }} />
        {err && <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 6 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="hmbtn" onClick={confirm}>회원 확인 완료 — 기록 저장</button>
          <button className="hmbtn gh" onClick={onClose}>닫기(미저장)</button>
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>요약이 비어 있거나 단정·과장 표현이 있으면 저장되지 않아요.</div>
      </div></>)}

    {stage === "done" && (<div style={{ padding: "26px 20px", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#15803D" }}>✅ 상담 요약이 저장됐어요</div>)}
  </div></div>);
}

/* ② 보험 배정·대기(순번 배분 + 접촉 락) */
function HmTabIns({ code, pro, onContact, refresh, cview }) {
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
            {_hmMask(m.name)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex} · 가입 {_hmDay(x.at)}</span>
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
              try { g = vsGateOf(m, { hour: new Date().getHours() }); } catch (e) {}
              if (!g.ok) return <span className="hmpill" style={{ background: "#F8FAFC", color: HM_C.mut, fontSize: 10.4 }} title={g.why}>📹 영상 상담 불가 · {g.code === "consent" ? "동의 없음" : g.code === "lock" ? "접촉 락" : g.code === "hour" ? "시간대" : g.code === "hold" ? "접촉 보류" : g.code}</span>;
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
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 3 }}>검진대비보험 건은 성과가 아니라 <b style={{ color: HM_C.dark }}>지역단 순서</b>로 나눠요(모집자격 보유 프로만). 순번은 평가와 무관해요. {pro.lic ? "" : "— 현재 코드는 모집자격 미보유라 안내 발송까지만 가능해요."}</div>
    </div>
    <div style={{ fontWeight: 900, fontSize: 13, margin: "12px 0 7px" }}>내 배정 {mine.length}건</div>
    {mine.length ? mine.map((x) => row(x, true)) : <div className="hmrow" style={{ color: HM_C.mut }}>이번 순번 배정이 없어요 — 다음 회차에 자동 배정돼요.</div>}
    {cview && <HmCohortList title="② 검진 전 대기(락) — 배정 완료·접촉 금지" ids={cview.held} code={code} compact />}
    {cview && <HmCohortList title="② 결과 수령 — 첫 연결 대기(READY)" ids={cview.ready} code={code} compact />}
    <div style={{ fontWeight: 900, fontSize: 13, margin: "12px 0 7px", color: HM_C.mut }}>지역단 전체 배정 현황(참고) {others.length}건</div>
    {others.map((x) => row(x, false))}
    {vidFor && <HmVideoModal subject={vidFor} name={_hmMask(vidFor.name)} card={(() => { try { return hmCustomerCard(vidFor); } catch (e) { return null; } })()}
      onClose={() => setVidFor(null)}
      onDone={(r) => { onContact(vidFor, { key: "ins-video", tab: "②", label: "영상 상담" + (r.mode ? "(" + (r.mode === "video" ? "영상" : r.mode === "voice" ? "음성" : "문자") + ")" : ""), result: r.result, note: r.summary || "" }); }} />}
  </div>);
}

/* ③ 검진 후 건강 터치 */
function HmTabTouch({ code, onContact, cview }) {
  const members = hmScope(code);
  const rows = members.map((m) => ({ m, plan: hmTouchPlan(m) })).filter((x) => x.plan.items.length);
  return (<div>
    <HmDbNote k="t3" />
    <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg }}>
      <b style={{ fontSize: 12.5 }}>결합 원칙</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 3 }}>첫 연결은 <b style={{ color: HM_C.dark }}>결과분석 + 검진대비보험 안내를 한 번의 연락으로</b> — 두 번째 전화는 영업으로 읽혀요. 이후 터치는 조건 충족 회원에게만 생겨요.</div>
    </div>
    {cview && <HmCohortList title="③ 결합 패키지 대기 — 결과분석+보장 안내(1회 통합)" ids={cview.ready} code={code} />}
    {!rows.length && !(cview && cview.ready.length) && <div className="hmrow" style={{ marginTop: 10, color: HM_C.mut }}>터치 예정 회원이 없어요 — 검진결과 수령(②탭) 후 자동으로 큐가 생겨요.</div>}
    {rows.map(({ m, plan }, i) => (
      <div key={i} className="hmrow" style={{ marginTop: i === 0 ? 10 : 0 }}>
        <div style={{ fontWeight: 900 }}>{_hmMask(m.name)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span> {plan.endSrc && <span className="hmpill" style={{ marginLeft: 6, background: "#F8FAFC", color: HM_C.mut }}>만기 계산: {plan.endSrc}</span>}</div>
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
          <b>{_hmMask(m.name)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span></b>
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
    {cview && <HmCohortList title={kind === "shop" ? "⑤ 행동·재구매 시점 회원" : "⑥ 가구·돌봄 신호 회원"} ids={kind === "shop" ? cview.shop : cview.family} code={code} compact />}
    {members.map((m, i) => {
      const adh = _hmLs("hifin_adh_" + m.email, {});
      const famRaw = localStorage.getItem("hifin_family_" + m.email);
      const fam = famRaw ? JSON.parse(famRaw) : null;
      const pts = m.managementPoints || [];
      return (<div key={i} className="hmrow" style={{ marginTop: i === 0 ? 10 : 0 }}>
        <b>{_hmMask(m.name)} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {_hmBand(m)} {m.sex}</span></b>
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
          {members.map((x) => <option key={x.email} value={x.email}>{_hmMask(x.name)} · {_hmBand(x)} {x.sex}{x._cohort ? " · 코호트" : " · 체험"}</option>)}
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
            <div style={{ fontWeight: 900 }}>{c.mask} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.m.sex} · {c.dan.replace("지역단", "")}</span>
              <span className="hmpill" style={{ marginLeft: 6, background: "#EFF6FF", color: HM_C.blue }}>체험</span>
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
              다음 터치 {c.next ? _hmDay(c.next.when) : c.dueNow ? "지금" : "예정 없음"}{c.plan.endSrc ? " · 만기 관리 중" : ""}
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
      {!list.length && <div className="hmrow" style={{ color: HM_C.mut }}>이 필터에 해당하는 체험 고객이 없어요.</div>}
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
        <b style={{ fontSize: 15.5, color: HM_C.ink }}>{card.member.mask}님 통화, 어떻게 됐어요?</b>
        <span style={{ fontSize: 10.5, color: HM_C.mut, marginLeft: "auto" }}>탭 한 번이면 끝나요 · [예시·시연]</span>
        <button onClick={onClose} aria-label="닫기" style={{ flex: "none", width: 30, height: 30, borderRadius: 15, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontSize: 14, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {HM_RESULT_CODES.map((rc) => (
          <button key={rc.k} onClick={() => setResult(rc.k)} style={{ display: "flex", alignItems: "center", gap: 7, textAlign: "left", cursor: "pointer",
            border: result === rc.k ? "2px solid " + HM_C.brand : "1px solid #E2E8F0", background: result === rc.k ? "#FFF4E8" : "#fff", borderRadius: 10, padding: "9px 10px" }}>
            <span style={{ fontSize: 16 }}>{rc.icon}</span>
            <span style={{ flex: 1 }}><b style={{ fontSize: 12.6, color: HM_C.ink }}>{rc.ko}</b><span style={{ display: "block", fontSize: 10, color: "#94A3B8" }}>{rc.desc}</span></span>
          </button>))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118, paddingTop: 3 }}>어떤 말이 통했어요?</b>
        <div style={{ flex: 1, display: "flex", gap: 5, flexWrap: "wrap" }}>
          {branches.map((b2, n) => <span key={b2.id} onClick={() => setBranch(branch === n + 1 ? null : n + 1)} className="hmpill" style={{ cursor: "pointer", border: branch === n + 1 ? "1.5px solid " + HM_C.brand : "1px solid #CBD5E1", background: branch === n + 1 ? "#FFF4E8" : "#fff", color: branch === n + 1 ? "#C2410C" : "#334155" }}>응대 {n + 1} · {brKo(b2)}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118 }}>다시 연락할 날</b>
        {FOLLOWS.map(([ko, d]) => <span key={ko} onClick={() => setFollow(d)} className="hmpill" style={{ cursor: "pointer", border: follow === d ? "1.5px solid " + HM_C.brand : "1px solid #CBD5E1", background: follow === d ? "#FFF4E8" : "#fff", color: d == null && follow === null ? "#94A3B8" : (follow === d ? "#C2410C" : "#334155") }}>{ko}</span>)}
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
        <div style={{ fontSize: 10, color: "#B45309", marginTop: 5 }}>체크는 ⑩ 관제탑 「골든타임 전달률」에 집계돼요 — 5칸 다 전하는 게 목표예요.</div>
      </div>)}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <b style={{ fontSize: 11.6, color: "#475569", width: 118, flex: "none" }}>간단 메모</b>
        <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={120} placeholder="필요할 때만 한 줄 — 예: 다음엔 오후에 통화 원하심"
          style={{ flex: 1, border: "1px solid #CBD5E1", borderRadius: 9, padding: "8px 11px", fontSize: 12.2, color: "#334155" }} />
      </div>
      <button onClick={save} disabled={!result} style={{ width: "100%", marginTop: 12, background: result ? HM_C.brand : "#E2E8F0", border: "none", color: "#fff", borderRadius: 11, padding: "12px", fontSize: 14.5, fontWeight: 900, cursor: result ? "pointer" : "default" }}>저장하기</button>
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
          {c.member.mask} <span style={{ color: HM_C.mut, fontWeight: 600, fontSize: 12 }}>· {c.member.ageBand} {c.member.sex} · {c.member.region}</span>
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
        <b style={{ color: g.c, cursor: "help" }} title="카드 발행 후 이 시간 안에 첫 접촉이 이뤄져야 해요 — 회원의 위험 등급이 시한을 정해요. 넘기면 「응답 시한 임박」 칸과 ⑩관제탑 준수율 집계에 잡혀요.">⏱ {c.timing.sla}</b>
        <span style={{ cursor: "help" }} title="통화만 하면 '접촉'이에요 — 1순위 개입이 실제 행동(예약·등록 등 데이터)으로 이어져야 '완결'로 집계돼요. (등재 대기)는 그 행동을 자동으로 잡을 데이터가 아직 공식 등재 전이라 접촉 기록으로 임시 대체 중이라는 정직한 표시예요.">완결 = {c.actions[0] ? c.actions[0].evNote.split("—")[0].split("[")[0].trim() : "-"}</span>
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
/* ══ D1~L8 단계 가이드 — 클릭하면 상세설명 + 관할 실사례(P6+, 형 지시 2026-08-30) ══ */
function HmStageGuide({ code, cview }) {
  const [sel, setSel] = React.useState(null);
  const byStage = (cview && cview.byStage) || {};
  const st = sel ? HM_STAGES.find((s) => s.k === sel) : null;
  const gd = sel ? HM_STAGE_GUIDE[sel] : null;
  /* 관할 실사례 — 그 단계 회원 최대 2명(가명·상태·하이 코멘트) */
  const live = React.useMemo(() => {
    if (!sel) return [];
    return ((byStage[sel] || []).slice(0, 2)).map((i) => { try { return cohortCardOf(i); } catch (e) { return null; } }).filter(Boolean);
  }, [sel, code]);
  return (<div className="hmcard" style={{ marginTop: 10, padding: "11px 13px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 12.6, fontWeight: 900, color: HM_C.ink }}>🧭 회원 여정 D1~L8 <span style={{ fontSize: 11, color: HM_C.mut, fontWeight: 600 }}>— 단계를 누르면 설명과 내 관할 실사례가 보여요</span></div>
      {sel && <button className="hmbtn gh" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => setSel(null)}>닫기 ✕</button>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 6, marginTop: 9 }}>
      {HM_STAGES.map((s) => { const n = (byStage[s.k] || []).length; const on = sel === s.k; const life = s.part === "LIFE";
        return (<button key={s.k} onClick={() => setSel(on ? null : s.k)} style={{
          border: on ? `2px solid ${life ? HM_C.brand : HM_C.ink}` : "1px solid #E2E8F0", cursor: "pointer",
          background: on ? (life ? "#FFF4E8" : "#EEF4FA") : "#fff", borderRadius: 10, padding: "7px 4px", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: life ? HM_C.brand : HM_C.ink }}>{s.k}</div>
          <div style={{ fontSize: 10.2, fontWeight: 700, color: "#475569" }}>{s.name}</div>
          <div style={{ fontSize: 9.6, color: HM_C.mut }}>{n}명</div>
        </button>); })}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.8, color: HM_C.mut, marginTop: 4 }}>
      <span>◀ 데이터 자산 4단(D — 확보→통합)</span><span>생애 확장 4단(L — 정기→평생주기) ▶</span>
    </div>
    {st && gd && (<div style={{ marginTop: 10, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: st.part === "LIFE" ? "linear-gradient(135deg,#F5821F,#E56B0F)" : "linear-gradient(135deg,#0B2239,#1B3E5F)", color: "#fff", padding: "9px 13px" }}>
        <b style={{ fontSize: 13.5 }}>{st.k} {st.name}</b> <span style={{ fontSize: 11.4, opacity: .9 }}>— {st.desc} · 내 관할 {((byStage[st.k] || []).length)}명</span>
      </div>
      <div style={{ padding: "10px 13px", fontSize: 12.2, lineHeight: 1.75 }}>
        {[["들어오는 조건", gd.entry], ["프로가 하는 일", gd.doKo], ["다음 단계로", gd.next]].map(([k, v]) => (
          <div key={k} style={{ marginBottom: 5 }}><span className="hmpill" style={{ background: "#F1F5F9", color: "#334155", marginRight: 7 }}>{k}</span>{v}</div>))}
        <div style={{ marginTop: 8, background: "#FFFBF5", border: "1px dashed #FED7AA", borderRadius: 9, padding: "7px 10px" }}>
          <b style={{ fontSize: 11.4, color: "#C2410C" }}>📖 사례 [예시·시연]</b>
          <div style={{ fontSize: 11.8, color: "#374151" }}>{gd.ex}</div>
        </div>
        {live.length > 0 && (<div style={{ marginTop: 7 }}>
          <b style={{ fontSize: 11.4, color: HM_C.ink }}>👥 내 관할 실사례</b>
          {live.map((c) => (<div key={c.i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#F8FAFC", borderRadius: 8, padding: "6px 9px", marginTop: 4, fontSize: 11.6 }}>
            <b>{_hmMask(c.m.name)}</b><span style={{ color: HM_C.mut }}>{_hmBand(c.m)} {c.m.sex}</span>
            <span className="hmpill" style={{ background: c.status.bg, color: c.status.c }}>{c.status.ko}</span>
            {c.stage.stalled && <span className="hmpill" style={{ background: "#FDECEC", color: "#B91C1C" }}>정체 {c.stage.stalledDays}일</span>}
            <span style={{ color: "#475569", flex: 1, minWidth: 180 }}>🤖 {c.hi}</span>
          </div>))}
        </div>)}
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
        <div style={{ fontWeight: 900, fontSize: 14.5, color: "#C2410C" }}>☀️ 오늘의 지시서 · {roster.list.length}건 <span style={{ fontSize: 11.4, color: HM_C.mut, fontWeight: 600 }}>· {today} · 시드=날짜+프로코드(같은 날 같은 카드) · [예시·시연 데이터]</span></div>
        <div style={{ fontSize: 11.6, color: "#475569" }}>{["H", "M", "L"].filter((k) => gr[k]).map((k) => `${k} ${gr[k]}건`).join(" · ") || "대상 없음"} · 관할 {roster.counts.managed}명(락 {roster.counts.locked} · 후보 {roster.counts.candidates})</div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11.6, color: HM_C.mut }}>하이가 등급·응답 시한·정체를 계산해 우선순위로 선별했어요 — 프로는 카드 순서대로 확인·접촉·기록만. 대본 없는 통화는 없어요(대본 보기 ▼).</div>
    </div>
    <HmStageGuide code={code} cview={cview} />
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

/* ① 배분 관제 + 지점 272 드릴다운(2단계 P3 · 형 승인) — 시도 클릭→지점 리스트→프로(사번·관할·오늘). 새 화면 이동 없이 아래 펼침(§D) */
function HmOpsAllocBlock({ S, sidos, maxSido, box, bt }) {
  const [sel, setSel] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [br, setBr] = React.useState(null);
  const BRS = (typeof HM_OPS_BRANCHES !== "undefined") ? HM_OPS_BRANCHES : [];
  const list = sel ? BRS.filter((b2) => b2.sido === sel && (!q || (b2.branch || "").indexOf(q) >= 0)) : [];
  return (<div style={box}><div style={bt}>① 배분 관제 — 시도를 누르면 지점이 펼쳐져요(실사 지점 기준)</div>
    {sidos.map(([s, n]) => (<div key={s} onClick={() => { setSel(sel === s ? null : s); setBr(null); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, cursor: "pointer", background: sel === s ? "#FFF4E8" : "transparent", borderRadius: 6, padding: "1px 4px" }}>
      <span style={{ width: 34, fontSize: 11, color: sel === s ? "#C2410C" : "#475569", fontWeight: 700 }}>{s}</span>
      <div style={{ flex: 1, height: 8, background: "#F1F5F9", borderRadius: 4 }}><div style={{ width: (n / maxSido * 100) + "%", height: 8, background: HM_C.brand, borderRadius: 4 }} /></div>
      <span style={{ width: 66, fontSize: 10.8, color: HM_C.mut, textAlign: "right" }}>{n.toLocaleString()}명 {sel === s ? "▲" : "▼"}</span></div>))}
    {sel && (<div style={{ marginTop: 8, borderTop: "1px dashed #E2E8F0", paddingTop: 8 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
        <b style={{ fontSize: 11.6, color: HM_C.ink }}>{sel} 지점 {list.length}곳</b>
        <input value={q} onChange={(e) => { setQ(e.target.value); setBr(null); }} placeholder="지점 이름 찾기" style={{ flex: 1, border: "1px solid #CBD5E1", borderRadius: 7, padding: "4px 9px", fontSize: 11 }} />
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxHeight: 96, overflowY: "auto" }}>
        {list.map((b2) => <span key={b2.branch} onClick={() => setBr(br === b2.branch ? null : b2.branch)} className="hmpill" style={{ cursor: "pointer", border: br === b2.branch ? "1.5px solid " + HM_C.brand : "1px solid #CBD5E1", background: br === b2.branch ? "#FFF4E8" : "#fff", color: br === b2.branch ? "#C2410C" : "#334155" }}>{b2.branch} <span style={{ color: "#94A3B8" }}>{b2.pros.length}</span></span>)}
      </div>
      {br && (() => { const b2 = list.find((x) => x.branch === br); if (!b2) return null; return (
        <div style={{ marginTop: 7, background: "#F8FAFC", borderRadius: 9, padding: "7px 10px" }}>
          {b2.pros.map((pr) => (<div key={pr.sabun} style={{ display: "flex", gap: 10, fontSize: 11.6, padding: "3px 0", borderBottom: "1px dashed #EEF2F6", alignItems: "center" }}>
            <b style={{ color: "#C2410C", width: 52 }}>{pr.sabun}</b><span style={{ width: 58, fontWeight: 700 }}>{pr.name} 프로</span>
            <span style={{ color: HM_C.mut }}>담당 {pr.managed}명 · 오늘 지시서 {pr.today}건</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8" }}>{pr.code}</span></div>))}
        </div>); })()}
      <div style={{ fontSize: 10.2, color: HM_C.mut, marginTop: 5 }}>배분 원천 = 시군구 실사 배속(수기 재배분 없음) · 수치는 배치 스냅샷({S.date})과 동일</div>
    </div>)}
  </div>);
}

/* ══ ⑩ 통합 운영 — 헬스메이트센터 관제탑(지시서 v1.3 §5-O · P5 신설, 관리자 전용 · 관측이지 조작이 아님) ══ */
function HmTabOps() {
  const admin = (typeof isAdminRole === "function") && isAdminRole();
  if (!admin) return <div className="hmcard">⑩ 통합 운영 관제탑은 운영 본부(관리자) 전용이에요 — 프로는 ⑨ 내 고객·실적에서 관할 현황을 봐요.</div>;
  const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const H = (typeof HM_HARNESS_SNAPSHOT !== "undefined") ? HM_HARNESS_SNAPSHOT : null;
  if (!S || !S.total) return <div className="hmcard">배치 스냅샷이 아직 없어요 — scripts/run_handoff_batch.mjs 실행 후 표시돼요.</div>;
  const ev = (typeof hiEventStats === "function") ? hiEventStats() : null;
  const sidos = Object.entries(S.bySido || {}).sort((a, b) => b[1] - a[1]);
  const maxSido = sidos.length ? sidos[0][1] : 1;
  const box = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" };
  const bt = { fontSize: 12.6, fontWeight: 900, color: HM_C.ink, marginBottom: 8 };
  return (<div>
    <div className="hmcard" style={{ background: "linear-gradient(135deg,#0B2239,#132F4C)", color: "#DCE7F2" }}>
      <div style={{ fontWeight: 900, fontSize: 14.5, color: "#FFB25E" }}>⑩ 통합 운영 관제탑 <span style={{ fontSize: 11.2, color: "#8FA9C0", fontWeight: 600 }}>· 배치 {S.date} · 러너 {S.seconds}s · 관측 전용(수기 재배분·등급 조정 없음) · [예시·시연 데이터]</span></div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8, fontSize: 12.4 }}>
        {[["코호트", S.total.toLocaleString() + "명"], ["카드 정의", S.cards.toLocaleString() + "건"], ["발행 가능", (S.publishable === S.cards ? "100%" : S.publishable.toLocaleString())], ["접촉 락", S.locked.toLocaleString() + "명"], ["활성 프로", S.pros + "명"], ["전원 조립 위반", S.rosterViol + "건"], ["일일 평균", S.avgRoster + "건(최대 " + S.maxRoster + ")"]].map(([k, v], i) => (
          <div key={i}><b style={{ fontSize: 15, color: "#fff" }}>{v}</b><div style={{ fontSize: 10.6, color: "#8FA9C0" }}>{k}</div></div>))}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 10, marginTop: 10 }}>
      <HmOpsAllocBlock S={S} sidos={sidos} maxSido={maxSido} box={box} bt={bt} />
      <div style={box}><div style={bt}>② 위험 분포 — 카드 대상 {S.cards.toLocaleString()}건</div>
        {["H", "M", "L"].map((k) => { const n = S.byGrade[k] || 0; const g = HM_GRADE_UI[k]; return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span className="hmpill" style={{ background: g.bg, color: g.c, width: 66, textAlign: "center" }}>{g.ko}</span>
            <div style={{ flex: 1, height: 10, background: "#F1F5F9", borderRadius: 5 }}><div style={{ width: (n / S.cards * 100) + "%", height: 10, background: g.c, borderRadius: 5 }} /></div>
            <span style={{ width: 74, fontSize: 11, color: "#475569", textAlign: "right" }}>{n.toLocaleString()} ({(n / S.cards * 100).toFixed(1)}%)</span></div>); })}
        <div style={{ fontSize: 10.8, color: HM_C.mut, marginTop: 5 }}>대상아님(관리 리듬 양호) {(S.byGrade["-"] || 0).toLocaleString()}명 · E(응급)는 트리아지 소유(카드 밖)</div>
      </div>
      <div style={box}><div style={bt}>③ 응답 시한(SLA) 관제 — 등급 → 티어(leadRouting 재사용)</div>
        {[["H", "48시간 안 응답(T2)", "#EA580C"], ["M", "7일 안 응답(T3)", "#D97706"], ["L", "14일 안 응답(T4)", "#0891B2"]].map(([k, t, cc]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed #EEF2F6", fontSize: 12 }}>
            <span><b style={{ color: cc }}>{k}</b> — {t}</span><span style={{ color: "#475569" }}>{(S.byGrade[k] || 0).toLocaleString()}건 · 재큐 D+7</span></div>))}
        <div style={{ fontSize: 10.8, color: HM_C.mut, marginTop: 5 }}>일일 로스터 등급 합계: {Object.entries(S.byRosterGrade || {}).map(([k, v]) => k + " " + v).join(" · ")}</div>
      </div>
      <div style={box}><div style={bt}>④ 완결 퍼널 — 지시 → 접촉 → 완결 <span className="hmpill" style={{ background: "#FEF3E2", color: "#B45309" }}>시연 분포</span></div>
        {ev && ev.total ? (<div>
          {[["지시서 발행", (ev.by || {}).handoff_issued || 0, "#0891B2"], ["접촉(원탭)", (ev.by || {}).handoff_contacted || 0, "#D97706"], ["완결 트랜잭션", ev.stage ? ev.stage[3] : 0, "#15803D"]].map(([k, v, cc], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{ width: 74, fontSize: 11, fontWeight: 700, color: "#475569" }}>{k}</span>
              <div style={{ flex: 1, height: 9, background: "#F1F5F9", borderRadius: 5 }}><div style={{ width: Math.min(100, v * 12) + "%", height: 9, background: cc, borderRadius: 5 }} /></div>
              <b style={{ width: 26, textAlign: "right", fontSize: 12 }}>{v}</b></div>))}
          <div style={{ fontSize: 10.6, color: HM_C.mut, marginTop: 4 }}>상세: {(ev.names || []).slice(0, 4).map((x) => x.ko + " " + x.n).join(" · ")}</div>
        </div>)
          : <div style={{ fontSize: 11.6, color: HM_C.mut }}>이번 세션 기록된 이벤트가 아직 없어요 — ⓪ 지시서 노출·원탭, 검진 예약 등 실제 행동 시 집계돼요(등재 이벤트만 · 가공 금지).</div>}
      </div>
      <div style={box}><div style={bt}>⑤ 프로 활동 — 부하·품질(판매액·수수료 지표 없음)</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.9 }}>
          전원 조립 검사 {S.rosterChecked}명 — 위반 {S.rosterViol}건 · 건수 상한 7 준수<br />
          일일 지시서 평균 {S.avgRoster}건 · 최대 {S.maxRoster}건 · 배분 원천 = 시군구 실사 배속(hmProsBySgg)<br />
          <span style={{ color: HM_C.mut, fontSize: 11 }}>개인 실적 상세는 각 프로의 ⑨ 현황판 — 관제탑은 구조 신호만 봅니다.</span>
        </div>
      </div>
      <div style={box}><div style={bt}>⑥ 하네스 상태 — 발행을 막는 구조</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="hmpill" style={{ background: S.pass ? "#E7F8EE" : "#FDECEC", color: S.pass ? "#15803D" : "#B91C1C" }}>배치 {S.pass ? "통과 ✓" : "차단 ✗"}</span>
          {H && <span className="hmpill" style={{ background: H.pass ? "#E7F8EE" : "#FDECEC", color: H.pass ? "#15803D" : "#B91C1C" }}>스크립트 하네스 {H.pass ? "통과 ✓" : "실패 ✗"}</span>}
          {H && <span className="hmpill" style={{ background: "#F1F5F9", color: "#475569" }}>A5 회귀 {H.coachAcc}%</span>}
          {H && <span className="hmpill" style={{ background: "#F1F5F9", color: "#475569" }}>금지어 {H.forbiddenHits}건 · 골든셋 드리프트 {H.goldenDrift}건</span>}
        </div>
        <div style={{ fontSize: 10.8, color: HM_C.mut, marginTop: 6 }}>하나라도 실패하면 그 날 지시서 미발행 + 적색 배지(§7). 집계 원천 = 배치 스냅샷 단일(운영 정합 §7-⑥).</div>
        {(typeof HM_WEEKLY_SNAPSHOT !== "undefined" && HM_WEEKLY_SNAPSHOT.week) && (
          <div style={{ marginTop: 7, borderTop: "1px dashed #E2E8F0", paddingTop: 6, fontSize: 11.4, color: "#475569", lineHeight: 1.7 }}>
            <b style={{ color: HM_C.ink }}>📚 주간 학습 루프({HM_WEEKLY_SNAPSHOT.week})</b> — 과다 사용 {HM_WEEKLY_SNAPSHOT.monotony.length}블록 · 미사용 승인 {HM_WEEKLY_SNAPSHOT.unused.length}블록 · 개선 후보 {HM_WEEKLY_SNAPSHOT.candidates.length}건
            <div style={{ fontSize: 10.4, color: HM_C.mut }}>문안 개선은 형 검수 후 hmScriptBlocks에만 반영 — 자동 반영 금지(학습 루프 규약)</div>
          </div>)}
      </div>
      {/* ⑦ 활동 결과 관제(2단계 P2) — 지시가 어떻게 끝났는지 · 기록이 다음 지시를 바꾼다 */}
      {(() => {
        const rs = (typeof hmrStats === "function") ? hmrStats(null) : null;
        const asked = ev && ev.by ? (ev.by.needs_asked || 0) : 0;
        const resulted = ev && ev.by ? (ev.by.handoff_resulted || 0) : 0;
        const contacted = ev && ev.by ? (ev.by.handoff_contacted || 0) : 0;
        const maxN = rs && rs.n ? Math.max.apply(null, rs.codes.map((c) => c.n).concat([1])) : 1;
        let topBranch = null;
        if (rs && Object.keys(rs.byBranch).length) { const bb = Object.entries(rs.byBranch).sort((a, b2) => b2[1] - a[1])[0]; topBranch = { no: bb[0], n: bb[1] }; }
        return (<div style={box}>
          <div style={bt}>⑦ 활동 결과 관제 — 지시가 어떻게 끝났나 <span className="hmpill" style={{ background: "#FEF3E2", color: "#B45309" }}>시연 분포</span></div>
          {rs && rs.n ? (<div>
            {rs.codes.map((c) => (<div key={c.k} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <span style={{ width: 92, fontSize: 11, fontWeight: 700, color: "#475569" }}>{c.icon} {c.ko}</span>
              <div style={{ flex: 1, height: 8, background: "#F1F5F9", borderRadius: 4 }}><div style={{ width: (c.n / maxN * 100) + "%", height: 8, background: HM_C.brand, borderRadius: 4 }} /></div>
              <b style={{ width: 24, textAlign: "right", fontSize: 11.5 }}>{c.n}</b></div>))}
            <div style={{ fontSize: 11.6, color: "#475569", lineHeight: 1.8, marginTop: 6 }}>
              기록 {rs.n}건 · 수락률 {rs.acceptRate != null ? rs.acceptRate + "%" : "-"} · 후속 약속 {rs.followUps}건<br />
              접촉 {contacted} → 결과 {resulted} → <b style={{ color: "#6D28D9" }}>회원이 먼저 물음 {asked}건</b>(두 곡선 교차)
              {topBranch && <span><br />가장 많이 쓴 말: <b>응대 {topBranch.no}</b>({topBranch.n}회)</span>}
            </div>
            <div style={{ fontSize: 10.4, color: HM_C.mut, marginTop: 4 }}>완결·거절(30일)·연락처 오류는 내일 명단에서 자동 제외 · 후속일이 온 회원은 맨 위로.</div>
          </div>) : (<div style={{ fontSize: 11.6, color: HM_C.mut }}>아직 기록된 결과가 없어요 — ⓪ 오늘의 지시서에서 통화 후 「결과 남기기」를 누르면 여기 쌓여요. 기록이 내일의 명단을 바꿉니다.</div>)}
          {/* ── ⭐ D2 골든타임(F3) — 전달률(실기록)·키트 교차(memberActivity 파생 — 가공 아님) ── */}
          {(() => {
            const gd = rs && rs.golden ? rs.golden : { rows: 0, full: 0, keys: [] };
            let kitY = { n: 0, act: 0 }, kitN = { n: 0, act: 0 };
            try {
              for (let i2 = 1; i2 <= 6000; i2 += 9) {
                const st = cohortStageOf(i2); if (!st || ["D1"].indexOf(st.cur) >= 0) continue;
                const ma = memberActivity(i2); if (!ma) continue;
                const hasDev = (ma.commerce || []).some((x) => x.kind === "device");
                const acts = (ma.visits || []).length + (ma.commerce || []).length;
                if (hasDev) { kitY.n++; kitY.act += acts; } else { kitN.n++; kitN.act += acts; }
              }
            } catch (e) {}
            const avg = (o) => o.n ? (o.act / o.n).toFixed(1) : "-";
            return (<div style={{ marginTop: 9, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "7px 10px" }}>
              <div style={{ fontSize: 11.4, fontWeight: 900, color: "#92400E" }}>⭐ D2 골든타임 — 첫 통화에서 다 전했나</div>
              <div style={{ fontSize: 11.4, color: "#78350F", lineHeight: 1.75, marginTop: 3 }}>
                전달 체크 기록 {gd.rows}건 · 5칸 완주 {gd.full}건{gd.rows ? " (" + Math.round(gd.full / gd.rows * 100) + "%)" : ""}
                {gd.rows > 0 && <span> · 항목별: {gd.keys.map((k) => k.ko.split("·")[0].trim() + " " + k.n).join(" / ")}</span>}
                {gd.rows === 0 && <span> — D2 카드의 「결과 남기기」에서 ⭐ 체크 5칸을 누르면 여기 집계돼요.</span>}<br />
                🧰 키트 효과(관측): 기기 사용 회원 평균 활동 <b>{avg(kitY)}건</b>({kitY.n.toLocaleString()}명) vs 미사용 <b>{avg(kitN)}건</b>({kitN.n.toLocaleString()}명) — 검진 결과 파생 시연 데이터, 실물 배송 런칭 시 kit_delivered·kit_engaged 실기록으로 대체.
              </div>
            </div>);
          })()}
          {/* ── ⑧ 60일 사이클 관제(R5) — 사이클 분포·T5 동의율 성적표·세그먼트·제공 DB 무결성 ── */}
          {(() => {
            const dist = {}, seg = {}; let n2Yes = 0, t5plus = 0, recov = 0, uncov = 0;
            try {
              for (let i = 1; i <= 12000; i += 3) {
                const cy = cycleOf(i); if (!cy || !cy.t) continue;
                dist[cy.t] = (dist[cy.t] || 0) + 1;
                if (["T5", "T6", "T7", "T8"].indexOf(cy.t) >= 0) { t5plus++; if (consentHas("n2", i)) n2Yes++; }
                if (cy.secondGolden) { uncov++; if (consentHas("n2", i)) recov++; }
                const g = gSegOf(i); if (g && g.top) seg[g.top] = (seg[g.top] || 0) + 1;
              }
            } catch (e) {}
            let feed = null; try { feed = hyFeedScan(300); } catch (e) {}
            const T = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
            const maxT = Math.max(1, ...T.map((t) => dist[t] || 0));
            const segTop = Object.keys(seg).sort((a, b2) => seg[b2] - seg[a]).slice(0, 6);
            return (<div style={{ marginTop: 9, background: "#F8FBFF", border: "1px solid #BFDBFE", borderRadius: 9, padding: "8px 11px" }}>
              <div style={{ fontSize: 11.4, fontWeight: 900, color: "#1D4ED8" }}>⏱ 60일 사이클 관제 <span style={{ fontWeight: 600, color: "#64748B", fontSize: 10.4 }}>· 표본 {Object.values(dist).reduce((a, b2) => a + b2, 0).toLocaleString()}명 · [예시·시연]</span></div>
              <div style={{ display: "flex", gap: 3, marginTop: 6, alignItems: "flex-end", height: 46 }}>
                {T.map((t) => (<div key={t} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: Math.round((dist[t] || 0) / maxT * 32) + 2, background: ["T2", "T5", "T6"].indexOf(t) >= 0 ? "#F5821F" : "#93C5FD", borderRadius: 3 }} />
                  <div style={{ fontSize: 9.4, color: "#475569", marginTop: 2 }}>{t}</div>
                  <div style={{ fontSize: 9, color: "#94A3B8" }}>{(dist[t] || 0).toLocaleString()}</div>
                </div>))}
              </div>
              <div style={{ fontSize: 11.4, color: "#334155", lineHeight: 1.75, marginTop: 5 }}>
                📋 <b>T5 동의율(60일마다 나오는 성적표)</b> — 만기 도달 {t5plus.toLocaleString()}명 중 안내 동의 <b style={{ color: "#1D4ED8" }}>{n2Yes.toLocaleString()}명({t5plus ? Math.round(n2Yes / t5plus * 100) : 0}%)</b> · 앞선 40일의 건강관리가 진짜였는지가 이 숫자로 나와요<br />
                🕐 <b>2차 골든타임 회복</b> — 무보장 {uncov.toLocaleString()}명 중 동의 보유 {recov.toLocaleString()}명({uncov ? Math.round(recov / uncov * 100) : 0}%)<br />
                🎯 <b>세그먼트 상위</b> — {segTop.map((g) => g + " " + seg[g].toLocaleString()).join(" · ") || "-"}<br />
                🔐 <b>현대해상 제공 DB</b> — 필드 {feed ? feed.fields : "-"}종 · 표본 {feed ? feed.n.toLocaleString() : "-"}건 검사 · 건강 상태 값 유입 <b style={{ color: feed && feed.ok ? "#15803D" : "#B91C1C" }}>{feed ? feed.bad.length : "?"}건</b>{feed && feed.ok ? " — 사전 밖 필드·등급·질환명 0(§0-V3 통과)" : ""}
              </div>
            </div>);
          })()}
        </div>);
      })()}
    </div>
  </div>);
}

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
  const [code, setCode] = React.useState(() => { try { return sessionStorage.getItem("hifin_hm_code") || null; } catch (e) { return null; } });
  const [tab, setTab] = React.useState(0);   /* P5: 프로의 아침은 오늘의 지시서에서 시작 */
  const [tick, setTick] = React.useState(0);
  const [toastM, setToastM] = React.useState("");
  const refresh = () => setTick((t) => t + 1);
  const cview = React.useMemo(() => (code && typeof hmcProView === "function") ? hmcProView(code) : null, [code]);
  if (!code) return <HmGate onPass={(c) => setCode(c)} />;
  const pro = hmProOf(code);
  if (!pro || pro.status !== "활성") { try { sessionStorage.removeItem("hifin_hm_code"); } catch (e) {} return <HmGate onPass={(c) => setCode(c)} />; }
  const onContact = (m, act) => {
    const r = hmAct(code, m, act);
    setToastM(r.ok ? `기록됐어요 — ${act.label}(${act.result || "연결됨"}) · 체인·금고 로그 저장` : r.reason);
    setTimeout(() => setToastM(""), 3500);
    refresh();
    return r;
  };
  /* Today 집계 — 체험(상호작용층) + 코호트(관측층) 합산 */
  const members = hmScope(code);
  const cards = members.map((m) => hmCustomerCard(m));
  const needN = cards.filter((c) => c.status.k === "NEED").length + (cview ? cview.signals.length : 0);
  const heldN = hmInsQueue().filter((x) => x.code === code && hmLockState({ email: x.email }).locked).length + (cview ? cview.held.length : 0);
  const stallN = cards.filter((c) => c.stage.stalled).length + (cview ? cview.stall.length : 0);
  const expN = cards.filter((c) => c.plan.items.some((x) => x.key.indexOf("m") === 0 && x.due && !x.done)).length + (cview ? cview.ready.length : 0);
  const slaN = hmSignals(code).filter((s) => s.sla <= 4).length + (cview ? cview.ids.filter((i) => { const g = cohortSignalOf(i); return g && g.sla <= 4; }).length : 0);
  /* R3 — 만기 임박(T4·T5): 검진대비보험 만기 D-20 이내 회원(달력 값이 정하는 오늘의 일) */
  const matN = cview ? cview.ids.filter((i) => { try { const cy = cycleOf(i); return cy && (cy.t === "T4" || cy.t === "T5" || cy.t === "T6"); } catch (e) { return false; } }).length : 0;
  const totalN = members.length + (cview ? cview.n : 0);
  const TABS = [
    [0, "⓪ 오늘의 지시서", Sparkles],
    [1, "① 회원 신호", Users], [2, "② 보험 배정·대기", ShieldCheck], [3, "③ 검진 후 터치", HeartPulse],
    [4, "④ 질병 예측", Activity], [5, "⑤ 건강 행동", ShoppingCart], [6, "⑥ 가족·재가", HeartHandshake],
    [7, "⑦ 치료비 보장 점검", MessageSquare], [8, "⑧ 프로 제안함", Sparkles], [9, "⑨ 내 고객·실적", TrendingUp],
    [10, "⑩ 통합 운영", Activity],
  ].filter(([n]) => n !== 10 || (typeof isAdminRole === "function" && isAdminRole()));   /* ⑩은 운영 본부 전용(§5-O) */
  return (
    <div className="hmwrap" key={tick}><HmStyle />
      <div className="hmhero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="k">HEALTHMATE PRO CONSOLE · 헬스케어 전문가(하이핀 프로)</div>
            <h2>{pro.name} 프로 <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .9, cursor: "help" }} title="프로 등급 4단계 — HM1 안내(기본 안내만) · HM2 상담(결과 해설·보장 상담) · HM3 설계·가족(심화 상담+가족 단위 확장) · HM4 지역리드(지역단 집계 관측 — 개인 상세는 못 봐요). 코드는 자격·권한·실적의 단일 키, '모집자격'은 보험 모집 라이선스 보유 표시예요.">· 사번 {pro.sabun || "-"} · {pro.code} · {pro.branch || pro.dan}{pro.sgg ? " · " + pro.sgg : ""} · {pro.grade}({pro.gradeKo}){pro.lic ? " · 모집자격" : " · 안내 전용"}{pro.hyundai ? " · 현대해상 위촉" : ""}</span></h2>
            <div style={{ fontSize: 12.3, fontWeight: 800, marginTop: 2 }}>담당 회원 {totalN.toLocaleString()}명 <span style={{ fontWeight: 600, opacity: .85 }}>(체험 {members.length} · 코호트 {(cview ? cview.n : 0).toLocaleString()}) — 관할: {(pro.coverage || []).slice(0, 5).join("·") || pro.dan}{(pro.coverage || []).length > 5 ? " 외 " + ((pro.coverage || []).length - 5) + "곳" : ""}{pro.gap ? " (겸임 포함)" : ""}</span></div>
            <div style={{ fontSize: 12, opacity: .92 }}>하이가 분석·선별·문안·타이밍을 만들고, 프로는 확인·접촉·기록합니다 — 동의의 범위가 곧 활동의 범위.</div>
          </div>
          <button className="hmbtn gh" style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.4)", color: "#fff" }} onClick={() => { try { sessionStorage.removeItem("hifin_hm_code"); } catch (e) {} setCode(null); }}>코드 잠금</button>
        </div>
        {/* 오늘의 숫자 5칸 — 호버 툴팁: 담당 전체를 나눈 분류가 아니라 '오늘 볼 것'만 걸러낸 렌즈(겹침 있음) */}
        <div className="hmnum">
          {[["오늘 접촉할 회원", needN + slaN, 9, "터치 시점이 온 회원 + 응답 시한 임박 회원 — 오늘 통화할 명단이에요. 담당 전체를 나눈 칸이 아니라 오늘 기준 렌즈라, 아래 칸들과 겹칠 수 있고 나머지 회원은 '오늘 조치 없음'이 정상이에요."],
            ["응답 시한 임박(4h)", slaN, 1, "응답 시한이 4시간 안으로 남은 카드예요 — 위 「오늘 접촉할 회원」에 이미 포함된 부분 표시예요."],
            ["검진결과 대기(락)", heldN, 2, "검진 결과 수령 전이라 접촉이 금지된 회원이에요 — 지금은 연락하지 않는 것이 일이에요. 결과가 도착하면 하이가 자동으로 해제하고 알려드려요."],
            ["만기 예정 터치", expN, 3, "보장·서비스 만기가 다가와 안내가 필요한 회원이에요 — 만기 D-30·D-7 순서로 정리해 드려요."],
            ["만기 임박(D-20)", matN, 0, "검진대비보험 만기가 20일 안으로 온 회원이에요 — D-20 보장 종료 예고, D-7 보장맵 안내(가장 중요한 30초), 만기 당일 2차 골든타임까지 달력이 오늘의 일을 정해요."],
            ["정체 회원", stallN, 9, "14일 이상 다음 행동이 멈춘 회원이에요 — 오늘의 우선순위로 올라오고, 재개 대본('한동안 챙겨드리지 못해서요')으로 다시 잇습니다."]].map(([k, v, t, tip], i) => (
            <div key={i} className="n" title={tip} style={i === 2 ? { opacity: .75, cursor: "help" } : { cursor: "help" }} onClick={() => setTab(t)}><b>{v}</b><span>{k}{i === 2 ? " 🔒" : ""}</span></div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,.13)", borderRadius: 10, padding: "8px 12px", fontSize: 12, lineHeight: 1.6 }}>
          <b>🤖 하이 브리핑</b> — {heldN ? `검진결과 대기 ${heldN}건은 지금 하면 안 되는 일이에요(자동 해제 예정). ` : ""}{stallN ? `정체 ${stallN}명이 오늘의 우선순위예요 — ⑨ 현황판에서 멈춘 단계를 확인하세요. ` : ""}{needN ? `터치 시점이 온 회원 ${needN}명이 있어요.` : "예정 터치가 없어요 — 고객 현황을 둘러보세요."}
        </div>
      </div>
      <div className="hmtabs">
        {TABS.map(([n, label, Ic]) => <button key={n} className={"hmtab" + (tab === n ? " on" : "")} onClick={() => setTab(n)}><Ic size={13} /> {label}</button>)}
      </div>
      <div style={{ marginTop: 12 }}>
        {tab === 0 && <HmTabToday code={code} cview={cview} onToast={(m2) => { setToastM(m2); setTimeout(() => setToastM(""), 3500); }} />}
        {tab === 10 && <HmTabOps />}
        {tab === 1 && <HmTabSignals code={code} onContact={onContact} cview={cview} />}
        {tab === 2 && <HmTabIns code={code} pro={pro} onContact={onContact} refresh={refresh} cview={cview} />}
        {tab === 3 && <HmTabTouch code={code} onContact={onContact} cview={cview} />}
        {tab === 4 && <HmTabRisk code={code} cview={cview} />}
        {tab === 5 && <HmTabLife code={code} kind="shop" cview={cview} />}
        {tab === 6 && <HmTabLife code={code} kind="care" cview={cview} />}
        {tab === 7 && <HmTabUw code={code} cview={cview} />}
        {tab === 8 && <HmTabIdeas code={code} />}
        {tab === 9 && <HmTabBoard code={code} pro={pro} onContact={onContact} cview={cview} />}
      </div>
      <div className="hmfoot" style={{ textAlign: "center" }}>
        개인정보보호법 §17·§22②·§23·§24 · 신용정보법 §32 · 보험업법(설명의무·부당 권유 금지) · 정보통신망법 §50 —
        원본 건강수치·원가성 정보 비노출 · 진단·인수·등급 단정 금지 · 시연 환경(체험 회원 시드) 고지
      </div>
      <HiProDock />
      <HmDemoGuide onTab={setTab} />
      {toastM && <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: HM_C.ink, color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, zIndex: 1300, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>{toastM}</div>}
    </div>
  );
}
