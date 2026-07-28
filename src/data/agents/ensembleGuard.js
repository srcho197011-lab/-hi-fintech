/* ══════════════ 협주 가드 — 합주가 만드는 새 위험 (Phase E) ══════════════
   각 에이전트 가드를 다 통과한 문장들이라도, **합쳐 놓으면 새로 생기는 위험**이 있다.

   헌법 6조
     ①가드 우회 금지 — 합성 중 생성된 문장(원문·이음말 화이트리스트 밖)은 내보내지 않는다
     ②경계 침범 금지 — support 파트가 담당 밖 발언(A3가 수치 해석 등)
     ③응급 희석 금지 — 응급 안내가 다른 파트에 묻히면 안 된다
     ④모순 방치 금지 — 상반된 단정이 나란히 서면 안 된다
     ⑤책임 불명 금지 — 어느 말이 누구 말인지 알 수 있어야 한다
     ⑥과다 응답 금지 — 분량 상한

   마지막에 **각 에이전트 가드를 다시 한 번 태운다.** 합성 결과 전체가 A2·A3·A4 가드를 재통과해야 나간다.
   (Phase B 교훈 — 문구 부착 ≠ 교정. 재통과에서 걸리면 그 줄을 치환하거나 버린다.) */

function ensembleGuard(composed, ctx) {
  ctx = ctx || {};
  const out = { lines: (composed.lines || []).slice(), violations: [], blocked: false };
  try {
    const parts = ctx.parts || [];

    /* ① 가드 우회 — 허용 문장 집합을 만들고, 그 밖의 문장은 제거한다.
       이게 협주의 생명선이다. 여기서 새 문장이 새어 나가면 규제 통제 전체가 무의미해진다. */
    const allowed = new Set();
    for (const p of parts) { for (const l of (p.res.lines || [])) allowed.add(String(l)); }
    try { for (const k in ENS_BRIDGE) allowed.add(ENS_BRIDGE[k]); } catch (e) {}
    const kept = out.lines.filter(function (l) { return allowed.has(String(l)); });
    if (kept.length !== out.lines.length) {
      out.violations.push({ id: "bypass", law: "①가드 우회 금지", mode: "strip", n: out.lines.length - kept.length });
      out.lines = kept;
    }

    /* ② 경계 침범 — 각 줄이 '누구 말인지' 알므로, 그 담당의 금지 어휘로 검사한다 */
    const ownerOf = {};
    for (const p of parts) { for (const l of (p.res.lines || [])) { if (ownerOf[l] === undefined) ownerOf[l] = p.agent; } }
    const offLane = function (l) {
      const a = ownerOf[l];
      const re = (a && typeof ENS_OUT_OF_LANE !== "undefined") ? ENS_OUT_OF_LANE[a] : null;
      return !!(re && re.test(l));
    };
    const lane = out.lines.filter(offLane).map(function (l) { return { agent: ownerOf[l], line: String(l).slice(0, 50) }; });
    if (lane.length) {
      out.violations.push({ id: "lane", law: "②경계 침범 금지", mode: "strip", hits: lane });
      out.lines = out.lines.filter(function (l) { return !offLane(l); });
    }

    /* ③ 응급 희석 — 응급 파트의 첫 줄이 응답 맨 앞에 있어야 한다 */
    const emgPart = parts.find(function (p) { return p.res.emergency; });
    if (emgPart) {
      const head = String((emgPart.res.lines || [])[0] || "");
      if (head && out.lines[0] !== head) {
        out.lines = [head].concat(out.lines.filter(function (l) { return l !== head; }));
        out.violations.push({ id: "emergencyBuried", law: "③응급 희석 금지", mode: "reorder" });
      }
      /* 응급이면 파트를 2개로 제한한다 — 지금은 말을 늘릴 때가 아니다 */
      if (out.lines.length > 8) { out.lines = out.lines.slice(0, 8); out.violations.push({ id: "emergencyTrim", law: "③응급 시 분량 축소", mode: "trim" }); }
    }

    /* ④ 모순 조정 결과 고지 — 편성에서 단정을 걷어냈으면 그 사실을 밝힌다(사전 문구) */
    if (composed.conflictAdjusted) {
      const note = "※ 담당별 안내가 달라 보이는 부분은 더 보수적인 쪽으로 맞췄어요 — 확정은 심사·판정 결과를 따라요.";
      if (out.lines.indexOf(note) < 0) out.lines.push(note);
      out.violations.push({ id: "conflict", law: "④모순 방치 금지", mode: "append" });
    }

    /* ⑤ 책임 불명 — 담당이 2인 이상인데 표기가 없으면 위반(표기는 상위 _hiDecorate가 붙인다) */
    if (!composed.agents || composed.agents.length < 2) {
      out.blocked = true;
      out.violations.push({ id: "owner", law: "⑤책임 불명 금지", mode: "block" });
      return out;
    }

    /* ⑥ 과다 응답 */
    if (out.lines.length > (typeof ensMaxLines === "function" ? ensMaxLines() : 12)) {
      out.lines = out.lines.slice(0, (typeof ensMaxLines === "function" ? ensMaxLines() : 12));
      out.violations.push({ id: "overflow", law: "⑥과다 응답 금지", mode: "trim" });
    }

    /* ── 개별 가드 재통과 — 합성 결과 전체를 각 도메인 가드에 다시 태운다 ── */
    const used = composed.agents || [];
    if (used.indexOf("A2") >= 0 && typeof insuranceGuard === "function") {
      const g = insuranceGuard(out.lines, {});
      if (!g.blocked) { if (g.violations && g.violations.length) out.violations.push({ id: "recheck-A2", law: "재통과 A2", mode: "fix", n: g.violations.length }); out.lines = g.lines; }
    }
    if (used.indexOf("A3") >= 0 && typeof shoppingGuard === "function") {
      const g = shoppingGuard(out.lines, {});
      if (!g.blocked) { if (g.violations && g.violations.length) out.violations.push({ id: "recheck-A3", law: "재통과 A3", mode: "fix", n: g.violations.length }); out.lines = g.lines; }
    }
    if (used.indexOf("A4") >= 0 && typeof homecareGuard === "function") {
      const g = homecareGuard(out.lines, {});
      if (!g.blocked) { if (g.violations && g.violations.length) out.violations.push({ id: "recheck-A4", law: "재통과 A4", mode: "fix", n: g.violations.length }); out.lines = g.lines; }
    }
    /* 재통과에서 문장이 바뀌었을 수 있다 — 상한만 다시 맞춘다(내용 생성 없음) */
    if (out.lines.length > (typeof ensMaxLines === "function" ? ensMaxLines() : 12)) out.lines = out.lines.slice(0, (typeof ensMaxLines === "function" ? ensMaxLines() : 12));
    if (!out.lines.length) out.blocked = true;
  } catch (e) { out.blocked = true; }
  return out;
}

try { if (typeof window !== "undefined") { window.__hifinEnsGuard = { check: ensembleGuard }; } } catch (e) {}
