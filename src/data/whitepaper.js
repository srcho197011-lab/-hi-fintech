/* ============================================================================
   HI-Fin Tech 백서 (White Paper) — 시스템화된 장별 관리 데이터
   "세계 최초 AI Ontology 기반 Healthcare-FinTech Social Impact Platform"

   ▸ 각 장(chapter)은 독립적으로 조사→작성→검토→검증(status)되며 버전 관리된다.
   ▸ 온톨로지 운영 콘솔의 [백서] 탭에서 렌더·관리된다.
   ▸ 본문(body)은 블록 배열: {t:"h|p|list|note|quote|kv|legal", ...}

   핵심 원칙(형의 지침) — WP_META.principles 참조:
   ① Palantir Ontology·Anthropic Harness는 "참고한 설계 철학"으로 인용하고
      HI-Fin Tech 자체 아키텍처로 재구성한다(타사 기술 개념 존중).
   ② 의료·금융·토큰은 현행 국내 법제에서 '가능한 영역'과 '법·제도 개선이
      필요한 영역'을 명확히 구분한다.
   ③ 본 문서는 초안이며 법률 의견서·규제 적합성 인증을 대체하지 않는다.
============================================================================ */

const WP_META = {
  code: "HIFIN-WP",
  title: "AI Ontology 기반 Healthcare–FinTech Social Impact Platform",
  subtitle: "세계 최초 · HI-Fin Tech 기술 · 정책 · 투자 통합 백서",
  vision: "치료비가 두려워 치료를 미루는 사람이 없는 세상",
  visionSub: "예방은 자산이 되고, 소비는 나눔이 되는 AI 건강금융 생태계",
  ownerLabel: "온톨로지 운영 · 백서편집국",
  version: "v0.1",
  updated: "2026-07-05",
  audience: ["국회", "보건복지부", "과학기술정보통신부", "금융위원회", "보험사", "병원", "투자자"],
  kinds: ["기술 백서(Technical)", "정책 백서(Policy)", "투자 백서(Investment)"],
  principles: [
    "Palantir Ontology와 Anthropic Harness는 서로 다른 회사의 기술 개념이다. 본 백서는 이를 '참고한 설계 철학'으로 인용하고, HI-Fin Tech의 자체 플랫폼 아키텍처로 재구성한다.",
    "의료·금융·토큰 관련 내용은 현행 국내 법제에서 '가능한 영역'과 '법·제도 개선이 필요한 영역'을 명확히 구분한다.",
    "본 문서는 조사 기반 초안이며 법률 의견서·규제 적합성 인증을 대체하지 않는다. 사업 추진 전 전문 변호사·규제 전문가의 검토가 필요하다.",
  ],
  differentiator: "Palantir Ontology · Claude Harness · Healthcare · Insurance · Social Enterprise · Blockchain · EMR · ESG · Consumer Value Return 을 하나의 아키텍처로 설명하는 백서.",
};

/* 장별 진행 상태 정의 (예정 → 조사중 → 작성중 → 검토중 → 검증완료) */
const WP_STATUS = {
  planned:  { k: "planned",  label: "예정",     ic: "○", color: "#94A3B8", bg: "#F1F5F9", pct: 0 },
  research: { k: "research", label: "조사중",   ic: "◐", color: "#0EA5E9", bg: "#E0F2FE", pct: 25 },
  draft:    { k: "draft",    label: "작성중",   ic: "◑", color: "#F59E0B", bg: "#FEF3C7", pct: 55 },
  review:   { k: "review",   label: "검토중",   ic: "◕", color: "#8B5CF6", bg: "#EDE9FE", pct: 80 },
  done:     { k: "done",     label: "검증완료", ic: "●", color: "#16A34A", bg: "#DCFCE7", pct: 100 },
};

/* 4단계 편집 로드맵(형 제안) — 장 번호로 매핑 */
const WP_PHASES = [
  { n: 1, key: "tech",   title: "1단계 · 기술 아키텍처",       desc: "Ontology · Harness · EMR · AI Agent · Blockchain · Security", chapters: [4, 5, 6, 7, 8, 9, 10, 13, 14] },
  { n: 2, key: "law",    title: "2단계 · 의료·금융 법률/규제",  desc: "국내 법령 · 해외 비교 · 토큰 규제 구분",                       chapters: [11, 12, 18] },
  { n: 3, key: "impact", title: "3단계 · 사회적기업·ESG·정책",  desc: "AI 보험 · AI 건강관리 · 사회적기업 · ESG",                    chapters: [15, 16, 17, 19] },
  { n: 4, key: "market", title: "4단계 · 시장·해외·투자·결론",  desc: "요약 · Why Now · 융합 · 글로벌 · 특허 · 비교 · 로드맵 · 결론", chapters: [1, 2, 3, 20, 21, 22, 23, 24] },
];

/* ── 백서 본문(장별) ── status: planned|research|draft|review|done */
const WHITEPAPER = [
  {
    no: 1, part: "Executive Summary", title: "Executive Summary", subtitle: "플랫폼 비전과 해결하려는 사회문제",
    status: "done", version: "v1.1", updated: "2026-07-05",
    sections: ["HI-Fin Tech 플랫폼 비전", "해결하려는 사회문제", "의료비 사각지대", "예방중심 의료체계", "사회적경제 모델", "중앙정부 AI기본소득 vs 민간 AI 사회적경제 가치순환"],
    summary: "HI-Fin Tech는 건강검진·보험·건강쇼핑·건강금융을 하나의 AI 온톨로지로 연결해, 예방→진단→치료→돌봄 전주기를 개인화 운영하는 세계 최초의 헬스케어–핀테크 사회적 임팩트 플랫폼이다. 소비가 회원 적립·치료비 나눔으로 순환하는 사회적경제 모델로 의료비 사각지대를 해소한다.",
    body: [
      { t: "h", x: "1.1 HI-Fin Tech 플랫폼 비전" },
      { t: "quote", x: "치료비가 두려워 치료를 미루는 사람이 없는 세상.", by: "HI-Fin Tech 미션" },
      { t: "p", x: "**예방은 자산이 되고, 소비는 나눔이 되는 AI 건강금융 생태계.** HI-Fin Tech는 건강검진·보험·건강쇼핑·건강금융지갑을 하나의 **AI 온톨로지(지식그래프)** 로 연결하고, AI 에이전트가 예방→진단→치료→재활→돌봄의 건강 전주기를 개인화하여 운영하는 세계 최초의 헬스케어–핀테크 사회적 임팩트 플랫폼이다." },
      { t: "p", x: "회원의 상담·검진·소비·건강 이벤트는 회원별 **데이터 하우스(영속 이벤트 로그)** 에 시계열로 축적되고, 온톨로지 오케스트레이터가 이를 분석해 ①추가검진 ②진료과 안내 ③영양 ④치료기기 ⑤건강식단의 실행으로 되돌린다(닫힌 루프)." },
      { t: "h", x: "1.2 해결하려는 사회문제" },
      { t: "list", items: [
        "의료비 사각지대 — 비급여·간병비·소득상실 등 공적보험이 메우지 못하는 실질 부담.",
        "사후치료 편중 — 예방·건강관리 투자 부족으로 만성질환·중증화 비용이 사회에 전가.",
        "고령화발 의료비 폭증 — 한국은 2024년 12월 65세 이상이 20%를 넘어 초고령사회에 진입했고, 고령사회→초고령사회 전환이 7년으로 세계 최단이다.[2] 의료·돌봄 재정 압박이 급격히 커진다.",
        "건강 형평성 격차 — 소득·지역·연령에 따른 건강관리 접근성 불균형.",
      ] },
      { t: "h", x: "1.3 의료비 사각지대" },
      { t: "p", x: "2022년 기준 국민건강보험 **보장률은 65.7%**(전년 대비 +1.2%p)이며 비급여 본인부담률은 14.6%다. 건강보험환자 총 진료비 약 **120.6조원 중 비급여가 17.6조원**으로, 공적보험이 메우지 못하는 영역이 상시 존재한다.[1]" },
      { t: "p", x: "그 결과 한국의 **가계직접부담(OOP) 의료비 비중은 약 29%로 OECD 평균(18%)을 크게 상회**한다.[3] 보편적 건강보험을 달성했음에도 급여 범위의 공백 탓에 가계가 부담하는 몫이 크며, 중증·만성질환에서 치료비 공백은 재난적 의료비로 이어져 가계 파탄의 원인이 된다." },
      { t: "h", x: "1.4 예방중심 의료체계" },
      { t: "p", x: "치료 중심에서 **예방·관리 중심**으로의 전환은 개인 건강수명과 사회적 의료비 효율을 동시에 높인다. HI-Fin은 검진·생활습관·영양·기기·식단을 데이터로 연결해 예방 행동을 유도하고, 그 성과를 보험·금융 인센티브로 환류한다." },
      { t: "h", x: "1.5 사회적경제 모델" },
      { t: "p", x: "제품 판매마진을 **50% 회원적립 · 30% 치료비 나눔 · 20% 운영**으로 배분한다. 소비가 곧 회원의 건강자본 적립과 취약계층 치료비 나눔으로 순환하는 구조로, 성장할수록 사회적 환원이 커진다." },
      { t: "h", x: "1.6 중앙정부 AI기본소득 모델 vs 민간 AI 사회적경제 가치순환 모델" },
      { t: "kv", head: ["관점", "중앙정부 AI 기본소득", "민간 AI 사회적경제 가치순환(HI-Fin)"], rows: [
        ["재원", "국가 조세·재정", "플랫폼 소비마진·참여(자립적)"],
        ["배분 방식", "일률적 현금 지급", "건강행동 연계 적립·나눔"],
        ["지속가능성", "재정 부담·정치적 변동성", "소비순환 기반 자립 구조"],
        ["주 대상", "전 국민(보편)", "건강관리 참여자·취약계층 우선"],
        ["목적", "소득 보전", "건강자본 형성·의료비 사각 해소"],
        ["행동 인센티브", "약함(현금)", "예방·검진·건강소비 유도(강함)"],
      ] },
      { t: "note", x: "본 백서는 두 모델을 대립이 아닌 **상호보완**으로 본다 — 민간 가치순환이 예방·건강행동을 촉진하고, 공공 안전망이 최종 사각지대를 담당하는 '이중 안전망'을 제안한다." },
      { t: "legal", now: [
        "리워드 포인트 적립·건강소비 캐시백",
        "기부·치료비 나눔 프로그램 운영",
        "제휴 검진·보험 중개(등록 요건 준수 전제)",
      ], reform: [
        "소비자 참여형 토큰의 '지분성 권리' 연계 — 자본시장법·가상자산이용자보호법 검토 필요(제18장 연계)",
        "건강데이터 기반 보험 언더라이팅 자동화 — 개인정보·신용정보·의료법 정합성 확인 필요",
      ] },
    ],
    sources: [
      { cat: "stat", title: "2022년도 건강보험환자 진료비 실태조사 — 보장률 65.7%(+1.2%p), 비급여 본인부담률 14.6%, 총진료비 120.6조·비급여 17.6조", org: "국민건강보험공단(2023)", url: "https://www.data.go.kr/data/15103019/fileData.do", note: "검증완료" },
      { cat: "stat", title: "주민등록 인구통계 — 2024.12.23 기준 65세 이상 1,024만명(20.0%) 초고령사회 진입, 고령→초고령 7년(세계 최단)", org: "행정안전부 / UN 고령화 기준", url: "https://www.betterfuture.go.kr/front/policySpace/scrapDetail.do?articleId=344", note: "검증완료" },
      { cat: "intl", title: "Health at a Glance 2023 — 한국 가계직접부담(OOP) 29% vs OECD 평균 18%", org: "OECD(2023)", url: "https://www.oecd.org/en/publications/health-at-a-glance-2023_7a7afb35-en.html", note: "검증완료" },
    ],
  },
  {
    no: 2, part: "Why Now?", title: "Why Now?", subtitle: "왜 지금 AI Healthcare인가 — 세 곡선의 수렴",
    status: "done", version: "v1.2", updated: "2026-07-05",
    sections: ["초고령사회", "의료비 폭증", "치료비 사각지대 규모·파생비용", "보험 한계", "예방의학", "AI Agent 시대"],
    summary: "초고령사회(세계 최단 7년)·노인 진료비 44%·실손 손해율 116%라는 '문제의 정점'과, AI 에이전트·마이데이터·AI 규제라는 '해법의 성숙'이 2020년대 중반 처음으로 수렴했다. 특히 재난적 의료비(가구 7.5%)·미충족 의료·간병비(월 370만원)·소득상실(암환자 53% 직업중단)이라는 치료비 사각지대의 실제 규모와 파생비용을 데이터로 제시하며, 이것이 HI-Fin이 발굴·지원할 핵심 영역임을 명확히 한다. 또한 나이 중심 단일 위험률에 갇힌 언더라이팅의 한계를 짚고 동적 언더라이팅으로의 전환을 제시한다.",
    body: [
      { t: "h", x: "2.1 초고령사회 — 세계에서 가장 빠른 인구 전환" },
      { t: "p", x: "한국은 2024년 12월 65세 이상 인구가 전체의 **20%를 넘어 초고령사회에 진입**했다. 고령사회(14%)에서 초고령사회(20%)까지 걸린 기간은 **7년으로 세계 최단**이며, 일본(10년)·미국(15년)·독일(36년)·프랑스(39년)와 비교해 압도적으로 빠르다.[1] 대응을 준비할 시간이 다른 나라보다 훨씬 짧다는 뜻이다." },
      { t: "h", x: "2.2 의료비 폭증 — 노인이 진료비의 절반" },
      { t: "p", x: "2023년 건강보험 진료비는 **110조원을 돌파**했고, 이 중 **65세 이상(적용인구의 17.9%)이 44.1%인 48조원**을 차지했다. 노인 1인당 연평균 진료비는 543만원으로 전체 평균의 약 2.9배다.[2]" },
      { t: "p", x: "거시적으로도 GDP 대비 경상의료비 비중은 **2015년 6.5%에서 2022년 8.8%로 급등**(정점)했고, 국민 1인당 의료비는 400만원을 넘어 최근 5년간 36% 증가했다. OECD 평균(9.1%)에 근접하는 속도가 회원국 중에서도 빠르다.[3] 고령화가 심화될수록 이 곡선은 더 가팔라진다." },
      { t: "h", x: "2.3 치료비 사각지대의 실제 규모 — 우리가 발굴·지원할 영역" },
      { t: "p", x: "보장률·진료비 통계 뒤에는 '치료를 감당하지 못하는 사람들'이 있다. 이 사각지대의 규모와 그 **파생비용**이야말로 HI-Fin이 데이터로 발굴하고 나눔으로 지원해야 할 핵심 영역이다." },
      { t: "kv", head: ["사각지대 유형", "규모 (검증 데이터)", "성격"], rows: [
        ["재난적 의료비", "한국 가구 7.5%가 경험 (OECD 평균 5.3%) — 저소득·노인·만성질환 집중[5]", "직접 부담"],
        ["미충족 의료(경제적)", "의료급여빈곤 미충족가구 중 34%가 한 해 의료를 전혀 이용 못함[6]", "치료 포기·지연"],
        ["간병비 (파생)", "월평균 370만원(고령가구 중위소득 1.7배) · 사적 간병시장 연 10~11조원[7]", "가계 파산 위험"],
        ["소득 상실 (파생)", "암환자 53%가 진단 후 직업 중단 · 5년 내 직장복귀 30%[8]", "노동력·소득 상실"],
      ] },
      { t: "note", x: "**핵심은 '연쇄'다.** 치료비 → 간병비 → 소득상실 → 빈곤화로 이어지는 악순환에서, 의료비 사각지대는 단일 비용이 아니라 **가계 전체를 무너뜨리는 도미노**다. '간병파산·간병살인'이라는 신조어가 이를 증언한다. HI-Fin의 **치료비 나눔(마진 30%)·건강금융지갑·동적 언더라이팅**은 이 도미노의 각 고리를 겨냥한다 — 우리가 발굴하고 지원할 바로 그 영역이다." },
      { t: "h", x: "2.4 보험의 한계 — 나이로 뭉뚱그린 위험, 사후·과잉 구조의 임계점" },
      { t: "p", x: "민영 실손의료보험은 **손해율이 2023년 118.4%, 2024년 116.2%**(4세대는 2024년 9월 147.9%)로 만성 적자다. 2024년 실손 보험손익은 **-1.62조원**, 보험료는 최근 5년간 46% 올랐다.[4] 도수치료 등 **비급여 과잉진료·의료쇼핑**이 주원인으로, 현재의 보험은 '아픈 뒤 많이 쓴 사람'에게 보상하는 사후·과잉 구조에 갇혀 있다." },
      { t: "p", x: "그러나 더 근본적인 문제는 **언더라이팅(위험 평가)이 '나이 중심의 단일 위험률'에 갇혀 있다**는 점이다. 현재 보험은 개인의 실제 건강상태·생활습관·검진결과를 반영하지 못한 채 연령·성별 표준위험률로 보험료를 매긴다. 그 결과 **건강을 성실히 관리한 사람과 방치한 사람이 나이만 같으면 똑같은 보험료**를 내고, 고령이라는 이유만으로 가입이 거절되거나 보험료가 급등한다. 위험을 '나이'라는 단일 변수로 뭉뚱그리는 순간, 예방·건강관리의 노력은 보상받을 길이 없고 보험은 사후 손해율 관리에만 매달리는 악순환에 빠진다." },
      { t: "note", x: "**해법은 '현재 건강상태를 반영하는 동적(動的) 언더라이팅'이다.** 검진·생체지표·생활습관·복약순응 등 실데이터로 개인 위험을 상시 재산정하고, 건강 개선을 보험료·보장으로 되돌린다. 공보험(보장률 65.7%)과 실손이 **모두 사후치료에 집중**된 지금, HI-Fin은 예방·건강행동에 보상하는 구조로 전환한다 — **건강을 지킬수록 이득이 되는 보험**. (구체 설계는 제15장 AI 보험 언더라이팅)" },
      { t: "h", x: "2.5 예방의학 — 가장 저렴한 의료는 '안 아프게 하는 것'" },
      { t: "p", x: "만성질환은 전체 진료비의 큰 몫을 차지하지만 상당수가 생활습관 개선·조기발견으로 예방·지연 가능하다. 검진·영양·운동·복약관리 등 예방 개입은 중증화·합병증 비용을 줄여 사회적 의료비를 절감한다. 그동안의 공백은 예방의 **성과를 개인 인센티브로 되돌리는 금융·데이터 인프라가 없었다**는 점이다. 〔예방 투자 ROI 정량근거는 제16장에서 심화〕" },
      { t: "h", x: "2.6 AI Agent 시대 — 이제야 가능해진 이유" },
      { t: "p", x: "예방 중심 개인화는 방대한 개인 건강·소비 데이터를 실시간으로 해석해야 해 과거엔 불가능했다. 그러나 **① 추론형 AI 에이전트의 성숙(LLM·오케스트레이션), ② EMR·마이데이터·웨어러블 등 데이터 인프라 확충, ③ AI·데이터 규제 정비(AI 기본법·마이데이터)**라는 세 흐름이 2020년대 중반 동시에 무르익었다." },
      { t: "kv", head: ["변곡점", "과거 (불가능했던 이유)", "현재 (가능해진 이유)"], rows: [
        ["AI", "규칙기반·좁은 예측만 가능", "추론형 에이전트가 상담·분석·실행을 오케스트레이션"],
        ["데이터", "병원마다 단절된 EMR", "FHIR 표준·마이데이터로 개인 중심 통합"],
        ["규제", "근거 법령 부재", "AI 기본법·신용정보법(마이데이터) 등 제도화 진행"],
        ["금융", "예방을 보상할 수단 없음", "포인트·토큰·건강금융지갑으로 가치환원 가능"],
      ] },
      { t: "note", x: "**Why Now = 세 곡선의 수렴.** 초고령·의료비 폭증(문제)이 정점으로 치닫는 시점에, AI·데이터·규제(해법)가 처음으로 갖춰졌다. HI-Fin Tech는 이 교차점에서 '예방을 보상하는 건강금융'을 실현한다." },
    ],
    sources: [
      { cat: "stat", title: "주민등록 인구통계 — 2024.12 초고령사회 진입(65세+ 20%), 고령→초고령 7년(세계 최단)", org: "행정안전부 / UN 기준", url: "https://www.betterfuture.go.kr/front/policySpace/scrapDetail.do?articleId=344", note: "검증완료" },
      { cat: "stat", title: "2023년 건강보험 진료비 110조 돌파 — 65세+ 진료비 48조(44.1%, 적용인구 17.9%), 노인 1인당 543만원", org: "국민건강보험공단·건강보험심사평가원(2024)", url: "https://www.segye.com/newsView/20241129507513", note: "검증완료" },
      { cat: "stat", title: "GDP 대비 경상의료비 2015년 6.5%→2022년 8.8%(정점)→2023년 8.5% · 1인당 의료비 400만원 돌파(5년 +36%) · OECD 평균 9.1%", org: "보건복지부·OECD / e-나라지표", url: "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1431", note: "검증완료" },
      { cat: "stat", title: "실손의료보험 사업실적 — 손해율 2023년 118.4%·2024년 116.2%(4세대 147.9%), 2024년 보험손익 -1.62조, 최근 5년 보험료 +46%", org: "금융감독원·보험연구원(2024~2025)", url: "https://eiec.kdi.re.kr/policy/materialView.do?num=266435", note: "검증완료" },
      { cat: "stat", title: "재난적 의료비 경험 가구 — 한국 7.5% vs OECD 평균 5.3%(WHO 2023) / 건보자료 기준 발생률 16.6%(2020), 의료빈곤화 2.78%", org: "WHO · 국민건강보험공단 자료 분석(보험연구원)", url: "https://www.kiri.or.kr/report/downloadFile.do?docId=728", note: "검증완료" },
      { cat: "stat", title: "경제적 이유 미충족 의료 — 의료급여빈곤 미충족가구 중 34%가 연간 의료 전무(취약계층 집중)", org: "한국보건사회연구원", url: "https://repository.kihasa.re.kr/bitstream/201002/835/1/연구_2009-05.pdf", note: "검증완료" },
      { cat: "stat", title: "간병비 부담 — 월평균 370만원(고령가구 중위소득 1.7배, 한국은행) · 사적 간병시장 연 10~11조원(국회입법조사처), '간병파산' 확산", org: "한국은행 · 국회입법조사처(2024~2025)", url: "https://www.insnews.co.kr/news/articleView.html?idxno=91357", note: "검증완료" },
      { cat: "stat", title: "질병발 소득상실 — 암환자 53%가 진단 후 직업 중단, 5년 내 직장복귀율 30%(70% 노동력 상실)", org: "국립암센터 등 관련 연구", url: "https://www.lifein.news/news/articleView.html?idxno=18187", note: "검증완료" },
    ],
  },
  {
    no: 3, part: "융합 논리", title: "Healthcare × FinTech", subtitle: "왜 헬스케어와 금융이 하나여야 하는가 — '건강 = 자산' 등식",
    status: "done", version: "v1.1", updated: "2026-07-05",
    sections: ["건강검진", "보험", "금융", "ESG", "소비자 가치환원", "글로벌 선례"],
    summary: "디지털 헬스케어는 급성장하지만 대부분 '건강관리'와 '금융·보험'을 따로 다룬다. 둘이 분리된 한 예방은 작동하지 않는다. 검진 데이터는 보험 위험평가의 원천이고, 건강행동은 금융 자산이 될 수 있으며, 소비는 적립·나눔으로 순환한다. Discovery Vitality 등 글로벌 선례(고참여 회원 사망률 76%↓)가 융합 효과를 실증했으나 이들은 보험사 중심에 머문다. HI-Fin은 이를 하나의 온톨로지로 결합하되 가치를 소비자·사회로 되돌리는 '건강=자산' 등식을 구현한다.",
    body: [
      { t: "p", x: "디지털 헬스케어 시장은 글로벌 **2,609억 달러(2023)에서 2033년 1조 9,209억 달러**로 연평균 약 22% 성장이 전망되며, 국내도 2021년 1.8조원에서 2024년 4.7조원 규모로 커지고 있다.[1] 그러나 대부분의 서비스는 '건강관리'와 '금융·보험'을 서로 다른 앱, 다른 회사로 나눠 다룬다. HI-Fin의 핵심 명제는 단순하다 — **이 둘이 분리되어 있는 한, 예방은 결코 작동하지 않는다.**" },
      { t: "h", x: "3.1 건강검진 — 모든 데이터의 원천" },
      { t: "p", x: "검진은 개인 건강데이터가 처음 생성되는 지점이다. 혈압·혈당·지질·생체지표는 질병 위험의 근거인 동시에 **보험 위험평가와 금융 신용의 원천 데이터**가 된다. 검진 데이터가 보험·금융과 단절되면 그 가치는 병원 서버에 갇혀 사라지고, 개인은 자신의 건강데이터로부터 어떤 경제적 편익도 얻지 못한다." },
      { t: "h", x: "3.2 보험 — 건강데이터가 곧 위험이자 상품" },
      { t: "p", x: "제2장에서 보았듯 현재 보험은 나이 중심 단일 위험률에 갇혀 있다. 건강데이터가 실시간으로 연결되면 **위험은 '현재 상태'로 재평가**되고, 건강 개선이 보험료·보장으로 되돌아온다. 헬스케어(건강관리)와 인슈어테크(보험)는 같은 데이터를 공유하는 **하나의 시스템**이어야 한다 — 그래야 예방이 보험 원가를 낮추고, 낮아진 원가가 다시 소비자에게 환원된다." },
      { t: "h", x: "3.3 금융 — 건강행동을 자산으로" },
      { t: "p", x: "검진·운동·복약순응·건강소비 같은 건강행동은 그 자체로 미래 의료비를 줄이는 '투자'다. HI-Fin은 이 행동을 **건강금융지갑의 적립·포인트·토큰으로 자산화**한다. 건강을 지키는 행위가 곧 금융 이득이 되는 순간, 예방은 일회성 캠페인이 아니라 **지속가능한 경제적 동기**를 얻는다." },
      { t: "h", x: "3.4 ESG — 예방·나눔이 재무가치가 되는 지점" },
      { t: "p", x: "예방은 사회적 의료비를 줄이고(Social), 취약계층 치료비 나눔은 건강 형평성을 높인다(Impact). 헬스케어와 금융이 결합될 때 이 사회적 성과는 **측정가능한 ESG·재무 지표**로 환산된다 — 예방 건수, 나눔 수혜자 수, 사회적투자수익(SROI). 분리된 구조에서는 이 성과를 애초에 포착할 수조차 없다." },
      { t: "h", x: "3.5 소비자 가치환원 — 순환의 완성" },
      { t: "p", x: "HI-Fin은 제품 판매마진을 **50% 회원적립 · 30% 치료비 나눔 · 20% 운영**으로 배분한다. 소비가 회원의 건강자본 적립과 취약계층 나눔으로 순환하고, 그 데이터가 다시 검진·보험·금융을 정교화한다. **소비 → 적립·나눔 → 예방 → 건강데이터 → 더 나은 보험·금융**으로 이어지는 닫힌 고리다." },
      { t: "kv", head: ["영역", "분리되어 있을 때 (현재)", "하나로 결합될 때 (HI-Fin)"], rows: [
        ["건강검진", "데이터가 병원에 갇힘", "보험·금융 위험평가의 원천이 됨"],
        ["보험", "나이 기반 사후 보상", "건강상태 기반 동적 언더라이팅"],
        ["금융", "건강과 무관", "건강행동을 적립·토큰으로 자산화"],
        ["ESG", "선언적 사회공헌", "예방·나눔이 측정가능한 성과지표"],
        ["소비자", "일방적 지출", "소비가 적립·나눔으로 가치환원(50/30/20)"],
      ] },
      { t: "h", x: "3.6 글로벌 선례 — 융합은 이미 증명됐다" },
      { t: "p", x: "헬스케어와 금융의 결합은 이론이 아니다. 남아공 **Discovery Vitality**는 20년간 '공유가치 보험(Shared-Value Insurance)'으로 건강행동을 동적 보험료로 보상해 왔고, **고참여 회원은 사망률이 76% 낮고 평균 14년 더 오래 산다**. 이 모델은 40여 개 시장·4천만 회원으로 확산됐으며, 미국 John Hancock은 전통 생명보험 모델을 버리고 Vitality를 도입했다.[2] 건강행동을 금융 인센티브로 보상하는 구조가 실제로 수명을 늘리고 손해율을 낮춘다는 임상·재무적 증거다." },
      { t: "p", x: "다만 이들은 대체로 **'보험사 중심'의 웰니스 프로그램**에 머문다. HI-Fin은 한 걸음 더 나아가 검진·쇼핑·금융·나눔을 하나의 온톨로지로 통합하고, 건강행동의 보상을 보험료 할인을 넘어 **회원 적립·치료비 나눔·(장기적으로) 지분 참여**로 확장한다 — 중심이 보험사의 손익이 아니라 **소비자·사회의 가치순환**이라는 점이 결정적 차이다." },
      { t: "note", x: "**결론: '건강 = 자산'이라는 등식.** 헬스케어와 핀테크가 하나의 온톨로지로 결합될 때, 건강데이터는 위험평가가 되고 건강행동은 자산이 되며 예방은 비로소 보상받는다. 글로벌 선례가 융합의 효과를 실증했고, HI-Fin Tech는 그 가치를 보험사가 아닌 **소비자·사회로 되돌리는** 세계 최초의 통합 플랫폼이다." },
    ],
    sources: [
      { cat: "stat", title: "디지털 헬스케어 시장 규모 — 글로벌 2,609억$(2023)→1조9,209억$(2033, CAGR 22.1%) / 국내 1.8조원(2021)→4.7조원(2024 전망)", org: "Spherical Insights · 정보통신기획평가원(IITP)", url: "https://www.sphericalinsights.com/ko/reports/digital-healthcare-market", note: "검증완료" },
      { cat: "intl", title: "Discovery Vitality(남아공) — 공유가치 보험, 고참여 회원 사망률 76%↓·평균수명 +14년, 40개 시장·4천만 회원 / John Hancock Vitality(미국) 도입", org: "Vitality Group · Discovery", url: "https://www.vitalitygroup.com/insights/discovery-vitality-linked-insurers-credited-pioneers-shared-value-insurance-2/", note: "검증완료" },
    ],
  },
  {
    no: 4, part: "기술 아키텍처", title: "Palantir Ontology", subtitle: "Ontology란 무엇인가 — 참고 설계철학과 HI-Fin 자체 구현",
    status: "review", version: "v1.0", updated: "2026-07-05",
    sections: ["Object", "Relationship", "Action", "Knowledge Graph", "HI-Fin Tech 사례"],
    summary: "온톨로지는 데이터베이스가 아니라 '의사결정'을 모델링하는 구조다. 팔란티어는 객체·속성·관계(semantic)와 액션·함수(kinetic)를 decision-centric 그래프로 묶는다. HI-Fin은 이 설계철학을 참고해 헬스케어-핀테크 도메인의 자체 온톨로지(회원·질병·검진·보험담보를 잇는 10만 코호트 그래프)로 재구성했다.",
    body: [
      { t: "p", x: "온톨로지는 데이터베이스가 아니다. 팔란티어는 온톨로지를 '데이터가 아니라 기업의 **의사결정(decision)**을 모델링하는 것'으로 정의한다 — 객체·속성·관계(semantic)와 액션·함수(kinetic)를 하나로 묶은 **decision-centric 표현**이다.[1] HI-Fin은 이 설계철학을 참고하되, 헬스케어-핀테크 도메인의 **자체 온톨로지**로 독립 재구성했다." },
      { t: "h", x: "4.1 Object — 객체" },
      { t: "p", x: "객체는 현실의 존재를 디지털로 옮긴 것이다. HI-Fin의 핵심 객체는 **회원·가구·병원·질병·진료과·검진지표·보험담보·지역**이며, 각 객체는 속성(예: 회원 = 나이·생체나이·위험도·질병력)을 갖는다. 우리는 **10만 파일럿 코호트를 회원 객체**로 운영한다." },
      { t: "h", x: "4.2 Relationship — 관계(Link)" },
      { t: "p", x: "객체는 관계로 연결될 때 비로소 의미를 갖는다(semantic link). HI-Fin에서는 **질병 ↔ 진료과 ↔ 검진지표 ↔ 예상의료비 ↔ 보험담보 ↔ 지역**이 하나의 그래프로 이어진다 — 예컨대 '당뇨' 객체는 내분비내과·당화혈색소·합병증 예상비용·해당 보험담보와 연결된다." },
      { t: "h", x: "4.3 Action — 액션" },
      { t: "p", x: "팔란티어 온톨로지의 힘은 데이터를 '읽는' 데 그치지 않고 **의사결정을 실행(kinetic action)**한다는 점이다.[1] HI-Fin의 액션은 **세그먼트 → 보험 추천 · 나눔 대상 선정 · 케어플랜 생성**, 그리고 **상담 → 5대 실행 안내(추가검진·진료과·영양·기기·식단)**로 구현된다. 온톨로지가 곧 실행 엔진이다." },
      { t: "h", x: "4.4 Knowledge Graph — 지식그래프" },
      { t: "p", x: "객체·관계·액션이 결합되면 단순 데이터가 아니라 **의사결정 가능한 지식그래프**가 된다. HI-Fin은 실제 온톨로지 자산(진료과 DEPT_CATS · 검진 CHECKUP_ONTOLOGY · 질병↔보험 DISEASE_INSURANCE)을 재사용해 이 그래프를 구동한다." },
      { t: "h", x: "4.5 HI-Fin Tech 사례" },
      { t: "p", x: "온톨로지 운영 콘솔은 10만 회원을 객체·관계·액션으로 운영한다. 상담 내용은 **회원 데이터 하우스(consultStore)**에 시계열로 적재되고, 오케스트레이터(**analyzeConsults**)가 이를 분석해 5대 실행으로 되돌린다 — 팔란티어 Foundry형 **닫힌 루프**를 헬스케어에 구현한 것이다." },
      { t: "kv", head: ["팔란티어 온톨로지 개념", "HI-Fin Tech 구현"], rows: [
        ["Object · Property", "회원·질병·병원·보험담보·지역 / 생체나이·위험도·예상의료비"],
        ["Link (semantic)", "질병↔진료과↔검진지표↔보험담보 매핑 그래프"],
        ["Action (kinetic)", "세그먼트→보험·나눔·케어, 상담→5대 실행 안내"],
        ["Decision-centric", "'데이터가 아니라 건강 의사결정'을 모델링"],
        ["운영 규모", "10만 파일럿 코호트 객체 상시 운영"],
      ] },
      { t: "note", x: "**설계철학 인용 원칙.** Palantir Ontology는 팔란티어의 기술 개념이다. 본 백서는 이를 **참고한 설계철학**으로 인용할 뿐이며, HI-Fin Tech는 헬스케어-핀테크 도메인에 맞춘 **자체 온톨로지**로 독립 설계·구현했다." },
    ],
    sources: [
      { cat: "tech", title: "Palantir Foundry Ontology — objects·properties·links(semantic) + actions·functions(kinetic), decision-centric model, AIP 연계", org: "Palantir Technologies (Docs)", url: "https://www.palantir.com/docs/foundry/ontology/overview", note: "검증완료" },
    ],
  },
  {
    no: 5, part: "기술 아키텍처", title: "Claude Harness", subtitle: "Harness Architecture — 뇌(LLM)와 손발(도구)의 분리, 그리고 팔란티어와의 결합",
    status: "review", version: "v1.0", updated: "2026-07-05",
    sections: ["Stateless", "Session", "Sandbox", "Cattle", "팔란티어와 비교"],
    summary: "LLM(추론)은 그 자체로는 아무것도 실행하지 못한다. Harness는 LLM을 데이터·도구에 연결하는 실행 오케스트레이터로, Anthropic은 이를 '뇌(LLM)와 손발(도구)의 분리'로 설명한다. HI-Fin은 이 설계철학을 참고해 Stateless 오케스트레이터·영속 세션(데이터 하우스)·교체가능 서비스 모듈로 자체 재구성했고, 온톨로지(지식)와 결합해 닫힌 루프를 완성한다.",
    body: [
      { t: "p", x: "LLM(추론)은 그 자체로는 아무것도 실행하지 못한다. **Harness**는 LLM을 실제 작업·데이터·도구에 연결하는 실행 오케스트레이터다. Anthropic은 이를 **'뇌(LLM)와 손발(도구)의 분리(decoupling the brain from the hands)'**로 설명한다.[1] HI-Fin은 이 설계철학을 참고해 **자체 실행 아키텍처**로 재구성했다." },
      { t: "h", x: "5.1 Stateless — 상태 없는 오케스트레이터" },
      { t: "p", x: "Harness는 스스로 상태를 쌓지 않고, 매 호출마다 필요한 이력을 조회 → 집행 → 기록한다. HI-Fin의 온톨로지 오케스트레이터(**analyzeConsults**)는 상태 없이 매번 회원 이력을 불러와 분석·실행한다. 장애 시 특정 모듈만 교체·복구하면 되고, 진실 원천(회원 데이터)은 무손상으로 유지된다." },
      { t: "h", x: "5.2 Session — 영속 이벤트 로그" },
      { t: "p", x: "대화·이벤트는 Harness가 아니라 **영속 세션(이벤트 로그)**에 저장된다 — 단일 진실 원천. HI-Fin의 세션은 **회원 데이터 하우스(consultStore)**로, 상담·소비·건강 이벤트를 회원별 시계열로 영구 적재한다." },
      { t: "h", x: "5.3 Sandbox — 격리 실행환경" },
      { t: "p", x: "실제 도구 실행은 격리된 **샌드박스**에서 이뤄진다. HI-Fin의 샌드박스는 **서비스 실행 모듈**(건강검진·병원예약·건강쇼핑·건강금융지갑·재가돌봄)이며, 각 모듈은 독립·격리 실행되어 하나의 오류가 전체로 번지지 않는다." },
      { t: "h", x: "5.4 Cattle — 교체 가능한 실행부" },
      { t: "p", x: "실행부는 애지중지하는 'Pets'가 아니라 언제든 교체 가능한 **'Cattle'**로 설계한다. HI-Fin에서는 서비스 모듈은 물론 **LLM 벤더 자체가 교체 가능(Multi-LLM)**하다 — 특정 모델·모듈에 종속되지 않으므로, 규제·조달·리스크 관리 측면에서 벤더 종속을 배제할 수 있다." },
      { t: "h", x: "5.5 팔란티어와 비교 — 지식 + 실행의 결합" },
      { t: "p", x: "팔란티어 온톨로지가 '**무엇을**(지식·의사결정 구조)'을 담당한다면, Claude Harness는 '**어떻게**(실행)'를 담당한다. HI-Fin은 이 둘을 하나로 맞물린다 — **온톨로지(지식그래프) + 하니스(실행 오케스트레이션)**. 그 결과 상담 한 건이 데이터가 되고(Session), 그 데이터가 분석을 거쳐(Stateless 오케스트레이터) 다시 서비스 실행(Sandbox)으로 되돌아오는 닫힌 루프가 완성된다." },
      { t: "kv", head: ["층위", "Palantir Ontology", "Claude Harness", "HI-Fin 결합"], rows: [
        ["역할", "무엇을 (지식·의사결정)", "어떻게 (실행)", "지식 + 실행 통합"],
        ["핵심 요소", "객체·관계·액션", "Stateless·Session·Sandbox·Cattle", "온톨로지 + 오케스트레이터"],
        ["HI-Fin 구현", "10만 코호트 지식그래프", "analyzeConsults 오케스트레이션", "상담→데이터→실행 닫힌 루프"],
      ] },
      { t: "note", x: "**설계철학 인용 원칙.** Anthropic Harness는 Anthropic의 기술 개념이다. 본 백서는 이를 **참고한 설계철학**으로 인용하며, HI-Fin Tech는 자체 실행 아키텍처로 구현했다. 나아가 **Multi-LLM(벤더 교체 가능)** 설계로 특정 벤더 종속을 배제한다 — 이는 공공·금융 조달의 필수 요건이다." },
    ],
    sources: [
      { cat: "tech", title: "Effective harnesses for long-running agents / Scaling Managed Agents: Decoupling the brain from the hands — Harness는 LLM(추론)과 도구(실행)를 분리하는 오케스트레이터", org: "Anthropic (Engineering)", url: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents", note: "검증완료" },
      { cat: "tech", title: "Building agents with the Claude Agent SDK — 서브에이전트 격리 컨텍스트·도구 오케스트레이션·컨텍스트 관리(compact)", org: "Anthropic", url: "https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk", note: "검증완료" },
    ],
  },
  ch(6, "AI Agent Architecture", "LLM → Harness → Ontology → EMR → 보험 → 병원 → 정부", ["실행 파이프라인", "Multi-LLM 교체 가능 구조", "오케스트레이션"]),
  ch(7, "의료 데이터 아키텍처", "표준 기반 의료 데이터 연동", ["EMR", "FHIR", "PHR", "Wearable"]),
  ch(8, "금융 아키텍처", "결제·포인트·토큰 구조", ["보험", "지급결제", "포인트", "토큰"]),
  ch(9, "Blockchain", "왜 Blockchain인가", ["DID", "Wallet", "Token"]),
  ch(10, "AI Security", "제로트러스트 보안·감사", ["Zero Trust", "Encryption", "Sandbox", "Audit Log"]),
  ch(11, "국내 법률 검토", "적용 법령 분석", ["개인정보 보호법", "의료법", "신용정보법", "전자금융거래법", "AI 기본법", "의료 마이데이터·디지털헬스케어 정책"]),
  ch(12, "해외 법률 비교", "글로벌 규제 벤치마크", ["HIPAA", "GDPR", "FDA AI", "EU AI Act"]),
  ch(13, "EMR Integration", "병원 연동", ["FHIR", "CDM", "API"]),
  ch(14, "UIP", "Unified Integration Platform", ["통합 연동 계층", "API Gateway", "커넥터"]),
  ch(15, "AI 보험", "언더라이팅·클레임·이상탐지", ["Underwriting", "Claim", "Fraud Detection"]),
  ch(16, "AI 건강관리", "예방 중심 개인화 케어", ["예방", "AI Coach", "Nutrition", "Exercise"]),
  ch(17, "사회적기업 모델", "치료비 사각지대·취약계층·지역돌봄", ["치료비 사각지대", "취약계층", "ESG", "지역사회 돌봄"]),
  ch(18, "Consumer Token", "소비자 참여형 가치환원(리워드 vs 지분성 권리 구분)", ["Token", "Reward", "Equity Participation", "자본시장법·가상자산 규제 검토"]),
  ch(19, "ESG", "사회·거버넌스·헬스케어 SME", ["Social", "Governance", "Healthcare SMEs"]),
  ch(20, "Global Expansion", "해외 진출 전략", ["중국", "미국", "동남아"]),
  ch(21, "기술 특허 출원 예정 분야", "지식재산 전략", ["AI Ontology", "HealthInsur", "AI 보험", "Pet HI-핀테크", "화재안전관리 핀테크"]),
  ch(22, "Palantir 비교", "경쟁·비교 지형", ["Palantir", "Oracle", "Salesforce", "Epic", "Claude", "OpenAI"]),
  ch(23, "Platform Roadmap", "단계별 로드맵", ["2026", "2027", "2028", "2030"]),
  ch(24, "결론", "HI-Fin Tech Vision · 이 백서의 차별점", ["HI-Fin Tech Vision", "이 백서의 차별점", "하나의 아키텍처로 설명한 백서"]),
];

/* skeleton 장 생성 헬퍼 (planned 상태) */
function ch(no, title, subtitle, sections) {
  return { no, part: _wpPart(no), title, subtitle, sections, status: "planned", version: "—", updated: "—", summary: "", body: [], sources: [] };
}
function _wpPart(no) {
  const map = { 1: "Executive Summary", 2: "Why Now?", 3: "융합 논리" };
  for (const p of WP_PHASES) if (p.chapters.includes(no)) return p.title.replace(/^\d단계 · /, "");
  return map[no] || "";
}

/* ── 근거자료 검색 시스템 — 카테고리 · 카탈로그 · 집계 ── */
const WP_REF_CATS = {
  cite:   { k: "cite",   label: "인용출처", color: "#2563EB", bg: "#DBEAFE" },
  law:    { k: "law",    label: "법령",     color: "#DC2626", bg: "#FEE2E2" },
  stat:   { k: "stat",   label: "통계",     color: "#0F8A74", bg: "#D1FAE5" },
  intl:   { k: "intl",   label: "해외·국제", color: "#7C3AED", bg: "#EDE9FE" },
  tech:   { k: "tech",   label: "기술표준", color: "#EA580C", bg: "#FFEDD5" },
  policy: { k: "policy", label: "정책",     color: "#0891B2", bg: "#CFFAFE" },
};

/* 핵심 법령·표준 카탈로그(시드) — 장별 조사 시 status:done으로 검증·확정한다.
   status: done(원문·수치 검증완료) | todo(원문·최신개정 검증 예정) */
const WP_REFS = [
  { id: "law-pipa",   cat: "law",  title: "개인정보 보호법", org: "국가법령정보센터", year: "", url: "https://www.law.go.kr/법령/개인정보보호법", tags: ["가명정보", "민감정보", "동의"], ch: [11], status: "todo", note: "제11장에서 조문·최신개정 검증" },
  { id: "law-med",    cat: "law",  title: "의료법", org: "국가법령정보센터", year: "", url: "https://www.law.go.kr/법령/의료법", tags: ["원격의료", "진료기록", "의료기관"], ch: [11, 13], status: "todo", note: "원격의료·EMR 연계 조문 검증 예정" },
  { id: "law-credit", cat: "law",  title: "신용정보의 이용 및 보호에 관한 법률", org: "국가법령정보센터", year: "", url: "https://www.law.go.kr/법령/신용정보의이용및보호에관한법률", tags: ["마이데이터", "본인신용정보관리업"], ch: [11], status: "todo", note: "마이데이터 근거 조문 검증 예정" },
  { id: "law-efin",   cat: "law",  title: "전자금융거래법", org: "국가법령정보센터", year: "", url: "https://www.law.go.kr/법령/전자금융거래법", tags: ["전자지급", "선불전자지급수단", "포인트"], ch: [11, 8], status: "todo", note: "포인트·지급결제 근거 검증 예정" },
  { id: "law-aibasic",cat: "law",  title: "인공지능 발전과 신뢰 기반 조성 등에 관한 기본법(AI 기본법)", org: "국가법령정보센터", year: "2026 시행", url: "https://www.law.go.kr", tags: ["고영향AI", "투명성", "영향평가"], ch: [11], status: "todo", note: "시행령·고영향AI 범위 검증 예정" },
  { id: "law-capital",cat: "law",  title: "자본시장과 금융투자업에 관한 법률", org: "국가법령정보센터", year: "", url: "https://www.law.go.kr/법령/자본시장과금융투자업에관한법률", tags: ["증권성", "토큰증권", "STO"], ch: [18], status: "todo", note: "토큰 지분성 권리 검토(제18장)" },
  { id: "law-vasp",   cat: "law",  title: "가상자산 이용자 보호 등에 관한 법률", org: "국가법령정보센터", year: "2024 시행", url: "https://www.law.go.kr", tags: ["가상자산", "이용자보호"], ch: [18], status: "todo", note: "리워드 토큰 규제 구분(제18장)" },
  { id: "intl-hipaa", cat: "intl", title: "HIPAA (Health Insurance Portability and Accountability Act)", org: "U.S. HHS", year: "", url: "https://www.hhs.gov/hipaa", tags: ["PHI", "Privacy Rule", "Security Rule"], ch: [12], status: "todo", note: "미국 의료정보 보호(제12장)" },
  { id: "intl-gdpr",  cat: "intl", title: "GDPR (General Data Protection Regulation)", org: "EU", year: "2018", url: "https://gdpr-info.eu", tags: ["special category", "consent", "DPIA"], ch: [12], status: "todo", note: "EU 개인정보(제12장)" },
  { id: "intl-euai",  cat: "intl", title: "EU AI Act", org: "European Union", year: "2024", url: "https://artificialintelligenceact.eu", tags: ["high-risk", "conformity"], ch: [12], status: "todo", note: "고위험 AI 규제(제12장)" },
  { id: "intl-fda",   cat: "intl", title: "FDA — AI/ML-Based Software as a Medical Device", org: "U.S. FDA", year: "", url: "https://www.fda.gov/medical-devices/software-medical-device-samd", tags: ["SaMD", "PCCP"], ch: [12], status: "todo", note: "AI 의료기기 규제(제12장)" },
  { id: "tech-fhir",  cat: "tech", title: "HL7 FHIR (Fast Healthcare Interoperability Resources)", org: "HL7 International", year: "R4/R5", url: "https://hl7.org/fhir", tags: ["Resource", "REST API", "상호운용성"], ch: [7, 13], status: "todo", note: "EMR 표준 연동(제7·13장)" },
  { id: "tech-cdm",   cat: "tech", title: "OMOP Common Data Model", org: "OHDSI", year: "", url: "https://ohdsi.org/data-standardization", tags: ["CDM", "표준용어"], ch: [13], status: "todo", note: "공통데이터모델(제13장)" },
];

/* 장별 인용출처 + 카탈로그를 하나의 검색 대상으로 병합 */
function wpAllRefs() {
  const fromCh = [];
  WHITEPAPER.forEach((c) => (c.sources || []).forEach((s, i) => fromCh.push({
    id: `ch${c.no}-${i}`, cat: s.cat || "cite", title: s.title, org: s.org || "", year: s.year || "",
    url: s.url || "", tags: s.tags || [], ch: [c.no], note: s.note || "",
    status: (s.note || "").includes("검증완료") ? "done" : "todo",
  })));
  return [...fromCh, ...WP_REFS];
}

/* 키워드·카테고리 검색 */
function wpSearchRefs(q, cat) {
  const t = String(q || "").trim().toLowerCase();
  return wpAllRefs().filter((r) => {
    if (cat && cat !== "all" && r.cat !== cat) return false;
    if (!t) return true;
    const hay = [r.title, r.org, r.note, (r.tags || []).join(" ")].join(" ").toLowerCase();
    return hay.includes(t);
  });
}
function wpRefStats() {
  const all = wpAllRefs();
  return { total: all.length, done: all.filter((r) => r.status === "done").length, byCat: Object.keys(WP_REF_CATS).map((k) => ({ k, n: all.filter((r) => r.cat === k).length })) };
}

/* 진행률 집계 */
function wpProgress() {
  const total = WHITEPAPER.length;
  const done = WHITEPAPER.filter((c) => c.status === "done").length;
  const inprog = WHITEPAPER.filter((c) => c.status === "draft" || c.status === "review" || c.status === "research").length;
  const pctSum = WHITEPAPER.reduce((s, c) => s + (WP_STATUS[c.status] ? WP_STATUS[c.status].pct : 0), 0);
  return { total, done, inprog, planned: total - done - inprog, pct: Math.round(pctSum / total) };
}
