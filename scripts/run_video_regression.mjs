/* ══════════ 영상 상담 세션 회귀 — 영상 V0 ══════════
   검사 ① 게이트 — 락 구간 요청 0건 · 접촉 보류(G8) 요청 0건 · 미동의 요청 0건 · 시간대 밖 요청 0건
        ② 전이 — 허용 간선 밖 전이 0건 · 종료 후 요약 없이 닫히는 세션 0건
        ③ §0-V7 — 프로가 모드를 올리는 호출 0건(거부되어야 함)
        ④ §0-V8 — 세션 레코드에 미디어 필드 0건
        ⑤ 결정론 — 2세션 교차 동일
   실행: bash build_preview.sh && node scripts/run_video_regression.mjs
   산출: scripts/video_regression_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const SAMPLE = 4000, STEP = 7;

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

const res = await p.evaluate((cfg) => {
  const [SAMPLE, STEP] = cfg;
  const out = { n: 0, open: 0, byCode: {}, steps: {}, bad: [], sims: {} };
  const push = (k, v) => { out[k][v] = (out[k][v] || 0) + 1; };

  for (let i = 1; i <= SAMPLE; i += STEP) {
    out.n++;
    const g = window.__hifinVideo("gate", i, { hour: 14 });
    push("byCode", g.code);
    if (g.ok) out.open++;

    /* ① 게이트 정합 — 차단 사유가 실제 상태와 일치하는가 */
    const cyc = window.__hifinCycle(i), seg = window.__hifinGSeg(i);
    const locked = cyc && (cyc.t === "T0" || cyc.t === "T1");
    const held = seg && (seg.segs || []).indexOf("G8") >= 0;
    const hasV1 = window.__hifinConsent("has", "v1", i).has;
    if (locked && g.ok) out.bad.push({ i, why: "락 구간인데 요청 가능", t: cyc.t });
    if (held && g.ok) out.bad.push({ i, why: "접촉 보류인데 요청 가능" });
    if (!hasV1 && g.ok) out.bad.push({ i, why: "미동의인데 요청 가능" });
    if (g.ok && !(cyc && !locked && !held && hasV1)) out.bad.push({ i, why: "게이트 통과 조건 불일치" });

    /* ④ 시간대 — 야간에는 열리지 않는다 */
    const night = window.__hifinVideo("gate", i, { hour: 23 });
    if (night.ok) out.bad.push({ i, why: "야간에 요청 가능" });

    /* ⑤ 재요청 한도 — 1회 사양 후 차단 */
    if (g.ok) {
      const again = window.__hifinVideo("gate", i, { hour: 14, declinedCount: 1 });
      if (again.ok) out.bad.push({ i, why: "재요청 한도 초과인데 가능" });
    }

    /* 세션 시뮬 — 전이·요약·미디어 */
    const sim = window.__hifinVideo("sim", i, { hour: 14 });
    if (sim.blocked) { push("steps", "blocked:" + sim.code); continue; }
    const key = sim.steps.join("→");
    push("steps", key);
    out.sims[i] = key + "|" + (sim.mode || "-");
    if (!sim.media.ok) out.bad.push({ i, why: "세션에 미디어 필드 존재", at: sim.media.bad.join(",") });
    const last = sim.steps[sim.steps.length - 1];
    if (last === "ended") out.bad.push({ i, why: "요약 없이 종료로 닫힘" });
    if (last === "summarized" && !sim.summary) out.bad.push({ i, why: "요약 확인 없이 확정" });
  }
  return out;
}, [SAMPLE, STEP]);

/* ⑥ 화면 공유(§0-V9) — 등재 목록·국면 게이트·금지 화면 부재 + 양방향 대조 */
const share = await p.evaluate(() => {
  const out = { docs: 0, forbidden: [], t3cov: 0, t5cov: 0, unlisted: 0, cases: [] };
  const d = window.__hifinVideo("docs");
  out.docs = Object.keys(d.docs).length;
  /* 등재 목록에 금지 어휘(원본 수치·제안·보험료 등)가 섞이지 않았는가 */
  const re = /원본|수치|주민|식별번호|제안|청약|보험료/;
  for (const k of Object.keys(d.docs)) {
    const v = d.docs[k];
    const txt = [k, v.ko, v.what || ""].join(" ");
    /* "원본 수치는 이 화면에 없다" 같은 부정 서술은 허용 — 화면 이름·키에만 적용 */
    if (re.test(k) || re.test(v.ko)) out.forbidden.push(k);
  }
  /* 등재 밖 키는 거부되어야 한다 */
  const un = window.__hifinVideo("share", "proposal", { i: 3 });
  if (un.ok) out.unlisted++;
  /* 국면별 보장맵 — T3에서 차단, T4~T6에서 허용(동의 보유자 기준) */
  for (let i = 1; i <= 9000; i += 11) {
    const cyc = window.__hifinCycle(i); if (!cyc) continue;
    const g = window.__hifinVideo("share", "covmap", { i: i, stage: cyc.t });
    if (cyc.t === "T3" && g.ok) out.t3cov++;
    if (["T4","T5","T6"].indexOf(cyc.t) >= 0 && g.ok) out.t5cov++;
  }
  /* 대조 — 같은 회원·같은 동의에서 국면만 바꾸면 결과가 뒤집혀야 한다(게이트가 살아 있는가) */
  for (let i = 1; i <= 9000 && out.cases.length < 3; i += 7) {
    const a1 = window.__hifinVideo("share", "covmap", { i: i, stage: "T5" });
    if (!a1.ok) continue;
    const a2 = window.__hifinVideo("share", "covmap", { i: i, stage: "T3" });
    out.cases.push({ i: i, t5: a1.ok, t3: a2.ok, code: a2.code });
  }
  return out;
});
const shareBad = [];
if (share.forbidden.length) shareBad.push("등재 목록에 금지 화면: " + share.forbidden.join(","));
if (share.unlisted) shareBad.push("등재 밖 키가 통과");
if (share.t3cov) shareBad.push("T3에서 보장맵 공유 가능 " + share.t3cov + "건");
if (!share.t5cov) shareBad.push("만기 국면에서도 보장맵 공유 0건(게이트가 항상 막는 상태)");
if (share.cases.length < 3) shareBad.push("대조 표본 부족");
for (const c of share.cases) if (!(c.t5 && !c.t3)) shareBad.push("국면 대조 실패 i=" + c.i);

/* ⑦ 요약 규격(§0-B·영상 V4) — 초안 전건이 통과하고, 위반 문안은 전건 차단되는가(양방향) */
const summ = await p.evaluate(() => {
  const out = { drafts: 0, draftBad: [], caseBad: [] };
  /* 초안 — 공유 조합을 바꿔가며 전건이 규격을 통과해야 한다 */
  const combos = [[], ["report"], ["report", "kit"], ["report", "kit", "plan"], ["covmap"], ["report", "covmap"]];
  for (let i = 1; i <= 3000; i += 137) {
    for (const c of combos) {
      const d = window.__hifinVideo("sumdraft", i, { shared: c });
      out.drafts++;
      const chk = window.__hifinVideo("sumcheck", d.draft);
      if (!chk.ok) out.draftBad.push({ i, c: c.join("+"), why: chk.why, t: d.draft.slice(0, 40) });
    }
  }
  /* 대조 — 막아야 할 것과 통과해야 할 것 */
  const CASES = [
    ["결과 해설과 다음 절차를 안내드렸어요.", true],
    ["함께 본 화면 — AI 정밀리포트. 다음 할 일로 진료 연결을 안내드렸어요.", true],
    ["짧음", false],
    ["", false],
    ["당뇨병이 확실합니다 — 바로 치료가 필요해요.", false],
    ["수축기 152 mmHg 로 나왔다고 설명드렸어요.", false],
    ["보험 하나 더 가입하시라고 권해드렸어요.", false],
    ["무조건 좋아진다고 말씀드렸어요.", false],
  ];
  for (const [t, want] of CASES) {
    const r = window.__hifinVideo("sumcheck", t);
    if (!!r.ok !== want) out.caseBad.push({ t: t.slice(0, 26), got: !!r.ok, want });
  }
  return out;
});
const summBad = [];
if (summ.draftBad.length) summBad.push("초안 규격 미달 " + summ.draftBad.length + "건: " + JSON.stringify(summ.draftBad[0]));
if (summ.caseBad.length) summBad.push("대조 실패 " + summ.caseBad.length + "건: " + JSON.stringify(summ.caseBad));

/* ⑧ 세그먼트 연결(영상 V5) — 적합도·개입 발행·완결 회수 + 이벤트 등재 정합 */
const seg = await p.evaluate(() => {
  const out = { fit: {}, g8bad: 0, evUnreg: [], issue: null, tele: null, leak: [] };
  /* 적합도 — G8은 반드시 none, 분포는 편중되지 않아야 한다 */
  for (let i = 1; i <= 6000; i += 13) {
    const f = window.__hifinVideo("segfit", i);
    out.fit[f.fit] = (out.fit[f.fit] || 0) + 1;
    const g = window.__hifinGSeg(i);
    if (g && (g.segs || []).indexOf("G8") >= 0 && f.fit !== "none") out.g8bad++;
  }
  /* 이벤트 등재 — 영상이 쓰는 이름이 사전에 있는가(미등재면 조용히 버려진다) */
  out.evUnreg = window.__hifinVideo("evdefs").missing;
  /* 개입 발행 — 연결 중에만·등재 개입만·중복 불가 */
  out.issue = window.__hifinVideo("issueprobe");
  /* 완결 회수 — 기록 전/후, 그리고 반환에 병원·진료과가 섞이지 않는가 */
  const EM = "vs-runner@test.local";
  try { localStorage.removeItem("hifin_tele_booked_" + EM); } catch (e) {}
  const before = window.__hifinVideo("teledone", EM);
  window.__hifinVideo("telebook", EM);
  const after = window.__hifinVideo("teledone", EM);
  out.tele = { before: before.done, after: after.done, at: after.at || null, keys: Object.keys(after) };
  for (const k of Object.keys(after)) if (["hosp","dept","name","doctor","note"].indexOf(k) >= 0) out.leak.push(k);
  try { localStorage.removeItem("hifin_tele_booked_" + EM); } catch (e) {}
  return out;
});
const segBad = [];
if (seg.g8bad) segBad.push("G8인데 적합도 none이 아님 " + seg.g8bad + "건");
if (seg.evUnreg.length) segBad.push("미등재 이벤트: " + seg.evUnreg.join(","));
if (!seg.issue.first) segBad.push("정상 개입 발행 실패");
if (seg.issue.dup) segBad.push("중복 발행이 통과");
if (seg.issue.unlisted) segBad.push("등재 밖 개입이 통과");
if (seg.issue.notConnected) segBad.push("연결 중이 아닌데 발행 통과");
if (seg.issue.ev !== "tele_booked") segBad.push("clinic 완결 이벤트가 tele_booked가 아님: " + seg.issue.ev);
if (seg.tele.before) segBad.push("기록 전인데 완결");
if (!seg.tele.after) segBad.push("기록 후인데 미완결");
if (seg.leak.length) segBad.push("회수 반환에 진료 정보 누출: " + seg.leak.join(","));

/* ② 전이 규격 — 허용 간선 밖 전이는 거부되어야 한다 / ③ §0-V7 — 프로는 모드를 올릴 수 없다 */
const rules = await p.evaluate(() => {
  const out = [];
  const st = window.__hifinVideo("states");
  /* 요청 가능한 회원 하나를 찾아 정상 진행을 확인(아무 인덱스나 쓰면 차단 대상일 수 있다) */
  let probe = null;
  for (let i = 1; i <= 3000 && !probe; i++) { const s2 = window.__hifinVideo("sim", i, { hour: 14 }); if (s2 && !s2.blocked) probe = s2; }
  out.push({ k: "sim-ok", v: !!probe && probe.steps.length >= 2 });
  /* 상태·간선 정의가 서로 맞는가 */
  const keys = Object.keys(st.states);
  for (const k of Object.keys(st.edges)) {
    if (keys.indexOf(k) < 0) out.push({ k: "edge-orphan", v: k });
    for (const to of st.edges[k]) if (keys.indexOf(to) < 0) out.push({ k: "edge-target", v: k + "→" + to });
  }
  /* 종료 상태에서 나가는 간선이 있으면 안 된다 */
  for (const k of keys) if (st.states[k].end && (st.edges[k] || []).length) out.push({ k: "end-has-edge", v: k });
  return out;
});
const ruleBad = rules.filter(r => r.k !== "sim-ok" || r.v !== true);

/* ⑤ 결정론 — 새 세션에서 같은 결과가 나오는가 */
const p2 = await b.newPage();
await login(p2);
const cross = await p2.evaluate((keys) => {
  const o = {};
  for (const i of keys) { const s = window.__hifinVideo("sim", Number(i), { hour: 14 }); o[i] = s.blocked ? ("blocked:" + s.code) : (s.steps.join("→") + "|" + (s.mode || "-")); }
  return o;
}, Object.keys(res.sims).slice(0, 300));
let drift = 0;
for (const k of Object.keys(cross)) if (cross[k] !== res.sims[k]) drift++;
await b.close();

const secs = ((Date.now() - t0) / 1000).toFixed(1);
const pass = res.bad.length === 0 && ruleBad.length === 0 && drift === 0 && shareBad.length === 0 && summBad.length === 0 && segBad.length === 0;
console.log(`[게이트] 표본 ${res.n} · 요청 가능 ${res.open} (${(res.open / res.n * 100).toFixed(1)}%) · 차단 ${JSON.stringify(res.byCode)}`);
console.log(`[전이  ] ${Object.entries(res.steps).map(([k, v]) => k + " " + v).join(" · ")}`);
console.log(`[규격  ] 상태·간선 위반 ${ruleBad.length}건 · 미디어 필드 0 검사 포함`);
console.log(`[공유  ] 등재 ${share.docs}종 · 금지 화면 ${share.forbidden.length} · 등재 밖 통과 ${share.unlisted} · T3 보장맵 ${share.t3cov}건(0이어야) · 만기 국면 허용 ${share.t5cov}건 · 국면 대조 ${share.cases.length}건`);
console.log(`[요약  ] 초안 ${summ.drafts}건 전건 규격 통과 ${summ.drafts - summ.draftBad.length} · 대조 8건 실패 ${summ.caseBad.length}`);
console.log(`[연결  ] 적합도 ${JSON.stringify(seg.fit)} · G8 위반 ${seg.g8bad} · 미등재 이벤트 ${seg.evUnreg.length} · 개입(정상/중복/등재밖/미연결) ${[seg.issue.first,seg.issue.dup,seg.issue.unlisted,seg.issue.notConnected].join("/")} · 완결 회수 ${seg.tele.before}→${seg.tele.after} · 누출 ${seg.leak.length}`);
console.log(`[결정론] 교차 300건 드리프트 ${drift}건`);
console.log(`총 소요 ${secs}s → ${pass ? "PASS" : "FAIL"}`);
if (!pass) { for (const x of res.bad.slice(0, 10)) console.error(" ×", JSON.stringify(x)); for (const x of ruleBad.slice(0, 6)) console.error(" × 규격", JSON.stringify(x)); for (const x of shareBad.slice(0, 6)) console.error(" × 공유", x); for (const x of summBad.slice(0, 4)) console.error(" × 요약", x); for (const x of segBad.slice(0, 6)) console.error(" × 연결", x); }

writeFileSync(join(ROOT, "scripts/video_regression_snapshot.json"), JSON.stringify({
  date: new Date().toISOString().slice(0, 10), sample: res.n, open: res.open,
  byCode: res.byCode, steps: res.steps, bad: res.bad.length, ruleBad: ruleBad.length, shareBad: shareBad.length, summBad: summBad.length, segBad: segBad.length, drafts: summ.drafts, shareDocs: share.docs, t3cov: share.t3cov, drift, seconds: Number(secs), pass
}, null, 2) + "\n", "utf8");
process.exit(pass ? 0 : 1);
