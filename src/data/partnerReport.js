/* ====================== 협력업체 온톨로지 · 하네스 — 보고서 지면 · 판정 입력 계약 ======================
   Partner Governance Report — 지면(블록)과 입력 계약의 **단일 원천**. P2 산출물.
   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md
           §13-4(P2 산출물 ①~⑥) · §10(보고서 설계) · §11-1(판정기 반환 계약) · §11-2(Trace)
           §5(통제 프레임) · §7-3(cause) · §7-3-1(stage) · §12(데이터 조달) · §15(금지사항)
   결정값: docs/partner_gov/P0_결정서_v1.1.md (12항목 · Q1 확정 산식 · 열린 항목 7건)

   이 파일이 소유하는 것 14가지 (①~⑩ P2 · ⑫~⑭ P5b 가 더한 지면 계약)
     ① PG_REPORT_TYPES  — 보고서 4유형(언제 · 모집단 · 단계 · 생애주기 초점)
     ② PG_BLOCKS        — 블록 B1~B7의 지면. 블록마다 「반드시 들어가는 것」을 항목 단위로 쪼갰다.
     ③ PG_TYPE_BLOCKS   — 4유형 × 7블록 행렬. 칸마다 범위와 비해당 사유를 적는다.
     ④ PG_NUM_RULE · PG_SRC · PG_METRICS — **수치 정의 전수와 그 원천 경로**. 역추적의 실체다.
     ⑤ PG_ROLLUP        — 기간축 롤업의 계약(계산 원천 단 하나 · 구현 소유자는 P5a).
     ⑥ PG_OBJ · PG_INPUTS · PG_SELF_GOV — 조항별 입력 계약. 어느 객체의 어느 필드인가.
     ⑦ PG_SOURCE_MAP    — 출처 등급 할당표(실원천 / 시연 시드 파생 / 미제출) 전수.
     ⑧ PG_VIEW · PG_CLAMP — 열람 등급 × 필드 가시성. 화면 숨김이 아니라 데이터 경로 클램프의 사양.
     ⑨ PG_EXPORT_HEAD   — 내보내기 머리말 고지 4줄(문안 확정).
     ⑩ PG_STAGE_EFFECT · PG_TRACE_LANES — 온보딩 단계 × 원인의 집행 효과 · Trace 5레인 지면.
     ⑫ PG_TRACE_RULE   — 추적 지면 규약 5줄. 줄마다 **검사 소유자**를 적는다(소유자 없는 규약은 사라진다).
     ⑬ PG_WHATIF_AXES · PG_WHATIF_FORBID — 가정 축 3개와 **하지 않는 가정** 4개. 값을 합성하지 않는다.
     ⑭ PG_ENGINE_BLOCKS · PG_ENGINE_METRICS · PG_ENGINE_RULE · PG_FLOOR — 정책 · 판정 엔진 지면
        7블록과 그 수치 정의 · 표시 기준 · 하드 플로어 선언. 보고서 블록표와 **다른 표**다.

   이 파일이 소유하지 않는 것 — 두 곳에 두면 같은 축이 두 값을 갖는다
     · 용어 · 표시명 · 판정 축 · 유형 축 · 금칙 사전 · 공표값  → src/data/partnerGov.js (P1). **읽기만** 한다.
     · 법령 명칭 · 조문 번호 · 시행일 · 확인 등급 · 제재 · 집행 유예 → src/data/partnerPolicy.js 의
       PG_LAWS (P3). **이 파일은 조문 번호를 적지 않는다** — 확인 등급이 「원문확인」이 아닌 조문을
       적어 두면 그 조문이 보고서 각주에 인쇄되고, 배지는 전문성의 증거가 아니라 알고도 인쇄했다는
       기록이 된다. 그래서 입력 계약은 **법령 키(lawRef)만** 들고, 이름과 조문은 PG_LAWS 가 소유한다.
     · 판정 규칙 분기 · 집행 수준 · 면제 → PG_POLICIES · PG_ENFORCE · pgDecide (P3 · P4).
       이 파일은 ruleId(디스패치 키 이름)까지만 정한다.
     · 제출 필드 사전 → PG_FIELDS (P4). obj:"submit" 입력의 키가 그 사전의 발주서다.
     · 화면 렌더 · 집계 구현 → PartnerGovReport.jsx (P5a) · 서브탭 ⑤(P5b). **여기서 만들지 않는다.**
     · 거래 사실(거래처 · 제품 · 계약 · 주문 · 배송 · 정산) → src/data/supplyData.js. 읽기 전용 입력이다.

   읽는 순서 — 급하면 ④ PG_NUM_RULE 세 줄과 PG_METRICS 한 항목만 보면 이 파일의 사상이 보인다.

   주의 — 단일 번들(import 없음 · 전역 공유)이다. 여기 선언한 전역 이름이 다른 파일과 겹치면
     조용히 덮어쓴다. 그리고 **모듈 최상위에서 다른 데이터 파일의 const 를 평가하지 않는다** —
     파일 순서가 바뀌면 TDZ 로 번들이 통째로 죽는다(P1 에서 실측한 사고다). 다른 파일의 상수는
     반드시 **함수 안에서** 읽는다. */

/* ── ① 보고서 4유형 ─────────────────────────────────────────────────────────
   네 유형은 모집단과 단계가 다르다. 한 지면을 네 번 복제하는 것이 아니라,
   **같은 블록 집합을 다른 범위로** 세우는 것이다(범위는 ③ 행렬이 정한다). */
const PG_REPORT_TYPES = [
  { id: "PG-O", ko: "온보딩 실사", when: "신규 제휴 심사 시", pop: "협력업체 1곳",
    stage: "신규등록신청", lifecycle: ["2.3.1", "2.3.2"],
    carry: ["사업자 평가 체크리스트(의료마이데이터 사업자 선정 평가와 범위가 다르다)", "등록 가부 판정", "등록 집행 지점 결과"],
    note: "거래 개시 전이라 실적 블록은 「해당 없음 — 거래 개시 전」이다. 0원으로 적지 않는다." },
  { id: "PG-R", ko: "정기 운영", when: "월 · 분기", pop: "전수 또는 유형별",
    stage: "거래중", lifecycle: ["2.3.3"],
    carry: ["실적 + 통제 + 기간 추세"], note: "기본 보고서다. 전수 지면의 분모는 협력업체 축 모집단이다." },
  { id: "PG-E", ko: "수시", when: "사유 발생 시(행정처분 인지 · 민원 임계 초과 · 회수 발생)", pop: "해당 협력업체",
    stage: "거래중", lifecycle: ["2.3.3", "2.3.4"],
    carry: ["사유와 판정", "즉시 조치", "통지 이력"],
    note: "사유를 먼저 적고 그 사유가 닿는 조항만 판정한다 — 사유 없는 전수 판정을 수시 보고서로 부르지 않는다." },
  { id: "PG-C", ko: "시정조치", when: "결함 발생 후", pop: "해당 협력업체",
    stage: "거래중", lifecycle: ["2.3.3", "2.3.4"],
    carry: ["시정 과제 중심", "과제 · 기한 · 재판정", "종결"],
    note: "재판정은 같은 판정기를 한 번 더 부른 결과다. 별도 추정 로직을 두지 않는다." },
];

/* ── ② 블록 B1~B7 지면 ──────────────────────────────────────────────────────
   「반드시 들어가는 것」을 문단이 아니라 **항목**으로 쪼갰다. 쪼개지 않으면 P5a 가 한 문단을
   한 칸으로 렌더하고, 그 칸에서 무엇이 빠졌는지 아무도 셀 수 없다. */
const PG_BLOCKS = [
  { id: "B1", ko: "머리 — 범위 · 원천 · 목적 선언", asks: "무엇을 모집단으로, 어느 원천으로, 어느 기준일에, 왜 말하는가",
    items: ["목적의 법적 정초 1줄", "모집단(협력업체 수 + 유형별 분해)", "기준일", "매출 · 매입의 단일 원천 선언 1줄",
            "보고 기간(창이 좁으면 미포착 금액을 같은 줄에)", "출처 등급 비중", "정책 버전 + 테이블 해시",
            "데이터 성격 고지 + 실명 표기 시 판정 성격 고지", "인공지능 기반 운용 고지 · 생성형 산출 표시",
            "거래 장부 ↔ 재무 계획 모델 대조 1줄"] },
  { id: "B2", ko: "결론", asks: "결론이 무엇이고 어느 원칙이 미기능인가",
    items: ["원칙 × {존재, 기능} 행렬(총점 금지)", "결함 3등급 집계", "하나라도 미기능이면 결론 보류",
            "칸 클릭 시 구성 조항 전개", "해당 없음 건수 병기", "미제출 pending 분리"] },
  { id: "B3", ko: "실적", asks: "누가 얼마를 어떻게 거래했고 서비스를 얼마나 이행했는가",
    items: ["협력업체 단위 × 기간축 금액 축", "정산 대상(주문 파생 종속 장부)", "주문 건수", "기간 추세",
            "배송 이행률", "서비스 제공 실적은 별 축", "거래 레코드가 없는 협력업체는 해당 없음"] },
  { id: "B4", ko: "판정표", asks: "왜 그 판정인가",
    items: ["행 = 협력업체 · 열 = 조항 · 칸 = 결정 4값", "원인 배지", "집행 유예 배지", "판정 대상 열(필수)",
            "생애주기 축", "준수율(분모 규약 필수)", "pending 열", "칸 클릭 시 추적 지면 열림"] },
  { id: "B5", ko: "추적(Trace)", asks: "판정이 어떻게 만들어졌는가",
    items: ["5레인 — 입력 · 조항 · 판정 · 집행 · 시정", "쓰이지 않은 입력도 회색으로 보인다",
            "사유 문장은 판정기가 쓴 것을 그대로", "실상호 원 필드는 레인 1에 싣지 않는다"] },
  { id: "B6", ko: "시정 과제", asks: "무엇을 고치면 올라가는가",
    items: ["조항별 시정 과제", "소유자", "기한", "상태", "증거를 채웠다고 가정한 재판정", "의무 / 권고 구분",
            "사전 통지 · 소명 · 재심 4필드"] },
  { id: "B7", ko: "한계 · 반출", asks: "이 보고서가 말할 수 없는 것",
    items: ["자기 한계 표기", "법령 미확인 조항 목록", "시행 예정 조항 목록", "미제출 필드 목록",
            "소명 없이 집행된 건수", "집행 차단 건수(0이면 「막은 것 없음」으로 적는다)", "반출 규약"] },
];

/* ── ③ 4유형 × 7블록 행렬 ───────────────────────────────────────────────────
   scope: "전수" | "해당건" | "해당조항" | "요약" | "해당없음"
   비해당은 **사유를 반드시 적는다** — 사유 없는 비해당은 누락과 구별되지 않는다. */
const PG_TYPE_BLOCKS = [
  { type: "PG-O", cells: { B1: ["전수", ""], B2: ["전수", ""], B3: ["해당없음", "거래 개시 전 — 주문 · 배송 · 정산 레코드가 없다. 0원으로 적지 않는다"],
      B4: ["전수", "등록 단계 조항 전수 — 증거 미제출의 집행 효과가 이 단계에서만 다르다(⑩)"], B5: ["해당건", ""], B6: ["전수", ""], B7: ["전수", ""] } },
  { type: "PG-R", cells: { B1: ["전수", ""], B2: ["전수", ""], B3: ["전수", "협력업체 축 모집단 전수 × 기간축"],
      B4: ["전수", ""], B5: ["해당건", "칸을 클릭한 1건"], B6: ["전수", ""], B7: ["전수", ""] } },
  { type: "PG-E", cells: { B1: ["전수", "사유와 인지 경로를 범위 선언에 넣는다"], B2: ["요약", "사유가 닿는 원칙만"],
      B3: ["해당건", "사유 기간에 한정 — 전 기간 추세를 수시 보고서에 싣지 않는다"],
      B4: ["해당조항", "사유가 닿는 조항만. 나머지 조항을 「판정하지 않았다」고 적는다"], B5: ["해당건", ""],
      B6: ["해당조항", ""], B7: ["전수", "판정하지 않은 조항 목록을 한계에 적는다"] } },
  { type: "PG-C", cells: { B1: ["전수", "선행 보고서 참조를 범위에 넣는다"], B2: ["요약", "재판정 결과만"],
      B3: ["해당건", "시정 기간에 한정"], B4: ["해당조항", "시정 대상 조항 + 재판정 결과"], B5: ["해당건", ""],
      B6: ["전수", "이 유형의 본체다"], B7: ["전수", ""] } },
];

/* ── ④ 수치 정의와 역추적 ───────────────────────────────────────────────────
   이 절이 P2 의 본체다. 「과정이 보이게」는 지면 장식이 아니라 **모든 수치가 어디서 왔는지
   한 칸씩 말할 수 있는 상태**이고, 그것을 말할 수 있게 하는 유일한 방법이 아래 규약이다. */

/* 수치 정의 규약 — 콘솔이 거짓말하지 않게 하는 7줄. 1~5는 운영 지표 선례 그대로. */
const PG_NUM_RULE = [
  { n: 1, rule: "분모가 0이면 비율을 만들지 않는다", how: "null 을 돌려 화면에 「—」. 0%는 「문제 없음」으로 읽히지만 사실은 「데이터 없음」이다" },
  { n: 2, rule: "미제출을 「충족」으로 계산하지 않고 pending 열로 따로 센다", how: "준수율 분모에서 조용히 빼면 미제출이 많을수록 준수율이 올라가는 역전이 생긴다. 「해당 없음」은 분모에서 빼되 건수를 함께 표시한다" },
  { n: 3, rule: "산출물이 없으면 오류가 아니라 「아직 없음」", how: "{available:false, hint} 형태로 돌려 화면이 빈칸 대신 사유를 적는다" },
  { n: 4, rule: "모든 수치는 판정기 반환 필드 또는 기간축 롤업과 1:1", how: "화면이 자체 계산하는 숫자는 0건이다. PG_METRICS[].from 이 그 경로이고 pgMetricAudit() 가 전수 검사한다" },
  { n: 5, rule: "금액 축은 주문 파생 롤업 하나에서만 나온다", how: "같은 지면에 두 값으로 나란히 놓지 않는다. 정산 금액은 종속 표시이고 라벨이 그 사실을 말한다. 수수료율의 단일 원천은 계약이다" },
  { n: 6, rule: "두 지면의 주인이 다르면 「같은 장부」라고 쓰지 않는다", how: "거래 장부와 재무 계획 모델은 산정 기준이 다르다. 대조는 적되 한쪽이 다른 쪽에 「반영된다」고 적지 않는다" },
  { n: 7, rule: "상위 합계는 행 합으로만 만든다", how: "상위 금액에 요율을 다시 곱해 재계산하는 자리 0건. 재계산하면 월행 합과 원 단위에서 어긋난다" },
];

/* 허용 원천 접두사 — from 은 반드시 이 중 하나로 시작한다. 「화면이 계산한다」는 경로가 없다. */
const PG_SRC = [
  { p: "pgDecide:", ko: "판정기 반환 필드", owner: "pgDecide (P3)", note: "반환 계약의 필드 경로를 그대로 적는다" },
  { p: "rollup:", ko: "기간축 롤업", owner: "PG_ROLLUP (P5a)", note: "금액 · 건수 · 모집단의 계산 원천 단 하나" },
  { p: "policy:", ko: "정책 · 법령 레지스트리 조회", owner: "PG_LAWS · PG_POLICIES · PG_ENFORCE (P3)", note: "조문 번호는 확인 등급 게이트를 지난 뒤에만 렌더된다" },
  { p: "spec:", ko: "이 파일의 선언 테이블", owner: "partnerReport.js (P2)", note: "지면 · 계약 · 고지 문안 자체는 선언이 원천이다" },
  { p: "terms:", ko: "용어 · 표시명 · 공표값", owner: "partnerGov.js (P1)", note: "표시명은 단일 함수에서만 나온다" },
  { p: "log:", ko: "집행 차단 전용 로그", owner: "hifin_pg_block (P4)", note: "공용 링버퍼에서 읽으면 밀려 나간 기록 때문에 숫자가 줄어든다" },
  { p: "fin:", ko: "재무 계획 모델", owner: "finBudget", limit: "대조 1곳만(b1.planCompare) — 그 외 자리에서 쓰면 두 장부가 섞인다" },
];
const PG_SRC_FIN_ONLY = "b1.planCompare";

/* 준수율 분모 규약 — 이 한 칸이 보고서 전체의 정직성을 정한다. */
const PG_DENOM = {
  compliance: {
    numer: "decision === \"PERMIT\" 건수",
    denom: "해당 조항 전체 − 해당없음(kind_mismatch · 시행 전) − pending(미제출 · 판정 보류)",
    pendingCol: true, naCount: true, zero: "분모 0이면 null → 화면 「—」",
    why: "미제출을 분모에서 조용히 빼면 미제출이 많을수록 준수율이 올라간다. 그래서 pending 은 분모에서 빼는 동시에 **별 열로 세어 같은 지면에 적는다**",
  },
  defect: { numer: "severity 별 DENY 건수", denom: null, note: "결함은 비율이 아니라 건수로 적는다 — 총점을 만들지 않는다" },
  presentFunctioning: { numer: "원칙별 존재 · 기능 2판정", denom: null, note: "하나라도 미기능이면 결론 보류다. 가중 평균을 만들지 않는다" },
};

/* 수치 정의 전수 — {id, block, ko, def, from, denom, absent, grade, clamp}
     from   = 허용 접두사 + 경로. **이 칸이 비면 그 수치는 지면에 설 수 없다.**
     denom  = 비율인 경우의 분모 규약 키(PG_DENOM) · 비율이 아니면 null
     absent = 미제출 · 미보유일 때의 처리. 「0」으로 적는 선택지는 없다.
     clamp  = 열람 등급 제한. "L1" 은 내부통제 담당 지면과 그 반출물에만 실린다. */
const PG_METRICS = [
  /* B1 — 머리 */
  { id: "b1.purposeLaw", block: "B1", ko: "목적의 법적 정초", def: "협력업체의 개인정보 처리 위반이 당사 배상책임으로 귀속된다는 선언 1줄",
    from: "policy:lawRef(pipa)", denom: null, absent: "확인 등급이 「원문확인」이 아니면 조문 번호 없이 법령명과 취지만 적고 「조문 미확인」을 붙인다", grade: "REAL", clamp: null,
    renderRule: "조문 번호를 문안에 하드코딩하지 않는다 — 레지스트리에서 확인 등급 게이트를 지나 붙는다" },
  { id: "b1.popPartner", block: "B1", ko: "모집단 — 협력업체 수", def: "중복 신원 교정 후의 협력업체 축 모집단",
    from: "rollup:meta.partnerN", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.popVendor", block: "B1", ko: "모집단 — 거래 사실 보유 수", def: "거래 레코드가 있는 부분집합의 수",
    from: "rollup:meta.vendorN", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.popByKind", block: "B1", ko: "유형별 분해", def: "협력업체 유형 4종별 건수",
    from: "rollup:meta.byKind", denom: null, absent: "명부가 없는 유형은 0이 아니라 「명부 미확보」", grade: "REAL", clamp: null },
  { id: "b1.asOf", block: "B1", ko: "기준일", def: "판정과 집계의 기준일",
    from: "rollup:meta.asOf", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.sourceDecl", block: "B1", ko: "단일 원천 선언", def: "매출 · 매입의 단일 원천은 주문이며 정산은 주문에서 파생된 종속 장부라는 1줄",
    from: "spec:PG_DECL.source", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.window", block: "B1", ko: "보고 기간", def: "집계 창(개월 수와 시작 · 끝)",
    from: "rollup:meta.window", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.uncaughtSales", block: "B1", ko: "창 밖 미포착 — 매출축", def: "보고 기간이 주문 기간보다 좁을 때 창에 들지 않은 매출",
    from: "rollup:meta.uncaught.sales", denom: null, absent: "창이 전 기간이면 0원이고, 그 사실을 적는다", grade: "DEMO", clamp: null,
    renderRule: "창을 좁히기로 확정되면 이 값과 아래 매입축 값을 **같은 줄에** 적는다. 둘 중 하나만 적으면 매입축이 소리 없이 사라진다" },
  { id: "b1.uncaughtCost", block: "B1", ko: "창 밖 미포착 — 매입축", def: "같은 창 밖의 공급대금",
    from: "rollup:meta.uncaught.supplyCost", denom: null, absent: "위와 같다", grade: "DEMO", clamp: "L1" },
  { id: "b1.gradeMix", block: "B1", ko: "출처 등급 할당표의 등급 비중", def: "제출 · 객체 필드 사전(PG_SOURCE_MAP) 항목의 실원천 / 시연 시드 파생 / 미제출 비중 — 보고서 지표의 비중이 아니다",
    from: "spec:pgGradeMix()", denom: null, absent: "미제출 비중 자체가 이 수치의 내용이다", grade: "REAL", clamp: null,
    renderRule: "라벨 · 각주에 **원천 집합의 이름**을 함께 적는다. 지표 축 비중은 b1.metricMix 가 따로 적는다" },
  { id: "b1.metricMix", block: "B1", ko: "보고서 지표 사전의 등급 비중", def: "이 보고서가 인쇄하는 지표(PG_METRICS)의 출처 등급 비중",
    from: "spec:pgMetricGradeMix()", denom: null, absent: "—", grade: "REAL", clamp: null,
    renderRule: "할당표 비중과 **나란히** 적는다 — 두 수치는 다른 질문의 답이다" },
  { id: "b1.policyVer", block: "B1", ko: "정책 버전", def: "정책 테이블의 의미 버전",
    from: "policy:PG_POLICY_VER", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.tableHash", block: "B1", ko: "테이블 해시", def: "정책 테이블 해시 — 재현 증명의 축",
    from: "policy:PG_POLICY_HASH", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.notice", block: "B1", ko: "데이터 성격 고지", def: "거래 레이어 성격 + 판정 지면 규약 2문구",
    from: "spec:PG_SCREEN_NOTICE", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.nameNotice", block: "B1", ko: "표시명 모드 고지", def: "실명 표기 상태에서 판정 성격을 밝히는 고지",
    from: "terms:pgExportNoticeRequired()", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.aiNotice", block: "B1", ko: "인공지능 운용 · 생성형 산출 고지", def: "자기 거버넌스 2항목의 화면 고지",
    from: "spec:PG_SELF_GOV", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b1.planCompare", block: "B1", ko: "거래 장부 ↔ 재무 계획 모델 대조", def: "두 지면의 주인이 다르다는 대조 1줄",
    from: "fin:fbModel().annual[0].revP", denom: null, absent: "—", grade: "DEMO", clamp: null,
    renderRule: "거래 장부 값은 rollup:meta.gmv 에서, 계획 모델 값은 이 경로에서 온다. 두 숫자를 함께 적고 「반영된다」고 쓰지 않는다" },

  /* B2 — 결론 */
  { id: "b2.matrix", block: "B2", ko: "원칙 × {존재, 기능} 행렬", def: "신뢰 시스템 원칙별 존재 · 기능 2판정",
    from: "pgDecide:decision", denom: "presentFunctioning", absent: "증거 미제출은 미기능이 아니라 pending", grade: "ABSENT", clamp: null },
  { id: "b2.defect", block: "B2", ko: "결함 3등급 집계", def: "경미 · 중대 · 치명 건수",
    from: "pgDecide:ruleRef.severity", denom: "defect", absent: "pending 은 결함으로 세지 않는다", grade: "ABSENT", clamp: null },
  { id: "b2.hold", block: "B2", ko: "결론 보류 여부", def: "원칙 중 하나라도 미기능이면 결론을 내지 않는다",
    from: "pgDecide:decision", denom: null, absent: "판정 불가 조항이 있으면 보류 사유에 적는다", grade: "ABSENT", clamp: null },
  { id: "b2.cellPolicies", block: "B2", ko: "칸 구성 조항", def: "행렬 한 칸을 만든 조항 목록",
    from: "pgDecide:ruleRef", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b2.naCount", block: "B2", ko: "해당 없음 건수", def: "유형 비해당 + 시행 전 건수(분모에서 빼되 함께 표시)",
    from: "pgDecide:cause", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b2.pending", block: "B2", ko: "pending 건수", def: "증거 미제출 · 법령 미확인으로 판정이 서지 않은 건수",
    from: "pgDecide:cause", denom: null, absent: "이 수치 자체가 미제출의 크기다", grade: "ABSENT", clamp: null },

  /* B3 — 실적 */
  { id: "b3.sales", block: "B3", ko: "매출", def: "협력업체 × 월 주문 금액 합(취소 제외)",
    from: "rollup:cell.sales", denom: null, absent: "거래 레코드가 없으면 「해당 없음 — 상품 공급 거래 없음」", grade: "DEMO", clamp: null },
  { id: "b3.supplyCost", block: "B3", ko: "공급대금(매입)", def: "주문이 이미 사실로 갖고 있는 공급 금액의 합",
    from: "rollup:cell.supplyCost", denom: null, absent: "위와 같다", grade: "DEMO", clamp: "L1" },
  { id: "b3.fee", block: "B3", ko: "플랫폼 수수료", def: "계약 요율에서 파생되는 행 단위 값",
    from: "rollup:cell.fee", denom: null, absent: "위와 같다", grade: "DEMO", clamp: "L1",
    renderRule: "상위 합계는 행 합으로만 만든다. 상위 금액에 요율을 다시 곱하지 않는다(규약 7)" },
  { id: "b3.marginNet", block: "B3", ko: "플랫폼 순마진", def: "매출에서 공급대금과 수수료를 뺀 값",
    from: "rollup:cell.marginNet", denom: null, absent: "위와 같다", grade: "DEMO", clamp: "L1" },
  { id: "b3.settleTarget", block: "B3", ko: "정산 대상(상태 미정)", def: "주문 파생 종속 장부의 매출 합",
    from: "rollup:cell.settleTarget", denom: null, absent: "—", grade: "DEMO", clamp: null,
    renderRule: "라벨은 용어 원천 경유다. 「정산 완료 / 정산 예정」 2칸을 만들지 않는다 — 상태 재부여 규칙이 미정이고, 기존 상태를 그대로 물려받으면 미출고 금액이 완료 칸에 섞인다" },
  { id: "b3.preShip", block: "B3", ko: "그중 미출고분", def: "정산 대상 중 출고 전 주문의 금액",
    from: "rollup:cell.preShip", denom: null, absent: "—", grade: "DEMO", clamp: null },
  { id: "b3.orders", block: "B3", ko: "주문 건수", def: "창 내 취소 제외 주문 건수",
    from: "rollup:cell.orders", denom: null, absent: "0건이면 그 셀은 행을 만들지 않는다", grade: "DEMO", clamp: null },
  { id: "b3.trend", block: "B3", ko: "기간 추세", def: "월별 금액 · 건수 추이",
    from: "rollup:period", denom: null, absent: "창에 없는 월은 빈 칸으로 두고 0으로 적지 않는다", grade: "DEMO", clamp: null,
    renderRule: "시연 시드 파생 수치를 전망의 근거로 쓰지 않는다 — 추세는 과거 창의 서술이다" },
  { id: "b3.slaRate", block: "B3", ko: "배송 이행률", def: "계약 기준일 내 배송 비율",
    from: "rollup:cell.slaMet", denom: "compliance", absent: "배송 레코드가 없으면 null → 「—」", grade: "DEMO", clamp: null },
  { id: "b3.service", block: "B3", ko: "서비스 제공 실적", def: "진료 · 돌봄 · 검진 제공 건수와 이행률",
    from: "rollup:cell.service", denom: "compliance", absent: "제공 레코드 미보유 — 「해당 없음」으로 적고 0%로 적지 않는다", grade: "ABSENT", clamp: null,
    renderRule: "금액 축과 **별 축**이다. 상품 거래가 없는 유형의 실적은 여기에 산다" },
  { id: "b3.noVendor", block: "B3", ko: "거래 사실 없음 표기", def: "거래 레코드가 없는 협력업체의 실적 절 문안",
    from: "spec:PG_DECL.noVendor", denom: null, absent: "결함이 아니라 사실이다", grade: "REAL", clamp: null },

  /* B4 — 판정표 */
  { id: "b4.decision", block: "B4", ko: "결정 4값", def: "허용 · 불허 · 판정 보류 · 해당 없음",
    from: "pgDecide:decision", denom: null, absent: "미제출은 판정 보류이고 불허가 아니다", grade: "ABSENT", clamp: null },
  { id: "b4.cause", block: "B4", ko: "원인 배지", def: "결정이 그 값이 된 원인 6종",
    from: "pgDecide:cause", denom: null, absent: "원인은 항상 채워진다 — 비면 판정기 결함이다", grade: "REAL", clamp: null },
  { id: "b4.grace", block: "B4", ko: "집행 유예 배지", def: "법정 의무이나 소관 부처가 제재 집행을 유예하고 있는 상태",
    from: "policy:PG_LAWS[].enforcementGrace", denom: null, absent: "유예 사실이 확인되지 않으면 배지를 달지 않는다", grade: "REAL", clamp: null },
  { id: "b4.subject", block: "B4", ko: "판정 대상 열", def: "협력업체 축인가 당사 축인가",
    from: "spec:PG_INPUTS[].subject", denom: null, absent: "—", grade: "REAL", clamp: null,
    renderRule: "필수 열이다. 섞어 읽으면 당사 책임 조항을 협력업체 결함으로 읽는다" },
  { id: "b4.lifecycle", block: "B4", ko: "생애주기 축", def: "외부자 현황 · 계약 · 이행 · 변경/만료 · 위탁",
    from: "spec:PG_INPUTS[].lifecycle", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b4.compliance", block: "B4", ko: "준수율", def: "허용 건수 ÷ 판정 가능 분모",
    from: "pgDecide:decision", denom: "compliance", absent: "pending 은 분모에서 빼고 별 열로 센다", grade: "ABSENT", clamp: null },
  { id: "b4.pendingCol", block: "B4", ko: "pending 열", def: "분모에서 뺀 건수를 같은 지면에서 보이게 하는 열",
    from: "pgDecide:cause", denom: null, absent: "—", grade: "ABSENT", clamp: null },

  /* B5 — 추적 5레인 */
  { id: "b5.lane1", block: "B5", ko: "레인 1 입력", def: "쓰인 필드명 · 값 · 출처 배지 · 수집 시각. 쓰이지 않은 필드도 회색으로",
    from: "pgDecide:inputRefs", denom: null, absent: "미제출 배지로 존재를 보여준다 — 숨기면 있는 줄 모른다", grade: "ABSENT", clamp: null,
    renderRule: "실상호 원 필드는 이 레인에 싣지 않는다. 식별자와 표시명 한 칸만 둔다" },
  { id: "b5.lane2", block: "B5", ko: "레인 2 조항", def: "조항 id · 표제 · 축 · 판정 대상 · 생애주기 · 근거 법령 · 조항 시행일 · 확인 등급",
    from: "pgDecide:ruleRef", denom: null, absent: "확인 등급이 「원문확인」이 아니면 조문 · 통제 번호를 찍지 않고 「조문 미확인」", grade: "REAL", clamp: null },
  { id: "b5.lane3", block: "B5", ko: "레인 3 판정", def: "결정 4값 + 원인 + 사유 문장",
    from: "pgDecide:reasons", denom: null, absent: "—", grade: "REAL", clamp: null,
    renderRule: "사유는 화면이 쓰지 않는다 — 판정기가 쓴 문장을 그대로 렌더한다" },
  { id: "b5.lane4", block: "B5", ko: "레인 4 집행", def: "집행 수준 · 집행 지점 · 온보딩 단계 · 차단 이력 · 면제(사유 · 승인자 · 만료일) · 통지 · 소명 · 재심",
    from: "pgDecide:enforce", denom: null, absent: "막힌 게 없으면 「막은 것 없음」이라고 적는다", grade: "ABSENT", clamp: null },
  { id: "b5.lane5", block: "B5", ko: "레인 5 시정 + 재판정", def: "필요한 증거 · 기한 · 소유자 + 증거를 채웠다고 가정한 재판정",
    from: "pgDecide:whatIf", denom: null, absent: "—", grade: "ABSENT", clamp: null,
    renderRule: "재판정은 같은 판정기를 한 번 더 부른 결과다. 별도 추정 로직 금지" },
  { id: "b5.blocked", block: "B5", ko: "차단 이력 건수", def: "그 조항 · 그 집행 지점에서 실제로 막은 건수",
    from: "log:hifin_pg_block", denom: null, absent: "0이면 「막은 것 없음」 — 0을 「문제 없음」으로 읽히게 두지 않는다", grade: "REAL", clamp: null },

  /* B6 — 시정 과제 */
  { id: "b6.remedy", block: "B6", ko: "시정 과제", def: "무엇을 제출 · 변경하면 판정이 올라가는가",
    from: "pgDecide:remedy", denom: null, absent: "—", grade: "ABSENT", clamp: null },
  { id: "b6.owner", block: "B6", ko: "과제 소유자 · 기한 · 상태", def: "과제 1건의 책임자와 기한",
    from: "pgDecide:remedy", denom: null, absent: "소유자가 없으면 과제가 아니라 희망이다", grade: "ABSENT", clamp: null },
  { id: "b6.whatIf", block: "B6", ko: "재판정 결과", def: "증거를 채웠다고 가정한 판정",
    from: "pgDecide:whatIf", denom: null, absent: "—", grade: "ABSENT", clamp: null },
  { id: "b6.obligation", block: "B6", ko: "의무 / 권고 구분", def: "집행 지점이 이행할 수 없으면 거부해야 하는가, 미이행 시 차단하지 않는가",
    from: "pgDecide:ruleRef.obligation", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b6.due4", block: "B6", ko: "통지 · 소명 4필드", def: "사전 통지일 · 소명 접수 기한 · 소명 내용 · 재심 결과",
    from: "pgDecide:enforce", denom: null, absent: "비어 있으면 「통지 없음」으로 적는다", grade: "ABSENT", clamp: null },

  /* B7 — 한계 · 반출 */
  { id: "b7.limit", block: "B7", ko: "자기 한계 표기", def: "통제 정책의 시각화 · 자가점검이며 실제 준수는 법률 · 보안 검토를 전제한다는 선언",
    from: "spec:PG_EXPORT_HEAD", denom: null, absent: "—", grade: "REAL", clamp: null },
  { id: "b7.unverified", block: "B7", ko: "법령 미확인 조항 목록", def: "확인 등급이 「원문확인」이 아니라 집행이 보류된 조항",
    from: "policy:PG_LAWS[].verified", denom: null, absent: "목록이 비면 「미확인 없음」이라고 적는다", grade: "REAL", clamp: null },
  { id: "b7.notYet", block: "B7", ko: "시행 예정 조항 목록", def: "시행일이 도래하지 않아 아직 적용되지 않는 조항",
    from: "pgDecide:cause", denom: null, absent: "「해당 없음」과 섞지 않는다 — 원인이 다르다", grade: "REAL", clamp: null },
  { id: "b7.absentFields", block: "B7", ko: "미제출 필드 목록", def: "받아야 하는데 아직 없는 필드 전수",
    from: "spec:PG_SOURCE_MAP", denom: null, absent: "이 목록이 비는 것이 목표 상태다", grade: "ABSENT", clamp: null },
  { id: "b7.noDefense", block: "B7", ko: "소명 없이 집행된 건수", def: "사전 통지 · 소명 없이 집행이 일어난 건수",
    from: "pgDecide:enforce", denom: null, absent: "0이면 그대로 0으로 적는다 — 집행 자체가 0건이면 그 사실을 함께 적는다", grade: "REAL", clamp: null },
  { id: "b7.blockedTotal", block: "B7", ko: "집행 차단 건수 합", def: "집행 지점별 차단 건수",
    from: "log:hifin_pg_block", denom: null, absent: "전용 로그에서 읽는다. 공용 링버퍼에서 읽으면 밀려 나간 기록 때문에 숫자가 줄어든다", grade: "REAL", clamp: null },
  { id: "b7.exportRule", block: "B7", ko: "반출 규약", def: "반출 경로 · 머리말 고지 · 등급별 필드 제한",
    from: "spec:PG_EXPORT_HEAD", denom: null, absent: "—", grade: "REAL", clamp: null },
];

/* 지면에 그대로 쓰는 선언 문안 — 이 문장들은 수치가 아니라 **문안의 단일 원천**이다. */
const PG_DECL = {
  source: "매출 · 매입의 단일 원천은 주문이며, 정산은 주문에서 파생된 종속 장부입니다.",
  noVendor: "해당 없음 — 상품 공급 거래 없음",
  notYet: "시행 전 — 시행일 도래 시 자동 적용",
  /* ★ 조항 축과 법령 축을 가른다(2026-10-26). 종전 E6 · B7 은 「시행 예정 조항 없음」이라고 **단정**했는데
     레지스트리에는 원문확인 등급의 미도래 개정이 1건 있었다 — 그 개정이 어느 조문을 바꾸는지가 미확인이라
     어느 조항에도 시행일을 부여하지 않은 판단은 옳지만, 그 사실을 **적지 않은 것**은 옳지 않다. */
  pendingAmend: "개정 예정 · 조문 사정권 확인 대기 — 어느 조항에도 시행일을 부여하지 않았습니다.",
  notYetSplit: "시행일이 도래하지 않은 **조항** {조항}건 · 조문 사정권 확인 대기 **법령** {법령}건",
  effUnverified: "시행일 미확인",
  effPlanned: "시행 예정",
  unverified: "법령 미확인 — 집행 보류",
  noBlock: "막은 것 없음",
  notJudged: "판정하지 않음 — 이 보고서의 범위 밖",
  planOwner: "거래 지면과 재무 계획 모델은 산정 기준이 다른 별 지면입니다.",
  /* ── P5a 가 지면에 그대로 쓰는 문안. 컴포넌트에 문장을 적지 않는다(§0-5) ──
     ★ purposeLaw 의 {법령} 자리는 **레지스트리가 채운다** — 조문 번호를 문안에 하드코딩하면
       확인 등급 게이트를 지나지 않은 조문이 보고서에 인쇄된다(b1.purposeLaw renderRule). */
  purposeLaw: "협력업체의 개인정보 처리 위반은 {법령}에 따라 당사 배상책임으로 귀속됩니다.",
  windowFull: "보고 기간이 주문 기간 전체를 덮습니다 — 창 밖 미포착 금액은 매출 · 매입 두 축 모두 0원입니다.",
  selfAxisOnce: "당사 축 조항은 협력업체마다 반복되는 결함이 아니라 조항 1건의 결함입니다 — 입력이 우리 구조이므로 행 수로 세지 않습니다.",
  selfInputAbsent: "당사 축 조항의 입력(처리방침 지면 · 계약 조항 · 노출 로직 · 고지 지면)은 아직 선언되지 않았습니다 — 선언 전까지는 판정 보류로 둡니다. 다만 문구의 부재 자체가 사실인 조항은 판정기가 돌려준 결과를 그대로 적습니다.",
  demoState: "통제 축 {전체}개 중 {미제출}개가 미제출 상태이며, 실제 판정은 제휴 실사 시 제출물로 수행됩니다.",
  /* ── P5b 가 지면에 그대로 쓰는 문안 ───────────────────────────────────────
     ★ 종전의 「추적 지면은 다음 단계의 산출물입니다」 · 「정책 · 판정 엔진 지면은 다음 단계의
       산출물입니다」 두 줄은 **지웠다.** 그 지면이 선 뒤에도 남겨 두면 렌더되지 않는 죽은 문자열이
       되고, 죽은 문자열은 가드의 바닥을 메운다(P5a 가 같은 사유로 가드 요구 파일을 옮겼다). */
  traceOwner: "추적 지면의 모든 칸은 판정기가 돌려준 반환 필드입니다 — 화면은 사유도 수치도 새로 만들지 않습니다.",
  traceUnused: "흐린 줄은 이 판정에 쓰이지 않은 입력입니다 — 숨기면 있는 줄 모릅니다.",
  traceName: "추적 지면은 식별자와 표시명 한 칸만 싣습니다 — 실상호 원 필드는 레인에 올리지 않습니다.",
  /* ★ 추적 레인이 쓰는 문안 전건을 여기로 모았다(2026-10-26). 종전에는 레인 2 · 3 · 4 · 5 가 각각
     **지면 리터럴**을 들고 있었고(`outcomeNote` · 「이 지점에서 막습니다」 · 「권고 조항 — 안전하게
     무시할 수 있습니다」 · 가정 산출 없음 문구), 그 문장들이 「추적 지면의 모든 칸은 판정기가 돌려준
     반환 필드입니다」라는 고지 **바로 위**에 찍혔다. 선언 테이블에도 판정기 반환에도 없는 문장이었다.
     특히 「안전하게 무시할 수 있습니다」는 내용까지 어긋났다 — 같은 칸이 「중대 결함 축 · 소유자와
     기한이 걸린 미착수 과제」를 적은 다음 줄에서 그 말을 했고, obligation:false 조항 9건 × 108 =
     972칸에서 렌더됐다. 지면은 **선언된 사실만** 렌더한다. */
  traceNoArticle: "조문 번호와 표준 통제 번호를 인쇄하지 않습니다.",
  traceOutcomeDrift: "판정기 자체 산출과 결정값이 다릅니다 — 플로어가 결정값을 바꿨고, 자체 산출은 집행에 쓰지 않습니다.",
  traceBlockHere: "이 지점에서 막습니다",
  obligationYes: "의무 조항 — 집행 지점이 이행할 수 없으면 거부합니다",
  obligationNo: "권고 조항(의무 아님) — 집행 수준은 경고 · 기록이고 미이행 시 차단하지 않습니다. 등재된 시정 과제가 있으면 그 과제는 그대로 남습니다",
  whatIfNoAssume: "증거 미제출이 원인이 아니어서 판정기가 가정 산출을 만들지 않았습니다.",
  /* 추적 · 재판정 지면의 **문장** 전건 — 러너가 이 표에 등재되지 않은 문장을 지면에서 발견하면 실패한다
     (검사 소유자: run_pg_scan 단언 21-c2). 짧은 라벨(「· 축」 「건」 「미확인」)은 사정권이 아니다 —
     문장이어야 지면이 **사유를 지어낸** 것이 된다. 2026-10-26 적대적 심사에서 애블레이션으로 실증된 구멍이다. */
  lockedPolicy: "잠금 조항(어떤 집행 수준으로도 열리지 않습니다)",
  graceEnforce: "법정 의무이나 소관 부처 집행 유예 중",
  noContractBasis: "계약 조항 근거 미기재 — 승격 불가",
  noRemedy: "등재된 시정 과제가 없습니다.",
  noEnforceField: "집행 반환 필드가 없습니다.",
  noCap: "상한에 걸린 것 없음",
  noExempt: "등재된 면제 없음",
  toRegistryCard: "이 조항의 레지스트리 카드로 ›",
  whatIfTitle: "재판정(What-if) — 무엇을 고치면 등급이 올라가는가",
  ledgerSame: "불변 — 가정 재판정 전후 지문이 같습니다",
  ledgerMoved: "변경 감지 — 재판정이 원장을 건드렸습니다(실패)",
  whatIfUp: "올라갑니다",
  whatIfNow: "지금 결정",
  whatIfForbidTitle: "하지 않는 가정",
  assumeTitle: "증거를 채웠다고 가정한 재판정 —",

  whatIfLedger: "재판정은 가정 레코드로 같은 판정기를 한 번 더 부른 결과이며, 원장(거래 사실 · 제출물 · 면제 · 집행 로그 · 조항 테이블)을 바꾸지 않습니다.",
  whatIfForbid: "레지스트리를 바꾸는 가정은 하지 않습니다 — 확인 등급 · 집행 수준 · 면제 등재는 승인 절차를 지나는 사실이고, 화면이 그것을 가정하면 관측이 조작이 됩니다.",
  engineOwner: "이 지면은 관측이지 조작이 아닙니다 — 조항 신설 · 판정 기준 변경 · 집행 수준 하향 · 결정 로그 삭제는 화면에서 할 수 없습니다.",
  engineLink: "조항 행을 누르면 보고서 판정표의 그 열로, 영향받는 협력업체를 누르면 그 칸의 추적 지면으로 이어집니다.",
  exemptNone: "등재된 면제가 없습니다 — 「면제 없음」으로 적습니다.",
  logNone: "결정 로그가 비어 있습니다 — 「기록 없음」으로 적습니다. 0을 「문제 없음」으로 읽히게 두지 않습니다.",
  logUntraceable: "이 기록의 주체가 현 모집단에 없는 식별자입니다 — 추적 지면으로 잇지 않고 그 사실을 적습니다.",
  determinism: "같은 입력이면 같은 추적입니다 — 시각축이 벽시계가 아니라 기준일이고 난수를 쓰지 않습니다.",
  /* ── P7 반출 플러밍이 선 뒤의 문안 ───────────────────────────────────────
     ★ 종전 exportOwner 는 「복사 예외 등재 · 인쇄 창 워터마크 · 열람 기록은 **다음 단계의 작업
       항목**입니다」였다. 그 셋이 선 뒤에도 남겨 두면 **사실과 어긋나는 문장**이 지면에 인쇄되고,
       동시에 렌더되지 않는 죽은 문자열이 가드의 바닥을 메운다(P5b 가 traceNext · engineNext 두 줄을
       같은 사유로 지웠고, pgEngineAudit 이 그 패턴의 재발을 검사한다). */
  exportOwner: "반출물의 조립 · 집행 · 복사 예외 · 인쇄 창 워터마크 · 열람 기록이 한 경로에 모여 있습니다 — 산출물을 만드는 함수가 곧 집행을 부르므로 집행을 건너뛰는 반출 경로가 없습니다.",
  exportScope: "{유형} · 판정 칸 {칸}개",
  exportClip: "복사하면 고지 한 줄이 선택 범위 **앞에** 함께 들어갑니다 — 표 행만 끌어서 복사해도 고지가 따라갑니다.",
  exportLogged: "반출 1건이 열람 기록에 1행으로 남습니다 — 표 경로와 문서 경로를 각각 셉니다.",
  exportBlocked: "집행에서 막혔습니다 — 사유는 집행 지점이 돌려준 목록 그대로이고, 이 지점은 면제가 되지 않습니다.",
  exportFour: "반출 경로는 표 · 문서 · 화면 캡처 셋이 아니라 넷입니다 — 네 번째가 저장소 커밋입니다.",
  exportNameOne: "반출물은 표시명 한 칸만 싣습니다 — 실상호 원 필드는 열에 없습니다.",
  /* 자기 거버넌스 G-08 · G-09 의 **화면 고지 문안**. 자기 거버넌스 표의 `check` 는 **검증 기준**이고
     독자에게 하는 고지가 아니다 — 그 문장을 지면에 찍으면 「고지 문구가 존재한다」가 고지 자리에
     인쇄된다(실측으로 그랬다). 고지는 여기, 검증 기준은 그 표에 둔다. */
  aiNoticeOps: "이 섹션은 인공지능 기반으로 운용됩니다 — 에이전트가 상주하며 판정 호출 · 요약 · 안내에 인공지능이 쓰입니다.",
  aiNoticeGen: "이 보고서의 수치와 사유 문장은 판정기가 돌려준 값을 그대로 렌더한 것이며 생성형 산출이 아닙니다 — 에이전트가 만든 문장에는 생성형 산출 표시가 따로 붙습니다.",
};
/* 자기 거버넌스 항목 → 화면 고지 문안의 연결. 두 곳에 적지 않기 위한 대응표다. */
const PG_SELF_GOV_NOTICE = { "G-08": "aiNoticeOps", "G-09": "aiNoticeGen" };

/* 화면 고지 2문구 — 거래 레이어와 판정 지면. 문자 단위로 가드가 지킨다(run_wording_guard 검사 ③). */
const PG_SCREEN_NOTICE = [
  { at: "거래 · 운영 실적 지면", text: "거래처 상호는 실제 상호이며, 거래·통제 수치는 시연 시드 데이터입니다." },
  { at: "판정 지면 · 보고서 머리말", text: "법령 준수 판정은 자가점검 산출물이며 해당 기관의 실제 준수 여부를 뜻하지 않습니다." },
];

/* ── ④-b ⓠ 당사 지면 실측 — 「제출받지 못했다」가 아니라 「세어 보았다」 ────────────────────
   ★ 왜 이 표가 필요한가(2026-10-26 적대적 심사 반영). 당사 축 조항의 입력은 협력업체 제출물이
     아니라 **우리 지면 구조**다. 그것을 제출 필드로 다루면 값이 없을 때 등급이 「미제출」이 되고,
     미제출로 불허를 내면 **결측이 판정값**이 된다(§10-4 규약 ② 금지). 실측 사고가 그랬다 —
     L-10 이 `self.shop.brokerNoticeText` 결측으로 불허를 냈고, 그 결과가 레코드 108행에 복제돼
     **실명 법인 108곳의 행 준수율 0.0%** 가 전적으로 당사 조항 하나에서 나왔다. 같은 성질의
     결측이 바로 다음 줄에서는 보류(INDETERMINATE)로 갈려 같은 지면이 자기 모순이었다.
   ★ 그래서 당사 지면 축은 **측정값**으로 선언한다. 고지 문안이 등재된 자리를 레지스트리에서 세고,
     그 **개수**를 판정기 입력으로 넘긴다. 0곳이면 「세어 보았고 0곳이다」이지 「제출받지 못했다」가
     아니다 — 불허가 측정에 기댄다.
   ★ 하드코딩한 0 은 측정이 아니다. 측정은 레지스트리를 **읽어서** 한다. 그리고 레지스트리와
     화면 소스가 어긋나면 안 되므로 **정적 교차 검사의 소유자는 run_wording_guard** 다
     (PG_AI_NOTICE 와 같은 사상 — 선언이 자기를 통과시키지 못하게 둘을 가른다). */
const PG_SELF_SCAN = [
  { k: "brokerNotice", ko: "통신판매중개자 지위 고지", policy: "L-10",
    where: "중개 지면(건강쇼핑 상품 · 주문 지면)", match: "통신판매중개",
    registry: "PG_SCREEN_NOTICE", staticOwner: "run_wording_guard 검사 ⑱",
    how: "지면 고지 레지스트리 전건에서 「통신판매중개」가 든 문안의 자리를 센다",
    note: "레지스트리 등재는 고지가 실제로 렌더되는 자리를 가리킨다. 등재가 없으면 0곳이고, 그 0 은 측정 결과다" },
];
function pgSelfScan(k) {
  const d = PG_SELF_SCAN.filter((x) => x.k === k)[0];
  if (!d) return null;
  const places = [];
  try { for (const r of PG_SCREEN_NOTICE) if (String(r.text || "").indexOf(d.match) >= 0) places.push(r.at); } catch (e) {}
  return { k: d.k, ko: d.ko, n: places.length, places: places, match: d.match,
    registry: d.registry, how: d.how, where: d.where, note: d.note };
}

/* ── ⑤ 기간축 롤업 계약 ─────────────────────────────────────────────────────
   금액 · 건수 · 모집단의 **계산 원천은 이 롤업 하나**다. 두 곳에서 따로 계산하면 같은
   협력업체의 매출이 또 두 값이 된다. 구현 소유자는 P5a 이고, 이 표는 그 계약이다. */
const PG_ROLLUP = {
  owner: "P5a", name: "period 롤업", input: "supplyData() 읽기 전용",
  key: "vendorId | YYYY-MM", order: "거래처 배열 순서 × 월 오름차순 — 정렬을 끼우지 않는다",
  index: { name: "oByV", why: "단일 거래처 모달이 주문 전건을 선형 주사한다. 전수 보고서는 색인 없이 성립하지 않는다" },
  cell: ["sales", "supplyCost", "fee", "marginNet", "settleTarget", "preShip", "delivered", "orders", "slaMet", "service"],
  meta: ["asOf", "window", "months", "partnerN", "vendorN", "byKind", "gmv", "uncaught.sales", "uncaught.supplyCost", "grades"],
  rules: [
    "취소 주문은 제외한다 — 집계 여러 곳이 이미 쓰는 규약이다",
    "기간은 주문일 기준 월이다. 날짜 객체를 거치면 로컬 시간대에서 월 경계일이 밀린다",
    "주문 0건 셀은 행을 만들지 않는다 — 「매출 0원」 전표가 서면 판정 지면에서 미제출과 구별되지 않는다",
    "상위 합계는 행 합으로만 만든다(규약 7)",
    "단일 거래처 모달은 이 롤업을 **읽는 소비자**로 전환한다 — 자기 계산을 갖지 않는다",
    "서비스 제공 축은 금액 축과 별 칸이다. 레코드가 없으면 「해당 없음」이고 0이 아니다",
  ],
};

/* ── ⑥ 조항별 입력 계약 ─────────────────────────────────────────────────────
   어느 객체의 어느 필드를 보는가. 이것이 정해지지 않으면 P3 는 판정 분기를 쓸 수 없고,
   P5 는 추적 레인 1에 무엇을 회색으로 보여줄지 모른다. */

/* 입력 객체 사전 — obj 는 반드시 이 키 중 하나다. */
const PG_OBJ = {
  partner: { ko: "협력업체 레코드", owner: "PG_PARTNER (P3)", base: "ABSENT" },
  license: { ko: "자기 영업 자격", owner: "partner.licenses[]", base: "ABSENT",
    note: "근거 행위가 유형마다 다르다 — 허가 / 신고 / 등록 / 지정을 반드시 함께 적는다" },
  site: { ko: "위탁 제조소", owner: "partner.manufacturingSites[]", base: "ABSENT",
    note: "제조 기준은 제조업소에 적용된다. 제조하지 않는 유통 · 수입 브랜드사에 「미보유」를 결함으로 찍으면 범주 오류다" },
  evidence: { ko: "증거", owner: "partner.evidence[]", base: "ABSENT" },
  submit: { ko: "협력업체 제출 필드", owner: "PG_FIELDS (P4)", base: "ABSENT",
    note: "이 객체의 키 목록이 제출 필드 사전의 발주서다. 사전 밖 필드는 존재하지 않는다" },
  published: { ko: "외부 공표값 인용", owner: "PG_PUBLISHED (P1)", base: "REAL",
    note: "우리가 등급을 만들지 않는다 — 제도가 공표한 값을 인용만 한다" },
  vendor: { ko: "거래처", owner: "supplyData().vendors", base: "DEMO" },
  contract: { ko: "계약", owner: "supplyData().contracts", base: "DEMO" },
  product: { ko: "제품", owner: "supplyData().products", base: "DEMO" },
  order: { ko: "주문", owner: "supplyData().orders", base: "DEMO" },
  shipment: { ko: "배송", owner: "supplyData().shipments", base: "DEMO" },
  rollup: { ko: "기간축 롤업", owner: "PG_ROLLUP (P5a)", base: "DEMO" },
  self: { ko: "당사 구조", owner: "당사 계약 · 정산 · 화면 구조", base: "REAL",
    note: "당사 축 조항의 입력은 **협력업체 제출물이 아니다.** 우리 쪽 계약 조항 · 정산 산식 · 노출 로직 · 고지 지면을 본다" },
  ops: { ko: "조정 가능 임계", owner: "OPS_SPEC (P4)", base: "REAL",
    note: "조정 가능한 것만 둔다 — 판정 임계와 집행 수준 하한은 여기 두지 않는다" },
};

/* 조항 입력 계약 전수.
     subject   = 판정 대상(협력업체 / 당사) — 판정표의 필수 열이다
     appliesTo = 유형 해당성. qual 이 있으면 자격 축으로 더 좁힌다
     lawRef    = 법령 레지스트리 키. **이름과 조문은 여기 적지 않는다**(P3 소유)
     ruleId    = 판정기 내부 디스패치 키 이름. 분기 코드는 조항에 두지 않는다
     inputs    = {obj, k, grade, use} — 추적 레인 1의 원천 */
const PG_INPUTS = [
  /* ── 통제군 L — 법령 준수 ── */
  { id: "L-01", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.1", severity: "중대", cycle: "분기", obligation: true, lawRef: "ntsBizStat", ruleId: "r_biz_status",
    title: "사업자 실존 · 영업 상태",
    inputs: [{ obj: "submit", k: "bizno", grade: "ABSENT", use: "실존 확인 — 수신 시 체크섬 검증" },
             { obj: "submit", k: "biz_status", grade: "ABSENT", use: "폐업 · 휴업 판정" },
             { obj: "submit", k: "biz_cert_at", grade: "ABSENT", use: "증빙 발급일" }],
    evidence: ["사업자등록증 사본", "영업 상태 조회 결과"] },
  { id: "L-02", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.1", severity: "중대", cycle: "연", obligation: true, lawRef: "qualByKind", ruleId: "r_license_valid",
    title: "유형별 영업 자격 보유 · 유효",
    inputs: [{ obj: "license", k: "type", grade: "ABSENT", use: "자격 종류" },
             { obj: "license", k: "basis", grade: "ABSENT", use: "근거 행위 — 허가 / 신고 / 등록 / 지정. 유형마다 다르다" },
             { obj: "license", k: "no", grade: "ABSENT", use: "자격 번호 — 생성하지 않는다" },
             { obj: "license", k: "issuer", grade: "ABSENT", use: "발급기관" },
             { obj: "license", k: "to", grade: "ABSENT", use: "만료일 — 경과 시 불허, 만료 30일 전 통지" },
             { obj: "site", k: "gmp", grade: "ABSENT", use: "위탁 제조소의 제조 기준 지정 여부",
               qual: "제조업 자격 보유 협력업체에만 해당", naRule: "제조하지 않는 유통 · 수입 브랜드사는 해당 없음" }],
    evidence: ["자격증 사본", "발급기관 조회 결과", "위탁 제조소 지정 증빙"] },
  { id: "L-03", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "온보딩", obligation: true, lawRef: "selfReviewByKind", ruleId: "r_ad_review",
    title: "표시 · 광고 자율심의",
    inputs: [{ obj: "submit", k: "ad_review_org", grade: "ABSENT", use: "심의기구명" },
             { obj: "submit", k: "ad_review_no", grade: "ABSENT", use: "심의번호 — 제3자 조회 창구가 없다" },
             { obj: "submit", k: "ad_review_to", grade: "ABSENT", use: "유효기간" },
             { obj: "submit", k: "ad_review_doc", grade: "ABSENT", use: "심의 결과서 사본" },
             { obj: "product", k: "name", grade: "DEMO", use: "기능성 · 효능 표현 유무 대조" }],
    evidence: ["심의 결과서 사본 + 심의기구명 + 심의번호 + 유효기간"],
    note: "심의 주체가 민간 자율심의기구이므로 공표 조회가 성립하지 않는다. 증거는 구조적으로 협력업체 제출뿐이다" },
  { id: "L-04", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.2", severity: "치명", cycle: "온보딩", obligation: true, lawRef: "pipa", ruleId: "r_dpa_clauses",
    title: "개인정보 위수탁 문서 요건",
    denomNote: "필수 기재 7항목 고정 — 결측 1건 이상이면 불허. 한 항목을 둘로 쪼개면 분모가 어긋난다",
    inputs: [{ obj: "submit", k: "dpa_no_other_use", grade: "ABSENT", use: "목적 외 처리 금지에 관한 사항" },
             { obj: "submit", k: "dpa_safeguards", grade: "ABSENT", use: "기술적 · 관리적 보호조치에 관한 사항" },
             { obj: "submit", k: "dpa_purpose_scope", grade: "ABSENT", use: "위탁업무의 목적 및 범위 — 한 항목이다" },
             { obj: "submit", k: "dpa_subcontract_limit", grade: "ABSENT", use: "재위탁 제한에 관한 사항" },
             { obj: "submit", k: "dpa_access_control", grade: "ABSENT", use: "접근 제한 등 안전성 확보 조치에 관한 사항" },
             { obj: "submit", k: "dpa_supervision", grade: "ABSENT", use: "관리 현황 점검 등 감독에 관한 사항" },
             { obj: "submit", k: "dpa_liability", grade: "ABSENT", use: "의무 위반 시 손해배상 등 책임에 관한 사항" }],
    evidence: ["위수탁 계약서"] },
  { id: "L-05", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "반기", obligation: true, lawRef: "pipa", ruleId: "r_subcontract_consent",
    title: "재위탁 제한 · 위탁자 동의",
    inputs: [{ obj: "submit", k: "sub_exists", grade: "ABSENT", use: "재위탁 유무(4차 포함)" },
             { obj: "submit", k: "sub_consent_at", grade: "ABSENT", use: "위탁자 동의 일자" },
             { obj: "submit", k: "sub_party_ref", grade: "ABSENT", use: "재수탁자 식별 — 개인식별자는 받지 않는다" }],
    evidence: ["재위탁 현황 신고", "동의 기록"] },
  { id: "L-06a", group: "L", subject: "당사", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "3.3.2", severity: "중대", cycle: "사유발생", obligation: true, lawRef: "pipa", ruleId: "r_processor_disclosure",
    title: "수탁자 공개 의무 이행",
    inputs: [{ obj: "self", k: "privacyPolicy.processors[]", grade: "REAL", use: "당사 처리방침의 수탁자 기재(재수탁자 포함)" },
             { obj: "self", k: "privacyPolicy.snapshotAt", grade: "REAL", use: "기재 시점" },
             { obj: "partner", k: "partnerId", grade: "REAL", use: "대조 대상 식별자" }],
    evidence: ["처리방침 스냅샷"],
    note: "입력이 협력업체 제출물이 아니라 **당사 지면**이다. 협력업체가 아무것도 제출하지 않아도 이 조항은 판정된다" },
  { id: "L-06b", group: "L", subject: "당사", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "3.3.2", severity: "중대", cycle: "사유발생", obligation: true, lawRef: "pipa", ruleId: "r_promo_notice",
    title: "홍보 · 판매권유 위탁 시 정보주체 개별 고지",
    inputs: [{ obj: "self", k: "delegation.kind", grade: "REAL", use: "위탁 업무 성질 — 홍보 · 판매권유 해당 여부" },
             { obj: "self", k: "notice.sentLog[]", grade: "REAL", use: "고지 발송 이력" },
             { obj: "self", k: "notice.changeLog[]", grade: "REAL", use: "변경 시 재고지 이력" }],
    evidence: ["고지 발송 로그", "고지 문안"] },
  { id: "L-07", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "분기", obligation: false, lawRef: "sanctionPublic", ruleId: "r_sanction_history",
    title: "행정처분 · 제재 이력",
    inputs: [{ obj: "submit", k: "sanction_list[]", grade: "ABSENT", use: "최근 3년 처분 이력" },
             { obj: "submit", k: "sanction_level", grade: "ABSENT", use: "처분 수준" }],
    evidence: ["공표 조회 결과", "협력업체 소명"],
    note: "권고다 — 소명 후 판단한다. 확인되지 않은 이력으로 거래를 끊지 않는다" },
  { id: "L-08", group: "L", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "연", obligation: true, lawRef: "aiFrame", ruleId: "r_ai_transparency",
    title: "인공지능 투명성 확보 의무",
    inputs: [{ obj: "submit", k: "ai_used", grade: "ABSENT", use: "인공지능 사용 여부 · 범위" },
             { obj: "submit", k: "ai_highimpact", grade: "ABSENT", use: "고영향 해당성 — 성질 요건과 영역 요건을 함께 본다" },
             { obj: "submit", k: "ai_highimpact_basis", grade: "ABSENT", use: "해당성 판정 근거 — 사업자 자체 확인 또는 소관 장관 확인 결과" },
             { obj: "submit", k: "ai_generative", grade: "ABSENT", use: "생성형 제품 · 서비스 여부" },
             { obj: "submit", k: "ai_notice_text", grade: "ABSENT", use: "사전 고지 문구" },
             { obj: "submit", k: "ai_notice_shot", grade: "ABSENT", use: "고지 화면 증빙" }],
    evidence: ["고지 문구", "화면 증빙", "고영향 해당성 판정 근거"],
    note: "제재 수준이 과태료이고 소관 부처의 집행 유예가 확인된 조항이다. 고지 보완 요구이고 거래 차단이 아니다 — 비례성" },
  { id: "L-09", group: "L", subject: "당사", appliesTo: ["PT-MED", "PT-CARE"],
    lifecycle: "2.3.2", severity: "치명", cycle: "사유발생", obligation: true, lawRef: "referralByKind", ruleId: "r_referral_fee",
    title: "연계 · 소개 대가 구조의 유인 · 알선 적합성",
    inputs: [{ obj: "self", k: "contract.feeClause", grade: "REAL", use: "계약서 수수료 조항" },
             { obj: "self", k: "settle.formulaRef", grade: "REAL", use: "정산 산식 — **읽기만 한다.** 법률 검토 회신 전까지 동결이다" },
             { obj: "self", k: "settle.linkedToTreatmentCost", grade: "REAL", use: "진료비 · 급여비 연동 여부" },
             { obj: "self", k: "settle.introFeeExists", grade: "REAL", use: "소개수수료 유무" },
             { obj: "self", k: "exposure.selective", grade: "REAL", use: "선별 노출 여부" },
             { obj: "self", k: "careStream.payee", grade: "REAL", use: "돌봄 스트림 수취 주체 · 산정 기준" },
             { obj: "self", k: "legalReview.replyAt", grade: "ABSENT", use: "법률 검토 회신 — 해제 조건이다" }],
    evidence: ["계약서 수수료 조항", "정산 산식 참조", "노출 로직", "법률 검토 기록"],
    enforceFix: "advisory",
    note: "집행은 경고 · 기록 고정이다. 시정 과제는 「차단」이 아니라 구조 변경 과제와 법률 검토 회신이다. " +
          "판정 대상이 협력업체가 아니라 우리 구조이므로, 회신 없이 산식을 건드리면 확인하지 못한 법으로 우리 거래를 끊는 일이 된다" },
  { id: "L-10", group: "L", subject: "당사", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "연", obligation: true, lawRef: "ecomm", ruleId: "r_broker_notice",
    title: "통신판매중개자 지위 고지",
    inputs: [{ obj: "self", k: "shop.brokerNotice.n", grade: "REAL", use: "중개자 지위 고지가 등재된 자리 수 — PG_SELF_SCAN 실측값이다(미제출이 아니다)" },
             { obj: "self", k: "shop.brokerNotice.places", grade: "REAL", use: "실측된 자리 목록" },
             { obj: "self", k: "shop.brokerNoticeWhen", grade: "ABSENT", use: "고지 시점 — 미리 고지여야 한다. 자리가 실측된 뒤에 묻는다" }],
    evidence: ["지면 고지 레지스트리 실측", "고지 위치 · 시점 기록"],
    note: "불허는 **측정**에 기댄다 — 「제출받지 못했다」가 아니라 「중개 지면 고지 레지스트리를 전수로 세어 보니 0곳이다」다. " +
          "미제출을 판정값으로 쓰지 않는다는 규약(§10-4 규약 ②)이 당사 축에도 똑같이 적용된다" },
  { id: "L-11", group: "L", subject: "당사", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "연", obligation: true, lawRef: "ecomm", ruleId: "r_broker_liability",
    title: "중개자 겸 통신판매업자 구간의 청약철회 책임",
    inputs: [{ obj: "self", k: "shop.statusMap[]", grade: "REAL", use: "당사가 통신판매업자 지위를 겸하는 거래 구간 식별" },
             { obj: "self", k: "shop.withdrawalProcess", grade: "REAL", use: "당사 청약철회 처리 체계" },
             { obj: "self", k: "shop.withdrawalLog[]", grade: "ABSENT", use: "처리 실적" }],
    evidence: ["지위 구분표", "청약철회 처리 실적"],
    note: "지위를 고지하더라도 면제되지 않는 책임 구간이다. 고지(L-10)를 충족해도 이 조항은 따로 판정된다" },

  /* ── 통제군 P — 제품 · 서비스 건전성 ── */
  { id: "P-01", group: "P", subject: "협력업체", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "온보딩", obligation: false, lawRef: "internal", ruleId: "r_label_match",
    title: "품목 실존 · 라벨 정합",
    inputs: [{ obj: "product", k: "id", grade: "DEMO", use: "품목 실존" },
             { obj: "submit", k: "label_doc", grade: "ABSENT", use: "제품 라벨 · 성분표" }],
    evidence: ["제품 라벨", "성분표"],
    note: "라벨 미확인은 위반이 아니라 pending 이다 — 확인하지 못한 것을 결함으로 적지 않는다" },
  { id: "P-02", group: "P", subject: "협력업체", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "치명", cycle: "월", obligation: true, lawRef: "recallPublic", ruleId: "r_recall_open",
    title: "회수 · 리콜 이력",
    inputs: [{ obj: "submit", k: "recall_list[]", grade: "ABSENT", use: "회수 이력" },
             { obj: "submit", k: "recall_open", grade: "ABSENT", use: "미완료 회수 보유 여부" },
             { obj: "product", k: "id", grade: "DEMO", use: "노출 차단 대상 품목 대조" }],
    evidence: ["공표 조회 결과"] },
  { id: "P-03", group: "P", subject: "협력업체", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "월", obligation: false, lawRef: "internal", ruleId: "r_sla_breach",
    title: "배송 이행",
    inputs: [{ obj: "contract", k: "slaDays", grade: "DEMO", use: "계약 기준일 — 실원천 축이다" },
             { obj: "rollup", k: "cell.slaMet", grade: "DEMO", use: "기준일 내 배송 비율" },
             { obj: "ops", k: "slaWarnRate", grade: "REAL", use: "경고 임계 — 조정 가능 항목" }],
    evidence: ["주문 · 배송 레코드"],
    note: "반복되면 의무로 올라간다. 단일 월의 초과를 결함으로 적지 않는다" },
  { id: "P-04", group: "P", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC"],
    lifecycle: "2.3.3", severity: "경미", cycle: "월", obligation: false, lawRef: "internal", ruleId: "r_service_delivery",
    title: "서비스 제공 이행",
    inputs: [{ obj: "submit", k: "service_count", grade: "ABSENT", use: "제공 건수" },
             { obj: "submit", k: "service_rate", grade: "ABSENT", use: "이행률" }],
    evidence: ["제공 레코드"],
    note: "데이터가 없으면 해당 없음이다. 0%로 적으면 「이행하지 않았다」로 읽힌다" },
  { id: "P-05", group: "P", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE"],
    lifecycle: "2.3.3", severity: "치명", cycle: "반기", obligation: true, lawRef: "internal", ruleId: "r_emergency_route",
    title: "응급 · 이상 상황 전달 경로",
    inputs: [{ obj: "submit", k: "emg_route", grade: "ABSENT", use: "전달 경로 등록" },
             { obj: "submit", k: "emg_drill_at", grade: "ABSENT", use: "훈련 기록" },
             { obj: "submit", k: "emg_owner", grade: "ABSENT", use: "책임자 — 내부 식별자만" }],
    evidence: ["경로 등록", "훈련 기록"],
    note: "응급 안내가 상담보다 위에 선다는 제품 원칙을 협력업체 축으로 옮긴 조항이다" },
  { id: "P-06", group: "P", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "반기", obligation: true, lawRef: "ecomm", ruleId: "r_complaint_system",
    title: "민원 · 분쟁 처리 체계",
    inputs: [{ obj: "submit", k: "complaint_system", grade: "ABSENT", use: "접수 · 처리 체계 보유" },
             { obj: "submit", k: "complaint_stats", grade: "ABSENT", use: "처리 통계" }],
    evidence: ["체계 문서", "처리 통계"] },
  { id: "P-07", group: "P", subject: "협력업체", appliesTo: ["PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "연", obligation: true, lawRef: "ecomm", ruleId: "r_withdrawal_terms",
    title: "청약철회 · 환불 — 협력업체 약관 · 처리 실적 축",
    inputs: [{ obj: "submit", k: "withdrawal_terms", grade: "ABSENT", use: "약관 보유" },
             { obj: "submit", k: "withdrawal_refusals[]", grade: "ABSENT", use: "거절 사유별 실적 — 법정 제외 사유 밖의 거절 여부" }],
    evidence: ["약관", "처리 실적"],
    note: "당사 축의 책임 구간은 L-11 이 따로 본다. 두 조항을 한 칸으로 합치지 않는다" },
  { id: "P-08", group: "P", subject: "협력업체", appliesTo: ["PT-SVC"],
    lifecycle: "2.3.3", severity: "중대", cycle: "사유발생", obligation: true, lawRef: "iso42001", ruleId: "r_model_validation",
    title: "모델 · 알고리즘 검증",
    inputs: [{ obj: "submit", k: "model_card", grade: "ABSENT", use: "의도된 용도와 부적합 맥락" },
             { obj: "submit", k: "model_validation", grade: "ABSENT", use: "검증 보고서" },
             { obj: "submit", k: "model_version", grade: "ABSENT", use: "버전 — 바뀌면 판정이 무효다" }],
    evidence: ["검증보고서", "버전관리 기록"],
    note: "표준 통제 번호는 원문 입수 전까지 적지 않는다. 통제목표 표제까지만 쓴다" },
  { id: "P-09", group: "P", subject: "협력업체", appliesTo: ["PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "치명", cycle: "사유발생", obligation: true, lawRef: "mohwNonMed", ruleId: "r_nonmedical_scope",
    title: "비의료 건강관리서비스 범위 적합성",
    inputs: [{ obj: "submit", k: "service_acts[]", grade: "ABSENT", use: "제공 행위 목록" },
             { obj: "submit", k: "guideline_match", grade: "ABSENT", use: "판단 요건 대조표" },
             { obj: "submit", k: "authority_reply", grade: "ABSENT", use: "소관 부처 유권해석 회신 — 경계 사례의 판정 보류를 푸는 유일한 입력" },
             { obj: "product", k: "subcat", grade: "DEMO", use: "결과 해석 기능 보유 품목 대조", qual: "결과 해석 기능이 있는 품목" }],
    evidence: ["제공 행위 목록", "대조표", "유권해석 회신"],
    note: "경계 사례는 회신 전까지 판정 보류다. 우리가 의료행위 해당성을 단정하지 않는다" },

  /* ── 통제군 T — 신뢰 시스템의 구축 · 지속운영 ──
     이 통제군만 **존재 / 기능 2판정**이다. 「있다」가 아니라 「있고, 지금도 돌고 있다」를 본다. */
  { id: "T-01", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "연", obligation: false, lawRef: "coso", ruleId: "r_control_env", dual: true,
    title: "통제환경 — 책임자 · 윤리규정",
    inputs: [{ obj: "submit", k: "ethics_doc", grade: "ABSENT", use: "존재 — 지정 문서" },
             { obj: "submit", k: "ethics_activity_at", grade: "ABSENT", use: "기능 — 최근 1년 활동 기록" }],
    evidence: ["조직도", "규정", "회의록"] },
  { id: "T-02", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "연", obligation: false, lawRef: "coso", ruleId: "r_risk_assess", dual: true,
    title: "위험평가 — 식별 · 갱신",
    inputs: [{ obj: "submit", k: "risk_list", grade: "ABSENT", use: "존재 — 위험목록" },
             { obj: "submit", k: "risk_updated_at", grade: "ABSENT", use: "기능 — 최근 갱신일이 주기 내인가" }],
    evidence: ["위험목록", "갱신 이력"] },
  { id: "T-03", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.2", severity: "중대", cycle: "반기", obligation: true, lawRef: "ismsp", ruleId: "r_access_control", dual: true,
    title: "접근통제 · 보호조치",
    inputs: [{ obj: "submit", k: "access_policy", grade: "ABSENT", use: "존재 — 정책" },
             { obj: "submit", k: "access_review_at", grade: "ABSENT", use: "기능 — 계정 · 권한 점검 기록" }],
    evidence: ["점검 결과"] },
  { id: "T-04", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.1", severity: "경미", cycle: "연", obligation: false, lawRef: "ismsp", ruleId: "r_cert_hold", dual: false,
    title: "정보보호 인증 보유",
    inputs: [{ obj: "submit", k: "cert_list[]", grade: "ABSENT", use: "인증서" },
             { obj: "submit", k: "cert_scope", grade: "ABSENT", use: "범위 명세 — 범위 밖 인증은 그 조항의 증거가 아니다" }],
    evidence: ["인증서", "범위 명세"],
    note: "보유는 증거의 한 조각이지 조항 충족이 아니다. 단독 근거로 두지 않는다" },
  { id: "T-05", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "연", obligation: true, lawRef: "pipa", ruleId: "r_training_supervision", dual: true,
    title: "교육 · 관리 감독",
    inputs: [{ obj: "submit", k: "training_plan", grade: "ABSENT", use: "존재 — 계획" },
             { obj: "submit", k: "training_done_at", grade: "ABSENT", use: "기능 — 이행 기록이 주기 내인가" }],
    evidence: ["교육 기록", "점검 기록"] },
  { id: "T-06", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "중대", cycle: "반기", obligation: true, lawRef: "coso", ruleId: "r_monitoring", dual: true,
    title: "모니터링 — 미비점 처리",
    inputs: [{ obj: "submit", k: "finding_process", grade: "ABSENT", use: "존재 — 절차" },
             { obj: "submit", k: "finding_closed[]", grade: "ABSENT", use: "기능 — 등록에서 종결까지 추적" }],
    evidence: ["시정 이력"],
    note: "협력업체 축의 등급 어법은 결함 3등급이다. 당사 재무보고 통제의 어법을 여기에 쓰지 않는다" },
  { id: "T-07", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "연", obligation: false, lawRef: "coso", ruleId: "r_communication", dual: true,
    title: "소통 — 대외 고지",
    inputs: [{ obj: "submit", k: "notice_channel", grade: "ABSENT", use: "존재 — 고지 채널" },
             { obj: "submit", k: "notice_recent_at", grade: "ABSENT", use: "기능 — 최근 고지 실적" }],
    evidence: ["고지 화면", "공지"] },
  { id: "T-08", group: "T", subject: "협력업체", appliesTo: ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"],
    lifecycle: "2.3.3", severity: "경미", cycle: "연", obligation: false, lawRef: "iso37301", ruleId: "r_compliance_function", dual: true,
    title: "준법 · 반부패 기능",
    inputs: [{ obj: "submit", k: "compliance_fn", grade: "ABSENT", use: "존재 — 준법 체계 문서" },
             { obj: "submit", k: "antibribery_fn", grade: "ABSENT", use: "존재 — 반부패 체계 문서(별 축이다)" },
             { obj: "submit", k: "compliance_ops[]", grade: "ABSENT", use: "기능 — 운영 기록" }],
    evidence: ["체계 문서", "운영 기록"],
    note: "두 기능을 한 축으로 뭉치지 않는다 — 표준 개정 방향이 역할 중복을 걷어내는 쪽이다" },
];

/* 자기 거버넌스 항목 — 우리 자신의 인공지능에 대한 통제. 화면 등재 소유자는 P6 이고,
   이 표는 **수범자가 우리인 조문에 대응 항목이 존재한다**는 연결을 P2 에서 못 박는 자리다. */
const PG_SELF_GOV = [
  { id: "G-01", ko: "판정 소유권", check: "에이전트 출력에 판정기 반환값 외의 숫자가 0건", lawRef: null },
  { id: "G-02", ko: "사람 승인 필수 액션", check: "거래중지 · 정산보류 · 등급 하향 · 면제 승인은 전부 사람 승인을 지난다", lawRef: null, popRequired: true },
  /* popRequired — 검증 기준이 **로그 · 건수**에 기대는 항목이다. 모집단이 0이면 「미계측」으로 적고
     「충족」 분자에서 뺀다(2026-10-26 · 「0 = 0 녹색」 재발 방지). 소유자는 run_wording_guard 검사 ⑳. */
  { id: "G-03", ko: "행위자 구분", check: "결정 로그에서 사람 승인과 시스템 판정이 구분된다", lawRef: null, popRequired: true },
  { id: "G-04", ko: "금칙 사전 단일 원천", check: "새 사전을 만들지 않고 기존 사전에 조항을 더한다", lawRef: null },
  { id: "G-05", ko: "에이전트 범위", check: "새 에이전트를 만들지 않고 기존 두 에이전트의 소유 · 지표 · 가드를 확장한다", lawRef: null },
  { id: "G-06", ko: "회원 경로 차단", check: "회원 프로파일로 협력업체 · 원가 · 수수료 · 여신을 물으면 응답 0건", lawRef: null },
  { id: "G-07", ko: "자기 한계 표기", check: "보고서가 스스로 한계를 적는다", lawRef: null, usedBy: ["b7.limit", "PG_EXPORT_HEAD"] },
  { id: "G-08", ko: "인공지능 기반 운용 사전 고지", check: "에이전트가 상주하는 화면 전수에 고지 문구가 존재한다. 그 문장만 떼면 가드가 실패한다",
    lawRef: "aiFrame", self: true, popRequired: true, usedBy: ["b1.aiNotice"] },
  { id: "G-09", ko: "생성형 산출 표시", check: "에이전트 답변 · 보고서 생성 문안에 생성형 산출 표시가 붙는다. 같은 애블레이션 형태로 검증한다",
    lawRef: "aiFrame", self: true, popRequired: true, usedBy: ["b1.aiNotice"] },
];

/* ── ⑦ 출처 등급 할당표 ─────────────────────────────────────────────────────
   필드마다 등급을 붙인다. 등급 없는 필드는 지면에 설 수 없다.
     REAL   실원천 · DEMO 시연 시드 파생 · ABSENT 미제출
     usable 판정에 쓸 수 있는가. **false 면 판정에서 빼고 pending 으로 센다** —
            값이 있어도 그 값의 성질이 판정을 지탱하지 못하는 자리가 있다(아래 bizno).
     clampFrom 이 등급 이하에서 데이터 경로가 이 필드를 잘라낸다(⑧). */
const PG_SOURCE_MAP = [
  /* 협력업체 신원 */
  { obj: "partner", k: "partnerId", ko: "협력업체 식별자", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "partner", k: "dispName", ko: "표시명", grade: "REAL", usable: true, clampFrom: null, axis: "name",
    note: "표시명은 단일 함수에서만 나온다" },
  { obj: "partner", k: "legalName", ko: "실상호", grade: "REAL", usable: true, clampFrom: "L2", axis: "name",
    note: "레코드에는 모드와 무관하게 보존한다 — 지우면 코드 표기로 돌린 뒤 판정 대상이 누구인지 내부에서도 확인할 수 없고 소명 절차가 성립하지 않는다" },
  { obj: "partner", k: "kind", ko: "협력업체 유형", grade: "REAL", usable: true, clampFrom: null, axis: "class" },
  { obj: "partner", k: "bizno", ko: "사업자등록번호", grade: "ABSENT", usable: false, clampFrom: "L2", axis: "id",
    note: "거래 사실 레이어의 현 값은 난수다 — 실명 법인 옆의 번호는 판정에 쓰지 않고 「미확보」로 렌더한다. 실제 제휴 시 제출로만 채운다" },
  { obj: "partner", k: "corpNo", ko: "법인등록번호", grade: "ABSENT", usable: false, clampFrom: "L2", axis: "id" },
  { obj: "partner", k: "lifecycle", ko: "생애주기", grade: "REAL", usable: true, clampFrom: null, axis: "class" },
  { obj: "partner", k: "vendorId", ko: "거래처 연결", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "partner", k: "controls[]", ko: "판정 결과", grade: "ABSENT", usable: false, clampFrom: null, axis: "derived",
    note: "**저장하지 않는다.** 판정은 항상 판정기 호출로 얻는다 — 저장하면 정책이 바뀌어도 낡은 판정이 남아 화면이 거짓말한다" },
  /* 자격 · 심의 · 인증 — 전부 미제출. 번호를 생성하지 않는다 */
  { obj: "license", k: "type/basis/no/issuer/from/to/verified", ko: "자기 영업 자격 7필드", grade: "ABSENT", usable: false, clampFrom: null, axis: "qual" },
  { obj: "site", k: "name/gmp/gmpNo/verified", ko: "위탁 제조소 4필드", grade: "ABSENT", usable: false, clampFrom: null, axis: "qual" },
  { obj: "submit", k: "ad_review_*", ko: "자율심의 발급물 4필드", grade: "ABSENT", usable: false, clampFrom: null, axis: "qual",
    note: "제3자 조회 창구가 없다 — 외부 소스로 등재하면 카탈로그가 거짓말한다" },
  { obj: "submit", k: "cert_list[]", ko: "정보보호 · 인공지능 경영 인증", grade: "ABSENT", usable: false, clampFrom: null, axis: "qual" },
  { obj: "published", k: "ltc-grade", ko: "돌봄기관 평가등급", grade: "REAL", usable: true, clampFrom: null, axis: "published",
    note: "공표값 인용 전용. 우리가 등급을 산출하지 않고, 공표 레이블 밖의 표기를 만들지 않는다" },
  { obj: "published", k: "hosp-cert", ko: "의료기관 인증 공표값", grade: "REAL", usable: true, clampFrom: null, axis: "published",
    note: "공표 명단에 실리지 않는 상태가 있어 미신청과 대상 아님이 구분되지 않는다. 자율 대상 미신청은 해당 없음으로 둔다" },
  /* 계약 · 위탁 · 보험 · 사고 이력 */
  { obj: "submit", k: "dpa_*", ko: "위수탁 필수 기재 7항목", grade: "ABSENT", usable: false, clampFrom: null, axis: "contract" },
  { obj: "submit", k: "sub_*", ko: "재위탁 3필드", grade: "ABSENT", usable: false, clampFrom: null, axis: "contract" },
  { obj: "submit", k: "insurance_*", ko: "배상책임보험", grade: "ABSENT", usable: false, clampFrom: "L2", axis: "money" },
  { obj: "submit", k: "financial_*", ko: "재무제표 · 신용등급", grade: "ABSENT", usable: false, clampFrom: "L2", axis: "money" },
  { obj: "submit", k: "sanction_*", ko: "행정처분 · 제재 이력", grade: "ABSENT", usable: false, clampFrom: null, axis: "history" },
  { obj: "submit", k: "recall_*", ko: "회수 · 리콜 이력", grade: "ABSENT", usable: false, clampFrom: null, axis: "history" },
  { obj: "submit", k: "complaint_*", ko: "민원 처리 체계 · 통계", grade: "ABSENT", usable: false, clampFrom: null, axis: "ops" },
  /* 인공지능 · 운영 · 서비스 */
  { obj: "submit", k: "ai_*", ko: "인공지능 점검 6필드", grade: "ABSENT", usable: false, clampFrom: null, axis: "ai" },
  { obj: "submit", k: "model_*", ko: "모델카드 · 검증 · 버전", grade: "ABSENT", usable: false, clampFrom: null, axis: "ai" },
  { obj: "partner", k: "ownerTeam/ownerEmp/lastReviewAt", ko: "담당 · 최근 실사일", grade: "ABSENT", usable: false, clampFrom: null, axis: "ops",
    note: "담당자는 내부 식별자만 받는다 — 협력업체 임직원 개인정보는 받지 않는다" },
  { obj: "submit", k: "service_*", ko: "서비스 제공 건수 · 이행률", grade: "ABSENT", usable: false, clampFrom: null, axis: "perf" },
  { obj: "submit", k: "emg_*", ko: "응급 전달 경로 · 훈련", grade: "ABSENT", usable: false, clampFrom: null, axis: "ops" },
  /* 거래 사실 레이어 — 읽기 전용 입력 */
  { obj: "vendor", k: "id", ko: "거래처 식별자", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "vendor", k: "name", ko: "거래처 상호", grade: "REAL", usable: true, clampFrom: "L2", axis: "name",
    note: "거래 사실 레이어는 실상호를 쓰는 것이 정상이다. 판정 지면과 반출물만 표시 함수를 지난다" },
  { obj: "vendor", k: "category", ko: "카테고리", grade: "REAL", usable: true, clampFrom: null, axis: "class" },
  { obj: "vendor", k: "scale", ko: "규모 구분", grade: "DEMO", usable: true, clampFrom: null, axis: "class" },
  { obj: "vendor", k: "credit", ko: "여신 한도", grade: "DEMO", usable: false, clampFrom: "L2", axis: "credit",
    note: "판정에 쓰지 않는다. 운영 담당 등급 이하에서 데이터 경로가 잘라낸다" },
  { obj: "vendor", k: "payable", ko: "미지급", grade: "DEMO", usable: false, clampFrom: "L2", axis: "money",
    note: "독립 난수 필드다 — 주문 파생 정산 축과 **같은 지면에 두지 않는다**. 네 값이 서는 자리다(열린 항목)" },
  { obj: "vendor", k: "sla", ko: "기준 배송일", grade: "DEMO", usable: true, clampFrom: null, axis: "perf" },
  { obj: "vendor", k: "trust", ko: "신뢰 점수", grade: "DEMO", usable: false, clampFrom: null, axis: "score",
    note: "판정에 쓰지 않는다 — 산정 근거가 없는 점수를 통제 판정의 입력으로 올리면 총점 금지 규약이 뒷문으로 깨진다" },
  { obj: "product", k: "id", ko: "품목 식별자", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "product", k: "name", ko: "품목명", grade: "DEMO", usable: true, clampFrom: null, axis: "name",
    note: "제조사 브랜드가 품목명의 일부인 자리가 있어 데이터에서 지울 수 없다. 판정 지면 · 반출물에서만 가린다" },
  { obj: "product", k: "real", ko: "실 품목 표시", grade: "REAL", usable: true, clampFrom: null, axis: "class" },
  { obj: "product", k: "salePrice", ko: "판매가", grade: "DEMO", usable: true, clampFrom: null, axis: "money" },
  { obj: "product", k: "supplyPrice", ko: "공급가", grade: "DEMO", usable: true, clampFrom: "L2", axis: "cost" },
  { obj: "product", k: "marginPct", ko: "품목 마진율", grade: "DEMO", usable: false, clampFrom: "L2", axis: "margin" },
  { obj: "contract", k: "id", ko: "계약 식별자", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "contract", k: "feePct", ko: "수수료율", grade: "DEMO", usable: true, clampFrom: "L2", axis: "fee",
    note: "수수료의 단일 원천이다. 문자열이므로 숫자 캐스팅 없이 쓰면 조용히 동작하다가 결합 사고로 번진다" },
  { obj: "contract", k: "marginPct", ko: "계약 마진율(약정)", grade: "DEMO", usable: false, clampFrom: "L2", axis: "margin",
    note: "주문에서 실현된 마진율과 **다른 숫자**다. 라벨을 가르고 같은 지표 바에 두지 않는다 — 틀린 것은 값이 아니라 같은 이름으로 부른 것이다" },
  { obj: "contract", k: "slaDays", ko: "계약 기준일", grade: "DEMO", usable: true, clampFrom: null, axis: "perf" },
  { obj: "contract", k: "settleCycle", ko: "계약 주기(약정)", grade: "DEMO", usable: true, clampFrom: null, axis: "class",
    note: "정산 입도는 월 고정이므로 약정 주기와 다르다. 라벨을 가른다" },
  { obj: "order", k: "id/sku/vendorId/accountId", ko: "주문 식별 4필드", grade: "REAL", usable: true, clampFrom: null, axis: "id" },
  { obj: "order", k: "amount", ko: "주문 금액", grade: "DEMO", usable: true, clampFrom: null, axis: "money" },
  { obj: "order", k: "margin", ko: "주문 마진", grade: "DEMO", usable: true, clampFrom: "L2", axis: "margin" },
  { obj: "order", k: "status", ko: "주문 상태", grade: "DEMO", usable: true, clampFrom: null, axis: "class",
    note: "취소는 집계에서 제외한다" },
  { obj: "order", k: "orderDate", ko: "주문일", grade: "DEMO", usable: true, clampFrom: null, axis: "time",
    note: "기간축의 기준이다" },
  { obj: "shipment", k: "status/eta", ko: "배송 상태 · 도착 예정", grade: "DEMO", usable: true, clampFrom: null, axis: "perf" },
  { obj: "shipment", k: "fromVid", ko: "출고 거래처 식별자", grade: "DEMO", usable: false, clampFrom: "L2", axis: "id",
    note: "데이터에는 **식별자만** 둔다. 표기는 렌더에서 pgShipFrom() 이 표시명 함수를 지나 조립한다 — " +
      "종전에는 생성 시점에 상호를 심어(전건 28,755/28,755) 표시명 함수가 닿을 수 없었다(§4-6-5 ⓐ)" },
  { obj: "rollup", k: "cell.*", ko: "롤업 금액 · 건수 축", grade: "DEMO", usable: true, clampFrom: null, axis: "money",
    note: "금액 축 중 원가 · 수수료 · 마진 칸은 개별 필드 등급을 따른다" },
  /* 당사 축 — 협력업체 제출물이 아니다 */
  { obj: "self", k: "privacyPolicy.*", ko: "당사 처리방침 지면", grade: "REAL", usable: true, clampFrom: null, axis: "selfdoc" },
  { obj: "self", k: "notice.*", ko: "당사 고지 발송 이력", grade: "REAL", usable: true, clampFrom: null, axis: "selfdoc" },
  { obj: "self", k: "shop.*", ko: "당사 중개 지면 · 청약철회 체계", grade: "REAL", usable: true, clampFrom: null, axis: "selfdoc" },
  { obj: "self", k: "contract.feeClause", ko: "당사 계약 수수료 조항", grade: "REAL", usable: true, clampFrom: "L2", axis: "fee" },
  { obj: "self", k: "settle.*", ko: "당사 정산 산식 참조", grade: "REAL", usable: true, clampFrom: "L2", axis: "fee",
    note: "읽기만 한다. 법률 검토 회신 전까지 동결된 축이고, 동결 대상은 행 번호가 아니라 이름으로 지정돼 있다" },
  { obj: "self", k: "exposure.selective", ko: "당사 노출 로직", grade: "REAL", usable: true, clampFrom: null, axis: "selfdoc" },
  { obj: "self", k: "legalReview.replyAt", ko: "법률 검토 회신", grade: "ABSENT", usable: false, clampFrom: null, axis: "selfdoc" },
];

/* ── ⑧ 열람 등급 × 필드 가시성 ──────────────────────────────────────────────
   화면에서 숨기면 추적 지면 · 재판정 · 반출 세 경로가 각각 숨김을 다시 구현해야 하고,
   한 곳만 빠지면 샌다. 그래서 **반환 데이터에서 필드를 잘라낸다.**
   ⚠ 한계 1줄 — 단일 전역 번들이라 어느 컴포넌트든 거래 사실 레이어를 한 줄로 읽을 수 있다.
     클램프는 적힌 만큼의 강제력이 없고 **정적 검사로만 단속된다.** 그 한계를 알고 쓴다. */
const PG_VIEW = [
  { lv: "L1", ko: "전체", who: "내부통제 담당", how: "클램프 없이 통과", see: "전부", hide: "—", now: true },
  { lv: "L2", ko: "운영", who: "운영 담당(관리자 세션 내 운영 모드)", how: "데이터 경로 클램프",
    see: "판정 · 실적 · 시정 과제", hide: "여신 한도 · 원가 구성 상세 · 수수료율 · 실상호", now: true },
  { lv: "L3", ko: "협력업체 소명면", who: "해당 협력업체", how: "클램프 + 자기 레코드 한정",
    see: "자기 항목의 판정 · 근거 · 시정 요구만", hide: "금액 일체 · 타 협력업체 전부 · 비교 순위", now: false,
    pre: "협력업체 신원(로그인 주체) 신설 후 — 지금 그 등급으로 로그인할 방법이 없다",
    test: "로그인 실측이 아니라 **클램프 함수에 등급을 주입한 단위 테스트**다. 신원이 생기면 로그인 실측으로 승격한다" },
  { lv: "L4", ko: "대외", who: "감사인 · 투자자", how: "집계 전용 지면",
    see: "집계 통계 · 방법론", hide: "개별 협력업체 식별 정보 일체", now: false,
    pre: "외부 열람 주체 신설 후",
    test: "표시명 모드와 무관하게 집계 · 방법론만이다 — 실명 표기는 내부 지면을 연 것이고 대외 반출을 연 것이 아니다" },
];

/* 클램프 사양 — 함수 서명과 규약. 구현 소유자는 P5a 이고, **잘라낼 필드 목록은 ⑦에서 파생한다**
   (목록을 여기 다시 적으면 두 곳이 되고, 한쪽만 고쳐지는 순간 샌다). */
const PG_CLAMP = {
  sig: "pgFieldClamp(rec, level) -> rec 사본 — 필드를 **삭제**한다(치환 · 숨김이 아니다)",
  owner: "P5a", levels: ["L1", "L2", "L3", "L4"],
  paths: ["판정 반환값", "추적 지면", "재판정", "반출(표 · 문서)"],
  rules: [
    "잘라낸 필드는 키 자체가 없어야 한다 — null 로 두면 소비자가 「값이 없다」와 「볼 수 없다」를 구별하지 못한다",
    "화면 필터로 구현하지 않는다. 네 경로가 같은 한 곳을 지나야 한다",
    "L2 이하에서 실상호를 잘라낸다. 내부 매핑은 레코드에 남고, 조회는 L1 신원 지면 한 곳뿐이며 그 지면은 반출 대상이 아니다",
    "원가 · 수수료 필드는 L1 반출에만 실린다. 문자열 치환은 보조 수단이다",
    "검증은 세 경로 각각이다 — 한 경로만 확인하면 나머지 둘이 열린 채 통과한다",
  ],
};
const PG_CLAMP_RANK = { L1: 1, L2: 2, L3: 3, L4: 4 };
const PG_CLAMP_AXIS_L3 = ["money", "cost", "fee", "margin", "credit"];

/* ── ⑨ 내보내기 머리말 고지 4줄 ─────────────────────────────────────────────
   반출물은 화면을 떠나 혼자 돌아다니므로 고지가 **데이터 안에** 박혀 있어야 한다.
   네 줄 중 4번은 실명 표기에서 **필수**이고, 없으면 반출 집행 지점이 막는다.
   코드 표기로 내려가면 권고가 되지만 **문구는 지우지 않는다** — 지우면 모드를 올릴 때
   누군가 다시 쓰게 되고, 그때 문안이 달라진다. */
const PG_EXPORT_HEAD = [
  { n: 1, id: "nature", ko: "데이터 성격", owner: "P2 확정",
    text: "거래처 상호는 실제 상호이며, 거래·통제 수치는 시연 시드 데이터입니다." },
  { n: 2, id: "limit", ko: "자기 한계", owner: "P2 확정 · 자기 거버넌스 G-07",
    text: "본 보고서는 통제 정책의 시각화·자가점검 산출물이며, 실제 준수 여부는 법률·보안 검토를 전제합니다." },
  { n: 3, id: "meta", ko: "반출 메타", owner: "P2 확정 · 값은 반출 시점에 채운다",
    text: "반출 일시 · 열람 등급 · 범위 · 정책 버전 · 테이블 해시" },
  { n: 4, id: "nameMode", ko: "표시명 모드 고지", owner: "용어 원천(P1)이 문자 단위로 보유",
    text: "", ref: "PG_EXPORT_NOTICE_TSV / PG_EXPORT_NOTICE_DOC",
    required: "실명 표기에서 필수 — 없으면 반출이 막힌다" },
];

/* 머리말 조립 — 문안의 단일 원천이 흩어지지 않게 **이 함수가 유일한 조립 경로**다.
   표시명 모드 고지는 용어 원천의 상수에서 가져온다(여기에 다시 적지 않는다).
   ⚠ 모듈 최상위가 아니라 **함수 안에서** 읽는다 — 파일 순서가 바뀌면 TDZ 로 번들이 죽는다. */
function pgExportHead(meta, kind) {
  const m = meta || {};
  const doc = kind === "doc";
  const notice = doc
    ? (typeof PG_EXPORT_NOTICE_DOC !== "undefined" ? PG_EXPORT_NOTICE_DOC : "")
    : (typeof PG_EXPORT_NOTICE_TSV !== "undefined" ? PG_EXPORT_NOTICE_TSV : "");
  const req = (typeof pgExportNoticeRequired === "function") ? pgExportNoticeRequired() : true;
  const metaLine = "반출 " + (m.at || "") + " · 열람 " + (m.level || "") + " · 범위 " + (m.scope || "")
    + " · 정책 " + (m.policyVer || "") + " · 해시 " + (m.tableHash || "");
  return {
    lines: [PG_EXPORT_HEAD[0].text, PG_EXPORT_HEAD[1].text, metaLine, notice],
    noticeRequired: req,
    rule: "네 줄이 모두 산출물 첫머리에 들어간다. 부분 선택으로 복사해도 고지가 따라가야 하므로 " +
          "반출 핸들러가 클립보드를 다시 쓴다 — 검증 기준은 렌더가 아니라 **산출물**이다",
  };
}

/* ── ⑩ 온보딩 단계 × 원인의 집행 효과 ──────────────────────────────────────
   단계 값 집합의 원천은 용어 원천의 축 테이블이다(여기서 다시 정의하지 않는다).
   이 표가 정하는 것은 **그 값이 집행에서 무엇을 바꾸는가**다.
   왜 필요한가 — 「확인 못 한 법으로 거래를 끊지 않는다」를 지키면서 「확인한 법 하나로 전건을
   끊는다」로 치환되는 것을 막는 자리다. 증거 미제출은 모집단 거의 전부에서 발생한다. */
const PG_STAGE_EFFECT = [
  { cause: "law_unverified", stage: "*", block: false, level: "advisory", remedy: false,
    render: "법령 미확인 — 집행 보류", why: "확인하지 못한 법으로는 어떤 집행 지점에서도 차단하지 않는다. 집계만 한다" },
  { cause: "input_missing", stage: "신규등록신청", block: true, level: "soft", remedy: true,
    needs: "근거 법령의 확인 등급이 「원문확인」일 때만", render: "증거 미제출 — 판정 불가",
    why: "등록 심사 단계에서는 증거 없이 통과시킬 수 없다. 단 면제 경로가 있는 수준까지다" },
  { cause: "input_missing", stage: "거래중", block: false, level: "advisory", remedy: true,
    render: "증거 미제출 — 시정 과제", why: "이미 거래 중인 협력업체의 미제출은 시정 과제이지 거래 중단 사유가 아니다" },
  { cause: "input_missing", stage: "갱신", block: false, level: "advisory", remedy: true,
    render: "증거 미제출 — 갱신 전 보완 요구", open: "갱신 단계에서 차단할지는 열린 항목이다 — 확정 전까지 차단하지 않는다",
    why: "갱신은 신규 등록이 아니다. 차단으로 두면 기한 도래만으로 거래가 끊긴다" },
  { cause: "engine_error", stage: "*", block: false, level: "advisory", remedy: false,
    render: "판정 오류", why: "차단하지 않고 운영 알림으로 보낸다 — 판정기 결함으로 남의 거래를 끊지 않는다" },
  { cause: "kind_mismatch", stage: "*", block: false, level: null, remedy: false,
    render: "해당 없음", why: "분모에서 제외한다. 미매칭은 위반이 아니다" },
  { cause: "not_yet_effective", stage: "*", block: false, level: null, remedy: false,
    render: "시행 전 — 시행일 도래 시 자동 적용", why: "「해당 없음」과 섞으면 시행일이 와도 사전 대비 목록에 없다. 별 목록으로 집계한다" },
  { cause: "rule_violation", stage: "*", block: true, level: "표에 지정된 수준", remedy: true,
    render: "위반", why: "집행 수준은 조항 본문이 아니라 배포 테이블이 정한다" },
  { cause: "*", stage: "*", grace: true, block: false, level: "advisory(상한)", remedy: true,
    render: "법정 의무이나 소관 부처 집행 유예 중", why: "제재 수준과 집행 현실에 비례해 상한을 내린다" },
];

/* 현 시연 모집단의 집행 기대값 — 러너가 「전면 차단이 설계 의도인지 사고인지」를 구분할 수 있어야 한다.
   어긋나면 전면 차단 사고로 간주한다. */
const PG_PEP_EXPECT = [
  { pep: "pep.register", expect: 0, why: "모집단 전원이 계약 보유 상태라 신규등록신청 건이 없다" },
  { pep: "pep.settle", expect: 0, why: "경고 · 기록 상한이 코드로 고정돼 있다" },
  { pep: "pep.expose", expect: 0, why: "같다" },
  { pep: "pep.export", expect: "심은 건수만", why: "고지 애블레이션으로 일부러 발생시킨 건수만 센다" },
];

/* ── ⑪ 추적 5레인 지면 ──────────────────────────────────────────────────── */
const PG_TRACE_LANES = [
  { n: 1, ko: "입력", from: "pgDecide:inputRefs", shows: "쓰인 필드명 · 값 · 출처 배지 · 수집 시각",
    rule: "쓰이지 않은 필드도 회색으로 존재를 보여준다 — 숨기면 있는 줄 모른다. 실상호 원 필드는 싣지 않고 식별자와 표시명 한 칸만 둔다" },
  { n: 2, ko: "조항", from: "pgDecide:ruleRef", shows: "조항 id · 표제 · 축 · 판정 대상 · 생애주기 · 근거 법령 · 조항 시행일 · 확인 등급",
    rule: "확인 등급이 「원문확인」이 아니면 조문 번호와 표준 통제 번호를 찍지 않고 「조문 미확인」을 적는다. 조항 전체가 회색이 된다" },
  { n: 3, ko: "판정", from: "pgDecide:reasons", shows: "결정 4값 · 원인 배지 · 사유 문장 그대로",
    rule: "사유는 화면이 쓰는 게 아니라 판정기가 쓴 것이다" },
  { n: 4, ko: "집행", from: "pgDecide:enforce", shows: "집행 수준 · 집행 지점 · 온보딩 단계 · 차단 이력 · 면제 · 통지 · 소명 · 재심 · 제재 축 · 집행 유예",
    rule: "막힌 게 없으면 「막은 것 없음」이라고 적는다. 차단 건수는 전용 로그에서 읽는다" },
  { n: 5, ko: "시정 + 재판정", from: "pgDecide:whatIf", shows: "필요한 증거 · 제출물 · 기한 · 소유자 · 의무/권고 · 재판정 결과",
    rule: "재판정은 같은 판정기를 한 번 더 호출한다. 별도 추정 로직 금지 — 같은 함수여야 거짓말을 하지 않는다" },
];

/* ── ⑫ 추적 지면 규약 5줄 (P5b) ──────────────────────────────────────────────
   「과정이 보이게」가 지면 장식이 아니게 하는 다섯 줄이다. 각 줄에 **검사 소유자**를 적는다 —
   규약만 적고 검사를 적지 않으면 그 규약은 다음 세션에 사라진다. */
const PG_TRACE_RULE = [
  { n: 1, ko: "반환 필드만 렌더한다", owner: "run_pg_scan 단언 21-c",
    rule: "레인에 찍히는 모든 칸은 pgDecide 반환 필드다. 화면이 사유 문장이나 수치를 새로 만들면 어느 가드도 통과하지 않는다(협주 규약과 같은 사상)" },
  { n: 2, ko: "안 쓰인 입력도 보여준다", owner: "run_pg_scan 단언 21-d",
    rule: "쓰이지 않은 입력을 숨기면 있는 줄 모른다. 레인 1이 쓴 것과 안 쓴 것을 같은 목록에 두고 흐리게만 구분한다" },
  { n: 3, ko: "원장을 바꾸지 않는다", owner: "run_pg_scan 단언 21-e",
    rule: "재판정은 가정 레코드로 판정기를 다시 부르는 일이고, 거래 사실 · 제출물 · 면제 · 집행 로그 · 조항 테이블은 그대로다. 지문을 전후로 떠서 같음을 증명한다" },
  { n: 4, ko: "같은 입력이면 같은 추적이다", owner: "run_pg_scan 단언 21-f",
    rule: "두 번 부른 결과가 바이트 단위로 같아야 한다. 벽시계 · 난수 · 정렬 셔플을 쓰지 않는다" },
  { n: 5, ko: "양방향으로 잇는다", owner: "run_pg_scan 단언 21-g",
    rule: "조항 → 판정 → 증거의 어느 쪽에서 들어와도 나머지 둘로 갈 수 있다. 결론과 근거가 두 지면으로 갈리면 과정이 보이지 않는다" },
];

/* ── ⑬ What-if 가정 축 (P5b) ────────────────────────────────────────────────
   ★ **값을 합성하지 않는다.** 가정은 두 종류뿐이다 — ⓐ판정기 자신이 만든 가정 레코드(전건 제출)와
     ⓑ호출 맥락(ctx) 축. 제출값을 화면 쪽에서 하나씩 지어내면 그것이 「별도 추정 로직」이고,
     같은 조항이 두 곳에서 다른 가정으로 재판정된다(§11-2 레인 5 · §13-8 검증).
   from 은 PG_SRC 접두사를 따른다 — 가정 재판정도 반환 필드다. */
const PG_WHATIF_AXES = [
  { k: "evidence", ko: "증거 전건 제출 가정", from: "pgDecide:whatIf",
    how: "판정기가 선언된 입력을 전건 채운 가정 레코드로 스스로 재호출한 결과를 그대로 싣는다",
    when: "원인이 「증거 미제출」일 때만 산출된다 — 그 외에는 가정할 것이 없다",
    answers: "무엇을 제출하면 등급이 올라가는가" },
  { k: "stage", ko: "온보딩 단계 가정", from: "pgDecide:enforce",
    how: "같은 레코드 · 같은 조항으로 ctx.stage 만 바꿔 다시 부른다",
    when: "항상", answers: "같은 미제출이 등록 심사 단계에서는 무엇을 막는가" },
  { k: "kind", ko: "협력업체 유형 가정", from: "pgDecide:ruleRef",
    how: "같은 레코드 · 같은 조항으로 ctx.kind 만 바꿔 다시 부른다",
    when: "항상", answers: "이 조항이 어느 유형에 닿고 어느 유형에서 해당 없음인가" },
];
/* **하지 않는 가정** — 지면에 함께 적는다. 적지 않으면 「왜 그 가정은 없나」가 설계 누락으로 읽힌다. */
const PG_WHATIF_FORBID = [
  { k: "verified", ko: "근거 법령 확인 등급 상향 가정",
    why: "레지스트리를 바꾸는 일이다. 확인 등급은 1차 출처를 사람이 확인한 사실이고, 가정으로 올리면 하드 플로어가 가정 위에서 풀린다" },
  { k: "enforce", ko: "집행 수준 상향 가정",
    why: "집행 수준의 원천은 배포 테이블이고 하향 · 무근거 승격은 코드가 거부한다. 화면이 가정으로 올리면 ratchet 을 지면에서 우회하는 셈이 된다" },
  { k: "exempt", ko: "면제 등재 가정",
    why: "면제는 사유 · 승인자 · 만료일을 갖춘 승인 절차의 산물이다. 가정으로 등재하면 결정이 뒤집히면서 정책 해시도 움직인다" },
  { k: "fieldValue", ko: "제출값 개별 생성",
    why: "판정기 밖에서 값을 지어내면 두 번째 추정 로직이 된다. 개별 축의 답은 가정이 아니라 **쓰이지 않은 입력 목록과 시정 과제**가 돌려준다" },
];

/* ── ⑭ 정책 · 판정 엔진 지면 7블록 (P5b · 지시서 §13-8 산출물 ①) ───────────
   ★ 보고서 블록(PG_BLOCKS)과 **다른 표**다. 섞으면 4유형 × 7블록 행렬이 엔진 블록 칸을 요구하고
     (유형별 보고서는 엔진 지면을 싣지 않는다) 수치 전수 검사의 분모가 어긋난다.
   from 은 PG_SRC 접두사를 따른다 — 엔진 지면도 「화면이 계산한다」는 경로가 없다. */
const PG_ENGINE_BLOCKS = [
  { id: "E1", ko: "정책 레지스트리", asks: "어떤 조항이 있고 각 조항은 무엇을 보는가", from: "policy:PG_POLICIES",
    items: ["조항 id · 표제 · 통제군", "판정 대상(협력업체 / 당사)", "생애주기", "결함 등급 · 의무/권고 · 주기",
            "근거 법령 · 확인 등급", "집행 수준 · 잠금 · 유예", "결정 분포", "이 조항이 영향을 주는 협력업체 N곳 → 판정표 열"] },
  { id: "E2", ko: "법령 · 표준 시행일표", asks: "그 조항이 기대는 법령은 언제부터 효력이 있는가", from: "policy:PG_LAWS",
    items: ["정식 명칭 · 성질", "조문별 확인 등급", "조문별 시행일", "현행 법령 버전", "제재 축", "집행 유예",
            "당사도 수범자인가", "조문 번호는 원문확인일 때만 인쇄", "이 법령에 기대는 조항 목록"] },
  { id: "E3", ko: "집행 테이블", asks: "그 판정이 어느 지점에서 무엇을 막는가", from: "policy:PG_ENFORCE",
    items: ["조항 × 집행 지점 격자", "배포 선언 수준", "지점 상한", "실효 수준", "무엇이 수준을 내렸는가(플로어 이름)",
            "집행 지점 4곳의 자리 · 막는 것 · 소비자", "지점별 차단 기대값과 실측"] },
  { id: "E4", ko: "면제 현황", asks: "무엇이 면제로 지나고 있고 언제 끝나는가", from: "policy:PG_EXEMPT",
    items: ["조항 · 대상 · 사유 · 승인자 · 만료일", "만료 임박(적색) · 만료 경과(자동 차단 복귀)",
            "만료일 없는 면제는 등록 거부", "잠금 조항은 면제 불가", "면제로 통과한 건수(전용 로그)", "0건이면 「면제 없음」"] },
  { id: "E5", ko: "결정 로그", asks: "실제로 무엇이 막혔고 누가 판정했는가", from: "log:hifin_pg_block",
    items: ["어느 조항 · 어느 지점 · 어느 원인 · 누구(코드 표기)", "차단과 면제 통과를 가른 집계",
            "행위자 유형(임직원 / 협력업체 주체 / 판정기)", "사유 문장은 로그에 싣지 않는다 — 판정기가 보유한다",
            "로그 항목 → 그 판정의 추적 지면", "0건이면 「기록 없음」"] },
  { id: "E6", ko: "예정 적용 조항", asks: "아직 시행 전인 조항은 무엇이고 언제 켜지는가", from: "pgDecide:cause",
    items: ["시행 전 조항 목록", "조항 시행일", "도래 시 자동 적용", "「해당 없음」과 섞지 않는다",
            "제재 축 · 집행 유예 동반 표기", "근거 법령 미확인으로 보류된 조항은 별 목록"] },
  { id: "E7", ko: "방법론", asks: "이 판정은 어떤 규약으로 만들어졌는가", from: "spec:PG_NUM_RULE",
    items: ["수치 정의 7규약", "준수율 분모 규약", "허용 원천 접두사", "하드 플로어", "단계 × 원인 집행 효과",
            "열람 등급 클램프 규약", "추적 지면 규약 5줄", "What-if 가정 축과 하지 않는 가정", "결정론 전제"] },
];

/* 엔진 지면의 수치 정의 — 보고서 수치(PG_METRICS)와 같은 형식 · 같은 검사 규칙을 쓴다.
   표를 따로 두는 이유는 블록 축이 다르기 때문뿐이고, 규칙을 느슨하게 하려는 것이 아니다. */
const PG_ENGINE_METRICS = [
  { id: "e1.policyN", block: "E1", ko: "조항 수", def: "레지스트리에 등재된 조항 전수",
    from: "policy:PG_POLICIES.length", absent: "—", grade: "REAL" },
  { id: "e1.affected", block: "E1", ko: "영향받는 협력업체 수", def: "그 조항이 판정을 낸 협력업체 행 수",
    from: "pgDecide:cells", absent: "판정이 서지 않은 조항은 0이 아니라 「판정 없음」", grade: "DEMO" },
  { id: "e1.decisionMix", block: "E1", ko: "조항별 결정 분포", def: "허용 · 불허 · 보류 · 해당 없음 건수",
    from: "pgDecide:decision", absent: "—", grade: "DEMO" },
  { id: "e2.lawN", block: "E2", ko: "법령 · 표준 수", def: "레지스트리에 등재된 항목 전수",
    from: "policy:PG_LAWS", absent: "—", grade: "REAL" },
  { id: "e2.verifiedMix", block: "E2", ko: "확인 등급 비중", def: "원문확인 · 부분확인 · 미확인 건수",
    from: "policy:lawVerified", absent: "—", grade: "REAL" },
  { id: "e2.articleShown", block: "E2", ko: "조문 번호가 인쇄되는 조문 수", def: "확인 등급 게이트를 지난 조문 수",
    from: "policy:lawRender", absent: "게이트를 지나지 않으면 「조문 미확인」만 적는다", grade: "REAL" },
  { id: "e3.level", block: "E3", ko: "실효 집행 수준", def: "조항 × 지점의 플로어 적용 후 수준",
    from: "policy:enforceLevel", absent: "—", grade: "REAL" },
  { id: "e3.floors", block: "E3", ko: "수준을 내린 플로어", def: "무엇이 수준을 내렸는지의 이름 목록",
    from: "policy:enforceLevel.floors", absent: "내린 것이 없으면 「상한에 걸린 것 없음」", grade: "REAL" },
  { id: "e3.blocked", block: "E3", ko: "지점별 차단 건수", def: "전용 로그에서 읽은 실측 건수",
    from: "log:hifin_pg_block", absent: "0이면 「막은 것 없음」", grade: "REAL" },
  { id: "e4.exemptN", block: "E4", ko: "면제 등재 수", def: "유효 · 임박 · 경과로 가른 건수",
    from: "policy:PG_EXEMPT", absent: "0건이면 「면제 없음」", grade: "REAL" },
  { id: "e4.exemptPass", block: "E4", ko: "면제로 통과한 건수", def: "차단이 면제로 풀린 기록 수",
    from: "log:hifin_pg_block", absent: "0이면 「면제로 지난 것 없음」", grade: "REAL" },
  { id: "e5.logN", block: "E5", ko: "결정 로그 건수", def: "차단 · 면제 통과 · 감사 기록 수",
    from: "log:hifin_pg_block", absent: "0이면 「기록 없음」", grade: "REAL" },
  { id: "e5.actorMix", block: "E5", ko: "행위자 유형 분포", def: "임직원 · 협력업체 주체 · 판정기",
    from: "log:hifin_pg_block", absent: "로그가 비면 「기록 없음」", grade: "REAL" },
  { id: "e6.notYetN", block: "E6", ko: "예정 적용 조항 수", def: "시행 전 원인으로 비해당 처리된 조항 수",
    from: "pgDecide:cause", absent: "—", grade: "REAL" },
  /* ★ 법령 축을 조항 축과 **같은 분모에 넣지 않는다**(2026-10-26 신설). 원문확인 등급의 미도래 개정이
     레지스트리에 있는데 조항 축에서만 세면 지면이 「시행 예정 조항 없음」으로 단정한다. */
  { id: "e6.pendingLawN", block: "E6", ko: "조문 사정권 확인 대기 법령 수", def: "미도래 개정이 등재됐으나 어느 조문을 바꾸는지가 미확인인 법령 수 — 판정에 쓰지 않는다",
    from: "policy:pgLawRender().pendingAmend", absent: "—", grade: "REAL",
    renderRule: "조항 축(e6.notYetN)과 같은 줄에 적지 않는다. 「조항 N건 · 법령 M건」으로 가른다" },
  { id: "e7.ruleN", block: "E7", ko: "규약 항목 수", def: "수치 정의 · 분모 · 원천 · 플로어 · 집행 효과 · 클램프 · 추적 규약의 항목 수",
    from: "spec:PG_NUM_RULE", absent: "—", grade: "REAL" },
];

/* 지면 규약 상수 — **판정 임계가 아니다.** 통제 임계(PG_THRESH)는 정책 파일이 단독 소유하고
   그 파일 밖에 리터럴로 나타나면 러너가 실패한다. 여기 있는 것은 면제 만료를 적색으로 칠하는
   **표시 기준**과 격자 묶음 폭이고, 판정에 들어가지 않는다. */
const PG_ENGINE_RULE = {
  warnMonths: 1,                  /* 만료까지 남은 개월 수가 이 값 이하면 적색 — 표시 기준 */
  gridCols: 3,                    /* 집행 격자의 지점 열 수(조항 지점 3곳) — 반출 지점은 별 행이다 */
  logPage: 20,
  why: "만료 임박은 표시 기준이고 판정 임계가 아니다. 판정 임계를 지면 파일에 두면 두 곳이 된다",
};

/* 하드 플로어 — §6-3 의 네 줄. **규약 선언**이고, 실제로 적용된 플로어는
   pgEnforceLevel().floors 반환 필드가 돌려준다(화면은 둘을 나란히 렌더한다).
   왜 선언을 두는가: 플로어가 걸리지 않은 조항에서는 반환 필드가 비어 있어, 「플로어가 없다」와
   「플로어 규약 자체가 사라졌다」가 구별되지 않는다. 선언이 그 분모다. */
const PG_FLOOR = [
  { cond: "근거 법령 · 표준의 확인 등급이 「원문확인」이 아니다", result: "불허를 낼 수 없다 — 판정 보류 + 원인 「근거 법령 미확인」",
    why: "확인하지 못한 법으로 위반을 적지 않는다" },
  { cond: "조항 시행일이 null 이다", result: "같다",
    why: "추정 시행일을 넣지 말고 비워 두면 코드가 알아서 거부한다 — 미확인은 결함이 아니라 설계된 상태다" },
  { cond: "조항 시행일이 아직 도래하지 않았다", result: "해당 없음 + 원인 「시행 전」 — 「예정 적용 조항」으로 별도 집계",
    why: "「해당 없음」과 섞으면 시행일이 와도 사전 대비 목록에 없다" },
  { cond: "조항이 잠금 상태다", result: "어떤 집행 수준으로도 열리지 않는다",
    why: "법률 검토 회신 전까지 경고 · 기록만이다. 관리자 전환으로도 뚫리지 않는다" },
];

function pgEngineBlock(id) { for (const b of PG_ENGINE_BLOCKS) if (b.id === id) return b; return null; }
function pgEngineMetric(id) { for (const m of PG_ENGINE_METRICS) if (m.id === id) return m; return null; }
function pgEngineMetricsOf(block) { return PG_ENGINE_METRICS.filter((m) => m.block === block); }

/* 엔진 지면 · 추적 규약 전수 검사 — 보고서 쪽 검사와 같은 규칙이다(느슨하게 두지 않는다). */
function pgEngineAudit() {
  const bad = [];
  const prefixes = PG_SRC.map((s) => s.p);
  const blocks = PG_ENGINE_BLOCKS.map((b) => b.id);
  const seenB = {};
  for (const b of PG_ENGINE_BLOCKS) {
    if (seenB[b.id]) bad.push({ id: b.id, why: "엔진 블록 id 중복" });
    seenB[b.id] = 1;
    if (!b.asks) bad.push({ id: b.id, why: "이 블록이 답하는 질문이 비었다 — 질문 없는 블록은 지면이 아니라 제목이다" });
    if (!b.items || !b.items.length) bad.push({ id: b.id, why: "반드시 들어가는 것이 비었다" });
    if (!b.from) { bad.push({ id: b.id, why: "원천 경로가 비었다" }); continue; }
    if (!prefixes.filter((p) => b.from.indexOf(p) === 0).length) bad.push({ id: b.id, why: "허용 원천 접두사 밖 — " + b.from });
    if (b.from.indexOf("fin:") === 0) bad.push({ id: b.id, why: "엔진 지면은 재무 계획 모델을 읽지 않는다" });
  }
  const seenM = {};
  for (const m of PG_ENGINE_METRICS) {
    if (seenM[m.id]) bad.push({ id: m.id, why: "수치 id 중복" });
    seenM[m.id] = 1;
    if (pgMetric(m.id)) bad.push({ id: m.id, why: "보고서 수치표와 id 가 겹친다 — 같은 수치가 두 표에 산다" });
    if (blocks.indexOf(m.block) < 0) bad.push({ id: m.id, why: "엔진 블록 밖 수치 — " + m.block });
    if (!m.from) { bad.push({ id: m.id, why: "원천 경로가 비었다 — 지면에 설 수 없다" }); continue; }
    if (!prefixes.filter((p) => m.from.indexOf(p) === 0).length) bad.push({ id: m.id, why: "허용 원천 접두사 밖 — " + m.from });
    if (!m.absent) bad.push({ id: m.id, why: "미제출 처리가 비었다 — 0으로 적히는 자리가 된다" });
    if (!m.grade) bad.push({ id: m.id, why: "출처 등급이 비었다" });
  }
  for (const b of blocks) if (!pgEngineMetricsOf(b).length) bad.push({ id: b, why: "수치 정의가 없는 엔진 블록" });
  /* 추적 규약 — 다섯 줄 전부에 검사 소유자가 있어야 한다. 소유자 없는 규약은 다음 세션에 사라진다 */
  for (const r of PG_TRACE_RULE) {
    if (!r.owner) bad.push({ id: "trace/" + r.n, why: "검사 소유자가 비었다 — 규약만 적고 검사를 적지 않았다" });
    if (!r.rule) bad.push({ id: "trace/" + r.n, why: "규약 본문이 비었다" });
  }
  if (PG_TRACE_RULE.length !== PG_TRACE_LANES.length)
    bad.push({ id: "PG_TRACE_RULE", why: "규약 줄 수와 레인 수가 다르다 — 레인마다 지킬 것이 정해져야 한다" });
  /* What-if — 가정 축이 전부 반환 필드에서 오는가 · 하지 않는 가정에 사유가 있는가 */
  for (const a of PG_WHATIF_AXES) {
    if (!a.from || !prefixes.filter((p) => a.from.indexOf(p) === 0).length) bad.push({ id: "whatIf/" + a.k, why: "가정 축의 원천 경로가 허용 접두사 밖 — " + a.from });
    if (!a.how || !a.answers) bad.push({ id: "whatIf/" + a.k, why: "가정 방법 또는 답하는 질문이 비었다" });
  }
  if (!PG_WHATIF_FORBID.filter((f) => f.k === "fieldValue").length)
    bad.push({ id: "PG_WHATIF_FORBID", why: "제출값 개별 생성 금지가 사라졌다 — 그것이 「별도 추정 로직 금지」의 실체다" });
  for (const f of PG_WHATIF_FORBID) if (!f.why) bad.push({ id: "whatIfForbid/" + f.k, why: "하지 않는 사유가 비었다 — 무사유 금지는 설계 누락과 구별되지 않는다" });
  /* 하드 플로어 선언 — 네 줄이 §6-3 그대로인가 */
  if (PG_FLOOR.length !== 4) bad.push({ id: "PG_FLOOR", why: "하드 플로어가 4줄이 아니다" });
  for (const f of PG_FLOOR) if (!f.cond || !f.result || !f.why) bad.push({ id: "PG_FLOOR", why: "조건 · 결과 · 사유 중 빈 칸이 있다" });
  /* 지면 규약 상수가 통제 임계를 품지 않았는가 — 품으면 임계가 두 곳에 산다 */
  const th = (typeof PG_THRESH !== "undefined") ? Object.keys(PG_THRESH) : [];
  for (const k of Object.keys(PG_ENGINE_RULE)) if (th.indexOf(k) >= 0) bad.push({ id: "PG_ENGINE_RULE." + k, why: "통제 임계 키와 겹친다 — 임계의 소유자는 정책 파일 하나다" });
  /* 죽은 문안 — 지면이 선 뒤에도 「다음 단계의 …」가 남아 있으면 가드의 바닥을 메운다.
     ★ P7 에서 패턴을 넓혔다: 종전 검사는 「산출물」이라는 낱말까지 맞아야 잡혔고, 실제로 남아 있던
       죽은 문안은 「… 열람 기록은 **다음 단계의 작업 항목**입니다」라서 **검출되지 않았다**.
       「다음 단계의」로 시작하는 예고는 전부 그 지면이 서는 순간 거짓이 된다. */
  for (const k of Object.keys(PG_DECL)) if (/다음 단계의/.test(String(PG_DECL[k])))
    bad.push({ id: "PG_DECL." + k, why: "지면이 선 뒤에 남은 죽은 문안 — 렌더되지 않는 문구가 검사의 바닥을 메운다" });
  return bad;
}

/* ── 조회 · 자기 검사 ───────────────────────────────────────────────────────
   러너가 지면을 사람 눈으로 세지 않게 한다. 아래 세 함수가 P2 의 검증 항목을 수치로 돌려준다. */

function pgBlock(id) { for (const b of PG_BLOCKS) if (b.id === id) return b; return null; }
function pgMetric(id) { for (const m of PG_METRICS) if (m.id === id) return m; return null; }
function pgMetricsOf(block) { return PG_METRICS.filter((m) => m.block === block); }
function pgInputsOf(id) { for (const p of PG_INPUTS) if (p.id === id) return p; return null; }

/* 제출 필드 사전의 발주서 — P4 가 이 키 집합을 사전으로 세우고, 사전 밖 필드는 존재하지 않는다. */
function pgSubmitKeys() {
  const out = [];
  for (const p of PG_INPUTS) for (const i of p.inputs) if (i.obj === "submit" && out.indexOf(i.k) < 0) out.push(i.k);
  return out.sort();
}
/* 법령 레지스트리 키 — P3 가 이 키를 전부 등재해야 조항 고아가 0이 된다. */
function pgLawRefs() {
  const out = [];
  for (const p of PG_INPUTS) if (p.lawRef && out.indexOf(p.lawRef) < 0) out.push(p.lawRef);
  for (const g of PG_SELF_GOV) if (g.lawRef && out.indexOf(g.lawRef) < 0) out.push(g.lawRef);
  return out.sort();
}
/* 출처 등급 비중 — 화면이 세지 않는다. */
/* ★ 미도래 개정 목록 — **단일 소유자**다(2026-10-26 신설). 조항 축(notYet)과 섞지 않는다.
   판정에 쓰지 않고 표시만 한다. B7 · E6 · 추적 레인 2 가 **이 함수의 반환 필드**를 렌더한다 —
   두 지면이 각자 레지스트리를 훑으면 한쪽만 고쳐지는 순간 「없다」와 「1건」이 동시에 인쇄된다. */
function pgPendingAmends() {
  const out = [];
  try {
    if (typeof PG_LAWS === "undefined") return out;
    for (const id of Object.keys(PG_LAWS)) {
      const L = PG_LAWS[id], pa = L && L.pendingAmend;
      if (!pa) continue;
      out.push({ id: id, name: L.name, lawNo: pa.lawNo || null, kind: pa.kind || null,
        promulgated: pa.promulgated || null, effectiveDate: pa.effectiveDate || null,
        verified: pa.verified || "미확인", scope: pa.scope || "미확인", source: pa.source || null,
        render: PG_DECL.pendingAmend });
    }
  } catch (e) {}
  return out;
}
/* 미도래 **법령 시행일** — 항목 수준 시행일이 기준일보다 뒤인 법령. 조항 축과 다른 축이다. */
function pgFutureLaws(asOf) {
  const out = [];
  try {
    if (typeof PG_LAWS === "undefined") return out;
    for (const id of Object.keys(PG_LAWS)) {
      const L = PG_LAWS[id];
      if (L && L.effectiveDate && asOf && L.effectiveDate > asOf)
        out.push({ id: id, name: L.name, effectiveDate: L.effectiveDate, render: PG_DECL.effPlanned });
    }
  } catch (e) {}
  return out;
}

/* ★ 이 함수가 세는 분모는 **출처 등급 할당표(PG_SOURCE_MAP)** 다 — 보고서 지표가 아니다(2026-10-26 명시).
   왜 적어 두는가: B1 의 라벨이 「출처 등급 비중」이어서 **보고서 내용물의 출처 비중**으로 읽혔다.
   실측: 「실원천 21 · 시연 시드 파생 20 · 미제출 20 / 전체 61」인데 그 61은 할당표 항목 수이고
   보고서 지표 집합(PG_METRICS)과 **다른 집합**이다. 같은 지면의 B3 실적은 전건 「시연 시드 파생」
   배지이고 B4 판정은 판정된 칸이 일부뿐이라, 「실원천 ≈ 3분의 1」로 읽히는 것은 다른 질문의 답이었다.
   그래서 ⓐ이 함수의 분모 이름을 반환 필드로 돌려주고 ⓑ지표 축 비중을 별 함수로 세운다. */
function pgGradeMix() {
  const mix = { REAL: 0, DEMO: 0, ABSENT: 0, usable: 0, pending: 0 };
  for (const f of PG_SOURCE_MAP) {
    if (mix[f.grade] != null) mix[f.grade] += 1;
    if (f.usable) mix.usable += 1; else mix.pending += 1;
  }
  mix.total = PG_SOURCE_MAP.length;
  mix.axis = "출처 등급 할당표(PG_SOURCE_MAP)";
  return mix;
}
/* 보고서 **지표 축**의 출처 등급 비중 — B1 이 할당표 비중과 **나란히** 적는다(두 질문의 답이 다르다) */
function pgMetricGradeMix() {
  const mix = { REAL: 0, DEMO: 0, ABSENT: 0, total: 0, axis: "보고서 지표 사전(PG_METRICS)" };
  for (const m of PG_METRICS) { if (mix[m.grade] != null) mix[m.grade] += 1; mix.total += 1; }
  return mix;
}
/* 두 분모의 이름을 한 자리에 모아 둔다 — 지면이 어느 집합을 세는지 글자로 말하게 한다 */
function pgSourceAxisMix() {
  return { fields: pgGradeMix(), metrics: pgMetricGradeMix() };
}
/* 등급별로 잘라낼 필드 — 목록은 출처 등급 할당표에서 파생한다(두 곳에 두지 않는다). */
function pgClampDrop(level) {
  const rank = PG_CLAMP_RANK[level] || 1;
  const out = [];
  for (const f of PG_SOURCE_MAP) {
    let cut = false;
    if (f.clampFrom && rank >= (PG_CLAMP_RANK[f.clampFrom] || 9)) cut = true;
    if (rank >= 3 && PG_CLAMP_AXIS_L3.indexOf(f.axis) >= 0) cut = true;   /* 소명면 이하 — 금액 축 일체 */
    if (rank >= 4 && (f.axis === "id" || f.axis === "name")) cut = true;   /* 대외 — 개별 식별 일체 */
    if (cut && out.indexOf(f.k) < 0) out.push(f.obj + "." + f.k);
  }
  return out.sort();
}

/* ══ 클램프 구현 — **삭제**한다(치환 · 숨김이 아니다). 목록의 소유자는 위의 pgClampDrop 이다 ══
   ★ 왜 P5a 를 기다리지 않고 지금 세우는가: 모드 스위치 실효성 단언(§13-6 단언 16-ⓒ · §4-6-2)이
     「코드 표기로 내려도 `partnerId` → `legalName` 매핑이 **L1 경로로** 조회 가능」을 요구하는데,
     그 L1 경로가 함수로 존재하지 않으면 러너가 **자기가 방금 넣은 리터럴을 다시 세는** 자기충족
     단언이 된다(실측으로 확인: 구현을 어떻게 바꾸든 통과했다). 없는 경로를 로컬 리터럴로
     대신 세면 단언이 사라진 것과 같다 — 그래서 조회 경로를 먼저 세운다.
   ★ 규약 — 잘라낸 필드는 **키 자체가 없다.** null 로 두면 소비자가 「값이 없다」와 「볼 수 없다」를
     구별하지 못한다(PG_CLAMP.rules 1). 원본을 변형하지 않는다(사본을 돌려준다).
   ★ 결정론 — 깊은 복사는 키 순서를 보존하는 얕은 사본 재귀다. 정렬을 끼우지 않는다. */
function _pgCloneRec(v) {
  if (Array.isArray(v)) return v.map(_pgCloneRec);
  if (v !== null && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = _pgCloneRec(v[k]); return o; }
  return v;
}
/* 객체 축 → 레코드 안의 자리. 판정기의 접근자(g)와 **같은 사상**이다 — partner 축은 레코드 자신이다. */
function _pgBag(rec, obj) {
  const bag = { submit: rec.submit, license: rec.licenses, site: rec.manufacturingSites,
    evidence: rec.evidence, published: rec.published, vendor: rec.vendor, contract: rec.contract,
    product: rec.products, order: rec.orders, shipment: rec.shipments, rollup: rec.rollup,
    self: rec.self, ops: rec.ops, partner: rec };
  return bag[obj];
}
function pgFieldClamp(rec, level) {
  if (!rec || typeof rec !== "object") return rec;
  const out = _pgCloneRec(rec);
  const cut = pgClampDrop(level);
  const dropped = [];
  for (const path of cut) {
    const i = String(path).indexOf(".");
    if (i < 0) continue;
    const obj = path.slice(0, i), k = String(path.slice(i + 1)).replace(/\[\]$/, "");
    const tgt = _pgBag(out, obj);
    if (!tgt) continue;
    const rows = Array.isArray(tgt) ? tgt : [tgt];
    for (const row of rows) {
      if (row === null || typeof row !== "object") continue;
      if (k.indexOf(".") >= 0) {                       /* 중첩 경로(예: cell.*)는 머리 칸을 지운다 */
        const head = k.split(".")[0];
        if (head in row) { delete row[head]; dropped.push(obj + "." + head); }
        continue;
      }
      if (k === "*") { for (const kk of Object.keys(row)) delete row[kk]; dropped.push(obj + ".*"); continue; }
      if (k in row) { delete row[k]; dropped.push(path); }
    }
  }
  out._clamp = { level: level, dropped: dropped };
  return out;
}
/* L1 신원 조회 — **이것이 「L1 경로」다.** 코드 표기 모드에서도 역추적이 되는지를 러너가
   이 함수로 확인한다. 반출 대상이 아니다(§4-6-2) — 그래서 반출 열 목록에 legalName 이 없다. */
function pgIdentityLookup(rec) {
  const c = pgFieldClamp(rec, "L1");
  if (!c || typeof c !== "object") return null;
  return { partnerId: c.partnerId || null, legalName: c.legalName || null, level: "L1" };
}

/* ★ 역추적 전수 검사 — 「화면이 자체 계산하는 숫자는 0건」을 **코드가 말할 수 있게** 한다.
   이 함수가 0을 돌려주지 않으면 그 지면은 설 수 없다. P3 · P4 러너가 이것을 그대로 읽는다. */
function pgMetricAudit() {
  const bad = [];
  const seen = {};
  const prefixes = PG_SRC.map((s) => s.p);
  const blocks = PG_BLOCKS.map((b) => b.id);
  for (const m of PG_METRICS) {
    if (seen[m.id]) bad.push({ id: m.id, why: "수치 id 중복" });
    seen[m.id] = 1;
    if (blocks.indexOf(m.block) < 0) bad.push({ id: m.id, why: "블록 밖 수치 — " + m.block });
    if (!m.from) { bad.push({ id: m.id, why: "원천 경로가 비었다 — 지면에 설 수 없다" }); continue; }
    const hit = prefixes.filter((p) => m.from.indexOf(p) === 0);
    if (!hit.length) bad.push({ id: m.id, why: "허용 원천 접두사 밖 — " + m.from });
    if (m.from.indexOf("fin:") === 0 && m.id !== PG_SRC_FIN_ONLY)
      bad.push({ id: m.id, why: "재무 계획 모델은 대조 1곳에서만 읽는다 — 두 장부가 섞인다" });
    if (m.denom && !PG_DENOM[m.denom]) bad.push({ id: m.id, why: "분모 규약 키가 없다 — " + m.denom });
    if (!m.absent) bad.push({ id: m.id, why: "미제출 처리가 비었다 — 0으로 적히는 자리가 된다" });
    if (!m.grade) bad.push({ id: m.id, why: "출처 등급이 비었다" });
  }
  /* 블록마다 수치가 하나는 있어야 한다 — 빈 블록은 지면이 아니라 제목이다 */
  for (const b of blocks) if (!pgMetricsOf(b).length) bad.push({ id: b, why: "수치 정의가 없는 블록" });
  return bad;
}

/* 지면 · 계약 전수 검사 — 블록 행렬 · 조항 축 · 입력 객체 · 단계 축의 고아를 센다. */
function pgReportAudit() {
  const bad = [];
  const blocks = PG_BLOCKS.map((b) => b.id);
  const types = PG_REPORT_TYPES.map((t) => t.id);
  /* ① 4유형 × 7블록 행렬이 전부 채워졌는가 */
  for (const t of types) {
    const row = PG_TYPE_BLOCKS.filter((r) => r.type === t)[0];
    if (!row) { bad.push({ id: t, why: "유형 행이 없다" }); continue; }
    for (const b of blocks) {
      const cell = row.cells[b];
      if (!cell) { bad.push({ id: t + "/" + b, why: "행렬 칸이 비었다" }); continue; }
      if (cell[0] === "해당없음" && !cell[1]) bad.push({ id: t + "/" + b, why: "비해당 사유가 비었다 — 누락과 구별되지 않는다" });
    }
  }
  /* ② 조항 축 — 유형 해당성 · 축 값의 유효성. 축 값의 원천은 용어 원천이다 */
  const axes = (typeof PG_AXES !== "undefined") ? PG_AXES : null;
  const kinds = (typeof PG_KINDS !== "undefined") ? PG_KINDS.map((k) => k.k) : [];
  const sev = axes ? axes.severity.map((s) => s[0]) : [];
  const life = axes ? axes.lifecycle.map((s) => s[0]) : [];
  const subj = axes ? axes.subject.map((s) => s[0]) : [];
  const stages = axes ? axes.stage.map((s) => s[0]) : [];
  const causes = axes ? axes.cause.map((s) => s[0]) : [];
  const seen = {};
  for (const p of PG_INPUTS) {
    if (seen[p.id]) bad.push({ id: p.id, why: "조항 id 중복" });
    seen[p.id] = 1;
    if (sev.length && sev.indexOf(p.severity) < 0) bad.push({ id: p.id, why: "결함 등급 축 밖 — " + p.severity });
    if (life.length && life.indexOf(p.lifecycle) < 0) bad.push({ id: p.id, why: "생애주기 축 밖 — " + p.lifecycle });
    if (subj.length && subj.indexOf(p.subject) < 0) bad.push({ id: p.id, why: "판정 대상 축 밖 — " + p.subject });
    if (!p.appliesTo || !p.appliesTo.length) bad.push({ id: p.id, why: "유형 해당성이 비었다" });
    for (const k of (p.appliesTo || [])) if (kinds.length && kinds.indexOf(k) < 0) bad.push({ id: p.id, why: "유형 축 밖 — " + k });
    if (!p.inputs || !p.inputs.length) bad.push({ id: p.id, why: "입력이 비었다 — 무엇을 보고 판정하는지 정해지지 않았다" });
    for (const i of (p.inputs || [])) {
      if (!PG_OBJ[i.obj]) bad.push({ id: p.id, why: "입력 객체 사전 밖 — " + i.obj });
      if (!i.grade) bad.push({ id: p.id + "/" + i.k, why: "입력 출처 등급이 비었다" });
      if (!i.use) bad.push({ id: p.id + "/" + i.k, why: "무엇에 쓰는지가 비었다 — 받으면서 쓰지 않는 입력이 된다" });
    }
    if (!p.ruleId) bad.push({ id: p.id, why: "판정 디스패치 키 이름이 비었다" });
    if (p.subject === "당사") {
      const anySelf = (p.inputs || []).filter((i) => i.obj === "self").length;
      if (!anySelf) bad.push({ id: p.id, why: "당사 축 조항인데 입력에 당사 구조가 없다 — 협력업체 제출물로 우리 책임을 판정하게 된다" });
    }
  }
  /* ③ 단계 · 원인 축이 용어 원천과 같은 값을 쓰는가 */
  for (const e of PG_STAGE_EFFECT) {
    if (e.stage !== "*" && stages.length && stages.indexOf(e.stage) < 0) bad.push({ id: "stage/" + e.stage, why: "단계 축 밖" });
    if (e.cause !== "*" && causes.length && causes.indexOf(e.cause) < 0) bad.push({ id: "cause/" + e.cause, why: "원인 축 밖" });
    if (!e.why) bad.push({ id: "stage/" + e.cause + "/" + e.stage, why: "집행 효과의 사유가 비었다" });
  }
  if (causes.length) for (const c of causes) {
    if (!PG_STAGE_EFFECT.filter((e) => e.cause === c || e.cause === "*").length)
      bad.push({ id: "cause/" + c, why: "집행 효과가 정해지지 않은 원인" });
  }
  /* ④ 미제출 필드가 「충족」 분모에 들어갈 수 없는가 — 지면 수준 확인 */
  for (const f of PG_SOURCE_MAP) {
    if (f.grade === "ABSENT" && f.usable) bad.push({ id: f.obj + "." + f.k, why: "미제출인데 판정 가능으로 표시됐다 — 미제출이 충족으로 세어진다" });
    if (!f.axis) bad.push({ id: f.obj + "." + f.k, why: "축이 비었다 — 클램프 파생이 이 필드를 놓친다" });
  }
  if (PG_DENOM.compliance.denom.indexOf("pending") < 0) bad.push({ id: "PG_DENOM", why: "준수율 분모에서 pending 을 빼는 규약이 사라졌다" });
  /* ⑤ 열람 등급 — 지금 쓸 수 있는 등급과 신원이 생긴 뒤의 등급이 갈려 있는가 */
  for (const v of PG_VIEW) {
    if (!v.now && !v.pre) bad.push({ id: v.lv, why: "선행 조건 없이 미구현으로 표기됐다" });
    if (!v.now && !v.test) bad.push({ id: v.lv, why: "검증 방식이 비었다 — 로그인할 수 없는 등급을 구현했다고 적게 된다" });
  }
  if (pgClampDrop("L2").indexOf("partner.legalName") < 0) bad.push({ id: "PG_CLAMP", why: "운영 등급 이하에서 실상호를 잘라내지 않는다" });
  if (pgClampDrop("L1").length) bad.push({ id: "PG_CLAMP", why: "내부통제 담당 등급에서 잘라내는 필드가 있다" });
  /* ⑥ 반출 머리말 4줄 */
  if (PG_EXPORT_HEAD.length !== 4) bad.push({ id: "PG_EXPORT_HEAD", why: "머리말이 4줄이 아니다" });
  if (!PG_EXPORT_HEAD[3].ref) bad.push({ id: "PG_EXPORT_HEAD", why: "표시명 모드 고지가 용어 원천을 가리키지 않는다 — 문안이 두 곳에 산다" });
  /* ⑦ 자기 거버넌스 — 수범자가 우리인 조문에 대응 항목이 있는가 */
  if (!PG_SELF_GOV.filter((g) => g.self && g.lawRef).length)
    bad.push({ id: "PG_SELF_GOV", why: "우리 자신이 수범자인 조문에 대응하는 자기 거버넌스 항목이 없다" });
  return bad;
}

/* ── 개발 훅 — 러너가 화면을 거치지 않고 단언한다 ── */
if (typeof window !== "undefined") {
  window.__hifinPGReport = function () {
    return {
      types: PG_REPORT_TYPES, blocks: PG_BLOCKS, matrix: PG_TYPE_BLOCKS,
      numRule: PG_NUM_RULE, src: PG_SRC, denom: PG_DENOM, metrics: PG_METRICS, decl: PG_DECL,
      screenNotice: PG_SCREEN_NOTICE, rollup: PG_ROLLUP, obj: PG_OBJ, inputs: PG_INPUTS, selfGov: PG_SELF_GOV,
      sourceMap: PG_SOURCE_MAP, view: PG_VIEW, clamp: PG_CLAMP, exportHead: PG_EXPORT_HEAD,
      stageEffect: PG_STAGE_EFFECT, pepExpect: PG_PEP_EXPECT, lanes: PG_TRACE_LANES,
      traceRule: PG_TRACE_RULE, whatIfAxes: PG_WHATIF_AXES, whatIfForbid: PG_WHATIF_FORBID,
      engineBlocks: PG_ENGINE_BLOCKS, engineMetrics: PG_ENGINE_METRICS, engineRule: PG_ENGINE_RULE, floor: PG_FLOOR,
      counts: {
        types: PG_REPORT_TYPES.length, blocks: PG_BLOCKS.length, metrics: PG_METRICS.length,
        policies: PG_INPUTS.length, inputs: PG_INPUTS.reduce((a, p) => a + p.inputs.length, 0),
        fields: PG_SOURCE_MAP.length, submitKeys: pgSubmitKeys().length, lawRefs: pgLawRefs().length,
        lanes: PG_TRACE_LANES.length, exportHead: PG_EXPORT_HEAD.length,
        engineBlocks: PG_ENGINE_BLOCKS.length, engineMetrics: PG_ENGINE_METRICS.length,
        traceRule: PG_TRACE_RULE.length, whatIfAxes: PG_WHATIF_AXES.length, floor: PG_FLOOR.length,
      },
      gradeMix: pgGradeMix(), clampL2: pgClampDrop("L2"), clampL3: pgClampDrop("L3"), clampL4: pgClampDrop("L4"),
      clampDrop: pgClampDrop, fieldClamp: pgFieldClamp, identityLookup: pgIdentityLookup,
      selfScan: PG_SELF_SCAN, selfScanOf: pgSelfScan, pendingAmends: pgPendingAmends(), futureLaws: pgFutureLaws,
      sourceAxisMix: pgSourceAxisMix(), metricMix: pgMetricGradeMix(),
      engineBlock: pgEngineBlock, engineMetric: pgEngineMetric,
      audit: { metric: pgMetricAudit(), report: pgReportAudit(), engine: pgEngineAudit() },
    };
  };
}
