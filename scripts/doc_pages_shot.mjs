import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.6 });
await p.goto(pathToFileURL(resolve(process.argv[2])).href, { waitUntil:'networkidle0' });
await p.emulateMediaType('print');
const out = process.argv[3], n = Number(process.argv[4] || 5);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const per = Math.ceil(H / n);
for (let i = 0; i < n; i++) {
  const h = Math.min(per, H - i*per); if (h <= 0) break;
  await p.screenshot({ path: out + "_p" + (i+1) + ".png", clip: { x:0, y:i*per, width:794, height:h } });
}
console.log("면 이미지 " + n + "장 (면당 " + per + "px)");
await b.close();
