/* ══════════════ 니즈·재원 엔진(needsEngine.js) — 프로 운영체계 2단계 v1.4 축⓪ (P1 · 형 승인 2026-08-30) ══════════════
   두 곡선의 물리적 구현: 니즈는 감정이 아니라 금액으로, 부담 소멸은 재원 잔액으로.
   ⚠️ 헌법:
     · §0-A 전 값은 **구간(band)**으로만 — 단정값·"부족" 등 평가어 금지(neGuard가 검사). 판단은 회원이 한다.
     · §0-P 이 값들은 회원 화면에 상시 존재할 뿐 — 프로 대본 어디에도 선발화 갈래가 없다.
     · §0-C 통계는 출처·연도 필수(NE_SRC) — status: 정합(공식 통계 직결) / 관례(업계 관용 근사) / 검수 대기(형·자문 확인 필요).
     · 발명 금지 — 본인부담(calcOutOfPocket)·보유 진단금(memberInsurance)·월 보험료(_silsonMonthly)·HTK(tlBalance) 전부 기존 실재 함수.
     · 조립이지 저장이 아니다 — 호출 시점 결정론, 새 저장 키 없음. */

/* ── 통계 원천표(§0-C 출처·연도 필수) — 값 변경은 형 검수 경유 ── */
const NE_SRC = {
  cancerDur:  { v: 12, unit: "개월", ko: "암 주 치료·요양 기간", src: "보건복지부·중앙암등록본부 국가암등록통계(2022 발표) 기반 관례", status: "검수 대기" },
  cancerQuit: { v: 0.47, unit: "", ko: "암 경험자 직업 중단율", src: "국립암센터 암경험자 직장복귀 연구(2013) — 46.5% 관용 인용", status: "검수 대기" },
  brainDur:   { v: 6, unit: "개월", ko: "뇌혈관질환 치료·재활 기간", src: "심평원 진료 통계 기반 관례", status: "관례" },
  heartDur:   { v: 3, unit: "개월", ko: "심장질환 치료·회복 기간", src: "심평원 진료 통계 기반 관례", status: "관례" },
  chronicDur: { v: 1, unit: "개월", ko: "만성질환 집중 관리기(통원)", src: "통원 중심 — 소득 공백 최소 관례", status: "관례" },
  living:     { v: { "저": 180, "중": 290, "고": 430 }, unit: "만원/월", ko: "가구 월 생활비(소득 밴드별)", src: "통계청 가계동향조사(2024) 소비지출 근사 밴드", status: "검수 대기" },
};

/* 질환군별 치료 여정 단계 비용 구간(만원) — 심평원 공개 진료비 통계 기반 관례 근사.
   개인화: 회원 estimatedMedicalCost 비율로 스케일(±40% 한도) — 개인 실측이 원천, 표는 뼈대 */
const NE_COST_STEPS = {
  bp:    { exam: [15, 40],  care: [30, 80],   hosp: [300, 700],  hospKo: "뇌·심혈관 합병 입원 시" },
  sugar: { exam: [15, 40],  care: [40, 100],  hosp: [300, 800],  hospKo: "합병증 입원 시" },
  lipid: { exam: [10, 30],  care: [20, 60],   hosp: [200, 600],  hospKo: "심혈관 시술 시" },
  liver: { exam: [25, 60],  care: [30, 90],   hosp: [400, 1200], hospKo: "간질환 입원·시술 시" },
  body:  { exam: [10, 30],  care: [40, 120],  hosp: [200, 500],  hospKo: "근골격 수술 시" },
  organ: { exam: [20, 50],  care: [30, 80],   hosp: [300, 900],  hospKo: "정밀 치료 시" },
};
const NE_STEP_KO = { exam: "정밀검사", care: "통원 관리(연)", hosp: "입원 치료" };

function _neBand(lo, hi) { return Math.round(lo) + "~" + Math.round(hi) + "만원"; }
function _neScale(m) {
  const base = 900000, c = (m && m.estimatedMedicalCost) || base;
  return Math.max(0.6, Math.min(1.4, c / base));            // 개인 의료비 비율 스케일(±40%)
}

/* ── 축 A: 치료비 노출 — 단계별 구간 + 보장 충당/본인부담 분리 ── */
function neCostExposure(m, grade, group) {
  const steps = NE_COST_STEPS[group] || NE_COST_STEPS.organ;
  const k = _neScale(m);
  const rows = ["exam", "care", "hosp"].map((st) => {
    const lo = steps[st][0] * k, hi = steps[st][1] * k;
    /* 본인부담: 실손 세대별 계산기 실재 — 구간 중값으로 급여 기준 산출 후 비율을 구간에 적용 */
    let oopRate = 1, note = "실손 미가입 기준";
    try {
      const r = calcOutOfPocket(m, "급여", (lo + hi) / 2 * 10000);
      if (r) {
        /* 입원은 통원 회당 한도 미적용 — 세대 자기부담률만(입원 한도는 구간 내 충분). 통원·검사는 한도 반영 실효율 */
        oopRate = st === "hosp" ? r.coRate : (r.cost ? r.oop / r.cost : 1);
        note = st === "hosp" ? (r.gen + " 급여 자기부담 " + Math.round(r.coRate * 100) + "%(입원)") : r.note;
      }
    } catch (e) {}
    return { step: st, ko: NE_STEP_KO[st] + (st === "hosp" && steps.hospKo ? " · " + steps.hospKo : ""),
      band: _neBand(lo, hi), oopBand: _neBand(lo * oopRate, hi * oopRate), note: note };
  });
  /* 보유 진단금(관련 계열) — 사실 표시만 */
  let diagBenefit = 0;
  try {
    const ins = memberInsurance(m);
    if (ins && ins.riders) for (const r of ins.riders) {
      if (group === "bp" && (r.key === "brain" || r.key === "heart")) diagBenefit += r.benefit || 0;
      if ((group === "liver" && r.key === "liver") || r.key === "cancer") diagBenefit += 0;   // 암은 축B 소관 — 이중 계상 금지
    }
  } catch (e) {}
  return { grade: grade, group: group, steps: rows, diagBenefitManwon: Math.round(diagBenefit / 10000) };
}

/* ── 축 B: 질병 시 생활안정자금 — 기간 × 월 생활비 − 관련 진단금 ── */
function neIncomeGap(m, grade, group, cancerHint) {
  if (grade !== "H") return { applicable: false, ko: "예방 관리 구간 — 해당 단계 아니에요" };
  const durS = cancerHint ? NE_SRC.cancerDur : (group === "bp" ? NE_SRC.brainDur : group === "lipid" ? NE_SRC.heartDur : NE_SRC.chronicDur);
  const living = NE_SRC.living.v[(m && m.income) || "중"] || NE_SRC.living.v["중"];
  const needLo = durS.v * living * 0.7, needHi = durS.v * living * 1.1;   // 기간 변동 ±(관례)
  let diag = 0;
  try {
    const ins = memberInsurance(m);
    if (ins && ins.riders) for (const r of ins.riders) {
      if (cancerHint && r.key === "cancer") diag += r.benefit || 0;
      if (!cancerHint && (r.key === "brain" || r.key === "heart")) diag += r.benefit || 0;
    }
  } catch (e) {}
  const diagMan = Math.round(diag / 10000);
  const gapLo = Math.max(0, needLo - diagMan), gapHi = Math.max(0, needHi - diagMan);
  return { applicable: true, durKo: durS.v + "개월 기준", durSrc: durS.src, durStatus: durS.status,
    needBand: _neBand(needLo, needHi), diagManwon: diagMan,
    gapBand: gapHi <= 0 ? "0만원" : _neBand(gapLo, gapHi),
    gapNote: gapHi <= 0 ? "가진 진단금이 필요액 범위보다 커요" : "가진 진단금을 뺀 나머지 구간이에요",
    livingSrc: NE_SRC.living.src, livingStatus: NE_SRC.living.status };
}

/* ── 재원 축: 건강활동으로 쌓인 준비금 — HTK → 월 보험료 환산 ── */
function neFundBuilt(m) {
  let htk = 0;
  try { htk = (typeof tlBalance === "function") ? tlBalance(m.email || m) : 0; } catch (e) {}
  if (!htk && m && m.htkBase) htk = m.htkBase;
  let monthly = 0, genKo = "4세대 실손 기준";
  try {
    const ins = memberInsurance(m);
    if (ins && ins.silson && ins.silson.enrolled && ins.silson.monthly) { monthly = ins.silson.monthly; genKo = ins.silson.gen + " 실손 기준"; }
  } catch (e) {}
  if (!monthly) { try { monthly = _silsonMonthly("4세대", Math.round(m.regAge || m.age || 45)); } catch (e) { monthly = 13000; } }
  const months = monthly ? Math.floor(htk / monthly) : 0;
  const pct = monthly ? Math.round(htk / monthly * 100) : 0;
  const monthsKo = months >= 1 ? "월 보험료 약 " + months + "개월분(" + genKo + ")"
    : "월 보험료의 약 " + pct + "%만큼(" + genKo + ")";      /* 1개월 미만도 진행이 보이게 — 백분율 사실 표기 */
  return { htk: Math.round(htk), monthly: monthly, monthsKo: monthsKo, months: months, pct: pct,
    buildKo: "검진·재검진·복약 체크·걷기 미션·건강쇼핑 적립으로 쌓여요" };
}

/* ── 종합: 「내 대비 현황」 3값(전부 구간·평가어 없음) — 회원 객체 직접(코호트·데모·본인 공용) ── */
function needsSummaryOf(m) {
  if (!m) return null;
  let grade = "-", group = "organ", groupKo = "-";
  try {
    const chk = genMemberCheckup(m);
    const lifeAll = (chk.nat && chk.nat.life) || [];
    const g = riskGradeOf(chk.items, chk.trend, lifeAll.filter((f) => /절주|금연/.test(f)));
    grade = g.grade;
    let leadKey = null, leadSev = 0;
    for (const k in chk.items) { const sv = chk.items[k].sev || 0; if (sv > leadSev) { leadSev = sv; leadKey = k; } }
    group = leadKey ? riskGroupOf(leadKey) : "organ";
    groupKo = (HM_RISK_GROUPS[group] || {}).ko || group;
  } catch (e) {}
  const cancerHint = (m.highRiskCancerTypes || []).length > 0 || (m.cancerRiskGrade || 0) >= 6;
  const cost = neCostExposure(m, grade, group);
  const income = neIncomeGap(m, grade, group, cancerHint);
  const fund = neFundBuilt(m);
  return { v: 1, grade: grade, groupKo: groupKo,
    cost: cost, income: income, fund: fund,
    refresh: "검진 결과 · 등급 변화 · 미션 완결 · 계약 변경 시 자동 갱신",
    boundary: "구간 표시만 · 판단은 회원이 · 원본 수치 미포함", label: "[예시·시연 데이터]" };
}
function needsSummary(i) {
  const m = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(Number(i)) : null;
  if (!m) return null;
  const s2 = needsSummaryOf(m);
  if (s2) s2.i = Number(i);
  return s2;
}

/* ── 가드(§0-A) — 단정값·평가어 유입 검사(러너·하네스 공용) ── */
const NE_FORBID = /(부족합니다|부족해요|모자라|큰일|당장\s*필요|늦기\s*전에|반드시\s*가입|위험합니다)/;
function neGuard(sum) {
  const txt = JSON.stringify(sum);
  const evalWord = NE_FORBID.test(txt);
  /* 밴드 아닌 단정 금액(만원 단일값) 검출 — "N만원"이 "~" 없이 등장(0만원·진단금 사실 표기는 예외 필드) */
  const naked = (txt.match(/[^~\d](\d{2,5})만원/g) || []).filter((s2) => !/0만원/.test(s2));
  return { ok: !evalWord, evalWord: evalWord, nakedCount: naked.length };
}

/* 러너·화면 훅 — needsSummary는 회원 자신 화면에서도 쓰므로 함수는 공개, 타 회원 조회 훅만 관리자 */
try {
  if (typeof window !== "undefined") {
    window.__hifinNeeds = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; const s2 = needsSummary(i); return { sum: s2, guard: neGuard(s2) }; }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
