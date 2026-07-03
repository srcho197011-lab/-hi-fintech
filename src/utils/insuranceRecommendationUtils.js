/* 보험 추천 유틸 — 고위험 암·암위험도 등급 기반 맞춤 보장 추천 */
function demoInsuranceRecs(m) {
  const t = (m.highRiskCancerTypes || []).join(" ");
  const r = [];
  if (t.indexOf("췌장") >= 0) r.push(["고액암·비급여 항암치료 보장", "췌장암 등 고액 치료비·비급여 항암 집중 보장"]);
  if (t.indexOf("대장") >= 0) r.push(["대장암 진단비·내시경 관리형 보장", "대장암 진단비 + 정기 내시경 관리형 보장"]);
  if (t.indexOf("전립선") >= 0) r.push(["남성 특화 암보험", "전립선암 등 남성 질환 특화 보장"]);
  if (t.indexOf("간암") >= 0) r.push(["간질환·간암 집중 보장", "간암·간질환 진단·치료 집중 보장"]);
  if (t.indexOf("폐암") >= 0) r.push(["폐암·호흡기 질환 보장", "폐암·호흡기 질환 진단·치료 보장"]);
  if (t.indexOf("갑상선") >= 0) r.push(["갑상선암 소액암 보장 확인", "갑상선암(소액암) 보장 한도 점검 권장"]);
  if (t.indexOf("유방") >= 0) r.push(["여성 특화 암보험", "유방암 등 여성 질환 특화 보장"]);
  if (t.indexOf("위암") >= 0) r.push(["위암 진단비·내시경 보장", "위암 진단비 + 정기 위내시경 관리"]);
  if (m.cancerRiskGrade >= 8) r.push(["프리미엄 중증질환 보장", "고위험군 대상 중증질환 종합 보장"]);
  if (!r.length) r.push(["맞춤 건강보험 점검", "현재 보장 공백 점검 및 맞춤 설계"]);
  return r;
}
