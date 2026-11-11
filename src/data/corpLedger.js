/* ══════════════ 회계 엔진 — 실적 축(corpLedger.js) · CorpOps Phase 5 (형 지시 2026-11-11) ══════════════
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

/* ── ① 계정과목 ──────────────────────────────────────────────────────────────
   t: A 자산 · L 부채 · E 자본 · R 수익 · X 비용
   d: 정상잔액 방향(D 차변 / C 대변) — 표시에만 쓴다. 집계는 부호(차−대)로 한다.
   contra: 차감 계정(감가상각누계액) — 자산이지만 정상잔액이 대변이다. */
const CORP_ACCT = [
  { c: "101", n: "현금",           t: "A", d: "D" },
  { c: "103", n: "보통예금",        t: "A", d: "D", bank: true },
  { c: "108", n: "외상매출금",      t: "A", d: "D" },
  { c: "135", n: "부가세대급금",     t: "A", d: "D" },
  { c: "176", n: "임차보증금",      t: "A", d: "D" },
  { c: "212", n: "비품",           t: "A", d: "D" },
  { c: "213", n: "감가상각누계액",   t: "A", d: "C", contra: true },
  { c: "226", n: "소프트웨어",      t: "A", d: "D" },

  { c: "253", n: "미지급금",        t: "L", d: "C" },
  { c: "254", n: "예수금",          t: "L", d: "C" },
  { c: "255", n: "부가세예수금",     t: "L", d: "C" },
  { c: "260", n: "단기차입금",      t: "L", d: "C" },
  { c: "262", n: "미지급비용",      t: "L", d: "C" },

  { c: "331", n: "자본금",          t: "E", d: "C" },
  { c: "341", n: "주식발행초과금",   t: "E", d: "C" },
  { c: "375", n: "이월이익잉여금",   t: "E", d: "C" },

  { c: "401", n: "용역매출",        t: "R", d: "C" },
  { c: "411", n: "기타수익",        t: "R", d: "C" },

  { c: "801", n: "급여",           t: "X", d: "D" },
  { c: "811", n: "복리후생비",      t: "X", d: "D" },
  { c: "812", n: "여비교통비",      t: "X", d: "D" },
  { c: "813", n: "접대비",          t: "X", d: "D" },
  { c: "814", n: "통신비",          t: "X", d: "D" },
  { c: "817", n: "세금과공과",      t: "X", d: "D" },
  { c: "818", n: "감가상각비",      t: "X", d: "D" },
  { c: "819", n: "임차료",          t: "X", d: "D" },
  { c: "821", n: "보험료",          t: "X", d: "D" },
  { c: "825", n: "교육훈련비",      t: "X", d: "D" },
  { c: "826", n: "도서인쇄비",      t: "X", d: "D" },
  { c: "830", n: "지급수수료",      t: "X", d: "D" },
  { c: "833", n: "광고선전비",      t: "X", d: "D" },
  { c: "848", n: "잡비",           t: "X", d: "D" },
  { c: "901", n: "이자비용",        t: "X", d: "D" },
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
    ["103", 120000000, 0, "보통예금 개시"], ["176", 20000000, 0, "사무실 보증금"], ["212", 12000000, 0, "비품"],
    ["213", 0, 2000000, "감가상각누계액"], ["331", 0, 100000000, "자본금"], ["341", 0, 40000000, "주식발행초과금"],
    ["375", 0, 10000000, "이월이익잉여금"]] },

  { id: "JV-0002", d: "2026-09-05", desc: "9월 사무실 임차료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["819", 3000000, 0, "9월분"], ["135", 300000, 0, "매입세액"], ["103", 0, 3300000, "이체"]] },
  { id: "JV-0003", d: "2026-09-10", desc: "8월분 급여 지급", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["801", 18000000, 0, "8월 급여"], ["254", 0, 1620000, "소득세·4대보험"], ["103", 0, 16380000, "이체"]] },
  { id: "JV-0004", d: "2026-09-15", desc: "용역매출 — 가온헬스", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["108", 22000000, 0, "세금계산서 발행"], ["401", 0, 20000000, "건강관리 운영 용역"], ["255", 0, 2000000, "매출세액"]] },
  { id: "JV-0005", d: "2026-09-20", desc: "클라우드·회선 이용료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["830", 1200000, 0, "9월"], ["135", 120000, 0, "매입세액"], ["103", 0, 1320000, "자동이체"]] },
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
  { id: "JV-0014", d: "2026-10-15", desc: "용역매출 — 나래라이프", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["108", 33000000, 0, "세금계산서 발행"], ["401", 0, 30000000, "보장분석 용역"], ["255", 0, 3000000, "매출세액"]] },
  { id: "JV-0015", d: "2026-10-18", desc: "업무용 소프트웨어 구입", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["226", 6000000, 0, "연간 라이선스"], ["135", 600000, 0, "매입세액"], ["253", 0, 6600000, "익월 결제"]] },
  { id: "JV-0016", d: "2026-10-20", desc: "클라우드·회선 이용료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["830", 1200000, 0, "10월"], ["135", 120000, 0, "매입세액"], ["103", 0, 1320000, "자동이체"]] },
  { id: "JV-0017", d: "2026-10-22", desc: "교육훈련비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["825", 900000, 0, "직무 교육"], ["103", 0, 900000, "이체"]] },
  { id: "JV-0018", d: "2026-10-25", desc: "보험료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["821", 450000, 0, "사업장 화재보험"], ["103", 0, 450000, "이체"]] },
  { id: "JV-0019", d: "2026-10-25", desc: "도서인쇄비", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["826", 180000, 0, "자료 인쇄"], ["101", 0, 180000, "현금"]] },
  { id: "JV-0020", d: "2026-10-31", desc: "10월 감가상각", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["818", 200000, 0, "비품 정액법"], ["213", 0, 200000, "누계액 가산"]] },

  { id: "JV-0021", d: "2026-11-03", desc: "미지급금 결제 — 소프트웨어", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["253", 6600000, 0, "10/18 건"], ["103", 0, 6600000, "이체"]] },
  { id: "JV-0022", d: "2026-11-05", desc: "11월 사무실 임차료", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["819", 3000000, 0, "11월분"], ["135", 300000, 0, "매입세액"], ["103", 0, 3300000, "이체"]] },
  { id: "JV-0023", d: "2026-11-06", desc: "외상매출금 회수 — 나래라이프", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["103", 33000000, 0, "입금"], ["108", 0, 33000000, "10/15 건"]] },
  { id: "JV-0024", d: "2026-11-07", desc: "예금 이자", by: "핀테크", ap: "조성래", st: "posted", l: [
    ["103", 85000, 0, "이자 입금"], ["411", 0, 85000, "이자수익"]] },
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
  lines: [
    { d: "2026-09-01", a: 120000000, m: "개시 잔액" },
    { d: "2026-09-05", a: -3300000, m: "임대인 이체" },
    { d: "2026-09-10", a: -16380000, m: "급여 이체" },
    { d: "2026-09-20", a: -1320000, m: "클라우드 자동이체" },
    { d: "2026-09-25", a: -1650000, m: "법인카드 결제" },
    { d: "2026-10-05", a: 22000000, m: "가온헬스 입금" },
    { d: "2026-10-05", a: -3300000, m: "임대인 이체" },
    { d: "2026-10-10", a: -16380000, m: "급여 이체" },
    { d: "2026-10-10", a: -1620000, m: "세무서·공단 납부" },
    { d: "2026-10-12", a: -5500000, m: "광고 집행" },
    { d: "2026-10-20", a: -1320000, m: "클라우드 자동이체" },
    { d: "2026-10-22", a: -900000, m: "교육기관 이체" },
    { d: "2026-10-25", a: -450000, m: "보험료 이체" },
    { d: "2026-11-03", a: -6600000, m: "소프트웨어 대금" },
    { d: "2026-11-05", a: -3300000, m: "임대인 이체" },
    { d: "2026-11-06", a: 33000000, m: "나래라이프 입금" },
    { d: "2026-11-07", a: 85000, m: "이자" },
    { d: "2026-11-09", a: -3000, m: "타행이체수수료" },
    { d: "2026-11-10", a: -16380000, m: "급여 이체" },
    { d: "2026-11-10", a: -1620000, m: "세무서·공단 납부" },
    { d: "2026-11-10", a: 500000, m: "입금 — 보낸이 확인 필요" },
  ],
};

/* ── ④ 저장 ──────────────────────────────────────────────────────────────────
   파일럿 전표는 코드에 있고(항상 보인다), 형이 넣은 전표만 브라우저에 남는다.
   서버가 없으므로 이 브라우저 밖으로는 나가지 않는다 — 화면에도 그렇게 적는다. */
function corpLedgerRead() {
  const empty = { v: 1, jv: [], closed: [], ov: {} };
  try {
    const raw = localStorage.getItem(CORP_LEDGER_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, jv: Array.isArray(o.jv) ? o.jv : [], closed: Array.isArray(o.closed) ? o.closed : [],
      ov: (o.ov && typeof o.ov === "object") ? o.ov : {} };
  } catch (e) { return empty; }
}
function corpLedgerWrite(st) {
  try {
    localStorage.setItem(CORP_LEDGER_KEY, JSON.stringify({ v: 1, jv: st.jv || [], closed: st.closed || [], ov: st.ov || {} }));
    return true;
  } catch (e) { return false; }
}
/* 파일럿 + 입력분. 날짜 → 전표번호 순으로 정렬한다(같은 날은 번호 순).
   ov는 **상태 덮어쓰기**다 — 파일럿 전표는 코드에 있어 고칠 수 없으므로, 형이 결재를 진행한
   흔적만 따로 얹는다. 분개 줄은 덮지 않는다(금액을 덮으면 코드의 검증 묶음이 무너진다). */
function corpJvAll(st) {
  const ov = (st && st.ov) || {};
  const put = (j) => {
    const o = ov[j.id];
    if (!o) return j;
    return Object.assign({}, j, { st: o.st || j.st, ap: o.ap === undefined ? j.ap : o.ap });
  };
  return CORP_JV_SEED.map(put).concat(((st && st.jv) || []).map(put))
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
function corpJvNextId(st) {
  let max = 0;
  corpJvAll(st).forEach(j => { const m = /^JV-(\d+)$/.exec(j.id || ""); if (m && +m[1] > max) max = +m[1]; });
  return "JV-" + String(max + 1).padStart(4, "0");
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
  return { ok: e.length === 0, errs: e, sum: s };
}
/* 역분개 — 전기된 전표를 고치는 유일한 길. 차·대를 뒤집은 새 전표를 만든다. */
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
  const B = bank || CORP_BANK_SEED;
  const acct = B.acct || "103";
  const book = [];
  corpPosted(jvs, upto).forEach(j => {
    let net = 0, hit = false;
    (j.l || []).forEach(x => { if (x[0] === acct) { net += (+x[1] || 0) - (+x[2] || 0); hit = true; } });
    if (hit && net !== 0) book.push({ id: j.id, d: j.d, desc: j.desc, a: net, used: false });
  });
  const bl = (B.lines || []).filter(l => !upto || l.d <= upto).map(l => ({ d: l.d, a: l.a, m: l.m, used: false, jv: null }));
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
    acct: acct, bank: B.bank, mask: B.mask, lines: bl, book: book,
    matched: bl.filter(l => l.used).length, bankOnly: bankOnly, bookOnly: bookOnly,
    bankBal: bankBal, bookBal: bookBal, bankOnlyNet: bankOnlyNet, bookOnlyNet: bookOnlyNet,
    /* 대사 항등식: 장부잔액 − 은행잔액 = 장부에만 있는 순액 − 은행에만 있는 순액 */
    gap: (bookBal - bankBal) - (bookOnlyNet - bankOnlyNet),
    ok: ((bookBal - bankBal) - (bookOnlyNet - bankOnlyNet)) === 0,
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
  const bad = posted.filter(j => !corpJvSum(j).ok);
  const unknown = [];
  all.forEach(j => (j.l || []).forEach(x => { if (!corpAcct(x[0])) unknown.push(j.id + " / " + x[0]); }));
  const seen = {}, dupes = [];
  all.forEach(j => { if (seen[j.id]) dupes.push(j.id); seen[j.id] = 1; });
  const selfAp = posted.filter(j => !j.open && j.ap && j.by === j.ap);
  const noAp = posted.filter(j => !j.ap);

  return [
    { k: "jv",      ko: "전표별 차대 일치",         n: posted.length,       ok: bad.length === 0,     got: bad.length + "건 불일치", want: "0건" },
    { k: "trial",   ko: "시산표 차변 = 대변",       n: S.trial.rows.length, ok: S.trial.ok,           got: corpWon(S.trial.drSum) + " / " + corpWon(S.trial.crSum), want: "같을 것" },
    { k: "bs",      ko: "자산 = 부채 + 자본 + 손익", n: S.bs.A.length,       ok: S.bs.ok,              got: corpWon(S.bs.assets) + " / " + corpWon(S.bs.total), want: "같을 것" },
    { k: "pl",      ko: "손익 = 수익 − 비용",       n: S.pl.R.length + S.pl.X.length, ok: S.pl.net === S.pl.rev - S.pl.exp, got: corpWon(S.pl.net), want: corpWon(S.pl.rev - S.pl.exp) },
    { k: "bank",    ko: "은행 대사 차이 해소",       n: R.lines.length,      ok: R.ok,                 got: corpWon(R.gap), want: "0" },
    { k: "acct",    ko: "미등록 계정 0건",          n: all.length,          ok: unknown.length === 0, got: unknown.length + "건", want: "0건" },
    { k: "dupe",    ko: "전표번호 중복 0건",         n: all.length,          ok: dupes.length === 0,   got: dupes.length + "건", want: "0건" },
    { k: "approve", ko: "작성자 ≠ 승인자",          n: posted.filter(j => !j.open).length, ok: selfAp.length === 0, got: selfAp.length + "건 동일인", want: "0건" },
    { k: "signed",  ko: "전기 전표에 승인자 기록",    n: posted.length,       ok: noAp.length === 0,    got: noAp.length + "건 누락", want: "0건" },
  ];
}
/* 전건 통과 여부 — 분모 0은 실패로 센다. 빈 장부가 조용히 통과하면 검사가 없는 것과 같다. */
function corpLedgerVerdict(jvs, bank, upto) {
  const rows = corpLedgerIdentities(jvs, bank, upto);
  const zero = rows.filter(r => !(r.n > 0));
  const fail = rows.filter(r => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
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
