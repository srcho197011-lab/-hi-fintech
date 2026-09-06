/* ══════════ 진실성 가드 — 「실행기 없는 확언」 회귀 (하이 초고도화 H-1) ══════════
   왜 있는가: 하이가 틀리게 답한 두 건은 모두 같은 결함이었다 —
   **조회할 도구가 없는데 결과를 단정**했다(예약 변경 규정·국가검진 대상 여부).
   이 하네스는 그 결함이 되돌아오는 것을 막는다(§0-H6: 실행기 없는 확언 금지).

   검사 ① 정적 — 응답 원천 파일에 확언 패턴이 되살아났는가
        ② 예약 변경·취소 — 「3일 전까지 자유롭게」류 단정 0건 · 기관 확인 안내 포함
        ③ A3→A1 인계 — 섭취 시기·상호작용 질의가 비교표로 새지 않는가
        ④ 금고 fail-closed — source 없는 저장이 「upload」로 둔갑하지 않는가
        ⑤ 국가검진 — 대상 여부 단정 0건 · 하드코딩 이름 0건
   실행: bash build_preview.sh && node scripts/run_truth_guard.mjs
   산출: scripts/truth_guard_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const fails = [];

/* ── ① 정적 스캔 ─────────────────────────────────────────────
   응답 문안이 사는 파일들. 여기에 확언이 되살아나면 번들을 켜기 전에 잡는다. */
const SRC = ["src/data/hiNluDict.js", "src/data/aiQnaBank.js", "src/data/hiStateModel.js",
             "src/components/Checkup.jsx", "src/data/hiProAgent.js", "src/data/toolRun.js"];
const BANNED = [
  { re: /3일\s*전까지[^"'`]{0,20}(자유롭게|바꿀\s*수\s*있|변경돼|변경할)/, why: "예약 변경 마감을 앱이 조회 없이 단정" },
  { re: /(국가건강검진|검진)\s*대상자입니다/, why: "공단 조회 없이 대상 확정" },
  { re: /올해\s*검진\s*대상<\/b>입니다/, why: "공단 조회 없이 대상 확정(마크업)" },
  { re: /조성래님은[^"'`]{0,30}(대상|입니다)/, why: "회원 이름 하드코딩 판정문" },
  { re: /올해\s*대상:\s*위암/, why: "암검진 대상 항목을 조회 없이 열거" },
];
for (const f of SRC) {
  let txt = ""; try { txt = readFileSync(join(ROOT, f), "utf8"); } catch (e) { continue; }
  txt.split("\n").forEach((ln, i) => {
    for (const b of BANNED) if (b.re.test(ln)) fails.push({ chk: "①정적", file: f, line: i + 1, why: b.why });
  });
}
console.log(`[정적  ] 원천 ${SRC.length}파일 · 금지 패턴 ${BANNED.length}종 · 위반 ${fails.length}건`);

/* ── 번들 부팅 ── */
const login = async (p) => {
  await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1');
    [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
  await sleep(4200);
};

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1200, height: 800 } });
const p = await b.newPage();
await login(p);

const res = await p.evaluate(() => {
  const out = { bad: [], booking: { n: 0, ok: 0, sample: null }, a3: { n: 0, handback: 0, leaked: [] }, vault: {}, natl: {} };
  const say = (r) => [].concat(r && r.lines || [], r && r.ans || [], r && r.text || []).join(" ");

  /* ── ② 예약 변경·취소 — 조회 도구가 없으므로 규정을 단정하면 안 된다 ── */
  const BQ = ["검진 예약 취소하고 싶어요", "예약 변경 어떻게 해요?", "검진 예약 바꿀 수 있나요",
    "예약 취소는 언제까지 돼요?", "검진 날짜 옮기고 싶은데", "예약한 거 취소해 주세요",
    "검진 예약 변경", "예약 취소 방법", "검진 예약 미루고 싶어요", "예약 날짜 변경 가능해요?"];
  for (const q of BQ) {
    out.booking.n++;
    let said = "";
    try { const r = window.__hifinHiNlu.respond(q); said += " " + say(r) + " " + JSON.stringify(r || {}); } catch (e) {}
    try { const r = window.__hifinAgent(q); said += " " + say(r) + " " + JSON.stringify(r || {}); } catch (e) {}
    /* 확언이 남았는가 */
    if (/3일\s*전까지/.test(said) && /자유롭게|바꿀\s*수\s*있|변경돼/.test(said)) out.bad.push({ chk: "②예약", q, why: "「3일 전까지 자유롭게」 단정 잔존" });
    /* 대안 경로를 실제로 주는가(막다른 답이면 안 된다) */
    if (/(기관|공단|센터|연락|전화|문의)/.test(said)) out.booking.ok++;
    else out.bad.push({ chk: "②예약", q, why: "확인 경로를 주지 않음" });
    if (!out.booking.sample) out.booking.sample = said.slice(0, 220);
  }

  /* ── ③ A3→A1 인계 — 섭취 시기·상호작용은 비교표의 일이 아니다 ── */
  const AQ = ["오메가3 언제 먹어요?", "루테인 공복에 먹어도 되나요", "유산균 식후에 먹나요",
    "밀크씨슬 아침에 먹는 게 나아요?", "비타민D 자기 전 먹어도 돼요", "오메가3 복용 시간 알려줘",
    "임신 중에 유산균 먹어도 되나요", "수유 중 비타민 먹어도 될까요", "영양제 먹는 시간이 중요해요?",
    "루테인 식전에 먹어요 식후에 먹어요"];
  for (const q of AQ) {
    out.a3.n++;
    let r = null; try { r = window.__hifinA3.answer(q, {}); } catch (e) {}
    if (r && r.handback && r.handback.to === "A1") out.a3.handback++;
    else { out.a3.leaked.push(q); out.bad.push({ chk: "③A3", q, why: "A1 인계 없이 A3가 응답(비교표 누출)" }); }
  }

  /* ── ④ 금고 fail-closed — source 없이 저장하면 「upload」로 둔갑하던 결함 ── */
  const V = window.__hifinVault;
  const mem = { id: "TRUTHGUARD", name: "가드검사" };
  const items = [{ key: "bmi", value: "24.1", source: "test", confidence: 0.9 }];
  out.vault.noMeta = V ? (V.saveCheckup(mem, items, {}) || {}).ok : "훅없음";
  out.vault.nullMeta = V ? (V.saveCheckup(mem, items, null) || {}).ok : "훅없음";
  out.vault.noMetaIns = V ? (V.saveInsurance(mem, [], {}) || {}).ok : "훅없음";
  out.vault.withSrc = V ? (V.saveCheckup(mem, items, { source: "upload", channel: "upload" }) || {}).ok : "훅없음";
  if (out.vault.noMeta !== false) out.bad.push({ chk: "④금고", why: "source 없는 검진 저장이 통과" });
  if (out.vault.nullMeta !== false) out.bad.push({ chk: "④금고", why: "meta=null 검진 저장이 통과" });
  if (out.vault.noMetaIns !== false) out.bad.push({ chk: "④금고", why: "source 없는 보험 저장이 통과" });
  if (out.vault.withSrc !== true) out.bad.push({ chk: "④금고", why: "정상 저장이 막힘(과차단)" });

  return out;
});

/* ⑤는 번들 소스 문자열을 페이지 밖에서 검사한다(죽은 코드라 렌더되지 않으므로) */
const bundle = readFileSync(join(ROOT, "preview.html"), "utf8");
const natlBad = [];
if (/국가건강검진 대상자입니다/.test(bundle)) natlBad.push("대상자 확정 토스트");
if (/올해\s*검진\s*대상<\/b>입니다|조성래님은 <b/.test(bundle)) natlBad.push("대상 확정 문안");
if (/올해\s*대상:\s*위암/.test(bundle)) natlBad.push("암검진 대상 열거");
natlBad.forEach(w => fails.push({ chk: "⑤국가검진", why: w }));

fails.push(...res.bad);
console.log(`[예약  ] ${res.booking.n}문항 · 확인 경로 제시 ${res.booking.ok} · 단정 잔존 ${res.bad.filter(x => x.chk === "②예약" && /단정/.test(x.why)).length}건`);
console.log(`[A3인계] ${res.a3.n}문항 · A1 인계 ${res.a3.handback}${res.a3.leaked.length ? " · 누출: " + res.a3.leaked.join(" / ") : ""}`);
console.log(`[금고  ] meta없음 ${res.vault.noMeta} · meta=null ${res.vault.nullMeta} · 보험 ${res.vault.noMetaIns} · 정상 ${res.vault.withSrc} (앞 셋 false·끝 true여야)`);
console.log(`[국가검진] 번들 스캔 · 위반 ${natlBad.length}건`);
if (res.booking.sample) console.log(`  예약 응답 표본: ${res.booking.sample.replace(/\s+/g, " ").slice(0, 150)}`);

await b.close();

const secs = ((Date.now() - t0) / 1000).toFixed(1);
writeFileSync(join(ROOT, "scripts/truth_guard_snapshot.json"),
  JSON.stringify({ booking: res.booking.n, bookingOk: res.booking.ok, a3: res.a3.n, a3Handback: res.a3.handback, vault: res.vault, natlViolations: natlBad.length, fails: fails.length, secs: Number(secs) }, null, 2) + "\n", "utf8");

if (fails.length) {
  console.log(`\n총 ${fails.length}건 위반 → FAIL`);
  fails.slice(0, 15).forEach(f => console.log(`  · [${f.chk}] ${f.file ? f.file + ":" + f.line + " " : ""}${f.q ? "「" + f.q + "」 " : ""}${f.why}`));
  process.exit(1);
}
console.log(`총 소요 ${secs}s → PASS`);
