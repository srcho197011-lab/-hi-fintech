/* ══════════ 내비 전수 회귀 러너 — 설계 프롬프트 v2.1 §7 (P4) ══════════
   코퍼스 전 문항을 __hifinNavTest(직접 호출 · UI 경유 금지)로 채점한다.

   채점 프로파일 2벌(§7-2):
     · ADMIN  — 전 문항. nav 일치 + owner 일치 + 되묻기 아님.
     · MEMBER — 회원 문항 전부 재채점 + 관리자 문항은 「관리자 화면 누출 0」 스캔
                (회원 역할에서 admin 엔티티 착지가 나오면 실패).
   게이트: 정확도 99.5% 미만 또는 관리자 누출 1건이면 exit 1 (커밋 금지 — §7-3).
   실행:
     1) bash build_preview.sh && python -m http.server 5601   (저장소 루트)
     2) node scripts/run_nav_regression.mjs                   (puppeteer-core 필요)
   산출: scripts/nav_regression_snapshot.json (P6 커밋 게이트가 비교하는 스냅샷 — docs/는 .gitignore라 scripts/에 둔다) */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const lines = readFileSync(join(ROOT, "docs/hi_nav10k/nav_corpus_v1.jsonl"), "utf8").trim().split("\n");
const meta = JSON.parse(lines[0]).meta;
const rows = lines.slice(1).map(l => JSON.parse(l));

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1200, height: 800 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

const t0 = Date.now();
const CH = 2000;
async function score(profile) {
  const fails = [];
  const target = profile === "MEMBER" ? rows.filter(r => r.role === "MEMBER") : rows;
  for (let i = 0; i < target.length; i += CH) {
    const part = await p.evaluate((qs, role) => {
      const out = [];
      for (const r of qs) {
        const g = window.__hifinNavTest(r.q, role);
        let ok;
        if (r.route === "nav") ok = !!(g && !g.clarify && g.nav === r.nav && (!g.owner || g.owner === r.owner));
        else ok = (g === null);
        if (!ok) out.push({ q: r.q, route: r.route, exp: r.nav, expOwner: r.owner, got: g && (g.clarify ? "CLARIFY" : g.nav + "/" + g.owner), key: r.key });
      }
      return out;
    }, target.slice(i, i + CH), profile);
    fails.push(...part);
  }
  return { n: target.length, fails };
}
/* 관리자 누출 스캔 — 회원 역할에서 관리자 문항을 던져 admin 엔티티 착지가 나오면 실패 */
async function leakScan() {
  const target = rows.filter(r => r.role === "ADMIN");
  const leaks = [];
  for (let i = 0; i < target.length; i += CH) {
    const part = await p.evaluate((qs) => {
      const out = [];
      for (const r of qs) {
        const g = window.__hifinNavTest(r.q, "MEMBER");
        if (g && !g.clarify && g.adminOnly) out.push({ q: r.q, got: g.nav, key: r.key });
      }
      return out;
    }, target.slice(i, i + CH));
    leaks.push(...part);
  }
  return { n: target.length, leaks };
}

const A = await score("ADMIN");
const M = await score("MEMBER");
const L = await leakScan();
const secs = ((Date.now() - t0) / 1000).toFixed(2);
const accA = ((A.n - A.fails.length) / A.n * 100).toFixed(3);
const accM = ((M.n - M.fails.length) / M.n * 100).toFixed(3);

console.log(`[ADMIN ] ${A.n}문항 · 실패 ${A.fails.length} · 정확도 ${accA}%`);
console.log(`[MEMBER] ${M.n}문항 · 실패 ${M.fails.length} · 정확도 ${accM}%`);
console.log(`[누출   ] 관리자 문항 ${L.n}건 회원 역할 스캔 · 관리자 화면 누출 ${L.leaks.length}건`);
console.log(`총 소요 ${secs}s (예산 300s)`);
[...A.fails.slice(0, 10), ...M.fails.slice(0, 10)].forEach(f => console.log('  ✘', JSON.stringify(f.q), f.route, '기대', f.exp + '/' + f.expOwner, '실제', f.got, f.key));
L.leaks.slice(0, 10).forEach(f => console.log('  🔓 누출', JSON.stringify(f.q), '→', f.got, f.key));

const pass = parseFloat(accA) >= 99.5 && parseFloat(accM) >= 99.5 && L.leaks.length === 0 && parseFloat(secs) <= 300;
writeFileSync(join(ROOT, "scripts/nav_regression_snapshot.json"), JSON.stringify({
  date: new Date().toISOString().slice(0, 10), seed: meta.seed, inventory: meta.inventory,
  total: A.n, accAdmin: +accA, accMember: +accM, leaks: L.leaks.length, seconds: +secs, pass,
}, null, 2) + "\n");
console.log(pass ? "=== 게이트 통과 (스냅샷 갱신) ===" : "⚠ 게이트 미달 — 커밋 금지(§7-3)");
await b.close();
process.exit(pass ? 0 : 1);
