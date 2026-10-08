/* ══════════════ 헬스메이트(프로) 센터 — 단일 소스(healthMate.js) ══════════════
   설계서: docs/hi_healthmate/헬스메이트섹션_설계프롬프트_v1.2.md
   원칙: ①하이 퍼스트(프로는 확인·접촉·기록만) ②무동의 0명(생성 시점 배제) ③원본 수치 미노출
        ④원가·수수료 비노출 ⑤월권 금지 ⑥접촉 락(검진결과 전 접촉 금지 — 시스템만 해제)
        ⑦단계는 데이터가 정한다(수기 승급 UI 없음) — 계산하지 않고 기존 엔진을 "조립"만 한다.
   ⚠️ 시연 환경: 체험 회원(isDemoUser)의 동의·검진값은 시연 시드이며 화면에 그 사실을 고지한다. */

/* ── 현대해상 오렌지 팔레트(디자인 단일 소스) ── */
const HM_C = { pri: "#F5821F", dark: "#D96A00", deep: "#B34E00", bg: "#FFF6EE", line: "#FFDDBE", ink: "#1F2937", mut: "#6B7280", ok: "#16A34A", warn: "#F59E0B", stall: "#EA580C", hold: "#94A3B8", red: "#DC2626", blue: "#2563EB" };

/* ── 프로 사번 명부(시연) — 사번 = 프로 코드 = 자격·권한·실적의 단일 키 ──
   체계(형 지시 2026-10-05): 8H0001 ~ 8H9999 — 위촉 가능 1만 명 규모의 단일 번호대.
   구 체계(HM-{지역단약호}-26-{일련})는 폐기한다. 번호에 조직 정보를 담지 않는 것이 핵심이다 —
   지역단·지점·시군구는 레코드 필드(dan·branch·sgg·coverage)로만 유지하고, 코드 문자열에서
   조직을 추출하는 로직은 어디에도 두지 않는다(약호 접두 추출·뒤 3자리 절단 등 전부 제거).
   ⚠️ 8H0001은 시연 주인공 — 은평지점 박성호 프로에게 고정 배정한다. 현대해상 시연의 인증 화면
      기본값으로 쓰이므로 번호대의 첫 번호(외우기 가장 쉬운 값)를 준다. 배열 순서 = 번호 순서. */
const HM_CODES = [
  { code: "8H0001", name: "박성호", dan: "강북지역단", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-02", legacyCode: "HM-NB-26-007" },
  { code: "8H0002", name: "김지원", dan: "강남지역단", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-02", legacyCode: "HM-SN-26-014" },
  { code: "8H0003", name: "정태윤", dan: "강남지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-04", legacyCode: "HM-SN-26-021" },
  { code: "8H0004", name: "이수민", dan: "강남지역단", grade: "HM4", gradeKo: "지역리드", lic: true, status: "활성", since: "2026-01", legacyCode: "HM-SN-26-030" },
  /* lic:true(2026-10-05) — 강북지역단 모집자격 보유 프로가 박성호 1명뿐이어서 ② 「순번 배분 원칙」
     바로 아래에 순번(직전 → 이번)을 보여주는 행이 한 건도 없었다. 등급(서비스 범위)과 모집자격
     (보험 모집 라이선스)은 별개 축이라 HM1·모집자격 조합은 모순이 아니다(화면 툴팁과 동일 정의).
     모집자격 미보유 시연 대상은 8H0008 문가영(교육중)과 생성 프로 15%가 그대로 담당한다. */
  { code: "8H0005", name: "한서연", dan: "강북지역단", grade: "HM1", gradeKo: "안내", lic: true, status: "활성", since: "2026-06", legacyCode: "HM-NB-26-012" },
  { code: "8H0006", name: "최민준", dan: "강서지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-03", legacyCode: "HM-WS-26-005" },
  { code: "8H0007", name: "서지우", dan: "경기지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-03", legacyCode: "HM-GG-26-009" },
  { code: "8H0008", name: "문가영", dan: "경기지역단", grade: "HM1", gradeKo: "안내", lic: false, status: "교육중", since: "2026-07", legacyCode: "HM-GG-26-018" },
  { code: "8H0009", name: "오현석", dan: "광역(전국)", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-01", legacyCode: "HM-WD-26-001" },
  { code: "8H0010", name: "임다혜", dan: "광역(전국)", grade: "HM2", gradeKo: "상담", lic: true, status: "정지", since: "2026-02", legacyCode: "HM-WD-26-002" },
];
HM_CODES.forEach((p) => { p.sabun = p.code; });   /* 사번은 코드에서 파생 — 두 필드가 어긋날 수 없게 한다(병기 금지) */
const HM_CODE_RE = /^8H\d{4}$/;                   /* 신 체계 형식 — 러너(run_handoff_batch)의 게이트와 동일 */
const HM_DEMO_SABUN = "8H0001";                   /* 시연 기본값 — 은평지점 박성호(인증 화면 자동 채움용 단일 소스) */
const HM_SUSPENDED_DEMO = "8H0010";               /* 정지 사번 시연용(임다혜) — 화면이 사번 리터럴을 박지 않도록 */

/* 구 코드 방어 — 세션·저장소·스냅샷에 남은 옛 값(HM-…)이 들어와도 화면이 비거나 깨지지 않게 신 사번으로 해석.
   표시·발급은 전부 신 체계이고, 이 경로는 "읽기 하위호환" 전용이다. */
function hmCodeNorm(input) {
  const s = String(input == null ? "" : input).trim().toUpperCase();
  if (!s || /^8H\d{4}$/.test(s)) return s;   // 리터럴 사용 — 로드 순서상 상수 초기화 전에 불려도 안전하게
  try { const l = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES; for (const p of l) if (p.legacyCode === s) return p.code; } catch (e) {}
  for (const p of HM_CODES) if (p.legacyCode === s) return p.code;
  return s;
}
/* 인증 판정 — 신 사번·구 코드·미등록·비활성을 구분해 안내 문구까지 돌려준다(화면은 문구만 쓴다) */
function hmCodeCheck(input) {
  const raw = String(input == null ? "" : input).trim().toUpperCase();
  if (!raw) return { ok: false, pro: null, code: "", legacy: false, why: "사번을 입력해 주세요 — 8H0001 형식이에요." };
  const code = hmCodeNorm(raw);
  const pro = hmProOf(code);
  const legacy = !!(pro && raw !== code);
  /* 안내 3분기 — ①신 형식인데 명부에 없음 ②구 체계(HM-…) 사용 ③형식 자체가 틀림.
     예전에는 ①만 분기하고 ②③을 한 문구로 묶어, 시연 중 오타("8H00")에도 "체계가 바뀌었어요"가 떴다. */
  if (!pro) {
    if (HM_CODE_RE.test(raw)) return { ok: false, pro: null, code, legacy: false, why: "등록되지 않은 사번이에요." };
    if (/^HM-/.test(raw)) return { ok: false, pro: null, code, legacy: false, why: "사번 체계가 8H0001~8H9999로 바뀌었어요 — 새 사번을 입력해 주세요." };
    return { ok: false, pro: null, code, legacy: false, why: "사번 형식이 8H0001 형태여야 해요 — 숫자 4자리를 확인해 주세요." };
  }
  if (pro.status !== "활성") return { ok: false, pro, code: pro.code, legacy, why: `${pro.status} 상태 사번이에요 — 접근이 차단됩니다(담당 회원은 재배정 큐로 이동).` };
  return { ok: true, pro, code: pro.code, legacy, why: legacy ? `구 코드 ${raw}는 새 사번 ${pro.code}로 전환됐어요.` : "" };
}
function hmProOf(code) { const key = hmCodeNorm(code); if (!key) return null; const l = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES; for (const p of l) if (p.code === key) return p; return null; }
/* 명부 10명(순번 배분 모집단) — hmProsGen의 완전 레코드를 쓴다. HM_CODES 원본은 사번·시군구·지점이
   채워지기 전 상태라 ②탭 배분 근거에 빈 값이 노출됐다(기존 불일치 해소 · 모집단 크기는 10명 그대로). */
function hmActivePros(dan) {
  const base = (typeof hmProsGen === "function") ? hmProsGen().filter((p) => p.legacy) : HM_CODES;
  const l = base.filter((p) => p.status === "활성" && p.dan === dan);
  return l.length ? l : base.filter((p) => p.status === "활성" && p.dan === "광역(전국)");
}

/* ── 8단계 정의(단일 소스) — DB 4단계 + 이후 4단계. 판정은 hmStageOf가 "데이터만" 근거로 수행 ── */
const HM_STAGES = [
  { k: "D1", part: "DB", name: "확보", desc: "동의 + 기본 세그먼트", mission: "연락하지 않는다 — 락 상태에서 준비만", tab: 2 },
  { k: "D2", part: "DB", name: "검진 데이터", desc: "1세대 자산 — 실측 검진값(금고)", mission: "첫 연결 골든타임 — 무료 3종·지원 약속·건강관리 동의", tab: 3 },
  { k: "D3", part: "DB", name: "분석 데이터", desc: "2세대 자산 — 등급·위험도·리포트", mission: "예측 해설 · 치료비 보장 점검", tab: 4 },
  { k: "D4", part: "DB", name: "통합 데이터", desc: "3세대 자산 — 보험·행동·가족 결합", mission: "생활 밀착 관리 · 공백 채우기", tab: 5 },
  { k: "L5", part: "LIFE", name: "정기 케어", desc: "단발 → 주기(반복 터치·시계열)", mission: "주기 관리 · 만기 터치 · 재검진", tab: 3 },
  { k: "L6", part: "LIFE", name: "관계 확장", desc: "개인 → 가구(가족 데이터)", mission: "가족 상담 · 돌봄 설계", tab: 6 },
  { k: "L7", part: "LIFE", name: "데이터 자산화", desc: "동의 증서 · 데이터 이용 대가", mission: "설명 지원 · 동의 관리 도움(권유 아님)", tab: 9 },
  { k: "L8", part: "LIFE", name: "평생주기", desc: "다년 추이 → 재산정·재설계", mission: "재산정 안내 · 차기 생애설계", tab: 7 },
];
/* 단계 상세 가이드(P6+ — 프로 교육용 단일 소스): 서술 사례는 [예시·시연] 라벨, 실사례는 화면이 관할 코호트에서 산다.
   ⚠️ 여기 doKo(단계에서 할 일)와 **실제 조립되는 대본**은 같아야 한다 — 그 연결이 끊어져 있던 것을
   형 지시(2026-10-05)로 이었다. 연결 지점은 src/data/handoffCard.js의 HM_STAGE_PLAN 한 곳뿐이다:
     D1 prep(접촉 금지·사전 학습) · D2 무료 3종(free3Def 원천)+지원 약속+건강관리 동의 ·
     D3 리포트 해설+치료비 브리프 · D4 생활 밀착+빈 곳 사실 고지 · L5 주기 리듬 · L6 응급 선행+가족·돌봄 ·
     L7 데이터 권리·대가 · L8 재산정+생애 재설계. doKo를 고치면 그 표도 같이 고친다(이원화 금지).
   ⚠️ 개수도 함께 맞춘다 — D2는 ①무료 3종 ②향후 지원 약속 ③건강관리 동의로 **셋**이다(형 지시
      2026-10-05). 종전 doKo는 「두 덩어리」라 쓰고 동의를 문장 끝에 꼬리로 붙여, 프로 교육용 단일
      소스가 지시의 구조를 보여주지 못했다. doKo·이 표·조립 대본(HM_STAGE_PLAN)·전달 체크가
      같은 개수를 따라가야 한다(전달 체크 칸 수는 handoffResult.HMR_GOLDEN_KEYS 소관).
   ⚠️ doKo 3덩어리 ↔ 전달 체크 6칸 대응(형 지시 2026-10-06 · 동의 칸 신설):
        ①무료 3종 = svc3(우산 칸) + ins · report · kit → **4칸**
        ②향후 지원 약속 = support → 1칸
        ③건강관리 동의 = consent(「건강관리 동의 요청」 — 블록 fc-consent의 ko와 한 글자까지 같다) → 1칸
      svc3가 ins·report·kit의 우산 칸이라는 관계는 시트에 보이지 않는다(기존 결함 — 묶음 표시는
      다음 단위). 어느 칸이 어느 덩어리인지 여기 적어 두지 않으면 다음에 칸을 늘릴 때 또 어긋난다. */
const HM_STAGE_GUIDE = {
  D1: { entry: "회원 가입 + 건강·AI 활용 동의(동의의 범위가 곧 활동의 범위)",
    /* ⚠️ 접촉 금지 판정이 락에서 **단계**로 올라갔으므로(hmContactBlocked) 이 표도 단계 기준으로
       적는다 — HM_STAGE_GUIDE는 ③탭 STAGE_GUIDE·하이프로 답변의 단일 원천이라, 여기가 락 기준으로
       남아 있으면 프로 교육 경로가 새 규칙과 **반대되는 사실**을 말한다(②탭은 같은 집단을
       「접촉 금지(락 아님)」로 적고 있었다 · 적대적 리뷰 실증 2026-10-06). */
    doKo: "연락하지 않아요 — 검진 결과 수령 전에는 가입 여부와 무관하게 접촉 금지예요(가입자는 락, 미가입자는 결과 대기). 프로필·관할 사전 학습만 해둡니다.",
    next: "검진을 받고 결과가 금고에 들어오면 D2로 — 가입자의 락은 하이가 자동 해제하고, 미가입자도 결과가 도착하면 알려드려요.",
    ex: "회사 단체 가입으로 들어온 40대 회원 — 검진 예약만 잡혀 있고 결과가 아직 없어요. 검진대비보험에 가입했든 안 했든 지금 전화하면 접촉 금지 위반입니다. 결과 도착 알림이 오면 그때가 첫 연결이에요." },
  D2: { entry: "실측 검진값이 데이터 금고에 저장(1세대 자산)",
    doKo: "첫 연결의 골든타임 — 한 통화에 세 덩어리를 전해요. ①〔무료 3종〕 ⓐ보험 혜택 — 검진대비보험 0원 자동 가입(암·뇌졸중·급성심근경색 각 최대 1,000만원)과 적용법 ⓑAI 정밀리포트 — 생체나이·질병 위험·의료비 예측 발행·해설 ⓒ맞춤 케어 키트 — 검진 결과 기반(만성질환 보유 시 그에 맞춘) 영양소·홈케어 측정기기 무료 제공 + 진료 안내·추가검진 안내. ②〔향후 지원 약속〕 비대면 진료 · 맞춤 영양 · 케어 활동을 앞으로 계속 챙겨드린다는 약속(진료 안내·추가검진 안내는 ⓒ 케어 키트 구성에 들어 있어 거기서 한 번만 말해요). ③〔건강관리 동의〕 앞으로의 건강관리 동의를 이 통화에서 함께 받아요 — 동의의 범위가 곧 활동의 범위예요.",
    next: "AI 분석 리포트(등급·위험도)가 발급되면 D3로.",
    ex: "어제 검진 결과가 도착한 50대 회원 — '결과 보셨어요?'로 시작해 위험 구간 1개와 재검진 예약까지 한 번에 정리한 사례가 표준이에요." },
  D3: { entry: "등급·위험도·예측 리포트 생성(2세대 자산)",
    doKo: "예측 해설과 치료비 보장 점검 — 숫자가 아니라 '무엇을 하면 되는지'로 번역해 주는 게 프로의 일이에요.",
    next: "행동(재검진·미션·구매)이나 보험 결합이 생기면 D4로. 여기가 최대 정체 구간 — 정체 배지가 뜨면 재개 대본을 쓰세요.",
    ex: "리포트만 받고 3주째 조용한 30대 회원 — '한동안 챙겨드리지 못해서요'로 재개해 습관 미션 하나를 걸어 D4로 넘어간 사례." },
  D4: { entry: "보험·행동·가족 데이터 결합(3세대 자산)",
    doKo: "생활 밀착 관리 — 검진·행동·보장을 같이 보며 공백을 채워요. 상품 제안은 ⑧제안함 경로만.",
    next: "터치가 주기 리듬(만기·재검진 사이클)으로 자리잡으면 L5로.",
    ex: "재검진을 마치고 식단 정기배송까지 시작한 40대 회원 — 이제 단발 대응이 아니라 리듬을 설계할 차례예요." },
  L5: { entry: "단발 관리가 주기 관리로 — 반복 터치·시계열 축적",
    doKo: "만기 터치·연 1회 재검진·계절 리듬 관리. 관리 자체가 반복 가능한 약속이 됩니다.",
    next: "가족 데이터가 연결되면 L6로.",
    ex: "만기 D-30 안내 → 재검진 → 결과 비교까지 한 사이클을 두 번 돈 회원 — 시계열이 쌓여 추세 대화가 가능해졌어요." },
  L6: { entry: "개인에서 가구로 — 가족 연결·돌봄 관여",
    doKo: "가족 상담과 재가돌봄 설계. 응급 안내가 상담보다 항상 먼저예요.",
    next: "회원이 데이터 활용의 주인이 되는 동의 증서 단계 L7로.",
    ex: "70대 회원의 자녀가 가족 연결에 동의 — 검진 알림을 자녀가 함께 받으며 정체가 풀린 사례." },
  L7: { entry: "데이터 자산화 — 동의 증서·데이터 이용 대가(회원이 주인)",
    doKo: "설명 지원과 동의 관리 도움만 — 권유가 아니라 권리 안내예요.",
    next: "다년(2개년+) 추이가 쌓이면 L8로.",
    ex: "건강지갑 적립과 동의 범위를 스스로 조정하는 회원 — 프로는 묻는 것에만 답하고 결정은 회원이 해요." },
  L8: { entry: "다년 추이 보유 — 재산정·생애 재설계 가능",
    doKo: "요율 재산정(인하 전용) 안내와 차기 생애설계 대화 — 관리의 결실이 부담 인하로 돌아오는 단계예요.",
    next: "여정의 끝이 아니라 갱신 — 매년 추이가 다음 재설계의 근거가 됩니다.",
    ex: "3년 추이 개선으로 재산정 대상이 된 회원 — '좋은 소식이에요'로 시작하는 통화가 이 단계의 상징이에요." },
};
/* 관리상태 8종 — 단계(데이터)와 다른 축(관계) */
const HM_MSTATUS = {
  HELD: { ko: "대기(접촉 금지)", c: HM_C.hold, bg: "#F1F5F9" },
  NEED: { ko: "접촉 필요", c: HM_C.red, bg: "#FEF2F2" },
  DONE: { ko: "접촉 완료", c: HM_C.blue, bg: "#EFF6FF" },
  PROG: { ko: "진행 중", c: HM_C.ok, bg: "#F0FDF4" },
  HOLDREQ: { ko: "보류(회원 요청)", c: HM_C.warn, bg: "#FFFBEB" },
  STALL: { ko: "정체", c: HM_C.stall, bg: "#FFF7ED" },
  CLOSED: { ko: "종결", c: HM_C.mut, bg: "#F8FAFC" },
};

/* ── 「이 화면의 DB」 패널 — 원천·의미·활용·근거 + 담당 단계(전 탭 의무) ── */
const HM_DB_NOTE = {
  t1: { stage: "D1 → D2", src: "회원 행동 로그 + 리드 신호 감지(lrDetectType·lrScore — 검진·보장공백·청구·재산정·가족·직접요청 6종)", mean: "지금 이 회원에게 무슨 일이 일어났는가. 신호가 곧 접촉의 이유다.", use: "접촉 우선순위와 첫 마디를 정한다 — 근거 없는 접촉은 이 화면에 존재하지 않는다.", legal: "상담·안내 동의(필수) + 동의 증서 유효(철회 즉시 소멸) · 개인정보보호법 §22②" },
  t2: { stage: "D1", src: "검진 예약 DB + 검진대비보험 청약 상태 + 가입증서 스냅샷(hifin_ins_certs)", mean: "무상 보장을 받고 검진을 앞둔 회원 — 아직 데이터가 만들어지기 전 단계.", use: "지금은 연락하지 않는다. 결과가 나오면 첫 연결을 맡는다(순번 배분).", legal: "청약 시 상담·안내 동의(필수) + 보험업법상 계약 관리 · 검진 전 접촉 금지는 자율규제" },
  t3: { stage: "D2 → D3", src: "검진 결과 분석 엔진(checkupEngine — 등급·관리필요 항목) + 증서 만기 + 정밀검사 권고", mean: "결과가 나온 지금이 회원이 가장 도움을 원하는 시점이다.", use: "결과 해설과 보장 안내를 한 번의 연락으로 전달한다(두 번 걸면 영업으로 읽힌다).", legal: "검진결과 활용 동의 + 상담·안내 동의 · 원본 수치는 화면 미노출(등급·플래그만)" },
  t4: { stage: "D3", src: "질병 위험 예측(riskPredict — 검진 지표+연령·성별 코호트) · 미연동 시 회원 건강 프로필(시연 시드)", mean: "확정된 미래가 아니라 관리하면 바뀌는 통계적 경향이다.", use: "예방 검진·주치의 연결의 근거로만 쓴다 — 인수·요율 사용 금지.", legal: "검진결과 활용 동의 · 예측은 진단이 아님(고정 면책) · 밴드 표기만(소수점 금지)" },
  t5: { stage: "D4 · L5", src: "커머스 온톨로지(질환-성분-제품) + 복약·실천 이행률(adherence) + 정기구매 주기", mean: "회원이 실제로 무엇을 하고 있는가 — 선언이 아니라 행동.", use: "재구매 시점·성분 공백을 근거와 함께 안내한다(1일 단가 기준 비교, 압박 없음).", legal: "쇼핑·건강관리 이용 동의 · 원가성 정보 비노출" },
  t6: { stage: "D4 → L6", src: "가족 등록(familySet) + 장기요양 지식(longtermCareKB) + 입원·청구 플래그", mean: "회원의 부담은 본인이 아니라 가족에게서 온다.", use: "재가급여 가능성 안내와 가족 상담 연결 — 응급 신호가 있으면 상담보다 119가 먼저.", legal: "가족 돌봄 서비스 이용 동의(가족 본인 동의 별도) · 등급·금액 단정 금지" },
  t7: { stage: "D3 · L8", src: "보유계약 + 보장공백 분석(analyzeCoverageGap) + 인수 시뮬(underwrite·coverageMatch·ladderPlan) + 건강 등급", mean: "이 회원에게 비어 있는 보장과, 지금 건강상태에서 가능한 조건.", use: "현대해상 보장분석과 이어 붙여 상담을 준비한다 — 가능성 3구간으로만 말한다.", legal: "보험 상담·안내 동의 + 보장분석 이용 동의 · 인수 확정은 인수사 심사(면책 100%)" },
  t8: { stage: "운영(전 단계)", src: "프로가 직접 작성한 현장 의견 + 채택·반영 이력(회원 데이터 아님)", mean: "현장은 지표가 못 보는 것을 본다.", use: "제품 개선 백로그의 1차 입력 — 채택·반영은 사람 검수(자동 반영 없음).", legal: "프로 본인 작성물 · 회원 개인정보 기재 금지(금칙어 검사)" },
  t9: { stage: "전 단계(D1~L8) 관측", src: "내 코드 배정 회원의 단계 판정(hmStageOf) + 건강 등급(checkupEngine) + 접촉 이력", mean: "내가 맡은 사람들이 지금 어디에 있고, 어디서 멈춰 있는가.", use: "오늘 누구를 어느 방향으로 밀어야 하는지 정한다 — 기본 정렬은 정체 기간.", legal: "상담·안내 동의 + 프로 본인 활동 기록 · 실적은 단계 전진으로 정의(금액·순위 없음)" },
};

/* ── 유틸 ── */
function _hmLs(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function _hmSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function _hmHash(s) { let h = 5381; s = String(s || "x"); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h >>> 0; }
function _hmMask(name) { const n = String(name || "회원"); return n[0] + "○" + (n.length > 2 ? "○" : ""); }
function _hmBand(m) { return _hmBandOf(m.regAge || m.age || 45); }
/* 연령 밴드 — 9세 이하는 Math.floor(a/10)*10이 "0대"가 되어 화면에 그대로 찍혔다(실측 노출). */
function _hmBandOf(a) { a = Number(a) || 0; return a < 10 ? "10세 미만" : Math.floor(a / 10) * 10 + "대"; }
function _hmDay(ts) { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; }
const _HM_DAY = 86400000;
/* 증서 발급 시각 — c.date("YYYY-MM-DD" 또는 "YYYYMMDD")가 단일 근거. 날짜가 없는 옛 증서만 c.at으로 폴백한다.
   c.at은 "그 기기가 시드를 기록한 벽시계 시각"이라 기기마다 다른 만기를 만들었다(hmTouchPlan 주석 참고). */
/* [실측 통일 2026-10-06] 증서 발급 시각 판정은 insService.js의 insCertAt 하나로 모았다 —
   회원 화면(치료비 케어 ①)과 프로 콘솔 ⑨가 각자 계산하면 같은 증서가 두 기간으로 갈라진다. */
function _hmCertAt(c) {
  if (typeof insCertAt === "function") return insCertAt(c);
  if (!c) return null;
  const d = String(c.date || "").replace(/[^0-9]/g, "");
  if (d.length >= 8) {
    const t = new Date(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8))).getTime();
    if (!isNaN(t)) return t;
  }
  return c.at || null;
}

/* 시도 약칭 — "경상남도"→"경남" 같은 2자 정규화(지역단 판정·화면 표기가 같은 규칙을 쓰도록 단일화) */
function _hmSidoShort(m) {
  let s = String((m && m.sido) || "").slice(0, 2);
  const FIX = { "경상": ((m && m.sido) || "").indexOf("북") >= 0 ? "경북" : "경남", "전라": ((m && m.sido) || "").indexOf("북") >= 0 ? "전북" : "전남", "충청": ((m && m.sido) || "").indexOf("북") >= 0 ? "충북" : "충남" };
  return FIX[s] || s;
}
/* 시도 정규화 → 지역단(leadRouting LR_DAN 재사용) */
function hmDanOf(m) {
  const s = _hmSidoShort(m) || "서울";
  const map = (typeof LR_DAN !== "undefined" && LR_DAN[s]) || (typeof LR_DAN !== "undefined" && LR_DAN["서울"]) || { dans: ["강북지역단"] };
  let dan = map.dans[0];
  if (s === "서울" && typeof LR_SEOUL_GU !== "undefined") { const g = m.sigungu || ""; for (const d in LR_SEOUL_GU) if (LR_SEOUL_GU[d].indexOf(g) >= 0) { dan = d; break; } }
  return dan;
}
/* ── 시연 주인공(대표 본인 계정 = 조성래) ──
   형 지시(2026-10-05): 앞으로 회원 건강관리 설명은 조성래 데이터로 한다 → 은평지점 박성호 프로의
   담당 회원으로 전 탭에 나와야 한다. 세 개의 게이트(모집단·동의·배정)를 모두 열어야 하고,
   배정은 해시 추첨이 아니라 고정(pin)이어야 한다 — 그래야 다른 회원 배정이 1명도 흔들리지 않는다. */
const HM_SELF_PRO = HM_DEMO_SABUN;                        /* 조성래 담당 = 8H0001 박성호(은평지점) */
const HM_SELF_EMAIL = "srcho197011@hizenhealth.com";      /* 게이트 로그인 본인 계정(MyPage selfMember와 동일) */
function hmIsSelf(m) { return !!(m && (m.isSelf === true || m.email === HM_SELF_EMAIL)); }
/* 본인 회원 레코드 — MyPage.jsx selfMember()가 단일 해석기(여기서 재구현하지 않는다).
   거주지(sido/sigungu)는 selfMember()에 없고 core.jsx PT가 유일한 선언이므로 그 값을 읽어 붙인다.
   붙이지 않으면 hmProForMember가 DISTRICTS["서울"][0]="강남구"로 조용히 폴백한다(값 복제 금지). */
function hmSelfMember() {
  let s = null;
  try { if (typeof selfMember === "function") s = selfMember(); } catch (e) {}
  if (!s || !hmIsSelf(s)) return null;                    /* 체험회원으로 로그인 중이면 그 회원이 반환됨 → 중복 합류 금지 */
  if (!s.sigungu) { try { if (typeof PT !== "undefined" && PT && PT.sigungu) s = Object.assign({}, s, { sido: PT.sido, sigungu: PT.sigungu, dong: PT.dong, addr: PT.addr }); } catch (e) {} }
  return s;
}
/* 본인 계정 시연 전제 1회 보강 — 숫자를 만들지 않고 "전제"만 갖춘다(금고 검진 2개년·보험 통합조회).
   ⚠️ 2026-10-05 수정 — 전에는 이 함수가 hmPopulation()에서 불렸고(= 렌더 경로), 거기서 회원 대신
      ConsentNFT(cnIssue)를 발행했다. 실측 결과 두 가지가 잘못됐다:
      ① 회원이 아무 것도 하지 않은 상태로 헬스메이트 게이트만 띄워도 CNFT-…(scope mkt)가 발행됐다.
      ② 회원이 증서를 철회(revoked)하고 금고 mkt를 false로 내려도, 새로고침 한 번에 새 증서가
         active로 재발행되고 mkt가 true로 되살아났다(체인에 발행→철회→발행이 남았다).
      이제 ⓐ 발행은 하지 않는다 — 상담·안내 동의는 금고 시드(healthDataVault selfEnsureInsSeed의
      보험 단계)가 "시연 시드"로 기록한다. 회원이 직접 발행한 ConsentNFT와 섞지 않는다.
      ⓑ 호출은 렌더가 아니라 useEffect(HealthMateSection)에서 1회만 한다.
      ⓒ 철회 이력이 1건이라도 있으면 시드 보강 자체를 하지 않는다(복원 금지).
   반환값: 저장소가 바뀌었는지(true면 호출자가 다시 그린다). */
let _hmSelfReady = false;
function hmSelfEnsure(m) {
  if (_hmSelfReady) return false;
  m = m || hmSelfMember();
  if (!m || !hmIsSelf(m)) return false;
  _hmSelfReady = true;
  if (hmSelfRevoked(m)) return false;                       /* 철회 이력 — 되살리지 않는다 */
  let changed = false;
  try { if (typeof selfEnsureInsSeed === "function" && selfEnsureInsSeed(m)) changed = true; } catch (e) {}
  try { if (typeof selfEnsureMktSeed === "function" && selfEnsureMktSeed(m)) changed = true; } catch (e) {}
  return changed;
}
/* 철회 이력 — 철회된 상담·안내 동의 증서가 1건이라도 있으면 true.
   ⚠️ 금고의 mkt:false는 철회가 아니다 — 금고 시드가 검진 단계에서 "아직 미동의"로 false를 쓴다
      (healthDataVault seedSelfVault ①: 일괄동의 없음의 증거). 이걸 철회로 읽으면 시드를 깐 기기에서
      본인 계정이 콘솔 모집단에서 통째로 빠진다(실측: 로그인 시 selfEnsureInsSeed가 먼저 돌아
      hifin_self_ins_v4=1 상태라 담당 회원이 조성래 없이 집계됐다).
   철회를 되살리지 않는 보증은 발행 1회 시도 플래그(hifin_self_mkt_seed)가 맡는다 —
   플래그가 남아 있으면 selfEnsureMktSeed가 두 번째 호출부터 아무 것도 쓰지 않으므로, 시드 이후의
   철회(금고 mkt:false)는 그대로 유지된다. */
function hmSelfRevoked(m) {
  try {
    if (typeof cnList === "function") return cnList(m).some((x) => x.status === "revoked" && (x.scope || []).indexOf("mkt") >= 0);
  } catch (e) {}
  return false;
}
/* 콘솔 모집단 — 체험 16명 + 본인 계정. demoMembers 배열 자체는 16명으로 동결한다:
   utils/demoAuth.js runDemoTests가 "16명 전원 isDemoUser"를 단언하므로 명부에 끼워 넣으면 자가검증이 깨진다.
   ⚠️ 읽기 전용 — 이 경로에서는 저장소에 아무것도 쓰지 않는다(위 hmSelfEnsure 주석 참고). */
function hmPopulation() {
  const base = (typeof demoMembers !== "undefined" ? demoMembers : []).filter((m) => m && m.isDemoUser);
  const s = hmSelfMember();
  return s ? base.concat([s]) : base;
}

/* 회원 → 담당 프로(결정론) — 지역 일치 제1원칙: 회원 시군구의 프로(주 관할·겸임)에게만 배정.
   700명 명부(hmProsBySgg)가 로드되면 시군구 매칭, 아니면 기존 지역단 해시(폴백). */
/* 시연 고정 배정(체험 회원) — 지역 일치 제1원칙을 실제로 눌러 볼 상대가 필요하다.
   8H0001 박성호는 은평지점·은평구인데, 은평구에 사는 체험 회원 박춘봉(76세)이 해시 추첨에서
   8H0136에게 갔다(실측). 그 결과 박성호의 상호작용 가능 체험 회원이 0명이어서 접촉·기록·단계
   전진을 눌러 볼 대상이 본인 계정 1명뿐이었다(그 1명은 L8 평생주기라 단계 전진 시연 불가).
   추첨 이전에 빠지므로 다른 회원의 pool 길이·해시에 영향이 없다(코호트 재배정 0명 · 실측). */
const HM_PIN_MEMBERS = { "pcb500815@hizenhealth.com": HM_DEMO_SABUN };   /* 박춘봉 · 서울 은평구 → 은평지점 */
function hmProForMember(m) {
  /* 본인 계정 고정 배정 — 은평구 pool 17명 해시 추첨으로는 특정 프로를 보장할 수 없다.
     추첨 이전에 빠지므로 다른 회원의 배정 해시·pool 길이에 영향을 주지 않는다(실측 변경 0명). */
  if (hmIsSelf(m)) { const sp = hmProOf(HM_SELF_PRO); if (sp) return sp; }
  if (m && HM_PIN_MEMBERS[m.email]) { const pp = hmProOf(HM_PIN_MEMBERS[m.email]); if (pp) return pp; }
  if (typeof hmProsBySgg === "function" && typeof DISTRICTS !== "undefined") {
    let sd = String(m.sido || "서울").slice(0, 2);
    const FIX2 = { "경상": (m.sido || "").indexOf("북") >= 0 ? "경북" : "경남", "전라": (m.sido || "").indexOf("북") >= 0 ? "전북" : "전남", "충청": (m.sido || "").indexOf("북") >= 0 ? "충북" : "충남" };
    if (FIX2[sd]) sd = FIX2[sd];
    const list = DISTRICTS[sd] || [];
    const raw = m.sigungu || "";
    const sgg = list.find((d) => raw === d) || list.slice().sort((a, b) => b.length - a.length).find((d) => raw.indexOf(d.replace(/시$/, "")) === 0) || (list[0] || "");
    const r = hmProsBySgg(sd, sgg);
    if (r && r.pool.length) return r.pool[_hmHash(m.id || m.email) % r.pool.length];
  }
  const pros = hmActivePros(hmDanOf(m));
  return pros[_hmHash(m.id || m.email) % pros.length];
}

/* ── 동의 게이트 — 무동의 0명(생성 시점 배제). 철회(mkt:false 명시) 즉시 소멸 ── */
function hmConsentOK(m) {
  try {
    const tk = (typeof anonToken === "function") ? anonToken(m) : null;
    const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null;
    const st = v && v.consents && v.consents.state;
    if (st && st.mkt === false) return { ok: false, why: "상담·안내 동의 철회 — 목록 제외" };
    if (st && st.mkt === true) {
      /* 근거 표기를 섞지 않는다 — ①회원이 발행한 조건부 동의 증서 ②시연 시드 ③그 밖의 금고 기록 */
      let nft = false;
      try { nft = (typeof cnList === "function") && cnList(m).some((x) => x.status === "active" && (x.scope || []).indexOf("mkt") >= 0); } catch (e2) {}
      const tag = nft ? "조건부 동의 증서 유효" : (st.mktSeed ? "본인 계정 시연 시드 — 회원 발행 증서 아님" : "금고 기록" + (v.consents.ver ? " " + v.consents.ver : (v.consents.ts ? " " + _hmDay(v.consents.ts) : "")));
      return { ok: true, why: "상담·안내 동의(" + tag + ")" };
    }
  } catch (e) {}
  if (m.isDemoUser) return { ok: true, why: "상담·안내 동의(체험 회원 시연 시드)" };
  return { ok: false, why: "동의 기록 없음 — 목록 제외" };
}

/* ── 내 고객 스코프 — 생성 시점에 동의·배정 필터(조회 필터가 아님) ── */
function hmScope(code) {
  const key = hmCodeNorm(code);
  return hmPopulation().filter((m) => hmConsentOK(m).ok && (hmProForMember(m) || {}).code === key);
}
function hmScopeAll(code) { /* HM4 지역리드: 지역단 전체 관측(집계용 — 개인 상세는 스코프와 동일 규칙) */
  const p = hmProOf(code);
  if (!p || p.grade !== "HM4") return hmScope(code);
  return hmPopulation().filter((m) => hmConsentOK(m).ok && hmDanOf(m) === p.dan);
}

/* ── ② 검진대비보험 순번 배분(라운드로빈) — 성과가 아니라 순서로 나눈다 ── */
function hmAssignInsRR(m) {
  const dan = hmDanOf(m);
  const pros = hmActivePros(dan).filter((p) => p.lic);   // 모집자격 보유만
  if (!pros.length) return null;
  /* 폴백 여부 — hmActivePros는 그 지역단에 명부 프로가 없으면 광역(전국) 프로를 돌려준다.
     전에는 이 사실을 문구에 쓰지 않아 "충청지역단 단독 배분 (모집자격 보유 프로 8H0009 1명)"처럼
     충청지역단에 모집자격 프로가 있다는 거짓 사실이 화면에 찍혔다(실측 — 8H0009는 광역 소속). */
  const fb = pros.every((p) => p.dan !== dan);
  const key = "hifin_hm_rr_" + dan;
  let stored = null;
  try { stored = localStorage.getItem(key); } catch (e) {}
  const last = Number(stored == null ? "-1" : stored);
  const idx = (last + 1) % pros.length;
  try { localStorage.setItem(key, String(idx)); } catch (e) {}
  const prev = pros[(idx - 1 + pros.length) % pros.length];
  /* 근거 문구는 사번 전체를 쓴다 — 구 체계에서 뒤 3자리만 끊어 쓰던 표기는 8H####에서 충돌한다(8H0004·8H1004).
     포인터가 아직 없는 첫 배분에서는 "직전 X"를 쓰지 않는다 — 그 X는 배열 한 바퀴 앞 원소일 뿐 실제 직전 배분이 아니다. */
  if (fb) return { pro: pros[idx], reason: `${dan} 관할 모집자격 프로 없음 → ${pros[idx].dan} ${pros[idx].code} 배분`, fallback: true };
  if (pros.length === 1) return { pro: pros[idx], reason: `${dan} 단독 배분 (모집자격 보유 프로 ${pros[idx].code} 1명)` };
  if (stored == null) return { pro: pros[idx], reason: `${dan} 순번 시작 — 모집자격 프로 ${pros.length}명 중 ${idx + 1}번째(${pros[idx].code})` };
  return { pro: pros[idx], reason: `${dan} 순번 배분 (직전 ${prev.code} → 이번 ${pros[idx].code})` };
}
/* ② 배정 큐 — 시연: 검진대비보험 가입 회원(결정론 선별)을 최초 1회 순번 배분해 영속 저장.
   키 버전 v2(2026-10-05) — 사번 체계 교체 전에 구 코드로 저장된 큐는 새 키라 자동 폐기된다. */
const HM_INSQ_N = 5;                                /* 시연 큐 크기 — 체험 회원 중 검진대비보험 가입자 */
function hmInsQueue() {
  let q = _hmLs("hifin_hm_insq_v2", null);
  if (q) return q;
  /* 저장소 세대 교체 정책(2026-10-05 · 단일 정책) — 시스템이 만든 것은 재생성하고, 사람이 쓴 것은 이관한다.
     ② 큐와 순번 포인터(hifin_hm_rr_*)는 시스템 생성물이라 같은 세대로 묶어 함께 버린다.
     전에는 큐만 v2로 갈고 포인터는 구 값을 그대로 이어받아, 구 빌드를 돌린 기기와 새 기기에서
     ② 배정 결과가 달라질 수 있었다(실측: 강북 포인터 '0' 잔존). ⑧ 제안은 프로 작성물이라 hmIdeas에서 이관한다. */
  try { localStorage.removeItem("hifin_hm_insq"); } catch (e) {}
  try { const del = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("hifin_hm_rr_") === 0) del.push(k); } del.forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  /* 모집단은 체험 회원만 — 본인 계정(조성래)은 검진대비보험 신규 가입 대상이 아니고,
     큐에 넣으면 접촉 락(HELD)이 걸려 ①③④⑤⑥⑦⑨ 전 탭에서 사라진다. */
  /* 고정 배정 회원(HM_PIN_MEMBERS)은 큐에서 제외한다 — 큐에 들어가면 접촉 락(HELD)이 걸려
     ①③④⑤⑥⑦⑨ 전 탭에서 사라지고, 은평지점 담당 체험 회원을 눌러 볼 수 없게 된다(고정의 목적 상실). */
  const all = (typeof demoMembers !== "undefined" ? demoMembers : []).filter((m) => m && m.isDemoUser && hmConsentOK(m).ok && !HM_PIN_MEMBERS[m.email]);
  /* 선별 — 전에는 _hmHash%3이어서 담당 지역단을 보지 않았다. 실측 결과 큐 5건이 8H0007·8H0009·8H0006에만
     가고 로그인 기본 사번(8H0001 박성호)은 0건이어서 ② 첫 블록이 "내 배정 0건"으로 열렸고, 5건 전부
     모집자격 프로 1명인 지역단이라 「순번 배분 원칙」 바로 아래에 순번을 보여주는 행이 없었다.
     이제 지역단별로 고르되 ①모집자격 프로가 많은 지역단 ②그 다음 지역단 이름 순으로 채운다 —
     1회차에서 지역단 다양성을 확보하고, 2회차는 순번이 실제로 도는 지역단(모집자격 2명 이상)만 더 넣는다. */
  const byDan = {};
  all.forEach((m) => { const d = hmDanOf(m); (byDan[d] || (byDan[d] = [])).push(m); });
  const licN = {};
  Object.keys(byDan).forEach((d) => {
    licN[d] = hmActivePros(d).filter((p) => p.lic && p.dan === d).length;        /* 폴백(광역) 프로는 세지 않는다 */
    byDan[d].sort((a, b) => _hmHash("insq" + (a.id || a.email)) - _hmHash("insq" + (b.id || b.email)));
  });
  const byLic = (a, b) => (licN[b] - licN[a]) || (a < b ? -1 : a > b ? 1 : 0);
  const rot = Object.keys(byDan).filter((d) => licN[d] >= 2).sort(byLic);   /* 순번이 실제로 도는 지역단 */
  const one = Object.keys(byDan).filter((d) => licN[d] < 2).sort(byLic);
  /* 슬롯 순서 — ①순번 지역단 1건씩 ②같은 지역단 2건째(여기서 "직전 → 이번"이 처음 보인다) ③나머지 지역단 1건씩 */
  const slots = rot.map((d) => [d, 0]).concat(rot.map((d) => [d, 1])).concat(one.map((d) => [d, 0]));
  const picked = [];
  for (const [d, r] of slots) {
    if (picked.length >= HM_INSQ_N) break;
    const m = byDan[d][r];
    if (m) picked.push(m);
  }
  q = picked.map((m) => { const a = hmAssignInsRR(m); return { email: m.email, name: m.name, at: Date.now() - (_hmHash(m.email) % 6 + 1) * _HM_DAY, code: a ? a.pro.code : null, reason: a ? a.reason : "" }; });
  _hmSave("hifin_hm_insq_v2", q);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `검진대비보험 배정 큐 생성(시연) — ${q.length}건 순번 배분(무동의 0명)` }); } catch (e) {}
  return q;
}

/* ── 접촉 락 — 검진결과 수령 전 접촉 금지. 해제는 시스템 이벤트만(프로·관리자 해제 버튼 없음) ── */
function hmLockState(m) {
  const inQ = hmInsQueue().some((x) => x.email === m.email);
  if (!inQ) return { locked: false, reason: null };
  const seen = _hmLs("hifin_hm_resultseen_" + m.email, null);
  if (seen) return { locked: false, reason: null, seenAt: seen.at };
  return { locked: true, reason: "검진결과 수령 전 — 접촉 금지(하이가 결과 수령 시 자동 해제)" };
}
/* 시스템 이벤트 시뮬 — 검진결과 수령(시연 트리거 · 프로의 임의 해제가 아님) */
function hmSimResult(email) {
  if (_hmLs("hifin_hm_resultseen_" + email, null)) return { ok: false, reason: "이미 수령됨" };
  _hmSave("hifin_hm_resultseen_" + email, { at: Date.now() });
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `검진결과 수령 이벤트(시연) — 접촉 락 자동 해제(${_hmMask(email)})` }); } catch (e) {}
  return { ok: true };
}
/* 잠금 위반 시도 — 감사 기록.
   ⚠️ 첫 인자는 **프로 사번**이다. 집계(hmMyStats)가 `x.code === code`로 사번과 비교하므로 여기에
      채널 이름("video")을 넣으면 그 행은 어느 프로의 viol/lockOk에도 들어가지 않는다 — 실제로
      영상 경로가 그랬다(적대적 리뷰 실증 2026-10-06). 채널은 별도 필드(channel)로 남긴다.
   ⚠️ 사번을 알 수 없는 호출은 code를 비우고 channel만 남긴다 — 「프로 집계에 들어오지 않는 행」이
      조용히 생기지 않게, 비어 있다는 사실이 행에 적힌다. */
function hmLockViolation(code, m, channel) {
  const l = _hmLs("hifin_hm_lockviol", []);
  l.push({ at: Date.now(), code: code || "", email: m && m.email, channel: channel || "call" });
  _hmSave("hifin_hm_lockviol", l);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `LOCK_VIOLATION_ATTEMPT — ${code || "(사번 없음)"} · 채널 ${channel || "call"} · 검진결과 전 접촉 시도 차단` }); } catch (e) {}
}

/* ── 단계 판정 — 데이터만 근거(수기 승급 없음). 전이는 캐시 비교 후 체인 기록 ── */
function hmStageOf(m) {
  const ev = [];
  const push = (k, ok, why) => ev.push({ k, ok: !!ok, why });
  const consent = hmConsentOK(m);
  push("D1", consent.ok, consent.why);
  /* D2 — 1세대: 금고 실측 우선, 없으면 체험 회원 시연 실측 시드 */
  let d2 = false, d2w = "검진 데이터 없음";
  try {
    const vk = (typeof vaultCheckupMap === "function") ? vaultCheckupMap(m) : null;
    if (vk) { d2 = true; d2w = `금고 실측 ${vk.n}항목 · ${vk.date}(1세대 자산)`; }
    else if (m.isDemoUser && typeof genMemberCheckup === "function") { const c = genMemberCheckup(m); if (c) { d2 = true; d2w = `검진 실측 ${Object.keys(c.items).length}항목(시연 실측 시드)`; } }
  } catch (e) {}
  push("D2", d2, d2w);
  /* D3 — 2세대: AI 분석 등급 산출 */
  let d3 = false, d3w = "분석 미생성";
  try { const g = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null; if (d2 && g) { d3 = true; d3w = `AI 분석 등급 「${g.grade}」 산출(2세대 자산)`; } } catch (e) {}
  push("D3", d3, d3w);
  /* D4 — 3세대: 결합 2종 이상(보험·행동·가족·상담이력) */
  const parts = [];
  try { const certs = _hmLs("hifin_ins_certs", []); if (certs.some((c) => c.insured && c.insured.name === m.name)) parts.push("보험 증서"); } catch (e) {}
  try { if (hmInsQueue().some((x) => x.email === m.email)) if (parts.indexOf("보험 증서") < 0) parts.push("검진보험 가입"); } catch (e) {}
  try { const adh = _hmLs("hifin_adh_" + m.email, {}); if (Object.keys(adh).length) parts.push("복약·실천 기록"); } catch (e) {}
  try { if (localStorage.getItem("hifin_family_" + m.email)) parts.push("가족 등록"); } catch (e) {}
  try { const ld = _hmLs("hifin_leads_" + m.email, []); if (ld.length) parts.push("상담 이력"); } catch (e) {}
  push("D4", d3 && parts.length >= 2, parts.length ? `결합 ${parts.length}종(${parts.join("·")})` : "결합 데이터 없음(보험·행동·가족 중 2종 필요)");
  /* L5 — 주기: 터치 3회+ 또는 금고 다년 검진 */
  let l5 = false, l5w = "반복 주기 미형성(터치 3회 또는 2개년 검진 필요)";
  try { const t = _hmLs("hifin_hm_touch_" + m.email, []); if (t.length >= 3) { l5 = true; l5w = `건강 터치 ${t.length}회 완료(주기 형성)`; } } catch (e) {}
  try { const tk = (typeof anonToken === "function") ? anonToken(m) : null; const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null; if (v && (v.checkups || []).length >= 2) { l5 = true; l5w = `금고 검진 ${v.checkups.length}개년(시계열)`; } } catch (e) {}
  push("L5", l5, l5w);
  /* L6 — 가구: 저장된 가족 2인+ 또는 가족 상담 리드 */
  let l6 = false, l6w = "가족 데이터 없음";
  try { const raw = localStorage.getItem("hifin_family_" + m.email); if (raw) { const f = JSON.parse(raw); if (f && f.length >= 2) { l6 = true; l6w = `가족 ${f.length}명 등록(가구 단위)`; } } } catch (e) {}
  try { const ld = _hmLs("hifin_leads_" + m.email, []); if (ld.some((x) => x.family)) { l6 = true; l6w = "가족 상담 이력 보유"; } } catch (e) {}
  push("L6", l6, l6w);
  /* L7 — 자산화: 동의 증서(ConsentNFT) 유효 보유 */
  let l7 = false, l7w = "동의 증서 미발행";
  try { if (typeof cnList === "function") { const c = cnList(m).filter((x) => x.status === "active"); if (c.length) { l7 = true; l7w = `동의 증서 ${c.length}건 유효(데이터 주권 행사)`; } } } catch (e) {}
  push("L7", l7, l7w);
  /* L8 — 평생: 금고 2개년+ 또는 요율 재산정 완료 */
  let l8 = false, l8w = "다년 추이 미확보(2개년 검진 필요)";
  try { const tk = (typeof anonToken === "function") ? anonToken(m) : null; const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null; if (v && (v.checkups || []).length >= 2) { l8 = true; l8w = `${v.checkups.length}개년 추이 — 재산정 가능`; } } catch (e) {}
  push("L8", l8, l8w);
  const reached = ev.filter((x) => x.ok).map((x) => x.k);
  const order = HM_STAGES.map((s) => s.k);
  let cur = "D1";
  order.forEach((k) => { if (reached.indexOf(k) >= 0) cur = k; });
  /* 전이 캐시 — 정체 계산. 최초 1회는 시연 시드 오프셋(실서비스에서는 실제 전이 시각) */
  const ck = "hifin_hm_stagecache_" + m.email;
  let cache = _hmLs(ck, null);
  if (!cache) { cache = { cur, at: Date.now() - ((_hmHash("st" + m.email) % 38) + 3) * _HM_DAY, seed: true }; _hmSave(ck, cache); }
  else if (cache.cur !== cur) {
    try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `고객 단계 전이 ${cache.cur}→${cur} — 데이터 근거 자동 판정` }); } catch (e) {}
    cache = { cur, at: Date.now() };
    _hmSave(ck, cache);
  }
  const stalledDays = Math.floor((Date.now() - cache.at) / _HM_DAY);
  return { cur, reached, evidence: ev, stalledDays, stalled: stalledDays >= 30 && cur !== "L8" };
}

/* ── 관리상태 판정 — 락 > 접촉필요 > 정체 > 진행 > 완료 > 종결 ── */
function hmStatusOf(m, stage) {
  const lk = hmLockState(m);
  if (lk.locked) return { k: "HELD", ...HM_MSTATUS.HELD, why: lk.reason };
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const last = touches.length ? touches[touches.length - 1] : null;
  const plan = hmTouchPlan(m);
  const due = plan.items.filter((x) => x.due && !x.done);
  if (due.length) return { k: "NEED", ...HM_MSTATUS.NEED, why: due[0].title + " 시점 도래" };
  const st = stage || hmStageOf(m);
  if (st.stalled) return { k: "STALL", ...HM_MSTATUS.STALL, why: `${st.cur} 단계에서 ${st.stalledDays}일 정체` };
  if (last && Date.now() - last.at < 7 * _HM_DAY) return { k: "DONE", ...HM_MSTATUS.DONE, why: "최근 터치 완료(" + _hmDay(last.at) + ")" };
  if (last) return { k: "PROG", ...HM_MSTATUS.PROG, why: "관리 진행 중" };
  return { k: "PROG", ...HM_MSTATUS.PROG, why: "신규 배정 — 하이 브리핑 확인" };
}

/* ── 건강현황 요약 — 등급·관리필요 수·위험 밴드(원본 수치 미노출) ── */
function hmHealthBrief(m) {
  let grade = "-", sevN = 0, band = "중", year = "-", seen = false;
  try { const g = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null; if (g) { grade = g.grade; sevN = (g.sev1 || 0) + (g.sev2 || 0); } } catch (e) {}
  /* 연도는 금고 실측이 1순위 — 생성 검진(genMemberCheckup)의 가상 연차를 먼저 쓰면 금고에 실측을 가진
     회원(본인 계정)의 화면 연도와 ⑨ 단계 근거의 검진일이 몇 해씩 어긋난다(숫자 모순 지점). */
  try { const vk = (typeof vaultCheckupMap === "function") ? vaultCheckupMap(m) : null; if (vk && vk.date) year = String(vk.date).slice(0, 4) + "년"; } catch (e) {}
  if (year === "-") { try { const c = m._chk || ((typeof genMemberCheckup === "function") ? genMemberCheckup(m) : null); if (c && c.years && c.years.length) year = c.years[c.years.length - 1] + "년"; } catch (e) {} }   /* [실측 통일 2026-10-06] 2시점 회원에서 years[2]는 undefined — 「undefined년」이 떴다 */
  /* 위험 밴드 — riskPredict(금고 연동) 우선, 미연동 시 회원 건강 프로필(시연 시드)로 조립.
     [실측 통일 2026-10-05] 본인 계정은 밴드를 비운다(「—」) — 백분위 분포가 합성 코호트라 실측 근거가 없다(형 지시 ②). */
  try {
    const rp = (typeof riskPredict === "function") ? riskPredict(m) : null;
    if (rp && rp.ok && rp.risks.length) band = (rp.risks[0].topPct == null) ? "—" : rp.risks[0].topPct <= 20 ? "상" : rp.risks[0].topPct <= 50 ? "중" : "하";
    else { const cg = m.cancerRiskGrade || 3; band = cg >= 6 ? "상" : cg >= 4 ? "중" : "하"; }
  } catch (e) {}
  seen = !!_hmLs("hifin_hm_resultseen_" + m.email, null);
  return { grade, sevN, band, year, seen };
}

/* ── ③ 터치 플랜 — 첫 연결(결합 패키지) + 조건부 타임라인. 만기는 증서/청약일 기준 계산(상수 금지) ── */
function hmTouchPlan(m) {
  const items = [];
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const doneKeys = {};
  touches.forEach((t) => { doneKeys[t.key] = true; });
  const seen = _hmLs("hifin_hm_resultseen_" + m.email, null);
  const now = Date.now();
  if (seen) {
    const base = seen.at;
    items.push({ key: "combo", title: "첫 연결 — 결과분석 + 검진대비보험 안내(1회 통합)", when: base, due: now >= base, done: !!doneKeys.combo, pack: true });
    items.push({ key: "d7", title: "이해 확인 — \"설명이 어렵진 않으셨어요?\"", when: base + 7 * _HM_DAY, due: now >= base + 7 * _HM_DAY, done: !!doneKeys.d7 });
    let sevOk = false; try { const g = memberHealthGrade(m); sevOk = g && (g.sev1 + g.sev2) > 0; } catch (e) {}
    if (sevOk) items.push({ key: "d14", title: "관리 필요 항목 재확인(등급 이하 항목만)", when: base + 14 * _HM_DAY, due: now >= base + 14 * _HM_DAY, done: !!doneKeys.d14 });
    let deep = false; try { deep = (m.managementPoints || []).some((p) => /내시경|초음파|정밀|CT|MRI/.test(p)); } catch (e) {}
    if (deep) items.push({ key: "d30", title: "추가 검진·진료 안내(정밀검사 권고 항목)", when: base + 30 * _HM_DAY, due: now >= base + 30 * _HM_DAY, done: !!doneKeys.d30 });
  }
  /* 만기 — 증서 스냅샷 우선(발급 익일 0시 + 60일 — CYCLE_SPEC.expiryDay와 정합), 증서 미발급 가입 회원은 청약일 기준(시연 표기)
     ⚠️ 2026-10-05 수정 — 전에는 c.at(그 기기가 금고를 처음 시드한 벽시계 시각)을 발급 시각으로 썼다.
        근거 문구는 "증서 CERT-JSR2024A"라고 밝히면서 만기는 시드 시각 + 61일로 계산해, 2024년 증서가
        2026년 12월에 만기되는 모순이 화면에 떴고 새 기기에서 시드하면 기기마다 다른 날짜가 나왔다(실측).
        이제 증서 날짜(c.date — 발급 사실의 날짜)가 단일 근거다. c.at은 날짜가 없는 증서의 폴백으로만 쓴다. */
  /* 보장기간은 insCheckupWindow 하나에서 읽는다 — 회원 화면(insService.checkupIns)과 같은 근거다.
     만기 분기의 시계만 창 판정 시각(insNow — 시연 기준일)으로 쓴다. 위의 첫 연결 블록
     (combo·d7·d14·d30)은 base가 회원이 결과를 본 실제 시각(seen.at)이라 벽시계를 그대로 둔다 —
     전체를 기준일로 바꾸면 기준일보다 뒤에 결과를 본 회원의 첫 연결이 영구 미도래가 된다. */
  const W = (typeof insCheckupWindow === "function") ? insCheckupWindow(m) : null;
  /* 만기 분기의 판정 시각은 **창이 쓴 그 시각**(W.now)을 받아 쓴다 — 전에는 insNow()를 직접 불러
     시연 시드가 아닌 창(증서·청약·계약 생성 기반)까지 기준일로 판정했다. 그러면 기준일 이후에
     열리는 창은 영구히 개시 전이 되어 D-30·D-7이 끝까지 도래하지 않는다. */
  const wnow = W ? W.now : ((typeof insNow === "function") ? insNow() : now);
  let issueAt = W ? W.issuedAt : null, src = W ? W.src : null;
  if (issueAt) {
    const end = W.end;
    if (wnow > end) {
      /* 이미 만기가 지난 증서 — D-30·D-7 "예정" 행을 만들면 지난 날짜가 오늘의 할 일로 올라온다.
         보장 종료 사실 1행으로 요약하고, 다음 검진 주기 제안으로 잇는다. */
      items.push({ key: "mend", title: `보장 종료 — 검진대비보험 만기 경과(${(typeof insDayStr === "function") ? insDayStr(end) : _hmDay(end)}) · 다음 검진 주기 제안`, when: end + _HM_DAY, due: true, done: !!doneKeys.mend, src, ended: true });
    } else {
      [["m30", "만기 D-30 — 검진대비보험 만기 예정 안내", end - 30 * _HM_DAY], ["m7", "만기 D-7 — 재가입·차기 검진 연계 안내", end - 7 * _HM_DAY], ["m1", "만기 D+1 — 보장 종료·다음 검진 주기 제안", end + _HM_DAY]].forEach(([k, t, w]) => {
        items.push({ key: k, title: t, when: w, due: wnow >= w, done: !!doneKeys[k], src });
      });
    }
  }
  return { items: items.sort((a, b) => a.when - b.when), endSrc: src };
}

/* ── ④ 질병 예측 카드 — riskPredict 우선, 미연동 시 회원 건강 프로필 조립(계산 없음·밴드만) ── */
function hmRiskCards(m) {
  /* [실측 통일 2026-10-05] 본인 계정은 실측 리포트 행을 그대로 보여 준다 —
     「당뇨병 상 — 상위 1% 구간」 같은 밴드는 합성 코호트 백분위라 실측 근거가 없다(형 지시 ②).
     대신 리포트 수치(당뇨 +6.2%/10년 10.9% · 고혈압 -3.9%/22.3% · 간 54.4세 · 췌장암 경고)를 근거로 적는다. */
  try {
    if (typeof selfRealIsSelf === "function" && selfRealIsSelf(m) && typeof selfRealRiskRows === "function") {
      const sr = selfRealRiskRows();
      if (sr && sr.rows.length) return { src: sr.src, note: sr.bandNote, rows: sr.rows.slice(0, 3).map((r) => ({ ko: r.ko, band: "—", why: r.why, trend: r.trend })) };
    }
  } catch (e) {}
  try {
    const rp = (typeof riskPredict === "function") ? riskPredict(m) : null;
    /* 「실측」 표기는 본인 계정(위 분기)에만 — 체험·코호트 금고는 시연 시드다 */
    if (rp && rp.ok) return { src: "riskPredict(금고 검진값 · 시연 시드)", rows: rp.risks.slice(0, 3).map((r) => ({ ko: r.ko, band: r.topPct == null ? "—" : r.topPct <= 20 ? "상" : r.topPct <= 50 ? "중" : "하", why: r.topPct == null ? `검진 수치 근거 · ${r.trend}` : `동년배 대비 상대 위험 상위 ${r.topPct}% 구간 · ${r.trend}`, trend: r.trend })) };
  } catch (e) {}
  const rows = [];
  (m.highRiskCancerTypes || []).slice(0, 2).forEach((c) => rows.push({ ko: c, band: (m.cancerRiskGrade || 3) >= 6 ? "상" : "중", why: "암 위험 등급 " + (m.cancerRiskGrade || "-") + " · 관리 권고", trend: "관리 필요" }));
  (m.highRiskDiseases || []).slice(0, 2).forEach((d) => rows.push({ ko: d, band: "중", why: "질환 이력 기반 관리 대상", trend: "지속 관리" }));
  if (!rows.length) rows.push({ ko: "특이 위험 없음", band: "하", why: "현재 프로필 기준 관리 권고 항목 없음", trend: "유지" });
  return { src: "회원 건강 프로필(시연 실측 시드)", rows: rows.slice(0, 3) };
}

/* ── ⑦ 대화형 인수조건 — underwrite 우선, 미연동 시 등급 기반 조립. 항상 가능성 3구간 + 면책 부착 ── */
const HM_UW_DISCLAIM = "⚠ 확정은 인수사(현대해상) 심사입니다. 회원께는 \"가능성\"으로만 말씀해 주세요.";
function hmUnderwriteTalk(m, q) {
  const prod = /실손/.test(q) ? "실손의료보험" : /암/.test(q) ? "암 진단비" : /수술/.test(q) ? "수술비 특약" : /간편/.test(q) ? "간편심사보험" : "진단비 플랜";
  let lines = [], docs = ["최근 검진 결과지"], memberLine = "";
  try {
    const uw = (typeof underwrite === "function") ? underwrite(m, prod) : null;
    if (uw && uw.ok) {
      const d = uw.decision;
      const tri = d.indexOf("표준체") >= 0 ? [["표준체", "높음"], ["간편심사형", "있음"], ["부담보 조건부", "불필요"]]
        : d.indexOf("할증") >= 0 ? [["표준체", "낮음"], ["간편심사형", "높음"], ["부담보 조건부", "있음"]]
        : d.indexOf("유병자") >= 0 ? [["표준체", "낮음"], ["간편심사형", "높음"], ["관리자 요율(할인 방향)", "있음"]]
        : [["표준체", "낮음"], ["간편심사형", "있음"], ["조건부(포용 경로)", "있음"]];
      lines = tri; if (uw.disclosures && uw.disclosures.length) docs.push("고지 대상: " + uw.disclosures.map((x) => x.item).join(" · "));
      memberLine = uw.note;
      return { product: prod, src: "underwrite(금고 실측 시뮬)", tri: lines, docs, memberLine, disclaim: HM_UW_DISCLAIM };
    }
  } catch (e) {}
  let g = null; try { g = memberHealthGrade(m); } catch (e) {}
  const gr = g ? g.grade : "정상";
  const sick = (m.highRiskDiseases || []).length > 0;
  if (gr === "긴급" || gr === "고위험") lines = [["표준체", "낮음"], ["간편심사형", "있음"], ["부담보 조건부", "있음(해당 부위 한정)"]];
  else if (sick || gr === "치료중" || gr === "지속관리") lines = [["표준체", "낮음"], ["간편심사형", "높음"], ["부담보 조건부", "있음(해당 부위 한정)"]];
  else if (gr === "이상" || gr === "경계") lines = [["표준체", "있음"], ["간편심사형", "높음"], ["부담보 조건부", "불필요 가능성"]];
  else lines = [["표준체", "높음"], ["간편심사형", "가능(불필요)"], ["부담보 조건부", "불필요"]];
  if (sick) docs.push("최근 3개월 처방·복약 이력");
  memberLine = sick ? `${(m.highRiskDiseases || []).join("·")} 이력이 있어도 현재 관리 상태에 따라 가입 경로가 열려 있어요 — 정확한 조건은 심사로 확정돼요.` : "현재 건강상태 기준으로 가입 경로가 열려 있어요 — 정확한 조건은 심사로 확정돼요.";
  const out = { product: prod, src: "건강 등급 조립(등급 「" + gr + "」 기준)", tri: lines, docs, memberLine, disclaim: HM_UW_DISCLAIM };
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `인수조건 대화(underwrite-talk) — ${prod} · 가능성 3구간 안내(확정 아님)` }); } catch (e) {}
  return out;
}

/* ── 접촉 행동 실행 — 락·동의 재검증 후 기록(자체 판단 없음) ── */
const HM_BANNED = ["무조건", "확정", "보장됩니다", "100%", "가입 가능합니다", "거절됩니다", "수익", "원금"];
function hmAct(code, m, act) {
  const lk = hmLockState(m);
  if (lk.locked) { hmLockViolation(code, m, (act && act.channel) || "call"); return { ok: false, reason: "접촉 금지 상태예요 — 검진결과 수령 후 하이가 자동으로 열어 드려요." }; }
  /* ⚠️ 단계 축도 함께 본다(적대적 리뷰 실증 2026-10-06) — hmLockState는 「검진대비보험 큐에 있고
     결과 미수령」만 보므로, D1이면서 큐에 없는 회원은 ①탭 신호 접촉·③탭 터치 연결·⑨탭 연결하기·
     알림 발송이 전부 열려 있었다(코호트는 hmContactBlocked로 막았는데 상호작용층만 남았다).
     모든 접촉 기록의 단일 통로가 이 함수이므로, 판정을 여기서 합쳐 네 경로가 한 번에 닫힌다. */
  try {
    const st = (typeof hmStageOf === "function") ? hmStageOf(m) : null;
    if (st && st.cur === "D1") { hmLockViolation(code, m, (act && act.channel) || "call"); return { ok: false, reason: "검진 결과 수령 전이라 연락하지 않아요(가입 여부와 무관) — 결과가 도착하면 하이가 열어 드려요." }; }
  } catch (e) {}
  const c = hmConsentOK(m);
  if (!c.ok) return { ok: false, reason: "유효한 동의가 없어요 — 접촉할 수 없어요." };
  if (act.note && HM_BANNED.some((w) => act.note.indexOf(w) >= 0)) return { ok: false, reason: "금칙어가 포함돼 있어요 — 단정·과장 표현은 보낼 수 없어요." };
  const l = _hmLs("hifin_hm_touch_" + m.email, []);
  l.push({ at: Date.now(), key: act.key || "manual", tab: act.tab || "", act: act.label || "접촉", result: act.result || "연결됨", by: code });
  _hmSave("hifin_hm_touch_" + m.email, l);
  try { if (typeof vaultAccessLog === "function" && typeof anonToken === "function") vaultAccessLog(anonToken(m), "healthmate", `${code} · ${act.label || "접촉"}(${act.tab || "-"})`); } catch (e) {}
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `프로 접촉 기록 — ${code} · ${act.label || "접촉"} · 결과 ${act.result || "연결됨"}` }); } catch (e) {}
  try { if (typeof notifPush === "function" && act.notify) notifPush({ ic: "check", t: act.notifyTitle || "담당 프로 안내", d: act.notify, target: "checkup" }); } catch (e) {}
  return { ok: true };
}

/* ── ⑨ 내 실적 — 단계 전진으로 정의(금액·수수료·순위 없음) ── */
function hmMyStats(code) {
  const members = hmScope(code);
  const q = hmInsQueue().filter((x) => x.code === code);
  let touches = 0, done7 = 0, stalledN = 0, adv = 0;
  const trans = {};
  members.forEach((m) => {
    const t = _hmLs("hifin_hm_touch_" + m.email, []); touches += t.length;
    if (t.some((x) => Date.now() - x.at < 7 * _HM_DAY)) done7++;
    const st = hmStageOf(m); if (st.stalled) stalledN++;
    const cache = _hmLs("hifin_hm_stagecache_" + m.email, null);
    if (cache && !cache.seed) { adv++; trans[cache.cur] = (trans[cache.cur] || 0) + 1; }
  });
  const viol = _hmLs("hifin_hm_lockviol", []).filter((x) => x.code === code).length;
  const firstDone = q.filter((x) => { const s = _hmLs("hifin_hm_resultseen_" + x.email, null); const t = _hmLs("hifin_hm_touch_" + x.email, []); return s && t.some((y) => y.key === "combo"); }).length;
  const firstNeed = q.filter((x) => _hmLs("hifin_hm_resultseen_" + x.email, null)).length;
  return { assigned: members.length, insAssigned: q.length, touches, done7, stalledN, adv, trans, lockOk: viol === 0, viol, firstRate: firstNeed ? Math.round(firstDone / firstNeed * 100) : 100 };
}

/* ── ⑧ 프로 제안함 — 모든 상태 변화에 사유. 자동 반영 없음(사람 검수) ── */
const HM_IDEA_SEED_IDS = { "ID-001": 1, "ID-002": 1, "ID-003": 1 };
function hmIdeas() {
  let l = _hmLs("hifin_hm_ideas_v2", null);
  if (l) return l;
  /* v2 — 사번 체계 교체(2026-10-05). 저장소 세대 교체 정책은 ② 큐와 같다: 시스템이 만든 시드 3건은
     신 사번 버전으로 다시 깔고, 프로가 직접 쓴 제안은 code만 hmCodeNorm으로 치환해 이관한다.
     전에는 구 키를 removeItem으로 통째로 버려서, 주입한 구 제안(ID-009)이 아무 안내 없이 사라졌다(실측). */
  let carried = [];
  try {
    carried = (_hmLs("hifin_hm_ideas", []) || []).filter((x) => x && x.id && !HM_IDEA_SEED_IDS[x.id])
      .map((x) => Object.assign({}, x, { code: (typeof hmCodeNorm === "function") ? hmCodeNorm(x.code) : x.code, carried: true }));
  } catch (e) {}
  try { localStorage.removeItem("hifin_hm_ideas"); } catch (e) {}
  l = [
    { id: "ID-001", cat: "화면", title: "정체 회원에게 하이 문안 2안 제시", body: "정체 카드의 권장 문안이 1개뿐이라 회원 성향에 따라 고르기 어렵습니다. 격식/친근 2안이 필요합니다.", code: "8H0001", dan: "강북지역단", tab: "⑨", at: Date.now() - 12 * _HM_DAY, status: "반영 완료", why: "하이 문안 템플릿 2안 채택 — 커밋 c71ef08 계열 반영(백서반영표 기록)", votes: 4 },
    { id: "ID-002", cat: "배분", title: "순번 배분 건너뛴 프로 우선권 표시", body: "한도 초과로 건너뛴 회차의 우선권이 있는지 화면에서 안 보입니다. 다음 회차 우선권 배지가 필요합니다.", code: "8H0003", dan: "강남지역단", tab: "②", at: Date.now() - 6 * _HM_DAY, status: "검토중", why: "규칙은 존재(포인터 유지) — 배지 노출 방안 검토 중", votes: 2 },
    { id: "ID-003", cat: "규제", title: "만기 안내 문자에 광고 표기 여부 확인 요청", body: "만기 D-30 안내가 정보성인지 광고성인지 기준이 필요합니다. 법무 검토 요청드립니다.", code: "8H0006", dan: "강서지역단", tab: "③", at: Date.now() - 3 * _HM_DAY, status: "보류", why: "법무 검토 대기 — 계약 관리 목적은 정보성으로 잠정 분류(사유 명시)", votes: 5 },
  ];
  if (carried.length) l = carried.concat(l);
  _hmSave("hifin_hm_ideas_v2", l);
  return l;
}
function hmIdeaAdd(code, o) {
  const p = hmProOf(code);
  if (!p) return { ok: false, reason: "코드 없음" };
  if (HM_BANNED.some((w) => (o.body || "").indexOf(w) >= 0)) { /* 금칙어는 제안 자체에는 완화 — 회원 정보만 차단 */ }
  if (/\d{6}-\d{7}|@hizenhealth/.test(o.body || "")) return { ok: false, reason: "회원 개인정보로 보이는 내용은 담을 수 없어요." };
  const l = hmIdeas();
  const it = { id: "ID-" + String(l.length + 1).padStart(3, "0"), cat: o.cat || "기타", title: (o.title || "").slice(0, 60), body: (o.body || "").slice(0, 2000), code: p.code, dan: p.dan, tab: o.tab || "-", at: Date.now(), status: "접수", why: "접수 완료 — 검토 대기", votes: 0 };
  l.unshift(it); _hmSave("hifin_hm_ideas_v2", l);
  return { ok: true, idea: it };
}
function hmIdeaVote(id) { const l = hmIdeas(); const it = l.find((x) => x.id === id); if (it) { it.votes = (it.votes || 0) + 1; _hmSave("hifin_hm_ideas_v2", l); } return l; }

/* ── ⑨ 고객 카드 조립 + 하이의 한 줄 ── */
function hmCustomerCard(m) {
  const stage = hmStageOf(m);
  const status = hmStatusOf(m, stage);
  const hb = hmHealthBrief(m);
  const plan = hmTouchPlan(m);
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const last = touches.length ? touches[touches.length - 1] : null;
  /* 「다음 터치」는 **각 행이 자기 시계로 판정한 due**로 고른다(2026-10-08 수선).
     전에는 when > Date.now()로 골랐는데, plan.items의 when은 만기 분기가 기준일 파생 창에서,
     첫 연결 분기가 벽시계(seen.at)에서 만든 **서로 다른 두 시계**의 값이다. 그래서 같은 카드가
     한 시계로 고른 「다음 터치」와 다른 시계로 고른 「오늘 연결」을 나란히 적었고, 벽시계가
     창을 지나면(실측: 2026-11-10·2026-12-20) next가 null이 되어 「다음 터치 지금」이 영구히
     남았다. due는 그 행을 만든 시계가 판정한 값이므로 !due = 「아직 때가 아니다」로 일치한다. */
  const next = plan.items.find((x) => !x.done && !x.due);
  const dueNow = plan.items.find((x) => x.due && !x.done);
  /* 하이의 한 줄 — 상태·단계·타이밍을 근거로 조립(새 문장 창작이 아니라 규칙 조립) */
  let hi;
  if (status.k === "HELD") hi = "검진결과 수령 전이에요. 지금은 프로필 사전 학습만 — 결과가 오면 제가 바로 알려드릴게요.";
  else if (dueNow) hi = `「${dueNow.title}」 시점이 왔어요. 오늘 연결하는 게 좋겠어요.`;
  else if (stage.stalled) {
    const nextStage = HM_STAGES[HM_STAGES.findIndex((s) => s.k === stage.cur) + 1];
    hi = `${stage.stalledDays}일째 ${stage.cur}에 멈춰 있어요.` + (nextStage ? ` ${nextStage.k}(${nextStage.name})로 가려면 ${nextStage.desc.split("—")[0].trim()}이 필요해요.` : "");
  } else if (next) hi = `다음 터치는 ${_hmDay(next.when)} 「${next.title.split("—")[0].trim()}」이에요. 그때까지는 지켜봐도 좋아요.`;
  else hi = "오늘 예정된 연락은 없어요. ⑨ 현황에서 이 회원이 지금 어느 단계인지 보고, 그 단계에 맞는 행동을 고르시면 돼요.";
  /* self — 본인 계정(조성래)은 실측 데이터다. 카드 핀을 「체험」으로 찍으면 시연 전제와 정면으로 어긋난다.
     place — 체험·본인 카드도 코호트 카드와 같은 "시도 시군구" 표기를 쓴다(없을 때만 지역단 폴백). */
  const sgg = m.sigungu || "";
  const sido = _hmSidoShort(m);
  return { m, stage, status, hb, plan, last, next, dueNow, hi, mask: _hmMask(m.name), band: _hmBand(m), dan: hmDanOf(m),
    self: hmIsSelf(m), place: sgg ? (sido ? sido + " " + sgg : sgg) : hmDanOf(m).replace("지역단", "") };
}

/* ── ① 신호 카드 — lrDetectType·lrScore 그대로 재사용(재구현 금지) ── */
function hmSignals(code) {
  const members = hmScope(code);
  const out = [];
  members.forEach((m) => {
    if (hmLockState(m).locked) return;   // 락 회원은 신호 목록에서도 제외(접촉 유도 자체를 막는다)
    let type = "L-ASK", sc = null;
    try { type = (typeof lrDetectType === "function") ? lrDetectType(m) : "L-ASK"; } catch (e) {}
    try { sc = (typeof lrScore === "function") ? lrScore(m, type) : null; } catch (e) {}
    if (!sc || sc.tier === "T4") return;   // 하이 판정: 지금은 상담보다 안내가 맞는 단계 — 카드 미생성
    const T = (typeof LR_TYPES !== "undefined" && LR_TYPES[type]) || { label: type };
    out.push({ m, mask: _hmMask(m.name), band: _hmBand(m), type, typeKo: T.label || type, direct: type === "L-ASK", tier: sc.tier, sla: sc.sla, why: (sc.why || []).slice(0, 3), stage: hmStageOf(m).cur });
  });
  return out.sort((a, b) => (a.direct === b.direct) ? (a.sla - b.sla) : (a.direct ? -1 : 1));
}
