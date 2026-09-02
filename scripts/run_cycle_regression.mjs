/* ══════════ 60일 사이클 엔진 회귀 러너 — 리뉴얼 v1.1 R0 ══════════
   채점: ①결정론(2세션 산출 완전 일치) ②단계-사이클 정합(락=T0·T1만, D2→T2·T3 초입 …)
        ③T 경계 정합(s14≤7→T5/T6, s3≤2→T2, s20 1~30→T7 2차 골든타임 …)
        ④세그먼트 명칭 린트(질환·건강 상태 단어 0) ⑤G 판정-사이클 일관(T0·T1은 접촉 금지, T2는 G2 포함)
   산출: scripts/cycle_regression_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();

async function session() {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1200, height: 800 } });
  const p = await b.newPage();
  await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
  await sleep(4200);
  return { b, p };
}

const IDX = []; for (let i = 1; i <= 30000; i += 7) IDX.push(i);   // 표본 4,286명

async function evalAll(p) {
  return p.evaluate((idx) => idx.map(i => {
    const c = window.__hifinCycle(i);
    const g = window.__hifinGSeg(i);
    return { i, t: c.t, d: c.examDaysAgo, s3: c.s3, s14: c.s14, s20: c.s20, s21: c.s21, plan: c.plan,
      stage: c.stage, enr: c.enrolled,
      blocked: g.blocked, top: g.top, segs: (g.segs || []).join(","), noContact: g.noContact };
  }), IDX);
}

/* 세션 1 */
let { b, p } = await session();
const lint = await p.evaluate(() => window.__hifinGSeg("lint"));
const A = await evalAll(p);
await b.close();
/* 세션 2 — 역순 호출(순서 교차 결정론) */
({ b, p } = await session());
const Brev = await p.evaluate((idx) => idx.map(i => { const c = window.__hifinCycle(i); const g = window.__hifinGSeg(i); return { i, t: c.t, d: c.examDaysAgo, top: g.top, segs: (g.segs || []).join(",") }; }), [...IDX].reverse());
await b.close();
const B = {}; for (const r of Brev) B[r.i] = r;

const fails = [];
const F = (why, r) => { if (fails.length < 12) fails.push({ why, i: r.i, t: r.t, d: r.d }); };
let n = 0, ok = 0;
const dist = {}; const segDist = {};
for (const r of A) {
  n++;
  let good = true;
  const b2 = B[r.i];
  if (!b2 || b2.t !== r.t || b2.d !== r.d || b2.top !== r.top || b2.segs !== r.segs) { F("결정론 불일치", r); good = false; }
  /* 단계-사이클 정합 */
  if (r.stage === "D1" && !r.enr && r.t !== null) { F("D1 미가입인데 사이클 시작", r); good = false; }
  if (r.stage === "D1" && r.enr && r.t !== null && ["T0", "T1"].indexOf(r.t) < 0) { F("락(D1 가입)인데 T0·T1 아님", r); good = false; }
  if (r.stage === "D2" && ["T2", "T3"].indexOf(r.t) < 0) { F("D2인데 T2·T3 아님", r); good = false; }
  /* T 경계 정합 */
  if (r.t === "T2" && !(r.s3 != null && r.s3 <= 2)) { F("T2인데 s3>2", r); good = false; }
  if (r.t === "T5" && !(r.s14 != null && r.s14 <= 7 && r.s14 > 0)) { F("T5 경계", r); good = false; }
  if (r.t === "T4" && !(r.s14 != null && r.s14 <= 20 && r.s14 > 7)) { F("T4 경계", r); good = false; }
  if (r.t === "T6" && r.s14 !== 0) { F("T6인데 s14≠0", r); good = false; }
  /* 60일 상품 규격(형 확정 2026-09-03) — 개시 전 잔여 표기 금지 · 접촉 시점 잔여 ≤45 */
  if (r.t === "T0" && r.s14 != null) { F("보장 개시 전인데 만기 잔여 표기", r); good = false; }
  if (["T2", "T3", "T4", "T5", "T6"].indexOf(r.t) >= 0 && r.s14 != null && r.s14 > 45) { F("접촉 시점 만기 잔여 45일 초과(60일 상품 모순)", r); good = false; }
  if (r.s20 != null && r.s20 > 0 && r.s14 != null) { F("s14·s20 동시 존재", r); good = false; }
  /* G-사이클 일관 */
  if ((r.t === "T0" || r.t === "T1") && !r.noContact) { F("락인데 접촉 허용", r); good = false; }
  if (r.t === "T2" && !r.blocked && r.segs.indexOf("G2") < 0) { F("T2인데 G2 없음", r); good = false; }
  if (r.t === "T5" && !r.blocked && r.segs.indexOf("G10b") < 0) { F("T5인데 G10b 없음", r); good = false; }
  if (good) ok++;
  dist[r.t || "PRE"] = (dist[r.t || "PRE"] || 0) + 1;
  if (r.top) segDist[r.top] = (segDist[r.top] || 0) + 1;
}
if (lint.bad && lint.bad.length) { fails.push({ why: "세그먼트 명칭 린트 위반", bad: lint.bad }); }

const acc = (ok / n * 100).toFixed(2);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const pass = Number(acc) >= 99.9 && (!lint.bad || lint.bad.length === 0);
console.log(`[사이클] 표본 ${n.toLocaleString()} · 정합 ${ok.toLocaleString()} · ${acc}% · 린트 위반 ${(lint.bad || []).length} · ${secs}s → ${pass ? "PASS" : "FAIL"}`);
console.log("T 분포:", JSON.stringify(dist));
console.log("최우선 세그먼트 분포:", JSON.stringify(segDist));
if (fails.length) for (const f of fails) console.error(" ×", JSON.stringify(f).slice(0, 160));
writeFileSync(join(ROOT, "scripts/cycle_regression_snapshot.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), n, ok, acc: Number(acc), dist, segDist, pass }, null, 2) + "\n", "utf8");
process.exit(pass ? 0 : 1);
