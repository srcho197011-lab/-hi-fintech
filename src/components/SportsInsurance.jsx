/* ====================== 스포츠 임베디드 보험 (Sports Embedded Insurance) ====================== */
/* "운동은 자유롭게, 사고 대비는 자동으로" — 스포츠 활동에 자동 결합되는 임베디드 보험 소개 */
function SinsCountUp({ to, dur, suffix }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf, start, started = false, io, fb, finalT;
    const el = ref.current;
    const run = () => {
      if (started) return; started = true;
      const step = (t) => { if (!start) start = t; const p = Math.min(1, (t - start) / (dur || 1200)); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
      finalT = setTimeout(() => setV(to), (dur || 1200) + 250); // rAF 미동작 시에도 최종값 보장
    };
    if (typeof IntersectionObserver !== "undefined" && el) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: 0.3 });
      io.observe(el);
    }
    fb = setTimeout(run, 700); // 보장: IO 미동작 환경에서도 실행
    return () => { if (io) io.disconnect(); clearTimeout(fb); clearTimeout(finalT); if (raf) cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref}>{v.toLocaleString("ko-KR")}{suffix || ""}</span>;
}

function SportsInsuranceSection({ onGo }) {
  const go = onGo || (() => {});
  const [open, setOpen] = useState(0);
  useEffect(() => {
    const els = document.querySelectorAll(".sins .sreveal");
    const reveal = (e) => e.classList.add("in");
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { threshold: 0.12 });
      els.forEach((e) => io.observe(e));
    } else { els.forEach(reveal); }
    const fb = setTimeout(() => els.forEach(reveal), 700); // 보장: 무조건 표시
    return () => { if (io) io.disconnect(); clearTimeout(fb); };
  }, []);

  const COVERS = [
    [ShieldCheck, "스포츠 상해 보장", ["상해 치료비", "골절 진단비", "입원비", "수술비", "응급실 내원비"], ["골프 라운딩 중 낙상", "테니스 중 발목 염좌", "등산 중 골절"], "#F97316"],
    [Users, "배상책임 보장", ["대인 배상", "대물 배상", "손해배상금", "사고처리 지원"], ["골프공 사고", "자전거 충돌 사고", "시설물 파손"], "#EA580C"],
    [Trophy, "홀인원 보장", ["축하 만찬 비용", "기념품 제작비", "동반자 축하 비용"], ["골프 라운딩 중 홀인원 발생"], "#F59E0B"],
    [HeartPulse, "재활 및 회복 지원", ["물리치료", "재활운동", "건강관리 프로그램"], [], "#FB7185"],
  ];
  const FLOW = ["스포츠 예약", "활동 참여", "보험 자동 적용", "사고 발생", "보험금 자동 청구", "Health Token 지급"];
  const CASES = [
    ["골프 라운딩", (
      <div className="sins-chat">
        <div className="sins-bubble user"><b>사용자</b>“토요일 골프를 예약합니다.”</div>
        <div className="sins-bubble sys"><b>시스템</b>“예약이 완료되었습니다. 골프 상해보험, 배상책임보험, 홀인원 보장이 자동 적용됩니다.”</div>
      </div>
    )],
    ["테니스 레슨", (
      <div>테니스 활동 중 발생할 수 있는 <b>발목 염좌 · 골절 · 타인 부상</b> 보장이 자동 적용됩니다.</div>
    )],
    ["등산 활동", (
      <div>등산 중 낙상사고 발생 시 <b>응급실 치료비 · 골절 진단비 · 구조·이송 비용</b>을 지원합니다.</div>
    )],
  ];
  const PRODUCTS = [["스포츠 상해", "골절, 입원, 수술"], ["배상책임", "타인 신체·재산 피해"], ["홀인원", "축하 비용"], ["응급치료", "응급실 내원"], ["재활지원", "물리치료"]];

  const goCards = () => { const el = document.querySelector(".sins-cards"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <div className="sins">
      {/* Hero */}
      <div className="sins-hero sreveal">
        <span className="sins-bg b1" /><span className="sins-bg b2" />
        <span className="sins-eyebrow"><Sparkles size={14} /> Sports Embedded Insurance · 스포츠 임베디드 보험</span>
        <h2 className="sins-title">스포츠를 즐기면,<br />보험은 자동으로 따라옵니다.</h2>
        <p className="sins-sub">골프 · 테니스 · 등산 · 러닝까지 — Hi-Fin Tech는 스포츠 활동 과정에서 발생할 수 있는 <b>상해 · 배상책임 · 홀인원 위험</b>을 별도 가입 없이 자동으로 보장합니다.</p>
        <div className="sins-cta">
          <button className="sins-btn pri" onClick={goCards}><ShieldCheck size={16} /> 보험 혜택 확인하기</button>
          <button className="sins-btn ghost" onClick={() => go("shop")}><Activity size={16} /> 스포츠 활동 등록하기</button>
        </div>
        <div className="sins-stats">
          <div><b><SinsCountUp to={4} suffix="종" /></b><span>핵심 보장</span></div>
          <div><b><SinsCountUp to={100} suffix="%" /></b><span>자동 적용</span></div>
          <div><b><SinsCountUp to={24} suffix="시간" /></b><span>상시 보장</span></div>
        </div>
        <div className="sins-tagline">“운동은 자유롭게, 사고 대비는 자동으로”</div>
      </div>

      {/* 핵심 보장 카드 */}
      <div className="bklbl" style={{ margin: "18px 0 8px" }}><ShieldCheck size={14} color="#F97316" style={{ verticalAlign: "-2px" }} /> 핵심 보장</div>
      <div className="sins-cards">
        {COVERS.map(([Ic, t, items, ex, col], i) => (
          <div className="sins-card sreveal" key={t} style={{ borderTopColor: col, transitionDelay: (i * 0.06) + "s" }}>
            <span className="sins-cic" style={{ background: col + "1A", color: col }}><Ic size={24} /></span>
            <div className="sins-ct">{t}</div>
            <ul className="sins-list">{items.map((x) => <li key={x}><Check size={13} color={col} /> {x}</li>)}</ul>
            {ex.length > 0 && <div className="sins-ex"><b>예시</b><div>{ex.map((x) => <span key={x}>{x}</span>)}</div></div>}
          </div>
        ))}
      </div>

      {/* 서비스 플로우 */}
      <div className="bklbl" style={{ margin: "18px 0 8px" }}><RefreshCw size={14} color="#F97316" style={{ verticalAlign: "-2px" }} /> 서비스 플로우</div>
      <div className="sins-flow sreveal">
        {FLOW.map((s, i) => (
          <React.Fragment key={s}>
            <div className="sins-step" style={{ animationDelay: (i * 0.12) + "s" }}><span className="n">{i + 1}</span><span className="l">{s}</span></div>
            {i < FLOW.length - 1 && <span className="sins-arrow" style={{ animationDelay: (i * 0.12 + 0.06) + "s" }}><ArrowRight size={16} /></span>}
          </React.Fragment>
        ))}
      </div>

      {/* 실제 사례 (아코디언) */}
      <div className="bklbl" style={{ margin: "18px 0 8px" }}><BookOpen size={14} color="#F97316" style={{ verticalAlign: "-2px" }} /> 실제 사례</div>
      <div className="sins-acc">
        {CASES.map(([t, body], i) => (
          <div className={`sins-accitem ${open === i ? "on" : ""}`} key={t}>
            <button className="sins-acch" onClick={() => setOpen(open === i ? -1 : i)}><span className="ti"><Trophy size={15} /> {t}</span><ChevronDown size={18} className="chev" /></button>
            {open === i && <div className="sins-accb">{body}</div>}
          </div>
        ))}
      </div>

      {/* 보험상품 예시 (카드형) */}
      <div className="bklbl" style={{ margin: "18px 0 8px" }}><Coins size={14} color="#F97316" style={{ verticalAlign: "-2px" }} /> 보험상품 예시</div>
      <div className="sins-prod">
        {PRODUCTS.map(([k, v]) => (<div className="sins-pcard sreveal" key={k}><span className="pk">{k}</span><span className="pv">{v}</span></div>))}
      </div>

      <div className="chnote">※ 본 스포츠 임베디드 보험은 서비스 소개용 예시입니다. 실제 보장 내용·한도·가입 조건은 약관 및 제휴 보험사 정책에 따릅니다.</div>
    </div>
  );
}
