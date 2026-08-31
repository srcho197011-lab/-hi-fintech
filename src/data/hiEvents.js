/* ══════════════ 완결 퍼널 계측 — hiEvent 단일 버스(hiEvents.js) · v2.1 §5-1 (P5) ══════════════
   응답 → 화면 열기 → 트랜잭션 3단 퍼널을 한 곳에서 기록한다. 컴포넌트 산발 로그 금지.
   ⚠️ 원칙:
     ① 가공 이벤트 금지(§9) — HI_EVENT_DEFS(매핑표 실사 확인분)에 없는 이름은 기록을 거부한다.
        tele_connected·homecare_applied는 완결 정의 확정 전이라 정의 자체를 넣지 않는다.
     ② 개인정보 미기록 — payload는 화면 키·항목 키 같은 경량 식별자만. 이름·수치·토큰 금지.
     ③ 시연 분포 — 데모 환경 계측이므로 모든 집계에 '시연 분포' 라벨을 강제한다(§A1).
        실회원 주간 리포트·문안 개선 루프는 론칭 게이트. */
const HI_EVENT_DEFS = {
  /* 퍼널 단계 */
  nav_suggested:   { ko: "안내 응답 발화", stage: 1 },
  nav_opened:      { ko: "화면 열기 탭",   stage: 2 },
  value_rendered:  { ko: "값 표시",       stage: 2 },
  /* 트랜잭션 — P1 매핑표 실사 확인 10종 */
  cert_issued:     { ko: "검진 예약·증서 발행", stage: 3 },
  esc_paid:        { ko: "검진비 선수납 결제",  stage: 3 },
  esc_visited:     { ko: "수검 확인",          stage: 3 },
  esc_settled:     { ko: "공제 정산",          stage: 3 },
  claim_submitted: { ko: "보험금 청구 접수",    stage: 3 },
  rerate_applied:  { ko: "요율 재산정 적용",    stage: 3 },
  sub_registered:  { ko: "정기배송 등록",       stage: 3 },
  consent_updated: { ko: "동의 변경",          stage: 3 },
  family_linked:   { ko: "가족 연결",          stage: 3 },
  rx_received:     { ko: "처방 수령",          stage: 3 },
  mission_checked: { ko: "실천 미션 체크(복약·습관)", stage: 3 },   // P1 실사: adhCheck 실재(hifin_adh_*) — 등재
  /* 지시서 퍼널(P6) — 실재 UI 행동만: 발행=Today 보드 실노출(프로·일 1회), 접촉=원탭 기록. 완결은 위 트랜잭션 재사용 */
  handoff_issued:    { ko: "지시서 발행(Today 노출)", stage: 1 },
  handoff_contacted: { ko: "지시서 접촉(원탭 기록)",  stage: 2 },
  /* 두 곡선 교차(2단계 v1.4 P1) — 회원이 「내 대비 현황」을 누르거나 비용을 먼저 물은 순간(선발화 아님 — 회원 발의만 기록) */
  needs_asked:       { ko: "회원이 먼저 물음(대비 현황)", stage: 2 },
  handoff_resulted:  { ko: "지시서 결과 기록(7코드)",  stage: 2 },
  /* D2 첫 연결 골든타임(F3 — 프롬프트 v1.1 §5) — 전달 체크는 결과 시트의 선택지(§0-B), 키트 배송·사용은 실물 런칭 시 실기록 */
  golden_delivered:  { ko: "골든타임 전달 체크(D2 첫 연결)", stage: 2 },
  kit_offered:       { ko: "케어 키트 안내(D2 통화)",        stage: 2 },
  kit_delivered:     { ko: "케어 키트 배송 완료",            stage: 3 },
  kit_engaged:       { ko: "케어 키트 첫 사용(기기 기록·영양 확인)", stage: 3 },
  /* [P1 실사 결과] telehealth_connected — 화상은 시연 화면(연결 저장 부재) → 등재 불가·후속(형 완결 정의 대기)
     diet_plan_activated — 식단 플랜 활성 트랜잭션 부재(구매·정기배송은 sub_registered가 커버) → 등재 불가·후속 */
};
function _hiEvKey() { return "hifin_events"; }
function hiEvent(name, payload) {
  try {
    if (!HI_EVENT_DEFS[name]) return false;              // 가공 이벤트 금지 — 조용히 늘리지 못한다
    const l = JSON.parse(localStorage.getItem(_hiEvKey()) || "[]");
    const p = {};
    if (payload) for (const k of ["key", "nav", "tab", "kind", "n", "grade", "src"]) if (payload[k] != null) p[k] = String(payload[k]).slice(0, 40);
    l.push({ ts: Date.now(), name: name, p: p, sim: true });
    localStorage.setItem(_hiEvKey(), JSON.stringify(l.slice(-500)));
    return true;
  } catch (e) { return false; }
}
function hiEventAll() { try { return JSON.parse(localStorage.getItem(_hiEvKey()) || "[]"); } catch (e) { return []; } }
/* 집계 — 콘솔 타일용. 시연 분포 라벨은 표시부가 강제한다 */
function hiEventStats() {
  const l = hiEventAll();
  const by = {}, stage = { 1: 0, 2: 0, 3: 0 };
  l.forEach((e) => { by[e.name] = (by[e.name] || 0) + 1; const d = HI_EVENT_DEFS[e.name]; if (d) stage[d.stage]++; });
  return { total: l.length, by: by, stage: stage,
    names: Object.keys(by).sort((a, b) => by[b] - by[a]).map((k) => ({ k: k, ko: (HI_EVENT_DEFS[k] || {}).ko || k, n: by[k] })) };
}
