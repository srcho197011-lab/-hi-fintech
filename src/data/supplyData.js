/* ====================== 협력업체 온톨로지 · 하네스 — 거래 사실 레이어 데이터셋 ======================
   Partner Ontology & Governance Harness 의 **거래 사실 레이어**다(결정적 · 무재고/직배송).
   성격 — 이 파일은 「누구와 무슨 거래가 있었는가」만 들고 있다. 「그 거래가 적법·건전한가」는
     src/data/partnerGov.js(용어·표시명) 및 그 뒤 단계의 판정 레지스트리가 맡는다. 섞지 않는다.
   용어 — 화면에 찍는 낱말의 단일 원천은 partnerGov.js 의 PG_TERMS 다(§0-5). 여기서 라벨을 만들지 않는다.
   코드 식별자(SC_* · _sc* · supplyData · supplyFinance)는 **개칭하지 않는다** — 단일 번들(전역 공유)이라
     개칭 과도기에 같은 이름이 둘 생기면 조용히 덮어쓴다(§3-1).

   mulberry32 시드로 매 로드 동일 데이터(재현 가능). 고객·계정 = pilotCohort(10만) 재사용.
   나머지 7개 오브젝트(거래처·제품·계약·공급사 가용재고·주문·배송·정산)를 FK로 연결.
   ★ 모델: 재고·배송은 거래처(공급사)가 수행, 당사는 주문·정산 오케스트레이션(무재고).
   ★ 매출·매입의 단일 원천은 **주문**이고 정산은 주문에서 전건 파생되는 **종속 장부**다(형 확정 Q1 · 2026-10-25).
     수수료율의 단일 원천은 **계약(contract.feePct)**이다. 시연 시드 데이터다. */

/* 건강쇼핑에 실제로 올라온 거래선 전수 [상호, 공급분류] — 특별제휴·회원사·상품몰 브랜드·건강식단사 (합성 이름 없음) */
const SC_VENDORS = [
  // 영양제 특별제휴·회원사
  ["한국암웨이(뉴트리라이트)", "영양제"], ["한독(네이처셋)", "영양제"], ["조윈(헬스인슈)", "영양제"], ["모아라이프플러스", "영양제"],
  ["유니베라", "영양제"], ["하이-아이즈", "영양제"], ["헤일리온 코리아", "영양제"], ["알고케어", "영양제"], ["필워크", "영양제"],
  ["DSM코리아", "영양제"], ["광헬스케어", "영양제"], ["크레놀", "영양제"], ["제노포커스", "영양제"], ["바이오뉴트리온", "영양제"], ["디이프", "영양제"], ["정밀영양협회", "영양제"],
  // 영양제 상품몰 브랜드
  ["KGC인삼공사(정관장)", "영양제"], ["한삼인", "영양제"], ["종근당건강", "영양제"], ["고려은단", "영양제"], ["대웅제약", "영양제"], ["일동제약", "영양제"],
  ["유한양행", "영양제"], ["유한헬스팜", "영양제"], ["GC녹십자웰빙", "영양제"], ["안국건강", "영양제"], ["뉴트리", "영양제"], ["GNM자연의품격", "영양제"], ["뉴트리코어", "영양제"],
  ["세노비스", "영양제"], ["솔가", "영양제"], ["나우푸드", "영양제"], ["쎌바이오텍", "영양제"], ["경남제약", "영양제"], ["덴프스", "영양제"], ["뉴트리원", "영양제"], ["뉴트리디데이", "영양제"],
  ["JW중외제약", "영양제"], ["순수식품", "영양제"], ["내츄럴플러스", "영양제"], ["세비톨", "영양제"], ["비비랩", "영양제"], ["비타할로", "영양제"], ["쏜리서치", "영양제"], ["닥터스베스트", "영양제"], ["라이프익스텐션", "영양제"], ["화이자", "영양제"],
  // 홈케어 의료기기 (특별제휴·회원사·상품몰 브랜드)
  ["GN바디닥터(제너럴네트)", "홈케어의료기"], ["오므론", "홈케어의료기"], ["인바디", "홈케어의료기"], ["휴비딕", "홈케어의료기"], ["브라운", "홈케어의료기"], ["초이스메드", "홈케어의료기"], ["참케어", "홈케어의료기"],
  ["아큐첵", "홈케어의료기"], ["케어센스", "홈케어의료기"], ["에스디바이오센서", "홈케어의료기"], ["바디프랜드", "홈케어의료기"], ["LG전자", "홈케어의료기"], ["세라젬", "홈케어의료기"], ["코지마", "홈케어의료기"], ["클럭", "홈케어의료기"],
  ["멜킨스포츠", "홈케어의료기"], ["퓨리오", "홈케어의료기"], ["닥터웰", "홈케어의료기"], ["대일산업", "홈케어의료기"], ["대경전자", "홈케어의료기"], ["스템코리아", "홈케어의료기"], ["필립스", "홈케어의료기"], ["오아", "홈케어의료기"], ["조인메디칼", "홈케어의료기"],
  ["가포넷", "홈케어의료기"], ["알파메딕", "홈케어의료기"], ["에르고바디", "홈케어의료기"], ["시그니아", "홈케어의료기"], ["히어링에이블", "홈케어의료기"], ["올그린", "홈케어의료기"], ["이소닉", "홈케어의료기"], ["다솔", "홈케어의료기"], ["샤오미", "홈케어의료기"], ["빼다", "홈케어의료기"],
  ["카카오헬스케어", "홈케어의료기"], ["테라젠바이오", "홈케어의료기"], ["EDGC", "홈케어의료기"], ["두잉랩", "홈케어의료기"], ["TLC메디컬그룹", "홈케어의료기"], ["코이헬스케어", "홈케어의료기"], ["NSHC", "홈케어의료기"], ["에스크랩스", "홈케어의료기"], ["제이앤아이드바이저그룹", "홈케어의료기"],
  // 건강식단 (특별제휴·유력 브랜드)
  ["풀무원(디자인밀)", "건강식단"], ["현대그린푸드(그리팅)", "건강식단"], ["매일헬스뉴트리션(셀렉스)", "건강식단"], ["대상웰라이프(뉴케어)", "건강식단"], ["메디쏠라", "건강식단"], ["헤링스", "건강식단"],
  ["지리산청강원", "건강식단"], ["팜킷", "건강식단"], ["닥터키친", "건강식단"], ["프레시지", "건강식단"], ["CJ프레시웨이", "건강식단"], ["본죽", "건강식단"], ["동원F&B(더반찬&)", "건강식단"], ["hy(한국야쿠르트)", "건강식단"], ["아워홈(케어플러스)", "건강식단"], ["스파오(잇메이트)", "건강식단"],
  // 의약외품
  ["㈜메디콥(밴드닥터·클린덤)", "의약외품"],
];
const SC_VTYPE = [["제조사", 40], ["유통사", 30], ["브랜드사", 20], ["수입원", 10]];
const SC_PCATS = [["영양제", 42], ["홈케어의료기", 30], ["건강식단", 18], ["의약외품", 10]];
const SC_SEG = [["개인", 78], ["기업(임직원)", 9], ["병원·의원", 6], ["약국", 5], ["복지기관", 2]];
const SC_CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배"];
const SC_ORD_STATUS = [["배송완료", 66], ["배송중", 16], ["출고준비", 9], ["접수", 5], ["취소", 4]];
const SC_PROD_WORDS = {
  "영양제": ["프리미엄 오메가3", "루테인 지아잔틴", "종합비타민", "프로바이오틱스", "밀크씨슬", "마그네슘", "비타민D 4000", "고려홍삼정", "칼슘 마그네슘 아연", "코엔자임Q10", "쏘팔메토", "콜라겐 펩타이드"],
  "홈케어의료기": ["전자혈압계", "혈당측정기", "네블라이저", "저주파 마사지기", "적외선 조사기", "체성분 측정기", "비접촉 체온계", "산소포화도 측정기", "요실금 케어기", "안마의자", "온열 매트", "고주파 리페어"],
  "건강식단": ["당뇨 케어식단", "신장 케어식단", "저염 밸런스식", "단백질 보충식", "암환자 회복식단", "시니어 연화식", "저칼로리 밀키트", "고단백 도시락"],
  "의약외품": ["방수 밴드", "습윤 드레싱", "알콜 스왑", "소독 스프레이", "상처연고 키트", "카이로 핫팩", "마스크 KF94", "손소독제"],
};

/* 브랜드(상품몰 제품의 brand) → 거래처 정규화 매핑 */
function _vkey(s) { return String(s).replace(/\(.*?\)/g, "").replace(/㈜/g, "").replace(/[\s·&]/g, "").toLowerCase(); }
const SC_BRAND_ALIAS = {
  "NOW Foods": "나우푸드", "KGC인삼공사": "KGC인삼공사(정관장)", "KGC정관장": "KGC인삼공사(정관장)",
  "매일유업 셀렉스": "매일헬스뉴트리션(셀렉스)", "매일헬스뉴트리션": "매일헬스뉴트리션(셀렉스)",
  "풀무원 디자인밀": "풀무원(디자인밀)", "디자인밀": "풀무원(디자인밀)",
  "현대그린푸드 그리팅": "현대그린푸드(그리팅)", "그리팅": "현대그린푸드(그리팅)",
  "동원 더반찬&": "동원F&B(더반찬&)", "hy 잇츠온": "hy(한국야쿠르트)", "아워홈 케어플러스": "아워홈(케어플러스)", "잇메이트(스파오)": "스파오(잇메이트)",
  "제너럴네트": "GN바디닥터(제너럴네트)", "메디콥": "㈜메디콥(밴드닥터·클린덤)", "밴드닥터": "㈜메디콥(밴드닥터·클린덤)",
  "뉴트리라이트": "한국암웨이(뉴트리라이트)", "네이처셋(NatureSet)": "한독(네이처셋)", "대상웰라이프": "대상웰라이프(뉴케어)",
};
/* 카테고리별 원가율(매입가/판매가) 범위 + 기업규모(대>중>소) 경향 — 대기업일수록 원가율↑(마진↓) */
const SC_COSTRATE = { "영양제": [0.20, 0.60], "홈케어의료기": [0.30, 0.70], "건강식단": [0.40, 0.75], "의약외품": [0.30, 0.50] };
const SC_BIG = new Set(["화이자", "KGC인삼공사(정관장)", "종근당건강", "대웅제약", "일동제약", "유한양행", "LG전자", "오므론", "필립스", "인바디", "바디프랜드", "세라젬", "샤오미", "브라운", "한국암웨이(뉴트리라이트)", "한독(네이처셋)", "GC녹십자웰빙", "매일헬스뉴트리션(셀렉스)", "대상웰라이프(뉴케어)", "CJ프레시웨이", "동원F&B(더반찬&)", "hy(한국야쿠르트)", "아워홈(케어플러스)", "풀무원(디자인밀)", "현대그린푸드(그리팅)", "카카오헬스케어", "프레시지", "스파오(잇메이트)", "닥터스베스트", "솔가", "나우푸드", "라이프익스텐션", "쏜리서치", "GN바디닥터(제너럴네트)"]);
const SC_MID = new Set(["고려은단", "안국건강", "뉴트리", "경남제약", "쎌바이오텍", "휴비딕", "케어센스", "아큐첵", "에스디바이오센서", "클럭", "코지마", "덴프스", "세노비스", "닥터웰", "필워크", "알고케어", "DSM코리아", "테라젠바이오", "EDGC", "본죽", "멜킨스포츠", "대일산업", "유니베라", "한삼인", "필립스", "조인메디칼", "참케어", "초이스메드", "시그니아"]);
function _scScale(nm) { return SC_BIG.has(nm) ? "대" : SC_MID.has(nm) ? "중" : "소"; }
function _scCostRate(cat, scale, rng) {
  const r = SC_COSTRATE[cat] || SC_COSTRATE["영양제"];
  const base = scale === "대" ? 0.62 : scale === "중" ? 0.33 : 0.0;
  const span = scale === "대" ? 0.38 : scale === "중" ? 0.37 : 0.42;
  return r[0] + (r[1] - r[0]) * (base + rng() * span);
}
function _scBizno(rng) { return String(100 + Math.floor(rng() * 899)).padStart(3, "0") + "-" + String(10 + Math.floor(rng() * 89)) + "-" + String(10000 + Math.floor(rng() * 89999)); }
function _scDate(rng, y) { return y + "-" + String(1 + Math.floor(rng() * 7)).padStart(2, "0") + "-" + String(1 + Math.floor(rng() * 27)).padStart(2, "0"); }

let _scData = null;
function supplyData() {
  if (_scData) return _scData;
  const rng = _mul32(0x5C0FFEE);
  const n = (typeof PILOT_N !== "undefined") ? PILOT_N : 100000;

  /* 1) 거래처·공급사 (Vendor) — 건강쇼핑 실제 거래선 전수 */
  const vendors = SC_VENDORS.map((v, i) => {
    const nm = v[0], cat = v[1];
    const scale = _scScale(nm);
    return {
      id: "V" + String(i + 1).padStart(4, "0"), name: nm, bizno: _scBizno(rng),
      type: _wpick(rng, SC_VTYPE), category: cat, scale,
      credit: (scale === "대" ? 30 + rng() * 70 : scale === "중" ? 10 + rng() * 30 : 3 + rng() * 12) * 1000000, payable: Math.floor(rng() * 38) * 1000000,
      sla: 1 + Math.floor(rng() * 3), trust: (3.9 + rng() * 1.1).toFixed(1),
      ship: true, since: (2013 + Math.floor(rng() * 12)) + "년",
    };
  });

  /* 2) 제품·SKU (Product) — ★ 실제 상품몰 제품(SUPP·DEVICE·MEAL)을 SKU로 1:1 연결 + 거래처 매핑 */
  const vByKey = {}; vendors.forEach((v) => { vByKey[_vkey(v.name)] = v; });
  const resolveVendor = (brand, supCat) => {
    const a = SC_BRAND_ALIAS[brand] || brand;
    let v = vByKey[_vkey(a)] || vByKey[_vkey(brand)];
    if (!v) { const bk = _vkey(brand); v = vendors.find((x) => { const k = _vkey(x.name); return k === bk || (bk.length > 1 && k.includes(bk)) || (k.length > 1 && bk.includes(k)); }); }
    if (!v) { const sc = _scScale(brand); v = { id: "V" + String(vendors.length + 1).padStart(4, "0"), name: brand, bizno: _scBizno(rng), type: _wpick(rng, SC_VTYPE), category: supCat, scale: sc, credit: (sc === "대" ? 30 : sc === "중" ? 12 : 5) * 1000000, payable: Math.floor(rng() * 38) * 1000000, sla: 1 + Math.floor(rng() * 3), trust: (3.9 + rng() * 1.1).toFixed(1), ship: true, since: (2013 + Math.floor(rng() * 12)) + "년" }; vendors.push(v); vByKey[_vkey(v.name)] = v; }
    return v;
  };
  const products = [];
  const REAL = [];
  if (typeof SUPP_PRODUCTS !== "undefined") SUPP_PRODUCTS.forEach((p) => REAL.push([p, "영양제"]));
  if (typeof DEVICE_PRODUCTS !== "undefined") DEVICE_PRODUCTS.forEach((p) => REAL.push([p, "홈케어의료기"]));
  if (typeof MEAL_PRODUCTS !== "undefined") MEAL_PRODUCTS.forEach((p) => REAL.push([p, "건강식단"]));
  REAL.forEach(([p, cat]) => {
    const v = resolveVendor(p.brand, cat);
    const salePrice = p.price || ((5 + Math.floor(rng() * 95)) * 1000 + 900);
    const cr = _scCostRate(cat, v.scale || "소", rng);
    products.push({
      id: p.id, name: p.name, category: cat, subcat: p.category || "", vendorId: v.id, vendorName: v.name, scale: v.scale,
      salePrice, supplyPrice: Math.round(salePrice * cr / 10) * 10, marginPct: Math.round((1 - cr) * 100),
      exp: _scDate(rng, 2027 + Math.floor(rng() * 2)), lot: "L" + (230000 + Math.floor(rng() * 69999)), real: true,
    });
  });
  /* 실제 제품이 없는 거래처(서비스·회원사 등)는 대표 SKU 합성으로 보강 → 모든 거래처가 SKU 보유 */
  const _hasP = {}; products.forEach((p) => { _hasP[p.vendorId] = 1; });
  vendors.forEach((v) => {
    if (_hasP[v.id]) return;
    const cnt = 1 + Math.floor(rng() * 3);
    const words = SC_PROD_WORDS[v.category] || SC_PROD_WORDS["영양제"];
    const used = {};                                   /* 같은 거래처 안의 같은 품목명을 막는다 */
    for (let k = 0; k < cnt; k++) {
      /* 품목명에 **상호를 심지 않는다.** 종전 `v.name.split("(")[0] + " " + base` 는 `vendorId` 가 없는
         파생 문자열이라 표시명 함수가 닿을 수 없었다(합성 52건 전건에 상호 머리말이 박혔다).
         카테고리 낱말만 쓴다(§4-6-5 ⓐ). 거래처 간 같은 품목명은 **커머스에서 정상**이고 SKU 가 가른다;
         같은 거래처 안의 중복만 막는다 — 같은 상호의 두 SKU 가 같은 이름이면 화면에서 구별되지 않는다.
         ★ 충돌 해소는 **새 rng() 없이** 사전 순회로 한다(결정론 — _pick 호출 수가 바뀌지 않는다). */
      let base = _pick(rng, words);
      if (used[base]) {
        const s = words.indexOf(base);
        for (let j = 1; j <= words.length; j++) { const c = words[(s + j) % words.length]; if (!used[c]) { base = c; break; } }
      }
      used[base] = 1;
      const salePrice = (5 + Math.floor(rng() * 95)) * 1000 + 900;
      const cr = _scCostRate(v.category, v.scale || "소", rng);
      products.push({
        id: "P" + String(products.length + 1).padStart(5, "0"), name: base, category: v.category, subcat: base,
        vendorId: v.id, vendorName: v.name, scale: v.scale, salePrice, supplyPrice: Math.round(salePrice * cr / 10) * 10, marginPct: Math.round((1 - cr) * 100),
        exp: _scDate(rng, 2027), lot: "L" + (230000 + Math.floor(rng() * 69999)), real: false,
      });
    }
  });
  const P = products.length;
  /* 모집단 분모 — 제품 루프 **후**의 거래처 수다(P0 결정 ④).
     resolveVendor 가 브랜드 미매칭 시 vendors 에 push 하므로, 루프 **전**에 고정하면
     counts.vendor 만 107에 머물고 contracts·availability·정산은 108을 쓰는 두 분모가 생긴다.
     이 숫자가 모든 통제 준수율의 분모가 된다. 중복 신원은 partnerGov.js 의 PG_IDENTITY_FIX 가 해소한다. */
  const V = vendors.length;

  /* 3) 계약·단가 (Contract) — 거래처×카테고리 공급 계약 */
  const contracts = vendors.map((v, i) => ({
    id: "C" + String(i + 1).padStart(4, "0"), vendorId: v.id, vendorName: v.name, category: v.category,
    marginPct: 18 + Math.floor(rng() * 22), slaDays: v.sla, feePct: (2 + rng() * 6).toFixed(1),
    settleCycle: _pick(rng, ["월 정산", "격주 정산", "주 정산"]), term: v.since + " ~ 자동갱신",
  }));

  /* 4) 공급사 가용재고 (Availability) — 당사 미보유·실시간 조회(스냅샷) */
  const availability = [];
  products.forEach((p) => {
    if (rng() < 0.72) {
      availability.push({
        id: "A" + String(availability.length + 1).padStart(5, "0"), vendorId: p.vendorId, vendorName: p.vendorName,
        sku: p.id, skuName: p.name, qty: Math.floor(rng() * 1200), leadDays: 1 + Math.floor(rng() * 4),
        asof: _scDate(rng, 2026), owner: "공급사 보유(당사 재고자산 0)",
      });
    }
  });

  /* 5) 주문 (Order) — 고객(계정)이 발주 → 당사 플랫폼 중개 → 거래처 라우팅 */
  const orders = [];
  const ORD_N = 30000;
  for (let i = 0; i < ORD_N; i++) {
    const p = products[Math.floor(rng() * P)];
    const qty = 1 + Math.floor(rng() * 5);
    const acc = Math.floor(rng() * n);
    const st = _wpick(rng, SC_ORD_STATUS);
    orders.push({
      id: "O" + String(i + 1).padStart(6, "0"), accountId: "M" + String(acc + 1).padStart(6, "0"),
      sku: p.id, skuName: p.name, vendorId: p.vendorId, vendorName: p.vendorName,
      qty, amount: p.salePrice * qty, margin: Math.round((p.salePrice - p.supplyPrice) * qty),
      status: st, orderDate: _scDate(rng, 2026),
    });
  }

  /* 6) 배송 (Shipment) — 거래처 → 고객 직배송(취소 제외) */
  const shipments = [];
  orders.forEach((o) => {
    if (o.status === "취소") return;
    shipments.push({
      id: "S" + String(shipments.length + 1).padStart(6, "0"), orderId: o.id, vendorId: o.vendorId, vendorName: o.vendorName,
      accountId: o.accountId, carrier: _pick(rng, SC_CARRIERS), tracking: String(1000000000 + Math.floor(rng() * 8999999999)),
      status: o.status === "배송완료" ? "배송완료" : o.status === "배송중" ? "배송중" : "집화대기",
      /* 출고 표기는 **데이터에 심지 않는다.** 종전 `o.vendorName + " 물류창고"` 는 `vendorId` 가 없는
         파생 문자열이라 표시명 함수가 닿을 수 없었다(전건 28,755/28,755 에 상호가 박혔다).
         데이터에는 식별자만 두고 표기는 렌더에서 조립한다 — 소비자는 pgShipFrom(s) 다(§4-6-5 ⓐ). */
      eta: _scDate(rng, 2026), fromVid: o.vendorId, route: "거래처 직배송",
    });
  });

  /* 7) 정산 (Settlement) — 주문에서 **전건 파생**되는 종속 장부 (형 확정 Q1 · 2026-10-25)
     ─────────────────────────────────────────────────────────────────────────────
     단일 원천: 매출·공급대금 = 주문 / 수수료율 = 계약(contract.feePct).
     같은 사실을 두 번 생성하지 않는다 — 이 블록의 **새 rng() 호출은 0회**다.
     (종전 생성기는 sales·fee·supplyCost·margin·status에 독립 난수를 뽑아, 전 648행이
      sales ≠ supplyCost + fee + margin 이었고 정산 매출이 주문 GMV의 1.98배였다.)

     ★ plug는 marginNet 한 곳이다. supplyCost는 역산이 아니라 **주문이 이미 갖고 있는 사실**
       (product.supplyPrice × qty)의 합이다. plug를 둔 축은 「무엇을 넣어도 항등식이 맞는」
       검사되지 않는 축이 되므로, 밖에 비교 대상이 있는 축(매입)에 두면 안 된다 —
       supplyCost를 plug로 두면 ΣsupplyCost가 주문축 매입원가와 전행 어긋나고
       그 차이가 정확히 Σfee가 된다(원가회계·회계전기·분개2가 이미 그 값을 들고 있다).

     수수료의 귀속: fee는 **플랫폼이 수취하는 마진의 내부 분해**이고 거래처가 따로 부담하는
       추가 수수료가 아니다. order.margin이 이미 (salePrice − supplyPrice) × qty 전액이므로
       supplyCost에서 또 빼면 거래처 수취액이 자기 계약 공급가보다 줄어든다. 그래서 margin 안에서 쪼갠다:
         margin(주문) = fee + marginNet

     행 항등식    sales === supplyCost + fee + marginNet
     교차 항등식  Σ supplyCost       === supplyFinance().supplyCost   (창이 전 기간일 때)
                 Σ (fee + marginNet) === supplyFinance().margin       (같은 조건)

     상태 축(status)은 **이 산식이 만들지 않는다.** 재부여 규칙이 미정이고, 기존 status의
       1:1 승계는 기각됐다 — 승계하면 「정산완료」 셀 안에 미출고 금액이 섞인다.
       대신 preShip·delivered를 행에 실어 화면이 「정산 대상 중 미출고분」을 말할 수 있게 한다.

     전표ID는 **결정적 키**(T-거래처-기간)다. 순번 ID는 「주문 0건 셀은 행을 만들지 않는다」와
       양립하지 않는다 — 한 셀이 비는 순간 뒤의 전 행 번호가 다른 셀을 가리킨다. */
  const SC_MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  const settlements = [];
  {
    const prodById = {}; products.forEach((p) => { prodById[p.id] = p; });
    /* 수수료율의 단일 원천 = 계약. feePct는 toFixed(1) 산물이라 **문자열**이다 — 캐스팅을 빠뜨리면
       sales * "5.1" / 100 이 조용히 동작하다가 문자열 결합 사고로 번진다. */
    const feeByVendor = {};
    contracts.forEach((ct) => { feeByVendor[ct.vendorId] = Number(ct.feePct); });

    const cell = {};                                   /* key = vendorId|YYYY-MM */
    orders.forEach((o) => {
      if (o.status === "취소") return;                  /* 취소 제외 — 집계 4곳이 이미 쓰는 규약이다 */
      const period = o.orderDate.slice(0, 7);          /* 주문일 기준 월 · 문자열 앞 7자.
                                                          new Date()를 거치면 로컬 타임존에서 월 경계일이 밀린다
                                                          (01-01·07-27이 경계에 있다). 배송일 축은 쓸 수 없다 —
                                                          shipment.eta는 주문일과 독립 난수다. */
      if (SC_MONTHS.indexOf(period) < 0) return;       /* 창 경계도 주문일 기준 */
      const k = o.vendorId + "|" + period;
      const c = cell[k] || (cell[k] = { sales: 0, supplyCost: 0, n: 0, preShip: 0, delivered: 0 });
      const p = prodById[o.sku];
      c.sales += o.amount;
      c.supplyCost += p ? p.supplyPrice * o.qty : (o.amount - o.margin);   /* 주문 사실 — 역산이 아니다 */
      c.n += 1;
      if (o.status === "접수" || o.status === "출고준비") c.preShip += o.amount;
      if (o.status === "배송완료") c.delivered += o.amount;
    });

    /* 순회 순서 = vendors 배열 순서(push 순서) × SC_MONTHS 오름차순 상수. 정렬을 끼우지 않는다. */
    vendors.forEach((v) => {
      SC_MONTHS.forEach((period) => {
        const c = cell[v.id + "|" + period];
        if (!c || c.n === 0) return;                   /* 주문 0건 셀은 행을 만들지 않는다 — 거래 사실이 없는
                                                          거래처에 「매출 0원」 전표가 서면 판정 지면에서
                                                          「미제출」과 구별되지 않는다 */
        /* 반올림은 이 한 곳(행 1회)이고 연산 순서도 이 형태 그대로다. 상위 합계는 반드시 행 합으로만
           만든다 — 거래처 수준에서 round(연매출 × feePct)로 재계산하면 월행 합과 어긋난다. */
        const fee = Math.round(c.sales * feeByVendor[v.id] / 100);
        settlements.push({
          id: "T-" + v.id + "-" + period, vendorId: v.id, vendorName: v.name, period,
          sales: c.sales, supplyCost: c.supplyCost, fee,
          marginNet: c.sales - c.supplyCost - fee,     /* plug는 여기 한 곳 */
          orders: c.n, preShip: c.preShip, delivered: c.delivered,
        });
      });
    });
  }

  _scData = {
    vendors, products, contracts, availability, orders, shipments, settlements,
    counts: { vendor: V, product: P, contract: contracts.length, availability: availability.length, account: n, order: orders.length, shipment: shipments.length, settlement: settlements.length },
  };
  return _scData;
}

/* 협력업체 거래 → 회계·재무 전기(轉記) 집계 — 무재고(에이전트) 모델: 매출=마진(순액), 매입=거래처 공급대금.
   주문축(gmv·margin·supplyCost)이 원천이고, 정산축(fee·setTarget·setSupply·setMarginNet)은 주문 파생 종속 장부의 합이다.
   둘은 창이 같을 때 원 단위까지 일치해야 한다 — 그 대조가 「정산 정확도」의 실패 가능한 지표다. */
let _scFin = null;
function supplyFinance() {
  if (_scFin) return _scFin;
  const D = supplyData();
  let gmv = 0, margin = 0, supplyCost = 0, ordActive = 0, ordDone = 0;
  D.orders.forEach((o) => {
    if (o.status === "취소") return;
    gmv += o.amount; margin += o.margin; supplyCost += (o.amount - o.margin);
    if (o.status === "배송완료") ordDone++; else ordActive++;
  });
  /* 정산 상태 축(status)은 아직 없다 — 재부여 규칙 미정이고 1:1 승계는 기각됐다(미출고 금액이
     「정산완료」로 섞인다). 그래서 「정산 완료 / 정산 예정」 2칸을 만들지 않고 **정산 대상** 한 값으로만 집계한다.
     setSupply = Σ 공급대금 — 매입채무를 빼는 분개가 읽어야 하는 축이다(고객 결제 총액이 아니다). */
  let fee = 0, setTarget = 0, setSupply = 0, setMarginNet = 0, setPreShip = 0;
  D.settlements.forEach((s) => { fee += s.fee; setTarget += s.sales; setSupply += s.supplyCost; setMarginNet += s.marginNet; setPreShip += (s.preShip || 0); });
  const vat = Math.round(gmv / 11);                 // 부가세 예수(총거래 기준)
  const receivable = Math.round(gmv * 0.12);        // 고객 미수금(진행분)
  const payable = Math.round(supplyCost * 0.34);    // 거래처 매입채무(정산 예정분)
  _scFin = {
    gmv, revenue: margin, supplyCost, margin, fee, vat, receivable, payable,
    setTarget, setSupply, setMarginNet, setPreShip, setRows: D.settlements.length, setMonths: 7, ordActive, ordDone,
    // 손익 기여(당사 관점): 매출=마진(순액 대행수익), 매출원가=거래처 공급대금은 상계(순액인식)
    accounts: [
      ["상품판매수익 (매출·GMV)", gmv, "#34D399", "수익"],
      ["플랫폼 마진 (순액매출)", margin, "#22D3EE", "수익"],
      ["거래처 공급대금 (매입원가)", supplyCost, "#F472B6", "원가"],
      ["매입채무 (거래처 미지급)", payable, "#94A3B8", "부채"],
      ["미수금 (고객)", receivable, "#38BDF8", "자산"],
      ["부가세예수금", vat, "#FBBF24", "부채"],
    ],
    journals: [
      ["판매 인식", "(차) 미수금 " + gmv, "(대) 상품판매수익·부가세예수", "#38BDF8"],
      ["매입 인식", "(차) 상품매입원가 " + supplyCost, "(대) 매입채무(거래처)", "#F472B6"],
      /* 매입채무를 빼는 줄이므로 금액 원천은 **공급대금**이다 — 고객 결제 총액(판매대금)을 쓰면
         분개2가 계상한 매입채무보다 더 빼게 된다. 정산 행의 supplyCost 합이 분개2와 0원 차로 닫힌다. */
      ["거래처 정산·지급", "(차) 매입채무 " + setSupply, "(대) 보통예금", "#94A3B8"],
      ["고객 수금", "(차) 보통예금", "(대) 미수금", "#34D399"],
    ],
  };
  return _scFin;
}

/* 원가회계(Cost Accounting) — 무재고/직배송 원가구조 + 카테고리별 원가율·공헌이익 */
let _scCost = null;
function supplyCost() {
  if (_scCost) return _scCost;
  const D = supplyData(), F = supplyFinance();
  const prodById = {}; D.products.forEach((p) => { prodById[p.id] = p; });
  const cat = {};
  D.orders.forEach((o) => {
    if (o.status === "취소") return;
    const p = prodById[o.sku]; const c = p ? p.category : "기타";
    const x = cat[c] || (cat[c] = { rev: 0, cost: 0, margin: 0, qty: 0 });
    x.rev += o.amount; x.cost += (o.amount - o.margin); x.margin += o.margin; x.qty += o.qty;
  });
  const cats = Object.entries(cat).map(([k, v]) => ({ cat: k, ...v, costRate: v.rev ? v.cost / v.rev : 0, marginRate: v.rev ? v.margin / v.rev : 0 })).sort((a, b) => b.rev - a.rev);
  const gmv = F.gmv, sCost = F.supplyCost, gross = F.margin;
  const pay = Math.round(gmv * 0.022);      // 결제대행 수수료 2.2%
  // 판매마진 배분은 단일 정의 WALLET_SPLIT(sectionData.js)을 따른다 — 재무 엔진(finBudget)도 제품 마진에서 적립·기부를 함께 뺀다
  const WS = (typeof WALLET_SPLIT !== "undefined" && WALLET_SPLIT && WALLET_SPLIT.earn != null) ? WALLET_SPLIT : { earn: 60, give: 15, ops: 25 };
  const token = Math.round(gross * WS.earn / 100);   // 건강적립금(판매마진의 적립 몫)
  const give = Math.round(gross * WS.give / 100);    // 치료비 나눔(판매마진의 나눔 몫)
  const logistics = Math.round((F.ordActive + F.ordDone) * 3000); // 직배송 택배비(거래처 부담·참고)
  const variable = pay + token + give;      // 당사 변동비(무재고 → 물류·재고비 미부담)
  const contribution = gross - variable;    // 공헌이익 — 커머스가 전사 고정비에 기여하는 몫
  // 고정비는 커머스 전용이 아니라 전사(사용료·구독·검진 포함) 공통이므로, 예산양식 1차연도 고정비 비율(매출 대비)만큼만 참고로 배분한다
  let fixRate = 0.1465, allOp = null;
  try {
    const a = (typeof fbModel === "function") ? fbModel().annual[0] : null;
    if (a && a.rev) { fixRate = (a.pay + a.itOpex + a.sales + a.admin) / a.rev; allOp = a.ebit; }
  } catch (e) { /* 재무 엔진 미로드 시 기본 비율 */ }
  const fixed = Math.round(gmv * fixRate);  // 전사 고정비 배분(매출 비중 기준·참고)
  const op = contribution - fixed;          // 커머스 단독 영업이익(참고)
  _scCost = {
    gmv, supplyCost: sCost, gross, pay, token, give, logistics, variable, contribution, fixed, fixRate, op, allOp, cats,
    steps: [
      ["매출 (GMV)", gmv, "#34D399", "s"],
      ["− 거래처 공급원가 (매입)", -sCost, "#F472B6", ""],
      ["= 매출총이익 (플랫폼 마진)", gross, "#22D3EE", "s"],
      ["− 결제대행 수수료 (2.2%)", -pay, "#94A3B8", ""],
      [`− 건강적립금 (토큰, 마진 ${WS.earn}%)`, -token, "#67E8F9", ""],
      [`− 치료비 나눔 (마진 ${WS.give}%)`, -give, "#F9A8D4", ""],
      ["= 공헌이익 (Contribution)", contribution, "#818CF8", "s"],
    ],
  };
  return _scCost;
}

/* 고객·계정(Account) — pilotCohort(10만) 파생. 세그먼트·등급·LTV·이탈스코어 결정적 부여 */
let _scAccounts = null;
function supplyAccounts() {
  if (_scAccounts) return _scAccounts;
  const cohort = (typeof pilotCohort === "function") ? pilotCohort() : [];
  const rng = _mul32(0xACC0);
  _scAccounts = cohort.map((m, i) => {
    const seg = _wpick(rng, SC_SEG);
    const grade = _pick(rng, ["VIP", "골드", "실버", "일반", "일반", "일반"]);
    return {
      id: "M" + String(i + 1).padStart(6, "0"), name: m.name, seg, grade,
      ltv: (5 + Math.floor(rng() * 240)) * 10000, churn: Math.round(rng() * 100),
      sido: m.sido, age: m.age, sex: m.sex, mid: m.id,
    };
  });
  return _scAccounts;
}
