/* HTML 문서에서 특정 제목 섹션만 캡처 — 인용: node _shot_sec.mjs <html> <제목일부> <out.png> */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', protocolTimeout:180000, args:['--no-sandbox','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 1400, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(resolve(process.argv[2])).href, { waitUntil:'networkidle0' });
const key = process.argv[3];
const box = await p.evaluate((key) => {
  const hs = [...document.querySelectorAll('h3,h2')];
  const st = hs.find(h => h.textContent.includes(key)); if (!st) return null;
  let en = st.nextElementSibling, last = st;
  while (en && !/^H[23]$/.test(en.tagName)) { last = en; en = en.nextElementSibling; }
  const a = st.getBoundingClientRect(), z = last.getBoundingClientRect();
  return { x: Math.max(0, Math.round(a.left + scrollX - 14)), y: Math.max(0, Math.round(a.top + scrollY - 12)),
           w: Math.round(a.width + 28), h: Math.round(z.bottom - a.top + 26) };
}, key);
if (!box) { console.log("섹션 못 찾음"); process.exit(1); }
console.log("clip", JSON.stringify(box));
await p.setViewport({ width: 900, height: Math.min(box.h + box.y + 40, 12000), deviceScaleFactor: 2 });
await p.screenshot({ path: process.argv[4], clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
console.log("캡처 OK");
await b.close();
