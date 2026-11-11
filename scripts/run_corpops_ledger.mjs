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
     ⑦ 예실대비 — 계획 축(finBudget) ↔ 실적 축(corpLedger) 매핑표가 표로서 성립하는가.
                  **「대응 없음」이 실제로 화면에 셀 수 있게 나오는가**(Phase 6 완료 조건 ②).
                  그리고 **차이·달성률이 조건 밖에서 서지 않는가** — 사유가 붙은 행, 분모 0,
                  확정 전 후보에 숫자가 들어가면 기계가 사람 몫을 가로챈 것이라 실패로 센다.

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
const PA = "src/data/corpPlanActual.js";
const PABOARD = "src/components/CorpPlanActual.jsx";
const FINSCR = "src/components/Finance.jsx";
/* 화면 고지 검사(⑥)의 사정권 — 파일럿 전표를 쓰는 지면은 모두 같은 고지를 진다.
   한 파일만 보면 지면이 늘어날 때 검사가 조용히 빈다. */
const BOARDS = [BOARD, PABOARD];
const ctx = { console: { log() {}, warn() {}, error() {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
vm.createContext(ctx);
/* 계획 축을 같은 컨텍스트에 싣는다 — 예실 대비는 두 축을 다 봐야 단언이 선다.
   순서는 fin_site_check.mjs 와 같다(params → budget → model). */
const LOAD = ["src/data/finBudgetParams.js", "src/data/finBudget.js", "src/data/finModel.js", LEDGER, PA];
for (const f of LOAD) {
  try { vm.runInContext(rd(f), ctx); }
  catch (e) { console.error("[회계] " + f + " 적재 실패 — " + e.message); process.exit(1); }
}
/* 비목 이름의 원천은 재무계획 화면의 FIN_PL_ROWS 한 벌이다(사본을 만들지 않는다).
   JSX 라 vm 에 못 올리므로 그 배열만 떼어 넣는다. 못 떼면 이름 원천이 옮겨졌다는 뜻이라 실패시킨다. */
try {
  const m = rd(FINSCR).match(/const FIN_PL_ROWS = (\[[\s\S]*?\n\];)/);
  if (!m) throw new Error("FIN_PL_ROWS 배열을 찾지 못했다");
  vm.runInContext("var FIN_PL_ROWS = " + m[1], ctx);
} catch (e) {
  console.error("[회계] 비목 이름 원천 적재 실패 — " + e.message + " (" + FINSCR + ")");
  process.exit(1);
}
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
  /* 부정이 아니라 **명시**를 요구한다 — 「실제 장부」라는 낱말만 세면 그 사실을 부인하는 문장까지 걸린다 */
  chk(board.indexOf("실제 장부가 아닙니다") >= 0, "⑥파일럿 화면이 실제 장부가 아님을 명시", "없음");
  chk(board.indexOf("Phase 10") >= 0, "⑥파일럿 화면이 실데이터 반입 시점을 명시", "없음");
  /* 서버 없는 집행임을 숨기지 않는다 — 숨기면 더 위험하다 */
  chk(/서버가 없/.test(board), "⑥파일럿 화면이 서버 없는 집행임을 명시", "없음");
}
/* 파일럿 전표를 쓰는 지면은 **모두** 같은 고지를 진다 — 지면이 늘어도 검사가 비지 않는다 */
BOARDS.forEach((f) => {
  let t = "";
  try { t = rd(f); } catch (e) { fails.push("⑥파일럿 " + f + " 없음"); return; }
  chk(t.indexOf("파일럿 전표") >= 0, `⑥파일럿 ${f} 에 「파일럿 전표」 표기`, "없음");
  /* 사실과 다른 문구 금지 — 지시서 §11. 브라우저가 닫히면 아무것도 돌지 않는다. */
  const auto = t.split("자동 실행").length - 1;
  chk(auto === 0, `⑥파일럿 ${f} 에 「자동 실행」 0건`, auto + "건");
  /* ⑪ 판정 어법 — 「보완 필요」는 저장소에서 정확히 한 곳(Compliance.jsx)뿐이다 */
  const sup = t.split("보완 필요").length - 1;
  chk(sup === 0, `⑥파일럿 ${f} 에 「보완 필요」 0건(표기 규약 ⑪)`, sup + "건");
  /* ⑬ 같은장부 사상 — 산정 기준이 다른 두 축을 한쪽이 다른 쪽에 「반영된다」고 말하지 않는다.
     표기 규약 ⑬ 은 지금 SupplyOntology.jsx 전용이라 이 지면을 보지 못한다. 같은 사고를 여기서 막는다. */
  const screen = t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  [/손익계산서[^。\n]{0,40}에 반영됩니다/, /자동 전기/, /손익계산서[^。\n]{0,40}에서 확인/].forEach((re, i) => {
    chk(!re.test(screen), `⑥파일럿 ${f} 에 두 축을 같은 장부로 읽히게 하는 문안 0건(${i + 1})`, "걸림");
  });
});

/* 저장 키 등재 — 카탈로그 게이트와 이중으로 본다(여기서 먼저 걸리면 원인이 분명하다) */
const KEY = G("CORP_LEDGER_KEY");
let cat = "";
try { cat = rd("src/data/dataCatalog.js"); } catch (e) { /* 아래 단언이 잡는다 */ }
chk(cat.indexOf('"' + KEY + '"') >= 0, `⑥파일럿 저장 키 ${KEY} dataCatalog.js 등재`, "미등재");

/* ── ⑦ 예실 대비 ────────────────────────────────────────────────────────
   Phase 6 완료 조건 — ① 매핑 ② 「대응 없음」 화면 노출 ③ fin_site_check 32/32 유지.
   ③은 pre-commit 의 같은 블록에서 함께 돌린다(이 러너는 계획 축 상수를 읽기만 한다). */
const PACAL = "2026-11";                 /* 고정 날짜 주입 — 벽시계를 쓰지 않는다(결정론 규약) */
const PV = G("corpPaPass")(G("CORP_JV_SEED"), PACAL);
PV.rows.forEach((r) => {
  chk(r.ok, `⑦예실   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑦분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(PV.pass, "⑦예실   검산 전건 통과", PV.fail.map((f) => f.ko));

/* 달 경계 — 두 지면이 같은 「n월 말」을 다른 문자열로 자르면 같은 달에 다른 숫자가 난다 */
const cut = G("corpPaCut");
chk(cut("2026-09") === "2026-09-30", "⑦경계   9월 말 = 2026-09-30(없는 날짜를 만들지 않는다)", cut("2026-09"));
chk(cut("2028-02") === "2028-02-29", "⑦경계   윤년 2월 말 = 2028-02-29", cut("2028-02"));
chk(cut("2027-02") === "2027-02-28", "⑦경계   평년 2월 말 = 2027-02-28", cut("2027-02"));
chk(cut("") === "" && cut("2026-9") === "", "⑦경계   형식이 아니면 빈 문자열", [cut(""), cut("2026-9")]);
chk(G("corpPaPrevYm")("2027-01") === "2026-12", "⑦경계   연초의 전월 = 2026-12", G("corpPaPrevYm")("2027-01"));

/* 단월 차분 검산 — 누적 두 번 자른 차이가 그 달 발생액이다 */
const S10 = G("corpStatements")(G("CORP_JV_SEED"), "2026-10-31");
const S11 = G("corpStatements")(G("CORP_JV_SEED"), "2026-11-30");
const act11 = G("corpPaActual")(G("CORP_JV_SEED"), "2026-11");
const expX = Object.keys(act11).filter((c) => (G("corpAcct")(c) || {}).t === "X")
  .reduce((n, c) => n + act11[c], 0);
chk(expX === S11.pl.exp - S10.pl.exp, "⑦차분   단월 비용 합 = 누적 차이", { 차분: expX, 누적차: S11.pl.exp - S10.pl.exp });
chk(expX > 0, "⑦분모   단월 비용 > 0 (차분이 비면 아무것도 증명하지 않는다)", expX);

/* 부호 규약 — 실적을 계획 축과 **같은 부호**로 돌려줘야 차이가 성립한다.
   수익 계정은 대변이 정상이라 차−대가 음수로 나온다. 한 번 뒤집지 않으면 매출 행의 차이가
   통째로 거짓이 되고, 두 번 뒤집으면 비용이 전부 음수가 된다. 양쪽을 다 단언한다. */
const sep = G("corpPaActual")(G("CORP_JV_SEED"), "2026-09");
const revMoved = G("CORP_ACCT").filter((a) => a.t === "R").map((a) => a.c).filter((c) => sep[c] !== 0);
const expMoved = G("CORP_ACCT").filter((a) => a.t === "X").map((a) => a.c).filter((c) => sep[c] !== 0);
chk(revMoved.length > 0, "⑦분모   수익 계정 움직임 > 0 (부호 시험의 분모)", revMoved);
chk(expMoved.length > 0, "⑦분모   비용 계정 움직임 > 0 (부호 시험의 분모)", expMoved);
chk(revMoved.every((c) => sep[c] > 0), "⑦부호   수익이 양수로 나온다(계획 축과 같은 규약)",
  revMoved.map((c) => c + ":" + sep[c]).join(" "));
chk(expMoved.every((c) => sep[c] > 0), "⑦부호   비용도 양수로 나온다(두 번 뒤집지 않는다)",
  expMoved.map((c) => c + ":" + sep[c]).join(" "));
/* 손익계산서와 같은 값이어야 한다 — 단월 수익 합 = 그 달 누적 수익(9월이 첫 달이다) */
const S09 = G("corpStatements")(G("CORP_JV_SEED"), "2026-09-30");
chk(revMoved.reduce((n, c) => n + sep[c], 0) === S09.pl.rev,
  "⑦부호   단월 수익 합 = 손익계산서 수익", { 단월: revMoved.reduce((n, c) => n + sep[c], 0), 손익: S09.pl.rev });

/* 교집합 — 상수로 박지 않고 양쪽 축에서 계산한다. 전표가 늘면 교집합도 늘어야 한다. */
const PM = G("corpPaMonths")(G("CORP_JV_SEED"));
chk(PM.length > 0, "⑦기간   비교 가능 달 > 0", PM);
chk(PM.indexOf("2026-09") < 0, "⑦기간   계획 행이 없는 달(2026-09)은 교집합 밖", PM);
chk(PM.every((m) => /^\d{4}-\d{2}$/.test(m)), "⑦기간   교집합 달이 YYYY-MM 형식", PM);
/* ⓐ 자기시험 — 교집합 밖 달을 넣으면 모든 행이 사유를 달고 숫자를 내지 않아야 한다 */
const outRows = G("corpPaRows")(G("CORP_JV_SEED"), "2026-09");
chk(outRows.length > 0 && outRows.every((r) => r.why === "out" && r.diff === null && r.rate === null),
  "⑦예실ⓐ 교집합 밖 달 — 전행 사유 「비교 기간 밖」 · 차이 0건", outRows.filter((r) => r.why !== "out").length + "건 예외");
/* ⓑ 교집합 안이어도 준비기간이면 손익 밖이다 — 지금의 정답이 이것이다 */
const preRows = G("corpPaRows")(G("CORP_JV_SEED"), PACAL);
chk(preRows.every((r) => r.diff === null), "⑦예실ⓑ 준비기간 달 — 차이 0건(계획 손익이 전부 0이다)",
  preRows.filter((r) => r.diff !== null).length + "건");

/* 계획 객체를 고치지 않는다 — fbModel 은 캐시된 같은 객체를 돌려준다 */
const before = JSON.stringify(G("fbModel()").ledger.plan[0].pl);
G("corpPaRows")(G("CORP_JV_SEED"), PACAL);
G("corpPaUnmatched")(G("CORP_JV_SEED"), PACAL);
chk(JSON.stringify(G("fbModel()").ledger.plan[0].pl) === before,
  "⑦무해   계획 원장을 건드리지 않는다(캐시된 같은 객체다)", "변형됨");

/* 결정론 — 같은 입력에 같은 결과 */
const once = JSON.stringify(G("corpPaRows")(G("CORP_JV_SEED"), PACAL));
const twice = JSON.stringify(G("corpPaRows")(G("CORP_JV_SEED"), PACAL));
chk(once === twice, "⑦결정론 같은 입력 · 같은 결과");
let paSrc = "";
try { paSrc = rd(PA); } catch (e) { fails.push("⑦예실   " + PA + " 없음"); }
if (paSrc) {
  const bare = paSrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑦결정론 Math.random 0건");
  chk((bare.match(/new Date\(\s*\)/g) || []).length === 0, "⑦결정론 인자 없는 new Date() 0건");
}

/* 화면 — 매핑을 두 벌로 적지 않는다. 계정 코드·비목 키 리터럴은 데이터 파일에만 있어야 한다. */
let pab = "";
try { pab = rd(PABOARD); } catch (e) { fails.push("⑦예실   " + PABOARD + " 없음"); }
if (pab) {
  chk(pab.indexOf("corpPaRows(") >= 0 && pab.indexOf("corpPaUnmatched(") >= 0,
    "⑦화면   화면이 대조·여집합 함수를 부른다(따로 더하지 않는다)", "없음");
  chk(pab.indexOf("corpPaVerdict(") >= 0 || pab.indexOf("corpPaPass(") >= 0,
    "⑦화면   화면의 검산이 러너와 같은 함수다", "없음");
  const lits = (pab.match(/"(?:1[0-9]{2}|2[0-9]{2}|3[0-9]{2}|4[0-9]{2}|8[0-9]{2}|9[0-9]{2})"/g) || []);
  chk(lits.length === 0, "⑦화면   화면에 계정 코드 리터럴 0건(매핑은 데이터 파일 한 곳에만)", lits.join(","));
  chk(pab.indexOf("대응 없음") >= 0 && pab.indexOf("확정 대기") >= 0,
    "⑦화면   「대응 없음」·「확정 대기」를 나눠 적는다", "없음");
  chk(/산정 기준이 다릅니다/.test(pab), "⑦화면   두 축의 산정 기준이 다름을 명시", "없음");
  chk(/원인은? ?사람이 확정|차이의 원인은 사람이 확정|원인을 사람이 확정/.test(pab.replace(/\s+/g, " ")) || /원인은 사람이 확정합니다/.test(pab.replace(/\s+/g, " ")),
    "⑦화면   차이의 원인 확정이 사람 몫임을 명시", "없음");
}

/* 게이트가 제 사정권을 지킨다 — 새 파일이 훅 정규식에 들어 있는가 */
let hook = "";
try { hook = rd("scripts/githooks/pre-commit"); } catch (e) { fails.push("⑦게이트 pre-commit 읽기 실패"); }
if (hook) {
  ["corpPlanActual", "CorpPlanActual"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑦게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
  chk(hook.indexOf("fin_site_check.mjs") >= 0,
    "⑦게이트 pre-commit 이 계획 축 러너(fin_site_check)를 부른다 — 완료 조건 32/32", "미등재");
}

/* ── 보고 ───────────────────────────────────────────────────────────────── */
const total = oks.length + fails.length;
console.log(`[회계엔진] 파일럿 전표 ${seedN}건(전기 ${postedN}) · 계정 ${G("CORP_ACCT.length")}과목 · 은행 ${R.lines.length}줄(대사 ${R.matched} · 미대사 ${R.bankOnly.length + R.bookOnly.length})`);
const S = G("corpStatements(CORP_JV_SEED)");
console.log(`[회계엔진] 자산 ${G("corpWon")(S.bs.assets)} = 부채 ${G("corpWon")(S.bs.liab)} + 자본 ${G("corpWon")(S.bs.equity)} + 손익 ${G("corpWon")(S.pl.net)}`);
const PU = G("corpPaUnmatched")(G("CORP_JV_SEED"), PACAL);
console.log(`[예실대비] 계획 비목 ${PU.leaves}(확정 ${PU.planOk.length} · 후보 ${PU.planAsk.length} · 대응없음 ${PU.planNone.length}) · ` +
  `손익 계정 ${PU.accts}(확정 ${PU.acctOk.length} · 후보 ${PU.acctAsk.length} · 대응없음 ${PU.acctNone.length}) · ` +
  `비교 가능 달 ${PM.join("·") || "없음"} · 차이 산출 ${preRows.filter((r) => r.diff !== null).length}행`);
if (fails.length) {
  console.log(`[회계엔진] 통과 ${oks.length} · 실패 ${fails.length} / ${total}`);
  fails.forEach((f) => console.log("  ✗ " + f));
  console.log("[회계엔진] 장부가 성립하지 않습니다 — 커밋을 막습니다.");
  process.exit(1);
}
console.log(`[회계엔진] 통과 ${oks.length} / ${total} · 실패 0`);
process.exit(0);
