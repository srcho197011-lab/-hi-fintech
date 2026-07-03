/* ====================== 파일럿 체험회원 1,000명 · 온톨로지 코호트 ======================
   결정적(mulberry32 시드) 생성기 — 매 로드 동일 데이터(재현 가능).
   실제 진료과목(DEPT_CATS)·검진 온톨로지(CHECKUP_ONTOLOGY)·질병↔보험 매핑(DISEASE_INSURANCE)을
   재사용하여 인구(연령·성별·지역)·진료과목별 질병진단·건강검진 수치·위험등급·예상 의료비·
   필요 보장·치료비 사각지대(나눔) 대상을 1,000명 규모로 생성한다. (시연용 합성 데이터) */

function _mul32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function _pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function _wpick(rng, pairs) { const tot = pairs.reduce((s, p) => s + p[1], 0); let r = rng() * tot; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[0][0]; }
function _round(n, u) { return Math.round(n / u) * u; }

const _SURN = "김이박최정강조윤장임한오서신권황안송전홍고문양손배백허유남심노정하곽성".split("");
const _GIVN_M = ["민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "준우", "현우", "건우", "우진", "선우", "서진", "정우", "승현", "유준", "은우", "지훈", "준서", "도현", "현준", "성민", "재윤", "동현", "태윤", "민재", "형준", "지환", "찬호", "영수", "종석", "상철", "광호", "덕수"];
const _GIVN_F = ["서연", "서윤", "지우", "서현", "하은", "하윤", "민서", "지유", "윤서", "채원", "수아", "지아", "은서", "다은", "예은", "수빈", "소율", "예린", "유나", "채은", "지안", "하린", "서아", "가은", "윤아", "연서", "예원", "미영", "정숙", "영자", "순자", "경희", "은주", "혜정", "명숙"];
const _SIDO = [["서울", 18], ["경기", 22], ["인천", 6], ["부산", 7], ["대구", 5], ["대전", 3], ["광주", 3], ["울산", 2], ["세종", 1], ["강원", 3], ["충북", 3], ["충남", 4], ["전북", 3], ["전남", 3], ["경북", 5], ["경남", 5], ["제주", 2]];

// 진료과목(DEPT_CATS key) → 주요 질병 풀
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
// 질병 → 관련 검진 온톨로지 key (수치 이상 연동)
const _DZ_MARK = {
  "고혈압": "혈압", "심혈관질환": "혈압", "협심증": "콜레스테롤", "심근경색": "콜레스테롤",
  "당뇨병": "공복혈당", "당뇨망막병증": "공복혈당", "이상지질혈증": "콜레스테롤",
  "지방간": "간수치", "간경변": "간수치", "만성콩팥병": "신장기능", "신부전": "신장기능",
  "비만": "체질량지수", "소아비만": "체질량지수", "통풍": "요산", "요로결석": "요산",
  "골다공증": "골밀도", "골절": "골밀도", "갑상선기능저하증": "갑상선기능", "갑상선결절": "갑상선기능",
  "위암": "암검진", "대장암": "암검진", "간암": "암검진", "폐암": "암검진", "유방암": "암검진",
  "자궁경부암": "암검진", "전립선암": "암검진",
};
// 연령대별 진료과목 가중치(대략적 임상 경향)
function _deptWeights(age) {
  if (age < 18) return [["ped", 40], ["derma", 12], ["ent", 12], ["ophtha", 8], ["dental", 12], ["ortho", 8], ["psych", 8]];
  if (age < 40) return [["fm", 14], ["gastro", 12], ["derma", 12], ["obgy", 10], ["psych", 12], ["ent", 10], ["ortho", 10], ["ophtha", 6], ["endo", 6], ["dental", 8]];
  if (age < 60) return [["fm", 12], ["cardio", 12], ["endo", 12], ["gastro", 12], ["ortho", 10], ["obgy", 8], ["uro", 6], ["neuro", 6], ["psych", 8], ["ophtha", 6], ["kmed", 6], ["nephro", 4]];
  return [["cardio", 14], ["endo", 12], ["neuro", 12], ["ortho", 12], ["gastro", 10], ["nephro", 8], ["ophtha", 8], ["uro", 8], ["pulmo", 6], ["kmed", 6], ["fm", 4]];
}
const RISK_LABELS = ["", "낮음", "보통", "주의", "높음", "매우 높음"];
const RISK_COLORS = ["", "#16A34A", "#0EA5E9", "#F59E0B", "#EF4444", "#B91C1C"];

function _deptLabel(k) {
  if (typeof DEPT_CATS !== "undefined") { const d = DEPT_CATS.find((x) => x.key === k); if (d) return d.label; }
  return k;
}
function _markLabel(key, gi) {
  if (typeof CHECKUP_ONTOLOGY !== "undefined") { const o = CHECKUP_ONTOLOGY.find((x) => x.key === key); if (o) return o.grades[gi][0]; }
  return ["정상", "주의", "위험", "고위험"][gi];
}
const CHECK_KEYS = ["혈압", "공복혈당", "당화혈색소", "콜레스테롤", "중성지방", "간수치", "신장기능", "요산", "체질량지수", "빈혈", "갑상선기능", "골밀도", "암검진"];

function _genOne(i) {
  const rng = _mul32(0x9E37 + i * 2654435761);
  const sex = rng() < 0.5 ? "남" : "여";
  const age = _round(20 + Math.floor(Math.pow(rng(), 0.72) * 66), 1); // 20~85, 중고령 편중
  const sido = _wpick(rng, _SIDO);
  const name = _pick(rng, _SURN) + _pick(rng, sex === "남" ? _GIVN_M : _GIVN_F);
  const deptKey = _wpick(rng, _deptWeights(age));
  // 질병 진단 (연령↑ 유병↑)
  const pool = _DEPT_DZ[deptKey] || ["이상지질혈증"];
  const pBase = age < 35 ? 0.35 : age < 55 ? 0.72 : age < 70 ? 0.92 : 0.98;
  const diseases = [];
  if (rng() < pBase) {
    const n = 1 + (rng() < (age > 60 ? 0.6 : 0.3) ? 1 : 0) + (rng() < (age > 70 ? 0.35 : 0.1) ? 1 : 0);
    const shuffled = [...pool].sort(() => rng() - 0.5);
    for (let j = 0; j < Math.min(n, shuffled.length); j++) diseases.push(shuffled[j]);
  }
  // 검진 수치 등급 (질병 연동 + 연령·생활)
  const marks = {}; let worst = 0, abn = 0;
  const dzMarks = new Set(diseases.map((d) => _DZ_MARK[d]).filter(Boolean));
  for (const key of CHECK_KEYS) {
    let gi = 0;
    const ageBump = age > 65 ? 0.28 : age > 50 ? 0.18 : 0.08;
    if (dzMarks.has(key)) gi = 2 + (rng() < 0.4 ? 1 : 0);
    else if (rng() < ageBump) gi = 1 + (rng() < 0.35 ? 1 : 0);
    if (gi > 0) { marks[key] = gi; abn++; if (gi > worst) worst = gi; }
  }
  // 생활습관
  const smoker = sex === "남" ? rng() < 0.32 : rng() < 0.07;
  const drinker = rng() < (sex === "남" ? 0.45 : 0.22);
  const exercise = Math.floor(rng() * 4); // 0~3 (주 운동일수 구간)
  // 위험등급 1~5
  let risk = 1 + Math.min(2, diseases.length) + (worst >= 3 ? 2 : worst === 2 ? 1 : 0) + (smoker ? 1 : 0) + (age > 70 ? 1 : 0) - (exercise >= 2 ? 1 : 0);
  risk = Math.max(1, Math.min(5, risk));
  const bioDelta = _round((risk - 2.5) * 3.2 + (smoker ? 2.5 : 0) - (exercise >= 2 ? 1.8 : 0) + (rng() - 0.5) * 3, 0.1);
  const bioAge = Math.max(18, _round(age + bioDelta, 0.1));
  // 예상 연간 의료비(원): 기저 + 위험·질병·연령 가중
  const cancer = diseases.some((d) => /암$/.test(d));
  let cost = 220000 + risk * 480000 + diseases.length * 620000 + Math.max(0, age - 45) * 12000 + (cancer ? 6800000 : 0) + worst * 240000;
  cost = _round(cost * (0.9 + rng() * 0.3), 10000);
  // 필요 보장 (질병↔보험) & 보장 공백
  const need = new Set();
  diseases.forEach((d) => (typeof DISEASE_INSURANCE !== "undefined" && DISEASE_INSURANCE[d] || []).forEach((x) => need.add(x)));
  if (!need.size) need.add("실손보험");
  const coverages = [...need];
  const heldN = Math.round(coverages.length * (0.55 + rng() * 0.45)); // 보유율 55~100%
  const gap = coverages.slice(heldN); // 미보유(공백) 가정
  // 소득·치료비 사각지대(나눔) 대상
  const income = _wpick(rng, [["저", 22], ["중", 56], ["고", 22]]);
  const needy = (income === "저" && (cost > 2500000 || cancer || risk >= 4) && rng() < 0.72);
  return {
    id: "P" + String(i + 1).padStart(4, "0"), name, sex, age, sido, deptKey, deptLabel: _deptLabel(deptKey),
    diseases, dzCount: diseases.length, marks, worst, worstLabel: worst ? _markLabel([...CHECK_KEYS].find((k) => marks[k] === worst), worst) : "정상", abnormalCount: abn,
    risk, riskLabel: RISK_LABELS[risk], riskColor: RISK_COLORS[risk],
    bioAge, bioDelta, estCost: cost, coverages, gap, hasGap: gap.length > 0,
    income, needy, smoker, drinker, exercise, cancer,
  };
}

let _cohort = null;
function pilotCohort() {
  if (_cohort) return _cohort;
  const arr = [];
  for (let i = 0; i < 1000; i++) arr.push(_genOne(i));
  _cohort = arr;
  return arr;
}

// 코호트 집계(온톨로지 뷰용) — 1회 계산 캐시
let _cohortAgg = null;
function pilotAgg() {
  if (_cohortAgg) return _cohortAgg;
  const c = pilotCohort();
  const byDept = {}, byDisease = {}, byRisk = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, bySidoSex = {}, ageBands = { "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대": 0, "70대+": 0 };
  const markAbn = {}; let totalCost = 0, needyN = 0, needyCost = 0, gapN = 0, dzMembers = 0;
  for (const m of c) {
    byDept[m.deptKey] = (byDept[m.deptKey] || 0) + 1;
    m.diseases.forEach((d) => (byDisease[d] = (byDisease[d] || 0) + 1));
    byRisk[m.risk]++;
    const band = m.age < 30 ? "20대" : m.age < 40 ? "30대" : m.age < 50 ? "40대" : m.age < 60 ? "50대" : m.age < 70 ? "60대" : "70대+";
    ageBands[band]++;
    const sk = m.sido + "|" + m.sex; bySidoSex[sk] = (bySidoSex[sk] || 0) + 1;
    Object.keys(m.marks).forEach((k) => { if (m.marks[k] >= 2) markAbn[k] = (markAbn[k] || 0) + 1; });
    totalCost += m.estCost; if (m.needy) { needyN++; needyCost += m.estCost; } if (m.hasGap) gapN++; if (m.dzCount) dzMembers++;
  }
  _cohortAgg = { n: c.length, byDept, byDisease, byRisk, bySidoSex, ageBands, markAbn, totalCost, needyN, needyCost, gapN, dzMembers, avgAge: Math.round(c.reduce((s, m) => s + m.age, 0) / c.length), avgCost: Math.round(totalCost / c.length) };
  return _cohortAgg;
}
