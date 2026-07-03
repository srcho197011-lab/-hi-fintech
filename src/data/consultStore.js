/* ====================== 상담 데이터 스토리지 + 분석 엔진 (Palantir Foundry형 닫힌 루프) ======================
   나의 주치의 상담 → 회원별 데이터 스토리지(시간흐름·최신 우선) → 온톨로지 정규화 → 분석 →
   ① 추가검진 ② 진료과목 진료 ③ 영양 ④ 치료기기 ⑤ 건강식단 안내로 연결.
   ⚠️ 시연용 합성 데이터. 결정적 시드로 렌더 간 동일(최근성만 실시간 기준). */

const CONSULT_STORE = {}; // { memberId: [event, ...] } 최신 우선

const _CN_RISK = [["일반 정보", "#16A34A", "#DCFCE7"], ["생활관리 필요", "#2563EB", "#DBEAFE"], ["병원 상담 권장", "#F59E0B", "#FEF3C7"], ["빠른 진료 권장", "#EA580C", "#FFEDD5"], ["응급", "#EF4444", "#FEE2E2"]];

function _cnHash(s) { let h = 0x811c9dc5; s = String(s || ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
function _cnRng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* 회원 프로필 정규화 — 데모 회원(demoMembers) + 파일럿 코호트(pilotCohort) 두 형태 모두 지원 */
function _cnProfile(m) {
  if (!m) return { id: "?", name: "?", diseases: [], cancers: [], mgmt: [], bioAge: 40, regAge: 40, cancerGrade: 3, category: "일반" };
  if (m.highRiskDiseases || m.highRiskCancerTypes || m.managementPoints) { // 데모 회원
    return { id: m.id || m.email, name: m.name, diseases: (m.highRiskDiseases || []).slice(), cancers: (m.highRiskCancerTypes || []).slice(), mgmt: (m.managementPoints || []).slice(), bioAge: m.biologicalAge || m.regAge || 40, regAge: m.regAge || 40, cancerGrade: m.cancerRiskGrade || 3, category: m.category || "일반" };
  }
  const all = m.diseases || []; // 파일럿 코호트 회원
  return { id: m.id || m.name, name: m.name, diseases: all.filter((d) => !/암$/.test(d)), cancers: all.filter((d) => /암$/.test(d)), mgmt: m.marks ? Object.keys(m.marks).slice(0, 3) : [], bioAge: m.bioAge || m.age || 40, regAge: m.age || 40, cancerGrade: m.risk >= 4 ? 7 : m.risk >= 3 ? 5 : 3, category: m.isChild ? "아동" : (m.age >= 65 ? "노인" : (m.sex === "여" ? "여성" : "일반")) };
}

/* 진료과 매핑(질환 키워드 → DEPT_CATS key) */
const _CN_DEPT_MAP = [
  [["고혈압", "혈압", "심부전", "부정맥", "허혈", "심장", "심근경색", "협심", "심혈관"], "cardio"],
  [["당뇨", "혈당", "갑상선", "골다공", "내분비", "대사증후"], "endo"],
  [["위", "대장", "간", "지방간", "간수치", "역류", "소화", "췌장", "담낭"], "gastro"],
  [["천식", "copd", "폐", "호흡", "기침"], "pulmo"],
  [["콩팥", "신장", "신부전", "투석"], "nephro"],
  [["뇌졸중", "뇌혈관", "뇌출혈", "치매", "두통", "인지", "마비", "어지럼증"], "neuro"],
  [["유방", "자궁", "난소", "여성암", "갱년기", "골반", "부인"], "obgy"],
  [["소아", "성장", "아동", "예방접종", "소아비만"], "ped"],
  [["관절", "척추", "골절", "근골격", "허리", "골관절", "디스크"], "ortho"],
  [["아토피", "피부", "여드름", "탈모", "건선"], "derma"],
  [["백내장", "녹내장", "시력", "황반", "안구"], "ophtha"],
  [["비염", "중이염", "이비인후"], "ent"],
  [["전립선", "요로", "배뇨", "요실금", "비뇨"], "uro"],
  [["우울", "불면", "불안", "정신", "스트레스", "마음"], "psych"],
];
function _cnDeptFor(label) {
  const L = String(label);
  for (const [keys, k] of _CN_DEPT_MAP) if (keys.some((w) => L.includes(w) || w.includes(L))) return (typeof DEPT_CATS !== "undefined" ? DEPT_CATS : []).find((d) => d.key === k) || null;
  return (typeof DEPT_CATS !== "undefined" ? DEPT_CATS : []).find((d) => d.key === "fm") || null; // 일반·대사·검진 → 가정의학
}
/* KB 매칭(dz 별칭 ↔ 신호 라벨) */
function _cnKbFind(KB, label) {
  if (!KB) return null; const L = String(label);
  for (let i = 0; i < KB.length; i++) { const e = KB[i]; if ((e.dz || []).some((a) => L.includes(a) || a.includes(L))) return Object.assign({ _k: i }, e); }
  return null;
}
/* 추가검진 도출 */
function _cnCheckupFor(label, m) {
  const SCR = typeof SCREENING_KB !== "undefined" ? SCREENING_KB : {};
  if (SCR[label]) return { key: "scr_" + label, title: label + " 정밀검진", detail: SCR[label], kind: "암·정밀검진" };
  const CO = typeof CHECKUP_ONTOLOGY !== "undefined" ? CHECKUP_ONTOLOGY : [];
  const L = String(label);
  const it = CO.find((c) => (c.diseases || []).some((d) => L.includes(d) || d.includes(L)) || (c.aliases || []).some((a) => L.includes(a) || a.includes(L)));
  if (it) return { key: "co_" + it.key, title: it.key + " 검사", detail: it.explain, grades: it.grades, kind: "질환 추적검사" };
  if (/암$/.test(L)) return { key: "gen_" + L, title: L + " 검진 상담", detail: "위험도 기반으로 전문의 상담 후 맞춤 검진 주기를 정하세요.", kind: "암 검진 상담" };
  return null;
}

/* 증상 문구 */
const _CN_SYMPTOM = { "고혈압": "두통·어지럼·뒷목 뻐근함", "당뇨": "갈증·잦은 소변·피로", "고지혈": "특별한 증상 없이 걱정되는", "지방간": "피로·오른쪽 윗배 불편", "간": "피로·소화불량", "빈혈": "어지럼·창백·숨참", "골다공": "허리·관절 통증", "갱년기": "안면홍조·수면장애", "뇌졸중": "손저림·어지럼·말어눌", "뇌혈관": "두통·어지럼", "치매": "기억력 저하·깜빡임", "심근경색": "가슴 답답·조임", "허혈": "가슴 답답함", "소아비만": "체중 증가·활동량 저하", "아토피": "가려움·피부 건조", "성장": "또래보다 작은 키", "시력": "칠판이 흐릿하게 보이는" };
function _cnSymptom(label) { for (const k in _CN_SYMPTOM) if (String(label).includes(k)) return _CN_SYMPTOM[k]; return "불편한"; }
function _cnRiskIdx(label, p, isCancer) {
  const grade = (p && p.cancerGrade) || 3, bioGap = p ? (p.bioAge - p.regAge) : 0;
  if (isCancer) return grade >= 7 ? 3 : grade >= 5 ? 2 : 2;
  if (/뇌졸중|심근경색|뇌출혈|허혈/.test(String(label))) return 3;
  return bioGap > 5 ? 2 : 1;
}
function _cnQuestion(label, kind) {
  if (kind === "증상질문") return `요즘 ${_cnSymptom(label)} 증상이 있는데 ${label} 때문일까요?`;
  if (kind === "검진문의") return `${label} 관련해서 어떤 검사를 언제 받는 게 좋을까요? 가족력도 있어요.`;
  if (kind === "질환상담") return `${label} 관리 방법과 합병증 예방이 궁금해요.`;
  return `${label} 관리를 위해 생활습관·식단은 어떻게 하면 좋을까요?`;
}
function _cnEvent(p, label, daysAgo, kind, uid) {
  const isCancer = /암$/.test(String(label));
  const ri = _cnRiskIdx(label, p, isCancer);
  const t = Date.now() - daysAgo * 86400000;
  return { id: `cn_${p.id}_${uid}`, t, daysAgo, topic: label, kind, question: _cnQuestion(label, kind), riskIdx: ri, risk: _CN_RISK[ri][0], riskColor: _CN_RISK[ri][1], riskBg: _CN_RISK[ri][2], source: "상담(데모)" };
}

/* 시간흐름 데모 상담 시드(최근일수록 현재 위험조건 반영) */
function consultSeed(m) {
  const p = _cnProfile(m);
  const rng = _cnRng(_cnHash(p.id || p.name));
  const cancers = p.cancers, dzs = p.diseases;
  const ev = []; let uid = 0; const r = (n) => Math.floor(rng() * n);
  if (dzs[0]) ev.push(_cnEvent(p, dzs[0], 1 + r(5), "증상질문", ++uid));
  if (cancers[0]) ev.push(_cnEvent(p, cancers[0], 4 + r(7), "검진문의", ++uid));
  if (dzs[1]) ev.push(_cnEvent(p, dzs[1], 9 + r(9), "질환상담", ++uid));
  if (cancers[1]) ev.push(_cnEvent(p, cancers[1], 16 + r(11), "검진문의", ++uid));
  if (dzs[0]) ev.push(_cnEvent(p, dzs[0], 26 + r(10), "질환상담", ++uid));
  (dzs.length ? dzs.slice(0, 3) : ["건강검진"]).forEach((d, i) => ev.push(_cnEvent(p, d, 40 + i * 14 + r(10), "생활습관", ++uid)));
  ev.push(_cnEvent(p, dzs[0] || cancers[0] || "건강검진", 78 + r(28), "증상질문", ++uid));
  ev.sort((a, b) => b.t - a.t);
  return ev;
}
function consultGet(m) { if (!m) return []; const id = m.id || m.email; if (!CONSULT_STORE[id]) CONSULT_STORE[id] = consultSeed(m); return CONSULT_STORE[id]; }
function consultAdd(m, ev) { if (!m) return; const id = m.id || m.email; if (!CONSULT_STORE[id]) CONSULT_STORE[id] = consultSeed(m); CONSULT_STORE[id].unshift(Object.assign({ t: Date.now(), daysAgo: 0 }, ev)); CONSULT_STORE[id] = CONSULT_STORE[id].slice(0, 60); }

/* 최근성 가중 */
function _cnWeight(daysAgo) { return daysAgo <= 14 ? 3 : daysAgo <= 30 ? 2 : daysAgo <= 60 ? 1.3 : daysAgo <= 120 ? 0.8 : 0.4; }

/* ── 분석 엔진: 상담 스토리지 → 5대 실행 안내 ── */
function analyzeConsults(m) {
  if (!m) return null;
  const events = consultGet(m);
  const sig = {}; // label → {label,score,count,lastDays,isCancer,sources:Set}
  const bump = (label, w, src, isCancer) => { const s = sig[label] || (sig[label] = { label, score: 0, count: 0, lastDays: 999, isCancer: !!isCancer, sources: [] }); s.score += w; if (src === "상담") s.count++; if (!s.sources.includes(src)) s.sources.push(src); };
  events.forEach((e) => bump(e.topic, _cnWeight(e.daysAgo), "상담", /암$/.test(e.topic), e.daysAgo));
  events.forEach((e) => { const s = sig[e.topic]; if (s && e.daysAgo < s.lastDays) s.lastDays = e.daysAgo; });
  const _p = _cnProfile(m);
  _p.diseases.forEach((d) => bump(d, 2.0, "위험도"));
  _p.cancers.forEach((c) => bump(c, 2.6, "위험도", true));
  const signals = Object.values(sig).sort((a, b) => b.score - a.score);
  const reco = { checkup: [], dept: [], nutrition: [], device: [], diet: [] };
  const seen = { checkup: new Set(), dept: new Set(), nutrition: new Set(), device: new Set(), diet: new Set() };
  for (const s of signals) {
    const ck = _cnCheckupFor(s.label, m); if (ck && !seen.checkup.has(ck.key)) { seen.checkup.add(ck.key); reco.checkup.push(Object.assign({ from: s.label, recent: s.lastDays, score: s.score }, ck)); }
    const dp = _cnDeptFor(s.label); if (dp && !seen.dept.has(dp.key)) { seen.dept.add(dp.key); reco.dept.push({ from: s.label, recent: s.lastDays, key: dp.key, label: dp.label, clinic: dp.clinic, tags: dp.tags }); }
    const nu = _cnKbFind(typeof NUTRITION_KB !== "undefined" ? NUTRITION_KB : null, s.label); if (nu && !seen.nutrition.has(nu._k)) { seen.nutrition.add(nu._k); reco.nutrition.push(Object.assign({ from: s.label }, nu)); }
    const dv = _cnKbFind(typeof DEVICE_KB !== "undefined" ? DEVICE_KB : null, s.label); if (dv && !seen.device.has(dv._k)) { seen.device.add(dv._k); reco.device.push(Object.assign({ from: s.label }, dv)); }
    const dt = _cnKbFind(typeof DIET_KB !== "undefined" ? DIET_KB : null, s.label); if (dt && !seen.diet.has(dt._k)) { seen.diet.add(dt._k); reco.diet.push(Object.assign({ from: s.label }, dt)); }
  }
  const groups = ["checkup", "dept", "nutrition", "device", "diet"];
  const coverage = groups.filter((g) => reco[g].length).length;
  const last14 = events.filter((e) => e.daysAgo <= 14).length;
  const total = events.length;
  const recoCount = groups.reduce((n, g) => n + reco[g].length, 0);
  return { member: m, events, signals, reco, stats: { total, last14, coverage, recoCount, topTopic: signals[0] ? signals[0].label : "-" }, maxScore: signals[0] ? signals[0].score : 1 };
}
