/* ══════════ 협력업체 통제 — 정책 레지스트리 · 판정기 가드 (P3 · 지시서 §13-5 · §14-1) ══════════
   왜 있는가: 조항을 코드 분기에 흩뿌리지 않고 한 테이블에 모았고, 그 테이블을 읽는 순수 함수 하나만이
   판정을 낸다. 그 구조가 유지되는지를 **사람 눈이 아니라 수치로** 지킨다. 특히 지키는 것 두 가지 —
     ① 확인하지 못한 법으로 위반을 적지 않는다(하드 플로어). 우회가 생기면 단언 4가 잡는다.
     ② 원문 확인되지 않은 조문 번호를 인쇄하지 않는다. 「미확인」 배지를 달고 틀린 조문이 보고서에
        찍히면 배지는 전문성의 증거가 아니라 **알고도 인쇄했다는 기록**이 된다(단언 5).

   단언 13항목 (지시서 §13-5 검증표)
     1  전 조항이 4결정값만 산출 · cause 가 항상 채워짐
     2  INDETERMINATE 가 PERMIT 으로 새지 않음(fail-closed)
     3  NOT_APPLICABLE 이 위반율 분자에 들어가지 않음
     4  verified 를 전부 「미확인」으로 바꾸면 전 매트릭스에서 DENY 0건 — **플로어 우회 탐지**
        ⚠ 기준선 DENY 가 0이면 0 = 0으로 통과한다. 그래서 **기준선 > 0 을 함께 요구**한다
     5  verified !== 「원문확인」인 법령 · 표준은 article 이 null — 법령 조문 번호와 표준 통제 번호 양쪽
     6  시행 전 조항이 「해당 없음」으로 렌더되지 않음 — **양성 테스트**(미도래 시행일을 주입해 확인)
     7  정책 테이블이 JSON.stringify 로 무손실 직렬화 · 함수를 담은 조항 0건
     8  모든 유형 × 모든 조항의 해당성이 명시됨 · 필드 고아 · 조항 고아 0 · 임계 상수 외부 리터럴 0
     9  골든 케이스 전건 일치 — **파일이 없으면 「미검증」으로 실패한다**(0 = 0 으로 통과시키지 않는다)
     10 스냅샷 산출 경로 규약 — scripts/ 에는 **해시 · 건수 · 분포만**. 전건 판정 결과 · 식별자 0건
     11 법령명 × 조문 중복 등재 0 — PG_LAWS 안에서도, KB_LEGAL 과의 사이에서도
     12 appliesToSelf 인 법령에 대응하는 자기 항목이 존재 — 수범자가 우리인 조문을 협력업체에만 걸면 실패
     13 sanction.kind === 「과태료」인 조항의 집행 수준이 hard 아님(비례성)
     + 15 L-09 의 모든 집행 지점이 advisory(Q11 형 확정 · 동결)

   실행: node scripts/run_pg_policy.mjs      (브라우저 불필요 — vm 직접 적재, 수 초)
   게이트: scripts/githooks/pre-commit 의 협력업체 통제 블록
   산출: scripts/pg_policy_snapshot.json  (해시 · 건수 · 분포만 — 커밋이 반출이다 · §14-1-1)
   ⚠ 정적 검사는 **주석을 걷어낸 뒤** 센다. 머리 주석에 「Math.random 0건」이라 적어 두면
      주석을 포함한 스캔은 그 설명을 위반으로 잡는다 — 그러면 다음 사람이 설명을 지워 가드를
      통과시킨다. wording_guard 검사 ⑤가 같은 이유로 주석을 걷어낸다. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const t0 = Date.now();
const ok = [], fail = [];
const chk = (cond, label, got) => { (cond ? ok : fail).push(label + (cond ? "" : "  ← 실제: " + JSON.stringify(got))); };
const RANK = { "원문확인": 3, "부분확인": 2, "미확인": 1 };
const KINDS = ["PT-MED", "PT-CARE", "PT-SVC", "PT-COM"];
const DEC = ["PERMIT", "DENY", "NOT_APPLICABLE", "INDETERMINATE"];
const ASOF = "2026-10-25";

/* ── 데이터 레이어 적재 (selfreal_check · wording_guard 선례) ── */
const manifest = fs.readFileSync(path.join(ROOT, "src/_manifest.txt"), "utf8").split(/\r?\n/).filter(Boolean);
const store = new Map();
const c = {
  console: { log() {}, warn() {}, error() {}, info() {} },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() },
  setTimeout, clearTimeout, escape: (s) => s,
};
c.window = c; c.self = c; c.globalThis = c;
c.document = { createElement: () => ({ style: {} }), body: { appendChild() {}, removeChild() {} } };
c.React = { useState: () => [null, () => {}], useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }) };
vm.createContext(c);
for (const f of ["src/data/dummy_data.js", "src/data/section_data.js", "src/data/demo_members.js"])
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c, { filename: f }); } catch (e) { fail.push("plain 적재 실패 " + f); }
let loaded = 0;
for (const f of manifest) {
  if (!/\.js$/.test(f)) continue;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c, { filename: f }); loaded++; }
  catch (e) { fail.push("모듈 적재 실패 " + f + " :: " + String(e.message).split("\n")[0]); }
}
chk(loaded > 100, "데이터 모듈 적재", loaded);
const run = (code) => vm.runInContext("(() => {" + code + "})()", c, { filename: "pgcheck" });
let H = null;
try { H = run("return __hifinPG();"); } catch (e) { fail.push("__hifinPG 훅이 없다 :: " + e.message); }
if (!H) { report(); process.exit(1); }

const lawIds = Object.keys(H.laws);
const pols = H.policies;

/* ════════ 단언 1 · 2 · 3 — 결정값 · fail-closed · 분모 ════════ */
const EMPTY = (kind) => ({ partnerId: "PT-CHK-0001", kind, submit: {}, self: {}, products: [], licenses: [], evidence: [] });
const matrix = [];
for (const kind of KINDS)
  for (const p of pols)
    matrix.push({ kind, id: p.id, r: H.decide(p.id, EMPTY(kind), { kind, stage: "거래중", asOf: ASOF }) });
chk(matrix.filter((x) => DEC.indexOf(x.r.decision) < 0).length === 0,
  "단언 1-a 4결정값만 산출", matrix.filter((x) => DEC.indexOf(x.r.decision) < 0).map((x) => x.kind + "/" + x.id + ":" + x.r.decision));
const causeAxis = run("return PG_AXES.cause.map((x) => x[0]);");
const badCause = matrix.filter((x) => x.r.decision !== "PERMIT" && (!x.r.cause || causeAxis.indexOf(x.r.cause) < 0));
chk(badCause.length === 0, "단언 1-b cause 가 항상 채워지고 축 안의 값이다", badCause.map((x) => x.kind + "/" + x.id + ":" + x.r.cause));
chk(matrix.filter((x) => x.r.decision === "PERMIT" && x.r.cause !== null).length === 0,
  "단언 1-c PERMIT 은 cause 가 null 이다", matrix.filter((x) => x.r.decision === "PERMIT" && x.r.cause !== null).map((x) => x.id));
/* 2 — 증거가 하나도 없는 레코드에서 PERMIT 이 나오면 fail-closed 가 깨진 것이다 */
const leaked = matrix.filter((x) => x.r.decision === "PERMIT");
chk(leaked.length === 0, "단언 2 빈 레코드에서 PERMIT 0건(fail-closed)", leaked.map((x) => x.kind + "/" + x.id));
/* 3 — 분모 규약: NOT_APPLICABLE 은 분자에도 분모에도 들어가지 않는다 */
const na = matrix.filter((x) => x.r.decision === "NOT_APPLICABLE");
chk(na.length > 0, "단언 3-a 해당 없음이 실제로 발생한다(검사가 공집합에서 통과하지 않는다)", na.length);
chk(na.every((x) => x.r.enforce && x.r.enforce.block === false),
  "단언 3-b 해당 없음은 어떤 집행 지점에서도 차단하지 않는다", na.filter((x) => x.r.enforce && x.r.enforce.block).map((x) => x.id));
const denom = run(`
  const d = (typeof PG_DENOM !== "undefined") ? PG_DENOM : null;
  return d ? { compliance: d.compliance.denom, defect: d.defect ? d.defect.denom : null } : null;`);
chk(!!denom && /해당없음|해당 없음/.test(String(denom.compliance)) && /pending/.test(String(denom.compliance)),
  "단언 3-c 준수율 분모 규약이 해당 없음과 판정 보류를 모두 뺀다", denom);

/* ════════ 단언 4 — 플로어 우회 탐지 (기준선 > 0 을 함께 요구) ════════ */
function badRec(kind) {
  return {
    partnerId: "PT-CHK-BAD", kind,
    submit: {
      biz_status: "폐업", ad_review_no: null, ad_review_to: "2020-01-01",
      dpa_no_other_use: true, dpa_safeguards: true, dpa_purpose_scope: null, dpa_subcontract_limit: true,
      dpa_access_control: true, dpa_supervision: true, dpa_liability: true,
      sub_exists: true, sub_consent_at: null,
      sanction_list: [{ level: "영업정지" }], sanction_level: "영업정지",
      ai_used: true, ai_highimpact: true, ai_highimpact_basis: "자체확인", ai_generative: false, ai_notice_text: null,
      recall_open: true, complaint_system: false, complaint_stats: "x", withdrawal_terms: false,
      emg_route: "경로", emg_owner: "EMP0001", emg_drill_at: "2020-01-01",
      ethics_doc: true, ethics_activity_at: "2020-01-01", risk_list: true, risk_updated_at: "2020-01-01",
      access_policy: true, access_review_at: "2020-01-01", cert_list: [{}], cert_scope: "전사",
      training_plan: true, training_done_at: "2020-01-01",
      finding_process: true, finding_closed: [{ closedAt: null }],
      notice_channel: true, notice_recent_at: "2020-01-01",
      compliance_fn: false, antibribery_fn: false, compliance_ops: [{}],
      label_doc: "라벨", service_count: 10, service_rate: 0.1,
      model_card: "mc", model_validation: "mv", model_version: "1",
      service_acts: [{ a: 1 }], guideline_match: { expertise: true, diagnosis: false, hygieneRisk: false, borderline: false },
      authority_reply: null,
    },
    licenses: [{ type: "제조업 허가", basis: "허가", no: null, issuer: "기관", to: "2020-01-01" }],
    manufacturingSites: [{ gmp: false }], products: [{ id: "P1", name: "기능성 개선 제품" }], evidence: [],
    self: {
      privacyPolicy: { processors: ["PT-OTHER"], snapshotAt: "2026-10-01" },
      delegation: { kind: "홍보", changedAt: "2026-09-01" }, notice: {},
      settle: { linkedToTreatmentCost: true, introFeeExists: true, formulaRef: "x" },
      contract: { feeClause: "x" }, exposure: { selective: true }, careStream: { payee: "당사" }, legalReview: {},
      /* ★ 중개자 지위 고지는 **실측 입력**이다(2026-10-26) — 「제출받지 못했다」가 아니라
         「지면 고지 레지스트리를 전수로 세어 보니 0곳이다」. 측정값 0 은 결측이 아니므로 불허가 선다. */
      shop: { brokerNotice: { k: "brokerNotice", n: 0, places: [], registry: "PG_SCREEN_NOTICE" },
        brokerNoticeWhen: null,
        statusMap: [{ selfIsSeller: true }], withdrawalProcess: null, withdrawalLog: [] },
    },
    rollup: { cell: { slaMet: 0.5, breachMonths: 3 } }, ops: { slaWarnRate: 0.1 }, contract: { slaDays: 3 },
  };
}
const countDeny = () => {
  let n = 0;
  for (const kind of KINDS) for (const p of pols)
    if (H.decide(p.id, badRec(kind), { kind, stage: "거래중", asOf: ASOF }).decision === "DENY") n++;
  return n;
};
const denyBase = countDeny();
chk(denyBase > 0, "단언 4-a 기준선 DENY > 0 — 0 = 0 으로 통과시키지 않는다", denyBase);
const hashBefore = H.hash;
run(`
  globalThis.__pgBk = JSON.stringify(PG_LAWS);
  for (const id of Object.keys(PG_LAWS)) {
    const L = PG_LAWS[id];
    if (L.articles) for (const a of Object.keys(L.articles)) L.articles[a].verified = "미확인";
    L.verified = "미확인";
  } return 1;`);
const denyAfter = countDeny();
run(`
  const B = JSON.parse(globalThis.__pgBk);
  for (const id of Object.keys(B)) {
    const L = PG_LAWS[id], b = B[id];
    if (b.articles) for (const a of Object.keys(b.articles)) L.articles[a].verified = b.articles[a].verified;
    L.verified = b.verified;
  } delete globalThis.__pgBk; return 1;`);
chk(denyAfter === 0, "단언 4-b 확인 등급을 전부 미확인으로 내리면 DENY 0건(플로어 우회 없음)", denyAfter);
chk(countDeny() === denyBase, "단언 4-c 복원 후 기준선 재현", { base: denyBase, back: countDeny() });
chk(H.hashOf() === hashBefore, "단언 4-d 복원 후 정책 테이블 해시 일치", { before: hashBefore, after: H.hashOf() });

/* ════════ 단언 5 — 조문 번호 · 표준 통제 번호 게이트 ════════ */
const art5 = [];
for (const id of lawIds) {
  const L = H.laws[id];
  if (L.articles) {
    for (const a of Object.keys(L.articles)) {
      const x = L.articles[a];
      if (x.verified !== "원문확인" && x.article !== null) art5.push(id + "/" + a);
      if (RANK[x.verified] === undefined) art5.push(id + "/" + a + " 확인 등급 축 밖");
    }
    if (L.article !== undefined && L.article !== null) art5.push(id + " 조문 하위표가 있는데 항목 수준 article 도 있다(두 곳에 적었다)");
  } else {
    if (L.verified !== "원문확인" && L.article !== null) art5.push(id);
    if (RANK[L.verified] === undefined) art5.push(id + " 확인 등급 축 밖");
  }
  if (L.sanction && L.sanction.verified !== "원문확인" && L.sanction.article !== null) art5.push(id + "/sanction");
}
chk(art5.length === 0, "단언 5-a 원문확인이 아닌 법령 · 표준의 조문 · 통제 번호가 null", art5);
let leak5 = 0;
for (const id of lawIds) {
  const L = H.laws[id];
  for (const a of (L.articles ? Object.keys(L.articles) : [null])) {
    const r = H.lawRender(id, a);
    if (r.verified !== "원문확인" && (r.article || r.lawVersion || r.source)) leak5++;
    if (r.verified !== "원문확인" && !/조문 미확인/.test(r.label)) leak5++;
  }
}
chk(leak5 === 0, "단언 5-b 렌더 게이트 누출 0 — 미확인이면 「조문 미확인」만 나간다", leak5);
const stdNo = lawIds.filter((id) => H.laws[id].basis === "표준" && H.laws[id].article !== null);
chk(stdNo.length === 0, "단언 5-c 표준 항목의 통제 번호 0건(§6-4 ④ 확장)", stdNo);

/* ════════ 단언 6 — 시행 전 양성 테스트 ════════ */
const futNow = pols.filter((p) => p.appliesTo.some((k) => {
  const e = H.lawCite(p.lawRef, p.lawArticle, k).effectiveDate; return e && e > ASOF;
}));
const fut = run(`
  const bk = PG_LAWS.pipa.articles["제26조"].effectiveDate;
  PG_LAWS.pipa.articles["제26조"].effectiveDate = "2099-01-01";
  const r = pgDecide("L-04", { partnerId: "PT-CHK-1", kind: "PT-COM", submit: {}, self: {} }, { kind: "PT-COM", asOf: "${ASOF}" });
  PG_LAWS.pipa.articles["제26조"].effectiveDate = bk;
  return { decision: r.decision, cause: r.cause, reasons: r.reasons };`);
chk(fut.decision === "NOT_APPLICABLE" && fut.cause === "not_yet_effective",
  "단언 6-a 미도래 시행일은 「시행 전」으로 간다(「해당 없음」이 아니다 · 양성 테스트)", fut);
chk(/시행 전\(시행일 2099-01-01\)/.test((fut.reasons || []).join(" ")),
  "단언 6-b 렌더 문구에 시행일이 들어간다", fut.reasons);
chk(H.hashOf() === hashBefore, "단언 6-c 주입 복원 후 해시 일치", H.hashOf());
const stageEffect = run("return (typeof PG_STAGE_EFFECT !== 'undefined') ? PG_STAGE_EFFECT.filter((r) => r.cause === 'not_yet_effective')[0] : null;");
chk(!!stageEffect && stageEffect.block === false && /시행 전/.test(String(stageEffect.render)),
  "단언 6-d 시행 전 조항은 차단하지 않고 별 목록으로 집계된다", stageEffect);

/* ════════ 단언 7 — 순수 데이터 ════════ */
const ser = JSON.stringify(pols);
chk(JSON.stringify(JSON.parse(ser)) === ser, "단언 7-a 조항 테이블 JSON 무손실 직렬화");
chk(JSON.stringify(JSON.parse(JSON.stringify(H.laws))) === JSON.stringify(H.laws), "단언 7-b 법령 테이블 JSON 무손실 직렬화");
const withFn = pols.filter((p) => Object.keys(p).some((k) => typeof p[k] === "function"));
chk(withFn.length === 0, "단언 7-c 함수를 담은 조항 0건(§6-5)", withFn.map((p) => p.id));
chk(run("return typeof _PG_RULES;") === "undefined" && run("return typeof RULES;") === "undefined",
  "단언 7-d 판정 분기 표가 전역에 없다 — 화면 · 러너 · 에이전트가 플로어를 우회할 수 없다",
  { _PG_RULES: run("return typeof _PG_RULES;"), RULES: run("return typeof RULES;") });
chk(Object.keys(H).filter((k) => /^r_/.test(k)).length === 0, "단언 7-e 개발 훅이 분기를 노출하지 않는다(§6-5)");

/* ════════ 단언 8 — 해당성 · 고아 · 임계 리터럴 ════════ */
const o8 = [];
for (const p of pols) {
  if (!p.appliesTo || !p.appliesTo.length) o8.push(p.id + " 유형 해당성 없음");
  for (const k of p.appliesTo) if (KINDS.indexOf(k) < 0) o8.push(p.id + " 유형 축 밖 " + k);
  if (!H.laws[p.lawRef] && !H.lawSets[p.lawRef]) o8.push(p.id + " 조항 고아(lawRef " + p.lawRef + ")");
  if (H.laws[p.lawRef] && H.laws[p.lawRef].cite) o8.push(p.id + " 판정 근거로 쓸 수 없는 등재를 lawRef 로 쓴다");
  if (H.lawSets[p.lawRef]) {
    for (const k of p.appliesTo) if (!H.lawSets[p.lawRef][k]) o8.push(p.id + " 유형별 집합에 " + k + " 행이 없다");
    if (p.lawArticle || p.effectiveDate) o8.push(p.id + " 유형별 집합 참조인데 조항 수준 조문 · 시행일이 있다");
  } else if (H.laws[p.lawRef] && H.laws[p.lawRef].articles) {
    if (!p.lawArticle) o8.push(p.id + " 조문 하위표가 있는 법령인데 근거 조문을 특정하지 않았다");
    else if (!H.laws[p.lawRef].articles[p.lawArticle])
      o8.push(p.id + " 근거 조문 " + p.lawArticle + " 이 " + p.lawRef + " 의 조문 하위표에 없다 — 등재되지 않은 조문을 근거로 적었다");
  }
  if (!p.ruleId) o8.push(p.id + " 디스패치 키 없음");
  if (!p.remedy.length) o8.push(p.id + " 시정 과제 없음 — 무엇을 제출하면 올라가는지가 비었다");
  if (p.axis !== p.subject) o8.push(p.id + " axis 와 판정 대상 축이 어긋난다(같은 축의 두 이름이다)");
}
/* 자격 축으로 좁혀진 조항은 그 축이 명시돼 있어야 한다(§4-3-1) */
const inputs = run("return (typeof PG_INPUTS !== 'undefined') ? PG_INPUTS : [];");
for (const p of inputs) for (const i of p.inputs)
  if (i.qual && !i.naRule && i.obj === "site") o8.push(p.id + "/" + i.k + " 자격 축으로 좁혔는데 비해당 규칙이 없다");
/* 법령 고아 — 어느 조항도 가리키지 않고 참조 · 보완 · 자기 장치 등재도 아닌 항목 */
for (const id of lawIds) {
  const L = H.laws[id];
  if (L.cite || (L.relates && L.relates.length)) continue;
  if (H.selfEnforce.some((x) => x.lawRef === id)) continue;
  let used = pols.some((p) => p.lawRef === id);
  if (!used) used = pols.some((p) => H.lawSets[p.lawRef] &&
    Object.keys(H.lawSets[p.lawRef]).some((k) => H.lawSets[p.lawRef][k].laws.some((x) => x.lawId === id)));
  if (!used) o8.push("법령 고아 " + id);
}
chk(o8.length === 0, "단언 8-a 해당성 명시 · 필드 · 조항 · 법령 고아 0", o8);
chk(pols.length === inputs.length, "단언 8-b 조항 수가 입력 계약과 일치", { policies: pols.length, inputs: inputs.length });
chk(run("return pgLawRefs().filter((r) => !PG_LAWS[r] && !PG_LAW_SETS[r]).length;") === 0,
  "단언 8-c 입력 계약의 법령 키 전건 등재(조항 고아 0)", run("return pgLawRefs().filter((r) => !PG_LAWS[r] && !PG_LAW_SETS[r]);"));
/* 임계 상수가 이 파일 밖에 리터럴로 나타나면 실패(§7-6 ③) — 주석을 걷어낸 뒤 센다 */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ");
const srcFiles = [];
(function walk(d) { for (const e of fs.readdirSync(d).sort()) { const p = path.join(d, e); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(js|jsx)$/.test(e)) srcFiles.push(p); } })(path.join(ROOT, "src"));
const outside = [];
for (const k of Object.keys(H.thresh))
  for (const f of srcFiles) {
    if (/partnerPolicy\.js$/.test(f)) continue;
    if (new RegExp("\\b" + k + "\\b").test(strip(fs.readFileSync(f, "utf8")))) outside.push(k + " @ " + path.basename(f));
  }
chk(outside.length === 0, "단언 8-d 통제 임계 상수가 정책 파일 밖에 리터럴로 없다", outside);

/* ════════ 단언 9 — 골든 케이스 전건 일치 ════════ */
const goldPath = path.join(ROOT, "docs/partner_gov/pg_golden_v1.json");
let gold = null;
try { gold = JSON.parse(fs.readFileSync(goldPath, "utf8")); } catch (e) { gold = null; }
if (!gold) {
  fail.push("단언 9 골든 케이스 파일이 없다 — **미검증**이다(docs/partner_gov/pg_golden_v1.json). " +
    "추적 제외 경로이므로 다른 작업 트리에서는 저작기로 다시 만든다. 0 = 0 으로 통과시키지 않는다");
} else {
  const bad = [];
  for (const x of gold.cases) {
    const r = H.decide(x.policyId, x.rec, { kind: x.kind, stage: x.stage, asOf: x.asOf });
    const okD = r.decision === x.expect.decision && String(r.cause) === String(x.expect.cause);
    const okR = !x.ruleExpect || !r.ruleOutcome ||
      (r.ruleOutcome.decision === x.ruleExpect.decision && String(r.ruleOutcome.cause) === String(x.ruleExpect.cause));
    if (!okD || !okR) bad.push(x.id + " 기대 " + x.expect.decision + "/" + x.expect.cause +
      " → 실제 " + r.decision + "/" + r.cause);
  }
  chk(bad.length === 0, "단언 9-a 골든 케이스 전건 일치 (" + gold.cases.length + "건)", bad.slice(0, 12));
  const per = {};
  for (const x of gold.cases) per[x.policyId] = (per[x.policyId] || 0) + 1;
  const thin = pols.filter((p) => (per[p.id] || 0) < 3).map((p) => p.id);
  chk(thin.length === 0, "단언 9-b 조항마다 최소 3케이스(충족 · 위반 · 경계)", thin);
  const rd = {}; for (const x of gold.cases) rd[x.ruleExpect.decision] = (rd[x.ruleExpect.decision] || 0) + 1;
  chk((rd.PERMIT || 0) > 0 && (rd.DENY || 0) > 0 && (rd.NOT_APPLICABLE || 0) > 0 && (rd.INDETERMINATE || 0) > 0,
    "단언 9-c 네 결정값이 골든에 모두 나타난다", rd);
  /* ⚠ meta 는 **이 규약을 설명하는 문장**을 담고 있다. 전문을 스캔하면 그 설명이 위반으로 잡히고,
     그러면 다음 사람이 설명을 지워 가드를 통과시킨다. 케이스 본문만 센다(가드 ⑤와 같은 사상). */
  const goldBody = JSON.stringify(gold.cases);
  chk(!/legalName|vendorName/.test(goldBody) && !/"PT\d{4}"/.test(goldBody) && !/PT-GOLD-9{4}"?\s*\]\s*,\s*"snapshotAt/.test("x"),
    "단언 9-d 골든 케이스 본문에 상호 · 실 식별자 0건(합성 식별자만)",
    (goldBody.match(/"PT\d{4}"|legalName|vendorName/g) || []).slice(0, 5));
  chk(gold.cases.every((x) => /^PT-GOLD-\d{4}$/.test(x.rec.partnerId)),
    "단언 9-e 모든 골든 레코드의 식별자가 합성 형식이다",
    gold.cases.filter((x) => !/^PT-GOLD-\d{4}$/.test(x.rec.partnerId)).map((x) => x.id));
}

/* ════════ 단언 10 — 산출 경로 규약 (커밋이 반출이다) ════════ */
const snap = {
  meta: {
    name: "pg_policy_snapshot", runAt: new Date().toISOString().slice(0, 10),
    policyVer: H.ver, policyHash: H.hash, asOf: H.asOf,
    note: "해시 · 건수 · 분포만 담는다. 전건 판정 결과 · partnerId · 표시명 0건 — 이 경로는 커밋되고 배포에 노출된다(§14-1-1).",
  },
  counts: {
    laws: lawIds.length, articles: lawIds.reduce((a, id) => a + (H.laws[id].articles ? Object.keys(H.laws[id].articles).length : 0), 0),
    lawSets: Object.keys(H.lawSets).length, policies: pols.length,
    peps: H.peps.length, selfEnforce: H.selfEnforce.length, golden: gold ? gold.cases.length : 0,
  },
  verifiedByArticle: (() => {
    const m = {};
    for (const id of lawIds) { const L = H.laws[id]; if (!L.articles) continue; for (const a of Object.keys(L.articles)) m[L.articles[a].verified] = (m[L.articles[a].verified] || 0) + 1; }
    return m;
  })(),
  verifiedByLaw: (() => { const m = {}; for (const id of lawIds) { const v = H.lawVerifiedMin(id); m[v] = (m[v] || 0) + 1; } return m; })(),
  basisMix: (() => { const m = {}; for (const id of lawIds) m[H.laws[id].basis] = (m[H.laws[id].basis] || 0) + 1; return m; })(),
  groupMix: (() => { const m = {}; for (const p of pols) m[p.group] = (m[p.group] || 0) + 1; return m; })(),
  decisionMix: (() => { const m = {}; for (const x of matrix) m[x.r.decision] = (m[x.r.decision] || 0) + 1; return m; })(),
  causeMix: (() => { const m = {}; for (const x of matrix) m[String(x.r.cause)] = (m[String(x.r.cause)] || 0) + 1; return m; })(),
  enforceEffective: (() => {
    const m = {};
    for (const p of pols) for (const pep of H.peps) m[pep + ":" + H.enforceLevel(p.id, pep, {}).level] = (m[pep + ":" + H.enforceLevel(p.id, pep, {}).level] || 0) + 1;
    return m;
  })(),
  enforceDeclared: (() => { const m = {}; for (const p of pols) for (const pep of Object.keys(H.enforce[p.id])) m[pep + ":" + H.enforce[p.id][pep]] = (m[pep + ":" + H.enforce[p.id][pep]] || 0) + 1; return m; })(),
  denyBaseline: denyBase,
  /* 게이트 수치(§13-5) — 「확인하지 못한 조항 수」만 보고하지 않는다. 사유별로 적는다 */
  unverifiedByReason: (() => {
    const m = { "1차 출처 유료": [], "접근 차단 · 본문 미입수": [], "제도 자체 불명확 · 사양 미공개": [], "당사 산출물 미비": [] };
    for (const id of lawIds) {
      const L = H.laws[id];
      if (H.lawVerifiedMin(id) === "원문확인") continue;
      const bucket = L.basis === "내부규약" ? "당사 산출물 미비"
        : L.basis === "조회사양" ? "제도 자체 불명확 · 사양 미공개"
        : (L.basis === "표준" && /유료|미입수/.test(String(L.note))) ? "1차 출처 유료"
        : "접근 차단 · 본문 미입수";
      m[bucket].push(id);
    }
    return { "1차 출처 유료": m["1차 출처 유료"].length, "접근 차단 · 본문 미입수": m["접근 차단 · 본문 미입수"].length,
      "제도 자체 불명확 · 사양 미공개": m["제도 자체 불명확 · 사양 미공개"].length, "당사 산출물 미비": m["당사 산출물 미비"].length };
  })(),
  workTable: { "개인정보 보호법 제26조": H.lawVerified("pipa", "제26조"), "전자상거래법 제20조": H.lawVerified("ecomm", "제20조"),
    "전자상거래법 제20조의2": H.lawVerified("ecomm", "제20조의2"), "전자상거래법 제17조": H.lawVerified("ecomm", "제17조"),
    "의료법 제27조": H.lawVerified("medAct", "제27조"), "의료법 제57조": H.lawVerified("medAct", "제57조"),
    "노인장기요양보험법 제35조": H.lawVerified("ltcAct", "제35조"), "인공지능기본법 제31조": H.lawVerified("aiFrame", "제31조") },
  assertions: { total: 0, passed: 0 },
};
/* meta 를 뺀 **본문만** 센다 — meta.note 가 「partnerId 0건」이라고 적고 있어서 전문 스캔은
   자기 설명을 위반으로 잡는다. 설명을 지워 통과시키게 만드는 가드는 가드가 아니다. */
const snapBody = JSON.stringify((() => { const x = Object.assign({}, snap); delete x.meta; return x; })());
chk(!/partnerId|PT-GOLD|PT-CHK|legalName|vendorName/.test(snapBody), "단언 10-a 스냅샷 본문에 식별자 0건",
  (snapBody.match(/partnerId|PT-GOLD|PT-CHK|legalName|vendorName/g) || []).slice(0, 5));
chk(!/"decision"|"reasons"|"inputRefs"/.test(snapBody), "단언 10-b 스냅샷에 전건 판정 결과 0건",
  (snapBody.match(/"decision"|"reasons"|"inputRefs"/g) || []).slice(0, 5));
chk(!fs.existsSync(path.join(ROOT, "fixtures/pg_golden_v1.json")), "단언 10-c 골든 케이스가 배포 노출 경로에 없다");
chk(fs.existsSync(path.join(ROOT, "docs/partner_gov")), "단언 10-d 전건 결과 · 골든은 추적 제외 경로에 둔다");

/* ════════ 단언 11 — 법령명 × 조문 중복 등재 ════════ */
const seen11 = {}, dup11 = [];
for (const id of lawIds) {
  const L = H.laws[id];
  for (const a of (L.articles ? Object.keys(L.articles) : ["(조문없음)"])) {
    const k = L.name + "|" + a;
    if (seen11[k]) dup11.push(k + " : " + seen11[k] + " ↔ " + id);
    seen11[k] = id;
  }
  const same = lawIds.filter((x) => H.laws[x].name === L.name);
  if (same.length > 1) dup11.push("같은 법령명이 두 lawId 에 — " + L.name + " : " + same.join(" "));
}
chk(dup11.length === 0, "단언 11-a PG_LAWS 안에서 법령명 × 조문 중복 0", dup11);
const kb = run("return (typeof KB_LEGAL !== 'undefined') ? KB_LEGAL : null;");
chk(Array.isArray(kb) && JSON.stringify(kb) === JSON.stringify(H.kbLegal()),
  "단언 11-b KB_LEGAL 이 정책 레지스트리의 뷰다 — 중복 등재가 구조적으로 불가능하다", Array.isArray(kb) ? kb.length : kb);
const kbSrc = strip(fs.readFileSync(path.join(ROOT, "src/data/kbDomainData.js"), "utf8"));
chk(!/law:\s*"/.test(kbSrc), "단언 11-c kbDomainData 가 법령 행을 직접 들고 있지 않다",
  (kbSrc.match(/law:\s*"[^"]*"/g) || []).slice(0, 5));
chk((kb || []).filter((r) => r.article !== "조문 미확인" && !/^제/.test(String(r.article))).length === 0,
  "단언 11-d KB 라운지 조문 열이 확인 등급 게이트를 지난다",
  (kb || []).map((r) => r.id + ":" + r.article));
chk(lawIds.filter((id) => /하도급/.test(H.laws[id].name)).length === 0,
  "단언 11-e 하도급 관련 법령이 유형별 법령에 없다(무재고 · 중개 모델 · §7-7)");

/* ════════ 단언 12 — 수범자가 우리인 조문 ════════ */
const selfGov = run("return (typeof PG_SELF_GOV !== 'undefined') ? PG_SELF_GOV : [];");
const bad12 = [];
for (const id of lawIds) {
  if (!H.laws[id].appliesToSelf) continue;
  const byG = selfGov.some((g) => g.lawRef === id && g.self);
  const byPol = pols.some((p) => p.subject === "당사" && (p.lawRef === id ||
    (H.lawSets[p.lawRef] && Object.keys(H.lawSets[p.lawRef]).some((k) => H.lawSets[p.lawRef][k].laws.some((x) => x.lawId === id)))));
  const byEnf = H.selfEnforce.some((x) => x.lawRef === id);
  if (!byG && !byPol && !byEnf) bad12.push(id);
}
chk(bad12.length === 0, "단언 12-a appliesToSelf 인 법령에 대응하는 자기 항목이 있다", bad12);
chk(lawIds.filter((id) => H.laws[id].appliesToSelf).length >= 5,
  "단언 12-b 우리 자신이 수범자인 조문이 실제로 등재돼 있다(검사가 공집합에서 통과하지 않는다)",
  lawIds.filter((id) => H.laws[id].appliesToSelf).length);
const govAxis = lawIds.filter((id) => H.laws[id].govAxis === "집행설계");
chk(govAxis.length >= 4, "단언 12-c 집행 설계 자체를 규율하는 법령 축이 세워져 있다(§7-7 ④)", govAxis);
chk(H.selfEnforce.every((x) => H.laws[x.lawRef] && x.cap && x.where && x.why),
  "단언 12-d 자기 장치 등재가 법령 · 상한 · 자리 · 사유를 모두 갖는다");

/* ════════ 조항 지점과 반출 지점을 가른다 ════════
   ★ 승격 플로어(계약 조항 근거 · 근거 법령 확인 등급 · 집행 유예 · 제재 비례성)는 **조항 지점에만**
     적용된다. 플로어의 목적은 「확인하지 못한 법으로 **남의** 거래를 끊지 않는다」이고, 반출 지점이
     막는 것은 **우리가 밖으로 내보내는 문서**다 — 플로어를 적용하면 보호 장치가 보호 대상을 막는다.
     그래서 반출 지점의 선언 수준 원천은 조항별 집행 수준표가 아니라 **반출 규약 배포 테이블**이고,
     아래 전수 루프는 조항 지점 3곳만 돈다. 반출 지점은 **이름 있는 전용 단언**(바로 아래)이 지킨다.
   ⚠ 종전에는 조항별 표의 `pep.export` 칸이 비어 있어 이 루프들이 pep.export 를 **항상 advisory 로**
     보고 공짜로 통과했다. 그래서 「반출이 hard 다」를 지키는 단언이 **이름으로 존재하지 않았고**
     실제 hard 는 집행 파일의 두 번째 테이블만 들고 있었다(0 = 0 으로 통과의 또 한 형태). */
const POLICY_PEPS = H.peps.filter((p) => p !== "pep.export");
chk(POLICY_PEPS.length === H.peps.length - 1 && H.peps.indexOf("pep.export") >= 0,
  "지점 분류 — 조항 지점 " + POLICY_PEPS.length + "곳과 반출 지점 1곳으로 갈린다(분모)", { policy: POLICY_PEPS, all: H.peps });

/* ── 반출 지점 전용 단언 — 「선언 수준이 hard 다」를 **이름으로** 지킨다 ──
   간접으로만 잡히는 값은 되돌릴 때 이름이 아니라 증상으로 보고된다. */
{
  const q = H.enforceLevel("PG-EXPORT", "pep.export", {});
  chk(q.declared === "hard", "반출 지점 ⓐ 반출 규약의 **선언 수준이 hard** 다(배포 테이블)", q);
  chk(q.level === "hard", "반출 지점 ⓑ 실효 수준도 hard — 승격 플로어가 이 지점에 적용되지 않는다", q);
  chk(q.cap === "hard", "반출 지점 ⓒ 지점 상한이 hard 다(면제 불가 차단이 가능한 유일한 지점)", q);
  chk(!!q.rule, "반출 지점 ⓓ 수준의 원천 테이블 이름을 반환값이 말한다 — 두 번째 원천을 찾아 헤매지 않게", q.rule);
  /* 조항 하나로 물어도 같은 답이어야 「수준을 묻는 함수가 하나」다 */
  const viaPolicy = H.enforceLevel("L-01", "pep.export", { kind: "PT-COM", cause: "rule_violation", stage: "거래중" });
  chk(viaPolicy.level === "hard" && viaPolicy.declared === "hard",
    "반출 지점 ⓔ **조항으로 물어도 같은 답**이다 — 「이 지점의 집행 수준」을 묻는 함수가 하나다(§15-8)", viaPolicy);
}

/* ════════ 단언 13 — 비례성 ════════ */
const bad13 = [];
for (const p of pols) for (const k of p.appliesTo) {
  const cite = H.lawCite(p.lawRef, p.lawArticle, k);
  if (!cite.sanction || cite.sanction.kind !== "과태료") continue;
  for (const pep of POLICY_PEPS) if (H.enforceLevel(p.id, pep, { kind: k }).level === "hard") bad13.push(p.id + "/" + pep + "/" + k);
}
chk(bad13.length === 0, "단언 13-a 제재가 과태료인 조항의 집행 수준이 hard 가 아니다(조항 지점)", bad13);
const graceCap = [];
for (const p of pols) for (const k of p.appliesTo) {
  const cite = H.lawCite(p.lawRef, p.lawArticle, k);
  if (!cite.enforcementGrace) continue;
  for (const pep of POLICY_PEPS) if (H.enforceLevel(p.id, pep, { kind: k }).level !== "advisory") graceCap.push(p.id + "/" + pep);
}
chk(graceCap.length === 0, "단언 13-b 소관 부처 집행 유예 조항의 집행 수준 상한이 advisory(조항 지점)", graceCap);

/* ════════ 단언 15 — L-09 동결 (Q11 형 확정) ════════ */
const l9 = H.enforce["L-09"] || {};
chk(Object.keys(l9).every((pep) => l9[pep] === "advisory"), "단언 15-a 선언 테이블에서 L-09 전 지점이 advisory", l9);
/* ⚠ 조항 지점 3곳이다. 반출 지점은 조항 축이 아니라 **우리 산출물**을 막는 자리이고 수준의 원천이
   반출 규약 배포 테이블이므로, 「L-09 가 advisory 다」의 사정권이 아니다 — L-09 가 잠금이어도
   우리 보고서를 고지 없이 내보내는 것은 여전히 막혀야 한다. */
chk(POLICY_PEPS.every((pep) => H.enforceLevel("L-09", pep, {}).level === "advisory"),
  "단언 15-b 실효 집행 수준도 L-09 **조항 지점** 전건 advisory", POLICY_PEPS.map((p) => p + "=" + H.enforceLevel("L-09", p, {}).level));
chk(H.policy("L-09").locked === true, "단언 15-c L-09 가 잠금 조항이다");
chk(H.exemptAdd({ policyId: "L-09", partnerId: "PT-CHK-1", reason: "r", approver: "a", expireAt: "2099-01-01" }).ok === false,
  "단언 15-d 잠금 조항은 면제를 등록할 수 없다");
chk(H.enforceSet("L-09", "pep.settle", "soft", "chk").ok === false, "단언 15-e L-09 승격이 코드에서 거부된다");

/* ════════ 단언 11·12 선행(§7-7 1) — 승격 플로어가 실제로 상한을 내리는가 ════════
   ⚠ 되돌려 보기 실증에서 발견한 구멍을 메운 자리다(2026-10-25). 계약 조항 근거 플로어를 떼냈을 때
     **어느 단언도 실패하지 않았다** — 다른 플로어가 이미 대부분을 advisory 로 눌러 두고 있었고,
     차단 건수 검사는 「원인 × 단계」 효과 때문에 여전히 0을 돌려줬다. 그래서 수준 자체를 직접 센다. */
const noBasis = [];
for (const p of pols) {
  if (p.contractBasis) continue;
  for (const pep of POLICY_PEPS) {
    const lv = H.enforceLevel(p.id, pep, {});
    if (lv.level !== "advisory") noBasis.push(p.id + "/" + pep + "=" + lv.level);
  }
}
chk(noBasis.length === 0, "§7-7 1 계약 조항 근거가 비면 실효 집행 수준이 advisory — 승격 불가(조항 지점)", noBasis);
const unvHigh = [];
for (const p of pols) for (const k of p.appliesTo) {
  const cite = H.lawCite(p.lawRef, p.lawArticle, k);
  if (!cite.empty && RANK[cite.verified] >= RANK["원문확인"]) continue;
  for (const pep of POLICY_PEPS) {
    const lv = H.enforceLevel(p.id, pep, { kind: k });
    if (lv.level !== "advisory") unvHigh.push(p.id + "/" + pep + "/" + k + "=" + lv.level);
  }
}
chk(unvHigh.length === 0,
  "§7-7 1(v2.1) 집행 근거 법령이 원문확인이 아니면 승격 불가 — 확인하지 못한 법 아래에서 거래를 끊지 않는다", unvHigh);
chk(pols.filter((p) => !p.contractBasis).length === pols.length,
  "현 상태 계약 조항 근거가 전건 비어 있다(법무 과제) — 그래서 실효 수준이 전건 advisory 다",
  pols.filter((p) => p.contractBasis).map((p) => p.id));

/* ════════ 보강 — ratchet · 면제 만료 · 결정론 · 반환 계약 ════════ */
chk(H.enforceSet("L-04", "pep.register", "advisory", "chk").ok === false, "ratchet 하향 거부(배포 테이블 값으로 폴백)");
chk(H.enforceSet("L-04", "pep.register", "hard", "chk").ok === false, "계약 조항 근거 없는 승격 거부(§7-7 1)");
chk(H.enforceSet("L-04", "pep.settle", "soft", "chk").ok === false, "정산 지점 승격 거부(advisory 상한 코드 고정)");
chk(H.exemptAdd({ policyId: "L-04", partnerId: "PT-CHK-1", reason: "r", approver: "a" }).ok === false, "만료일 없는 면제는 등록 거부");
const exAdd = H.exemptAdd({ policyId: "L-04", partnerId: "PT-CHK-9", reason: "소명 접수", approver: "L1", expireAt: "2026-12-31" });
chk(exAdd.ok === true && !!H.exemptFor("L-04", "PT-CHK-9", "2026-12-01"), "만료일 있는 면제는 등록되고 기간 내에 유효하다");
chk(H.exemptFor("L-04", "PT-CHK-9", "2027-01-01") === null, "만료 경과 시 자동으로 차단 복귀");
const d1 = JSON.stringify(H.decideAll(EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }));
const d2 = JSON.stringify(H.decideAll(EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }));
chk(d1 === d2, "결정론 — 같은 입력 2회 호출이 완전히 같다");
/* ════════ 단언 14 — 결측을 판정값으로 쓰지 않는다 (2026-10-26 적대적 심사 반영) ════════
   왜 신설인가: `self.shop.brokerNoticeText` 의 **결측**으로 불허(DENY / rule_violation)가 나왔고,
   같은 조항의 **바로 다음 줄**은 같은 성질의 결측을 보류(INDETERMINATE / input_missing)로 돌렸다 —
   한 줄 차이로 결측이 불허와 보류로 갈렸다. 그 결과가 협력업체 레코드 전건에 복제돼 실명 법인의
   행 준수율 0.0% 가 전적으로 당사 조항 하나에서 나왔고, 같은 지면의 집행 효과 선언표는 그 경우를
   「증거 미제출 — 시정 과제이지 거래 중단 사유가 아니다」라고 적고 있었다(§10-4 규약 ② 위반).
   ★ 실측 입력으로 선언된 조항은 **예외 목록에 이름으로 등재**한다 — 측정값 0 은 결측이 아니다.
     지금은 예외가 0건이다(L-10 이 측정 입력으로 교체됐고, 측정값은 값이 있으므로 미제출이 아니다). */
{
  const MEASURED_EXEMPT = [];   /* 실측 입력으로 선언돼 「전건 미제출」 판정에서 제외되는 조항 — 이름으로만 */
  /* 분모는 **불허가 실제로 나는 행렬**이어야 한다 — EMPTY 레코드 행렬은 전건 보류라 0 = 0 으로 통과한다 */
  const badMatrix = [];
  for (const kind of KINDS) for (const p of pols)
    badMatrix.push({ kind, id: p.id, r: H.decide(p.id, badRec(kind), { kind, stage: "거래중", asOf: ASOF }) });
  const matrix2 = matrix.concat(badMatrix);
  const denyAllAbsent = matrix2.filter((x) => {
    const refs = x.r.inputRefs || [];
    if (!refs.length || x.r.decision !== "DENY") return false;
    if (MEASURED_EXEMPT.indexOf(x.id) >= 0) return false;
    return refs.every((i) => i.grade === "ABSENT");
  });
  const denyAny = matrix2.filter((x) => x.r.decision === "DENY");
  chk(denyAny.length > 0,
    "단언 14-a 불허가 실제로 발생한다(분모 " + denyAny.length + "칸 — 0 = 0 으로 통과하지 않는다)", denyAny.length);
  chk(denyAllAbsent.length === 0,
    "단언 14-b **입력이 전건 미제출인 판정의 결정값이 불허인 건수 0** — 결측은 판정값이 아니다(실측 입력으로 선언된 조항은 예외 목록에 이름으로 등재한다. 현 예외 " +
    MEASURED_EXEMPT.length + "건)", denyAllAbsent.map((x) => x.kind + "/" + x.id + ":" + (x.r.reasons || [])[0]));
  snap.missingAsVerdict = { denyCells: denyAny.length, denyAllAbsent: denyAllAbsent.length, exempt: MEASURED_EXEMPT };
}

/* ════════ 단언 16 — 미도래 개정 · 미도래 법령 시행일이 지면에 나타난다 (2026-10-26) ════════
   왜 신설인가: 레지스트리에 **원문확인 등급의 미도래 개정 1건**이 들어 있는데 `pgLawRender()` 반환이
   그 칸을 탈락시켜 지면 어디에도 나오지 않았고(전 경로가 그 함수를 지난다), 그 결과 보고서는
   「시행 예정 조항 없음」이라고 **단정**했다. 그리고 항목 시행일이 기준일보다 뒤인 법령 1건이
   「예정」 표기 없이 시행 중인 법령과 **똑같은 모양으로** 시행일표에 실렸다. 시행일표의 존재 목적이
   그것인데 그 자리에서 깨졌다. 프롬프트 절대 조건(「시행 전은 「예정」」)과도 어긋난다. */
{
  const laws = H.laws;
  const pend = Object.keys(laws).filter((id) => laws[id].pendingAmend);
  const fut = Object.keys(laws).filter((id) => laws[id].effectiveDate && laws[id].effectiveDate > H.asOf);
  chk(pend.length > 0,
    "단언 16-a 미도래 개정이 레지스트리에 실재한다(분모 " + pend.length + "건 — 0 = 0 으로 통과하지 않는다)", pend);
  const dropped = pend.filter((id) => {
    const r = H.lawRender(id, null);
    return !r || !r.pendingAmend;
  });
  chk(dropped.length === 0,
    "단언 16-b 미도래 개정이 **렌더 게이트 반환에 표시 전용 칸으로 통과**한다 — 탈락 0건(이 함수를 지나지 않는 지면은 없다)", dropped);
  const pendInJudgement = pend.filter((id) => {
    const eff = H.lawEffective ? H.lawEffective(id, null) : null;
    return eff === laws[id].pendingAmend.effectiveDate;
  });
  chk(pendInJudgement.length === 0,
    "단언 16-c 미도래 개정의 시행일이 **판정에 쓰이지 않는다** — 어느 조항에도 그 날짜가 부여되지 않았다(추정 시행일 입력 금지)", pendInJudgement);
  chk(fut.length > 0,
    "단언 16-d 항목 시행일이 기준일보다 뒤인 법령이 실재한다(분모 " + fut.length + "건) — 「예정」 표기 검사의 분모다", fut);
  snap.pendingAmend = { laws: pend, futureLaws: fut, asOf: H.asOf };
}

const polSrc = strip(fs.readFileSync(path.join(ROOT, "src/data/partnerPolicy.js"), "utf8"));
chk(!/Math\.random/.test(polSrc), "결정론 — Math.random 0건(주석 제거 후)");
chk(!/new Date|Date\.now/.test(polSrc), "결정론 — 벽시계 0건(주석 제거 후 · 기준일은 호출자가 넘긴다)");
chk(!/localStorage/.test(polSrc), "§7-6 ① 정책 파일이 localStorage 를 읽지 않는다 — 저장값 주입이 임계를 바꿀 수 없다");
chk(!/sort\(\s*\(\)\s*=>/.test(polSrc), "cohort-determinism — 셔플 정렬 0건");
const sample = H.decide("L-04", EMPTY("PT-COM"), { kind: "PT-COM", stage: "신규등록신청", asOf: ASOF });
for (const f of ["decision", "cause", "reasons", "inputRefs", "ruleRef", "evidence", "enforce", "remedy", "whatIf"])
  chk(sample[f] !== undefined, "§11-1 반환 계약 필드 " + f);
chk(!/legalName|vendorName/.test(JSON.stringify(matrix)), "Q4 확정 — 판정기 반환값에 상호 필드 0건");
/* ★ 레인 1 의 「쓴 것 / 안 쓴 것」을 **전 조항 × 전 유형 행렬**에서 센다(2026-10-26 교체).
   종전 단언은 표본 한 칸(L-04)에서 `used === false` 가 하나라도 있는지만 봤다. 그래서
   **거꾸로 거짓인 쪽**(판정을 만든 필드가 「안 쓰임」으로 표시되는 사고)을 전혀 보지 못했다 —
   실측: `cause === "input_missing"` 칸 276/276 전건이 「쓴 것 0」이었고, 레인 1 은 결정적 입력에
   「이 판정에 쓰이지 않은 입력입니다」를 붙이면서 레인 3 은 같은 필드를 사유로 적었다.
   그래서 양쪽을 함께 센다: ⓐ안 쓴 것이 있는 칸의 분모가 0이 아니다(숨기지 않는다는 목적)
   ⓑ**결측으로 판정이 선 칸에서 쓴 것이 0인 칸이 0건이다**(판정을 만든 필드는 쓴 입력이다). */
{
  const laneAll = matrix.filter((x) => (x.r.inputRefs || []).length > 0);
  const laneUnused = laneAll.filter((x) => x.r.inputRefs.some((i) => i.used === false));
  const missCells = matrix.filter((x) => x.r.cause === "input_missing" && (x.r.inputRefs || []).length > 0);
  const missNoUsed = missCells.filter((x) => !x.r.inputRefs.some((i) => i.used === true));
  chk(laneUnused.length > 0,
    "단언 1-f ⓐ §11-2 레인 1 — 쓰이지 않은 필드도 존재를 보여준다(분모 " + laneAll.length + "칸 중 " + laneUnused.length + "칸)", laneUnused.length);
  chk(missNoUsed.length === 0,
    "단언 1-f ⓑ 결측으로 판정이 선 칸(" + missCells.length + "칸)에서 **판정을 만든 필드가 쓴 입력으로 표시된다** — 거꾸로 거짓 0건",
    missNoUsed.slice(0, 5).map((x) => x.kind + "/" + x.id));
  snap.laneUsed = { refCells: laneAll.length, withUnused: laneUnused.length, missCells: missCells.length, missNoUsed: missNoUsed.length };
}
chk(sample.inputRefs.every((i) => i.grade && i.use), "§11-2 레인 1 — 모든 입력에 출처 등급과 용도가 붙는다");
chk(!!sample.whatIf && sample.whatIf.decision !== undefined, "§11-2 레인 5 — whatIf 는 같은 판정기 재호출 산출이다");
/* 단계 양방향 — 같은 조항 · 같은 결측으로 단계만 바꾼다(§7-3-1 ①) */
const stg = {};
for (const s of ["신규등록신청", "거래중", "갱신"]) {
  const r = H.decide("L-04", EMPTY("PT-COM"), { kind: "PT-COM", stage: s, asOf: ASOF });
  stg[s] = { cause: r.cause, level: r.enforce.level, block: r.enforce.block, remedy: r.remedy.length };
}
chk(stg["거래중"].block === false && stg["거래중"].remedy > 0,
  "§7-3-1 ① 거래중 단계의 증거 미제출은 차단이 아니라 시정 과제다", stg["거래중"]);
chk(stg["신규등록신청"].cause === "input_missing", "§7-3-1 ① 신규등록신청 단계도 같은 원인으로 판정된다", stg["신규등록신청"]);
/* §7-3-1 ③ 현 시연 모집단 기대 차단 건수 — 전면 차단 사고인지 설계 의도인지 구분한다 */
let blocked = 0;
for (const x of matrix) if (x.r.enforce && x.r.enforce.block) blocked++;
chk(blocked === 0, "§7-3-1 ③ 현 상태 차단 건수 0 — 계약 조항 근거가 비어 있어 전건 advisory 다(설계 의도)", blocked);
/* §5-5 결론 산출 — 총점 금지 */
const tr = H.trust(H.decideAll(EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }));
chk(tr.score === null && /결론 보류/.test(tr.conclusion), "§5-5 총점 금지 — 보류가 있으면 결론을 내지 않는다", tr);

/* ════════ §5-5 결론 분기 — **양방향**. 빈 레코드로는 앞쪽 보류 분기만 타서 분모가 없다 ════════
   ★ 왜 이 단언이 필요한가: 「존재하되 미기능」 판별이 **사유 문장 정규식**이던 동안, 같은
     `{decision:"DENY", cause:"rule_violation"}` 에 사유 한 낱말만 다듬으면 결론이 「결론 보류」에서
     「결함 있음」으로 **조용히 뒤집혔다**(실측). 그 분기를 한 번도 실행하지 않는 러너는 그것을
     보지 못한다 — 빈 레코드에서는 T군 전건이 보류라 pending 분기에서 끝난다.
   ★ 그래서 ①미기능 DENY 를 심으면 보류 ②평범한 DENY 를 심으면 결함 있음 ③사유 문장만 바꿔도
     결론이 **불변**임을 함께 단언한다. ③이 「문장을 파싱하지 않는다」의 실제 검사다. */
{
  const TRUST_FUNC = "기능", TRUST_EXIST = "존재";
  const dualT = H.policies.filter((p) => p.group === "T" && p.dual).map((p) => p.id);
  chk(dualT.length > 0, "§5-5 양방향 — 존재 · 기능 2판정 조항이 실재한다(분모)", dualT);
  const mk = (axis, txt) => [{ id: dualT[0], r: { decision: "DENY", cause: "rule_violation", reasons: [txt], axis: axis } }];
  const a1 = H.trust(mk(TRUST_FUNC, "점검 기록이 주기를 벗어났다 — 존재하되 기능하지 않는다"));
  const a2 = H.trust(mk(TRUST_FUNC, "문안이 달라도 축은 같다"));
  const b1 = H.trust(mk(TRUST_EXIST, "정책이 존재하지 않는다"));
  chk(/결론 보류/.test(a1.conclusion), "§5-5 양방향 ⓐ 미기능 축의 불허를 심으면 결론이 **보류**로 간다", a1);
  chk(a1.conclusion === a2.conclusion && a1.why === a2.why,
    "§5-5 양방향 ⓑ **사유 문장을 바꿔도 결론이 불변**이다 — 집계가 문장을 파싱하지 않는다(§11-1)", { a1, a2 });
  chk(/결함 있음/.test(b1.conclusion), "§5-5 양방향 ⓒ 존재 축의 불허는 **결함 있음**이다(보류와 구별된다)", b1);
  /* 실판정 경로에서도 축이 실리는지 — 주입 객체가 아니라 판정기가 만든 반환값으로 */
  const stale = { partnerId: "PT-AX", kind: "PT-COM", self: {}, products: [], licenses: [], evidence: [],
    submit: { access_policy: true, access_review_at: "2020-01-01", training_plan: true, training_done_at: "2020-01-01",
      notice_channel: true, notice_recent_at: "2020-01-01", risk_list: true, risk_updated_at: "2020-01-01",
      ethics_doc: true, ethics_activity_at: "2020-01-01" } };
  const axRows = H.decideAll(stale, { kind: "PT-COM", stage: "거래중", asOf: ASOF })
    .filter((x) => dualT.indexOf(x.id) >= 0 && x.r.axis === TRUST_FUNC);
  chk(axRows.length > 0, "§5-5 양방향 ⓓ 판정기가 **구조 필드로** 축을 돌려준다(주입 객체가 아니라 실판정 경로)", axRows.length);
}

/* ════════ 입력 증거 등급 — 값이 있고 쓰인 입력은 「미제출」이 아니다 ════════
   ★ 종전 구현은 `miss(raw) ? "ABSENT" : i.grade` 한 줄이었고 선언 등급이 제출 축 전건 ABSENT 라
     **값이 제출되고 판정에 쓰인 뒤에도** 「미제출」이 나왔다 — 한 객체 안에서 「값 있음 · 판정에
     썼음 · 수집 시각 있음」과 「미제출」이 동시에 참이라고 말한다. 추적 레인 1 은 그 반환값을
     렌더만 하므로 화면이 쓰인 값에 「미제출」 배지를 붙인다(§10-4 규약 2 · §15-6 과 어긋난다). */
{
  const filled = { partnerId: "PT-GR", kind: "PT-COM", self: {}, products: [], licenses: [], evidence: [],
    submit: { biz_status: "계속사업자", biz_cert_at: "2026-01-01" } };
  const r = H.decide("L-01", filled, { kind: "PT-COM", stage: "거래중", asOf: ASOF });
  const valued = (r.inputRefs || []).filter((x) => x.value !== null);
  chk(valued.length > 0, "입력 등급 ⓐ 값이 실린 입력이 실재한다(분모 — 0 = 0 으로 통과하지 않는다)", valued.length);
  chk(valued.every((x) => x.grade !== "ABSENT"),
    "입력 등급 ⓑ 값이 있는 입력의 **실측 등급이 「미제출」이 아니다**", valued.map((x) => x.field + ":" + x.grade));
  chk(valued.every((x) => x.declaredGrade !== undefined),
    "입력 등급 ⓒ 선언 등급을 별 칸으로 보존한다(현 데이터 regime 의 등급을 잃지 않는다)", valued[0]);
  const absent = (r.inputRefs || []).filter((x) => x.value === null);
  chk(absent.every((x) => x.grade === "ABSENT" && x.asOf === null),
    "입력 등급 ⓓ 값이 없는 입력은 「미제출」이고 수집 시각이 비어 있다", absent.map((x) => x.field + ":" + x.grade));
  /* whatIf 경로는 같은 함수를 **값을 채운 레코드로** 재호출한다 — 그 경로에서도 등급이 맞아야 한다 */
  const wi = H.decide("L-01", EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF });
  chk(!!wi.whatIf, "입력 등급 ⓔ whatIf 재호출 경로가 실재한다", !!wi.whatIf);
}

/* ════════ 면제 지문이 정책 해시에 든다 — 면제는 결정을 바꾼다 ════════
   ★ 저장값 면제 1건이 `enforce.exemption` 을 null 에서 값으로 돌리고 soft 수준에서 차단을 뒤집는데,
     해시가 안 움직이면 §6-6 의 「재현 증명은 해시 일치로 성립한다」가 성립하지 않는다. */
{
  const h0 = H.hashOf();
  const fp0 = H.exemptFingerprint();
  const r = H.exemptAdd({ policyId: "L-04", partnerId: "PT-HASH", reason: "시험", approver: "EMP0001", expireAt: "2027-01-01" }, []);
  chk(r.ok === true, "면제 해시 ⓐ 유효한 면제가 등록된다(분모)", r);
  const h1 = H.hashOf();
  chk(h0 !== h1, "면제 해시 ⓑ 면제가 추가되면 **정책 해시가 움직인다** — 결정을 바꾸는 축은 재현 지문에 든다", { h0, h1 });
  chk(H.exemptFingerprint().length === fp0.length + 1,
    "면제 해시 ⓒ 지문은 정렬된 키 목록이다(사유 · 승인자 문장을 넣지 않는다)", H.exemptFingerprint());
  const again = H.hashOf();
  chk(again === h1, "면제 해시 ⓓ 같은 면제 집합이면 같은 해시다(결정론)", { h1, again });
}

snap.assertions = { total: ok.length + fail.length, passed: ok.length };
snap.stageEffect = stg;
snap.blockedNow = blocked;
snap.exemptFingerprint = H.exemptFingerprint().length;
fs.writeFileSync(path.join(ROOT, "scripts/pg_policy_snapshot.json"), JSON.stringify(snap, null, 1), "utf8");

function report() {
  const ms = Date.now() - t0;
  console.log("\n══ 협력업체 통제 — 정책 레지스트리 · 판정기 가드 ══");
  console.log("통과 " + ok.length + " · 실패 " + fail.length + " · " + (ms / 1000).toFixed(2) + "초");
  if (fail.length) { console.log("\n[FAIL]"); for (const f of fail) console.log("  ✗ " + f); }
  else for (const o of ok) console.log("  ✓ " + o);
}
report();
if (gold) {
  console.log("\n법령 " + lawIds.length + "항목 · 조문 " + snap.counts.articles + "건 · 조항 " + pols.length +
    " · 골든 " + gold.cases.length + "건 · 해시 " + H.hash);
  console.log("조문 확인 등급: " + JSON.stringify(snap.verifiedByArticle));
  console.log("미확인 사유별: " + JSON.stringify(snap.unverifiedByReason));
}
process.exit(fail.length ? 1 : 0);
