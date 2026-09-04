/* ══════════════ 개입 매핑(interventionMap.js) — 지시서 프롬프트 v1.3 §2 (P2) ══════════════
   (등급 × 지표군) → 권장 개입 1~3(우선순위 순). 원칙: 고위험=연결(의료), 저위험=코칭(생활습관).
   완결 이벤트는 P1 매핑표 등재 11종만 사용(§9 가공 금지) — 원격진료·식단 활성은 등재 전이라
   consult_logged가 아니라 실재하는 근접 이벤트로 라벨하거나 접촉 기록으로 남긴다.
   개입 nav·tab은 navInventory의 실제 화면 키만(존재하지 않는 화면 안내 금지). */

/* 개입 사전 — 유형 7종(v1.3 §3 actions.유형) */
const INTERVENTIONS = {
  clinic:  { ko: "진료 연결",   nav: "tele",     ev: "tele_booked",    evNote: "원격진료 상담 접수 [실재·V5 확정] — 회수는 「연결됨」 사실만", type: "연결형" },
  recheck: { ko: "재검진 예약", nav: "checkup",  ev: "cert_issued",    evNote: "검진 예약·증서 발행 [실재]", type: "실행형" },
  diet:    { ko: "식단 조정",   nav: "shop",     ev: "sub_registered", evNote: "식단 상품 정기 등록 [실재] — 플랜 활성 이벤트는 등재 대기", type: "실행형" },
  supp:    { ko: "영양 보충",   nav: "shop",     ev: "sub_registered", evNote: "영양제 정기 등록 [실재] · 상호작용 확인 문구 필수", type: "실행형" },
  move:    { ko: "운동 미션",   nav: "care",     ev: "mission_checked", evNote: "실천 체크 [P1 등재]", type: "실행형" },
  habit:   { ko: "습관 미션",   nav: "care",     ev: "mission_checked", evNote: "절주·금연·복약 체크 [P1 등재]", type: "실행형" },
  family:  { ko: "가족 케어 연결", nav: "mypage", tab: "family", ev: "family_linked", evNote: "가족 연결 [실재]", type: "기록형" },
};

/* (등급 × 지표군) → 개입 키 배열(우선순위 순, ≤3) — v1.3 §2 연결 원칙의 명문화 */
const INTERVENTION_MAP = {
  H: {  /* 연결이 1순위 — 생활습관은 보조 */
    bp:    ["clinic", "recheck", "habit"],      /* 혈압: 진료 연결 → 재검 → 가정혈압 자가측정 습관 */
    sugar: ["clinic", "recheck", "diet"],
    lipid: ["clinic", "diet", "recheck"],
    liver: ["clinic", "habit", "supp"],         /* 간: 진료 → 절주 미션 → 보충(상호작용 확인) */
    body:  ["clinic", "move", "diet"],
    organ: ["clinic", "recheck"],
  },
  M: {  /* 재검 예약 + 코칭 병행 */
    bp:    ["recheck", "habit", "move"],
    sugar: ["recheck", "diet", "move"],
    lipid: ["recheck", "diet", "supp"],
    liver: ["recheck", "habit", "supp"],
    body:  ["move", "diet", "recheck"],
    organ: ["recheck", "habit"],
  },
  L: {  /* 코칭 중심 + 다음 검진 유도 */
    bp:    ["habit", "move", "recheck"],
    sugar: ["diet", "move", "recheck"],
    lipid: ["diet", "supp", "recheck"],
    liver: ["habit", "supp", "recheck"],
    body:  ["move", "diet", "recheck"],
    organ: ["habit", "recheck"],
  },
};

/* 특례(§2) — 지표군 규칙 위에 얹는 조정. 명문화된 것만 적용(즉석 판단 금지) */
const INTERVENTION_OVERRIDES = [
  { when: "60세 이상 + body(근감소 추세)", do: "move는 강도 하향 라벨 + family를 2순위로 삽입", key: "senior-body" },
  { when: "가족 신호 트리거(RPM 등)",      do: "family를 1순위로 승격", key: "family-signal" },
  { when: "liver + 음주 플래그",           do: "habit(절주)을 supp보다 앞으로 · supp에는 상호작용 확인 문구 강제", key: "liver-alcohol" },
];

/* 개입 조회 — 등급·주도 지표군으로 개입 목록 반환(카드 actions의 원천) */
function interventionsFor(grade, groupKey) {
  const m = INTERVENTION_MAP[grade];
  const keys = (m && m[groupKey]) || (m && m.organ) || [];
  return keys.map((k) => Object.assign({ key: k }, INTERVENTIONS[k]));
}
