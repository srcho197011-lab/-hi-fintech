/* ══════════════ 하이 2단계 — 회원 상태 모델·세그먼트 단일 소스(Member State Model) ══════════════
   이 파일이 ①런타임 상태서비스(memberState.js)·추론엔진(hiReasoner.js) ②10만 데모 DB 생성기(docs/hi_phase2/seed-demo-db.mjs)
   ③세그먼트 마이닝(mine-questions.mjs) ④시나리오 검증(test-scenarios.mjs)의 공통 입력이다.
   구성: HI_STATE_DIST(확률 분포 config) → hiSynthState(결정론 합성 상태) → HI_SEGMENTS(상황 세그먼트 정의 + SARG 답변 템플릿).
   ⚠️ 순수 JS만(브라우저 API 금지) — Node에서 new Function으로 그대로 평가된다. */

/* ── 결정론 PRNG(mulberry32) + 문자열 시드 해시 — 같은 회원은 언제나 같은 상태 ── */
function hiSeedHash(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function hiRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── 상태 변수 확률 분포 config — 10만 데모 DB·합성 폴백 공통(조정은 여기서만) ──
   기준 수치: 공단 연결률 55% · 올해 수검률 48% · 결과 미도착 8%(전체 기준) · 보험 연동률 40%
   · 휴면보험금 보유 12%(전체) · 소멸예정 HTK 20% · 가족 등록 35% · 미지급 초대보상 5% */
const HI_STATE_DIST = {
  demo: {
    /* 연령 20~85 · 40~70대 60% 이상 */
    ageBands: [ [20, 29, 0.10], [30, 39, 0.14], [40, 49, 0.20], [50, 59, 0.22], [60, 69, 0.18], [70, 79, 0.12], [80, 85, 0.04] ],
    femaleRate: 0.52,
    regions: [ ["서울특별시", 0.18], ["경기도", 0.26], ["인천광역시", 0.06], ["부산광역시", 0.07], ["대구광역시", 0.05],
      ["광주광역시", 0.03], ["대전광역시", 0.03], ["울산광역시", 0.02], ["세종특별자치시", 0.01], ["강원특별자치도", 0.03],
      ["충청북도", 0.03], ["충청남도", 0.04], ["전북특별자치도", 0.03], ["전라남도", 0.03], ["경상북도", 0.05],
      ["경상남도", 0.06], ["제주특별자치도", 0.02] ],
    joinDaysMax: 720,          // 가입 후 최대 2년
  },
  s1: {
    checkedThisYear: 0.48,     // 올해 수검률
    resultPendingOfChecked: 0.1667,   // 수검자 중 결과 미도착(전체 8%)
    checkedLastYear: 0.52,
    bookingOfUnchecked: 0.15,  // 미수검자 중 예약 보유
    bookingDaysAhead: 21,      // 예약일: 오늘+1~21일
    recheckOfResulted: 0.18,   // 결과 보유자 중 재검 권고
    resultAgeMaxDays: 240,
  },
  s3: {
    insLinked: 0.40,
    dormantOfLinked: 0.30,     // 연동자 중 휴면보험금 보유(전체 12%)
    dormantAmtMin: 30000, dormantAmtMax: 1870000,
    gapDoneOfLinked: 0.55,
    syncOldOfLinked: 0.25,     // 최종 동기화 180일 초과
    silsonOfLinked: [ ["미가입", 0.15], ["1세대", 0.08], ["2세대", 0.22], ["3세대", 0.25], ["4세대", 0.30] ],
    claimActiveOfLinked: 0.06,
    contractsMin: 1, contractsMax: 7,
  },
  s4: {
    balanceZero: 0.18,
    balanceMax: 52000,
    expiring: 0.20,            // 소멸예정 HTK 보유(30일 이내)
    expireDaysMax: 30,
    expiringAmtMax: 4200,
    topupEver: 0.25,
    tiers: [ ["일반", 0.55], ["실버", 0.25], ["골드", 0.15], ["VIP", 0.05] ],
    tierNextGap: 3000,         // 다음 등급까지 필요 실적 상한(HTK)
  },
  s5: {
    nhisLinked: 0.55,
    uploads: [ [0, 0.60], [1, 0.25], [2, 0.10], [3, 0.05] ],
    linkAgeMaxDays: 540,
    vaultPermOfLinked: 0.40,   // 금고 권한(공유 범위) 설정 완료
  },
  s6: {
    familyReg: 0.35,
    famCountMax: 3,
    famLinkedOfReg: 0.40,      // 등록 가족 중 데이터 연결 존재
    famCheckupDueOfReg: 0.50,  // 가족 중 검진 예정·미수검 존재
  },
  s7: { nftOfEligible: 0.70 }, // 발급조건 충족자 중 실제 보유
  s8: {
    inviterRate: 0.30,         // 초대 경험(1건 이상)
    invitedMax: 8,
    joinedOfInviter: 0.60,     // 초대자 중 가입 전환 1명 이상
    unpaidOfJoined: 0.28,      // 전환 보유자 중 미지급 보상 존재(전체 ≈5%)
    codeUsedAtJoin: 0.25,
  },
  s9: {
    certified: 0.88,
    notiOn: 0.75,
    easyBase: 0.08, easyElder: 0.30,   // 70세+ 쉬운말 모드 비율
    loginIssue: 0.07,
  },
};

function _pickW(rnd, pairs) {
  const r = rnd(); let acc = 0;
  for (const [v, p] of pairs) { acc += p; if (r < acc) return v; }
  return pairs[pairs.length - 1][0];
}

/* ── 합성 상태 생성 — 시드(회원 식별자)만으로 전 상태 변수를 결정론 생성 ──
   nowTs: 기준 시각(ms). 데모 DB·검증은 고정값을 넣어 재현성 확보. */
function hiSynthState(seedStr, nowTs, demogOpt) {
  const D = HI_STATE_DIST;
  const rnd = hiRng(hiSeedHash("hi-p2|" + seedStr));
  const day = 86400000;
  /* 인구 */
  let age, sex, region;
  if (demogOpt && demogOpt.age != null) { age = demogOpt.age; sex = demogOpt.sex || (rnd() < D.demo.femaleRate ? "여" : "남"); region = demogOpt.region || _pickW(rnd, D.demo.regions.map(function (r) { return [r[0], r[1]]; })); }
  else {
    const band = _pickW(rnd, D.demo.ageBands.map(function (b) { return [b, b[2]]; }));
    age = band[0] + Math.floor(rnd() * (band[1] - band[0] + 1));
    sex = rnd() < D.demo.femaleRate ? "여" : "남";
    region = _pickW(rnd, D.demo.regions.map(function (r) { return [r[0], r[1]]; }));
  }
  const joinDays = 1 + Math.floor(rnd() * D.demo.joinDaysMax);
  const elder = age >= 70;

  /* S1 검진 */
  const checkedThisYear = rnd() < D.s1.checkedThisYear;
  const resultArrived = checkedThisYear ? rnd() >= D.s1.resultPendingOfChecked : false;
  const checkupDaysAgo = checkedThisYear ? 3 + Math.floor(rnd() * 120) : null;
  const resultAgeDays = resultArrived ? Math.min(checkupDaysAgo || 10, 7 + Math.floor(rnd() * D.s1.resultAgeMaxDays)) : null;
  const hasBooking = !checkedThisYear && rnd() < D.s1.bookingOfUnchecked;
  const bookingInDays = hasBooking ? 1 + Math.floor(rnd() * D.s1.bookingDaysAhead) : null;
  const recheckNeeded = resultArrived && rnd() < D.s1.recheckOfResulted;
  const checkedLastYear = rnd() < D.s1.checkedLastYear;
  const nationalTarget = (new Date(nowTs).getFullYear() - age) % 2 === 0 ? rnd() < 0.85 : rnd() < 0.15;   // 출생연도 홀짝 격년(오차 허용)

  /* S5 데이터 */
  const nhisLinked = rnd() < D.s5.nhisLinked;
  const uploadCount = _pickW(rnd, D.s5.uploads);
  const anyLink = nhisLinked || uploadCount > 0 || resultArrived;
  const lastLinkAgeDays = anyLink ? 1 + Math.floor(rnd() * D.s5.linkAgeMaxDays) : null;
  const vaultPermSet = anyLink ? rnd() < D.s5.vaultPermOfLinked : false;
  const trendYears = (uploadCount >= 2 || (nhisLinked && checkedLastYear)) ? 2 + (uploadCount >= 3 ? 1 : 0) : (anyLink ? 1 : 0);

  /* S2 건강분석(파생) */
  const dataScope = !anyLink ? "none" : (uploadCount > 0 || resultArrived ? "full" : "partial");   // 공단만=부분(항목 제한)
  const bioAgeReady = dataScope === "full";

  /* S3 보험 */
  const insLinked = rnd() < D.s3.insLinked;
  const dormantAmt = insLinked && rnd() < D.s3.dormantOfLinked ? D.s3.dormantAmtMin + Math.floor(rnd() * (D.s3.dormantAmtMax - D.s3.dormantAmtMin) / 10000) * 10000 : 0;
  const gapDone = insLinked ? rnd() < D.s3.gapDoneOfLinked : false;
  const syncAgeDays = insLinked ? (rnd() < D.s3.syncOldOfLinked ? 181 + Math.floor(rnd() * 240) : 1 + Math.floor(rnd() * 180)) : null;
  const silsonGen = insLinked ? _pickW(rnd, D.s3.silsonOfLinked) : null;
  const claimActive = insLinked ? rnd() < D.s3.claimActiveOfLinked : false;
  const contractCount = insLinked ? D.s3.contractsMin + Math.floor(rnd() * (D.s3.contractsMax - D.s3.contractsMin + 1)) : 0;

  /* S4 지갑 */
  const balance = rnd() < D.s4.balanceZero ? 0 : 500 + Math.floor(rnd() * D.s4.balanceMax);
  const hasExpiring = balance > 0 && rnd() < D.s4.expiring;
  const expiringHtk = hasExpiring ? Math.min(balance, 100 + Math.floor(rnd() * D.s4.expiringAmtMax)) : 0;
  const expireInDays = hasExpiring ? 1 + Math.floor(rnd() * D.s4.expireDaysMax) : null;
  const topupCount = rnd() < D.s4.topupEver ? 1 + Math.floor(rnd() * 4) : 0;
  const tier = _pickW(rnd, D.s4.tiers);
  const tierNextNeed = tier === "VIP" ? 0 : 200 + Math.floor(rnd() * D.s4.tierNextGap);

  /* S6 가족 */
  const familyCount = rnd() < D.s6.familyReg ? 1 + Math.floor(rnd() * D.s6.famCountMax) : 0;
  const famLinkedCount = familyCount ? (rnd() < D.s6.famLinkedOfReg ? 1 + Math.floor(rnd() * familyCount) : 0) : 0;
  const famCheckupDue = familyCount ? (rnd() < D.s6.famCheckupDueOfReg ? 1 + Math.floor(rnd() * familyCount) : 0) : 0;

  /* S7 NFT */
  const nftEligible = checkedThisYear || hasBooking;
  const nftCount = nftEligible && rnd() < D.s7.nftOfEligible ? 1 + Math.floor(rnd() * 3) : 0;

  /* S8 초대 */
  const invited = rnd() < D.s8.inviterRate ? 1 + Math.floor(rnd() * D.s8.invitedMax) : 0;
  const joined = invited ? (rnd() < D.s8.joinedOfInviter ? 1 + Math.floor(rnd() * invited) : 0) : 0;
  const unpaidReward = joined && rnd() < D.s8.unpaidOfJoined ? 100 * (1 + Math.floor(rnd() * 4)) : 0;
  const codeUsed = rnd() < D.s8.codeUsedAtJoin;

  /* S9 계정 */
  const certified = rnd() < D.s9.certified;
  const notiOn = rnd() < D.s9.notiOn;
  const easyMode = rnd() < (elder ? D.s9.easyElder : D.s9.easyBase);
  const loginIssue = rnd() < D.s9.loginIssue;

  const iso = function (daysAgo) { return daysAgo == null ? null : new Date(nowTs - daysAgo * day).toISOString().slice(0, 10); };
  return {
    member: { age: age, sex: sex, region: region, joinDays: joinDays, joinedAt: iso(joinDays) },
    s1: { checkedThisYear: checkedThisYear, checkedLastYear: checkedLastYear, hasBooking: hasBooking, bookingInDays: bookingInDays,
      bookingDate: bookingInDays != null ? new Date(nowTs + bookingInDays * day).toISOString().slice(0, 10) : null,
      resultArrived: resultArrived, resultAgeDays: resultAgeDays, checkupDaysAgo: checkupDaysAgo, checkupAt: iso(checkupDaysAgo),
      recheckNeeded: recheckNeeded, nationalTarget: nationalTarget },
    s2: { dataScope: dataScope, bioAgeReady: bioAgeReady, trendYears: trendYears },
    s3: { insLinked: insLinked, syncAgeDays: syncAgeDays, lastSyncAt: iso(syncAgeDays), contractCount: contractCount,
      gapDone: gapDone, dormantAmt: dormantAmt, silsonGen: silsonGen, claimActive: claimActive },
    s4: { balance: balance, expiringHtk: expiringHtk, expireInDays: expireInDays, topupCount: topupCount, tier: tier, tierNextNeed: tierNextNeed },
    s5: { nhisLinked: nhisLinked, uploadCount: uploadCount, anyLink: anyLink, lastLinkAgeDays: lastLinkAgeDays, lastLinkAt: iso(lastLinkAgeDays), vaultPermSet: vaultPermSet },
    s6: { familyCount: familyCount, famLinkedCount: famLinkedCount, famCheckupDue: famCheckupDue },
    s7: { nftCount: nftCount, nftEligible: nftEligible },
    s8: { invited: invited, joined: joined, unpaidReward: unpaidReward, codeUsed: codeUsed },
    s9: { certified: certified, notiOn: notiOn, easyMode: easyMode, loginIssue: loginIssue },
  };
}

/* ══════════════ 상황 세그먼트 정의 — 추론형(SARG) 답변의 단일 소스 ══════════════
   각 세그먼트: id · sec(S1~S9) · label · def(상황 정의문) · when(s)(매칭 룰 — 데모 DB 마이닝과 런타임 추론이 동일 코드 사용)
   · intents(발동 인텐트 id 접두 매칭) · qpat(무분류 보조 매칭 — 정규화 문자열 부분일치) · q(회원 질문 변형)
   · sarg(s): { situation(상황 파악) · assess(원인·전망) · route(해결 경로) · guide(미리 보여주기 멘트) }
   · preview { route·nav·title·desc } · followup(s): {type:"notify", inDays, message} | null · chips
   ⚠️ 의료 경계: 진단·처방 추론 금지(U4 정책 계승) — 모든 문구는 '행동 안내'까지만. */
function _d(n) { return n == null ? "-" : String(n); }
function _won10(n) { return (n || 0).toLocaleString() + "원"; }
const HI_SEGMENTS = [
  /* ───────── S1 검진 ───────── */
  {
    id: "SEG-S1-01", sec: "S1", label: "수검 완료·결과 대기", def: "올해 검진을 받았지만 결과가 아직 등록되지 않음",
    when: function (s) { return s.s1.checkedThisYear && !s.s1.resultArrived; },
    intents: ["S1-RESULT", "S1-EXPLAIN", "S1-BIO", "S1-HUB", "S2-REPORT", "S2-TREND"], qpat: ["결과언제", "결과안나", "결과아직", "결과안왔", "결과왜안"],
    q: ["내 건강검진 결과를 알려줘", "검진 결과 언제 나와?", "결과지가 아직 안 왔어", "검진 받았는데 결과가 안 보여요", "결과 나왔는지 확인해줘", "검진결과 왜 안 나와", "결과지 도착했어?", "검진 결과 보여줘"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 올해 검진은 받으셨는데(" + _d(s.s1.checkupAt) + ") 결과가 아직 등록 전이에요.",
        assess: "검진 결과지는 보통 검진 후 7~10일 뒤에 나와요 — 지금 " + _d(s.s1.checkupDaysAgo) + "일째라 " + (s.s1.checkupDaysAgo != null && s.s1.checkupDaysAgo > 10 ? "이미 나왔을 수 있어요. 검진기관에서 문자·우편을 확인해 보세요." : "곧 도착할 시기예요."),
        route: "결과지를 받으시면 사진이나 PDF로 올려 주세요 — [데이터 금고 → 파일 업로드]에서 '파일 업로드'를 누르면 되고, 올리는 즉시 제가 상세 분석해 드려요.",
        guide: "업로드 화면을 지금 미리 보여드릴게요. 결과가 나올 때쯤 제가 먼저 알려드릴까요?",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "데이터 연결 · 파일 업로드", desc: "결과지 사진·PDF를 올리면 1분 안에 자동 분석돼요" },
    followup: function (s) { const d = Math.max(1, 10 - (s.s1.checkupDaysAgo || 0)); return { type: "notify", inDays: d, message: "검진 결과 도착 예정일이에요 — 결과지가 나왔다면 올려 주세요. 바로 분석해 드릴게요!" }; },
    chips: ["업로드 화면 미리보기", "알림 받기"],
  },
  {
    id: "SEG-S1-02", sec: "S1", label: "올해 미수검·예약 없음", def: "올해 검진을 받지 않았고 예약도 없음",
    when: function (s) { return !s.s1.checkedThisYear && !s.s1.hasBooking; },
    intents: ["S1-RESULT", "S1-EXPLAIN", "S1-BIO", "S1-HUB", "S2-REPORT"], qpat: ["검진안받", "검진아직", "검진언제받", "검진받아야"],
    q: ["내 건강검진 결과를 알려줘", "올해 검진 받아야 해?", "검진 안 받았는데 어떡해", "건강검진 언제 받지", "검진 받은 지 오래됐어", "올해 검진 대상이야?", "검진 뭐부터 해야 해", "결과 보여줘 (미수검)"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 올해 검진 기록이 아직 없어요" + (s.s1.checkedLastYear ? " — 작년에는 받으셨네요." : "."),
        assess: (s.s1.nationalTarget ? "올해 국가 일반검진 대상이라 본인부담 0원으로 받을 수 있어요. " : "") + "검진을 받아야 결과 분석·생체나이·보장 점검까지 이어져요.",
        route: "① 아직 안 받으셨다면 예약부터 도와드릴게요 — \"검진 예약해줘\" 한마디면 센터·날짜 추천까지 끝나요. ② 이미 받으셨다면 결과지를 사진·PDF로 올려 주시면 바로 분석해 드려요.",
        guide: "예약 화면을 미리 보여드릴게요. 예약하면 무료 검진대비보험도 자동으로 준비돼요.",
      };
    },
    preview: { route: "app://checkup/booking", nav: "checkup", title: "건강검진 예약", desc: "내 주변 센터 비교 → 예약 → 무료 검진대비보험 자동 준비" },
    followup: function () { return { type: "notify", inDays: 7, message: "검진 예약, 아직이시죠? 미루기 쉬운 일이라 제가 한 번 더 챙겨드려요 — 지금 1분이면 예약돼요." }; },
    chips: ["검진 예약하기", "업로드 화면 미리보기", "알림 받기"],
  },
  {
    id: "SEG-S1-03", sec: "S1", label: "예약 임박(D-7 이내)", def: "검진 예약이 7일 이내로 다가옴",
    when: function (s) { return s.s1.hasBooking && s.s1.bookingInDays != null && s.s1.bookingInDays <= 7; },
    intents: ["S1-BOOK", "S1-PREP", "S1-HUB"], qpat: ["검진며칠", "예약언제였"],
    q: ["내 검진 예약 언제야?", "검진 전에 뭐 준비해?", "검진 전날 금식해야 해?", "예약 확인해줘", "검진 며칠 남았어", "검진 전에 약 먹어도 돼?", "검진 준비물 알려줘", "예약 바꿀 수 있어?"],
    sarg: function (s) {
      return {
        situation: "예약이 " + _d(s.s1.bookingDate) + "(D-" + _d(s.s1.bookingInDays) + ")로 다가왔어요.",
        assess: "전날 저녁 9시 이후 금식(물은 자정까지), 당일 아침은 물도 삼가는 게 좋아요. 복용 중인 약은 검진센터와 미리 상의하세요.",
        route: "예약 변경·취소가 필요하면 검진 3일 전까지 '내 예약'에서 자유롭게 바꿀 수 있어요.",
        guide: "검진 화면을 미리 보여드릴게요. 전날 저녁에 준비사항 알림을 걸어드릴까요?",
      };
    },
    preview: { route: "app://checkup", nav: "checkup", title: "건강검진 · 내 예약", desc: "예약 확인·변경과 검진 전 준비사항 안내" },
    followup: function (s) { return { type: "notify", inDays: Math.max(1, (s.s1.bookingInDays || 2) - 1), message: "내일 검진이에요! 오늘 저녁 9시부터 금식하시고, 물은 자정까지만 드세요. 신분증 꼭 챙기세요." }; },
    chips: ["검진 준비사항 알려줘", "알림 받기"],
  },
  {
    id: "SEG-S1-04", sec: "S1", label: "재검·추적 권고 있음", def: "결과에 재검(추적검사) 권고 항목이 있음",
    when: function (s) { return s.s1.resultArrived && s.s1.recheckNeeded; },
    intents: ["S1-RECHECK", "S1-RESULT", "S1-EXPLAIN"], qpat: ["재검받아야", "재검사해야", "재검예약", "재검안받으면", "재검언제까지"],
    q: ["재검 받으라는데 어떡해", "재검사 꼭 해야 해?", "추적검사 뭐 받아야 해", "재검 언제까지 받아야 해?", "재검 병원 어디로 가", "재검 안 받으면 어떻게 돼?", "재검 예약해줘", "결과에 재검이라고 떠 있어"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 이번 결과(" + _d(s.s1.checkupAt) + ")에 재검·추적 권고 항목이 있어요.",
        assess: "재검 권고는 '병'이라는 뜻이 아니라 한 번 더 정확히 보자는 신호예요 — 다만 미루면 조기 발견 기회를 놓칠 수 있어서 1~3개월 안에 받는 걸 권해요.",
        route: "① 어떤 항목이 재검인지 결과 화면에서 함께 확인하고 ② 필요한 정밀검사와 가까운 기관을 추천해 드릴게요 — \"재검 예약 도와줘\"라고 하시면 예약까지 이어드려요.",
        guide: "재검 항목 화면을 미리 보여드릴게요. 재검 시기가 다가오면 제가 먼저 알려드릴까요?",
      };
    },
    preview: { route: "app://checkup/results", nav: "manage", title: "검진 결과 · 재검 항목", desc: "재검 권고 항목과 권장 정밀검사·시기 확인" },
    followup: function () { return { type: "notify", inDays: 21, message: "재검 권고 항목, 아직 예약 전이시죠? 지금이 받기 좋은 시기예요 — 예약을 도와드릴게요." }; },
    chips: ["재검 항목 보여줘", "검진 예약하기", "알림 받기"],
  },
  {
    id: "SEG-S1-05", sec: "S1", label: "국가검진 대상·미수검", def: "올해 국가검진 대상인데 아직 수검 전",
    when: function (s) { return !s.s1.checkedThisYear && s.s1.nationalTarget; },
    intents: ["S1-NATIONAL", "S1-HUB", "S1-BOOK"], qpat: ["국가검진대상", "공단검진대상", "나라에서해주는검진", "무료로받을"],
    q: ["나 올해 국가검진 대상이야?", "국가검진 무료로 받을 수 있어?", "공단 검진 언제까지 받아야 해", "국가검진 놓치면 어떻게 돼?", "국가검진 뭐뭐 해줘?", "일반검진 대상 확인해줘", "나라에서 해주는 검진 받고 싶어", "국가검진 예약 어떻게 해"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 올해 국가 일반검진 대상이신데 아직 수검 전이에요.",
        assess: "국가검진은 본인부담 0원이고 12월 31일까지 받으면 돼요 — 연말엔 예약이 몰려서 지금 잡는 게 편해요.",
        route: "제휴 검진센터에서 국가검진+추가 항목을 함께 받을 수도 있어요. \"검진 예약해줘\"라고 하시면 대상 항목 확인부터 예약까지 한 번에 도와드려요.",
        guide: "예약 화면을 미리 보여드릴게요. 예약하면 무료 검진대비보험도 자동으로 준비돼요.",
      };
    },
    preview: { route: "app://checkup/booking", nav: "checkup", title: "국가검진 예약", desc: "올해 대상 항목 확인 → 센터 선택 → 본인부담 0원 예약" },
    followup: function () { return { type: "notify", inDays: 14, message: "국가검진 예약, 아직이시면 이번 주에 잡아두는 게 좋아요 — 연말엔 자리가 금방 차요." }; },
    chips: ["검진 예약하기", "알림 받기"],
  },
  {
    id: "SEG-S1-06", sec: "S1", label: "결과 6개월 경과", def: "마지막 결과가 6개월 이상 지나 다음 검진 준비 시점",
    when: function (s) { return s.s1.resultArrived && s.s1.resultAgeDays != null && s.s1.resultAgeDays > 180; },
    intents: ["S1-HUB"], qpat: [],
    q: ["다음 검진 언제 받아야 해?", "검진 주기 알려줘", "검진 또 받아야 해?", "내 검진 이력 보여줘", "마지막 검진 언제였지", "검진 스케줄 잡아줘", "내년 검진 미리 예약돼?", "검진 얼마나 자주 받아야 해"],
    sarg: function (s) {
      return {
        situation: "마지막 검진 결과가 " + Math.round((s.s1.resultAgeDays || 200) / 30) + "개월 전이라 슬슬 다음 검진을 준비할 시점이에요.",
        assess: "일반 검진은 1년 주기, 위험 항목이 있으면 6개월 추적을 권해요 — 꾸준히 쌓이면 추이 분석의 정확도도 올라가요.",
        route: "다음 검진을 미리 예약해 두면 잊지 않아요. \"검진 예약해줘\"라고 하시면 지난 검진 항목 기준으로 추천해 드려요.",
        guide: "검진 이력 화면을 미리 보여드릴게요. 다음 검진 시기에 맞춰 알림을 걸어드릴까요?",
      };
    },
    preview: { route: "app://checkup", nav: "checkup", title: "검진 이력·다음 예약", desc: "지난 검진 이력 확인과 다음 검진 예약" },
    followup: function () { return { type: "notify", inDays: 30, message: "다음 검진 시기가 다가오고 있어요 — 지난 결과 기준 추천 항목으로 예약을 도와드릴까요?" }; },
    chips: ["검진 예약하기", "작년이랑 비교해줘", "알림 받기"],
  },

  /* ───────── S5 데이터 연결·금고 ───────── */
  {
    id: "SEG-S5-01", sec: "S5", label: "데이터 전무(연결 0)", def: "공단·업로드 어느 쪽도 연결된 데이터가 없음",
    when: function (s) { return !s.s5.anyLink; },
    intents: ["S5-HUB", "S5-VAULT", "S2-REPORT", "S2-ITEM", "S2-TREND", "S2-RISK", "S1-BIO"], qpat: ["데이터없", "분석안나", "분석이안나", "정보어디서", "리포트가비어"],
    q: ["내 데이터 보여줘", "왜 분석이 안 나와?", "생체나이 알려줘 (미연결)", "내 혈압 어때 (미연결)", "리포트가 비어 있어", "데이터 금고에 뭐가 있어?", "내 정보 어디서 봐", "건강분석 해줘 (미연결)"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 아직 연결된 건강데이터가 하나도 없어요 — 그래서 분석 화면이 비어 보여요.",
        assess: "검진결과가 연결되어야 생체나이·위험도·의료비 예측이 전부 '내 실제 수치' 기준으로 계산돼요.",
        route: "① 결과지가 있다면 사진 한 장으로 1분에 연결돼요. ② 공단 인증 한 번으로 최근 10년 국가검진 이력을 가져올 수도 있어요.",
        guide: "데이터 연결 화면을 지금 미리 보여드릴게요 — 어느 쪽이든 1분이면 끝나요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "데이터 연결", desc: "사진·PDF 업로드 또는 공단 연계로 1분 연결" },
    followup: function () { return { type: "notify", inDays: 3, message: "데이터 연결이 아직 전이에요 — 결과지 사진 한 장이면 1분이에요. 지금 도와드릴까요?" }; },
    chips: ["검진결과 올리기", "공단 조회 할래요", "알림 받기"],
  },
  {
    id: "SEG-S5-02", sec: "S5", label: "공단만 연결(부분 데이터)", def: "공단 연계만 있고 결과지 업로드가 없어 정밀분석 제한",
    when: function (s) { return s.s5.nhisLinked && s.s5.uploadCount === 0 && s.s2.dataScope === "partial"; },
    intents: ["S5-NHIS", "S2-REPORT", "S1-BIO", "S2-ITEM"], qpat: ["분석이왜부족", "항목이없", "항목이비어", "일부항목", "공단데이터로는", "정확하게분석", "절반만나와", "정밀분석"],
    q: ["공단 연결했는데 왜 분석이 부족해?", "생체나이가 왜 안 나와", "일부 항목이 비어 있어", "콜레스테롤 수치가 안 보여", "공단 데이터로는 안 돼?", "더 정확하게 분석받고 싶어", "정밀분석 어떻게 받아", "리포트가 절반만 나와"],
    sarg: function (s) {
      return {
        situation: "공단 데이터는 연결돼 있는데, 공단 제공 항목이 일부라 정밀분석(생체나이·장기나이)은 아직 제한돼 있어요.",
        assess: "공단 연계는 핵심 수치 위주로만 와요 — 결과지 원본(사진·PDF)을 올리면 전체 항목이 채워져서 분석 정확도가 확 올라가요.",
        route: "가지고 계신 결과지를 [데이터 금고 → 파일 업로드]로 올려 주세요. 종이 결과지는 사진으로 찍기만 하면 AI가 글자를 읽어 자동 입력돼요.",
        guide: "업로드 화면을 미리 보여드릴게요 — 올리는 즉시 전체 분석으로 바뀌어요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "결과지 업로드", desc: "원본 업로드로 부분 → 전체 정밀분석 전환" },
    followup: function () { return { type: "notify", inDays: 5, message: "결과지 원본 업로드, 아직이시죠? 사진 한 장이면 정밀분석이 완성돼요." }; },
    chips: ["검진결과 올리기", "알림 받기"],
  },
  {
    id: "SEG-S5-03", sec: "S5", label: "공단 미연결(업로드만)", def: "업로드 데이터만 있고 공단 연계가 없어 과거 이력 부재",
    when: function (s) { return !s.s5.nhisLinked && s.s5.uploadCount > 0; },
    intents: ["S5-NHIS", "S2-TREND", "S5-HUB"], qpat: ["과거기록없", "작년결과없", "10년치", "옛날검진", "예전검진", "과거검진기록", "기록가져올"],
    q: ["작년 결과랑 비교해줘 (이력 없음)", "과거 검진 기록 가져올 수 있어?", "공단 조회 연결하면 뭐가 좋아", "예전 검진 결과도 보고 싶어", "10년치 기록 가져와줘", "공단 연결 어떻게 해", "추이 분석이 안 돼", "옛날 검진 자료 찾아줘"],
    sarg: function (s) {
      return {
        situation: "올해 결과는 연결돼 있는데 과거 이력이 없어서 연도별 비교(추이)가 아직 안 돼요.",
        assess: "공단 연계를 켜면 최근 10년 국가검진 이력이 자동으로 들어와요 — 본인인증 한 번, 1분이면 돼요.",
        route: "[데이터 연결 → 공단 조회]에서 인증만 하면 과거 기록이 채워지고, 좋아진 수치·나빠진 수치가 한눈에 보여요.",
        guide: "공단 연결 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "공단 데이터 연결", desc: "본인인증 1회로 최근 10년 검진 이력 자동 연결" },
    followup: function () { return { type: "notify", inDays: 5, message: "공단 연계로 과거 10년 이력을 채우면 추이 분석이 완성돼요 — 1분이면 끝나요." }; },
    chips: ["공단 조회 할래요", "알림 받기"],
  },
  {
    id: "SEG-S5-04", sec: "S5", label: "연결 1년 경과(갱신 필요)", def: "마지막 데이터 연결·갱신이 1년 이상 지남",
    when: function (s) { return s.s5.anyLink && s.s5.lastLinkAgeDays != null && s.s5.lastLinkAgeDays > 365; },
    intents: ["S5-HUB", "S5-NHIS", "S2-REPORT"], qpat: ["데이터오래", "갱신해야", "옛날기준", "연결다시", "다시해야", "최신이야", "업데이트해", "반영됐"],
    q: ["내 데이터 최신이야?", "데이터 갱신해야 해?", "분석이 옛날 기준 같아", "새 검진 결과 반영됐어?", "데이터 언제 연결했었지", "최신 데이터로 업데이트해줘", "작년 데이터로 분석되는 거 아냐?", "연결 다시 해야 해?"],
    sarg: function (s) {
      return {
        situation: "마지막 데이터 연결이 " + Math.round((s.s5.lastLinkAgeDays || 400) / 30) + "개월 전이라 분석이 그때 기준으로 되어 있어요.",
        assess: "그 뒤에 받은 검진이 있다면 지금 분석엔 반영 전이에요 — 새 결과를 연결해야 리포트가 최신이 돼요.",
        route: "새 결과지를 업로드하거나 공단 조회를 한 번 더 실행하면 최신 데이터로 갱신돼요 — 1분이면 돼요.",
        guide: "데이터 연결 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "데이터 갱신", desc: "새 결과지 업로드·공단 재조회로 분석을 최신으로" },
    followup: function () { return { type: "notify", inDays: 7, message: "데이터 갱신, 잊지 않으셨죠? 새 검진 결과가 있다면 올려 주세요 — 리포트가 최신이 돼요." }; },
    chips: ["검진결과 올리기", "공단 조회 할래요", "알림 받기"],
  },
  {
    id: "SEG-S5-05", sec: "S5", label: "금고 권한 미설정", def: "데이터는 있는데 금고 공유·보호 권한 설정 전",
    when: function (s) { return s.s5.anyLink && !s.s5.vaultPermSet; },
    intents: ["S5-VAULT", "S5-CONSENT", "S5-ACCESS"], qpat: ["누가볼수있", "권한설정", "정보안전", "공유범위", "잠금설정", "접근권한"],
    q: ["내 데이터 누가 볼 수 있어?", "데이터 금고 설정 어떻게 해", "권한 설정 안 했는데 괜찮아?", "내 정보 안전해?", "동의 설정 확인해줘", "데이터 공유 범위 정하고 싶어", "금고 잠금 설정해줘", "접근 권한 바꿔줘"],
    sarg: function (s) {
      return {
        situation: "데이터는 안전하게 보관 중인데, 금고의 공유 범위·동의 설정을 아직 직접 정하지 않으셨어요.",
        assess: "기본값은 '최소 공유'라 걱정하실 건 없지만, 목적별 동의 5종을 직접 확인해 두면 내 데이터가 어디에 쓰이는지 완전히 내 손안에 있게 돼요.",
        route: "[데이터 금고]에서 동의 현황과 접근 기록을 확인하고, 원치 않는 동의는 \"마케팅 동의 꺼줘\"처럼 말 한마디로 바꿀 수 있어요.",
        guide: "데이터 금고 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://vault", nav: "mywallet", title: "데이터 금고 · 동의 관리", desc: "동의 5종·접근 기록·즉시 삭제까지 한 화면" },
    followup: null,
    chips: ["동의관리 가기", "접근 이력 보기"],
  },
  {
    id: "SEG-S5-06", sec: "S5", label: "다년 데이터 보유(추이 가능)", def: "2개년 이상 데이터가 쌓여 추이 분석이 가능(1단계 실수치 답변 유지)", passive: true,
    when: function (s) { return s.s2.trendYears >= 2; },
    intents: ["S2-TREND"], qpat: ["수치좋아지", "나빠졌", "변화그래프", "몇년치"],
    q: ["작년이랑 비교해줘", "내 수치 좋아지고 있어?", "추이 보여줘", "연도별로 비교해줘", "혈압 변화 보여줘", "작년보다 나빠졌어?", "몇 년치 데이터 있어?", "변화 그래프 보여줘"],
    sarg: function (s) {
      return {
        situation: "좋은 소식이에요 — " + _d(s.s2.trendYears) + "개년 데이터가 쌓여 있어서 연도별 추이 비교가 가능해요.",
        assess: "추이는 한 번의 수치보다 훨씬 정확한 신호예요 — 좋아지는 항목과 관리가 필요한 항목이 한눈에 보여요.",
        route: "추이 비교 화면에서 연도별 수치를 나란히 볼 수 있고, 개선된 지표가 있으면 보험료 재산정(인하 전용) 신청까지 이어져요.",
        guide: "추이 비교 화면을 지금 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://checkup/compare", nav: "manage", title: "연도별 추이 비교", desc: "좋아진 수치·나빠진 수치를 나란히 확인" },
    followup: null,
    chips: ["추이 보여줘", "요율 재산정 신청해줘"],
  },

  /* ───────── S3 보험 ───────── */
  {
    id: "SEG-S3-01", sec: "S3", label: "보험 미연동", def: "통합조회 연동 전이라 보험 분석 불가",
    when: function (s) { return !s.s3.insLinked; },
    intents: ["S3-LIST", "S3-GAP", "S3-SILGEN", "S3-PREMIUM", "S3-DORMANT", "S3-HUB"], qpat: ["보험안보여", "보험비어", "보험정리", "뭐들었는지"],
    q: ["내 보험 보여줘 (미연동)", "보장 공백 분석해줘 (미연동)", "내 실손 몇 세대야 (미연동)", "휴면보험금 찾아줘 (미연동)", "보험료 얼마 내고 있어?", "내 보험 뭐 들었는지 몰라", "보험 정리 좀 해줘", "보험 분석 왜 안 돼"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 보험 통합조회가 아직 연결 전이라 보유 계약을 보여드릴 수 없어요.",
        assess: "본인인증 한 번이면 전 보험사 가입내역이 자동으로 들어와요(신용정보원 연계) — 1분이면 되고, 그때부터 보장 공백·휴면보험금·실손 세대까지 전부 분석돼요.",
        route: "[보험 연결]에서 인증만 하면 끝나요. 연결되면 제가 바로 보장 공백 분석과 휴면보험금 점검을 해드릴게요.",
        guide: "보험 연결 화면을 지금 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://insurance/link", nav: "onboarding", title: "보험 통합조회 연결", desc: "인증 1회로 전 보험사 계약 자동 연결(1분)" },
    followup: function () { return { type: "notify", inDays: 3, message: "보험 연결, 아직이시죠? 1분 인증이면 휴면보험금 점검까지 바로 해드려요." }; },
    chips: ["보험 연결하기", "알림 받기"],
  },
  {
    id: "SEG-S3-02", sec: "S3", label: "휴면보험금 보유", def: "연동 결과 찾아가지 않은 휴면보험금 존재",
    when: function (s) { return s.s3.insLinked && s.s3.dormantAmt > 0; },
    intents: ["S3-DORMANT", "S3-HUB", "S3-LIST"], qpat: ["돈찾아준다", "숨은돈", "잠자는돈", "보험금놓친", "안찾아간돈"],
    q: ["휴면보험금 있다는데 어디서 봐?", "돈 찾아준다더니 어디 있어", "숨은 보험금 진짜 있어?", "휴면보험금 어떻게 받아", "안 찾아간 돈 보여줘", "잠자는 보험금 찾아줘", "휴면보험금 신청 도와줘", "보험금 놓친 거 있어?"],
    sarg: function (s) {
      return {
        situation: "네, 진짜 있어요 — 조회 결과 안 찾아가신 휴면보험금이 약 " + _won10(s.s3.dormantAmt) + " 확인돼요.",
        assess: "휴면보험금은 만기·해지 후 찾아가지 않은 돈이라, 신청만 하면 본인 계좌로 받을 수 있어요.",
        route: "[보험 → 휴면보험금]에서 내역을 확인하고 지급 신청을 하면 돼요 — 신청 절차는 제가 단계별로 같이 진행해 드릴게요.",
        guide: "휴면보험금 화면을 지금 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://insurance/dormant", nav: "insurance", title: "휴면보험금 확인·신청", desc: "안 찾아간 보험금 내역 확인 → 지급 신청" },
    followup: function () { return { type: "notify", inDays: 7, message: "휴면보험금 지급 신청, 잊지 않으셨죠? 신청까지 마쳐야 계좌로 들어와요 — 이어서 도와드릴게요." }; },
    chips: ["휴면보험금 화면 열기", "알림 받기"],
  },
  {
    id: "SEG-S3-03", sec: "S3", label: "연동 완료·공백분석 미실행", def: "보험은 연동됐는데 보장 공백 분석을 아직 안 돌림",
    when: function (s) { return s.s3.insLinked && !s.s3.gapDone; },
    intents: ["S3-GAP", "S3-HUB", "S3-LIST"], qpat: ["보장충분한지", "보험잘들었", "부족한지", "보험점검", "중복인것", "보장점수"],
    q: ["내 보험 잘 들어놓은 거야?", "보장 빠진 거 없어?", "보험 점검 좀 해줘", "내 보험 이대로 괜찮아?", "보장 공백 분석 안 했는데", "뭐가 부족한지 알려줘", "보험 중복인 것 같은데 봐줘", "보장 점수 알려줘"],
    sarg: function (s) {
      return {
        situation: "보험 " + _d(s.s3.contractCount) + "건이 연결돼 있는데, 보장 공백 분석은 아직 한 번도 안 돌렸어요.",
        assess: "연결까지 해두셨으니 1분이면 결과가 나와요 — 건강데이터와 겹쳐 보면 부족한 보장과 중복 가입이 한눈에 드러나요.",
        route: "\"보장 공백 분석해줘\" 한마디면 바로 실행돼요. 결과에서 우선 보완 항목과 예상 본인부담까지 보여드려요.",
        guide: "보장 공백 분석 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://insurance/gap", nav: "insurance", title: "보장 공백 분석", desc: "건강데이터 × 보험을 겹쳐 부족·중복 보장 진단" },
    followup: null,
    chips: ["보장 공백 분석", "내 보험 보여줘"],
  },
  {
    id: "SEG-S3-04", sec: "S3", label: "동기화 6개월 경과", def: "보험 연동 후 최종 동기화가 180일 초과",
    when: function (s) { return s.s3.insLinked && s.s3.syncAgeDays != null && s.s3.syncAgeDays > 180; },
    intents: ["S3-LIST", "S3-LINK", "S3-HUB"], qpat: ["보험최신", "새보험반영", "해지한보험", "보험목록업데이트", "다시연동", "동기화"],
    q: ["내 보험 목록 최신이야?", "새로 든 보험 반영됐어?", "보험 다시 연동해야 해?", "동기화 언제 했었지", "해지한 보험이 아직 보여", "보험 목록 업데이트해줘", "통합조회 다시 해줘", "보험 정보가 옛날 것 같아"],
    sarg: function (s) {
      return {
        situation: "보험 목록의 마지막 동기화가 " + Math.round((s.s3.syncAgeDays || 200) / 30) + "개월 전(" + _d(s.s3.lastSyncAt) + ")이에요.",
        assess: "그 사이 새로 가입하거나 해지한 계약이 있다면 지금 목록엔 반영 전이에요 — 재동기화 한 번이면 최신이 돼요.",
        route: "[보험 → 통합조회 갱신]에서 인증 한 번만 다시 하면 전 보험사 최신 내역으로 갱신돼요.",
        guide: "보험 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://insurance/link", nav: "onboarding", title: "통합조회 재동기화", desc: "인증 1회로 보험 목록을 최신으로 갱신" },
    followup: function () { return { type: "notify", inDays: 7, message: "보험 목록 갱신, 아직이시죠? 1분 인증이면 최신 내역으로 바뀌어요." }; },
    chips: ["보험 연결하기", "알림 받기"],
  },
  {
    id: "SEG-S3-05", sec: "S3", label: "실손 미가입", def: "연동 결과 실손의료보험이 없음",
    when: function (s) { return s.s3.insLinked && s.s3.silsonGen === "미가입"; },
    intents: ["S3-SILGEN", "S3-GAP"], qpat: ["실손없", "병원비많이", "치료비보장"],
    q: ["내 실손 몇 세대야 (미가입)", "나 실비 있어?", "실손 없으면 어떻게 돼?", "병원비 많이 나오면 어떡해", "실손 가입해야 해?", "실비 하나 들어야 하나", "치료비 보장 뭐 있어?", "실손 추천해줘"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 연결된 " + _d(s.s3.contractCount) + "건 중 실손의료보험이 없어요.",
        assess: "실손은 병원비의 기본 안전망이라, 없으면 치료비 전액이 본인 부담이 돼요. 지금은 4·5세대로만 신규 가입이 가능해요.",
        route: "① 보장 공백 분석으로 실손 외 보장도 함께 점검하고 ② 가입을 원하시면 맞춤보험 화면에서 상담으로 이어드려요 — 가입 여부 결정은 충분히 비교하신 뒤에 하세요.",
        guide: "보장 공백 분석 화면을 미리 보여드릴게요. ※ 실제 가입·인수는 보험사 심사에 따라요.",
      };
    },
    preview: { route: "app://insurance/gap", nav: "insurance", title: "보장 공백 분석", desc: "실손 부재 영향과 우선 보완 순서 확인" },
    followup: null,
    chips: ["보장 공백 분석", "맞춤보험 열어줘"],
  },
  {
    id: "SEG-S3-06", sec: "S3", label: "1·2세대 실손 보유", def: "구세대 실손 보유 — 전환 유불리 비교 대상",
    when: function (s) { return s.s3.insLinked && (s.s3.silsonGen === "1세대" || s.s3.silsonGen === "2세대"); },
    intents: ["S3-SILGEN", "S3-PREMIUM"], qpat: ["실손갈아타", "세대전환", "세대로바꾸", "얼마나싸"],
    q: ["내 실손 갈아타야 해?", "실손 전환하면 이득이야?", "1세대 실손 유지해야 해?", "실손 보험료 너무 비싸", "4세대로 바꾸면 얼마나 싸져?", "실손 전환 유불리 알려줘", "구실손 해지하면 안 되지?", "내 실손 몇 세대야"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 " + _d(s.s3.silsonGen) + " 실손을 보유 중이세요 — 보장은 두텁지만 보험료가 높은 세대예요.",
        assess: "전환은 '보험료↓ vs 자기부담↑'의 교환이라 정답이 없어요 — 병원 이용이 많으면 유지가, 적으면 전환이 유리한 경우가 많아요. 한 번 해지하면 재가입이 안 되니 신중해야 해요.",
        route: "유지 vs 전환의 월 보험료·자기부담 숫자 비교까지는 제가 보여드릴게요 — \"세대 전환 유불리\"라고 하시면 바로 계산해 드려요. 최종 결정은 비교표를 보신 뒤에 하세요.",
        guide: "실손 비교 화면을 미리 보여드릴게요. ※ 해지 여부를 제가 단정해 드리지는 않아요.",
      };
    },
    preview: { route: "app://insurance", nav: "insurance", title: "실손 세대 비교", desc: "유지 vs 전환 — 월 보험료·자기부담 숫자 비교" },
    followup: null,
    chips: ["세대 전환 유불리", "보험료 확인"],
  },
  {
    id: "SEG-S3-07", sec: "S3", label: "청구 진행 중", def: "보험금 청구가 접수되어 심사 진행 중",
    when: function (s) { return s.s3.insLinked && s.s3.claimActive; },
    intents: ["S3-CLAIM"], qpat: ["청구어떻게됐", "보험금언제나와", "심사", "청구한거", "청구취소", "입금됐"],
    q: ["보험금 청구 어떻게 됐어?", "청구한 거 언제 나와?", "심사 얼마나 걸려", "청구 진행상황 보여줘", "보험금 입금됐어?", "청구 서류 더 내야 해?", "심사 중이래 어떡해", "청구 취소할 수 있어?"],
    sarg: function (s) {
      return {
        situation: "지금 접수된 보험금 청구가 심사 진행 중이에요.",
        assess: "심사는 보통 접수 후 3영업일, 조사 건은 최대 10영업일까지 걸려요 — 추가 서류가 필요하면 보험사에서 먼저 연락이 와요.",
        route: "[보험 → 청구 내역]에서 진행 단계를 실시간으로 볼 수 있어요. 지연되면 제가 대신 확인해 드릴게요.",
        guide: "청구 내역 화면을 미리 보여드릴게요. 심사 결과가 나올 때쯤 알려드릴까요?",
      };
    },
    preview: { route: "app://insurance/claim", nav: "insurance", title: "청구 진행 현황", desc: "접수 → 심사 → 지급, 단계별 실시간 확인" },
    followup: function () { return { type: "notify", inDays: 3, message: "보험금 청구 심사 결과가 나올 시기예요 — 진행 상황을 확인해 드릴까요?" }; },
    chips: ["청구 내역 보기", "알림 받기"],
  },

  /* ───────── S4 건강금융지갑 ───────── */
  {
    id: "SEG-S4-01", sec: "S4", label: "HTK 소멸 임박(D-30)", def: "30일 이내 소멸 예정 HTK 보유",
    when: function (s) { return s.s4.expiringHtk > 0 && s.s4.expireInDays != null && s.s4.expireInDays <= 30; },
    intents: ["S4-EXPIRE", "S4-BAL", "S4-HUB", "S4-USE"], qpat: ["적립금없어진다", "소멸된다는데", "기한지나면", "소멸되나", "유효기간"],
    q: ["포인트 없어진다는데 어떡해?", "소멸 예정 포인트 얼마야", "HTK 언제까지 써야 해?", "포인트 사라지기 전에 뭐 하지", "소멸 막을 수 있어?", "기한 지나면 어떻게 돼", "포인트 유효기간 알려줘", "내 적립금 소멸돼?"],
    sarg: function (s) {
      return {
        situation: "서두르셔야 해요 — " + (s.s4.expiringHtk || 0).toLocaleString() + " HTK가 " + _d(s.s4.expireInDays) + "일 뒤 소멸 예정이에요.",
        assess: "HTK는 마지막 활동일로부터 5년이 지나면 순차 소멸돼요 — 다만 그 전에 쓰거나, 새 활동으로 갱신하면 지킬 수 있어요.",
        route: "① 건강쇼핑·검진 결제에 먼저 쓰면 오래된 포인트부터 차감돼요. ② 보험료 전용 적립(30%)으로 돌려두는 방법도 있어요.",
        guide: "사용처 화면을 지금 미리 보여드릴게요. 소멸 D-7에 한 번 더 알려드릴까요?",
      };
    },
    preview: { route: "app://wallet/use", nav: "wallet", title: "HTK 사용처", desc: "소멸 전 사용 — 쇼핑·검진·보험료 전용 적립" },
    followup: function (s) { return { type: "notify", inDays: Math.max(1, (s.s4.expireInDays || 8) - 7), message: "소멸 예정 HTK, 이제 7일 남았어요 — 오늘 쓰시면 오래된 포인트부터 지켜져요." }; },
    chips: ["사용처 보기", "알림 받기"],
  },
  {
    id: "SEG-S4-02", sec: "S4", label: "잔액 0(적립 시작 전)", def: "HTK 잔액이 0 — 적립 경험 없음",
    when: function (s) { return s.s4.balance === 0; },
    intents: ["S4-BAL", "S4-EARN", "S4-HUB"], qpat: ["적립금이없", "적립이안", "적립시작", "잔액이0", "적립금처음", "하나도없"],
    q: ["적립금 얼마 쌓였어? (0)", "왜 포인트가 하나도 없어", "포인트 어떻게 모아", "적립 시작하려면 뭐 해야 해", "HTK 처음인데 알려줘", "포인트 쌓는 법 알려줘", "적립이 안 되는 것 같아", "잔액이 0이야"],
    sarg: function (s) {
      return {
        situation: "지금 HTK 잔액이 0이에요 — 아직 적립 활동 전이시네요.",
        assess: "HTK는 12개 채널로 쌓여요 — 검진 예약·완료, 건강쇼핑, 일일 건강미션, 친구 초대, 가족 등록(+100)까지 전부 적립이에요.",
        route: "제일 빠른 시작은 ① 검진 예약(예약만 해도 적립) ② 친구 초대(가입 시 둘 다 100 HTK) ③ 오늘의 건강미션이에요.",
        guide: "적립 방법 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://wallet", nav: "wallet", title: "HTK 적립 시작", desc: "12개 적립 채널 — 검진·쇼핑·미션·초대" },
    followup: null,
    chips: ["적립 방법 알려줘", "검진 예약하기", "친구 초대해줘"],
  },
  {
    id: "SEG-S4-03", sec: "S4", label: "다음 등급 임박", def: "다음 멤버십 등급까지 필요 실적이 소액",
    when: function (s) { return s.s4.tier !== "VIP" && s.s4.tierNextNeed > 0 && s.s4.tierNextNeed <= 500; },
    intents: ["S4-TIER"], qpat: ["등급올리", "다음등급", "골드되려면", "승급", "등급어떻게"],
    q: ["내 등급 뭐야?", "다음 등급까지 얼마 남았어", "등급 어떻게 올려", "골드 되려면 뭐 해야 해", "등급 올라가면 뭐가 좋아", "멤버십 혜택 알려줘", "등급 실적 확인해줘", "승급 조건 알려줘"],
    sarg: function (s) {
      return {
        situation: "지금 " + _d(s.s4.tier) + " 등급인데, 다음 등급까지 딱 " + (s.s4.tierNextNeed || 0).toLocaleString() + " HTK 실적만 남았어요!",
        assess: "등급이 오르면 적립률과 검진 혜택이 커져요 — 지금 남은 실적이면 검진 예약 하나나 미션 며칠이면 충분해요.",
        route: "① 검진 예약·완료 적립 ② 일일 건강미션 ③ 가족 등록(+100 HTK) 중 편한 걸로 채우시면 돼요.",
        guide: "지갑 화면에서 등급 게이지를 미리 보여드릴게요. 승급하면 제가 먼저 축하 알림 드릴까요?",
      };
    },
    preview: { route: "app://wallet", nav: "wallet", title: "멤버십 등급 현황", desc: "등급 게이지·남은 실적·등급별 혜택" },
    followup: function () { return { type: "notify", inDays: 14, message: "등급 실적 마감이 다가와요 — 남은 실적을 채우면 승급 혜택이 열려요!" }; },
    chips: ["적립 방법 알려줘", "알림 받기"],
  },
  {
    id: "SEG-S4-04", sec: "S4", label: "잔액 보유·미사용", def: "잔액이 충분한데 사용 경험이 없음",
    when: function (s) { return s.s4.balance >= 5000 && s.s4.topupCount === 0; },
    intents: ["S4-USE", "S4-BAL", "S4-HUB"], qpat: ["적립금어디다써", "어디에써", "적립금활용", "이대로둬도", "쇼핑에쓸", "검진비로", "보험료로쓸", "뭐사는게"],
    q: ["포인트 쌓였는데 어디에 써?", "HTK 쓸 데 알려줘", "적립금 이대로 둬도 돼?", "포인트 뭐 사는 게 좋아", "쇼핑에 쓸 수 있어?", "검진비로 낼 수 있어?", "보험료로 쓸 수 있다며", "포인트 활용법 알려줘"],
    sarg: function (s) {
      return {
        situation: "지금 " + (s.s4.balance || 0).toLocaleString() + " HTK(약 " + _won10((s.s4.balance || 0) * 10) + " 상당)가 쌓여 있는데 아직 써보신 적이 없네요.",
        assess: "HTK는 건강쇼핑·검진 결제·보험료(전용 적립 30%)·주식 청약에 쓸 수 있어요 — 쓰면 오래된 적립분부터 차감돼서 소멸 걱정도 줄어요.",
        route: "건강쇼핑에서 검진 결과 맞춤 상품을 사면 마진의 50%가 다시 적립되는 순환이라 가장 알뜰해요.",
        guide: "사용처 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://wallet/use", nav: "wallet", title: "HTK 사용처", desc: "쇼핑·검진·보험료·청약 — 쓰면 다시 적립되는 순환" },
    followup: null,
    chips: ["사용처 보기", "건강쇼핑 가기"],
  },
  {
    id: "SEG-S4-05", sec: "S4", label: "충전 경험자", def: "충전 이력 보유 — 환불·한도 안내 대상", passive: true,
    when: function (s) { return s.s4.topupCount > 0; },
    intents: ["S4-REFUND", "S4-CHARGE"], qpat: ["충전환불", "충전내역", "보너스도환불", "환불규정", "환불언제", "환불되나", "환불돼", "충전취소", "충전한도"],
    q: ["충전한 거 환불돼?", "충전 내역 보여줘", "충전 한도 얼마야", "보너스 포인트도 환불돼?", "충전 또 하고 싶어", "환불 언제 들어와?", "충전 취소하고 싶어", "환불 규정 알려줘"],
    sarg: function (s) {
      return {
        situation: "충전 이력이 " + _d(s.s4.topupCount) + "건 있으시네요 — 충전·환불 규정을 정확히 알려드릴게요.",
        assess: "충전분은 보너스를 제외한 미사용분을 환불받을 수 있어요. 환불은 결제수단으로 3~5영업일 안에 들어와요. 한도는 1회 100만·월 200만 원이에요.",
        route: "[지갑 → 충전 탭 → 주문 내역]에서 환불 신청이 바로 되고, 진행 상태도 거기서 확인돼요.",
        guide: "충전 탭을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://wallet/topup", nav: "wallet", title: "충전 · 주문 내역", desc: "충전·환불 신청과 진행 상태 확인" },
    followup: null,
    chips: ["충전하러 가기", "적립 내역 보기"],
  },

  /* ───────── S8 초대·혜택 ───────── */
  {
    id: "SEG-S8-01", sec: "S8", label: "미지급 초대 보상", def: "초대 전환 보상 중 아직 지급되지 않은 몫 존재",
    when: function (s) { return s.s8.unpaidReward > 0; },
    intents: ["S8-REWARD", "S8-STAT", "S8-HOW"], qpat: ["보상안들어", "보상어디", "보상언제", "리워드지급", "보상누락", "안들어와", "미지급", "초대적립금"],
    q: ["초대 보상 안 들어왔어", "친구 가입했는데 보상 어디 있어?", "보상 언제 들어와", "초대 포인트 왜 없어", "미지급 보상 확인해줘", "친구 검진했는데 300 안 들어와", "리워드 지급해줘", "보상 누락된 것 같아"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 아직 지급 대기 중인 초대 보상 " + (s.s8.unpaidReward || 0).toLocaleString() + " HTK가 있어요.",
        assess: "가입 보상(100 HTK)은 친구가 본인인증까지 마쳐야, 검진 보상(+300 HTK)은 친구의 검진 완료가 확인돼야 지급돼요 — 확인되면 자동으로 들어와요.",
        route: "[지갑 → 친구 초대 현황]에서 친구별 진행 단계(가입→인증→검진)를 볼 수 있어요. 조건이 다 찼는데 안 들어왔다면 제가 바로 접수해 드릴게요.",
        guide: "초대 현황 화면을 미리 보여드릴게요. 지급되면 알림 드릴까요?",
      };
    },
    preview: { route: "app://invite", nav: "wallet", title: "초대 현황·보상", desc: "친구별 진행 단계와 보상 지급 상태 확인" },
    followup: function () { return { type: "notify", inDays: 3, message: "초대 보상 지급 여부를 다시 확인할 시점이에요 — 아직 안 들어왔다면 제가 접수해 드릴게요." }; },
    chips: ["초대 현황 보여줘", "알림 받기"],
  },
  {
    id: "SEG-S8-02", sec: "S8", label: "초대했지만 전환 0", def: "초대는 보냈는데 가입 전환이 없음",
    when: function (s) { return s.s8.invited > 0 && s.s8.joined === 0; },
    intents: ["S8-STAT", "S8-HOW", "S8-REWARD"], qpat: ["친구가입안", "초대했는데", "가입안했나", "링크갔는지", "가입한친구"],
    q: ["친구 초대했는데 왜 보상 없어?", "초대 현황 보여줘 (전환 0)", "친구가 가입 안 했나 봐", "초대 링크 다시 보내줘", "친구한테 링크 갔는지 확인돼?", "초대 몇 명 했지?", "가입한 친구 없어?", "초대 링크 안 눌렀나"],
    sarg: function (s) {
      return {
        situation: "지금까지 " + _d(s.s8.invited) + "명을 초대하셨는데 아직 가입까지 이어진 친구는 없어요.",
        assess: "보상(둘 다 100 HTK)은 친구가 내 링크로 '가입 완료'해야 지급돼요 — 링크만 받고 가입 전이면 아직 카운트가 안 돼요.",
        route: "① 초대 링크를 다시 만들어 보내드릴게요(코드가 심겨 있어야 인정돼요). ② 가족 단톡방·모임방이 전환율이 제일 좋아요 — 가족은 등록만 해도 +100 HTK예요.",
        guide: "초대 현황 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://invite", nav: "wallet", title: "친구 초대 현황", desc: "초대·가입·검진 단계별 현황과 링크 재발급" },
    followup: null,
    chips: ["친구 초대해줘", "초대 현황 보여줘"],
  },
  {
    id: "SEG-S8-03", sec: "S8", label: "신규 가입·코드 미사용", def: "가입 30일 이내인데 추천코드 없이 가입함",
    when: function (s) { return s.member.joinDays <= 30 && !s.s8.codeUsed; },
    intents: ["S8-CODE"], qpat: ["코드나중에", "코드깜빡", "코드못넣", "코드소급", "소급적용", "코드넣으면", "코드입력", "코드등록"],
    q: ["가입할 때 코드 못 넣었는데 지금 돼?", "추천코드 나중에 입력 돼?", "친구 코드 깜빡했어", "코드 소급 적용해줘", "지금이라도 코드 넣으면 보상 줘?", "추천코드 어디에 입력해", "코드 입력 기한 있어?", "가입 후 코드 등록 방법"],
    sarg: function (s) {
      return {
        situation: "가입하신 지 " + _d(s.member.joinDays) + "일째인데 추천코드 없이 가입하셨네요.",
        assess: "아쉽지만 추천코드는 가입 시점에만 인정돼서 소급 입력은 안 돼요 — 대신 지금부터 받을 수 있는 혜택이 더 커요.",
        route: "① 내가 초대하는 쪽이 되면 친구마다 100 HTK(검진 완료 시 +300)를 받아요. ② 가족 등록도 +100 HTK예요.",
        guide: "초대 화면을 미리 보여드릴게요 — 내 코드가 심긴 링크를 바로 만들어 드려요.",
      };
    },
    preview: { route: "app://invite", nav: "wallet", title: "내 초대 코드", desc: "내 코드 링크 생성 — 친구·가족 초대 보상" },
    followup: null,
    chips: ["친구 초대해줘", "어머니 82세 추가해줘"],
  },
  {
    id: "SEG-S8-04", sec: "S8", label: "초대 경험 없음", def: "초대를 한 번도 해보지 않음",
    when: function (s) { return s.s8.invited === 0; },
    intents: ["S8-HOW", "S8-REWARD", "S8-STAT", "S8-EVENT"], qpat: ["추천하면", "데려오면", "초대하면뭐"],
    q: ["친구 초대하면 뭐 줘?", "초대 어떻게 해", "초대 링크 만들어줘", "추천하면 얼마 받아", "친구 데려오면 혜택 있어?", "초대 이벤트 하고 있어?", "지인 추천 방법 알려줘", "초대 보상 알려줘"],
    sarg: function (s) {
      return {
        situation: "아직 초대를 시작 전이시네요 — 지금 시작하면 보상이 바로 열려요.",
        assess: "친구가 내 코드로 가입하면 둘 다 100 HTK, 친구가 첫 검진을 마치면 +300 HTK가 더 들어와요. 가족 등록도 +100 HTK예요(직접 추천 1단계만, 다단계 아님).",
        route: "\"친구 초대해줘\" 한마디면 코드가 심긴 링크를 만들어 복사까지 해드려요 — 붙여넣기만 하면 끝이에요.",
        guide: "초대 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://invite", nav: "wallet", title: "친구 초대", desc: "링크 1개로 나도 친구도 100 HTK — 검진 완료 시 +300" },
    followup: null,
    chips: ["친구 초대해줘"],
  },

  /* ───────── S2 건강분석 ───────── */
  {
    id: "SEG-S2-01", sec: "S2", label: "부분 데이터(생체나이 불가)", def: "데이터 범위가 '부분'이라 생체나이 산출 불가",
    when: function (s) { return s.s2.dataScope === "partial" && !s.s2.bioAgeReady; },
    intents: ["S1-BIO", "S2-REPORT"], qpat: ["생체나이왜안", "몸나이안나", "장기나이", "다른사람은나온", "생체나이가없"],
    q: ["내 생체나이 왜 안 나와?", "몸 나이 알려줘 (부분 데이터)", "노화속도 보고 싶은데", "생체나이 계산 안 된대", "리포트에 생체나이가 없어", "다른 사람은 나온다는데", "생체나이 보려면 뭐 해야 해", "장기 나이도 보고 싶어"],
    sarg: function (s) {
      return {
        situation: "지금 연결된 데이터가 일부 항목뿐이라 생체나이 계산에 필요한 수치가 부족해요.",
        assess: "생체나이는 혈액·간·신장 등 여러 수치를 조합해 계산해서, 결과지 원본이 연결돼야 정확히 나와요.",
        route: "결과지(사진·PDF)를 올려 주시면 전체 항목이 채워지고 생체나이·장기나이·노화속도까지 한 번에 계산돼요.",
        guide: "업로드 화면을 미리 보여드릴게요 — 올리는 즉시 리포트가 완성돼요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "결과지 업로드", desc: "전체 항목 연결 → 생체나이·장기나이 산출" },
    followup: function () { return { type: "notify", inDays: 5, message: "생체나이 리포트, 결과지 한 장이면 완성돼요 — 업로드를 도와드릴까요?" }; },
    chips: ["검진결과 올리기", "알림 받기"],
  },
  {
    id: "SEG-S2-02", sec: "S2", label: "추이 데이터 부족(1개년)", def: "데이터가 1개년뿐이라 연도별 비교 불가",
    when: function (s) { return s.s5.anyLink && s.s2.trendYears < 2; },
    intents: ["S2-TREND"], qpat: ["비교할게없", "작년데이터없", "변화추적", "추적하고싶", "비교안돼", "비교분석왜"],
    q: ["작년이랑 비교해줘 (1개년)", "추이 보여줘 (데이터 부족)", "좋아지고 있는지 알고 싶어", "과거랑 비교 안 돼?", "변화 추적하고 싶어", "작년 결과가 없대", "비교 분석 왜 안 돼", "연도별 그래프 보고 싶어"],
    sarg: function (s) {
      return {
        situation: "지금은 " + _d(s.s2.trendYears) + "개년 데이터만 있어서 연도별 비교가 아직 안 돼요.",
        assess: "비교에는 2개년 이상이 필요해요 — 과거 결과지를 올리거나 공단 연계(최근 10년 이력)를 켜면 바로 채워져요.",
        route: "① 서랍 속 과거 결과지가 있다면 사진으로 올려 주세요. ② 없다면 공단 조회 인증 한 번으로 과거 국가검진 이력이 들어와요.",
        guide: "데이터 연결 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://data/link", nav: "onboarding", title: "과거 데이터 연결", desc: "과거 결과지·공단 이력으로 추이 분석 완성" },
    followup: null,
    chips: ["과거 검진 올리기", "공단 조회 할래요"],
  },
  {
    id: "SEG-S2-03", sec: "S2", label: "분석 준비 완료·미열람", def: "전체 데이터가 연결돼 리포트가 준비됨(1단계 실수치 답변 유지)", passive: true,
    when: function (s) { return s.s2.bioAgeReady; },
    intents: ["S2-REPORT", "S1-BIO"], qpat: ["분석결과요약", "관리뭐부터", "위험한거있", "리포트새로"],
    q: ["내 건강 리포트 보여줘", "생체나이 알려줘", "내 건강 상태 어때?", "분석 결과 요약해줘", "위험한 거 있어?", "관리 뭐부터 해야 해", "내 몸 나이 몇 살이야", "리포트 새로 나왔어?"],
    sarg: function (s) {
      return {
        situation: "데이터가 전부 연결돼 있어서 리포트가 준비돼 있어요 — 바로 요약해 드릴게요.",
        assess: "생체나이·장기나이·암위험 등급·예상 의료비까지 내 실제 수치 기준으로 계산돼 있어요.",
        route: "\"내 리포트 요약\"이라고 하시면 핵심만 3문장으로 정리해 드리고, 항목별 상세는 화면에서 이어 볼 수 있어요.",
        guide: "리포트 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://health/report", nav: "manage", title: "내 건강 리포트", desc: "생체나이·위험도·의료비 예측 — 내 수치 기준" },
    followup: null,
    chips: ["내 리포트 요약", "암 위험은?"],
  },

  /* ───────── S6 가족 ───────── */
  {
    id: "SEG-S6-01", sec: "S6", label: "가족 미등록", def: "등록된 가족이 없음",
    when: function (s) { return s.s6.familyCount === 0; },
    intents: ["S6-HUB", "S6-VIEW", "S6-CKUP", "S6-ADD", "S6-REWARD"], qpat: ["가족없", "가족등록안", "부모님건강", "가족기능", "가족추가하면"],
    q: ["가족 건강 보여줘 (미등록)", "엄마 검진 챙겨줘 (미등록)", "가족 등록 어떻게 해", "가족 추가하면 뭐가 좋아", "부모님 건강 관리하고 싶어", "가족 초대 어떻게 해", "아내 건강도 볼 수 있어?", "가족 기능 알려줘"],
    sarg: function (s) {
      return {
        situation: "아직 등록된 가족이 없어서 가족 건강 화면이 비어 있어요.",
        assess: "가족을 등록하면(본인 동의 기반) 검진 일정 챙기기·보장 현황·응급 안내까지 한 화면에서 함께 볼 수 있어요 — 등록 보상 +100 HTK도 있어요.",
        route: "\"어머니 82세 추가해줘\"처럼 관계와 나이만 말씀하시면 등록이 바로 끝나요.",
        guide: "우리가족건강관리 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://family", nav: "mypage", title: "우리가족건강관리", desc: "가족 등록 → 건강·보장·검진 일정 함께 보기" },
    followup: null,
    chips: ["어머니 82세 추가해줘", "아내 51세 추가해줘"],
  },
  {
    id: "SEG-S6-02", sec: "S6", label: "가족 데이터 미연결", def: "가족은 등록됐지만 데이터 연결·동의가 없는 가족 존재",
    when: function (s) { return s.s6.familyCount > 0 && s.s6.famLinkedCount < s.s6.familyCount; },
    intents: ["S6-VIEW", "S6-HUB"], qpat: ["가족데이터안보", "가족결과안보", "가족검진결과", "엄마데이터", "아빠데이터", "아버지결과", "어머니결과", "가족동의", "가족분석", "가족데이터연결", "가족건강상태", "남편검진기록", "아내검진기록"],
    q: ["가족 검진 결과가 안 보여", "엄마 데이터 왜 없어?", "가족 건강 상태 보여줘 (미연결)", "아버지 결과 연결해줘", "가족 동의 어떻게 받아", "가족 데이터 연결 방법", "남편 검진 기록 보고 싶어", "가족 분석도 돼?"],
    sarg: function (s) {
      return {
        situation: "가족 " + _d(s.s6.familyCount) + "명이 등록돼 있는데, 그중 " + _d(s.s6.familyCount - s.s6.famLinkedCount) + "명은 아직 데이터 연결(본인 동의) 전이에요.",
        assess: "가족 건강 데이터는 그 가족 본인의 동의가 있어야 보여요 — 동의 요청을 보내고 수락하면 바로 연결돼요.",
        route: "[우리가족건강관리]에서 해당 가족 카드의 '데이터 연결 요청'을 누르면 초대·동의 링크가 전송돼요. 가족이 결과지를 직접 올려도 돼요.",
        guide: "가족 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://family", nav: "mypage", title: "가족 데이터 연결", desc: "가족 동의 요청 → 건강·보장 함께 보기" },
    followup: function () { return { type: "notify", inDays: 7, message: "가족 데이터 연결 동의, 아직 응답이 없다면 다시 한 번 요청해 보세요 — 제가 도와드릴게요." }; },
    chips: ["가족 화면 열기", "알림 받기"],
  },
  {
    id: "SEG-S6-03", sec: "S6", label: "가족 검진 예정·미수검", def: "등록 가족 중 올해 검진 예정이거나 미수검자 존재",
    when: function (s) { return s.s6.famCheckupDue > 0; },
    intents: ["S6-CKUP", "S6-VIEW", "S6-HUB"], qpat: ["가족검진챙", "부모님검진", "검진안받은사람", "가족검진일정", "가족검진현황", "엄마검진", "아빠검진", "어머니검진", "아버지검진", "아버지국가검진", "어머니국가검진", "가족검진알림"],
    q: ["가족 검진 챙겨줘", "부모님 검진 언제 받아야 해", "가족 중에 검진 안 받은 사람 있어?", "엄마 검진 예약해줘", "가족 검진 일정 보여줘", "아버지 국가검진 대상이야?", "가족 검진 알림 걸어줘", "우리 가족 검진 현황 알려줘"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 등록 가족 중 " + _d(s.s6.famCheckupDue) + "명이 올해 검진을 아직 안 받으셨어요.",
        assess: "가족 검진은 미루기 쉬워서 함께 챙기는 게 제일 효과적이에요 — 국가검진 대상이면 본인부담 0원이에요.",
        route: "① 가족 화면에서 누가 미수검인지 확인하고 ② \"엄마 검진 예약 도와줘\"라고 하시면 대상 확인부터 예약 안내까지 이어드려요.",
        guide: "가족 검진 현황을 미리 보여드릴게요. 가족 검진일이 잡히면 저도 같이 챙길게요.",
      };
    },
    preview: { route: "app://family", nav: "mypage", title: "가족 검진 현황", desc: "가족별 수검 여부·국가검진 대상 확인" },
    followup: function () { return { type: "notify", inDays: 14, message: "가족 검진, 아직 예약 전이죠? 함께 챙겨드릴게요 — 대상 확인부터 시작해요." }; },
    chips: ["가족 화면 열기", "알림 받기"],
  },

  /* ───────── S7 Health NFT ───────── */
  {
    id: "SEG-S7-01", sec: "S7", label: "발급 조건 미충족", def: "검진 예약·완료 이력이 없어 NFT 발급 전",
    when: function (s) { return !s.s7.nftEligible && s.s7.nftCount === 0; },
    intents: ["S7-VIEW", "S7-COND", "S7-WHAT"], qpat: ["nft없", "nft왜없", "증서발급", "nft받고싶", "nft어떻게받", "nft언제생"],
    q: ["내 NFT 보여줘 (없음)", "NFT 왜 하나도 없어?", "NFT 어떻게 받아", "발급 조건이 뭐야", "NFT 받고 싶어", "증서 발급해줘", "다른 사람은 NFT 있던데", "NFT 언제 생겨?"],
    sarg: function (s) {
      return {
        situation: "아직 보유하신 Health NFT가 없어요 — 발급 조건(검진 예약·완료)을 아직 안 밟으셨거든요.",
        assess: "NFT 증서는 검진 예약(검진대비보험 증서), 검진 완료, 주요 건강 기록 달성 때 자동 발급돼요 — 따로 신청할 건 없어요.",
        route: "제일 빠른 길은 검진 예약이에요 — 예약하는 순간 검진대비보험 증서 NFT가 첫 번째로 발급돼요.",
        guide: "NFT 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://nft", nav: "nft", title: "Health NFT", desc: "검진 예약·완료 시 자동 발급되는 건강 증서(SBT)" },
    followup: null,
    chips: ["검진 예약하기", "NFT가 뭐예요?"],
  },
  {
    id: "SEG-S7-02", sec: "S7", label: "조건 충족·미발급 확인", def: "검진 예약·수검 이력이 있어 발급 대상인데 보유 0",
    when: function (s) { return s.s7.nftEligible && s.s7.nftCount === 0; },
    intents: ["S7-VIEW", "S7-COND"], qpat: ["nft안나왔", "증서안보", "증서어디있", "발급확인", "발급됐는지", "지급누락", "증서없", "검진증서", "증서찾", "다시발급", "예약했는데증서"],
    q: ["검진 했는데 NFT 안 나왔어", "증서 어디 있어?", "NFT 발급 확인해줘", "예약했는데 증서 없어", "NFT 지급 누락 아니야?", "발급됐는지 봐줘", "증서 다시 발급돼?", "내 검진 증서 찾아줘"],
    sarg: function (s) {
      return {
        situation: "검진 이력이 있어서 발급 대상인데 지갑에 NFT가 안 보이시는 상황이네요.",
        assess: "발급은 보통 예약·완료 즉시인데, 데이터 반영에 시간이 걸리는 경우가 있어요 — 데이터 금고의 증서 기록과 대조하면 바로 확인돼요.",
        route: "[Health NFT] 화면에서 새로고침 후에도 없다면 제가 발급 이력을 확인해서 접수해 드릴게요.",
        guide: "NFT 화면을 미리 보여드릴게요. 발급 확인되면 알림 드릴까요?",
      };
    },
    preview: { route: "app://nft", nav: "nft", title: "내 Health NFT", desc: "발급 이력 확인 — 검진보험 증서·건강 기록 증명" },
    followup: function () { return { type: "notify", inDays: 1, message: "NFT 발급 확인 결과를 알려드릴 시간이에요 — 지갑에 들어왔는지 함께 확인해요." }; },
    chips: ["내 NFT 보여줘", "알림 받기"],
  },
  {
    id: "SEG-S7-03", sec: "S7", label: "NFT 보유·활용 안내", def: "NFT를 보유 중 — 활용처 안내 대상", passive: true,
    when: function (s) { return s.s7.nftCount > 0; },
    intents: ["S7-USE", "S7-VIEW", "S7-WHAT"], qpat: ["증서보여", "증서어디에쓰", "증서몇개", "nft양도", "청구에쓸수있다"],
    q: ["내 NFT 뭐에 써?", "NFT 팔 수 있어?", "증서 어디에 쓰는 거야", "NFT 활용법 알려줘", "보험 청구에 쓸 수 있다며", "NFT 몇 개 있어?", "증서 보여줘", "NFT 양도 돼?"],
    sarg: function (s) {
      return {
        situation: "지금 Health NFT " + _d(s.s7.nftCount) + "개를 보유 중이세요.",
        assess: "이 증서는 보험 청구 증빙·건강 이력 증명에 쓰여요 — 사고팔 수 없는 소울바운드(SBT)라 오직 내 건강 자산 증명이에요.",
        route: "보험금 청구 때 증빙으로 자동 첨부되고, 검진 이력 증명이 필요할 때 화면에서 바로 보여줄 수 있어요.",
        guide: "NFT 보관함을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://nft", nav: "nft", title: "내 Health NFT 보관함", desc: "보유 증서 확인 — 청구 증빙·이력 증명에 활용" },
    followup: null,
    chips: ["내 NFT 보여줘", "보험금 청구 어떻게 해?"],
  },

  /* ───────── S9 계정·설정 ───────── */
  {
    id: "SEG-S9-01", sec: "S9", label: "본인인증 미완료", def: "본인인증 전이라 연동·청구 기능 제한",
    when: function (s) { return !s.s9.certified; },
    intents: ["S9-LOGIN", "S3-LINK", "S5-NHIS"], qpat: ["인증안했", "인증하라", "인증왜자꾸", "인증안하면", "인증나중에"],
    q: ["본인인증 하라는데 왜?", "인증 안 하면 뭐가 안 돼?", "본인인증 어떻게 해", "인증 나중에 해도 돼?", "휴대폰 인증 안 되는데", "인증 왜 자꾸 뜨는 거야", "실명인증 필요해?", "인증 화면 열어줘"],
    sarg: function (s) {
      return {
        situation: "계정이 아직 본인인증 전이라 공단 연계·보험 통합조회·청구 같은 핵심 기능이 잠겨 있어요.",
        assess: "건강·보험 데이터는 본인 확인이 법적으로 필요해서예요 — 휴대폰 인증 한 번(1분)이면 전부 열려요.",
        route: "[계정 설정 → 본인인증]에서 휴대폰 인증만 하면 돼요. 끝나면 데이터 연결부터 이어서 도와드릴게요.",
        guide: "인증 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://support", nav: null, title: "본인인증", desc: "휴대폰 인증 1분 — 연동·청구 기능 잠금 해제" },
    followup: function () { return { type: "notify", inDays: 2, message: "본인인증, 아직이시죠? 1분이면 모든 기능이 열려요 — 지금 도와드릴까요?" }; },
    chips: ["인증 화면 열기", "알림 받기"],
  },
  {
    id: "SEG-S9-02", sec: "S9", label: "알림 꺼짐", def: "알림 수신이 꺼져 있어 중요 알림(소멸·결과)을 놓칠 수 있음",
    when: function (s) { return !s.s9.notiOn; },
    intents: ["S9-NOTI"], qpat: ["알림안와", "알림꺼", "알림못받", "알림왜안", "알림안오", "소멸알림", "푸시설정", "알림다시켜"],
    q: ["알림이 안 와", "알림 왜 안 오지?", "알림 켜는 법 알려줘", "중요한 알림만 받고 싶어", "푸시 설정 어떻게 해", "알림 다시 켜줘", "검진 알림 못 받았어", "소멸 알림 못 봤는데"],
    sarg: function (s) {
      return {
        situation: "확인해 보니 알림 수신이 꺼져 있어요 — 그래서 소멸 예정 포인트·검진 결과 같은 중요 소식을 못 받고 계셨어요.",
        assess: "알림은 종류별로 따로 설정돼요 — 중요 알림(검진·소멸·청구)만 켜고 마케팅은 끈 상태로 둘 수도 있어요.",
        route: "\"알림 켜줘\"라고 하시면 중요 알림만 켜드릴게요. 세부 조정은 동의관리 화면에서 종류별로 할 수 있어요.",
        guide: "알림 설정 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://support", nav: null, title: "알림 설정", desc: "중요 알림(검진·소멸·청구)만 선택 수신" },
    followup: null,
    chips: ["알림 켜줘", "동의관리 가기"],
  },
  {
    id: "SEG-S9-03", sec: "S9", label: "최근 로그인 이슈", def: "최근 로그인 실패·잠김 이력 존재",
    when: function (s) { return s.s9.loginIssue; },
    intents: ["S9-LOGIN"], qpat: ["로그인안돼", "계정잠", "비밀번호계속틀", "로그인이력", "로그인기록", "계정들어왔", "계정안전"],
    q: ["로그인이 안 됐었어", "계정 잠겼는데 풀렸어?", "비밀번호 계속 틀렸어", "로그인 이력 확인해줘", "누가 내 계정 들어왔어?", "비번 바꿔야 하나", "로그인 기록 보여줘", "계정 안전해?"],
    sarg: function (s) {
      return {
        situation: "최근 로그인 실패 이력이 있어요 — 혹시 직접 시도하신 게 맞는지 먼저 확인해 주세요.",
        assess: "5회 오류 시 10분 잠김은 계정 보호 장치예요. 본인이 아니라면 비밀번호 변경을 권해요 — 접속 기록은 전부 남아 있어요.",
        route: "① [접근 기록]에서 언제·어디서 시도됐는지 확인하고 ② 의심되면 비밀번호를 바꾸세요. 계속 문제면 사람 상담으로 이어드려요.",
        guide: "접근 기록 화면을 미리 보여드릴게요.",
      };
    },
    preview: { route: "app://vault", nav: "mywallet", title: "접근 기록", desc: "내 계정·데이터 접근 이력 전체 확인" },
    followup: null,
    chips: ["접근 이력 보기", "사람 상담 연결"],
  },
  {
    id: "SEG-S9-04", sec: "S9", label: "고령·쉬운말 모드 미사용", def: "70세 이상인데 쉬운말 모드를 켜지 않음",
    when: function (s) { return s.member.age >= 70 && !s.s9.easyMode; },
    intents: ["S9-EASY"], qpat: ["글씨작", "어렵게말", "글씨가너무", "너무작아", "말이어려", "쉽게설명", "크게해줘", "잘안보여", "쉽게말해", "노인모드", "시니어모드"],
    q: ["글씨가 너무 작아", "말이 어려워", "쉽게 설명해줘", "글자 크게 해줘", "화면이 잘 안 보여", "노인 모드 있어?", "더 쉽게 말해줘", "큰 글씨로 바꿔줘"],
    sarg: function (s) {
      return {
        situation: "글씨나 설명이 불편하셨다면 죄송해요 — 쉬운 말 모드가 아직 꺼져 있네요.",
        assess: "쉬운 말 모드를 켜면 글씨가 커지고, 제 설명도 어려운 낱말 없이 더 쉬워져요 — 언제든 다시 끌 수 있어요.",
        route: "\"쉬운 말 모드 켜기\" 버튼만 누르시면 바로 바뀌어요.",
        guide: "지금 바로 켜드릴까요?",
      };
    },
    preview: { route: "app://support", nav: null, title: "쉬운 말 모드", desc: "큰 글씨 + 쉬운 설명으로 전환" },
    followup: null,
    chips: ["쉬운 말 모드 켜기"],
  },
];

/* 세그먼트 조회 헬퍼 — 마이닝·검증·런타임 공용 */
function hiSegmentsOf(sec) { return HI_SEGMENTS.filter(function (g) { return g.sec === sec; }); }
function hiSegMatchAll(snapshot) { return HI_SEGMENTS.filter(function (g) { try { return !!g.when(snapshot); } catch (e) { return false; } }); }
