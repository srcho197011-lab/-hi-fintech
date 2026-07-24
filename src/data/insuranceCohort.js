/* ══════════════ 과업1 — 국가 표준 보험 데이터셋 (100,001명, 전 섹션 공용 단일 출처) ══════════════
   Phase 1 실행 지시서 §2 구현. pilotCohort(100,000명) + 조성래(100,001)와 동일 인덱스 1:1 결합.
   원칙(§2-1):
   - 결정론·재현성: mulberry32 시드(인덱스별 독립 시드) — Math.random 미사용. 같은 인덱스→항상 같은 레코드.
   - 평균 수렴: 금액은 로그정규(우측 꼬리), 목표 평균은 INS_TARGETS에 단일 선언 — cohortInsSelfTest()가 ±2% 수렴을 코드로 검증.
   - 한국 정합: 유병률·가입율·세대 구성은 연령·성별·소득 조건부(고령 실손 미가입↑·유병 할증·여성 갑상선 우세 등은 pilotCohort 질병 규칙 상속).
   - 용량: 인덱스→레코드 on-demand 생성(cohortInsurance(i)), 집계만 캐시. 10만 사전 저장 금지.
   ⚠️ 합성 코호트(시연·통계용 가명 데이터) — 화면 표기 시 "합성 코호트" 라벨 유지(가드레일 ⓘ). */

/* ── 목표 평균(단일 선언 — 자가 검증의 기준) ── */
const INS_TARGETS = {
  cancerBenefitMean: 30000000,   // 암 진단비 평균 3,000만(로그정규, 1천만~1억)
  bhBenefitMean: 20000000,       // 뇌·심장 진단비 평균 2,000만(로그정규, 5백만~7천만)
  silsonRate: 0.70,              // 실손 가입율 전체 평균 ~70%
  monthly40M: [120000, 150000],  // 40대 남성 월 총보험료 평균 목표 구간(12~15만)
  genMix: { 1: 0.18, 2: 0.34, 3: 0.26, 4: 0.20, 5: 0.02 },  // 실손 세대 구성비(가입자 중 — 장기 보유자일수록 구세대)
};

/* ── 결정론 도구 — Box-Muller 정규 / 로그정규(평균 보정 μ=ln(m)−σ²/2) ── */
function _icRng(i) { return _mul32(0x1C5A9E37 ^ Math.imul(i + 1, 2654435761)); }
function _icNorm(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function _icLogn(rng, mean, sigma, lo, hi) { const mu = Math.log(mean) - sigma * sigma / 2; const v = Math.exp(mu + sigma * _icNorm(rng)); return Math.max(lo, Math.min(hi, v)); }
function _icRound(v, unit) { return Math.round(v / unit) * unit; }

/* ── 코호트 회원 조회(1..100000=pilotCohort, 100001=조성래) ── */
function cohortMemberAt(i) {
  if (i === 100001) return (typeof _anchorSelf === "function") ? Object.assign(_anchorSelf(), { age: 54, income: "중", diseases: ["당뇨병", "지방간"], risk: 3, cancer: false, isChild: false }) : null;
  const c = (typeof pilotCohort === "function") ? pilotCohort() : [];
  return c[i - 1] || null;
}

/* ── 실손 세대 규정(항목별 편차의 상한·하한 근거) ── */
const IC_SILSON_GEN = {
  1: { name: "1세대(~2009.9)", joinY: [1999, 2009], selfGen: 0, selfNon: 0, monthly40: 46000 },
  2: { name: "2세대(2009.10~2017.3)", joinY: [2009, 2017], selfGen: 10, selfNon: 20, monthly40: 38000 },
  3: { name: "3세대(2017.4~2021.6)", joinY: [2017, 2021], selfGen: 10, selfNon: 30, monthly40: 23000 },
  4: { name: "4세대(2021.7~)", joinY: [2021, 2025], selfGen: 20, selfNon: 30, monthly40: 13000 },
  5: { name: "5세대(2026~·신규)", joinY: [2026, 2026], selfGen: 20, selfNon: 30, monthly40: 11000 },
};

/* ── 일반 보험 상품 정의(질병군 KCD 키와 결합) ── */
const IC_PRODUCTS = [
  { key: "cancer", name: "암보험", kcd: "C", benefitMean: INS_TARGETS.cancerBenefitMean, sigma: 0.55, lo: 10000000, hi: 100000000, per10M: 14800 },
  { key: "brain", name: "뇌혈관 진단비", kcd: "I6", benefitMean: INS_TARGETS.bhBenefitMean, sigma: 0.50, lo: 5000000, hi: 70000000, per10M: 12200 },
  { key: "heart", name: "심장질환 진단비", kcd: "I2", benefitMean: INS_TARGETS.bhBenefitMean, sigma: 0.50, lo: 5000000, hi: 70000000, per10M: 11900 },
  { key: "life", name: "종신·정기", kcd: null, benefitMean: 50000000, sigma: 0.6, lo: 10000000, hi: 300000000, per10M: 9400 },
  { key: "injury", name: "상해보험", kcd: "S", benefitMean: 15000000, sigma: 0.5, lo: 5000000, hi: 50000000, per10M: 3200 },
  { key: "driver", name: "운전자보험", kcd: null, benefitMean: 10000000, sigma: 0.4, lo: 5000000, hi: 30000000, per10M: 2700 },
  { key: "child", name: "어린이보험", kcd: null, benefitMean: 20000000, sigma: 0.5, lo: 10000000, hi: 60000000, per10M: 5200 },
];

/* ── i번째 회원의 보험 레코드(결정론) — {contracts, silson, uninsured, monthlyTotal, htkBase} ── */
const _icCache = new Map();   // LRU 대용 소형 캐시(화면 반복 조회용)
function cohortInsurance(i) {
  if (_icCache.has(i)) return _icCache.get(i);
  const m = cohortMemberAt(i); if (!m) return null;
  const rng = _icRng(i);
  const age = m.age || 45, sex = m.sex || "남", inc = m.income || "중";
  const dzN = (m.diseases || []).length, sick = dzN >= 2 || !!m.cancer;
  const adult = age >= 19;
  const loadSick = sick ? 1.35 : dzN === 1 ? 1.12 : 1.0;            // 유병 할증
  const ageF = 0.55 + Math.max(0, age) / 55;                         // 연령 요율 곡선

  /* A. 일반 계약 — 보유 확률·건수는 연령·소득 조건부 */
  const contracts = [];
  const own = (p) => rng() < p;
  const addC = (prod, pOwn) => {
    if (!own(pOwn)) return;
    const benefit = _icRound(_icLogn(rng, prod.benefitMean, prod.sigma, prod.lo, prod.hi), 1000000);
    const years = Math.min(Math.max(1, Math.floor(rng() * Math.min(20, Math.max(2, age - 18)))), 25);
    const renewable = rng() < 0.55;
    const monthly = _icRound(benefit / 10000000 * prod.per10M * ageF * loadSick * (renewable ? 0.85 : 1.1), 100);
    contracts.push({ type: prod.key, name: prod.name, kcd: prod.kcd, benefit, monthly, years, renewable,
      detail: { diag: benefit, surgery: _icRound(benefit * 0.2, 500000), daily: _icRound(30000 + rng() * 70000, 10000) } });
  };
  if (adult) {
    const incF = inc === "고" ? 1.25 : inc === "저" ? 0.6 : 1.0;
    addC(IC_PRODUCTS[0], Math.min(0.9, (age >= 40 ? 0.62 : 0.38) * incF));                 // 암
    addC(IC_PRODUCTS[1], Math.min(0.8, (age >= 45 ? 0.34 : 0.16) * incF));                 // 뇌
    addC(IC_PRODUCTS[2], Math.min(0.8, (age >= 45 ? 0.32 : 0.15) * incF));                 // 심장
    addC(IC_PRODUCTS[3], Math.min(0.85, (age >= 30 && age <= 60 ? 0.42 : 0.2) * incF));    // 종신·정기
    addC(IC_PRODUCTS[4], 0.30 * incF);                                                     // 상해
    if (age >= 25 && age <= 65) addC(IC_PRODUCTS[5], 0.28 * incF);                         // 운전자
  } else addC(IC_PRODUCTS[6], 0.55);                                                       // 어린이

  /* B. 실손 — 가입율은 세그먼트 조건부(전체 평균 ≈ INS_TARGETS.silsonRate 수렴) */
  let pSil = 0.83;
  if (!adult) pSil = 0.72;
  if (age >= 65) pSil = 0.52; else if (age >= 55) pSil = 0.72;
  if (sick) pSil -= 0.12;
  if (inc === "저") pSil -= 0.12; if (inc === "고") pSil += 0.07;
  const hasSilson = rng() < Math.max(0.05, Math.min(0.95, pSil));
  let silson = null;
  if (hasSilson) {
    // 세대: 목표 구성비 가중 추첨 + 나이 제약(그 세대 창(window) 안에 생존 시점이 있어야 — 없으면 다음 세대로)
    let gen = _wpick(rng, [[1, 21], [2, 33], [3, 24], [4, 20], [5, 2]]);   // 가중치는 연령 보정 후 목표 genMix로 수렴하도록 튜닝(자가 검증 기준)
    const IC_GEN_MINAGE = { 1: 17, 2: 9, 3: 5, 4: 0, 5: 0 };
    while (gen < 5 && age < IC_GEN_MINAGE[gen]) gen++;
    const spec = IC_SILSON_GEN[gen];
    const loY = Math.max(spec.joinY[0], 2026 - age);          // 출생 이후 연도만
    const joinYear = loY + Math.floor(rng() * Math.max(1, spec.joinY[1] - loY + 1));
    silson = { gen, genName: spec.name, joinYear,
      selfPayGen: spec.selfGen, selfPayNon: spec.selfNon,
      limitPay: gen <= 2 ? 100000000 : 50000000,                                   // 급여(연간 한도)
      limitNon: gen <= 2 ? 100000000 : gen === 3 ? 50000000 : 20000000,            // 비급여
      riders3: gen >= 3 ? { dosu: rng() < 0.62, injection: rng() < 0.55, mri: rng() < 0.66 } : null,  // 3대 비급여 특약(3세대~ 분리)
      outpatientPerVisit: gen <= 2 ? 300000 : 250000, inpatientLimit: 50000000,
      monthly: _icRound(spec.monthly40 * ageF * loadSick, 100) };
  }

  /* C. 미가입 세그먼트(§2-2C) — 나눔·보장 사다리·유병자 포용의 타겟 */
  let uninsured = null;
  if (!silson) {
    const reason = (inc === "저") ? "lowIncome" : (age >= 65) ? "elderly" : sick ? "sick" : "other";
    uninsured = { reason,
      reasonKo: ({ lowIncome: "보험료 부담(차상위·저소득)", elderly: "고령 가입 제한·보험료 급증", sick: "유병 이력 인수 거절·고지 부담", other: "미가입(관심 부족 등)" })[reason],
      estBurden: _icRound((m.costBreakdown ? m.costBreakdown.uncovered : 800000) * (1.1 + rng() * 0.5), 10000),  // 추정 의료비 부담(비급여 중심)
      ladderTarget: adult,                                    // 축2 M3-1 보장 사다리(실손 우선 충당) 대상 플래그
      donationTarget: reason === "lowIncome" || (reason === "elderly" && inc !== "고") };  // 축5 나눔 후보
  }

  const monthlyTotal = contracts.reduce((s, c) => s + c.monthly, 0) + (silson ? silson.monthly : 0);
  const htkBase = _icRound(4000 + _icLogn(rng, 8480, 0.5, 1000, 40000), 10);   // 개인화 HTK 이월 기준(평균 ≈ 12,480 근사)
  const rec = { i, id: m.id, contracts, silson, uninsured, hasSilson, monthlyTotal, htkBase,
    _m: { age, sex, income: inc, diseases: m.diseases || [], risk: m.risk } };
  if (_icCache.size > 4000) _icCache.clear();
  _icCache.set(i, rec);
  return rec;
}

/* ── 보장 공백 요약(CoverageAnalyzer 입력 형식) ── */
function cohortGapProfile(i) {
  const r = cohortInsurance(i); if (!r) return null;
  const held = {}; r.contracts.forEach((c) => { held[c.key || c.type] = c.benefit; });
  const dz = r._m.diseases;
  const needs = [];
  const needIf = (cond, cat, why) => { if (cond) needs.push({ cat, why, covered: !!held[cat], benefit: held[cat] || 0 }); };
  needIf(true, "cancer", r._m.age >= 40 ? "연령 기준 암 보장 권장" : "기본 암 보장");
  needIf(dz.some((d) => /고혈압|뇌|심/.test(d)) || r._m.age >= 50, "brain", "혈압·연령 기준 뇌혈관 보장");
  needIf(dz.some((d) => /당뇨|심|협심/.test(d)) || r._m.age >= 50, "heart", "혈당·연령 기준 심장 보장");
  const gaps = needs.filter((n) => !n.covered);
  return { i, silson: r.silson ? { has: true, gen: r.silson.gen } : { has: false, reason: r.uninsured && r.uninsured.reason },
    needs, gaps, gapCount: gaps.length + (r.hasSilson ? 0 : 1),
    ladder: !r.hasSilson && r.uninsured && r.uninsured.ladderTarget ? { first: "silson", note: "실손 미가입 — 적립 HTK는 실손 가입·보험료에 우선 충당" } : null };
}

/* ── 집계 통계(캐시) — 전 섹션이 같은 숫자를 말하게 하는 단일 출처 ── */
let _icStats = null;
function cohortInsStats() {
  if (_icStats) return _icStats;
  const N = (typeof PILOT_N !== "undefined") ? PILOT_N : 100000;
  const band = (a) => a < 20 ? "0~19" : a < 30 ? "20대" : a < 40 ? "30대" : a < 50 ? "40대" : a < 60 ? "50대" : a < 70 ? "60대" : "70대+";
  const st = { n: 0, silsonN: 0, genMix: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, uninsured: { lowIncome: 0, elderly: 0, sick: 0, other: 0 },
    ladderN: 0, donationN: 0, sumMonthly: 0, sumCancerBenefit: 0, cancerN: 0, sumBH: 0, bhN: 0,
    byBand: {}, m40: { n: 0, sum: 0 }, sumHtk: 0, avgContracts: 0, contractsSum: 0 };
  for (let i = 1; i <= N; i++) {
    const r = cohortInsurance(i); if (!r) continue;
    st.n++;
    const b = band(r._m.age); (st.byBand[b] || (st.byBand[b] = { n: 0, sil: 0 })); st.byBand[b].n++;
    if (r.hasSilson) { st.silsonN++; st.genMix[r.silson.gen]++; st.byBand[b].sil++; }
    else if (r.uninsured) { st.uninsured[r.uninsured.reason]++; if (r.uninsured.ladderTarget) st.ladderN++; if (r.uninsured.donationTarget) st.donationN++; }
    st.sumMonthly += r.monthlyTotal; st.sumHtk += r.htkBase; st.contractsSum += r.contracts.length;
    r.contracts.forEach((c) => { if (c.type === "cancer") { st.sumCancerBenefit += c.benefit; st.cancerN++; } if (c.type === "brain" || c.type === "heart") { st.sumBH += c.benefit; st.bhN++; } });
    if (r._m.sex === "남" && r._m.age >= 40 && r._m.age < 50) { st.m40.n++; st.m40.sum += r.monthlyTotal; }
  }
  st.silsonRate = st.silsonN / st.n;
  st.avgCancerBenefit = st.cancerN ? st.sumCancerBenefit / st.cancerN : 0;
  st.avgBH = st.bhN ? st.sumBH / st.bhN : 0;
  st.avgMonthly = st.sumMonthly / st.n;
  st.avgM40 = st.m40.n ? st.m40.sum / st.m40.n : 0;
  st.avgHtk = st.sumHtk / st.n;
  st.avgContracts = st.contractsSum / st.n;
  _icStats = st;
  return st;
}

/* ── 자가 검증(§2-1) — 평균 수렴 ±2%·구성비·창 검증. 결과는 콘솔+반환(문서 기록용) ── */
function cohortInsSelfTest() {
  const st = cohortInsStats();
  const pct = (a, b) => Math.abs(a - b) / b;
  const checks = [
    { k: "암 진단비 평균", target: INS_TARGETS.cancerBenefitMean, actual: Math.round(st.avgCancerBenefit), ok: pct(st.avgCancerBenefit, INS_TARGETS.cancerBenefitMean) <= 0.02 },
    { k: "뇌·심장 진단비 평균", target: INS_TARGETS.bhBenefitMean, actual: Math.round(st.avgBH), ok: pct(st.avgBH, INS_TARGETS.bhBenefitMean) <= 0.02 },
    { k: "실손 가입율", target: INS_TARGETS.silsonRate, actual: Math.round(st.silsonRate * 1000) / 1000, ok: Math.abs(st.silsonRate - INS_TARGETS.silsonRate) <= 0.02 },
    { k: "40대 남 월보험료(12~15만 창)", target: INS_TARGETS.monthly40M.join("~"), actual: Math.round(st.avgM40), ok: st.avgM40 >= INS_TARGETS.monthly40M[0] && st.avgM40 <= INS_TARGETS.monthly40M[1] },
  ];
  const silN = st.silsonN || 1;
  Object.keys(INS_TARGETS.genMix).forEach((g) => {
    const actual = st.genMix[g] / silN;
    checks.push({ k: `실손 ${g}세대 구성비`, target: INS_TARGETS.genMix[g], actual: Math.round(actual * 1000) / 1000, ok: Math.abs(actual - INS_TARGETS.genMix[g]) <= 0.02 });
  });
  const allOk = checks.every((c) => c.ok);
  const out = { ok: allOk, n: st.n, checks, uninsured: st.uninsured, ladderN: st.ladderN, donationN: st.donationN, avgHtk: Math.round(st.avgHtk), avgContracts: Math.round(st.avgContracts * 100) / 100 };
  try { console.log("[cohortInsSelfTest]", allOk ? "PASS" : "FAIL", JSON.stringify(out)); } catch (e) {}
  return out;
}
/* 검증 훅 — 집계 통계 자가 테스트만 노출(개인 레코드·PII 아님). 온톨로지 검증 화면·감사에서 사용 */
try { window.__hifinCohortSelfTest = cohortInsSelfTest; } catch (e) {}
