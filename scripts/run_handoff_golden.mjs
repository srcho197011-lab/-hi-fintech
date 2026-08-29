/* ══════════ 골든셋 탐색 러너 — 지시서 프롬프트 v1.3 §8-P3 ══════════
   코호트 인덱스를 __hifinCard(직접 호출)로 스캔해 「프로의 아침 5인」 조건에 맞는
   실존 회원을 찾는다 — 조건에 맞춰 데이터를 지어내지 않는다(케이스가 데이터를 고르지,
   데이터가 케이스에 꿰맞춰지지 않는다). 산출: fixtures/handoff_cards_sample_v1.json
   실행: bash build_preview.sh && python -m http.server 5601 → node scripts/run_handoff_golden.mjs */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

/* 5조건 — 형 확정 시나리오(v1.3 §8-P3). male/female 표기는 프로필 원문을 그대로 허용 */
const male = s => /^남|^M/i.test(String(s)); const female = s => /^여|^F/i.test(String(s));
/* 데이터 대조 조정(2026-08-29 실스캔): M·지질과 체격·근골격 주도는 코호트 합성 분포에 실재하지 않음
   (질병 기반 합성이라 지질·bmi 단독 주의가 안 나옴) — 시나리오 취지를 유지한 채 실재 유형으로 치환.
   c2: 지질→신장·혈액·기타(M 단일 재검+코칭 취지 동일) · c4: body 가족특례→고령 쉬운말 변형 검증. */
const CASES = [
  { key: "c1", ko: "H 복합 · 50대 남 · 혈압/혈당 주도", pick: c => c.grade === "H" && (c.group === "bp" || c.group === "sugar") && c.member.ageBand === "50대" && male(c.member.sex) && c.actions.some(a => a.key === "clinic") && c.member.stalledDays < 14 },
  { key: "c2", ko: "M 단일 · 40대 여 · 신장·혈액·기타(재검+코칭)", pick: c => c.grade === "M" && c.group === "organ" && c.member.ageBand === "40대" && female(c.member.sex) && c.member.stalledDays < 14 },
  { key: "c3", ko: "간수치 + 절주 플래그 · 30대 남(습관 우선 특례)", pick: c => c.group === "liver" && male(c.member.sex) && c.member.ageBand === "30대" && c.evidence.some(e => e.indexOf("절주") >= 0) && c.member.stalledDays < 14 },
  { key: "c4", ko: "H · 70대↑ 여 · 쉬운말 변형(고령 대본)", pick: c => c.grade === "H" && female(c.member.sex) && c.script.variant === "쉬운말" && c.member.stalledDays < 14 },
  { key: "c5", ko: "정체 14일+ · 관리 재개", pick: c => c.member.stalledDays >= 14 && c.trigger.indexOf("정체") === 0 },
];
/* 완화 단계 — 1차 스캔에서 비면 조건을 한 겹 풀어 재탐색(완화 사실은 산출물에 기록) */
const RELAX = {
  c3: c => c.group === "liver" && male(c.member.sex) && c.evidence.some(e => e.indexOf("절주") >= 0) && c.member.stalledDays < 14,
};

const t0 = Date.now(); const N = 6000; const CH = 400;
const found = {}; const relaxed = {}; const stats = { scanned: 0, byGrade: {}, unpub: 0 };
for (let i = 0; i < N; i += CH) {
  const part = await p.evaluate((from, to) => {
    const out = [];
    for (let j = from; j < to; j++) { try { const c = window.__hifinCard(j); if (c && !c.error) out.push(c); } catch (e) {} }
    return out;
  }, i, Math.min(i + CH, N));
  for (const c of part) {
    stats.scanned++; stats.byGrade[c.grade] = (stats.byGrade[c.grade] || 0) + 1;
    if (!c.compliance.publishable) { stats.unpub++; continue; }
    for (const cs of CASES) if (!found[cs.key] && cs.pick(c)) found[cs.key] = c;
  }
  if (Object.keys(found).length === 5) break;
}
for (const cs of CASES) {
  if (found[cs.key] || !RELAX[cs.key]) continue;
  for (let i = 0; i < N && !found[cs.key]; i += CH) {
    const part = await p.evaluate((from, to) => { const out = []; for (let j = from; j < to; j++) { try { const c = window.__hifinCard(j); if (c && !c.error) out.push(c); } catch (e) {} } return out; }, i, Math.min(i + CH, N));
    for (const c of part) if (c.compliance.publishable && RELAX[cs.key](c)) { found[cs.key] = c; relaxed[cs.key] = true; break; }
  }
}
await b.close();

const missing = CASES.filter(cs => !found[cs.key]);
console.log(`스캔 ${stats.scanned}명 · 등급 분포 ${JSON.stringify(stats.byGrade)} · 발행불가 ${stats.unpub}`);
for (const cs of CASES) console.log(`${found[cs.key] ? "✅" : "❌"} ${cs.key} ${cs.ko}${relaxed[cs.key] ? " (완화 적용)" : ""}${found[cs.key] ? " → i=" + found[cs.key].member.cohortIndex + " " + found[cs.key].member.mask + " " + found[cs.key].grade + "/" + found[cs.key].groupKo : ""}`);
if (missing.length) { console.error("골든셋 미충족 — 조건 재협의 필요"); process.exit(1); }

mkdirSync(join(ROOT, "fixtures"), { recursive: true });
const doc = { meta: { v: "1.0", spec: "지시서 v1.3 §8-P3", scanned: stats.scanned, relaxed: Object.keys(relaxed), note: "코호트 실스캔 — 케이스가 데이터를 고름(역방향 조작 없음)" },
  cases: CASES.map(cs => ({ key: cs.key, ko: cs.ko, relaxed: !!relaxed[cs.key], card: found[cs.key] })) };
writeFileSync(join(ROOT, "fixtures/handoff_cards_sample_v1.json"), JSON.stringify(doc, null, 2), "utf8");
console.log(`fixtures/handoff_cards_sample_v1.json 저장 · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
