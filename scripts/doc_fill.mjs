import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox','--disable-gpu'] });
const p = await b.newPage();
await p.goto(pathToFileURL(resolve(process.argv[2])).href, { waitUntil:'networkidle0' });
await p.emulateMediaType('print');
await p.setViewport({ width: 794, height: 1123 });           // A4 @96dpi
const h = await p.evaluate(() => document.documentElement.scrollHeight);
// 인쇄 여백 12mm 상하 -> 콘텐츠 높이 약 1123 - 2*45 = 1033px
const per = 1123 - 2*45;
console.log("문서 높이 " + h + "px, 면당 약 " + per + "px -> 약 " + (h/per).toFixed(2) + "면");
console.log("5면에 맞추려면 " + Math.max(0, Math.round(h - per*5)) + "px 줄여야 함 (약 " + Math.round((h-per*5)/per*100) + "%)");
await b.close();
