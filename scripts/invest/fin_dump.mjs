/* finModel.js 기본 시나리오를 JSON으로 덤프 — 사용: node scripts/invest/fin_dump.mjs <저장소 루트> <출력 json> */
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const REPO = process.argv[2];
const ctx = vm.createContext({ console, Math, JSON, Number, String, Array, Object, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
vm.runInContext(readFileSync(REPO + "/src/data/finModel.js", "utf8") + "\n;globalThis.__f={finYears,finParams,finMonthlyY1,finCFYear,finKPIs,finValModel};", ctx);
const F = ctx.__f; const P = F.finParams(); const Y = F.finYears(5); const M = F.finMonthlyY1();
const pick = (r) => { const o = {}; for (const k of Object.keys(r)) if (k !== "lin") o[k] = r[k]; return o; };
writeFileSync(process.argv[3], JSON.stringify({ P, years: Y.map(pick), lin: Y.map(r => r.lin), m1: M, cf: [0,1,2,3,4].map(F.finCFYear), kpi: F.finKPIs() }, null, 1));
const w = (n) => (Math.round(n / 1e6)).toLocaleString().padStart(9);
const keys = [["membersEnd","연말 회원"],["newMembers","순증"],["active","검진예약(활성)"],["mktConsent","마케팅동의"],
 ["revProduct","제품판매"],["revCheckup","검진연계"],["revService","헬스케어서비스"],["revReservation","예약"],["revSub","EMR·UIP구독"],["revInsurance","보험중개"],["revAd","광고"],["revAgent","AI Agent"],["revApi","API·B2B"],["revenue","매출합계"],
 ["cogsProduct","제품원가"],["cogs","매출원가계"],["gross","매출총이익"],["cacCost","CAC"],["brandMkt","브랜드마케팅"],["reward","적립"],["donation","기부"],["payroll","인건비"],["rnd","R&D"],["cloud","클라우드"],["gpu","GPU"],["salesCost","영업"],["adminCost","관리"],["sga","판관비계"],["ebit","영업이익"],["net","당기순이익"],["capex","CAPEX"],["fcf","FCF"]];
console.log("항목(백만원)          " + Y.map(r => r.label.padStart(9)).join(""));
for (const [k, ko] of keys) {
  const cnt = ["membersEnd","newMembers","active","mktConsent"].includes(k);
  console.log(ko.padEnd(18) + Y.map(r => cnt ? r[k].toLocaleString().padStart(9) : w(r[k])).join(""));
}
