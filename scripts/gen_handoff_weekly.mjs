/* ══════════ 주간 학습 루프 리포트 — 지시서 프롬프트 v1.3 §7 학습 루프 (P6) ══════════
   입력: scripts/handoff_harness_snapshot.json(블록 사용 분포) + scripts/handoff_batch_report.json(등급·로스터 분포)
   산출: docs/hi_handoff/주간학습리포트_<날짜>.md + src/data/hmWeeklySnapshot.js(관제탑 ⑥ 타일)
   ⚠️ 규약(학습 루프): 자동은 신호 수집·후보 제시까지 — **문안 개선은 형 검수 후 hmScriptBlocks에만 반영**(자동 반영 금지).
   시연 환경이라 완결률 축은 '시연 분포' 라벨 — 실회원 완결률 학습은 론칭 게이트.
   실행: node scripts/gen_handoff_weekly.mjs [YYYY-MM-DD] */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEEK = process.argv[2] || new Date().toISOString().slice(0, 10);
const H = JSON.parse(readFileSync(join(ROOT, "scripts/handoff_harness_snapshot.json"), "utf8"));
const B = JSON.parse(readFileSync(join(ROOT, "scripts/handoff_batch_report.json"), "utf8"));
const blocksSrc = readFileSync(join(ROOT, "src/data/hmScriptBlocks.js"), "utf8");
const approvedIds = [...blocksSrc.matchAll(/id: "([^"]+)", part: "(?!channel|admin)[^"]+".*?approved: true/gs)].map(m => m[1]);
const idsSimple = [...blocksSrc.matchAll(/\{ id: "([^"]+)", part: "([^"]+)"/g)].filter(m => m[2] !== "channel" && m[2] !== "admin").map(m => m[1]);

const used = H.blocksUsed || {};
const rows = Object.entries(used).sort((a, b) => b[1] - a[1]);
const totalUse = rows.reduce((s, r) => s + r[1], 0);
/* 단조로움 신호 — 사용 점유 12% 초과 블록(표본 조립 기준) */
const monotony = rows.filter(([, n]) => n / totalUse > 0.12).map(([id, n]) => ({ id, n, share: Number((n / totalUse * 100).toFixed(1)) }));
/* 사각 신호 — 승인됐지만 표본 조립에서 한 번도 안 쓰인 블록(조립 규칙이 도달 못 하는 문안) */
const unused = idsSimple.filter(id => !used[id]);
/* 개선 후보 — 형 검수 대상 목록(자동 반영 없음) */
const candidates = [];
for (const m of monotony) candidates.push({ kind: "단조로움", id: m.id, why: `표본 대본의 ${m.share}% 점유 — 상황 세분 변형(추가 블록) 검토` });
for (const id of unused.slice(0, 8)) candidates.push({ kind: "미사용", id, why: "조립 규칙이 도달하지 않음 — 규칙 결선 또는 블록 정리 검토" });

const md = [
  `# 주간 학습 리포트 — ${WEEK} (지시서 엔진)`, "",
  `> 자동 수집 신호 + 개선 **후보**만. 문안 개선은 형 검수 후 hmScriptBlocks에만 반영(자동 반영 금지). [시연 분포]`, "",
  "## 1. 이번 주 배치 기준선",
  `- 코호트 ${B.total.toLocaleString()}명 · 카드 ${B.cards.toLocaleString()}건(발행 ${B.publishable === B.cards ? "100%" : B.publishable}) · H ${B.byGrade.H.toLocaleString()} · M ${B.byGrade.M.toLocaleString()} · L ${B.byGrade.L.toLocaleString()}`,
  `- 프로 ${B.pros}명 전원 조립 위반 ${B.rosterViol}건 · 일일 평균 ${B.avgRoster}건 · A5 회귀 ${H.coachAcc}%(${H.coachN}문항) · 금지어 ${H.forbiddenHits}건`, "",
  "## 2. 블록 사용 분포(표본 조립 " + H.sample.toLocaleString() + "명 기준 · 사용 " + Object.keys(used).length + "/" + idsSimple.length + "종)", "",
  "| 블록 | 사용 | 점유 |", "|---|---|---|",
  ...rows.slice(0, 10).map(([id, n]) => `| ${id} | ${n.toLocaleString()} | ${(n / totalUse * 100).toFixed(1)}% |`), "",
  "## 3. 신호 → 개선 후보(형 검수 대상)", "",
  candidates.length ? "| 신호 | 블록 | 검토 사유 |\n|---|---|---|\n" + candidates.map(c => `| ${c.kind} | ${c.id} | ${c.why} |`).join("\n")
    : "이번 주 개선 후보 없음.", "",
  "## 4. 다음 주 확인", "",
  "- 완결률 축(지시→접촉→완결)은 hiEvent 실기록 누적 후 합류 — 실회원 학습은 론칭 게이트.",
  "- 승인된 관리사무 블록 5건(ad-*)의 조립 결선은 만기·청구 트리거 배선(후속) 때 합류.", "",
  "---", "*하이젠케어(주) · 대외비 · P6 학습 루프 산출*",
].join("\n");
writeFileSync(join(ROOT, `docs/hi_handoff/주간학습리포트_${WEEK}.md`), md, "utf8");
writeFileSync(join(ROOT, "src/data/hmWeeklySnapshot.js"),
  "/* 자동 생성 — gen_handoff_weekly.mjs (P6). 관제탑 ⑥ 주간 학습 타일 — 손대지 말 것. 개선 반영은 형 검수 경유만 */\n"
  + "const HM_WEEKLY_SNAPSHOT = " + JSON.stringify({ week: WEEK, blockKinds: Object.keys(used).length, blockTotal: idsSimple.length,
    monotony: monotony.map(m => m.id), unused, candidates: candidates.map(c => ({ kind: c.kind, id: c.id })) }) + ";\n", "utf8");
console.log(`주간 리포트 생성 — 사용 ${Object.keys(used).length}/${idsSimple.length}종 · 단조 ${monotony.length} · 미사용 ${unused.length} · 후보 ${candidates.length}`);
