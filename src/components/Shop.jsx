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
    name: "한국암웨이", brand: "뉴트리라이트", sub: "영양제 특별제휴", member: true, pharmacyFind: true,
    bg: "linear-gradient(125deg,#0B3D91 0%,#1A56DB 48%,#2563EB 100%)",
    tagline: "글로벌 1위 비타민 브랜드 뉴트리라이트 — 자체 유기농 농장 원료와 식물영양소 중심의 종합 영양 설계.",
    strengths: [["badge", "글로벌 1위 영양제", "뉴트리라이트 종합비타민·미네랄"], ["leaf", "유기농 원료", "자체 인증 농장 식물영양소"], ["capsule", "종합 라인업", "더블엑스·오메가·프로바이오틱"], ["doc", "과학적 근거", "연구·품질 검증 시스템"]],
    chips: ["더블엑스", "종합비타민", "오메가3", "프로바이오틱스"],
    stats: [["뉴트리라이트", "글로벌 1위"], ["유기농", "자체 농장"], ["GMP", "품질관리"]],
    home: "https://www.amway.co.kr", q: "암웨이 뉴트리라이트",
  }, {
    name: "한독", brand: "네이처셋(NatureSet)", sub: "영양제 특별제휴", member: true, pharmacyFind: true,
    bg: "linear-gradient(125deg,#00417A 0%,#0067AC 50%,#2E97D8 100%)",
    tagline: "제약사 한독의 건강기능식품 브랜드 네이처셋 — 여성건강·홍삼·초임계 오메가3·면역비타민 등 근거 기반 종합 영양 라인업.",
    strengths: [["immune", "여성 멀티비타민", "네이처셋 더 액티브 포 우먼(18종)"], ["leaf", "홍삼 애니타임", "6년근 홍삼 면역·활력"], ["brain", "초임계 오메가3", "rTG·초임계 추출 혈행·눈·뇌"], ["capsule", "면역 비타민C 1000", "비타민C·아연 항산화·면역"]],
    chips: ["여성 멀티비타민", "홍삼 애니타임", "초임계 오메가3", "면역 비타민C"],
    stats: [["한독", "제약사 품질"], ["네이처셋", "종합 라인업"], ["GMP", "품질관리"]],
    home: "http://mall.handok.co.kr/", q: "한독 네이처셋 건강기능식품",
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
const PN_TOP = [
  { src: "./data/img/pn-hero.png", alt: "Precision Nutrition — 초개인화 시대의 헬스케어", pos: "50% 45%" },
  { src: "./data/img/pn-vision.png", alt: "사단법인 정밀영양협회 VISION", pos: "10% 50%" },
];
function PrecisionNutritionSection() {
  const SITE = "https://precision-nutrition.kr/";
  const [errs, setErrs] = useState({});
  return (
    <section className="pnsec" aria-label="사단법인 정밀영양협회 인증 안내">
      <div className="pnban">
        <div className="pnbanrow pn2">
          {PN_TOP.map((im, i) => errs[i] ? null : (
            <a className="pnhero" href={SITE} target="_blank" rel="noreferrer noopener" key={i} title="사단법인 정밀영양협회 소개">
              <img src={im.src} alt={im.alt} loading="lazy" style={{ objectPosition: im.pos }} onError={() => setErrs((e) => ({ ...e, [i]: true }))} />
            </a>
          ))}
        </div>
        {!errs.wide && <a className="pnhero pnwide" href={SITE} target="_blank" rel="noreferrer noopener" title="사단법인 정밀영양협회 세미나">
          <img src="./data/img/pn-seminar.png" alt="사단법인 정밀영양협회 세미나(고려대 의대 협력 제2차 세미나)" loading="lazy" style={{ objectPosition: "50% 38%" }} onError={() => setErrs((e) => ({ ...e, wide: true }))} />
        </a>}
        <div className="pncta" style={{ marginTop: 12 }}>
          {!EXTERNAL_OK && <span className="nt">미리보기에선 링크 우클릭 → ‘새 탭에서 열기’</span>}
          <a href={SITE} target="_blank" rel="noreferrer noopener">사단법인 정밀영양협회 소개 <ExternalLink size={13} /></a>
        </div>
      </div>
      <div className="pnintro">
        <div className="pnintro-head">
          <span className="pnintro-badge"><Sparkles size={13} /> Precision Nutrition</span>
          <h3>검진 데이터로 완성하는 <b>나만의 맞춤 건강식단·영양</b></h3>
          <p>회원 개개인의 건강상태·생활습관·검진결과·영양학적 특성을 종합 분석해, 사단법인 정밀영양협회가 검증한 최적의 건강식단·영양 솔루션을 제공합니다.</p>
        </div>
        <div className="pnintro-cards">
          {[
            [Activity, "#2563EB", "#E8F1FE", "건강 데이터 분석", "검진 결과·생활습관·영양학적 특성을 종합 분석"],
            [Salad, "#16A34A", "#E7F8EE", "맞춤 건강식단", "개인별 최적의 저염·저당·균형 케어푸드 설계"],
            [ShieldCheck, "#7C3AED", "#F1ECFE", "정밀영양협회 검증", "전문가 자문·인증을 거친 제품만 엄선 제공"],
            [HeartHandshake, "#E11D48", "#FDECEC", "평생 건강관리", "지속 케어와 건강적립으로 비용 부담 완화"],
          ].map(([Ic, col, bg, t, d], i) => (
            <div className="pnfeat" key={i}>
              <span className="pnfeat-ic" style={{ color: col, background: bg }}><Ic size={23} /></span>
              <div className="pnfeat-t">{t}</div>
              <div className="pnfeat-d">{d}</div>
            </div>
          ))}
        </div>
      </div>
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
/* LG 퓨리케어 정수기·필터 실제 제품 이미지(다나와 CDN, 2026-07 수집) */
const WATER_IMG = {
  purifier: "https://img.danuri.io/catalog-image/067/414/103/8bfecfe2df954be189e460d15a40bf88.jpg",
  filter: "https://img.danuri.io/catalog-image/540/532/019/87bb40e7ff9c4bc6a89e303b97f295b3.jpg",
};
function WaterBanner() {
  const [e1, setE1] = useState(false); const [e2, setE2] = useState(false);
  return (
    <div className="waterban">
      <span className="wbbubble b1" /><span className="wbbubble b2" />
      <div className="wbwrap">
        <WaterArt />
        {(!e1 || !e2) && <div className="wbimgtile">
          {!e1 && <img className="wbimg big" src={WATER_IMG.purifier} alt="LG 퓨리케어 정수기" loading="lazy" onError={() => setE1(true)} />}
          {!e2 && <img className="wbimg sm" src={WATER_IMG.filter} alt="LG 퓨리케어 교체 필터" loading="lazy" onError={() => setE2(true)} />}
        </div>}
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
/* 정밀영양협회 회원사 대표 제품 실제 이미지(2026-07 수집·검증, 다나와/네이버 CDN).
   미확인 회원사는 자동으로 브랜드 그라디언트+이모지 mock으로 대체된다. */
const MEMBER_MEDIA = {
  "유니베라": "https://img.danuri.io/catalog-image/729/546/009/55f87398d7a34899ab8abdaf9ca5d3ed.jpg?shrink=330:*&_v=20260708080439",
  "헤일리온 코리아": "https://img.danuri.io/catalog-image/673/404/120/728c05adfff64f18b14744be33fcca37.jpg?shrink=330:*&_v=20260530073620",
  "제노포커스": "https://shopping-phinf.pstatic.net/main_8660217/86602176863.2.jpg",
  "㈜메디콥": "https://img.danuri.io/catalog-image/929/529/032/c413b9327a5c4071a5013b76a7be69d3.jpg?shrink=330:*&_v=20260708080418",
  // 유사 제품 컷(투자자 데모용) — 상용화 시 각 회원사 실제 대표 제품 이미지로 교체
  "알고케어": "./data/img/supp/algocare.png",
  "필워크": "./data/img/supp/pillwork.png",
  "DSM코리아": "https://img.danuri.io/catalog-image/400/776/017/c52dca764b4d42b1855d12602a7c2503.jpg?shrink=300:300",
  "광헬스케어": "https://img.danuri.io/catalog-image/172/099/019/300cad05c52c4f898fd2c0864b24bb35.jpg?shrink=300:300",
  "바이오뉴트리온": "https://img.danuri.io/catalog-image/354/835/079/1b171659455e47dbacb0c5f059027c34.jpg?shrink=300:300",
  "디이프": "https://img.danuri.io/catalog-image/065/103/056/ec1591c1444141149c27581c9591961b.jpg?shrink=300:300",
  "조윈": "https://img.danuri.io/catalog-image/725/112/017/2dc4b7885c1b481daaf8d1f9e8841a07.jpg?shrink=300:300",
  "크레놀": "https://img.danuri.io/catalog-image/394/677/029/57064cd23a634fb8b99860407fb277af.jpg?shrink=300:300",
};
function memberEmoji(mm) {
  const t = (mm.tag || "") + (mm.type || "") + (mm.product || "");
  if (/상처|의약외품|밴드|스왑|소독/.test(t)) return "🩹";
  if (/효소|소재|프리바이오|GOS/.test(t)) return "🧪";
  if (/오메가|DHA|EPA/.test(t)) return "🐟";
  if (/맞춤|개인|디스펜서|구독|데이터|유전자|앱/.test(t)) return "🧬";
  if (/면역|알로에|장/.test(t)) return "🌿";
  return "💊";
}
function MemberImage({ mm }) {
  const [err, setErr] = useState(false);
  const src = (typeof MEMBER_MEDIA !== "undefined") ? MEMBER_MEDIA[mm.company] : null;
  if (src && !err) return (
    <div className="mthumb">
      <img className="mthumbimg" src={src} alt={mm.product} loading="lazy" onError={() => setErr(true)} />
      <span className="mthumbtag">{mm.tag}</span>
    </div>
  );
  return (
    <div className="mthumb mock" style={{ background: `linear-gradient(150deg, ${mm.col}14, ${mm.col}2b)` }}>
      <span className="mm-emoji">{memberEmoji(mm)}</span>
      <span className="mm-co" style={{ color: mm.col }}>{mm.company}</span>
      <span className="mthumbtag">{mm.tag}</span>
    </div>
  );
}
function MemberCard({ mm }) {
  const hasUrl = mm.url && /^https?:/.test(mm.url);
  const [pharm, setPharm] = useState(false);
  return (
    <div className="mcard">
      <MemberImage mm={mm} />
      <div className="mmid">
        <div className="mcompany">{mm.company}</div>
        <div className="mprod">{mm.product}</div>
        <div className="mben">{mm.desc}</div>
        <div className="mtags2"><span className="mtype">{mm.type}</span><span className="mmem"><BadgeCheck size={10} /> 정밀영양협회 회원사</span></div>
      </div>
      <a className="mbtn" href={hasUrl ? mm.url : naverHref(mm.company, mm.q)} target="_blank" rel="noreferrer noopener">{hasUrl ? <><MonitorSmartphone size={12} /> 공식몰 바로가기 <ExternalLink size={10} /></> : <><Search size={12} /> 제품 검색 <ExternalLink size={10} /></>}</a>
      <button className="mbtn ph" onClick={() => setPharm(true)}><Pill size={12} /> 취급 약국 찾기</button>
      {pharm && <BrandPharmacyModal brand={mm.company} label={mm.product || mm.company} onClose={() => setPharm(false)} />}
    </div>
  );
}
function MemberMall({ catKey }) {
  const members = (catKey === "supp" && typeof SUPP_MEMBERS !== "undefined") ? SUPP_MEMBERS : null;
  if (members) {
    return (
      <>
        <div className="bklbl" style={{ margin: "12px 0 8px" }}><BadgeCheck size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 정밀영양협회 회원사 대표 제품 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· {members.length}곳 · 공식몰 연동</span></div>
        <div className="mallgrid">{members.map((mm) => <MemberCard key={mm.company} mm={mm} />)}</div>
        <div className="chnote" style={{ marginBottom: 4 }}>※ 사단법인 정밀영양협회 회원사의 <b>대표 제품</b>입니다. 공식몰이 확인된 곳은 <b>공식몰로 바로 연결</b>되고, 미확인 회원사는 제품 검색으로 안내됩니다(외부 링크 새 창{!EXTERNAL_OK && " · 미리보기에선 우클릭 → 새 탭"}). 원료·소재(B2B) 회원사 포함이며, 회원사·제품 구성은 운영 정책에 따라 달라질 수 있습니다.</div>
      </>
    );
  }
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
/* ── 브랜드 취급 약국 찾기 (파일럿) ──
   심평원 공공데이터엔 약국별 취급 품목이 없어, 시·군·구별로 지역 규모의 30%(최대 50곳)를
   (브랜드+약국명) 결정적 해시 순위로 선정 → 새로고침해도 결과가 안정적. 실데이터는 유통사·약국 재고 API 연동 시 대체. */
function pnHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function BrandPharmacyModal({ brand, label, onClose }) {
  const { loading, error, data } = useHira();
  const [sido, setSido] = useState("전체");
  const [sgg, setSgg] = useState("전체");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(12);
  const reset = () => setShown(12);
  // 시·군·구별 취급 약국 선정: 지역 약국 수의 30%(최소 1, 최대 50곳)를 해시 순위로 결정적 선택
  const carry = React.useMemo(() => {
    const set = new Set();
    if (!data) return set;
    const byDist = {};
    for (let i = 0; i < data.pharmacies.length; i++) { const p = data.pharmacies[i]; const k = p[1] + "|" + p[2]; (byDist[k] || (byDist[k] = [])).push(i); }
    for (const k in byDist) {
      const idxs = byDist[k];
      const n = Math.min(50, Math.max(1, Math.round(idxs.length * 0.3)));
      if (idxs.length <= n) { for (const i of idxs) set.add(i); continue; }
      const ranked = idxs.map((i) => [i, pnHash(brand + "|" + data.pharmacies[i][0])]).sort((a, b) => a[1] - b[1]);
      for (let j = 0; j < n; j++) set.add(ranked[j][0]);
    }
    return set;
  }, [data, brand]);
  const { sggBySido, countBySido, total } = React.useMemo(() => {
    const m = {}, c = {};
    if (data) for (const i of carry) { const p = data.pharmacies[i]; const s = data.sido[p[1]]; c[s] = (c[s] || 0) + 1; (m[s] || (m[s] = new Set())).add(p[2]); }
    return { sggBySido: m, countBySido: c, total: carry.size };
  }, [data, carry]);
  const sidoChips = React.useMemo(() => data ? ["전체", ...[...data.sido].sort((a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b))] : ["전체"], [data]);
  const sggOptions = React.useMemo(() => (data && sido !== "전체") ? [...(sggBySido[sido] || [])].sort((a, b) => a.localeCompare(b, "ko")) : [], [data, sido, sggBySido]);
  const list = React.useMemo(() => {
    if (!data) return [];
    const sidoIdx = sido === "전체" ? -1 : data.sido.indexOf(sido);
    const qq = q.trim();
    return data.pharmacies.filter((p, i) => carry.has(i) && (sidoIdx < 0 || p[1] === sidoIdx) && (sgg === "전체" || p[2] === sgg) && (!qq || p[0].indexOf(qq) >= 0 || p[3].indexOf(qq) >= 0));
  }, [data, carry, sido, sgg, q]);
  const view = list.slice(0, shown);
  return createPortal(
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15, lineHeight: 1.3 }}><Pill size={16} color="#16A34A" style={{ verticalAlign: -3 }} /> {brand} <span style={{ fontWeight: 600, color: "var(--muted)", fontSize: 12.5 }}>취급 약국 찾기</span></div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          {loading && <div className="hload"><div className="sp" />전국 약국 데이터를 불러오는 중입니다… <div style={{ fontSize: 11.5, marginTop: 4 }}>(심평원, 최초 1회 로딩)</div></div>}
          {error && <div className="hload" style={{ color: "var(--red)" }}><AlertTriangle size={24} style={{ marginBottom: 6 }} /><div>약국 데이터를 불러오지 못했습니다. ({error})</div></div>}
          {data && <>
            <div className="bpsum"><MapPin size={13} color="#16A34A" style={{ verticalAlign: -2 }} /> 전국 <b style={{ color: "#16A34A" }}>{total.toLocaleString()}</b>곳에서 <b>{label || brand}</b> 제품을 취급합니다 <span className="bppilot">파일럿</span></div>
            <div className="bklbl" style={{ margin: "4px 0 8px" }}>지역(시·도) 선택</div>
            <div className="regions">{sidoChips.map((r) => <div key={r} className={`fsel ${sido === r ? "on" : ""}`} onClick={() => { setSido(r); setSgg("전체"); reset(); }}>{r}{r !== "전체" && countBySido[r] ? <span style={{ color: "var(--soft)", fontWeight: 600, marginLeft: 4 }}>{countBySido[r].toLocaleString()}</span> : ""}</div>)}</div>
            <div className="hfilt" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <select value={sgg} onChange={(e) => { setSgg(e.target.value); reset(); }} disabled={sido === "전체"}><option value="전체">{sido === "전체" ? "시·도 먼저 선택" : "시·군·구 전체"}</option>{sggOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <div className="fsearch" style={{ margin: 0 }}><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="약국명·주소 검색" /></div>
            </div>
            <div className="chcount">{sido === "전체" ? "전국" : sido}{sgg !== "전체" ? " " + sgg : ""} 취급 약국 <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳</div>
            {view.map((p, i) => (
              <div className="center" key={i}>
                <div className="cimg" style={{ background: "linear-gradient(150deg,#DCFCE7,#D1FAE5)" }}><Art name="pill" size={40} /></div>
                <div className="cmain">
                  <div className="cname">{p[0]}<span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE" }}><BadgeCheck size={10} /> 취급 확인</span></div>
                  <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{data.sido[p[1]]} {p[2]}</span> · <MapPin size={12} />{p[3]}{p[4] ? <> · <Phone size={12} />{p[4]}</> : null}</div>
                </div>
                <div className="cright">
                  {p[4] ? <a className="hlink" href={`tel:${p[4]}`}><Phone size={13} /> {p[4]}</a> : <span style={{ fontSize: 11.5, color: "var(--soft)" }}>전화정보 없음</span>}
                  <div className="obtns"><a className="hlink" style={{ textDecoration: "none" }} href={naverHref(p[0], data.sido[p[1]] + " " + p[2])} target="_blank" rel="noreferrer noopener"><MapPin size={12} /> 위치·정보</a></div>
                </div>
              </div>
            ))}
            {view.length === 0 && <div className="hload" style={{ marginTop: 8 }}>해당 지역에 취급 약국이 없습니다. 다른 지역을 선택해 보세요.</div>}
            {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 12)}>더 보기 ({(list.length - shown).toLocaleString()}곳 더)</button>}
            <div className="chnote" style={{ marginTop: 4 }}>※ <b>파일럿 서비스</b>입니다. 심평원 공공데이터의 전국 약국({data.meta.pharmacies.toLocaleString()}곳 · {data.meta.asof})을 기반으로 <b>{brand}</b> 취급 약국을 표시합니다. 실제 취급 여부·재고는 <b>유통사(㈜메디콥 등)·약국 재고 API 연동 시</b> 실데이터로 반영됩니다. 방문 전 전화로 재고를 확인하세요.</div>
          </>}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── ㈜메디콥 제품 갤러리 (밴드닥터·클린덤) ──
   이미지는 리포 내부 경로(data/img/medicorp/*)로 연결 → 파일이 있으면 실사진, 없으면 제품 박스 SVG 폴백.
   (밴드닥터 공식몰은 http 전용이라 https 사이트에서 핫링크 불가 → 로컬 이미지 방식) */
const MEDICOP_PRODUCTS = [
  { key: "aqua", name: "밴드닥터 워터프룹 아쿠아 대형", en: "Band Doctor · Waterproof Aqua", spec: "8매 × 10개", price: "6,000", claims: ["방수기능", "상처보호", "통풍작용"], desc: "초박형 완벽한 방수 — 하이드로콜로이드 방수밴드", img: "./data/img/medicorp/banddoctor-aqua.jpg", col: "#1E6FD8", col2: "#0EA5E9", brand: "밴드닥터" },
  { key: "soft", name: "밴드닥터 소프트 스킨 일반", en: "Band Doctor · Soft Skin", spec: "10매 × 10개", price: "5,000", claims: ["고신축성", "상처보호", "통풍작용"], desc: "부드럽고 우수한 밀착력 — 고탄력 원단 상처밴드", img: "./data/img/medicorp/banddoctor-soft.jpg", col: "#DB2777", col2: "#F472B6", brand: "밴드닥터" },
  { key: "swab", name: "메디콥 클린덤 알콜스왑", en: "Alcohol Swab · Clindum", spec: "100매 · 30×35mm", price: "2,500", claims: ["에탄올 80%", "일회용 소독", "개별 포장"], desc: "주사·처치 전 피부 소독용 일회용 알콜솜 (의약외품)", img: "./data/img/medicorp/clindum-swab.jpg", col: "#1E3A8A", col2: "#F59E0B", brand: "메디콥" },
];
function MedProductImg({ p }) {
  const [err, setErr] = useState(false);
  if (!err) return <img className="mgphoto" src={p.img} alt={p.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} />;
  return (
    <svg className="mgphoto" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={p.name}>
      <defs><linearGradient id={`mg-${p.key}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.col} /><stop offset="1" stopColor={p.col2} /></linearGradient></defs>
      <rect width="160" height="120" rx="12" fill={`url(#mg-${p.key})`} />
      <rect x="16" y="18" width="128" height="46" rx="9" fill="#fff" opacity="0.96" />
      <text x="80" y="40" textAnchor="middle" fontSize="15" fontWeight="800" fill={p.col} fontFamily="'Noto Sans KR',sans-serif">{p.brand}</text>
      <text x="80" y="56" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={p.col2} fontFamily="sans-serif">{p.en}</text>
      <text x="80" y="92" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" fontFamily="'Noto Sans KR',sans-serif">{p.spec}</text>
      <circle cx="132" cy="100" r="12" fill="#fff" opacity="0.2" /><circle cx="28" cy="102" r="7" fill="#fff" opacity="0.18" />
    </svg>
  );
}
function ProductGalleryModal({ title, onClose }) {
  return createPortal(
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15, lineHeight: 1.3 }}><Tag size={16} color="#0EA5E9" style={{ verticalAlign: -3 }} /> {title} <span style={{ fontWeight: 600, color: "var(--muted)", fontSize: 12.5 }}>제품 보기</span></div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          <div className="mgrid">
            {MEDICOP_PRODUCTS.map((p) => (
              <div className="mgcard" key={p.key}>
                <div className="mgimg"><MedProductImg p={p} /></div>
                <div className="mgbody">
                  <div className="mgname">{p.name}</div>
                  <div className="mgdesc">{p.desc}</div>
                  <div className="mgchips">{p.claims.map((c) => <span key={c}>{c}</span>)}</div>
                  <div className="mgmeta"><span className="mgspec">{p.spec}</span><b className="mgprice">₩{p.price}</b></div>
                  <a className="mglink" href={naverHref(p.name, "메디콥 " + p.brand)} target="_blank" rel="noreferrer noopener"><Search size={12} /> 제품 검색 <ExternalLink size={10} /></a>
                </div>
              </div>
            ))}
          </div>
          <div className="chnote" style={{ marginTop: 6 }}>※ ㈜메디콥 대표 제품(밴드닥터 방수·습윤 밴드, 클린덤 알콜스왑)입니다. 가격·구성은 판매처·시점에 따라 다를 수 있습니다. 의약외품은 사용 전 사용상 주의사항을 확인하세요. 제품 취급 약국은 카드의 <b>취급 약국 찾기</b>에서 확인할 수 있습니다.</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const SP_PROD_IMG = { "풀무원": "m-designmeal", "현대그린푸드": "m-greating" };
/* 특별제휴 제품 이미지 직접 URL(다나와 CDN) — MEAL_MEDIA 키가 없는 브랜드용 */
const SP_PROD_URL = {
  "한국암웨이": "./data/img/supp/amway.png",
  "한독": "./data/img/supp/handok.png",
};
function ShopPartnerCardSm({ p }) {
  const [pharm, setPharm] = useState(false);
  const [gal, setGal] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const imgKey = SP_PROD_IMG[p.name];
  const directUrl = (typeof SP_PROD_URL !== "undefined") ? SP_PROD_URL[p.name] : null;
  const prodImg = imgErr ? null : (directUrl || ((imgKey && typeof MEAL_MEDIA !== "undefined") ? MEAL_MEDIA[imgKey] : null));
  return (
    <div className="spcard sm" style={{ background: p.bg }}>
      {prodImg && <div className="sppimg"><img src={prodImg} alt={`${p.name} ${p.brand || ""} 제품`} loading="lazy" onError={() => setImgErr(true)} /></div>}
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
      {p.gallery && <button className="bpfind galbtn" onClick={() => setGal(true)}><Tag size={13} /> 밴드닥터·클린덤 제품 보기</button>}
      {p.pharmacyFind && <button className="bpfind" onClick={() => setPharm(true)}><Pill size={13} /> 이 브랜드 취급 약국 찾기</button>}
      {pharm && <BrandPharmacyModal brand={p.name} label={p.brand || p.name} onClose={() => setPharm(false)} />}
      {gal && <ProductGalleryModal title={p.name} onClose={() => setGal(false)} />}
    </div>
  );
}

function ShopCategory({ catKey, label, hideBrands }) {
  const partners = SHOP_PARTNERS[catKey] || [];
  const brands = hideBrands ? [] : (SHOP_BRANDS[catKey] || []);
  const compact = catKey === "diet" || catKey === "supp"; // 특별제휴 50% 축소
  return (
    <>
      <div className="bklbl" style={{ margin: "2px 0 8px" }}><Sparkles size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> {label} 특별제휴사</div>
      {compact
        ? <div className="spsm-grid">{partners.map((p) => <ShopPartnerCardSm key={p.name} p={p} />)}</div>
        : partners.map((p) => <ShopPartnerCard key={p.name} p={p} />)}
      {catKey === "diet" && <WaterBanner />}
      <MemberMall catKey={catKey} />
      {!hideBrands && (<>
        <div className="bklbl" style={{ margin: "6px 0 8px" }}><Star size={14} color="#F59E0B" style={{ verticalAlign: "-2px" }} /> 그 외 유력 {label} 브랜드 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 평판·인지도 기준 예시 {brands.length}곳</span></div>
        {brands.map(([n, s], i) => (
          <div className="brandrow" key={n}>
            <span className={`rk ${i < 3 ? "top" : ""}`}>{i + 1}</span>
            <div><div className="bn">{n}</div><div className="bs">{s}</div></div>
            <a className="hlink bl" href={naverHref(n, label)} target="_blank" rel="noreferrer noopener"><Search size={13} /> 검색 <ExternalLink size={11} /></a>
          </div>
        ))}
        <div className="chnote">※ 위 순서는 시장 인지도·평판을 참고한 <b>예시</b>이며 공식 순위가 아닙니다. 브랜드 정보·후기는 네이버 검색으로 연결됩니다. 실제 제휴·입점사는 운영 정책에 따라 달라질 수 있습니다.</div>
      </>)}
    </>
  );
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

/* ===== 건강쇼핑 — 영양제 상품몰(건강적립금 판매가 25%) ===== */
const shopWon = (n) => (Number(n) || 0).toLocaleString("ko-KR") + "원";
const suppMedia = (id) => (typeof SUPP_MEDIA !== "undefined" && SUPP_MEDIA[id]) || {};
/* 국내 최저가 검색 링크 — 다나와(가격비교) 우선, 없으면 네이버쇼핑 낮은가격순 */
function shopLowestHref(p) {
  const dan = suppMedia(p.id).danawa; if (dan) return dan;
  const q = encodeURIComponent(((p.name || "") + " " + (p.brand || "")).trim());
  return "https://search.shopping.naver.com/search/all?query=" + q + "&sort=price_asc";
}
/* ============ 실시간 국내 최저가 연동 커넥터 (활성화 가능하도록 설계) ============
   ▸ 활성화 방법(상용 전환): mode를 "live"로 바꾸고 proxyUrl에 백엔드 프록시 주소만 넣으면 됩니다.
     - 네이버쇼핑 오픈API(GET /v1/search/shop.json?query=&sort=asc)·다나와는 API 키 보호와 CORS 때문에
       브라우저에서 직접 호출할 수 없어 서버(프록시)를 경유합니다. 프록시가 { price, mallName, link } 반환.
   ▸ mode "demo": 백엔드 없이 동작을 시연(수집가 대비 -3~-8% 결정적 시뮬레이션, ‘예시’ 표기).
   ▸ mode "off": 수집 표시가만 사용(실시간 조회 비활성). */
const PRICE_FEED_CFG = {
  mode: "demo",            // "off" | "demo" | "live"
  provider: "naver",       // "naver" | "danawa"
  proxyUrl: "",            // live 전환 시 필수. 예: "https://api.hi-fintech.com/price"
  ttlMs: 1000 * 60 * 30,   // 캐시 30분
};
function priceCacheGet(id) {
  try { const o = JSON.parse(sessionStorage.getItem("hifin_price_" + id) || "null"); if (o && (Date.now() - o.ts) < PRICE_FEED_CFG.ttlMs) return o; } catch (e) {} return null;
}
function priceCacheSet(id, o) { try { sessionStorage.setItem("hifin_price_" + id, JSON.stringify(o)); } catch (e) {} }
function demoLowest(p) {
  const seed = String(p.id || p.name || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const disc = 0.03 + (seed % 6) * 0.01; // 3~8% (결정적)
  const price = Math.max(1000, Math.round((p.price * (1 - disc)) / 10) * 10);
  const malls = ["네이버쇼핑", "쿠팡", "다나와", "G마켓", "11번가"];
  return { price, mall: malls[seed % malls.length], link: shopLowestHref(p), ts: Date.now(), demo: true };
}
async function fetchLowestPrice(p) {
  const cfg = PRICE_FEED_CFG;
  if (!p || cfg.mode === "off") return null;
  const cached = priceCacheGet(p.id); if (cached) return cached;
  let result = null;
  if (cfg.mode === "demo") { result = demoLowest(p); }
  else if (cfg.mode === "live" && cfg.proxyUrl) {
    try {
      const u = cfg.proxyUrl + "?provider=" + cfg.provider + "&sort=asc&query=" + encodeURIComponent(((p.name || "") + " " + (p.brand || "")).trim());
      const res = await fetch(u); const j = await res.json();
      if (j && j.price) result = { price: Math.round(j.price), mall: j.mallName || cfg.provider, link: j.link || shopLowestHref(p), ts: Date.now(), live: true };
    } catch (e) { result = null; }
  }
  if (result) priceCacheSet(p.id, result);
  return result;
}
function priceFeedLabel() {
  const m = PRICE_FEED_CFG.mode;
  return m === "live" ? "실시간 연동(네이버쇼핑·다나와)" : m === "demo" ? "실시간 최저가 조회 — 데모 시뮬레이션" : "실시간 연동 비활성";
}
/* 제품 이미지 — 실제 상품 이미지(다나와 CDN) 우선, 로드 실패 시 성분 컬러 SVG로 폴백 */
function SuppImage({ p }) {
  const [imgErr, setImgErr] = useState(false);
  const media = suppMedia(p.id);
  if (media.image && !imgErr) return <img className="pimgphoto" src={media.image} alt={`${p.brand} ${p.name}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setImgErr(true)} />;
  const m = (typeof SUPP_CATS !== "undefined" && SUPP_CATS[p.category]) || { col: "#7C3AED" };
  const col = m.col, gid = "sg-" + p.id;
  const pouch = /포|스틱/.test(p.volume || "");
  const brand = (p.brand || "").length > 8 ? p.brand.slice(0, 8) : p.brand;
  const nm = (p.name || "").replace(/\(.*\)/, "").trim();
  const name = nm.length > 9 ? nm.slice(0, 9) : nm;
  return (
    <svg viewBox="0 0 132 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${p.brand} ${p.name} 제품 이미지`}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} /><stop offset="1" stopColor={col} stopOpacity="0.7" /></linearGradient></defs>
      {pouch ? (
        <g><rect x="38" y="14" width="56" height="90" rx="9" fill={`url(#${gid})`} /><rect x="38" y="14" width="56" height="10" rx="4" fill={col} /><path d="M40 20 h52" stroke="#fff" strokeOpacity=".45" strokeWidth="1" strokeDasharray="2 3" /></g>
      ) : (
        <g><rect x="54" y="8" width="24" height="12" rx="4" fill={col} /><rect x="57" y="18" width="18" height="8" fill={col} opacity=".92" /><rect x="40" y="24" width="52" height="80" rx="13" fill={`url(#${gid})`} /></g>
      )}
      <rect x={pouch ? 44 : 46} y="44" width={pouch ? 44 : 40} height="46" rx="6" fill="#fff" />
      <rect x={pouch ? 52 : 53} y="50" width="14" height="7" rx="3.5" fill={col} opacity=".22" />
      <rect x={pouch ? 52 : 53} y="50" width="7" height="7" rx="3.5" fill={col} />
      <text x={pouch ? 66 : 66} y="70" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#334155" fontFamily="system-ui,'Malgun Gothic',sans-serif">{brand}</text>
      <text x={pouch ? 66 : 66} y="81" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={col} fontFamily="system-ui,'Malgun Gothic',sans-serif">{name}</text>
      <text x={pouch ? 66 : 66} y="90" textAnchor="middle" fontSize="6" fill="#94A3B8" fontFamily="system-ui,'Malgun Gothic',sans-serif">{p.volume}</text>
    </svg>
  );
}
/* ── 공유 장바구니 스토어 — 영양제몰과 당당상담 AI가 같은 카트를 사용 ── */
let _shopCart = {};
const _shopCartSubs = new Set();
function _shopCartNotify() { _shopCartSubs.forEach((f) => { try { f(); } catch (e) {} }); }
function shopCartAdd(id, q) { _shopCart = Object.assign({}, _shopCart, { [id]: (_shopCart[id] || 0) + (q || 1) }); _shopCartNotify(); }
function shopCartSetQty(id, q) { const n = Object.assign({}, _shopCart); if (q <= 0) delete n[id]; else n[id] = q; _shopCart = n; _shopCartNotify(); }
function shopCartClear() { _shopCart = {}; _shopCartNotify(); }
function useShopCart() { const [, force] = useState(0); useEffect(() => { const f = () => force((x) => x + 1); _shopCartSubs.add(f); return () => { _shopCartSubs.delete(f); }; }, []); return _shopCart; }
/* 재사용 장바구니 바 + 주문 모달 (products: 카트 id 조회용 상품 배열) */
function ShopCartBar({ products }) {
  const cart = useShopCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [walletBal, setWalletBal] = useState(0);
  const CATS = (typeof SUPP_CATS !== "undefined") ? SUPP_CATS : {};
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const dmEmail = dm ? dm.email : "default";
  const rw = (p) => (typeof healthReward === "function") ? healthReward(p) : { reward: Math.floor(p * 0.25) };
  const icoOf = (p) => (CATS[p.category] || {});
  const cartItems = Object.keys(cart).map((id) => ({ p: (products || []).find((x) => x.id === id), qty: cart[id] })).filter((x) => x.p);
  const totalCnt = cartItems.reduce((s, x) => s + x.qty, 0);
  const totalPrice = cartItems.reduce((s, x) => s + x.p.price * x.qty, 0);
  const totalReward = cartItems.reduce((s, x) => s + rw(x.p.price).reward * x.qty, 0);
  if (totalCnt === 0 && !cartOpen) return null;
  return (
    <>
      {totalCnt > 0 && (
        <div className="cartbar" onClick={() => setCartOpen(true)}>
          <span className="cbico"><ShoppingCart size={17} /><i>{totalCnt}</i></span>
          <div className="cbinfo"><b>합계 {shopWon(totalPrice)}</b><span><Coins size={11} color="#FDE68A" /> 건강적립금 {shopWon(totalReward)}</span></div>
          <button className="cbgo">주문하기 ›</button>
        </div>
      )}
      {cartOpen && (
        <div className="pdov" onClick={() => { setCartOpen(false); setOrdered(false); }}><div className="pdbox" onClick={(e) => e.stopPropagation()}>
          <div className="pdh"><b>{ordered ? "주문 접수" : "장바구니"}</b><button onClick={() => { setCartOpen(false); setOrdered(false); }}><X size={19} /></button></div>
          <div className="pdbody">
            {ordered ? (
              <div className="ordok"><span className="ic"><Check size={28} color="#16A34A" /></span><b>주문이 접수되었습니다</b><p>{totalCnt}개 · {shopWon(totalPrice)}<br />건강적립금 <b style={{ color: "#B45309" }}>{shopWon(totalReward)}</b>이 <b>건강금융지갑에 적립되었습니다.</b></p>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "9px 12px", margin: "4px 0 12px", fontSize: 12.5, color: "#166534" }}><Wallet size={13} style={{ verticalAlign: -2 }} /> 건강금융지갑 누적 쇼핑 적립: <b>{shopWon(walletBal)}</b></div>
                <button className="cbtn pri" onClick={() => { shopCartClear(); setCartOpen(false); setOrdered(false); }}>확인</button></div>
            ) : (<>
              {cartItems.map(({ p, qty }) => { const r = rw(p.price); return (
                <div className="citem" key={p.id}>
                  <span className="ci" style={{ background: (icoOf(p).col || "#7C3AED") + "16" }}><Art name={icoOf(p).icon || "capsule"} size={22} /></span>
                  <div className="cinfo"><b>{p.name}</b><span>{shopWon(p.price)} · 적립 {shopWon(r.reward)}</span></div>
                  <div className="cqty"><button onClick={() => shopCartSetQty(p.id, qty - 1)}>−</button><b>{qty}</b><button onClick={() => shopCartSetQty(p.id, qty + 1)}>+</button></div>
                </div>
              ); })}
              <div className="csum"><div><span>합계 금액</span><b>{shopWon(totalPrice)}</b></div><div className="rew"><span><Coins size={12} /> 건강적립금</span><b>{shopWon(totalReward)}</b></div></div>
              <button className="cbtn pri" onClick={() => { const nb = (typeof shopHtkAdd === "function") ? shopHtkAdd(dmEmail, totalReward) : totalReward; setWalletBal(nb); if (typeof toast === "function") toast(`💰 건강금융지갑 +${shopWon(totalReward)} 적립!`); setOrdered(true); }}><ShoppingCart size={15} /> {shopWon(totalPrice)} 주문하기</button>
              <div className="chnote" style={{ marginTop: 4 }}>※ 결제는 목업이며 실결제·재고 연동은 별도입니다. 건강적립금은 주문 시 건강금융지갑에 실제 반영됩니다.</div>
            </>)}
          </div>
        </div></div>
      )}
    </>
  );
}
function SupplementShop() {
  const PRODUCTS = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const CATS = (typeof SUPP_CATS !== "undefined") ? SUPP_CATS : {};
  const rw = (p) => (typeof healthReward === "function") ? healthReward(p) : { reward: Math.floor(p * 0.25), supply: Math.floor(p * 0.5), margin: p - Math.floor(p * 0.5) };
  const [cat, setCat] = useState("전체");
  const [sort, setSort] = useState("reward");
  const [detail, setDetail] = useState(null);
  const [live, setLive] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  useEffect(() => {
    setLive(null); if (!detail || PRICE_FEED_CFG.mode === "off") return;
    let alive = true; setLiveLoading(true);
    fetchLowestPrice(detail).then((r) => { if (alive) { setLive(r); setLiveLoading(false); } });
    return () => { alive = false; };
  }, [detail]);
  const cats = ["전체", ...Object.keys(CATS)];
  let list = PRODUCTS.filter((p) => cat === "전체" || p.category === cat);
  if (sort === "reward") list = [...list].sort((a, b) => rw(b.price).reward - rw(a.price).reward);
  else if (sort === "priceLow") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "priceHigh") list = [...list].sort((a, b) => b.price - a.price);
  const add = (p) => { shopCartAdd(p.id); if (typeof toast === "function") toast(`🛒 ${p.name} 담기 · 건강적립금 +${shopWon(rw(p.price).reward)}`); };
  const icoOf = (p) => (CATS[p.category] || {});
  return (
    <>
      <div className="rewardbn"><span className="ri"><Coins size={18} color="#B45309" /></span><div><b>모든 영양제 건강적립금 = 판매가의 25%</b><span>구매액의 공급가 50% · 매출마진의 50%를 건강금융지갑 Health Token으로 적립</span></div></div>
      <div className="bklbl" style={{ margin: "12px 0 8px" }}><Pill size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> 영양제 상품몰 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 국내 판매 상위 {PRODUCTS.length}종</span></div>
      {PRICE_FEED_CFG.mode !== "off" && <div className="pricefeed" title="상품을 누르면 실시간 최저가를 조회합니다"><RefreshCw size={12} /> {priceFeedLabel()} · 상품 클릭 시 조회</div>}
      <div className="ssfilter">{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="sssort">
        <span>정렬</span>
        {[["reward", "적립높은순"], ["priceLow", "가격낮은순"], ["priceHigh", "가격높은순"]].map(([k, t]) => <button key={k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>{t}</button>)}
        <span className="sscount">{list.length}종</span>
      </div>
      <div className="prodgrid">{list.map((p) => { const r = rw(p.price), m = icoOf(p); return (
        <div className="prodcard" key={p.id} onClick={() => setDetail(p)}>
          <div className="pimg" style={{ background: (m.col || "#7C3AED") + "10" }}><SuppImage p={p} /></div>
          <div className="pinfo">
            <div className="pbrand">{p.brand}</div>
            <div className="pname2">{p.name}</div>
            <div className="pvol">{p.category} · {p.volume}</div>
            <div className="pprice">{shopWon(p.price)} <small style={{ color: "#EA580C", fontWeight: 700 }}>최저가</small></div>
            <div className="preward"><Coins size={11} /> 적립 {shopWon(r.reward)} <small>25%</small></div>
            <a className="lowprice" href={shopLowestHref(p)} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}><Search size={11} /> 국내 최저가 검색 <ExternalLink size={9} /></a>
          </div>
          <button className="paddbtn" onClick={(e) => { e.stopPropagation(); add(p); }}><Plus size={14} /> 담기</button>
        </div>
      ); })}</div>
      <div className="chnote">※ 가격은 브랜드 공식몰/네이버·쿠팡 최저가 <b>수집 예시(2026-07-01 시점)</b>로 변동될 수 있습니다. 기능성 문구는 식약처 인정 기능성 요약(원문 복제 아님)이며, 이미지·후기·구매는 각 출처로 연결됩니다. 건강기능식품은 질병의 예방·치료 의약품이 아니며, 실제 판매는 브랜드 제휴·오픈마켓 API 연동이 필요합니다.</div>

      <ShopCartBar products={PRODUCTS} />

      {detail && (() => { const r = rw(detail.price), m = icoOf(detail); return (
        <div className="pdov" onClick={() => setDetail(null)}><div className="pdbox" onClick={(e) => e.stopPropagation()}>
          <div className="pdh"><b>{detail.name}</b><button onClick={() => setDetail(null)}><X size={19} /></button></div>
          <div className="pdbody">
            <div className="pdtop"><span className="pdimg" style={{ background: (m.col || "#7C3AED") + "10" }}><SuppImage p={detail} /></span>
              <div><div className="pbrand">{detail.brand}</div><div className="pvol">{detail.category} · {detail.volume}</div><div className="pdclaim">{detail.claim}</div></div></div>
            <p className="pddesc">{detail.desc}</p>
            <div className="pdprice">{live ? shopWon(live.price) : shopWon(detail.price)}{live && <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, textDecoration: "line-through", marginLeft: 8 }}>{shopWon(detail.price)}</span>}</div>
            {PRICE_FEED_CFG.mode !== "off" && (
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "9px 12px", margin: "8px 0", fontSize: 12, color: "#9A3412" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}><RefreshCw size={13} className={liveLoading ? "spin" : ""} /> {priceFeedLabel()}</div>
                {liveLoading ? <div style={{ marginTop: 4 }}>최저가 조회 중…</div>
                  : live ? <div style={{ marginTop: 4 }}>현재 최저가 <b style={{ color: "#EA580C" }}>{shopWon(live.price)}</b> · <b>{live.mall}</b> · {new Date(live.ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준{live.demo ? " (예시)" : ""}</div>
                    : <div style={{ marginTop: 4 }}>조회 결과 없음 — <a href={shopLowestHref(detail)} target="_blank" rel="noreferrer noopener" style={{ color: "#EA580C", fontWeight: 700 }}>직접 검색</a></div>}
                <button className="cbtn" style={{ margin: "8px 0 0", width: "100%", fontSize: 12 }} onClick={() => { try { sessionStorage.removeItem("hifin_price_" + detail.id); } catch (e) {} setLiveLoading(true); setLive(null); fetchLowestPrice(detail).then((rr) => { setLive(rr); setLiveLoading(false); }); }}><RefreshCw size={13} /> 실시간 최저가 다시 조회</button>
              </div>
            )}
            <div className="pdreward simple">
              <div className="pdrlbl"><Coins size={16} color="#B45309" /> 건강적립금 <small>최저 판매가의 25%</small></div>
              <b className="pdramt">{shopWon((live ? healthReward(live.price) : r).reward)}</b>
            </div>
            <div className="pdbtns">
              <a className="ghost" href={suppMedia(detail.id).danawa || detail.url || naverHref(detail.name, detail.brand)} target="_blank" rel="noreferrer noopener"><Search size={14} /> {suppMedia(detail.id).danawa ? "다나와 최저가" : "출처·상세"} <ExternalLink size={11} /></a>
              <button className="pri" onClick={() => { add(detail); setDetail(null); }}><ShoppingCart size={14} /> 장바구니 담기</button>
            </div>
            <div className="chnote" style={{ marginTop: 6 }}>※ {detail.source === "brand_mall" ? "브랜드 공식몰" : detail.source === "coupang" ? "쿠팡" : "네이버쇼핑"} 기준 수집 예시가(2026-07-01). 표시가는 수집 시점 기준이며 실제 가격·구매는 출처에서 확인하세요.</div>
          </div>
        </div></div>
      ); })()}
    </>
  );
}
/* ====================== 당당상담 AI 인텔리전스 ======================
   AI 주치의의 영양소·홈케어기기 상담 결과를 넘겨받아, 관련 '건강기능(식약처 인정 기능성)'에
   도움을 줄 수 있는 성분·제품을 안내한다.
   ⚖️ 건강기능식품법·식품표시광고법 준수: 특정 질병의 '예방·치료' 효능을 표방하지 않는다.
      → 질환을 '건강 관심영역'으로 재구성하고, 식약처 인정 기능성 문구('~에 도움을 줄 수 있음')만 사용. */
const SHOP_INTEL_AREAS = [
  { key: "눈", label: "눈 건강", col: "#16A34A", claim: "루테인·지아잔틴은 노화로 인해 감소할 수 있는 황반색소 밀도 유지에 도움을 줄 수 있어요.", cats: ["루테인"], ings: ["루테인", "지아잔틴", "아스타잔틴", "빌베리", "비타민a", "눈"] },
  { key: "혈행", label: "혈행·혈중 중성지방", col: "#2563EB", claim: "오메가3(EPA·DHA)는 혈중 중성지방 개선과 혈행 개선에 도움을 줄 수 있어요.", cats: ["오메가3"], ings: ["오메가3", "오메가", "epa", "dha", "혈행", "중성지방"] },
  { key: "장", label: "장 건강", col: "#0D9488", claim: "프로바이오틱스(유산균)는 유익균 증식·유해균 억제로 배변활동 원활에 도움을 줄 수 있어요.", cats: ["프로바이오틱스"], ings: ["프로바이오틱스", "유산균", "락토", "프리바이오틱스", "신바이오틱스", "식이섬유", "장"] },
  { key: "간", label: "간 건강", col: "#7C3AED", claim: "밀크씨슬(실리마린)은 간 건강에 도움을 줄 수 있어요.", cats: ["밀크씨슬"], ings: ["밀크씨슬", "실리마린", "간"] },
  { key: "면역", label: "면역·활력", col: "#DB2777", claim: "홍삼은 면역력 증진·피로 개선에, 아연·비타민C는 정상적인 면역기능 유지에 도움을 줄 수 있어요.", cats: ["홍삼", "아연", "비타민C"], ings: ["홍삼", "인삼", "아연", "비타민c", "베타글루칸", "프로폴리스", "셀레늄", "면역"] },
  { key: "뼈", label: "뼈·치아 건강", col: "#F59E0B", claim: "비타민D는 칼슘 흡수와 뼈의 형성·유지에 필요하고, 칼슘은 뼈·치아 형성에 필요해요.", cats: ["비타민D"], ings: ["비타민d", "칼슘", "뼈", "골밀도"] },
  { key: "관절", label: "관절·연골 건강", col: "#0891B2", claim: "글루코사민·MSM·보스웰리아 등은 관절 및 연골 건강에 도움을 줄 수 있어요.", cats: [], ings: ["글루코사민", "msm", "보스웰리아", "콘드로이친", "관절", "연골"] },
  { key: "에너지", label: "에너지·피로", col: "#EA580C", claim: "비타민B군은 에너지 대사에, 마그네슘은 에너지 생성·신경·근육 기능 유지에 필요해요.", cats: ["종합비타민", "마그네슘"], ings: ["비타민b", "종합비타민", "마그네슘", "코엔자임", "피로", "활력"] },
  { key: "피부", label: "피부 건강", col: "#DB2777", claim: "콜라겐은 피부 보습·자외선에 의한 피부 손상 개선에, 비타민C는 결합조직 형성에 도움을 줄 수 있어요.", cats: ["콜라겐", "비타민C"], ings: ["콜라겐", "히알루론", "비오틴", "세라마이드", "피부"] },
  { key: "혈당", label: "혈당 건강", col: "#CA8A04", claim: "바나바잎·여주·크롬 등은 식후 혈당의 급격한 상승을 억제하는 데 도움을 줄 수 있어요.", cats: [], ings: ["바나바", "여주", "크롬", "혈당", "이눌린"] },
  { key: "요로", label: "요로 건강", col: "#DC2626", claim: "크랜베리 추출물(프로안토시아니딘)은 요로 건강에 도움을 줄 수 있어요.", cats: [], ings: ["크랜베리", "프로안토시아니딘", "요로", "방광"] },
  { key: "전립선", label: "전립선·배뇨", col: "#4F46E5", claim: "쏘팔메토 열매추출물은 전립선 건강 및 배뇨 기능 개선에 도움을 줄 수 있어요.", cats: [], ings: ["쏘팔메토", "전립선", "배뇨"] },
  { key: "인지", label: "인지·기억력", col: "#9333EA", claim: "은행잎추출물·포스파티딜세린은 노화로 인한 기억력 개선에 도움을 줄 수 있어요.", cats: [], ings: ["포스파티딜세린", "은행잎", "기억", "인지"] },
  { key: "수면", label: "수면·스트레스", col: "#6366F1", claim: "L-테아닌은 스트레스로 인한 긴장 완화에, 유단백가수분해물(락티움)은 수면의 질 개선에 도움을 줄 수 있어요.", cats: [], ings: ["테아닌", "락티움", "gaba", "감태", "수면", "스트레스"] },
  { key: "혈압", label: "혈압 건강", col: "#EF4444", claim: "코엔자임Q10은 높은 혈압 감소에 도움을 줄 수 있어요.", cats: [], ings: ["코엔자임", "q10", "코큐텐", "혈압"] },
];
const SHOP_INTEL_DEVICES = [
  { key: "혈압", label: "혈압 관리 기기", col: "#EF4444", note: "가정에서 혈압을 측정하는 식약처 인증 가정용 의료기기예요.", items: [["가정용 자동 혈압계", "상완·손목 자동 측정, 아침·저녁 기록"]], partners: ["오므론(OMRON)", "휴비딕", "GN바디닥터"], ings: ["혈압", "고혈압", "혈압계"] },
  { key: "혈당", label: "혈당 관리 기기", col: "#CA8A04", note: "자가혈당측정기·연속혈당측정(CGM)으로 혈당을 추적하는 의료기기예요.", items: [["혈당측정기·CGM", "실시간 혈당 추적·식이 피드백"]], partners: ["자원메디칼", "오므론(OMRON)"], ings: ["혈당", "당뇨", "혈당측정", "cgm", "채혈"] },
  { key: "체성분", label: "체성분·체중 관리", col: "#0E7490", note: "근육·체지방·복부비만을 측정하는 기기예요.", items: [["체성분 분석기", "근육·체지방·복부지방 추적"]], partners: ["인바디(InBody)", "GN바디닥터"], ings: ["체성분", "비만", "체중", "근육", "인바디"] },
  { key: "체온", label: "발열·체온 관리", col: "#F97316", note: "비접촉·귀 체온계로 체온을 측정해요.", items: [["체온계(비접촉·귀)", "빠른 체온 측정"]], partners: ["휴비딕"], ings: ["체온", "발열", "고열", "체온계"] },
  { key: "산소", label: "호흡·산소 모니터", col: "#0EA5E9", note: "맥박산소계로 산소포화도를 측정하는 기기예요.", items: [["맥박산소계(산소포화도)", "호흡기질환 자가 모니터"]], partners: ["오므론(OMRON)"], ings: ["산소", "호흡", "copd", "천식", "산소포화도", "폐"] },
  { key: "통증", label: "통증·근육 완화", col: "#7C3AED", note: "가정용 온열·저주파·EMS 등 통증·근육 완화 보조 기기예요. 진단·치료는 의료진과 상의하세요.", items: [["온열·저주파·EMS", "가정용 통증·근육 이완 보조"]], partners: ["세라젬", "GN바디닥터", "코지마"], ings: ["온열", "저주파", "통증", "ems", "고주파", "마사지", "근육통", "관절", "찜질", "안마"] },
];
function DangDangProduct({ p }) {
  const CATS = (typeof SUPP_CATS !== "undefined") ? SUPP_CATS : {};
  const m = CATS[p.category] || {};
  const r = (typeof healthReward === "function") ? healthReward(p.price) : { reward: Math.floor(p.price * 0.25) };
  const won = (v) => (typeof shopWon === "function") ? shopWon(v) : v + "원";
  return (
    <div className="prodcard" style={{ cursor: "default" }}>
      <div className="pimg" style={{ background: (m.col || "#7C3AED") + "10" }}>{typeof SuppImage === "function" ? <SuppImage p={p} /> : null}</div>
      <div className="pinfo">
        <div className="pbrand">{p.brand}</div>
        <div className="pname2">{p.name}</div>
        <div className="pvol" style={{ color: "#0D9488", fontWeight: 600 }}>{p.claim}</div>
        <div className="pprice">{won(p.price)} <small style={{ color: "#EA580C", fontWeight: 700 }}>최저가</small></div>
        <div className="preward"><Coins size={11} /> 적립 {won(r.reward)} <small>25%</small></div>
        <a className="lowprice" href={shopLowestHref(p)} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}><Search size={11} /> 국내 최저가 검색 <ExternalLink size={9} /></a>
      </div>
      <button className="paddbtn" onClick={() => { shopCartAdd(p.id); if (typeof toast === "function") toast(`🛒 ${p.name} 담기 · 건강적립금 +${won(r.reward)}`); }}><Plus size={13} /> 담기</button>
    </div>
  );
}
/* 자연어 상담용 관심영역 동의어 */
const SHOP_AREA_SYN = {
  "눈": ["눈", "시력", "침침", "눈피로", "황반", "비문", "루테인", "안구건조", "눈건조"],
  "혈행": ["혈행", "중성지방", "혈액순환", "콜레스테롤", "오메가", "손발저림"],
  "장": ["장", "변비", "배변", "설사", "유산균", "장건강", "소화불량"],
  "간": ["간", "숙취", "음주", "간수치", "간건강"],
  "면역": ["면역", "감기", "환절기", "기력", "홍삼", "활력", "잔병"],
  "뼈": ["뼈", "골다공", "골밀도", "칼슘", "비타민d"],
  "관절": ["관절", "연골", "무릎", "글루코사민", "마디"],
  "에너지": ["피로", "기운", "활력", "비타민b", "마그네슘", "근육경련", "쥐"],
  "피부": ["피부", "콜라겐", "탄력", "보습", "주름", "미용"],
  "혈당": ["혈당", "식후혈당", "당수치"],
  "요로": ["요로", "방광", "소변", "크랜베리", "잔뇨"],
  "전립선": ["전립선", "배뇨", "소변줄기"],
  "인지": ["기억", "인지", "집중", "건망", "깜빡"],
  "수면": ["수면", "잠", "불면", "스트레스", "긴장"],
  "혈압": ["혈압"],
  "체성분": ["체성분", "체지방", "근육량", "비만", "체중", "인바디"],
  "체온": ["체온", "발열", "체온계"],
  "산소": ["산소", "산소포화도", "호흡곤란", "숨참"],
  "통증": ["통증", "저주파", "온열", "찜질", "마사지", "근육통", "안마", "ems", "결림"],
};
function shopAreaMatch(a, t) {
  const nz = (s) => (s || "").toString().toLowerCase().replace(/\s/g, "");
  const nt = nz(t);
  const syn = SHOP_AREA_SYN[a.key] || [];
  return syn.some((k) => nt.includes(nz(k))) || nt.includes(nz(a.label)) || (a.ings || []).some((i) => nt.includes(nz(i)));
}
/* 상담 답변 카드 — 영양소 관심영역 (식약처 인정 기능성 문구만) */
function ConsultAreaCard({ a }) {
  const PRODUCTS = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const prods = PRODUCTS.filter((p) => (a.cats || []).includes(p.category));
  return (
    <div className="kcard" style={{ borderLeft: `4px solid ${a.col}`, width: "100%" }}>
      <div className="kt-t" style={{ color: a.col }}>🧬 {a.label}</div>
      <div style={{ padding: "9px 13px 12px" }}>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{a.claim}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", margin: "5px 0 10px" }}>※ 식약처 인정 <b>건강기능</b> 표현이며, 특정 질병의 치료·예방을 뜻하지 않습니다.</div>
        {prods.length ? <div className="prodgrid">{prods.map((p) => <DangDangProduct key={p.id} p={p} />)}</div>
          : <div style={{ fontSize: 12.5, color: "var(--muted)" }}>관련 기능성 제품 라인업을 확대하고 있어요.</div>}
      </div>
    </div>
  );
}
/* 상담 답변 카드 — 홈케어 의료기기 */
function ConsultDeviceCard({ a }) {
  return (
    <div className="kcard" style={{ borderLeft: `4px solid ${a.col}`, width: "100%" }}>
      <div className="kt-t" style={{ color: a.col }}>🩺 {a.label}</div>
      <div style={{ padding: "9px 13px 12px" }}>
        <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 8 }}>{a.note}</div>
        {a.items.map((it, j) => (
          <div key={j} style={{ padding: "7px 0", borderTop: j ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{it[0]}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{it[1]}</div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>제휴·취급 브랜드: <b>{a.partners.join(" · ")}</b></div>
      </div>
    </div>
  );
}
/* 상담 답변 카드 — 내 건강상태 맞춤 추천(구 AI 추천상품 통합) */
function ConsultRecCard() {
  const AI = (typeof SHOP_AI !== "undefined") ? SHOP_AI : [];
  const fcolor = { "영양제": "#7C3AED", "건강식단": "#16A34A", "의료기기": "#0E7490" };
  return (
    <div className="kcard" style={{ borderLeft: "4px solid #F97316", width: "100%" }}>
      <div className="kt-t" style={{ color: "#EA580C" }}>🎯 조성래님 맞춤 건강제품 추천</div>
      <div style={{ padding: "8px 13px 12px" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 9 }}>프롬에이지 Premium 리포트(생체나이 52.5세 · 간 54.4세 · 당뇨 위험↑)를 분석한 분야별 참고 추천이에요.</div>
        {["영양제", "건강식단", "의료기기"].map((f) => {
          const items = AI.filter((x) => x[0] === f); if (!items.length) return null; const fc = fcolor[f];
          return (
            <div key={f} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: fc, margin: "2px 0 6px" }}>{f}</div>
              {items.map(([, art, prod, benefit, , partner], i) => (
                <div key={i} style={{ display: "flex", gap: 9, padding: "7px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 2px 6px -2px rgba(0,0,0,.18)" }}>{typeof Art === "function" ? <Art name={art} size={19} /> : null}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>{prod}</div><div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{benefit} · {partner}</div></div>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#9A3412" }}>※ 건강기능식품은 질병의 예방·치료를 위한 의약품이 아니며, 일반적 기능성 정보입니다. 개인차가 있어요.</div>
      </div>
    </div>
  );
}
function shopConsultReply(text) {
  const nz = (s) => (s || "").toString().toLowerCase().replace(/\s/g, "");
  const t = nz(text);
  if (/추천|맞춤|내건강|뭐먹|뭐사|뭘사|골라|나에게|내게|필요한|리포트/.test(t))
    return [{ kind: "text", text: "조성래님 건강분석 리포트를 바탕으로 분야별 맞춤 제품을 추천해 드릴게요. 😊 (참고용)" }, { kind: "rec" }];
  const supp = SHOP_INTEL_AREAS.filter((a) => shopAreaMatch(a, t));
  const dev = SHOP_INTEL_DEVICES.filter((a) => shopAreaMatch(a, t));
  const out = [];
  if (supp.length) {
    out.push({ kind: "text", text: `‘${text}’와 관련해, 아래 건강기능(식약처 인정 기능성)에 도움을 줄 수 있는 성분·제품을 안내해 드릴게요.` });
    supp.slice(0, 3).forEach((a) => out.push({ kind: "area", areaKey: a.key }));
  }
  if (dev.length) {
    if (!supp.length) out.push({ kind: "text", text: `‘${text}’ 관련 홈케어 의료기기를 안내해 드릴게요.` });
    dev.slice(0, 2).forEach((a) => out.push({ kind: "dev", devKey: a.key }));
  }
  if (out.length) return out;
  if (/안녕|하이|반가|헬로|ㅎㅇ/.test(t))
    return [{ kind: "text", text: "안녕하세요! AI 상담사예요. 😊 관심 있는 건강영역(눈·장·혈행·혈당·관절·면역 등)이나 증상을 말씀해 주시면, 도움 될 수 있는 성분·제품과 홈케어 기기를 안내해 드릴게요." }];
  return [{ kind: "text", text: `‘${text}’에 딱 맞는 항목을 못 찾았어요. 😅 아래 관심영역 버튼을 누르시거나, ‘눈이 침침해요’, ‘혈당 관리’, ‘혈압계 추천’처럼 말씀해 주세요.` }];
}
let _shopMsgId = 0;
function ShopConsultant() {
  const intel = (() => { try { const x = (typeof window !== "undefined") ? window._shopIntel : null; if (typeof window !== "undefined") window._shopIntel = null; return x || null; } catch (e) { return null; } });
  const PRODUCTS = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const AREA_BY = {}; SHOP_INTEL_AREAS.forEach((a) => { AREA_BY[a.key] = a; });
  const DEV_BY = {}; SHOP_INTEL_DEVICES.forEach((a) => { DEV_BY[a.key] = a; });
  const [msgs, setMsgs] = useState(() => {
    const x = intel();
    const base = [{ id: ++_shopMsgId, who: "ai", kind: "text", first: true, text: "안녕하세요, AI 상담사예요. 🛒\n건강 관심영역이나 증상을 말씀해 주시면, 도움 될 수 있는 성분·제품과 홈케어 기기를 당당하게(투명·근거기반) 안내해 드릴게요." }];
    if (x) {
      const terms = [].concat(x.supp || [], x.device || []).join(" ");
      const reply = shopConsultReply(terms + (x.dz ? " " + x.dz : ""));
      const intro = { id: ++_shopMsgId, who: "ai", kind: "text", text: `AI 주치의 ${x.dz ? "‘" + x.dz + "’ " : ""}상담에서 안내된 ${x.kind === "device" ? "홈케어 기기" : "영양소"}를 이어받았어요. 관련 항목을 정리해 드릴게요. (질병의 예방·치료 목적이 아닙니다)` };
      return base.concat([intro], reply.filter((r) => r.kind !== "text").map((r) => ({ id: ++_shopMsgId, who: "ai", ...r })));
    }
    return base;
  });
  const [quicks, setQuicks] = useState(["🎯 내 건강상태 맞춤 추천", "눈 건강", "혈행·중성지방", "장 건강", "혈압계 추천"]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [tts, setTts] = useState(false);
  const endRef = useRef(null);
  const recogRef = useRef(null);
  const voicesRef = useRef([]);
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsOK = typeof window !== "undefined" && !!window.speechSynthesis;
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { if (!ttsOK) return; const load = () => { voicesRef.current = window.speechSynthesis.getVoices().filter((v) => /ko/i.test(v.lang)); }; load(); window.speechSynthesis.onvoiceschanged = load; return () => { try { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); } catch (e) {} }; }, []);
  const speak = (tx) => { if (!ttsOK || !tts || !tx) return; try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(tx).replace(/[#*•【】]/g, "")); u.lang = "ko-KR"; u.rate = 1.03; const ko = voicesRef.current; if (ko && ko[0]) u.voice = ko[0]; window.speechSynthesis.speak(u); } catch (e) {} };
  const startStt = () => {
    if (!sttOK) return;
    const Rc = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new Rc(); recogRef.current = r;
    r.lang = "ko-KR"; r.interimResults = true; r.continuous = false; let fin = "";
    r.onstart = () => { setListening(true); setInterim(""); };
    r.onresult = (e) => { let itm = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const tr = e.results[i]; if (tr.isFinal) fin += tr[0].transcript; else itm += tr[0].transcript; } setInterim(itm); };
    r.onerror = () => setListening(false);
    r.onend = () => { setListening(false); setInterim(""); if (fin.trim()) send(fin.trim()); };
    try { r.start(); } catch (e) { setListening(false); }
  };
  const stopStt = () => { if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } setListening(false); };
  const send = (raw) => {
    const text = ((raw !== undefined ? raw : input) || "").trim(); if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { id: ++_shopMsgId, who: "me", kind: "text", text }]);
    setTyping(true);
    setTimeout(() => {
      const replies = shopConsultReply(text);
      setTyping(false);
      setMsgs((m) => [...m, ...replies.map((r) => ({ id: ++_shopMsgId, who: "ai", ...r }))]);
      const firstText = replies.find((r) => r.kind === "text"); if (firstText) speak(firstText.text);
      const hasArea = replies.some((r) => r.kind === "area" || r.kind === "dev" || r.kind === "rec");
      setQuicks(hasArea ? ["🎯 내 건강상태 맞춤 추천", "관절·연골 건강", "면역·활력", "홈케어 기기 추천"] : ["🎯 내 건강상태 맞춤 추천", "눈 건강", "혈당 건강", "혈압계 추천"]);
    }, 750);
  };
  const renderMsg = (m) => {
    if (m.kind === "area") { const a = AREA_BY[m.areaKey]; return a ? <ConsultAreaCard a={a} /> : null; }
    if (m.kind === "dev") { const a = DEV_BY[m.devKey]; return a ? <ConsultDeviceCard a={a} /> : null; }
    if (m.kind === "rec") return <ConsultRecCard />;
    return <div className={`bubble ${m.who}`}>{m.text}</div>;
  };
  const isCard = (m) => m.kind === "area" || m.kind === "dev" || m.kind === "rec";
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 13px", marginBottom: 12, fontSize: 11.5, color: "#9A3412", lineHeight: 1.6 }}>
        <b>⚖️ 건강기능식품법·표시광고법 준수</b> — 건강기능식품은 <b>질병의 예방·치료를 위한 의약품이 아닙니다.</b> AI 상담사 안내는 관련 <b>건강기능(식약처 인정 기능성)에 ‘도움을 줄 수 있는’</b> 정보이며 진단·처방을 대체하지 않습니다. 복용약·질환·알레르기가 있으면 섭취 전 전문가와 상의하세요.
      </div>
      <div className="kt shopai" style={{ maxWidth: 720 }}>
        <div className="kt-head">
          <span className="av-ai" style={{ width: 34, height: 34 }}><Sparkles size={19} color="#fff" /></span>
          <div style={{ flex: 1 }}><div className="nm">AI 상담사</div><div className="st"><span className="dot" /> 온라인 · 맞춤 건강제품 안내</div></div>
          {ttsOK && <button className={`ktib ${tts ? "on" : ""}`} onClick={() => { setTts((v) => { if (v && ttsOK) window.speechSynthesis.cancel(); return !v; }); }} title="음성 읽기" style={{ color: tts ? "#EA580C" : "#9A3412", background: "none", border: "none", cursor: "pointer", padding: 4 }}><Volume2 size={18} /></button>}
        </div>
        <div className="kt-body">
          <div className="daypill"><Sparkles size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> 정밀영양협회 검증 · 식약처 인정 기능성 기반 · 참고용</div>
          {msgs.map((m) => (
            <div className={`msg ${m.who}`} key={m.id}>
              {m.who === "ai" && <span className="av-ai">{m.first ? <Sparkles size={20} color="#fff" /> : null}</span>}
              <div className="col" style={isCard(m) ? { maxWidth: "100%", width: "100%" } : null}>
                {m.who === "ai" && m.first && <div className="who">AI 상담사</div>}
                <div className="bubble-row">{renderMsg(m)}</div>
              </div>
            </div>
          ))}
          {typing && <div className="msg ai"><span className="av-ai"><Sparkles size={20} color="#fff" /></span><div className="typing"><i /><i /><i /></div></div>}
          <div ref={endRef} />
        </div>
        {(listening || interim) && <div className="kt-listening">{listening ? "🎙 듣는 중… 말씀하세요 " : ""}{interim && "“" + interim + "”"}</div>}
        {quicks.length > 0 && !typing && <div className="quicks">{quicks.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}
        <div className="kt-input">
          {sttOK && <button className="pl" onClick={() => listening ? stopStt() : startStt()} style={{ color: listening ? "#EF4444" : "#EA580C" }} title="음성 입력">{listening ? <X size={22} /> : <Mic size={22} />}</button>}
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={sttOK ? "메시지 입력 또는 🎤 음성 (예: 눈이 침침해요)" : "예: 눈이 침침해요 / 혈당 관리 / 혈압계 추천"} />
          <button className={`send ${input.trim() ? "on" : "off"}`} onClick={() => send()}><Send size={16} /></button>
        </div>
        <div className="kt-disc">AI 상담사는 정보 제공용 안내이며 진단·처방·의료행위가 아닙니다. 건강기능식품은 의약품이 아니고, 의료기기는 허가된 사용목적 범위에서 사용하세요.</div>
      </div>
      <ShopCartBar products={PRODUCTS} />
    </div>
  );
}
/* ====================== 건강식단 커머스(쿠팡형) — 실제 건강식단 브랜드 제품 ======================
   ※ 투자자 데모용 예시 데이터. 가격·평점·리뷰수는 예시이며, image는 실제 제품 이미지 URL(없으면 카테고리 목업 폴백).
   상업 서비스 전환 시 정식 제휴·상품 API로 교체. */
const MEAL_PRODUCTS = [
  { id: "m-designmeal", brand: "풀무원 디자인밀", name: "디자인밀 그린박스 건강도시락 (6팩)", category: "맞춤도시락", price: 39900, orig: 45000, rating: 4.7, reviews: 2314, badge: "새벽배송", emoji: "🍱", url: "https://www.pulmuone.co.kr", desc: "저당·균형식 케어푸드" },
  { id: "m-greating", brand: "현대그린푸드 그리팅", name: "그리팅 케어 도시락 만성질환 관리식", category: "맞춤도시락", price: 41900, orig: 49000, rating: 4.6, reviews: 1876, badge: "정기배송", emoji: "🍱", url: "https://www.greating.co.kr", desc: "영양사 설계 저염·저당식" },
  { id: "m-selexcore", brand: "매일헬스뉴트리션", name: "셀렉스 코어프로틴 단백질 파우더 (750g)", category: "단백질", price: 34900, orig: 42000, rating: 4.8, reviews: 5621, badge: "로켓직구", emoji: "🥤", url: "https://www.selex.co.kr", desc: "중장년 근력·단백질 보충" },
  { id: "m-nucare", brand: "대상웰라이프", name: "뉴케어 균형영양식 200ml (24입)", category: "균형영양식", price: 28900, orig: 33000, rating: 4.7, reviews: 3210, badge: "새벽배송", emoji: "🧉", url: "https://www.daesangwellife.com", desc: "식사대용 균형영양·회복식" },
  { id: "m-medisola", brand: "메디쏠라", name: "메디푸드 당뇨케어 식단 (7일)", category: "질환케어", price: 45000, orig: 52000, rating: 4.5, reviews: 842, badge: "정기배송", emoji: "🍲", url: "https://www.medisola.co.kr", desc: "당뇨·신장·암 질환별 케어" },
  { id: "m-herings", brand: "헤링스", name: "힐리어리 암환자 케어식단 (1:1 맞춤)", category: "질환케어", price: 59000, orig: 68000, rating: 4.9, reviews: 512, badge: "맞춤제작", emoji: "🍱", url: "https://www.herings.co.kr", desc: "암환자 1:1 영양관리" },
  { id: "m-cheonggang", brand: "지리산청강원", name: "오행 약선차 건강차 선물세트", category: "건강차", price: 24000, orig: 29000, rating: 4.6, reviews: 431, badge: "산지직송", emoji: "🍵", url: "https://smartstore.naver.com", desc: "약초 기반 전통 약선차" },
  { id: "m-farmkit", brand: "팜킷", name: "푸드큐 AI 맞춤식단 (5일 구성)", category: "AI맞춤식", price: 38000, orig: 44000, rating: 4.7, reviews: 1023, badge: "AI추천", emoji: "🥗", url: "https://www.farmkit.co.kr", desc: "AI 개인 맞춤 식단" },
  { id: "m-drkitchen", brand: "닥터키친", name: "질환별 맞춤 건강식단 밀박스", category: "질환케어", price: 43000, orig: 50000, rating: 4.6, reviews: 1567, badge: "새벽배송", emoji: "🥘", url: "https://www.drkitchen.co.kr", desc: "당뇨·신장·다이어트식" },
  { id: "m-fresheasy", brand: "프레시지", name: "헬스밀 저칼로리 밀키트 (10종)", category: "밀키트", price: 19900, orig: 25000, rating: 4.5, reviews: 8912, badge: "로켓배송", emoji: "🥘", url: "https://www.fresheasy.co.kr", desc: "헬스밀·간편 밀키트" },
  { id: "m-eatson", brand: "hy 잇츠온", name: "잇츠온 건강 국·반찬 세트", category: "간편식", price: 15900, orig: 19000, rating: 4.4, reviews: 4231, badge: "새벽배송", emoji: "🍚", url: "https://www.hy.co.kr", desc: "간편 건강식·반찬" },
  { id: "m-maeilselex", brand: "매일유업 셀렉스", name: "셀렉스 프로틴 음료 190ml (16입)", category: "단백질", price: 32000, orig: 38000, rating: 4.7, reviews: 6742, badge: "로켓배송", emoji: "🥤", url: "https://www.selex.co.kr", desc: "단백질·시니어 케어푸드" },
  { id: "m-ourhome", brand: "아워홈 케어플러스", name: "케어플러스 연화식 환자식 (부드러운식)", category: "질환케어", price: 36000, orig: 42000, rating: 4.5, reviews: 723, badge: "정기배송", emoji: "🍲", url: "https://www.ourhomemall.com", desc: "연화식·환자식" },
  { id: "m-cjfw", brand: "CJ프레시웨이", name: "케어푸드 실버 영양식단", category: "간편식", price: 33000, orig: 39000, rating: 4.5, reviews: 634, badge: "정기배송", emoji: "🍱", url: "https://www.cjfreshway.com", desc: "케어푸드·시니어식" },
  { id: "m-bonjuk", brand: "본죽", name: "전복죽 환자 회복식 (5팩)", category: "죽", price: 27900, orig: 33000, rating: 4.6, reviews: 3892, badge: "새벽배송", emoji: "🥣", url: "https://www.bonif.co.kr", desc: "죽·환자 회복식" },
  { id: "m-dongwon", brand: "동원 더반찬&", name: "더반찬& 건강 간편식 (주간세트)", category: "간편식", price: 21900, orig: 27000, rating: 4.5, reviews: 2765, badge: "새벽배송", emoji: "🍚", url: "https://www.thebanchan.co.kr", desc: "건강 간편식·반찬" },
  { id: "m-spaoeat", brand: "잇메이트(스파오)", name: "닭가슴살 스테이크 고단백 (30팩)", category: "단백질", price: 29900, orig: 39000, rating: 4.6, reviews: 12043, badge: "로켓배송", emoji: "🍗", url: "https://www.eatmate.co.kr", desc: "닭가슴살·고단백식" },
];
/* 실제 제품 이미지(다나와/공식몰 CDN, 2026-07 수집) — 없으면 카테고리 목업 폴백.
   ※ 헤링스(구독 서비스)·지리산청강원(니치 D2C)·팜킷(B2B SaaS)은 리테일 상품컷이 없어 목업 유지. */
const MEAL_MEDIA = {
  "m-designmeal": "https://img.danuri.io/catalog-image/984/375/017/c0116b809e9743adb8c1d3f54c837896.jpg?shrink=330:*&_v=20260504115250",
  "m-greating": "https://img.danuri.io/catalog-image/142/826/012/6179b2ab5132440e9bbfba6cfe3c96e3.jpg?shrink=330:*&_v=20260614080418",
  "m-selexcore": "https://img.danuri.io/catalog-image/865/098/014/e34fdcdc6b2148c48e97377b9f0a1dbe.jpg?shrink=330:*&_v=20260708080502",
  "m-nucare": "https://img.danuri.io/catalog-image/474/008/113/01332c50972d4c99b494357f283293f7.jpg?shrink=330:*&_v=20260708195410",
  "m-medisola": "https://godomall.speedycdn.net/dff924563d830271d726ec02842aac96/goods/1000000379/image/detail/1000000379_detail_084.jpg",
  "m-drkitchen": "https://img.danuri.io/catalog-image/794/246/015/1fc5fa0406764a6eaab5811c0d32c407.jpg?shrink=330:*&_v=20260626080444",
  "m-fresheasy": "https://img.danuri.io/catalog-image/777/255/032/e1f0f417383c481e98529dfa2df7cded.jpg?shrink=330:*&_v=20260407234631",
  "m-eatson": "https://img.danuri.io/catalog-image/661/739/018/a8f4cf3788dc4e60867b38d91629322a.jpg?shrink=330:*&_v=20260407233719",
  "m-maeilselex": "https://img.danuri.io/catalog-image/579/275/012/3d301507d68841d6aefdfe5d2467ff6d.jpg?shrink=330:*&_v=20260708090131",
  "m-ourhome": "https://d1nzxr3h07h50a.cloudfront.net/assets/prod/product/56532914-8651-417f-92fb-b9e8efa02523.jpg",
  "m-cjfw": "https://img.danuri.io/catalog-image/696/822/008/6b213010dc614b9b980e58c440946e1b.jpg?shrink=330:*&_v=20260609080502",
  "m-bonjuk": "https://img.danuri.io/catalog-image/594/725/015/8b1f5947ca7c45e48d7a5ad996a22520.jpg?shrink=330:*&_v=20260708120417",
  "m-dongwon": "https://img.danuri.io/catalog-image/184/888/013/0937e7b4127a4c199faf23d2f1ded1f3.jpg?shrink=330:*&_v=20260407235421",
  "m-spaoeat": "https://img.danuri.io/catalog-image/263/981/010/40f30db288d1401597791bcb2abc7008.jpg?shrink=330:*&_v=20260707080519",
};
/* 제품 → 업체 성격 매칭: partner(특별제휴)·member(정밀영양협회 회원사)·brand(유력 브랜드) */
const MEAL_TIER = {
  "m-designmeal": "partner", "m-greating": "partner",
  "m-selexcore": "member", "m-nucare": "member", "m-medisola": "member", "m-herings": "member", "m-cheonggang": "member", "m-farmkit": "member",
};
const mealTier = (id) => MEAL_TIER[id] || "brand";
function MealMock({ p }) {
  const hue = (String(p.id).split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 360);
  return (
    <div className="mealmock" style={{ background: `linear-gradient(160deg,hsl(${hue} 55% 96%),hsl(${(hue + 30) % 360} 45% 90%))` }}>
      <span className="mm-emoji">{p.emoji || "🥗"}</span>
      <span className="mm-brand">{p.brand.split(" ")[0]}</span>
    </div>
  );
}
function MealImage({ p }) {
  const [err, setErr] = useState(false);
  const src = (typeof MEAL_MEDIA !== "undefined") ? MEAL_MEDIA[p.id] : null;
  if (src && !err) return <img className="mealimg" src={src} alt={p.name} loading="lazy" onError={() => setErr(true)} />;
  return <MealMock p={p} />;
}
function MealCard({ p, onAdd }) {
  const disc = p.orig && p.orig > p.price ? Math.round((1 - p.price / p.orig) * 100) : 0;
  const r = (typeof healthReward === "function") ? healthReward(p.price) : { reward: Math.floor(p.price * 0.25) };
  const tier = mealTier(p.id);
  const link = (tier === "brand") ? (typeof naverHref === "function" ? naverHref(p.brand, "건강식단") : p.url) : p.url;
  const linkTxt = (tier === "brand") ? "검색" : "공식몰";
  return (
    <div className="mealcard">
      <div className="mealthumb"><MealImage p={p} />{p.badge && <span className="mealbadge">{p.badge}</span>}
        {tier === "member" && <span className="mealtier mem"><ShieldCheck size={9} /> 정밀영양협회 회원사</span>}
        {tier === "partner" && <span className="mealtier par"><Sparkles size={9} /> 특별제휴</span>}</div>
      <div className="mealbrand">{p.brand}</div>
      <div className="mealname">{p.name}</div>
      <div className="mealrate"><span className="stars">★</span> {p.rating} <span className="rev">({p.reviews.toLocaleString()})</span></div>
      <div className="mealprices">{disc > 0 && <span className="mdisc">{disc}%</span>}<span className="mprice">{shopWon(p.price)}</span>{disc > 0 && <span className="morig">{shopWon(p.orig)}</span>}</div>
      <div className="mealreward"><Coins size={11} /> 적립 {shopWon(r.reward)}</div>
      <div className="mealbtns">
        <a className="meallink" href={link} target="_blank" rel="noreferrer noopener"><Search size={12} /> {linkTxt} <ExternalLink size={9} /></a>
        <button className="mealadd" onClick={() => onAdd(p)}><ShoppingCart size={13} /> 담기</button>
      </div>
    </div>
  );
}
function MealShop() {
  const [cat, setCat] = useState("전체");
  const [sort, setSort] = useState("reco");
  const cats = ["전체", "🔵 정밀영양협회 회원사", ...Array.from(new Set(MEAL_PRODUCTS.map((p) => p.category)))];
  let list = MEAL_PRODUCTS.filter((p) => cat === "전체" || (cat === "🔵 정밀영양협회 회원사" ? mealTier(p.id) === "member" : p.category === cat));
  if (sort === "review") list = [...list].sort((a, b) => b.reviews - a.reviews);
  else if (sort === "priceLow") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
  const add = (p) => { if (typeof shopCartAdd === "function") shopCartAdd(p.id); if (typeof toast === "function") toast(`🛒 ${p.name} 담기`); };
  return (
    <div className="mealshop">
      <div className="mealhead">
        <div><b>🥗 건강식단 쇼핑</b><span>정밀영양협회 검증 건강식단 브랜드 · {MEAL_PRODUCTS.length}종</span></div>
        <span className="mealcert"><ShieldCheck size={12} /> Precision Nutrition Certified</span>
      </div>
      <div className="ssfilter">{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="sssort">
        <span>정렬</span>
        {[["reco", "추천순"], ["review", "리뷰많은순"], ["priceLow", "낮은가격순"], ["rating", "별점높은순"]].map(([k, t]) => <button key={k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>{t}</button>)}
        <span className="sscount">{list.length}종</span>
      </div>
      <div className="mealgrid">{list.map((p) => <MealCard key={p.id} p={p} onAdd={add} />)}</div>
      <div className="chnote">※ 상품·가격·평점·리뷰수는 <b>투자자 데모용 예시</b>이며 실제와 다를 수 있습니다. 제품 이미지는 실제 제품 참조용이고, 실제 판매·배송은 각 브랜드/제휴사를 통해 이뤄집니다. 건강식단은 질병의 치료·예방을 위한 의약품이 아닙니다.</div>
      {typeof ShopCartBar === "function" && <ShopCartBar products={[].concat(typeof SUPP_PRODUCTS !== "undefined" ? SUPP_PRODUCTS : [], MEAL_PRODUCTS)} />}
    </div>
  );
}
function ShopSection() {
  const [cat, setCat] = useState(() => { try { return (typeof window !== "undefined" && window._shopIntel) ? "intel" : "diet"; } catch (e) { return "diet"; } });
  const cats = [["diet", "건강식단", Salad, "#16A34A"], ["supp", "영양제", Pill, "#7C3AED"], ["device", "홈케어의료기", Stethoscope, "#0891B2"], ["intel", "AI 상담사", Sparkles, "#EA580C"], ["sports", "스포츠건강", Activity, "#E11D48"]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="shop" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강쇼핑</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강식단 · 영양제 · 의료기기 · 스포츠건강 — 특별제휴사와 유력 브랜드, 내 건강상태 맞춤 AI 추천</div></div></div>
      <PrecisionNutritionSection />
      <div className="shopcats">{cats.map(([k, t, Ic, c]) => (
        <button key={k} className={`shopcat ${cat === k ? "on" : ""}`} style={{ "--cc": c }} onClick={() => setCat(k)}>
          <span className="sc-ic"><Ic size={17} /></span><span className="sc-t">{t}</span>
        </button>
      ))}</div>
      {cat === "diet" && <>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><Sparkles size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> 건강식단 특별제휴사</div>
        <div className="spsm-grid">{(SHOP_PARTNERS.diet || []).map((p) => <ShopPartnerCardSm key={p.name} p={p} />)}</div>
        <WaterBanner />
        <div style={{ marginTop: 18 }} />
        <MealShop />
      </>}
      {cat === "supp" && <><ShopCategory catKey="supp" label="영양제" hideBrands /><SupplementShop /></>}
      {cat === "device" && <ShopCategory catKey="device" label="홈케어의료기" />}
      {cat === "intel" && <ShopConsultant />}
      {cat === "sports" && <SportsHealth />}
    </div>
  );
}

/* ====================== HOME ====================== */
/* ====================== 보험·치료비 ====================== */
