/* ══════════════ 에이전트 레지스트리 — 담당 경계의 단일 소스(Phase A) ══════════════
   하이(A0)는 오케스트레이터이자 검진 안내·섹션 안내 담당이고, 도메인 질문은 전문 에이전트가 받는다.
   이 파일이 ①라우터(agentRouter.js) ②핸드오프(agentHandoff.js) ③UI 표기(AgentDock) ④평가 하네스(docs/agent-mesh)의 공통 입력이다.
   ⚠️ 새 에이전트·경계 변경은 여기서만. scope는 '판정 가능한 형태'(인텐트 접두·정규화 키워드·상태 조건)로만 적는다.
   ⚠️ 키워드는 **정규화 이후 어휘**로 쓴다(lexNormalize: 포인트→적립금, 금고→데이터금고, 실비→실손 …). */

/* 공통 금지 — 전 에이전트가 상속(위반 시 하네스에서 실패로 잡는다) */
const HI_AGENT_GUARDS = [
  "진단·처방 단정 금지(U4 정책 계승) — 수치 이해·행동 안내까지만",
  "원가·송객수수료·CAC 등 내부 수익구조 노출 금지",
  "스냅샷·지식 인용 밖의 사실 발화 금지",
  "타 에이전트 담당 영역 임의 답변 금지 — 반드시 위임(핸드오프)",
];

const HI_AGENTS = [
  {
    id: "A0", name: "하이", label: "AI 매니저", avatar: "🤖", badge: "하이",
    persona: "따뜻한 존댓말, 짧은 문장, 먼저 챙겨주는 건강 매니저 — 처음부터 끝까지 함께한다",
    role: "orchestrator",
    scope: {
      intents: ["S1-HUB", "S1-BOOK", "S1-PREP", "S1-CENTER", "S1-NATIONAL", "S4-", "S5-", "S6-", "S7-", "S8-", "S9-"],
      segments: ["SEG-S1-", "SEG-S4-", "SEG-S5-", "SEG-S6-", "SEG-S7-", "SEG-S8-", "SEG-S9-"],
      words: ["검진예약", "예약", "검진센터", "검진기관", "국가검진", "공단검진", "검진준비", "금식",
        "데이터연결", "업로드", "데이터금고", "공단", "적립금", "htk", "충전", "멤버십", "등급",
        "가족", "초대", "추천코드", "nft", "증서", "로그인", "비밀번호", "본인인증", "알림", "쉬운말", "탈퇴", "회원가입", "약관", "문의"],
    },
    outOfScope: ["검진 수치 해석", "질환·약물 설명", "보장 분석·청구", "제품 추천", "돌봄 매칭"],
    handler: null,          // 기존 파이프라인(AGENT_QNA→섹션가이드→hiRespond→주치의 폴백)이 그대로 A0의 몸통
    knowledge: ["hiNluDict", "aiQnaBank", "AGENT_SEC_GUIDES", "hiStateModel", "checkupCenters"],
    ready: true,
  },
  {
    id: "A1", name: "AI 주치의", label: "AI 주치의", avatar: "🩺", badge: "AI 주치의",
    persona: "차분하고 정확한 설명, 근거를 먼저 밝히고 단정하지 않는다",
    role: "specialist",
    scope: {
      intents: ["S1-RESULT", "S1-EXPLAIN", "S1-BIO", "S1-RECHECK", "S2-"],
      words: ["검진결과", "결과지", "결과분석", "수치", "혈압", "혈당", "당화혈색소", "콜레스테롤", "중성지방", "간수치",
        "생체나이", "노화속도", "장기나이", "위험도", "암위험", "재검", "추적검사", "정밀검진",
        "증상", "질환", "질병", "통증", "아파", "아픈", "약", "복용", "부작용", "치료", "관리법", "식단", "운동", "리포트", "건강분석",
        "내시경", "위내시경", "대장내시경", "초음파", "결절", "갑상선", "빈혈", "골다공증", "관절염", "위염", "궤양", "역류성",
        "당뇨", "고혈압", "고지혈", "지방간", "간염", "신장", "폐렴", "천식", "치매", "뇌졸중", "심근경색", "협심증", "부정맥",
        "갱년기", "수면무호흡", "코골이", "우울", "불면", "비만", "대사증후군", "요단백", "요산", "통풍", "전립선", "자궁", "유방",
        "진단기준", "전조", "합병증", "예방접종", "백신", "정상수치", "기준치"],
      deny: ["보험", "보장", "실손", "청구", "보험료", "휴면보험금", "예약", "영양제", "구매", "간병", "돌봄", "상품", "제품", "주문", "가격", "밀키트", "기능식품"],
    },
    outOfScope: ["검진 예약 실행", "보험 상품·보장", "제품 판매", "돌봄 계약"],
    handler: "aiDoctorAgent",
    knowledge: ["kdca.json", "kdca_qa.json", "guidelines.json", "report.json", "healthOntology"],
    ready: true,
  },
  {
    id: "A2", name: "보험·치료비", label: "보험·치료비 상담", avatar: "🛡️", badge: "보험·치료비",
    persona: "숫자로 비교해 주되 가입·해지를 대신 결정하지 않는다",
    role: "specialist",
    scope: {
      intents: ["S3-"],
      segments: ["SEG-S3-"],
      words: ["보험", "보장", "보장공백", "실손", "세대전환", "진단비", "청구", "보험금", "보험료", "휴면보험금",
        "본인부담", "통합조회", "검진대비보험", "요율", "재산정", "치료비"],
      deny: ["영양제", "구매", "간병", "돌봄", "공단", "국민건강보험", "건강보험공단", "건보"],
    },
    outOfScope: ["진단·처방 판단", "제품 추천", "검진 예약 실행"],
    handler: "insuranceAgent",   // Phase B — 전용 핸들러(계산은 툴·설명은 근거·결정은 회원) + 규제 가드 5조
    knowledge: ["insuranceKB(INS_KB 17)", "SILSON_SPEC", "CLAIM_DENY", "insuranceStats", "insService", "insuranceCohort"],
    ready: true,
  },
  {
    id: "A3", name: "건강쇼핑", label: "건강쇼핑 상담", avatar: "🛒", badge: "건강쇼핑",
    persona: "효과를 단정하지 않고 근거(성분·인증·공급사)로 설명한다",
    role: "specialist",
    scope: {
      words: ["건강쇼핑", "쇼핑", "영양제", "보충제", "성분", "제품", "상품", "구매", "주문", "배송", "가격", "최저가",
        "홈케어기기", "의료기기", "혈압계", "혈당측정", "측정기", "체중계", "체성분", "밀키트", "장바구니", "주문내역",
        "오메가", "루테인", "비타민", "칼슘", "마그네슘", "프로바이오틱스", "유산균", "밀크씨슬", "콜라겐", "단백질보충",
        "정기구매", "재구매", "할인", "반품", "배송비", "성분표", "공급사", "품질", "인증", "보호대", "찜질기", "가습기",
        "건강기능식품", "기능식품", "저염", "건강식단", "식품"],
      deny: ["보험", "청구", "간병", "돌봄"],
    },
    outOfScope: ["치료 효과 단정", "진단", "보험"],
    handler: null,          // Phase C
    knowledge: ["commerceOntology", "shopProducts", "supplyData"],
    ready: false,
  },
  {
    id: "A4", name: "재가돌봄", label: "재가돌봄 상담", avatar: "🏠", badge: "재가돌봄",
    persona: "보호자의 부담을 먼저 헤아리고 절차를 단계로 풀어준다",
    role: "specialist",
    scope: {
      words: ["재가돌봄", "돌봄", "간병", "간병인", "방문간호", "방문요양", "방문목욕", "주야간보호", "요양원", "요양보호사",
        "장기요양", "요양등급", "등급신청", "퇴원후", "회복기", "거동", "치매돌봄", "복지용구",
        "재활", "요양기관", "돌봄서비스", "노인장기요양", "간병비", "보호자", "부모님돌봄", "방문재활", "재가서비스", "수발"],
      deny: ["보험금", "청구", "영양제"],
    },
    outOfScope: ["진단", "보험금 지급 판단", "제품 판매"],
    handler: null,          // Phase D
    knowledge: ["homecare.json", "telemed"],
    ready: false,
  },
];

/* ── 조회 헬퍼 ── */
function hiAgent(id) { for (const a of HI_AGENTS) { if (a.id === id) return a; } return HI_AGENTS[0]; }
function hiAgentLabel(id) { const a = hiAgent(id); return a.ready || a.id === "A0" ? a.label : a.label + " · 전문화 준비 중"; }
function hiAgentOf(intentOrSeg) {
  if (!intentOrSeg) return "A0";
  for (const a of HI_AGENTS) {
    for (const p of (a.scope.intents || [])) { if (String(intentOrSeg).indexOf(p) === 0) return a.id; }
    for (const p of (a.scope.segments || [])) { if (String(intentOrSeg).indexOf(p) === 0) return a.id; }
  }
  return "A0";
}

/* 관리자·검증 노출 */
try { if (typeof window !== "undefined") { window.__hifinAgents = { list: HI_AGENTS, get: hiAgent, of: hiAgentOf, guards: HI_AGENT_GUARDS }; } } catch (e) {}
