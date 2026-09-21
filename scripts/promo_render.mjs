/* 기업 홍보영상 mp4 내보내기 — docs/hi_promo/렌더.html을 크롬에서 실시간(120초) 녹화해 파일로 저장
   사용: node scripts/promo_render.mjs [출력경로]   (로컬 문서 서버 5799가 떠 있어야 한다) */
import puppeteer from 'puppeteer-core';
import { createWriteStream, writeFileSync, statSync } from 'node:fs';
const OUT = process.argv[2] || 'docs/hi_promo/하이젠케어_기업홍보영상_2분_v1.mp4';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 600000,
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1300,800', '--mute-audio'] });
const p = await b.newPage();
p.on('console', m => { const t = m.text(); if (/error|fail/i.test(t)) console.log('[page]', t); });
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('http://localhost:5799/docs/hi_promo/' + encodeURIComponent(process.env.PAGE || '렌더.html') + '?voice=' + (process.env.VOICE || 'hv') + (process.env.VBPS ? '&vbps=' + process.env.VBPS : ''), { waitUntil: 'load', timeout: 60000 });
await p.waitForFunction('window.__ready===true', { timeout: 30000 });
const ws = createWriteStream(OUT);
await p.exposeFunction('__chunk', (b64) => new Promise(r => ws.write(Buffer.from(b64, 'base64'), r)));
const timer = setInterval(async () => { try { console.log(await p.$eval('#log', e => e.textContent)); } catch (e) {} }, 15000);
const info = await p.evaluate(async () => {
  const { blob, mime, srt } = await window.__run({ vbps: Number(new URLSearchParams(location.search).get('vbps')) || undefined });
  const buf = new Uint8Array(await blob.arrayBuffer()); const STEP = 3 * 1024 * 1024;
  for (let o = 0; o < buf.length; o += STEP) { let s = ''; const part = buf.subarray(o, o + STEP); for (let i = 0; i < part.length; i += 0x8000) s += String.fromCharCode.apply(null, part.subarray(i, i + 0x8000)); await window.__chunk(btoa(s)); }
  return { mime, size: buf.length, srt };
});
clearInterval(timer);
await new Promise(r => ws.end(r));
writeFileSync(OUT.replace(/\.mp4$/, '.srt'), '\ufeff' + info.srt, 'utf8');
console.log('DONE', info.mime, Math.round(statSync(OUT).size / 1048576) + 'MB', OUT);
await b.close();
