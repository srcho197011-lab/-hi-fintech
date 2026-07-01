/* ====================== 건강쇼핑 — 영양제 상품 데이터셋 + 건강적립금 모듈 ======================
   출처: 브랜드 공식몰 / 네이버쇼핑·쿠팡 최저가(수집 예시 시점 2026-07-01). 가격은 변동되며 표시가는 수집 시점 기준.
   ⚠️ 기능성 문구는 식약처 인정 기능성 '요약·재작성'(원문 복제 아님). 이미지는 재호스팅하지 않고 출처 링크 참조.
   실제 상용 판매에는 각 브랜드 제휴 또는 네이버/쿠팡 오픈마켓·제휴 API 연동이 필요함.

   건강적립금 규칙:  공급가 = P×SUPPLY_RATE(0.5) · 마진 = P−공급가 · 적립금 = 마진×MARGIN_REWARD_RATE(0.5) = P×0.25 (원 단위 내림) */
const SHOP_REWARD_CFG = { supplyRate: 0.50, marginRewardRate: 0.50 };
function healthReward(price, cfg) {
  const c = cfg || SHOP_REWARD_CFG;
  const p = Math.max(0, Math.floor(Number(price) || 0));
  const supply = Math.floor(p * c.supplyRate);
  const margin = p - supply;
  const reward = Math.floor(margin * c.marginRewardRate);
  return { supply, margin, reward, rate: p ? reward / p : 0 };
}
/* 단위 테스트(콘솔): runShopRewardTests() — 예시값 검증 */
function runShopRewardTests() {
  const cases = [[30000, 7500], [19900, 4975], [45000, 11250], [0, 0]];
  const out = cases.map(([p, exp]) => { const got = healthReward(p).reward; return { price: p, expected: exp, got, ok: got === exp }; });
  const pass = out.every((x) => x.ok);
  try { console.log("[shopReward test]", pass ? "PASS" : "FAIL", out); } catch (e) {}
  return { pass, out };
}

/* 성분 카테고리 메타(아이콘·색) */
const SUPP_CATS = {
  "프로바이오틱스": { icon: "capsule", col: "#16A34A" },
  "홍삼": { icon: "leaf", col: "#B91C1C" },
  "비타민C": { icon: "pill", col: "#F59E0B" },
  "종합비타민": { icon: "capsule", col: "#2563EB" },
  "오메가3": { icon: "brain", col: "#0EA5E9" },
  "루테인": { icon: "eye", col: "#16A34A" },
  "밀크씨슬": { icon: "capsule", col: "#7C3AED" },
  "마그네슘": { icon: "capsule", col: "#0D9488" },
  "비타민D": { icon: "pill", col: "#F59E0B" },
  "콜라겐": { icon: "capsule", col: "#DB2777" },
  "아연": { icon: "capsule", col: "#64748B" },
};
/* 상품 20종: id·name·brand·category·volume·claim(기능성 요약)·desc(재작성)·price·source·url(공식몰/상세) */
const SUPP_PRODUCTS = [
  { id: "prob-lactofit-gold", name: "락토핏 골드", brand: "종근당건강", category: "프로바이오틱스", volume: "50포", claim: "유익균 증식·유해균 억제로 배변활동 원활에 도움", desc: "국내 판매량 상위 유산균. 포당 다수의 프로바이오틱스와 아연을 함께 담아 장 건강과 면역에 도움을 주는 스틱형 제품.", price: 19900, source: "naver", url: "https://www.ckdhc.com" },
  { id: "prob-lactofit-core", name: "락토핏 코어", brand: "종근당건강", category: "프로바이오틱스", volume: "60캡슐", claim: "유산균 증식·배변활동 원활에 도움", desc: "장용성 캡슐로 유산균 생존율을 높인 코어 라인. 아연·프리바이오틱스를 함께 배합.", price: 25900, source: "naver", url: "https://www.ckdhc.com" },
  { id: "hongsam-everytime", name: "정관장 홍삼정 에브리타임", brand: "KGC인삼공사", category: "홍삼", volume: "30포", claim: "면역력 증진·피로 개선·혈행 개선에 도움(홍삼)", desc: "6년근 홍삼농축액 스틱. 물 없이 짜먹는 형태로 일상 면역·활력 관리에 적합.", price: 60000, source: "brand_mall", url: "https://www.jungkwanjang.com" },
  { id: "hongsam-jung", name: "정관장 홍삼정 (100g)", brand: "KGC인삼공사", category: "홍삼", volume: "100g", claim: "면역력 증진·피로 개선·기억력 개선에 도움(홍삼)", desc: "6년근 홍삼 농축액 정과 형태. 물이나 차에 타서 섭취하는 대표 홍삼 제품.", price: 90000, source: "brand_mall", url: "https://www.jungkwanjang.com" },
  { id: "vitc-eundan-1000", name: "고려은단 비타민C 1000", brand: "고려은단", category: "비타민C", volume: "600정", claim: "항산화·결합조직 형성·철 흡수에 필요", desc: "영국산 원료의 고함량 비타민C. 하루 1정으로 항산화·피로 개선 관리.", price: 22000, source: "brand_mall", url: "https://www.koreaeundan.com" },
  { id: "vitc-yuhan", name: "유한양행 비타민C", brand: "유한양행", category: "비타민C", volume: "300정", claim: "항산화·면역·철 흡수에 필요", desc: "가성비 고함량 비타민C 제품. 데일리 항산화 보충용.", price: 15000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "multi-impactamin", name: "임팩타민", brand: "대웅제약", category: "종합비타민", volume: "100정", claim: "에너지 대사·피로 개선에 필요한 비타민B군 고함량", desc: "고함량 활성비타민B군 중심 종합비타민. 피로·활력 관리에 널리 쓰이는 제품.", price: 28000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "multi-centrum-silver", name: "센트룸 실버", brand: "화이자", category: "종합비타민", volume: "125정", claim: "다양한 비타민·미네랄 보충(에너지 대사·항산화)", desc: "50세 이상을 위한 종합비타민·미네랄. 눈·뼈·심장 건강 성분을 폭넓게 배합.", price: 32000, source: "coupang", url: "https://www.coupang.com" },
  { id: "omega-promega", name: "프로메가 오메가3 코어", brand: "종근당건강", category: "오메가3", volume: "60캡슐", claim: "혈중 중성지방 개선·혈행 개선에 도움(EPA·DHA)", desc: "고순도 rTG 오메가3. 심혈관·혈행 관리를 위한 대표 제품.", price: 24900, source: "naver", url: "https://www.ckdhc.com" },
  { id: "omega-gc-rtg", name: "뉴트리 알티지 오메가3", brand: "GC녹십자웰빙", category: "오메가3", volume: "60캡슐", claim: "혈중 중성지방·혈행 개선·기억력에 도움(EPA·DHA)", desc: "알티지(rTG) 형태로 흡수율을 높인 오메가3. 비타민E 항산화 배합.", price: 29000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "lutein-agh", name: "안국건강 루테인 지아잔틴", brand: "안국건강", category: "루테인", volume: "60캡슐", claim: "노화로 인한 황반색소 밀도 유지로 눈 건강에 도움", desc: "루테인·지아잔틴에 비타민A를 더한 눈 영양제. 디지털 시대 눈 피로 관리.", price: 19800, source: "brand_mall", url: "https://www.shopagh.com" },
  { id: "lutein-nd", name: "뉴트리디데이 루테인", brand: "뉴트리디데이", category: "루테인", volume: "90캡슐", claim: "황반색소 밀도 유지로 눈 건강에 도움", desc: "3개월분 대용량 루테인. 마리골드 추출물 기반.", price: 26000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "milk-gnm", name: "GNM 밀크씨슬", brand: "GNM자연의품격", category: "밀크씨슬", volume: "90정", claim: "간 건강에 도움(실리마린)", desc: "실리마린 고함량 밀크씨슬. 음주·피로가 잦은 현대인의 간 건강 관리.", price: 12900, source: "coupang", url: "https://www.coupang.com" },
  { id: "milk-jw", name: "JW중외제약 밀크씨슬", brand: "JW중외제약", category: "밀크씨슬", volume: "60캡슐", claim: "간 건강에 도움(실리마린)", desc: "제약사 품질관리 밀크씨슬. 간수치·피로 관리 보조.", price: 18000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "mag-now", name: "나우푸드 마그네슘", brand: "NOW Foods", category: "마그네슘", volume: "200정", claim: "에너지 생성·신경·근육 기능 유지에 필요", desc: "미국 직수입 대용량 마그네슘. 근육 경련·수면·스트레스 관리 보조.", price: 16500, source: "coupang", url: "https://www.coupang.com" },
  { id: "mag-ckd", name: "종근당건강 마그네슘", brand: "종근당건강", category: "마그네슘", volume: "90정", claim: "에너지 대사·신경·근육 기능 유지에 필요", desc: "일상 마그네슘 보충용. 비타민B6 배합으로 흡수 보조.", price: 13900, source: "naver", url: "https://www.ckdhc.com" },
  { id: "vitd-nc", name: "뉴트리코어 비타민D 2000IU", brand: "뉴트리코어", category: "비타민D", volume: "180캡슐", claim: "칼슘 흡수·뼈 형성과 유지에 필요", desc: "6개월분 대용량 비타민D. 실내 생활·겨울철 부족하기 쉬운 비타민D 보충.", price: 14900, source: "coupang", url: "https://www.coupang.com" },
  { id: "vitd-solgar", name: "솔가 비타민D3", brand: "솔가", category: "비타민D", volume: "100캡슐", claim: "칼슘·인 흡수와 뼈 건강에 필요", desc: "글로벌 브랜드 비타민D3. 뼈·면역 건강 관리.", price: 21000, source: "naver", url: "https://search.shopping.naver.com" },
  { id: "collagen-ever", name: "에버콜라겐 타임", brand: "뉴트리", category: "콜라겐", volume: "30포", claim: "피부 보습·자외선에 의한 피부 손상 개선에 도움", desc: "저분자 콜라겐펩타이드에 비타민C를 더한 이너뷰티 제품. 피부 탄력·보습 관리.", price: 35000, source: "brand_mall", url: "https://search.shopping.naver.com" },
  { id: "zinc-eundan", name: "고려은단 아연", brand: "고려은단", category: "아연", volume: "90정", claim: "정상적인 면역 기능·세포 분열에 필요", desc: "면역·피부 건강에 관여하는 아연 단일제. 환절기 면역 관리 보조.", price: 11900, source: "brand_mall", url: "https://www.koreaeundan.com" },
];
