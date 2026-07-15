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
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

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
    setInput("");
    setMsgs((m) => [...m, { who: "me", lines: [text], buttons: [], nav: null }]);
    setTyping(true);
    setTimeout(() => {
      let res = null;
      try { res = (typeof agentAnswer === "function") ? agentAnswer(text) : null; } catch (e) { res = null; }
      setTyping(false);
      if (!res) { setMsgs((m) => [...m, { who: "hi", lines: ["잠시 문제가 있었어요 — 다시 한번 말씀해 주시겠어요?"], buttons: ["사람 상담 연결"], nav: null }]); return; }
      if (res.reset) { setMsgs([{ who: "hi", lines: res.lines, buttons: [], nav: null }]); return; }
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
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={listening ? "듣고 있어요…" : "무엇이든 물어보세요 (예: 내 실손 몇 세대야?)"} />
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
