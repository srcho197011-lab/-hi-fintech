/* ══════════ 신원 통합 검사 — 「같은 사람인데 저장소가 갈리지 않는가」 (H-2 W1) ══════════
   왜 있는가: 본인 세션에 email이 없어 anonToken이 이름으로 키를 잡았고, selfMember()는 email로
   잡아 같은 사람의 저장소가 둘로 갈렸다. 시드는 한쪽에 쓰이고 화면은 다른 쪽을 읽었다.

   검사 ① 두 해석기(authCurrent · selfMember)가 같은 토큰을 만드는가
        ② 로그인 후 금고가 실제로 읽히는가(검진 기록 > 0)
        ③ 이름 토큰에 남은 잔여물이 없는가(이관 완료)
        ④ 회원(코호트)은 각자 다른 토큰인가 — 통합이 과해져 섞이면 더 큰 사고다
   실행: bash build_preview.sh && node scripts/run_identity_check.mjs
   산출: scripts/identity_check_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const fails = [];

/* 앱과 동일한 토큰 계산(anonToken = "pt-" + sha256("hifin-pseudonym|"+id).slice(0,20)) */
const tok = (id) => "pt-" + createHash("sha256").update("hifin-pseudonym|" + id, "utf8").digest("hex").slice(0, 20);
const SELF_EMAIL = "srcho197011@hizenhealth.com";
const NAME_TOK = tok("조성래"), EMAIL_TOK = tok(SELF_EMAIL);

const login = async (p, id, pw) => {
  await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(([id, pw]) => {
    const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    S(document.querySelector('input[name="hifin-login-id"]'), id);
    S(document.querySelector('input[name="hifin-login-pw"]'), pw);
    [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click();
  }, [id, pw]);
  await sleep(4500);
};
const walk = async (p) => {
  const click = async (re, ml) => await p.evaluate(([s, m]) => {
    const rx = new RegExp(s);
    const t = [...document.querySelectorAll('button,div,span,a,li')].filter(x => rx.test((x.innerText || '').trim()) && (x.innerText || '').trim().length < m)
      .sort((a, c) => (a.innerText || '').length - (c.innerText || '').length)[0];
    if (t) { t.click(); return true; } return false;
  }, [re, ml || 18]);
  for (const [sec, ml] of [["검진 후 케어", 12], ["치료비 케어", 12], ["나의 건강지갑", 14], ["마이페이지", 10]]) { await click(sec, ml); await sleep(1800); }
};
const snap = (p) => p.evaluate(() => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  let sess = null; try { sess = JSON.parse(sessionStorage.getItem("hifin_authed") || "null"); } catch (e) {}
  return { keys: keys.sort(), sess };
});

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 430, height: 1200 } });

/* 회원마다 격리된 컨텍스트를 쓴다 — 같은 브라우저면 localStorage가 쌓여 「누가 쓰는가」를 못 본다 */
const fresh = async () => { const c = await b.createBrowserContext(); return { ctx: c, page: await c.newPage() }; };
const myTok = (p) => p.evaluate(() => { try { return window.__hifinVault ? window.__hifinVault.myToken() : { err: "훅없음" }; } catch (e) { return { err: String(e) }; } });

/* ── 본인 계정 ── */
const c1 = await b.createBrowserContext();
const p1 = await c1.newPage();
await login(p1, '하이', '하이1');
await walk(p1);
const s1 = await snap(p1);
const vaultKey = s1.keys.find(k => k.indexOf("hifin_vault_pt-") === 0);
const selfVault = await p1.evaluate((k) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ? { checkups: (v.checkups || []).length, insurance: (v.insurance || []).length } : null; } catch (e) { return null; } }, vaultKey || "");
const selfTok = await myTok(p1);
await p1.close(); await c1.close();
if (!selfTok || selfTok.err) fails.push({ chk: "①세션", why: `본인 토큰을 못 읽는다: ${JSON.stringify(selfTok)}` });
else if (selfTok.token !== EMAIL_TOK) fails.push({ chk: "①세션", why: `본인이 쓰는 토큰이 email 기준과 다르다: ${selfTok.token}` });

const hasEmail = !!(s1.sess && s1.sess.email);
const emailKeys = s1.keys.filter(k => k.indexOf(EMAIL_TOK) >= 0 || k.indexOf(SELF_EMAIL) >= 0);
const nameKeys = s1.keys.filter(k => k.indexOf(NAME_TOK) >= 0);

if (!hasEmail) fails.push({ chk: "①세션", why: "본인 세션에 email이 없다 — 신원이 다시 갈린다" });
if (s1.sess && s1.sess.email !== SELF_EMAIL) fails.push({ chk: "①세션", why: `세션 email이 예상과 다르다: ${s1.sess.email}` });
if (nameKeys.length) fails.push({ chk: "③잔여", why: `이름 토큰 키가 남아 있다: ${nameKeys.join(", ")}` });
if (!emailKeys.length) fails.push({ chk: "②금고", why: "email 기준 저장 키가 하나도 없다" });
if (!selfVault || !selfVault.checkups) fails.push({ chk: "②금고", why: `본인 금고에서 검진 기록을 못 읽는다(${JSON.stringify(selfVault)})` });

/* ── 코호트 회원 — 통합이 과해져 서로 섞이면 안 된다 ── */
const cohort = [];
for (const [id, pw] of [["000042", "hifin002"], ["007777", "hifin002"]]) {
  const { ctx, page: p2 } = await fresh();
  await login(p2, id, pw);
  await walk(p2);
  const t = await myTok(p2);
  const nm = await p2.evaluate(() => { const m = (document.body.innerText || '').match(/([가-힣]{2,4})님/); return m ? m[1] : "?"; });
  cohort.push({ id, name: nm, token: t && t.token, email: t && t.email });
  if (t && t.token === EMAIL_TOK) fails.push({ chk: "④분리", why: `${nm}(${id})가 본인 금고 토큰을 쓴다 — 회원끼리 섞였다` });
  await p2.close(); await ctx.close();
}
if (cohort.length === 2 && cohort[0].token && cohort[0].token === cohort[1].token)
  fails.push({ chk: "④분리", why: "코호트 두 회원이 같은 토큰을 쓴다" });

await b.close();

console.log(`[세션  ] 본인 authed = ${JSON.stringify(s1.sess)}`);
console.log(`[토큰  ] 이름기준 ${NAME_TOK} · email기준 ${EMAIL_TOK}`);
console.log(`[본인  ] email 키 ${emailKeys.length}개 · 이름 키 ${nameKeys.length}개(0이어야) · 금고 ${JSON.stringify(selfVault)}`);
console.log(`[본인  ] 실제 사용 토큰 ${selfTok && selfTok.token} (email ${selfTok && selfTok.email})`);
cohort.forEach(c => console.log(`[코호트] ${c.name}(${c.id}) 토큰 ${c.token || "(없음)"} · email ${c.email || "-"}`));

const secs = ((Date.now() - t0) / 1000).toFixed(1);
writeFileSync(join(ROOT, "scripts/identity_check_snapshot.json"),
  JSON.stringify({ sess: s1.sess, selfTok, nameTok: NAME_TOK, emailTok: EMAIL_TOK, emailKeys: emailKeys.length, nameKeys: nameKeys.length, selfVault, cohort, fails: fails.length, secs: Number(secs) }, null, 2) + "\n", "utf8");

if (fails.length) {
  console.log(`\n총 ${fails.length}건 위반 → FAIL`);
  fails.forEach(f => console.log(`  · [${f.chk}] ${f.why}`));
  process.exit(1);
}
console.log(`총 소요 ${secs}s → PASS`);
