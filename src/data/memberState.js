/* ══════════════ MemberStateService — 회원 상태 스냅샷(2단계 추론의 근거) ══════════════
   원칙: ①실데이터 우선 — 데이터 금고·토큰원장·리퍼럴·가족·예약증서 등 화면과 같은 소스를 읽는다(모순 금지).
        ②없는 변수만 합성 폴백 — hiSynthState(hiStateModel.js)의 분포로 결정론 생성(같은 회원=같은 상태).
        ③파이프라인 진입 시 1회 로드(15초 캐시) — 답변 템플릿은 state.s1.resultArrived 식 조건 분기로 사용.
        ④개인정보 — 스냅샷은 최소 필드만 담고 원데이터(수치·파일)는 포함하지 않는다. 로그 저장 금지.
   테스트 주입: localStorage "hifin_hi_state_<email>"에 부분 상태 JSON을 넣으면 최종 스냅샷에 딥머지된다. */

var _hiStateCache = { key: null, ts: 0, snap: null };

function _hiDeepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const k in patch) {
    const v = patch[k];
    out[k] = (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") ? _hiDeepMerge(out[k], v) : v;
  }
  return out;
}

/* "M/D" | "YYYY-MM-DD" → ms(가까운 해석) */
function _hiParseDate(str, nowTs) {
  try {
    const s = String(str || "");
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).getTime();
    const md = s.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (md) { const d = new Date(nowTs); d.setMonth(parseInt(md[1], 10) - 1, parseInt(md[2], 10)); d.setHours(9, 0, 0, 0); return d.getTime(); }
  } catch (e) {}
  return null;
}

/* ── 실데이터 오버레이 수집 — 각 소스는 없으면 조용히 건너뜀(합성 폴백 유지) ── */
function _hiLiveOverlay(m, base, nowTs) {
  const day = 86400000, live = {};
  const thisYear = new Date(nowTs).getFullYear();

  /* 데이터 금고(검진·보험) — S1·S2·S5의 1차 소스 */
  let v = null, ob = null;
  try { v = (typeof vaultLoad === "function" && typeof anonToken === "function") ? vaultLoad(anonToken(m)) : null; } catch (e) {}
  try { ob = (typeof onboardStatus === "function") ? onboardStatus(m) : null; } catch (e) {}
  if (ob) {
    const cks = (v && v.checkups) || [];
    const years = {}; let lastCk = null, fullAny = false, nhis = false, uploads = 0;
    cks.forEach(function (c) {
      const t = _hiParseDate(c.date || (c.meta && c.meta.date), nowTs);
      if (t) { years[new Date(t).getFullYear()] = 1; if (!lastCk || t > lastCk) lastCk = t; }
      if ((c.completeness || (c.meta && c.meta.completeness)) === "full") fullAny = true;
      const ch = c.channel || (c.meta && c.meta.channel) || c.source;
      if (ch === "nhis") nhis = true; else if (ch === "upload" || ch === "photo") uploads++;
    });
    const ckThisYear = !!years[thisYear];
    live.s5 = { anyLink: !!ob.step1, nhisLinked: nhis, uploadCount: uploads };
    if (lastCk) live.s5.lastLinkAgeDays = Math.max(0, Math.round((nowTs - lastCk) / day));
    /* [2단계] 연차 상태 — 보유 연도 목록이 1차 진실(과거 기록 보유자를 '데이터 없음'으로 처리하지 않기 위함) */
    const recordYears = Object.keys(years).map(Number).sort(function (a, b) { return a - b; });
    const pastYears = recordYears.filter(function (y) { return y < thisYear; });
    live.s1 = { currentYear: thisYear, recordYears: recordYears, pastYears: pastYears,
      hasCurrentYear: ckThisYear, latestYear: recordYears.length ? recordYears[recordYears.length - 1] : null,
      group: ckThisYear ? "current" : (pastYears.length ? "past" : "none"),
      checkedThisYear: ckThisYear, checkedLastYear: !!years[thisYear - 1], resultArrived: ckThisYear };
    if (ckThisYear && lastCk) { live.s1.checkupDaysAgo = Math.max(0, Math.round((nowTs - lastCk) / day)); live.s1.resultAgeDays = live.s1.checkupDaysAgo; live.s1.checkupAt = new Date(lastCk).toISOString().slice(0, 10); }
    const trendYears = recordYears.length;
    live.s2 = { dataScope: !ob.step1 ? "none" : (fullAny ? "full" : "partial"), bioAgeReady: !!ob.step1 && fullAny, trendYears: trendYears };
    live.s3 = { insLinked: !!ob.step2, contractCount: (v && v.insurance && v.insurance.length) || 0 };
    if (!ob.step1) { live.s1.recheckNeeded = false; live.s2.trendYears = 0; }
    /* 금고 권한: 동의 이력이 저장돼 있으면 설정 완료로 본다 */
    try { live.s5.vaultPermSet = !!(v && v.consents && Object.keys(v.consents).length); } catch (e) {}
  }

  /* 검진 예약(하이 대화·화면 예약 공통 증서 저장소) — 미래=예약, 과거+올해 금고 검진 없음=결과 대기 */
  try {
    const certs = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]");
    let future = null, past = null;
    certs.forEach(function (c) {
      const t = _hiParseDate(c.date, nowTs); if (!t) return;
      if (t >= nowTs - day / 2) { if (!future || t < future) future = t; }
      else { if (!past || t > past) past = t; }
    });
    live.s1 = live.s1 || {};
    if (future) { live.s1.hasBooking = true; live.s1.currentYearBooked = true; live.s1.bookingInDays = Math.max(0, Math.round((future - nowTs) / day)); live.s1.bookingDate = new Date(future).toISOString().slice(0, 10); }
    else if (certs.length) { live.s1.hasBooking = false; live.s1.currentYearBooked = false; }
    if (past && live.s1.hasCurrentYear === false && new Date(past).getFullYear() === thisYear) {
      /* 올해 검진일은 지났는데 결과(금고 데이터)가 아직 없음 → '결과 대기'(분기응답보다 우선 판정) */
      live.s1.checkedThisYear = true; live.s1.resultArrived = false; live.s1.resultPending = true;
      live.s1.checkupDaysAgo = Math.max(0, Math.round((nowTs - past) / day)); live.s1.checkupAt = new Date(past).toISOString().slice(0, 10);
    } else if (live.s1.hasCurrentYear !== undefined) live.s1.resultPending = false;
    live.s7 = live.s7 || {}; if (certs.length) { live.s7.nftCount = certs.length; live.s7.nftEligible = true; }
  } catch (e) {}

  /* 실손 세대 — 연동된 경우에만 화면과 동일 소스(memberInsurance) */
  try {
    if (live.s3 && live.s3.insLinked && typeof memberInsurance === "function") {
      const ins = memberInsurance(m);
      if (ins && ins.silson) { live.s3.silsonGen = ins.silson.enrolled ? ins.silson.gen : "미가입"; if (ins.contracts) live.s3.contractCount = Math.max(live.s3.contractCount || 0, ins.contracts.length || 0); }
    }
  } catch (e) {}

  /* 청구 진행 — 하이 대화 접수 저장소 */
  try { const cl = JSON.parse(localStorage.getItem("hifin_claims") || "[]"); live.s3 = live.s3 || {}; live.s3.claimActive = cl.some(function (c) { return c.status === "접수"; }); } catch (e) {}

  /* 지갑 잔액 — 단일 원장(tlSync) */
  try { if (typeof tlSync === "function") { const b = tlSync(m); if (b != null) { live.s4 = { balance: b }; } } } catch (e) {}
  /* 충전 이력 — 충전 주문 저장소 */
  try { const od = JSON.parse(localStorage.getItem("hifin_topup_orders_" + (m.email || "")) || localStorage.getItem("hifin_topup_orders") || "[]"); if (od.length) { live.s4 = live.s4 || {}; live.s4.topupCount = od.length; } } catch (e) {}

  /* 가족 — 화면과 동일 소스(familyLoad). 목록이 실재하면 그것이 진실(합성 무시) */
  try {
    if (typeof familyLoad === "function") {
      const fam = familyLoad(m.email, (m.name || "가")[0]) || [];
      live.s6 = { familyCount: fam.length };
      if (!fam.length) { live.s6.famLinkedCount = 0; live.s6.famCheckupDue = 0; }
      else { live.s6.famLinkedCount = Math.min(base.s6.famLinkedCount, fam.length); live.s6.famCheckupDue = Math.min(Math.max(base.s6.famCheckupDue, 1), fam.length); }
    }
  } catch (e) {}

  /* 초대 — 리퍼럴 원장 */
  try {
    if (typeof refState === "function") {
      const r = refState(m.email);
      live.s8 = { invited: r.invited || 0, joined: r.joined || 0 };
      if (!(r.joined > 0)) live.s8.unpaidReward = 0;   // 전환이 없으면 미지급 보상도 없음(정합)
    }
  } catch (e) {}

  /* 계정 — 쉬운말 모드는 실설정, 데모 로그인 회원은 인증 완료로 간주 */
  try { live.s9 = { easyMode: !!localStorage.getItem("hifin_easyread") }; if (m.isDemoUser || m.email) live.s9.certified = true; } catch (e) {}

  /* 회원 기본 */
  live.member = { age: (m.regAge != null ? Math.round(m.regAge) : base.member.age), sex: m.sex || base.member.sex, region: m.sido || base.member.region };
  return live;
}

/* ── 진입점: 상태 스냅샷 1회 로드(15초 캐시) ── */
function memberStateSnapshot(m) {
  if (!m) return null;
  const key = m.email || m.id || m.name;
  const now = Date.now();
  if (_hiStateCache.key === key && now - _hiStateCache.ts < 15000) return _hiStateCache.snap;
  let snap = null;
  try {
    const base = hiSynthState(key, now, { age: m.regAge != null ? Math.round(m.regAge) : null, sex: m.sex, region: m.sido });
    snap = _hiDeepMerge(base, _hiLiveOverlay(m, base, now));
    /* 데모·시나리오 주입(테스트 표준: localStorage 세션 주입) — 최우선 적용 */
    try { const inj = JSON.parse(localStorage.getItem("hifin_hi_state_" + (m.email || "")) || "null"); if (inj) snap = _hiDeepMerge(snap, inj); } catch (e) {}
    /* ⚠️ 병합은 새 객체를 만들므로 별칭을 다시 건다 — snap.checkup이 옛 s1을 가리키면 라우팅이 어긋난다 */
    if (snap && snap.s1) snap.checkup = snap.s1;
  } catch (e) { snap = null; }
  _hiStateCache = { key: key, ts: now, snap: snap };
  return snap;
}
function hiStateInvalidate() { _hiStateCache = { key: null, ts: 0, snap: null }; }

/* 데모 주입 헬퍼 — 콘솔·시연에서 상황 재현: hiStateInject("email", {s1:{checkedThisYear:true,resultArrived:false}}) */
function hiStateInject(email, patch) {
  try { localStorage.setItem("hifin_hi_state_" + email, JSON.stringify(patch || {})); hiStateInvalidate(); return true; } catch (e) { return false; }
}
function hiStateClearInject(email) { try { localStorage.removeItem("hifin_hi_state_" + email); hiStateInvalidate(); } catch (e) {} }

/* 관리자·시연 노출 */
try { if (typeof window !== "undefined") { window.__hifinState = { snapshot: memberStateSnapshot, inject: hiStateInject, clear: hiStateClearInject, invalidate: hiStateInvalidate, segments: function (m) { return hiSegMatchAll(memberStateSnapshot(m)).map(function (g) { return g.id + " " + g.label; }); } }; } } catch (e) {}
