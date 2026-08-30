/* 데모 가이드 실화면 검증+캡처(임시 — 실행 후 삭제) */
import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = process.argv[2];

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1440, height: 940 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => {
  const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  S(document.querySelector('input[name="hifin-login-id"]'), '하이');
  S(document.querySelector('input[name="hifin-login-pw"]'), '하이1');
  [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click();
});
await sleep(4500);
console.log('demo hook:', JSON.stringify(await p.evaluate(() => window.__hifinDemo ? window.__hifinDemo() : null)).slice(0, 200));
await p.evaluate(() => {
  try { const l = window.__hifinPros ? window.__hifinPros('all') : null; const a = (l && l.pros ? l.pros : l || []).find(x => x.status === '활성'); if (a) sessionStorage.setItem('hifin_hm_code', a.code); } catch (e) {}
});
await p.evaluate(() => {
  const cands = [...document.querySelectorAll('button,a,div[role="button"],span')].filter(x => /헬스\s*메이트/.test(x.innerText || '') && (x.innerText || '').length < 30);
  if (cands.length) cands[0].click();
});
await sleep(3500);
await p.evaluate(() => {
  const xs = [...document.querySelectorAll('button')].filter(x => x.innerText.trim() === '✕' || x.innerText.trim() === '×');
  for (const x of xs) { try { x.click(); } catch (e) {} }
});
/* 데모 가이드 열기 */
const btn = await p.evaluate(() => {
  const g = [...document.querySelectorAll('button')].find(x => (x.innerText || '').indexOf('5분 데모') >= 0);
  if (g) { g.click(); return true; } return false;
});
console.log('guide button:', btn);
await sleep(700);
/* 스텝 5(⑩)로 이동 후 「이 화면 열기」 눌러 탭 전환 검증 */
const nav10 = await p.evaluate(() => {
  const chips = [...document.querySelectorAll('span')].filter(x => /^\d:\d\d\s+\d$/.test((x.innerText || '').trim()));
  const c5 = chips.find(x => x.innerText.trim().endsWith(' 5'));
  if (!c5) return 'chip5 없음';
  c5.click();
  return 'chip5 클릭';
});
console.log(nav10);
await sleep(500);
const opened = await p.evaluate(() => {
  const o = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '이 화면 열기');
  if (!o) return '버튼 없음';
  o.click(); return '이 화면 열기 클릭';
});
console.log(opened);
await sleep(1500);
const onOps = await p.evaluate(() => (document.body.innerText || '').indexOf('활동 결과 관제') >= 0 || (document.body.innerText || '').indexOf('통합 운영') >= 0);
console.log('⑩ 화면 전환:', onOps);
/* 스텝 1로 되돌려 캡처(첫인상용) */
await p.evaluate(() => {
  const chips = [...document.querySelectorAll('span')].filter(x => /^\d:\d\d\s+\d$/.test((x.innerText || '').trim()));
  const c1 = chips.find(x => x.innerText.trim().endsWith(' 1'));
  if (c1) c1.click();
});
await sleep(600);
await p.screenshot({ path: OUT });
console.log('saved:', OUT);
await b.close();
