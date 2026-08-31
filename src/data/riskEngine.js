/* ══════════════ M2 — RiskPredictor · CoverageMatcher · UnderwritingGateway · LadderPlan ══════════════
   축2 두뇌: "나이·고지"가 아니라 현재 건강상태(금고 실검진값 M1-1)+추세가 위험·요율·인수를 결정.
   - 예측은 질병군(KCD) 단위 확률 + 코호트 동연령·성별 백분위("같은 40대 남성 중 상위 N%") — 초개인화 대비 표현.
   - 백테스트(riskBacktest)로 구분력·캘리브레이션을 실측 — "그럴듯한 점수"가 아니라 측정된 모델임을 증명.
   - 가드레일 ⓔ 의료행위 경계(위험 정보이지 진단 아님) · ⓕ 포용 전용(할인·문호 개방 방향만) · 모집은 GA 경유. */

/* 질병군 정의 — 지표 가중치(왜 이 위험인지 근거 추적 가능) */
const RISK_GROUPS = [
  { code: "E11", ko: "당뇨병", keys: { glucose: 2.2, hba1c: 2.6, bmi: 0.6 }, dz: /당뇨/, base: -3.4, cat: "심장" },
  { code: "I10", ko: "고혈압", keys: { sbp: 2.4, dbp: 1.8, bmi: 0.5 }, dz: /고혈압/, base: -3.0, cat: "뇌" },
  { code: "E78", ko: "이상지질혈증", keys: { ldl: 1.8, tchol: 1.2, tg: 1.6, hdl: 1.0 }, dz: /지질|고지혈/, base: -3.0, cat: "심장" },
  { code: "K76", ko: "간질환", keys: { ast: 1.6, alt: 1.8, ggt: 1.6 }, dz: /간|지방간/, base: -3.2, cat: "간" },
  { code: "N18", ko: "만성콩팥병", keys: { cr: 2.0, egfr: 2.2, uprot: 1.4 }, dz: /콩팥|신장|신부전/, base: -3.8, cat: "신장" },
  { code: "I25", ko: "허혈심장질환", keys: { sbp: 1.2, ldl: 1.4, tg: 1.0, glucose: 0.8 }, dz: /심근|협심|심혈관/, base: -3.9, cat: "심장" },
];
function _rkSig(x) { return 1 / (1 + Math.exp(-x)); }
/* 값 맵에서 그룹 점수(선형부) — _lbSev(정상범위 편차 0~3) 재사용 */
function _rkScore(map, g, age) {
  let s = g.base + Math.max(0, age - 40) * 0.03;
  const basis = [];
  Object.entries(g.keys).forEach(([k, w]) => {
    if (map[k] == null) return;
    const r = (typeof _lbSev === "function") ? _lbSev(k, map[k]) : { sev: 0 };
    if (r.sev > 0) { s += w * (r.sev / 3); const spec = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC[k] : null; basis.push({ k, ko: spec ? spec.ko : k, value: map[k], sev: r.sev, w }); }
  });
  return { s, basis: basis.sort((a, b) => b.sev * b.w - a.sev * a.w) };
}
/* 코호트 동연령대·성별 분포(결정론 표본 400명) — 백분위 산출용 캐시 */
const _rkPctCache = new Map();
function _rkBandDist(gKey, band, sex) {
  const ck = gKey + "|" + band + "|" + sex;
  if (_rkPctCache.has(ck)) return _rkPctCache.get(ck);
  const g = RISK_GROUPS.find((x) => x.code === gKey);
  const c = (typeof pilotCohort === "function") ? pilotCohort() : [];
  const scores = [];
  for (let i = 0; i < c.length && scores.length < 400; i += 37) {   // 결정론 스트라이드 표본
    const m = c[i]; if (!m) break;
    const b = m.age < 30 ? "20" : m.age < 40 ? "30" : m.age < 50 ? "40" : m.age < 60 ? "50" : m.age < 70 ? "60" : "70";
    if (b !== band || m.sex !== sex || m.age < 19) continue;
    const vals = (typeof synthCheckupValues === "function") ? synthCheckupValues(m) : {};
    scores.push(_rkScore(vals, g, m.age).s);
  }
  scores.sort((a, b) => a - b);
  _rkPctCache.set(ck, scores);
  return scores;
}
/* ── 위험 예측(회원) — 확률+백분위+근거+추세 ── */
function riskPredict(m) {
  const ck = (typeof vaultCheckupMap === "function") ? vaultCheckupMap(m) : null;
  if (!ck) return { ok: false, reason: "검진 데이터가 아직 없어요 — 검진결과를 연결하면 질병별 위험을 예측해 드려요" };
  // 추세: 이전 검진 대비 지표별 개선/악화(3% 임계)
  let prevMap = null;
  try { const v = vaultLoad(anonToken(m)); const cks = (v.checkups || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))); if (cks.length >= 2) { prevMap = {}; (cks[cks.length - 2].items || []).forEach((it) => { const n = Number(it.value); if (!isNaN(n)) prevMap[it.key] = n; }); } } catch (e) {}
  const age = (typeof demoRegAge === "function") ? demoRegAge(m) : (m.regAge || m.age || 45);
  const band = age < 30 ? "20" : age < 40 ? "30" : age < 50 ? "40" : age < 60 ? "50" : age < 70 ? "60" : "70";
  const sex = m.sex || "남";
  const out = RISK_GROUPS.map((g) => {
    const r = _rkScore(ck.map, g, age);
    let trend = "유지", tAdj = 0;
    if (prevMap) {
      let worse = 0, better = 0;
      Object.keys(g.keys).forEach((k) => { if (prevMap[k] == null || ck.map[k] == null) return; const d = Number(ck.map[k]) - prevMap[k]; const thr = Math.max(1, prevMap[k] * 0.03); if (k === "hdl" || k === "egfr") { if (d >= thr) better++; else if (-d >= thr) worse++; } else { if (d >= thr) worse++; else if (-d >= thr) better++; } });
      if (worse > better) { trend = "악화 추세"; tAdj = 0.35; } else if (better > worse) { trend = "개선 추세"; tAdj = -0.35; }
    }
    const s = r.s + tAdj;
    const prob = Math.round(_rkSig(s) * 1000) / 10;
    const dist = _rkBandDist(g.code, band, sex);
    let pct = 50;
    if (dist.length > 10) { let lo = 0; while (lo < dist.length && dist[lo] < s) lo++; pct = Math.round((1 - lo / dist.length) * 100); }   // 상위 N%
    return { code: g.code, ko: g.ko, prob, topPct: Math.max(1, Math.min(99, pct)), trend, basis: r.basis.slice(0, 3), cat: g.cat };
  }).sort((a, b) => b.prob - a.prob);
  return { ok: true, band: band + "대", sex, date: ck.date, risks: out,
    honesty: "※ 위험 정보이지 의료 진단이 아니에요 — 합성 코호트 대비 통계 모델(백테스트 수치 공개)이며, 이상 신호는 의료기관 상담을 권해요." };
}
/* ── 백테스트 — 코호트 라벨(유병)로 구분력(AUC 근사)·캘리브레이션 측정 ── */
function riskBacktest(sampleN) {
  sampleN = sampleN || 4000;
  const c = (typeof pilotCohort === "function") ? pilotCohort() : [];
  const res = {};
  RISK_GROUPS.forEach((g) => {
    const pos = [], neg = [];
    for (let i = 0; i < c.length && (pos.length + neg.length) < sampleN; i += 23) {
      const m = c[i]; if (!m || m.age < 19) continue;
      const vals = synthCheckupValues(m);
      const p = _rkSig(_rkScore(vals, g, m.age).s);
      ((m.diseases || []).some((d) => g.dz.test(d)) ? pos : neg).push(p);
    }
    // AUC 근사(Mann-Whitney): P(양성점수>음성점수)
    let win = 0, n = 0;
    for (let a = 0; a < Math.min(pos.length, 300); a++) for (let b = 0; b < Math.min(neg.length, 300); b++) { n++; if (pos[a] > neg[b]) win++; else if (pos[a] === neg[b]) win += 0.5; }
    const auc = n ? Math.round(win / n * 1000) / 1000 : null;
    // 캘리브레이션: 예측 5분위별 [평균 예측확률 vs 실제 유병률]
    const all = pos.map((p) => [p, 1]).concat(neg.map((p) => [p, 0])).sort((x, y) => x[0] - y[0]);
    const cal = [];
    for (let q = 0; q < 5; q++) { const seg = all.slice(Math.floor(all.length * q / 5), Math.floor(all.length * (q + 1) / 5)); if (!seg.length) continue; cal.push({ predicted: Math.round(seg.reduce((s, x) => s + x[0], 0) / seg.length * 1000) / 10, actual: Math.round(seg.reduce((s, x) => s + x[1], 0) / seg.length * 1000) / 10 }); }
    res[g.code] = { ko: g.ko, n: pos.length + neg.length, prevalence: Math.round(pos.length / (pos.length + neg.length) * 1000) / 10, auc, calibration: cal };
  });
  try { console.log("[riskBacktest]", JSON.stringify(res)); } catch (e) {}
  return res;
}
try { window.__hifinRiskBacktest = riskBacktest; } catch (e) {}
/* ── CoverageMatcher — 위험 상위 질병군별 [필요 보장 vs 보유 보장] 갭 + 추천 근거 문장 ── */
function coverageMatch(m) {
  const rp = riskPredict(m); if (!rp.ok) return rp;
  let held = [];
  try { const v = vaultLoad(anonToken(m)); held = (v.insurance || []); } catch (e) {}
  const CAT_NEED = { "심장": 20000000, "뇌": 20000000, "간": 15000000, "신장": 15000000 };   // 필요 보장 기준: 코호트 뇌·심장 진단비 평균(INS_TARGETS.bhBenefitMean) 계열 — 데이터셋 명세 근거
  const rows = rp.risks.slice(0, 3).map((r) => {
    const need = CAT_NEED[r.cat] || 10000000;
    const have = held.filter((c) => (c.kind === "암" && r.cat === "암") || new RegExp(r.cat).test(c.product || "")).reduce((s, c) => s + (c.benefit || 0), 0);
    return { code: r.code, ko: r.ko, topPct: r.topPct, need, have, gap: Math.max(0, need - have),
      why: `같은 ${rp.band} ${rp.sex}성 중 위험 상위 ${r.topPct}% (${r.basis.map((b) => b.ko + " " + b.value).join("·") || "지표 추세"}) — 필요 보장 ${need.toLocaleString()}원 대비 보유 ${have.toLocaleString()}원` };
  });
  return { ok: true, rows, band: rp.band, sex: rp.sex };
}
/* ── UnderwritingGateway — 고지 자동 구성·인수 예측·유병자 할인·포용 경로(실청약은 GA 경유) ── */
function underwrite(m, productKo) {
  const rp = riskPredict(m); if (!rp.ok) return rp;
  const disclosures = [];
  try { (m.diseases || m.highRiskDiseases || []).forEach((d) => disclosures.push({ item: d, src: "회원 질환 이력(금고)" })); } catch (e) {}
  rp.risks.forEach((r) => { if (r.basis.length && r.prob >= 25) disclosures.push({ item: r.ko + " 관련 지표 이상(" + r.basis.map((b) => b.ko).join("·") + ")", src: "검진 실측(자동 구성)" }); });
  const top = rp.risks[0];
  const sick = disclosures.some((d) => d.src.indexOf("이력") >= 0);
  let decision, note, conditions = [];
  if (top && top.prob >= 55 && top.trend === "악화 추세") {
    decision = "조건부(포용 경로)";
    conditions = top.basis.map((b) => `${b.ko} 정상범위 회복`);
    note = `지금은 인수가 어려운 구간이지만 거절로 끝나지 않아요 — ${conditions.join("·")} 시 재심사로 가입 경로가 열려요(가입불가자 포용 스코어).`;
  } else if (sick && top && top.trend !== "악화 추세" && top.prob < 45) {
    decision = "유병자 관리자 요율(할인 방향)";
    note = "유병 이력이 있어도 현재 지표가 관리되고 있어요 — 일괄 할증 대신 관리자 요율(할인 방향)로 산출돼요. ※ 실제 적용은 제휴 보험사 계리 검증 전제.";
  } else if (top && top.prob >= 40) { decision = "할증 예상"; note = "일부 지표 이상으로 표준체 대비 할증이 예상돼요 — 지표가 개선되면 재산정으로 내릴 수 있어요."; }
  else { decision = "표준체 예상"; note = "현재 건강상태 기준 표준체 인수가 예상돼요."; }
  return { ok: true, product: productKo || "치료비 준비 진단", decision, note, conditions, disclosures: disclosures.slice(0, 5),
    ga: "실제 청약·인수는 GA 라이선스 채널(글로벌예방금융㈜·GA코리아)과 보험사 심사로 확정돼요 — 여기서는 시뮬레이션이에요." };
}
/* ── 보장 사다리 자동 플랜(M3 고도화) — 월 적립 목표·진행률·달성 예상일 ── */
function ladderPlan(m) {
  const bal = (typeof tlBalance === "function") ? tlBalance(m) : 0;
  const reserve = (typeof htkInsReserve === "function") ? htkInsReserve(bal) : Math.floor(bal * 0.3);
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  // 목표: 실손 첫 3개월 보험료(코호트 개인 실손료 또는 4세대 기준) — 사유: 최소 유지 가능성 확보 후 가입 권장
  let monthly = 13000;
  try { if (m.cohortIndex && typeof cohortInsurance === "function") { const r = cohortInsurance(m.cohortIndex); if (r) monthly = r.silson ? r.silson.monthly : Math.round(13000 * (0.55 + (m.age || 45) / 55) / 100) * 100; } } catch (e) {}
  const goalWon = monthly * 3, goalHtk = Math.ceil(goalWon / rate);
  const progress = Math.min(100, Math.round(reserve / goalHtk * 100));
  // 월 적립 추정: 원장 earn/topup 최근 합 ÷ 경과월(최소 1) — 결정론(원장 파생)
  let monthlyEarn = 0;
  try { const l = (typeof tlAll === "function") ? tlAll(m) : []; const earns = l.filter((t) => t.type === "earn" || t.type === "topup"); if (earns.length) { const span = Math.max(1, (Date.now() - earns[0].ts) / (30 * 86400000)); monthlyEarn = Math.round(earns.reduce((s, t) => s + t.amount, 0) / span); } } catch (e) {}
  const remainHtk = Math.max(0, goalHtk - reserve);
  const etaMonths = monthlyEarn > 0 ? Math.ceil(remainHtk / monthlyEarn) : null;
  return { monthly, goalWon, goalHtk, reserve, progress, monthlyEarn, etaMonths,
    note: progress >= 100 ? "목표 적립 달성 — 실손 가입(GA 채널)을 진행하고, 다음 사다리(치료비 준비 진단 적립)로 넘어가요!" : `실손 첫 3개월 보험료(${goalWon.toLocaleString()}원)를 목표로 적립 중 — ${etaMonths != null ? `이 속도면 약 ${etaMonths}개월 후 달성 예상` : "적립 활동을 시작하면 달성 예상일을 보여드려요"}.` };
}
