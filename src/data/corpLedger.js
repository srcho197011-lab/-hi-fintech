/* ══════════════ 회계 엔진 — 실적 축(corpLedger.js) · CorpOps Phase 5 (조성래님 지시 2026-11-11) ══════════════
   재무「계획」축은 finBudget.js가 갖는다. 이 파일은 **실제로 일어난 거래**를 적는 장부다.
   두 축을 한 파일에 두지 않는다 — 계획과 실적이 같은 숫자처럼 보이는 순간 둘 다 못 믿게 된다.

   ⚠️ 여기 실린 전표는 **실제 장부**다(조성래님 확정 2026-11-15) — 검증용이 아니다.
      반입 전표가 들어오면 그쪽을 보고, 없으면 여기 실린 것을 본다.

   원칙
     · 차변 합 ≠ 대변 합이면 **저장하지 않는다**. 경고가 아니라 거부다.
     · 전기(posted)된 전표는 고치지 않는다. 정정은 역분개 전표로만 남긴다 — 지운 자국이 남아야 장부다.
     · 작성자 ≠ 승인자. AI(핀테크)는 기표까지만 하고 승인 버튼을 누르지 못한다.
     · 마감한 달에는 새 전표가 들어가지 않는다.
     · 항등식은 화면과 러너가 **같은 함수**(corpLedgerIdentities)를 쓴다. 두 벌로 적으면 한 벌이 먼저 거짓말한다.
     · 클라이언트 강제다 — 서버가 없으므로 권한을 서버에서 막지 못한다. 화면에도 그렇게 적는다. */

const CORP_LEDGER_KEY = "hifin_corp_ledger"; /* dataCatalog.js 등재 필수 */

/* ── ① 계정과목 — **하이젠케어(주) 실제 계정과목** ────────────────────────
   원천: 세성세무법인 날인 재무제표확인원
     · 제1기 2025.12.31 (2026-04-29 확인)
     · 제2기 2026.09.30 (2026-10-23 확인)
   코드는 전산회계 표준 대역을 따른다. **과목명은 확인원 그대로** 쓴다 —
   이름을 바꾸면 확인원과 대조할 때 사람이 한 번 더 번역해야 하고, 거기서 틀린다.

   t: A 자산 · L 부채 · E 자본 · R 수익 · X 비용
   d: 정상잔액 방향(D 차변 / C 대변) — 표시에만 쓴다. 집계는 부호(차−대)로 한다.
   contra: 차감 계정(감가상각누계액) — 자산이지만 정상잔액이 대변이다.
   fs: 확인원의 분류(화면이 재무제표를 확인원과 같은 꼴로 세운다) */
const CORP_ACCT = [
  /* 당좌자산 */
  { c: "101", n: "현금",              t: "A", d: "D", fs: "당좌자산" },
  { c: "103", n: "보통예금",          t: "A", d: "D", fs: "당좌자산", bank: true },
  { c: "108", n: "외상매출금",        t: "A", d: "D", fs: "당좌자산" },
  { c: "114", n: "미수금",            t: "A", d: "D", fs: "당좌자산" },
  { c: "131", n: "선급금",            t: "A", d: "D", fs: "당좌자산" },
  { c: "134", n: "가지급금",          t: "A", d: "D", fs: "당좌자산" },
  { c: "135", n: "부가세대급금",       t: "A", d: "D", fs: "당좌자산" },
  /* 재고자산 */
  { c: "146", n: "상품",              t: "A", d: "D", fs: "재고자산" },
  /* 유형자산 */
  { c: "212", n: "비품",              t: "A", d: "D", fs: "유형자산" },
  { c: "213", n: "감가상각누계액",     t: "A", d: "C", fs: "유형자산", contra: true },
  /* 무형자산 */
  { c: "226", n: "개발비",            t: "A", d: "D", fs: "무형자산" },
  /* 기타비유동자산 */
  { c: "232", n: "임차보증금",        t: "A", d: "D", fs: "기타비유동자산" },

  /* 유동부채 */
  { c: "251", n: "외상매입금",        t: "L", d: "C", fs: "유동부채" },
  { c: "253", n: "미지급금",          t: "L", d: "C", fs: "유동부채" },
  { c: "254", n: "예수금",            t: "L", d: "C", fs: "유동부채" },
  { c: "255", n: "부가세예수금",       t: "L", d: "C", fs: "유동부채" },
  { c: "257", n: "가수금",            t: "L", d: "C", fs: "유동부채" },
  { c: "260", n: "단기차입금",        t: "L", d: "C", fs: "유동부채" },
  { c: "262", n: "미지급비용",        t: "L", d: "C", fs: "유동부채" },

  /* 자본 */
  { c: "331", n: "자본금",            t: "E", d: "C", fs: "자본금" },
  { c: "341", n: "주식발행초과금",     t: "E", d: "C", fs: "자본잉여금" },
  { c: "375", n: "이월이익잉여금",     t: "E", d: "C", fs: "이익잉여금" },

  /* 매출 */
  { c: "401", n: "상품매출",          t: "R", d: "C", fs: "매출액" },
  { c: "404", n: "기술사용료수익",     t: "R", d: "C", fs: "매출액" },
  { c: "405", n: "광고수익",          t: "R", d: "C", fs: "매출액" },
  /* 영업외수익 */
  { c: "901", n: "이자수익",          t: "R", d: "C", fs: "영업외수익" },
  { c: "930", n: "잡이익",            t: "R", d: "C", fs: "영업외수익" },

  /* 매출원가 */
  { c: "451", n: "상품매출원가",       t: "X", d: "D", fs: "매출원가" },
  /* 판매비와관리비 */
  { c: "801", n: "직원급여",          t: "X", d: "D", fs: "판매비와관리비" },
  { c: "811", n: "복리후생비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "812", n: "여비교통비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "813", n: "접대비(기업업무추진비)", t: "X", d: "D", fs: "판매비와관리비" },
  { c: "814", n: "통신비",            t: "X", d: "D", fs: "판매비와관리비" },
  { c: "817", n: "세금과공과금",       t: "X", d: "D", fs: "판매비와관리비" },
  { c: "818", n: "감가상각비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "819", n: "지급임차료",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "821", n: "보험료",            t: "X", d: "D", fs: "판매비와관리비" },
  { c: "822", n: "차량유지비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "825", n: "교육훈련비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "826", n: "도서인쇄비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "830", n: "소모품비",          t: "X", d: "D", fs: "판매비와관리비" },
  { c: "831", n: "지급수수료",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "833", n: "광고선전비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "837", n: "건물관리비",        t: "X", d: "D", fs: "판매비와관리비" },
  { c: "848", n: "잡비",              t: "X", d: "D", fs: "판매비와관리비" },
  /* 영업외비용 */
  { c: "951", n: "이자비용",          t: "X", d: "D", fs: "영업외비용" },
  { c: "980", n: "잡손실",            t: "X", d: "D", fs: "영업외비용" },
];

const CORP_ACCT_T = { A: "자산", L: "부채", E: "자본", R: "수익", X: "비용" };
function corpAcct(c) { return CORP_ACCT.find(a => a.c === c) || null; }
function corpAcctName(c) { const a = corpAcct(c); return a ? a.n : "(미등록 " + c + ")"; }

/* ── ② 전표 ───────────────────────────────────────────────────────────
   l: [계정코드, 차변, 대변, 적요] — 한 줄에 한 변만 적는다.
   st: draft 기표 · review 검토 · posted 전기(승인 완료)
   by: 작성자 · ap: 승인자(전기된 것만) */
const CORP_JV_SEED = [
  { id: "JV-0001", d: "2026-09-01", desc: "개시 잔액", by: "조성래", ap: "조성래", st: "posted", open: true, l: [
    ["103", 120000000, 0, "보통예금 개시"], ["232", 20000000, 0, "사무실 보증금"], ["212", 12000000, 0, "비품"],
    ["213", 0, 2000000, "감가상각누계액"], ["331", 0, 100000000, "자본금"], ["341", 0, 40000000, "주식발행초과금"],
    ["375", 0, 10000000, "이월이익잉여금"]] },

  { id: "JV-0002", d: "2026-09-05", desc: "9월 사무실 임차료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["819", 3000000, 0, "9월분"], ["135", 300000, 0, "매입세액"], ["103", 0, 3300000, "이체"]] },
  { id: "JV-0003", d: "2026-09-10", desc: "8월분 급여 지급", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["801", 18000000, 0, "8월 급여"], ["254", 0, 1620000, "소득세·4대보험"], ["103", 0, 16380000, "이체"]] },
  { id: "JV-0004", d: "2026-09-15", desc: "기술사용료수익 — 가온헬스", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["108", 22000000, 0, "세금계산서 발행"], ["404", 0, 20000000, "건강관리 운영 용역"], ["255", 0, 2000000, "매출세액"]] },
  { id: "JV-0005", d: "2026-09-20", desc: "클라우드·회선 이용료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["831", 1200000, 0, "9월"], ["135", 120000, 0, "매입세액"], ["103", 0, 1320000, "자동이체"]] },
  { id: "JV-0006", d: "2026-09-25", desc: "복리후생비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["811", 1500000, 0, "식대·경조"], ["135", 150000, 0, "매입세액"], ["103", 0, 1650000, "법인카드 결제"]] },
  { id: "JV-0007", d: "2026-09-28", desc: "여비교통비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["812", 620000, 0, "출장"], ["101", 0, 620000, "현금"]] },
  { id: "JV-0008", d: "2026-09-30", desc: "9월 감가상각", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["818", 200000, 0, "비품 정액법"], ["213", 0, 200000, "누계액 가산"]] },

  { id: "JV-0009", d: "2026-10-05", desc: "외상매출금 회수 — 가온헬스", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["103", 22000000, 0, "입금"], ["108", 0, 22000000, "9/15 건"]] },
  { id: "JV-0010", d: "2026-10-05", desc: "10월 사무실 임차료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["819", 3000000, 0, "10월분"], ["135", 300000, 0, "매입세액"], ["103", 0, 3300000, "이체"]] },
  { id: "JV-0011", d: "2026-10-10", desc: "9월분 급여 지급", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["801", 18000000, 0, "9월 급여"], ["254", 0, 1620000, "소득세·4대보험"], ["103", 0, 16380000, "이체"]] },
  { id: "JV-0012", d: "2026-10-10", desc: "예수금 납부", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["254", 1620000, 0, "8월분 납부"], ["103", 0, 1620000, "이체"]] },
  { id: "JV-0013", d: "2026-10-12", desc: "광고선전비 — 10월 캠페인", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["833", 5000000, 0, "채널 집행"], ["135", 500000, 0, "매입세액"], ["103", 0, 5500000, "이체"]] },
  { id: "JV-0014", d: "2026-10-15", desc: "기술사용료수익 — 나래라이프", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["108", 33000000, 0, "세금계산서 발행"], ["404", 0, 30000000, "보장분석 용역"], ["255", 0, 3000000, "매출세액"]] },
  { id: "JV-0015", d: "2026-10-18", desc: "업무용 개발비 구입", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["226", 6000000, 0, "연간 라이선스"], ["135", 600000, 0, "매입세액"], ["253", 0, 6600000, "익월 결제"]] },
  { id: "JV-0016", d: "2026-10-20", desc: "클라우드·회선 이용료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["831", 1200000, 0, "10월"], ["135", 120000, 0, "매입세액"], ["103", 0, 1320000, "자동이체"]] },
  { id: "JV-0017", d: "2026-10-22", desc: "교육훈련비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["825", 900000, 0, "직무 교육"], ["103", 0, 900000, "이체"]] },
  { id: "JV-0018", d: "2026-10-25", desc: "보험료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["821", 450000, 0, "사업장 화재보험"], ["103", 0, 450000, "이체"]] },
  { id: "JV-0019", d: "2026-10-25", desc: "도서인쇄비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["826", 180000, 0, "자료 인쇄"], ["101", 0, 180000, "현금"]] },
  { id: "JV-0020", d: "2026-10-31", desc: "10월 감가상각", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["818", 200000, 0, "비품 정액법"], ["213", 0, 200000, "누계액 가산"]] },

  { id: "JV-0021", d: "2026-11-03", desc: "미지급금 결제 — 개발비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["253", 6600000, 0, "10/18 건"], ["103", 0, 6600000, "이체"]] },
  { id: "JV-0022", d: "2026-11-05", desc: "11월 사무실 임차료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["819", 3000000, 0, "11월분"], ["135", 300000, 0, "매입세액"], ["103", 0, 3300000, "이체"]] },
  { id: "JV-0023", d: "2026-11-06", desc: "외상매출금 회수 — 나래라이프", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["103", 33000000, 0, "입금"], ["108", 0, 33000000, "10/15 건"]] },
  { id: "JV-0024", d: "2026-11-07", desc: "예금 이자", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["103", 85000, 0, "이자 입금"], ["930", 0, 85000, "이자수익"]] },
  { id: "JV-0025", d: "2026-11-10", desc: "10월분 급여 지급", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["801", 18000000, 0, "10월 급여"], ["254", 0, 1620000, "소득세·4대보험"], ["103", 0, 16380000, "이체"]] },
  { id: "JV-0026", d: "2026-11-10", desc: "예수금 납부", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["254", 1620000, 0, "9월분 납부"], ["103", 0, 1620000, "이체"]] },
  { id: "JV-0027", d: "2026-11-10", desc: "사무용품 구입", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["848", 240000, 0, "소모품"], ["103", 0, 240000, "이체 — 은행 미통과"]] },

  /* 승인 전 상태 2건 — 3단(기표 → 검토 → 승인)이 실제로 걸리는지 화면에서 보이게 둔다 */
  { id: "JV-0028", d: "2026-11-10", desc: "거래처 접대비", by: "핀테크", ap: null, st: "review", l: [
    ["813", 363000, 0, "불공제"], ["101", 0, 363000, "현금"]] },
  { id: "JV-0029", d: "2026-11-10", desc: "세금과공과", by: "핀테크", ap: null, st: "draft", l: [
    ["817", 120000, 0, "등록면허세"], ["103", 0, 120000, "이체"]] },
];

/* ── ③ 은행 거래내역(보통예금 103) ──────────────────────────────────────────
   a: 입금 +, 출금 −. 장부와 **따로** 들어온 자료라서 일부러 어긋나는 줄을 남겨 두었다
   (은행에만 있는 2건 · 장부에만 있는 1건) — 전부 맞는 자료로는 대사가 도는지 알 수 없다. */
const CORP_BANK_SEED = {
  acct: "103", bank: "주거래은행 기업자유예금", mask: "***-******-***",
  from: "2026-09-01", to: "2026-11-10",
  /* ⚠️ 잔액을 함께 싣는다 — 잔액 사슬은 「흘린 거래」를 잡는 **단 하나의 외부 사실**이고,
     잔액이 없는 표본으로는 그 검사가 분모 0이 된다(= 검사가 없는 것과 같다). */
  lines: [
    { d: "2026-09-01", a: 120000000, bal: 120000000, m: "개시 잔액" },
    { d: "2026-09-05", a: -3300000, bal: 116700000, m: "임대인 이체" },
    { d: "2026-09-10", a: -16380000, bal: 100320000, m: "급여 이체" },
    { d: "2026-09-20", a: -1320000, bal: 99000000, m: "클라우드 자동이체" },
    { d: "2026-09-25", a: -1650000, bal: 97350000, m: "법인카드 결제" },
    { d: "2026-10-05", a: 22000000, bal: 119350000, m: "가온헬스 입금" },
    { d: "2026-10-05", a: -3300000, bal: 116050000, m: "임대인 이체" },
    { d: "2026-10-10", a: -16380000, bal: 99670000, m: "급여 이체" },
    { d: "2026-10-10", a: -1620000, bal: 98050000, m: "세무서·공단 납부" },
    { d: "2026-10-12", a: -5500000, bal: 92550000, m: "광고 집행" },
    { d: "2026-10-20", a: -1320000, bal: 91230000, m: "클라우드 자동이체" },
    { d: "2026-10-22", a: -900000, bal: 90330000, m: "교육기관 이체" },
    { d: "2026-10-25", a: -450000, bal: 89880000, m: "보험료 이체" },
    { d: "2026-11-03", a: -6600000, bal: 83280000, m: "소프트웨어 대금" },
    { d: "2026-11-05", a: -3300000, bal: 79980000, m: "임대인 이체" },
    { d: "2026-11-06", a: 33000000, bal: 112980000, m: "나래라이프 입금" },
    { d: "2026-11-07", a: 85000, bal: 113065000, m: "이자" },
    { d: "2026-11-09", a: -3000, bal: 113062000, m: "타행이체수수료" },
    { d: "2026-11-10", a: -16380000, bal: 96682000, m: "급여 이체" },
    { d: "2026-11-10", a: -1620000, bal: 95062000, m: "세무서·공단 납부" },
    { d: "2026-11-10", a: 500000, bal: 95562000, m: "입금 — 보낸이 확인 필요" },
  ],
};

/* ── ④ 저장 ──────────────────────────────────────────────────────────────────
   먼저 실린 전표는 항상 보이고, 조성래님이 넣으신 전표만 브라우저에 남는다.
   서버가 없으므로 이 브라우저 밖으로는 나가지 않는다 — 화면에도 그렇게 적는다. */
function corpLedgerRead() {
  const empty = { v: 1, jv: [], closed: [], ov: {}, bank: [] };
  try {
    const raw = localStorage.getItem(CORP_LEDGER_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, jv: Array.isArray(o.jv) ? o.jv : [], closed: Array.isArray(o.closed) ? o.closed : [],
      ov: (o.ov && typeof o.ov === "object") ? o.ov : {},
      bank: Array.isArray(o.bank) ? o.bank : [],
    /* 커버 기간 — 최상위 키라 읽기·쓰기 **양쪽**에 있어야 살아남는다(줄 안의 필드와 다르다) */
    bankCov: (o && o.bankCov && typeof o.bankCov === "object") ? { from: String(o.bankCov.from || ""), to: String(o.bankCov.to || ""), at: String(o.bankCov.at || "") } : null };
  } catch (e) { return empty; }
}
function corpLedgerWrite(st) {
  try {
    localStorage.setItem(CORP_LEDGER_KEY, JSON.stringify({ v: 1, jv: st.jv || [], closed: st.closed || [],
      ov: st.ov || {}, bank: st.bank || [], bankCov: st.bankCov || null }));
    return true;
  } catch (e) { return false; }
}
/* 먼저 실린 것 + 입력분. 날짜 → 전표번호 순으로 정렬한다(같은 날은 번호 순).
   ov는 **상태 덮어쓰기**다 — 먼저 실린 전표는 고칠 수 없으므로, 조성래님이 결재를 진행한
   흔적만 따로 얹는다. 분개 줄은 덮지 않는다(금액을 덮으면 코드의 검증 묶음이 무너진다). */
function corpJvAll(st) {
  const ov = (st && st.ov) || {};
  const put = (j) => {
    const o = ov[j.id];
    if (!o) return j;
    return Object.assign({}, j, { st: o.st || j.st, ap: o.ap === undefined ? j.ap : o.ap });
  };
  const add = ((st && st.jv) || []).map(put);
  /* ⚠️ 반입 전표가 하나라도 있으면 먼저 실린 것을 **빼고** 반입분만 본다.
     둘을 섞으면 같은 거래가 두 번 설 수 있어서다 — 다만 이제 **둘 다 실제 전표**이므로,
     빼는 쪽도 실제 전표다. 반입 전에 두 장부를 어떻게 합칠지는 조성래님이 정하실 일이다. */
  const base = add.length ? [] : CORP_JV_SEED.map(put);
  return base.concat(add)
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.id < b.id ? -1 : 1)));
}
/* 상태 전이 — 전이 가능 여부와 **왜 안 되는지**를 함께 돌려준다. 버튼을 그냥 흐리게 두면 이유를 모른다. */
function corpJvCanAdvance(jv, actorId) {
  const a = corpActor(actorId);
  const S = CORP_JV_ST[jv.st];
  if (!S || !S.next) return { ok: false, why: "전기된 전표입니다 — 정정은 역분개로만 합니다" };
  if (S.next === "posted") {
    if (!a.canApprove) return { ok: false, why: a.ko + "은(는) AI 팀장이라 승인하지 못합니다 — 승인은 사람이 합니다" };
    if (jv.by === a.id) return { ok: false, why: "작성자와 승인자가 같습니다 — 다른 사람이 승인해야 합니다" };
  }
  return { ok: true, why: "", to: S.next, ko: S.nextKo };
}
/* 전표번호 — **일자별 일련 YYYYMMDD-NN**.
   날짜를 알면 바로 찾을 수 있어야 한다. 임의 접두나 통짜 일련은 조회에 쓸모가 없다.
   먼저 실린 전표는 JV-####로 남겨 둔다 — 번호만 봐도 어느 묶음인지 갈린다. */
function corpJvNo(d, n) {
  return String(d || "").replace(/-/g, "") + "-" + String(n).padStart(2, "0");
}
function corpJvNextId(st, d) {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  if (!day) return corpJvNo("00000000", 1);
  const pre = day.replace(/-/g, "") + "-";
  let max = 0;
  corpJvAll(st).forEach(j => {
    const id = String(j.id || "");
    if (id.indexOf(pre) !== 0) return;
    const n = +id.slice(pre.length);
    if (n > max) max = n;
  });
  return corpJvNo(day, max + 1);
}
/* 반입 전표가 들어오면 먼저 실린 것은 빠진다 — 두 묶음을 한 표에 섞지 않는다. */
function corpJvLive(st) { return ((st && st.jv) || []).length > 0; }
/* 은행 내역도 반입분이 있으면 그것을 본다.
   ⚠️ 반입 전표를 **먼저 실린 은행 내역**과 대사하면 전건이 미대사로 뜬다 — 거짓 경보다.
      그래서 전표가 실제인데 은행 내역이 아직 없으면 **대사를 돌리지 않고** 그 사실을 말한다. */
function corpBankOf(st) {
  const b = (st && st.bank) || [];
  const cov = (st && st.bankCov) || null;
  if (b.length) return { acct: "103", bank: "반입 내역", mask: "", lines: b, live: true, cov: cov };
  if (corpJvLive(st)) return null;          /* 실제 전표 + 은행 미반입 → 대사 대상 없음 */
  return CORP_BANK_SEED;
}

/* ── ④-2 조회 — 전표는 모두 찾을 수 있어야 한다 ─────────────────────
   q · from · to · st · acct 로 거른다. 돌려주는 것에 **분모**(전체 건수)를 함께 담는다 —
   「3건」만 보이면 몇 건 중 3건인지 모른다. */
function corpJvFind(jvs, q) {
  const Q = q || {};
  const kw = String(Q.q || "").trim().toLowerCase();
  const all = jvs || [];
  const hit = all.filter((j) => {
    if (Q.from && j.d < Q.from) return false;
    if (Q.to && j.d > Q.to) return false;
    if (Q.st && j.st !== Q.st) return false;
    if (Q.acct && !(j.l || []).some((x) => x[0] === Q.acct)) return false;
    if (!kw) return true;
    if (String(j.id || "").toLowerCase().indexOf(kw) >= 0) return true;
    if (String(j.desc || "").toLowerCase().indexOf(kw) >= 0) return true;
    if (String(j.by || "").toLowerCase().indexOf(kw) >= 0) return true;
    return (j.l || []).some((x) =>
      String(x[0]).indexOf(kw) >= 0 ||
      corpAcctName(x[0]).toLowerCase().indexOf(kw) >= 0 ||
      String(x[3] || "").toLowerCase().indexOf(kw) >= 0);
  });
  return { rows: hit, n: hit.length, all: all.length,
    sum: hit.reduce((n, j) => n + corpJvSum(j).dr, 0) };
}
/* 쓰인 계정과목만 — 조회 거르개에 안 쓰는 과목까지 늘어놓지 않는다 */
function corpJvAccts(jvs) {
  const s = {};
  (jvs || []).forEach((j) => (j.l || []).forEach((x) => { s[x[0]] = (s[x[0]] || 0) + 1; }));
  return CORP_ACCT.filter((a) => s[a.c]).map((a) => ({ c: a.c, n: a.n, cnt: s[a.c] }));
}

/* ── ⑤ 검산 ──────────────────────────────────────────────────────────────────
   저장 거부의 근거가 되는 자리다. 경고 문구를 돌려주는 게 아니라 ok:false를 돌려준다. */
function corpJvSum(jv) {
  let dr = 0, cr = 0;
  ((jv && jv.l) || []).forEach(x => { dr += +x[1] || 0; cr += +x[2] || 0; });
  return { dr: dr, cr: cr, diff: dr - cr, ok: dr === cr && dr > 0 };
}
function corpJvCheck(jv, st) {
  const e = [];
  const s = corpJvSum(jv);
  /* ⚠️ 기초 확정선 안쪽은 **재무확인원이 이미 품고 있다** — 전표로 또 세우면 두 번 선다.
     조성래님 원칙(2026-11-15): 9월말까지는 확정, 그 뒤는 은행 내역으로만. */
  const asOf = typeof corpOpenAsOf === "function" ? corpOpenAsOf(null) : "";
  if (asOf && jv && /^\d{4}-\d{2}-\d{2}$/.test(String(jv.d)) && String(jv.d) <= asOf) {
    e.push(asOf + " 까지는 기초 확정선 안쪽입니다 — 그 날까지의 거래는 재무확인원이 이미 품고 있어 전표를 따로 세우지 않습니다");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test((jv && jv.d) || "")) e.push("날짜 형식이 YYYY-MM-DD가 아닙니다");
  if (!((jv && jv.desc) || "").trim()) e.push("적요가 비었습니다");
  if (!((jv && jv.l) || []).length) e.push("분개 줄이 없습니다");
  ((jv && jv.l) || []).forEach((x, i) => {
    if (!corpAcct(x[0])) e.push((i + 1) + "번 줄 — 계정과목 " + (x[0] || "(미선택)") + " 은 계정과목표에 없습니다");
    const d = +x[1] || 0, c = +x[2] || 0;
    if (d < 0 || c < 0) e.push((i + 1) + "번 줄 — 음수 금액은 적지 않습니다(반대 변에 적습니다)");
    if (d > 0 && c > 0) e.push((i + 1) + "번 줄 — 한 줄에 차변과 대변을 같이 적지 않습니다");
    if (d === 0 && c === 0) e.push((i + 1) + "번 줄 — 금액이 0입니다");
  });
  if (s.dr !== s.cr) e.push("차변 " + corpWon(s.dr) + " ≠ 대변 " + corpWon(s.cr) + " · 차이 " + corpWon(Math.abs(s.diff)) + " — 맞을 때까지 저장되지 않습니다");
  else if (s.dr === 0) e.push("합계가 0입니다");
  const mo = ((jv && jv.d) || "").slice(0, 7);
  if (st && ((st.closed || []).indexOf(mo) >= 0)) e.push(mo + " 은 마감된 달입니다 — 신규 전표가 들어가지 않습니다. 정정은 역분개로 합니다");
  /* ⚠️ 같은 전표를 두 번 되돌리지 못하게 **저장되는 자리**에서 막는다.
     화면 버튼만 막으면 다른 길로 들어온 것을 못 막는다. 실제로 한 전표가 열세 번 되돌려졌다. */
  if (jv && jv.rev && st) {
    const all = typeof corpJvAll === "function" ? corpJvAll(st) : (st.jv || []);
    const had = all.find(function (x) { return x.rev === jv.rev && x.id !== jv.id; });
    if (had) e.push("「" + jv.rev + "」은(는) 이미 역분개했습니다(" + had.id + ") — 두 번 되돌리면 원래 거래가 거꾸로 섭니다");
  }
  return { ok: e.length === 0, errs: e, sum: s };
}
/* 역분개 — 전기된 전표를 고치는 유일한 길. 차·대를 뒤집은 새 전표를 만든다. */
/* 이 전표를 되돌린 전표를 찾는다 — 있으면 **또 되돌리면 안 된다**.
   두 번 되돌리면 원래 거래가 거꾸로 서고, 세 번이면 또 뒤집힌다. 장부가 춤춘다. */
function corpJvRevOf(jvs, id) {
  return (jvs || []).find(function (j) { return j.rev === id; }) || null;
}
/* 되돌릴 수 있는가 — 안 되면 **왜 안 되는지** 함께 돌려준다 */
function corpJvCanReverse(jv, jvs) {
  if (!jv) return { ok: false, why: "전표가 없습니다" };
  if (jv.st !== "posted") return { ok: false, why: "아직 전기되지 않았습니다 — 장부에 올라가 있지 않아 되돌릴 것이 없습니다(승인 전이면 그냥 물리면 됩니다)" };
  if (jv.rev) return { ok: false, why: "이 전표 자체가 역분개입니다 — 역분개를 또 역분개하지 않습니다" };
  const had = corpJvRevOf(jvs, jv.id);
  if (had) return { ok: false, why: "이미 역분개했습니다(" + had.id + ") — 두 번 되돌리면 원래 거래가 거꾸로 섭니다", by: had.id };
  return { ok: true, why: "" };
}

function corpJvReverse(jv, by, today) {
  return {
    id: null, d: today || jv.d, desc: "역분개 — " + jv.id + " · " + jv.desc, by: by || "조성래",
    ap: null, st: "draft", rev: jv.id,
    l: (jv.l || []).map(x => [x[0], +x[2] || 0, +x[1] || 0, "역분개 " + (x[3] || "")]),
  };
}

/* ── ⑥ 원장 · 시산표 ────────────────────────────────────────────────────────
   전기(posted)된 전표만 장부에 올린다. 기표·검토 상태는 집계 밖이다. */
function corpPosted(jvs, upto) {
  return (jvs || []).filter(j => j.st === "posted" && (!upto || j.d <= upto));
}
/* ⚠️ 장부는 0 이 아니라 **기초 확정선에서 출발한다**(조성래님 원칙 2026-11-15).
   기초는 줄(lines)에 넣지 않는다 — 넣으면 월별 현금흐름이 그걸 유입으로 삼켜
   소모가 통째로 사라진다. 출발선은 들어온 돈이 아니다.
   open 을 따로 넘기면 그걸 쓰고, 안 넘기면 승인된 판을 읽는다. */
function corpLedgerBook(jvs, upto, open) {
  const map = {};
  const ob = open === undefined ? corpOpenBal(null) : (open || {});
  CORP_ACCT.forEach(a => {
    const o = Math.round(+ob[a.c] || 0);
    map[a.c] = { c: a.c, n: a.n, t: a.t, d: a.d, contra: !!a.contra,
      dr: o > 0 ? o : 0, cr: o < 0 ? -o : 0, open: o, lines: [] };
  });
  corpPosted(jvs, upto).forEach(j => {
    (j.l || []).forEach(x => {
      const row = map[x[0]]; if (!row) return;
      const d = +x[1] || 0, c = +x[2] || 0;
      row.dr += d; row.cr += c;
      row.lines.push({ id: j.id, d: j.d, desc: j.desc, memo: x[3] || "", dr: d, cr: c });
    });
  });
  Object.keys(map).forEach(k => {
    const r = map[k];
    r.sign = r.dr - r.cr;                                  /* 부호 잔액 — 집계는 늘 이걸로 한다 */
    r.bal = r.d === "D" ? r.sign : -r.sign;                /* 정상잔액 — 표시용 */
    let run = 0; r.lines.forEach(l => { run += l.dr - l.cr; l.run = r.d === "D" ? run : -run; });
  });
  return map;
}
function corpTrial(jvs, upto) {
  const book = corpLedgerBook(jvs, upto);
  const rows = CORP_ACCT.map(a => book[a.c]).filter(r => r.dr !== 0 || r.cr !== 0);
  const drSum = rows.reduce((n, r) => n + r.dr, 0), crSum = rows.reduce((n, r) => n + r.cr, 0);
  return { rows: rows, drSum: drSum, crSum: crSum, diff: drSum - crSum, ok: drSum === crSum, book: book };
}
/* 재무제표 — 시산표에서 파생한다. 따로 더하지 않는다(두 번 더하면 두 값이 생긴다). */
function corpStatements(jvs, upto) {
  const tr = corpTrial(jvs, upto), b = tr.book;
  const by = (t) => CORP_ACCT.filter(a => a.t === t).map(a => b[a.c]).filter(r => r.dr !== 0 || r.cr !== 0);
  const sum = (rows, flip) => rows.reduce((n, r) => n + (flip ? -r.sign : r.sign), 0);
  const A = by("A"), L = by("L"), E = by("E"), R = by("R"), X = by("X");
  const assets = sum(A), liab = sum(L, true), equity = sum(E, true);
  const rev = sum(R, true), exp = sum(X);
  const net = rev - exp;
  return {
    bs: { A: A, L: L, E: E, assets: assets, liab: liab, equity: equity, net: net,
      total: liab + equity + net, ok: assets === liab + equity + net },
    pl: { R: R, X: X, rev: rev, exp: exp, net: net },
    trial: tr, upto: upto || null,
  };
}

/* ── ⑦ 은행 대사 ────────────────────────────────────────────────────────────
   같은 날 · 같은 금액을 한 번씩만 짝지어 준다. 두 번 쓰이지 않게 소비 표시를 남긴다.
   자동으로 맞춰 주는 데까지가 AI의 몫이고, 남은 줄을 없애는 건 사람이 한다. */
function corpBankRecon(jvs, bank, upto) {
  /* ⚠️ bank === null 은 「은행 내역이 반입되지 않았다」는 뜻이다.
     여기서 먼저 실린 내역으로 되돌리면 **반입 전표를 먼저 실린 은행줄과 대사**하게 되고,
     전 건이 미대사로 뜬다. 상대가 없으면 대사를 돌리지 않고, 돌리지 않았다고 말한다. */
  const none = bank === null;
  const B = none ? { acct: "103", bank: "", mask: "", lines: [] } : (bank || CORP_BANK_SEED);
  const acct = B.acct || "103";
  const book = [];
  corpPosted(jvs, upto).forEach(j => {
    let net = 0, hit = false;
    (j.l || []).forEach(x => { if (x[0] === acct) { net += (+x[1] || 0) - (+x[2] || 0); hit = true; } });
    if (hit && net !== 0) book.push({ id: j.id, d: j.d, desc: j.desc, a: net, used: false });
  });
  /* ⚠️ 잔액(bal)·시각(t)·분류(cls)·행번호(row)를 **떨어뜨리지 않는다.**
     여기서 새 객체를 만들며 bal 을 흘리면 잔액 사슬 검사가 분모 0이 되어
     「흘린 거래를 잡는 단 하나의 검사」가 조용히 꺼진다. 실제로 그렇게 꺼져 있었다. */
  const bl = (B.lines || []).filter(l => !upto || l.d <= upto).map(l => ({
    d: l.d, a: l.a, m: l.m, t: l.t || "", cls: l.cls || "", row: l.row || 0,
    bal: (l.bal === undefined || l.bal === null || l.bal === "") ? null : +l.bal,
    used: false, jv: null,
  }));
  bl.forEach(l => {
    const k = book.find(x => !x.used && x.d === l.d && x.a === l.a);
    if (k) { k.used = true; l.used = true; l.jv = k.id; }
  });
  const bankOnly = bl.filter(l => !l.used);
  const bookOnly = book.filter(x => !x.used);
  const bankBal = bl.reduce((n, l) => n + l.a, 0);
  const bookBal = book.reduce((n, x) => n + x.a, 0);
  const bankOnlyNet = bankOnly.reduce((n, l) => n + l.a, 0);
  const bookOnlyNet = bookOnly.reduce((n, x) => n + x.a, 0);
  return {
    none: none, acct: acct, bank: B.bank, mask: B.mask, lines: bl, book: book,
    live: !!B.live, from: B.from || (B.cov && B.cov.from) || "", to: B.to || (B.cov && B.cov.to) || "",
    matched: bl.filter(l => l.used).length, bankOnly: bankOnly, bookOnly: bookOnly,
    bankBal: bankBal, bookBal: bookBal, bankOnlyNet: bankOnlyNet, bookOnlyNet: bookOnlyNet,
    /* 대사 항등식: 장부잔액 − 은행잔액 = 장부에만 있는 순액 − 은행에만 있는 순액 */
    gap: none ? 0 : (bookBal - bankBal) - (bookOnlyNet - bankOnlyNet),
    ok: none ? true : ((bookBal - bankBal) - (bookOnlyNet - bankOnlyNet)) === 0,
  };
}

/* ── ⑧ 항등식 ───────────────────────────────────────────────────────────────
   화면의 「검산」 패널과 커밋 게이트 러너가 **이 함수 하나**를 같이 쓴다.
   n은 분모다 — 검사 대상이 0건이면 통과가 아니라 실패다(빈 장부는 늘 맞는다). */
function corpLedgerIdentities(jvs, bank, upto) {
  const all = jvs || CORP_JV_SEED;
  const posted = corpPosted(all, upto);
  const S = corpStatements(all, upto);
  const R = corpBankRecon(all, bank, upto);
  /* 잔액 축 — 이 둘만이 「빠진 거래」를 잡는다. corpBankJv.js 의 함수를 그대로 쓴다(두 벌 금지). */
  const CH = typeof corpBjvChain === "function" ? corpBjvChain(R.lines || [])
    : { n: 0, ok: false, breaks: [], open: null, last: null, noBal: 0 };
  const bookBal = (function () {
    const r = (S.trial && S.trial.rows || []).find(function (x) { return x.c === (R.acct || "103"); });
    return r ? Math.round(r.bal) : 0;
  })();
  const bad = posted.filter(j => !corpJvSum(j).ok);
  const unknown = [];
  all.forEach(j => (j.l || []).forEach(x => { if (!corpAcct(x[0])) unknown.push(j.id + " / " + x[0]); }));
  const seen = {}, dupes = [];
  all.forEach(j => { if (seen[j.id]) dupes.push(j.id); seen[j.id] = 1; });
  /* 은행줄 하나에 살아 있는(역분개로 상쇄되지 않은) 전기 전표가 몇 장인가 */
  const bkLive = (function () {
    const revP = {};
    all.forEach(j => { if (j.rev && j.st === "posted") revP[j.rev] = 1; });
    const live = posted.filter(j => j.bk && !revP[j.id]);
    const by = {};
    live.forEach(j => { (by[j.bk] = by[j.bk] || []).push(j.id); });
    const bad = Object.keys(by).filter(k => by[k].length > 1).map(k => by[k].join(" + "));
    return { n: live.length, bad: bad };
  })();
  const selfAp = posted.filter(j => !j.open && j.ap && j.by === j.ap);
  const noAp = posted.filter(j => !j.ap);

  return [
    { k: "jv",      ko: "전표별 차대 일치",         n: posted.length,       ok: bad.length === 0,     got: bad.length + "건 불일치", want: "0건" },
    { k: "trial",   ko: "시산표 차변 = 대변",       n: S.trial.rows.length, ok: S.trial.ok,           got: corpWon(S.trial.drSum) + " / " + corpWon(S.trial.crSum), want: "같을 것" },
    { k: "bs",      ko: "자산 = 부채 + 자본 + 손익", n: S.bs.A.length,       ok: S.bs.ok,              got: corpWon(S.bs.assets) + " / " + corpWon(S.bs.total), want: "같을 것" },
    { k: "pl",      ko: "손익 = 수익 − 비용",       n: S.pl.R.length + S.pl.X.length, ok: S.pl.net === S.pl.rev - S.pl.exp, got: corpWon(S.pl.net), want: corpWon(S.pl.rev - S.pl.exp) },
    /* ⚠️ 이 줄은 **판정에서 뺀다.** 짝지은 줄은 금액이 같으니 gap 은 대수적으로 늘 0이다 —
       조작한 은행줄을 먹여도 통과한다. 「언제나 맞는 검사」를 통과로 세면 검사가 없는 것과 같다.
       흘린 거래를 잡는 일은 **잔액 축**(아래 두 줄)이 한다. 값은 참고로 그대로 보여 준다. */
    { k: "bank",    ko: "은행 대사 차이 해소",       n: R.lines.length,      ok: R.ok,                 got: R.none ? "은행 내역 미반입" : corpWon(R.gap), want: "0",
      skip: true, why: R.none ? "은행 거래내역이 반입되지 않았습니다 — 대사할 상대가 없어 돌리지 않았습니다"
        : "이 값은 구조적으로 늘 0입니다(짝지은 줄은 금액이 같습니다) — 통과로 세지 않습니다. 흘린 거래는 아래 잔액 축이 잡습니다" },
    /* 잔액 사슬 — 은행 표가 스스로 증명하는 **외부 사실**이다.
       잔액[i] = 잔액[i-1] + 입금 - 출금 이 한 군데라도 안 서면 표에 없는 거래가 있다. */
    { k: "chain",   ko: "은행 잔액 사슬 전건 성립",   n: CH.n,                ok: CH.ok,
      got: CH.n === 0 ? "잔액 없음" : (CH.breaks.length ? CH.breaks.length + "군데 끊김(" + CH.breaks[0].d + " " + corpWon(CH.breaks[0].gap) + ")" : "끊김 없음"),
      want: "끊김 0", skip: CH.n === 0,
      why: CH.n === 0 ? "은행 내역에 잔액이 없습니다 — 흘린 거래를 잡을 길이 없어 검사하지 않았습니다" : "" },
    /* ⚠️ 이 대조는 **계좌 전체를 덮는 표**라야 뜻이 있다. 이 은행 묶음은 계좌 전체가 아니라 미대사를 품고
       있어서, 그 표의 마지막 잔액을 장부와 견주면 늘 어긋난다 — 그걸 실패로 세면
       사람이 「원래 빨간 것」으로 배우고, 진짜 어긋날 때 아무도 안 본다. */
    { k: "balmatch", ko: "은행 마지막 잔액 = 장부 보통예금", n: (CH.last === null || !R.live) ? 0 : 1,
      ok: CH.last !== null && R.live && CH.last === Math.round(bookBal),
      got: CH.last === null ? "잔액 없음" : corpWon(CH.last) + " / " + corpWon(bookBal),
      want: "같을 것", skip: CH.last === null || !R.live,
      why: CH.last === null ? "은행 내역에 잔액이 없습니다 — 대조할 상대가 없어 검사하지 않았습니다"
        : (!R.live ? "지금 보고 있는 은행 내역은 계좌 전체가 아닙니다 — 반입된 내역에서만 대조합니다" : "") },
    /* ⚠️ 한 은행줄에서 만든 전표가 **둘 다 살아 있으면** 그 거래가 장부에 두 번 선다.
       역분개를 기표인 채로 두고 다시 만들면 정확히 그렇게 된다(실측 — 103 잔액이 은행보다
       2,200,000 많은데 다른 항등식 열셋이 전부 녹색이었다). 상쇄된 것은 빼고 센다. */
    { k: "bkdup",   ko: "한 은행줄에 살아 있는 전기 전표 1장 이하", n: bkLive.n,
      ok: bkLive.bad.length === 0,
      got: bkLive.bad.length ? bkLive.bad.length + "줄 겹침(" + bkLive.bad[0] + ")" : "겹침 없음", want: "0줄",
      skip: bkLive.n === 0, why: bkLive.n === 0 ? "은행에서 만든 전기 전표가 없습니다 — 검사할 대상이 없습니다" : "" },
    { k: "acct",    ko: "미등록 계정 0건",          n: all.length,          ok: unknown.length === 0, got: unknown.length + "건", want: "0건" },
    { k: "dupe",    ko: "전표번호 중복 0건",         n: all.length,          ok: dupes.length === 0,   got: dupes.length + "건", want: "0건" },
    { k: "approve", ko: "작성자 ≠ 승인자",          n: posted.filter(j => !j.open).length, ok: selfAp.length === 0, got: selfAp.length + "건 동일인", want: "0건" },
    { k: "signed",  ko: "전기 전표에 승인자 기록",    n: posted.length,       ok: noAp.length === 0,    got: noAp.length + "건 누락", want: "0건" },
    { k: "no",      ko: "전표번호 전건 부여",      n: all.length,          ok: all.every((j) => String(j.id || "").trim()), got: all.filter((j) => !String(j.id || "").trim()).length + "건 누락", want: "0건" },
    { k: "find",    ko: "전표 조회 — 전건 찾을 수 있음", n: all.length,     ok: corpJvFind(all, {}).n === all.length, got: corpJvFind(all, {}).n + " / " + all.length, want: "전건" },
  ];
}
/* 전건 통과 여부 — 분모 0은 실패로 센다. 빈 장부가 조용히 통과하면 검사가 없는 것과 같다. */
function corpLedgerVerdict(jvs, bank, upto) {
  const rows = corpLedgerIdentities(jvs, bank, upto);
  /* 보류(skip)는 분모 0 실패로 세지 않는다 — 대신 보류인 채로 화면에 남는다.
     보류를 통과로 접어 넣으면 「대사 맞음」으로 읽혀, 안 돌린 검사가 통과로 둔갑한다. */
  const skip = rows.filter(r => r.skip);
  const live = rows.filter(r => !r.skip);
  const zero = live.filter(r => !(r.n > 0));
  const fail = live.filter(r => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero, skip: skip };
}

/* ── ⑨ 표시 ─────────────────────────────────────────────────────────────── */
function corpWon(n) {
  const v = Math.round(+n || 0);
  return (v < 0 ? "−" : "") + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function corpJvMonths(jvs) {
  const s = {}; (jvs || []).forEach(j => { s[(j.d || "").slice(0, 7)] = 1; });
  return Object.keys(s).sort();
}
const CORP_JV_ST = {
  draft:  { ko: "기표", next: "review", nextKo: "검토 요청" },
  review: { ko: "검토", next: "posted", nextKo: "승인 · 전기" },
  posted: { ko: "전기", next: null, nextKo: null },
};
/* 조작 주체 — 서버 세션이 없으므로 화면에서 고른다. AI는 승인하지 못한다(can/cannot의 코드판). */
const CORP_ACTORS = [
  { id: "조성래", ko: "조성래", role: "대표 · 회계팀 책임자", ai: false, canApprove: true },
  { id: "핀테크", ko: "핀테크", role: "AI 팀장", ai: true, canApprove: false },
];
function corpActor(id) { return CORP_ACTORS.find(a => a.id === id) || CORP_ACTORS[0]; }

/* ── ⑩ 총괄 지표 — 대시보드 왼쪽 네 칸의 **단일 원천** (조성래님 지시 2026-11-12) ──────
   「회계에서 가져와서 저 화면 항상 숫자 채워 줘.」

   네 칸(현금 잔고 · 런웨이 · 이번 달 매출 · 전표)은 전부 **이 장부**에서 나온다.
   화면이 따로 더하지 않는다 — 같은 숫자를 두 곳에서 더하면 두 값이 생기고 둘 다 못 믿게 된다.

   ⚠️ 기준일은 **인자로 받는다**. 함수 안에서 오늘을 읽으면 커밋 게이트가 벽시계에 매달린다.
   ⚠️ 못 세면 0 을 쓰지 않는다 — 「0원」과 「셀 수 없음」은 다른 말이다.
      못 세는 까닭(why)을 함께 돌려주고, 화면은 그 까닭을 그대로 적는다.
   ⚠️ 월중 수치를 전월 **한 달**과 나란히 놓지 않는다 — 11월 12일까지의 매출을 10월 한 달과
      견주면 무슨 일이 있어도 「급감」으로 보인다. 전월은 **같은 날까지**를 함께 돌려준다. */

/* 현금성 — 과목 분류(fs)로 묶지 않는다. 「당좌자산」에는 외상매출금·선급금·가지급금이
   함께 들어 있고 그건 아직 현금이 아니다. 그래서 여기만 과목코드를 직접 적는다.
   대신 과목에 실재하는지 확인한다 — 과목이 바뀌면 조용히 0 이 되지 않게. */
const CORP_CASH_C = ["101", "103"];
function corpCashAccts() { return CORP_CASH_C.filter(function (c) { return !!corpAcct(c); }); }

/* 잔액 — 전기된 전표만, 원장(corpLedgerBook) 한 길로만 더한다.
   음수인 현금 과목을 함께 돌려준다 — 개시 시재 없이 현금 지출만 잡히면 잔액이 음수가 되고,
   그건 장부의 결함이지 화면이 감출 일이 아니다. */
function corpKpiCash(jvs, upto) {
  const acc = corpCashAccts();
  const b = corpLedgerBook(jvs, upto);
  let won = 0, n = 0;
  const minus = [];
  acc.forEach(function (c) {
    const r = b[c]; if (!r) return;
    won += r.sign; n += r.lines.length;
    if (r.sign < 0) minus.push({ c: r.c, n: r.n, won: r.sign });
  });
  return { won: won, n: n, accts: acc, minus: minus,
    why: acc.length !== CORP_CASH_C.length ? "현금성 과목이 장부에 없습니다"
       : (n ? "" : "전기된 현금 거래가 없습니다") };
}

/* 달마다의 현금 순증감 — **잔액 차분이 아니라 줄을 걸어** 센다.
   차분으로 내면 개시 전표가 첫 달의 유입으로 잡혀 소모가 통째로 사라진다.
   개시 잔액은 들어온 돈이 아니라 출발선이다. */
function corpCashMonths(jvs, upto) {
  const acc = corpCashAccts(), s = {};
  corpPosted(jvs, upto).forEach(function (j) {
    if (j.open) return;
    const ym = String(j.d || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) return;
    (j.l || []).forEach(function (x) {
      if (acc.indexOf(x[0]) < 0) return;
      if (!s[ym]) s[ym] = { ym: ym, net: 0, n: 0 };
      s[ym].net += (+x[1] || 0) - (+x[2] || 0);
      s[ym].n += 1;
    });
  });
  return Object.keys(s).sort().map(function (k) { return s[k]; });
}

/* 월 순유출 — 정의는 재무계획 축(finBudget.js 의 burn3m)과 **같은 말**이다:
   최근 세 달 평균 순유출. 원천만 다르다(저기는 예산양식, 여기는 장부).
   정의까지 갈라지면 같은 이름의 숫자가 두 뜻이 된다.
   ⚠️ 기준월은 뺀다 — 달이 끝나지도 않았는데 한 달치로 세면 소모가 작아 보인다.
      이 장부의 11월이 실제로 그렇다(외상매출금 회수가 들어와 **유입**으로 뜬다).
   ⚠️ 장부가 열리기 전 달은 「0원 쓴 달」이 아니라 「자료가 없는 달」이다. 분모에 넣지 않는다. */
const CORP_BURN_WIN = 3;
function corpKpiBurn(jvs, upto, ym) {
  const done = corpCashMonths(jvs, upto).filter(function (m) { return m.ym < ym; });
  const win = done.slice(-CORP_BURN_WIN);
  if (!win.length) return { burn: null, n: 0, months: [], why: "장부에 끝난 달이 없어 월 소모를 세지 못합니다" };
  const net = win.reduce(function (a, m) { return a + m.net; }, 0) / win.length;
  return { burn: -net, n: win.length, months: win.map(function (m) { return m.ym; }), why: "" };
}
function corpKpiRunway(cash, burn) {
  if (!cash || !burn) return { m: null, why: "셀 거리가 없습니다" };
  if (burn.burn === null) return { m: null, why: burn.why };
  if (!(cash.n > 0)) return { m: null, why: cash.why || "현금 잔액을 세지 못했습니다" };
  /* 순유입이면 런웨이는 수학적으로 끝이 없다. 「—」로 두면 **못 센 것**처럼 보이므로
     재무계획 화면(Finance.jsx)과 **같은 낱말**로 「흑자」라 적고, 까닭은 밑줄에 정확히 쓴다. */
  if (burn.burn <= 0) return { m: null, surplus: true,
    why: "최근 " + burn.n + "개월이 순유입이라 런웨이가 서지 않습니다" };
  if (cash.won <= 0) return { m: 0, why: "" };
  return { m: cash.won / burn.burn, why: "" };
}

/* 매출 — **매출액 과목만**. 이자수익·잡이익은 영업외수익이라 매출이 아니다.
   과목 목록을 여기 또 적지 않고 분류(fs)에서 뽑는다 — 과목이 늘 때 한쪽만 늘지 않게.
   구간 누계는 예실 대비와 **같은 방법**(두 절단의 차분)으로 낸다.
   after 는 구간 **바로 앞 날**이다(그 날은 포함하지 않는다). */
function corpSalesAccts() {
  return CORP_ACCT.filter(function (a) { return a.fs === "매출액"; }).map(function (a) { return a.c; });
}
function corpKpiRev(jvs, after, upto) {
  const acc = corpSalesAccts();
  const cur = corpLedgerBook(jvs, upto), pre = corpLedgerBook(jvs, after);
  let won = 0, n = 0;
  acc.forEach(function (c) {
    const a = cur[c]; if (!a) return;
    const b = pre[c];
    won += -(a.sign - (b ? b.sign : 0));       /* 수익은 대변이 정상이라 한 번 뒤집는다 */
    n += a.lines.filter(function (l) { return l.d > after && l.d <= upto; }).length;
  });
  return { won: won, n: n, accts: acc };
}

/* 전표 건수 — 잔액과 달리 **날짜로** 센다. 승인 전(기표·검토)도 건수에는 들어간다.
   장부에는 안 올라가지만 결재하실 것이 몇 건인지가 이 칸의 쓸모다. */
function corpKpiJv(jvs, from, to) {
  const inR = (jvs || []).filter(function (j) { return j.d >= from && j.d <= to; });
  const p = inR.filter(function (j) { return j.st === "posted"; });
  return { all: inR.length, posted: p.length, wait: inR.length - p.length };
}

/* 전월 **같은 날까지** — 월중 수치를 전월 한 달과 견주지 않기 위한 자.
   전월에 그 날짜가 없으면(3/31 → 2월) 전월 말일로 맞춘다. */
function corpSameDayPrev(today) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today || "");
  if (!m || typeof corpPaPrevYm !== "function" || typeof corpPaCut !== "function") return "";
  const pym = corpPaPrevYm(m[1] + "-" + m[2]);
  const end = corpPaCut(pym);
  const d = pym + "-" + m[3];
  return d > end ? end : d;
}

/* 네 칸 한꺼번에 — 화면과 AI 팀장이 **이 함수 하나**를 같이 본다. */
function corpKpi(jvs, today) {
  const okd = /^\d{4}-\d{2}-\d{2}$/.test(today || "");
  const hasCut = typeof corpPaCut === "function" && typeof corpPaPrevYm === "function";
  if (!okd || !hasCut) {
    return { ok: false, n: 0, today: today || "", ym: "", t: {},
      why: okd ? "달 경계를 세는 함수가 없습니다" : "기준일을 받지 못했습니다" };
  }
  const ym = today.slice(0, 7);
  const pym = corpPaPrevYm(ym);
  const pend = corpPaCut(pym);                      /* 전월 말일 — 이번 달 구간 바로 앞 */
  const ppend = corpPaCut(corpPaPrevYm(pym));       /* 전전월 말일 */
  const psame = corpSameDayPrev(today);             /* 전월 같은 날 */
  const n = corpPosted(jvs, today).length;

  const cash = corpKpiCash(jvs, today);
  const cashP = corpKpiCash(jvs, pend);
  const burn = corpKpiBurn(jvs, today, ym);
  const run = corpKpiRunway(cash, burn);
  const rev = corpKpiRev(jvs, pend, today);         /* 이번 달 1일 ~ 기준일 */
  const revS = corpKpiRev(jvs, ppend, psame);       /* 전월 같은 기간 */
  const revM = corpKpiRev(jvs, ppend, pend);        /* 전월 한 달 */
  const jv = corpKpiJv(jvs, ym + "-01", today);
  /* 장부가 어디까지 적혀 있는가 — 기준일(벽시계)과 다를 수 있다.
     달이 바뀌었는데 전표가 안 들어왔으면 「이번 달 0건」이 맞는 답이고, 그 까닭이 이것이다. */
  const ds = (jvs || []).map(function (j) { return String(j.d || ""); }).filter(function (d) { return d; }).sort();
  const last = ds.length ? ds[ds.length - 1] : "";

  const W = corpWon;
  const sgn = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + W(Math.abs(v)); };
  const dCash = cash.won - cashP.won;
  const t = {
    cash: { k: "현금 잔고", u: "원",
      txt: cash.n ? W(cash.won) : "—",
      sub: !cash.n ? cash.why : "전월 말 대비 " + sgn(dCash) + "원",
      warn: cash.minus.length
        ? cash.minus.map(function (m) { return m.n + "(" + m.c + ") " + W(m.won) + "원"; }).join(" · ")
          + " — 잔액이 음수입니다. 개시 시재가 빠져 있습니다"
        : "" },
    run: { k: "런웨이", u: run.m === null ? "" : "개월",
      txt: run.m === null ? (run.surplus ? "흑자" : "—") : (Math.round(run.m * 10) / 10).toFixed(1),
      sub: run.why || ("월 순유출 " + W(burn.burn) + "원 · 최근 " + burn.n + "개월 평균(" + burn.months.join(" · ") + ")"),
      /* 표본이 창보다 짧으면 그 사실을 적는다 — 두 달짜리 평균은 한 달만 더해도 크게 흔들린다 */
      warn: (run.m !== null && burn.n < CORP_BURN_WIN)
        ? "끝난 달이 " + burn.n + "개뿐이라 한 달만 더해도 크게 흔들립니다" : "" },
    rev: { k: "매출", u: "원",
      txt: n ? W(rev.won) : "—",
      sub: !n ? "장부에 전기된 전표가 없습니다"
         : "전월 같은 기간 " + W(revS.won) + "원 · 전월 한 달 " + W(revM.won) + "원",
      warn: (n && !rev.n) ? "이번 달 매출 전표가 아직 없습니다" : "" },
    jv: { k: "전표", u: "건",
      txt: String(jv.all),
      sub: (+ym.slice(5)) + "월 1일~" + (+today.slice(8)) + "일 · 전기 " + jv.posted + " · 승인 전 " + jv.wait,
      warn: jv.wait > 0 ? "승인 전 " + jv.wait + "건은 장부에 올라가 있지 않습니다" : "" },
  };
  return { ok: n > 0, n: n, why: n ? "" : "장부에 전기된 전표가 없습니다",
    today: today, ym: ym, pym: pym, pend: pend, ppend: ppend, psame: psame,
    last: last, stale: !!(last && last.slice(0, 7) < ym),
    cash: cash, cashPrev: cashP, burn: burn, run: run,
    rev: rev, revSame: revS, revMonth: revM, jv: jv,
    months: corpCashMonths(jvs, today), t: t };
}

/* 화면이 부르는 한 줄 — 반입분까지 읽어 **원천 이름**을 붙인다.
   먼저 실린 것인지 반입분인지는 숫자보다 먼저 알아야 한다. */
function corpKpiOf(st, today) {
  const S = st || corpLedgerRead();
  const K = corpKpi(corpJvAll(S), today);
  K.live = corpJvLive(S);
  /* 낱말을 재무현황 화면(CorpLedger.jsx)과 **같은 것**으로 쓴다 —
     같은 장부를 두 지면이 다른 이름으로 부르면 같은 장부인지 알 수 없다. */
  K.srcKo = K.live ? "반입 전표" : "실제 전표";
  /* 「현금잔고는 그냥 은행거래내역서의 잔액을 표시해 줘」(조성래님 지시 2026-11-15).
     은행 잔액은 **바깥 사실**이다 — 장부보다 먼저 믿는다. 다만 장부 값을 지우지는
     않는다 — 밑줄에 나란히 적고, 차이가 있으면 그걸 경고로 세운다.
     은행 내역이 없으면 장부 값을 그대로 두고 그 사실을 적는다(0 이라 적지 않는다). */
  K.gap = typeof corpBankGap === "function" ? corpBankGap(S, today) : null;
  if (K.gap && K.gap.ok && K.t && K.t.cash) {
    K.t.cash = { k: "현금 잔고", u: "원", txt: corpWon(K.gap.bank),
      sub: "은행 거래내역서 마지막 잔액 · 장부 " + corpWon(K.gap.book) + "원",
      warn: K.gap.diff ? "장부와 " + corpWon(K.gap.diff) + "원 차이 — " + (K.gap.why[0] || "까닭을 세지 못했습니다") : "" };
    K.cashSrc = "bank";
  } else { K.cashSrc = "book"; }
  K.open = typeof corpOpenPass === "function" ? corpOpenPass(null) : null;
  return K;
}

/* ══════════════ ⑪ 통장 맞추기 — 차이를 늘 보이게 (조성래님 지시 2026-11-15) ══════════════
   지시: 「현금잔액은 항상 계좌의 잔액과 일치시켜 줘.」
   그리고 개시 잔액 상대 계정은 「지금은 정하지 말고 차이를 보여만 달라」.

   ⚠️ **맞춘다 ≠ 덮어쓴다.** 장부 잔액을 은행 값으로 대입하면 그 순간 복식부기가 끝난다 —
   차변만 바뀌고 대변이 없다. 차액을 조정전표로 자동으로 꽂는 것도 안 된다.
   사람이 설명해야 할 돈이 설명된 척하게 된다.

   그래서 「일치」를 **「차이를 늘 보이게 하고, 0이 아니면 그 차이가 무엇으로 이루어졌는지
   적는다」**로 둔다. 차이가 0이 되는 날은 사람이 분개를 세운 날이지 기계가 맞춘 날이 아니다.

   ⚠️ 맞출 계정은 **103 보통예금**이다. 101 현금은 은행 계좌가 아니다(계정과목표에서 bank:true 는 103 뿐).

   세 수를 나란히 둔다 — ③(승인해야 반영)과 ④(항상 일치)가 승인 대기 구간에서 부딪히므로,
   「지금 장부」와 「승인하면 될 장부」를 같이 보여야 거짓말을 하지 않는다. */
function corpBankGap(st, upto) {
  const S0 = st || corpLedgerRead();
  const all = corpJvAll(S0);
  const bank = corpBankOf(S0);
  const R = corpBankRecon(all, bank, upto);
  const acct = (R && R.acct) || "103";
  const CH = typeof corpBjvChain === "function" ? corpBjvChain((R && R.lines) || [])
    : { last: null, open: null };

  /* 전기된 것만 — 장부가 지금 말하는 잔액 */
  const bk = corpLedgerBook(all, upto)[acct];
  const book = bk ? Math.round(bk.sign) : 0;

  /* 승인 전 전표가 103 에 걸어 둔 금액 — 누르면 더해질 몫이다 */
  let wait = 0, waitN = 0;
  (all || []).forEach(function (j) {
    if (j.st === "posted") return;
    if (upto && String(j.d) > upto) return;
    let hit = 0;
    (j.l || []).forEach(function (x) { if (x[0] === acct) hit += (+x[1] || 0) - (+x[2] || 0); });
    if (hit) { wait += hit; waitN += 1; }
  });

  const last = CH.last;
  const has = last !== null && last !== undefined && R && R.live;
  const diff = has ? last - book : null;
  const after = has ? last - (book + wait) : null;
  const why = [];
  if (has) {
    if (waitN) why.push("승인 전 " + waitN + "건 " + corpWon(wait) + "원");
    if (R.bankOnly && R.bankOnly.length) why.push("은행에만 " + R.bankOnly.length + "건");
    if (R.bookOnly && R.bookOnly.length) why.push("장부에만 " + R.bookOnly.length + "건");
    if (after) why.push("개시 미등록 " + corpWon(after) + "원 — 이 표가 시작되기 전부터 계좌에 있던 돈입니다");
  }
  return { ok: has, acct: acct, bank: last, book: book, wait: wait, waitN: waitN,
    after: has ? book + wait : null, diff: diff, afterDiff: after, open: CH.open,
    why: why, match: has && diff === 0, matchAfter: has && after === 0,
    none: !has ? (last === null || last === undefined ? "은행 내역에 잔액 열이 없습니다"
      : "반입된 은행 내역이 없습니다 — 맞춰 볼 상대가 없습니다") : "" };
}

/* ══════════════ ⑫ 기초 확정선 — 출발선은 전표가 아니라 선언이다 ══════════════
   조성래님 원칙(2026-11-15): 「9월말 재무확인원을 최종확정 재무제표 및 손익계산서로
   숫자를 확정하고, 10월~현재까지 은행거래내역서만을 전제로 전표를 발생시키되
   사람 책임자의 승인을 통해 확정시킨다. 분기말 마감회계처리 시 재조정이 가능하도록.」

   ⚠️ 기초를 **전표로 두지 않는다.** 전표로 두면 두 가지가 깨진다 —
     ① 반입 전표가 한 건이라도 생기면 코드 전표가 통째로 빠지면서 기초도 같이 증발한다
     ② 출발선과 거래가 구별되지 않아 역분개·마감·승인 흐름에 섞인다
   그래서 **별도 선언**으로 두고, 장부는 0이 아니라 그 선언에서 **출발**한다.

   ⚠️ 판(rev)을 쌓는다. 분기말에 고칠 때 기초를 **덮어쓰지 않고** 새 판을 얹는다 —
   지난 판이 남아야 「무엇이 언제 바뀌었는지」를 말할 수 있다.

   ⚠️ 기초도 **승인을 받는다.** 승인 전 판은 장부에 서지 않는다. 지금까지 개시 전표는
   「작성자 ≠ 승인자」 검사에서 예외였다 — 승인 규칙 밖에 있었다는 뜻이다. 그걸 없앤다. */
const CORP_OPEN_KEY = "hifin_corp_open";   /* dataCatalog.js 등재 필수 */

function corpOpenRead() {
  const empty = { v: 1, list: [] };
  try {
    const raw = localStorage.getItem(CORP_OPEN_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, list: Array.isArray(o.list) ? o.list : [] };
  } catch (e) { return empty; }
}
function corpOpenWrite(o) {
  try { localStorage.setItem(CORP_OPEN_KEY, JSON.stringify({ v: 1, list: (o && o.list) || [] })); return true; }
  catch (e) { return false; }
}
/* 지금 장부가 쓰는 판 — **승인된 것 중 가장 나중 것**. 승인 전 판은 쓰지 않는다. */
function corpOpenCur(o) {
  const L = ((o || corpOpenRead()).list || []).filter(function (x) { return x && x.ap; });
  if (!L.length) return null;
  return L.slice().sort(function (a, b) { return (+a.rev || 0) - (+b.rev || 0); }).pop();
}
/* 계정별 부호잔액 — 차변이 양수다. 승인된 판이 없으면 **빈 것**을 돌려준다(0 이 아니라 없음). */
function corpOpenBal(o) {
  const cur = corpOpenCur(o);
  if (!cur || !cur.bal) return {};
  const out = {};
  Object.keys(cur.bal).forEach(function (c) {
    const v = Math.round(+cur.bal[c] || 0);
    if (v) out[c] = v;
  });
  return out;
}
/* 기초도 차대가 맞아야 한다 — 안 맞으면 그 자체로 장부가 기울어 시작한다 */
function corpOpenSum(bal) {
  let dr = 0, cr = 0;
  Object.keys(bal || {}).forEach(function (c) {
    const v = +bal[c] || 0;
    if (v > 0) dr += v; else cr += -v;
  });
  return { dr: dr, cr: cr, gap: dr - cr, ok: dr - cr === 0, n: Object.keys(bal || {}).length };
}
/* 확정선 — 이 날짜까지는 **재무확인원이 이미 품고 있다**. 그 안쪽 전표는 받지 않는다. */
function corpOpenAsOf(o) {
  const cur = corpOpenCur(o);
  return (cur && /^\d{4}-\d{2}-\d{2}$/.test(String(cur.asOf || ""))) ? cur.asOf : "";
}
function corpOpenPass(o) {
  const S0 = o || corpOpenRead();
  const list = S0.list || [];
  const cur = corpOpenCur(S0);
  const bal = corpOpenBal(S0);
  const sum = corpOpenSum(bal);
  const rows = [
    { k: "has", ko: "확정된 기초가 있다", n: list.length, ok: !!cur,
      got: cur ? cur.asOf + " · " + sum.n + "과목" : (list.length ? "승인 전 " + list.length + "판" : "없음"),
      want: "승인된 판 1개 이상", skip: false,
      why: cur ? "" : (list.length ? "적어 두신 판이 있지만 아직 승인 전입니다 — 승인하셔야 장부가 그 숫자에서 출발합니다"
        : "기초를 아직 세우지 않았습니다 — 장부가 0에서 출발합니다") },
    { k: "bal", ko: "기초의 차변 = 대변", n: sum.n, ok: !cur || sum.ok,
      got: cur ? corpWon(sum.dr) + " / " + corpWon(sum.cr) : "기초 없음",
      want: "같을 것", skip: !cur,
      why: !cur ? "확정된 기초가 없어 검사하지 않았습니다" : (sum.ok ? "" : "기초가 " + corpWon(sum.gap) + "원 기울어 있습니다 — 재무확인원 숫자를 다시 보셔야 합니다") },
    { k: "src", ko: "어느 자료에서 왔는지 적혀 있다", n: cur ? 1 : 0, ok: !cur || !!String((cur && cur.src) || "").trim(),
      got: cur ? (cur.src || "안 적힘") : "기초 없음", want: "출처", skip: !cur,
      why: !cur ? "확정된 기초가 없어 검사하지 않았습니다"
        : (String(cur.src || "").trim() ? "" : "어느 확인원에서 온 숫자인지 적혀 있지 않습니다 — 나중에 누구도 되짚지 못합니다") },
    { k: "ap", ko: "사람이 승인했다", n: cur ? 1 : 0, ok: !cur || (!!cur.ap && cur.ap !== cur.by),
      got: cur ? ((cur.by || "?") + " 작성 / " + (cur.ap || "미승인") + " 승인") : "기초 없음",
      want: "작성자 ≠ 승인자", skip: !cur,
      why: !cur ? "확정된 기초가 없어 검사하지 않았습니다"
        : (cur.ap && cur.ap !== cur.by ? "" : "작성한 사람이 스스로 승인했습니다 — 기초도 전표와 같은 규칙을 집니다") },
  ];
  return { rows: rows, pass: rows.every(function (r) { return r.ok || r.skip; }),
    fail: rows.filter(function (r) { return !r.ok && !r.skip; }),
    zero: rows.filter(function (r) { return r.skip; }), cur: cur, bal: bal, sum: sum };
}

/* ── ⑫-2 재무확인원에서 기초 불러오기 ──────────────────────────────────────
   ⚠️ **숫자는 코드에 넣지 않는다.** 실제 회사 재무자료를 src/ 에 두면 공개 배포본에 실린다
   (조성래님이 세워 두신 규약). 그래서 여기 두는 것은 **과목 이름과 계정코드의 대응**뿐이고,
   금액은 조성래님 브라우저가 확인원 파일을 직접 읽어 채운다.

   ⚠️ 이름 대응은 **완전 일치**(공백 제거 후)다. 비슷한 이름을 넘겨짚지 않는다 —
   「예수금」과 「부가세예수금」처럼 한쪽이 다른 쪽을 품는 이름이 있어서다.
   다만 괄호 설명이 붙는 과목이 있어(개발비 등) 괄호 앞까지만 보고 맞춘다. */
const CORP_OPEN_MAP = [
  { w: "현금및현금등가물", c: "103", why: "확인원에 한 줄로만 있어 전액 보통예금에 둡니다 — 금고 시재가 따로 있으면 나눠 주세요" },
  { w: "외상매출금", c: "108" }, { w: "미수금", c: "114" }, { w: "선급금", c: "131" },
  { w: "가지급금", c: "134" }, { w: "부가세대급금", c: "135" }, { w: "상품", c: "146" },
  { w: "비품", c: "212" }, { w: "감가상각누계액", c: "213" }, { w: "개발비", c: "226" },
  { w: "임차보증금", c: "232" },
  { w: "외상매입금", c: "251" }, { w: "매입채무", c: "251" }, { w: "미지급금", c: "253" },
  { w: "예수금", c: "254" }, { w: "부가세예수금", c: "255" }, { w: "가수금", c: "257" },
  { w: "단기차입금", c: "260" }, { w: "미지급비용", c: "262" },
  { w: "자본금", c: "331" }, { w: "미처분이익잉여금", c: "375" }, { w: "이월이익잉여금", c: "375" },
];
/* 부채·자본은 대변이 정상이라 **부호를 뒤집어** 담는다(이 장부는 차변을 양수로 쓴다).
   감가상각누계액은 확인원이 이미 음수로 적으므로 그대로 둔다(자산 차감 계정). */
function corpOpenWord(s) {
  return String(s == null ? "" : s).split("(")[0].replace(/[\s\u00a0]/g, "")
    .replace(/[.·ⅠⅡⅢⅣⅤ]/g, "").replace(/^[0-9]+/, "");
}
function corpOpenFromRows(rows) {
  const out = {}, hit = [], miss = [];
  (rows || []).forEach(function (r) {
    const cells = (r || []).map(function (x) { return x; });
    const nm = corpOpenWord(cells[0] !== undefined && String(cells[0]).trim() ? cells[0] : cells[1]);
    if (!nm) return;
    const m = CORP_OPEN_MAP.find(function (x) { return x.w === nm; });
    if (!m) return;
    /* 금액은 그 줄에서 **처음 나오는 수**를 쓴다 — 당기 칸이 앞이고 전기 칸이 뒤다 */
    let v = null;
    for (let i = 1; i < cells.length; i++) {
      const n = Number(String(cells[i] == null ? "" : cells[i]).replace(/[,\s]/g, ""));
      if (String(cells[i] == null ? "" : cells[i]).trim() !== "" && isFinite(n)) { v = Math.round(n); break; }
    }
    if (v === null) { miss.push(nm); return; }
    const a = typeof corpAcct === "function" ? corpAcct(m.c) : null;
    /* 부채(L) · 자본(E)은 대변이 정상이라 뒤집는다.
       ⚠️ 감가상각누계액은 t=A 이고 확인원이 이미 음수로 적으므로 그대로 둔다. */
    const flip = a && (a.t === "L" || a.t === "E");
    const val = flip ? -v : v;
    if (out[m.c] === undefined) out[m.c] = 0;
    out[m.c] += val;
    hit.push({ c: m.c, n: a ? a.n : nm, v: val, why: m.why || "" });
  });
  const sum = corpOpenSum(out);
  return { bal: out, hit: hit, miss: miss, sum: sum };
}
