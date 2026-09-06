/* ══════════ 금전 대조 — 「모든 회원이 같은 숫자를 보지 않는가」 (H-2 W5) ══════════
   왜 별도 검사인가: 인물 누출 검사는 「남의 이름」을 찾는다. 지갑·보험 금액은 이름이 아니라
   **전 회원 동일한 상수**여서 그 검사에 걸리지 않았다(토큰 12,480 · 골드 등급 · 예상 보험금 350,000원).
   여기서는 서로 다른 회원을 격리해 로그인시켜 **금액이 실제로 갈리는지** 본다.

   판정 ② 옛 상수값이 여러 회원에게 그대로 보이면 **차단**한다(정확히 판정 가능한 것만 게이트로 쓴다).
        ① 전원 같은 금액인 화면은 **보고만** 한다 — 설명용 예시 칩(「검진 적립 +3,200 · 보험료 −1,200」)이나
          충전 상품처럼 전 회원 같아야 정상인 값이 섞이므로, 자동 판정이 아니라 사람이 볼 목록이다.
   실행: bash build_preview.sh && node scripts/run_money_check.mjs
   산출: scripts/money_check_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const fails = [];

/* 배선 전 상수 — 이 값이 여러 회원에게 똑같이 보이면 되돌아간 것이다 */
const OLD_CONSTS = [
  { key: "토큰 12,480", re: /\b12,480\b/ },
  { key: "적립금 3,744", re: /\b3,744\b/ },
  { key: "예상보험금 350,000", re: /350,000원/ },
  { key: "자기부담 20,000", re: /약\s*20,000원/ },
  { key: "나눔 138,600", re: /138,600/ },
  { key: "통원 25만·입원 5천만", re: /통원 회당 25만/ },
];

const PERSONAS = [{ id: "000042", pw: "hifin002" }, { id: "007777", pw: "hifin002" }, { id: "051234", pw: "hifin002" }];
const SECTIONS = [
  { key: "mywallet", label: "나의 건강지갑" },
  { key: "insurance", label: "치료비 케어" },
];

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 430, height: 1400 } });

const seen = [];   // [{who, sec, tab, numbers:[], text}]
for (const per of PERSONAS) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(([id, pw]) => {
    const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    S(document.querySelector('input[name="hifin-login-id"]'), id);
    S(document.querySelector('input[name="hifin-login-pw"]'), pw);
    [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click();
  }, [per.id, per.pw]);
  await sleep(4500);
  const me = await p.evaluate(() => { const m = (document.body.innerText || '').match(/([가-힣]{2,4})님/); return m ? m[1] : "?"; });

  for (const sec of SECTIONS) {
    const moved = await p.evaluate((lab) => {
      const rx = new RegExp(lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const t = [...document.querySelectorAll('button,div,span,a,li')]
        .filter(x => rx.test((x.innerText || '').trim()) && (x.innerText || '').trim().length < lab.length + 8)
        .sort((a, c) => (a.innerText || '').length - (c.innerText || '').length)[0];
      if (t) { t.click(); return true; } return false;
    }, sec.label);
    await sleep(2000);
    if (!moved) continue;
    const tabs = await p.evaluate(() => [...new Set([...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,[class*="tab"]')].map(x => (x.innerText || '').trim()).filter(s => s && s.length < 20))].slice(0, 10));
    for (const tb of ["", ...tabs]) {
      if (tb) { await p.evaluate((t) => { const el = [...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,[class*="tab"],button,div')].filter(x => (x.innerText || '').trim() === t)[0]; if (el) el.click(); }, tb); await sleep(1200); }
      const txt = await p.evaluate(() => document.body.innerText || '');
      /* 금액·수량으로 읽히는 숫자만 모은다 */
      /* 충전 상품(100·300·500 HTK)이나 요금표처럼 전 회원 공통이어야 하는 값은 제외한다 —
         「회원별로 달라야 하는 금액」만 대조 대상이다. */
      const COMMON_OK = /^(100|300|500|1,000|3,000|5,000|10,000)\s*HTK$/;
      const nums = [...new Set((txt.match(/[\d,]{3,}\s*(HTK|원)/g) || []).map(x => x.trim()))].filter(x => !COMMON_OK.test(x));
      seen.push({ who: me, sec: sec.key, tab: tb || "(기본)", nums, txt });
    }
  }
  await p.close(); await ctx.close();
}
await b.close();

/* ── ② 옛 상수 잔존 ── */
for (const c of OLD_CONSTS) {
  const hit = seen.filter(s => c.re.test(s.txt));
  const whos = [...new Set(hit.map(h => h.who))];
  if (whos.length >= 2) {
    const where = [...new Set(hit.map(h => `${h.sec}›${h.tab}`))].slice(0, 4).join(", ");
    const line = (hit[0].txt.split(/\n/).map(x => x.trim()).find(x => c.re.test(x)) || "").slice(0, 90);
    fails.push({ chk: "②상수", why: `「${c.key}」가 ${whos.length}명(${whos.join(",")})에게 똑같이 보인다 — ${where} · 「${line}」` });
  }
}

/* ── ① 화면별로 금액이 회원마다 갈리는가 ── */
const byScreen = {};
seen.forEach(s => { const k = `${s.sec}›${s.tab}`; (byScreen[k] = byScreen[k] || {})[s.who] = s.nums.join("|"); });
const uniform = [];
for (const k in byScreen) {
  const vals = Object.values(byScreen[k]).filter(v => v);
  if (vals.length < PERSONAS.length) continue;
  if (new Set(vals).size === 1 && vals[0].length > 6) uniform.push({ screen: k, value: vals[0].slice(0, 90) });
}

console.log(`[대조  ] 회원 ${PERSONAS.length}명 · 화면 ${Object.keys(byScreen).length}개`);
Object.keys(byScreen).slice(0, 8).forEach(k => {
  const v = byScreen[k]; const who = Object.keys(v);
  console.log(`  ${k}`);
  who.forEach(w => console.log(`     ${w}: ${(v[w] || "(금액 없음)").slice(0, 76)}`));
});
console.log(`[동일  ] 전원 같은 금액인 화면 ${uniform.length}개 (참고 — 설명용 예시일 수 있음, 차단하지 않음)`);
uniform.forEach(u => console.log(`  · ${u.screen} → ${u.value}`));
console.log(`[옛상수] 잔존 ${fails.filter(f => f.chk === "②상수").length}건`);

const secs = ((Date.now() - t0) / 1000).toFixed(1);
writeFileSync(join(ROOT, "scripts/money_check_snapshot.json"),
  JSON.stringify({ personas: PERSONAS.map(p => p.id), screens: Object.keys(byScreen).length, byScreen, uniform, fails: fails.length, secs: Number(secs) }, null, 2) + "\n", "utf8");

if (fails.length) {
  console.log(`\n총 ${fails.length}건 위반 → FAIL`);
  fails.forEach(f => console.log(`  · [${f.chk}] ${f.why}`));
  process.exit(1);
}
console.log(`총 소요 ${secs}s → PASS`);
