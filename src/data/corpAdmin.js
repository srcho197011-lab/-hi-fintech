/* ══════════════ 인사 · 계약 · 문서(corpAdmin.js) · CorpOps Phase 8 (형 지시 2026-11-12) ══════════════
   인사총무팀(M3)의 두 지면과 경영기획팀(M1)의 계약 대장이 쓰는 단일 원천.

   ⚠️ 주민등록번호 — 형 확정 2026-11-12
     근로소득 원천징수와 4대보험 취득신고에 법정 필수 기재사항이라 **필드를 둔다.**
     다만 **값은 이 시스템이 들지 않는다.** 고유식별정보라 저장 시 암호화가 법정 의무인데
     백엔드가 없다. localStorage는 평문이고, 브라우저 JS 암호화는 키가 같은 자리에 있어
     암호화가 아니다. 그래서 하이핀은 보유 여부 · 수집 근거 · 보관 위치와 책임자 ·
     열람 이력 · 파기 예정일까지만 든다. 값은 세무대리인이 들거나, 데이터 금고가 선 뒤에 담는다.
     **값을 담는 필드를 만들지 않았다** — 러너가 그 부재를 단언한다.
     값을 담으려면 넷이 먼저 선다: 암호화 저장소 · 처리 근거 고지 · 접근 통제 · 파기 절차.

   그 밖의 원칙
     · 수집하지 않는 것이 통제다. 주소 · 생년월일 · 개인 연락처는 직무 수행에 필요하지 않아 두지 않는다.
       자격증은 **보유 사실**까지만 적고 번호는 받지 않는다 — 번호 자체가 식별자다.
     · 사번은 기존 체계와 겹치지 않는 대역을 쓴다. 8H(프로)·1H·2H·3H(운영본부)와 겹치면
       그 사람의 활동이 프로 실적에 합산되거나 운영본부 범위가 열린다.
     · 보존기한은 **법령에서 온다.** 이 표는 아직 원문 대조를 거치지 않았으므로 「원문 미확인」을 단다 —
       확인하지 않은 조문 번호를 화면에 찍지 않는다(저장소 규약).
     · 만료 경보는 **고정 날짜를 주입해** 계산한다. 벽시계를 쓰면 러너가 날마다 다른 답을 낸다. */

const CORP_HR_PREFIX = "9C";   /* 사내 직원 대역 — 8H(프로) · 1H/2H/3H(운영본부)와 겹치지 않는다 */

/* ── ① 주민등록번호 보관 — 값이 들어갈 자리를 두지 않는다 ────────────────
   need   그 자리가 주민번호를 필요로 하는가(근로소득·4대보험)
   basis  처리 근거. 비면 그 자체가 결함이다 — 근거 없는 처리는 금지다.
   held   하이핀이 **값**을 들고 있는가. 지금 구조에서는 늘 false다.
   where  값을 든 곳과 책임자. 모르면 그게 사고다.
   access 열람 이력. 누가 언제 왜 봤는지. */
function corpRrnSlot(where, by) {
  return {
    need: true,
    basis: ["근로소득 원천징수", "4대보험(건강·연금·고용·산재) 취득신고"],
    held: false,                       /* 값은 이 시스템에 담지 않는다 */
    where: where || "", by: by || "",
    collectedAt: "", disposeAt: "",
    access: [],
  };
}
/* 값을 담을 수 있게 되는 조건 — 넷이 다 서야 한다. 셋만 서면 담지 않는다. */
const CORP_RRN_GATE = [
  { k: "enc", ko: "암호화 저장소", ok: false, d: "고유식별정보는 저장 시 암호화가 법정 의무입니다 — 서버가 필요합니다" },
  { k: "notice", ko: "처리 근거 고지", ok: false, d: "수집 목적·항목·보유기간을 본인에게 알리고 받은 기록이 있어야 합니다" },
  { k: "acl", ko: "접근 통제", ok: false, d: "누가 볼 수 있는지가 서버에서 막혀야 합니다 — 화면에서만 막는 것은 통제가 아닙니다" },
  { k: "dispose", ko: "파기 절차", ok: false, d: "보유기간이 끝나면 복구 불가능하게 지우는 경로가 있어야 합니다" },
];

/* ── ② 인사 기록 — 직무 정보만 ───────────────────────────────────────
   담는 것: 성명 · 사번 · 직위 · 소속 · 전문영역 · 자격증 보유 사실 · 합류일
   담지 않는 것: 주민번호 값 · 주소 · 생년월일 · 개인 연락처 · 자격증 번호 · 평가 · 급여액 */
const CORP_HR = [
  { no: "9C0001", name: "조성래", title: "CEO", teams: ["M1", "M2", "M3"], joined: "2026-01-02", on: true,
    expertise: ["사업기획", "재무회계", "인사총무", "투자 유치"], certs: [],
    rrn: corpRrnSlot("세무대리인", "미지정") },
  { no: "9C0002", name: "조예원", title: "수석매니저", teams: ["K1"], joined: "2026-10-01", on: true,
    expertise: ["브랜드", "콘텐츠", "채널 운영", "성과 분석"], certs: [],
    rrn: corpRrnSlot("세무대리인", "미지정") },
  { no: "", name: "전소윤", title: "센터장", teams: ["H1"], joined: "", on: false,
    expertise: ["건강관리 운영", "상담 품질", "검진 연계"], certs: [], rrn: null },
  { no: "", name: "문형석", title: "센터장", teams: ["H2"], joined: "", on: false,
    expertise: ["보장 설계", "청구 지원", "보장 갭 분석"], certs: [], rrn: null },
  { no: "", name: "박원식", title: "CTO", teams: ["D1"], joined: "", on: false,
    expertise: ["데이터 구조", "외부 연동", "품질 관리"], certs: [], rrn: null },
  { no: "", name: "김남용", title: "보안담당이사", teams: ["S1"], joined: "", on: false,
    expertise: ["보안 통제", "침해 대응", "내부통제"], certs: [], rrn: null },
];

/* ── ③ 계약 대장 ──────────────────────────────────────────────────────
   kind  임대차 · 용역 · 라이선스 · 근로 · 투자 · 제휴
   to    만료일. **비우면 등록을 거부한다** — 만료일 없는 계약은 경보를 세울 수 없다.
   auto  자동갱신 여부. 자동갱신이어도 경보는 그대로 울린다(조건이 바뀌는 자리다).
   doc   문서 분류 코드(CORP_DOC_CLASS). 계약과 문서를 잇는 자리. */
const CORP_CT = [
  { id: "ct1", ko: "사무실 임대차", party: "임대인", kind: "임대차", owner: "M1",
    from: "2026-09-01", to: "2027-08-31", amount: 3000000, cycle: "월", auto: false,
    doc: "contract", note: "보증금 2,000만원 · 전표 819 임차료와 짝" },
  { id: "ct2", ko: "업무용 소프트웨어 라이선스", party: "공급사", kind: "라이선스", owner: "D1",
    from: "2026-10-18", to: "2027-10-17", amount: 6000000, cycle: "연", auto: true,
    doc: "contract", note: "자동갱신 — 갱신 전 조건 재확인 필요 · 전표 226 소프트웨어와 짝" },
  { id: "ct3", ko: "클라우드·회선 이용", party: "공급사", kind: "용역", owner: "D1",
    from: "2026-09-01", to: "2026-12-31", amount: 1200000, cycle: "월", auto: true,
    doc: "contract", note: "전표 830 지급수수료와 짝" },
  { id: "ct4", ko: "용역 공급 — 가온헬스", party: "고객", kind: "용역", owner: "M1",
    from: "2026-09-01", to: "2027-02-28", amount: 20000000, cycle: "건", auto: false,
    doc: "contract", note: "전표 401 용역매출과 짝" },
  { id: "ct5", ko: "용역 공급 — 나래라이프", party: "고객", kind: "용역", owner: "M1",
    from: "2026-10-01", to: "2027-09-30", amount: 30000000, cycle: "건", auto: false,
    doc: "contract", note: "전표 401 용역매출과 짝" },
  { id: "ct6", ko: "사업장 화재보험", party: "보험사", kind: "용역", owner: "M3",
    from: "2026-10-25", to: "2027-10-24", amount: 450000, cycle: "연", auto: false,
    doc: "contract", note: "전표 821 보험료와 짝" },
];

/* 만료 경보 단계 — 경과를 따로 둔다. 「임박」에 묻으면 이미 지난 건이 안 보인다. */
const CORP_CT_ALERT = [
  { k: "over", ko: "만료 경과", d: 0, c: "#D9544A" },
  { k: "d7", ko: "7일 이내", d: 7, c: "#D9544A" },
  { k: "d30", ko: "30일 이내", d: 30, c: "#E0A33F" },
  { k: "d90", ko: "90일 이내", d: 90, c: "#D99A5A" },
  { k: "ok", ko: "여유", d: 99999, c: "#5FAE7E" },
];

/* ── ④ 문서 분류 · 보존기한 ───────────────────────────────────────────
   ⚠️ **두 축을 가른다** — 섞으면 「법이 그렇다」와 「우리가 그렇게 하기로 했다」가 한 숫자가 된다.
   years    **법정 연한**(통설). 법령 원문 대조 전이다.
   basisKo  근거가 되는 법률의 이름. ⚠️ 조문 번호는 적지 않는다 —
            확인하지 않은 조문을 화면에 찍지 않는 것이 이 저장소의 규약이다.
   checked  원문 대조 여부. 화면이 그 사실을 배지로 단다.
   keep     **회사 보존 정책**. 대표가 정한 연한이다. 없으면 null(미정)이고, 있으면 keepBy가 있어야 한다.
   keepBy   누가 언제 정했는가. 비면 정책이 아니라 누군가의 메모다. */
const CORP_DOC_CLASS = [
  /* 재무제표는 장부와 **다른 분류**다 — 대표가 영구보관으로 정했다.
     한 분류에 묶어 두면 10년 뒤 장부를 버릴 때 재무제표가 함께 버려진다. */
  { k: "fs", ko: "재무제표 · 확인원", years: 10, basisKo: "상법(상업장부)", checked: false,
    keep: 0, keepBy: "대표 확정 2026-11-12 — 영구보관",
    ex: "재무제표확인원 · 재무상태표 · 손익계산서 · 세무조정계산서 · 이익잉여금처분계산서" },
  { k: "acct", ko: "회계장부 · 전표", years: 10, basisKo: "상법(상업장부)", checked: false,
    keep: 10, keepBy: "대표 확정 2026-11-12",
    ex: "분개장 · 총계정원장 · 전표 · 증빙 · 은행 거래내역" },
  /* 세무 신고 자료는 법정 연한이 5년이지만 회계자료와 함께 보관한다 —
     「회계자료는 10년」이라는 대표 확정을 같은 묶음에 적용했다. 다르게 보시면 고친다. */
  { k: "tax", ko: "세무 신고 자료", years: 5, basisKo: "국세기본법", checked: false,
    keep: 10, keepBy: "대표 확정 2026-11-12 — 회계자료와 함께 보관",
    ex: "부가세 · 법인세 · 원천징수 신고서" },
  { k: "contract", ko: "계약서", years: 10, basisKo: "상법 · 민법(소멸시효)", checked: false, keep: null, keepBy: "",
    ex: "임대차 · 용역 · 라이선스 · 투자 · 제휴" },
  { k: "hr", ko: "근로자 명부 · 근로계약", years: 3, basisKo: "근로기준법", checked: false, keep: null, keepBy: "",
    ex: "명부 · 근로계약서 · 임금대장 · 근태" },
  { k: "corp", ko: "법인 등기 · 정관", years: 0, basisKo: "상법(영구 보존)", checked: false, keep: null, keepBy: "",
    ex: "정관 · 등기부 · 주주명부 · 이사회 의사록" },
  { k: "privacy", ko: "개인정보 처리 기록", years: 3, basisKo: "개인정보보호법", checked: false, keep: null, keepBy: "",
    ex: "동의 기록 · 파기 기록 · 열람 요구 처리" },
  { k: "access", ko: "접속기록", years: 2, basisKo: "개인정보보호법(안전성 확보조치)", checked: false, keep: null, keepBy: "",
    ex: "시스템 접속 로그" },
  { k: "fin", ko: "금융소비자 보호 자료", years: 10, basisKo: "금융소비자보호법", checked: true, keep: null, keepBy: "",
    ex: "설명 의무 이행 기록 · 광고 자료" },
];

/* 보존 연한 표기 — **0은 영구**다. 이 둘을 함수로 묶어 두지 않으면 자리마다 falsy 판정을 하다 틀린다. */
function corpKeepSet(d) { return !!d && d.keep !== null && d.keep !== undefined; }
function corpKeepKo(d) { return !corpKeepSet(d) ? "미정" : (d.keep === 0 ? "영구" : d.keep + "년"); }
function corpYearsKo(y) { return y === null || y === undefined ? "—" : (y === 0 ? "영구" : y + "년"); }
/* 파기 예정일 — 회사 보존 정책이 있을 때만 센다. 영구는 파기하지 않는다. */
function corpDisposeAt(d, cls) {
  if (!corpKeepSet(cls) || cls.keep === 0) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ""));
  if (!m) return "";
  return (Number(m[1]) + cls.keep) + "-" + m[2] + "-" + m[3];
}

/* ── ⑤ 시각 — 고정 날짜를 주입할 수 있어야 한다 ──────────────────────── */
function corpAdminDays(fromIso, now) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromIso || "");
  if (!m || !now) return null;
  const a = new Date(+m[1], +m[2] - 1, +m[3]);
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}
function corpCtAlert(ct, now) {
  const d = corpAdminDays(ct.to, now);
  if (d === null) return { k: "none", ko: "만료일 없음", d: null, c: "#8B8B94" };
  const a = CORP_CT_ALERT.find((x) => (x.k === "over" ? d < 0 : d <= x.d)) || CORP_CT_ALERT[CORP_CT_ALERT.length - 1];
  return { k: a.k, ko: a.ko, d: d, c: a.c };
}
/* 등록 검사 — 만료일 없는 계약은 **등록 자체를 거부한다**(면제 규약의 선례 그대로) */
function corpCtCheck(ct) {
  const e = [];
  if (!(ct.ko || "").trim()) e.push("계약 이름이 비었습니다");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ct.to || "")) e.push("만료일이 없습니다 — 만료일 없는 계약은 경보를 세울 수 없어 등록하지 않습니다");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ct.from || "")) e.push("개시일이 없습니다");
  if (ct.from && ct.to && ct.from > ct.to) e.push("개시일이 만료일보다 뒤입니다");
  if (!CORP_DOC_CLASS.some((d) => d.k === ct.doc)) e.push("문서 분류가 분류표에 없습니다");
  return { ok: e.length === 0, errs: e };
}

/* ── ⑥ 집계 ──────────────────────────────────────────────────────────── */
function corpHrOn() { return CORP_HR.filter((h) => h.on); }
function corpHrOf(team) { return CORP_HR.filter((h) => h.teams.indexOf(team) >= 0); }
function corpRrnOpen() {
  /* 주민번호가 필요한데 보관 위치나 책임자가 비어 있는 사람 — 그게 사고다 */
  return corpHrOn().filter((h) => h.rrn && h.rrn.need && (!h.rrn.where || !h.rrn.by || h.rrn.by === "미지정"));
}

/* ── ⑦ 단언 — 화면과 러너가 같은 함수를 부른다 ───────────────────────
   「필드 부재」는 음성 명제다. 0건을 그냥 통과시키지 않으려면 **분모**가 필요하다 —
   검사 대상 사람 수와 패턴 수를 함께 센다. */
const CORP_HR_BAN = ["rrnValue", "rrnNo", "jumin", "ssn", "birth", "birthday", "addr", "address", "phone", "mobile", "tel", "email", "salary", "pay", "eval"];
function corpAdminVerdict(now) {
  const people = CORP_HR.length;
  const on = corpHrOn().length;
  /* 금지 필드가 레코드에 실제로 없는가 — 사람마다 전수로 본다 */
  const leak = [];
  CORP_HR.forEach((h) => {
    CORP_HR_BAN.forEach((k) => { if (Object.prototype.hasOwnProperty.call(h, k)) leak.push(h.name + "." + k); });
    if (h.rrn) CORP_HR_BAN.forEach((k) => { if (Object.prototype.hasOwnProperty.call(h.rrn, k)) leak.push(h.name + ".rrn." + k); });
  });
  const held = CORP_HR.filter((h) => h.rrn && h.rrn.held);
  const noBasis = CORP_HR.filter((h) => h.rrn && h.rrn.need && !(h.rrn.basis || []).length);
  const certNo = CORP_HR.filter((h) => (h.certs || []).some((c) => /\d{4,}/.test(String(c))));
  const dupNo = (function () { const s = {}, d = []; CORP_HR.forEach((h) => { if (h.no) { if (s[h.no]) d.push(h.no); s[h.no] = 1; } }); return d; })();
  const badNo = corpHrOn().filter((h) => !new RegExp("^" + CORP_HR_PREFIX + "\\d{4}$").test(h.no || ""));
  const badCt = CORP_CT.filter((c) => !corpCtCheck(c).ok);
  const noClass = CORP_CT.filter((c) => !CORP_DOC_CLASS.some((d) => d.k === c.doc));
  const alerts = now ? CORP_CT.map((c) => corpCtAlert(c, now)) : [];
  const gateOpen = CORP_RRN_GATE.filter((g) => g.ok);

  return [
    { k: "people", ko: "인사 레코드 존재", n: people, ok: people > 0, got: people + "명(재직 " + on + ")", want: "> 0" },
    { k: "ban", ko: "금지 필드 부재", n: people * CORP_HR_BAN.length, ok: leak.length === 0, got: leak.length + "건", want: "0건" },
    { k: "held", ko: "주민번호 값 미보유", n: corpHrOn().length, ok: held.length === 0, got: held.length + "명 보유", want: "0명" },
    { k: "basis", ko: "주민번호 처리 근거 기재", n: corpHrOn().length, ok: noBasis.length === 0, got: noBasis.length + "명 누락", want: "0명" },
    { k: "gate", ko: "값 보관 조건 미충족 — 담지 않음", n: CORP_RRN_GATE.length, ok: gateOpen.length < CORP_RRN_GATE.length && held.length === 0, got: gateOpen.length + " / " + CORP_RRN_GATE.length + " 충족", want: "넷 다 서야 담는다" },
    { k: "cert", ko: "자격증 번호 미수집", n: CORP_HR.reduce((n, h) => n + (h.certs || []).length, 0) + 1, ok: certNo.length === 0, got: certNo.length + "건", want: "0건" },
    { k: "no", ko: "사번 대역 · 중복", n: on, ok: dupNo.length === 0 && badNo.length === 0, got: "중복 " + dupNo.length + " · 대역 밖 " + badNo.length, want: CORP_HR_PREFIX + "####" },
    { k: "ct", ko: "계약 등록 검사", n: CORP_CT.length, ok: badCt.length === 0, got: badCt.length + "건 결함", want: "0건" },
    { k: "ctclass", ko: "계약마다 문서 분류", n: CORP_CT.length, ok: noClass.length === 0, got: noClass.length + "건 미분류", want: "0건" },
    { k: "alert", ko: "만료 경보 산출", n: alerts.length, ok: alerts.every((a) => a.k !== "none"), got: alerts.filter((a) => a.k === "none").length + "건 만료일 없음", want: "0건" },
    { k: "doc", ko: "문서 분류표", n: CORP_DOC_CLASS.length, ok: CORP_DOC_CLASS.every((d) => (d.basisKo || "").trim()), got: CORP_DOC_CLASS.length + "종", want: "근거 전건 기재" },
    { k: "checked", ko: "법령 원문 미확인 표시", n: CORP_DOC_CLASS.length, ok: CORP_DOC_CLASS.some((d) => !d.checked), got: CORP_DOC_CLASS.filter((d) => !d.checked).length + "종 미확인", want: "숨기지 않는다" },
    /* ⚠️ keep 0 은 **영구**다. falsy 로 읽으면 영구 보존이 「미정」으로 둔갑한다. */
    { k: "keep", ko: "회사 보존 정책에 정한 주체", n: CORP_DOC_CLASS.filter(corpKeepSet).length,
      ok: CORP_DOC_CLASS.filter(corpKeepSet).every((d) => (d.keepBy || "").trim()),
      got: CORP_DOC_CLASS.filter((d) => corpKeepSet(d) && !(d.keepBy || "").trim()).length + "종 누락", want: "0종" },
    { k: "keepfs", ko: "재무제표는 영구 · 장부는 연한", n: 2,
      ok: (CORP_DOC_CLASS.find((d) => d.k === "fs") || {}).keep === 0 && (CORP_DOC_CLASS.find((d) => d.k === "acct") || {}).keep === 10,
      got: "재무제표 " + corpKeepKo(CORP_DOC_CLASS.find((d) => d.k === "fs")) + " · 장부 " + corpKeepKo(CORP_DOC_CLASS.find((d) => d.k === "acct")),
      want: "갈라져 있을 것" },
    { k: "keepsep", ko: "법정 연한과 회사 보존을 가른다", n: CORP_DOC_CLASS.length,
      ok: CORP_DOC_CLASS.some(corpKeepSet) && CORP_DOC_CLASS.some((d) => !corpKeepSet(d)),
      got: CORP_DOC_CLASS.filter(corpKeepSet).length + "종 확정 · " + CORP_DOC_CLASS.filter((d) => !corpKeepSet(d)).length + "종 미정",
      want: "둘 다 존재(섞지 않는다)" },
  ];
}
function corpAdminPass(now) {
  const rows = corpAdminVerdict(now);
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
