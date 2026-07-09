/* ====================== 건강쇼핑 커머스 온톨로지 — 공급업체·제품·질환 지식그래프 ======================
   검진 후 케어 → 건강쇼핑에 들어와 있는 모든 오브젝트(특별제휴사·제휴브랜드·회원사·영양제/의료기/식단 제품·
   GN바디닥터 갤러리)에 '의미'를 부여하고, 질환 ↔ 성분/카테고리 ↔ 제품 ↔ 공급업체 '관계'를 형성해
   AI Super Agent가 학습·상담·안내하도록 하는 KB.  (실제 상품몰 데이터 통합, 시연용)

   소스: SHOP_PARTNERS(특별제휴사) · SHOP_BRANDS(제휴브랜드) · SUPP_PRODUCTS/DEVICE_PRODUCTS(제품) ·
        SUPP_MEMBERS/DEVICE_MEMBERS(회원사) · SP_GALLERY(GN바디닥터 갤러리) · MEAL_PRODUCTS(식단) ·
        SHOP_INTEL_AREAS(영양 건강영역) · SHOP_INTEL_DEVICES(기기 영역) · SHOP_AI(큐레이션) */

/* 질환/증상 → 건강영역(영양·기기) · 대표 기기제품 · 강조 공급업체 매핑 */
const COMM_DISEASE = [
  { dz: "당뇨", label: "당뇨·혈당 관리", kw: ["당뇨", "혈당", "고혈당", "당화혈색소"], areas: ["혈당"], devProducts: ["혈당측정", "CGM", "연속혈당"], vendors: ["JW중외제약", "자원메디칼", "카카오헬스케어"], note: "식후 혈당 관리와 자가 혈당 모니터링" },
  { dz: "고혈압", label: "고혈압·혈압 관리", kw: ["고혈압", "혈압", "혈압약"], areas: ["혈압"], devProducts: ["혈압계"], vendors: ["오므론", "휴비딕", "GN바디닥터"], note: "혈압 관리와 가정용 혈압 측정" },
  { dz: "고지혈증", label: "고지혈·혈행 관리", kw: ["고지혈", "콜레스테롤", "중성지방", "혈행", "동맥경화", "이상지질"], areas: ["혈행"], devProducts: [], vendors: ["종근당건강", "조윈"], note: "혈중 중성지방·혈행 관리" },
  { dz: "관절염", label: "관절·연골 건강", kw: ["관절", "무릎", "연골", "골관절염", "퇴행성관절", "류마티스", "오십견", "어깨통증"], areas: ["관절", "통증"], devProducts: ["골관절염 치료기", "고주파 리페어", "바디닥터"], vendors: ["GN바디닥터", "안국약품", "조윈", "세라젬"], note: "관절·연골 건강과 가정용 통증·온열 케어" },
  { dz: "요실금", label: "요실금·배뇨 건강", kw: ["요실금", "방광", "배뇨", "실금", "소변", "빈뇨", "야뇨"], areas: ["요로", "전립선"], devProducts: ["요실금 치료기"], vendors: ["GN바디닥터"], note: "요로·배뇨 건강과 가정용 요실금 케어" },
  { dz: "전립선", label: "전립선·배뇨 건강", kw: ["전립선", "전립샘", "배뇨장애"], areas: ["전립선", "요로"], devProducts: [], vendors: [], note: "전립선·배뇨 기능 관리" },
  { dz: "눈질환", label: "눈·시력 건강", kw: ["눈", "시력", "황반", "백내장", "노안", "안구건조", "눈건강", "비문증"], areas: ["눈"], devProducts: [], vendors: ["하이-아이즈", "조윈", "안국약품"], note: "황반색소·눈 건강" },
  { dz: "간질환", label: "간 건강", kw: ["간", "지방간", "간수치", "간기능", "숙취", "b형간염", "c형간염"], areas: ["간"], devProducts: [], vendors: ["JW중외제약", "조윈", "대웅제약"], note: "간세포 보호·항산화" },
  { dz: "장질환", label: "장 건강", kw: ["장", "변비", "설사", "과민성", "장건강", "유산균", "배변"], areas: ["장"], devProducts: [], vendors: ["종근당건강", "제노포커스", "유니베라"], note: "유익균·배변활동 관리" },
  { dz: "면역저하", label: "면역·활력", kw: ["면역", "감기", "환절기", "기력", "허약", "잔병"], areas: ["면역"], devProducts: [], vendors: ["KGC인삼공사", "한독", "유니베라"], note: "면역력 증진·피로 개선" },
  { dz: "암", label: "암·만성질환 면역 관리", kw: ["암", "항암", "종양", "암환자", "위암", "폐암", "유방암", "대장암", "췌장암"], areas: ["면역"], devProducts: [], vendors: ["조윈"], note: "암·만성질환 환우 맞춤 면역·영양(정보 제공용, 치료 대체 아님)" },
  { dz: "골다공증", label: "뼈·골밀도 건강", kw: ["골다공증", "뼈", "골밀도", "칼슘", "관절뼈"], areas: ["뼈"], devProducts: [], vendors: ["한독"], note: "칼슘·비타민D 뼈 건강" },
  { dz: "피부질환", label: "피부 건강", kw: ["피부", "탄력", "주름", "보습", "미용", "콜라겐"], areas: ["피부"], devProducts: ["바디닥터 리페어", "고주파 리페어"], vendors: ["GN바디닥터"], note: "피부 보습·탄력 관리" },
  { dz: "불면", label: "수면·스트레스", kw: ["불면", "수면", "잠", "스트레스", "긴장", "예민"], areas: ["수면"], devProducts: [], vendors: [], note: "수면의 질·스트레스 완화" },
  { dz: "치매", label: "인지·기억력", kw: ["치매", "기억력", "인지", "건망증", "알츠하이머", "뇌건강"], areas: ["인지"], devProducts: [], vendors: ["조윈"], note: "노화로 인한 기억력 관리" },
  { dz: "피로", label: "에너지·피로 회복", kw: ["피로", "만성피로", "활력", "기운", "에너지"], areas: ["에너지"], devProducts: [], vendors: ["대웅제약", "KGC인삼공사"], note: "에너지 대사·피로 개선" },
  { dz: "비만", label: "비만·체중 관리", kw: ["비만", "체중", "다이어트", "복부비만", "체지방"], areas: ["체성분"], devProducts: ["체성분"], vendors: ["인바디", "GN바디닥터"], note: "체성분·체중 관리" },
  { dz: "심혈관", label: "심혈관·혈행 건강", kw: ["심혈관", "심장", "뇌졸중", "뇌경색", "혈관"], areas: ["혈행"], devProducts: [], vendors: ["조윈", "종근당건강"], note: "혈행·심뇌혈관 위험 관리" },
  { dz: "호흡기", label: "호흡·산소 모니터", kw: ["호흡", "천식", "copd", "폐", "산소", "기관지"], areas: ["산소"], devProducts: ["맥박산소", "산소포화"], vendors: ["오므론"], note: "호흡기 자가 모니터링" },
  { dz: "발열", label: "발열·체온 관리", kw: ["발열", "고열", "체온", "미열"], areas: ["체온"], devProducts: ["체온계"], vendors: ["휴비딕"], note: "체온 측정·발열 관리" },
];

/* ── 커머스 지식그래프 빌더 (실제 상품몰 오브젝트 통합·색인) ── */
let _commKB = null;
function commerceKB() {
  if (_commKB) return _commKB;
  const SP = (typeof SHOP_PARTNERS !== "undefined") ? SHOP_PARTNERS : {};
  const SB = (typeof SHOP_BRANDS !== "undefined") ? SHOP_BRANDS : {};
  const SUPP = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const DEV = (typeof DEVICE_PRODUCTS !== "undefined") ? DEVICE_PRODUCTS : [];
  const MEAL = (typeof MEAL_PRODUCTS !== "undefined") ? MEAL_PRODUCTS : [];
  const SUPPM = (typeof SUPP_MEMBERS !== "undefined") ? SUPP_MEMBERS : [];
  const DEVM = (typeof DEVICE_MEMBERS !== "undefined") ? DEVICE_MEMBERS : [];
  const GAL = (typeof SP_GALLERY !== "undefined") ? SP_GALLERY : {};
  const IAREAS = (typeof SHOP_INTEL_AREAS !== "undefined") ? SHOP_INTEL_AREAS : [];
  const IDEV = (typeof SHOP_INTEL_DEVICES !== "undefined") ? SHOP_INTEL_DEVICES : [];

  const vendors = {};
  const products = [];
  const paren = (nm) => String(nm).split(/[()（）]/).map((s) => s.trim()).filter(Boolean);
  const V = (name, patch) => {
    if (!name) return null; const key = String(name).trim(); if (!key) return null;
    if (!vendors[key]) vendors[key] = { name: key, aka: [], kind: "", cat: "", type: "", url: "", desc: "", products: [], tags: [] };
    const v = vendors[key];
    paren(key).forEach((p) => { if (p !== key && !v.aka.includes(p)) v.aka.push(p); });
    if (patch) { ["kind", "cat", "type", "url", "desc"].forEach((k) => { if (patch[k] && !v[k]) v[k] = patch[k]; }); if (patch.aka) patch.aka.forEach((a) => { if (a && !v.aka.includes(a)) v.aka.push(a); }); }
    return v;
  };
  const addProd = (pr, vendorName) => { products.push(pr); const v = vendorName ? V(vendorName) : null; if (v) { v.products.push(pr); if (pr.category && !v.tags.includes(pr.category)) v.tags.push(pr.category); } };

  const kindByGroup = { diet: "건강식단", supp: "영양제", device: "홈케어의료기" };
  // 1) 특별제휴사
  Object.keys(SP).forEach((g) => (SP[g] || []).forEach((p) => {
    const v = V(p.name, { kind: kindByGroup[g] || "", cat: kindByGroup[g], type: "특별제휴사", url: p.home || "", desc: p.tagline || "", aka: [p.brand].filter(Boolean) });
    (p.chips || []).forEach((c) => { if (v && !v.tags.includes(c)) v.tags.push(c); });
  }));
  // 2) 제휴 브랜드
  Object.keys(SB).forEach((g) => (SB[g] || []).forEach((row) => { const nm = row[0], sub = row[1]; V(nm, { kind: kindByGroup[g] || "", cat: kindByGroup[g], type: "제휴 브랜드", desc: sub || "" }); }));
  // 3) 영양제 제품
  SUPP.forEach((p) => addProd({ name: p.name, brand: p.brand, vendor: p.brand, category: p.category, claim: p.claim || "", price: p.price || 0, kind: "영양제", url: p.url || "" }, p.brand));
  // 4) 홈케어의료기 제품
  DEV.forEach((p) => addProd({ name: p.name, brand: p.brand, vendor: p.brand, category: p.category, claim: p.claim || "", price: p.price || 0, kind: "홈케어의료기", url: p.url || "" }, p.brand));
  // 5) 건강식단 제품
  MEAL.forEach((p) => addProd({ name: p.name, brand: p.brand, vendor: p.brand, category: p.category, claim: p.desc || "", price: p.price || 0, kind: "건강식단", url: p.url || "" }, p.brand));
  // 6) 회원사(영양제·의료기)
  const memAdd = (list, kind) => (list || []).forEach((m) => {
    const v = V(m.company, { kind, cat: kind, type: m.type || "회원사", url: m.url || "", desc: m.desc || "" });
    if (v && m.tag && !v.tags.includes(m.tag)) v.tags.push(m.tag);
    if (m.product) addProd({ name: m.product, brand: m.company, vendor: m.company, category: m.tag || kind, claim: m.desc || "", price: 0, kind, url: m.url || "" }, m.company);
  });
  memAdd(SUPPM, "영양제"); memAdd(DEVM, "홈케어의료기");
  // 7) GN바디닥터 갤러리 제품
  Object.keys(GAL).forEach((vn) => (GAL[vn] || []).forEach((g) => { if (g && g.name) addProd({ name: g.name, brand: vn, vendor: vn, category: "가정용 의료기", claim: "", price: 0, kind: "홈케어의료기", url: (vendors[vn] && vendors[vn].url) || "" }, vn); }));

  // 8) 건강영역(질환↔성분/기기) — SHOP_INTEL_AREAS(영양) + SHOP_INTEL_DEVICES(기기)
  const areas = [];
  IAREAS.forEach((a) => areas.push({ key: a.key, label: a.label, claim: a.claim || "", ings: a.ings || [], cats: a.cats || [], kind: "영양제", partners: [] }));
  IDEV.forEach((a) => areas.push({ key: a.key, label: a.label, claim: a.note || "", ings: a.ings || [], cats: [], kind: "홈케어의료기", partners: a.partners || [] }));
  // 카테고리 → 건강영역 라벨 색인
  const areasByCat = {};
  areas.forEach((a) => (a.cats || []).forEach((c) => { (areasByCat[c] = areasByCat[c] || []).push(a.label); }));

  _commKB = { vendors, vendorList: Object.values(vendors), products, areas, areasByCat, DISEASE: COMM_DISEASE };
  return _commKB;
}

/* ── 매칭 헬퍼 ── */
function _cNorm(s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); }
function _matchVendor(text, kb) {
  const t = _cNorm(text); let best = null;
  kb.vendorList.forEach((v) => {
    const cands = [v.name].concat(v.aka || []);
    cands.forEach((c) => { const cn = _cNorm(c); if (cn.length >= 2 && t.includes(cn)) { const sc = cn.length; if (!best || sc > best.score) best = { item: v, score: sc }; } });
  });
  return best;
}
function _matchProductFull(text, kb) {
  const t = _cNorm(text); let best = null;
  kb.products.forEach((p) => { const nm = _cNorm(p.name); if (nm.length >= 3 && t.includes(nm)) { if (!best || nm.length > best.score) best = { item: p, score: nm.length }; } });
  return best;
}
function _matchProductToken(text, kb) {
  const words = String(text).split(/[\s,·()]+/).map((w) => w.trim()).filter((w) => w.length >= 3 && !/^(영양제|보충제|건기식|건강기능식품|의료기|치료기|측정기|만성질환|건강식단|도시락)$/.test(w));
  let best = null;
  kb.products.forEach((p) => { words.forEach((w) => { if (p.name.includes(w)) { const sc = w.length; if (!best || sc > best.score) best = { item: p, score: sc }; } }); });
  return best;
}

const _COMM_WORD = /(영양제|보충제|건기식|건강기능식품|제품|기기|의료기|치료기|측정기|혈압계|혈당계|정수기|디바이스|브랜드|업체|공급업체|공급사|제조사|판매|취급|구매|사고싶|사려|살까|어디서|최저가|추천|파는|찾아|알려)/;

function _vendorAreas(v, kb) { const out = []; (v.tags || []).forEach((c) => (kb.areasByCat[c] || []).forEach((l) => { if (!out.includes(l)) out.push(l); })); (v.products || []).forEach((p) => (kb.areasByCat[p.category] || []).forEach((l) => { if (!out.includes(l)) out.push(l); })); return out; }

function _vendorCard(v, kb) {
  const items = [];
  if (v.desc) items.push(v.desc);
  items.push(`분류: ${v.kind || v.cat || "제휴사"} · ${v.type || "공급업체"}`);
  const prods = (v.products || []).map((p) => p.name).filter(Boolean).slice(0, 5);
  if (prods.length) items.push(`대표 취급 제품: ${prods.join(" · ")}`);
  else if ((v.tags || []).length) items.push(`취급 품목: ${v.tags.slice(0, 6).join(" · ")}`);
  const hareas = _vendorAreas(v, kb).slice(0, 5);
  if (hareas.length) items.push(`관련 건강영역: ${hareas.join(" · ")}`);
  if (v.url) items.push(`공식몰: ${v.url}`);
  const btn = v.kind === "영양제" ? "🛒 건강쇼핑에서 성분·제품 보기" : v.kind === "홈케어의료기" ? "🛒 홈케어 기기 보기" : "🛒 건강쇼핑·AI 상담사 바로가기";
  const q = [];
  if (prods[0]) q.push(`${prods[0]} 알려줘`);
  if (hareas[0]) q.push(`${hareas[0]} 관련 제품 추천`);
  q.push("🛒 건강쇼핑·AI 상담사 바로가기");
  const intro = v.desc ? `‘${v.name}’ 안내예요. ${v.desc}` : `‘${v.name}’은(는) ${(v.kind || "건강쇼핑")} 공급업체예요.`;
  return { bubbles: [
    { kind: "text", text: `${intro} 취급 제품과 관련 건강영역을 안내해 드릴게요.` },
    { kind: "card", card: { title: `🏢 ${v.name}`, items, buttons: [btn] } },
  ], quicks: q.slice(0, 3) };
}

function _productCard(p, kb) {
  const items = [];
  items.push(`공급업체(브랜드): ${p.brand || p.vendor || "-"}`);
  if (p.category) items.push(`분류: ${p.kind} · ${p.category}`);
  if (p.claim) items.push(p.claim);
  if (p.price) items.push(`가격: 약 ${Number(p.price).toLocaleString("ko-KR")}원 (표시가 기준)`);
  const hareas = (kb.areasByCat[p.category] || []).slice(0, 4);
  if (hareas.length) items.push(`도움 되는 건강영역: ${hareas.join(" · ")}`);
  if (p.url) items.push(`구매·정보: ${p.url}`);
  const btn = p.kind === "홈케어의료기" ? "🛒 홈케어 기기 보기" : p.kind === "건강식단" ? "🛒 건강쇼핑·AI 상담사 바로가기" : "🛒 건강쇼핑에서 성분·제품 보기";
  return { bubbles: [
    { kind: "text", text: p.claim ? `‘${p.name}’ — ${p.claim}` : `‘${p.name}’은(는) ${p.brand || "제휴사"}의 ${p.category || "건강"} 제품이에요.` },
    { kind: "card", card: { title: `🛒 ${p.name}`, items, buttons: [btn] } },
  ], quicks: [`${p.brand || p.vendor} 회사 소개`, hareas[0] ? `${hareas[0]} 관련 제품 추천` : "🛒 건강쇼핑·AI 상담사 바로가기", "내 리포트 요약"].slice(0, 3) };
}

function _diseaseReco(dz, kb, text) {
  const areas = kb.areas.filter((a) => (dz.areas || []).includes(a.key));
  const suppAreas = areas.filter((a) => a.kind === "영양제");
  const devAreas = areas.filter((a) => a.kind === "홈케어의료기");
  const suppCats = new Set(); suppAreas.forEach((a) => (a.cats || []).forEach((c) => suppCats.add(c)));
  const suppProds = kb.products.filter((p) => p.kind === "영양제" && suppCats.has(p.category)).slice(0, 4);
  const devProds = [];
  (dz.devProducts || []).forEach((nm) => kb.products.forEach((p) => { if (p.kind === "홈케어의료기" && p.name.includes(nm) && devProds.indexOf(p) < 0) devProds.push(p); }));
  const vendorSet = new Set();
  suppProds.forEach((p) => vendorSet.add(p.brand));
  devAreas.forEach((a) => (a.partners || []).forEach((v) => vendorSet.add(v)));
  devProds.forEach((p) => vendorSet.add(p.brand || p.vendor));
  (dz.vendors || []).forEach((v) => vendorSet.add(v));

  const cards = [];
  const suppItems = [];
  suppAreas.forEach((a) => { if (a.claim) suppItems.push(`✅ ${a.claim}`); });
  if (suppProds.length) suppItems.push(`예: ${suppProds.map((p) => `${p.name}(${p.brand})`).join(" · ")}`);
  if (suppItems.length) cards.push({ kind: "card", card: { title: `💊 ${dz.label} 추천 영양(성분)`, items: suppItems.slice(0, 6), buttons: ["🛒 건강쇼핑에서 성분·제품 보기"] } });
  const devItems = [];
  devAreas.forEach((a) => { if (a.claim) devItems.push(`🩺 ${a.claim}`); });
  if (devProds.length) devItems.push(`예: ${devProds.map((p) => `${p.name}${p.brand ? "(" + p.brand + ")" : ""}`).join(" · ")}`);
  if (devItems.length) cards.push({ kind: "card", card: { title: `🏠 ${dz.label} 관련 홈케어 의료기`, items: devItems.slice(0, 6), buttons: ["🛒 홈케어 기기 보기"] } });
  const vend = Array.from(vendorSet).filter(Boolean).slice(0, 6);
  if (vend.length) cards.push({ kind: "card", card: { title: "🏢 관련 공급업체·브랜드", items: [vend.join(" · "), "‘업체 이름’ 또는 ‘업체 + 제품’으로 물어보면 상세히 안내해 드려요."], buttons: ["🛒 건강쇼핑·AI 상담사 바로가기"] } });

  if (!cards.length) return null;
  const t0 = `‘${String(text).trim()}’ 관련해서 ${dz.note} 목적의 제품·공급업체를 안내해 드릴게요. (정보 제공용이며 진단·치료를 대체하지 않아요.)`;
  return { bubbles: [{ kind: "text", text: t0 }, ...cards], quicks: [`${dz.dz} 증상은 무엇인가요?`, vend[0] ? `${vend[0]} 소개` : "🛒 건강쇼핑·AI 상담사 바로가기", "내 리포트 요약"].slice(0, 3) };
}

function _catOverview(kind, kb) {
  const brands = kb.vendorList.filter((v) => v.kind === kind && v.name).slice(0, 8).map((v) => v.name);
  const prods = kb.products.filter((p) => p.kind === kind).slice(0, 5).map((p) => p.name);
  const items = [];
  if (brands.length) items.push(`제휴 공급업체·브랜드: ${brands.join(" · ")}`);
  if (prods.length) items.push(`대표 제품: ${prods.join(" · ")}`);
  items.push("‘질환 + " + (kind === "홈케어의료기" ? "기기" : kind === "건강식단" ? "식단" : "영양제") + "’ 또는 ‘업체 이름’으로 물어보시면 맞춤 안내해 드려요.");
  const btn = kind === "홈케어의료기" ? "🛒 홈케어 기기 보기" : "🛒 건강쇼핑에서 성분·제품 보기";
  return { bubbles: [
    { kind: "text", text: `${kind} 상품몰을 안내해 드릴게요. 어떤 질환·목적인지 알려주시면 딱 맞는 제품과 공급업체를 연결해 드려요.` },
    { kind: "card", card: { title: `🛒 ${kind} 안내`, items, buttons: [btn] } },
  ], quicks: kind === "홈케어의료기" ? ["당뇨 혈당측정기 추천", "요실금 치료기 알려줘", "🛒 홈케어 기기 보기"] : ["관절 영양제 추천", "면역 영양제 추천", "🛒 건강쇼핑에서 성분·제품 보기"] };
}

/* ── 커머스 상담 진입점 — 업체/제품/질환-제품 질의를 응답, 아니면 null ── */
function commerceCounsel(text) {
  if (!text) return null;
  let kb; try { kb = commerceKB(); } catch (e) { return null; }
  if (!kb || !kb.vendorList.length) return null;
  const low = String(text).toLowerCase();
  const commerce = _COMM_WORD.test(low);

  // 1) 제품 정확(전체 이름) 매칭 우선 — 예: "요실금 치료기", "락토핏 골드"
  const pFull = _matchProductFull(text, kb);
  if (pFull) return _productCard(pFull.item, kb);
  // 2) 공급업체 매칭 — 예: "GN바디닥터 찾아줘", "종근당건강"
  const vHit = _matchVendor(text, kb);
  if (vHit) return _vendorCard(vHit.item, kb);
  // 3) 질환 + 커머스 의도 — 예: "요실금 영양제", "관절 기기 추천"
  const dHit = COMM_DISEASE.find((d) => d.kw.some((k) => text.includes(k)));
  if (dHit && commerce) { const r = _diseaseReco(dHit, kb, text); if (r) return r; }
  // 4) 부분(토큰) 제품 매칭 — 예: "락토핏", "센트룸"
  const pTok = _matchProductToken(text, kb);
  if (pTok) return _productCard(pTok.item, kb);
  // 5) 카테고리 개요 (커머스 의도만)
  if (commerce) {
    if (/(영양제|보충제|건기식|건강기능식품)/.test(low)) return _catOverview("영양제", kb);
    if (/(의료기|기기|치료기|측정기|혈압계|혈당계|디바이스|정수기)/.test(low)) return _catOverview("홈케어의료기", kb);
    if (/(식단|도시락|케어푸드|밀키트|반찬)/.test(low)) return _catOverview("건강식단", kb);
  }
  return null;
}
