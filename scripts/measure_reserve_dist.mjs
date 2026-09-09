/* 재원(적립금) 분포 실측 — 장기보험 월 5만원 x 3개월 = 150,000원 임계값 기준
 *
 * 방법: insuranceCohort.js의 cohortInsurance(i)를 **그대로 실행**해 htkBase를 얻는다.
 *   이전 판은 _icRng/_icLogn만 꺼내 새 난수 스트림의 첫 draw로 htkBase를 뽑았는데,
 *   원본은 같은 rng를 계약보유·실손·라이더 구간에서 회원마다 다른 횟수로 소모한 뒤
 *   :123에서 htkBase를 뽑는다. 산식이 같아도 스트림 위치가 달라 개인값이 갈렸다
 *   (5만 명 대조 시 99.9% 불일치). 분포는 비슷했지만 개인값이 틀리면 도달 개월도 틀린다.
 *   그래서 헬퍼 추출이 아니라 **원본 함수 호출**로 바꿨다.
 *
 * 두 기준을 나눠 잰다 — 어느 잔액에 임계값을 거느냐가 결과를 가른다.
 *   A-1 치료비 케어 전용 = floor(htkBase x HTK_INS_RATE) x 10원
 *   A-2 총 적립금        = htkBase x 10원
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const FILES = ["src/data/pilotCohort.js", "src/data/insuranceCohort.js", "src/data/shopProducts.js"];
const ctx = vm.createContext({ console, Math, JSON, Date, Number, String, Array, Object });
for (const f of FILES) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });

const need = ["cohortInsurance", "pilotCohort", "healthReward"];
const missing = need.filter((n) => typeof ctx[n] !== "function");
if (missing.length) { console.log("원본 함수 없음: " + missing.join(",")); process.exit(1); }

/* 상수는 정의 파일에서 직접 읽는다(하드코딩 금지) */
const sd = readFileSync("src/data/sectionData.js", "utf8");
const INS = Number((sd.match(/HTK_INS_RATE\s*=\s*([\d.]+)/) || [])[1]);
const RATE = Number((sd.match(/WALLET\s*=\s*\{[^}]*\brate:\s*(\d+)/) || [])[1]);
if (!INS || !RATE) { console.log("sectionData.js에서 HTK_INS_RATE/WALLET.rate를 못 읽음"); process.exit(1); }

const N = ctx.pilotCohort().length;
const GOAL_WON = 150000;                       // 월 5만원 x 3개월 (대표 확정 2026-09-09)
const PREMIUM = 50000;

const base = [];
for (let i = 1; i <= N; i++) { const r = ctx.cohortInsurance(i); if (r && r.htkBase) base.push(r.htkBase); }
const a1 = base.map((b) => Math.floor(b * INS) * RATE).sort((x, y) => x - y);   // 치료비 케어 전용(원)
const a2 = base.map((b) => b * RATE).sort((x, y) => x - y);                     // 총 적립(원)
const srt = base.slice().sort((x, y) => x - y);

const q = (a, p) => a[Math.floor(a.length * p)];
const avg = (a) => Math.round(a.reduce((s, x) => s + x, 0) / a.length);
const pct = (a, goal) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] >= goal) hi = m; else lo = m + 1; } return (a.length - lo) / a.length * 100; };
const won = (v) => v.toLocaleString() + "원";

console.log("=".repeat(74));
console.log("재원 분포 실측 - 원본 cohortInsurance(i) 직접 호출 · 표본 " + N.toLocaleString() + "명");
console.log("  1 HTK = " + RATE + "원 (sectionData.js) · 치료비 케어 비율 = " + (INS * 100) + "% (HTK_INS_RATE)");
console.log("=".repeat(74));
console.log("  htkBase 평균 " + avg(srt).toLocaleString() + " HTK · 중앙 " + q(srt, .5).toLocaleString()
  + " · 최대 " + srt[srt.length - 1].toLocaleString() + " HTK");

console.log("");
console.log("[A] 두 기준의 분포 (원)");
console.log("  기준                    평균       p25       p50       p75       p90       최대");
for (const [ko, a] of [["A-1 치료비 케어(" + (INS * 100) + "%)", a1], ["A-2 총 적립금", a2]]) {
  console.log("  " + ko.padEnd(20) + [avg(a), q(a, .25), q(a, .5), q(a, .75), q(a, .9), a[a.length - 1]]
    .map((v) => v.toLocaleString().padStart(9)).join(" "));
}

console.log("");
console.log("[B] 임계값 " + won(GOAL_WON) + " (월 " + won(PREMIUM) + " x 3개월) 즉시 충족률");
console.log("  A-1 치료비 케어 기준   " + pct(a1, GOAL_WON).toFixed(1) + "%");
console.log("  A-2 총 적립 기준       " + pct(a2, GOAL_WON).toFixed(1) + "%");
console.log("  * A-1이 0%인 것은 표본 문제가 아니라 구조적 상한이다 — htkBase 최대 "
  + srt[srt.length - 1].toLocaleString() + " HTK의 " + (INS * 100) + "%는 "
  + won(Math.floor(srt[srt.length - 1] * INS) * RATE) + "로 임계값보다 낮다.");

const r5 = ctx.healthReward(PREMIUM);
console.log("");
console.log("[C] 건강쇼핑 적립 (shopProducts.js healthReward)");
console.log("  월 " + won(PREMIUM) + " 구매 -> 적립 " + won(r5.reward) + " = " + Math.floor(r5.reward / RATE)
  + " HTK (판매가의 " + (r5.rate * 100).toFixed(0) + "%)");
console.log("  치료비 케어로 가는 몫은 그중 " + (INS * 100) + "% = " + won(Math.floor(r5.reward * INS))
  + " (실효 적립률 " + (r5.rate * INS * 100).toFixed(1) + "%)");

console.log("");
console.log("[D] 꾸준히 구매할 때 " + won(GOAL_WON) + " 도달 개월");
console.log("  구매액     월 적립     기준      p25    중앙     p75     p90   신규(잔액0)");
for (const buy of [30000, 50000, 100000, 200000]) {
  const rw = ctx.healthReward(buy).reward;                       // 원
  for (const [ko, a, f] of [["A-2", a2, 1], ["A-1", a1, INS]]) {
    const add = Math.floor(rw * f);                              // 그 기준으로 매달 늘어나는 금액(원)
    const mo = a.map((v) => (v >= GOAL_WON ? 0 : Math.ceil((GOAL_WON - v) / add))).sort((x, y) => x - y);
    const m = (p) => mo[Math.floor(mo.length * p)];
    console.log("  " + (buy / 10000 + "만원").padStart(7) + " " + won(rw).padStart(11) + "   " + ko + "  "
      + [m(.25), m(.5), m(.75), m(.9)].map((x) => (x + "개월").padStart(7)).join(" ")
      + "   " + (Math.ceil(GOAL_WON / add) + "개월").padStart(8));
  }
}
console.log("  * 신규 = 이월 잔액 0에서 시작. 코호트는 제네시스 이월을 갖고 시작한다.");
console.log("  * 자동 적립 엔진은 없다 — 위 개월수는 매달 회원이 실제로 결제한다는 가정이다.");

console.log("");
console.log("[E] 임계값 민감도 (즉시 충족률)");
console.log("     임계값        A-1        A-2   비고");
for (const [g, ko] of [[150000, "월5만 x 3개월 (대표 확정)"], [100000, "월5만 x 2개월"], [50000, "월5만 x 1개월"], [39000, "실손 월1.3만 x 3개월 (현행 사다리)"]])
  console.log("  " + won(g).padStart(10) + " " + (pct(a1, g).toFixed(1) + "%").padStart(10) + " " + (pct(a2, g).toFixed(1) + "%").padStart(10) + "   " + ko);

console.log("");
console.log("[요약]");
console.log("  1) 임계값을 어느 잔액에 거느냐가 결과를 가른다 — A-1 " + pct(a1, GOAL_WON).toFixed(1)
  + "% vs A-2 " + pct(a2, GOAL_WON).toFixed(1) + "%.");
console.log("  2) 코드가 보험료 납부에 30% 링펜스를 강제하지 않는다(premiumBilling은 총 잔액에서 차감).");
console.log("     30% 한도를 실제로 강제하는 곳은 쇼핑 결제뿐이다. 따라서 보험료 재원 기준은 A-2가 맞다.");
console.log("  3) 월 " + won(PREMIUM) + " 구매의 실제 적립은 " + won(r5.reward) + "이지 " + won(PREMIUM) + "이 아니다.");
