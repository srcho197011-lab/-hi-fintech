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

/* ── 데이터 레이어 적재(.js만 — 화면 JSX는 빌드 게이트가 검증) ── */
const store = new Map();
const localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
const ctx = { console, localStorage, setTimeout, clearTimeout, escape: (s) => s };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
ctx.document = { createElement: () => ({ style: {} }), body: { appendChild() {}, removeChild() {} } };
ctx.React = { useState: () => [null, () => {}], useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }) };
vm.createContext(ctx);
for (const f of ["src/data/dummy_data.js", "src/data/section_data.js", "src/data/demo_members.js"]) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f }); } catch (e) { fail.push("plain 데이터 적재 실패: " + f); }
}
const manifest = fs.readFileSync(path.join(ROOT, "src/_manifest.txt"), "utf8").split(/\r?\n/).filter(Boolean);
let loaded = 0;
for (const f of manifest) {
  if (!/\.js$/.test(f)) continue;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f }); loaded++; }
  catch (e) { fail.push("모듈 적재 실패 " + f + " :: " + String(e.message).split("\n")[0]); }
}
chk(loaded > 100, "데이터 모듈 적재", loaded);

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
             ended: !!CKI.ended, src: CKI.coverSrc, cover0: (CKI.coverage || [])[0] },
      W: W ? { start: W.start, end: W.end, phase: W.phase, src: W.src } : null,
      TP: { items: TP.items.map((x) => x.key), endSrc: TP.endSrc, mend: (TP.items.find((x) => x.key === "mend") || {}).title || null },
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
  chk(S.CKI.start === (S.W && S.W.start) && S.CKI.end === (S.W && S.W.end) && S.CKI.phase === (S.W && S.W.phase),
    "검진대비보험 보장기간 = insCheckupWindow 한 소스(회원 화면·프로 콘솔 동일)", [S.CKI, S.W]);
  chk(S.CKI.ended === true && S.CKI.phase === "보장 종료", "2024-12-26 증서 → 회원 화면도 「보장 종료」", [S.CKI.phase, S.CKI.ended]);
  chk(new Date(S.CKI.end).getFullYear() === 2025, "만기 연도 2025(증서 날짜 기준 · 금고 시드 시각 아님)", new Date(S.CKI.end).toISOString().slice(0, 10));
  chk(/CERT-JSR2024A/.test(String(S.CKI.src || "")), "보장기간 근거 문구 = 증서 CERT-JSR2024A", S.CKI.src);
  chk(S.TP.items.indexOf("mend") >= 0 && !/undefined/.test(String(S.TP.mend)), "프로 콘솔 ⑨도 만기 경과 1행(mend)", S.TP);

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

/* ── 결과 ── */
console.log("── 본인 실측 통일 가드 ──");
ok.forEach((s) => console.log("  ✓ " + s));
if (fail.length) { console.log(""); fail.forEach((s) => console.log("  ✗ " + s)); }
console.log("\n통과 " + ok.length + " · 실패 " + fail.length);
process.exit(fail.length ? 1 : 0);
