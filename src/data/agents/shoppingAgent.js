/* ══════════════ A3 · 건강쇼핑 에이전트 (Phase C) ══════════════
   최고의 임무: **비교해서 회원이 스스로 고르게 한다.**
     ① 필요 도출 — 회원 건강상태(위험 질환)에서 관리 영역을 먼저 정한다(수치 해석은 하지 않는다 → A1)
     ② 후보 수집 — 플랫폼 안팎(시장 유통가 기준 제품 포함)을 같은 표에 올린다
     ③ 비교·선택 가이드 — 1일 단가·성분 함량·성분당 단가를 정규화해 기준을 밝히고 보여준다
   담당 밖(질환·수치·복용량 A1 / 보장·청구 A2 / 예약·연결 A0 / 돌봄 A4)은 핸드백.
   모든 응답은 shoppingGuard(헌법 6조)를 통과해야 나간다. */

const A3_TO_A1 = /(무슨\s*병|질환이|증상|수치\s*의미|해석해|생체나이|이\s*수치|정상\s*범위|몇\s*알\s*먹|복용량|하루\s*몇\s*(정|알|캡슐)|같이\s*먹어도|병용|약\s*(부작용|상호)|(당뇨|고혈압|고지혈|지방간|빈혈|암)\s*(맞지|맞나|인가|일까|이야|인지))/;
const A3_TO_A2 = /(보험|보장|실손|청구|보험금|보험료|휴면)/;
const A3_TO_A0 = /(검진\s*예약|예약해\s*줘|센터\s*찾|데이터\s*연결|결과지\s*올리|본인인증|로그인)/;
const A3_TO_A4 = /(간병|돌봄|방문간호|방문요양|요양등급|장기요양|요양원)/;
function _a3Outbound(q) {
  const s = String(q || "");
  if (A3_TO_A2.test(s)) return { to: "A2", reason: "insurance" };
  if (A3_TO_A4.test(s)) return { to: "A4", reason: "homecare" };
  if (A3_TO_A1.test(s)) return { to: "A1", reason: "checkup-result" };
  if (A3_TO_A0.test(s)) return { to: "A0", reason: "booking" };
  return null;
}

/* ── 질문 → 비교 카테고리 추론(카탈로그 카테고리명·동의어) ── */
const A3_CAT_ALIAS = {
  "오메가3": ["오메가3", "오메가쓰리", "epa", "dha", "혈행"],
  "루테인": ["루테인", "눈영양제", "눈에좋은", "황반"],
  "프로바이오틱스": ["프로바이오틱스", "유산균", "장건강", "배변"],
  "밀크씨슬": ["밀크씨슬", "실리마린", "간영양제", "간에좋은"],
  "비타민D": ["비타민d", "비타민디", "뼈건강"],
  "마그네슘": ["마그네슘"],
  "비타민C": ["비타민c", "비타민씨"],
  "종합비타민": ["종합비타민", "멀티비타민"],
  "홍삼": ["홍삼", "면역"],
  "콜라겐": ["콜라겐", "피부"],
  "아연": ["아연"],
  "혈압계": ["혈압계", "혈압측정"],
  "혈당측정": ["혈당측정", "혈당기", "혈당계", "시험지"],
  "체성분·체중": ["체중계", "체성분"],
};
function _a3Category(q) {
  const t = String(q || "").toLowerCase().replace(/\s+/g, "");
  let best = null;
  for (const cat in A3_CAT_ALIAS) {
    for (const w of A3_CAT_ALIAS[cat]) { if (t.indexOf(w) >= 0 && (!best || w.length > best.len)) best = { cat: cat, len: w.length }; }
  }
  return best ? best.cat : null;
}

/* ── 필요 도출 — 회원 건강상태에서 관리 영역을 찾는다(수치 해석 금지) ── */
function _a3Need(ctx) {
  const m = ctx && ctx.m;
  const risks = (m && (m.highRiskDiseases || [])) || [];
  if (!risks.length) return null;
  let hit = null;
  try {
    if (typeof COMM_DISEASE !== "undefined") {
      for (const d of COMM_DISEASE) {
        if (risks.some(function (r) { return d.kw.some(function (k) { return String(r).indexOf(k) >= 0; }); })) { hit = d; break; }
      }
    }
  } catch (e) {}
  if (!hit) return null;
  /* 관리 영역 → 카테고리 후보(온톨로지 영역명과 카탈로그 카테고리 연결) */
  const AREA_CAT = { "혈행": "오메가3", "간": "밀크씨슬", "장": "프로바이오틱스", "눈": "루테인", "혈당": "혈당측정", "혈압": "혈압계", "관절": "종합비타민" };
  const cat = (hit.areas || []).map(function (a) { return AREA_CAT[a]; }).filter(Boolean)[0] || null;
  return { disease: hit.label, area: (hit.areas || [])[0], category: cat, note: hit.note };
}

/* ── 진입점 ──
   반환: { agent:"A3", lines, buttons, cite, nav, catalog, compare } | { handback } | null */
function shoppingAgent(question, ctx) {
  const q = String(question || "");
  ctx = ctx || {};
  const ob = _a3Outbound(q);
  if (ob) return { handback: ob };

  const wantsCompare = /(비교|추천|뭐가\s*(나|좋)|뭐\s*먹|먹으면\s*좋|어떤\s*(게|걸)|골라|고르|가성비|싼|저렴|차이|사고\s*싶|살까)/.test(q);
  const asksEfficacy = /(먹으면.{0,8}(낫|나아|좋아|효과)|효과\s*있|정말\s*(되|좋)|도움\s*되|치료(가\s*)?되)/.test(q);
  let cat = _a3Category(q);
  const need = _a3Need(ctx);
  let lines = [], buttons = [], cite = [], catalog = { products: [], values: [] }, cmp = null;
  const nav = { key: "shop", label: "건강쇼핑" };

  /* ① 카테고리를 못 잡았는데 비교를 원하면 — 건강상태에서 필요를 먼저 도출 */
  if (!cat && need && need.category) cat = need.category;

  /* ② 비교 실행 */
  if (cat && (wantsCompare || _a3Category(q) || need)) {
    try { cmp = (typeof compareProducts === "function") ? compareProducts(cat, {}) : null; } catch (e) { cmp = null; }
  }
  if (cmp) {
    if (need && need.category === cat) lines.push(`${need.disease} 관리가 필요하신 상태라 ${need.area} 관리 영역부터 보여드릴게요.`);
    try { lines = lines.concat(compareToLines(cmp)); } catch (e) {}
    try { catalog = compareFacts(cmp); } catch (e) {}
    /* 근거 — 성분 출처·가격 출처·질환 영역 매핑 */
    const withSpec = cmp.rows.filter(function (r) { return r.specSrc; });
    if (withSpec.length) cite.push({ source: "제품 라벨 표시(다나와 상세)", title: withSpec.map(function (r) { return r.name.slice(0, 14); }).slice(0, 2).join(" · ") });
    cite.push({ source: "가격 조사", title: [...new Set(cmp.rows.map(function (r) { return r.priceSource; }))].join("·") + " 기준" });
    /* 온톨로지 근거는 **건강상태가 이 카테고리를 고른 경우에만** — 회원이 직접 지목한 성분에 붙이면 근거가 어긋난다 */
    if (need && need.category === cat) cite.push({ source: "커머스 온톨로지", title: need.disease + " → " + need.area + " 관리 영역" });
    buttons = ["건강쇼핑 가기", "다른 성분도 비교해줘"];
  }

  /* ②-b 효능 질문 — 인정된 기능성 표시 범위 안에서만 설명한다(치료 단정 금지) */
  if (!lines.length && asksEfficacy) {
    let claim = null;
    try {
      const pool = ((typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : []).concat((typeof DEVICE_PRODUCTS !== "undefined") ? DEVICE_PRODUCTS : []);
      const p0 = cat ? pool.find(function (p) { return p.category === cat && p.claim; }) : null;
      claim = p0 ? p0.claim : null;
    } catch (e) {}
    lines = [
      claim ? `${cat}는 「${claim}」로 인정된 기능성 범위 안에서 도움을 줄 수 있어요.` : "건강기능식품은 인정된 기능성 표시 범위 안에서 도움을 줄 수 있어요.",
      "질병을 낫게 하거나 약을 대신하지는 않아요 — 지금 치료 중이시면 담당 의사와 상의하시는 게 우선이에요.",
      "원하시면 같은 목적의 제품을 성분·가격 기준으로 비교해 드릴게요.",
    ];
    buttons = cat ? [cat + " 비교해줘", "건강쇼핑 가기"] : ["건강쇼핑 가기"];
    if (cat) cite.push({ source: "인정 기능성 표시(제품 라벨)", title: cat });
  }

  /* ③ 비교가 아니면 기존 커머스 상담(제품·공급사·카테고리) */
  if (!lines.length) {
    let cc = null;
    try { cc = (typeof commerceCounsel === "function") ? commerceCounsel(q) : null; } catch (e) {}
    if (cc && cc.bubbles && cc.bubbles.length) {
      lines = cc.bubbles.filter(function (b) { return b.kind !== "card"; }).map(function (b) { return String(b.text || "").replace(/\*\*/g, ""); }).filter(Boolean);
      const cards = cc.bubbles.filter(function (b) { return b.kind === "card" && b.card; }).map(function (b) { return b.card; });
      buttons = (cc.quicks || []).slice(0, 3);
      if (lines.length) {
        const g1 = shoppingGuard(lines, {});
        try { shopGuardLog(q, g1.violations); } catch (e) {}
        if (g1.blocked) return { handback: { to: g1.handback || "A1", reason: "diagnosis-guard" } };
        return { agent: "A3", lines: g1.lines, cards: cards, buttons: buttons, cite: cite, nav: nav, catalog: catalog, compare: null, guard: g1.violations };
      }
    }
  }
  if (!lines.length) return null;

  const g = shoppingGuard(lines, {});
  try { shopGuardLog(q, g.violations); } catch (e) {}
  if (g.blocked) return { handback: { to: g.handback || "A1", reason: "diagnosis-guard" } };
  return { agent: "A3", lines: g.lines, cards: [], buttons: buttons.slice(0, 3), cite: cite.slice(0, 3), nav: nav, catalog: catalog, compare: cmp, guard: g.violations };
}

try { if (typeof window !== "undefined") { window.__hifinA3 = { answer: shoppingAgent, category: _a3Category, need: _a3Need }; } } catch (e) {}
