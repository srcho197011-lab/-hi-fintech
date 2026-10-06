/* ══════════ 지시서 스크립트 하네스 러너 — 지시서 프롬프트 v1.3 §S-5·§S-6 (P4) ══════════
   nav10k 러너 패턴 복제(직접 호출 훅 · UI 경유 금지). 검증 5축:
     ① 조립 — 표본 전건 buildHandoffCard 성공(카드 대상은 발행 가능 100% · 부족 블록 0 · 슬롯 잔존 0)
         ⚠️ 「카드 대상」 정의(형 지시 2026-10-06) = `!(grade === "-" && stage !== "D2")`.
            ⓐ W(결과 대기)는 **포함**한다 — D1도 prep 대본이 실제로 발행되므로 발행·금지어·규격 검증을
              받아야 한다(검증 모집단이 줄지 않고 늘어난다).
            ⓑ 명단에 오르는 D2 등급 '-' 카드도 **포함**한다 — 로스터가 이 집단을 올리기 시작했으므로
              「검증 안 함 = 보여주지 않음」이라는 종전 정합이 깨졌다(검증받지 않은 카드를 시연
              최상단에 올리는 셈이 된다).
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
import { devLogin } from './devcred.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAMPLE = 3000;          // 조립 표본(0..N) — P5에서 10만 전건으로 확장
const t0 = Date.now();

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await devLogin(p);

const fails = { assemble: [], forbidden: [], spec: [], golden: [], coach: [] };

/* ── ①②③ 표본 전건 조립 + 대본 스캔(페이지 내부에서 일괄 — 왕복 최소화) ── */
let agg = { n: 0, cards: 0, pub: 0, byGrade: {}, blocksUsed: {}, readSecMax: 0,
  call: { cards: 0, pub: 0, readSecMax: 0 }, noCall: { cards: 0, pub: 0, readSecMax: 0 } };
for (let i = 0; i < SAMPLE; i += 500) {
  const part = await p.evaluate((from, to) => {
    /* ⚠️ call/noCall 분해(적대적 리뷰 실증 2026-10-06) — 「카드 대상」 분모가 1,713 → 2,496으로
       커졌는데 늘어난 쪽은 **통화 대본이 없는** 결과 대기(D1) prep 카드다(블록 3개·짧은 문안).
       분모만 키우면 「발행 100% · 금지어 0」의 민감도가 쉬운 쪽으로 희석되므로, 두 모집단의
       발행률·최장 읽기를 갈라 적어 희석을 리포트가 스스로 밝힌다. */
    const out = { n: 0, cards: 0, pub: 0, byGrade: {}, blocksUsed: {}, readSecMax: 0, bad: [],
      call: { cards: 0, pub: 0, readSecMax: 0 }, noCall: { cards: 0, pub: 0, readSecMax: 0 } };
    for (let j = from; j < to; j++) {
      let c; try { c = window.__hifinCard(j); } catch (e) { out.bad.push({ i: j, why: "throw " + String(e).slice(0, 60) }); continue; }
      if (c && c.error) { out.bad.push({ i: j, why: c.error }); continue; }
      if (!c) continue;                                    // 코호트 밖 인덱스(프로필 없음) — 대상 아님
      out.n++;
      out.byGrade[c.grade] = (out.byGrade[c.grade] || 0) + 1;
      /* 카드 대상 아님(정기 리듬) — 발행 검증 제외. 단, 명단에 오르는 D2는 등급 '-'여도 검증한다 */
      if (c.grade === "-" && c.member.stage !== "D2") continue;
      out.cards++;
      const _bk = (c.script.callScript !== false) ? out.call : out.noCall;
      _bk.cards++; if (c.compliance.publishable) _bk.pub++;
      if ((c.script.readSec || 0) > _bk.readSecMax) _bk.readSecMax = c.script.readSec || 0;
      if (c.compliance.publishable) out.pub++;
      else out.bad.push({ i: j, why: "unpub", detail: { miss: c.compliance.missingBlocks, unappr: c.compliance.unapprovedBlocks, slots: c.compliance.slotsFilled, spec: c.compliance.specOk, forb: (c.compliance.forbiddenHits || []).slice(0, 2) } });
      const s = c.script;
      /* 블록 사용 집계 — 단계 축 파트(alert·prep·stage)와 D2 첫 연결(fc)까지 센다(형 지시 2026-10-05).
         종전에는 5파트만 세어, 새로 조립된 블록이 「사용 0」인지 아닌지 리포트로 알 수 없었다 */
      /* ⚠️ 전부 옵셔널화 — 통화 없는 카드(결과 대기)는 core·branches가 빈 배열이고 opening이 null이다.
         이 루프는 **표본 전건**에 돌기 때문에, 가드가 없으면 첫 D1 카드에서 터져 ④ 비교에 닿기도 전에 죽는다 */
      for (const bl of [...(s.alert || []), ...(s.prep || []), s.opening, ...(s.firstconnect || []), ...(s.fcExtra || []),
        ...(s.talk || []), ...(s.core || []), ...(s.seed || []), ...(s.stage || []), s.ask, ...(s.careplan || []),
        ...(s.maturity || []), ...(s.fcTail || []), ...(s.branches || []), s.closing].filter(Boolean))
        out.blocksUsed[bl.id] = (out.blocksUsed[bl.id] || 0) + 1;
      if (s.readSec > out.readSecMax) out.readSecMax = s.readSec;
    }
    return out;
  }, i, Math.min(i + 500, SAMPLE));
  agg.n += part.n; agg.cards += part.cards; agg.pub += part.pub;
  for (const k in part.byGrade) agg.byGrade[k] = (agg.byGrade[k] || 0) + part.byGrade[k];
  for (const k in part.blocksUsed) agg.blocksUsed[k] = (agg.blocksUsed[k] || 0) + part.blocksUsed[k];
  agg.readSecMax = Math.max(agg.readSecMax, part.readSecMax);
  for (const bk of ["call", "noCall"]) { agg[bk].cards += part[bk].cards; agg[bk].pub += part[bk].pub; agg[bk].readSecMax = Math.max(agg[bk].readSecMax, part[bk].readSecMax); }
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
  /* 비교 대상(형 지시 2026-10-05 확장) — 종전 flat()은 opening/core/ask/branches/closing 전문만 봤다.
     그래서 단계 축(prep·alert·stage)과 D2 골든타임(firstconnect·fcExtra·fcTail = **무료 3종 문안 전부**)이
     비교 밖이었고, free3Def나 슬롯 조립이 깨져도 하네스는 PASS했다. 발송 문안(notif·sms)과 변형 이름도
     카드의 사실 주장이라 함께 고정한다 — D1의 접촉 금지 규약이 조용히 풀리는 것을 막는다. */
  /* 단계·통화 유무도 비교 집합에 넣는다 — 「통화 대본이 없는 카드」라는 사실 자체가 카드의 주장이고,
     그것이 조용히 되살아나는 것을 막아야 한다(형 지시 2026-10-06) */
  const flat = (c) => JSON.stringify({ g: c.grade, why: c.gradeWhy, grp: c.group, trig: c.trigger, ev: c.evidence,
    stage: c.member.stage, call: c.script.callScript !== false,
    acts: c.actions.map(a => a.key), op: (c.script.opening || {}).id || null, variant: c.script.variant,
    notif: c.script.notif, sms: c.script.sms,
    ids: [...(c.script.alert || []), ...(c.script.prep || []), ...(c.script.firstconnect || []), ...(c.script.fcExtra || []),
      ...(c.script.stage || []), ...(c.script.fcTail || [])].map(b2 => b2.id),
    texts: [...(c.script.alert || []), ...(c.script.prep || []), c.script.opening,
      ...(c.script.firstconnect || []), ...(c.script.fcExtra || []), ...(c.script.core || []),
      ...(c.script.stage || []), c.script.ask, ...(c.script.fcTail || []),
      ...(c.script.branches || []), c.script.closing].filter(Boolean).map(b2 => b2.text) });
  if (!got || flat(got) !== flat(want)) fails.golden.push({ key: cs.key, i: want.member.cohortIndex });
}

/* ── ⑤ A5 코퍼스 회귀 — 결정론 생성(카드 × 질문 표현 변형) 전수 ── */
/* expectNoCall — 통화 대본이 없는 카드(결과 대기 D1)의 정답. 카드 종류별로 기대값이 갈린다:
   오프닝·다음 할 일은 사전 준비 블록(block:pr-)이고, 거절·심각 응대는 **「답 없음」이 정답**이다
   (통화가 없으면 답할 원천이 없다는 것이 사실이다). 라벨 위조(prep를 field:actions로)로 통과시키면
   §S-6의 원천 검증이 동어반복이 된다 — 그래서 러너가 바뀌어야 하는 변경이다(형 지시 2026-10-06). */
const COACH_QS = [
  { q: "why", asks: ["왜 이 지시예요?", "이 카드 이유가 뭐예요?", "근거가 있어요?"], expect: "field:trigger" },
  { q: "start", asks: ["뭐라고 시작해요?", "첫 마디 알려줘", "오프닝 뭐예요?"], expect: "block:op", expectNoCall: "block:pr-" },
  { q: "reject", asks: ["거절하면요?", "싫다고 하면 어떻게 해요?", "안 한다고 하면요?"], expect: "block:br-no", expectNoCall: "none" },
  { q: "serious", asks: ["심각하냐고 물으면요?", "큰 병이냐고 물어보면?"], expect: "block:br-q-serious", expectNoCall: "none" },
  { q: "sms", asks: ["문자로는 뭐라고 보내요?", "문자 내용 알려줘"], expect: "field:sms" },
  { q: "deadline", asks: ["언제까지 해야 해요?", "기한이 언제예요?"], expect: "field:sla" },
  { q: "next", asks: ["다음은 뭐예요?", "그 다음 어떻게 해요?"], expect: "field:actions", expectNoCall: "block:pr-" },
];
/* 코퍼스 카드 = 골든셋 5 + 표본 균등 40(결정론: 시드 고정 스텝) */
const coachIdx = golden.cases.map(c => c.card.member.cohortIndex);
for (let j = 37; coachIdx.length < 45 && j < SAMPLE; j += 67) coachIdx.push(j);
let coachN = 0, coachOk = 0;
for (const ci of coachIdx) {
  const res = await p.evaluate((i, qs) => {
    const card = window.__hifinCard(i);
    if (!card || card.error || (card.grade === "-" && card.member.stage !== "D2")) return { skip: true };
    const out = [];
    for (const d of qs) for (const ask of d.asks) {
      const r = window.__hifinCoach(i, ask);
      out.push({ q: d.q, ask, got: r && r.qtype, src: r && r.ans && (r.ans.source + ":" + r.ans.id), verified: !!(r && r.verified) });
    }
    return { out, call: card.script.callScript !== false, stage: card.member.stage };
  }, ci, COACH_QS);
  if (res.skip) continue;
  for (const r of res.out) {
    coachN++;
    const d = COACH_QS.find(x => x.q === r.q);
    const want = res.call ? d.expect : (d.expectNoCall || d.expect);
    const okType = r.got === r.q;
    let ok;
    if (want === "none") ok = okType && !r.src;          /* 통화가 없으면 「답 없음」이 정답(verified 요구 없음) */
    else ok = okType && !!r.src && r.verified
      && (want.indexOf("field:") === 0 ? r.src.indexOf(want) === 0 : r.src.indexOf("block:" + want.split(":")[1]) === 0);
    if (ok) coachOk++;
    else fails.coach.push({ i: ci, stage: res.stage, call: res.call, q: r.q, ask: r.ask, want, got: r.got, src: r.src, verified: r.verified });
  }
}
/* ── ⑥ 전달 체크 사전 ↔ 대본 블록 대응(신설 2026-10-06 · 적대적 리뷰 실증) ──
   실증: handoffResult.js에서 `consent` 한 줄을 지우고 빌드해도 이 하네스는 **PASS**했다
   (카드 대상 2496/2496 · 골든셋 드리프트 0 · A5 100%). 가드가 비대칭이었다 — 대본 쪽 블록
   `fc-consent`를 지우면 골든셋 c6·c7의 fcTail ids/texts가 흔들려 FAIL하는데, **대본이 말하라고
   지시하는 그 칸을 지우는 쪽은 무음**이었다. 즉 ③이 고치려던 결함(「대본은 동의를 말하라는데
   체크할 칸이 없고 전달률이 영구히 100%에 못 닿는다」)이 언제든 그대로 돌아올 수 있었다.
   검사 둘: ⓐ 조립된 fc 블록 ↔ 사전 키 1:1(최소한 fc-consent ⇔ consent) ⓑ 사전 길이가
   스냅샷보다 줄면 FAIL(칸을 지우는 변경은 반드시 사람 눈을 거친다).
   ⓒ 기록 경로의 코드 밖 거부(§0-B)와 중복 체크 완주 금지도 여기서 양방향으로 본다. */
const gkRes = await p.evaluate(() => {
  const K = window.__hifinResult("keys");
  if (!K || K.error) return { error: (K && K.error) || "keys 훅 없음" };
  const keys = K.keys.map(x => x.k);
  /* D2 카드 하나를 찾아 조립된 fc 블록 집합을 꺼낸다 — 사전·대본이 같은 사실을 들고 있는가 */
  let fcIds = null, fcKo = null;
  for (let j = 1; j < 6000 && !fcIds; j++) {
    const c = window.__hifinCard(j);
    if (!c || c.error || c.member.stage !== "D2") continue;
    if (!(c.script.firstconnect || []).length) continue;
    fcIds = [...(c.script.firstconnect || []), ...(c.script.fcExtra || []), ...(c.script.fcTail || [])].map(b2 => b2.id);
    fcKo = [...(c.script.fcTail || [])].map(b2 => b2.ko);
  }
  /* 기록 경로 — 코드 밖 거부 + 중복 체크가 완주로 집계되지 않는가(실기록 지표 보호) */
  const PRB = "9H9901";
  let outside = null, dup = null;
  try {
    localStorage.removeItem("hifin_handoff_result_" + PRB);
    outside = window.__hifinResult("record", PRB, { i: 1, result: "R1", golden: keys.slice(0, 2).concat(["__notakey__"]) });
    window.__hifinResult("record", PRB, { i: 2, result: "R1", golden: [keys[0], keys[0]].concat(keys.slice(1, keys.length - 1)) });
    const st = window.__hifinResult("stats", PRB);
    dup = { rows: st.golden.rows, full: st.golden.full, dictN: st.golden.dictN };
    localStorage.removeItem("hifin_handoff_result_" + PRB);
  } catch (e) { dup = { err: String(e).slice(0, 80) }; }
  return { n: K.n, keys, fcIds, fcKo, outsideRejected: !!(outside && outside.ok === false), dup };
});
const gkFail = [];
if (gkRes.error) gkFail.push("사전 훅 실패: " + gkRes.error);
else {
  if (!gkRes.fcIds) gkFail.push("D2 카드에서 첫 연결(fc) 블록을 찾지 못했다 — 대본 조립이 끊겼다");
  else {
    const hasConsentBlock = gkRes.fcIds.indexOf("fc-consent") >= 0;
    const hasConsentKey = gkRes.keys.indexOf("consent") >= 0;
    if (hasConsentBlock !== hasConsentKey) gkFail.push(`대본 블록 fc-consent(${hasConsentBlock}) ↔ 전달 체크 칸 consent(${hasConsentKey}) 불일치`);
    const hasSupportBlock = gkRes.fcIds.indexOf("fc-support") >= 0;
    if (hasSupportBlock !== (gkRes.keys.indexOf("support") >= 0)) gkFail.push("대본 블록 fc-support ↔ 칸 support 불일치");
  }
  /* 사전 길이 하한 — 스냅샷에 싣고 줄면 FAIL(③ 지시가 만든 6칸이 조용히 5칸으로 돌아가는 것을 막는다) */
  const prevN = (() => { try { return JSON.parse(readFileSync(join(ROOT, "scripts/handoff_harness_snapshot.json"), "utf8")).goldenKeysN || 0; } catch (e) { return 0; } })();
  if (prevN && gkRes.n < prevN) gkFail.push(`전달 체크 사전 축소 ${prevN} → ${gkRes.n}칸 — 칸을 줄이는 변경은 대표 승인 없이 통과시키지 않는다`);
  if (gkRes.n < 6) gkFail.push(`전달 체크 사전 ${gkRes.n}칸 — 2026-10-06 확정 6칸 미달`);
  if (!gkRes.outsideRejected) gkFail.push("사전 밖 코드가 기록 경로를 통과했다(§0-B 거부 없음)");
  if (gkRes.dup && gkRes.dup.full !== 0) gkFail.push(`중복 체크가 완주로 집계됐다(full ${gkRes.dup.full}) — 완주 판정이 길이 비교로 되돌아갔다`);
}

/* ── ⑦ memberContext v2 계약(신설 2026-10-06 · 적대적 리뷰 실증) ──
   실증: `grep -rn "\.v !== 1|\.v === 1|ctx\.v" src/ scripts/`가 0건이었다 — 스키마를 v:1→v:2로
   올렸지만 그 버전을 읽는 소비자·러너가 **하나도 없었다**. 의미 변경(checkup.grade = "W" ·
   checkup.group = 「결과 도착 후 판정」 · care.actions = [] · script.opening = null)으로 깨지는
   소비자를 아무도 잡지 못하는 상태였다. 계약을 세 줄로 고정한다. */
const ctxRes = await p.evaluate(() => {
  const o = { v: null, d1: null, nd1: null, bad: [] };
  const pick = (want) => { for (let j = 1; j < 4000; j++) { const c = window.__hifinCard(j); if (c && !c.error && ((want === "D1") === (c.member.stage === "D1"))) return j; } return null; };
  const i1 = pick("D1"), i2 = pick("other");
  const c1 = i1 != null ? window.__hifinCtx(i1) : null, c2 = i2 != null ? window.__hifinCtx(i2) : null;
  o.v = c1 ? c1.v : null;
  if (!c1 || c1.v !== 2) o.bad.push("memberContext(i).v !== 2 (D1 표본 " + i1 + ")");
  if (c1 && c1.checkup && c1.checkup.grade !== "W") o.bad.push("D1 표본의 checkup.grade가 W가 아니다: " + c1.checkup.grade);
  if (c1 && c1.care && (c1.care.actions || []).length !== 0) o.bad.push("D1 표본의 care.actions가 비어 있지 않다: " + (c1.care.actions || []).length);
  if (!c2 || c2.v !== 2) o.bad.push("비D1 표본 v !== 2");
  if (c2 && c2.checkup && ["H", "M", "L", "-"].indexOf(c2.checkup.grade) < 0) o.bad.push("비D1 표본 등급이 H/M/L/- 밖: " + c2.checkup.grade);
  if (c2 && c2.checkup && c2.checkup.group === "결과 도착 후 판정") o.bad.push("비D1 표본에 「결과 도착 후 판정」이 붙었다");
  o.d1 = c1 && c1.checkup ? { i: i1, grade: c1.checkup.grade, acts: (c1.care && c1.care.actions || []).length } : null;
  o.nd1 = c2 && c2.checkup ? { i: i2, grade: c2.checkup.grade, group: c2.checkup.group } : null;
  return o;
});

/* ── ⑧ 접촉 금지 단계의 상태·한 줄 문안(신설 2026-10-06 · 적대적 리뷰 실증) ──
   실증: cohortStatusOf의 첫 분기가 st.enrolled였던 탓에 **비가입 D1**(전국 21,925명)에
   「접촉 완료 / 진행 중 / 종결」이 찍히고, 하이 한 줄도 「예정된 연락 때까지는 지켜봐도 좋아요 …
   그 단계에 맞는 행동을 고르시면 돼요」로 폴백했다 — 한 번도 연락한 적 없는 회원에게 「접촉 완료」가
   시연 화면에 그대로 떴다. 폴백이 되살아나면 FAIL 나게 단언한다. */
const blkRes = await p.evaluate(() => {
  const o = { n: 0, bad: [], states: {} };
  /* 코호트 상태·하이 한 줄은 ⑨탭 카드 조립기가 유일한 원천이다 — 화면과 같은 경로로 본다 */
  const CALL = ["연결하", "전화", "연락하는 게", "행동을 고르", "지켜봐도"];
  for (let j = 1; j < 3000; j++) {
    const cy = window.__hifinCycle(j);
    if (!cy || cy.error || cy.stage !== "D1") continue;
    const card = window.__hifinCohortCard ? window.__hifinCohortCard(j) : null;
    if (!card) { o.bad.push("코호트 카드 훅 없음"); break; }
    o.n++; o.states[card.status.k] = (o.states[card.status.k] || 0) + 1;
    if (card.status.k !== "HELD") { if (o.bad.length < 6) o.bad.push("D1 i=" + j + " status=" + card.status.k + "(" + card.status.ko + ")"); }
    if (CALL.some(w => String(card.hi || "").indexOf(w) >= 0)) { if (o.bad.length < 6) o.bad.push("D1 i=" + j + " 하이 한 줄에 연락 권유 어휘: " + String(card.hi).slice(0, 36)); }
    if (o.n >= 400) break;
  }
  return o;
});

await b.close();

/* ── 판정·리포트 ── */
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const coachAcc = coachN ? (coachOk / coachN * 100).toFixed(2) : "0";
const pass = fails.assemble.length === 0 && fails.forbidden.length === 0 && fails.spec.length === 0
  && fails.golden.length === 0 && fails.coach.length === 0 && agg.pub === agg.cards
  && insBlocked.length === 0 && insCaseFail.length === 0 && gkFail.length === 0
  && ctxRes.bad.length === 0 && blkRes.bad.length === 0;
console.log(`[조립  ] 표본 ${agg.n} · 카드 대상 ${agg.cards} · 발행 가능 ${agg.pub} (${agg.cards === agg.pub ? "100%" : "미달"}) · 등급 ${JSON.stringify(agg.byGrade)}`);
console.log(`[모집단] 통화 대본 있는 카드 ${agg.call.cards}(발행 ${agg.call.pub} · 최장 ${agg.call.readSecMax}s) / 없는 카드(결과 대기 prep) ${agg.noCall.cards}(발행 ${agg.noCall.pub} · 최장 ${agg.noCall.readSecMax}s) — 분모가 쉬운 쪽으로 커진 양을 밝힌다`);
console.log(`[금지어] 블록 원문 위반 ${blockScan.length}건 · 조립 대본 위반은 발행 게이트에 포함(위 미달 수치)`);
console.log(`[§0-P  ] 사전 전건 차단 대상 ${insBlocked.length}건 · 실효 대조 ${INS_CASES.length - insCaseFail.length}/${INS_CASES.length}(양성 차단·음성 통과)`);
console.log(`[골든셋] ${golden.cases.length}케이스 드리프트 ${fails.golden.length}건`);
console.log(`[A5    ] 코퍼스 ${coachN}문항 · 정답 ${coachOk} · 정확도 ${coachAcc}% (원천 검증 포함)`);
console.log(`[규격  ] 최장 읽기 ${agg.readSecMax}s · 블록 사용 ${Object.keys(agg.blocksUsed).length}종`);
console.log(`[계약  ] memberContext v${ctxRes.v} · D1 ${JSON.stringify(ctxRes.d1)} · 비D1 ${JSON.stringify(ctxRes.nd1)} · 위반 ${ctxRes.bad.length}건`);
console.log(`[접촉금지] D1 표본 ${blkRes.n}명 상태 ${JSON.stringify(blkRes.states)} · 위반 ${blkRes.bad.length}건(전건 HELD + 연락 권유 어휘 0)`);
console.log(`[전달칸] 사전 ${gkRes.n || "?"}칸 · 대본 fc 블록 ${gkRes.fcIds ? gkRes.fcIds.length : "?"}종 · 칸↔블록 대응 위반 ${gkFail.length}건 · 사전 밖 거부 ${gkRes.outsideRejected ? "OK" : "실패"} · 중복 완주 ${gkRes.dup ? gkRes.dup.full : "?"}건`);
console.log(`총 소요 ${secs}s (예산 300s) → ${pass ? "PASS" : "FAIL"}`);
if (!pass) {
  for (const k of Object.keys(fails)) for (const f of fails[k].slice(0, 5)) console.error(` × [${k}]`, JSON.stringify(f).slice(0, 220));
  for (const f of insBlocked.slice(0, 5)) console.error(" × [insfirst] 예외 밖 보험 선행:", f);
  for (const f of insCaseFail.slice(0, 5)) console.error(" × [insfirst-대조]", f);
  for (const f of gkFail.slice(0, 5)) console.error(" × [전달칸]", f);
  for (const f of ctxRes.bad.slice(0, 5)) console.error(" × [계약]", f);
  for (const f of blkRes.bad.slice(0, 6)) console.error(" × [접촉금지]", f);
}

const snap = { date: new Date().toISOString().slice(0, 10), sample: SAMPLE, cards: agg.cards, publishable: agg.pub,
  byGrade: agg.byGrade, blockKinds: Object.keys(agg.blocksUsed).length, blocksUsed: agg.blocksUsed,
  forbiddenHits: blockScan.length, insFirstBlocked: insBlocked.length, insFirstCases: INS_CASES.length - insCaseFail.length,
  goldenDrift: fails.golden.length, coachN, coachOk, coachAcc: Number(coachAcc),
  /* 전달 체크 사전 — 다음 실행이 「줄었는가」를 보는 기준선 */
  goldenKeysN: gkRes.n || 0, goldenKeyFail: gkFail.length, goldenKeys: gkRes.keys || [],
  ctxV: ctxRes.v, ctxFail: ctxRes.bad.length, blockedN: blkRes.n, blockedStates: blkRes.states, blockedFail: blkRes.bad.length,
  readSecMax: agg.readSecMax, cardsCall: agg.call, cardsNoCall: agg.noCall, seconds: Number(secs), pass };
writeFileSync(join(ROOT, "scripts/handoff_harness_snapshot.json"), JSON.stringify(snap, null, 2) + "\n", "utf8");
writeFileSync(join(ROOT, "src/data/hmHarnessSnapshot.js"),
  "/* 자동 생성 — run_handoff_harness.mjs (P4). 콘솔 하네스 타일이 읽는 최근 통과 스냅샷 — 손대지 말 것 */\n"
  + "const HM_HARNESS_SNAPSHOT = " + JSON.stringify({ date: snap.date, sample: snap.sample, cards: snap.cards, publishable: snap.publishable, coachAcc: snap.coachAcc, forbiddenHits: snap.forbiddenHits, goldenDrift: snap.goldenDrift, pass: snap.pass }) + ";\n", "utf8");
process.exit(pass ? 0 : 1);
