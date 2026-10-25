/* ====================== 협력업체 온톨로지 · 하네스 — 용어·표시명 단일 원천 ======================
   Partner Ontology & Governance Harness — 내부통제 보고서 서브섹션의 **용어 단일 원천**.
   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md (§0-5 · §4-6 · §13-3 P1)
   결정값: docs/partner_gov/P0_결정서_v1.1.md (12항목 · Q1 확정 산식)

   이 파일이 소유하는 것 5가지
     ① PG_TERMS      — 화면에 찍는 낱말의 단일 원천. 컴포넌트에 문자열 직접 기입 금지(§0-5).
     ② PG_NAME_MODE  — 표시명 모드 스위치 **상수 하나**. 되돌릴 자리가 여기뿐이다(§4-6-1 ⓒ).
     ③ pgDisplayName / pgCode — 표시명을 만드는 **유일한 함수**(§4-6-1 ⓐ).
     ④ PG_FORBID     — 금칙 사전. 제도명·약칭 오표기를 이름을 대고 막는다(§0-2 ⑨ · §14-3 ⑤⑥).
     ⑤ PG_AXES · PG_KINDS · PG_IDENTITY_FIX · PG_PUBLISHED — 판정 축·유형 축·신원 교정표·공표값 인용 항목.

   이 파일이 소유하지 않는 것
     · 조항·판정 규칙·집행 수준 → src/data/partnerPolicy.js (P3 산출물). PG_AXES를 **읽기만** 하고
       다시 정의하지 않는다 — 두 곳에 두면 같은 축이 두 값을 갖는다.
     · 거래 사실(거래처·제품·주문·배송·정산) → src/data/supplyData.js (거래 사실 레이어 · 읽기 전용 입력).

   주의 — 단일 번들(import 없음 · 전역 공유)이다. 여기 선언한 전역 이름(PG_* · pg*)이 다른 파일과
     겹치면 조용히 덮어쓴다. 추가 전 grep으로 확인한다(§14-4). */

/* ── ① 용어 단일 원천 ────────────────────────────────────────────────────────
   항목 구조 {ko, en, def, aka[], forbid[]}
     aka    = 옛 낱말·동의어. 하이가 옛 이름으로 물어도 찾아가게 하는 자리다(§0-5).
     forbid = 이 뜻으로 쓰면 안 되는 말. 사유는 PG_FORBID에 적는다. */
const PG_TERMS = {
  partner:    { ko: "협력업체", en: "Partner", def: "하이핀과 제휴해 회원에게 제품·서비스를 제공하는 모든 기관. 상위 개념이다.", aka: ["제휴기관", "제휴사"], forbid: ["공급업체"] },
  vendor:     { ko: "거래처", en: "Vendor", def: "협력업체 중 상품 거래 사실(주문·배송·정산 레코드)이 있는 부분집합. 협력업체 1 : 거래처 0..1.", aka: ["공급처"], forbid: ["공급사"] },
  product:    { ko: "제품", en: "Product", def: "거래처가 소유한 품목(SKU). 공급가·판매가·마진율은 관리자 전용 면에만 둔다.", aka: ["SKU", "품목"], forbid: [] },
  avail:      { ko: "공급사 가용재고", en: "Availability", def: "공급사가 보유한 실시간 조회 재고 스냅샷. 당사 재고자산은 0이다. 라벨을 「공급사」로 줄이지 않는다.", aka: ["가용재고"], forbid: [] },
  contract:   { ko: "계약", en: "Contract", def: "거래처×카테고리 공급 계약. 수수료율(feePct)의 단일 원천이고, 정산 주기는 약정값이다.", aka: ["계약·단가", "단가계약"], forbid: [] },
  account:    { ko: "고객", en: "Account", def: "구매·수령 주체. 파일럿 코호트 파생이며 이름·식별자는 가명으로 표시된다.", aka: ["계정"], forbid: [] },
  order:      { ko: "주문", en: "Order", def: "매출·매입·플랫폼 수취의 단일 원천. 정산은 여기서 파생되는 종속 장부다(Q1 확정).", aka: [], forbid: [] },
  shipment:   { ko: "배송", en: "Shipment", def: "거래처에서 고객으로 가는 직배송. 출고 거래처는 FK(vendorId)로만 들고 표시는 렌더에서 조립한다.", aka: ["직배송"], forbid: [] },
  settlement: { ko: "정산", en: "Settlement", def: "거래처×월 1행. 주문에서 전건 파생되는 종속 장부이고 금액 라벨은 「정산(주문 파생)」으로 적는다.", aka: ["전표", "정산전표"], forbid: [] },

  control:    { ko: "통제항목", en: "Control", def: "요건 출처·판정 규칙·증거·주기·미충족 조치 5요소를 갖는 단위. 다섯 중 하나라도 비면 통제가 아니라 희망이다.", aka: [], forbid: ["체크리스트 항목"] },
  decider:    { ko: "판정기", en: "PDP", def: "결정과 근거를 함께 반환하는 단일 순수 함수(pgDecide). 화면·러너·에이전트 세 소비자가 같은 함수를 쓴다.", aka: [], forbid: [] },
  pep:        { ko: "집행 지점", en: "PEP", def: "판정 결과가 실제로 무언가를 막는 자리. 기록되지 않는 차단은 차단이 아니다.", aka: [], forbid: [] },
  enforce:    { ko: "집행 수준", en: "Enforcement level", def: "advisory(기록) / soft(차단+면제) / hard(차단·면제 불가). 조항 본문이 아니라 배포 테이블에서 지정한다.", aka: [], forbid: ["심각도"] },
  exemption:  { ko: "면제", en: "Exemption", def: "사유·승인자·만료일 필수. 만료일 없는 면제는 등록 자체를 거부한다.", aka: [], forbid: ["예외"] },
  defect:     { ko: "결함 3등급", en: "Defect grade", def: "경미 / 중대 / 치명. 판정축은 법령 위반 가능성과 회원 피해 범위다.", aka: [], forbid: [] },
  icfr:       { ko: "미비점 3등급", en: "ICFR deficiency", def: "단순한 미비점 / 유의한 미비점 / 중요한 취약점. 하이핀 자신의 내부회계관리제도 전용이고 협력업체 판정에 쓰지 않는다.", aka: [], forbid: [] },
  sourceGrade:{ ko: "출처 등급", en: "Source grade", def: "REAL(실원천) / DEMO(시연 시드 파생) / ABSENT(미제출). 모든 수치에 배지로 붙인다.", aka: [], forbid: [] },
  verifyLevel:{ ko: "확인 등급", en: "Verification level", def: "원문확인 / 부분확인 / 미확인. 원문확인이 아닌 법령·표준은 조문·통제 번호를 렌더하지 않는다.", aka: [], forbid: [] },
  subject:    { ko: "판정 대상", en: "Subject of decision", def: "협력업체 축(제출물을 보고 판정)과 당사 축(당사 계약·정산·화면 구조를 보고 판정). 판정표의 필수 열이다.", aka: [], forbid: [] },
  lifecycle:  { ko: "생애주기", en: "Lifecycle", def: "외부자 현황(2.3.1) → 계약(2.3.2) → 보안 이행(2.3.3) → 변경·만료(2.3.4). 개인정보 위탁은 3.3.2에 따로 맵한다.", aka: [], forbid: [] },
  selfReview: { ko: "자율심의", en: "Self-regulatory review", def: "민간 자율심의기구가 수행하는 표시·광고 심의. 심의 주체가 행정청에서 민간 기구로 바뀐 것이 이 제도의 정체성이다. 제3자 조회 창구가 없어 증거는 협력업체 제출뿐이다.", aka: [], forbid: [] },
  grace:      { ko: "집행 유예", en: "Enforcement grace", def: "법정 의무이지만 소관 부처가 제재 집행을 유예하고 있는 상태. 집행 수준 상한을 advisory로 내린다.", aka: [], forbid: [] },
  stage:      { ko: "온보딩 단계", en: "Onboarding stage", def: "신규등록신청 / 거래중 / 갱신. 증거 미제출의 집행 효과가 이 값에 따라 달라진다.", aka: [], forbid: [] },
  cohort:     { ko: "파일럿 코호트", en: "Pilot cohort", def: "시연 시드로 생성한 회원 모집단. 이름·식별자는 가명으로 표시되며 특정 개인을 알아볼 수 없습니다.", aka: [], forbid: [] },
};

/* 섹션 머리 라벨 — 개칭의 단일 원천(§3-1). 컴포넌트는 이 상수만 쓴다. */
const PG_SECTION_KO = "협력업체 온톨로지 · 하네스";
const PG_SECTION_EN = "Partner Ontology & Governance Harness";
const PG_SECTION_KEY = "partner";

/* 서브탭 5개 — **상위 탭을 늘리지 않고** 한 패널을 나눈다(§10-1). 선례는 사업 운영 콘솔의 서브탭이다.
   라벨의 단일 원천이 여기인 이유 두 가지
     ① 컴포넌트는 키로 아이콘만 붙인다 — 낱말을 컴포넌트에 적으면 개칭이 두 곳에서 갈린다(§0-5).
     ② 러너가 이 표를 읽어 지면을 순회한다. 러너에 라벨 문자열을 적으면 개칭이 갈릴 때
        검사가 「이동 실패 = 0건」으로 **조용히 통과**한다(섹션 라벨에서 이미 같은 이유로 묶었다).
   verdict  = 판정 · 등급 · 결함이 렌더되는 지면. 표시명 모드 스위치의 **사정권**이다(§4-6-1).
   factLayer= 거래 사실 레이어. 사정권 **밖**이다 — 실상호가 있어야 하는 지면이고 가명 표기를
              적용하면 거짓이 된다(§4-6-1 ⓓ). 대신 성격 표기 고지를 동반한다(§15-9).
   ★ ④와 ⑤를 떼어 놓지 않는 것이 설계의 핵심이다 — 결론과 근거가 두 탭으로 갈리면
     「과정이 보이게」가 무너진다. 그래서 두 지면은 양방향으로 잇는다(§11-4). */
const PG_SUBTABS = [
  { k: "overview", ko: "개요 · 객체", asks: "무엇을 객체로 보고 어떻게 잇는가", verdict: false, factLayer: false },
  { k: "trade", ko: "거래 · 운영", asks: "지금 무슨 거래가 어떤 상태로 돌고 있는가", verdict: false, factLayer: true },
  { k: "cost", ko: "원가 · 정산", asks: "원가 · 마진 · 전표는 어떻게 되는가", verdict: false, factLayer: true, adminOnly: true },
  { k: "report", ko: "내부통제 보고서", asks: "이 협력업체는 적법 · 건전하게 운영되나", verdict: true, factLayer: false },
  { k: "engine", ko: "정책 · 판정 엔진", asks: "그 판정은 어떤 규칙 · 어떤 증거로 나왔나", verdict: true, factLayer: false },
];
function pgSubtab(k) { for (const t of PG_SUBTABS) if (t.k === k) return t; return null; }
function pgSubtabKeys(onlyVerdict) {
  return PG_SUBTABS.filter((t) => (onlyVerdict ? t.verdict : true)).map((t) => t.k);
}

/* 금액 라벨 — 정산을 독립 장부로 읽히지 않게 한다(Q1 확정 · §10-4 규약 ⑤). */
const PG_SETTLE_LABEL = "정산(주문 파생)";
const PG_CONTRACT_MARGIN_LABEL = "계약 마진율(약정)";
const PG_CONTRACT_CYCLE_LABEL = "계약 주기(약정)";

/* 객체카운트바 8칩 라벨 — o.t.split(" ")[0] 방식을 폐기한 자리(P0 결정 ⑤).
   절단은 「공급사」 1건이 아니라 8라벨 중 5건이었다 — 거래처·제품·공급사·계약·고객. */
const PG_COUNT_LABEL = {
  vendor: PG_TERMS.vendor.ko, product: PG_TERMS.product.ko, avail: PG_TERMS.avail.ko,
  contract: PG_TERMS.contract.ko, account: PG_TERMS.account.ko, order: PG_TERMS.order.ko,
  shipment: PG_TERMS.shipment.ko, payment: PG_TERMS.settlement.ko,
};
function pgTerm(k) { const t = PG_TERMS[k]; return t ? t.ko : ""; }
function pgCountLabel(k) { return PG_COUNT_LABEL[k] || ""; }

/* ── ② · ③ 표시명 — 모드 스위치 하나 + 함수 하나 (형 확정 Q4 · §4-6) ──────────
   형 확정 원문: 「테스트단계이니 실명 붙여주고 실제 거래시 코드로 환원.」
   그래서 설계가 책임지는 것은 어느 쪽이 맞나가 아니라 **되돌릴 자리가 하나인가**다. */
const PG_NAME_MODE = "real";   /* ★ 모드 스위치 — 이 상수 하나뿐이다
                                    "real" : 실상호 표시 (테스트 단계 · 현 기본값)
                                    "code" : 코드 표기 (실제 거래 개시 후)
                                  전환 조건 — 기한이 아니라 사실의 발생이다:
                                    ① 실명 협력업체와 제휴 계약 체결, 또는
                                    ② 출처 등급 REAL의 거래·정산 레코드가 1건이라도 생긴 시점
                                    둘 중 먼저 오는 쪽. 내부통제 담당(L1)이 문서로 확인하고
                                    대표 승인으로 내린다. 운영 담당은 내릴 수 없다.
                                  되돌림(ratchet) — "code"에서 "real"로 되돌리는 변경은 게이트가 막는다.
                                  localStorage·화면 토글로 두지 않는다: 감시받는 쪽이 문지기 기준을
                                  조정하는 구조가 되고, 모드가 세션마다 달라지면 러너가 단언할 수 없다. */

/* 코드 표기 = 식별자 그대로. 해시·난수 별칭을 만들지 않는다 — 별칭 체계는 매핑표를
   하나 더 만들고 그 매핑표가 두 번째 반출 경로가 된다(§4-6-2).
   PG_PARTNER(partnerId · PT####)는 P3 이후 산출물이므로, 그때까지는 거래 사실 레이어의
   거래처 식별자(vendorId · V####)를 안정 식별자로 쓴다. */
function pgCode(p) {
  if (!p) return "";
  return p.partnerId || p.vendorId || p.id || "";
}
/* ★ 표시명을 만드는 유일한 함수. 판정 지면·보고서·반출물·러너·에이전트는 이것만 부른다. */
function pgDisplayName(p) {
  if (!p) return "";
  if (PG_NAME_MODE === "code") return pgCode(p);
  return p.legalName || p.dispName || p.name || p.vendorName || pgCode(p);
}
/* 모드와 무관하게 **항상** 코드 표기인 자리 — 로그 payload · 스냅샷 · 커밋 산출물.
   커밋이 반출이다. 모드는 화면·반출물의 스위치이지 저장·배포 경로의 스위치가 아니다(§4-6-1 ⓔ). */
function pgLogRef(p) { return pgCode(p); }

/* 실명 모드에서 반출물 머리말에 **필수**인 고지(§4-6-3 · 문자 단위 확정).
   없으면 pep.export가 hard로 막는다 — 실상호에 판정 등급이 붙은 문서가 고지 없이 밖으로
   나가면 명예·신용 문제가 된다. 코드 모드에서는 권고로 내려가지만 문구는 지우지 않는다. */
const PG_EXPORT_NOTICE_TSV = "# 시연 판정 · 실제 평가가 아님 — 본 표의 법령 준수 판정은 시연 시드 데이터에 대한 자가점검 산출물이며, 기재된 기관의 실제 준수 여부를 뜻하지 않습니다.";
const PG_EXPORT_NOTICE_DOC = "시연 판정 · 실제 평가가 아님 — 본 보고서의 법령 준수 판정은 시연 시드 데이터에 대한 자가점검 산출물이며, 기재된 기관의 실제 준수 여부를 뜻하지 않습니다.";
function pgExportNoticeRequired() { return PG_NAME_MODE === "real"; }

/* 보고서 전용 반출 클래스 — **이름의 단일 원천**(P7 · §10-6 ①).
   지면(className)과 보호 예외(contentGuard의 복사 예외 판정)가 **같은 상수**를 읽는다.
   두 곳에 문자로 적으면 한쪽만 고쳐지는 순간 예외가 지면을 찾지 못하고, 그때 증상은
   「선택은 되는데 클립보드에 아무것도 들어가지 않는 가짜 버튼」이다(hmoex 선례의 실측 기록). */
const PG_EXPORT_CLASS = "pgex";
/* 조회 함수 — 소비자(지면 · 보호 예외)는 **이 함수만** 부른다. 상수를 직접 읽으면 파일 순서에
   따라 TDZ 가 되고, 리터럴 기본값을 끼워 두면 상수가 사라졌을 때 **다른 이름으로 조용히 갈린다**.
   없으면 null 을 돌려준다 — 그러면 예외가 등록되지 않아 복사가 막히고, 그 증상은 눈에 보인다. */
function pgExportClass() { return PG_EXPORT_CLASS; }

/* 반출물 고지가 **따라가야 하는 자리** 3곳 — 애블레이션의 분모다(§15-9 세 번째 문구 · §4-6-3 ⓐ).
   왜 선언이 필요한가: 자리를 세지 않으면 「고지 0건」과 「자리 0개」가 구별되지 않는다.
   그리고 기준은 **렌더가 아니라 산출물**이다 — 렌더 기준이면 부분 선택 복사 구멍을 통과한다. */
const PG_EXPORT_NOTICE_AT = [
  { at: "tsv", ko: "표(TSV) 첫 줄", by: "pgExportHead → pgExportBuild", notice: "tsv",
    fn: ["pgExportHead", "pgExportBuild"], file: "src/data/partnerEnforce.js",
    rule: "머리말 4줄이 산출물 첫머리에 들어간다 · 없으면 pep.export가 hard로 막는다" },
  { at: "doc", ko: "문서(인쇄) 머리말", by: "pgExportDocHtml", notice: "doc",
    fn: ["pgExportDocHtml"], file: "src/data/partnerEnforce.js",
    rule: "인쇄 창은 보호 리스너·워터마크 밖이므로 고지·워터마크·열람 기록을 **직접** 심는다" },
  { at: "clip", ko: "클립보드 산출물", by: "pgExportClip ← contentGuard 복사 예외", notice: "tsv",
    fn: ["pgExportClip"], file: "src/utils/contentGuard.js",
    rule: "부분 선택에도 고지가 따라간다 — 핸들러가 기본 복사를 막고 클립보드를 다시 쓴다" },
];
function pgExportNotice(which) {
  return which === "doc" ? PG_EXPORT_NOTICE_DOC : PG_EXPORT_NOTICE_TSV;
}

/* 표시 함수가 닿지 않는 자리 — 파생 문자열에 박힌 상호를 반출물·판정 지면에서만 가린다(§4-6-5 ⓑ).
   제조사 브랜드가 제품명의 일부인 실제 제품명은 데이터에서 지울 수 없다.
   상호의 단일 원천은 거래 사실 레이어의 SC_VENDORS다 — 여기에 상호를 다시 적지 않는다. */
function pgVendorNames() {
  if (typeof SC_VENDORS === "undefined") return [];
  return SC_VENDORS.map((v) => String(v[0]).split("(")[0]).filter((x) => x.length > 1);
}
function pgRedactNames(text) {
  if (PG_NAME_MODE !== "code" || !text) return text;
  let out = String(text);
  for (const n of pgVendorNames()) if (out.indexOf(n) >= 0) out = out.split(n).join("[거래처]");
  return out;
}

/* 파생 표기 조립 — **데이터에 심지 않고 렌더에서 만든다**(§4-6-5 ⓐ).
   배송 레코드는 `fromVid`(식별자)만 들고 있고, 표기는 이 함수가 표시명 함수를 지나 만든다.
   그래서 모드를 내리면 「V0012 물류창고」가 되고, 되돌릴 자리가 여전히 한 곳이다.
   ★ 종전에는 생성 시점에 `vendorName + " 물류창고"` 를 심어 28,755행 전건이 표시명 함수의
     사정권 **밖**에 있었다 — 그 문자열에는 vendorId 가 없어 바꿀 방법이 없었다. */
function pgShipFrom(s) {
  if (!s) return "";
  const id = s.fromVid || s.vendorId || "";
  if (!id) return "";
  return pgDisplayName({ vendorId: id, name: s.vendorName }) + " 물류창고";
}

/* ── ④ 금칙 사전 — 이름을 대고 막는다 ──────────────────────────────────────
   이 표가 금칙어를 **문자로 들고 있는 유일한 자리**다. 정적 0건 검사는 이 표의 bad: 줄만
   면제하고 나머지 전부를 위반으로 센다(scripts/run_wording_guard.mjs 검사 ⑨⑩).
   사전을 이원화하지 않는다 — hmScriptGuard가 같은 원칙을 쓴다. */
/* scope 가 **검사 소유자를 정한다** — 이 표를 읽는 가드가 어디까지 금지할지는 낱말마다 다르다.
     "absolute" : 어떤 문맥에서도 쓰지 않는다. run_wording_guard 검사 ⑨가 화면 문자열 전수를 센다.
     "context"  : **낱말 자체는 금지할 수 없다.** 다른 뜻으로는 정확한 말이고, 금지되는 것은 특정 문맥뿐이다.
                  그 문맥 판정은 **이미 전용 검사가 소유**하고 있으므로 ⑨는 손대지 않는다 —
                  한 낱말을 두 검사가 보면 어느 쪽이 단일 원천인지 정해지지 않는다(소유자 이원화 금지).
   ⚠ "context" 를 "absolute" 로 올리기 전에 반드시 실측하라. 「가명정보」를 전면 금지했더니
      데이터3법 해설·개인정보 처리 방침·법령 카드처럼 **그 말이 정확한 자리** 5건이 함께 걸렸다(2026-10-25 실측). */
const PG_FORBID = [
  { bad: "사전심의", scope: "absolute", use: "자율심의", why: "심의 주체가 행정청에서 민간 자율심의기구로 바뀐 사실을 가리는 제도명이다. 의료광고는 의료법 제57조(자율심의기구 · 복지부장관 신고 · 2018-09-28 시행), 식품·건강기능식품은 식품 등의 표시·광고에 관한 법률 제10조(자율심의기구 · 식약처장 등록), 의료기기는 의료기기법 체계(2021-06-24 전면 시행). 세 영역 모두 전환의 계기가 헌법재판소의 사전검열 위헌 결정이다." },
  { bad: "표시광고법", scope: "absolute", use: "표시·광고의 공정화에 관한 법률 / 식품 등의 표시·광고에 관한 법률", why: "소관 부처가 다른 두 법률을 뭉개는 약칭이다. 앞은 공정거래위원회 소관(제3조 부당 표시·광고 금지), 뒤는 식약처 소관(제10조 자율심의)이다. 정식 명칭만 쓴다." },
  { bad: "공급망", scope: "absolute", use: "협력업체", why: "상위 개념의 이름이 거래 사슬을 가리키는 말로 굳으면 의료기관·돌봄기관처럼 거래 레코드가 없는 협력업체가 개념에서 빠진다." },
  { bad: "공급사 148", scope: "absolute", use: "공급사 가용재고 148", why: "라벨을 공백 단위로 잘라 만든 오표기다. 148은 가용재고 스냅샷 행수로 정상이고 틀린 것은 숫자가 아니라 이름이다." },
  { bad: "불인증", scope: "absolute", use: "공표 확인 / 공표 없음", why: "의료기관 인증 공표 명단에 실리지 않는 상태가 있어 미신청과 대상 아님을 구분할 수 없다. 우리가 구분할 수 없는 상태를 단정하는 낱말이다." },
  { bad: "가명정보", scope: "context", use: "이름·식별자가 가명으로 표시된다", owner: "run_wording_guard 검사 ④",
    why: "개인정보 보호법상 그 말은 실제 개인정보를 가공한 것을 뜻한다. 이 저장소가 시드로 만든 모집단은 그것이 아니므로 그 모집단을 가리켜 그렇게 부르지 않는다. 다만 실서비스의 개인정보 처리 방침·동의 항목·법령 해설에서는 정확한 말이므로 낱말 자체를 금지하지 않는다 — 문맥 판정은 전용 검사가 소유한다." },
];
function pgForbidCheck(s) {
  const hit = [];
  if (!s) return hit;
  for (const f of PG_FORBID) if (String(s).indexOf(f.bad) >= 0) hit.push(f);
  return hit;
}

/* ── ⑤ 판정 축 · 유형 축 · 신원 교정표 · 공표값 인용 ──────────────────────── */

/* 통제군·결정값·원인·집행 수준·생애주기 — partnerPolicy.js(P3)가 **읽기만** 한다. */
const PG_AXES = {
  group:    [["L", "법령 준수"], ["P", "제품·서비스 건전성"], ["T", "신뢰 시스템의 구축·지속운영"]],
  decision: [["PERMIT", "허용"], ["DENY", "불허"], ["INDETERMINATE", "판정 보류"], ["NOT_APPLICABLE", "해당 없음"]],
  cause:    [["law_unverified", "근거 법령 미확인"], ["input_missing", "증거 미제출"], ["engine_error", "판정기 오류"],
             ["kind_mismatch", "유형 비해당"], ["not_yet_effective", "시행 전"], ["rule_violation", "규칙 위반"]],
  enforce:  [["advisory", "경고·기록"], ["soft", "차단 · 면제 가능"], ["hard", "차단 · 면제 불가"]],
  severity: [["경미", 1], ["중대", 2], ["치명", 3]],
  severityAxis: "법령 위반 가능성 × 회원 피해 범위",
  lifecycle:[["2.3.1", "외부자 현황 관리"], ["2.3.2", "외부자 계약 시 보안"], ["2.3.3", "외부자 보안 이행 관리"],
             ["2.3.4", "외부자 계약 변경 및 만료 시 보안"], ["3.3.2", "개인정보 처리 업무 위탁"]],
  source:   [["REAL", "실원천"], ["DEMO", "시연 시드 파생"], ["ABSENT", "미제출"]],
  verified: [["원문확인", "1차 출처 본문을 직접 확인"], ["부분확인", "조문 문언 확보 · 1차 본문 대조 잔여"], ["미확인", "확인 실패 — 판정에 쓰지 않는다"]],
  stage:    [["신규등록신청", "온보딩 심사"], ["거래중", "계약 이행 중"], ["갱신", "계약 갱신 심사"]],
  subject:  [["협력업체", "제출물을 보고 판정"], ["당사", "당사 계약·정산·화면 구조를 보고 판정"]],
};

/* 협력업체 유형 축 — 신설이다. 현 supplyData에는 공급 측 유형 축이 없다(SC_SEG는 고객 측이다).
   등급 체계가 제도적으로 서로 달라 한 점수표로 줄 세우면 네 제도를 동시에 왜곡한다. */
const PG_KINDS = [
  { k: "PT-MED",  ko: "의료기관",      rel: "의뢰 · 연계 (하이핀은 의료행위를 하지 않는다)", aiWeight: "중",   src: ["hira.json", "checkupCenters.js"] },
  { k: "PT-CARE", ko: "돌봄기관",      rel: "돌봄 제공 연계 (공적 재원)",                    aiWeight: "낮",   src: ["homecare.json", "longtermCareKB.js"] },
  { k: "PT-SVC",  ko: "건강서비스기관", rel: "서비스 제공 · 알고리즘 공급",                   aiWeight: "최고", src: ["checkupCenters.js", "telemed.js", "videoSession.js"] },
  { k: "PT-COM",  ko: "건강커머스기관", rel: "상품 공급 · 직배송 (하이핀은 중개자)",           aiWeight: "중",   src: ["supplyData.js"] },
];

/* 신원 교정표 — 브랜드명으로 갈린 같은 법인을 **명시 경로 하나**로 잇는다(§4-2 4).
   부분문자열 폴백은 쓰지 않는다: 실측에서 「코지마」가 있는데도 「코지헬스케어」가 별 행으로 섰다.
   주의 — 거래 사실 레이어(supplyData)의 행을 지우거나 합치지 않는다. 분모는 108로 고정이고(P0 결정 ④),
     이 표는 협력업체 축에서 두 행이 **같은 법인임을 선언**해 중복 신원을 해소한다.
     partnerId(PT####) 발급은 PG_PARTNER가 생기는 단계에서 이 표를 읽어 수행한다. */
const PG_IDENTITY_FIX = [
  { brand: "코지헬스케어", vendorId: "V0108", sameAs: "V0061", sameAsBrand: "코지마",
    why: "제품 브랜드명 미매칭으로 거래 사실 레이어에 별 행이 생성됐다. 같은 법인으로 선언해 협력업체 축에서 한 건으로 센다.",
    checkedAt: "2026-10-25" },
];
function pgIdentityFix(brandOrId) {
  if (!brandOrId) return null;
  const q = String(brandOrId);
  for (const f of PG_IDENTITY_FIX) if (f.brand === q || f.vendorId === q) return f;
  return null;
}
/* 협력업체 축 모집단 = 거래처 수 − 교정표가 같은 법인으로 선언한 중복 건수. */
function pgPartnerCount(vendorCount) {
  const n = Number(vendorCount) || 0;
  return n - PG_IDENTITY_FIX.filter((f) => f.sameAs).length;
}

/* 외부 공표값 인용 항목 — **우리가 등급을 만들지 않는다.** 제도가 공표한 값을 인용만 한다(§4-5).
   장기요양기관 평가 고시 본문에는 알파벳 등급 표기가 없다. 고시는 「최고 등급」·「최하위등급」으로만
   지칭하고 등급 판정 방법은 공단 공고가 정한다. 그래서 등급 레이블은 조항 레지스트리가 아니라
   **공표값 인용 항목**으로 분리한다. */
const PG_PUBLISHED = [
  { id: "ltc-grade", ko: "장기요양기관 평가등급", org: "국민건강보험공단",
    labels: ["최고 등급", "최하위등급"], forbidLabels: ["A등급", "B등급", "C등급", "D등급", "E등급"],
    note: "급여 종류별 3년 주기 정기평가 + 수시평가 3사유. 기관별 평가기준일이 다르므로 스냅샷 날짜가 아니라 기관별 평가기준일을 함께 렌더한다.",
    verified: "원문확인", quote: "인용만 한다 — 우리가 등급을 산출하지 않는다" },
  { id: "hosp-cert", ko: "의료기관 인증 공표값", org: "의료기관평가인증원",
    labels: ["공표 확인", "공표 없음"], forbidLabels: [],
    note: "공표 명단에 실리지 않는 상태가 있어 미신청과 대상 아님이 구분되지 않는다. 자율 대상 미신청은 해당 없음으로 둔다.",
    verified: "부분확인", quote: "인용만 한다" },
];

/* ── 개발 훅 — 러너가 UI를 거치지 않고 단언할 수 있게 한다(§14-1 원칙) ── */
if (typeof window !== "undefined") {
  window.__hifinPGTerms = function () {
    return { nameMode: PG_NAME_MODE, section: PG_SECTION_KO, subtabs: PG_SUBTABS, terms: PG_TERMS, forbid: PG_FORBID,
             axes: PG_AXES, kinds: PG_KINDS, identityFix: PG_IDENTITY_FIX, published: PG_PUBLISHED,
             countLabel: PG_COUNT_LABEL, settleLabel: PG_SETTLE_LABEL,
             exportNotice: { tsv: PG_EXPORT_NOTICE_TSV, doc: PG_EXPORT_NOTICE_DOC, required: pgExportNoticeRequired(),
                             cls: PG_EXPORT_CLASS, at: PG_EXPORT_NOTICE_AT } };
  };
}
