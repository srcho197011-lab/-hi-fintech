/* ══════════════ 운영 집계 — 콘솔이 보여줄 숫자 (Phase G) ══════════════
   ⚠️ **콘솔이 거짓말하면 콘솔이 없느니만 못하다.**
   여기의 집계는 원천(텔레메트리·ledger)과 완전히 일치해야 하고, 하네스가 그걸 검증한다.
   보기 좋게 반올림하거나 없는 값을 채우지 않는다 — 없으면 없다고 돌려준다.

   ⚠️ 원문·회원 식별자는 다루지 않는다. 텔레메트리가 담지 않는 것을 콘솔이 만들어낼 수는 없다. */

const OPS_WINDOWS = { today: 1, week: 7, all: 0 };

function opsEvents(days) {
  let l = [];
  try { l = JSON.parse(localStorage.getItem("hifin_telemetry") || "[]"); } catch (e) { l = []; }
  if (!days) return l;
  const since = Date.now() - days * 86400000;
  return l.filter(function (e) { return Number(e.ts) >= since; });
}

/* ── 패널 ① 지금 상태 ── */
function opsLive(days) {
  const ev = opsEvents(days);
  const out = { total: ev.length, byKind: {}, byAgent: {}, byReason: {}, byU: {}, byLaw: {},
    ensPatterns: {}, guardTotal: 0, emergency: 0, rate: {} };
  for (const e of ev) {
    out.byKind[e.kind] = (out.byKind[e.kind] || 0) + 1;
    if (e.agent) out.byAgent[e.agent] = (out.byAgent[e.agent] || 0) + 1;
    if (e.reason) out.byReason[e.reason] = (out.byReason[e.reason] || 0) + 1;
    if (e.utype) out.byU[e.utype] = (out.byU[e.utype] || 0) + 1;
    if (e.pattern) out.ensPatterns[e.pattern] = (out.ensPatterns[e.pattern] || 0) + 1;
    for (const l of e.laws || []) { out.byLaw[l] = (out.byLaw[l] || 0) + 1; out.guardTotal++; }
  }
  const routes = out.byKind.route || 0;
  /* 비율은 분모가 0이면 계산하지 않는다(0으로 나눠 0%를 만들면 거짓말이 된다) */
  out.rate.unanswered = routes ? (out.byKind.unanswered || 0) / routes : null;
  out.rate.ensemble = routes ? (out.byKind.ensemble || 0) / routes : null;
  out.rate.miss = routes ? (out.byKind.miss || 0) / routes : null;
  return out;
}

/* ── 패널 ② 가드 현황 — 조항별 위반 + 최근 사례(정규화 문장만) ── */
function opsSafety(days) {
  const ev = opsEvents(days);
  const byLaw = {}, samples = {};
  let guardEvents = 0;
  for (const e of ev) {
    if (e.kind !== "guard" || !e.laws) continue;
    guardEvents++;
    for (const l of e.laws) {
      byLaw[l] = (byLaw[l] || 0) + 1;
      if (!samples[l]) samples[l] = [];
      if (samples[l].length < 3 && e.qn && samples[l].indexOf(e.qn) < 0) samples[l].push(e.qn);
    }
  }
  /* 응급 발동 — 이 숫자가 0이 아니면 회원이 위험했다는 뜻이다 */
  const emg = { critical: 0, urgent: 0 };
  for (const e of ev) {
    if (e.kind !== "guard" || !e.laws) continue;
    if (e.laws.indexOf("A4:emergency") >= 0) emg.urgent++;
  }
  const rank = Object.entries(byLaw).sort(function (a, b) { return b[1] - a[1]; });
  return { guardEvents: guardEvents, byLaw: byLaw, rank: rank, samples: samples, emergency: emg };
}

/* ── 패널 ③ 학습 루프 — 산출물이 없으면 **없다고 말한다** ── */
function opsLearn(ledger) {
  if (!ledger || !ledger.runs || !ledger.runs.length) {
    return { available: false, hint: "학습 루프 산출물이 아직 없어요 — `node scripts/learn/run.mjs`를 먼저 돌려 주세요." };
  }
  const runs = ledger.runs;
  const last = runs[runs.length - 1];
  const keys = [...new Set(runs.reduce(function (a, r) { return a.concat(Object.keys(r.metrics || {})); }, []))];
  const drops = [];
  if (runs.length >= 2) {
    const a = runs[runs.length - 2].metrics || {}, b = last.metrics || {};
    for (const k of keys) { if (a[k] != null && b[k] != null && b[k] < a[k]) drops.push({ key: k, from: a[k], to: b[k] }); }
  }
  return { available: true, runs: runs.length, last: last, keys: keys, drops: drops,
    promoted: runs.filter(function (r) { return r.pass; }).length,
    rolledBack: runs.filter(function (r) { return !r.pass; }).length,
    series: runs.slice(-10).map(function (r, i) { return { i: runs.length - Math.min(10, runs.length) + i + 1, pass: r.pass, failed: r.failed || null, metrics: r.metrics || {} }; }) };
}

/* ── 콘솔 출력 금지 어휘 — 내부 화면이라도 데모에서 열릴 수 있다 ── */
const OPS_FORBIDDEN = /(원가율|공급\s*단가|매입가|수수료율|마진율|송객\s*수수료|CAC)/;
function opsSafeText(s) { return OPS_FORBIDDEN.test(String(s || "")) ? "(비공개 항목)" : s; }

try { if (typeof window !== "undefined") { window.__hifinOpsMetrics = { live: opsLive, safety: opsSafety, learn: opsLearn, events: opsEvents, windows: OPS_WINDOWS, safeText: opsSafeText }; } } catch (e) {}
