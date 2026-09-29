/* HTML → A4 PDF (쪽번호 인쇄) — 설계문서·보고서용. 사용: node topdf_num.mjs <in.html> <out.pdf> ["머리글 문구"]
   topdf.mjs와 같되 아래 여백에 「n / 전체」를 찍는다. 헤드리스 크롬의 footerTemplate을 쓰므로 CSS @page 여백 안에 들어간다. */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';

const [, , src, dst, headText] = process.argv;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox', '--disable-gpu'] });
const p = await b.newPage();
await p.goto(pathToFileURL(resolve(src)).href, { waitUntil: 'networkidle0', timeout: 120000 });
await p.emulateMediaType('print');
await new Promise((r) => setTimeout(r, 800));
const foot = `<div style="width:100%;font-family:'Malgun Gothic',sans-serif;font-size:7.5pt;color:#9aa3b0;padding:0 14mm;display:flex;justify-content:space-between;">
  <span>${(headText || '').replace(/[<>&]/g, '')}</span>
  <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;
await p.pdf({
  path: dst, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: foot,
});
console.log('PDF OK ' + Math.round(statSync(dst).size / 1024) + 'KB');
await b.close();
