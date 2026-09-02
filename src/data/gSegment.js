/* ══════════════ 행동·의사 세그먼트 G1~G14(gSegment.js) — 리뉴얼 v1.1 R0 (형 승인 2026-09-02) ══════════════
   원천 사상: 설명서 v2 제0부 4항 — 질환이 아니라 행동과 시점으로 세그먼트를 만든다.
   ⚠️ 원칙:
     · 세그먼트 명칭·정의 어디에도 질환·건강 상태 단어가 등장하지 않는다(§0-V3 — 러너가 명칭 린트).
     · 시간 세그먼트 6종(G2·G10a·G10b·G13·G14·접촉 금지)은 cycleOf의 달력 값이 자동으로 켠다.
     · G8(접촉 보류)이 최우선 차단 — 좋은 DB는 「연락하면 안 되는 사람」도 알려 준다.
     · 원천: 시간 신호=cycleStage[실구현] · 활동=memberActivity[실구현] · 접촉=hmrLastOf[실구현] ·
       동의·상담요청·계약수=시드 자리(R1 실동의·R2 보장맵 산출로 대체 — 표기 [R1]/[R2]). */

const G_SEGMENTS = [
  { g: "G8",   ko: "접촉 보류",     pri: 0, why: "최근 접촉 과다·무응답 반복 — 민원 예방(발동 시 다른 세그먼트보다 우선 차단)" },
  { g: "G2",   ko: "골든타임",      pri: 1, why: "검진 결과가 막 도착(S3 0~2일) — 48시간 응답 시한, 이 창을 놓치면 회복 기회가 거의 없음" },
  { g: "G10b", ko: "만기 D-7",     pri: 1, why: "보장맵 안내 + 마케팅 동의 요청의 최적 시점(S14≤7)" },
  { g: "G13",  ko: "보장 공백",     pri: 1, why: "만기 후 무보장 1~30일 — 2차 골든타임, 이 창 안에서 회복" },
  { g: "G1",   ko: "능동 문의",     pri: 1, why: "최근 상담을 요청했고 동의 보유 — 즉시 배정·당일 응대 [R1]" },
  { g: "G10a", ko: "만기 D-20",    pri: 2, why: "보장 종료 예고 시점(S14≤20) — 무인 보장분석 실행" },
  { g: "G14",  ko: "다음 검진",     pri: 2, why: "1년 주기의 다음 검진이 30일 안(S21≤30) — 사이클 재시작" },
  { g: "G3",   ko: "완결 경험",     pri: 2, why: "프로그램을 완결하고 동의 보유 — 신뢰 기반" },
  { g: "G11",  ko: "보장 미비",     pri: 2, why: "권고 수준 대비 공백이 큰 보장 영역 보유 [R2 보장맵]" },
  { g: "G12",  ko: "중복 정리",     pri: 2, why: "겹치는 보장·절감 여지 — 저항이 가장 낮은 진입(승환 게이트 필수) [R2 보장맵]" },
  { g: "G4",   ko: "고활동",       pri: 3, why: "최근 접속 빈번·알림 반응 양호 — 연결률 높은 모집단" },
  { g: "G5",   ko: "능동 관리 성향", pri: 3, why: "재검진을 스스로 예약·이행 — 수용도 높음" },
  { g: "G6",   ko: "보장 점검 대상", pri: 4, why: "보유계약 0건 또는 다수 [R2]" },
  { g: "G7",   ko: "휴면 재활성",   pri: 5, why: "동의는 있으나 활동 없음 — 저강도 재접촉" },
];

/* ── 신호 파생(원천 재사용 — 시드 자리는 [R1]/[R2]에서 실원천으로 대체) ── */
function _gSignals(i, cyc, st) {
  const n = Number(i);
  const act = (typeof memberActivity === "function") ? memberActivity(n) : null;   /* [실구현] */
  const acts = act ? (act.visits || []).length + (act.commerce || []).length : 0;
  const last = null;   /* 프로별 접촉 기록은 로스터가 관할 — 여기서는 시드 근사 */
  return {
    s1: _hmHash("s1|" + n) % 100 < 4,                                   /* 상담 요청 4% [R1 실기록 대체] */
    s2: (typeof consentHas === "function") ? consentHas("n2", n) : false,   /* 마케팅 동의(N2) — consentGate 실원천(R1 교체: T5 취득이라 T5 이전은 항상 미보유) */
    s4: acts >= 2,                                                      /* 프로그램 완결 근사 [실구현 파생] */
    s5: _hmHash("s5|" + n) % 100 < 35,                                  /* 최근 활동성 */
    s7: act ? (act.visits || []).some((v) => (v.ko || "").indexOf("재검") >= 0) || _hmHash("s7|" + n) % 100 < 18 : false,
    s8: _hmHash("s8|" + n) % 5,                                         /* 보유계약 수 [R2] */
    s11: _hmHash("s11|" + n) % 100 < 6,                                 /* 접촉 과다·무응답 반복 6% */
    s15: _hmHash("s15|" + n) % 100 < 28,                                /* 보장 공백 큼 [R2 보장맵 대체] */
    s16: _hmHash("s16|" + n) % 100 < 15,                                /* 중복 보장 [R2 보장맵 대체] */
  };
}

/* ── 판정 — 회원의 세그먼트 목록(우선순위 정렬·G8 발동 시 차단 플래그) ── */
function gSegOf(i) {
  const st = (typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null;
  const cyc = (typeof cycleOf === "function") ? cycleOf(Number(i), st) : null;
  if (!cyc || cyc.t === null) return { blocked: false, noContact: true, why: "사이클 전(예약 전) — 배정 대상 아님", segs: [] };
  if (cyc.t === "T0" || cyc.t === "T1") return { blocked: true, noContact: true, why: "접촉 금지(락) — 결과 없이 거는 전화는 회원에게 불편", segs: [] };
  const s = _gSignals(i, cyc, st);
  const hit = [];
  if (s.s11) hit.push("G8");
  if (cyc.t === "T2") hit.push("G2");
  if (cyc.s14 != null && cyc.s14 <= 7 && cyc.s14 > 0) hit.push("G10b");
  else if (cyc.s14 != null && cyc.s14 <= 20 && cyc.s14 > 7) hit.push("G10a");
  if (cyc.t === "T6" || (cyc.s20 != null && cyc.s20 >= 0 && cyc.s20 <= 30)) hit.push("G13");   /* 만기 당일(T6)부터 2차 골든타임 개시(표본 검수 적발 수선) */
  if (cyc.s21 <= 30) hit.push("G14");
  if (s.s1 && s.s2) hit.push("G1");
  if (s.s4 && s.s2) hit.push("G3");
  if (s.s15) hit.push("G11");
  if (s.s16) hit.push("G12");
  if (s.s5) hit.push("G4");
  if (s.s7) hit.push("G5");
  if (s.s8 === 0 || s.s8 >= 3) hit.push("G6");
  if (!s.s5 && s.s2 && hit.length === 0) hit.push("G7");
  const order = {}; G_SEGMENTS.forEach((g, ix) => order[g.g] = g.pri * 100 + ix);
  hit.sort((a, b2) => order[a] - order[b2]);
  const blocked = hit[0] === "G8";
  return { blocked: blocked, noContact: blocked, why: blocked ? G_SEGMENTS[0].why : "", segs: hit,
    top: blocked ? "G8" : (hit[0] || null), cycle: cyc.t };
}

/* 명칭 린트(§0-V3) — 세그먼트 명칭·정의에 질환·건강 상태 단어 금지(러너·게이트 공용) */
const G_NAME_FORBIDDEN = /(암|당뇨|혈압|혈당|간질환|간수치|지방간|간염|신장|콜레스테롤|비만|질환|질병|위험군|고위험|중위험|유병|증후군|우울|불면)/;   /* "시간·기간"의 간 오탐 방지 — 간은 복합어로만(러너 적발 수선) */
function gNameLint() {
  const bad = [];
  for (const g of G_SEGMENTS) if (G_NAME_FORBIDDEN.test(g.ko) || G_NAME_FORBIDDEN.test(g.why.replace(/\[R[12].*?\]/g, ""))) bad.push(g.g);
  return bad;
}

/* 러너 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinGSeg = function (i) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (i === "lint") return { bad: gNameLint(), n: G_SEGMENTS.length };
        return gSegOf(Number(i));
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
