/* ══════════════ 주간회의 · 업무시간 · 루틴 생성(corpMeeting.js) · CorpOps Phase 7 (형 지시 2026-11-11) ══════════════
   금요일 보고 초안 → 책임자 확정 → 월 09:30 통합 → 10:00 회의 → 회의록 · 후속과제.

   ⚠️ 백엔드가 없다. 브라우저가 닫히면 아무것도 돌지 않는다.
      그래서 「자동 실행」이 아니라 **「다음 열람 시 생성」**이다 — 열었을 때 그 주차 골격이 없으면 만든다.

   이 파일이 지키는 것
     · **초안은 조립이지 창작이 아니다.** 근거가 없는 문장을 만들지 않는다.
       사내 조회 함수가 있는 팀은 M2(회계) 하나뿐이다 — 나머지 일곱 팀은 지표 자리를 「—」로 두고
       「원천 미연결」이라 적는다. 일곱 팀분을 그럴듯하게 채우면 그게 숫자를 지어내는 것이다.
     · **확정은 사람이 한다.** 책임자 자리가 빈 팀(head=0)은 확정할 사람이 없으므로
       확정 경로 자체를 두지 않는다 — 「확정」 배지가 붙을 수 있는 길을 만들지 않는다.
     · **자리와 사람을 구분한다.** 참석자 수는 CORP_SUMMARY에서 읽는다.
       CORP_SCHEDULE.weekly.joinPeople(6)은 책임자 **이름의 종류 수**이지 재직 인원이 아니다(실제 2명).
       그 값을 참석자 수로 쓰면 인원을 세 배로 부풀린다.
     · **「밀림」은 생성물이 없을 때만이다.** 생성 경로가 없는 루틴은 밀린 것이 아니라 돌 수 없는 것이다.
       corpRoutineWhen의 late(= 직전 예정이 있었다)는 사실상 늘 참이라 배지에 물리지 않는다.
     · **화상 연결을 만들지 않는다.** 외부 도구 링크를 등록만 한다 — videoSession.js(회원 영상 상담)를
       사내 회의에 끌어오면 회원 보호 게이트가 사내 직원을 막고, 회의 기록이 회원 접촉 집계에 섞인다.
     · 계획 축(fbModel)·장부 축(corpLedger)은 **함수 안에서만** 읽는다(번들 적재 순서 · TDZ). */

const CORP_MTG_KEY = "hifin_corp_mtg";   /* dataCatalog.js 등재 필수 */

/* 보고 상태 — 「미확정」은 회의 중 즉석 조회 전용이라 여기 섞지 않는다 */
const CORP_MTG_ST = {
  draft: { ko: "초안", d: "AI 팀장이 만든 상태입니다 — 책임자가 확정해야 올라갑니다" },
  fixed: { ko: "확정", d: "책임자가 확인했습니다" },
  noowner: { ko: "확정자 공석", d: "사람 책임자 자리가 비어 있어 확정할 사람이 없습니다" },
};
/* 회의록 발언 주체 3구분 — AI 즉석 조회만 「미확정」을 단다 */
const CORP_MTG_VOICE = {
  human: { ko: "사람 발언", tag: "", d: "회의에서 사람이 한 말입니다" },
  ai: { ko: "AI 보고", tag: "", d: "확정된 주간보고를 AI 팀장이 펼친 것입니다" },
  lookup: { ko: "AI 즉석 조회", tag: "미확정", d: "회의 중 그 자리에서 찾은 값입니다 — 확인을 거치지 않았습니다" },
};
/* 생성 경로가 있는 루틴 — P7이 실제로 만드는 것은 셋뿐이다.
   나머지 아홉은 돌릴 수 있는 상태가 아니므로 「밀림」으로 칠하지 않는다. */
const CORP_MTG_GEN = ["주간보고 초안", "주간회의 자료", "회의록 · 후속과제"];

/* ── ① 업무시간 ──────────────────────────────────────────────────────────
   지시서 확정 항목 — 경보는 업무시간 안에만 올리고, 밖에서 생긴 건은 다음 업무 개시에 모아 올린다.
   긴급(보안 사고 · 응급)은 시간 무관이다. 담당은 S1(정보보안)·H1(헬스케어) 둘뿐이다. */
const CORP_WORK_URGENT = ["S1", "H1"];
function _mtgHM(s) { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : 0; }
function corpInWork(d, sch) {
  const W = ((sch || CORP_SCHEDULE).work) || {};
  const dow = d.getDay(), min = d.getHours() * 60 + d.getMinutes();
  if (dow === 0 || dow === 6) return { ok: false, why: "주말" };
  const from = _mtgHM(W.from), to = _mtgHM(W.to);
  if (min < from) return { ok: false, why: "업무 개시 전" };
  if (min >= to) return { ok: false, why: "업무 종료 후" };
  const L = /^(\d{1,2}:\d{2})~(\d{1,2}:\d{2})$/.exec(W.lunch || "");
  if (L && min >= _mtgHM(L[1]) && min < _mtgHM(L[2])) return { ok: false, why: "점심" };
  return { ok: true, why: "" };
}
/* 다음 업무 개시 시각 — 업무시간 밖에 쌓인 경보를 올릴 자리 */
function corpNextWorkStart(d, sch) {
  const W = ((sch || CORP_SCHEDULE).work) || {};
  const from = _mtgHM(W.from);
  for (let i = 0; i < 10; i++) {
    const x = new Date(d.getTime()); x.setDate(x.getDate() + i);
    x.setHours(Math.floor(from / 60), from % 60, 0, 0);
    const dow = x.getDay();
    if (dow !== 0 && dow !== 6 && x > d) return x;
  }
  return null;
}
/* 주말에 떨어진 예정을 다음 영업일로 민다 — 근무일 월~금 확정과 어긋나지 않게 한다.
   당기지 않고 미룬다: 마감·신고는 기한 전에 당기면 자료가 덜 모인 채로 돌게 된다. */
function corpWorkdayShift(d) {
  if (!d) return null;
  const x = new Date(d.getTime());
  for (let i = 0; i < 7; i++) {
    const dow = x.getDay();
    if (dow !== 0 && dow !== 6) return x;
    x.setDate(x.getDate() + 1);
  }
  return d;
}

/* ── ② 주차 앵커 — **다음 회의**가 기준이다 ──────────────────────────────
   ⚠️ 「주간보고 초안」 루틴의 직전 예정을 주차 키로 쓰면 안 된다 — 수요일에 열면 지난 금요일(=이미
      끝난 회의를 향하던 초안)을 가리킨다. 앵커는 늘 다음 회의 날짜다. */
const CORP_MTG_DOW = { "일요일": 0, "월요일": 1, "화요일": 2, "수요일": 3, "목요일": 4, "금요일": 5, "토요일": 6 };
function corpMtgWeek(now, sch) {
  const S = sch || CORP_SCHEDULE;
  const w = S.weekly || {};
  const want = CORP_MTG_DOW[w.day] === undefined ? 1 : CORP_MTG_DOW[w.day];
  const span = (w.time || "10:00~11:00").split("~");
  const st = _mtgHM(span[0]), en = _mtgHM(span[1] || span[0]);
  const mk = (base, add) => {
    const x = new Date(base.getTime()); x.setDate(x.getDate() + add);
    x.setHours(Math.floor(st / 60), st % 60, 0, 0); return x;
  };
  for (let i = 0; i < 14; i++) {
    const d = mk(now, i);
    if (d.getDay() !== want) continue;
    const end = new Date(d.getTime()); end.setHours(Math.floor(en / 60), en % 60, 0, 0);
    if (end <= now) continue;                       /* 이미 끝난 회의는 넘긴다 */
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return { key: key, at: d, end: end, dday: Math.round((d1 - d0) / 86400000),
      live: now >= d && now < end, time: w.time, mode: w.mode };
  }
  return null;
}
/* 회의 당일의 특정 시각 — 그 주차 기한을 만든다 */
function _mtgAtOn(day, at) {
  if (!day) return null;
  const hm = _mtgHM(at || "00:00");
  const d = new Date(day.getTime());
  d.setHours(Math.floor(hm / 60), hm % 60, 0, 0);
  return d;
}
/* 그 주차의 보고 마감(금 17:00) — 초안이 만들어져야 할 시각 */
function corpMtgDraftDue(week, sch) {
  if (!week) return null;
  const S = sch || CORP_SCHEDULE;
  const r = (S.routines || []).find((x) => x.t === "주간보고 초안");
  const hm = _mtgHM((r && r.at) || "17:00");
  const d = new Date(week.at.getTime());
  d.setDate(d.getDate() - 3);                        /* 월요일 회의 기준 직전 금요일 */
  d.setHours(Math.floor(hm / 60), hm % 60, 0, 0);
  return d;
}

/* ── ③ 참석자 — 자리와 사람을 구분한다 ─────────────────────────────────
   사람은 재직자만 센다. 합류 전 책임자는 **참석자가 아니라 공석 목록**으로 따로 낸다. */
function corpMtgAttend() {
  const teams = typeof CORP_TEAMS !== "undefined" ? CORP_TEAMS : [];
  const by = {};
  teams.forEach((t) => {
    if (t.head > 0) { (by[t.own] = by[t.own] || { name: t.own, title: t.ownTitle, teams: [] }).teams.push(t.id); }
  });
  return {
    people: Object.keys(by).map((k) => by[k]),                       /* 재직자 — 겸임은 한 사람 */
    agents: teams.map((t) => ({ ai: t.ai, team: t.id, sh: t.sh, c: t.c })),
    vacant: teams.filter((t) => t.head === 0)
      .map((t) => ({ team: t.id, sh: t.sh, name: t.own, title: t.ownTitle, joined: t.joined })),
  };
}

/* ── ④ 보고 초안 — 조립이지 창작이 아니다 ───────────────────────────────
   사내 조회 함수가 있는 팀만 수치를 싣는다. 없는 팀은 「—」와 「원천 미연결」이다. */
function corpMtgMetrics(teamId) {
  if (teamId !== "M2") return { linked: false, rows: [] };
  try {
    if (typeof corpJvAll !== "function" || typeof corpLedgerRead !== "function") return { linked: false, rows: [] };
    const jvs = corpJvAll(corpLedgerRead());
    const V = corpLedgerVerdict(jvs, CORP_BANK_SEED);
    const R = corpBankRecon(jvs, CORP_BANK_SEED);
    const S = corpStatements(jvs);
    const rows = [
      { k: "전표", v: corpPosted(jvs).length + "건 전기 · " + jvs.filter((j) => j.st !== "posted").length + "건 승인 전", src: "장부" },
      { k: "장부 검산", v: (V.rows.length - V.fail.length - V.zero.length) + " / " + V.rows.length + " 통과", src: "장부" },
      { k: "미대사", v: (R.bankOnly.length + R.bookOnly.length) + "건", src: "은행 대사" },
      { k: "당기손익", v: corpWon(S.pl.net) + "원", src: "장부" },
    ];
    if (typeof corpPaUnmatched === "function") {
      const U = corpPaUnmatched(jvs, "");
      rows.push({ k: "계정 대응", v: "확정 " + U.planOk.length + " · 대응 없음 " + (U.planAsk.length + U.planNone.length) + "건", src: "예실 대비" });
    }
    return { linked: true, rows: rows, pilot: typeof CORP_LEDGER_PILOT !== "undefined" && CORP_LEDGER_PILOT };
  } catch (e) { return { linked: false, rows: [] }; }
}
/* 보고 골격 — 지표 외의 칸은 **비워 둔다.** 사람이 적는 자리이지 AI가 지어낼 자리가 아니다. */
function corpMtgSkeleton(t) {
  const M = corpMtgMetrics(t.id);
  return {
    team: t.id, sh: t.sh, ai: t.ai, own: t.own, head: t.head,
    st: t.head > 0 ? "draft" : "noowner",
    fixedBy: null, fixedAt: null,
    linked: M.linked, pilot: !!M.pilot, metrics: M.rows,
    scope: t.work,                       /* 그 팀이 다루는 범위 — 조직 원천에서 그대로 가져온다 */
    notes: "", plan: "", issue: "",      /* 사람이 적는 자리 — 비워서 낸다 */
  };
}

/* ── ⑤ 저장 ──────────────────────────────────────────────────────────── */
function corpMtgRead() {
  const empty = { v: 1, weeks: {}, link: "", log: [] };
  try {
    const raw = localStorage.getItem(CORP_MTG_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, weeks: (o.weeks && typeof o.weeks === "object") ? o.weeks : {},
      link: typeof o.link === "string" ? o.link : "", log: Array.isArray(o.log) ? o.log : [] };
  } catch (e) { return empty; }
}
function corpMtgWrite(st) {
  try { localStorage.setItem(CORP_MTG_KEY, JSON.stringify({ v: 1, weeks: st.weeks || {}, link: st.link || "", log: (st.log || []).slice(-300) })); return true; }
  catch (e) { return false; }
}
/* **다음 열람 시 생성** — 열었을 때 그 주차 골격이 없으면 만든다. 스스로 돌지 않는다. */
function corpMtgEnsure(st, week) {
  if (!week) return { st: st, made: false };
  if (st.weeks[week.key]) return { st: st, made: false };
  const teams = typeof CORP_TEAMS !== "undefined" ? CORP_TEAMS : [];
  const weeks = Object.assign({}, st.weeks);
  weeks[week.key] = {
    key: week.key, madeAt: week.key, reports: teams.map(corpMtgSkeleton),
    minutes: [], tasks: [], merged: false, mergedBy: null,
  };
  return { st: Object.assign({}, st, { weeks: weeks }), made: true };
}
function corpMtgOf(st, week) { return (week && st.weeks[week.key]) || null; }

/* ── ⑥ 상태 전이 — 「왜 안 되는지」를 함께 돌려준다(corpJvCanAdvance 선례) ── */
function corpMtgCanFix(rep, actorId) {
  if (!rep) return { ok: false, why: "보고가 없습니다" };
  if (rep.st === "fixed") return { ok: false, why: "이미 확정했습니다 — 되돌리려면 초안을 다시 만듭니다" };
  if (rep.head === 0) return { ok: false, why: rep.own + " 책임자가 아직 합류 전이라 확정할 사람이 없습니다 — 합류 전까지 초안으로 남습니다" };
  if (!actorId) return { ok: false, why: "확정 주체를 고르지 않았습니다" };
  if (actorId !== rep.own) return { ok: false, why: "이 팀의 책임자는 " + rep.own + "입니다 — 다른 사람이 확정하지 못합니다" };
  return { ok: true, why: "" };
}
/* 통합(월 09:30) — 확정 경로가 있는 팀이 전부 확정되어야 1부로 묶는다.
   공석 팀은 확정될 수 없으므로 분모에서 뺀다. 뺀 사실은 화면이 적는다. */
function corpMtgCanMerge(wk) {
  if (!wk) return { ok: false, why: "그 주차 자료가 없습니다", need: 0, done: 0, skip: 0 };
  const can = wk.reports.filter((r) => r.head > 0);
  const done = can.filter((r) => r.st === "fixed");
  const skip = wk.reports.length - can.length;
  if (wk.merged) return { ok: false, why: "이미 통합했습니다", need: can.length, done: done.length, skip: skip };
  if (done.length < can.length) {
    return { ok: false, why: "확정 " + done.length + " / " + can.length + "팀 — 남은 팀이 확정해야 묶습니다",
      need: can.length, done: done.length, skip: skip };
  }
  return { ok: true, why: "", need: can.length, done: done.length, skip: skip };
}

/* ── ⑦ 후속과제 — 미종결이 차주 자료 선두에 선다 ──────────────────────
   0건의 뜻이 셋이다(종결 / 등록 경로 없음 / 과제가 안 나옴). 화면이 셋을 나눠 적는다. */
function corpMtgOpenTasks(st, week) {
  const out = [];
  Object.keys(st.weeks || {}).forEach((k) => {
    if (week && k >= week.key) return;                    /* 지난 주차만 */
    (st.weeks[k].tasks || []).forEach((t) => { if (t.status !== "done") out.push(Object.assign({ from: k }, t)); });
  });
  return out.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
}
function corpMtgTaskId(st) {
  let n = 0;
  Object.keys(st.weeks || {}).forEach((k) => (st.weeks[k].tasks || []).forEach((t) => {
    const m = /^fu(\d+)$/.exec(t.id || ""); if (m && +m[1] > n) n = +m[1];
  }));
  return "fu" + (n + 1);
}

/* ── ⑧ 루틴 생성 상태 — 「밀림」을 다시 정의한다 ────────────────────────
   corpRoutineWhen의 late는 「직전 예정이 있었다」라 사실상 늘 참이다. 그걸 빨갛게 칠하면
   루틴 열둘이 전건 빨강이 되고, 나중에 진짜 밀렸을 때 아무도 보지 않는다.
   여기서 밀림은 **생성 경로가 있는 루틴인데 그 주기분 생성물이 없고 예정 시각이 지났을 때**뿐이다. */
function corpRoutineState(r, st, now, week, led) {
  const w = typeof corpRoutineWhen === "function" ? corpRoutineWhen(r, now) : {};
  if (w.kind === "release") return { state: "rel", ko: "배포 전", next: null, prev: null };
  const next = r.every === "month" ? corpWorkdayShift(w.next) : w.next;
  const shifted = !!(r.every === "month" && w.next && next && next.getTime() !== w.next.getTime());
  /* ⚠️ 은행 대사는 **생성 경로가 아니라 사람 반입 경로**다. 시스템이 만들어 내는 것이 아니라
     사람이 올려야 시작된다 — 그래서 CORP_MTG_GEN(생성 경로)에 넣지 않고 따로 가른다.
     넣어 버리면 「생성됨」이라는 말이 거짓이 되고, 안 가르면 영영 「경로 없음」으로 남는다. */
  if (r.t === "은행 대사") {
    const D = typeof corpBjvDue === "function"
      ? corpBjvDue((led && led.bankCov) || null, typeof corpOpsToday === "function" ? corpOpsToday(now) : "")
      : { ok: false, ko: "셀 수 없습니다" };
    const late = !D.ok && !!w.prev && w.prev <= now;
    return { state: D.ok ? "made" : (late ? "due" : "wait"),
      ko: D.ok ? "어제까지 들어옴" : (late ? "밀림 — " + D.ko : "예정 — 사람이 올려야 시작됩니다"),
      next: next, prev: w.prev, shifted: shifted, was: w.next, due: D, human: true };
  }
  if (CORP_MTG_GEN.indexOf(r.t) < 0) {
    return { state: "nogen", ko: "생성 경로 없음", next: next, prev: w.prev, shifted: shifted, was: w.next };
  }
  const wk = corpMtgOf(st, week);
  /* ⚠️ 기한은 **그 주차 기준**이다. corpRoutineWhen의 prev(지난 월요일)와 견주면
     이미 끝난 회의의 기한으로 이번 주차 생성물을 판정하게 되어 늘 밀림이 된다. */
  let made = false, by = null;
  if (r.t === "주간보고 초안") { made = !!wk; by = corpMtgDraftDue(week); }
  else if (r.t === "주간회의 자료") { made = !!(wk && wk.merged); by = _mtgAtOn(week && week.at, r.at); }
  else if (r.t === "회의록 · 후속과제") { made = !!(wk && wk.minutes && wk.minutes.length); by = _mtgAtOn(week && week.at, r.at); }
  const due = !made && !!by && by <= now;
  return { state: made ? "made" : (due ? "due" : "wait"),
    ko: made ? "생성됨" : (due ? "밀림" : "예정 — 다음 열람 시 생성"),
    next: next, prev: w.prev, shifted: shifted, was: w.next };
}

/* ── ⑨ 워크로그 — AI와 사람을 구분해 적는다 ─────────────────────────── */
function corpMtgLog(st, kind, who, what, at) {
  const log = (st.log || []).concat([{ at: at || "", kind: kind, who: who, what: what }]);
  return Object.assign({}, st, { log: log.slice(-300) });
}

/* ── ⑩ 단언 — 화면의 검산과 커밋 게이트 러너가 이 함수 하나를 같이 부른다 ──
   n은 분모다. 검사 대상이 0건이면 통과가 아니라 실패다. */
function corpMtgVerdict(st, now) {
  const week = corpMtgWeek(now);
  const wk = corpMtgOf(st, week);
  const A = corpMtgAttend();
  const teams = typeof CORP_TEAMS !== "undefined" ? CORP_TEAMS : [];
  const reps = wk ? wk.reports : [];
  const noOwner = reps.filter((r) => r.head === 0);
  const fixable = reps.filter((r) => r.head > 0);
  /* 공석 팀에 확정 배지가 붙으면 확정자 없는 초안이 상류로 흘러간다 — 양성 검사다 */
  const ghost = noOwner.filter((r) => r.st === "fixed");
  const linked = reps.filter((r) => r.linked);
  const unlinked = reps.filter((r) => !r.linked);
  /* 근거 없는 수치를 실은 팀 — 원천이 없는데 지표가 있으면 지어낸 것이다 */
  const fake = reps.filter((r) => !r.linked && (r.metrics || []).length > 0);
  const lookups = wk ? (wk.minutes || []).filter((m) => m.voice === "lookup") : [];
  const badge = lookups.filter((m) => !CORP_MTG_VOICE.lookup.tag);
  const gen = (typeof CORP_SCHEDULE !== "undefined" ? CORP_SCHEDULE.routines : []).filter((r) => CORP_MTG_GEN.indexOf(r.t) >= 0);

  return [
    { k: "week", ko: "주차 앵커 = 다음 회의", n: week ? 1 : 0, ok: !!week && week.at > now, got: week ? week.key + " (D-" + week.dday + ")" : "없음", want: "미래" },
    { k: "ensure", ko: "열람 시 그 주차 골격 생성", n: reps.length, ok: !!wk && reps.length === teams.length, got: reps.length + " / " + teams.length + "팀", want: teams.length + "팀" },
    { k: "attend", ko: "참석 인원 = 재직자(자리 아님)", n: A.people.length, ok: A.people.length > 0 && A.people.length < teams.length, got: "사람 " + A.people.length + " · AI " + A.agents.length + " · 공석 " + A.vacant.length, want: "재직자만" },
    { k: "vacant", ko: "공석을 참석자로 세지 않음", n: A.vacant.length, ok: A.people.every((p) => !A.vacant.some((v) => v.name === p.name)), got: A.vacant.length + "석", want: "참석자와 겹치지 않음" },
    { k: "noowner", ko: "확정자 공석 팀에 확정 0건", n: noOwner.length, ok: ghost.length === 0, got: ghost.length + "건", want: "0건" },
    { k: "fixable", ko: "확정 가능 팀 존재", n: fixable.length, ok: fixable.length > 0, got: fixable.length + "팀", want: "> 0" },
    { k: "src", ko: "원천 연결 팀 존재", n: reps.length, ok: linked.length > 0, got: linked.length + " / " + reps.length + "팀", want: "> 0" },
    { k: "fake", ko: "원천 없는 팀에 지표 0건", n: unlinked.length, ok: fake.length === 0, got: fake.length + "건", want: "0건" },
    { k: "merge", ko: "통합은 확정 뒤에만", n: fixable.length, ok: !wk || !wk.merged || corpMtgCanMerge(Object.assign({}, wk, { merged: false })).ok, got: wk && wk.merged ? "통합됨" : "대기", want: "확정 완료 후" },
    { k: "voice", ko: "회의록 발언 주체 3구분", n: Object.keys(CORP_MTG_VOICE).length, ok: Object.keys(CORP_MTG_VOICE).length === 3, got: Object.keys(CORP_MTG_VOICE).join(" · "), want: "3종" },
    { k: "badge", ko: "즉석 조회에 미확정 배지", n: 1, ok: CORP_MTG_VOICE.lookup.tag === "미확정" && badge.length === 0, got: CORP_MTG_VOICE.lookup.tag || "없음", want: "미확정" },
    { k: "gen", ko: "생성 경로가 있는 루틴", n: gen.length, ok: gen.length === CORP_MTG_GEN.length, got: gen.length + " / " + CORP_MTG_GEN.length, want: "일치" },
    { k: "work", ko: "업무시간 판정 동작", n: 1, ok: corpInWork(new Date(2026, 10, 11, 14, 0)).ok && !corpInWork(new Date(2026, 10, 14, 14, 0)).ok, got: "평일 14시 안 · 토요일 밖", want: "양방향" },
  ];
}
function corpMtgPass(st, now) {
  const rows = corpMtgVerdict(st, now);
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
