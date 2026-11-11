/* ══════════════ AI 팀장 능력 · 대화(corpAgent.js) · CorpOps (형 지시 2026-11-12) ══════════════
   AI 팀장 여덟이 **실제로 무엇을 할 수 있는가**를 도구로 정의하고, 사람 직원과 대화하는 창을 받친다.

   ⚠️ 가장 중요한 규칙 — **도구가 있는 것만 답한다.**
      이 제품에는 사내용 언어모델이 붙어 있지 않다. 그럴듯한 문장을 지어낼 수단 자체를 두지 않았다.
      에이전트는 등록된 도구를 **실제로 돌려** 나온 값을 말하고, 도구가 없으면
      「그 질문에 답할 도구가 없습니다」라고 말한다. 모르는 것을 아는 척하지 않는다.

   두 번째 규칙 — **사내 에이전트는 회원 데이터를 보지 않는다.**
      헬시·인슈러는 회원을 돌보는 이름이지만, 여기 있는 것은 **사내 운영 축**이다.
      회원 데이터는 회원 대면 에이전트의 것이고, 사내 축이 들여다보면 경계가 무너진다.
      그래서 그 둘은 사내 도구가 적고, 적다는 사실을 그대로 말한다.

   세 번째 규칙 — **할 수 있는 일과 못 하는 일이 같은 원천에서 나온다.**
      corpOrg.js 의 can/cannot 을 그대로 읽는다. 화면에 적은 제약과 실제 거절이 어긋나지 않게. */

const CORP_AG_KEY = "hifin_corp_chat";   /* dataCatalog.js 등재 필수 — 대화 기록 */

/* ── ① 도구 — 에이전트가 실제로 돌릴 수 있는 것 ──────────────────────
   k    도구 코드
   ko   사람이 읽는 이름
   ask  이 도구를 부르는 말(의도 매칭). 겹치면 먼저 선언된 것이 이긴다.
   run  **실제 값을 계산한다.** 문장을 지어내지 않는다. { t: 한 줄 답, rows: [[이름, 값]] }
   ⚠️ run 안에서 typeof 로 함수 존재를 확인한다 — 번들 적재 순서 때문이다. */
const CORP_AG_TOOL = [
  /* ── 핀테크(M2 회계) ── */
  { ai: "핀테크", k: "jv", ko: "전표 현황", ask: ["전표", "분개", "기표", "승인 대기"],
    run: function () {
      if (typeof corpJvAll !== "function") return null;
      const jvs = corpJvAll(corpLedgerRead());
      const p = corpPosted(jvs);
      return { t: "전표 " + jvs.length + "건 가운데 " + p.length + "건이 전기됐고 " + (jvs.length - p.length) + "건이 승인 전입니다.",
        rows: [["전체", jvs.length + "건"], ["전기", p.length + "건"],
               ["검토", jvs.filter(function (j) { return j.st === "review"; }).length + "건"],
               ["기표", jvs.filter(function (j) { return j.st === "draft"; }).length + "건"]] };
    } },
  { ai: "핀테크", k: "check", ko: "장부 검산", ask: ["검산", "항등식", "차대", "맞는지", "이상"],
    run: function () {
      if (typeof corpLedgerVerdict !== "function") return null;
      const V = corpLedgerVerdict(corpJvAll(corpLedgerRead()), CORP_BANK_SEED);
      const bad = V.filter(function (r) { return !r.ok; });
      return { t: "항등식 " + V.length + "항목 중 " + (V.length - bad.length) + "항목이 통과했습니다" + (bad.length ? " — 실패 " + bad.length + "항목." : "."),
        rows: V.map(function (r) { return [r.ko, (r.ok ? "통과" : "실패") + " · " + r.got]; }) };
    } },
  { ai: "핀테크", k: "fs", ko: "재무제표", ask: ["재무제표", "손익", "자산", "매출", "비용", "이익"],
    run: function () {
      if (typeof corpStatements !== "function") return null;
      const S = corpStatements(corpJvAll(corpLedgerRead()));
      return { t: "수익 " + corpWon(S.pl.rev) + "원 · 비용 " + corpWon(S.pl.exp) + "원 · 당기손익 " + corpWon(S.pl.net) + "원입니다.",
        rows: [["수익", corpWon(S.pl.rev)], ["비용", corpWon(S.pl.exp)], ["당기손익", corpWon(S.pl.net)],
               ["자산 총계", corpWon(S.bs.assets)], ["부채", corpWon(S.bs.liab)], ["자본", corpWon(S.bs.equity)]] };
    } },
  { ai: "핀테크", k: "bank", ko: "은행 대사", ask: ["은행", "대사", "미대사", "입출금", "통장"],
    run: function () {
      if (typeof corpBankRecon !== "function") return null;
      const R = corpBankRecon(corpJvAll(corpLedgerRead()), CORP_BANK_SEED);
      return { t: "자동 대사 " + R.matched + "건, 남은 것 " + (R.bankOnly.length + R.bookOnly.length) + "건입니다. 남은 줄은 사람이 처리합니다.",
        rows: [["은행 잔액", corpWon(R.bankBal)], ["장부 잔액", corpWon(R.bookBal)],
               ["은행에만", R.bankOnly.length + "건"], ["장부에만", R.bookOnly.length + "건"],
               ["조정 후 차이", corpWon(R.gap)]] };
    } },
  { ai: "핀테크", k: "pa", ko: "예실 대비", ask: ["예실", "계획 대비", "달성", "차이"],
    run: function () {
      if (typeof corpPaUnmatched !== "function") return null;
      const jvs = corpJvAll(corpLedgerRead());
      const U = corpPaUnmatched(jvs, "");
      const M = typeof corpPaMonths === "function" ? corpPaMonths(jvs) : [];
      return { t: "두 축이 겹치는 달은 " + (M.length ? M.join(" · ") : "없습니다") + "이고, 그 달은 계획에서 준비기간이라 손익 밖입니다. 그래서 지금 차이 칸이 서지 않습니다.",
        rows: [["계획 비목", U.leaves + "개"], ["대응 확정", U.planOk.length + "개"],
               ["확정 대기", U.planAsk.length + "개"], ["대응 없음", U.planNone.length + "개"],
               ["겹치는 달", M.join(" · ") || "없음"]] };
    } },

  /* ── 나침반(M1 경영기획) ── */
  { ai: "나침반", k: "org", ko: "조직 현황", ask: ["조직", "인원", "팀", "몇 명", "공석"],
    run: function () {
      if (typeof CORP_SUMMARY === "undefined") return null;
      return { t: "팀 " + CORP_SUMMARY.teams + "개 · AI 팀장 " + CORP_SUMMARY.agents + "명 · 재직 " + CORP_SUMMARY.peopleN + "명입니다. 자리는 " + CORP_SUMMARY.filled + " / " + CORP_SUMMARY.cap + "이고 합류 전이 " + CORP_SUMMARY.pendingN + "명입니다.",
        rows: [["팀", CORP_SUMMARY.teams + "개"], ["재직", CORP_SUMMARY.peopleN + "명"],
               ["채워진 자리", CORP_SUMMARY.filled + " / " + CORP_SUMMARY.cap],
               ["합류 전", CORP_SUMMARY.pending.join(" · ")]] };
    } },
  { ai: "나침반", k: "ct", ko: "계약 만료", ask: ["계약", "만료", "갱신", "기한"],
    run: function () {
      if (typeof CORP_CT === "undefined" || typeof corpCtAlert !== "function") return null;
      const now = corpOpsNow();
      const rows = CORP_CT.map(function (c) { return { c: c, a: corpCtAlert(c, now) }; })
        .sort(function (x, y) { return (x.a.d || 0) - (y.a.d || 0); });
      const near = rows.filter(function (r) { return r.a.k !== "ok" && r.a.k !== "none"; });
      return { t: "계약 " + CORP_CT.length + "건 중 경보가 선 것은 " + near.length + "건입니다. 갱신·해지 결정은 사람이 합니다.",
        rows: rows.map(function (r) { return [r.c.ko, r.a.ko + " · " + r.c.to]; }) };
    } },
  { ai: "나침반", k: "mtg", ko: "주간회의", ask: ["회의", "주간", "언제", "보고"],
    run: function () {
      if (typeof corpMtgWeek !== "function") return null;
      const w = corpMtgWeek(corpOpsNow());
      if (!w) return { t: "다음 회의를 계산하지 못했습니다.", rows: [] };
      const st = corpMtgRead(); const wk = corpMtgOf(st, w);
      const mg = wk ? corpMtgCanMerge(wk) : null;
      return { t: "다음 주간회의는 " + w.key + " " + w.time + " · " + w.mode + "입니다(D-" + w.dday + ").",
        rows: [["일시", w.key + " " + w.time], ["방식", w.mode],
               ["보고 확정", mg ? mg.done + " / " + mg.need + "팀" : "자료 미생성"],
               ["확정자 공석", mg ? mg.skip + "팀" : "—"]] };
    } },
  { ai: "나침반", k: "rt", ko: "루틴 상태", ask: ["루틴", "일마감", "월마감", "밀린", "예정"],
    run: function () {
      if (typeof CORP_SCHEDULE === "undefined" || typeof corpRoutineState !== "function") return null;
      const now = corpOpsNow(); const st = corpMtgRead(); const w = corpMtgWeek(now);
      const rs = CORP_SCHEDULE.routines.map(function (r) { return { t: r.t, s: corpRoutineState(r, st, now, w) }; });
      const due = rs.filter(function (x) { return x.s.state === "due"; });
      return { t: "루틴 " + rs.length + "종 가운데 생성 경로가 붙은 것은 " + CORP_MTG_GEN.length + "종이고, 지금 밀린 것은 " + due.length + "건입니다.",
        rows: rs.map(function (x) { return [x.t, x.s.ko]; }) };
    } },

  /* ── 인총이(M3 인사총무) ── */
  { ai: "인총이", k: "hr", ko: "인사 기록", ask: ["인사", "직원", "사번", "직위", "전문"],
    run: function () {
      if (typeof CORP_HR === "undefined") return null;
      return { t: "인사 기록 " + CORP_HR.length + "명(재직 " + corpHrOn().length + ")입니다. 직무 정보만 듭니다 — 주민번호 값·주소·연락처는 담지 않습니다.",
        rows: CORP_HR.map(function (h) { return [h.name + (h.on ? "" : "(합류 전)"), (h.no || "사번 없음") + " · " + h.title + " · " + h.teams.join("·")]; }) };
    } },
  { ai: "인총이", k: "rrn", ko: "주민번호 보관", ask: ["주민", "주민번호", "4대보험", "원천징수", "신고"],
    run: function () {
      if (typeof CORP_RRN_GATE === "undefined") return null;
      const open = corpRrnOpen();
      return { t: "주민번호 **값은 이 시스템이 들지 않습니다**. 보유 여부·근거·보관 위치·파기 예정만 듭니다. 값을 담으려면 네 조건이 서야 하는데 지금은 " + CORP_RRN_GATE.filter(function (g) { return g.ok; }).length + " / " + CORP_RRN_GATE.length + "입니다.",
        rows: CORP_RRN_GATE.map(function (g) { return [g.ko, g.ok ? "충족" : "미충족"]; })
          .concat(open.length ? [["보관 책임자 미지정", open.map(function (h) { return h.name; }).join(" · ")]] : []) };
    } },
  { ai: "인총이", k: "doc", ko: "문서 보존기한", ask: ["문서", "보존", "보관", "몇 년", "폐기", "파기"],
    run: function () {
      if (typeof CORP_DOC_CLASS === "undefined") return null;
      return { t: "문서 분류 " + CORP_DOC_CLASS.length + "종입니다. " + CORP_DOC_CLASS.filter(function (d) { return !d.checked; }).length + "종은 법령 원문 대조 전이라 조문 번호를 적지 않았습니다.",
        rows: CORP_DOC_CLASS.map(function (d) { return [d.ko, (d.years === 0 ? "영구" : d.years + "년") + " · " + d.basisKo + (d.checked ? "" : " (원문 미확인)")]; }) };
    } },

  /* ── 하네스(S1 정보보안) ── */
  { ai: "하네스", k: "gate", ko: "커밋 게이트", ask: ["게이트", "보안", "차단", "검사", "막"],
    run: function () {
      if (typeof CORP_GATES === "undefined") return null;
      return { t: "커밋 게이트 " + CORP_GATES.length + "종이 걸려 있습니다. 결과는 커밋할 때 터미널에 뜹니다 — 이 화면이 러너를 돌리지는 못합니다.",
        rows: CORP_GATES.map(function (g) { return [g.ko, g.run]; }) };
    } },
  { ai: "하네스", k: "rel", ko: "릴리스", ask: ["릴리스", "배포", "승인", "release"],
    run: function () {
      if (typeof corpRelAll !== "function") return null;
      const st = corpGovRead(); const rel = corpRelAll(st); const who = corpRelApprovers();
      return { t: who.length ? "릴리스 승인 가능자는 " + who.join(" · ") + "입니다." : "**지금 릴리스를 승인할 수 있는 사람이 없습니다** — 정보보안팀 책임자가 합류 전입니다. 승인 경로를 대표에게 열지 않았습니다.",
        rows: rel.map(function (r) { return [r.ver + " " + r.ko, r.st === "approved" ? "승인 · " + r.ap : "승인 대기"]; })
          .concat([["승인 가능자", who.length ? who.join(" · ") : "0명"]]) };
    } },

  /* ── 온톨로(D1 데이터관리) ── */
  { ai: "온톨로", k: "key", ko: "저장 키", ask: ["저장", "키", "카탈로그", "데이터", "어디에"],
    run: function () {
      if (typeof hifinCatalogSummary !== "function") return null;
      const s = hifinCatalogSummary();
      return { t: "브라우저 저장 키는 정적 " + s.keysStatic + "개 · 접두 " + s.keysPrefix + "개가 등재돼 있습니다. 등재 안 된 키는 커밋이 막힙니다.",
        rows: [["정적 키", s.keysStatic + "개"], ["접두 키", s.keysPrefix + "개"],
               ["그룹", s.groups + "개"], ["외부 소스", s.external + "종"]] };
    } },
];

/* ── ② 에이전트 — 능력은 조직 원천에서 온다 ──────────────────────── */
function corpAgTools(ai) { return CORP_AG_TOOL.filter(function (t) { return t.ai === ai; }); }
function corpAgList() {
  const T = typeof CORP_TEAMS !== "undefined" ? CORP_TEAMS : [];
  return T.map(function (t) {
    const tools = corpAgTools(t.ai);
    return {
      ai: t.ai, team: t.id, sh: t.sh, c: t.c, own: t.own, head: t.head,
      why: t.aiWhy, work: t.work,
      can: t.can, cannot: t.cannot,          /* 조직 원천 그대로 — 화면과 거절이 어긋나지 않게 */
      tools: tools,
      /* 사내 도구가 없는 에이전트는 그 사실을 사유와 함께 말한다 */
      noTool: tools.length === 0,
      noWhy: (t.id === "H1" || t.id === "H2")
        ? "회원 데이터는 회원 대면 에이전트의 것입니다. 사내 축이 들여다보면 경계가 무너져서 조회 도구를 두지 않았습니다."
        : "사내 조회 원천이 아직 없습니다. 실데이터가 들어오면(Phase 10) 도구가 붙습니다.",
    };
  });
}
function corpAgOf(ai) { return corpAgList().find(function (a) { return a.ai === ai; }) || null; }

/* ── ③ 의도 매칭 — 지어내지 않고 **고른다** ──────────────────────────
   말뭉치가 아니라 낱말 겹침이다. 고르지 못하면 고르지 못했다고 말한다. */
function corpAgPick(ai, q) {
  const s = String(q || "").toLowerCase();
  if (!s.trim()) return null;
  const tools = corpAgTools(ai);
  let best = null, bestN = 0;
  tools.forEach(function (t) {
    let n = 0;
    t.ask.forEach(function (w) { if (s.indexOf(String(w).toLowerCase()) >= 0) n += String(w).length; });
    if (n > bestN) { bestN = n; best = t; }
  });
  return best;
}
/* 시키는 말 — 이게 있어야 「요청」이다.
   ⚠️ 없으면 물음까지 거절하게 된다. 「릴리스 승인 누가 해?」는 승인해 달라는 말이 아니다. */
const CORP_AG_DO = ["해줘", "해 줘", "해주세요", "해 주세요", "해라", "하라", "해다오", "처리", "실행",
  "올려", "보내", "발행", "제출", "확정해", "지급", "눌러", "진행해", "시켜", "부탁"];
/* 못 하는 일을 **시켰는가** — 조직 원천의 cannot 과 맞춰 본다 */
function corpAgRefuse(ai, q) {
  const a = corpAgOf(ai);
  if (!a) return null;
  const s = String(q || "").toLowerCase();
  if (!CORP_AG_DO.some(function (w) { return s.indexOf(w) >= 0; })) return null;
  const hit = (a.cannot || []).find(function (c) {
    return String(c.act).split(" · ").some(function (w) {
      const k = String(w).replace(/\s/g, "").toLowerCase();
      return k.length >= 2 && s.replace(/\s/g, "").indexOf(k) >= 0;
    });
  });
  return hit || null;
}

/* ── ④ 답하기 — 도구를 **실제로 돌려** 값을 말한다 ────────────────── */
function corpAgAnswer(ai, q) {
  const a = corpAgOf(ai);
  if (!a) return { kind: "none", t: "그런 이름의 AI 팀장이 없습니다." };
  const ref = corpAgRefuse(ai, q);
  if (ref) {
    return { kind: "refuse", t: "그건 제가 끝내지 못합니다 — " + ref.act + ". " + ref.by, act: ref.act };
  }
  const tool = corpAgPick(ai, q);
  if (!tool) {
    return {
      kind: "notool",
      t: a.noTool
        ? "저는 사내 조회 도구가 없습니다. " + a.noWhy
        : "그 질문에 답할 도구가 없습니다. 지어내지 않겠습니다 — 제가 돌릴 수 있는 것은 아래뿐입니다.",
      tools: a.tools.map(function (t) { return t.ko; }),
    };
  }
  let out = null;
  try { out = tool.run(); } catch (e) { out = null; }
  if (!out) return { kind: "fail", t: "「" + tool.ko + "」을(를) 돌렸지만 원천을 읽지 못했습니다. 값을 지어내지 않겠습니다." };
  return { kind: "ok", tool: tool.ko, t: out.t, rows: out.rows || [] };
}

/* ── ⑤ 대화 기록 ────────────────────────────────────────────────── */
function corpAgRead() {
  const empty = { v: 1, log: {} };
  try {
    const raw = localStorage.getItem(CORP_AG_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, log: (o.log && typeof o.log === "object") ? o.log : {} };
  } catch (e) { return empty; }
}
function corpAgWrite(st) {
  try {
    const log = {};
    Object.keys(st.log || {}).forEach(function (k) { log[k] = (st.log[k] || []).slice(-40); });
    localStorage.setItem(CORP_AG_KEY, JSON.stringify({ v: 1, log: log }));
    return true;
  } catch (e) { return false; }
}

/* ── ⑥ 단언 — 화면과 러너가 같은 함수를 부른다 ─────────────────── */
function corpAgVerdict() {
  const L = corpAgList();
  const withTool = L.filter(function (a) { return a.tools.length > 0; });
  const noTool = L.filter(function (a) { return a.noTool; });
  const badRun = CORP_AG_TOOL.filter(function (t) { return typeof t.run !== "function" || !t.ask.length || !t.ko; });
  const orphan = CORP_AG_TOOL.filter(function (t) { return !L.some(function (a) { return a.ai === t.ai; }); });
  /* 도구가 없는 에이전트가 **아무 말이나 하지 않는지** — 양성 검사 */
  const mute = noTool.map(function (a) { return corpAgAnswer(a.ai, "이번 달 매출 얼마야"); });
  const madeUp = mute.filter(function (r) { return r.kind === "ok"; });
  /* 도구가 있는 에이전트는 **실제로 값을 내는지** — 늘 모른다고 하면 그것도 쓸모없다 */
  const live = withTool.map(function (a) { return corpAgAnswer(a.ai, a.tools[0].ask[0]); });
  const dead = live.filter(function (r) { return r.kind !== "ok"; });
  const refuse = corpAgAnswer("핀테크", "전표 승인 해줘");
  const ask = corpAgAnswer("하네스", "릴리스 승인 누가 해");   /* 물음은 거절이 아니다 */

  return [
    { k: "list", ko: "에이전트 목록", n: L.length, ok: L.length > 0, got: L.length + "명", want: "> 0" },
    { k: "tool", ko: "도구 정의", n: CORP_AG_TOOL.length, ok: badRun.length === 0, got: badRun.length + "건 결함", want: "0건" },
    { k: "orphan", ko: "주인 없는 도구 0건", n: CORP_AG_TOOL.length, ok: orphan.length === 0, got: orphan.length + "건", want: "0건" },
    { k: "withtool", ko: "도구를 가진 에이전트", n: L.length, ok: withTool.length > 0, got: withTool.length + " / " + L.length + "명", want: "> 0" },
    { k: "notool", ko: "도구 없는 에이전트 표본", n: L.length, ok: noTool.length > 0, got: noTool.length + "명", want: "> 0(없으면 침묵 검사가 공집합)" },
    { k: "mute", ko: "도구 없으면 답을 지어내지 않는다", n: mute.length, ok: madeUp.length === 0, got: madeUp.length + "건 지어냄", want: "0건" },
    { k: "mutewhy", ko: "못 하는 이유를 말한다", n: noTool.length, ok: noTool.every(function (a) { return (a.noWhy || "").trim(); }), got: noTool.length + "명", want: "전건 사유" },
    { k: "live", ko: "도구 있는 에이전트는 실제 값을 낸다", n: live.length, ok: dead.length === 0, got: dead.length + "명 실패", want: "0명" },
    { k: "refuse", ko: "못 하는 일을 시키면 거절한다", n: 1, ok: refuse.kind === "refuse", got: refuse.kind, want: "refuse" },
    { k: "ask", ko: "물음은 거절하지 않는다", n: 1, ok: ask.kind === "ok", got: ask.kind, want: "ok(물어보는 것까지 막으면 쓸 수 없다)" },
    { k: "src", ko: "능력이 조직 원천에서 온다", n: L.length, ok: L.every(function (a) { return (a.can || []).length && (a.cannot || []).length; }), got: L.length + "명", want: "can·cannot 전건" },
  ];
}
function corpAgPass() {
  const rows = corpAgVerdict();
  const zero = rows.filter(function (r) { return !(r.n > 0); });
  const fail = rows.filter(function (r) { return !r.ok; });
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
