/* ══════════════ 본인(조성래) 실측 통일 가드 ══════════════
   형 지시(2026-10-05) 「본인 계정 수치를 실측 리포트 값으로 통일하라」가 지켜지는지 **브라우저 없이** 단언한다.
   빠르다(수 초) — 빌드 게이트(py gen_nav_inventory → bash build_preview → node run_nav_regression) 뒤에
   이 스크립트를 함께 돌리면 수치 회귀를 즉시 잡는다.

   검사 3종
     ① 스냅샷 동일성 — src/data/selfReal.js에 실린 JSON 전문 === src/data/mcp_josungrae.json (드리프트 금지)
     ② 실측 고정값   — 금고 시드·demoReport·검진 항목현황·건강등급·보험이 전부 실측값을 내는가
     ③ 격리          — 체험 회원 16명은 합성 경로 유지(본인 값이 새지 않는가) + 구 합성 금고의 1회 이관

   사용: node scripts/run_selfreal_check.mjs
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = [];
const ok = [];
const chk = (cond, label, got) => { (cond ? ok : fail).push(label + (cond ? "" : "  ← 실제: " + JSON.stringify(got))); };

/* ── ① 스냅샷 동일성 ── */
const jsonText = fs.readFileSync(path.join(ROOT, "src/data/mcp_josungrae.json"), "utf8");
const selfRealSrc = fs.readFileSync(path.join(ROOT, "src/data/selfReal.js"), "utf8");
const m = selfRealSrc.match(/const SELF_REAL_JSON = String\.raw`([\s\S]*?)`;/);
chk(!!m, "selfReal.js에 JSON 스냅샷(String.raw) 존재");
if (m) {
  const norm = (s) => s.replace(/\r\n/g, "\n").trim();
  chk(norm(m[1]) === norm(jsonText), "스냅샷 === mcp_josungrae.json (드리프트 없음)");
  try { JSON.parse(m[1]); ok.push("스냅샷 JSON 파싱"); } catch (e) { fail.push("스냅샷 JSON 파싱 실패: " + e.message); }
}

/* ── 데이터 레이어 적재(.js만 — 화면 JSX는 빌드 게이트가 검증) ──
   ⚠️ 컨텍스트 생성을 **함수로** 뽑는다(2026-10-08 수선) — ⑪-2 「두 번째 시계 행동 단언」이
   벽시계를 창 만기 뒤로 밀어 둔 격리 컨텍스트를 하나 더 열어 같은 값이 나오는지 직접 확인한다.
   소스 스캔만으로는 창 판정을 insJudgeNow **밖에서** 한 번 더 하는 코드를 잡지 못했다
   (실증된 애블레이션 2건 — checkupIns의 `|| Date.now() > timeline.end` · claimReview의
   `if (Date.now() > W.end) return COVER_END` — 이 237/0으로 통과했다). */
const manifest = fs.readFileSync(path.join(ROOT, "src/_manifest.txt"), "utf8").split(/\r?\n/).filter(Boolean);
const loadCtx = (fixedNowMs, sink) => {
  const store = new Map();
  const localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
  const c = { console, localStorage, setTimeout, clearTimeout, escape: (s) => s };
  if (fixedNowMs != null) {
    /* **벽시계만** 고정한다 — 인자 있는 new Date(x)는 그대로 통과시켜 포맷·정규화를 깨지 않는다 */
    const RD = Date;
    function FD(...a) { if (!(this instanceof FD)) return RD(...a); return a.length ? new RD(...a) : new RD(fixedNowMs); }
    FD.now = () => fixedNowMs; FD.parse = RD.parse; FD.UTC = RD.UTC; FD.prototype = RD.prototype;
    c.Date = FD;
  }
  c.window = c; c.self = c; c.globalThis = c;
  c.document = { createElement: () => ({ style: {} }), body: { appendChild() {}, removeChild() {} } };
  c.React = { useState: () => [null, () => {}], useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }) };
  vm.createContext(c);
  for (const f of ["src/data/dummy_data.js", "src/data/section_data.js", "src/data/demo_members.js"]) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c, { filename: f }); } catch (e) { if (sink) sink.push("plain 데이터 적재 실패: " + f); }
  }
  let n = 0;
  for (const f of manifest) {
    if (!/\.js$/.test(f)) continue;
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c, { filename: f }); n++; }
    catch (e) { if (sink) sink.push("모듈 적재 실패 " + f + " :: " + String(e.message).split("\n")[0]); }
  }
  return { ctx: c, loaded: n };
};
const L0 = loadCtx(null, fail);
const ctx = L0.ctx;
chk(L0.loaded > 100, "데이터 모듈 적재", L0.loaded);

const run = (code) => vm.runInContext("(() => {" + code + "})()", ctx, { filename: "check" });

/* ── ② 실측 고정값 ── */
let S = null;
try {
  S = run(`
    const P = selfRealProfile();
    const me = Object.assign({ id: "self-srcho197011", name: "조성래", email: "srcho197011@hizenhealth.com", isDemoUser: false, realVerified: true, isSelf: true }, P);
    seedSelfVault(me); selfEnsureInsSeed(me);
    const v = vaultLoad(anonToken(me));
    const R = demoReport(me);
    const C = genMemberCheckup(Object.assign({}, me));
    const G = memberHealthGrade(Object.assign({}, me));
    const CP = memberClinicalProfile(me);
    const RP = riskPredict(me);
    const HB = hmHealthBrief(me);
    const INS = selfInsurance();
    const SOL = insuranceSolution(Object.assign({}, me));
    const RR = rerateCompute(me);
    const CKI = insService.checkupIns(me);
    const W = insCheckupWindow(me);
    const TP = hmTouchPlan(me);
    /* 보장 중 국면에서 검진 청구가 실제로 승인되는가(만기 분기의 반대쪽).
       ⚠️ 진료일을 **기준일로 못박는다** — 전에는 date를 넘기지 않아 at이 벽시계였고(claimSubmit의
          「at: o.date || Date.now()」), 청구 심사에 진료일 축이 생기는 순간 벽시계가 2026-11-05를
          넘기면 이 단언이 달력만으로 깨진다. 창 안 진료일은 창에서 받는다. */
    const _cOK = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 100000, date: insAsOfMs() });
    const RV_OK = _cOK.ok ? insService.claimReview(me, _cOK.claim.id) : { ok: false, reason: "접수 실패" };
    /* ── 양방향 — 만기 경과 국면도 같은 창 하나에서 나오는가. 계약 coverFrom만 400일 과거로 옮겨
          창을 닫아 보고, 원래 값으로 되돌린 뒤 창이 그대로인지까지 확인한다(검사가 상태를 남기지 않는다). ── */
    let TPE = null, CKE = null, RV_END = null, WR = null;
    try {
      const _pol = pbPolicies(me).find((p) => /검진.?대비/.test(p.product));
      if (_pol) {
        const _keep = { coverFrom: _pol.coverFrom, coverSeed: _pol.coverSeed };
        pbPolicyPatch(me, _pol.id, { coverFrom: insAsOfMs() - 400 * 86400000, coverSeed: "demo" });
        const WE = insCheckupWindow(me), TP2 = hmTouchPlan(me), CK2 = insService.checkupIns(me);
        /* mend **제목 문자열**을 페이로드에 담는다 — 이 줄이 없어서 「만기 경과(undefined)」가
           가드를 통과했다(애블레이션 실증: healthMate.js의 날짜 보간을 미정의 변수로 바꿔도 145/0).
           제목은 프로 ③ 터치 플랜과 ⑨ 카드에 그대로 렌더되는 문장이다. */
        TPE = { items: TP2.items.map((x) => x.key), mendDue: !!(TP2.items.find((x) => x.key === "mend") || {}).due,
                mendTitle: (TP2.items.find((x) => x.key === "mend") || {}).title || null,
                end: WE ? WE.end : null, endDay: WE ? insDayStr(WE.end) : null,
                phase: WE ? WE.phase : null, ended: WE ? WE.ended : null, remainDays: WE ? WE.remainDays : null,
                startsInDays: WE ? WE.startsInDays : null };
        /* neverActive — 「이 계약이 자기 보장 기간을 산 적이 있나」. 창을 400일 과거로 옮긴 이
           시나리오에서 계약 createdAt은 **창 만기 뒤**(지금)이므로 그 과거 보장은 데이터에 없다.
           대조로 계약 생성 시각을 창보다 더 앞으로 옮기면 과거형이 참이 된다(두 모양을 함께 본다). */
        CKE = { phase: CK2.timeline ? CK2.timeline.phase : null, ended: !!CK2.ended, note: CK2.endedNote, never: !!CK2.neverActive };
        RV_END = _cOK.ok ? insService.claimReview(me, _cOK.claim.id) : null;
        const _ca = _pol.createdAt;
        pbPolicyPatch(me, _pol.id, { createdAt: insAsOfMs() - 500 * 86400000 });
        const CK3 = insService.checkupIns(me);
        CKE.neverOldContract = !!CK3.neverActive; CKE.endedOldContract = !!CK3.ended;
        pbPolicyPatch(me, _pol.id, { createdAt: _ca });
        pbPolicyPatch(me, _pol.id, _keep);
      }
    } catch (e) {}
    /* ── 이미 시드가 깔린 기기 재현 — coverFrom이 빈 계약(구 시드)이 보정되는가.
          ⓐ selfEnsureInsSeed의 조기 반환(v3/v4 플래그)에 보정이 막히지 않는가
          ⓑ pbPolicyCreate의 중복 반환 경로가 coverFrom·term을 병합하는가
       둘 중 하나가 빠지면 시연 기기에서 창이 다시 벽시계(증서·createdAt)로 떨어진다. */
    let ENS = null, DUPM = null;
    try {
      const _pol = pbPolicies(me).find((p) => /검진.?대비/.test(p.product));
      if (_pol) {
        const _keep2 = { coverFrom: _pol.coverFrom, coverSeed: _pol.coverSeed, term: _pol.term };
        pbPolicyPatch(me, _pol.id, { coverFrom: null, coverSeed: null, term: "3개월(검진 연동)" });
        const WB = insCheckupWindow(me);
        selfEnsureInsSeed(me);                                   /* v3/v4 플래그가 이미 1 → 조기 반환 경로 */
        const WA = insCheckupWindow(me), PA = pbPolicies(me).find((p) => /검진.?대비/.test(p.product));
        ENS = { beforeBasis: WB ? WB.basis : null, afterBasis: WA ? WA.basis : null, afterSeed: WA ? WA.seed : null,
                afterEnd: WA ? WA.end : null, term: PA.term, coverFrom: PA.coverFrom };
        pbPolicyPatch(me, _pol.id, { coverFrom: null, coverSeed: null, term: "3개월(검진 연동)" });
        const DUP = pbPolicyCreate(me, { product: "건강검진 대비보험(무상)", monthly: 0, cover: "진단지원 최대 100만", term: "60일(검진 연동)", coverFrom: insDemoCoverFrom(), coverSeed: "demo" });
        DUPM = { existed: !!DUP.existed, coverFrom: DUP.policy.coverFrom, coverSeed: DUP.policy.coverSeed, term: DUP.policy.term,
                 n: pbPolicies(me).filter((p) => /검진.?대비/.test(p.product)).length };
        pbPolicyPatch(me, _pol.id, _keep2);
      }
      const W2 = insCheckupWindow(me);
      WR = W2 ? { start: W2.start, end: W2.end, phase: W2.phase, remainDays: W2.remainDays } : null;
    } catch (e) {}
    /* ── 세 번째 국면 「보장 개시 대기」 ─────────────────────────────────────────────
       가드는 「보장 중」과 「보장 종료」 양방향만 봤다(파일 전체에서 "개시 대기" 0건).
       그래서 기준일 이후에 열린 창이 영구 대기에 갇히고 배지가 「60일 상품에 만기까지 63일」을
       적는 결함이 145개 단언 어디에도 걸리지 않았다. coverFrom을 기준일 뒤로 밀어 그 국면을 만든다. */
    let WAIT = null;
    try {
      const _pol = pbPolicies(me).find((p) => /검진.?대비/.test(p.product));
      if (_pol) {
        const _keep = { coverFrom: _pol.coverFrom, coverSeed: _pol.coverSeed };
        pbPolicyPatch(me, _pol.id, { coverFrom: insAsOfMs() + 10 * 86400000, coverSeed: "demo" });
        const WW = insCheckupWindow(me), CKW = insService.checkupIns(me);
        const _cw = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 100000, date: insAsOfMs() });
        const RVW = _cw.ok ? insService.claimReview(me, _cw.claim.id) : null;
        WAIT = { phase: WW ? WW.phase : null, ended: WW ? WW.ended : null, remainDays: WW ? WW.remainDays : null,
                 startsInDays: WW ? WW.startsInDays : null, startDay: WW ? insDayStr(WW.start) : null,
                 ckPhase: CKW.timeline ? CKW.timeline.phase : null, ckRemain: CKW.timeline ? CKW.timeline.remainDays : null,
                 rvOk: RVW ? !!RVW.ok : null, rvCode: RVW ? RVW.code : null,
                 rvEasy: RVW ? (RVW.deny || {}).easy : null, rvFix: RVW ? (RVW.deny || {}).fix : null };
        pbPolicyPatch(me, _pol.id, _keep);
      }
    } catch (e) {}
    /* ── 증서 2건 ───────────────────────────────────────────────────────────────
       검진 예약완료 경로(Checkup.jsx:890)는 **예약일**(미래)로 증서를 push한다. 증서가 2건이 되면
       근거 문구가 최신 증서를 「1차 증서」라고 부르고 1차 보장 줄이 화면에서 사라졌다(실측).
       가드에는 증서를 다건으로 만드는 시나리오가 0건이어서 못 잡았다. */
    let TWO = null;
    try {
      const _snap = localStorage.getItem("hifin_ins_certs");
      const _l = JSON.parse(_snap || "[]");
      /* 저장 순서를 일부러 섞어 둔다 — 「목록 순서」가 아니라 **증서 날짜**로 가려야 한다 */
      _l.push({ id: "CERT-BK9Z1", center: "테스트검진센터", date: "2026-11-20", time: "10:00", at: insAsOfMs(), insured: { name: me.name }, covers: [] });
      _l.push({ id: "CERT-BK9Z2", center: "테스트검진센터", date: "2026-01-15", time: "09:00", at: insAsOfMs(), insured: { name: me.name }, covers: [] });
      localStorage.setItem("hifin_ins_certs", JSON.stringify(_l));
      const WT = insCheckupWindow(me);
      TWO = { n: insCheckupCerts(me).length, latest: (insCheckupCert(me) || {}).id,
              order: insCheckupCerts(me).map((x) => x.c.id),
              firstId: WT && WT.priorCert ? WT.priorCert.id : null, src: WT ? WT.src : null,
              start: WT ? WT.start : null, end: WT ? WT.end : null,
              priorId: WT && WT.prior && WT.prior.cert ? WT.prior.cert.id : null,
              priorStart: WT && WT.prior ? WT.prior.start : null };
      localStorage.setItem("hifin_ins_certs", _snap == null ? "[]" : _snap);
      const WB = insCheckupWindow(me);
      TWO.restoredSrc = WB ? WB.src : null;
    } catch (e) {}
    /* ── 코호트 회원 발급 경로 ───────────────────────────────────────────────────
       회원이 실제로 누르는 「내 무료 보장 켜기 (10초)」 → insService.issueCheckupIns.
       가드에 이 경로 단언이 0건이어서, 발급 직후 영구 「보장 개시 대기」·청구 영구 거절이
       145/0으로 통과했다. 과거 검진(개시 완료)과 미래 예약(개시 전) 두 모양을 함께 본다.
       ⚠️ 시나리오 날짜를 **벽시계 상대 오프셋**으로 만든다(2026-10-08 수선) — 전에는
          mk(1, "2026-09-20") · mk(2, "2026-11-20") 고정 리터럴이었고 이 창은 seed "live"라
          Date.now()로 판정되므로 **코드가 한 줄도 바뀌지 않아도 달력만으로** 두 단언이 깨졌다
          (실측: 벽시계 2026-11-21에 past → 「보장 종료」 · future → 「보장 중」 → 2건 FAIL).
          가드 안의 시한폭탄이었고, 새 pre-commit 창 게이트가 그것을 커밋 전면 차단으로
          승격시킬 자리였다. 단언도 날짜가 아니라 **국면·관계**로만 적는다.
       ⓒ fresh — 금고를 **주입하지 않고** 코호트 회원이 실제로 들고 있는 시드 그대로 발급한다
          (주입 시나리오만 돌면 실제 회원이 겪는 「발급 직후 보장 종료」가 전건 통과한다). */
    let COH = null;
    try {
      const _snap = localStorage.getItem("hifin_ins_certs");
      const _list = (typeof DEMO_MEMBERS !== "undefined" && DEMO_MEMBERS) || (window.__HHDATA || {}).DEMO_MEMBERS || [];
      const _D = 86400000;
      const isoOf = (ms) => { const d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      const mk = (idx, ckDate) => {
        const d = Object.assign({}, _list[idx]);
        vaultSaveCheckup(d, [{ key: "glucose", value: 101 }], { date: ckDate, source: "upload", completeness: "full", channel: "upload", fileName: "guard.pdf" });
        const iss = insService.issueCheckupIns(d);
        const WD = insCheckupWindow(d);
        const cs = insService.claimSubmit(d, { kind: "검진 연계 정밀검사", fee: 100000 });
        const rv = cs.ok ? insService.claimReview(d, cs.claim.id) : { ok: false, code: "SUBMIT" };
        const cert = insCheckupCert(d);
        return { name: d.name, issueOk: !!iss.ok, certInsured: !!(cert && cert.insured && cert.insured.name === d.name),
          basis: WD ? WD.basis : null, seed: WD ? WD.seed : null, phase: WD ? WD.phase : null,
          remainDays: WD ? WD.remainDays : null, startsInDays: WD ? WD.startsInDays : null,
          claimOk: !!rv.ok, claimCode: rv.code || null, claimFix: (rv.deny || {}).fix || null,
          winFromIssue: iss.window ? iss.window.start : null, winNow: WD ? WD.start : null,
          startAfterNow: !!(WD && WD.start > Date.now()), endAfterNow: !!(WD && WD.end > Date.now()) };
      };
      COH = { past: mk(1, isoOf(Date.now() - 20 * _D)), future: mk(2, isoOf(Date.now() + 40 * _D)),
              pastIso: isoOf(Date.now() - 20 * _D), futureIso: isoOf(Date.now() + 40 * _D) };
      /* ⓒ 주입 없음 — 코호트 로그인 경로가 실제로 심는 금고(검진일 시드 리터럴)를 그대로 쓴다 */
      try {
        const prof = cohortLoginProfile(42);
        cohortSeedVault(prof, 42);
        const _ck = (vaultLoad(anonToken(prof)).checkups || []).map((x) => x.date);
        const iss = insService.issueCheckupIns(prof);
        const WD = insCheckupWindow(prof), CK = insService.checkupIns(prof);
        const cs = insService.claimSubmit(prof, { kind: "검진 연계 정밀검사", fee: 100000 });
        const rv = cs.ok ? insService.claimReview(prof, cs.claim.id) : { ok: false, code: "SUBMIT" };
        const nf = JSON.parse(localStorage.getItem("hifin_notifs") || "[]")[0] || {};
        const cert = insCheckupCert(prof);
        /* ⓑ 폴백(증서 날짜)이 **도달 가능**한지 — coverFrom을 비우면 basis가 cert로 떨어지는가.
           구 단언 「발급 경로의 basis === "cert"」의 승계다(그 상태 자체는 결함이었고, 폴백
           사다리가 살아 있다는 뜻만 남긴다). 확인 후 즉시 원복하고 원복까지 단언한다. */
        const _p2 = pbPolicies(prof).find((p) => /검진.?대비/.test(p.product));
        const _kp = { coverFrom: _p2.coverFrom, coverSeed: _p2.coverSeed };
        pbPolicyPatch(prof, _p2.id, { coverFrom: null, coverSeed: null });
        const WB2 = insCheckupWindow(prof);
        pbPolicyPatch(prof, _p2.id, _kp);
        const WR2 = insCheckupWindow(prof);
        COH.fresh = { name: prof.name, vaultCk: _ck, issueOk: !!iss.ok, reason: iss.reason || null,
          basis: WD && WD.basis, seed: WD && WD.seed, phase: WD && WD.phase, ended: !!(WD && WD.ended),
          startAfterNow: !!(WD && WD.start > Date.now()), endAfterNow: !!(WD && WD.end > Date.now()),
          remainDays: WD && WD.remainDays, startsInDays: WD && WD.startsInDays,
          never: !!CK.neverActive, endedNote: CK.endedNote, ckEnded: !!CK.ended,
          badgeStart: WD ? insDayStr(WD.start) : null, issueWinStart: iss.window ? insDayStr(iss.window.start) : null,
          notifD: nf.d || null, claimOk: !!rv.ok, claimCode: rv.code || null, claimFix: (rv.deny || {}).fix || null,
          certInsured: !!(cert && cert.insured && cert.insured.name === prof.name), certN: insCheckupCerts(prof).length,
          certFallbackBasis: WB2 ? WB2.basis : null, certFallbackSeed: WB2 ? WB2.seed : null,
          restoredBasis: WR2 ? WR2.basis : null, restoredStart: WR2 ? insDayStr(WR2.start) : null,
          priorCertId: WD && WD.priorCert ? WD.priorCert.id : null, src: WD ? WD.src : null };
      } catch (e2) { COH.freshErr = String(e2.message); }
      localStorage.setItem("hifin_ins_certs", _snap == null ? "[]" : _snap);
    } catch (e) { COH = { err: String(e.message) }; }
    /* ── 청구 id가 같은 밀리초에도 충돌하지 않는가 ───────────────────────────────
       청구 원장(hifin_claims)은 회원별이 아니라 **한 개**다. 전에는 id가 "CLM-" + Date.now()뿐이어서
       같은 밀리초에 접수한 두 건이 같은 id를 갖고, claimReview가 먼저 들어온(= 다른 회원의) 건을
       심사했다 — 창이 맞아도 심사 결과가 남의 진료일로 나왔다. 두 건을 연속 접수해 확인한다. */
    let CID = null;
    try {
      const _snap = localStorage.getItem("hifin_claims");
      localStorage.setItem("hifin_claims", "[]");
      const a = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 100000, date: insAsOfMs() });
      const b = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 120000, date: insAsOfMs() });
      const ra = a.ok ? insService.claimReview(me, a.claim.id) : null;
      CID = { aId: a.ok ? a.claim.id : null, bId: b.ok ? b.claim.id : null,
              distinct: !!(a.ok && b.ok && a.claim.id !== b.claim.id),
              reviewedFee: ra ? ra.fee : null, aFee: a.ok ? a.claim.fee : null,
              nondigitSuffix: /-[0-9A-Z]+$/.test(String(a.ok ? a.claim.id : "")) };
      localStorage.setItem("hifin_claims", _snap == null ? "[]" : _snap);
    } catch (e) { CID = { err: String(e.message) }; }
    /* ── 청구 건의 **진료일**이 심사에 들어가는가(창 밖 과거·미래 양방향) ───────────
       전에는 claimReview가 c.at을 한 번도 보지 않아 창 밖 진료일이 전부 자동승인 10만이었다
       (실측 4건: 2026-12-01 · 2026-08-01 · 2024-12-26 · 2026-10-20 전부 ok payout 100,000).
       진료일은 창에서 상대 오프셋으로 만든다(벽시계 무관 — 달력이 넘어가도 뜻이 안 변한다). */
    let CAT = null;
    try {
      const _Wc = insCheckupWindow(me);
      /* 청구 원장을 행마다 비우고 돌린다 — claimSubmit의 id가 "CLM-" + Date.now()라 같은 ms에
         접수한 두 건이 **같은 id**를 갖고, claimReview가 먼저 들어온 건을 집는다(실측: 개시 전·
         실측 검진일 행이 만기 행의 결과를 되돌려 받았다). 시나리오 격리로 그 교차를 막고
         끝나면 원장을 원복한다(검사가 상태를 남기지 않는다). */
      const _csnap = localStorage.getItem("hifin_claims");
      const _cn0 = JSON.parse(_csnap || "[]").length;
      const _mkc = (at) => { localStorage.setItem("hifin_claims", "[]");
        const cs = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 100000, date: at });
        const rv = cs.ok ? insService.claimReview(me, cs.claim.id) : { ok: false, code: "SUBMIT" };
        return { at: insDayStr(at), ok: !!rv.ok, payout: rv.payout || null, code: rv.code || null,
                 easy: (rv.deny || {}).easy || null, fix: (rv.deny || {}).fix || null, reason: rv.reason || null }; };
      CAT = { win: insDayStr(_Wc.start) + " ~ " + insDayStr(_Wc.end), judged: insDayStr(_Wc.now),
              afterEnd: _mkc(_Wc.end + 26 * 86400000),
              atEnd: _mkc(_Wc.end),
              beforeStart: _mkc(_Wc.start - 36 * 86400000),
              realCheckup: _mkc(new Date(2024, 11, 26).getTime()),
              inWin: _mkc(_Wc.now),
              atStart: _mkc(_Wc.start),
              endDay: insDayStr(_Wc.end), startDay: insDayStr(_Wc.start) };
      localStorage.setItem("hifin_claims", _csnap == null ? "[]" : _csnap);
      CAT.claimsRestored = JSON.parse(localStorage.getItem("hifin_claims") || "[]").length === _cn0;
    } catch (e) { CAT = { err: String(e.message) }; }
    /* ── 중복 반환 경로의 반대편 — 다른 상품의 term은 덮이지 않는다 ────────────────
       검진대비 term 표기를 60일로 바로잡는 보정이 **모든 상품**의 term을 조건 없이 덮어썼다
       (실측: 「1년(자동갱신)·월 42,000·암 3천만」 계약이 재청약 후 「10년·월 42,000·암 3천만」). */
    let DUPO = null;
    try {
      const a = pbPolicyCreate(me, { product: "맞춤 건강보험(가드 대조)", monthly: 42000, cover: "암 3천만", term: "1년(자동갱신)" });
      const b = pbPolicyCreate(me, { product: "맞춤 건강보험(가드 대조)", monthly: 99000, cover: "암 1억", term: "10년" });
      const q = pbPolicies(me).filter((x) => x.product === "맞춤 건강보험(가드 대조)");
      DUPO = { n: q.length, existed: !!b.existed, term: q[0].term, monthly: q[0].monthly, cover: q[0].cover, created: a.policy.term };
      pbPolicyPatch(me, q[0].id, { status: "void" });
    } catch (e) {}
    /* ── 증서 모달이 적는 보험기간 = 그 증서 자신의 창 ──────────────────────────
       직전 변경은 모달에 회원 계약 창을 1순위로 넘겨, 2026-11-20 예약 증서에 그 검진보다
       15일 먼저 끝나는 보험기간을 적었다(실측). 모달과 같은 산식으로 재현한다. */
    let CERTW = null;
    try {
      /* c.date가 있으면 c.at(그 기기가 증서를 기록한 벽시계 시각)으로 떨어지지 않는가 —
         basis "cert" 경로가 c.at을 쓰면 「기기마다 다른 만기」가 그대로 돌아온다. at을 멀리 떨어진
         값으로 두고 insCertAt이 date를 고르는지 본다. */
      const fakeCert = { id: "CERT-BKX00", center: "테스트검진센터", date: "2026-11-20", at: insAsOfMs() - 300 * 86400000 };
      const CW = insWindowOf(insCertAt(fakeCert), "live");
      CERTW = { certDate: insCertAt(fakeCert), fromDate: insCertAt(fakeCert) === new Date(2026, 10, 20).getTime(),
                noDateFallsToAt: insCertAt({ id: "x", at: 12345 }) === 12345,
                start: CW.start, end: CW.end, days: Math.round((CW.end - CW.start) / 86400000) };
    } catch (e) {}
    const MCC = memberCheckupCounsel("내 공복혈당 결과", me);
    const MDA = memberDeepAnalysis("내 건강상태 정밀 분석해줘", me);
    const MCS = memberCheckupCounsel("내 검진 결과 요약", me);
    const MTR = memberCheckupCounsel("내 검진 시점별 비교", me);
    const MIT = memberCheckupCounsel("내 공복혈당 결과", me);
    const _txt = (r) => r ? (r.bubbles || []).map((b) => b.text || (b.card ? [b.card.title].concat(b.card.items || [], b.card.buttons || []).join(" | ") : "")).join(" // ") : null;
    const _nat2024 = (v.checkups || []).find((c) => c.date === "2024-12-26") || {};
    const _natRowSet = {}; (_nat2024.items || []).forEach((it) => { if (it && it.flagRow) _natRowSet[it.flagRow] = 1; });
    const _ckNat = Object.keys(C.items).filter((k) => (C.items[k].series || []).some((pt) => pt.date === "2024-12-26"));
    return JSON.parse(JSON.stringify({
      P: { bio: P.biologicalAge, reg: P.regAge, speed: P.agingSpeed, rank: P.agingRank, overall: P.overall, cg: P.cancerRiskGrade, cgl: P.cancerGradeLabel, birth: P.birth, judgment: P.judgment, hrd: P.highRiskDiseases, hr: P.highRiskCancerTypes },
      V: (v.checkups || []).map((c) => ({ date: c.date, src: c.source, n: (c.items || []).length })),
      VM: vaultCheckupMap(me).map,
      R: { bio: R.bio, reg: R.reg, diff: R.diff, rank: R.agingRank, speed: R.agingSpeed, evalLabel: R.evalLabel, cgLabel: R.cgLabel, cancerTotal: R.cancerTotal,
           costThis: R.costThis, costPeer: R.costPeer, cost10: R.cost10, cost10Peer: R.cost10Peer, organs: R.organs, diseases: R.diseases, cancers: R.cancers,
           hr: R.hr, hrd: R.hrd, selfReal: !!R.selfReal, src: R.src, lineage: R._lineage.source, flags: R.flags.map((f) => f.t) },
      C: { grade: C.nat.grade, gradeLabel: C.nat.gradeLabel, date: C.nat.date, trendLabel: C.trendLabel, years: C.years, abnMain: C.abnMain.length, abnOld: C.abnOld.length, items: Object.keys(C.items).length, selfReal: !!C.selfReal },
      G: { grade: G.grade, sev1: G.sev1, sev2: G.sev2 },
      CP: { dx: CP.diagnoses.map((d) => d.name), meds: CP.meds.length, med: CP.adherence.med, mission: CP.adherence.mission, year: CP.adherence.checkupYear },
      RP: { topPct: RP.risks.map((r) => r.topPct), real: !!RP.real },
      HB: HB,
      INS: { gen: INS.silson.gen, monthly: INS.silson.monthly, riders: INS.riders.length, note: INS.riderNote },
      SOL: { score: SOL.score, grade: SOL.grade, findings: SOL.findings.length },
      RR: { improvedN: RR.improvedN, before: RR.before, after: RR.after, from: RR.fromDate, to: RR.toDate,
            fromProv: RR.fromProvider, toProv: RR.toProvider, same: RR.sameProvider },
      /* 보장기간 단일 근거 — 회원 화면(checkupIns)과 프로 콘솔 ⑨(hmTouchPlan)이 같은 창을 보는가 */
      CKI: { phase: CKI.timeline ? CKI.timeline.phase : null, start: CKI.timeline ? CKI.timeline.start : null, end: CKI.timeline ? CKI.timeline.end : null,
             remainDays: CKI.timeline ? CKI.timeline.remainDays : null, basis: CKI.timeline ? CKI.timeline.basis : null, seed: CKI.timeline ? CKI.timeline.seed : null,
             ended: !!CKI.ended, never: !!CKI.neverActive, src: CKI.coverSrc, cover0: (CKI.coverage || [])[0],
             excl0: (CKI.exclusions || [])[0] },
      W: W ? { start: W.start, end: W.end, phase: W.phase, src: W.src, remainDays: W.remainDays, basis: W.basis, seed: W.seed,
               prior: W.prior ? { start: W.prior.start, end: W.prior.end, ended: W.prior.ended, certId: W.prior.cert && W.prior.cert.id, certDate: W.prior.cert && W.prior.cert.date } : null } : null,
      /* 시연 기준일 상수 — 창의 양쪽(coverFrom · 판정 시각)이 이 한 줄에서 파생되는지 항등식으로 본다 */
      DEMO: { asOf: INS_DEMO.asOf, remainDays: INS_DEMO.remainDays }, ASOF: insAsOfMs(), COVERD: INS_COVER_DAYS,
      POL: (() => { const p = pbPolicies(me).find((x) => /검진.?대비/.test(x.product)) || {}; return { coverFrom: p.coverFrom, coverSeed: p.coverSeed, term: p.term, id: p.id }; })(),
      TP: { items: TP.items.map((x) => x.key), endSrc: TP.endSrc, mend: (TP.items.find((x) => x.key === "mend") || {}).title || null,
            titles: TP.items.filter((x) => /^m(30|7|1)$/.test(x.key)).map((x) => x.title),
            mdue: TP.items.filter((x) => /^m(30|7|1)$/.test(x.key)).map((x) => [x.key, !!x.due]) },
      TPE, CKE, WR, ENS, DUPM, WAIT, TWO, COH, CAT, CID, DUPO, CERTW,
      /* 창 날짜의 **문자열** — 근거 문구·거절 문구·mend 제목에 적힌 날짜를 이 값과 대조한다.
         전에는 src를 보는 단언 4개가 전부 날짜를 보지 않아, insDayStr을 하루 밀어도 통과했다. */
      DS: { start: insDayStr(W.start), end: insDayStr(W.end),
            priorStart: W.prior ? insDayStr(W.prior.start) : null, priorEnd: W.prior ? insDayStr(W.prior.end) : null },
      RV: { ok: !!RV_OK.ok, payout: RV_OK.payout || null, code: RV_OK.code || null },
      RVE: RV_END ? { ok: !!RV_END.ok, code: RV_END.code || null, reason: RV_END.reason || null, easy: (RV_END.deny || {}).easy || null, fix: (RV_END.deny || {}).fix || null } : null,
      /* 배지의 「N항목」 = 표의 행 수인가 */
      N: { natRows: C.natRows, compRows: C.compRows, vaultNatRows: Object.keys(_natRowSet).length, ckNatRows: _ckNat.length,
           ckNatKeys: _ckNat.sort(), unmapped: C.unmapped, trendNote: C.trendNote, cmpLabel: C.trendCompareLabel },
      /* 하이 — 본인 계정에서 검진데이터 RAG가 실제로 답하는가 */
      HI: { mcc: _txt(MCC), mda: _txt(MDA), mcs: _txt(MCS), mtr: _txt(MTR), mit: _txt(MIT) },
      VP: (v.checkups || []).map((c) => ({ date: c.date, provider: c.provider, srcRows: c.srcRows, unmapped: (c.unmapped || []).length })),
      CERTS: JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"),
      CHAIN: (typeof chainAll === "function" ? chainAll() : JSON.parse(localStorage.getItem("hifin_hashchain") || "[]")).map((b) => b.note || "")
    }));
  `);
} catch (e) { fail.push("본인 체인 실행 실패: " + e.message); }

if (S) {
  chk(S.P.bio === 52.5 && S.R.bio === 52.5, "생체나이 52.5", [S.P.bio, S.R.bio]);
  chk(S.P.reg === 54.1 && S.R.reg === 54.1, "주민등록나이 54.1", [S.P.reg, S.R.reg]);
  chk(S.R.diff === -1.6, "생체-주민등록 차이 -1.6세", S.R.diff);
  chk(S.R.speed === 0.97, "노화속도 0.97배", S.R.speed);
  chk(S.R.rank === 37, "노화등수 37등", S.R.rank);
  chk(S.R.evalLabel === "좋음", "종합평가 「좋음」", S.R.evalLabel);
  chk(S.R.cancerTotal === 4 && S.R.cgLabel === "낮은 편", "암 4등급/10 · 낮은 편", [S.R.cancerTotal, S.R.cgLabel]);
  chk(JSON.stringify(S.R.organs.map((o) => o[1])) === JSON.stringify([50.9, 50.7, 54.4, 56.2, 53.4]), "장기 5종 50.9·50.7·54.4·56.2·53.4", S.R.organs);
  chk(JSON.stringify(S.R.organs.map((o) => o[2])) === JSON.stringify(["좋음", "좋음", "나쁨", "나쁨", "좋음"]), "장기 판정 간·췌장 「나쁨」 유지", S.R.organs);
  const dm = S.R.diseases.find((d) => d[0] === "당뇨병"), ht = S.R.diseases.find((d) => d[0] === "고혈압");
  chk(dm && dm[1] === 6.2 && dm[2] === "10.9%", "당뇨병 +6.2% / 10년 10.9%", dm);
  chk(ht && ht[1] === -3.9 && ht[2] === "22.3%", "고혈압 -3.9% / 10년 22.3%", ht);
  chk(S.R.cancers.some((c) => c[0] === "췌장암" && c[1] === "경고"), "췌장암 경고 유지", S.R.cancers);
  chk(JSON.stringify(S.R.hr) === JSON.stringify(["췌장암"]), "고위험 암 = 췌장암", S.R.hr);
  chk(S.R.costThis === 2381477 && S.R.costPeer === 2247942 && S.R.cost10 === 3089692 && S.R.cost10Peer === 2915692, "의료비 4종(본인·동년배·10년·10년 동년배)", [S.R.costThis, S.R.costPeer, S.R.cost10, S.R.cost10Peer]);
  chk(S.R.selfReal === true && S.R.lineage === "self-real", "demoReport가 실측 경로", [S.R.selfReal, S.R.lineage]);
  chk(/국민건강보험공단|메디에이지/.test(S.R.src || ""), "출처 고지 문자열", S.R.src);

  chk(S.V.length === 2 && S.V.every((c) => c.src === "self-real"), "금고 실측 2건", S.V);
  chk(S.V.some((c) => c.date === "2024-12-26") && S.V.some((c) => c.date === "2020-06-23"), "금고 검진일 2024-12-26 · 2020-06-23", S.V.map((c) => c.date));
  chk(S.VM.glucose === 100 && S.VM.ast === 36 && S.VM.alt === 43 && S.VM.hb === 17 && S.VM.sbp === 119 && S.VM.dbp === 78 && S.VM.bmi === 24.9,
    "금고 최신값 공복혈당100·AST36·ALT43·혈색소17·혈압119/78·BMI24.9", S.VM);

  chk(S.C.grade === "정상B" && /유질환자\(고혈압/.test(S.C.gradeLabel), "국가검진 판정 「정상B · 유질환자(고혈압, 잘 조절됨)」", S.C.gradeLabel);
  chk(S.C.abnMain === 4, "이상·의심 4항목(국가검진 기준)", S.C.abnMain);
  chk(S.C.trendLabel === "해당 없음", "진행형태 「해당 없음」(2시점 — 추이 산출 불가)", S.C.trendLabel);
  chk(JSON.stringify(S.C.years) === JSON.stringify([2020, 2024]), "검진 시점 2020·2024", S.C.years);
  chk(S.G.grade !== "고위험" && S.G.grade !== "긴급", "건강상태 등급에 「고위험·긴급」 없음", S.G.grade);
  chk(S.G.grade === "지속관리" && S.G.sev1 === 4 && S.G.sev2 === 0, "건강상태 「지속관리」 · 관리 4항목", S.G);
  chk(JSON.stringify(S.CP.dx) === JSON.stringify(["고혈압(잘 조절됨)"]), "확정 진단 = 고혈압(잘 조절됨) 1종", S.CP.dx);
  chk(S.CP.meds === 0 && S.CP.med === null && S.CP.mission === null && S.CP.year === null, "약물·복약 순응도·생활미션·수검연도 = 해당 없음", S.CP);
  chk(S.RP.topPct.every((p) => p === null), "위험 밴드(상위 N%) 표시 안 함", S.RP.topPct);
  chk(S.HB.band === "—" && S.HB.grade === "지속관리" && S.HB.sevN === 4 && S.HB.year === "2024년", "프로 콘솔 행(등급·관리 항목·밴드·검진연도)", S.HB);
  chk(S.INS.monthly === 154000 && S.INS.gen === "2세대", "실손 월 154,000원 · 2세대(실계약)", S.INS);
  chk(S.INS.riders === 0 && /확인 필요/.test(S.INS.note || ""), "진단비 특약 = 확인 필요(금액 미생성)", S.INS);
  chk(S.SOL.score === null && S.SOL.grade === "해당 없음", "보장 충실도 점수 = 해당 없음", S.SOL);
  chk(S.RR.before === 154000 && S.RR.from === "2020-06-23" && S.RR.to === "2024-12-26", "요율 재산정 비교 시점·기준 보험료", S.RR);

  /* ── ④ 보장기간 단일 근거(회원 화면 = 프로 콘솔 ⑨) ── */
  const _DAY = 86400000;
  chk(S.CKI.start === (S.W && S.W.start) && S.CKI.end === (S.W && S.W.end) && S.CKI.phase === (S.W && S.W.phase)
    && S.CKI.remainDays === (S.W && S.W.remainDays) && S.CKI.basis === (S.W && S.W.basis) && S.CKI.seed === (S.W && S.W.seed),
    "검진대비보험 보장기간 = insCheckupWindow 한 소스(시작·종료·국면·잔여일·근거·시드 전부 동일)", [S.CKI, S.W]);
  /* 형 지시(2026-10-06) 「만기 경과되지 않고 한 달이 남도록」 — 문자열 기대값이 아니라 항등식·부등식으로 박는다.
     ① 기준일이 창 **안**에 있다 ② 만기 = 기준일 + remainDays ③ 창 길이 = INS_COVER_DAYS
     ④ coverFrom은 기준일에서 역산된 값이다. 하나라도 벽시계로 돌아가면 즉시 깨진다. */
  chk(S.CKI.phase === "보장 중" && S.CKI.ended === false, "회원 화면 「보장 중」(만기 경과 아님)", [S.CKI.phase, S.CKI.ended]);
  /* ⚠️ 아래 **절대 단언**이 없으면 이 블록의 항등식은 전부 동어반복이다 —
     모든 식이 S.ASOF(= insAsOfMs() 그 자체)를 기준으로 쓰여 있어 asOf가 어디로 움직여도 참이다.
     실증: insAsOfMs를 `const d = new Date; d.setHours(0,0,0,0); return d.getTime();`로 바꿨더니
     창이 2026.9.8 ~ 2026.11.7로 이틀 밀리고 날마다 1일씩 움직이는데 가드는 **145/0**이었다
     (소스 문자열 검사 /asOf:\s*"2026-10-06"/는 상수가 선언만 남아 있으면 통과한다).
     그래서 기준일·창·coverFrom을 **고정 날짜 리터럴**과 직접 맞춘다. 형이 기준일을 옮기면
     이 세 줄이 FAIL하고, 그때 리터럴을 같이 고치는 것이 의도된 절차다. */
  chk(S.ASOF === new Date(2026, 9, 6).getTime(), "판정 시각 = 2026-10-06 그 자체(벽시계 파생 아님 · 고정 리터럴 대조)", [S.ASOF, new Date(2026, 9, 6).getTime()]);
  chk(S.CKI.start === new Date(2026, 8, 6).getTime() && S.CKI.end === new Date(2026, 10, 5).getTime(),
    "보장 창의 절대 날짜 = 2026-09-06 ~ 2026-11-05(고정 리터럴 대조)", [new Date(S.CKI.start).toISOString().slice(0, 10), new Date(S.CKI.end).toISOString().slice(0, 10)]);
  chk(S.POL.coverFrom === new Date(2026, 8, 5).getTime(), "계약 coverFrom의 절대 날짜 = 2026-09-05(고정 리터럴 대조)", new Date(S.POL.coverFrom).toISOString().slice(0, 10));
  chk(S.DS.start === "2026. 9. 6." && S.DS.end === "2026. 11. 5.", "창 날짜 문자열 = 「2026. 9. 6.」 ~ 「2026. 11. 5.」(포맷터까지 고정)", S.DS);
  chk(S.DS.priorStart === "2024. 12. 27." && S.DS.priorEnd === "2025. 2. 25.", "앞선 창 날짜 문자열 = 「2024. 12. 27.」 ~ 「2025. 2. 25.」", S.DS);
  /* ── 단언 승계 기록(삭제·완화 0건 증명) ────────────────────────────────────────
     HEAD(e9fb6dc)에서 사라진 chk 라벨은 3건이고, 셋 다 **더 강한 단언으로 승계**됐다.
       ① 「검진대비보험 보장기간 = insCheckupWindow 한 소스(회원 화면·프로 콘솔 동일)」
          → 같은 조건 + 국면·잔여일·근거·시드까지 비교하는 단언으로 교체(위).
       ② 「만기 연도 2025(증서 날짜 기준 · 금고 시드 시각 아님)」 — 형 지시로 창이 2026년이 되어
          연도 리터럴 2025는 의미를 잃었다. 뜻(「만기가 그 기기의 벽시계에서 나오지 않는다」)은
          절대 날짜 대조 + 아래 한 줄 + ⑪ 벽시계 부재 스캔으로 **연도보다 강하게** 승계한다.
       ③ 「프로 콘솔 ⑨도 만기 경과 1행(mend)」 — 앞절은 items 완전 일치 단언으로, 뒷절
          (!/undefined/)은 제목을 페이로드에 담아 날짜 일치까지 보는 단언으로 승계(아래 TPE).
     [2026-10-08 2차] 이번에 **문구가 바뀐** 라벨 4건도 전부 더 강한 단언으로 승계했다(삭제 0건).
       ④ 「앞선 보장 창 렌더 블록 추출(공집합 금지)」 → lazy `)}`에서 429자로 끊기던 추출을
          중괄호 깊이 추출로 바꾸고 임계를 120자 → **500자**로 올렸다. 더해 문장의 **양 끝**
          (「이미 지난 기간이에요」·「지금 적용되는 창은」·「예요.」)을 모두 요구하고,
          어휘 금칙을 S.timeline.prior를 참조하는 **모든 줄**에 겹쳐 걸었다.
       ⑤ 「산출 날짜에 「실측」을 붙이지 않고 실측은 **검진일**로 한정해 적는다」 →
          블록 안의 「실측」을 **전면 금지**하고 중립 라벨 「연계 검진일」을 요구한다(1단어 허용 →
          0단어 허용). 이 블록은 코호트·체험 회원의 **합성** 검진일로도 렌더되기 때문이다.
       ⑥ 「발급 경로가 만든 증서를 insCheckupCert가 찾아낸다(ⓑ 폴백이 산다)」 → 그 상태(basis
          "cert")가 결함이었다(창의 주인이 증서가 되어 발급 직후 「보장 종료」). 창의 주인을
          계약(basis "policy")으로 옮기고, 구 단언의 뜻은 ⓐ 증서 동봉(certInsured) ⓑ coverFrom을
          비우면 basis가 실제로 cert로 떨어짐 ⓒ 그 확인 뒤 계약 원복 — 3건으로 승계했다.
       ⑦ 「과거 검진으로 발급하면 즉시 보장 중 …」 → 조건에 remainDays ≥ 1 · startsInDays === null ·
          만기가 미래(endAfterNow)를 더하고, 시나리오 날짜를 고정 리터럴에서 **벽시계 상대
          오프셋**으로 바꿨다(그 리터럴이 43일 뒤 가드를 통째로 FAIL시키는 시한폭탄이었다). */
  chk(new Date(S.POL.coverFrom).getFullYear() === 2026 && S.CKI.end === new Date(2026, 10, 5).getTime() && S.CKI.basis === "policy",
    "만기는 계약 보장 개시일에서 나온다(그 기기가 금고를 시드한 벽시계 시각 아님 — 구 「만기 연도」 단언의 승계)", [S.POL.coverFrom, S.CKI.basis]);
  chk(S.ASOF != null && S.CKI.start <= S.ASOF && S.ASOF < S.CKI.end, "기준일이 보장 창 안에 있다(start ≤ asOf < end)", [S.CKI.start, S.ASOF, S.CKI.end]);
  chk(S.CKI.end === S.ASOF + S.DEMO.remainDays * _DAY, "만기 = 기준일 + remainDays(항등식)", [S.CKI.end, S.ASOF + S.DEMO.remainDays * _DAY]);
  chk(S.CKI.remainDays === S.DEMO.remainDays && S.DEMO.remainDays === 30, "잔여일 = 상수 remainDays = 30", [S.CKI.remainDays, S.DEMO.remainDays]);
  /* 손잡이(INS_DEMO.remainDays)의 범위 — 전에는 60 초과가 insDemoCoverFrom의 Math.max(1, …)에
     조용히 눌렸고 0은 「보장 중 · 만기까지 0일」을 냈다. 범위를 벗어나면 즉시 FAIL시킨다. */
  chk(S.DEMO.remainDays >= 1 && S.DEMO.remainDays <= S.COVERD, "손잡이 범위 1 ≤ INS_DEMO.remainDays ≤ INS_COVER_DAYS", [S.DEMO.remainDays, S.COVERD]);
  chk(S.CKI.remainDays != null && S.CKI.remainDays >= 1 && S.CKI.remainDays <= S.COVERD,
    "잔여일은 보험기간을 넘지 않는다(1 ≤ remainDays ≤ 60 — 「60일 상품에 63일」 금지)", [S.CKI.remainDays, S.COVERD]);
  chk(S.CKI.end - S.CKI.start === S.COVERD * _DAY, "창 길이 = INS_COVER_DAYS", [(S.CKI.end - S.CKI.start) / _DAY, S.COVERD]);
  chk(S.POL.coverFrom === S.ASOF - (S.COVERD - S.DEMO.remainDays + 1) * _DAY, "계약 coverFrom = 기준일 역산(항등식)", [S.POL.coverFrom, S.ASOF]);
  chk(S.CKI.basis === "policy" && S.CKI.seed === "demo" && S.POL.coverSeed === "demo" && S.POL.term === S.COVERD + "일(검진 연동)",
    "근거는 계약 coverFrom(시연 시드) · 계약 기간 표기도 60일", [S.CKI.basis, S.CKI.seed, S.POL.term]);
  chk(/CERT-JSR2024A/.test(String(S.CKI.src || "")), "보장기간 근거 문구 = 증서 CERT-JSR2024A", S.CKI.src);
  /* 근거 문구에 적히는 날짜가 같은 배지의 시작일과 어긋나도 전에는 통과했다 —
     src를 보는 단언 4개가 전부 날짜를 보지 않았고, endSrc와 src는 같은 함수에서 나오므로
     동일성 검사도 함께 틀어졌다(실증: insDayStr을 하루 밀면 배지가 「2026. 9. 6. ~ … ·
     계약 보장 개시일 2026. 9. 7.」이 되는데 145/0). 창 값에서 문자열을 만들어 대조한다. */
  chk(String(S.CKI.src || "").indexOf(S.DS.start) >= 0, "근거 문구의 개시일 = 창의 start(한 줄 안에서 같은 숫자)", [S.CKI.src, S.DS.start]);
  chk(!/undefined|NaN|Invalid/.test(String(S.CKI.src || "")), "근거 문구에 undefined·NaN·Invalid 없음", S.CKI.src);
  /* 「1차 증서」라고 박던 라벨 — 데이터는 그 증서가 몇 번째인지 말해 주지 않는다 */
  chk(!/1차 증서/.test(String(S.CKI.src || "")), "근거 문구가 증서를 「1차」로 단정하지 않는다(연계 증서)", S.CKI.src);
  chk(/시연 시드/.test(String(S.CKI.src || "")) && !/실측/.test(String(S.CKI.src || "")), "기준일 파생 날짜는 「시연 시드」 표기(「실측」 배지 금지)", S.CKI.src);
  chk(S.CKI.seed === "demo" && S.CKI.start === new Date(new Date(2026, 8, 5).getTime() + 86400000).getTime(),
    "seed 「demo」 ⇔ start가 insDemoCoverFrom() 파생(쌍방향 — 벽시계 근거에 시연 기준일 칩이 붙지 않는다)", [S.CKI.seed, S.DS.start]);
  /* 1차 보장(실측 증서 2024-12-26)은 읽기만 — 창 산식 그대로 2024-12-27 ~ 2025-02-25 · 이미 종료 */
  const _pr = (S.W && S.W.prior) || null;
  chk(!!_pr && _pr.certId === "CERT-JSR2024A" && _pr.certDate === "2024-12-26", "1차 보장 이력이 실측 증서를 가리킨다", _pr);
  chk(!!_pr && _pr.start === new Date(2024, 11, 27).getTime() && _pr.end === _pr.start + S.COVERD * _DAY && _pr.ended === true,
    "1차 보장 창 = 2024-12-27 + 60일 · 만기 종료(실측 불변)", _pr);
  chk(!!_pr && _pr.end < S.CKI.start, "앞선 창은 현재 창보다 **앞**에서 끝났다(두 창이 겹치지 않음)", [_pr && _pr.end, S.CKI.start]);
  /* 양방향 ⓐ 보장 중 → m30·m7·m1 3행 · mend 0행 */
  chk(JSON.stringify(S.TP.items) === JSON.stringify(["m30", "m7", "m1"]), "보장 중이면 프로 ⑨는 만기 예정 3행(m30·m7·m1)", S.TP.items);
  chk(S.TP.items.indexOf("mend") < 0, "보장 중이면 만기 경과 행(mend) 0행", S.TP.items);
  chk(JSON.stringify(S.TP.mdue) === JSON.stringify([["m30", true], ["m7", false], ["m1", false]]), "잔여 30일 → D-30만 도래(D-7·D+1 미도래)", S.TP.mdue);
  chk(S.TP.endSrc === S.CKI.src, "③탭 「만기 계산」 칩 = 회원 화면 근거 문구(같은 변수)", [S.TP.endSrc, S.CKI.src]);
  chk(S.RV.ok === true && S.RV.payout === 100000, "보장 중이면 검진 청구가 자동승인(정액 10만)", S.RV);
  /* 양방향 ⓑ 만기 경과 → mend 1행 · m* 0행 · 청구는 COVER_END로 거절 */
  chk(!!S.TPE && S.TPE.phase === "보장 종료" && S.TPE.ended === true && S.TPE.remainDays === null && S.TPE.startsInDays === null,
    "만기 경과 국면: 국면·ended · 잔여일은 null(「보장 종료 · 만기까지 0일」 금지)", S.TPE);
  /* ⚠️ 복원 — HEAD의 `!/undefined/.test(String(S.TP.mend))` 뒷절이 대체 없이 사라졌던 자리다.
     새 페이로드가 제목 문자열을 담지 않아, mend 제목이 「만기 경과(undefined)」가 돼도 145/0이었다
     (실증: healthMate.js의 `${insDayStr(end)}` 보간을 미정의 변수로 치환). 원래보다 강하게 —
     ① undefined·NaN·Invalid 금지 ② 제목 안의 날짜가 **창의 만기일과 같은 문자열**인지까지 본다. */
  chk(!!S.TPE && !/undefined|NaN|Invalid/.test(String(S.TPE.mendTitle)) && String(S.TPE.mendTitle).indexOf(S.TPE.endDay) >= 0,
    "mend 행 제목에 만기 날짜가 창과 같은 문자열로 표기(undefined·NaN·Invalid 금지)", [S.TPE.mendTitle, S.TPE.endDay]);
  chk(Array.isArray(S.TP.titles) && S.TP.titles.length === 3 && S.TP.titles.every((t) => t && !/undefined|NaN|Invalid/.test(String(t))),
    "보장 중 국면의 m30·m7·m1 제목 3건에도 undefined·NaN·Invalid 없음", S.TP.titles);
  chk(!!S.TPE && JSON.stringify(S.TPE.items) === JSON.stringify(["mend"]) && S.TPE.mendDue === true, "만기 경과면 mend 1행이고 m30·m7·m1 0행", S.TPE);
  chk(!!S.CKE && S.CKE.phase === "보장 종료" && S.CKE.ended === true && /만기 경과/.test(String(S.CKE.note || "")), "만기 경과면 회원 화면도 「보장 종료」 안내", S.CKE);
  /* 「이 계약이 자기 보장 기간을 산 적이 있나」 — 창이 계약 생성보다 **앞에서** 끝났으면 그 과거
     보장은 데이터에 없다. 전에는 그 경우에도 타임라인 4단계가 전건 점등되고 「보장 기간에는
     이렇게 지켜드렸어요」(과거완료)가 떴다. 창이 계약 **뒤에** 끝난 경우에는 과거형이 참이므로
     neverActive가 false여야 한다 — 양방향으로 본다(한쪽만 보면 과거형을 통째로 지워도 통과한다). */
  chk(!!S.CKE && S.CKE.never === true, "창이 계약 생성보다 앞에서 끝났으면 「산 적 없는 보장」으로 표시(neverActive)", S.CKE);
  chk(!!S.CKE && S.CKE.endedOldContract === true && S.CKE.neverOldContract === false,
    "계약이 창보다 먼저 있었던 만기 경과는 neverActive가 아니다(참인 과거형을 지우지 않는다)", S.CKE);
  chk(S.CKI.never === false, "보장 중인 현재 계약은 neverActive가 아니다", [S.CKI.never, S.CKI.phase]);
  /* 같은 만기일이 한 화면에서 두 철자로 서지 않는가 — endedNote는 toLocaleDateString,
     거절 문구·mend 행은 insDayStr이었다. 이제 네 문구가 같은 포맷터 하나를 쓴다. */
  chk(!!S.CKE && String(S.CKE.note || "").indexOf(S.TPE.endDay) >= 0,
    "회원 화면 만기 안내의 날짜 = 창의 end(거절 문구·mend 행과 같은 철자)", [S.CKE.note, S.TPE.endDay]);
  chk(!!S.RVE && S.RVE.ok === false && S.RVE.code === "COVER_END", "만기 경과 후 검진 청구는 자동승인되지 않는다(COVER_END)", S.RVE);
  chk(!!S.RVE && /다음 검진 주기/.test(String(S.RVE.fix || "") + String(S.RVE.reason || "")) && /끝났어요/.test(String(S.RVE.easy || "")),
    "만기 거절 문구에 만기 날짜 + 「다음 검진 주기」 재개 경로", S.RVE);
  /* 거절 문구의 날짜도 창에서 나온 그 문자열이어야 한다 — 전에는 문구 포함만 봤다 */
  chk(!!S.RVE && String(S.RVE.easy || "").indexOf(S.TPE.endDay) >= 0 && String(S.RVE.reason || "").indexOf(S.TPE.endDay) >= 0,
    "만기 거절 문구의 만기일 = 창의 end(같은 문자열)", [S.RVE.easy, S.TPE.endDay]);
  /* 이미 시드가 깔린 기기 — 조기 반환에 막히지 않고 보정되는가 / 중복 반환 경로가 병합하는가 */
  chk(!!S.ENS && S.ENS.beforeBasis !== "policy" && S.ENS.afterBasis === "policy" && S.ENS.afterSeed === "demo",
    "구 시드 계약(coverFrom 없음)도 selfEnsureInsSeed 한 번에 보정된다(v3·v4 조기 반환에 막히지 않음)", S.ENS);
  chk(!!S.ENS && S.ENS.afterEnd === S.ASOF + S.DEMO.remainDays * _DAY && S.ENS.term === S.COVERD + "일(검진 연동)" && S.ENS.coverFrom === S.POL.coverFrom,
    "보정 결과가 기준일 파생과 같다(만기·기간 표기·coverFrom)", S.ENS);
  chk(!!S.DUPM && S.DUPM.existed === true && S.DUPM.n === 1 && S.DUPM.coverFrom === S.POL.coverFrom && S.DUPM.coverSeed === "demo" && S.DUPM.term === S.COVERD + "일(검진 연동)",
    "pbPolicyCreate 중복 반환 경로가 coverFrom·coverSeed·term을 병합(계약은 1건 유지)", S.DUPM);
  chk(!!S.DUPO && S.DUPO.n === 1 && S.DUPO.existed === true && S.DUPO.term === "1년(자동갱신)" && S.DUPO.monthly === 42000 && S.DUPO.cover === "암 3천만",
    "중복 반환 경로가 **다른 상품**의 term·monthly·cover를 덮지 않는다(검진대비 보정 전용)", S.DUPO);

  /* ── ④-2 세 번째 국면 「보장 개시 대기」(가드에 0건이던 축) ── */
  chk(!!S.WAIT && S.WAIT.phase === "보장 개시 대기" && S.WAIT.ended === false, "개시 대기 국면이 국면 이름으로 잡힌다", S.WAIT);
  chk(!!S.WAIT && S.WAIT.remainDays === null && S.WAIT.ckRemain === null,
    "개시 대기에는 「만기까지 N일」이 **구조적으로** 없다(remainDays === null — 「60일 상품에 63·106일」 금지)", S.WAIT);
  chk(!!S.WAIT && S.WAIT.startsInDays === 11 && S.WAIT.startDay === "2026. 10. 17.",
    "개시 대기에는 개시까지 남은 일수·개시일이 적힌다(기준일 +10일 시나리오 = 11일 · 2026-10-17)", S.WAIT);
  chk(!!S.WAIT && S.WAIT.rvOk === false && S.WAIT.rvCode === "NO_CONTRACT"
    && String(S.WAIT.rvEasy || "").indexOf(S.WAIT.startDay) >= 0 && String(S.WAIT.rvFix || "").indexOf(S.WAIT.startDay) >= 0
    && !/내일/.test(String(S.WAIT.rvFix || "")),
    "개시 전 거절 문구가 **보장 개시일**을 적는다(「발급 다음날」·「내일 다시 청구」 금지 — 고정 기준일에서 그 내일은 오지 않는다)", S.WAIT);

  /* ── ④-3 증서 2건(예약완료 경로가 만드는 모양) ── */
  chk(!!S.TWO && S.TWO.n === 3 && S.TWO.latest === "CERT-BK9Z1", "증서 3건 시나리오가 실제로 3건을 만든다(검사가 공집합이 아니다)", S.TWO);
  chk(!!S.TWO && JSON.stringify(S.TWO.order) === JSON.stringify(["CERT-JSR2024A", "CERT-BK9Z2", "CERT-BK9Z1"]),
    "내 증서 목록이 **증서 날짜** 오름차순(저장 순서가 아니라 날짜로 가린다)", S.TWO.order);
  chk(!!S.TWO && S.TWO.firstId === "CERT-JSR2024A" && /CERT-JSR2024A/.test(String(S.TWO.src || ""))
    && !/CERT-BK9Z1/.test(String(S.TWO.src || "")) && !/CERT-BK9Z2/.test(String(S.TWO.src || "")),
    "증서가 여러 건이어도 근거 문구는 **가장 이른** 증서(CERT-JSR2024A)를 가리킨다(최신·중간 증서를 1차로 부르지 않는다)", S.TWO);
  chk(!!S.TWO && S.TWO.priorId === "CERT-JSR2024A" && S.TWO.priorStart === new Date(2024, 11, 27).getTime(),
    "증서가 여러 건이어도 앞선 보장 창 1행이 실측 증서(2024-12-27)로 유지된다", S.TWO);
  chk(!!S.TWO && S.TWO.start === S.CKI.start && S.TWO.end === S.CKI.end && S.TWO.restoredSrc === S.CKI.src,
    "증서 다건이 현재 창을 흔들지 않고, 시나리오 뒤 증서 원장이 원복된다", [S.TWO.restoredSrc, S.CKI.src]);

  /* ── ④-4 회원이 실제로 누르는 발급 경로(가드에 0건이던 축) ── */
  chk(!!S.COH && !S.COH.err, "코호트 발급 시나리오 실행", S.COH && S.COH.err);
  /* ⚠️ 구 단언 「발급 경로의 basis === "cert"」의 **승계**(2026-10-08) — 그 상태 자체가 결함이었다.
     증서 날짜(= 연계 검진일 시드 리터럴)가 창의 주인이 되면 60일 창이 이미 닫혀 있어 발급 직후
     「보장 종료」가 됐다. 이제 창의 주인은 **계약**(basis "policy")이고, 구 단언이 지키려던 뜻
     (「발급 경로가 만든 증서를 insCheckupCert가 찾아낸다 = ⓑ 폴백 사다리가 살아 있다」)은
     ① 증서 동봉(certInsured) ② coverFrom을 비우면 basis가 실제로 cert로 떨어짐(fresh.certFallbackBasis)
     두 단언으로 **더 강하게** 승계한다. */
  chk(!!(S.COH && S.COH.past) && S.COH.past.issueOk === true && S.COH.past.certInsured === true && S.COH.past.basis === "policy",
    "발급 경로가 만든 증서를 insCheckupCert가 찾아내고, 창의 주인은 계약(basis policy)이다", S.COH && S.COH.past);
  chk(!!(S.COH && S.COH.past) && S.COH.past.phase === "보장 중" && S.COH.past.remainDays != null
    && S.COH.past.remainDays >= 1 && S.COH.past.remainDays <= S.COVERD && S.COH.past.startsInDays === null
    && S.COH.past.endAfterNow === true && S.COH.past.claimOk === true,
    "과거 검진으로 발급하면 즉시 「보장 중」이고 청구가 자동승인된다(영구 「보장 개시 대기」 금지 — 날짜 리터럴 없이 국면·관계로 단언)", S.COH && S.COH.past);
  chk(!!(S.COH && S.COH.future) && S.COH.future.phase === "보장 개시 대기" && S.COH.future.remainDays === null
    && S.COH.future.startsInDays != null && S.COH.future.startsInDays >= 1 && S.COH.future.startAfterNow === true
    && S.COH.future.claimOk === false && !/내일/.test(String(S.COH.future.claimFix || "")),
    "미래 예약으로 발급하면 개시 대기이고, 거절 문구가 지킬 수 있는 날짜를 적는다", S.COH && S.COH.future);
  /* 시나리오 날짜가 **벽시계 상대값**인지 — 고정 리터럴로 돌아가면 43일 뒤 달력만으로 FAIL한다 */
  chk(!!S.COH && /^\d{4}-\d{2}-\d{2}$/.test(String(S.COH.pastIso)) && /^\d{4}-\d{2}-\d{2}$/.test(String(S.COH.futureIso))
    && S.COH.pastIso !== "2026-09-20" && S.COH.futureIso !== "2026-11-20",
    "코호트 시나리오 검진일이 벽시계 상대 오프셋에서 나온다(고정 리터럴 2026-09-20·2026-11-20 금지 — 가드 안 시한폭탄)", [S.COH && S.COH.pastIso, S.COH && S.COH.futureIso]);
  chk(!!(S.COH && S.COH.past) && S.COH.past.seed === "live" && S.COH.future.seed === "live",
    "증서·계약 생성 기반 창은 seed 「live」 — 벽시계 근거에 「시연 기준일」 칩이 붙지 않는다", [S.COH && S.COH.past.seed, S.COH && S.COH.future.seed]);
  /* ── ④-4b **금고를 주입하지 않은** 발급 — 회원이 실제로 들고 있는 시드 그대로 ──────────
     주입 시나리오만 돌면 실제 회원이 겪는 결함이 전건 통과한다(실측: 코호트 42·7·113과 체험
     회원 전건이 발급 직후 phase 「보장 종료」 · claimReview COVER_END · 알림은 「보장 개시
     2025. 11. 2. 0시」 — 11개월 전에 개시·종료된 창을 오늘 체결한 계약에 붙여 말했다). */
  chk(!!(S.COH && S.COH.fresh) && !S.COH.freshErr, "주입 없는 발급 시나리오 실행(코호트 로그인 시드 그대로)", S.COH && S.COH.freshErr);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.issueOk === true && S.COH.fresh.phase !== "보장 종료"
    && S.COH.fresh.ended === false && S.COH.fresh.ckEnded === false && S.COH.fresh.endedNote === null,
    "금고를 주입하지 않고 코호트/체험 회원 그대로 발급하면 phase가 「보장 종료」가 아니다(발급 즉시 영구 청구 거절 금지)", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.endAfterNow === true && S.COH.fresh.never === false
    && S.COH.fresh.claimCode !== "COVER_END",
    "발급 직후 보장 만기가 **미래**이고, 이 계약이 산 적 없는 과거 보장을 단정하지 않는다(neverActive false)", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.startsInDays === 1 && S.COH.fresh.claimCode === "NO_CONTRACT"
    && String(S.COH.fresh.claimFix || "").indexOf(S.COH.fresh.badgeStart) >= 0,
    "연계 검진이 창 밖이면 발급일을 하한으로 내려 **다음날 0시** 개시 — 거절 문구의 그 날짜는 실제로 온다", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.issueWinStart === S.COH.fresh.badgeStart
    && String(S.COH.fresh.notifD || "").indexOf(S.COH.fresh.badgeStart) >= 0,
    "발급 반환 창·발급 알림·보장 배지가 **같은 개시일 문자열**을 말한다(토스트와 카드가 다른 날을 적지 않는다)", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.basis === "policy" && S.COH.fresh.seed === "live"
    && String(S.COH.fresh.src || "").indexOf(S.COH.fresh.badgeStart) >= 0 && !/시연 시드/.test(String(S.COH.fresh.src || "")),
    "발급 창의 근거는 계약 coverFrom · 시드 live(실계약 창에 「시연 시드」 꼬리가 붙지 않는다)", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.certN === 1 && S.COH.fresh.certInsured === true
    && S.COH.fresh.certFallbackBasis === "cert" && S.COH.fresh.certFallbackSeed === "live",
    "발급 증서에 insured가 동봉돼 ⓑ 폴백(증서 날짜)이 실제로 도달 가능하다(coverFrom을 비우면 basis가 cert로 떨어진다)", S.COH && S.COH.fresh);
  chk(!!(S.COH && S.COH.fresh) && S.COH.fresh.restoredBasis === "policy" && S.COH.fresh.restoredStart === S.COH.fresh.badgeStart,
    "폴백 확인 시나리오가 계약을 원복한다(검사가 발급 계약을 바꿔 두지 않는다)", S.COH && S.COH.fresh);

  /* ── ④-6 청구 건의 **진료일**이 심사에 들어가는가(창 밖 과거·미래 양방향) ─────────
     전에는 claimReview가 c.at을 **한 번도** 보지 않았다 — 개시·만기를 얼어 있는 판정 시각으로만
     갈라서, 보장 창 밖의 진료일로 접수한 검진 청구가 그대로 자동승인됐다(실측 4건: 진료일
     2026-12-01 → ok payout 100,000 / 2026-08-01 → ok 100,000 / 2024-12-26 → ok 100,000 /
     2026-10-20 → ok). 같은 카드의 면책 목록은 바로 두 줄 아래에서 그런 건을 면책이라 적었다.
     가드 237개 중 청구 진료일을 보는 단언은 0건이었다(COVER_END 단언은 창 자체를 닫은 시나리오뿐). */
  chk(!!S.CAT && !S.CAT.err, "청구 진료일 시나리오 실행", S.CAT && S.CAT.err);
  chk(!!S.CAT && S.CAT.inWin.ok === true && S.CAT.inWin.payout === 100000 && S.CAT.atStart.ok === true && S.CAT.atStart.payout === 100000,
    "창 **안** 진료일(판정 시각 · 개시일 0시)은 자동승인 정액 10만(start 경계는 포함)", S.CAT && [S.CAT.inWin, S.CAT.atStart]);
  chk(!!S.CAT && S.CAT.afterEnd.ok === false && S.CAT.afterEnd.code === "COVER_END"
    && String(S.CAT.afterEnd.easy).indexOf(S.CAT.afterEnd.at) >= 0 && String(S.CAT.afterEnd.easy).indexOf(S.CAT.endDay) >= 0,
    "만기 **뒤** 진료일은 자동승인되지 않고, 거절 문구가 진료일과 만기일을 함께 적는다", S.CAT && S.CAT.afterEnd);
  chk(!!S.CAT && S.CAT.atEnd.ok === false && S.CAT.atEnd.code === "COVER_END",
    "만기일 0시 진료일도 창 밖이다(end 경계 배타적 — 「만기 당일 하루 더」 금지)", S.CAT && S.CAT.atEnd);
  chk(!!S.CAT && S.CAT.beforeStart.ok === false && S.CAT.beforeStart.code === "NO_CONTRACT"
    && String(S.CAT.beforeStart.easy).indexOf(S.CAT.beforeStart.at) >= 0 && String(S.CAT.beforeStart.easy).indexOf(S.CAT.startDay) >= 0,
    "개시 **전** 진료일은 자동승인되지 않고, 거절 문구가 진료일과 개시일을 함께 적는다", S.CAT && S.CAT.beforeStart);
  chk(!!S.CAT && S.CAT.realCheckup.ok === false && S.CAT.realCheckup.at === "2024. 12. 26." && S.CAT.realCheckup.payout === null,
    "실측 검진일(2024-12-26 · 창 20개월 전)로 접수한 검진 청구가 10만원 자동승인되지 않는다", S.CAT && S.CAT.realCheckup);
  chk(!!S.CAT && S.CAT.claimsRestored === true, "청구 진료일 시나리오가 청구 원장을 원복한다(검사가 상태를 남기지 않는다)", S.CAT && S.CAT.claimsRestored);
  /* 면책 문구와 심사가 **한 입으로** 말하는가 — 화면은 「보장 기간 밖에 받은 진단」을 면책이라
     적고 심사는 그 날짜를 보지 않아 자동승인했다. 두 문장이 같은 두 날짜를 적는지 본다. */
  chk(String(S.CKI.excl0 || "").indexOf(S.DS.start) >= 0 && String(S.CKI.excl0 || "").indexOf(S.DS.end) >= 0
    && /개시 전/.test(String(S.CKI.excl0 || "")) && /만기 후/.test(String(S.CKI.excl0 || "")),
    "면책 목록 첫 줄이 창의 **양쪽 경계**를 적는다(심사의 진료일 축과 같은 날짜·같은 방향)", S.CKI.excl0);

  chk(!!S.CID && !S.CID.err && S.CID.distinct === true && S.CID.nondigitSuffix === true,
    "같은 밀리초에 접수한 두 청구의 id가 다르다(청구 원장이 하나라 id가 겹치면 **남의 청구**가 심사된다)", S.CID);
  chk(!!S.CID && S.CID.reviewedFee === S.CID.aFee,
    "claimReview가 넘긴 id의 **그 청구**를 심사한다(진료비가 접수 건과 같다)", S.CID);

  /* ── ④-5 증서 모달이 적는 보험기간은 그 증서 자신의 창 ── */
  chk(!!S.CERTW && S.CERTW.end >= S.CERTW.certDate && S.CERTW.days === S.COVERD,
    "증서 모달 보험기간의 end ≥ 그 증서가 적는 연계 검진일 · 길이 = 60일(검진보다 먼저 끝나는 보장 금지)", S.CERTW);
  chk(!!S.CERTW && S.CERTW.fromDate === true && S.CERTW.noDateFallsToAt === true,
    "insCertAt은 c.date가 있으면 c.at(기기 벽시계)으로 떨어지지 않는다(날짜 없는 옛 증서만 at 폴백)", S.CERTW);

  /* 양방향 검사가 상태를 남기지 않았는가(원복 증명) */
  chk(!!S.WR && S.WR.start === S.CKI.start && S.WR.end === S.CKI.end && S.WR.phase === S.CKI.phase && S.WR.remainDays === S.CKI.remainDays,
    "양방향 검사 후 보장 창 원복(검사가 계약을 바꿔 두지 않는다)", [S.WR, S.CKI]);

  /* ── ⑤ 증서 메타(발급 기관) = 실측 원천 national.provider ── */
  const _c = (S.CERTS || []).filter((c) => /^CERT-JSR/.test(c.id || ""))[0] || {};
  chk(_c.center === "서울늘편한내과의원" && _c.date === "2024-12-26", "증서 기관·날짜 = 실측 2024-12-26 서울늘편한내과의원", [_c.center, _c.date]);
  chk(!(S.CHAIN || []).some((n) => /강북삼성병원/.test(n)), "체인 블록 문구에도 원천 밖 기관(강북삼성병원) 없음", (S.CHAIN || []).filter((n) => /강북삼성/.test(n)));
  chk((S.CHAIN || []).some((n) => /검진결과 저장\(upload·full\) 12항목/.test(n)), "체인 블록의 항목 수도 판정 행 12항목(화면 배지와 동일)", (S.CHAIN || []).filter((n) => /검진결과 저장/.test(n)));

  /* ── ⑥ 배지의 「N항목」 = 표의 행 수(키 맵 단일화) ── */
  chk(S.N.natRows === 12, "국가검진 판정 행 12항목(요단백·흉부촬영 포함)", S.N.natRows);
  chk(S.N.ckNatRows === 13, "검진 항목현황 2024 키 13개(혈압이 sbp·dbp 2행) = 판정 행 12개", [S.N.ckNatRows, S.N.natRows]);
  chk(S.N.ckNatKeys.indexOf("uprot") >= 0 && S.N.ckNatKeys.indexOf("cxr") >= 0, "요단백·흉부촬영이 검진 항목현황에도 실림", S.N.ckNatKeys);
  chk(S.N.vaultNatRows === 12, "금고 2024 배지 12항목 = 원천 판정 행 12항목", S.N.vaultNatRows);
  chk((S.N.unmapped.nat || []).length === 0, "2024 결과통보서는 표준코드 미매핑 0행", S.N.unmapped.nat);
  chk(JSON.stringify(S.N.unmapped.comp) === JSON.stringify(["총빌리루빈", "BUN", "Free T4"]), "2020 종합검진 미매핑 3행을 고지(조용히 버리지 않음)", S.N.unmapped.comp);
  const _v20 = (S.VP || []).filter((x) => x.date === "2020-06-23")[0] || {};
  chk(_v20.provider === "명지병원" && _v20.unmapped === 9, "금고 레코드가 측정기관·미매핑 수를 보존(2020 명지병원 · 미매핑 9)", _v20);

  /* ── ⑦ 「추이 없음」 근거 한 문장 + 기관 상이 고지 ── */
  chk(/1시점/.test(S.N.trendNote || "") && /2시점/.test(S.N.trendNote || "") && /기관 상이/.test(S.N.trendNote || ""),
    "「추이 없음」 근거 한 문장(리포트 1시점 · 검진 2시점 · 기관 상이)", S.N.trendNote);
  chk(S.N.cmpLabel === "내 검진 2시점 비교(2020·2024)", "비교 라벨(「3년 추이」 아님)", S.N.cmpLabel);
  chk(S.RR.fromProv === "명지병원" && S.RR.toProv === "서울늘편한내과의원" && S.RR.same === false,
    "요율 재산정이 두 시점의 측정기관 상이를 들고 나옴", [S.RR.fromProv, S.RR.toProv, S.RR.same]);

  /* ── ⑧ 하이(검진데이터 RAG)가 본인 계정에서 실제로 답한다 ── */
  chk(S.HI.mcc != null && S.HI.mda != null && S.HI.mcs != null, "본인 계정에서 memberCheckupCounsel·memberDeepAnalysis가 null이 아니다", [!!S.HI.mcc, !!S.HI.mda, !!S.HI.mcs]);
  chk(/100/.test(S.HI.mcc || "") && /공복혈당장애 의심/.test(S.HI.mcc || ""), "「내 공복혈당 결과」가 실측값 100 「공복혈당장애 의심」을 말한다", S.HI.mcc);
  chk(!/연결하면|올려두시면/.test(S.HI.mcs || ""), "「내 검진 결과 요약」이 미연동 안내로 빠지지 않는다", S.HI.mcs);
  chk(!/3년 검진 추이/.test([S.HI.mcc, S.HI.mda, S.HI.mcs, S.HI.mtr].join(" ")), "실측 계정 버튼·퀵칩에 「3년 검진 추이」 없음", [S.HI.mcs]);
  chk(S.HI.mtr != null && /시점/.test(S.HI.mtr || ""), "시점별 비교 질의에 2시점 비교로 답한다", S.HI.mtr);
  chk(!/undefined/.test([S.HI.mcc, S.HI.mda, S.HI.mcs, S.HI.mtr, S.HI.mit].join(" ")), "하이 답변에 「undefined」 없음");
  chk(/근거: 국가건강검진 결과통보서\(2024-12-26\)|근거: [^\n]*2024-12-26/.test(S.HI.mit || ""), "2024 값의 근거가 2024 결과통보서다(2020 결과표 아님)", S.HI.mit);
  chk(!/추이: /.test(S.HI.mit || "") && /시점 비교/.test(S.HI.mit || ""), "실측 2시점은 「추이」가 아니라 「시점 비교」로 적는다", S.HI.mit);
  chk(/4년 6개월 간격/.test(S.N.trendNote || ""), "검진 두 시점 간격을 날짜로 센다(4년 6개월 — 연도만 빼서 「4년」 아님)", S.N.trendNote);

  const forbidden = [/63\s*세/, /1\.17/, /73등/, /고위험/, /악화/, /175/, /\b88\b/, /\b68\b/];
  const blob = JSON.stringify(S.R) + JSON.stringify(S.C) + JSON.stringify(S.G);
  const hit = forbidden.filter((re) => re.test(blob));
  chk(hit.length === 0, "합성 잔재(63세·1.17·73등·고위험·악화·175·88·68) 없음", hit.map(String));
}

/* ── ③ 격리 + 이관 ── */
try {
  const D = run(`
    const list = (typeof DEMO_MEMBERS !== "undefined" && DEMO_MEMBERS) || (window.__HHDATA || {}).DEMO_MEMBERS || [];
    const rows = list.slice(0, 16).map((d) => { const r = demoReport(Object.assign({}, d)); return { n: d.name, bio: r.bio, real: !!r.selfReal, isSelf: selfRealIsSelf(d) }; });
    return JSON.parse(JSON.stringify({ n: list.length, rows }));
  `);
  chk(D.n === 16, "체험 회원 16명", D.n);
  chk(D.rows.every((r) => !r.real && !r.isSelf), "체험 회원은 합성 경로 유지(실측 미적용)", D.rows.filter((r) => r.real || r.isSelf));
  chk(D.rows.every((r) => r.bio !== 52.5), "체험 회원 화면에 본인 생체나이(52.5) 누출 없음", D.rows.filter((r) => r.bio === 52.5));
} catch (e) { fail.push("체험 회원 격리 검사 실패: " + e.message); }

try {
  const M = run(`
    localStorage.clear();
    const P = selfRealProfile();
    const me = Object.assign({ id: "self-srcho197011", name: "조성래", email: "srcho197011@hizenhealth.com", isDemoUser: false, realVerified: true, isSelf: true }, P);
    const tk = anonToken(me);
    const old = { token: tk, checkups: [], insurance: [], consents: null };
    [2023, 2024].forEach((y) => old.checkups.push({ token: tk, kind: "checkup", date: y + "-12-26", source: "upload", completeness: "full", channel: "upload",
      fileName: (y === 2024 ? "국가검진결과_2024.pdf" : "검진결과_촬영본_2023.jpg"), items: [{ key: "glucose", value: 175 }, { key: "ast", value: 88 }, { key: "alt", value: 68 }] }));
    localStorage.setItem("hifin_vault_" + tk, JSON.stringify(old));
    seedSelfVault(me);
    const mp = vaultCheckupMap(me).map;
    return JSON.parse(JSON.stringify({ dates: (vaultLoad(tk).checkups || []).map((c) => c.date), glucose: mp.glucose, ast: mp.ast, alt: mp.alt, flag: localStorage.getItem("hifin_self_real_v1") }));
  `);
  chk(M.flag === "1" && M.glucose === 100 && M.ast === 36 && M.alt === 43, "구 합성 금고 → 실측 1회 이관(hifin_self_real_v1)", M);
} catch (e) { fail.push("금고 이관 검사 실패: " + e.message); }

/* ── ③-2 이관: 회원이 직접 올린 결과지가 섞인 금고(파일명 조건이 깨지는 케이스) ── */
try {
  const M2 = run(`
    localStorage.clear();
    const P = selfRealProfile();
    const me = Object.assign({ id: "self-srcho197011", name: "조성래", email: "srcho197011@hizenhealth.com", isDemoUser: false, realVerified: true, isSelf: true }, P);
    const tk = anonToken(me);
    const old = { token: tk, checkups: [], insurance: [], consents: null };
    /* 회원 업로드 1건(파일명이 시드 규격과 다름) + 구 합성 시드 2건 */
    old.checkups.push({ token: tk, kind: "checkup", date: "2022-03-03", source: "upload", completeness: "partial", channel: "upload",
      fileName: "내가올린결과지.pdf", items: [{ key: "glucose", value: 99 }] });
    [2023, 2024].forEach((y) => old.checkups.push({ token: tk, kind: "checkup", date: y + "-12-26", source: "upload", completeness: "full", channel: "upload",
      fileName: (y === 2024 ? "국가검진결과_2024.pdf" : "검진결과_촬영본_2023.jpg"), items: [{ key: "glucose", value: 175 }, { key: "ast", value: 88 }, { key: "alt", value: 68 }] }));
    localStorage.setItem("hifin_vault_" + tk, JSON.stringify(old));
    seedSelfVault(me);
    const v = vaultLoad(tk);
    const mp = vaultCheckupMap(me).map;
    const R = demoReport(me);
    return JSON.parse(JSON.stringify({ dates: (v.checkups || []).map((c) => c.date).sort(), srcs: (v.checkups || []).map((c) => c.source).sort(),
      files: (v.checkups || []).map((c) => c.fileName).sort(), glucose: mp.glucose, ast: mp.ast, alt: mp.alt,
      flag: localStorage.getItem("hifin_self_real_v1"), vaultOk: R.vaultOk, flag0: R.flags[0].t }));
  `);
  chk(JSON.stringify(M2.dates) === JSON.stringify(["2020-06-23", "2022-03-03", "2024-12-26"]),
    "업로드 혼재 금고 — 시드분만 실측으로 치환하고 회원 업로드분(2022-03-03)은 보존", M2.dates);
  chk(M2.files.indexOf("내가올린결과지.pdf") >= 0, "회원이 올린 결과지 파일이 그대로 남는다", M2.files);
  chk(M2.glucose === 100 && M2.ast === 36 && M2.alt === 43 && M2.flag === "1", "구 합성 잔재(175·88·68) 제거 · 실측 이관 플래그", M2);
  chk(M2.vaultOk === true && /실측 검진 연동 ✓/.test(M2.flag0 || ""), "금고 검증 통과 → 「실측 검진 연동 ✓」 배지", [M2.vaultOk, M2.flag0]);
} catch (e) { fail.push("업로드 혼재 이관 검사 실패: " + e.message); }

/* ── ③-3 금고에 실측이 없으면 「실측 연동 ✓」를 단정하지 않는다 ── */
try {
  const M3 = run(`
    localStorage.clear();
    const P = selfRealProfile();
    const me = Object.assign({ id: "self-srcho197011", name: "조성래", email: "srcho197011@hizenhealth.com", isDemoUser: false, realVerified: true, isSelf: true }, P);
    const tk = anonToken(me);
    /* 플래그만 서 있고 금고는 구 합성인 기기(이관이 건너뛰어진 상태) — 화면이 어떻게 말하는가 */
    localStorage.setItem("hifin_self_real_v1", "1");
    localStorage.setItem("hifin_vault_" + tk, JSON.stringify({ token: tk, checkups: [{ token: tk, kind: "checkup", date: "2023-12-26", source: "upload", channel: "upload",
      completeness: "full", fileName: "내가올린결과지.pdf", items: [{ key: "glucose", value: 175 }] }], insurance: [], consents: null }));
    const R = demoReport(me);
    return JSON.parse(JSON.stringify({ vaultOk: R.vaultOk, flag0: R.flags[0].t }));
  `);
  chk(M3.vaultOk === false && !/연동 ✓/.test(M3.flag0 || "") && /반영 대기/.test(M3.flag0 || ""),
    "금고에 실측이 없으면 배지를 「실측 원천 기준 · 금고 반영 대기」로 내린다", M3);
} catch (e) { fail.push("금고 미반영 배지 검사 실패: " + e.message); }

/* ── ⑨ 소스 단언(화면 코드가 단일 소스를 읽는지 — 수치 재생성 방지) ── */
const srcOf = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8"); } catch (e) { return ""; } };
/* 주석을 벗긴 본문 — 「이 문구를 지웠다」는 설명 주석이 단언을 가리지 않게 한다 */
const codeOf = (f) => srcOf(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const AID = srcOf("src/components/AIDoctor.jsx");
chk(/memberDeepAnalysis\(text, _aidMember\(\)\)/.test(AID) && /memberCheckupCounsel\(text, _aidMember\(\)\)/.test(AID),
  "AIDoctor 검진 RAG 호출부가 _aidMember()(= demoCurrentUser || selfMember)를 넘긴다");
chk(/function _aidMember\(\)[\s\S]{0,400}selfMember\(\)/.test(AID), "_aidMember가 본인 계정으로 폴백한다");
chk(!/전체대비/.test(codeOf("src/components/AIDoctor.jsx")), "암 등급에서 파생한 수식어(「전체대비 낮음/보통」) 제거");
chk(/50대 남성대비/.test(AID) && /c\.vs/.test(AID), "암 위험도는 원천 라벨(50대 남성대비 · 높음/낮음)로 적는다");
const HM = srcOf("src/components/HealthManage.jsx");
chk(!/BioTrendChart/.test(HM.replace(/\/\*[\s\S]*?\*\//g, "")), "합성 4개년 생체나이 차트(BioTrendChart) 삭제");
chk(/R\.trendNote/.test(HM), "생체나이 카드가 단일 「추이 없음」 문장을 읽는다");
chk(/chk\.abnMain/.test(HM) && /topStale/.test(HM), "진료 연계 카드가 최신 판정 시점 행 + 측정일을 쓴다");
const ONT = srcOf("src/components/Ontology.jsx");
chk(/chk\.nat\.gradeLabel/.test(ONT), "온톨로지 아카이브 부제가 gradeLabel을 읽는다");
chk(!/최근 3년 추이|>3년 추이</.test(ONT), "온톨로지 「3년 추이」 고정 라벨 제거");
const HOME = srcOf("src/components/Home.jsx");
chk(!/생체나이 52\.5/.test(HOME) && /_STORY_BIO/.test(HOME), "홈 스토리의 생체나이가 리터럴이 아니다");
const SHOP = srcOf("src/components/Shop.jsx");
chk(!/selfRealProfile|selfRealDiseaseOf/.test(codeOf("src/components/Shop.jsx").split("function ConsultRecCard")[0]), "SHOP_AI 죽은 칸의 실측 소스 참조 제거");
chk(/demoCurrentUser\(\) \|\| selfMember|demoCurrentUser\(\)\) \|\| \(typeof selfMember/.test(SHOP), "건강쇼핑 추천 카드가 현재 로그인 회원을 읽는다");
chk(!/조성래/.test(codeOf("src/components/Shop.jsx").replace(/운영자\(조성래\)/g, "")), "건강쇼핑 화면·상담 답변에 이름 상수(조성래) 없음");
const INS = srcOf("src/components/Insurance.jsx");
chk(!/const INS_PRODUCTS/.test(INS), "렌더되지 않는 INS_PRODUCTS 상수 삭제");
/* 데이터에 없는 계약 행위를 화면이 단정하지 않는가 — 계약 1건·증서 1건에 바뀐 것은 coverFrom
   하나인데 「재가입으로 2026. 9. 6. 재개」·「만기 종료」라고 적었다(새 청약·새 증서·감사 기록 0건).
   앞선 창 블록의 **렌더 문자열**을 직접 본다(주석의 설명이 단언을 가리지 않게 코드 본문만). */
const INSC = codeOf("src/components/Insurance.jsx");
/* 추출을 **블록 경계**로 한다(2026-10-08 수선) — 전 추출식
   /S\.timeline && S\.timeline\.prior[\s\S]{0,900}?\)\}/ 는 lazy라서 JSX 안의 **첫** `)}`
   (= {insDayStr(S.timeline.prior.start)} 의 닫는 괄호)에서 끊겼다. 실측: 추출 429자 / 렌더 블록
   900자 — 잡히지 않은 471자 꼬리가 「~ … 이미 지난 기간이에요. 지금 적용되는 창은 … 예요.」
   전부였고, 계약 행위 어휘를 쓸 자리가 **정확히 스캔 밖**이었다(실증: 꼬리에 「만기 종료」·
   「재가입으로 재개」를 심어도 237/0 통과 · 꼬리의 「(시연 시드)」를 지워도 전건 통과).
   이제 앵커를 감싼 여는 `{`부터 중괄호 깊이 0까지 세어 블록 끝까지 집고, **양 끝 문구**를
   둘 다 요구한다 — 다시 끊기면 가드가 먼저 울린다. */
const jsxBlockAt = (src, anchor) => {
  const a = src.indexOf(anchor);
  if (a < 0) return "";
  let st = -1;
  for (let k = a; k >= 0; k--) { if (src[k] === "{") { st = k; break; } if (src[k] === "}" || src[k] === ">") break; }
  if (st < 0) return "";
  let d = 0;
  for (let k = st; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(st, k + 1); } }
  return "";
};
const PRIORBLK = jsxBlockAt(INSC, "S.timeline && S.timeline.prior");
chk(PRIORBLK.length > 500, "앞선 보장 창 렌더 블록 추출 — 렌더 문장 **전체**(반쪽 429자 금지)", PRIORBLK.length);
chk(/이미 지난 기간이에요/.test(PRIORBLK) && /지금 적용되는 창은/.test(PRIORBLK) && /예요\./.test(PRIORBLK),
  "추출 블록이 문장의 **양 끝**을 포함한다(머리절·꼬리절 둘 다 — 추출이 끊기면 여기서 먼저 FAIL)", PRIORBLK.length);
/* 겹침 스캔 — 어휘 금칙을 블록이 아니라 **S.timeline.prior를 참조하는 모든 줄**에 건다.
   블록 추출이 어떤 이유로든 다시 좁아져도 이 줄이 남는다. */
const PRIORLINES = INSC.split(/\r?\n/).filter((ln) => /S\.timeline\.prior/.test(ln)).join("\n");
chk(PRIORLINES.length > 300, "앞선 창을 참조하는 줄 수집(겹침 스캔이 공집합을 보지 않는다)", PRIORLINES.length);
chk(!/재가입|재개|만기 종료/.test(PRIORLINES),
  "앞선 창을 참조하는 **모든 줄**에 계약 행위 어휘(재가입·재개·만기 종료) 없음(블록 추출과 이중으로 건다)", (PRIORLINES.match(/재가입|재개|만기 종료/g) || []));
chk(!/재가입|재개|만기 종료/.test(PRIORBLK), "앞선 창 문구에 계약 행위 어휘(재가입·재개·만기 종료) 없음", (PRIORBLK.match(/재가입|재개|만기 종료/g) || []));
/* ⚠️ 구 단언 「실측은 **검진일**로 한정해 적는다」(/실측 검진일/ 요구)의 승계 — 이 블록은
   조성래(실측)뿐 아니라 코호트·체험 회원의 **합성 검진일**로도 렌더된다. 그 날짜에 「실측」을
   붙이면 데이터에 없는 성격을 단정한다. 그래서 라벨을 중립(「연계 검진일」)으로 내리고
   블록 안의 「실측」을 **전면 금지**한다 — 구 단언보다 강하다(한 단어만 허용 → 0단어 허용). */
chk(!/실측/.test(PRIORBLK) && /연계 검진일/.test(PRIORBLK),
  "앞선 창 문구가 산출 날짜에 「실측」을 붙이지 않는다(중립 라벨 「연계 검진일」 — 합성 검진일에 실측 표기 금지)", (PRIORBLK.match(/실측[^\s<{]*/g) || []));
chk(/시연 시드/.test(PRIORBLK), "기준일 파생 창임을 블록 **꼬리**에서 밝힌다(「(시연 시드)」 표기 — 꼬리 제거가 통과하지 않는다)");
chk(/prior\.ended/.test(PRIORBLK) && /prior\.end < S\.timeline\.start/.test(PRIORBLK),
  "앞선 창 줄은 그 창이 실제로 지났고 현재 창보다 앞설 때만 렌더된다");
/* 배지 — 잔여일은 「보장 중」에만, 개시 대기에는 개시일. 전에는 조건이 !ended뿐이라
   개시도 안 한 창에 「만기까지 63일」(60일 상품)이 적혔다. */
chk(/\{active && S\.timeline\.remainDays != null \? ` · 만기까지/.test(INS),
  "배지의 「만기까지 N일」이 active(보장 중)로 게이트된다(!ended 금지)");
chk(/\{waiting \? ` · 개시 /.test(INS), "개시 대기 배지는 개시일·개시까지 일수를 적는다");
chk(/const waiting = !!\(S\.policy && S\.timeline && !ended && !active\);/.test(INS) && /: waiting$|: waiting\n/m.test(INS.replace(/\r/g, "")),
  "히어로가 종료·보장 중·개시 대기 3분기(배지와 한 입으로 말한다)");
chk(/const c = \(typeof insCheckupCert === "function"\) \? insCheckupCert\(m\) : null;/.test(INS),
  "증서 모달 호출부가 내 증서만 고른다(l[l.length-1] 무필터 금지 — 다른 회원 증서 차단)");
chk(!/내일 0시부터 3개월/.test(INSC), "발급 확인 문구의 「내일 0시부터 3개월」 제거(보험기간 60일 · 개시일은 창이 말한다)", (INSC.match(/내일 0시부터 3개월/g) || []));
/* 포맷터 단일화(#26) — 창 날짜를 적는 문구가 insDayStr 하나만 쓰는가.
   출력 문자열이 같아도 함수가 둘이면 한쪽만 바뀌는 순간 다시 두 철자가 된다(실측으로 그렇게 섰다).
   값 비교로는 Node/브라우저 ko-KR 출력이 동일해 잡히지 않으므로 **소스**로 박는다. */
chk(!/toLocaleDateString/.test(codeOf("src/data/insService.js")), "insService의 창 문구가 toLocaleDateString을 쓰지 않는다(포맷터 하나 = insDayStr)", (codeOf("src/data/insService.js").match(/.{0,40}toLocaleDateString/g) || []));
chk(!/(timeline|prior|W)\.(start|end)\)\.toLocaleDateString/.test(INSC) && !/(timeline|prior|W)\.(start|end)\)\.toLocaleDateString/.test(codeOf("src/components/Checkup.jsx")) && !/timeline\.end\)\.toLocaleDateString/.test(codeOf("src/components/Nft.jsx")),
  "회원 화면(치료비 케어 ①·증서 모달·NFT)의 창 날짜가 insDayStr 하나로 렌더된다");
chk(/\{insDayStr\(S\.timeline\.start\)\} ~ \{insDayStr\(S\.timeline\.end\)\}/.test(INS), "배지의 창 날짜가 insDayStr로 렌더된다");
/* 데이터에 없는 **과거 보장**을 화면이 단정하지 않는가 — 계약 생성보다 앞에서 끝난 창에도
   타임라인 4단계가 전건 점등되고 「보장 기간에는 이렇게 지켜드렸어요」(과거완료)가 떴다
   (실측: 코호트 회원 발급 직후 「✓ 발급 ✓ 보장 시작 ✓ 지켜지는 중 ✓ 보장 종료」 + 진단금 나열). */
chk(/const never = !!\(S\.policy && S\.neverActive\);/.test(INS), "히어로·타임라인·시제가 neverActive 한 변수에서 갈라진다");
chk(/\? -1 : never \? 0 : ended \? 3 : S\.timeline\.phase === "보장 중" \? 2 : 0;/.test(INS),
  "타임라인 점등 수 = **국면**(개시 대기·산 적 없는 보장은 발급 1단계까지 — 「✓ 보장 시작·✓ 지켜지는 중」 금지)", (INS.match(/const tlIdx = [^;]*/) || [])[0]);
chk(/\{never \? "이 검진 기록으로 열리는 보장 창은 이미 지난 기간이에요/.test(INS),
  "산 적 없는 보장 기간을 과거완료(「지켜드렸어요」)로 적지 않는다", (INS.match(/보장 기간에는 이렇게 지켜드렸어요[^"]*/g) || []));
chk(/never\n?\s*\? <div[\s\S]{0,400}보장 창이 이미 지났어요/.test(INS), "히어로도 never 분기에서 사실만 적는다(「만기가 지났어요」와 구분)");
chk(!/보장이 켜져요/.test(INSC) && /보장이 준비돼요/.test(INSC) && /다음날 0시<\/b>부터 시작돼요/.test(INSC),
  "발급 전 CTA가 개시 시점을 숨기지 않는다(「보장이 켜져요」 → 「준비돼요 · 다음날 0시부터」)", (INSC.match(/보장이 켜져요/g) || []));
chk(/다음날 0시부터 \{typeof INS_COVER_DAYS/.test(INSC), "발급 확인 문구의 보험기간이 INS_COVER_DAYS에서 나온다(상수 리터럴 아님)");
const SR = srcOf("src/data/selfReal.js");
chk(!/check_self_real\.mjs/.test(SR) && /run_selfreal_check\.mjs/.test(SR), "드리프트 경고가 실제 스크립트 이름을 가리킨다");
chk(!/_SR_VAULT_KEY|_SR_CK_KEY/.test(SR) && /_SR_KEYMAP/.test(SR), "키 맵이 하나(_SR_KEYMAP)로 합쳐졌다");
const SD = srcOf("src/data/sectionData.js");
const SDC = codeOf("src/data/sectionData.js");
chk(!/예약증 SBT[^\n]*광화문/.test(SDC) && !/암 500·뇌·심 500만원/.test(SDC), "NFT 예약증·보험증서의 원천 없는 상수 메타 제거");

/* ── ⑩ 원천 재대조 결과(암 10종 등급·방향 · 의료 이용 일수) ── */
try {
  const DOC = JSON.parse(jsonText);
  const want = { "간암": ["1.5%", "높음", "주의"], "담낭암": ["7.1%", "낮음", "주의"], "췌장암": ["17.3%", "높음", "경고"], "위암": ["3.5%", "낮음", "주의"],
    "대장암": ["5.0%", "낮음", "주의"], "폐암": ["15.6%", "낮음", "양호"], "신장암": ["5.8%", "낮음", "주의"], "방광암": ["10.4%", "낮음", "양호"],
    "전립선암": ["5.5%", "낮음", "주의"], "갑상선암": ["9.8%", "낮음", "주의"] };
  const bad = (DOC.report.cancerAll || []).filter((c) => { const w = want[c.k]; return !w || c.risk !== w[0] || c.vs !== w[1] || c.flag !== w[2]; });
  chk(bad.length === 0, "암 10종 = PDF 상세면 재대조값(위험도 % · 높음/낮음 · 등급)", bad);
  chk(/재대조 완료/.test(DOC.meta.provenance["report.cancerAll"] || ""), "cancerAll provenance가 「재확인 대기」가 아니다");
  const vz = DOC.report.visits;
  chk(vz.thisYear.inpatient === 24 && vz.thisYear.inpatientPeer === 22 && vz.in10y.inpatient === 20,
    "의료 이용 일수 = PDF 종합분석(p.5) 원문(금년 입원 24/22 · 10년 후 20/19)", vz);
} catch (e) { fail.push("원천 재대조 검사 실패: " + e.message); }

/* ── ⑪ 벽시계 부재 스캔(보장 창 체인) ──────────────────────────────────────────
   보장 창의 양쪽(coverFrom · 판정 시각)은 INS_DEMO 한 줄에서만 나와야 한다.
   어느 함수든 Date.now()·인자 없는 new Date()를 되살리면 「만기까지 30일」이 날마다 줄어들고,
   escrowPay._escNow()식 「실시계가 기준일 이후면 실시계」 분기를 베끼면 2026-11-06부터
   「보장 종료」와 「만기까지 30일」이 한 줄에 같이 뜬다. 인자 있는 new Date(x)는 포맷·정규화라 허용. */
const INS_SRC = srcOf("src/data/insService.js");
const HM_SRC = srcOf("src/data/healthMate.js");
/* ⚠️ 전 정규식 /Date\.now\(\)|new Date\(\s*\)/ 은 **괄호 없는 `new Date`**를 못 잡았다.
   실증: insAsOfMs를 `const d = new Date; d.setHours(0,0,0,0); return d.getTime();`로 치환했더니
   창이 날마다 움직이는데 가드는 145/0. 공백형 `Date . now()`도 같은 구멍이었다.
   이제 ① Date.now / Date . now ② new Date / new Date() / new Date( ) 를 모두 잡고,
   인자 있는 new Date(x)(포맷·정규화)는 계속 허용한다. */
const WALL = /Date\s*\.\s*now\b|new\s+Date\b(?!\s*\(\s*[^)\s])/;
const noCmt = (s0) => String(s0).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
/* 함수 본문 추출 — 인자 목록을 먼저 닫고 나서 본문 중괄호를 센다.
   ⚠️ 전에는 함수명 뒤의 첫 "{"를 본문 시작으로 삼았다. 구조분해 인자(function f({ a, b }))에서는
      그 "{"가 **인자**라서 본문 대신 인자만 잘려 나왔고, 그 위에 올린 스캔이 조용히 공집합을 검사했다
      (애블레이션 실증에서 InsCertModal의 자체 재계산 복귀를 못 잡았다 — 2026-10-06). */
const fnBody = (src, name) => {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) return null;
  const op = src.indexOf("(", i);
  let pd = 0, close = -1;
  for (let k = op; k < src.length; k++) { if (src[k] === "(") pd++; else if (src[k] === ")") { pd--; if (!pd) { close = k; break; } } }
  if (close < 0) return null;
  const j = src.indexOf("{", close);
  if (j < 0) return null;
  let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(j, k + 1); } }
  return null;
};
/* 스캔이 **살아 있는지** 먼저 증명한다 — 정규식이 아무것도 잡지 못하는 상태로 공집합을 검사하고
   있으면 아래 전부가 장식이다. 양성 대조: _limitUsed는 연간 한도 원장용으로 new Date()를 쓴다
   (벽시계가 맞는 자리 — 범위 한정 지시가 그대로 두라고 한 곳이다). */
chk(WALL.test(noCmt(String(fnBody(INS_SRC, "_limitUsed") || ""))), "벽시계 스캔 정규식이 실제로 잡는다(양성 대조 — _limitUsed의 new Date())");
chk(WALL.test("const d = new Date; d.setHours(0,0,0,0);") && WALL.test("return Date . now();") && WALL.test("new Date()") && WALL.test("new Date( )")
  && !WALL.test("new Date(ms)") && !WALL.test("new Date(Number(d.slice(0,4)), 0, 1)") && !WALL.test("insDateMs(x)"),
  "벽시계 스캔이 괄호 없는 new Date·공백형 Date . now까지 잡고 인자 있는 new Date(x)는 허용");
/* 창 체인 전체 — insCertAt·insCheckupCert(s)가 빠져 있었다. insCertAt은 c.date가 8자리가 아니면
   c.at(그 기기가 증서를 기록한 벽시계 시각)으로 떨어지고, basis "cert" 경로는 그 값을 창의 근거로
   쓴다 — 바로 이번에 없애려 한 「기기마다 다른 날짜」의 원천이다. */
/* ⚠️ 목록이 창을 **만드는** 함수 12개만 보고 창을 **소비하는** 코드를 전혀 보지 않았다 —
   개시·만기 판정을 하는 claimReview가 빠져 있었다(본문 4,735자). 실증: claimReview에
   `if (W && Date.now() > W.end) return COVER_END`를 덧대도 237/0 통과. 목록에 편입한다. */
["insDateMs", "insAsOfMs", "insNow", "insDayStr", "insWindowOf", "insDemoCoverFrom",
 "insCertAt", "insCheckupCert", "insCheckupCerts", "insCheckupCertFirst", "insCheckupWindow", "insCheckupCoverEnsure",
 "claimReview"].forEach((fn) => {
  const b = fnBody(INS_SRC, fn);
  chk(b != null, "보장 창 체인 함수 존재 — " + fn);
  if (b) {
    /* 추출이 **본문**을 집었는지 — 구조분해 인자에서 인자만 잘려 나오면 스캔이 공집합을 본다 */
    chk(b.length > 15 && /return|=>|push|for \(/.test(b), "함수 본문 추출이 비어 있지 않다(스캔 대상 확인) — " + fn, b.length);
    chk(!WALL.test(noCmt(b)), "벽시계 부재 — " + fn + "에 Date.now()·new Date() 없음", (noCmt(b).match(WALL) || [])[0]);
  }
});
/* 객체 리터럴 메서드 본문 추출(2026-10-08 신설) — `const insService = { … }` 안의
   checkupIns(m) { … } · issueCheckupIns(m) { … }는 `function` 선언이 아니라 fnBody로
   **추출 자체가 불가**했다(프로브에서 null 확인). 그래서 창을 소비·발급하는 두 메서드가
   스캔 밖에 있었고, 그 블록에는 이미 Date.now() 1건이 있었다. 실증: checkupIns의
   `const ended = !!(timeline && timeline.ended)`를 `… || Date.now() > timeline.end`로
   바꿔도(설계 주석이 명시적으로 금지한 _escNow 승격 규칙) 237/0 통과. */
const methodBody = (src, name) => {
  const mm = new RegExp("\\n\\s{2}" + name + "\\(").exec(src);
  if (!mm) return null;
  const op = src.indexOf("(", mm.index);
  let pd = 0, close = -1;
  for (let k = op; k < src.length; k++) { if (src[k] === "(") pd++; else if (src[k] === ")") { pd--; if (!pd) { close = k; break; } } }
  if (close < 0) return null;
  const j = src.indexOf("{", close);
  if (j < 0) return null;
  let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(j, k + 1); } }
  return null;
};
const CKIB = methodBody(INS_SRC, "checkupIns");
chk(CKIB != null && CKIB.length > 600 && /timeline/.test(String(CKIB)), "insService.checkupIns 본문 추출(객체 리터럴 메서드도 스캔 대상)", CKIB && CKIB.length);
chk(CKIB != null && !WALL.test(noCmt(String(CKIB))),
  "벽시계 부재 — insService.checkupIns(창 국면을 두 번째 시계로 다시 가르지 않는다)", (noCmt(String(CKIB || "")).match(WALL) || [])[0]);
const ICIB = methodBody(INS_SRC, "issueCheckupIns");
chk(ICIB != null && ICIB.length > 600 && /pbPolicyCreate/.test(String(ICIB)), "insService.issueCheckupIns 본문 추출", ICIB && ICIB.length);
/* 발급 경로의 벽시계는 **발급 시각**에만 허용한다(계약·증서 레코드의 시각은 벽시계가 맞다).
   금지하는 것은 창 **경계와의 비교** — 그걸 여기서 하면 insJudgeNow 밖에 두 번째 시계가 생긴다. */
chk(ICIB != null && !/Date\.now\(\)\s*(?:[<>]=?|===|!==)/.test(noCmt(String(ICIB))) && !/[<>]=?\s*Date\.now\(\)/.test(noCmt(String(ICIB))),
  "발급 경로의 Date.now()는 발급 시각 기록용뿐 — 창 경계와 비교하지 않는다", (noCmt(String(ICIB || "")).match(/.{0,36}Date\.now\(\).{0,24}/g) || []));
chk(ICIB != null && /coverFrom: _cf, coverSeed: "live"/.test(String(ICIB)),
  "발급이 계약에 보장 개시일(coverFrom)·시드 live를 동봉한다(창의 주인 = 계약 — 증서 날짜 폴백으로 떨어지지 않는다)");
chk(ICIB != null && /const _cf = \(_w0 && !_w0\.ended\) \? _ckAt : Date\.now\(\);/.test(String(ICIB)),
  "연계 검진일로 열리는 창이 이미 닫혔으면 **발급일**을 하한으로 쓴다(형태 고정 — 발급 직후 「보장 종료」 금지)", ICIB && (String(ICIB).match(/const _cf[^\n]*/) || [])[0]);
/* 판정 시각의 **시드 분기** — 벽시계는 이 한 함수의 live 분기에만 허용한다.
   「체인 전체 금지」를 유지하면 기준일 이후에 열린 창이 영구 미도래가 되므로(실측 확인),
   금지 대신 **형태를 고정**해 강도를 지킨다: demo면 기준일, 그 외는 벽시계. */
const JN = String(fnBody(INS_SRC, "insJudgeNow") || "").trim();
chk(/^\{\s*return seed === "demo" \? insAsOfMs\(\) : Date\.now\(\);\s*\}$/.test(JN),
  "판정 시각 분기는 insJudgeNow 한 줄 — demo는 기준일, 그 외는 벽시계(형태 고정)", JN);
chk(/const start = st\.getTime\(\), end = start \+ INS_COVER_DAYS \* 86400000, now = insJudgeNow\(seed\);/.test(INS_SRC),
  "insWindowOf가 판정 시각을 insJudgeNow(seed)에서 받는다(insNow 직접 호출 금지)");
chk(/remainDays: phase === "보장 중" \?/.test(INS_SRC) && /startsInDays: phase === "보장 개시 대기" \?/.test(INS_SRC),
  "잔여일·개시까지 일수가 국면으로 갈라져 있다(개시 전 「만기까지 N일」 구조적 불가)");
chk(/const phase = now >= end \? "보장 종료"/.test(INS_SRC), "만기 경계는 배타적(now >= end면 종료 — 「보장 중 · 만기까지 0일」 금지)");
/* 「산 적 없는 보장」 판정 — 창이 **끝난 뒤**에만 성립한다(보장 중 창에 과거형 라벨이 붙지 않게) */
chk(/const neverActive = !!\(pol && timeline && timeline\.ended && timeline\.end <= \(pol\.createdAt \|\| 0\)\);/.test(INS_SRC),
  "「산 적 없는 보장」 판정은 창이 끝난 뒤 + 계약 생성보다 앞에서 끝났을 때만 성립(형태 고정)");
/* 청구 심사의 **두 번째 축**(진료일) 형태 고정 — 경계는 창과 같다(start 포함 · end 배타적) */
chk(/const _at = Number\(c\.at\) \|\| null;/.test(INS_SRC) && /if \(W && _at != null && _at < W\.start\)/.test(INS_SRC) && /if \(W && _at != null && _at >= W\.end\)/.test(INS_SRC),
  "검진 청구 심사가 청구 건의 진료일(c.at)을 창 경계와 대조한다(형태 고정 — 계약 국면만 보는 심사 금지)");
chk((INS_SRC.match(/const INS_DEMO = \{/g) || []).length === 1, "시연 기준일 상수 선언 1곳(INS_DEMO)");
chk(/asOf:\s*"2026-10-06"/.test(INS_SRC) && /remainDays:\s*30/.test(INS_SRC), "기준일 2026-10-06 · 잔여 30일(형 확정값)");
chk(!/_escNow|FB_ASOF/.test(noCmt(INS_SRC)), "escrowPay의 실시계 승격 규칙을 베끼지 않았다(_escNow·FB_ASOF 미참조)");
chk(/^\{\s*return insAsOfMs\(\);\s*\}$/.test(String(fnBody(INS_SRC, "insNow") || "").trim()), "insNow는 기준일 그 자체 — 실시계 비교 분기 없음", fnBody(INS_SRC, "insNow"));
const TPB = fnBody(HM_SRC, "hmTouchPlan");
chk(TPB != null, "hmTouchPlan 본문 추출");
if (TPB) {
  const wi = TPB.indexOf("const wnow");
  chk(wi > 0, "hmTouchPlan 만기 분기가 기준일 시계(wnow = insNow)를 쓴다");
  /* wnow는 **창이 쓴 그 시각**(W.now)을 받아 쓴다 — insNow()를 직접 부르면 시연 시드가 아닌 창까지
     기준일로 판정해 D-30·D-7이 영구히 도래하지 않는다(창의 개시 쪽 영구 미도래와 같은 결함). */
  chk(/const wnow = W \? W\.now : \(\(typeof insNow === "function"\) \? insNow\(\) : now\);/.test(TPB),
    "wnow가 창(W.now)에서 온다 — 창과 프로 ⑨가 같은 판정 시각을 쓴다", TPB.slice(Math.max(0, wi), wi + 140));
  const tail = wi > 0 ? TPB.slice(wi) : "";
  chk(!WALL.test(noCmt(tail)), "벽시계 부재 — hmTouchPlan 만기 분기", (noCmt(tail).match(WALL) || [])[0]);
  chk(/const now = Date\.now\(\)/.test(TPB) && /due: now >= base/.test(TPB), "첫 연결 블록(combo·d7·d14·d30)은 벽시계 유지 — 영구 미도래 금지");
}
/* 프로 ⑨ 카드의 「다음 터치」 선택이 벽시계로 돌아가지 않았는가 —
   plan.items의 when은 만기 분기(기준일 파생)와 첫 연결 분기(벽시계)가 섞인 배열이라,
   선택만 한 시계로 하면 같은 카드가 두 시계로 말한다(실측: 벽시계 2026-11-10부터 next가 null이
   되어 「다음 터치 지금」이 영구히 남았다). due는 그 행을 만든 시계가 판정한 값이다. */
const CCB = fnBody(HM_SRC, "hmCustomerCard");
chk(CCB != null && CCB.length > 200, "hmCustomerCard 본문 추출", CCB && CCB.length);
if (CCB) {
  chk(/const next = plan\.items\.find\(\(x\) => !x\.done && !x\.due\);/.test(CCB),
    "「다음 터치」는 각 행이 자기 시계로 판정한 due로 고른다(when > Date.now() 금지)");
  chk(!WALL.test(noCmt(CCB)), "벽시계 부재 — hmCustomerCard", (noCmt(CCB).match(WALL) || [])[0]);
}
/* 범위 한정 — 기준일 시계를 전역 now로 승격하지 않았는가(쓰는 파일이 창 소유 2곳뿐) */
const insNowFiles = fs.readdirSync(path.join(ROOT, "src"), { recursive: true })
  .filter((f) => /\.(js|jsx)$/.test(String(f)))
  .filter((f) => { try { return /insNow\(/.test(fs.readFileSync(path.join(ROOT, "src", String(f)), "utf8")); } catch (e) { return false; } })
  .map((f) => String(f).replace(/\\/g, "/")).sort();
chk(JSON.stringify(insNowFiles) === JSON.stringify(["data/healthMate.js", "data/insService.js"]),
  "기준일 시계는 보장 창 전용 — insNow()를 쓰는 파일이 insService·healthMate 2곳뿐", insNowFiles);
/* 증서 모달이 창을 받아 쓰는가(cert.at 자체 재계산 금지) */
const CKUP_SRC = srcOf("src/components/Checkup.jsx");
const CM = fnBody(CKUP_SRC, "InsCertModal");
chk(CM != null && /\bwin\b/.test(String(CM)) && !/end\.setDate\(end\.getDate\(\) \+ 60\)/.test(String(CM)),
  "증서 모달이 보장 창을 받아 쓴다(cert.at + 60일 자체 재계산 삭제)");
/* 모달은 **그 증서 자신의** 창을 적는다 — 회원 계약 창을 1순위 폴백으로 쓰면, 2026-11-20 예약으로
   받은 증서에 그 검진보다 먼저 끝나는 보험기간이 적힌다(실측). 회원 창은 별 행으로만 쓴다. */
chk(CM != null && /const W = \(\(typeof insWindowOf === "function"\) && certAtMs != null\) \? insWindowOf\(certAtMs, "live"\)/.test(String(CM)),
  "증서 모달의 보험기간 1순위 = 그 증서 자신의 창(회원 계약 창 폴백 아님)");
chk(CM != null && /보험기간\(이 증서\)/.test(String(CM)) && /현재 보장\(계약\)/.test(String(CM)),
  "증서 모달이 증서 자신의 기간과 현재 보장 창을 **두 행으로 분리**해 적는다");
chk(CM != null && !/insCheckupWindow\(me\)/.test(String(CM)), "증서 모달이 로그인 회원의 창으로 자기 기간을 덮지 않는다");
chk(/<InsCertModal cert=\{c\} win=\{S\.timeline\}/.test(srcOf("src/components/Insurance.jsx")), "치료비 케어 ①이 증서 모달에 같은 창을 넘긴다");
/* 프로 콘솔 만기 KPI가 만기 **예정** 3행만 세는가(mend까지 집던 indexOf("m") 금지) */
const HMJ = srcOf("src/components/HealthMate.jsx");
chk(/\/\^m\(30\|7\|1\)\$\/\.test\(x\.key\)/.test(HMJ) && !/x\.key\.indexOf\("m"\) === 0/.test(HMJ),
  "만기·재검진 예정 KPI가 m30·m7·m1만 센다(mend 제외)");

/* ── ⑫ 커밋 게이트 편입 확인 ────────────────────────────────────────────────
   이번 변경의 창 단언 전부가 **어떤 커밋 게이트에도 연결되지 않았다**(실측: premiumBilling.js·
   healthMate.js는 catalog 게이트 하나만, scripts/run_selfreal_check.mjs는 0건, package.json·
   .github 부재 → 사람이 직접 타이핑할 때만 돈다). e9fb6dc가 dailyRoster.js에서 닫은 구멍과
   같은 유형이 창 파일에서 재발한 자리다. 가드가 자기 자신이 게이트에 걸려 있는지 본다. */
const HOOK = srcOf("scripts/githooks/pre-commit");
chk(HOOK.length > 0, "pre-commit 훅 읽기(core.hooksPath=scripts/githooks)");
chk(/run_selfreal_check\.mjs/.test(HOOK), "pre-commit에 보장 창·실측 가드 게이트가 편입돼 있다");
/* ⚠️ 문자열 포함 검사로는 안 된다 — 훅의 감시목록은 그룹 정규식
   `src/data/(insService|premiumBilling|healthMate|healthDataVault)\.js` 형태라 경로 문자열이
   그대로 들어 있지 않고, 반대로 다른 게이트(hifin_scope 등)에 같은 경로가 적혀 있으면
   창 게이트가 없어도 통과한다(실측: 그 방식으로 4건이 조용히 통과했다).
   그래서 **그 게이트의 정규식을 꺼내 실제로 매치시켜** 본다. */
const WGL = (HOOK.split(/\r?\n/).find((ln) => /grep -qE/.test(ln) && /run_selfreal_check/.test(ln)) || "");
const WGM = WGL.match(/grep -qE "([^"]+)"/);
chk(!!WGM, "창 게이트의 감시 정규식 추출(한 줄 안에 run_selfreal_check와 함께 있다)", WGL.slice(0, 120));
let WGRE = null;
if (WGM) { try { WGRE = new RegExp(WGM[1]); } catch (e) { WGRE = null; } }
chk(!!WGRE, "창 게이트 감시 정규식이 유효하다", WGM && WGM[1]);
["src/data/insService.js", "src/data/premiumBilling.js", "src/data/healthMate.js", "src/data/healthDataVault.js",
 "src/components/Insurance.jsx", "src/components/Checkup.jsx", "src/components/HealthMate.jsx",
 "scripts/run_selfreal_check.mjs"].forEach((f) => {
  chk(!!WGRE && WGRE.test(f), "창 게이트가 실제로 감시한다(정규식 매치) — " + f);
});
chk(!!WGRE && !WGRE.test("src/data/finBudget.js") && !WGRE.test("src/data/insService.js.bak") && !WGRE.test("x/src/data/insService.js"),
  "창 게이트가 무관한 경로까지 끌어오지 않는다(앵커 ^…$ 유지)");
chk(/node scripts\/run_selfreal_check\.mjs \|\| \{[^}]*exit 1/.test(HOOK), "창 게이트 실패 시 커밋을 차단한다(exit 1)");

/* ── ⑪-2 두 번째 시계 **행동** 단언 ─────────────────────────────────────────────
   소스 스캔은 「어디에 Date.now()가 적혀 있나」만 본다. 창 **판정**이 insJudgeNow 밖에서 한 번 더
   일어나면(= 창을 소비하는 코드가 자기 시계로 다시 가르면) 오늘은 화면이 안 바뀌어 눈에 보이지
   않고, 기준일 창의 만기(2026-11-05)가 지나는 날부터 배지는 「보장 중 · 2026. 9. 6. ~ 2026. 11. 5.」
   인데 히어로·endedNote는 「만기가 지났어요」가 되고 청구가 거절된다 — 설계 주석이 「한 줄에 같이
   뜬다」고 경고한 그 상태다. 실증된 애블레이션 2건(checkupIns의 `|| Date.now() > timeline.end` ·
   claimReview의 `if (Date.now() > W.end) return COVER_END`)이 237/0으로 통과했다.
   그래서 **벽시계를 창 만기 뒤로 밀어 둔 격리 컨텍스트**에서 같은 값이 나오는지 직접 확인한다. */
try {
  const SHIFT = new Date(2026, 10, 15, 9, 0, 0).getTime();   /* 기준일 창 만기(2026-11-05) 뒤 */
  const L2 = loadCtx(SHIFT, null);
  const run2 = (code) => vm.runInContext("(() => {" + code + "})()", L2.ctx, { filename: "clock2" });
  chk(L2.loaded > 100, "두 번째 시계 컨텍스트 적재", L2.loaded);
  const X = run2(`
    const P = selfRealProfile();
    const me = Object.assign({ id: "self-srcho197011", name: "조성래", email: "srcho197011@hizenhealth.com", isDemoUser: false, realVerified: true, isSelf: true }, P);
    seedSelfVault(me); selfEnsureInsSeed(me);
    const W = insCheckupWindow(me), CK = insService.checkupIns(me);
    const cs = insService.claimSubmit(me, { kind: "검진 연계 정밀검사", fee: 100000, date: insAsOfMs() });
    const rv = cs.ok ? insService.claimReview(me, cs.claim.id) : { ok: false, code: "SUBMIT" };
    const TP = hmTouchPlan(me);
    return JSON.parse(JSON.stringify({ wall: Date.now(), wnow: W.now, wphase: W.phase, wended: !!W.ended,
      wstart: W.start, wend: W.end, wremain: W.remainDays, wseed: W.seed,
      ckPhase: CK.timeline ? CK.timeline.phase : null, ckEnded: !!CK.ended, ckNote: CK.endedNote, ckNever: !!CK.neverActive,
      rvOk: !!rv.ok, rvCode: rv.code || null, rvPayout: rv.payout || null,
      tp: TP.items.map((x) => x.key), tpEndSrc: TP.endSrc }));
  `);
  chk(X.wall > X.wend, "두 번째 시계가 실제로 창 만기 **뒤**다(검사가 공집합이 아니다)", [X.wall, X.wend]);
  chk(X.wnow === new Date(2026, 9, 6).getTime() && X.wseed === "demo",
    "벽시계가 밀려도 시연 시드 창의 판정 시각은 기준일 그대로(고정 리터럴 대조)", [X.wnow, X.wseed]);
  chk(X.wstart === new Date(2026, 8, 6).getTime() && X.wend === new Date(2026, 10, 5).getTime() && X.wphase === "보장 중" && X.wended === false && X.wremain === 30,
    "벽시계가 밀려도 창·국면·잔여일이 그대로다(2026-09-06 ~ 2026-11-05 · 보장 중 · 30일)", [X.wphase, X.wremain]);
  chk(X.ckPhase === X.wphase && X.ckEnded === false && X.ckNote === null && X.ckNever === false,
    "회원 화면(checkupIns)이 창과 같은 국면을 말한다 — 배지 「보장 중」과 히어로 「만기가 지났어요」가 한 화면에 같이 서지 않는다", [X.ckPhase, X.ckEnded, X.ckNote]);
  chk(X.rvOk === true && X.rvCode === null && X.rvPayout === 100000,
    "벽시계가 만기 뒤여도 창 안 진료일의 검진 청구는 자동승인(claimReview에 두 번째 시계 없음)", [X.rvOk, X.rvCode]);
  chk(JSON.stringify(X.tp) === JSON.stringify(["m30", "m7", "m1"]),
    "프로 ⑨도 벽시계가 밀려도 창과 같은 국면(mend 0행 — 두 시계로 말하지 않는다)", X.tp);
} catch (e) { fail.push("두 번째 시계 행동 단언 실패: " + e.message); }

/* ── 결과 ── */
console.log("── 본인 실측 통일 가드 ──");
ok.forEach((s) => console.log("  ✓ " + s));
if (fail.length) { console.log(""); fail.forEach((s) => console.log("  ✗ " + s)); }
console.log("\n통과 " + ok.length + " · 실패 " + fail.length);
process.exit(fail.length ? 1 : 0);
