const SHOP_PARTNERS = {
  diet: [{
    name: "풀무원", brand: "디자인밀", sub: "건강식단 특별제휴", member: true,
    bg: "linear-gradient(125deg,#15803D 0%,#16A34A 48%,#65A30D 100%)",
    tagline: "바른먹거리 기반 건강식단 — 저당·균형식·케어푸드로 만성질환 식이관리를 돕습니다.",
    strengths: [["meal", "맞춤 건강식단", "당뇨·체중·혈압 관리 식단(디자인밀)"], ["leaf", "바른먹거리", "무첨가·식물성 단백 중심 식단"], ["badge", "품질·안전", "HACCP·식품안전 관리 체계"], ["delivery", "정기 구독배송", "주간 식단 새벽배송"]],
    chips: ["저당 식단", "케어푸드", "식물성 단백", "샐러드·도시락"],
    stats: [["디자인밀", "맞춤식단 브랜드"], ["전국", "새벽배송"], ["HACCP", "품질관리"]],
    home: "https://www.pulmuone.co.kr", q: "건강식단 디자인밀",
  }, {
    name: "현대그린푸드", brand: "그리팅", sub: "건강식단 특별제휴", member: true,
    bg: "linear-gradient(125deg,#14532D 0%,#166534 46%,#3F6212 100%)",
    tagline: "맞춤형 건강·케어푸드 전문 ‘그리팅’ — 영양사 설계 식단으로 만성질환·시니어 식이관리를 돕습니다.",
    strengths: [["meal", "맞춤 건강식단", "영양사 설계 당뇨·혈압·체중 관리식(그리팅)"], ["leaf", "케어푸드", "연화식·저염·고단백 등 질환별 식단"], ["badge", "품질·안전", "HACCP·대량급식 노하우 품질관리"], ["delivery", "정기 구독배송", "주간 맞춤식단 정기배송"]],
    chips: ["맞춤 건강식단", "케어푸드", "저염·저당", "시니어식"],
    stats: [["그리팅", "맞춤식단 브랜드"], ["전국", "정기배송"], ["영양사", "식단 설계"]],
    home: "https://www.greating.co.kr", q: "현대그린푸드 그리팅 건강식단",
  }],
  supp: [{
    name: "한국암웨이", brand: "뉴트리라이트", sub: "영양제 특별제휴", member: true,
    bg: "linear-gradient(125deg,#0B3D91 0%,#1A56DB 48%,#2563EB 100%)",
    tagline: "글로벌 1위 비타민 브랜드 뉴트리라이트 — 자체 유기농 농장 원료와 식물영양소 중심의 종합 영양 설계.",
    strengths: [["badge", "글로벌 1위 영양제", "뉴트리라이트 종합비타민·미네랄"], ["leaf", "유기농 원료", "자체 인증 농장 식물영양소"], ["capsule", "종합 라인업", "더블엑스·오메가·프로바이오틱"], ["doc", "과학적 근거", "연구·품질 검증 시스템"]],
    chips: ["더블엑스", "종합비타민", "오메가3", "프로바이오틱스"],
    stats: [["뉴트리라이트", "글로벌 1위"], ["유기농", "자체 농장"], ["GMP", "품질관리"]],
    home: "https://www.amway.co.kr", q: "암웨이 뉴트리라이트",
  }, {
    name: "조윈", brand: "헬스인슈", sub: "영양제 특별제휴",
    bg: "linear-gradient(125deg,#0F766E 0%,#0D9488 48%,#10B981 100%)",
    tagline: "암·만성질환 환우를 위한 건강기능식품 전문. 건기식 구독+보험 결합(헬스인슈, 국내 최초 특허)으로 맞춤 영양을 설계합니다.",
    strengths: [["eye", "눈 영양제", "루테인·지아잔틴 등 눈 건강"], ["joint", "관절 영양제", "글루코사민·MSM 관절 건강"], ["immune", "암(면역) 영양제", "면역 다당체·항산화 중심"], ["brain", "뇌졸중 영양제", "오메가3·혈행 개선 중심"]],
    chips: ["눈 영양제", "관절 영양제", "암(면역) 영양제", "뇌졸중 영양제", "헬스인슈 구독"],
    stats: [["헬스인슈", "건기식+보험"], ["만성질환", "맞춤 설계"], ["국내 최초", "특허 서비스"]],
    home: "https://www.jowin.co.kr", q: "조윈 건강기능식품 헬스인슈",
  }],
  device: [{
    name: "GN바디닥터", brand: "제너럴네트", sub: "의료기기 특별제휴",
    bg: "linear-gradient(125deg,#0E7490 0%,#0891B2 48%,#6366F1 100%)",
    tagline: "식약처·FDA 인증 가정용 의료기기 전문. 가정에서 안전하게 쓰는 검증된 헬스케어 기기를 공급합니다.",
    strengths: [["badge", "식약처·FDA 인증", "허가받은 가정용 의료기기"], ["device", "헬스케어 기기", "요실금치료기·EMS·고주파"], ["home", "가정용 케어", "집에서 쓰는 전문 기기"], ["badge", "품질·AS", "제조·품질·사후관리"]],
    chips: ["요실금 치료기", "EMS 벨트", "고주파 리페어", "음파 매트"],
    stats: [["식약처·FDA", "인증"], ["가정용", "의료기기"], ["제너럴네트", "GN그룹"]],
    home: "https://www.bodydoctor.co.kr", q: "GN바디닥터 가정용 의료기기",
  }],
};
const SHOP_BRANDS = {
  diet: [
    ["닥터키친", "질환별 맞춤 식단"], ["프레시지", "헬스밀·밀키트"],
    ["hy(한국야쿠르트) 잇츠온", "간편 건강식·반찬"], ["매일유업 셀렉스", "단백질·시니어 케어푸드"], ["아워홈 케어플러스", "연화식·환자식"],
    ["CJ프레시웨이", "케어푸드·단체급식"], ["본아이에프(본죽)", "죽·환자 회복식"], ["동원 더반찬&", "건강 간편식"], ["스파오/잇메이트", "닭가슴살·고단백식"],
  ],
  supp: [
    ["종근당건강", "락토핏·프로바이오틱스"], ["JW중외제약", "제약사 건강기능식품·간 건강"], ["GC녹십자(녹십자웰빙)", "면역·종합 영양"], ["유한양행", "종합비타민·오메가3"],
    ["한미약품", "건강기능식품 라인업"], ["대웅제약", "간 건강·비타민"], ["일동제약", "유산균·종합비타민"],
    ["정관장(KGC인삼공사)", "홍삼·면역"], ["고려은단", "비타민C·종합"], ["안국약품", "눈·관절 영양제"], ["광동제약", "비타민·건강음료"],
  ],
  device: [
    ["인바디(InBody)", "체성분 분석기"], ["오므론(OMRON)", "혈압계·혈당계"], ["휴비딕", "체온계·혈압계"],
    ["셀바스헬스케어(메디체크)", "혈압·체성분"], ["자원메디칼", "혈당측정기"], ["메디아나", "환자모니터·제세동기"],
    ["세라젬", "척추온열 의료기"], ["바디프랜드", "안마의자·헬스케어"], ["휴테크", "안마의자"], ["코지마", "안마·온열 기기"],
  ],
};
const SHOP_AI = [
  ["영양제", "capsule", "밀크씨슬(실리마린)", "간세포 보호·항산화 — 간 건강 기능성", "간 생체나이 54.4세·췌장 경고 → 간 기능 관리 우선", "JW중외제약 · 조윈", "#7C3AED", "#F1ECFE"],
  ["영양제", "brain", "오메가3 (EPA·DHA)", "혈중 중성지방 개선·혈행·기억력 도움", "뇌·심혈관 위험 예방", "조윈 뇌졸중 영양제", "#2563EB", "#E8F1FE"],
  ["영양제", "capsule", "혈당 케어 (바나바·여주·아연)", "식후 혈당 상승 억제에 도움", "당뇨병 위험 동년배 대비 +6.2%", "JW중외제약", "#F59E0B", "#FEF3E2"],
  ["영양제", "eye", "루테인·지아잔틴", "황반색소 밀도 유지 — 눈 건강", "50대 눈 노화·시력 관리", "조윈 눈 영양제", "#16A34A", "#E7F8EE"],
  ["영양제", "joint", "글루코사민·MSM·보스웰리아", "관절·연골 건강과 유연성", "중년 관절 건강 관리", "조윈 관절 영양제", "#0D9488", "#CCFBF1"],
  ["영양제", "immune", "면역 다당체·베타글루칸", "면역세포 활성·항산화", "췌장암 경고 등 암 위험 대비 면역 관리", "조윈 암(면역) 영양제", "#DB2777", "#FCE7F3"],
  ["건강식단", "meal", "저당·고식이섬유 맞춤식단", "혈당·체중·복부비만 관리", "당뇨 위험·대사증후군 관리", "풀무원 디자인밀", "#16A34A", "#E7F8EE"],
  ["건강식단", "leaf", "간 건강 식단(저지방·채소·식물성 단백)", "간 부담↓·항산화 식이", "간·췌장 생체나이 높음", "풀무원", "#7C3AED", "#F1ECFE"],
  ["의료기기", "device", "연속혈당측정기(CGM)·혈당계", "실시간 혈당 추적·식이 피드백", "당뇨 위험 일상 모니터링", "자원메디칼 · 오므론", "#F59E0B", "#FEF3E2"],
  ["의료기기", "heartpulse", "가정용 자동 혈압계", "고혈압·심혈관 일상 모니터링", "심뇌혈관 위험 관리", "오므론 · 휴비딕", "#EF4444", "#FDECEC"],
  ["의료기기", "device", "체성분 분석기", "근육·체지방·복부비만 추적", "비만·대사 관리", "인바디 · GN바디닥터", "#0E7490", "#E0F2FE"],
];

/* ── 사단법인 정밀영양협회 권위 배너 (건강쇼핑 상단) ── */
function PnLogo() {
  return (
    <svg className="em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="사단법인 정밀영양협회 로고">
      <defs><linearGradient id="pnEm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F5BEA" /><stop offset="1" stopColor="#0EA5E9" /></linearGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#pnEm)" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
      <path d="M33 16c10 8 10 24 0 32c-10-8-10-24 0-32z" fill="#fff" />
      <path d="M33 21v22" stroke="#2F5BEA" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M33 29l5-4M33 35l5-4M33 29l-5-4M33 35l-5-4" stroke="#2F5BEA" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="46.5" cy="20" r="3.4" fill="#fff" /><circle cx="46.5" cy="20" r="1.5" fill="#0EA5E9" />
    </svg>
  );
}
function PrecisionNutritionSection() {
  const SITE = "https://precision-nutrition.kr/";
  const checks = ["전문가 검증 제품", "과학적 근거 기반 추천", "개인 맞춤형 영양관리", "건강검진 데이터 기반 추천"];
  return (
    <section className="pnsec" aria-label="사단법인 정밀영양협회 인증 안내">
      <div className="pnban">
        <div className="pnban-top">
          <div className="pnlogo">
            <PnLogo />
            <div>
              <div className="en">Precision Nutrition Association</div>
              <div className="nm">사단법인 정밀영양협회</div>
              <div className="ds">Health-InsurFin Tech의 건강쇼핑은 사단법인 정밀영양협회의 전문적인 자문과 검증을 거쳐 추천 및 인증된 제품만을 엄선하여 제공합니다.</div>
            </div>
          </div>
          <div className="pngrid">
            {checks.map((c) => <div className="it" key={c}><span className="ic"><Check size={17} /></span><b>{c}</b></div>)}
          </div>
        </div>
        <div className="pncta">
          {!EXTERNAL_OK && <span className="nt">미리보기에선 링크 우클릭 → ‘새 탭에서 열기’</span>}
          <a href={SITE} target="_blank" rel="noreferrer noopener">사단법인 정밀영양협회 소개 <ExternalLink size={13} /></a>
        </div>
      </div>
      <div className="pnlede"><h3>회원 개개인의 건강상태, 생활습관, 건강검진 결과 및 영양학적 특성을 종합적으로 분석하여 최적의 맞춤형 건강 솔루션을 제공합니다.</h3></div>
      <div className="pnemph">Health-InsurFin Tech는 <b>사단법인 정밀영양협회</b>의 추천과 인증을 받은 제품만을 엄선하여, 과학적 근거에 기반한 개인 맞춤형 건강관리를 제공합니다.</div>
    </section>
  );
}

function ShopPartnerCard({ p }) {
  return (
    <div className="spcard" style={{ background: p.bg }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="sptag"><Sparkles size={12} /> {p.sub}</span>
        {p.member && <span className="pnmember" title="사단법인 정밀영양협회 회원사"><PnLogo /> 정밀영양협회 회원사</span>}
        <span className="pncert" title="사단법인 정밀영양협회 인증"><ShieldCheck size={12} /> Precision Nutrition Certified</span>
      </div>
      <div className="spname">{p.name}{p.brand && <span> · {p.brand}</span>}</div>
      <div className="spsub">{p.tagline}</div>
      <div className="spgrid">
        {p.strengths.map(([a, t, d], i) => <div className="spitem" key={i}><span className="si"><Art name={a} size={22} /></span><div><b>{t}</b><p>{d}</p></div></div>)}
      </div>
      {p.chips && <div className="spchips">{p.chips.map((c) => <span key={c}>{c}</span>)}</div>}
      <div className="spstats">{p.stats.map(([v, k], i) => <div key={i}><b>{v}</b><span>{k}</span></div>)}</div>
      <div className="spbtns">
        <a className="pri" href={p.home} target="_blank" rel="noreferrer noopener"><MonitorSmartphone size={15} /> 공식 홈페이지 <ExternalLink size={12} /></a>
        <a className="ghost" href={naverHref(p.name, p.q)} target="_blank" rel="noreferrer noopener"><Search size={15} /> 제품·후기 검색</a>
      </div>
      <div className="spnote">※ 특별제휴 혜택(전용 할인·구독·검진 연계)은 협의에 따라 적용됩니다. 외부 링크는 새 창에서 열립니다{!EXTERNAL_OK && " (미리보기에선 우클릭 → 새 탭)"}.</div>
    </div>
  );
}

/* ── 정밀영양협회 회원사 대표 제품 (쇼핑몰 형식) ── */
const MEMBER_PRODUCTS = {
  diet: [
    ["매일헬스뉴트리션", "셀렉스 코어프로틴", "중장년 근력·단백질 보충 영양식", "단백질 영양식", "#0B4DA2", "매일 셀렉스 프로틴"],
    ["대상웰라이프", "뉴케어 균형영양식", "식사대용 균형영양·회복 영양식", "균형영양식", "#C0392B", "대상웰라이프 뉴케어"],
    ["메디쏠라", "메디푸드 질환 맞춤식", "당뇨·신장·암 질환별 케어 식단", "질환 케어식", "#0E9F6E", "메디쏠라 메디푸드 식단"],
    ["헤링스", "힐리어리 케어식단", "암환자 1:1 맞춤 식단·영양관리", "암케어 식단", "#1D7AE0", "헤링스 힐리어리"],
    ["지리산청강원", "오행 약선차", "약초 기반 전통 약선 건강차", "건강차", "#4D7C0F", "지리산 청강원 오행차"],
    ["팜킷", "푸드큐 맞춤식단", "AI가 추천하는 개인 맞춤 식단", "AI 맞춤식단", "#7C3AED", "팜킷 푸드큐"],
  ],
  supp: [
    ["유니베라", "알로에 정/겔", "알로에 기반 면역·장 건강", "면역·장건강", "#2E7D32", "유니베라 알로에"],
    ["헤일리온 코리아", "센트룸", "전 연령 종합비타민·미네랄", "종합비타민", "#C2185B", "센트룸 종합비타민"],
    ["한독", "사라플러스", "식이섬유·장 건강 기능성", "장 건강", "#0067AC", "한독 사라플러스"],
    ["알고케어", "맞춤영양 디스펜서", "개인 맞춤 영양제 자동 조합", "개인맞춤 영양", "#1F2937", "알고케어 맞춤영양"],
    ["필워크", "맞춤영양제 구독", "건강설문 기반 개인 맞춤 영양제", "맞춤 구독", "#16A34A", "필워크 맞춤영양제"],
    ["DSM코리아", "라이프스DHA 오메가3", "오메가3·비타민 뉴트리션 원료", "오메가3", "#1A56DB", "DSM 오메가3"],
    ["광헬스케어", "프리미엄 건강기능식품", "면역·항산화 기능성 라인업", "건강기능식품", "#0EA5E9", "광헬스케어 건강기능식품"],
    ["크레놀", "크레놀 건강기능식품", "근거 기반 기능성 건강식품", "건강기능식품", "#EA580C", "크레놀 crenor 건강기능식품"],
    ["제노포커스", "기능성 효소 소재", "프로바이오틱·효소 기능성 소재", "효소·소재", "#1E40AF", "제노포커스 효소"],
    ["바이오뉴트리온", "맞춤영양 솔루션", "데이터 기반 개인 맞춤 영양설계", "맞춤 영양", "#166534", "바이오뉴트리온 맞춤영양"],
    ["디이프", "데이터 맞춤영양", "푸드데이터 기반 영양 추천", "맞춤 영양", "#7C3AED", "디이프 DIIF 맞춤영양"],
  ],
  device: [
    ["LG전자", "퓨리케어 정수기·구독", "건강한 물 토탈케어 정수기 + 정기 방문관리 구독(케어솔루션)", "정수기·구독", "#A50034", "LG 퓨리케어 정수기 구독"],
    ["카카오헬스케어", "파스타(PASTA)", "연속혈당측정 연동 혈당관리", "혈당관리", "#5A4A2E", "카카오헬스케어 파스타 혈당"],
    ["테라젠바이오", "DTC 유전자검사", "유전자 기반 영양·건강 분석", "유전자검사", "#0E7490", "테라젠바이오 유전자검사"],
    ["EDGC", "유전체 분석검사", "유전체 기반 질병·건강 위험분석", "유전체검사", "#1D4ED8", "EDGC 유전체검사"],
    ["두잉랩", "푸드렌즈", "AI 사진 식단분석·칼로리 측정", "AI 식단분석", "#EF4444", "두잉랩 푸드렌즈"],
    ["TLC메디컬그룹", "건강검진·의료 연계", "전문 검진·맞춤 의료 연계", "검진·의료", "#0D9488", "TLC 헬스케어 검진"],
    ["코이헬스케어", "디지털 헬스케어 솔루션", "유전자분석·원격의료 솔루션", "디지털 헬스", "#2563EB", "코이헬스케어"],
    ["NSHC", "헬스 데이터 보안", "건강·의료 데이터 보안 솔루션", "데이터 보안", "#1E293B", "NSHC 헬스케어 보안"],
    ["에스크랩스", "진단·검사 솔루션", "정밀 진단·검사 기반 헬스케어", "진단·검사", "#6D28D9", "ASK Labs 에스크랩스"],
    ["제이앤아이드바이저그룹", "헬스케어 자문", "정밀영양·헬스케어 전문 자문", "전문 자문", "#475569", "제이앤아이 어드바이저그룹"],
  ],
};
function MallCard({ m }) {
  const [brand, product, benefit, cat, col, q] = m;
  return (
    <div className="mcard">
      <div className="mtop" style={{ background: `linear-gradient(135deg, ${col}, ${col}cc)` }}>
        <span className="mtag">{cat}</span>
        <b>{brand}</b>
      </div>
      <div className="mmid">
        <div className="mprod">{product}</div>
        <div className="mben">{benefit}</div>
        <span className="mmem"><BadgeCheck size={10} /> 정밀영양협회 회원사</span>
      </div>
      <a className="mbtn" href={naverHref(brand, q)} target="_blank" rel="noreferrer noopener"><Search size={12} /> 제품 보기 <ExternalLink size={10} /></a>
    </div>
  );
}
/* ── 건강한 물 강조 배너 (LG 퓨리케어 정수기·필터, 건강식단) ── */
function WaterArt() {
  return (
    <svg className="wbimg" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="건강한 물">
      <defs><linearGradient id="wbDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#DBEAFE" /></linearGradient></defs>
      <path d="M48 9c0 0 26 32 26 51a26 26 0 0 1-52 0C22 41 48 9 48 9z" fill="url(#wbDrop)" />
      <path d="M30 58q9-7 18 0t18 0" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 66q9-7 18 0t18 0" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" opacity=".85" />
      <path d="M51 28c8 2 12 9 9 17c-8-2-12-9-9-17z" fill="#22C55E" />
      <path d="M51 28c-2 7 1 13 8 16" fill="none" stroke="#16A34A" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="40" cy="44" r="3" fill="#fff" opacity=".75" />
    </svg>
  );
}
function WaterBanner() {
  return (
    <div className="waterban">
      <span className="wbbubble b1" /><span className="wbbubble b2" />
      <div className="wbwrap">
        <WaterArt />
        <div>
          <span className="wbtag"><PnLogo /> LG전자 · 정밀영양협회 회원사</span>
          <div className="wbname">LG 퓨리케어 정수기 · 필터 <span style={{ fontSize: 11.5, fontWeight: 700, opacity: .9 }}>💧 건강한 물</span></div>
          <div className="wbsub">깨끗하게 정수된 물과 정기 교체 필터(케어솔루션)로 매일의 식사·수분 섭취를 더 건강하게.</div>
        </div>
        <div className="wbbtns">
          <a className="pri" href={naverHref("LG 퓨리케어 정수기", "LG 퓨리케어 정수기 필터")} target="_blank" rel="noreferrer noopener"><Search size={13} /> 정수기·필터</a>
          <a className="ghost" href={naverHref("LG 퓨리케어 구독", "LG 퓨리케어 케어솔루션 구독")} target="_blank" rel="noreferrer noopener"><RefreshCw size={13} /> 구독 안내</a>
        </div>
      </div>
    </div>
  );
}
function MemberMall({ catKey }) {
  const items = MEMBER_PRODUCTS[catKey] || [];
  if (!items.length) return null;
  return (
    <>
      <div className="bklbl" style={{ margin: "12px 0 8px" }}><BadgeCheck size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 정밀영양협회 회원사 대표 제품 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· {items.length}곳 · 쇼핑몰</span></div>
      <div className="mallgrid">{items.map((m) => <MallCard key={m[0]} m={m} />)}</div>
      <div className="chnote" style={{ marginBottom: 4 }}>※ 사단법인 정밀영양협회 회원사의 <b>대표 제품 예시</b>입니다. 제품·가격·구매는 각 브랜드 공식몰/검색으로 연결됩니다(외부 링크 새 창{!EXTERNAL_OK && " · 미리보기에선 우클릭 → 새 탭"}). 회원사·제품 구성은 운영 정책에 따라 달라질 수 있습니다.</div>
    </>
  );
}
function ShopPartnerCardSm({ p }) {
  return (
    <div className="spcard sm" style={{ background: p.bg }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="sptag"><Sparkles size={11} /> {p.sub}</span>
        {p.member && <span className="pnmember"><PnLogo /> 정밀영양협회 회원사</span>}
      </div>
      <div className="spname">{p.name}{p.brand && <span> · {p.brand}</span>}</div>
      <div className="spsub">{p.tagline}</div>
      {p.chips && <div className="spchips">{p.chips.map((c) => <span key={c}>{c}</span>)}</div>}
      <div className="spbtns">
        <a className="pri" href={p.home} target="_blank" rel="noreferrer noopener"><MonitorSmartphone size={13} /> 공식몰 <ExternalLink size={11} /></a>
        <a className="ghost" href={naverHref(p.name, p.q)} target="_blank" rel="noreferrer noopener"><Search size={13} /> 검색</a>
      </div>
    </div>
  );
}

function ShopCategory({ catKey, label }) {
  const partners = SHOP_PARTNERS[catKey] || [];
  const brands = SHOP_BRANDS[catKey] || [];
  const compact = catKey === "diet" || catKey === "supp"; // 특별제휴 50% 축소
  return (
    <>
      <div className="bklbl" style={{ margin: "2px 0 8px" }}><Sparkles size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> {label} 특별제휴사</div>
      {compact
        ? <div className="spsm-grid">{partners.map((p) => <ShopPartnerCardSm key={p.name} p={p} />)}</div>
        : partners.map((p) => <ShopPartnerCard key={p.name} p={p} />)}
      {catKey === "diet" && <WaterBanner />}
      <MemberMall catKey={catKey} />
      <div className="bklbl" style={{ margin: "6px 0 8px" }}><Star size={14} color="#F59E0B" style={{ verticalAlign: "-2px" }} /> 그 외 유력 {label} 브랜드 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 평판·인지도 기준 예시 {brands.length}곳</span></div>
      {brands.map(([n, s], i) => (
        <div className="brandrow" key={n}>
          <span className={`rk ${i < 3 ? "top" : ""}`}>{i + 1}</span>
          <div><div className="bn">{n}</div><div className="bs">{s}</div></div>
          <a className="hlink bl" href={naverHref(n, label)} target="_blank" rel="noreferrer noopener"><Search size={13} /> 검색 <ExternalLink size={11} /></a>
        </div>
      ))}
      <div className="chnote">※ 위 순서는 시장 인지도·평판을 참고한 <b>예시</b>이며 공식 순위가 아닙니다. 브랜드 정보·후기는 네이버 검색으로 연결됩니다. 실제 제휴·입점사는 운영 정책에 따라 달라질 수 있습니다.</div>
    </>
  );
}

function ShopAIRec() {
  const fields = ["영양제", "건강식단", "의료기기"];
  const fcolor = { "영양제": ["#7C3AED", "#F1ECFE"], "건강식단": ["#16A34A", "#E7F8EE"], "의료기기": ["#0E7490", "#E0F2FE"] };
  return (<>
    <div className="airec">
      <div className="at"><Sparkles size={16} color="#7C3AED" /> 조성래님 맞춤 건강제품 추천</div>
      <div className="ap">프롬에이지 Premium 리포트(생체나이 52.5세 · 췌장암 경고 · 간 54.4세 · 당뇨 위험 ↑)를 분석해, 분야별로 꼭 필요한 제품과 그 효과·효능을 추천해 드려요.</div>
      <div className="pnverify"><ShieldCheck size={13} /> 본 제품들은 사단법인 정밀영양협회의 검증 기준을 통과한 제품입니다.</div>
    </div>
    {fields.map((f) => {
      const items = SHOP_AI.filter((x) => x[0] === f);
      const [fc, fb] = fcolor[f];
      return (
        <div className="card" key={f}>
          <div className="rct" style={{ marginBottom: 10 }}><Tag size={17} color={fc} /> {f} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>· {items.length}종 추천</span></div>
          <div className="airecg">
            {items.map(([, art, prod, benefit, why, partner, col, bg], i) => (
              <div className="aireccard" key={i}>
                <span className="af" style={{ color: fc, background: fb }}>{f}</span>
                <div className="ap2"><span style={{ width: 32, height: 32, borderRadius: 9, background: "#fff", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 2px 6px -2px rgba(0,0,0,.18)" }}><Art name={art} size={22} /></span>{prod}</div>
                <div className="ab"><b style={{ color: "#27324A" }}>효과·효능</b> — {benefit}</div>
                <div className="aw"><b>추천 이유</b> · {why}</div>
                <div className="apt"><BadgeCheck size={12} style={{ verticalAlign: "-2px" }} /> 추천 제휴/브랜드: {partner}</div>
                <div className="pnbadges"><span className="b ai"><Sparkles size={10} /> AI 추천</span><span className="b ex"><BadgeCheck size={10} /> 전문가 추천</span><span className="b pn"><ShieldCheck size={10} /> 정밀영양 인증</span></div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
    <div className="chnote">※ <b>건강기능식품은 질병의 예방·치료를 위한 의약품이 아닙니다.</b> 효능은 일반적 기능성 정보이며 개인차가 있습니다. 의약품 복용 중이거나 질환이 있는 경우 섭취 전 전문가와 상담하세요. 의료기기는 사용 전 사용방법·주의사항을 확인하세요. 본 추천은 조성래님 리포트 기반 참고용입니다.</div>
  </>);
}

/* ── 스포츠건강 (골프예약·헬스서비스·스포츠용품 브랜드 + 종목별 구매) ── */
const SPORTS_GOLF = [
  ["스마트스코어", "골프장 부킹·스코어·간편결제", "https://www.smartscore.kr/", "linear-gradient(135deg,#0FA968,#14B8A6)", "#fff"],
  ["카카오 골프예약", "카카오로 티타임 간편 예약", "https://golf.kakao.com/", "linear-gradient(135deg,#FEE500,#F6DE00)", "#3C1E1E"],
  ["XGOLF", "전국 골프장 예약·특가 부킹", "https://www.xgolf.com/", "linear-gradient(135deg,#1D4ED8,#3B82F6)", "#fff"],
  ["김캐디", "실시간 그린피 예약·결제", "https://www.kimcaddie.com/", "linear-gradient(135deg,#0E9F6E,#16A34A)", "#fff"],
];
const SPORTS_FIT = [
  ["스포애니", "24시간 무인 헬스장 멤버십 등록", "https://www.spoany.co.kr/", "linear-gradient(135deg,#DC2626,#F43F5E)", "#fff"],
  ["커브스", "여성전용 30분 순환운동", naverHref("커브스", "피트니스 등록"), "linear-gradient(135deg,#7C3AED,#A855F7)", "#fff"],
  ["헬스장·PT·필라테스", "내 주변 운동시설 찾기·등록", naverHref("헬스장 PT 필라테스 요가", "등록"), "linear-gradient(135deg,#2563EB,#0EA5E9)", "#fff"],
];
const SPORTS_GOODS = [
  ["데카트론", "스포츠용품 종합 (가성비)", "https://www.decathlon.co.kr/", "linear-gradient(135deg,#0082C3,#0EA5E9)", "#fff"],
  ["나이키", "러닝·트레이닝 슈즈·웨어", "https://www.nike.com/kr/", "linear-gradient(135deg,#111827,#374151)", "#fff"],
  ["아디다스", "스포츠 슈즈·웨어", "https://www.adidas.co.kr/", "linear-gradient(135deg,#1F2937,#4B5563)", "#fff"],
  ["무신사", "스포츠·애슬레저 패션", "https://www.musinsa.com/", "linear-gradient(135deg,#0F172A,#334155)", "#fff"],
];
function SportPartnerGroup({ label, ic: Ic, color, items }) {
  return (<>
    <div className="bklbl" style={{ margin: "8px 0 8px" }}><Ic size={14} color={color} style={{ verticalAlign: "-2px" }} /> {label}</div>
    <div className="sppgrid">
      {items.map(([nm, desc, href, bg, tc]) => (
        <a className="sppartner" key={nm} href={href} target="_blank" rel="noreferrer noopener">
          <div className="sppthumb" style={{ background: bg, color: tc || "#fff" }}><span>{nm}</span></div>
          <div className="sppinfo"><b>{nm}</b><p>{desc}</p><span className="sppgo" style={{ color }}>예약·구매 바로가기 <ExternalLink size={11} /></span></div>
        </a>
      ))}
    </div>
  </>);
}
function SportsHealth() {
  const shopHref = (q) => "https://search.shopping.naver.com/search/all?query=" + encodeURIComponent(q);
  const buy = [
    [Activity, "라켓스포츠", "테니스·배드민턴·스쿼시 라켓·셔틀콕·공", "라켓스포츠 테니스 배드민턴 라켓", "#0E7490", "#E0F2FE"],
    [Star, "골프/파크골프", "골프·파크골프 클럽·공·웨어·액세서리", "골프 파크골프 용품 클럽 공", "#16A34A", "#E7F8EE"],
    [Footprints, "런닝", "러닝화·러닝웨어·GPS워치·기능성 양말", "러닝화 러닝용품 러닝웨어", "#F59E0B", "#FEF3E2"],
    [TrendingUp, "라이딩", "자전거·헬멧·라이딩웨어·자전거 용품", "자전거 라이딩용품 자전거 헬멧", "#EF4444", "#FDECEC"],
    [Flame, "구기스포츠", "축구·농구·배구·야구·풋살 용품·공", "구기스포츠 축구 농구 배구 야구 용품", "#7C3AED", "#F1ECFE"],
  ];
  return (<>
    <div className="sportintro"><Activity size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} /><div>운동으로 건강을 관리하세요. 아래 브랜드 카드를 누르면 각 <b>공식 예약·구매 사이트</b>로 바로 이동해 실제 예약·결제를 진행할 수 있습니다.</div></div>
    <SportPartnerGroup label="골프예약" ic={CalendarCheck} color="#16A34A" items={SPORTS_GOLF} />
    <SportPartnerGroup label="헬스서비스 (헬스장·운동시설)" ic={Dumbbell} color="#2563EB" items={SPORTS_FIT} />
    <SportPartnerGroup label="스포츠용품" ic={ShoppingCart} color="#7C3AED" items={SPORTS_GOODS} />
    <div className="bklbl" style={{ margin: "16px 0 8px" }}><ShoppingCart size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> 구매 — 종목별 스포츠용품 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 네이버쇼핑 실구매 연결</span></div>
    <div className="sportbuygrid">
      {buy.map(([Ic, t, d, q, col, bg]) => (
        <a className="buycard" key={t} href={shopHref(q)} target="_blank" rel="noreferrer noopener" style={{ borderColor: col + "55" }}>
          <span className="bi" style={{ background: bg, color: col }}><Ic size={22} /></span>
          <div className="bt">{t}</div>
          <div className="bd">{d}</div>
          <span className="bgo" style={{ color: col }}>구매하러 가기 <ChevronRight size={12} /></span>
        </a>
      ))}
    </div>
    <div className="chnote">※ 각 브랜드 카드는 해당 <b>외부 공식 사이트/쇼핑</b>으로 연결됩니다(새 창{!EXTERNAL_OK && " · 미리보기에선 우클릭 → 새 탭"}). 표기된 브랜드는 외부 서비스 안내이며 정식 제휴 여부와 무관할 수 있고, 정확한 제휴사·URL은 운영 정책에 따라 조정됩니다.</div>
  </>);
}

function ShopSection() {
  const [cat, setCat] = useState("diet");
  const cats = [["diet", "건강식단", Salad], ["supp", "영양제", Pill], ["device", "의료기기", Stethoscope], ["ai", "AI 추천상품", Sparkles], ["sports", "스포츠건강", Activity]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="shop" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강쇼핑</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강식단 · 영양제 · 의료기기 · 스포츠건강 — 특별제휴사와 유력 브랜드, 내 건강상태 맞춤 AI 추천</div></div></div>
      <PrecisionNutritionSection />
      <div className="chtabs">{cats.map(([k, t, Ic]) => <div key={k} className={`chtab ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}><Ic size={15} /> {t}</div>)}</div>
      {cat === "diet" && <ShopCategory catKey="diet" label="건강식단" />}
      {cat === "supp" && <ShopCategory catKey="supp" label="영양제" />}
      {cat === "device" && <ShopCategory catKey="device" label="의료기기" />}
      {cat === "ai" && <ShopAIRec />}
      {cat === "sports" && <SportsHealth />}
    </div>
  );
}

/* ====================== HOME ====================== */
/* ====================== 보험·치료비 ====================== */
