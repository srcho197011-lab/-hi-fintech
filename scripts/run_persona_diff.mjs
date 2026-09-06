/* ══════════ 인물 누출 — 「남의 이름·수치가 내 화면에 있는가」 실측 (H-2 빈틈 지도) ══════════
   왜 이 방식인가: 코드에서 하드코딩을 찾는 것은 추정이다. 결정적 증거는 이것이다 —
   **조성래가 아닌 회원으로 로그인해서, 화면에 「조성래」와 그의 검진 수치가 뜨는지 본다.**
   뜨면 그 화면은 남의 데이터를 내 것처럼 보여주고 있다. 반박의 여지가 없다.

   제외: 홈의 스토리(「조성래(54) 씨는…」)는 3인칭 사례 소개라 결함이 아니다 — 별도로 세어 보고만 한다.
   실행: bash build_preview.sh && node scripts/run_persona_diff.mjs
   산출: scripts/persona_diff_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();

const PERSONAS = [{ id: "000042", pw: "hifin002" }, { id: "007777", pw: "hifin002" }];

/* 조성래 본인의 고정 값들 — 다른 회원 화면에 이게 있으면 누출이다 */
const LEAKS = [
  { key: "이름", re: /조성래/ },
  { key: "생체나이52.5", re: /52\.5\s*세/ },
  { key: "간나이54.4", re: /54\.4/ },
  { key: "췌장56.2", re: /56\.2/ },
  { key: "실제나이54.1", re: /54\.1\s*세/ },
  { key: "의료비238만", re: /2,381,477|238만/ },
  { key: "거주지은평", re: /은평구|불광동/ },
  { key: "검진일2024.12.26", re: /2024\.12\.26/ },
  { key: "리포트등록번호", re: /KRH01778214095470R2083/ },
];

/* 홈의 사례 스토리 — 3인칭 소개라 결함이 아니다(따로 센다) */
const NARRATIVE = /조성래\(\d+\)\s*씨|조\s*씨(는|의|가|에게)|씨의 서랍|민석/;

const SECTIONS = [
  { key: "checkup", label: "건강검진 예약" },
  { key: "care", label: "검진 후 케어" },
  { key: "insurance", label: "치료비 케어" },
  { key: "mywallet", label: "나의 건강지갑" },
  { key: "partner", label: "제휴·투자 신청" },
  { key: "healthmate", label: "헬스메이트 센터" },
];

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 430, height: 1400 } });

const hits = [];         // 누출
const narrative = [];    // 사례 스토리(정상)
const visited = [];
const names = [];

for (const per of PERSONAS) {
  const p = await b.newPage();
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
  names.push(`${per.id}=${me}`);
  if (me === "조성래") { console.log(`  ⚠ ${per.id}가 조성래로 로그인됨 — 검사 불가`); await p.close(); continue; }

  /* 섹션을 돌면서, 각 섹션의 탭도 눌러 본다(누출은 대개 탭 안쪽에 있다) */
  for (const sec of SECTIONS) {
    const moved = await p.evaluate((lab) => {
      const rx = new RegExp(lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const t = [...document.querySelectorAll('button,div,span,a,li')]
        .filter(x => rx.test((x.innerText || '').trim()) && (x.innerText || '').trim().length < lab.length + 8)
        .sort((a, c) => (a.innerText || '').length - (c.innerText || '').length)[0];
      if (t) { t.click(); return true; } return false;
    }, sec.label);
    await sleep(2000);
    if (!moved) { visited.push(`${sec.key}:이동실패`); continue; }

    /* 이 섹션의 탭 라벨을 모아 하나씩 눌러 본다 */
    const tabs = await p.evaluate(() => [...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,.tab,[class*="tab"]')]
      .map(x => (x.innerText || '').trim()).filter(s => s && s.length < 22));
    const uniqTabs = [...new Set(tabs)].slice(0, 14);
    visited.push(`${sec.key}(탭${uniqTabs.length})`);

    for (const tb of ["", ...uniqTabs]) {
      if (tb) {
        await p.evaluate((t) => {
          const el = [...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,.tab,[class*="tab"],button,div')]
            .filter(x => (x.innerText || '').trim() === t)[0];
          if (el) el.click();
        }, tb);
        await sleep(1400);
      }
      const txt = await p.evaluate(() => document.body.innerText || '');
      for (const L of LEAKS) {
        if (!L.re.test(txt)) continue;
        /* 어느 줄에서 걸렸는지 남긴다 */
        const bad = txt.split("\n").map(s => s.trim()).filter(s => L.re.test(s));
        for (const line of bad.slice(0, 3)) {
          const isStory = NARRATIVE.test(line);
          const rec = { who: me, sec: sec.key, tab: tb || "(기본)", leak: L.key, line: line.slice(0, 130) };
          (isStory ? narrative : hits).push(rec);
        }
      }
    }
  }
  await p.close();
}
await b.close();

/* 같은 곳이 회원마다 두 번 잡히므로 정리 */
const key = h => `${h.sec}|${h.tab}|${h.leak}|${h.line}`;
const uniq = []; const seen = new Set();
for (const h of hits) { if (seen.has(key(h))) continue; seen.add(key(h)); uniq.push(h); }

const bySec = {}; uniq.forEach(h => { bySec[h.sec] = (bySec[h.sec] || 0) + 1; });

console.log(`[인물  ] ${names.join(" · ")}`);
console.log(`[순회  ] ${visited.join(" · ")}`);
console.log(`[누출  ] ${uniq.length}건 (사례 스토리로 제외 ${narrative.length}건)`);
console.log(`[섹션별] ${JSON.stringify(bySec)}`);
uniq.forEach(h => console.log(`  · [${h.sec} › ${h.tab}] {${h.leak}} ${h.line}`));

const secs = ((Date.now() - t0) / 1000).toFixed(1);
writeFileSync(join(ROOT, "scripts/persona_diff_snapshot.json"),
  JSON.stringify({ personas: names, visited, leaks: uniq.length, narrativeExcluded: narrative.length, bySection: bySec, items: uniq, secs: Number(secs) }, null, 2) + "\n", "utf8");
console.log(`총 소요 ${secs}s`);
