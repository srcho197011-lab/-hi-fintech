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
     ⑫ 자료실   — 저장소 목차를 **팀별로** 게시하는가 · 목록을 코드에 박지 않는가 ·
                  분류를 한 곳에서만 하는가 · 확정 자료(확인원)를 작업본과 가르는가.
     ⑪ 반입대화 — 민감자료가 **미리보기보다 먼저** 걸리는가 · 틀린 줄만 빠지는가 ·
                  도구 없는 에이전트가 답을 **지어내지 않는가**(실제로 물어보는 양성 검사) ·
                  시키면 거절하고 물으면 답하는가.
     ⑩ 결재릴리스 — 승인 없이 상태가 넘어가지 않는가 · 동일인 승인을 탐지해 **기록**하는가 ·
                   늘 거부하는 벽이 아니라 조건이 서면 열리는 게이트인가(자기시험) ·
                   보안 현황의 게이트 목록이 훅과 **대조**되는가.
     ⑨ 인사계약 — 주민번호 값을 담는 자리가 **구조적으로** 없는가 · 만료일 없는 계약을 거부하는가 ·
                  확인하지 않은 조문을 찍지 않는가 · **민감자료 차단 게이트의 음성 테스트가 실제로 서는가**.
     ⑧ 주간회의 — 참석 인원이 **자리가 아니라 사람**인가 · 확정자 없는 팀에 확정 경로가 없는가 ·
                  근거 없는 팀에 지표를 싣지 않는가 · 즉석 조회에 미확정 배지가 붙는가 ·
                  「밀림」이 생성 경로 있는 루틴에만 붙는가 · 사내 회의가 회원 영상 모듈을 끌어오지 않는가.
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
import { spawnSync } from "node:child_process";
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
const MTG = "src/data/corpMeeting.js";
const MTGBOARD = "src/components/CorpMeeting.jsx";
const ORG = "src/data/corpOrg.js";
/* 화면 어법 검사의 사정권 — 파일럿 고지(BOARDS)와 달리 **모든 사내 지면**이 진다.
   「자동 실행」·「보완 필요」·회원 영상 모듈 참조는 지면 종류를 가리지 않는다. */
const SURFACES = [BOARD, PABOARD, MTGBOARD, "src/components/CorpAdmin.jsx", "src/components/CorpGov.jsx",
  "src/components/CorpUpload.jsx", "src/components/CorpAgentChat.jsx", "src/components/CorpVault.jsx",
  "src/components/CorpOps.jsx"];
const LOAD = ["src/data/finBudgetParams.js", "src/data/finBudget.js", "src/data/finModel.js",
  ORG, LEDGER, PA, MTG, "src/data/corpAdmin.js", "src/data/corpGov.js",
  "src/data/corpUpload.js", "src/data/dataCatalog.js", "src/data/corpAgent.js", "src/data/corpVault.js",
  "src/data/corpBankXlsx.js", "src/data/corpBankJv.js"];   /* 매니페스트와 **같은 순서** — 어긋나면 러너 녹색·브라우저 사망 */
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
  /* 보류는 통과도 실패도 아니다 — 대신 **이유를 반드시 지닌다**. 이유 없는 보류는
     「검사를 껐다」와 구별되지 않는다. 그래서 보류 줄은 이유로 센다. */
  if (r.skip) { chk(!!(r.why || "").trim(), `①보류   ${r.ko} — 보류 이유가 적혀 있다`, "이유 없음"); return; }
  chk(r.ok, `①항등식 ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `②분모   ${r.ko} 검사 대상 > 0`, r.n);
});
/* 보류가 조용히 번지지 않게 — 보류로 둘 수 있는 항등식을 **이름으로 못 박는다** */
const SKIPPABLE = ["bank", "chain", "balmatch"];
chk(V.rows.filter((r) => r.skip).every((r) => SKIPPABLE.indexOf(r.k) >= 0),
  "①보류   보류는 은행 축 세 줄에서만 난다(다른 검사를 끄지 못한다)", V.rows.filter((r) => r.skip && SKIPPABLE.indexOf(r.k) < 0).map((r) => r.k));
chk(V.rows.filter((r) => !r.skip).length >= 8, "②분모   실제로 도는 항등식 ≥ 8", V.rows.filter((r) => !r.skip).length);
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
  /* 반입된 전표가 있으면 화면이 파일럿 배지를 **내린다** — 둘을 동시에 달아 두면
     어느 장부를 보고 있는지 화면이 말해 주지 않는다. 플래그 하나로 갈리지 않고 상황으로 갈린다. */
  chk(/CORP_LEDGER_PILOT && !live/.test(board), "⑥파일럿 반입 전표가 있으면 파일럿 고지를 내린다", "없음");
  chk(/corpJvLive\(st\)/.test(board), "⑥파일럿 화면이 반입 여부를 상황에서 읽는다(corpJvLive)", "없음");
  chk(board.indexOf("반입 전표") >= 0, "⑥파일럿 반입 상태 표기가 따로 있다", "없음");
  chk(/이 브라우저에만/.test(board), "⑥파일럿 반입 장부가 이 브라우저에만 있다고 적는다", "없음");
  /* 서버 없는 집행임을 숨기지 않는다 — 숨기면 더 위험하다 */
  chk(/서버가 없/.test(board), "⑥파일럿 화면이 서버 없는 집행임을 명시", "없음");
}
/* 파일럿 전표를 쓰는 지면은 **모두** 같은 고지를 진다 — 지면이 늘어도 검사가 비지 않는다 */
BOARDS.forEach((f) => {
  let t = "";
  try { t = rd(f); } catch (e) { fails.push("⑥파일럿 " + f + " 없음"); return; }
  chk(t.indexOf("파일럿 전표") >= 0, "⑥파일럿 " + f + " 에 「파일럿 전표」 표기", "없음");
});
/* 화면 어법 — **주석을 걷은 본문** 기준이다. 표기 규약 ⑪·⑬ 이 주석 제거본으로 세므로 기준을 맞춘다.
   원문으로 세면 금지를 설명한 주석에서 한쪽 러너만 터지고, 그러면 사람이 주석을 지워 가드를 통과시키는 사고가 난다. */
SURFACES.forEach((f) => {
  let t = "";
  try { t = rd(f); } catch (e) { fails.push("⑥어법 " + f + " 없음"); return; }
  const screen = t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  /* 사실과 다른 문구 금지 — 지시서 §11. 브라우저가 닫히면 아무것도 돌지 않는다. */
  const auto = screen.split("자동 실행").length - 1;
  chk(auto === 0, "⑥어법   " + f + " 화면에 「자동 실행」 0건", auto + "건");
  /* ⑪ 판정 어법 — 「보완 필요」는 저장소에서 정확히 한 곳(Compliance.jsx)뿐이다 */
  const sup = screen.split("보완 필요").length - 1;
  chk(sup === 0, "⑥어법   " + f + " 화면에 「보완 필요」 0건(표기 규약 ⑪)", sup + "건");
  /* ⑬ 같은장부 사상 — 산정 기준이 다른 두 축을 한쪽이 다른 쪽에 「반영된다」고 말하지 않는다.
     표기 규약 ⑬ 은 지금 SupplyOntology.jsx 전용이라 이 지면들을 보지 못한다. 같은 사고를 여기서 막는다. */
  [/손익계산서[^。\n]{0,40}에 반영됩니다/, /자동 전기/, /손익계산서[^。\n]{0,40}에서 확인/].forEach((re, i) => {
    chk(!re.test(screen), "⑥어법   " + f + " 에 두 축을 같은 장부로 읽히게 하는 문안 0건(" + (i + 1) + ")", "걸림");
  });
  /* 회원 영상 상담 모듈을 사내 지면이 끌어오지 않는다 — 회원 보호 게이트가 직원을 막고,
     회의 기록이 회원 접촉·프로 위반 집계에 섞인다. 완료 조건의 코드판이다. */
  const vs = t.split("videoSession").length - 1;
  chk(vs === 0, "⑥어법   " + f + " 에 videoSession 참조 0건", vs + "건");
});

/* ── ⑥-2 은행 대사 상대 ─────────────────────────────────────────────────
   반입된 전표를 파일럿 은행줄과 대사하면 전 건이 미대사로 뜨고,
   그걸 보고 사람은 「장부가 틀렸나」 한다. 상대가 없으면 돌리지 않고, 돌리지 않았다고 말해야 한다. */
const bankOf = G("corpBankOf");
chk(bankOf({ jv: [], bank: [] }) === G("CORP_BANK_SEED"),
  "⑥은행   반입분이 없으면 파일럿 은행줄을 쓴다");
chk(bankOf({ jv: [{ id: "20260930-01" }], bank: [] }) === null,
  "⑥은행   실제 전표 + 은행 미반입 → null(대사를 돌리지 않는다)",
  JSON.stringify(bankOf({ jv: [{ id: "x" }], bank: [] })));
const bkLive = bankOf({ jv: [{ id: "x" }], bank: [{ d: "2026-10-01", a: 100, m: "입금" }] });
chk(!!bkLive && bkLive.live === true && bkLive.lines.length === 1,
  "⑥은행   반입된 은행 내역이 있으면 그걸 쓴다", JSON.stringify(bkLive));
const RN = G("corpBankRecon")(G("CORP_JV_SEED"), null, "");
chk(RN.none === true && RN.lines.length === 0 && RN.gap === 0,
  "⑥은행   상대가 없으면 은행줄 0 · 차이 0", JSON.stringify({ none: RN.none, n: RN.lines.length, gap: RN.gap }));
chk(RN.book.length > 0, "⑥분모   대사 보류여도 장부 쪽은 보여 주는가", RN.book.length);
const VN = G("corpLedgerVerdict")(G("CORP_JV_SEED"), null, "");
chk(VN.skip.map((r) => r.k).sort().join(" ") === "balmatch bank chain",
  "⑥보류   상대가 없으면 은행 축 세 줄이 **모두** 보류로 잡힌다", VN.skip.map((r) => r.k).join(" "));
chk(VN.skip.every((r) => (r.why || "").trim()), "⑥보류   보류 항등식은 이유를 지닌다", VN.skip.map((r) => r.why));
chk(VN.zero.length === 0, "⑥보류   보류를 「분모 0 실패」로 세지 않는다", VN.zero.map((r) => r.k));
const VS = G("corpLedgerVerdict")(G("CORP_JV_SEED"), G("CORP_BANK_SEED"), "");
/* 검증용 묶음은 일부러 미대사를 품는다 — 잔액 사슬은 **돌고**, 장부 대조만 보류다.
   「보류가 0」을 바라면 검증용 묶음이 통과하려고 자기 성질을 지워야 한다. */
chk(VS.skip.map((r) => r.k).sort().join(" ") === "balmatch bank",
  "⑥보류   은행줄이 있으면 잔액 사슬은 **돈다**(항진식과 계좌 전체 대조만 보류)", VS.skip.map((r) => r.k));
const chRow = VS.rows.find((r) => r.k === "chain");
chk(!!chRow && !chRow.skip && chRow.n > 0 && chRow.ok,
  "⑥잔액   검증용 은행 묶음의 잔액 사슬이 전건 성립한다", JSON.stringify(chRow && { n: chRow.n, ok: chRow.ok, got: chRow.got }));
/* ⓐ 음성 — 한 줄을 지우면 사슬이 **깨져야** 한다. 안 깨지면 검사가 없는 것이다. */
const seedCut = Object.assign({}, G("CORP_BANK_SEED"), { lines: G("CORP_BANK_SEED").lines.filter((l, i) => i !== 5) });
const VCut = G("corpLedgerVerdict")(G("CORP_JV_SEED"), seedCut, "");
const chCut = VCut.rows.find((r) => r.k === "chain");
chk(!!chCut && !chCut.skip && !chCut.ok, "⑥잔액ⓐ 은행 한 줄을 지우면 잔액 사슬이 깨진다(흘린 거래를 잡는다)", JSON.stringify(chCut && chCut.got));
/* ⓑ 음성 — 금액만 1원 비틀어도 깨져야 한다 */
const seedBend = Object.assign({}, G("CORP_BANK_SEED"), { lines: G("CORP_BANK_SEED").lines.map((l, i) => (i === 5 ? Object.assign({}, l, { a: l.a + 1 }) : l)) });
const chBend = G("corpLedgerVerdict")(G("CORP_JV_SEED"), seedBend, "").rows.find((r) => r.k === "chain");
chk(!!chBend && !chBend.ok, "⑥잔액ⓐ 금액을 1원 비틀어도 잔액 사슬이 깨진다", JSON.stringify(chBend && chBend.got));
/* ⓒ 「언제나 맞는 검사」를 통과로 세지 않는다 — gap 은 조작한 은행줄에도 0이다 */
const fake = { acct: "103", bank: "지어낸 줄", mask: "", live: true, from: "2026-01-01", to: "2026-01-02",
  lines: [{ d: "2026-01-01", a: 1, bal: 1, m: "ㄱ" }, { d: "2026-01-02", a: 2, bal: 3, m: "ㄴ" }] };
const VF = G("corpLedgerVerdict")(G("CORP_JV_SEED"), fake, "");
const gapRow = VF.rows.find((r) => r.k === "bank");
chk(gapRow.ok && gapRow.skip,
  "⑥항진   지어낸 은행줄에도 대사 차이는 0이다 — 그래서 판정에서 뺀다", JSON.stringify({ ok: gapRow.ok, skip: gapRow.skip }));
chk(/구조적으로/.test(gapRow.why || ""), "⑥항진   왜 판정에서 뺐는지 화면이 읽을 이유가 붙어 있다", gapRow.why);
const balRow = VF.rows.find((r) => r.k === "balmatch");
chk(!balRow.skip && !balRow.ok, "⑥항진   그 지어낸 줄은 **잔액 대조에서 걸린다**", balRow.got);
chk(VS.rows.length === VN.rows.length, "⑥보류   보류로 항등식 항목을 지우지 않는다", [VS.rows.length, VN.rows.length]);
if (board) {
  chk(/V\.skip/.test(board), "⑥보류   화면이 보류 수를 적는다", "없음");
  chk(/R\.none/.test(board), "⑥보류   은행 지면이 상대 없음을 가른다", "없음");
  chk(board.indexOf("돌리지 않았습니다") >= 0, "⑥보류   화면이 「돌리지 않았다」고 적는다", "없음");
  chk(/value={corpPaCut\(m\)}/.test(board), "⑥경계   기준일 선택지가 실제 월말이다(9월 31일은 없다)", "-31 고정");
  chk(!/m \+ "-31"/.test(board), "⑥경계   없는 날짜를 만들지 않는다", "m + -31 남아 있음");
  chk(board.indexOf("corpBankOf(st)") >= 0, "⑥은행   화면이 은행줄을 상황에서 골랐다", "CORP_BANK_SEED 직접 사용");
  chk(!/corpLedgerVerdict\(jvs, CORP_BANK_SEED/.test(board) && !/corpBankRecon\(jvs, CORP_BANK_SEED/.test(board),
    "⑥은행   화면이 파일럿 은행줄을 고정으로 박지 않는다", "박혀 있음");
}

/* ── ⑥-3 보존 두 축 ───────────────────────────────────────────────────────
   keep 0 은 **영구**다. falsy 로 읽으면 영구 보존이 「미정」으로 둔갑하고,
   그 「미정」을 보고 사람이 자료를 버린다. 한 자리에서만 틀려도 그렇게 된다. */
const KS = G("corpKeepSet"), KK = G("corpKeepKo"), YK = G("corpYearsKo"), DA = G("corpDisposeAt");
const DCLS = G("CORP_DOC_CLASS");
const clsFs = DCLS.find((d) => d.k === "fs"), clsAcct = DCLS.find((d) => d.k === "acct");
chk(!!clsFs && clsFs.keep === 0, "⑥보존   재무제표 분류가 있고 영구보관이다", clsFs && clsFs.keep);
chk(!!clsAcct && clsAcct.keep === 10, "⑥보존   회계장부 · 전표는 10년", clsAcct && clsAcct.keep);
chk(clsFs.k !== clsAcct.k, "⑥보존   둘은 다른 분류다(묶으면 10년 뒤 함께 버린다)");
chk((clsAcct.ex || "").indexOf("재무제표") < 0,
  "⑥보존   장부 분류 예시에 재무제표가 남아 있지 않다", clsAcct.ex);
chk(KK(clsFs) === "영구" && KS(clsFs) === true, "⑥보존   keep 0 을 「영구」로 읽는다(미정 아니다)", KK(clsFs));
chk(KK({ keep: null }) === "미정" && KS({ keep: null }) === false, "⑥보존ⓐ 정하지 않은 것은 미정이다", KK({ keep: null }));
chk(KK({ keep: 10 }) === "10년", "⑥보존   연한은 년으로 읽는다", KK({ keep: 10 }));
chk(YK(0) === "영구" && YK(5) === "5년" && YK(null) === "—", "⑥보존   법정 연한 표기도 같은 사상", [YK(0), YK(5), YK(null)]);
chk(DA("2026-10-23", clsFs) === "", "⑥폐기   영구보관은 폐기 예정일을 만들지 않는다", DA("2026-10-23", clsFs));
chk(DA("2026-10-23", clsAcct) === "2036-10-23", "⑥폐기   10년 보존 → 수정일 + 10년", DA("2026-10-23", clsAcct));
chk(DA("2026-10-23", { keep: null }) === "", "⑥폐기ⓐ 보존이 미정이면 폐기 예정일을 찍지 않는다", DA("2026-10-23", { keep: null }));
chk(DA("", clsAcct) === "" && DA("2026-10", clsAcct) === "", "⑥폐기   수정일 형식이 아니면 지어내지 않는다", [DA("", clsAcct), DA("2026-10", clsAcct)]);
const KVK = G("CORP_VAULT_KIND");
["fsconf", "fs"].forEach((k) => {
  const K = KVK.find((x) => x.k === k);
  chk(!!K && K.cls === "fs", "⑥보존   자료실 「" + (K ? K.ko : k) + "」이 재무제표 분류를 가리킨다", K && K.cls);
});
const vconf = "HF_하이젠케어_재무제표확인원26.10.23.pdf";
const vrow = G("corpVaultRows")({ list: [{ rel: "02.회계/" + vconf, name: vconf, size: 1, at: "2026-10-23" }] })[0];
chk(!!vrow && vrow.keep === 0 && vrow.keepKo === "영구" && vrow.dispose === "",
  "⑥보존   확인원 한 줄이 영구 · 폐기 없음으로 내려왔다", JSON.stringify(vrow && { keep: vrow.keep, ko: vrow.keepKo, dp: vrow.dispose }));
const vledg = "총계정원장.xlsx";
const vrow2 = G("corpVaultRows")({ list: [{ rel: "02.회계/" + vledg, name: vledg, size: 1, at: "2026-10-23" }] })[0];
chk(!!vrow2 && vrow2.keep === 10 && vrow2.dispose === "2036-10-23",
  "⑥보존   장부 한 줄은 10년 · 폐기 2036-10-23", JSON.stringify(vrow2 && { keep: vrow2.keep, dp: vrow2.dispose }));
[["src/components/CorpAdmin.jsx", "corpKeepKo"], ["src/components/CorpVault.jsx", "r.keep"]].forEach(([f, n]) => {
  let t = "";
  try { t = rd(f); } catch (e) { fails.push("⑥보존 " + f + " 없음"); return; }
  chk(t.indexOf(n) >= 0, "⑥보존   " + f + " 가 회사 보존을 읽는다(" + n + ")", "없음");
  chk(!/d\.keep \?/.test(t.replace(/\/\*[\s\S]*?\*\//g, "")),
    "⑥보존   " + f + " 가 keep 을 falsy 로 보지 않는다(0 = 영구)", "falsy 판정");
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

/* ── ⑧ 주간회의 ─────────────────────────────────────────────────────────
   완료 조건 5가지를 단언으로 1:1 대응시킨다 —
     「자동 실행」 0건          → ⑥어법 블록(위)
     초안/확정 상태 구분        → ⑧-상태 · ⑧-공석
     미종결 후속조치 선두       → ⑧-선두(양성 표본을 만들어 확인한다)
     즉석 조회에 미확정 배지     → ⑧-배지(표본 1건 이상을 분모로 둔다)
     videoSession 참조 0건     → ⑥어법 블록(위) */
const MNOW = new Date(2026, 10, 11, 14, 0);          /* 고정 날짜 주입 — 벽시계를 쓰지 않는다 */
ctx.MNOW = MNOW;
const MW = G("corpMtgWeek")(MNOW);
chk(!!MW && MW.at > MNOW, "⑧회의   주차 앵커가 다음 회의다(지난 회의를 가리키지 않는다)", MW && MW.key);
chk(MW && MW.key === "2026-11-16", "⑧회의   2026-11-11(수) 기준 다음 회의 = 2026-11-16", MW && MW.key);
/* ⓐ 자기시험 — 회의가 끝난 뒤에는 다음 주로 넘어가야 한다 */
const MWafter = G("corpMtgWeek")(new Date(2026, 10, 16, 12, 0));
chk(MWafter && MWafter.key === "2026-11-23", "⑧회의ⓐ 회의 종료 뒤 다음 주차로 넘어간다", MWafter && MWafter.key);

const MST0 = G("corpMtgRead")();
const ENS = G("corpMtgEnsure")(MST0, MW);
chk(ENS.made === true, "⑧생성   열람 시 그 주차 골격을 만든다(다음 열람 시 생성)", ENS.made);
const MST = ENS.st;
const WK = G("corpMtgOf")(MST, MW);
const TEAMS = G("CORP_TEAMS");
chk(!!WK && WK.reports.length === TEAMS.length, "⑧생성   팀 수만큼 보고 골격", WK && WK.reports.length);
chk(G("corpMtgEnsure")(MST, MW).made === false, "⑧생성   이미 있으면 다시 만들지 않는다(덮어쓰지 않는다)");

/* 참석 — 자리가 아니라 사람이다 */
const ATT = G("corpMtgAttend")();
const SUM = G("CORP_SUMMARY");
chk(ATT.people.length === SUM.peopleN, "⑧인원   참석 사람 수 = 재직자 수(자리 수가 아니다)", { 참석: ATT.people.length, 재직: SUM.peopleN, 자리: SUM.filled });
chk(ATT.people.length !== SUM.filled, "⑧인원   자리 수와 사람 수가 구분된다(겸임을 한 사람으로 센다)", { 사람: ATT.people.length, 자리: SUM.filled });
chk(ATT.vacant.length === SUM.pendingN, "⑧인원   공석 수 = 합류 전 책임자 수", { 공석: ATT.vacant.length, 합류전: SUM.pendingN });
chk(ATT.vacant.length > 0, "⑧분모   공석 표본 > 0 (없으면 공석 처리가 증명되지 않는다)", ATT.vacant.length);
chk(ATT.people.every((p) => !ATT.vacant.some((v) => v.name === p.name)),
  "⑧인원   공석자가 참석자 명단에 섞이지 않는다", ATT.vacant.map((v) => v.name).join(" "));
chk(ATT.agents.length === TEAMS.length, "⑧인원   AI 팀장 = 팀 수", ATT.agents.length);
const SCHED = G("CORP_SCHEDULE");
chk(SCHED.weekly.joinPeople !== ATT.people.length,
  "⑧인원   joinPeople 리터럴을 참석자 수로 쓰지 않는다(값이 실제와 다르다는 사실 자체를 고정한다)",
  { 리터럴: SCHED.weekly.joinPeople, 실제: ATT.people.length });

/* 상태 — 확정자 없는 팀에 확정 경로를 두지 않는다 */
const REPS = WK.reports;
const noOwner = REPS.filter((r) => r.head === 0);
const canFix = REPS.filter((r) => r.head > 0);
chk(noOwner.length > 0, "⑧분모   확정자 공석 팀 표본 > 0", noOwner.length);
chk(canFix.length > 0, "⑧분모   확정 가능 팀 표본 > 0", canFix.length);
chk(noOwner.every((r) => r.st === "noowner"), "⑧상태   공석 팀은 초안도 확정도 아닌 「확정자 공석」",
  noOwner.map((r) => r.team + ":" + r.st).join(" "));
chk(canFix.every((r) => r.st === "draft"), "⑧상태   확정 가능 팀은 「초안」으로 시작", canFix.map((r) => r.team + ":" + r.st).join(" "));
/* ⓐ 자기시험 — 올바른 확정은 통과해야 한다. 늘 거부하는 함수는 게이트가 아니다. */
const okFix = G("corpMtgCanFix")(canFix[0], canFix[0].own);
chk(okFix.ok, "⑧상태ⓐ 자기시험 — 책임자 본인의 확정은 통과한다", okFix.why);
const vacFix = G("corpMtgCanFix")(noOwner[0], "조성래");
chk(!vacFix.ok && /합류 전/.test(vacFix.why), "⑧공석   공석 팀 확정 거부 + 사유", vacFix);
const otherFix = G("corpMtgCanFix")(canFix.find((r) => r.own !== "조예원") || canFix[0], "조예원");
chk(!otherFix.ok, "⑧상태   남의 팀 보고를 확정하지 못한다", otherFix);

/* 통합은 확정 뒤에만 — 공석 팀은 분모에서 빠진다 */
const MG0 = G("corpMtgCanMerge")(WK);
chk(!MG0.ok && MG0.done < MG0.need, "⑧통합   확정 전에는 통합되지 않는다", MG0);
chk(MG0.skip === noOwner.length, "⑧통합   공석 팀을 분모에서 뺀다(뺀 수가 공석 수와 같다)", { skip: MG0.skip, 공석: noOwner.length });
ctx.WKALL = Object.assign({}, WK, { reports: REPS.map((r) => (r.head > 0 ? Object.assign({}, r, { st: "fixed" }) : r)) });
chk(G("corpMtgCanMerge")(ctx.WKALL).ok, "⑧통합ⓐ 자기시험 — 확정 가능 팀이 전부 확정되면 통합이 열린다");

/* 근거 — 원천이 없는 팀에 수치를 싣지 않는다 */
const linked = REPS.filter((r) => r.linked);
const unlinked = REPS.filter((r) => !r.linked);
chk(linked.length > 0, "⑧분모   원천 연결 팀 표본 > 0", linked.length);
chk(unlinked.length > 0, "⑧분모   원천 미연결 팀 표본 > 0", unlinked.length);
chk(unlinked.every((r) => (r.metrics || []).length === 0),
  "⑧근거   원천 없는 팀에 지표 0건(지어낸 숫자를 싣지 않는다)",
  unlinked.filter((r) => (r.metrics || []).length).map((r) => r.team).join(" "));
chk(linked.every((r) => (r.metrics || []).length > 0), "⑧근거   원천 있는 팀에는 실제 지표가 실린다", linked.map((r) => r.team + ":" + r.metrics.length).join(" "));
chk(linked.every((r) => r.metrics.every((m) => typeof m.src === "string" && m.src)), "⑧근거   지표마다 출처가 붙는다");

/* 회의록 3구분 · 미확정 배지 — **표본을 만들어** 확인한다(0건 통과 금지) */
const VO = G("CORP_MTG_VOICE");
chk(Object.keys(VO).length === 3, "⑧회의록 발언 주체 3구분", Object.keys(VO).join(" "));
chk(VO.lookup.tag === "미확정", "⑧배지   즉석 조회의 배지가 「미확정」", VO.lookup.tag);
chk(!VO.human.tag && !VO.ai.tag, "⑧배지   사람 발언·AI 보고에는 미확정 배지가 붙지 않는다", { h: VO.human.tag, a: VO.ai.tag });
ctx.SAMPLE = { voice: "lookup", who: "핀테크", text: "표본" };
const sampleTagged = VO[ctx.SAMPLE.voice].tag === "미확정";
chk(sampleTagged, "⑧배지ⓐ 자기시험 — 즉석 조회 표본 1건에 배지가 붙는다", "안 붙음");

/* 미종결 후속조치가 **지난 주차에서** 올라온다 — 양성 표본으로 확인한다 */
const PREV = "2026-11-09";
ctx.MST2 = JSON.parse(JSON.stringify(MST));
ctx.MST2.weeks[PREV] = { key: PREV, reports: [], minutes: [], merged: true,
  tasks: [{ id: "fu1", what: "표본 과제", owner: "조성래", due: "2026-11-20", status: "open" },
          { id: "fu2", what: "종결된 과제", owner: "조예원", due: "", status: "done" }] };
const OPEN = G("corpMtgOpenTasks")(ctx.MST2, MW);
chk(OPEN.length === 1 && OPEN[0].id === "fu1", "⑧선두   지난 주차 미종결만 올라온다(종결분은 빠진다)", OPEN.map((t) => t.id).join(" "));
chk(OPEN.length > 0, "⑧분모   미종결 표본 > 0 (0건을 그냥 통과시키지 않는다)", OPEN.length);
chk(OPEN[0].from === PREV, "⑧선두   어느 회의에서 나온 과제인지 남는다", OPEN[0].from);
const OPEN2 = G("corpMtgOpenTasks")(ctx.MST2, { key: PREV });
chk(OPEN2.length === 0, "⑧선두ⓐ 자기시험 — 그 주차 자신의 과제는 선두 목록에 넣지 않는다", OPEN2.length);

/* 루틴 — 「밀림」은 생성 경로가 있는 것에만 붙는다 */
const RT = SCHED.routines.map((r) => ({ t: r.t, s: G("corpRoutineState")(r, MST, MNOW, MW) }));
const GEN = G("CORP_MTG_GEN");
chk(GEN.length > 0, "⑧분모   생성 경로 루틴 표본 > 0", GEN.length);
/* 은행 대사는 **사람 반입 경로**다 — 생성 경로도 아니고 「경로 없음」도 아니다.
   예외를 이름으로 못 박는다. 이름 없이 열어 두면 다른 루틴도 슬그머니 끼어든다. */
const HUMANPATH = ["은행 대사"];
const NOGEN = RT.filter((x) => GEN.indexOf(x.t) < 0 && HUMANPATH.indexOf(x.t) < 0);
chk(NOGEN.filter((x) => x.s.state === "due").length === 0,
  "⑧루틴   생성 경로 없는 루틴에 「밀림」 0건", NOGEN.filter((x) => x.s.state === "due").map((x) => x.t).join(" "));
chk(NOGEN.filter((x) => x.s.state !== "rel").every((x) => x.s.state === "nogen"),
  "⑧루틴   나머지는 「생성 경로 없음」으로 표시", NOGEN.filter((x) => x.s.state !== "rel" && x.s.state !== "nogen").map((x) => x.t).join(" "));
/* 사람 반입 루틴 — 올리지 않았으면 「밀림」이 뜨고, 올렸으면 뜨지 않는다.
   늘 빨간 벽이면 사람이 색을 안 믿고, 늘 녹색이면 검사가 없는 것과 같다. 양쪽을 다 본다. */
const BRT = SCHED.routines.find((r) => r.t === "은행 대사");
chk(!!BRT && BRT.ai === "핀테크" && BRT.owner === "M2", "⑧반입   은행 대사 루틴의 담당이 핀테크 · M2", BRT && [BRT.ai, BRT.owner].join(" "));
chk(/사람이 올려야|사람이 올리/.test(BRT.need || ""), "⑧반입   자동으로 가져오지 못한다고 루틴에 적혀 있다", BRT && BRT.need);
chk(/승인/.test(BRT.human || "") && !/승인/.test(BRT.does || ""),
  "⑧반입   승인은 사람 칸에만 있다(AI 칸에 없다)", JSON.stringify({ does: BRT.does, human: BRT.human }));
const sNone = G("corpRoutineState")(BRT, MST, MNOW, MW, { bankCov: null });
chk(sNone.state === "due" && /밀림/.test(sNone.ko), "⑧반입   한 번도 안 올렸으면 밀림으로 뜬다", sNone.ko);
const yesterday = G("corpBjvShiftDay")(G("corpOpsToday")(MNOW), -1);
const sOk = G("corpRoutineState")(BRT, MST, MNOW, MW, { bankCov: { from: "2026-11-01", to: yesterday } });
chk(sOk.state === "made" && /어제까지/.test(sOk.ko), "⑧반입   어제 것까지 올렸으면 밀림이 아니다(늘 빨간 벽이 아니다)", sOk.ko);
const sLate = G("corpRoutineState")(BRT, MST, MNOW, MW, { bankCov: { from: "2026-11-01", to: G("corpBjvShiftDay")(yesterday, -3) } });
chk(sLate.state === "due" && /3일/.test(sLate.ko), "⑧반입   며칠치가 비었는지 날수로 적는다", sLate.ko);
chk(G("corpBjvDue")({ to: yesterday }, G("corpOpsToday")(MNOW)).late === 0, "⑧반입   밀린 날수는 거래일이 아니라 **올린 기간**으로 센다(거래 0건인 날과 안 올린 날을 가른다)");
chk(RT.some((x) => x.s.state === "made"), "⑧루틴   생성된 루틴이 표시된다", RT.filter((x) => x.s.state === "made").map((x) => x.t).join(" "));
/* ⓐ 자기시험 — 기한이 지났는데 생성물이 없으면 실제로 밀림이 떠야 한다 */
const LATE = G("corpRoutineState")(SCHED.routines.find((r) => r.t === "주간회의 자료"),
  MST, new Date(2026, 10, 16, 10, 30), G("corpMtgWeek")(new Date(2026, 10, 16, 10, 30)));
chk(LATE.state === "due", "⑧루틴ⓐ 자기시험 — 기한 지나고 생성물 없으면 「밀림」", LATE.state);
/* 주말에 떨어진 월 단위 예정은 다음 영업일로 민다 */
const SHIFTED = RT.filter((x) => x.s.shifted);
chk(SHIFTED.length > 0, "⑧분모   주말 예정 표본 > 0", SHIFTED.map((x) => x.t).join(" "));
chk(SHIFTED.every((x) => x.s.next.getDay() !== 0 && x.s.next.getDay() !== 6),
  "⑧근무일 주말 예정을 다음 영업일로 민다", SHIFTED.map((x) => x.t + ":" + x.s.next.toDateString()).join(" "));

/* 업무시간 — 양방향으로 확인한다 */
chk(G("corpInWork")(new Date(2026, 10, 11, 14, 0)).ok, "⑧업무   평일 14시는 업무시간 안");
chk(!G("corpInWork")(new Date(2026, 10, 11, 12, 30)).ok, "⑧업무   점심시간은 업무시간 밖");
chk(!G("corpInWork")(new Date(2026, 10, 14, 14, 0)).ok, "⑧업무   토요일은 업무시간 밖");
chk(!G("corpInWork")(new Date(2026, 10, 11, 19, 0)).ok, "⑧업무   업무 종료 후는 밖");
const NWS = G("corpNextWorkStart")(new Date(2026, 10, 13, 20, 0));
chk(NWS && NWS.getDay() === 1, "⑧업무   금요일 밤의 다음 업무 개시 = 월요일", NWS && NWS.toDateString());

/* 검산 함수를 화면과 러너가 같이 쓴다 */
const MV = G("corpMtgPass")(MST, MNOW);
MV.rows.forEach((r) => {
  chk(r.ok, `⑧검산   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑧분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(MV.pass, "⑧검산   전건 통과", MV.fail.map((f) => f.ko));

/* 결정론 */
let mtgSrc = "";
try { mtgSrc = rd(MTG); } catch (e) { fails.push("⑧회의   " + MTG + " 없음"); }
if (mtgSrc) {
  const bare = mtgSrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑧결정론 Math.random 0건");
}
/* 화면이 검산·참석 함수를 그대로 부른다(따로 세지 않는다) */
let mtgBoard = "";
try { mtgBoard = rd(MTGBOARD); } catch (e) { fails.push("⑧회의   " + MTGBOARD + " 없음"); }
if (mtgBoard) {
  chk(mtgBoard.indexOf("corpMtgAttend(") >= 0, "⑧화면   참석 인원을 함수에서 읽는다", "없음");
  chk(mtgBoard.indexOf("joinPeople") < 0, "⑧화면   joinPeople 리터럴을 화면이 읽지 않는다", "읽고 있다");
  chk(mtgBoard.indexOf("corpMtgPass(") >= 0 || mtgBoard.indexOf("corpMtgVerdict(") >= 0, "⑧화면   검산이 러너와 같은 함수", "없음");
  chk(mtgBoard.indexOf("corpMtgEnsure(") >= 0, "⑧화면   열람 시 생성 경로가 화면에 있다", "없음");
  chk(/다음 열람 시|열었을 때/.test(mtgBoard), "⑧화면   「열었을 때 만든다」를 적는다", "없음");
  chk(mtgBoard.indexOf("확정자 공석") >= 0 || mtgBoard.indexOf("공석") >= 0, "⑧화면   공석을 이름 대고 적는다", "없음");
}
/* 총괄 콕핏도 참석 수를 리터럴이 아니라 집계에서 읽는다 */
let opsSrc = "";
try { opsSrc = rd("src/components/CorpOps.jsx"); } catch (e) { /* 위에서 잡힌다 */ }
if (opsSrc) {
  chk(opsSrc.indexOf("sch.weekly.joinPeople") < 0,
    "⑧화면   총괄 콕핏이 joinPeople 리터럴을 그리지 않는다(좌측 「재직 2명」과 모순)", "그리고 있다");
}
/* 게이트가 제 사정권을 지킨다 */
if (hook) {
  ["corpMeeting", "CorpMeeting"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑧게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}

/* ── ⑨ 인사 · 계약 · 문서 ────────────────────────────────────────────────
   Phase 8 완료 조건 두 가지를 단언으로 1:1 대응시킨다 —
     민감자료 차단 게이트 음성 테스트 통과  → ⑨게이트(check_sensitive.py 를 직접 돌린다)
     주민번호/연락처 필드 부재 확인        → ⑨부재(사람 수 × 금지 필드 수를 분모로 전수)
   「필드가 없다」는 음성 명제다. 분모 없이 0건을 통과시키면 아무것도 증명하지 않는다. */
const ADM = "src/data/corpAdmin.js";
const ADMBOARD = "src/components/CorpAdmin.jsx";
const ANOW = new Date(2026, 10, 12);            /* 고정 날짜 주입 — 벽시계를 쓰지 않는다 */
ctx.ANOW = ANOW;
const AV = G("corpAdminPass")(ANOW);
AV.rows.forEach((r) => {
  chk(r.ok, `⑨인사   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑨분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(AV.pass, "⑨인사   검산 전건 통과", AV.fail.map((f) => f.ko));

/* 주민번호 — 값을 담는 자리가 **구조적으로** 없는가 */
const HR = G("CORP_HR");
const BAN = G("CORP_HR_BAN");
chk(HR.length > 0 && BAN.length > 0, "⑨분모   사람 수 × 금지 필드 수 > 0", HR.length + " × " + BAN.length);
const leaked = [];
HR.forEach((h) => BAN.forEach((k) => {
  if (Object.prototype.hasOwnProperty.call(h, k)) leaked.push(h.name + "." + k);
  if (h.rrn && Object.prototype.hasOwnProperty.call(h.rrn, k)) leaked.push(h.name + ".rrn." + k);
}));
chk(leaked.length === 0, "⑨부재   금지 필드 전수 부재(주민번호 값·주소·생년월일·연락처·급여·평가)", leaked.join(" "));
chk(BAN.indexOf("rrnValue") >= 0 && BAN.indexOf("phone") >= 0 && BAN.indexOf("addr") >= 0,
  "⑨부재   금지 목록이 주민번호 값·연락처·주소를 이름으로 들고 있다", BAN.join(","));
/* ⓐ 자기시험 — 금지 필드를 심으면 실제로 잡혀야 한다. 늘 0건인 검사는 검사가 아니다. */
const planted = Object.assign({}, HR[0], { phone: "x" });
const caught = BAN.filter((k) => Object.prototype.hasOwnProperty.call(planted, k));
chk(caught.length > 0, "⑨부재ⓐ 자기시험 — 금지 필드를 심으면 잡힌다", caught.join(","));
chk(HR.filter((h) => h.rrn && h.rrn.held).length === 0, "⑨부재   주민번호 값 보유 0명",
  HR.filter((h) => h.rrn && h.rrn.held).map((h) => h.name).join(" "));
const GATE4 = G("CORP_RRN_GATE");
chk(GATE4.length === 4, "⑨보관   값 보관 조건이 넷이다", GATE4.length);
chk(GATE4.every((g) => !g.ok), "⑨보관   넷이 아직 서지 않았다 — 그래서 담지 않는다", GATE4.filter((g) => g.ok).map((g) => g.k).join(" "));
chk(GATE4.every((g) => (g.d || "").trim()), "⑨보관   조건마다 왜 필요한지 적혀 있다");

/* 계약 — 만료일 없는 계약은 등록 자체를 거부한다 */
const CT = G("CORP_CT");
chk(CT.length > 0, "⑨분모   계약 표본 > 0", CT.length);
chk(CT.every((c) => G("corpCtCheck")(c).ok), "⑨계약   등록 검사 전건 통과",
  CT.filter((c) => !G("corpCtCheck")(c).ok).map((c) => c.id).join(" "));
/* ⓐ 자기시험 — 만료일을 비우면 거부해야 한다 */
const noTo = G("corpCtCheck")(Object.assign({}, CT[0], { to: "" }));
chk(!noTo.ok && /만료일/.test(noTo.errs.join(" ")), "⑨계약ⓐ 자기시험 — 만료일 없는 계약은 거부", noTo);
const badClass = G("corpCtCheck")(Object.assign({}, CT[0], { doc: "nope" }));
chk(!badClass.ok, "⑨계약   분류표에 없는 문서 분류는 거부", badClass);
/* 경보 — 고정 날짜로 같은 답이 나온다 */
const a1 = CT.map((c) => G("corpCtAlert")(c, ANOW).k).join(",");
const a2 = CT.map((c) => G("corpCtAlert")(c, ANOW).k).join(",");
chk(a1 === a2, "⑨경보   같은 날짜 · 같은 결과(결정론)");
chk(CT.every((c) => G("corpCtAlert")(c, ANOW).k !== "none"), "⑨경보   전건 경보 산출");
const over = G("corpCtAlert")(Object.assign({}, CT[0], { to: "2026-01-01" }), ANOW);
chk(over.k === "over" && over.d < 0, "⑨경보ⓐ 자기시험 — 지난 계약은 「만료 경과」", over);
const soon = G("corpCtAlert")(Object.assign({}, CT[0], { to: "2026-11-15" }), ANOW);
chk(soon.k === "d7", "⑨경보ⓐ 자기시험 — 사흘 뒤 만료는 「7일 이내」", soon);

/* 문서 — 확인하지 않은 조문 번호를 화면에 찍지 않는다 */
const DOC = G("CORP_DOC_CLASS");
chk(DOC.length > 0, "⑨분모   문서 분류 표본 > 0", DOC.length);
chk(DOC.every((d) => (d.basisKo || "").trim()), "⑨문서   분류마다 근거 법률 이름", DOC.filter((d) => !d.basisKo).map((d) => d.k).join(" "));
chk(DOC.some((d) => !d.checked), "⑨분모   원문 미확인 표본 > 0 (전건 확인이면 그 표시가 증명되지 않는다)",
  DOC.filter((d) => !d.checked).length);
let admSrc = "";
try { admSrc = rd(ADM); } catch (e) { fails.push("⑨인사   " + ADM + " 없음"); }
if (admSrc) {
  /* 확인하지 않은 조문 번호를 데이터에 적지 않는다 — 제NN조 꼴이 basisKo 에 들어가면 안 된다 */
  const article = DOC.filter((d) => /제\s*\d+\s*조/.test(d.basisKo || ""));
  chk(article.length === 0, "⑨문서   미확인 분류에 조문 번호 0건", article.map((d) => d.k).join(" "));
  const bare = admSrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑨결정론 Math.random 0건");
  chk((bare.match(/new Date\(\s*\)/g) || []).length === 0, "⑨결정론 인자 없는 new Date() 0건");
}
let admBoard = "";
try { admBoard = rd(ADMBOARD); } catch (e) { fails.push("⑨인사   " + ADMBOARD + " 없음"); }
if (admBoard) {
  chk(admBoard.indexOf("corpAdminPass(") >= 0, "⑨화면   검산이 러너와 같은 함수", "없음");
  chk(/수집하지 않는 것/.test(admBoard), "⑨화면   수집하지 않는 것을 이름을 대고 적는다", "없음");
  chk(/값은 이 시스템이 들지 않습니다|값을 담는 필드/.test(admBoard), "⑨화면   주민번호 값을 들지 않는다고 적는다", "없음");
  chk(/원문 대조를 거치지 않았습니다|원문 미확인/.test(admBoard), "⑨화면   법령 원문 미확인을 숨기지 않는다", "없음");
  /* 화면에 주민번호 값이 들어갈 자리가 없는지 — 입력 요소로 받지 않는다 */
  chk(!/rrn[^.]*(value=|onChange)/.test(admBoard), "⑨화면   주민번호 값 입력 요소 0건", "있다");
}

/* 민감자료 차단 게이트 — **실제로 돌려** 음성 테스트가 서는지 본다 */
{
  const r = spawnSync("python", ["scripts/check_sensitive.py", "--negative"],
    { cwd: ROOT, encoding: "utf8", timeout: 120000 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  chk(r.status === 0, "⑨게이트 민감자료 차단 게이트 음성 테스트 통과", out.split("\n").filter((x) => x.indexOf("✗") >= 0).join(" | ") || ("status=" + r.status));
  const m = /음성 테스트 — 통과 (\d+) · 실패 (\d+)/.exec(out);
  chk(!!m, "⑨게이트 음성 테스트가 결과를 보고한다", out.slice(0, 120));
  if (m) {
    chk(+m[1] > 0, "⑨분모   음성 테스트 표본 > 0 (0건이면 막았다고 말할 수 없다)", m[1]);
    chk(+m[2] === 0, "⑨게이트 음성 테스트 실패 0건", m[2]);
  }
  const s2 = /자기시험 — 통과 (\d+) · 실패 (\d+)/.exec(out);
  chk(!!s2 && +s2[1] > 0 && +s2[2] === 0, "⑨게이트 탐지기 자기시험 통과", s2 ? s2[0] : "없음");
}
if (hook) {
  chk(/check_sensitive\.py --staged/.test(hook), "⑨게이트 pre-commit 이 모든 커밋에서 민감자료를 검사한다", "미등재");
  /* 내비 게이트에 우회용 exit 0 이 있어, 그 뒤에 있으면 우회 모드에서 통째로 건너뛰어진다.
     그래서 「내비 게이트보다 앞」을 글자 위치로 단언한다. */
  const iSens = hook.indexOf("check_sensitive.py");
  const iNav = hook.indexOf("gen_nav_inventory.py");
  chk(iSens >= 0 && iNav >= 0 && iSens < iNav,
    "⑨게이트 민감자료 검사가 내비 게이트보다 앞에 있다(뒤면 우회 모드의 exit 0 에 가린다)",
    { 민감: iSens, 내비: iNav });
  ["corpAdmin", "CorpAdmin"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑨게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}

/* ── ⑩ 일정 · 공지 · 결재 · 릴리스 ──────────────────────────────────────
   Phase 9 완료 조건 두 가지를 단언으로 1:1 대응시킨다 —
     승인 없이 상태 전이 불가  → ⑩전이(거부 경로 + **자기시험**으로 정상 경로가 열리는지도 본다)
     동일인 승인 탐지 동작      → ⑩동일인(거부하면서 same 표시를 돌려주고 기록 경로가 있는가)
   늘 거부하는 함수는 게이트가 아니다. 그래서 거부만 보지 않고 통과도 함께 본다. */
const GOVF = "src/data/corpGov.js";
const GOVBOARD = "src/components/CorpGov.jsx";
const GNOW = new Date(2026, 10, 12);
ctx.GNOW = GNOW;
const GST = G("corpGovRead")();
ctx.GST = GST;
const GV = G("corpGovPass")(GST, GNOW);
GV.rows.forEach((r) => {
  chk(r.ok, `⑩결재   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑩분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(GV.pass, "⑩결재   검산 전건 통과", GV.fail.map((f) => f.ko));

/* 승인 가능자 — 지금은 0명이다. 그 사실을 러너가 고정한다.
   0명인데 승인된 건이 있으면 어딘가 승인 경로가 샜다는 뜻이다. */
const RELWHO = G("corpRelApprovers")();
const RELS = G("corpRelAll")(GST);
chk(RELS.length > 0, "⑩분모   릴리스 표본 > 0", RELS.length);
chk(RELWHO.length === 0, "⑩승인   릴리스 승인 가능자 0명(S1 책임자 합류 전)", RELWHO.join(" "));
chk(RELS.filter((r) => r.st === "approved").length === 0,
  "⑩승인   승인 가능자가 없으면 승인된 릴리스도 0건", RELS.filter((r) => r.st === "approved").map((r) => r.ver).join(" "));

/* 전이 — 거부 경로를 전수로 본다 */
const R0 = RELS[0];
const full = Object.assign({}, R0, { check: G("CORP_REL_CHECK").map((c) => c.k) });
const relCan = G("corpRelCanApprove");
const relCases = [
  ["AI 주체", full, "온톨로", /사람이 아닙니다/],
  ["합류 전 책임자", full, "김남용", /사람이 아닙니다/],
  ["S1 아닌 재직자", full, "조예원", /정보보안팀/],
  ["대표(S1 아님)", full, "조성래", /정보보안팀/],
  ["주체 미선택", full, "", /고르지 않았/],
  ["점검표 미충족", Object.assign({}, R0, { check: [] }), "조성래", /정보보안팀|점검표/],
];
relCases.forEach(([ko, r, who, re]) => {
  const c = relCan(r, who);
  chk(!c.ok && re.test(c.why || ""), `⑩전이   릴리스 — ${ko} 거부 + 사유`, c);
});
/* ⓐ 자기시험 — S1 재직자가 있다고 가정하면 승인이 **열려야** 한다.
   늘 거부하는 함수는 게이트가 아니라 벽이다. 열리는 조건을 증명하지 않으면 거부에 뜻이 없다. */
{
  const HRsave = G("CORP_HR").slice();
  vm.runInContext("CORP_HR.push({ no: '9C9999', name: '시험보안', title: '이사', teams: ['S1'], joined: '2026-11-01', on: true, expertise: [], certs: [], rrn: null });", ctx);
  const opened = relCan(full, "시험보안");
  chk(opened.ok, "⑩전이ⓐ 자기시험 — S1 재직자 + 점검표 충족이면 승인이 열린다", opened);
  const selfTry = relCan(Object.assign({}, full, { by: "시험보안" }), "시험보안");
  chk(!selfTry.ok && selfTry.same === true,
    "⑩동일인 작성자 = 승인자면 거부하고 **동일인임을 표시**한다(기록할 수 있어야 한다)", selfTry);
  const noCheck = relCan(Object.assign({}, R0, { check: ["gate"] }), "시험보안");
  chk(!noCheck.ok && /점검표/.test(noCheck.why), "⑩전이   점검표가 덜 차면 S1이어도 거부", noCheck);
  vm.runInContext("CORP_HR.length = " + HRsave.length + ";", ctx);
  chk(G("CORP_HR").length === HRsave.length, "⑩전이ⓐ 자기시험 뒤 원상 복구", G("CORP_HR").length);
}

/* 결재 — 종류마다 승인 주체가 다르다 */
const aprCan = G("corpAprCanAdvance");
const mkApr = (o) => Object.assign({ id: "t", d: "2026-11-12", ko: "시험", kind: "exp", by: "조예원", ap: null, st: "review" }, o);
chk(!aprCan(mkApr({}), "").ok, "⑩전이   결재 — 주체 미선택 거부");
chk(!aprCan(mkApr({}), "나침반").ok, "⑩전이   결재 — AI 주체 거부");
const selfApr = aprCan(mkApr({ by: "조성래" }), "조성래");
chk(!selfApr.ok && selfApr.same === true, "⑩동일인 결재 — 작성자 = 승인자 거부 + 동일인 표시", selfApr);
chk(aprCan(mkApr({}), "조성래").ok, "⑩전이ⓐ 자기시험 — 지출은 M1 소속(대표)이 승인할 수 있다", aprCan(mkApr({}), "조성래"));
chk(!aprCan(mkApr({ kind: "rel" }), "조성래").ok, "⑩전이   릴리스 종류 결재는 S1만 — 대표도 거부");
chk(!aprCan(mkApr({ st: "approved" }), "조성래").ok, "⑩전이   끝난 결재는 더 넘어가지 않는다");
chk(aprCan(mkApr({ st: "draft", by: "조성래" }), "조성래").ok,
  "⑩전이ⓐ 자기시험 — 기안 → 검토는 본인도 올릴 수 있다(승인만 분리한다)");

/* 동일인 시도를 **기록**하는 경로가 있는가 */
const denied = G("corpGovDeny")(GST, "시험", "조성래", "작성자와 승인자가 같습니다");
chk((denied.deny || []).length === 1, "⑩동일인 막힌 시도를 기록한다", (denied.deny || []).length);
chk(denied.deny[0].who === "조성래" && denied.deny[0].why, "⑩동일인 기록에 누가·왜가 남는다", denied.deny[0]);

/* 필독 — 누른 사람만 센다 */
const must = G("corpNoticeOpen")(GST);
chk(must.length > 0, "⑩분모   필독 공지 표본 > 0", must.length);
chk(must.every((m) => m.done.length === 0), "⑩필독   아무도 안 눌렀으면 읽음 0명(열람을 읽음으로 바꾸지 않는다)",
  must.map((m) => m.n.id + ":" + m.done.length).join(" "));
chk(must.every((m) => m.left.length > 0), "⑩필독   미확인자를 이름으로 센다", must.map((m) => m.left.length).join(" "));

/* 커밋 게이트 목록 — **사본이 아니라 대조다** */
const GATES = G("CORP_GATES");
chk(GATES.length > 0, "⑩분모   게이트 목록 > 0", GATES.length);
if (hook) {
  const miss = GATES.filter((x) => hook.indexOf(x.run) < 0);
  chk(miss.length === 0, "⑩게이트 화면 목록의 러너가 실제로 훅에 걸려 있다(목록만 두고 대조 안 하면 빠진 게이트가 녹색으로 보인다)",
    miss.map((x) => x.run).join(" "));
}
chk(GATES.every((x) => (x.d || "").trim()), "⑩게이트 게이트마다 무엇을 막는지 적혀 있다");

/* 결정론 · 화면 */
let govSrc = "";
try { govSrc = rd(GOVF); } catch (e) { fails.push("⑩결재   " + GOVF + " 없음"); }
if (govSrc) {
  const bare = govSrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑩결정론 Math.random 0건");
  chk((bare.match(/new Date\(\s*\)/g) || []).length === 0, "⑩결정론 인자 없는 new Date() 0건");
}
let govBoard = "";
try { govBoard = rd(GOVBOARD); } catch (e) { fails.push("⑩결재   " + GOVBOARD + " 없음"); }
if (govBoard) {
  chk(govBoard.indexOf("corpGovPass(") >= 0, "⑩화면   검산이 러너와 같은 함수", "없음");
  chk(govBoard.indexOf("corpGovDeny(") >= 0, "⑩화면   동일인 시도를 화면이 기록한다", "없음");
  chk(/승인할 수 있는 사람이 없습니다/.test(govBoard), "⑩화면   승인 가능자가 없다는 사실을 적는다", "없음");
  chk(/누른 사람만|읽었다고 누른/.test(govBoard), "⑩화면   필독을 누른 사람만 센다고 적는다", "없음");
  chk(/사본이 아닙니다/.test(govBoard), "⑩화면   게이트 목록이 대조임을 적는다", "없음");
}
if (hook) {
  ["corpGov", "CorpGov"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑩게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}

/* ── ⑪ 자료 반입 · AI 팀장 대화 ─────────────────────────────────────────
   들어오는 길과 말하는 길을 함께 본다.
     반입 — 민감자료가 **미리보기보다 먼저** 걸리는가 · 틀린 줄만 빠지는가 · 받지 않을 열을 떼는가
     대화 — 도구가 없으면 **지어내지 않는가**(양성 검사) · 시키면 거절하고 물으면 답하는가
   「지어내지 않는다」는 음성 명제라, 도구 없는 에이전트에게 실제로 물어보는 표본이 있어야 뜻이 선다. */
const UPF = "src/data/corpUpload.js";
const UPBOARD = "src/components/CorpUpload.jsx";
const AGF = "src/data/corpAgent.js";
const AGBOARD = "src/components/CorpAgentChat.jsx";

const UV = G("corpUpPass")();
UV.rows.forEach((r) => {
  chk(r.ok, `⑪반입   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑪분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(UV.pass, "⑪반입   검산 전건 통과", UV.fail.map((f) => f.ko));

/* 민감자료 — 표에 섞여 들어오면 걸려야 한다. 커밋 게이트와 **같은 판정**인지 본다. */
const scan = G("corpUpScan");
const upPlanted = [["홍길동", "950101-1234564"], ["김아무", "4111-1111-1111-1111"]];
const hits = scan(upPlanted, ["성명", "주민번호"]);
chk(hits.length === 2, "⑪반입   심은 민감자료 2건을 모두 잡는다", hits.map((h) => h.k).join(" "));
chk(hits.every((h) => h.row > 0 && h.col && h.why), "⑪반입   어느 줄 어느 열인지와 이유가 함께 나온다", JSON.stringify(hits[0] || {}));
chk(JSON.stringify(hits).indexOf("950101") < 0, "⑪반입   **값을 담지 않는다**(적중 좌표만)", "값이 섞였다");
/* ⓐ 자기시험 — 깨끗한 표는 통과해야 한다. 늘 막으면 아무것도 못 올린다. */
const upClean = scan([["2026-11-12", "1234567890123", "1234-5678-9012-3456"]], ["일자", "금액", "번호"]);
chk(upClean.length === 0, "⑪반입ⓐ 자기시험 — 날짜·금액·검증식 실패 번호는 잡지 않는다", upClean.map((h) => h.k + "@" + h.col).join(" "));

/* 받지 않을 열 — 이름으로 떼어 낸다 */
const upDeny = G("corpUpDenyCols")(["성명", "주민등록번호", "연락처", "직위"], G("corpUpSpec")("hr"));
chk(upDeny.length === 2, "⑪반입   인사에서 주민번호·연락처 열을 떼어 낸다", upDeny.map((d) => d.h).join(" "));
chk(G("corpUpDenyCols")(["성명", "직위"], G("corpUpSpec")("hr")).length === 0,
  "⑪반입ⓐ 자기시험 — 받아도 되는 열은 떼지 않는다");

/* 검증 — 틀린 줄만 뺀다 */
const csvText = "전표번호,일자,적요,계정과목,차변,대변\nJV-T1,2026-11-01,시험,819,3000000,0\n" +
  "JV-T1,2026-11-01,시험,103,0,3000000\nJV-T2,2026-11-02,불일치,801,1000000,0\n" +
  "JV-T2,2026-11-02,불일치,103,0,900000\nJV-T3,2026-11-03,없는계정,999,100,0\n";
const P = G("corpUpParseCsv")(csvText);
chk(P.head.length === 6 && P.rows.length === 5, "⑪반입   CSV 머리글·행 수", P.head.length + " / " + P.rows.length);
const sug = G("corpUpSuggest")(P.head, G("corpUpSpec")("jv"));
chk(Object.keys(sug).length >= 6, "⑪반입   열 매핑을 제안한다(확정은 사람이 한다)", JSON.stringify(sug));
const VR = G("corpUpValidate")("jv", P.head, P.rows, sug);
chk(VR.ok.length === 4 && VR.bad.length === 1, "⑪반입   틀린 줄만 뺀다", "통과 " + VR.ok.length + " · 제외 " + VR.bad.length);
chk(VR.bad[0] && VR.bad[0].row > 0 && VR.bad[0].why.length, "⑪반입   뺀 줄의 번호와 이유를 남긴다", JSON.stringify(VR.bad[0] || {}));
const GJ = G("corpUpGroupJv")(VR.ok);
chk(GJ.length === 2, "⑪반입   전표 번호로 묶는다", GJ.length);
chk(GJ.filter((x) => x.ok).length === 1 && GJ.filter((x) => !x.ok).length === 1,
  "⑪반입   묶은 뒤 차대가 맞는 전표만 통과", GJ.map((x) => x.no + ":" + (x.ok ? "ok" : "no")).join(" "));
/* 필수 열이 비면 반입하지 않는다 */
const noMap = G("corpUpValidate")("jv", P.head, P.rows, { no: 0 });
chk(noMap.missing.length > 0 && noMap.ok.length === 0, "⑪반입   필수 열이 비면 한 줄도 받지 않는다", noMap.missing.join(" "));

/* ── AI 팀장 대화 ── */
const AGV = G("corpAgPass")();
AGV.rows.forEach((r) => {
  chk(r.ok, `⑪대화   ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑪분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(AGV.pass, "⑪대화   검산 전건 통과", AGV.fail.map((f) => f.ko));

const AGL = G("corpAgList")();
chk(AGL.length === G("CORP_TEAMS").length, "⑪대화   팀마다 AI 팀장 하나", AGL.length);
const noTool = AGL.filter((x) => x.noTool);
const hasTool = AGL.filter((x) => !x.noTool);
chk(noTool.length > 0, "⑪분모   도구 없는 에이전트 표본 > 0(없으면 침묵 검사가 공집합)", noTool.length);
chk(hasTool.length > 0, "⑪분모   도구 있는 에이전트 표본 > 0", hasTool.length);
/* **지어내지 않는가** — 도구 없는 에이전트에게 실제로 물어본다 */
const askNo = noTool.map((x) => G("corpAgAnswer")(x.ai, "이번 달 매출이랑 회원 수 알려줘"));
chk(askNo.every((r) => r.kind === "notool"), "⑪대화   도구 없으면 답을 만들어 내지 않는다",
  askNo.filter((r) => r.kind !== "notool").map((r) => r.kind).join(" "));
chk(askNo.every((r) => !r.rows || !r.rows.length), "⑪대화   도구 없는 답에 수치가 붙지 않는다");
/* 도구 있는 에이전트는 실제 값을 낸다 — 늘 모른다고 해도 쓸모없다 */
const askYes = hasTool.map((x) => ({ ai: x.ai, r: G("corpAgAnswer")(x.ai, x.tools[0].ask[0]) }));
chk(askYes.every((x) => x.r.kind === "ok"), "⑪대화   도구 있으면 실제 값을 낸다",
  askYes.filter((x) => x.r.kind !== "ok").map((x) => x.ai + ":" + x.r.kind).join(" "));
chk(askYes.every((x) => x.r.rows && x.r.rows.length > 0), "⑪대화   값에 근거 표가 붙는다",
  askYes.filter((x) => !x.r.rows || !x.r.rows.length).map((x) => x.ai).join(" "));
/* 시키면 거절하고 물으면 답한다 */
const doIt = G("corpAgAnswer")("핀테크", "전표 승인 해줘");
chk(doIt.kind === "refuse", "⑪대화   못 하는 일을 시키면 거절", doIt.kind);
chk((doIt.t || "").length > 20, "⑪대화   거절에 사유가 붙는다", doIt.t);
const justAsk = G("corpAgAnswer")("하네스", "릴리스 승인 누가 해");
chk(justAsk.kind === "ok", "⑪대화ⓐ 자기시험 — 물음은 거절하지 않는다(막으면 쓸 수 없다)", justAsk.kind);
/* 거절 사유가 조직 원천과 같은 글자인가 — 화면과 거절이 어긋나면 둘 다 못 믿는다 */
const M2 = G("CORP_TEAMS").find((t) => t.id === "M2");
chk(M2 && M2.cannot.some((c) => (doIt.t || "").indexOf(c.act) >= 0),
  "⑪대화   거절 사유가 조직 원천(cannot)에서 그대로 온다", doIt.t);

/* 결정론 · 화면 */
[[UPF, "⑪반입"], [AGF, "⑪대화"]].forEach(([f, tag]) => {
  let t = "";
  try { t = rd(f); } catch (e) { fails.push(tag + "   " + f + " 없음"); return; }
  const bare = t.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, `${tag}   ${f} Math.random 0건`);
});
let upBoard = "", agBoard = "";
try { upBoard = rd(UPBOARD); } catch (e) { fails.push("⑪반입   " + UPBOARD + " 없음"); }
try { agBoard = rd(AGBOARD); } catch (e) { fails.push("⑪대화   " + AGBOARD + " 없음"); }
if (upBoard) {
  chk(upBoard.indexOf("corpUpScan(") >= 0, "⑪화면   반입 화면이 민감자료를 스스로 검사한다", "없음");
  /* 검사가 미리보기보다 **앞**인가 — 띄워 놓고 지우라고 하면 이미 띄운 것이다 */
  /* setRaw(null) 은 초기화라 미리보기가 아니다 — 실제로 표를 올리는 setRaw({ 와 견준다 */
  const iScan = upBoard.indexOf("corpUpScan(");
  const iPrev = upBoard.indexOf("setRaw({");
  chk(iScan >= 0 && iPrev >= 0 && iScan < iPrev,
    "⑪화면   민감 검사가 미리보기보다 앞에 있다", { scan: iScan, prev: iPrev });
  chk(/어디로도 전송되지 않습니다/.test(upBoard), "⑪화면   파일이 전송되지 않는다고 적는다", "없음");
  chk(upBoard.indexOf("corpUpPass(") >= 0, "⑪화면   검산이 러너와 같은 함수", "없음");
  /* live: true 라고 적어 놓고 받는 길이 없으면, 올려도 0건이 된다 — 그래서 사람은
     「분류가 잘못됐나」를 뒤진다. 열어 둔 창구는 **실제로 들어가는 자리까지** 이어져야 한다. */
  G("CORP_UP_SPEC").filter((x) => x.live).forEach((x) => {
    chk(new RegExp('kind === "' + x.k + '"').test(upBoard),
      "⑪반입   열어 둔 창구 「" + x.ko + "」에 받는 길이 있다", "live 인데 커밋 분기 없음");
  });
  chk(/kind === "bank"/.test(upBoard) && /kind === "doc"/.test(upBoard),
    "⑪반입   은행 내역 · 자료 목록이 저장까지 간다", "없음");
  chk(upBoard.indexOf("corpVaultWrite(") >= 0, "⑪반입   자료 목록이 자료실 저장소로 간다", "없음");
  chk(/bank: M\.lines/.test(upBoard), "⑪반입   은행 내역이 장부 상태에 붙는다", "없음");
  chk((upBoard.match(/kind === "bank"/g) || []).length >= 2 && (upBoard.match(/kind === "doc"/g) || []).length >= 2,
    "⑪반입   받은 것은 되돌릴 수도 있다(반입 · 되돌리기 양쪽)", "되돌리기 분기 없음");
}

/* ── ⑪-2 반입 변환 ─────────────────────────────────────────────────────
   저장 모양으로 바꾸는 자리는 하나다. 화면이 즉석에서 만들면 러너가 보지 못한다. */
const toBank = G("corpUpToBank"), mrgBank = G("corpUpMergeBank"), toVault = G("corpUpToVault");
const bIn = G("corpUpBankIn");
chk(bIn("입금") === 1 && bIn("출금") === -1, "⑪변환   입출 구분을 읽는다", [bIn("입금"), bIn("출금")]);
chk(bIn("") === null && bIn("이체") === null, "⑪변환ⓐ 모르는 구분은 null — 부호를 추측하지 않는다", [bIn(""), bIn("이체")]);
const bk1r = toBank([{ date: "2026-10-05", desc: "카드대금", amt: 100, io: "출금", _row: 2 },
                     { date: "2026-10-06", desc: "매출입금", amt: 200, io: "입금", _row: 3 },
                     { date: "2026-10-07", desc: "부호대로", amt: -50, _row: 4 }]);
const bk1 = bk1r.lines;
chk(bk1.length === 3 && bk1[0].a === -100 && bk1[1].a === 200 && bk1[2].a === -50,
  "⑪변환   출금은 음수 · 입금은 양수 · 구분 없으면 적힌 부호 그대로", JSON.stringify(bk1.map((x) => x.a)));
/* 두 열(입금액·출금액)로 오는 은행이 대부분이다 — 한 열만 받으면 출금이 통째로 사라진다 */
const bk2 = toBank([{ date: "2026-10-05", desc: "입금줄", inAmt: 500, outAmt: 0, bal: 500, _row: 2 },
                    { date: "2026-10-06", desc: "출금줄", inAmt: 0, outAmt: 300, bal: 200, _row: 3 }]);
chk(bk2.lines.length === 2 && bk2.lines[0].a === 500 && bk2.lines[1].a === -300,
  "⑪변환   입금·출금 두 열을 받는다(출금을 흘리지 않는다)", JSON.stringify(bk2.lines.map((x) => x.a)));
chk(bk2.lines[0].bal === 500 && bk2.lines[1].bal === 200, "⑪변환   잔액을 싣는다(흘린 거래를 잡는 유일한 사실)", JSON.stringify(bk2.lines.map((x) => x.bal)));
/* ⚠️ 버리는 줄을 **센다** — 조용히 건너뛰면 장부가 은행보다 적어지고 아무도 모른다 */
const bkDrop = toBank([{ date: "", desc: "x", amt: 10, _row: 9 }, { date: "2026-10-05", desc: "x", amt: 0, _row: 10 }]);
chk(bkDrop.lines.length === 0 && bkDrop.dropped.length === 2 && bkDrop.n === 2,
  "⑪변환   일자 없는 줄 · 금액 0인 줄은 **사유와 함께** 버린다", JSON.stringify(bkDrop.dropped));
chk(bkDrop.dropped.every((d) => d.row > 0 && (d.why || "").trim()), "⑪변환   버린 줄마다 몇 행인지와 이유가 있다", JSON.stringify(bkDrop.dropped));
const mg = mrgBank(bk1, bk1.concat([{ d: "2026-10-08", t: "", a: 7, bal: null, m: "새 줄" }]));
chk(mg.dup === 3 && mg.added === 1 && mg.lines.length === 4,
  "⑪변환   같은 줄을 두 번 받지 않는다(두 배가 된다)", JSON.stringify({ dup: mg.dup, add: mg.added }));
chk(mg.lines.every((l, i, A) => i === 0 || A[i - 1].d <= l.d), "⑪변환   은행줄은 날짜 순으로 선다");
/* ⓐ 자기시험 — 같은 날 같은 금액 **두 거래**가 한 건으로 접히지 않는가.
   형 파일에 2026-11-10 1,800,000원이 두 줄 있고 적요가 둘 다 「타행MB」다. 실제로 접혔었다. */
const twin = [{ d: "2026-11-10", t: "11:11:56", a: 1800000, bal: 3777986, m: "타행MB" },
              { d: "2026-11-10", t: "11:27:40", a: 1800000, bal: 1477986, m: "타행MB" }];
const mgTwin = mrgBank([], twin);
chk(mgTwin.lines.length === 2 && mgTwin.dup === 0,
  "⑪변환ⓐ 같은 날 같은 금액 두 거래가 **접히지 않는다**(시각·잔액으로 가른다)", JSON.stringify({ n: mgTwin.lines.length, dup: mgTwin.dup }));
const mgSame = mrgBank(twin, twin);
chk(mgSame.added === 0 && mgSame.dup === 2, "⑪변환   같은 파일을 두 번 올리면 하나도 더해지지 않는다", JSON.stringify({ add: mgSame.added, dup: mgSame.dup }));
/* 열 제안 — 실제 은행 머리글을 먹여 **어느 열을 집는지 못 박는다**.
   「입금액」에는 「금액」이 들어 있어, 순진한 부분 일치는 출금을 통째로 버린다. */
const BHEAD = ["No", "전체선택", "거래일시", "적요", "입금액", "출금액", "내용", "잔액", "거래점명", "입금인코드", "메모", "메모"];
const bmap = G("corpUpSuggest")(BHEAD, G("corpUpSpec")("bank"));
chk(bmap.date === 2, "⑪제안   거래일시 열을 집는다", bmap.date);
chk(bmap.desc === 6, "⑪제안   상대가 적힌 「내용」을 집는다(거래 수단 「적요」가 아니다)", bmap.desc + " = " + BHEAD[bmap.desc]);
chk(bmap.inAmt === 4 && bmap.outAmt === 5, "⑪제안   입금액·출금액을 따로 집는다", JSON.stringify([bmap.inAmt, bmap.outAmt]));
chk(bmap.amt === undefined, "⑪제안ⓐ 두 열이 잡히면 한 열짜리 금액은 **비운다**(두 번 세지 않는다)", bmap.amt);
chk(bmap.bal === 7, "⑪제안   잔액 열을 집는다", bmap.bal);
/* 시각 붙은 날짜 — 이걸 떨구면 은행 파일이 한 줄도 안 들어간다 */
const dtOk = G("corpUpValidate")("bank", BHEAD, [["1", "상품매출", "2026.11.11 20:05:15", "BZ뱅크", "0", "1320000", "수수료지급", "707986", "", "", "", ""]], bmap);
chk(dtOk.ok.length === 1 && dtOk.ok[0].date === "2026-11-11" && dtOk.ok[0].time === "20:05:15",
  "⑪날짜   「2026.11.11 20:05:15」을 받고 시각을 따로 보관한다", JSON.stringify(dtOk.bad.length ? dtOk.bad : dtOk.ok[0]));
const dtSum = G("corpUpValidate")("bank", BHEAD, [["", "합계", "합계", "", "", "", "", "", "", "", "", ""]], bmap);
chk(dtSum.ok.length === 0 && dtSum.bad.length === 1, "⑪날짜   꼬리 「합계」 줄은 거래로 읽지 않는다", JSON.stringify(dtSum.bad[0] && dtSum.bad[0].why));
const vl = toVault([{ rel: "02.회계/a.pdf", name: "a.pdf", dir: "02.회계", size: "12", at: "2026-10-23", ext: "PDF" },
                    { rel: "", name: "b.pdf" }]);
chk(vl.length === 1 && vl[0].size === 12 && vl[0].ext === "pdf",
  "⑪변환   자료 목록은 경로 없는 줄을 버리고 크기 · 확장자를 고른다", JSON.stringify(vl));
/* 들어온 은행줄이 실제로 대사를 돌게 하는가 — 끝까지 이어지는지 본다 */
const bkState = { jv: [{ id: "x" }], bank: [{ d: "2026-10-05", a: -100, m: "카드대금" }] };
const BKS = G("corpBankOf")(bkState);
chk(!!BKS && BKS.live === true, "⑪반입   반입된 은행줄이 대사 상대가 된다", JSON.stringify(BKS));
const VBK = G("corpLedgerVerdict")(G("CORP_JV_SEED"), BKS, "");
chk(VBK.skip.map((r) => r.k).indexOf("chain") < 0 || VBK.rows.find((r) => r.k === "chain").n === 0,
  "⑪반입   잔액이 실린 은행줄이 들어오면 사슬 검사가 돈다", VBK.skip.map((r) => r.k).join(" "));


if (agBoard) {
  chk(agBoard.indexOf("corpAgAnswer(") >= 0, "⑪화면   대화창이 답하기 함수를 그대로 부른다", "없음");
  chk(agBoard.indexOf("corpAgPass(") >= 0, "⑪화면   검산이 러너와 같은 함수", "없음");
  chk(/지어낼 수단 자체를 두지 않았습니다|지어내지/.test(agBoard), "⑪화면   지어내지 않는다고 적는다", "없음");
  chk(/물음은 거절하지 않습니다|물어보는 것까지 막으면/.test(agBoard), "⑪화면   물음과 요청을 가른다고 적는다", "없음");
}
if (hook) {
  ["corpUpload", "CorpUpload", "corpAgent", "CorpAgentChat"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑪게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}

/* ── ⑫ 자료실 ──────────────────────────────────────────────────────────
   저장소 목차를 **팀별로** 게시한다.
     · 목록은 코드에 박지 않는다 — 파일명이 곧 대외비 저장소의 목차다.
     · 분류는 화면에서만 한다 — 스캔 스크립트와 두 벌이 되면 규칙이 갈라진다.
     · 팀 자료가 섞이지 않는다 — 팀마다 자기 것만 본다. */
const VLT = "src/data/corpVault.js";
const VLTBOARD = "src/components/CorpVault.jsx";
const VLTGEN = "scripts/gen_vault_index.py";

const VST = G("corpVaultRead")();
const VV = G("corpVaultPass")(VST);
VV.rows.forEach((r) => {
  chk(r.ok, `⑫자료실 ${r.ko} (대상 ${r.n}건)`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑫분모   ${r.ko} 검사 대상 > 0`, r.n);
});
chk(VV.pass, "⑫자료실 검산 전건 통과", VV.fail.map((f) => f.ko));

/* 분류기 — 표본을 먹여 살아 있음을 증명한다(규칙이 죽으면 「전부 기타」로 조용히 통과한다) */
const vk = G("corpVaultKind");
const ve = G("corpVaultEntity");
const KINDS = G("CORP_VAULT_KIND");
chk(KINDS.length > 1, "⑫분모   자료 종류 표본 > 1", KINDS.length);
chk(vk("HF_하이젠케어_재무제표확인원26.10.23.pdf", "02.회계/2026.결산/26.09").k === "fsconf",
  "⑫분류   재무제표확인원을 확정 자료로 가른다", vk("HF_하이젠케어_재무제표확인원26.10.23.pdf", "").k);
chk(vk("0.하이젠케어_재무제표_2026.09.30.xlsx", "").k === "fs",
  "⑫분류   작업본 재무제표는 확정 자료와 **다르게** 가른다", vk("0.하이젠케어_재무제표_2026.09.30.xlsx", "").k);
chk(KINDS.find((k) => k.k === "fsconf").key === true && !KINDS.find((k) => k.k === "fs").key,
  "⑫분류   확정 자료 표시는 확인원에만 붙는다 — 작업본을 보고 숫자를 믿는 사고를 막는다");
chk(vk("아무개.txt", "99.없음").k === "etc", "⑫분류ⓐ 자기시험 — 모르는 것은 기타로 둔다(억지로 끼우지 않는다)");
chk(ve("주주명부(글로벌예방금융).hwp", "").k === "gpf" && ve("HF_재무제표확인2025(하이젠케어).pdf", "").k === "hgc",
  "⑫법인   두 법인을 가른다(섞이면 장부가 오염된다)");

/* 팀별 — 섞이지 않는가 */
const DEPTS = G("CORP_VAULT_DEPT");
chk(DEPTS.length === G("CORP_TEAMS").length, "⑫팀     저장소 부서 수 = 팀 수", DEPTS.length + " / " + G("CORP_TEAMS").length);
chk(DEPTS.every((d) => G("CORP_TEAMS").some((t) => t.id === d.team)),
  "⑫팀     부서가 가리키는 팀이 조직도에 있다", DEPTS.filter((d) => !G("CORP_TEAMS").some((t) => t.id === d.team)).map((d) => d.team).join(" "));
const sample = [{ rel: "02.회계/x.pdf", name: "x.pdf", size: 1 }, { rel: "01.경영기획/y.pdf", name: "y.pdf", size: 1 }];
const srows = G("corpVaultRows")({ list: sample });
chk(srows.length === 2, "⑫분모   팀 분배 표본 2건", srows.length);
chk(G("corpVaultOfTeam")(srows, "M2").length === 1 && G("corpVaultOfTeam")(srows, "M1").length === 1,
  "⑫팀     자료가 제 팀으로 간다", JSON.stringify(srows.map((r) => r.team)));
chk(G("corpVaultOfTeam")(srows, "S1").length === 0, "⑫팀ⓐ   자기 팀 것이 아니면 보이지 않는다");
chk(G("corpVaultOfTeam")(srows, "").length === 2, "⑫팀     팀을 고르지 않으면 전사가 보인다");

/* 목록을 코드에 박지 않는다 — 상수 선언부에 실제 파일명이 없어야 한다 */
let vsrc = "";
try { vsrc = rd(VLT); } catch (e) { fails.push("⑫자료실 " + VLT + " 없음"); }
if (vsrc) {
  const head = vsrc.slice(0, vsrc.indexOf("function corpVaultVerdict"));
  const names = head.match(/["'][^"']*\.(pdf|xlsx|xls|docx|hwp|pptx|zip)["']/gi) || [];
  chk(names.length === 0, "⑫비밀   상수 선언부에 실제 파일명 0건(목차를 공개 배포본에 싣지 않는다)", names.join(" "));
  chk(vsrc.indexOf("localStorage") >= 0, "⑫비밀   목록은 브라우저 저장소에 둔다", "없음");
  const bare = vsrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑫결정론 Math.random 0건");
}
/* 분류를 두 곳에서 하지 않는다 — 스캔 스크립트는 사실만 내보낸다 */
let gsrc = "";
try { gsrc = rd(VLTGEN); } catch (e) { fails.push("⑫자료실 " + VLTGEN + " 없음"); }
if (gsrc) {
  const kws = ["재무제표확인", "총계정", "거래내역", "주주명부"];
  const leak = kws.filter((w) => gsrc.indexOf(w) >= 0);
  chk(leak.length === 0, "⑫단일   스캔 스크립트가 분류하지 않는다(규칙은 화면 한 곳에만)", leak.join(" "));
  chk(/사실만/.test(gsrc), "⑫단일   스크립트가 제 몫을 적어 둔다", "없음");
}
let vboard = "";
try { vboard = rd(VLTBOARD); } catch (e) { fails.push("⑫자료실 " + VLTBOARD + " 없음"); }
if (vboard) {
  chk(/function CorpVaultSection\(\{ team \}\)/.test(vboard), "⑫화면   게시판이 팀 인자를 받는다", "없음");
  chk(vboard.indexOf("corpVaultOfTeam(") >= 0, "⑫화면   팀 거르개를 화면이 부른다", "없음");
  chk(vboard.indexOf("corpVaultPass(") >= 0, "⑫화면   검산이 러너와 같은 함수", "없음");
  chk(/열어 주는 척하지 않습니다/.test(vboard), "⑫화면   파일을 열어 주지 못한다고 적는다", "없음");
  chk(/0건인 팀을 숨기지 않습니다/.test(vboard), "⑫화면   자료 0건인 팀을 숨기지 않는다고 적는다", "없음");
}
/* 조직 원천 — 팀마다 자료실 지면이 있는가 */
chk(G("CORP_TEAMS").every((t) => t.pages.some((p) => p.comp === "CorpVaultSection")),
  "⑫지면   여덟 팀 모두 자료실 지면을 갖는다",
  G("CORP_TEAMS").filter((t) => !t.pages.some((p) => p.comp === "CorpVaultSection")).map((t) => t.id).join(" "));
/* 반입 창구가 자료실로 이어지는가 */
const docSpec = G("corpUpSpec")("doc");
chk(!!docSpec && docSpec.need.indexOf("rel") >= 0 && docSpec.need.indexOf("name") >= 0,
  "⑫반입   자료 목록 반입은 경로·파일명을 필수로 받는다", docSpec && docSpec.need.join(","));
chk(!!docSpec && /자료실/.test(docSpec.into), "⑫반입   반입처가 자료실임을 적는다", docSpec && docSpec.into);
if (hook) {
  ["corpVault", "CorpVault"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑫게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}

/* ── ⑬ 은행 내역 → 전표 ────────────────────────────────────────────────
   형 지시 2026-11-12 — 「은행거래내역 자료에 따라서만 전표를 발생시켜.」
   여기서 지키는 것 셋:
     ① 엑셀 읽기는 **검사할 수 있는 층**(문자열 in / 배열 out)에 둔다. ZIP 해제는
        러너의 vm 에 DecompressionStream 이 없어 돌릴 수 없다 — 그 층에 판단을 두면 검사가 없다.
     ② 「흘린 거래」를 잡는 것은 잔액 사슬뿐이다. 대사 차이는 항진식이라 늘 0이다.
     ③ 계정은 **기계가 고르지 않는다.** 못 고른 줄이 조용히 사라지면 장부가 은행보다 적어진다. */
const XLSXF = "src/data/corpBankXlsx.js";
const BJVF = "src/data/corpBankJv.js";

/* 엑셀 표 층 — 실제로 터졌던 꼴을 전부 먹인다 */
const XT = G("cbxSelfTest")();
chk(XT.length >= 10, "⑬엑셀   표 층 자기시험 항목 ≥ 10", XT.length);
XT.forEach((r) => {
  chk(r.ok, `⑬엑셀   ${r.ko}`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑬분모   ${r.ko} 검사 대상 > 0`, r.n);
});
/* ⓐ 자기시험 — 자기닫는 빈 셀을 흘리는 파서는 **열이 밀린다.** 실제로 조사 중 한 파서가
   이 함정에 빠져 파일 구조를 잘못 보고했다. 밀리면 출금이 매출로 읽힌다. */
const ssBad = G("cbxShared")('<sst uniqueCount="3"><si><t>가</t></si><si><t/></si><si><t>다</t></si></sst>');
chk(ssBad.list.length === 3 && ssBad.ok && ssBad.list[2] === "다",
  "⑬엑셀ⓐ 빈 문자열을 흘리면 그 뒤가 한 칸 밀린다 — 밀리지 않는다", JSON.stringify(ssBad.list));
chk(!G("cbxShared")('<sst uniqueCount="5"><si><t>가</t></si></sst>').ok,
  "⑬엑셀ⓐ 선언된 개수와 다르면 **성립하지 않는다**(밀린 채 읽지 않는다)");
chk(G("cbxColIdx")("A1") === 0 && G("cbxColIdx")("Z9") === 25 && G("cbxColIdx")("AA1") === 26 && G("cbxColIdx")("AB1") === 27,
  "⑬엑셀   열 이름을 자리로 되돌린다(A·Z·AA·AB)", [G("cbxColIdx")("A1"), G("cbxColIdx")("Z9"), G("cbxColIdx")("AA1"), G("cbxColIdx")("AB1")].join(","));
chk(typeof G("cbxRead") === "function" && typeof G("cbxCan") === "function",
  "⑬엑셀   바이트 층은 따로 있다(브라우저 전용 · 러너는 표 층만 돌린다)");
let xsrc = "";
try { xsrc = rd(XLSXF); } catch (e) { fails.push("⑬엑셀 " + XLSXF + " 없음"); }
if (xsrc) {
  chk(/DecompressionStream/.test(xsrc), "⑬엑셀   압축 해제는 브라우저 내장 기능을 쓴다(라이브러리를 더하지 않는다)", "없음");
  /* ⚠️ **주석을 걷고** 센다 — 왜 안 쓰는지 적어 둔 주석이 「쓴다」로 걸리면,
     사람이 설명을 지워 가드를 통과시키는 사고가 난다. */
  const bare = xsrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  chk(!/sheetjs|SheetJS|exceljs|cdn\./i.test(bare), "⑬엑셀   외부 엑셀 라이브러리를 끌어오지 않는다", "걸림");
  chk(/\+ 30 \+ nlen \+ elen/.test(bare),
    "⑬엑셀   데이터 시작점을 **로컬 머리**의 이름·extra 길이로 잰다(목차 값과 다르다)", "없음");
  chk(/cbxU16\(b, o \+ 28\)/.test(bare), "⑬엑셀   extra 길이를 로컬 머리에서 다시 읽는다(목차는 0으로 적혀 있다)", "없음");
  chk(/0x3c/.test(bare), "⑬엑셀   푼 내용이 XML 인지 보고 아니면 멈춘다(조용히 빈 표가 되지 않는다)", "없음");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑬결정론 corpBankXlsx.js Math.random 0건");
}

/* 잔액 사슬 — 음성 표본이 **실제로 깨지는지** 본다 */
const BT = G("corpBjvSelfTest")();
chk(BT.length >= 6, "⑬잔액   사슬 자기시험 항목 ≥ 6", BT.length);
BT.forEach((r) => {
  chk(r.ok, `⑬잔액   ${r.ko}`, r.ok ? undefined : `${r.got} · 기대 ${r.want}`);
  chk(r.n > 0, `⑬분모   ${r.ko} 검사 대상 > 0`, r.n);
});

/* 계정 고르기 — 지어낸 기본값이 없는가 */
const SURE = G("CORP_BJV_SURE");
chk(SURE.length >= 1, "⑬분모   확실한 대응 표본 > 0", SURE.length);
chk(SURE.every((x) => G("corpAcct")(x.c)), "⑬계정   확실한 대응은 전부 계정과목표에 있다", SURE.filter((x) => !G("corpAcct")(x.c)).map((x) => x.c));
chk(SURE.every((x) => (x.why || "").trim()), "⑬계정   확실하다고 한 근거가 적혀 있다", SURE.filter((x) => !(x.why || "").trim()).map((x) => x.w));
chk(!SURE.some((x) => x.w === "매입비용" || x.w === "수수료"),
  "⑬계정ⓐ 실제 장부에서 갈린 낱말은 **코드가 못 박지 않는다**", SURE.map((x) => x.w).join(" "));
const pickEmpty = G("corpBjvPick")("", "in", { map: {} }, []);
chk(!pickEmpty.c && (pickEmpty.why || "").trim(), "⑬계정   분류가 비면 고르지 않고 이유를 적는다", pickEmpty.why);
const pickUnknown = G("corpBjvPick")("처음보는낱말", "out", { map: {} }, []);
chk(!pickUnknown.c && (pickUnknown.why || "").trim(), "⑬계정ⓐ 모르는 낱말을 **아무 계정에나 넣지 않는다**", pickUnknown.why);
const pickSure = G("corpBjvPick")("상품매출", "in", { map: {} }, []);
chk(pickSure.c === "401" && pickSure.src === "sure", "⑬계정   확실한 낱말은 바로 선다(늘 막는 벽이 아니다)", JSON.stringify(pickSure));
const pickSaved = G("corpBjvPick")("처음보는낱말", "out", { map: { "처음보는낱말|out": "831" } }, []);
chk(pickSaved.c === "831" && pickSaved.src === "saved", "⑬계정   사람이 확정한 것을 기억해 다음부터 쓴다", JSON.stringify(pickSaved));
/* 한 낱말이 지난 장부에서 두 계정으로 갈렸으면 **기억해도 다시 묻는다** */
const splitJv = [{ id: "a", d: "2026-10-01", desc: "매입비용 지급", l: [["251", 100, 0, ""], ["103", 0, 100, ""]] },
                 { id: "b", d: "2026-11-01", desc: "매입비용 지급", l: [["831", 100, 0, ""], ["103", 0, 100, ""]] }];
const pickSplit = G("corpBjvPick")("매입비용", "out", { map: { "매입비용|out": "831" } }, splitJv);
chk(!pickSplit.c && pickSplit.src === "split", "⑬계정ⓐ 갈린 낱말은 기억이 있어도 **다시 묻는다**(틀린 선택이 복제되지 않게)", JSON.stringify(pickSplit));
const pickNow = G("corpBjvPick")("매입비용", "out", { map: {}, pick: { "매입비용|out": "451" } }, splitJv);
chk(pickNow.c === "451" && pickNow.src === "picked", "⑬계정   지금 사람이 고른 것이 무엇보다 앞선다(고를 수 없는 줄이 되지 않는다)", JSON.stringify(pickNow));

/* 전표로 바꾸기 — 전건 대응이 서는가 */
const BL = [
  { row: 2, d: "2026-11-10", t: "11:05:45", a: 900000, bal: 1977986, m: "입금A", cls: "상품매출" },
  { row: 3, d: "2026-11-10", t: "11:11:56", a: 1800000, bal: 3777986, m: "입금B", cls: "상품매출" },
  { row: 4, d: "2026-11-10", t: "11:25:55", a: -2420000, bal: 1357986, m: "출금A", cls: "매입비용" },
  { row: 5, d: "2026-11-10", t: "11:27:40", a: 120000, bal: 1477986, m: "입금C", cls: "상품매출" },
];
const BB = G("corpBjvBuild")(BL, { map: {} }, { jv: [], closed: [], ov: {} }, []);
chk(BB.made.length + BB.held.length + BB.dup.length === BB.n && BB.n === 4,
  "⑬전표   은행 줄 = 전표 + 보류 + 이미 있음 (한 줄도 흘리지 않는다)", JSON.stringify({ made: BB.made.length, held: BB.held.length, dup: BB.dup.length, n: BB.n }));
chk(BB.made.length === 3 && BB.held.length === 1,
  "⑬전표   확실한 줄은 전표가 되고 모르는 줄만 남는다", JSON.stringify({ made: BB.made.length, held: BB.held.length }));
chk(BB.held.every((h) => (h.why || "").trim() && h.row > 0), "⑬전표   보류 줄마다 몇 행인지와 이유가 있다", JSON.stringify(BB.held[0]));
chk(BB.made.every((j) => (j.l || []).some((l) => l[0] === "103")), "⑬전표   모든 전표가 보통예금을 상대로 선다");
chk(BB.made.every((j) => G("corpJvSum")(j).ok), "⑬전표   만든 전표가 전건 차대 일치");
const inJv = BB.made.find((j) => j.l[0][0] === "103");
chk(!!inJv && inJv.l[0][1] > 0, "⑬전표   입금은 보통예금 **차변**에 선다", JSON.stringify(inJv && inJv.l));
const outRow = BB.made.find((j) => j.l[1][0] === "103");
chk(!outRow || outRow.l[1][2] > 0, "⑬전표   출금은 보통예금 **대변**에 선다");
const ids = BB.made.map((j) => j.id);
chk(ids.join(" ") === "20261110-01 20261110-02 20261110-03",
  "⑬전표   번호는 거래 **시각 오름차순**으로 그날 01부터(기존 10·11월 규약 역산)", ids.join(" "));
chk(BB.made.every((j) => j.by === "은행반입" && !j.ap && j.st === "draft"),
  "⑬전표   은행에서 만든 전표는 **기표 상태**로 앉는다(반입이 곧 장부가 되지 않는다)", JSON.stringify(BB.made[0] && { by: BB.made[0].by, st: BB.made[0].st }));
/* 마감된 달은 들어가지 않는다 — 그리고 **사라지지도 않는다** */
const BBC = G("corpBjvBuild")(BL, { map: {} }, { jv: [], closed: ["2026-11"], ov: {} }, []);
chk(BBC.made.length === 0 && BBC.held.length === 4,
  "⑬마감   마감된 달의 줄은 전표가 되지 않고 **보류로 남는다**", JSON.stringify({ made: BBC.made.length, held: BBC.held.length }));
chk(BBC.held.some((h) => /마감/.test(h.why || "")), "⑬마감   왜 안 들어갔는지 마감이라고 적는다", BBC.held[0] && BBC.held[0].why);
/* 두 번 올려도 두 배가 되지 않는다 */
const BB2 = G("corpBjvBuild")(BL, { map: {} }, { jv: BB.made, closed: [], ov: {} }, BB.made);
chk(BB2.made.length === 0 && BB2.dup.length === 3,
  "⑬중복   같은 파일을 두 번 올려도 전표가 더 생기지 않는다", JSON.stringify({ made: BB2.made.length, dup: BB2.dup.length }));
chk(BB2.dup.every((d) => d.id && (d.why || "").trim()), "⑬중복   건너뛴 줄마다 어느 전표와 겹치는지 적는다", JSON.stringify(BB2.dup[0]));
/* 손으로 넣은 전표와 겹칠 때도 조용히 두 배가 되지 않는다 */
const hand = [{ id: "20261110-99", d: "2026-11-10", desc: "손으로 넣음", st: "posted", by: "조성래", ap: "핀테크",
  l: [["103", 900000, 0, ""], ["401", 0, 900000, ""]] }];
const BB3 = G("corpBjvBuild")(BL, { map: {} }, { jv: hand, closed: [], ov: {} }, hand);
chk(BB3.dup.length === 1 && BB3.dup[0].soft && /이미 있습니다/.test(BB3.dup[0].why || ""),
  "⑬중복ⓐ 은행에서 만들지 않은 같은 거래도 **사람에게 보인다**", JSON.stringify(BB3.dup[0] && { id: BB3.dup[0].id, soft: !!BB3.dup[0].soft }));
chk(BB3.made.length + BB3.held.length + BB3.dup.length === 4, "⑬중복   그래도 전건 대응은 선다", BB3.made.length + "+" + BB3.held.length + "+" + BB3.dup.length);

/* 밀린 날 세기 — 거래일이 아니라 **올린 기간**으로 센다 */
chk(G("corpBjvDue")({ to: "2026-11-11" }, "2026-11-12").ok, "⑬매일   어제 것까지 있으면 밀리지 않았다");
chk(G("corpBjvDue")({ to: "2026-11-08" }, "2026-11-12").late === 3, "⑬매일   비어 있는 날수를 센다", G("corpBjvDue")({ to: "2026-11-08" }, "2026-11-12").late);
chk(!G("corpBjvDue")(null, "2026-11-12").ok, "⑬매일   한 번도 안 올렸으면 밀린 것이다");
chk(!G("corpBjvDue")({ to: "2026-11-11" }, "").ok, "⑬매일ⓐ 오늘이 정해지지 않으면 **통과로 세지 않는다**");
chk(G("corpBjvShiftDay")("2026-03-01", -1) === "2026-02-28" && G("corpBjvShiftDay")("2027-01-01", -1) === "2026-12-31",
  "⑬매일   달·해를 넘어가도 어제를 바르게 센다", [G("corpBjvShiftDay")("2026-03-01", -1), G("corpBjvShiftDay")("2027-01-01", -1)].join(" "));

/* 화면 — 은행 대사 지면 안에 있고, 민감 검사가 미리보기보다 **앞**인가 */
let bkBoard = "";
try { bkBoard = rd(BOARD); } catch (e) { fails.push("⑬화면 " + BOARD + " 없음"); }
if (bkBoard) {
  chk(/function ClBankUp\(/.test(bkBoard), "⑬화면   은행 내역 올리기 패널이 재무현황 지면에 있다", "없음");
  chk(/<ClBankUp /.test(bkBoard), "⑬화면   은행 대사 지면이 그 패널을 띄운다", "없음");
  const iUp = bkBoard.indexOf("const UP = <ClBankUp");
  const iNone = bkBoard.indexOf("if (R.none)");
  chk(iUp >= 0 && iNone >= 0 && iUp < iNone,
    "⑬화면   패널이 **두 갈래 앞**에 선다(한 번 올린 뒤 올릴 자리가 사라지지 않는다)", { up: iUp, none: iNone });
  const iScan2 = bkBoard.indexOf("corpUpScan(");
  const iSet2 = bkBoard.indexOf("setRaw({");
  chk(iScan2 >= 0 && iSet2 >= 0 && iScan2 < iSet2,
    "⑬화면   민감자료 검사가 미리보기보다 **앞**이다(입구가 둘인데 한쪽만 막으면 막는 것이 아니다)", { scan: iScan2, prev: iSet2 });
  chk(/corpBjvBuild\(/.test(bkBoard) && /corpBjvChain\(/.test(bkBoard), "⑬화면   전표 만들기·잔액 검사는 러너와 같은 함수", "없음");
  chk(/0xd0/.test(bkBoard) && /0x50/.test(bkBoard), "⑬화면   파일 머리를 보고 엑셀·구형엑셀을 가른다(쓰레기 표를 띄우지 않는다)", "없음");
  chk(/자동으로 가져오지 못/.test(bkBoard), "⑬화면   계좌를 자동으로 가져오지 못한다고 적는다", "없음");
  chk(/어디로도 전송되지 않습니다/.test(bkBoard), "⑬화면   파일이 전송되지 않는다고 적는다", "없음");
  chk(/기계가 고르지 않습니다/.test(bkBoard), "⑬화면   계정은 사람이 고른다고 적는다", "없음");
  chk(/틀린 선택도 그대로 복제됩니다|틀린 선택도/.test(bkBoard), "⑬화면   기억의 위험도 함께 적는다", "없음");
  chk(/거래가 0건인 날과 안 올린 날/.test(bkBoard), "⑬화면   기간을 사람이 적는 까닭을 적는다", "없음");
}
let bjvSrc = "";
try { bjvSrc = rd(BJVF); } catch (e) { fails.push("⑬엔진 " + BJVF + " 없음"); }
if (bjvSrc) {
  const bare = bjvSrc.replace(/\/\*[\s\S]*?\*\//g, "");
  chk((bare.match(/Math\.random/g) || []).length === 0, "⑬결정론 corpBankJv.js Math.random 0건");
  chk(!/new Date\(\)/.test(bare), "⑬결정론 corpBankJv.js 인자 없는 new Date() 0건(날짜는 인자로 받는다)");
  const names = bare.match(/["'][^"']*(연세|이지영|설영호|이일규)[^"']*["']/g) || [];
  chk(names.length === 0, "⑬비밀   실제 거래 상대 이름이 코드에 0건(공개 배포본에 회사 거래를 싣지 않는다)", names.join(" "));
}
/* 저장 키 등재 */
chk(cat.indexOf('"' + G("CORP_BJV_KEY") + '"') >= 0, `⑬카탈로그 저장 키 ${G("CORP_BJV_KEY")} dataCatalog.js 등재`, "미등재");
if (hook) {
  ["corpBankXlsx", "corpBankJv"].forEach((n) => {
    chk(hook.indexOf(n) >= 0, `⑬게이트 pre-commit 감시 대상에 ${n}`, "미등재");
  });
}
/* 매니페스트와 러너 적재 순서가 **같은가** — 어긋나면 러너 녹색·브라우저 사망이 가능하다 */
const MANI = rd("src/_manifest.txt").split("\n").map((x) => x.trim()).filter(Boolean);
["src/data/corpBankXlsx.js", "src/data/corpBankJv.js"].forEach((f) => {
  chk(MANI.indexOf(f) >= 0, `⑬번들   ${f} 가 매니페스트에 있다`, "없음");
});
chk(MANI.indexOf("src/data/corpBankXlsx.js") < MANI.indexOf("src/data/corpBankJv.js"),
  "⑬번들   매니페스트 순서가 러너 적재 순서와 같다");


/* ── 보고 ───────────────────────────────────────────────────────────────── */
const total = oks.length + fails.length;
console.log(`[회계엔진] 파일럿 전표 ${seedN}건(전기 ${postedN}) · 계정 ${G("CORP_ACCT.length")}과목 · 은행 ${R.lines.length}줄(대사 ${R.matched} · 미대사 ${R.bankOnly.length + R.bookOnly.length})`);
const S = G("corpStatements(CORP_JV_SEED)");
console.log(`[회계엔진] 자산 ${G("corpWon")(S.bs.assets)} = 부채 ${G("corpWon")(S.bs.liab)} + 자본 ${G("corpWon")(S.bs.equity)} + 손익 ${G("corpWon")(S.pl.net)}`);
const PU = G("corpPaUnmatched")(G("CORP_JV_SEED"), PACAL);
console.log(`[예실대비] 계획 비목 ${PU.leaves}(확정 ${PU.planOk.length} · 후보 ${PU.planAsk.length} · 대응없음 ${PU.planNone.length}) · ` +
  `손익 계정 ${PU.accts}(확정 ${PU.acctOk.length} · 후보 ${PU.acctAsk.length} · 대응없음 ${PU.acctNone.length}) · ` +
  `비교 가능 달 ${PM.join("·") || "없음"} · 차이 산출 ${preRows.filter((r) => r.diff !== null).length}행`);
console.log(`[주간회의] 주차 ${MW && MW.key}(D-${MW && MW.dday}) · 참석 사람 ${ATT.people.length}(재직) · AI ${ATT.agents.length} · 공석 ${ATT.vacant.length} · ` +
  `보고 ${REPS.length}팀(확정 가능 ${canFix.length} · 확정자 공석 ${noOwner.length}) · 원천 연결 ${linked.length}팀 · ` +
  `생성 경로 루틴 ${GEN.length} / ${SCHED.routines.length}`);
console.log(`[자료실  ] 종류 ${KINDS.length}종(확정 자료 ${KINDS.filter((k) => k.key).length}) · 부서 ${DEPTS.length} ↔ 팀 ${G("CORP_TEAMS").length} · 팀별 지면 ${G("CORP_TEAMS").filter((t) => t.pages.some((p) => p.comp === "CorpVaultSection")).length}/${G("CORP_TEAMS").length} · 대장 ${G("corpVaultRows")(VST).length}건(반입분)`);
console.log(`[반입대화] 반입 섹션 ${G("CORP_UP_SPEC").length}종(상한 ${G("CORP_UP_MAXKB")}KB) · 민감 패턴 ${G("CORP_UP_SCAN").length}종 · AI 팀장 ${AGL.length}명(도구 보유 ${hasTool.length} · 도구 없음 ${noTool.length}) · 도구 ${G("CORP_AG_TOOL").length}종`);
console.log(`[결재릴리스] 릴리스 ${RELS.length}건 · 승인 가능자 ${RELWHO.length}명(S1) · 결재 종류 ${G("CORP_APR_KIND").length}종 · 점검 ${G("CORP_REL_CHECK").length}항목 · 필독 ${must.length}건(미확인 ${must.reduce((n, m) => n + m.left.length, 0)}명) · 게이트 ${GATES.length}종 훅 대조`);
console.log(`[은행전표] 엑셀 표 층 ${XT.length}항목 · 잔액 사슬 ${BT.length}항목 · 확실한 계정 대응 ${SURE.length}종(나머지는 사람이 확정) · 표본 ${BB.n}줄 → 전표 ${BB.made.length} · 보류 ${BB.held.length}`);
console.log(`[인사계약] 인사 ${HR.length}명(재직 ${G("corpHrOn")().length}) · 금지 필드 ${BAN.length}종 전수 부재 · 주민번호 값 보유 0 · 보관 조건 0/${GATE4.length} · 계약 ${CT.length}건(경보 ${CT.filter((c) => { const k = G("corpCtAlert")(c, ANOW).k; return k !== "ok" && k !== "none"; }).length}) · 문서 분류 ${DOC.length}종(원문 미확인 ${DOC.filter((d) => !d.checked).length})`);
if (fails.length) {
  console.log(`[회계엔진] 통과 ${oks.length} · 실패 ${fails.length} / ${total}`);
  fails.forEach((f) => console.log("  ✗ " + f));
  console.log("[회계엔진] 장부가 성립하지 않습니다 — 커밋을 막습니다.");
  process.exit(1);
}
console.log(`[회계엔진] 통과 ${oks.length} / ${total} · 실패 0`);
process.exit(0);
