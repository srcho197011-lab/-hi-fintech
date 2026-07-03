/* ====================== 마케팅 온톨로지 시스템 ======================
   운영(코호트)·재무(손익) 데이터를 실시간 분석 → 매출 증감 원인 진단 → 마케팅 방안 자동 결정 →
   채널별(유튜브·SNS·검색·기관) 맞춤 광고 집행 + AI 크리에이티브(광고영상·시안) 자동 제작 +
   실시간 AI 마케팅 에이전트 실행. */

const mktWon = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 100000000) return s + (n / 100000000).toFixed(1) + "억"; if (n >= 10000) return s + Math.round(n / 10000).toLocaleString() + "만"; return s + n.toLocaleString(); };
const mktRr = (a, b) => a + Math.random() * (b - a);

// 마케팅 채널 온톨로지 [key, 채널, 유형, ROAS, CAC(원), 예산비중%, 색]
const MKT_CHANNELS = [
  ["youtube", "유튜브 (동영상·쇼츠)", "동영상", 3.8, 9000, 22, "#EF4444"],
  ["meta", "인스타·페이스북", "SNS", 3.2, 8000, 18, "#8B5CF6"],
  ["kakao", "카카오 (모먼트·톡채널)", "메신저", 4.1, 6000, 14, "#FBBF24"],
  ["naver", "네이버 검색·SA", "검색", 5.2, 7000, 12, "#22C55E"],
  ["tiktok", "틱톡·릴스", "숏폼", 2.9, 7500, 8, "#22D3EE"],
  ["crm", "CRM (앱푸시·카톡)", "리텐션", 9.5, 1200, 8, "#34D399"],
  ["influencer", "인플루언서·UGC", "콘텐츠", 3.5, 8500, 7, "#F472B6"],
  ["seo", "SEO·건강콘텐츠", "오가닉", 12.0, 2000, 5, "#38BDF8"],
  ["b2b", "검진·병원·약국 제휴광고", "B2B2C", 6.5, 4000, 6, "#6366F1"],
];
// 코호트 타겟 세그먼트 [세그먼트, 조건, 맞춤제품, 핵심메시지, 채널, 색]
const MKT_SEGMENTS = [
  ["당뇨 위험 40~50대", "공복혈당·당화혈색소 이상", "혈당케어(바나바·여주)·CGM", "식후혈당 관리, 지금 시작하세요", "youtube+meta+crm", "#F59E0B"],
  ["갱년기 여성 45~60", "여성·갱년기·골밀도", "석류·감마리놀렌산·칼슘/비타민D", "갱년기, 나를 위한 케어", "meta+influencer", "#EC4899"],
  ["간 건강 30~50대 남성", "간수치·지방간·음주", "밀크씨슬·오메가3", "회식 후 간 관리 루틴", "youtube+kakao", "#7C3AED"],
  ["검진 예정·미수검자", "검진 리마인더 대상", "종합검진 패키지·대비보험", "무료 검진대비보험 + 리포트", "b2b+crm+naver", "#2563EB"],
  ["만성질환 시니어 65+", "고혈압·당뇨·관절", "혈압계·관절영양제·재가돌봄", "가족이 함께하는 건강관리", "kakao+b2b", "#0EA5E9"],
  ["아동 부모", "0~19세 자녀 가구", "성장·면역 영양제·어린이보험", "우리 아이 성장·면역 케어", "meta+influencer", "#16A34A"],
];
// AI 크리에이티브 포맷 + 실제 생성 데모 데이터
const MKT_CREATIVE = [
  {
    fmt: "유튜브 15초 쇼츠", ic: "video", target: "당뇨 위험 40대", copy: "\"식후 혈당, 방치하면 안 돼요\" — 3초 훅 + 제품 + CTA", color: "#EF4444", kind: "video",
    gen: {
      title: "식후 혈당, 이대로 두면 큰일나요 (40대 필수)", thumbHead: "식후혈당\n관리 시작", thumbSub: "40대 당뇨 예방", ratio: "9:16", bgm: "잔잔 → 긴장감 있는 비트",
      scenes: [
        ["0–3초", "클로즈업 · 밥 먹고 졸려하는 40대", "밥 먹고 나면 유독 졸리고 피곤하세요?", "훅"],
        ["3–7초", "식후 혈당 스파이크 그래프 애니메이션", "그건 '식후 혈당 급상승' 신호일 수 있어요", "문제"],
        ["7–11초", "혈당케어(바나바·여주) + CGM 제품샷", "식후 혈당 관리, 이제 간편하게", "솔루션"],
        ["11–15초", "HI-Fin 로고 + 버튼 클로즈업", "무료 건강분석 받기 →", "CTA"],
      ],
      caption: "식후 혈당 스파이크는 당뇨의 시작일 수 있습니다. 40대라면 지금 관리하세요.",
      hashtags: ["#식후혈당", "#혈당관리", "#당뇨예방", "#혈당케어", "#40대건강"],
    },
  },
  {
    fmt: "인스타 릴스", ic: "video", target: "갱년기 여성", copy: "갱년기 루틴 브이로그형 UGC + 제품 자연노출", color: "#EC4899", kind: "video",
    gen: {
      title: "갱년기, 나를 위한 케어 루틴 🌸", thumbHead: "갱년기\n슬기롭게", thumbSub: "45–60 여성 케어", ratio: "9:16", bgm: "따뜻한 어쿠스틱",
      scenes: [
        ["0–3초", "창가 인물 클로즈업 · 감성 톤", "요즘 이유 없이 열나고 잠 안 오시죠?", "공감 훅"],
        ["3–8초", "아침 루틴 브이로그 + 석류·감마리놀렌산 자연노출", "제 갱년기 루틴, 이렇게 챙겨요", "UGC"],
        ["8–13초", "제품 클로즈업 + 미소", "석류·감마리놀렌산으로 하루를 가볍게", "제품"],
        ["13–15초", "로고 + 스와이프업 유도", "나를 위한 케어 시작하기", "CTA"],
      ],
      caption: "갱년기, 참지 말고 케어하세요 💐 저는 이렇게 하루를 시작해요.",
      hashtags: ["#갱년기", "#갱년기영양제", "#여성건강", "#석류", "#갱년기극복"],
    },
  },
  {
    fmt: "카톡 배너 시안", ic: "image", target: "검진 예정자", copy: "무료 검진대비보험 + 건강리포트, 지금 예약", color: "#FBBF24", kind: "banner",
    gen: {
      head: "무료 건강검진 대비보험", sub: "검진 예약하면 자동가입 + 건강분석 리포트까지", cta: "무료 예약하기", ratio: "카카오모먼트 가로 배너",
      variants: ["무료 검진대비보험, 지금 예약", "검진 예약 = 무료 보험 + 건강리포트", "치료비 걱정 ZERO, 무료 자동가입"],
    },
  },
  {
    fmt: "검색 반응형 광고 (RSA)", ic: "doc", target: "간 건강 검색자", copy: "밀크씨슬 최저가·정밀영양협회 인증", color: "#22C55E", kind: "rsa",
    gen: {
      url: "hi-fintech.com › 간건강",
      titles: ["밀크씨슬 최저가", "간 건강 영양제 추천", "정밀영양협회 인증 밀크씨슬", "간수치 관리 시작"],
      descs: ["실리마린 고함량, 정밀영양협회 검증 제품. 오늘 주문 시 건강적립금 25%.", "간 건강이 걱정된다면 밀크씨슬부터. 무료 건강분석 리포트 제공."],
      sitelinks: ["간 건강 영양제", "무료 건강분석", "검진 예약", "건강적립금"],
    },
  },
];
// 매출 신호 → 원인 → 액션 (지속 분석 기반 자동 의사결정)
const MKT_ACTIONS = [
  { seg: "40대 여성 · 영양제", ic: "pill", trend: -8.4, cause: "재구매율 하락 · 경쟁사 프로모션", action: "리타겟팅 + 정기구독 20% 쿠폰 CRM", ch: "meta·crm", color: "#EF4444" },
  { seg: "검진 연계 수수료", ic: "check", trend: 14.2, cause: "지자체·기업 제휴 검진 급증", action: "제휴기관 확대 + 검진 후 크로스셀 강화", ch: "b2b·naver", color: "#22C55E" },
  { seg: "간 건강 · 30~50 남성", ic: "capsule", trend: -5.1, cause: "여름 시즌성 하락", action: "유튜브 숏폼 캠페인 + 회식 시즌 타겟", ch: "youtube·kakao", color: "#F59E0B" },
  { seg: "병원 EMR·환자연계", ic: "building", trend: 21.6, cause: "제휴병원 신규 200곳 온보딩", action: "성공사례 B2B 콘텐츠 + 영업 확대", ch: "b2b", color: "#22C55E" },
  { seg: "보험 중개", ic: "badge", trend: 9.3, cause: "검진 회원 보험전환 상승", action: "회원 라이프사이클 CRM 자동화", ch: "crm", color: "#22C55E" },
];

// 시장조사 기반 권장 마케팅 전략 [전략, 근거·효과, 색]
const MKT_STRATEGIES = [
  ["검진·상담·구독 → 네이버 브랜드검색·SA 집중", "intent 기반 고전환 · 국내 유일 고ROAS 상품", "#22C55E"],
  ["건기식·기기 → 인스타 릴스·카카오모먼트", "저CPC · 릴스 전환 시 CTR 2배(0.79→1.58%) · ROAS 4x대", "#EC4899"],
  ["Meta Advantage+ AI 캠페인 전면 도입", "평균 ROAS +22% · 소재 자동 최적화", "#8B5CF6"],
  ["생성형 AI로 세그먼트별 소재 대량 생산", "AI 크리에이티브 CTR +11% · 제작 병목 해소", "#F472B6"],
  ["적응형 CRM(이탈군만 개입) · 앱푸시 1일 2건", "리텐션이 획득비의 1/5~1/7 · 이메일 리마인더 인게이지 +45%", "#34D399"],
  ["리퍼럴(만족 회원→지인 추천 보상)", "규제 준수 하 최강 획득·리텐션 그로스 루프", "#FBBF24"],
  ["기업복지·보험사 제휴 B2B2C 게이트웨이", "GC케어·라이프시맨틱스형 · 기관 통한 대량 온보딩", "#6366F1"],
  ["의료광고 전건 사전심의 + 정보제공형 콘텐츠", "치료후기 금지(적발 31.7%) · 규제 준수를 설계 전제로", "#EF4444"],
];
// 대형 플랫폼 제휴 (수백만~수천만 회원 확보) [플랫폼, 회원규모, 제휴유형, 기대효과, 색]
const MKT_PLATFORMS = [
  ["카카오 (톡채널·카카오헬스케어)", "5,000만", "톡채널·미니앱·리워드 연계", "대량 유입 + 카톡 CRM 인프라", "#FBBF24"],
  ["네이버 (파스타·검색·스토어)", "4,000만", "건강판·스마트스토어·검색 제휴", "검진·제품 고전환 유입", "#22C55E"],
  ["토스 (토스헬스·인슈어런스)", "2,000만+", "보험 조회·건강 미션 연계", "보험중개 시너지·핀테크 회원", "#2563EB"],
  ["삼성헬스 (갤럭시 번들)", "수천만", "웨어러블·건강데이터 연계", "걸음·바이탈 데이터 확보", "#0EA5E9"],
  ["캐시워크 (넛지헬스케어)", "2,300만", "걷기 리워드·건강미션 연계", "최저 CAC 대량 유입", "#34D399"],
  ["통신 3사 멤버십 (SKT·KT·U+)", "각 수천만", "멤버십 혜택·번들 제공", "무료체험 대량 유입", "#EC4899"],
  ["카드사 (삼성·신한·KB)", "수백만~천만", "카드 혜택·건강적립 제휴", "결제·리워드 연계", "#8B5CF6"],
  ["대형 커머스 (쿠팡·무신사·오늘의집)", "수천만", "건강 카테고리 입점·공동전", "제품 매출 확대", "#F97316"],
  ["당근마켓 (지역 생활)", "3,000만", "지역 검진·약국 로컬광고", "지역 기반 유입", "#F59E0B"],
  ["지자체·국민건강보험공단", "전국민", "공공 검진·건강증진 사업 연계", "공신력 + 대량 회원", "#6366F1"],
  ["마인드카페 (아토머스)", "200만", "비대면 심리상담·정신건강 앱 연계", "마음케어진단·심리케어 고전환", "#A78BFA"],
  ["허그맘·허그인 (심리상담센터)", "누적 60만", "전국 70+ 심리상담센터·대면 상담 연계", "오프라인 심리케어 딜리버리 확대", "#FB7185"],
];
/* 기관 대상 자동 광고 — 버튼 클릭 시 실제 집행 데모 데이터 */
const MKT_ORGADS = [
  {
    name: "건강검진센터", desc: "인원수 기반 검진 연계 · 예약 유입 광고", color: "#22D3EE",
    goal: "검진 예약 유입 극대화", target: "검진 예정·미수검 코호트(지역·연령 타겟)",
    channels: [["네이버 검색·플레이스", 40], ["유튜브 지역 타겟", 30], ["카톡 채널·리워드", 18], ["인스타·메타", 12]],
    budget: { daily: 600000, days: 14 }, bid: "목표 CPA · 예약당 자동입찰",
    creative: { head: "우리 동네 무료 검진대비, 지금 예약", sub: "검진 예약 시 건강분석 리포트 + 검진대비보험 무료 제공", cta: "검진 예약하기" },
    landing: "온톨로지 → 검진예약(지역 검진센터 매칭)",
    kpi: { imp: 620000, clk: 15500, ctr: 2.5, conv: 1240, convLabel: "검진 예약 전환", cpa: 6774 },
    result: { unit: "건당 연계수수료 22,500원", revenue: 27900000, roas: 3.3, extra: "+ 신규회원 1,240명 LTV" },
    log: ["의료광고 심의 자동검토 통과", "코호트에서 검진 예정 12,400명 세그먼트 추출", "AI 크리에이티브 3종 자동 생성·A/B", "목표 CPA 자동 입찰 세팅", "4개 채널 동시 집행 시작", "전환 상위 소재로 예산 실시간 재분배"],
  },
  {
    name: "병원 (EMR·환자연계)", desc: "환자 송출·EMR 연계 성공사례 B2B 광고", color: "#6366F1",
    goal: "EMR 도입 리드·계약 확보", target: "개원의·병원 실무진(B2B 결정권자)",
    channels: [["네이버·구글 검색", 45], ["의사 커뮤니티·전문매체", 30], ["이메일·DM 아웃바운드", 25]],
    budget: { daily: 400000, days: 20 }, bid: "리드당 목표 CPL 입찰",
    creative: { head: "환자 송출 + EMR 연계, 매출로 증명", sub: "HI-Fin 연계 병원 평균 신규환자 +18% · 성공사례 자료 제공", cta: "도입 상담 신청" },
    landing: "병원 EMR 제휴 랜딩(성공사례·ROI 계산기)",
    kpi: { imp: 210000, clk: 4200, ctr: 2.0, conv: 84, convLabel: "도입 상담 리드", cpa: 95238 },
    result: { unit: "리드 84건 → 계약 12건", revenue: 432000000, roas: "ARR 54x", extra: "EMR 월 300만원 × 12개월 = 연 4.32억" },
    log: ["B2B 광고 심의·매체 승인", "병원 세그먼트(지역·진료과) 리스트업", "성공사례·ROI 소재 자동 편성", "검색·커뮤니티·DM 멀티터치 집행", "리드 스코어링·영업 자동 배정", "계약 12건 · EMR ARR 회계 연동"],
  },
  {
    name: "약국", desc: "의약외품·건기식 공급 + 취급약국 유입 광고", color: "#0891B2",
    goal: "취급약국 확대 + 인근 소비자 유입", target: "제휴 약국 + 반경 3km 건강 관심 소비자",
    channels: [["지역 검색·당근 로컬", 40], ["카톡 채널·리워드", 30], ["인스타·메타", 30]],
    budget: { daily: 300000, days: 14 }, bid: "방문·주문 전환 최적화",
    creative: { head: "우리 약국에서 HI-Fin 건기식 · 지금 할인", sub: "검진 결과 맞춤 건기식 픽업 + 첫 구매 리워드 적립", cta: "가까운 취급약국 찾기" },
    landing: "취급약국 찾기 → 제품 픽업·주문",
    kpi: { imp: 480000, clk: 9600, ctr: 2.0, conv: 720, convLabel: "매장 방문·주문", cpa: 5833 },
    result: { unit: "객단가 45,000원", revenue: 32400000, roas: 7.7, extra: "+ 신규 취급약국 온보딩" },
    log: ["의약외품·건기식 표시광고 규제 검토 통과", "제휴 약국 반경·재고 세그먼트 매칭", "지역 맞춤 소재 자동 생성", "로컬 검색·당근·카톡 집행", "방문 전환 픽셀·주문 연동", "재고·객단가 기준 예산 최적화"],
  },
];
const MKT_PARTNER_MODELS = [
  ["API·SDK 미니앱 임베드", "제휴 플랫폼 안에 건강검진·리포트·상담 미니앱을 탑재해 이탈 없이 서비스 제공"],
  ["리워드·건강미션 연계", "걷기·검진·미션 달성 → 플랫폼 포인트 상호 적립(캐시워크형 그로스 루프)"],
  ["회원 크로스 프로모션", "제휴사 회원에게 무료 검진대비보험·건강분석리포트 제공으로 대량 온보딩"],
  ["데이터 제휴 (동의 기반)", "건강데이터 옵트인 연계로 맞춤 서비스·보험 설계(라이프시맨틱스형)"],
  ["공동 마케팅·커머스 입점", "공동 캠페인 + 대형 커머스 건강 카테고리 입점으로 제품 매출·인지도 확대"],
];
function MktBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? Math.round(value / max * 100) : 0;
  return (<div className="ontbar"><div className="ontbar-l"><span className="ontbar-lbl">{label}</span><span className="ontbar-val">{value.toLocaleString()}{sub || ""}</span></div><div className="ontbar-track"><i style={{ width: Math.max(2, pct) + "%", background: color }} /></div></div>);
}

/* ── 실시간 AI 마케팅 에이전트 (신호→분석→액션→집행 스트림) ── */
const _MKT_EVENTS = [
  ["signal", "매출 신호 감지", (s) => `${s} 매출 변동 감지 — 원인 분석 시작`, "#FBBF24"],
  ["analyze", "AI 원인 분석", (s) => `${s} · 코호트·재무 상관분석 완료`, "#22D3EE"],
  ["decide", "마케팅 방안 결정", (s) => `${s} 대상 맞춤 캠페인 전략 확정`, "#A78BFA"],
  ["creative", "AI 크리에이티브 생성", (s) => `${s} 광고영상·시안 자동 제작 완료`, "#EC4899"],
  ["launch", "캠페인 집행", (s) => `${s} 채널 광고 송출 시작`, "#34D399"],
];
function MktLiveAgent() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);
  const [feed, setFeed] = useState([]);
  const [st, setSt] = useState({ signals: 0, campaigns: 0, creatives: 0, spend: 0, revenue: 0 });
  const idRef = useRef(0); const stRef = useRef({ signals: 0, campaigns: 0, creatives: 0, spend: 0, revenue: 0 });
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const seg = MKT_SEGMENTS[Math.floor(Math.random() * MKT_SEGMENTS.length)][0];
      const ch = MKT_CHANNELS[Math.floor(Math.random() * MKT_CHANNELS.length)];
      const kind = Math.random();
      const s = { ...stRef.current };
      const ev = [];
      if (kind < 0.28) { s.signals++; ev.push({ id: ++idRef.current, t: "매출 신호 감지", d: `${seg} — 원인 분석 시작`, c: "#FBBF24" }); }
      else if (kind < 0.5) { s.creatives++; ev.push({ id: ++idRef.current, t: "AI 크리에이티브 생성", d: `${seg} · ${MKT_CREATIVE[Math.floor(Math.random() * MKT_CREATIVE.length)].fmt} 자동 제작`, c: "#EC4899" }); }
      else { const spend = Math.round(mktRr(200000, 2500000)); const rev = Math.round(spend * mktRr(2.5, 6.5)); s.campaigns++; s.spend += spend; s.revenue += rev; ev.push({ id: ++idRef.current, t: "캠페인 집행", d: `${seg} → ${ch[1]} · 예산 ${mktWon(spend)} · 예상매출 ${mktWon(rev)}`, c: ch[6] }); }
      stRef.current = s; setSt(s); setFeed((prev) => [...ev, ...prev].slice(0, 18)); setTick((x) => x + 1);
    }, Math.max(350, 1400 / speed));
    return () => clearInterval(iv);
  }, [running, speed]);
  const reset = () => { stRef.current = { signals: 0, campaigns: 0, creatives: 0, spend: 0, revenue: 0 }; setSt(stRef.current); setFeed([]); setTick(0); };
  const roas = st.spend ? (st.revenue / st.spend) : 0;
  return (<>
    <div className="ontsimbar">
      <div className={`ontsimstate ${running ? "on" : ""}`}><span className="dot" /> {running ? "AI 마케팅 에이전트 가동 중" : "일시정지"} <em>· 액션 {tick.toLocaleString()}건</em></div>
      <div className="ontsimctl"><button onClick={() => setRunning((v) => !v)} className="pri">{running ? <><Pause size={14} /> 일시정지</> : <><Play size={14} /> 재생</>}</button>{[1, 2, 4].map((sp) => <button key={sp} className={speed === sp ? "on" : ""} onClick={() => setSpeed(sp)}>{sp}x</button>)}<button onClick={reset}><RotateCcw size={14} /> 리셋</button></div>
    </div>
    <div className="ontkpis" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
      {[["매출 신호 감지", st.signals.toLocaleString() + "건", "#FBBF24"], ["집행 캠페인", st.campaigns.toLocaleString() + "건", "#34D399"], ["AI 크리에이티브", st.creatives.toLocaleString() + "건", "#EC4899"], ["광고비 집행", mktWon(st.spend), "#F87171"], ["ROAS", roas.toFixed(1) + "x", "#22D3EE"]].map(([k, v, c], i) => (
        <div className="ontkpi" key={i}><div className="ontkpi-v" style={{ color: c }}>{v}</div><div className="ontkpi-k">{k}</div></div>
      ))}
    </div>
    <div className="ontpanel">
      <div className="ontph"><Zap size={15} color="#EC4899" /> 실시간 마케팅 실행 스트림 <span>· 신호→분석→크리에이티브→집행</span></div>
      <div className="ontfeed">
        {feed.length === 0 && <div className="ontempty">마케팅 에이전트 실행을 기다리는 중…</div>}
        {feed.map((f) => (<div className="ontfeed-i buy" key={f.id}><span className="ontfeed-ic" style={{ background: f.c + "22", color: f.c }}><Megaphone size={13} /></span><div className="ontfeed-b"><div className="ontfeed-t"><b>{f.t}</b></div><div className="ontfeed-s">{f.d}</div></div></div>))}
      </div>
    </div>
  </>);
}

/* ── 광고 영상 플레이어 (SVG/CSS 애니메이션 · 씬 타이밍 재생) ── */
function _parseSec(s) { const m = (s || "").match(/(\d+)\D+?(\d+)/); return m ? [+m[1], +m[2]] : [0, 15]; }
function AdSceneVis({ tag, color }) {
  if (/문제/.test(tag)) return (<svg className="ad-graph" viewBox="0 0 130 80"><polyline points="8,68 34,60 60,56 84,32 118,8" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="118" cy="8" r="6" fill="#fff" /><text x="118" y="-2" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="800">↑</text></svg>);
  if (/솔루션|제품/.test(tag)) return (<svg className="ad-prod" viewBox="0 0 70 90"><rect x="22" y="24" width="26" height="58" rx="7" fill="#fff" /><rect x="27" y="12" width="16" height="14" rx="3" fill="#fff" opacity=".85" /><rect x="22" y="46" width="26" height="24" fill={color} opacity=".35" /><path d="M28 58h14M28 64h10" stroke={color} strokeWidth="2.4" strokeLinecap="round" /></svg>);
  if (/CTA/.test(tag)) return (<div className="ad-ctabtn" style={{ color }}>무료 건강분석 받기 →</div>);
  if (/UGC/.test(tag)) return (<svg className="ad-prod" viewBox="0 0 80 80"><circle cx="40" cy="30" r="15" fill="#fff" /><path d="M16 74c0-15 11-24 24-24s24 9 24 24z" fill="#fff" /></svg>);
  return (<div className="ad-hook">?</div>);
}
function AdVideoPlayer({ creative }) {
  const scenes = creative.gen.scenes.map((s) => ({ vis: s[1], sub: s[2], tag: s[3], range: _parseSec(s[0]) }));
  const total = scenes[scenes.length - 1].range[1] || 15;
  const [t, setT] = useState(0); const [playing, setPlaying] = useState(true);
  useEffect(() => { if (!playing) return; const id = setInterval(() => { setT((x) => { const n = Math.round((x + 0.1) * 10) / 10; if (n >= total) { setPlaying(false); return total; } return n; }); }, 100); return () => clearInterval(id); }, [playing, total]);
  const idx = Math.max(0, scenes.findIndex((s) => t >= s.range[0] && t < s.range[1]));
  const cur = scenes[idx] || scenes[scenes.length - 1];
  const c = creative.color; const ended = !playing && t >= total;
  const hue = ["#1E293B", "#7C1D3E", "#134E4A", "#4C1D95"][idx % 4];
  const replay = () => { setT(0); setPlaying(true); };
  const reels = /릴스/.test(creative.fmt);
  return (
    <div className="adplayer">
      <div className="adstage" style={{ background: `linear-gradient(160deg, ${c}, ${hue} 60%, #0B1220)` }}>
        <span className="ad-badge">{reels ? "REELS" : "SHORTS"}</span>
        <span className="ad-scenetag" style={{ background: c }}>{cur.tag}</span>
        <div className="ad-vis" key={"v" + idx}><AdSceneVis tag={cur.tag} color={c} /></div>
        <div className="ad-caption" key={"c" + idx}>{cur.sub}</div>
        <div className="ad-brand">HI-Fin Tech</div>
        {ended && <button className="ad-bigbtn" onClick={replay}><RotateCcw size={22} /></button>}
        {!playing && !ended && <button className="ad-bigbtn" onClick={() => setPlaying(true)}><Play size={26} /></button>}
      </div>
      <div className="ad-ctrl">
        <button onClick={() => (playing ? setPlaying(false) : ended ? replay() : setPlaying(true))}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
        <div className="ad-prog" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setT(Math.round((e.clientX - r.left) / r.width * total * 10) / 10); }}><i style={{ width: (t / total * 100) + "%", background: c }} /></div>
        <span className="ad-time">0:{String(Math.floor(t)).padStart(2, "0")} / 0:{total}</span>
      </div>
    </div>
  );
}

/* ── AI 크리에이티브 생성 결과 데모 모달 ── */
function CreativeGenModal({ creative, onClose }) {
  const g = creative.gen, c = creative.color;
  const lines = (g.thumbHead || "").split("\n");
  return (
    <div className="ontov" onClick={onClose}>
      <div className="ontmodal" onClick={(e) => e.stopPropagation()} style={{ width: "min(640px,96vw)" }}>
        <div className="ontmh">
          <div><span className="ontmid" style={{ color: c }}>AI CREATIVE · 생성 완료</span><div className="ontmname">{creative.fmt} <span>· {creative.target}</span></div></div>
          <button onClick={onClose}><X size={20} color="#8A97AE" /></button>
        </div>
        <div className="ontmbody">
          {creative.kind === "video" && (<>
            <div className="mktgen-video">
              <AdVideoPlayer creative={creative} />
              <div className="mktgen-scenes">
                <div className="mktgen-lbl">스토리보드 · {g.ratio} · BGM {g.bgm}</div>
                {g.scenes.map(([t, vis, sub, tag], i) => (
                  <div className="mktgen-scene" key={i}><span className="mktgen-time">{t}</span><div className="mktgen-sc"><div className="mktgen-vis">{vis}</div><div className="mktgen-line">"{sub}"</div></div><span className="mktgen-tag" style={{ color: c, background: c + "1A" }}>{tag}</span></div>
                ))}
              </div>
            </div>
            <div className="mktgen-field"><b>제목</b> {g.title}</div>
            <div className="mktgen-field"><b>캡션</b> {g.caption}</div>
            <div className="mktgen-tags">{g.hashtags.map((h) => <span key={h}>{h}</span>)}</div>
          </>)}
          {creative.kind === "banner" && (<>
            <svg className="mktgen-banner" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="cbgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c} /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
              <rect width="400" height="120" rx="12" fill="url(#cbgrad)" />
              <path d="M330 26 L362 38 V64 C362 84 348 96 330 102 C312 96 298 84 298 64 V38 Z" fill="#fff" opacity=".18" />
              <g stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9"><line x1="330" y1="48" x2="330" y2="72" /><line x1="318" y1="60" x2="342" y2="60" /></g>
              <text x="22" y="46" fontSize="21" fontWeight="900" fill="#fff" fontFamily="'Noto Sans KR',sans-serif">{g.head}</text>
              <text x="22" y="72" fontSize="12" fill="#fff" opacity=".92" fontFamily="'Noto Sans KR',sans-serif">{g.sub}</text>
              <rect x="22" y="86" width="130" height="24" rx="12" fill="#fff" /><text x="87" y="102" fontSize="12.5" fontWeight="800" fill={c} textAnchor="middle" fontFamily="'Noto Sans KR',sans-serif">{g.cta} ›</text>
            </svg>
            <div className="mktgen-lbl" style={{ marginTop: 12 }}>{g.ratio} · 헤드라인 A/B 변형</div>
            {g.variants.map((v, i) => <div className="mktgen-variant" key={i}><span>{String.fromCharCode(65 + i)}</span> {v}</div>)}
          </>)}
          {creative.kind === "rsa" && (<>
            <div className="mktgen-lbl">검색 광고 미리보기</div>
            <div className="mktgen-rsa">
              <div className="rsa-top"><span className="rsa-ad">광고</span><span className="rsa-url">{g.url}</span></div>
              <div className="rsa-title">{g.titles[0]} | {g.titles[1]}</div>
              <div className="rsa-desc">{g.descs[0]}</div>
              <div className="rsa-sl">{g.sitelinks.map((s) => <span key={s}>{s}</span>)}</div>
            </div>
            <div className="mktgen-lbl" style={{ marginTop: 12 }}>제목 애셋 ({g.titles.length})</div>
            <div className="mktgen-tags">{g.titles.map((t) => <span key={t}>{t}</span>)}</div>
            <div className="mktgen-lbl" style={{ marginTop: 10 }}>설명 애셋 ({g.descs.length})</div>
            {g.descs.map((dd, i) => <div className="mktgen-variant" key={i}><span>{i + 1}</span> {dd}</div>)}
          </>)}
          <div className="ontmacts"><button className="give" onClick={() => { if (typeof toast === "function") toast(`${creative.fmt} A/B 변형 3종 추가 생성 · 캠페인 큐 등록(파일럿)`); }}><Sparkles size={14} /> A/B 변형 3종 추가 생성</button><button onClick={onClose}>닫기</button></div>
          <div className="chnote" style={{ marginTop: 4 }}>※ AI 자동 생성 데모입니다. 실제 소재는 의료광고 심의·건강기능식품 표시·광고 규제 검수 후 집행됩니다.</div>
        </div>
      </div>
    </div>
  );
}

/* ── 자동 집행 시행 데모 모달 ── */
function AutoExecModal({ org, onClose }) {
  const c = org.color, b = org.budget, spend = b.daily * b.days;
  const won = (n) => (typeof n === "number" ? n.toLocaleString() + "원" : n);
  return (
    <div className="ontov" onClick={onClose}>
      <div className="ontmodal" onClick={(e) => e.stopPropagation()} style={{ width: "min(620px,96vw)" }}>
        <div className="ontmh">
          <div><span className="ontmid" style={{ color: c }}>⚡ 자동 집행 완료 · 파일럿</span><div className="ontmname">{org.name} <span>· 자동 광고 캠페인</span></div></div>
          <button onClick={onClose}><X size={20} color="#8A97AE" /></button>
        </div>
        <div className="ontmbody">
          <div className="mktexec-goal"><span><b>목표</b> {org.goal}</span><span><b>타겟</b> {org.target}</span></div>
          <div className="mktexec-lbl">채널 믹스 · 예산 배분</div>
          <div className="mktexec-ch">{org.channels.map(([n, p]) => (<div className="mktexec-chr" key={n}><span>{n}</span><div className="mktexec-bar"><i style={{ width: p + "%", background: c }} /></div><em>{p}%</em></div>))}</div>
          <div className="mktexec-budget"><div><span>일 예산</span><b>{won(b.daily)}</b></div><div><span>집행 기간</span><b>{b.days}일</b></div><div><span>총 집행액</span><b>{won(spend)}</b></div><div><span>입찰 전략</span><b>{org.bid}</b></div></div>
          <div className="mktexec-lbl">집행 소재</div>
          <div className="mktexec-crea" style={{ borderColor: c + "66" }}><div className="mktexec-head" style={{ color: c }}>{org.creative.head}</div><div className="mktexec-sub">{org.creative.sub}</div><span className="mktexec-cta" style={{ background: c }}>{org.creative.cta} →</span></div>
          <div className="mktexec-land"><b>랜딩</b> {org.landing}</div>
          <div className="mktexec-lbl">예상 성과 ({b.days}일)</div>
          <div className="mktexec-kpi">
            <div><span>노출</span><b>{org.kpi.imp.toLocaleString()}</b></div>
            <div><span>클릭</span><b>{org.kpi.clk.toLocaleString()}</b></div>
            <div><span>CTR</span><b>{org.kpi.ctr}%</b></div>
            <div><span>{org.kpi.convLabel}</span><b>{org.kpi.conv.toLocaleString()}</b></div>
            <div><span>CPA</span><b>{org.kpi.cpa.toLocaleString()}원</b></div>
            <div className="hl" style={{ color: c }}><span>ROAS</span><b>{typeof org.result.roas === "number" ? org.result.roas + "x" : org.result.roas}</b></div>
          </div>
          <div className="mktexec-rev" style={{ background: c + "16", borderColor: c + "55" }}>예상 매출 <b>{won(org.result.revenue)}</b> <em>({org.result.unit}) {org.result.extra}</em></div>
          <div className="mktexec-lbl">자동 집행 로그</div>
          <div className="mktexec-log">{org.log.map((l, i) => (<div className="mktexec-lr" key={i}><span style={{ background: c }}>{i + 1}</span>{l}<em>✓</em></div>))}</div>
          <div className="ontmacts"><button className="give" onClick={() => { if (typeof toast === "function") toast(`${org.name} 캠페인 라이브 유지 · 실시간 최적화 진행(파일럿)`); }}><Zap size={14} /> 라이브 유지 · 실시간 최적화</button><button onClick={onClose}>닫기</button></div>
          <div className="chnote" style={{ marginTop: 4 }}>※ 파일럿 시뮬레이션 데이터입니다. 실제 집행은 매체 심의·의료광고 규제 검수 후 진행됩니다.</div>
        </div>
      </div>
    </div>
  );
}

/* ── 제휴 제안서 발송 데모 모달 ── */
function _platReach(scale) {
  if (/전국민/.test(scale)) return 51000000;
  const m = scale.match(/([\d,]+)\s*만/); if (m) return parseInt(m[1].replace(/,/g, ""), 10) * 10000;
  if (/수천만/.test(scale)) return 30000000;
  if (/천만/.test(scale)) return 8000000;
  if (/수백만/.test(scale)) return 5000000;
  return 10000000;
}
function PartnerProposalModal({ plat, idx, onClose }) {
  const [nm, scale, type, effect, c] = plat;
  const reach = _platReach(scale);
  const rates = [1.6, 1.9, 1.3, 1.0, 2.2, 1.1, 0.9, 1.4, 1.2, 2.5, 2.8, 3.2];
  const rate = rates[idx % rates.length];
  const members = Math.round(reach * rate / 100);
  const buyers = Math.round(members * 0.30);
  const gmv = buyers * 200000;
  const checkup = Math.round(members * 0.22);
  const ourRev = Math.round(gmv * 0.25 + checkup * 22500);
  const won = (n) => (n >= 100000000 ? (n / 100000000).toFixed(1).replace(/\.0$/, "") + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원");
  const cnt = (n) => (n >= 10000 ? (n / 10000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, "") + "만명" : n.toLocaleString() + "명");
  const roadmap = [["MOU 체결", "제휴 범위·정산 구조 합의", "1개월"], ["PoC 연동", "미니앱·API·리워드 기술 연동", "2개월"], ["파일럿", `${cnt(Math.round(members * 0.1))} 대상 크로스 프로모션`, "3개월"], ["정식 런칭", `${cnt(members)} 대량 온보딩·상시 운영`, "6개월~"]];
  return (
    <div className="ontov" onClick={onClose}>
      <div className="ontmodal" onClick={(e) => e.stopPropagation()} style={{ width: "min(640px,96vw)" }}>
        <div className="ontmh">
          <div><span className="ontmid" style={{ color: c }}>🤝 제휴 제안서 발송 · 파일럿</span><div className="ontmname">{nm} <span>· {scale} 회원</span></div></div>
          <button onClick={onClose}><X size={20} color="#8A97AE" /></button>
        </div>
        <div className="ontmbody">
          <div className="mktprop-intro">HI-Fin Tech × {nm} <b>B2B2C 크로스 프로모션</b> 제안 — {effect}. 무료 검진대비보험·건강분석리포트·상담을 <b>앵커 오퍼</b>로 대량 온보딩합니다.</div>
          <div className="mktprop-grid">
            <div className="mktprop-col"><div className="mktprop-ch" style={{ color: c }}>HI-Fin 제공</div><ul><li>무료 검진대비보험 + 건강분석 리포트</li><li>AI 건강상담·주치의</li><li>검진 결과 맞춤 제품·리워드</li><li>미니앱·API·SDK 임베드</li></ul></div>
            <div className="mktprop-col"><div className="mktprop-ch" style={{ color: c }}>{nm} 제공</div><ul><li>{type}</li><li>회원 도달·트래픽 ({scale})</li><li>CRM·리워드 인프라</li><li>공동 마케팅·노출 지면</li></ul></div>
          </div>
          <div className="mktexec-lbl">예상 성과 (연간)</div>
          <div className="mktexec-kpi mktprop-kpi">
            <div><span>도달 회원</span><b>{cnt(reach)}</b></div>
            <div><span>온보딩 (전환 {rate}%)</span><b>{cnt(members)}</b></div>
            <div><span>제품 구매자</span><b>{cnt(buyers)}</b></div>
            <div><span>제품 GMV</span><b>{won(gmv)}</b></div>
            <div><span>검진 연계</span><b>{cnt(checkup)}</b></div>
            <div className="hl" style={{ color: c }}><span>HI-Fin 매출</span><b>{won(ourRev)}</b></div>
          </div>
          <div className="mktprop-share" style={{ borderColor: c + "44" }}><b>수익 배분</b> 제품 마진·검진 연계 수수료의 일부를 트래픽 기여도 기준 배분(rev-share) · 리워드 상호 적립 정산</div>
          <div className="mktexec-lbl">실행 로드맵</div>
          <div className="mktprop-road">{roadmap.map(([t, d, when], i) => (<div className="mktprop-step" key={i}><span className="mktprop-no" style={{ background: c }}>{i + 1}</span><div className="mktprop-sc"><b>{t} <em>· {when}</em></b><p>{d}</p></div>{i < roadmap.length - 1 && <span className="mktprop-arr">→</span>}</div>))}</div>
          <div className="ontmacts"><button className="give" onClick={() => { if (typeof toast === "function") toast(`${nm} 제휴 제안서 담당자 발송 완료 · MOU 미팅 요청(파일럿)`); }}><Sparkles size={14} /> 제안서 발송 · MOU 미팅 요청</button><button onClick={onClose}>닫기</button></div>
          <div className="chnote" style={{ marginTop: 4 }}>※ 파일럿 추정치입니다. 실제 성과는 제휴 조건·연동 범위·회원 동의에 따라 달라집니다.</div>
        </div>
      </div>
    </div>
  );
}

function MarketingSection({ onGo }) {
  const [gen, setGen] = useState(null);
  const [exec, setExec] = useState(null);
  const [prop, setProp] = useState(null);
  const [tab, setTab] = useState("intel");
  const agg = React.useMemo(() => (typeof pilotAgg === "function" ? pilotAgg() : null), []);
  const chMax = Math.max(...MKT_CHANNELS.map((c) => c[5]));
  const tabs = [["intel", "매출 인텔리전스", TrendingUp], ["channel", "채널·캠페인", Target], ["creative", "맞춤제품·AI 크리에이티브", Video], ["agent", "실시간 마케팅 에이전트", Zap]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="ontohero" style={{ background: "linear-gradient(120deg,#2A0E1F,#3B0B2E 55%,#4A1E6B)" }}>
        <div className="ontohero-bg"><span style={{ background: "#EC4899" }} /><span style={{ background: "#8B5CF6" }} /></div>
        <div className="ontohero-l">
          <span className="ontotag" style={{ background: "rgba(236,72,153,.16)", borderColor: "rgba(236,72,153,.4)", color: "#F9A8D4" }}><Megaphone size={13} /> Marketing Ontology · AI Growth</span>
          <div className="ontotitle">마케팅 온톨로지 시스템</div>
          <p>운영(코호트)·재무(손익) 데이터를 <b>실시간 분석</b>해 매출 증감 원인을 진단하고, AI 에이전트가 <b>채널별 맞춤 광고·크리에이티브를 자동 집행</b>합니다 — 유튜브·SNS·검색·검진센터·병원·약국.</p>
        </div>
        <div className="ontohero-kpi">
          <div><b>{MKT_CHANNELS.length}</b><span>마케팅 채널</span></div>
          <div><b>{MKT_SEGMENTS.length}</b><span>타겟 세그먼트</span></div>
          <div><b>AI</b><span>자동 크리에이티브</span></div>
        </div>
      </div>

      <div className="chtabs" style={{ marginTop: 14 }}>{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "intel" && (<>
        <div className="finlink" style={{ background: "#2A0E1F", borderColor: "#5B2148" }}><TrendingUp size={13} color="#F472B6" /> 재무·운영 데이터를 지속 분석해 <b>매출 증감 세그먼트</b>를 자동 탐지하고, 원인 진단 후 <b>마케팅 방안을 자동 결정</b>합니다.</div>
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#F472B6" /> 매출 신호 · 원인 분석 · 자동 마케팅 액션</div>
          {MKT_ACTIONS.map((a, i) => (
            <div className="mktrow" key={i}>
              <span className="mkt-ic" style={{ background: a.color + "1A" }}><Art name={a.ic} size={18} /></span>
              <div className="mkt-b"><div className="mkt-t"><b>{a.seg}</b> <span className="mkt-trend" style={{ color: a.trend < 0 ? "#EF4444" : "#22C55E" }}>{a.trend < 0 ? "▼" : "▲"} {Math.abs(a.trend)}%</span></div>
                <div className="mkt-cause"><b style={{ color: "#8FA1C0" }}>원인</b> {a.cause}</div>
                <div className="mkt-act"><Sparkles size={11} color="#A78BFA" style={{ verticalAlign: "-1px" }} /> <b style={{ color: "#C4B5FD" }}>자동 액션</b> {a.action} <span className="mkt-ch">{a.ch}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="ontpanel">
          <div className="ontph"><BookOpen size={15} color="#34D399" /> 권장 마케팅 전략 (시장조사 기반) <span>· TOP {MKT_STRATEGIES.length}</span></div>
          {MKT_STRATEGIES.map(([t, d, c], i) => (
            <div className="mktrow" key={i} style={{ padding: "9px 11px" }}><span className="mkt-ic" style={{ background: c + "1A", width: 26, height: 26, fontSize: 12, fontWeight: 800, color: c }}>{i + 1}</span><div className="mkt-b"><b style={{ color: "#EAF2FF", fontSize: 12.3 }}>{t}</b><p style={{ color: "#90A0BD", fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{d}</p></div></div>
          ))}
          <div className="finpl-note">벤치마크: 이커머스 ROAS 2.87x로 하락 추세 → <b>리텐션·리퍼럴 그로스 루프 + AI 소재 자동화로 CAC 절감</b>이 2025 핵심 레버. 한국 의료광고는 사전심의·24시간 차단 규제(10만+ 플랫폼 전건 심의).</div>
        </div>
      </>)}

      {tab === "channel" && (<>
        <div className="ontgrid2">
          <div className="ontpanel">
            <div className="ontph"><Target size={15} color="#22D3EE" /> 채널별 예산·ROAS <span>· {MKT_CHANNELS.length}개 채널</span></div>
            {MKT_CHANNELS.map((c) => <MktBar key={c[0]} label={`${c[1]} · ROAS ${c[3]}x`} value={c[5]} max={chMax} color={c[6]} sub="%" />)}
            <div className="finpl-note">CRM·SEO는 ROAS 최상(리텐션·오가닉), 유튜브·메타는 대량 도달. B2B는 검진·병원·약국 제휴광고로 회원·기관 동시 확보.</div>
          </div>
          <div className="ontpanel">
            <div className="ontph"><Megaphone size={15} color="#6366F1" /> 기관 대상 자동 광고 (B2B2C)</div>
            <div className="mktinst">
              {MKT_ORGADS.map((o, i) => (
                <div className="mktinst-r" key={i}><span className="dot" style={{ background: o.color }} /><div><b>{o.name}</b><p>{o.desc}</p></div><button className="mktbtn" onClick={() => setExec(o)}>자동 집행</button></div>
              ))}
            </div>
            <div className="ontph" style={{ marginTop: 14 }}><Sparkles size={15} color="#FBBF24" /> 코호트 타겟 세그먼트 <span>· {MKT_SEGMENTS.length}개</span></div>
            <div className="finpl-note">온톨로지 코호트{agg ? `(${agg.n.toLocaleString()}명)` : ""}를 진료과·연령·질병·위험도로 세분해 정밀 타겟팅합니다.</div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Users size={15} color="#FBBF24" /> 대형 플랫폼 제휴 <span>· 수백만~수천만 회원 확보(B2B2C)</span></div>
          <div className="mktplat">{MKT_PLATFORMS.map(([nm, scale, type, effect, c], i) => (
            <div className="mktplat-c" key={i} style={{ borderLeftColor: c }}>
              <div className="mktplat-h"><b>{nm}</b><span className="mktplat-scale" style={{ color: c }}>{scale} 회원</span></div>
              <div className="mktplat-type">{type}</div>
              <div className="mktplat-eff"><Sparkles size={10} color="#A78BFA" style={{ verticalAlign: "-1px" }} /> {effect}</div>
              <button className="mktbtn" onClick={() => setProp({ plat: MKT_PLATFORMS[i], idx: i })}>제휴 제안</button>
            </div>
          ))}</div>
          <div className="ontph" style={{ marginTop: 14 }}><Network size={15} color="#22D3EE" /> 제휴 실행 모델</div>
          <div className="mktinst">{MKT_PARTNER_MODELS.map(([t, d], i) => (
            <div className="mktinst-r" key={i}><span className="mktplat-no" style={{ background: "#12243a", color: "#67E8F9" }}>{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>
          ))}</div>
          <div className="finpl-note">무료 건강검진대비보험·건강분석리포트·상담을 앵커 오퍼로, 대형 플랫폼 회원을 대량 온보딩합니다. 검진 연계 + 지자체·협회 제휴가 5년 1,000만 회원의 핵심 레버.</div>
        </div>
      </>)}

      {tab === "creative" && (<>
        <div className="finlink" style={{ background: "#2A0E1F", borderColor: "#5B2148" }}><Video size={13} color="#EC4899" /> 회원 건강데이터 기반 <b>맞춤 제품</b>을 선정하고, 세그먼트별 <b>광고영상·시안을 AI가 자동 제작</b>합니다.</div>
        <div className="ontpanel">
          <div className="ontph"><Sparkles size={15} color="#EC4899" /> 세그먼트별 맞춤 제품 + 자동 광고</div>
          <div className="mktseg">{MKT_SEGMENTS.map((s, i) => (
            <div className="mktseg-c" key={i} style={{ borderTopColor: s[5] }}>
              <div className="mktseg-h"><b>{s[0]}</b><span>{s[1]}</span></div>
              <div className="mktseg-p"><Pill size={12} color={s[5]} /> {s[2]}</div>
              <div className="mktseg-m">"{s[3]}"</div>
              <div className="mktseg-ch">{s[4].split("+").map((c) => <span key={c}>{c}</span>)}</div>
            </div>
          ))}</div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><Video size={15} color="#F472B6" /> AI 크리에이티브 스튜디오 <span>· 광고영상·시안 자동 생성</span></div>
          <div className="mktcrea">{MKT_CREATIVE.map((c, i) => (
            <div className="mktcrea-c" key={i}><span className="mktcrea-ic" style={{ background: c.color + "1A" }}><Art name={c.ic} size={20} /></span>
              <div className="mktcrea-b"><div className="mktcrea-f">{c.fmt} <span className="mktcrea-tg">{c.target}</span></div><div className="mktcrea-copy">{c.copy}</div></div>
              <button className="mktbtn" onClick={() => setGen(c)}>생성</button>
            </div>
          ))}</div>
          <div className="chnote">※ 크리에이티브·성과 수치는 <b>파일럿 시연</b>입니다. 실제 광고 집행은 각 매체 정책·의료광고 심의(의료법)·건강기능식품 표시·광고 규제를 준수합니다.</div>
        </div>
      </>)}

      {tab === "agent" && <MktLiveAgent />}

      <div className="chnote" style={{ marginTop: 12 }}>※ 마케팅 온톨로지는 운영(코호트)·재무(손익) 데이터를 실시간 분석해 마케팅 의사결정을 자동화하는 <b>파일럿 시연</b>입니다. 매출 증감·ROAS·크리에이티브는 예시이며, 실제 집행은 매체·규제 심의를 거칩니다.</div>
      {gen && <CreativeGenModal creative={gen} onClose={() => setGen(null)} />}
      {exec && <AutoExecModal org={exec} onClose={() => setExec(null)} />}
      {prop && <PartnerProposalModal plat={prop.plat} idx={prop.idx} onClose={() => setProp(null)} />}
    </div>
  );
}
