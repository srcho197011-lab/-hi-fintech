/* ══════════════ 시장 레퍼런스 — 플랫폼 밖 대중 제품 비교용 확장 지점(Phase C) ══════════════
   목적: 회원이 하이핀 안의 제품만 보고 고르지 않도록, **시장에서 널리 쓰이는 대안**을 같은 표에 올린다.

   ⚠️ 현재 상태 — 데이터를 지어내지 않는다(중요)
   지금 비교에 쓰이는 '시장 제품'은 **카탈로그 자체의 시장 유통가 기준 항목**이다:
     shopProducts.js의 source가 naver·coupang·danawa 인 제품 = 시장 가격 기준으로 조사된 대중 제품
     (shopCompare.js의 row.market 판정이 이 필드를 읽는다 — 별도 데이터 없이 플랫폼 안팎 비교가 성립)
   이 파일은 **하이핀이 취급하지 않는 제품**까지 비교 범위를 넓힐 때 채우는 자리다.
   가격·성분은 반드시 출처(priceSource)와 조사 시점(asof)을 함께 기록하고, 확인되지 않은 값은 null로 둔다.

   스키마
   { id, category, name, brand, volume,
     serving: { total, unit, perDay, perDaySrc },              // perDay는 라벨 확인 시에만
     spec:    { nutrients: [{ key, amount, unit }], form, certs, src },   // src: "label"|"name"|"desc"
     price, priceSource, asof, url, source: "market", note }

   ⚠️ 타사 제품을 비방하지 않는다. 객관 수치만 싣는다(A3 헌법 6조③).
   ⚠️ 값을 모르면 비우고, 비교표에서 "정보 없음"으로 표시한다(A3 헌법 5조). */

const MARKET_REFERENCE = [
  /* 예시 스키마(주석) — 라벨·가격이 실제로 확인되면 아래 형태로 추가한다.
  { id: "mkt-omega-example", category: "오메가3", name: "○○ 오메가3", brand: "○○",
    volume: "60캡슐", serving: { total: 60, unit: "캡슐", perDay: 1, perDaySrc: "label" },
    spec: { nutrients: [{ key: "EPA+DHA", amount: 1000, unit: "mg" }], form: "rTG", certs: ["건강기능식품"], src: "label" },
    price: 19900, priceSource: "네이버쇼핑 최저가", asof: "2026-07", url: "...", source: "market",
    note: "국내 판매량 상위" },
  */
];

/* 비교 대상 시장 제품 수(운영 콘솔·보고서에서 데이터 충실도 확인용) */
function marketRefCount(category) {
  try { return MARKET_REFERENCE.filter(function (m) { return !category || m.category === category; }).length; } catch (e) { return 0; }
}

try { if (typeof window !== "undefined") { window.__hifinMarketRef = { list: MARKET_REFERENCE, count: marketRefCount }; } } catch (e) {}
