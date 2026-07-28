/* ══════════ Phase F — 학습 루프 1회전 ══════════
   수집(합성) → 수확 → 증분(스냅샷 포함) → 게이트(승격/롤백) → 드리프트

   실행: node scripts/learn/run.mjs [턴수]
   ⚠️ 현재 입력은 **데모용 합성 트래픽**입니다(실사용 로그 아님). */
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

const N = process.argv[2] || "1200";
const step = (label, args) => {
  console.log(`\n── ${label} ─────────────────────────────`);
  try { process.stdout.write(execFileSync("node", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })); return 0; }
  catch (e) { process.stdout.write(String((e.stdout || "") + (e.stderr || ""))); return e.status == null ? 1 : e.status; }
};

step("① 수집(합성 트래픽)", ["scripts/learn/simulate-traffic.mjs", N]);
step("② 수확", ["scripts/learn/harvest.mjs"]);
step("③ 증분(적용)", ["scripts/learn/promote.mjs", "--apply"]);
const code = step("④ 게이트", ["scripts/learn/gate.mjs"]);

console.log(`\n■ 1회전 종료 — ${code === 0 ? "승격" : "롤백"} · docs/hi_learn/ 리포트 확인`);
process.exit(code);
