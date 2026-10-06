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
import { devLogin } from './devcred.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const TOTAL = 100000;
const t0 = Date.now();

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await devLogin(p);

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
      /* 카드 대상 — 명단에 오르는 D2는 등급 '-'여도 검증한다(형 지시 2026-10-06 · 하네스 ①과 같은 정의) */
      if (r.grade === "-" && r.stage !== "D2") continue;
      o.cards++; o.bySido[r.sido] = (o.bySido[r.sido] || 0) + 1;
      /* 결과 수령 전에는 지표군을 판정하지 않으므로 group이 null이다 — 합이 cards와 어긋나지 않게 명시 키로 센다 */
      o.byGroup[r.group || "미판정"] = (o.byGroup[r.group || "미판정"] || 0) + 1;
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
const rc = { checked: 0, viol: [], sum: 0, max: 0, byGrade: {}, zero: 0, mSum: 0, mBySido: {}, prosBySido: {}, byBranch: {},
  byStage: {}, byCycle: {}, d2Quota: 0, matQuota: 0, under: 0, d2Left: { "24h이내": 0, "48h이내": 0, "창닫힘": 0, "창밖": 0 },
  /* 「D2 우선」의 가격을 세는 자리 — 종전에는 어디에도 없었다(적대적 리뷰 실증: 로스터 H가
     3,204 → 1,824로 43% 줄었는데 리포트·화면·러너 모두 침묵했다) */
  hCand: 0, hSeated: 0, hUnseated: 0, d2OpenCand: 0, d2OpenSeated: 0, dashD2: 0, slaLess: 0, win: null };
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
      for (const row of r.rows) {
        if (seen.has(row.i)) dup++; seen.add(row.i);
        if (!row.pub) v.push("발행불가 i=" + row.i);
        if (row.lock) v.push("락 위반 i=" + row.i);
        /* 신설 ① 접촉 금지 단계 등재 — 종전 4종(>7·중복·발행불가·락)은 D1이 한 장 섞여도 PASS였다 */
        if (row.stage === "D1") v.push("접촉 금지 단계 등재 i=" + row.i);
      }
      if (dup) v.push("중복 " + dup);
      /* 신설 ② 쿼터 정합 — 배정한 「되돌릴 수 없는 창」 쿼터가 실제로 명단에 올랐는가.
         이것이 만기 D-7·당일(T5·T6)이 D2 쿼터에 밀려 사라지는 것을 숫자로 적발하는 자리다
         (run_cycle_regression은 T 경계·세그먼트만 보고 로스터 등재를 전혀 보지 않는다) */
      const nD2 = r.rows.filter(row => row.stage === "D2").length;
      const nD2Open = r.rows.filter(row => row.stage === "D2" && row.gleft != null).length;
      const nMat = r.rows.filter(row => ["T5", "T6"].indexOf(row.cycle) >= 0).length;
      const nH = r.rows.filter(row => row.grade === "H").length;
      /* ⚠️ 기대값은 **쿼터 산출이 아니라 후보 수**다(적대적 리뷰 실증 2026-10-06 수선).
         종전 유일한 D2 검사는 `nD2 < r.counts.d2Quota`였고 d2Quota는 같은 쿼터 코드의 산출(d2q.length)이라
         쿼터를 통째로 지우면 0이 되어 `nD2 >= 0`으로 **영구 무해통과**였다(실증: HM_ROSTER_WINDOW.d2=0으로
         두고 돌려도 PASS · 전국 로스터 D2 2,116 → 360). 만기 쪽은 `matCand > 0 && nMat === 0`이라는
         쿼터 독립 기준이 있어 같은 애블레이션에서 69건 FAIL로 잡혔다 — 같은 모양으로 쓴다. */
      if (nD2 < (r.counts.d2Quota || 0)) v.push("D2 쿼터 미반영 " + nD2 + "<" + r.counts.d2Quota);
      if (nMat < (r.counts.matQuota || 0)) v.push("만기 쿼터 미반영 " + nMat + "<" + r.counts.matQuota);
      if ((r.counts.matCand || 0) > 0 && nMat === 0) v.push("만기 T5·T6 후보 " + r.counts.matCand + "명인데 등재 0건");
      /* 신설 ③ D2 우선 — 창이 열린 D2 후보가 있는데 한 명도 안 올랐으면 쿼터가 작동하지 않는다 */
      if ((r.counts.d2OpenCand || 0) > 0 && nD2Open === 0) v.push("창 열린 D2 후보 " + r.counts.d2OpenCand + "명인데 등재 0건");
      /* 신설 ④ 등급 '-' D2 면제 — 면제를 되돌리면 dashD2가 0이 되고 '-' D2가 후보에서 사라진다.
         후보에 '-' D2가 있는데 counts.dashD2가 0이면 면제 분기가 없어진 것이다 */
      if ((r.counts.dashD2 || 0) === 0 && r.rows.some(row => row.grade === "-" && row.stage === "D2"))
        v.push("등급 '-' D2가 명단에 있는데 면제 카운터 0 — 면제 분기 소실 의심");
      /* 신설 ⑤ 정체 축 — 로스터 훅이 돌려주는 stalled가 없으면 정렬·점수가 프록시로 되돌아간 것이다 */
      if (r.rows.length && r.rows.every(row => row.stalled === undefined)) v.push("stalled 필드 없음 — 정체 축이 프록시로 되돌아갔는지 확인");
      /* 신설 ⑥ **양성** 단언 — 단계 필터가 실제로 걸렀는가(적대적 리뷰 실증 2026-10-06 수선).
         종전 D1 검사는 「명단에 D1이 있으면 위반」이라 음성 단언이고, _drScore의 W→0 이중 가드 때문에
         필터를 통째로 지워도 648 프로 중 2명만 수면에 올라왔다(「안 보이는 것」과 「걸러진 것」이
         구분되지 않았다). D1은 코호트의 65.5%라 관할이 있는 프로면 제외 건수가 0일 수 없다. */
      if ((r.counts.managed || 0) >= 20 && (r.counts.preResult || 0) === 0) v.push("접촉 금지 단계 제외 0건(관할 " + r.counts.managed + "명) — 단계 필터 소실 의심");
      const g = {}; r.rows.forEach(row => g[row.grade] = (g[row.grade] || 0) + 1);
      const st = {}, cy = {}; const left = { "24h이내": 0, "48h이내": 0, "창닫힘": 0, "창밖": 0 };
      r.rows.forEach(row => {
        st[row.stage] = (st[row.stage] || 0) + 1; cy[row.cycle || "PRE"] = (cy[row.cycle || "PRE"] || 0) + 1;
        if (row.stage === "D2") left[row.cycle !== "T2" ? "창밖" : row.gleft == null ? "창닫힘" : row.gleft <= 24 ? "24h이내" : "48h이내"]++;
      });
      out.push({ code: c.code, sabun: c.sabun, name: c.name, sido: c.sido, branch: c.branch, n: r.rows.length, managed: r.counts.managed,
        g, st, cy, left, d2Quota: r.counts.d2Quota || 0, matQuota: r.counts.matQuota || 0,
        hCand: r.counts.hCand || 0, hSeated: nH, d2OpenCand: r.counts.d2OpenCand || 0, d2OpenSeated: nD2Open,
        dashD2: r.counts.dashD2 || 0, slaLess: r.rows.filter(row => !row.sla || row.sla === "-").length,
        win: r.counts.win || null, viol: v });
    }
    return out;
  }, proCodes.slice(i, i + PCH), DATE);
  for (const r of part) {
    rc.checked++;
    if (r.viol && r.viol.length) rc.viol.push(r);
    else {
      rc.sum += r.n; rc.max = Math.max(rc.max, r.n); if (r.n === 0) rc.zero++;
      for (const k in r.g) rc.byGrade[k] = (rc.byGrade[k] || 0) + r.g[k];
      /* 관측 항목(게이트 아님 — 리포트 1줄 경고). 이번 커밋에 새 FAIL 경로를 섞지 않는다 */
      for (const k in (r.st || {})) rc.byStage[k] = (rc.byStage[k] || 0) + r.st[k];
      for (const k in (r.cy || {})) rc.byCycle[k] = (rc.byCycle[k] || 0) + r.cy[k];
      for (const k in (r.left || {})) rc.d2Left[k] = (rc.d2Left[k] || 0) + r.left[k];
      rc.d2Quota += r.d2Quota || 0; rc.matQuota += r.matQuota || 0;
      rc.hCand += r.hCand || 0; rc.hSeated += r.hSeated || 0; rc.hUnseated += Math.max(0, (r.hCand || 0) - (r.hSeated || 0));
      rc.d2OpenCand += r.d2OpenCand || 0; rc.d2OpenSeated += r.d2OpenSeated || 0;
      rc.dashD2 += r.dashD2 || 0; rc.slaLess += r.slaLess || 0;
      if (!rc.win && r.win) rc.win = r.win;
      if (r.managed > 0 && r.n < 5) rc.under++;
    }
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
/* 관측 1줄(경고) — 게이트로 올리지 않는다. 쿼터가 실제로 무엇을 명단에 올렸는지가 보여야 한다 */
console.log(`[쿼터  ] D2 ${rc.d2Quota}칸(상수 ${rc.win ? rc.win.d2 : "?"}) · 만기 T5·T6 ${rc.matQuota}칸(상수 ${rc.win ? rc.win.mat : "?"}) · 5건 미달 프로 ${rc.under}명 · D2 골든타임 잔여 ${JSON.stringify(rc.d2Left)}`);
console.log(`[D2창  ] 창 열린 D2 후보 ${rc.d2OpenCand} → 등재 ${rc.d2OpenSeated} · 등급 '-' D2 면제 ${rc.dashD2}명 · 시한 없는 로스터 칸 ${rc.slaLess}`);
/* 「D2 우선」의 가격 — 형이 쿼터를 승인·조정할 근거. 게이트가 아니라 관측 1줄이다(임계는 형 판단) */
console.log(`[H밀림 ] H 후보 ${rc.hCand} · 로스터 등재 ${rc.hSeated} · **명단 밖 H 고위험 ${rc.hUnseated}명**(H는 48시간 시한 등급 — 쿼터 ${rc.win ? rc.win.d2 + "+" + rc.win.mat : "?"}칸이 상한 ${rc.max}건 안에서 먼저 앉은 결과)`);
/* ── 전국 게이트(신설) — 지시 ①의 뒷절(D2는 등급과 무관하게 포함)과 ⑤(D2 우선)를 지키는 자리 ──
   ⚠️ 쿼터 상수를 기대값으로 쓰지 않는다 — d2:0 애블레이션에서 '-' 802건이 통째로 사라지는 것을
      잡으려면 「0보다 큰가」를 전국에서 단언해야 한다(프로별로는 0이 정당할 수 있다). */
const natGate = [];
if (!(rc.byGrade["-"] > 0)) natGate.push(`로스터 등급 '-' 0건 — 등급 무관 D2 포함(지시 ①)이 꺼졌다`);
if (!(rc.byStage.D2 > 0)) natGate.push(`로스터 단계 D2 0건 — D2 우선 쿼터(지시 ④)가 꺼졌다`);
if (rc.byStage.D1) natGate.push(`로스터 단계 D1 ${rc.byStage.D1}건 — 접촉 금지 단계가 명단에 올랐다(지시 ①)`);
if (rc.d2OpenCand > 0 && rc.d2OpenSeated === 0) natGate.push(`창 열린 D2 후보 ${rc.d2OpenCand}명인데 전국 등재 0건`);
if (natGate.length) console.error(`[게이트] 전국 불변식 위반 — ${natGate.join(" · ")}`);
console.log(`[단계  ] 로스터 단계 분포 ${JSON.stringify(rc.byStage)}`);
console.log(`[사이클] 로스터 사이클 분포 ${JSON.stringify(rc.byCycle)}`);
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
const pass = agg.cards === agg.pub && rc.viol.length === 0 && agg.n === TOTAL && natGate.length === 0;
console.log(`총 소요 ${secs}s (예산 300s) → ${pass ? "PASS" : "FAIL"}`);
if (!pass) { console.error("unpub 표본:", agg.unpubBad.slice(0, 10), "위반 표본:", JSON.stringify(rc.viol.slice(0, 5))); }

const report = { date: DATE, total: agg.n, cards: agg.cards, publishable: agg.pub, locked: agg.locked,
  byGrade: agg.byGrade, bySido: agg.bySido, byGroup: agg.byGroup,
  pros: rc.checked, prosAll: allPros.length, sabunOk: sabOk,
  rosterViol: rc.viol.length, avgRoster: Number(avg), maxRoster: rc.max, zeroRosterPros: rc.zero,
  byRosterGrade: rc.byGrade,
  /* ⑩관제탑이 라이브 조립과 **같은 숫자**를 말하도록 쿼터·단계·사이클 분포를 함께 싣는다 */
  byRosterStage: rc.byStage, byRosterCycle: rc.byCycle, d2Quota: rc.d2Quota, matQuota: rc.matQuota,
  d2GoldenLeft: rc.d2Left, underTargetPros: rc.under,
  /* 쿼터 상수·「D2 우선」의 가격 — ⑩이 새로 계산하지 않고 여기서 읽는다(§7-⑥) */
  rosterWin: rc.win, hCand: rc.hCand, hSeatedRoster: rc.hSeated, hUnseated: rc.hUnseated,
  d2OpenCand: rc.d2OpenCand, d2OpenSeated: rc.d2OpenSeated, dashD2Exempt: rc.dashD2, slaLessRoster: rc.slaLess,
  natGate: natGate,
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
    byRosterStage: report.byRosterStage, byRosterCycle: report.byRosterCycle,
    d2Quota: report.d2Quota, matQuota: report.matQuota, d2GoldenLeft: report.d2GoldenLeft, underTargetPros: report.underTargetPros,
    rosterWin: report.rosterWin, hCand: report.hCand, hUnseated: report.hUnseated,
    d2OpenCand: report.d2OpenCand, d2OpenSeated: report.d2OpenSeated, dashD2Exempt: report.dashD2Exempt, slaLessRoster: report.slaLessRoster,
    loadAvg: report.loadAvg, loadRatioMax: report.loadRatioMax, loadRatioMin: report.loadRatioMin, loadBySido: report.loadBySido,
    seconds: report.seconds, pass: report.pass }) + ";\n"
  + "const HM_OPS_BRANCHES = " + JSON.stringify(Object.values(rc.byBranch)) + ";\n", "utf8");
writeFileSync(join(ROOT, "fixtures/handoff_roster_sample_v1.json"),
  JSON.stringify({ meta: { v: "1.0", spec: "지시서 v1.3 §5-F", date: DATE, note: "형 검수용 프로 3인분 — 시드=날짜+프로코드 결정론 재현" }, rosters: sampleRosters }, null, 2), "utf8");
console.log("hmOpsSnapshot.js · handoff_batch_report.json · handoff_roster_sample_v1.json 저장");
process.exit(pass ? 0 : 1);
