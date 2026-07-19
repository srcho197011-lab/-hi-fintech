/* ══════════ 통합 재무모델 엔진(finModel) — 단일 데이터 모델 · 파라미터 기반 · 자동 재계산 ══════════
   원칙(2026.7.16 개편):
   ① EMR·UPI·플랫폼 사용료 = 1차연도 0원(시장 선점 전략적 투자) → 회원 10만 달성 후
      "AI Healthcare Platform Subscription" 침투 요금제 — 월 50만(2차)부터 연 +50만씩, 한도 월 300만(subFeeBase·subFeeStep·subFeeCap).
   ② 회원 확보비(CAC) 5,000원/인 — 회원 증가 속도에 따라 기간 인식(일시 비용화 금지).
   ③ 모든 수치는 파라미터(finParams) — 하나가 바뀌면 P/L·B/S·C/F·SaaS·KPI·EV 전체 자동 재계산.
   ④ 모든 계산에 데이터 계보(lineage) 기록 — AI(하이)가 자연어로 검증·답변(finAsk).
   기존 원칙 유지: IFRS15(제품 총액·수수료 순액), 적립50%·나눔30%는 제품마진에만, 계약부채/충당부채 처리. */

const FIN_P_DEFAULT = {
  years: ["1차연도", "2차연도", "3차연도", "4차연도", "5차연도", "6차연도", "7차연도", "8차연도", "9차연도", "10차연도"],
  // 회원(누적 목표) — 1~5차 계획 + 6~10차 성장률 외삽
  membersEnd: [100000, 500000, 1000000, 5000000, 10000000],
  tenYearGrowth: 0.18, activeRate: 0.45,
  // ② 회원 확보비 — CAC 5,000원(온라인·SNS·검색·콘텐츠·제휴·이벤트·리워드·퍼미션DB 포함), 증가 속도 따라 인식
  cac: 5000,
  // ① AI Healthcare Platform Subscription — 전 기관 동일, 1차 0원 → 2차 월50만 → 매년 +50만(한도 300만)
  //    침투 우선 요금: 2차 50만은 기관의 기존 EMR 유지비 수준으로 진입장벽 최소화 → 기능 확장과 함께 단계 인상
  subFeeBase: 500000, subFeeStep: 500000, subFeeCap: 3000000, subPaidRate: 1.0,
  // 제휴 기관 수(연말) — 검진기관·병원·약국
  checkupCenters: [50, 150, 300, 500, 700], hospitals: [200, 800, 1500, 2500, 3000], pharmacies: [500, 2000, 5000, 12000, 20000],
  instGrowthAfter5: 0.10, subCostRate: 0.12, // 구독 원가(클라우드·연동 운영)
  // 제품 GMV(건강쇼핑·총액) — 1인당 연 지출 근거 카테고리 × 지갑 점유율(Share of Wallet) 70% 보수화
  // 근거: 회원의 연간 건강지출 전액이 아니라, 기존 구매채널(오픈마켓·약국·마트) 병행을 감안한 플랫폼 포착률 70%만 매출로 인식
  productCapture: 0.70,
  productBuyerRate: 0.38,
  productCats: [
    { key: "supp", label: "영양제·보충제", arpu: 140000, cost: 0.35 },
    { key: "diet", label: "건강식단·식품", arpu: 45000, cost: 0.50 },
    { key: "device", label: "홈케어 의료기기", arpu: 45000, cost: 0.40 },
    { key: "sports", label: "스포츠용품·활동", arpu: 80000, cost: 0.60 },
  ],
  checkupRate: 0.45, checkupFee: 22500, checkupCostRate: 0.50,
  serviceRate: 0.30, serviceCommission: 15000, serviceCostRate: 0.05,
  resvPerActive: [0.4, 0.7, 1.0, 1.3, 1.6], resvFee: 10000,
  arpuInsurance: [3000, 5000, 8000, 12000, 15000], adPerActive: [0, 300, 800, 1500, 2500],
  // 신설 스트림 — AI Agent 프리미엄·API/Data/Analytics(B2B) — 2차연도부터
  aiAgentRate: [0, 0.03, 0.05, 0.07, 0.08], aiAgentFeeYear: 24000, // 프리미엄 구독(회원, 연 2.4만)
  apiClients: [0, 5, 20, 60, 120], apiFeeYear: 60000000, // 데이터·분석·API 계약(기관·기업, 연 6천만)
  paymentRate: 0.022,
  // 비용 — 인건비·R&D·클라우드·GPU·영업·관리(전부 파라미터)
  // 인건비 70% 수준 현실화 근거: 단일 AI 에이전트 '하이'가 CS·상담·안내를 흡수(AI 네이티브 전환 실구현) +
  // AI 출수납·자동 분개·자동 정산으로 재무/운영 인력 대체 → 동일 회원 규모 대비 30% 추가 절감
  payroll: [700000000, 1890000000, 3500000000, 9310000000, 18690000000],
  rndRate: 0.05, cloudPerActive: 3000, gpuPerActive: 1200, salesRate: 0.02, adminRate: 0.04, brandMktRate: 0.015,
  // 기타 운영비(R&D·클라우드·GPU·영업·관리) 30% 수준 스케일 — 근거: AI 네이티브 운영으로 고정 운영조직 최소화
  // (하이 에이전트가 CS·영업지원 흡수, AI 출수납·자동정산으로 관리업무 자동화, 클라우드는 사용량 기반 최적화·자체 경량모델 병행)
  opexScale: 0.30,
  rewardRate: 0.50, donationRate: 0.30, // 제품마진 대비(기존 원칙)
  // 감가상각 — 초년도는 자산 취득 직후라 상각 기반이 적어 50% 수준만 인식(EBITDA 과대 방지)
  deprYear: 1000000000, deprY1Rate: 0.5, interestYear: 800000000, taxRate: 0.22,
  churn: 0.18, // 연간 회원 이탈률(SaaS 지표용)
  wacc: 0.15, termGrowth: 0.03, evRevMultiple: 4.0, evEbitdaMultiple: 15,
  capital: 300000000, surplus: 500000000, leaseLiab: 120000000, longDebt: 2000000000,
  investedCapital: 10000000000, // ROIC 분모(투하자본 근사)
  // 1차연도 월별 회원 램프(비중 %) — 합 100 → 10만 명
  m1Ramp: [2, 3, 4, 6, 8, 10, 10, 12, 12, 11, 11, 11],
};
// 시나리오(보수·기준·공격) — 배율 파라미터
const FIN_SCENARIOS = {
  cons: { label: "보수적", memberMult: 0.6, instMult: 0.6, rateMult: 0.85, cacMult: 1.4, feeMult: 1.0, c: "#F59E0B" },
  base: { label: "기준", memberMult: 1, instMult: 1, rateMult: 1, cacMult: 1, feeMult: 1, c: "#34D399" },
  aggr: { label: "공격적", memberMult: 1.3, instMult: 1.25, rateMult: 1.1, cacMult: 0.9, feeMult: 1.0, c: "#F472B6" },
};
function finScenario() { try { return localStorage.getItem("hifin_fin_scn") || "base"; } catch (e) { return "base"; } }
function finSetScenario(k) { try { localStorage.setItem("hifin_fin_scn", k); } catch (e) {} }
function finOverrides() { try { return JSON.parse(localStorage.getItem("hifin_fin_params") || "{}"); } catch (e) { return {}; } }
function finSetParam(key, val) { try { const o = finOverrides(); if (val === null || val === "" || isNaN(val)) delete o[key]; else o[key] = Number(val); localStorage.setItem("hifin_fin_params", JSON.stringify(o)); } catch (e) {} }
function finResetParams() { try { localStorage.removeItem("hifin_fin_params"); localStorage.removeItem("hifin_fin_scn"); } catch (e) {} }
/* 파라미터 해석 — 기본값 + 사용자 오버라이드 + 시나리오 배율 → 실행 파라미터 */
function finParams() {
  const d = FIN_P_DEFAULT, o = finOverrides(), s = FIN_SCENARIOS[finScenario()] || FIN_SCENARIOS.base;
  const P = JSON.parse(JSON.stringify(d));
  // 스칼라 오버라이드(회원 목표 members1~5 / cac / activeRate / …)
  for (let i = 0; i < 5; i++) if (o["members" + (i + 1)] != null) P.membersEnd[i] = o["members" + (i + 1)];
  ["cac", "activeRate", "productBuyerRate", "productCapture", "checkupRate", "serviceRate", "subFeeBase", "subFeeStep", "subFeeCap", "subPaidRate", "tenYearGrowth", "churn", "wacc", "evRevMultiple", "rndRate", "cloudPerActive", "gpuPerActive", "opexScale", "deprY1Rate"].forEach((k) => { if (o[k] != null) P[k] = o[k]; });
  if (o.instMultPct != null) { const m = o.instMultPct / 100; ["checkupCenters", "hospitals", "pharmacies"].forEach((k) => { P[k] = P[k].map((v) => Math.round(v * m)); }); }
  if (o.payrollPct != null) P.payroll = P.payroll.map((v) => Math.round(v * o.payrollPct / 100));
  if (o.cogsPct != null) P.productCats = P.productCats.map((c) => ({ ...c, cost: Math.min(0.95, c.cost * o.cogsPct / 100) }));
  // 시나리오 배율
  P.membersEnd = P.membersEnd.map((v) => Math.round(v * s.memberMult));
  ["checkupCenters", "hospitals", "pharmacies"].forEach((k) => { P[k] = P[k].map((v) => Math.round(v * s.instMult)); });
  P.activeRate = Math.min(0.9, P.activeRate * s.rateMult); P.productBuyerRate = Math.min(0.9, P.productBuyerRate * s.rateMult); P.checkupRate = Math.min(0.9, P.checkupRate * s.rateMult);
  P.cac = Math.round(P.cac * s.cacMult); P.subFeeBase = Math.round(P.subFeeBase * s.feeMult);
  P.scn = finScenario(); P.scnMeta = s;
  return P;
}
const finW = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 1e12) return s + (n / 1e12).toFixed(2) + "조"; if (n >= 1e8) return s + (n / 1e8).toFixed(1) + "억"; if (n >= 1e4) return s + Math.round(n / 1e4).toLocaleString() + "만"; return s + n.toLocaleString(); };
/* 연차 인덱스 y(0~9)의 배열 파라미터 — 1~5차는 계획, 6~10차는 외삽 */
function _finAt(P, arr, y, growth) { if (y < arr.length) return arr[y]; const g = growth == null ? P.tenYearGrowth : growth; return Math.round(arr[arr.length - 1] * Math.pow(1 + g, y - arr.length + 1)); }
/* ① 구독료 정책 — 1차 0원, 2차부터 base + step×(y-1), cap 상한 */
function finSubFee(P, y) { if (y === 0) return 0; return Math.min(P.subFeeCap, P.subFeeBase + P.subFeeStep * (y - 1)); }
/* ── 핵심: 연차별 통합 계산(수익 14계정 + 비용 + 손익 + FCF + 계보) ── */
function finYears(nYears) {
  const P = finParams(); const N = nYears || 10; const rows = [];
  for (let y = 0; y < N; y++) {
    const lin = [];
    const L = (label, formula, value) => { lin.push({ label, formula, value }); return value; };
    const membersEnd = _finAt(P, P.membersEnd, y), membersPrev = y === 0 ? 0 : _finAt(P, P.membersEnd, y - 1);
    const newMembers = Math.max(0, membersEnd - membersPrev), active = Math.round(membersEnd * P.activeRate);
    const checkupCenters = _finAt(P, P.checkupCenters, y, P.instGrowthAfter5), hospitals = _finAt(P, P.hospitals, y, P.instGrowthAfter5), pharmacies = _finAt(P, P.pharmacies, y, P.instGrowthAfter5);
    const insts = checkupCenters + hospitals + pharmacies;
    // ① AI Platform Subscription(원격진료·UPI·EMR 사용료 등 통합) — 1차 0원 전략
    const subFee = finSubFee(P, y), paidInsts = Math.round(insts * P.subPaidRate);
    const revSub = L("AI 플랫폼 구독(원격진료·UPI·EMR 사용료 등)", y === 0 ? "1차연도 무료(시장 선점 전략) — 0원" : `기관 ${paidInsts.toLocaleString()}곳 × 월 ${finW(subFee)}원 × 12`, paidInsts * subFee * 12);
    const subSplit = insts ? { checkup: Math.round(revSub * checkupCenters / insts), hospital: Math.round(revSub * hospitals / insts), pharmacy: Math.round(revSub * pharmacies / insts) } : { checkup: 0, hospital: 0, pharmacy: 0 };
    // 제품 GMV — 지갑 점유율(포착률) 70% 보수화: 매출·원가·마진이 함께 70%로, 적립(마진 50%)·기부(마진 30%)도 자동 연동
    const buyers = Math.round(membersEnd * P.productBuyerRate);
    let revProduct = 0, cogsProduct = 0; const catRev = {};
    for (const c of P.productCats) { const rv = Math.round(buyers * c.arpu * P.productCapture); catRev[c.key] = rv; revProduct += rv; cogsProduct += Math.round(rv * c.cost); }
    L("제품판매(GMV·건강쇼핑)", `구매회원 ${buyers.toLocaleString()}명 × 카테고리 ARPU 합 ${finW(P.productCats.reduce((s, c) => s + c.arpu, 0))}원 × 지갑 점유율 ${(P.productCapture * 100).toFixed(0)}%(기존 채널 병행 보수화)`, revProduct);
    const checkupUsers = Math.round(membersEnd * P.checkupRate), revCheckup = L("검진 연계 수수료", `검진회원 ${checkupUsers.toLocaleString()}명 × 건당 ${finW(P.checkupFee)}원`, checkupUsers * P.checkupFee);
    const serviceUsers = Math.round(membersEnd * P.serviceRate), revService = L("헬스케어 서비스 수수료", `이용 ${serviceUsers.toLocaleString()}명 × ${finW(P.serviceCommission)}원`, serviceUsers * P.serviceCommission);
    const reservations = Math.round(active * _finAt(P, P.resvPerActive, y, 0.05)), revReservation = reservations * P.resvFee;
    const revInsurance = L("보험 중개 수수료", `활성 ${active.toLocaleString()}명 × ARPU ${finW(_finAt(P, P.arpuInsurance, y, 0.05))}원`, active * _finAt(P, P.arpuInsurance, y, 0.05));
    const revAd = active * _finAt(P, P.adPerActive, y, 0.05);
    const agentUsers = Math.round(membersEnd * _finAt(P, P.aiAgentRate, y, 0.02)), revAgent = L("AI Agent 프리미엄", `구독회원 ${agentUsers.toLocaleString()}명 × 연 ${finW(P.aiAgentFeeYear)}원`, agentUsers * P.aiAgentFeeYear);
    const apiN = _finAt(P, P.apiClients, y, 0.15), revApi = L("API·데이터·분석 서비스(B2B)", `계약 ${apiN.toLocaleString()}건 × 연 ${finW(P.apiFeeYear)}원`, apiN * P.apiFeeYear);
    const revenue = L("매출액(합계)", "제품+검진+서비스+예약+구독+보험+광고+Agent+API", revProduct + revCheckup + revService + revReservation + revSub + revInsurance + revAd + revAgent + revApi);
    // 원가
    const cogs = cogsProduct + Math.round(revCheckup * P.checkupCostRate) + Math.round(revService * P.serviceCostRate) + Math.round(revSub * P.subCostRate) + Math.round(revProduct * P.paymentRate);
    const gross = L("매출총이익", `매출 ${finW(revenue)} − 원가 ${finW(cogs)}`, revenue - cogs);
    // ② CAC 기간 인식 + 판관비(전 항목 파라미터)
    const cacCost = L("회원확보비(CAC)", `신규 ${newMembers.toLocaleString()}명 × ${P.cac.toLocaleString()}원 — 증가 속도 따라 기간 인식`, newMembers * P.cac);
    const brandMkt = Math.round(revenue * P.brandMktRate), marketing = cacCost + brandMkt;
    const prodMargin = revProduct - cogsProduct;
    const reward = Math.round(prodMargin * P.rewardRate), donation = Math.round(prodMargin * P.donationRate);
    const payroll = _finAt(P, P.payroll, y, 0.12);
    const os = P.opexScale; // 기타 운영비 30% 스케일(AI 네이티브 운영 — 자동화·사용량 기반 인프라)
    const rnd = Math.round(revenue * P.rndRate * os);
    const cloud = Math.round(active * P.cloudPerActive * os), gpu = Math.round(active * P.gpuPerActive * os);
    const salesCost = Math.round(revenue * P.salesRate * os), adminCost = Math.round(revenue * P.adminRate * os);
    const otherOpex = rnd + cloud + gpu + salesCost + adminCost;
    L("기타 운영비(R&D·클라우드·GPU·영업·관리)", `표준 요율 합 × 운영 스케일 ${(os * 100).toFixed(0)}% — AI 네이티브 운영(하이 CS 흡수·AI 출수납 자동화·사용량 기반 클라우드)`, otherOpex);
    const sga = marketing + reward + donation + payroll + otherOpex;
    const ebit = L("영업이익(EBIT)", `매출총이익 ${finW(gross)} − 판관비 ${finW(sga)}`, gross - sga);
    const depr = Math.round(P.deprYear * (y === 0 ? P.deprY1Rate : 1)); // 초년도 감가상각 50%(상각 기반 적음)
    const ebitda = ebit + depr, pbt = ebit - P.interestYear, tax = Math.max(0, pbt) * P.taxRate, net = pbt - tax;
    const capex = y < 2 ? 2000000000 : 5000000000, dwc = Math.round(revenue * 0.02), fcf = ebit * (1 - P.taxRate) + depr - capex - dwc;
    const mrrEnd = paidInsts * subFee + Math.round(agentUsers * P.aiAgentFeeYear / 12); // 월 반복매출(구독)
    rows.push({ y, label: P.years[y], membersEnd, membersPrev, newMembers, active, buyers, checkupUsers, serviceUsers, reservations,
      hospitals, checkupCenters, pharmacies, insts, subFee, paidInsts, cac: P.cac, marketing, cacCost, brandMkt,
      revProduct, catRev, cogsProduct, revCheckup, revService, revReservation, revInsurance, revEmr: revSub, revSub, subSplit, revAd, revAgent, revApi,
      revenue, cogs, gross, reward, donation, payroll, rnd, cloud, gpu, salesCost, adminCost, otherOpex, sga,
      ebit, ebitda, pbt, tax, net, capex, fcf, mrrEnd, arr: mrrEnd * 12,
      opMargin: revenue ? ebit / revenue : 0, netMargin: revenue ? net / revenue : 0, lin });
  }
  return rows;
}
/* ── 1차연도 월별·분기별 사업계획 — 회원 램프에 따른 CAC 인식·매출 스케일 ── */
function finMonthlyY1() {
  const P = finParams(); const Y = finYears(1)[0]; const total = P.membersEnd[0];
  const rampSum = P.m1Ramp.reduce((a, b) => a + b, 0);
  // 월별 누적 회원 → 연 매출을 '누적 회원 가중치'로 배분(회원이 늘수록 월 매출 증가)
  const cums = []; let cum = 0; const adds = [];
  for (let m = 0; m < 12; m++) { const add = Math.round(total * P.m1Ramp[m] / rampSum); cum += add; adds.push(add); cums.push(cum); }
  const wSum = cums.reduce((a, b) => a + b, 0);
  const rows = [];
  for (let m = 0; m < 12; m++) {
    const rev = Math.round(Y.revenue * cums[m] / wSum);
    const cacCost = adds[m] * P.cac; // 회원 증가 속도에 따른 기간 인식
    const opex = Math.round((Y.sga - Y.cacCost) / 12) + cacCost, cogs = Math.round(rev * (Y.cogs / Y.revenue));
    rows.push({ m: m + 1, add: adds[m], cum: cums[m], cacCost, rev, cogs, opex, op: rev - cogs - opex });
  }
  const q = [0, 1, 2, 3].map((i) => { const s = rows.slice(i * 3, i * 3 + 3); return { q: i + 1, add: s.reduce((a, r) => a + r.add, 0), cum: s[2].cum, cacCost: s.reduce((a, r) => a + r.cacCost, 0), rev: s.reduce((a, r) => a + r.rev, 0), op: s.reduce((a, r) => a + r.op, 0) }; });
  return { rows, q, total, cacTotal: total * P.cac };
}
/* ── SaaS 구독 모델 — MRR·ARR·성장·이탈·확장(요금 인상=Expansion) ── */
function finSaaSModel() {
  const P = finParams(); const rows = finYears(5);
  return rows.map((r, i) => {
    const prev = i ? rows[i - 1] : null;
    const growth = prev && prev.arr ? (r.arr - prev.arr) / prev.arr : null;
    const expansion = prev ? Math.max(0, (r.subFee - prev.subFee) * r.paidInsts * 12) : 0; // 요금 인상분
    return { label: r.label, insts: r.paidInsts, subFee: r.subFee, mrr: r.mrrEnd, arr: r.arr, growth, expansion, churn: P.churn, renewal: 1 - P.churn, recurring: r.revSub + r.revAgent, usage: r.revCheckup + r.revService + r.revReservation, premium: r.revAgent };
  });
}
/* ── 투자자 KPI — 전 지표 자동 계산 ── */
function finKPIs() {
  const P = finParams(); const rows = finYears(5); const r3 = rows[2], r1 = rows[0], r5 = rows[4];
  const arpu = r3.revenue / r3.membersEnd, arppu = r3.revenue / Math.max(1, r3.buyers);
  const grossMargin = r3.gross / r3.revenue;
  const ltv = Math.round(arpu * grossMargin / P.churn); // LTV = ARPU×GM÷이탈률
  const contribution1 = (r1.revenue / r1.membersEnd) * (r1.gross / r1.revenue); // 1인 연 공헌이익(Y1)
  const payback = contribution1 > 0 ? (P.cac / (contribution1 / 12)) : null; // 개월
  const burn1 = Math.min(0, r1.ebit), cash0 = P.capital + P.surplus + P.longDebt;
  const runway = burn1 < 0 ? cash0 / (-burn1 / 12) : Infinity;
  const magic = rows[1].arr && r1.marketing ? (rows[1].arr - r1.arr) / r1.marketing : null;
  const growthY3 = (r3.revenue - rows[1].revenue) / rows[1].revenue;
  const rule40 = growthY3 * 100 + (r3.ebitda / r3.revenue) * 100;
  const v = finValModel();
  return { cac: P.cac, ltv, ltvCac: ltv / P.cac, arpu, arppu, grossMargin, opMargin: r3.opMargin, ebitda3: r3.ebitda, ebit3: r3.ebit,
    burn1, runway, payback, magic, rule40, ev: v.evDCF, evRev: v.evRev, evSales: v.evRevMultiple, roi5: r5.net / P.investedCapital, roic3: (r3.ebit * (1 - P.taxRate)) / P.investedCapital, churn: P.churn };
}
/* ── 기업가치(DCF + 멀티플) ── */
function finValModel() {
  const P = finParams(); const rows = finYears(5); let pvSum = 0; const disc = [];
  rows.forEach((r, i) => { const df = 1 / Math.pow(1 + P.wacc, i + 1), pv = r.fcf * df; pvSum += pv; disc.push({ y: r.label, fcf: r.fcf, df, pv }); });
  const lastFcf = rows[4].fcf, terminal = lastFcf * (1 + P.termGrowth) / (P.wacc - P.termGrowth), pvTerminal = terminal / Math.pow(1 + P.wacc, 5), evDCF = pvSum + pvTerminal;
  const evRev = rows[4].revenue * P.evRevMultiple, evEbitda = Math.max(0, rows[4].ebitda) * P.evEbitdaMultiple;
  return { disc, pvSum, terminal, pvTerminal, evDCF, evRev, evEbitda, wacc: P.wacc, termGrowth: P.termGrowth, evRevMultiple: P.evRevMultiple, evEbitdaMultiple: P.evEbitdaMultiple, lastRevenue: rows[4].revenue, lastEbitda: rows[4].ebitda, lastFcf, lastNet: rows[4].net };
}
/* ── 연차 재무상태표·현금흐름 — 구독 계정(구독료 미수금·계약자산·이연수익·플랫폼/AI모델/데이터 자산) ── */
function finBSYear(yi) {
  const P = finParams(); const r = finYears(Math.max(5, yi + 1))[yi];
  const retained = r.net, equity = P.capital + P.surplus + retained;
  const contractLiab = r.reward, donationPay = Math.round(r.donation * 0.4), tradePay = Math.round(r.cogs * 0.1), taxPay = Math.round(r.tax), deposits = Math.round(r.revInsurance * 0.1);
  const deferredRev = Math.round(r.revSub / 12); // 이연수익(구독 선수 1개월)
  const curLiab = contractLiab + donationPay + tradePay + taxPay + deposits + deferredRev;
  const nonCurLiab = P.leaseLiab + P.longDebt, liabilities = curLiab + nonCurLiab, assets = liabilities + equity;
  const platformAsset = 1200000000, softwareAsset = 800000000, aiModelAsset = 900000000, dataAsset = 600000000, cloudAsset = 300000000, devCost = 700000000;
  const ppe = 1000000000, nonCurAssets = ppe + platformAsset + softwareAsset + aiModelAsset + dataAsset + cloudAsset + devCost;
  const receivable = Math.round((r.revenue - r.revSub) * 0.08), subReceivable = Math.round(r.revSub / 12), contractAsset = Math.round(r.revSub * 0.02);
  const inventory = Math.round(r.cogsProduct * 0.05), prepaid = 100000000;
  const cash = assets - (nonCurAssets + inventory + receivable + subReceivable + contractAsset + prepaid);
  const curAssets = cash + receivable + subReceivable + contractAsset + inventory + prepaid;
  return { r, assets, cash, receivable, subReceivable, contractAsset, inventory, prepaid, curAssets, ppe, platformAsset, softwareAsset, aiModelAsset, dataAsset, cloudAsset, devCost, nonCurAssets,
    contractLiab, donationPay, tradePay, taxPay, deposits, deferredRev, curLiab, leaseLiab: P.leaseLiab, longDebt: P.longDebt, nonCurLiab, liabilities, capital: P.capital, surplus: P.surplus, retained, equity,
    debtRatio: liabilities / equity, currentRatio: curLiab ? curAssets / curLiab : 0, equityRatio: equity / assets, roe: retained / equity };
}
function finCFYear(yi) {
  const P = finParams(); const r = finYears(Math.max(5, yi + 1))[yi];
  const subCollect = r.revSub + Math.round(r.revSub / 12), insCollect = r.revInsurance, mktCollect = r.revProduct + r.revCheckup + r.revService + r.revReservation + r.revAd + r.revAgent + r.revApi;
  const dep = Math.round(P.deprYear * (yi === 0 ? P.deprY1Rate : 1));
  const opCF = r.net + dep + Math.round(r.revenue * 0.01);
  return { subCollect, insCollect, mktCollect, cacOut: -r.cacCost, mktOut: -(r.marketing - r.cacCost), cloudOut: -(r.cloud + r.gpu), rndOut: -r.rnd, opCF, invCF: -r.capex, finCF: yi === 0 ? P.capital + P.surplus + P.longDebt + P.leaseLiab : 0, net: r.net, dep };
}
/* ── 재무회계 온톨로지 그래프 — 회원→CAC→…→EV 인과 사슬 ── */
const FIN_GRAPH = [
  { k: "members", label: "회원 증가", c: "#22D3EE" }, { k: "cac", label: "회원확보비(CAC)", c: "#F59E0B" },
  { k: "active", label: "활성회원", c: "#34D399" }, { k: "checkup", label: "검진 증가", c: "#2DD4BF" },
  { k: "inst", label: "병원·약국·검진기관", c: "#6366F1" }, { k: "sub", label: "AI 플랫폼 구독(원격진료·UPI·EMR)", c: "#A78BFA" },
  { k: "mrr", label: "MRR·Recurring Revenue", c: "#F472B6" }, { k: "ocf", label: "영업현금흐름", c: "#FBBF24" }, { k: "ev", label: "기업가치(EV)", c: "#EAB308" },
];
/* ── AI 자연어 재무 질의(하이 연동) — 질문 → 수치 + 계보 ── */
function finAsk(text) {
  const t = String(text || "").replace(/\s/g, "");
  const P = finParams(); const rows = finYears(10); const K = finKPIs(); const V = finValModel();
  let yi = 2; const ym = t.match(/([1-9]|10)차/); if (ym) yi = parseInt(ym[1]) - 1; const r = rows[Math.min(9, yi)];
  const scn = P.scnMeta.label;
  const lines = [];
  if (/시나리오|보수|공격/.test(t)) { lines.push(`현재 시나리오는 '${scn}'이에요. 보수·기준·공격 3종을 온톨로지 › 재무회계 › 파라미터에서 바꾸면 전 재무제표가 즉시 재계산돼요.`); }
  else if (/구독|사용료|EMR|플랫폼요금|emr/.test(t)) { lines.push(`AI 플랫폼 구독료(원격진료·UPI·EMR 사용료 등) 정책: 1차연도 0원(시장 선점) → 2차 월 ${finW(finSubFee(P, 1))}원 → 5차 월 ${finW(finSubFee(P, 4))}원(매년 +${finW(P.subFeeStep)}원).`, `${r.label} 구독매출 ${finW(r.revSub)}원 = 기관 ${r.paidInsts.toLocaleString()}곳 × 월 ${finW(r.subFee)}원 × 12.`); }
  else if (/LTV|엘티비|ltv/.test(t)) { lines.push(`LTV는 ${finW(K.ltv)}원, LTV/CAC는 ${K.ltvCac.toFixed(1)}배예요 (ARPU × 매출총이익률 ÷ 이탈률 ${Math.round(K.churn * 100)}%).`, `CAC 회수기간(Payback)은 약 ${K.payback ? K.payback.toFixed(1) : "-"}개월이에요.`); }
  else if (/CAC|획득비|모집비|확보비|cac/.test(t)) { lines.push(`회원 1인 확보비(CAC)는 ${P.cac.toLocaleString()}원 — 10만 명 목표 시 총 ${finW(P.cac * P.membersEnd[0])}원이 회원 증가 속도에 따라 기간 인식돼요.`, `${r.label} CAC 비용은 신규 ${r.newMembers.toLocaleString()}명 × ${P.cac.toLocaleString()}원 = ${finW(r.cacCost)}원이에요.`); }
  else if (/기업가치|밸류|EV|ev/.test(t)) { lines.push(`기업가치(EV)는 DCF ${finW(V.evDCF)}원, EV/Revenue(${V.evRevMultiple}x) ${finW(V.evRev)}원 범위예요 (WACC ${Math.round(V.wacc * 100)}%).`); }
  else if (/런웨이|현금소진|번레이트|runway/.test(t)) { lines.push(`1차연도 번(Burn)은 ${finW(K.burn1)}원, 런웨이는 약 ${isFinite(K.runway) ? K.runway.toFixed(1) + "개월" : "충분(흑자)"}이에요.`); }
  else if (/영업이익|이익|손익|적자|흑자/.test(t)) { lines.push(`${r.label}(${scn}) 영업이익은 ${finW(r.ebit)}원(이익률 ${(r.opMargin * 100).toFixed(1)}%), 당기순이익 ${finW(r.net)}원이에요.`, `근거: ${r.lin[r.lin.length - 1].formula}.`); }
  else if (/매출|수익|얼마/.test(t)) { lines.push(`${r.label}(${scn}) 예상 매출은 ${finW(r.revenue)}원이에요 — 제품 ${finW(r.revProduct)} · 구독 ${finW(r.revSub)} · 검진 ${finW(r.revCheckup)} · 보험 ${finW(r.revInsurance)}.`, y0note(r)); }
  else return null;
  return { lines: lines.filter(Boolean), buttons: ["5차연도 매출은?", "기업가치 얼마야?", "LTV/CAC 알려줘"], nav: { key: "ontology", label: "재무회계 온톨로지" } };
  function y0note(rr) { return rr.y === 0 ? "1차연도는 EMR·UPI·플랫폼 사용료를 받지 않는(0원) 시장 선점 전략이라 구독매출이 없어요." : null; }
}
try { if (typeof window !== "undefined") window.__hifinFin = finAsk; } catch (e) {}
