/* ══════════ 협력업체 온톨로지 · 하네스 — AI 거버넌스 축 (P6 · 지시서 §8 · §13-9) ══════════
   Partner AI Governance — **두 방향이다**(§8-1).
     방향 1 (협력업체의 AI)  : 협력업체가 AI를 쓰면 그 AI에 대해 물을 7가지를 점검 축으로 등재하고,
                               답이 없으면 「미제출」로 표시한다. 등급을 만들지 않는다.
     방향 2 (우리 자신의 AI) : **판정 에이전트는 결정을 만들지 않는다.** pgDecide 가 결정을 내고
                               에이전트는 반환값을 해석 · 요약 · 우선순위만 한다.
                               **이 제약이 코드로 강제되는지가 이 축의 완료 조건**이다(§8-1).

   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md (§8 전문 · §13-9)
   결정값: docs/partner_gov/P0_결정서_v1.1.md

   이 파일이 소유하는 것 6가지
     ① PG_AI_AXES      — 협력업체 AI 점검 7축(A-01~A-07). **확인 등급 열 필수**(§8-2 ⚠)
     ② PG_AI_STD       — 표준 · 법령 매핑표. **법령 1개 = 항목 1개**(단일 항목 규약 · §8-4 ⚠⚠).
                          이름 · 확인 등급 · 시행일 · 제재는 **레지스트리에서 파생**한다 — 여기 적지 않는다
     ③ PG_AI_NOTICE    — G-08 · G-09 화면 고지의 **자리 목록**. 문안은 선언 테이블이 소유하고
                          이 표는 「어느 파일의 어느 자리에서 렌더되는가 + 검사 소유자」를 적는다
     ④ PG_AI_AGENTS    — `vrisk` · `settle` **확장 선언**(새 에이전트 발명 금지 · G-05)
     ⑤ PG_AI_ACTIONS   — 거버넌스 액션. 출력의 **모든 숫자는 선언된 반환 필드 경로에서만** 온다(G-01)
     ⑥ PG_AI_HITL      — 사람 승인 게이트. 거래중지 · 대체공급 · 정산보류 · 등급하향은 승인 없이 실행 0건(G-02)

   이 파일이 소유하지 않는 것
     · 법령 · 표준 레지스트리 → src/data/partnerPolicy.js (PG_LAWS). 이름 · 조문 · 확인 등급 · 시행일 ·
       제재의 단일 원천이고, 이 파일은 **읽기만** 한다. 조문 · 통제 번호 렌더 게이트도 그쪽이 소유한다(§6-4).
     · 자기 거버넌스 항목 G-01~G-09 → src/data/partnerReport.js (PG_SELF_GOV). 항목 · 검증 기준이 거기 있고
       이 파일은 그 항목을 **실측**한다(측정과 선언을 한 곳에 두면 선언이 자기를 통과시킨다).
     · 외부 생성형 AI 전송통제 7항목 → src/components/Compliance.jsx (CMP_AICTRL). **그대로 재사용**한다(§8-2 A-07).
     · 거래 운영 에이전트 카드 → src/components/SupplyOntology.jsx (SC_AGENTS). 확장은 선언으로 얹고
       그 파일은 렌더만 한다 — 두 곳에 적으면 같은 에이전트가 두 범위를 갖는다.

   ⚠ 단일 번들(import 없음 · 전역 공유)이다. 이 파일은 매니페스트에서 partnerEnforce.js **뒤**,
     agentRegistry.js · AgentDock.jsx **앞**에 붙는다. 그래서 HI_AGENTS · SC_AGENTS · CMP_AICTRL 은
     **모듈 최상위에서 읽을 수 없다**(TDZ 로 번들이 통째로 죽는다 — P1 에서 실제로 겪었다).
     여기 최상위 선언은 **리터럴뿐**이고, 다른 파일의 상수는 전부 함수 안에서 typeof 가드로 읽는다.
     캐시는 var 로 둔다(const 캐시는 호이스팅되지 않는다).

   ⚠ 결정론 — Math.random · new Date · Date.now 0건. 시각축은 호출자가 넘긴 기준일이다(§11-5).
   ⚠ 관측이지 조작이 아니다 — 이 파일은 조항 신설 · 판정 기준 변경 · 집행 수준 하향 · 로그 삭제의
     입구를 만들지 않는다. 승인 게이트조차 **요청 등재까지만** 한다(§7-8). */

const PG_AI_VER = "P6-1.0.0";

/* ── 지면 문안 — 컴포넌트에 문장을 적지 않는다(§0-5). 죽은 문안 검사는 pgAiAudit 이 소유한다 ──
   ★ G-08 · G-09 의 **화면 고지 문안**은 PG_AI_DOCK_NOTICE 와 PG_DECL 이 들고 있다.
     자기 거버넌스 표의 `check` 는 **검증 기준**이고 독자에게 하는 고지가 아니다 — 그 문장을 고지
     자리에 찍으면 「고지 문구가 존재한다」가 고지로 인쇄된다(P5a 가 같은 사고를 실측했다). */
const PG_AI_DECL = {
  twoWays: "이 축은 두 방향입니다 — 협력업체가 쓰는 인공지능을 점검하는 축과, 우리 자신의 인공지능을 규율하는 축입니다.",
  axisOwner: "점검 축은 등급을 만들지 않습니다 — 제출물이 없으면 「미제출」로 적고, 그 상태로 판정을 내지 않습니다.",
  numberGate: "표준 · 통제 번호는 확인 등급이 「원문확인」일 때만 인쇄됩니다 — 원문을 입수하지 못한 통제는 통제목표 표제까지만 적습니다.",
  isoGate: "이 표준의 개별 통제 번호는 적지 않습니다 — 2차 출처들이 서로 다른 값을 주고, 한 출처는 다른 표준의 통제 표제를 이 자리에 올려 두었습니다.",
  evidenceGap: "이 축의 증거는 제출 필드 사전에 아직 등재되지 않았습니다 — 사전 밖 필드는 존재하지 않으므로(받으면서 쓰지 않는 정보를 받지 않습니다) 발주 항목으로 적고 판정하지 않습니다.",
  selfOwner: "우리 자신에 대한 항목입니다 — 협력업체에만 걸고 자기 축에서 빼면 「우리 AI에 대한 거버넌스」가 법정 의무를 비껴간 선언이 됩니다.",
  selfLaw: "법정 의무입니다 — 우리가 그 조항의 수범자입니다. 근거 법령은 레지스트리가 채우고 조문 번호는 확인 등급 게이트를 지납니다.",
  selfRule: "설계 규약입니다 — 법정 의무가 아니고, 그 사실을 적습니다. 확인하지 못한 법을 자기 항목의 근거로 삼지 않습니다.",
  agentOwner: "에이전트는 결정을 만들지 않습니다 — 판정기가 결정을 내고 에이전트는 반환값을 해석 · 요약 · 우선순위만 합니다.",
  agentNums: "에이전트 출력의 모든 숫자는 선언된 반환 필드 경로에서 옵니다 — 문안 틀에는 숫자가 한 글자도 없습니다.",
  g01Scope: "이 수치의 사정권은 **거버넌스 출력**입니다 — 같은 카드에 붙은 거래 운영 액션의 숫자는 거래 사실 레이어 반환 필드에서 오고, 그 액션 본문에 적힌 리터럴은 함께 세어 이름을 대고 적습니다.",
  axisSplit: "협력업체 축과 당사 축을 섞어 세지 않습니다 — 당사 축 조항은 입력이 우리 구조여서 모집단 전체에 같은 결과가 복제되고, 섞으면 당사 책임 조항이 협력업체 결함으로 읽힙니다.",
  selfNotMine: "당사 축 조항은 협력업체 대금 보류 · 거래중지의 근거가 아닙니다 — 그 조항의 시정 과제는 우리 쪽 구조 변경입니다.",
  dryRun: "검증 호출은 결정 로그에 쓰지 않습니다 — 지면을 여는 것만으로 기록이 불어나면 「누가 무엇을 했나」가 거짓이 됩니다.",
  approverAbsent: "승인 신원이 아직 시스템에 없습니다 — 승인 자리는 세워 두고 승인은 신원 기반이 생긴 뒤입니다. 화면이 임의의 사번으로 승인을 만들면 그 기록이 사람 승인으로 읽힙니다.",
  gateTested: "승인 게이트는 단위 호출로 검증합니다 — 승인 없이 부르면 실행되지 않고, 판정기를 승인자로 넣으면 거부됩니다.",
  hitlGate: "사람 승인 없이는 실행되지 않습니다 — 그리고 승인을 받아도 이 지면이 하는 일은 요청 등재까지입니다(관측이지 조작이 아닙니다).",
  hitlActor: "판정은 판정기가 하고 승인은 사람이 합니다 — 결정 로그가 둘을 행위자 유형으로 가릅니다.",
  logEmpty: "결정 로그가 비어 있습니다 — 「기록 없음」으로 적습니다. 0을 「문제 없음」으로 읽히게 두지 않습니다.",
  /* ★ 제3값의 문안 — 「충족」도 「미충족」도 아니다. 모집단이 0이면 기준이 작동한 적이 없다. */
  unmeasured: "미계측 — 모집단 0입니다. 이 기준은 아직 한 번도 작동하지 않았고, 충족으로 세지 않습니다.",
  memberBlock: "회원 대면 에이전트의 지식층에 거래 · 통제 · 원가 원천이 없습니다 — 등재된 채로 두면 회원 상담 경로로 원가가 흘러나가는 문이 열립니다.",
  baseFrozen: "에이전트를 새로 만들지 않습니다 — 기존 두 에이전트의 소관 · 지표 · 가드를 넓힙니다. 기준 명단이 바뀌면 검사가 실패합니다.",
};

/* ── 지면 블록 — 보고서 블록표 · 엔진 블록표와 **다른 표**다 ─────────────────────────────
   왜 따로 두는가: 보고서 블록표(PG_BLOCKS)는 4유형 × 7블록 행렬과 수치 전수 검사의 **분모**이고,
   엔진 블록표(PG_ENGINE_BLOCKS)는 판정 규칙 축의 분모다. AI 거버넌스를 그 표에 넣으면
   유형별 보고서가 싣지 않는 블록의 행렬 칸을 요구하고 분모가 어긋난다(P5b 가 같은 사유로 갈랐다).
   대신 **같은 형식 · 같은 검사 규칙**을 쓰는 pgAiAudit 을 둔다 — 느슨하게 두려는 것이 아니다. */
const PG_AI_BLOCKS = [
  { id: "AI1", ko: "협력업체 AI 점검 7축", asks: "협력업체가 쓰는 인공지능에 대해 무엇을 묻는가", from: "spec:PG_AI_AXES",
    items: ["점검 축 7종(A-01~A-07)", "무엇을 보는가", "표준 매핑 — 통제목표 표제", "**확인 등급**",
            "증거 — 제출 필드 사전의 키", "사전 미등재 축은 발주 항목으로 적는다", "답이 없으면 「미제출」",
            "외부 생성형 AI 전송통제 7항목 그대로 재사용"] },
  { id: "AI2", ko: "표준 · 법령 매핑표", asks: "그 점검은 어느 기준에 기대고 그 기준은 언제부터 효력이 있는가", from: "policy:PG_LAWS",
    items: ["기준 4종 — 국내 인공지능 기본법 · ISO/IEC 42001 · NIST AI RMF · EU AI Act",
            "**법령 1개 = 항목 1개**(제정법은 연혁이고 별 항목이 아니다)", "적용 대상 — 협력업체 / 우리 자신 / 참고",
            "적용 범위", "현행 버전 · 시행일", "제재 축 · 집행 유예", "**확인 등급**",
            "조문 · 통제 번호는 원문확인일 때만 인쇄"] },
  { id: "AI3", ko: "하이핀 자기 거버넌스", asks: "우리 자신의 인공지능은 무엇으로 규율되고 그것이 실제로 지켜지는가", from: "spec:PG_SELF_GOV",
    items: ["자기 거버넌스 9항목(G-01~G-09)", "법정 의무 / 설계 규약 구분", "근거 법령 — 우리도 수범자인 조문",
            "검증 기준", "**실측값**", "화면 고지 문안과 그 자리", "애블레이션 검사 소유자"] },
  { id: "AI4", ko: "거버넌스 에이전트 · 사람 승인", asks: "에이전트는 무엇을 하고 무엇을 할 수 없는가", from: "spec:PG_AI_ACTIONS",
    items: ["확장된 에이전트 2종(새 에이전트 0건)", "넓힌 소관 · 지표 · 가드", "거버넌스 액션",
            "출력 숫자의 반환 필드 경로", "사람 승인 필수 액션", "승인해도 실행되지 않는 것",
            "결정 로그의 행위자 구분"] },
];

/* ══════════════ ① 협력업체 AI 점검 7축 — A-01 ~ A-07 (§8-2) ══════════════
   ⚠ [필수] 이 표를 **「확인 등급」 열 없이 베끼지 말 것.** v2.0 은 ISO/IEC 42001 Annex A 통제 번호를
     확인 등급 없이 사실로 인쇄했는데 같은 문서의 출처표는 그 표준을 「부분확인」으로 등급 매겼다.
     그래서 이 표는 **통제 번호를 들고 있지 않는다** — `objective`(통제목표 표제)만 적고,
     번호를 적을 수 있는 축은 `numLabel` 에 두어 **확인 등급 게이트를 지난 뒤에만** 렌더한다.
     게이트의 소유자는 레지스트리(pgLawRender)다. 이 파일은 등급을 만들지 않는다.

   항목 구조
     std[]      {lawId, objective, numLabel} — lawId 는 PG_LAWS 의 키. 이름 · 등급은 레지스트리가 돌려준다
                numLabel 은 **원문확인일 때만** 인쇄된다(null 이면 번호 축이 애초에 없다는 뜻)
     evidence[] {k, why} — k 는 **제출 필드 사전(PG_FIELDS)에 이미 있는 키**여야 한다.
                사전 밖 키를 적으면 pgAiAudit 이 실패한다 — 조용히 떨어뜨리지 않는다
     gap        증거가 사전에 없는 축의 **발주 사유**. evidence 가 비면 반드시 있어야 한다
     reuse      다른 파일이 소유한 항목을 그대로 재사용하는 축의 원천 이름
   ★ 증거를 **지어내지 않는다.** 제출 필드 사전은 조항이 선언한 제출 키와 수가 같아야 하므로(러너 단언),
     조항 없이 필드를 더하면 그 단언이 깨진다. 그래서 사전에 없는 축은 **「미등재」로 적고 판정하지 않는다** —
     「받으면서 쓰지 않는 정보는 받지 않는다」와 같은 원칙이다. */
const PG_AI_AXES = [
  { id: "A-01", ko: "AI 사용 여부 · 범위", sees: "어느 기능이 인공지능인가",
    std: [{ lawId: "nistRmf", objective: "맥락 파악(MAP) — 범주 1", numLabel: "MAP 1" }],
    evidence: [{ k: "ai_used", why: "사용 여부와 범위" },
               { k: "ai_generative", why: "생성형 제품 · 서비스 해당성" },
               { k: "ai_highimpact", why: "고영향 해당성 — 성질 요건과 영역 요건을 함께 본다" },
               { k: "ai_highimpact_basis", why: "해당성 판정 근거 — 자체 확인인가 소관 장관 확인인가" }],
    gap: null, reuse: null },
  { id: "A-02", ko: "모델카드 보유", sees: "의도된 용도와 **부적합 맥락**이 적혀 있는가 — 모델카드의 본래 목적이 「부적합한 맥락에서의 사용 억제」다",
    std: [{ lawId: "iso42001", objective: "AI 시스템 정보 제공 통제목표 계열", numLabel: null },
          { lawId: "modelCard", objective: "의도된 사용 사례 명확화 + 부적합 맥락에서의 사용 억제", numLabel: null }],
    evidence: [{ k: "model_card", why: "의도된 용도와 부적합 맥락" },
               { k: "model_version", why: "모델 버전 — 바뀌면 판정이 무효다" }],
    gap: null, reuse: null },
  { id: "A-03", ko: "데이터시트", sees: "학습 데이터의 출처 · 동의 근거 · 구성",
    std: [{ lawId: "iso42001", objective: "데이터 관리 통제목표 계열", numLabel: null }],
    evidence: [],
    gap: { why: "학습 데이터의 출처 · 동의 근거 · 구성을 받는 제출 필드가 사전에 없다",
           next: "제출 필드 사전에 데이터시트 축을 발주하고 그 축을 보는 조항을 먼저 등재한다 — 조항 없이 필드만 더하면 사전 수와 조항 선언 수가 어긋난다",
           owner: "제출 필드 사전(P4) + 조항 레지스트리(P3)" }, reuse: null },
  { id: "A-04", ko: "하위집단별 평가", sees: "집단 간 성능 차이를 측정했는가",
    std: [{ lawId: "nistRmf", objective: "측정(MEASURE) — 범주 2", numLabel: "MEASURE 2" }],
    evidence: [{ k: "model_validation", why: "모델 검증 보고서 — 하위집단 분해는 이 보고서 안에서 확인한다",
                 partial: "하위집단 분해 전용 필드가 사전에 없다. 보고서 안의 항목으로 확인하고, 그 사실을 숫자 옆에 적는다" }],
    gap: null, reuse: null },
  { id: "A-05", ko: "HITL 지점", sees: "사람이 개입하는 자리가 어디인가",
    std: [{ lawId: "iso42001", objective: "생애주기 / 이용 통제목표 계열 — **귀속 미확정**", numLabel: null,
            caution: "사람의 감독은 「AI 시스템의 이용」 계열 통제목표에도 걸칠 수 있고, 복수 2차 출처가 서로 다른 값을 제시한다. 원문 없이 귀속을 단정하지 않는다" }],
    evidence: [],
    gap: { why: "협력업체 AI 의 사람 개입 지점을 받는 제출 필드가 사전에 없다",
           next: "우리 자신의 HITL 지점은 이 파일의 승인 게이트가 이미 코드로 들고 있다(G-02) — 협력업체 축의 제출 필드는 조항과 함께 발주한다",
           owner: "제출 필드 사전(P4) + 조항 레지스트리(P3)" }, reuse: null },
  { id: "A-06", ko: "설명가능성 수단", sees: "결과를 설명하는 방법이 있는가",
    std: [{ lawId: "nistRmf", objective: "신뢰 특성 — 설명가능성 · 해석가능성", numLabel: "신뢰 특성 3.5" }],
    evidence: [],
    gap: { why: "협력업체 AI 의 설명 수단을 받는 제출 필드가 사전에 없다",
           next: "우리 자신의 설명 수단은 추적 5레인이고(판정기 반환 필드만 전개) 그 지면이 이미 섰다 — 협력업체 축은 조항과 함께 발주한다",
           owner: "제출 필드 사전(P4) + 조항 레지스트리(P3)" }, reuse: null },
  { id: "A-07", ko: "외부 생성형 AI 전송통제", sees: "소비자용 AI 입력 금지 · 기업용 API 전용 · 모델 학습 미사용 계약 확인 · 최소 데이터 · PII 제거 · 입출력 로그 접근통제 · 해외이전 확인",
    std: [{ lawId: "iso42001", objective: "제3자 · 고객 관계 통제목표(Third-party and customer relationships)", numLabel: null },
          { lawId: "nistRmf", objective: "거버넌스(GOVERN) — 제3자 소프트웨어 · 데이터와 조달 경로 정책", numLabel: "GOVERN 6" }],
    evidence: [],
    gap: { why: "7항목을 협력업체 답변으로 받는 제출 필드가 사전에 없다. 지금은 **우리 쪽 통제 정책**을 질문 형태로 재사용해 묻는 단계다",
           next: "항목별 Y/N 을 받는 제출 필드를 조항과 함께 발주한다",
           owner: "제출 필드 사전(P4) + 조항 레지스트리(P3)" },
    reuse: "CMP_AICTRL" },
];

/* ══════════════ ② 표준 · 법령 매핑표 — **단일 항목 규약** (§8-4) ══════════════
   ⚠⚠ 「제정법과 개정법은 서로 다른 두 법률이고 양쪽 모두 시행 중」은 법리적으로 성립하지 않는다.
     일부개정법률은 독립한 법률이 아니라 같은 법률의 본문을 고치는 형식이고, 시행 중인 법률은
     **개정된 하나**다. 한 법률을 두 항목으로 세우면 법령 테이블에서 이원화가 재발한다.
   규약 — 이 표는 **법령 1개 = 행 1개**이고, 이름 · 확인 등급 · 시행일 · 제재 · 수범자는
     전부 `lawId` 로 레지스트리에서 파생한다. 여기 적으면 두 번째 원천이 된다.
     조문별 시행일 추적은 법령 항목이 아니라 조항 레코드가 들고 있다.
   ★ 중복 등재 검사는 pgAiAudit 이 소유한다 — 같은 법령명이 두 행에 서면 실패한다. */
const PG_AI_STD = [
  { lawId: "aiFrame", applies: "협력업체 및 하이핀 자신",
    range: "고영향 **또는** 생성형 인공지능을 이용한 제품 · 서비스 제공 시 사전 고지, 생성형 인공지능 결과물 표시, 실제와 구분하기 어려운 가상 음향 · 이미지 · 영상은 명확히 인식할 수 있게 고지 · 표시(예술적 · 창의적 표현물 예외)",
    why: "우리가 그 조항의 수범자다 — 하이는 전 화면에 상주하는 생성형 인공지능 에이전트이고 전문 에이전트가 회원을 대면한다(§8-3-1). 자기 거버넌스 G-08 · G-09 가 이 항목에 기댄다" },
  { lawId: "iso42001", applies: "협력업체 AI",
    range: "조항 4~10 이 필수 요구사항이고 Annex A 가 참조 통제다. 제3자 통제목표의 정식 표제는 「Third-party and customer relationships」이고, 적용성 명세서에 포함 · 제외 사유를 기록한다",
    why: "제3자 전용 범주가 있어 협력업체 평가 질문을 **통제목표 수준까지** 붙일 수 있다. 개별 통제 번호는 원문 없이 쓰지 않는다 — 번호 미기재가 이 항목의 설계다" },
  { lawId: "nistRmf", applies: "협력업체 AI",
    range: "제3자 전용 범주 3종 — 거버넌스(제3자 소프트웨어 · 데이터와 조달 경로 정책) · 맥락 파악(제3자 구성요소 리스크 매핑) · 관리(제3자 주체로부터의 리스크 관리). 생성형 AI 프로파일 별도",
    why: "범주 체계가 1차 출처로 확인돼 협력업체 평가 질문을 **1:1로** 붙일 수 있다. 그래서 이 축만 번호 축을 갖는다" },
  { lawId: "euAiAct", applies: "참고 — 현 사업 범위 밖",
    range: "고위험 의무의 적용 시점이 부속서 계열에 따라 갈리고 한 차례 연기됐다. 투명성 의무는 연기 대상이 아니어서 이미 적용 중이다. **조문 번호는 원문 미입수로 적지 않는다**",
    why: "국내 고영향 인공지능 접근이 이 규정을 참고한 구조이므로 대조축으로 둔다. 참조 등재이고 판정 근거로 쓸 수 없다" },
  { lawId: "modelCard", applies: "협력업체 AI",
    range: "1~2쪽 분량 · 의도된 사용 사례 명확화 + **부적합 맥락에서의 사용 억제** · 하위집단별 평가",
    why: "A-02 가 보는 문서의 성격을 정하는 원천이다. 「모델카드를 보유했는가」가 아니라 「부적합 맥락이 적혀 있는가」를 묻는 근거가 여기 있다" },
];

/* ══════════════ ③ G-08 · G-09 화면 고지의 자리 ══════════════
   §8-3-1 — v2.0 은 **유일하게 「원문확인」 등급을 부여한 조문**을 협력업체에만 적용하고 하이핀 자신에게는
   적용하지 않았다. 하드 플로어를 통과하는 유일한 집행 가능 조항을 협력업체에만 걸고 자기 축에서 빼면,
   「우리 자신의 AI에 대한 거버넌스」라는 선언이 **법정 의무를 비껴간 선언**이 된다.

   ★ 자리를 **표로 둔다**. 애블레이션 검사(그 문장만 떼면 FAIL)는 이 표를 읽어 돌아야 한다 —
     러너에 자리를 적으면 자리가 늘어날 때 검사가 「0건으로 조용히 통과」한다.
   ★ 하이 독은 **전 화면 상주**다(App.jsx 가 섹션 전환과 무관하게 마운트한다). 그래서 독 한 곳의
     고지가 「하이가 상주하는 화면 전수」를 덮는다 — 화면마다 문구를 복제하지 않는다. */
const PG_AI_DOCK_NOTICE = {
  ops: "이 서비스는 인공지능에 기반하여 운용됩니다 — 하이는 전 화면에 상주하는 인공지능 에이전트이고, 안내·요약·연결에 인공지능이 쓰입니다.",
  gen: "생성형 인공지능이 만든 답변입니다 — 진단·처방을 확정하지 않습니다.",
};
const PG_AI_NOTICE = [
  { gid: "G-08", at: "하이 독 머리 — 전 화면 상주", src: "PG_AI_DOCK_NOTICE", key: "ops",
    srcFile: "src/data/partnerAI.js", file: "src/components/AgentDock.jsx",
    render: "pgAiDockNotice", renderArg: "ops", owner: "run_wording_guard 검사 ⑯",
    why: "제31조 ①항의 사전 고지. 독이 전 화면에 마운트되므로 이 한 자리가 「상주 화면 전수」를 덮는다" },
  { gid: "G-09", at: "하이 답변 말풍선", src: "PG_AI_DOCK_NOTICE", key: "gen",
    srcFile: "src/data/partnerAI.js", file: "src/components/AgentDock.jsx",
    render: "pgAiDockNotice", renderArg: "gen", owner: "run_wording_guard 검사 ⑯",
    why: "제31조 ②항의 생성형 결과물 표시. 답변마다 붙어야 하므로 말풍선이 자리다" },
  { gid: "G-08", at: "협력업체 거버넌스 보고서 머리(B1)", src: "PG_DECL", key: "aiNoticeOps",
    srcFile: "src/data/partnerReport.js", file: "src/components/PartnerGovReport.jsx",
    render: "_pgGovNotice", renderArg: null, owner: "run_wording_guard 검사 ⑯",
    why: "판정 지면에도 에이전트가 상주한다 — 보고서 머리에서 같은 고지를 한다" },
  { gid: "G-09", at: "협력업체 거버넌스 보고서 머리(B1)", src: "PG_DECL", key: "aiNoticeGen",
    srcFile: "src/data/partnerReport.js", file: "src/components/PartnerGovReport.jsx",
    render: "_pgGovNotice", renderArg: null, owner: "run_wording_guard 검사 ⑯",
    why: "보고서 수치 · 사유는 생성형 산출이 아니라는 사실을 적는다 — 그것도 제31조 ②항이 요구하는 구분이다" },
];
/* 하이 독이 부르는 유일한 조회 경로. 문안을 컴포넌트에 복제하지 않는다 —
   원천이 없으면 **빈 문자열**을 돌려주고, 「문안이 없다」는 사실은 가드가 잡는다(사본으로 메우지 않는다). */
function pgAiDockNotice(k) { return PG_AI_DOCK_NOTICE[k] || ""; }

/* ══════════════ ④ 에이전트 확장 — **새 에이전트를 만들지 않는다**(G-05) ══════════════
   기준 명단을 **선언으로 동결**한다. 이름이 하나라도 늘거나 줄면 pgSelfGovRoll 의 G-05 가 실패한다.
   왜 명단을 적는가: 「새 에이전트를 만들지 않았다」는 비교 대상 없이는 셀 수 없다. 분모가 먼저다. */
const PG_AI_AGENT_BASE = {
  sc: ["orch", "vrisk", "growth", "logi", "settle"],
  hi: ["A0", "A1", "A2", "A3", "A4", "A5"],
  why: "거래 운영 에이전트 5종과 회원 대면 메시 6종이 기준이다. 거버넌스 축은 이 명단 안의 두 에이전트를 넓혀 쓴다",
};
/* 확장 선언 — SC_AGENTS 의 owns · kpi · guard 에 **얹는다**. 그 파일에 적지 않는 이유는
   거버넌스 범위가 바뀔 때 두 곳이 갈리기 때문이고, 그 파일은 이 선언을 렌더만 한다. */
const PG_AI_AGENTS = [
  { id: "vrisk", base: "SC_AGENTS",
    ownsAdd: ["협력업체 통제항목", "집행 레코드(사전 통지 · 소명 · 재심)"],
    kpiAdd: ["법령 미확인 조항의 집행 보류 유지", "소명 없이 집행된 건수 0", "불허 판정의 근거 법령 확인 등급 원문확인"],
    guardAdd: "거래중지 · 대체공급 전환 · 등급 하향은 **사람 승인 없이 실행되지 않는다** — 이 지면은 요청 등재까지만 하고, 승인 뒤에도 실제 중지는 계약 · 법무 절차를 지난다",
    why: "통제 판정을 읽는 소비자가 이미 거래처 리스크 축이다. 판정을 내는 자리는 판정기이고 이 에이전트는 반환값을 해석 · 우선순위만 한다" },
  { id: "settle", base: "SC_AGENTS",
    ownsAdd: ["정산 보류 요청", "반출 산출물 요청"],
    kpiAdd: ["반출 머리말 고지 누락 0건", "집행 지점 상한 위반 0건"],
    guardAdd: "정산 보류는 **집행 지점 상한이 경고 · 기록**이어서 보류가 실행되지 않는다 — 요청과 기록만 남는다. 반출은 고지 없는 산출물을 면제 불가로 막는다",
    why: "정산 · 컴플라이언스 축이 이미 규정 검증을 소관한다. 거래상 지위 쟁점 때문에 정산 보류 · 노출 차단은 코드 상한이 경고 · 기록이고, 그 사실을 에이전트 가드가 말해야 한다" },
];

/* ══════════════ ⑤ 거버넌스 액션 — 출력 숫자는 **반환 필드 경로에서만** 온다(G-01) ══════════════
   규약 3줄
     ① `template` 에는 **숫자가 한 글자도 없다.** 숫자 자리는 {슬롯}이고 슬롯 값은 반환 필드다.
        그래서 「에이전트 출력에 판정기 반환값 외의 숫자가 0건」을 **셀 수 있다** — 틀에 숫자가 없으면
        출력의 모든 숫자는 슬롯에서 온 것이고, 슬롯은 선언된 경로를 지난다.
     ② `nums[].from` 은 허용 원천 접두사로 시작한다(PG_SRC). 「화면이 계산한다」는 경로가 없다.
     ③ `hitl: true` 액션은 **승인 없이 실행되지 않는다.** 그리고 `effect` 가 「승인해도 무엇까지인가」를 적는다.
   ★ 액션이 하는 일은 **조회 · 요청 등재**뿐이다. 조항 신설 · 판정 기준 변경 · 집행 수준 하향 ·
     로그 삭제 · 면제 등록의 입구를 만들지 않는다(§7-8). */
const PG_AI_ACTIONS = [
  { id: "vr.verdict", agent: "vrisk", ko: "통제 판정 조회", hitl: false,
    asks: "지금 어느 조항에서 무엇이 불허 · 보류인가",
    /* ★ 축을 **갈라서** 적는다. 전체 합으로 적으면 당사 축 조항 하나가 모집단 전체에 복제된 값이
       「협력업체 불허 N건」으로 읽힌다 — 실측에서 그 합의 전부가 당사 축 조항 하나였다(§5-2 · P5a). */
    template: "협력업체 {분모}곳 × 조항 {조항수}건을 조회했습니다 — 협력업체 축 불허 {협력불허}건 · 판정 보류 {협력보류}건이고, 당사 축 불허 조항은 {당사불허}건입니다. 근거 법령 미확인으로 집행이 보류된 조항 {미확인}건 · 시행 전 조항 {시행전}건.",
    nums: [{ slot: "분모", mid: "ai4.partnerN", from: "rollup:meta.partnerN" },
           { slot: "조항수", mid: "ai4.policyN", from: "policy:PG_POLICIES.length" },
           { slot: "협력불허", mid: "ai4.denyPartner", from: "pgDecide:partnerCounts.DENY" },
           { slot: "협력보류", mid: "ai4.pendingPartner", from: "pgDecide:partnerCounts.INDETERMINATE" },
           { slot: "당사불허", mid: "ai4.denySelf", from: "pgDecide:selfAxis.byDecision.DENY" },
           { slot: "미확인", mid: "ai4.unverified", from: "pgDecide:unverified.length" },
           { slot: "시행전", mid: "ai4.notYet", from: "pgDecide:notYet.length" }],
    blocks: null, effect: "조회만 한다 — 원장을 바꾸지 않는다",
    why: "에이전트가 처음 하는 일이 해석이 아니라 **조회**여야 한다. 반환값을 받기 전에 요약할 것이 없다" },
  { id: "vr.suspend", agent: "vrisk", ko: "거래중지 · 대체공급 전환 요청", hitl: true,
    asks: "불허 판정이 선 협력업체의 거래를 멈출 수 있는가",
    template: "협력업체 축 불허 {협력불허}건 · 치명 결함 {치명}건에 대한 거래중지 · 대체공급 전환을 **요청으로 등재**했습니다 — 사람 승인 전에는 실행되지 않습니다.",
    nums: [{ slot: "협력불허", mid: "ai4.denyPartner", from: "pgDecide:partnerCounts.DENY" },
           { slot: "치명", mid: "ai4.fatal", from: "pgDecide:defect.partnerAxis" }],
    blocks: "거래중지 · 대체공급 전환",
    effect: "승인을 받아도 이 지면이 하는 일은 **요청 등재와 기록**이다 — 실제 중지는 계약 · 법무 절차를 지난다. 집행 레코드의 사전 통지 · 소명 기한 · 소명 내용 · 재심 4필드가 채워지지 않으면 집행 레코드 자체가 만들어지지 않는다",
    approvalBy: "임직원(EMP)",
    why: "거래를 끊는 것은 거래상 지위 쟁점에 직접 닿는다. 사전 통지 · 소명 · 재심이 없는 집행은 다투어졌을 때 방어되지 않는다(§7-7)" },
  { id: "st.hold", agent: "settle", ko: "정산 보류 요청", hitl: true,
    asks: "통제 판정으로 대금을 보류할 수 있는가",
    template: "정산 보류를 **요청으로 등재**했습니다 — 정산 승인 지점의 집행 수준 상한이 경고 · 기록이어서 보류는 실행되지 않고, 협력업체 축 불허 {협력불허}건과 소명 없이 집행된 {무소명}건이 기록으로 남습니다.",
    nums: [{ slot: "협력불허", mid: "ai4.denyPartner", from: "pgDecide:partnerCounts.DENY" },
           { slot: "무소명", mid: "ai4.noDefense", from: "log:pgActionStats.noDefense" }],
    blocks: "정산 보류 · 대금 지급 중단",
    effect: "**실행되지 않는다.** 정산 승인 지점은 코드로 경고 · 기록 상한이고, 유인 · 알선 조항은 조항 단위로 경고 · 기록에 고정이며 정산 산식은 법률 검토 회신 전까지 동결이다. 남는 것은 요청과 기록이다. 당사 축 조항은 협력업체 대금 보류의 근거가 아니다",
    approvalBy: "임직원(EMP)",
    why: "막지 않는 것과 보이지 않는 것은 다르다. 상한에 걸려 실행되지 않는다는 사실 자체를 에이전트 출력이 말해야 한다" },
  { id: "st.export", agent: "settle", ko: "보고서 반출 요청", hitl: true,
    asks: "이 판정 보고서를 밖으로 내보낼 수 있는가",
    template: "반출을 **요청으로 등재**했습니다 — 반출 지점의 집행 수준은 차단 · 면제 불가이고, 머리말 {머리말}줄이 산출물 첫머리에 들어가지 않으면 막힙니다.",
    nums: [{ slot: "머리말", mid: "ai4.exportHead", from: "spec:PG_EXPORT_HEAD.length" }],
    blocks: "반출 산출물 생성",
    effect: "요청 등재와 기록까지다. 반출 자체는 사람이 눌러야 일어나고, 실명 표기에서 고지가 없으면 **면제 불가로 막힌다**. 렌더 중에 반출 집행을 부르지 않는다 — 부르면 차단 로그가 오염된다",
    approvalBy: "임직원(EMP)",
    why: "반출 경로는 TSV · PDF · 화면 캡처 셋이 아니라 넷이고 네 번째가 커밋이다. 에이전트가 반출을 자동으로 하지 않는 것이 이 축의 설계다" },
];

/* 사람 승인 게이트 — G-02 의 구현 선언. 「승인 없이는 불가」의 **목록이 여기 하나**다.
   ★ `must` 의 각 줄에 **입구**를 적는다. 액션 id 가 있으면 그 액션이 게이트를 지나고,
     "입구 없음" 이면 그 행위를 할 자리가 애초에 없다(게이트보다 강하다). 입구를 적지 않으면
     「승인 필수 6건」이라 적고 실제로는 3건만 검사되는 상태가 되고, 그 분모 차이가 보이지 않는다. */
const PG_AI_HITL = {
  must: [
    { what: "거래중지", entry: "vr.suspend" },
    { what: "대체공급 전환", entry: "vr.suspend" },
    { what: "정산 보류", entry: "st.hold" },
    { what: "반출", entry: "st.export" },
    { what: "등급 하향", entry: null, why: "열람 등급은 L1 고정이고 화면 토글이 없다 — 하향할 입구가 없다" },
    { what: "면제 승인", entry: null, why: "면제 등록 요청의 입구를 이 지면에 두지 않았다 — 만료일 없는 면제는 등록 자체가 거부되고, 등록 경로는 승인 절차가 소유한다" },
  ],
  approver: "임직원(EMP####) — 판정기(SYS-PGDECIDE)는 승인자가 될 수 없다",
  /* ★ 승인 신원이 아직 없다. 화면에 승인 입구를 두되 **임의 사번으로 승인을 만들지 않는다** —
     그러면 그 기록이 사람 승인으로 읽힌다. 열람 등급 L2 · L3 를 단위 호출로만 검증한 것과 같은 자리다. */
  approverIdentity: false,
  gate: "승인 없이 호출하면 상태가 「승인대기」이고 executed 는 false 다. 승인 뒤에도 요청 등재까지다",
  log: "판정 호출은 판정기 행위자로, 승인은 임직원 행위자로 결정 로그에 남는다 — 두 행위자 유형이 로그에서 갈린다",
  never: ["조항 신설 · 수정", "판정 기준 변경", "집행 수준 하향", "결정 로그 삭제", "열람 등급 상향"],
  why: "운영 콘솔 원칙 — 관측이지 조작이 아니다. 안전 임계값을 화면에서 바꾸게 만들지 않는다",
};

/* 회원 경로 차단(G-06) — 회원 대면 에이전트의 지식층에 있으면 안 되는 원천과 낱말.
   ⚠ 이 목록은 **원천 이름**이다. 낱말 금칙은 금칙 사전(PG_FORBID)이 소유하므로 여기서 다시 적지 않는다. */
const PG_AI_MEMBER_FORBID = {
  sources: ["supplyData", "partnerGov", "partnerPolicy", "partnerEnforce", "partnerReport", "partnerAI", "escrowPay", "finBudget", "finBudgetParams"],
  axes: ["협력업체", "원가", "송객수수료", "여신"],
  why: "그 데이터셋들은 거래처 원가율 · 공급가 · 마진율 · 수수료율을 들고 있고 회원 대면 에이전트는 상담 경로다. 지식층에 등재된 채로 두면 하이 4층 등록 시 회원 상담 경로로 원가가 흘러나가는 문이 열린다(지식 등재의 등급 속성은 접근 제어에 쓰이지 않는다)",
};

/* 수치 정의 — 보고서 수치표 · 엔진 수치표와 **id 가 겹치지 않는다**(겹치면 같은 수치가 두 표에 산다).
   from 은 허용 원천 접두사로 시작하고, pgAiAudit 이 전수 검사한다. */
const PG_AI_METRICS = [
  { id: "ai1.axisN", block: "AI1", ko: "점검 축 수", def: "등재된 협력업체 AI 점검 축 전수",
    from: "spec:PG_AI_AXES.length", absent: "—", grade: "REAL" },
  { id: "ai1.verifiedMix", block: "AI1", ko: "축별 확인 등급 분포", def: "원문확인 · 부분확인 · 미확인 건수",
    from: "policy:lawVerified", absent: "근거 기준이 없는 축은 「미확인」이다", grade: "REAL" },
  { id: "ai1.numShown", block: "AI1", ko: "번호가 인쇄되는 축 수", def: "확인 등급 게이트를 지난 표준 번호 축 수",
    from: "policy:lawRender", absent: "게이트를 지나지 않으면 통제목표 표제까지만 적는다", grade: "REAL" },
  { id: "ai1.evidenceN", block: "AI1", ko: "사전에 등재된 증거 필드 수", def: "점검 축이 가리키는 제출 필드 중 사전에 있는 키 수",
    from: "spec:PG_FIELD_KEYS", absent: "사전 미등재 축은 발주 항목으로 적고 판정하지 않는다", grade: "REAL" },
  { id: "ai1.submitAbsent", block: "AI1", ko: "미제출 건수", def: "모집단 × 증거 필드 중 제출되지 않은 칸 수",
    from: "pgDecide:rec.submit", absent: "모집단 레코드가 아직 서지 않으면 「아직 없음」", grade: "ABSENT" },
  { id: "ai1.ctrlN", block: "AI1", ko: "재사용 전송통제 항목 수", def: "외부 생성형 AI 전송통제 항목 전수",
    from: "spec:CMP_AICTRL", absent: "원천이 없으면 「원천 미적재」로 적는다", grade: "REAL" },
  { id: "ai2.stdN", block: "AI2", ko: "기준 수", def: "매핑표에 등재된 기준 행 수",
    from: "spec:PG_AI_STD.length", absent: "—", grade: "REAL" },
  { id: "ai2.selfN", block: "AI2", ko: "우리도 수범자인 기준 수", def: "적용 대상에 하이핀 자신이 포함된 기준 수",
    from: "policy:appliesToSelf", absent: "—", grade: "REAL" },
  { id: "ai2.articleShown", block: "AI2", ko: "조문 번호가 인쇄되는 조문 수", def: "확인 등급 게이트를 지난 조문 수",
    from: "policy:lawRender", absent: "게이트를 지나지 않으면 「조문 미확인」만 적는다", grade: "REAL" },
  { id: "ai3.govN", block: "AI3", ko: "자기 거버넌스 항목 수", def: "등재된 자기 거버넌스 항목 전수",
    from: "spec:PG_SELF_GOV.length", absent: "—", grade: "REAL" },
  { id: "ai3.lawBacked", block: "AI3", ko: "법정 의무 항목 수", def: "근거 법령이 있고 우리가 수범자인 항목 수",
    from: "policy:appliesToSelf", absent: "근거 법령이 없는 항목은 설계 규약으로 적는다", grade: "REAL" },
  { id: "ai3.measured", block: "AI3", ko: "실측된 항목 수", def: "충족 / 측정 — **미계측(모집단 0) 항목은 분모에서 뺀다**",
    from: "spec:pgSelfGovRoll", absent: "실측 경로가 없는 항목은 「실측 경로 없음」으로 적는다", grade: "REAL",
    renderRule: "「n / n」 한 값으로 적지 않는다 — 각주에 「n 측정 · m 미계측 / 전체」를 함께 적는다(stateLine)" },
  { id: "ai3.noticeN", block: "AI3", ko: "화면 고지 자리 수", def: "고지가 렌더되는 자리 전수",
    from: "spec:PG_AI_NOTICE.length", absent: "—", grade: "REAL" },
  { id: "ai4.agentN", block: "AI4", ko: "확장된 에이전트 수", def: "거버넌스 축으로 넓힌 기존 에이전트 수",
    from: "spec:PG_AI_AGENTS.length", absent: "—", grade: "REAL" },
  { id: "ai4.actionN", block: "AI4", ko: "거버넌스 액션 수", def: "등재된 액션 전수",
    from: "spec:PG_AI_ACTIONS.length", absent: "—", grade: "REAL" },
  { id: "ai4.hitlN", block: "AI4", ko: "사람 승인 필수 액션 수", def: "승인 없이 실행되지 않는 액션 수",
    from: "spec:PG_AI_HITL", absent: "—", grade: "REAL" },
  { id: "ai4.partnerN", block: "AI4", ko: "모집단 — 협력업체 수", def: "중복 신원 교정 후의 협력업체 축 모집단",
    from: "rollup:meta.partnerN", absent: "롤업이 서지 않으면 「아직 없음」", grade: "REAL" },
  { id: "ai4.policyN", block: "AI4", ko: "조항 수", def: "레지스트리에 등재된 조항 전수",
    from: "policy:PG_POLICIES.length", absent: "—", grade: "REAL" },
  /* ★ 불허 · 보류는 **판정 대상으로 가른 값**만 쓴다. 전체 합(total)은 당사 축 조항이 모집단 전체에
     복제된 값을 품고 있어 「협력업체 불허」로 읽히면 거짓이 된다 — 그래서 그 경로를 수치 정의에 두지 않는다. */
  { id: "ai4.denyPartner", block: "AI4", ko: "협력업체 축 불허 건수", def: "협력업체 축 조항의 불허 **행** 수",
    from: "pgDecide:partnerCounts.DENY", absent: "판정이 서지 않으면 「아직 없음」", grade: "DEMO",
    renderRule: "당사 축 불허와 같은 칸에 합치지 않는다 — 분모가 다르다(행 기준 / 조항 1건 기준)" },
  { id: "ai4.pendingPartner", block: "AI4", ko: "협력업체 축 판정 보류 건수", def: "협력업체 축 조항의 보류 행 수",
    from: "pgDecide:partnerCounts.INDETERMINATE", absent: "같다", grade: "DEMO" },
  { id: "ai4.denySelf", block: "AI4", ko: "당사 축 불허 조항 수", def: "당사 축 조항 중 불허가 선 **조항** 수",
    from: "pgDecide:selfAxis.byDecision.DENY", absent: "같다", grade: "REAL",
    renderRule: "조항 1건 기준이다 — 행 수로 세면 조항 하나가 분모 전체를 만든다" },
  { id: "ai4.unverified", block: "AI4", ko: "법령 미확인 보류 조항 수", def: "확인 등급이 원문확인이 아니라 집행이 보류된 조항 수",
    from: "pgDecide:unverified.length", absent: "—", grade: "REAL" },
  { id: "ai4.notYet", block: "AI4", ko: "시행 전 조항 수", def: "시행일이 도래하지 않은 조항 수",
    from: "pgDecide:notYet.length", absent: "0이면 「해당 없음」과 섞지 않는다", grade: "REAL" },
  { id: "ai4.fatal", block: "AI4", ko: "치명 결함 건수", def: "협력업체 축 결함 3등급 중 치명",
    from: "pgDecide:defect.partnerAxis", absent: "—", grade: "DEMO" },
  { id: "ai4.noDefense", block: "AI4", ko: "소명 없이 집행된 건수", def: "사전 통지 · 소명 없이 집행이 일어난 건수",
    from: "log:pgActionStats.noDefense", absent: "0이면 「막은 것 없음」", grade: "REAL" },
  { id: "ai4.exportHead", block: "AI4", ko: "반출 머리말 줄 수", def: "산출물 첫머리에 들어가는 머리말 줄 수",
    from: "spec:PG_EXPORT_HEAD.length", absent: "—", grade: "REAL" },
  { id: "ai4.logN", block: "AI4", ko: "결정 로그 건수", def: "판정 호출 · 승인 기록 수",
    from: "log:pgAuditAll", absent: "0이면 「기록 없음」", grade: "REAL" },
];

/* ══════════════ 조회 헬퍼 ══════════════ */
function pgAiBlock(id) { for (const b of PG_AI_BLOCKS) if (b.id === id) return b; return null; }
function pgAiMetric(id) { for (const m of PG_AI_METRICS) if (m.id === id) return m; return null; }
function pgAiMetricsOf(block) { return PG_AI_METRICS.filter((m) => m.block === block); }
function pgAiAxis(id) { for (const a of PG_AI_AXES) if (a.id === id) return a; return null; }
function pgAiAction(id) { for (const a of PG_AI_ACTIONS) if (a.id === id) return a; return null; }
function pgAiActionsOf(agentId) { return PG_AI_ACTIONS.filter((a) => a.agent === agentId); }
function pgAiDecl(k) { return PG_AI_DECL[k] || ""; }
function pgAiNoticeText(row) {
  if (!row) return "";
  if (row.src === "PG_AI_DOCK_NOTICE") return PG_AI_DOCK_NOTICE[row.key] || "";
  if (row.src === "PG_DECL") { try { return (typeof PG_DECL !== "undefined") ? (PG_DECL[row.key] || "") : ""; } catch (e) { return ""; } }
  return "";
}
function pgAiNoticeOf(gid) { return PG_AI_NOTICE.filter((r) => r.gid === gid); }
/* 외부 생성형 AI 전송통제 7항목 — **그대로 재사용**한다. 여기에 복제하지 않는다(§8-2 A-07).
   ⚠ 함수 안에서 읽는다 — 그 원천은 컴포넌트 파일에 있고 번들 순서가 바뀌면 TDZ 로 죽는다. */
function pgAiCtrl() {
  try { if (typeof CMP_AICTRL !== "undefined" && Array.isArray(CMP_AICTRL)) return CMP_AICTRL.slice(); } catch (e) {}
  return [];
}
function _pgAiAsOf(ctx) {
  const c = ctx || {};
  if (c.asOf) return c.asOf;
  try { if (typeof PG_ASOF !== "undefined") return PG_ASOF; } catch (e) {}
  return "2026-10-25";
}
function _pgAiRank() { try { return (typeof PG_VERIFY_RANK !== "undefined") ? PG_VERIFY_RANK : null; } catch (e) { return null; } }

/* ══════════════ 표준 매핑표 — 레지스트리에서 **파생**한다 ══════════════
   이름 · 성질 · 확인 등급 · 현행 버전 · 시행일 · 제재 · 집행 유예 · 수범자는 전부 레지스트리 값이다.
   조문 번호는 pgLawRender 게이트를 지난 것만 실린다(§6-4). */
function pgAiStdRow(lawId) {
  let L = null, vmin = "미확인", top = null;
  try { L = (typeof pgLaw === "function") ? pgLaw(lawId) : null; } catch (e) { L = null; }
  if (!L) return { lawId: lawId, found: false, name: "", verified: "미확인", label: "근거 기준 미등재" };
  try { vmin = (typeof pgLawVerifiedMin === "function") ? pgLawVerifiedMin(lawId) : (L.verified || "미확인"); } catch (e) { vmin = L.verified || "미확인"; }
  try { top = (typeof pgLawRender === "function") ? pgLawRender(lawId, null) : null; } catch (e) { top = null; }
  const arts = [];
  if (L.articles) for (const a of Object.keys(L.articles)) {
    let rn = null;
    try { rn = (typeof pgLawRender === "function") ? pgLawRender(lawId, a) : null; } catch (e) { rn = null; }
    arts.push({ key: a, label: rn ? rn.label : "", article: rn ? rn.article : null,
      verified: rn ? rn.verified : "미확인", effectiveDate: rn ? rn.effectiveDate : null, note: L.articles[a].note || "" });
  }
  return {
    lawId: lawId, found: true, name: L.name, basis: L.basis, verified: vmin,
    lawVersion: (top && top.lawVersion) || null, article: (top && top.article) || null,
    effectiveDate: L.effectiveDate || null, sanction: L.sanction || null,
    grace: L.enforcementGrace || null, appliesToSelf: !!L.appliesToSelf, cite: L.cite || null,
    source: (top && top.source) || null, note: L.note || "", articles: arts,
    label: (top && top.label) || L.name,
  };
}
/* 축의 표준 매핑 한 줄 — **번호는 확인 등급 게이트를 지난 뒤에만** 붙는다.
   게이트를 이 함수 하나로 모으는 이유: 지면마다 다시 판단하면 한 자리만 느슨해져도 번호가 샌다. */
function pgAiStdRender(ref) {
  const row = pgAiStdRow(ref.lawId);
  const rank = _pgAiRank();
  const full = rank ? (rank[row.verified] >= rank["원문확인"]) : (row.verified === "원문확인");
  return {
    lawId: ref.lawId, name: row.name, basis: row.basis, verified: row.verified,
    objective: ref.objective || "",
    numLabel: (full && ref.numLabel) ? ref.numLabel : null,
    numHeld: !!ref.numLabel,
    numGate: (ref.numLabel && !full) ? pgAiDecl("numberGate") : (ref.numLabel ? null : pgAiDecl("isoGate")),
    caution: ref.caution || null,
    appliesToSelf: row.appliesToSelf, cite: row.cite, found: row.found,
  };
}

/* ══════════════ 협력업체 AI 점검 7축 집계 ══════════════
   화면이 세지 않는다. 축별 확인 등급 · 증거 상태 · 미제출 건수를 전부 반환 필드로 돌려준다. */
var _pgAiRollCache = null;
function pgAiRollReset() { _pgAiRollCache = null; return true; }
function pgAiRoll(opt) {
  const o = opt || {};
  const asOf = _pgAiAsOf(o);
  if (_pgAiRollCache && _pgAiRollCache.asOf === asOf) return _pgAiRollCache;

  let fieldKeys = [];
  try { if (typeof PG_FIELD_KEYS !== "undefined") fieldKeys = PG_FIELD_KEYS.map((k) => String(k).replace(/\[\]$/, "")); } catch (e) { fieldKeys = []; }
  /* 모집단 — 협력업체 축이다(거래처 수에서 같은 법인 중복을 뺀 값). 롤업이 서지 않으면 「아직 없음」 */
  let partnerN = null, recs = [];
  try { if (typeof pgPartnerRecs === "function") recs = pgPartnerRecs() || []; } catch (e) { recs = []; }
  try { if (typeof pgRollup === "function") { const R = pgRollup(); partnerN = (R && R.meta) ? R.meta.partnerN : null; } } catch (e) { partnerN = null; }

  const rank = _pgAiRank();
  const verifiedMix = {}, axes = [];
  let numHeld = 0, numShown = 0, evidenceN = 0, gapN = 0, submitAbsent = 0, submitHave = 0, declaredCells = 0;

  for (const ax of PG_AI_AXES) {
    const std = ax.std.map((s) => pgAiStdRender(s));
    /* 축의 확인 등급 = 그 축이 기대는 기준들의 **최솟값**. 하나라도 미확인이면 축이 미확인이다 */
    let v = "원문확인";
    if (!std.length) v = "미확인";
    else for (const s of std) if (!rank || rank[s.verified] < rank[v]) v = s.verified;
    verifiedMix[v] = (verifiedMix[v] || 0) + 1;
    for (const s of std) { if (s.numHeld) numHeld += 1; if (s.numLabel) numShown += 1; }

    /* 증거 — 사전에 있는 키만 산다. 사전 밖 키는 **선언 오류**로 표시하고 조용히 떨어뜨리지 않는다 */
    const ev = [];
    for (const e of (ax.evidence || [])) {
      const inDict = fieldKeys.indexOf(String(e.k).replace(/\[\]$/, "")) >= 0;
      let have = 0, absent = 0;
      for (const pr of recs) {
        const bag = pr && pr.submit ? pr.submit : null;
        const val = bag ? bag[e.k] : undefined;
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && !val.length)) absent += 1; else have += 1;
      }
      if (inDict) { evidenceN += 1; submitAbsent += absent; submitHave += have; declaredCells += recs.length; }
      let ko = "";
      try { if (inDict && typeof pgFieldOf === "function") { const f = pgFieldOf(e.k); ko = f ? f.ko : ""; } } catch (x) { ko = ""; }
      ev.push({ k: e.k, ko: ko, why: e.why, partial: e.partial || null, inDict: inDict,
        absent: recs.length ? absent : null, have: recs.length ? have : null,
        state: !inDict ? "사전 미등재" : (recs.length ? (have ? "일부 제출" : "미제출") : "아직 없음") });
    }
    if (!ax.evidence || !ax.evidence.length) gapN += 1;

    axes.push({
      id: ax.id, ko: ax.ko, sees: ax.sees, verified: v, std: std,
      evidence: ev, evidenceDeclared: (ax.evidence || []).length,
      gap: ax.gap || null, gapText: (ax.gap ? pgAiDecl("evidenceGap") : null),
      reuse: ax.reuse || null, reuseItems: ax.reuse === "CMP_AICTRL" ? pgAiCtrl() : [],
    });
  }

  /* 표준 매핑표 — 레지스트리 파생 행. 단일 항목 규약 위반은 pgAiAudit 이 잡는다 */
  const stdRows = PG_AI_STD.map((s) => Object.assign({}, pgAiStdRow(s.lawId), { applies: s.applies, range: s.range, why: s.why }));
  let articleAll = 0, articleShown = 0, selfN = 0;
  for (const r of stdRows) {
    if (r.appliesToSelf) selfN += 1;
    for (const a of (r.articles || [])) { articleAll += 1; if (a.article) articleShown += 1; }
  }
  const ctrl = pgAiCtrl();

  const out = {
    asOf: asOf, ver: PG_AI_VER,
    axisN: PG_AI_AXES.length, axes: axes, verifiedMix: verifiedMix,
    numHeld: numHeld, numShown: numShown, numGate: pgAiDecl("numberGate"),
    evidenceN: evidenceN, gapN: gapN,
    partnerN: partnerN, recN: recs.length,
    submit: recs.length
      ? { absent: submitAbsent, have: submitHave, cells: declaredCells, available: true }
      : { absent: null, have: null, cells: null, available: false, hint: "모집단 레코드가 아직 서지 않았습니다" },
    std: stdRows, stdN: PG_AI_STD.length, selfN: selfN,
    articleAll: articleAll, articleShown: articleShown,
    ctrl: ctrl, ctrlN: ctrl.length,
    ctrlAbsent: ctrl.length ? null : "원천 미적재 — 외부 생성형 AI 전송통제 항목을 읽을 수 없습니다",
    owner: pgAiDecl("axisOwner"), twoWays: pgAiDecl("twoWays"),
  };
  _pgAiRollCache = out;
  return out;
}

/* ══════════════ 에이전트 출력 — 숫자의 원천 하나 ══════════════
   슬롯 값을 만드는 **유일한 자리**다. 액션마다 따로 계산하면 두 번째 추정 로직이 생긴다.
   ★ 반환값에 `from` 을 함께 실어 지면이 경로를 같이 찍는다 — 숫자 옆에 원천이 없으면
     「판정기 반환값인지」를 독자가 확인할 수 없다. */
function _pgAiFacts(ctx) {
  const o = ctx || {};
  const asOf = _pgAiAsOf(o);
  const f = { available: false, asOf: asOf };
  let V = null;
  try { if (typeof pgVerdictRoll === "function") V = pgVerdictRoll({ asOf: asOf, level: o.level || "L1", stage: o.stage || "거래중" }); } catch (e) { V = null; }
  let R = null;
  try { if (typeof pgRollup === "function") R = pgRollup(); } catch (e) { R = null; }
  if (V) {
    f.available = true;
    f["rollup:meta.partnerN"] = (R && R.meta) ? R.meta.partnerN : V.partnerN;
    f["policy:PG_POLICIES.length"] = V.policyN;
    /* 축을 가른 값만 싣는다 — 전체 합은 경로 자체를 두지 않는다(수치 정의에도 없다) */
    f["pgDecide:partnerCounts.DENY"] = V.partnerCounts ? V.partnerCounts.DENY : null;
    f["pgDecide:partnerCounts.INDETERMINATE"] = V.partnerCounts ? V.partnerCounts.INDETERMINATE : null;
    f["pgDecide:selfAxis.byDecision.DENY"] = (V.selfAxis && V.selfAxis.byDecision) ? V.selfAxis.byDecision.DENY : null;
    f["pgDecide:unverified.length"] = (V.unverified || []).length;
    f["pgDecide:notYet.length"] = (V.notYet || []).length;
    f["pgDecide:defect.partnerAxis"] = (V.defect && V.defect.partnerAxis) ? (V.defect.partnerAxis["치명"] || 0) : null;
  }
  try { if (typeof pgActionStats === "function") { f["log:pgActionStats.noDefense"] = pgActionStats().noDefense; } } catch (e) {}
  try { if (typeof PG_EXPORT_HEAD !== "undefined") f["spec:PG_EXPORT_HEAD.length"] = PG_EXPORT_HEAD.length; } catch (e) {}
  return f;
}
/* 문안 조립 — 틀에는 숫자가 없고 슬롯만 있다. 슬롯이 하나라도 비면 문장을 만들지 않는다
   (빈칸을 0으로 메우면 「데이터 없음」이 「문제 없음」으로 읽힌다 · 수치 규약 1 · 3). */
function _pgAiFill(action, facts) {
  const slots = [], miss = [];
  for (const n of action.nums) {
    const v = facts[n.from];
    if (v === undefined || v === null) { miss.push({ slot: n.slot, mid: n.mid, from: n.from }); continue; }
    slots.push({ slot: n.slot, mid: n.mid, from: n.from, value: v });
  }
  if (miss.length) return { ok: false, miss: miss, slots: slots };
  let msg = String(action.template);
  for (const s of slots) msg = msg.split("{" + s.slot + "}").join(String(s.value));
  return { ok: true, msg: msg, slots: slots, miss: [] };
}

/* 에이전트 확장 — SC_AGENTS 의 한 행에 선언을 얹어 돌려준다. 컴포넌트는 이것을 렌더만 한다. */
function pgAgentExt(id) { for (const a of PG_AI_AGENTS) if (a.id === id) return a; return null; }
function pgAgentRoll(ctx) {
  const facts = _pgAiFacts(ctx);
  let base = [];
  try { if (typeof SC_AGENTS !== "undefined" && Array.isArray(SC_AGENTS)) base = SC_AGENTS; } catch (e) { base = []; }
  const rows = [];
  for (const ex of PG_AI_AGENTS) {
    const b = base.filter((x) => x.id === ex.id)[0] || null;
    const acts = pgAiActionsOf(ex.id).map((a) => {
      const fill = _pgAiFill(a, facts);
      return { id: a.id, ko: a.ko, asks: a.asks, hitl: a.hitl, blocks: a.blocks, effect: a.effect,
        approvalBy: a.approvalBy || null, why: a.why,
        available: fill.ok, msg: fill.ok ? fill.msg : null, slots: fill.slots, miss: fill.miss,
        hint: fill.ok ? null : "판정 집계가 아직 서지 않아 숫자를 채울 수 없습니다 — 빈칸을 0으로 메우지 않습니다" };
    });
    rows.push({
      id: ex.id, base: ex.base, baseFound: !!b,
      t: b ? b.t : null, scope: b ? b.scope : null, color: b ? b.c : null,
      owns: b ? b.owns.concat(ex.ownsAdd) : ex.ownsAdd.slice(),
      ownsBase: b ? b.owns.slice() : [], ownsAdd: ex.ownsAdd.slice(),
      kpi: b ? b.kpi.concat(ex.kpiAdd) : ex.kpiAdd.slice(),
      kpiBase: b ? b.kpi.slice() : [], kpiAdd: ex.kpiAdd.slice(),
      guardBase: b ? b.guard : null, guardAdd: ex.guardAdd, why: ex.why,
      actions: acts,
      baseAbsent: b ? null : "기준 에이전트 카드를 읽을 수 없습니다 — 거래 운영 에이전트 원천이 적재되지 않았습니다",
    });
  }
  let logN = 0, logRows = [];
  try { if (typeof pgAuditAll === "function") { logRows = pgAuditAll(); logN = logRows.length; } } catch (e) { logN = 0; }
  const byActor = {};
  for (const r of logRows) byActor[r.actorKind] = (byActor[r.actorKind] || 0) + 1;
  let actorKinds = [];
  try { if (typeof PG_ACTOR_KINDS !== "undefined") actorKinds = PG_ACTOR_KINDS.slice(); } catch (e) { actorKinds = []; }
  return {
    asOf: facts.asOf, agents: rows, agentN: PG_AI_AGENTS.length, actionN: PG_AI_ACTIONS.length,
    hitlN: PG_AI_ACTIONS.filter((a) => a.hitl).length,
    hitl: PG_AI_HITL, base: PG_AI_AGENT_BASE,
    facts: { available: facts.available, hint: facts.available ? null : "판정 집계 경로가 적재되지 않았습니다" },
    log: { n: logN, byActor: byActor, kinds: actorKinds, rows: logRows.slice(-PG_AI_LOG_PAGE),
      empty: logN === 0 ? pgAiDecl("logEmpty") : null },
    owner: pgAiDecl("agentOwner"), nums: pgAiDecl("agentNums"), gate: pgAiDecl("hitlGate"), actor: pgAiDecl("hitlActor"),
  };
}
const PG_AI_LOG_PAGE = 12;   /* 결정 로그 표시 줄 수 — **표시 기준**이고 판정 임계가 아니다 */

/* ══════════════ 사람 승인 게이트 — G-02 의 구현 ══════════════
   ★ 로그에 쓰는 경로다. **렌더가 부르면** 지면을 여는 것만으로 기록이 불어나고 「누가 무엇을 했나」가
     거짓이 된다(P5a 가 반출 집행에서 막은 바로 그 사고 · 실측으로 여기서도 재발했다 — 자기 검사
     G-02 가 게이트를 확인하려고 이 함수를 불렀고 그 호출이 결정 로그에 6건을 남겼다).
   ★ 그래서 `ctx.dryRun` 을 둔다 — 게이트 판정은 그대로 하고 **기록만 하지 않는다.**
     검사가 기록을 남기면 기록이 검사의 산물이 되어 「실제로 무엇이 일어났나」를 말할 수 없다.
     기록 경로 자체의 양성 확인은 러너가 소유한다(dryRun 없이 한 번 불러 로그를 센다). */
function pgAgentRun(agentId, actionId, ctx) {
  const a = pgAiAction(actionId);
  if (!a) return { ok: false, why: "등재되지 않은 액션 — 선언 밖 액션은 실행되지 않는다" };
  if (a.agent !== agentId) return { ok: false, why: "이 에이전트의 액션이 아니다 — " + a.agent + " 소관" };
  const facts = _pgAiFacts(ctx);
  const fill = _pgAiFill(a, facts);
  if (!fill.ok) return { ok: true, available: false, action: a.id, ko: a.ko, miss: fill.miss,
    hint: "판정 집계가 아직 서지 않아 숫자를 채울 수 없습니다 — 빈칸을 0으로 메우지 않습니다" };
  /* 판정 호출은 **판정기 행위자**로 남는다. 승인과 구분되는 자리가 여기다 */
  const dry = !!(ctx && ctx.dryRun);
  let logged = null;
  try {
    if (!dry && typeof pgAuditAppend === "function")
      logged = pgAuditAppend({ actor: "SYS-PGDECIDE", action: "판정 호출", target: a.id,
        result: a.ko, risk: a.hitl ? "중간" : "낮음", via: "에이전트 호출", ctx: { asOf: facts.asOf } });
  } catch (e) { logged = null; }
  const common = { ok: true, available: true, action: a.id, agent: a.agent, ko: a.ko,
    msg: fill.msg, slots: fill.slots, effect: a.effect, blocks: a.blocks,
    dryRun: dry, logged: !!(logged && logged.ok), logNote: dry ? pgAiDecl("dryRun") : null };
  if (!a.hitl) return Object.assign(common, { executed: true, status: "조회 완료", gate: null });
  return Object.assign(common, {
    executed: false, status: "승인대기",
    ticket: { action: a.id, agent: a.agent, at: facts.asOf, approvalBy: a.approvalBy || PG_AI_HITL.approver },
    gate: PG_AI_HITL.gate,
  });
}
function pgAgentApprove(ticket, approver, ctx) {
  if (!ticket || !ticket.action) return { ok: false, why: "승인할 요청이 없다" };
  const a = pgAiAction(ticket.action);
  if (!a) return { ok: false, why: "등재되지 않은 액션" };
  if (!a.hitl) return { ok: false, why: "사람 승인이 필요하지 않은 액션 — 승인 기록을 만들지 않는다" };
  let kind = null;
  try { kind = (typeof pgActorKind === "function") ? pgActorKind(approver) : null; } catch (e) { kind = null; }
  if (kind !== "EMP") return { ok: false, why: "임직원만 승인할 수 있다 — 판정기는 승인자가 될 수 없다", actorKind: kind };
  const dry = !!(ctx && ctx.dryRun);
  let logged = null;
  try {
    if (!dry && typeof pgAuditAppend === "function")
      logged = pgAuditAppend({ actor: approver, action: "집행", target: a.id, result: "요청 등재",
        risk: "중간", via: "승인 경유", ctx: { asOf: _pgAiAsOf(ctx) } });
  } catch (e) { logged = null; }
  /* ★ 승인해도 **실행되지 않는다.** 이 지면이 하는 일은 요청 등재와 기록까지다(§7-8) */
  return { ok: true, approved: true, executed: false, status: "승인 완료 — 요청 등재",
    action: a.id, approver: approver, actorKind: kind, effect: a.effect,
    dryRun: dry, logged: !!(logged && logged.ok), logNote: dry ? pgAiDecl("dryRun") : null,
    gate: PG_AI_HITL.gate };
}

/* ══════════════ 자기 거버넌스 실측 — G-01 ~ G-09 ══════════════
   ★ 선언은 PG_SELF_GOV 가 소유하고 **측정은 여기서** 한다. 한 곳에 두면 선언이 자기를 통과시킨다.
   ★ 각 항목은 {ok, measured, from} 을 돌려준다. 측정 경로가 없는 항목은 ok 를 만들지 않고
     「실측 경로 없음」으로 적는다 — 측정하지 않은 것을 통과로 적지 않는다. */
function _pgGovG01() {
  /* 틀에 숫자가 없는가 + 모든 슬롯이 선언 경로를 지나는가 */
  let prefixes = [];
  try { if (typeof PG_SRC !== "undefined") prefixes = PG_SRC.map((s) => s.p); } catch (e) { prefixes = []; }
  let digits = 0, slots = 0, outside = 0, noMid = 0;
  for (const a of PG_AI_ACTIONS) {
    digits += (String(a.template).match(/[0-9]/g) || []).length;
    for (const n of a.nums) {
      slots += 1;
      if (!prefixes.length || !prefixes.filter((p) => String(n.from).indexOf(p) === 0).length) outside += 1;
      if (!pgAiMetric(n.mid)) noMid += 1;
    }
  }
  /* ★ 사정권을 **숫자로 적는다.** 거버넌스 출력만 세고 「0건」이라 쓰면, 같은 에이전트 카드에 붙은
     거래 운영 액션의 숫자가 사정권 밖에서 조용히 산다 — 그 액션들의 본문을 실제로 읽어 함께 센다.
     거래 운영 출력의 숫자는 거래 사실 레이어 반환 필드에서 오는 것이 정상이지만, **화면이 만든
     추정값**(임계 · 비율을 액션 본문에 적어 곱한 자리)은 같은 성질의 결함이므로 이름을 대고 남긴다. */
  const trade = { available: false, scopeNote: pgAiDecl("g01Scope") };
  try {
    if (typeof SC_AGENT_ACTIONS !== "undefined") {
      const rows = [];
      let n = 0;
      for (const k of Object.keys(SC_AGENT_ACTIONS)) for (const act of SC_AGENT_ACTIONS[k]) {
        n += 1;
        const src = String(act.run);
        const lits = (src.match(/[0-9]+(?:\.[0-9]+)?/g) || []);
        if (lits.length) rows.push({ agent: k, action: act.t, literals: lits });
      }
      trade.available = true; trade.actions = n; trade.withLiteral = rows.length; trade.rows = rows;
    }
  } catch (e) { trade.available = false; }
  return { ok: digits === 0 && outside === 0 && noMid === 0,
    measured: { scope: "거버넌스 출력", templateDigits: digits, slots: slots, outsidePrefix: outside,
      undeclaredMetric: noMid, actions: PG_AI_ACTIONS.length,
      tradeScope: trade.available ? (trade.withLiteral + " / " + trade.actions) : "원천 미적재",
      tradeLiterals: trade.available ? trade.rows.map((r) => r.action + "(" + r.literals.join(",") + ")") : [] },
    from: "spec:PG_AI_ACTIONS + spec:PG_SRC", trade: trade };
}
function _pgGovG02(ctx) {
  /* 양성 · 음성 둘 다 본다 — 승인 없이 호출하면 실행되지 않고, 임직원 아닌 승인은 거부된다.
     ★ **기록하지 않는 호출**이다(dryRun). 검사가 로그를 남기면 그 로그가 검사의 산물이 되어
       「실제로 무엇이 일어났나」를 말할 수 없다. 기록 경로의 양성 확인은 러너가 소유한다. */
  const dry = Object.assign({}, ctx || {}, { dryRun: true });
  const hitl = PG_AI_ACTIONS.filter((a) => a.hitl);
  let ranWithout = 0, blocked = 0, badApprover = 0, okApprover = 0, wrote = 0;
  for (const a of hitl) {
    const r = pgAgentRun(a.agent, a.id, dry);
    if (r.available === false) continue;
    if (r.executed) ranWithout += 1; else blocked += 1;
    if (r.logged) wrote += 1;
    const bad = pgAgentApprove(r.ticket, "SYS-PGDECIDE", dry);
    if (!bad.ok) badApprover += 1;
    const good = pgAgentApprove(r.ticket, "EMP0001", dry);
    if (good.ok && good.executed === false) okApprover += 1;
    if (good.logged) wrote += 1;
  }
  /* 승인 필수 목록의 **입구 분모** — 입구가 있는 줄은 게이트를 지난 액션이어야 하고,
     입구가 없는 줄은 사유가 있어야 한다. 적지 않으면 「승인 필수 6건」이 3건만 검사된다. */
  const entryBad = [];
  for (const m of PG_AI_HITL.must) {
    if (m.entry) { const a = pgAiAction(m.entry); if (!a || !a.hitl) entryBad.push(m.what); }
    else if (!m.why) entryBad.push(m.what);
  }
  return { ok: ranWithout === 0 && blocked > 0 && badApprover === hitl.length && entryBad.length === 0 && wrote === 0,
    pop: hitl.length, popKo: "승인 게이트가 걸린 액션",
    measured: { hitlActions: hitl.length, executedWithoutApproval: ranWithout, heldForApproval: blocked,
      nonHumanApproverRejected: badApprover, approvedButNotExecuted: okApprover,
      must: PG_AI_HITL.must.length, mustWithEntry: PG_AI_HITL.must.filter((m) => m.entry).length,
      mustNoEntry: PG_AI_HITL.must.filter((m) => !m.entry).map((m) => m.what),
      entryBad: entryBad, logWritesByProbe: wrote },
    from: "spec:PG_AI_HITL" };
}
function _pgGovG03() {
  let kinds = [], rows = [];
  try { if (typeof PG_ACTOR_KINDS !== "undefined") kinds = PG_ACTOR_KINDS; } catch (e) { kinds = []; }
  try { if (typeof pgAuditAll === "function") rows = pgAuditAll(); } catch (e) { rows = []; }
  const by = {};
  let noKind = 0;
  for (const r of rows) { if (!r.actorKind) noKind += 1; else by[r.actorKind] = (by[r.actorKind] || 0) + 1; }
  /* ★ 모집단을 함께 돌려준다(2026-10-26). 이 항목의 검증 기준은 「**결정 로그에서** 구분된다」이므로
     로그가 0행이면 기준이 **한 번도 작동한 적이 없다.** 종전에는 `ok: kinds>=3 && noKind===0` 이
     0행에서 참이 되어 지면이 「실측 충족」 녹색 배지를 달았다 — 바로 아래 note 가 「0을 「문제 없음」으로
     읽히게 두지 않습니다」라고 적는데 배지가 정확히 그것을 했다. 이 저장소가 두 번 겪은 「0 = 0 녹색」이다. */
  return { ok: kinds.length >= 3 && noKind === 0,
    pop: rows.length, popKo: "결정 · 감사 로그 행",
    measured: { kinds: kinds.map((k) => k.k), logN: rows.length, byActorKind: by, withoutKind: noKind,
      note: rows.length ? null : pgAiDecl("logEmpty") },
    from: "log:pgAuditAll + policy:PG_ACTOR_KINDS" };
}
function _pgGovG04() {
  const dicts = [];
  try { if (typeof PG_FORBID !== "undefined") dicts.push({ name: "PG_FORBID", n: PG_FORBID.length, owner: "용어 원천(P1)" }); } catch (e) {}
  try { if (typeof HM_SCRIPT_FORBID !== "undefined") dicts.push({ name: "HM_SCRIPT_FORBID", n: HM_SCRIPT_FORBID.length, owner: "대본 가드" }); } catch (e) {}
  try { if (typeof hmScriptGuard === "function") dicts.push({ name: "hmScriptGuard", n: null, owner: "대본 가드(함수)" }); } catch (e) {}
  /* 이 파일이 새 금칙 사전을 만들지 않았는가 — 만들면 사전이 이원화된다 */
  const mine = typeof PG_AI_MEMBER_FORBID !== "undefined" ? 1 : 0;
  return { ok: dicts.length >= 1,
    measured: { dicts: dicts, newWordDict: 0,
      note: "이 파일이 가진 목록(" + (mine ? "PG_AI_MEMBER_FORBID" : "없음") + ")은 **원천 이름** 목록이고 낱말 금칙 사전이 아니다 — 낱말은 금칙 사전 하나가 소유한다" },
    from: "terms:PG_FORBID" };
}
function _pgGovG05() {
  let sc = [], hi = [];
  try { if (typeof SC_AGENTS !== "undefined") sc = SC_AGENTS.map((a) => a.id); } catch (e) { sc = []; }
  try { if (typeof HI_AGENTS !== "undefined") hi = HI_AGENTS.map((a) => a.id); } catch (e) { hi = []; }
  const scDrift = sc.length ? sc.filter((x) => PG_AI_AGENT_BASE.sc.indexOf(x) < 0).concat(PG_AI_AGENT_BASE.sc.filter((x) => sc.indexOf(x) < 0)) : null;
  const hiDrift = hi.length ? hi.filter((x) => PG_AI_AGENT_BASE.hi.indexOf(x) < 0).concat(PG_AI_AGENT_BASE.hi.filter((x) => hi.indexOf(x) < 0)) : null;
  const outside = PG_AI_AGENTS.filter((a) => PG_AI_AGENT_BASE.sc.indexOf(a.id) < 0).map((a) => a.id);
  const loaded = sc.length > 0 || hi.length > 0;
  return { ok: loaded && outside.length === 0 && (scDrift === null || !scDrift.length) && (hiDrift === null || !hiDrift.length),
    measured: { extended: PG_AI_AGENTS.map((a) => a.id), newAgents: 0, outsideBase: outside,
      scIds: sc, hiIds: hi, scDrift: scDrift, hiDrift: hiDrift,
      note: loaded ? null : "에이전트 명단 원천이 적재되지 않았습니다 — 실측 경로 없음" },
    from: "spec:PG_AI_AGENT_BASE" };
}
function _pgGovG06() {
  let members = [];
  try { if (typeof HI_AGENTS !== "undefined") members = HI_AGENTS.filter((a) => a.ready); } catch (e) { members = []; }
  const hits = [];
  for (const a of members) {
    const txt = (a.knowledge || []).join(" | ");
    for (const s of PG_AI_MEMBER_FORBID.sources)
      if (txt.indexOf(s) >= 0) hits.push({ agent: a.id, source: s, where: "knowledge" });
    for (const w of PG_AI_MEMBER_FORBID.axes)
      if ((a.scope && a.scope.words ? a.scope.words : []).indexOf(w) >= 0) hits.push({ agent: a.id, source: w, where: "scope.words" });
  }
  return { ok: members.length > 0 && hits.length === 0,
    measured: { memberAgents: members.map((a) => a.id), sensitiveHits: hits, forbidSources: PG_AI_MEMBER_FORBID.sources.length,
      forbidAxes: PG_AI_MEMBER_FORBID.axes, note: members.length ? pgAiDecl("memberBlock") : "회원 대면 에이전트 명단이 적재되지 않았습니다 — 실측 경로 없음" },
    from: "spec:PG_AI_MEMBER_FORBID" };
}
function _pgGovG07() {
  let head = [], limit = "", mid = null;
  try { if (typeof PG_EXPORT_HEAD !== "undefined") head = PG_EXPORT_HEAD; } catch (e) { head = []; }
  for (const h of head) if (h.id === "limit") limit = h.text || "";
  try { mid = (typeof pgMetric === "function") ? pgMetric("b7.limit") : null; } catch (e) { mid = null; }
  return { ok: !!limit && !!mid,
    measured: { limitText: limit ? limit.length : 0, headLines: head.length, metric: mid ? mid.id : null,
      usedBy: ["b7.limit", "PG_EXPORT_HEAD"] },
    from: "spec:PG_EXPORT_HEAD" };
}
function _pgGovNoticeMeasure(gid) {
  const rows = pgAiNoticeOf(gid);
  const out = [], empty = [];
  for (const r of rows) {
    const t = pgAiNoticeText(r);
    out.push({ at: r.at, file: r.file, src: r.src, key: r.key, chars: t.length, owner: r.owner });
    if (!t) empty.push(r.at);
  }
  return { ok: rows.length >= 2 && empty.length === 0,
    pop: rows.length, popKo: "고지 렌더 자리",
    measured: { places: out, n: rows.length, empty: empty },
    from: "spec:PG_AI_NOTICE" };
}
function pgSelfGovRoll(ctx) {
  let decl = [];
  try { if (typeof PG_SELF_GOV !== "undefined") decl = PG_SELF_GOV; } catch (e) { decl = []; }
  const probes = {
    "G-01": _pgGovG01, "G-02": function () { return _pgGovG02(ctx); }, "G-03": _pgGovG03,
    "G-04": _pgGovG04, "G-05": _pgGovG05, "G-06": _pgGovG06, "G-07": _pgGovG07,
    "G-08": function () { return _pgGovNoticeMeasure("G-08"); },
    "G-09": function () { return _pgGovNoticeMeasure("G-09"); },
  };
  const rows = [];
  /* ★ 충족 / 미충족 2값에 **「미계측 — 모집단 0」 제3값**을 더한다(2026-10-26).
     왜: 모집단이 0이면 그 기준은 **한 번도 작동한 적이 없다.** 2값 체계에서는 그 항목이 「충족」으로
     세어져 지면의 가장 인용하기 좋은 줄이 「자기 거버넌스 9 / 9 실측 충족」이 됐다 — 그 중 최소 1건은
     측정이 아니라 공백이었다(G-03 결정 로그 0행). 투자 · 감사 독자가 들고 갈 한 줄이 그것이다.
     「실측된 항목 수」 분자에서 미계측을 **뺀다** — 「7 측정 · 2 미계측 / 9」로 적는다. */
  let measured = 0, okN = 0, lawBacked = 0, unmeasured = 0;
  for (const g of decl) {
    const p = probes[g.id] ? probes[g.id]() : null;
    const law = g.lawRef ? pgAiStdRow(g.lawRef) : null;
    const self = !!(g.self && law && law.appliesToSelf);
    if (self) lawBacked += 1;
    const zeroPop = !!(p && typeof p.pop === "number" && p.pop === 0);
    const state = !p ? "실측 경로 없음" : (zeroPop ? "미계측" : (p.ok ? "충족" : "미충족"));
    if (p) { if (zeroPop) unmeasured += 1; else { measured += 1; if (p.ok) okN += 1; } }
    rows.push({
      id: g.id, ko: g.ko, check: g.check,
      state: state, pop: p && typeof p.pop === "number" ? p.pop : null,
      popKo: (p && p.popKo) || null, popRequired: !!g.popRequired,
      unmeasuredWhy: zeroPop ? pgAiDecl("unmeasured") : null,
      basisKind: self ? "법정 의무" : "설계 규약",
      basisText: self ? pgAiDecl("selfLaw") : pgAiDecl("selfRule"),
      law: law ? { name: law.name, verified: law.verified, label: law.label, appliesToSelf: law.appliesToSelf,
                   sanction: law.sanction, grace: law.grace, effectiveDate: law.effectiveDate } : null,
      notice: pgAiNoticeOf(g.id).map((r) => ({ at: r.at, file: r.file, text: pgAiNoticeText(r), owner: r.owner, why: r.why })),
      probe: p, ok: p ? (zeroPop ? null : p.ok) : null,
      noProbe: p ? null : "실측 경로 없음 — 측정하지 않은 항목을 통과로 적지 않습니다",
      usedBy: g.usedBy || null,
    });
  }
  return { asOf: _pgAiAsOf(ctx), rows: rows, govN: decl.length, measured: measured, okN: okN,
    unmeasured: unmeasured, unmeasuredIds: rows.filter((r) => r.state === "미계측").map((r) => r.id),
    stateLine: measured + " 측정 · " + unmeasured + " 미계측 / " + decl.length,
    lawBacked: lawBacked, noticeN: PG_AI_NOTICE.length, owner: pgAiDecl("selfOwner") };
}

/* ══════════════ 선언 전수 검사 — 느슨해지는 것을 막는다 ══════════════
   엔진 지면 검사와 **같은 형식 · 같은 규칙**이다. 표를 따로 둔 이유는 블록 축이 다르기 때문뿐이다. */
function pgAiAudit() {
  const bad = [];
  let prefixes = [];
  try { if (typeof PG_SRC !== "undefined") prefixes = PG_SRC.map((s) => s.p); } catch (e) { prefixes = []; }
  const blocks = PG_AI_BLOCKS.map((b) => b.id);
  /* ① 블록 — 질문 · 항목 · 원천 */
  const seenB = {};
  for (const b of PG_AI_BLOCKS) {
    if (seenB[b.id]) bad.push({ id: b.id, why: "블록 id 중복" });
    seenB[b.id] = 1;
    if (!b.asks) bad.push({ id: b.id, why: "이 블록이 답하는 질문이 비었다 — 질문 없는 블록은 지면이 아니라 제목이다" });
    if (!b.items || !b.items.length) bad.push({ id: b.id, why: "반드시 들어가는 것이 비었다" });
    if (!b.from) { bad.push({ id: b.id, why: "원천 경로가 비었다" }); continue; }
    if (prefixes.length && !prefixes.filter((p) => b.from.indexOf(p) === 0).length) bad.push({ id: b.id, why: "허용 원천 접두사 밖 — " + b.from });
    if (b.from.indexOf("fin:") === 0) bad.push({ id: b.id, why: "이 지면은 재무 계획 모델을 읽지 않는다" });
  }
  /* ② 수치 — id 충돌 · 원천 · 미제출 처리 · 등급 */
  const seenM = {};
  for (const m of PG_AI_METRICS) {
    if (seenM[m.id]) bad.push({ id: m.id, why: "수치 id 중복" });
    seenM[m.id] = 1;
    try { if (typeof pgMetric === "function" && pgMetric(m.id)) bad.push({ id: m.id, why: "보고서 수치표와 id 가 겹친다 — 같은 수치가 두 표에 산다" }); } catch (e) {}
    try { if (typeof pgEngineMetric === "function" && pgEngineMetric(m.id)) bad.push({ id: m.id, why: "엔진 수치표와 id 가 겹친다" }); } catch (e) {}
    if (blocks.indexOf(m.block) < 0) bad.push({ id: m.id, why: "블록 밖 수치 — " + m.block });
    if (!m.from) { bad.push({ id: m.id, why: "원천 경로가 비었다 — 지면에 설 수 없다" }); continue; }
    if (prefixes.length && !prefixes.filter((p) => m.from.indexOf(p) === 0).length) bad.push({ id: m.id, why: "허용 원천 접두사 밖 — " + m.from });
    if (!m.absent) bad.push({ id: m.id, why: "미제출 처리가 비었다 — 0으로 적히는 자리가 된다" });
    if (!m.grade) bad.push({ id: m.id, why: "출처 등급이 비었다" });
  }
  for (const b of blocks) if (!pgAiMetricsOf(b).length) bad.push({ id: b, why: "수치 정의가 없는 블록" });
  /* ③ 점검 축 — 확인 등급 열의 전제 · 증거의 사전 등재 · 번호를 들고 있지 않은가 */
  let fieldKeys = [];
  try { if (typeof PG_FIELD_KEYS !== "undefined") fieldKeys = PG_FIELD_KEYS.map((k) => String(k).replace(/\[\]$/, "")); } catch (e) { fieldKeys = []; }
  const seenA = {};
  for (const ax of PG_AI_AXES) {
    if (seenA[ax.id]) bad.push({ id: ax.id, why: "점검 축 id 중복" });
    seenA[ax.id] = 1;
    if (!ax.sees) bad.push({ id: ax.id, why: "무엇을 보는가가 비었다" });
    if (!ax.std || !ax.std.length) bad.push({ id: ax.id, why: "근거 기준이 비었다 — 확인 등급 열을 만들 수 없다" });
    for (const s of (ax.std || [])) {
      if (!s.lawId) { bad.push({ id: ax.id, why: "기준 키가 비었다" }); continue; }
      let L = null;
      try { L = (typeof pgLaw === "function") ? pgLaw(s.lawId) : null; } catch (e) { L = null; }
      if (!L) bad.push({ id: ax.id, why: "레지스트리 밖 기준 — " + s.lawId });
      if (!s.objective) bad.push({ id: ax.id + "/" + s.lawId, why: "통제목표 표제가 비었다 — 번호 없이 적을 것이 없으면 매핑이 아니다" });
      /* 번호 축을 들고 있다면 **게이트를 지나야** 한다. 게이트 없이 인쇄되는 자리가 있으면 실패 */
      if (s.numLabel) {
        const r = pgAiStdRender(s);
        const rank = _pgAiRank();
        const full = rank ? (rank[r.verified] >= rank["원문확인"]) : (r.verified === "원문확인");
        if (!full && r.numLabel) bad.push({ id: ax.id + "/" + s.lawId, why: "원문확인이 아닌데 번호가 렌더된다 — 게이트 누출" });
      }
    }
    if ((ax.evidence || []).length) {
      for (const e of ax.evidence) {
        if (!e.k) { bad.push({ id: ax.id, why: "증거 키가 비었다" }); continue; }
        if (!e.why) bad.push({ id: ax.id + "/" + e.k, why: "무엇에 쓰는지가 비었다 — 받으면서 쓰지 않는 입력이 된다" });
        if (fieldKeys.length && fieldKeys.indexOf(String(e.k).replace(/\[\]$/, "")) < 0)
          bad.push({ id: ax.id + "/" + e.k, why: "제출 필드 사전 밖 키 — 사전 밖 필드는 존재하지 않는다" });
      }
    } else if (!ax.gap) {
      bad.push({ id: ax.id, why: "증거가 비었는데 발주 사유가 없다 — 누락과 구별되지 않는다" });
    }
    if (ax.gap && (!ax.gap.why || !ax.gap.next || !ax.gap.owner))
      bad.push({ id: ax.id, why: "발주 사유 · 다음 단계 · 소유자 중 빈 칸이 있다" });
  }
  /* ④ 표준 매핑표 — **단일 항목 규약**. 같은 법령이 두 행에 서면 실패 */
  const seenL = {}, seenName = {};
  for (const s of PG_AI_STD) {
    if (seenL[s.lawId]) bad.push({ id: s.lawId, why: "같은 기준이 두 행에 등재됐다 — 단일 항목 규약 위반" });
    seenL[s.lawId] = 1;
    if (!s.applies) bad.push({ id: s.lawId, why: "적용 대상이 비었다" });
    if (!s.range) bad.push({ id: s.lawId, why: "적용 범위가 비었다" });
    if (!s.why) bad.push({ id: s.lawId, why: "왜 등재했는지가 비었다" });
    const row = pgAiStdRow(s.lawId);
    if (!row.found) { bad.push({ id: s.lawId, why: "레지스트리 밖 기준 — 매핑표가 두 번째 법령 원천이 되면 안 된다" }); continue; }
    if (seenName[row.name]) bad.push({ id: s.lawId, why: "같은 법령명이 두 행에 서 있다 — 제정법과 개정법을 두 항목으로 세운 형태다" });
    seenName[row.name] = 1;
    /* 법률 · 하위법령이 아닌 기준(표준 · 규정 · 문헌)에는 조항 번호 축이 서지 않는다(§6-4 ④ 확장) */
    if (["표준", "규정", "문헌"].indexOf(row.basis) >= 0 && row.article)
      bad.push({ id: s.lawId, why: "표준 · 규정 · 문헌 항목에 조항 · 통제 번호가 실려 있다" });
  }
  /* ⑤ 고지 자리 — 항목마다 자리가 있고 문안이 비지 않았는가 · 검사 소유자가 있는가 */
  for (const gid of ["G-08", "G-09"]) {
    const rows = pgAiNoticeOf(gid);
    if (!rows.length) { bad.push({ id: gid, why: "화면 고지 자리가 없다 — 애블레이션 검사가 셀 것이 없다" }); continue; }
    for (const r of rows) {
      if (!pgAiNoticeText(r)) bad.push({ id: gid + "@" + r.at, why: "고지 문안이 비었다" });
      if (!r.file) bad.push({ id: gid + "@" + r.at, why: "어느 파일에서 렌더되는지가 비었다" });
      if (!r.srcFile) bad.push({ id: gid + "@" + r.at, why: "문안이 어느 파일에 사는지가 비었다 — 애블레이션 대상이 정해지지 않는다" });
      if (!r.render) bad.push({ id: gid + "@" + r.at, why: "렌더 호출 경로가 비었다 — 문구가 있어도 불리지 않는 자리를 구별할 수 없다" });
      if (!r.owner) bad.push({ id: gid + "@" + r.at, why: "검사 소유자가 비었다 — 소유자 없는 규약은 다음 세션에 사라진다" });
      if (!r.why) bad.push({ id: gid + "@" + r.at, why: "자리를 고른 사유가 비었다" });
    }
  }
  /* ⑥ 에이전트 · 액션 — 새 에이전트 0건 · 사람 승인 게이트 · 출력 숫자 */
  for (const a of PG_AI_AGENTS) {
    if (PG_AI_AGENT_BASE.sc.indexOf(a.id) < 0) bad.push({ id: a.id, why: "기준 명단 밖 에이전트 — 새 에이전트를 만들지 않는다" });
    if (!a.ownsAdd.length && !a.kpiAdd.length && !a.guardAdd) bad.push({ id: a.id, why: "확장 선언이 비었다 — 확장하지 않았는데 확장으로 적게 된다" });
    if (!a.why) bad.push({ id: a.id, why: "왜 이 에이전트인지가 비었다" });
  }
  const seenAct = {};
  for (const a of PG_AI_ACTIONS) {
    if (seenAct[a.id]) bad.push({ id: a.id, why: "액션 id 중복" });
    seenAct[a.id] = 1;
    if (!pgAgentExt(a.agent)) bad.push({ id: a.id, why: "확장 선언 밖 에이전트의 액션 — " + a.agent });
    if (!a.template) { bad.push({ id: a.id, why: "문안 틀이 비었다" }); continue; }
    if ((String(a.template).match(/[0-9]/g) || []).length)
      bad.push({ id: a.id, why: "문안 틀에 숫자가 있다 — 틀에 숫자가 있으면 출력의 숫자가 반환 필드에서 왔는지 셀 수 없다" });
    const slots = (String(a.template).match(/\{[^}]+\}/g) || []).map((x) => x.slice(1, -1));
    for (const s of slots) if (!a.nums.filter((n) => n.slot === s).length)
      bad.push({ id: a.id, why: "선언되지 않은 슬롯 — " + s });
    for (const n of a.nums) {
      if (slots.indexOf(n.slot) < 0) bad.push({ id: a.id, why: "틀에 없는 슬롯 선언 — " + n.slot });
      if (prefixes.length && !prefixes.filter((p) => String(n.from).indexOf(p) === 0).length)
        bad.push({ id: a.id, why: "허용 원천 접두사 밖 — " + n.from });
      if (!pgAiMetric(n.mid)) bad.push({ id: a.id, why: "수치 정의 밖 — " + n.mid });
    }
    if (a.blocks && !a.hitl) bad.push({ id: a.id, why: "무언가를 막는 액션인데 사람 승인이 필요하지 않다 — 승인 없는 거래중지 · 정산보류 경로다" });
    if (a.hitl && !a.approvalBy) bad.push({ id: a.id, why: "승인자가 비었다" });
    if (!a.effect) bad.push({ id: a.id, why: "승인해도 무엇까지인지가 비었다" });
    if (!a.why) bad.push({ id: a.id, why: "왜 이 액션인지가 비었다" });
  }
  /* ⑦ 사람 승인 게이트 선언 — 목록 · 승인자 · 하지 않는 것 */
  if (!PG_AI_HITL.must.length) bad.push({ id: "PG_AI_HITL", why: "사람 승인 필수 목록이 비었다" });
  for (const m of PG_AI_HITL.must) {
    if (!m.what) { bad.push({ id: "PG_AI_HITL", why: "승인 필수 항목의 이름이 비었다" }); continue; }
    if (m.entry) {
      const a = pgAiAction(m.entry);
      if (!a) bad.push({ id: "PG_AI_HITL/" + m.what, why: "등재되지 않은 입구 — " + m.entry });
      else if (!a.hitl) bad.push({ id: "PG_AI_HITL/" + m.what, why: "입구가 사람 승인을 지나지 않는다 — " + m.entry });
    } else if (!m.why) {
      bad.push({ id: "PG_AI_HITL/" + m.what, why: "입구가 없는 사유가 비었다 — 「입구가 없다」와 「입구를 적지 않았다」가 구별되지 않는다" });
    }
  }
  if (!PG_AI_HITL.approver || !PG_AI_HITL.gate || !PG_AI_HITL.log) bad.push({ id: "PG_AI_HITL", why: "승인자 · 게이트 · 로그 규약 중 빈 칸이 있다" });
  if (!PG_AI_HITL.never.length) bad.push({ id: "PG_AI_HITL", why: "화면이 할 수 없는 것이 비었다 — 관측이지 조작이 아니라는 선언이 사라졌다" });
  /* ⑧ 지면 규약 상수가 통제 임계를 품지 않았는가 */
  let th = [];
  try { if (typeof PG_THRESH !== "undefined") th = Object.keys(PG_THRESH); } catch (e) { th = []; }
  if (th.indexOf("logPage") >= 0) bad.push({ id: "PG_AI_LOG_PAGE", why: "통제 임계 키와 겹친다 — 임계의 소유자는 정책 파일 하나다" });
  /* ⑨ 죽은 문안 — 지면이 선 뒤에 「다음 단계의 산출물」이 남아 있으면 가드의 바닥을 메운다 */
  for (const k of Object.keys(PG_AI_DECL)) if (/다음 단계의/.test(String(PG_AI_DECL[k])))
    bad.push({ id: "PG_AI_DECL." + k, why: "지면이 선 뒤에 남은 죽은 문안 — 렌더되지 않는 문구가 검사의 바닥을 메운다" });
  for (const k of Object.keys(PG_AI_DOCK_NOTICE)) if (!String(PG_AI_DOCK_NOTICE[k]).length)
    bad.push({ id: "PG_AI_DOCK_NOTICE." + k, why: "고지 문안이 비었다" });
  return bad;
}

/* ── 개발 훅 — 러너가 화면을 거치지 않고 단언한다 ── */
if (typeof window !== "undefined") {
  window.__hifinPGAI = function () {
    return {
      ver: PG_AI_VER, blocks: PG_AI_BLOCKS, axes: PG_AI_AXES, std: PG_AI_STD,
      notice: PG_AI_NOTICE, dockNotice: PG_AI_DOCK_NOTICE, decl: PG_AI_DECL,
      agents: PG_AI_AGENTS, agentBase: PG_AI_AGENT_BASE, actions: PG_AI_ACTIONS,
      hitl: PG_AI_HITL, memberForbid: PG_AI_MEMBER_FORBID, metrics: PG_AI_METRICS,
      counts: {
        blocks: PG_AI_BLOCKS.length, axes: PG_AI_AXES.length, std: PG_AI_STD.length,
        notice: PG_AI_NOTICE.length, agents: PG_AI_AGENTS.length, actions: PG_AI_ACTIONS.length,
        hitl: PG_AI_ACTIONS.filter((a) => a.hitl).length, metrics: PG_AI_METRICS.length,
        ctrl: pgAiCtrl().length,
      },
      block: pgAiBlock, metric: pgAiMetric, axis: pgAiAxis, action: pgAiAction,
      stdRow: pgAiStdRow, stdRender: pgAiStdRender, noticeText: pgAiNoticeText, noticeOf: pgAiNoticeOf,
      ctrl: pgAiCtrl, roll: pgAiRoll, rollReset: pgAiRollReset,
      agentRoll: pgAgentRoll, agentExt: pgAgentExt, run: pgAgentRun, approve: pgAgentApprove,
      selfGov: pgSelfGovRoll, audit: pgAiAudit(),
    };
  };
}
