/* 내보낸 mp4 검수 — 크롬에서 file://로 직접 열어 길이·탐색 가능 여부 확인 + 지정 시각 화면을 PNG로 저장 */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const IN = process.argv[2], OUTDIR = process.argv[3] || 'docs/hi_promo/assets';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
await p.goto(pathToFileURL(resolve(IN)).href, { waitUntil: 'load', timeout: 120000 });
await p.evaluate(() => { const v = document.querySelector('video'); v.muted = true; v.pause(); v.controls = false; v.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;background:#000'; });
const ts = [6, 20, 27, 50.5, 71, 84, 97, 108, 118.5]; const got = [];
for (let i = 0; i < ts.length; i++) {
  const t = await p.evaluate(async (t) => { const v = document.querySelector('video'); v.currentTime = t; await new Promise(r => { v.onseeked = r; setTimeout(r, 8000); }); await new Promise(r => setTimeout(r, 250)); return +v.currentTime.toFixed(1); }, ts[i]);
  got.push(t); await p.screenshot({ path: `${OUTDIR}/chk_${i}.png` });
}
const info = await p.evaluate(() => { const v = document.querySelector('video'); return { duration: v.duration, seekableEnd: v.seekable.length ? v.seekable.end(0) : 0, w: v.videoWidth, h: v.videoHeight }; });
console.log(JSON.stringify({ ...info, seekedTo: got }));
await b.close();
