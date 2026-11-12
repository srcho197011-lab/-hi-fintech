/* ══════════════ 회계 엔진 — 실적 축(corpLedger.js) · CorpOps Phase 5 (조성래님 지시 2026-11-11) ══════════════
   재무「계획」축은 finBudget.js가 갖는다. 이 파일은 **실제로 일어난 거래**를 적는 장부다.
   두 축을 한 파일에 두지 않는다 — 계획과 실적이 같은 숫자처럼 보이는 순간 둘 다 못 믿게 된다.

   ⚠️ 이 파일의 전표는 **파일럿 전표**다 — 엔진이 맞게 도는지 확인하려고 넣은 검증용 묶음이고
      하이젠케어의 실제 장부가 아니다. 실제 회계자료 반입은 Phase 10이며 Phase 0(보안 선행)을
      통과한 뒤에만 시작한다. 화면도 러너도 이 사실을 숨기지 않는다(CORP_LEDGER_PILOT = true).

   원칙
     · 차변 합 ≠ 대변 합이면 **저장하지 않는다**. 경고가 아니라 거부다.
     · 전기(posted)된 전표는 고치지 않는다. 정정은 역분개 전표로만 남긴다 — 지운 자국이 남아야 장부다.
     · 작성자 ≠ 승인자. AI(핀테크)는 기표까지만 하고 승인 버튼을 누르지 못한다.
     · 마감한 달에는 새 전표가 들어가지 않는다.
     · 항등식은 화면과 러너가 **같은 함수**(corpLedgerIdentities)를 쓴다. 두 벌로 적으면 한 벌이 먼저 거짓말한다.
     · 클라이언트 강제다 — 서버가 없으므로 권한을 서버에서 막지 못한다. 화면에도 그렇게 적는다. */

const CORP_LEDGER_PILOT = true;              /* 실데이터 반입(P10) 시 false */
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

/* ── ② 파일럿 전표 ───────────────────────────────────────────────────────────
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
   파일럿 전표는 코드에 있고(항상 보인다), 조성래님이 넣은 전표만 브라우저에 남는다.
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
/* 파일럿 + 입력분. 날짜 → 전표번호 순으로 정렬한다(같은 날은 번호 순).
   ov는 **상태 덮어쓰기**다 — 파일럿 전표는 코드에 있어 고칠 수 없으므로, 조성래님이 결재를 진행한
   흔적만 따로 얹는다. 분개 줄은 덮지 않는다(금액을 덮으면 코드의 검증 묶음이 무너진다). */
function corpJvAll(st) {
  const ov = (st && st.ov) || {};
  const put = (j) => {
    const o = ov[j.id];
    if (!o) return j;
    return Object.assign({}, j, { st: o.st || j.st, ap: o.ap === undefined ? j.ap : o.ap });
  };
  const add = ((st && st.jv) || []).map(put);
  /* 반입된 실제 전표가 하나라도 있으면 파일럿을 빼고 **실제 장부만** 본다.
     섞으면 재무제표가 검증용 숫자를 품은 채 나와 그 자체로 거짓이 된다. */
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
   파일럿 전표는 JV-####로 남겨 둔다 — 번호만 봐도 검증용인지 실제 장부인지 갈린다. */
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
/* 실제 장부가 들어오면 파일럿은 빠진다 — 검증용과 실제를 한 표에 섞지 않는다. */
function corpJvLive(st) { return ((st && st.jv) || []).length > 0; }
/* 은행 내역도 반입분이 있으면 그것을 본다.
   ⚠️ 실제 전표를 **파일럿 은행 내역**과 대사하면 전건이 미대사로 뜬다 — 거짓 경보다.
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
function corpLedgerBook(jvs, upto) {
  const map = {};
  CORP_ACCT.forEach(a => { map[a.c] = { c: a.c, n: a.n, t: a.t, d: a.d, contra: !!a.contra, dr: 0, cr: 0, lines: [] }; });
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
     여기서 파일럿 내역으로 되돌리면 **반입된 실제 전표를 파일럿 은행줄과 대사**하게 되고,
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
    /* ⚠️ 이 대조는 **계좌 전체를 덮는 표**라야 뜻이 있다. 검증용 묶음은 일부러 미대사를 품고
       있어서, 그 표의 마지막 잔액을 장부와 견주면 늘 어긋난다 — 그걸 실패로 세면
       사람이 「원래 빨간 것」으로 배우고, 진짜 어긋날 때 아무도 안 본다. */
    { k: "balmatch", ko: "은행 마지막 잔액 = 장부 보통예금", n: (CH.last === null || !R.live) ? 0 : 1,
      ok: CH.last !== null && R.live && CH.last === Math.round(bookBal),
      got: CH.last === null ? "잔액 없음" : corpWon(CH.last) + " / " + corpWon(bookBal),
      want: "같을 것", skip: CH.last === null || !R.live,
      why: CH.last === null ? "은행 내역에 잔액이 없습니다 — 대조할 상대가 없어 검사하지 않았습니다"
        : (!R.live ? "지금 보고 있는 것은 검증용 은행 묶음입니다(계좌 전체가 아닙니다) — 반입된 실제 내역에서만 대조합니다" : "") },
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
  { id: "조성래", ko: "조성래", role: "CEO · 회계팀 책임자", ai: false, canApprove: true },
  { id: "핀테크", ko: "핀테크", role: "AI 팀장", ai: true, canApprove: false },
];
function corpActor(id) { return CORP_ACTORS.find(a => a.id === id) || CORP_ACTORS[0]; }
