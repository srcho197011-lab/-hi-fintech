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
  /* 은평구는 실제 검진기관·병원이 있는 지역이라 그 자체로는 누출이 아니다 —
     「내 거주지」라고 주장하는 문맥일 때만 누출로 센다(하네스 오탐 수정). */
  { key: "거주지은평", re: /(거주지|내\s*동네|내\s*주변|우리\s*동네|회원정보)[^\n]{0,24}(은평|불광)/ },
  { key: "검진일2024.12.26", re: /2024\.12\.26/ },
  { key: "리포트등록번호", re: /KRH01778214095470R2083/ },
];

/* 홈의 사례 스토리 — 3인칭 소개라 결함이 아니다(따로 센다).
   판정은 두 가지다: ①인물 서술 표지가 있거나 ②홈 섹션의 긴 산문(과거형 서술)이다.
   ②를 넣은 이유 — 「이 데이터는 이제 조성래 님의 디지털 자산입니다」처럼 띄어쓰기 때문에
   ①을 빠져나가는 문장이 있었다. 화면 라벨은 짧고 산문은 길다는 차이로 가른다. */
const NARRATIVE = /조성래\(\d+\)\s*씨|조\s*씨(는|의|가|에게)|씨의 서랍|민석/;
const isNarrative = (sec, line) => NARRATIVE.test(line) || (sec === "home" && line.length > 55 && /(습니다|했습니다|였습니다)/.test(line));

/* 깊은 화면 경로 — 폭 1단 순회로는 닿지 않는 곳. 코드에서 확인한 실제 탭 라벨이다.
   care › 비대면 원격진료 › (병원/약국예약의) AI 추천 병원 = HospitalRec — 여기가 오래 비어 있었다. */
const DEEP_ROUTES = {
  care: [
    ["비대면 원격진료", "병원·추가검진 찾기", "AI 추천 병원"],   // HospitalRec — 3단 안쪽
    ["비대면 원격진료", "병원·추가검진 찾기", "병원·의원 검색"],
    ["비대면 원격진료", "병원·추가검진 찾기", "약국 찾기"],
  ],
};

const SECTIONS = [
  /* 홈 섹션에는 커뮤니티·사회적기업 탭이 들어 있다 — 여기를 안 돌아서 커뮤니티의 누출을
     한 판 놓쳤다(W4에서 발견). 스토리 탭은 3인칭 사례라 NARRATIVE로 걸러진다. */
  { key: "home", label: "HI-Fin Tech란" },
  { key: "checkup", label: "건강검진 예약" },
  { key: "care", label: "검진 후 케어" },
  { key: "insurance", label: "치료비 케어" },
  { key: "mywallet", label: "나의 건강지갑" },
  { key: "partner", label: "제휴·투자 신청" },
  { key: "healthmate", label: "헬스메이트 센터" },
];

/* 채팅에서 「내 리포트」를 물었을 때 남의 리포트가 나오는지 — W2가 되돌아가면 여기서 잡힌다 */
const CHAT_QS = ["내 리포트 요약", "건강분석 해줘", "종합 분석", "내 생체나이 알려줘", "내 의료비 얼마나 나올까", "전체 분석 보여줘"];

/* [게이트 범위] 바뀐 파일이 닿는 섹션만 돌 수 있다 — 환경변수로 좁힌다.
   HIFIN_SECTIONS="care,insurance" 처럼 주면 그 섹션만, 없으면 전 섹션(전수).
   HIFIN_CHAT=0 이면 채팅 경로를 건너뛴다(응답 엔진이 안 바뀐 커밋에서 3분을 아낀다).
   범위를 좁힌 실행은 결과에 반드시 표시한다 — 「통과」가 「전부 봤다」로 읽히면 안 된다. */
const _pick = (process.env.HIFIN_SECTIONS || "").split(",").map(x => x.trim()).filter(Boolean);
const SECTIONS_RUN = _pick.length ? SECTIONS.filter(x => _pick.indexOf(x.key) >= 0) : SECTIONS;
const RUN_CHAT = process.env.HIFIN_CHAT !== "0";
const SCOPED = _pick.length > 0 || !RUN_CHAT;

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
  for (const sec of SECTIONS_RUN) {
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

    /* 화면 텍스트를 훑어 누출을 기록한다 */
    const scan = (txt, label) => {
      for (const L of LEAKS) {
        if (!L.re.test(txt)) continue;
        const bad = txt.split("\n").map(x => x.trim()).filter(x => L.re.test(x));
        for (const line of bad.slice(0, 3)) {
          const isStory = isNarrative(sec.key, line);
          const rec = { who: me, sec: sec.key, tab: label, leak: L.key, line: line.slice(0, 130) };
          (isStory ? narrative : hits).push(rec);
        }
      }
    };
    const clickTab = (t) => p.evaluate((tt) => {
      const el = [...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,.tab,[class*="tab"],button,div')]
        .filter(x => (x.innerText || '').trim() === tt)[0];
      if (el) el.click();
    }, t);
    const tabsNow = () => p.evaluate(() => [...new Set([...document.querySelectorAll('.dtab,.reslink,.ctab,.stab,.tab,[class*="tab"]')]
      .map(x => (x.innerText || '').trim()).filter(s => s && s.length < 22))]);

    scan(await p.evaluate(() => document.body.innerText || ''), "(기본)");
    /* 탭 순회 방식 — 전면 깊이우선 탐색은 조합적으로 폭발해(3단×형제×복귀 클릭) 게이트로 못 쓴다.
       대신 ①폭 1단은 전부 훑고 ②코드에서 확인한 깊은 화면만 경로를 지정해 들어간다.
       ②가 있는 이유: 「케어 › 비대면 원격진료 › AI 추천 병원」처럼 2~3단 안쪽에 있는 화면은
       ①만으로는 한 번도 닿지 못했다(W6에서 발견 — 그동안의 「0건」이 그만큼 과장이었다).
       새로 깊은 화면이 생기면 여기에 경로를 추가해야 한다. */
    let opened = 0;
    for (const t of uniqTabs) {
      await clickTab(t); await sleep(1150);
      opened++;
      scan(await p.evaluate(() => document.body.innerText || ''), t);
    }
    for (const route of (DEEP_ROUTES[sec.key] || [])) {
      let ok = true;
      for (const step of route) { await clickTab(step); await sleep(1000); }
      const txt = await p.evaluate(() => document.body.innerText || '');
      /* 경로를 못 탔으면(마지막 탭 라벨이 화면에 없으면) 도달 실패로 남긴다 — 조용히 통과시키지 않는다 */
      if (txt.indexOf(route[route.length - 1]) < 0) { ok = false; visited.push(`${sec.key}:깊은경로실패(${route.join("›")})`); }
      if (ok) { opened++; scan(txt, route.join("›")); }
    }
    visited.push(`${sec.key}:탭${opened}`);
  }
  /* ── 채팅 경로(H-2 W2) — UI 클릭으로는 도달이 불안정해 훅으로 실제 응답 경로를 두드린다.
     「내 리포트 요약」류는 report.json(조성래 실명 실측 리포트)을 그대로 뿌리던 자리다. ── */
  const chat = !RUN_CHAT ? { skipped: true } : await p.evaluate(async (QS) => {
    const D = window.__hifinDoc; if (!D) return { err: "훅 없음" };
    const flat = (r) => { if (!r) return ""; const ps = []; (r.bubbles || []).forEach(bb => { ps.push(bb.text || ""); if (bb.card) ps.push(JSON.stringify(bb.card)); }); return ps.join(" "); };
    const out = []; for (const q of QS) { const r = await D.ask(q); out.push({ q, said: flat(r).slice(0, 800) }); }
    return { out };
  }, CHAT_QS);
  if (chat.skipped) { visited.push("chat:건너뜀"); }
  else if (chat.err) { visited.push("chat:" + chat.err); }
  else for (const r of chat.out) {
    for (const L of LEAKS) {
      if (L.re.test(r.said)) hits.push({ who: me, sec: "chat", tab: r.q, leak: L.key, line: r.said.replace(/\s+/g, " ").slice(0, 130) });
    }
  }
  if (RUN_CHAT) visited.push(`chat(${CHAT_QS.length}문항)`);

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
if (SCOPED) console.log(`[범위  ] ⚠ 부분 실행 — 섹션 ${SECTIONS_RUN.map(x => x.key).join(",") || "(없음)"}${RUN_CHAT ? " + 채팅" : " · 채팅 건너뜀"} (전수 아님)`);
else console.log(`[범위  ] 전수 — 섹션 ${SECTIONS.length}개 + 채팅`);
console.log(`[누출  ] ${uniq.length}건 (사례 스토리로 제외 ${narrative.length}건)`);
console.log(`[섹션별] ${JSON.stringify(bySec)}`);
uniq.forEach(h => console.log(`  · [${h.sec} › ${h.tab}] {${h.leak}} ${h.line}`));

const secs = ((Date.now() - t0) / 1000).toFixed(1);
writeFileSync(join(ROOT, "scripts/persona_diff_snapshot.json"),
  JSON.stringify({ scoped: SCOPED, sections: SECTIONS_RUN.map(x => x.key), chat: RUN_CHAT, personas: names, visited, leaks: uniq.length, narrativeExcluded: narrative.length, bySection: bySec, items: uniq, secs: Number(secs) }, null, 2) + "\n", "utf8");
console.log(`총 소요 ${secs}s`);
if (uniq.length) { console.log("→ FAIL — 남의 데이터가 회원 화면에 보인다"); process.exit(1); }
console.log("→ PASS");
