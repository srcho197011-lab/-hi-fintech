/* ══════════════ 60일 사이클 엔진(cycleStage.js) — 리뉴얼 v1.1 R0 (형 승인 2026-09-02) ══════════════
   원천 사상: 형 개정 「헬스메이트센터_설명서_v2」 제0부 — 보험 시계 60일(T0~T8) + 건강관리 시계 1년.
   ⚠️ 원칙:
     · 일수 하드코딩 분산 금지 — CYCLE_SPEC이 단일 소스(상품 약관 확정 시 여기 한 곳만 수정).
     · 결정론 — 회원 인덱스 시드(_hmcRng 재사용). 같은 날 호출은 항상 같은 값.
     · 검진일은 회원의 여정 단계(cohortStageOf)와 개연성 있게 파생 — 단계와 사이클이 모순되지 않는다.
     · 시간 신호 4종(S3·S14·S20·S21)은 "달력의 값" — 감이 아니라 날짜가 연락 시점을 지정한다. */

/* ── 사이클 규격(단일 소스) — v2 각주: 실제 일수는 약관·검진기관 실적 따라 협의 확정(시연 기준값) ── */
const CYCLE_SPEC = {
  resultDay: 18,        /* 검진(D0) → 결과 도착 D+14~21의 시연 중앙값 */
  expiryDay: 60,        /* 검진대비보험 만기 = D+60(약 2개월) */
  goldenHours: 48,      /* T2 골든타임 — 결과 도착 후 첫 통화 시한 */
  noticeDays: 20,       /* T4 = 만기 D-20 · 무인 보장분석 트리거 */
  mapDays: 7,           /* T5 = 만기 D-7 · 보장맵 안내 + 마케팅 동의(N2) 요청 */
  secondGoldenDays: 30, /* T6 이후 30일 = 2차 골든타임(무보장 회복 창) */
  nextExamDays: 365,    /* 건강관리 시계 — 다음 검진 주기 */
  reExamNoticeDays: 30, /* T8 = 다음 검진 D-30부터 안내 */
};

/* T 시점 정의(표기·역할 — v2 60일 터치 플랜 §) */
const CYCLE_STAGES = {
  T0: { ko: "예약 완료", act: "접촉 금지 — 프로필·관할 사전 학습만" },
  T1: { ko: "검진·결과 대기", act: "접촉 금지(락) 유지 — 결과 없이 거는 전화는 회원에게 불편" },
  T2: { ko: "골든타임", act: "결과 도착 — 48시간 안 첫 통화(해설·무료 3종·케어 키트 예고)" },
  T3: { ko: "코칭 구간", act: "리포트 해설·케어 키트·습관 미션 — 보험 이야기는 하지 않는 구간" },
  T4: { ko: "만기 D-20", act: "보장 종료 예고(사실 고지) · 무인 보장분석 실행" },
  T5: { ko: "만기 D-7", act: "보장맵 안내 + 마케팅 동의 요청 — 이 설계에서 가장 중요한 30초" },
  T6: { ko: "만기 — 2차 골든타임", act: "무보장 사실 통지 + 동의 보유자에 한해 대안 제안" },
  T7: { ko: "관리 지속", act: "코칭·재검진 안내 계속 — 보험과 무관하게, 관계를 잇는 구간" },
  T8: { ko: "다음 검진", act: "1년 — 올해 검진 준비 안내, 사이클 재시작" },
};

/* ── 검진일 파생 — 여정 단계와 정합(결정론) ──
   D1 미가입: 사이클 전(null) · D1 가입(락): T0~T1 · D2: T2~T3 초입 · D3·D4: T3~T5 · L5+: T6~T8(사이클 후반·재시작 대기) */
function _cycleExamOffset(i, st) {
  const rng = _hmcRng("cyc|" + i);
  const R = CYCLE_SPEC;
  if (!st) return null;
  if (st.cur === "D1") {
    if (!st.enrolled) return null;                                     /* 예약 전 — 사이클 미시작 */
    return Math.floor(rng() * (R.resultDay + 6)) - 6;                  /* -6(예약)~결과 전 */
  }
  if (st.cur === "D2") return R.resultDay + Math.floor(rng() * 5);     /* 결과 도착 0~4일 */
  if (st.cur === "D3") return R.resultDay + 3 + Math.floor(rng() * (R.expiryDay - R.resultDay - 3));  /* 코칭~만기 전 */
  if (st.cur === "D4") return R.expiryDay - R.noticeDays + Math.floor(rng() * (R.noticeDays + 10));   /* 만기 전후 */
  /* L5~L8 — 만기 후: 2차 골든타임·휴지·재시작 대기가 섞인 분포 */
  const r = rng();
  if (r < 0.30) return R.expiryDay + Math.floor(rng() * R.secondGoldenDays);            /* T7 초입 */
  if (r < 0.55) return R.nextExamDays - R.reExamNoticeDays + Math.floor(rng() * R.reExamNoticeDays);  /* T8 */
  return R.expiryDay + R.secondGoldenDays + Math.floor(rng() * (R.nextExamDays - R.expiryDay - R.secondGoldenDays - R.reExamNoticeDays));
}

/* 플랜 파생(검진 유형 연동 — 기본형 국가검진 60% · 표준형 30% · 고급형 10%) */
function cyclePlanOf(i) {
  const h = _hmHash("plan|" + i) % 100;
  return h < 60 ? "기본형" : h < 90 ? "표준형" : "고급형";
}

/* ── 사이클 판정 — {t, ko, act, examDaysAgo, s3, s14, s19, s20, s21, resultAt, expiryAt, plan} ── */
function cycleOf(i, st) {
  st = st || ((typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null);
  const off = _cycleExamOffset(Number(i), st);
  if (off == null) return { t: null, ko: "사이클 전", act: "검진 예약이 잡히면 60일 사이클이 시작돼요.", s19: null };
  const R = CYCLE_SPEC;
  const d = off;                                   /* 검진일로부터 경과일(음수 = 검진 전) */
  const s3 = d >= R.resultDay ? d - R.resultDay : null;                /* 결과 수령 후 경과일 */
  const s14 = d <= R.expiryDay ? R.expiryDay - d : null;               /* 만기까지 남은 일수 */
  const s20 = d > R.expiryDay ? d - R.expiryDay : null;                /* 무보장 경과일 */
  const s21 = R.nextExamDays - d;                                      /* 다음 검진까지 남은 일수 */
  let t;
  if (d < 0) t = "T0";
  else if (d < R.resultDay) t = "T1";
  else if (s3 <= 2) t = "T2";
  else if (s14 != null && s14 > R.noticeDays) t = "T3";
  else if (s14 != null && s14 > R.mapDays) t = "T4";
  else if (s14 != null && s14 >= 0) t = s14 === 0 ? "T6" : "T5";   /* ⚠️ null>=0은 JS에서 true — s14 null 가드 필수(러너 적발 수선) */
  else if (s21 <= R.reExamNoticeDays) t = "T8";
  else t = "T7";
  const meta = CYCLE_STAGES[t];
  return { t: t, ko: meta.ko, act: meta.act, examDaysAgo: d,
    s3: s3, s14: s14, s19: t, s20: s20, s21: Math.max(0, s21),
    goldenLeftH: t === "T2" ? Math.max(0, R.goldenHours - s3 * 24) : null,
    secondGolden: t === "T7" && s20 != null && s20 <= R.secondGoldenDays,
    plan: cyclePlanOf(Number(i)) };
}

/* 러너 훅(관리자) — 판정·결정론 검증용 */
try {
  if (typeof window !== "undefined") {
    window.__hifinCycle = function (i) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const st = (typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null;
        const c = cycleOf(Number(i), st);
        c.stage = st ? st.cur : null; c.enrolled = st ? !!st.enrolled : false;   /* 러너 정합 검사용 동봉 */
        return c;
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
