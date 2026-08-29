/* ══════════════ 사전위험 등급 집계(riskGrade.js) — 지시서 프롬프트 v1.3 §2 (P2) ══════════════
   checkupEngine sev(0정상·1주의·2위험) 판정 **위의** 집계 규칙이다 — 새 판정기가 아니다(판정 이원화 금지).
   응급(E)은 라우팅 헌법 P0(A4 트리아지) 소유 — 이 파일은 E를 다루지 않는다(카드 밖).
   수기 등급 조정 기능은 만들지 않는다 — 등급은 데이터에서만 나온다. */

/* 지표군 — interventionMap·스크립트 본론 블록과 공유하는 6군 분류(전역 RISK_GROUPS는 healthOntology 선점 — HM_ 접두) */
const HM_RISK_GROUPS = {
  bp:    { ko: "혈압",    keys: ["sbp", "dbp"] },
  sugar: { ko: "혈당",    keys: ["fbs", "hba1c"] },
  lipid: { ko: "지질",    keys: ["tc", "tg", "hdl", "ldl"] },
  liver: { ko: "간",      keys: ["ast", "alt", "ggtp"] },
  body:  { ko: "체격·근골격", keys: ["bmi", "waist"] },
  organ: { ko: "신장·혈액·기타", keys: ["cr", "egfr", "hb", "plt", "ua", "tsh"] },
};
function riskGroupOf(key) { for (const g in HM_RISK_GROUPS) if (HM_RISK_GROUPS[g].keys.indexOf(key) >= 0) return g; return "organ"; }

/* ── 집계 규칙(§2 표) ──
   H: sev2 지표 ≥1  또는  sev1 지표가 서로 다른 3개 군 이상(복합 위험)
   M: sev1 지표 1~2개(또는 같은 군 내 다수) — 주의 구간의 지속
   L: sev 전부 0이지만 ①추세 악화(worsen) 또는 ②행동 플래그(음주·흡연·비만 경계 등) 보유 — 경계 진입·추세형
   —: 해당 없음(카드 대상 아님 — 정기 리듬 관리로) */
function riskGradeOf(items, trend, flags) {
  const sev2 = [], sev1 = [];
  for (const k in (items || {})) {
    const it = items[k];
    if (!it || typeof it.sev !== "number") continue;
    if (it.sev >= 2) sev2.push(k); else if (it.sev === 1) sev1.push(k);
  }
  const groups1 = new Set(sev1.map(riskGroupOf));
  if (sev2.length >= 1) return { grade: "H", why: "위험 구간 " + sev2.length + "항목", keys: sev2.concat(sev1) };
  if (groups1.size >= 3) return { grade: "H", why: "주의 구간 복합(" + groups1.size + "개 계열)", keys: sev1 };
  if (sev1.length >= 1) return { grade: "M", why: "주의 구간 " + sev1.length + "항목", keys: sev1 };
  const worse = trend === "worsen";
  const flagged = Array.isArray(flags) && flags.length > 0;
  if (worse || flagged) return { grade: "L", why: worse ? "추세 악화" : "행동 플래그(" + flags.join("·") + ")", keys: [] };
  return { grade: "-", why: "관리 리듬 양호", keys: [] };
}

/* 등급 → SLA 티어(leadRouting T1~T4 재사용 — 별도 타이머 구현 금지) + 표기 */
const RISK_GRADE_META = {
  H: { ko: "고위험", tier: "T2", slaH: 48,  color: "var(--hm-grade-h, #EA580C)", dir: "연결" },
  M: { ko: "중위험", tier: "T3", slaH: 168, color: "var(--hm-grade-m, #D97706)", dir: "재검+코칭" },
  L: { ko: "관심",   tier: "T4", slaH: 336, color: "var(--hm-grade-l, #0891B2)", dir: "코칭" },
  E: { ko: "응급",   tier: "T1", slaH: 0,   color: "var(--hm-grade-e, #DC2626)", dir: "즉시(트리아지 소유)" },
};
