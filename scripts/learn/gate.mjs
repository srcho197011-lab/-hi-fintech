/* ══════════ Phase F STEP5 — 게이트(Gate): 회귀가 통과시켜야 나간다 ══════════
   증분 전 **스냅샷**을 뜨고, 회귀 7종을 돌려 기준을 판정하고, 하나라도 미달이면 **되돌린다.**
   롤백이 안 되는 게이트는 게이트가 아니다.

   실행: node scripts/learn/gate.mjs
   산출: docs/hi_learn/ledger.json · gate-report.md · drift-report.md · snapshots/<ts>/ */
import { join, basename } from "node:path";
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { ROOT, LEARN_DIR, readJ, writeJ, writeT, ensureDir, takeSnapshot, latestSnapshot, restoreSnapshot } from "./lib.mjs";

/* 회귀 7종과 기준 — 통과 조건은 종료코드 0, 정확도만 추가 판정 */
const SUITES = [
  { id: "accuracy", cmd: ["docs/hi_nlu/test-accuracy.mjs"], parse: (o) => { const m = o.match(/acc=([\d.]+)%/); return m ? Number(m[1]) : null; }, min: 99.2, maxDrop: 0.05 },
  { id: "scenarios", cmd: ["docs/hi_phase2/test-scenarios.mjs"], parse: (o) => { const m = o.match(/통과율 ([\d.]+)%/); return m ? Number(m[1]) : null; }, min: 100 },
  { id: "branching", cmd: ["docs/hi_phase2/test-branching.mjs"] },
  { id: "routing", cmd: ["docs/agent-mesh/test-routing.mjs"], parse: (o) => { const m = o.match(/정확도 ([\d.]+)%/); return m ? Number(m[1]) : null; }, min: 97 },
  { id: "a2", cmd: ["docs/agent-mesh/agents/A2_insurance/test-a2.mjs"] },
  { id: "a3", cmd: ["docs/agent-mesh/agents/A3_shopping/test-a3.mjs"] },
  { id: "a4", cmd: ["docs/agent-mesh/agents/A4_homecare/test-a4.mjs"] },
  { id: "ensemble", cmd: ["docs/agent-mesh/agents/E_ensemble/test-ensemble.mjs"] },
];

const stamp = String(process.env.GATE_TS || Date.now());

/* ── 되돌릴 지점 — 증분(promote --apply)이 남긴 스냅샷을 쓴다.
   여기서 새로 뜨면 이미 증분된 상태를 찍게 되므로, 없을 때만 직접 뜬다(단독 실행 호환). */
let snap = latestSnapshot();
if (!snap) { snap = takeSnapshot(stamp); console.log("■ 직전 스냅샷이 없어 지금 생성했어요(단독 실행)"); }
const snapDir = snap.dir;
console.log(`■ 되돌릴 지점 ${String(snapDir).replace(ROOT, ".")} (파일 ${snap.files.length}개)`);

/* ── 회귀 실행 ── */
const ledgerFile = join(LEARN_DIR, "ledger.json");
const ledger = readJ("docs", "hi_learn", "ledger.json") || { runs: [] };
const prev = ledger.runs.length ? ledger.runs[ledger.runs.length - 1] : null;

const results = [];
let failed = null;
for (const s of SUITES) {
  let out = "", code = 0;
  try { out = execFileSync("node", s.cmd, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = String((e.stdout || "") + (e.stderr || "")); code = e.status == null ? 1 : e.status; }
  const val = s.parse ? s.parse(out) : null;
  let ok = code === 0;
  const notes = [];
  if (ok && s.min != null && val != null && val < s.min) { ok = false; notes.push(`기준 미달 ${val} < ${s.min}`); }
  /* 절대 기준만 보면 서서히 깎이는 걸 못 잡는다 — 직전 대비 하락폭도 본다 */
  if (ok && s.maxDrop != null && prev && prev.metrics && prev.metrics[s.id] != null && val != null) {
    const drop = prev.metrics[s.id] - val;
    if (drop > s.maxDrop) { ok = false; notes.push(`직전 대비 ${drop.toFixed(2)}%p 하락 > ${s.maxDrop}`); }
  }
  results.push({ id: s.id, ok, code, value: val, notes });
  console.log(`  ${ok ? "✓" : "✗"} ${s.id}${val != null ? " " + val : ""}${notes.length ? " — " + notes.join(" · ") : ""}`);
  if (!ok) { failed = s.id; break; }        /* 하나라도 깨지면 즉시 멈춘다(나머지를 돌릴 이유가 없다) */
}

/* ── 판정 · 롤백 ── */
let rolledBack = false;
if (failed) {
  const n = restoreSnapshot(snap);
  rolledBack = true;
  console.log(`■ 미달(${failed}) → 롤백 ${n}개 파일 복원`);
} else {
  console.log("■ 전 항목 통과 → 승격");
}

const metrics = {};
for (const r of results) if (r.value != null) metrics[r.id] = r.value;
const run = { ts: Number(stamp), pass: !failed, failed, rolledBack, metrics,
  snapshot: String(snapDir).replace(ROOT, "."), suites: results.map((r) => ({ id: r.id, ok: r.ok, value: r.value })) };
ledger.runs.push(run);
writeJ(ledgerFile, ledger);

/* ── 드리프트 — 회차별 추이 ── */
const runs = ledger.runs;
const keys = [...new Set(runs.flatMap((r) => Object.keys(r.metrics || {})))];
const warn = [];
if (runs.length >= 2) {
  const a = runs[runs.length - 2].metrics || {}, b = runs[runs.length - 1].metrics || {};
  for (const k of keys) { if (a[k] != null && b[k] != null && b[k] < a[k]) warn.push(`${k} ${a[k]} → ${b[k]}`); }
}
const drift = `# 드리프트 리포트

> 회차 ${runs.length}회 · 마지막 ${new Date(run.ts).toISOString().slice(0, 19).replace("T", " ")}
${warn.length ? `\n> ⚠️ **하락 감지** — ${warn.join(" · ")}\n` : "\n> 하락 없음\n"}
| 회차 | 판정 | ${keys.join(" | ")} |
|---:|---|${keys.map(() => "---:").join("|")}|
${runs.slice(-10).map((r, i) => `| ${runs.length - Math.min(10, runs.length) + i + 1} | ${r.pass ? "승격" : "롤백(" + r.failed + ")"} | ${keys.map((k) => (r.metrics && r.metrics[k] != null ? r.metrics[k] : "-")).join(" | ")} |`).join("\n")}
`;
writeT(join(LEARN_DIR, "drift-report.md"), drift);

const md = `# 게이트 리포트

> 회차 ${runs.length} · 판정 **${failed ? "롤백" : "승격"}**${failed ? ` (미달: ${failed})` : ""}
> 스냅샷 \`${run.snapshot}\`

| 하네스 | 결과 | 값 | 비고 |
|---|---|---:|---|
${results.map((r) => `| ${r.id} | ${r.ok ? "PASS ✓" : "FAIL ✗"} | ${r.value != null ? r.value : "-"} | ${r.notes.join(" · ")} |`).join("\n")}
${failed ? `\n미달이 하나라도 나오면 **나머지를 돌리지 않고 즉시 멈춘 뒤 되돌린다.** 이번 회차는 ${snap.files.length}개 파일을 복원했다.\n` : "\n전 항목을 통과해 증분을 승격했다.\n"}
## 기준
- accuracy ≥99.2% **이면서 직전 대비 하락 ≤0.05%p** — 절대 기준만 보면 서서히 깎이는 걸 못 잡는다
- scenarios 100% · routing ≥97% · 나머지 전 항목 통과
`;
writeT(join(LEARN_DIR, "gate-report.md"), md);

console.log(`■ ledger 회차 ${runs.length} · docs/hi_learn/gate-report.md · drift-report.md`);
process.exit(failed ? 1 : 0);
