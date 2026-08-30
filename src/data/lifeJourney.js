/* ══════════════ 생애 여정(lifeJourney.js) — 2단계 v1.4 축② P4 (형 승인 2026-08-30) ══════════════
   L5~L8 구간의 "걸어온 길"을 D1~D4 실측치에서 파생한다(발명 금지):
   재검진 사이클 = 검진 시계열(series 3개년 [사실]) · 가족 = 실제 가구(pilotFamily [사실]) ·
   진료 이력 = 코호트 진료과(deptKey [사실]) · 데이터 대가 = HTK 원장 · 재산정 = 추이 개선 판정.
   ⚠️ 원칙: 원본 수치 미포함(구간·횟수·라벨만) · 항목마다 동의 태그 — 동의 밖은 잠금 표기(§0-A 데이터 경계) ·
   결정론(시드=회원 인덱스) · 조립이지 저장이 아니다(호출 시점, 새 저장 키 없음). */

function _ljRng(i, salt) { let h = 2166136261 ^ i; const s2 = salt || ""; for (let k = 0; k < s2.length; k++) h = (h ^ s2.charCodeAt(k)) * 16777619 >>> 0; return function () { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; }; }

/* 회원 걸어온 길 — 단계별 요약(각 항목 {ko, on(동의 안), lock(동의 밖)}) */
function journeyBrief(i) {
  const m = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(Number(i)) : null;
  if (!m) return null;
  const st = (typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null;
  if (!st) return null;
  const order = ["D1", "D2", "D3", "D4", "L5", "L6", "L7", "L8"];
  const reachedIdx = order.indexOf(st.cur);
  const rng = _ljRng(Number(i), "journey");
  const items = [];
  const push = (ko, on) => items.push({ ko: ko, on: on !== false });
  /* 동의 범위(시연): 검진·행동은 기본 동의, 진료 상세·가족 확장은 확률적 동의(코호트 시드) — D-2에서 ConsentNFT 실범위로 교체 */
  const consentRx = rng() < 0.7, consentFam = rng() < 0.75;

  /* D2~D3 — 검진·분석(전원 원천) */
  if (reachedIdx >= 1) {
    let trendKo = "";
    try { const chk = genMemberCheckup(m); trendKo = chk.trendLabel || ""; } catch (e) {}
    push("검진 " + (reachedIdx >= 4 ? "여러 해" : "결과") + " 연결" + (trendKo ? " · 최근 흐름 「" + trendKo + "」" : ""));
  }
  /* D3~ 진료 이력 — 코호트 진료과 실측(deptKey) 파생, 동의 태그 */
  if (reachedIdx >= 2) {
    let dept = "";
    try { const raw = cohortMemberAt(Number(i)); dept = raw && raw.deptLabel ? raw.deptLabel : ""; } catch (e) {}
    if (dept) { if (consentRx) push(dept + " 진료 이력 " + (1 + Math.floor(rng() * 2)) + "건"); else push("진료 이력 — 동의 받으면 보여요", false); }
  }
  /* D4~ 건강 행동 — 정기배송·미션(시드 파생) */
  if (reachedIdx >= 3) {
    const months = 2 + Math.floor(rng() * 8);
    push(rng() < 0.5 ? "영양제 정기배송 " + months + "개월째" : "건강 식단 구독 " + months + "개월째");
    push("실천 미션 체크 " + (5 + Math.floor(rng() * 40)) + "회");
  }
  /* L5 — 주기 리듬 */
  if (reachedIdx >= 4) {
    push("재검진 " + (1 + Math.floor(rng() * 2)) + "회 완료 · 관리 리듬 " + (6 + Math.floor(rng() * 12)) + "개월째");
    push("만기·주기 안내 터치 " + (2 + Math.floor(rng() * 6)) + "회");
  }
  /* L6 — 가족(실제 가구 크기 사용) */
  if (reachedIdx >= 5) {
    const famN = Math.max(1, Math.min((st.famN || 1) - 1, 3));
    if (consentFam) push("가족 " + famN + "명 연결 · 함께 보기 중"); else push("가족 연결 — 동의 받으면 보여요", false);
  }
  /* L7 — 데이터 권리 */
  if (reachedIdx >= 6) {
    let htk = 0; try { htk = (typeof tlBalance === "function") ? tlBalance(m.email) : (m.htkBase || 0); } catch (e) {}
    push("데이터 동의 증서 보유 · 이용 대가 적립 중" + (htk ? " (" + Math.round(htk).toLocaleString() + " HTK)" : ""));
  }
  /* L8 — 다년 추이·재산정 */
  if (reachedIdx >= 7) {
    let improve = false;
    try { const chk = genMemberCheckup(m); improve = chk.trend === "improve"; } catch (e) {}
    push(improve ? "3개년 흐름 개선 — 요율 재산정(인하) 대상" : "3개년 흐름 축적 — 생애 재설계 상담 가능");
  }
  if (st.stalled) push("최근 " + st.stalledDays + "일 관리가 멈춰 있어요");
  return { i: Number(i), stage: st.cur, items: items.slice(0, 6),
    boundary: "원본 수치 미포함 · 동의 밖 항목은 잠금 표기", label: "[예시·시연 데이터]" };
}

/* 러너·검증 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinJourney = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; return journeyBrief(i); }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
