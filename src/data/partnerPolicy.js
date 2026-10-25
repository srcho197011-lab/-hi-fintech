/* ====================== 협력업체 온톨로지 · 하네스 — 정책 레지스트리와 판정기 ======================
   Policy as Code — 조항이 데이터고, 시행일이 하드 플로어다.
   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md (§6 · §7 · §11-1 · §13-5)
   결정값: docs/partner_gov/P0_결정서_v1.1.md (⑩ 법령 레지스트리 단일화 · ⑪ 집행 로그 축)

   이 파일이 소유하는 것 6가지
     ① PG_LAWS        — 법령 · 표준 · 지침 · 조회 사양 레지스트리. **한 법률 = 한 항목**(§8-4 규약 1).
                         조문별 확인 등급 · 조문별 시행일은 항목 안의 articles 하위표가 갖는다.
     ② PG_LAW_SETS    — 유형별로 근거 법령이 갈리는 조항(L-02 · L-03 · L-09)의 유형 → 법령 사상.
     ③ PG_POLICIES    — 조항 전수. **순수 데이터**(함수 0개 · JSON 무손실 직렬화 · §6-5).
                         입력 계약 · 축 값은 partnerReport.js 의 PG_INPUTS 가 소유하고 여기서 **읽는다**.
                         P3 가 더하는 것은 PG_POLICY_EXT(조항 시행일 · 계약 근거 · 시정 과제 · 잠금)뿐이다.
     ④ PG_ENFORCE     — 집행 수준 배포 테이블. **조항 본문이 아니라 여기서 지정한다**(§7-2).
     ⑤ PG_THRESH      — 통제 임계 상수. 이 파일 **밖에 리터럴로 나타나면 러너가 실패**한다(§7-6 ③).
     ⑥ pgDecide       — 판정 단일 진입점. 분기는 **닫힌 클로저 안의 디스패치 표**에 있다.

   이 파일이 소유하지 않는 것
     · 낱말 · 표시명 · 판정 축 값 → src/data/partnerGov.js (PG_TERMS · PG_AXES · pgDisplayName)
     · 지면 · 수치 정의 · 입력 계약 · 단계 집행 효과 → src/data/partnerReport.js
     · 집행 지점 배선 · 차단 로그 · 면제 영속화 · 제출 필드 사전 → P4 (이 파일은 **규약과 순수 함수**까지만)
     · 거래 사실(거래처 · 주문 · 정산) → src/data/supplyData.js

   ── 하드 플로어(§6-3) — regGate 의 구조를 그대로 옮겼다 ──────────────────────────────
     · 근거 법령 · 표준의 확인 등급이 「원문확인」이 아니면 **DENY 를 낼 수 없다**
       → INDETERMINATE + cause "law_unverified". 어떤 집행 지점에서도 차단하지 않는다.
     · 시행일이 없거나(null) 미도래면 **NOT_APPLICABLE + "not_yet_effective"** —
       「해당 없음」이 아니라 「시행 전」으로 렌더한다(§7-4).
     · 확인 등급이 「원문확인」에서 내려가면 그 조항의 집행 수준은 **자동으로 advisory 로 격하**된다(§7-6).
     · 관리자 override 로도 뚫리지 않는다 — pgEnforceSet 이 하향과 무근거 승격을 코드에서 거부한다.
   「미확인」은 결함이 아니라 **설계된 상태**다. 추정 날짜·추정 조문을 넣지 말고 null 로 둔다.

   ── 결정론(§11-5) ────────────────────────────────────────────────────────────────
     Math.random 0건 · 난수 0건 · **벽시계 0건**. 날짜 비교는 "YYYY-MM-DD" 문자열 사전순으로만 한다
     (new Date() 를 쓰면 같은 입력이 날마다 다른 결정을 낸다 — 그러면 보고서 재현이 성립하지 않는다).
     기준일은 ctx.asOf 로 **호출자가 넘긴다**. PG_ASOF 는 러너가 단언할 수 있게 둔 선언 기준일이다.

   주의 — 단일 번들(import 없음 · 전역 공유)이다. 전역 이름 충돌을 grep 으로 확인한 뒤 추가했다(§14-4).
     그리고 **다른 파일의 const 를 이 파일의 최상위에서 평가하지 않는다** — 매니페스트 순서가 앞인
     partnerReport.js 는 안전하지만, 규칙을 함수 안에서만 읽는 것으로 통일해 TDZ 사고를 구조적으로 피한다
     (P1 에서 실측된 사고 유형: 모듈 최상위의 typeof 평가가 const TDZ 로 번들을 통째로 죽였다). */

const PG_POLICY_VER = "P3-1.0.0";
const PG_ASOF = "2026-10-25";            /* 선언 기준일 — 벽시계가 아니다. 호출자는 ctx.asOf 를 넘긴다 */
const PG_CHECKED_BY = "내부통제 담당(L1)";

/* 확인 등급 서열 — 하드 플로어가 비교하는 유일한 축. 값 집합의 원천은 PG_AXES.verified 다. */
const PG_VERIFY_RANK = { "원문확인": 3, "부분확인": 2, "미확인": 1 };
/* 집행 수준 서열 — 상한 비교와 ratchet 에 쓴다. 값 집합의 원천은 PG_AXES.enforce 다. */
const PG_LEVEL_RANK = { advisory: 1, soft: 2, hard: 3 };
const PG_PEPS = ["pep.register", "pep.settle", "pep.expose", "pep.export"];
/* 집행 지점별 상한 — **코드 고정**이다(§7-7 1). 정산 보류·노출 차단은 거래상 지위 쟁점에 직접 닿는다. */
const PG_ENFORCE_CAP = { "pep.register": "soft", "pep.settle": "advisory", "pep.expose": "advisory", "pep.export": "hard" };

/* 요건 출처의 성질 축 — 법률과 표준과 내부 규약을 한 낱말로 부르면 「법령 준수」가 느슨해진다. */
const PG_LAW_BASIS = [
  ["법률", "국회가 제정한 법률"], ["시행령", "대통령령"], ["시행규칙", "총리령 · 부령"],
  ["고시", "행정규칙"], ["지침", "소관 부처 가이드라인 — 법적 구속력이 조문과 다르다"],
  ["표준", "국제 · 민간 표준. 조항 번호가 아니라 통제목표 표제까지만 적는다"],
  /* [P6 신설] AI 거버넌스 축이 역외 규정과 1차 문헌에 기댄다. 「법률」로 묶으면 국회가 제정한 법률과
     외국 규정이 한 낱말이 되고, 「표준」으로 묶으면 통제목표 표제 규약이 문헌에도 걸려 어색해진다. */
  ["규정", "외국 · 역외 규정. 현 사업 범위 밖이면 참조 등재이고 판정 근거로 쓰지 않는다"],
  ["문헌", "학술 · 1차 문헌. 조항 번호 축이 애초에 없다 — 통제 번호 규약의 대상이 아니다"],
  ["내부규약", "당사 규약 — 법령 준수 축이 아니다"],
  ["조회사양", "공적 조회 · API 사양. 사양이 확인되지 않으면 그 조항은 판정되지 않는다"],
];

/* ══════════════════════ ① PG_LAWS — 법령 · 표준 레지스트리 ══════════════════════
   항목 구조
     name              정식 명칭. 약칭 금지(§0-2 ⑨ — 약칭은 소관 부처가 다른 두 법률을 뭉갠다)
     basis             PG_LAW_BASIS 의 키
     lawVersion        **현행 하나만**. 제정법은 별 항목이 아니라 이 법률의 연혁이다(§8-4 ⚠⚠)
     effectiveDate     법률 전체의 현행 시행일 또는 null
     articles          조문 하위표 — { "<조문>": {article, verified, effectiveDate, source, checkedAt, note} }
                       ★ 확인 등급과 시행일의 **단위는 조문**이다. 같은 법률 안에서 조문마다 갈린다
                         (전자상거래법 제20조는 원문확인인데 제17조 ①③⑥항은 본문 미입수다).
                         항목 수준 verified 는 articles 의 **최솟값으로 파생**한다 — 두 곳에 적지 않는다.
     verified/article  articles 가 없는 항목(표준 · 조회 사양 등)만 항목 수준에 직접 적는다
     sanction          제재 축 {kind, article, max, verified, note} — 비례성 판단 입력(§5-2-1 · 단언 13)
     enforcementGrace  소관 부처 집행 유예 사실 또는 null — 있으면 집행 수준 상한이 advisory 로 내려간다
     appliesToSelf     true = 하이핀 자신도 수범자. 단언 12 가 대응 자기 항목의 존재를 요구한다
     govAxis           "집행설계" = 우리의 집행 수단 자체를 규율하는 법령(§7-7 ④)
     cite              "참조" | "KB" = **판정 근거로 쓸 수 없는 등재**. 조항의 lawRef 가 가리키면 러너가 실패
     relates           이 항목을 보완하는 다른 항목 — 고아 검사의 예외 근거
     kb                AI KB 라운지 「법률·제도」 행의 원천(Q10 흡수 — kbDomainData.KB_LEGAL 은 이것의 뷰다)

   ⚠ 조문 번호는 **원문확인일 때만** non-null 이다(§6-4 ②). 2차 자료에서 가져온 조문 번호가
     「미확인」 배지를 달고 보고서에 찍히면, 배지는 전문성의 증거가 아니라 알고도 인쇄했다는 기록이 된다.
     이 규약은 법령 조문 번호뿐 아니라 **표준 통제 번호**에도 똑같이 적용된다(§6-4 ④). */
const PG_LAWS = {

  /* ── P3 작업표 1번 — 달성(원문확인 2026-10-25) ───────────────────────────── */
  pipa: {
    name: "개인정보 보호법", basis: "법률",
    lawVersion: "[시행 2026. 9. 11.] [법률 제21445호, 2026. 3. 10., 일부개정]",
    effectiveDate: "2026-09-11", appliesToSelf: true,
    sanction: { kind: "과태료", article: null, max: null, verified: "미확인",
      note: "제26조 각 항 위반별 제재 조문의 본문을 입수하지 못했다. 제재 축을 판정·렌더에 쓰지 않는다" },
    enforcementGrace: null,
    source: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=900079061&lsId=011357&chrClsCd=010202&print=print",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "이 서브섹션의 법적 정초. ⑦항이 「수탁자를 개인정보처리자의 소속 직원으로 본다」고 정하므로 " +
          "협력업체의 위반이 곧 당사의 배상책임이다 — 통제는 선의가 아니라 전가되지 않는 책임에서 나온다(§5-1).",
    articles: {
      "제26조": { article: "제26조", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=900079061&lsId=011357&chrClsCd=010202&print=print",
        checkedAt: "2026-10-25",
        note: "①~⑧ 전항 본문 확인. ① 1호 위탁업무 수행 목적 외 처리 금지 · 2호 기술적·관리적 보호조치 · 3호 대통령령 사항 / " +
              "② 위탁 업무 내용과 수탁자 공개 / ③ 홍보·판매권유 업무 위탁 시 정보주체에게 알려야 하고 변경 시에도 또한 같다 / " +
              "⑥ 재위탁은 위탁자의 동의 / ⑦ 손해배상책임에 관하여 수탁자를 소속 직원으로 본다" },
      /* KB 라운지가 등재해 온 두 조문 — 흡수하면서 확인 등급을 매겼다. 본문 미입수이므로 조문 번호를 렌더하지 않는다. */
      "제23조": { article: null, verified: "미확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "민감정보 처리 제한. KB 라운지 등재분을 흡수했고 본문 대조는 하지 않았다" },
      "제29조": { article: null, verified: "미확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "안전조치 의무. 같은 사유로 미확인" },
    },
    kb: { id: "law-pipa", articles: ["제23조", "제29조"], risk: "필수", grade: "A", org: "국가법령정보센터", date: "2026-09",
      summary: "민감정보(건강정보)는 별도 동의·최소수집·안전조치 의무. 업무위탁은 문서 요건과 수탁자 공개·감독 의무.",
      note: "건강 데이터는 목적별 동의 분리·접근통제 필수 · 제26조 ⑦은 수탁자 위반을 당사 배상책임으로 돌린다" },
  },
  pipaDecree: {
    name: "개인정보 보호법 시행령", basis: "시행령",
    lawVersion: "[시행 2026. 9. 11.] [대통령령 제36671호, 2026. 9. 10., 일부개정]",
    effectiveDate: "2026-09-11", appliesToSelf: true,
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "시행령 자체에 제재 조항이 없다" },
    enforcementGrace: null,
    source: "https://law.go.kr/lumLsLinkPop.do?lspttninfSeq=66996&chrClsCd=010202",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25", relates: ["pipa"],
    note: "법 제26조 ① 3호가 위임한 대통령령 사항의 실체. 법 2항목 + 영 5항목 = **필수 기재 7항목**이고, " +
          "한 항목을 둘로 쪼개면 L-04 의 분모가 어긋난다(PG_INPUTS 의 denomNote 와 같은 사실).",
    articles: {
      "제28조": { article: "제28조", verified: "원문확인", effectiveDate: null,
        source: "https://law.go.kr/lumLsLinkPop.do?lspttninfSeq=66996&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "① 1호 위탁업무의 목적 및 범위(한 항목이다) · 2호 재위탁 제한에 관한 사항 · 3호 접근 제한 등 안전성 확보 조치 · " +
              "4호 관리 현황 점검 등 감독 · 5호 의무 위반 시 손해배상 등 책임" },
    },
  },

  /* ── P3 작업표 2번 — 달성(제20조 · 제20조의2 원문확인 2026-10-25) ──────────── */
  ecomm: {
    name: "전자상거래 등에서의 소비자보호에 관한 법률", basis: "법률",
    lawVersion: "[시행 2026. 7. 21.] [법률 제21312호, 2026. 1. 20., 일부개정]",
    effectiveDate: "2026-07-21", appliesToSelf: true, govAxis: "집행설계",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인",
      note: "제20조·제20조의2 위반의 제재 조문 본문 미입수. 제20조의2 는 제재가 아니라 **연대배상책임**이다" },
    enforcementGrace: null,
    source: "https://law.go.kr/LSW//lsLinkCommonInfo.do?lsJoLnkSeq=1013449581&chrClsCd=010202",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "우리가 중개자로서 **면제받지 못하는 책임의 범위**를 정하는 법률이고, 동시에 대금 보류·노출 차단이라는 " +
          "집행 수단 자체를 규율하는 축이다. 코드가 스스로 「무재고 · 거래처 직배송 · 플랫폼 중개」라고 선언하므로 " +
          "하도급거래로 보기 어렵고, 실제 규율은 이 법률과 공정거래법이다(§7-7).",
    articles: {
      "제17조": { article: null, verified: "부분확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1021872703&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "②항 각 호 6사유는 본문 확인(소비자 책임 멸실·훼손 / 사용·일부 소비로 가치 현저 감소 / 시간 경과로 재판매 곤란 / " +
              "복제 가능 재화 포장 훼손 / 용역·디지털콘텐츠 제공 개시 / 대통령령). **①③⑥항 본문은 미입수** — " +
              "철회 기간(일수)과 ⑥항 조치 내용을 적지 않는다. 그래서 조문 번호도 렌더하지 않는다" },
      "제20조": { article: "제20조", verified: "원문확인", effectiveDate: null,
        source: "https://law.go.kr/LSW//lsLinkCommonInfo.do?lsJoLnkSeq=1013449581&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "① 통신판매중개를 하는 자는 자신이 통신판매의 당사자가 아니라는 사실을 소비자가 쉽게 알 수 있도록 " +
              "총리령으로 정하는 방법으로 미리 고지 / ② 중개의뢰자가 사업자면 신원정보를 청약 전까지 제공 / " +
              "③ 사이버몰 이용에서 발생하는 불만·분쟁 해결을 위해 원인·피해 파악 등 필요한 조치를 신속히 시행" },
      "제20조의2": { article: "제20조의2", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000527258&lsId=009318&print=print",
        checkedAt: "2026-10-25",
        note: "① 제20조 ① 고지를 하지 아니한 경우 중개의뢰자와 **연대하여 배상** / " +
              "③ 제20조 ① 고지에도 불구하고 **통신판매업자인 통신판매중개자는 제12조부터 제15조까지, 제17조 및 제18조의 " +
              "책임을 면하지 못한다**(단서 — 의뢰자가 책임지기로 약정하고 소비자에게 고지한 부분은 의뢰자 책임)" },
    },
  },

  /* ── P3 작업표 3번 — 달성(제27조 · 제57조 원문확인 2026-10-25) ────────────── */
  medAct: {
    name: "의료법", basis: "법률",
    lawVersion: "[시행 2026. 10. 2.] [법률 제21490호, 2026. 3. 24., 타법개정]",
    effectiveDate: "2026-10-02", appliesToSelf: true, govAxis: "집행설계",
    sanction: { kind: "형벌", article: null, max: null, verified: "부분확인",
      note: "제88조 제1호에 제27조 제3항 위반이 포함된다는 것은 2차 대조다. **본문 미입수이므로 형량을 적지 않는다** — " +
            "형량은 판정에도 렌더에도 쓰지 않는다" },
    enforcementGrace: null,
    source: "https://www.law.go.kr/lsLawLinkInfo.do?lsJoLnkSeq=1000180094&chrClsCd=010202",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    pendingAmend: { lawNo: "법률 제21238호", promulgated: "2025-12-23", effectiveDate: "2026-12-24", kind: "일부개정",
      verified: "원문확인", scope: "미확인",
      source: "https://law.go.kr/LSW/lsRvsDocListP.do?chrClsCd=010202&lsId=001788&lsRvsGubun=all",
      note: "개정 이력 1차 출처에서 공포일·법률번호·시행일을 확인했다. **그 개정이 어느 조문을 바꾸는지는 미확인**이므로 " +
            "어느 조항에도 미도래 시행일을 부여하지 않았다 — 추정 시행일 입력 금지(§13-5 금지)" },
    note: "제27조 ③의 수범자는 「누구든지」이므로 당사도 직접 구속된다(appliesToSelf). 제57조의 제도명은 **자율심의**다 — " +
          "헌재 2015-12-23(2015헌바75)이 행정청 심의를 사전검열로 보아 위헌 결정한 뒤 민간 자율심의기구 체계로 개편됐다.",
    articles: {
      "제27조": { article: "제27조", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/lsLawLinkInfo.do?lsJoLnkSeq=1000180094&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "조 표제는 「무면허 의료행위 등 금지」. ③항은 「누구든지」로 시작해 영리를 목적으로 환자를 의료기관·의료인에게 " +
              "소개·알선·유인하는 행위 및 이를 사주하는 행위를 금지한다. 단서 2호 허용 — " +
              "1호 경제적 사정 등을 이유로 관할 시장·군수·구청장의 사전승인을 받아 환자를 유치하는 행위, " +
              "2호 국민건강보험 가입자·피부양자가 아닌 외국인환자 유치(국내 거주 외국인은 제외)" },
      "제57조": { article: "제57조", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW/lsLawLinkInfo.do?lsJoLnkSeq=1000721562&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "조 표제는 「의료광고의 심의」. ②항 — 각 호의 기관·단체는 대통령령에 따라 자율심의 조직 등을 갖추어 " +
              "**보건복지부장관에게 신고한 후** 의료광고 심의 업무를 수행할 수 있다. " +
              "1호 제28조 ①에 따른 의사회·치과의사회·한의사회 · 2호 소비자기본법 제29조에 따라 등록한 소비자단체로서 대통령령 기준 충족" },
      "제56조": { article: null, verified: "미확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "의료광고의 금지 등. KB 라운지 등재분을 흡수했고 본문 대조는 하지 않았다" },
      "제88조": { article: null, verified: "미확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "벌칙. 제1호에 제27조 ③ 위반이 포함된다는 것은 2차 대조이고 본문 미입수다" },
    },
    kb: { id: "law-medi", articles: ["제27조", "제56조", "제57조"], risk: "주의", grade: "A", org: "국가법령정보센터", date: "2026-10",
      summary: "환자 유인·알선 금지, 의료광고는 자율심의기구 심의 대상.",
      note: "진료 연계·리워드·검진 유인은 ‘환자 유인’ 소지 — 법률 검토 필요 · 제27조 제3항은 수범자가 ‘누구든지’라 당사도 직접 구속한다" },
  },

  /* ── P3 작업표 4번 — 달성(제35조 ⑥ 원문확인 2026-10-25) ──────────────────── */
  ltcAct: {
    name: "노인장기요양보험법", basis: "법률",
    lawVersion: "[시행 2026. 11. 27.] [법률 제21690호, 2026. 5. 26., 일부개정]",
    effectiveDate: "2026-11-27", appliesToSelf: true, govAxis: "집행설계",
    sanction: { kind: "형벌", article: null, max: null, verified: "미확인",
      note: "제35조 ⑥ 위반의 벌칙 조문 본문 미입수. 제재 축을 판정·렌더에 쓰지 않는다" },
    enforcementGrace: null,
    source: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=1000081753&chrClsCd=010202",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "⚠ **항목 수준 시행일(2026-11-27)이 기준일보다 뒤다** — 1차 출처 조문 페이지 헤더가 그 판을 표시한다. " +
          "그런데 ⑥항은 조문에 「신설 2013.8.13」으로 표기돼 있고 그 뒤 문언 변동이 확인되지 않았다. " +
          "항목 시행일을 그대로 쓰면 2013년부터 살아 있는 금지 조항이 화면에서 「시행 전」으로 찍힌다 — 사실과 다른 진술이다. " +
          "그래서 **조문 시행일을 articles 에 분리**했다(§8-4 규약 2). 정확한 시행일(공포일과의 차이)은 미확인이지만, " +
          "어느 해석으로도 기준일보다 한참 전이므로 「미도래 여부」 판단에는 영향이 없다.",
    articles: {
      "제35조": { article: "제35조", verified: "원문확인", effectiveDate: "2013-08-13",
        source: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=1000081753&chrClsCd=010202", checkedAt: "2026-10-25",
        effDateBasis: "조문의 「신설 2013.8.13」 표기(공포일). 시행일 자체는 미확인 — 다만 기준일보다 한참 전이다",
        note: "조 표제는 「장기요양기관의 의무 등」. ⑥항은 「누구든지」로 시작해 영리를 목적으로 금전·물품·노무·향응·그 밖의 " +
              "이익을 제공하거나 제공할 것을 약속하는 방법으로 수급자를 장기요양기관에 소개·알선 또는 유인하는 행위 및 " +
              "이를 조장하는 행위를 금지한다. ⑤항 본문은 미입수" },
    },
  },

  /* ── 인공지능기본법 — 단일 항목. 제정법은 이 법률의 연혁이고 별 행으로 세우지 않는다(§8-4) ── */
  aiFrame: {
    name: "인공지능 발전과 신뢰 기반 조성 등에 관한 기본법", basis: "법률",
    lawVersion: "[시행 2026. 7. 21.] [법률 제21311호, 2026. 1. 20., 일부개정]",
    effectiveDate: "2026-07-21", appliesToSelf: true,
    sanction: { kind: "과태료", article: "제43조 제1항 제1호", max: 30000000, verified: "원문확인",
      note: "3천만원 이하 — 1호 제31조 ① 위반(고지 미이행). **형벌도 영업정지도 아니다**. " +
            "이 사실이 L-08 의 집행 수준을 DENY 에서 내린 비례성 근거다(§5-2-1)" },
    enforcementGrace: { until: null, verified: "부분확인",
      note: "소관 부처가 시행 초기 사실조사·과태료를 최소 1년 이상 유예한다고 밝혔다",
      source: "부처 발표 2차 보도 — 1차 보도자료 미입수" },
    source: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1031810723",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "제정법(법률 제20676호 · 2025-01-21 공포 · 시행 2026-01-22)은 **별 법률이 아니라 이 법률의 연혁**이다. " +
          "한 법률을 두 항목으로 세우면 법령 테이블에서 이원화가 재발한다(§8-4 ⚠⚠).",
    articles: {
      "제31조": { article: "제31조", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1031810723", checkedAt: "2026-10-25",
        note: "조 표제는 「인공지능 투명성 확보 의무」. ① 고영향 또는 생성형 인공지능 기반 제품·서비스 제공 시 **사전 고지** / " +
              "② 생성형 인공지능 산출물임을 **표시** / ③ 실제와 구분하기 어려운 가상 음향·이미지·영상은 명확히 인식할 수 있도록 " +
              "고지·표시(예술적·창의적 표현물은 전시·감상을 방해하지 않는 방법으로 가능)" },
      "제43조": { article: "제43조", verified: "원문확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1031810927", checkedAt: "2026-10-25",
        note: "①항 과태료 3천만원 이하 — 1호 제31조 ① 위반 · 2호 제36조 ① 위반 · 3호 제40조 ③ 불이행" },
      "제2조제4호": { article: null, verified: "부분확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "고영향 인공지능 정의. **성질 요건 + 영역 요건을 함께** 충족해야 한다(영역 11목 — 보건의료 제공·이용체계, " +
              "의료기기·디지털의료기기 개발·이용 포함). 법령DB 전문 대조 단계이고 1차 본문 대조는 잔여" },
      "제33조": { article: null, verified: "부분확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "고영향 인공지능의 **확인** 절차 — 사업자가 먼저 자체 검토하고, 필요하면 소관 장관에게 확인을 요청할 수 있다" },
      "제34조": { article: null, verified: "부분확인", effectiveDate: null, source: null, checkedAt: "2026-10-25",
        note: "고영향 인공지능 관련 사업자의 책무 6호 조치. 1차 본문 대조 잔여" },
    },
  },

  /* ── 표시 · 광고 자율심의 축 ───────────────────────────────────────────────── */
  foodLabelAct: {
    name: "식품 등의 표시·광고에 관한 법률", basis: "법률",
    lawVersion: "[시행 2025. 9. 19.] [법률 제20826호, 2025. 3. 18., 일부개정]",
    effectiveDate: "2025-09-19", appliesToSelf: false,
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "제재 조문 본문 미입수" },
    enforcementGrace: null,
    source: "https://www.law.go.kr/LSW//lsLinkCommonInfo.do?lspttninfSeq=150943&chrClsCd=010202",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "건강기능식품 기능성 표시·광고 심의의 현행 근거다. 「건강기능식품에 관한 법률 제18조 제1항 제6호」는 " +
          "헌재 2018-06-28(2016헌가8·2017헌바476)으로 위헌 결정된 조항이고, 근거가 이 법률 제10조로 이관됐다. " +
          "⚠ 이 법률과 「표시·광고의 공정화에 관한 법률」은 **소관 부처가 다른 별 법률**이다 — 약칭으로 묶지 않는다.",
    articles: {
      "제10조": { article: null, verified: "부분확인", effectiveDate: null,
        source: "https://www.law.go.kr/LSW//lsLinkCommonInfo.do?lspttninfSeq=150943&chrClsCd=010202", checkedAt: "2026-10-25",
        note: "**법률 본문 미입수** — 제도 골격만 1차 출처로 확인했다: 시행규칙 제10조(표시 또는 광고 심의 대상 식품등)가 " +
              "특수영양식품·특수의료용도식품·건강기능식품·기능성표시식품을 심의 대상으로 정하고, 자율심의기구가 " +
              "구성되지 않은 경우 소관 처장의 심의를 받는다. 심의 주체는 식품의약품안전처장에게 등록한 자율심의기구다. " +
              "조문 번호를 렌더하지 않는 이유가 여기 있다" },
    },
    kb: { id: "law-hff", articles: ["제10조"], risk: "주의", grade: "A", org: "국가법령정보센터", date: "2025-09",
      summary: "표시·광고 자율심의(식약처장 등록 자율심의기구), 허위·과대광고 금지.",
      note: "영양제·건기식 기능성 문구는 인정 범위 내에서만 · 심의번호는 제3자 조회 창구가 없어 협력업체 제출(심의 결과서 사본)로만 확인된다" },
  },
  mdAct: {
    name: "의료기기법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "의료기기 광고 자율심의 체계. 헌재 2020-08-28(2017헌가35)이 행정권이 개입한 광고 심의를 사전검열로 보아 위헌 결정한 뒤 " +
          "심의 주체가 민간 자율심의기구로 바뀌어 2021-06-24 전면 시행됐고, 자율심의 광고의 유효기간은 승인일부터 3년이다 " +
          "(복수 2차 출처 일치 · **조문 번호 미입수**). 조문이 없으므로 이 항목에 기대는 판정은 보류된다.",
  },
  ftcLabelAct: {
    name: "표시·광고의 공정화에 관한 법률", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "공정거래위원회 소관. 「식품 등의 표시·광고에 관한 법률」과 **별 법률**이고 규율 대상도 다르다.",
    kb: { id: "law-ad", articles: ["제3조"], risk: "주의", grade: "A", org: "국가법령정보센터", date: "2024-01",
      summary: "거짓·과장·기만적 표시광고 금지.",
      note: "건강·기능성·효능 표현은 근거 없는 과장 금지" },
  },

  /* ── 유형별 영업 자격 축 — 전부 조문 미입수다. 「미확인」은 설계된 상태다 ──────── */
  pharmAct: {
    name: "약사법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "건강커머스 유형의 일부 품목 자격 근거. 조문 미입수 — 판정에 쓰지 않는다",
  },
  foodSanAct: {
    name: "식품위생법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "영업 신고·허가의 근거 행위가 품목마다 다르다. 조문 미입수",
  },
  hffAct: {
    name: "건강기능식품에 관한 법률", basis: "법률",
    lawVersion: "[시행 2026. 10. 8.] [법률 제21525호, 2026. 4. 7., 타법개정]",
    effectiveDate: "2026-10-08", appliesToSelf: false, article: null, verified: "미확인",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "⚠ 표시·광고 심의 의무를 정했던 제18조 제1항 제6호는 **헌재 2018-06-28 위헌 결정**으로 효력을 잃고 " +
          "근거가 「식품 등의 표시·광고에 관한 법률」 제10조로 이관됐다. 영업 자격 축으로만 쓰고 광고 축으로 쓰지 않는다. " +
          "제조 기준(GMP)은 2020-12부터 모든 제조업체에 의무 적용되지만 **적용 대상은 제조업소**다 — " +
          "제조하지 않는 수입·유통 브랜드사에 「미보유」를 결함으로 찍으면 범주 오류다(L-02 의 qual 축).",
  },

  /* ── 집행 설계 자체를 규율하는 법령(§7-7 ④) — 하도급법은 여기 없다 ─────────── */
  ftcAct: {
    name: "독점규제 및 공정거래에 관한 법률", basis: "법률", lawVersion: null, effectiveDate: null,
    appliesToSelf: true, govAxis: "집행설계", article: null, verified: "미확인",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "거래상 지위의 남용(불이익 제공 · 거래 거절). 통제 등급으로 대금 지급을 보류하고 제품 노출을 차단하는 것은 " +
          "**집행 수단 자체의 적법성** 쟁점에 직접 닿는다. 조문이 미확인이므로 판정에는 쓰지 않지만, " +
          "집행 수준 상한을 코드로 내리는 근거 축으로 등재한다 — 확인하지 못한 법 아래에서 남의 거래를 끊지 않는다. " +
          "⚠ 이 모델은 무재고 · 거래처 직배송 · 당사 재고자산 0 · 플랫폼 중개이므로 **하도급거래로 보기 어렵다**. " +
          "하도급법은 유형별 법령에서 뺐다(§7-7).",
  },

  /* ── 공적 조회 사양 — 사양이 확인되지 않으면 그 조항은 판정되지 않는다 ───────── */
  ntsBizStat: {
    name: "국세청 사업자등록 상태 조회", basis: "조회사양", lawVersion: null, effectiveDate: null,
    appliesToSelf: false, article: null, verified: "미확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "조회 사양은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "API 사양 미확인. 현 데이터의 사업자등록번호는 난수이므로 실존 확인의 원천이 될 수 없다",
  },
  sanctionPublic: {
    name: "소관 부처 행정처분 공표", basis: "조회사양", lawVersion: null, effectiveDate: null,
    appliesToSelf: false, article: null, verified: "미확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "조회 사양은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "공표 범위·갱신 주기·조회 창구 사양 미확인. 확인되지 않은 이력으로 거래를 끊지 않는다",
  },
  recallPublic: {
    name: "식품 · 의료기기 회수 · 판매중지 공표", basis: "조회사양", lawVersion: null, effectiveDate: null,
    appliesToSelf: false, article: null, verified: "미확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "조회 사양은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "공표 조회 사양 미확인. 미완료 회수 보유 여부는 협력업체 제출로만 들어온다",
  },

  /* ── 지침 · 표준 ─────────────────────────────────────────────────────────── */
  mohwNonMed: {
    name: "보건복지부 「비의료 건강관리서비스 가이드라인 및 사례집」", basis: "지침",
    lawVersion: null, effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "지침 자체에 제재가 없다 — 근거 법령은 의료법이다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "의료행위 판단 3요건 — ①의학적 전문지식이 필요한 행위 ②대상자 상태에 따른 진단·처방·처치가 수반되는 행위 " +
          "③보건위생상 위해 우려가 있는 행위. **하나라도 해당하면 의료행위**다. 1차 발간 2019-05이고 " +
          "**발간물 1차 미입수**(복수 2차 보도 일치). 경계 사례는 소관 부처 유권해석 회신 전까지 판정 보류다 — " +
          "우리가 의료행위 해당성을 단정하지 않는다.",
  },
  iso42001: {
    name: "ISO/IEC 42001:2023", basis: "표준", lawVersion: "Edition 1, 2023-12",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "표준은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "조항 4~10이 필수 요구사항이고 Annex A 가 참조 통제(38통제 / 9통제목표 — 복수 2차 출처 일치)다. " +
          "제3자 통제목표의 정식 표제는 「Third-party and customer relationships」이고 그 아래 3통제다. " +
          "⚠ **개별 통제 번호·표제는 원문 없이 쓰지 않는다** — 2차 출처들이 서로 다른 값을 주고, 한 출처는 " +
          "다른 표준의 통제 표제를 이 자리에 올려 두었다. 그래서 article 이 null 이고 화면에는 통제목표 표제까지만 적는다(§6-4 ④).",
  },

  /* ── [P6 신설] AI 거버넌스 축의 나머지 기준 3종 (§8-4) ────────────────────────
     세 항목 모두 **참조 등재**다 — 조항의 lawRef 가 가리킬 수 없고, 협력업체 AI 점검 축(A-01~A-07)의
     근거 기준으로만 쓰인다. 점검 축은 통제항목이 아니라 **묻는 축**이고 등급을 만들지 않는다(§8-2).
     ⚠ 확인 등급은 지시서 부록 A-2 의 출처 기록을 그대로 승계한다 — 새로 매기지 않는다. */
  nistRmf: {
    name: "NIST AI Risk Management Framework 1.0", basis: "표준", lawVersion: "1.0, 2023-01-26",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "원문확인", cite: "참조",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "자발적 프레임워크다 — 제재 축이 아니다" },
    enforcementGrace: null,
    source: "https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF/Core_And_Profiles/5-sec-core",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    relates: ["iso42001"],
    note: "Core 는 네 기능(GOVERN · MAP · MEASURE · MANAGE)과 그 아래 범주로 구성되고, **제3자 전용 범주가 셋**이다 — " +
          "GOVERN 6(제3자 소프트웨어 · 데이터와 조달 경로 정책) · MAP 4(제3자 구성요소 리스크 매핑) · " +
          "MANAGE 3(제3자 주체로부터의 리스크 관리). 그래서 협력업체 평가 질문을 **이 축에는 1:1로** 붙일 수 있다. " +
          "⚠ 여기 적히는 것은 **기능 · 범주 식별자**이고 ISO 표준의 통제 번호와 성질이 다르다 — 그래도 렌더 게이트를 " +
          "같이 지난다(확인 등급이 내려가면 식별자도 인쇄되지 않는다). **개정 진행 중**이므로 버전을 함께 적는다.",
  },
  euAiAct: {
    name: "EU 인공지능법(EU AI Act) 및 그 개정 규정", basis: "규정",
    lawVersion: null, effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인", cite: "참조",
    sanction: { kind: "과징금", article: null, max: null, verified: "미확인", note: "제재 조문 본문 미입수 — 제재 축을 판정 · 렌더에 쓰지 않는다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    relates: ["aiFrame"],
    note: "참고 축이다 — **현 사업 범위 밖**이고 판정 근거로 쓰지 않는다. 고위험 의무의 적용 시점이 부속서 계열에 따라 갈리고 " +
          "한 차례 연기됐으며(독립형 고위험은 2027년 말로, 제품 내장형은 2028년으로), **투명성 의무는 연기 대상이 아니어서 이미 적용 중**이다. " +
          "⚠ **조문 번호와 개정 규정 번호를 적지 않는다** — 1차 원문을 입수하지 못했고 복수 2차 출처 일치까지가 확인 범위다. " +
          "국내 고영향 인공지능 접근이 이 규정을 참고한 구조이므로 대조축으로만 둔다.",
  },
  modelCard: {
    name: "Model Cards for Model Reporting", basis: "문헌", lawVersion: "FAT* 2019 · DOI 10.1145/3287560.3287596",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "원문확인", cite: "참조",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "문헌은 제재 축이 아니다" },
    enforcementGrace: null, source: "https://doi.org/10.1145/3287560.3287596",
    checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    relates: ["iso42001"],
    note: "1~2쪽 분량으로 **의도된 사용 사례를 명확히 하고 부적합한 맥락에서의 사용을 억제**하는 것이 모델카드의 본래 목적이고, " +
          "하위집단별 평가를 함께 싣는다. 그래서 A-02 가 묻는 것은 「모델카드를 보유했는가」가 아니라 " +
          "**「부적합 맥락이 적혀 있는가」**다 — 보유 여부만 물으면 문서가 있다는 사실이 통제 충족으로 세어진다.",
  },
  ismsp: {
    name: "정보보호 및 개인정보보호 관리체계 인증기준", basis: "표준", lawVersion: null,
    effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "인증기준은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "2.3 외부자 보안(2.3.1 현황 관리 · 2.3.2 계약 시 보안 · 2.3.3 보안 이행 관리 · 2.3.4 계약 변경 및 만료 시 보안) · " +
          "3.3.2 개인정보 처리 업무 위탁. 이 체계가 생애주기 축의 원천이다. **소관 기관 고시 원문 미입수**.",
  },
  coso: {
    name: "COSO 내부통제 통합체계(2013)", basis: "표준", lawVersion: "2013",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "표준은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "5요소 17원칙이 각각 **「존재하고 기능(present and functioning)」**해야 효과적이다 — 통제군 T 의 " +
          "존재 / 기능 2판정이 여기서 나온다. points of focus 는 효과성 평가에 필수가 아니므로 가중 평균 총점을 만들지 않는다. " +
          "**원문 유료 · 미입수**(2차 해설 복수 일치).",
  },
  iso37301: {
    name: "ISO 37301:2021", basis: "표준", lawVersion: "2021-04-12",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "표준은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    relates: ["iso37001"], note: "준법경영시스템 요구사항. 반부패 기능은 별 축이므로 한 축으로 뭉치지 않는다",
  },
  iso37001: {
    name: "ISO 37001:2025", basis: "표준", lawVersion: "Edition 2, 2025-02",
    effectiveDate: null, appliesToSelf: false, article: null, verified: "부분확인", cite: "참조",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "표준은 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    relates: ["iso37301"],
    note: "2판이 반부패 문화를 더하고 준법 기능과의 역할 중복을 걷어내는 방향으로 개정됐다. " +
          "**참조 등재다** — 조항의 lawRef 가 이 항목을 가리킬 수 없고, T-08 의 반부패 입력이 이 사실을 근거로 별 칸을 갖는다.",
  },

  /* ── 내부 규약 — 법령 준수 축이 아니다 ───────────────────────────────────── */
  internal: {
    name: "당사 협력업체 통제 내부 규약", basis: "내부규약", lawVersion: null, effectiveDate: null,
    appliesToSelf: true, article: null, verified: "미확인",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "내부 규약은 법정 제재 축이 아니다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    note: "⚠ **규약 문서가 아직 없다.** 품목 라벨 정합 · 배송 이행 · 서비스 제공 이행 · 응급 전달 경로는 제품 원칙으로는 " +
          "존재하지만 통제 규약 문서로 제정되지 않았다. 그래서 「미확인」으로 두고 **판정에 쓰지 않는다** — " +
          "확인하지 못한 근거로 남의 거래를 끊지 않는다는 원칙은 법령에만 적용되는 것이 아니다. " +
          "규약 제정은 **열린 항목**이고, 제정되면 이 항목의 확인 등급만 올리면 P-01 · P-03 · P-04 · P-05 가 함께 산다.",
  },

  /* ── AI KB 라운지 「법률·제도」 등재 전용(Q10 흡수) ──────────────────────────
     cite:"KB" 는 **판정 근거로 쓸 수 없는 등재**다. 조항의 lawRef 가 가리키면 러너가 실패한다.
     흡수 이유 — KB_LEGAL 의 grade 는 **지식 신뢰도**이고 조문 확인 등급이 아니었다. 두 체계를 한 열에
     담아 두면 「A등급 법령」이 「원문확인 법령」으로 읽힌다. 이제 KB_LEGAL 은 이 표의 뷰이고,
     조문 번호는 확인 등급 게이트를 지난 것만 렌더된다(§6-4). */
  insBizAct: {
    name: "보험업법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-ins", articles: ["제83조", "제95조", "제97조"], risk: "주의", grade: "A", org: "국가법령정보센터", date: "2024-01",
      summary: "보험모집 자격·권유·광고 규제, 무자격 모집·부당권유 금지.",
      note: "보험 권유·가입은 라이선스 채널만 가능 — AI는 정보제공까지" },
  },
  fcpAct: {
    name: "금융소비자 보호에 관한 법률", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-fcp", articles: ["제17조", "제18조", "제19조", "제20조", "제21조"], risk: "주의", grade: "A",
      org: "국가법령정보센터", date: "2024-01",
      summary: "6대 판매원칙(적합성·적정성·설명의무·불공정영업·부당권유·광고규제).",
      note: "건강·금융 상품 추천 시 설명·적합성 의무 준수 필요" },
  },
  creditInfoAct: {
    name: "신용정보의 이용 및 보호에 관한 법률", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-credit", articles: [], risk: "주의", grade: "B", org: "국가법령정보센터", date: "2024-01",
      summary: "본인신용정보관리업(마이데이터)의 법적 근거·허가 요건.",
      note: "의료·금융 마이데이터 연계는 허가·동의 체계 검토 필요 · 제도명은 본인신용정보관리업이고 조문은 미확인이다" },
  },
  efinAct: {
    name: "전자금융거래법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-efin", articles: [], risk: "주의", grade: "B", org: "국가법령정보센터", date: "2024-01",
      summary: "전자지급수단·선불충전 등 전자금융업 규율.",
      note: "포인트/토큰이 선불전자지급수단·전자금융업 해당 여부 검토 필요 · 근거 조문은 미확인이다" },
  },
  vaUserAct: {
    name: "가상자산 이용자 보호 등에 관한 법률", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "행정처분", article: null, max: null, verified: "미확인", note: "조문 미입수" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-vaupa", articles: [], risk: "주의", grade: "B", org: "국가법령정보센터", date: "2024-07",
      summary: "가상자산 정의·이용자 자산 보호·불공정거래 금지.",
      note: "‘Health Token’이 가상자산에 해당하는지·규제 적용 여부 검토 필요 · 근거 조문은 미확인이다" },
  },
  finInnovAct: {
    name: "금융혁신지원 특별법", basis: "법률", lawVersion: null, effectiveDate: null, appliesToSelf: false,
    article: null, verified: "미확인", cite: "KB",
    sanction: { kind: "없음", article: null, max: null, verified: "미확인", note: "특례 부여 법률이다" },
    enforcementGrace: null, source: null, checkedBy: PG_CHECKED_BY, checkedAt: "2026-10-25",
    kb: { id: "law-sandbox", articles: [], risk: "기회", grade: "B", org: "국가법령정보센터", date: "2024-01",
      summary: "규제 특례로 한시적 규제특례·지정대리인 제도 운영.",
      note: "임베디드보험·건강금융 모델은 규제 특례 활용 검토 가능 · 근거 조문은 미확인이다" },
  },
};

/* ══════════════ ② PG_LAW_SETS — 유형별로 근거 법령이 갈리는 조항 ══════════════
   왜 필요한가 — L-09 는 **하나의 통제지만 근거 법령은 유형별로 분리 등재**한다(§7-7). 금지 행위의
   태양과 제재가 서로 다른 두 법률을 한 조문으로 묶으면 둘 다 틀리게 인용된다.
   구조 — set[kind] = { laws: [{lawId, article}], note }. 빈 배열은 **근거 법령 미확인**이고,
   그 유형에 대해 판정은 INDETERMINATE + law_unverified 로 간다(차단하지 않는다).
   하드 플로어는 laws 전건의 확인 등급 **최솟값**을 본다 — 하나라도 미확인이면 DENY 를 낼 수 없다. */
const PG_LAW_SETS = {
  qualByKind: {
    "PT-MED": { laws: [{ lawId: "medAct", article: null }], note: "의료기관 개설 자격의 근거 조문 미입수" },
    "PT-CARE": { laws: [{ lawId: "ltcAct", article: null }], note: "장기요양기관 지정의 근거 조문 미입수" },
    "PT-SVC": { laws: [], note: "건강서비스기관의 일반 영업 자격 근거 법령이 특정되지 않는다 — 유형에 따라 갈린다" },
    "PT-COM": { laws: [{ lawId: "hffAct", article: null }, { lawId: "foodSanAct", article: null },
                       { lawId: "pharmAct", article: null }, { lawId: "mdAct", article: null }],
      note: "품목에 따라 근거 법률과 **근거 행위**(허가 / 신고 / 등록 / 지정)가 다르다. licenses[].basis 가 그것을 들고 온다" },
  },
  selfReviewByKind: {
    "PT-MED": { laws: [{ lawId: "medAct", article: "제57조" }], note: "의료광고 자율심의 — 자율심의기구가 수행하고 소관 장관에게 신고한다" },
    "PT-CARE": { laws: [], note: "돌봄 유형의 표시·광고 자율심의 근거 미확인" },
    "PT-SVC": { laws: [], note: "건강서비스 광고의 자율심의 근거 법령 미확인 — 비의료 범위 적합성은 P-09 가 따로 본다" },
    "PT-COM": { laws: [{ lawId: "foodLabelAct", article: "제10조" }, { lawId: "mdAct", article: null }],
      note: "식품·건강기능식품 기능성 표시·광고와 의료기기 광고가 각각 다른 자율심의기구 체계다" },
  },
  referralByKind: {
    "PT-MED": { laws: [{ lawId: "medAct", article: "제27조" }],
      note: "수범자가 「누구든지」다 — 판정 대상이 협력업체가 아니라 **당사 계약·정산 구조**다" },
    "PT-CARE": { laws: [{ lawId: "ltcAct", article: "제35조" }],
      note: "금전·물품·노무·향응 제공 또는 약속 방법이 금지 태양이고, 조장 행위까지 포함한다" },
    "PT-SVC": { laws: [], note: "해당 없음 — 조항의 유형 해당성에서 제외된다" },
    "PT-COM": { laws: [], note: "해당 없음 — 조항의 유형 해당성에서 제외된다" },
  },
};

/* ══════════════ 법령 조회 — 조문 번호 렌더 규약이 여기 한 곳을 지난다 ══════════════ */
function pgLaw(lawId) { return (lawId && PG_LAWS[lawId]) ? PG_LAWS[lawId] : null; }

/* ★ 확인 등급의 단위는 **조문**이다.
   articles 를 가진 법률에 조문을 특정하지 않고 물으면 **「미확인」**을 돌려준다 — 근거 조문을 이름으로
   대지 못하면 요건 출처를 확인한 것이 아니다. 여기서 「articles 의 최솟값」을 돌려주면
   한 법률의 **다른 조문**이 받은 원문확인이 근거 조문 미입수인 조항으로 새어 들어간다
   (실측 사고: 장기요양법 제35조의 원문확인이 「장기요양기관 지정 자격」 축으로 흘러갔다).
   항목 수준 요약이 필요한 자리는 pgLawVerifiedMin 을 쓴다 — 그쪽은 화면 표시용이고 플로어가 보지 않는다. */
function pgLawVerified(lawId, article) {
  const L = pgLaw(lawId);
  if (!L) return "미확인";
  if (L.articles) { const a = article ? L.articles[article] : null; return a ? a.verified : "미확인"; }
  return L.verified || "미확인";
}
/* 항목 수준 요약(표시 전용) — 조문 등급의 최솟값. 하드 플로어는 이 값을 쓰지 않는다. */
function pgLawVerifiedMin(lawId) {
  const L = pgLaw(lawId);
  if (!L) return "미확인";
  if (!L.articles) return L.verified || "미확인";
  let min = "원문확인";
  for (const k of Object.keys(L.articles))
    if (PG_VERIFY_RANK[L.articles[k].verified] < PG_VERIFY_RANK[min]) min = L.articles[k].verified;
  return min;
}
/* 조항이 기대야 하는 시행일 — 조문 시행일이 있으면 그것이 이긴다(§8-4 규약 2).
   ⚠ articles 를 가진 법률에 조문을 특정하지 않으면 **null** 이다. 항목 수준 시행일로 떨어지면
     1차 출처가 시행예정판을 표시한 법률(장기요양보험법 — 헤더가 시행 2026-11-27)에서
     2013년부터 살아 있는 금지 조항이 「시행 전」으로 찍힌다. 그것은 사실과 다른 진술이다. */
function pgLawEffective(lawId, article) {
  const L = pgLaw(lawId);
  if (!L) return null;
  if (L.articles) {
    if (!article) return null;
    const a = L.articles[article];
    if (!a) return null;
    return a.effectiveDate || L.effectiveDate || null;
  }
  return L.effectiveDate || null;
}
/* ★ 조문 번호 렌더 게이트 — 원문확인이 아니면 **조문 번호도 법령 버전도 내보내지 않는다**(§6-4).
   법령 조문 번호와 표준 통제 번호 양쪽에 똑같이 적용된다. */
function pgLawRender(lawId, article) {
  const L = pgLaw(lawId);
  if (!L) return { name: "", article: null, lawVersion: null, verified: "미확인", label: "근거 법령 미등재" };
  const v = pgLawVerified(lawId, article);
  const full = PG_VERIFY_RANK[v] >= PG_VERIFY_RANK["원문확인"];
  const no = full ? ((article && L.articles && L.articles[article] ? L.articles[article].article : null) || L.article || null) : null;
  return {
    name: L.name, basis: L.basis, article: no, lawVersion: full ? (L.lawVersion || null) : null,
    verified: v, effectiveDate: pgLawEffective(lawId, article),
    label: no ? (L.name + " " + no) : (L.name + " (조문 미확인)"),
    source: full ? (L.source || null) : null,
    /* ★ 미도래 개정을 **표시 전용 칸으로** 통과시킨다(2026-10-26 신설). 판정에는 쓰지 않는다 —
       그 개정이 어느 조문을 바꾸는지 미확인이므로 어느 조항에도 시행일을 부여하지 않는다(§13-5 금지).
       왜 통과시켜야 하는가: 레지스트리에 **원문확인 등급의 미도래 개정 1건**(의료법 — 법률 제21238호 ·
       시행 2026-12-24)이 들어 있는데 이 함수가 그 칸을 탈락시켜 **지면 어디에도 나오지 않았고**,
       그 결과 B7 이 「시행 예정 조항 없음」, E6 이 빈 목록을 인쇄했다. B7 은 「이 보고서가 말할 수
       없는 것」을 적는 자리인데 말할 수 없는 것을 **없다고 적고** 있었다(「시행 전은 「예정」」·
       「미확인 조항은 「확인 대기」로만 보인다」와 어긋난다). 조항 축과 법령 축을 섞지 않는다. */
    pendingAmend: L.pendingAmend || null,
  };
}
/* ★ 제재 렌더 게이트 — pgLawRender 와 **동형**이다(2026-10-26 신설 · §6-4 의 논리를 제재 축에 적용).
   왜 필요한가: 레지스트리의 제재 항목 32건 중 **원문확인은 1건**(인공지능기본법 과태료)뿐인데,
   지면 6자리가 `sanction.kind` 를 그대로 인쇄했다 — 「개인정보 보호법 … 제재 과태료」 「의료법 …
   형벌」 「노인장기요양보험법 … 형벌」 「EU 인공지능법 … 과징금」. 데이터 자신이 그 항목에
   「제재 축을 판정 · 렌더에 쓰지 않는다」고 적어 두었는데도 그랬다. §6-4 가 조문 번호에 세운 논리가
   그대로 적용된다 — 배지를 달고도 확인하지 않은 제재 종류를 인쇄하면 「알고도 인쇄했다」는 기록이
   된다. 미확인이면 **종류를 인쇄하지 않고** 그 사실만 적는다.
   ⚠ 검사 소유자는 run_wording_guard 검사 ⑲(게이트 밖 렌더 자리 0건)다 — 정적으로 볼 수 있는 축이다. */
function pgSanctionRender(sanction) {
  if (!sanction) return { has: false, none: true, kind: null, max: null, verified: null, label: "—" };
  const v = sanction.verified || "미확인";
  const full = PG_VERIFY_RANK[v] >= PG_VERIFY_RANK["원문확인"];
  const none = (sanction.kind === "없음" || !sanction.kind);
  if (!full) return { has: true, none: none, kind: null, max: null, verified: v, label: none ? "—" : "제재 미확인", note: sanction.note || null };
  const kind = sanction.kind || "—";
  return { has: true, none: none, kind: kind, max: sanction.max || null, verified: v,
    label: kind + (sanction.max ? " · 상한 " + sanction.max : ""), note: sanction.note || null };
}

/* 조항의 lawRef 를 유형에 따라 실제 법령 목록으로 푼다. 직접 참조와 유형별 집합을 한 함수로 다룬다. */
function pgLawResolve(lawRef, article, kind) {
  if (!lawRef) return [];
  if (PG_LAW_SETS[lawRef]) {
    const row = PG_LAW_SETS[lawRef][kind];
    if (!row) return [];
    return row.laws.map((x) => ({ lawId: x.lawId, article: x.article }));
  }
  return [{ lawId: lawRef, article: article || null }];
}
/* 하드 플로어가 보는 값 — 전건의 확인 등급 최솟값과 시행일 최댓값. 하나라도 미확인이면 DENY 불가. */
function pgLawCite(lawRef, article, kind) {
  const hits = pgLawResolve(lawRef, article, kind);
  if (!hits.length) return { laws: [], verified: "미확인", effectiveDate: null, render: [], empty: true };
  let minV = "원문확인", maxEff = null, anyNull = false;
  const render = [];
  for (const h of hits) {
    const v = pgLawVerified(h.lawId, h.article);
    if (PG_VERIFY_RANK[v] < PG_VERIFY_RANK[minV]) minV = v;
    const eff = pgLawEffective(h.lawId, h.article);
    if (!eff) anyNull = true; else if (!maxEff || eff > maxEff) maxEff = eff;
    render.push(pgLawRender(h.lawId, h.article));
  }
  const L0 = pgLaw(hits[0].lawId) || {};
  return {
    laws: hits, verified: minV, effectiveDate: anyNull ? null : maxEff, render, empty: false,
    sanction: L0.sanction || null, enforcementGrace: L0.enforcementGrace || null,
    appliesToSelf: !!L0.appliesToSelf, cite: L0.cite || null,
  };
}

/* ══════════ ③ PG_POLICIES — 조항 전수(순수 데이터) ══════════
   ★ 입력 계약 · 판정 대상 · 결함 등급 · 생애주기 · 유형 해당성 · 디스패치 키는 **PG_INPUTS 가 소유**한다.
     여기서 다시 적으면 같은 조항이 두 값을 갖는다(이 저장소가 두 번 겪은 사고 유형).
     P3 가 더하는 것만 PG_POLICY_EXT 에 둔다.
   ⚠ §6-2 의 `axis` 와 P2 의 `subject` 는 **같은 축의 두 이름**이다. 새 필드를 만들지 않고
     axis 를 subject 에서 파생시키고, 러너가 두 값의 일치를 단언한다. */
const PG_POLICY_EXT = {
  /* lawArticle   = 직접 참조 조항이 기대는 조문. 유형별 집합(lawRef ∈ PG_LAW_SETS)이면 **null 이어야** 한다
     effectiveDate= 조항 시행일 override. 유형별 집합이면 null 이어야 한다(유형마다 다르므로)
     contractBasis= 계약 조항 근거. **채워지기 전에는 soft · hard 로 올라가지 못한다**(§7-7 1)
     remedy       = 시정 과제 {what, owner, due, status} — 무엇을 제출하면 올라가는가
     locked       = 어떤 집행 수준으로도 열리지 않는다(§6-3) */
  "L-01": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "사업자등록증 사본과 영업 상태 조회 결과 제출", owner: "협력업체", due: "온보딩 + 분기", status: "미착수" }] },
  "L-02": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "유형별 자격증 사본 · 발급기관 조회 결과 · 근거 행위(허가/신고/등록/지정) 명시", owner: "협력업체", due: "온보딩 + 연", status: "미착수" },
             { what: "제조 자격 보유 시 위탁 제조소 지정 증빙", owner: "협력업체", due: "온보딩", status: "미착수" }] },
  "L-03": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "심의 결과서 사본 + 심의기구명 + 심의번호 + 유효기간 제출", owner: "협력업체", due: "품목 등재 시", status: "미착수" }] },
  "L-04": { lawArticle: "제26조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "필수 기재 7항목을 담은 위수탁 계약서 체결 · 결측 항목 보완", owner: "협력업체 + 당사 법무", due: "계약 체결 · 변경 시", status: "미착수" }] },
  "L-05": { lawArticle: "제26조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "재위탁 현황 신고와 위탁자 동의 기록 제출(4차 포함)", owner: "협력업체", due: "반기", status: "미착수" }] },
  "L-06a": { lawArticle: "제26조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "당사 개인정보 처리방침에 해당 수탁자(재수탁자 포함) 기재", owner: "당사 개인정보 보호 담당", due: "사유 발생 즉시", status: "미착수" }] },
  "L-06b": { lawArticle: "제26조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "홍보 · 판매권유 위탁 건의 정보주체 개별 고지 발송과 변경 시 재고지 체계 수립", owner: "당사 개인정보 보호 담당", due: "위탁 개시 전", status: "미착수" }] },
  "L-07": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "최근 3년 행정처분 이력 제출과 소명", owner: "협력업체", due: "분기", status: "미착수" }] },
  "L-08": { lawArticle: "제31조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "고영향 해당성 판정 근거와 사전 고지 문구 · 화면 증빙 제출", owner: "협력업체", due: "서비스 등재 시 + 연", status: "미착수" },
             { what: "고지 문구 보완(제재가 과태료 수준이고 소관 부처 집행 유예가 확인된 조항이다 — 거래 차단이 아니다)", owner: "협력업체", due: "보완 요구 후 30일", status: "미착수" }] },
  "L-09": { lawArticle: null, effectiveDate: null, contractBasis: null, locked: true,
    remedy: [{ what: "정산 산식의 구조 변경 과제 수립 — 진료비 · 급여비 연동과 소개수수료 구조의 해소", owner: "당사 경영", due: "법률 검토 회신 후", status: "대기" },
             { what: "법률 검토 회신 확보(해제 조건이다)", owner: "당사 법무", due: "미정", status: "진행" }],
    note: "집행은 경고 · 기록 고정이다(Q11 형 확정). 산식은 회신 전까지 **동결**이고 이 조항이 산식을 건드리지 않는다 — " +
          "회신 없이 산식을 고치면 확인하지 못한 법으로 우리 거래를 끊는 일이 된다. locked:true 가 그것을 코드로 막는다." },
  "L-10": { lawArticle: "제20조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "중개 지면에 통신판매중개자 지위 고지 문구를 미리 고지되는 위치에 등재", owner: "당사 커머스", due: "지면 변경 시", status: "미착수" }] },
  "L-11": { lawArticle: "제20조의2", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "당사가 통신판매업자 지위를 겸하는 거래 구간을 식별하고 청약철회 처리 체계를 세운다", owner: "당사 커머스 + 법무", due: "연", status: "미착수" }] },

  "P-01": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "제품 라벨 · 성분표 제출", owner: "협력업체", due: "품목 등재 시", status: "미착수" }] },
  "P-02": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "회수 이력과 미완료 회수 보유 여부 제출 · 미완료 건 해소", owner: "협력업체", due: "월", status: "미착수" }] },
  "P-03": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "배송 기준일 초과 원인 분석과 개선 계획 제출", owner: "협력업체", due: "초과 월 익월", status: "미착수" }] },
  "P-04": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "서비스 제공 레코드 연동(없으면 해당 없음이고 0%가 아니다)", owner: "당사 데이터 + 협력업체", due: "미정", status: "미착수" }] },
  "P-05": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "응급 · 이상 상황 전달 경로 등록과 훈련 기록 제출", owner: "협력업체", due: "반기", status: "미착수" }] },
  "P-06": { lawArticle: "제20조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "민원 · 분쟁 접수 · 처리 체계 문서와 처리 통계 제출", owner: "협력업체", due: "반기", status: "미착수" }] },
  "P-07": { lawArticle: "제17조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "청약철회 약관과 거절 사유별 처리 실적 제출", owner: "협력업체", due: "연", status: "미착수" }] },
  "P-08": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "모델 카드 · 검증 보고서 · 버전 관리 기록 제출", owner: "협력업체", due: "모델 버전 변경 시", status: "미착수" }] },
  "P-09": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "제공 행위 목록과 판단 요건 대조표 제출", owner: "협력업체", due: "서비스 등재 시", status: "미착수" },
             { what: "경계 사례는 소관 부처 유권해석 신청과 회신 제출(판정 보류를 푸는 유일한 입력이다)", owner: "협력업체", due: "회신 소요 기간", status: "미착수" }] },

  "T-01": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "책임자 지정 문서와 최근 1년 활동 기록 제출", owner: "협력업체", due: "연", status: "미착수" }] },
  "T-02": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "위험목록과 갱신 이력 제출", owner: "협력업체", due: "연", status: "미착수" }] },
  "T-03": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "접근통제 정책과 계정 · 권한 점검 기록 제출", owner: "협력업체", due: "반기", status: "미착수" }] },
  "T-04": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "인증서와 **범위 명세** 제출 — 범위 밖 인증은 그 조항의 증거가 아니다", owner: "협력업체", due: "연", status: "미착수" }] },
  "T-05": { lawArticle: "제26조", effectiveDate: null, contractBasis: null,
    remedy: [{ what: "교육 계획과 이행 기록 · 관리 현황 점검 기록 제출", owner: "협력업체", due: "연", status: "미착수" }] },
  "T-06": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "미비점 등록에서 종결까지의 시정 이력 제출", owner: "협력업체", due: "반기", status: "미착수" }] },
  "T-07": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "대외 고지 채널과 최근 고지 실적 제출", owner: "협력업체", due: "연", status: "미착수" }] },
  "T-08": { lawArticle: null, effectiveDate: null, contractBasis: null,
    remedy: [{ what: "준법 체계 문서와 **반부패 체계 문서를 각각** 제출 · 운영 기록 제출", owner: "협력업체", due: "연", status: "미착수" }] },
};

/* 조항 테이블 조립 — 함수를 담지 않는다(§6-5 · 단언 7). 입력 계약은 PG_INPUTS 에서 그대로 가져온다. */
function _pgBuildPolicies() {
  const src = (typeof PG_INPUTS !== "undefined") ? PG_INPUTS : [];
  const out = [];
  for (const p of src) {
    const ext = PG_POLICY_EXT[p.id] || {};
    out.push({
      id: p.id, group: p.group, axis: p.subject, subject: p.subject,
      lifecycle: p.lifecycle, appliesTo: p.appliesTo.slice(), title: p.title,
      lawRef: p.lawRef, lawArticle: ext.lawArticle || null, ruleId: p.ruleId,
      inputs: p.inputs.map((i) => i.obj + "." + i.k),
      severity: p.severity, cycle: p.cycle, obligation: !!p.obligation, dual: !!p.dual,
      effectiveDate: ext.effectiveDate || null,
      contractBasis: ext.contractBasis || null,
      locked: !!ext.locked,
      remedy: (ext.remedy || []).map((r) => ({ what: r.what, owner: r.owner, due: r.due, status: r.status })),
      evidence: (p.evidence || []).slice(),
      note: ext.note || p.note || null,
    });
  }
  return out;
}
const PG_POLICIES = _pgBuildPolicies();
function pgPolicy(id) { for (const p of PG_POLICIES) if (p.id === id) return p; return null; }

/* ══════════════ ④ PG_ENFORCE — 집행 수준 배포 테이블 ══════════════
   수준은 **정책 코드가 아니라 이 테이블**에서 지정한다(§7-2). 조항을 고치지 않고 수준만 올릴 수 있다.
   ⚠ 여기 적힌 값은 **선언된 의도**이고, 실효 수준은 pgEnforceLevel 이 플로어를 적용한 결과다.
      오늘은 contractBasis 가 전건 null 이므로 **실효 수준이 전건 advisory** 다 — 그것이 설계 의도이고
      §7-3-1 ③의 기대 차단 건수 0건과 같은 사실이다(전면 차단 사고가 아니다).
   ⚠ L-09 는 Q11 형 확정으로 **조항 단위 advisory 고정**이다. soft · hard 가 하나라도 나타나면 러너가 실패한다. */
const PG_ENFORCE = (function () {
  const T = {};
  const src = (typeof PG_INPUTS !== "undefined") ? PG_INPUTS : [];
  for (const p of src) {
    const ext = PG_POLICY_EXT[p.id] || {};
    /* 의무 조항은 등록 지점에서 soft 를 의도한다. 권고와 잠금 조항은 advisory 다.
       정산 · 노출 지점은 거래상 지위 쟁점 때문에 **선언 자체를 advisory 로 둔다** — 코드 상한과 같은 값을
       적어 두는 것이, 상한에 걸릴 값을 적어 놓고 「올려 뒀다」고 읽히는 것보다 정직하다(§7-7 1). */
    const reg = (p.obligation && !ext.locked) ? "soft" : "advisory";
    T[p.id] = { "pep.register": reg, "pep.settle": "advisory", "pep.expose": "advisory" };
  }
  return T;
})();

/* 집행 설계를 규율하는 법령에 대응하는 **우리 쪽 장치** — 단언 12 가 이 연결을 요구한다.
   수범자가 우리인 조문을 협력업체에만 걸면 실패한다. 조문이 미확인이어도 상한은 내릴 수 있다. */
const PG_SELF_ENFORCE = [
  { lawRef: "ecomm", where: "pgEnforceLevel + L-10 · L-11",
    cap: "정산 · 노출 지점 advisory 상한 + 당사 축 조항 2건(지위 고지 · 청약철회 책임)",
    why: "고지를 하더라도 면제되지 않는 책임 구간이 있다 — 그 구간을 협력업체 축으로 돌릴 수 없다" },
  { lawRef: "ftcAct", where: "pgEnforceLevel",
    cap: "정산 · 노출 지점 advisory 상한 · contractBasis 없으면 승격 불가 · 집행 근거 법령 미확인이면 승격 불가",
    why: "집행 수단 자체의 적법성 축이다. 조문이 미확인이므로 판정에는 쓰지 않고 **상한을 내리는 쪽으로만** 쓴다" },
  { lawRef: "medAct", where: "PG_ENFORCE['L-09'] + locked",
    cap: "조항 단위 advisory 고정 · 정산 산식 동결",
    why: "수범자가 「누구든지」이므로 우리 정산 구조가 판정 대상이다. 구조 변경을 먼저 하고 집행 수준은 그 다음이다" },
  { lawRef: "ltcAct", where: "PG_ENFORCE['L-09'] + locked",
    cap: "같다", why: "돌봄 스트림의 같은 구조. 금지 태양과 제재가 의료법과 달라 근거를 분리 등재했다" },
  { lawRef: "pipa", where: "L-06a · L-06b",
    cap: "당사 지면을 판정 대상으로 두는 조항 2건",
    why: "수탁자 공개와 홍보 · 판매권유 개별 고지는 협력업체가 아무것도 제출하지 않아도 판정된다" },
  { lawRef: "pipaDecree", where: "L-04 분모", cap: "필수 기재 7항목 고정",
    why: "법 2항목 + 영 5항목이 한 분모다. 쪼개면 분모가 어긋난다" },
  { lawRef: "internal", where: "verified 미확인 → 판정 제외",
    cap: "규약 문서가 제정될 때까지 이 축에 기대는 조항은 판정이 보류된다",
    why: "우리 규약이 없는 상태로 남의 이행을 재지 않는다" },
];

/* ══════════════ ⑤ PG_THRESH — 통제 임계 상수 ══════════════
   ★ 이 상수가 **이 파일 밖에 리터럴로 나타나면 run_pg_policy.mjs 가 실패**한다(§7-6 ③).
     그리고 localStorage 를 읽지 않는다 — 저장값을 주입해도 임계가 바뀌지 않는다(§7-6 ①).
     조정 가능한 것(소명 기한일 · 보고서 기간 범위 · 경고 임계)은 P4 가 OPS_SPEC 에 둔다. */
const PG_THRESH = {
  dpaRequiredItems: 7,        /* 개인정보 위수탁 필수 기재 항목 수 — 법 2 + 영 5 */
  licenseWarnDays: 30,        /* 자격 만료 사전 통지일 */
  sanctionLookbackYears: 3,   /* 행정처분 이력 조회 기간 */
  activityMonths: 12,         /* 통제군 T 「기능」 판정의 최근 활동 기록 유효 기간 */
  reviewMonths: 6,            /* 반기 주기 통제의 「기능」 판정 유효 기간 */
  adReviewMonths: 36,         /* 광고 자율심의 결과의 유효기간 상한(승인일부터 3년) */
};
/* 주기 → 「기능」 판정 유효 월수. 통제군 T 의 존재 / 기능 2판정이 이 표를 쓴다. */
const PG_CYCLE_MONTHS = { "온보딩": null, "월": 1, "분기": 3, "반기": 6, "연": 12, "사유발생": null };

/* ══════════════ 면제(Exemption) — 만료일 없는 면제는 등록 자체를 거부한다 ══════════════
   §6-6 — 산업 표준에도 override 만료 규정이 없으므로 우리가 만든다. 설계 단계에서 빠뜨리면
   나중에 추가해도 **이미 등록된 면제가 영구히 남는다**.
   ⚠ 영속화(저장 키)는 P4 다. 이 파일은 저장 키를 만들지 않는다 — P3 는 규약과 순수 함수까지다. */
const PG_EXEMPT = [];   /* {policyId, partnerId, reason, approver, approvedAt, expireAt} */
function pgExemptAdd(e, sink) {
  const bad = [];
  if (!e || !e.policyId || !pgPolicy(e.policyId)) bad.push("등재되지 않은 조항");
  if (!e || !e.partnerId) bad.push("대상 식별자 없음");
  if (!e || !e.reason) bad.push("사유 없음");
  if (!e || !e.approver) bad.push("승인자 없음");
  if (!e || !e.expireAt) bad.push("만료일 없음 — 만료일 없는 면제는 등록하지 않는다");
  if (e && e.policyId && pgPolicy(e.policyId) && pgPolicy(e.policyId).locked) bad.push("잠금 조항은 면제를 등록할 수 없다");
  if (bad.length) { if (sink) sink.push(bad.join(" / ")); return { ok: false, reason: bad.join(" / ") }; }
  PG_EXEMPT.push({ policyId: e.policyId, partnerId: e.partnerId, reason: e.reason,
    approver: e.approver, approvedAt: e.approvedAt || null, expireAt: e.expireAt });
  return { ok: true, n: PG_EXEMPT.length };
}
/* 만료 경과 시 **자동으로 차단 복귀** — 날짜 비교는 문자열 사전순이다(벽시계 0건). */
function pgExemptFor(policyId, partnerId, asOf) {
  const now = asOf || PG_ASOF;
  for (const x of PG_EXEMPT)
    if (x.policyId === policyId && x.partnerId === partnerId && x.expireAt >= now)
      return { reason: x.reason, approver: x.approver, expireAt: x.expireAt };
  return null;
}

/* ══════════════ 집행 수준 — 플로어가 전부 여기 한 곳을 지난다 ══════════════
   반환 {level, floors[], cap} — floors 는 **무엇이 수준을 내렸는지**를 이름으로 돌려준다.
   화면·러너는 이 사유를 렌더만 하고 자체 문장을 만들지 않는다. */
function _pgCap(level, cap) {
  return (PG_LEVEL_RANK[level] > PG_LEVEL_RANK[cap]) ? cap : level;
}
function pgEnforceLevel(policyId, pep, ctx) {
  const c = ctx || {};
  const floors = [];
  if (PG_PEPS.indexOf(pep) < 0) return { level: "advisory", floors: ["등재되지 않은 집행 지점"], cap: "advisory" };

  /* ⓪ 반출 지점 — **선언 수준의 원천이 조항 테이블이 아니다.**
     반출 규약은 조항이 아니고(근거가 법령이 아니라 당사 규약이며 판정 대상이 우리 산출물이다)
     그래서 집행 수준을 조항별 `PG_ENFORCE` 가 아니라 **반출 배포 테이블**이 갖는다.
     ★ 이 분기를 두는 이유: 종전에는 `PG_ENFORCE` 생성 루프가 `pep.export` 칸을 비워 두어
       이 함수가 **advisory** 를 돌려주는데 실제 hard 는 반출 배포 테이블만 들고 있었다 —
       「집행 수준을 묻는 함수」가 둘이 되어, P5a · P7 이 이 함수에 물으면 hard 를 받지 못했다.
       지점의 수준을 묻는 함수는 **하나**다(§15-8 · §7-6 ②).
     ★ 승격 플로어(계약 조항 근거 · 근거 법령 확인 등급 · 집행 유예 · 제재 비례성)를 적용하지 않는다.
       플로어는 「확인하지 못한 법으로 **남의** 거래를 끊지 않는다」를 위한 것이고, 이 지점이 막는 것은
       우리가 밖으로 내보내는 문서다 — 플로어를 적용하면 보호 장치가 보호 대상을 막는다. */
  if (pep === "pep.export") {
    const tbl = (typeof PG_EXPORT_ENFORCE !== "undefined") ? PG_EXPORT_ENFORCE : null;
    const rule = (typeof PG_EXPORT_RULE !== "undefined") ? PG_EXPORT_RULE : "PG-EXPORT";
    const dec = (tbl && tbl[rule] && tbl[rule]["pep.export"]) || "advisory";
    const capped = _pgCap(dec, PG_ENFORCE_CAP["pep.export"]);
    const fl = ["반출 규약 배포 테이블(" + rule + ")이 선언 수준의 원천이다 — 조항별 집행 수준표가 아니다"];
    if (capped !== dec) fl.push("집행 지점 상한(pep.export → " + PG_ENFORCE_CAP["pep.export"] + ")");
    return { level: capped, floors: fl, cap: PG_ENFORCE_CAP["pep.export"], declared: dec, rule: rule };
  }

  const pol = pgPolicy(policyId);
  if (!pol) return { level: "advisory", floors: ["등재되지 않은 조항"], cap: "advisory" };
  let lv = (PG_ENFORCE[policyId] && PG_ENFORCE[policyId][pep]) || "advisory";

  /* ⓐ 집행 지점 상한 — 코드 고정(§7-7 1) */
  const before1 = lv; lv = _pgCap(lv, PG_ENFORCE_CAP[pep]);
  if (lv !== before1) floors.push("집행 지점 상한(" + pep + " → " + PG_ENFORCE_CAP[pep] + ")");

  /* ⓑ 잠금 조항 — 어떤 집행 수준으로도 열리지 않는다(§6-3) */
  if (pol.locked) { if (lv !== "advisory") floors.push("조항 잠금 — 법률 검토 회신 전까지 경고 · 기록만"); lv = "advisory"; }

  /* ⓒ 계약 조항 근거 — 채워지기 전까지 승격 불가(§7-7 1) */
  if (!pol.contractBasis) { const b = lv; lv = _pgCap(lv, "advisory"); if (lv !== b) floors.push("계약 조항 근거(contractBasis) 미기재 — 승격 불가"); }

  /* ⓓ 집행 근거 법령의 확인 등급 — 미확인이면 승격 불가(§7-7 1 v2.1) ·
       원문확인에서 내려가면 자동 advisory 격하(§7-6 되돌림 경로) */
  const kinds = pol.appliesTo || [];
  let minV = "원문확인";
  for (const k of kinds) { const v = pgLawCite(pol.lawRef, pol.lawArticle, k).verified; if (PG_VERIFY_RANK[v] < PG_VERIFY_RANK[minV]) minV = v; }
  if (c.kind) minV = pgLawCite(pol.lawRef, pol.lawArticle, c.kind).verified;
  if (PG_VERIFY_RANK[minV] < PG_VERIFY_RANK["원문확인"]) {
    const b = lv; lv = _pgCap(lv, "advisory");
    if (lv !== b) floors.push("근거 법령 확인 등급 " + minV + " — 확인하지 못한 법 아래에서 거래를 끊지 않는다");
  }

  /* ⓔ 소관 부처 집행 유예 — 상한 advisory(§5-2-1) */
  const cite = pgLawCite(pol.lawRef, pol.lawArticle, c.kind || kinds[0]);
  if (cite.enforcementGrace) { const b = lv; lv = _pgCap(lv, "advisory"); if (lv !== b) floors.push("법정 의무이나 소관 부처 집행 유예 중"); }

  /* ⓕ 제재가 과태료 수준인 조항은 hard 로 올라가지 않는다 — 비례성(단언 13) */
  if (cite.sanction && cite.sanction.kind === "과태료") { const b = lv; lv = _pgCap(lv, "soft"); if (lv !== b) floors.push("제재 수준이 과태료 — 면제 불가 차단은 비례성에 어긋난다"); }

  /* ⓖ 단계 × 원인 집행 효과 — 값의 원천은 PG_STAGE_EFFECT(P2) 다. 여기서 다시 정하지 않는다 */
  if (c.cause) {
    const row = _pgStageEffect(c.cause, c.stage, !!cite.enforcementGrace);
    if (row) {
      if (row.level === null) { lv = "advisory"; floors.push("원인 " + c.cause + " — 집행 대상이 아니다"); }
      else if (row.level === "advisory" || row.level === "advisory(상한)") { const b = lv; lv = _pgCap(lv, "advisory"); if (lv !== b) floors.push("단계 집행 효과 — " + row.render); }
      else if (row.level === "soft") { const b = lv; lv = _pgCap(lv, "soft"); if (lv !== b) floors.push("단계 집행 효과 — " + row.render); }
      if (row.needs && PG_VERIFY_RANK[minV] < PG_VERIFY_RANK["원문확인"]) { lv = "advisory"; floors.push("증거 미제출 차단의 전제(근거 법령 원문확인)가 충족되지 않았다"); }
    }
  }
  return { level: lv, floors: floors, cap: PG_ENFORCE_CAP[pep], declared: (PG_ENFORCE[policyId] || {})[pep] || "advisory" };
}
/* P2 의 단계 × 원인 효과 표를 읽는다 — 우리가 다시 정하지 않는다. */
function _pgStageEffect(cause, stage, grace) {
  const T = (typeof PG_STAGE_EFFECT !== "undefined") ? PG_STAGE_EFFECT : [];
  if (grace) { for (const r of T) if (r.grace) return r; }
  for (const r of T) if (r.cause === cause && r.stage === stage) return r;
  for (const r of T) if (r.cause === cause && r.stage === "*") return r;
  return null;
}
/* 집행 수준 전환 — **하향과 무근거 승격을 코드에서 거부한다**(§7-6 2 · ratchet).
   저장값이 배포 테이블보다 낮은 수준을 지정하면 배포 테이블 값으로 폴백한다. */
function pgEnforceSet(policyId, pep, want, who) {
  const pol = pgPolicy(policyId);
  if (!pol) return { ok: false, reason: "등재되지 않은 조항" };
  if (PG_PEPS.indexOf(pep) < 0) return { ok: false, reason: "등재되지 않은 집행 지점" };
  if (!PG_LEVEL_RANK[want]) return { ok: false, reason: "허용되지 않은 집행 수준" };
  const cur = (PG_ENFORCE[policyId] || {})[pep] || "advisory";
  if (PG_LEVEL_RANK[want] < PG_LEVEL_RANK[cur])
    return { ok: false, reason: "하향 거부 — 배포 테이블 값(" + cur + ")으로 폴백한다", level: cur };
  const eff = pgEnforceLevel(policyId, pep, {});
  if (PG_LEVEL_RANK[want] > PG_LEVEL_RANK[eff.level]) {
    /* 사유가 비면 「플로어」라고만 적히고 무엇이 막았는지 알 수 없다 — 상한 자체를 사유로 적는다 */
    const why = eff.floors.length ? eff.floors[0] : ("집행 지점 상한(" + pep + " → " + eff.cap + ")");
    return { ok: false, reason: "승격 거부 — " + why, level: eff.level, floors: eff.floors.length ? eff.floors : [why] };
  }
  PG_ENFORCE[policyId][pep] = want;
  return { ok: true, level: want, by: who || null };
}

/* ══════════════ ⑥ pgDecide — 판정 단일 진입점 ══════════════
   §6-5 — 조항에는 ruleId 만 둔다. 판정 분기는 **아래 클로저 안의 디스패치 표**에 모았고
   전역에 노출하지 않는다. 화면 · 러너 · 에이전트가 분기를 직접 부를 수 있으면 하드 플로어가 우회된다.
   §11-1 — 반환 계약이 곧 화면 계약이다. 화면은 이 필드들을 렌더만 하고 자체 문장을 만들지 않는다.
   ★ 반환값에 상호를 담지 않는다(Q4 확정) — rec.partnerId 만 다루고 표시명은 pgDisplayName 이 따로 만든다.
     판정기가 이름을 반환하면 모드 스위치의 사정권이 판정기 안으로 번지고, 반환값을 그대로 쓰는
     로그 · 스냅샷에까지 상호가 흘러든다(커밋이 반출이다). */
const pgDecide = (function () {

  /* 입력 객체 → 레코드 경로. PG_OBJ 사전의 키와 1:1 이다. */
  function g(rec, obj, k) {
    if (!rec) return undefined;
    const bag = { submit: rec.submit, license: rec.licenses, site: rec.manufacturingSites,
      evidence: rec.evidence, published: rec.published, vendor: rec.vendor, contract: rec.contract,
      product: rec.products, order: rec.orders, shipment: rec.shipments, rollup: rec.rollup,
      self: rec.self, ops: rec.ops, partner: rec };
    const src = bag[obj];
    if (src === undefined || src === null) return undefined;
    if (Array.isArray(src)) return src.length ? src : undefined;
    return _dig(src, k);
  }
  function _dig(o, path) {
    let cur = o;
    for (const seg of String(path).replace(/\[\]$/, "").split(".")) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[seg];
    }
    return cur;
  }
  const miss = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
  const R = (decision, cause, reasons, used, axis) => ({ decision, cause, reasons: reasons || [], used: used || [], axis: axis || null });
  /* ★ INP 는 **읽은 필드를 함께 받는다**(used). 값이 없음을 확인하려고 읽은 필드는 **쓴 입력**이다.
     ⚠ 종전 서명은 `INP(what, used)` 이어서 R() 의 4번째 인자를 넘기지 않았고, 이 축약이 45곳에서 쓰이므로
       **판정을 만든 바로 그 필드가 `used:false` 로 돌아왔다**(실측: cause=input_missing 칸 276/276 전건
       「쓴 것 0」). 그러면 추적 레인 1 이 「흐린 줄은 이 판정에 쓰이지 않은 입력입니다」를 결정적 입력에
       붙이고, 바로 위 레인 3 은 그 필드를 사유로 적는다 — 한 지면이 같은 필드를 두고 반대로 말한다.
       레인 1 의 목적은 **판정기가 무시한 입력을 드러내는 것**이므로, 거짓 「안 쓰임」은 그 목적을 뒤집는다. */
  const INP = (what, used) => R("INDETERMINATE", "input_missing", ["증거 미제출 — " + what], used);
  /* 존재 / 기능 2판정(COSO 「present and functioning」)의 결과를 **구조 필드로** 돌려준다.
     ★ 왜 필드인가: 결론 산출(pgTrustConclusion)이 「존재하되 미기능」을 판별해야 하는데, 그것을
       **사유 문장 정규식**으로 가르면 사유 한 낱말을 다듬는 것만으로 §5-5 의 「하나라도 미기능이면
       결론 보류」가 조용히 「결함 있음」으로 뒤집힌다. 화면이 문장을 파싱하지 않는다는 §11-1 의
       원칙은 **집계 쪽에도 똑같이 적용된다** — 집계도 문장을 파싱하지 않는다.
     axis 값: "존재" = 존재 자체가 없다 · "기능" = 존재하되 기능하지 않는다 · null = 그 축이 아니다 */
  const AXIS_EXIST = "존재", AXIS_FUNC = "기능";
  /* 「기능」 판정 — 최근 기록이 주기 안에 있는가. 월 단위 문자열 비교로만 센다(벽시계 0건). */
  function _stale(lastISO, months, asOf) {
    if (miss(lastISO) || !months) return null;
    const a = String(lastISO).slice(0, 7).split("-"), b = String(asOf).slice(0, 7).split("-");
    const d = (Number(b[0]) * 12 + Number(b[1])) - (Number(a[0]) * 12 + Number(a[1]));
    return d > months;
  }

  /* ── 비공개 디스패치 표 — 조항당 한 함수. 전역에 나가지 않는다 ───────────── */
  const RULES = {
    /* L-01 사업자 실존 · 영업 상태 */
    r_biz_status(rec, ctx) {
      const used = ["submit.biz_status"];
      const st = g(rec, "submit", "biz_status");
      if (miss(st)) return INP("영업 상태 조회 결과", used);
      if (st === "폐업" || st === "휴업") return R("DENY", "rule_violation", ["영업 상태가 「" + st + "」다"], used);
      return R("PERMIT", null, ["영업 상태가 계속사업자다"], used);
    },
    /* L-02 유형별 영업 자격 */
    r_license_valid(rec, ctx) {
      const used = ["license.type", "license.basis", "license.to"];
      const ls = g(rec, "license", "type");
      if (miss(rec.licenses)) return INP("유형별 자격증 사본과 발급기관 조회 결과", used);
      const noBasis = (rec.licenses || []).filter((x) => miss(x.basis));
      if (noBasis.length) return INP("자격의 근거 행위(허가 / 신고 / 등록 / 지정)", used);
      const expired = (rec.licenses || []).filter((x) => !miss(x.to) && x.to < ctx.asOf);
      if (expired.length) return R("DENY", "rule_violation", ["자격 만료일이 경과했다 — " + expired.length + "건"], used);
      const noTo = (rec.licenses || []).filter((x) => miss(x.to));
      if (noTo.length) return INP("자격 만료일", used);
      /* 제조 기준은 **제조업소에 적용된다** — 제조하지 않는 유통 · 수입 브랜드사는 이 축에서 해당 없음이다 */
      const mfg = (rec.licenses || []).filter((x) => x.basis === "허가" && /제조/.test(String(x.type || "")));
      if (mfg.length) {
        const sites = rec.manufacturingSites || [];
        if (!sites.length) return INP("위탁 제조소 지정 증빙", used);
        if (sites.filter((s) => s.gmp !== true).length)
          return R("DENY", "rule_violation", ["제조 자격 보유 협력업체의 위탁 제조소에 제조 기준 지정이 없다"], used.concat(["site.gmp"]));
      }
      const soon = (rec.licenses || []).filter((x) => _monthsLeft(x.to, ctx.asOf) <= 1);
      return R("PERMIT", null, soon.length
        ? ["자격이 유효하다 — 만료 " + PG_THRESH.licenseWarnDays + "일 전 통지 대상 " + soon.length + "건"]
        : ["자격이 유효하다"], used);
    },
    /* L-03 표시 · 광고 자율심의 */
    r_ad_review(rec, ctx) {
      const claim = (rec.products || []).filter((p) => /기능성|효능|효과|개선|치료|예방/.test(String(p.name || "") + String(p.claim || "")));
      const no = g(rec, "submit", "ad_review_no");
      const used = ["submit.ad_review_no", "submit.ad_review_to", "product.name"];
      if (!claim.length) {
        if (miss(rec.products)) return INP("품목 목록", used);
        return R("PERMIT", null, ["기능성 · 효능 표현이 있는 품목이 없다"], used);
      }
      if (miss(no)) return R("DENY", "rule_violation",
        ["기능성 · 효능 표현 품목 " + claim.length + "건이 있는데 자율심의 결과서가 없다"], used);
      const to = g(rec, "submit", "ad_review_to");
      if (miss(to)) return INP("자율심의 결과의 유효기간", used);
      if (to < ctx.asOf) return R("DENY", "rule_violation", ["자율심의 결과의 유효기간이 경과했다"], used);
      return R("PERMIT", null, ["자율심의 결과서가 유효하다"], used);
    },
    /* L-04 개인정보 위수탁 문서 요건 — 필수 기재 7항목 고정 */
    r_dpa_clauses(rec, ctx) {
      const keys = ["dpa_no_other_use", "dpa_safeguards", "dpa_purpose_scope", "dpa_subcontract_limit",
        "dpa_access_control", "dpa_supervision", "dpa_liability"];
      const used = keys.map((k) => "submit." + k);
      const have = keys.filter((k) => !miss(g(rec, "submit", k)));
      if (!have.length) return INP("위수탁 계약서(필수 기재 " + PG_THRESH.dpaRequiredItems + "항목)", used);
      if (have.length < PG_THRESH.dpaRequiredItems)
        return R("DENY", "rule_violation",
          ["필수 기재 " + PG_THRESH.dpaRequiredItems + "항목 중 " + (PG_THRESH.dpaRequiredItems - have.length) + "항목이 결측이다"], used);
      return R("PERMIT", null, ["필수 기재 " + PG_THRESH.dpaRequiredItems + "항목이 모두 기재됐다"], used);
    },
    /* L-05 재위탁 제한 · 위탁자 동의 */
    r_subcontract_consent(rec, ctx) {
      const ex = g(rec, "submit", "sub_exists");
      const used = ["submit.sub_exists", "submit.sub_consent_at"];
      if (miss(ex)) return INP("재위탁 유무(4차 포함)", used);
      if (ex !== true) return R("PERMIT", null, ["재위탁이 없다"], used);
      if (miss(g(rec, "submit", "sub_consent_at")))
        return R("DENY", "rule_violation", ["재위탁이 있는데 위탁자 동의 기록이 없다"], used);
      return R("PERMIT", null, ["재위탁에 위탁자 동의가 있다"], used);
    },
    /* L-06a 수탁자 공개 의무 — 당사 지면을 본다 */
    r_processor_disclosure(rec, ctx) {
      const list = _dig(rec.self || {}, "privacyPolicy.processors");
      const used = ["self.privacyPolicy.processors[]", "self.privacyPolicy.snapshotAt", "partner.partnerId"];
      if (miss(list)) return INP("당사 개인정보 처리방침 스냅샷", used);
      if ((list || []).indexOf(rec.partnerId) < 0)
        return R("DENY", "rule_violation", ["당사 처리방침에 이 수탁자가 기재되지 않았다"], used);
      return R("PERMIT", null, ["당사 처리방침에 수탁자로 기재돼 있다"], used);
    },
    /* L-06b 홍보 · 판매권유 위탁 시 개별 고지 */
    r_promo_notice(rec, ctx) {
      const kind = _dig(rec.self || {}, "delegation.kind");
      const used = ["self.delegation.kind", "self.notice.sentLog[]", "self.notice.changeLog[]"];
      if (miss(kind)) return INP("위탁 업무 성질(홍보 · 판매권유 해당 여부)", used);
      if (kind !== "홍보" && kind !== "판매권유")
        return R("NOT_APPLICABLE", "kind_mismatch", ["홍보 · 판매권유 위탁이 아니어서 개별 고지 의무가 발생하지 않는다"], used);
      if (miss(_dig(rec.self || {}, "notice.sentLog")))
        return R("DENY", "rule_violation", ["홍보 · 판매권유 위탁인데 정보주체 고지 발송 이력이 없다"], used);
      const ch = _dig(rec.self || {}, "delegation.changedAt");
      if (!miss(ch) && miss(_dig(rec.self || {}, "notice.changeLog")))
        return R("DENY", "rule_violation", ["위탁 내용이 변경됐는데 재고지 이력이 없다 — 변경 시에도 또한 같다"], used);
      return R("PERMIT", null, ["정보주체 개별 고지 이력이 있다"], used);
    },
    /* L-07 행정처분 · 제재 이력 — 권고다. 확인되지 않은 이력으로 거래를 끊지 않는다 */
    r_sanction_history(rec, ctx) {
      const list = g(rec, "submit", "sanction_list[]");
      const used = ["submit.sanction_list[]", "submit.sanction_level"];
      if (miss(list)) return INP("최근 " + PG_THRESH.sanctionLookbackYears + "년 행정처분 이력", used);
      const heavy = (list || []).filter((x) => /영업정지|허가취소|등록취소|지정취소/.test(String(x.level || x)));
      if (heavy.length) return R("DENY", "rule_violation",
        ["최근 " + PG_THRESH.sanctionLookbackYears + "년 내 영업정지 이상 처분 " + heavy.length + "건 — 중대 결함이고 소명 후 판단한다"], used);
      return R("PERMIT", null, ["최근 " + PG_THRESH.sanctionLookbackYears + "년 내 영업정지 이상 처분이 없다"], used);
    },
    /* L-08 인공지능 투명성 — 결정은 위반을 적고, **집행은 배포 테이블과 집행 유예가 내린다** */
    r_ai_transparency(rec, ctx) {
      const used = ["submit.ai_used", "submit.ai_highimpact", "submit.ai_highimpact_basis", "submit.ai_generative", "submit.ai_notice_text"];
      const u = g(rec, "submit", "ai_used");
      if (miss(u)) return INP("인공지능 사용 여부 · 범위", used);
      if (u !== true) return R("NOT_APPLICABLE", "kind_mismatch", ["인공지능을 이용한 제품 · 서비스가 아니다"], used);
      const hi = g(rec, "submit", "ai_highimpact"), gen = g(rec, "submit", "ai_generative");
      if (miss(hi) || miss(gen)) return INP("고영향 해당성과 생성형 여부", used);
      if (hi !== true && gen !== true) return R("PERMIT", null, ["고영향도 생성형도 아니어서 사전 고지 의무가 발생하지 않는다"], used);
      if (hi === true && miss(g(rec, "submit", "ai_highimpact_basis")))
        return INP("고영향 해당성 판정 근거(사업자 자체 확인 또는 소관 장관 확인 결과)", used);
      if (miss(g(rec, "submit", "ai_notice_text")))
        return R("DENY", "rule_violation", ["고영향 또는 생성형 제품 · 서비스인데 사전 고지 문구가 없다 — 고지 보완 요구 대상이다"], used);
      if (gen === true && miss(g(rec, "submit", "ai_gen_mark")))
        return R("DENY", "rule_violation", ["생성형 산출물임을 표시한 증빙이 없다"], used.concat(["submit.ai_gen_mark"]));
      return R("PERMIT", null, ["사전 고지와 산출물 표시가 확인된다"], used);
    },
    /* L-09 연계 · 소개 대가 구조 — **판정 대상이 당사 구조다.** 집행은 경고 · 기록 고정 */
    r_referral_fee(rec, ctx) {
      const s = rec.self || {};
      const used = ["self.contract.feeClause", "self.settle.linkedToTreatmentCost", "self.settle.introFeeExists",
        "self.exposure.selective", "self.careStream.payee", "self.legalReview.replyAt"];
      const linked = _dig(s, "settle.linkedToTreatmentCost"), intro = _dig(s, "settle.introFeeExists");
      if (miss(linked) || miss(intro)) return INP("당사 정산 산식의 연동 여부와 소개수수료 유무", used);
      const hits = [];
      if (linked === true) hits.push("정산 산식이 진료비 · 급여비에 연동된다");
      if (intro === true) hits.push("소개수수료가 존재한다");
      if (_dig(s, "exposure.selective") === true) hits.push("선별 노출이 있다");
      if (hits.length) return R("DENY", "rule_violation",
        hits.concat(["시정 과제는 차단이 아니라 구조 변경 과제와 법률 검토 회신이다 — 산식은 회신 전까지 동결이다"]), used);
      return R("PERMIT", null, ["진료비 · 급여비 연동과 소개수수료, 선별 노출이 확인되지 않는다"], used);
    },
    /* L-10 통신판매중개자 지위 고지
       ★ 불허가 **측정**에 기댄다(2026-10-26 교체). 종전 구현은 `self.shop.brokerNoticeText` 의 **결측**으로
         불허를 냈고, 그 결과가 협력업체 레코드 108행에 복제돼 실명 법인의 행 준수율 0.0% 가 전적으로
         당사 조항 하나에서 나왔다. 더 나쁜 것은 바로 다음 줄의 같은 성질의 결측(고지 시점)이 보류로
         갈렸다는 점이다 — 한 줄 차이로 결측이 불허와 보류로 나뉘면 지면이 자기 모순이 된다.
         그리고 E7 선언표는 「증거 미제출은 시정 과제이지 거래 중단 사유가 아니다」라고 적는다.
         그래서 입력을 **지면 고지 레지스트리 전수 실측값**(PG_SELF_SCAN)으로 바꿨다. 0곳은
         「세어 보았고 0곳이다」이지 「제출받지 못했다」가 아니다 — 미제출을 판정값으로 쓰지 않는다. */
    r_broker_notice(rec, ctx) {
      const s = rec.self || {};
      const used = ["self.shop.brokerNotice.n", "self.shop.brokerNotice.places", "self.shop.brokerNoticeWhen"];
      const scan = _dig(s, "shop.brokerNotice");
      if (miss(scan) || typeof scan.n !== "number") return INP("중개 지면 고지 자리 실측", used);
      if (scan.n === 0) return R("DENY", "rule_violation",
        ["중개 지면 고지 레지스트리를 전수로 세어 보니 통신판매중개자 지위 고지 자리가 0곳이다 — 미고지는 연대배상 사유다"], used);
      const when = _dig(s, "shop.brokerNoticeWhen");
      if (miss(when)) return INP("고지 시점 기록", used);
      if (when !== "미리") return R("DENY", "rule_violation", ["고지가 미리 이루어지지 않았다"], used);
      return R("PERMIT", null, ["중개자 지위를 " + scan.n + "곳에서 미리 고지한다"], used);
    },
    /* L-11 중개자 겸 통신판매업자 구간의 청약철회 책임 */
    r_broker_liability(rec, ctx) {
      const s = rec.self || {};
      const used = ["self.shop.statusMap[]", "self.shop.withdrawalProcess", "self.shop.withdrawalLog[]"];
      const map = _dig(s, "shop.statusMap");
      if (miss(map)) return INP("당사 지위 구분표(통신판매업자 지위를 겸하는 거래 구간)", used);
      const both = (map || []).filter((x) => x.selfIsSeller === true);
      if (!both.length) return R("NOT_APPLICABLE", "kind_mismatch", ["당사가 통신판매업자 지위를 겸하는 거래 구간이 없다"], used);
      if (miss(_dig(s, "shop.withdrawalProcess")))
        return R("DENY", "rule_violation", ["지위를 겸하는 구간 " + both.length + "건에 당사 청약철회 처리 체계가 없다 — 고지로 면제되지 않는 책임이다"], used);
      return R("PERMIT", null, ["지위를 겸하는 구간에 당사 청약철회 처리 체계가 있다"], used);
    },

    /* P-01 품목 실존 · 라벨 정합 — 라벨 미확인은 **위반이 아니라 판정 보류**다 */
    r_label_match(rec, ctx) {
      const used = ["product.id", "submit.label_doc"];
      if (miss(rec.products)) return INP("품목 목록", used);
      if (miss(g(rec, "submit", "label_doc"))) return INP("제품 라벨 · 성분표", used);
      return R("PERMIT", null, ["품목과 라벨이 대조된다"], used);
    },
    /* P-02 회수 · 리콜 이력 */
    r_recall_open(rec, ctx) {
      const used = ["submit.recall_list[]", "submit.recall_open", "product.id"];
      const open = g(rec, "submit", "recall_open");
      if (miss(open)) return INP("미완료 회수 보유 여부", used);
      if (open === true) return R("DENY", "rule_violation", ["미완료 회수 건을 보유하고 있다"], used);
      return R("PERMIT", null, ["미완료 회수 건이 없다"], used);
    },
    /* P-03 배송 이행 — 단일 월의 초과를 결함으로 적지 않는다 */
    r_sla_breach(rec, ctx) {
      const used = ["contract.slaDays", "rollup.cell.slaMet", "ops.slaWarnRate"];
      const met = _dig(rec.rollup || {}, "cell.slaMet");
      if (miss(met)) return INP("기간축 롤업의 기준일 내 배송 비율", used);
      const warn = _dig(rec.ops || {}, "slaWarnRate");
      if (miss(warn)) return INP("경고 임계(조정 가능 항목)", used);
      const over = 1 - Number(met);
      if (over > Number(warn)) {
        const months = Number(_dig(rec.rollup || {}, "cell.breachMonths") || 0);
        if (months < 2) return R("PERMIT", null, ["기준일 초과율이 임계를 넘었으나 반복이 아니다 — 권고 대상이다"], used.concat(["rollup.cell.breachMonths"]));
        return R("DENY", "rule_violation", ["기준일 초과율이 임계를 넘은 달이 " + months + "개월 연속이다"], used.concat(["rollup.cell.breachMonths"]));
      }
      return R("PERMIT", null, ["기준일 내 배송 비율이 임계 안이다"], used);
    },
    /* P-04 서비스 제공 이행 — 레코드가 없으면 **해당 없음**이고 0%가 아니다 */
    r_service_delivery(rec, ctx) {
      const used = ["submit.service_count", "submit.service_rate"];
      const n = g(rec, "submit", "service_count");
      if (miss(n)) return R("NOT_APPLICABLE", "kind_mismatch", ["서비스 제공 레코드를 보유하지 않는다 — 0%로 적으면 「이행하지 않았다」로 읽힌다"], used);
      const rate = g(rec, "submit", "service_rate");
      if (miss(rate)) return INP("이행률", used);
      if (Number(rate) < 0.5) return R("DENY", "rule_violation", ["서비스 이행률이 절반에 미치지 못한다"], used);
      return R("PERMIT", null, ["서비스 제공 실적이 확인된다"], used);
    },
    /* P-05 응급 · 이상 상황 전달 경로 */
    r_emergency_route(rec, ctx) {
      const used = ["submit.emg_route", "submit.emg_drill_at", "submit.emg_owner"];
      const r0 = g(rec, "submit", "emg_route");
      if (miss(r0)) return INP("응급 · 이상 상황 전달 경로 등록", used);
      if (miss(g(rec, "submit", "emg_owner"))) return INP("전달 경로 책임자", used);
      const drill = g(rec, "submit", "emg_drill_at");
      if (miss(drill)) return INP("훈련 기록", used);
      if (_stale(drill, PG_THRESH.reviewMonths, ctx.asOf) === true)
        return R("DENY", "rule_violation", ["전달 경로는 등록돼 있으나 훈련 기록이 주기를 벗어났다"], used);
      return R("PERMIT", null, ["전달 경로가 등록되고 훈련 기록이 주기 안이다"], used);
    },
    /* P-06 민원 · 분쟁 처리 체계 */
    r_complaint_system(rec, ctx) {
      const used = ["submit.complaint_system", "submit.complaint_stats"];
      const sy = g(rec, "submit", "complaint_system");
      if (miss(sy)) return INP("민원 · 분쟁 접수 · 처리 체계", used);
      if (sy !== true) return R("DENY", "rule_violation", ["민원 · 분쟁 접수 · 처리 체계를 보유하지 않는다"], used);
      if (miss(g(rec, "submit", "complaint_stats"))) return INP("처리 통계", used);
      return R("PERMIT", null, ["접수 · 처리 체계와 처리 통계가 확인된다"], used);
    },
    /* P-07 청약철회 · 환불 — 협력업체 약관 · 처리 실적 축 */
    r_withdrawal_terms(rec, ctx) {
      const used = ["submit.withdrawal_terms", "submit.withdrawal_refusals[]"];
      const t = g(rec, "submit", "withdrawal_terms");
      if (miss(t)) return INP("청약철회 약관", used);
      if (t !== true) return R("DENY", "rule_violation", ["청약철회 약관을 보유하지 않는다"], used);
      const ref = g(rec, "submit", "withdrawal_refusals[]");
      if (miss(ref)) return INP("거절 사유별 처리 실적", used);
      const outside = (ref || []).filter((x) => x.lawfulGround !== true);
      if (outside.length) return R("DENY", "rule_violation", ["법정 제외 사유 밖의 사유로 청약철회를 거절한 실적이 " + outside.length + "건이다"], used);
      return R("PERMIT", null, ["약관을 보유하고 법정 제외 사유 밖의 거절 실적이 없다"], used);
    },
    /* P-08 모델 · 알고리즘 검증 — 미제출은 판정 보류다 */
    r_model_validation(rec, ctx) {
      const used = ["submit.model_card", "submit.model_validation", "submit.model_version"];
      if (miss(g(rec, "submit", "model_validation"))) return INP("모델 검증 보고서", used);
      if (miss(g(rec, "submit", "model_version"))) return INP("모델 버전 — 바뀌면 판정이 무효다", used);
      if (miss(g(rec, "submit", "model_card"))) return INP("의도된 용도와 부적합 맥락을 적은 모델 카드", used);
      return R("PERMIT", null, ["검증 자료와 버전 관리 기록이 확인된다"], used);
    },
    /* P-09 비의료 건강관리서비스 범위 적합성 — 경계 사례는 회신 전까지 판정 보류 */
    r_nonmedical_scope(rec, ctx) {
      const used = ["submit.service_acts[]", "submit.guideline_match", "submit.authority_reply", "product.subcat"];
      const acts = g(rec, "submit", "service_acts[]");
      if (miss(acts)) return INP("제공 행위 목록", used);
      const m = g(rec, "submit", "guideline_match");
      if (miss(m)) return INP("판단 요건 대조표", used);
      const hit = (m.expertise === true) || (m.diagnosis === true) || (m.hygieneRisk === true);
      if (hit) return R("DENY", "rule_violation",
        ["판단 요건에 해당하는 제공 행위가 있다 — 하나라도 해당하면 의료행위다"], used);
      if (m.borderline === true) {
        if (miss(g(rec, "submit", "authority_reply")))
          return INP("경계 사례의 소관 부처 유권해석 회신 — 우리가 의료행위 해당성을 단정하지 않는다", used);
        return R("PERMIT", null, ["경계 사례에 대한 소관 부처 회신이 확보됐다"], used);
      }
      return R("PERMIT", null, ["판단 요건에 해당하는 제공 행위가 확인되지 않는다"], used);
    },

    /* ── 통제군 T — 존재 / 기능 2판정. 「있다」가 아니라 「있고, 지금도 돌고 있다」 ── */
    r_control_env(rec, ctx) { return _dual(rec, ctx, "ethics_doc", "ethics_activity_at", "책임자 지정 문서", "최근 활동 기록", PG_THRESH.activityMonths); },
    r_risk_assess(rec, ctx) { return _dual(rec, ctx, "risk_list", "risk_updated_at", "위험목록", "최근 갱신일", PG_THRESH.activityMonths); },
    r_access_control(rec, ctx) { return _dual(rec, ctx, "access_policy", "access_review_at", "접근통제 정책", "계정 · 권한 점검 기록", PG_THRESH.reviewMonths); },
    r_training_supervision(rec, ctx) { return _dual(rec, ctx, "training_plan", "training_done_at", "교육 계획", "이행 기록", PG_THRESH.activityMonths); },
    r_monitoring(rec, ctx) {
      const used = ["submit.finding_process", "submit.finding_closed[]"];
      const p0 = g(rec, "submit", "finding_process");
      if (miss(p0)) return INP("미비점 처리 절차", used);
      if (p0 !== true) return R("DENY", "rule_violation", ["미비점 처리 절차가 존재하지 않는다"], used, AXIS_EXIST);
      const closed = g(rec, "submit", "finding_closed[]");
      if (miss(closed)) return INP("등록에서 종결까지의 시정 이력", used);
      const stuck = (closed || []).filter((x) => x.closedAt == null);
      if (stuck.length) return R("DENY", "rule_violation",
        ["절차는 존재하나 종결되지 않은 미비점이 " + stuck.length + "건이다 — 존재하되 기능하지 않는다"], used, AXIS_FUNC);
      return R("PERMIT", null, ["절차가 존재하고 등록 · 종결 추적이 기능한다"], used);
    },
    r_communication(rec, ctx) { return _dual(rec, ctx, "notice_channel", "notice_recent_at", "대외 고지 채널", "최근 고지 실적", PG_THRESH.activityMonths); },
    /* T-04 인증 보유 — 보유는 증거의 한 조각이지 조항 충족이 아니다. 단독 근거로 두지 않는다 */
    r_cert_hold(rec, ctx) {
      const used = ["submit.cert_list[]", "submit.cert_scope"];
      const list = g(rec, "submit", "cert_list[]");
      if (miss(list)) return INP("정보보호 인증서", used);
      if (miss(g(rec, "submit", "cert_scope"))) return INP("인증 범위 명세 — 범위 밖 인증은 그 조항의 증거가 아니다", used);
      return R("PERMIT", null, ["인증서와 범위 명세가 확인된다 — 보유는 증거의 한 조각이고 조항 충족이 아니다"], used);
    },
    /* T-08 준법 · 반부패 — 두 기능을 한 축으로 뭉치지 않는다 */
    r_compliance_function(rec, ctx) {
      const used = ["submit.compliance_fn", "submit.antibribery_fn", "submit.compliance_ops[]"];
      const c1 = g(rec, "submit", "compliance_fn"), c2 = g(rec, "submit", "antibribery_fn");
      if (miss(c1) || miss(c2)) return INP("준법 체계 문서와 반부패 체계 문서(별 축이다)", used);
      if (c1 !== true || c2 !== true) return R("DENY", "rule_violation",
        [(c1 !== true ? "준법 " : "") + (c2 !== true ? "반부패 " : "") + "체계 문서가 존재하지 않는다"], used);
      const ops = g(rec, "submit", "compliance_ops[]");
      if (miss(ops)) return INP("운영 기록", used);
      return R("PERMIT", null, ["두 체계가 각각 존재하고 운영 기록이 확인된다"], used);
    },
  };
  /* 존재 / 기능 2판정 공통 — COSO 의 「present and functioning」을 그대로 쓴다 */
  function _dual(rec, ctx, existK, funcK, existKo, funcKo, months) {
    const used = ["submit." + existK, "submit." + funcK];
    const e = g(rec, "submit", existK);
    if (miss(e)) return INP(existKo, used);
    if (e !== true && typeof e !== "string") return R("DENY", "rule_violation", [existKo + "이(가) 존재하지 않는다"], used, AXIS_EXIST);
    const f = g(rec, "submit", funcK);
    if (miss(f)) return INP(funcKo, used);
    if (_stale(f, months, ctx.asOf) === true)
      return R("DENY", "rule_violation", [existKo + "은(는) 존재하나 " + funcKo + "이(가) 주기를 벗어났다 — 존재하되 기능하지 않는다"], used, AXIS_FUNC);
    return R("PERMIT", null, [existKo + "이(가) 존재하고 " + funcKo + "이(가) 주기 안이다"], used);
  }
  function _monthsLeft(toISO, asOf) {
    if (!toISO) return 99;
    const a = String(asOf).slice(0, 7).split("-"), b = String(toISO).slice(0, 7).split("-");
    return (Number(b[0]) * 12 + Number(b[1])) - (Number(a[0]) * 12 + Number(a[1]));
  }

  /* ── 입력 증거 — **쓴 것과 안 쓴 것 모두**. 숨기면 있는 줄 모른다(§11-2 레인 1) ──
     ★ legalName 은 담지 않는다. 표시명은 pgDisplayName 한 곳에서만 나온다(Q4 확정). */
  function _inputRefs(pol, rec, used, asOf) {
    const decl = (typeof PG_INPUTS !== "undefined") ? (PG_INPUTS.filter((x) => x.id === pol.id)[0] || { inputs: [] }) : { inputs: [] };
    const out = [];
    for (const i of decl.inputs) {
      const key = i.obj + "." + i.k;
      const raw = g(rec, i.obj, i.k);
      const isName = /legalName|vendorName|\bname\b/.test(i.k) && (i.obj === "partner" || i.obj === "vendor");
      const absent = miss(raw);
      out.push({
        field: key, used: used.indexOf(key) >= 0,
        value: isName ? null : (absent ? null : _flat(raw)),
        /* ★ 두 등급을 가른다.
             grade        = **실측 등급.** 값이 없으면 「미제출」, 있으면 그 값이 어느 객체에서
                            왔는지로 정한다(제출 축은 협력업체 제출이므로 실원천이다).
             declaredGrade = **선언 등급.** 「현 데이터 regime 에서 이 필드가 가진 등급」이고
                            지금은 제출 축 전건이 「미제출」이다.
           종전 구현은 `miss(raw) ? "ABSENT" : i.grade` 한 줄이어서 **값이 제출되고 판정에 쓰인 뒤에도**
           「미제출」이 나왔다(선언 등급이 전건 ABSENT 이므로 삼항이 어느 쪽으로 가도 ABSENT).
           한 객체 안에서 「값 있음 · 판정에 썼음 · 수집 시각 있음」과 「미제출」이 동시에 참이라고
           말하면 추적 레인 1 이 그 반환값을 **렌더만** 하므로 화면이 쓰인 값에 「미제출」 배지를 붙인다
           (§10-4 규약 2 · §15-6 과 어긋난다). whatIf 경로(_fill)가 이미 값을 채워 재호출한다. */
        grade: absent ? "ABSENT" : _presentGrade(i),
        declaredGrade: i.grade,
        asOf: absent ? null : asOf, use: i.use,
      });
    }
    return out;
  }
  /* 값이 있을 때의 실측 등급 — 객체 기준 등급을 따른다. 선언 등급이 「미제출」이면 그것은
     「아직 안 왔다」는 선언이므로, 실제로 온 값의 등급을 그 선언에서 끌어올 수 없다. */
  function _presentGrade(i) {
    const base = (typeof PG_OBJ !== "undefined" && PG_OBJ[i.obj] && PG_OBJ[i.obj].base) || null;
    if (i.grade && i.grade !== "ABSENT") return i.grade;      /* 선언이 이미 실측 등급을 말한다 */
    if (base && base !== "ABSENT") return base;               /* 객체 기준 등급(공표값 REAL · 거래 축 DEMO 등) */
    return "REAL";                                            /* 제출 · 자격 · 증거 축 — 협력업체가 실제로 낸 것이다 */
  }
  function _flat(v) {
    if (Array.isArray(v)) return "(" + v.length + "건)";
    if (v !== null && typeof v === "object") return "(객체)";
    return v;
  }

  /* ── 유형 해당성 — 미매칭은 false 가 아니라 **해당 없음**이다(§6-7) ── */
  function _kindOk(pol, kind) { return !kind || (pol.appliesTo || []).indexOf(kind) >= 0; }

  /* ════════ 단일 진입점 ════════ */
  return function pgDecide(policyId, rec, ctx) {
    const c = ctx || {};
    const asOf = c.asOf || PG_ASOF;
    const stage = c.stage || "거래중";
    const pol = pgPolicy(policyId);
    const base = {
      decision: "INDETERMINATE", cause: "engine_error", reasons: [], inputRefs: [], axis: null,
      ruleOutcome: null, ruleRef: null, evidence: [], enforce: null, remedy: [], whatIf: null,
      ver: { policy: PG_POLICY_VER, asOf: asOf, stage: stage },
    };
    if (!pol) { base.reasons = ["등재되지 않은 조항 — " + String(policyId)]; return base; }

    const kind = c.kind || (rec && rec.kind) || null;
    const cite = pgLawCite(pol.lawRef, pol.lawArticle, kind);
    const ruleRef = {
      policyId: pol.id, ruleId: pol.ruleId, lawRef: pol.lawRef, lawArticle: pol.lawArticle,
      lifecycle: pol.lifecycle, severity: pol.severity, obligation: pol.obligation,
      subject: pol.subject, axis: pol.axis, group: pol.group, dual: pol.dual, title: pol.title,
      law: cite.render, verified: cite.verified, effectiveDate: cite.effectiveDate,
      sanction: cite.sanction, enforcementGrace: cite.enforcementGrace, appliesToSelf: cite.appliesToSelf,
      locked: pol.locked, cycle: pol.cycle,
    };
    const evid = (pol.evidence || []).map((e) => ({ kind: e, ref: null, receivedAt: null, verified: false }));
    const out = Object.assign({}, base, { ruleRef: ruleRef, evidence: evid, remedy: pol.remedy.slice() });

    /* ⓐ 유형 비해당 — 분모에서 제외된다 */
    if (!_kindOk(pol, kind)) {
      out.decision = "NOT_APPLICABLE"; out.cause = "kind_mismatch";
      out.reasons = ["이 협력업체 유형에 해당하지 않는 조항이다"];
      out.inputRefs = _inputRefs(pol, rec, [], asOf);
      out.enforce = _enforce(pol, "pep.register", kind, out.cause, stage, rec, asOf);
      return out;
    }
    /* ⓑ 근거 법령 미등재 · 미확인 — DENY 를 낼 수 없다. 차단하지 않는다(하드 플로어) */
    const unverified = cite.empty || PG_VERIFY_RANK[cite.verified] < PG_VERIFY_RANK["원문확인"];
    /* ⓒ 시행일 — null 이거나 미도래. 「해당 없음」이 아니라 「시행 전」으로 렌더한다 */
    const eff = pol.effectiveDate || cite.effectiveDate;
    if (!cite.empty && eff && eff > asOf) {
      out.decision = "NOT_APPLICABLE"; out.cause = "not_yet_effective";
      out.reasons = ["시행 전(시행일 " + eff + ") — 도래 시 자동 적용된다"];
      out.inputRefs = _inputRefs(pol, rec, [], asOf);
      out.enforce = _enforce(pol, "pep.register", kind, out.cause, stage, rec, asOf);
      return out;
    }
    /* ⓓ 판정 실행 */
    let r;
    const fn = RULES[pol.ruleId];
    if (typeof fn !== "function") {
      out.reasons = ["판정 분기가 등재되지 않았다 — " + pol.ruleId];
      out.inputRefs = _inputRefs(pol, rec, [], asOf);
      out.enforce = _enforce(pol, "pep.register", kind, "engine_error", stage, rec, asOf);
      return out;
    }
    try { r = fn(rec, { asOf: asOf, stage: stage, kind: kind }); }
    catch (e) {
      out.reasons = ["판정 오류 — " + String(e && e.message ? e.message : e)];
      out.inputRefs = _inputRefs(pol, rec, [], asOf);
      out.enforce = _enforce(pol, "pep.register", kind, "engine_error", stage, rec, asOf);
      return out;
    }
    /* ★ ruleOutcome — **플로어 이전의 판정기 자체 산출**이다.
       왜 돌려주는가: 조항 29건 중 18건이 근거 법령 미확인이라 결정값이 전부 보류로 수렴한다. 그러면
       「법령 확인만 되면 이 조항은 충족인가 위반인가」를 아무도 말할 수 없고, 골든 케이스도
       **보류 = 보류로 통과**해 버린다(이 저장소가 두 번 겪은 「0 = 0으로 녹색」 유형이다).
       화면·집계는 decision 을 쓴다. ruleOutcome 은 advisory 집계와 추적 레인 3·5의 입력이고
       **집행에 쓰지 않는다** — 이름이 그 사실을 말한다. */
    /* ★ axis — 존재 / 기능 2판정의 결과를 **구조 필드로** 싣는다. 결론 산출이 사유 문장을 파싱하지
       않게 하는 자리다(§5-5 · §11-1). 플로어가 결정값을 보류로 돌려도 **판정기가 본 축은 그대로** 남는다. */
    out.ruleOutcome = { decision: r.decision, cause: r.cause, reasons: r.reasons.slice(), axis: r.axis || null };
    out.axis = r.axis || null;
    /* ⓔ 하드 플로어 — 확인하지 못한 법으로 위반을 적지 않는다 */
    if (r.decision === "DENY" && unverified) {
      out.decision = "INDETERMINATE"; out.cause = "law_unverified";
      out.reasons = ["근거 법령 · 표준의 확인 등급이 " + (cite.empty ? "미등재" : cite.verified) + "다 — 집행 보류"]
        .concat(r.reasons.map((x) => "판정기 사유(집행에 쓰지 않는다): " + x));
    } else if (unverified && r.decision === "PERMIT") {
      /* 미확인 법령으로 「충족」을 적는 것도 같은 문제다 — 충족으로 세어지지 않게 보류로 돌린다 */
      out.decision = "INDETERMINATE"; out.cause = "law_unverified";
      out.reasons = ["근거 법령 · 표준의 확인 등급이 " + (cite.empty ? "미등재" : cite.verified) + "다 — 충족으로 세지 않는다"];
    } else {
      out.decision = r.decision; out.cause = r.cause; out.reasons = r.reasons.slice();
    }
    out.inputRefs = _inputRefs(pol, rec, r.used || [], asOf);
    out.enforce = _enforce(pol, _pepOf(stage), kind, out.cause, stage, rec, asOf);

    /* ⓕ whatIf — 증거를 채웠다고 가정한 **같은 함수 재호출** 산출. 별도 추정 로직을 쓰지 않는다 */
    if (out.cause === "input_missing" && !c._noWhatIf) {
      const filled = _fill(pol, rec);
      const again = pgDecide(policyId, filled, Object.assign({}, c, { _noWhatIf: true, asOf: asOf, stage: stage, kind: kind }));
      out.whatIf = { decision: again.decision, cause: again.cause, reasons: again.reasons,
        assumed: "선언된 입력 전건이 제출되고 기록 날짜가 주기 안이라고 가정했다" };
    }
    return out;
  };

  /* 단계 → 그 단계에서 먼저 걸리는 집행 지점 */
  function _pepOf(stage) { return (stage === "신규등록신청" || stage === "갱신") ? "pep.register" : "pep.settle"; }

  function _enforce(pol, pep, kind, cause, stage, rec, asOf) {
    const lv = pgEnforceLevel(pol.id, pep, { kind: kind, cause: cause, stage: stage });
    const row = _pgStageEffect(cause, stage, false);
    const ex = pgExemptFor(pol.id, rec && rec.partnerId, asOf);
    return {
      level: lv.level, declared: lv.declared, cap: lv.cap, floors: lv.floors, pep: pep, stage: stage,
      block: !!(row && row.block) && lv.level !== "advisory",
      render: row ? row.render : null,
      blockedCount: null,   /* 전용 로그에서 읽는다 — P4 가 소유한다. 여기서 숫자를 만들지 않는다 */
      exemption: ex,
    };
  }
  /* whatIf 용 가정 레코드 — 선언된 입력을 전건 채운다. 판정은 같은 함수가 다시 내린다. */
  function _fill(pol, rec) {
    const decl = (typeof PG_INPUTS !== "undefined") ? (PG_INPUTS.filter((x) => x.id === pol.id)[0] || { inputs: [] }) : { inputs: [] };
    const r = JSON.parse(JSON.stringify(rec || {}));
    r.submit = r.submit || {};
    for (const i of decl.inputs) {
      if (i.obj !== "submit") continue;
      const k = i.k.replace(/\[\]$/, "");
      if (r.submit[k] === undefined || r.submit[k] === null || r.submit[k] === "") {
        r.submit[k] = /_at$|_to$/.test(k) ? PG_ASOF : (/\[\]$/.test(i.k) ? [] : true);
        if (/\[\]$/.test(i.k)) r.submit[k] = [{ assumed: true }];
        if (k === "guideline_match") r.submit[k] = { expertise: false, diagnosis: false, hygieneRisk: false, borderline: false };
        if (k === "service_rate") r.submit[k] = 1;
        if (k === "service_count") r.submit[k] = 1;
        if (k === "biz_status") r.submit[k] = "계속사업자";
        if (k === "recall_open") r.submit[k] = false;
        if (k === "sub_exists") r.submit[k] = false;
      }
    }
    if (!r.licenses || !r.licenses.length) r.licenses = [{ type: "가정", basis: "신고", no: null, issuer: "가정", to: "2099-12-31" }];
    if (!r.products || !r.products.length) r.products = [{ id: "가정", name: "가정" }];
    return r;
  }
})();

/* 조항 전수 판정 — 보고서 롤업과 러너가 같은 함수를 쓴다. */
function pgDecideAll(rec, ctx) {
  const out = [];
  for (const p of PG_POLICIES) out.push({ id: p.id, r: pgDecide(p.id, rec, ctx) });
  return out;
}
/* ══ 결론 산출 — 총점 금지. 하나라도 「미기능」이면 결론을 내지 않는다(§5-5) ══
   ★ 「존재하되 미기능」은 **판정기가 구조 필드로 돌려준 축**(`axis === "기능"`)으로만 가른다.
     사유 문장 정규식으로 가르던 종전 구현은 같은 `{decision:"DENY", cause:"rule_violation"}`에
     사유 한 낱말만 다듬어도 결론이 「결론 보류」 → 「결함 있음」으로 **조용히 뒤집혔다**(실측 확인).
     화면이 문장을 파싱하지 않는다는 §11-1 의 원칙은 집계 쪽에도 똑같이 적용된다. */
function pgTrustConclusion(results) {
  const T = (results || []).filter((x) => { const p = pgPolicy(x.id); return p && p.group === "T"; });
  const dual = T.filter((x) => { const p = pgPolicy(x.id); return p && p.dual; });
  const axisOf = (r) => (r && (r.axis || (r.ruleOutcome && r.ruleOutcome.axis))) || null;
  const notFunctioning = dual.filter((x) => x.r.decision === "DENY" && axisOf(x.r) === "기능");
  if (notFunctioning.length) return { conclusion: "결론 보류", why: "존재하되 기능하지 않는 원칙이 " + notFunctioning.length + "건이다", score: null };
  const pending = T.filter((x) => x.r.decision === "INDETERMINATE");
  if (pending.length) return { conclusion: "결론 보류", why: "판정 보류 " + pending.length + "건 — 보류를 충족으로 세지 않는다", score: null };
  const deny = T.filter((x) => x.r.decision === "DENY");
  if (deny.length) return { conclusion: "결함 있음", why: "결함 " + deny.length + "건", score: null };
  return { conclusion: "존재하고 기능한다", why: "통제군 T 전건이 존재 · 기능 2판정을 통과했다", score: null };
}

/* ══ 정책 테이블 해시 — 재현 증명은 **해시 일치**로 성립한다(§6-6) ══
   전건 판정 결과는 커밋하지 않는다. 커밋되는 쪽은 해시 · 건수 · 분포다(§14-1-1).
   ★ 면제 지문을 해시 입력에 **포함한다.** 면제는 조항 본문을 바꾸지 않지만 **결정을 바꾼다** —
     저장값에서 적재된 면제 1건이 `enforce.exemption` 을 null 에서 값으로 돌리고, 집행 수준이
     soft 이면 차단을 `block:true` → `block:false, exempted:true` 로 뒤집는다(실측 확인).
     집행 수준 축은 ratchet + 배포 테이블 폴백 + hashBefore/hashAfter 드리프트로 세 겹 방어가 있는데,
     면제 축은 신호가 0이었다. 「재현 증명은 해시 일치로 성립한다」가 그 상태에서는 성립하지 않는다.
     ⚠ 지문은 **정렬된 키 목록**이다(사유 · 승인자 문장은 넣지 않는다) — 같은 면제 집합이면 같은 지문이고,
       순서만 다른 적재가 해시를 흔들지 않는다. */
function pgExemptFingerprint() {
  const rows = [];
  for (const x of PG_EXEMPT) rows.push([x.policyId, x.partnerId, x.expireAt].join("|"));
  return rows.sort();
}
function pgPolicyHash() {
  const s = JSON.stringify({ laws: PG_LAWS, sets: PG_LAW_SETS, policies: PG_POLICIES, enforce: PG_ENFORCE, thresh: PG_THRESH,
    exempt: pgExemptFingerprint() });
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return ("00000000" + h.toString(16)).slice(-8);
}
const PG_POLICY_HASH = pgPolicyHash();

/* ══ AI KB 라운지 「법률·제도」 뷰 — KB_LEGAL 은 이 함수의 산출이다(Q10 흡수) ══
   조문 번호는 **확인 등급 게이트를 지난 것만** 렌더된다. 그래서 라운지가 미확인 조문 번호를 인쇄하지 않는다.
   grade 는 지식 신뢰도이고 조문 확인 등급이 아니므로 두 열을 따로 둔다. */
function pgKbLegal() {
  const rows = [];
  for (const id of Object.keys(PG_LAWS)) {
    const L = PG_LAWS[id];
    if (!L.kb) continue;
    const arts = (L.kb.articles || []).map((a) => pgLawRender(id, a)).filter((x) => x.article).map((x) => x.article);
    rows.push({
      id: L.kb.id, law: L.name,
      article: arts.length ? arts.join("·") : "조문 미확인",
      summary: L.kb.summary, risk: L.kb.risk, note: L.kb.note,
      org: L.kb.org, date: L.kb.date, grade: L.kb.grade,
      verified: pgLawVerified(id, null),
    });
  }
  return rows;
}

/* ══ 개발 훅 — pgDecide + 조회만 노출한다(§6-5). 판정 분기는 클로저 안에 있어 전역에 없다 ══ */
if (typeof window !== "undefined") {
  window.__hifinPG = function () {
    return {
      ver: PG_POLICY_VER, hash: PG_POLICY_HASH, asOf: PG_ASOF,
      laws: PG_LAWS, lawSets: PG_LAW_SETS, policies: PG_POLICIES, enforce: PG_ENFORCE,
      enforceCap: PG_ENFORCE_CAP, peps: PG_PEPS, thresh: PG_THRESH, basis: PG_LAW_BASIS,
      selfEnforce: PG_SELF_ENFORCE, exempt: PG_EXEMPT, cycleMonths: PG_CYCLE_MONTHS,
      decide: pgDecide, decideAll: pgDecideAll, trust: pgTrustConclusion,
      law: pgLaw, lawRender: pgLawRender, lawCite: pgLawCite, lawVerified: pgLawVerified,
      lawVerifiedMin: pgLawVerifiedMin, sanctionRender: pgSanctionRender,
      lawEffective: pgLawEffective, lawResolve: pgLawResolve,
      enforceLevel: pgEnforceLevel, enforceSet: pgEnforceSet,
      exemptAdd: pgExemptAdd, exemptFor: pgExemptFor, exemptFingerprint: pgExemptFingerprint,
      kbLegal: pgKbLegal, policy: pgPolicy, hashOf: pgPolicyHash,
    };
  };
}
