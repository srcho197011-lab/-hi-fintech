/* ====================== 실손보험·중대질환 통계 데이터 모델 ======================
   실제 통계 기반(2024 실손 보유계약 세대분포·가입률, 2023 국가암등록·만성질환).
   회원별 결정론적 생성(memberInsurance) + 10만 코호트 집계에 사용. ⚠️ 시연용 통계 추정.
   출처: 손해보험협회/보험연구원 실손 세대분포(2세대43·3세대22·1세대18·4세대15%, 가입률≈70%),
        금융위 5세대 실손(2025~), 중앙암등록본부 2023, 질병관리청 만성질환. */

/* ── 실손보험 세대별 보장 상세(조사 기반, 대표값 — 부록 A-2 반영) ──
   필드: 급여/비급여 자기부담률(coGen/coNon), 통원 회당 한도(outLimit), 입원 한도(inLimit),
        비급여 연간 한도(nonPayAnnual), 갱신주기(renew), 재가입주기(reEnroll),
        비급여 특약(riderNote), 상품유형(type), 월보험료 기준(monthlyBase).
   ⚠️ 상품별 편차 존재 — 각 레코드 생성 시 ±범위 변형 허용, 정확 조건은 약관 재검증. */
const SILSON_SPEC = {
  "1세대":       { code: "G1", type: "일반(구실손)",  period: "~2009.09",       coGen: "0%",   coNon: "0%(통원 5천원 공제)", outLimit: 300000, inLimit: 100000000, nonPayAnnual: 0, renew: "1~5년", reEnroll: "없음(재가입 조건 없음)", riderNote: "비급여 특약 미분리(포괄 보장)", monthlyBase: 42000, feature: "급여·비급여 구분 없이 사실상 전액 보장(자기부담 최소)" },
  "2세대":       { code: "G2", type: "일반(표준화)",  period: "2009.10~2017.03", coGen: "10%",  coNon: "20%",  outLimit: 300000, inLimit: 50000000, nonPayAnnual: 0, renew: "1년", reEnroll: "15년", riderNote: "비급여 특약 미분리(포괄)", monthlyBase: 28000, feature: "표준화 실손 — 급여/비급여 자기부담 10~20% 도입" },
  "3세대":       { code: "G3", type: "일반(착한실손)", period: "2017.04~2021.06", coGen: "10%",  coNon: "20%(특약 30%)", outLimit: 300000, inLimit: 50000000, nonPayAnnual: 3500000, renew: "1년", reEnroll: "15년", riderNote: "도수·비급여주사·MRI 3대 비급여 특약 분리(선택)", monthlyBase: 19000, feature: "‘착한실손’ — 3대 비급여 특약 분리, 보험료 인하" },
  "4세대":       { code: "G4", type: "일반",          period: "2021.07~2026.05", coGen: "20%",  coNon: "30%",  outLimit: 200000, inLimit: 50000000, nonPayAnnual: 50000000, renew: "1년", reEnroll: "5년", riderNote: "급여/비급여 분리 · 비급여 이용량 연동 할증·할인", monthlyBase: 13000, feature: "급여 연 5천만+비급여 연 5천만, 비급여 이용량별 할인·할증" },
  "5세대":       { code: "G5", type: "일반",          period: "2026.05~",        coGen: "20%",  coNon: "중증 30% / 비중증 50%", outLimit: 200000, inLimit: 50000000, nonPayAnnual: 10000000, renew: "1년", reEnroll: "5년", inNote: "중증 비급여 5천만 / 비중증 연 1천만", riderNote: "중증 중심 재편 · 비중증 비급여 한도 축소", monthlyBase: 9000, feature: "중증 중심 재편, 4세대比 보험료 30~50%↓, 최저 보험료" },
  "노인실손":     { code: "GS", type: "노후실손",      period: "실버(50~90 대상)",  coGen: "20%",  coNon: "30%+",  outLimit: 1000000, inLimit: 100000000, nonPayAnnual: 0, renew: "1년", reEnroll: "—", inNote: "입원·통원 합산 연 1억", riderNote: "고령자 전용 · 자기부담↑·보험료↓", monthlyBase: 33000, feature: "50~90세 대상, 노후 의료비 대비 · 요양병원·상급병실 보장" },
  "어린이 실손":  { code: "GC", type: "어린이(특약)",   period: "0~15세 어린이보험 부가", coGen: "세대 기준 동일", coNon: "세대 기준 동일", outLimit: 200000, inLimit: 50000000, nonPayAnnual: 50000000, renew: "1년", reEnroll: "세대 기준", riderNote: "어린이보험 내 실손 특약(4·5세대 기준)", monthlyBase: 9000, feature: "어린이보험에 부가된 실손(세대 기준 보장 동일)" },
  "미가입":       { code: "G0", type: "미가입",        period: "—", coGen: "-", coNon: "-", outLimit: 0, inLimit: 0, nonPayAnnual: 0, renew: "-", reEnroll: "-", riderNote: "-", monthlyBase: 0, feature: "실손 미가입 — 검진 후 치료비 보장 공백" },
};

/* ── 중대질환 10대 구분(형 확정 분류) — 누적 진단율(연령대별 %) + 진단비 특약 ──
   연령밴드 index: 0:~18 1:19-29 2:30-39 3:40-49 4:50-59 5:60-69 6:70-79 7:80+ */
const CRITICAL_DZ = [
  { key: "cancer", cat: "암",      subs: ["일반암", "소액암(제외)", "고액암"], desc: "가장 대표적인 중대질환",
    prev: [0.3, 0.6, 1.2, 2.6, 5.5, 11, 18, 23], riderRate: 0.62, benefit: 30000000,
    tiers: [["소액암(갑상선·기타피부·제자리·경계성)", 6000000, 0.24], ["일반암(소액암 제외)", 30000000, 0.68], ["고액암(간·췌장·폐·뇌·혈액·식도)", 50000000, 0.08]] },
  { key: "brain", cat: "뇌",       subs: ["뇌출혈", "뇌경색", "뇌졸중", "뇌혈관질환"], desc: "상품에 따라 보장 범위 차이 큼",
    prev: [0.05, 0.1, 0.3, 0.8, 1.8, 4.5, 9, 14], riderRate: 0.34, benefit: 20000000,
    tiers: [["뇌출혈", 20000000, 0.18], ["뇌경색", 15000000, 0.5], ["뇌졸중(광범위)", 20000000, 0.17], ["뇌혈관질환(최광범위)", 10000000, 0.15]] },
  { key: "heart", cat: "심장",     subs: ["급성심근경색", "허혈성심장질환"], desc: "최근 허혈성심장질환까지 확대 추세",
    prev: [0.05, 0.15, 0.4, 1.2, 2.8, 5.5, 8.5, 11], riderRate: 0.36, benefit: 20000000,
    tiers: [["급성심근경색", 20000000, 0.32], ["허혈성심장질환(협심증 등)", 12000000, 0.68]] },
  { key: "kidney", cat: "신장",    subs: ["말기신부전"], desc: "투석 또는 신장이식 필요 상태",
    prev: [0.02, 0.05, 0.1, 0.25, 0.5, 0.9, 1.3, 1.5], riderRate: 0.14, benefit: 20000000,
    tiers: [["말기신부전(투석·이식)", 20000000, 1]] },
  { key: "liver", cat: "간",       subs: ["간경화", "간부전"], desc: "일부 상품에서 보장",
    prev: [0.02, 0.1, 0.4, 1.0, 1.8, 2.4, 2.6, 2.4], riderRate: 0.12, benefit: 10000000, maleX: 1.0, femaleX: 0.35, drinkerX: 1.8,
    tiers: [["간경화(간경변)", 10000000, 0.8], ["간부전", 15000000, 0.2]] },
  { key: "lung", cat: "폐",        subs: ["만성호흡부전"], desc: "일부 상품에서 보장",
    prev: [0.02, 0.05, 0.15, 0.4, 0.9, 1.8, 3.2, 4.5], riderRate: 0.1, benefit: 10000000, smokerX: 2.2,
    tiers: [["만성호흡부전(중증 COPD 등)", 10000000, 1]] },
  { key: "transplant", cat: "장기이식", subs: ["심장·간·폐·신장 등 주요 장기이식"], desc: "수술 시 보험금 지급",
    prev: [0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.09, 0.06], riderRate: 0.08, benefit: 50000000,
    tiers: [["주요 장기이식 수술", 50000000, 1]] },
  { key: "burn", cat: "중증화상",   subs: ["중증 화상"], desc: "화상 면적·깊이 기준 충족 시",
    prev: [0.09, 0.11, 0.12, 0.12, 0.11, 0.1, 0.09, 0.08], riderRate: 0.16, benefit: 10000000,
    tiers: [["중증 화상(체표면적·심재성)", 10000000, 1]] },
  { key: "dementia", cat: "중증치매", subs: ["중증 치매(CDR 3↑)"], desc: "장기요양과 연계되는 경우도 있음",
    prev: [0, 0, 0, 0.05, 0.2, 1.2, 6, 20], riderRate: 0.22, benefit: 20000000,
    tiers: [["중증 치매(CDR 3 이상)", 20000000, 1]] },
  { key: "als", cat: "루게릭병",    subs: ["ALS"], desc: "일부 CI보험에서 보장",
    prev: [0.002, 0.004, 0.006, 0.01, 0.015, 0.02, 0.02, 0.015], riderRate: 0.09, benefit: 20000000,
    tiers: [["루게릭병(ALS)", 20000000, 1]] },
];

/* ── 결정론적 RNG(회원 id 해시) ── */
function _insHash(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function _insRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function _insBand(age) { return age <= 18 ? 0 : age <= 29 ? 1 : age <= 39 ? 2 : age <= 49 ? 3 : age <= 59 ? 4 : age <= 69 ? 5 : age <= 79 ? 6 : 7; }
function _wpickIns(rng, arr) { const t = arr.reduce((s, x) => s + x[1], 0); let r = rng() * t; for (const x of arr) { r -= x[1]; if (r <= 0) return x[0]; } return arr[0][0]; }
function _pickTier(rng, tiers) { const t = tiers.reduce((s, x) => s + x[2], 0); let r = rng() * t; for (const x of tiers) { r -= x[2]; if (r <= 0) return x; } return tiers[0]; }

/* ── 실손 유형 선택(연령·아동·가입시기 상관, 세대 분포는 부록 A-1 정합) ──
   목표(가입자 내): 1세대≈17 · 2세대≈29 · 3세대≈36 · 4세대≈17.7 · 5세대≈0.2(+노후 60세↑ 일부).
   상관: 50~60대↑→1·2세대, 30~40대→2·3세대, 20대·최근→3·4세대, 5세대는 극소수 신규,
        미가입률은 20대·70세↑에서 상대적으로 높게(전체≈29%). */
function _pickSilson(rng, age, isChild) {
  if (isChild) return rng() < 0.82 ? "어린이 실손" : "미가입";
  const pUnins = age >= 70 ? 0.38 : age >= 60 ? 0.30 : age >= 40 ? 0.26 : age >= 30 ? 0.27 : 0.34;
  if (rng() < pUnins) return "미가입";
  // 연령밴드별 세대 분포(가중) — 가중치는 코호트 연령분포와 곱해져 A-1 전체 비중에 근사
  const dist = age >= 60
    ? [["1세대", 36], ["2세대", 34], ["노인실손", 10], ["3세대", 15], ["4세대", 5]]
    : age >= 50
    ? [["1세대", 26], ["2세대", 37], ["3세대", 27], ["4세대", 10]]
    : age >= 40
    ? [["1세대", 15], ["2세대", 33], ["3세대", 37], ["4세대", 15]]
    : age >= 30
    ? [["1세대", 7], ["2세대", 27], ["3세대", 44], ["4세대", 22]]
    : [["2세대", 10], ["3세대", 47], ["4세대", 41], ["5세대", 2]];
  return _wpickIns(rng, dist);
}
function _silsonMonthly(gen, age) {
  const base = (SILSON_SPEC[gen] || {}).monthlyBase || 0; if (!base) return 0;
  let f = 1 + Math.max(0, age - 40) * 0.018;            // 연령 할증
  if (gen === "1세대") f *= 1 + Math.max(0, age - 55) * 0.03; // 1세대 고령 급등
  return Math.round(base * f / 100) * 100;
}

/* ── 회원별 실손·중대질환 생성(결정론적) ── */
function memberInsurance(m) {
  if (!m) return null;
  // 조성래(시연 기준 인물)는 어느 섹션에서 조회하든 동일한 시연 케이스(2세대+암·뇌·심장)로 통일
  // (내부 selfInsurance 호출만 forcedRiders를 지니므로 재귀 없이 단일 소스로 수렴)
  if (!m.forcedRiders && m.name === "조성래" && typeof selfInsurance === "function") return selfInsurance();
  const id = m.id || (m.name + (m.regAge || m.age || ""));
  const rng = _insRng(_insHash(id + "|ins"));
  const age = m.regAge != null ? Math.round(m.regAge) : (m.age != null ? m.age : 45);
  const sex = m.sex || "남";
  const isChild = m.isChild != null ? m.isChild : age < 19;
  const band = _insBand(age);
  const drinker = !!m.drinker, smoker = !!m.smoker;
  const cancerHint = !!m.cancer || (Array.isArray(m.highRiskCancerTypes) && m.highRiskCancerTypes.length > 0);

  // 실손 (조성래=시연 기준 인물 → 2세대 실손 고정, 아래 진단비도 지정)
  const gen = m.isSelf ? (m.forcedGen || "2세대") : _pickSilson(rng, age, isChild);
  const spec = SILSON_SPEC[gen] || SILSON_SPEC["미가입"];
  const enrolled = gen !== "미가입";
  // 가입일(가입시기 상관): 세대 판매기간 내에서 결정론적으로 배치
  const enrollYear = enrolled ? _silsonEnrollYear(gen, rng) : null;
  const silson = { gen, code: spec.code, type: spec.type, period: spec.period,
    coGen: spec.coGen, coNon: spec.coNon, outLimit: spec.outLimit, inLimit: spec.inLimit,
    nonPayAnnual: spec.nonPayAnnual || 0, renew: spec.renew, reEnroll: spec.reEnroll,
    riderNote: spec.riderNote, inNote: spec.inNote || "", feature: spec.feature,
    monthly: _silsonMonthly(gen, age), enrolled, enrollYear,
    hasNonPayRider: enrolled && (gen === "3세대" || gen === "4세대" || gen === "5세대") ? rng() < 0.55 : (gen === "1세대" || gen === "2세대") };

  // 중대질환 진단 이력 + 진단비 특약
  const dx = [], riders = [];
  if (m.isSelf && Array.isArray(m.forcedRiders)) {
    // 조성래: 암·뇌·심장 진단비 보유, 간·신장 미보유(보장 공백 시연). 진단 이력 없음(위험군·미진단).
    for (const c of CRITICAL_DZ) if (m.forcedRiders.includes(c.key)) riders.push({ key: c.key, cat: c.cat, benefit: c.benefit });
  } else {
    // 역선택 경미 반영: 위험등급·가족력 높으면 진단비 가입 확률 소폭↑
    const riskLift = 1 + (cancerHint ? 0.12 : 0) + ((m.risk || 0) >= 4 ? 0.1 : 0);
    const hasRider = rng() < (isChild ? 0.5 : 0.45) * riskLift;
    for (const c of CRITICAL_DZ) {
      let p = (c.prev[band] || 0) / 100;
      if (c.key === "liver") { p *= (sex === "여" ? (c.femaleX || 0.35) : (c.maleX || 1)); if (drinker) p *= (c.drinkerX || 1.8); }
      if (c.key === "lung" && smoker) p *= (c.smokerX || 2.2);
      if (c.key === "cancer" && cancerHint) p = Math.min(0.9, p * 2.4);
      if (rng() < p) {
        const tier = _pickTier(rng, c.tiers);
        dx.push({ key: c.key, cat: c.cat, sub: tier[0], benefit: tier[1], dxAge: Math.max(1, age - Math.floor(rng() * Math.min(8, age))) });
      }
      if (hasRider && rng() < c.riderRate * riskLift) riders.push({ key: c.key, cat: c.cat, benefit: _riderBenefit(c, age, rng) });
    }
  }
  const hasRider = riders.length > 0;
  const riderTotal = riders.reduce((s, r) => s + r.benefit, 0);
  const dxTotal = dx.reduce((s, d) => s + d.benefit, 0);
  return { silson, dx, riders, hasRider, riderTotal, dxTotal, hasCritical: dx.length > 0 };
}
/* 세대 판매기간 내 가입연도(결정론) */
function _silsonEnrollYear(gen, rng) {
  const R = { "1세대": [2003, 2009], "2세대": [2010, 2017], "3세대": [2017, 2021], "4세대": [2021, 2025], "5세대": [2026, 2026], "노인실손": [2015, 2025], "어린이 실손": [2016, 2025] }[gen] || [2015, 2024];
  return R[0] + Math.floor(rng() * (R[1] - R[0] + 1));
}
/* 진단비 가입금액(로그정규 근사, 연령↑→오래된 계약·낮은 금액 경향) */
function _riderBenefit(c, age, rng) {
  const base = c.benefit; const jitter = 0.6 + rng() * 0.9;      // 0.6~1.5배
  const ageDown = 1 - Math.max(0, age - 45) * 0.006;             // 고연령 소폭↓
  const v = base * jitter * Math.max(0.6, ageDown);
  return Math.max(5000000, Math.round(v / 5000000) * 5000000);  // 500만 단위
}

/* ── 건강데이터 × 보험데이터 융합 보험 솔루션(회원별) ──
   위험등급·진단질병·암위험·예상의료비 + 실손세대·중대질환 진단비를 결합해
   보장 갭·세대 진단·필요 담보를 도출. 데이터하우스·보험 AI분석·온톨로지 공용. */
function _insWon(n) { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000).toFixed(n % 100000000 ? 1 : 0) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; }
function insuranceSolution(m) {
  if (!m) return null;
  const ins = m._ins || memberInsurance(m) || (typeof selfInsurance === "function" ? selfInsurance() : null);
  if (!ins) return null;
  const age = m.regAge != null ? Math.round(m.regAge) : (m.age != null ? m.age : 45);
  const risk = m.risk != null ? m.risk : (m.cancerRiskGrade != null ? Math.min(5, Math.round(m.cancerRiskGrade / 1.6)) : 2);
  const isSelfPerson = m.isSelf || m.name === "조성래";
  const diseases = (m.diseases || m.highRiskDiseases || []).concat(isSelfPerson ? ["당뇨병"] : []);
  const cancerRisk = !!m.cancer || (Array.isArray(m.highRiskCancerTypes) && m.highRiskCancerTypes.length > 0) || isSelfPerson;
  const drinker = !!m.drinker || isSelfPerson, smoker = !!m.smoker;
  const riderCats = ins.riders.map((r) => r.cat);
  const dxCats = ins.dx.map((d) => d.cat);
  const F = []; // {sev:'crit'|'warn'|'good', t, d, a}

  // 1) 실손 진단
  if (!ins.silson.enrolled) {
    F.push({ sev: "crit", t: "실손보험 미가입 — 치료비 보장 공백", d: `연 예상 의료비 ${_insWon(m.estCost || 0)}의 대부분이 자기부담. 검진에서 이상이 나와도 치료비 안전망이 없음.`, a: age >= 60 || diseases.length ? "유병자·노후 간편심사 실손 가입 검토 + 무료 검진보험·적립 지원 연계" : "4·5세대 실손 신규 가입 권고" });
  } else if (ins.silson.gen === "1세대" && age >= 60) {
    F.push({ sev: "warn", t: "1세대 실손 — 보장 우수하나 고령 보험료 급등", d: `자기부담 최소(통원 5천 공제)로 보장은 최상이나 갱신 보험료가 급등 구간. 월 ${_insWon(ins.silson.monthly)} 수준.`, a: "보장 가치 대비 보험료 재점검 — 유지 권장(전환 시 보장 축소)" });
  } else if (ins.silson.gen === "4세대" || ins.silson.gen === "5세대") {
    F.push({ sev: "good", t: `${ins.silson.gen} 실손 — 합리적 보험료`, d: `자기부담 급여 ${ins.silson.coGen}/비급여 ${ins.silson.coNon}. 저위험·건강관리형에 적합.`, a: "현 세대 유지 · 비급여 이용 관리로 할증 방지" });
  }

  // 2) 중대질환 진단비 갭(건강위험 융합)
  if (cancerRisk && !riderCats.includes("암")) F.push({ sev: "crit", t: "암 진단비 공백 (암 위험군)", d: "검진·가족력상 암 위험군이나 암 진단비 특약 미보유. 고액암 시 수천만원 치료비 자기부담.", a: "일반암 3,000만+·고액암 특약 가입 권고" });
  else if (!riderCats.includes("암") && age >= 40) F.push({ sev: "warn", t: "암 진단비 미보유", d: "40대 이후 암 발생률 상승 구간. 진단비 특약 없음.", a: "일반암 진단비 특약 검토" });
  if (risk >= 4 && !riderCats.includes("뇌") && !riderCats.includes("심장")) F.push({ sev: "warn", t: "뇌·심장 진단비 공백 (고위험)", d: "심뇌혈관 고위험군이나 뇌·심장 진단비 특약 미보유.", a: "뇌졸중·급성심근경색 진단비(허혈성심장질환 확대형) 가입 권고" });
  if ((diseases.includes("당뇨병") || diseases.includes("만성콩팥병") || diseases.includes("신장질환")) && !riderCats.includes("신장")) F.push({ sev: "warn", t: "신장(말기신부전) 대비 필요", d: "당뇨·신장질환 이력 — 투석·이식 시 고액 의료비.", a: "말기신부전 진단비 특약 검토" });
  if ((drinker || diseases.includes("지방간") || diseases.includes("간질환") || diseases.includes("간경화")) && !riderCats.includes("간")) F.push({ sev: "warn", t: "간(간경화·간부전) 대비 필요", d: `${drinker ? "음주 이력" : "간질환 이력"} — 간경화·간부전 진행 시 고액 치료비. 간 진단비 미보유.`, a: "간경화·간부전 진단비 특약 검토 + 절주·간수치 추적" });

  // 3) 진단 이력 → 재발·후유 보장
  if (dxCats.length) F.push({ sev: "warn", t: `중대질환 진단 이력 (${dxCats.join("·")})`, d: `이미 진단 이력이 있어 신규 가입 제한 가능. 후유·재발·간병 보장 점검 필요.`, a: "간병·후유장해·재진단 담보 및 유병자보험 연계 검토" });

  // 보장 충실도 점수(0~100)
  const critNeed = (cancerRisk ? 1 : 0) + (risk >= 4 ? 1 : 0) + (diseases.length >= 2 ? 1 : 0);
  let score = 50;
  score += ins.silson.enrolled ? 25 : -20;
  score += Math.min(20, ins.riders.length * 6);
  score -= F.filter((x) => x.sev === "crit").length * 15;
  score -= F.filter((x) => x.sev === "warn").length * 6;
  score = Math.max(5, Math.min(98, score));
  const grade = score >= 80 ? "충실" : score >= 60 ? "보통" : score >= 40 ? "부족" : "취약";
  return { ins, findings: F, score, grade, critNeed, silsonMonthly: ins.silson.monthly };
}

/* ═══════════ 융합 분석 API — 보험·치료비 AI 솔루션 & AIPlannerChat Tool Calling ═══════════
   5단계(보험 솔루션) 로직을 함수화하여 데이터하우스·보험 AI분석·채팅 상담이 공용 호출.
   ⚠️ 모든 수치는 시연용 예시 기준 — 실제 조건은 약관 확인. */

/* 세대별 자기부담률(급여/비급여) 수치 매핑 */
const SILSON_RATE = {
  "1세대": { gen: 0.0, non: 0.0 }, "2세대": { gen: 0.1, non: 0.2 }, "3세대": { gen: 0.1, non: 0.2 },
  "4세대": { gen: 0.2, non: 0.3 }, "5세대": { gen: 0.2, non: 0.5 }, "노인실손": { gen: 0.2, non: 0.3 },
  "어린이 실손": { gen: 0.2, non: 0.3 }, "미가입": { gen: 1.0, non: 1.0 },
};
/* 6단계. 중대질환 온톨로지 매핑: 검진지표 → 질환 → 관련 중대질환(진단비 구분)
   + checkups(권장 정밀검진) · shopCats(관련 커머스 카테고리) — 검진예약·커머스 추천 공용 */
const CI_ONTOLOGY = [
  { ind: "공복혈당·당화혈색소(HbA1c)", indKeys: ["혈당", "당화", "hba1c", "당뇨"], disease: "당뇨병", ci: ["심장", "신장"], note: "당뇨 → 허혈성심장질환·말기신부전 위험",
    checkups: ["당화혈색소(HbA1c)", "공복·식후 혈당", "신장기능(eGFR·요단백)", "안저(당뇨망막) 검사"], shopCats: ["혈당관리 식단", "혈당·혈압 홈케어기기", "오메가3·마그네슘"] },
  { ind: "수축기·이완기 혈압", indKeys: ["혈압", "고혈압"], disease: "고혈압", ci: ["뇌", "심장"], note: "고혈압 → 뇌졸중·급성심근경색 위험",
    checkups: ["24시간 활동혈압", "경동맥 초음파", "심전도·심장초음파"], shopCats: ["저염 식단", "가정용 혈압계", "오메가3·코엔자임Q10"] },
  { ind: "총콜레스테롤·LDL·중성지방", indKeys: ["콜레스테롤", "ldl", "중성지방", "지질", "고지혈"], disease: "이상지질혈증", ci: ["뇌", "심장"], note: "이상지질혈증 → 심뇌혈관 위험",
    checkups: ["지질패널(LDL·HDL·TG)", "경동맥 초음파", "관상동맥 칼슘 CT"], shopCats: ["저지방·저당 식단", "오메가3·홍국(모나콜린)"] },
  { ind: "AST·ALT·γ-GTP(간수치)", indKeys: ["간수치", "ast", "alt", "gtp", "지방간", "간"], disease: "간질환(지방간·간염)", ci: ["간"], note: "간수치 이상 → 간경화·간부전 위험",
    checkups: ["간기능(AST·ALT·γ-GTP)", "복부 초음파(간)", "간섬유화 스캔(파이브로스캔)"], shopCats: ["간 건강 식단", "밀크씨슬(실리마린)"] },
  { ind: "크레아티닌·eGFR(신장기능)", indKeys: ["크레아티닌", "egfr", "신장", "콩팥", "사구체"], disease: "만성콩팥병", ci: ["신장"], note: "신기능 저하 → 말기신부전(투석·이식) 위험",
    checkups: ["신장기능(eGFR·크레아티닌)", "요단백·알부민뇨", "신장 초음파"], shopCats: ["신장케어 식단(저염·저인)", "혈압·혈당 관리"] },
  { ind: "종양표지자·가족력·영상소견", indKeys: ["종양", "암", "가족력", "결절", "용종", "종괴"], disease: "암 위험", ci: ["암"], note: "암 위험군 → 암 진단비 필요",
    checkups: ["위·대장 내시경", "복부·간·췌장 초음파", "종양표지자(CA19-9 등)", "저선량 흉부 CT"], shopCats: ["항산화 영양제", "면역 강화 식단"] },
  { ind: "BMI·복부둘레·대사지표", indKeys: ["bmi", "비만", "복부", "대사"], disease: "대사증후군", ci: ["심장", "뇌", "신장"], note: "대사증후군 → 심뇌혈관·신장 복합 위험",
    checkups: ["체성분·복부지방 CT", "공복혈당·지질패널", "경동맥 초음파"], shopCats: ["체중관리 식단", "프로바이오틱스·식이섬유"] },
  { ind: "폐기능·흉부영상·흡연", indKeys: ["폐", "흡연", "호흡", "copd", "흉부"], disease: "만성호흡기질환", ci: ["폐"], note: "흡연·폐기능 저하 → 만성호흡부전 위험",
    checkups: ["폐기능검사(PFT)", "저선량 흉부 CT"], shopCats: ["호흡기 면역 영양제", "금연 보조"] },
];
function _mIns(m) { return (m && (m._ins || memberInsurance(m))) || null; }

/* (A) 보장 공백 분석 — 건강위험 × 보유보장 매트릭스(우선순위화) */
function analyzeCoverageGap(m) {
  const sol = insuranceSolution(m); if (!sol) return null;
  const rank = { crit: 0, warn: 1, good: 2 };
  const gaps = sol.findings.filter((f) => f.sev !== "good").sort((a, b) => rank[a.sev] - rank[b.sev]);
  return { score: sol.score, grade: sol.grade, gaps, top: gaps[0] || null, ins: sol.ins, silsonMonthly: sol.silsonMonthly };
}

/* (B) 실손 세대별 자기부담률·한도 적용 예상 본인부담금 */
function calcOutOfPocket(m, treatmentType, cost) {
  const ins = _mIns(m); if (!ins) return null;
  cost = Number(cost) || 0;
  const gen = ins.silson.gen, rate = SILSON_RATE[gen] || SILSON_RATE["미가입"];
  const t = String(treatmentType || "").toLowerCase();
  const isNonPayRider = /도수|비급여주사|주사|mri|체외충격파|증식/.test(t);   // 3대 비급여 특약 대상
  const isNonPay = isNonPayRider || /비급여|미용|점|제모|영양수액|도수/.test(t);
  const cat = isNonPay ? "비급여" : "급여";
  let coRate = isNonPay ? rate.non : rate.gen;
  let note = "";
  if (!ins.silson.enrolled) { note = "실손 미가입 — 전액 본인부담"; return { gen, cat, cost, coRate: 1, covered: 0, oop: cost, note }; }
  // 3세대↑ 비급여 특약(도수·주사·MRI) 미가입 시 해당 항목 보장 제외
  if (isNonPayRider && (gen === "3세대" || gen === "4세대" || gen === "5세대") && !ins.silson.hasNonPayRider) {
    note = `${gen} 비급여 특약(도수·주사·MRI) 미가입 → 해당 치료비 전액 본인부담`;
    return { gen, cat: "비급여(특약)", cost, coRate: 1, covered: 0, oop: cost, note };
  }
  // 통원 회당 한도 적용(간이)
  const covBefore = cost * (1 - coRate);
  const cap = ins.silson.outLimit || 0;
  let covered = covBefore, capped = false;
  if (cap && covered > cap) { covered = cap; capped = true; }
  const oop = cost - covered;
  note = `${gen} ${cat} 자기부담 ${Math.round(coRate * 100)}%` + (capped ? ` · 통원 회당 한도 ${_insWon(cap)} 적용` : "") + (gen === "1세대" ? " · 사실상 전액 보장" : "");
  return { gen, cat, cost, coRate, covered: Math.round(covered), oop: Math.round(oop), capped, note };
}

/* (C) 세대 전환 시뮬레이션 — 유지 vs 4·5세대 전환 보험료·자기부담 비교 */
function simulateGenerationSwitch(m) {
  const ins = _mIns(m); if (!ins) return null;
  const age = m.regAge != null ? Math.round(m.regAge) : (m.age != null ? m.age : 45);
  const cur = ins.silson;
  const curRate = SILSON_RATE[cur.gen] || SILSON_RATE["미가입"];
  const opts = ["4세대", "5세대"].filter((g) => g !== cur.gen).map((g) => {
    const monthly = _silsonMonthly(g, age), r = SILSON_RATE[g];
    return { gen: g, monthly, saveMonthly: cur.monthly - monthly, coGen: SILSON_SPEC[g].coGen, coNon: SILSON_SPEC[g].coNon,
      coDelta: `자기부담 ${Math.round(curRate.non * 100)}%→${Math.round(r.non * 100)}%` };
  });
  const heavyUser = (m.estCost || 0) >= 3000000 || (ins.dx.length > 0);
  const isOldGen = cur.gen === "1세대" || cur.gen === "2세대";
  let warning = "", recommend = "";
  if (isOldGen) {
    warning = `${cur.gen} 실손은 해지 후 재가입이 불가합니다(동일 보장 복원 불가). 전환 시 자기부담률 상승·비급여 축소를 반드시 감안하세요.`;
    recommend = heavyUser ? `의료 이용량이 많아 ${cur.gen} 유지가 유리할 수 있습니다(보장 우위). 보험료 부담이 크면 5세대 비교 검토.` : `보험료 부담이 크고 의료 이용이 적다면 5세대 전환으로 보험료 절감 가능. 단, 보장 축소 감수.`;
  } else {
    recommend = `현 ${cur.gen} 유지 권장. 5세대는 보험료가 더 낮으나 비중증 비급여 보장이 축소됩니다.`;
  }
  return { current: { gen: cur.gen, monthly: cur.monthly, coGen: cur.coGen, coNon: cur.coNon }, options: opts, heavyUser, warning, recommend };
}

/* (D) 온톨로지 기반: 검진지표/질환 → 관련 중대질환 → 진단비 보유 여부 */
function getDiseaseRiskCoverage(m, query) {
  const ins = _mIns(m); if (!ins) return null;
  const q = String(query || "").toLowerCase();
  const hit = CI_ONTOLOGY.find((o) => o.indKeys.some((k) => q.includes(k))) || null;
  const riderCats = ins.riders.map((r) => r.cat);
  if (!hit) {
    // 질환명 직접 매칭 시도
    const byCi = CRITICAL_DZ.find((c) => q.includes(c.cat));
    if (byCi) return { indicator: byCi.cat, disease: byCi.cat, mapped: [{ cat: byCi.cat, covered: riderCats.includes(byCi.cat), benefit: (ins.riders.find((r) => r.cat === byCi.cat) || {}).benefit || 0 }], note: byCi.desc };
    return null;
  }
  const mapped = hit.ci.map((cat) => ({ cat, covered: riderCats.includes(cat), benefit: (ins.riders.find((r) => r.cat === cat) || {}).benefit || 0 }));
  return { indicator: hit.ind, disease: hit.disease, note: hit.note, mapped, gaps: mapped.filter((x) => !x.covered).map((x) => x.cat) };
}

/* (E) 가족 전체 보장 현황 요약(동의 범위 내) */
function getFamilyCoverageSummary(m) {
  let fam = (m && Array.isArray(m.family) && m.family) || null;
  if (!fam && typeof familyMembers === "function") { try { fam = familyMembers(m); } catch (e) {} }
  if (!fam || !fam.length) return { available: false, note: "연동된 가족 구성원 데이터가 없습니다. 우리가족건강관리에서 가족을 등록·동의하면 가족 보장 현황을 함께 분석해 드려요." };
  const rows = fam.map((f) => { const s = insuranceSolution(f); return { name: f.name, rel: f.rel || "", gen: s ? s.ins.silson.gen : "-", grade: s ? s.grade : "-", topGap: s && s.findings.find((x) => x.sev === "crit") ? s.findings.find((x) => x.sev === "crit").t : (s && s.findings.find((x) => x.sev === "warn") ? s.findings.find((x) => x.sev === "warn").t : "양호") }; });
  return { available: true, rows };
}

/* (F) 온톨로지 브릿지 — 회원 건강신호 → CI_ONTOLOGY → 위험질환별 {권장검진·상품카테고리·진단비 공백}
   검진예약(맞춤 검사 추천)·커머스(맞춤 상품 추천)가 단일 소스로 참조. ⚠️ 시연용. */
function ciRiskProfile(m) {
  if (!m) return null;
  const ins = _mIns(m);
  const riderCats = ins ? ins.riders.map((r) => r.cat) : [];
  const isSelfPerson = m.isSelf || m.name === "조성래";
  const diseases = (m.diseases || m.highRiskDiseases || []).concat(isSelfPerson ? ["당뇨병", "지방간"] : []);
  const cancerTypes = (m.highRiskCancerTypes || []).concat(isSelfPerson ? ["췌장암"] : []);
  const dxHist = ins ? ins.dx.map((d) => d.cat) : [];   // 진단 이력(재발·추적 신호)
  const drinker = !!m.drinker || isSelfPerson, smoker = !!m.smoker;
  const rows = [];
  for (const o of CI_ONTOLOGY) {
    let matched = false, src = "";
    for (const d of diseases) { const dl = String(d).toLowerCase(); if (o.indKeys.some((k) => dl.includes(k))) { matched = true; src = d; break; } }
    if (!matched && o.ci.includes("암") && cancerTypes.length) { matched = true; src = cancerTypes[0] + " 위험군"; }
    if (!matched && o.disease.includes("간") && drinker) { matched = true; src = "음주 이력"; }
    if (!matched && o.ci.includes("폐") && smoker) { matched = true; src = "흡연 이력"; }
    if (!matched && o.ci.some((c) => dxHist.includes(c))) { matched = true; src = "진단 이력 추적"; }
    if (!matched) continue;
    const ci = o.ci.map((cat) => ({ cat, covered: riderCats.includes(cat), benefit: (ins && ins.riders.find((r) => r.cat === cat) || {}).benefit || 0 }));
    const gaps = ci.filter((c) => !c.covered).map((c) => c.cat);
    rows.push({ disease: o.disease, indicator: o.ind, note: o.note, source: src, ci, gaps, checkups: o.checkups || [], shopCats: o.shopCats || [], severity: gaps.length ? (o.ci.includes("암") ? "high" : "mid") : "low" });
  }
  rows.sort((a, b) => ({ high: 0, mid: 1, low: 2 }[a.severity] - { high: 0, mid: 1, low: 2 }[b.severity]));
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  const checkups = uniq(rows.flatMap((r) => r.checkups));
  const shopCats = uniq(rows.flatMap((r) => r.shopCats));
  const gapDiseases = uniq(rows.filter((r) => r.gaps.length).map((r) => r.disease));
  return { rows, checkups, shopCats, gapDiseases, hasRisk: rows.length > 0, silson: ins ? ins.silson.gen : null };
}

/* ── 조성래(실측 회원, 100,001번째·시연 기준 인물) ──
   2세대 실손 보유 + 암·뇌·심장 진단비 보유, 간·신장 진단비 미보유(보장 공백 시연).
   췌장암 위험군·미진단, 음주 이력 → 간·신장 공백이 융합 솔루션에서 드러나도록 설계. */
let _selfInsCache = null;
function selfInsurance() {
  if (_selfInsCache) return _selfInsCache;
  _selfInsCache = memberInsurance({ id: "SELF-JOSUNGRAE", name: "조성래", sex: "남", regAge: 54, isChild: false,
    isSelf: true, forcedGen: "2세대", forcedRiders: ["cancer", "brain", "heart"], drinker: true, smoker: false });
  return _selfInsCache;
}

/* ── 코호트 집계(10만+조성래 = 100,001) ── */
let _insAggCache = null;
function insuranceAgg(cohort) {
  if (_insAggCache) return _insAggCache;
  const list = cohort || (typeof pilotCohort === "function" ? pilotCohort() : []);
  const gens = {}, crit = {}; let enrolled = 0, riderN = 0, dxN = 0, silsonPremium = 0;
  const GEN_KEYS = Object.keys(SILSON_SPEC);
  Object.keys(SILSON_SPEC).forEach((g) => gens[g] = 0);
  CRITICAL_DZ.forEach((c) => crit[c.cat] = { dx: 0, benefit: 0, riders: 0 });
  // 연령밴드(8) × 세대 크로스탭(히트맵) + 진단비 금액대 분포
  const ageGen = Array.from({ length: 8 }, () => { const o = {}; GEN_KEYS.forEach((g) => o[g] = 0); o._tot = 0; return o; });
  const riderBands = { "미보유": 0, "~2천만": 0, "2~5천만": 0, "5천만~1억": 0, "1억+": 0 };
  const _rband = (v) => v <= 0 ? "미보유" : v < 20000000 ? "~2천만" : v < 50000000 ? "2~5천만" : v < 100000000 ? "5천만~1억" : "1억+";
  const _tally = (m, ins) => {
    const age = m.regAge != null ? Math.round(m.regAge) : (m.age != null ? m.age : 45);
    const b = _insBand(age); ageGen[b][ins.silson.gen] = (ageGen[b][ins.silson.gen] || 0) + 1; ageGen[b]._tot++;
    gens[ins.silson.gen] = (gens[ins.silson.gen] || 0) + 1;
    if (ins.silson.enrolled) { enrolled++; silsonPremium += ins.silson.monthly; }
    if (ins.hasRider) riderN++;
    if (ins.hasCritical) dxN++;
    riderBands[_rband(ins.riderTotal)]++;
    ins.dx.forEach((d) => { crit[d.cat].dx++; crit[d.cat].benefit += d.benefit; });
    ins.riders.forEach((r) => { crit[r.cat].riders++; });
  };
  for (const m of list) _tally(m, m._ins || memberInsurance(m));
  // + 조성래(실측 회원) → 100,001
  _tally({ regAge: 54 }, selfInsurance());
  const n = (list.length || 0) + 1;
  _insAggCache = { n, gens, crit, ageGen, riderBands, enrolled, enrollRate: enrolled / n, riderN, dxN, dxRate: dxN / n, avgPremium: enrolled ? Math.round(silsonPremium / enrolled) : 0 };
  return _insAggCache;
}
