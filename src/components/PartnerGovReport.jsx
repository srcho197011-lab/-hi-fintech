/* ====================== 협력업체 온톨로지 · 하네스 — 내부통제 보고서 지면 (P5a) ======================
   Partner Governance Report — 서브탭 ④의 보고서 지면 B1 · B2 · B3 · B4 · B6 · B7.
   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md
           §13-7(P5a 산출물 ①~⑦) · §10(보고서 설계) · §10-3(블록) · §10-4(수치 5규약) · §10-5(열람 등급)
           §11-1(판정기 반환 계약 = 화면 계약) · §11-3(등급 역추적) · §12-3(시연 규약)
   결정값: docs/partner_gov/P0_결정서_v1.1.md (Q1 주문 파생 · Q4 표시명 스위치 · Q11 동결)

   이 파일이 소유하는 것 4가지
     ① pgRollup()      — 기간축 롤업. **금액 · 건수의 계산 원천 단 하나**(PG_ROLLUP 계약의 구현).
                          주문 색인 oByV 를 함께 세운다 — 색인 없이는 전수 보고서가 성립하지 않는다.
     ② pgPartnerRecs() — 판정 레코드 조립. 거래 사실 레이어를 읽어 협력업체 축 레코드를 만든다.
     ③ pgView()        — **열람 등급 클램프의 관문.** 판정 반환값 · 추적 지면 · 재판정 세 경로가
                          여기를 지난다(반출 경로는 P4 의 반출 집행이 이미 같은 목록을 지난다).
     ④ PartnerGovReport — 지면. **렌더만 한다.**

   이 파일이 소유하지 않는 것 — 두 곳에 두면 같은 값이 두 개가 된다
     · 용어 · 표시명 · 유형 축 · 금칙 사전            → src/data/partnerGov.js (P1)
     · 지면(블록) · 수치 정의 · 분모 규약 · 고지 문안 → src/data/partnerReport.js (P2)
     · 조항 · 법령 · 판정 규칙 · 결론 산출            → src/data/partnerPolicy.js (P3)
     · 집행 · 면제 · 차단 로그 · 반출 조립            → src/data/partnerEnforce.js (P4)
     · 거래 사실(거래처 · 제품 · 계약 · 주문 · 배송 · 정산) → src/data/supplyData.js (읽기 전용 입력)

   ══ 이 지면이 지키는 네 줄 ══
     1. **화면은 수치를 만들지 않는다.** 지면에 찍히는 모든 숫자는 판정기 반환 필드 또는 롤업 반환
        필드이고, 그 경로는 PG_METRICS[].from 에 적혀 있다. 집계(건수 세기 · 비율)도 화면이 아니라
        아래 pgVerdictRoll() 이 한다 — JSX 안에 산술이 있으면 그 숫자의 출처를 아무도 말할 수 없다.
     2. **문장도 만들지 않는다.** 사유는 판정기가 쓴 reasons[] 를 그대로 찍고, 선언 문안은
        PG_DECL · PG_SCREEN_NOTICE 에서 온다(「조립이지 생성이 아니다」).
     3. **분모가 0이면 비율을 만들지 않는다.** 0%는 「문제 없음」으로 읽히지만 사실은 「데이터 없음」이다.
        롤업과 집계가 null 을 돌리고 화면은 「—」를 찍는다.
     4. **표시명은 pgDisplayName() 한 함수에서만 나온다.** 이 지면에서 상호 필드를 직접 렌더하는
        자리는 0건이어야 하고, 가드(run_wording_guard 검사 ⑭)가 등록부로 이 파일을 보고 있다.

   ⚠ 단일 번들(src/_manifest.txt 순서로 이어 붙인 하나의 모듈 · import 없음)이다. 두 가지를 지킨다.
     ⓐ **모듈 최상위에서 다른 파일의 const 를 평가하지 않는다.** 이 파일은 데이터 파일보다 앞에 오므로
        최상위에서 PG_* 를 읽으면 TDZ 로 번들이 통째로 죽는다(P1 에서 실측한 사고다). 그래서
        상수 접근은 전부 **함수 안**이고, 이 파일의 캐시는 `var` 다(호이스팅 시 undefined 로 초기화되므로
        앞 파일이 먼저 건드려도 ReferenceError 가 나지 않는다).
     ⓑ 전역 이름이 겹치면 조용히 덮어쓴다. 여기서 더하는 이름은 pgRollup · pgVendorRoll ·
        pgPartnerRecs · pgView · pgCellTrace · pgVerdictRoll · PartnerGovReport 와 `_pg…` 사설뿐이다. */

/* ══════════════════════════════════════════════════════════════════════════════
   ① 기간축 롤업 — PG_ROLLUP 계약의 구현 (owner: P5a)
   ══════════════════════════════════════════════════════════════════════════════
   **금액 축은 정산 행(주문 파생 종속 장부)에서만 온다.** 주문에서 금액을 다시 더하지 않는 이유:
   같은 사실을 두 번 계산하면 같은 거래처의 매출이 또 두 값이 되고, 그것이 결함 ②의 재발이다.
   정산 행은 생성기가 주문에서 전건 파생해 **한 번** 계산한 결과이고 행 항등식
   (sales === supplyCost + fee + marginNet)이 전행 성립한다 — 롤업은 그 행을 **다시 모양만 바꾼다.**
   주문 색인(oByV)은 금액이 아니라 **상태 분포 · 건수 · 드릴다운**을 위한 것이다. */
var _pgRollCache = null;

/* 캐시 무효화 — 러너가 거래 사실 레이어를 갈아끼운 뒤 부른다. 화면은 부르지 않는다. */
function pgRollupReset() { _pgRollCache = null; return true; }

/* 미제출 · 미보유의 사유 문안. {available:false, hint} 형태가 §10-4 규약 3 이 요구하는 모양이다.
   ⚠ 함수로 둔다 — 모듈 최상위 const 는 앞 파일이 읽을 때 TDZ 에 걸린다. */
function _pgHint(k) {
  const H = {
    kindNoRec: "협력업체 축 레코드 미등재 — 유형별 명부 파일은 있으나 협력업체로 등재되지 않았다",
    service: "제공 레코드 미보유 — 진료 · 돌봄 · 검진 제공 건수와 이행률의 원천이 없다",
    slaBasis: "배송 완료 기준 — 계약 기준일 대조는 성립하지 않는다(배송 예정일이 주문일과 독립 생성된다)",
    noTrade: "상품 공급 거래 레코드가 없다 — 실적 축은 해당 없음이고 0원이 아니다",
  };
  return H[k] || "";
}
function _pgTerm(k, fallback) {
  return (typeof pgTerm === "function" && pgTerm(k)) || fallback || "";
}
function _pgDeclAsOf() { return (typeof PG_ASOF !== "undefined") ? PG_ASOF : "2026-10-25"; }
function _pgDeclText(k) {
  const T = (typeof PG_DECL !== "undefined") ? PG_DECL : {};
  return T[k] || "";
}
/* 자기 거버넌스 항목의 **화면 고지 문안**. 대응표가 없으면 빈 문자열을 돌려 호출자가 알아차리게 한다. */
function _pgGovNotice(id) {
  const M = (typeof PG_SELF_GOV_NOTICE !== "undefined") ? PG_SELF_GOV_NOTICE : {};
  return M[id] ? _pgDeclText(M[id]) : "";
}
/* 분모 0이면 비율을 만들지 않는다 — null 에서 화면이 「—」를 찍는다(§10-4 규약 1). */
function _pgRate(num, den) { return den > 0 ? num / den : null; }

function _pgCellZero() {
  return { sales: 0, supplyCost: 0, fee: 0, marginNet: 0, settleTarget: 0, preShip: 0, delivered: 0,
    orders: 0, slaNum: 0, slaDen: 0, rows: 0 };
}
/* 상위 합계는 **행 합으로만** 만든다 — 상위 금액에 요율을 다시 곱하면 월행 합과 원 단위에서 어긋난다
   (§10-4 규약 7). 그래서 이 함수가 더하기 외의 산술을 하지 않는다. */
function _pgCellAdd(a, st) {
  a.sales += st.sales; a.supplyCost += st.supplyCost; a.fee += st.fee; a.marginNet += st.marginNet;
  a.settleTarget += st.sales; a.preShip += st.preShip; a.delivered += st.delivered;
  a.orders += st.orders; a.rows += 1;
  return a;
}
/* 파생 필드 확정 — 비율 · 이행 축 · 항등식 성립 여부를 **반환 필드로** 싣는다.
   화면이 `sales === supplyCost + fee + marginNet` 을 다시 계산하지 않게 하는 자리다. */
function _pgCellSeal(c) {
  c.slaMet = { num: c.slaNum, den: c.slaDen, rate: _pgRate(c.slaNum, c.slaDen), basis: _pgHint("slaBasis") };
  c.service = { available: false, hint: _pgHint("service") };
  c.settleEqSales = c.settleTarget === c.sales;
  c.rowIdentity = c.sales === c.supplyCost + c.fee + c.marginNet;
  return c;
}

function pgRollup() {
  if (_pgRollCache) return _pgRollCache;
  const D = (typeof supplyData === "function") ? supplyData() : null;
  if (!D) return null;

  /* ⓐ 주문 색인 — 전수 보고서의 전제다. 색인 없이 108곳을 그대로 돌리면 324만 회 비교가 된다. */
  const oByV = {}, prodById = {}, ordMonth = {};
  for (const pd of D.products) prodById[pd.id] = pd;
  for (const od of D.orders) {
    (oByV[od.vendorId] = oByV[od.vendorId] || []).push(od);
    ordMonth[od.id] = od.orderDate.slice(0, 7);   /* 주문일 기준 월 · 문자열 앞 7자.
                                                     날짜 객체를 거치면 로컬 시간대에서 월 경계일이 밀린다 */
  }

  /* ⓑ 창 — **정산 행이 가진 기간의 집합**이다. 창을 이 파일에 상수로 적지 않는다:
     창의 주인은 생성기이고, 두 곳에 적으면 창이 갈린 것을 아무도 모른다. */
  const mSeen = {}, months = [];
  for (const st of D.settlements) if (!mSeen[st.period]) { mSeen[st.period] = 1; months.push(st.period); }
  months.sort();   /* 상수 비교 정렬 — 난수를 섞는 정렬을 쓰지 않는다(결정론) */

  /* ⓒ period 롤업 — 거래처 × 월. 주문 0건 셀은 행을 만들지 않는다(정산 행이 없으면 셀도 없다). */
  const period = [], cellKey = {}, monthsOf = {}, byVendor = {}, byMonth = {};
  const total = _pgCellZero();
  for (const st of D.settlements) {
    const row = { vendorId: st.vendorId, period: st.period, docId: st.id,
      sales: st.sales, supplyCost: st.supplyCost, fee: st.fee, marginNet: st.marginNet,
      settleTarget: st.sales, preShip: st.preShip, delivered: st.delivered,
      orders: st.orders, slaNum: 0, slaDen: 0, rows: 1 };
    period.push(row);
    cellKey[st.vendorId + "|" + st.period] = row;
    (monthsOf[st.vendorId] = monthsOf[st.vendorId] || []).push(row);
    _pgCellAdd(byVendor[st.vendorId] || (byVendor[st.vendorId] = _pgCellZero()), st);
    _pgCellAdd(byMonth[st.period] || (byMonth[st.period] = _pgCellZero()), st);
    _pgCellAdd(total, st);
  }

  /* ⓓ 이행 축 — 금액과 **별 축**이다. 배송 레코드는 기간 필드를 갖고 있지 않으므로 주문의 월을 빌린다.
     ⚠ 「계약 기준일 내 배송」으로 세지 않는다 — 배송 예정일이 주문일과 독립 생성되므로 그 대조는
       성립하지 않는다(거래 사실 레이어 주석에 이미 적혀 있는 사실이다). 그래서 기준을 반환 필드
       (slaMet.basis)로 함께 실어, 지면이 무엇을 센 것인지 말할 수 있게 한다. */
  for (const sh of D.shipments) {
    const per = ordMonth[sh.orderId];
    if (!per || !mSeen[per]) continue;
    const done = sh.status === "배송완료" ? 1 : 0;
    const bv = byVendor[sh.vendorId]; if (bv) { bv.slaDen += 1; bv.slaNum += done; }
    const bm = byMonth[per]; if (bm) { bm.slaDen += 1; bm.slaNum += done; }
    const ck = cellKey[sh.vendorId + "|" + per]; if (ck) { ck.slaDen += 1; ck.slaNum += done; }
    total.slaDen += 1; total.slaNum += done;
  }

  /* ⓔ 창 밖 미포착 — 매출축과 매입축을 **둘 다** 센다. 하나만 적으면 매입축이 소리 없이 사라진다.
     ★ 교차 항등식을 **같은 루프에서** 센다(2026-10-26 적대적 심사 반영). 왜 따로 세는가:
       행 항등식(sales === supplyCost + fee + marginNet)은 정산 생성기가 marginNet 한 곳을 plug 로
       두므로 **정의상 항상 참**이다 — 실패할 수 없는 지표를 성과로 내놓으면 사실이지만 증거가 없다.
       run_pg_scan 음성 테스트도 「매입축을 역산 plug 로 되돌려도 행 항등식은 0건으로 통과한다」고
       스스로 적어 두었다. 구별력이 있는 축은 **주문 축 합 = 정산 축 합**이다(두 축이 독립 생성이면
       즉시 어긋난다). 그래서 이 값을 반환 필드로 봉인해 지면이 다시 더하지 않게 한다. */
  let uSales = 0, uCost = 0, uN = 0, ordGmv = 0, ordN = 0;
  for (const od of D.orders) {
    if (od.status === "취소") continue;
    ordGmv += od.amount; ordN += 1;
    if (mSeen[od.orderDate.slice(0, 7)]) continue;
    const pd = prodById[od.sku];
    uSales += od.amount; uCost += pd ? pd.supplyPrice * od.qty : (od.amount - od.margin); uN += 1;
  }

  _pgCellSeal(total);
  for (const k of Object.keys(byVendor)) _pgCellSeal(byVendor[k]);
  for (const k of Object.keys(byMonth)) _pgCellSeal(byMonth[k]);
  for (const row of period) _pgCellSeal(row);

  /* ⓕ 모집단 — 거래처 수에서 신원 교정표가 같은 법인으로 선언한 중복을 뺀 값이 협력업체 축이다. */
  const vendorN = D.counts.vendor;
  const partnerN = (typeof pgPartnerCount === "function") ? pgPartnerCount(vendorN) : vendorN;
  const kinds = (typeof PG_KINDS !== "undefined") ? PG_KINDS : [];
  const byKind = kinds.map((kd) => (kd.k === "PT-COM"
    ? { k: kd.k, ko: kd.ko, n: partnerN, available: true, src: kd.src }
    : { k: kd.k, ko: kd.ko, n: null, available: false, src: kd.src, hint: _pgHint("kindNoRec") }));
  const tradeIds = Object.keys(byVendor);
  const noTrade = D.vendors.filter((vd) => !byVendor[vd.id]).map((vd) => vd.id);

  _pgRollCache = {
    owner: "P5a", index: { oByV: oByV, keys: Object.keys(oByV).length },
    period: period, cellKey: cellKey, monthsOf: monthsOf, byVendor: byVendor, byMonth: byMonth,
    total: total, months: months,
    meta: {
      asOf: _pgDeclAsOf(),
      window: { from: months[0] || null, to: months[months.length - 1] || null, months: months.length },
      partnerN: partnerN, vendorN: vendorN, dupDeclared: vendorN - partnerN,
      tradeN: tradeIds.length, noTrade: noTrade, byKind: byKind,
      gmv: total.sales, rows: period.length,
      uncaught: { sales: uSales, supplyCost: uCost, orders: uN,
        full: uN === 0, note: uN === 0 ? _pgDeclText("windowFull") : "" },
      /* 교차 항등식 — 주문 축 합과 정산 축 합. diff 가 0 이어야 「주문 파생」이 성립한다. */
      cross: { ordGmv: ordGmv, ordN: ordN, settleSales: total.sales,
        diff: ordGmv - total.sales, ok: ordGmv === total.sales },
      grades: (typeof pgGradeMix === "function") ? pgGradeMix() : null,
      metricGrades: (typeof pgMetricGradeMix === "function") ? pgMetricGradeMix() : null,
      planModel: _pgPlanModel(),
    },
  };
  return _pgRollCache;
}

/* 재무 계획 모델 대조 — **대조 1곳만**이다(b1.planCompare). 그 외 자리에서 읽으면 두 장부가 섞인다.
   두 값을 함께 적고 한쪽이 다른 쪽에 「반영된다」고 적지 않는다 — 산정 기준이 다른 별 지면이다. */
function _pgPlanModel() {
  try {
    if (typeof fbModel !== "function") return { available: false, hint: "계획 모델 미적재" };
    const A = fbModel().annual[0];
    return { available: true, revP: A.revP, cogsP: A.cogsP, owner: _pgDeclText("planOwner") };
  } catch (e) { return { available: false, hint: "계획 모델 미적재" }; }
}

/* 거래처 하나의 롤업 — **단일 거래처 모달과 보고서가 같은 입구를 쓴다.**
   모달이 자기 계산을 가지면 같은 거래처의 매출이 두 값이 된다(§13-7 제약). */
function pgVendorRoll(vendorId) {
  const R = pgRollup();
  if (!R || !vendorId) return null;
  return { cell: R.byVendor[vendorId] || null, months: R.monthsOf[vendorId] || [],
    orders: R.index.oByV[vendorId] || [], window: R.meta.window, asOf: R.meta.asOf };
}

/* ══════════════════════════════════════════════════════════════════════════════
   ② 판정 레코드 조립 — 거래 사실 레이어를 읽어 협력업체 축 레코드를 만든다
   ══════════════════════════════════════════════════════════════════════════════
   ★ partnerId 는 거래처 식별자(V####)를 그대로 쓴다. 새 번호 체계를 발급하지 않는다 —
     PT#### 발급은 협력업체 레지스트리가 생기는 단계가 신원 교정표를 읽어 수행하고, 그때까지
     용어 원천이 거래처 식별자를 안정 식별자로 선언해 두었다(partnerGov.js pgCode 주석).
   ★ 제출 축(submit)은 **비운다.** 통제 축 시연값은 「미확인」 단일값만 만든다는 규약(§12-3 규약 2)
     때문이다 — 보유 / 미보유 2값을 시드로 만들면 실명 법인 옆에 「미보유 · 중대 결함」이 찍힌다.
     그 결과 지면은 「미제출 N / N」으로 떨어지고, 그것이 **정직한 현재 상태**다.
   ★ 당사 축(self)도 비운다. 당사 구조 입력은 협력업체 제출물이 아니라 우리 쪽 계약 조항 · 정산 산식 ·
     노출 로직 · 고지 지면이고, 그 선언은 아직 없다. 선언 전까지는 판정 보류로 둔다.
     다만 **문구의 부재 자체가 사실인 조항**은 판정기가 돌려준 결과를 그대로 적는다. */
var _pgRecCache = null;
function pgPartnerRecsReset() { _pgRecCache = null; return true; }

function pgPartnerRecs() {
  if (_pgRecCache) return _pgRecCache;
  const D = (typeof supplyData === "function") ? supplyData() : null;
  const R = pgRollup();
  if (!D || !R) return [];
  /* ★ 파생 상호 사본을 레코드에 **싣지 않는다.** 거래 사실 레이어의 계약 · 제품 행은 편의를 위해
     vendorName 사본을 들고 있는데, 그 사본은 잘라낼 필드 목록(출처 등급 할당표)에 선언돼 있지 않다.
     그대로 담으면 열람 등급을 내려도 레코드 안에 상호가 남아 추적 지면 · 재판정 · 반출이 그것을
     읽을 수 있다(실측으로 L2 · L3 레코드에서 상호가 살아 있었다). 상호는 레코드에 **한 자리**
     (legalName)만 두고 그 한 자리가 잘린다 — 표기는 식별자에서 조립한다(§4-6-5 ⓐ와 같은 사상). */
  const _noName = (o) => { if (!o) return o; const y = {}; for (const k of Object.keys(o)) if (k !== "vendorName") y[k] = o[k]; return y; };
  const ctByV = {}, pdByV = {};
  for (const ct of D.contracts) ctByV[ct.vendorId] = _noName(ct);
  for (const pd of D.products) (pdByV[pd.vendorId] = pdByV[pd.vendorId] || []).push(_noName(pd));
  const out = [];
  for (const vd of D.vendors) {
    const fix = (typeof pgIdentityFix === "function") ? pgIdentityFix(vd.id) : null;
    out.push({
      partnerId: vd.id, vendorId: vd.id, legalName: vd.name,
      kind: "PT-COM", stage: "거래중",
      sameAs: (fix && fix.sameAs) || null,
      vendor: vd, contract: ctByV[vd.id] || null, products: pdByV[vd.id] || [],
      /* 주문 · 배송 배열은 레코드에 담지 않는다 — 조항 입력 계약에 그 두 객체가 없고(판정기는 롤업 칸을
         본다), 전수 108곳 × 등급 클램프의 깊은 사본이 3만 건을 복제하게 된다. 기간축 실적은
         pgVendorRoll(vendorId) 이 색인에서 바로 돌려준다. */
      licenses: [], manufacturingSites: [], evidence: [], published: null,
      /* ⓠ 당사 축 입력 — **측정값만** 싣는다(제출물이 아니다). 지면 고지 레지스트리 실측이라
         등급이 실원천이고, 결측으로 불허가 나오는 경로가 아니다(PG_SELF_SCAN · §10-4 규약 ②). */
      submit: {}, self: { shop: { brokerNotice: (typeof pgSelfScan === "function") ? pgSelfScan("brokerNotice") : null } }, ops: {},
      rollup: { cell: R.byVendor[vd.id] || null },
    });
  }
  _pgRecCache = out;
  return out;
}
function pgPartnerRec(partnerId) {
  for (const pr of pgPartnerRecs()) if (pr.partnerId === partnerId) return pr;
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ③ 열람 등급 클램프의 관문 — 네 경로가 **같은 한 곳**을 지난다
   ══════════════════════════════════════════════════════════════════════════════
   규약(§10-5 ⓐ · PG_CLAMP.rules)
     · 잘라낸 필드는 **키 자체가 없다.** null 로 두면 소비자가 「값이 없다」와 「볼 수 없다」를 구별하지 못한다.
     · 화면 필터로 구현하지 않는다 — 추적 지면 · 재판정 · 반출이 각각 숨김을 다시 구현하면 한 곳만
       빠져도 샌다. 그래서 **데이터 경로**에서 자른다.
     · 잘라낼 목록의 소유자는 하나다(pgClampDrop — 출처 등급 할당표에서 파생). 여기서 목록을
       다시 적지 않는다; 아래 _pgDropHit 은 **그 목록을 읽는 대조기**일 뿐이다.

   ★ 판정은 **전 레코드로 한 번만** 내린다. 클램프를 판정 입력에 걸면 등급에 따라 판정이 달라지고,
     그것은 「같은 조항이 보는 사람에 따라 다른 결론을 낸다」는 뜻이 된다 — 보고서가 거짓말을 한다.
     그래서 클램프는 판정의 **산출을 소비자에게 넘기기 전에 통과하는 관문**이다:
       경로 ① 판정 반환값   — pgView().rows[].r (inputRefs 의 값 칸을 자른다)
       경로 ② 추적 지면     — pgCellTrace() 가 같은 관문을 지난 반환값을 돌려준다
       경로 ③ 재판정        — r.whatIf 도 같은 관문을 지난다(별도 추정 로직이 아니라 같은 반환값이다)
       경로 ④ 반출          — 반출 집행(pgExportGate)이 **같은 pgClampDrop 목록**을 읽어 막는다(P4)
   ⚠ 한계 1줄 — 단일 전역 번들이라 어느 컴포넌트든 거래 사실 레이어를 한 줄로 읽을 수 있다.
     클램프는 적힌 만큼의 강제력이 없고 **정적 검사로만 단속된다.** 그 한계를 알고 쓴다. */
function _pgDrop(level) {
  return (typeof pgClampDrop === "function") ? pgClampDrop(level) : [];
}
function _pgDropHit(drop, field) {
  if (!field) return false;
  for (const d of drop) {
    if (d === field) return true;
    if (d.slice(-2) === ".*" && field.indexOf(d.slice(0, -1)) === 0) return true;   /* obj.k.* 접두 */
    if (d.slice(-1) === "*" && field.indexOf(d.slice(0, -1)) === 0) return true;    /* obj.k_* 접두 */
    if (field.indexOf(d + ".") === 0) return true;
  }
  return false;
}
/* 판정 반환값의 클램프 — 값 칸을 **삭제**하고 잘렸다는 사실만 남긴다. 재판정도 재귀로 같이 지난다. */
function _pgClampDecision(d, level, drop) {
  if (!d) return d;
  const out = Object.assign({}, d);
  let cut = 0;
  out.inputRefs = (d.inputRefs || []).map((ir) => {
    if (!_pgDropHit(drop, ir.field)) return ir;
    const y = Object.assign({}, ir);
    delete y.value;                       /* 키 자체를 지운다 — 「값이 없다」와 섞이지 않게 clamped 를 남긴다 */
    y.clamped = level; cut += 1;
    return y;
  });
  if (d.whatIf) out.whatIf = _pgClampDecision(d.whatIf, level, drop);
  out._clamp = { level: level, cut: cut };
  return out;
}

function pgView(rec, ctx, level) {
  const lv = level || "L1";
  const c = ctx || {};
  const asOf = c.asOf || _pgDeclAsOf();
  const kind = c.kind || (rec && rec.kind) || "PT-COM";
  const stage = c.stage || (rec && rec.stage) || "거래중";
  const drop = _pgDrop(lv);
  /* 지면이 읽는 레코드 — 상호 · 금액 · 여신은 등급에 따라 **데이터에서** 사라진다 */
  const shown = (typeof pgFieldClamp === "function") ? pgFieldClamp(rec, lv) : rec;
  const rows = [];
  if (typeof pgDecideAll === "function") {
    const all = pgDecideAll(rec, { asOf: asOf, kind: kind, stage: stage, _noWhatIf: !!c._noWhatIf });
    for (const x of all) rows.push({ id: x.id, r: _pgClampDecision(x.r, lv, drop) });
  }
  const conc = (typeof pgTrustConclusion === "function") ? pgTrustConclusion(rows) : null;
  /* 신원 조회는 **L1 경로 하나**다(§4-6-2). 등급이 L1 이 아닌 뷰에 매핑을 실어 보내면 그 지면이
     코드 표기 모드에서도 상호를 찍을 수 있게 되고, 클램프를 데이터 경로에 둔 이유가 사라진다. */
  const ident = (lv === "L1" && typeof pgIdentityLookup === "function") ? pgIdentityLookup(rec) : null;
  return { level: lv, asOf: asOf, stage: stage, kind: kind, rec: shown, rows: rows,
    conclusion: conc, dropped: (shown && shown._clamp && shown._clamp.dropped) || [],
    identity: ident };
}

/* 추적 지면(경로 ②)의 입구 — 칸 하나의 반환값을 **클램프를 지난 뒤** 돌려준다.
   5레인 지면은 아래 pgTrace() 가 이 입구와 같은 관문을 지나 레인별로 전개한다(P5b). 두 함수가
   같은 _pgClampDecision 을 지나는 것이 핵심이다 — 경로가 갈리면 한쪽만 클램프를 지난다. */
function pgCellTrace(partnerId, policyId, level) {
  /* ★ P5b 에서 **구현을 하나로 합쳤다.** 종전에는 이 함수가 판정을 따로 한 번 더 내렸는데,
     5레인 지면이 서면서 같은 칸의 추적이 **두 구현**을 갖게 된다 — 한쪽만 고쳐지는 순간
     두 지면이 다른 말을 한다(이 파일이 B6 에서 사유 · 입력 구간을 떼어낸 것과 같은 사유다).
     그래서 이 입구는 pgTrace() 의 반환값에서 칸 수준 필드만 돌려주는 **얇은 껍데기**다. */
  const t = pgTrace(partnerId, policyId, level);
  if (!t) return null;
  return { partnerId: t.partnerId, policyId: t.policyId, level: t.level,
    dispName: t.dispName, r: t.r, lanes: t.lanes, owner: _pgDeclText("traceOwner") };
}

/* ══════════════════════════════════════════════════════════════════════════════
   ④ 판정 집계 — B2 · B4 · B6 · B7 의 모든 수치가 여기서 나온다
   ══════════════════════════════════════════════════════════════════════════════
   왜 화면이 아니라 여기인가: JSX 안에서 건수를 세면 그 숫자의 출처를 아무도 말할 수 없고,
   「표시 정합성」 검사가 대조할 대상이 사라진다(§10-4 규약 4).

   ★ 당사 축 조항은 **행 수로 세지 않는다.** 입력이 우리 구조(계약 조항 · 정산 산식 · 노출 로직 ·
     고지 지면)이므로 108개 협력업체 행에 같은 결과가 복제된다. 그것을 그대로 더하면 조항 1건의
     결함이 「중대 결함 108건」으로 보인다 — 판정 대상 열을 둔 이유가 바로 그것을 가르기 위함이다
     (b4.subject renderRule: 섞어 읽으면 당사 책임 조항을 협력업체 결함으로 읽는다).
     그래서 집계를 두 축으로 가르고, 두 축을 **같은 지면에 함께** 적는다. */
var _pgRollupVCache = {};
function pgVerdictRollReset() { _pgRollupVCache = {}; return true; }

/* 존재 / 기능 2판정 → 칸 라벨. **조항 축으로 모은 건수와 축 집계만** 본다 —
   한 협력업체 행을 표본으로 뽑아 전수를 대표하게 하면 그 행이 바뀌는 순간 행렬이 조용히 달라진다.
   그리고 판정기가 구조 필드로 돌려준 axis 만 본다: 사유 문장을 정규식으로 가르던 구현은 낱말 하나를
   다듬는 것만으로 결론이 「결론 보류」에서 「결함 있음」으로 뒤집혔다(결론 산출 함수의 주석에 적힌 사고다). */
function _pgPF(bp, col) {
  if (!bp) return { s: "none", ko: "—" };
  const c = bp.counts, ax = bp.axisTally || {};
  const judged = (c.PERMIT || 0) + (c.DENY || 0);
  if (judged === 0) {
    if ((c.INDETERMINATE || 0) > 0) return { s: "pending", ko: "판정 보류" };
    if ((c.NOT_APPLICABLE || 0) > 0) return { s: "na", ko: "해당 없음" };
    return { s: "none", ko: "—" };
  }
  if ((ax[col] || 0) > 0) return { s: "bad", ko: col === "존재" ? "미존재" : "미기능" };
  if (col === "존재" && (ax["기능"] || 0) > 0) return { s: "ok", ko: "존재" };
  if ((ax["미지정"] || 0) > 0) return { s: "bad", ko: "결함" };
  if ((c.INDETERMINATE || 0) > 0) return { s: "pending", ko: "일부 판정 보류" };
  return { s: "ok", ko: col === "존재" ? "존재" : "기능" };
}

function pgVerdictRoll(opt) {
  const o = opt || {};
  const level = o.level || "L1";
  const type = o.type || "PG-R";
  const stage = o.stage || "거래중";
  const asOf = o.asOf || _pgDeclAsOf();
  const key = [level, type, stage, asOf, o.partnerId || "*"].join("|");
  if (_pgRollupVCache[key]) return _pgRollupVCache[key];

  const pols = (typeof PG_POLICIES !== "undefined") ? PG_POLICIES : [];
  const all = pgPartnerRecs();
  const recs = o.partnerId ? all.filter((pr) => pr.partnerId === o.partnerId) : all;
  const drop = _pgDrop(level);

  const zero = () => ({ PERMIT: 0, DENY: 0, INDETERMINATE: 0, NOT_APPLICABLE: 0 });
  const byPolicy = {}, byPartner = [], cells = {};
  const total = zero();
  const defectPartner = { 경미: 0, 중대: 0, 치명: 0 };
  const defectSelf = { 경미: 0, 중대: 0, 치명: 0 };
  const selfDefects = [], graceIds = [], unverifiedIds = [], notYetIds = [], lockedIds = [];
  const concCount = {}, concWhy = {};
  const matrix = [];
  let naPolicyIds = [];

  for (const pol of pols) {
    byPolicy[pol.id] = { id: pol.id, group: pol.group, subject: pol.subject, title: pol.title,
      lifecycle: pol.lifecycle, severity: pol.severity, obligation: pol.obligation, dual: pol.dual,
      cycle: pol.cycle, locked: pol.locked, counts: zero(), axisTally: {}, law: [], verified: null,
      effectiveDate: null, grace: null, sanction: null, enforce: null, remedy: pol.remedy, evidence: pol.evidence,
      note: pol.note };
  }

  for (const pr of recs) {
    const view = pgView(pr, { asOf: asOf, kind: pr.kind, stage: stage, _noWhatIf: true }, level);
    const line = { partnerId: pr.partnerId,
      dispName: (typeof pgDisplayName === "function") ? pgDisplayName(view.rec) : "",
      code: (typeof pgCode === "function") ? pgCode(pr) : pr.partnerId,
      kind: pr.kind, counts: zero(), partnerCounts: zero(), selfCounts: zero(),
      cells: {}, partnerCells: {}, selfCells: {} };
    for (const x of view.rows) {
      const d = x.r, bp = byPolicy[x.id];
      line.counts[d.decision] = (line.counts[d.decision] || 0) + 1;
      total[d.decision] = (total[d.decision] || 0) + 1;
      if (bp) {
        bp.counts[d.decision] = (bp.counts[d.decision] || 0) + 1;
        if (d.decision === "DENY") {
          const ax = d.axis || (d.ruleOutcome && d.ruleOutcome.axis) || "미지정";
          bp.axisTally[ax] = (bp.axisTally[ax] || 0) + 1;
        }
        if (!bp.law.length && d.ruleRef) {
          bp.law = (d.ruleRef.law || []).map((lr) => ({ label: lr.label, verified: lr.verified, source: lr.source }));
          bp.verified = d.ruleRef.verified; bp.effectiveDate = d.ruleRef.effectiveDate;
          bp.grace = d.ruleRef.enforcementGrace || null; bp.sanction = d.ruleRef.sanction || null;
        }
        if (!bp.enforce && d.enforce) bp.enforce = { level: d.enforce.level, declared: d.enforce.declared,
          cap: d.enforce.cap, pep: d.enforce.pep, render: d.enforce.render };
      }
      const slim = { d: d.decision, c: d.cause, sev: (d.ruleRef && d.ruleRef.severity) || null,
        sub: (d.ruleRef && d.ruleRef.subject) || null, grace: !!(d.ruleRef && d.ruleRef.enforcementGrace),
        lv: (d.enforce && d.enforce.level) || null, ax: d.axis || null,
        why: (d.reasons && d.reasons[0]) || "" };
      line.cells[x.id] = slim;
      /* 칸을 판정 대상으로 가른다 — 두 축을 한 분모에 넣지 않기 위한 자리다(B4 가 별 띠로 렌더한다) */
      if (slim.sub === "당사") { line.selfCells[x.id] = slim; line.selfCounts[d.decision] = (line.selfCounts[d.decision] || 0) + 1; }
      else { line.partnerCells[x.id] = slim; line.partnerCounts[d.decision] = (line.partnerCounts[d.decision] || 0) + 1; }
      cells[pr.partnerId + "|" + x.id] = slim;
    }
    const cc = view.conclusion ? view.conclusion.conclusion : "—";
    concCount[cc] = (concCount[cc] || 0) + 1;
    /* ★ 판정기가 쓴 **결론 사유**를 집계한다(2026-10-26). 종전에는 `conclusion.why` 가 전건 들어
       있는데도 B2 가 「결론 보류 · 108곳」만 찍고 그 문장을 버렸다 — 판정기가 쓴 유일한 결론 사유를
       화면이 버리면 「양호가 어느 조항들의 합인지」가 역추적되지 않는다(§11-3). 문장은 판정기 것이고
       지면은 **세기만** 한다. 그리고 그 결론을 만든 T 조항 목록을 함께 싣는다. */
    const cw = view.conclusion && view.conclusion.why ? view.conclusion.why : null;
    if (cw) { concWhy[cc] = concWhy[cc] || {}; concWhy[cc][cw] = (concWhy[cc][cw] || 0) + 1; }
    line.conclusion = view.conclusion;
    /* ★ 행 준수율의 분모에서 **ⓠ당사 축 조항을 뺀다**(2026-10-26 교체).
         왜: 당사 축 조항의 입력은 우리 지면 구조이므로 108개 행에 **같은 결과가 복제된다.** 행 분모에
         그대로 넣으면 조항 1건이 실명 법인 108곳 각자의 결함으로 찍힌다 — 실측 사고가 그랬다:
         V0001 행의 분모 1 = 29 − 보류 24 − 해당없음 4 이고 **그 1칸이 L-10(당사 조항)** 이어서
         실명 법인의 준수율 0.0% 가 전적으로 우리 조항 하나에서 나왔다. B2 는 이미 두 축을 가르고
         (`complyPartner` · `selfAxis`) AI3 지면도 「섞어 세지 않는다」고 선언하는데 행만 섞고 있었다.
         당사 축 칸은 `selfCells` 로 따로 실어 B4 가 **별 띠**로 렌더한다(칸 자체를 숨기지 않는다). */
    line.countsAll = Object.assign({}, line.counts);
    line.comply = _pgComply(line.partnerCounts);
    line.complyAll = _pgComply(line.countsAll);
    byPartner.push(line);
  }

  /* 조항 축 집계 — 결함은 **판정 대상으로 가른 뒤** 센다 */
  for (const pol of pols) {
    const bp = byPolicy[pol.id];
    bp.comply = _pgComply(bp.counts);
    if (bp.verified && bp.verified !== "원문확인") unverifiedIds.push(pol.id);
    if (bp.grace) graceIds.push(pol.id);
    if (pol.locked) lockedIds.push(pol.id);
    const naAll = bp.counts.NOT_APPLICABLE > 0 && bp.counts.PERMIT + bp.counts.DENY + bp.counts.INDETERMINATE === 0;
    if (naAll) naPolicyIds.push(pol.id);
    if (bp.counts.DENY > 0) {
      if (pol.subject === "당사") {
        defectSelf[pol.severity] = (defectSelf[pol.severity] || 0) + 1;      /* 조항 1건으로 센다 */
        selfDefects.push(pol.id);
      } else {
        defectPartner[pol.severity] = (defectPartner[pol.severity] || 0) + bp.counts.DENY;
      }
    }
  }
  /* 시행 전 조항 — 「해당 없음」과 섞지 않는다. 원인이 다르다. */
  for (const k of Object.keys(cells)) {
    const s = cells[k];
    if (s.c === "not_yet_effective") { const id = k.split("|")[1]; if (notYetIds.indexOf(id) < 0) notYetIds.push(id); }
  }

  /* 원칙 × {존재, 기능} 행렬 — 총점을 만들지 않는다. 각 칸은 그 조항의 **집계**에서 나온다. */
  const dualPols = pols.filter((pol) => pol.group === "T" && pol.dual);
  for (const pol of dualPols) {
    const bp = byPolicy[pol.id];
    const hit4 = ["PERMIT", "DENY", "INDETERMINATE", "NOT_APPLICABLE"].filter((k) => bp.counts[k] > 0);
    matrix.push({ id: pol.id, title: pol.title, severity: pol.severity,
      exist: _pgPF(bp, "존재"), func: _pgPF(bp, "기능"),
      mixed: hit4.length > 1, counts: bp.counts, comply: bp.comply });
  }
  /* 미제출로 판정이 서지 않은 조항 수 — 지면이 「통제 축 N개 중 M개가 미제출」을 말하는 근거다.
     화면이 세지 않는다(§10-4 규약 4). */
  const pendingPolicies = pols.filter((pol) => byPolicy[pol.id].counts.INDETERMINATE > 0).length;

  /* ══ 준수율을 **판정 대상으로 가른다** ══
     왜: 당사 축 조항은 입력이 우리 구조이므로 108개 행에 같은 결과가 복제된다. 전체 분모에 그대로
     넣으면 조항 1건이 분모 108을 만들고, 그 한 조항의 결과가 전체 준수율을 지배한다 — 실측에서
     전체 준수율이 「0% · 분모 108」로 떨어졌고 그 분모 108 전부가 당사 축 조항 하나였다.
     그래서 ⓐ협력업체 축은 행 기준으로, ⓑ당사 축은 **조항 1건 기준**으로 센다. 두 값을 같은
     지면에 함께 적는다 — 섞어 읽으면 당사 책임 조항을 협력업체 결함으로 읽는다(§5-2). */
  const partnerCounts = zero(), selfAxis = { policyN: 0, byDecision: zero(), mixed: 0, ids: {} };
  const DKEYS = ["PERMIT", "DENY", "INDETERMINATE", "NOT_APPLICABLE"];
  for (const pol of pols) {
    const bp = byPolicy[pol.id];
    if (pol.subject === "당사") {
      selfAxis.policyN += 1;
      const hit = DKEYS.filter((k) => bp.counts[k] > 0);
      if (hit.length === 1) { selfAxis.byDecision[hit[0]] += 1; selfAxis.ids[pol.id] = hit[0]; }
      else { selfAxis.mixed += 1; selfAxis.ids[pol.id] = "혼재"; }
    } else {
      for (const k of DKEYS) partnerCounts[k] += bp.counts[k];
    }
  }
  selfAxis.comply = _pgComply(selfAxis.byDecision);
  const complyPartner = _pgComply(partnerCounts);

  /* ══ ④B4 격자 분모 — **지면이 곱하지 않게 여기서 봉인한다**(2026-10-26 적대적 심사 반영) ══
     왜: cellN(= 조항 전체 × 레코드)은 당사 축 조항을 협력업체 레코드마다 복제한 칸을 포함한다.
     그런데 ④B4 격자는 당사 축 열을 **빼고** 렌더하고(그 조항은 아래 별 띠에 조항 1행으로 싣는다),
     같은 파일의 주석이 「전체 칸 수를 격자 분모로 적으면 보이지 않는 열이 있는 것으로 읽힌다」고
     이미 금지해 두었다. 종전에는 지면이 `V.partnerN * polIds.length` 로 그 값을 **직접 곱했다** —
     화면에 찍히는 「2,592칸」을 어느 반환 필드도 소유하지 않았다(「화면 자체 계산 0건」의 구멍).
     그래서 전체(ALL)와 조항군별 분모를 함께 돌려준다 — 격자가 조항군으로 걸러져도 지면은 조회만 한다. */
  const partnerPols = pols.filter((p) => p.subject !== "당사");
  const gridCellByGroup = { ALL: partnerPols.length * recs.length };
  const selfPolByGroup = { ALL: selfAxis.policyN };
  for (const p of pols) {
    const g = p.group;
    if (p.subject === "당사") selfPolByGroup[g] = (selfPolByGroup[g] || 0) + 1;
    else gridCellByGroup[g] = (gridCellByGroup[g] || 0) + recs.length;
  }

  const enf = _pgEnforceStats();
  const out = {
    level: level, type: type, stage: stage, asOf: asOf,
    policyN: pols.length, partnerN: recs.length, cellN: pols.length * recs.length,
    partnerPolicyN: partnerPols.length,
    gridCellN: gridCellByGroup.ALL, gridCellByGroup: gridCellByGroup, selfPolByGroup: selfPolByGroup,
    total: total, comply: _pgComply(total),
    complyPartner: complyPartner, partnerCounts: partnerCounts, selfAxis: selfAxis,
    byPolicy: byPolicy, byPartner: byPartner, cells: cells,
    defect: { partnerAxis: defectPartner, selfAxis: defectSelf, selfPolicies: selfDefects,
      note: _pgDeclText("selfAxisOnce") },
    matrix: matrix, conclusion: concCount,
    /* 결론 → 판정기가 쓴 사유 → 그 결론을 만든 조항 축. 세 칸 모두 반환 필드다(지면이 짓지 않는다). */
    conclusionWhy: (function () {
      const o = {};
      for (const k of Object.keys(concWhy)) o[k] = Object.keys(concWhy[k]).map((w) => ({ why: w, n: concWhy[k][w] }))
        .sort((a, b) => b.n - a.n);
      return o;
    })(),
    conclusionPolicies: pols.filter((p) => p.group === "T").map((p) => p.id),
    pendingPolicies: pendingPolicies,
    demoState: _pgDeclText("demoState").replace("{전체}", String(pols.length)).replace("{미제출}", String(pendingPolicies)),
    naPolicies: naPolicyIds, unverified: unverifiedIds, notYet: notYetIds, grace: graceIds, locked: lockedIds,
    absentFields: _pgAbsentFields(),
    enforce: enf,
    clamp: { level: level, drop: drop, n: drop.length },
    policyVer: (typeof PG_POLICY_VER !== "undefined") ? PG_POLICY_VER : null,
    policyHash: (typeof PG_POLICY_HASH !== "undefined") ? PG_POLICY_HASH : null,
    selfInputNote: _pgDeclText("selfInputAbsent"),
  };
  _pgRollupVCache[key] = out;
  return out;
}

/* 준수율 — 분모 규약은 선언 테이블이 소유한다(PG_DENOM.compliance).
   미제출 · 판정 보류를 분모에서 빼는 **동시에 별 칸으로 세어 같은 지면에 적는다** —
   조용히 빼면 미제출이 많을수록 준수율이 올라가는 역전이 생긴다. */
function _pgComply(cnt) {
  const na = cnt.NOT_APPLICABLE || 0, pending = cnt.INDETERMINATE || 0;
  const num = cnt.PERMIT || 0;
  const den = (cnt.PERMIT || 0) + (cnt.DENY || 0);
  return { num: num, den: den, rate: _pgRate(num, den), pending: pending, na: na,
    denomRule: (typeof PG_DENOM !== "undefined") ? PG_DENOM.compliance.denom : null };
}
/* 미제출 필드 목록 — 선언 테이블에서 파생한다. 화면이 목록을 만들지 않는다. */
function _pgAbsentFields() {
  const M = (typeof PG_SOURCE_MAP !== "undefined") ? PG_SOURCE_MAP : [];
  return M.filter((f) => f.grade === "ABSENT").map((f) => ({ k: f.obj + "." + f.k, ko: f.ko, usable: !!f.usable }));
}
/* 집행 · 차단 — 숫자를 여기서 만들지 않는다. 전용 로그 통계를 그대로 읽는다.
   공용 링버퍼에서 읽으면 밀려 나간 기록 때문에 숫자가 줄어든다. */
function _pgEnforceStats() {
  const out = { blocked: null, noDefense: null, exempt: null, available: false, noBlock: _pgDeclText("noBlock") };
  try {
    if (typeof pgBlockStats === "function") { const b = pgBlockStats(); out.blocked = b.total; out.byPep = b.byPep; out.byCause = b.byCause; out.exempt = b.exempted; out.available = true; }
    if (typeof pgActionStats === "function") { const a = pgActionStats(); out.noDefense = a.noDefense; out.actions = a.total; }
  } catch (e) { out.available = false; }
  return out;
}

/* ══ 반출 규약 지면 — 머리말 조립 경로를 **읽기만** 한다. 반출 자체는 사람이 눌러야 일어난다 ══
   ⚠ 렌더 중에 반출 집행을 부르지 않는다 — 집행은 차단 로그에 쓰므로, 렌더가 부르면 지면을 여는
     것만으로 로그가 불어나고 「차단 건수」가 거짓이 된다. */
function pgExportSpec(meta, kind) {
  const head = (typeof pgExportHead === "function") ? pgExportHead(meta || {}, kind || "tsv") : null;
  return { head: head, cols: (typeof PG_EXPORT_COLS !== "undefined") ? PG_EXPORT_COLS : [],
    required: (typeof pgExportNoticeRequired === "function") ? pgExportNoticeRequired() : true,
    nameMode: (typeof PG_NAME_MODE !== "undefined") ? PG_NAME_MODE : "real",
    cls: (typeof PG_EXPORT_CLASS !== "undefined") ? PG_EXPORT_CLASS : "pgex",
    at: (typeof PG_EXPORT_NOTICE_AT !== "undefined") ? PG_EXPORT_NOTICE_AT : [],
    owner: _pgDeclText("exportOwner") };
}

/* ══ 반출 행 목록 — **어느 칸이 나가는가**만 고른다 (P7 · §10-6 · §4-6-5 ⓓ) ══
   열 구성은 반출 조립 함수가, 표시명은 표시 함수가, 머리말은 머리말 조립 함수가 소유한다.
   ⚠ 이 함수는 판정을 **다시 내리지 않는다** — 판정 집계가 돌려준 칸을 그대로 넘긴다. 다시
     내리면 같은 칸이 보고서와 반출물에서 두 번 판정되고, 한쪽만 고쳐지는 순간 두 산출물이
     다른 말을 한다(P5b 가 pgCellTrace 를 pgTrace 의 껍데기로 바꾼 것과 같은 사유). */
function pgExportPlan(V) {
  const out = { rows: [], meta: null, n: 0, scope: "", available: false, cols: [] };
  if (!V || typeof pgExportRow !== "function") return out;
  const byId = {};
  for (const r of pgPartnerRecs()) byId[r.partnerId] = r;
  /* ★ ⓠ당사 조항은 **한 행만** 나간다(2026-10-26). 행 생성이 협력업체 루프 안에 있던 동안 같은
     당사 조항이 108번 복제돼 「조항 1건 = 108행」이 됐다 — 지면이 「조항 1건으로 센다」고 적은 것과
     반출물이 다른 말을 했다. 축 값은 pgExportRow 가 조항 레지스트리에서 읽는다. */
  const selfSeen = {};
  for (const ln of V.byPartner) {
    const rec = byId[ln.partnerId];
    if (!rec) continue;
    for (const id of Object.keys(ln.cells)) {
      const sl = ln.cells[id];
      if (sl.sub === "당사") { if (selfSeen[id]) continue; selfSeen[id] = 1; }
      out.rows.push(pgExportRow(rec, { policyId: id, decision: sl.d, cause: sl.c || "",
        level: sl.lv || "", stage: V.stage, subject: sl.sub || null }));
    }
  }
  out.selfRows = Object.keys(selfSeen).length;
  out.n = out.rows.length;
  out.cols = (typeof PG_EXPORT_COLS !== "undefined") ? PG_EXPORT_COLS : [];
  out.scope = _pgDeclText("exportScope").replace("{유형}", String(V.type)).replace("{칸}", String(out.n));
  out.meta = { at: V.asOf, level: V.level, scope: out.scope, policyVer: V.policyVer, tableHash: V.policyHash };
  out.available = out.n > 0;
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ⑤ 추적 5레인 — 판정 하나를 펼친다 (P5b · 지시서 §11-2 · §13-8 산출물 ②)
   ══════════════════════════════════════════════════════════════════════════════
   이 함수가 지키는 네 줄(PG_TRACE_RULE 이 그 선언이고, 여기가 구현이다)
     1. **반환 필드만 싣는다.** 레인의 모든 칸은 pgDecide 반환 필드이거나 축 테이블의 한글 라벨이다.
        여기서 문장을 조립하면 화면이 「판정기가 쓴 사유」 자리에 **자기가 쓴 사유**를 넣는다.
     2. **안 쓰인 입력을 센다.** inputRefs 는 쓴 것과 안 쓴 것을 **한 배열**로 돌려주므로, 이 함수는
        가르기만 하고 버리지 않는다. 숨기면 있는 줄 모른다.
     3. **원장을 바꾸지 않는다.** 판정은 순수 호출이고 레코드는 읽기 전용으로만 쓴다.
     4. **같은 입력이면 같은 산출.** 캐시를 두지 않는다 — 캐시를 두면 「두 번 불러 같은지」를 비교할 때
        같은 객체를 두 번 보게 되어 결정론 단언이 공짜로 통과한다(분모가 사라진다).
   ⚠ 레인 1에 상호 원 필드가 올라가지 않는다. 판정기가 이미 legalName · vendorName 을 값 칸에서
     비우고(_inputRefs 의 isName), 이 함수는 표시명을 pgDisplayName 한 함수에서만 받는다. */

/* 레인 번호 → 선언 행. 레인의 표제 · 보여줄 것 · 규약은 **선언 테이블이 소유**한다. */
function _pgLane(n) {
  const L = (typeof PG_TRACE_LANES !== "undefined") ? PG_TRACE_LANES : [];
  for (const l of L) if (l.n === n) return l;
  return { n: n, ko: "", from: "", shows: "", rule: "" };
}
/* 조항 하나가 영향을 주는 협력업체 — 양방향 링크의 한쪽 끝이다(§11-4).
   화면이 세지 않는다: 판정 집계가 돌려준 칸 색인을 가른다. */
function pgPolicyAffected(policyId, V) {
  const out = { policyId: policyId, n: 0, judged: 0, rows: [] };
  if (!V) return out;
  for (const ln of V.byPartner) {
    const sl = ln.cells[policyId];
    if (!sl) continue;
    out.n += 1;
    if (sl.d === "PERMIT" || sl.d === "DENY") out.judged += 1;
    out.rows.push({ partnerId: ln.partnerId, dispName: ln.dispName, code: ln.code, kind: ln.kind,
      d: sl.d, c: sl.c, lv: sl.lv });
  }
  return out;
}
/* 집행 차단 — **전용 로그에서 읽는다.** 숫자를 여기서 만들지 않는다(공용 링버퍼는 밀려 나간다). */
function _pgBlockedFor(policyId, pep) {
  const out = { available: false, policy: null, pep: null, total: null, exempt: null };
  try {
    if (typeof pgBlockStats !== "function") return out;
    const b = pgBlockStats();
    out.available = true; out.total = b.total;
    out.policy = b.byPolicy[policyId] || 0;
    out.pep = pep ? (b.byPep[pep] || 0) : null;
    out.exempt = b.exemptByPolicy[policyId] || 0;
  } catch (e) { out.available = false; }
  return out;
}
/* 소명 없이 집행된 건수 · 집행 레코드 4필드 — 집행 쪽 통계를 그대로 읽는다. */
function _pgActionFor() {
  const out = { available: false, total: null, noDefense: null,
    fields: (typeof PG_ACTION_FIELDS !== "undefined") ? PG_ACTION_FIELDS : [] };
  try {
    if (typeof pgActionStats !== "function") return out;
    const a = pgActionStats();
    out.available = true; out.total = a.total; out.noDefense = a.noDefense; out.byStatus = a.byStatus;
  } catch (e) { out.available = false; }
  return out;
}

function pgTrace(partnerId, policyId, level, opt) {
  const pr = pgPartnerRec(partnerId);
  if (!pr || typeof pgDecide !== "function") return null;
  const o = opt || {};
  const lv = level || "L1";
  const drop = _pgDrop(lv);
  const asOf = o.asOf || _pgDeclAsOf();
  const stage = o.stage || pr.stage;
  const kind = o.kind || pr.kind;
  const pol = (typeof pgPolicy === "function") ? pgPolicy(policyId) : null;
  const d = pgDecide(policyId, pr, { asOf: asOf, kind: kind, stage: stage });
  const r = _pgClampDecision(d, lv, drop);
  const refs = r.inputRefs || [];
  const used = refs.filter((x) => x.used), unused = refs.filter((x) => !x.used);
  const rr = r.ruleRef || {};
  const lawRows = (rr.law || []).map((lr) => ({ label: lr.label, name: lr.name, basis: lr.basis,
    article: lr.article, lawVersion: lr.lawVersion, verified: lr.verified,
    effectiveDate: lr.effectiveDate, source: lr.source }));
  const en = r.enforce || null;
  const blocked = _pgBlockedFor(policyId, en ? en.pep : null);
  const act = _pgActionFor();

  /* 레인 payload — 각 칸이 반환 필드다. 문장을 만들지 않고 선언 문안만 덧붙인다. */
  const lanes = [
    Object.assign({}, _pgLane(1), { pay: {
      id: { partnerId: (typeof pgCode === "function") ? pgCode(pr) : pr.partnerId,
        dispName: (typeof pgDisplayName === "function") ? pgDisplayName(pgFieldClamp(pr, lv)) : "" },
      used: used, unused: unused,
      counts: { all: refs.length, used: used.length, unused: unused.length,
        absent: refs.filter((x) => x.grade === "ABSENT").length,
        clamped: refs.filter((x) => x.clamped).length },
      note: _pgDeclText("traceUnused"), nameNote: _pgDeclText("traceName"),
    } }),
    Object.assign({}, _pgLane(2), { pay: {
      rule: { policyId: rr.policyId, ruleId: rr.ruleId, title: rr.title, group: rr.group,
        subject: rr.subject, lifecycle: rr.lifecycle, severity: rr.severity, cycle: rr.cycle,
        obligation: rr.obligation, locked: rr.locked, effectiveDate: rr.effectiveDate,
        verified: rr.verified, appliesToSelf: rr.appliesToSelf,
        appliesTo: (pol && pol.appliesTo) || [], contractBasis: (pol && pol.contractBasis) || null },
      laws: lawRows, sanction: rr.sanction || null, grace: rr.enforcementGrace || null,
      gated: rr.verified === "원문확인",
      holdNote: rr.verified === "원문확인" ? "" : _pgDeclText("unverified"),
      floor: (typeof PG_FLOOR !== "undefined") ? PG_FLOOR : [],
    } }),
    Object.assign({}, _pgLane(3), { pay: {
      decision: r.decision, decisionKo: _pgDecKo2(r.decision), cause: r.cause, causeKo: _pgCauseKo2(r.cause),
      reasons: r.reasons || [], axis: r.axis || null,
      ruleOutcome: r.ruleOutcome || null,
      /* ★ 문장이 아니라 **플래그**다(2026-10-26). 문안은 선언 테이블이 소유한다 — 지면 리터럴로 두면
         「추적 지면의 모든 칸은 판정기 반환 필드다」라는 고지 바로 위에 지면이 쓴 문장이 찍힌다. */
      outcomeDrift: !!(r.ruleOutcome && r.ruleOutcome.decision !== r.decision),
      outcomeNote: _pgDeclText("traceOutcomeDrift"),
      owner: _pgDeclText("traceOwner"),
    } }),
    Object.assign({}, _pgLane(4), { pay: {
      enforce: en, blocked: blocked, action: act,
      stageEffect: en ? en.render : null,
      noBlock: _pgDeclText("noBlock"),
      exemption: en ? en.exemption : null,
      sanction: rr.sanction || null, grace: rr.enforcementGrace || null,
      sites: (typeof PG_PEP_SITES !== "undefined") ? PG_PEP_SITES.filter((s) => !en || s.pep === en.pep) : [],
    } }),
    Object.assign({}, _pgLane(5), { pay: {
      remedy: r.remedy || [], evidence: r.evidence || [],
      obligation: rr.obligation, locked: rr.locked,
      whatIf: r.whatIf || null,
      absentInputs: unused.filter((x) => x.grade === "ABSENT").map((x) => ({ field: x.field, use: x.use })),
      ledgerNote: _pgDeclText("whatIfLedger"),
    } }),
  ];
  /* ★ ⓠ당사 조항의 추적은 **당사 이름으로** 열린다(2026-10-26).
     수범자가 우리인 조문의 판정을 실명 법인 이름 옆에 두면 그 칸이 「그 법인의 결함」으로 읽힌다 —
     반증은 레인 2의 「판정 대상 ⓠ당사」 한 줄이고, 그 줄은 캐피첐에서 사라진다.
     그래서 머리와 레인 1의 사람이 읽는 칸을 조항 레지스트리의 `subject` 에서 결정한다.
     실제 레코드 식별자는 `partnerId` 에 그대로 남아 역추적이 깊어지지 않는다. */
  const _selfAxis = rr.subject === "당사";
  const _dispRaw = (typeof pgDisplayName === "function") ? pgDisplayName(pgFieldClamp(pr, lv)) : "";
  const _dispShown = _selfAxis ? "당사" : _dispRaw;
  lanes[0].pay.id.dispName = _dispShown;
  lanes[0].pay.id.selfAxis = _selfAxis;
  return { partnerId: partnerId, policyId: policyId, level: lv, asOf: asOf, stage: stage, kind: kind,
    dispName: _dispShown, selfAxis: _selfAxis,
    code: (typeof pgCode === "function") ? pgCode(pr) : partnerId,
    r: r, lanes: lanes,
    rule: (typeof PG_TRACE_RULE !== "undefined") ? PG_TRACE_RULE : [],
    determinism: _pgDeclText("determinism"),
    clamp: { level: lv, drop: drop, n: drop.length, cut: (r._clamp && r._clamp.cut) || 0 } };
}
/* 축 한글 라벨 — 렌더 구간의 같은 함수를 계산 레이어에서 쓸 수 없으므로(파일 뒤쪽에 있다) 여기 둔다.
   값의 원천은 용어 원천의 축 테이블 하나다 — 라벨을 이 파일에 적지 않는다. */
function _pgAxisKo(axis, k) {
  const A = (typeof PG_AXES !== "undefined") ? (PG_AXES[axis] || []) : [];
  for (const row of A) if (row[0] === k) return row[1];
  return k || "";
}
function _pgDecKo2(d) { return _pgAxisKo("decision", d) || "—"; }
function _pgCauseKo2(c) { return c ? _pgAxisKo("cause", c) : ""; }

/* ══════════════════════════════════════════════════════════════════════════════
   ⑥ What-if — 「무엇을 고치면 등급이 올라가는가」 (P5b · 지시서 §11-2 레인 5 · §13-8 산출물 ③)
   ══════════════════════════════════════════════════════════════════════════════
   ★ **값을 합성하지 않는다.** 가정은 PG_WHATIF_AXES 세 축뿐이다 —
       ⓐ 증거 전건 제출 : 판정기가 **자기 가정 레코드로 스스로 재호출**한 결과(r.whatIf)를 그대로 싣는다.
       ⓑ 온보딩 단계    : 같은 레코드 · 같은 조항으로 ctx.stage 만 바꿔 **같은 판정기를 다시 부른다**.
       ⓒ 협력업체 유형  : 같은 방식으로 ctx.kind 만 바꾼다.
     제출값을 화면 쪽에서 하나씩 지어내는 축은 **두지 않는다**(PG_WHATIF_FORBID). 그것이 「별도 추정
     로직 금지」의 실체다 — 판정기 안에 이미 가정 규칙이 있고, 밖에서 또 만들면 같은 조항이 두 가정으로
     재판정된다. 개별 축의 답은 가정이 아니라 **쓰이지 않은 입력 목록과 시정 과제**가 돌려준다.
   ★ **원장을 바꾸지 않는다.** 가정 전후로 지문을 떠서 같음을 반환 필드로 싣는다. 지문에 드는 것:
     정책 테이블 해시(조항 · 법령 · 집행 · 임계 + 면제 지문) · 면제 건수 · 집행 로그 건수 ·
     시정 과제 건수 · 감사 로그 건수 · 레코드 전문 · 롤업 셀 수와 총액. 하나라도 움직이면 실패다. */
/* 지문 한 칸 — 레코드 전문을 **해시로 접는다.**
   ⚠ 실측으로 잡은 사고다: 처음에는 `JSON.stringify(rec)` 를 그대로 지문에 담았는데, 그 문자열에
     상호 · 여신 한도 · 공급가가 전부 들어 있어 **L2 · L3 뷰의 반환값에 상호가 살아남았다**(클램프
     네 경로를 지나는 반환값에 클램프 밖 사본을 끼워 넣은 것과 같다). 해시는 같은 입력에 같은 값을
     돌려주므로 「바뀌었는가」를 그대로 증명하면서 식별자를 들고 다니지 않는다. */
function _pgFold(s) {
  let h = 0x811c9dc5;
  const t = String(s === undefined || s === null ? "" : s);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return ("00000000" + h.toString(16)).slice(-8);
}
function _pgLedgerFp(rec) {
  /* ★ 저장 집행 테이블 · 저장 면제 지문을 축으로 **더했다**(2026-10-26).
     왜: 종전 8축에는 `PG_ENFORCE_KEY`(저장 집행 수준)가 없었고 `pgPolicyHash()` 는 **정적**
     `PG_ENFORCE` 만 해싱했다. 실측으로 `pgEnforceStore({"L-04":{"pep.settle":"hard"}})` 를 주입하니
     저장소 직렬화 길이가 2 → 30 으로 움직였는데 `ledger.same` 은 **true** 로 남고 지면은 그대로
     「원장 불변 — 가정 재판정 전후 지문이 같습니다」를 적었다. 저장값은 다음 적재에서 효력을 갖는다.
     하필 이 축이 「집행 수준 상향 가정 — 화면이 가정으로 올리면 ratchet 을 지면에서 우회하는 셈」이라고
     금지 목록이 지목한 그 축이다. 지금 코드가 그 저장소를 건드리지는 않으므로 실해가 아니라
     **증명 공백**이었다 — 공백을 메운다. 축 목록은 지면에 그대로 열거된다. */
  const fp = { policyHash: null, exemptN: null, exemptStoreFp: null, enforceStoreFp: null,
    logN: null, remedyN: null, auditN: null, recHash: null, rollRows: null, rollSales: null };
  try { if (typeof pgPolicyHash === "function") fp.policyHash = pgPolicyHash(); } catch (e) {}
  try { if (typeof PG_EXEMPT !== "undefined") fp.exemptN = PG_EXEMPT.length; } catch (e) {}
  try { if (typeof pgExemptStored === "function") fp.exemptStoreFp = _pgFold(JSON.stringify(pgExemptStored())); } catch (e) {}
  try { if (typeof pgEnforceStored === "function") fp.enforceStoreFp = _pgFold(JSON.stringify(pgEnforceStored())); } catch (e) {}
  try { if (typeof pgLogAll === "function") fp.logN = pgLogAll().length; } catch (e) {}
  try { if (typeof pgRemedyStored === "function") fp.remedyN = pgRemedyStored().length; } catch (e) {}
  try { if (typeof pgAuditAll === "function") fp.auditN = pgAuditAll().length; } catch (e) {}
  try { fp.recHash = _pgFold(JSON.stringify(rec || null)); } catch (e) { fp.recHash = "unserializable"; }
  try { const R = pgRollup(); if (R) { fp.rollRows = R.period.length; fp.rollSales = R.total.sales; } } catch (e) {}
  return fp;
}
function pgWhatIf(partnerId, policyId, level, opt) {
  const pr = pgPartnerRec(partnerId);
  if (!pr || typeof pgDecide !== "function") return null;
  const o = opt || {};
  const lv = level || "L1";
  const drop = _pgDrop(lv);
  const asOf = o.asOf || _pgDeclAsOf();
  const stage0 = o.stage || pr.stage, kind0 = o.kind || pr.kind;
  const before = _pgLedgerFp(pr);

  const base = _pgClampDecision(pgDecide(policyId, pr, { asOf: asOf, kind: kind0, stage: stage0 }), lv, drop);
  const axes = (typeof PG_WHATIF_AXES !== "undefined") ? PG_WHATIF_AXES : [];
  const stages = (typeof PG_AXES !== "undefined") ? PG_AXES.stage.map((s) => s[0]) : [];
  const kinds = (typeof PG_KINDS !== "undefined") ? PG_KINDS.map((k) => k.k) : [];
  const out = { partnerId: partnerId, policyId: policyId, level: lv, asOf: asOf,
    base: { decision: base.decision, decisionKo: _pgDecKo2(base.decision), cause: base.cause,
      causeKo: _pgCauseKo2(base.cause), level: base.enforce ? base.enforce.level : null,
      block: base.enforce ? base.enforce.block : null },
    axes: [], forbid: (typeof PG_WHATIF_FORBID !== "undefined") ? PG_WHATIF_FORBID : [],
    note: _pgDeclText("whatIfLedger"), forbidNote: _pgDeclText("whatIfForbid") };

  for (const ax of axes) {
    const row = { k: ax.k, ko: ax.ko, from: ax.from, how: ax.how, when: ax.when, answers: ax.answers, rows: [], available: true, hint: "" };
    if (ax.k === "evidence") {
      /* 판정기 자신이 만든 가정 — 우리가 레코드를 손대지 않는다 */
      if (!base.whatIf) { row.available = false; row.hint = _pgDeclText("whatIfNoAssume"); }
      else row.rows.push({ label: base.whatIf.assumed, decision: base.whatIf.decision,
        decisionKo: _pgDecKo2(base.whatIf.decision), cause: base.whatIf.cause,
        causeKo: _pgCauseKo2(base.whatIf.cause), reasons: base.whatIf.reasons || [],
        up: base.whatIf.decision === "PERMIT" && base.decision !== "PERMIT", now: true });
    } else if (ax.k === "stage") {
      for (const st of stages) {
        const d = _pgClampDecision(pgDecide(policyId, pr, { asOf: asOf, kind: kind0, stage: st, _noWhatIf: true }), lv, drop);
        row.rows.push({ label: st, decision: d.decision, decisionKo: _pgDecKo2(d.decision),
          cause: d.cause, causeKo: _pgCauseKo2(d.cause), reasons: d.reasons || [],
          level: d.enforce ? d.enforce.level : null, block: d.enforce ? d.enforce.block : null,
          render: d.enforce ? d.enforce.render : null, floors: (d.enforce && d.enforce.floors) || [],
          up: d.decision === "PERMIT" && base.decision !== "PERMIT", now: st === stage0 });
      }
    } else if (ax.k === "kind") {
      for (const kd of kinds) {
        const d = _pgClampDecision(pgDecide(policyId, pr, { asOf: asOf, kind: kd, stage: stage0, _noWhatIf: true }), lv, drop);
        row.rows.push({ label: kd, decision: d.decision, decisionKo: _pgDecKo2(d.decision),
          cause: d.cause, causeKo: _pgCauseKo2(d.cause), reasons: d.reasons || [],
          verified: d.ruleRef ? d.ruleRef.verified : null,
          up: d.decision === "PERMIT" && base.decision !== "PERMIT", now: kd === kind0 });
      }
    }
    out.axes.push(row);
  }
  const after = _pgLedgerFp(pr);
  out.ledger = { before: before, after: after,
    same: JSON.stringify(before) === JSON.stringify(after),
    keys: Object.keys(before) };
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ⑦ 정책 · 판정 엔진 지면 7블록 (P5b · 지시서 §13-8 산출물 ① · §10-1 서브탭 ⑤)
   ══════════════════════════════════════════════════════════════════════════════
   화면은 이 반환값을 렌더만 한다. 블록마다 수치의 원천 경로가 PG_ENGINE_METRICS[].from 에 적혀 있다. */
var _pgEngCache = {};
function pgEngineRollReset() { _pgEngCache = {}; return true; }

/* 만료까지 남은 개월 수 — 문자열 앞 7자 비교다(벽시계 0건 · 날짜 객체를 거치지 않는다). */
function _pgMonthsLeft(toISO, asOf) {
  if (!toISO) return null;
  const a = String(asOf).slice(0, 7).split("-"), b = String(toISO).slice(0, 7).split("-");
  return (Number(b[0]) * 12 + Number(b[1])) - (Number(a[0]) * 12 + Number(a[1]));
}
function _pgEngRule() {
  const R = (typeof PG_ENGINE_RULE !== "undefined") ? PG_ENGINE_RULE : null;
  return R || { warnMonths: 1, gridCols: 3, logPage: 20 };
}

function pgEngineRoll(opt) {
  const o = opt || {};
  const level = o.level || "L1";
  const asOf = o.asOf || _pgDeclAsOf();
  const stage = o.stage || "거래중";
  const key = [level, asOf, stage].join("|");
  if (_pgEngCache[key]) return _pgEngCache[key];
  const pols = (typeof PG_POLICIES !== "undefined") ? PG_POLICIES : [];
  const laws = (typeof PG_LAWS !== "undefined") ? PG_LAWS : {};
  const peps = (typeof PG_PEPS !== "undefined") ? PG_PEPS : [];
  const policyPeps = peps.filter((p) => p !== "pep.export");
  const V = pgVerdictRoll({ level: level, type: "PG-R", stage: stage, asOf: asOf });
  const rule = _pgEngRule();

  /* ── E1 정책 레지스트리 ── */
  const registry = [];
  for (const pol of pols) {
    const bp = V.byPolicy[pol.id] || null;
    const aff = pgPolicyAffected(pol.id, V);
    registry.push({ id: pol.id, title: pol.title, group: pol.group, subject: pol.subject,
      lifecycle: pol.lifecycle, severity: pol.severity, cycle: pol.cycle, obligation: pol.obligation,
      locked: !!pol.locked, dual: !!pol.dual, appliesTo: pol.appliesTo || [], ruleId: pol.ruleId,
      contractBasis: pol.contractBasis || null, lawRef: pol.lawRef,
      law: bp ? bp.law : [], verified: bp ? bp.verified : null, effectiveDate: bp ? bp.effectiveDate : null,
      grace: bp ? bp.grace : null, sanction: bp ? bp.sanction : null, enforce: bp ? bp.enforce : null,
      counts: bp ? bp.counts : null, comply: bp ? bp.comply : null,
      remedy: pol.remedy || [], evidence: pol.evidence || [], note: pol.note || "",
      affected: { n: aff.n, judged: aff.judged, rows: aff.rows } });
  }

  /* ── E2 법령 · 표준 시행일표 ── */
  const lawRows = [], verifiedMix = {};
  let articleShown = 0, articleAll = 0;
  const usedBy = {};
  for (const pol of pols) {
    const kinds = pol.appliesTo && pol.appliesTo.length ? pol.appliesTo : [null];
    for (const kd of kinds) {
      const hits = (typeof pgLawResolve === "function") ? pgLawResolve(pol.lawRef, pol.lawArticle, kd) : [];
      for (const h of hits) (usedBy[h.lawId] = usedBy[h.lawId] || []).indexOf(pol.id) < 0 && usedBy[h.lawId].push(pol.id);
    }
  }
  for (const id of Object.keys(laws)) {
    const L = laws[id];
    const vmin = (typeof pgLawVerifiedMin === "function") ? pgLawVerifiedMin(id) : (L.verified || "미확인");
    verifiedMix[vmin] = (verifiedMix[vmin] || 0) + 1;
    const arts = [];
    if (L.articles) for (const a of Object.keys(L.articles)) {
      const rn = (typeof pgLawRender === "function") ? pgLawRender(id, a) : null;
      articleAll += 1;
      if (rn && rn.article) articleShown += 1;
      arts.push({ key: a, label: rn ? rn.label : a, article: rn ? rn.article : null,
        verified: rn ? rn.verified : "미확인", effectiveDate: rn ? rn.effectiveDate : null,
        source: rn ? rn.source : null, note: L.articles[a].note || "" });
    }
    const top = (typeof pgLawRender === "function") ? pgLawRender(id, null) : null;
    /* ★ 항목 시행일 — **기준일과 대조한다**(2026-10-26). 종전에는 `L.effectiveDate` 를 그대로 찍어서
       **시행 전 법령이 시행 중인 법령과 똑같은 모양으로** 시행일표에 실렸다(실측: 노인장기요양보험법
       2026-11-27 · 기준일 2026-10-25). 시행일표의 존재 목적이 그것인데 그 자리에서 깨졌다.
       그리고 조문 데이터가 「시행일 자체는 미확인」을 선언한 경우 **법령 수준 날짜를 그 자리에 쓰지
       않는다** — 조문이 뒷받침하지 않는 값이다. 조항 축(E6)과 법령 축은 섞지 않는다. */
    const effRaw = L.effectiveDate || null;
    const artEffUnverified = Object.keys(L.articles || {}).length > 0
      && Object.keys(L.articles).every((a) => /미확인/.test(String(L.articles[a].effDateBasis || "")));
    const effFuture = !!(effRaw && effRaw > asOf);
    lawRows.push({ id: id, name: L.name, basis: L.basis, verified: vmin,
      lawVersion: top && top.lawVersion ? top.lawVersion : null,
      effectiveDate: effRaw, effFuture: effFuture, effUnverified: artEffUnverified,
      effRender: artEffUnverified ? _pgDeclText("effUnverified")
        : (effRaw ? (effFuture ? (effRaw + " · " + _pgDeclText("effPlanned")) : effRaw) : "—"),
      pendingAmend: top && top.pendingAmend ? top.pendingAmend : null,
      pendingRender: (top && top.pendingAmend) ? _pgDeclText("pendingAmend") : null,
      article: top ? top.article : null,
      sanction: L.sanction || null, grace: L.enforcementGrace || null,
      appliesToSelf: !!L.appliesToSelf, govAxis: L.govAxis || null, cite: L.cite || null,
      source: top ? top.source : null, note: L.note || "", articles: arts,
      usedBy: usedBy[id] || [] });
  }

  /* ── E3 집행 테이블 ── */
  const grid = [], capRow = (typeof PG_ENFORCE_CAP !== "undefined") ? PG_ENFORCE_CAP : {};
  for (const pol of pols) {
    const cells = {};
    for (const pep of policyPeps) {
      let lv = null;
      try { lv = (typeof pgEnforceLevel === "function") ? pgEnforceLevel(pol.id, pep, { kind: (pol.appliesTo || [])[0], stage: stage }) : null; } catch (e) { lv = null; }
      const blk = _pgBlockedFor(pol.id, pep);
      cells[pep] = { level: lv ? lv.level : null, declared: lv ? lv.declared : null,
        cap: lv ? lv.cap : null, floors: (lv && lv.floors) || [], blocked: blk.pep };
    }
    /* 수준을 내린 플로어 — **집계도 화면이 하지 않는다.** 지점별 목록을 합쳐 중복을 지운 결과를
       반환 필드로 싣는다(화면은 join 만 한다). */
    const fl = [];
    for (const pep of policyPeps) for (const f of cells[pep].floors) if (fl.indexOf(f) < 0) fl.push(f);
    grid.push({ id: pol.id, title: pol.title, subject: pol.subject, locked: !!pol.locked,
      obligation: pol.obligation, contractBasis: pol.contractBasis || null, cells: cells,
      floorNames: fl, floored: fl.length > 0 });
  }
  let exportLv = null;
  try { exportLv = (typeof pgEnforceLevel === "function") ? pgEnforceLevel(null, "pep.export", {}) : null; } catch (e) { exportLv = null; }
  const blkStats = _pgBlockedFor(null, null);
  const expect = (typeof PG_PEP_EXPECT !== "undefined") ? PG_PEP_EXPECT : [];
  const pepRows = ((typeof PG_PEP_SITES !== "undefined") ? PG_PEP_SITES : []).map((s) => {
    const ex = expect.filter((e) => e.pep === s.pep)[0] || null;
    let got = null;
    try { if (typeof pgBlockStats === "function") got = pgBlockStats().byPep[s.pep] || 0; } catch (e) { got = null; }
    return Object.assign({}, s, { expect: ex ? ex.expect : null, expectWhy: ex ? ex.why : "", got: got,
      match: ex === null ? null : (typeof ex.expect === "number" ? ex.expect === got : null) });
  });

  /* ── E4 면제 현황 ── */
  const exRows = [];
  const inMem = (typeof PG_EXEMPT !== "undefined") ? PG_EXEMPT : [];
  const stored = (typeof pgExemptStored === "function") ? pgExemptStored() : [];
  const seenEx = {};
  for (const src of [{ via: "적재(저장값)", list: stored }, { via: "세션 등록", list: inMem }])
    for (const x of src.list) {
      const k = [x.policyId, x.partnerId, x.expireAt].join("|");
      if (seenEx[k]) continue;
      seenEx[k] = 1;
      const left = _pgMonthsLeft(x.expireAt, asOf);
      const pol = (typeof pgPolicy === "function") ? pgPolicy(x.policyId) : null;
      exRows.push({ policyId: x.policyId, title: pol ? pol.title : "", partnerId: x.partnerId,
        reason: x.reason, approver: x.approver, approvedAt: x.approvedAt || null, expireAt: x.expireAt,
        monthsLeft: left, state: left === null ? "만료일 없음" : (left < 0 ? "만료 경과" : (left <= rule.warnMonths ? "만료 임박" : "유효")),
        locked: !!(pol && pol.locked), via: src.via });
    }
  const exempt = { rows: exRows, n: exRows.length,
    valid: exRows.filter((x) => x.state === "유효").length,
    soon: exRows.filter((x) => x.state === "만료 임박").length,
    expired: exRows.filter((x) => x.state === "만료 경과").length,
    pass: blkStats.available ? blkStats.exempt : null,
    warnMonths: rule.warnMonths, none: _pgDeclText("exemptNone"),
    lockedPolicies: pols.filter((p) => p.locked).map((p) => p.id) };

  /* ── E5 결정 로그 ── */
  const logRows = [];
  const raw = (typeof pgLogAll === "function") ? pgLogAll() : [];
  for (const e of raw) {
    const p = e.p || {};
    const tr = !!pgPartnerRec(p.src);
    logRows.push({ seq: e.seq, at: e.at, name: e.name, policyId: p.key, pep: p.kind, cause: p.grade,
      src: p.src, level: e.level || null, traceable: tr,
      causeKo: _pgCauseKo2(p.grade),
      kindOf: (typeof pgActorKind === "function") ? pgActorKind(p.src) : null });
  }
  const auditRows = ((typeof pgAuditAll === "function") ? pgAuditAll() : []).map((a) => ({
    actor: a.actor, actorKind: (typeof pgActorKind === "function") ? pgActorKind(a.actor) : null,
    ts: a.ts, action: a.action, target: a.target, result: a.result, risk: a.risk, via: a.via || null }));
  const actorMix = {};
  for (const r of logRows.concat(auditRows)) {
    const k = r.actorKind || r.kindOf || "미지정";
    actorMix[k] = (actorMix[k] || 0) + 1;
  }
  const log = { rows: logRows, n: logRows.length,
    blocked: logRows.filter((x) => x.name === "pg_blocked").length,
    exempted: logRows.filter((x) => x.name === "pg_exempted").length,
    audit: auditRows, auditN: auditRows.length,
    actorMix: actorMix, actorKinds: (typeof PG_ACTOR_KINDS !== "undefined") ? PG_ACTOR_KINDS : [],
    actions: (typeof PG_AUDIT_ACTIONS !== "undefined") ? PG_AUDIT_ACTIONS : [],
    map: (typeof PG_BLOCK_MAP !== "undefined") ? PG_BLOCK_MAP : [],
    page: rule.logPage, none: _pgDeclText("logNone"), untraceable: _pgDeclText("logUntraceable") };

  /* ── E6 예정 적용 조항 ── */
  const notYet = (V.notYet || []).map((id) => {
    const pol = (typeof pgPolicy === "function") ? pgPolicy(id) : null;
    const bp = V.byPolicy[id] || null;
    return { id: id, title: pol ? pol.title : "", effectiveDate: bp ? bp.effectiveDate : null,
      law: bp ? bp.law : [], verified: bp ? bp.verified : null, sanction: bp ? bp.sanction : null,
      grace: bp ? bp.grace : null, appliesTo: (pol && pol.appliesTo) || [],
      render: _pgDeclText("notYet") };
  });
  /* ★ 법령 축 — 조문 사정권이 확인되지 않은 **미도래 개정**. 조항 축(notYet)과 **같은 분모에 넣지 않는다.**
     판정에 쓰지 않고 표시만 한다. 수치는 지면이 세지 않고 이 반환 필드에서 돌려받는다(§10-4 규약 4). */
  const pendingLaws = lawRows.filter((L) => L.pendingAmend).map((L) => ({
    id: L.id, name: L.name, lawNo: L.pendingAmend.lawNo || null, effectiveDate: L.pendingAmend.effectiveDate || null,
    kind: L.pendingAmend.kind || null, verified: L.pendingAmend.verified || "미확인",
    scope: L.pendingAmend.scope || "미확인", source: L.pendingAmend.source || null,
    render: _pgDeclText("pendingAmend") }));
  const futureLaws = lawRows.filter((L) => L.effFuture).map((L) => ({
    id: L.id, name: L.name, effectiveDate: L.effectiveDate, render: _pgDeclText("effPlanned") }));
  const unverified = (V.unverified || []).map((id) => {
    const pol = (typeof pgPolicy === "function") ? pgPolicy(id) : null;
    const bp = V.byPolicy[id] || null;
    return { id: id, title: pol ? pol.title : "", verified: bp ? bp.verified : null,
      law: bp ? bp.law : [], render: _pgDeclText("unverified") };
  });

  /* ── E7 방법론 — 선언 테이블을 **읽기만** 한다 ── */
  const method = {
    numRule: (typeof PG_NUM_RULE !== "undefined") ? PG_NUM_RULE : [],
    denom: (typeof PG_DENOM !== "undefined") ? PG_DENOM : null,
    src: (typeof PG_SRC !== "undefined") ? PG_SRC : [],
    floor: (typeof PG_FLOOR !== "undefined") ? PG_FLOOR : [],
    stageEffect: (typeof PG_STAGE_EFFECT !== "undefined") ? PG_STAGE_EFFECT : [],
    clamp: (typeof PG_CLAMP !== "undefined") ? PG_CLAMP : null,
    view: (typeof PG_VIEW !== "undefined") ? PG_VIEW : [],
    traceRule: (typeof PG_TRACE_RULE !== "undefined") ? PG_TRACE_RULE : [],
    lanes: (typeof PG_TRACE_LANES !== "undefined") ? PG_TRACE_LANES : [],
    whatIf: (typeof PG_WHATIF_AXES !== "undefined") ? PG_WHATIF_AXES : [],
    whatIfForbid: (typeof PG_WHATIF_FORBID !== "undefined") ? PG_WHATIF_FORBID : [],
    selfEnforce: (typeof PG_SELF_ENFORCE !== "undefined") ? PG_SELF_ENFORCE : [],
    basis: (typeof PG_LAW_BASIS !== "undefined") ? PG_LAW_BASIS : [],
    determinism: _pgDeclText("determinism"),
    audit: (typeof pgEngineAudit === "function") ? pgEngineAudit() : [],
    reportAudit: (typeof pgReportAudit === "function") ? pgReportAudit() : [],
    metricAudit: (typeof pgMetricAudit === "function") ? pgMetricAudit() : [],
  };
  /* 방법론 항목 수 — 화면이 더하지 않는다(§10-4 규약 4). 선언 테이블의 길이 합이다. */
  method.ruleN = method.numRule.length + method.src.length + method.floor.length
    + method.stageEffect.length + method.traceRule.length + method.whatIf.length + method.whatIfForbid.length;

  const out = { level: level, asOf: asOf, stage: stage,
    blocks: (typeof PG_ENGINE_BLOCKS !== "undefined") ? PG_ENGINE_BLOCKS : [],
    policyVer: V.policyVer, policyHash: V.policyHash,
    counts: { policies: pols.length, laws: lawRows.length, articleAll: articleAll, articleShown: articleShown,
      peps: peps.length, exempt: exRows.length, log: logRows.length, notYet: notYet.length,
      pendingLaws: pendingLaws.length, futureLaws: futureLaws.length,
      unverified: unverified.length, locked: (V.locked || []).length, grace: (V.grace || []).length },
    registry: registry, laws: lawRows, verifiedMix: verifiedMix,
    grid: grid, pepRows: pepRows, cap: capRow, exportLevel: exportLv, blockStats: blkStats,
    exempt: exempt, log: log, notYet: notYet, pendingLaws: pendingLaws, futureLaws: futureLaws,
    notYetSplit: _pgDeclText("notYetSplit").replace("{조항}", String(notYet.length)).replace("{법령}", String(pendingLaws.length)),
    unverified: unverified, method: method,
    flooredN: grid.filter((g) => g.floored).length,
    owner: _pgDeclText("engineOwner"), link: _pgDeclText("engineLink") };
  _pgEngCache[key] = out;
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ⑦-b ①개요 · 객체 서브탭 머리의 체계 소개 — 정의 · 목적 · 성과 (대표 지시 2026-10-26)
   ══════════════════════════════════════════════════════════════════════════════
   문안은 선언 테이블(PG_INTRO)이 소유하고, **수치는 전부 반환 필드**다. 왜 지면이 아니라 여기인가:
   소개 문단이 사는 지면(SupplyOntology)이 숫자를 만들면 그 숫자를 어느 함수도 소유하지 않는다 —
   「화면 자체 계산 0건」이 문단 하나로 뚫린다(PG_NUM_RULE · §10-4 규약 4).
   ⚠ 이 레이어에 리터럴 수치를 적지 않는다. 지금 코드로 재현되지 않는 과거 값만 PG_INTRO_BEFORE
     선언에서 오고, 그 선언은 **측정일과 출처를 값과 같은 자리에** 들고 있다.
   ⚠ 원천마다 try 를 따로 둔다 — 한 원천이 비면 그 슬롯만 「—」가 되고 문단 셋이 함께 죽지 않는다. */
function pgIntroFacts() {
  const F = {};
  /* ⓐ 거래처 축 · 정산 행 — 기간축 롤업과 거래 사실 레이어의 반환 필드 */
  try {
    const R = pgRollup();
    const D = (typeof supplyData === "function") ? supplyData() : null;
    if (R && D) {
      F["거래처"] = R.meta.vendorN;
      F["협력업체"] = R.meta.partnerN;
      F["정산행"] = D.counts.settlement;
      F["미포착"] = R.meta.uncaught.sales;
      F["미포착매입"] = R.meta.uncaught.supplyCost;
      F["중복"] = R.meta.dupDeclared;
      /* 교차 항등식 — 주문 축 합과 정산 축 합의 차. 롤업이 봉인한 반환 필드를 그대로 읽는다.
         행 항등식은 생성기 구조상 실패할 수 없으므로(plug 가 marginNet 한 곳) 이 축을 머리에 둔다. */
      if (R.meta.cross) { F["교차차액"] = R.meta.cross.diff; F["주문합"] = R.meta.cross.ordGmv; }
      /* 행 항등식 — 롤업이 **봉인한 반환 필드**(rowIdentity)를 센다. 지면이 다시 더하지 않게
         여기서 한 번 센다. 단언의 소유자는 run_pg_scan 인수 1 이고 이 값은 그 결과의 지면 표시다. */
      let broken = 0;
      for (const row of R.period) if (!row.rowIdentity) broken += 1;
      F["위반"] = broken;
    }
  } catch (e) { /* 채우지 못한 슬롯은 「—」로 남는다 */ }
  /* ⓑ 조항 수 · 판정 칸 — 판정 집계의 반환 필드다. 지면이 조항 수와 모집단을 곱하지 않는다. */
  try {
    const V = pgVerdictRoll();
    if (V) {
      F["조항"] = V.policyN;
      F["판정칸"] = V.cellN;
      F["판정모집단"] = V.partnerN;
      if (V.selfAxis) F["당사조항"] = V.selfAxis.policyN;
      /* ★ 격자 칸은 cellN 이 아니다 — cellN 은 당사 축 조항을 레코드마다 복제한 칸을 포함한다.
         ④B4 가 실제로 세우는 분모는 gridCellN 이고, 그 값을 지면이 아니라 판정 집계가 소유한다. */
      F["격자칸"] = V.gridCellN;
      F["협력업체축조항"] = V.partnerPolicyN;
      /* 보류 · 해당 없음 — **협력업체 축만** 센 값이다(complyPartner). 성과 문단이 칸 수만 적고
         보류 비중을 숨기면 「판정이 섰다」로 읽힌다 — 같은 문장 안에서 함께 적는다. */
      if (V.complyPartner) { F["보류"] = V.complyPartner.pending; F["해당없음"] = V.complyPartner.na; }
      F["미확인"] = (V.unverified || []).length;
      F["시행전"] = (V.notYet || []).length;
    }
  } catch (e) { /* 같음 */ }
  /* ⓒ 추적 레인 — 선언 테이블의 길이다(지면이 레인을 하드코딩하지 않는 것과 같은 원천) */
  try { if (typeof PG_TRACE_LANES !== "undefined") F["레인"] = PG_TRACE_LANES.length; } catch (e) {}
  /* ⓓ 선언 자기감사 — 축 수와 위반 수를 **축 목록에서** 센다(셋을 손으로 더하지 않는다) */
  try {
    const ax = [];
    if (typeof pgMetricAudit === "function") ax.push({ ko: "지표", n: pgMetricAudit().length });
    if (typeof pgReportAudit === "function") ax.push({ ko: "지면", n: pgReportAudit().length });
    if (typeof pgEngineAudit === "function") ax.push({ ko: "엔진", n: pgEngineAudit().length });
    let bad = 0;
    for (const a of ax) bad += a.n;
    F["감사축"] = ax.length; F["감사위반"] = bad; F._audits = ax;
  } catch (e) {}
  /* ⓔ 개선 전 — 반환 필드가 될 수 없는 과거 값. 측정일 · 출처와 함께 선언에서만 온다. */
  try {
    const B = (typeof PG_INTRO_BEFORE !== "undefined") ? PG_INTRO_BEFORE : null;
    if (B) { F["종전행"] = B.rows; F["종전배수"] = B.ratio; F["종전측정일"] = B.at; F._before = B; }
  } catch (e) {}
  return F;
}

/* 소개 3문단 조립 — 선언 문안의 슬롯을 반환 필드로 채운다. 채우지 못한 슬롯은 「—」로 남고
   filled=false 가 되므로 숫자가 조용히 사라지지 않는다(지면이 그 사실을 함께 렌더한다).
   chars 는 렌더되는 글자 수다 — 「200자 내외」를 사람이 눈으로 세지 않게 함께 돌려준다. */
function _pgIntroFill(T, F) {
  const fmt = function (v) {
    if (v === null || v === undefined) return "—";
    return (typeof v === "number") ? Number(v).toLocaleString() : String(v);
  };
  return (T || []).map(function (row) {
    let s = String(row.text || "");
    for (const k of Object.keys(F)) {
      if (k.charAt(0) === "_") continue;
      s = s.split("{" + k + "}").join(fmt(F[k]));
    }
    const miss = s.match(/\{[^}]+\}/g) || [];
    for (const m of miss) s = s.split(m).join("—");
    return { k: row.k, ko: row.ko, en: row.en, text: s, chars: s.length,
      filled: miss.length === 0, missing: miss, before: F._before || null };
  });
}
function pgIntro() {
  return _pgIntroFill((typeof PG_INTRO !== "undefined") ? PG_INTRO : [], pgIntroFacts());
}
/* 소개 3문단의 **단서** 줄. 문단과 한 묶음이다 — 이 줄이 빠지면 문단만 읽은 독자가
   ⓐ모집단을 한 축으로 ⓑ보류를 판정으로 ⓒ행 항등식을 증거로 읽는다(2026-10-26 적대적 심사). */
function pgIntroNotes() {
  return _pgIntroFill((typeof PG_INTRO_NOTE !== "undefined") ? PG_INTRO_NOTE : [], pgIntroFacts());
}

/* ⟦PG_CALC_END⟧ — 이 줄 위는 **순수 계산 레이어**다(JSX 0건). 러너가 여기까지를 vm 에 적재해
   추적 · 재판정 · 엔진 집계를 실측 단언한다(run_pg_scan 단언 21). 계산 함수를 이 줄 아래에
   쓰면 그 함수는 **단언 밖**에 남는다 — 그러면 지면이 늘어나도 검사가 0건으로 조용히 통과한다. */

/* ══════════════════════════════════════════════════════════════════════════════
   ⑧ 지면 — 렌더만 한다
   ══════════════════════════════════════════════════════════════════════════════ */
function _pgW(n) {
  if (n === null || n === undefined) return "—";
  return (typeof ontWon === "function") ? ontWon(n) : (Number(n) || 0).toLocaleString() + "원";
}
function _pgN(n) { return (n === null || n === undefined) ? "—" : Number(n).toLocaleString(); }
/* 선언 문안을 지면에 그대로 옮길 때 강조 표식만 걷어낸다 — 문안을 고치지 않는다(원천은 선언 테이블이다). */
function _pgPlain(s) { return String(s || "").split("**").join(""); }
function _pgPct(r) { return (r === null || r === undefined) ? "—" : (r * 100).toFixed(1) + "%"; }
function _pgDecKo(d) {
  const A = (typeof PG_AXES !== "undefined") ? PG_AXES.decision : [];
  for (const row of A) if (row[0] === d) return row[1];
  return d || "—";
}
function _pgCauseKo(c) {
  const A = (typeof PG_AXES !== "undefined") ? PG_AXES.cause : [];
  for (const row of A) if (row[0] === c) return row[1];
  return c || "";
}
function _pgEnfKo(l) {
  const A = (typeof PG_AXES !== "undefined") ? PG_AXES.enforce : [];
  for (const row of A) if (row[0] === l) return row[1];
  return l || "";
}
const PG_DEC_COLOR = { PERMIT: "#16A34A", DENY: "#DC2626", INDETERMINATE: "#B45309", NOT_APPLICABLE: "#64748B" };
const PG_DEC_MARK = { PERMIT: "●", DENY: "▲", INDETERMINATE: "○", NOT_APPLICABLE: "–" };

/* 블록 머리 — 블록의 표제 · 질문 · 「반드시 들어가는 것」을 선언 테이블에서 읽는다. */
function PGBlockHead({ id, ic }) {
  const B = (typeof pgBlock === "function") ? pgBlock(id) : null;
  if (!B) return null;
  const Ic = ic || FileText;
  return (
    <div className="ontph" style={{ marginTop: 2 }}>
      <Ic size={15} color="#22D3EE" /> {B.id}. {B.ko}
      <span>· {B.asks}</span>
    </div>
  );
}
/* 출처 등급 배지 — 모든 수치에 붙는다. 등급 없는 수치는 지면에 설 수 없다. */
function PGGrade({ g }) {
  const C = { REAL: "#16A34A", DEMO: "#0E8FA6", ABSENT: "#B45309" };
  const A = (typeof PG_AXES !== "undefined") ? PG_AXES.source : [];
  let ko = g;
  for (const row of A) if (row[0] === g) ko = row[1];
  return <span style={{ fontSize: 10, fontWeight: 800, color: C[g] || "#64748B", border: "1px solid " + (C[g] || "#CBD5E1"), borderRadius: 6, padding: "1px 5px", marginLeft: 6 }}>{ko}</span>;
}
/* 수치 한 칸 — 라벨 · 값 · 출처 배지 · 원천 경로. 원천 경로를 같이 들고 다니는 것이 역추적의 실체다. */
function PGStat({ mid, val, note }) {
  const M = (typeof pgMetric === "function") ? pgMetric(mid) : null;
  /* 선언에 없는 수치를 **조용히 빠뜨리지 않는다** — 빈 칸은 「없다」와 「선언을 안 했다」를 섞는다 */
  if (!M) return <div className="v360li" style={{ color: "#DC2626", fontWeight: 800 }}>수치 정의가 선언 테이블에 없습니다 — {mid}</div>;
  return (
    <div className="v360li" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ minWidth: 150, fontWeight: 800, color: "#334155" }}>{M.ko}</span>
      <b style={{ color: "#0F172A" }}>{val}</b>
      <PGGrade g={M.grade} />
      {M.clamp ? <span style={{ fontSize: 10, color: "#B45309", fontWeight: 800 }}>열람 {M.clamp}</span> : null}
      {note ? <span style={{ fontSize: 11, color: "#64748B" }}>{note}</span> : null}
      <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto" }}>{M.from}</span>
    </div>
  );
}

/* 엔진 지면의 수치 한 칸 — 보고서 쪽 PGStat 과 같은 모양이고 읽는 표만 다르다.
   선언에 없는 수치를 **조용히 빠뜨리지 않는다**(빈 칸은 「없다」와 「선언을 안 했다」를 섞는다). */
function PGEStat({ mid, val, note }) {
  const M = (typeof pgEngineMetric === "function") ? pgEngineMetric(mid) : null;
  if (!M) return <div className="v360li" style={{ color: "#DC2626", fontWeight: 800 }}>수치 정의가 선언 테이블에 없습니다 — {mid}</div>;
  return (
    <div className="v360li" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ minWidth: 150, fontWeight: 800, color: "#334155" }}>{M.ko}</span>
      <b style={{ color: "#0F172A" }}>{val}</b>
      <PGGrade g={M.grade} />
      {note ? <span style={{ fontSize: 11, color: "#64748B" }}>{note}</span> : null}
      <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto" }}>{M.from}</span>
    </div>
  );
}
/* 엔진 블록 머리 — 표제 · 질문을 선언 테이블에서 읽는다(컴포넌트에 낱말을 적지 않는다). */
function PGEHead({ id, ic }) {
  const B = (typeof pgEngineBlock === "function") ? pgEngineBlock(id) : null;
  if (!B) return null;
  const Ic = ic || ScrollText;
  return (
    <div className="ontph" style={{ marginTop: 2 }}>
      <Ic size={15} color="#A78BFA" /> {B.id}. {B.ko}
      <span>· {B.asks}</span>
    </div>
  );
}
/* 결정 배지 — 색과 기호의 원천은 이 파일의 두 상수 하나뿐이다. */
function PGDec({ d, c }) {
  return (
    <span style={{ fontWeight: 800, color: PG_DEC_COLOR[d] || "#64748B" }}>
      {PG_DEC_MARK[d] || "–"} {_pgDecKo(d)}{c ? <span style={{ fontWeight: 600, color: "#64748B" }}> · {_pgCauseKo(c)}</span> : null}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   B5 추적 5레인 — 판정 하나를 펼친다 (P5b · §11-2)
   ══════════════════════════════════════════════════════════════════════════════
   이 컴포넌트는 **렌더만** 한다. 레인의 표제 · 보여줄 것 · 규약은 선언 테이블에서 오고, 칸의 값은
   전부 pgTrace() 가 돌려준 반환 필드다. 지면이 문장을 지어내면 「판정기가 쓴 사유」 자리에
   화면이 쓴 사유가 들어간다 — 그래서 레인 3은 reasons[] 를 **그대로** 찍는다.
   ★ 레인을 다섯 개 하드코딩하지 않는다. 선언된 레인 배열을 순회하므로 레인이 늘거나 줄면
     지면이 따라 바뀌고, 러너가 「선언 수 = 렌더 수」를 단언할 수 있다. */
function PGLane({ L, onEngine, onPartner }) {
  const p = L.pay || {};
  return (
    <div className="v360sec" style={{ marginTop: 8, borderLeft: "3px solid #A78BFA", paddingLeft: 10 }}>
      <b><Hash size={12} /> 레인 {L.n} · {L.ko}</b>
      <div className="v360li" style={{ color: "#64748B", fontSize: 11 }}>{L.shows} <span style={{ color: "#94A3B8" }}>· {L.from}</span></div>

      {L.n === 1 ? (
        <div>
          <div className="v360li"><b>{p.id.selfAxis ? "당사" : p.id.partnerId}</b> · 표시명 {p.id.dispName}
            <span style={{ color: "#64748B" }}> · 입력 {_pgN(p.counts.all)}칸(쓴 것 {_pgN(p.counts.used)} · 쓰지 않은 것 {_pgN(p.counts.unused)} · 미제출 {_pgN(p.counts.absent)} · 열람 등급에서 잘린 것 {_pgN(p.counts.clamped)})</span></div>
          {p.used.concat(p.unused).map((ir, i) => (
            <div className="v360li" key={i} style={{ opacity: ir.used ? 1 : 0.5 }}>
              <b>{ir.field}</b>
              <span> · {ir.clamped ? "열람 등급 " + ir.clamped + " 에서 잘림" : (ir.value === null || ir.value === undefined ? "값 없음" : String(ir.value))}</span>
              <PGGrade g={ir.grade} />
              {ir.asOf ? <span style={{ color: "#94A3B8", fontSize: 10 }}> · 수집 {ir.asOf}</span> : null}
              <span style={{ color: "#64748B" }}> · {ir.use}</span>
            </div>
          ))}
          <div className="v360li" style={{ color: "#64748B" }}>{p.note}</div>
          <div className="v360li" style={{ color: "#64748B" }}>{p.nameNote}</div>
        </div>
      ) : null}

      {L.n === 2 ? (
        <div style={{ opacity: p.gated ? 1 : 0.72 }}>
          <div className="v360li"><b>{p.rule.policyId} · {p.rule.title}</b>
            <span style={{ color: "#64748B" }}> · 통제군 {p.rule.group} · {p.rule.subject === "당사" ? "판정 대상 ⓠ당사" : "판정 대상 ⓘ협력업체"} · 생애주기 {p.rule.lifecycle} · 결함 {p.rule.severity} · {p.rule.obligation ? "의무" : "권고"} · 주기 {p.rule.cycle}</span></div>
          <div className="v360li">유형 해당성 {p.rule.appliesTo.join(" · ") || "—"} · 판정 분기 {p.rule.ruleId}
            {p.rule.locked ? <span style={{ color: "#B45309", fontWeight: 800 }}> · 잠금</span> : null}
            {p.rule.appliesToSelf ? <span style={{ color: "#0E8FA6", fontWeight: 800 }}> · 당사도 수범자</span> : null}</div>
          {p.laws.map((lr, i) => (
            <div className="v360li" key={i}>
              <b>{lr.label}</b> <span style={{ color: lr.verified === "원문확인" ? "#16A34A" : "#B45309", fontWeight: 800 }}>{lr.verified}</span>
              {lr.lawVersion ? <span style={{ color: "#64748B" }}> · {lr.lawVersion}</span> : null}
              {lr.effectiveDate ? <span style={{ color: "#64748B" }}> · 시행 {lr.effectiveDate}</span> : <span style={{ color: "#B45309" }}> · 시행일 미확인</span>}
            </div>
          ))}
          <div className="v360li">조항 시행일 {p.rule.effectiveDate || "—"} · 확인 등급 <b style={{ color: p.gated ? "#16A34A" : "#B45309" }}>{p.rule.verified || "미확인"}</b>
            {p.rule.contractBasis ? <span style={{ color: "#64748B" }}> · 계약 조항 근거 {p.rule.contractBasis}</span> : <span style={{ color: "#B45309" }}> · 계약 조항 근거 미기재 — 승격 불가</span>}</div>
          {p.sanction ? <div className="v360li" style={{ color: "#64748B" }}>제재 {_pgSanc(p.sanction).label} · 확인 등급 {_pgSanc(p.sanction).verified}</div> : null}
          {p.grace ? <div className="v360li" style={{ color: "#B45309", fontWeight: 800 }}>{_pgDeclText("graceEnforce")}{p.grace.until ? " · " + p.grace.until : ""}</div> : null}
          {p.holdNote ? <div className="v360li" style={{ color: "#B45309", fontWeight: 800 }}>{p.holdNote} — {_pgDeclText("traceNoArticle")}</div> : null}
          {onEngine ? <button className="ontchip" style={{ marginTop: 6 }} onClick={() => onEngine(p.rule.policyId)}>이 조항의 레지스트리 카드로 ›</button> : null}
        </div>
      ) : null}

      {L.n === 3 ? (
        <div>
          <div className="v360li"><PGDec d={p.decision} c={p.cause} />
            {p.axis ? <span style={{ color: "#64748B" }}> · 축 {p.axis}</span> : null}</div>
          {p.reasons.map((rs, i) => <div className="v360li" key={i}>{rs}</div>)}
          {p.ruleOutcome ? (
            <div className="v360li" style={{ color: "#64748B" }}>
              판정기 자체 산출(집행에 쓰지 않습니다) — {_pgDecKo(p.ruleOutcome.decision)}{p.ruleOutcome.cause ? " · " + _pgCauseKo(p.ruleOutcome.cause) : ""}
              {p.ruleOutcome.axis ? " · 축 " + p.ruleOutcome.axis : ""}
            </div>
          ) : null}
          {p.outcomeDrift ? <div className="v360li" style={{ color: "#B45309" }}>{p.outcomeNote}</div> : null}
          <div className="v360li" style={{ color: "#64748B" }}>{p.owner}</div>
        </div>
      ) : null}

      {L.n === 4 ? (
        <div>
          {p.enforce ? (
            <div>
              <div className="v360li">집행 수준 <b>{_pgEnfKo(p.enforce.level)}</b> · 집행 지점 {p.enforce.pep} · 온보딩 단계 {p.enforce.stage}
                <span style={{ color: "#64748B" }}> · 배포 선언 {_pgEnfKo(p.enforce.declared)} · 지점 상한 {_pgEnfKo(p.enforce.cap)}</span></div>
              <div className="v360li">{p.enforce.block ? <b style={{ color: "#DC2626" }}>{_pgDeclText("traceBlockHere")}</b> : <b>{p.noBlock}</b>}
                {p.stageEffect ? <span style={{ color: "#64748B" }}> · {p.stageEffect}</span> : null}</div>
              {(p.enforce.floors || []).map((f, i) => <div className="v360li" key={i} style={{ color: "#B45309" }}>수준을 내린 것 — {f}</div>)}
              {(p.enforce.floors || []).length === 0 ? <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("noCap")}</div> : null}
            </div>
          ) : <div className="v360li">{_pgDeclText("noEnforceField")}</div>}
          <div className="v360li">차단 이력 — {p.blocked.available ? (_pgN(p.blocked.policy) + "건(이 조항) · " + _pgN(p.blocked.total) + "건(전체)") : "집계 불가"}
            {p.blocked.available && p.blocked.total === 0 ? " · " + p.noBlock : ""}
            {p.blocked.available ? <span style={{ color: "#64748B" }}> · 면제로 통과 {_pgN(p.blocked.exempt)}건</span> : null}</div>
          <div className="v360li">{p.exemption
            ? <span>면제 — 사유 {p.exemption.reason} · 승인자 {p.exemption.approver} · 만료 {p.exemption.expireAt}</span>
            : <span style={{ color: "#64748B" }}>{_pgDeclText("noExempt")}</span>}</div>
          <div className="v360li" style={{ color: "#64748B" }}>
            집행 레코드 4필드 — {p.action.fields.map((f) => f.ko).join(" · ")} · 소명 없이 집행된 건수 {p.action.available ? _pgN(p.action.noDefense) + "건" : "집계 불가"} · 집행 기록 {p.action.available ? _pgN(p.action.total) + "건" : "—"}
          </div>
          {p.sites.map((s) => <div className="v360li" key={s.pep} style={{ color: "#64748B" }}>{s.pep} · {s.ko} — 막는 것 {s.blocks} · 상한 {_pgEnfKo(s.cap)}</div>)}
        </div>
      ) : null}

      {L.n === 5 ? (
        <div>
          {(p.remedy || []).length === 0 ? <div className="v360li">{_pgDeclText("noRemedy")}</div>
            : p.remedy.map((rm, i) => (
              <div className="v360li" key={i}>{rm.what}
                <span style={{ color: "#64748B" }}> · 소유자 {rm.owner} · 기한 {rm.due} · 상태 {rm.status}</span></div>
            ))}
          <div className="v360li" style={{ color: "#64748B" }}>
            {_pgDeclText(p.obligation ? "obligationYes" : "obligationNo")}
            {p.locked ? " · " + _pgDeclText("lockedPolicy") : ""}
            {" · 필요한 증거 "}{(p.evidence || []).map((e) => e.kind).join(" · ") || "—"}
          </div>
          {(p.absentInputs || []).length ? (
            <div className="v360li" style={{ color: "#B45309" }}>미제출이면서 이 판정에 쓰이지 않은 입력 {_pgN(p.absentInputs.length)}칸 — {p.absentInputs.map((x) => x.field).join(" · ")}</div>
          ) : null}
          {p.whatIf ? (
            <div className="v360li">증거를 채웠다고 가정한 재판정 — <PGDec d={p.whatIf.decision} c={p.whatIf.cause} />
              <span style={{ color: "#64748B" }}> · {p.whatIf.assumed}</span></div>
          ) : <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("whatIfNoAssume")}</div>}
          <div className="v360li" style={{ color: "#64748B" }}>{p.ledgerNote}</div>
        </div>
      ) : null}
    </div>
  );
}

/* What-if 지면 — 「무엇을 고치면 등급이 올라가는가」. 가정 축과 **하지 않는 가정**을 같이 적는다. */
function PGWhatIfBox({ W }) {
  if (!W) return null;
  return (
    <div className="v360sec" style={{ marginTop: 10, borderLeft: "3px solid #16A34A", paddingLeft: 10 }}>
      <b><RotateCcw size={12} /> 재판정(What-if) — 무엇을 고치면 등급이 올라가는가</b>
      <div className="v360li">지금 결정 <PGDec d={W.base.decision} c={W.base.cause} />
        <span style={{ color: "#64748B" }}> · 집행 {_pgEnfKo(W.base.level)}{W.base.block ? " · 막힘" : " · 막은 것 없음"}</span></div>
      {W.axes.map((ax) => (
        <div key={ax.k} style={{ marginTop: 6 }}>
          <div className="v360li"><b>{ax.ko}</b> <span style={{ color: "#64748B", fontSize: 11 }}>· {ax.answers} · {ax.how} <span style={{ color: "#94A3B8" }}>({ax.from})</span></span></div>
          {!ax.available ? <div className="v360li" style={{ color: "#64748B" }}>{ax.hint}</div> : null}
          {ax.rows.map((rw, i) => (
            <div className="v360li" key={i} style={{ background: rw.up ? "#ECFDF5" : undefined }}>
              {rw.now ? <b>▸ </b> : null}{rw.label} → <PGDec d={rw.decision} c={rw.cause} />
              {rw.level ? <span style={{ color: "#64748B" }}> · 집행 {_pgEnfKo(rw.level)}{rw.block ? " · 막힘" : ""}</span> : null}
              {rw.render ? <span style={{ color: "#64748B" }}> · {rw.render}</span> : null}
              {rw.verified ? <span style={{ color: "#64748B" }}> · 확인 등급 {rw.verified}</span> : null}
              {rw.up ? <b style={{ color: "#16A34A" }}> · 올라갑니다</b> : null}
              {(rw.reasons || []).slice(0, 2).map((rs, j) => <div key={j} style={{ color: "#64748B", fontSize: 11 }}>{rs}</div>)}
              {(rw.floors || []).map((f, j) => <div key={"f" + j} style={{ color: "#B45309", fontSize: 11 }}>수준을 내린 것 — {f}</div>)}
            </div>
          ))}
        </div>
      ))}
      <div className="v360li" style={{ marginTop: 6, color: W.ledger.same ? "#16A34A" : "#DC2626", fontWeight: 800 }}>
        원장 {_pgDeclText(W.ledger.same ? "ledgerSame" : "ledgerMoved")}
        <span style={{ color: "#64748B", fontWeight: 600 }}> · 지문 축 {W.ledger.keys.join(" · ")}</span>
      </div>
      <div className="v360li" style={{ color: "#64748B" }}>{W.note}</div>
      <div className="v360li" style={{ color: "#64748B" }}><b>하지 않는 가정</b> — {W.forbidNote}</div>
      {W.forbid.map((f) => <div className="v360li" key={f.k} style={{ color: "#64748B" }}>· {f.ko} — {f.why}</div>)}
    </div>
  );
}

/* B5 블록 — 판정표의 칸을 누르면 열린다. 엔진 지면도 같은 컴포넌트를 쓴다(지면이 둘이면 추적이 둘이 된다). */
function PGB5({ TR, W, onEngine, head }) {
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      {head === false ? null : <PGBlockHead id="B5" ic={GitBranch} />}
      {!TR ? <div className="scempty">판정표의 칸을 누르면 그 판정이 어떻게 만들어졌는지 다섯 레인으로 열립니다.</div> : (
        <div>
          <div className="chnote" style={{ marginTop: 8 }}>
            <b>{TR.dispName}</b> <span style={{ color: "#64748B" }}>({TR.code})</span> · {TR.policyId} · 기준일 {TR.asOf} · 단계 {TR.stage} · 유형 {TR.kind} · 열람 {TR.level}
            {TR.clamp.n ? <span style={{ color: "#B45309" }}> · 이 등급에서 잘라내는 필드 {_pgN(TR.clamp.n)}개 · 이 판정에서 잘린 값 칸 {_pgN(TR.clamp.cut)}개</span> : null}
          </div>
          {TR.lanes.map((L) => <PGLane L={L} key={L.n} onEngine={onEngine} />)}
          <PGWhatIfBox W={W} />
          <div className="chnote" style={{ marginTop: 8 }}>
            {TR.rule.map((r) => <div key={r.n}>※ {r.ko} — {_pgPlain(r.rule)} <span style={{ color: "#94A3B8" }}>(검사 {r.owner})</span></div>)}
          </div>
          <div className="chnote" style={{ marginTop: 6 }}>※ {TR.determinism}</div>
        </div>
      )}
    </div>
  );
}

/* ── B1 머리 — 범위 · 원천 · 목적 선언 ── */
function PGB1({ R, V }) {
  const M = R.meta;
  const law = (typeof pgLawRender === "function") ? pgLawRender("pipa", "제26조") : null;
  const purpose = _pgDeclText("purposeLaw").replace("{법령}", law ? law.label : "근거 법령 미등재");
  const notices = (typeof PG_SCREEN_NOTICE !== "undefined") ? PG_SCREEN_NOTICE : [];
  const gov = (typeof PG_SELF_GOV !== "undefined") ? PG_SELF_GOV.filter((g) => g.self) : [];
  const plan = M.planModel;
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B1" ic={ScrollText} />
      <div className="chnote" style={{ marginTop: 8 }}>
        <b>{purpose}</b>
        {law && law.verified !== "원문확인" ? <span style={{ color: "#B45309", fontWeight: 800 }}> · 조문 미확인 — 집행 보류</span> : null}
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Users size={12} /> 모집단 · 기준일 · 창</b>
        <PGStat mid="b1.popPartner" val={_pgN(M.partnerN) + "곳"} note={"중복 신원 " + M.dupDeclared + "건 선언 해소"} />
        <PGStat mid="b1.popVendor" val={_pgN(M.vendorN) + "곳"} note={"거래 사실 보유 " + _pgN(M.tradeN) + "곳"} />
        <PGStat mid="b1.asOf" val={M.asOf} />
        <PGStat mid="b1.window" val={(M.window.from || "—") + " ~ " + (M.window.to || "—") + " · " + M.window.months + "개월"} />
        <PGStat mid="b1.uncaughtSales" val={_pgW(M.uncaught.sales)} note={M.uncaught.note} />
        <PGStat mid="b1.uncaughtCost" val={_pgW(M.uncaught.supplyCost)} />
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Boxes size={12} /> 유형별 분해</b>
        <div className="ontchips">{M.byKind.map((kd) => (
          <span className="ontchip" key={kd.k} style={{ opacity: kd.available ? 1 : 0.65 }}>
            {kd.k} · {kd.ko} · {kd.available ? _pgN(kd.n) + "곳" : kd.hint}
          </span>
        ))}</div>
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Database size={12} /> 원천 선언 · 정책 버전</b>
        <PGStat mid="b1.sourceDecl" val={_pgDeclText("source")} />
        {/* ★ 두 분모를 **나란히** 적는다(2026-10-26). 할당표 비중과 보고서 지표 비중은 다른 질문의 답이다. */}
        <PGStat mid="b1.gradeMix" val={M.grades ? ("실원천 " + M.grades.REAL + " · 시연 시드 파생 " + M.grades.DEMO + " · 미제출 " + M.grades.ABSENT + " / 전체 " + M.grades.total) : "—"} note={M.grades ? (M.grades.axis + " 기준 · 판정 가능 " + M.grades.usable + " · 보류 " + M.grades.pending) : ""} />
        <PGStat mid="b1.metricMix" val={M.metricGrades ? ("실원천 " + M.metricGrades.REAL + " · 시연 시드 파생 " + M.metricGrades.DEMO + " · 미제출 " + M.metricGrades.ABSENT + " / 전체 " + M.metricGrades.total) : "—"} note={M.metricGrades ? M.metricGrades.axis + " 기준" : ""} />
        <PGStat mid="b1.policyVer" val={V.policyVer || "—"} />
        <PGStat mid="b1.tableHash" val={V.policyHash || "—"} />
        <PGStat mid="b1.planCompare" val={plan.available ? (_pgW(M.gmv) + "  ↔  " + _pgW(plan.revP)) : "—"} note={plan.available ? plan.owner : plan.hint} />
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Info size={12} /> 고지</b>
        {/* 법인 축 성격 표기 · 판정 지면 규약 — 문자 단위 문안은 선언 테이블이 소유한다.
            판정 지면 규약 문구는 이 지면이 서 있는 한 **여기**에 있어야 한다(가드 대상). */}
        <div className="chnote" style={{ marginTop: 4 }}>※ {notices.length ? notices[0].text : ""}</div>
        <div className="chnote" style={{ marginTop: 6 }}>※ <b>법령 준수 판정은 자가점검 산출물이며 해당 기관의 실제 준수 여부를 뜻하지 않습니다.</b> 통제 축 시연값은 「미확인」 단일값만 생성하므로 실명 표기 옆에 「미보유」·「중대 결함」이 찍히는 일은 구조적으로 생기지 않습니다. 확인하지 못한 법령의 조문 번호는 화면·보고서에 인쇄하지 않습니다.</div>
        <div className="chnote" style={{ marginTop: 6 }}>※ 표시명 모드 <b>{(typeof PG_NAME_MODE !== "undefined") ? PG_NAME_MODE : "—"}</b> — 반출물 머리말 고지가 {(typeof pgExportNoticeRequired === "function" && pgExportNoticeRequired()) ? <b>필수</b> : "권고"}입니다. {(typeof PG_EXPORT_NOTICE_DOC !== "undefined") ? PG_EXPORT_NOTICE_DOC : ""}</div>
        {/* 고지 문안은 선언 테이블에서 온다 — 자기 거버넌스 표의 `check` 는 **검증 기준**이므로
            지면에 찍으면 「고지 문구가 존재한다」가 고지 자리에 인쇄된다. */}
        {gov.map((g) => <div className="chnote" style={{ marginTop: 6 }} key={g.id}>※ <b>{g.ko}</b> — {_pgGovNotice(g.id) || g.check}</div>)}
        <div className="chnote" style={{ marginTop: 6 }}>※ {V.demoState} {V.selfInputNote}</div>
      </div>
    </div>
  );
}

/* ── B2 결론 — 원칙 × {존재, 기능} 행렬. 총점을 만들지 않는다 ── */
function PGB2({ V, onPolicy, onCell }) {
  const conc = Object.keys(V.conclusion);
  const [concOpen, setConcOpen] = useState(null);
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B2" ic={Target} />
      <div className="chnote" style={{ marginTop: 8 }}>
        {conc.map((k) => <span key={k} onClick={() => setConcOpen(concOpen === k ? null : k)}
          style={{ marginRight: 12, fontWeight: 800, cursor: "pointer", textDecoration: "underline dotted", color: k === "결론 보류" ? "#B45309" : k === "결함 있음" ? "#DC2626" : "#16A34A" }}>{k} · {_pgN(V.conclusion[k])}곳</span>)}{" "}
        <span style={{ color: "#64748B" }}>· 총점을 만들지 않습니다 — 하나라도 미기능이면 결론을 내지 않습니다. 결론을 누르면 판정기가 쓴 사유와 구성 조항이 펼쳐집니다.</span>
      </div>
      {/* ★ 판정기가 쓴 결론 사유 — 지면이 문장을 만들지 않는다(반환 필드 그대로) */}
      {concOpen && V.conclusionWhy[concOpen] ? (
        <div className="v360sec" style={{ marginTop: 6 }}>
          <b><Target size={12} /> {concOpen} — 판정기가 쓴 사유</b>
          {V.conclusionWhy[concOpen].map((w, i) => <div className="v360li" key={i}>{w.why} <span style={{ color: "#94A3B8" }}>· {_pgN(w.n)}곳</span></div>)}
          <div className="v360li" style={{ color: "#64748B" }}>구성 조항 —
            {V.conclusionPolicies.map((id) => <span key={id} onClick={(e) => { e.stopPropagation(); onPolicy && onPolicy(id); }}
              style={{ marginLeft: 6, cursor: "pointer", fontWeight: 800, color: "#0E8FA6" }}>{id}</span>)}
          </div>
        </div>
      ) : null}
      <div className="sctablewrap" style={{ marginTop: 8 }}>
        <table className="sctable"><thead><tr>
          <th>원칙(조항)</th><th>존재</th><th>기능</th><th>허용</th><th>불허</th><th>보류</th><th>해당없음</th><th>준수율</th>
        </tr></thead><tbody>
          {V.matrix.map((mx) => (
            /* ★ 행 클릭이 「첫 협력업체 고정」이 아니다 — 조항 축으로 보낸다(onPolicy).
               결정이 협력업체별로 갈린 조항(mixed)은 **고정 칸을 열지 않는다**: 행의 수치와 열린 추적의
               칸이 다른 말을 하게 되기 때문이다. 갈림 수는 selfAxis.mixed 가 이미 센다. */
            <tr key={mx.id} onClick={() => onPolicy && onPolicy(mx.id)} style={{ cursor: "pointer" }}
              title={mx.mixed ? "이 조항은 협력업체별로 결정이 갈립니다 — 대표 칸을 고정해 열지 않습니다" : "조항 축으로 이동합니다"}>
              <td><b>{mx.id}</b> · {mx.title}</td>
              <td style={{ color: mx.exist.s === "bad" ? "#DC2626" : mx.exist.s === "pending" ? "#B45309" : "#16A34A", fontWeight: 800 }}>{mx.exist.ko}</td>
              <td style={{ color: mx.func.s === "bad" ? "#DC2626" : mx.func.s === "pending" ? "#B45309" : "#16A34A", fontWeight: 800 }}>{mx.func.ko}</td>
              <td>{_pgN(mx.counts.PERMIT)}</td>
              <td>{_pgN(mx.counts.DENY)}</td>
              <td>{_pgN(mx.counts.INDETERMINATE)}</td>
              <td>{_pgN(mx.counts.NOT_APPLICABLE)}</td>
              <td>{_pgPct(mx.comply.rate)}<span style={{ fontSize: 10, color: "#94A3B8" }}> / 분모 {_pgN(mx.comply.den)}</span></td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="v360grid2" style={{ marginTop: 10 }}>
        <div className="v360sec">
          <b><AlertTriangle size={12} /> 결함 3등급 — 협력업체 축</b>
          <div className="v360li">경미 {_pgN(V.defect.partnerAxis["경미"])}건 · 중대 {_pgN(V.defect.partnerAxis["중대"])}건 · 치명 {_pgN(V.defect.partnerAxis["치명"])}건</div>
          <div className="v360li" style={{ color: "#64748B" }}>판정축: {(typeof PG_AXES !== "undefined") ? PG_AXES.severityAxis : ""}</div>
        </div>
        <div className="v360sec">
          <b><Building2 size={12} /> 결함 3등급 — 당사 축(조항 단위)</b>
          <div className="v360li">경미 {_pgN(V.defect.selfAxis["경미"])}건 · 중대 {_pgN(V.defect.selfAxis["중대"])}건 · 치명 {_pgN(V.defect.selfAxis["치명"])}건</div>
          {/* ★ 조항 id 를 **클릭 경로로** 바꿨다(2026-10-26). 평문이던 동안 이 보고서가 주장하는 단 하나의
              결함(당사 축 · 중대 1건)에 도달하는 경로가 없어 29열 × 9페이지 격자를 사람이 훑어야 했다. */}
          <div className="v360li">{V.defect.selfPolicies.length ? <span>해당 조항: {V.defect.selfPolicies.map((id) => (
            <span key={id} onClick={() => onPolicy && onPolicy(id)} style={{ marginRight: 8, cursor: "pointer", fontWeight: 800, color: "#0E8FA6", textDecoration: "underline dotted" }}>{id} ›</span>
          ))}</span> : "해당 조항 없음"}</div>
          <div className="v360li" style={{ color: "#64748B" }}>{V.defect.note}</div>
        </div>
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Gauge size={12} /> 준수율 — 판정 대상으로 가른 뒤에만 적습니다</b>
        <div className="v360li">
          ⓘ 협력업체 축(행 기준) — {_pgPct(V.complyPartner.rate)} · 분모 {_pgN(V.complyPartner.den)} · 보류 {_pgN(V.complyPartner.pending)} · 해당 없음 {_pgN(V.complyPartner.na)}
        </div>
        <div className="v360li">
          ⓠ 당사 축(조항 1건 기준) — {_pgPct(V.selfAxis.comply.rate)} · 조항 {_pgN(V.selfAxis.policyN)}건 중 불허 {_pgN(V.selfAxis.byDecision.DENY)} · 보류 {_pgN(V.selfAxis.byDecision.INDETERMINATE)} · 해당 없음 {_pgN(V.selfAxis.byDecision.NOT_APPLICABLE)}{V.selfAxis.mixed ? " · 협력업체별로 갈린 조항 " + _pgN(V.selfAxis.mixed) + "건" : ""}
        </div>
        <div className="v360li" style={{ color: "#64748B" }}>{V.defect.note} 두 축을 한 분모에 넣으면 조항 1건이 분모 {_pgN(V.partnerN)}을 만듭니다.</div>
      </div>
      <div className="chnote" style={{ marginTop: 8 }}>
        판정 보류 {_pgN(V.total.INDETERMINATE)}칸 · 해당 없음 {_pgN(V.total.NOT_APPLICABLE)}칸 — 보류는 분모에서 빼는 <b>동시에</b> 이 칸에 셉니다. 「해당 없음」 전건 조항 {V.naPolicies.length ? V.naPolicies.join(" · ") : "없음"}.
      </div>
    </div>
  );
}

/* ── B3 실적 — 입력은 거래 사실 레이어 읽기 전용, 집계는 롤업 하나 ── */
function PGB3({ R, focus, onFocus }) {
  const T = R.total, M = R.meta;
  const cell = focus ? (R.byVendor[focus] || null) : T;
  const rows = focus ? (R.monthsOf[focus] || []) : R.months.map((m) => Object.assign({ period: m }, R.byMonth[m]));
  const pr = focus ? pgPartnerRec(focus) : null;
  const who = pr ? ((typeof pgDisplayName === "function") ? pgDisplayName(pr) : pr.partnerId) : "전수";
  const setLabel = (typeof PG_SETTLE_LABEL !== "undefined") ? PG_SETTLE_LABEL : "정산(주문 파생)";
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B3" ic={Receipt} />
      <div className="chnote" style={{ marginTop: 8 }}>
        범위 <b>{who}</b> · {M.window.from} ~ {M.window.to} · {_pgDeclText("source")}
        {focus ? <button className="ontchip" style={{ marginLeft: 8 }} onClick={() => onFocus && onFocus(null)}>전수로 ›</button> : null}
      </div>
      {!cell ? <div className="scempty">{_pgHint("noTrade")}</div> : (
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Coins size={12} /> 금액 축 · 건수 축</b>
          <PGStat mid="b3.sales" val={_pgW(cell.sales)} />
          <PGStat mid="b3.supplyCost" val={_pgW(cell.supplyCost)} />
          <PGStat mid="b3.fee" val={_pgW(cell.fee)} />
          <PGStat mid="b3.marginNet" val={_pgW(cell.marginNet)} />
          <PGStat mid="b3.settleTarget" val={_pgW(cell.settleTarget)} note={setLabel + (cell.settleEqSales ? " · 창이 같아 매출과 원 단위까지 같습니다" : "")} />
          <PGStat mid="b3.preShip" val={_pgW(cell.preShip)} />
          <PGStat mid="b3.orders" val={_pgN(cell.orders) + "건"} note={"전표 " + _pgN(cell.rows) + "행"} />
          <PGStat mid="b3.slaRate" val={_pgPct(cell.slaMet.rate)} note={cell.slaMet.basis + " · 분모 " + _pgN(cell.slaMet.den)} />
          <PGStat mid="b3.service" val={cell.service.available ? "—" : "해당 없음"} note={cell.service.hint} />
        </div>
      )}
      <div className="sctablewrap" style={{ marginTop: 10 }}>
        <table className="sctable"><thead><tr>
          <th>{focus ? "기간" : "기간(전수)"}</th><th>매출</th><th>공급대금</th><th>수수료</th><th>순마진</th><th>{setLabel}</th><th>그중 미출고</th><th>주문</th>
        </tr></thead><tbody>
          {rows.map((rw) => (
            <tr key={rw.period}>
              <td><b>{rw.period}</b></td>
              <td>{_pgW(rw.sales)}</td><td>{_pgW(rw.supplyCost)}</td><td>{_pgW(rw.fee)}</td>
              <td>{_pgW(rw.marginNet)}</td><td>{_pgW(rw.settleTarget)}</td><td>{_pgW(rw.preShip)}</td>
              <td>{_pgN(rw.orders)}건</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="chnote" style={{ marginTop: 8 }}>
        {(typeof pgMetric === "function" && pgMetric("b3.trend")) ? pgMetric("b3.trend").renderRule : ""} · 행 항등식(매출 = 공급대금 + 수수료 + 순마진) {cell && cell.rowIdentity ? "성립" : "불성립"} · 거래 사실 없는 협력업체 {_pgN(M.noTrade.length)}곳
      </div>
    </div>
  );
}

/* ★ 제재 렌더 — 레지스트리의 게이트 함수 **한 곳**을 지난다(§6-4 동형). 지면이 kind 를 직접 찍지 않는다. */
function _pgSanc(sanction) {
  try { if (typeof pgSanctionRender === "function") return pgSanctionRender(sanction); } catch (e) {}
  return { has: !!sanction, none: !sanction, kind: null, verified: sanction ? (sanction.verified || "미확인") : null, label: sanction ? "제재 미확인" : "—" };
}

/* ★ 조항의 **대표 칸** — 그 조항에서 결정이 갈리지 않으면 아무 칸이나 대표가 되고, 갈리면 null 이다.
   null 이면 지면은 칸을 열지 않고 「영향 협력업체 목록」으로 보낸다(고정 칸이 행과 다른 말을 하는 사고). */
function _pgRepCell(V, policyId) {
  const bp = V && V.byPolicy ? V.byPolicy[policyId] : null;
  if (!bp) return null;
  const hit = ["PERMIT", "DENY", "INDETERMINATE", "NOT_APPLICABLE"].filter((k) => bp.counts[k] > 0);
  if (hit.length !== 1) return null;                       /* 갈린 조항 — 대표를 세우지 않는다 */
  const ln = (V.byPartner || [])[0];
  return ln ? { partnerId: ln.partnerId, policyId: policyId } : null;
}

/* ── B4 판정표 — 행 = 협력업체 · 열 = 조항 · 칸 = 결정 4값 ── */
function PGB4({ V, onCell, onFocus, focusCell }) {
  const [page, setPage] = useState(0);
  const [grp, setGrp] = useState("ALL");
  const groups = (typeof PG_AXES !== "undefined") ? PG_AXES.group : [];
  const polIdsAll = Object.keys(V.byPolicy).filter((id) => grp === "ALL" || V.byPolicy[id].group === grp);
  /* ★ 두 축을 한 격자에 섞지 않는다(2026-10-26). ⓠ당사 조항은 입력이 우리 구조라 **협력업체마다
     반복되는 결함이 아니라 조항 1건의 결함**이고, 협력업체 행 안에 열로 섞으면 실명 법인 108곳 각자가
     그 결함을 가진 것으로 읽힌다(실측: L-10 한 조항이 행 분모 1을 만들어 준수율 0.0%). 칸을 숨기지는
     않는다 — 아래 **ⓠ 당사 조항 띠**에 조항 1행으로 싣고, 거기서도 추적 지면이 열린다. */
  const polIds = polIdsAll.filter((id) => V.byPolicy[id].subject !== "당사");
  const selfPolIds = polIdsAll.filter((id) => V.byPolicy[id].subject === "당사");
  const per = 12;
  const pages = Math.max(1, Math.ceil(V.byPartner.length / per));
  const pg = Math.min(page, pages - 1);
  const view = V.byPartner.slice(pg * per, pg * per + per);
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B4" ic={Scale} />
      <div className="ontchips" style={{ marginTop: 8 }}>
        <span className={"ontchip" + (grp === "ALL" ? " on" : "")} onClick={() => setGrp("ALL")}>전체 {polIdsAll.length}조항</span>
        {groups.map((gr) => <span className={"ontchip" + (grp === gr[0] ? " on" : "")} key={gr[0]} onClick={() => setGrp(gr[0])}>{gr[0]} · {gr[1]}</span>)}
      </div>
      <div className="sctablewrap" style={{ marginTop: 8 }}>
        <table className="sctable"><thead>
          <tr>
            <th>협력업체</th>
            {polIds.map((id) => {
              const bp = V.byPolicy[id];
              return <th key={id} title={bp.title}>{id}<br /><span style={{ fontSize: 9, color: "#94A3B8" }}>{bp.subject === "당사" ? "ⓠ당사" : "ⓘ업체"} · {bp.lifecycle}</span></th>;
            })}
            <th>준수율</th><th>보류</th>
          </tr>
        </thead><tbody>
          {view.map((ln) => (
            <tr key={ln.partnerId}>
              <td onClick={() => onFocus && onFocus(ln.partnerId)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                <b>{ln.dispName}</b><br /><span style={{ fontSize: 9, color: "#94A3B8" }}>{ln.code} · {ln.kind}</span>
              </td>
              {polIds.map((id) => {
                const sl = ln.cells[id] || null;
                const on = focusCell && focusCell.partnerId === ln.partnerId && focusCell.policyId === id;
                return (
                  <td key={id} onClick={() => onCell && onCell(ln.partnerId, id)}
                    title={sl ? (_pgDecKo(sl.d) + " · " + _pgCauseKo(sl.c)) : ""}
                    style={{ cursor: "pointer", textAlign: "center", color: PG_DEC_COLOR[sl ? sl.d : ""] || "#94A3B8", fontWeight: 800, background: on ? "#E0F2FE" : undefined }}>
                    {sl ? PG_DEC_MARK[sl.d] : "—"}{sl && sl.grace ? <sup style={{ color: "#B45309" }}>유예</sup> : null}
                  </td>
                );
              })}
              <td title="ⓘ협력업체 축만 센 준수율입니다 — ⓠ당사 조항은 아래 별 띠에서 조항 1건으로 셉니다">{_pgPct(ln.comply.rate)}<span style={{ fontSize: 9, color: "#94A3B8" }}> /{_pgN(ln.comply.den)}</span></td>
              <td>{_pgN(ln.comply.pending)}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="scpager">
        <button disabled={pg <= 0} onClick={() => setPage(pg - 1)}>‹ 이전</button>
        {/* 격자의 분모는 **ⓘ협력업체 축 조항**이다 — ⓠ 조항은 아래 별 띠에서 조항 1건으로 센다.
            전체 칸 수를 격자 분모로 적으면 보이지 않는 열이 있는 것으로 읽힌다.
            ⚠ 칸 수를 **여기서 곱하지 않는다**(2026-10-26). 종전에는 `V.partnerN * polIds.length` 로
              지면이 직접 곱해, 화면에 찍히는 칸 수를 어느 반환 필드도 소유하지 않았다. 조항군별
              분모는 판정 집계가 gridCellByGroup 으로 봉인해 돌려준다 — 지면은 조회만 한다. */}
        <span>{(pg + 1).toLocaleString()} / {pages.toLocaleString()} 페이지 · 전수 판정 레코드 {_pgN(V.partnerN)}행 × ⓘ{_pgN(polIds.length)}조항 = {_pgN(V.gridCellByGroup ? V.gridCellByGroup[grp] : null)}칸 · ⓠ당사 조항 {_pgN(selfPolIds.length)}건은 아래 띠</span>
        <button disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>다음 ›</button>
      </div>
      {selfPolIds.length ? (
        <div className="sctablewrap" style={{ marginTop: 10 }}>
          <table className="sctable"><thead><tr>
            <th>ⓠ 당사 조항 — 조항 1건 기준</th><th>조항</th><th>결정</th><th>원인</th><th>집행</th><th>영향 범위</th>
          </tr></thead><tbody>
            {selfPolIds.map((id) => {
              const bp = V.byPolicy[id];
              const ids = V.selfAxis && V.selfAxis.ids ? V.selfAxis.ids[id] : null;
              const rep = (V.byPartner[0] || {}).partnerId;
              return (
                <tr key={id} onClick={() => onCell && rep && onCell(rep, id)} style={{ cursor: "pointer" }}>
                  <td><b>당사</b><br /><span style={{ fontSize: 9, color: "#94A3B8" }}>{bp.title}</span></td>
                  <td>{id}<br /><span style={{ fontSize: 9, color: "#94A3B8" }}>{bp.lifecycle} · {bp.severity}</span></td>
                  <td style={{ color: PG_DEC_COLOR[ids === "혼재" ? "" : ids] || "#94A3B8", fontWeight: 800 }}>
                    {ids === "혼재" ? "협력업체별로 갈림" : _pgDecKo(ids)}</td>
                  <td>{bp.counts.DENY > 0 ? "규칙 위반" : (bp.counts.INDETERMINATE > 0 ? "판정 보류" : "—")}</td>
                  <td>{bp.enforce ? _pgEnfKo(bp.enforce.level) : "—"}</td>
                  <td>{_pgDeclText("selfAxisOnce")}</td>
                </tr>
              );
            })}
          </tbody></table>
        </div>
      ) : null}
      <div className="chnote" style={{ marginTop: 8 }}>
        칸 기호 — {Object.keys(PG_DEC_MARK).map((k) => <span key={k} style={{ marginRight: 10, color: PG_DEC_COLOR[k], fontWeight: 800 }}>{PG_DEC_MARK[k]} {_pgDecKo(k)}</span>)}
        · 준수율 분모 규약: {V.comply.denomRule}
      </div>
      <div className="chnote" style={{ marginTop: 6 }}>칸을 누르면 그 판정의 추적 지면(B5)이 다섯 레인으로 열립니다 — 규칙 · 입력 증거 · 결정 · 근거 문장 · 쓰이지 않은 입력.</div>
    </div>
  );
}

/* ── B6 시정 과제 — 무엇을 고치면 올라가는가. 재판정은 같은 판정기를 한 번 더 부른 결과다 ── */
function PGB6({ V, TR }) {
  const tr = TR;
  const bp = TR ? V.byPolicy[TR.policyId] : null;
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B6" ic={Workflow} />
      {!tr ? <div className="scempty">판정표의 칸을 누르면 그 조항의 시정 과제와 재판정 결과가 열립니다.</div> : (
        <div>
          <div className="chnote" style={{ marginTop: 8 }}>
            <b>{tr.dispName}</b> · {tr.policyId} {bp ? "· " + bp.title : ""} · {bp ? (bp.subject === "당사" ? "판정 대상 ⓠ당사" : "판정 대상 ⓘ협력업체") : ""}
            · 결정 <b style={{ color: PG_DEC_COLOR[tr.r.decision] }}>{_pgDecKo(tr.r.decision)}</b>
            {tr.r.cause ? <span> · 원인 {_pgCauseKo(tr.r.cause)}</span> : null}
            {tr.r.enforce ? <span> · 집행 {_pgEnfKo(tr.r.enforce.level)}({tr.r.enforce.pep})</span> : null}
          </div>
          {/* 사유 문장과 입력 증거는 **추적 지면(B5)** 의 레인 3 · 레인 1이 소유한다 — 같은 반환 필드를
              두 블록이 각자 꺼내 쓰면 한쪽만 고쳐지는 순간 두 지면이 다른 말을 한다. 여기는 과제 축이다. */}
          <div className="v360grid2" style={{ marginTop: 8 }}>
            <div className="v360sec">
              <b><ClipboardList size={12} /> 시정 과제</b>
              {(tr.r.remedy || []).length === 0 ? <div className="v360li">등재된 과제가 없습니다.</div>
                : (tr.r.remedy || []).map((rm, i) => (
                  <div className="v360li" key={i}>
                    {rm.what}
                    <span style={{ color: "#64748B" }}> · 소유자 {rm.owner} · 기한 {rm.due} · 상태 {rm.status}</span>
                  </div>
                ))}
              <div className="v360li" style={{ color: "#64748B" }}>
                {_pgDeclText(bp && bp.obligation ? "obligationYes" : "obligationNo")}
                {bp && bp.locked ? " · 잠금 조항(어떤 집행 수준으로도 열리지 않는다)" : ""}
              </div>
            </div>
            <div className="v360sec">
              <b><RotateCcw size={12} /> 재판정 — 증거를 채웠다고 가정</b>
              {tr.r.whatIf ? (
                <div>
                  <div className="v360li">결정 <b style={{ color: PG_DEC_COLOR[tr.r.whatIf.decision] }}>{_pgDecKo(tr.r.whatIf.decision)}</b>{tr.r.whatIf.cause ? " · 원인 " + _pgCauseKo(tr.r.whatIf.cause) : ""}</div>
                  <div className="v360li" style={{ color: "#64748B" }}>{tr.r.whatIf.assumed}</div>
                </div>
              ) : <div className="v360li">증거 미제출이 원인이 아니어서 재판정 산출이 없습니다.</div>}
              <div className="v360li" style={{ color: "#64748B" }}>가정 축 전개(단계 · 유형)와 하지 않는 가정은 추적 지면의 재판정 칸에 있습니다.</div>
            </div>
          </div>
          <div className="v360sec" style={{ marginTop: 8 }}>
            <b><Bell size={12} /> 통지 · 소명 · 재심</b>
            <div className="v360li">
              사전 통지 · 소명 접수 · 재심 이력이 없습니다 — <b>통지 없음</b>으로 적습니다.
              {tr.r.enforce && tr.r.enforce.exemption ? " · 면제 " + tr.r.enforce.exemption.reason + " · 승인 " + tr.r.enforce.exemption.approver + " · 만료 " + tr.r.enforce.exemption.expireAt : " · 등재된 면제 없음"}
            </div>
            <div className="v360li" style={{ color: "#64748B" }}>차단 이력은 전용 로그에서 읽습니다 — {V.enforce.available ? _pgN(V.enforce.blocked) + "건" : "집계 불가"}{V.enforce.available && V.enforce.blocked === 0 ? " · " + V.enforce.noBlock : ""}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 반출면 (P7 · §10-6 ①②③) ──────────────────────────────────────────────
   화면이 하는 일은 **사람이 누른 것을 반출 함수에 넘기고 반환 필드를 적는 것**뿐이다.
     ⓐ 렌더 중에는 아무것도 반출하지 않는다 — 반출은 집행에 쓰고 기록을 남기므로, 지면을 여는
        것만으로 기록이 불어나면 「반출 몇 건이었나」에 답할 수 없다.
     ⓑ 산출물 문자열 · 집행 사유 · 기록 여부는 전부 반환 필드다. 지면은 문장을 만들지 않는다.
     ⓒ textarea 의 클래스는 용어 원천의 상수다 — 보호 예외가 같은 상수를 읽는다. */
function PGExport({ V, level }) {
  const [open, setOpen] = useState(false);
  const [built, setBuilt] = useState(null);
  const [res, setRes] = useState(null);
  const ref = React.useRef(null);
  const cls = (typeof pgExportClass === "function") ? pgExportClass() : null;
  const run = (kind) => {
    const plan = pgExportPlan(V);
    if (!plan.available) { setRes({ ok: false, kind: kind, reasons: [], plan: plan }); return; }
    if (kind === "tsv") {
      const r = (typeof pgExportTsv === "function") ? pgExportTsv(plan.rows, plan.meta, { level: level }) : null;
      setBuilt(r && r.ok ? r.out : null);
      setOpen(!!(r && r.ok));
      setRes({ ok: !!(r && r.ok), kind: "tsv", reasons: (r && r.gate && r.gate.reasons) || [], plan: plan,
        lv: r && r.gate && r.gate.level, log: (r && r.log) || null });
      return;
    }
    const p = (typeof pgExportDoc === "function") ? pgExportDoc(plan.rows, plan.meta, { level: level }) : null;
    const o = (p && p.ok && typeof pgExportDocOpen === "function") ? pgExportDocOpen(p) : null;
    setRes({ ok: !!(p && p.ok), kind: "doc", reasons: (p && p.gate && p.gate.reasons) || [], plan: plan,
      lv: p && p.gate && p.gate.level, log: (o && o.log) || null, opened: !!(o && o.opened),
      openWhy: (o && o.why) || null, outside: (p && p.outside) || "" });
  };
  return (
    <div style={{ marginTop: 8 }}>
      <div className="ontchips">
        <button className="ontchip" onClick={() => run("tsv")}><Download size={11} /> 표 반출(화면 복사용)</button>
        <button className="ontchip" onClick={() => run("doc")}><FileText size={11} /> 문서 반출(인쇄)</button>
        {built ? <button className="ontchip" onClick={() => { try { ref.current.focus(); ref.current.select(); } catch (e) {} }}>전체 선택</button> : null}
        {built ? <button className="ontchip" onClick={() => setOpen(!open)}>{open ? "표 접기" : "표 펼치기"}</button> : null}
      </div>
      {res ? (
        <div className="v360li" style={{ marginTop: 6, color: res.ok ? "#15803D" : "#B91C1C" }}>
          {res.ok ? "반출 통과" : "반출 차단"} · {res.kind === "doc" ? "문서" : "표"} · 집행 수준 {String(res.lv || "—")} · {res.plan.scope}
          {res.log ? " · 열람 기록 " + res.log.ev + " 1행" : ""}
          {res.kind === "doc" && res.opened ? " · 인쇄 창 열림" : ""}
        </div>
      ) : null}
      {res && !res.ok ? (
        <div className="v360sec" style={{ marginTop: 4 }}>
          <b style={{ color: "#B91C1C" }}><Ban size={12} /> {_pgDeclText("exportBlocked")}</b>
          {res.reasons.map((w, i) => <div className="v360li" key={i} style={{ color: "#B91C1C" }}>· {w}</div>)}
        </div>
      ) : null}
      {res && res.kind === "doc" && res.openWhy ? <div className="v360li" style={{ color: "#B45309" }}>{res.openWhy}</div> : null}
      {res && res.kind === "doc" && res.outside ? <div className="v360li" style={{ color: "#64748B" }}>{res.outside}</div> : null}
      {open && built ? (
        <div style={{ marginTop: 6 }}>
          <textarea ref={ref} className={cls} readOnly value={built.text} />
          <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("exportClip")}</div>
          <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("exportLogged")}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ── B7 한계 · 반출 — 이 보고서가 말할 수 없는 것 ── */
function PGB7({ V, R, level, onEngine }) {
  const limit = (typeof PG_EXPORT_HEAD !== "undefined") ? PG_EXPORT_HEAD : [];
  const spec = pgExportSpec({ at: R.meta.asOf, level: level, scope: "전수", policyVer: V.policyVer, tableHash: V.policyHash }, "tsv");
  const views = (typeof PG_VIEW !== "undefined") ? PG_VIEW : [];
  return (
    <div className="ontpanel" style={{ marginTop: 12 }}>
      <PGBlockHead id="B7" ic={ShieldCheck} />
      <div className="chnote" style={{ marginTop: 8 }}><b>{limit.length > 1 ? limit[1].text : ""}</b></div>
      <div className="v360grid2" style={{ marginTop: 8 }}>
        <div className="v360sec">
          <b><Ban size={12} /> 법령 미확인 조항 — 집행 보류</b>
          <div className="v360li">{V.unverified.length ? V.unverified.join(" · ") : "미확인 없음"}</div>
          <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("unverified")} — 확인하지 못한 법으로는 어떤 집행 지점에서도 차단하지 않습니다. 조문 번호도 인쇄하지 않습니다.</div>
          <b style={{ marginTop: 8, display: "block" }}><Clock size={12} /> 시행 예정 조항</b>
          <div className="v360li">{V.notYet.length ? V.notYet.join(" · ") : "없음"} · {_pgDeclText("notYet")}</div>
          <b style={{ marginTop: 8, display: "block" }}><AlertTriangle size={12} /> 집행 유예 조항 · 잠금 조항</b>
          <div className="v360li">유예 {V.grace.length ? V.grace.join(" · ") : "없음"} · 잠금 {V.locked.length ? V.locked.join(" · ") : "없음"}</div>
        </div>
        <div className="v360sec">
          <b><Database size={12} /> 미제출 필드 목록 — 비는 것이 목표 상태입니다</b>
          <div className="v360li">{_pgN(V.absentFields.length)}개 필드</div>
          <div className="ontchips">{V.absentFields.map((f) => <span className="ontchip" key={f.k} style={{ fontSize: 10 }}>{f.ko}</span>)}</div>
          <b style={{ marginTop: 8, display: "block" }}><Lock size={12} /> 집행 · 차단</b>
          <div className="v360li">차단 {V.enforce.available ? _pgN(V.enforce.blocked) + "건" : "집계 불가"}{V.enforce.available && V.enforce.blocked === 0 ? " · " + V.enforce.noBlock : ""} · 면제 통과 {V.enforce.available ? _pgN(V.enforce.exempt) + "건" : "—"} · 소명 없이 집행된 건수 {_pgN(V.enforce.noDefense)}</div>
        </div>
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><KeyRound size={12} /> 열람 등급 · 데이터 경로 클램프</b>
        {views.map((vw) => (
          <div className="v360li" key={vw.lv} style={{ opacity: vw.now ? 1 : 0.6 }}>
            <b>{vw.lv} · {vw.ko}</b> — {vw.who} · {vw.how} · 볼 수 있는 것 {vw.see} · 볼 수 없는 것 {vw.hide}
            {vw.now ? null : <span style={{ color: "#B45309" }}> · 선행 조건: {vw.pre}</span>}
          </div>
        ))}
        <div className="v360li">현 등급 <b>{V.clamp.level}</b> — 이 등급에서 데이터 경로가 잘라내는 필드 {_pgN(V.clamp.n)}개{V.clamp.n ? ": " + V.clamp.drop.join(" · ") : " (내부통제 담당 등급은 잘라내지 않습니다)"}</div>
      </div>
      <div className="v360sec" style={{ marginTop: 10 }}>
        <b><Download size={12} /> 반출 규약</b>
        {(spec.head ? spec.head.lines : []).map((ln, i) => <div className="v360li" key={i}>{i + 1}. {ln}</div>)}
        <div className="v360li">반출 열 — {spec.cols.map((cl) => cl.ko).join(" · ")} · {_pgDeclText("exportNameOne")}</div>
        {spec.at.map((a) => <div className="v360li" key={a.at} style={{ color: "#64748B" }}>고지가 따라가는 자리 — {a.ko} · {a.by} · {a.rule}</div>)}
        <div className="v360li" style={{ color: "#64748B" }}>{spec.head ? _pgPlain(spec.head.rule) : ""}</div>
        <div className="v360li" style={{ color: "#B45309" }}>{spec.owner}</div>
        <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("exportFour")}</div>
        <PGExport V={V} level={level} />
      </div>
      <button className="ontchip" style={{ marginTop: 10 }} onClick={() => onEngine && onEngine()}>정책 · 판정 엔진 지면으로 ›</button>
    </div>
  );
}

/* ══ 보고서 지면 — 4유형 × 블록 행렬이 범위를 정한다 ══ */
function PartnerGovReport({ onEngine, focusPolicy }) {
  const [type, setType] = useState("PG-R");
  const [focus, setFocus] = useState(null);
  const [cell, setCell] = useState(null);
  const level = "L1";                       /* 열람 등급 — 화면 토글로 두지 않는다(관측이지 조작이 아니다) */
  const R = React.useMemo(() => pgRollup(), []);
  const V = React.useMemo(() => pgVerdictRoll({ level: level, type: type, stage: "거래중" }), [type]);
  const TYPES = (typeof PG_REPORT_TYPES !== "undefined") ? PG_REPORT_TYPES : [];
  const MX = (typeof PG_TYPE_BLOCKS !== "undefined") ? PG_TYPE_BLOCKS : [];
  const row = MX.filter((x) => x.type === type)[0] || null;
  const tdef = TYPES.filter((x) => x.id === type)[0] || null;
  /* 엔진 지면에서 넘어온 초점 — 조항만 오면 첫 행, 협력업체까지 오면 그 칸을 연다(양방향 링크 §11-4) */
  React.useEffect(() => {
    if (!focusPolicy) return;
    const pid = focusPolicy.partnerId || null;
    const polid = focusPolicy.policyId || focusPolicy;
    /* 협력업체까지 지목해 왔으면 그 칸, 조항만 왔으면 **대표 칸 규약**을 따른다(갈린 조항은 열지 않는다) */
    if (pid) { setCell({ partnerId: pid, policyId: polid }); return; }
    const t = _pgRepCell(V, polid);
    setCell(t);
  }, [focusPolicy]);
  /* ★ 추적과 재판정을 **한 번만** 계산해 B5 · B6 가 같은 반환값을 본다. 두 블록이 각자 부르면
     같은 판정을 두 번 내리고, 두 지면이 다른 말을 할 수 있는 길이 열린다. */
  const TR = React.useMemo(() => (cell ? pgTrace(cell.partnerId, cell.policyId, level) : null), [cell]);
  const WI = React.useMemo(() => (cell ? pgWhatIf(cell.partnerId, cell.policyId, level) : null), [cell]);
  if (!R || !V) return <div className="scempty">거래 사실 레이어를 읽지 못했습니다.</div>;
  return (
    <div data-pg-verdict="report">
      <div className="ontpanel">
        <div className="ontph"><FileText size={15} color="#22D3EE" /> 내부통제 보고서 <span>· {V.policyN}조항 × 판정 레코드 {_pgN(V.partnerN)}행 · 정책 {V.policyVer} · 해시 {V.policyHash}</span></div>
        <div className="aitabs" style={{ margin: "10px 0" }}>
          {TYPES.map((tp) => <div className={"aitab " + (type === tp.id ? "on" : "")} key={tp.id} onClick={() => { setType(tp.id); setCell(null); }}><ClipboardList size={14} /> {tp.id} {tp.ko}</div>)}
        </div>
        {tdef ? (
          <div className="chnote">
            <b>{tdef.id} · {tdef.ko}</b> — {tdef.when} · 모집단 {tdef.pop} · 단계 {tdef.stage} · 생애주기 {tdef.lifecycle.join(" · ")}
            <div style={{ marginTop: 4 }}>{tdef.note}</div>
          </div>
        ) : null}
        {row ? (
          <div className="ontchips" style={{ marginTop: 8 }}>
            {Object.keys(row.cells).map((bk) => {
              const cl = row.cells[bk];
              return <span className="ontchip" key={bk} title={cl[1] || ""} style={{ opacity: cl[0] === "해당없음" ? 0.6 : 1 }}>{bk} · {cl[0]}</span>;
            })}
          </div>
        ) : null}
      </div>

      <PGB1 R={R} V={V} />
      {/* ★ 조항 축 이동 — 「첫 협력업체 고정」을 버리고 **그 조항의 결정 분포에서 대표 칸을 고른다**
          (2026-10-26). 고정이던 동안 한 조항이라도 협력업체별로 갈리는 순간 「이 행의 수치」와
          「열린 추적의 칸」이 다른 말을 했다. 갈린 조항은 칸을 열지 않고 영향 협력업체 목록으로 보낸다. */}
      <PGB2 V={V} onPolicy={(id) => { const t = _pgRepCell(V, id); if (t) setCell(t); else if (onEngine) onEngine(id); }} />
      <PGB3 R={R} focus={focus} onFocus={setFocus} />
      <PGB4 V={V} focusCell={cell} onCell={(pid, polid) => setCell({ partnerId: pid, policyId: polid })} onFocus={setFocus} />
      <PGB5 TR={TR} W={WI} onEngine={(id) => onEngine && onEngine(id)} />
      <PGB6 V={V} TR={TR} />
      <PGB7 V={V} R={R} level={level} onEngine={onEngine} />
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   정책 · 판정 엔진 지면(서브탭 ⑤) — 7블록 (P5b · 지시서 §13-8 산출물 ① · §10-1)
   ══════════════════════════════════════════════════════════════════════════════
   ④와 ⑤를 떼어 놓지 않는 것이 설계의 핵심이다(§10-1). 그래서 이 지면은 **양방향**으로 잇는다:
     · 조항 행 → 보고서 판정표의 그 열(onReport)
     · 조항 행 → 「이 조항이 영향을 주는 협력업체 N곳」 → 그 칸의 추적 지면(이 지면 안에서 열린다)
     · 결정 로그 항목 → 그 판정의 추적 지면(보고서와 **같은** PGB5 컴포넌트)
   ★ 관측이지 조작이 아니다(§7-8) — 조항 신설 · 판정 기준 변경 · 집행 수준 하향 · 로그 삭제의
     입구를 두지 않는다. 열람 등급도 토글이 아니라 L1 고정이다.
   ★ 조문 번호는 여기서도 확인 등급 게이트를 지난 것만 인쇄된다 — 게이트는 pgLawRender 한 곳이고
     이 지면은 그 반환값의 label 을 찍을 뿐이다. */
function PartnerGovEngine({ onReport, focusPolicy }) {
  const level = "L1";
  const E = React.useMemo(() => pgEngineRoll({ level: level, stage: "거래중" }), []);
  const [open, setOpen] = useState(null);
  const [cell, setCell] = useState(null);
  const [grp, setGrp] = useState("ALL");
  const [lpage, setLpage] = useState(0);
  const [lawOpen, setLawOpen] = useState(null);
  React.useEffect(() => { if (focusPolicy) setOpen(focusPolicy.policyId || focusPolicy); }, [focusPolicy]);
  /* 추적과 재판정은 **한 번만** 계산해 같은 반환값을 본다(지면이 둘이면 추적이 둘이 된다). */
  const TR = React.useMemo(() => (cell ? pgTrace(cell.partnerId, cell.policyId, level) : null), [cell]);
  const WI = React.useMemo(() => (cell ? pgWhatIf(cell.partnerId, cell.policyId, level) : null), [cell]);
  if (!E) return <div className="scempty">정책 레지스트리를 읽지 못했습니다.</div>;
  const groups = (typeof PG_AXES !== "undefined") ? PG_AXES.group : [];
  const reg = E.registry.filter((p) => grp === "ALL" || p.group === grp);
  const PEPS = ["pep.register", "pep.settle", "pep.expose"];
  const lpages = Math.max(1, Math.ceil(E.log.rows.length / E.log.page));
  const lp = Math.min(lpage, lpages - 1);
  const lview = E.log.rows.slice(lp * E.log.page, lp * E.log.page + E.log.page);

  return (
    <div data-pg-verdict="engine">
      <div className="ontpanel">
        <div className="ontph"><ScrollText size={15} color="#A78BFA" /> 정책 · 판정 엔진 <span>· {_pgN(E.counts.policies)}조항 · 법령 · 표준 {_pgN(E.counts.laws)}항목 · 정책 {E.policyVer} · 해시 {E.policyHash}</span></div>
        <div className="ontchips" style={{ marginTop: 8 }}>
          {E.blocks.map((b) => <span className="ontchip" key={b.id} title={b.asks + " · " + b.from}>{b.id} · {b.ko}</span>)}
        </div>
        <div className="chnote" style={{ marginTop: 8 }}>※ {E.owner}</div>
        <div className="chnote" style={{ marginTop: 6 }}>※ {E.link}</div>
        <div className="chnote" style={{ marginTop: 6 }}>※ <b>법령 준수 판정은 자가점검 산출물이며 해당 기관의 실제 준수 여부를 뜻하지 않습니다.</b> 확인하지 못한 법령의 조문 번호는 화면·보고서에 인쇄하지 않습니다.</div>
      </div>

      {/* ── E1 정책 레지스트리 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E1" ic={ScrollText} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e1.policyN" val={_pgN(E.counts.policies) + "조항"} note={"잠금 " + _pgN(E.counts.locked) + " · 집행 유예 " + _pgN(E.counts.grace)} />
        </div>
        <div className="ontchips" style={{ marginTop: 8 }}>
          <span className={"ontchip" + (grp === "ALL" ? " on" : "")} onClick={() => setGrp("ALL")}>전체 {_pgN(E.registry.length)}</span>
          {groups.map((gr) => <span className={"ontchip" + (grp === gr[0] ? " on" : "")} key={gr[0]} onClick={() => setGrp(gr[0])}>{gr[0]} · {gr[1]}</span>)}
        </div>
        <div className="sctablewrap" style={{ marginTop: 8 }}>
          <table className="sctable"><thead><tr>
            <th>조항</th><th>통제군</th><th>판정 대상</th><th>생애주기</th><th>결함 등급</th><th>주기</th>
            <th>근거 법령</th><th>확인 등급</th><th>조항 시행일</th><th>집행 수준</th>
            <th title="ⓘ협력업체 조항은 판정 칸 수, ⓠ당사 조항은 조항 1건으로 셉니다 — 두 축을 한 분모로 읽지 않습니다">불허</th>
            <th title="ⓘ협력업체 조항은 판정 칸 수, ⓠ당사 조항은 조항 1건으로 셉니다">보류</th><th>영향</th>
          </tr></thead><tbody>
            {reg.map((p) => (
              <tr key={p.id} onClick={() => setOpen(open === p.id ? null : p.id)}
                style={{ cursor: "pointer", background: open === p.id ? "#F5F3FF" : undefined }}>
                <td><b>{p.id}</b> · {p.title}</td>
                <td>{p.group}</td>
                <td>{p.subject === "당사" ? "ⓠ당사" : "ⓘ협력업체"}</td>
                <td>{p.lifecycle}</td>
                <td>{p.severity}{p.obligation ? " · 의무" : " · 권고"}</td>
                <td>{p.cycle}</td>
                <td>{p.law.map((lr) => lr.label).join(" · ") || "근거 법령 미등재"}</td>
                <td style={{ color: p.verified === "원문확인" ? "#16A34A" : "#B45309", fontWeight: 800 }}>{p.verified || "미확인"}</td>
                <td>{p.effectiveDate || "—"}</td>
                <td>{p.enforce ? _pgEnfKo(p.enforce.level) : "—"}{p.locked ? " · 잠금" : ""}{p.grace ? " · 유예" : ""}</td>
                {/* ★ ⓠ당사 조항은 **조항 1건**으로 센다(2026-10-26). 칸 수로 세면 조항 1건이 모집단만큼
                    복제돼 「당사 책임 조항이 협력업체 결함으로」 읽힌다 — B2 · B4 · 반출물이 이미 가른 축이고
                    이 표만 칸 수를 적고 있었다(실측: L-10 불허 108 · 영향 108곳). 분포는 칸에서 오고 라벨만 가른다. */}
                <td>{!p.counts ? "—" : (p.subject === "당사"
                  ? (p.counts.DENY > 0 ? "조항 1건" : "0")
                  : _pgN(p.counts.DENY))}</td>
                <td>{!p.counts ? "—" : (p.subject === "당사"
                  ? (p.counts.INDETERMINATE > 0 ? "조항 1건" : "0")
                  : _pgN(p.counts.INDETERMINATE))}</td>
                <td>{p.subject === "당사" ? "당사" : (_pgN(p.affected.n) + "곳")}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        {open ? <PGERegCard E={E} id={open} onReport={onReport} onCell={setCell} /> : <div className="chnote" style={{ marginTop: 8 }}>조항 행을 누르면 결정 분포 · 시정 과제 · 영향받는 협력업체가 펼쳐집니다.</div>}
      </div>

      {/* ── E2 법령 · 표준 시행일표 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E2" ic={BookOpen} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e2.lawN" val={_pgN(E.counts.laws) + "항목"} note={Object.keys(E.verifiedMix).map((k) => k + " " + E.verifiedMix[k]).join(" · ")} />
          <PGEStat mid="e2.articleShown" val={_pgN(E.counts.articleShown) + " / " + _pgN(E.counts.articleAll) + "조문"} note="원문확인이 아닌 조문은 번호를 인쇄하지 않고 「조문 미확인」으로 적습니다" />
        </div>
        <div className="sctablewrap" style={{ marginTop: 8 }}>
          <table className="sctable"><thead><tr>
            <th>법령 · 표준</th><th>성질</th><th title="조문별 확인 등급의 최솟값입니다 — 하드 플로어는 조항이 대는 조문의 등급을 봅니다(행을 누르면 조문별로 펼쳐집니다)">확인 등급(조문 최소)</th><th>항목 시행일</th><th>현행 버전</th><th>제재</th><th>집행 유예</th><th>당사 수범</th><th>기대는 조항</th>
          </tr></thead><tbody>
            {E.laws.map((L) => (
              <tr key={L.id} onClick={() => setLawOpen(lawOpen === L.id ? null : L.id)}
                style={{ cursor: "pointer", opacity: (L.verified === "원문확인" && !L.effFuture) ? 1 : 0.78, background: lawOpen === L.id ? "#F5F3FF" : undefined }}>
                <td><b>{L.name}</b>{L.cite ? <span style={{ color: "#B45309" }}> · 판정 근거로 쓰지 않는 등재({L.cite})</span> : null}</td>
                <td>{L.basis}</td>
                <td style={{ color: L.verified === "원문확인" ? "#16A34A" : "#B45309", fontWeight: 800 }}>{L.verified}</td>
                <td style={{ color: (L.effFuture || L.effUnverified) ? "#B45309" : undefined, fontWeight: (L.effFuture || L.effUnverified) ? 800 : undefined }}>{L.effRender}</td>
                <td style={{ fontSize: 10 }}>{L.lawVersion || "미인쇄"}</td>
                <td>{_pgSanc(L.sanction).label}</td>
                <td>{L.grace ? "유예 중" : "—"}</td>
                <td>{L.appliesToSelf ? "ⓠ" : "—"}</td>
                <td>{L.usedBy.join(" · ") || "없음"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        {lawOpen ? <PGELawCard E={E} id={lawOpen} /> : <div className="chnote" style={{ marginTop: 8 }}>법령 행을 누르면 <b>조문별</b> 확인 등급 · 조문 시행일이 펼쳐집니다. 「확인 등급(조문 최소)」은 그 법령 <b>조문들의 최솟값</b>이고, 하드 플로어는 <b>조항이 이름으로 댄 조문</b>의 등급을 봅니다 — 조문을 대지 못한 조항은 그 법령이 원문확인이어도 불허를 내지 못합니다. 흐린 행은 ⓐ조문 최소 등급이 원문확인이 아닌 항목 또는 ⓑ항목 시행일이 기준일보다 뒤인 항목(「시행 예정」)입니다.</div>}
      </div>

      {/* ── E3 집행 테이블 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E3" ic={Lock} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e3.blocked" val={E.blockStats.available ? (_pgN(E.blockStats.total) + "건") : "집계 불가"}
            note={E.blockStats.available && E.blockStats.total === 0 ? _pgDeclText("noBlock") : ""} />
          <PGEStat mid="e3.floors" val={_pgN(E.flooredN) + "조항"} note="플로어가 걸린 조항 수 — 걸린 것이 없는 조항은 「—」" />
        </div>
        <div className="sctablewrap" style={{ marginTop: 8 }}>
          <table className="sctable"><thead><tr>
            <th>집행 지점</th><th>자리</th><th>막는 것</th><th>상한</th><th>소비자</th><th>기대 차단</th><th>실측 차단</th>
          </tr></thead><tbody>
            {E.pepRows.map((s) => (
              <tr key={s.pep}>
                <td><b>{s.pep}</b></td><td>{s.ko}</td><td>{s.blocks}</td><td>{_pgEnfKo(s.cap)}</td><td>{s.consumer}</td>
                <td>{s.expect === null ? "—" : String(s.expect)}<span style={{ fontSize: 9, color: "#94A3B8" }}> {s.expectWhy}</span></td>
                <td style={{ color: s.match === false ? "#DC2626" : undefined, fontWeight: s.match === false ? 800 : 600 }}>{s.got === null ? "—" : _pgN(s.got)}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div className="sctablewrap" style={{ marginTop: 8 }}>
          <table className="sctable"><thead><tr>
            <th>조항</th><th>판정 대상</th>
            {PEPS.map((pep) => <th key={pep}>{pep}<br /><span style={{ fontSize: 9, color: "#94A3B8" }}>실효 / 선언 / 상한</span></th>)}
            <th>수준을 내린 것</th>
          </tr></thead><tbody>
            {E.grid.map((g) => (
              <tr key={g.id}>
                <td><b>{g.id}</b> · {g.title}{g.locked ? <span style={{ color: "#B45309" }}> · 잠금</span> : null}</td>
                <td>{g.subject === "당사" ? "ⓠ당사" : "ⓘ협력업체"}</td>
                {PEPS.map((pep) => {
                  const c = g.cells[pep] || {};
                  return (
                    <td key={pep} style={{ textAlign: "center" }}>
                      <b>{_pgEnfKo(c.level)}</b><br />
                      <span style={{ fontSize: 9, color: "#94A3B8" }}>{_pgEnfKo(c.declared)} / {_pgEnfKo(c.cap)}</span>
                    </td>
                  );
                })}
                <td style={{ fontSize: 10, color: "#B45309" }}>{g.floorNames.join(" / ") || "—"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Download size={12} /> 반출 지점은 별 행입니다</b>
          <div className="v360li">pep.export — 실효 <b>{E.exportLevel ? _pgEnfKo(E.exportLevel.level) : "—"}</b> · 선언 {E.exportLevel ? _pgEnfKo(E.exportLevel.declared) : "—"} · 상한 {E.exportLevel ? _pgEnfKo(E.exportLevel.cap) : "—"}</div>
          {((E.exportLevel && E.exportLevel.floors) || []).map((f, i) => <div className="v360li" key={i} style={{ color: "#64748B" }}>{f}</div>)}
          <div className="v360li" style={{ color: "#64748B" }}>조항 지점의 승격 플로어를 반출 지점에 적용하지 않습니다 — 이 지점이 막는 것은 남의 거래가 아니라 우리 자신의 반출물입니다.</div>
        </div>
      </div>

      {/* ── E4 면제 현황 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E4" ic={KeyRound} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e4.exemptN" val={E.exempt.n ? (_pgN(E.exempt.n) + "건") : E.exempt.none}
            note={E.exempt.n ? ("유효 " + _pgN(E.exempt.valid) + " · 만료 임박 " + _pgN(E.exempt.soon) + " · 만료 경과 " + _pgN(E.exempt.expired)) : ""} />
          <PGEStat mid="e4.exemptPass" val={E.exempt.pass === null ? "집계 불가" : (_pgN(E.exempt.pass) + "건")}
            note={E.exempt.pass === 0 ? "면제로 지난 것 없음" : ""} />
        </div>
        {E.exempt.n ? (
          <div className="sctablewrap" style={{ marginTop: 8 }}>
            <table className="sctable"><thead><tr>
              <th>조항</th><th>대상</th><th>사유</th><th>승인자</th><th>승인일</th><th>만료일</th><th>상태</th><th>경로</th>
            </tr></thead><tbody>
              {E.exempt.rows.map((x, i) => (
                <tr key={i} style={{ color: (x.state === "만료 임박" || x.state === "만료 경과") ? "#DC2626" : undefined, fontWeight: x.state === "유효" ? 600 : 800 }}>
                  <td><b>{x.policyId}</b> · {x.title}</td><td>{x.partnerId}</td><td>{x.reason}</td>
                  <td>{x.approver}</td><td>{x.approvedAt || "—"}</td><td>{x.expireAt}</td>
                  <td>{x.state}{x.monthsLeft === null ? "" : " · 남은 개월 " + x.monthsLeft}</td><td>{x.via}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : null}
        <div className="chnote" style={{ marginTop: 8 }}>※ 만료일 없는 면제는 <b>등록 자체를 거부</b>합니다. 만료가 지나면 되살리지 않고 차단으로 복귀합니다 — 그것이 자동 복귀의 실체입니다. 만료까지 {E.exempt.warnMonths}개월 이하면 적색으로 적습니다(표시 기준이고 판정 임계가 아닙니다).</div>
        <div className="chnote" style={{ marginTop: 6 }}>※ 잠금 조항은 면제를 등록할 수 없습니다 — {E.exempt.lockedPolicies.join(" · ") || "잠금 조항 없음"}. 이 지면에 면제 등록 입구를 두지 않습니다(관측이지 조작이 아닙니다).</div>
      </div>

      {/* ── E5 결정 로그 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E5" ic={Server} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e5.logN" val={E.log.n ? (_pgN(E.log.n) + "건") : E.log.none}
            note={E.log.n ? ("차단 " + _pgN(E.log.blocked) + " · 면제 통과 " + _pgN(E.log.exempted) + " · 감사 기록 " + _pgN(E.log.auditN)) : ""} />
          <PGEStat mid="e5.actorMix" val={Object.keys(E.log.actorMix).length ? Object.keys(E.log.actorMix).map((k) => k + " " + E.log.actorMix[k]).join(" · ") : E.log.none} />
        </div>
        <div className="v360li" style={{ color: "#64748B" }}>행위자 유형 — {E.log.actorKinds.map((k) => k.k + "(" + k.ko + ")" + (k.exists ? "" : " · 주체 미신설")).join(" · ")} · 기록되는 행위 {E.log.actions.join(" · ")}</div>
        <div className="v360li" style={{ color: "#64748B" }}>payload 접기 — {E.log.map.map((m) => m.to + " ← " + m.from).join(" · ")} · 사유 문장은 로그에 싣지 않습니다(판정기가 보유합니다)</div>
        {E.log.n ? (
          <div>
            <div className="sctablewrap" style={{ marginTop: 8 }}>
              <table className="sctable"><thead><tr>
                <th>순번</th><th>기준일</th><th>구분</th><th>조항</th><th>집행 지점</th><th>원인</th><th>주체(코드 표기)</th><th>수준</th><th>추적</th>
              </tr></thead><tbody>
                {lview.map((r) => (
                  <tr key={r.seq} onClick={() => { if (r.traceable && r.policyId) setCell({ partnerId: r.src, policyId: r.policyId }); }}
                    style={{ cursor: r.traceable ? "pointer" : "default" }}>
                    <td>{r.seq}</td><td>{r.at}</td>
                    <td style={{ color: r.name === "pg_blocked" ? "#DC2626" : "#B45309", fontWeight: 800 }}>{r.name === "pg_blocked" ? "차단" : "면제 통과"}</td>
                    <td>{r.policyId || "—"}</td><td>{r.pep || "—"}</td><td>{r.causeKo || r.cause || "—"}</td>
                    <td>{r.src || "—"}{r.kindOf ? <span style={{ fontSize: 9, color: "#94A3B8" }}> · {r.kindOf}</span> : null}</td>
                    <td>{_pgEnfKo(r.level)}</td>
                    <td>{r.traceable ? "추적 ›" : <span style={{ fontSize: 10, color: "#94A3B8" }}>모집단 밖</span>}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
            <div className="scpager">
              <button disabled={lp <= 0} onClick={() => setLpage(lp - 1)}>‹ 이전</button>
              <span>{(lp + 1).toLocaleString()} / {lpages.toLocaleString()} 페이지 · 전체 {_pgN(E.log.n)}건</span>
              <button disabled={lp >= lpages - 1} onClick={() => setLpage(lp + 1)}>다음 ›</button>
            </div>
            <div className="chnote" style={{ marginTop: 6 }}>※ {E.log.untraceable}</div>
          </div>
        ) : <div className="chnote" style={{ marginTop: 8 }}>※ {E.log.none}</div>}
        {E.log.auditN ? (
          <div className="v360sec" style={{ marginTop: 8 }}>
            <b><Fingerprint size={12} /> 감사 기록 — 사람 승인과 시스템 판정을 가릅니다</b>
            {E.log.audit.slice(0, 12).map((a, i) => (
              <div className="v360li" key={i}>{a.ts} · {a.actor}{a.actorKind ? "(" + a.actorKind + ")" : ""} · {a.action} · 대상 {a.target} · 결과 {a.result} · 위험 {a.risk}{a.via ? " · 경로 " + a.via : ""}</div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── E6 예정 적용 조항 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E6" ic={Clock} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e6.notYetN" val={_pgN(E.counts.notYet) + "조항"} note="「해당 없음」과 섞지 않습니다 — 원인이 다릅니다" />
          {/* ★ 조항 축과 법령 축을 가른 한 줄 — 「시행 예정 조항 없음」이라고 단정하지 않는다(2026-10-26).
              수치는 지면이 세지 않고 pgEngineRoll 반환 필드에서 온다(§10-4 규약 4). */}
          <PGEStat mid="e6.pendingLawN" val={_pgN(E.counts.pendingLaws) + "법령"} note={E.notYetSplit} />
        </div>
        {E.pendingLaws.length ? (
          <div className="sctablewrap" style={{ marginTop: 8 }}>
            <table className="sctable"><thead><tr><th>법령</th><th>개정</th><th>공포 법률번호</th><th>시행일</th><th>조문 사정권</th><th>확인 등급</th><th>판정 사용</th></tr></thead><tbody>
              {E.pendingLaws.map((L) => (
                <tr key={L.id} style={{ opacity: 0.78 }}>
                  <td><b>{L.name}</b></td><td>{L.kind || "—"}</td><td>{L.lawNo || "—"}</td>
                  {/* 미도래 개정의 시행일은 **개정 자신의 시행일**이다(법령 항목 시행일과 다른 축) */}
                  <td style={{ color: "#B45309", fontWeight: 800 }}>{L.effectiveDate ? (L.effectiveDate + " · " + _pgDeclText("effPlanned")) : "—"}</td>
                  <td>{L.scope}</td><td>{L.verified}</td>
                  <td>{L.render}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : null}
        {E.notYet.length ? (
          <div className="sctablewrap" style={{ marginTop: 8 }}>
            <table className="sctable"><thead><tr><th>조항</th><th>조항 시행일</th><th>근거 법령</th><th>확인 등급</th><th>제재</th><th>유형 해당성</th><th>도래 시</th></tr></thead><tbody>
              {E.notYet.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.id}</b> · {p.title}</td><td>{p.effectiveDate || "—"}</td>
                  <td>{p.law.map((lr) => lr.label).join(" · ") || "근거 법령 미등재"}</td>
                  <td>{p.verified || "미확인"}</td><td>{_pgSanc(p.sanction).label}</td>
                  <td>{p.appliesTo.join(" · ")}</td><td>{p.render}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : <div className="chnote" style={{ marginTop: 8 }}>{E.notYetSplit}</div>}
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Ban size={12} /> 근거 법령 미확인으로 집행이 보류된 조항 — 별 목록입니다</b>
          <div className="v360li">{_pgN(E.counts.unverified)}조항 · {E.unverified.map((p) => p.id).join(" · ") || "없음"}</div>
          <div className="v360li" style={{ color: "#64748B" }}>{_pgDeclText("unverified")} — 확인하지 못한 법으로는 어떤 집행 지점에서도 차단하지 않고 조문 번호도 인쇄하지 않습니다. 「시행 전」과 다른 사실입니다.</div>
        </div>
      </div>

      {/* ── E7 방법론 ── */}
      <div className="ontpanel" style={{ marginTop: 12 }}>
        <PGEHead id="E7" ic={Gauge} />
        <div className="v360sec" style={{ marginTop: 8 }}>
          <PGEStat mid="e7.ruleN" val={_pgN(E.method.ruleN) + "항목"}
            note={"수치 " + E.method.numRule.length + " · 원천 " + E.method.src.length + " · 플로어 " + E.method.floor.length + " · 집행 효과 " + E.method.stageEffect.length + " · 추적 " + E.method.traceRule.length + " · 가정 " + E.method.whatIf.length + " · 하지 않는 가정 " + E.method.whatIfForbid.length} />
        </div>
        <div className="v360grid2" style={{ marginTop: 8 }}>
          <div className="v360sec">
            <b><Hash size={12} /> 수치 정의 규약</b>
            {E.method.numRule.map((r) => <div className="v360li" key={r.n}>{r.n}. <b>{_pgPlain(r.rule)}</b> — {_pgPlain(r.how)}</div>)}
            <b style={{ marginTop: 8, display: "block" }}><Percent size={12} /> 준수율 분모 규약</b>
            {E.method.denom ? (
              <div>
                <div className="v360li">분자 — {E.method.denom.compliance.numer}</div>
                <div className="v360li">분모 — {E.method.denom.compliance.denom}</div>
                <div className="v360li">분모 0 — {E.method.denom.compliance.zero}</div>
                <div className="v360li" style={{ color: "#64748B" }}>{_pgPlain(E.method.denom.compliance.why)}</div>
                <div className="v360li" style={{ color: "#64748B" }}>결함 — {E.method.denom.defect.note} · 존재/기능 — {E.method.denom.presentFunctioning.note}</div>
              </div>
            ) : null}
          </div>
          <div className="v360sec">
            <b><Route size={12} /> 허용 원천 접두사 — 「화면이 계산한다」는 경로가 없습니다</b>
            {E.method.src.map((s) => <div className="v360li" key={s.p}><b>{s.p}</b> {s.ko} <span style={{ color: "#64748B" }}>· 소유 {s.owner}{s.limit ? " · " + s.limit : ""}</span></div>)}
            <b style={{ marginTop: 8, display: "block" }}><BookOpen size={12} /> 법령 성질 축</b>
            <div className="v360li" style={{ color: "#64748B" }}>{E.method.basis.map((b) => b[0] + "(" + b[1] + ")").join(" · ")}</div>
          </div>
        </div>
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Ban size={12} /> 하드 플로어 — 확인하지 못한 법으로 위반을 적지 않습니다</b>
          {E.method.floor.map((f, i) => <div className="v360li" key={i}><b>{f.cond}</b> → {f.result} <span style={{ color: "#64748B" }}>· {f.why}</span></div>)}
          <div className="v360li" style={{ color: "#64748B" }}>이 네 줄은 규약 선언이고, 조항마다 <b>실제로 걸린 플로어</b>는 추적 지면 4레인이 집행 반환 필드에서 이름으로 돌려줍니다.</div>
        </div>
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Zap size={12} /> 온보딩 단계 × 원인의 집행 효과</b>
          <div className="sctablewrap">
            <table className="sctable"><thead><tr><th>원인</th><th>단계</th><th>차단</th><th>수준</th><th>시정 과제</th><th>렌더 문구</th><th>왜</th></tr></thead><tbody>
              {E.method.stageEffect.map((e, i) => (
                <tr key={i}>
                  <td>{e.grace ? "집행 유예 동반" : (_pgCauseKo(e.cause) || e.cause)}</td><td>{e.stage}</td>
                  <td>{e.block ? "차단" : "차단 없음"}</td><td>{e.level === null ? "집행 대상 아님" : String(e.level)}</td>
                  <td>{e.remedy ? "생성" : "—"}</td><td>{e.render}</td><td style={{ fontSize: 10, color: "#64748B" }}>{e.why}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
        <div className="v360grid2" style={{ marginTop: 8 }}>
          <div className="v360sec">
            <b><KeyRound size={12} /> 열람 등급 클램프 규약</b>
            <div className="v360li">{E.method.clamp ? E.method.clamp.sig : "—"}</div>
            {(E.method.clamp ? E.method.clamp.rules : []).map((r, i) => <div className="v360li" key={i} style={{ color: "#64748B" }}>· {_pgPlain(r)}</div>)}
            <div className="v360li">네 경로 — {(E.method.clamp ? E.method.clamp.paths : []).join(" · ")}</div>
            {E.method.view.map((v) => <div className="v360li" key={v.lv} style={{ opacity: v.now ? 1 : 0.6 }}><b>{v.lv} · {v.ko}</b> — {v.who}{v.now ? "" : " · 선행 조건: " + v.pre}{v.test ? <span style={{ color: "#64748B" }}> · 검증 {_pgPlain(v.test)}</span> : null}</div>)}
          </div>
          <div className="v360sec">
            <b><GitBranch size={12} /> 추적 지면 규약과 가정 축</b>
            {E.method.traceRule.map((r) => <div className="v360li" key={r.n}>{r.n}. <b>{r.ko}</b> — {_pgPlain(r.rule)} <span style={{ color: "#94A3B8" }}>(검사 {r.owner})</span></div>)}
            {E.method.lanes.map((l) => <div className="v360li" key={l.n} style={{ color: "#64748B" }}>레인 {l.n} {l.ko} — {l.from}</div>)}
            {E.method.whatIf.map((a) => <div className="v360li" key={a.k}><b>{a.ko}</b> — {a.how} <span style={{ color: "#94A3B8" }}>({a.from})</span></div>)}
            {E.method.whatIfForbid.map((f) => <div className="v360li" key={f.k} style={{ color: "#64748B" }}>하지 않는 가정 · {f.ko} — {f.why}</div>)}
            <div className="v360li" style={{ marginTop: 6 }}>{E.method.determinism}</div>
          </div>
        </div>
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><Handshake size={12} /> 집행 설계를 규율하는 법령에 대응하는 당사 장치</b>
          {E.method.selfEnforce.map((s, i) => <div className="v360li" key={i}><b>{s.where}</b> — {s.cap} <span style={{ color: "#64748B" }}>· {s.why}</span></div>)}
        </div>
        <div className="v360sec" style={{ marginTop: 8 }}>
          <b><ShieldCheck size={12} /> 선언 전수 검사 — 지면이 스스로를 센 결과입니다</b>
          <div className="v360li">엔진 지면 · 추적 규약 · 가정 축 위반 {_pgN(E.method.audit.length)}건{E.method.audit.length ? " — " + E.method.audit.map((b) => b.id + "(" + b.why + ")").join(" · ") : ""}</div>
          <div className="v360li">보고서 지면 계약 위반 {_pgN(E.method.reportAudit.length)}건 · 수치 정의 위반 {_pgN(E.method.metricAudit.length)}건</div>
        </div>
      </div>

      {/* ── 추적 지면 — 보고서와 **같은 컴포넌트**다. 지면이 둘이면 추적이 둘이 된다 ── */}
      {cell ? (
        <div className="ontpanel" style={{ marginTop: 12 }}>
          <div className="ontph"><GitBranch size={15} color="#A78BFA" /> 추적 — {cell.policyId} <span>· 조항 레지스트리 · 결정 로그에서 들어온 역추적입니다</span></div>
          <PGB5 TR={TR} W={WI} head={false} onEngine={(id) => setOpen(id)} />
          <button className="ontchip" onClick={() => setCell(null)}>추적 닫기</button>
          <button className="ontchip" style={{ marginLeft: 6 }} onClick={() => onReport && onReport({ policyId: cell.policyId, partnerId: cell.partnerId })}>보고서 판정표의 이 칸으로 ›</button>
        </div>
      ) : null}
    </div>
  );
}

/* 조항 카드 — E1 의 펼친 행. 양방향 링크의 한쪽 끝이다(조항 → 판정표 열 · 조항 → 그 칸의 추적). */
function PGERegCard({ E, id, onReport, onCell }) {
  const p = E.registry.filter((x) => x.id === id)[0];
  if (!p) return null;
  return (
    <div className="v360sec" style={{ marginTop: 10, borderLeft: "3px solid #A78BFA", paddingLeft: 10 }}>
      <b><ScrollText size={12} /> {p.id} · {p.title}</b>
      <div className="v360li">유형 해당성 {p.appliesTo.join(" · ") || "—"} · 판정 분기 {p.ruleId}
        {p.contractBasis ? <span style={{ color: "#64748B" }}> · 계약 조항 근거 {p.contractBasis}</span> : <span style={{ color: "#B45309" }}> · 계약 조항 근거 미기재 — 승격 불가</span>}</div>
      {p.note ? <div className="v360li" style={{ color: "#64748B" }}>{p.note}</div> : null}
      <PGEStat mid="e1.decisionMix" val={p.counts ? ("허용 " + _pgN(p.counts.PERMIT) + " · 불허 " + _pgN(p.counts.DENY) + " · 보류 " + _pgN(p.counts.INDETERMINATE) + " · 해당 없음 " + _pgN(p.counts.NOT_APPLICABLE)) : "—"}
        note={p.comply ? ("준수율 " + _pgPct(p.comply.rate) + " / 분모 " + _pgN(p.comply.den)) : ""} />
      <PGEStat mid="e1.affected" val={_pgN(p.affected.n) + "곳"} note={"그중 판정이 선 행 " + _pgN(p.affected.judged) + "곳"} />
      <div className="v360li">시정 과제 — {p.remedy.length ? p.remedy.map((rm) => rm.what).join(" · ") : "등재된 과제 없음"}</div>
      <div className="v360li">필요한 증거 — {p.evidence.join(" · ") || "—"}</div>
      <div style={{ marginTop: 6 }}>
        <button className="ontchip" onClick={() => onReport && onReport({ policyId: p.id })}>보고서 판정표의 이 열로 ›</button>
      </div>
      <div className="v360li" style={{ marginTop: 6, color: "#64748B" }}>이 조항이 영향을 주는 협력업체 — 누르면 그 칸의 추적 지면이 열립니다</div>
      <div className="ontchips">
        {p.affected.rows.slice(0, 24).map((rw) => (
          <span className="ontchip" key={rw.partnerId} title={rw.code + " · " + _pgDecKo(rw.d)}
            style={{ color: PG_DEC_COLOR[rw.d] }}
            onClick={() => onCell && onCell({ partnerId: rw.partnerId, policyId: p.id })}>
            {PG_DEC_MARK[rw.d]} {rw.dispName}
          </span>
        ))}
      </div>
      {p.affected.rows.length > 24 ? <div className="v360li" style={{ color: "#64748B" }}>앞 24곳만 보입니다 — 전수는 보고서 판정표의 이 열입니다({_pgN(p.affected.rows.length)}곳).</div> : null}
    </div>
  );
}

/* 법령 카드 — E2 의 펼친 행. 조문 번호는 확인 등급 게이트를 지난 label 만 찍는다. */
function PGELawCard({ E, id }) {
  const L = E.laws.filter((x) => x.id === id)[0];
  if (!L) return null;
  return (
    <div className="v360sec" style={{ marginTop: 10, borderLeft: "3px solid #A78BFA", paddingLeft: 10 }}>
      <b><BookOpen size={12} /> {L.name}</b>
      {L.note ? <div className="v360li" style={{ color: "#64748B" }}>{L.note}</div> : null}
      {L.articles.length === 0 ? <div className="v360li">조문 하위표가 없는 항목입니다 — 확인 등급과 시행일을 항목 수준에 둡니다.</div>
        : L.articles.map((a) => (
          <div className="v360li" key={a.key} style={{ opacity: a.verified === "원문확인" ? 1 : 0.7 }}>
            <b>{a.label}</b> <span style={{ color: a.verified === "원문확인" ? "#16A34A" : "#B45309", fontWeight: 800 }}>{a.verified}</span>
            {a.effectiveDate ? <span style={{ color: "#64748B" }}> · 시행 {a.effectiveDate}</span> : <span style={{ color: "#B45309" }}> · 조문 시행일 미기재</span>}
            {a.note ? <div style={{ color: "#64748B", fontSize: 11 }}>{a.note}</div> : null}
          </div>
        ))}
      {L.sanction ? <div className="v360li" style={{ color: "#64748B" }}>제재 축 — {_pgSanc(L.sanction).label} · 확인 등급 {_pgSanc(L.sanction).verified}{L.sanction.note ? " · " + L.sanction.note : ""}</div> : null}
      {L.grace ? <div className="v360li" style={{ color: "#B45309", fontWeight: 800 }}>법정 의무이나 소관 부처 집행 유예 중{L.grace.note ? " — " + L.grace.note : ""}</div> : null}
      <div className="v360li">이 법령에 기대는 조항 — {L.usedBy.join(" · ") || "없음"}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   AI 거버넌스 축 — 네 블록 (P6 · 지시서 §8 · §13-9)
   ══════════════════════════════════════════════════════════════════════════════
   이 컴포넌트는 **렌더만** 한다. 축 · 기준 · 항목 · 액션의 선언은 src/data/partnerAI.js 가 소유하고,
   수치 · 확인 등급 · 실측값은 전부 pgAiRoll() · pgAgentRoll() · pgSelfGovRoll() 반환 필드다.
   ★ 왜 서브탭 ①(개요 · 객체)에 두는가: 책임 AI 에이전트 카드가 이미 거기 있고, 이 축은 그 카드가
     무엇을 할 수 있고 무엇을 할 수 없는지를 정한다. 판정 규칙 축(서브탭 ⑤)의 7블록 표에 넣으면
     4유형 × 7블록 행렬과 수치 전수 검사의 분모가 어긋난다(P5b 가 같은 사유로 표를 갈랐다).
   ★ 왜 이 파일에 두는가: 이 파일이 판정 지면 등록부(PG_VERDICT)에 verdict 로 등재돼 있어
     조항 id 렌더와 이름 렌더가 **이미 감시 안**이다. 새 컴포넌트 파일을 만들면 감시 밖에서 신설된
     판정 지면이 되고, 그 경로를 닫는 것이 run_wording_guard 검사 ⑭의 목적이다.
   ★ 조작 입구를 만들지 않는다 — 조항 신설 · 판정 기준 변경 · 집행 수준 하향 · 로그 삭제 ·
     열람 등급 상향의 버튼이 0개다. 승인 입구는 세우되 **승인 신원이 없으므로 눌리지 않는다**. */

/* 수치 한 칸 — 보고서 · 엔진 쪽과 같은 모양이고 읽는 표만 다르다.
   선언에 없는 수치를 조용히 빠뜨리지 않는다(빈 칸은 「없다」와 「선언을 안 했다」를 섞는다). */
function PGAIStat({ mid, val, note }) {
  const M = (typeof pgAiMetric === "function") ? pgAiMetric(mid) : null;
  if (!M) return <div className="v360li" style={{ color: "#DC2626", fontWeight: 800 }}>수치 정의가 선언 테이블에 없습니다 — {mid}</div>;
  return (
    <div className="v360li" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ minWidth: 150, fontWeight: 800, color: "#334155" }}>{M.ko}</span>
      <b style={{ color: "#0F172A" }}>{val}</b>
      <PGGrade g={M.grade} />
      {note ? <span style={{ fontSize: 11, color: "#64748B" }}>{note}</span> : null}
      <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto" }}>{M.from}</span>
    </div>
  );
}
/* 블록 머리 — 표제 · 질문을 선언 테이블에서 읽는다(컴포넌트에 낱말을 적지 않는다). */
function PGAIHead({ id, ic }) {
  const B = (typeof pgAiBlock === "function") ? pgAiBlock(id) : null;
  if (!B) return null;
  const Ic = ic || Bot;
  return (
    <div className="ontph" style={{ marginTop: 2 }}>
      <Ic size={15} color="#F472B6" /> {B.id}. {B.ko}
      <span>· {B.asks}</span>
    </div>
  );
}
/* 확인 등급 배지 — 원문확인만 초록이다. 색이 등급을 말하므로 등급 없는 칸이 설 수 없다. */
function PGVerif({ v }) {
  const c = v === "원문확인" ? "#16A34A" : v === "부분확인" ? "#B45309" : "#DC2626";
  return <span style={{ fontSize: 10.5, fontWeight: 800, color: c, border: "1px solid " + c + "66", borderRadius: 6, padding: "1px 5px" }}>{v}</span>;
}
/* 실측값 한 칸의 표기 — 배열 · 객체를 지면이 문장으로 바꾸지 않고 그대로 펼친다 */
function _pgAiShow(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "예" : "아니오";
  /* ⚠ 배열 안의 객체를 join 하면 「[object Object]」가 지면에 찍힌다(실측으로 찍혔다) — 한 겹 더 펼친다 */
  if (Array.isArray(v)) return v.length === 0 ? "없음" : v.map((x) => _pgAiShow(x)).join(" / ");
  if (typeof v === "object") return Object.keys(v).map((k) => k + "=" + _pgAiShow(v[k])).join(",") || "없음";
  return _pgPlain(String(v));
}

function PartnerAIGov() {
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState([]);
  const R = React.useMemo(() => ((typeof pgAiRoll === "function") ? pgAiRoll() : null), [tick]);
  const A = React.useMemo(() => ((typeof pgAgentRoll === "function") ? pgAgentRoll({}) : null), [tick]);
  const S = React.useMemo(() => ((typeof pgSelfGovRoll === "function") ? pgSelfGovRoll({}) : null), [tick]);
  const D = (k) => ((typeof pgAiDecl === "function") ? pgAiDecl(k) : "");
  if (!R || !A || !S) return null;
  const audit = (typeof pgAiAudit === "function") ? pgAiAudit() : [];
  /* 액션 요청 — 렌더가 아니라 **누름**에서만 일어난다(판정 호출이 결정 로그에 쓰인다) */
  const fire = (agentId, actId) => {
    if (typeof pgAgentRun !== "function") return;
    const r = pgAgentRun(agentId, actId, {});
    setLog((l) => [{ k: String(l.length + 1) + "|" + actId, r: r }].concat(l).slice(0, 8));
    setTick((t) => t + 1);
    if (typeof toast === "function") toast("🤖 " + (r.ko || actId) + " · " + (r.status || r.hint || ""));
  };

  return (
    <div className="ontpanel" style={{ marginTop: 12 }} data-pg-ai="1">
      <div className="ontph"><Bot size={15} color="#F472B6" /> AI 거버넌스 <span>· 협력업체 AI 점검 {R.axisN}축 · 자기 거버넌스 {S.govN}항목 · 기준 {R.stdN}종</span></div>
      <div className="chnote" style={{ marginBottom: 10 }}>※ {_pgPlain(R.twoWays)} {_pgPlain(D("agentOwner"))}</div>
      {audit.length > 0
        ? <div className="chnote" style={{ color: "#DC2626", fontWeight: 800 }}>선언 전수 검사 위반 {audit.length}건 — {audit.slice(0, 3).map((b) => b.id + ": " + b.why).join(" / ")}</div>
        : null}

      {/* ── AI1 협력업체 AI 점검 7축 ── */}
      <PGAIHead id="AI1" ic={ShieldCheck} />
      <div className="chnote" style={{ margin: "6px 0 8px" }}>※ {_pgPlain(R.owner)} {_pgPlain(R.numGate)}</div>
      <PGAIStat mid="ai1.axisN" val={R.axisN} />
      <PGAIStat mid="ai1.verifiedMix" val={Object.keys(R.verifiedMix).map((k) => k + " " + R.verifiedMix[k]).join(" · ")} />
      <PGAIStat mid="ai1.numShown" val={R.numShown + " / " + R.numHeld} note="번호 축을 가진 매핑 중 게이트를 지난 수" />
      <PGAIStat mid="ai1.evidenceN" val={R.evidenceN} note={"사전 미등재 축 " + R.gapN + "건"} />
      <PGAIStat mid="ai1.submitAbsent" val={R.submit.available ? (R.submit.absent + " / " + R.submit.cells) : "아직 없음"} note={R.submit.available ? null : R.submit.hint} />
      <PGAIStat mid="ai1.ctrlN" val={R.ctrlN || "원천 미적재"} note={R.ctrlAbsent} />
      {R.axes.map((ax) => (
        <div className="v360sec" key={ax.id} style={{ marginTop: 8, borderLeft: "3px solid #F472B6", paddingLeft: 10 }}>
          <b>{ax.id}. {ax.ko}</b> <PGVerif v={ax.verified} />
          <div className="v360li" style={{ color: "#64748B" }}>{_pgPlain(ax.sees)}</div>
          {/* ⚠ 루프 변수를 s · p · v 로 두지 않는다 — 이름 렌더 탐지기의 감시 목록이고, {s.name} 은
                 그 표가 법령명이어도 상호 직접 렌더로 잡힌다. 탐지기를 느슨하게 하는 대신 이름을 바꾼다. */}
          {ax.std.map((ref, i) => (
            <div className="v360li" key={i}>
              <b>{ref.name}</b> <PGVerif v={ref.verified} />
              <span style={{ color: "#334155" }}> · {_pgPlain(ref.objective)}</span>
              {ref.numLabel ? <span style={{ color: "#0E8FA6", fontWeight: 800 }}> · {ref.numLabel}</span> : null}
              {!ref.numLabel && ref.numGate ? <div style={{ fontSize: 11, color: "#B45309" }}>{_pgPlain(ref.numGate)}</div> : null}
              {ref.caution ? <div style={{ fontSize: 11, color: "#B45309" }}>{_pgPlain(ref.caution)}</div> : null}
              {ref.cite ? <span style={{ fontSize: 10, color: "#94A3B8" }}> · 참조 등재</span> : null}
            </div>
          ))}
          {ax.evidence.map((e) => (
            <div className="v360li" key={e.k} style={{ opacity: e.inDict ? 1 : 0.6 }}>
              <Hash size={10} /> {e.ko || e.k} — {e.why}
              <span style={{ fontWeight: 800, color: e.inDict ? "#B45309" : "#DC2626" }}> · {e.state}</span>
              {e.inDict && e.absent !== null ? <span style={{ color: "#64748B" }}> {e.absent} / {e.absent + e.have}</span> : null}
              {e.partial ? <div style={{ fontSize: 11, color: "#B45309" }}>{_pgPlain(e.partial)}</div> : null}
            </div>
          ))}
          {ax.gap ? <div className="v360li" style={{ color: "#B45309" }}>
            <AlertTriangle size={11} /> {_pgPlain(ax.gapText)}
            <div style={{ fontSize: 11 }}>{_pgPlain(ax.gap.why)} · 다음 단계 — {_pgPlain(ax.gap.next)} · 소유자 {ax.gap.owner}</div>
          </div> : null}
          {ax.reuse ? <div className="cmp-ctrl" style={{ marginTop: 6 }}>
            {ax.reuseItems.length === 0
              ? <div className="cmp-cli" style={{ color: "#DC2626" }}>{R.ctrlAbsent}</div>
              : ax.reuseItems.map((x) => <div className="cmp-cli" key={x}><ShieldCheck size={13} color="#34D399" /> {x}</div>)}
          </div> : null}
        </div>
      ))}

      {/* ── AI2 표준 · 법령 매핑표 ── */}
      <PGAIHead id="AI2" ic={BookOpen} />
      <PGAIStat mid="ai2.stdN" val={R.stdN} />
      <PGAIStat mid="ai2.selfN" val={R.selfN} note="적용 대상에 하이핀 자신이 포함된 기준" />
      <PGAIStat mid="ai2.articleShown" val={R.articleShown + " / " + R.articleAll} note="게이트를 지나지 않은 조문은 「조문 미확인」만 적는다" />
      {R.std.map((std) => (
        <div className="v360sec" key={std.lawId} style={{ marginTop: 8, borderLeft: "3px solid #A78BFA", paddingLeft: 10 }}>
          <b><BookOpen size={12} /> {std.name}</b> <PGVerif v={std.verified} />
          <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 800 }}> · {std.basis}</span>
          {std.appliesToSelf ? <span style={{ fontSize: 10.5, color: "#DC2626", fontWeight: 800 }}> · 우리도 수범자</span> : null}
          {std.cite ? <span style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 800 }}> · 참조 등재(판정 근거 아님)</span> : null}
          <div className="v360li">적용 대상 — {std.applies}</div>
          <div className="v360li" style={{ color: "#334155" }}>적용 범위 — {_pgPlain(std.range)}</div>
          {std.lawVersion ? <div className="v360li" style={{ color: "#64748B" }}>현행 — {std.lawVersion}</div> : null}
          {std.effectiveDate ? <div className="v360li" style={{ color: "#64748B" }}>시행 {std.effectiveDate}</div> : null}
          {(std.articles || []).map((a) => (
            <div className="v360li" key={a.key} style={{ opacity: a.verified === "원문확인" ? 1 : 0.7 }}>
              <b>{a.label}</b> <PGVerif v={a.verified} />
              {a.effectiveDate ? <span style={{ color: "#64748B" }}> · 시행 {a.effectiveDate}</span> : null}
              {a.note ? <div style={{ fontSize: 11, color: "#64748B" }}>{_pgPlain(a.note)}</div> : null}
            </div>
          ))}
          {std.sanction ? <div className="v360li" style={{ color: "#64748B" }}>제재 축 — {_pgSanc(std.sanction).label} · 확인 등급 {_pgSanc(std.sanction).verified}{std.sanction.note ? " · " + _pgPlain(std.sanction.note) : ""}</div> : null}
          {std.grace ? <div className="v360li" style={{ color: "#B45309", fontWeight: 800 }}>법정 의무이나 소관 부처 집행 유예 중{std.grace.note ? " — " + _pgPlain(std.grace.note) : ""}</div> : null}
          <div className="v360li" style={{ fontSize: 11, color: "#64748B" }}>{_pgPlain(std.why)}</div>
        </div>
      ))}

      {/* ── AI3 하이핀 자기 거버넌스 ── */}
      <PGAIHead id="AI3" ic={Fingerprint} />
      <div className="chnote" style={{ margin: "6px 0 8px" }}>※ {_pgPlain(S.owner)}</div>
      <PGAIStat mid="ai3.govN" val={S.govN} />
      <PGAIStat mid="ai3.lawBacked" val={S.lawBacked} note="나머지는 설계 규약이고 그 사실을 적는다" />
      {/* ★ 분자 · 분모를 **미계측과 가른다**(2026-10-26). 종전 「9 / 9」는 모집단 0인 항목까지 충족으로 셌다. */}
      <PGAIStat mid="ai3.measured" val={S.okN + " / " + S.measured} note={S.stateLine + (S.unmeasured ? " · 미계측 " + S.unmeasuredIds.join(" · ") : "")} />
      <PGAIStat mid="ai3.noticeN" val={S.noticeN} />
      {S.rows.map((g) => (
        <div className="v360sec" key={g.id} style={{ marginTop: 8, borderLeft: "3px solid " + (g.state === "미충족" ? "#DC2626" : g.state === "미계측" ? "#B45309" : g.basisKind === "법정 의무" ? "#DC2626" : "#22D3EE"), paddingLeft: 10 }}>
          <b>{g.id}. {g.ko}</b>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: g.basisKind === "법정 의무" ? "#DC2626" : "#0E8FA6" }}> · {g.basisKind}</span>
          {g.state === "충족" ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#16A34A" }}> · 실측 충족</span> : null}
          {g.state === "미충족" ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#DC2626" }}> · 실측 미충족</span> : null}
          {g.state === "미계측" ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B45309" }}> · 미계측(모집단 0)</span> : null}
          <div className="v360li" style={{ color: "#64748B" }}>검증 기준 — {_pgPlain(g.check)}</div>
          {g.unmeasuredWhy ? <div className="v360li" style={{ color: "#B45309", fontWeight: 800 }}>{_pgPlain(g.unmeasuredWhy)}{g.popKo ? " 모집단 축 — " + g.popKo : ""}</div> : null}
          <div className="v360li" style={{ fontSize: 11, color: "#64748B" }}>{_pgPlain(g.basisText)}</div>
          {g.law ? <div className="v360li"><BookOpen size={11} /> {g.law.label} <PGVerif v={g.law.verified} />
            {_pgSanc(g.law.sanction).has && !_pgSanc(g.law.sanction).none ? <span style={{ color: "#64748B" }}> · 제재 {_pgSanc(g.law.sanction).label} · 확인 등급 {_pgSanc(g.law.sanction).verified}</span> : null}
            {g.law.grace ? <span style={{ color: "#B45309", fontWeight: 800 }}> · 집행 유예 중</span> : null}
          </div> : null}
          {g.probe ? <div className="v360li" style={{ fontSize: 11, color: "#334155" }}>
            실측 — {Object.keys(g.probe.measured).map((k) => k + ": " + _pgAiShow(g.probe.measured[k])).join(" · ")}
            <span style={{ fontSize: 10, color: "#94A3B8" }}> {g.probe.from}</span>
          </div> : <div className="v360li" style={{ color: "#B45309" }}>{g.noProbe}</div>}
          {g.notice.map((n, i) => (
            <div className="v360li" key={i} style={{ color: "#0E8FA6" }}>
              <Bell size={11} /> {n.at} — 「{n.text}」
              <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{n.file} · 검사 소유자 {n.owner} · {n.why}</div>
            </div>
          ))}
        </div>
      ))}

      {/* ── AI4 거버넌스 에이전트 · 사람 승인 ── */}
      <PGAIHead id="AI4" ic={Workflow} />
      <div className="chnote" style={{ margin: "6px 0 8px" }}>※ {_pgPlain(A.nums)} {_pgPlain(D("axisSplit"))} {_pgPlain(A.gate)}</div>
      <PGAIStat mid="ai4.agentN" val={A.agentN} note={_pgPlain(D("baseFrozen"))} />
      <PGAIStat mid="ai4.actionN" val={A.actionN} />
      <PGAIStat mid="ai4.hitlN" val={A.hitlN + " / " + A.actionN} note={"승인 필수 축 " + A.hitl.must.length + "건 중 입구 있는 축 " + A.hitl.must.filter((m) => m.entry).length + "건"} />
      <PGAIStat mid="ai4.logN" val={A.log.n} note={A.log.empty} />
      <div className="v360li" style={{ color: "#64748B" }}>화면이 할 수 없는 것 — {A.hitl.never.join(" · ")}</div>
      <div className="v360li" style={{ color: "#64748B" }}>승인 입구가 없는 축 — {A.hitl.must.filter((m) => !m.entry).map((m) => m.what + "(" + _pgPlain(m.why) + ")").join(" / ")}</div>
      {A.agents.map((g) => (
        <div className="v360sec" key={g.id} style={{ marginTop: 8, borderLeft: "3px solid " + (g.color || "#F59E0B"), paddingLeft: 10 }}>
          <b>{g.t || g.id}</b>{g.scope ? <span style={{ color: "#64748B" }}> · {g.scope}</span> : null}
          {g.baseAbsent ? <div className="v360li" style={{ color: "#DC2626" }}>{g.baseAbsent}</div> : null}
          <div className="v360li">소관 — {g.ownsBase.join(" · ")}{g.ownsBase.length ? " / " : ""}<b style={{ color: "#0E8FA6" }}>{g.ownsAdd.join(" · ")}</b></div>
          <div className="v360li">지표 — {g.kpiBase.join(" · ")}{g.kpiBase.length ? " / " : ""}<b style={{ color: "#0E8FA6" }}>{g.kpiAdd.join(" · ")}</b></div>
          {g.guardBase ? <div className="v360li" style={{ color: "#64748B" }}><ShieldCheck size={11} /> {g.guardBase}</div> : null}
          <div className="v360li" style={{ color: "#B45309", fontWeight: 700 }}><ShieldCheck size={11} /> {_pgPlain(g.guardAdd)}</div>
          <div className="v360li" style={{ fontSize: 11, color: "#64748B" }}>{_pgPlain(g.why)}</div>
          {g.actions.map((act) => (
            <div className="v360li" key={act.id} style={{ borderTop: "1px dashed #E2E8F0", paddingTop: 6, marginTop: 6 }}>
              <button className="scactbtn" style={{ "--ac": g.color || "#F59E0B" }} onClick={() => fire(g.id, act.id)}><Play size={11} /> {act.ko}</button>
              {act.hitl ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#DC2626", marginLeft: 6 }}>사람 승인 필수</span> : null}
              <div style={{ fontSize: 11, color: "#64748B" }}>{act.asks}</div>
              {act.available
                ? <div style={{ fontSize: 11.5, color: "#334155" }}>{_pgPlain(act.msg)}</div>
                : <div style={{ fontSize: 11.5, color: "#B45309" }}>{act.hint}</div>}
              {act.slots.map((s) => (
                <div key={s.slot} style={{ fontSize: 10.5, color: "#94A3B8" }}>{s.slot} = {_pgN(s.value)} · {s.mid} · {s.from}</div>
              ))}
              {act.blocks ? <div style={{ fontSize: 11, color: "#B45309" }}>막는 것 — {act.blocks} · {_pgPlain(act.effect)}</div> : null}
            </div>
          ))}
        </div>
      ))}
      {/* 액션 요청 로그 — 눌렀을 때만 쌓인다. 승인 입구는 세우되 **승인 신원이 없어 눌리지 않는다** */}
      <div className="scjournalh" style={{ marginTop: 12 }}><Workflow size={13} /> 액션 요청 로그</div>
      <div className="scactlog">{log.length === 0
        ? <div className="scempty">액션 버튼을 누르면 요청이 등재됩니다. 사람 승인 필수 액션은 승인 전에는 실행되지 않습니다.</div>
        : log.map((row) => (
          <div className="scactrow" key={row.k} style={{ "--ac": "#F472B6" }}>
            <span className="scact-a">{row.r.ko || row.r.action}</span>
            <span className="scact-m">{row.r.available === false ? row.r.hint : _pgPlain(row.r.msg)}</span>
            <span className="scact-st done">{row.r.status || (row.r.available === false ? "아직 없음" : "—")}</span>
            {row.r.status === "승인대기"
              ? <button className="scact-appr" disabled title={_pgPlain(D("approverAbsent"))} style={{ opacity: 0.5, cursor: "not-allowed" }}>승인</button>
              : null}
          </div>
        ))}</div>
      <div className="chnote" style={{ marginTop: 8 }}>※ {_pgPlain(D("approverAbsent"))} {_pgPlain(D("gateTested"))} {_pgPlain(A.actor)}</div>
      <div className="scactlog" style={{ marginTop: 8 }}>{A.log.n === 0
        ? <div className="scempty">{A.log.empty}</div>
        : A.log.rows.map((r, i) => (
          <div className="scactrow" key={i} style={{ "--ac": r.actorKind === "SYS" ? "#A78BFA" : "#16A34A" }}>
            <span className="scact-a">{r.actorKind === "SYS" ? "판정기" : r.actorKind === "EMP" ? "임직원" : r.actorKind} · {r.action}</span>
            <span className="scact-m">{r.target} · {r.result} · {r.via}</span>
            <span className="scact-st done">{r.ts}</span>
          </div>
        ))}</div>
    </div>
  );
}
