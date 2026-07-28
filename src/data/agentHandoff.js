/* ══════════════ 핸드오프 프로토콜 — 담당 이전을 코드로 강제한다(Phase A) ══════════════
   규칙 6개:
     ①인계 고지 1문장 — 말없이 인격이 바뀌지 않는다
     ②컨텍스트 승계 — 질문 원문 + 상태 요약 + 최근 3턴
     ③핸드백 — 범위 밖이면 하이에게 되돌린다
     ④루프 차단 — 한 턴 최대 2회, 동일 쌍(A↔B) 재핸드오프 금지
     ⑤UI 연속성 — 같은 대화창, 아바타·담당 배지만 변경(파트 렌더)
     ⑥개인정보 최소 — 담당에 필요한 상태 필드만 전달, 로그엔 요약·사유만 */

let _hiChain = [];        // 이번 턴의 핸드오프 체인 [{from,to,reason}]
const HI_CHAIN_MAX = 2;

function hiHandoffReset() { _hiChain = []; }
function hiHandoffChain() { return _hiChain.slice(); }

/* 담당별로 전달할 상태 최소 집합(⑥) — 없는 섹션은 아예 넘기지 않는다 */
function hiHandoffState(agentId, snap) {
  if (!snap) return null;
  const pick = { A0: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"], A1: ["s1", "s2"], A2: ["s1", "s3"], A3: ["s2", "s4"], A4: ["s6"] }[agentId] || ["s1"];
  const out = { member: { age: snap.member && snap.member.age, sex: snap.member && snap.member.sex } };
  pick.forEach((k) => { if (snap[k]) out[k] = snap[k]; });
  if (out.s1) out.checkup = out.s1;
  return out;
}

/* 인계 고지 문장(①) — 회원은 항상 누가 이어받는지 안다 */
function hiHandoffAnnounce(from, to, reason) {
  const A = (typeof hiAgent === "function") ? hiAgent(to) : { name: "담당" };
  if (to === "A0") return "여기까지는 제가 봐드렸고, 나머지는 하이가 이어서 도와드릴게요.";
  const why = {
    "checkup-result": "검진 결과 해석",
    "insurance": "보장·청구",
    "shopping": "제품·성분",
    "homecare": "돌봄 서비스",
  }[reason];
  return why ? `${why}은(는) ${A.name}가 이어서 봐드릴게요.` : `${A.name}가 이어서 봐드릴게요.`;
}

/* 핸드오프 실행 — 검증·로그·루프 차단(④). 허용되면 payload, 막히면 null */
function hiHandoff(p) {
  try {
    if (!p || !p.from || !p.to || p.from === p.to) return null;
    if (_hiChain.length >= HI_CHAIN_MAX) return null;                                  // 체인 상한
    for (const h of _hiChain) { if (h.from === p.to && h.to === p.from) return null; } // 동일 쌍 왕복 금지
    const payload = {
      from: p.from, to: p.to, reason: p.reason || "route",
      question: String(p.question || "").slice(0, 300),
      state: hiHandoffState(p.to, p.state),
      context: { turns: (p.turns || []).slice(-3), section: p.section || null },
      ui: { announce: p.announce || hiHandoffAnnounce(p.from, p.to, p.reason), nav: p.nav || null },
      at: Date.now(),
    };
    _hiChain.push({ from: p.from, to: p.to, reason: payload.reason });
    hiHandoffLog(payload);
    return payload;
  } catch (e) { return null; }
}

/* 로그 — 상태 원데이터는 남기지 않는다(⑥) */
function hiHandoffLog(p) {
  try {
    const k = "hifin_agent_handoff";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ from: p.from, to: p.to, reason: p.reason, q: String(p.question || "").slice(0, 60), ts: p.at });
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}
function hiHandoffReport(days) {
  try {
    const since = Date.now() - (days || 7) * 86400000;
    const l = JSON.parse(localStorage.getItem("hifin_agent_handoff") || "[]").filter((x) => x.ts >= since);
    const byPair = {};
    l.forEach((x) => { const k = x.from + "→" + x.to; byPair[k] = (byPair[k] || 0) + 1; });
    return { total: l.length, byPair, recent: l.slice(-20) };
  } catch (e) { return { total: 0, byPair: {}, recent: [] }; }
}

/* 응답 파트 조립(⑤) — 한 턴 안에서 여러 에이전트가 말할 때 말풍선을 나눈다 */
function hiPart(agentId, lines, extra) {
  return Object.assign({ agent: agentId, lines: (lines || []).filter(Boolean) }, extra || {});
}

try { if (typeof window !== "undefined") { window.__hifinHandoff = { run: hiHandoff, chain: hiHandoffChain, report: hiHandoffReport, reset: hiHandoffReset }; } } catch (e) {}
