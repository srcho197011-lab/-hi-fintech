/* 건강분석 유틸 — 암위험 등급/색상, 10년 의료비 예측, AI 개인 분석(7파트) */
function demoCancerGrade(g) {
  if (g <= 3) return ["양호", "#16A34A", "#E7F8EE"];
  if (g <= 5) return ["주의", "#F59E0B", "#FEF3E2"];
  if (g <= 7) return ["경고", "#EF4444", "#FDECEC"];
  return ["고위험", "#B91C1C", "#FBD5D5"];
}
function demoCostForecast(cost) { return Math.round((cost || 0) * 1.4); }
/* 이메일 끝 6자리(YYMMDD)에서 주민등록나이 도출 (가입회원은 regAge 우선) */
function demoRegAge(m) { if (typeof m.regAge === "number") return m.regAge; const mm = (m.email || "").match(/(\d{6})@/); if (!mm) return Math.round(m.biologicalAge); const yy = parseInt(mm[1].slice(0, 2), 10); return 2026 - (1900 + yy); }
/* 실명확인 정보로 가입회원의 개인 건강프로필 결정적 생성(데모) */
function demoMakeProfile(name, email, birth6, genderCode) {
  const yy = parseInt((birth6 || "").slice(0, 2), 10); const yyOk = !isNaN(yy);
  const century = (genderCode === "3" || genderCode === "4") ? 2000 : 1900;
  const regAge = Math.max(19, Math.min(90, 2026 - (yyOk ? century + yy : 1985)));
  let h = 2166136261; const seed = (name || "") + (email || ""); for (let i = 0; i < seed.length; i++) { h = (h ^ seed.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; }
  const rnd = (n) => { h = (h * 1103515245 + 12345) >>> 0; return h % n; };
  const bio = Math.max(19, regAge + (rnd(9) - 3));
  const og = () => Math.max(18, bio + (rnd(7) - 3));
  const grade = 2 + rnd(5); // 2~6
  const POOL = ["위암", "대장암", "폐암", "간암", "유방암", "전립선암", "갑상선암", "췌장암"];
  const hr = grade >= 5 ? [POOL[rnd(POOL.length)]] : [];
  const cost = 800000 + regAge * 30000 + rnd(60) * 10000;
  return {
    id: "user-" + ((email || "u").split("@")[0]), name: name, email: email, password: null, regAge: regAge,
    biologicalAge: bio, obesityAge: og(), heartAge: og(), liverAge: og(), pancreasAge: og(), kidneyAge: og(),
    cancerRiskGrade: grade, highRiskCancerTypes: hr, estimatedMedicalCost: cost,
    managementPoints: ["주 150분 이상 유산소 운동", "나트륨·당류 섭취 줄이기", "연 1회 국가건강검진 수검", "금연·절주 실천"],
    isDemoUser: false, realVerified: true,
  };
}
/* 건강관리 리포트 어댑터 — 데모 회원 가용 필드로 6개 서브섹션 데이터 도출 */
function demoReport(m) {
  const reg = demoRegAge(m);
  const bio = m.biologicalAge;
  const diff = +(bio - reg).toFixed(1);
  const cg = demoCancerGrade(m.cancerRiskGrade);
  const agingSpeed = +(bio / reg).toFixed(2);
  const agingRank = Math.min(100, Math.max(1, Math.round(50 + diff * 2.5)));
  const organs = [["비만체형", m.obesityAge], ["심장", m.heartAge], ["간", m.liverAge], ["췌장", m.pancreasAge], ["신장", m.kidneyAge]].map(([nm, age]) => [nm, age, age <= bio ? "좋음" : "나쁨", age <= bio]);
  const worstNames = organs.slice().sort((a, b) => b[1] - a[1]).slice(0, 2).map((o) => o[0].replace("비만체형", "비만"));
  // 질병 9종 — 연관 장기나이/암등급 기반 결정적 추정(데모)
  const DZ = [["비만", m.obesityAge], ["고지혈증", m.heartAge], ["고혈압", m.heartAge], ["당뇨병", m.pancreasAge], ["허혈심장질환", m.heartAge], ["급성심근경색증", m.heartAge], ["뇌혈관질환", m.kidneyAge], ["뇌졸중", m.kidneyAge], ["치매", null]];
  const diseases = DZ.map(([nm, organAge]) => {
    const gap = organAge != null ? (organAge - reg) : diff;
    let pct = Math.round(gap * 1.4 + (m.cancerRiskGrade - 5) * 1.5);
    pct = Math.max(-28, Math.min(38, pct));
    const inc = Math.max(2, Math.round(6 + Math.max(0, pct) / 2 + (reg - 40) / 6)) + "%";
    return [nm, pct, inc];
  });
  // 암 10종 — 고위험암 마킹
  const CNAMES = ["간암", "담낭암", "췌장암", "위암", "대장암", "폐암", "신장암", "방광암", "전립선암", "갑상선암"];
  const hr = m.highRiskCancerTypes || [];
  const cancers = CNAMES.map((nm) => [nm, hr.some((h) => h.indexOf(nm.replace("암", "")) >= 0) ? "경고" : (m.cancerRiskGrade >= 6 ? "주의" : "양호")]);
  const costThis = m.estimatedMedicalCost;
  const cost10 = demoCostForecast(costThis);
  const flags = [];
  flags.push({ t: `노화 빠른 장기: ${worstNames.join("·")}`, c: "#B91C1C", bg: "#FDECEC" });
  if (hr.length) flags.push({ t: `고위험 암: ${hr.join("·")}`, c: "#fff", bg: "#EF4444", ic: "warn" });
  flags.push({ t: `암위험 ${m.cancerRiskGrade}등급 · ${cg[0]}`, c: cg[1], bg: cg[2] });
  flags.push({ t: agingSpeed > 1 ? `노화속도 ${agingSpeed}배(빠름)` : `노화속도 ${agingSpeed}배(느림)`, c: agingSpeed > 1 ? "#B45309" : "#15803D", bg: agingSpeed > 1 ? "#FEF3E2" : "#E7F8EE", ic: agingSpeed > 1 ? "up" : "check" });
  return { bio, reg, diff, agingRank, agingSpeed, organs, worstNames, cg, diseases, cancers, cancerTotal: m.cancerRiskGrade, costThis, cost10, recs: m.managementPoints || [], hr, flags, evalLabel: cg[0] };
}
function demoPersonalAnswer(m) {
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const cg = demoCancerGrade(m.cancerRiskGrade);
  const recs = demoInsuranceRecs(m);
  const w = demoWalletCalc(m);
  const cost10 = demoCostForecast(m.estimatedMedicalCost);
  const organs = [["비만", m.obesityAge], ["심장", m.heartAge], ["간", m.liverAge], ["췌장", m.pancreasAge], ["신장", m.kidneyAge]];
  const worst = organs.slice().sort((a, b) => b[1] - a[1]).slice(0, 2);
  return {
    title: `${m.name}님 맞춤 건강 분석`,
    grade: cg,
    sections: [
      ["현재 건강상태 요약", [`생체나이 ${m.biologicalAge}세 · 암위험도 ${m.cancerRiskGrade}등급(${cg[0]})`]],
      ["주의해야 할 장기·암 위험", [`노화가 빠른 장기: ${worst.map((o) => o[0] + " " + o[1] + "세").join(", ")}`, `고위험 암: ${(m.highRiskCancerTypes || []).join(", ") || "특이사항 없음"}`]],
      ["예상 의료비", [`올해 약 ${fmt(m.estimatedMedicalCost)}`, `10년 후 약 ${fmt(cost10)} (생체나이 기반 ×1.4 추정)`]],
      ["핵심 관리 포인트", m.managementPoints || []],
      ["추천 보장", recs.map((r) => r[0] + " — " + r[1])],
      ["건강지갑 활용 제안", [`예상 적립 ${fmt(w.total)} (기본 ${fmt(w.base)}${w.focus ? ` + 집중관리 ${fmt(w.focus)}` : ""}${w.practice ? ` + 건강실천 ${fmt(w.practice)}` : ""})`, "적립 건강자산으로 보험료·의료비 부담을 완화할 수 있습니다."]],
    ],
  };
}
