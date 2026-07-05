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
    status: "review", version: "v1.0", updated: "2026-07-05",
    sections: ["HI-Fin Tech 플랫폼 비전", "해결하려는 사회문제", "의료비 사각지대", "예방중심 의료체계", "사회적경제 모델", "중앙정부 AI기본소득 vs 민간 AI 사회적경제 가치순환"],
    summary: "HI-Fin Tech는 건강검진·보험·건강쇼핑·건강금융을 하나의 AI 온톨로지로 연결해, 예방→진단→치료→돌봄 전주기를 개인화 운영하는 세계 최초의 헬스케어–핀테크 사회적 임팩트 플랫폼이다. 소비가 회원 적립·치료비 나눔으로 순환하는 사회적경제 모델로 의료비 사각지대를 해소한다.",
    body: [
      { t: "h", x: "1.1 HI-Fin Tech 플랫폼 비전" },
      { t: "p", x: "**치료비 걱정 없는 평생 건강관리 생태계.** HI-Fin Tech는 건강검진·보험·건강쇼핑·건강금융지갑을 하나의 **AI 온톨로지(지식그래프)** 로 연결하고, AI 에이전트가 예방→진단→치료→재활→돌봄의 건강 전주기를 개인화하여 운영하는 플랫폼이다." },
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
      { title: "2022년도 건강보험환자 진료비 실태조사 — 보장률 65.7%(+1.2%p), 비급여 본인부담률 14.6%, 총진료비 120.6조·비급여 17.6조", org: "국민건강보험공단(2023)", url: "https://www.data.go.kr/data/15103019/fileData.do", note: "검증완료" },
      { title: "주민등록 인구통계 — 2024.12.23 기준 65세 이상 1,024만명(20.0%) 초고령사회 진입, 고령→초고령 7년(세계 최단)", org: "행정안전부 / UN 고령화 기준", url: "https://www.betterfuture.go.kr/front/policySpace/scrapDetail.do?articleId=344", note: "검증완료" },
      { title: "Health at a Glance 2023 — 한국 가계직접부담(OOP) 29% vs OECD 평균 18%", org: "OECD(2023)", url: "https://www.oecd.org/en/publications/health-at-a-glance-2023_7a7afb35-en.html", note: "검증완료" },
    ],
  },
  ch(2, "Why Now?", "왜 지금 AI Healthcare인가", ["초고령사회", "의료비 폭증", "보험 한계", "예방의학", "AI Agent 시대"]),
  ch(3, "Healthcare × FinTech", "왜 헬스케어와 금융이 하나여야 하는가", ["건강검진", "보험", "금융", "ESG", "소비자 가치환원"]),
  ch(4, "Palantir Ontology", "Ontology란 무엇인가 + HI-Fin Tech 사례", ["Object", "Relationship", "Action", "Knowledge Graph", "HI-Fin Tech 온톨로지 사례"]),
  ch(5, "Claude Harness", "Harness Architecture + 팔란티어와 비교", ["Stateless", "Session", "Sandbox", "Cattle", "팔란티어와 비교"]),
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

/* 진행률 집계 */
function wpProgress() {
  const total = WHITEPAPER.length;
  const done = WHITEPAPER.filter((c) => c.status === "done").length;
  const inprog = WHITEPAPER.filter((c) => c.status === "draft" || c.status === "review" || c.status === "research").length;
  const pctSum = WHITEPAPER.reduce((s, c) => s + (WP_STATUS[c.status] ? WP_STATUS[c.status].pct : 0), 0);
  return { total, done, inprog, planned: total - done - inprog, pct: Math.round(pctSum / total) };
}
