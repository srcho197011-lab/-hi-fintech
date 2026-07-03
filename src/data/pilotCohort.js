/* ====================== 파일럿 체험회원 10,000명 · 가족(가구) 온톨로지 코호트 ======================
   결정적(mulberry32 시드) 생성기 — 매 로드 동일 데이터(재현 가능).
   ▸ 정합성 규칙: 진료과목·질병에 성별/연령 제약을 적용(남성 산부인과·여성 전립선암·청년 골다공증 등 방지).
   ▸ 가족(가구) 구조: 가구주·배우자·자녀·부(父)·모(母) 관계 + 연령/성별 정합성.
   ▸ 실제 온톨로지(DEPT_CATS·CHECKUP_ONTOLOGY·DISEASE_INSURANCE) 재사용. (시연용 합성·가명 데이터) */

function _mul32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function _pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function _wpick(rng, pairs) { const tot = pairs.reduce((s, p) => s + p[1], 0); let r = rng() * tot; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[0][0]; }
function _ri(n) { return Math.max(0, Math.round(n)); }

const _SURN = "김이박최정강조윤장임한오서신권황안송전홍고문양손배백허유남심노정하곽성차주우구민".split("");
const _GIVN_M = ["민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "준우", "현우", "건우", "우진", "선우", "서진", "정우", "승현", "유준", "은우", "지훈", "준서", "도현", "현준", "성민", "재윤", "동현", "태윤", "민재", "형준", "지환", "찬호", "영수", "종석", "상철", "광호", "덕수", "병철", "정호", "기훈", "재민", "우성"];
const _GIVN_F = ["서연", "서윤", "지우", "서현", "하은", "하윤", "민서", "지유", "윤서", "채원", "수아", "지아", "은서", "다은", "예은", "수빈", "소율", "예린", "유나", "채은", "지안", "하린", "서아", "가은", "윤아", "연서", "예원", "미영", "정숙", "영자", "순자", "경희", "은주", "혜정", "명숙", "수정", "지영", "현정", "선영", "옥순"];
const _SIDO = [["서울", 18], ["경기", 22], ["인천", 6], ["부산", 7], ["대구", 5], ["대전", 3], ["광주", 3], ["울산", 2], ["세종", 1], ["강원", 3], ["충북", 3], ["충남", 4], ["전북", 3], ["전남", 3], ["경북", 5], ["경남", 5], ["제주", 2]];

const _DEPT_DZ = {
  fm: ["비만", "이상지질혈증", "고혈압", "당뇨병"],
  cardio: ["고혈압", "협심증", "심근경색", "심혈관질환", "부정맥"],
  endo: ["당뇨병", "갑상선기능저하증", "갑상선결절", "골다공증", "이상지질혈증"],
  gastro: ["지방간", "위암", "대장암", "간경변", "역류성식도염"],
  pulmo: ["천식", "만성폐쇄성폐질환", "폐암", "폐렴"],
  nephro: ["만성콩팥병", "고혈압", "신부전"],
  neuro: ["뇌졸중", "치매", "편두통", "뇌혈관질환"],
  obgy: ["유방암", "자궁경부암", "갱년기장애", "골다공증"],
  ped: ["소아비만", "아토피피부염", "천식", "성장지연"],
  ortho: ["골다공증", "골절", "퇴행성관절염", "척추질환"],
  derma: ["아토피피부염", "건선", "탈모"],
  ophtha: ["백내장", "녹내장", "당뇨망막병증"],
  ent: ["알레르기비염", "중이염", "어지럼증"],
  uro: ["전립선암", "요로결석", "전립선비대증"],
  psych: ["우울증", "불안장애", "불면증"],
  dental: ["치주질환", "충치"],
  kmed: ["퇴행성관절염", "요통", "만성피로"],
};
// 정합성 규칙: 질병별 {sex? / min연령 / max연령}. 골다공증은 성별·연령 결합 규칙(아래 _eligibleDz)
const _DZ_RULES = {
  "유방암": { sex: "여", min: 30 }, "자궁경부암": { sex: "여", min: 25 }, "갱년기장애": { sex: "여", min: 43, max: 62 },
  "전립선암": { sex: "남", min: 50 }, "전립선비대증": { sex: "남", min: 45 },
  "치매": { min: 58 }, "뇌졸중": { min: 40 }, "뇌혈관질환": { min: 40 }, "심근경색": { min: 40 }, "협심증": { min: 40 }, "심혈관질환": { min: 38 }, "부정맥": { min: 30 },
  "골절": { min: 6 }, "퇴행성관절염": { min: 38 }, "척추질환": { min: 25 },
  "백내장": { min: 50 }, "녹내장": { min: 40 }, "당뇨망막병증": { min: 30 },
  "만성폐쇄성폐질환": { min: 40 }, "폐암": { min: 40 }, "위암": { min: 35 }, "대장암": { min: 35 }, "간암": { min: 35 }, "간경변": { min: 30 },
  "만성콩팥병": { min: 25 }, "신부전": { min: 25 }, "고혈압": { min: 20 }, "당뇨병": { min: 12 }, "이상지질혈증": { min: 18 },
  "지방간": { min: 15 }, "역류성식도염": { min: 12 }, "갑상선기능저하증": { min: 15 }, "갑상선결절": { min: 18 },
  "소아비만": { max: 18 }, "성장지연": { max: 18 }, "중이염": { max: 60 },
};
function _eligibleDz(pool, sex, age) {
  return (pool || []).filter((dz) => {
    const r = _DZ_RULES[dz];
    if (dz === "골다공증") { if (sex === "남") return age >= 60; return age >= 45; } // 여성 45+/남성 60+
    if (!r) return true;
    if (r.sex && r.sex !== sex) return false;
    if (r.min && age < r.min) return false;
    if (r.max && age > r.max) return false;
    return true;
  });
}
const _DZ_MARK = { "고혈압": "혈압", "심혈관질환": "혈압", "협심증": "콜레스테롤", "심근경색": "콜레스테롤", "당뇨병": "공복혈당", "당뇨망막병증": "공복혈당", "이상지질혈증": "콜레스테롤", "지방간": "간수치", "간경변": "간수치", "만성콩팥병": "신장기능", "신부전": "신장기능", "비만": "체질량지수", "소아비만": "체질량지수", "통풍": "요산", "요로결석": "요산", "골다공증": "골밀도", "골절": "골밀도", "갑상선기능저하증": "갑상선기능", "갑상선결절": "갑상선기능", "위암": "암검진", "대장암": "암검진", "간암": "암검진", "폐암": "암검진", "유방암": "암검진", "자궁경부암": "암검진", "전립선암": "암검진" };
// 연령·성별별 진료과목 가중치 (obgy는 여성만)
function _deptWeights(age, sex) {
  let w;
  if (age < 18) w = [["ped", 40], ["derma", 12], ["ent", 12], ["ophtha", 8], ["dental", 12], ["ortho", 8], ["psych", 8]];
  else if (age < 40) w = [["fm", 14], ["gastro", 12], ["derma", 12], ["obgy", 10], ["psych", 12], ["ent", 10], ["ortho", 10], ["ophtha", 6], ["endo", 6], ["dental", 8], ["uro", 5]];
  else if (age < 60) w = [["fm", 12], ["cardio", 12], ["endo", 12], ["gastro", 12], ["ortho", 10], ["obgy", 8], ["uro", 6], ["neuro", 6], ["psych", 8], ["ophtha", 6], ["kmed", 6], ["nephro", 4]];
  else w = [["cardio", 14], ["endo", 12], ["neuro", 12], ["ortho", 12], ["gastro", 10], ["nephro", 8], ["ophtha", 8], ["uro", 8], ["pulmo", 6], ["kmed", 6], ["obgy", 4], ["fm", 4]];
  if (sex === "남") w = w.filter((x) => x[0] !== "obgy"); // 남성 산부인과 제외
  return w;
}
const RISK_LABELS = ["", "낮음", "보통", "주의", "높음", "매우 높음"];
const RISK_COLORS = ["", "#16A34A", "#0EA5E9", "#F59E0B", "#EF4444", "#B91C1C"];
const REL_ORDER = { "가구주": 0, "배우자": 1, "자녀": 2, "부": 3, "모": 4 };

function _deptLabel(k) { if (typeof DEPT_CATS !== "undefined") { const d = DEPT_CATS.find((x) => x.key === k); if (d) return d.label; } return k; }
function _markLabel(key, gi) { if (typeof CHECKUP_ONTOLOGY !== "undefined") { const o = CHECKUP_ONTOLOGY.find((x) => x.key === key); if (o) return o.grades[gi][0]; } return ["정상", "주의", "위험", "고위험"][gi]; }
const CHECK_KEYS = ["혈압", "공복혈당", "당화혈색소", "콜레스테롤", "중성지방", "간수치", "신장기능", "요산", "체질량지수", "빈혈", "갑상선기능", "골밀도", "암검진"];

// 개별 회원 생성 — fixed: {age, sex, sido, name, rel, hid, income}
function _genMember(idx, f) {
  const rng = _mul32(0x2545F491 + idx * 40503);
  const { age, sex, sido, name, rel, hid, income } = f;
  const deptKey = _wpick(rng, _deptWeights(age, sex));
  const pool = _eligibleDz(_DEPT_DZ[deptKey] || ["이상지질혈증"], sex, age);
  const pBase = age < 12 ? 0.10 : age < 20 ? 0.24 : age < 35 ? 0.40 : age < 55 ? 0.72 : age < 70 ? 0.92 : 0.98;
  const diseases = [];
  if (pool.length && rng() < pBase) {
    const n = 1 + (rng() < (age > 60 ? 0.6 : 0.28) ? 1 : 0) + (rng() < (age > 70 ? 0.34 : 0.08) ? 1 : 0);
    const sh = [...pool].sort(() => rng() - 0.5);
    for (let j = 0; j < Math.min(n, sh.length); j++) diseases.push(sh[j]);
  }
  const marks = {}; let worst = 0, abn = 0;
  const dzMarks = new Set(diseases.map((d) => _DZ_MARK[d]).filter(Boolean));
  for (const key of CHECK_KEYS) {
    if ((key === "골밀도" || key === "암검진") && age < 30 && !dzMarks.has(key)) continue; // 청년 부적합 지표 억제
    let gi = 0;
    const ageBump = age > 65 ? 0.28 : age > 50 ? 0.18 : age > 30 ? 0.09 : 0.03;
    if (dzMarks.has(key)) gi = 2 + (rng() < 0.4 ? 1 : 0);
    else if (rng() < ageBump) gi = 1 + (rng() < 0.35 ? 1 : 0);
    if (gi > 0) { marks[key] = gi; abn++; if (gi > worst) worst = gi; }
  }
  const adult = age >= 19;
  const smoker = adult && (sex === "남" ? rng() < 0.32 : rng() < 0.07);
  const drinker = adult && rng() < (sex === "남" ? 0.45 : 0.22);
  const exercise = Math.floor(rng() * 4);
  let risk = 1 + Math.min(2, diseases.length) + (worst >= 3 ? 2 : worst === 2 ? 1 : 0) + (smoker ? 1 : 0) + (age > 70 ? 1 : 0) - (exercise >= 2 ? 1 : 0);
  risk = Math.max(1, Math.min(5, risk));
  const bioDelta = Math.round(((risk - 2.5) * 3.2 + (smoker ? 2.5 : 0) - (exercise >= 2 ? 1.8 : 0) + (rng() - 0.5) * 3) * 10) / 10;
  const bioAge = Math.max(5, Math.round((age + bioDelta) * 10) / 10);
  const cancer = diseases.some((d) => /암$/.test(d));
  let cost = 180000 + risk * 460000 + diseases.length * 600000 + Math.max(0, age - 45) * 12000 + (cancer ? 6800000 : 0) + worst * 230000 + (age < 12 ? 90000 : 0);
  cost = Math.round(cost * (0.9 + rng() * 0.3) / 10000) * 10000;
  const need = new Set();
  diseases.forEach((d) => (typeof DISEASE_INSURANCE !== "undefined" && DISEASE_INSURANCE[d] || []).forEach((x) => need.add(x)));
  if (!need.size) need.add("실손보험");
  const coverages = [...need];
  const heldN = Math.round(coverages.length * (0.55 + rng() * 0.45));
  const gap = coverages.slice(heldN);
  const needy = (income === "저" && (cost > 2500000 || cancer || risk >= 4) && rng() < 0.72);
  return {
    id: "P" + String(idx + 1).padStart(5, "0"), name, sex, age, sido, hid, rel, deptKey, deptLabel: _deptLabel(deptKey),
    diseases, dzCount: diseases.length, marks, worst, abnormalCount: abn,
    risk, riskLabel: RISK_LABELS[risk], riskColor: RISK_COLORS[risk],
    bioAge, bioDelta, estCost: cost, coverages, gap, hasGap: gap.length > 0,
    income, needy, smoker, drinker, exercise, cancer,
  };
}

// 가구(가족) 단위로 target명 생성
function _genCohort(target) {
  const out = []; let hh = 0, mi = 0;
  while (out.length < target) {
    hh++; const hid = "H" + String(hh).padStart(5, "0");
    const rng = _mul32(0x51ED0000 + hh * 2654435761);
    const type = _wpick(rng, [["single", 15], ["couple", 13], ["nuclear", 38], ["threegen", 10], ["singleparent", 12], ["elder", 12]]);
    const sido = _wpick(rng, _SIDO);
    const income = _wpick(rng, [["저", 22], ["중", 56], ["고", 22]]);
    const surA = _pick(rng, _SURN); let surB = _pick(rng, _SURN); if (surB === surA) surB = _pick(rng, _SURN); // 부/모(배우자) 성
    const nm = (sex, sur) => sur + _pick(rng, sex === "남" ? _GIVN_M : _GIVN_F);
    const mem = []; // {age,sex,rel,name}
    const addHeadSpouse = (loA, hiA, spread) => {
      const a = _ri(loA + rng() * (hiA - loA)); const hSex = rng() < 0.5 ? "남" : "여";
      const hSur = hSex === "남" ? surA : surB; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSur) });
      const sSex = hSex === "남" ? "여" : "남"; const sa = Math.max(23, _ri(a + (rng() - 0.5) * spread));
      const sSur = hSex === "남" ? surB : surA; mem.push({ age: sa, sex: sSex, rel: "배우자", name: nm(sSex, sSur) });
      return Math.max(a, sa);
    };
    const addKids = (parentAge, maxN, minGap, gapSpan) => {
      const nc = 1 + Math.floor(rng() * maxN);
      for (let c = 0; c < nc; c++) { const ca = Math.max(0, _ri(parentAge - (minGap + rng() * gapSpan))); const kSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: ca, sex: kSex, rel: "자녀", name: nm(kSex, surA) }); }
    };
    if (type === "single") { const sex = rng() < 0.5 ? "남" : "여"; const a = _ri(24 + rng() * 46); mem.push({ age: a, sex, rel: "가구주", name: nm(sex, sex === "남" ? surA : surB) }); }
    else if (type === "elder") { const a = _ri(66 + rng() * 22); const hSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSex === "남" ? surA : surB) }); const sSex = hSex === "남" ? "여" : "남"; mem.push({ age: Math.max(62, _ri(a + (rng() - 0.5) * 6)), sex: sSex, rel: "배우자", name: nm(sSex, hSex === "남" ? surB : surA) }); }
    else if (type === "couple") { addHeadSpouse(30, 64, 8); }
    else if (type === "singleparent") { const a = _ri(38 + rng() * 20); const hSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSex === "남" ? surA : surB) }); addKids(a, 2, 22, 18); }
    else if (type === "nuclear") { const p = addHeadSpouse(34, 56, 8); addKids(p, 3, 23, 16); }
    else { const p = addHeadSpouse(40, 56, 7); addKids(p, 2, 24, 12); const gpBase = p + 24 + rng() * 8; mem.push({ age: Math.min(96, _ri(gpBase)), sex: "여", rel: "모", name: nm("여", surB) }); if (rng() < 0.4) mem.push({ age: Math.min(98, _ri(gpBase + 2)), sex: "남", rel: "부", name: nm("남", surA) }); }
    for (const mm of mem) { if (out.length >= target) break; out.push(_genMember(mi++, { ...mm, sido, hid, income })); }
  }
  return out;
}

const PILOT_N = 10000;
let _cohort = null;
function pilotCohort() { if (!_cohort) _cohort = _genCohort(PILOT_N); return _cohort; }
let _house = null;
function pilotHouseholds() { if (_house) return _house; const map = {}; for (const m of pilotCohort()) (map[m.hid] || (map[m.hid] = [])).push(m); for (const k in map) map[k].sort((a, b) => (REL_ORDER[a.rel] - REL_ORDER[b.rel]) || (b.age - a.age)); _house = map; return map; }
function pilotFamily(hid) { return pilotHouseholds()[hid] || []; }

let _cohortAgg = null;
function pilotAgg() {
  if (_cohortAgg) return _cohortAgg;
  const c = pilotCohort(); const hh = pilotHouseholds();
  const byDept = {}, byDisease = {}, byRisk = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, bySidoSex = {}, ageBands = { "0~19": 0, "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대": 0, "70대+": 0 }, byRel = {};
  const markAbn = {}; let totalCost = 0, needyN = 0, needyCost = 0, gapN = 0, dzMembers = 0;
  for (const m of c) {
    byDept[m.deptKey] = (byDept[m.deptKey] || 0) + 1;
    m.diseases.forEach((d) => (byDisease[d] = (byDisease[d] || 0) + 1));
    byRisk[m.risk]++; byRel[m.rel] = (byRel[m.rel] || 0) + 1;
    const band = m.age < 20 ? "0~19" : m.age < 30 ? "20대" : m.age < 40 ? "30대" : m.age < 50 ? "40대" : m.age < 60 ? "50대" : m.age < 70 ? "60대" : "70대+";
    ageBands[band]++;
    bySidoSex[m.sido + "|" + m.sex] = (bySidoSex[m.sido + "|" + m.sex] || 0) + 1;
    Object.keys(m.marks).forEach((k) => { if (m.marks[k] >= 2) markAbn[k] = (markAbn[k] || 0) + 1; });
    totalCost += m.estCost; if (m.needy) { needyN++; needyCost += m.estCost; } if (m.hasGap) gapN++; if (m.dzCount) dzMembers++;
  }
  _cohortAgg = { n: c.length, households: Object.keys(hh).length, byDept, byDisease, byRisk, bySidoSex, ageBands, byRel, markAbn, totalCost, needyN, needyCost, gapN, dzMembers, avgAge: Math.round(c.reduce((s, m) => s + m.age, 0) / c.length), avgCost: Math.round(totalCost / c.length), avgHouseholdSize: Math.round(c.length / Object.keys(hh).length * 10) / 10 };
  return _cohortAgg;
}

// 정합성 검증 — 성별/연령/가족 위반 스캔(목표: 0건)
let _audit = null;
function pilotAudit() {
  if (_audit) return _audit;
  const c = pilotCohort(); const hh = pilotHouseholds();
  const femOnly = new Set(["유방암", "자궁경부암", "갱년기장애"]), maleOnly = new Set(["전립선암", "전립선비대증"]);
  let sex = 0, age = 0, fam = 0;
  for (const m of c) {
    if (m.deptKey === "obgy" && m.sex === "남") sex++;
    for (const dz of m.diseases) {
      if (femOnly.has(dz) && m.sex !== "여") sex++;
      if (maleOnly.has(dz) && m.sex !== "남") sex++;
      const r = _DZ_RULES[dz];
      if (r) { if (r.min && m.age < r.min) age++; if (r.max && m.age > r.max) age++; }
      if (dz === "골다공증" && ((m.sex === "남" && m.age < 60) || (m.sex === "여" && m.age < 45))) age++;
    }
  }
  for (const k in hh) {
    const ms = hh[k]; const par = ms.filter((x) => x.rel === "가구주" || x.rel === "배우자");
    const sps = ms.filter((x) => x.rel === "배우자");
    if (sps.length && par.length === 2 && par[0].sex === par[1].sex) fam++;
    const minPar = par.length ? Math.min(...par.map((x) => x.age)) : 0;
    const maxPar = par.length ? Math.max(...par.map((x) => x.age)) : 0;
    ms.filter((x) => x.rel === "자녀").forEach((kid) => { if (minPar - kid.age < 16) fam++; });
    ms.filter((x) => x.rel === "부" || x.rel === "모").forEach((gp) => { if (gp.age - maxPar < 16) fam++; });
  }
  _audit = { n: c.length, households: Object.keys(hh).length, sex, age, fam, total: sex + age + fam, ok: (sex + age + fam) === 0 };
  return _audit;
}
