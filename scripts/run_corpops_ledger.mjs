/* ══════════════ 회계 엔진 가드 — CorpOps Phase 5 (형 지시 2026-11-11) ══════════════
   src/data/corpLedger.js 가 **장부로서 성립하는지** 브라우저 없이 단언한다.

   왜 러너가 필요한가
     회계는 틀려도 화면이 멀쩡하다. 차변·대변이 어긋난 전표 한 장은 숫자만 조금 바꿔 놓고
     조용히 섞여 들어간다. 그래서 눈이 아니라 항등식이 지켜야 한다.

   검사 6종
     ① 항등식   — corpLedgerIdentities 9항목 전건 통과. **화면과 같은 함수**를 부른다(두 벌로 적지 않는다).
     ② 분모     — 검사 대상이 0건이면 실패다. 빈 장부는 어떤 항등식도 통과시킨다.
     ③ 거부     — 차대 불일치·미등록 계정·음수·마감월 전표를 corpJvCheck 가 실제로 **거부**하는가.
                  (ⓐ 자기시험 — 정상 전표는 통과해야 한다. 늘 거부하는 함수는 검사가 아니다.)
     ④ 역분개   — 정정 경로가 차·대를 뒤집고 금액이 맞물리는가.
     ⑤ 승인     — AI 주체에게 승인 권한이 없는가(canApprove=false) · 전기 전표에 작성자≠승인자.
     ⑥ 파일럿   — 실데이터 반입 전까지 CORP_LEDGER_PILOT 가 true 이고 화면이 그 사실을 적는가.

   사용: node scripts/run_corpops_ledger.mjs
   게이트: 실패 1건이라도 있으면 exit 1 — 커밋 차단(scripts/githooks/pre-commit)
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const fails = [];
const oks = [];
const chk = (cond, label, got) => {
  if (cond) oks.push(label);
  else fails.push(label + (got === undefined ? "" : "  ← 실제: " + (typeof got === "string" ? got : JSON.stringify(got))));
};

/* ── 적재 — 데이터 레이어만. 화면(JSX)은 빌드 게이트가 본다. ── */
const LEDGER = "src/data/corpLedger.js";
const BOARD = "src/components/CorpLedger.jsx";
const ctx = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(ctx);
try { vm.runInContext(rd(LEDGER), ctx); }
catch (e) { console.error("[회계] " + LEDGER + " 적재 실패 — " + e.message); process.exit(1); }
const G = (expr) => vm.runInContext(expr, ctx);

/* ── ① 항등식 + ② 분모 ───────────────────────────────────────────────── */
const V = G("corpLedgerVerdict(CORP_JV_SEED, CORP_BANK_SEED)");
V.rows.forEach((r) => {
  chk(r.ok, `①항등식 ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `②분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(V.pass, "①항등식 전건 통과", V.fail.map((f) => f.ko));

/* 파일럿 전표 규모 — 완료 조건이 20~30건이다. 세 건짜리 장부로는 항등식이 의미가 없다. */
const seedN = G("CORP_JV_SEED.length");
chk(seedN >= 20, `②분모   파일럿 전표 ${seedN}건 (하한 20)`, seedN);
const postedN = G("corpPosted(CORP_JV_SEED).length");
chk(postedN >= 20, `②분모   전기 전표 ${postedN}건 (하한 20)`, postedN);
/* 승인 전 상태가 섞여 있어야 3단 결재가 화면에서 보인다 */
chk(seedN - postedN >= 2, "②분모   승인 전(기표·검토) 전표 2건 이상", seedN - postedN);

/* 대사에 **어긋나는 줄이 실제로 있는가** — 전부 맞는 자료로는 대사 화면이 아무것도 증명하지 못한다 */
const R = G("corpBankRecon(CORP_JV_SEED, CORP_BANK_SEED)");
chk(R.bankOnly.length > 0, "②분모   은행에만 있는 줄 > 0 (미기장 건)", R.bankOnly.length);
chk(R.bookOnly.length > 0, "②분모   장부에만 있는 줄 > 0 (미통과 건)", R.bookOnly.length);
chk(R.matched > 0, "②분모   자동 대사된 줄 > 0", R.matched);
chk(R.gap === 0, "①항등식 대사 조정 후 차이 0", R.gap);

/* ── ③ 거부 ─────────────────────────────────────────────────────────────
   ⓐ 자기시험을 먼저 한다 — 정상 전표를 거부하는 함수는 「전부 거부」일 뿐 검사가 아니다. */
const mk = (lines, d) => ({ id: "T", d: d || "2026-11-11", desc: "시험", by: "핀테크", st: "draft", l: lines });
const good = mk([["801", 1000, 0, "a"], ["103", 0, 1000, "b"]]);
const goodR = G("corpJvCheck")(good, { closed: [] });
chk(goodR.ok, "③거부ⓐ 자기시험 — 맞는 전표는 통과한다", goodR.errs);

const cases = [
  ["차대 불일치", mk([["801", 1000, 0, "a"], ["103", 0, 900, "b"]]), { closed: [] }],
  ["미등록 계정", mk([["999", 1000, 0, "a"], ["103", 0, 1000, "b"]]), { closed: [] }],
  ["음수 금액", mk([["801", -1000, 0, "a"], ["103", 0, -1000, "b"]]), { closed: [] }],
  ["한 줄 양변", mk([["801", 1000, 500, "a"], ["103", 0, 500, "b"]]), { closed: [] }],
  ["합계 0", mk([["801", 0, 0, "a"], ["103", 0, 0, "b"]]), { closed: [] }],
  ["분개 줄 없음", mk([]), { closed: [] }],
  ["적요 공백", { id: "T", d: "2026-11-11", desc: "  ", by: "핀테크", st: "draft", l: [["801", 1000, 0, ""], ["103", 0, 1000, ""]] }, { closed: [] }],
  ["날짜 형식", mk([["801", 1000, 0, "a"], ["103", 0, 1000, "b"]], "2026/11/11"), { closed: [] }],
  ["마감월 입력", mk([["801", 1000, 0, "a"], ["103", 0, 1000, "b"]], "2026-09-15"), { closed: ["2026-09"] }],
];
cases.forEach(([ko, jv, st]) => {
  const r = G("corpJvCheck")(jv, st);
  chk(!r.ok && r.errs.length > 0, `③거부   ${ko} — 저장 거부 + 사유 제시`, r.ok ? "통과시켰다" : "사유 없음");
});

/* 거부 사유에 **숫자**가 들어가야 고칠 수 있다 — 「오류입니다」만으로는 못 고친다 */
const diffMsg = G("corpJvCheck")(cases[0][1], { closed: [] }).errs.join(" ");
chk(/\d/.test(diffMsg) && diffMsg.indexOf("차이") >= 0, "③거부   차대 불일치 사유에 차이 금액 명시", diffMsg);

/* ── ④ 역분개 ───────────────────────────────────────────────────────────── */
const src0 = G("CORP_JV_SEED")[1];
const rev = G("corpJvReverse")(src0, "조성래", "2026-11-11");
const rs = G("corpJvSum")(rev), ss = G("corpJvSum")(src0);
chk(rs.ok, "④역분개 차대 일치", rs);
chk(rs.dr === ss.cr && rs.cr === ss.dr, "④역분개 차·대가 뒤집힌다", { 원: ss, 역: rs });
chk(rev.st === "draft" && !rev.ap, "④역분개 기표 상태로 시작(승인 없이 전기되지 않는다)", rev.st);
chk(rev.rev === src0.id, "④역분개 원전표 번호를 들고 있다", rev.rev);
chk(G("corpJvCheck")(rev, { closed: [] }).ok, "④역분개 저장 검사 통과");

/* ── ⑤ 승인 ─────────────────────────────────────────────────────────────── */
const actors = G("CORP_ACTORS");
const ai = actors.filter((a) => a.ai), human = actors.filter((a) => !a.ai);
chk(ai.length > 0 && ai.every((a) => a.canApprove === false), "⑤승인   AI 주체는 승인 권한이 없다", ai.map((a) => a.id + ":" + a.canApprove));
chk(human.some((a) => a.canApprove === true), "⑤승인   사람 주체에 승인 권한이 있다", human.map((a) => a.id + ":" + a.canApprove));
const self = G("corpPosted(CORP_JV_SEED)").filter((j) => !j.open && j.ap && j.by === j.ap);
chk(self.length === 0, "⑤승인   전기 전표에 동일인 승인 0건", self.map((j) => j.id));
const aiApproved = G("corpPosted(CORP_JV_SEED)").filter((j) => ai.some((a) => a.id === j.ap));
chk(aiApproved.length === 0, "⑤승인   AI 이름이 승인자 칸에 0건", aiApproved.map((j) => j.id));

/* 전이 함수 — 「왜 안 되는지」까지 돌려줘야 화면이 설명할 수 있다.
   ⓐ 자기시험 먼저 — 다른 사람이 승인하는 정상 경로는 열려 있어야 한다. */
const can = G("corpJvCanAdvance");
const inReview = G("CORP_JV_SEED").find((j) => j.st === "review");
const inDraft = G("CORP_JV_SEED").find((j) => j.st === "draft");
const posted0 = G("CORP_JV_SEED").find((j) => j.st === "posted");
chk(!!inReview && !!inDraft && !!posted0, "⑤승인ⓐ 세 상태(기표·검토·전기) 표본 확보", { inReview: !!inReview, inDraft: !!inDraft, posted0: !!posted0 });
if (inReview && inDraft && posted0) {
  const okPath = can(inReview, "조성래");
  chk(okPath.ok && okPath.to === "posted", "⑤승인ⓐ 자기시험 — 다른 사람의 승인은 통과한다", okPath.why);
  const byAi = can(inReview, "핀테크");
  chk(!byAi.ok && /AI/.test(byAi.why), "⑤승인   AI 주체의 승인 전이 거부 + 사유", byAi);
  const selfBy = can(Object.assign({}, inReview, { by: "조성래" }), "조성래");
  chk(!selfBy.ok && /작성자/.test(selfBy.why), "⑤승인   작성자 본인의 승인 전이 거부 + 사유", selfBy);
  const aiDraft = can(inDraft, "핀테크");
  chk(aiDraft.ok && aiDraft.to === "review", "⑤승인   AI는 검토 요청(기표 → 검토)까지 가능", aiDraft);
  const after = can(posted0, "조성래");
  chk(!after.ok && /역분개/.test(after.why), "⑤승인   전기 뒤 전이 거부 + 역분개 안내", after);
}

/* ── ⑥ 파일럿 표기 ──────────────────────────────────────────────────────── */
chk(G("CORP_LEDGER_PILOT") === true, "⑥파일럿 CORP_LEDGER_PILOT = true (실데이터 미반입)");
let board = "";
try { board = rd(BOARD); } catch (e) { fails.push("⑥파일럿 " + BOARD + " 없음 — 화면이 파일럿임을 적을 자리가 없다"); }
if (board) {
  chk(board.indexOf("파일럿 전표") >= 0, "⑥파일럿 화면에 「파일럿 전표」 표기", "없음");
  chk(/CORP_LEDGER_PILOT/.test(board), "⑥파일럿 화면이 플래그를 읽는다(문구 하드코딩 아님)", "없음");
  /* 사실과 다른 문구 금지 — 지시서 §11. 브라우저가 닫히면 아무것도 돌지 않는다. */
  const auto = board.split("자동 실행").length - 1;
  chk(auto === 0, "⑥파일럿 화면에 「자동 실행」 0건", auto + "건");
  /* 부정이 아니라 **명시**를 요구한다 — 「실제 장부」라는 낱말만 세면 그 사실을 부인하는 문장까지 걸린다 */
  chk(board.indexOf("실제 장부가 아닙니다") >= 0, "⑥파일럿 화면이 실제 장부가 아님을 명시", "없음");
  chk(board.indexOf("Phase 10") >= 0, "⑥파일럿 화면이 실데이터 반입 시점을 명시", "없음");
  /* 서버 없는 집행임을 숨기지 않는다 — 숨기면 더 위험하다 */
  chk(/서버가 없/.test(board), "⑥파일럿 화면이 서버 없는 집행임을 명시", "없음");
}

/* 저장 키 등재 — 카탈로그 게이트와 이중으로 본다(여기서 먼저 걸리면 원인이 분명하다) */
const KEY = G("CORP_LEDGER_KEY");
let cat = "";
try { cat = rd("src/data/dataCatalog.js"); } catch (e) { /* 아래 단언이 잡는다 */ }
chk(cat.indexOf('"' + KEY + '"') >= 0, `⑥파일럿 저장 키 ${KEY} dataCatalog.js 등재`, "미등재");

/* ── 보고 ───────────────────────────────────────────────────────────────── */
const total = oks.length + fails.length;
console.log(`[회계엔진] 파일럿 전표 ${seedN}건(전기 ${postedN}) · 계정 ${G("CORP_ACCT.length")}과목 · 은행 ${R.lines.length}줄(대사 ${R.matched} · 미대사 ${R.bankOnly.length + R.bookOnly.length})`);
const S = G("corpStatements(CORP_JV_SEED)");
console.log(`[회계엔진] 자산 ${G("corpWon")(S.bs.assets)} = 부채 ${G("corpWon")(S.bs.liab)} + 자본 ${G("corpWon")(S.bs.equity)} + 손익 ${G("corpWon")(S.pl.net)}`);
if (fails.length) {
  console.log(`[회계엔진] 통과 ${oks.length} · 실패 ${fails.length} / ${total}`);
  fails.forEach((f) => console.log("  ✗ " + f));
  console.log("[회계엔진] 장부가 성립하지 않습니다 — 커밋을 막습니다.");
  process.exit(1);
}
console.log(`[회계엔진] 통과 ${oks.length} / ${total} · 실패 0`);
process.exit(0);
