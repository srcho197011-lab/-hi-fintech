/* ══════════ 지시서 스크립트 하네스 러너 — 지시서 프롬프트 v1.3 §S-5·§S-6 (P4) ══════════
   nav10k 러너 패턴 복제(직접 호출 훅 · UI 경유 금지). 검증 5축:
     ① 조립 — 표본 전건 buildHandoffCard 성공(카드 대상은 발행 가능 100% · 부족 블록 0 · 슬롯 잔존 0)
     ② 금지어(§S-5 ⑨) — 39블록 원문 + 조립 대본 전문·분기·채널 스캔 0건
     ③ §0-P 보험 선행 — 사전 전건 차단 대상 0건 + 실효 대조 7건(양성 차단·음성 통과)
     ③ 규격(§S-5 ⑩) — 본대본 ≤20문장 · 문장당 ≤60자(쉬운말 45) · 문자 ≤80자
     ④ 골든셋 회귀 — fixtures/handoff_cards_sample_v1.json과 현 엔진 출력 일치(결정론)
     ⑤ A5 회귀(§S-6) — 카드×질문 코퍼스(결정론 생성) 전수: 유형 분류·정답 원천·블록 사전 밖 문장 0
   게이트: 어느 축이든 실패 시 exit 1(커밋 차단). 산출: scripts/handoff_harness_snapshot.json
   실행: bash build_preview.sh && python -m http.server 5601 → node scripts/run_handoff_harness.mjs */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAMPLE = 3000;          // 조립 표본(0..N) — P5에서 10만 전건으로 확장
const t0 = Date.now();

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

const fails = { assemble: [], forbidden: [], spec: [], golden: [], coach: [] };

/* ── ①②③ 표본 전건 조립 + 대본 스캔(페이지 내부에서 일괄 — 왕복 최소화) ── */
let agg = { n: 0, cards: 0, pub: 0, byGrade: {}, blocksUsed: {}, readSecMax: 0 };
for (let i = 0; i < SAMPLE; i += 500) {
  const part = await p.evaluate((from, to) => {
    const out = { n: 0, cards: 0, pub: 0, byGrade: {}, blocksUsed: {}, readSecMax: 0, bad: [] };
    for (let j = from; j < to; j++) {
      let c; try { c = window.__hifinCard(j); } catch (e) { out.bad.push({ i: j, why: "throw " + String(e).slice(0, 60) }); continue; }
      if (c && c.error) { out.bad.push({ i: j, why: c.error }); continue; }
      if (!c) continue;                                    // 코호트 밖 인덱스(프로필 없음) — 대상 아님
      out.n++;
      out.byGrade[c.grade] = (out.byGrade[c.grade] || 0) + 1;
      if (c.grade === "-") continue;                       // 카드 대상 아님(정기 리듬) — 발행 검증 제외
      out.cards++;
      if (c.compliance.publishable) out.pub++;
      else out.bad.push({ i: j, why: "unpub", detail: { miss: c.compliance.missingBlocks, unappr: c.compliance.unapprovedBlocks, slots: c.compliance.slotsFilled, spec: c.compliance.specOk, forb: (c.compliance.forbiddenHits || []).slice(0, 2) } });
      const s = c.script;
      for (const bl of [s.opening, ...s.core, s.ask, ...s.branches, s.closing].filter(Boolean))
        out.blocksUsed[bl.id] = (out.blocksUsed[bl.id] || 0) + 1;
      if (s.readSec > out.readSecMax) out.readSecMax = s.readSec;
    }
    return out;
  }, i, Math.min(i + 500, SAMPLE));
  agg.n += part.n; agg.cards += part.cards; agg.pub += part.pub;
  for (const k in part.byGrade) agg.byGrade[k] = (agg.byGrade[k] || 0) + part.byGrade[k];
  for (const k in part.blocksUsed) agg.blocksUsed[k] = (agg.blocksUsed[k] || 0) + part.blocksUsed[k];
  agg.readSecMax = Math.max(agg.readSecMax, part.readSecMax);
  fails.assemble.push(...part.bad);
}

/* ── ② 블록 원문 39건 자체 스캔(조립 전 원천 — 사전은 hmScriptGuard 단일 소스) ── */
const blockScanRes = await p.evaluate(() => window.__hifinScriptScan());
const blockScan = (blockScanRes && blockScanRes.bad) || [{ id: "hook", hits: [{ key: "err", ko: String(blockScanRes && blockScanRes.error) }] }];
fails.forbidden.push(...blockScan);

/* ── ③ §0-P 보험 선행 가드 — 사전 전건 + 실효 대조(양성이 잡히고 음성이 통과하는가) ──
   가드는 「걸리지 않는다」만으로는 증명되지 않는다. 규칙을 끈 것과 구분되지 않기 때문이다.
   그래서 잡아야 할 문장과 통과해야 할 문장을 함께 넣어 양방향으로 확인한다. */
const insFirst = await p.evaluate(() => window.__hifinScriptScan("insfirst"));
const insBlocked = (insFirst && insFirst.blocked) || ["hook-error"];
const INS_CASES = [
  ["보장부터 정리해 드리고, 건강 관리는 그다음에 볼게요.", "co-x", "core", true],
  ["좋은 상품이 하나 있는데 먼저 말씀드릴게요.", "ak-x", "ask", true],
  ["특약을 하나 늘리시는 게 좋겠어요. 치료비가 걱정되실 테니까요.", "ck-x", "careplan", true],
  ["이번 결과에서 수축기혈압 위험 구간으로 확인됐어요.", "co-x", "core", false],
  ["치료비가 걱정되시면, 지금 보장을 같이 볼 수 있어요.", "co-x", "core", false],
  ["무료 검진대비보험이 18일 뒤에 끝나요. 오늘 결정하실 건 아무것도 없어요.", "mt-x", "maturity", false],
  ["보장 이야기는 원하실 때, 별도 동의를 받고 나서 해요.", "vd-x", "voluntary", false],
];
const insCaseFail = [];
for (const [t, id, part, want] of INS_CASES) {
  const g = await p.evaluate((a) => window.__hifinScriptScan("insfirst-text", { id: a[1], part: a[2], text: a[0] }), [t, id, part]);
  if (!g || g.blocked !== want) insCaseFail.push(`${want ? "미차단" : "오차단"}: ${t.slice(0, 24)}`);
}

/* ── ④ 골든셋 회귀 — fixture와 현 엔진 출력 일치(카드 핵심 필드 + 대본 전문) ── */
const golden = JSON.parse(readFileSync(join(ROOT, "fixtures/handoff_cards_sample_v1.json"), "utf8"));
for (const cs of golden.cases) {
  const want = cs.card;
  const got = await p.evaluate((i) => window.__hifinCard(i), want.member.cohortIndex);
  const flat = (c) => JSON.stringify({ g: c.grade, why: c.gradeWhy, grp: c.group, trig: c.trigger, ev: c.evidence,
    acts: c.actions.map(a => a.key), op: c.script.opening.id, texts: [c.script.opening, ...c.script.core, c.script.ask, ...c.script.branches, c.script.closing].filter(Boolean).map(b2 => b2.text) });
  if (!got || flat(got) !== flat(want)) fails.golden.push({ key: cs.key, i: want.member.cohortIndex });
}

/* ── ⑤ A5 코퍼스 회귀 — 결정론 생성(카드 × 질문 표현 변형) 전수 ── */
const COACH_QS = [
  { q: "why", asks: ["왜 이 지시예요?", "이 카드 이유가 뭐예요?", "근거가 있어요?"], expect: "field:trigger" },
  { q: "start", asks: ["뭐라고 시작해요?", "첫 마디 알려줘", "오프닝 뭐예요?"], expect: "block:op" },
  { q: "reject", asks: ["거절하면요?", "싫다고 하면 어떻게 해요?", "안 한다고 하면요?"], expect: "block:br-no" },
  { q: "serious", asks: ["심각하냐고 물으면요?", "큰 병이냐고 물어보면?"], expect: "block:br-q-serious" },
  { q: "sms", asks: ["문자로는 뭐라고 보내요?", "문자 내용 알려줘"], expect: "field:sms" },
  { q: "deadline", asks: ["언제까지 해야 해요?", "기한이 언제예요?"], expect: "field:sla" },
  { q: "next", asks: ["다음은 뭐예요?", "그 다음 어떻게 해요?"], expect: "field:actions" },
];
/* 코퍼스 카드 = 골든셋 5 + 표본 균등 40(결정론: 시드 고정 스텝) */
const coachIdx = golden.cases.map(c => c.card.member.cohortIndex);
for (let j = 37; coachIdx.length < 45 && j < SAMPLE; j += 67) coachIdx.push(j);
let coachN = 0, coachOk = 0;
for (const ci of coachIdx) {
  const res = await p.evaluate((i, qs) => {
    const card = window.__hifinCard(i);
    if (!card || card.error || card.grade === "-") return { skip: true };
    const out = [];
    for (const d of qs) for (const ask of d.asks) {
      const r = window.__hifinCoach(i, ask);
      out.push({ q: d.q, ask, got: r && r.qtype, src: r && r.ans && (r.ans.source + ":" + r.ans.id), verified: !!(r && r.verified) });
    }
    return { out };
  }, ci, COACH_QS);
  if (res.skip) continue;
  for (const r of res.out) {
    coachN++;
    const d = COACH_QS.find(x => x.q === r.q);
    const okType = r.got === r.q;
    const okSrc = r.src && (d.expect.indexOf("field:") === 0 ? r.src.indexOf(d.expect) === 0 : r.src.indexOf("block:" + d.expect.split(":")[1]) === 0);
    if (okType && okSrc && r.verified) coachOk++;
    else fails.coach.push({ i: ci, q: r.q, ask: r.ask, got: r.got, src: r.src, verified: r.verified });
  }
}
await b.close();

/* ── 판정·리포트 ── */
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const coachAcc = coachN ? (coachOk / coachN * 100).toFixed(2) : "0";
const pass = fails.assemble.length === 0 && fails.forbidden.length === 0 && fails.spec.length === 0
  && fails.golden.length === 0 && fails.coach.length === 0 && agg.pub === agg.cards
  && insBlocked.length === 0 && insCaseFail.length === 0;
console.log(`[조립  ] 표본 ${agg.n} · 카드 대상 ${agg.cards} · 발행 가능 ${agg.pub} (${agg.cards === agg.pub ? "100%" : "미달"}) · 등급 ${JSON.stringify(agg.byGrade)}`);
console.log(`[금지어] 블록 원문 위반 ${blockScan.length}건 · 조립 대본 위반은 발행 게이트에 포함(위 미달 수치)`);
console.log(`[§0-P  ] 사전 전건 차단 대상 ${insBlocked.length}건 · 실효 대조 ${INS_CASES.length - insCaseFail.length}/${INS_CASES.length}(양성 차단·음성 통과)`);
console.log(`[골든셋] ${golden.cases.length}케이스 드리프트 ${fails.golden.length}건`);
console.log(`[A5    ] 코퍼스 ${coachN}문항 · 정답 ${coachOk} · 정확도 ${coachAcc}% (원천 검증 포함)`);
console.log(`[규격  ] 최장 읽기 ${agg.readSecMax}s · 블록 사용 ${Object.keys(agg.blocksUsed).length}종`);
console.log(`총 소요 ${secs}s (예산 300s) → ${pass ? "PASS" : "FAIL"}`);
if (!pass) {
  for (const k of Object.keys(fails)) for (const f of fails[k].slice(0, 5)) console.error(` × [${k}]`, JSON.stringify(f).slice(0, 220));
  for (const f of insBlocked.slice(0, 5)) console.error(" × [insfirst] 예외 밖 보험 선행:", f);
  for (const f of insCaseFail.slice(0, 5)) console.error(" × [insfirst-대조]", f);
}

const snap = { date: new Date().toISOString().slice(0, 10), sample: SAMPLE, cards: agg.cards, publishable: agg.pub,
  byGrade: agg.byGrade, blockKinds: Object.keys(agg.blocksUsed).length, blocksUsed: agg.blocksUsed,
  forbiddenHits: blockScan.length, insFirstBlocked: insBlocked.length, insFirstCases: INS_CASES.length - insCaseFail.length,
  goldenDrift: fails.golden.length, coachN, coachOk, coachAcc: Number(coachAcc),
  readSecMax: agg.readSecMax, seconds: Number(secs), pass };
writeFileSync(join(ROOT, "scripts/handoff_harness_snapshot.json"), JSON.stringify(snap, null, 2) + "\n", "utf8");
writeFileSync(join(ROOT, "src/data/hmHarnessSnapshot.js"),
  "/* 자동 생성 — run_handoff_harness.mjs (P4). 콘솔 하네스 타일이 읽는 최근 통과 스냅샷 — 손대지 말 것 */\n"
  + "const HM_HARNESS_SNAPSHOT = " + JSON.stringify({ date: snap.date, sample: snap.sample, cards: snap.cards, publishable: snap.publishable, coachAcc: snap.coachAcc, forbiddenHits: snap.forbiddenHits, goldenDrift: snap.goldenDrift, pass: snap.pass }) + ";\n", "utf8");
process.exit(pass ? 0 : 1);
