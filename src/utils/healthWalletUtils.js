/* 건강지갑 적립 유틸 — 기본 + 집중관리(암위험 6등급↑) + 건강실천(관리포인트 3개↑) */
function demoWalletCalc(m) {
  const base = 30000;
  const focus = m.cancerRiskGrade >= 6 ? 20000 : 0;
  const practice = (m.managementPoints || []).length >= 3 ? 10000 : 0;
  return { base, focus, practice, total: base + focus + practice };
}
