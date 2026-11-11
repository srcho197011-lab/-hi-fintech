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
  "src/components/CorpUpload.jsx", "src/components/CorpAgentChat.jsx", "src/components/CorpOps.jsx"];
const LOAD = ["src/data/finBudgetParams.js", "src/data/finBudget.js", "src/data/finModel.js",
  ORG, LEDGER, PA, MTG, "src/data/corpAdmin.js", "src/data/corpGov.js",
  "src/data/corpUpload.js", "src/data/dataCatalog.js", "src/data/corpAgent.js"];
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
chk(RT.filter((x) => x.s.state === "due" && GEN.indexOf(x.t) < 0).length === 0,
  "⑧루틴   생성 경로 없는 루틴에 「밀림」 0건", RT.filter((x) => x.s.state === "due" && GEN.indexOf(x.t) < 0).map((x) => x.t).join(" "));
chk(RT.filter((x) => GEN.indexOf(x.t) < 0 && x.s.state !== "rel").every((x) => x.s.state === "nogen"),
  "⑧루틴   나머지는 「생성 경로 없음」으로 표시", RT.filter((x) => GEN.indexOf(x.t) < 0 && x.s.state !== "rel" && x.s.state !== "nogen").map((x) => x.t).join(" "));
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
}
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
console.log(`[반입대화] 반입 섹션 ${G("CORP_UP_SPEC").length}종(상한 ${G("CORP_UP_MAXKB")}KB) · 민감 패턴 ${G("CORP_UP_SCAN").length}종 · AI 팀장 ${AGL.length}명(도구 보유 ${hasTool.length} · 도구 없음 ${noTool.length}) · 도구 ${G("CORP_AG_TOOL").length}종`);
console.log(`[결재릴리스] 릴리스 ${RELS.length}건 · 승인 가능자 ${RELWHO.length}명(S1) · 결재 종류 ${G("CORP_APR_KIND").length}종 · 점검 ${G("CORP_REL_CHECK").length}항목 · 필독 ${must.length}건(미확인 ${must.reduce((n, m) => n + m.left.length, 0)}명) · 게이트 ${GATES.length}종 훅 대조`);
console.log(`[인사계약] 인사 ${HR.length}명(재직 ${G("corpHrOn")().length}) · 금지 필드 ${BAN.length}종 전수 부재 · 주민번호 값 보유 0 · 보관 조건 0/${GATE4.length} · 계약 ${CT.length}건(경보 ${CT.filter((c) => { const k = G("corpCtAlert")(c, ANOW).k; return k !== "ok" && k !== "none"; }).length}) · 문서 분류 ${DOC.length}종(원문 미확인 ${DOC.filter((d) => !d.checked).length})`);
if (fails.length) {
  console.log(`[회계엔진] 통과 ${oks.length} · 실패 ${fails.length} / ${total}`);
  fails.forEach((f) => console.log("  ✗ " + f));
  console.log("[회계엔진] 장부가 성립하지 않습니다 — 커밋을 막습니다.");
  process.exit(1);
}
console.log(`[회계엔진] 통과 ${oks.length} / ${total} · 실패 0`);
process.exit(0);
