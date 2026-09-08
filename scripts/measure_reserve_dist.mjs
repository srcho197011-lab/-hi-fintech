/* 코호트 재원 분포 실측 - htkBase는 인덱스 결정론이라 원본 산식을 그대로 꺼내 계산한다(재구현 아님).
   원본: src/data/insuranceCohort.js:20-23(RNG/로그정규) / :123(htkBase) / src/data/pilotCohort.js:7(_mul32)
   임계값: 월 5만원 장기보험 x 3개월 = 150,000원 (대표 지시) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');   // 스크립트 위치 기준(어느 cwd에서 실행해도 동일)
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const src = rd('src/data/pilotCohort.js') + '\n' + rd('src/data/insuranceCohort.js');   // _mul32는 pilotCohort.js에 있다

/* 원본 파일에서 필요한 함수 5개만 그대로 꺼내 쓴다(재구현 아님) */
const need = ['_mul32', '_icRng', '_icNorm', '_icLogn', '_icRound'];
const picked = need.map((n) => {
  const m = src.match(new RegExp('function\\s+' + n + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}', 'm'))
        || src.match(new RegExp('function\\s+' + n + '\\s*\\([^)]*\\)\\s*\\{.*?\\}\\s*$', 'm'));
  return m ? m[0] : null;
});
const missing = need.filter((n, i) => !picked[i]);
if (missing.length) { console.log('원본에서 못 찾음:', missing.join(',')); process.exit(1); }
const F = new Function(picked.join('\n') + '\n; return { _icRng, _icLogn, _icRound };')();

/* 원본 insuranceCohort.js:123 - const htkBase = _icRound(4000 + _icLogn(rng, 8480, 0.5, 1000, 40000), 10); */
const htkBaseOf = (i) => { const rng = F._icRng(i); return F._icRound(4000 + F._icLogn(rng, 8480, 0.5, 1000, 40000), 10); };

/* ── 실코드 상수(전부 원본 파일에서 재확인한 값) ── */
const RATE = 0.30;   // src/data/sectionData.js:8  HTK_INS_RATE
const WON  = 10;     // src/data/sectionData.js:6  WALLET.rate (1 HTK = 10원)
const N    = 50000;  // 표본 회원 수
const THRESHOLD = 150000;                 // 월 5만 x 3개월
const SUPPLY_RATE = 0.50, MARGIN_REWARD_RATE = 0.50;   // src/data/shopProducts.js:7

/* 원본 shopProducts.js:8-15 healthReward()와 동일 산식(판매가의 25%) */
const healthRewardWon = (price) => {
  const p = Math.max(0, Math.floor(Number(price) || 0));
  const supply = Math.floor(p * SUPPLY_RATE);
  return Math.floor((p - supply) * MARGIN_REWARD_RATE);
};

/* ── 표시 폭 정렬(한글 2칸) ── */
const w = (s) => [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 0x2000 ? 2 : 1), 0);
const padR = (s, n) => String(s) + ' '.repeat(Math.max(0, n - w(s)));
const padL = (s, n) => ' '.repeat(Math.max(0, n - w(s))) + String(s);
const won = (v) => Math.round(v).toLocaleString('en-US');
const line = (ch, n) => ch.repeat(n);

/* ── 표본 생성 ── */
const base = [];                                   // htkBase (HTK)
for (let i = 1; i <= N; i++) base.push(htkBaseOf(i));
const A1 = base.map((b) => Math.floor(b * RATE) * WON);   // 치료비 케어 전용 적립금(원)
const A2 = base.map((b) => b * WON);                      // 총 적립금(원)
const sBase = [...base].sort((a, b) => a - b);
const s1 = [...A1].sort((a, b) => a - b);
const s2 = [...A2].sort((a, b) => a - b);
const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;
const atLeast = (sorted, t) => {                   // t 이상인 비율(%)
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] >= t) hi = mid; else lo = mid + 1; }
  return (sorted.length - lo) / sorted.length * 100;
};
/* 임계값 T(원)를 넘기는 데 필요한 최소 잔액(HTK) - 각 기준의 실제 산식을 이분탐색으로 역산 */
const needHtk = (T, kind) => {
  const f = kind === 'A1' ? ((b) => Math.floor(b * RATE) * WON) : ((b) => b * WON);
  let lo = 0, hi = 10000000;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (f(mid) >= T) hi = mid; else lo = mid + 1; }
  return lo;
};

console.log(line('=', 78));
console.log('재원 임계값 실측 - 표본 ' + N.toLocaleString('en-US') + '명 (insuranceCohort htkBase 원본 산식 호출)');
console.log('임계값 ' + won(THRESHOLD) + '원 = 월 5만원 장기보험 x 3개월');
console.log('환산 1 HTK = ' + WON + '원 (sectionData.js:6) / 치료비 케어 비율 ' + (RATE * 100) + '% (sectionData.js:8)');
console.log(line('=', 78));

/* ─────────── A) 기준 이원화 ─────────── */
console.log('\n[A] 기준 이원화 - 임계값 ' + won(THRESHOLD) + '원을 어느 잔액에 거는가');
console.log('  A-1 치료비 케어 전용 적립금 = floor(htkBase x 0.30) x 10원  (보험료/의료비 결제 전용분)');
console.log('  A-2 총 적립금               = htkBase x 10원               (일반 70% + 케어 30% 전부)');
console.log('  ※ htkBase는 가입 시점 이월 잔액(tokenLedger.js:66 genesis)이며 careplan/shop/referral 적립 증분은 미포함 = 하한값');
console.log('');
const hdr = ['기준', '충족률', '평균', '중앙(p50)', 'p75', 'p90', '최대', '최소'];
const wds = [30, 8, 11, 11, 11, 11, 11, 9];
console.log('  ' + hdr.map((h, i) => padL(h, wds[i])).join(' '));
console.log('  ' + wds.map((n) => line('-', n)).join(' '));
const rowA = (label, sorted) => console.log('  ' + [
  padR(label, wds[0]),
  padL(atLeast(sorted, THRESHOLD).toFixed(1) + '%', wds[1]),
  padL(won(mean(sorted)), wds[2]),
  padL(won(pct(sorted, 0.50)), wds[3]),
  padL(won(pct(sorted, 0.75)), wds[4]),
  padL(won(pct(sorted, 0.90)), wds[5]),
  padL(won(sorted[sorted.length - 1]), wds[6]),
  padL(won(sorted[0]), wds[7]),
].join(' '));
rowA('A-1 치료비 케어(30%)', s1);
rowA('A-2 총 적립금(100%)', s2);
console.log('  ※ 중앙 = p50 (같은 값). 단위는 모두 원.');
console.log('  ※ ' + won(THRESHOLD) + '원 도달에 필요한 잔액: A-1 ' + needHtk(THRESHOLD, 'A1').toLocaleString('en-US')
  + ' HTK / A-2 ' + needHtk(THRESHOLD, 'A2').toLocaleString('en-US') + ' HTK'
  + '  (중앙 회원 htkBase ' + pct(sBase, 0.5).toLocaleString('en-US') + ' HTK)');

/* ─────────── B) 적립 속도를 넣은 도달 개월 ─────────── */
console.log('\n' + line('=', 78));
console.log('[B] 월 적립 시나리오별 ' + won(THRESHOLD) + '원 도달 개월  ★전 시나리오 [추정]★');
console.log(line('=', 78));
console.log('  [추정] 근거: 시간 경과로 토큰을 자동 지급하는 스케줄러/크론/월 적립 엔진이 코드에 없다.');
console.log('         적립은 전부 구매 버튼/지금 받기/동의 클릭 시점의 1회성 기록이므로,');
console.log('         아래 "월 X원 적립"은 회원이 매달 실제로 그만큼 결제한다는 가정 위의 문구 기반 추정이다.');
console.log('  [추정] WALLET.monthEarn(1,840 HTK)은 sectionData.js:6에 남아 있으나 src/ 참조 0건인 미참조상수다.');
console.log('         비교용으로만 시나리오에 넣었다(실제 지급 코드 없음).');
console.log('  실계산: 영양제 구매액 -> 적립액은 healthReward() 원식(판매가의 25%)을 그대로 적용 = 추정 아님.');
console.log('');

const scen = [
  { n: 'WALLET.monthEarn 미참조상수', htk: 1840, note: '코드값 1,840 HTK (참조 0건) [추정]' },
  { n: '영양제 월 5만원 구매', htk: healthRewardWon(50000) / WON, note: 'healthReward(50000)=' + won(healthRewardWon(50000)) + '원' },
  { n: '영양제 월 5만 + 정기보너스', htk: Math.floor(healthRewardWon(50000) * 1.1) / WON, note: 'subscription.js:93 보너스 10%' },
  { n: '영양제 월 10만원 구매', htk: healthRewardWon(100000) / WON, note: 'healthReward(100000)=' + won(healthRewardWon(100000)) + '원' },
  { n: '영양제 월 20만원 구매', htk: healthRewardWon(200000) / WON, note: 'healthReward(200000)=' + won(healthRewardWon(200000)) + '원' },
];

const monthsTo = (b, m, needB) => (b >= needB ? 0 : Math.ceil((needB - b) / m));
const bw = [28, 12, 8, 8, 8, 9, 9];
const bhdr = ['시나리오', '월적립(원)', '중앙', 'p25', 'p75', '즉시충족', '평균개월'];
for (const kind of ['A1', 'A2']) {
  const nb = needHtk(THRESHOLD, kind);
  console.log('  < ' + kind + ' 기준 - 필요 잔액 ' + nb.toLocaleString('en-US') + ' HTK ('
    + (kind === 'A1' ? '케어 30%분이 15만원' : '총 적립이 15만원') + ') >');
  console.log('  ' + bhdr.map((h, i) => padL(h, bw[i])).join(' '));
  console.log('  ' + bw.map((n) => line('-', n)).join(' '));
  for (const s of scen) {
    const mo = base.map((b) => monthsTo(b, s.htk, nb)).sort((a, b) => a - b);
    const zero = mo.filter((x) => x === 0).length / mo.length * 100;
    console.log('  ' + [
      padR(s.n, bw[0]),
      padL(won(s.htk * WON), bw[1]),
      padL(pct(mo, 0.50) + '개월', bw[2]),
      padL(pct(mo, 0.25) + '개월', bw[3]),
      padL(pct(mo, 0.75) + '개월', bw[4]),
      padL(zero.toFixed(1) + '%', bw[5]),
      padL(mean(mo).toFixed(1) + '개월', bw[6]),
    ].join(' '));
  }
  console.log('');
}
console.log('  ※ 이미 충족한 회원은 0개월로 계산. p25 = 빠른 쪽 25%, p75 = 느린 쪽 25% 경계.');
console.log('  ※ 적립금으로 결제하면 그 달 적립 기준(payWon)이 줄어든다(Shop.jsx:812-814) - 위는 전액 현금결제 가정 [추정].');

/* ─────────── C) 역산 - 3개월 도달 ─────────── */
console.log('\n' + line('=', 78));
console.log('[C] 역산 - 3개월 안에 ' + won(THRESHOLD) + '원에 도달하려면? (중앙 회원 기준)');
console.log(line('=', 78));
const medB = pct(sBase, 0.50);
console.log('  중앙 회원 htkBase = ' + medB.toLocaleString('en-US') + ' HTK (= ' + won(medB * WON) + '원 총 적립 / '
  + won(Math.floor(medB * RATE) * WON) + '원 케어분)');
console.log('');
const cw = [10, 13, 13, 15, 15, 16];
const chdr = ['기준', '필요 잔액', '3개월 부족분', '필요 월적립', '필요 월적립(원)', '필요 월 구매액'];
console.log('  ' + chdr.map((h, i) => padL(h, cw[i])).join(' '));
console.log('  ' + cw.map((n) => line('-', n)).join(' '));
const backCalc = [];
for (const kind of ['A1', 'A2']) {
  const nb = needHtk(THRESHOLD, kind);
  const gap = Math.max(0, nb - medB);
  const perMo = Math.ceil(gap / 3);
  const perMoWon = perMo * WON;
  const buy = Math.ceil(perMoWon / (1 - SUPPLY_RATE) / MARGIN_REWARD_RATE);   // 적립액 = 구매액 x 0.25 의 역산
  backCalc.push({ kind, nb, gap, perMo, perMoWon, buy });
  console.log('  ' + [
    padR(kind, cw[0]),
    padL(nb.toLocaleString('en-US') + ' HTK', cw[1]),
    padL(gap.toLocaleString('en-US') + ' HTK', cw[2]),
    padL(perMo.toLocaleString('en-US') + ' HTK', cw[3]),
    padL(won(perMoWon), cw[4]),
    padL(won(buy), cw[5]),
  ].join(' '));
}
console.log('  ※ 필요 월 구매액 = 필요 월적립(원) / 0.25 (healthReward 판매가 25% 역산, 원 단위 올림) - 산식은 실코드.');
console.log('');
console.log('  [C-2] 이월 0인 신규 회원 - 3개월치를 순수 신규 적립으로만 만들 때');
console.log('  ' + chdr.map((h, i) => padL(h, cw[i])).join(' '));
console.log('  ' + cw.map((n) => line('-', n)).join(' '));
for (const kind of ['A1', 'A2']) {
  const nb = needHtk(THRESHOLD, kind);
  const perMo = Math.ceil(nb / 3);
  const perMoWon = perMo * WON;
  const buy = Math.ceil(perMoWon / (1 - SUPPLY_RATE) / MARGIN_REWARD_RATE);
  console.log('  ' + [
    padR(kind + ' 신규', cw[0]), padL(nb.toLocaleString('en-US') + ' HTK', cw[1]),
    padL(nb.toLocaleString('en-US') + ' HTK', cw[2]), padL(perMo.toLocaleString('en-US') + ' HTK', cw[3]),
    padL(won(perMoWon), cw[4]), padL(won(buy), cw[5]),
  ].join(' '));
}
console.log('  ※ 위 [C] 표의 A2 "월 46,280원" 은 중앙 회원이 이미 이월 115,300원을 갖고 있어서 나온 값이다.');
console.log('     이월을 빼고 3개월 신규 적립만으로 15만원을 만들려면 A-2도 월 200,000원어치 구매가 필요하다.');
console.log('  ※ 대표 근거였던 "영양제 월 5만원"의 실제 적립은 ' + won(healthRewardWon(50000)) + '원/월 = '
  + (healthRewardWon(50000) / WON).toLocaleString('en-US') + ' HTK/월 이다.');
for (const b of backCalc) {
  const need5 = Math.ceil(b.buy / 50000 * 10) / 10;
  console.log('     -> ' + b.kind + ' 기준 3개월 도달에는 월 ' + won(b.buy) + '원어치 = 월 5만원의 약 ' + need5.toFixed(1) + '배가 필요.');
}
{
  const m5 = healthRewardWon(50000) / WON;
  for (const kind of ['A1', 'A2']) {
    const nb = needHtk(THRESHOLD, kind);
    const mo = base.map((b) => monthsTo(b, m5, nb)).sort((a, b) => a - b);
    const md = pct(mo, 0.5);
    console.log('     -> ' + kind + ' 기준, 월 5만원 구매를 유지하면 중앙 회원은 ' + md + '개월'
      + (md <= 3 ? ' (요구 3개월 이내 - 대표 근거 성립)' : ' (요구 3개월의 ' + (md / 3).toFixed(1) + '배 - 대표 근거 불성립)'));
  }
}

/* ─────────── D) 민감도 ─────────── */
console.log('\n' + line('=', 78));
console.log('[D] 임계값 민감도 - 현재 잔액(htkBase) 기준 즉시 충족률');
console.log(line('=', 78));
const dw = [14, 14, 14, 16, 16];
const dhdr = ['임계값(원)', 'A-1 충족률', 'A-2 충족률', 'A-1 필요잔액', 'A-2 필요잔액'];
console.log('  ' + dhdr.map((h, i) => padL(h, dw[i])).join(' '));
console.log('  ' + dw.map((n) => line('-', n)).join(' '));
for (const T of [150000, 100000, 50000]) {
  console.log('  ' + [
    padL(won(T), dw[0]),
    padL(atLeast(s1, T).toFixed(1) + '%', dw[1]),
    padL(atLeast(s2, T).toFixed(1) + '%', dw[2]),
    padL(needHtk(T, 'A1').toLocaleString('en-US') + ' HTK', dw[3]),
    padL(needHtk(T, 'A2').toLocaleString('en-US') + ' HTK', dw[4]),
  ].join(' '));
}
console.log('  ※ 150,000 = 월5만x3개월 / 100,000 = 월5만x2개월(또는 월2.5만x4) / 50,000 = 월5만x1개월.');

/* ─────────── 요약 ─────────── */
console.log('\n' + line('=', 78));
console.log('[요약]');
console.log(line('=', 78));
const capHtk = 4000 + 40000;   // insuranceCohort.js:123 _icLogn 상한(hi=40000) + 기저 4000 = htkBase 구조적 최대
console.log('  1) A-1(치료비 케어 30%) 기준 15만원 즉시 충족률 = ' + atLeast(s1, THRESHOLD).toFixed(1) + '%');
console.log('     이건 표본이 작아서가 아니라 구조적 상한이다: htkBase 최대는 ' + capHtk.toLocaleString('en-US')
  + ' HTK(insuranceCohort.js:123 _icLogn hi=40000 + 4000)이고,');
console.log('     그 30%는 ' + won(Math.floor(capHtk * RATE) * WON) + '원 <  ' + won(THRESHOLD)
  + '원. 즉 이월잔액만으로는 어떤 회원도 A-1 15만원에 도달할 수 없다(필요 '
  + needHtk(THRESHOLD, 'A1').toLocaleString('en-US') + ' HTK > 상한 ' + capHtk.toLocaleString('en-US') + ' HTK).');
console.log('  2) A-2(총 적립) 기준 15만원 즉시 충족률 = ' + atLeast(s2, THRESHOLD).toFixed(1) + '%');
console.log('  3) [추정] 월 5만원 영양제 구매의 실제 적립은 ' + won(healthRewardWon(50000)) + '원(1,250 HTK)이라,');
console.log('     "월 5만원이면 3개월에 15만원" 이라는 근거는 적립액과 구매액을 같은 단위로 본 것이다.');
console.log('     15만원 적립을 3개월에 만들려면 A-2 기준으로도 월 ' + won(backCalc[1].buy) + '원어치 구매가 필요하다.');
console.log('  4) [추정] 자동 월 적립 엔진 없음 - 위 개월수는 전부 "매달 회원이 실제 결제한다"는 가정치.');
console.log(line('=', 78));
