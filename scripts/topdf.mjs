/* HTML → A4 PDF (헤드리스 크롬 인쇄) — 설계문서·보고서 공통 */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--disable-gpu'] });
const p = await b.newPage();
await p.goto(pathToFileURL(resolve(process.argv[2])).href, { waitUntil: 'networkidle0', timeout: 60000 });
await p.emulateMediaType('print');
await new Promise(r => setTimeout(r, 800));
await p.pdf({ path: process.argv[3], format: 'A4', printBackground: true, preferCSSPageSize: true });
console.log("PDF OK " + Math.round(statSync(process.argv[3]).size / 1024) + "KB");
await b.close();
