/* ══════════ 하이 독(AgentDock) — 전 화면 상주 단일 AI 에이전트 미니챗 ══════════
   원칙: 쉬움(3문장+버튼≤3+화면카드), 동일 에이전트(하이), 화면 이동에도 대화 유지, 음성 입력·쉬운말 모드. */
function AgentDock({ onGo }) {
  const go = onGo || (() => {});
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);          // {who:'hi'|'me', lines:[], buttons:[], nav}
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [easy, setEasy] = useState(() => { try { return !!localStorage.getItem("hifin_easyread"); } catch (e) { return false; } });
  const endRef = useRef(null);
  const recogRef = useRef(null);
  const lastQRef = useRef("");
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  // AI 주치의 지식(KDCA·리포트·학습 Q&A) — 독을 처음 열 때 지연 로드(홈 초기 로딩 부담 없음)
  const kbRef = useRef({ kb: null, rp: null, qa: null });
  useEffect(() => {
    if (!open) return;
    try { if (typeof loadKdca === "function") loadKdca().then((d) => { kbRef.current.kb = d; }); } catch (e) {}
    try { if (typeof loadReport === "function") loadReport().then((d) => { kbRef.current.rp = d; }); } catch (e) {}
    try {
      if (typeof loadQA === "function" && typeof loadGuidelines === "function") Promise.all([loadGuidelines(), loadQA()]).then(([gl, qa]) => {
        if (!qa && !gl) return;
        kbRef.current.qa = { meta: { count: ((gl && gl.qa) ? gl.qa.length : 0) + ((qa && qa.qa) ? qa.qa.length : 0) }, qa: [...((gl && gl.qa) || []), ...((qa && qa.qa) || [])] };
      });
    } catch (e) {}
  }, [open]);

  // 첫 오픈 시 재접속 인사(기억 연속성)
  useEffect(() => {
    if (!open || msgs.length) return;
    try { const g = (typeof agentGreeting === "function") ? agentGreeting() : null; if (g) setMsgs([{ who: "hi", lines: [g.text], buttons: g.buttons || [], nav: null }]); } catch (e) {}
  }, [open]);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  // 홈 브리핑 등 외부에서 질문 주입(agentask 이벤트) — 이중 동선의 대화 진입점
  useEffect(() => {
    const h = (e) => { const q = e && e.detail; setOpen(true); if (q) setTimeout(() => send(q), 350); };
    window.addEventListener("agentask", h); return () => window.removeEventListener("agentask", h);
  });
  // 쉬운말 모드 클래스 유지
  useEffect(() => { try { document.body.classList.toggle("easyread", easy); } catch (e) {} }, [easy]);

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
      // Q&A·섹션가이드가 못 받은 질문은 AI 주치의 엔진(질환·증상·약물·리포트·검진해석)이 그대로 답변
      if (!res || !res.matched || res.matched === "graph") {
        let doc = null;
        try { const K = kbRef.current; doc = (typeof aiRespond === "function") ? aiRespond(text, K.kb, K.rp, K.qa) : null; } catch (e) { doc = null; }
        if (doc && doc.bubbles && doc.bubbles.length) {
          const first = doc.bubbles[0];
          const generic = first.kind !== "card" && /정보를 찾지 못했어요|이렇게 안내해 드릴 수 있어요/.test(first.text || "");
          if (!generic) {
            lastQRef.current = text;
            const lines = doc.bubbles.filter((b) => b.kind !== "card").map((b) => b.text).filter(Boolean);
            const cards = doc.bubbles.filter((b) => b.kind === "card" && b.card).map((b) => b.card);
            const btns = [...new Set([].concat(...cards.map((c) => c.buttons || [])).concat(doc.quicks || []))].slice(0, 4);
            setTyping(false);
            setMsgs((m) => [...m, { who: "hi", lines, cards, buttons: btns, nav: null }]);
            return;
          }
        }
      }
      setTyping(false);
      if (!res) { setMsgs((m) => [...m, { who: "hi", lines: ["잠시 문제가 있었어요 — 다시 한번 말씀해 주시겠어요?"], buttons: ["사람 상담 연결"], nav: null }]); return; }
      if (res.reset) { setMsgs([{ who: "hi", lines: res.lines, buttons: [], nav: null }]); return; }
      lastQRef.current = text;
      setMsgs((m) => [...m, { who: "hi", lines: res.lines, buttons: res.buttons || [], nav: res.nav || null }]);
    }, 480);
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
        </button>
      )}
      {open && (
        <div className="hidock">
          <div className="hidock-hd">
            <span className="hidock-av"><Bot size={16} /></span>
            <div className="hidock-t"><b>{typeof AGENT_PERSONA !== "undefined" ? AGENT_PERSONA.name : "하이"}</b><span>하이핀 AI 매니저 · 항상 함께해요</span></div>
            <button className={"hidock-ib" + (easy ? " on" : "")} title="쉬운 말 모드(큰 글씨)" onClick={() => setEasy((v) => !v)}>가나</button>
            <button className="hidock-ib" title="전체 화면 상담" onClick={() => { setOpen(false); go("agent"); }}><MonitorSmartphone size={15} /></button>
            <button className="hidock-ib" onClick={() => setOpen(false)} aria-label="닫기"><X size={16} /></button>
          </div>
          <div className="hidock-body">
            {msgs.map((m, i) => (
              <div key={i} className={"hidock-row " + m.who}>
                {m.who === "hi" && <span className="hidock-mini"><Bot size={13} /></span>}
                <div className="hidock-msg">
                  {m.lines.map((l, j) => <div className={"hidock-bub " + m.who} key={j}>{l}</div>)}
                  {m.cards && m.cards.map((c, ci) => (
                    <div className="hidock-card" key={"c" + ci}>
                      <b>{c.title}</b>
                      {(c.items || []).length > 0 && <ul>{c.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>}
                      {(c.buttons || []).length > 0 && <div className="hidock-btns">{c.buttons.map((b) => <button key={b} onClick={() => send(b)}>{b}</button>)}</div>}
                    </div>
                  ))}
                  {m.nav && <button className="hidock-nav" onClick={() => { go(m.nav.key); }}>📍 {m.nav.label} 화면 열기 <ChevronRight size={12} /></button>}
                  {m.buttons && m.buttons.length > 0 && <div className="hidock-btns">{m.buttons.map((b) => <button key={b} onClick={() => send(b)}>{b}</button>)}</div>}
                </div>
              </div>
            ))}
            {typing && <div className="hidock-row hi"><span className="hidock-mini"><Bot size={13} /></span><div className="hidock-bub hi hidock-typing"><span /><span /><span /></div></div>}
            <div ref={endRef} />
          </div>
          <div className="hidock-input">
            {sttOK && <button className={"hidock-mic" + (listening ? " on" : "")} onClick={startStt} title="음성으로 말하기"><Mic size={16} /></button>}
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={listening ? "듣고 있어요…" : "무엇이든 물어보세요 · 예) 내 건강검진 예약 알아봐줘"} />
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
