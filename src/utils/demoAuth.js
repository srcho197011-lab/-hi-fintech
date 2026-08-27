/* 데모 인증/회원 저장 유틸 — localStorage 기반(백엔드 없음). + 자가 테스트 runDemoTests() */
const DEMO_KEY = "hifin_demo_members";
const DEMO_SESSION_KEY = "hifin_demo_session";
function demoRegistered() { try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch (e) { return []; } }
function demoRegisterAll() {
  const cur = demoRegistered();
  const emails = new Set(cur.map((m) => m.email));
  let added = 0, skipped = 0;
  (demoMembers || []).forEach((m) => { if (emails.has(m.email)) { skipped++; } else { cur.push(m); emails.add(m.email); added++; } });
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(cur)); } catch (e) {}
  return { added, skipped, total: cur.length };
}
function demoListAll() { const r = demoRegistered(); return r.length ? r : (demoMembers || []); }
function demoFindByEmail(email) { const e = (email || "").trim().toLowerCase(); return demoListAll().find((m) => m.email.toLowerCase() === e); }
function demoAuthenticate(email, pw) { const m = demoFindByEmail(email); return (m && pw === "Demo@1234") ? m : null; }
function demoCurrentUser() { try { return JSON.parse(localStorage.getItem(DEMO_SESSION_KEY)); } catch (e) { return null; } }
function demoNotify() { try { window.dispatchEvent(new Event("demochange")); } catch (e) {} }
function demoSetSession(m) { try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(m)); } catch (e) {} demoNotify(); }
function demoLogout() { try { localStorage.removeItem(DEMO_SESSION_KEY); } catch (e) {} demoNotify(); }

/* ── 일반 로그인/회원가입 인증(게이트) — localStorage 기반 ── */
const AUTH_KEY = "hifin_authed";       // 게이트 통과(현재 로그인) 사용자 {name,email,realVerified}
const USERS_KEY = "hifin_users";       // 실명확인 후 가입한 일반 회원 저장소
/* 게이트 인증은 세션 단위(sessionStorage)로만 유지 — 브라우저/탭을 새로 열면 로그인 페이지부터 시작.
   (기존 localStorage에 남아있던 로그인 흔적은 무시하고 정리) */
try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
function authCurrent() { try { const a = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null"); if (a && a.role === "GUEST") { try { sessionStorage.removeItem(AUTH_KEY); } catch (e2) {} try { localStorage.removeItem(DEMO_SESSION_KEY); } catch (e2) {} return null; } return a; } catch (e) { return null; } }   // 콘텐츠 보호(2026-07-24): 기존 GUEST 세션도 발견 즉시 파기
function authSet(u) { try { sessionStorage.setItem(AUTH_KEY, JSON.stringify(u)); } catch (e) {} demoNotify(); }
function appLogout() { try { sessionStorage.removeItem(AUTH_KEY); localStorage.removeItem(AUTH_KEY); localStorage.removeItem(DEMO_SESSION_KEY); } catch (e) {} demoNotify(); }
function usersAll() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch (e) { return []; } }
function usersSave(l) { try { localStorage.setItem(USERS_KEY, JSON.stringify(l)); } catch (e) {} }
function userFindByEmail(email) { const e = (email || "").trim().toLowerCase(); return usersAll().find((u) => (u.email || "").toLowerCase() === e) || null; }
function userRegister(u) { if (userFindByEmail(u.email)) return false; const l = usersAll(); l.push(u); usersSave(l); return true; }
/* 체험회원(Demo@1234) → 가입회원(개별 비번) 순으로 인증 */
function appAuthenticate(email, pw) { const m = demoAuthenticate(email, pw); if (m) return m; const u = userFindByEmail(email); return (u && u.password === pw) ? u : null; }

/* ═══════════════ RBAC — 역할(GUEST·MEMBER·ADMIN) + 둘러보기(게스트) + 로그인 잠금 ═══════════════
   ⚠️ 백엔드 없는 데모: 서버 토큰/API 403을 프론트 등가(세션 role + 라우트 가드 + 데이터 스코프 필터)로 구현.
   정식 서버 도입 시 이 role/scope 계층을 그대로 백엔드 미들웨어로 이관. */
/* 승인된 관리자(전체보기) 계정 — 데모용 임시. ⚠️ 정식 론칭 전 폐기 목록 등록. 설정으로 분리(코드 하드코딩 지양). */
/* 승인된 관리자(전체보기) 계정 — 이 계정만 로그인 허용. TODO(론칭전 폐기): 환경변수/설정으로 이관.
   ⚠️ 개발 기간 한정 교체(2026-08-27, 형 지시): hifin/hifin002 → 하이/하이1.
      **배포 전 아래 한 줄을 { id: "hifin", pw: "hifin002" } 로 되돌릴 것.**
      기존 계정은 더 이상 통하지 않는다(교체이므로). 화면 안내문에는 표기하지 않는다. */
const AUTH_ADMIN = { id: "하이", pw: "하이1" };

/* ── 한글 계정의 '영문 자판 표기'를 파생한다(두벌식) ──
   비밀번호는 마스킹되어 보이므로, 한글 입력기가 꺼진 줄 모르고 치면 원인을 알 수 없다.
   같은 키를 눌렀다면 같은 계정으로 본다 — 계정이 늘어나는 것이 아니라 표기만 둘이다.
   예) "하이1" → ㅎㅏㅇㅣ1 → "gkdl1" */
const _QW_CHO = ["r", "R", "s", "e", "E", "f", "a", "q", "Q", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g"];
const _QW_JUNG = ["k", "o", "i", "O", "j", "p", "u", "P", "h", "hk", "ho", "hl", "y", "n", "nj", "np", "nl", "b", "m", "ml", "l"];
const _QW_JONG = ["", "r", "R", "rt", "s", "sw", "sg", "e", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "qt", "t", "T", "d", "w", "c", "z", "x", "v", "g"];
function hangulToQwerty(str) {
  let out = "";
  for (const ch of String(str || "")) {
    const c = ch.codePointAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) {          // 완성형 한글만 분해
      const i = c - 0xac00;
      out += _QW_CHO[Math.floor(i / 588)] + _QW_JUNG[Math.floor((i % 588) / 28)] + _QW_JONG[i % 28];
    } else out += ch;
  }
  return out;
}
/* 입력이 계정과 같은가 — 한글 그대로 쳤든, 입력기가 꺼진 채 같은 키를 눌렀든 통과 */
function _authSame(input, expected) {
  const v = String(input || "").trim();
  return v === expected || v === hangulToQwerty(expected);
}
function authRole() { const a = authCurrent(); if (!a) return null; return a.role || "ADMIN"; }  // 레거시 세션(role 없음)=관리자
function isAdminRole() { return authRole() === "ADMIN"; }
function isGuestRole() { return authRole() === "GUEST"; }

/* 로그인 실패 잠금(5회 실패 → 10분) */
const LOCK_KEY = "hifin_login_lock";
function loginLockState() { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (e) { return null; } }
function loginLockedMs() { const s = loginLockState(); return (s && s.until && s.until > Date.now()) ? (s.until - Date.now()) : 0; }
function loginRecordFail() { const s = loginLockState() || { fails: 0, until: 0 }; s.fails = (s.fails || 0) + 1; if (s.fails >= 5) { s.until = Date.now() + 10 * 60 * 1000; s.fails = 0; } try { localStorage.setItem(LOCK_KEY, JSON.stringify(s)); } catch (e) {} return s; }
function loginRemainFails() { const s = loginLockState(); return 5 - ((s && s.fails) || 0); }
function loginClearFail() { try { localStorage.removeItem(LOCK_KEY); } catch (e) {} }

/* 관리자/회원 로그인 — 성공 시 게이트 세션에 role 부여 */
function adminLogin(id, pw) {
  /* 앞뒤 공백은 무시하고, 한글 입력기가 꺼진 채 같은 키를 눌렀어도 같은 계정으로 본다 */
  if (!_authSame(id, AUTH_ADMIN.id) || !_authSame(pw, AUTH_ADMIN.pw)) return false;
  try { demoLogout(); } catch (e) {}
  authSet({ name: "조성래", role: "ADMIN" }); loginClearFail(); return true;
}

/* ══ Phase1 §2-4 — 코호트 데모 계정 체계: 아이디 000001~100000(6자리) + 공용 비밀번호 hifin002 ══
   어떤 아이디로 로그인해도 그 인덱스의 결정론 데이터(나이·성별·질병·보험·실손 세대·HTK)가 전 섹션에 일관 반영.
   최초 로그인 시 검진 합성값·보험 계약을 해당 회원 가명 토큰 금고에 정식 시드(지연 초기화) — 이후 행동은 개별 영속. */
function cohortLoginProfile(i) {
  const m = (typeof cohortMemberAt === "function") ? cohortMemberAt(i) : null; if (!m) return null;
  const ins = (typeof cohortInsurance === "function") ? cohortInsurance(i) : null;
  const idx6 = String(i).padStart(6, "0");
  const email = "p" + idx6 + "@cohort.hifin";
  const dz = m.diseases || [];
  const cancers = dz.filter((d) => /암$/.test(d));
  const prof = { id: "C" + idx6, cohortIndex: i, name: m.name, email, sex: m.sex, age: m.age, regAge: m.age,
    biologicalAge: m.bioAge || m.age, obesityAge: m.age + 2, heartAge: m.age + 1, liverAge: m.age + 1, pancreasAge: m.age + 2, kidneyAge: m.age,
    cancerRiskGrade: Math.max(2, Math.min(8, (m.risk || 2) + 2)), highRiskCancerTypes: cancers, highRiskDiseases: dz,
    diseases: dz, estimatedMedicalCost: m.estCost || 900000, income: m.income, sido: m.sido,
    managementPoints: ["주 150분 유산소 운동", "나트륨·당류 줄이기", "연 1회 검진 수검", "복약·측정 꾸준히"],
    htkBase: ins ? ins.htkBase : undefined, isDemoUser: false, isCohort: true, realVerified: true };
  return prof;
}
function cohortSeedVault(prof, i) {
  try {
    if (typeof vaultLoad !== "function" || typeof anonToken !== "function") return;
    const v = vaultLoad(anonToken(prof));
    if (v && ((v.checkups || []).length || (v.insurance || []).length)) return;   // 이미 시드됨 — 재로그인 시 이어짐
    if (typeof vaultSaveConsents === "function") vaultSaveConsents(prof, { health: true, ai: true, mkt: false, step: "cohort-login" });
    if (typeof synthCheckupValues === "function" && typeof vaultSaveCheckup === "function" && typeof CKUP_ORDER !== "undefined") {
      const vals = synthCheckupValues(prof);
      const items = CKUP_ORDER.map((k) => ({ key: k, value: vals[k], source: "cohort", confidence: 0.92 }));
      vaultSaveCheckup(prof, items, { source: "cohort", channel: "upload", completeness: "full", fileName: "국가검진결과_" + prof.id + ".pdf", date: "2025-11-01" });
    }
    const ins = (typeof cohortInsurance === "function") ? cohortInsurance(i) : null;
    if (ins && typeof vaultSaveInsurance === "function") {
      const contracts = ins.contracts.map((c) => ({ insurer: ["현대해상", "삼성화재", "DB손해보험", "메리츠화재"][(i + c.name.length) % 4], product: c.name, kind: c.type === "cancer" ? "암" : "일반", benefit: c.benefit, monthly: c.monthly, years: c.years }));
      if (ins.silson) contracts.unshift({ insurer: "현대해상", product: "실손의료보험", kind: "실손", gen: ins.silson.gen + "세대", join: String(ins.silson.joinYear), coGen: ins.silson.selfPayGen + "%", coNon: ins.silson.selfPayNon + "%", monthly: ins.silson.monthly });
      vaultSaveInsurance(prof, contracts, { source: "cohort", channel: "aggregate" });
    }
  } catch (e) {}
}
function cohortLogin(id, pw) {
  if (!/^\d{6}$/.test(id) || pw !== "hifin002") return false;
  const i = parseInt(id, 10);
  if (i < 1 || i > 100000) return false;
  const prof = cohortLoginProfile(i); if (!prof) return false;
  try { demoLogout(); } catch (e) {}
  cohortSeedVault(prof, i);
  demoSetSession(prof);
  authSet({ name: prof.name, email: prof.email, role: "MEMBER", cohort: i });
  loginClearFail();
  return true;
}
function memberLogin(email, pw) { const m = appAuthenticate(email, pw); if (!m) return false; authSet({ name: m.name, email: m.email, role: "MEMBER" }); demoSetSession(m); loginClearFail(); return true; }

/* ── 둘러보기(GUEST) — 10만 코호트에서 유사 회원 매칭 → 완전한 게스트 프로필 합성 ── */
const GUEST_CHRONIC = ["고혈압", "당뇨병", "이상지질혈증", "비만", "대사증후군"];
function _guestCondToDz(c) { return c === "고지혈증" ? "이상지질" : c === "당뇨" ? "당뇨" : c; }
/* 매칭 회원의 질병 목록 → 대표 만성질환 canonical 라벨(밴드 표시·건강리포트 가중용) */
function _canonChronic(diseases) {
  const set = [];
  (diseases || []).forEach((d) => {
    if (/고혈압/.test(d) && set.indexOf("고혈압") < 0) set.push("고혈압");
    if (/당뇨/.test(d) && set.indexOf("당뇨병") < 0) set.push("당뇨병");
    if (/(이상지질|고지혈)/.test(d) && set.indexOf("고지혈증") < 0) set.push("고지혈증");
    if (/비만/.test(d) && set.indexOf("비만") < 0) set.push("비만");
    if (/대사증후군/.test(d) && set.indexOf("대사증후군") < 0) set.push("대사증후군");
  });
  return set;
}
/* 후보: 성별 일치 → (있음)만성질환 보유 → 나이 근접순 상위20 중 랜덤1. 0명이면 성별만 최근접 폴백 */
function guestMatch(input) {
  const cohort = (typeof pilotCohort === "function") ? pilotCohort() : [];
  if (!cohort.length) return null;
  const sexPool = cohort.filter((m) => m.sex === input.sex);
  let pool = sexPool;
  if (input.chronic) {
    const conds = (input.conditions && input.conditions.length) ? input.conditions.map(_guestCondToDz) : null;
    let want = sexPool.filter((m) => (m.diseases || []).some((d) => conds ? conds.some((c) => d.includes(c)) : GUEST_CHRONIC.some((c) => d.includes(c))));
    if (!want.length) want = sexPool.filter((m) => (m.diseases || []).some((d) => GUEST_CHRONIC.some((c) => d.includes(c))));
    if (want.length) pool = want;
  }
  if (!pool.length) pool = sexPool;
  if (!pool.length) return null;
  const byAge = pool.slice().sort((a, b) => Math.abs(a.age - input.age) - Math.abs(b.age - input.age));
  const top = byAge.slice(0, Math.min(20, byAge.length));
  return top[Math.floor(Math.random() * top.length)];   // 반복 시연 시 매번 조금씩 다른 회원
}
/* 매칭 코호트 회원 → 데모 화면 전체가 동작하는 완전한 게스트 프로필 합성(파일럿 회원 아님) */
function guestProfile(input) {
  const src = guestMatch(input); if (!src) return null;
  const gc = input.sex === "남" ? "3" : "4";
  const base = (typeof demoMakeProfile === "function") ? demoMakeProfile("체험회원", "guest-" + src.id + "@hifin.guest", "", gc) : { id: "guest-" + src.id, managementPoints: [] };
  base.id = "GUEST-" + src.id; base.name = "체험회원"; base.sex = src.sex; base.regAge = input.age || src.age;
  const chron = _canonChronic(src.diseases);
  base.diseases = src.diseases || []; base.highRiskDiseases = chron; base.cancer = !!src.cancer;
  if (src.cancer) { const cz = (src.diseases || []).find((d) => /암$/.test(d)); if (cz) base.highRiskCancerTypes = [cz]; }
  base.cancerRiskGrade = Math.max(2, Math.min(8, (src.risk || 2) + 2));
  base.isGuest = true; base.isDemoUser = false; base.isPilot = false; base.email = "guest-" + src.id + "@hifin.guest";
  base._match = { age: src.age, sex: src.sex, chronic: chron, srcId: src.id };
  return base;
}
/* 콘텐츠 보호 조치(2026-07-24): 둘러보기(GUEST) 진입 원천 차단 — UI 제거와 별개로 콘솔·딥링크 호출도 무력화 */
function startGuest(input) { try { if (typeof toast === "function") toast("🔒 비회원 둘러보기는 콘텐츠 보호를 위해 중단되었습니다. 승인된 계정으로 로그인해 주세요."); } catch (e) {} return null; }
/* 둘러보기 종료 — 세션 + 게스트 관련 로컬 데이터 즉시 파기 후 회원가입 유도(게이트)로 */
function guestExit() {
  try { const rm = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && /guest-|_guest\b|guest@/.test(k)) rm.push(k); } rm.forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} }); } catch (e) {}
  try { demoLogout(); } catch (e) {} appLogout();
}
/* GUEST 쓰기 시뮬레이션 — 둘러보기 세션에서는 회원 데이터의 localStorage 영속화를 차단.
   세션·인증·시스템 키만 허용 → 화면(React state)에는 반영되되 새로고침/재접속 시 사라짐
   ("완료 화면은 보여주되 실제 저장되지 않음"). 데이터 소스 차원의 쓰기 시뮬레이션 보장. */
(function installGuestWriteGuard() {
  try {
    if (typeof localStorage === "undefined" || localStorage.__guestGuard) return;
    const raw = localStorage.setItem.bind(localStorage);
    const ALLOW = /(hifin_authed|hifin_demo_session|hifin_login_lock|hifin_users|guard)/;
    let last = 0;
    localStorage.setItem = function (k, v) {
      try {
        if (typeof isGuestRole === "function" && isGuestRole() && !ALLOW.test(String(k))) {
          const now = Date.now();
          if (now - last > 2500 && typeof _toast === "function") { _toast("👀 둘러보기 모드 — 실제로 저장되지 않습니다"); last = now; }
          return;   // 영속화 차단(화면 상태는 React가 유지)
        }
      } catch (e) {}
      return raw(k, v);
    };
    localStorage.__guestGuard = true;
  } catch (e) {}
})();

/* ── 파일럿 회원 전역 스코프 필터 — GUEST/MEMBER 세션에서 파일럿·데모 회원을 데이터 소스 차원에서 제외 ── */
function isPilotMember(m) { return !!(m && (m.isPilot || m.isDemoUser || (typeof m.id === "string" && /^SELF-/.test(m.id)))); }
function scopeMembers(list) { return isAdminRole() ? (list || []) : (list || []).filter((m) => !isPilotMember(m)); }
/* GUEST 접근 금지 섹션(온톨로지·하네스 / 파일럿검증회원 / 관리자 화면) */
function isRestrictedSection(secKey) {
  if (isAdminRole()) return false;
  const parent = (typeof secParent === "function") ? secParent(secKey) : secKey;
  return parent === "ontology" || parent === "healthmate" || secKey === "demo";
}

/* 테스트 시나리오 자가검증(11항목) — 실제 로직/데이터에 대해 단언 */
function runDemoTests() {
  const t = [];
  const add = (name, pass, detail) => t.push({ name, pass: !!pass, detail: detail || "" });
  const M = demoMembers || [];
  add("체험 회원 16명 일괄 등록 가능", M.length === 16 && M.every((m) => m.isDemoUser === true), `${M.length}명 · isDemoUser`);
  demoRegisterAll();
  const r2 = demoRegisterAll();
  add("중복 등록 방지 가능", r2.added === 0, `재실행 신규 ${r2.added}명`);
  add("회원별 로그인 가능", !!demoAuthenticate(M[0].email, "Demo@1234") && !demoAuthenticate(M[0].email, "wrong"), "정상/오류 비번 구분");
  add("회원별 대시보드 데이터 상이", M.length > 6 && M[0].biologicalAge !== M[6].biologicalAge, "회원 간 값 다름");
  const cg = (g) => demoCancerGrade(g)[0];
  add("암위험도 등급 색상 정상", cg(3) === "양호" && cg(5) === "주의" && cg(7) === "경고" && cg(8) === "고위험", "1-3/4-5/6-7/8+");
  const m7 = demoFindByEmail("pcb570815@hizenhealth.com") || M[6];
  add("10년 후 의료비 자동 계산", demoCostForecast(m7.estimatedMedicalCost) === Math.round(m7.estimatedMedicalCost * 1.4), "×1.4");
  const recP = demoInsuranceRecs({ highRiskCancerTypes: ["췌장암"], cancerRiskGrade: 7 }).some((r) => r[0].indexOf("고액암") >= 0);
  const recC = demoInsuranceRecs({ highRiskCancerTypes: ["대장암"], cancerRiskGrade: 5 }).some((r) => r[0].indexOf("대장암") >= 0);
  add("보험 추천이 암위험도별 상이", recP && recC, "췌장→고액암 / 대장→대장암");
  const w = demoWalletCalc({ cancerRiskGrade: 7, managementPoints: ["a", "b", "c"] });
  add("건강지갑 예상 적립액 계산", w.total === 60000 && w.focus === 20000 && w.practice === 10000, `총 ${w.total.toLocaleString("ko-KR")}원`);
  const pa = demoPersonalAnswer(M[6] || M[0]);
  add("AI 주치의 회원별 응답", !!pa && pa.sections.length === 6 && pa.title.indexOf((M[6] || M[0]).name) >= 0, "7파트 구조화 분석");
  const noOverflow = (typeof document !== "undefined") ? (document.body.scrollWidth <= document.documentElement.clientWidth + 2) : true;
  add("모바일/반응형 가로 넘침 없음", noOverflow, `현재 폭 ${typeof document !== "undefined" ? document.documentElement.clientWidth : "?"}px`);
  const errs = (typeof window !== "undefined" && window.__demoErrors) ? window.__demoErrors.length : 0;
  add("콘솔 오류 없음(런타임)", errs === 0, `JS 오류 ${errs}건`);
  return t;
}
const DEMO_CHK_NAMES = ["체험 회원 16명 일괄 등록 가능", "중복 등록 방지 가능", "회원별 로그인 가능", "회원별 대시보드 데이터 상이", "암위험도 등급 색상 정상", "10년 후 의료비 자동 계산", "보험 추천이 암위험도별 상이", "건강지갑 예상 적립액 계산", "AI 주치의 회원별 응답", "모바일/반응형 가로 넘침 없음", "콘솔 오류 없음(런타임)"];
