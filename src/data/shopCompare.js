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

/* ── 카테고리별 고유 축 ──
   영양제는 "1일 단가 · 성분 함량"이면 되지만, 기기와 식단은 그 자로 재면 거짓말이 된다.
     · 홈케어의료기기 — **소모품이 진짜 비용이다.** 혈당측정기 본품 15,000원이 시험지 100매 포함 29,980원보다
       싸 보이지만, 시험지를 따로 사야 하므로 실제로는 비교가 성립하지 않는다.
     · 건강식단 — 도시락 6팩·파우더 750g·음료 24입을 한 줄에 세울 수 없다. **1식(1회) 단가**로 내려야 한다.
   그래서 카테고리마다 무엇으로 줄 세울지, 어떤 구성끼리만 비교할지를 **데이터로** 정의한다. */
const CMP_AXES = {
  /* 소모품이 함께 팔리는 기기 — 동봉 구성이 다르면 같은 줄에 세우지 않는다 */
  "혈당측정": { kind: "device", bundleKey: "strips", bundleLabel: "시험지",
    perUse: true, note: "시험지는 계속 사야 하는 소모품이라, 동봉 수량이 다르면 같은 기준으로 비교할 수 없어요." },
  /* 소모품이 없는 기기 — 본품 단가가 곧 비용 */
  "혈압계": { kind: "device" }, "체온·산소": { kind: "device" }, "안마·마사지": { kind: "device" },
  "온열·찜질": { kind: "device" }, "저주파·EMS": { kind: "device" }, "네블라이저": { kind: "device" },
  "요실금·골반": { kind: "device" }, "보청기": { kind: "device" }, "체성분·체중": { kind: "device" },
  /* 식단 — 1식(1회) 단가. 형태가 다르면 섞지 않는다(도시락 vs 파우더 vs 음료) */
  "맞춤도시락": { kind: "meal", servingLabel: "1식" },
  "질환케어": { kind: "meal", servingLabel: "1식" },
  "균형영양식": { kind: "meal", servingLabel: "1회" },
  "단백질": { kind: "meal", servingLabel: "1회" },
};
function cmpAxis(category) { return CMP_AXES[category] || { kind: "supp" }; }

/* 축별 가격 표기 — 무엇을 나눈 값인지가 숫자와 함께 보여야 한다(단위만 쓰면 오해한다) */
function cmpCostText(r, basis, ax) {
  if (basis === "perDay") return `${r.perDayCost}원/일(1일 ${r.perDay}${r.unit} 기준)`;
  if (basis === "perUse") return `${r.perUse}원/회(동봉 ${ax.bundleLabel || "소모품"} ${r.bundle.count}${r.bundle.count >= 1 ? "매" : ""} 기준)`;
  if (basis === "perServing") return `${r.perServing}원/${(ax.servingLabel || "1회").replace(/^1/, "")}(${r.servings.count}${r.servings.unit} 기준)`;
  return `${r.perUnit}원/${r.unit}`;
}

/* ── 용량 문자열 → 총 제공 개수 ── "60캡슐" · "50포" · "5g x 30포" · "170mg x 60캡슐" · "90정" */
function cmpParseVolume(volume) {
  const v = String(volume || "").replace(/\s/g, "");
  const m = v.match(/(\d+)(캡슐|정|포|스틱|개|팩|병)(?!.*\d(캡슐|정|포|스틱|개|팩|병))/);
  if (m) return { total: parseInt(m[1], 10), unit: m[2] };
  const all = v.match(/(\d+)(캡슐|정|포|스틱|개|팩|병)/g);
  if (all && all.length) { const last = all[all.length - 1].match(/(\d+)(\D+)/); return { total: parseInt(last[1], 10), unit: last[2] }; }
  return { total: null, unit: null };
}

/* ── 동봉 소모품 수량 — 제품명·용량 표기에서 확인되는 것만(추정 없음) ──
   "측정기 1개+시험지 100매" → 100 · "측정기 본품 1개" → 0(별매) · 표기 없음 → null(모름) */
function cmpParseBundle(p, axis) {
  if (!axis || !axis.bundleKey) return null;
  const t = String(p.volume || "") + " " + String(p.name || "");
  const m = t.replace(/\s/g, "").match(/시험지(\d+)매/);
  if (m) return { count: parseInt(m[1], 10), label: axis.bundleLabel || "소모품" };
  if (/본품/.test(t)) return { count: 0, label: axis.bundleLabel || "소모품" };   /* 본품만 — 별매 */
  return null;                                                                    /* 표기 없음 — 모름 */
}

/* ── 1회 제공량 — 식단은 "6팩"·"24입"·"750g"·"7일"처럼 형태가 제각각이다 ── */
function cmpParseServings(p, axis) {
  if (!axis || axis.kind !== "meal") return null;
  if (p.serving && p.serving.total) return { count: p.serving.total, unit: p.serving.unit || "회" };
  const t = String(p.name || "") + " " + String(p.volume || "");
  const m = t.replace(/\s/g, "").match(/(\d+)(팩|입|일|끼|회|병|포)/);
  if (m) return { count: parseInt(m[1], 10), unit: m[2] };
  return null;                                                                    /* 확인 안 되면 비운다 */
}

/* ── 제품 → 비교 행(정규화) ── 값이 없으면 그 필드는 null로 남긴다(표시는 "정보 없음") */
function cmpRow(p, opts) {
  const vol = cmpParseVolume(p.volume);
  const total = (p.serving && p.serving.total) || vol.total;
  const unit = (p.serving && p.serving.unit) || vol.unit || "개";
  const perDay = (p.serving && p.serving.perDay) || null;          // 1일 섭취량 — 확인된 것만
  const price = Number(p.price) || 0;
  let perUnit = total ? Math.round(price / total) : null;           // 단위당 단가(수량이 확인될 때)
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
  /* 카테고리 고유 축 — 기기의 소모품, 식단의 1식 단가 */
  const ax = cmpAxis(p.category);
  const bundle = cmpParseBundle(p, ax);
  const perUse = (bundle && bundle.count > 0) ? Math.round(price / bundle.count) : null;
  const servings = cmpParseServings(p, ax);
  const perServing = (servings && servings.count) ? Math.round(price / servings.count) : null;
  /* 식단은 "7일"·"24입"처럼 회 수가 곧 총 수량이다 — volume 파서가 못 읽는 단위를 여기서 채운다 */
  const total2 = total || (servings && servings.count) || null;
  const unit2 = (total ? unit : (servings && servings.unit)) || unit;
  if (perUnit == null && total2) perUnit = Math.round(price / total2);
  return {
    id: p.id, name: p.name, brand: p.brand, category: p.category, price: price,
    kind: ax.kind, bundle: bundle, perUse: perUse, servings: servings, perServing: perServing,
    total: total2, unit: unit2, perDay: perDay, perDaySrc: (p.serving && p.serving.perDaySrc) || null,
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
    const meal = (typeof MEAL_PRODUCTS !== "undefined") ? MEAL_PRODUCTS : [];
    const mkt = (typeof MARKET_REFERENCE !== "undefined") ? MARKET_REFERENCE : [];
    pool = supp.concat(dev).concat(meal).concat(mkt).filter(function (p) { return p && p.category === category; });
  } catch (e) { pool = []; }
  if (!pool.length) return null;

  /* 수량이 확인 안 된 제품도 **버리지 않는다** — 통째로 빼면 회원은 그 제품이 있는 줄도 모른다.
     줄 세우기에서만 빼고(pending), 가격은 그대로 보여준다. */
  let rows = pool.map(function (p) { return cmpRow(p, opts); }).filter(function (r) { return r.price; });
  if (!rows.length) return null;

  /* ⚠️ 사과는 사과와 비교한다 — 기준이 다른 제품을 섞어 줄 세우지 않는다.
     ① 영양제: 1일 섭취량이 확인된 것(1일 단가) vs 아닌 것(단위당 단가)
     ② 기기: 소모품 동봉 구성이 다른 것(예 시험지 100매 vs 본품만)
     ③ 식단: 1식 단가가 산출되는 것 vs 수량 표기가 없는 것
     섞으면 "본품만 15,000원"이 "시험지 100매 포함 29,980원"을 이기는 착시가 생기고, 그건 공정 비교 위반이다. */
  const ax = cmpAxis(category);
  let dayRows, unitRows, basis;
  if (ax.kind === "device" && ax.perUse) {
    /* 소모품이 진짜 비용인 기기 — 동봉분 1회당 단가로 줄 세우고, 별매·미표기는 따로 뺀다 */
    dayRows = rows.filter(function (r) { return r.perUse; }).sort(function (a, b) { return a.perUse - b.perUse; });
    unitRows = rows.filter(function (r) { return !r.perUse; }).sort(function (a, b) { return (a.perUnit || 0) - (b.perUnit || 0); });
    basis = dayRows.length >= 2 ? "perUse" : "perUnit";
  } else if (ax.kind === "meal") {
    /* 식단 — 1식(1회) 단가. 수량이 확인 안 된 제품은 줄 세우지 않는다 */
    dayRows = rows.filter(function (r) { return r.perServing; }).sort(function (a, b) { return a.perServing - b.perServing; });
    unitRows = rows.filter(function (r) { return !r.perServing; }).sort(function (a, b) { return (a.perUnit || 0) - (b.perUnit || 0); });
    basis = dayRows.length >= 2 ? "perServing" : "perUnit";
  } else {
    dayRows = rows.filter(function (r) { return r.perDayCost; }).sort(function (a, b) { return a.perDayCost - b.perDayCost; });
    unitRows = rows.filter(function (r) { return !r.perDayCost; }).sort(function (a, b) { return (a.perUnit || 0) - (b.perUnit || 0); });
    basis = dayRows.length >= 2 ? "perDay" : "perUnit";
  }
  const cost = function (r) { return basis === "perDay" ? r.perDayCost : basis === "perUse" ? r.perUse : basis === "perServing" ? r.perServing : r.perUnit; };
  /* 단가를 낼 수 없는 제품은 **줄에 세우지 않는다** — "null원/개"가 새어 나가면 비교표가 스스로를 부정한다 */
  const priceable = rows.filter(function (r) { return r.perUnit != null; }).sort(function (a, b) { return a.perUnit - b.perUnit; });
  const primary = (basis !== "perUnit") ? dayRows : priceable;
  const limit = opts.limit || 5;

  /* 시장 제품·자사 제품이 각각 최소 1개는 포함되도록(공정 비교 — 우리 것만 보여주지 않는다) */
  if (!primary.length) return null;                      /* 줄 세울 게 없으면 비교표를 만들지 않는다 */
  let picked = primary.slice(0, limit);
  const ensure = function (pred) {
    if (picked.some(pred)) return;
    const found = primary.find(pred);
    if (found) picked = picked.slice(0, Math.max(1, limit - 1)).concat([found]);
  };
  ensure(function (r) { return r.market; });
  ensure(function (r) { return !r.market; });

  /* 기준 미확인 제품은 별도 그룹으로 — 같은 표에서 우열을 매기지 않는다 */
  const rest = (basis !== "perUnit") ? unitRows : rows.filter(function (r) { return r.perUnit == null; });
  const pending = rest.filter(function (r) { return !picked.some(function (p) { return p.id === r.id; }); }).slice(0, 5);

  /* 하이라이트 — 계산 결과에서만, 그리고 같은 기준 안에서만 나온다 */
  const withNut = picked.filter(function (r) { return r.nutrient && r.nutrient.amount; });
  const cheapest = picked.reduce(function (a, b) {
    return (!a || (cost(b) || 1e9) < (cost(a) || 1e9)) ? b : a;
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
  const AXIS_LABEL = {
    perDay: "1일 단가(원/일)",
    perUse: "동봉 " + (ax.bundleLabel || "소모품") + " 1회당 단가(원/회)",
    perServing: (ax.servingLabel || "1회") + " 단가(원/" + (ax.servingLabel || "1회").replace(/^1/, "") + ")",
    perUnit: "단위당 단가(원/" + (picked[0].unit || "개") + ")",
  };
  const axis = [AXIS_LABEL[basis], nutKey ? nutKey + " 1일 함량" : null].filter(Boolean).join(" · ");

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
  if (cheap) guide.push(`가격을 우선한다면 → ${cheap.name}(${cmpCostText(cheap, basis, ax)}, 이 비교에서 가장 낮아요)`);
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
  const notices = [];
  if (ax.kind === "supp") notices.push("건강기능식품은 질병의 치료·예방을 위한 의약품이 아니에요.");
  if (ax.kind === "device") notices.push("의료기기는 사용 목적·사용법을 반드시 지켜 주세요 — 진단은 의료진의 몫이에요.");
  notices.push(...[
    "가격은 조사 시점 기준이라 달라질 수 있어요(출처: " + [...new Set(picked.map(function (r) { return r.priceSource; }))].join("·") + ").",
  ]);
  if (ax.kind === "supp" && coverage.withNutrient < coverage.total) notices.push("성분 함량이 등록되지 않은 제품은 성분 비교에서 제외했어요 — 제품 라벨에서 확인하실 수 있어요.");
  if (ax.kind === "supp" && coverage.withPerDay < coverage.total) notices.push("1일 섭취량이 확인된 제품만 '1일 단가'로 계산했고, 나머지는 단위당 단가로 비교했어요.");
  if (ax.note) notices.push(ax.note);
  if (basis === "perUse") notices.push("동봉된 " + (ax.bundleLabel || "소모품") + "를 다 쓴 뒤의 재구매 가격은 따로 확인하셔야 해요 — 여기 계산에는 들어 있지 않아요.");

  return { category: category, axis: axis, basis: basis, rows: picked, pending: pending, highlights: highlights, guide: guide, notices: notices, coverage: coverage };
}

/* ── 비교표 → 대화용 텍스트(모바일에서 5초에 읽히게) ── */
function compareToLines(cmp) {
  if (!cmp) return [];
  const L = [];
  /* 1개뿐이면 "비교했어요"는 사실이 아니다 — 같은 기준으로 줄 세울 게 하나뿐이라고 말한다 */
  L.push(cmp.rows.length >= 2
    ? `${cmp.category} ${cmp.rows.length}개를 같은 기준으로 비교했어요 — 기준: ${cmp.axis}.`
    : `${cmp.category}은(는) 같은 기준으로 줄 세울 수 있는 제품이 1개뿐이에요 — 기준: ${cmp.axis}.`);
  const anyForm = cmp.rows.some(function (r) { return !!r.form; });
  cmp.rows.forEach(function (r) {
    const badge = [];
    if (cmp.highlights.mostNutrient && cmp.highlights.mostNutrient.id === r.id) badge.push("🏅성분 최다");
    if (cmp.highlights.cheapest && cmp.highlights.cheapest.id === r.id) badge.push(
      cmp.basis === "perDay" ? "💰1일 단가 최저" : cmp.basis === "perUse" ? "💰1회당 최저" : cmp.basis === "perServing" ? "💰1식 단가 최저" : "💰단위당 최저");
    const price = cmpCostText(r, cmp.basis, cmpAxis(cmp.category));
    /* 성분 칸은 영양제에서만 — 혈압계에 "성분 정보 없음"을 붙이면 정보가 아니라 소음이다 */
    const anyNut = cmp.rows.some(function (x) { return x.nutrient; });
    const nut = r.nutrient ? `${r.nutrient.key} ${r.nutrient.amount}${r.nutrient.unit}` : (anyNut ? "성분 정보 없음" : null);
    /* 형태(rTG·캡슐 등)는 비교에 의미가 있을 때만 — 아무도 값이 없으면 줄마다 "정보 없음"을 반복하지 않는다 */
    const form = anyForm ? (r.form || "형태 정보 없음") : null;
    const seg = [`· ${r.name}(${r.brand})` + (nut ? ` — ${nut}` : ""), price].concat(form ? [form] : []).concat([`${r.market ? "시장 유통가" : "브랜드몰"} 기준${badge.length ? " " + badge.join(" ") : ""}`]);
    L.push(seg.join(" · "));
  });
  if (cmp.pending && cmp.pending.length) {
    /* 왜 줄에서 뺐는지를 축에 맞게 말한다 — "확인 필요"만 쓰면 회원은 이유를 모른다 */
    const kind = (cmp.rows[0] && cmp.rows[0].kind) || "supp";
    const why = cmp.basis === "perUse" ? "동봉 소모품 구성이 달라"
      : cmp.basis === "perServing" ? "수량 표기가 없어"
      : kind === "supp" ? "1일 섭취량이 확인되지 않아" : "수량 표기가 없어";
    const tag = cmp.basis === "perUse" ? "시험지 별매 — 재구매 비용 확인 필요"
      : kind === "supp" ? "1일 섭취량 확인 필요" : "수량 확인 필요";
    L.push(`아래 제품은 ${why} 같은 기준으로 줄 세우지 않았어요(단위당 단가만 안내).`);
    cmp.pending.forEach(function (r) {
      const p = r.perUnit ? `${r.perUnit}원/${r.unit}` : `${Number(r.price).toLocaleString()}원`;
      L.push(`· ${r.name}(${r.brand}) — ${p} · ${r.perUnit ? tag : "수량 표기가 없어 단가를 낼 수 없어요"}`);
    });
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
