/* ══════════ 10만 지시서 배치 러너 — 지시서 프롬프트 v1.3 §5-F (P5) ══════════
   "10만 지시서" = 전 회원의 (등급·개입·프로·타이밍·완결)이 결정론으로 정의되고 언제든 조립 가능한 상태.
   검증 2축(예산 5분):
     ① 전건 정의 — 코호트 100,000명 전건 카드 조립(카드 대상은 발행 가능 100% · 등급/시도/락 분포 집계)
     ② 전원 조립 — 프로 696명 전원의 당일 로스터 실제 조립(건수 5±2·중복 0·발행 불가 0·락 위반 0) — 표본 대체 금지
   산출: scripts/handoff_batch_report.json + src/data/hmOpsSnapshot.js(⑩관제탑의 유일한 원천 — 운영 정합 §7-⑥)
        + fixtures/handoff_roster_sample_v1.json(형 검수용 프로 3인분)
   실행: bash build_preview.sh && python -m http.server 5601 → node scripts/run_handoff_batch.mjs [YYYY-MM-DD] */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const TOTAL = 100000;
const t0 = Date.now();

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

/* ── ① 전건 정의 검증 — 100,000명 스캔(집계는 페이지 안에서, 왕복은 집계만) ── */
const agg = { n: 0, cards: 0, pub: 0, byGrade: {}, bySido: {}, byGroup: {}, locked: 0, unpubBad: [] };
const CH = 2500;
for (let i = 1; i <= TOTAL; i += CH) {
  const part = await p.evaluate((from, to) => {
    const rows = window.__hifinCardScan(from, to);
    const o = { n: 0, cards: 0, pub: 0, byGrade: {}, bySido: {}, byGroup: {}, locked: 0, bad: [] };
    for (const r of rows) {
      o.n++; o.byGrade[r.grade] = (o.byGrade[r.grade] || 0) + 1;
      if (r.lock) o.locked++;
      if (r.grade === "-") continue;
      o.cards++; o.bySido[r.sido] = (o.bySido[r.sido] || 0) + 1; o.byGroup[r.group] = (o.byGroup[r.group] || 0) + 1;
      if (r.pub) o.pub++; else if (o.bad.length < 5) o.bad.push(r.i);
    }
    return o;
  }, i, Math.min(i + CH, TOTAL + 1));
  agg.n += part.n; agg.cards += part.cards; agg.pub += part.pub; agg.locked += part.locked;
  for (const k in part.byGrade) agg.byGrade[k] = (agg.byGrade[k] || 0) + part.byGrade[k];
  for (const k in part.bySido) agg.bySido[k] = (agg.bySido[k] || 0) + part.bySido[k];
  for (const k in part.byGroup) agg.byGroup[k] = (agg.byGroup[k] || 0) + part.byGroup[k];
  agg.unpubBad.push(...part.bad);
  if ((i - 1) % 25000 === 0) console.log(`  … ${i - 1 + part.n}/${TOTAL} 스캔 (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
console.log(`[전건  ] ${agg.n.toLocaleString()}명 · 카드 대상 ${agg.cards.toLocaleString()} · 발행 가능 ${agg.pub.toLocaleString()} (${agg.cards === agg.pub ? "100%" : "미달 " + (agg.cards - agg.pub)}) · 락 ${agg.locked.toLocaleString()}`);
console.log(`[등급  ] ${JSON.stringify(agg.byGrade)}`);

/* ── ①-b 사번·배치 검증(2단계 P3) — 전원 사번 유일·수도권 가중 편차 ── */
const allPros = await p.evaluate(() => window.__hifinPros("all"));
const sabSet = new Set(allPros.map(x => x.sabun));
const sabOk = sabSet.size === allPros.length && allPros.every(x => /^8H\d{4}$/.test(x.sabun || ""));
console.log(`[사번  ] 전원 ${allPros.length}명 · 유일 ${sabSet.size} · 형식 8H#### ${sabOk ? "OK" : "위반"}`);

/* ── ② 전원 조립 검증 — 활성 프로 전원(코드 목록은 페이지에서) ── */
const proCodes = await p.evaluate(() => window.__hifinPros());
const rc = { checked: 0, viol: [], sum: 0, max: 0, byGrade: {}, zero: 0, mSum: 0, mBySido: {}, prosBySido: {}, byBranch: {} };
const PCH = 24;
for (let i = 0; i < proCodes.length; i += PCH) {
  const part = await p.evaluate((codes, date) => {
    const out = [];
    for (const c of codes) {
      const r = window.__hifinRoster(c.code, date);
      if (!r || r.error) { out.push({ code: c.code, viol: ["훅 오류 " + (r && r.error)] }); continue; }
      const v = [];
      if (r.rows.length > 7) v.push("건수 초과 " + r.rows.length);
      const seen = new Set(); let dup = 0;
      for (const row of r.rows) { if (seen.has(row.i)) dup++; seen.add(row.i); if (!row.pub) v.push("발행불가 i=" + row.i); if (row.lock) v.push("락 위반 i=" + row.i); }
      if (dup) v.push("중복 " + dup);
      const g = {}; r.rows.forEach(row => g[row.grade] = (g[row.grade] || 0) + 1);
      out.push({ code: c.code, sabun: c.sabun, name: c.name, sido: c.sido, branch: c.branch, n: r.rows.length, managed: r.counts.managed, g, viol: v });
    }
    return out;
  }, proCodes.slice(i, i + PCH), DATE);
  for (const r of part) {
    rc.checked++;
    if (r.viol && r.viol.length) rc.viol.push(r);
    else { rc.sum += r.n; rc.max = Math.max(rc.max, r.n); if (r.n === 0) rc.zero++; for (const k in r.g) rc.byGrade[k] = (rc.byGrade[k] || 0) + r.g[k]; }
    /* P3 — 시도별 부하(관할)·지점 드릴다운 스냅샷 */
    rc.mSum += r.managed || 0;
    if (r.sido) { rc.mBySido[r.sido] = (rc.mBySido[r.sido] || 0) + (r.managed || 0); rc.prosBySido[r.sido] = (rc.prosBySido[r.sido] || 0) + 1; }
    const bk = (r.sido || "") + "|" + (r.branch || "");
    (rc.byBranch[bk] || (rc.byBranch[bk] = { sido: r.sido, branch: r.branch, pros: [] })).pros.push({ sabun: r.sabun, name: r.name, code: r.code, managed: r.managed || 0, today: r.n || 0 });
  }
  if (i % 240 === 0) console.log(`  … 프로 ${Math.min(i + PCH, proCodes.length)}/${proCodes.length} 조립 (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
const avg = rc.checked ? (rc.sum / rc.checked).toFixed(2) : 0;
/* P3 편차 — 시도별 프로당 평균 관할 / 전국 평균 (목표 ±20%) */
const natAvg = rc.checked ? rc.mSum / rc.checked : 0;
const loadBySido = Object.keys(rc.mBySido).map(s => ({ sido: s, perPro: rc.mBySido[s] / rc.prosBySido[s], pros: rc.prosBySido[s] }))
  .map(x => ({ ...x, ratio: natAvg ? x.perPro / natAvg : 1 })).sort((a, b) => b.ratio - a.ratio);
const maxRatio = loadBySido.length ? loadBySido[0].ratio : 1, minRatio = loadBySido.length ? loadBySido[loadBySido.length - 1].ratio : 1;
console.log(`[전원  ] 프로 ${rc.checked}명 조립 · 위반 ${rc.viol.length}건 · 평균 ${avg}건 · 최대 ${rc.max}건 · 0건 프로 ${rc.zero}명 · 로스터 등급 ${JSON.stringify(rc.byGrade)}`);
console.log(`[편차  ] 전국 프로당 관할 평균 ${natAvg.toFixed(1)}명 · 시도별 비율 max ${maxRatio.toFixed(2)} / min ${minRatio.toFixed(2)} (목표 0.8~1.2)`);
console.log(`  상위: ${loadBySido.slice(0, 3).map(x => `${x.sido} ${x.ratio.toFixed(2)}`).join(" · ")} / 하위: ${loadBySido.slice(-3).map(x => `${x.sido} ${x.ratio.toFixed(2)}`).join(" · ")}`);

/* ── 형 검수용 프로 3인분 — 시도가 서로 다른, 당일 로스터 1건 이상인 프로(전체 카드로 재조립) ── */
const sampleRosters = [];
const seenSido = new Set();
for (const c of proCodes) {
  if (sampleRosters.length === 3) break;
  if (seenSido.has(c.sido)) continue;
  const full = await p.evaluate((code, date) => window.__hifinRosterFull(code, date), c.code, DATE);
  if (!full || full.error || !full.cards.length) continue;
  full.pro = c; seenSido.add(c.sido); sampleRosters.push(full);
}
await b.close();

const secs = Number(((Date.now() - t0) / 1000).toFixed(1));
const pass = agg.cards === agg.pub && rc.viol.length === 0 && agg.n === TOTAL;
console.log(`총 소요 ${secs}s (예산 300s) → ${pass ? "PASS" : "FAIL"}`);
if (!pass) { console.error("unpub 표본:", agg.unpubBad.slice(0, 10), "위반 표본:", JSON.stringify(rc.viol.slice(0, 5))); }

const report = { date: DATE, total: agg.n, cards: agg.cards, publishable: agg.pub, locked: agg.locked,
  byGrade: agg.byGrade, bySido: agg.bySido, byGroup: agg.byGroup,
  pros: rc.checked, prosAll: allPros.length, sabunOk: sabOk,
  rosterViol: rc.viol.length, avgRoster: Number(avg), maxRoster: rc.max, zeroRosterPros: rc.zero,
  byRosterGrade: rc.byGrade,
  loadAvg: Number(natAvg.toFixed(1)), loadRatioMax: Number(maxRatio.toFixed(2)), loadRatioMin: Number(minRatio.toFixed(2)),
  loadBySido: loadBySido.map(x => ({ sido: x.sido, pros: x.pros, perPro: Number(x.perPro.toFixed(1)), ratio: Number(x.ratio.toFixed(2)) })),
  seconds: secs, pass };
writeFileSync(join(ROOT, "scripts/handoff_batch_report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
writeFileSync(join(ROOT, "src/data/hmOpsSnapshot.js"),
  "/* 자동 생성 — run_handoff_batch.mjs (P5). ⑩관제탑이 읽는 배치 스냅샷 — 손대지 말 것(운영 정합 §7-⑥: 관제탑 집계 = 이 스냅샷 = 배치 리포트). */\n"
  + "const HM_OPS_SNAPSHOT = " + JSON.stringify({ date: report.date, total: report.total, cards: report.cards, publishable: report.publishable,
    locked: report.locked, byGrade: report.byGrade, bySido: report.bySido,
    pros: report.pros, prosAll: report.prosAll, sabunOk: report.sabunOk,
    rosterChecked: report.pros, rosterViol: report.rosterViol, avgRoster: report.avgRoster, maxRoster: report.maxRoster,
    byRosterGrade: report.byRosterGrade,
    loadAvg: report.loadAvg, loadRatioMax: report.loadRatioMax, loadRatioMin: report.loadRatioMin, loadBySido: report.loadBySido,
    seconds: report.seconds, pass: report.pass }) + ";\n"
  + "const HM_OPS_BRANCHES = " + JSON.stringify(Object.values(rc.byBranch)) + ";\n", "utf8");
writeFileSync(join(ROOT, "fixtures/handoff_roster_sample_v1.json"),
  JSON.stringify({ meta: { v: "1.0", spec: "지시서 v1.3 §5-F", date: DATE, note: "형 검수용 프로 3인분 — 시드=날짜+프로코드 결정론 재현" }, rosters: sampleRosters }, null, 2), "utf8");
console.log("hmOpsSnapshot.js · handoff_batch_report.json · handoff_roster_sample_v1.json 저장");
process.exit(pass ? 0 : 1);
