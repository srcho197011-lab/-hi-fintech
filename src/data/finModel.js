/* ══════════ 통합 재무모델(finModel) — 화면·하이 호환 래퍼 ══════════
   계산은 전부 finBudget.js(예산양식 v3.8 이식 엔진, fb 접두사)에 위임한다. 이 파일은 기존 함수 이름·호출 시그니처를 지키는 얇은 층이다.
   · 연차 = 달력 연도(1차 = 2027, 오픈 2027-01-01) · 기준일 2027-09-17 · 금액 단위 원
   · FIN_P_DEFAULT는 계산에 쓰지 않는다 — scripts/invest/fin_dump.mjs가 _fin.json으로 뜨는 원천(예산양식 파이프라인 입력)이라 값을 그대로 둔다.
   · 새 엔진 입력은 FB_P0(finBudgetParams.js 생성물) + 시나리오(hifin_fin_scn) + 오버라이드(hifin_fin_params_v38). */

const FIN_P_DEFAULT = {
  years: ["1차연도", "2차연도", "3차연도", "4차연도", "5차연도", "6차연도", "7차연도", "8차연도", "9차연도", "10차연도"],
  // 회원(누적 목표) — 1~5차 계획 + 6~10차 성장률 외삽
  /* N2(적정성 검증 반영 2026-08-20): 아래 회원 목표는 "이탈(churn) 차감 후 순증 기준" —
     총가입 필요량은 rows.grossNew(신규 순증 + 전년 회원×이탈률 보전)로 파생 제공(5년 합계 ≈ 1,300만+).
     CAC는 순증 기준으로 인식하며, 이탈 보전·재활성 획득비는 브랜드·퍼포먼스 마케팅(매출 8%)에 포함. */
  membersEnd: [330000, 1300000, 3200000, 6000000, 10000000],
  /* 활성 회원 = 하이핀 경유 검진 예약(연) — 연도별 절대값 계획(형 확정 2026-08-20) */
  activeAbs: [250000, 900000, 2100000, 3800000, 6000000],
  /* 마케팅(보험상품 안내) 동의 회원(누적) — 보험 중개 수수료의 모수(형 확정 2026-08-20) */
  mktConsentEnd: [200000, 800000, 2000000, 3800000, 6300000],
  tenYearGrowth: 0.18, activeRate: 0.45,   // activeRate는 activeAbs 미정의 연차 폴백
  // ② 회원 확보비 — CAC 5,000원(온라인·SNS·검색·콘텐츠·제휴·이벤트·리워드·퍼미션DB 포함), 증가 속도 따라 인식
  cac: 5000,
  // ① AI Healthcare Platform Subscription — 전 기관 동일, 1차 0원 → 2차 월50만 → 매년 +50만(한도 300만)
  //    침투 우선 요금: 2차 50만은 기관의 기존 EMR 유지비 수준으로 진입장벽 최소화 → 기능 확장과 함께 단계 인상
  subFeeBase: 500000, subFeeStep: 500000, subFeeCap: 3000000, subPaidRate: 1.0,
  // 제휴 기관 수(연말) — 검진기관·병원·약국
  checkupCenters: [50, 150, 300, 500, 700], hospitals: [200, 800, 1500, 2500, 3000],
  // 약국(N1 적정성 검증 반영 2026-08-20): 5차 12,000곳 = 전국 약국 25,047곳(2024 심평원)의 48% — 침투율 방어선
  pharmacies: [500, 2000, 4000, 8000, 12000],
  instGrowthAfter5: 0.10, subCostRate: 0.12, // 구독 원가(클라우드·연동 운영)
  // 제품 GMV(건강쇼핑·총액) — 1인당 연 지출 근거 카테고리 × 지갑 점유율(Share of Wallet) 70% 보수화
  // 근거: 회원의 연간 건강지출 전액이 아니라, 기존 구매채널(오픈마켓·약국·마트) 병행을 감안한 플랫폼 포착률 70%만 매출로 인식
  productCapture: 0.70,
  productBuyerRate: 0.38,
  /* 제품 가동률(연차별) — 1차연도는 준비·초기 광고 기간이라 연간 내내 정상 판매가 되지 않는다.
     플랫폼 구축·입점 협의·초기 인지도 확보에 시간이 걸리므로 1/3 수준으로 계상(형 확정 2026-09-07).
     2차연도부터 정상 가동. 원가·결제수수료·적립·기부가 모두 제품매출에 연동되므로 함께 줄어든다. */
  productRamp: [0.333, 1, 1, 1, 1],
  /* 초기 런칭 광고 선투입(연차별·절대액) — 준비·광고 기간에는 제품이 덜 팔리는 대신 인지도 확보를
     위한 광고를 **먼저** 쓴다. 매출에 비례하는 브랜드 마케팅(8%)과 별개로 1차연도에만 계상한다.
     이 항목이 없으면 제품 축소로 오히려 영업이익이 늘어난다 — 1차연도 제품판매는 적립·기부·브랜드비를
     합치면 한계 기여가 음수이기 때문이다(형 확정 2026-09-07). */
  launchMkt: [430000000, 0, 0, 0, 0],
  productCats: [
    { key: "supp", label: "영양제·보충제", arpu: 140000, cost: 0.35 },
    { key: "diet", label: "건강식단·식품", arpu: 45000, cost: 0.50 },
    { key: "device", label: "홈케어 의료기기", arpu: 45000, cost: 0.40 },
    { key: "sports", label: "스포츠용품·활동", arpu: 80000, cost: 0.60 },
  ],
  checkupRate: 0.45,
  /* 검진 연계(형 확정 2026-08-20 · 구성 개정 2026-08-31): 건당 매출 25,000원 · 3종 서비스 원가(검진대비보험 부보료+AI 리포트+맞춤 케어 키트) 건당 20,000원 이내 유지(형 확정) */
  checkupFee: 25000, checkupCost3: 20000,
  serviceRate: 0.30, serviceCommission: 15000, serviceCostRate: 0.05,
  resvPerActive: [0.4, 0.7, 1.0, 1.3, 1.6], resvFee: 10000,
  /* 보험 중개(형 확정 2026-08-20): 마케팅(퍼미션) 동의 회원의 60%가 중개로 이어지고 건당 수수료 70,000원 */
  insConvRate: 0.60, insFeePerCase: 70000,
  adPerActive: [0, 300, 800, 1500, 2500],
  // 신설 스트림 — AI Agent 프리미엄·API/Data/Analytics(B2B) — 2차연도부터
  aiAgentRate: [0, 0.03, 0.05, 0.07, 0.08], aiAgentFeeYear: 24000, // 프리미엄 구독(회원, 연 2.4만)
  apiClients: [0, 5, 20, 60, 120], apiFeeYear: 60000000, // 데이터·분석·API 계약(기관·기업, 연 6천만)
  paymentRate: 0.022,
  // 비용 — 인건비·R&D·클라우드·GPU·영업·관리(전부 파라미터)
  // 인건비 70% 수준 현실화 근거: 단일 AI 에이전트 '하이'가 CS·상담·안내를 흡수(AI 네이티브 전환 실구현) +
  // AI 출수납·자동 분개·자동 정산으로 재무/운영 인력 대체 → 동일 회원 규모 대비 30% 추가 절감
  /* 인건비(형 확정 2026-08-20 상향): 회원 33만→1,000만 규모 연동 — 1차 70억(개발·운영·프로 지원 ~70명)
     → 5차 2,200억(전사 ~2,000명 · 매출 대비 ~11%) */
  payroll: [7000000000, 25000000000, 60000000000, 130000000000, 220000000000],
  rndRate: 0.05, cloudPerActive: 3000, gpuPerActive: 1200, salesRate: 0.02, adminRate: 0.04, brandMktRate: 0.08,   // 브랜드·퍼포먼스 마케팅 매출 8%(형 확정 상향 — CAC와 별도)
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
  // 1차연도 월별 회원 램프(비중 %) — 합 100 → 1차연도 목표(33만 명)
  m1Ramp: [2, 3, 4, 6, 8, 10, 10, 12, 12, 11, 11, 11],
};
// 시나리오(보수·기준·공격) — 배율 파라미터(엔진 FB_SCENARIOS와 같은 객체)
const FIN_SCENARIOS = FB_SCENARIOS;
function finScenario() { return fbScenario(); }
function finSetScenario(k) { fbSetScenario(k); }
function finOverrides() { return fbOverrides(); }
function finSetParam(key, val) { return fbSetParam(key, val); }
function finResetParams() { fbResetParams(); }

const finW = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 1e12) return s + (n / 1e12).toFixed(2) + "조"; if (n >= 1e8) return s + (n / 1e8).toFixed(1).replace(/\.0$/, "") + "억"; if (n >= 1e4) return s + Math.round(n / 1e4).toLocaleString() + "만"; return s + n.toLocaleString(); };
const FIN_YEAR0 = 2027;
const finYearLabel = (y) => `${FIN_YEAR0 + y}년(${y + 1}차)`;
const FIN_TYPE_KO = { centers: "검진센터", hospitals: "병원", pharmacies: "약국" };

/* 실행 파라미터 — FB 전체 키 + 기존 호출자 호환 키 */
function finParams() {
  const M = fbModel(); const P = fbClone(M.P); const a0 = M.annual[0];
  P.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(finYearLabel);
  P.checkupFee = P.chkOwnFee;                                   // escrowPay(자사 운영 기준)
  P.cac = a0.new ? Math.round(a0.mktSum / a0.new) : 0;          // 1차 실효 CAC(마케팅 합계 ÷ 순증)
  P.t1Rate = P.t1Rate == null ? FB_META.t1Rate : P.t1Rate;
  P.imAmt = P.imAmt == null ? FB_META.imAmt : P.imAmt;
  P.actualMembers = P.actualMembers == null ? FB_ASOF.actualMembers : P.actualMembers;
  P.asOfDate = FB_ASOF.date; P.budgetVersion = FB_META.version;
  return P;
}
/* 기관 유형별 월 구독료 — 호환 finSubFee는 병원 */
function finSubFee(P, y) { return fbFee(P && P.subFeeBaseT ? P : fbModel().P, "hospitals", y); }
function finSubFeeT(t, y) { return fbFee(fbModel().P, t, y); }

/* 연차 행(2027~2036) — 기존 필드명 유지 + v3.8 필드 */
function finYears(nYears) {
  const M = fbModel(); const P = M.P; const N = Math.max(1, Math.min(10, nYears || 10));
  const A = M.annual10; const yr = M.yr; const rows = [];
  let cumBenefit = 0;
  for (let y = 0; y < N; y++) {
    const a = A[y]; const lin = [];
    const L = (label, formula, value) => { lin.push({ label, formula, value }); return value; };
    const tax = M.taxes10[y];
    const dwc = fbXround(a.rev * FB_WC_RATE);
    const fcf = a.ebit - Math.max(0, a.ebit) * P.taxRate + a.depr - a.capex - dwc;
    const paidT = a.paid, subFeeT = a.subFee;
    const paidInsts = paidT.centers + paidT.hospitals + paidT.pharmacies;
    const mrrEnd = FB_TYPES.reduce((s, t) => s + paidT[t] * subFeeT[t], 0);
    cumBenefit += a.hmBenefit;
    const eff = (k) => (a.eff[k] * 100).toFixed(1) + "%";
    L("제품판매(건강커머스)", `구매 회원 ${a.buyers.toLocaleString()}명(연말 회원 × ${(P.productBuyerRate * 100).toFixed(0)}%) × 카테고리 ARPU × 점유율 ${(P.productCapture * 100).toFixed(0)}% × 반영률 ${eff("P")}${y === 0 ? `(개시 ${finStartMonth(P, "P") || "-"}월 · ${FIN_YEAR0} 보정 ×${P.prodAdjY1})` : ""}`, a.revP);
    L("건강검진 연계(자사 운영·제휴사)", `검진 예약 ${a.active.toLocaleString()}건 — 자사 운영 ${a.chkOwn.toLocaleString()}건 × ${finW(P.chkOwnFee)}원 + 제휴사 ${a.chkPtn.toLocaleString()}건 × ${finW(P.chkPtnFee)}원(자사 비중 ${(fbOwnShare(P, y) * 100).toFixed(0)}%)`, a.revChk);
    L("예약 서비스", `예약 ${a.resv.toLocaleString()}건 × ${finW(P.resvFee)}원(반영률 ${eff("Resv")})`, a.revResv);
    L("재가·돌봄 파트너 이용료", `파트너 센터·월 ${a.careN.toLocaleString()} × 월 ${finW(P.careFee)}원(연말 회원 × ${(P.careRate * 100).toFixed(0)}% ÷ 12 ÷ ${P.carePerCenter})`, a.revCare);
    L("AI 플랫폼 구독(기관 유형별)", FB_TYPES.map((t) => `${FIN_TYPE_KO[t]} ${a.paid[t].toLocaleString()}곳 × 월 ${finW(a.subFee[t])}원`).join(" · ") + (FB_TYPES.every((t) => !a.subFee[t]) ? ` — ${FIN_YEAR0 + y}년 무료(${finSubStartCal(P)}년 과금)` : ` × 12 × 반영률`), a.revSub);
    L("헬스메이트센터 사용료", `DB 공급 ${a.insC.toLocaleString()}건 — 우대 ${a.hmDisc.toLocaleString()}건 × ${finW(a.hmPrice)}원(한도 ${a.hmCap.toLocaleString()}건) + 시가 ${a.hmFull.toLocaleString()}건 × ${finW(a.hmMarket)}원`, a.revIns);
    L("매출액(합계)", "제품 + 검진 연계 + 예약 + 돌봄 + 구독 + 헬스메이트센터 사용료", a.rev);
    L("매출원가", `제품 원가·결제 수수료·검진 연계 서비스 원가·돌봄·구독 운영 원가`, a.cogs);
    L("마케팅(5대 엔진)", `안내 발송 ${finW(a.mk1)} · 온라인 타겟 광고 ${finW(a.media)} · 소재 ${finW(a.creative)} · 검진센터 QR ${finW(a.kit + a.sticker + a.qrfee)}`, a.mktSum);
    L("메디에이지 리포트", `${a.mediN.toLocaleString()}건 × ${finW(P.cost2.mediFee)}원`, a.mediRep);
    L("포인트 적립·기부", `제품마진 × 적립 ${(P.rewardRate * 100).toFixed(0)}% · 기부 ${(P.donationRate * 100).toFixed(0)}%`, a.reward + a.don);
    L("인건비", `부문별 인원 ${a.headTotal}명 × 업계 급여 × 사용자 부담 + 자문`, a.pay);
    L("IT 운영비", `유지보수·데이터·보안·클라우드·LLM·블록체인`, a.itOpex);
    L("감가상각", `CAPEX ${finW(a.capex)} 등 ${P.cost2.life}년 정액(취득 연도 반년)`, a.depr);
    L("영업이익(EBIT)", `매출총이익 ${finW(a.gross)} − 판관비 ${finW(a.sga)} − 감가상각 ${finW(a.depr)}`, a.ebit);
    rows.push({
      y, year: FIN_YEAR0 + y, label: finYearLabel(y), membersEnd: a.me, membersPrev: a.mp, newMembers: a.new, grossNew: a.gnew, active: a.active, activeFull: a.activeFull, mktConsent: a.mkt,
      buyers: a.buyers, checkupUsers: a.active, serviceUsers: a.svcU, reservations: a.resv,
      hospitals: a.paid.hospitals, checkupCenters: a.paid.centers, pharmacies: a.paid.pharmacies, insts: a.insts, paidInsts, paidT, subFeeT, subFee: a.subFee.hospitals,
      cac: a.new ? a.mktSum / a.new : 0, effCac: a.new ? a.mktSum / a.new : 0,
      revenue: a.rev, revProduct: a.revP, catRev: Object.fromEntries(Object.keys(a.cat).map((k) => [k, a.cat[k][0]])), cogsProduct: a.cogsP,
      revCheckup: a.revChk, revChkOwn: a.chkOwn * P.chkOwnFee, revChkPtn: a.chkPtn * P.chkPtnFee, revService: a.revSvc, revReservation: a.revResv, revCare: a.revCare,
      revInsurance: a.revIns, revIns: a.revIns, revSub: a.revSub, revEmr: a.revSub, subT: a.subT,
      subSplit: { checkup: a.subT.centers, hospital: a.subT.hospitals, pharmacy: a.subT.pharmacies },
      revAd: 0, revAgent: 0, revApi: 0,
      insC: a.insC, hmCap: a.hmCap, hmPrice: a.hmPrice, hmMarket: a.hmMarket, hmDisc: a.hmDisc, hmFull: a.hmFull, hmBenefit: a.hmBenefit, hmBenefitX: P.hmInvest ? cumBenefit / P.hmInvest : 0,
      careN: a.careN, careCost: a.careCost, chkCogs: a.chkCogs, subCost: a.subCost, payFee: a.payFee, svcCost: a.svcCost,
      cogs: a.cogs, gross: a.gross, reward: a.reward, donation: a.don,
      payroll: a.pay, pay: a.pay, headTotal: a.headTotal, heads: a.heads,
      marketing: a.mktSum, mktSum: a.mktSum, mk1: a.mk1, media: a.media, creative: a.creative, cardAd: a.cardAd, kit: a.kit, sticker: a.sticker, qrfee: a.qrfee,
      cacCost: a.mktSum, brandMkt: 0, launchMkt: 0, mediN: a.mediN, mediRep: a.mediRep,
      itOpex: a.itOpex, rnd: 0, cloud: a.itOpex, gpu: 0, salesCost: a.sales, adminCost: a.admin, otherOpex: a.itOpex + a.sales + a.admin + a.mediRep,
      sga: a.sga, ebitModel: a.ebit_model, ebitda: a.ebit_model, depr: a.depr, ebit: a.ebit, pbt: a.ebit - P.interestYear, tax, net: a.ebit - P.interestYear - tax,
      capex: a.capex, dwc, fcf, mrrEnd, arr: mrrEnd * 12, eff: a.eff,
      opMargin: a.rev ? a.ebit / a.rev : 0, netMargin: a.rev ? (a.ebit - P.interestYear - tax) / a.rev : 0,
      extrapolated: y >= 5, lin,
    });
    void yr;
  }
  return rows;
}

/* 2027 월별 계획(12행) + 실적 열(1~9월, 9월 부분) + 분기 + 준비기간 3개월 */
function finMonthlyY1() {
  const M = fbModel(); const MR = M.monthly; const S = M.asOf;
  const act = S.monthly.actual.filter((r) => r.idx >= 1);
  const rows = [];
  for (let m = 0; m < 12; m++) {
    const ar = act.find((r) => r.idx === m + 1);
    rows.push({ m: m + 1, label: MR.cal[m], add: MR.newM[m], cum: MR.endM[m], rev: MR.rev[m], cogs: MR.cogs[m], opex: MR.sga[m], sga: MR.sga[m], mktSum: MR.mktSum[m], cacCost: MR.mktSum[m],
      depr: MR.depr[m], ebitda: MR.ebitModel[m], op: MR.ebit[m],
      actual: ar ? { cum: ar.members, rev: ar.pl.rev, sga: ar.pl.sga, op: ar.pl.ebit, partial: ar.partial || null } : null });
  }
  const q = [0, 1, 2, 3].map((i) => { const s = rows.slice(i * 3, i * 3 + 3); return { q: i + 1, add: s.reduce((x, r) => x + r.add, 0), cum: s[2].cum, cacCost: s.reduce((x, r) => x + r.cacCost, 0), rev: s.reduce((x, r) => x + r.rev, 0), sga: s.reduce((x, r) => x + r.sga, 0), op: s.reduce((x, r) => x + r.op, 0) }; });
  const pre = M.ledger.plan.filter((r) => r.idx < 1).map((r) => ({ label: r.cal, preExp: r.cf.preExp, deposit: r.cf.oDep, build: r.cf.oBuild, out: r.cf.outTot }));
  const cacTotal = rows.reduce((x, r) => x + r.cacCost, 0);
  return { rows, q, pre, total: M.annual[0].me, cacTotal, asOf: S.date };
}

/* SaaS 구독 — 유형별 유료 기관·월 구독료·MRR(연말)·ARR(2027 = 0) */
function finSaaSModel() {
  const M = fbModel(); const A = M.annual;
  return A.map((a, i) => {
    const prev = i ? A[i - 1] : null;
    const mrrT = {}; FB_TYPES.forEach((t) => { mrrT[t] = a.paid[t] * a.subFee[t]; });
    const mrr = mrrT.centers + mrrT.hospitals + mrrT.pharmacies, arr = mrr * 12;
    const prevArr = prev ? FB_TYPES.reduce((s, t) => s + prev.paid[t] * prev.subFee[t], 0) * 12 : 0;
    const expansion = prev ? FB_TYPES.reduce((s, t) => s + (prev.subFee[t] > 0 ? Math.max(0, a.subFee[t] - prev.subFee[t]) * prev.paid[t] * 12 : 0), 0) : 0;
    return { label: finYearLabel(i), year: FIN_YEAR0 + i, insts: a.paid.centers + a.paid.hospitals + a.paid.pharmacies, paidT: a.paid, subFeeT: a.subFee, subFee: a.subFee.hospitals,
      mrrT, mrr, arr, growth: prevArr ? (arr - prevArr) / prevArr : null, expansion, churn: 0, renewal: 1, recurring: a.revSub, usage: a.revChk + a.revSvc + a.revResv, premium: 0, revSub: a.revSub, effT: a.effT };
  });
}

/* 투자자 KPI — 실효 CAC·LTV(이탈률 18%)·Payback·투자 계획 A/B/C·현재 런웨이 */
function finKPIs() {
  const M = fbModel(); const P = M.P; const A = M.annual; const Y = finYears(5); const S = M.asOf;
  const churn = P.churn;
  const years = A.map((a, i) => {
    const avgM = (a.mp + a.me) / 2; const gm = a.rev ? a.gross / a.rev : 0;
    const arpu = avgM ? a.rev / avgM : 0; const cac = a.new ? a.mktSum / a.new : 0;
    const ltv = arpu * gm / churn; const monthlyGP = avgM ? a.gross / avgM / 12 : 0;
    return { year: FIN_YEAR0 + i, avgMembers: avgM, arpu, grossMargin: gm, cac, ltv, ltvCac: cac ? ltv / cac : null, payback: monthlyGP > 0 ? cac / monthlyGP : null };
  });
  const k3 = years[2], r3 = Y[2], r1 = Y[0], r5 = Y[4];
  const v = finValModel();
  const im = P.imAmt == null ? FB_META.imAmt : P.imAmt;
  const invest = {}; ["A", "B", "C"].forEach((nm) => { const r = M.runs[nm], c = M.cash[nm]; const tr = r.tranche; const runCal = (() => { for (let j = 0; j < 84; j++) if (tr.t1 + c.cum[j] < 0) return c.cal[j]; return null; })();
    invest[nm] = { low: r.low, lowAt: r.low_at, lowCal: r.low < 0 ? c.cal[r.lowIdx] : null, need: r.need, req: r.req, buffer: r.buffer, t1: tr.t1, t2: tr.t2, t1RunOut: tr.t1RunOut, t1RunOutCal: runCal, runway: r.runway, preExp: r.pre_exp }; });
  const growthY3 = Y[1].revenue ? (r3.revenue - Y[1].revenue) / Y[1].revenue : 0;
  return {
    cac: Math.round(years[0].cac), cacByYear: years.map((x) => x.cac), ltv: Math.round(k3.ltv), ltvCac: k3.ltvCac, arpu: k3.arpu, arppu: r3.revenue / Math.max(1, r3.buyers), grossMargin: k3.grossMargin,
    opMargin: r3.opMargin, ebitda3: r3.ebitda, ebit3: r3.ebit, payback: k3.payback, years, ltvFormula: "LTV = (연 매출 ÷ 평균 회원) × 매출총이익률 ÷ 이탈률 " + Math.round(churn * 100) + "%",
    burn1: -S.kpi.burn3m, burn3m: S.kpi.burn3m, runway: S.kpi.runwayMonths == null ? Infinity : S.kpi.runwayMonths, cashAsOf: S.bs.actual.cash,
    magic: r1.marketing ? (Y[1].arr - r1.arr) / r1.marketing : null, rule40: growthY3 * 100 + (r3.revenue ? r3.ebitda / r3.revenue : 0) * 100,
    ev: v.evDCF, evRev: v.evRev, evSales: v.evRevMultiple, roi5: r5.net / im, roic3: (r3.ebit * (1 - P.taxRate)) / im, churn, invest, investDefault: "B", im,
  };
}

/* 기업가치 — 2027~2031 FCF(엑셀 산식) DCF + EV/Rev·EV/EBITDA(상각 전) */
function finValModel() {
  const M = fbModel(); const P = M.P; const yr = M.yr; let pvSum = 0; const disc = [];
  for (let i = 0; i < 5; i++) { const df = 1 / Math.pow(1 + P.wacc, i + 1), pv = yr.fcf[i] * df; pvSum += pv; disc.push({ y: finYearLabel(i), year: FIN_YEAR0 + i, fcf: yr.fcf[i], df, pv }); }
  const lastFcf = yr.fcf[4], terminal = lastFcf * (1 + P.termGrowth) / (P.wacc - P.termGrowth), pvTerminal = terminal / Math.pow(1 + P.wacc, 5), evDCF = pvSum + pvTerminal;
  const lastRevenue = yr.rev[4], lastEbitda = yr.ebitModel[4];
  const im = P.imAmt == null ? FB_META.imAmt : P.imAmt;
  return { disc, pvSum, terminal, pvTerminal, evDCF, evRev: lastRevenue * P.evRevMultiple, evEbitda: Math.max(0, lastEbitda) * P.evEbitdaMultiple, wacc: P.wacc, termGrowth: P.termGrowth,
    evRevMultiple: P.evRevMultiple, evEbitdaMultiple: P.evEbitdaMultiple, lastRevenue, lastEbitda, lastFcf, lastNet: finYears(5)[4].net, im };
}

/* 연말 계획 재무상태표(2027~2031) — 원장 롤포워드(대차 일치) */
function finBSYear(yi) {
  const M = fbModel(); const y = Math.max(0, Math.min(4, yi || 0));
  const row = M.ledger.plan.find((r) => r.idx === (y + 1) * 12); const b = row.bs;
  const r = finYears(5)[y];
  return { r, cal: row.cal, assets: b.assets, cash: b.cash, receivable: b.ar, deposit: b.deposit, cip: b.cip, ppe: b.ppe, intangible: b.ppe, wcAsset: b.wcAsset, curAssets: b.curAssets, nonCurAssets: b.nonCurAssets,
    taxPay: b.taxPay, curLiab: b.taxPay, nonCurLiab: 0, liabilities: b.liabilities, capital: b.capital, retained: b.re, retainedPL: b.rePL, retainedPre: b.rePre, retainedOff: b.reOff, equity: b.equity, diff: b.diff,
    subReceivable: 0, contractAsset: 0, inventory: 0, prepaid: 0, platformAsset: 0, softwareAsset: 0, aiModelAsset: 0, dataAsset: 0, cloudAsset: 0, devCost: 0,
    contractLiab: 0, donationPay: 0, tradePay: 0, deposits: 0, deferredRev: 0, leaseLiab: 0, longDebt: 0, surplus: 0,
    debtRatio: b.equity ? b.liabilities / b.equity : 0, currentRatio: b.taxPay ? b.curAssets / b.taxPay : 0, equityRatio: b.assets ? b.equity / b.assets : 0, roe: b.equity ? r.net / b.equity : 0 };
}
/* 연도 계획 현금흐름표 — 영업·투자·재무, 기말현금 = B/S 현금 */
function finCFYear(yi) {
  const M = fbModel(); const y = Math.max(0, Math.min(4, yi || 0));
  const L = M.ledger.plan; const s = fbLedgerSum(L, y * 12 + 1, (y + 1) * 12, null);
  const beg = L.find((r) => r.idx === y * 12).bs.cash; const r = finYears(5)[y];
  const opCF = s.cf.opCF, invCF = s.cf.invCF, finCF = s.cf.finCF;
  return { year: FIN_YEAR0 + y, opCF, invCF, finCF, begCash: beg, endCash: beg + opCF + invCF + finCF, net: r.net, dep: r.depr, inTot: s.cf.inTot, outTot: s.cf.outTot,
    subCollect: s.cf.inSub, insCollect: s.cf.inIns, mktCollect: s.cf.inP + s.cf.inChk + s.cf.inSvc + s.cf.inResv + s.cf.inCare,
    cacOut: -s.cf.oMkt - s.cf.oMedia, mktOut: 0, cloudOut: -s.cf.oOpex, rndOut: 0, capexOut: -s.cf.oCapex, taxOut: -s.cf.oTax, offPL: -s.cf.offPL };
}

/* 재무회계 온톨로지 사슬(v3.8) — field가 null인 노드는 화면(FinGraphPanel nodeVal)에서 계산: acq = mktSum + mediRep, ocf = finCFYear(yr).opCF, inv·ev = KPI */
const FIN_GRAPH = [
  { k: "acq", label: "인피니티케어·메디에이지·온라인 광고", c: "#F59E0B", field: null }, { k: "members", label: "회원", c: "#22D3EE", field: "membersEnd" },
  { k: "consent", label: "검진 예약·마케팅 동의", c: "#34D399", field: "mktConsent" }, { k: "checkup", label: "건강검진 연계·헬스메이트센터 DB 공급", c: "#2DD4BF", field: "insC" },
  { k: "hm", label: "헬스메이트센터 사용료", c: "#6366F1", field: "revInsurance" }, { k: "inst", label: "제휴 기관 → AI 플랫폼 구독(2028~)", c: "#A78BFA", field: "revSub" },
  { k: "care", label: "돌봄 리드 → 파트너 센터", c: "#F472B6", field: "revCare" }, { k: "rev", label: "매출", c: "#FBBF24", field: "revenue" },
  { k: "ocf", label: "영업현금흐름", c: "#FB923C", field: null }, { k: "inv", label: "투자금·런웨이", c: "#E11D48", field: null }, { k: "ev", label: "기업가치(EV)", c: "#EAB308", field: null },
];

/* 문구 생성 헬퍼 — 정책·숫자는 모두 P·엔진에서 만든다(고정 문구 금지) */
const FIN_STREAM_KO = { P: "커머스", Chk: "검진", Resv: "예약", Svc: "서비스", Care: "돌봄", Sub: "구독", Ins: "사용료" };
const finPct0 = (x) => `${+(x * 100).toFixed(2)}%`;
/* 줄별 개시 월 = startF[key]에서 처음 0이 아닌 달(1~12), 없으면 null */
function finStartMonth(P, key) { const f = (P.startF || {})[key] || []; for (let i = 0; i < f.length; i++) if (f[i] > 0) return i + 1; return null; }
/* 구독 과금 개시 연도(달력) = 유형별 subStartYear(연차) 최솟값 */
function finSubStartCal(P) { const s = FB_TYPES.map((t) => ((P.subStartYear || {})[t] == null ? 2 : P.subStartYear[t])); return FIN_YEAR0 - 1 + Math.min.apply(null, s); }
/* 10개년 외삽 라벨 — fbExtendP와 같은 기본값 */
function finExtrapNote(P) {
  const g = P.tenYearGrowth == null ? 0.18 : P.tenYearGrowth, gi = P.instGrowthAfter5 == null ? 0.10 : P.instGrowthAfter5;
  return `${FIN_YEAR0 + 5}~${FIN_YEAR0 + 9}년 외삽(회원 연 ${finPct0(g)}·기관 연 ${finPct0(gi)}·비율은 ${FIN_YEAR0 + 4}년 수준 유지)`;
}
/* 유형별 구독료 인상 규칙 */
function finFeeRule(P, t) {
  const st = (P.subFeeStepT || {})[t] || 0, rt = (P.subFeeRateT || {})[t] || 0; const parts = [];
  if (st) parts.push(`매년 +${finW(st)}원`); if (rt) parts.push(`연 ${finPct0(rt)} 복리`);
  return `${FIN_TYPE_KO[t]} ${parts.length ? parts.join(" · ") : "동결"}`;
}
/* 2027 줄별 개시 시점 문구 — "검진·예약·사용료 4월, 커머스·돌봄 7월"(매출 0인 줄·구독 제외) */
function finStartNote(P, a) {
  const revOf = { P: a.revP, Chk: a.revChk, Resv: a.revResv, Svc: a.revSvc, Care: a.revCare, Ins: a.revIns };
  const byM = {}; ["Chk", "Resv", "Ins", "P", "Svc", "Care"].forEach((k) => { const m = finStartMonth(P, k); if (m == null || !revOf[k]) return; (byM[m] = byM[m] || []).push(FIN_STREAM_KO[k]); });
  return Object.keys(byM).map(Number).sort((x, y) => x - y).map((m) => `${byM[m].join("·")} ${m}월`).join(", ");
}

/* 하이 재무 질의(관리자 전용 — aiNative 게이트) — 반환 { intent, lines, buttons, nav } */
function finAsk(text) {
  const t = String(text || "").replace(/\s/g, "");
  if (!t) return null;
  const M = fbModel(); const P = M.P; const S = M.asOf;
  const pct = (x) => (x * 100).toFixed(1) + "%";
  const done = (intent, lines) => ({ intent, lines: lines.filter(Boolean), buttons: ["2027년 매출은?", "현재 실적은?", "투자금·트랜치는?", "런웨이는?"], nav: { key: "ontology", label: "재무회계 온톨로지" } });
  // 연도 — "20XX년"(범위 밖이면 안내) · "N차" · 올해/금년 · 내년 · 없으면 기준일 연도
  let yi = 0;
  const yc = t.match(/(?:^|[^0-9])(20[0-9]{2})(?![0-9])/); const yn = t.match(/(?:^|[^0-9])(10|[1-9])차/);
  if (yc) {
    const cy = +yc[1];
    if (cy < FIN_YEAR0 || cy > FIN_YEAR0 + 9) return done("range", [`재무 엔진은 ${FIN_YEAR0}~${FIN_YEAR0 + 9}년(1~10차)만 계산해요 — ${cy}년은 범위 밖이에요.`,
      cy === FIN_YEAR0 - 1 ? `${cy}년은 서비스 개시 전 준비기간(10~12월)이라 매출은 없고, 준비기간 비용 ${finW(M.runs.A.pre_exp)}원이 결손금으로 이월돼요.` : null]);
    yi = cy - FIN_YEAR0;
  } else if (yn) yi = +yn[1] - 1;
  else if (/내년/.test(t)) yi = 1;
  const rows = finYears(10); const r = rows[yi];
  const scn = P.scnMeta.label + " 시나리오";
  const K = () => finKPIs();
  const extrap = r.extrapolated ? ` — ${finExtrapNote(P)}` : "";
  const subLike = /구독|EMR|플랫폼(사용료|요금|이용료)|기관(사용료|이용료)|사용료정책/i.test(t) && !/헬스메이트/.test(t);
  const lines = [];
  if (/투자금|투자액|요청액|트랜치|투자요청|투자규모|펀딩|\bIM\b/i.test(t)) {
    const I = K().invest; const b = I.B;
    return done("invest", [`투자 요청액은 ${finW(b.req)}원(B 계획 · IM 금액 ${finW(P.imAmt == null ? FB_META.imAmt : P.imAmt)}원)이에요 — 1차 ${finW(b.t1)}원(${FB_INVEST_CAL.t1} 납입) · 2차 ${finW(b.t2)}원(${FB_INVEST_CAL.t2}까지 납입).`,
      `필요 총자금 ${finW(b.need)}원 = 누적 현금 저점 ${finW(-b.low)}원(${b.lowCal || "저점 없음"}) + 안전 버퍼 ${finW(b.buffer)}원. ${b.t1RunOutCal ? `1차만 받았다면 ${b.t1RunOutCal}에 소진이라 2차가 그 전에 들어와야 해요.` : "1차만으로도 소진되지 않아요."} 저점·소진 월은 B 계획 자체 달력 기준이고, 재무상태표 납입 시점(${FB_INVEST_CAL.t1}·${FB_INVEST_CAL.t2})은 A 계획 달력 기준이에요. 차입·이자는 없어요.`,
      `참고 — A 계획 요청 ${finW(I.A.req)}원 · C 계획 ${finW(I.C.req)}원.`]);
  }
  if (/런웨이|현금|잔액|소진|저점|번레이트|burn|runway/i.test(t)) {
    const k = S.kpi; const rw = M.runs.B.runway;
    return done("cash", [`기준일 ${S.date} 현금 잔액은 ${finW(S.bs.actual.cash)}원(실적, 납입 ${finW(S.bs.actual.capital)}원 포함)이에요.`,
      k.runwayMonths == null ? `최근 3개월 현금흐름이 순유입이라 런웨이는 흑자 상태예요.` : `최근 3개월 평균 순유출 ${finW(k.burn3m)}원 기준 런웨이는 약 ${k.runwayMonths.toFixed(1)}개월이에요.`,
      `계획(A) 누적 현금 저점은 ${finW(-k.lowPlan)}원(${k.lowPlanCal || "저점 없음"})이에요. ` + (rw === "소진 없음" ? `계획상 요청액(B)을 조달하면 ${FIN_YEAR0}~${FIN_YEAR0 + 4}년 동안 현금이 소진되지 않아요.` : `계획상 요청액(B)을 조달해도 ${rw}에 현금이 소진돼요.`)]);
  }
  if (/회원|가입|인피니티케어|메디에이지/.test(t) && !/실적|달성|매출|이익|헬스메이트/.test(t)) {
    const a0 = M.annual[0];
    return done("members", [`현재(${S.date}) 회원은 ${S.actualMembers.toLocaleString()}명으로, 계획 ${Math.round(S.planMembers).toLocaleString()}명 대비 ${pct(S.achieveMembers)}예요.`,
      `${FIN_YEAR0} 연말 목표 ${a0.me.toLocaleString()}명 — 인피니티케어 연계 ${P.infinityVolume.toLocaleString()}명 + 메디에이지 경유 ${a0.mediN.toLocaleString()}명(리포트 ${a0.mediN.toLocaleString()}건 × ${finW(P.cost2.mediFee)}원 = ${finW(a0.mediRep)}원). 온라인 타겟 광고로 모이는 회원은 목표에 넣지 않은 상향 요인이에요.`,
      `연말 회원 경로: ${M.annual.map((a, i) => `${FIN_YEAR0 + i} ${(a.me / 10000).toLocaleString()}만`).join(" · ")}.`]);
  }
  if (/실적|달성|현재|지금|기준일|YTD/i.test(t)) {
    const p = S.ytd.plan, a = S.ytd.actual;
    return done("actual", [`기준일 ${S.date}까지(${FIN_YEAR0}-01-01~) 실적 매출 ${finW(a.rev)}원 · 영업이익 ${finW(a.ebit)}원이에요 — 계획 매출 ${finW(p.rev)}원 대비 ${pct(a.rev / p.rev)} 달성.`,
      `회원 ${S.actualMembers.toLocaleString()}명(계획 ${Math.round(S.planMembers).toLocaleString()}명 · ${pct(S.achieveMembers)}) 기준으로 회원 연동 매출·비용은 계획 × ${S.k.toFixed(3)}, 고정비는 계획대로 반영했어요.`,
      `실적 현금 잔액 ${finW(S.bs.actual.cash)}원 · 계획 ${finW(S.bs.plan.cash)}원.`]);
  }
  if (/헬스메이트|DB/i.test(t) || (/사용료/.test(t) && !subLike)) {
    const a = M.annual10[yi];
    const capTxt = P.hmCapStep ? `${r.year}년 우대 한도 ${finW(a.hmCap)} 건` : `우대 한도 매년 ${finW(a.hmCap)} 건`;
    return done("hm", [`헬스메이트센터 사용료: 우대 단가 ${finW(a.hmPrice)}원(시가 ${finW(a.hmMarket)}원의 ${Math.round(a.hmMarket ? a.hmPrice / a.hmMarket * 100 : 0)}%) · ${capTxt}, 한도를 넘는 공급은 시가 ${finW(a.hmMarket)}원이에요.`,
      `${r.year}년(${scn}) DB 공급 ${a.insC.toLocaleString()}건 → 사용료 ${finW(a.revIns)}원(우대 ${a.hmDisc.toLocaleString()}건 + 시가 ${a.hmFull.toLocaleString()}건)${extrap}.`,
      `연도별: ${M.annual.map((x, i) => `${FIN_YEAR0 + i} ${finW(x.revIns)}`).join(" · ")}.`]);
  }
  if (subLike) {
    const sy = finSubStartCal(P); const syi = sy - FIN_YEAR0; const aS = M.annual10[Math.max(0, Math.min(9, syi))], a4 = M.annual[4];
    const free = syi > 0 ? `${FIN_YEAR0}${syi > 1 ? `~${sy - 1}` : ""}년은 전 기관 무료, ${sy}년부터 과금해요` : `${FIN_YEAR0}년부터 과금해요`;
    return done("sub", [`AI 플랫폼 구독료는 기관 유형별이고 ${free}` + (syi <= 9 ? ` — ${sy} 월 ${FB_TYPES.map((x) => `${FIN_TYPE_KO[x]} ${finW(aS.subFee[x])}원`).join(" · ")}.` : "."),
      `인상: ${FB_TYPES.map((x) => finFeeRule(P, x)).join(" · ")} · 상한 월 ${finW(P.subFeeCap)}원 → ${FIN_YEAR0 + 4} ${FB_TYPES.map((x) => `${FIN_TYPE_KO[x]} ${finW(a4.subFee[x])}원`).join(" · ")}.`,
      `구독 매출: ${M.annual.map((x, i) => `${FIN_YEAR0 + i} ${finW(x.revSub)}`).join(" · ")}.`]);
  }
  if (/돌봄|재가|요양/.test(t)) {
    return done("care", [`재가·돌봄 파트너 이용료는 센터당 월 ${finW(P.careFee)}원 정액이에요 — 파트너 센터·월 ${((M.annual10[yi] || {}).careN == null) ? "-" : M.annual10[yi].careN.toLocaleString()} × 월 ${finW(P.careFee)}원. ${r.year}년 매출 ${finW(r.revCare)}원${extrap}.`,
      `연도별: ${M.annual.map((x, i) => `${FIN_YEAR0 + i} ${finW(x.revCare)}`).join(" · ")}.`]);
  }
  if (/LTV|엘티비|CAC|획득비|확보비|페이백|payback/i.test(t)) {
    const k = K(); const y0 = k.years[0], y2 = k.years[2];
    return done("ltv", [`실효 CAC(마케팅 합계 ÷ 순증)는 ${y0.year}년 ${Math.round(y0.cac).toLocaleString()}원이에요 — 연도별 ${k.years.map((x) => `${x.year} ${Math.round(x.cac).toLocaleString()}원`).join(" · ")}.`,
      `LTV/CAC: ${y2.year}년 LTV ${finW(k.ltv)}원 ÷ CAC ${Math.round(y2.cac).toLocaleString()}원 = ${k.ltvCac == null ? "-" : k.ltvCac.toFixed(1) + "배"}, 회수 ${k.payback ? k.payback.toFixed(1) : "-"}개월 (${k.ltvFormula}).`]);
  }
  if (/기업가치|회사가치|밸류|가치평가|\bEV\b|DCF/i.test(t)) {
    const V = finValModel();
    return done("ev", [`기업가치(EV)는 DCF ${finW(V.evDCF)}원(WACC ${finPct0(V.wacc)} · 영구성장 ${finPct0(V.termGrowth)}, ${FIN_YEAR0}~${FIN_YEAR0 + 4} FCF)이에요.`,
      `멀티플: EV/매출 ${V.evRevMultiple}x ${finW(V.evRev)}원 · EV/EBITDA ${V.evEbitdaMultiple}x ${finW(V.evEbitda)}원(${FIN_YEAR0 + 4} 기준). 투자 요청 ${finW(V.im)}원 대비 참고용 가정이에요.`]);
  }
  if (/원가|비용|마케팅비|광고비|인건비|판관비|급여|IT운영/i.test(t)) {
    const a = M.annual10[yi];
    return done("cost", [`${r.year}년(${scn}) 매출원가 ${finW(a.cogs)}원 · 판관비 ${finW(a.sga)}원이에요${extrap}.`,
      `판관비 구성: 인건비 ${finW(a.pay)}(${a.headTotal.toLocaleString()}명) · 마케팅 ${finW(a.mktSum)}(온라인 타겟 광고 ${finW(a.media)}) · 메디에이지 리포트 ${finW(a.mediRep)} · 포인트 적립·기부 ${finW(a.reward + a.don)} · IT 운영비 ${finW(a.itOpex)} · 영업·관리 ${finW(a.sales + a.admin)}.`,
      `감가상각 ${finW(a.depr)}원 · 영업이익 ${finW(a.ebit)}원.`]);
  }
  if (/영업이익|이익|손익|적자|흑자|순이익|EBITDA/i.test(t)) {
    return done("profit", [`${r.year}년(${scn}) 영업이익은 ${finW(r.ebit)}원(이익률 ${pct(r.opMargin)} · 상각 전 ${finW(r.ebitda)}원), 당기순이익 ${finW(r.net)}원이에요${extrap}.`,
      `근거: ${r.lin[r.lin.length - 1].formula}.`]);
  }
  if (/매출|수익|revenue/i.test(t)) {
    const sy = finSubStartCal(P);
    return done("revenue", [`${r.year}년(${scn}) 예상 매출은 ${finW(r.revenue)}원이에요 — 제품 ${finW(r.revProduct)} · 헬스메이트센터 사용료 ${finW(r.revInsurance)} · 건강검진 연계 ${finW(r.revCheckup)} · 예약 ${finW(r.revReservation)} · 구독 ${finW(r.revSub)} · 돌봄 ${finW(r.revCare)}${extrap}.`,
      r.y === 0 ? `${FIN_YEAR0}년은 줄마다 개시 시점(${finStartNote(P, M.annual[0])})을 반영했고 구독은 ${sy > FIN_YEAR0 ? `${sy}년부터 과금해요` : "첫해부터 과금해요"}. 기준일 실적은 "현재 실적은?"으로 물어봐 주세요.` : null]);
  }
  return null;
}

/* 검사·문서화 훅 — 재무 수치를 문서에 옮길 때 재구현하지 않고 모델을 실행해 가져온다 */
try {
  if (typeof window !== "undefined") {
    window.__hifinFin = finAsk;
    window.__hifinFinModel = {
      years: (n) => { try { return finYears(n || 5); } catch (e) { return { err: String(e) }; } },
      params: () => { try { return finParams(); } catch (e) { return { err: String(e) }; } },
      scenario: () => { try { return finScenario(); } catch (e) { return "base"; } },
      kpis: () => { try { return finKPIs(); } catch (e) { return null; } },
      model: () => { try { return fbModel(); } catch (e) { return { err: String(e) }; } },
      asOf: () => { try { return fbModel().asOf; } catch (e) { return { err: String(e) }; } },
    };
  }
} catch (e) {}
