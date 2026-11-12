/* ══════════════ 예실 대비 — 두 축 대조(corpPlanActual.js) · CorpOps Phase 6 (조성래님 지시 2026-11-11) ══════════════
   계획 축(재무계획)과 실적 축(재무현황)을 맞댄다. **금액을 나란히 놓는 지면이 아니다.**

   ⚠️ 왜 그냥 못 놓는가 — 네 겹이 어긋나 있다(전부 실측으로 확인했다)
     ① 달력이 안 겹친다. 계획 원장은 2026-10~2031-12, 전표는 2026-09~2026-11.
        겹치는 달은 **2026-10 · 2026-11 두 달뿐**이고 2026-09는 계획 행 자체가 없다.
     ② 그 두 달조차 계획에서는 **준비기간이라 손익 밖**이다 — 46개 손익 키가 전부 0이다
        (finBudget.js:899 — idx<1이면 pl을 0으로 채우고 비용은 결손금으로만 쌓는다).
        그래서 지금 자료로는 **차이 칸이 한 줄도 서지 않는다. 그게 정직한 결과다.**
     ③ 「실적」이라는 말이 이미 다른 뜻으로 쓰인다. 재무계획 화면의 실적 열은 계획 × k(≈0.49) 환산층이다
        (finBudget.js:990). 이 지면의 실적은 **전표에서 올라온 값만**이다. 환산층을 쓰지 않는다.
     ④ 부가세 체계가 다르다. 계획 매출은 공급가액, 전표는 부가세를 분리 계상한다.

   원칙
     · 대응표가 본체다. 차이·달성률은 **세 조건이 모두 설 때만** 숫자가 된다
       (교집합 월 · 준비기간 아님 · 매핑 확정이고 계획 > 0). 아니면 「—」와 사유다.
     · 「대응 없음」은 이 표에 적지 않는다 — **여집합으로 계산**한다. 적는 순간 원천이 둘이 된다.
     · AI는 계정과목을 **제안**까지만 한다(corpOrg.js M2 can). 확정 전 후보(st:"ask")는 차이를 만들지 않는다.
     · 분모가 0이면 비율을 만들지 않는다(finBudget.js:1012 선례).
     · 계획 객체를 **고치지 않는다.** fbModel()은 캐시된 같은 객체를 돌려주므로(finBudget.js:1069)
       거기에 값을 얹으면 재무계획 화면과 fin_site_check가 보는 계획이 같이 오염된다. 늘 새 객체를 만든다.
     · 계획 축은 **함수 안에서만** 읽는다. 번들에서 이 파일이 finBudget.js보다 먼저 실리므로
       최상위에서 fbModel()을 부르면 TDZ로 번들이 통째로 죽는다.
     · 실적 축은 corpJvAll(corpLedgerRead())로 읽는다. CORP_JV_SEED를 직접 읽으면
       조성래님이 올린 전표가 빠져 옆 탭 재무현황과 숫자가 갈린다. */

/* ── ① 두 축의 전제 — 금액 옆에 늘 붙는다 ────────────────────────────────── */
const CORP_PA_AXIS = {
  plan: { ko: "계획 축", src: "재무계획 · 예산양식 v3.8",
    note: "공급가액(부가세 없음) · 준비기간(2026-10~12)은 손익 밖 · 투자금 1차 납입 2026-10 전제" },
  act: { ko: "실적 축", src: "재무현황 · 복식부기 장부",
    note: "전기(posted)분만 · 부가세 별도 계상 · 발생주의" },
};

/* 합계·소계 — 매핑 대상이 아니다. 각 축이 제 축의 합으로 따로 보인다. */
const CORP_PA_SUB = ["rev", "cogs", "gross", "mktSum", "itOpex", "sga", "ebitda", "ebit", "pbt", "net"];

/* 이름 — 재무계획 화면(FIN_PL_ROWS)이 이미 가진 라벨은 거기서 가져온다(사본을 만들지 않는다).
   거기에 없는 세부 비목만 여기서 보탠다. 러너가 36개 전건 이름이 붙는지 단언한다. */
const CORP_PA_LABEL_X = {
  mk1: "검진 시기 안내 발송비", media: "온라인 타겟 광고 매체비", creative: "광고 소재 제작비",
  cardAd: "카드사 제휴 광고비", kit: "검진센터 QR 키트", sticker: "QR 스티커", qrfee: "QR 연계 수수료",
  itMaint: "시스템 유지보수", itData: "데이터 이용료", itSec: "보안 운영비",
  cloudBase: "클라우드 기본", cloudVar: "클라우드 증설", llm: "LLM 상담 비용", bc: "기록 체인 비용",
  int: "이자비용",
};
function corpPaLabel(k) {
  try {
    if (typeof FIN_PL_ROWS !== "undefined") {
      const r = FIN_PL_ROWS.find((x) => x[0] === k);
      if (r) return r[1];
    }
  } catch (e) { /* 적재 순서 — 아래 보조표로 간다 */ }
  return CORP_PA_LABEL_X[k] || k;
}

/* ── ② 매핑표 — 이 표가 단일 원천이다 ────────────────────────────────────
   k    계획 비목 키(계획 원장 pl의 키여야 한다 — 러너가 단언한다)
   acct 실적 계정 코드. 한 비목이 여러 계정에 흩어지면 여럿을 적는다(1:N).
        여러 비목이 같은 코드를 적으면 그게 N:1이다 — 계정 쪽은 그 비목들의 합과만 맞춘다.
   st   "ok"  확정 대응 — 차이를 계산한다.
        "ask" 계정 후보 — 확정 전이라 **차이를 만들지 않는다**. 확정은 사람 몫이다.
   why  범위가 어긋나는 지점. 같은 칸에 적는다 — 뭉개면 차이가 어디서 왔는지 못 밝힌다. */
const CORP_PA_MAP = [
  /* 확정 — 1:1 */
  { k: "pay", acct: ["801"], st: "ok",
    why: "계획 인건비는 사용자부담 4대보험·퇴직급여 적립을 포함하고, 801 급여는 총급여만 받습니다" },
  { k: "depr", acct: ["818"], st: "ok", why: "" },
  { k: "int", acct: ["901"], st: "ok",
    why: "계획은 차입을 두지 않아 이자비용이 늘 0입니다 — 달성률을 만들지 않습니다" },

  /* 확정 — N:1. 세 비목이 한 계정으로 모인다. 계정 쪽은 세 비목의 합과만 맞춘다. */
  { k: "media", acct: ["833"], st: "ok", why: "833 광고선전비가 매체비·소재비·제휴 광고비를 함께 받습니다" },
  { k: "creative", acct: ["833"], st: "ok", why: "위와 같은 계정으로 모입니다" },
  { k: "cardAd", acct: ["833"], st: "ok", why: "위와 같은 계정으로 모입니다" },

  /* 후보 — 1:N. 한 비목이 성격별 여러 계정에 흩어진다. 경계는 사람이 정한다. */
  { k: "adminCost", acct: ["811", "812", "814", "817", "826", "848"], st: "ask",
    why: "계획 관리비는 수익 요율로 만든 한 덩어리이고 장부는 성격별로 나뉩니다 — 경계는 사람이 정합니다" },
  { k: "salesCost", acct: ["813"], st: "ask",
    why: "계획 영업비 안에 접대비만 들어가는지 확정 전입니다" },

  /* 후보 — N:1. 지급수수료 한 계정에 여러 비목이 몰린다. */
  { k: "mediRep", acct: ["830"], st: "ask", why: "830 지급수수료는 그 밖 수수료도 함께 받습니다" },
  { k: "itMaint", acct: ["830"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "itData", acct: ["830"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "itSec", acct: ["830"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "cloudBase", acct: ["830", "814"], st: "ask", why: "814 통신비일 수도 있어 확정 전입니다" },
  { k: "cloudVar", acct: ["830", "814"], st: "ask", why: "814 통신비일 수도 있어 확정 전입니다" },
  { k: "llm", acct: ["830"], st: "ask", why: "용역 성격인지 통신 성격인지 확정 전입니다" },
  { k: "bc", acct: ["830"], st: "ask", why: "용역 성격인지 통신 성격인지 확정 전입니다" },

  /* 후보 — N:1. 플랫폼 수익 스트림이 용역매출 한 계정으로 모인다. */
  { k: "revChk", acct: ["401"], st: "ask", why: "장부에 수익 계정이 401·411 둘뿐이라 스트림이 구분되지 않습니다" },
  { k: "revSvc", acct: ["401"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "revResv", acct: ["401"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "revCare", acct: ["401"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "revSub", acct: ["401"], st: "ask", why: "위와 같은 계정 후보입니다" },
  { k: "revIns", acct: ["401"], st: "ask", why: "위와 같은 계정 후보입니다" },
];

/* 차이를 못 내는 사유 — 화면이 「—」 옆에 적는 말. 코드도 한 벌만 둔다. */
const CORP_PA_WHY = {
  nofin: { ko: "계획 미연결", d: "재무 엔진을 불러오지 못했습니다" },
  out: { ko: "비교 기간 밖", d: "그 달의 계획 행이 없거나 전표가 없습니다" },
  pre: { ko: "준비기간", d: "계획에서 손익 밖입니다 — 비용이 결손금으로만 쌓입니다" },
  none: { ko: "대응 없음", d: "장부에 받을 계정이 없거나 계획에 그 비목이 없습니다" },
  ask: { ko: "확정 대기", d: "계정 후보까지만 세웠습니다 — 확정은 사람이 합니다" },
  zero: { ko: "계획 0", d: "분모가 없어 달성률을 만들지 않습니다" },
  idle: { ko: "양쪽 없음", d: "그 달 계획도 실적도 움직이지 않았습니다" },
};

/* ── ③ 달 경계 — **한 함수에서만 만든다** ────────────────────────────────
   재무현황 화면은 m+"-31"로 자르는데(사전식 비교라 결과는 같다) 없는 날짜를 만든다.
   여기서는 실재 월말을 쓴다. new Date() 를 쓰지 않는다(결정론 규약). */
function corpPaCut(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || "");
  if (!m) return "";
  const y = +m[1], mo = +m[2];
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const last = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1] || 31;
  return ym + "-" + String(last).padStart(2, "0");
}
function corpPaPrevYm(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || "");
  if (!m) return "";
  let y = +m[1], mo = +m[2] - 1;
  if (mo < 1) { mo = 12; y -= 1; }
  return y + "-" + String(mo).padStart(2, "0");
}

/* ── ④ 계획 축 — 렌더 시점에만 읽는다(TDZ) ─────────────────────────────── */
function corpPaPlanAll() {
  if (typeof fbModel !== "function") return null;
  try {
    const M = fbModel();
    const rows = M && M.ledger && M.ledger.plan;
    if (!Array.isArray(rows) || !rows.length) return null;
    return { rows: rows, scn: (M.P && M.P.scn) || "base", scnKo: (M.P && M.P.scnMeta && M.P.scnMeta.label) || "" };
  } catch (e) { return null; }
}
function corpPaPlanRow(cal, all) {
  const A = all || corpPaPlanAll();
  if (!A) return null;
  return A.rows.find((r) => r.cal === cal) || null;
}
/* 계획 손익 비목(합계 제외) — 계획 행에서 직접 뽑는다. 목록을 손으로 다시 적지 않는다. */
function corpPaLeaves(all) {
  const A = all || corpPaPlanAll();
  if (!A) return [];
  return Object.keys(A.rows[0].pl).filter((k) => CORP_PA_SUB.indexOf(k) < 0);
}

/* ── ⑤ 실적 축 — 그 달 **단월** 발생액 ──────────────────────────────────
   upto는 기초부터의 누적 절단이므로 단월은 두 cut의 차분으로 뽑는다.
   전표를 날짜로 미리 거르지 않는다 — 개시 잔액 전표가 빠져 재무상태표가 조용히 틀어진다. */
function corpPaActual(jvs, cal) {
  if (typeof corpTrial !== "function") return {};
  const cur = corpTrial(jvs, corpPaCut(cal)).book;
  const prev = corpTrial(jvs, corpPaCut(corpPaPrevYm(cal))).book;
  const out = {};
  CORP_ACCT.forEach((a) => {
    const c = cur[a.c] || { sign: 0 }, p = prev[a.c] || { sign: 0 };
    const d = c.sign - p.sign;                  /* 부호 잔액(차−대) */
    /* **계획 축과 같은 부호 규약으로 맞춘다** — 계획의 매출도 비용도 양수다.
       수익 계정은 대변이 정상이라 차−대가 음수로 나오므로 한 번 뒤집는다.
       비용(X)은 차변이 정상이라 그대로 둔다(여기서 또 뒤집으면 전부 음수가 된다).
       이걸 안 맞추면 차이 = 실적 − 계획 이 매출 행에서 통째로 거짓이 된다. */
    out[a.c] = a.t === "R" ? -d : d;
  });
  return out;
}
/* 실적 손익 계정(수익 R · 비용 X) — 활동이 0이어도 빠지지 않는다.
   corpStatements의 pl.X는 dr·cr 0인 과목을 걸러내므로 「대응 없음」이 화면에서 사라진다. */
function corpPaPlAccts() {
  return CORP_ACCT.filter((a) => a.t === "R" || a.t === "X").map((a) => a.c);
}

/* ── ⑥ 비교 가능한 달 — 상수로 박지 않고 매번 양쪽에서 계산한다 ──────────
   전표가 늘어나면 교집합도 늘어나야 한다. 박아 두면 화면이 조용히 낡는다. */
function corpPaMonths(jvs) {
  const A = corpPaPlanAll();
  if (!A || typeof corpJvMonths !== "function") return [];
  const planCal = {};
  A.rows.forEach((r) => { planCal[r.cal] = 1; });
  return corpJvMonths(jvs).filter((m) => planCal[m]);
}

/* ── ⑦ 행 만들기 — 차이는 세 조건이 모두 설 때만 숫자가 된다 ──────────── */
function corpPaRows(jvs, cal) {
  const A = corpPaPlanAll();
  const leaves = corpPaLeaves(A);
  const planRow = corpPaPlanRow(cal, A);
  const act = corpPaActual(jvs, cal);
  const mapOf = {};
  CORP_PA_MAP.forEach((m) => { mapOf[m.k] = m; });

  return leaves.map((k) => {
    const m = mapOf[k] || null;
    const acct = m ? m.acct : [];
    const plan = planRow ? (+planRow.pl[k] || 0) : null;
    /* 실적은 매핑된 계정의 합이다. 후보(ask)여도 **보여는 준다** — 빼되 버리지 않는다. */
    const actual = acct.length ? acct.reduce((n, c) => n + (+act[c] || 0), 0) : null;

    let why = null;
    if (!A) why = "nofin";
    else if (!planRow) why = "out";
    else if (planRow.idx < 1) why = "pre";
    else if (!m) why = "none";
    else if (m.st !== "ok") why = "ask";
    else if (!(plan > 0)) why = (plan === 0 && !actual) ? "idle" : "zero";

    const ok = why === null;
    return {
      k: k, label: corpPaLabel(k), acct: acct, st: m ? m.st : "none",
      scope: m ? m.why : "", plan: plan, actual: actual,
      diff: ok ? actual - plan : null,
      rate: ok && plan > 0 ? actual / plan : null,
      why: why,
    };
  });
}

/* ── ⑧ 대응 없음 — 여집합으로 센다. 뜻이 셋이라 라벨도 셋이다 ────────────
   ⒜ 매핑 자체가 없다  ⒝ 후보만 있고 확정 전이다  ⒞ 그 달 양쪽이 움직이지 않았다
   셋을 한 말로 덮으면 조성래님이 전부 「자료가 덜 들어왔다」로 읽는다. */
function corpPaUnmatched(jvs, cal) {
  const leaves = corpPaLeaves();
  const okK = {}, askK = {};
  const okA = {}, askA = {};
  CORP_PA_MAP.forEach((m) => {
    (m.st === "ok" ? okK : askK)[m.k] = 1;
    m.acct.forEach((c) => { (m.st === "ok" ? okA : askA)[c] = 1; });
  });
  const pl = corpPaPlAccts();
  const act = cal ? corpPaActual(jvs, cal) : {};
  return {
    planOk: leaves.filter((k) => okK[k]),
    planAsk: leaves.filter((k) => !okK[k] && askK[k]),
    planNone: leaves.filter((k) => !okK[k] && !askK[k]),
    acctOk: pl.filter((c) => okA[c]),
    acctAsk: pl.filter((c) => !okA[c] && askA[c]),
    acctNone: pl.filter((c) => !okA[c] && !askA[c]),
    /* 그 달 실제로 움직였는데 확정 대응이 없는 계정 — 차이의 출처를 못 밝히는 자리다 */
    acctMoved: pl.filter((c) => !okA[c] && (+act[c] || 0) !== 0),
    leaves: leaves.length, accts: pl.length,
  };
}

/* ── ⑨ 단언 — 화면의 「검산」과 커밋 게이트 러너가 **이 함수 하나**를 같이 부른다 ──
   n은 분모다. 검사 대상이 0건이면 통과가 아니라 실패다. */
function corpPaVerdict(jvs, cal) {
  const A = corpPaPlanAll();
  const leaves = corpPaLeaves(A);
  const U = corpPaUnmatched(jvs, cal);
  const rows = cal ? corpPaRows(jvs, cal) : [];
  const months = corpPaMonths(jvs);
  const planKeys = {};
  leaves.forEach((k) => { planKeys[k] = 1; });
  const acctKeys = {};
  (typeof CORP_ACCT !== "undefined" ? CORP_ACCT : []).forEach((a) => { acctKeys[a.c] = a.t; });

  const badKey = CORP_PA_MAP.filter((m) => !planKeys[m.k]);
  const badAcct = CORP_PA_MAP.filter((m) => m.acct.some((c) => acctKeys[c] !== "R" && acctKeys[c] !== "X"));
  const dupK = {}, dupes = [];
  CORP_PA_MAP.forEach((m) => { if (dupK[m.k]) dupes.push(m.k); dupK[m.k] = 1; });
  const noWhy = CORP_PA_MAP.filter((m) => m.st === "ask" && !(m.why || "").trim());
  const badSt = CORP_PA_MAP.filter((m) => m.st !== "ok" && m.st !== "ask");
  const noLabel = leaves.filter((k) => corpPaLabel(k) === k);
  /* 사유가 붙은 행에 차이·달성률이 서면 실패 — 기계가 사람 몫을 가로채는 자리다 */
  const leak = rows.filter((r) => r.why !== null && (r.diff !== null || r.rate !== null));
  const rateLeak = rows.filter((r) => !(r.plan > 0) && r.rate !== null);
  const askLeak = rows.filter((r) => r.st === "ask" && r.diff !== null);

  return [
    { k: "fin", ko: "계획 엔진 적재", n: A ? A.rows.length : 0, ok: !!A, got: A ? A.rows.length + "행" : "미연결", want: "> 0행" },
    { k: "leaf", ko: "계획 비목 + 합계 = 전 키", n: leaves.length, ok: leaves.length > 0, got: leaves.length + " + " + CORP_PA_SUB.length, want: "> 0" },
    { k: "key", ko: "매핑 키가 계획 비목에 있다", n: CORP_PA_MAP.length, ok: badKey.length === 0, got: badKey.length + "건 밖", want: "0건" },
    { k: "acct", ko: "매핑 계정이 손익 계정이다", n: CORP_PA_MAP.length, ok: badAcct.length === 0, got: badAcct.length + "건 밖", want: "0건" },
    { k: "dupe", ko: "매핑 키 중복 0건", n: CORP_PA_MAP.length, ok: dupes.length === 0, got: dupes.length + "건", want: "0건" },
    { k: "st", ko: "확정·후보 외 상태 0건", n: CORP_PA_MAP.length, ok: badSt.length === 0, got: badSt.length + "건", want: "0건" },
    { k: "why", ko: "후보에 사유 기재", n: CORP_PA_MAP.filter((m) => m.st === "ask").length, ok: noWhy.length === 0, got: noWhy.length + "건 누락", want: "0건" },
    { k: "label", ko: "비목 전건 이름", n: leaves.length, ok: noLabel.length === 0, got: noLabel.length + "건 누락", want: "0건" },
    { k: "sumP", ko: "확정 + 후보 + 없음 = 비목 전수", n: U.leaves, ok: U.planOk.length + U.planAsk.length + U.planNone.length === U.leaves, got: U.planOk.length + "+" + U.planAsk.length + "+" + U.planNone.length, want: String(U.leaves) },
    { k: "sumA", ko: "확정 + 후보 + 없음 = 계정 전수", n: U.accts, ok: U.acctOk.length + U.acctAsk.length + U.acctNone.length === U.accts, got: U.acctOk.length + "+" + U.acctAsk.length + "+" + U.acctNone.length, want: String(U.accts) },
    { k: "openP", ko: "계획 쪽 대응 없음 노출", n: U.leaves, ok: U.planAsk.length + U.planNone.length > 0, got: (U.planAsk.length + U.planNone.length) + "건", want: "> 0건" },
    { k: "openA", ko: "장부 쪽 대응 없음 노출", n: U.accts, ok: U.acctAsk.length + U.acctNone.length > 0, got: (U.acctAsk.length + U.acctNone.length) + "건", want: "> 0건" },
    { k: "okN", ko: "확정 매핑 존재", n: CORP_PA_MAP.length, ok: U.planOk.length > 0, got: U.planOk.length + "건", want: "> 0건" },
    { k: "rows", ko: "대조 행 생성", n: rows.length, ok: rows.length === leaves.length && rows.length > 0, got: rows.length + "행", want: leaves.length + "행" },
    { k: "leak", ko: "사유 붙은 행에 차이 0건", n: rows.length, ok: leak.length === 0, got: leak.length + "건", want: "0건" },
    { k: "rate", ko: "계획 0에 달성률 0건", n: rows.length, ok: rateLeak.length === 0, got: rateLeak.length + "건", want: "0건" },
    { k: "ask", ko: "확정 전 후보가 차이를 만들지 않음", n: rows.filter((r) => r.st === "ask").length, ok: askLeak.length === 0, got: askLeak.length + "건", want: "0건" },
    { k: "month", ko: "비교 가능 달 산출", n: months.length, ok: true, got: months.length ? months.join(" · ") : "없음", want: "양쪽 축 교집합" },
  ];
}
function corpPaPass(jvs, cal) {
  const rows = corpPaVerdict(jvs, cal);
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
