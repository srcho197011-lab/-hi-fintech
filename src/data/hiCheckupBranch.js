/* ══════════════ 하이 — 검진 이력 순차 상담 트리(2단계 파인튜닝) ══════════════
   원칙: 두 갈래를 한꺼번에 던지지 않는다. **현황을 먼저 확인해 주고, 가진 것부터 한 걸음씩 제안한다.**
     T1 상황 확인 + 첫 제안  : "가장 최근 검진이 {latestYear}년이에요 — {latestYear}년 결과 분석을 보여드릴까요?"
     T2 결과 분석 후 두 번째 제안: "그럼 {currentYear}년 올해 건강검진을 예약해 드릴까요?"
        └ 올해 예약이 이미 있으면 → "검진 전 준비사항을 미리 알려드릴까요?"로 대체
     T3 예약 진행/확정 → 전년 대비 비교 예고 + 결과 도착 알림 예약
   회원 데이터가 어떤 모양이든(단년·다년·예약 보유) 같은 순서로 흐르고, 연도는 전부 상태에서 온다.
   거절해도 대화가 끊기지 않게 다음 단계를 이어서 제안하고, "둘 다"·모호 응답도 흡수한다.
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

/* 1차 응답(SEG-S1-00)을 낸 순간 무장 — 다음 턴의 수락·거절을 받을 준비(hiSargAssemble에서 호출) */
function hiBranchArm(snap) {
  const c = (snap && (snap.checkup || snap.s1)) || {};
  return hiBranchSave({ stage: "offered", latestYear: c.latestYear, currentYear: c.currentYear,
    pastYears: (c.pastYears || []).slice(), booked: !!c.currentYearBooked, bookingInDays: c.bookingInDays,
    bookingDate: c.bookingDate, ambig: 0 });
}

/* ── 응답 해석 ── */
const HI_BR_NO = /(나중|다음에|아니|안\s*볼|안\s*할|괜찮|생각해|보류|천천히|패스|싫)/;
const HI_BR_YES = /(^|\s)(네|넹|예|응|어|그래|좋아|좋습니다|좋아요|부탁|해줘|해주세요|보여|알려|okay|ok|오케이|콜|ㅇㅇ|진행|할게|할래|하자)/;
const HI_BR_PAST = /(\d{4})년?\s*(검진)?\s*(결과|분석|리포트)|작년\s*결과|지난해\s*결과|과거\s*결과|예전\s*결과|결과\s*(보기|보여|알려|먼저|부터|분석)|①|1번|첫\s*번째/;
const HI_BR_BOOK = /(\d{4})년?\s*검진\s*예약|검진\s*예약|예약\s*(해|하기|부터|먼저|잡|할)|②|2번|두\s*번째/;
const HI_BR_BOTH = /둘\s*다|모두|다\s*보여|양쪽|둘다|전부/;
const HI_BR_TREND = /추이|비교|변화/;
const HI_BR_CONFIRM = /이대로\s*예약\s*확정|예약\s*확정/;
const HI_BR_PREP = /준비|금식|뭐\s*챙기|주의사항/;

/* ── 과거 결과 요약 ──
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

/* 두 번째 제안 문장 — 예약 유무에 따라 '올해 예약' 또는 '검진 준비' 로 갈린다 */
function _hiBranchNextAsk(st) {
  if (st.booked) return { line: `올해 검진은 ${st.bookingDate || "예정일"}${st.bookingInDays != null ? `(D-${st.bookingInDays})` : ""}에 이미 예약돼 있어요 — 검진 전 준비사항을 미리 알려드릴까요?`, buttons: ["네, 알려주세요", "괜찮아요"], stage: "prep-asked" };
  return { line: `그럼 ${st.currentYear}년 올해 건강검진을 예약해 드릴까요?`, buttons: ["네, 예약할게요", "나중에"], stage: "book-asked" };
}

/* ── T2: {latestYear}년 결과 분석 ── */
function hiBranchAnalysis(m, st, opts) {
  const y = (opts && opts.year) || st.latestYear;
  const s = hiBranchPastSummary(m, y);
  const easy = (typeof hiEasyOn === "function") ? hiEasyOn() : false;
  const lines = [`${y}년 검진 결과를 분석해서 정리해 드릴게요.`];
  if (s) {
    if (s.core.length) lines.push(`핵심 지표 — ${s.core.join(" · ")} (총 ${s.n}개 항목)`);
    lines.push(s.warn.length
      ? `눈여겨볼 항목 — ${s.warn.join(" · ")}. 기준을 벗어났다는 뜻이고 병이라는 판단은 아니에요 — 식습관·운동·음주 관리부터 챙기시면 좋아요.`
      : "기준 범위를 벗어난 항목은 없었어요 — 지금 습관을 유지하시면 좋아요.");
  } else {
    lines.push(easy ? "자세한 숫자는 리포트 화면에서 크게 보여드릴게요." : `${y}년 결과의 항목별 수치와 정상 범위는 정밀리포트 화면에서 바로 보실 수 있어요 — 어려운 용어는 제가 쉬운 말로 풀어드릴게요.`);
  }
  if ((st.pastYears || []).length >= 2) lines.push(`${st.pastYears[0]}~${st.pastYears[st.pastYears.length - 1]}년 기록이 있어서 연도별 추이도 함께 보여드릴 수 있어요.`);
  const analysis = lines.slice();          // 여기까지가 결과 해석 — 담당은 A1(AI 주치의)
  const ask = [];
  const buttons = [];
  let stage = "analysis-shown";
  if (!(opts && opts.skipAsk)) {
    const nx = _hiBranchNextAsk(st);
    ask.push(`이 결과는 ${y}년 기준이라 올해 몸 상태는 달라졌을 수 있어요.`);
    ask.push(nx.line);
    stage = nx.stage;
    buttons.push.apply(buttons, nx.buttons);
  }
  hiBranchSave(Object.assign(st, { stage: stage, ambig: 0 }));
  if ((st.pastYears || []).length >= 2 && buttons.length < 3) buttons.push("추이 비교 보여줘");

  /* [Phase A] 결과 해석은 A1이 담당 — 하이가 인계하고, 다음 행동 제안은 하이가 되돌려받는다 */
  let parts = null;
  try {
    if (typeof hiPart === "function") {
      const cite = s ? [{ source: "내 데이터 금고", title: `${y}년 검진 결과(항목 ${s.n}개)` }] : [];
      if (typeof hiHandoff === "function") hiHandoff({ from: "A0", to: "A1", reason: "checkup-result", question: `${y}년 결과 분석`, state: null });
      parts = [
        hiPart("A0", [`${y}년 결과 해석은 AI 주치의가 이어서 봐드릴게요.`], { announce: true }),
        hiPart("A1", analysis, { cite: cite }),
      ];
      if (ask.length) parts.push(hiPart("A0", ask));
    }
  } catch (e) { parts = null; }

  return { kind: "branch", stage: stage, res: {
    lines: analysis.concat(ask), parts: parts, buttons: buttons.slice(0, 3),
    nav: { key: "manage", label: "내 건강현황" },
    preview: { route: "app://health/report", title: `${y}년 정밀리포트`, description: "항목별 수치·정상 범위와 쉬운 설명을 한 화면에서", nav: "manage" },
    followup: null } };
}

/* T2 거절 — 분석을 지금 안 보더라도 다음 단계는 이어서 제안 */
function hiBranchSkipAnalysis(st) {
  const nx = _hiBranchNextAsk(st);
  hiBranchSave(Object.assign(st, { stage: nx.stage, ambig: 0 }));
  return { kind: "branch", stage: nx.stage, res: {
    lines: [`네, ${st.latestYear}년 결과는 필요하실 때 언제든 보여드릴게요.`, nx.line],
    buttons: nx.buttons.concat([`${st.latestYear}년 결과 보기`]).slice(0, 3),
    nav: null, preview: null, followup: null } };
}

/* ── T3: 올해 검진 예약 ── */
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
  lines.push(`결과가 나오면 ${y}년과 비교해서 좋아진 수치·관리가 필요한 수치를 짚어드릴게요.`);
  hiBranchSave(Object.assign(st, { stage: "booked", booked: true, ambig: 0 }));
  return { kind: "branch", stage: "booked", res: {
    lines: lines, buttons: [`${y}년 결과 보기`, "알림 받기"],
    nav: null,
    preview: { route: "app://checkup", title: "내 검진 예약", description: "예약 확인·변경과 검진 전 준비사항 안내", nav: "checkup" },
    followup: { type: "notify", inDays: 10, message: `검진 결과가 나올 시기예요 — 결과지를 올려 주시면 ${y}년과 비교 분석해 드릴게요!` } } };
}

/* 검진 준비사항(예약 보유자의 두 번째 단계) */
function hiBranchPrep(st) {
  hiBranchSave(Object.assign(st, { stage: "prepped", ambig: 0 }));
  return { kind: "branch", stage: "prepped", res: {
    lines: ["검진 전날 저녁 9시 이후로는 금식하시고, 물은 자정까지만 드세요 — 당일 아침은 물도 삼가는 게 좋아요.",
      "복용 중인 약이 있으면 검진센터에 미리 알려주시고, 신분증은 꼭 챙기세요.",
      "검진 전날 저녁에 제가 한 번 더 알려드릴까요?"],
    buttons: ["알림 받기", `${st.latestYear}년 결과 보기`],
    nav: { key: "checkup", label: "건강검진 예약" }, preview: null,
    followup: { type: "notify", inDays: Math.max(1, (st.bookingInDays || 2) - 1), message: "내일 검진이에요! 오늘 저녁 9시부터 금식하시고, 물은 자정까지만 드세요. 신분증 꼭 챙기세요." } } };
}

/* 예약 거절 — 검진 권장 시기 알림만 제안(재촉하지 않음) */
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

/* ── 라우터: 순차 상담이 진행되는 동안 회원의 응답을 해석 ──
   반환 null → 이 턴은 분기 대화가 아님(기존 파이프라인이 처리) */
function hiBranchHandle(rawText, norm, m) {
  try {
    const st = hiBranchLoad();
    if (!st || !m) return null;
    const t = String(norm || rawText || "");
    const raw = String(rawText || "");
    const y = st.latestYear, cy = st.currentYear;
    const stage = st.stage;

    /* 예약 확정 — 어느 단계에서든 확정 의사는 즉시 실행 */
    if (HI_BR_CONFIRM.test(raw)) return hiBranchBookDone(m, st);

    /* "둘 다" — 결과 분석 후 예약 안내까지 한 번에 */
    if (HI_BR_BOTH.test(t)) {
      const a = hiBranchAnalysis(m, st, { skipAsk: true });
      const b = hiBranchBook(m, hiBranchLoad() || st);
      return { kind: "branch", stage: "both", res: {
        lines: a.res.lines.concat(b.res.lines), buttons: b.res.buttons,
        nav: b.res.nav, preview: b.res.preview, followup: null } };
    }

    /* 명시적 요청은 단계와 무관하게 우선(회원이 순서를 건너뛸 자유) */
    const ym = raw.match(/(\d{4})\s*년/);
    const askYear = ym ? parseInt(ym[1], 10) : null;
    const wantPast = HI_BR_PAST.test(t) || (askYear && (st.pastYears || []).indexOf(askYear) >= 0);
    const wantBook = HI_BR_BOOK.test(t) && !(askYear && askYear < cy && HI_BR_PAST.test(t));
    if (wantBook && !wantPast) return hiBranchBook(m, st);
    if (wantPast) return hiBranchAnalysis(m, st, { year: (askYear && (st.pastYears || []).indexOf(askYear) >= 0) ? askYear : y });
    if (HI_BR_TREND.test(t) && (st.pastYears || []).length >= 2) return hiBranchAnalysis(m, st);
    if (HI_BR_PREP.test(t) && st.booked) return hiBranchPrep(st);

    /* 단계별 예/아니오 — 거절이 먼저(“나중에 볼게요”가 수락으로 읽히지 않게) */
    const no = HI_BR_NO.test(t), yes = !no && HI_BR_YES.test(" " + t);
    if (stage === "offered") {
      if (no) return hiBranchSkipAnalysis(st);
      if (yes) return hiBranchAnalysis(m, st);
    } else if (stage === "book-asked") {
      if (no) return hiBranchLater(st);
      if (yes) return hiBranchBook(m, st);
    } else if (stage === "prep-asked") {
      if (no) { hiBranchSave(Object.assign(st, { stage: "later", ambig: 0 })); return { kind: "branch", stage: "later", res: {
        lines: ["네, 알겠어요. 검진 전날 준비사항은 그때 제가 먼저 챙겨드릴게요."], buttons: [`${y}년 결과 보기`], nav: null, preview: null,
        followup: { type: "notify", inDays: Math.max(1, (st.bookingInDays || 2) - 1), message: "내일 검진이에요! 오늘 저녁 9시부터 금식하시고, 신분증 꼭 챙기세요." } } }; }
      if (yes) return hiBranchPrep(st);
    } else if (stage === "later" || stage === "booked" || stage === "prepped") {
      if (yes && !st.booked) return hiBranchBook(m, st);
    }

    /* 모호 — 재질문 1회, 두 번째는 기존 U7 폴백에 넘긴다 */
    if (stage === "offered" || stage === "book-asked" || stage === "prep-asked" || stage === "book-offered") {
      const vague = /모르|몰라|아무거나|알아서|그냥|글쎄|어떤|뭐가|추천/.test(t);
      const isShort = raw.replace(/\s/g, "").length <= 12;
      if (vague || (isShort && !/[가-힣]{4,}/.test(raw))) {
        if ((st.ambig || 0) >= 1) { hiBranchClear(); return null; }
        hiBranchSave(Object.assign(st, { ambig: (st.ambig || 0) + 1 }));
        const nx = _hiBranchNextAsk(st);
        return { kind: "branch", stage: "reask", res: {
          lines: stage === "offered"
            ? [`${y}년 검진 결과 분석을 보여드릴 수 있어요 — 지금 보시겠어요?`, "원하지 않으시면 \"나중에\"라고만 말씀하셔도 돼요."]
            : [nx.line, "\"네\" 또는 \"나중에\"로 알려주시면 돼요."],
          buttons: stage === "offered" ? ["네, 보여주세요", "나중에 볼게요"] : nx.buttons,
          nav: null, preview: null, followup: null } };
      }
    }
    return null;
  } catch (e) { return null; }
}

/* 관리자·검증 노출 */
try { if (typeof window !== "undefined") { window.__hifinBranch = { arm: hiBranchArm, handle: hiBranchHandle, state: hiBranchLoad, clear: hiBranchClear }; } } catch (e) {}
