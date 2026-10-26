/* ══════════ 협력업체 통제 — 집행 · 제출 필드 사전 가드 (P4 · 지시서 §13-6 · §14-1) ══════════
   왜 있는가: 판정은 P3 가 지켰다. 이 러너가 지키는 것은 **그 판정이 실제로 무엇인가를 막는지**,
   그리고 **막았다는 사실이 기록되는지**다. 특히 지키는 것 넷 —
     ① 집행 지점 없이 조항만 늘어나지 않는다(네 지점이 한 함수를 지난다).
     ② 기록되지 않는 차단은 차단이 아니다 — 단언 10은 **양성 테스트**다. 0 = 0으로 통과하지 않는다.
     ③ 감시받는 쪽이 문지기 기준을 조정하지 못한다 — 저장값 주입이 임계도 수준도 내리지 못한다.
     ④ 실명 표기에서 고지 없는 반출은 **면제 불가**로 막힌다.

   단언 (지시서 §13-6 검증표)
     1   제출 필드 사전 밖 필드 0 · 금지 성질 값 유입 0
     2   법령 미확인 정책만으로는 어떤 집행 지점도 차단하지 않는다
     3   원문확인 조항의 입력 결측은 신규등록신청에서만 차단 — **양방향**(거래중에서는 시정 과제가 생긴다)
     4   각 집행 지점에서 불허가 실제로 막는지 · 지점 상한이 실제로 상한인지
     4-b 현 시연 모집단의 지점별 차단 건수가 기대값과 일치 — 어긋나면 **전면 차단 사고**로 간주한다
     5   만료일 없는 면제는 등록 거부 · 만료 경과 후 자동 차단 복귀
     6   저장값에 통제 임계를 주입해도 판정 임계 불변
     7   저장값이 배포 테이블보다 낮은 수준을 지정하면 **배포 테이블 값으로 폴백**
     8   통제 임계 상수가 정책 파일 밖에 리터럴로 없음 — **소유자는 run_pg_policy 단언 8-d**(결과를 읽는다)
     9   확인 등급 하향 시 집행 수준이 자동으로 경고 · 기록으로 격하
     10  차단 N건을 심고 로그에서 정확히 N건 — **양성** + payload 4키 접힘 + **전용 키**에 저장
     11  계약 조항 근거 없는 정책은 승격 불가
     12  집행 근거 법령이 원문확인이 아니면 계약 조항 근거가 있어도 승격 불가
     13  집행 유예가 있는 조항은 상한이 경고 · 기록이고 추적 지면이 그 사실을 렌더한다
     14  차단 이벤트 등재가 회원 퍼널 집계를 오염시키지 않는다 — 단계 합계 불변
     15  유인 · 알선 조항의 모든 집행 지점이 경고 · 기록 — **동결 검사의 소유자는 fin_site_check**(결과를 읽는다)
     16  표시명 모드 스위치 실효성 — **양방향**. 기준은 소스 문자열이 아니라 **산출물**이다
     17  두 값이 다른 동안 「같은 장부」라고 주장하는 문안 0건 — **소유자는 run_wording_guard**(결과를 읽는다)
     22  AI 거버넌스 축(P6) — 점검 7축 · 확인 등급 · 표준 번호 게이트 **양방향** · 단일 항목 규약 ·
         자기 거버넌스 9항목 전건 실측 · 새 에이전트 0 · 에이전트 출력 숫자의 판정 집계 교차 대조 ·
         사람 승인 게이트(양성 · 음성) · 결정 로그 행위자 구분 · 회원 경로 차단 · 결정론.
         **고지 애블레이션의 소유자는 run_wording_guard 검사 ⑯**이고 여기서는 자리 분모만 센다
     23  반출 플러밍(P7) — 보호 예외 · **클립보드 재작성(전체 선택 · 부분 선택 둘 다)** · 인쇄 HTML의
         고지 · 워터마크 스탬프 · 반출 1건에 열람 기록 1행(표 · 문서 **각각** 양성) · 고지 애블레이션
         양경로 hard 차단 · 복사 차단 전제 양방향 · 지면이 렌더 중 반출을 부르지 않음 ·
         **커밋 산출물 전문에 상호 · 식별자 · 판정 셀 0건**(커밋이 반출이다 — §14-1-1).
         ★ 기준은 렌더가 아니라 **산출물**이다. 문안 등재 · 단일 원천 · 정적 애블레이션은
           run_wording_guard 검사 ⑰가 소유한다(두 검사의 대상이 다르다)
   + 음성 테스트(일부러 깨서 차단을 확인) — 「통과했다」가 「검증됐다」가 아니다.

   ⚠ 검사 소유자를 늘리지 않는다. 단언 8 · 15 · 17 은 이미 다른 러너가 소유하므로 **그 결과를 읽고**
     소유자의 검사가 사라졌는지만 함께 본다. 중복 배치하면 한쪽만 고쳐지는 순간 금지가
     **검출되지 않는 금지**로 남는다(지시서가 wording_guard 중복을 삭제한 것과 같은 이유).

   실행: node scripts/run_pg_scan.mjs      (브라우저 불필요 — vm 직접 적재)
   게이트: scripts/githooks/pre-commit 의 협력업체 통제 블록
   산출: scripts/pg_scan_report.json — 단언 통과 수 · 차단 건수 분포 + 표시명 모드. **식별자 0건**
         (이 경로는 커밋되고 라이브 도메인에서 정적 제공된다 — 커밋이 반출이다). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const t0 = Date.now();
const ok = [], fail = [];
const chk = (cond, label, got) => { (cond ? ok : fail).push(label + (cond ? "" : "  ← 실제: " + JSON.stringify(got))); };
const ASOF = "2026-10-25";
const PEPS = ["pep.register", "pep.settle", "pep.expose", "pep.export"];
/* 조항 지점과 반출 지점을 가른다 — 승격 플로어(계약 조항 근거 · 근거 법령 확인 등급 · 집행 유예 ·
   제재 비례성)는 **조항 지점에만** 적용된다. 플로어의 목적은 「확인하지 못한 법으로 **남의** 거래를
   끊지 않는다」이고, 반출 지점이 막는 것은 **우리가 밖으로 내보내는 문서**다 — 플로어를 적용하면
   보호 장치가 보호 대상을 막는다. 반출 지점은 전용 단언(단언 18)이 이름으로 지킨다.
   ⚠ 종전에는 조항별 표의 pep.export 칸이 비어 있어 이 루프들이 pep.export 를 **항상 advisory 로**
     보고 공짜로 통과했다 — 「반출이 hard 다」를 지키는 단언이 이름으로 없었다. */
const POLICY_PEPS = PEPS.filter((p) => p !== "pep.export");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ");

/* ── 번들 적재 — 선택한 파일에 치환을 걸어 **두 번째 세계**를 만든다(모드 양방향 단언) ── */
const manifest = fs.readFileSync(path.join(ROOT, "src/_manifest.txt"), "utf8").split(/\r?\n/).filter(Boolean);
function load(patches) {
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
  const bad = [];
  for (const f of ["src/data/dummy_data.js", "src/data/section_data.js", "src/data/demo_members.js"])
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c, { filename: f }); } catch (e) { bad.push(f); }
  let n = 0;
  for (const f of manifest) {
    if (!/\.js$/.test(f)) continue;
    let src = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const p of (patches || [])) if (p.file === f) {
      if (src.indexOf(p.from) < 0) bad.push("치환 대상 없음 " + f + " :: " + p.from);
      src = src.split(p.from).join(p.to);
    }
    try { vm.runInContext(src, c, { filename: f }); n++; } catch (e) { bad.push(f + " :: " + String(e.message).split("\n")[0]); }
  }
  return { ctx: c, loaded: n, bad: bad, run: (code) => vm.runInContext("(() => {" + code + "})()", c, { filename: "pgscan" }) };
}

const W = load([]);
chk(W.bad.length === 0, "번들 적재 — 실패 0", W.bad);
chk(W.loaded > 100, "데이터 모듈 적재", W.loaded);
let H = null, E = null, R = null;
try { H = W.run("return __hifinPG();"); } catch (e) { fail.push("__hifinPG 훅이 없다 :: " + e.message); }
try { E = W.run("return __hifinPGEnforce();"); } catch (e) { fail.push("__hifinPGEnforce 훅이 없다 :: " + e.message); }
try { R = W.run("return __hifinPGReport();"); } catch (e) { fail.push("__hifinPGReport 훅이 없다 :: " + e.message); }
if (!H || !E || !R) { report(); process.exit(1); }

const pols = H.policies;
const RANK = { advisory: 1, soft: 2, hard: 3 };
const snap = {
  meta: {
    name: "pg_scan_report", runAt: ASOF, enforceVer: E.ver, policyVer: H.ver, policyHash: H.hash, asOf: H.asOf,
    note: "단언 통과 수 · 차단 건수 분포 · 표시명 모드만 담는다. partnerId · 표시명 · 개별 판정 셀 0건 — 이 경로는 커밋되고 배포에 노출된다(§14-1-1).",
  },
  nameMode: W.run("return PG_NAME_MODE;"),
  counts: Object.assign({}, E.counts, { storeKeys: Object.keys(E.keys).length, auditActions: E.auditActions.length, policies: pols.length }),
};

/* 빈 레코드와 「전부 어긋난」 레코드 — 후자가 없으면 「막는다」를 양성으로 확인할 수 없다 */
const EMPTY = (kind) => ({ partnerId: "PT-CHK-0001", kind: kind, submit: {}, self: {}, products: [], licenses: [], evidence: [] });
const DPA6 = { dpa_no_other_use: true, dpa_safeguards: true, dpa_purpose_scope: true, dpa_subcontract_limit: true, dpa_access_control: true, dpa_supervision: true };
/* 필수 기재 한 항목만 결측 → 불허(규칙 위반). 근거 조문이 원문확인이라 하드 플로어에 걸리지 않는다 */
const DENYREC = (kind) => ({ partnerId: "PT-CHK-BAD", kind: kind, submit: Object.assign({}, DPA6), self: {}, products: [], licenses: [], evidence: [] });

/* ════════ 단언 1 — 제출 필드 사전 ════════ */
const fa = E.fieldAudit();
chk(fa.length === 0, "단언 1-a 사전 ↔ 조항 입력 계약 일치(사전 밖 필드 · 필드 고아 · 조항 고아 0)", fa);
chk(E.counts.fields === R.counts.submitKeys,
  "단언 1-b 사전 필드 수가 조항이 선언한 제출 키 수와 같다", { fields: E.counts.fields, submitKeys: R.counts.submitKeys });
const cleanScan = E.fieldScan({ biz_status: "계속사업자", dpa_liability: true, ad_review_no: "RV-0001" });
chk(cleanScan.length === 0, "단언 1-c 정상 제출 레코드는 위반 0", cleanScan);
const dirty = E.fieldScan({ not_in_dict: 1, emg_owner: "010-1234-5678", label_doc: "담당 a@b.com", biz_cert_at: "주민등록번호 880101-1234567", model_card: "원가율 32%" });
chk(dirty.length >= 5, "단언 1-d 사전 밖 필드와 금지 성질 값(개인식별자 · 연락처 · 전자우편 · 원가 구성)이 전건 잡힌다", dirty.length);
chk(E.refuse.length === 4 && E.refuse.every((r) => r.taken === false && r.why),
  "단언 1-e 「받지 않는 것」 4항목이 **받지 않는다는 선언과 사유**를 갖는다", E.refuse.map((r) => r.id));
chk(E.reviewBodies.length === 3 && E.reviewBodies.every((b) => b.lookup === false),
  "단언 1-f 자율심의기구 발급물 3종이 등재되고 **제3자 조회 창구가 없다**고 적혀 있다", E.reviewBodies.map((b) => b.id));
const extSrc = W.run("return HIFIN_EXTERNAL_SOURCES.map((s) => s.key);");
chk(E.reviewBodies.every((b) => extSrc.indexOf(b.id) < 0),
  "단언 1-g 자율심의 발급물을 외부 공적 소스로 등재하지 않았다 — 조회 창구가 없는 것을 등재하면 카탈로그가 거짓말한다", extSrc);

/* ════════ 단언 2 — 법령 미확인 정책만으로는 차단하지 않는다 ════════ */
const unv = [];
for (const p of pols) {
  for (const k of p.appliesTo) {
    const cite = H.lawCite(p.lawRef, p.lawArticle, k);
    if (!cite.empty && cite.verified === "원문확인") continue;
    for (const pep of PEPS.slice(0, 3)) {
      const d = E.pepDecide(p.id, DENYREC(k), { kind: k, stage: "신규등록신청", asOf: ASOF }, pep);
      if (d.block) unv.push(p.id + "/" + pep + "/" + k);
    }
  }
}
chk(unv.length === 0, "단언 2 근거 법령이 원문확인이 아닌 조항은 어떤 집행 지점에서도 차단하지 않는다", unv);
chk(unv.length === 0 && pols.some((p) => p.appliesTo.some((k) => { const ci = H.lawCite(p.lawRef, p.lawArticle, k); return ci.empty || ci.verified !== "원문확인"; })),
  "단언 2-b 미확인 조항이 실제로 존재한다(검사가 공집합에서 통과하지 않는다)");

/* ════════ 계약 조항 근거 주입 — 승격 플로어를 하나만 열어 「막는다」를 양성으로 본다 ════════
   현 상태는 계약 조항 근거가 전건 비어 있어 실효 수준이 전건 경고 · 기록이다(그것이 설계 의도다).
   그래서 근거를 **한 조항에만** 주입해 ①신규등록신청은 막히고 ②거래중은 막히지 않는 것을 본다.
   주입하지 않으면 단언 3 · 4 가 「양쪽 다 막히지 않는다」로 **공허하게** 통과한다. */
function withBasis(id, fn) {
  W.run("const p = pgPolicy('" + id + "'); p.contractBasis = '계약 제12조(통제 이행과 자료 제출)'; return 1;");
  let r;
  try { r = fn(); } finally { W.run("const p = pgPolicy('" + id + "'); p.contractBasis = null; return 1;"); }
  return r;
}
const BASIS_ID = "L-04";   /* 근거 조문이 원문확인이고 제재 축이 hard 를 막지 않는 조항 */
chk(H.lawCite(pgPolicyOf(BASIS_ID).lawRef, pgPolicyOf(BASIS_ID).lawArticle, "PT-COM").verified === "원문확인",
  "주입 대상 조항의 근거 조문이 원문확인이다(아니면 단언 3 · 4 가 공허해진다)");
function pgPolicyOf(id) { for (const p of pols) if (p.id === id) return p; return null; }

/* ════════ 단언 3 — 단계 양방향 ════════ */
const stageTwo = withBasis(BASIS_ID, () => {
  const o = {};
  for (const s of ["신규등록신청", "거래중", "갱신"]) {
    const d = E.pepDecide(BASIS_ID, EMPTY("PT-COM"), { kind: "PT-COM", stage: s, asOf: ASOF }, "pep.register");
    o[s] = { cause: d.cause, level: d.level, block: d.block, remedy: d.remedy, render: d.render };
  }
  return o;
});
chk(stageTwo["신규등록신청"].cause === "input_missing" && stageTwo["거래중"].cause === "input_missing",
  "단언 3-a 같은 조항 · 같은 결측으로 단계만 바꾼다(원인이 같다)", stageTwo);
chk(stageTwo["신규등록신청"].block === true, "단언 3-b 신규등록신청 단계의 증거 미제출은 차단된다", stageTwo["신규등록신청"]);
chk(stageTwo["거래중"].block === false && stageTwo["거래중"].remedy > 0,
  "단언 3-c 거래중 단계의 같은 결측은 차단이 아니라 시정 과제다 — 확인한 법 하나로 전건을 끊지 않는다", stageTwo["거래중"]);
chk(stageTwo["갱신"].block === false, "단언 3-d 갱신 단계는 차단하지 않는다(기한 도래만으로 거래가 끊기지 않는다 · 열린 항목)", stageTwo["갱신"]);

/* ════════ 단언 4 — 불허가 실제로 막는지 · 지점 상한이 실제로 상한인지 ════════ */
const denyByPep = withBasis(BASIS_ID, () => {
  const o = {};
  for (const pep of PEPS.slice(0, 3)) {
    const d = E.pepDecide(BASIS_ID, DENYREC("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }, pep);
    o[pep] = { decision: d.decision, cause: d.cause, level: d.level, cap: d.cap, block: d.block };
  }
  return o;
});
chk(denyByPep["pep.register"].decision === "DENY" && denyByPep["pep.register"].block === true,
  "단언 4-a 등록 지점에서 불허가 실제로 막는다", denyByPep["pep.register"]);
chk(denyByPep["pep.settle"].block === false && denyByPep["pep.settle"].level === "advisory",
  "단언 4-b 정산 지점은 불허여도 막지 않는다 — 경고 · 기록 상한이 코드 고정이다(거래상 지위)", denyByPep["pep.settle"]);
chk(denyByPep["pep.expose"].block === false && denyByPep["pep.expose"].level === "advisory",
  "단언 4-c 노출 지점도 같다", denyByPep["pep.expose"]);
chk(E.sites.length === 4 && E.sites.map((s) => s.pep).join(",") === PEPS.join(","),
  "단언 4-d 집행 지점 4곳이 전부 배선돼 있다(자리 · 막는 것 · 상한 · 소비자 명시)", E.sites.map((s) => s.pep));
for (const s of E.sites) chk(!!s.fn && !!s.blocks && !!s.cap && !!s.consumer, "단언 4-e 집행 지점 " + s.pep + " 의 자리 · 막는 것 · 상한 · 소비자가 비지 않았다", s);

/* ════════ 단언 4-b — 현 시연 모집단의 지점별 차단 건수 ════════ */
const vendors = W.run("const D = supplyData(); return D.vendors.map((v) => ({ id: v.id, kind: 'PT-COM' }));");
E.blockClear();
const pepBlocked = { "pep.register": 0, "pep.settle": 0, "pep.expose": 0, "pep.export": 0 };
for (const v of vendors) {
  const rec = { partnerId: v.id, kind: "PT-COM", submit: {}, self: {}, products: [], licenses: [], evidence: [] };
  const ctx = { kind: "PT-COM", stage: "거래중", asOf: ASOF };
  pepBlocked["pep.register"] += E.register(rec, ctx).blocks.length;
  pepBlocked["pep.settle"] += E.settle(rec, ctx).blocks.length;
  pepBlocked["pep.expose"] += E.expose(rec, ctx).blocks.length;
}
snap.population = vendors.length;
for (const row of R.pepExpect) {
  if (typeof row.expect !== "number") continue;
  chk(pepBlocked[row.pep] === row.expect,
    "단언 4-b " + row.pep + " 차단 건수 = 기대값 " + row.expect + " (" + row.why + ")", pepBlocked[row.pep]);
}
chk(E.blockAll().length === 0, "단언 4-b 기대값 0인 상태에서 차단 로그도 0 — 집계와 로그가 같은 사실을 말한다", E.blockAll().length);

/* ════════ 단언 5 — 면제 ════════ */
chk(E.exemptRegister({ policyId: BASIS_ID, partnerId: "PT-CHK-9", reason: "소명 접수", approver: "L1" }, "EMP0001", {}).ok === false,
  "단언 5-a 만료일 없는 면제는 등록 거부");
chk(E.exemptRegister({ policyId: "L-09", partnerId: "PT-CHK-9", reason: "x", approver: "L1", expireAt: "2026-12-31" }, "EMP0001", {}).ok === false,
  "단언 5-b 잠금 조항은 면제를 등록할 수 없다");
chk(E.exemptRegister({ policyId: BASIS_ID, partnerId: "PT-CHK-9", reason: "소명 접수", approver: "L1", expireAt: "2026-12-31" }, "EMP0001", { asOf: ASOF }).ok === true,
  "단언 5-c 만료일 있는 면제는 등록된다");
chk(E.exemptLoad({ asOf: "2026-12-01" }).loaded === 1, "단언 5-d 기간 내 면제는 적재된다", E.exemptLoad({ asOf: "2026-12-01" }));
const expLoad = E.exemptLoad({ asOf: "2027-01-01" });
chk(expLoad.loaded === 0 && expLoad.expired === 1,
  "단언 5-e 만료 경과분은 적재되지 않는다 — **자동 차단 복귀**가 그 실체다", expLoad);
/* 면제가 있으면 차단이 면제로 바뀌고, 그 사실이 결과에 남는다(부인방지) */
const exBlock = withBasis(BASIS_ID, () => {
  W.run("pgExemptAdd({policyId:'" + BASIS_ID + "', partnerId:'PT-CHK-EX', reason:'소명 접수', approver:'L1', expireAt:'2026-12-31'}, []); return 1;");
  const rec = Object.assign(EMPTY("PT-COM"), { partnerId: "PT-CHK-EX" });
  return E.pepDecide(BASIS_ID, rec, { kind: "PT-COM", stage: "신규등록신청", asOf: ASOF }, "pep.register");
});
chk(exBlock.block === false && exBlock.exempted === true && !!exBlock.exemption,
  "단언 5-f 유효한 면제는 차단을 풀지만 면제 사실이 **결과에** 남는다", exBlock);

/* ════════ 단언 5-g — 면제 통과가 **로그에** 남는다. 양성 테스트 ════════
   ★ 왜 승격했는가: 5-f 는 **반환값만** 보았고, 반환값은 호출자가 버리면 사라진다. §7-2 는 soft 를
     「막되 면제로 통과 — **그 사실이 로그로 남아 부인방지**」로 정의하고, 보고서 수치
     b7.blockedTotal 은 전용 로그에서만 읽는다. 실측으로 확인한 구멍: 면제 통과쪽은
     `{allow:true, blocks:0, exempted:1}` 인데 차단 로그 0건 · 감사 로그 0건이었고, 차단쪽만
     1건이 남았다 — 면제 통과가 로그 · 집계 · 보고서 어디에도 숫자로 없었다.
     「기록되지 않는 차단은 차단이 아니다」의 거울상이다. 그래서 **N건을 심고 로그에서 N건**을 센다. */
{
  const planted = ["PT-EXLOG-1", "PT-EXLOG-2", "PT-EXLOG-3"];
  const r = withBasis(BASIS_ID, () => {
    E.blockClear(); E.auditClear();
    for (const id of planted)
      W.run("pgExemptAdd({policyId:'" + BASIS_ID + "', partnerId:'" + id + "', reason:'소명 접수', approver:'L1', expireAt:'2026-12-31'}, []); return 1;");
    const o = { exempted: 0, blocked: 0 };
    for (const id of planted) {
      const d = E.register(Object.assign(EMPTY("PT-COM"), { partnerId: id }), { kind: "PT-COM", stage: "신규등록신청", asOf: ASOF });
      o.exempted += d.exempted.length;
    }
    /* 면제 없는 대상 1건 — 분모의 반대쪽. 차단과 면제 통과가 **로그에서 갈리는지**를 본다 */
    const dn = E.register(Object.assign(EMPTY("PT-COM"), { partnerId: "PT-EXLOG-NONE" }), { kind: "PT-COM", stage: "신규등록신청", asOf: ASOF });
    o.blocked = dn.blocks.length;
    o.stats = E.blockStats();
    o.passRows = E.exemptPassAll().length;
    o.blockRows = E.blockAll().length;
    o.ledger = E.logAll().length;
    o.passSrc = E.exemptPassAll().map((x) => (x.p || {}).src).sort();
    o.names = Array.from(new Set(E.logAll().map((x) => x.name))).sort();
    return o;
  });
  chk(r.exempted === planted.length,
    "단언 5-g ⓐ 면제 " + planted.length + "건을 심으면 결과에 " + planted.length + "건이 뜬다(분모 — 0 = 0 으로 통과하지 않는다)", r.exempted);
  chk(r.passRows === planted.length,
    "단언 5-g ⓑ **로그에서 정확히 " + planted.length + "건**이 읽힌다 — 면제 통과는 로그로 증명된다(부인방지)", r.passRows);
  chk(r.stats.exempted === planted.length && r.stats.blocked === r.blockRows,
    "단언 5-g ⓒ 집계가 「차단」과 「면제 통과」를 **분리**해 센다", { exempted: r.stats.exempted, blocked: r.stats.blocked });
  chk(r.stats.total === r.blockRows,
    "단언 5-g ⓓ 보고서가 읽는 차단 건수 합은 **차단만**이다 — 면제 통과만큼 부풀지 않는다", { total: r.stats.total, blockRows: r.blockRows });
  chk(r.ledger === r.passRows + r.blockRows && r.names.join(",") === "pg_blocked,pg_exempted",
    "단언 5-g ⓔ 한 전용 장부에 두 이름이 살고 읽는 쪽이 **이름으로** 가른다", { ledger: r.ledger, names: r.names });
  chk(r.blocked > 0, "단언 5-g ⓕ 면제 없는 같은 조항 · 같은 결측은 여전히 **막힌다**(면제가 전부를 풀지 않는다)", r.blocked);
  chk(!r.passSrc.some((x) => /[가-힣]/.test(String(x))),
    "단언 5-g ⓖ 면제 통과 로그의 대상 표기도 **코드 표기**다 — 로그는 모드와 무관하다(§4-6-1 ⓔ)", r.passSrc);
  chk(W.run("return !!(HI_EVENT_DEFS && HI_EVENT_DEFS['pg_exempted'] && HI_EVENT_DEFS['pg_exempted'].stage === null);"),
    "단언 5-g ⓗ 면제 통과 이벤트가 **등재**돼 있고 회원 퍼널 단계 축 밖이다(미등재 이름은 기록 거부된다)");
}

/* ════════ 단언 5-h — 저장값 면제 적재가 **드리프트 신호**를 낸다 ════════
   저장값 면제 1건이 `enforce.exemption` 을 null 에서 값으로 돌리고 soft 수준에서 차단을 뒤집는데,
   종전에는 정책 해시도 drift 도 움직이지 않았다(실측: 전후 동일 · drift 필드 자체가 없었다).
   집행 수준 축은 ratchet + 배포 테이블 폴백 + 해시 드리프트로 세 겹인데 면제 축만 신호가 0이면
   §7-6 의 「감시받는 쪽이 문지기 기준을 조정하는 구조를 막는다」가 한 축에만 걸려 있는 것이다. */
{
  const r = W.run(`
    pgAuditClear();
    localStorage.setItem('hifin_pg_exempt', JSON.stringify([{ policyId: '${BASIS_ID}', partnerId: 'PT-DRIFT-1',
      reason: '소명 접수', approver: 'EMP0001', approvedAt: '2026-10-01', expireAt: '2027-01-01' }]));
    const before = pgPolicyHash();
    const ld = pgExemptLoad({ asOf: '${ASOF}' });
    const au = pgAuditAll();
    return { ld: ld, before: before, after: pgPolicyHash(),
      shape: Object.keys(ld).sort().join(','),
      audit: au.length, via: au.length ? au[0].via : null, action: au.length ? au[0].action : null };`);
  chk(r.ld.loaded === 1, "단언 5-h ⓐ 저장값 면제가 적재된다(분모)", r.ld);
  chk(r.ld.drift === true && r.before !== r.after,
    "단언 5-h ⓑ 적재가 결정을 바꾸면 **정책 해시가 움직이고 drift 가 참**이다 — 재현 증명이 해시 일치로 성립한다(§6-6)", { before: r.before, after: r.after, drift: r.ld.drift });
  chk(r.shape === "drift,expired,hashAfter,hashBefore,loaded,rejected",
    "단언 5-h ⓒ 집행 수준 로더와 **같은 모양**으로 돌려준다(두 축의 신호가 같은 형태다)", r.shape);
  chk(r.audit === 1 && r.action === "면제 등록" && r.via === "저장값 적재",
    "단언 5-h ⓓ 적재 건이 감사 추적에 남고 「저장값에서 온 면제」와 「승인 절차를 지난 면제」가 **경로 축으로** 갈린다", { audit: r.audit, via: r.via });
}

/* ════════ 단언 6 — 저장값 주입이 판정 임계를 바꾸지 못한다 ════════ */
const before6 = JSON.stringify(E.pepDecide(BASIS_ID, { partnerId: "PT-CHK-6", kind: "PT-COM", submit: Object.assign({}, DPA6), self: {}, products: [], licenses: [], evidence: [] }, { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register"));
W.run("localStorage.setItem('hifin_ops_config', JSON.stringify({ dpaRequiredItems: 1, licenseWarnDays: 999, pgDefenseDays: 30 })); return 1;");
const after6 = JSON.stringify(E.pepDecide(BASIS_ID, { partnerId: "PT-CHK-6", kind: "PT-COM", submit: Object.assign({}, DPA6), self: {}, products: [], licenses: [], evidence: [] }, { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register"));
chk(before6 === after6, "단언 6-a 저장값에 통제 임계를 주입해도 판정이 바뀌지 않는다");
chk(W.run("return typeof opsGet('dpaRequiredItems');") === "undefined",
  "단언 6-b 통제 임계는 조정 가능 설정의 키가 아니다 — 조회 자체가 성립하지 않는다");
chk(W.run("return opsGet('pgDefenseDays');") === 30 && W.run("return typeof opsGet('pgSlaWarnPct');") === "number",
  "단언 6-c 조정 가능한 것(소명 기한 · 보고서 기간 · 경고 임계) 3항목만 저장값을 따른다");
chk(!/localStorage/.test(strip(fs.readFileSync(path.join(ROOT, "src/data/partnerPolicy.js"), "utf8"))),
  "단언 6-d 정책 파일이 저장값을 읽지 않는다(주석 제거 후)");
W.run("localStorage.removeItem('hifin_ops_config'); return 1;");

/* ════════ 단언 7 — ratchet 로더 ════════ */
chk(JSON.stringify(E.enforceLoad("chk")) === JSON.stringify(E.enforceLoad("chk")), "단언 7-a 저장값이 없으면 적재가 멱등이다");
W.run("localStorage.setItem('hifin_pg_enforce', JSON.stringify({ '" + BASIS_ID + "': { 'pep.register': 'advisory' } })); return 1;");
const low = E.enforceLoad("chk");
chk(low.applied.length === 0 && low.fallback.length === 1 && /배포 테이블 soft/.test(low.fallback[0]),
  "단언 7-b 저장값이 배포 테이블보다 낮으면 **배포 테이블 값으로 폴백**한다(하향 거부)", low);
chk(W.run("return PG_ENFORCE['" + BASIS_ID + "']['pep.register'];") === "soft",
  "단언 7-c 폴백 후 배포 테이블이 실제로 바뀌지 않았다");
chk(low.drift === false, "단언 7-d 폴백은 정책 테이블 해시를 바꾸지 않는다 — 재현 증명이 깨지지 않는다", low);
W.run("localStorage.setItem('hifin_pg_enforce', JSON.stringify({ '" + BASIS_ID + "': { 'pep.register': 'hard' }, 'L-09': { 'pep.settle': 'hard' } })); return 1;");
const high = E.enforceLoad("chk");
chk(high.applied.length === 0 && high.refused.length === 2,
  "단언 7-e 저장값이 더 높아도 플로어가 막는다 — 저장값은 승격의 **근거가 되지 못한다**", high);
chk(high.refused.some((x) => /L-09/.test(x)), "단언 7-f 잠금 조항은 저장값으로도 올라가지 않는다", high.refused);
/* 반출 규약은 저장값으로 내려가지 않는다 — 수준이 상수이고 적재기가 조항만 본다.
   이 자리를 묻지 않으면 「반출 고지는 hard」가 저장값 한 줄로 꺼질 수 있는지 아무도 모른다. */
W.run("localStorage.setItem('hifin_pg_enforce', JSON.stringify({ 'PG-EXPORT': { 'pep.export': 'advisory' } })); return 1;");
const expLoad2 = E.enforceLoad("chk");
const expLv = E.export((function () { const b = E.exportBuild(rows0(), meta0(), "tsv"); b.head[3] = ""; return b; })(), { level: "L1", kind: "tsv" });
chk(expLv.level === "hard" && expLv.allow === false,
  "단언 7-g 저장값으로 반출 규약을 내릴 수 없다 — 수준이 상수이고 적재기는 조항만 본다", { load: expLoad2, level: expLv.level });
W.run("localStorage.removeItem('hifin_pg_enforce'); return 1;");
E.blockClear();
function rows0() { return [E.exportRow(EMPTY("PT-COM"), { policyId: BASIS_ID, decision: "DENY", cause: "rule_violation", level: "advisory", stage: "거래중" })]; }
function meta0() { return { at: ASOF, level: "L1", scope: "전수", policyVer: H.ver, tableHash: H.hash }; }

/* ════════ 단언 8 — 임계 리터럴(소유자의 결과를 읽는다) ════════ */
const polSnapPath = path.join(ROOT, "scripts/pg_policy_snapshot.json");
let polSnap = null;
try { polSnap = JSON.parse(fs.readFileSync(polSnapPath, "utf8")); } catch (e) { polSnap = null; }
const polRunner = fs.readFileSync(path.join(ROOT, "scripts/run_pg_policy.mjs"), "utf8");
chk(/통제 임계 상수가 정책 파일 밖에 리터럴로 없다/.test(polRunner),
  "단언 8-a 임계 리터럴 검사의 **소유자가 run_pg_policy 에 살아 있다**(중복 배치하지 않는다)");
chk(!!polSnap && polSnap.assertions && polSnap.assertions.total === polSnap.assertions.passed,
  "단언 8-b 소유 러너의 결과를 읽는다 — 정책 가드 단언 전건 통과", polSnap && polSnap.assertions);
/* 새 파일이 임계 상수를 데려오지 않았는지는 소유 러너가 src 전수를 보므로 추가로 세지 않는다.
   여기서는 **그 러너가 새 파일을 실제로 보는지**(src 전수 주사)만 확인한다. */
chk(/srcFiles/.test(polRunner) && /path\.join\(ROOT, "src"\)/.test(polRunner),
  "단언 8-c 소유 러너가 src 전수를 주사한다 — 새로 더한 파일도 그 주사에 포함된다");

/* ════════ 단언 9 — 확인 등급 하향 시 자동 격하 ════════ */
const deg = withBasis(BASIS_ID, () => {
  const up = E.pepDecide(BASIS_ID, DENYREC("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register");
  W.run("PG_LAWS.pipa.articles['제26조'].verified = '부분확인'; return 1;");
  const down = E.pepDecide(BASIS_ID, DENYREC("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register");
  W.run("PG_LAWS.pipa.articles['제26조'].verified = '원문확인'; return 1;");
  const back = E.pepDecide(BASIS_ID, DENYREC("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register");
  return { up: up, down: down, back: back };
});
chk(deg.up.level !== "advisory" && deg.down.level === "advisory",
  "단언 9-a 확인 등급이 원문확인에서 내려가면 집행 수준이 자동으로 경고 · 기록으로 격하된다", { up: deg.up.level, down: deg.down.level });
chk(deg.down.block === false && deg.down.decision === "INDETERMINATE" && deg.down.cause === "law_unverified",
  "단언 9-b 격하된 조항은 차단하지 않고 결정도 보류로 돌아간다", { d: deg.down.decision, c: deg.down.cause });
chk(deg.back.level === deg.up.level, "단언 9-c 복원 후 수준이 되돌아온다(검사가 상태를 더럽히지 않는다)", { back: deg.back.level });

/* ════════ 단언 10 — 차단 N건 심고 N건(양성) + payload 접힘 + 전용 키 ════════ */
E.blockClear();
W.run("localStorage.setItem('hifin_events', '[]'); return 1;");
const PLANT = 7;
const rows10 = [E.exportRow(EMPTY("PT-COM"), { policyId: BASIS_ID, decision: "DENY", cause: "rule_violation", level: "advisory", stage: "거래중" })];
const meta10 = { at: ASOF, level: "L1", scope: "전수", policyVer: H.ver, tableHash: H.hash };
for (let i = 0; i < PLANT; i++) {
  const b = E.exportBuild(rows10, meta10, "tsv");
  b.head[3] = "";                                   /* 고지 문구만 떼낸다 — 애블레이션 */
  const g = E.export(b, { level: "L1", kind: "tsv", partner: EMPTY("PT-COM") });
  if (g.allow) fail.push("단언 10 심은 차단이 통과했다(" + i + ")");
}
const blocks10 = E.blockAll();
chk(blocks10.length === PLANT, "단언 10-a 차단 " + PLANT + "건을 심고 전용 로그에서 정확히 " + PLANT + "건이 읽힌다(양성 테스트 — 0 = 0으로 통과하지 않는다)", blocks10.length);
chk(blocks10.every((e) => e.name === "pg_blocked" && e.p && Object.keys(e.p).sort().join(",") === "grade,key,kind,src"),
  "단언 10-b payload 가 허용 4키(key · kind · grade · src)로 접혀 들어간다 — 화이트리스트를 늘리지 않았다", blocks10[0] && blocks10[0].p);
chk(blocks10.every((e) => !/reason|why/.test(Object.keys(e.p).join(","))),
  "단언 10-c 사유 문장을 payload 에 싣지 않는다 — 절단으로 잘려 거짓 사유가 된다");
chk(blocks10.every((e) => e.p.src === "PT-CHK-0001"),
  "단언 10-d 로그의 주체는 **항상 코드 표기**다(모드와 무관 — 커밋이 반출이다)", blocks10[0] && blocks10[0].p.src);
chk(W.run("return (JSON.parse(localStorage.getItem('hifin_pg_block') || '[]')).length;") === PLANT,
  "단언 10-e 전용 저장 키(hifin_pg_block)에 저장된다");
chk(E.blockCap >= 2000 && W.run("return localStorage.getItem('hifin_pg_block') !== null;"),
  "단언 10-f 전용 키의 보존 한도가 공용 링버퍼(500)보다 크다 — 회원 퍼널이 차단 기록을 밀어내지 않는다", E.blockCap);
const st10 = E.blockStats();
chk(st10.total === PLANT && st10.byPep["pep.export"] === PLANT,
  "단언 10-g 집계가 로그와 같은 사실을 말한다", st10);
/* ⚠ blocks10[0] 을 무조건 꺼내면 안 된다 — 로그가 비는 상황이 **실제로 있다**.
   집행 수준을 내리면(pep.export: hard → advisory) 반출이 막히지 않아 차단 로그가 0건이 되고,
   그때 이 줄이 TypeError 로 죽는다. 러너가 죽으면 커밋은 막히지만(exit != 0) 운영자는
   「단언 10-a 가 0건이다」라는 이름 대신 스택 트레이스를 받는다 — 가드의 값은 막는 것만이
   아니라 **무엇이 깨졌는지 이름으로 말하는 것**이다. 이웃 단언 10-b · 10-d 가 이미 같은
   방어를 하고 있으므로 형태를 맞춘다(실측: 애블레이션 ⓑ에서 이 줄이 크래시를 냈다). */
chk(!!blocks10[0] && blocks10[0].at === ASOF && blocks10[0].seq === 1 && !/Date/.test(strip(fs.readFileSync(path.join(ROOT, "src/data/partnerEnforce.js"), "utf8"))),
  "단언 10-h 로그의 시각축이 벽시계가 아니라 기준일 + 순번이다 — 같은 입력이 같은 로그를 만든다", blocks10[0] || null);

/* ════════ 단언 14 — 퍼널 집계 오염 0 ════════ */
const ev = W.run("return hiEventStats();");
chk(ev.stage["1"] === 0 && ev.stage["2"] === 0 && ev.stage["3"] === 0,
  "단언 14-a 차단 " + PLANT + "건이 쌓여도 회원 퍼널 단계 합계가 불변이다", ev.stage);
chk(Object.keys(ev.stage).sort().join(",") === "1,2,3",
  "단언 14-b 단계 집계에 축 밖 칸이 생기지 않는다(stage == null 을 뺀다)", Object.keys(ev.stage));
chk(ev.by.pg_blocked === PLANT,
  "단언 14-c 이벤트 이름이 등재돼 있어 공용 버스가 기록을 버리지 않는다(미등재면 조용히 0이 된다)", ev.by.pg_blocked);
chk(W.run("return HI_EVENT_DEFS.pg_blocked.stage === null && HI_EVENT_DEFS.pg_blocked.axis === 'control';"),
  "단언 14-d 등재가 단계 축 **밖** 분류다");

/* ════════ 단언 11 · 12 — 승격 플로어 ════════ */
const noBasis = [];
for (const p of pols) {
  if (p.contractBasis) continue;
  for (const pep of POLICY_PEPS) if (E.pepDecide(p.id, DENYREC("PT-COM"), { kind: "PT-COM", stage: "신규등록신청", asOf: ASOF }, pep).level !== "advisory")
    noBasis.push(p.id + "/" + pep);
}
chk(noBasis.length === 0, "단언 11 계약 조항 근거 없는 정책은 어떤 **조항 지점**에서도 승격되지 않는다", noBasis);
/* 12 — 근거는 채우고 법령 확인 등급만 내린다. 둘을 함께 내리면 어느 쪽이 막았는지 알 수 없다 */
const unvPromote = withBasis(BASIS_ID, () => {
  W.run("PG_LAWS.pipa.articles['제26조'].verified = '미확인'; return 1;");
  const r = W.run("return pgEnforceLevel('" + BASIS_ID + "', 'pep.register', { kind: 'PT-COM' });");
  const setr = W.run("return pgEnforceSet('" + BASIS_ID + "', 'pep.register', 'hard', 'chk');");
  W.run("PG_LAWS.pipa.articles['제26조'].verified = '원문확인'; return 1;");
  return { level: r, set: setr };
});
chk(unvPromote.level.level === "advisory" && unvPromote.set.ok === false,
  "단언 12 집행 근거 법령이 원문확인이 아니면 계약 조항 근거가 있어도 승격 불가 — 확인하지 못한 법 아래에서 남의 거래를 끊지 않는다", unvPromote);
chk(unvPromote.level.floors.some((f) => /확인 등급/.test(f)),
  "단언 12-b 무엇이 수준을 내렸는지를 **이름으로** 돌려준다(화면이 사유를 쓰지 않는다)", unvPromote.level.floors);

/* ════════ 단언 13 — 집행 유예 ════════ */
const graceIds = pols.filter((p) => p.appliesTo.some((k) => !!H.lawCite(p.lawRef, p.lawArticle, k).enforcementGrace)).map((p) => p.id);
chk(graceIds.length > 0, "단언 13-a 집행 유예가 붙은 조항이 실재한다(검사가 공집합에서 통과하지 않는다)", graceIds);
const graceBad = [];
for (const id of graceIds) {
  const r = withBasis(id, () => {
    const o = {};
    for (const pep of POLICY_PEPS) o[pep] = W.run("return pgEnforceLevel('" + id + "', '" + pep + "', { kind: 'PT-SVC' });");
    return o;
  });
  for (const pep of POLICY_PEPS) if (r[pep].level !== "advisory") graceBad.push(id + "/" + pep + "=" + r[pep].level);
}
chk(graceBad.length === 0, "단언 13-b 집행 유예 조항은 상한이 경고 · 기록이다(비례성 — 과태료 수준의 의무로 거래를 끊지 않는다)", graceBad);
const lane4 = R.lanes.filter((l) => l.n === 4)[0];
chk(!!lane4 && /집행 유예/.test(lane4.shows + " " + lane4.rule),
  "단언 13-c 추적 지면 4레인이 「법정 의무이나 소관 부처 집행 유예 중」을 렌더할 자리를 갖는다", lane4);
const graceRow = R.stageEffect.filter((e) => e.grace)[0];
chk(!!graceRow && /집행 유예/.test(graceRow.render), "단언 13-d 집행 효과 표에 그 렌더 문구가 있다", graceRow);

/* ════════ 단언 15 — 유인 · 알선 조항 경고 · 기록 고정 + 동결(소유자 결과를 읽는다) ════════ */
const l09 = H.enforce["L-09"] || {};
chk(Object.keys(l09).every((pep) => l09[pep] === "advisory"),
  "단언 15-a 배포 테이블의 L-09 전 지점이 advisory(soft · hard 가 하나도 없다)", l09);
const l09eff = {};
for (const pep of POLICY_PEPS) l09eff[pep] = W.run("return pgEnforceLevel('L-09', '" + pep + "', {}).level;");
chk(POLICY_PEPS.every((pep) => l09eff[pep] === "advisory"), "단언 15-b 실효 수준도 L-09 **조항 지점** 전건 advisory", l09eff);
chk(W.run("return pgEnforceSet('L-09', 'pep.settle', 'soft', 'chk').ok;") === false,
  "단언 15-c 승격 경로가 **구조적으로** 없다(잠금 + 지점 상한)");
chk(withBasis("L-09", () => W.run("return pgEnforceLevel('L-09', 'pep.register', {}).level;")) === "advisory",
  "단언 15-d 계약 조항 근거를 채워도 잠금 조항은 올라가지 않는다");
const encSrc = strip(fs.readFileSync(path.join(ROOT, "src/data/partnerEnforce.js"), "utf8"));
chk(!/escPay|escSettle|escFee|payout/.test(encSrc),
  "단언 15-e 집행 파일이 정산 산식을 읽지도 호출하지도 않는다 — 산식은 법률 검토 회신 전까지 동결이다");
const finSrc = fs.readFileSync(path.join(ROOT, "scripts/fin_site_check.mjs"), "utf8");
for (const k of ["chkOwnFee", "chkPtnFee", "careRate", "carePerCenter", "careFee", "careCostRate"])
  chk(new RegExp("\\b" + k + "\\b").test(finSrc), "단언 15-f 동결 검사의 **소유 러너**가 " + k + " 를 단언한다");
/* ★ 이 러너는 동결 키의 **이름만** 말하고 **값을 들고 있지 않다**. 값을 여기 복제하면 소유자가
   둘이 되고, 한쪽만 고쳐지는 순간 「건드리지 않는다」가 검출되지 않는 금지로 남는다. */
const selfSrc = fs.readFileSync(path.join(ROOT, "scripts/run_pg_scan.mjs"), "utf8");
chk(/정산 산식 동결/.test(finSrc) && !/(chkOwnFee|chkPtnFee|careRate|carePerCenter|careFee|careCostRate)\s*[:=]\s*[0-9]/.test(selfSrc),
  "단언 15-g 동결 **값**을 이 러너에 복제하지 않았다(이름만 말한다 — 검사 소유자 이원화 금지)");
let finOk = false, finOut = "";
try { finOut = String(execFileSync(process.execPath, [path.join(ROOT, "scripts/fin_site_check.mjs")], { cwd: ROOT, encoding: "utf8", timeout: 120000 })); finOk = /실패 0\s*$/m.test(finOut) || /실패 0/.test(finOut.split("\n").slice(-4).join("\n")); }
catch (e) { finOut = String((e && e.stdout) || e); finOk = false; }
chk(finOk, "단언 15-h 소유 러너를 실제로 돌려 결과를 읽는다 — 동결 축 전건 통과", finOut.split("\n").slice(-3).join(" | "));

/* ════════ 단언 16 — 표시명 모드 양방향 ════════
   ★ 기준은 소스 문자열이 아니라 **산출물**이다. 거래 사실 레이어의 파생 문자열에 상호가 박혀 있어
     소스 기준으로는 0건을 만들 수 없다. 그래서 반출 산출물 · 판정기 반환값 · 로그를 센다. */
const NAMES = W.run("return pgVendorNames();");
chk(NAMES.length > 100, "단언 16-0 상호 집합을 거래 사실 레이어에서 가져온다(새 리터럴을 만들지 않는다)", NAMES.length);
function modeProbe(world) {
  const Ex = world.run("return __hifinPGEnforce();");
  const vs = world.run("const D = supplyData(); return D.vendors.slice(0, 30).map((v) => ({ id: v.id, name: v.name }));");
  const out = { rendered: 0, log: 0, mapped: 0, cols: null, settleLabel: null, notice: null };
  Ex.blockClear();
  const rows = [], recs = [];
  for (const v of vs) {
    const rec = { partnerId: v.id, legalName: v.name, kind: "PT-COM", submit: {}, self: {}, products: [], licenses: [], evidence: [] };
    recs.push(rec);
    rows.push(Ex.exportRow(rec, { policyId: BASIS_ID, decision: "INDETERMINATE", cause: "input_missing", level: "advisory", stage: "거래중" }));
  }
  const tsv = Ex.exportBuild(rows, { at: ASOF, level: "L1", scope: "전수", policyVer: "x", tableHash: "y" }, "tsv");
  const doc = Ex.exportBuild(rows, { at: ASOF, level: "L1", scope: "전수", policyVer: "x", tableHash: "y" }, "doc");
  const decided = JSON.stringify(recs.map((r) => Ex.pepDecide(BASIS_ID, r, { kind: "PT-COM", stage: "거래중", asOf: ASOF }, "pep.register")));
  for (const n of NAMES) {
    if (tsv.text.indexOf(n) >= 0 || doc.text.indexOf(n) >= 0) out.rendered++;
    if (decided.indexOf(n) >= 0) out.rendered++;
  }
  /* 로그 축 — 차단을 심어 payload 를 본다 */
  const b = Ex.exportBuild(rows, { at: ASOF, level: "L1" }, "tsv"); b.head[3] = "";
  Ex.export(b, { level: "L1", kind: "tsv", partner: recs[0] });
  const logTxt = JSON.stringify(Ex.blockAll());
  for (const n of NAMES) if (logTxt.indexOf(n) >= 0) out.log++;
  /* 역추적 — 코드 표기로 내려도 식별자 → 실상호 매핑이 **여전히 조회 가능**해야 한다.
     ★ 매핑 조회는 **구현 함수 호출**이다. 종전 구현은 프로브가 방금 넣은 리터럴(`r.legalName`)을
       다시 세어서, 구현을 어떻게 바꾸든 `mapped === 30` 이 나오는 **자기충족 단언**이었다 —
       §4-6-2 가 요구한 보호(「①만 보면 legalName 을 지워 버린 구현도 통과한다」)가 없었다.
       없는 경로를 로컬 리터럴로 대신 세면 단언이 사라진 것과 같다. 그래서 L1 조회 경로
       (`pgIdentityLookup` → `pgFieldClamp(rec,"L1")`)를 **그 세계에서** 호출해 반환값을 센다.
       경로가 없으면 out.mapped 가 0이 되어 단언이 **실패한다**(단언 9 의 「골든 파일 부재 시 미검증
       으로 실패」와 같은 사상). */
  const Rp = world.run("return (typeof __hifinPGReport === 'function') ? __hifinPGReport() : null;");
  out.lookupFn = !!(Rp && typeof Rp.identityLookup === "function");
  out.clampFn = !!(Rp && typeof Rp.fieldClamp === "function");
  out.l2Leak = 0;
  if (out.lookupFn) {
    for (const r of recs) {
      const q = Rp.identityLookup(r);
      if (q && q.partnerId && q.legalName && q.level === "L1") out.mapped++;
      /* 같은 함수의 반대쪽 — L2 이하에서는 **키 자체가 없어야** 한다(치환 · 숨김이 아니라 삭제) */
      if (out.clampFn) { const c2 = Rp.fieldClamp(r, "L2"); if (c2 && ("legalName" in c2)) out.l2Leak++; }
    }
  }
  out.cols = tsv.cols.join(",");
  out.settleLabel = world.run("return PG_SETTLE_LABEL;");
  out.notice = world.run("return pgExportNoticeRequired();");
  out.mode = world.run("return PG_NAME_MODE;");
  out.nameOf = world.run("const D = supplyData(); const v = D.vendors[0]; return pgDisplayName({ partnerId: 'PT0001', legalName: v.name });");
  return out;
}
const realProbe = modeProbe(W);
const C = load([{ file: "src/data/partnerGov.js", from: 'const PG_NAME_MODE = "real";', to: 'const PG_NAME_MODE = "code";' }]);
chk(C.bad.length === 0, "단언 16 코드 표기 세계 적재 — 실패 0", C.bad);
const codeProbe = C.bad.length === 0 ? modeProbe(C) : null;
chk(realProbe.mode === "real" && realProbe.rendered > 0,
  "단언 16-a 실명 표기에서는 판정 지면 · 반출물에 상호가 **실제로** 나온다(검사가 공집합에서 통과하지 않는다)", realProbe.rendered);
chk(!!codeProbe && codeProbe.mode === "code" && codeProbe.rendered === 0,
  "단언 16-b 코드 표기로 내리면 판정 지면 · 반출 산출물(표 · 문서)에 상호 출현 0건", codeProbe && codeProbe.rendered);
chk(!!codeProbe && codeProbe.lookupFn === true && codeProbe.clampFn === true,
  "단언 16-c0 L1 조회 경로가 **구현 함수로 실재한다**(없으면 아래 매핑 단언이 로컬 리터럴을 세는 자기충족이 된다)",
  codeProbe && { lookup: codeProbe.lookupFn, clamp: codeProbe.clampFn });
chk(!!codeProbe && codeProbe.mapped === 30,
  "단언 16-c **그때도** 식별자 → 실상호 매핑이 **L1 조회 경로로** 조회 가능하다 — 이것을 함께 단언해야 실상호를 지워 버린 구현이 통과하지 않는다", codeProbe && codeProbe.mapped);
chk(!!codeProbe && codeProbe.l2Leak === 0 && !!realProbe && realProbe.l2Leak === 0,
  "단언 16-c2 같은 함수의 반대쪽 — **L2 이하에서는 실상호 키 자체가 없다**(치환 · 숨김이 아니라 삭제 · §10-5 ⓐ)",
  { real: realProbe && realProbe.l2Leak, code: codeProbe && codeProbe.l2Leak });
chk(realProbe.log === 0 && !!codeProbe && codeProbe.log === 0,
  "단언 16-d 로그 축은 **두 모드에서 모두** 상호 0건이다(커밋이 반출이다)", { real: realProbe.log, code: codeProbe && codeProbe.log });
chk(realProbe.notice === true && !!codeProbe && codeProbe.notice === false,
  "단언 16-e 실명 표기에서 반출 고지가 필수이고 코드 표기에서 권고로 내려간다(문구는 지우지 않는다)", { real: realProbe.notice, code: codeProbe && codeProbe.notice });
chk(!!codeProbe && codeProbe.cols === realProbe.cols && codeProbe.settleLabel === realProbe.settleLabel,
  "단언 16-f 반출 열 구성과 금액 라벨은 모드와 무관하게 불변이다(모드가 바꾸는 것은 이름뿐이다)", { real: realProbe.cols, code: codeProbe && codeProbe.cols });
chk(!!codeProbe && codeProbe.nameOf === "PT0001" && realProbe.nameOf !== "PT0001",
  "단언 16-g 표시명이 **한 함수**를 지난다(같은 레코드가 모드에 따라 두 값을 돌려준다)", { real: realProbe.nameOf && realProbe.nameOf.slice(0, 6), code: codeProbe && codeProbe.nameOf });
const encCols = E.exportCols.map((c) => c.k);
chk(encCols.indexOf("dispName") >= 0 && !encCols.some((k) => /^(legalName|vendorName|name)$/.test(k)),
  "단언 16-h 반출물은 표시명 **한 칸만** 싣는다 — 실상호 원 필드가 열에 없다", encCols);
/* ⓓ ratchet — 스냅샷이 **하한을 보유한다.** 코드 표기로 내려간 뒤 실명으로 되돌리는 것은
   결정이 아니라 사고다(§4-6-4 되돌림).
   ★ [P7 실측으로 적발 · 2026-10-26] 종전 구현은 하한을 `nameMode` **한 칸**에 담았는데, 이 러너는
     **실패해도 스냅샷을 쓴다**(아래 writeFileSync 는 report() 보다 먼저다). 그래서 되돌림을 심고
     러너를 돌리면 ⓐ그 회차는 막지만 ⓑ같은 회차가 `nameMode` 를 "real" 로 덮어써서 **하한이 지워지고**
     ⓒ다음 회차는 통과했다 — ratchet 이 **한 번만 막고 스스로 무장을 해제**했다(실측: 「러너가
     스냅샷을 덮어썼는가: 예」). 하한을 측정값과 **다른 칸**(nameModeFloor)에 두고 단조 갱신한다:
     하한은 **더 엄격한 쪽**으로만 움직이므로 실패 회차의 쓰기가 하한을 낮추지 못한다. */
const MODE_RANK = { real: 0, code: 1 };
let prevSnap = null;
try { prevSnap = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/pg_scan_report.json"), "utf8")); } catch (e) { prevSnap = null; }
const prevFloor = (prevSnap && (prevSnap.nameModeFloor || prevSnap.nameMode)) || snap.nameMode;
const floorRank = Math.max(MODE_RANK[prevFloor] == null ? 0 : MODE_RANK[prevFloor], 0);
const srcRank = MODE_RANK[snap.nameMode] == null ? 0 : MODE_RANK[snap.nameMode];
snap.nameModeFloor = srcRank >= floorRank ? snap.nameMode : prevFloor;
chk(srcRank >= floorRank,
  "단언 16-i ratchet — 코드 표기로 내려간 뒤 실명으로 되돌리는 변경은 게이트가 막는다",
  { floor: prevFloor, source: snap.nameMode });
chk(MODE_RANK[snap.nameModeFloor] >= floorRank,
  "단언 16-i2 하한은 **더 엄격한 쪽으로만** 움직인다 — 실패 회차의 스냅샷 쓰기가 하한을 낮추지 못한다(한 번만 막고 무장 해제되는 사고를 막는다)",
  { prevFloor: prevFloor, written: snap.nameModeFloor });

/* ════════ 단언 18 — 반출 지점의 집행 수준을 **이름으로** 지킨다 ════════
   ★ 왜 이름이 필요한가: 반출 hard 는 종전에 집행 파일의 두 번째 테이블만 들고 있었고, 어느 단언도
     그 값을 직접 보지 않았다(음성 테스트의 **간접 효과**로만 지켜졌다). 간접으로만 잡히는 값은
     되돌릴 때 이름이 아니라 증상으로 보고된다. 그리고 수준을 **묻는 함수가 둘**이면 P5a · P7 이
     「이 지점의 집행 수준」을 물어 advisory 를 받는다(실측으로 그렇게 나왔다). */
const exportLv = W.run("return pgEnforceLevel('" + (E.exportRule || "PG-EXPORT") + "', 'pep.export', {});");
chk(exportLv.declared === "hard", "단언 18-a 반출 규약의 **선언 수준이 hard** 다(배포 테이블)", exportLv);
chk(exportLv.level === "hard", "단언 18-b 실효 수준도 hard — 조항 승격 플로어가 이 지점에 적용되지 않는다", exportLv);
chk((E.exportEnforce[E.exportRule] || {})["pep.export"] === "hard",
  "단언 18-c 배포 테이블 자신이 hard 를 들고 있다", E.exportEnforce);
chk(W.run("return pgEnforceLevel('L-01', 'pep.export', { kind: 'PT-COM', cause: 'rule_violation', stage: '거래중' }).level;") === "hard",
  "단언 18-d **조항으로 물어도 같은 답**이다 — 「이 지점의 집행 수준」을 묻는 함수가 하나다(§15-8)");
chk(!!exportLv.rule, "단언 18-e 반환값이 수준의 원천 테이블 이름을 말한다 — 두 번째 원천을 찾아 헤매지 않게", exportLv.rule);
snap.exportDeclared = { rule: E.exportRule, declared: exportLv.declared, effective: exportLv.level, cap: exportLv.cap };

/* ════════ 단언 19 — 집계 · 조회 키가 `vendorId` 인가(§4-6-5 ⓒ · §13-6 단언 16) ════════
   ★ 표시 함수로 감싸면 **글자가 아니라 동작이 바뀌는** 자리다. 상호 문자열을 집계 버킷 키나
     드릴다운 질의로 쓰면, 코드 표기 모드에서 이름이 바뀌는 순간 버킷이 갈라지고 드릴다운이
     아무것도 찾지 못한다. 실측: `vendorId` 로 키잉해도 버킷 수 108 동일(손실 0).
   ★ 그리고 생성 시점에 파생 문자열에 상호를 심지 않는다(§4-6-5 ⓐ) — `vendorId` 가 없는 문자열은
     `pgDisplayName()` 이 **닿을 수 없다**. 실측 사정권: `shipments[].from` 28,755/28,755 ·
     합성 제품명 52/52 가 그 둘로 99%를 만든다. */
{
  const SO = fs.readFileSync(path.join(ROOT, "src/components/SupplyOntology.jsx"), "utf8");
  const SD = fs.readFileSync(path.join(ROOT, "src/data/supplyData.js"), "utf8");
  const soS = strip(SO), sdS = strip(SD);
  /* ⓐ 집계 버킷 키 — 거래처 TOP 집계가 상호 문자열을 키로 쓰지 않는다 */
  chk(/venSales/.test(soS), "단언 19-a0 거래처 집계 축이 실재한다(분모 — 이름이 사라지면 ⓐ가 공집합으로 통과한다)");
  chk(!/venSales\s*\[\s*o\s*\.\s*vendorName\s*\]/.test(soS) && !/venSales\s*\[\s*[a-z]\s*\.\s*vendorName\s*\]/.test(soS),
    "단언 19-a 거래처 집계 버킷 키가 **상호 문자열이 아니다**(vendorId 로 키잉한다)",
    (soS.match(/venSales\s*\[[^\]]*\]/g) || []).slice(0, 4));
  /* ⓑ 드릴다운 질의 — 관계 카드가 상호를 질의로 넘기지 않는다 */
  const rel = (soS.match(/function _scRel[\s\S]*?\n}/) || [""])[0];
  chk(rel.length > 50, "단언 19-b0 드릴다운 질의 함수가 실재한다(분모)", rel.length);
  chk(!/\b[a-z]\s*\.\s*vendorName\b/.test(rel) && !/P\("제품",[^)]*r\s*\.\s*name\s*\)/.test(rel),
    "단언 19-b 드릴다운 질의가 **식별자**를 넘긴다(상호 · 품목명 문자열이 아니다)",
    (rel.match(/\b[a-z]\s*\.\s*(?:vendorName|name|skuName)\b/g) || []).slice(0, 6));
  /* ⓒ 표 검색 — 주문 · 배송 · 정산 탭이 상호로 매칭하지 않는다 */
  const srch = soS.match(/search:\s*\(r,\s*q\)\s*=>.*?\.includes\(q\)/g) || [];
  chk(srch.length >= 7, "단언 19-c0 표 검색식이 실재한다(분모 — 식이 사라지면 ⓒ가 공집합으로 통과한다)", srch.length);
  chk(!srch.some((x) => /r\.vendorName/.test(x)),
    "단언 19-c 표 검색이 **상호 문자열로 매칭하지 않는다**(vendorId 축으로 찾는다)",
    srch.filter((x) => /r\.vendorName/.test(x)).slice(0, 3));
  /* ⓓ 생성 시점 — 파생 문자열에 상호를 심지 않는다 */
  chk(!/vendorName\s*\+\s*"\s*물류창고/.test(sdS) && !/o\.vendorName\s*\+/.test(sdS),
    "단언 19-d 출고 표기에 **상호를 심지 않는다** — 데이터에는 식별자만 두고 표기는 렌더에서 조립한다(§4-6-5 ⓐ)",
    (sdS.match(/[a-z]\.vendorName\s*\+[^,\n]*/g) || []).slice(0, 3));
  chk(!/v\.name\.split\("\("\)\[0\]\s*\+\s*" "/.test(sdS),
    "단언 19-e 합성 제품명에 **상호 머리말을 붙이지 않는다**(카테고리 낱말만 · §4-6-5 ⓐ)",
    (sdS.match(/v\.name\.split[^,\n]*/g) || []).slice(0, 3));
  /* ⓕ 실측 — 전환해도 손실이 없다. 버킷 수와 전건 포착을 숫자로 센다 */
  const keyed = W.run(`
    const D = supplyData();
    const byId = {}, byName = {};
    for (const o of D.orders) { if (o.status === "취소") continue;
      byId[o.vendorId] = (byId[o.vendorId] || 0) + o.amount; byName[o.vendorName] = (byName[o.vendorName] || 0) + o.amount; }
    let shipNamed = 0;
    const names = pgVendorNames();
    for (const s of D.shipments) { const f = String(s.from || ""); for (const n of names) if (f.indexOf(n) >= 0) { shipNamed++; break; } }
    let prodNamed = 0, synth = 0;
    for (const p of D.products) { if (p.real) continue; synth++; for (const n of names) if (String(p.name).indexOf(n.split("(")[0]) >= 0) { prodNamed++; break; } }
    return { idBuckets: Object.keys(byId).length, nameBuckets: Object.keys(byName).length,
      shipRows: D.shipments.length, shipNamed: shipNamed, synth: synth, prodNamed: prodNamed };`);
  chk(keyed.idBuckets === keyed.nameBuckets,
    "단언 19-f 식별자로 키잉해도 **버킷 수가 같다**(손실 0 — 전환이 숫자를 바꾸지 않는다)", keyed);
  chk(keyed.shipNamed === 0,
    "단언 19-g 출고 표기 전건에 상호가 **박혀 있지 않다** — pgDisplayName() 이 닿을 수 없는 자리를 남기지 않는다", { rows: keyed.shipRows, named: keyed.shipNamed });
  chk(keyed.synth > 0 && keyed.prodNamed === 0,
    "단언 19-h 합성 제품명 전건에 상호 머리말이 **없다**(분모 " + keyed.synth + "건)", { synth: keyed.synth, named: keyed.prodNamed });
  snap.keyAxis = keyed;
}

/* ════════ 단언 17 — 「같은 장부」 문안(소유자 결과를 읽는다) ════════ */
let wgSnap = null;
try { wgSnap = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/wording_guard_snapshot.json"), "utf8")); } catch (e) { wgSnap = null; }
const wgSrc = fs.readFileSync(path.join(ROOT, "scripts/run_wording_guard.mjs"), "utf8");
chk(/pgSameLedger/.test(wgSrc), "단언 17-a 「같은 장부」 검사의 소유자가 run_wording_guard 에 살아 있다");
chk(!!wgSnap && wgSnap.pgSameLedger === 0 && wgSnap.fails === 0,
  "단언 17-b 소유 러너의 결과를 읽는다 — 「같은 장부」 문안 0건", wgSnap && { same: wgSnap.pgSameLedger, fails: wgSnap.fails });

/* ════════ 보강 — 결정 로그 · 집행 레코드 · 결정론 · 저장 키 등재 ════════ */
chk(E.actorKinds.length === 3 && E.actorKinds.some((a) => a.k === "PT") && E.actorKinds.some((a) => a.k === "SYS"),
  "결정 로그 — 행위자 유형에 협력업체 주체와 시스템 판정기가 더해졌다(사람 승인과 시스템 판정이 로그에서 갈린다)", E.actorKinds.map((a) => a.k));
const auditRow = E.auditRow({ actor: "SYS-PGDECIDE", action: "판정 호출", target: "PT0001", result: "성공", risk: "낮음" }, { asOf: ASOF });
const fdRow = W.run("const f = foundationData(); return Object.keys(f.auditLogs[0]).sort().join(',');");
chk(["actor", "ts", "action", "target", "result", "risk"].every((k) => k in auditRow),
  "결정 로그 — 기존 감사로그와 **같은 스키마**다", Object.keys(auditRow));
chk(fdRow.indexOf("actor") >= 0 && fdRow.indexOf("risk") >= 0, "결정 로그 — 기존 감사로그 스키마를 실제로 대조했다", fdRow);
chk(E.auditAppend({ actor: "XX9999", action: "판정 호출", target: "PT0001", result: "성공" }).ok === false,
  "결정 로그 — 행위자 유형 밖은 기록되지 않는다");
chk(E.auditAppend({ actor: "EMP0001", action: "임의행위", target: "PT0001", result: "성공" }).ok === false,
  "결정 로그 — 등재되지 않은 행위는 기록되지 않는다(가공 기록 금지)");
E.remedyClear();
chk(E.actionRecord({ policyId: BASIS_ID, partnerId: "PT0001", pep: "pep.register", noticeAt: "2026-10-01" }, {}).ok === false,
  "집행 레코드 — 4필드 중 하나라도 **자리가 없으면** 거부된다");
chk(E.actionRecord({ policyId: BASIS_ID, partnerId: "PT0001", pep: "pep.register", noticeAt: null, defenseDue: "2026-10-15", defenseText: "", reviewResult: "" }, {}).ok === false,
  "집행 레코드 — 사전 통지 없는 집행은 거부된다(통지 없는 집행은 절차가 아니다)");
const saved = E.actionSave({ policyId: BASIS_ID, partnerId: "PT0001", pep: "pep.register", level: "soft", noticeAt: "2026-10-01", defenseDue: "2026-10-15", defenseText: "", reviewResult: "", actor: "EMP0001" }, { asOf: ASOF });
chk(saved.ok && E.actionStats().noDefense === 1,
  "집행 레코드 — **소명 없이 집행된 건수**를 따로 센다(0으로 보이게 만들지 않는다)", E.actionStats());
chk(E.actionFields.length === 4 && E.actionFields.map((f) => f.k).join(",") === "noticeAt,defenseDue,defenseText,reviewResult",
  "집행 레코드 — 사전 통지 · 소명 기한 · 소명 내용 · 재심 4필드", E.actionFields.map((f) => f.k));
/* 저장 키 등재 — 미등재면 커밋이 막힌다. 다섯 키 전건을 카탈로그에 묻는다 */
const keyCheck = {};
for (const k of Object.keys(E.keys)) keyCheck[k] = W.run("return hifinCatalogKnown('" + E.keys[k] + (k === "reportPrefix" ? "demo" : "") + "');");
chk(Object.keys(keyCheck).every((k) => keyCheck[k] === true), "신규 저장 키 5종 전건 등재(미등재면 커밋이 막힌다)", keyCheck);
chk(W.run("const g = hifinKeyGroup('hifin_pg_block'); return g && g.g;") === "ops", "신규 저장 키의 그룹이 계측 · 운영이다");
chk(E.keys.block !== "hifin_events", "차단 로그가 공용 이벤트 키와 **다른 키**다", E.keys.block);
/* 결정론 */
E.blockClear();
const det1 = JSON.stringify(E.register(EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }));
const det2 = JSON.stringify(E.register(EMPTY("PT-COM"), { kind: "PT-COM", stage: "거래중", asOf: ASOF }));
chk(det1 === det2, "결정론 — 같은 입력 2회 호출이 완전히 같다");
chk(!/Math\.random/.test(encSrc), "결정론 — Math.random 0건(주석 제거 후)");
chk(!/new Date|Date\.now/.test(encSrc), "결정론 — 벽시계 0건(주석 제거 후)");
chk(!/sort\(\s*\(\)\s*=>/.test(encSrc), "결정론 — 셔플 정렬 0건");
chk(!/legalName|vendorName|상호/.test(JSON.stringify(E.blockAll())),
  "산출 경로 규약 — 로그에 상호 필드 0건");
/* ⚠ 스냅샷 쪽 검사는 **스냅샷을 다 채운 뒤**에 한 번 더 돈다(아래 「산출 경로 규약 — 최종」).
   여기서만 보면 뒤에 추가되는 절(단언 18~20)이 검사 **밖**에 남는다 — 실측으로 그랬다. */

/* ════════ 양성 테스트 — 규격을 갖춘 반출은 **실제로 통과한다** ════════
   왜 음성 테스트 앞에 이 한 줄이 필요한가: 아래 음성 15건은 전부 「막혔는가」만 묻는다. 그래서
   반출이 **항상** 막히는 상태가 되면 15건이 전부 녹색으로 뜬다 — 이 저장소가 두 번 겪은
   「0 = 0으로 통과」의 거울상이다. 실측으로 확인했다: pgExportHead 의 머리말 조립에서 4번째 줄
   (표시명 모드 고지)을 떼면 모든 반출이 막히는데(런타임은 fail-closed 로 올바르다) 음성 15건 ·
   정책 가드 · 표기 규약 가드가 **전부 통과**한다. 즉 고지 조립이 깨지면 반출 기능이 조용히
   죽고 게이트는 전건 녹색을 보고한다. 그 구멍을 닫는 자리가 여기다 —
   음성 테스트의 분모를 세우는 양성 단언이다. */
{
  const g0 = W.run("return __hifinPGEnforce();").export(
    W.run("return __hifinPGEnforce();").exportBuild(rows10, meta10, "tsv"),
    { level: "L1", kind: "tsv" });
  chk(g0.allow === true && g0.reasons.length === 0,
    "단언 10-i 규격을 갖춘 반출은 통과한다 — 음성 15건이 「항상 막힘」으로 전건 녹색이 되는 것을 막는다",
    { allow: g0.allow, reasons: g0.reasons });
  const hd0 = W.run("return (typeof pgExportHead === 'function') ? pgExportHead({ at: '" + ASOF + "', level: 'L1', scope: '전수' }, 'tsv').lines : null;");
  chk(Array.isArray(hd0) && hd0.length === 4 && hd0.every((l) => String(l || "").trim()),
    "단언 10-j 머리말 조립이 4줄을 **실제로** 내놓는다(조립이 깨지면 반출이 통째로 막힌다)", hd0);
}

/* ════════ 음성 테스트 — 일부러 깨서 차단을 확인한다 ════════ */
const neg = [];
function negative(label, world, patches, probe) {
  const w = patches ? load(patches) : world;
  if (patches && w.bad.length) { neg.push({ label: label, blocked: false, why: "적재 실패 " + w.bad[0] }); return; }
  let r = null;
  try { r = probe(w); } catch (e) { r = { blocked: true, why: "예외 — " + String(e.message).slice(0, 80) }; }
  neg.push({ label: label, blocked: !!r.blocked, why: r.why });
  chk(!!r.blocked, "음성 " + label + " — 차단됨", r.why);
}
/* ① 고지 문구를 떼면 반출이 막힌다(바닥 메우기 함정을 피해 **그 문장만** 떼낸다) */
negative("고지 문구만 떼낸 반출", W, null, (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const b = Ex.exportBuild(rows10, meta10, "tsv"); b.head[3] = "";
  const g = Ex.export(b, { level: "L1", kind: "tsv" });
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ② 고지를 다른 문구로 바꿔 끼우면(길이만 맞추면) 통과하지 않는다 */
negative("고지를 다른 문구로 대체", W, null, (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const b = Ex.exportBuild(rows10, meta10, "tsv"); b.head[3] = "# 참고용 자료입니다.";
  const g = Ex.export(b, { level: "L1", kind: "tsv" });
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ③ 복사 차단 전제를 끄면 실명 반출이 막힌다 */
negative("복사 차단 설정을 끈 실명 반출", W, null, (w) => {
  w.run("localStorage.setItem('hifin_guard_cfg', JSON.stringify({ noCopy: false })); return 1;");
  const Ex = w.run("return __hifinPGEnforce();");
  const g = Ex.export(Ex.exportBuild(rows10, meta10, "tsv"), { level: "L1", kind: "tsv" });
  w.run("localStorage.removeItem('hifin_guard_cfg'); return 1;");
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ④ 대외 등급으로 개별 식별을 실으면 막힌다 */
negative("대외 등급에 개별 식별 반출", W, null, (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const g = Ex.export(Ex.exportBuild(rows10, meta10, "tsv"), { level: "L4", kind: "tsv" });
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ⑤ 정산 지점 상한 — 두 단계로 본다.
   ⓐ **선언만** 올리면(상한 유지) 상한이 눌러야 한다 — 그것이 상한이 하는 일이다.
   ⓑ 선언을 올리고 **상한까지 떼면** 올라가야 한다 — 올라가지 않으면 ⓐ의 advisory 는 상한이 만든 것이
      아니라 다른 플로어가 만든 것이고, 그러면 상한을 지워도 아무 단언이 실패하지 않는다.
   ★ 선언만 바꾸고 끝내면 안 되는 이유가 이것이다. 2026-10-25 1차 작성에서 ⓑ만 돌렸고,
     선언이 이미 advisory 라 **상한을 떼도 수준이 변하지 않아** 음성 테스트가 거짓 음성이었다. */
const DECL_LINE = '    T[p.id] = { "pep.register": reg, "pep.settle": "advisory", "pep.expose": "advisory" };';
const DECL_SOFT = '    T[p.id] = { "pep.register": reg, "pep.settle": "soft", "pep.expose": "soft" };';
const CAP_LINE = 'const PG_ENFORCE_CAP = { "pep.register": "soft", "pep.settle": "advisory", "pep.expose": "advisory", "pep.export": "hard" };';
const CAP_OPEN = 'const PG_ENFORCE_CAP = { "pep.register": "soft", "pep.settle": "hard", "pep.expose": "hard", "pep.export": "hard" };';
const declOnly = load([{ file: "src/data/partnerPolicy.js", from: DECL_LINE, to: DECL_SOFT }]);
chk(declOnly.bad.length === 0 &&
  declOnly.run("const p = pgPolicy('L-04'); p.contractBasis = 'x'; return pgEnforceLevel('L-04', 'pep.settle', { kind: 'PT-COM' }).level;") === "advisory",
  "단언 4-f 선언을 soft 로 올려도 정산 · 노출 지점은 상한이 advisory 로 누른다(상한이 코드 고정이라는 뜻)",
  declOnly.bad.length ? declOnly.bad : declOnly.run("return pgEnforceLevel('L-04', 'pep.settle', { kind: 'PT-COM' }).level;"));
negative("정산 지점 상한 제거(선언 승격 + 상한 개방)", W, [
  { file: "src/data/partnerPolicy.js", from: DECL_LINE, to: DECL_SOFT },
  { file: "src/data/partnerPolicy.js", from: CAP_LINE, to: CAP_OPEN },
], (w) => {
  const l = w.run("const p = pgPolicy('L-04'); p.contractBasis = 'x'; return pgEnforceLevel('L-04', 'pep.settle', { kind: 'PT-COM' }).level;");
  return { blocked: l !== "advisory", why: "상한을 떼면 정산 지점 수준이 " + l + " 로 올라간다 — 현 코드는 advisory 로 누른다" };
});
/* ⑥ 이벤트 등재를 떼면 차단이 공용 버스에서 조용히 사라진다 */
negative("차단 이벤트 등재 제거", W, [{
  file: "src/data/hiEvents.js",
  from: '  pg_blocked:      { ko: "협력업체 통제 차단", stage: null, axis: "control" },',
  to: "",
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  Ex.blockClear(); w.run("localStorage.setItem('hifin_events', '[]'); return 1;");
  const b = Ex.exportBuild(rows10, meta10, "tsv"); b.head[3] = "";
  Ex.export(b, { level: "L1", kind: "tsv" });
  const n = w.run("return (hiEventStats().by.pg_blocked || 0);");
  const own = Ex.blockAll().length;
  return { blocked: n === 0 && own === 1, why: "등재를 떼면 공용 버스 기록이 " + n + "건(전용 키는 " + own + "건) — 등재가 유일한 합법 경로다" };
});
/* ⑦ 단계 집계에서 null 제외를 떼면 퍼널에 축 밖 칸이 생긴다 */
negative("단계 집계의 축 밖 제외 제거", W, [{
  file: "src/data/hiEvents.js",
  from: "if (d && d.stage != null) stage[d.stage]++;",
  to: "if (d) stage[d.stage]++;",
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  Ex.blockClear(); w.run("localStorage.setItem('hifin_events', '[]'); return 1;");
  const b = Ex.exportBuild(rows10, meta10, "tsv"); b.head[3] = "";
  Ex.export(b, { level: "L1", kind: "tsv" });
  const keys = w.run("return Object.keys(hiEventStats().stage).sort().join(',');");
  return { blocked: keys !== "1,2,3", why: "제외를 떼면 단계 칸이 " + keys + " 로 늘어난다" };
});
/* ⑧ 전용 키를 공용 키로 되돌리면 차단 기록이 밀려 나간다 */
negative("차단 로그를 공용 키로 되돌림", W, [{
  file: "src/data/partnerEnforce.js",
  from: 'const PG_BLOCK_KEY = "hifin_pg_block";',
  to: 'const PG_BLOCK_KEY = "hifin_events";',
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const known = w.run("return hifinCatalogKnown('hifin_pg_block');");
  Ex.blockClear();
  const b = Ex.exportBuild(rows10, meta10, "tsv"); b.head[3] = "";
  Ex.export(b, { level: "L1", kind: "tsv" });
  const shared = w.run("return (JSON.parse(localStorage.getItem('hifin_events') || '[]')).length;");
  return { blocked: shared > 1, why: "되돌리면 전용 로그와 회원 퍼널이 같은 " + shared + "건 버퍼를 쓴다(등재 " + known + ")" };
});
/* ⑨ 제출 필드를 사전에 몰래 더하면 고아로 잡힌다 */
negative("사전에 조항이 쓰지 않는 필드 추가", W, [{
  file: "src/data/partnerEnforce.js",
  from: '  { n: 60, k: "withdrawal_terms", ko: "청약철회 약관 보유", form: "Y/N", note: "" },',
  to: '  { n: 60, k: "withdrawal_terms", ko: "청약철회 약관 보유", form: "Y/N", note: "" },\n  { n: 61, k: "owner_phone", ko: "대표 연락처", form: "전화번호", note: "" },',
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const a = Ex.fieldAudit();
  return { blocked: a.length > 0, why: a.map((x) => x.k + ":" + x.why).join(" / ") };
});
/* ⑩ 「받지 않는 것」 선언을 받는다로 바꾸면 잡힌다 */
negative("「받지 않는 것」 선언 반전", W, [{
  file: "src/data/partnerEnforce.js",
  from: '  { id: "r2", ko: "환자 · 수급자 식별정보", taken: false,',
  to: '  { id: "r2", ko: "환자 · 수급자 식별정보", taken: true,',
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const a = Ex.fieldAudit();
  return { blocked: a.length > 0, why: a.map((x) => x.k + ":" + x.why).join(" / ") };
});
/* ⑪ 표시명을 한 함수 밖에서 만들면(반출 열에 실상호 원 필드) 막힌다 */
negative("반출 열에 실상호 원 필드 추가", W, [{
  file: "src/data/partnerEnforce.js",
  from: '  { k: "kind", ko: "유형", why: "" },',
  to: '  { k: "legalName", ko: "실상호", why: "" },\n  { k: "kind", ko: "유형", why: "" },',
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const g = Ex.export(Ex.exportBuild(rows10, meta10, "tsv"), { level: "L1", kind: "tsv" });
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ⑫-b 호출자가 「고지 필요 없음」이라고 적어 보내도 집행이 그것을 믿지 않는다 */
negative("호출자가 고지 필수 플래그를 끈 반출", W, null, (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const b = Ex.exportBuild(rows10, meta10, "tsv");
  b.head[3] = ""; b.noticeRequired = false;    /* 산출물 객체의 선언을 뒤집는다 */
  const g = Ex.export(b, { level: "L1", kind: "tsv" });
  return { blocked: g.allow === false, why: g.reasons.join(" / ") };
});
/* ⑬ 고지 필수 판정을 산출물 객체에서 읽게 되돌리면 ⑫-b 가 통과해 버린다 */
negative("고지 필수 판정의 원천을 산출물 객체로 되돌림", W, [{
  file: "src/data/partnerEnforce.js",
  from: 'const required = (typeof pgExportNoticeRequired === "function") ? pgExportNoticeRequired() : true;',
  to: "const required = built ? built.noticeRequired : true;",
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  const b = Ex.exportBuild(rows10, meta10, "tsv");
  b.head[3] = ""; b.noticeRequired = false;
  const g = Ex.export(b, { level: "L1", kind: "tsv" });
  const slipped = g.reasons.indexOf("실명 표기인데 반출물 머리말 고지가 없다") < 0;
  return { blocked: slipped, why: "되돌리면 고지 검사가 호출자의 선언을 따라 " + (slipped ? "건너뛴다" : "여전히 돈다") + " — 현 코드는 모드 스위치 한 곳에서 읽는다" };
});
/* ⑫ ratchet 로더가 하향을 받아들이면 — 폴백 분기를 떼낸다 */
negative("ratchet 폴백 분기 제거", W, [{
  file: "src/data/partnerEnforce.js",
  from: 'if (RANK[want] <= RANK[cur]) { out.fallback.push(tag + " → 배포 테이블 " + cur); continue; }',
  to: "if (false) { continue; }",
}], (w) => {
  const Ex = w.run("return __hifinPGEnforce();");
  w.run("localStorage.setItem('hifin_pg_enforce', JSON.stringify({ 'L-04': { 'pep.register': 'advisory' } })); return 1;");
  const r = Ex.enforceLoad("neg");
  const lv = w.run("return PG_ENFORCE['L-04']['pep.register'];");
  return { blocked: r.fallback.length === 0, why: "폴백을 떼면 하향 저장값이 전환 함수로 흘러간다(거부 " + r.refused.length + "건 · 테이블 " + lv + ") — 현 코드는 폴백으로 먼저 막는다" };
});

/* ════════ 인수 단언 — 정산 파생의 금액 항등식 (P0 결정서 v1.1 §6 단언 1~8 · 10 · 12) ════════
   ★ 왜 여기인가. P1 이 정산 생성기를 주문 파생으로 교체하면서 금액 항등식 · 교차 항등식을 임시 러너로만
     측정하고 **영구 게이트 집 없이** 넘겼다(P1 · P2 인수 사항). 새 러너는 둘만 허용되므로 집은 둘 중 하나다.
     그리고 이 러너의 커밋 게이트 패턴에 거래 사실 레이어가 들어 있으므로, 생성기를 누가 되돌리면
     **이 러너가 실제로 돈다**. 지금까지는 누가 되돌려도 커밋 게이트가 잡지 못했다.
   ★ 중복 배치하지 않는다. 전표ID 결정성 · 셔플 정렬 · 정산 라벨 · 「같은 장부」 문안은 정적으로 볼 수 있는
     축이라 run_wording_guard 검사 ⑫⑬이 **이미 소유**한다. 여기서는 소유자가 없는 **금액 축**만 센다.
   ★ 숫자를 하드코딩하지 않고 **관계**를 단언한다 — 시드가 바뀌어도 관계는 성립해야 한다. */
const SET = W.run(`
  const D = supplyData();
  const F = supplyFinance();
  const prod = {}; for (const p of D.products) prod[p.sku || p.id] = p;
  const con = {}; for (const c of D.contracts) con[c.vendorId] = c;
  const win = {};
  for (const s of D.settlements) win[s.period] = 1;
  const months = Object.keys(win).sort();
  const live = D.orders.filter((o) => o.status !== "취소" && months.indexOf(String(o.orderDate).slice(0, 7)) >= 0);
  const byCell = {};
  for (const o of live) {
    const k = o.vendorId + "|" + String(o.orderDate).slice(0, 7);
    const b = byCell[k] || (byCell[k] = { sales: 0, cost: 0, n: 0 });
    const p = prod[o.sku] || {};
    b.sales += o.amount; b.cost += (Number(p.supplyPrice) || 0) * (Number(o.qty) || 0); b.n += 1;
  }
  const rows = D.settlements.map((s) => ({ id: s.id, v: s.vendorId, p: s.period,
    sales: s.sales, cost: s.supplyCost, fee: s.fee, net: s.marginNet, orders: s.orders }));
  const sum = (a, f) => a.reduce((x, r) => x + (Number(f(r)) || 0), 0);
  const perV = {};
  for (const r of rows) { const b = perV[r.v] || (perV[r.v] = { cost: 0, take: 0, sales: 0 }); b.cost += r.cost; b.take += r.fee + r.net; b.sales += r.sales; }
  const perVOrder = {};
  for (const k of Object.keys(byCell)) { const v = k.split("|")[0]; perVOrder[v] = (perVOrder[v] || 0) + byCell[k].sales; }
  return {
    n: rows.length, months: months.length, vendors: D.vendors.length,
    cells: Object.keys(byCell).length,
    idBreak: rows.filter((r) => r.sales !== r.cost + r.fee + r.net).length,
    negCost: rows.filter((r) => r.cost < 0).length, negNet: rows.filter((r) => r.net < 0).length,
    zeroSales: rows.filter((r) => !r.sales).length, zeroOrders: rows.filter((r) => !r.orders).length,
    takeOver: rows.filter((r) => (r.fee + r.net) / r.sales >= 1).length,
    sumSales: sum(rows, (r) => r.sales), sumCost: sum(rows, (r) => r.cost),
    sumTake: sum(rows, (r) => r.fee + r.net), sumFee: sum(rows, (r) => r.fee),
    finCost: F.supplyCost, finMargin: F.margin, finGmv: F.gmv,
    orderGmv: sum(live, (o) => o.amount),
    feeBreak: rows.filter((r) => r.fee !== Math.round(r.sales * Number((con[r.v] || {}).feePct) / 100)).length,
    vMismatchCost: Object.keys(perV).filter((v) => {
      let c = 0; for (const k of Object.keys(byCell)) if (k.split("|")[0] === v) c += byCell[k].cost;
      return Math.abs(perV[v].cost - c) > 0;
    }).length,
    vMismatchSales: Object.keys(perV).filter((v) => Math.abs(perV[v].sales - (perVOrder[v] || 0)) > 0).length,
    vInverted: Object.keys(perV).filter((v) => perVOrder[v] && perV[v].sales / perVOrder[v] > 1).length,
    uniqV: Object.keys(perV).length, counts: D.counts ? D.counts.vendor : null,
  };`);
chk(SET.idBreak === 0, "인수 1 정산 행 항등식(매출 = 매입 + 수수료 + 순마진) 위반 0 / " + SET.n, SET.idBreak);
chk(SET.sumCost === SET.finCost && SET.vMismatchCost === 0,
  "인수 2 **매입축 교차 일치** — 파생 합계 = 집계 함수(원 단위) · 거래처별도 — plug 위치를 검증하는 유일한 단언",
  { derived: SET.sumCost, fin: SET.finCost, diff: SET.sumCost - SET.finCost, vendors: SET.vMismatchCost });
chk(SET.sumTake === SET.finMargin, "인수 3 플랫폼 수취축 교차 일치", { derived: SET.sumTake, fin: SET.finMargin, diff: SET.sumTake - SET.finMargin });
chk(SET.sumSales === SET.orderGmv && SET.vMismatchSales === 0,
  "인수 4 포착률 1.000000 — 창 내 취소 제외 주문 총액과 차액 0원 · 거래처별도",
  { derived: SET.sumSales, order: SET.orderGmv, diff: SET.sumSales - SET.orderGmv, vendors: SET.vMismatchSales });
chk(SET.vInverted === 0, "인수 5 역전 0건 — 파생 정산이 같은 창 주문을 넘는 거래처 없음", SET.vInverted);
chk(SET.negCost === 0 && SET.negNet === 0 && SET.takeOver === 0,
  "인수 6 음수 0건(매입 · 순마진) · 모든 행의 플랫폼 수취율 < 1.0", { negCost: SET.negCost, negNet: SET.negNet, takeOver: SET.takeOver });
chk(SET.zeroSales === 0 && SET.zeroOrders === 0 && SET.n === SET.cells,
  "인수 7 매출 0원 행 0건 · 주문 0건 셀에 행이 생성되지 않음(행 수 = 주문 보유 셀 수)", { rows: SET.n, cells: SET.cells, zero: SET.zeroSales });
chk(SET.feeBreak === 0,
  "인수 8 수수료 전건이 계약 수수료율 파생과 일치(수치 캐스팅 · 연산 순서 고정 · 행 1회 반올림)", SET.feeBreak);
chk(SET.sumFee + (SET.sumTake - SET.sumFee) === SET.sumTake && SET.sumSales === SET.sumCost + SET.sumTake,
  "인수 10 상위 합계가 행 합과 원 단위까지 일치(상위 금액에 요율을 다시 적용하는 자리 0건)",
  { sales: SET.sumSales, cost: SET.sumCost, take: SET.sumTake });
chk(SET.uniqV === SET.vendors && SET.counts === SET.vendors,
  "인수 12 고유 거래처 수 = 모집단(행 수 기반 단언을 쓰지 않는다 — 빈 셀이 거짓 실패를 만든다)",
  { uniq: SET.uniqV, vendors: SET.vendors, counts: SET.counts });
snap.settle = { rows: SET.n, months: SET.months, vendors: SET.vendors, cells: SET.cells,
  idBreak: SET.idBreak, feeBreak: SET.feeBreak, inverted: SET.vInverted,
  crossCost: SET.sumCost - SET.finCost, crossTake: SET.sumTake - SET.finMargin, crossSales: SET.sumSales - SET.orderGmv };
/* 음성 — 역산 산식으로 되돌리면 매입축 · 플랫폼 수취축이 전행 어긋난다. 행 항등식은 **여전히 통과**한다:
   두 산식을 구별하는 검사는 인수 2 하나뿐이고, 그래서 그 단언이 러너에 있어야 한다. */
negative("정산 매입축을 역산 plug 로 되돌림", W, [{
  file: "src/data/supplyData.js",
  /* v1.0 산식을 **충실히** 재현한다 — 매입을 역산하고 순마진을 주문 마진으로 둔다.
     그러면 행 항등식은 **여전히 0건으로 통과**하고 매입축만 어긋난다. 그것이 이 음성 테스트의 요점이다:
     행 항등식만 가진 러너는 두 산식을 구별하지 못한다. */
  from: "          sales: c.sales, supplyCost: c.supplyCost, fee,\n          marginNet: c.sales - c.supplyCost - fee,",
  to: "          sales: c.sales, supplyCost: c.supplyCost - fee, fee,\n          marginNet: c.sales - c.supplyCost,",
}], (w) => {
  if (w.bad.length) return { blocked: false, why: "적재 실패" };
  const r = w.run(`
    const D = supplyData(); const F = supplyFinance();
    const rows = D.settlements;
    const sum = (f) => rows.reduce((x, s) => x + (Number(f(s)) || 0), 0);
    return { idBreak: rows.filter((s) => s.sales !== s.supplyCost + s.fee + s.marginNet).length,
      cross: sum((s) => s.supplyCost) - F.supplyCost, n: rows.length,
      per: rows.filter((s) => s.supplyCost !== s.sales - s.fee - s.marginNet).length };`);
  return { blocked: r.cross !== 0, why: "역산으로 되돌리면 매입축 교차 차액 " + r.cross + "원(행 항등식 위반은 " + r.idBreak + "건 — 행 항등식만으로는 구별되지 않는다)" };
});

/* ════════ 스냅샷 ════════ */
const effDist = {}, decDist = {};
for (const p of pols) for (const pep of PEPS) {
  const eff = W.run("return pgEnforceLevel('" + p.id + "', '" + pep + "', {}).level;");
  const dec = (H.enforce[p.id] || {})[pep] || "advisory";
  effDist[pep + ":" + eff] = (effDist[pep + ":" + eff] || 0) + 1;
  decDist[pep + ":" + dec] = (decDist[pep + ":" + dec] || 0) + 1;
}
snap.enforceEffective = effDist;
snap.enforceDeclared = decDist;
snap.pepCap = H.enforceCap;
snap.pepBlockedNow = pepBlocked;
snap.pepExpect = R.pepExpect.map((r) => ({ pep: r.pep, expect: r.expect, got: pepBlocked[r.pep] }));
snap.blockPlanted = PLANT;
snap.blockStats = { total: st10.total, byPep: st10.byPep, byCause: st10.byCause, byPolicy: st10.byPolicy };
snap.modeProbe = { real: { rendered: realProbe.rendered, log: realProbe.log, notice: realProbe.notice },
  code: codeProbe ? { rendered: codeProbe.rendered, log: codeProbe.log, notice: codeProbe.notice, mapped: codeProbe.mapped } : null };
snap.owners = {
  "단언 8 임계 리터럴": "scripts/run_pg_policy.mjs 단언 8-d",
  "단언 15 산식 동결": "scripts/fin_site_check.mjs (FB_P0 6키 값 고정)",
  "단언 17 「같은 장부」": "scripts/run_wording_guard.mjs 검사 ⑬",
};
snap.negative = { total: neg.length, blocked: neg.filter((n) => n.blocked).length };

/* ════════════════════════════════════════════════════════════════════════════════
   단언 20 — **브라우저 실측.** 지시서 §14-1 표가 이 러너의 방식에 「브라우저 실측(§15-1 ③)」을
   적고, §15-1 규약 3이 그 소유자를 **이 러너 한 곳**으로 못 박는다.
   ★ 왜 정적 스캔으로 대신할 수 없는가(§15-1 규약 3 원문): 「**정적 스캔은 이 결함을 구조적으로
     볼 수 없다** … 실제 실패 모드는 소스에 상호 리터럴이 박히는 것이 아니라 `partner.dispName`에
     `v.name`이 흘러드는 **데이터 경로 사고**다 — 소스에 문자열이 없어도 화면에는 뜬다.」
     이 저장소가 같은 결론을 이미 적어 두었다(run_persona_diff 머리 주석: 「코드에서 하드코딩을
     찾는 것은 추정이다. 결정적 증거는 … 로그인해서 화면에 뜨는지 본다」).
   ★ 지금 세울 수 있는 것과 없는 것을 가른다. 판정 지면(서브탭 ④⑤)은 **P5a 산출물이라 아직 없다.**
     그래서 지금은 ⓐ다리 자체(로그인 → 렌더 텍스트 획득) ⓑ**탐지기가 실제로 상호를 셀 수 있는지**
     (거래 사실 레이어에서 0건이 아님 — 분모) ⓒ§15-9 법인 축 고지 2문구가 **렌더 텍스트에** 실제로
     떠 있는지 ⓓ판정 지면 레지스트리가 아직 비어 있다는 사실을 **스냅샷과 대조**해 세운다.
     ⓓ가 핵심이다 — P5a 가 지면을 추가하는 순간 레지스트리 수가 변하고, 그때 상호 카운트가
     **자동으로 요구된다.** 「지면이 없어서 0건」과 「지면이 있는데 0건」을 구별하지 못하면
     이 저장소가 두 번 겪은 「0 = 0 으로 녹색」을 세 번째로 겪는다.
   ★ 서버 · 브라우저에 닿지 못하면 **미검증으로 실패**한다(단언 9 와 같은 사상). 조용히 건너뛰면
     가드가 사라진 것과 같다. 형제 러너 8개가 이미 같은 전제로 커밋 게이트에 들어 있다. */
const PG_VERDICT_PAGES = ["src/components/PartnerGovReport.jsx"];   /* 판정 지면 — P5a 에서 생긴다 */
const verdictLive = PG_VERDICT_PAGES.filter((f) => fs.existsSync(path.join(ROOT, f)));
snap.verdictPages = { registered: PG_VERDICT_PAGES.length, live: verdictLive.length, files: verdictLive };
{
  const SKIP = process.env.HIFIN_PG_NOBROWSER === "1";
  let br = null, nameHits = 0, text = "", notices = {}, verdictHits = null, why = "";
  const subMoved = {};                 /* 서브탭별 이동 성공 여부 — 「못 눌러서 0건」을 분리한다 */
  let subVerdictText = "";             /* 판정 성질 서브탭에서만 모은 지면 텍스트 */
  if (SKIP) {
    why = "HIFIN_PG_NOBROWSER=1 — 브라우저 단계를 건너뛰었다";
  } else {
    try {
      const pptr = await import("puppeteer-core");
      const { devLogin } = await import("./devcred.mjs");
      br = await pptr.default.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
        headless: "new", args: ["--no-sandbox", "--disable-gpu"], defaultViewport: { width: 1360, height: 960 } });
      const pg = await br.newPage();
      await devLogin(pg);
      /* 관리자 → 온톨로지 → 협력업체 온톨로지 · 하네스.
         ★ 탭 라벨의 **단일 원천을 읽어** 누른다 — 문자열을 이 러너에 적으면 개칭이 갈릴 때
           검사가 조용히 「이동 실패 = 0건」으로 통과한다(검사 소유자 이원화와 같은 사고다). */
      const label = W.run("return PG_SECTION_KO;");
      const click = (lab) => pg.evaluate((l) => {
        const t = [...document.querySelectorAll("button,div,span,a,li")]
          .filter((x) => (x.innerText || "").indexOf(l) >= 0 && (x.innerText || "").trim().length < l.length + 12)
          .sort((a, c) => (a.innerText || "").length - (c.innerText || "").length)[0];
        if (t) { t.click(); return true; } return false;
      }, lab);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const movedSec = await click("온톨로지 · 하네스");
      await sleep(2600);
      const movedTab = await click(label);
      await sleep(3000);
      if (!movedSec || !movedTab) why = "탭 이동 실패 — 섹션 " + movedSec + " / 탭 " + movedTab;
      /* ★ P5a 가 이 패널을 **서브탭 5개**로 나눴다. 한 탭의 렌더 텍스트만 읽으면 ⓑ(상호 분모)와
         ⓒ(고지 2문구)와 ⓓ(판정 지면)가 **서로 다른 탭**에 있어 전부 0건이 되고, 그 0건은
         「이동 실패」와 구별되지 않는다 — 이 러너가 피하려는 바로 그 형태다. 그래서 서브탭을
         **전수 순회**해 텍스트를 모은다. 라벨은 용어 원천(PG_SUBTABS)에서 읽는다: 러너에 적으면
         개칭이 갈릴 때 검사가 조용히 통과한다(섹션 라벨을 그렇게 묶은 것과 같은 이유). */
      const subs = W.run("return (typeof PG_SUBTABS !== 'undefined') ? PG_SUBTABS.map((t) => ({ k: t.k, ko: t.ko, verdict: !!t.verdict })) : [];") || [];
      const parts = [], verdictParts = [];
      for (const sb of subs) {
        subMoved[sb.k] = await click(sb.ko);
        await sleep(1800);
        parts.push(await pg.evaluate(() => document.body.innerText || ""));
        if (sb.verdict) verdictParts.push(await pg.evaluate(() => [...document.querySelectorAll("[data-pg-verdict]")].map((x) => x.innerText || "").join("\n")));
      }
      text = parts.length ? parts.join("\n") : await pg.evaluate(() => document.body.innerText || "");
      subVerdictText = verdictParts.join("\n");
      for (const n of NAMES) if (text.indexOf(n) >= 0) nameHits++;
      /* ★ 키를 **문구가 아니라 자리 번호**로 적는다. 커밋되는 스냅샷에 화면 문구를 그대로 실으면
         산출물이 문구의 두 번째 원천이 되고(한쪽만 고쳐지면 어느 쪽이 요구인지 정해지지 않는다),
         그 문구 자체가 「상호」 같은 낱말을 품어 **산출 경로 규약 검사를 흐린다**(실측으로 그랬다). */
      const want = W.run("return (typeof PG_SCREEN_NOTICE !== 'undefined') ? PG_SCREEN_NOTICE.map((x) => x.text || x.must || x.ko || '') : [];");
      (want || []).forEach((t, i) => { if (t) notices["notice" + (i + 1)] = text.indexOf(String(t)) >= 0; });
      if (verdictLive.length) {
        /* 판정 지면이 생기면 그 지면의 렌더 텍스트에서 상호를 센다 — 코드 표기 전환 커밋의 통과 조건.
           ★ 서브탭 순회에서 **판정 성질 탭에서만** 모은 텍스트를 쓴다. 지금 떠 있는 탭 하나만 긁으면
             순회 끝에 남은 탭이 무엇이냐에 따라 결과가 달라진다. */
        verdictHits = subVerdictText || await pg.evaluate(() => {
          const r = [...document.querySelectorAll("[data-pg-verdict]")].map((x) => x.innerText || "").join("\n");
          return r;
        });
      }
    } catch (e) { why = String((e && e.message) || e).split("\n")[0]; }
    finally { if (br) try { await br.close(); } catch (e) {} }
  }
  /* 「닿았다」의 기준은 글자 수가 아니라 **그 패널이 실제로 떴는가**다 — 로그인 직후 랜딩 페이지도
     5,000자가 넘으므로 글자 수만 보면 이동 실패가 통과한다(실측으로 그렇게 통과했다). */
  const reached = text.length > 400 && text.indexOf("운영 현황판") >= 0;
  chk(SKIP || reached,
    "단언 20-a 브라우저 다리 — 관리자 로그인 후 렌더 텍스트를 실제로 가져왔다(닿지 못하면 **미검증으로 실패**한다. 서버: bash build_preview.sh && py -m http.server 5601)",
    { chars: text.length, why: why });
  if (reached) {
    chk(nameHits > 0,
      "단언 20-b **탐지기 자기시험** — 거래 사실 레이어의 렌더 텍스트에서 상호가 실제로 세어진다(분모). 0이면 「지면이 없어서 0」과 「탐지기가 고장나서 0」이 구별되지 않는다",
      nameHits);
    const noticeKeys = Object.keys(notices);
    chk(noticeKeys.length >= 2,
      "단언 20-c0 법인 축 화면 고지가 선언돼 있다(분모 — 선언이 비면 ⓒ가 공집합으로 통과한다)", noticeKeys.length);
    chk(noticeKeys.length >= 2 && noticeKeys.every((k) => notices[k] === true),
      "단언 20-c §15-9 법인 축 고지 2문구가 **렌더 텍스트에 실제로** 떠 있다 — 정적 스캔은 문자열이 소스에 있다는 것까지만 본다",
      notices);
    chk(verdictLive.length === 0 || (verdictHits !== null && String(verdictHits).length > 0),
      "단언 20-d 판정 지면이 생기면 그 지면의 렌더 텍스트를 **실제로 가져온다** — 지면 레지스트리(" +
      PG_VERDICT_PAGES.length + "개 등재 · " + verdictLive.length + "개 생성)가 변하는 순간 요구가 켜진다",
      { registered: PG_VERDICT_PAGES.length, live: verdictLive.length, got: verdictHits === null ? null : String(verdictHits).length });
    /* ★ 서브탭 순회가 **전부 성공했는가**. 한 탭을 못 누르면 그 탭의 고지 · 상호 · 판정이 0건이 되고,
       그 0건은 「없어서 0」과 구별되지 않는다 — 이 러너가 ⓑ·ⓒ0 에서 분모를 요구한 것과 같은 이유다. */
    const subKeys = Object.keys(subMoved);
    chk(subKeys.length >= 1 && subKeys.every((k) => subMoved[k] === true),
      "단언 20-e 서브탭 전수 순회 — 선언된 서브탭을 **모두** 눌렀다(한 탭이라도 못 누르면 그 탭의 고지 · 판정이 「없어서 0」과 구별되지 않는다)",
      subMoved);
  }
  snap.browser = { skipped: SKIP, reached: reached, chars: text.length, nameHits: nameHits,
    notices: notices, verdictPagesLive: verdictLive.length, subMoved: subMoved, why: why || null };
}

/* ════════ 단언 21 — 추적 5레인 · 재판정 · 정책 엔진 지면 (P5b · 지시서 §11 · §13-8) ════════
   ★ 왜 이 러너가 소유하는가: P5b 의 산출물은 **계산 레이어와 지면**이고, 계산 레이어는 JSX 파일에
     있다. 이 러너의 적재기는 매니페스트의 `.js` 만 읽으므로 그대로는 그 함수들이 단언 밖에 남는다
     — 그러면 지면이 늘어나도 검사가 **0건으로 조용히 통과**한다(이 저장소가 두 번 겪은 형태).
     그래서 지면 파일의 **경계 표식(⟦PG_CALC_END⟧) 위쪽**만 잘라 vm 에 적재한다. 그 윗부분은
     JSX 가 0건인 순수 계산 레이어이고, 아래 21-a0 이 그 전제를 먼저 단언한다(분모를 먼저 세운다).
   ★ 검사 소유자를 늘리지 않는다 — 이름 렌더(⑭)와 문안(③)은 run_wording_guard 가 소유하므로
     여기서는 **구조와 실측**만 본다. */
const PG_CALC_FILE = "src/components/PartnerGovReport.jsx";
const PG_CALC_MARK = "⟦PG_CALC_END⟧";
const PG_CALC_FNS = ["pgTrace", "pgWhatIf", "pgEngineRoll", "pgPolicyAffected", "_pgLedgerFp", "pgVerdictRoll", "pgPartnerRecs", "pgExportPlan",
  /* ①개요 머리의 체계 소개 — 종전에는 이 셋이 **어느 러너에도 등재되지 않아**, 문안에 수치
     리터럴을 박거나 슬롯이 「—」로 비어도 전 게이트가 조용히 녹색이었다(2026-10-26 적대적 심사). */
  "pgIntroFacts", "pgIntro", "pgIntroNotes"];
{
  const jsxSrc = fs.readFileSync(path.join(ROOT, PG_CALC_FILE), "utf8");
  const marks = jsxSrc.split(PG_CALC_MARK).length - 1;
  const mi = jsxSrc.indexOf(PG_CALC_MARK);
  const pre = mi < 0 ? "" : jsxSrc.slice(0, jsxSrc.lastIndexOf("/*", mi));
  const post = mi < 0 ? "" : jsxSrc.slice(mi);
  const preStripped = strip(pre);
  /* 계산 레이어에 JSX 가 섞이면 vm 적재가 깨진다 — 표식 위쪽이 순수 JS 라는 전제를 먼저 센다 */
  const jsxInPre = (preStripped.match(/return\s*\(\s*<|<\/[A-Za-z]|<[A-Z][A-Za-z]*\s/g) || []).length;
  const missFn = PG_CALC_FNS.filter((f) => preStripped.indexOf("function " + f) < 0 && preStripped.indexOf(f + " = ") < 0);
  chk(marks === 1, "단언 21-a0 계산 레이어 경계 표식이 지면 파일에 **정확히 하나**다(둘이면 어디까지가 계산인지 정해지지 않는다)", marks);
  chk(missFn.length === 0, "단언 21-a0 경계 위쪽에 P5b 계산 함수가 전건 있다(분모 — 함수가 아래로 내려가면 그 함수는 단언 밖이다)", missFn);
  chk(jsxInPre === 0, "단언 21-a0 경계 위쪽은 JSX 0건인 순수 계산 레이어다", jsxInPre);

  /* 지면 쪽 정적 단언 — 선언 테이블을 **순회**해 렌더하는가(레인 · 엔진 블록을 하드코딩하면
     선언이 늘어도 지면이 그대로이고, 「선언 수 = 렌더 수」를 아무도 세지 못한다) */
  const postS = strip(post);
  chk(/\.lanes\.map\(/.test(postS), "단언 21-a0 추적 지면이 선언된 레인 배열을 순회해 렌더한다(레인을 하드코딩하지 않는다)");
  chk(/E\.blocks\.map\(/.test(postS), "단언 21-a0 엔진 지면이 선언된 블록 배열을 순회해 렌더한다");
  chk(/pgEngineMetric\(/.test(postS), "단언 21-a0 엔진 지면의 수치가 **선언 테이블 조회**를 지난다(선언에 없는 수치는 지면에 설 수 없다)");
  /* 결정론 — 벽시계 · 난수 · 셔플 정렬 0건 */
  const allS = strip(jsxSrc);
  const det = { random: (allS.match(/Math\.random/g) || []).length,
    date: (allS.match(/new Date|Date\.now/g) || []).length,
    shuffle: (allS.match(/sort\(\s*\(\s*\)\s*=>/g) || []).length };
  chk(det.random === 0 && det.date === 0 && det.shuffle === 0,
    "단언 21-j 지면 파일에 난수 · 벽시계 · 셔플 정렬 0건 — 같은 입력이면 같은 추적이다", det);
  /* 재판정이 **같은 판정기 재호출**인가 — 값을 합성하는 자리가 없는가 */
  const wiBody = preStripped.slice(preStripped.indexOf("function pgWhatIf"), preStripped.indexOf("function pgEngineRoll"));
  /* ★ 단언 21-c2 — **추적 · 재판정 지면이 문장을 지어내지 않는다**(2026-10-26 신설).
     종전 21-c 는 `lanes[2].pay.reasons` 와 `r.reasons` 를 **배열로** 바이트 비교했다. 그래서 사유 배열
     **밖**에 세운 문장은 한 줄도 세지 못했다 — 실측으로 `outcomeNote` 가 선언 테이블에도 판정기 반환에도
     없는 지면 리터럴이었고, 「추적 지면의 모든 칸은 판정기가 돌려준 반환 필드입니다」라는 고지 **바로 위**에
     찍혔다. 애블레이션으로도 실증됐다: 레인 3 에 「종합하면 이 조항은 보완만 하면 충족으로 읽힙니다.」
     한 줄을 심고 번들을 다시 만들어도 run_pg_scan · run_wording_guard 가 전건 녹색이었다.
     ★ 사정권은 **문장**이다 — 종결어미(…습니다 / …합니다 / …입니다 / …됩니다)를 가진 한글 리터럴.
       짧은 라벨(「· 축」 「건」 「미확인」)은 사정권이 아니다. 문장이어야 지면이 사유를 지어낸 것이 된다.
     ★ 등재 여부는 **선언 테이블의 텍스트 전부**를 분모로 본다 — 러너가 문안을 적지 않는다(적으면 이원화).
     ★ 양성 테스트를 함께 돌린다 — 문장 1건을 심어 이 검사가 실제로 잡는지 확인한다(0 = 0 금지). */
  /* ★ 문장 스캐너와 선언 분모는 **블록 밖**에 둔다 — 아래 단언 21-e 가 소개 지면(PartnerIntro)에
     같은 사정권을 적용한다. 안에 가두면 검사마다 스캐너를 복제하게 되고, 복제된 검사는 한쪽만
     고쳐지는 순간 사정권이 갈린다(이 저장소가 「검사 소유자 이원화」로 두 번 격은 형태다). */
  const KO = "[\uac00-\ud7a3]";
    const END = /(습니다|합니다|입니다|됩니다|읽힙니다|같습니다|없습니다|있습니다)/;
    const declText = W.run(`
      const bag = [];
      const push = (v) => { if (typeof v === "string") bag.push(v); };
      try { for (const k of Object.keys(PG_DECL)) push(PG_DECL[k]); } catch (e) {}
      for (const t of ["PG_TRACE_LANES", "PG_TRACE_RULE", "PG_WHATIF_AXES", "PG_WHATIF_FORBID",
                       "PG_FLOOR", "PG_STAGE_EFFECT", "PG_NUM_RULE", "PG_SRC", "PG_VIEW",
                       "PG_PEP_SITES", "PG_SCREEN_NOTICE", "PG_ENGINE_BLOCKS", "PG_BLOCKS",
                       "PG_INTRO", "PG_INTRO_NOTE"]) {
        try { const a = eval(t); if (Array.isArray(a)) for (const r of a) for (const k of Object.keys(r || {})) push(r[k]); } catch (e) {}
      }
      try { for (const k of Object.keys(PG_AI_DECL)) push(PG_AI_DECL[k]); } catch (e) {}
      return bag.join("\u0001");
    `);
    const sentencesIn = (src, fns) => {
      const found = [];
      for (const fn of fns) {
        const a = src.indexOf("function " + fn);
        if (a < 0) continue;
        const b = src.indexOf("\nfunction ", a + 10);
        const body = strip(src.slice(a, b < 0 ? src.length : b));
        const seen = {};
        const add = (txt) => {
          const t = String(txt || "").trim();
          if (!t || !END.test(t)) return;
          if (seen[t]) return;
          seen[t] = 1;
          found.push({ fn: fn, text: t });
        };
        let m;
        const reQ = new RegExp('"([^"\\n]*' + KO + '[^"\\n]*)"', "g");
        while ((m = reQ.exec(body))) add(m[1]);
        const reT = new RegExp('>([^<>{}\\n]*' + KO + '[^<>{}\\n]*)<', "g");
        while ((m = reT.exec(body))) add(m[1]);
        const reB = new RegExp('\\}([^<>{}\\n]*' + KO + '[^<>{}\\n]*)\\{', "g");
        while ((m = reB.exec(body))) add(m[1]);
      }
      return found;
    };
  {
    const laneFns = ["PGLane", "PGWhatIfBox"];
    const liveSrc = fs.readFileSync(path.join(ROOT, PG_CALC_FILE), "utf8");
    const got = sentencesIn(liveSrc, laneFns);
    const unreg = got.filter((x) => declText.indexOf(x.text) < 0);
    chk(declText.length > 2000,
      "단언 21-c2 선언 텍스트 분모가 선다(" + declText.length + "자) — 분모가 비면 등재 검사가 공집합에서 통과한다", declText.length);
    chk(unreg.length === 0,
      "단언 21-c2 추적 · 재판정 지면의 **문장 전건이 선언 테이블에 등재**돼 있다 — 지면이 쓴 문장 " + got.length +
      "건 중 미등재 0건(짧은 라벨은 사정권이 아니다. 문장이어야 사유를 지어낸 것이 된다)", unreg);
    /* ── 양성 테스트 — 문장 1건을 심어 이 검사가 실제로 잡는지 본다 ── */
    const PLANT = "종합하면 이 조항은 보완만 하면 충족으로 읽힙니다.";
    const seeded = liveSrc.replace(
      '{p.ledgerNote}</div>',
      '{p.ledgerNote}</div>\n          <div className="v360li">' + PLANT + "</div>");
    const caught = sentencesIn(seeded, laneFns).filter((x) => declText.indexOf(x.text) < 0);
    chk(seeded !== liveSrc && caught.length === 1 && caught[0].text === PLANT,
      "단언 21-c2 **양성** — 지면에 문장 1건을 심으면 정확히 1건이 미등재로 잡힌다(검사가 살아 있다는 증거)",
      { seedApplied: seeded !== liveSrc, caught: caught.map((x) => x.text) });
    snap.laneSentences = { declared: got.length, unregistered: unreg.length, declBytes: declText.length,
      positiveCatch: caught.length };
  }
  chk((wiBody.match(/pgDecide\(/g) || []).length >= 3,
    "단언 21-i 재판정이 **같은 판정기를 다시 부른다**(별도 추정 로직이 아니다)", (wiBody.match(/pgDecide\(/g) || []).length);
  chk(!/\.submit\s*\[[^\]]*\]\s*=|\.submit\s*=\s*\{[^}]/.test(wiBody),
    "단언 21-i 재판정이 제출값을 **합성하지 않는다**(가정 레코드는 판정기가 만든다 · PG_WHATIF_FORBID.fieldValue)");

  /* ── 실측 — 경계 위쪽을 적재한 **별 세계**에서 돌린다(앞 단언들이 심은 저장값과 섞지 않는다) ── */
  const W5 = load([]);
  let calcBad = null;
  try { vm.runInContext(pre, W5.ctx, { filename: PG_CALC_FILE + "#calc" }); }
  catch (e) { calcBad = String(e.message).split("\n")[0]; }
  chk(W5.bad.length === 0 && calcBad === null, "단언 21-a 계산 레이어가 적재된다(번들 순서 · 전역 충돌 사고를 여기서 잡는다)", calcBad || W5.bad.slice(0, 3));

  if (!calcBad && !W5.bad.length) {

    /* ★ 단언 21-e — ①개요 머리의 **체계 소개 3문단**(정의 · 목적 · 성과)과 그 단서 줄(2026-10-26 신설).
       ★ 왜 신설하는가: 이 블록은 현대해상이 섹션에서 **가장 먼저 읽는 문단**인데, 종전에는 어느 러너도
         보지 않았다 — `grep "pgIntro|PG_INTRO|PartnerIntro" scripts/` 가 0 hit 였다. 기존 가드도 닿지
         않았다: run_wording_guard 검사 ⑳은 분모 라벨 선언만 보고, 단언 21-c2 의 사정권은
         PartnerGovReport.jsx 의 두 함수뿐이라 SupplyOntology.jsx 의 PartnerIntro 는 밖이었다. 그래서
         누가 문안에 수치를 박거나 슬롯이 조용히 비어도 전 게이트가 녹색이었다 — 이 저장소가 두 번
         적어 둔 「검사 밖에 남아 0건으로 조용히 통과」 형태다.
       ★ 네 가지를 센다. ⓐ슬롯 미충족 0 ⓑ선언 문안의 수치 리터럴 0 ⓒ슬롯 이름이 반환 필드에 전건
         존재 ⓓ소개 지면이 문장을 짓지 않음. ⓑ와 ⓓ는 **양성 테스트**를 함께 돌린다(0 = 0 금지). */
    {
      const I = W5.run(`
        const rows = pgIntro(), notes = pgIntroNotes(), F = pgIntroFacts();
        const keys = Object.keys(F).filter((k) => k.charAt(0) !== "_");
        const slot = [], lit = [];
        for (const t of [PG_INTRO, PG_INTRO_NOTE]) for (const r of t) {
          const raw = String(r.text || "");
          for (const m of (raw.match(/\{[^}]+\}/g) || [])) slot.push(m.slice(1, -1));
          const bare = raw.replace(/\{[^}]+\}/g, "");
          if (/[0-9]/.test(bare)) lit.push(r.k + " :: " + bare.replace(/[^0-9]/g, ""));
        }
        /* 양성 — 문안 사본에 수치 1자를 박아 같은 판정을 돌려 본다(검사가 살아 있다는 증거) */
        const seeded = String((PG_INTRO[0] || {}).text || "").replace(/\{[^}]+\}/g, "") + "7";
        return {
          rows: rows.map((r) => ({ k: r.k, filled: r.filled, missing: r.missing, chars: r.chars })),
          notes: notes.map((r) => ({ k: r.k, filled: r.filled, missing: r.missing, chars: r.chars })),
          unknownSlot: slot.filter((x, i) => slot.indexOf(x) === i).filter((x) => keys.indexOf(x) < 0),
          slotN: slot.length, lit: lit, litPositive: /[0-9]/.test(seeded),
        };
      `);
      const miss = I.rows.concat(I.notes).filter((r) => !r.filled);
      chk(miss.length === 0,
        "단언 21-e1 체계 소개 문단 · 단서 줄의 슬롯이 **전건 채워진다**(미충족 0 — 채우지 못한 자리는 「—」로 찍혀 수치가 조용히 사라진다)", miss);
      chk(I.rows.length >= 3 && I.notes.length >= 1,
        "단언 21-e1 소개 문단(정의 · 목적 · 성과)과 단서 줄이 **함께** 선다 — 단서를 지우면 문단만 읽은 독자가 모집단 · 보류 · 행 항등식을 반대로 읽는다",
        { rows: I.rows.length, notes: I.notes.length });
      chk(I.lit.length === 0 && I.litPositive === true,
        "단언 21-e2 소개 선언 문안에 **수치 리터럴 0건** — 모든 수치는 반환 필드 슬롯이다(양성 테스트 통과)", I.lit);
      chk(I.unknownSlot.length === 0 && I.slotN > 0,
        "단언 21-e3 소개 문안의 {슬롯} 이름이 pgIntroFacts() **반환 필드에 전건 존재**한다(" + I.slotN + "자리 — 이름을 늘리고 필드를 안 세우면 그 자리가 「—」로 찍힌다)", I.unknownSlot);
      /* ⓓ 소개 지면이 문장을 짓지 않는가 — 사정권을 SupplyOntology.jsx 의 PartnerIntro 로 넓힌다 */
      const INTRO_FILE = "src/components/SupplyOntology.jsx";
      const introSrc = fs.readFileSync(path.join(ROOT, INTRO_FILE), "utf8");
      const introGot = sentencesIn(introSrc, ["PartnerIntro"]);
      const introUnreg = introGot.filter((x) => declText.indexOf(x.text) < 0);
      chk(introUnreg.length === 0,
        "단언 21-e4 소개 지면(PartnerIntro)의 **문장 전건이 선언 테이블에 등재**돼 있다 — 지면이 쓴 문장 " +
        introGot.length + "건 중 미등재 0건", introUnreg);
      const PLANT2 = "이 체계는 협력업체의 준법을 보증합니다.";
      const seeded2 = introSrc.replace('<div className="pgintro3">',
        '<div className="pgintro3">\n        <div className="chnote">' + PLANT2 + "</div>");
      const caught2 = sentencesIn(seeded2, ["PartnerIntro"]).filter((x) => declText.indexOf(x.text) < 0);
      chk(seeded2 !== introSrc && caught2.length === 1 && caught2[0].text === PLANT2,
        "단언 21-e4 **양성** — 소개 지면에 문장 1건을 심으면 정확히 1건이 미등재로 잡힌다",
        { seedApplied: seeded2 !== introSrc, caught: caught2.map((x) => x.text) });
      snap.pgIntro = { paras: I.rows, notes: I.notes, slots: I.slotN, literals: I.lit.length,
        unknownSlots: I.unknownSlot.length, pageSentences: introGot.length, unregistered: introUnreg.length };
    }
    const M = W5.run(`
      const recs = pgPartnerRecs();
      const pid = recs[0].partnerId;
      const nm = recs[0].legalName;
      const V = pgVerdictRoll({ level: "L1", type: "PG-R", stage: "거래중" });
      const ids = Object.keys(V.byPolicy);
      const lanesDecl = (typeof PG_TRACE_LANES !== "undefined") ? PG_TRACE_LANES.length : 0;
      const o = { policyN: ids.length, partnerN: recs.length, lanesDecl: lanesDecl,
        laneBad: 0, laneNoBad: 0, countBad: 0, reasonDrift: 0, withUsed: 0, withUnused: 0,
        ledgerBad: 0, upRows: 0, axesBad: 0, nameInTrace: 0 };
      for (const id of ids) {
        const t = pgTrace(pid, id, "L1");
        if (!t) { o.laneBad++; continue; }
        if (t.lanes.length !== lanesDecl) o.laneBad++;
        if (t.lanes.map((l) => l.n).join(",") !== PG_TRACE_LANES.map((l) => l.n).join(",")) o.laneNoBad++;
        const c = t.lanes[0].pay.counts;
        if (c.all !== c.used + c.unused) o.countBad++;
        if (c.used > 0) o.withUsed++;
        if (c.unused > 0) o.withUnused++;
        if (JSON.stringify(t.lanes[2].pay.reasons) !== JSON.stringify(t.r.reasons)) o.reasonDrift++;
        const w = pgWhatIf(pid, id, "L1");
        if (!w.ledger.same) o.ledgerBad++;
        if (w.axes.length !== PG_WHATIF_AXES.length) o.axesBad++;
        for (const ax of w.axes) for (const rw of ax.rows) if (rw.up) o.upRows++;
      }
      /* 열람 등급 — 추적 · 재판정 두 경로가 같은 관문을 지나는가(값 기준이다. 필드 이름 목록은 지면이 보여야 한다) */
      const t3 = JSON.stringify(pgTrace(pid, "L-09", "L3"));
      const w3 = JSON.stringify(pgWhatIf(pid, "L-09", "L3"));
      o.clamp = { traceNoName: t3.indexOf(nm) < 0, whatIfNoName: w3.indexOf(nm) < 0,
        whatIfNoMoney: !/supplyPrice|marginNet|feePct|"credit"/.test(w3),
        dropN: pgTrace(pid, "L-09", "L3").clamp.n, cut: pgTrace(pid, "L-09", "L3").clamp.cut };
      /* 결정론 — 두 번 부른 결과가 같은가 */
      o.det = { trace: JSON.stringify(pgTrace(pid, "L-08", "L1")) === JSON.stringify(pgTrace(pid, "L-08", "L1")),
        whatIf: JSON.stringify(pgWhatIf(pid, "L-04", "L1")) === JSON.stringify(pgWhatIf(pid, "L-04", "L1")) };
      pgEngineRollReset();
      const e1 = JSON.stringify(pgEngineRoll({ level: "L1", stage: "거래중" }));
      pgEngineRollReset();
      const e2 = JSON.stringify(pgEngineRoll({ level: "L1", stage: "거래중" }));
      o.det.engine = e1 === e2;
      /* 엔진 지면 */
      const E = pgEngineRoll({ level: "L1", stage: "거래중" });
      let artBad = 0;
      for (const L of E.laws) for (const a of L.articles) if (a.verified !== "원문확인" && a.article) artBad++;
      o.engine = { blocks: E.blocks.length, declBlocks: PG_ENGINE_BLOCKS.length, laws: E.counts.laws,
        grid: E.grid.length, peps: E.pepRows.length, articleGate: artBad,
        audit: E.method.audit.length, auditWhy: E.method.audit.slice(0, 3),
        ruleN: E.method.ruleN, notYet: E.notYet.length, unverified: E.unverified.length };
      /* 양방향 — 조항 → 영향 협력업체 → 그 칸의 추적 */
      const aff = pgPolicyAffected(ids[0], V);
      o.link = { affected: aff.n, judged: aff.judged,
        back: !!(aff.rows[0] && pgTrace(aff.rows[0].partnerId, ids[0], "L1")) };
      /* 결정 로그 → 추적 — 로그를 **심어서** 본다(0건으로는 링크를 확인할 수 없다 · 양성 테스트) */
      pgBlockLog({ policyId: "L-04", pep: "pep.register", cause: "input_missing", partner: recs[0], level: "soft", ctx: { asOf: "2026-10-25" } });
      pgEngineRollReset();
      const E2 = pgEngineRoll({ level: "L1", stage: "거래중" });
      const lr = E2.log.rows[0] || null;
      o.log = lr ? { n: E2.log.n, traceable: lr.traceable, policyId: lr.policyId,
        opens: !!(lr.traceable && pgTrace(lr.src, lr.policyId, "L1")),
        noName: JSON.stringify(E2.log.rows).indexOf(nm) < 0 } : null;
      pgBlockClear(); pgEngineRollReset();
      return o;
    `);
    chk(M.lanesDecl === 5 && M.laneBad === 0 && M.laneNoBad === 0,
      "단언 21-b 추적 레인이 선언 수(5)만큼 전개되고 레인 번호가 선언과 같다 — 전 조항 " + M.policyN + "건", { decl: M.lanesDecl, laneBad: M.laneBad, noBad: M.laneNoBad });
    chk(M.reasonDrift === 0,
      "단언 21-c 레인 3의 사유가 판정기 반환 배열과 **글자 단위로 같다**(화면이 문장을 만들지 않는다)", M.reasonDrift);
    chk(M.countBad === 0 && M.withUnused > 0 && M.withUsed > 0,
      "단언 21-d 쓰인 입력과 **쓰이지 않은 입력**이 한 목록에 함께 실린다(쓴 것이 있는 조항 " + M.withUsed + " · 안 쓴 것이 있는 조항 " + M.withUnused + " — 양쪽 분모를 센다)",
      { countBad: M.countBad, withUsed: M.withUsed, withUnused: M.withUnused });
    chk(M.ledgerBad === 0 && M.axesBad === 0,
      "단언 21-e 재판정이 **원장을 바꾸지 않는다** — 전 조항 " + M.policyN + "건의 가정 전후 지문이 같다(가정 축 " + R.counts.whatIfAxes + "개)",
      { ledgerBad: M.ledgerBad, axesBad: M.axesBad });
    chk(M.upRows > 0,
      "단언 21-e 「무엇을 고치면 올라가는가」가 **공집합이 아니다**(등급이 올라가는 가정 행이 실재한다)", M.upRows);
    chk(M.det.trace && M.det.whatIf && M.det.engine,
      "단언 21-f 같은 입력이면 추적 · 재판정 · 엔진 집계가 **바이트 단위로 같다**", M.det);
    chk(M.clamp.traceNoName && M.clamp.whatIfNoName && M.clamp.whatIfNoMoney,
      "단언 21-g 추적과 재판정이 **같은 클램프 관문**을 지난다 — 운영 등급 이하 반환값에 상호 · 금액 0건(잘라낼 필드 " + M.clamp.dropN + "개 · 값 칸 " + M.clamp.cut + "개 삭제)", M.clamp);
    chk(M.link.affected > 0 && M.link.back,
      "단언 21-g 양방향 링크 — 조항에서 영향받는 협력업체로, 그 칸에서 추적으로 되돌아온다", M.link);
    chk(!!M.log && M.log.n === 1 && M.log.traceable && M.log.opens && M.log.noName,
      "단언 21-g 결정 로그 항목에서 그 판정의 추적이 열린다 — **양성 테스트**(1건을 심어 확인한다. 0 = 0 으로 통과하지 않는다) · 로그에 상호 0건", M.log);
    chk(M.engine.blocks === M.engine.declBlocks && M.engine.blocks === 7,
      "단언 21-h 정책 · 판정 엔진 지면이 선언된 7블록을 전건 들고 있다", { blocks: M.engine.blocks, decl: M.engine.declBlocks });
    chk(M.engine.audit === 0,
      "단언 21-h 엔진 지면 · 추적 규약 · 가정 축 선언 전수 검사 위반 0", M.engine.auditWhy);
    chk(M.engine.articleGate === 0,
      "단언 21-h 원문확인이 아닌 조문에 조문 번호가 실리지 않는다 — 시행일표 전수(법령 · 표준 " + M.engine.laws + "항목)", M.engine.articleGate);
    snap.p5b = { lanes: M.lanesDecl, policies: M.policyN, withUsed: M.withUsed, withUnused: M.withUnused,
      upRows: M.upRows, ledgerBad: M.ledgerBad, det: M.det, clampDrop: M.clamp.dropN, clampCut: M.clamp.cut,
      engineBlocks: M.engine.blocks, engineAudit: M.engine.audit, articleGate: M.engine.articleGate,
      ruleN: M.engine.ruleN, notYet: M.engine.notYet, unverified: M.engine.unverified,
      logLinked: !!(M.log && M.log.opens) };
  }
}

/* ════════ 단언 25 — 하이 4층 등록과 그 **역할 차단** (P7 산출물 ⑤⑥ · 지시서 §14-5 · 2026-10-26) ════════
   왜 신설인가: P7 산출물 ⑤「하이 4층 등록」과 ⑥「섹션 가이드의 ontology 항목 신설 여부 결정」이
   **한 바이트도 이행되지 않은 채** 배포 직전까지 왔고, 미이행 사실이 검증 보고에도 없었다. 실측:
   세 파일이 HEAD 그대로였고(`git status --porcelain` 빈 출력), 네 층 어디에도 협력업체 통제 어휘가
   0건이었다. 그런데 `agentNavIntent()` 에는 `if (g.k === "ontology" && authRole() !== "ADMIN") continue;`
   가 **살아 있었다** — 가드는 있는데 가드가 지킬 항목이 없는 **죽은 분기**였다. 제품 자신의 화면
   문구(「3층 등록 없이는 배포 불가」)를 어긴 상태였다.
   ★ 그리고 등재만으로는 안 된다 — Q&A 뱅크의 `lv` 는 **접근 제어에 쓰이지 않는다.** 실측으로
     확인했다: `adm` 플래그 없이 등재하니 회원 세션에서 「협력업체 내부통제 보고서 열어줘」가
     그대로 답했다(민감 질의 누출 3건). 그래서 **등재 + 역할 가드 + 금지 도구 부재**를 함께 센다.
   ★ 회원 차단의 **실측 소유자는 `run_persona_diff.mjs`** 다(민감 질의 20문항 × 두 채널). 여기서는
     그 러너가 그 축을 들고 있는지 **구조로** 확인하고 중복 배치하지 않는다. */
{
  const L_NATIVE = "src/data/aiNative.js";
  const L_QNA = "src/data/aiQnaBank.js";
  const L_NLU = "src/data/hiNluDict.js";
  const L_CORE = "src/data/hiNluCore.js";
  const L_PERSONA = "scripts/run_persona_diff.mjs";
  const rdf = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8"); } catch (e) { return null; } };
  const nat = rdf(L_NATIVE), qna = rdf(L_QNA), nlu = rdf(L_NLU), core = rdf(L_CORE), per = rdf(L_PERSONA);
  chk(!!(nat && qna && nlu && core && per), "단언 25-a0 4층 파일과 음성 테스트 러너를 전건 읽었다(분모)",
    { nat: !!nat, qna: !!qna, nlu: !!nlu, core: !!core, persona: !!per });

  if (nat && qna && nlu && core && per) {
    const natS = strip(nat), qnaS = strip(qna), nluS = strip(nlu), coreS = strip(core);
    /* ── ⓐ 섹션 가이드 층 — 죽은 ADMIN 가드에 실체를 준다 ── */
    const guardAlive = /g\.k === "ontology"[\s\S]{0,80}authRole\(\)[\s\S]{0,20}!== "ADMIN"/.test(natS);
    const guideRow = /\{\s*k:\s*"ontology",/.test(natS);
    chk(guardAlive && guideRow,
      "단언 25-a 섹션 가이드에 `k: \"ontology\"` 항목이 있고 그 항목을 지키는 ADMIN 가드가 살아 있다 — **가드만 있고 항목이 없으면 죽은 분기**다",
      { guard: guardAlive, row: guideRow });
    /* ── ⓑ 용어사전 층 ── */
    const lexWant = ["협력업체", "내부통제", "통제항목", "집행수준", "결함등급", "면제"];
    const lexMiss = lexWant.filter((w) => natS.indexOf('["' + w + '"') < 0);
    chk(lexMiss.length === 0,
      "단언 25-b 용어사전에 협력업체 통제 표준어 " + lexWant.length + "낱말이 등재돼 있다 — 미등재 0", lexMiss);
    /* ── ⓒ 도구 층 — **조회만**. 판정 실행 · 집행 등록 · 면제 승인은 등록하지 않는다 ── */
    const toolHave = ["pgrep", "pgart"].filter((t) => new RegExp("^\\s*" + t + "\\s*\\(", "m").test(natS));
    const toolForbid = ["pgdecide", "pgenforce", "pgexempt", "pgblock", "pgapprove"]
      .filter((t) => new RegExp("^\\s*" + t + "\\s*\\(", "mi").test(natS));
    chk(toolHave.length === 2 && toolForbid.length === 0,
      "단언 25-c 도구 층은 **조회 2개만**(" + toolHave.join(" · ") + ") 등록하고 판정 실행 · 집행 등록 · 면제 승인은 **0건**이다",
      { have: toolHave, forbidden: toolForbid });
    /* 도구 본문에 역할 차단이 있는가 — 「등재돼 있지 않다」로는 회원 경로를 막을 수 없다 */
    let toolGated = 0;
    for (const t of toolHave) {
      const a = natS.search(new RegExp("^\\s*" + t + "\\s*\\(", "m"));
      if (a < 0) continue;
      const body = natS.slice(a, a + 1200);
      if (/authRole\(\)\s*!==\s*"ADMIN"/.test(body)) toolGated += 1;
    }
    chk(toolGated === toolHave.length,
      "단언 25-c 조회 도구 전건이 **본문에서 역할을 막는다** — " + toolGated + " / " + toolHave.length +
      "(Q&A 뱅크의 난이도 표기는 접근 제어가 아니므로 코드로 막아야 한다)", { gated: toolGated, of: toolHave.length });
    /* ── ⓓ Q&A 층 + **별도 차단** ── */
    const qRows = [...qnaS.matchAll(/k:\s*"(pg_\w+)"/g)].map((m) => m[1]);
    const qGated = [...qnaS.matchAll(/k:\s*"(pg_\w+)",\s*adm:\s*true/g)].map((m) => m[1]);
    const qGate = /it\.adm\s*&&\s*!\(typeof authRole === "function" && authRole\(\) === "ADMIN"\)/.test(natS);
    chk(qRows.length >= 2 && qGated.length === qRows.length && qGate,
      "단언 25-d Q&A 층에 협력업체 통제 항목 " + qRows.length + "건이 등재되고 **전건이 `adm: true`** 이며 매칭기가 그 플래그를 막는다 — 난이도 표기는 접근 제어가 아니다",
      { rows: qRows, gated: qGated, matcherGate: qGate });
    /* 답변에 금액 · 원가 · 수수료율이 섞이지 않는가(하이 답변은 반출 경로가 아니다) */
    const qSeg = qnaS.slice(Math.max(0, qnaS.indexOf('k: "pg_report"') - 400), qnaS.indexOf('k: "pg_control"') + 1400);
    const qMoney = (qSeg.match(/원가율|공급가|매입가|수수료율|마진율|여신\s*한도/g) || []);
    chk(qMoney.length === 0, "단언 25-d 협력업체 통제 Q&A 답변에 원가 · 수수료율 · 여신이 0건이다", qMoney);
    /* ── ⓔ NLU 층 + 역할 필터 ── */
    const slotHave = ["pgov", "pgctl"].filter((k) => new RegExp("\\b" + k + ":\\s*\\{").test(nluS));
    const intentRow = /id:\s*"S9-PGOV-01"[\s\S]{0,400}?adm:\s*true/.test(nluS);
    const coreGate = /it\.adm\s*&&\s*!\(typeof isAdminRole === "function" && isAdminRole\(\)\)/.test(coreS);
    chk(slotHave.length === 2 && intentRow && coreGate,
      "단언 25-e NLU 층에 대상어 슬롯 2개와 **`adm: true` 인텐트**가 등재되고 분류기가 후보 단계에서 역할을 막는다",
      { slots: slotHave, intentAdm: intentRow, coreGate: coreGate });
    /* 짧은 동의어 금지 — 두 글자 동의어는 합성어를 깬다(이 저장소가 두 번 겪었다) */
    const shortSyn = [];
    for (const k of slotHave) {
      const a = nluS.search(new RegExp("\\b" + k + ":\\s*\\{"));
      const seg = nluS.slice(a, nluS.indexOf("}", a) + 1);
      /* 경계는 **세 글자**다 — 두 글자 한글 낱말(「통제」·「조항」·「면제」)이 합성어를 깨고 회원 지면의
         다른 낱말을 가로챈 사고가 이 저장소에 두 건 있다(「키」→「신장」 · 「사람」→「상담원」).
         세 글자 이상(「협력사」)은 그 사고 형태를 만들지 않는다 — 금지를 실제 위험에 맞춘다. */
      for (const m of seg.matchAll(/"([^"]+)"/g)) if (m[1].length > 0 && m[1].length < 3 && !/^(std|syn|typo)$/.test(m[1])) shortSyn.push(k + ":" + m[1]);
    }
    chk(shortSyn.length === 0,
      "단언 25-e 신설 슬롯에 **세 글자 미만 동의어 0건** — 두 글자 낱말은 합성어를 깨고 회원 지면의 다른 낱말을 가로챈다", shortSyn);
    /* ── ⓕ 선행 조건의 나머지 반쪽 — A3 지식층에서 거래 사실 데이터가 빠졌는가 ── */
    const reg = rdf("src/data/agentRegistry.js");
    const a3 = reg ? strip(reg) : "";
    const a3Idx = a3.indexOf('id: "A3"');
    const a3Seg = a3Idx >= 0 ? a3.slice(a3Idx, a3Idx + 2600) : "";
    const a3Know = /knowledge:\s*\[([^\]]*)\]/.exec(a3Seg);
    chk(!!a3Know && a3Know[1].indexOf("supplyData") < 0,
      "단언 25-f 회원 대면 에이전트의 지식층에 거래 사실 데이터가 **없다**(선행 조건의 나머지 반쪽) — 등재된 채로 두면 원가가 회원 상담 경로로 흘러나간다",
      a3Know ? a3Know[1].trim().slice(0, 160) : "knowledge 를 읽지 못했다");
    /* ── ⓖ 음성 테스트가 실재하고 그 축을 들고 있는가(실측 소유자는 그 러너다) ── */
    const perS = strip(per);
    const sensQ = (perS.match(/const SENS_QS = \[([\s\S]*?)\];/) || [])[1] || "";
    const sensN = (sensQ.match(/"/g) || []).length / 2;
    const bothCh = /__hifinAgent/.test(perS) && /__hifinDoc/.test(perS);
    const denomGate = /sensAsked === 0/.test(perS);
    const exitGate = /sUniq\.length\)\s*\{[\s\S]{0,200}process\.exit\(1\)/.test(perS);
    chk(sensN >= 8 && bothCh && denomGate && exitGate,
      "단언 25-g 민감 질의 음성 테스트가 실재한다 — 질의 " + sensN + "문항 · **두 채널**(하이 독 · 주치의) · 분모 0 실패 게이트 · 누출 시 종료코드 1",
      { questions: sensN, bothChannels: bothCh, denomGate: denomGate, exitGate: exitGate });
    snap.hiLayers = { secGuide: guideRow, guardAlive: guardAlive, lexicon: lexWant.length - lexMiss.length,
      tools: toolHave, toolsGated: toolGated, toolsForbidden: toolForbid.length,
      qna: qRows.length, qnaGated: qGated.length, nluSlots: slotHave.length, nluIntentAdm: intentRow,
      coreGate: coreGate, sensQuestions: sensN };
  }
}

/* ════════ 단언 24 — 열람 등급 클램프 · 롤업 단일 원천 · 반출 축 · 원장 지문 (2026-10-26 적대적 심사 반영) ════════
   왜 신설인가 — 네 자리에 **검사 소유자가 없었다.**
     ⓐ `pgFieldClamp(rec, "L3")` 를 **직접 부르는** 단언이 0건이었다(러너 전체에서 그 함수 grep 0건).
        대신 서 있던 검사는 `pgWhatIf()` 반환 JSON 에 하드코딩된 4개 이름이 나타나는지만 봤고, 금액 축
        선언(PG_CLAMP_AXIS_L3)에 걸리는 할당표 필드 **14개 중 3개**만 잡았다. 애블레이션으로 실증됐다 —
        축 상수를 ["cost","credit"] 로 줄여 소명면이 매출 · 마진 · 수수료율 · 미지급을 보게 만들어도
        세 러너가 전부 exit 0 이었다. 소명면이 열리는 순간 「원가 · 수수료율은 협력업체에 보이지 않는다」를
        지키는 코드 소유자가 아무도 없는 상태였다.
     ⓑ `pgVendorRoll` 을 부르는 러너 자리가 0건이었다. 구현은 맞게 돼 있었지만(모달이 롤업 소비자),
        누군가 모달에 합산 한 줄을 되살리면 「같은 거래처 매출이 두 값」이 조용히 재발하고 전 러너가
        녹색으로 떴다 — 지시서가 **이름을 들어** 검증 항목으로 명시한 자리다.
     ⓒ 반출물에 **판정 대상 열이 없어** 당사 축 조항의 불허가 실명 법인의 식별자와 같은 행으로 나갔다.
     ⓓ 원장 지문 8축에 **저장 집행 테이블**이 없어 저장소에 써도 「원장 불변」이 참으로 남았다.
   ★ 축 상수를 러너에 **복제하지 않는다** — 선언 테이블과 clampDrop() 에서 읽는다. 복제하면 소유자가
     둘이 되고, 한쪽만 고쳐지는 순간 금지가 검출되지 않는 금지로 남는다. */
{
  const jsx24 = fs.readFileSync(path.join(ROOT, PG_CALC_FILE), "utf8");
  const mi24 = jsx24.indexOf(PG_CALC_MARK);
  const pre24 = mi24 < 0 ? "" : jsx24.slice(0, jsx24.lastIndexOf("/*", mi24));
  const W7 = load([]);
  let bad24 = null;
  try { vm.runInContext(pre24, W7.ctx, { filename: PG_CALC_FILE + "#calc24" }); }
  catch (e) { bad24 = String(e.message).split("\n")[0]; }
  chk(W7.bad.length === 0 && bad24 === null, "단언 24-a 계산 레이어 적재(분모)", bad24 || W7.bad.slice(0, 3));

  if (!bad24 && !W7.bad.length) {
    const C = W7.run(`
      const R = __hifinPGReport();
      const moneyFields = PG_SOURCE_MAP.filter((f) => PG_CLAMP_AXIS_L3.indexOf(f.axis) >= 0).map((f) => f.obj + "." + f.k);
      const idFields = PG_SOURCE_MAP.filter((f) => f.axis === "id" || f.axis === "name").map((f) => f.obj + "." + f.k);
      const flat = (o, pre) => { let a = []; if (!o || typeof o !== "object") return a;
        for (const k of Object.keys(o)) { const v = o[k]; const q = pre ? pre + "." + k : k;
          if (v && typeof v === "object" && !Array.isArray(v)) a = a.concat(flat(v, q)); else a.push(q); } return a; };
      const rec = pgPartnerRecs()[0];
      const out = { moneyN: moneyFields.length, idN: idFields.length, axisN: PG_CLAMP_AXIS_L3.length,
        dropL3: R.clampDrop("L3"), dropL4: R.clampDrop("L4"), dropL2: R.clampDrop("L2") };
      for (const lv of ["L2", "L3", "L4"]) {
        const got = R.fieldClamp(rec, lv);
        const paths = flat(got, "");
        const drop = R.clampDrop(lv);
        out[lv] = { left: drop.filter((d) => paths.indexOf(d) >= 0), dropN: drop.length,
          declared: (got._clamp && got._clamp.dropped) ? got._clamp.dropped.length : null };
      }
      out.l3MoneyCut = moneyFields.filter((f) => out.dropL3.indexOf(f) >= 0).length;
      out.l4IdCut = idFields.filter((f) => out.dropL4.indexOf(f) >= 0).length;
      const roll = pgRollup();
      let vdiff = 0, vmax = 0, vn = 0; const vbad = [];
      for (const r of pgPartnerRecs()) {
        const VR = pgVendorRoll(r.partnerId);
        const cell = VR && VR.cell ? VR.cell : null;
        const base = roll.byVendor[r.partnerId] || null;
        if (!cell || !base) continue;
        vn += 1;
        for (const k of ["sales", "supplyCost", "fee", "marginNet", "orders"]) {
          const d = Math.abs((cell[k] || 0) - (base[k] || 0));
          if (d > 0) { vdiff += 1; if (d > vmax) vmax = d; if (vbad.length < 3) vbad.push({ id: r.partnerId, k: k, d: d }); }
        }
      }
      out.vendorRoll = { n: vn, diff: vdiff, max: vmax, bad: vbad,
        sumCell: pgPartnerRecs().reduce((a, r) => { const VR = pgVendorRoll(r.partnerId); return a + ((VR && VR.cell) ? VR.cell.sales : 0); }, 0),
        rollTotal: roll.total.sales };
      const V = pgVerdictRoll({ level: "L1", type: "PG-R", stage: "거래중" });
      const plan = pgExportPlan(V);
      const cols = plan.cols.map((c) => c.k);
      const selfRows = plan.rows.filter((r) => r.axis === "ⓠ당사");
      const nm = pgPartnerRecs()[0].legalName;
      out.exp = { cols: cols, hasAxis: cols.indexOf("axis") >= 0, n: plan.n,
        selfN: selfRows.length, selfPolicies: selfRows.map((r) => r.policyId),
        selfWithId: selfRows.filter((r) => r.partnerId !== "당사" || r.dispName !== "당사").length,
        selfDeny: selfRows.filter((r) => r.decision === "DENY").length };
      const built = pgExportBuild(plan.rows, plan.meta, "tsv");
      const lines = built.text.split("\\n");
      const selfPolSet = {}; for (const r of selfRows) selfPolSet[r.policyId] = 1;
      out.exp.mixedLines = lines.filter((L) => Object.keys(selfPolSet).some((pid) => L.indexOf(pid) >= 0) && L.indexOf(nm) >= 0).length;
      out.exp.headHasAxis = built.cols.indexOf("판정 대상") >= 0;
      const ln0 = V.byPartner[0];
      out.row = { comply: ln0.comply, complyAll: ln0.complyAll,
        selfCells: Object.keys(ln0.selfCells).length, partnerCells: Object.keys(ln0.partnerCells).length,
        selfPolN: V.selfAxis.policyN };
      const id0 = pgPartnerRecs()[0].partnerId;
      const w0 = pgWhatIf(id0, "L-04", "L1");
      pgEnforceStore({ "L-04": { "pep.settle": "hard" } });
      const w1 = pgWhatIf(id0, "L-04", "L1");
      out.ledger = { keys: w0.ledger.keys, sameBefore: w0.ledger.same, sameAfter: w1.ledger.same,
        fpMoved: JSON.stringify(w0.ledger.after) !== JSON.stringify(w1.ledger.after),
        storedLen: JSON.stringify(pgEnforceStored()).length };
      pgEnforceStore({});
      return out;
    `);
    chk(C.L2.left.length === 0 && C.L3.left.length === 0 && C.L4.left.length === 0,
      "단언 24-b `pgFieldClamp(rec, 등급)` 을 **직접 불러** 반환 레코드를 전수 평탄화했다 — 잘라낼 경로가 남아 있는 건수 0(L2 " +
      C.L2.dropN + " · L3 " + C.L3.dropN + " · L4 " + C.L4.dropN + "개)",
      { L2: C.L2.left, L3: C.L3.left, L4: C.L4.left });
    chk(C.l3MoneyCut === C.moneyN && C.moneyN > 0,
      "단언 24-b 소명면 이하에서 **할당표의 금액 축 필드 전건**이 잘린다 — 금액 축 " + C.moneyN + "개 = 잘린 수 " + C.l3MoneyCut,
      { moneyFieldN: C.moneyN, cut: C.l3MoneyCut, axisN: C.axisN });
    /* ★ **하한(ratchet)** — 위 단언만으로는 축 상수를 줄이는 사고를 잡지 못한다. 분자와 분모가 **같은
       상수에서** 나오므로 축을 줄이면 둘이 함께 줄어 `14 === 14` 에서 `3 === 3` 으로 **조용히** 옮겨
       간다(애블레이션으로 실증했다: 축을 ["cost","credit"] 로 줄여도 전 러너가 exit 0 이었다).
       그래서 **독립 하한**을 둔다 — 2026-10-26 실측값이고 **더 엄격한 쪽으로만** 움직인다.
       이 수를 내리려면 러너를 고치는 커밋이 필요하고, 그 커밋은 눈에 보인다. 이 러너가 표시명 모드
       하한(단언 16-i2)에서 이미 쓰는 패턴과 **같은 형태**다. */
    const L3_MONEY_FLOOR = 14, L3_AXIS_FLOOR = 5, L4_ID_FLOOR = 13;
    chk(C.moneyN >= L3_MONEY_FLOOR && C.axisN >= L3_AXIS_FLOOR && C.idN >= L4_ID_FLOOR,
      "단언 24-b **하한** — 금액 축 필드 " + C.moneyN + " ≥ " + L3_MONEY_FLOOR + " · 금액 축 이름 " + C.axisN + " ≥ " + L3_AXIS_FLOOR +
      " · 식별 축 필드 " + C.idN + " ≥ " + L4_ID_FLOOR + "(축 상수를 줄여 소명면이 매출 · 마진 · 수수료율 · 미지급을 보게 만드는 사고를 여기서 잡는다)",
      { moneyN: C.moneyN, axisN: C.axisN, idN: C.idN,
        floors: { money: L3_MONEY_FLOOR, axis: L3_AXIS_FLOOR, id: L4_ID_FLOOR } });
    chk(C.l4IdCut === C.idN && C.idN > 0,
      "단언 24-b 대외 등급에서 **할당표의 식별 · 표시명 축 필드 전건**이 잘린다 — 식별 축 " + C.idN + "개 = 잘린 수 " + C.l4IdCut,
      { idFieldN: C.idN, cut: C.l4IdCut });
    chk(C.vendorRoll.n > 100 && C.vendorRoll.diff === 0 && C.vendorRoll.sumCell === C.vendorRoll.rollTotal,
      "단언 24-c 거래처 360° 뷰와 보고서 롤업이 **같은 거래처에 같은 값**을 낸다 — 거래처 " + C.vendorRoll.n +
      "곳 × 5지표에서 차 0원 · 칸 합 = 전사 합(두 값 0건)",
      { n: C.vendorRoll.n, diff: C.vendorRoll.diff, max: C.vendorRoll.max, bad: C.vendorRoll.bad,
        sumCell: C.vendorRoll.sumCell, rollTotal: C.vendorRoll.rollTotal });
    {
      const so = fs.readFileSync(path.join(ROOT, "src/components/SupplyOntology.jsx"), "utf8");
      const a = so.indexOf("function Vendor360");
      const b = so.indexOf("\nfunction ", a + 10);
      const body = strip(so.slice(a, b < 0 ? so.length : b));
      const arith = (body.match(/\.reduce\(/g) || []).length
        + (body.match(/(sales|margin|fee|supplyCost|amount|settle)\w*\s*\+=/gi) || []).length
        + (body.match(/\.filter\([^)]*\)\.length\s*\*\s*/g) || []).length;
      chk(arith === 0,
        "단언 24-c 거래처 360° 뷰 본문에 **지표 산술 0건** — 모달은 롤업을 읽는 소비자다(여기에 합산 한 줄이 되살아나면 두 값이 선다)", arith);
    }
    chk(C.exp.hasAxis && C.exp.headHasAxis,
      "단언 24-d 반출 열에 **판정 대상** 열이 있다 — 열 구성 " + C.exp.cols.join(" · "), C.exp.cols);
    chk(C.exp.selfWithId === 0 && C.exp.mixedLines === 0,
      "단언 24-d 반출 산출물에 당사 축 조항의 판정이 **실명 법인의 식별자 · 표시명과 같은 행에 실린 건수 0** — 당사 행 " +
      C.exp.selfN + "건(불허 " + C.exp.selfDeny + ") · 상호와 같은 줄 " + C.exp.mixedLines + "줄",
      { selfWithId: C.exp.selfWithId, mixedLines: C.exp.mixedLines, selfPolicies: C.exp.selfPolicies });
    chk(C.exp.selfN === C.row.selfPolN,
      "단언 24-d 당사 축 조항은 반출물에 **조항 1건당 1행**만 나간다 — 조항 " + C.row.selfPolN + "건 = 행 " + C.exp.selfN +
      "건(협력업체 루프 안에서 생성하면 조항 1건이 모집단만큼 복제된다)", { selfRows: C.exp.selfN, selfPolicies: C.row.selfPolN });
    chk(C.row.selfCells > 0 && C.row.partnerCells > 0 && C.row.comply.den !== C.row.complyAll.den,
      "단언 24-d 행 준수율 분모에 **당사 조항이 섞이지 않는다** — 협력업체 분모 " + C.row.comply.den + " vs 전체 분모 " +
      C.row.complyAll.den + "(두 값이 같으면 가름이 작동하지 않는 것이다) · 당사 칸 " + C.row.selfCells + "개는 별 띠로 렌더된다",
      { comply: C.row.comply, complyAll: C.row.complyAll, selfCells: C.row.selfCells });
    chk(C.ledger.keys.indexOf("enforceStoreFp") >= 0 && C.ledger.keys.indexOf("exemptStoreFp") >= 0,
      "단언 24-e 원장 지문 축에 **저장 집행 테이블 · 저장 면제** 지문이 들어 있다 — 축 " + C.ledger.keys.length + "개", C.ledger.keys);
    chk(C.ledger.sameBefore === true && C.ledger.fpMoved === true,
      "단언 24-e **저장소에 쓰면 지문이 움직인다(양성)** — 쓰기 전 지문 동일 · 쓰기 후 지문 이동 " + C.ledger.fpMoved +
      "(저장 집행 테이블은 다음 적재에서 효력을 갖는다. 이 축은 가정 금지 목록이 이름으로 지목한 축이다)",
      { sameBefore: C.ledger.sameBefore, moved: C.ledger.fpMoved, storedLen: C.ledger.storedLen });
    snap.p7fix = { clampDrop: { L2: C.L2.dropN, L3: C.L3.dropN, L4: C.L4.dropN },
      l3MoneyFields: C.moneyN, l4IdFields: C.idN, vendorRollN: C.vendorRoll.n, vendorRollDiff: C.vendorRoll.diff,
      exportCols: C.exp.cols.length, exportSelfRows: C.exp.selfN, exportMixedLines: C.exp.mixedLines,
      ledgerAxes: C.ledger.keys.length };
  }
}

/* ════════ 단언 22 — AI 거버넌스 축 (P6 · 지시서 §8 · §13-9) ════════
   ★ 왜 이 러너가 소유하는가: P6 의 산출물은 **선언과 그 선언의 실측**이고, 실측은 판정 집계
     (pgVerdictRoll)를 지나야 한다. 그 함수는 지면 파일의 계산 레이어에 있으므로 단언 21 과 같은
     경로로 경계 표식 위쪽을 적재한다. 그리고 점검 축의 분모 두 개(외부 생성형 AI 전송통제 7항목 ·
     거래 운영 에이전트 카드)는 **컴포넌트 파일의 선언부**에 있어 매니페스트 적재기가 읽지 못한다 —
     그 두 선언부만 잘라 **스텁 세계**에 올려 분모를 세운다. 분모 없이 「0건」을 보고하지 않는다.
   ★ 검사 소유자를 늘리지 않는다 — 고지 **애블레이션**(문안·렌더)은 run_wording_guard 검사 ⑯이
     소유하므로 여기서는 **자리 분모와 선언 구조**만 본다. 중복 배치하면 한쪽만 고쳐지는 순간
     금지가 검출되지 않는 금지로 남는다. */
{
  const AI_FILE = "src/data/partnerAI.js";
  const aiSrc = fs.readFileSync(path.join(ROOT, AI_FILE), "utf8");
  const aiS = strip(aiSrc);
  /* 22-a0 전제 — 매니페스트 등재 · 결정론 · 벽시계 0 (분모를 먼저 세운다) */
  chk(manifest.indexOf(AI_FILE) >= 0, "단언 22-a0 AI 거버넌스 선언 파일이 매니페스트에 등재돼 있다(등재되지 않으면 번들에 없고 검사는 파일만 읽는다)");
  const aiDet = { random: (aiS.match(/Math\.random/g) || []).length,
    date: (aiS.match(/new Date|Date\.now/g) || []).length,
    shuffle: (aiS.match(/sort\(\s*\(\s*\)\s*=>/g) || []).length };
  chk(aiDet.random === 0 && aiDet.date === 0 && aiDet.shuffle === 0,
    "단언 22-a0 선언 파일에 난수 · 벽시계 · 셔플 정렬 0건 — 같은 입력이면 같은 산출이다", aiDet);
  /* 조작 입구 — 집행 수준 변경 · 면제 등록 · 로그 삭제를 이 축이 부르지 않는다(관측이지 조작이 아니다) */
  const opIn = ["pgEnforceSet(", "pgExemptAdd(", "pgExemptRegister(", "pgBlockClear(", "pgAuditClear(", "pgEnforceStore("]
    .filter((c) => aiS.indexOf(c) >= 0);
  chk(opIn.length === 0, "단언 22-a0 AI 거버넌스 축이 조작 입구를 부르지 않는다 — 집행 수준 변경 · 면제 등록 · 로그 삭제 0건", opIn);

  /* ── 실측 세계 — 매니페스트 + 계산 레이어 + 컴포넌트 선언부(스텁) ── */
  const W6 = load([]);
  let w6bad = null;
  try {
    const jsx = fs.readFileSync(path.join(ROOT, PG_CALC_FILE), "utf8");
    const mi6 = jsx.indexOf(PG_CALC_MARK);
    vm.runInContext(jsx.slice(0, jsx.lastIndexOf("/*", mi6)), W6.ctx, { filename: PG_CALC_FILE + "#calc" });
  } catch (e) { w6bad = String(e.message).split("\n")[0]; }
  /* 컴포넌트 선언부 — 함수 선언 **앞까지**만 자른다(그 위는 순수 데이터다).
     아이콘 식별자는 번들에서 import 로 들어오므로 여기서는 없다 → ReferenceError 를 받아
     **그 이름만 선언하고 다시 돌린다**(상한이 있어 반드시 끝난다). 이름을 손으로 적지 않는 이유는
     아이콘이 바뀔 때 목록이 갈리기 때문이다. */
  const declPart = (file, firstFn) => {
    const t = fs.readFileSync(path.join(ROOT, file), "utf8");
    const i = t.indexOf("function " + firstFn);
    return i < 0 ? null : t.slice(0, i);
  };
  const stubLoad = (raw, file) => {
    /* ★ 최상위 const 를 var 로 바꿔 올린다 — 재시도 때문이다. 첫 시도가 선언 몇 개를 만든 뒤
       아이콘에서 멈추면, const 는 「이미 선언됨」으로 두 번째 시도를 막아 **스텁 복구가 불가능**해진다
       (실측으로 그렇게 막혔다). var 는 재선언이 무해하므로 루프가 수렴한다. */
    const code = raw.replace(/^const /gm, "var ").replace(/^let /gm, "var ");
    for (let n = 0; n < 60; n++) {
      try { vm.runInContext(code, W6.ctx, { filename: file + "#decl" }); return null; }
      catch (e) {
        const m = String(e.message).match(/(\w+) is not defined/);
        if (!m) return String(e.message).split("\n")[0];
        vm.runInContext("var " + m[1] + " = function(){ return null; };", W6.ctx);
      }
    }
    return "스텁 상한 초과";
  };
  const cmpDecl = declPart("src/components/Compliance.jsx", "ComplianceConsole");
  const supDecl = declPart("src/components/SupplyOntology.jsx", "SupplyGraph");
  let stubBad = null;
  if (cmpDecl == null || supDecl == null) stubBad = "선언부 경계를 찾지 못했다";
  else stubBad = stubLoad(cmpDecl, "Compliance.jsx") || stubLoad(supDecl, "SupplyOntology.jsx");
  /* 거래 운영 에이전트 액션 표는 첫 함수 **뒤**에 있다 — 그 블록만 따로 잘라 올린다 */
  if (!stubBad) {
    const sup = fs.readFileSync(path.join(ROOT, "src/components/SupplyOntology.jsx"), "utf8");
    const a = sup.indexOf("const SC_AGENT_ACTIONS");
    const b = sup.indexOf("function SupplyAgents");
    if (a < 0 || b < 0 || b < a) stubBad = "거래 운영 액션 표 경계를 찾지 못했다";
    else stubBad = stubLoad(sup.slice(a, b), "SupplyOntology.jsx#act");
  }
  chk(W6.bad.length === 0 && !w6bad && !stubBad,
    "단언 22-a 실측 세계 적재 — 매니페스트 + 계산 레이어 + 컴포넌트 선언부(분모 두 개가 실제로 선다)",
    w6bad || stubBad || W6.bad.slice(0, 3));

  if (W6.bad.length === 0 && !w6bad && !stubBad) {
    const M = W6.run(`
      const A = __hifinPGAI();
      const R = A.roll();
      const AG = A.agentRoll({});
      const SG = A.selfGov({});
      const out = {};
      out.audit = A.audit.length; out.auditWhy = A.audit.slice(0, 4);
      /* ── 점검 축 · 확인 등급 ── */
      out.axisDecl = A.counts.axes; out.axisRoll = R.axes.length;
      const vset = (typeof PG_AXES !== "undefined") ? PG_AXES.verified.map((x) => x[0]) : [];
      out.verifOutside = R.axes.filter((x) => vset.indexOf(x.verified) < 0).map((x) => x.id);
      out.verifMix = R.verifiedMix;
      /* 번호 게이트 — **양방향**. 현 상태 누출 0 + 등급을 내리면 번호가 사라진다 */
      let leak = 0;
      for (const ax of R.axes) for (const s of ax.std) if (s.numLabel && s.verified !== "원문확인") leak += 1;
      out.numLeak = leak; out.numHeld = R.numHeld; out.numShown = R.numShown;
      /* ★ 확인 등급의 **단위는 조문**이다. 항목 등급만 내리면 조문을 가진 법률은 꿈쩍하지 않고
         게이트가 「내려도 그대로」로 보인다(실측으로 2건이 남았다). 두 층을 함께 내린다. */
      const bk = {}, bka = {};
      for (const id of Object.keys(PG_LAWS)) {
        const L = PG_LAWS[id];
        if (L.verified) { bk[id] = L.verified; L.verified = "부분확인"; }
        if (L.articles) for (const k of Object.keys(L.articles)) { bka[id + "|" + k] = L.articles[k].verified; L.articles[k].verified = "부분확인"; }
      }
      A.rollReset();
      const low = A.roll();
      out.numShownLowered = low.numShown;
      out.articleShownLowered = low.articleShown;
      for (const id of Object.keys(bk)) PG_LAWS[id].verified = bk[id];
      for (const k of Object.keys(bka)) { const p = k.split("|"); PG_LAWS[p[0]].articles[p[1]].verified = bka[k]; }
      A.rollReset();
      const back = A.roll();
      out.numShownRestored = back.numShown;
      /* ── 표준 매핑표 — 단일 항목 규약 ── */
      out.stdN = R.stdN;
      out.stdNotFound = R.std.filter((x) => !x.found).map((x) => x.lawId);
      const nm = {}, dupName = [], dupId = {}, dupIdHit = [];
      for (const x of R.std) { if (nm[x.name]) dupName.push(x.name); nm[x.name] = 1; if (dupId[x.lawId]) dupIdHit.push(x.lawId); dupId[x.lawId] = 1; }
      out.dupName = dupName; out.dupId = dupIdHit;
      out.stdArticleShown = R.articleShown; out.stdArticleAll = R.articleAll;
      out.stdNumInStd = R.std.filter((x) => ["표준", "규정", "문헌"].indexOf(x.basis) >= 0 && x.article).map((x) => x.lawId);
      out.selfN = R.selfN;
      /* ── 증거 — 사전 밖 키 0 · 양쪽 분모 ── */
      const keys = (typeof PG_FIELD_KEYS !== "undefined") ? PG_FIELD_KEYS.map((k) => String(k).replace(/\\[\\]$/, "")) : [];
      const outside = [];
      let withEv = 0, withGap = 0;
      for (const ax of R.axes) {
        if (ax.evidenceDeclared) withEv += 1; else withGap += 1;
        for (const e of ax.evidence) if (keys.indexOf(String(e.k).replace(/\\[\\]$/, "")) < 0) outside.push(ax.id + "/" + e.k);
      }
      out.evOutside = outside; out.withEv = withEv; out.withGap = withGap;
      out.gapNoReason = R.axes.filter((x) => !x.evidenceDeclared && !x.gap).map((x) => x.id);
      out.ctrlN = R.ctrlN;
      out.submit = R.submit;
      /* ── 자기 거버넌스 — 전건 실측 ── */
      out.govN = SG.govN; out.measured = SG.measured; out.okN = SG.okN; out.lawBacked = SG.lawBacked;
      /* ★ 제3값 — 모집단 0인 항목은 「미계측」이고 **충족 분자에서 빠진다**(2026-10-26) */
      out.unmeasured = SG.unmeasured; out.unmeasuredIds = SG.unmeasuredIds || [];
      out.stateLine = SG.stateLine || null;
      out.popMissing = SG.rows.filter((g) => g.popRequired && (g.pop === null || g.pop === undefined)).map((g) => g.id);
      out.zeroPopOk = SG.rows.filter((g) => g.pop === 0 && g.state === "충족").map((g) => g.id);
      out.noProbe = SG.rows.filter((g) => !g.probe).map((g) => g.id);
      out.notOk = SG.rows.filter((g) => g.state === "미충족").map((g) => g.id);
      out.noFrom = SG.rows.filter((g) => g.probe && !g.probe.from).map((g) => g.id);
      out.noticeByG = { "G-08": SG.rows.filter((g) => g.id === "G-08")[0].notice.length,
                        "G-09": SG.rows.filter((g) => g.id === "G-09")[0].notice.length };
      out.noticeEmpty = SG.rows.reduce((a, g) => a + g.notice.filter((n) => !n.text).length, 0);
      /* ── 에이전트 — 새 에이전트 0 · 기준 명단 드리프트 0 ── */
      out.agentN = AG.agentN; out.baseFound = AG.agents.filter((g) => g.baseFound).length;
      const g05 = SG.rows.filter((g) => g.id === "G-05")[0].probe.measured;
      out.g05 = g05;
      out.ownsGrew = AG.agents.filter((g) => g.owns.length > g.ownsBase.length).length;
      out.kpiGrew = AG.agents.filter((g) => g.kpi.length > g.kpiBase.length).length;
      /* ── 출력 숫자 — 틀에 숫자 0 + 슬롯 값이 판정 집계와 **같은 값**인가(교차 대조) ── */
      const V = pgVerdictRoll({ asOf: A.roll().asOf, level: "L1", stage: "거래중" });
      const Rp = pgRollup();
      const truth = {
        "rollup:meta.partnerN": Rp.meta.partnerN,
        "policy:PG_POLICIES.length": PG_POLICIES.length,
        "pgDecide:partnerCounts.DENY": V.partnerCounts.DENY,
        "pgDecide:partnerCounts.INDETERMINATE": V.partnerCounts.INDETERMINATE,
        "pgDecide:selfAxis.byDecision.DENY": V.selfAxis.byDecision.DENY,
        "pgDecide:unverified.length": V.unverified.length,
        "pgDecide:notYet.length": V.notYet.length,
        "pgDecide:defect.partnerAxis": V.defect.partnerAxis["치명"],
        "spec:PG_EXPORT_HEAD.length": PG_EXPORT_HEAD.length,
        "log:pgActionStats.noDefense": pgActionStats().noDefense,
      };
      const drift = [], unchecked = [];
      let slots = 0, digits = 0;
      for (const act of A.actions) {
        digits += (String(act.template).match(/[0-9]/g) || []).length;
        const row = AG.agents.filter((g) => g.id === act.agent)[0].actions.filter((x) => x.id === act.id)[0];
        for (const s of row.slots) {
          slots += 1;
          if (!(s.from in truth)) { unchecked.push(act.id + "/" + s.from); continue; }
          if (truth[s.from] !== s.value) drift.push(act.id + "/" + s.from + " 기대 " + truth[s.from] + " 실제 " + s.value);
        }
        /* 조립된 문장이 **틀 + 슬롯값과 정확히 같은가**. 값을 하나씩 지워 세는 방식은 순서에 따라
           다른 값을 먹어 치운다(「20」을 지우기 전에 「0」을 지우면 「2」가 남아 거짓 위반이 됐다).
           재조립 일치는 순서와 무관하고, 슬롯 밖 숫자가 하나라도 들어가면 반드시 어긋난다. */
        let want = String(act.template);
        for (const s of row.slots) want = want.split("{" + s.slot + "}").join(String(s.value));
        if (want !== String(row.msg || "")) drift.push(act.id + " 출력이 틀 + 슬롯값과 다르다 — 화면 쪽에서 덧붙인 자리가 있다");
      }
      out.slots = slots; out.templateDigits = digits; out.numDrift = drift; out.numUnchecked = unchecked;
      /* ── 사람 승인 게이트 — 양성 · 음성 둘 다 ── */
      const hitl = A.actions.filter((a) => a.hitl);
      let ran = 0, held = 0, sysRej = 0, empHeld = 0;
      for (const a of hitl) {
        const r = A.run(a.agent, a.id, { dryRun: true });
        if (r.executed) ran += 1; else held += 1;
        if (!A.approve(r.ticket, "SYS-PGDECIDE", { dryRun: true }).ok) sysRej += 1;
        const ok = A.approve(r.ticket, "EMP0001", { dryRun: true });
        if (ok.ok && ok.executed === false) empHeld += 1;
      }
      out.hitl = { n: hitl.length, ranWithoutApproval: ran, held: held, sysRejected: sysRej, approvedButHeld: empHeld };
      out.mustEntry = A.hitl.must.filter((m) => m.entry).length;
      out.mustNoEntryNoWhy = A.hitl.must.filter((m) => !m.entry && !m.why).map((m) => m.what);
      out.never = A.hitl.never.length;
      /* ── 결정 로그 — 행위자 구분. **양성**(실제 1건) + **음성**(dryRun 은 0건) ── */
      const before = pgAuditAll().length;
      A.run("vrisk", "vr.suspend", { dryRun: true });
      A.approve({ action: "vr.suspend" }, "EMP0001", { dryRun: true });
      out.dryWrote = pgAuditAll().length - before;
      const r1 = A.run("vrisk", "vr.suspend", {});
      A.approve(r1.ticket, "EMP0001", {});
      const rows = pgAuditAll();
      out.logAdded = rows.length - before;
      const byKind = {};
      for (const x of rows) byKind[x.actorKind] = (byKind[x.actorKind] || 0) + 1;
      out.logByKind = byKind;
      out.logNoKind = rows.filter((x) => !x.actorKind).length;
      out.logNames = rows.filter((x) => /[가-힣]{2,}/.test(String(x.target))).length;
      /* ── 회원 경로 차단 ── */
      const g06 = SG.rows.filter((g) => g.id === "G-06")[0].probe.measured;
      out.g06 = { agents: g06.memberAgents.length, hits: g06.sensitiveHits.length };
      /* ── 결정론 ── */
      A.rollReset();
      const d1 = JSON.stringify(A.roll());
      A.rollReset();
      const d2 = JSON.stringify(A.roll());
      const s1 = JSON.stringify(A.selfGov({ dryRun: true }));
      const s2 = JSON.stringify(A.selfGov({ dryRun: true }));
      out.det = { roll: d1 === d2, selfGov: s1 === s2 };
      return out;
    `);

    chk(M.audit === 0, "단언 22-b AI 거버넌스 선언 전수 검사 위반 0 — 블록 · 수치 · 축 · 매핑 · 고지 · 액션 전건", M.auditWhy);
    chk(M.axisDecl === M.axisRoll && M.axisDecl === 7 && M.verifOutside.length === 0,
      "단언 22-c 협력업체 AI 점검 축이 선언 7축 전건 전개되고 **확인 등급이 용어 원천의 축 안에** 있다",
      { decl: M.axisDecl, roll: M.axisRoll, outside: M.verifOutside, mix: M.verifMix });
    chk(M.numLeak === 0 && M.numHeld > 0 && M.numShownLowered === 0 && M.numShownRestored === M.numShown,
      "단언 22-d 표준 번호 게이트 **양방향** — 현 상태 누출 0(번호 축 " + M.numHeld + "개 · 인쇄 " + M.numShown +
      ")이고 **확인 등급을 내리면 번호가 사라진다**(음성 " + M.numShownLowered + ") · 되돌리면 복귀",
      { leak: M.numLeak, held: M.numHeld, shown: M.numShown, lowered: M.numShownLowered, restored: M.numShownRestored });
    chk(M.stdNotFound.length === 0 && M.dupName.length === 0 && M.dupId.length === 0 && M.stdNumInStd.length === 0 && M.selfN > 0,
      "단언 22-e 표준 · 법령 매핑표가 **단일 항목 규약**을 지킨다 — 같은 법령명 2행 0 · 중복 키 0 · 레지스트리 밖 0 · 표준/규정/문헌에 조항 번호 0 · 우리도 수범자인 기준 " + M.selfN + "건",
      { notFound: M.stdNotFound, dupName: M.dupName, dupId: M.dupId, numInStd: M.stdNumInStd });
    chk(M.stdArticleShown < M.stdArticleAll && M.articleShownLowered === 0,
      "단언 22-e 조문 번호는 **게이트를 지난 것만** 인쇄된다 — " + M.stdArticleShown + " / " + M.stdArticleAll +
      " · 등급을 내리면 0으로 떨어진다(분모가 비지 않는다)",
      { shown: M.stdArticleShown, all: M.stdArticleAll, lowered: M.articleShownLowered });
    chk(M.evOutside.length === 0 && M.withEv > 0 && M.withGap > 0 && M.gapNoReason.length === 0,
      "단언 22-f 증거는 **제출 필드 사전 안의 키**만 쓰고(사전 밖 0), 사전 미등재 축은 발주 사유를 갖는다 — 증거 있는 축 " +
      M.withEv + " · 미등재 축 " + M.withGap + "(양쪽 분모가 선다)",
      { outside: M.evOutside, noReason: M.gapNoReason });
    chk(M.ctrlN === 7, "단언 22-f 외부 생성형 AI 전송통제 7항목을 **그대로 재사용**한다(복제 0 · 분모 7)", M.ctrlN);
    /* ★ 분모를 **「전건 실측」에서 「측정 + 미계측 = 전건」으로** 바꿨다(2026-10-26).
       왜: 종전 단언은 `measured === govN` 을 요구해서 **모집단이 0인 항목까지 측정으로 세게 강제**했다 —
       그래서 결정 로그가 0행인 G-03 이 「실측 충족」 녹색 배지를 달았고, 지면의 가장 인용하기 좋은 줄이
       「자기 거버넌스 9 / 9 실측 충족」이 됐다. 0 을 「문제 없음」으로 읽히게 두지 않는다는 그 항목
       자신의 note 와 배지가 어긋났다. 이제 ⓐ실측 경로 없는 항목 0 ⓑ미충족 0 ⓒ**모집단 0인데 충족인
       항목 0** ⓓ검증 기준이 로그 · 건수에 기대는 항목(popRequired)은 모집단을 **반드시 돌려준다**
       ⓔ측정 + 미계측 = 전건 을 함께 단언한다. */
    chk(M.govN === 9 && (M.measured + M.unmeasured) === M.govN && M.noProbe.length === 0
        && M.notOk.length === 0 && M.noFrom.length === 0 && M.lawBacked > 0
        && M.zeroPopOk.length === 0 && M.popMissing.length === 0,
      "단언 22-g 자기 거버넌스 9항목 — 측정 " + M.measured + " · 미계측 " + M.unmeasured +
      " (합 = 전건) · 실측 경로 없는 항목 0 · 미충족 0 · **모집단 0인데 충족인 항목 0** · 모집단 축 미선언 0 · 법정 의무 " + M.lawBacked + "건",
      { govN: M.govN, measured: M.measured, unmeasured: M.unmeasured, unmeasuredIds: M.unmeasuredIds,
        noProbe: M.noProbe, notOk: M.notOk, noFrom: M.noFrom, zeroPopOk: M.zeroPopOk, popMissing: M.popMissing });
    chk(M.unmeasured > 0,
      "단언 22-g 제3값이 **실제로 쓰인다** — 미계측 항목 " + M.unmeasured + "건(" + M.unmeasuredIds.join(" · ") +
      "). 0 이면 세 값 체계가 두 값과 구별되지 않아 검사가 공집합에서 통과한다", M.unmeasured);
    chk(M.noticeByG["G-08"] >= 2 && M.noticeByG["G-09"] >= 2 && M.noticeEmpty === 0,
      "단언 22-g 고지 자리 분모 — 항목별 2곳 이상이고 빈 문안 0(**애블레이션의 소유자는 run_wording_guard 검사 ⑯**이고 여기서는 분모만 센다)",
      { byG: M.noticeByG, empty: M.noticeEmpty });
    chk(M.agentN === 2 && M.baseFound === 2 && M.g05.newAgents === 0 && M.g05.outsideBase.length === 0 &&
        (!M.g05.scDrift || !M.g05.scDrift.length) && (!M.g05.hiDrift || !M.g05.hiDrift.length) &&
        M.ownsGrew === 2 && M.kpiGrew === 2,
      "단언 22-h **새 에이전트 0건** — 기존 두 에이전트의 소관 · 지표 · 가드만 넓혔고 기준 명단 드리프트 0",
      { agentN: M.agentN, baseFound: M.baseFound, g05: M.g05, ownsGrew: M.ownsGrew, kpiGrew: M.kpiGrew });
    chk(M.templateDigits === 0 && M.slots > 0 && M.numDrift.length === 0 && M.numUnchecked.length === 0,
      "단언 22-i 에이전트 출력에 **판정기 반환값 밖 숫자 0건** — 문안 틀의 숫자 0 · 슬롯 " + M.slots +
      "개가 판정 집계와 글자 단위로 같고 · 조립된 문장에 슬롯 밖 숫자 0",
      { digits: M.templateDigits, slots: M.slots, drift: M.numDrift.slice(0, 4), unchecked: M.numUnchecked });
    chk(M.hitl.ranWithoutApproval === 0 && M.hitl.held === M.hitl.n && M.hitl.n > 0 &&
        M.hitl.sysRejected === M.hitl.n && M.hitl.approvedButHeld === M.hitl.n &&
        M.mustEntry > 0 && M.mustNoEntryNoWhy.length === 0 && M.never > 0,
      "단언 22-j 사람 승인 게이트 — 승인 없이 실행 0건(" + M.hitl.n + "건 전건 보류) · **판정기를 승인자로 넣으면 거부** · " +
      "승인해도 실행되지 않음 · 승인 필수 축의 입구 분모 " + M.mustEntry + "건 · 입구 없는 축에 사유 전건",
      { hitl: M.hitl, mustEntry: M.mustEntry, noWhy: M.mustNoEntryNoWhy });
    chk(M.dryWrote === 0 && M.logAdded === 2 && M.logByKind.SYS > 0 && M.logByKind.EMP > 0 && M.logNoKind === 0 && M.logNames === 0,
      "단언 22-k 결정 로그가 **사람 승인과 시스템 판정을 가른다** — 양성(실제 호출 2건: 판정기 1 · 임직원 1) · " +
      "음성(검증 호출은 0건을 남긴다 — 검사가 자기 기록을 만들지 않는다) · 행위자 유형 없는 행 0 · 로그에 이름 0",
      { dryWrote: M.dryWrote, added: M.logAdded, byKind: M.logByKind, noKind: M.logNoKind, names: M.logNames });
    chk(M.g06.agents > 0 && M.g06.hits === 0,
      "단언 22-l 회원 대면 경로 차단 — 회원 에이전트 " + M.g06.agents + "종(분모)의 지식층 · 질의 축에 거래 · 통제 · 원가 원천 0건",
      M.g06);
    chk(M.det.roll && M.det.selfGov,
      "단언 22-m 같은 입력이면 점검 축 집계와 자기 거버넌스 실측이 **바이트 단위로 같다**", M.det);

    snap.p6 = { axes: M.axisDecl, verifiedMix: M.verifMix, numHeld: M.numHeld, numShown: M.numShown,
      numShownLowered: M.numShownLowered, std: M.stdN, selfStd: M.selfN,
      articleShown: M.stdArticleShown, articleAll: M.stdArticleAll,
      evidenceAxes: M.withEv, gapAxes: M.withGap, ctrl: M.ctrlN, submitAbsent: M.submit.absent,
      gov: M.govN, govMeasured: M.measured, govOk: M.okN, govUnmeasured: M.unmeasured, govLawBacked: M.lawBacked,
      agents: M.agentN, actions: M.slots && 0 || 4, hitl: M.hitl.n, slots: M.slots,
      logByKind: M.logByKind, det: M.det.roll && M.det.selfGov, audit: M.audit };
  }
}

/* ════════ 단언 23 — 반출 플러밍 (P7 · 지시서 §13-10 산출물 ①⑦ · §10-6 ①②③ · §4-6-3 ⓐⓑ) ════════
   ★ 이 단언이 지키는 것은 「고지 문구가 **있다**」가 아니라 **「산출물에 고지가 따라 나간다」**다.
     렌더 기준으로 검사하면 통과한다 — 복사 예외 판정이 선택 범위를 보지 않으면 표 행만 끌어서
     복사했을 때 첫 줄 고지 없이 나가기 때문이고(§15-9 ★), 지시서가 애블레이션 기준을 「클립보드
     산출물 · 파일 산출물」로 못 박은 이유가 그것이다. 그래서 여기서는 **핸들러를 실제로 걸고
     이벤트를 발생시켜** 클립보드에 들어가는 문자열을 본다.
   ★ 검사 소유자: 문안의 **등재 · 단일 원천 · 정적 애블레이션**은 run_wording_guard 검사 ⑰가 소유하고,
     여기서는 **산출 경로의 실측**만 본다(두 러너의 대상이 다르다 — §15-1 규약 ③과 같은 가르기). */
{
  /* 보호 유틸의 리스너를 받을 수 있는 세계 — 기본 적재기의 document 는 리스너 축이 없다.
     ⚠ 앞 단언들이 심은 저장값과 섞지 않기 위해 **별 세계**를 쓴다. */
  const W7 = load([]);
  const LIS = {};
  W7.ctx.document.addEventListener = (t, fn) => { (LIS[t] = LIS[t] || []).push(fn); };
  W7.ctx.document.removeEventListener = () => {};
  W7.ctx.document.getElementById = () => null;
  W7.ctx.document.createElement = () => ({ style: {}, setAttribute() {}, remove() {} });
  W7.ctx.document.body.classList = { toggle() {} };
  const E7 = W7.run("return __hifinPGEnforce();");
  const T7 = W7.run("return __hifinPGTerms();");
  const clearLog = () => W7.run("try { localStorage.removeItem('hifin_access_log'); } catch (e) {} return 1;");
  const logs = () => W7.run("return guardLogs();");

  /* ── 분모 — 고지가 따라가야 하는 자리 · 로그 사건 축 · 클래스 이름의 원천 ── */
  const AT = E7.exportNoticeAt || [];
  chk(AT.length === 3 && AT.map((a) => a.at).join(",") === "tsv,doc,clip" && AT.every((a) => a.by && a.rule),
    "단언 23-a0 반출 고지가 따라가야 하는 자리 **3곳이 선언**돼 있다(자리를 세지 않으면 「고지 0건」과 「자리 0개」가 구별되지 않는다)",
    AT.map((a) => a.at));
  chk(!!E7.exportClass && E7.exportClass === T7.exportNotice.cls,
    "단언 23-a0 반출 클래스 이름의 **원천이 하나**다(지면과 보호 예외가 같은 상수를 읽는다)", E7.exportClass);
  const EV = E7.exportLogEv || {};
  chk(EV.tsv === "export" && EV.doc === "print" && EV.clip === "export",
    "단언 23-a0 반출 경로별 열람 기록 사건이 **보호 유틸의 기존 사건 축**이다(새 사건 이름을 만들면 접속 로그 통계의 어느 칸에도 안 들어간다)", EV);

  /* ── 행 — 모드 양방향 단언과 같은 방식으로 **거래 사실 레이어에서** 만든다 ── */
  const vs7 = W7.run("const D = supplyData(); return D.vendors.slice(0, 6).map((v) => ({ id: v.id, name: v.name }));");
  const rows7 = vs7.map((v) => E7.exportRow({ partnerId: v.id, legalName: v.name, kind: "PT-COM" },
    { policyId: BASIS_ID, decision: "INDETERMINATE", cause: "input_missing", level: "advisory", stage: "거래중" }));
  const meta7 = { at: ASOF, level: "L1", scope: "전수", policyVer: H.ver, tableHash: H.hash };
  const NTSV = T7.exportNotice.tsv, NDOC = T7.exportNotice.doc;
  const times = (t, n) => (t ? String(t).split(n).length - 1 : 0);

  /* ── ⓐ 표(TSV) 경로 — 산출물 · 집행 · 기록 ── */
  clearLog(); E7.blockClear();
  const tsv7 = E7.exportTsv(rows7, meta7, { level: "L1" });
  const tsvLog = logs();
  chk(tsv7.ok === true && tsv7.out && tsv7.out.head.length === 4 && times(tsv7.out.text, NTSV) === 1,
    "단언 23-b 표 산출물이 집행을 지나고 머리말 4줄 안에 고지가 **정확히 1회** 들어간다",
    { ok: tsv7.ok, head: tsv7.out && tsv7.out.head.length, notice: tsv7.out && times(tsv7.out.text, NTSV) });
  chk(tsvLog.length === 1 && tsvLog[0].ev === EV.tsv,
    "단언 23-b 표 **반출 1건에 열람 기록 1행**(사건 " + EV.tsv + ") — 양성 테스트다", { n: tsvLog.length, ev: tsvLog.map((l) => l.ev) });
  chk(times(tsv7.out.text, "legalName") === 0 && !NAMES.some((n) => tsv7.out.cols.join("\t").indexOf(n) >= 0),
    "단언 23-b 산출물의 열 이름에 상호 · 원 필드가 없다", tsv7.out.cols);

  /* ── ⓑ 문서(인쇄) 경로 — 새 창은 보호 밖이므로 고지 · 워터마크 · 기록을 직접 심는다 ── */
  clearLog();
  const doc7 = E7.exportDoc(rows7, meta7, { level: "L1" });
  const open7 = E7.exportDocOpen(doc7);
  const docLog = logs();
  chk(doc7.ok === true && times(doc7.html, NDOC) === 1,
    "단언 23-c 인쇄 HTML 머리말에 문서용 고지가 **정확히 1회** 들어간다", { ok: doc7.ok, notice: times(doc7.html, NDOC) });
  chk(!!doc7.stamp && doc7.html.indexOf("data:image/svg+xml") >= 0 && doc7.html.indexOf(doc7.stamp) >= 0,
    "단언 23-c 인쇄 HTML에 **화면 워터마크와 같은 스탬프**(열람자 · 날짜 · 세션)가 직접 인라인된다 — 새 창은 #guardwm 밖이다",
    { stamp: !!doc7.stamp, wm: doc7.html.indexOf("data:image/svg+xml") >= 0 });
  chk(W7.run("return (typeof guardStamp === 'function') && (typeof guardWmUrl === 'function');") === true,
    "단언 23-c 스탬프 · 워터마크 이미지의 **조립 함수가 보호 유틸 한 곳**이다(인쇄물과 화면이 다른 열람 기록을 달지 않는다)");
  chk(docLog.length === 1 && docLog[0].ev === EV.doc && open7.log && open7.log.wrote === 1,
    "단언 23-c 문서 **반출 1건에 열람 기록 1행**(사건 " + EV.doc + ") · 기록은 인쇄 호출 **직전 원 창에서** 남는다",
    { n: docLog.length, ev: docLog.map((l) => l.ev) });
  chk(!!doc7.outside, "단언 23-c 산출물이 「새 창은 보호 밖」이라는 사실을 **반환 필드로** 말한다(설계에 적어 둔다)", doc7.outside);

  /* ── ⓒ 클립보드 — 핸들러를 실제로 걸고 **전체 선택 · 부분 선택 둘 다** 본다 ── */
  clearLog();
  W7.run("applyGuard(); return 1;");
  const copyFns = LIS.copy || [];
  chk(copyFns.length >= 1, "단언 23-d0 보호 유틸이 copy 핸들러를 실제로 건다(분모 — 핸들러가 없으면 아래 검사가 공집합으로 통과한다)", copyFns.length);
  const fire = (val, a, b, cls) => {
    let got = null, prevented = false;
    const ev = { target: { classList: { contains: (c) => c === cls }, value: val, selectionStart: a, selectionEnd: b },
      preventDefault() { prevented = true; }, clipboardData: { setData: (t, v) => { got = v; } } };
    for (const fn of copyFns) fn(ev);
    return { got: got, prevented: prevented };
  };
  const full = tsv7.out.text;
  const cAll = fire(full, 0, full.length, E7.exportClass);
  const cPart = fire(full, full.length - 60, full.length, E7.exportClass);
  chk(cAll.prevented === true && times(cAll.got, NTSV) === 1,
    "단언 23-d 전체 선택 복사 — 기본 복사를 막고 클립보드를 다시 쓰며 고지가 **정확히 1회**", { prevented: cAll.prevented, notice: times(cAll.got, NTSV) });
  chk(cPart.prevented === true && times(cPart.got, NTSV) === 1 && String(cPart.got).split("\n")[0] === NTSV,
    "단언 23-d **표 행만 끌어서 복사해도** 고지가 따라간다(선례 .hmoex 가 선택 범위를 보지 않아 뚫린 자리다)",
    { prevented: cPart.prevented, notice: times(cPart.got, NTSV), head: String(cPart.got).slice(0, 24) });
  const cOther = fire("아무 지면 문자열", 0, 7, "nothing");
  chk(cOther.got === null && cOther.prevented === true,
    "단언 23-d 반출면 **밖**에서는 보호가 그대로다(클래스 하나로 화면 전체가 열리지 않는다 — activeElement 보조 판정 구멍의 실측 기록)", cOther);
  const clipLog = logs();
  chk(clipLog.length === 2 && clipLog.every((l) => l.ev === EV.clip),
    "단언 23-d 복사 2회에 열람 기록 **2행**(1회에 1행 — 키 입력과 복사 이벤트가 **이중 기록하지 않는다**)",
    { n: clipLog.length, ev: clipLog.map((l) => l.ev) });
  const clipOnce = E7.exportClip(full, "tsv"), clipTwice = E7.exportClip(clipOnce.text, "tsv");
  chk(clipOnce.added === false && clipTwice.added === false && times(clipTwice.text, NTSV) === 1,
    "단언 23-d 판정 기준이 「첫 줄」이 아니라 **「선택 안에 고지가 있는가」**다 — 두 번 지나도 고지가 1회다(첫 줄 기준이면 전체 선택에서 2회가 된다)",
    { once: clipOnce.added, twice: times(clipTwice.text, NTSV) });

  /* ── ⓓ 애블레이션 — **그 문장만** 떼면 두 경로 모두 hard 로 막힌다 ── */
  const abl = {};
  for (const kind of ["tsv", "doc"]) {
    clearLog(); E7.blockClear();
    const b = E7.exportBuild(rows7, meta7, kind);
    b.head[3] = "";
    const g = E7.export(b, { level: "L1", kind: kind });
    abl[kind] = { allow: g.allow, level: g.level, reasons: g.reasons.length, log: logs().length, blocked: E7.blockAll().length };
  }
  E7.blockClear();
  chk(abl.tsv.allow === false && abl.tsv.level === "hard" && abl.doc.allow === false && abl.doc.level === "hard",
    "단언 23-e 고지 문장만 떼면 **표 · 문서 두 경로 모두** 반출이 hard 로 막힌다(면제 불가)", abl);
  chk(abl.tsv.log === 0 && abl.doc.log === 0 && abl.tsv.blocked === 1 && abl.doc.blocked === 1,
    "단언 23-e 막힌 반출은 **열람 기록을 남기지 않고** 차단 로그에 1행 남는다(두 로그가 같은 사건을 세지 않는다)", abl);

  /* ── ⓔ 보호 전제 — 실명 표기는 복사 차단 설정을 전제한다(§4-6-3 ⓑ) ── */
  W7.run("guardSet({ noCopy: false }); return 1;");
  const nocopy = E7.exportTsv(rows7, meta7, { level: "L1" });
  W7.run("guardSet({ noCopy: true }); return 1;");
  const nocopyBack = E7.exportTsv(rows7, meta7, { level: "L1" });
  chk(nocopy.ok === false && nocopy.gate.reasons.some((r) => /복사 차단/.test(r)) && nocopyBack.ok === true,
    "단언 23-f 보호 콘솔이 복사 차단을 끄면 실명 반출이 막히고, 되돌리면 통과한다 — **양방향**", { off: nocopy.ok, on: nocopyBack.ok });

  /* ── ⓕ 지면이 반출 함수를 부른다 · 렌더가 반출을 부르지 않는다 ── */
  const pgJsx = fs.readFileSync(path.join(ROOT, PG_CALC_FILE), "utf8");
  const pgJsxS = strip(pgJsx);
  const panel = pgJsxS.slice(pgJsxS.indexOf("function PGExport"), pgJsxS.indexOf("function PGB7"));
  const runBody = panel.slice(panel.indexOf("const run ="), panel.indexOf("return ("));
  chk(panel.length > 200 && /pgExportTsv\(/.test(runBody) && /pgExportDoc\(/.test(runBody) && /pgExportDocOpen\(/.test(runBody),
    "단언 23-g 반출면이 **반출 함수를 부른다**(지면이 산출물을 자기 손으로 조립하지 않는다)");
  const afterRun = panel.slice(panel.indexOf("return ("));
  chk(!/pgExport(Tsv|Doc|DocOpen|Emit)\(/.test(afterRun),
    "단언 23-g **렌더 구간에서는 반출을 부르지 않는다** — 지면을 여는 것만으로 열람 기록이 불어나면 「반출 몇 건이었나」에 답할 수 없다");
  /* ★ 클래스 이름을 **리터럴로 적지 않았는가**를 그 이름으로 검사한다. 두 소비자(지면 · 보호 예외)가
     조회 함수를 지나지 않고 문자로 적으면, 상수를 바꿨을 때 한쪽만 따라오고 그때 증상은
     「선택은 되는데 클립보드가 비는」 가짜 버튼이다 — 원인에서 먼 증상이다. */
  const clsLit = new RegExp('["\']' + E7.exportClass + '["\']');
  chk(!clsLit.test(panel) && /pgExportClass\(/.test(panel) && /className=\{cls\}/.test(panel),
    "단언 23-g 반출면의 클래스가 **조회 함수를 지난다**(지면에 문자로 적으면 보호 예외와 갈린다)",
    { lit: clsLit.test(panel), fn: /pgExportClass\(/.test(panel) });
  const gS = strip(fs.readFileSync(path.join(ROOT, "src/utils/contentGuard.js"), "utf8"));
  chk(!clsLit.test(gS) && /pgExportClass\(/.test(gS),
    "단언 23-g 보호 예외도 같은 조회 함수를 지난다 — 리터럴 기본값을 끼워 두지 않았다(없으면 예외를 등록하지 않는다)",
    { lit: clsLit.test(gS) });
  chk(/pgExportClip\(/.test(gS) && /clipboardData/.test(gS) && /preventDefault/.test(gS),
    "단언 23-g 보호 유틸의 복사 예외가 **클래스 상수를 읽고 클립보드를 다시 쓴다**(문안은 반출 조립 함수가 소유한다)");
  chk(!/시연 판정 · 실제 평가가 아님/.test(gS),
    "단언 23-g 보호 유틸이 **고지 문안을 들고 있지 않다** — 문안이 두 곳에 살면 한쪽만 고쳐지는 순간 산출물이 갈린다");

  /* ── ⓖ 커밋이 반출이다 — 저장소 산출물 전수(§13-10 산출물 ⑦ · §14-1-1) ── */
  const trackedAll = String(execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })).split(/\r?\n/).filter(Boolean);
  /* 이 서브시스템이 커밋 경로에 떨어뜨리는 산출물 — **이름으로** 적는다(경로가 늘면 여기 늘려야 하고,
     그 늘림이 리뷰에 보인다). 추적 전이라도 검사한다 — 커밋되는 순간 배포되므로 커밋 전에 봐야 한다. */
  const PG_COMMIT_OUT = ["scripts/pg_policy_snapshot.json", "scripts/pg_scan_report.json"];
  const scanOut = (s) => {
    const hit = { names: [], pid: (s.match(/\bPT\d{4}\b/g) || []).length, vid: (s.match(/\bV\d{3,4}\b/g) || []).length,
      cell: (s.match(/(PERMIT|DENY|INDETERMINATE)[^\n]{0,40}(PT\d{4}|V\d{3,4})/g) || []).length };
    for (const n of NAMES) if (n.length > 2 && s.indexOf(n) >= 0) hit.names.push(n);
    return hit;
  };
  const selfTest = scanOut("PT0001 · V001 · " + (NAMES[0] || "") + " · DENY PT0002");
  chk(selfTest.names.length === 1 && selfTest.pid === 2 && selfTest.vid === 1 && selfTest.cell === 1,
    "단언 23-h0 **탐지기 자기시험** — 상호 · 식별자 · 판정 셀 리터럴을 먹여 스캐너가 살아 있음을 먼저 증명한다(0건을 분모 없이 통과시키지 않는다)", selfTest);
  const outHits = [];
  for (const rel of PG_COMMIT_OUT) {
    let s = "";
    try { s = fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch (e) { outHits.push({ rel: rel, why: "산출물이 없다" }); continue; }
    const h = scanOut(s);
    if (h.names.length || h.pid || h.vid || h.cell) outHits.push(Object.assign({ rel: rel }, h, { names: h.names.slice(0, 3) }));
  }
  chk(outHits.length === 0,
    "단언 23-h 커밋 산출물 " + PG_COMMIT_OUT.length + "건 전문에 상호 0 · partnerId 0 · 거래처ID 0 · 판정 셀 0(커밋이 반출이다 — 이 경로는 라이브 도메인에서 정적 제공된다)", outHits);
  /* 골든 케이스 — 추적 경로(fixtures/ 는 화이트리스트 허용)에 있으면 그것도 반출이다 */
  const goldenTracked = trackedAll.filter((r) => /pg_golden/.test(r));
  chk(goldenTracked.length === 0 && fs.existsSync(path.join(ROOT, "docs/partner_gov/pg_golden_v1.json")),
    "단언 23-h 전건 골든 케이스가 **추적되지 않는 경로**(docs/partner_gov)에 있고 fixtures/ · scripts/ 에 복제본이 없다", goldenTracked);
  /* 이 서브시스템이 추적 경로에 다른 파일을 늘리지 않았는가 — 늘렸다면 위 목록에 이름이 있어야 한다 */
  const strayPg = trackedAll.filter((r) => /^(scripts|fixtures)\/.*(partner|pg_)[^/]*\.(json|jsonl|csv|tsv)$/i.test(r) && PG_COMMIT_OUT.indexOf(r) < 0);
  chk(strayPg.length === 0,
    "단언 23-h 협력업체 통제가 추적 경로에 **목록 밖 데이터 산출물**을 늘리지 않았다(늘리면 이름으로 등재해야 한다)", strayPg);
  snap.p7 = { noticeAt: AT.length, cls: E7.exportClass, logEv: EV,
    tsvNotice: times(tsv7.out.text, NTSV), docNotice: times(doc7.html, NDOC),
    tsvLog: tsvLog.length, docLog: docLog.length, clipLog: clipLog.length,
    clipAll: times(cAll.got, NTSV), clipPart: times(cPart.got, NTSV),
    ablation: { tsv: abl.tsv.allow, doc: abl.doc.allow, level: abl.tsv.level },
    guardPremise: { off: nocopy.ok, on: nocopyBack.ok },
    commitOut: PG_COMMIT_OUT.length, commitHits: outHits.length, tracked: trackedAll.length,
    goldenTracked: goldenTracked.length, stray: strayPg.length };
}

/* ════════ 산출 경로 규약 — **최종.** 스냅샷을 다 채운 뒤에 전문을 본다 ════════
   커밋이 반출이다(§14-1-1). 이 파일은 라이브 도메인에서 그대로 정적 제공되므로, 절을 하나
   더 붙일 때마다 그 절이 검사 밖에 남지 않도록 **마지막에 전문을 다시 센다.** */
{
  const snapTxt = JSON.stringify(snap);
  chk(!/legalName|vendorName|상호/.test(snapTxt),
    "산출 경로 규약(최종) — 커밋되는 스냅샷 **전문**에 상호 필드 · 화면 문구가 0건", (snapTxt.match(/.{0,20}(legalName|vendorName|상호).{0,20}/g) || []).slice(0, 3));
  let nameIn = 0;
  for (const n of NAMES) if (n.length > 2 && snapTxt.indexOf(n) >= 0) nameIn++;
  chk(nameIn === 0, "산출 경로 규약(최종) — 커밋되는 스냅샷에 거래처 상호 출현 0건", nameIn);
}
snap.assertions = { total: ok.length + fail.length, passed: ok.length };
fs.writeFileSync(path.join(ROOT, "scripts/pg_scan_report.json"), JSON.stringify(snap, null, 1), "utf8");

function report() {
  const ms = Date.now() - t0;
  console.log("\n══ 협력업체 통제 — 집행 · 제출 필드 사전 가드 ══");
  console.log("통과 " + ok.length + " · 실패 " + fail.length + " · " + (ms / 1000).toFixed(2) + "초");
  if (fail.length) { console.log("\n[FAIL]"); for (const f of fail) console.log("  ✗ " + f); }
  else for (const o of ok) console.log("  ✓ " + o);
}
report();
console.log("\n음성 테스트 " + neg.filter((n) => n.blocked).length + "/" + neg.length + " 차단");
for (const n of neg) console.log("  " + (n.blocked ? "✓" : "✗") + " " + n.label + " — " + String(n.why || "").slice(0, 120));
console.log("\n제출 필드 " + E.counts.fields + " · 받지 않는 것 " + E.counts.refuse + " · 집행 지점 " + E.counts.sites +
  " · 저장 키 " + Object.keys(E.keys).length + " · 모집단 " + snap.population + " · 표시명 모드 " + snap.nameMode);
console.log("지점별 차단 건수: " + JSON.stringify(pepBlocked));
console.log("실효 집행 수준 분포: " + JSON.stringify(effDist));
process.exit(fail.length ? 1 : 0);
