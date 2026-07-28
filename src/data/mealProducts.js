/* ══════════════ 건강식단 카탈로그 (Phase C 확장) ══════════════
   화면(Shop.jsx) 안에 있던 배열을 **데이터 계층으로 이관**했다 —
   A3 비교 엔진은 데이터 계층만 읽으므로, 컴포넌트에 있으면 식단은 영영 비교되지 않는다.

   ⚠️ volume(수량)은 **제품명에 적혀 있는 것만** 옮겼다.
   "6팩"·"24입"·"7일"처럼 명시된 것만 1식 단가를 계산하고, 미표기 제품은 비워 둔다(추정 금지).
   "750g"·"10종"은 회 수가 아니므로 수량으로 쓰지 않는다.
   source는 브랜드 공식몰이라 brand_mall — 시장 유통가(네이버·쿠팡·다나와)와 구분된다. */

const MEAL_PRODUCTS = [
  { id: "m-designmeal", volume: "6팩", source: "brand_mall", brand: "풀무원 디자인밀", name: "디자인밀 그린박스 건강도시락 (6팩)", category: "맞춤도시락", price: 39900, orig: 45000, rating: 4.7, reviews: 2314, badge: "새벽배송", emoji: "🍱", url: "https://www.pulmuone.co.kr", desc: "저당·균형식 케어푸드" },
  { id: "m-greating", source: "brand_mall", brand: "현대그린푸드 그리팅", name: "그리팅 케어 도시락 만성질환 관리식", category: "맞춤도시락", price: 41900, orig: 49000, rating: 4.6, reviews: 1876, badge: "정기배송", emoji: "🍱", url: "https://www.greating.co.kr", desc: "영양사 설계 저염·저당식" },
  { id: "m-selexcore", source: "brand_mall", brand: "매일헬스뉴트리션", name: "셀렉스 코어프로틴 단백질 파우더 (750g)", category: "단백질", price: 34900, orig: 42000, rating: 4.8, reviews: 5621, badge: "로켓직구", emoji: "🥤", url: "https://www.selex.co.kr", desc: "중장년 근력·단백질 보충" },
  { id: "m-nucare", volume: "24입", source: "brand_mall", brand: "대상웰라이프", name: "뉴케어 균형영양식 200ml (24입)", category: "균형영양식", price: 28900, orig: 33000, rating: 4.7, reviews: 3210, badge: "새벽배송", emoji: "🧉", url: "https://www.daesangwellife.com", desc: "식사대용 균형영양·회복식" },
  { id: "m-medisola", volume: "7일", source: "brand_mall", brand: "메디쏠라", name: "메디푸드 당뇨케어 식단 (7일)", category: "질환케어", price: 45000, orig: 52000, rating: 4.5, reviews: 842, badge: "정기배송", emoji: "🍲", url: "https://www.medisola.co.kr", desc: "당뇨·신장·암 질환별 케어" },
  { id: "m-herings", source: "brand_mall", brand: "헤링스", name: "힐리어리 암환자 케어식단 (1:1 맞춤)", category: "질환케어", price: 59000, orig: 68000, rating: 4.9, reviews: 512, badge: "맞춤제작", emoji: "🍱", url: "https://www.herings.co.kr", desc: "암환자 1:1 영양관리" },
  { id: "m-cheonggang", source: "brand_mall", brand: "지리산청강원", name: "오행 약선차 건강차 선물세트", category: "건강차", price: 24000, orig: 29000, rating: 4.6, reviews: 431, badge: "산지직송", emoji: "🍵", url: "https://smartstore.naver.com", desc: "약초 기반 전통 약선차" },
  { id: "m-farmkit", volume: "5일", source: "brand_mall", brand: "팜킷", name: "푸드큐 AI 맞춤식단 (5일 구성)", category: "AI맞춤식", price: 38000, orig: 44000, rating: 4.7, reviews: 1023, badge: "AI추천", emoji: "🥗", url: "https://www.farmkit.co.kr", desc: "AI 개인 맞춤 식단" },
  { id: "m-drkitchen", source: "brand_mall", brand: "닥터키친", name: "질환별 맞춤 건강식단 밀박스", category: "질환케어", price: 43000, orig: 50000, rating: 4.6, reviews: 1567, badge: "새벽배송", emoji: "🥘", url: "https://www.drkitchen.co.kr", desc: "당뇨·신장·다이어트식" },
  { id: "m-fresheasy", source: "brand_mall", brand: "프레시지", name: "헬스밀 저칼로리 밀키트 (10종)", category: "밀키트", price: 19900, orig: 25000, rating: 4.5, reviews: 8912, badge: "로켓배송", emoji: "🥘", url: "https://www.fresheasy.co.kr", desc: "헬스밀·간편 밀키트" },
  { id: "m-eatson", source: "brand_mall", brand: "hy 잇츠온", name: "잇츠온 건강 국·반찬 세트", category: "간편식", price: 15900, orig: 19000, rating: 4.4, reviews: 4231, badge: "새벽배송", emoji: "🍚", url: "https://www.hy.co.kr", desc: "간편 건강식·반찬" },
  { id: "m-maeilselex", volume: "16입", source: "brand_mall", brand: "매일유업 셀렉스", name: "셀렉스 프로틴 음료 190ml (16입)", category: "단백질", price: 32000, orig: 38000, rating: 4.7, reviews: 6742, badge: "로켓배송", emoji: "🥤", url: "https://www.selex.co.kr", desc: "단백질·시니어 케어푸드" },
  { id: "m-ourhome", source: "brand_mall", brand: "아워홈 케어플러스", name: "케어플러스 연화식 환자식 (부드러운식)", category: "질환케어", price: 36000, orig: 42000, rating: 4.5, reviews: 723, badge: "정기배송", emoji: "🍲", url: "https://www.ourhomemall.com", desc: "연화식·환자식" },
  { id: "m-cjfw", source: "brand_mall", brand: "CJ프레시웨이", name: "케어푸드 실버 영양식단", category: "간편식", price: 33000, orig: 39000, rating: 4.5, reviews: 634, badge: "정기배송", emoji: "🍱", url: "https://www.cjfreshway.com", desc: "케어푸드·시니어식" },
  { id: "m-bonjuk", source: "brand_mall", brand: "본죽", name: "전복죽 환자 회복식 (5팩)", category: "죽", price: 27900, orig: 33000, rating: 4.6, reviews: 3892, badge: "새벽배송", emoji: "🥣", url: "https://www.bonif.co.kr", desc: "죽·환자 회복식" },
  { id: "m-dongwon", source: "brand_mall", brand: "동원 더반찬&", name: "더반찬& 건강 간편식 (주간세트)", category: "간편식", price: 21900, orig: 27000, rating: 4.5, reviews: 2765, badge: "새벽배송", emoji: "🍚", url: "https://www.thebanchan.co.kr", desc: "건강 간편식·반찬" },
  { id: "m-spaoeat", source: "brand_mall", brand: "잇메이트(스파오)", name: "닭가슴살 스테이크 고단백 (30팩)", category: "단백질", price: 29900, orig: 39000, rating: 4.6, reviews: 12043, badge: "로켓배송", emoji: "🍗", url: "https://www.eatmate.co.kr", desc: "닭가슴살·고단백식" },
];
