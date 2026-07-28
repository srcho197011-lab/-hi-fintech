/* ══════════ Phase F STEP4 — 증분(Promote): 자동으로 되는 것만 자동으로 ══════════
   (a) 라우팅 골든셋 — **자동 증분**(규칙으로 담당을 판정할 수 있다)
   (b) 협주 패턴   — **제안만**(응답 구조를 바꾸므로 자동 반영 금지)
   (c) 가드 규칙   — **클러스터 리포트만**(치환 규칙은 사람이 쓴다 — Phase B 교훈)
   (d) 답변 코퍼스 — **검수 큐**(의료·보험·표시광고 경계는 자동 생성 금지)

   실행: node scripts/learn/promote.mjs [--apply]
     기본은 예행(dry-run) — 무엇이 늘어날지만 보여준다. --apply를 줘야 파일을 건드린다.
   산출: docs/hi_learn/promote-report.md · review-queue.json · ens-patterns-proposed.json */
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadBundle, loadTelemetry, readJ, ROOT, LEARN_DIR, writeJ, writeT, takeSnapshot } from "./lib.mjs";

const APPLY = process.argv.includes("--apply");
const B = loadBundle();
const cand = readJ("docs", "hi_learn", "candidates.json");
if (!cand) { console.log("■ candidates.json이 없어요 — 먼저 harvest를 돌려 주세요."); process.exit(1); }

/* 학습 증분은 **별도 파일**에 쌓는다 — golden-set.json은 test-routing의 산출물이라 매 실행 덮어써진다 */
const GOLDEN = join(ROOT, "docs", "agent-mesh", "db", "golden-learned.json");
const golden = existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, "utf8")) : [];
const seen = new Set(golden.map((g) => String(g.q).replace(/\s+/g, "").toLowerCase()));

/* ── (a) 라우팅 골든셋 자동 증분 ──
   담당 라벨은 규칙(agentRegistry scope)으로 정할 수 있다. 단 **확신이 낮으면 자동 추가하지 않는다.** */
const CONF_GAP = 2;                     /* 1등과 2등 점수 격차가 이보다 작으면 사람에게 */
const added = [], toQueue = [];
for (const c of cand.candidates) {
  const q = c.raw || c.qn;
  if (!q || q.length < 6) continue;
  const key = String(q).replace(/\s+/g, "").toLowerCase();
  if (seen.has(key)) continue;

  const sc = B.scores(q, q);
  const rank = Object.entries(sc).filter(([id]) => id !== "A0").sort((a, b) => b[1] - a[1]);
  const [top, topScore] = rank[0] || [null, 0];
  const secondScore = rank[1] ? rank[1][1] : 0;
  const route = B.route(q, q, null, {});

  const confident = topScore > 0 && (topScore - secondScore) >= CONF_GAP && route.agent === top;
  const row = { q, expect: route.agent, top, topScore, secondScore, reason: route.reason, signal: c.signal, n: c.n };
  if (confident) { added.push(row); seen.add(key); }
  else toQueue.push(Object.assign(row, { why: topScore === 0 ? "도메인 어휘 없음(A0 가능성)" : "1·2등 격차 부족" }));
}

/* ── (b) 협주 패턴 제안 — 자동 반영하지 않는다 ── */
const pairCount = new Map();
for (const c of cand.crossDomain || []) {
  const spec = c.agents.filter((a) => a !== "A0").sort();
  if (spec.length < 2) continue;
  const key = spec.join("×");
  if (!pairCount.has(key)) pairCount.set(key, { pair: spec, n: 0, samples: [] });
  const p = pairCount.get(key); p.n += c.n; if (p.samples.length < 5) p.samples.push(c.qn);
}
const events = loadTelemetry();
/* 이미 협주로 처리된 조합은 제외 — 새로 필요한 것만 제안한다 */
const covered = new Set();
for (const e of events) { if (e.kind === "ensemble" && e.agents) covered.add(e.agents.filter((a) => a !== "A0").sort().join("×")); }
const proposals = [...pairCount.values()]
  .filter((p) => !covered.has(p.pair.join("×")))
  .sort((a, b) => b.n - a.n)
  .map((p) => ({ pair: p.pair, n: p.n, samples: p.samples,
    note: "제안입니다 — ENS_PATTERNS에 사람이 when 정규식과 파트 질문을 써 넣어야 합니다(자동 반영 금지)." }));

/* ── (c) 가드 누출 클러스터 — 어느 조가 새고 있나 ── */
const lawCount = {};
for (const c of cand.candidates) { for (const l in c.laws) lawCount[l] = (lawCount[l] || 0) + c.laws[l]; }
const lawRank = Object.entries(lawCount).sort((a, b) => b[1] - a[1]);

/* ── (d) 답변 검수 큐 ── */
const queue = cand.candidates
  .filter((c) => c.signal === "unanswered" || c.signal === "miss")
  .slice(0, 60)
  .map((c) => ({ qn: c.qn, n: c.n, signal: c.signal, utypes: Object.keys(c.utypes),
    suggestAgent: (B.route(c.raw || c.qn, c.raw || c.qn, null, {}) || {}).agent || "A0",
    answer: null, status: "pending" }));
writeJ(join(LEARN_DIR, "review-queue.json"), { note: "답변 내용은 자동 생성하지 않습니다 — 사람이 answer를 채우고 status를 approved로 바꾸면 코퍼스에 증분됩니다.", items: queue });
writeJ(join(LEARN_DIR, "ens-patterns-proposed.json"), { note: "제안일 뿐 자동 반영되지 않습니다.", proposals });

/* ── 적용 ── */
let applied = 0, snapDir = null;
if (APPLY && added.length) {
  /* 되돌릴 지점을 **증분 전에** 만든다 — 게이트가 뜨면 이미 오염된 상태를 찍는다 */
  snapDir = takeSnapshot().dir;
  const next = golden.concat(added.map((a) => ({ q: a.q, expect: a.expect, src: "learn", ts: Date.now() })));
  writeFileSync(GOLDEN, JSON.stringify(next, null, 1), "utf8");
  applied = added.length;
}

const md = `# 증분 리포트 — 자동으로 되는 것만 자동으로

> 모드: **${APPLY ? "적용(--apply)" : "예행(dry-run)"}** · 후보 ${cand.candidates.length}건에서 산출
> ⚠️ 현재 입력은 **데모용 합성 트래픽**입니다(실사용 로그 아님).

## 무엇이 자동이고 무엇이 아닌가

| 단계 | 자동화 | 이번 회차 |
|---|---|---:|
| 라우팅 라벨(누가 담당인가) | **자동** | 증분 ${added.length}건 |
| 확신 부족 → 사람에게 | — | 큐 ${toQueue.length}건 |
| 협주 패턴 | **제안만** | 제안 ${proposals.length}건 · 자동 반영 **0** |
| 가드 규칙 | **리포트만** | 조항 ${lawRank.length}종 · 자동 생성 **0** |
| 답변 내용 | **사람 검수 큐** | 대기 ${queue.length}건 |

## (a) 라우팅 골든셋 — 자동 증분 ${added.length}건
확신 기준: 1등 점수 > 0 **이면서** 1·2등 격차 ≥ ${CONF_GAP} **이면서** 라우터 판정과 일치.

| 질문 | 라벨 | 점수(1등/2등) | 근거 |
|---|---|---|---|
${added.slice(0, 15).map((a) => `| ${a.q.slice(0, 34)} | ${a.expect} | ${a.topScore}/${a.secondScore} | ${a.reason} |`).join("\n") || "| (없음) | | | |"}

### 확신 부족 → 검수 큐 ${toQueue.length}건
${toQueue.slice(0, 10).map((t) => `- \`${t.q.slice(0, 40)}\` — ${t.why}(${t.top || "-"} ${t.topScore}/${t.secondScore})`).join("\n") || "(없음)"}

## (b) 협주 패턴 제안 ${proposals.length}건 — **자동 반영 0**
${proposals.map((p) => `- **${p.pair.join(" × ")}** (${p.n}회)\n  예) ${p.samples.slice(0, 3).map((s) => `\`${s}\``).join(" · ")}`).join("\n") || "(이미 커버된 조합만 관측됨)"}

> 패턴은 응답 구조를 바꾼다. \`ENS_PATTERNS\`에 when 정규식과 파트 질문을 **사람이** 써 넣어야 한다.

## (c) 가드 누출 클러스터 — 어느 조가 새고 있나
| 조항 | 건수 |
|---|---:|
${lawRank.slice(0, 12).map(([l, n]) => `| ${l} | ${n} |`).join("\n") || "| (없음) | |"}

> 새 정규식을 자동 생성하지 않는다. **문구 부착 ≠ 교정**(Phase B) — 치환 규칙은 사람이 쓴다.

## (d) 답변 검수 큐 ${queue.length}건
\`docs/hi_learn/review-queue.json\`의 \`answer\`를 채우고 \`status\`를 \`approved\`로 바꾸면 코퍼스에 증분된다.
**자동 생성하지 않는 이유** — 답변 내용은 의료·보험·표시광고 경계가 걸린 영역이다.

${queue.slice(0, 10).map((q) => `- \`${q.qn.slice(0, 40)}\` (${q.n}회 · ${q.signal}${q.utypes.length ? " · " + q.utypes.join(",") : ""}) → 제안 담당 ${q.suggestAgent}`).join("\n") || "(없음)"}
`;
writeT(join(LEARN_DIR, "promote-report.md"), md);

console.log(`■ ${APPLY ? "적용" : "예행"} · 라우팅 자동 증분 ${added.length}건${APPLY ? `(적용 ${applied})` : ""} · 확신부족 큐 ${toQueue.length}건`);
console.log(`■ 협주 패턴 제안 ${proposals.length}건(자동 반영 0) · 가드 조항 ${lawRank.length}종 · 답변 검수 큐 ${queue.length}건`);
if (snapDir) console.log("■ 스냅샷(증분 전) " + snapDir.replace(ROOT, "."));
console.log("■ docs/hi_learn/promote-report.md · review-queue.json · ens-patterns-proposed.json");
