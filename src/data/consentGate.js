/* ══════════════ 동의 게이트(consentGate.js) — 리뉴얼 v1.1 R1 (형 승인 2026-09-02) ══════════════
   원천 사상: 설명서 v2 제4부 — 4겹 방어의 2겹(직접 동의)·4겹(동의 게이트: 실시간 검증+차단 로그).
   ⚠️ 원칙:
     · 동의 종류·효력·부재 사유는 이 파일이 단일 소스 — 화면·게이트·관제가 같은 사전을 읽는다.
     · N2 미보유면 제안 화면이 렌더링되지 않는다(§0-V2) — 문구 숨김이 아니라 화면 부재.
     · N4(민감정보의 마케팅 활용)는 받지 않는다 — 부재 자체가 설계의 우위(taken:false 명문).
     · 차단은 로그로 증명(consent_blocked 이벤트) — 통제가 작동함을 숫자로 보인다.
     · 체험 회원은 실저장(hifin_consent2), 코호트 10만은 시드 파생(같은 해시 — 회귀 결정론 유지). */

const CONSENT_DEFS = {
  s4: { ko: "건강관리 서비스 제공", who: "현대해상 직접", opt: true,
        opens: "프로의 결과 해설·코칭·추적 관리", ui: "검진 예약 동의 ④(ci_care_svc)" },
  n1: { ko: "만기 시 보장분석 및 안내", who: "현대해상 직접", opt: true, validKo: "보장 만기 후 3개월",
        opens: "만기 D-20 무인 보장분석·보장맵 산출(계약 정보만·건강정보 미사용)", ui: "검진 예약 동의 ⑤(ci_matan_run·ci_matan_id)" },
  n2: { ko: "보험상품 안내·권유", who: "현대해상 직접", opt: true, when: "T5(만기 D-7) — 청약 시점에 묶지 않는다(시간 분리)",
        opens: "제안 화면의 렌더링 — 권유의 개시", ui: "T5 통화 중 회원 자기 화면(R3 실장)" },
  n3_push:  { ko: "광고성 앱 알림", who: "현대해상 직접", opt: true, opens: "광고성 푸시 발송", ui: "검진 예약 동의 ⑥" },
  n3_sms:   { ko: "광고성 문자", who: "현대해상 직접", opt: true, opens: "광고성 SMS·알림톡 발송", ui: "검진 예약 동의 ⑥" },
  n3_email: { ko: "광고성 이메일", who: "현대해상 직접", opt: true, opens: "광고성 이메일 발송", ui: "검진 예약 동의 ⑥" },
  v1: { ko: "영상 상담 이용", who: "현대해상 직접", opt: true,
        opens: "담당 전문가와의 영상 상담 — 결과 리포트를 화면으로 함께 봄(영상·음성 미저장, 요약만 기록)",
        ui: "검진 예약 동의 ⑦(ci_video)" },
  /* 받지 않는 동의 — 이 항목의 부재가 설계의 결정적 우위(v2 §4-3) */
  n4: { ko: "민감정보의 마케팅 활용", taken: false,
        why: "받지 않는다 — 보장맵이 계약 정보만으로 산출되는 비민감 정보이므로 건강정보 없이 제안이 성립한다. 동의 항목이 하나 줄어 동의율이 오르고, 「보험사가 내 건강정보로 영업한다」는 가장 위험한 민원 유형이 소멸한다." },
};

const _CG_KEY = "hifin_consent2";   /* 체험 회원 실저장(카탈로그 등재) — {kind: {on, at}} */

function _cgStore() { try { return JSON.parse(localStorage.getItem(_CG_KEY) || "{}"); } catch (e) { return {}; } }

/* 체험 회원 동의 설정(회원 화면·T5 요청 UI가 호출) */
function consentSet(kind, on) {
  if (!CONSENT_DEFS[kind] || kind === "n4") return { ok: false, why: "등록된 동의 종류가 아니에요" };
  const st = _cgStore();
  st[kind] = { on: !!on, at: new Date().toISOString().slice(0, 10) };
  try { localStorage.setItem(_CG_KEY, JSON.stringify(st)); } catch (e) {}
  try { hiEvent("consent_granted", { kind: kind, on: on ? 1 : 0 }); } catch (e) {}
  return { ok: true };
}

/* 동의 보유 조회 — i(코호트 인덱스)면 시드 파생, null이면 체험 회원 실저장.
   시드 분포: 검진 예약 동선에서 받는 s4·n1·n3는 높게, n2는 T5 이후 국면에서만(시간 분리 반영) */
function consentHas(kind, i) {
  if (kind === "n4") return false;                       /* 정의상 항상 없음 — 받지 않는 동의 */
  if (i == null) { const st = _cgStore(); return !!(st[kind] && st[kind].on); }
  const n = Number(i);
  if (kind === "s4") return _hmHash("cg|s4|" + n) % 100 < 78;
  if (kind === "n1") return _hmHash("cg|n1|" + n) % 100 < 70;
  if (kind === "n2") {                                    /* T5에서 취득 — 사이클 T5 이후만 보유 가능 */
    try {
      const c = (typeof cycleOf === "function") ? cycleOf(n) : null;
      if (!c || ["T5", "T6", "T7", "T8"].indexOf(c.t) < 0) return false;
      return _hmHash("s2|" + n) % 100 < 55;               /* 기존 gSegment 시드와 동일 해시 — 결정론 연속 */
    } catch (e) { return false; }
  }
  if (kind === "v1") {                                    /* 영상 상담 — 건강관리 동의 보유자 중 일부만 */
    if (!consentHas("s4", n)) return false;
    return _hmHash("cg|v1|" + n) % 100 < 52;
  }
  if (kind.indexOf("n3") === 0) return _hmHash("cg|" + kind + "|" + n) % 100 < 45;
  return false;
}

/* 게이트 — 미보유 시 차단 + 로그(§0-V2·4겹). 소비: R2 보장분석 A2 단계 · T5 제안 화면 · 광고 발송 */
function consentGate(kind, i, ctx) {
  const def = CONSENT_DEFS[kind];
  if (!def) return { ok: false, why: "등록된 동의 종류가 아니에요" };
  if (kind === "n4") return { ok: false, why: "받지 않는 동의예요 — 이 설계에서는 존재하지 않아요" };
  if (consentHas(kind, i)) return { ok: true };
  try { hiEvent("consent_blocked", { kind: kind, ctx: String(ctx || "").slice(0, 24) }); } catch (e) {}
  return { ok: false, why: "「" + def.ko + "」 동의가 없어요 — " + def.opens + "이(가) 열리지 않아요. 동의는 " + def.ui + "에서 받아요." };
}

/* 러너·관제 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinConsent = function (cmd, a, b2) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "defs") return Object.keys(CONSENT_DEFS).map((k) => ({ k: k, ko: CONSENT_DEFS[k].ko, taken: CONSENT_DEFS[k].taken !== false, valid: CONSENT_DEFS[k].validKo || null }));
        if (cmd === "n4") return CONSENT_DEFS.n4;
        if (cmd === "has") return { kind: a, i: b2, has: consentHas(a, b2) };
        if (cmd === "gate") return consentGate(a, b2, "runner");
        if (cmd === "set") return consentSet(a, b2);
        return { error: "defs | n4 | has | gate | set" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
