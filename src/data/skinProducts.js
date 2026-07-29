/* ══════════════ 스킨 헬스케어 카탈로그 — 6대 분류 ══════════════
   화장품법 대상이다. 건강기능식품(shopProducts.js)과 **데이터를 섞지 않는다.**
   · 성분 함량은 라벨에 적힌 것만 넣는다 — 전성분 순서로 함량을 추정하지 않는다.
   · 기능성화장품(미백·주름개선·자외선차단)은 **식약처 심사·보고를 확인한 것만** functional에 적는다.
     확인하지 못하면 null로 두고 화면에 배지를 붙이지 않는다(모르면 비운다).
   · 가격은 2026-07-29 수집 예시가(브랜드 공식몰 / 다나와 검색 기준)로 변동될 수 있다.
   먹는 이너뷰티(콜라겐·비타민)는 여기 넣지 않는다 — SUPP_PRODUCTS에 그대로 두고 링크로만 연결한다. */

/* ── 6대 분류(고정) ── */
const SKIN_CATS = {
  "클렌징 케어": { icon: "leaf", col: "#0EA5E9", axis: "perVolume", desc: "세정 · 각질 · 피지" },
  "보습·장벽 케어": { icon: "capsule", col: "#DB2777", axis: "perVolume", desc: "수분 · 진정 · 피부장벽" },
  "자외선·환경 보호": { icon: "badge", col: "#F59E0B", axis: "perVolume", desc: "선케어 · 항산화 · 외부자극" },
  "기능성·트러블 케어": { icon: "eye", col: "#7C3AED", axis: "perVolume", desc: "미백 · 주름 · 탄력 · 모공" },
  "더마·전문 케어": { icon: "immune", col: "#0D9488", axis: "perVolume", desc: "민감성 · 시술 후 · 피부과 연계" },
  "디바이스·이너뷰티": { icon: "device", col: "#64748B", axis: "perDevice", desc: "홈 뷰티기기 · 피부측정" },
};

/* 화장품 카테고리 목록 — A3·비교엔진이 "이건 화장품이다"를 판별하는 단일 소스 */
const SKIN_CAT_LIST = Object.keys(SKIN_CATS);

/* ── 제품 ──
   vol: 용량 수치 · volUnit: "mL" | "g" · sheets: 매수(패드·마스크만)
   spf/pa: 자외선차단 제품만 · functional: 확인된 기능성화장품 유형(없으면 null) */
const SKIN_PRODUCTS = [
  /* ① 클렌징 케어 */
  { id: "sk-1004-ampoulefoam-125", name: "마다가스카르 센텔라 앰플 폼 125ml", brand: "스킨1004", category: "클렌징 케어", volume: "125mL", vol: 125, volUnit: "mL",
    claim: "센텔라 함유 약산성 클렌징 폼", desc: "마다가스카르산 센텔라를 담은 저자극 클렌징 폼입니다.", price: 16150, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-lightcleansingoil-200", name: "마다가스카르 센텔라 라이트 클렌징오일 200ml", brand: "스킨1004", category: "클렌징 케어", volume: "200mL", vol: 200, volUnit: "mL",
    claim: "가볍게 씻기는 센텔라 클렌징 오일", desc: "메이크업·선크림 1차 세정용 오일 클렌저입니다.", price: 23750, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-anua-quercetinol-foam-150", name: "어성초 쿼세티놀 모공 딥 클렌징폼 150ml", brand: "아누아", category: "클렌징 케어", volume: "150mL", vol: 150, volUnit: "mL",
    claim: "어성초·쿼세티놀 함유 모공 클렌징 폼", desc: "피지·잔여물 세정에 초점을 둔 아누아의 딥 클렌징 폼입니다.", price: 12510, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-porecontrol-oil-200", name: "어성초 포어 컨트롤 클렌징오일 200ml", brand: "아누아", category: "클렌징 케어", volume: "200mL", vol: 200, volUnit: "mL",
    claim: "어성초 함유 클렌징 오일", desc: "1차 세정용 오일 클렌저입니다.", price: 13490, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-lrp-effaclar-gel-400", name: "에빠끌라 퓨리파잉 포밍 젤 400ml", brand: "라로슈포제", category: "클렌징 케어", volume: "400mL", vol: 400, volUnit: "mL",
    claim: "지성·트러블 피부용 세정 젤", desc: "피지가 많은 피부를 위한 세정 젤입니다.", price: 21370, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", functional: null },
  { id: "sk-lrp-toleriane-cream-125", name: "똘러리앙 퓨리파잉 포밍 크림 125ml", brand: "라로슈포제", category: "클렌징 케어", volume: "125mL", vol: 125, volUnit: "mL",
    claim: "민감 피부용 저자극 세정 크림", desc: "자극에 예민한 피부를 위한 크림형 클렌저입니다.", price: 22000, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", functional: null },
  { id: "sk-1004-quickcalmingpad-70", name: "마다가스카르 센텔라 퀵 카밍 패드 70매", brand: "스킨1004", category: "클렌징 케어", volume: "70매", sheets: 70,
    claim: "센텔라 함유 토너 패드", desc: "닦아내는 형태의 토너 패드입니다. 1매당 단가로 비교합니다.", price: 25650, source: "brand_mall", url: "https://skin1004korea.com", functional: null },

  /* ② 보습·장벽 케어 */
  { id: "sk-1004-ampoule-55", name: "마다가스카르 센텔라 앰플 55ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "55mL", vol: 55, volUnit: "mL",
    claim: "센텔라 아시아티카 추출물 함유 앰플", desc: "스킨1004의 대표 제품으로 누적 출하 1,750만 병(2026-02 기준)입니다.", price: 17100, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-ampoule-100", name: "마다가스카르 센텔라 앰플 100ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "100mL", vol: 100, volUnit: "mL",
    claim: "센텔라 아시아티카 추출물 함유 앰플", desc: "대용량 구성입니다.", price: 24700, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-toningtoner-210", name: "마다가스카르 센텔라 토닝 토너 210ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "210mL", vol: 210, volUnit: "mL",
    claim: "센텔라 함유 토너", desc: "세안 후 첫 단계 토너입니다.", price: 19950, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-toningtoner-400", name: "마다가스카르 센텔라 토닝 토너 400ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "400mL", vol: 400, volUnit: "mL",
    claim: "센텔라 함유 토너", desc: "대용량 구성입니다.", price: 28500, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-soothingcream-75", name: "마다가스카르 센텔라 수딩크림 75ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "75mL", vol: 75, volUnit: "mL",
    claim: "센텔라 함유 수딩 크림", desc: "가벼운 제형의 진정 보습 크림입니다.", price: 21850, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-cream-75", name: "마다가스카르 센텔라 크림 75ml", brand: "스킨1004", category: "보습·장벽 케어", volume: "75mL", vol: 75, volUnit: "mL",
    claim: "센텔라 함유 보습 크림", desc: "건조한 피부를 위한 보습 크림입니다.", price: 24700, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-anua-heartleaf77-toner-250", name: "어성초 77% 진정 토너 250ml", brand: "아누아", category: "보습·장벽 케어", volume: "250mL", vol: 250, volUnit: "mL",
    claim: "어성초 추출물 77% 함유 토너", desc: "아누아의 대표 제품으로 미국 아마존 토너 카테고리 상위권 제품입니다.", price: 10530, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-heartleaf77-soothing-350", name: "어성초 77 수딩 토너 350ml", brand: "아누아", category: "보습·장벽 케어", volume: "350mL", vol: 350, volUnit: "mL",
    claim: "어성초 추출물 함유 수딩 토너", desc: "대용량 구성입니다.", price: 15300, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-heartleaf80-ampoule-30", name: "어성초 80 수분 진정 앰플 30ml", brand: "아누아", category: "보습·장벽 케어", volume: "30mL", vol: 30, volUnit: "mL",
    claim: "어성초 추출물 80% 함유 앰플", desc: "수분·진정 목적의 고농축 앰플입니다.", price: 8790, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-heartleaf70-lotion-200", name: "어성초 70 데일리 릴리프 로션 200ml", brand: "아누아", category: "보습·장벽 케어", volume: "200mL", vol: 200, volUnit: "mL",
    claim: "어성초 추출물 함유 데일리 로션", desc: "가벼운 마무리의 데일리 보습 로션입니다.", price: 13400, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-pdrn-cream-60", name: "PDRN 히알루론산 100 수분 크림 60ml", brand: "아누아", category: "보습·장벽 케어", volume: "60mL", vol: 60, volUnit: "mL",
    claim: "히알루론산 함유 수분 크림", desc: "수분 보유에 초점을 둔 크림입니다.", price: 15570, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-sws-yunjo-essence-60", name: "윤조에센스 6세대 60ml", brand: "설화수", category: "보습·장벽 케어", volume: "60mL", vol: 60, volUnit: "mL",
    claim: "한방 성분 함유 에센스", desc: "세안 후 첫 단계에 사용하는 에센스입니다.", price: 85790, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A4%ED%99%94%EC%88%98%20%EC%9C%A4%EC%A1%B0%EC%97%90%EC%84%BC%EC%8A%A4", functional: null },
  { id: "sk-sws-yunjo-essence-30", name: "윤조에센스 6세대 30ml", brand: "설화수", category: "보습·장벽 케어", volume: "30mL", vol: 30, volUnit: "mL",
    claim: "한방 성분 함유 에센스", desc: "소용량 구성입니다.", price: 37000, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A4%ED%99%94%EC%88%98%20%EC%9C%A4%EC%A1%B0%EC%97%90%EC%84%BC%EC%8A%A4", functional: null },

  /* ③ 자외선·환경 보호 */
  { id: "sk-1004-airfit-plus-50", name: "마다가스카르 센텔라 에어핏 선크림 플러스 50ml", brand: "스킨1004", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 기능성화장품", desc: "센텔라를 담은 데일리 선크림입니다.", price: 19000, source: "brand_mall", url: "https://skin1004korea.com", spf: null, pa: null, functional: null, care: ["진정"] },
  { id: "sk-1004-airfit-light-50", name: "마다가스카르 센텔라 에어핏 선크림 라이트 50ml", brand: "스킨1004", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 기능성화장품", desc: "가벼운 사용감의 데일리 선크림입니다.", price: 18050, source: "brand_mall", url: "https://skin1004korea.com", spf: null, pa: null, functional: null, care: ["진정"] },
  { id: "sk-lrp-anthelios-uv-50", name: "안뗄리오스 UV 무스 50ml", brand: "라로슈포제", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "민감 피부를 고려한 자외선 차단 제품입니다.", price: 21470, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", spf: null, pa: null, functional: null, care: ["더마", "저자극"] },
  { id: "sk-missha-safeblock-cover-14", name: "세이프블록 RX 커버 톤업 선쿠션 14g", brand: "미샤", category: "자외선·환경 보호", volume: "14g", vol: 14, volUnit: "g",
    claim: "자외선 차단 쿠션", desc: "덧바르기 편한 쿠션 타입입니다.", price: 8600, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%EC%BF%A0%EC%85%98", spf: "SPF50+", pa: "PA++++", functional: null },
  { id: "sk-missha-safeblock-rosy-12", name: "세이프블록 RX 로지 톤업 선쿠션 12g", brand: "미샤", category: "자외선·환경 보호", volume: "12g", vol: 12, volUnit: "g",
    claim: "자외선 차단 쿠션", desc: "톤업 타입 선쿠션입니다.", price: 14570, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%EC%BF%A0%EC%85%98", spf: "SPF50+", pa: "PA++++", functional: null },
  { id: "sk-sws-sunaway-cc-15", name: "선어웨이 쿨링 선 CC EX 15g", brand: "설화수", category: "자외선·환경 보호", volume: "15g", vol: 15, volUnit: "g",
    claim: "자외선 차단 CC 제품", desc: "쿨링 사용감의 CC 타입입니다.", price: 10840, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%EC%BF%A0%EC%85%98", spf: "SPF50+", pa: "PA+++", functional: null },
  { id: "sk-age20s-calming-pact-125", name: "카밍 롱 프로텍션 선팩트 12.5g", brand: "에이지투웨니스", category: "자외선·환경 보호", volume: "12.5g", vol: 12.5, volUnit: "g",
    claim: "자외선 차단 팩트", desc: "휴대·수정용 팩트 타입입니다.", price: 17900, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%EC%BF%A0%EC%85%98", spf: "SPF50+", pa: "PA++++", functional: null },
  { id: "sk-age20s-glowfit-pact-125", name: "글로우 핏 톤업 선팩트 12.5g", brand: "에이지투웨니스", category: "자외선·환경 보호", volume: "12.5g", vol: 12.5, volUnit: "g",
    claim: "자외선 차단 팩트", desc: "톤업 타입 선팩트입니다.", price: 22900, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%EC%BF%A0%EC%85%98", spf: "SPF50+", pa: "PA++++", functional: null },

  /* ③-b 진정·장벽 계열 선케어 — 민감·붉어짐, 건조·당김 고민에서 함께 보는 제품군.
     ⚠️ care는 **제조사가 내세운 결(진정·장벽·저자극)** 을 옮긴 분류 태그일 뿐이다.
        "붉어짐을 예방한다"처럼 효과를 단정하지 않는다 — 그건 화장품이 말할 수 없는 문장이다. */
  { id: "sk-drg-redblemish-sun-50", name: "레드 블레미쉬 수딩 업 선 50ml", brand: "닥터지", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "붉은기가 신경 쓰이는 피부를 겨냥한 닥터지의 진정 결 선케어입니다.", price: 6950, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%8B%A5%ED%84%B0%EC%A7%80%20%EC%84%A0%ED%81%AC%EB%A6%BC", spf: "SPF50+", pa: "PA++++", functional: null, care: ["진정", "저자극"] },
  { id: "sk-drg-mediuv-mild-50", name: "메디 UV 마일드 선 50ml", brand: "닥터지", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "자극을 낮춘 결의 데일리 선케어입니다.", price: 8820, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%8B%A5%ED%84%B0%EC%A7%80%20%EC%84%A0%ED%81%AC%EB%A6%BC", spf: "SPF50+", pa: "PA++++", functional: null, care: ["저자극"] },
  { id: "sk-drg-brightening-moisture-50", name: "브라이트닝 업 모이스처 선 50ml", brand: "닥터지", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "보습 결을 더한 데일리 선케어입니다.", price: 15750, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%8B%A5%ED%84%B0%EC%A7%80%20%EC%84%A0%ED%81%AC%EB%A6%BC", spf: "SPF50+", pa: "PA++++", functional: null, care: ["보습"] },
  { id: "sk-goodal-heartleaf-sun-50", name: "맑은 어성초 진정 수분 선크림 50ml", brand: "구달", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "어성초를 담은 진정·수분 결의 선크림입니다.", price: 8640, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: "PA++++", functional: null, care: ["진정", "보습"] },
  { id: "sk-cfc-derma-relief-50", name: "더마 릴리프 선스크린 50ml", brand: "셀퓨전씨", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "더마 라인의 진정 결 선스크린입니다.", price: 15000, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: "PA++++", functional: null, care: ["진정", "더마"] },
  { id: "sk-cfc-laser-100-50", name: "레이저 선스크린 100 50ml", brand: "셀퓨전씨", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "시술 후 관리 맥락에서 많이 찾는 더마 선스크린입니다.", price: 16990, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: "PA+++", functional: null, care: ["더마", "저자극"] },
  { id: "sk-roundlab-barrier-sun-50", name: "베리어 인핸싱 선크림 50ml", brand: "로우퀘스트", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "피부장벽 결에 초점을 둔 선크림입니다.", price: 14990, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: "PA++++", functional: null, care: ["장벽", "보습"] },
  { id: "sk-makeprem-calming-sun-50", name: "UV 디펜스 미 카밍 선크림 50ml", brand: "메이크프렘", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "카밍 결의 저자극 선크림입니다.", price: 15290, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: "PA++++", functional: null, care: ["진정", "저자극"] },
  { id: "sk-lrp-anthelios-ultra-50", name: "안뗄리오스 울트라 선크림 50ml", brand: "라로슈포제", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "민감 피부를 고려한 더마 브랜드의 선크림입니다.", price: 20500, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50+", pa: null, functional: null, care: ["더마", "저자극"] },
  { id: "sk-avene-sun-mineral-50", name: "선 미네랄 크림 50ml", brand: "아벤느", category: "자외선·환경 보호", volume: "50mL", vol: 50, volUnit: "mL",
    claim: "자외선 차단 제품", desc: "무기 자외선차단 성분 중심의 민감 피부용 제품입니다.", price: 39580, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A0%ED%81%AC%EB%A6%BC%2050ml%20%EB%AF%BC%EA%B0%90%EC%84%B1", spf: "SPF50", pa: "PA++++", functional: null, care: ["더마", "저자극"] },

  /* ④ 기능성·트러블 케어 */
  { id: "sk-anua-peach70-serum-30", name: "복숭아 70 나이아신 세럼 30ml", brand: "아누아", category: "기능성·트러블 케어", volume: "30mL", vol: 30, volUnit: "mL",
    claim: "나이아신아마이드 함유 세럼", desc: "결·톤 관리를 목적으로 하는 세럼입니다.", price: 15520, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-anua-pdrn-serum-30", name: "PDRN 히알루론산 캡슐 100 세럼 30ml", brand: "아누아", category: "기능성·트러블 케어", volume: "30mL", vol: 30, volUnit: "mL",
    claim: "히알루론산 캡슐 함유 세럼", desc: "수분·결 관리 세럼입니다.", price: 17510, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%95%84%EB%88%84%EC%95%84", functional: null },
  { id: "sk-lrp-hyalub5-serum-30", name: "이알루 B5 세럼 30ml", brand: "라로슈포제", category: "기능성·트러블 케어", volume: "30mL", vol: 30, volUnit: "mL",
    claim: "히알루론산·판테놀 함유 세럼", desc: "수분·결 관리를 목적으로 하는 세럼입니다.", price: 41400, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", functional: null },
  { id: "sk-sws-yunjo-eyeserum-20", name: "윤조 아이세럼 20ml", brand: "설화수", category: "기능성·트러블 케어", volume: "20mL", vol: 20, volUnit: "mL",
    claim: "눈가 전용 세럼", desc: "눈가에 사용하는 소용량 세럼입니다.", price: 59390, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EC%84%A4%ED%99%94%EC%88%98%20%EC%9C%A4%EC%A1%B0%EC%97%90%EC%84%BC%EC%8A%A4", functional: null },

  /* ⑤ 더마·전문 케어 */
  { id: "sk-lrp-cicaplast-b5-40", name: "시카플라스트 밤 B5 40ml", brand: "라로슈포제", category: "더마·전문 케어", volume: "40mL", vol: 40, volUnit: "mL",
    claim: "판테놀(B5) 함유 진정 밤", desc: "자극받은 피부의 보습·진정을 목적으로 하는 더마코스메틱입니다.", price: 14570, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", functional: null },
  { id: "sk-lrp-cicaplast-multi-100", name: "시카플라스트 멀티 리페어 크림 100ml", brand: "라로슈포제", category: "더마·전문 케어", volume: "100mL", vol: 100, volUnit: "mL",
    claim: "판테놀 함유 보습 크림", desc: "건조하고 예민해진 피부를 위한 크림입니다.", price: 39080, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%9D%BC%EB%A1%9C%EC%8A%88%ED%8F%AC%EC%A0%9C", functional: null },
  { id: "sk-1004-watergel-mask-1", name: "마다가스카르 센텔라 워터겔 시트 앰플 마스크 1매", brand: "스킨1004", category: "더마·전문 케어", volume: "1매(25mL)", sheets: 1,
    claim: "센텔라 함유 시트 마스크", desc: "낱장 구성입니다. 1매당 단가로 비교합니다.", price: 3800, source: "brand_mall", url: "https://skin1004korea.com", functional: null },
  { id: "sk-1004-watergel-mask-5", name: "마다가스카르 센텔라 워터겔 시트 앰플 마스크 5매", brand: "스킨1004", category: "더마·전문 케어", volume: "5매", sheets: 5,
    claim: "센텔라 함유 시트 마스크", desc: "5매 구성입니다.", price: 17100, source: "brand_mall", url: "https://skin1004korea.com", functional: null },

  /* ⑥ 디바이스·이너뷰티 — 의료기기 허가 기기는 홈케어의료기 소관이라 여기 넣지 않는다 */
  { id: "sk-medicube-boosterpro", name: "에이지알 부스터 프로", brand: "메디큐브", category: "디바이스·이너뷰티", volume: "1대",
    claim: "홈 뷰티 디바이스", desc: "가정에서 사용하는 뷰티 디바이스입니다. 효과는 제조사 표기를 확인하세요.", price: 210000, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%A9%94%EB%94%94%ED%81%90%EB%B8%8C%20%EC%97%90%EC%9D%B4%EC%A7%80%EC%95%8C", functional: null },
  { id: "sk-medicube-ultratune", name: "에이지알 울트라 튠 40.68", brand: "메디큐브", category: "디바이스·이너뷰티", volume: "1대",
    claim: "홈 뷰티 디바이스", desc: "가정에서 사용하는 뷰티 디바이스입니다. 효과는 제조사 표기를 확인하세요.", price: 183000, source: "danawa", url: "https://search.danawa.com/dsearch.php?query=%EB%A9%94%EB%94%94%ED%81%90%EB%B8%8C%20%EC%97%90%EC%9D%B4%EC%A7%80%EC%95%8C", functional: null },
];

/* 이너뷰티는 데이터를 옮기지 않는다 — 영양제(건기식)로 남기고 링크로만 안내한다 */
const SKIN_INNER_LINK = { cats: ["콜라겐", "비타민C", "종합비타민"], note: "먹는 이너뷰티(콜라겐·비타민)는 건강기능식품이라 영양제 탭에서 1일 단가 기준으로 비교하실 수 있어요." };

/* 이미지·상세 링크(수집분만) — 없으면 화면이 대체 썸네일을 그린다 */
/* 상품몰 최상단에 세우는 제휴 브랜드 — 기준을 밝히고 세운다(정렬 라벨에 그대로 적는다) */
const SKIN_PARTNER_BRANDS = ["아누아", "스킨1004"];

/* 이미지·상세 링크(수집분만) — 없으면 화면이 대체 썸네일을 그린다 */
const SKIN_MEDIA = {};
