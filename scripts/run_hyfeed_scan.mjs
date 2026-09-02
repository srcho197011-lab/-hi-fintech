/* ══════════ 현대해상 제공 DB 무결성 스캔 — 리뉴얼 v1.1 R5 (§0-V3) ══════════
   제공 레코드에 ①사전(HY_FIELDS) 밖 필드 ②건강 상태 값(질환명·검진 항목·수치 어휘) ③등급(H/M/L)이
   유입되면 실패한다 — 커밋 게이트가 이 러너를 호출해 차단한다.
   실행: bash build_preview.sh && node scripts/run_hyfeed_scan.mjs
   산출: scripts/hyfeed_scan_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1200, height: 800 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

const res = await p.evaluate(() => {
  const scan = window.__hifinHyFeed("scan", 3000);
  const one = window.__hifinHyFeed("one", 63223);
  const fields = window.__hifinHyFeed("fields");
  /* 상한 검증 — days_to_expiry는 60일 상품 규격(≤45)을 넘을 수 없다 */
  let overCap = 0, withMat = 0;
  for (let i = 1; i <= 9000; i += 3) {
    const r = window.__hifinHyFeed("one", i);
    if (!r || r.days_to_expiry == null) continue;
    withMat++;
    if (r.days_to_expiry > 45 && ["T2", "T3", "T4", "T5", "T6"].indexOf(r.cycle_stage) >= 0) overCap++;
  }
  return { scan, sample: one, fieldN: fields.length, overCap, withMat };
});
await b.close();

const secs = ((Date.now() - t0) / 1000).toFixed(1);
const pass = res.scan.ok && res.overCap === 0;
console.log(`[제공DB] 필드 ${res.fieldN}종 · 표본 ${res.scan.n.toLocaleString()}건 · 위반 ${res.scan.bad.length}건 · 잔여일 상한 초과 ${res.overCap}건 · ${secs}s → ${pass ? "PASS" : "FAIL"}`);
if (res.scan.bad.length) for (const x of res.scan.bad.slice(0, 8)) console.error(" ×", JSON.stringify(x));
if (res.sample) console.log("표본 레코드:", JSON.stringify(res.sample).slice(0, 400));
writeFileSync(join(ROOT, "scripts/hyfeed_scan_snapshot.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), fields: res.fieldN, n: res.scan.n, bad: res.scan.bad.length, overCap: res.overCap, pass }, null, 2) + "\n", "utf8");
process.exit(pass ? 0 : 1);
