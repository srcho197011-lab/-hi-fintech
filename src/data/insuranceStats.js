/* ====================== 실손보험·중대질환 통계 데이터 모델 ======================
   실제 통계 기반(2024 실손 보유계약 세대분포·가입률, 2023 국가암등록·만성질환).
   회원별 결정론적 생성(memberInsurance) + 10만 코호트 집계에 사용. ⚠️ 시연용 통계 추정.
   출처: 손해보험협회/보험연구원 실손 세대분포(2세대43·3세대22·1세대18·4세대15%, 가입률≈70%),
        금융위 5세대 실손(2025~), 중앙암등록본부 2023, 질병관리청 만성질환. */

/* ── 실손보험 세대별 보장 상세(조사 기반, 대표값) ── */
const SILSON_SPEC = {
  "1세대":       { code: "G1", period: "~2009.09",       coGen: "0%",   coNon: "0%(통원 5천원 공제)", outLimit: 300000, inLimit: 100000000, monthlyBase: 42000, feature: "급여·비급여 구분 없이 사실상 전액 보장(자기부담 최소)" },
  "2세대":       { code: "G2", period: "2009.10~2017.03", coGen: "10%",  coNon: "20%",  outLimit: 250000, inLimit: 50000000, monthlyBase: 28000, feature: "급여/비급여 구분 도입, 자기부담 10~20%" },
  "3세대":       { code: "G3", period: "2017.04~2021.06", coGen: "10%",  coNon: "20~30%", outLimit: 200000, inLimit: 50000000, monthlyBase: 19000, feature: "‘착한실손’ — 도수·주사·MRI 비급여 특약 분리" },
  "4세대":       { code: "G4", period: "2021.07~2025.04", coGen: "20%",  coNon: "30%",  outLimit: 200000, inLimit: 50000000, monthlyBase: 13000, feature: "비급여 이용량 연동 할증·할인, 저렴한 보험료" },
  "5세대":       { code: "G5", period: "2025.05~",        coGen: "20%",  coNon: "중증 20~30% / 경증 50%", outLimit: 200000, inLimit: 50000000, inNote: "경증 비급여 한도 1천만", monthlyBase: 11000, feature: "중증 중심 재편, 경증 비급여 축소, 최저 보험료" },
  "노인실손":     { code: "GS", period: "실버(50~75 신규)",  coGen: "20%",  coNon: "30%",  outLimit: 100000, inLimit: 30000000, monthlyBase: 33000, feature: "고령자 전용, 보장 축소·고연령 가입 가능" },
  "어린이 실손":  { code: "GC", period: "어린이보험 부가",     coGen: "연동", coNon: "연동", outLimit: 200000, inLimit: 50000000, monthlyBase: 9000, feature: "어린이보험에 부가된 실손(4·5세대 기준)" },
  "미가입":       { code: "G0", period: "—", coGen: "-", coNon: "-", outLimit: 0, inLimit: 0, monthlyBase: 0, feature: "실손 미가입 — 검진 후 보장 공백" },
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

/* ── 실손 유형 선택(연령·아동 반영, 세대 분포는 실통계 근사) ── */
function _pickSilson(rng, age, isChild) {
  if (isChild) return rng() < 0.78 ? "어린이 실손" : "미가입";
  const pUnins = age >= 65 ? 0.40 : age >= 40 ? 0.25 : 0.28;
  if (rng() < pUnins) return "미가입";
  const dist = age >= 65
    ? [["1세대", 30], ["2세대", 38], ["노인실손", 18], ["3세대", 10], ["4세대", 4]]
    : [["2세대", 42], ["3세대", 23], ["1세대", 14], ["4세대", 18], ["5세대", 3]];
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
  const id = m.id || (m.name + (m.regAge || m.age || ""));
  const rng = _insRng(_insHash(id + "|ins"));
  const age = m.regAge != null ? Math.round(m.regAge) : (m.age != null ? m.age : 45);
  const sex = m.sex || "남";
  const isChild = m.isChild != null ? m.isChild : age < 19;
  const band = _insBand(age);
  const drinker = !!m.drinker, smoker = !!m.smoker;
  const cancerHint = !!m.cancer || (Array.isArray(m.highRiskCancerTypes) && m.highRiskCancerTypes.length > 0);

  // 실손 (조성래=실측 4세대 고정)
  const gen = m.isSelf ? "4세대" : _pickSilson(rng, age, isChild);
  const spec = SILSON_SPEC[gen] || SILSON_SPEC["미가입"];
  const silson = { gen, code: spec.code, period: spec.period, coGen: spec.coGen, coNon: spec.coNon, outLimit: spec.outLimit, inLimit: spec.inLimit, inNote: spec.inNote || "", feature: spec.feature, monthly: _silsonMonthly(gen, age), enrolled: gen !== "미가입" };

  // 중대질환 진단 이력 + 진단비 특약
  const hasRider = rng() < (isChild ? 0.5 : 0.45);
  const dx = [], riders = [];
  for (const c of CRITICAL_DZ) {
    let p = (c.prev[band] || 0) / 100;
    if (c.key === "liver") { p *= (sex === "여" ? (c.femaleX || 0.35) : (c.maleX || 1)); if (drinker) p *= (c.drinkerX || 1.8); }
    if (c.key === "lung" && smoker) p *= (c.smokerX || 2.2);
    if (c.key === "cancer" && cancerHint) p = Math.min(0.9, p * 2.4);
    if (rng() < p) {
      const tier = _pickTier(rng, c.tiers);
      dx.push({ key: c.key, cat: c.cat, sub: tier[0], benefit: tier[1], dxAge: Math.max(1, age - Math.floor(rng() * Math.min(8, age))) });
    }
    if (hasRider && rng() < c.riderRate) riders.push({ key: c.key, cat: c.cat, benefit: c.benefit });
  }
  const riderTotal = riders.reduce((s, r) => s + r.benefit, 0);
  const dxTotal = dx.reduce((s, d) => s + d.benefit, 0);
  return { silson, dx, riders, hasRider, riderTotal, dxTotal, hasCritical: dx.length > 0 };
}

/* ── 조성래(실측 회원, 100,001번째) 실손·중대질환 — 4세대 실손 보유·췌장암 위험군(미진단) ── */
let _selfInsCache = null;
function selfInsurance() {
  if (_selfInsCache) return _selfInsCache;
  _selfInsCache = memberInsurance({ id: "SELF-JOSUNGRAE", name: "조성래", sex: "남", regAge: 54, isChild: false, isSelf: true, drinker: true, smoker: false });
  return _selfInsCache;
}

/* ── 코호트 집계(10만+조성래 = 100,001) ── */
let _insAggCache = null;
function insuranceAgg(cohort) {
  if (_insAggCache) return _insAggCache;
  const list = cohort || (typeof pilotCohort === "function" ? pilotCohort() : []);
  const gens = {}, crit = {}; let enrolled = 0, riderN = 0, dxN = 0, silsonPremium = 0;
  Object.keys(SILSON_SPEC).forEach((g) => gens[g] = 0);
  CRITICAL_DZ.forEach((c) => crit[c.cat] = { dx: 0, benefit: 0, riders: 0 });
  for (const m of list) {
    const ins = m._ins || memberInsurance(m);
    gens[ins.silson.gen] = (gens[ins.silson.gen] || 0) + 1;
    if (ins.silson.enrolled) { enrolled++; silsonPremium += ins.silson.monthly; }
    if (ins.hasRider) riderN++;
    if (ins.hasCritical) dxN++;
    ins.dx.forEach((d) => { crit[d.cat].dx++; crit[d.cat].benefit += d.benefit; });
    ins.riders.forEach((r) => { crit[r.cat].riders++; });
  }
  // + 조성래(실측 회원) → 100,001
  const s = selfInsurance();
  gens[s.silson.gen] = (gens[s.silson.gen] || 0) + 1;
  if (s.silson.enrolled) { enrolled++; silsonPremium += s.silson.monthly; }
  if (s.hasRider) riderN++; if (s.hasCritical) dxN++;
  s.dx.forEach((d) => { crit[d.cat].dx++; crit[d.cat].benefit += d.benefit; });
  s.riders.forEach((r) => { crit[r.cat].riders++; });
  const n = (list.length || 0) + 1;
  _insAggCache = { n, gens, crit, enrolled, enrollRate: enrolled / n, riderN, dxN, dxRate: dxN / n, avgPremium: enrolled ? Math.round(silsonPremium / enrolled) : 0 };
  return _insAggCache;
}
