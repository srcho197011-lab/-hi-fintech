/* ══════════ 사이트 재무회계 엔진(finBudget) — 투자금 산정 예산양식 v3.8의 JS 이식 ══════════
   원천(한 줄씩 옮김): scripts/invest/adjust.py(회원·반영률·구독료·검진 채널·사용료) · costs.py(인력·마케팅·IT·CAPEX)
   · oracle.py annual(cost2 분기) · oracle3.py run(현금 계획 A/B/C) · gen_budget.py(월별예산·현금 계정 분해·월별자금필요표·인력계획·투자조건·FCF).
   입력: finBudgetParams.js(FB_P0·FB_LEVERS·FB_META — 생성물). 회귀: node scripts/fin_site_check.mjs(정답 scripts/fin_site_golden.json).
   규칙: 전역 이름은 fb 접두사 · 최상위 즉시 실행 없음(함수 선언만, 캐시는 lazy) · 단위 원 · 월 인덱스는 아래 주석.
   ─ 기간 번호(idx): A 계획 기준 1 = 2027-01(오픈 첫 달), 0·−1·−2 = 2026-12·11·10(준비기간). 현금 표 84열 j = idx + 23(준비 24열 + 본 60열).
   ─ 월별 손익 t = 0..59 = 2027-01..2031-12. 연차 y = 0..4 = 2027..2031(10개년은 ~2036). */

const FB_TYPES = ["centers", "hospitals", "pharmacies"];
const FB_TYPE_SHORT = { centers: "c", hospitals: "h", pharmacies: "p" };
const FB_STREAM_KEYS = ["P", "Chk", "Resv", "Svc", "Care", "Sub", "Ins"];
const FB_ASOF = { date: "2027-09-17", y: 0, m: 8, idx: 9, frac: 17 / 30, actualMembers: 100000 };
const FB_MK1_QUARTERS = 4;                // 메디에이지 검진 시기 안내 발송 분기 수(연 4분기 — 예산양식 산식)
const FB_WC_RATE = 0.02;                 // 연간 FCF 메모용 운전자본 증가율(예산양식 가정 ⑨ — 현금 표는 회수 지연을 명시해 0)
const FB_INVEST_CAL = { t1: "2026-10", t2: "2027-08" };   // 실적·재무상태표 납입 시점(1차 = 준비 첫 달 전, 2차 = 8월까지)
const FB_PARAMS_KEY = "hifin_fin_params_v38";
const FB_SCN_KEY = "hifin_fin_scn";
const FB_SCENARIOS = {
  cons: { label: "보수적", memberMult: 0.6, instMult: 0.6, rateMult: 0.85, cacMult: 1.4, feeMult: 1.0, c: "#F59E0B" },
  base: { label: "기준", memberMult: 1, instMult: 1, rateMult: 1, cacMult: 1, feeMult: 1, c: "#34D399" },
  aggr: { label: "공격적", memberMult: 1.3, instMult: 1.25, rateMult: 1.1, cacMult: 0.9, feeMult: 1.0, c: "#F472B6" },
};
/* 파라미터 화면 필드와 1:1 — 오버라이드 허용 키 */
const FB_OVERRIDE_KEYS = ["members1", "members2", "members3", "members4", "members5", "activeAbs1", "activeAbs2", "activeAbs3", "activeAbs4", "activeAbs5",
  "productBuyerRate", "productCapture", "prodAdjY1", "subFeeBase_c", "subFeeBase_h", "subFeeBase_p", "subStart", "chkOwnFee", "chkPtnFee", "chkOwnShareY1",
  "hmMarket", "hmRate1", "hmCap1", "rewardRate", "donationRate", "careFee", "headElast", "wageGrowth", "mk2Impr", "maintRate", "t1Rate", "actualMembers",
  "wacc", "evRevMultiple", "tenYearGrowth"];

/* ─────────────── 공통 ─────────────── */
function fbXround(x) { return Math.floor(Number(Number(x).toFixed(7)) + 0.5); }          // 파이썬 floor(round(x,7)+0.5) = 엑셀 ROUND(x,0)
function fbJround(x) { return Math.floor(x + 0.5); }                                        // JS Math.round(파이썬 jround)
function fbRound6(x) { return Number(Number(x).toFixed(6)); }
function fbSum(arr) { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i]; return s; }
function fbPmod(a, n) { return ((a % n) + n) % n; }
function fbClone(o) { return JSON.parse(JSON.stringify(o)); }
function fbOnes12() { return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; }
function fbBasis(key) { const s = FB_META.streams.find((x) => x[0] === key); return s ? s[2] : "member"; }
/* A 계획 기간 번호 → 달력 월("2027-01" = 1) */
function fbCal(idx, startYm) {
  const base = startYm || "2027-01"; const y0 = +base.slice(0, 4), m0 = +base.slice(5, 7) - 1;
  const tot = y0 * 12 + m0 + (idx - 1); return `${Math.floor(tot / 12)}-${String(tot % 12 + 1).padStart(2, "0")}`;
}

/* ─────────────── adjust.py ─────────────── */
function fbMemberEnds(P, y) {
  const me = P.membersEnd[y], mp = y === 0 ? 0 : P.membersEnd[y - 1];
  const nw = Math.max(0, me - mp);
  const ramp = y === 0 ? P.m1Ramp : fbOnes12();
  const rs = fbSum(ramp);
  const ends = []; let c = mp;
  for (let m = 0; m < 12; m++) { c += rs === 0 ? nw / 12 : nw * ramp[m] / rs; ends.push(c); }
  return { ends, me };
}
function fbMemberWeights(P, y) {
  const ends = fbMemberEnds(P, y).ends; const W = fbSum(ends);
  return ends.map((e) => (W === 0 ? 1 / 12 : e / W));
}
function fbSeasonNorm(P) {
  const s = P.chkSeason; const S = fbSum(s);
  return S === 0 ? fbOnes12() : s.map((v) => v * 12 / S);
}
function fbPaidCount(P, t, y) {
  const cnt = { centers: P.checkupCenters, hospitals: P.hospitals, pharmacies: P.pharmacies }[t][y];
  return Math.floor(cnt * P.subPaidRate + 0.5);
}
function fbSubTypeEff(P, t, y) {
  const mode = P.revMode == null ? 2 : P.revMode;
  if (y === 0) return fbStreamWeights(P, 0, "Sub").eff;
  if (mode !== 2) return 1;
  const cur = fbPaidCount(P, t, y), prev = fbPaidCount(P, t, y - 1);
  return cur === 0 ? 0 : prev / cur + (1 - prev / cur) * 78 / 144;
}
/* 매출 줄 월 배분 — {b 월 기준, g 개시 반영, eff 연 반영률, a 월 배분} */
function fbStreamWeights(P, y, key) {
  const basis = fbBasis(key);
  const mode = P.revMode == null ? 2 : P.revMode;
  const { ends, me } = fbMemberEnds(P, y);
  const w = fbMemberWeights(P, y);
  const S = basis === "season" ? fbSeasonNorm(P) : fbOnes12();
  const k = ends.map((e) => (me === 0 ? 0 : e / me));
  const stock = (y === 0 || mode === 2);
  let b;
  if (basis === "flat" && !(y === 0 || mode !== 2)) {
    const full = {}; for (const t of FB_TYPES) full[t] = fbPaidCount(P, t, y) * fbFee(P, t, y) * 12;
    let SS = 0; for (const t of FB_TYPES) SS += full[t];
    b = [];
    for (let m = 0; m < 12; m++) {
      let num = 0;
      for (const t of FB_TYPES) {
        const cur = fbPaidCount(P, t, y), prev = fbPaidCount(P, t, y - 1);
        const kt = cur === 0 ? 0 : (prev + (cur - prev) * (m + 1) / 12) / cur;
        num += full[t] * kt;
      }
      b.push(SS === 0 ? 0 : num / 12 / SS);
    }
  } else if (basis === "flat") {
    b = fbOnes12().map(() => 1 / 12);
  } else if (stock) {
    b = k.map((v, m) => v * S[m] / 12);
  } else {
    const ws = w.map((v, m) => v * S[m]); const T = fbSum(ws);
    b = T === 0 ? w : ws.map((v) => v / T);
  }
  let F;
  if (y === 0) F = P.startF[key];
  else { const arr = (P.matureY || {})[key]; const f = arr && arr[y] != null ? arr[y] : 1; F = fbOnes12().map(() => f); }
  const g = b.map((v, m) => v * F[m]);
  const Gs = fbSum(g);
  let eff = (y > 0 && mode !== 2) ? 1 : Gs;
  if (key === "Ins" && y === 0 && (P.insFullY1 || 0) === 1) eff = 1.0;
  if (key === "P" && y === 0) eff *= (P.prodAdjY1 == null ? 1.0 : P.prodAdjY1);
  const a = Gs === 0 ? w : g.map((v) => v / Gs);
  return { b, g, eff, a };
}
function fbFee(P, t, y) {
  const start = (P.subStartYear || {})[t] == null ? 2 : P.subStartYear[t];
  if (y + 1 < start) return 0;
  const k = Math.max(0, y - 1);
  const v = P.subFeeBaseT[t] * Math.pow(1 + P.subFeeRateT[t], k) + P.subFeeStepT[t] * k;
  return Math.min(P.subFeeCap, fbXround(v));
}
function fbOwnShare(P, y) { return Math.min(1.0, fbRound6(P.chkOwnShareY1 + P.chkOwnShareStep * y)); }
function fbCheckup(P, y, active) {
  const own = fbXround(active * fbOwnShare(P, y));
  const ptn = active - own;
  return { own, ptn, rev: own * P.chkOwnFee + ptn * P.chkPtnFee, cost: own * P.chkOwnCost + ptn * P.chkPtnCost };
}
function fbHmTerms(P, y) {
  const cap = Math.max(0, P.hmCap1 + P.hmCapStep * y);
  const price = Math.max(0, Math.min(P.hmMarket, fbXround(P.hmMarket * P.hmRate1) + P.hmPriceStep * y));
  return { cap, price, mkt: P.hmMarket };
}
function fbHmFee(P, y, cases) {
  const { cap, price, mkt } = fbHmTerms(P, y);
  const disc = Math.min(cases, cap); const full = cases - disc;
  return { disc, full, fee: disc * price + full * mkt, benefit: disc * (mkt - price) };
}

/* ─────────────── costs.py ─────────────── */
function fbMediDbCum(C, months) {
  const n = C.mediMonths || 12;
  return fbXround((C.mediDb || 0) * Math.min(1.0, Math.max(0.0, months / n)));
}
function fbMediReport(P, C, rows, a, y) {
  const gnew = a.new + fbXround(a.mp * (P.churn || 0));
  a.gnew = gnew;
  let prev = 0; for (const r of rows) prev += (r.mediN || 0);
  const cap = Math.max(0, fbMediDbCum(C, (y + 1) * 12) - prev);
  const via = Math.max(0, gnew - (P.infinityVolume || 0));
  const want = y < (C.mediYears == null ? 1 : C.mediYears) ? fbXround(via * (C.mediShare == null ? 1.0 : C.mediShare) * (C.mediPer == null ? 1 : C.mediPer)) : 0;
  a.mediN = Math.min(want, cap);
  a.mediRep = fbXround(a.mediN * (C.mediFee || 0));
}
function fbDriver(a, k) {
  if (k == null) return 1;
  if (k === "catNutri") return a.cat.supp[0] + a.cat.diet[0];
  if (k === "catDevice") return a.cat.device[0];
  if (k === "catSports") return a.cat.sports[0] + a.revResv;
  if (k === "insC") return a.insC;
  return a[k];
}
function fbDriverBase(P, a, k) {
  if (k === "catNutri") return a.catFull.supp + a.catFull.diet;
  if (k === "catDevice") return a.catFull.device;
  if (k === "catSports") return a.catFull.sports + a.revResvFull;
  if (k === "rev") return a.revFull;
  if (k === "active") return a.activeFull;
  if (k === "insC") return a.insCFull;
  return fbDriver(a, k);
}
function fbHeads(P, C, rows, a, y) {
  const out = {}; const first = y > 0 ? rows[0] : a;
  for (const s of C.sections) {
    const key = s[0], h1 = s[2], dk = s[3];
    if (y === 0 || dk == null) { out[key] = h1; continue; }
    const d1 = fbDriverBase(P, first, dk), dy = fbDriver(a, dk);
    if (d1 <= 0) { out[key] = h1; continue; }
    const v = fbRound6(h1 * Math.pow(dy / d1, C.headElast));
    out[key] = Math.max(h1, Math.ceil(v));
  }
  return out;
}
function fbBurdenMult(C, y) {
  let s = 0; for (const bk of FB_META.burdenKeys) if (bk[0] !== "pension") s += C.burden[bk[0]];
  return 1 + C.pensionY[y] + s;
}
function fbBlendCpm(C) {
  let s = 0.0;
  for (const ch of FB_META.channels) {
    const k = ch[0];
    const cpm = k === "naver" ? C.naverCpc * C.naverCtr * 1000 : C.chCpm[k];
    const sh = C.chShare[k];
    if (sh > 0 && cpm <= 0) return 0.0;
    if (sh > 0) s += sh / cpm;
  }
  return s ? 1 / s : 0.0;
}
function fbSwBuild(C, y) {
  if (y === 0) { let s = 0; for (const k of Object.keys(C.aiModule)) s += C.aiModule[k]; return s + C.aiCommon + C.capexLater[0]; }
  return C.capexLater[y];
}
function fbAnnualCosts(P, rows, a, y) {
  const C = P.cost2; const first = y > 0 ? rows[0] : a;
  const hd = fbHeads(P, C, rows, a, y);
  const mult = fbBurdenMult(C, y);
  const payS = {};
  for (const s of C.sections) {
    const key = s[0], base = s[4]; const gy = Math.pow(1 + C.wageGrowth, y);
    payS[key] = fbXround(hd[key] * (base * gy * mult + C.welfareMonth * 12 * gy));
  }
  const adv = fbXround(C.advisors * C.advisorFee * 12);
  a.heads = hd; let ht = 0; for (const k of Object.keys(hd)) ht += hd[k]; a.headTotal = ht; a.pay_s = payS; a.advisor = adv;
  let ps = 0; for (const k of Object.keys(payS)) ps += payS[k]; a.pay = ps + adv;
  a.mk1 = fbXround(C.mk1Target[y] * C.mk1Times * FB_MK1_QUARTERS * C.mk1Unit);
  const n1 = first.new;
  const impr = y === 0 ? C.mk2Impr : (n1 > 0 ? fbXround(C.mk2Impr * Math.pow(a.new / n1, C.mk2Elast)) : C.mk2Impr);
  a.mk2Impr = impr;
  a.media = fbXround(impr * 12 * fbBlendCpm(C) / 1000);
  a.creative = C.videoN * C.videoUnit + C.cardN * C.cardUnit;
  a.cardAd = C.cardAdMsgs[y] * C.cardAdUnit;
  const prevc = y > 0 ? C.qrCenters[y - 1] : 0;
  a.qrNew = Math.max(0, C.qrCenters[y] - prevc);
  a.kit = fbXround(a.qrNew * C.qrKit);
  a.sticker = fbXround(a.active * C.qrSticker);
  a.qrfee = fbXround(a.new * C.qrShare * C.qrFee);
  a.mktSum = a.mk1 + a.media + a.creative + a.cardAd + a.kit + a.sticker + a.qrfee;
  fbMediReport(P, C, rows, a, y);
  let swPrev = 0; for (let k = 0; k < y; k++) swPrev += fbSwBuild(C, k);
  a.swBuild = fbSwBuild(C, y);
  a.itMaint = fbXround((swPrev + 0.5 * a.swBuild) * C.maintRate);
  const g = first.me > 0 ? Math.pow(a.me / first.me, C.opsElast) : 1.0;
  a.itData = fbXround(C.dataMonth * 12 * g);
  a.itSec = fbXround(C.secMonth * 12);
  a.cloudBase = fbXround(C.cloudMonth * 12);
  const avgm = (a.mp + a.me) / 2;
  a.avgMembers = avgm;
  a.cloudVar = fbXround(Math.max(0.0, avgm - C.cloudBaseMembers) * C.cloudPerMember * 12);
  const per = C.tokIn * C.priceIn / 1e6 + C.tokOut * C.priceOut / 1e6;
  a.llm = fbXround(avgm * C.consultsPerMember * per);
  a.bcRec = first.me > 0 ? C.bcRecords * a.me / first.me : C.bcRecords;
  a.bc = fbXround(a.bcRec * C.bcUnit);
  a.itOpex = a.itMaint + a.itData + a.itSec + a.cloudBase + a.cloudVar + a.llm + a.bc;
  const prevh = y > 0 ? rows[y - 1].headTotal : 0;
  a.office = fbXround(Math.max(0, a.headTotal - prevh) * C.officePerHead);
  a.isms = y === 0 ? C.isms : 0;
  a.build1 = y === 0 ? (a.swBuild + a.isms) : 0;
  a.medi = y === 0 ? C.mediInvest : 0;
  a.capex = a.swBuild + a.isms + a.office + a.medi;
  const L = C.life;
  const caps = rows.slice(0, y).map((r) => r.capex).concat([a.capex]);
  let dep = 0.0;
  caps.forEach((cx, k) => { const j = y - k; const f = j === 0 ? 0.5 : (j < L ? 1.0 : (j === L ? 0.5 : 0.0)); dep += cx * f / L; });
  a.depr = fbXround(dep);
}

/* ─────────────── oracle.annual(P, n) — cost2 분기 ─────────────── */
function fbAnnual(P, n) {
  const N = n || 5; const rows = [];
  const xr = fbXround, jr = fbJround;
  const at = (arr, y, d) => (arr && arr[y] != null ? arr[y] : (d == null ? 0 : d));
  for (let y = 0; y < N; y++) {
    const me = P.membersEnd[y], mp = y === 0 ? 0 : P.membersEnd[y - 1];
    const nw = Math.max(0, me - mp);
    const activeFull = P.activeAbs[y], mkt = P.mktConsentEnd[y];
    const eff = {}; for (const k of FB_STREAM_KEYS) eff[k] = fbStreamWeights(P, y, k).eff;
    const active = xr(activeFull * eff.Chk);
    const insts = P.checkupCenters[y] + P.hospitals[y] + P.pharmacies[y];
    const cnt = { centers: P.checkupCenters[y], hospitals: P.hospitals[y], pharmacies: P.pharmacies[y] };
    const subFee = {}, paid = {}, subFull = {}, effT = {}, subT = {};
    for (const t of FB_TYPES) subFee[t] = fbFee(P, t, y);
    for (const t of FB_TYPES) paid[t] = jr(cnt[t] * P.subPaidRate);
    for (const t of FB_TYPES) subFull[t] = paid[t] * subFee[t] * 12;
    for (const t of FB_TYPES) effT[t] = fbSubTypeEff(P, t, y);
    for (const t of FB_TYPES) subT[t] = xr(subFull[t] * effT[t]);
    let revSub = 0, revSubFull = 0; for (const t of FB_TYPES) { revSub += subT[t]; revSubFull += subFull[t]; }
    const buyers = jr(me * P.productBuyerRate); const ramp = at(P.productRamp, y, 1);
    const cat = {}, catFull = {}; let revP = 0, cogsP = 0, revPFull = 0;
    for (const c of P.productCats) {
      const rvF = jr(buyers * c.arpu * P.productCapture * ramp);
      const rv = xr(rvF * eff.P);
      const cst = jr(rv * c.cost);
      cat[c.key] = [rv, cst]; catFull[c.key] = rvF; revP += rv; cogsP += cst; revPFull += rvF;
    }
    const ck = fbCheckup(P, y, active);
    const chkOwn = ck.own, chkPtn = ck.ptn, revChk = ck.rev, chkCogs = ck.cost;
    const revChkFull = fbCheckup(P, y, activeFull).rev;
    const svcU = jr(me * P.serviceRate); const revSvcFull = svcU * P.serviceCommission;
    const revSvc = xr(revSvcFull * eff.Svc);
    const resvFull = jr(activeFull * at(P.resvPerActive, y, 0));
    const resv = xr(resvFull * eff.Resv);
    const revResv = resv * P.resvFee, revResvFull = resvFull * P.resvFee;
    const lpc = P.carePerCenter || 0;
    const careCtrFull = lpc > 0 ? xr(me * (P.careRate || 0) / 12 / lpc) : 0;
    const careNFull = careCtrFull * 12;
    const careN = xr(careNFull * eff.Care);
    const revCare = careN * (P.careFee || 0), revCareFull = careNFull * (P.careFee || 0);
    const careCost = xr(revCare * (P.careCostRate || 0));
    const insCFull = jr(mkt * P.insConvRate);
    const insC = xr(insCFull * eff.Ins);
    const hmT = fbHmTerms(P, y);
    const revInsFull = fbHmFee(P, y, insCFull).fee;
    const hf = fbHmFee(P, y, insC);
    const imC = jr((mkt - (y === 0 ? 0 : P.mktConsentEnd[y - 1])) * P.insConvRate);
    const imRev = fbHmFee(P, y, imC).fee;
    const revAd = active * at(P.adPerActive, y, 0);
    const agU = jr(me * at(P.aiAgentRate, y, 0)); const revAg = agU * P.aiAgentFeeYear;
    const revApi = at(P.apiClients, y, 0) * P.apiFeeYear;
    const rev = revP + revChk + revSvc + revResv + revSub + hf.fee + revAd + revAg + revApi + revCare;
    const revFull = revPFull + revChkFull + revSvcFull + revResvFull + revSubFull + revInsFull + revAd + revAg + revApi + revCareFull;
    const svcCost = jr(revSvc * P.serviceCostRate);
    const subCost = jr(revSub * P.subCostRate); const payFee = jr(revP * P.paymentRate);
    const cogs = cogsP + chkCogs + svcCost + subCost + payFee + careCost;
    const gross = rev - cogs;
    const pm = revP - cogsP; const reward = jr(pm * P.rewardRate); const don = jr(pm * P.donationRate);
    const os_ = P.opexScale;
    const sales = jr(rev * P.salesRate * os_);
    const admin = jr(rev * P.adminRate * os_);
    const a = {
      y, me, mp, new: nw, active, activeFull, eff, subT, catFull,
      revPFull, revChkFull, revSvcFull, revResvFull, revSubFull, revInsFull, revFull, insCFull, resv, resvFull,
      careN, careNFull, careCtrFull, revCare, revCareFull, careCost, mkt, insts, subFee, paid, effT,
      buyers, cat, revP, cogsP, revChk, chkOwn, chkPtn, svcU, revSvc, revResv,
      revSub, insC, hmCap: hmT.cap, hmPrice: hmT.price, hmMarket: hmT.mkt, hmDisc: hf.disc, hmFull: hf.full, hmBenefit: hf.benefit, imC, imRev, revIns: hf.fee, revAd, revAg, revApi, rev,
      chkCogs, svcCost, subCost, payFee, cogs, gross,
      cac: 0, launch: 0, brand: 0, mktg: 0, reward, don, pay: 0,
      rnd: 0, cloud: 0, gpu: 0, sales, admin, sga: 0, ebit_model: 0, depr: 0, ebit: 0, capex: 0,
    };
    rows.push(a);
    fbAnnualCosts(P, rows.slice(0, -1), a, y);
    a.mktg = a.mktSum;
    a.sga = a.mktSum + a.mediRep + reward + don + a.pay + a.itOpex + sales + admin;
    a.ebit_model = gross - a.sga;
    a.ebit = a.ebit_model - a.depr;
  }
  return rows;
}

/* ─────────────── oracle3.run(P, L) — 현금 계획 ─────────────── */
function fbTier(cases, cap, price, mkt) {
  const out = []; let cum = 0.0;
  for (const d of cases) { const prev = cum; cum += d; const disc = Math.max(0.0, Math.min(d, cap - Math.min(cap, prev))); out.push(disc * price + (d - disc) * mkt); }
  return out;
}
function fbRun(P, L0, A0) {
  const A = A0 || fbAnnual(P, 5);
  const L = Object.assign({}, L0, { payStart: A[0].pay / 12.0 });
  for (const a of A) { a.pbt = a.ebit - P.interestYear; a.tax = Math.max(0, a.pbt) * P.taxRate; }
  const pre = Math.max(0, Math.min(24, Math.trunc(L.pre)));
  const n = 60;
  const RVK = ["P", "Chk", "Svc", "Care", "Resv", "Sub", "Ins", "Etc"];
  const Z = () => new Array(n).fill(0);
  const rv = {}; RVK.forEach((k) => { rv[k] = Z(); });
  const cogsM = Z(), custM = Z(), cacM = Z(), brandM = Z(), launchM = Z(), rndM = Z(), cloudM = Z(), gpuM = Z(), salesM = Z(), adminM = Z();
  const capexM = Z(), revT = Z(), intM = Z(), mediM = Z(), insRecM = Z();
  for (let y = 0; y < 5; y++) {
    const a = A[y]; const ramp = L.ramp[y]; const rs = fbSum(ramp);
    const adds = ramp.map((r) => a.new * r / rs); const ends = []; let c = a.mp;
    for (const x of adds) { c += x; ends.push(c); }
    const W = fbSum(ends);
    const al = {}; for (const k of FB_STREAM_KEYS) al[k] = fbStreamWeights(P, y, k).a;
    const casesM = []; for (let m = 0; m < 12; m++) casesM.push(a.insC * al.Ins[m]);
    const covs = []; for (let m = 0; m < 12; m++) covs.push(y === 0 ? L.insCov[m] : 1.0);
    const planIns = fbTier(casesM, a.hmCap, a.hmPrice, a.hmMarket);
    const recIns = fbTier(casesM.map((v, m) => v * covs[m]), a.hmCap, a.hmPrice, a.hmMarket);
    const lp = L.launchPh; const slp = fbSum(lp); const cp = L.capexPh; const scp = fbSum(cp); const sa = fbSum(adds);
    for (let m = 0; m < 12; m++) {
      const t = y * 12 + m; const w = ends[m] / W;
      const wP = al.P[m], wC = al.Chk[m], wR = al.Resv[m], wS = al.Svc[m], wK = al.Care[m], wB = al.Sub[m];
      rv.P[t] = a.revP * wP; rv.Chk[t] = a.revChk * wC; rv.Svc[t] = a.revSvc * wS; rv.Care[t] = (a.revCare || 0) * wK;
      rv.Resv[t] = a.revResv * wR; rv.Sub[t] = a.revSub * wB; rv.Ins[t] = planIns[m]; insRecM[t] = recIns[m];
      rv.Etc[t] = (a.revAd + a.revAg + a.revApi) * w;
      let s = 0; for (const k of RVK) s += rv[k][t]; revT[t] = s;
      const sr = a.rev ? revT[t] / a.rev : w;
      cogsM[t] = ((a.cogsP + a.payFee) * wP + a.chkCogs * wC + a.svcCost * wS + (a.careCost || 0) * wK + a.subCost * wB);
      custM[t] = (a.reward + a.don) * wP;
      cacM[t] = (a.mk1 + a.creative + a.cardAd + a.kit) / 12.0 + a.sticker * wC + a.qrfee * w;
      brandM[t] = 0.0;
      launchM[t] = (y === 0 && slp) ? a.media * lp[m] / slp : a.media / 12.0;
      rndM[t] = 0.0;
      cloudM[t] = (a.itMaint + a.itData + a.itSec + a.cloudBase) / 12.0;
      gpuM[t] = (a.cloudVar + a.llm + a.bc) * w;
      salesM[t] = a.sales * sr; adminM[t] = a.admin * sr;
      mediM[t] = (a.mediRep || 0.0) * (sa ? adds[m] / sa : 1 / 12.0);
      const cxb = a.capex - ((a.medi || 0) + (a.build1 || 0));
      capexM[t] = scp ? cxb * cp[m] / scp : cxb / 12.0;
      intM[t] = P.interestYear / 12.0;
    }
  }
  const path = []; let st = L.payStart;
  for (let y = 0; y < 5; y++) { const en = A[y].pay / 6.0 - st; for (let m = 0; m < 12; m++) path.push(st + (en - st) * m / 11.0); st = en; }
  const avgsal = A.map((a) => a.pay / a.headTotal);
  const varRate = (P.salesRate + P.adminRate) * P.opexScale;
  const mediAt = Math.max(L.mediQ - pre, pre > 0 ? (1 - pre) : 1);
  const mediAmt = A[0].medi || 0; const buildAmt = A[0].build1 || 0;
  const wgt = (arr, q, hold) => (q <= 6 ? arr[q - 1] : (hold === false ? 0.0 : arr[5]));
  let bsum = 0.0; if (pre > 0) for (let q = 1; q <= Math.min(pre, 6); q++) bsum += L.wBuild[q - 1];
  const Gc = L.cashStart, Sp = L.prodStart;
  const calMonth = (idx) => fbPmod(L.startMon - 1 + idx + pre - 1, 12) + 1;
  const mktMon = (A[0].mk1 + A[0].media + A[0].creative + A[0].cardAd) / 12.0;
  const itMon = (A[0].itData + A[0].itSec + A[0].cloudBase) / 12.0;
  const cols = [], labels = [];
  for (let j = 0; j < 24; j++) { cols.push(j - 24 + 1); labels.push("준비-" + (24 - j)); }
  for (let t = 0; t < n; t++) { cols.push(t + 1); labels.push(`${Math.floor(t / 12) + 1}차-${String(t % 12 + 1).padStart(2, "0")}`); }
  const c0 = pre > 0 ? (1 - pre) : 1;
  const heads = cols.map((idx) => (idx < 1 ? (idx > -pre ? L.payStart * wgt(L.wPay, idx + pre) * 12 / avgsal[0] : 0.0) : path[idx - 1] * 12 / avgsal[Math.floor((idx - 1) / 12)]));
  const lag = L.lag;
  let cum = 0.0; const series = []; let maxreq = 0.0; let preBal = 0.0; const fixedM = []; let preExp = 0.0;
  const prodPart = Z();
  for (let y = 0; y < 5; y++) { const a = A[y]; const alP = fbStreamWeights(P, y, "P").a; for (let m = 0; m < 12; m++) prodPart[y * 12 + m] = (a.cogsP + a.payFee) * alP[m]; }
  let shortfall = 0; for (let t = 0; t < 12; t++) shortfall += rv.Ins[t] - insRecM[t];
  let tax1 = null; let taxes = [0.0, 0.0, 0.0, 0.0, 0.0];
  const rcash = (k, q) => { if (k === "Ins") return insRecM[q - 1]; if (k === "P" && q < Sp) return 0.0; return rv[k][q - 1]; };
  cols.forEach((idx, j) => {
    let inflow = 0.0, outflow = 0.0;
    const look = heads.slice(j, j + L.depLook);
    const req = idx <= -pre ? 0.0 : (look.length ? Math.max(...look) : 0.0) * L.rent * L.depMonths;
    const depOut = Math.max(0.0, req - maxreq); maxreq = Math.max(maxreq, req);
    const hire = Math.max(0.0, heads[j] - (j > 0 ? heads[j - 1] : 0.0)) * (idx >= 1 ? avgsal[Math.floor((idx - 1) / 12)] : avgsal[0]) * L.hireRate;
    let one = idx === c0 ? L.oneOff : 0.0;
    one += idx === mediAt ? mediAmt : 0.0;
    if (bsum > 0) one += (idx < 1 && idx > -pre) ? buildAmt * wgt(L.wBuild, idx + pre, false) / bsum : 0.0;
    else one += idx === 1 ? buildAmt : 0.0;
    if (idx < 1) {
      if (idx > -pre) {
        const q = idx + pre;
        outflow = (L.payStart * wgt(L.wPay, q) + L.preOpex + heads[j] * L.rent + mktMon * wgt(L.wMkt, q) + itMon * wgt(L.wIT, q) + P.interestYear / 12.0 * L.preInt);
        preExp += outflow + hire + (idx === c0 ? L.oneOff : 0.0);
      }
      outflow += depOut + hire + one;
      fixedM.push(0.0);
    } else {
      const t = idx - 1; const y = Math.floor(t / 12);
      const lagged = (k, l) => {
        if (idx < Gc) return 0.0;
        if (idx === Gc) { let s = 0; for (let q = 1; q <= Gc - l; q++) s += rcash(k, q); return s; }
        const p = idx - l; return p >= 1 ? rcash(k, p) : 0.0;
      };
      const insCol = lagged("Ins", lag.Ins);
      const recv = idx === L.prepayAt ? L.prepay : 0.0;
      const offset = Math.min(preBal + recv, insCol);
      preBal = preBal + recv - offset;
      inflow = (lagged("P", lag.P) + lagged("Chk", lag.Chk) + lagged("Svc", lag.Svc) + lagged("Care", lag.Svc) + lagged("Resv", lag.Resv)
        + lagged("Sub", lag.Sub) + (insCol - offset) + lagged("Etc", lag.Etc));
      const pc = idx - L.cogsLag;
      const oCogs = pc >= 1 ? (cogsM[pc - 1] - (pc < Sp ? prodPart[pc - 1] : 0.0)) : 0.0;
      const covSave = (rv.Ins[t] - insRecM[t]) * varRate;
      const rent = heads[j] * L.rent;
      const rentOut = L.adminHasRent === 1 ? Math.max(0.0, rent - adminM[t]) : rent;
      const repay = (L.repayFrom <= idx && idx <= L.repayTo) ? L.repay : 0;
      const done = Math.floor((idx - 1) / 12);
      if (tax1 === null && idx >= 1) {
        const base = [A[0].pbt - shortfall * (1 - varRate)].concat([1, 2, 3, 4].map((k) => A[k].pbt));
        let pool = preExp; taxes = [];
        for (const bk of base) { taxes.push(Math.max(0.0, bk - pool) * P.taxRate); pool = Math.max(0.0, pool - bk); }
        tax1 = taxes[0];
      }
      const tax = (calMonth(idx) === 3 && done >= 1 && done <= 5) ? taxes[done - 1] : 0.0;
      const wc = (revT[t] - rv.Ins[t] + insRecM[t]) * L.wc;
      const cust = idx >= Sp ? custM[t] : 0.0;
      outflow = (oCogs + cust + cacM[t] + mediM[t] + brandM[t] + launchM[t] + capexM[t] + path[t] + rndM[t] + cloudM[t]
        + gpuM[t] + salesM[t] + adminM[t] + intM[t] + wc + tax - covSave + rentOut + depOut + hire + one + repay);
      fixedM.push(path[t] + rndM[t] + cloudM[t] + 0.0 + adminM[t] + intM[t]);
      void y;
    }
    cum += inflow - outflow;
    series.push([labels[j], idx, inflow, outflow, cum]);
  });
  const cums = series.map((s) => s[4]);
  const mn = Math.min(...cums); const low = Math.min(0.0, mn); const jl = cums.indexOf(mn);
  const lowAt = mn < 0 ? labels[jl] : "저점 없음";
  const y1 = A[0];
  const fixedAvg = (y1.pay + y1.itMaint + y1.itData + y1.itSec + y1.cloudBase + y1.admin + P.interestYear) / 12.0;
  const buffer = L.buf * fixedAvg;
  const need = -low + buffer;
  const reqNew = Math.ceil(Math.max(0.0, need - L.cashAvail - L.prepay) / 1e9) * 1e9;
  let runway = "소진 없음";
  for (const s of series) {
    const gotPre = (L.prepay && s[1] >= L.prepayAt) ? L.prepay : 0.0;
    if (L.cashAvail + reqNew + gotPre + s[4] < 0) { runway = s[0]; break; }
  }
  const run = { low, low_at: lowAt, fixed_avg: fixedAvg, buffer, need, req: reqNew, tax1, taxes, pre_exp: preExp,
    total_round: Math.ceil(need / 1e9) * 1e9, buf_months: fixedM[jl] ? buffer / fixedM[jl] : null, runway, series, insRecM,
    lowIdx: jl, pre, labels, cols, heads, path, avgsal, fixedM, L, shortfall, varRate };
  run.tranche = fbTranche(run, P.t1Rate == null ? FB_META.t1Rate : P.t1Rate);
  return run;
}
/* 트랜치 — T1 = MIN(요청, 10억 올림(요청×T1 비율)) · T2 = 나머지 · T1만 받았을 때 소진 기간(없으면 null) */
function fbTranche(run, rate) {
  const req = run.req; const t1 = Math.min(req, Math.ceil(req * rate / 1e9) * 1e9);
  let out = null;
  for (const s of run.series) if (t1 + s[4] < 0) { out = s[0]; break; }
  return { t1, t2: req - t1, t1RunOut: out };
}

/* ─────────────── 인력계획(HR) — gen_budget 인력계획 시트 ─────────────── */
function fbHrTable(P, A) {
  const C = P.cost2; const H = {}; const n = 5;
  const bk = FB_META.burdenKeys.filter((b) => b[0] !== "pension").map((b) => b[0]);
  for (const s of C.sections) H["in_" + s[0]] = [s[2], s[4], s[3] == null ? "고정" : FB_META.drivers[s[3]], null, null];
  H.wageGrowth = [C.wageGrowth, null, null, null, null];
  H.headElast = [C.headElast, null, null, null, null];
  H.bFirst = C.pensionY.slice(0, n); H.b_pension = C.pensionY.slice(0, n);
  for (const k of bk) H["b_" + k] = [C.burden[k], null, null, null, null];
  let oth = 0; for (const k of bk) oth += C.burden[k];
  H.bTotal = C.pensionY.slice(0, n).map((p) => p + oth);
  H.welf = [C.welfareMonth, null, null, null, null]; H.advN = [C.advisors, null, null, null, null]; H.advFee = [C.advisorFee, null, null, null, null];
  H.drv_active = A.map((a) => a.active); H.drv_me = A.map((a) => a.me); H.drv_insC = A.map((a) => a.insC);
  H.drv_catNutri = A.map((a) => a.cat.supp[0] + a.cat.diet[0]); H.drv_catDevice = A.map((a) => a.cat.device[0]);
  H.drv_catSports = A.map((a) => a.cat.sports[0] + a.revResv); H.drv_rev = A.map((a) => a.rev);
  const a0 = A[0];
  H.base_active = [a0.activeFull, null, null, null, null]; H.base_me = [a0.me, null, null, null, null]; H.base_insC = [a0.insCFull, null, null, null, null];
  H.base_catNutri = [a0.catFull.supp + a0.catFull.diet, null, null, null, null]; H.base_catDevice = [a0.catFull.device, null, null, null, null];
  H.base_catSports = [a0.catFull.sports + a0.revResvFull, null, null, null, null]; H.base_rev = [a0.revFull, null, null, null, null];
  for (const s of C.sections) H["head_" + s[0]] = A.map((a) => a.heads[s[0]]);
  H.headStart = H["head_" + C.sections[0][0]];
  H.headTotal = A.map((a) => a.headTotal);
  H.rpe = A.map((a) => (a.headTotal === 0 ? 0 : a.rev / a.headTotal));
  for (const s of C.sections) H["unit_" + s[0]] = [0, 1, 2, 3, 4].map((i) => s[4] * Math.pow(1 + C.wageGrowth, i) * (1 + H.bTotal[i]) + C.welfareMonth * 12 * Math.pow(1 + C.wageGrowth, i));
  for (const s of C.sections) H["cost_" + s[0]] = A.map((a) => a.pay_s[s[0]]);
  H.costStart = H["cost_" + C.sections[0][0]];
  H.adv = A.map((a) => a.advisor);
  H.payTotal = A.map((a) => a.pay);
  H.avgSal = A.map((a) => (a.headTotal === 0 ? 0 : a.pay / a.headTotal));
  H.payModel = (P.payroll || []).slice(0, n);
  H.payS = []; H.payE = []; H.payWarn = [];
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? H.payTotal[0] / 12 : H.payE[i - 1]; const e = H.payTotal[i] / 6 - s;
    H.payS.push(s); H.payE.push(e);
    H.payWarn.push((s < 0 || e < 0) ? "음수 — 조정 필요" : (e < s - 1 ? "연중 감소 — 1월 인건비 과대" : "정상"));
  }
  return H;
}

/* ─────────────── 월별 손익(MR) — gen_budget 월별예산 시트 60개월 ─────────────── */
function fbMonthlyPL(P, A) {
  const N = 60; const R = {}; const put = (k, t, v) => { (R[k] = R[k] || new Array(N).fill(0))[t] = v; };
  const HR = fbHrTable(P, A);
  const sn = fbSeasonNorm(P);
  const lpSum = 12;                                    // 가정 ⑫ 1차 매체비 배분 가중치(모두 1)
  for (let y = 0; y < 5; y++) {
    const a = A[y]; const ramp = y === 0 ? P.m1Ramp : fbOnes12(); const rs = fbSum(ramp);
    const newM = ramp.map((r) => (rs === 0 ? a.new / 12 : a.new * r / rs));
    const endM = []; let c = a.mp; for (const x of newM) { c += x; endM.push(c); }
    const W = fbSum(endM);
    const w = endM.map((e) => (W === 0 ? 1 / 12 : e / W));
    const k = endM.map((e) => (a.me === 0 ? 0 : e / a.me));
    const sw = {}; for (const key of FB_STREAM_KEYS) sw[key] = fbStreamWeights(P, y, key);
    let cumCases = 0;
    for (let m = 0; m < 12; m++) {
      const t = y * 12 + m;
      put("ramp", t, ramp[m]); put("newM", t, newM[m]); put("endM", t, endM[m]); put("w", t, w[m]); put("k", t, k[m]); put("sn", t, sn[m]);
      for (const key of FB_STREAM_KEYS) { put("b_" + key, t, sw[key].b[m]); put("g_" + key, t, sw[key].g[m]); put("a_" + key, t, sw[key].a[m]); }
      const aP = sw.P.a[m], aC = sw.Chk.a[m], aR = sw.Resv.a[m], aS = sw.Svc.a[m], aK = sw.Care.a[m], aB = sw.Sub.a[m], aI = sw.Ins.a[m];
      let revP = 0; for (const cc of P.productCats) { const v = a.cat[cc.key][0] * aP; put("rev_" + cc.key, t, v); revP += v; }
      put("revP", t, revP);
      put("revChk", t, a.revChk * aC); put("revSvc", t, a.revSvc * aS); put("revResv", t, a.revResv * aR); put("revCare", t, a.revCare * aK); put("revSub", t, a.revSub * aB);
      const cases = a.insC * aI; const cumPrev = cumCases; cumCases += cases;
      const disc = Math.max(0, Math.min(cases, a.hmCap - Math.min(a.hmCap, cumPrev)));
      put("hmCasesM", t, cases); put("hmCumM", t, cumCases); put("hmDiscM", t, disc);
      put("revIns_d", t, disc * a.hmPrice); put("revIns_f", t, (cases - disc) * P.hmMarket); put("revIns", t, disc * a.hmPrice + (cases - disc) * P.hmMarket);
      const rev = R.revP[t] + R.revChk[t] + R.revSvc[t] + R.revResv[t] + R.revCare[t] + R.revSub[t] + R.revIns[t];
      put("rev", t, rev);
      const wRev = a.rev === 0 ? w[m] : rev / a.rev; put("wRev", t, wRev);
      put("cogsP", t, a.cogsP * aP); put("chkCogs", t, a.chkCogs * aC); put("svcCost", t, a.svcCost * aS); put("careCost", t, a.careCost * aK); put("subCost", t, a.subCost * aB); put("payFee", t, a.payFee * aP);
      const cogs = R.cogsP[t] + R.chkCogs[t] + R.svcCost[t] + R.careCost[t] + R.subCost[t] + R.payFee[t];
      put("cogs", t, cogs); put("gross", t, rev - cogs);
      put("mk1", t, a.mk1 / 12); put("media", t, y === 0 ? a.media * 1 / lpSum : a.media / 12); put("creative", t, a.creative / 12); put("cardAd", t, a.cardAd / 12);
      put("kit", t, a.kit / 12); put("sticker", t, a.sticker * aC); put("qrfee", t, a.qrfee * w[m]);
      put("mktSum", t, R.mk1[t] + R.media[t] + R.creative[t] + R.cardAd[t] + R.kit[t] + R.sticker[t] + R.qrfee[t]);
      put("mediRep", t, a.new === 0 ? a.mediRep / 12 : a.mediRep * newM[m] / a.new);
      put("reward", t, a.reward * aP); put("donation", t, a.don * aP);
      put("pay", t, HR.payS[y] + (HR.payE[y] - HR.payS[y]) * m / 11);
      put("itMaint", t, a.itMaint / 12); put("itData", t, a.itData / 12); put("itSec", t, a.itSec / 12); put("cloudBase", t, a.cloudBase / 12);
      put("cloudVar", t, a.cloudVar * w[m]); put("llm", t, a.llm * w[m]); put("bc", t, a.bc * w[m]);
      put("itOpex", t, R.itMaint[t] + R.itData[t] + R.itSec[t] + R.cloudBase[t] + R.cloudVar[t] + R.llm[t] + R.bc[t]);
      put("salesCost", t, a.sales * wRev); put("adminCost", t, a.admin * wRev);
      put("sga", t, R.mktSum[t] + R.mediRep[t] + R.reward[t] + R.donation[t] + R.pay[t] + R.itOpex[t] + R.salesCost[t] + R.adminCost[t]);
      put("ebitModel", t, R.gross[t] - R.sga[t]); put("depr", t, a.depr / 12); put("ebit", t, R.ebitModel[t] - R.depr[t]);
      put("int", t, P.interestYear / 12); put("pbt", t, R.ebit[t] - R.int[t]);
      const capexBase = a.capex - a.medi - a.build1;
      put("capexBase", t, capexBase * 1 / 12); put("capexBuild1", t, m === 0 ? a.build1 : 0); put("capexMedi", t, m === 0 ? a.medi : 0);
      put("cumOp", t, (t === 0 ? 0 : R.cumOp[t - 1]) + R.ebit[t]);
    }
  }
  R.cal = new Array(N).fill(0).map((_, t) => fbCal(t + 1));
  return R;
}

/* ─────────────── 현금 계정 분해(RA/RB/RC) — gen_budget 현금·투자금 시트 84열 ─────────────── */
function fbCashTable(P, L, A, MR, HR, run) {
  const PRE = 24, NC = 84; const pre = run.pre; const R = {};
  const col = (k) => (R[k] = new Array(NC).fill(0));
  const idxOf = (j) => j - PRE + 1;
  const yearOf = (idx) => Math.floor((idx - 1) / 12);        // 0-based 연차
  const monOf = (idx) => fbPmod(idx - 1, 12);                // 0-based 월
  const SAME = (key, idx) => (idx < 1 ? 0 : MR[key][idx - 1]);
  const wgt = (arr, idx) => arr[Math.min(idx + pre, 6) - 1];
  const PAYS1 = HR.payS[0]; const AVG = HR.avgSal;
  const varRate = (P.salesRate + P.adminRate) * P.opexScale;
  let BSUM = 0; for (let q = 1; q <= 6; q++) if (q <= pre) BSUM += L.wBuild[q - 1];
  const capPh = L.capexPh, scp = fbSum(capPh), lpP = L.launchPh, slp = fbSum(lpP);
  ["lab", "idx", "cal"].forEach((k) => { R[k] = new Array(NC); });
  for (let j = 0; j < NC; j++) {
    const idx = idxOf(j);
    R.lab[j] = j < PRE ? `준비-${PRE - j}` : `${Math.floor((j - PRE) / 12) + 1}차-${String((j - PRE) % 12 + 1).padStart(2, "0")}`;
    R.idx[j] = idx;
    const tot = 2026 * 12 + 9 + (idx + pre - 1);            // EDATE(준비 시작 2026-10, idx+pre-1)
    R.cal[j] = idx <= -pre ? "-" : `${Math.floor(tot / 12)}-${String(tot % 12 + 1).padStart(2, "0")}`;
  }
  ["heads", "hmDel", "rChk", "rP", "rSub", "rCare", "rOth", "hmDelCum", "insRec", "req"].forEach(col);
  for (let j = 0; j < NC; j++) {
    const idx = R.idx[j];
    R.heads[j] = idx < 1 ? (idx > -pre ? PAYS1 * wgt(L.wPay, idx) * 12 / AVG[0] : 0) : MR.pay[idx - 1] * 12 / AVG[yearOf(idx)];
    R.hmDel[j] = idx < 1 ? 0 : MR.hmCasesM[idx - 1] * (idx <= 12 ? L.insCov[idx - 1] : 1);
    R.rChk[j] = SAME("revChk", idx);
    R.rP[j] = idx < L.prodStart ? 0 : SAME("revP", idx);
    R.rSub[j] = SAME("revSub", idx); R.rCare[j] = SAME("revCare", idx);
    R.rOth[j] = SAME("revResv", idx) + SAME("revSvc", idx);
  }
  for (let j = 0; j < NC; j++) {
    if (j < PRE) { R.hmDelCum[j] = 0; R.insRec[j] = 0; continue; }
    const ys = PRE + Math.floor((j - PRE) / 12) * 12; let s = 0; for (let q = ys; q <= j; q++) s += R.hmDel[q];
    R.hmDelCum[j] = s;
    const a = A[Math.floor((j - PRE) / 12)];
    R.insRec[j] = R.hmDel[j] * P.hmMarket - Math.max(0, Math.min(R.hmDel[j], a.hmCap - Math.min(a.hmCap, R.hmDelCum[j] - R.hmDel[j]))) * (P.hmMarket - a.hmPrice);
  }
  for (let j = 0; j < NC; j++) {
    const idx = R.idx[j];
    if (idx <= -pre) { R.req[j] = 0; continue; }
    const last = Math.min(PRE + 60, idx + PRE + L.depLook - 1) - 1;
    let mx = -Infinity; for (let q = j; q <= last; q++) mx = Math.max(mx, R.heads[q]);
    R.req[j] = mx * L.rent * L.depMonths;
  }
  // 유입
  const GATE = (src, off, lagv) => (idx) => {
    const cs = L.cashStart;
    if (idx < cs) return 0;
    if (idx === cs) { if (cs - lagv < 1) return 0; let s = 0; for (let q = 1; q <= cs - lagv; q++) s += src(q + off); return s; }
    return idx - lagv < 1 ? 0 : src(idx - lagv + off);
  };
  const mrSrc = (key) => (p) => MR[key][p - 1];             // INDEX(월별예산 D:BK, p)
  const rowSrc = (key) => (p) => R[key][p - 1];             // INDEX(현금 C:CH, p)
  const lagP = L.lag.P, lagChk = L.lag.Chk, lagSvc = L.lag.Svc, lagResv = L.lag.Resv, lagSub = L.lag.Sub, lagIns = L.lag.Ins;
  ["inP", "inChk", "inSvc", "inCare", "inResv", "inSub", "insCol", "offset", "prepayBal", "inIns", "inTot"].forEach(col);
  const fP = GATE(rowSrc("rP"), PRE, lagP), fChk = GATE(mrSrc("revChk"), 0, lagChk), fSvc = GATE(mrSrc("revSvc"), 0, lagSvc), fCare = GATE(mrSrc("revCare"), 0, lagSvc);
  const fResv = GATE(mrSrc("revResv"), 0, lagResv), fSub = GATE(mrSrc("revSub"), 0, lagSub), fIns = GATE(rowSrc("insRec"), PRE, lagIns);
  for (let j = 0; j < NC; j++) {
    const idx = R.idx[j];
    R.inP[j] = fP(idx); R.inChk[j] = fChk(idx); R.inSvc[j] = fSvc(idx); R.inCare[j] = fCare(idx); R.inResv[j] = fResv(idx); R.inSub[j] = fSub(idx);
    R.insCol[j] = fIns(idx);
    const recv = idx === L.prepayAt ? L.prepay : 0; const balPrev = j === 0 ? 0 : R.prepayBal[j - 1];
    R.offset[j] = idx < 1 ? 0 : Math.min(balPrev + recv, R.insCol[j]);
    R.prepayBal[j] = balPrev + recv - R.offset[j];
    R.inIns[j] = R.insCol[j] - R.offset[j];
    R.inTot[j] = R.inP[j] + R.inChk[j] + R.inSvc[j] + R.inCare[j] + R.inResv[j] + R.inSub[j] + R.inIns[j];
  }
  // 유출
  const OUT = ["oCogs", "oCust", "oMkt", "oMedia", "oCapex", "oPay", "oOpex", "oInt", "oWc", "oTax", "oCovSave", "oRent", "oDep", "oHire", "oOne", "oBuild", "oMedi", "oPrePay", "oPreOpex", "oPreMkt", "oPreInt", "oPreIT", "oRepay"];
  OUT.forEach(col); ["outTot", "net", "cum", "fixedM", "funded", "flag"].forEach(col);
  const a0 = A[0]; const c0 = pre > 0 ? 1 - pre : 1;
  for (let j = 0; j < NC; j++) {
    const idx = R.idx[j]; const inPrep = idx < 1 && idx > -pre;
    R.oCogs[j] = idx - L.cogsLag < 1 ? 0 : MR.cogs[idx - L.cogsLag - 1] - (idx - L.cogsLag < L.prodStart ? MR.cogsP[idx - L.cogsLag - 1] + MR.payFee[idx - L.cogsLag - 1] : 0);
    R.oCust[j] = idx < L.prodStart ? 0 : SAME("reward", idx) + SAME("donation", idx);
    R.oMkt[j] = SAME("mk1", idx) + SAME("creative", idx) + SAME("cardAd", idx) + SAME("kit", idx) + SAME("sticker", idx) + SAME("qrfee", idx);
    R.oMedia[j] = idx < 1 ? 0 : (yearOf(idx) === 0 ? a0.media * (slp === 0 ? 1 / 12 : lpP[monOf(idx)] / slp) : A[yearOf(idx)].media / 12);
    R.oCapex[j] = idx < 1 ? 0 : (A[yearOf(idx)].capex - A[yearOf(idx)].medi - A[yearOf(idx)].build1) * (scp === 0 ? 1 / 12 : capPh[monOf(idx)] / scp);
    R.oPay[j] = SAME("pay", idx);
    R.oOpex[j] = SAME("itMaint", idx) + SAME("itData", idx) + SAME("itSec", idx) + SAME("cloudBase", idx) + SAME("cloudVar", idx) + SAME("llm", idx) + SAME("bc", idx) + SAME("salesCost", idx) + SAME("adminCost", idx);
    R.oInt[j] = SAME("int", idx);
    R.oWc[j] = idx < 1 ? 0 : (MR.rev[idx - 1] - MR.revIns[idx - 1] + R.insRec[j]) * L.wc;
    R.oCovSave[j] = -(idx < 1 ? 0 : (MR.revIns[idx - 1] - R.insRec[j]) * varRate);
    R.oRent[j] = idx < 1 ? R.heads[j] * L.rent : (L.adminHasRent === 1 ? Math.max(0, R.heads[j] * L.rent - MR.adminCost[idx - 1]) : R.heads[j] * L.rent);
    let mxPrev = -Infinity; for (let q = 0; q < j; q++) mxPrev = Math.max(mxPrev, R.req[q]);
    R.oDep[j] = j === 0 ? Math.max(0, R.req[j]) : Math.max(0, R.req[j] - mxPrev);
    R.oHire[j] = Math.max(0, R.heads[j] - (j === 0 ? 0 : R.heads[j - 1])) * (idx < 1 ? AVG[0] : AVG[yearOf(idx)]) * L.hireRate;
    R.oOne[j] = idx === c0 ? L.oneOff : 0;
    R.oBuild[j] = BSUM > 0 ? (inPrep ? a0.build1 * ((idx + pre <= 6) ? 1 : 0) * wgt(L.wBuild, idx) / BSUM : 0) : (idx === 1 ? a0.build1 : 0);
    R.oMedi[j] = idx < 1 ? 0 : SAME("mediRep", idx);
    R.oPrePay[j] = inPrep ? PAYS1 * wgt(L.wPay, idx) : 0;
    R.oPreOpex[j] = inPrep ? L.preOpex : 0;
    R.oPreMkt[j] = inPrep ? (a0.mk1 + a0.media + a0.creative + a0.cardAd) / 12 * wgt(L.wMkt, idx) : 0;
    R.oPreInt[j] = inPrep ? P.interestYear / 12 * L.preInt : 0;
    R.oPreIT[j] = inPrep ? (a0.itData + a0.itSec + a0.cloudBase) / 12 * wgt(L.wIT, idx) : 0;
    R.oRepay[j] = (idx >= L.repayFrom && idx <= L.repayTo) ? L.repay : 0;
  }
  // 요약 법인세(엑셀 s_pre · s_tax1~4)
  let sPreV = 0;
  for (const k of ["oPrePay", "oPreMkt", "oPreIT", "oPreOpex", "oPreInt", "oRent", "oHire", "oOne"]) { let s = 0; for (let j = 0; j < PRE; j++) s += R[k][j]; sPreV += s; }
  let ins1 = 0; for (let j = PRE; j < PRE + 12; j++) ins1 += R.insRec[j];
  const pbt = A.map((a) => a.ebit - P.interestYear);
  const base1 = pbt[0] - (a0.revIns - ins1) * (1 - varRate);
  const sTax = [Math.max(0, base1 - sPreV) * P.taxRate]; let pool = Math.max(0, sPreV - base1);
  for (let k = 1; k <= 3; k++) { sTax.push(Math.max(0, pbt[k] - pool) * P.taxRate); pool = Math.max(0, pool - pbt[k]); }
  R.summary = { pre: sPreV, tax: sTax, base1 };
  for (let j = 0; j < NC; j++) {
    const idx = R.idx[j];
    if (idx < 1) { R.oTax[j] = 0; continue; }
    const tot = 2026 * 12 + 9 + (idx + pre - 1); const month = tot % 12 + 1; const done = Math.floor((idx - 1) / 12);
    R.oTax[j] = (month === 3 && done >= 1) ? (done <= 4 ? sTax[done - 1] : 0) : 0;
  }
  for (let j = 0; j < NC; j++) {
    let s = 0; for (const k of OUT) s += R[k][j]; R.outTot[j] = s;
    R.net[j] = R.inTot[j] - R.outTot[j];
    R.cum[j] = j === 0 ? R.net[j] : R.cum[j - 1] + R.net[j];
    const idx = R.idx[j];
    R.fixedM[j] = SAME("pay", idx) + SAME("itMaint", idx) + SAME("itData", idx) + SAME("itSec", idx) + SAME("cloudBase", idx) + SAME("adminCost", idx) + SAME("int", idx);
    R.funded[j] = run.req + ((L.prepay > 0 && idx >= L.prepayAt) ? L.prepay : 0) + R.cum[j];
    R.flag[j] = R.funded[j] < 0 ? 1 : 0;
  }
  return R;
}

/* ─────────────── 월별자금필요표(FR) — 준비 시작 월부터 39개월(기본 A) ─────────────── */
function fbFundTable(cash, run) {
  const NM = 39; const j0 = 24 - run.pre; const F = {};
  const take = (k) => cash[k].slice(j0, j0 + NM);
  const add = (...ks) => { const out = new Array(NM).fill(0); ks.forEach((k, i) => { const src = take(k); for (let q = 0; q < NM; q++) out[q] = i === 0 ? src[q] : out[q] + src[q]; }); return out; };
  F.head = take("cal"); F.lab = take("lab"); F.heads = take("heads");
  F.rSub = take("rSub"); F.rChk = take("rChk"); F.rIns = take("insRec"); F.rP = take("rP"); F.rCare = take("rCare"); F.rOth = take("rOth");
  F.rTot = add("rSub", "rChk", "insRec", "rP", "rCare", "rOth");
  F.iSub = take("inSub"); F.iChk = take("inChk"); F.iIns = take("inIns"); F.iP = take("inP"); F.iCare = take("inCare"); F.iOth = add("inSvc", "inResv"); F.iTot = take("inTot");
  F.oPay = add("oPay", "oPrePay"); F.oAd = add("oMkt", "oMedia", "oPreMkt"); F.oBuild = take("oBuild"); F.oMedi = take("oMedi");
  F.oIT = add("oOpex", "oPreIT", "oPreOpex", "oCovSave"); F.oCogs = take("oCogs"); F.oCust = take("oCust"); F.oRent = add("oRent", "oDep", "oHire", "oOne");
  F.oCapex = take("oCapex"); F.oEtc = add("oInt", "oPreInt", "oTax", "oWc", "oRepay"); F.oTot = take("outTot");
  F.net = take("net"); F.cum = take("cum");
  F.inv = new Array(NM).fill(0); F.inv[0] = run.req;
  F.bal = F.cum.map((c) => run.req + c);
  F.chk = F.oTot.map((o, q) => Math.round(F.oPay[q] + F.oAd[q] + F.oBuild[q] + F.oMedi[q] + F.oIT[q] + F.oCogs[q] + F.oCust[q] + F.oRent[q] + F.oCapex[q] + F.oEtc[q] - o));
  const lowCal = run.low < 0 ? cash.cal[run.lowIdx] : "";
  F.summary = { req: run.req, need: run.need, low: run.low, lowCal, buffer: run.buffer, minBal: run.req + run.low, open: fbCal(1 + run.pre - 3) };
  return F;
}

/* ─────────────── 연간손익(YR) — gen_budget 연간손익 시트 5개년 ─────────────── */
function fbYearTable(P, A, cashA) {
  const Y = {}; const n = A.length;
  const set = (k, fn) => { Y[k] = A.map((a, i) => fn(a, i)); };
  const varr = (P.salesRate + P.adminRate) * P.opexScale;
  set("me", (a) => a.me); set("mp", (a) => a.mp); set("new", (a) => a.new); set("gross_new", (a) => a.gnew); set("active", (a) => a.activeFull);
  for (const k of FB_STREAM_KEYS) set("eff_" + k, (a) => a.eff[k]);
  set("activeAct", (a) => a.active); set("chkShare", (a, i) => fbOwnShare(P, i)); set("chkOwnN", (a) => a.chkOwn); set("chkPtnN", (a) => a.chkPtn);
  set("mkt", (a) => a.mkt); set("insts", (a) => a.insts);
  for (const t of FB_TYPES) { const s = FB_TYPE_SHORT[t]; set("fee_" + s, (a) => a.subFee[t]); set("paid_" + s, (a) => a.paid[t]); }
  set("buyers", (a) => a.buyers); set("svcUsers", (a) => a.svcU); set("resvFull", (a) => a.resvFull); set("resv", (a) => a.resv);
  set("careCtrFull", (a) => a.careCtrFull); set("careNFull", (a) => a.careNFull); set("careN", (a) => a.careN); set("headTotal", (a) => a.headTotal);
  set("mk2Impr", (a) => a.mk2Impr); set("qrNew", (a) => a.qrNew); set("avgMembers", (a) => a.avgMembers); set("bcRec", (a) => a.bcRec); set("swBuild", (a) => a.swBuild);
  set("insCasesFull", (a) => a.insCFull); set("insCases", (a) => a.insC); set("hmCap", (a) => a.hmCap); set("hmPrice", (a) => a.hmPrice); set("hmDiscN", (a) => a.hmDisc); set("hmFullN", (a) => a.hmFull);
  for (const c of P.productCats) set("rev_" + c.key, (a) => a.cat[c.key][0]);
  set("revP", (a) => a.revP); set("revChk_o", (a) => a.chkOwn * P.chkOwnFee); set("revChk_t", (a) => a.chkPtn * P.chkPtnFee); set("revChk", (a) => a.revChk);
  set("revSvc", (a) => a.revSvc); set("revResv", (a) => a.revResv); set("revCare", (a) => a.revCare);
  for (const t of FB_TYPES) { const s = FB_TYPE_SHORT[t]; set("effSub_" + s, (a) => a.effT[t]); set("sub_" + s, (a) => a.subT[t]); }
  set("revSub", (a) => a.revSub); set("revIns_d", (a) => a.hmDisc * a.hmPrice); set("revIns_f", (a) => a.hmFull * P.hmMarket); set("revIns", (a) => a.revIns); set("rev", (a) => a.rev);
  for (const c of P.productCats) set("cogs_" + c.key, (a) => a.cat[c.key][1]);
  set("cogsP", (a) => a.cogsP); set("chkCogs_o", (a) => a.chkOwn * P.chkOwnCost); set("chkCogs_t", (a) => a.chkPtn * P.chkPtnCost); set("chkCogs", (a) => a.chkCogs);
  set("svcCost", (a) => a.svcCost); set("careCost", (a) => a.careCost); set("subCost", (a) => a.subCost); set("payFee", (a) => a.payFee); set("cogs", (a) => a.cogs); set("gross", (a) => a.gross);
  set("gm", (a) => (a.rev === 0 ? 0 : a.gross / a.rev));
  ["mk1", "media", "creative", "cardAd", "kit", "sticker", "qrfee", "mktSum", "mediN", "mediRep", "reward"].forEach((k) => set(k, (a) => a[k]));
  set("donation", (a) => a.don); set("pay", (a) => a.pay);
  ["itMaint", "itData", "itSec", "cloudBase", "cloudVar", "llm", "bc", "itOpex"].forEach((k) => set(k, (a) => a[k]));
  set("salesCost", (a) => a.sales); set("adminCost", (a) => a.admin); set("sga", (a) => a.sga);
  set("ebitModel", (a) => a.ebit_model); set("depr", (a) => a.depr); set("ebit", (a) => a.ebit); set("opm", (a) => (a.rev === 0 ? 0 : a.ebit / a.rev));
  set("ebitda", (a) => a.ebit + a.depr); set("int", () => P.interestYear); set("pbt", (a) => a.ebit - P.interestYear);
  Y.nolOpen = []; Y.tax = []; Y.net = [];
  for (let i = 0; i < n; i++) {
    Y.nolOpen.push(i === 0 ? cashA.summary.pre : Math.max(0, Y.nolOpen[i - 1] - Y.pbt[i - 1]));
    Y.tax.push(Math.max(0, Y.pbt[i] - Y.nolOpen[i]) * P.taxRate); Y.net.push(Y.pbt[i] - Y.tax[i]);
  }
  set("capex", (a) => a.capex); set("capexMedi", (a) => a.medi); set("capexBuild1", (a, i) => (i === 0 ? a.swBuild + P.cost2.isms : 0));
  Y.capexBase = A.map((a, i) => a.capex - a.medi - Y.capexBuild1[i]);
  set("dwc", (a) => fbXround(a.rev * FB_WC_RATE));
  Y.fcf = A.map((a, i) => a.ebit - Math.max(0, a.ebit) * P.taxRate + a.depr - a.capex - Y.dwc[i]);
  Y.cumfcf = []; Y.fcf.forEach((f, i) => Y.cumfcf.push(i === 0 ? f : Y.cumfcf[i - 1] + f));
  set("netRev1", (a) => a.rev - a.cogsP); Y.netRev2 = A.map((a, i) => Y.netRev1[i] - a.reward);
  set("prodContrib", (a) => a.revP - a.cogsP - a.payFee - a.reward - a.don - a.revP * varr);
  Y.prodContribR = A.map((a, i) => (a.revP === 0 ? 0 : Y.prodContrib[i] / a.revP));
  Y.chkGP_o = A.map((a, i) => Y.revChk_o[i] - Y.chkCogs_o[i]); Y.chkGP_t = A.map((a, i) => Y.revChk_t[i] - Y.chkCogs_t[i]); Y.chkGP = A.map((a, i) => Y.chkGP_o[i] + Y.chkGP_t[i]);
  set("insContrib", (a) => a.revIns * (1 - varr)); Y.ebitExIns = A.map((a, i) => a.ebit - Y.insContrib[i]);
  set("hmBenefit", (a) => a.hmDisc * (P.hmMarket - a.hmPrice));
  Y.hmBenefitX = []; let hb = 0; for (let i = 0; i < n; i++) { hb += Y.hmBenefit[i]; Y.hmBenefitX.push(P.hmInvest === 0 ? 0 : hb / P.hmInvest); }
  set("effCac1", (a) => (a.new === 0 ? 0 : a.mktSum / a.new)); set("mktRatio", (a) => (a.rev === 0 ? 0 : a.mktSum / a.rev)); set("effCac2", (a) => (a.gnew === 0 ? 0 : a.mktSum / a.gnew));
  for (const c of P.productCats) set("full_" + c.key, (a) => a.catFull[c.key]);
  set("fullP", (a) => a.revPFull); set("fullChk", (a) => a.revChkFull); set("fullSvc", (a) => a.revSvcFull); set("fullResv", (a) => a.revResvFull); set("fullCare", (a) => a.revCareFull);
  set("fullSub", (a) => a.revSubFull); set("fullIns", (a) => a.revInsFull);
  Y.fullRev = A.map((a, i) => Y.fullP[i] + Y.fullChk[i] + Y.fullSvc[i] + Y.fullResv[i] + Y.fullCare[i] + Y.fullSub[i] + Y.fullIns[i]);
  Y.fullRatio = A.map((a, i) => (Y.fullRev[i] === 0 ? 0 : a.rev / Y.fullRev[i]));
  set("newConsent", (a, i) => (i === 0 ? a.mkt : a.mkt - A[i - 1].mkt)); set("imCases", (a) => a.imC); set("imRev", (a) => a.imRev);
  Y.imDiff = A.map((a, i) => Y.fullIns[i] - Y.imRev[i]);
  return Y;
}

/* ─────────────── 투자조건(TR) — 기준 선택 B(IM 80억) ─────────────── */
function fbInvestTerms(P, A, runs, cash, yr, sel) {
  const nm = sel || "B"; const run = runs[nm], R = cash[nm]; const T = {};
  T.sel = [{ A: 1, B: 2, C: 3 }[nm], null];
  const lowCal = run.low < 0 ? R.cal[run.lowIdx] : "";
  T.req = [run.req, "원"]; T.need = [run.need, "원"]; T.low = [run.low, "원"]; T.lowAt = [run.low_at, "기간"]; T.lowCal = [lowCal, "월"];
  T.buffer = [run.buffer, "원"]; T.prepay = [run.L.prepay, "원"]; T.runway = [run.runway, "기간"];
  const CATS = [["매출원가", ["oCogs"]], ["포인트 적립 · 기부금", ["oCust"]], ["마케팅(5대 엔진 광고 · 출시 전 사전 광고)", ["oMkt", "oMedia", "oPreMkt"]],
    ["CAPEX(1차 시스템 설치 · 고도화 · 보안 · 장비)", ["oBuild", "oCapex"]], ["메디에이지 리포트 구매(제휴 DB)", ["oMedi"]], ["인건비(준비기간 포함)", ["oPay", "oPrePay"]],
    ["AI·데이터·클라우드 · 영업 · 관리(준비기간 IT·기타 포함 · 사용료 미공급 절감 차감)", ["oOpex", "oPreIT", "oPreOpex", "oCovSave"]], ["임차 · 보증금 · 채용 · 일회성", ["oRent", "oDep", "oHire", "oOne"]],
    ["이자 · 세금 · 운전자본 · 차입 상환", ["oInt", "oPreInt", "oTax", "oWc", "oRepay"]]];
  // 저점 기간(MATCH(MIN(cum)))까지의 합
  let mn = Infinity, jl = 0; R.cum.forEach((c, j) => { if (c < mn) { mn = c; jl = j; } });
  const lowIdx = R.idx[jl];
  const sumto = (keys) => { let s = 0; for (const k of keys) { let x = 0; for (let j = 0; j < 84; j++) if (R.idx[j] <= lowIdx) x += R[k][j]; s += x; } return s; };
  const cats = CATS.map(([label, keys]) => ({ label, keys, out: sumto(keys) }));
  const outSum = cats.reduce((s, c) => s + c.out, 0);
  cats.forEach((c) => { c.share = outSum === 0 ? 0 : c.out / outSum; c.alloc = c.share * (-run.low); });
  T.uses = cats;
  T.catStart = [cats[0].out, cats[0].share]; T.catEnd = [cats[cats.length - 1].out, cats[cats.length - 1].share];
  T.outSum = [outSum, null]; T.inSum = [sumto(["inTot"]), null]; T.useTotal = [null, null];
  const rate = P.t1Rate == null ? FB_META.t1Rate : P.t1Rate;
  const tr = fbTranche(run, rate);
  T.t1r = [rate, "1차 투자 비율"]; T.t1 = [tr.t1, null];
  const runCal = (() => { for (let j = 0; j < 84; j++) if (tr.t1 + R.cum[j] < 0) return R.cal[j]; return ""; })();
  T.t1run = [tr.t1RunOut == null ? "소진 없음" : tr.t1RunOut, runCal];
  T.t2 = [tr.t2, null];
  const im = P.imAmt == null ? FB_META.imAmt : P.imAmt;
  T.im = [im, null]; T.hmInv = [P.hmInvest, null]; T.gap = [Math.max(0, run.req - P.hmInvest), null];
  const hmKeys = [["hmCap", "hmCap"], ["hmPrice", "hmPrice"], ["insCases", "insCases"], ["hmDiscN", "hmDiscN"], ["hmFullN", "hmFullN"], ["revIns", "revIns"], ["hmBenefit", "hmBenefit"], ["hmBenefitX", "hmBenefitX"]];
  hmKeys.forEach(([k, yk]) => { T["hm_" + k] = yr[yk].slice(0, 5); });
  T.hmStart = T.hm_hmCap;
  T.hmBenefitSum = [fbSum(yr.hmBenefit), "원"];
  return T;
}

/* ─────────────── 10개년 외삽(2032~2036) ─────────────── */
function fbExtendP(P, n) {
  const N = n || 10; const Q = fbClone(P);
  const g = Q.tenYearGrowth == null ? 0.18 : Q.tenYearGrowth; const gi = Q.instGrowthAfter5 == null ? 0.10 : Q.instGrowthAfter5;
  const L5 = P.membersEnd.length;
  const rA = P.activeAbs[L5 - 1] / P.membersEnd[L5 - 1], rM = P.mktConsentEnd[L5 - 1] / P.membersEnd[L5 - 1];
  const hold = (arr) => { if (!Array.isArray(arr) || !arr.length) return arr; while (arr.length < N) arr.push(arr[arr.length - 1]); return arr; };
  for (let y = Q.membersEnd.length; y < N; y++) {
    const me = fbXround(Q.membersEnd[y - 1] * (1 + g));
    Q.membersEnd.push(me); Q.activeAbs.push(fbXround(me * rA)); Q.mktConsentEnd.push(fbXround(me * rM));
  }
  for (const k of ["checkupCenters", "hospitals", "pharmacies"]) for (let y = Q[k].length; y < N; y++) Q[k].push(fbXround(Q[k][y - 1] * (1 + gi)));
  ["resvPerActive", "productRamp", "launchMkt", "payroll", "adPerActive", "aiAgentRate", "apiClients"].forEach((k) => hold(Q[k]));
  if (Q.matureY) Object.keys(Q.matureY).forEach((k) => hold(Q.matureY[k]));
  const C = Q.cost2;
  if (C) {
    ["mk1Target", "cardAdMsgs", "capexLater"].forEach((k) => hold(C[k]));
    for (let y = C.pensionY.length; y < N; y++) C.pensionY.push(Math.min(0.065, C.pensionY[y - 1] + 0.0025));
    for (let y = C.qrCenters.length; y < N; y++) C.qrCenters.push(C.qrCenters[y - 1] + 100);
  }
  return Q;
}
/* 10개년 법인세 — A 계획 이월결손금 풀(준비기간 비용)을 5년 뒤까지 이어서 */
function fbTaxes10(P, annual10, runA) {
  const out = runA.taxes.slice(0, 5);
  let pool = runA.pre_exp;
  annual10.forEach((a, i) => {
    const b = (a.ebit - P.interestYear) - (i === 0 ? runA.shortfall * (1 - runA.varRate) : 0);
    const tx = Math.max(0, b - pool) * P.taxRate; pool = Math.max(0, pool - b);
    if (i >= 5) out.push(tx);
  });
  return out;
}

/* ─────────────── 원장(월별 손익·현금·재무상태표) — A 계획 달력 2026-10~2031-12 ─────────────── */
/* scaleK: 실적 배율 k(회원 연동 계정, 2027-01~asOf.idx 월에만), lastIdx: 계산 마지막 기간 번호, isActual: 실적 원장(k = 1이어도 실적 규칙 적용)
   법인세 비용(계획·실적 공통): 연내 누적 과세표준 방식 — 연차 y의 월 m까지 누적 비용 = max(0, 연초~m 누적 세전이익(1차는 run의 base_0 보정 월할) − 그해 초 남은 이월결손금) × 세율,
   월 비용 = 누적 차이. 12월 누적 = runA.taxes[y](이월결손금 풀은 run과 같은 순서로 소진) */
function fbLedger(P, A, MR, cashA, runA, scaleK, lastIdx, isActual) {
  const L = FB_LEVERS.A; const pre = runA.pre; const PRE = 24;
  const k = scaleK == null ? 1 : scaleK; const endIdx = lastIdx == null ? 60 : lastIdx;
  const actualTo = (isActual == null ? k !== 1 : isActual) ? FB_ASOF.idx : 0;
  let yrPbt = 0, yrTax = 0;
  // 그해 초 남은 이월결손금(runA.taxes와 같은 base·순서)
  const taxAdj0 = -(runA.shortfall || 0) * (1 - (runA.varRate || 0));
  const poolStart = []; { let pool = runA.pre_exp; for (let y = 0; y < 5; y++) { poolStart.push(pool); const bk = A[y].pbt + (y === 0 ? taxAdj0 : 0); pool = Math.max(0, pool - bk); } }
  const im = P.imAmt == null ? FB_META.imAmt : P.imAmt; const rate = P.t1Rate == null ? FB_META.t1Rate : P.t1Rate;
  const t1 = Math.min(im, Math.ceil(im * rate / 1e9) * 1e9), t2 = im - t1;
  const varRate = (P.salesRate + P.adminRate) * P.opexScale;
  const rows = [];
  // 실적 월 배율 — 회원 연동 줄
  const sc = (idx) => (idx >= 1 && idx <= actualTo ? k : 1);
  // 사용료: 연내 누적 순서 한도(tier) 재적용
  const insAct = new Array(60).fill(0);
  for (let y = 0; y < 5; y++) {
    const a = A[y]; const cases = []; for (let m = 0; m < 12; m++) { const idx = y * 12 + m + 1; cases.push(MR.hmCasesM[idx - 1] * (idx <= 12 ? L.insCov[idx - 1] : 1) * sc(idx)); }
    const fees = fbTier(cases, a.hmCap, a.hmPrice, P.hmMarket); for (let m = 0; m < 12; m++) insAct[y * 12 + m] = fees[m];
  }
  const line = (key, idx) => (idx < 1 ? 0 : MR[key][idx - 1]);
  const revLines = (idx) => {
    const s = sc(idx);
    return { P: line("revP", idx) * s, Chk: line("revChk", idx) * s, Svc: line("revSvc", idx) * s, Resv: line("revResv", idx) * s, Care: line("revCare", idx) * s, Sub: line("revSub", idx) * s, Ins: idx < 1 ? 0 : insAct[idx - 1] };
  };
  const lag = L.lag; const collect = (key, lg, idx) => { const p = idx - lg; if (idx < L.cashStart || p < 1) return 0; return revLines(p)[key]; };
  let bs = { cash: 0, ar: 0, deposit: 0, cip: 0, ppe: 0, wcAsset: 0, taxPay: 0, capital: 0, re: 0, rePL: 0, rePre: 0, reOff: 0 };
  let cumNet = 0;
  for (let j = PRE - pre; j < PRE + endIdx; j++) {
    const idx = j - PRE + 1; const cal = cashA.cal[j]; const s = sc(idx);
    const r = { idx, cal, lab: cashA.lab[j], actual: idx >= 1 && idx <= actualTo };
    const invIn = (cal === FB_INVEST_CAL.t1 ? t1 : 0) + (cal === FB_INVEST_CAL.t2 ? t2 : 0);
    const pl = {}; const cf = {};
    if (idx < 1) {
      ["rev", "revP", "revChk", "revSvc", "revResv", "revCare", "revSub", "revIns", "cogs", "gross", "mktSum", "mediRep", "reward", "donation", "pay", "itOpex", "salesCost", "adminCost", "sga", "ebitda", "depr", "ebit", "int", "pbt", "taxExp", "net",
        "mk1", "media", "creative", "cardAd", "kit", "sticker", "qrfee", "itMaint", "itData", "itSec", "cloudBase", "cloudVar", "llm", "bc", "cogsP", "chkCogs", "careCost", "subCost", "payFee", "svcCost"].forEach((x) => { pl[x] = 0; });
      const g = (x) => cashA[x][j];
      cf.inTot = 0;
      Object.assign(cf, { oPrePay: g("oPrePay"), oPreMkt: g("oPreMkt"), oPreIT: g("oPreIT"), oPreOpex: g("oPreOpex"), oPreInt: g("oPreInt"), oRent: g("oRent"), oHire: g("oHire"), oOne: g("oOne"), oDep: g("oDep"), oBuild: g("oBuild") });
      cf.preExp = cf.oPrePay + cf.oPreMkt + cf.oPreIT + cf.oPreOpex + cf.oPreInt + cf.oRent + cf.oHire + cf.oOne;
      cf.outTot = cf.preExp + cf.oDep + cf.oBuild;
      cf.offPL = 0; cf.oCapex = 0; cf.oTax = 0; cf.oWc = 0; cf.oCogs = 0; cf.oCust = 0; cf.oMkt = 0; cf.oMedia = 0; cf.oPay = 0; cf.oOpex = 0; cf.oInt = 0; cf.oMedi = 0;
    } else {
      const t = idx - 1; const y = Math.floor(t / 12); const rl = revLines(idx);
      pl.revP = rl.P; pl.revChk = rl.Chk; pl.revSvc = rl.Svc; pl.revResv = rl.Resv; pl.revCare = rl.Care; pl.revSub = rl.Sub; pl.revIns = rl.Ins;
      pl.rev = pl.revP + pl.revChk + pl.revSvc + pl.revResv + pl.revCare + pl.revSub + pl.revIns;
      ["cogsP", "chkCogs", "svcCost", "careCost", "subCost", "payFee"].forEach((x) => { pl[x] = MR[x][t] * s; });
      pl.cogs = MR.cogs[t] * s; pl.gross = pl.rev - pl.cogs;
      ["mk1", "media", "creative", "cardAd", "kit", "pay", "itMaint", "itData", "itSec", "cloudBase", "depr", "int"].forEach((x) => { pl[x] = MR[x][t]; });
      ["sticker", "qrfee", "mediRep", "reward", "donation", "cloudVar", "llm", "bc", "salesCost", "adminCost"].forEach((x) => { pl[x] = MR[x][t] * s; });
      pl.mktSum = pl.mk1 + pl.media + pl.creative + pl.cardAd + pl.kit + pl.sticker + pl.qrfee;
      pl.itOpex = pl.itMaint + pl.itData + pl.itSec + pl.cloudBase + pl.cloudVar + pl.llm + pl.bc;
      pl.sga = pl.mktSum + pl.mediRep + pl.reward + pl.donation + pl.pay + pl.itOpex + pl.salesCost + pl.adminCost;
      pl.ebitda = pl.gross - pl.sga; pl.ebit = pl.ebitda - pl.depr; pl.pbt = pl.ebit - pl.int;
      if (t % 12 === 0) { yrPbt = 0; yrTax = 0; }
      yrPbt += pl.pbt;
      const adj = y === 0 ? taxAdj0 * (t % 12 + 1) / 12 : 0;
      const due = Math.max(0, yrPbt + adj - poolStart[y]) * P.taxRate;
      pl.taxExp = due - yrTax; yrTax = due;
      pl.net = pl.pbt - pl.taxExp;
      // 현금 — 유입(회수 지연)
      cf.inP = collect("P", lag.P, idx); cf.inChk = collect("Chk", lag.Chk, idx); cf.inSvc = collect("Svc", lag.Svc, idx); cf.inCare = collect("Care", lag.Svc, idx);
      cf.inResv = collect("Resv", lag.Resv, idx); cf.inSub = collect("Sub", lag.Sub, idx); cf.inIns = collect("Ins", lag.Ins, idx);
      cf.inTot = cf.inP + cf.inChk + cf.inSvc + cf.inCare + cf.inResv + cf.inSub + cf.inIns;
      const g = (x) => cashA[x][j];
      cf.oCogs = pl.cogs; cf.oCust = pl.reward + pl.donation;
      cf.oMkt = pl.mk1 + pl.creative + pl.cardAd + pl.kit + pl.sticker + pl.qrfee; cf.oMedia = g("oMedia");
      cf.oCapex = g("oCapex"); cf.oPay = pl.pay; cf.oOpex = pl.itOpex + pl.salesCost + pl.adminCost; cf.oInt = pl.int;
      cf.oWc = (pl.rev - pl.revIns + pl.revIns) * L.wc; cf.oTax = g("oTax");
      cf.oCovSave = 0 * varRate; cf.oRent = g("oRent"); cf.oDep = g("oDep"); cf.oHire = g("oHire"); cf.oOne = g("oOne"); cf.oBuild = g("oBuild"); cf.oMedi = pl.mediRep; cf.oRepay = g("oRepay");
      cf.outTot = cf.oCogs + cf.oCust + cf.oMkt + cf.oMedia + cf.oCapex + cf.oPay + cf.oOpex + cf.oInt + cf.oWc + cf.oTax + cf.oCovSave + cf.oRent + cf.oDep + cf.oHire + cf.oOne + cf.oBuild + cf.oMedi + cf.oRepay;
      cf.offPL = cf.oRent + cf.oHire + cf.oOne; cf.preExp = 0;
    }
    cf.net = cf.inTot - cf.outTot; cf.invIn = invIn;
    cumNet += cf.net;
    // 재무상태표 롤포워드
    const prev = bs; const b = Object.assign({}, prev);
    b.capital = prev.capital + invIn;
    b.cash = b.capital + cumNet;
    if (idx < 1) {
      b.deposit = prev.deposit + cf.oDep; b.cip = prev.cip + cf.oBuild; b.re = prev.re - cf.preExp; b.rePre = prev.rePre - cf.preExp;
    } else {
      b.ar = prev.ar + pl.rev - cf.inTot;
      b.deposit = prev.deposit + cf.oDep;
      let add = cf.oCapex + cf.oBuild;
      if (idx === 1) { add += prev.cip; b.cip = 0; }
      b.ppe = prev.ppe + add - pl.depr;
      b.wcAsset = prev.wcAsset + cf.oWc;
      b.taxPay = prev.taxPay + pl.taxExp - cf.oTax;
      b.re = prev.re + pl.net - cf.offPL; b.rePL = prev.rePL + pl.net; b.reOff = prev.reOff - cf.offPL;
    }
    b.curAssets = b.cash + b.ar; b.nonCurAssets = b.deposit + b.cip + b.ppe + b.wcAsset;
    b.assets = b.curAssets + b.nonCurAssets; b.liabilities = b.taxPay; b.equity = b.capital + b.re;
    b.diff = b.assets - b.liabilities - b.equity;
    // 현금흐름표(간접법)
    const dAR = b.ar - prev.ar, dTax = b.taxPay - prev.taxPay;
    const opCF = idx < 1 ? -cf.preExp : pl.net + pl.depr - dAR + dTax - cf.offPL - cf.oWc;
    const invCF = -(cf.oCapex + cf.oDep + cf.oBuild);
    r.pl = pl; r.cf = Object.assign(cf, { opCF, invCF, finCF: invIn }); r.bs = b; r.members = idx < 1 ? 0 : MR.endM[idx - 1] * s;
    rows.push(r); bs = b;
  }
  return rows;
}
/* 원장 구간 합(흐름) · 9월 일할 */
function fbLedgerSum(rows, from, to, lastFrac) {
  const out = { pl: {}, cf: {} };
  rows.filter((r) => r.idx >= from && r.idx <= to).forEach((r) => {
    const f = (r.idx === to && lastFrac != null) ? lastFrac : 1;
    for (const x of Object.keys(r.pl)) out.pl[x] = (out.pl[x] || 0) + r.pl[x] * f;
    for (const x of Object.keys(r.cf)) if (typeof r.cf[x] === "number") out.cf[x] = (out.cf[x] || 0) + r.cf[x] * f;
  });
  return out;
}
/* 잔액 보간 — 전월 말 + (당월 − 전월) × frac */
function fbInterpBS(prevBs, curBs, frac) {
  const o = {}; for (const x of Object.keys(curBs)) o[x] = prevBs[x] + (curBs[x] - prevBs[x]) * frac; return o;
}

/* ─────────────── 기준일 실적 층(2027-09-17) ─────────────── */
function fbAsOf(P, A, MR, cashA, runA) {
  const frac = FB_ASOF.frac; const idx = FB_ASOF.idx;
  const ends = fbMemberEnds(P, 0).ends;
  const planMembers = ends[FB_ASOF.m - 1] + (ends[FB_ASOF.m] - ends[FB_ASOF.m - 1]) * frac;
  const actualMembers = P.actualMembers == null ? FB_ASOF.actualMembers : P.actualMembers;
  const k = actualMembers / planMembers;
  const planL = fbLedger(P, A, MR, cashA, runA, 1, idx, false);
  const actL = fbLedger(P, A, MR, cashA, runA, k, idx, true);
  const pick = (L) => {
    const byIdx = (i) => L.find((r) => r.idx === i);
    const aug = byIdx(idx - 1), sep = byIdx(idx), dec = byIdx(0);
    const bs = fbInterpBS(aug.bs, sep.bs, frac);
    const ytd = fbLedgerSum(L, 1, idx, frac);
    const prep = fbLedgerSum(L, -2, 0, null);
    const monthly = L.map((r) => {
      if (r.idx !== idx) return r;
      const pl = {}, cf = {}; for (const x of Object.keys(r.pl)) pl[x] = r.pl[x] * frac; for (const x of Object.keys(r.cf)) cf[x] = typeof r.cf[x] === "number" ? r.cf[x] * frac : r.cf[x];
      return Object.assign({}, r, { pl, cf, bs, members: aug.members + (r.members - aug.members) * frac, partial: frac });
    });
    const cfOut = {
      period: "2027-01-01~" + FB_ASOF.date, opCF: ytd.cf.opCF, invCF: ytd.cf.invCF, finCF: ytd.cf.finCF, net: ytd.cf.net,
      begCash: dec.bs.cash, endCash: dec.bs.cash + ytd.cf.opCF + ytd.cf.invCF + ytd.cf.finCF,
      prep: { period: "2026-10~2026-12", opCF: prep.cf.opCF, invCF: prep.cf.invCF, finCF: prep.cf.finCF, begCash: 0, endCash: prep.cf.opCF + prep.cf.invCF + prep.cf.finCF },
    };
    return { L, monthly, bs, ytd: ytd.pl, ytdCf: ytd.cf, cf: cfOut, dec: dec.bs, members: aug.members + (sep.members - aug.members) * frac };
  };
  const p = pick(planL), a = pick(actL);
  const rate = {}; for (const x of Object.keys(a.ytd)) rate[x] = p.ytd[x] ? a.ytd[x] / p.ytd[x] : null;
  const act = a.L; const last3 = [idx - 3, idx - 2, idx - 1].map((i) => act.find((r) => r.idx === i));
  const burn3m = -(last3.reduce((s, r) => s + r.cf.net, 0) / 3);
  const runwayMonths = burn3m > 0 ? a.bs.cash / burn3m : null;
  const im = P.imAmt == null ? FB_META.imAmt : P.imAmt; const t1r = P.t1Rate == null ? FB_META.t1Rate : P.t1Rate;
  const t1 = Math.min(im, Math.ceil(im * t1r / 1e9) * 1e9);
  return {
    date: FB_ASOF.date, frac, idx, actualMembers, planMembers, k, achieveMembers: actualMembers / planMembers,
    ytd: { plan: p.ytd, actual: a.ytd, rate }, ytdCash: { plan: p.ytdCf, actual: a.ytdCf },
    monthly: { plan: p.monthly, actual: a.monthly },
    cash: { plan: { balance: p.bs.cash, cumPreFunding: p.bs.cash - p.bs.capital }, actual: { balance: a.bs.cash, cumPreFunding: a.bs.cash - a.bs.capital } },
    bs: { plan: p.bs, actual: a.bs, dec2026: a.dec },
    cf: { plan: p.cf, actual: a.cf },
    members: { plan: p.members, actual: a.members },
    kpi: { burn3m, runwayMonths, t1, t2: im - t1, t2Received: FB_INVEST_CAL.t2 <= FB_ASOF.date.slice(0, 7), capitalIn: a.bs.capital,
      lowPlan: runA.low, lowPlanCal: runA.low < 0 ? cashA.cal[runA.lowIdx] : "", revRate: rate.rev, ebitRate: rate.ebit },
  };
}

/* ─────────────── 시나리오·오버라이드 ─────────────── */
function fbScenario() { try { return localStorage.getItem(FB_SCN_KEY) || "base"; } catch (e) { return "base"; } }
function fbSetScenario(k) { try { localStorage.setItem(FB_SCN_KEY, k); } catch (e) {} }
function fbOverrides() { try { const o = JSON.parse(localStorage.getItem(FB_PARAMS_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
function fbSetParam(key, val) {
  try {
    if (FB_OVERRIDE_KEYS.indexOf(key) < 0) return false;
    const o = fbOverrides();
    if (val === null || val === "" || val === undefined || isNaN(val)) delete o[key]; else o[key] = Number(val);
    localStorage.setItem(FB_PARAMS_KEY, JSON.stringify(o)); return true;
  } catch (e) { return false; }
}
function fbResetParams() { try { localStorage.removeItem(FB_PARAMS_KEY); localStorage.removeItem(FB_SCN_KEY); } catch (e) {} }
function fbParams() {
  const P = fbClone(FB_P0);
  const scnKey = fbScenario(); const s = FB_SCENARIOS[scnKey] || FB_SCENARIOS.base;
  if (s.memberMult !== 1) ["membersEnd", "activeAbs", "mktConsentEnd"].forEach((k) => { P[k] = P[k].map((v) => fbXround(v * s.memberMult)); });
  if (s.instMult !== 1) ["checkupCenters", "hospitals", "pharmacies"].forEach((k) => { P[k] = P[k].map((v) => fbXround(v * s.instMult)); });
  if (s.rateMult !== 1) { P.productBuyerRate = Math.min(1, P.productBuyerRate * s.rateMult); P.insConvRate = Math.min(1, P.insConvRate * s.rateMult); }
  if (s.cacMult !== 1 && P.cost2) { Object.keys(P.cost2.chCpm).forEach((k) => { P.cost2.chCpm[k] = P.cost2.chCpm[k] * s.cacMult; }); P.cost2.naverCpc = P.cost2.naverCpc * s.cacMult; }
  const o = fbOverrides(); const has = (k) => o[k] != null && !isNaN(o[k]);
  for (let i = 0; i < 5; i++) { if (has("members" + (i + 1))) P.membersEnd[i] = o["members" + (i + 1)]; if (has("activeAbs" + (i + 1))) P.activeAbs[i] = o["activeAbs" + (i + 1)]; }
  ["productBuyerRate", "productCapture", "prodAdjY1", "chkOwnFee", "chkPtnFee", "chkOwnShareY1", "hmMarket", "hmRate1", "hmCap1", "rewardRate", "donationRate", "careFee", "wacc", "evRevMultiple", "tenYearGrowth", "t1Rate", "actualMembers"]
    .forEach((k) => { if (has(k)) P[k] = o[k]; });
  if (has("subFeeBase_c")) P.subFeeBaseT.centers = o.subFeeBase_c;
  if (has("subFeeBase_h")) P.subFeeBaseT.hospitals = o.subFeeBase_h;
  if (has("subFeeBase_p")) P.subFeeBaseT.pharmacies = o.subFeeBase_p;
  if (has("subStart")) FB_TYPES.forEach((t) => { P.subStartYear[t] = o.subStart; });
  ["headElast", "wageGrowth", "mk2Impr", "maintRate"].forEach((k) => { if (has(k) && P.cost2) P.cost2[k] = o[k]; });
  P.scn = FB_SCENARIOS[scnKey] ? scnKey : "base"; P.scnMeta = s;
  return P;
}

/* ─────────────── 모델 묶음(메모이즈) ─────────────── */
let fbCache = null;
function fbModel(Pin) {
  const P = Pin || fbParams();
  const key = JSON.stringify(P);
  if (fbCache && fbCache.key === key) return fbCache.m;
  const A = fbAnnual(P, 5);
  const runs = { A: fbRun(P, FB_LEVERS.A, A), B: fbRun(P, FB_LEVERS.B, A), C: fbRun(P, FB_LEVERS.C, A) };
  const monthly = fbMonthlyPL(P, A);
  const hr = fbHrTable(P, A);
  const cash = { A: fbCashTable(P, FB_LEVERS.A, A, monthly, hr, runs.A), B: fbCashTable(P, FB_LEVERS.B, A, monthly, hr, runs.B), C: fbCashTable(P, FB_LEVERS.C, A, monthly, hr, runs.C) };
  const fund = fbFundTable(cash.A, runs.A);
  const yr = fbYearTable(P, A, cash.A);
  const terms = fbInvestTerms(P, A, runs, cash, yr, "B");
  const P10 = fbExtendP(P, 10);
  const annual10 = fbAnnual(P10, 10);
  const taxes10 = fbTaxes10(P, annual10, runs.A);
  const plan = fbLedger(P, A, monthly, cash.A, runs.A, 1, 60);
  const asOf = fbAsOf(P, A, monthly, cash.A, runs.A);
  const m = { P, P10, annual: A, annual10, taxes10, runs, monthly, hr, cash, fund, yr, terms, ledger: { plan }, asOf, meta: FB_META, asOfDef: FB_ASOF };
  fbCache = { key, m };
  return m;
}
