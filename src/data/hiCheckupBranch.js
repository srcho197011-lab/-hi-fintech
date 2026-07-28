/* ══════════════ 하이 — 검진 이력 분기응답 대화 트리(2단계 파인튜닝) ══════════════
   트리거: 과거 검진 기록 보유 + 올해 미수검(SEG-S1-00) → 1차 분기응답(가진 것 + 해야 할 것)
   본 파일은 **선택 이후의 대화**를 완결까지 끌고 간다.
     갈래① {latestYear}년 결과 → 요약·정밀리포트 → "올해 검진도 예약할까요?" → (나중에) 알림 예약 제안
     갈래② {currentYear}년 검진 예약 → 센터·날짜 추천(기존 예약 플로우) → 확정 → 전년 대비 비교 예고 + 결과 알림 예약
   공통 규칙: ①어느 갈래를 골라도 반대 갈래 칩을 유지 ②"둘 다"는 ①→② 연속 실행 ③모호하면 재질문 1회 후 U7 폴백
   의료 경계: 수치 이해·생활 안내까지만. 진단·처방 판단 금지(U4 정책 계승). */

const HI_BRANCH_KEY = "hifin_hi_branch";
const HI_BRANCH_TTL = 30 * 60 * 1000;   // 30분

function hiBranchLoad() {
  try {
    const st = JSON.parse(sessionStorage.getItem(HI_BRANCH_KEY) || "null");
    if (!st || Date.now() - (st.ts || 0) > HI_BRANCH_TTL) return null;
    return st;
  } catch (e) { return null; }
}
function hiBranchSave(st) { try { st.ts = Date.now(); sessionStorage.setItem(HI_BRANCH_KEY, JSON.stringify(st)); } catch (e) {} return st; }
function hiBranchClear() { try { sessionStorage.removeItem(HI_BRANCH_KEY); } catch (e) {} }

/* 분기응답을 낸 순간 무장 — 다음 턴의 선택을 받을 준비(hiSargAssemble에서 호출) */
function hiBranchArm(snap) {
  const c = (snap && (snap.checkup || snap.s1)) || {};
  return hiBranchSave({ stage: "offered", latestYear: c.latestYear, currentYear: c.currentYear,
    pastYears: (c.pastYears || []).slice(), booked: !!c.currentYearBooked, ambig: 0 });
}

/* ── 선택 파싱 ── */
const HI_BR_PAST = /(\d{4})년?\s*(검진)?\s*결과|작년\s*결과|지난해\s*결과|과거\s*결과|예전\s*결과|결과\s*(보기|보여|알려|먼저|부터)|①|1번|첫\s*번째|하나\s*번|일번/;
const HI_BR_BOOK = /(\d{4})년?\s*검진\s*예약|검진\s*예약|예약\s*(해|하기|부터|먼저|잡)|②|2번|두\s*번째|이번/;
const HI_BR_BOTH = /둘\s*다|모두|다\s*보여|양쪽|둘다|전부/;
const HI_BR_LATER = /나중|다음에|괜찮|아니(요|야)?$|안\s*할|생각해|보류|천천히/;
const HI_BR_TREND = /추이|비교|변화/;
const HI_BR_CONFIRM = /이대로\s*예약\s*확정|예약\s*확정/;

/* ── 갈래① {latestYear}년 결과 요약 ──
   금고에 실제 검진 데이터가 있으면 그 수치로, 없으면 수치를 지어내지 않고 화면으로 안내한다(스냅샷 밖 사실 발화 금지). */
function hiBranchPastSummary(m, year) {
  const KEY = [["sbp", "dbp"], ["glucose"], ["ldl"], ["ast", "alt", "ggt"]];
  try {
    if (typeof vaultLoad !== "function" || typeof anonToken !== "function") return null;
    const v = vaultLoad(anonToken(m)); if (!v || !(v.checkups || []).length) return null;
    let pick = null;
    (v.checkups || []).forEach(function (c) {
      const d = String(c.date || (c.meta && c.meta.date) || "");
      if (year == null || d.indexOf(String(year)) === 0) { if (!pick || d > String(pick.date || "")) pick = c; }
    });
    if (!pick) return null;
    const map = {};
    (pick.items || []).forEach(function (it) { map[it.key] = it.value; });
    const L = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC : {};
    const core = [];
    KEY.forEach(function (grp) {
      const vals = grp.filter(function (k) { return map[k] != null; });
      if (!vals.length) return;
      if (grp[0] === "sbp" && map.sbp != null && map.dbp != null) core.push(`혈압 ${map.sbp}/${map.dbp} mmHg`);
      else vals.forEach(function (k) { core.push(`${(L[k] && L[k].ko) || k} ${map[k]}${(L[k] && L[k].unit) ? " " + L[k].unit : ""}`); });
    });
    const warn = [];
    Object.keys(map).forEach(function (k) {
      const f = (typeof ckupFlag === "function") ? ckupFlag(k, map[k]) : "";
      if (f) warn.push(`${(L[k] && L[k].ko) || k} ${map[k]}${f === "high" ? "(높음)" : f === "low" ? "(낮음)" : "(이상소견)"}`);
    });
    return { core: core.slice(0, 4), warn: warn.slice(0, 3), n: (pick.items || []).length };
  } catch (e) { return null; }
}

function hiBranchPast(m, st, opts) {
  const y = st.latestYear, cy = st.currentYear;
  const s = hiBranchPastSummary(m, y);
  const easy = (typeof hiEasyOn === "function") ? hiEasyOn() : false;
  const lines = [];
  lines.push(`${y}년 검진 결과를 요약해 드릴게요.`);
  if (s) {
    if (s.core.length) lines.push(`핵심 지표 — ${s.core.join(" · ")} (총 ${s.n}개 항목)`);
    lines.push(s.warn.length
      ? `눈여겨볼 항목 — ${s.warn.join(" · ")}. 수치가 기준을 벗어났다는 뜻이고 병이라는 판단은 아니에요 — 식습관·운동·음주 관리부터 챙기시면 좋아요.`
      : "기준 범위를 벗어난 항목은 없었어요 — 지금 습관을 유지하시면 좋아요.");
  } else {
    lines.push(easy ? "자세한 숫자는 리포트 화면에서 크게 보여드릴게요." : `${y}년 결과의 항목별 수치와 정상 범위는 정밀리포트 화면에서 바로 보실 수 있어요 — 어려운 용어는 제가 쉬운 말로 풀어드릴게요.`);
  }
  if ((st.pastYears || []).length >= 2) lines.push(`${st.pastYears[0]}~${st.pastYears[st.pastYears.length - 1]}년 기록이 있어서 연도별 추이도 함께 보여드릴 수 있어요.`);
  if (!(opts && opts.skipOffer)) {
    lines.push(st.booked
      ? `이 결과는 ${y}년 기준이에요. 올해 검진 예약은 이미 잡혀 있으니, 결과가 나오면 ${y}년과 나란히 비교해 드릴게요.`
      : `이 결과는 ${y}년 기준이에요 — 올해 몸 상태는 달라졌을 수 있으니 ${cy}년 검진도 예약해 둘까요?`);
  }
  hiBranchSave(Object.assign(st, { stage: "past-shown", ambig: 0 }));
  const buttons = st.booked ? ["내 예약 보기"] : [`${cy}년 검진 예약`, "나중에"];
  if ((st.pastYears || []).length >= 2) buttons.push("추이 비교 보여줘");
  return { kind: "branch", stage: "past-shown", res: {
    lines: lines, buttons: buttons.slice(0, 3),
    nav: { key: "manage", label: "내 건강현황" },
    preview: { route: "app://health/report", title: `${y}년 정밀리포트`, description: "항목별 수치·정상 범위와 쉬운 설명을 한 화면에서", nav: "manage" },
    followup: null } };
}

function hiBranchBook(m, st) {
  const y = st.latestYear, cy = st.currentYear;
  let prep = null;
  try { if (typeof TOOL_RUN !== "undefined" && TOOL_RUN.bookprep) prep = TOOL_RUN.bookprep(m); } catch (e) { prep = null; }
  const lines = [`${cy}년 검진 예약을 도와드릴게요.`];
  if (prep && prep.lines) lines.push.apply(lines, prep.lines);
  else lines.push("가까운 제휴 검진센터와 가장 빠른 날짜를 골라드릴게요 — 예약과 동시에 무료 검진대비보험(진단금 최대 1,000만 원)도 함께 준비돼요.");
  lines.push(`예약이 끝나면 결과가 나오는 대로 ${y}년과 비교 분석해 드릴게요.`);
  hiBranchSave(Object.assign(st, { stage: "book-offered", ambig: 0 }));
  const buttons = (prep && prep.buttons && prep.buttons.length) ? prep.buttons.slice(0, 2) : ["검진 예약해줘"];
  buttons.push(`${y}년 결과 보기`);
  return { kind: "branch", stage: "book-offered", res: {
    lines: lines, buttons: buttons.slice(0, 3),
    nav: { key: "checkup", label: "건강검진 예약" },
    preview: { route: "app://checkup/booking", title: `${cy}년 건강검진 예약`, description: "센터·날짜 추천 → 예약 확정 → 무료 검진대비보험 자동 준비", nav: "checkup" },
    followup: null } };
}

/* 예약 확정 — 기존 실행 툴(bookdo)을 그대로 태우고, 분기 맥락(전년 대비 비교 예고)을 덧붙인다 */
function hiBranchBookDone(m, st) {
  const y = st.latestYear;
  let done = null;
  try { if (typeof TOOL_RUN !== "undefined" && TOOL_RUN.bookdo) done = TOOL_RUN.bookdo(m); } catch (e) { done = null; }
  const lines = (done && done.lines) ? done.lines.slice() : ["검진 예약을 확정했어요."];
  lines.push(`예약하셨네요! 결과가 나오면 ${y}년과 비교해서 좋아진 수치·관리가 필요한 수치를 짚어드릴게요.`);
  lines.push(`그동안 ${y}년 결과라도 미리 볼까요?`);
  hiBranchSave(Object.assign(st, { stage: "booked", ambig: 0 }));
  return { kind: "branch", stage: "booked", res: {
    lines: lines, buttons: [`${y}년 결과 보기`, "알림 받기"],
    nav: null,
    preview: { route: "app://checkup", title: "내 검진 예약", description: "예약 확인·변경과 검진 전 준비사항 안내", nav: "checkup" },
    followup: { type: "notify", inDays: 10, message: `검진 결과가 나올 시기예요 — 결과지를 올려 주시면 ${y}년과 비교 분석해 드릴게요!` } } };
}

/* "나중에" — 검진 권장 시기 알림 예약 제안(강요하지 않음) */
function hiBranchLater(st) {
  const cy = st.currentYear, y = st.latestYear;
  hiBranchSave(Object.assign(st, { stage: "later", ambig: 0 }));
  return { kind: "branch", stage: "later", res: {
    lines: ["네, 천천히 하세요 — 재촉하지 않을게요.",
      `대신 검진 받기 좋은 시기가 되면 제가 한 번만 알려드릴까요? ${y}년 결과 기준으로 권장 시기를 잡아뒀어요.`],
    buttons: ["알림 받기", `${cy}년 검진 예약`],
    nav: null, preview: null,
    followup: { type: "notify", inDays: 30, message: `${cy}년 검진, 이제 받기 좋은 시기예요 — 예약을 도와드릴까요? ${y}년 결과와 비교해서 분석해 드릴게요.` } } };
}

/* ── 라우터: 분기 대화가 무장된 동안 회원의 응답을 해석 ──
   반환 null → 이 턴은 분기 대화가 아님(기존 파이프라인이 처리) */
function hiBranchHandle(rawText, norm, m) {
  try {
    const st = hiBranchLoad();
    if (!st || !m) return null;
    const t = String(norm || rawText || "");
    const raw = String(rawText || "");
    const y = st.latestYear, cy = st.currentYear;

    /* 예약 확정(갈래② 완결) — 분기 맥락에서만 가로채 비교 예고를 덧붙인다 */
    if (HI_BR_CONFIRM.test(raw) && (st.stage === "book-offered" || st.stage === "offered")) return hiBranchBookDone(m, st);

    /* 연도 지정이 어긋난 경우(예: "2024년 결과") — 보유 연도면 그 해로 응답 */
    const ym = raw.match(/(\d{4})\s*년/);
    const askYear = ym ? parseInt(ym[1], 10) : null;

    if (HI_BR_BOTH.test(t)) {                       // "둘 다" → ① 실행 후 ② 이어서
      const a = hiBranchPast(m, st, { skipOffer: true });
      const b = hiBranchBook(m, hiBranchLoad() || st);
      return { kind: "branch", stage: "both", res: {
        lines: a.res.lines.concat(b.res.lines), buttons: b.res.buttons,
        nav: b.res.nav, preview: b.res.preview, followup: null } };
    }
    /* 예약 의사 — 연도가 올해이거나 없을 때(과거 연도 결과 요청과 충돌 방지) */
    if (HI_BR_BOOK.test(t) && !(askYear && askYear < cy && HI_BR_PAST.test(t))) return hiBranchBook(m, st);
    if (HI_BR_PAST.test(t) || (askYear && (st.pastYears || []).indexOf(askYear) >= 0)) {
      const use = (askYear && (st.pastYears || []).indexOf(askYear) >= 0) ? Object.assign({}, st, { latestYear: askYear }) : st;
      return hiBranchPast(m, use);
    }
    if (HI_BR_TREND.test(t) && (st.pastYears || []).length >= 2) return hiBranchPast(m, st);
    if (st.stage === "past-shown" && HI_BR_LATER.test(t)) return hiBranchLater(st);

    /* 모호 — 재질문 1회, 두 번째는 기존 U7 폴백에 넘긴다 */
    if (st.stage === "offered" || st.stage === "past-shown" || st.stage === "book-offered") {
      const isShort = raw.replace(/\s/g, "").length <= 12;
      const vague = /모르|몰라|아무거나|알아서|그냥|글쎄|어떤|뭐가|추천/.test(t);
      if (vague || (isShort && !/[가-힣]{4,}/.test(raw))) {
        if ((st.ambig || 0) >= 1) { hiBranchClear(); return null; }
        hiBranchSave(Object.assign(st, { ambig: (st.ambig || 0) + 1 }));
        return { kind: "branch", stage: "reask", res: {
          lines: [`제가 두 가지를 도와드릴 수 있어요 — ${y}년 결과를 보는 것과, ${cy}년 검진을 예약하는 것이에요.`,
            "어느 쪽부터 할까요? 둘 다 원하시면 \"둘 다\"라고 말씀하셔도 돼요."],
          buttons: [`${y}년 결과 보기`, `${cy}년 검진 예약`, "둘 다"], nav: null, preview: null, followup: null } };
      }
    }
    return null;
  } catch (e) { return null; }
}

/* 관리자·검증 노출 */
try { if (typeof window !== "undefined") { window.__hifinBranch = { arm: hiBranchArm, handle: hiBranchHandle, state: hiBranchLoad, clear: hiBranchClear }; } } catch (e) {}
