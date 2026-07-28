/* ══════════ Phase F STEP3 — 수확(Harvest): 무엇부터 고칠 것인가 ══════════
   텔레메트리를 읽어 **개선 후보 우선순위표**를 만든다.

   우선순위 = 영향도 × log(빈도+1)
   한 번 터진 가드 위반이 100번 반복된 사소한 미매칭보다 위다 — 규제 사고는 되돌릴 수 없다.

   실행: node scripts/learn/harvest.mjs
   산출: docs/hi_learn/candidates.json · harvest-report.md */
import { join } from "node:path";
import { loadTelemetry, LEARN_DIR, writeJ, writeT } from "./lib.mjs";

/* 영향도 — 숫자가 아니라 '되돌릴 수 있는가'의 순서다 */
const IMPACT = {
  guard: 10,        /* 규제 사고 직전 */
  unanswered: 5,    /* 회원이 빈손으로 떠남 */
  handback: 4,      /* 엉뚱한 담당이 받음 */
  ensembleMiss: 3,  /* 답이 반쪽 */
  miss: 2,          /* Q&A 공백 */
  route: 0,         /* 정상 라우팅은 후보가 아니다(분포 통계로만) */
};

const events = loadTelemetry();
if (!events.length) {
  console.log("■ 텔레메트리가 비어 있어요 — 먼저 `node scripts/learn/simulate-traffic.mjs`를 돌려 주세요.");
  process.exit(1);
}

/* ── 같은 질문 묶기(정규화 해시 기준) ── */
const bag = new Map();
function slot(e) {
  if (!bag.has(e.qh)) bag.set(e.qh, { qh: e.qh, qn: e.qn, raw: e.raw || null, n: 0, kinds: {}, laws: {}, utypes: {}, agents: {} });
  return bag.get(e.qh);
}
const dist = { byKind: {}, byAgent: {}, byReason: {}, byU: {}, byLaw: {} };
for (const e of events) {
  dist.byKind[e.kind] = (dist.byKind[e.kind] || 0) + 1;
  if (e.agent) dist.byAgent[e.agent] = (dist.byAgent[e.agent] || 0) + 1;
  if (e.reason) dist.byReason[e.reason] = (dist.byReason[e.reason] || 0) + 1;
  if (e.utype) dist.byU[e.utype] = (dist.byU[e.utype] || 0) + 1;
  for (const l of e.laws || []) dist.byLaw[l] = (dist.byLaw[l] || 0) + 1;

  if (e.kind === "route") continue;                 /* 정상 라우팅은 후보가 아니다 */
  const s = slot(e);
  s.n++;
  s.kinds[e.kind] = (s.kinds[e.kind] || 0) + 1;
  if (e.utype) s.utypes[e.utype] = (s.utypes[e.utype] || 0) + 1;
  if (e.agent) s.agents[e.agent] = (s.agents[e.agent] || 0) + 1;
  for (const l of e.laws || []) s.laws[l] = (s.laws[l] || 0) + 1;
  if (!s.raw && e.raw) s.raw = e.raw;
}

/* ── 우선순위 ── */
const cands = [...bag.values()].map((s) => {
  let impact = 0, top = null;
  for (const k in s.kinds) {
    const w = IMPACT[k] || 1;
    if (w > impact) { impact = w; top = k; }
  }
  const score = Math.round(impact * Math.log(s.n + 1) * 100) / 100;
  return Object.assign(s, { impact, signal: top, score });
})
  /* **등급 우선, 그다음 점수.** 빈도가 아무리 높아도 가드 위반보다 위에 올 수 없다 —
     규제 사고는 되돌릴 수 없고, 답변불가는 다음 주에 고쳐도 된다. */
  .sort((a, b) => b.impact - a.impact || b.score - a.score || b.n - a.n);

/* 협주 후보 — 라우팅 로그에서 **같은 질문이 담당을 오간 흔적** */
const routeByQ = new Map();
for (const e of events) {
  if (e.kind !== "route" || !e.agent) continue;
  if (!routeByQ.has(e.qh)) routeByQ.set(e.qh, { qn: e.qn, agents: new Set(), n: 0 });
  const r = routeByQ.get(e.qh); r.agents.add(e.agent); r.n++;
}
const crossDomain = [...routeByQ.entries()]
  .filter(([, r]) => r.agents.size >= 2 && [...r.agents].some((a) => a !== "A0"))
  .map(([qh, r]) => ({ qh, qn: r.qn, agents: [...r.agents], n: r.n }))
  .sort((a, b) => b.n - a.n);

const out = { generatedFrom: events.length, dist, candidates: cands.slice(0, 200), crossDomain: crossDomain.slice(0, 50),
  rawStored: events.filter((e) => e.raw).length };
writeJ(join(LEARN_DIR, "candidates.json"), out);

const T = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n || 8);
const md = `# 수확 리포트 — 무엇부터 고칠 것인가

> 텔레메트리 ${events.length.toLocaleString()}건에서 후보 ${cands.length}건 추출
> ⚠️ 현재 입력은 **데모용 합성 트래픽**입니다(실사용 로그 아님).

## 우선순위 = 영향도 × log(빈도+1)

| 신호 | 영향도 | 뜻 |
|---|---:|---|
| 가드 위반 | 10 | 규제 사고 직전 — 되돌릴 수 없다 |
| 답변불가(U1~U7) | 5 | 회원이 빈손으로 떠남 |
| 핸드백(오배정) | 4 | 엉뚱한 담당이 받음 |
| 협주 누락 | 3 | 답이 반쪽 |
| 미매칭 | 2 | Q&A 공백 |

## 상위 후보 20

| # | 정규화 문장 | 신호 | 빈도 | 점수 |
|---:|---|---|---:|---:|
${cands.slice(0, 20).map((c, i) => `| ${i + 1} | ${c.qn || "(빈 문장)"} | ${c.signal}${Object.keys(c.laws).length ? " · " + Object.keys(c.laws).join(",") : ""}${Object.keys(c.utypes).length ? " · " + Object.keys(c.utypes).join(",") : ""} | ${c.n} | ${c.score} |`).join("\n")}

## 분포

**종류** ${T(dist.byKind).map(([k, v]) => `${k} ${v}`).join(" · ")}
**담당** ${T(dist.byAgent).map(([k, v]) => `${k} ${v}`).join(" · ")}
**라우팅 근거** ${T(dist.byReason).map(([k, v]) => `${k} ${v}`).join(" · ")}
**답변불가 유형** ${T(dist.byU).map(([k, v]) => `${k} ${v}`).join(" · ") || "없음"}
**가드 조항** ${T(dist.byLaw).map(([k, v]) => `${k} ${v}`).join(" · ") || "없음"}

## 교차 도메인(협주 후보) — ${crossDomain.length}건
같은 질문이 서로 다른 담당으로 갈린 흔적. 협주 패턴 후보가 된다(자동 반영하지 않는다).

${crossDomain.slice(0, 10).map((c) => `- \`${c.qn}\` → ${c.agents.join(" / ")} (${c.n}회)`).join("\n") || "(없음)"}

## 개인정보
원문이 저장된 이벤트 **${out.rawStored}건** — 0이어야 정상입니다(원문 미저장 모드).
`;
writeT(join(LEARN_DIR, "harvest-report.md"), md);

console.log(`■ 수확 ${cands.length}건 · 교차 도메인 ${crossDomain.length}건 · 원문 저장 ${out.rawStored}건(0이어야 정상)`);
console.log(`■ 최상위: ${cands.slice(0, 3).map((c) => `${c.signal}/${c.n}회 "${(c.qn || "").slice(0, 18)}"`).join(" · ")}`);
console.log("■ docs/hi_learn/candidates.json · harvest-report.md");
