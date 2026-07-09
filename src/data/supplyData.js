/* ====================== 공급망 온톨로지 데모 데이터셋 (결정적 · 무재고/직배송) ======================
   mulberry32 시드로 매 로드 동일 데이터(재현 가능). 고객·계정 = pilotCohort(10만) 재사용.
   나머지 7개 오브젝트(거래처·제품·계약·공급사 가용재고·주문·배송·정산)를 FK로 연결.
   ★ 모델: 재고·배송은 거래처(공급사)가 수행, 당사는 주문·정산 오케스트레이션(무재고). (시연용 합성 데이터) */

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
  const V = vendors.length;

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
    for (let k = 0; k < cnt; k++) {
      const base = _pick(rng, words);
      const salePrice = (5 + Math.floor(rng() * 95)) * 1000 + 900;
      const cr = _scCostRate(v.category, v.scale || "소", rng);
      products.push({
        id: "P" + String(products.length + 1).padStart(5, "0"), name: v.name.split("(")[0] + " " + base, category: v.category, subcat: base,
        vendorId: v.id, vendorName: v.name, scale: v.scale, salePrice, supplyPrice: Math.round(salePrice * cr / 10) * 10, marginPct: Math.round((1 - cr) * 100),
        exp: _scDate(rng, 2027), lot: "L" + (230000 + Math.floor(rng() * 69999)), real: false,
      });
    }
  });
  const P = products.length;

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
      eta: _scDate(rng, 2026), from: o.vendorName + " 물류창고", route: "거래처 직배송",
    });
  });

  /* 7) 정산 (Settlement) — 거래처×월(최근 6개월) 수수료·마진·대금 */
  const settlements = [];
  const months = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  vendors.forEach((v) => {
    months.forEach((mo) => {
      const sales = (30 + Math.floor(rng() * 470)) * 100000;
      const fee = Math.round(sales * (0.03 + rng() * 0.05));
      settlements.push({
        id: "T" + String(settlements.length + 1).padStart(5, "0"), vendorId: v.id, vendorName: v.name, period: mo,
        sales, supplyCost: sales - fee - Math.round(sales * (0.1 + rng() * 0.15)), fee,
        margin: Math.round(sales * (0.1 + rng() * 0.15)), status: _pick(rng, ["정산완료", "정산완료", "정산예정"]),
      });
    });
  });

  _scData = {
    vendors, products, contracts, availability, orders, shipments, settlements,
    counts: { vendor: V, product: P, contract: contracts.length, availability: availability.length, account: n, order: orders.length, shipment: shipments.length, settlement: settlements.length },
  };
  return _scData;
}

/* 공급망 → 회계·재무 전기(轉記) 집계 — 무재고(에이전트) 모델: 매출=마진(순액), 매입=거래처 공급대금 */
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
  let fee = 0, setDone = 0, setDue = 0;
  D.settlements.forEach((s) => { fee += s.fee; if (s.status === "정산완료") setDone += s.sales; else setDue += s.sales; });
  const vat = Math.round(gmv / 11);                 // 부가세 예수(총거래 기준)
  const receivable = Math.round(gmv * 0.12);        // 고객 미수금(진행분)
  const payable = Math.round(supplyCost * 0.34);    // 거래처 매입채무(정산 예정분)
  _scFin = {
    gmv, revenue: margin, supplyCost, margin, fee, vat, receivable, payable, setDone, setDue, ordActive, ordDone,
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
      ["거래처 정산·지급", "(차) 매입채무 " + setDone, "(대) 보통예금", "#94A3B8"],
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
  const token = Math.round(gross * 0.25);   // 건강적립금(마진의 25%)
  const logistics = Math.round((F.ordActive + F.ordDone) * 3000); // 직배송 택배비(거래처 부담·참고)
  const variable = pay + token;             // 당사 변동비(무재고 → 물류·재고비 미부담)
  const contribution = gross - variable;    // 공헌이익
  const fixed = Math.round(gross * 0.34);   // 고정비 배분(운영·인건·서버, 시연 추정)
  const op = contribution - fixed;          // 영업이익
  _scCost = {
    gmv, supplyCost: sCost, gross, pay, token, logistics, variable, contribution, fixed, op, cats,
    steps: [
      ["매출 (GMV)", gmv, "#34D399", "s"],
      ["− 거래처 공급원가 (매입)", -sCost, "#F472B6", ""],
      ["= 매출총이익 (플랫폼 마진)", gross, "#22D3EE", "s"],
      ["− 결제대행 수수료 (2.2%)", -pay, "#94A3B8", ""],
      ["− 건강적립금 (토큰, 마진25%)", -token, "#67E8F9", ""],
      ["= 공헌이익 (Contribution)", contribution, "#818CF8", "s"],
      ["− 고정비 배분 (운영·인건·서버)", -fixed, "#F59E0B", ""],
      ["= 영업이익 (Operating)", op, "#34D399", "s"],
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
