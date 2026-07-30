/* ══════════ 하이 독(AgentDock) — 전 화면 상주 단일 AI 에이전트 미니챗 ══════════
   원칙: 쉬움(3문장+버튼≤3+화면카드), 동일 에이전트(하이), 화면 이동에도 대화 유지, 음성 입력·쉬운말 모드. */
/* 자주 묻는 질문 칩 — 타이핑 없이 탭 한 번으로 상담 시작(인사말 버튼과 동일한 검증된 의도만 사용) */
const HIDOCK_QUICKS = ["검진예약 질문 도우미", "내 건강 봐줘", "보장 공백 분석", "검진결과 올리기", "쉬운 말 모드 켜기"];
/* 영문 모드 안내 — 하이 답변은 한국어 코퍼스(12,762문항) 기반이라 정적 번역 대상이 아니다.
   못 하는 것을 하는 척하지 않고, 하이가 무엇을 하는 에이전트인지 영문으로 정확히 알린 뒤
   한국어로 전환하거나 문의로 갈 길을 준다(프롬프트 3장 ①). */
function HiEnCard({ onGo, onClose }) {
  return (
    <div className="hidock-en">
      <b>{t("hi.en.title")}</b>
      <span className="only">{t("hi.en.only")}</span>
      <div className="does">{t("hi.en.does")}</div>
      <div>{t("hi.en.contact")}</div>
      <div className="does">{t("hi.en.switch")}</div>
      <div className="enbtns">
        <button onClick={() => { if (typeof hiSetLang === "function") hiSetLang("ko"); }}>{t("hi.en.btn.ko")}</button>
        <button className="ghost" onClick={() => { if (onClose) onClose(); if (onGo) onGo("partner"); }}>{t("hi.en.btn.partner")}</button>
      </div>
    </div>
  );
}

function AgentDock({ onGo }) {
  const go = onGo || (() => {});
  const lang = useHiLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);          // {who:'hi'|'me', lines:[], buttons:[], nav}
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [easy, setEasy] = useState(() => { try { return !!localStorage.getItem("hifin_easyread"); } catch (e) { return false; } });
  const endRef = useRef(null);
  const bodyRef = useRef(null);          // 대화 스크롤 영역
  const prevLenRef = useRef(0);          // 직전 메시지 수 — '새로 붙은 답변'을 찾는 기준
  const dockRef = useRef(null);
  const recogRef = useRef(null);
  const lastQRef = useRef("");
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  // AI 주치의 지식(KDCA·리포트·학습 Q&A) — 독을 처음 열 때 지연 로드(홈 초기 로딩 부담 없음)
  const kbRef = useRef({ kb: null, rp: null, qa: null });
  /* [Phase A] 지식은 A1(AI 주치의) 에이전트가 소유 — 로드되는 대로 에이전트에 주입한다 */
  const pushKB = () => { try { if (typeof hiDoctorSetKB === "function") hiDoctorSetKB(kbRef.current.kb, kbRef.current.rp, kbRef.current.qa); } catch (e) {} };
  useEffect(() => {
    if (!open) return;
    try { if (typeof loadKdca === "function") loadKdca().then((d) => { kbRef.current.kb = d; pushKB(); }); } catch (e) {}
    try { if (typeof loadReport === "function") loadReport().then((d) => { kbRef.current.rp = d; pushKB(); }); } catch (e) {}
    try {
      if (typeof loadQA === "function" && typeof loadGuidelines === "function") Promise.all([loadGuidelines(), loadQA()]).then(([gl, qa]) => {
        if (!qa && !gl) return;
        kbRef.current.qa = { meta: { count: ((gl && gl.qa) ? gl.qa.length : 0) + ((qa && qa.qa) ? qa.qa.length : 0) }, qa: [...((gl && gl.qa) || []), ...((qa && qa.qa) || [])] };
        pushKB();
      });
    } catch (e) {}
  }, [open]);

  // 선제 알림(Proactive) — 묻기 전에 하이가 먼저 챙긴다: FAB 배지 + 첫 오픈 시 우선 표시
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { try { setAlerts((typeof agentProactive === "function") ? agentProactive() : []); } catch (e) {} }, []);
  // 첫 오픈 시 재접속 인사(기억 연속성) + 선제 알림을 이어서 표시
  useEffect(() => {
    if (!open || msgs.length) return;
    try {
      const g = (typeof agentGreeting === "function") ? agentGreeting() : null;
      const first = [];
      if (g) first.push({ who: "hi", lines: [g.text], buttons: g.buttons || [], nav: null });
      (alerts || []).forEach((a) => first.push({ who: "hi", lines: ["🔔 " + a.text], buttons: a.buttons || [], nav: null }));
      if (first.length) setMsgs(first);
      if (alerts && alerts.length) setAlerts([]);   // 열어봤으면 배지 해제
    } catch (e) {}
  }, [open]);
  /* 스크롤 위치 — **답변의 처음**에 맞춘다.
     끝으로 보내면 긴 답변은 결론만 보이고 회원이 다시 위로 올려 처음을 찾아야 한다.
     그래서 이번에 새로 붙은 하이 답변의 **첫 줄**이 화면 위에 오도록 세운다.
     내가 보낸 말·타이핑 표시는 그대로 끝으로(방금 한 말이 보여야 하니까). */
  useEffect(() => {
    const body = bodyRef.current;
    const prev = prevLenRef.current;
    prevLenRef.current = msgs.length;
    if (body && msgs.length > prev) {
      let idx = -1;
      for (let i = prev; i < msgs.length; i++) { if (msgs[i] && msgs[i].who === "hi") { idx = i; break; } }
      if (idx >= 0) {
        const el = body.querySelector('[data-mi="' + idx + '"]');
        if (el) {
          const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
          try { body.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); } catch (e) { body.scrollTop = Math.max(0, top); }
          return;
        }
      }
    }
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);
  // 홈 브리핑 등 외부에서 질문 주입(agentask 이벤트) — 이중 동선의 대화 진입점
  useEffect(() => {
    const h = (e) => { const q = e && e.detail; setOpen(true); if (q) setTimeout(() => send(q), 350); };
    window.addEventListener("agentask", h); return () => window.removeEventListener("agentask", h);
  });
  // 쉬운말 모드 클래스 유지
  useEffect(() => { try { document.body.classList.toggle("easyread", easy); } catch (e) {} }, [easy]);
  // 모바일 사용성: 독이 열린 동안 배경 스크롤 잠금 + 키보드가 올라오면 visualViewport 높이에 맞춰
  // 독 높이를 보정(입력창·대화가 키보드에 가려지지 않게). 안드로이드는 뷰포트 메타(resizes-content)와 이중 안전망.
  useEffect(() => {
    if (!open) return;
    try { document.body.classList.add("hidock-open"); } catch (e) {}
    const vv = (typeof window !== "undefined") ? window.visualViewport : null;
    const fit = () => {
      const el = dockRef.current; if (!el) return;
      // 키보드가 실제로 올라온 경우(뷰포트가 120px 이상 줄어든 경우)에만 높이 보정 — 평소엔 CSS 100dvh 사용
      const kb = vv ? Math.max(0, window.innerHeight - vv.height) : 0;
      if (window.innerWidth <= 640 && vv && kb > 120) { el.style.height = Math.round(vv.height) + "px"; window.scrollTo(0, 0); }
      else el.style.height = "";
      try { if (endRef.current) endRef.current.scrollIntoView({ block: "end" }); } catch (e) {}
    };
    fit();
    if (vv) vv.addEventListener("resize", fit);
    window.addEventListener("resize", fit);
    return () => {
      try { document.body.classList.remove("hidock-open"); } catch (e) {}
      if (vv) vv.removeEventListener("resize", fit);
      window.removeEventListener("resize", fit);
      const el = dockRef.current; if (el) el.style.height = "";
    };
  }, [open]);

  const send = (textArg) => {
    const text = (textArg == null ? input : textArg).trim(); if (!text) return;
    if (text === "쉬운 말 모드 켜기") { setEasy(true); setMsgs((m) => [...m, { who: "hi", lines: ["쉬운 말 모드를 켰어요 — 글씨를 키우고 더 쉽게 설명할게요."], buttons: [], nav: null }]); return; }
    // AI 주치의식 액션 버튼(핸드오프·바로가기) — Chat과 동일하게 화면 이동으로 처리
    try {
      if (typeof ACTION_NAV !== "undefined" && ACTION_NAV[text]) { setOpen(false); go(ACTION_NAV[text]); return; }
      if (typeof INS_HANDOFF !== "undefined" && text === INS_HANDOFF) { try { window.__hifinInsAsk = { tab: "ai", q: lastQRef.current || "보장 공백 분석" }; } catch (e) {} setOpen(false); go("insurance"); return; }
      if (typeof DOCTOR_HANDOFF !== "undefined" && text === DOCTOR_HANDOFF) { try { _doctorSeed = lastQRef.current || null; _checkupTab = "doctor"; } catch (e) {} setOpen(false); go("checkup"); return; }
      if (typeof SHOP_SUPP_BTN !== "undefined" && text === SHOP_SUPP_BTN) { try { window._shopIntel = Object.assign({ kind: "supp" }, window._lastCareRec || {}); } catch (e) {} setOpen(false); go("shop"); return; }
      if (typeof SHOP_DEVICE_BTN !== "undefined" && text === SHOP_DEVICE_BTN) { try { window._shopGo = Object.assign({ cat: "device", brand: "GN바디닥터" }, window._lastCareRec || {}); window._shopIntel = null; } catch (e) {} setOpen(false); go("shop"); return; }
    } catch (e) {}
    setInput("");
    setMsgs((m) => [...m, { who: "me", lines: [text], buttons: [], nav: null }]);
    setTyping(true);
    setTimeout(() => {
      let res = null;
      try { res = (typeof agentAnswer === "function") ? agentAnswer(text) : null; } catch (e) { res = null; }
      // Q&A·섹션가이드가 못 받은 질문은 A1(AI 주치의)이 이어받는다 — 근거 인용(cite)과 담당 표기가 함께 온다
      if (!res || !res.matched || res.matched === "graph") {
        let a1 = null;
        try { a1 = (typeof aiDoctorAgent === "function") ? aiDoctorAgent(text, {}) : null; } catch (e) { a1 = null; }
        if (a1 && !a1.handback && a1.lines && a1.lines.length) {
          lastQRef.current = text;
          setTyping(false);
          setMsgs((m) => [...m, { who: "hi", agent: "A1", lines: a1.lines, cards: a1.cards || [], cite: a1.cite || [], buttons: (a1.buttons || []).slice(0, 4), nav: null }]);
          return;
        }
      }
      setTyping(false);
      if (!res) { setMsgs((m) => [...m, { who: "hi", lines: ["잠시 문제가 있었어요 — 다시 한번 말씀해 주시겠어요?"], buttons: ["사람 상담 연결"], nav: null }]); return; }
      if (res.reset) { setMsgs([{ who: "hi", lines: res.lines, buttons: [], nav: null }]); return; }
      lastQRef.current = text;
      /* [Phase A] 한 턴에 여러 에이전트가 말하면(인계 고지 → 전문 응답) 파트별 말풍선으로 나눠 렌더 */
      const tail = { buttons: res.buttons || [], nav: res.nav || null, preview: res.preview || null, followup: res.followup || null, routed: res.routed, pending: res.pending, routedLabel: res.routedLabel, doctor: !!res.doctor, q: text };
      if (res.parts && res.parts.length) {
        setMsgs((m) => [...m, ...res.parts.map((p, i) => Object.assign(
          { who: "hi", agent: p.agent, agents: res.agents || null, lines: p.lines, cite: p.cite || [], cards: p.cards || [], announce: !!p.announce },
          i === res.parts.length - 1 ? tail : { buttons: [] }))]);
      } else {
        setMsgs((m) => [...m, Object.assign({ who: "hi", agent: res.agent || "A0", agents: res.agents || null, lines: res.lines, cite: res.cite || [] }, tail)]);
      }
    }, 480);
  };
  /* [2단계] SARG 응답 칩 처리 — 알림 예약(followup 저장)·미리보기 열기는 대화 재질의 없이 즉시 실행 */
  const chipClick = (msg, b) => {
    if (msg.followup && (b === "알림 받기" || b === "알림 예약")) {
      let ok = false;
      try { const mm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; ok = (typeof hiFollowupSave === "function") ? hiFollowupSave(mm || { email: "self" }, msg.followup) : false; } catch (e) { ok = false; }
      setMsgs((mv) => [...mv, { who: "hi", lines: [ok ? "🔔 알림을 예약했어요 — 때가 되면 제가 먼저 말씀드릴게요." : "알림 예약이 잠시 안 됐어요 — 다시 한번 눌러주시겠어요?"], buttons: [], nav: null }]);
      return;
    }
    if (msg.preview && (b.indexOf("미리보기") >= 0 || /화면 열기$/.test(b))) {
      const key = msg.preview.nav || (msg.nav && msg.nav.key);
      if (key) { setOpen(false); go(key); return; }
    }
    send(b);
  };
  const startStt = () => {
    if (!sttOK) return;
    const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); recogRef.current = r;
    r.lang = "ko-KR"; r.interimResults = false; let fin = "";
    r.onstart = () => setListening(true);
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) fin += e.results[i][0].transcript; };
    r.onerror = () => setListening(false);
    r.onend = () => { setListening(false); if (fin.trim()) send(fin.trim()); };
    try { r.start(); } catch (e) { setListening(false); }
  };

  return (
    <>
      {!open && (
        <button className="hidock-fab" onClick={() => setOpen(true)} aria-label="하이에게 물어보기" title="하이 — 무엇이든 물어보세요">
          <span className="hidock-face"><Bot size={22} /></span>
          <span className="hidock-lbl">하이</span>
          {alerts.length > 0 && <span className="hidock-fabbdg">{alerts.length}</span>}
        </button>
      )}
      {open && (
        <div className="hidock" ref={dockRef}>
          <div className="hidock-hd">
            <span className="hidock-av"><Bot size={16} /></span>
            <div className="hidock-t"><b>{t("hi.name", (typeof AGENT_PERSONA !== "undefined" ? AGENT_PERSONA.name : "하이"))}</b><span>{t("hi.role")}</span></div>
            <button className={"hidock-ib" + (easy ? " on" : "")} title="쉬운 말 모드(큰 글씨)" onClick={() => setEasy((v) => !v)}>가나</button>
            <button className="hidock-ib" title="전체 화면 상담" onClick={() => { setOpen(false); go("agent"); }}><MonitorSmartphone size={15} /></button>
            <button className="hidock-ib" onClick={() => setOpen(false)} aria-label="닫기"><X size={16} /></button>
          </div>
          <div className="hidock-body" ref={bodyRef}>
            {lang === "en" && <HiEnCard onGo={go} onClose={() => setOpen(false)} />}
            {lang !== "en" && <>
            {msgs.map((m, i) => (
              <div key={i} data-mi={i} className={"hidock-row " + m.who}>
                {m.who === "hi" && (() => {
                  const A = (typeof hiAgent === "function") ? hiAgent(m.agent || "A0") : null;
                  return <span className={"hidock-mini" + (m.agent && m.agent !== "A0" ? " spec" : "")} title={A ? A.label : "하이"}>
                    {A && A.id !== "A0" ? <span className="hidock-emo">{A.avatar}</span> : <Bot size={13} />}</span>;
                })()}
                <div className="hidock-msg">
                  {/* [Phase E] 협주면 담당을 **모두** 표기한다 — 어느 말이 누구 말인지 회원이 알 수 있어야 한다(협주 헌법 ⑤) */}
                  {m.who === "hi" && m.agent && m.agent !== "A0" && (typeof hiAgent === "function") && (
                    <div className="hidock-who">
                      {(Array.isArray(m.agents) && m.agents.length > 1 ? m.agents : [m.agent])
                        .map((a) => `${hiAgent(a).avatar} ${hiAgent(a).badge}`).join(" + ")}
                      {Array.isArray(m.agents) && m.agents.length > 1 && <span className="hidock-ens">함께 답했어요</span>}
                    </div>
                  )}
                  {m.lines.map((l, j) => <div className={"hidock-bub " + m.who + (m.announce ? " announce" : "")} key={j}>{l}</div>)}
                  {m.cite && m.cite.length > 0 && (
                    <div className="hidock-cite">📚 근거 {m.cite.map((c, ci) => <span key={ci}>{c.source}{c.title ? ` · ${c.title}` : ""}</span>)}</div>
                  )}
                  {m.pending && m.routedLabel && <div className="hidock-pending">담당: {m.routedLabel}</div>}
                  {m.cards && m.cards.map((c, ci) => (
                    <div className="hidock-card" key={"c" + ci}>
                      <b>{c.title}</b>
                      {(c.items || []).length > 0 && <ul>{c.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>}
                      {(c.buttons || []).length > 0 && <div className="hidock-btns">{c.buttons.map((b) => <button key={b} onClick={() => send(b)}>{b}</button>)}</div>}
                    </div>
                  ))}
                  {m.preview && (
                    <div className="hidock-card hidock-preview" role="button" tabIndex={0} onClick={() => { const k = m.preview.nav || (m.nav && m.nav.key); if (k) { setOpen(false); go(k); } }}>
                      <b>🪟 {m.preview.title}</b>
                      <div className="hidock-prev-d">{m.preview.description}</div>
                      <div className="hidock-btns"><button onClick={(e) => { e.stopPropagation(); const k = m.preview.nav || (m.nav && m.nav.key); if (k) { setOpen(false); go(k); } }}>화면 미리보기 열기</button></div>
                    </div>
                  )}
                  {m.nav && !m.preview && <button className="hidock-nav" onClick={() => { setOpen(false); go(m.nav.key); }}>📍 {m.nav.label} 화면 열기 <ChevronRight size={12} /></button>}
                  {/* 검진결과·건강분석은 전담 에이전트가 이어서 본다 — 질문을 그대로 넘겨 다시 묻지 않게 한다 */}
                  {m.doctor && <button className="hidock-doc" onClick={() => { try { if (typeof _doctorSeed !== "undefined") _doctorSeed = m.q || lastQRef.current || null; } catch (e) {} setOpen(false); go("ai"); }}>🩺 하이-나의 주치의 연결 <ChevronRight size={12} /></button>}
                  {m.buttons && m.buttons.length > 0 && <div className="hidock-btns">{m.buttons.map((b) => <button key={b} onClick={() => chipClick(m, b)}>{b}</button>)}</div>}
                </div>
              </div>
            ))}
            {typing && <div className="hidock-row hi"><span className="hidock-mini"><Bot size={13} /></span><div className="hidock-bub hi hidock-typing"><span /><span /><span /></div></div>}
            </>}
            <div ref={endRef} />
          </div>
          {lang !== "en" && <div className="hidock-quick" role="group" aria-label="자주 묻는 질문 바로가기">
            {HIDOCK_QUICKS.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
          </div>}
          <div className="hidock-input">
            {sttOK && <button className={"hidock-mic" + (listening ? " on" : "")} onClick={startStt} title="음성으로 말하기"><Mic size={16} /></button>}
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} enterKeyHint="send"
              onFocus={() => { try { setTimeout(() => { if (endRef.current) endRef.current.scrollIntoView({ block: "end" }); }, 250); } catch (e) {} }}
              placeholder={listening ? "듣고 있어요…" : "무엇이든 물어보세요 · 예) 내 건강검진 예약 알아봐줘"} />
            <button className={"hidock-send" + (input.trim() ? " on" : "")} onClick={() => send()} aria-label="보내기"><Send size={15} /></button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── 홈 상단 '오늘의 브리핑' — 대화 우선 홈(이중 동선: 버튼이 곧 대화 진입) ── */
function AgentHomeBriefing() {
  let g = null; try { g = (typeof agentGreeting === "function") ? agentGreeting() : null; } catch (e) {}
  if (!g) return null;
  const ask = (q) => { try { window.dispatchEvent(new CustomEvent("agentask", { detail: q })); } catch (e) {} };
  return (
    <div className="hibrief">
      <span className="hibrief-av"><Bot size={20} /></span>
      <div className="hibrief-b">
        <div className="hibrief-t">{g.text}</div>
        <div className="hibrief-btns">{(g.buttons || []).slice(0, 3).map((b) => <button key={b} onClick={() => ask(b)}>{b}</button>)}
          <button className="ghost" onClick={() => ask("")}>직접 물어보기</button></div>
      </div>
    </div>
  );
}

/* ══════════ 하이 커버리지 콘솔(ADMIN·온톨로지) — 답변 성공률·미답변 로그·주간 학습 루프 ══════════ */
function AgentOpsConsole() {
  const [tick, setTick] = useState(0);
  const [pending, setPending] = useState(() => { try { return JSON.parse(localStorage.getItem("hifin_agent_pending") || "[]"); } catch (e) { return []; } });
  void tick;
  const cov = (typeof agentCoverage === "function") ? agentCoverage() : { total: 0, hit: 0 };
  const misses = (typeof agentMisses === "function") ? agentMisses() : [];
  const rate = cov.total ? Math.round(cov.hit / cov.total * 1000) / 10 : 0;
  const qnaN = (typeof AGENT_QNA !== "undefined") ? AGENT_QNA.filter((x) => x.p && x.p.length).length : 0;
  const patN = (typeof AGENT_QNA !== "undefined") ? AGENT_QNA.reduce((s, x) => s + ((x.p || []).length), 0) : 0;
  const lexN = (typeof HIFIN_LEXICON !== "undefined") ? HIFIN_LEXICON.reduce((s, x) => s + x[1].length, 0) : 0;
  const secN = (typeof AGENT_SEC_GUIDES !== "undefined") ? AGENT_SEC_GUIDES.length : 0;
  const runLoop = () => { try { const r = (typeof agentLearnLoop === "function") ? agentLearnLoop() : null; setPending((r && r.pending) || []); if (typeof toast === "function") toast(`주간 학습 루프 실행 — 미답변 ${misses.length}건에서 신규 Q&A 후보 ${(r && r.generated) || 0}건 생성(검수 대기)`); } catch (e) {} setTick((t) => t + 1); };
  const fmtT = (ts) => { try { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch (e) { return ""; } };
  return (
    <div className="hiops">
      <div className="hiops-hero"><Bot size={16} /> <b>하이 커버리지 콘솔</b><span>질문 이해율·미답변·학습 루프 운영</span></div>
      <div className="hiops-stats">
        <div className="hiops-stat"><b>{rate}%</b><span>답변 성공률 ({cov.hit.toLocaleString()}/{cov.total.toLocaleString()})</span></div>
        <div className="hiops-stat"><b>{qnaN}</b><span>등록 의도(Q&A)</span></div>
        <div className="hiops-stat"><b>{(patN + lexN).toLocaleString()}+</b><span>표현 커버(패턴+동의어)</span></div>
        <div className="hiops-stat"><b>{secN}</b><span>섹션 가이드</span></div>
      </div>
      {(() => { const r = (typeof hiUnansweredReport === "function") ? hiUnansweredReport(7) : null; if (!r || !r.total) return null; const L = { U1: "데이터없음", U2: "권한없음", U3: "미출시", U4: "전문영역", U5: "실시간외부", U6: "시스템", U7: "이해실패", OFFTOPIC: "오프토픽" }; return (
        <div className="hiops-sec" style={{ display: "block" }}>답변불가·오프토픽 주간 리포트 <span>(최근 7일 {r.total}건)</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{Object.entries(r.byType).map(([k, v]) => <span key={k} className="cbadge" style={{ background: "#FFF3E6", color: "#B45309" }}>{L[k] || k} {v}</span>)}</div>
        </div> ); })()}
      <div className="hiops-sec">미답변 로그 <span>({misses.length}건 · 최근순)</span>
        <button className="hiops-run" onClick={runLoop}><RefreshCw size={13} /> 주간 학습 루프 실행</button></div>
      <div className="hiops-list">{misses.slice(-10).reverse().map((m, i) => (
        <div className="hiops-row" key={i}><span className="hiops-t">{fmtT(m.ts)}</span><span className="hiops-q">"{m.q}"</span></div>
      ))}{!misses.length && <div className="hiops-row"><span className="hiops-q" style={{ color: "#94A3B8" }}>미답변 없음 — 커버리지 양호</span></div>}</div>
      {pending.length > 0 && (<>
        <div className="hiops-sec">신규 Q&A 후보 <span>(검수 대기 {pending.length}건 — 검수 후 뱅크 등록)</span></div>
        <div className="hiops-list">{pending.slice(0, 6).map((p, i) => (
          <div className="hiops-row" key={i}><span className="hiops-t">×{p.freq}</span><span className="hiops-q">{p.draft}</span></div>
        ))}</div>
      </>)}
      <div className="chnote" style={{ marginTop: 12 }}>※ <b>배포 표준 절차</b> — 새 기능·용어는 ①AGENT_QNA(의도·표준답변·툴) ②HIFIN_LEXICON(동의어) ③TOOL_RUN/AGENT_SEC_GUIDES(기능·가이드) 3층 등록 없이는 배포 불가. 미답변 상위 질문은 주간 배치로 신규 Q&A 생성·검수·반영합니다.</div>
    </div>
  );
}
