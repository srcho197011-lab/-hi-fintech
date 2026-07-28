/* ══════════════ 건강쇼핑 비교 엔진 — 같은 기준으로 줄 세운다(Phase C) ══════════════
   원칙: **지어내지 않는다.** 계산에 필요한 값이 없으면 그 축은 "정보 없음"으로 비우고, 있는 축만 비교한다.
     ① 단위당 단가 — volume에서 총 개수를 파싱해 항상 정확히 계산(가정 없음)
     ② 1일 단가   — 1일 섭취량(serving.perDay)이 **확인된 제품만** 산출
     ③ 성분 1일 함량 — 라벨·제품명·설명에 명시돼 spec으로 등록된 제품만(specSrc로 출처 표기)
     ④ 적립 반영 실부담 — 하이핀 구매 시 HTK 적립을 반영한 실질 부담(1 HTK ≈ 10원)
   플랫폼 안팎: 카탈로그의 source가 네이버·쿠팡·다나와면 **시장 유통가 기준 대중 제품**, brand_mall이면 브랜드몰 기준.
   공정 비교(A3 헌법 6조): 우열 배지는 계산 결과에서만 나오고, 자사가 불리한 축은 불리하게 표시한다. */

const CMP_HTK_WON = 10;              // HTK 1 ≈ 10원(폐쇄형 포인트 환산 표기용)
const CMP_MARKET_SRC = { naver: "네이버쇼핑", coupang: "쿠팡", danawa: "다나와", brand_mall: "브랜드몰" };

/* ── 용량 문자열 → 총 제공 개수 ── "60캡슐" · "50포" · "5g x 30포" · "170mg x 60캡슐" · "90정" */
function cmpParseVolume(volume) {
  const v = String(volume || "").replace(/\s/g, "");
  const m = v.match(/(\d+)(캡슐|정|포|스틱|개|팩|병)(?!.*\d(캡슐|정|포|스틱|개|팩|병))/);
  if (m) return { total: parseInt(m[1], 10), unit: m[2] };
  const all = v.match(/(\d+)(캡슐|정|포|스틱|개|팩|병)/g);
  if (all && all.length) { const last = all[all.length - 1].match(/(\d+)(\D+)/); return { total: parseInt(last[1], 10), unit: last[2] }; }
  return { total: null, unit: null };
}

/* ── 제품 → 비교 행(정규화) ── 값이 없으면 그 필드는 null로 남긴다(표시는 "정보 없음") */
function cmpRow(p, opts) {
  const vol = cmpParseVolume(p.volume);
  const total = (p.serving && p.serving.total) || vol.total;
  const unit = (p.serving && p.serving.unit) || vol.unit || "개";
  const perDay = (p.serving && p.serving.perDay) || null;          // 1일 섭취량 — 확인된 것만
  const price = Number(p.price) || 0;
  const perUnit = total ? Math.round(price / total) : null;         // 단위당 단가(항상 계산 가능)
  const days = (total && perDay) ? Math.floor(total / perDay) : null;
  const perDayCost = days ? Math.round(price / days) : null;        // 1일 단가(섭취량 확인 시)
  let reward = null, netPerDay = null;
  try {
    if (typeof healthReward === "function") {
      reward = healthReward(price);                                  // HTK 적립
      const net = price - (reward * CMP_HTK_WON);
      if (days) netPerDay = Math.round(net / days);
      else if (total) netPerDay = Math.round(net / total);
    }
  } catch (e) {}
  const nutrient = (p.spec && p.spec.nutrients && p.spec.nutrients.length) ? p.spec.nutrients[0] : null;
  return {
    id: p.id, name: p.name, brand: p.brand, category: p.category, price: price,
    total: total, unit: unit, perDay: perDay, perDaySrc: (p.serving && p.serving.perDaySrc) || null,
    days: days, perUnit: perUnit, perDayCost: perDayCost,
    reward: reward, netPerDay: netPerDay,
    nutrient: nutrient, form: (p.spec && p.spec.form) || null, certs: (p.spec && p.spec.certs) || null,
    specSrc: (p.spec && p.spec.src) || null,
    market: /^(naver|coupang|danawa)$/.test(p.source || "") , priceSource: CMP_MARKET_SRC[p.source] || p.source || "-",
    claim: p.claim || "", url: p.url || null,
  };
}

/* ── 비교 실행 ──
   compareProducts(category, opts) → { axis, rows, highlights, guide, notices, coverage } */
function compareProducts(category, opts) {
  opts = opts || {};
  let pool = [];
  try {
    const supp = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
    const dev = (typeof DEVICE_PRODUCTS !== "undefined") ? DEVICE_PRODUCTS : [];
    const mkt = (typeof MARKET_REFERENCE !== "undefined") ? MARKET_REFERENCE : [];
    pool = supp.concat(dev).concat(mkt).filter(function (p) { return p && p.category === category; });
  } catch (e) { pool = []; }
  if (!pool.length) return null;

  let rows = pool.map(function (p) { return cmpRow(p, opts); }).filter(function (r) { return r.total; });
  if (!rows.length) return null;

  /* ⚠️ 사과는 사과와 비교한다 — 1일 섭취량이 확인된 제품(1일 단가)과 아닌 제품(단위당 단가)을 섞어 줄 세우지 않는다.
     섞으면 "1일 2캡슐 제품"이 싸 보이는 착시가 생기고, 그것은 공정 비교 위반이다. */
  const dayRows = rows.filter(function (r) { return r.perDayCost; }).sort(function (a, b) { return a.perDayCost - b.perDayCost; });
  const unitRows = rows.filter(function (r) { return !r.perDayCost; }).sort(function (a, b) { return (a.perUnit || 0) - (b.perUnit || 0); });
  const primary = dayRows.length >= 2 ? dayRows : rows.sort(function (a, b) { return (a.perUnit || 0) - (b.perUnit || 0); });
  const basis = dayRows.length >= 2 ? "perDay" : "perUnit";
  const limit = opts.limit || 5;

  /* 시장 제품·자사 제품이 각각 최소 1개는 포함되도록(공정 비교 — 우리 것만 보여주지 않는다) */
  let picked = primary.slice(0, limit);
  const ensure = function (pred) {
    if (picked.some(pred)) return;
    const found = primary.find(pred);
    if (found) picked = picked.slice(0, Math.max(1, limit - 1)).concat([found]);
  };
  ensure(function (r) { return r.market; });
  ensure(function (r) { return !r.market; });

  /* 기준 미확인 제품은 별도 그룹으로 — 같은 표에서 우열을 매기지 않는다 */
  const pending = (basis === "perDay") ? unitRows.filter(function (r) { return !picked.some(function (p) { return p.id === r.id; }); }).slice(0, 3) : [];

  /* 하이라이트 — 계산 결과에서만, 그리고 같은 기준 안에서만 나온다 */
  const withNut = picked.filter(function (r) { return r.nutrient && r.nutrient.amount; });
  const cheapest = picked.reduce(function (a, b) {
    const va = basis === "perDay" ? a && a.perDayCost : a && a.perUnit;
    const vb = basis === "perDay" ? b.perDayCost : b.perUnit;
    return (!a || (vb || 1e9) < (va || 1e9)) ? b : a;
  }, null);
  const highlights = {
    basis: basis,
    cheapest: cheapest,
    cheapestPerDay: basis === "perDay" ? cheapest : null,
    cheapestPerUnit: basis === "perUnit" ? cheapest : null,
    mostNutrient: withNut.length >= 2 ? withNut.reduce(function (a, b) { return (!a || b.nutrient.amount > a.nutrient.amount) ? b : a; }, null) : null,
    bestAfterReward: picked.filter(function (r) { return r.netPerDay && !r.market; }).reduce(function (a, b) { return (!a || b.netPerDay < a.netPerDay) ? b : a; }, null),
  };

  /* 비교 축 — 무엇을 기준으로 줄 세웠는지 반드시 밝힌다(헌법 6조①) */
  const nutKey = withNut.length ? withNut[0].nutrient.key : null;
  const axis = [
    picked.some(function (r) { return r.perDayCost; }) ? "1일 단가(원/일)" : "단위당 단가(원/" + (picked[0].unit || "개") + ")",
    nutKey ? nutKey + " 1일 함량" : null,
  ].filter(Boolean).join(" · ");

  /* 데이터 커버리지 — 무엇이 비어 있는지 정직하게 드러낸다 */
  const coverage = {
    total: picked.length,
    withPerDay: picked.filter(function (r) { return r.perDay; }).length,
    withNutrient: withNut.length,
    marketIncluded: picked.filter(function (r) { return r.market; }).length,
  };

  /* 선택 가이드 — 축별 1줄씩(단정 금지, 기준을 밝힌 상대 표현) */
  const guide = [];
  if (highlights.mostNutrient) guide.push(`성분량을 우선한다면 → ${highlights.mostNutrient.name}(1일 ${highlights.mostNutrient.nutrient.amount}${highlights.mostNutrient.nutrient.unit}, 이 비교에서 가장 많아요)`);
  const cheap = highlights.cheapest;
  if (cheap) guide.push(`가격을 우선한다면 → ${cheap.name}(${basis === "perDay" ? cheap.perDayCost + "원/일" : cheap.perUnit + "원/" + cheap.unit}, 이 비교에서 가장 낮아요)`);
  /* 성분당 단가 — 성분값이 2개 이상 있을 때만(가성비 축) */
  const nutVal = withNut.filter(function (r) { return r.perDayCost; });
  if (nutVal.length >= 2) {
    const best = nutVal.reduce(function (a, b) {
      const ca = a && (a.perDayCost / a.nutrient.amount), cb = b.perDayCost / b.nutrient.amount;
      return (!a || cb < ca) ? b : a;
    }, null);
    /* 단위는 성분마다 다르다 — mg으로 못 박으면 CFU 제품에서 "1mg당 3.7원/억CFU" 같은 어긋난 문장이 나온다 */
    const u = best ? String(best.nutrient.unit).replace("억 CFU", "억CFU") : "";
    if (best) guide.push(`성분 1${u}당 가격을 우선한다면 → ${best.name}(${Math.round(best.perDayCost / best.nutrient.amount * 10) / 10}원/${u})`);
  }
  if (highlights.bestAfterReward) guide.push(`하이핀 적립까지 감안한다면 → ${highlights.bestAfterReward.name}(적립 반영 ${highlights.bestAfterReward.netPerDay}원/${highlights.bestAfterReward.perDayCost ? "일" : highlights.bestAfterReward.unit})`);

  /* 고지 — 규제·한계를 항상 함께 */
  const notices = [
    "건강기능식품은 질병의 치료·예방을 위한 의약품이 아니에요.",
    "가격은 조사 시점 기준이라 달라질 수 있어요(출처: " + [...new Set(picked.map(function (r) { return r.priceSource; }))].join("·") + ").",
  ];
  if (coverage.withNutrient < coverage.total) notices.push("성분 함량이 등록되지 않은 제품은 성분 비교에서 제외했어요 — 제품 라벨에서 확인하실 수 있어요.");
  if (coverage.withPerDay < coverage.total) notices.push("1일 섭취량이 확인된 제품만 '1일 단가'로 계산했고, 나머지는 단위당 단가로 비교했어요.");

  return { category: category, axis: axis, basis: basis, rows: picked, pending: pending, highlights: highlights, guide: guide, notices: notices, coverage: coverage };
}

/* ── 비교표 → 대화용 텍스트(모바일에서 5초에 읽히게) ── */
function compareToLines(cmp) {
  if (!cmp) return [];
  const L = [];
  L.push(`${cmp.category} ${cmp.rows.length}개를 같은 기준으로 비교했어요 — 기준: ${cmp.axis}.`);
  const anyForm = cmp.rows.some(function (r) { return !!r.form; });
  cmp.rows.forEach(function (r) {
    const badge = [];
    if (cmp.highlights.mostNutrient && cmp.highlights.mostNutrient.id === r.id) badge.push("🏅성분 최다");
    if (cmp.highlights.cheapest && cmp.highlights.cheapest.id === r.id) badge.push(cmp.basis === "perDay" ? "💰1일 단가 최저" : "💰단위당 최저");
    const price = cmp.basis === "perDay" ? `${r.perDayCost}원/일(1일 ${r.perDay}${r.unit} 기준)` : `${r.perUnit}원/${r.unit}`;
    const nut = r.nutrient ? `${r.nutrient.key} ${r.nutrient.amount}${r.nutrient.unit}` : "성분 정보 없음";
    /* 형태(rTG·캡슐 등)는 비교에 의미가 있을 때만 — 아무도 값이 없으면 줄마다 "정보 없음"을 반복하지 않는다 */
    const form = anyForm ? (r.form || "형태 정보 없음") : null;
    const seg = [`· ${r.name}(${r.brand}) — ${nut}`, price].concat(form ? [form] : []).concat([`${r.market ? "시장 유통가" : "브랜드몰"} 기준${badge.length ? " " + badge.join(" ") : ""}`]);
    L.push(seg.join(" · "));
  });
  if (cmp.pending && cmp.pending.length) {
    L.push("아래 제품은 1일 섭취량이 확인되지 않아 같은 기준으로 줄 세우지 않았어요(단위당 단가만 안내).");
    cmp.pending.forEach(function (r) { L.push(`· ${r.name}(${r.brand}) — ${r.perUnit}원/${r.unit} · 1일 섭취량 확인 필요`); });
  }
  if (cmp.highlights.bestAfterReward) L.push(`하이핀에서 구매하면 적립이 붙어요 — ${cmp.highlights.bestAfterReward.name} 기준 적립 반영 실부담 ${cmp.highlights.bestAfterReward.netPerDay}원/${cmp.highlights.bestAfterReward.perDayCost ? "일" : cmp.highlights.bestAfterReward.unit}.`);
  if (cmp.guide.length) { L.push("이렇게 고르시면 돼요"); cmp.guide.forEach(function (g) { L.push("· " + g); }); }
  cmp.notices.forEach(function (n) { L.push("※ " + n); });
  return L;
}

/* 비교에 사용한 사실(제품 id·가격·성분값) — 하네스가 환각을 대조 */
function compareFacts(cmp) {
  if (!cmp) return { products: [], values: [] };
  const values = [];
  cmp.rows.forEach(function (r) {
    if (r.perUnit) values.push(String(r.perUnit));
    if (r.perDayCost) values.push(String(r.perDayCost));
    if (r.netPerDay) values.push(String(r.netPerDay));
    if (r.nutrient && r.nutrient.amount) values.push(String(r.nutrient.amount));
    values.push(String(r.price));
  });
  return { products: cmp.rows.map(function (r) { return r.id; }), values: [...new Set(values)] };
}

try { if (typeof window !== "undefined") { window.__hifinCompare = { run: compareProducts, lines: compareToLines, facts: compareFacts, parseVolume: cmpParseVolume }; } } catch (e) {}
