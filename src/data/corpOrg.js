/* ══════════════ 회사 총괄운영 — 조직 단일 원천(corpOrg.js) · CorpOps Phase 1 (형 지시 2026-11-11) ══════════════
   원천 사상: 업무자동화 체계다. 모든 팀에 **사람 책임자 1명과 AI 팀장 1명**이 쌍으로 있고,
   되돌릴 수 없거나 · 책임이 회사 밖으로 나가거나 · 법적 효과가 생기는 일은 **사람이 마무리한다**.
   ⚠️ 원칙:
     · 사람과 AI를 같은 모양으로 표시하지 않는다 — AI에는 항상 AI 배지가 붙는다.
     · 없는 인원을 있는 것처럼 세지 않는다 — head(현재)와 cap(정원)을 나눠 적고, 합류 전은 0이다.
     · 사내 전용이다 — 이 레지스트리는 회원 대면 에이전트(agentRegistry.js)와 섞지 않는다.
     · 실데이터는 아직 없다. 지표 자리는 비워 두고 「미연결」로 보인다(숫자를 지어내지 않는다).
     · 좌표·점 배치는 고정 시드로 만든다 — Math.random 금지(결정론 규약). */

const CORP_DIV = [
  { id: "MGMT", name: "경영관리본부", note: "CEO 직할" },
  { id: "HINS", name: "헬스인슈어본부", note: "헬스케어 · 보험" },
  { id: "DIRECT", name: "직할", note: "대표 직속" },
];

/* th·ph = 구면 좌표(라디안). 같은 본부는 가까이 묶어 한 덩어리로 돌게 한다. */
const CORP_TEAMS = [
  { id: "M1", div: "MGMT", name: "경영기획팀", sh: "경영기획", own: "조성래", ownTitle: "CEO",
    ai: "나침반", aiWhy: "방향을 잡는다", c: "#FF8A65", th: -0.50, ph: -0.74, head: 1, cap: 1, joined: "겸임",
    work: "사업계획 · 투자 유치 · 제휴 · 협력업체 관리 · 전사 지표",
    pages: [
      { t: "경영 현황", kind: "new", at: "P6" },
      { t: "사업 운영", kind: "tab", tab: "bizops", comp: "BizOpsConsole" },
      { t: "협력업체 온톨로지 · 하네스", kind: "tab", tab: "partner", comp: "SupplyOntology" }],
    can: ["전사 지표 집계", "계획 대비 진척 산출", "제휴 단계 추적", "주간 회의자료 통합"],
    cannot: [
      { act: "대외 발표", by: "발행 버튼은 CEO 세션에만 · 초안 상태에서 외부 공유 경로 없음", at: "P9" },
      { act: "가격 결정", by: "가격 필드는 읽기 전용 · 변경은 승인 전표를 남긴다", at: "P9" },
      { act: "계약 체결", by: "체결 전이는 M1 책임자 승인 필요 · 작성자 ≠ 승인자", at: "P8" },
      { act: "투자 자료 제출", by: "제출은 외부 전송이라 사람 확인 단계를 거친다", at: "P9" }] },

  { id: "M2", div: "MGMT", name: "회계팀", sh: "회계", own: "조성래", ownTitle: "CEO",
    ai: "핀테크", aiWhy: "돈의 흐름을 맞춘다", c: "#E8795A", th: 0.00, ph: -0.90, head: 1, cap: 1, joined: "겸임",
    work: "전표 기장 · 장부 · 은행 대사 · 결산 · 재무제표 · 예실 대비",
    pages: [
      { t: "재무현황", kind: "new", at: "P5", note: "실적 축 — 전표 · 원장 · 시산표 · 재무제표" },
      { t: "재무계획", kind: "tab", tab: "finance", comp: "FinanceSection", note: "계획 축 — 기존 재무회계에서 이관" },
      { t: "예실 대비", kind: "new", at: "P6", note: "계획 ↔ 실적 차이" }],
    can: ["은행 내역에서 전표 후보 생성", "계정과목 제안", "차대 검산", "미대사 건 추출"],
    cannot: [
      { act: "전표 승인", by: "기표 → 검토 → 승인 3단 · 승인은 M2 책임자 세션에서만 · 작성자 ≠ 승인자", at: "P5" },
      { act: "월마감 확정", by: "마감 후 수정 금지 · 정정은 역분개 전표로만", at: "P5" },
      { act: "지급 실행", by: "지급은 회사 밖으로 나가는 행위 — 시스템에 실행 경로를 두지 않는다", at: "—" },
      { act: "세무 신고 제출", by: "기한 경보까지만 · 제출은 사람이 외부에서 한다", at: "—" }] },

  { id: "M3", div: "MGMT", name: "인사총무팀", sh: "인사총무", own: "조성래", ownTitle: "CEO",
    ai: "인총이", aiWhy: "사람과 자산을 챙긴다", c: "#D96A52", th: 0.50, ph: -0.74, head: 1, cap: 1, joined: "겸임",
    work: "인사 기록 · 근태 · 급여 대장 · 자산 대장 · 위임전결",
    pages: [
      { t: "조직 · 인사", kind: "new", at: "P8" },
      { t: "총무 · 자산", kind: "new", at: "P8" }],
    can: ["근태 집계", "연차 잔여 계산", "교육 이수 점검", "자산 대장 갱신"],
    cannot: [
      { act: "채용 · 해고", by: "인사 상태 전이는 CEO 승인 필수", at: "P8" },
      { act: "급여 확정", by: "급여 금액 열람은 CEO와 M3 책임자 한정 · 확정 버튼은 CEO 세션에만", at: "P8" },
      { act: "평가 확정", by: "초안만 생성 · 확정 전이에 사람 서명 필요", at: "P8" },
      { act: "인사 기록 외부 제공", by: "내보내기 경로 없음 · 민감자료 차단 게이트가 커밋도 막는다", at: "P0" }] },

  { id: "H1", div: "HINS", name: "헬스케어팀", sh: "헬스케어", own: "전소윤", ownTitle: "센터장",
    ai: "헬시", aiWhy: "회원의 건강을 살핀다", c: "#FF7A6B", th: 1.96, ph: 0.16, head: 0, cap: 1, joined: "미정",
    work: "회원 건강관리 운영 · 헬스메이트 조직 · 상담 품질 · 검진 연계 · 응급 대응",
    pages: [
      { t: "운영 현황", kind: "new", at: "P7" },
      { t: "헬스케어 온톨로지", kind: "tab", tab: "health" },
      { t: "헬스메이트 센터", kind: "nav", nav: "healthmate" }],
    can: ["회원 지표 집계", "인계카드 발행 조건 점검", "미응답·지연 건 추출", "골든타임 경보"],
    cannot: [
      { act: "의료 판단", by: "제품 규약 — 진단·처방에 해당하는 문장을 생성하지 않는다", at: "기존" },
      { act: "상담 답변 자동 발송", by: "인계카드 5조건 AND를 통과해야 발행 · 발송은 사람이 누른다", at: "기존" },
      { act: "응급 판정 대체", by: "응급은 상담보다 앞서 선판정되고 119 안내가 맨 앞에 선다", at: "기존" },
      { act: "검진 결과 해석 확정", by: "수치는 보여주되 해석은 전문가 확인 전까지 미확정으로 표시", at: "P7" }] },

  { id: "H2", div: "HINS", name: "보험팀", sh: "보험", own: "문형석", ownTitle: "센터장",
    ai: "인슈러", aiWhy: "덮이지 않은 곳을 찾는다", c: "#E6906A", th: 2.52, ph: 0.16, head: 0, cap: 1, joined: "미정",
    work: "보장 설계 · 검진대비보험 · 치료비 케어 · 보장 갭 분석 · 청구 지원",
    pages: [
      { t: "보장 현황", kind: "new", at: "P7" },
      { t: "치료비 케어", kind: "nav", nav: "carecost" },
      { t: "검진대비보험", kind: "nav", nav: "insurance" }],
    can: ["보장 갭 집계", "만기·갱신 도래 추출", "청구 가능 건 후보 제시", "보장 창 경과 경보"],
    cannot: [
      { act: "인수 확정", by: "인수는 인수사 심사 — 제품에 확정 경로가 없다", at: "기존" },
      { act: "보험 가입 권유 · 모집", by: "모집은 자격·등록의 문제 · 금칙 스캔으로 권유 문구를 차단", at: "P7" },
      { act: "청구 제출", by: "후보 제시까지만 · 제출은 사람이 한다", at: "기존" },
      { act: "지급 여부 판정", by: "등급·금액 단정 금지 규약을 그대로 따른다", at: "기존" }] },

  { id: "K1", div: "DIRECT", name: "마케팅팀", sh: "마케팅", own: "조예원", ownTitle: "수석매니저",
    ai: "애디", aiWhy: "메시지를 퍼뜨리고 반응을 듣는다", c: "#FF9E7A", th: -2.26, ph: 0.10, head: 1, cap: 1, joined: "2026-10-01",
    work: "브랜드 · 콘텐츠 · 채널 운영 · 캠페인 · 회원 획득 · 성과 분석",
    pages: [
      { t: "캠페인 현황", kind: "new", at: "P7" },
      { t: "마케팅", kind: "tab", tab: "marketing", comp: "MarketingSection" }],
    can: ["채널별 유입·전환 집계", "콘텐츠 성과 비교", "캠페인 일정 추적", "소재 초안"],
    cannot: [
      { act: "캠페인 집행", by: "집행 버튼은 K1 책임자 세션에만 · 초안은 미확정 배지를 단다", at: "P9" },
      { act: "광고 집행 · 예산 소진", by: "예산을 쓰는 행위라 승인 전표를 남긴다", at: "P9" },
      { act: "대외 발행 · 게시", by: "회사 밖으로 나가는 행위 — 사람이 마무리", at: "P9" },
      { act: "보험 모집 표현 문구 확정", by: "금칙 스캔이 후보를 거르고, 확정은 책임자와 준법 검토를 거친다", at: "P7" }] },

  { id: "D1", div: "DIRECT", name: "데이터관리팀", sh: "데이터", own: "박원식", ownTitle: "CTO",
    ai: "온톨로", aiWhy: "데이터 지도를 그린다", c: "#F2815F", th: -0.88, ph: 0.58, head: 0, cap: 1, joined: "미정",
    work: "데이터 구조 설계 · 저장 키 거버넌스 · 품질 관리 · 외부 연동 · UI 표준",
    pages: [
      { t: "데이터 품질", kind: "new", at: "P6" },
      { t: "데이터 운영", kind: "tab", tab: "dataops", comp: "DataOpsConsole" },
      { t: "HI-Fin 기반 온톨로지", kind: "tab", tab: "foundation", comp: "FoundationOntology" }],
    can: ["저장 키 등재 대조", "정합성 스캔", "품질 리포트", "외부 API 변경 감지"],
    cannot: [
      { act: "데이터 파기", by: "되돌릴 수 없는 행위 — 파기 경로를 두지 않는다", at: "—" },
      { act: "외부 제공", by: "제3자 제공은 동의·위탁의 문제 · 내보내기에 사람 확인 단계", at: "P8" },
      { act: "공개 전환", by: "등급 A 자료의 공개 전환은 커밋 게이트가 차단", at: "P0" },
      { act: "스키마 변경 반영", by: "저장 키 등재 대조(check_data_catalog)를 통과해야 커밋된다", at: "기존" }] },

  { id: "S1", div: "DIRECT", name: "정보보안팀", sh: "보안", own: "김남용", ownTitle: "보안담당이사",
    ai: "하네스", aiWhy: "막고 검증한다", c: "#C75B45", th: 0.88, ph: 0.58, head: 0, cap: 1, joined: "미정",
    work: "보안 통제 · 취약점 관리 · 접근 권한 · 침해 대응 · 내부통제와 감사 증적 · 릴리스 승인",
    pages: [
      { t: "보안 현황", kind: "new", at: "P9" },
      { t: "릴리스 · 감사", kind: "new", at: "P9" },
      { t: "운영 콘솔", kind: "tab", tab: "ops", comp: "OpsConsoleSection" }],
    can: ["커밋 게이트 결과 수집", "미조치 항목 경보", "확약 진척 집계", "동일인 승인 탐지"],
    cannot: [
      { act: "사고 인정", by: "사고를 사고로 인정하는 결정은 법상 책임자의 판단", at: "—" },
      { act: "당국 신고", by: "72시간 통지·신고는 사람이 판단하고 제출한다", at: "—" },
      { act: "서비스 중단 결정", by: "중단은 영향이 외부로 나가는 결정", at: "—" },
      { act: "권한 부여", by: "역할 변경은 S1 책임자 승인 · 변경 이력을 남긴다", at: "P9" },
      { act: "릴리스 승인", by: "작성자 ≠ 승인자 강제 · 동일인 승인은 탐지해 막는다", at: "P9" }] },
];

/* 팀 사이 업무 흐름 */
const CORP_LINKS = [
  ["M1","M2"],["M3","M2"],["M1","M3"],["M1","K1"],["M1","D1"],["M1","H1"],["M1","H2"],
  ["K1","H1"],["D1","H1"],["D1","K1"],["D1","H2"],["H1","H2"],["H2","M2"],
  ["S1","M1"],["S1","M2"],["S1","D1"],["S1","H2"],
];

/* ── 결정론 시드 — Math.random 금지(이 레포 규약) ── */
function corpSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function corpRng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* 팀 둘레 점 — 작은 구면에 피보나치 배치 + 시드 지터(같은 팀은 늘 같은 모양) */
const CORP_DOTN = 16;
const CORP_DOTS = (function () {
  const out = {};
  CORP_TEAMS.forEach(t => {
    const r = corpRng(corpSeed(t.id + t.ai));
    const a = [];
    for (let i = 0; i < CORP_DOTN; i++) {
      const y = 1 - (i / (CORP_DOTN - 1)) * 2, rad = Math.sqrt(Math.max(0, 1 - y * y));
      const ga = i * 2.399963229728653 + r() * 0.9;
      a.push({ x: Math.cos(ga) * rad, y: y * (0.86 + r() * 0.2), z: Math.sin(ga) * rad, s: 0.75 + r() * 0.6 });
    }
    out[t.id] = a;
  });
  return out;
})();

/* 집계 — 실데이터가 붙기 전에는 전부 「미연결」이다. 숫자를 지어내지 않는다.
   ⚠️ 「자리」와 「사람」을 반드시 구분한다 — CEO가 세 팀을 겸임하므로 채워진 자리와
      실제 재직 인원이 다르다. 자리 수를 사람 수로 말하면 인원을 부풀리는 셈이 된다. */
const CORP_SUMMARY = (function () {
  const names = {};
  CORP_TEAMS.forEach(t => { if (t.head > 0) names[t.own] = true; });
  const pending = CORP_TEAMS.filter(t => t.head === 0).map(t => t.own);
  return {
    teams: CORP_TEAMS.length,
    agents: CORP_TEAMS.length,
    filled: CORP_TEAMS.reduce((n, t) => n + t.head, 0),   /* 채워진 자리 */
    cap: CORP_TEAMS.reduce((n, t) => n + t.cap, 0),       /* 정원(자리) */
    people: Object.keys(names),                            /* 실제 재직자 — 겸임을 한 사람으로 센다 */
    peopleN: Object.keys(names).length,
    pending: pending,                                      /* 합류 예정 */
    pendingN: pending.length,
    dataLinked: false,            /* Phase 10에서 실데이터가 붙으면 true */
  };
})();

/* 업무시간 · 주간회의 — 형 확정 2026-11-11 */
const CORP_SCHEDULE = {
  work: { from: "09:00", to: "18:00", lunch: "12:00~13:00", days: "월~금" },
  weekly: {
    day: "월요일", time: "10:00~11:00", mode: "화상회의",
    joinPeople: 6, joinAgents: 8,
    steps: [
      ["10:00", "개회 · 지난주 결정사항 확인", "CEO"],
      ["10:02", "전사 지표", "나침반"],
      ["10:08", "팀별 보고 — 각 4분 · AI가 펼치고 사람 책임자가 보충", "핀테크 → 인총이 → 헬시 → 인슈러 → 애디 → 온톨로 → 하네스"],
      ["10:45", "지난주 후속조치 점검 — 미종결 건이 먼저", "나침반"],
      ["10:52", "결정 안건", "사람이 결정"],
      ["11:00", "폐회 — 회의록 · 후속과제 초안", "각 AI 팀장"],
    ],
  },
  /* 브라우저가 닫혀 있으면 아무것도 돌지 않는다 — 「자동 실행」이 아니라 「다음 열람 시」다. */
  routines: [
    ["일마감", "매일", "전표 차대 검산 · 누락 점검", "이상 건 승인"],
    ["은행 대사", "매일", "내역 대조 · 미대사 추출", "불일치 해소"],
    ["주간보고 초안", "금", "팀별 지표 · 진척 · 이슈 · 차주 계획", "팀 책임자 확정"],
    ["주간회의 자료", "월 09:30", "8팀 보고 통합", "CEO 승인"],
    ["회의록 · 후속과제", "월 회의 직후", "초안 생성", "담당 · 기한 확정"],
    ["월마감", "월 1회", "시산표 · 재무제표 생성", "마감 확정"],
    ["예실 대비", "월 1회", "계획 대비 차이 · 원인 후보", "원인 확정"],
    ["급여", "월 1회", "근태 집계 · 공제 계산", "지급 승인"],
    ["계약 만료 점검", "주 1회", "만료 임박 추출", "갱신 · 해지 결정"],
    ["보안 점검", "주 1회", "게이트 결과 · 확약 진척 집계", "조치 결정"],
    ["릴리스 점검", "배포 전", "체크리스트 · 동일인 승인 탐지", "릴리스 승인(S1)"],
    ["세무 기한 경보", "월 1회", "신고 기한 산출", "신고 제출"],
  ],
};

function corpTeam(id) { return CORP_TEAMS.find(t => t.id === id) || null; }
function corpDiv(id) { return CORP_DIV.find(d => d.id === id) || null; }
