/* ══════════════ 일정 · 공지 · 결재 · 릴리스(corpGov.js) · CorpOps Phase 9 (형 지시 2026-11-12) ══════════════
   회사가 **무엇을 언제 하고, 누가 승인했는지**를 드는 자리.

   이 파일이 지키는 것
     · **승인 없이 상태가 넘어가지 않는다.** 전이 함수가 유일한 길이고, 조건이 안 서면
       「왜 안 되는지」를 함께 돌려준다(corpJvCanAdvance 선례).
     · **작성자 ≠ 승인자.** 같은 사람이 올리고 같은 사람이 승인하면 승인이 아니다.
       릴리스는 특히 그렇다 — 만든 사람이 스스로 내보내면 검토가 없는 것과 같다.
     · **동일인 승인은 탐지해 기록한다.** 막는 것으로 끝내지 않는다. 시도가 있었다는 사실이 남아야
       나중에 왜 막혔는지 알 수 있다.
     · 필독 공지는 **읽었다고 누른 사람만** 읽은 것으로 센다. 열람 시각을 읽음으로 바꾸지 않는다.
     · 날짜는 주입할 수 있어야 한다 — 벽시계를 쓰면 러너가 날마다 다른 답을 낸다.
     · 서버가 없다. 여기 쌓이는 것은 이 브라우저 안에만 있다. 화면이 그 사실을 적는다. */

const CORP_GOV_KEY = "hifin_corp_gov";   /* dataCatalog.js 등재 필수 */

/* ── ① 결재 — 상태와 전이 규칙 ───────────────────────────────────────
   draft 기안 → review 검토 → approved 승인 / rejected 반려
   승인은 **사람**만 한다. AI는 올리고 검토 요청까지다. */
const CORP_APR_ST = {
  draft: { ko: "기안", next: "review", nextKo: "검토 요청", c: "#8B8B94" },
  review: { ko: "검토", next: "approved", nextKo: "승인", c: "#E0A33F" },
  approved: { ko: "승인", next: null, nextKo: null, c: "#5FAE7E" },
  rejected: { ko: "반려", next: null, nextKo: null, c: "#D9544A" },
};
/* 결재 종류 — 무엇을 승인하는가에 따라 승인 권한이 다르다.
   rel(릴리스)은 S1 정보보안팀이 승인한다. 만든 팀이 스스로 내보내지 못하게 하는 자리다. */
const CORP_APR_KIND = [
  { k: "exp", ko: "지출 · 예산 집행", by: "M1", d: "예산을 쓰는 행위라 승인 전표를 남긴다" },
  { k: "ct", ko: "계약 체결", by: "M1", d: "회사 밖으로 책임이 나간다" },
  { k: "hr", ko: "인사 상태 전이", by: "M3", d: "채용 · 해고 · 평가 확정" },
  { k: "pub", ko: "대외 발행 · 게시", by: "M1", d: "회사 밖으로 나가는 행위" },
  { k: "rel", ko: "릴리스", by: "S1", d: "작성자 ≠ 승인자를 강제한다 — S1이 승인한다" },
  { k: "acl", ko: "권한 부여 · 역할 변경", by: "S1", d: "변경 이력을 남긴다" },
];

/* ── ② 일정 — 회사/팀 ─────────────────────────────────────────────── */
const CORP_CAL_KIND = {
  meet: { ko: "회의", c: "#E0A33F" },
  due: { ko: "기한", c: "#D9544A" },
  rel: { ko: "릴리스", c: "#6FB0D6" },
  etc: { ko: "일정", c: "#8B8B94" },
};
/* 고정 일정 — 반복은 CORP_SCHEDULE 루틴이 들고, 여기는 **날짜가 박힌 건**만 든다.
   둘을 섞으면 같은 일이 두 군데서 다른 모습으로 뜬다. */
const CORP_CAL_SEED = [
  { id: "cal1", d: "2026-12-05", ko: "11월 월마감", kind: "due", team: "M2", note: "주말이라 다음 영업일로 밀립니다" },
  { id: "cal2", d: "2026-12-31", ko: "클라우드·회선 계약 만료", kind: "due", team: "D1", note: "계약 대장 ct3" },
  { id: "cal3", d: "2027-01-25", ko: "부가세 확정신고 기한", kind: "due", team: "M2", note: "제출은 세무대리인" },
  { id: "cal4", d: "2027-02-28", ko: "가온헬스 용역 만료", kind: "due", team: "M1", note: "계약 대장 ct4" },
];

/* ── ③ 공지 — 필독은 누른 사람만 센다 ─────────────────────────────── */
const CORP_NOTICE_SEED = [
  { id: "nt1", d: "2026-11-12", ko: "주민등록번호 취급 기준", by: "조성래", must: true, to: "all",
    body: "인사 기록에 주민등록번호 값을 담지 않습니다. 보유 여부·근거·보관 위치·파기 예정만 듭니다. 신고 제출은 세무대리인이 합니다." },
  { id: "nt2", d: "2026-11-12", ko: "민감자료 차단 게이트 가동", by: "조성래", must: true, to: "all",
    body: "주민번호·여권·카드·비밀값이 저장소에 들어가면 커밋이 막힙니다. 자료를 붙여 넣기 전에 종류를 확인하세요." },
  { id: "nt3", d: "2026-11-11", ko: "주간 업무회의 — 월 10:00 화상", by: "조성래", must: false, to: "all",
    body: "금요일 17:00까지 팀별 주간보고 초안, 월요일 09:30 통합, 10:00 회의입니다." },
];

/* ── ④ 릴리스 — 작성자 ≠ 승인자 ─────────────────────────────────── */
const CORP_REL_SEED = [
  { id: "rel1", ver: "v3.4", d: "2026-11-12", ko: "문서 · 계약 · 인사(Phase 8)", by: "온톨로", st: "review", ap: null,
    items: ["인사 기록 — 직무 정보만", "계약 대장 — 만료 경보", "문서 분류 · 보존기한"], check: [] },
  /* ⚠️ 승인 상태로 두지 않았다 — 지금 릴리스를 승인할 수 있는 사람이 **없다**.
     S1 책임자가 합류 전이고, CEO는 S1 소속이 아니다. 승인 경로를 CEO에게 열면
     「만든 쪽이 스스로 내보내지 못하게 한다」는 분리의 뜻이 사라진다. 형이 정할 자리다. */
  { id: "rel2", ver: "v3.3", d: "2026-11-12", ko: "민감자료 차단 게이트(Phase 0)", by: "하네스", st: "review", ap: null,
    items: ["패턴 5종", "음성 테스트", "커밋 훅 편입"], check: ["gate", "sens", "nav", "rollback"] },
];
/* 릴리스 점검표 — 비면 승인으로 넘어가지 못한다. 「확인했다」를 누를 자리가 있어야 확인이다. */
const CORP_REL_CHECK = [
  { k: "gate", ko: "커밋 게이트 전건 통과", d: "러너가 모두 녹색인가" },
  { k: "sens", ko: "민감자료 차단 음성 테스트", d: "막는다고 적어 놓고 막는가" },
  { k: "nav", ko: "내비 회귀 100%", d: "길 안내가 어긋나지 않는가" },
  { k: "rollback", ko: "되돌리는 길 확인", d: "잘못되면 어떻게 되돌리는가" },
];

/* ── ④-2 커밋 게이트 목록 ─────────────────────────────────────────────
   보안 현황이 보여 주는 것. **사본이 아니다** — 러너가 pre-commit 을 읽어
   여기 적힌 러너 이름이 실제로 그 훅에 있는지 대조한다. 없으면 실패다.
   목록만 두고 대조하지 않으면 훅에서 빠진 게이트가 화면에서는 계속 녹색으로 보인다. */
const CORP_GATES = [
  { k: "sens", ko: "민감자료 차단", run: "check_sensitive.py", d: "주민번호·여권·카드·비밀값이 저장소에 들어오는 것을 막는다" },
  { k: "catalog", ko: "저장 키 등재", run: "check_data_catalog.py", d: "등재되지 않은 브라우저 저장 키를 막는다" },
  { k: "wording", ko: "화면 표기 규약", run: "run_wording_guard.mjs", d: "금칙어·판정 어법·생성 로그 왕복을 본다" },
  { k: "nav", ko: "내비 회귀", run: "run_nav_regression.mjs", d: "길 안내가 어긋나지 않는지 전수로 본다" },
  { k: "corp", ko: "재무 두 축 · 회사 운영", run: "run_corpops_ledger.mjs", d: "장부 항등식·예실 대비·주간회의·인사계약" },
  { k: "fin", ko: "계획 축 대조", run: "fin_site_check.mjs", d: "재무계획이 엑셀 원본과 어긋나지 않는지" },
  { k: "pg", ko: "협력업체 통제·집행", run: "run_pg_scan.mjs", d: "정책 판정과 집행 지점" },
  { k: "truth", ko: "진실성 가드", run: "run_truth_guard.mjs", d: "도구 없는 단정·오라우팅" },
  { k: "persona", ko: "인물 누출", run: "run_persona_diff.mjs", d: "남의 이름·수치가 회원 화면에 보이는지" },
];

/* ── ⑤ 저장 ──────────────────────────────────────────────────────── */
function corpGovRead() {
  const empty = { v: 1, apr: [], read: {}, rel: {}, cal: [], deny: [] };
  try {
    const raw = localStorage.getItem(CORP_GOV_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return {
      v: 1,
      apr: Array.isArray(o.apr) ? o.apr : [],
      read: (o.read && typeof o.read === "object") ? o.read : {},
      rel: (o.rel && typeof o.rel === "object") ? o.rel : {},
      cal: Array.isArray(o.cal) ? o.cal : [],
      deny: Array.isArray(o.deny) ? o.deny : [],   /* 동일인 승인 시도 — 막고 **기록한다** */
    };
  } catch (e) { return empty; }
}
function corpGovWrite(st) {
  try {
    localStorage.setItem(CORP_GOV_KEY, JSON.stringify({
      v: 1, apr: st.apr || [], read: st.read || {}, rel: st.rel || {},
      cal: st.cal || [], deny: (st.deny || []).slice(-200),
    }));
    return true;
  } catch (e) { return false; }
}
function corpAprAll(st) { return (st.apr || []).slice().sort((a, b) => (a.d < b.d ? 1 : -1)); }
function corpAprId(st) {
  let n = 0;
  (st.apr || []).forEach((a) => { const m = /^ap(\d+)$/.exec(a.id || ""); if (m && +m[1] > n) n = +m[1]; });
  return "ap" + (n + 1);
}
function corpRelAll(st) {
  const ov = st.rel || {};
  return CORP_REL_SEED.map((r) => (ov[r.id] ? Object.assign({}, r, ov[r.id]) : r));
}

/* ── ⑥ 전이 — 승인 없이 넘어가지 않는다 ──────────────────────────────
   돌려주는 것: { ok, why, to, ko }. 왜 안 되는지를 함께 준다. */
function corpGovActor(id) {
  const H = typeof CORP_HR !== "undefined" ? CORP_HR : [];
  return H.find((h) => h.name === id && h.on) || null;
}
function corpAprCanAdvance(ap, actorId) {
  const S = CORP_APR_ST[ap && ap.st];
  if (!S) return { ok: false, why: "상태를 알 수 없습니다" };
  if (!S.next) return { ok: false, why: "이미 끝난 결재입니다 — 되돌리려면 새로 기안합니다" };
  if (!actorId) return { ok: false, why: "조작 주체를 고르지 않았습니다" };
  const a = corpGovActor(actorId);
  if (!a) return { ok: false, why: actorId + "은(는) 재직 중인 사람이 아닙니다 — 승인은 사람이 합니다" };
  if (S.next === "approved") {
    if (ap.by === actorId) return { ok: false, why: "작성자와 승인자가 같습니다 — 다른 사람이 승인해야 합니다", same: true };
    const kind = CORP_APR_KIND.find((k) => k.k === ap.kind);
    if (kind && a.teams.indexOf(kind.by) < 0) {
      return { ok: false, why: kind.ko + "의 승인은 " + kind.by + " 소속이 합니다 — " + actorId + "은(는) " + a.teams.join("·") + " 소속입니다" };
    }
  }
  return { ok: true, why: "", to: S.next, ko: S.nextKo };
}
/* 릴리스 — 점검표가 다 차야 승인으로 간다. 만든 팀이 스스로 내보내지 못한다. */
function corpRelCanApprove(rel, actorId) {
  if (!rel) return { ok: false, why: "릴리스가 없습니다" };
  if (rel.st === "approved") return { ok: false, why: "이미 승인했습니다" };
  if (!actorId) return { ok: false, why: "조작 주체를 고르지 않았습니다" };
  const a = corpGovActor(actorId);
  if (!a) return { ok: false, why: actorId + "은(는) 재직 중인 사람이 아닙니다 — AI는 릴리스를 승인하지 못합니다" };
  if (rel.by === actorId) return { ok: false, why: "작성자와 승인자가 같습니다 — 만든 사람이 스스로 내보내면 검토가 없는 것과 같습니다", same: true };
  if (a.teams.indexOf("S1") < 0) {
    return { ok: false, why: "릴리스 승인은 정보보안팀(S1)이 합니다 — " + actorId + "은(는) " + a.teams.join("·") + " 소속입니다" };
  }
  const miss = CORP_REL_CHECK.filter((c) => (rel.check || []).indexOf(c.k) < 0 && (rel.check || []).indexOf(c.ko) < 0);
  if (miss.length) return { ok: false, why: "점검표 " + miss.length + "항목이 비었습니다 — " + miss.map((m) => m.ko).join(" · ") };
  return { ok: true, why: "" };
}
/* 릴리스를 승인할 수 있는 사람 — S1 소속 재직자. **지금은 0명이다.**
   0명이라는 사실 자체를 화면이 말해야 한다. 안 말하면 「아직 안 눌렀다」로 읽힌다. */
function corpRelApprovers() {
  const H = typeof corpHrOn === "function" ? corpHrOn() : [];
  return H.filter((h) => h.teams.indexOf("S1") >= 0).map((h) => h.name);
}

/* 동일인 승인 시도를 기록한다 — 막는 것으로 끝내지 않는다 */
function corpGovDeny(st, what, who, why) {
  const deny = (st.deny || []).concat([{ what: what, who: who, why: why }]);
  return Object.assign({}, st, { deny: deny.slice(-200) });
}

/* ── ⑦ 필독 — 누른 사람만 읽은 것으로 센다 ─────────────────────────── */
function corpNoticeRead(st, id) { return (st.read || {})[id] || []; }
function corpNoticeOpen(st) {
  const on = (typeof corpHrOn === "function" ? corpHrOn() : []).map((h) => h.name);
  return CORP_NOTICE_SEED.filter((n) => n.must).map((n) => {
    const done = corpNoticeRead(st, n.id);
    return { n: n, done: done, left: on.filter((p) => done.indexOf(p) < 0) };
  });
}

/* ── ⑧ 일정 ──────────────────────────────────────────────────────── */
function corpCalAll(st, now) {
  const add = (st && st.cal) || [];
  return CORP_CAL_SEED.concat(add)
    .map((c) => Object.assign({}, c, { dday: typeof corpAdminDays === "function" ? corpAdminDays(c.d, now) : null }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

/* ── ⑨ 단언 — 화면과 러너가 같은 함수를 부른다 ─────────────────────── */
function corpGovVerdict(st, now) {
  const apr = corpAprAll(st);
  const rel = corpRelAll(st);
  const cal = corpCalAll(st, now);
  const must = corpNoticeOpen(st);
  const kinds = CORP_APR_KIND;
  /* 승인된 건에 승인자가 없거나 작성자와 같으면 승인이 아니다 */
  const noAp = apr.filter((a) => a.st === "approved" && !a.ap);
  const selfAp = apr.filter((a) => a.st === "approved" && a.ap && a.ap === a.by);
  const relNoAp = rel.filter((r) => r.st === "approved" && !r.ap);
  const relSelf = rel.filter((r) => r.st === "approved" && r.ap && r.ap === r.by);
  const relNoCheck = rel.filter((r) => r.st === "approved" && CORP_REL_CHECK.some((c) => (r.check || []).indexOf(c.k) < 0 && (r.check || []).indexOf(c.ko) < 0));
  const badKind = apr.filter((a) => !kinds.some((k) => k.k === a.kind));
  const who = corpRelApprovers();

  return [
    { k: "kind", ko: "결재 종류 정의", n: kinds.length, ok: kinds.every((k) => k.by && k.d), got: kinds.length + "종", want: "승인 주체·사유 기재" },
    { k: "rel", ko: "릴리스 승인 주체 = S1", n: kinds.filter((k) => k.k === "rel").length, ok: (kinds.find((k) => k.k === "rel") || {}).by === "S1", got: (kinds.find((k) => k.k === "rel") || {}).by, want: "S1" },
    { k: "check", ko: "릴리스 점검표", n: CORP_REL_CHECK.length, ok: CORP_REL_CHECK.every((c) => c.ko && c.d), got: CORP_REL_CHECK.length + "항목", want: "> 0" },
    { k: "relrow", ko: "릴리스 표본", n: rel.length, ok: rel.length > 0, got: rel.length + "건", want: "> 0" },
    { k: "relwho", ko: "릴리스 승인 가능자", n: rel.length, ok: true, got: who.length ? who.join(" · ") : "0명 — S1 책임자 공석", want: "S1 재직자" },
    { k: "relgate", ko: "승인 가능자 0명이면 승인 0건", n: rel.length, ok: who.length > 0 || rel.filter((r) => r.st === "approved").length === 0, got: who.length + "명 · 승인 " + rel.filter((r) => r.st === "approved").length + "건", want: "승인 경로 없이 승인되지 않는다" },
    { k: "relap", ko: "승인된 릴리스에 승인자", n: rel.length, ok: relNoAp.length === 0, got: relNoAp.length + "건 누락", want: "0건" },
    { k: "relself", ko: "릴리스 작성자 ≠ 승인자", n: rel.length, ok: relSelf.length === 0, got: relSelf.length + "건 동일인", want: "0건" },
    { k: "relchk", ko: "점검표 없이 승인 0건", n: rel.length, ok: relNoCheck.length === 0, got: relNoCheck.length + "건", want: "0건" },
    { k: "aprap", ko: "승인된 결재에 승인자", n: apr.length + 1, ok: noAp.length === 0, got: noAp.length + "건 누락", want: "0건" },
    { k: "aprself", ko: "결재 작성자 ≠ 승인자", n: apr.length + 1, ok: selfAp.length === 0, got: selfAp.length + "건 동일인", want: "0건" },
    { k: "aprkind", ko: "결재마다 종류", n: apr.length + 1, ok: badKind.length === 0, got: badKind.length + "건 미분류", want: "0건" },
    { k: "must", ko: "필독 공지 추적", n: must.length, ok: must.length > 0, got: must.length + "건 · 미확인 " + must.reduce((n, m) => n + m.left.length, 0) + "명", want: "> 0" },
    { k: "gates", ko: "커밋 게이트 목록", n: CORP_GATES.length, ok: CORP_GATES.every((x) => x.run && x.d), got: CORP_GATES.length + "종", want: "러너·사유 전건" },
    { k: "cal", ko: "일정 산출", n: cal.length, ok: cal.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.d)), got: cal.length + "건", want: "날짜 전건" },
  ];
}
function corpGovPass(st, now) {
  const rows = corpGovVerdict(st, now);
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
