/* ====================== 공급망 온톨로지 데모 데이터셋 (결정적 · 무재고/직배송) ======================
   mulberry32 시드로 매 로드 동일 데이터(재현 가능). 고객·계정 = pilotCohort(10만) 재사용.
   나머지 7개 오브젝트(거래처·제품·계약·공급사 가용재고·주문·배송·정산)를 FK로 연결.
   ★ 모델: 재고·배송은 거래처(공급사)가 수행, 당사는 주문·정산 오케스트레이션(무재고). (시연용 합성 데이터) */

const SC_VENDOR_NAMES = [
  "조윈", "㈜메디콥", "한국암웨이", "한독", "KGC정관장", "한삼인", "종근당건강", "고려은단", "대웅제약", "일동제약",
  "유한양행", "GC녹십자웰빙", "안국건강", "뉴트리", "GNM자연의품격", "뉴트리코어", "세노비스", "솔가", "나우푸드", "쎌바이오텍",
  "경남제약", "덴프스", "뉴트리원", "에스디바이오센서", "오므론", "인바디", "휴비딕", "브라운", "초이스메드", "참케어",
  "아큐첵", "케어센스", "바디프랜드", "LG전자", "세라젬", "코지마", "클럭", "멜킨스포츠", "퓨리오", "닥터웰",
  "대일산업", "필립스", "오아", "조인메디칼", "가포넷", "알파메딕", "에르고바디", "시그니아", "히어링에이블", "올그린",
  "정밀영양협회", "헬스팜", "메디넷코리아", "바이오팜", "케어라인", "웰니스랩", "네이처메드", "프라임헬스", "그린바이오", "닥터스랩",
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

function _scBizno(rng) { return String(100 + Math.floor(rng() * 899)).padStart(3, "0") + "-" + String(10 + Math.floor(rng() * 89)) + "-" + String(10000 + Math.floor(rng() * 89999)); }
function _scDate(rng, y) { return y + "-" + String(1 + Math.floor(rng() * 7)).padStart(2, "0") + "-" + String(1 + Math.floor(rng() * 27)).padStart(2, "0"); }

let _scData = null;
function supplyData() {
  if (_scData) return _scData;
  const rng = _mul32(0x5C0FFEE);
  const n = (typeof PILOT_N !== "undefined") ? PILOT_N : 100000;

  /* 1) 거래처·공급사 (Vendor) */
  const vendors = SC_VENDOR_NAMES.map((nm, i) => {
    const cat = _wpick(rng, SC_PCATS);
    return {
      id: "V" + String(i + 1).padStart(4, "0"), name: nm, bizno: _scBizno(rng),
      type: _wpick(rng, SC_VTYPE), category: cat,
      credit: (5 + Math.floor(rng() * 45)) * 1000000, payable: Math.floor(rng() * 38) * 1000000,
      sla: 1 + Math.floor(rng() * 3), trust: (3.9 + rng() * 1.1).toFixed(1),
      ship: true, since: (2013 + Math.floor(rng() * 12)) + "년",
    };
  });
  const V = vendors.length;

  /* 2) 제품·SKU (Product) — 거래처 소유, 각 거래처 2~6종 */
  const products = [];
  vendors.forEach((v) => {
    const cnt = 2 + Math.floor(rng() * 5);
    const words = SC_PROD_WORDS[v.category] || SC_PROD_WORDS["영양제"];
    for (let k = 0; k < cnt; k++) {
      const base = _pick(rng, words);
      const salePrice = (5 + Math.floor(rng() * 95)) * 1000 + 900;
      const margin = 0.18 + rng() * 0.22;
      products.push({
        id: "P" + String(products.length + 1).padStart(5, "0"),
        name: v.name.split("(")[0] + " " + base, category: v.category, vendorId: v.id, vendorName: v.name,
        salePrice, supplyPrice: Math.round(salePrice * (1 - margin) / 10) * 10, marginPct: Math.round(margin * 100),
        exp: _scDate(rng, 2027 + Math.floor(rng() * 2)), lot: "L" + (230000 + Math.floor(rng() * 69999)),
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
