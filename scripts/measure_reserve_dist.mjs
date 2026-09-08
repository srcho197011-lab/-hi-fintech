/* 코호트 재원 분포 실측 — htkBase는 인덱스 결정론이라 원본 산식을 그대로 복제해 계산한다.
   원본: src/data/insuranceCohort.js:19-23(RNG·로그정규) · :123(htkBase) */
import { readFileSync } from 'node:fs';
const src = readFileSync("src/data/pilotCohort.js", "utf8") + "\n" + readFileSync("src/data/insuranceCohort.js", "utf8");   // _mul32는 pilotCohort.js에 있다

/* 원본 파일에서 필요한 함수 4개만 그대로 꺼내 쓴다(재구현 아님) */
const need = ["_mul32", "_icRng", "_icNorm", "_icLogn", "_icRound"];
const picked = need.map(n => {
  const m = src.match(new RegExp("function\\s+" + n + "\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}", "m"))
        || src.match(new RegExp("function\\s+" + n + "\\s*\\([^)]*\\)\\s*\\{.*?\\}\\s*$", "m"));
  return m ? m[0] : null;
});
const missing = need.filter((n, i) => !picked[i]);
if (missing.length) { console.log("원본에서 못 찾음:", missing.join(",")); process.exit(1); }
const F = new Function(picked.join("\n") + "\n; return { _icRng, _icLogn, _icRound };")();

/* 원본 :123 — const htkBase = _icRound(4000 + _icLogn(rng, 8480, 0.5, 1000, 40000), 10); */
const htkBaseOf = (i) => { const rng = F._icRng(i); return F._icRound(4000 + F._icLogn(rng, 8480, 0.5, 1000, 40000), 10); };

const RATE = 0.30, WON = 10, N = 50000;
const res = [];
for (let i = 1; i <= N; i++) res.push(Math.floor(htkBaseOf(i) * RATE) * WON);
res.sort((a, b) => a - b);
const pct = p => res[Math.floor(res.length * p)];
const mean = Math.round(res.reduce((s, x) => s + x, 0) / res.length);

console.log(`표본 ${res.length.toLocaleString()}명 · 치료비 케어 전용 적립금(총 적립 × 30% × 10원)`);
console.log(`  평균 ${mean.toLocaleString()}원 · 중앙 ${pct(.5).toLocaleString()} · p90 ${pct(.9).toLocaleString()} · 최대 ${res[res.length-1].toLocaleString()}원`);

console.log(`\n[월 보험료 × 개월수 기준 「충분」 비율]`);
console.log("  보험료 |   1개월    3개월    6개월   12개월");
for (const prem of [3000, 5000, 12900, 25000, 50000]) {
  const row = [1, 3, 6, 12].map(mo => {
    const need = prem * mo;
    let lo = 0, hi = res.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (res[mid] >= need) hi = mid; else lo = mid + 1; }
    return ((res.length - lo) / res.length * 100).toFixed(1) + "%";
  });
  console.log(`  ${(prem/10000).toFixed(2)}만 |` + row.map(x => x.padStart(8)).join(""));
}
console.log(`\n[12개월치를 채우려면 필요한 적립금]`);
for (const prem of [3000, 5000, 12900, 25000]) {
  const need = prem * 12;
  console.log(`  월 ${prem.toLocaleString()}원 → ${need.toLocaleString()}원 필요 = 총 적립 ${Math.ceil(need/WON/RATE).toLocaleString()} HTK`);
}
