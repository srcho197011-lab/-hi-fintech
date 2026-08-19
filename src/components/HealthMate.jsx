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
      </div>
      <div className="hmcard" style={{ maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 13.5, marginBottom: 4 }}>프로 코드 인증</div>
        <div style={{ fontSize: 11.5, color: HM_C.mut, marginBottom: 9 }}>코드는 자격·권한·실적의 단일 키예요. 세션에만 보관되고 새로고침 시 재입력해요.</div>
        <div style={{ display: "flex", gap: 7 }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="HM-SN-26-014" style={{ flex: 1, border: `1.5px solid ${HM_C.line}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, letterSpacing: 1 }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <button className="hmbtn" onClick={() => submit()}>인증</button>
        </div>
        {err && <div style={{ color: HM_C.red, fontSize: 11.5, fontWeight: 700, marginTop: 7 }}>{err}</div>}
        <div style={{ marginTop: 11, fontSize: 11, color: HM_C.mut }}>시연 코드 바로 입장(담당 고객 수 순):</div>
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
function HmTabSignals({ code, onContact }) {
  const cards = hmSignals(code);
  const [openId, setOpenId] = React.useState(null);
  return (<div>
    <HmDbNote k="t1" />
    {!cards.length && <div className="hmrow" style={{ color: HM_C.mut }}>지금 접촉 근거가 있는 회원이 없어요 — 하이가 신호를 감지하면 여기에 카드가 생겨요(근거 없는 대상은 존재하지 않아요).</div>}
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

/* ② 보험 배정·대기(순번 배분 + 접촉 락) */
function HmTabIns({ code, pro, onContact, refresh }) {
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
            <button className="hmbtn gh" disabled={lk.locked} onClick={() => onContact(m, { key: "ins-video", tab: "②", label: "화상 상담", result: "상담확정" })}><Video size={12} /> 화상</button>
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
    <div style={{ fontWeight: 900, fontSize: 13, margin: "12px 0 7px", color: HM_C.mut }}>지역단 전체 배정 현황(참고) {others.length}건</div>
    {others.map((x) => row(x, false))}
  </div>);
}

/* ③ 검진 후 건강 터치 */
function HmTabTouch({ code, onContact }) {
  const members = hmScope(code);
  const rows = members.map((m) => ({ m, plan: hmTouchPlan(m) })).filter((x) => x.plan.items.length);
  return (<div>
    <HmDbNote k="t3" />
    <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg }}>
      <b style={{ fontSize: 12.5 }}>결합 원칙</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 3 }}>첫 연결은 <b style={{ color: HM_C.dark }}>결과분석 + 검진대비보험 안내를 한 번의 연락으로</b> — 두 번째 전화는 영업으로 읽혀요. 이후 터치는 조건 충족 회원에게만 생겨요.</div>
    </div>
    {!rows.length && <div className="hmrow" style={{ marginTop: 10, color: HM_C.mut }}>터치 예정 회원이 없어요 — 검진결과 수령(②탭) 후 자동으로 큐가 생겨요.</div>}
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
function HmTabRisk({ code }) {
  const members = hmScope(code).filter((m) => !hmLockState(m).locked);
  return (<div>
    <HmDbNote k="t4" />
    <div className="hmcard" style={{ marginTop: 0, background: "#FFF1F2", border: "1px solid #FECDD3" }}>
      <b style={{ fontSize: 12, color: HM_C.red }}>가드레일</b>
      <div style={{ fontSize: 11.6, color: HM_C.mut, lineHeight: 1.6, marginTop: 2 }}>예측을 보험 인수·요율·거절 사유로 쓰는 것은 금지돼요. 확률은 밴드(상·중·하)로만, 진단 단정 표현은 어디에도 없어요.</div>
    </div>
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
function HmTabLife({ code, kind }) {
  const members = hmScope(code).filter((m) => !hmLockState(m).locked);
  return (<div>
    <HmDbNote k={kind === "shop" ? "t5" : "t6"} />
    {kind === "care" && (
      <div className="hmcard" style={{ marginTop: 0, background: "#FEF2F2", border: "1px solid #FECACA" }}>
        <b style={{ fontSize: 12, color: HM_C.red }}>응급 우선 규칙</b>
        <div style={{ fontSize: 11.6, color: HM_C.mut, marginTop: 2, lineHeight: 1.6 }}>응급 징후 신호가 있으면 그 카드는 모든 카드보다 위에 고정되고, 문안은 상담이 아니라 <b style={{ color: HM_C.red }}>119·응급 안내가 먼저</b> 나가요.</div>
      </div>
    )}
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
function HmTabUw({ code }) {
  const members = hmScope(code).filter((m) => !hmLockState(m).locked);
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
          {members.map((x) => <option key={x.email} value={x.email}>{_hmMask(x.name)} · {_hmBand(x)} {x.sex}</option>)}
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
function HmTabBoard({ code, pro, onContact }) {
  const [view, setView] = React.useState("cust");
  const [stFilter, setStFilter] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const members = hmScope(code);
  const cards = members.map((m) => hmCustomerCard(m));
  const byStage = {}; HM_STAGES.forEach((s) => { byStage[s.k] = { n: 0, stall: 0 }; });
  cards.forEach((c) => { byStage[c.stage.cur].n++; if (c.stage.stalled) byStage[c.stage.cur].stall++; });
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
      <div style={{ fontSize: 10.8, color: HM_C.mut, margin: "6px 2px 10px" }}>D1~D4 데이터 생성 구간 │ L5~L8 가치 전환 구간 · 기본 정렬 = 정체 기간(방치된 사람 먼저) {stFilter && <button className="hmbtn gh" style={{ marginLeft: 6, padding: "2px 8px", fontSize: 10.5 }} onClick={() => setStFilter(null)}>필터 해제</button>}</div>
      {list.map((c, i) => (
        <div key={i} className={"hmrow" + (c.status.k === "HELD" ? " lock" : "")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontWeight: 900 }}>{c.mask} <span style={{ color: HM_C.mut, fontWeight: 600 }}>· {c.band} {c.m.sex} · {c.dan.replace("지역단", "")}</span>
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
      {!list.length && <div className="hmrow" style={{ color: HM_C.mut }}>이 필터에 해당하는 고객이 없어요.</div>}
    </div>)}
    {view === "stat" && (<div>
      <div className="hmcard" style={{ marginTop: 0, background: HM_C.bg }}>
        <b style={{ fontSize: 12.5 }}>실적의 정의 — 판매액이 아니라 「단계 전진 기여」</b>
        <div style={{ fontSize: 11.4, color: HM_C.mut, marginTop: 3 }}>금액이나 등수 매기기는 없어요. ② 순번 배분은 평가와 무관해요(공정성 고지).</div>
      </div>
      <div className="hmgrid2" style={{ marginTop: 10 }}>
        {[["담당 고객", stats.assigned + "명"], ["검진보험 순번 배정", stats.insAssigned + "건"], ["단계 전진(이번 주기)", stats.adv + "명"], ["건강 터치 누적", stats.touches + "회"], ["최근 7일 접촉 커버", stats.done7 + "명"], ["정체 회원(관리 대상)", stats.stalledN + "명"], ["첫 연결 완료율(락 해제 후)", stats.firstRate + "%"], ["접촉 락 준수", stats.lockOk ? "100% ✓" : `위반 시도 ${stats.viol}건`]].map(([k, v], i) => (
          <div key={i} style={{ border: "1px solid #F1F5F9", borderRadius: 11, padding: "10px 13px" }}>
            <div style={{ fontSize: 11, color: HM_C.mut, fontWeight: 700 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: k.indexOf("정체") >= 0 && stats.stalledN ? HM_C.stall : HM_C.dark }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="hmcard">
        <b style={{ fontSize: 12.3 }}>컴플라이언스 자가점검</b>
        <div style={{ fontSize: 11.8, color: HM_C.mut, marginTop: 5, lineHeight: 1.8 }}>
          ✓ 무동의 접촉 0건(생성 시점 배제 — leadDbAudit 원칙) · ✓ 월 접촉 한도 초과 0건(leadRouting 쿨다운 계승)<br />
          {stats.lockOk ? "✓" : "✗"} 접촉 락 위반 시도 {stats.viol}건 · ✓ 금칙어 발송 0건(발송 전 검사) · 내 조회 기록은 회원 금고 접근 로그에 전부 남아요
        </div>
      </div>
    </div>)}
  </div>);
}

/* ══ 메인 섹션 ══ */
function HealthMateSection({ onGo }) {
  const [code, setCode] = React.useState(() => { try { return sessionStorage.getItem("hifin_hm_code") || null; } catch (e) { return null; } });
  const [tab, setTab] = React.useState(9);
  const [tick, setTick] = React.useState(0);
  const [toastM, setToastM] = React.useState("");
  const refresh = () => setTick((t) => t + 1);
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
  /* Today 집계 */
  const members = hmScope(code);
  const cards = members.map((m) => hmCustomerCard(m));
  const needN = cards.filter((c) => c.status.k === "NEED").length;
  const heldN = hmInsQueue().filter((x) => x.code === code && hmLockState({ email: x.email }).locked).length;
  const stallN = cards.filter((c) => c.stage.stalled).length;
  const expN = cards.filter((c) => c.plan.items.some((x) => x.key.indexOf("m") === 0 && x.due && !x.done)).length;
  const slaN = hmSignals(code).filter((s) => s.sla <= 4).length;
  const TABS = [
    [1, "① 회원 신호", Users], [2, "② 보험 배정·대기", ShieldCheck], [3, "③ 검진 후 터치", HeartPulse],
    [4, "④ 질병 예측", Activity], [5, "⑤ 건강 행동", ShoppingCart], [6, "⑥ 가족·재가", HeartHandshake],
    [7, "⑦ 보장분석 대화", MessageSquare], [8, "⑧ 프로 제안함", Sparkles], [9, "⑨ 내 고객·실적", TrendingUp],
  ];
  return (
    <div className="hmwrap" key={tick}><HmStyle />
      <div className="hmhero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="k">HEALTHMATE PRO CONSOLE</div>
            <h2>{pro.name} 프로 <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .9 }}>· {pro.code} · {pro.dan} · {pro.grade}({pro.gradeKo}){pro.lic ? " · 모집자격 보유" : " · 안내 전용"}</span></h2>
            <div style={{ fontSize: 12, opacity: .92 }}>하이가 분석·선별·문안·타이밍을 만들고, 프로는 확인·접촉·기록합니다 — 동의의 범위가 곧 활동의 범위.</div>
          </div>
          <button className="hmbtn gh" style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.4)", color: "#fff" }} onClick={() => { try { sessionStorage.removeItem("hifin_hm_code"); } catch (e) {} setCode(null); }}>코드 잠금</button>
        </div>
        <div className="hmnum">
          {[["오늘 접촉할 회원", needN + slaN, 9], ["SLA 임박(4h)", slaN, 1], ["검진결과 대기(락)", heldN, 2], ["만기 예정 터치", expN, 3], ["정체 회원", stallN, 9]].map(([k, v, t], i) => (
            <div key={i} className="n" style={i === 2 ? { opacity: .75 } : null} onClick={() => setTab(t)}><b>{v}</b><span>{k}{i === 2 ? " 🔒" : ""}</span></div>
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
        {tab === 1 && <HmTabSignals code={code} onContact={onContact} />}
        {tab === 2 && <HmTabIns code={code} pro={pro} onContact={onContact} refresh={refresh} />}
        {tab === 3 && <HmTabTouch code={code} onContact={onContact} />}
        {tab === 4 && <HmTabRisk code={code} />}
        {tab === 5 && <HmTabLife code={code} kind="shop" />}
        {tab === 6 && <HmTabLife code={code} kind="care" />}
        {tab === 7 && <HmTabUw code={code} />}
        {tab === 8 && <HmTabIdeas code={code} />}
        {tab === 9 && <HmTabBoard code={code} pro={pro} onContact={onContact} />}
      </div>
      <div className="hmfoot" style={{ textAlign: "center" }}>
        개인정보보호법 §17·§22②·§23·§24 · 신용정보법 §32 · 보험업법(설명의무·부당 권유 금지) · 정보통신망법 §50 —
        원본 건강수치·원가성 정보 비노출 · 진단·인수·등급 단정 금지 · 시연 환경(체험 회원 시드) 고지
      </div>
      {toastM && <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: HM_C.ink, color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, zIndex: 1300, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>{toastM}</div>}
    </div>
  );
}
