/* 사이트 재무회계 엔진(finBudget.js · finModel.js 래퍼) 회귀 대조 — 예산양식 v3.8 정답(scripts/fin_site_golden.json)과 비교
   사용: node scripts/fin_site_check.mjs          (하나라도 실패하면 종료코드 1)
   · 번들과 같게 finBudgetParams.js → finBudget.js → finModel.js 를 한 컨텍스트에 이어 붙여 싣는다(가짜 window·localStorage).
   · 정답 생성기: py scripts/invest/export_site_fin.py <v3.8 xlsx> (엑셀 재계산본 · oracle.annual · oracle3.run) */
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const G = JSON.parse(readFileSync(path.join(ROOT, "scripts", "fin_site_golden.json"), "utf8"));

/* ── 컨텍스트 ── */
const store = {};
const localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const ctx = { console, localStorage };
ctx.window = ctx;
vm.createContext(ctx);
const SRC = ["src/data/finBudgetParams.js", "src/data/finBudget.js", "src/data/finModel.js"].map((f) => readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
vm.runInContext(SRC + `
;globalThis.__T = { fbModel, fbParams, fbAnnual, fbExtendP, fbXround, fbTranche, FB_P0, FB_META, FB_SCENARIOS,
  finParams, finYears, finMonthlyY1, finSaaSModel, finKPIs, finValModel, finBSYear, finCFYear, finAsk, finSubFee, finSubFeeT,
  finScenario, finSetScenario, finOverrides, finSetParam, finResetParams, FIN_SCENARIOS, FIN_GRAPH };`, ctx, { filename: "fin_bundle.js" });
const T = ctx.__T;

/* ── 보고 ── */
const results = [];
function report(name, ok, maxDiff, note) {
  results.push({ name, ok, maxDiff, note });
  const md = maxDiff == null ? "" : ` · 최대 차이 ${typeof maxDiff === "number" ? (Math.abs(maxDiff) < 1e-3 && maxDiff !== 0 ? maxDiff.toExponential(2) : +maxDiff.toFixed(6)) : maxDiff}`;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${md}${note ? " · " + note : ""}`);
}
const isNum = (v) => typeof v === "number" && !Number.isNaN(v);
/* 값 비교기 — 숫자는 허용 오차, 문자열은 동일, 정답 null은 건너뜀 */
function cmpVal(g, m, tol, acc, where) {
  if (g === null || g === undefined) return;
  if (typeof g === "number") {
    if (!isNum(m)) { acc.bad.push(`${where}: 정답 ${g} · 엔진 ${m}`); acc.max = Infinity; return; }
    const d = Math.abs(g - m);
    if (d > acc.max) acc.max = d;
    if (d > tol) acc.bad.push(`${where}: 정답 ${g} · 엔진 ${m} (차이 ${d})`);
  } else if (typeof g === "boolean") {
    if (g !== m) acc.bad.push(`${where}: 정답 ${g} · 엔진 ${m}`);
  } else {
    if (String(g) !== String(m)) acc.bad.push(`${where}: 정답 "${g}" · 엔진 "${m}"`);
  }
}
function newAcc() { return { max: 0, bad: [] }; }
function finish(name, acc, note) {
  const ok = acc.bad.length === 0;
  report(name, ok, acc.max, ok ? note : `${acc.bad.length}건 불일치 — ${acc.bad.slice(0, 4).join(" | ")}`);
}
/* 파이썬 flat()과 같은 평탄화 */
function flat(d, pre = "") {
  const out = {};
  for (const k of Object.keys(d)) {
    const v = d[k]; const key = pre + k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flat(v, key + "."));
    else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === "number") out[`${key}.${i}`] = x; });
    else if (typeof v === "number") out[key] = v;
  }
  return out;
}
function tryRun(name, fn) {
  try { return fn(); } catch (e) { report(name, false, null, "예외: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e)); return undefined; }
}

/* ══════════ 1) 기본 상태(시나리오 기준 · 오버라이드 없음) = 정답 ══════════ */
const M = tryRun("fbModel() 실행", () => T.fbModel());
if (!M) { console.log("엔진 실행 실패 — 중단"); process.exit(1); }

// 1-1 연간 계정(oracle.annual)
{
  const acc = newAcc();
  G.annual.forEach((gr, y) => {
    const mf = flat(M.annual[y]);
    for (const k of Object.keys(gr)) cmpVal(gr[k], mf[k], k.startsWith("eff.") ? 1e-9 : 1, acc, `${y + 1}차 ${k}`);
  });
  finish(`연간 계정 golden.annual (${Object.keys(G.annual[0]).length}키 × 5년, ≤1원 · eff ≤1e-9)`, acc);
}
// 1-2 엑셀 연간손익 YR(엔진이 내는 키)
{
  const acc = newAcc(); let n = 0; const skipped = [];
  const YR_SNAPSHOT_ONLY = (k) => /^diff_/.test(k) || k === "chkStart";   // 엑셀의 사이트 스냅샷 대조 열(엔진 산출 아님) — 이 밖의 누락은 실패
  const RATIO = new Set(["gm", "opm", "chkShare", "prodContribR", "hmBenefitX", "mktRatio", "fullRatio"]);
  for (const k of Object.keys(G.excel.YR)) {
    if (!(k in M.yr)) { if (YR_SNAPSHOT_ONLY(k)) skipped.push(k); else acc.bad.push(`YR.${k} 엔진에 없음`); continue; }
    n++;
    G.excel.YR[k].forEach((g, i) => cmpVal(g, M.yr[k][i], (RATIO.has(k) || k.startsWith("eff")) ? 1e-9 : 1, acc, `YR.${k}[${i}]`));
  }
  finish(`엑셀 연간손익 YR ${n}키 (≤1원 · 비율 ≤1e-9)`, acc, `엔진 밖(finModel.js 스냅샷 대조) 제외 ${skipped.length}키: ${skipped.join(",")}`);
}
// 1-3 현금 계획 run A/B/C
for (const nm of ["A", "B", "C"]) {
  const g = G.runs[nm], r = M.runs[nm];
  const acc = newAcc();
  for (const k of ["low", "fixed_avg", "buffer", "need", "req", "tax1", "pre_exp"]) cmpVal(g[k], r[k], 1, acc, k);
  for (const k of ["low_at", "runway"]) cmpVal(g[k], r[k], 0, acc, k);
  g.taxes.forEach((v, i) => cmpVal(v, r.taxes[i], 1, acc, `taxes[${i}]`));
  finish(`run ${nm} 요약(저점·필요·요청·시기·런웨이·법인세·준비기간 비용 ≤1원)`, acc);
  const a2 = newAcc();
  if (!Array.isArray(r.series) || r.series.length !== g.series.length) a2.bad.push(`series 길이 ${r.series && r.series.length}`);
  else g.series.forEach((row, j) => row.forEach((v, c) => cmpVal(v, r.series[j][c], 0.01, a2, `series[${j}][${c}]`)));
  g.insRecM.forEach((v, i) => cmpVal(v, r.insRecM[i], 0.01, a2, `insRecM[${i}]`));
  finish(`run ${nm} series 84개월·insRecM 60개월 (≤0.01원)`, a2);
  const a3 = newAcc();
  const tr = T.fbTranche(r, T.FB_META.t1Rate);
  for (const k of ["t1", "t2", "t1RunOut"]) cmpVal(g.tranche[k] === null ? "null" : g.tranche[k], tr[k] === null ? "null" : tr[k], 0, a3, `tranche.${k}`);
  for (const k of ["t1", "t2", "t1RunOut"]) cmpVal(g.tranche[k] === null ? "null" : g.tranche[k], r.tranche[k] === null ? "null" : r.tranche[k], 0, a3, `run.tranche.${k}`);
  finish(`run ${nm} 트랜치 T1·T2·T1 소진`, a3);
  const blk = { A: "RA", B: "RB", C: "RC" }[nm];
  const a4 = newAcc();
  for (const k of Object.keys(G.excel[blk])) {
    const mine = M.cash[nm][k];
    if (!Array.isArray(mine)) { a4.bad.push(`${blk}.${k} 없음`); continue; }
    G.excel[blk][k].forEach((v, j) => cmpVal(v, mine[j], 0.5, a4, `${blk}.${k}[${j}]`));
  }
  finish(`현금 계정 분해 ${blk} ${Object.keys(G.excel[blk]).length}행 × 84개월 (≤0.5원 · 문자열 동일)`, a4);
}
// 1-4 월별 손익 MR
{
  const acc = newAcc();
  for (const k of Object.keys(G.excel.MR)) {
    const mine = M.monthly[k];
    if (!Array.isArray(mine)) { acc.bad.push(`MR.${k} 없음`); continue; }
    G.excel.MR[k].forEach((v, t) => cmpVal(v, mine[t], 0.5, acc, `MR.${k}[${t}]`));
  }
  finish(`월별 손익 MR ${Object.keys(G.excel.MR).length}계정 × 60개월 (≤0.5원)`, acc);
}
// 1-5 월별자금필요표 FR
{
  const acc = newAcc();
  for (const k of Object.keys(G.excel.FR)) {
    const mine = M.fund[k];
    const g = G.excel.FR[k];
    if (g.every((v) => v === null)) continue;          // 요약 행(엑셀 C열) — D열 이후 없음
    if (!Array.isArray(mine)) { acc.bad.push(`FR.${k} 없음`); continue; }
    g.forEach((v, t) => cmpVal(v, mine[t], 0.5, acc, `FR.${k}[${t}]`));
  }
  const FS = M.fund.summary || {}; const GA = G.runs.A;
  for (const k of ["req", "need", "low", "buffer"]) cmpVal(GA[k], FS[k], 1, acc, `FR.summary.${k} = run A`);
  cmpVal(GA.req + GA.low, FS.minBal, 1, acc, "FR.summary.minBal = req + low");
  { const mm = /^([0-9]+)차-([0-9]+)$/.exec(GA.low_at); cmpVal(mm ? `${2026 + +mm[1]}-${mm[2]}` : GA.low_at, FS.lowCal, 0, acc, "FR.summary.lowCal = A low_at(달력)"); }
  finish("월별자금필요표 FR 39개월 (≤0.5원) · 요약(요청·필요·저점·버퍼·최저잔액·저점 월) = run A", acc);
}
// 1-6 인력계획 HR
{
  const acc = newAcc();
  for (const k of Object.keys(G.excel.HR)) {
    const mine = M.hr[k];
    if (!Array.isArray(mine)) { acc.bad.push(`HR.${k} 없음`); continue; }
    G.excel.HR[k].forEach((v, i) => cmpVal(v, mine[i], typeof v === "number" && Math.abs(v) < 1 ? 1e-9 : 1, acc, `HR.${k}[${i}]`));
  }
  finish(`인력계획 HR ${Object.keys(G.excel.HR).length}행 (≤1원)`, acc);
}
// 1-7 투자조건 TR(B)
{
  const acc = newAcc();
  for (const k of Object.keys(G.excel.TR)) {
    const g = G.excel.TR[k], mine = M.terms[k];
    if (!Array.isArray(mine)) { acc.bad.push(`TR.${k} 없음`); continue; }
    cmpVal(g[0], mine[0], typeof g[0] === "number" && Math.abs(g[0]) < 10 ? 1e-9 : 1, acc, `TR.${k}[0]`);
    if (typeof g[1] === "number" || k === "t1run") cmpVal(g[1], mine[1], typeof g[1] === "number" && Math.abs(g[1]) < 10 ? 1e-9 : 1, acc, `TR.${k}[1]`);
  }
  finish(`투자조건 TR(B 기준) ${Object.keys(G.excel.TR).length}행 — 요청·트랜치·사용처·우대 조건`, acc);
}

/* ══════════ 2) 재무상태표·현금흐름표 ══════════ */
{
  const L = M.ledger.plan; const acc = newAcc();
  if (!L || L.length !== 63) acc.bad.push(`계획 원장 길이 ${L && L.length}(2026-10~2031-12 = 63)`);
  else L.forEach((r) => { const d = Math.abs(r.bs.diff); if (d > acc.max) acc.max = d; if (!(d <= 1)) acc.bad.push(`${r.cal} 대차 차이 ${r.bs.diff}`); });
  if (L && L.length) {
    if (L[0].cal !== "2026-10" || L[L.length - 1].cal !== "2031-12") acc.bad.push(`원장 달력 ${L[0].cal}~${L[L.length - 1].cal}`);
    // 현금 = 투자금 납입 누계 + A 누적 현금(조달 전)
    L.forEach((r, i) => cmpVal(M.cash.A.cum[21 + i] + r.bs.capital, r.bs.cash, 1, acc, `${r.cal} 현금 = 납입 + A 누적`));
  }
  finish("계획 B/S 매월 대차 일치 2026-10~2031-12 (≤1원) · 현금 = 납입 누계 + A 누적 현금", acc);
}
/* 설계서 5·6절 — 엔진 항등식이 아니라 정답(엑셀 RA·MR·run A)에서 따로 굴린 기대 잔액과 대조 */
{
  const L = M.ledger.plan || []; const acc = newAcc();
  const RA = G.excel.RA, MRg = G.excel.MR, GA = G.runs.A;
  const capAt = (cal) => (cal >= "2026-10" ? 6e9 : 0) + (cal >= "2027-08" ? 2e9 : 0);   // 설계서 0-5: 1차 60억 2026-10 · 2차 20억 2027-08
  let ar = 0, dep = 0, build = 0, capex = 0, depr = 0, taxExp = 0, taxPaid = 0, rePL = 0, off = 0, pre = 0;
  // 법인세 — 연내 누적 과세표준(정답 MR 세전이익 · 준비기간 결손금 풀을 연차 순서로 소진 · 1차 base_0 보정 월할)
  const taxRate = T.fbParams().taxRate; const adj0 = -(M.runs.A.shortfall || 0) * (1 - (M.runs.A.varRate || 0));
  const yPbt = [0, 1, 2, 3, 4].map((y) => { let s = 0; for (let m = 0; m < 12; m++) s += MRg.ebit[y * 12 + m] - MRg.int[y * 12 + m]; return s; });
  const pool0 = []; { let pool = GA.pre_exp; for (let y = 0; y < 5; y++) { pool0.push(pool); pool = Math.max(0, pool - (yPbt[y] + (y === 0 ? adj0 : 0))); } }
  let yCumPbt = 0, yCumTax = 0;
  L.forEach((r) => {
    const j = r.idx + 23;
    if (RA.cal[j] !== r.cal) acc.bad.push(`${r.cal} 달력 ≠ 정답 ${RA.cal[j]}`);
    cmpVal(capAt(r.cal), r.bs.capital, 0, acc, `${r.cal} 납입자본`);
    dep += RA.oDep[j]; build += RA.oBuild[j];
    if (r.idx < 1) pre += ["oPrePay", "oPreMkt", "oPreIT", "oPreOpex", "oPreInt", "oRent", "oHire", "oOne"].reduce((s, k) => s + RA[k][j], 0);
    if (r.idx >= 1) {
      const t = r.idx - 1, y = Math.floor(t / 12);
      ar += MRg.rev[t] - RA.inTot[j]; capex += RA.oCapex[j]; depr += MRg.depr[t];
      if (t % 12 === 0) { yCumPbt = 0; yCumTax = 0; }
      yCumPbt += MRg.ebit[t] - MRg.int[t];
      const due = Math.max(0, yCumPbt + (y === 0 ? adj0 * (t % 12 + 1) / 12 : 0) - pool0[y]) * taxRate;
      const tx = due - yCumTax; yCumTax = due; taxExp += tx; taxPaid += RA.oTax[j];
      cmpVal(tx, r.pl.taxExp, 1e-3, acc, `${r.cal} 월 법인세 비용 = 연내 누적 과세표준 차이`);
      if (t % 12 === 11) cmpVal(GA.taxes[y], yCumTax, 1, acc, `${r.cal} 12월 누적 법인세 비용 = A taxes[${y}](정답)`);
      rePL += MRg.ebit[t] - MRg.int[t] - tx; off += RA.oRent[j] + RA.oHire[j] + RA.oOne[j];
    }
    const exp = { cash: capAt(r.cal) + RA.cum[j], ar, deposit: dep, cip: r.idx < 1 ? build : 0, ppe: r.idx < 1 ? 0 : build + capex - depr, taxPay: taxExp - taxPaid, re: -pre + rePL - off };
    for (const k of Object.keys(exp)) cmpVal(exp[k], r.bs[k], 1, acc, `${r.cal} ${k}`);
  });
  if (L.length) {
    cmpVal("2026-10", L[0].cal, 0, acc, "원장 시작 달(투자 1차 납입 달)");
    cmpVal(6e9, L[0].bs.capital, 0, acc, "2026-10 납입자본 60억");
    const d = L.find((r) => r.cal === "2026-12"), j7 = L.find((r) => r.cal === "2027-07"), j8 = L.find((r) => r.cal === "2027-08"), jan = L.find((r) => r.cal === "2027-01");
    cmpVal(3542982433.78, d.bs.cash, 1, acc, "2026-12 말 현금");
    cmpVal(1415000000, d.bs.cip, 0.001, acc, "2026-12 말 선급 구축비");
    cmpVal(91800000, d.bs.deposit, 0.001, acc, "2026-12 말 임차보증금");
    cmpVal(-950217566.22, d.bs.re, 1, acc, "2026-12 말 결손금 = −준비기간 비용");
    cmpVal(0, d.bs.taxPay + d.bs.ar + d.bs.ppe, 0, acc, "2026-12 말 미지급법인세·매출채권·유형자산 0");
    cmpVal(6e9, j7.bs.capital, 0, acc, "2027-07 납입자본 60억");
    cmpVal(8e9, j8.bs.capital, 0, acc, "2027-08 납입자본 80억");
    // 계획 원장 12월 누적 법인세 비용 = taxes[y](엔진 원장 합, 5년)
    for (let y = 0; y < 5; y++) {
      const sum = L.filter((r) => r.idx >= y * 12 + 1 && r.idx <= y * 12 + 12).reduce((s, r) => s + r.pl.taxExp, 0);
      cmpVal(GA.taxes[y], sum, 1, acc, `계획 원장 ${2027 + y} 법인세 비용 합(12월 누적) = taxes[${y}]`);
    }
    void jan;
  }
  const SA = M.asOf;
  if (SA) {
    cmpVal(0, SA.ytd.plan.taxExp, 0, acc, "계획 YTD(9/17) 법인세 비용 = 0(세전이익 ≤ 이월결손금)");
    cmpVal(0, SA.ytd.actual.taxExp, 0, acc, "실적 YTD(9/17) 법인세 비용 = 0");
    cmpVal(0, SA.bs.plan.taxPay, 1e-6, acc, "계획 9/17 미지급법인세 = 0");
  }
  finish("계획 원장 독립 대조 — 납입 시점(2026-10 60억 · 2027-08 20억) · 2026-12 말 잔액 · 월 법인세 비용(연내 누적 과세표준 · 12월 누적 = taxes[y] · 9/17 계획·실적 YTD 0) · 매출채권·보증금·유형자산·미지급법인세·결손금 = 정답에서 굴린 값 (≤1원)", acc);
}
{
  const acc = newAcc();
  for (let yi = 0; yi < 5; yi++) {
    const bs = tryRun(`finBSYear(${yi})`, () => T.finBSYear(yi)); const cf = tryRun(`finCFYear(${yi})`, () => T.finCFYear(yi));
    if (!bs || !cf) { acc.bad.push(`${yi} 실행 실패`); continue; }
    cmpVal(0, bs.assets - bs.liabilities - bs.equity, 1, acc, `${2027 + yi} 연말 대차`);
    cmpVal(bs.cash, cf.endCash, 1, acc, `${2027 + yi} C/F 기말현금 = B/S 현금`);
    cmpVal(cf.begCash + cf.opCF + cf.invCF + cf.finCF, cf.endCash, 1, acc, `${2027 + yi} 기초 + 영업·투자·재무 = 기말`);
  }
  finish("계획 연말 B/S(2027~2031) 대차 · C/F 기말현금 = B/S 현금", acc);
}
{
  const S = M.asOf; const acc = newAcc();
  if (!S) acc.bad.push("asOf 없음");
  else {
    cmpVal("2027-09-17", S.date, 0, acc, "date");
    cmpVal(203940, S.planMembers, 1, acc, "planMembers");
    cmpVal(100000, S.actualMembers, 0, acc, "actualMembers");
    cmpVal(100000 / S.planMembers, S.k, 1e-12, acc, "k");
    const k = S.k, p = S.ytd.plan, a = S.ytd.actual;
    for (const key of ["rev", "revP", "revChk", "revResv", "revCare", "revSub", "revIns", "cogs", "reward", "donation", "mediRep", "salesCost", "adminCost"]) cmpVal(p[key] * k, a[key], 1, acc, `YTD ${key} = 계획×k`);
    for (const key of ["pay", "media", "depr", "itMaint", "itData", "itSec", "cloudBase", "mk1", "creative", "kit"]) cmpVal(p[key], a[key], 1e-6, acc, `YTD ${key} = 계획(고정비)`);
    cmpVal(p.cloudVar * k + 0, a.cloudVar, 1, acc, "YTD cloudVar = 계획×k");
    cmpVal(p.sticker * k, a.sticker, 1, acc, "YTD sticker = 계획×k");
    // 실적 원장 대차
    (S.monthly.actual || []).forEach((r) => cmpVal(0, r.bs.diff, 1, acc, `실적 ${r.cal} 대차`));
    (S.monthly.plan || []).forEach((r) => cmpVal(0, r.bs.diff, 1, acc, `계획 ${r.cal} 대차`));
    if (!S.monthly.actual || S.monthly.actual.length !== 12) acc.bad.push(`실적 월 수 ${S.monthly.actual && S.monthly.actual.length}(2026-10~2027-09)`);
    cmpVal(0, S.bs.actual.assets - S.bs.actual.liabilities - S.bs.actual.equity, 1, acc, "기준일 실적 B/S 대차");
    cmpVal(0, S.bs.plan.assets - S.bs.plan.liabilities - S.bs.plan.equity, 1, acc, "기준일 계획 B/S 대차");
    cmpVal(S.bs.actual.cash, S.cf.actual.endCash, 1, acc, "실적 C/F 기말현금 = B/S 현금");
    cmpVal(S.bs.plan.cash, S.cf.plan.endCash, 1, acc, "계획 C/F 기말현금 = B/S 현금");
    cmpVal(S.cash.actual.balance, S.bs.actual.cash, 1e-6, acc, "cash.actual = bs 현금");
    cmpVal(8000000000, S.bs.actual.capital, 0, acc, "기준일 납입자본 80억");
    if (S.kpi.t2Received !== true) acc.bad.push("t2Received");
    // 회원 연동 없는 준비기간은 실적 = 계획
    cmpVal(S.cf.plan.prep.endCash, S.cf.actual.prep.endCash, 1e-6, acc, "준비기간 기말현금 동일");
    ["burn3m", "runwayMonths", "lowPlan"].forEach((kk) => { if (!(kk in S.kpi)) acc.bad.push(`kpi.${kk} 없음`); });
  }
  finish("기준일 실적 층 — planMembers≈203,940 · k · YTD 회원 연동 = 계획×k · 고정비 = 계획 · 실적 B/S 대차 · C/F 기말 = B/S 현금", acc,
    S ? `planMembers ${S.planMembers} · k ${S.k.toFixed(6)} · 실적 현금 ${Math.round(S.bs.actual.cash).toLocaleString()} · 계획 현금 ${Math.round(S.bs.plan.cash).toLocaleString()}` : "");
}
/* 설계서 5절 — 실적 월(2027-01~08 전월)을 정답 MR에서 따로 계산한 값과 대조 · 실적 법인세는 누적 과세표준(결손금 공제) 기준 */
{
  const S = M.asOf; const acc = newAcc(); const MRg = G.excel.MR, RA = G.excel.RA, GA = G.runs.A;
  const rows = (S && S.monthly.actual) || []; const k = S ? S.k : NaN; const taxRate = T.fbParams().taxRate;
  const capAt = (cal) => (cal >= "2026-10" ? 6e9 : 0) + (cal >= "2027-08" ? 2e9 : 0);
  let cumPbt = 0, cumTax = 0, cumPaid = 0; const adj0 = -(M.runs.A.shortfall || 0) * (1 - (M.runs.A.varRate || 0));
  rows.forEach((r) => {
    cmpVal(capAt(r.cal), r.bs.capital, 0, acc, `실적 ${r.cal} 납입자본`);
    if (r.idx < 1 || r.partial) return;
    const t = r.idx - 1; const j = r.idx + 23;
    for (const key of ["revP", "revChk", "revResv", "revCare", "revSub", "cogs", "reward", "donation", "mediRep", "sticker", "qrfee", "cloudVar", "llm", "bc", "salesCost", "adminCost"]) cmpVal(MRg[key][t] * k, r.pl[key], 1, acc, `실적 ${r.cal} ${key} = MR × k`);
    for (const key of ["pay", "media", "mk1", "creative", "cardAd", "kit", "itMaint", "itData", "itSec", "cloudBase", "depr"]) cmpVal(MRg[key][t], r.pl[key], 1e-6, acc, `실적 ${r.cal} ${key} = MR(고정)`);
    cmpVal(MRg.endM[t] * k, r.members, 1e-6, acc, `실적 ${r.cal} 월말 회원 = 계획 × k`);
    cmpVal(RA.oTax[j], r.cf.oTax, 1e-6, acc, `실적 ${r.cal} 법인세 납부 = 계획(고정)`);
    cumPbt += r.pl.pbt; cumTax += r.pl.taxExp; cumPaid += RA.oTax[j];
    cmpVal(Math.max(0, cumPbt + adj0 * r.idx / 12 - GA.pre_exp) * taxRate, cumTax, 1e-6, acc, `실적 ${r.cal} 누적 법인세 비용 = max(0, 누적 세전 − 준비기간 결손금) × 세율`);
    cmpVal(cumTax - cumPaid, r.bs.taxPay, 1e-6, acc, `실적 ${r.cal} 미지급법인세`);
  });
  const dec = rows.find((r) => r.cal === "2026-12");
  if (!dec) acc.bad.push("실적 2026-12 행 없음"); else cmpVal(3542982433.78, dec.bs.cash, 1, acc, "실적 2026-12 말 현금 = 계획");
  if (S && S.ytd.actual.pbt < 0) { cmpVal(0, S.ytd.actual.taxExp, 0, acc, "YTD 세전손실이면 실적 법인세 비용 0"); cmpVal(0, S.bs.actual.taxPay, 0, acc, "YTD 세전손실이면 실적 미지급법인세 0"); }
  finish("기준일 실적 원장 독립 대조 — 회원 연동 = MR×k · 고정비 = MR · 납입 시점 · 법인세(결손 공제 누적)", acc, S ? `YTD 세전 ${(S.ytd.actual.pbt / 1e8).toFixed(2)}억 · 법인세 ${(S.ytd.actual.taxExp / 1e8).toFixed(2)}억` : "");
}

/* ══════════ 3) 10개년 외삽 ══════════ */
{
  const acc = newAcc();
  const A10 = M.annual10;
  if (!A10 || A10.length !== 10) acc.bad.push(`annual10 길이 ${A10 && A10.length}`);
  else {
    G.annual.forEach((gr, y) => { const mf = flat(A10[y]); for (const k of Object.keys(gr)) cmpVal(gr[k], mf[k], k.startsWith("eff.") ? 1e-9 : 1, acc, `10개년 ${y + 1}차 ${k}`); });
    const NONNEG = ["me", "new", "active", "activeFull", "insC", "rev", "revP", "revChk", "revResv", "revCare", "revSub", "revIns", "cogs", "gross", "sga", "pay", "headTotal", "mktSum", "itOpex", "capex", "depr", "insts"];
    for (let y = 5; y < 10; y++) {
      const mf = flat(A10[y]);
      for (const [k, v] of Object.entries(mf)) if (!Number.isFinite(v)) acc.bad.push(`${y + 1}차 ${k} = ${v}`);
      NONNEG.forEach((k) => { if (!(A10[y][k] >= 0)) acc.bad.push(`${y + 1}차 ${k} 음수/없음 ${A10[y][k]}`); });
      if (!(A10[y].me > A10[y - 1].me)) acc.bad.push(`${y + 1}차 회원 비증가`);
    }
    const rows = T.finYears(10);
    rows.forEach((r) => ["revenue", "ebit", "net", "tax", "fcf", "membersEnd"].forEach((k) => { if (!Number.isFinite(r[k])) acc.bad.push(`finYears ${r.label} ${k}=${r[k]}`); }));
  }
  finish("10개년 — 1~5차 = 정답 · 6~10차 NaN·음수 없음", acc, A10 ? `2036 회원 ${A10[9].me.toLocaleString()} · 매출 ${(A10[9].rev / 1e8).toFixed(1)}억` : "");
}
/* 설계서 3절 외삽 규칙 — 입력(FB_P0)에서 테스트가 직접 늘린 기대값과 대조 */
{
  const acc = newAcc(); const P0 = T.FB_P0; const Q = M.P10; const A10 = M.annual10 || [];
  const xr = (x) => Math.floor(Number(Number(x).toFixed(7)) + 0.5);
  const g = 0.18, gi = 0.10;
  cmpVal(g, P0.tenYearGrowth, 0, acc, "FB_P0.tenYearGrowth 0.18");
  cmpVal(8260000, Q.membersEnd[5], 0, acc, "2032 회원 = xround(7,000,000 × 1.18)");
  const rA = P0.activeAbs[4] / P0.membersEnd[4], rM = P0.mktConsentEnd[4] / P0.membersEnd[4];
  let me = P0.membersEnd[4]; const inst = { checkupCenters: P0.checkupCenters[4], hospitals: P0.hospitals[4], pharmacies: P0.pharmacies[4] };
  let pen = P0.cost2.pensionY[4], qr = P0.cost2.qrCenters[4];
  for (let y = 5; y < 10; y++) {
    me = xr(me * (1 + g)); pen = Math.min(0.065, pen + 0.0025); qr += 100;
    cmpVal(me, Q.membersEnd[y], 0, acc, `P10.membersEnd[${y}]`);
    cmpVal(me, A10[y] && A10[y].me, 0, acc, `annual10[${y}].me`);
    cmpVal(xr(me * rA), Q.activeAbs[y], 0, acc, `P10.activeAbs[${y}]`);
    cmpVal(xr(me * rM), Q.mktConsentEnd[y], 0, acc, `P10.mktConsentEnd[${y}]`);
    for (const kk of Object.keys(inst)) { inst[kk] = xr(inst[kk] * (1 + gi)); cmpVal(inst[kk], Q[kk][y], 0, acc, `P10.${kk}[${y}]`); }
    cmpVal(pen, Q.cost2.pensionY[y], 1e-12, acc, `P10.cost2.pensionY[${y}]`);
    cmpVal(qr, Q.cost2.qrCenters[y], 0, acc, `P10.cost2.qrCenters[${y}] = +100/년`);
    for (const kk of ["mk1Target", "cardAdMsgs", "capexLater"]) cmpVal(P0.cost2[kk][4], Q.cost2[kk][y], 0, acc, `P10.cost2.${kk}[${y}] 마지막 값 유지`);
    for (const kk of ["resvPerActive", "productRamp"]) cmpVal(P0[kk][4], Q[kk][y], 0, acc, `P10.${kk}[${y}] 마지막 값 유지`);
    for (const kk of Object.keys(P0.matureY || {})) cmpVal(P0.matureY[kk][4], Q.matureY[kk][y], 0, acc, `P10.matureY.${kk}[${y}] 마지막 값 유지`);
  }
  [0.065, 0.065, 0.065].forEach((v, i) => cmpVal(v, Q.cost2.pensionY[7 + i], 1e-12, acc, `pensionY[${7 + i}] 상한 0.065`));
  // 길이 5 배열은 전부 10으로
  const len5 = (o, pre) => Object.keys(o || {}).forEach((kk) => { const v = o[kk]; if (Array.isArray(v) && v.length === 5) { const q = pre.split(".").filter(Boolean).reduce((x, p) => x && x[p], Q); if (!q || !Array.isArray(q[kk]) || q[kk].length !== 10) acc.bad.push(`P10.${pre}${kk} 길이 ${q && q[kk] && q[kk].length}`); } });
  len5(P0, ""); len5(P0.cost2, "cost2."); len5(P0.matureY, "matureY.");
  const rows = T.finYears(10);
  cmpVal(me, rows[9].membersEnd, 0, acc, "finYears(10)[9].membersEnd");
  finish("10개년 외삽 규칙 — 회원 ×1.18·비율 2031 유지·기관 ×1.10·연금 +0.25%p(상한 6.5%)·QR +100·나머지 마지막 값 유지 (입력에서 독립 계산)", acc);
}

/* ══════════ 4) 호환(기존 화면 호출) ══════════ */
{
  const acc = newAcc();
  const P = tryRun("finParams()", () => T.finParams());
  if (P) {
    cmpVal(30000, P.checkupFee, 0, acc, "finParams().checkupFee");
    cmpVal(500000, T.finSubFee(P, 1), 0, acc, "finSubFee(P,1) 병원 2028");
    cmpVal(0, T.finSubFee(P, 0), 0, acc, "finSubFee(P,0) 2027 무료");
    cmpVal(300000, T.finSubFeeT("centers", 1), 0, acc, "finSubFeeT(centers,1)");
    cmpVal(200000, T.finSubFeeT("pharmacies", 1), 0, acc, "finSubFeeT(pharmacies,1)");
    ["cac", "churn", "wacc", "evRevMultiple", "subFeeCap"].forEach((k) => { if (!isNum(P[k])) acc.bad.push(`P.${k}`); });
    if (!Array.isArray(P.years) || P.years.length < 10 || P.years[0].indexOf("2027") < 0) acc.bad.push(`P.years ${P.years && P.years[0]}`);
    if (!P.scnMeta || !P.scnMeta.label) acc.bad.push("P.scnMeta");
  }
  const Y = tryRun("finYears(5)", () => T.finYears(5));
  if (Y) {
    const r0 = Y[0];
    ["revenue", "revProduct", "cogsProduct", "reward", "donation", "membersEnd", "revInsurance", "subFee", "revCheckup", "revService", "revReservation", "revSub", "revCare", "revAd", "revAgent", "revApi",
      "payroll", "marketing", "rnd", "cloud", "gpu", "salesCost", "adminCost", "opMargin", "ebit", "ebitda", "depr", "tax", "net", "fcf", "capex", "arr", "mrrEnd", "insts", "paidInsts", "newMembers", "grossNew", "active", "mktConsent", "gross", "cogs", "sga", "pbt", "netMargin", "cacCost", "brandMkt", "otherOpex", "hospitals", "year"].forEach((k) => { if (!isNum(r0[k])) acc.bad.push(`finYears(5)[0].${k}=${r0[k]}`); });
    if (!r0.subFeeT || !r0.subSplit || !Array.isArray(r0.lin) || !r0.lin.length) acc.bad.push("subFeeT/subSplit/lin");
    cmpVal(G.runs.A.taxes[0], r0.tax, 1, acc, "finYears tax = A taxes");
    cmpVal(G.excel.YR.rev[0], r0.revenue, 1, acc, "revenue");
    cmpVal(G.excel.YR.ebit[0], r0.ebit, 1, acc, "ebit(상각 후)");
    cmpVal(G.excel.YR.ebitModel[0], r0.ebitda, 1, acc, "ebitda(상각 전)");
    cmpVal(G.excel.YR.fcf[0], r0.fcf, 1, acc, "fcf(엑셀 산식)");
    cmpVal("2027년(1차)", r0.label, 0, acc, "label");
    // Finance.jsx 헬퍼 재현(finSimSpec·finSocial·finAnnual의 필드 접근)
    const sh = r0.revProduct / r0.revenue + r0.revCheckup / r0.revenue + r0.revInsurance / r0.revenue;
    if (!isNum(sh)) acc.bad.push("finSimSpec share");
    const margin = r0.revProduct - r0.cogsProduct; if (!isNum(Math.round(margin - r0.reward - r0.donation))) acc.bad.push("finSocial");
  }
  const calls = {
    finBSYear: () => { const b = T.finBSYear(0); ["assets", "cash", "receivable", "curAssets", "nonCurAssets", "curLiab", "liabilities", "equity", "retained", "capital", "debtRatio", "currentRatio", "equityRatio", "roe", "contractLiab", "taxPay", "ppe"].forEach((k) => { if (!isNum(b[k])) acc.bad.push(`finBSYear.${k}`); }); if (!b.r) acc.bad.push("finBSYear.r"); return b; },
    finCFYear: () => { const c = T.finCFYear(1); ["opCF", "invCF", "finCF", "net", "dep", "endCash", "begCash"].forEach((k) => { if (!isNum(c[k])) acc.bad.push(`finCFYear.${k}`); }); return c; },
    finKPIs: () => { const K = T.finKPIs(); ["cac", "ltv", "ltvCac", "arpu", "arppu", "grossMargin", "opMargin", "ebitda3", "burn1", "rule40", "ev", "evRev", "roi5"].forEach((k) => { if (!isNum(K[k])) acc.bad.push(`finKPIs.${k}=${K[k]}`); }); if (!(isNum(K.runway) || K.runway === Infinity)) acc.bad.push("finKPIs.runway"); return K; },
    finValModel: () => { const V = T.finValModel(); ["evDCF", "evRev", "evEbitda", "pvSum", "terminal", "pvTerminal", "lastRevenue", "lastEbitda", "lastFcf"].forEach((k) => { if (!isNum(V[k])) acc.bad.push(`finValModel.${k}`); }); if (!Array.isArray(V.disc) || V.disc.length !== 5) acc.bad.push("disc"); return V; },
    finSaaSModel: () => { const S = T.finSaaSModel(); if (S.length !== 5) acc.bad.push("saas len"); S.forEach((s) => ["insts", "subFee", "mrr", "arr", "expansion", "renewal"].forEach((k) => { if (!isNum(s[k])) acc.bad.push(`saas.${k}`); })); return S; },
    finMonthlyY1: () => { const mp = T.finMonthlyY1(); if (mp.rows.length !== 12 || mp.q.length !== 4) acc.bad.push("monthly len"); mp.rows.forEach((r) => ["m", "add", "cum", "cacCost", "rev", "op"].forEach((k) => { if (!isNum(r[k])) acc.bad.push(`monthly.${k}`); })); if (!isNum(mp.total) || !isNum(mp.cacTotal)) acc.bad.push("monthly total"); return mp; },
  };
  for (const [nm, fn] of Object.entries(calls)) tryRun(nm, fn) || acc.bad.push(`${nm} 실패`);
  if (!Array.isArray(T.FIN_GRAPH) || !T.FIN_GRAPH.length || !T.FIN_SCENARIOS.base) acc.bad.push("FIN_GRAPH/FIN_SCENARIOS");
  if (typeof ctx.window.__hifinFin !== "function" || !ctx.window.__hifinFinModel || !Array.isArray(ctx.window.__hifinFinModel.years(5))) acc.bad.push("window 훅");
  finish("호환 — finParams·finSubFee·finYears 필드·finBSYear/finCFYear/finKPIs/finValModel/finSaaSModel/finMonthlyY1·window 훅", acc);
}

/* ══════════ 5) finAsk — 설계서 9절 의도 라우팅·연도·동적 문구 ══════════ */
{
  const acc = newAcc(); const samples = [];
  const Mx = T.fbModel(); const A10 = Mx.annual10; const S0 = Mx.asOf;
  const w = (n) => { n = Math.round(n); const s = n < 0 ? "-" : ""; n = Math.abs(n); if (n >= 1e12) return s + (n / 1e12).toFixed(2) + "조"; if (n >= 1e8) return s + (n / 1e8).toFixed(1).replace(/\.0$/, "") + "억"; if (n >= 1e4) return s + Math.round(n / 1e4).toLocaleString() + "만"; return s + n.toLocaleString(); };
  const lit = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // [질의, 기대 의도(null = 답 없음), 포함 패턴, 금지 패턴]
  const Q = [
    ["2027년 매출", "revenue", [/2027년/, lit(w(A10[0].rev)), /개시 시점\(검진·예약·사용료 4월, 커머스·돌봄 7월\)/, /2028년부터 과금/]],
    ["올해 매출", "revenue", [/2027년/, lit(w(A10[0].rev))]],
    ["내년 매출", "revenue", [/2028년/, lit(w(A10[1].rev))]],
    ["3차 매출", "revenue", [/2029년/, lit(w(A10[2].rev))]],
    ["5차연도 매출은?", "revenue", [/2031년/, lit(w(A10[4].rev))]],
    ["2036년 매출", "revenue", [/2036년/, lit(w(A10[9].rev)), /2032~2036년 외삽\(회원 연 18%·기관 연 10%/]],
    ["2027년 revenue", "revenue", [/2027년/, /매출/], [/기업가치|EV/]],
    ["2026년 매출", "range", [/2027~2036년/, /범위 밖/], [/134\.8억/]],
    ["2040년 영업이익", "range", [/범위 밖/]],
    ["2030년 영업이익", "profit", [/2030년/, /영업이익/, lit(w(A10[3].ebit))]],
    ["10차 영업이익", "profit", [/2036년/, /외삽/]],
    ["흑자전환", "profit", [/영업이익/]],
    ["매출원가", "cost", [/매출원가/, lit(w(A10[0].cogs))]],
    ["마케팅비 얼마", "cost", [/마케팅/, lit(w(A10[0].mktSum))]],
    ["2028년 인건비", "cost", [/2028년/, /인건비/, lit(w(A10[1].pay))]],
    ["투자금 얼마야", "invest", [/80억/, /1차 60억원\(2026-10/, /2차 20억원\(2027-08/]],
    ["2차 트랜치 언제", "invest", [/2차/]],
    ["런웨이는?", "cash", [/런웨이/, /(개월|흑자)/], [/소진은 소진 없음/]],
    ["현금 잔액", "cash", [/2027-09-17/, lit(w(S0.bs.actual.cash))]],
    ["현재 실적은?", "actual", [/2027-09-17/, /실적/, /달성/]],
    ["헬스메이트센터 매출 실적", "actual", [/실적/]],
    ["현재 회원", "members", [/100,000명/, /203,940명/]],
    ["인피니티케어 몇 명", "members", [/인피니티케어 연계 150,000명/]],
    ["메디에이지 리포트 비용", "members", [/메디에이지/, lit(w(A10[0].mediRep))]],
    ["헬스메이트센터 사용료", "hm", [/헬스메이트센터/, /10만 건/, /시가 10만원/, /2027년/]],
    ["2028년 헬스메이트센터 사용료", "hm", [/2028년/, lit(w(A10[1].revIns))]],
    ["2032년 헬스메이트센터 사용료", "hm", [/2032년/, lit(w(A10[5].revIns)), /외삽/], [/2027년 DB 공급/]],
    ["DB 공급 단가", "hm", [/우대 단가/]],
    ["구독료 정책은?", "sub", [/구독/, /2028년부터 과금/, /(검진센터|병원|약국)/]],
    ["플랫폼 사용료", "sub", [/AI 플랫폼 구독료/], [/헬스메이트/]],
    ["기관 사용료", "sub", [/AI 플랫폼 구독료/], [/헬스메이트/]],
    ["EMR 사용료", "sub", [/AI 플랫폼 구독료/], [/헬스메이트/]],
    ["사용료 정책", "sub", [/AI 플랫폼 구독료/]],
    ["재가돌봄 2030년", "care", [/2030년/, lit(w(A10[3].revCare))]],
    ["LTV/CAC", "ltv", [/LTV/, /CAC/]],
    ["획득비용얼마", "ltv", [/CAC/]],
    ["기업가치", "ev", [/(기업가치|EV)/, /DCF/]],
    ["밸류에이션", "ev", [/DCF/]],
    ["얼마", null, []],
  ];
  const ask = (q) => { try { return T.finAsk(q); } catch (e) { acc.bad.push(`${q}: 예외 ${e}`); return undefined; } };
  const check = (q, intent, pats, bans) => {
    const res = ask(q); if (res === undefined) return;
    if (intent === null) { if (res !== null) acc.bad.push(`${q}: 답 없음(null) 기대 · 의도 ${res && res.intent}`); return; }
    const text = res && Array.isArray(res.lines) ? res.lines.join(" ") : "";
    if (!text) { acc.bad.push(`${q}: 빈 답`); return; }
    if (res.intent !== intent) acc.bad.push(`${q}: 의도 ${res.intent} (기대 ${intent}) — ${text.slice(0, 60)}`);
    pats.forEach((p) => { if (!p.test(text)) acc.bad.push(`${q}: ${p} 없음 — ${text.slice(0, 120)}`); });
    (bans || []).forEach((p) => { if (p.test(text)) acc.bad.push(`${q}: 금지 ${p} — ${text.slice(0, 120)}`); });
    if (/보험\s*중개/.test(text)) acc.bad.push(`${q}: 보험 중개 표현`);
    if (/NaN|undefined|Infinity|null/.test(text)) acc.bad.push(`${q}: NaN/undefined`);
    samples.push(`${q} → [${res.intent}] ${text.slice(0, 90)}`);
  };
  for (const [q, intent, pats, bans] of Q) check(q, intent, pats, bans);
  // 동적 문구 — 오버라이드가 바뀌면 정책 문구도 따라 바뀐다(고정 숫자 금지)
  T.finResetParams();
  T.finSetParam("tenYearGrowth", 0.30);
  check("2034년 영업이익", "profit", [/회원 연 30%/], [/회원 연 18%/]);
  T.finResetParams();
  T.finSetParam("subStart", 3);
  check("구독료", "sub", [/2027~2028년은 전 기관 무료, 2029년부터 과금/], [/2028년부터 과금/]);
  check("2027년 매출", "revenue", [/2029년부터 과금/], [/2028년부터 과금/]);
  if (!T.finYears(1)[0].lin.some((l) => /2027년 무료\(2029년 과금\)/.test(l.formula))) acc.bad.push("lin 구독 문구가 subStart를 따르지 않음");
  T.finResetParams();
  finish(`finAsk ${Q.length + 3}개 질의 — 의도 라우팅·연도(범위 밖 안내)·엔진 수치·동적 문구·보험 중개 표현 없음`, acc);
  samples.forEach((s) => console.log("      " + s));
}

/* ══════════ 6-1) 시나리오 배율 — 설계서 4절(보수·공격) 입력에서 독립 계산 ══════════ */
{
  const acc = newAcc(); const P0 = T.FB_P0; const xr = (x) => Math.floor(Number(Number(x).toFixed(7)) + 0.5);
  T.finResetParams(); const base = T.fbModel();
  for (const sk of ["cons", "aggr"]) {
    const sc = T.FB_SCENARIOS[sk];
    T.finSetScenario(sk); const P = T.fbParams(); const m = T.fbModel();
    for (const kk of ["membersEnd", "activeAbs", "mktConsentEnd"]) P0[kk].forEach((v, i) => cmpVal(xr(v * sc.memberMult), P[kk][i], 0, acc, `${sk} ${kk}[${i}]`));
    for (const kk of ["checkupCenters", "hospitals", "pharmacies"]) P0[kk].forEach((v, i) => cmpVal(xr(v * sc.instMult), P[kk][i], 0, acc, `${sk} ${kk}[${i}]`));
    cmpVal(Math.min(1, P0.productBuyerRate * sc.rateMult), P.productBuyerRate, 1e-12, acc, `${sk} productBuyerRate`);
    cmpVal(Math.min(1, P0.insConvRate * sc.rateMult), P.insConvRate, 1e-12, acc, `${sk} insConvRate`);
    Object.keys(P0.cost2.chCpm).forEach((c) => cmpVal(P0.cost2.chCpm[c] * sc.cacMult, P.cost2.chCpm[c], 1e-9, acc, `${sk} chCpm.${c}`));
    cmpVal(P0.cost2.naverCpc * sc.cacMult, P.cost2.naverCpc, 1e-9, acc, `${sk} naverCpc`);
    m.annual.forEach((a, y) => {
      cmpVal(P.membersEnd[y], a.me, 0, acc, `${sk} annual[${y}].me`);
      cmpVal(Math.floor(P.checkupCenters[y] * P.subPaidRate + 0.5), a.paid.centers, 0, acc, `${sk} annual[${y}].paid.centers`);
      if (base.annual[y].media) cmpVal(sc.cacMult, a.media / base.annual[y].media, 1e-6, acc, `${sk} annual[${y}].media ÷ 기준 = cacMult`);
    });
    if (T.finParams().scnMeta.label !== sc.label) acc.bad.push(`${sk} scnMeta`);
  }
  T.finResetParams();
  cmpVal(G.annual[0].me, T.fbModel().annual[0].me, 0, acc, "초기화 후 기준");
  finish("시나리오 배율 — 회원·기관·전환율(상한 1)·매체 단가 × 배율, 연간 회원·유료 기관·매체비 반영", acc);
}

/* ══════════ 6) 시나리오·오버라이드 저장 → 반영 → 초기화 ══════════ */
{
  const acc = newAcc();
  const base = T.fbModel();
  store["hifin_fin_params"] = JSON.stringify({ members2: 5, subFeeBase: 1 });     // 옛 키는 읽지 않는다
  cmpVal(G.annual[1].me, T.fbModel().annual[1].me, 0, acc, "옛 키 hifin_fin_params 무시");
  T.finSetParam("members2", 1000000);
  T.finSetParam("chkOwnFee", 35000);
  T.finSetParam("actualMembers", 120000);
  const saved = JSON.parse(store["hifin_fin_params_v38"] || "{}");
  cmpVal(1000000, saved.members2, 0, acc, "저장 키 hifin_fin_params_v38.members2");
  const m2 = T.fbModel();
  cmpVal(1000000, m2.annual[1].me, 0, acc, "members2 반영");
  cmpVal(35000, T.finParams().checkupFee, 0, acc, "chkOwnFee → checkupFee 반영");
  cmpVal(120000, m2.asOf.actualMembers, 0, acc, "actualMembers 반영");
  if (!(m2.annual[1].rev !== base.annual[1].rev)) acc.bad.push("members2 변경이 매출에 반영 안 됨");
  T.finSetScenario("cons");
  const m3 = T.fbModel();
  if (!(m3.annual[0].me < 1000000 && m3.annual[0].me !== G.annual[0].me)) acc.bad.push(`시나리오 보수 반영 안 됨 ${m3.annual[0].me}`);
  if (T.finParams().scnMeta.label !== "보수적") acc.bad.push("scnMeta");
  T.finResetParams();
  delete store["hifin_fin_params"];
  const m4 = T.fbModel();
  if (store["hifin_fin_params_v38"] || store["hifin_fin_scn"]) acc.bad.push("초기화 후 저장 키 남음");
  G.annual.forEach((gr, y) => { const mf = flat(m4.annual[y]); for (const k of Object.keys(gr)) cmpVal(gr[k], mf[k], k.startsWith("eff.") ? 1e-9 : 1, acc, `초기화 후 ${y + 1}차 ${k}`); });
  cmpVal(G.runs.B.req, m4.runs.B.req, 0, acc, "초기화 후 B 요청액");
  cmpVal(100000, m4.asOf.actualMembers, 0, acc, "초기화 후 actualMembers");
  finish("시나리오·오버라이드 — 기본 = 정답 · 저장(hifin_fin_params_v38) → 반영 → 초기화", acc);
}

/* ══════════ 선수납·정산(escrowPay.js) — 채널별 수수료 · 기준일 시드 · 저장 키 v38 · 회원 화면 원가 비노출 ══════════ */
{
  const acc = newAcc();
  try {
    vm.runInContext(readFileSync(path.join(ROOT, "src/data/escrowPay.js"), "utf8") + `
;globalThis.__E = { escFee, escAll, escStats, escSeedDemo, escMemberView, escPay, ESC_CHANNELS };`, ctx, { filename: "escrowPay.js" });
    const E = ctx.__E; const P = T.fbParams();
    store["hifin_escrow_orders"] = JSON.stringify([{ id: "OLD", amount: 1, fee: 25000, status: "SETTLED", at: 0 }]);   // 옛 키는 읽지 않는다
    cmpVal(P.chkOwnFee, E.escFee("own"), 0, acc, "자사 운영 수수료 = chkOwnFee");
    cmpVal(P.chkPtnFee, E.escFee("partner"), 0, acc, "제휴사 수수료 = chkPtnFee");
    cmpVal(P.chkOwnFee, E.escFee(), 0, acc, "채널 생략 = 자사 운영");
    if (E.escSeedDemo() !== true) acc.bad.push("시드 생성 안 됨(옛 키를 읽었을 수 있음)");
    const l = E.escAll();
    if (l.some((o) => o.id === "OLD")) acc.bad.push("옛 키 hifin_escrow_orders를 읽음");
    if (!store["hifin_escrow_orders_v38"]) acc.bad.push("저장 키 hifin_escrow_orders_v38 없음");
    const base = new Date(2027, 8, 17).getTime();
    l.forEach((o) => {
      if (!E.ESC_CHANNELS[o.channel]) acc.bad.push(`${o.id} channel=${o.channel}`);
      cmpVal(E.escFee(o.channel), o.fee, 0, acc, `${o.id} 수수료 = 채널(${o.channel}) 단가`);
      cmpVal(o.amount - o.fee, o.payout, 0, acc, `${o.id} 지급액 = 결제 − 수수료`);
      const days = (base - new Date(new Date(o.at).getFullYear(), new Date(o.at).getMonth(), new Date(o.at).getDate()).getTime()) / 86400000;
      if (!(days >= 1 && days <= 12)) acc.bad.push(`${o.id} 시드 날짜 ${new Date(o.at).toISOString()} — 기준일 1~12일 전 아님`);
      const mv = E.escMemberView(o);
      if ("fee" in mv || "payout" in mv) acc.bad.push(`${o.id} 회원 화면에 수수료·지급액 노출`);
    });
    if (!l.some((o) => o.channel === "own") || !l.some((o) => o.channel === "partner")) acc.bad.push("시드에 두 채널이 모두 있어야 함");
    const st = E.escStats();
    ["n", "paid", "visited", "settled", "refunded", "escrowBalance", "feeRevenue", "payoutTotal", "gmv"].forEach((k) => { if (!isNum(st[k])) acc.bad.push(`escStats.${k}`); });
    cmpVal(st.feeRevenue, st.byChannel.own.feeRevenue + st.byChannel.partner.feeRevenue, 0, acc, "채널별 수수료 합 = 정산 수수료");
    delete store["hifin_escrow_orders"]; delete store["hifin_escrow_orders_v38"];
  } catch (e) { acc.bad.push("실행 실패 " + e.message); }
  finish("선수납·정산 — 채널별 수수료(자사 chkOwnFee · 제휴사 chkPtnFee) · 시드 = 기준일 1~12일 전 · 키 hifin_escrow_orders_v38(옛 키 무시) · 회원 뷰 수수료 비노출", acc);
}

/* ══════════ 판매마진 배분 — 회원 화면 WALLET_SPLIT = 예산양식 rewardRate·donationRate(형 확정 2026-09-17 · 60/15/25) ══════════ */
{
  const acc = newAcc();
  try {
    const sd = readFileSync(path.join(ROOT, "src/data/sectionData.js"), "utf8");
    const mm = sd.match(/const\s+WALLET_SPLIT\s*=\s*\{\s*earn:\s*([\d.]+)\s*,\s*give:\s*([\d.]+)\s*,\s*ops:\s*([\d.]+)\s*\}/);
    if (!mm) acc.bad.push("sectionData.js에서 WALLET_SPLIT = { earn, give, ops } 를 못 읽음");
    else {
      const [earn, give, ops] = mm.slice(1, 4).map(Number); const P0 = T.FB_P0;
      cmpVal(P0.rewardRate * 100, earn, 1e-9, acc, "WALLET_SPLIT.earn = FB_P0.rewardRate×100");
      cmpVal(P0.donationRate * 100, give, 1e-9, acc, "WALLET_SPLIT.give = FB_P0.donationRate×100");
      cmpVal(100, earn + give + ops, 1e-9, acc, "earn + give + ops = 100");
      // 나눔 원장 비율(insService SHARE_RATE)은 WALLET_SPLIT.give에서 파생하거나 같은 값이어야 한다
      const is = readFileSync(path.join(ROOT, "src/data/insService.js"), "utf8").match(/SHARE_RATE:\s*([^\n]*)/);
      if (!is) acc.bad.push("insService.js SHARE_RATE 없음");
      else if (!/WALLET_SPLIT\.give/.test(is[1])) { const n = parseFloat(is[1]); cmpVal(give / 100, n, 1e-9, acc, "INS_CONFIG.SHARE_RATE = WALLET_SPLIT.give÷100"); }
    }
  } catch (e) { acc.bad.push("실행 실패 " + e.message); }
  finish("판매마진 배분 — sectionData.js WALLET_SPLIT(적립·나눔) = FB_P0.rewardRate·donationRate × 100 · 합계 100 · 나눔 원장 SHARE_RATE 단일 정의", acc);
}

/* ══════════ 판매마진 배분 사본 스캔 — WALLET_SPLIT만 바꾸고 화면·하이 답변·백서·폴백 상수가 옛 숫자로 남는 것을 막는다 ══════════
   src 전체(.js·.jsx)에서 배분 비율이 **판매마진 배분 문맥**으로 적힌 곳만 읽어 WALLET_SPLIT과 대조한다.
   제외: wpAutoLog.js(백서반영표 과거 기록) · 「치료비 케어·보험료 전용 적립 30%」(토큰 중 우선 적립분 — 다른 개념)
         · 데이터 배당 분배율(50/30/20, 「분배율·배당」 문맥) · 투자 목표 비중 · 「판매마진 N%×M%」(특별지원 산식). */
{
  const acc = newAcc();
  try {
    const sd = readFileSync(path.join(ROOT, "src/data/sectionData.js"), "utf8");
    const mm = sd.match(/const\s+WALLET_SPLIT\s*=\s*\{\s*earn:\s*([\d.]+)\s*,\s*give:\s*([\d.]+)\s*,\s*ops:\s*([\d.]+)\s*\}/);
    const sp = readFileSync(path.join(ROOT, "src/data/shopProducts.js"), "utf8").match(/SHOP_REWARD_CFG\s*=\s*\{\s*supplyRate:\s*([\d.]+)/);
    if (!mm || !sp) acc.bad.push("WALLET_SPLIT 또는 SHOP_REWARD_CFG.supplyRate를 못 읽음");
    else {
      const [earn, give, ops] = mm.slice(1, 4).map(Number);
      const pricePct = Math.round((1 - Number(sp[1])) * earn * 1e6) / 1e6;   // 판매가 대비 적립률 % = (1 − 공급가율) × 적립 몫
      const files = [];
      const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(js|jsx)$/.test(e.name) && e.name !== "wpAutoLog.js") files.push(f); } };
      walk(path.join(ROOT, "src"));
      let hits = 0;
      const want = (label, got, exp, where) => { hits++; if (Math.abs(Number(got) - exp) > 1e-9) acc.bad.push(`${where} ${label} ${got} ≠ ${exp}`); };
      for (const f of files) {
        const rel = path.relative(ROOT, f).replace(/\\/g, "/");
        readFileSync(f, "utf8").split("\n").forEach((ln, i) => {
          const at = `${rel}:${i + 1}`;
          let m;
          // ① 폴백 객체 { earn: N, give: N[, ops: N] }
          for (m of ln.matchAll(/\{\s*earn:\s*([\d.]+)\s*,\s*give:\s*([\d.]+)(?:\s*,\s*ops:\s*([\d.]+))?/g)) {
            want("earn", m[1], earn, at); want("give", m[2], give, at); if (m[3] != null) want("ops", m[3], ops, at);
          }
          // ② WALLET_SPLIT.earn/give 폴백 상수 (… ? WALLET_SPLIT.earn / 100 : 0.60 · … ? WALLET_SPLIT.give : 15)
          for (m of ln.matchAll(/WALLET_SPLIT\.(earn|give)\s*(\/\s*100\s*)?:\s*([\d.]+)/g)) {
            want(`WALLET_SPLIT.${m[1]} 폴백`, m[2] ? Math.round(Number(m[3]) * 100 * 1e6) / 1e6 : m[3], m[1] === "earn" ? earn : give, at);
          }
          // ③ healthReward 폴백 산식 reward: Math.floor(p * 0.xx) = (1 − supplyRate) × earn
          if (ln.includes("healthReward")) for (m of ln.matchAll(/reward\s*:\s*Math\.floor\([^()]*\*\s*([\d.]+)\)/g)) want("적립 폴백(판매가 대비)", Math.round(Number(m[1]) * 100 * 1e6) / 1e6, pricePct, at);
          // ④ 쇼핑 적립 표기 — 「판매가의 N%」(적립 문맥) · 「적립 {…reward)} · N%」「<small>N%</small>」
          if (/적립/.test(ln)) for (m of ln.matchAll(/판매가(?:의)?\s*(?:약\s*)?(\d+)\s*%/g)) want("판매가 대비 적립", m[1], pricePct, at);
          for (m of ln.matchAll(/적립 \{[^}]*reward\)\}\s*(?:·\s*|<small>)(\d+)%/g)) want("상품 카드 적립률", m[1], pricePct, at);
          // ⑤ 「(판매|매출)마진(의|을) N%」 뒤 40자에서 나눔·기부가 먼저면 나눔 몫, 적립·HTK가 먼저면 적립 몫
          for (m of ln.matchAll(/(?:판매|매출)?마진(?:을|의)?\s*(?:\*\*)?\s*(\d+)\s*%/g)) {
            const tail = ln.slice(m.index + m[0].length, m.index + m[0].length + 40), head = ln.slice(Math.max(0, m.index - 6), m.index);
            if (/^\s*[×x*]/.test(tail)) continue;
            const gi = tail.search(/나눔|기부/), ei = tail.search(/적립|HTK|Health Token/);
            if (/(?:나눔|기부)\s*\($/.test(head) || (gi >= 0 && (ei < 0 || gi < ei))) want("판매마진 나눔 몫", m[1], give, at);
            else if (ei >= 0) want("판매마진 적립 몫", m[1], earn, at);
          }
          // ⑥ 「적립 N% · 나눔 N%」 짝 표기(「전용·우선 적립」 제외) · 「N% 회원적립 · N% 치료비 나눔 · N% 운영」
          for (m of ln.matchAll(/적립\s*\(?\s*(\d+)\s*%\s*\)?\s*[·,]\s*(?:치료비\s*)?나눔\s*\(?\s*(\d+)\s*%/g)) {
            if (/(?:전용|우선)\s*$/.test(ln.slice(Math.max(0, m.index - 4), m.index))) continue;
            want("적립 몫", m[1], earn, at); want("나눔 몫", m[2], give, at);
          }
          for (m of ln.matchAll(/(\d+)\s*%\s*회원\s*적립\s*·\s*(\d+)\s*%\s*치료비\s*나눔\s*·\s*(\d+)\s*%\s*운영/g)) { want("적립 몫", m[1], earn, at); want("나눔 몫", m[2], give, at); want("운영 몫", m[3], ops, at); }
          // ⑦ 「N/N/N」 삼분 표기 — 적립·나눔·가치환원 문맥만(분배율·배당·비중 문맥 제외)
          for (m of ln.matchAll(/(?<![\d/])(\d{2})\/(\d{2})\/(\d{2})(?![\d/])/g)) {
            const ctx = ln.slice(Math.max(0, m.index - 24), m.index + m[0].length + 24);
            if (!/적립|나눔|가치환원|가치순환|WALLET_SPLIT/.test(ctx) || /분배율|배당|비중/.test(ctx)) continue;
            hits++; if (m[0] !== `${earn}/${give}/${ops}`) acc.bad.push(`${at} 적립/나눔/운영 ${m[0]} ≠ ${earn}/${give}/${ops}`);
          }
        });
      }
      if (hits < 20) acc.bad.push(`스캔 적중 ${hits}건 — 패턴이 사본을 거의 못 잡음(정규식·문구 형식 변경 확인)`);
      acc.max = hits;
    }
  } catch (e) { acc.bad.push("실행 실패 " + e.message); }
  const ok = acc.bad.length === 0;
  report("판매마진 배분 사본 스캔 — src 화면·하이 답변·백서·폴백 상수(earn·give 폴백 · healthReward 폴백 · 판매가 대비 적립 표기)가 WALLET_SPLIT과 일치", ok, null, ok ? `대조 ${acc.max}곳` : `${acc.bad.length}건 불일치 — ${acc.bad.slice(0, 6).join(" | ")}`);
}

const fail = results.filter((r) => !r.ok);
console.log(`\n합계 ${results.length}항목 · 통과 ${results.length - fail.length} · 실패 ${fail.length}`);
process.exit(fail.length ? 1 : 0);
