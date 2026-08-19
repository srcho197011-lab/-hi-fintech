/* ══════════════ 헬스메이트(프로) 센터 — 단일 소스(healthMate.js) ══════════════
   설계서: docs/hi_healthmate/헬스메이트섹션_설계프롬프트_v1.2.md
   원칙: ①하이 퍼스트(프로는 확인·접촉·기록만) ②무동의 0명(생성 시점 배제) ③원본 수치 미노출
        ④원가·수수료 비노출 ⑤월권 금지 ⑥접촉 락(검진결과 전 접촉 금지 — 시스템만 해제)
        ⑦단계는 데이터가 정한다(수기 승급 UI 없음) — 계산하지 않고 기존 엔진을 "조립"만 한다.
   ⚠️ 시연 환경: 체험 회원(isDemoUser)의 동의·검진값은 시연 시드이며 화면에 그 사실을 고지한다. */

/* ── 현대해상 오렌지 팔레트(디자인 단일 소스) ── */
const HM_C = { pri: "#F5821F", dark: "#D96A00", deep: "#B34E00", bg: "#FFF6EE", line: "#FFDDBE", ink: "#1F2937", mut: "#6B7280", ok: "#16A34A", warn: "#F59E0B", stall: "#EA580C", hold: "#94A3B8", red: "#DC2626", blue: "#2563EB" };

/* ── 프로 코드 명부(시연) — 코드=자격·권한·실적의 단일 키 ── */
const HM_CODES = [
  { code: "HM-SN-26-014", name: "김지원", dan: "강남지역단", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-02" },
  { code: "HM-SN-26-021", name: "정태윤", dan: "강남지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-04" },
  { code: "HM-SN-26-030", name: "이수민", dan: "강남지역단", grade: "HM4", gradeKo: "지역리드", lic: true, status: "활성", since: "2026-01" },
  { code: "HM-NB-26-007", name: "박성호", dan: "강북지역단", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-02" },
  { code: "HM-NB-26-012", name: "한서연", dan: "강북지역단", grade: "HM1", gradeKo: "안내", lic: false, status: "활성", since: "2026-06" },
  { code: "HM-WS-26-005", name: "최민준", dan: "강서지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-03" },
  { code: "HM-GG-26-009", name: "서지우", dan: "경기지역단", grade: "HM2", gradeKo: "상담", lic: true, status: "활성", since: "2026-03" },
  { code: "HM-GG-26-018", name: "문가영", dan: "경기지역단", grade: "HM1", gradeKo: "안내", lic: false, status: "교육중", since: "2026-07" },
  { code: "HM-WD-26-001", name: "오현석", dan: "광역(전국)", grade: "HM3", gradeKo: "설계·가족", lic: true, status: "활성", since: "2026-01" },
  { code: "HM-WD-26-002", name: "임다혜", dan: "광역(전국)", grade: "HM2", gradeKo: "상담", lic: true, status: "정지", since: "2026-02" },
];
function hmProOf(code) { const l = (typeof hmProsGen === "function") ? hmProsGen() : HM_CODES; for (const p of l) if (p.code === code) return p; return null; }
function hmActivePros(dan) { const l = HM_CODES.filter((p) => p.status === "활성" && (p.dan === dan)); return l.length ? l : HM_CODES.filter((p) => p.status === "활성" && p.dan === "광역(전국)"); }

/* ── 8단계 정의(단일 소스) — DB 4단계 + 이후 4단계. 판정은 hmStageOf가 "데이터만" 근거로 수행 ── */
const HM_STAGES = [
  { k: "D1", part: "DB", name: "확보", desc: "동의 + 기본 세그먼트", mission: "연락하지 않는다 — 락 상태에서 준비만", tab: 2 },
  { k: "D2", part: "DB", name: "검진 데이터", desc: "1세대 자산 — 실측 검진값(금고)", mission: "첫 연결 — 결과+보장 결합 안내", tab: 3 },
  { k: "D3", part: "DB", name: "분석 데이터", desc: "2세대 자산 — 등급·위험도·리포트", mission: "예측 해설 · 보장분석 대화", tab: 4 },
  { k: "D4", part: "DB", name: "통합 데이터", desc: "3세대 자산 — 보험·행동·가족 결합", mission: "생활 밀착 관리 · 공백 채우기", tab: 5 },
  { k: "L5", part: "LIFE", name: "정기 케어", desc: "단발 → 주기(반복 터치·시계열)", mission: "주기 관리 · 만기 터치 · 재검진", tab: 3 },
  { k: "L6", part: "LIFE", name: "관계 확장", desc: "개인 → 가구(가족 데이터)", mission: "가족 상담 · 돌봄 설계", tab: 6 },
  { k: "L7", part: "LIFE", name: "데이터 자산화", desc: "동의 증서 · 데이터 이용 대가", mission: "설명 지원 · 동의 관리 도움(권유 아님)", tab: 9 },
  { k: "L8", part: "LIFE", name: "평생주기", desc: "다년 추이 → 재산정·재설계", mission: "재산정 안내 · 차기 생애설계", tab: 7 },
];
/* 관리상태 8종 — 단계(데이터)와 다른 축(관계) */
const HM_MSTATUS = {
  HELD: { ko: "대기(접촉 금지)", c: HM_C.hold, bg: "#F1F5F9" },
  NEED: { ko: "접촉 필요", c: HM_C.red, bg: "#FEF2F2" },
  DONE: { ko: "접촉 완료", c: HM_C.blue, bg: "#EFF6FF" },
  PROG: { ko: "진행 중", c: HM_C.ok, bg: "#F0FDF4" },
  HOLDREQ: { ko: "보류(회원 요청)", c: HM_C.warn, bg: "#FFFBEB" },
  STALL: { ko: "정체", c: HM_C.stall, bg: "#FFF7ED" },
  CLOSED: { ko: "종결", c: HM_C.mut, bg: "#F8FAFC" },
};

/* ── 「이 화면의 DB」 패널 — 원천·의미·활용·근거 + 담당 단계(전 탭 의무) ── */
const HM_DB_NOTE = {
  t1: { stage: "D1 → D2", src: "회원 행동 로그 + 리드 신호 감지(lrDetectType·lrScore — 검진·보장공백·청구·재산정·가족·직접요청 6종)", mean: "지금 이 회원에게 무슨 일이 일어났는가. 신호가 곧 접촉의 이유다.", use: "접촉 우선순위와 첫 마디를 정한다 — 근거 없는 접촉은 이 화면에 존재하지 않는다.", legal: "상담·안내 동의(필수) + 동의 증서 유효(철회 즉시 소멸) · 개인정보보호법 §22②" },
  t2: { stage: "D1", src: "검진 예약 DB + 검진대비보험 청약 상태 + 가입증서 스냅샷(hifin_ins_certs)", mean: "무상 보장을 받고 검진을 앞둔 회원 — 아직 데이터가 만들어지기 전 단계.", use: "지금은 연락하지 않는다. 결과가 나오면 첫 연결을 맡는다(순번 배분).", legal: "청약 시 상담·안내 동의(필수) + 보험업법상 계약 관리 · 검진 전 접촉 금지는 자율규제" },
  t3: { stage: "D2 → D3", src: "검진 결과 분석 엔진(checkupEngine — 등급·관리필요 항목) + 증서 만기 + 정밀검사 권고", mean: "결과가 나온 지금이 회원이 가장 도움을 원하는 시점이다.", use: "결과 해설과 보장 안내를 한 번의 연락으로 전달한다(두 번 걸면 영업으로 읽힌다).", legal: "검진결과 활용 동의 + 상담·안내 동의 · 원본 수치는 화면 미노출(등급·플래그만)" },
  t4: { stage: "D3", src: "질병 위험 예측(riskPredict — 검진 지표+연령·성별 코호트) · 미연동 시 회원 건강 프로필(시연 시드)", mean: "확정된 미래가 아니라 관리하면 바뀌는 통계적 경향이다.", use: "예방 검진·주치의 연결의 근거로만 쓴다 — 인수·요율 사용 금지.", legal: "검진결과 활용 동의 · 예측은 진단이 아님(고정 면책) · 밴드 표기만(소수점 금지)" },
  t5: { stage: "D4 · L5", src: "커머스 온톨로지(질환-성분-제품) + 복약·실천 이행률(adherence) + 정기구매 주기", mean: "회원이 실제로 무엇을 하고 있는가 — 선언이 아니라 행동.", use: "재구매 시점·성분 공백을 근거와 함께 안내한다(1일 단가 기준 비교, 압박 없음).", legal: "쇼핑·건강관리 이용 동의 · 원가성 정보 비노출" },
  t6: { stage: "D4 → L6", src: "가족 등록(familySet) + 장기요양 지식(longtermCareKB) + 입원·청구 플래그", mean: "회원의 부담은 본인이 아니라 가족에게서 온다.", use: "재가급여 가능성 안내와 가족 상담 연결 — 응급 신호가 있으면 상담보다 119가 먼저.", legal: "가족 돌봄 서비스 이용 동의(가족 본인 동의 별도) · 등급·금액 단정 금지" },
  t7: { stage: "D3 · L8", src: "보유계약 + 보장공백 분석(analyzeCoverageGap) + 인수 시뮬(underwrite·coverageMatch·ladderPlan) + 건강 등급", mean: "이 회원에게 비어 있는 보장과, 지금 건강상태에서 가능한 조건.", use: "현대해상 보장분석과 이어 붙여 상담을 준비한다 — 가능성 3구간으로만 말한다.", legal: "보험 상담·안내 동의 + 보장분석 이용 동의 · 인수 확정은 인수사 심사(면책 100%)" },
  t8: { stage: "운영(전 단계)", src: "프로가 직접 작성한 현장 의견 + 채택·반영 이력(회원 데이터 아님)", mean: "현장은 지표가 못 보는 것을 본다.", use: "제품 개선 백로그의 1차 입력 — 채택·반영은 사람 검수(자동 반영 없음).", legal: "프로 본인 작성물 · 회원 개인정보 기재 금지(금칙어 검사)" },
  t9: { stage: "전 단계(D1~L8) 관측", src: "내 코드 배정 회원의 단계 판정(hmStageOf) + 건강 등급(checkupEngine) + 접촉 이력", mean: "내가 맡은 사람들이 지금 어디에 있고, 어디서 멈춰 있는가.", use: "오늘 누구를 어느 방향으로 밀어야 하는지 정한다 — 기본 정렬은 정체 기간.", legal: "상담·안내 동의 + 프로 본인 활동 기록 · 실적은 단계 전진으로 정의(금액·순위 없음)" },
};

/* ── 유틸 ── */
function _hmLs(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function _hmSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function _hmHash(s) { let h = 5381; s = String(s || "x"); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h >>> 0; }
function _hmMask(name) { const n = String(name || "회원"); return n[0] + "○" + (n.length > 2 ? "○" : ""); }
function _hmBand(m) { const a = m.regAge || m.age || 45; return Math.floor(a / 10) * 10 + "대"; }
function _hmDay(ts) { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; }
const _HM_DAY = 86400000;

/* 시도 정규화 → 지역단(leadRouting LR_DAN 재사용) */
function hmDanOf(m) {
  let s = String(m.sido || "서울").slice(0, 2);
  const FIX = { "경상": (m.sido || "").indexOf("북") >= 0 ? "경북" : "경남", "전라": (m.sido || "").indexOf("북") >= 0 ? "전북" : "전남", "충청": (m.sido || "").indexOf("북") >= 0 ? "충북" : "충남" };
  if (FIX[s]) s = FIX[s];
  const map = (typeof LR_DAN !== "undefined" && LR_DAN[s]) || (typeof LR_DAN !== "undefined" && LR_DAN["서울"]) || { dans: ["강북지역단"] };
  let dan = map.dans[0];
  if (s === "서울" && typeof LR_SEOUL_GU !== "undefined") { const g = m.sigungu || ""; for (const d in LR_SEOUL_GU) if (LR_SEOUL_GU[d].indexOf(g) >= 0) { dan = d; break; } }
  return dan;
}
/* 회원 → 담당 프로(결정론) — 지역 일치 제1원칙: 회원 시군구의 프로(주 관할·겸임)에게만 배정.
   700명 명부(hmProsBySgg)가 로드되면 시군구 매칭, 아니면 기존 지역단 해시(폴백). */
function hmProForMember(m) {
  if (typeof hmProsBySgg === "function" && typeof DISTRICTS !== "undefined") {
    let sd = String(m.sido || "서울").slice(0, 2);
    const FIX2 = { "경상": (m.sido || "").indexOf("북") >= 0 ? "경북" : "경남", "전라": (m.sido || "").indexOf("북") >= 0 ? "전북" : "전남", "충청": (m.sido || "").indexOf("북") >= 0 ? "충북" : "충남" };
    if (FIX2[sd]) sd = FIX2[sd];
    const list = DISTRICTS[sd] || [];
    const raw = m.sigungu || "";
    const sgg = list.find((d) => raw === d) || list.slice().sort((a, b) => b.length - a.length).find((d) => raw.indexOf(d.replace(/시$/, "")) === 0) || (list[0] || "");
    const r = hmProsBySgg(sd, sgg);
    if (r && r.pool.length) return r.pool[_hmHash(m.id || m.email) % r.pool.length];
  }
  const pros = hmActivePros(hmDanOf(m));
  return pros[_hmHash(m.id || m.email) % pros.length];
}

/* ── 동의 게이트 — 무동의 0명(생성 시점 배제). 철회(mkt:false 명시) 즉시 소멸 ── */
function hmConsentOK(m) {
  try {
    const tk = (typeof anonToken === "function") ? anonToken(m) : null;
    const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null;
    const st = v && v.consents && v.consents.state;
    if (st && st.mkt === false) return { ok: false, why: "상담·안내 동의 철회 — 목록 제외" };
    if (st && st.mkt === true) return { ok: true, why: "상담·안내 동의(금고 기록 " + (v.consents.ver || "") + ")" };
  } catch (e) {}
  if (m.isDemoUser) return { ok: true, why: "상담·안내 동의(체험 회원 시연 시드)" };
  return { ok: false, why: "동의 기록 없음 — 목록 제외" };
}

/* ── 내 고객 스코프 — 생성 시점에 동의·배정 필터(조회 필터가 아님) ── */
function hmScope(code) {
  const all = (typeof demoMembers !== "undefined" ? demoMembers : []).filter((m) => m && m.isDemoUser);
  return all.filter((m) => hmConsentOK(m).ok && hmProForMember(m).code === code);
}
function hmScopeAll(code) { /* HM4 지역리드: 지역단 전체 관측(집계용 — 개인 상세는 스코프와 동일 규칙) */
  const p = hmProOf(code);
  if (!p || p.grade !== "HM4") return hmScope(code);
  const all = (typeof demoMembers !== "undefined" ? demoMembers : []).filter((m) => m && m.isDemoUser && hmConsentOK(m).ok);
  return all.filter((m) => hmDanOf(m) === p.dan);
}

/* ── ② 검진대비보험 순번 배분(라운드로빈) — 성과가 아니라 순서로 나눈다 ── */
function hmAssignInsRR(m) {
  const dan = hmDanOf(m);
  const pros = hmActivePros(dan).filter((p) => p.lic);   // 모집자격 보유만
  if (!pros.length) return null;
  const key = "hifin_hm_rr_" + dan;
  const last = Number(localStorage.getItem(key) || "-1");
  const idx = (last + 1) % pros.length;
  try { localStorage.setItem(key, String(idx)); } catch (e) {}
  const prev = pros[(idx - 1 + pros.length) % pros.length];
  return { pro: pros[idx], reason: `${dan} 순번 배분 (직전 ${prev.code.slice(-3)} → 이번 ${pros[idx].code.slice(-3)})` };
}
/* ② 배정 큐 — 시연: 검진대비보험 가입 회원(결정론 선별)을 최초 1회 순번 배분해 영속 저장 */
function hmInsQueue() {
  let q = _hmLs("hifin_hm_insq", null);
  if (q) return q;
  const all = (typeof demoMembers !== "undefined" ? demoMembers : []).filter((m) => m && m.isDemoUser && hmConsentOK(m).ok);
  const picked = all.filter((m) => _hmHash("insq" + (m.id || m.email)) % 3 === 0).slice(0, 5);   // 시연: 가입 회원 5명
  q = picked.map((m) => { const a = hmAssignInsRR(m); return { email: m.email, name: m.name, at: Date.now() - (_hmHash(m.email) % 6 + 1) * _HM_DAY, code: a ? a.pro.code : null, reason: a ? a.reason : "" }; });
  _hmSave("hifin_hm_insq", q);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `검진대비보험 배정 큐 생성(시연) — ${q.length}건 순번 배분(무동의 0명)` }); } catch (e) {}
  return q;
}

/* ── 접촉 락 — 검진결과 수령 전 접촉 금지. 해제는 시스템 이벤트만(프로·관리자 해제 버튼 없음) ── */
function hmLockState(m) {
  const inQ = hmInsQueue().some((x) => x.email === m.email);
  if (!inQ) return { locked: false, reason: null };
  const seen = _hmLs("hifin_hm_resultseen_" + m.email, null);
  if (seen) return { locked: false, reason: null, seenAt: seen.at };
  return { locked: true, reason: "검진결과 수령 전 — 접촉 금지(하이가 결과 수령 시 자동 해제)" };
}
/* 시스템 이벤트 시뮬 — 검진결과 수령(시연 트리거 · 프로의 임의 해제가 아님) */
function hmSimResult(email) {
  if (_hmLs("hifin_hm_resultseen_" + email, null)) return { ok: false, reason: "이미 수령됨" };
  _hmSave("hifin_hm_resultseen_" + email, { at: Date.now() });
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `검진결과 수령 이벤트(시연) — 접촉 락 자동 해제(${_hmMask(email)})` }); } catch (e) {}
  return { ok: true };
}
function hmLockViolation(code, m) {   // 잠금 위반 시도 — 감사 기록
  const l = _hmLs("hifin_hm_lockviol", []); l.push({ at: Date.now(), code, email: m.email });
  _hmSave("hifin_hm_lockviol", l);
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `LOCK_VIOLATION_ATTEMPT — ${code} · 검진결과 전 접촉 시도 차단` }); } catch (e) {}
}

/* ── 단계 판정 — 데이터만 근거(수기 승급 없음). 전이는 캐시 비교 후 체인 기록 ── */
function hmStageOf(m) {
  const ev = [];
  const push = (k, ok, why) => ev.push({ k, ok: !!ok, why });
  const consent = hmConsentOK(m);
  push("D1", consent.ok, consent.why);
  /* D2 — 1세대: 금고 실측 우선, 없으면 체험 회원 시연 실측 시드 */
  let d2 = false, d2w = "검진 데이터 없음";
  try {
    const vk = (typeof vaultCheckupMap === "function") ? vaultCheckupMap(m) : null;
    if (vk) { d2 = true; d2w = `금고 실측 ${vk.n}항목 · ${vk.date}(1세대 자산)`; }
    else if (m.isDemoUser && typeof genMemberCheckup === "function") { const c = genMemberCheckup(m); if (c) { d2 = true; d2w = `검진 실측 ${Object.keys(c.items).length}항목(시연 실측 시드)`; } }
  } catch (e) {}
  push("D2", d2, d2w);
  /* D3 — 2세대: AI 분석 등급 산출 */
  let d3 = false, d3w = "분석 미생성";
  try { const g = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null; if (d2 && g) { d3 = true; d3w = `AI 분석 등급 「${g.grade}」 산출(2세대 자산)`; } } catch (e) {}
  push("D3", d3, d3w);
  /* D4 — 3세대: 결합 2종 이상(보험·행동·가족·상담이력) */
  const parts = [];
  try { const certs = _hmLs("hifin_ins_certs", []); if (certs.some((c) => c.insured && c.insured.name === m.name)) parts.push("보험 증서"); } catch (e) {}
  try { if (hmInsQueue().some((x) => x.email === m.email)) if (parts.indexOf("보험 증서") < 0) parts.push("검진보험 가입"); } catch (e) {}
  try { const adh = _hmLs("hifin_adh_" + m.email, {}); if (Object.keys(adh).length) parts.push("복약·실천 기록"); } catch (e) {}
  try { if (localStorage.getItem("hifin_family_" + m.email)) parts.push("가족 등록"); } catch (e) {}
  try { const ld = _hmLs("hifin_leads_" + m.email, []); if (ld.length) parts.push("상담 이력"); } catch (e) {}
  push("D4", d3 && parts.length >= 2, parts.length ? `결합 ${parts.length}종(${parts.join("·")})` : "결합 데이터 없음(보험·행동·가족 중 2종 필요)");
  /* L5 — 주기: 터치 3회+ 또는 금고 다년 검진 */
  let l5 = false, l5w = "반복 주기 미형성(터치 3회 또는 2개년 검진 필요)";
  try { const t = _hmLs("hifin_hm_touch_" + m.email, []); if (t.length >= 3) { l5 = true; l5w = `건강 터치 ${t.length}회 완료(주기 형성)`; } } catch (e) {}
  try { const tk = (typeof anonToken === "function") ? anonToken(m) : null; const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null; if (v && (v.checkups || []).length >= 2) { l5 = true; l5w = `금고 검진 ${v.checkups.length}개년(시계열)`; } } catch (e) {}
  push("L5", l5, l5w);
  /* L6 — 가구: 저장된 가족 2인+ 또는 가족 상담 리드 */
  let l6 = false, l6w = "가족 데이터 없음";
  try { const raw = localStorage.getItem("hifin_family_" + m.email); if (raw) { const f = JSON.parse(raw); if (f && f.length >= 2) { l6 = true; l6w = `가족 ${f.length}명 등록(가구 단위)`; } } } catch (e) {}
  try { const ld = _hmLs("hifin_leads_" + m.email, []); if (ld.some((x) => x.family)) { l6 = true; l6w = "가족 상담 이력 보유"; } } catch (e) {}
  push("L6", l6, l6w);
  /* L7 — 자산화: 동의 증서(ConsentNFT) 유효 보유 */
  let l7 = false, l7w = "동의 증서 미발행";
  try { if (typeof cnList === "function") { const c = cnList(m).filter((x) => x.status === "active"); if (c.length) { l7 = true; l7w = `동의 증서 ${c.length}건 유효(데이터 주권 행사)`; } } } catch (e) {}
  push("L7", l7, l7w);
  /* L8 — 평생: 금고 2개년+ 또는 요율 재산정 완료 */
  let l8 = false, l8w = "다년 추이 미확보(2개년 검진 필요)";
  try { const tk = (typeof anonToken === "function") ? anonToken(m) : null; const v = tk && typeof vaultLoad === "function" ? vaultLoad(tk) : null; if (v && (v.checkups || []).length >= 2) { l8 = true; l8w = `${v.checkups.length}개년 추이 — 재산정 가능`; } } catch (e) {}
  push("L8", l8, l8w);
  const reached = ev.filter((x) => x.ok).map((x) => x.k);
  const order = HM_STAGES.map((s) => s.k);
  let cur = "D1";
  order.forEach((k) => { if (reached.indexOf(k) >= 0) cur = k; });
  /* 전이 캐시 — 정체 계산. 최초 1회는 시연 시드 오프셋(실서비스에서는 실제 전이 시각) */
  const ck = "hifin_hm_stagecache_" + m.email;
  let cache = _hmLs(ck, null);
  if (!cache) { cache = { cur, at: Date.now() - ((_hmHash("st" + m.email) % 38) + 3) * _HM_DAY, seed: true }; _hmSave(ck, cache); }
  else if (cache.cur !== cur) {
    try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `고객 단계 전이 ${cache.cur}→${cur} — 데이터 근거 자동 판정` }); } catch (e) {}
    cache = { cur, at: Date.now() };
    _hmSave(ck, cache);
  }
  const stalledDays = Math.floor((Date.now() - cache.at) / _HM_DAY);
  return { cur, reached, evidence: ev, stalledDays, stalled: stalledDays >= 30 && cur !== "L8" };
}

/* ── 관리상태 판정 — 락 > 접촉필요 > 정체 > 진행 > 완료 > 종결 ── */
function hmStatusOf(m, stage) {
  const lk = hmLockState(m);
  if (lk.locked) return { k: "HELD", ...HM_MSTATUS.HELD, why: lk.reason };
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const last = touches.length ? touches[touches.length - 1] : null;
  const plan = hmTouchPlan(m);
  const due = plan.items.filter((x) => x.due && !x.done);
  if (due.length) return { k: "NEED", ...HM_MSTATUS.NEED, why: due[0].title + " 시점 도래" };
  const st = stage || hmStageOf(m);
  if (st.stalled) return { k: "STALL", ...HM_MSTATUS.STALL, why: `${st.cur} 단계에서 ${st.stalledDays}일 정체` };
  if (last && Date.now() - last.at < 7 * _HM_DAY) return { k: "DONE", ...HM_MSTATUS.DONE, why: "최근 터치 완료(" + _hmDay(last.at) + ")" };
  if (last) return { k: "PROG", ...HM_MSTATUS.PROG, why: "관리 진행 중" };
  return { k: "PROG", ...HM_MSTATUS.PROG, why: "신규 배정 — 하이 브리핑 확인" };
}

/* ── 건강현황 요약 — 등급·관리필요 수·위험 밴드(원본 수치 미노출) ── */
function hmHealthBrief(m) {
  let grade = "-", sevN = 0, band = "중", year = "-", seen = false;
  try { const g = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null; if (g) { grade = g.grade; sevN = (g.sev1 || 0) + (g.sev2 || 0); } } catch (e) {}
  try { const c = m._chk || ((typeof genMemberCheckup === "function") ? genMemberCheckup(m) : null); if (c && c.years) year = c.years[2] + "년"; } catch (e) {}
  /* 위험 밴드 — riskPredict(금고 연동) 우선, 미연동 시 회원 건강 프로필(시연 시드)로 조립 */
  try {
    const rp = (typeof riskPredict === "function") ? riskPredict(m) : null;
    if (rp && rp.ok && rp.risks.length) band = rp.risks[0].topPct <= 20 ? "상" : rp.risks[0].topPct <= 50 ? "중" : "하";
    else { const cg = m.cancerRiskGrade || 3; band = cg >= 6 ? "상" : cg >= 4 ? "중" : "하"; }
  } catch (e) {}
  seen = !!_hmLs("hifin_hm_resultseen_" + m.email, null);
  return { grade, sevN, band, year, seen };
}

/* ── ③ 터치 플랜 — 첫 연결(결합 패키지) + 조건부 타임라인. 만기는 증서/청약일 기준 계산(상수 금지) ── */
function hmTouchPlan(m) {
  const items = [];
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const doneKeys = {};
  touches.forEach((t) => { doneKeys[t.key] = true; });
  const seen = _hmLs("hifin_hm_resultseen_" + m.email, null);
  const now = Date.now();
  if (seen) {
    const base = seen.at;
    items.push({ key: "combo", title: "첫 연결 — 결과분석 + 검진대비보험 안내(1회 통합)", when: base, due: now >= base, done: !!doneKeys.combo, pack: true });
    items.push({ key: "d7", title: "이해 확인 — \"설명이 어렵진 않으셨어요?\"", when: base + 7 * _HM_DAY, due: now >= base + 7 * _HM_DAY, done: !!doneKeys.d7 });
    let sevOk = false; try { const g = memberHealthGrade(m); sevOk = g && (g.sev1 + g.sev2) > 0; } catch (e) {}
    if (sevOk) items.push({ key: "d14", title: "관리 필요 항목 재확인(등급 이하 항목만)", when: base + 14 * _HM_DAY, due: now >= base + 14 * _HM_DAY, done: !!doneKeys.d14 });
    let deep = false; try { deep = (m.managementPoints || []).some((p) => /내시경|초음파|정밀|CT|MRI/.test(p)); } catch (e) {}
    if (deep) items.push({ key: "d30", title: "추가 검진·진료 안내(정밀검사 권고 항목)", when: base + 30 * _HM_DAY, due: now >= base + 30 * _HM_DAY, done: !!doneKeys.d30 });
  }
  /* 만기 — 증서 스냅샷 우선(발급 익일 0시 + 90일), 증서 미발급 가입 회원은 청약일 기준(시연 표기) */
  let issueAt = null, src = null;
  try { const certs = _hmLs("hifin_ins_certs", []); const c = certs.filter((x) => x.insured && x.insured.name === m.name).pop(); if (c) { issueAt = c.at; src = "증서 " + c.id; } } catch (e) {}
  if (!issueAt) { const q = hmInsQueue().find((x) => x.email === m.email); if (q) { issueAt = q.at; src = "청약일 기준(시연)"; } }
  if (issueAt) {
    const start = new Date(issueAt); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + 90 * _HM_DAY;
    [["m30", "만기 D-30 — 검진대비보험 만기 예정 안내", end - 30 * _HM_DAY], ["m7", "만기 D-7 — 재가입·차기 검진 연계 안내", end - 7 * _HM_DAY], ["m1", "만기 D+1 — 보장 종료·다음 검진 주기 제안", end + _HM_DAY]].forEach(([k, t, w]) => {
      items.push({ key: k, title: t, when: w, due: now >= w, done: !!doneKeys[k], src });
    });
  }
  return { items: items.sort((a, b) => a.when - b.when), endSrc: src };
}

/* ── ④ 질병 예측 카드 — riskPredict 우선, 미연동 시 회원 건강 프로필 조립(계산 없음·밴드만) ── */
function hmRiskCards(m) {
  try {
    const rp = (typeof riskPredict === "function") ? riskPredict(m) : null;
    if (rp && rp.ok) return { src: "riskPredict(금고 실측)", rows: rp.risks.slice(0, 3).map((r) => ({ ko: r.ko, band: r.topPct <= 20 ? "상" : r.topPct <= 50 ? "중" : "하", why: `동년배 대비 상대 위험 상위 ${r.topPct}% 구간 · ${r.trend}`, trend: r.trend })) };
  } catch (e) {}
  const rows = [];
  (m.highRiskCancerTypes || []).slice(0, 2).forEach((c) => rows.push({ ko: c, band: (m.cancerRiskGrade || 3) >= 6 ? "상" : "중", why: "암 위험 등급 " + (m.cancerRiskGrade || "-") + " · 관리 권고", trend: "관리 필요" }));
  (m.highRiskDiseases || []).slice(0, 2).forEach((d) => rows.push({ ko: d, band: "중", why: "질환 이력 기반 관리 대상", trend: "지속 관리" }));
  if (!rows.length) rows.push({ ko: "특이 위험 없음", band: "하", why: "현재 프로필 기준 관리 권고 항목 없음", trend: "유지" });
  return { src: "회원 건강 프로필(시연 실측 시드)", rows: rows.slice(0, 3) };
}

/* ── ⑦ 대화형 인수조건 — underwrite 우선, 미연동 시 등급 기반 조립. 항상 가능성 3구간 + 면책 부착 ── */
const HM_UW_DISCLAIM = "⚠ 확정은 인수사(현대해상) 심사입니다. 회원께는 \"가능성\"으로만 말씀해 주세요.";
function hmUnderwriteTalk(m, q) {
  const prod = /실손/.test(q) ? "실손의료보험" : /암/.test(q) ? "암 진단비" : /수술/.test(q) ? "수술비 특약" : /간편/.test(q) ? "간편심사보험" : "진단비 플랜";
  let lines = [], docs = ["최근 검진 결과지"], memberLine = "";
  try {
    const uw = (typeof underwrite === "function") ? underwrite(m, prod) : null;
    if (uw && uw.ok) {
      const d = uw.decision;
      const tri = d.indexOf("표준체") >= 0 ? [["표준체", "높음"], ["간편심사형", "있음"], ["부담보 조건부", "불필요"]]
        : d.indexOf("할증") >= 0 ? [["표준체", "낮음"], ["간편심사형", "높음"], ["부담보 조건부", "있음"]]
        : d.indexOf("유병자") >= 0 ? [["표준체", "낮음"], ["간편심사형", "높음"], ["관리자 요율(할인 방향)", "있음"]]
        : [["표준체", "낮음"], ["간편심사형", "있음"], ["조건부(포용 경로)", "있음"]];
      lines = tri; if (uw.disclosures && uw.disclosures.length) docs.push("고지 대상: " + uw.disclosures.map((x) => x.item).join(" · "));
      memberLine = uw.note;
      return { product: prod, src: "underwrite(금고 실측 시뮬)", tri: lines, docs, memberLine, disclaim: HM_UW_DISCLAIM };
    }
  } catch (e) {}
  let g = null; try { g = memberHealthGrade(m); } catch (e) {}
  const gr = g ? g.grade : "정상";
  const sick = (m.highRiskDiseases || []).length > 0;
  if (gr === "긴급" || gr === "고위험") lines = [["표준체", "낮음"], ["간편심사형", "있음"], ["부담보 조건부", "있음(해당 부위 한정)"]];
  else if (sick || gr === "치료중" || gr === "지속관리") lines = [["표준체", "낮음"], ["간편심사형", "높음"], ["부담보 조건부", "있음(해당 부위 한정)"]];
  else if (gr === "이상" || gr === "경계") lines = [["표준체", "있음"], ["간편심사형", "높음"], ["부담보 조건부", "불필요 가능성"]];
  else lines = [["표준체", "높음"], ["간편심사형", "가능(불필요)"], ["부담보 조건부", "불필요"]];
  if (sick) docs.push("최근 3개월 처방·복약 이력");
  memberLine = sick ? `${(m.highRiskDiseases || []).join("·")} 이력이 있어도 현재 관리 상태에 따라 가입 경로가 열려 있어요 — 정확한 조건은 심사로 확정돼요.` : "현재 건강상태 기준으로 가입 경로가 열려 있어요 — 정확한 조건은 심사로 확정돼요.";
  const out = { product: prod, src: "건강 등급 조립(등급 「" + gr + "」 기준)", tri: lines, docs, memberLine, disclaim: HM_UW_DISCLAIM };
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `인수조건 대화(underwrite-talk) — ${prod} · 가능성 3구간 안내(확정 아님)` }); } catch (e) {}
  return out;
}

/* ── 접촉 행동 실행 — 락·동의 재검증 후 기록(자체 판단 없음) ── */
const HM_BANNED = ["무조건", "확정", "보장됩니다", "100%", "가입 가능합니다", "거절됩니다", "수익", "원금"];
function hmAct(code, m, act) {
  const lk = hmLockState(m);
  if (lk.locked) { hmLockViolation(code, m); return { ok: false, reason: "접촉 금지 상태예요 — 검진결과 수령 후 하이가 자동으로 열어 드려요." }; }
  const c = hmConsentOK(m);
  if (!c.ok) return { ok: false, reason: "유효한 동의가 없어요 — 접촉할 수 없어요." };
  if (act.note && HM_BANNED.some((w) => act.note.indexOf(w) >= 0)) return { ok: false, reason: "금칙어가 포함돼 있어요 — 단정·과장 표현은 보낼 수 없어요." };
  const l = _hmLs("hifin_hm_touch_" + m.email, []);
  l.push({ at: Date.now(), key: act.key || "manual", tab: act.tab || "", act: act.label || "접촉", result: act.result || "연결됨", by: code });
  _hmSave("hifin_hm_touch_" + m.email, l);
  try { if (typeof vaultAccessLog === "function" && typeof anonToken === "function") vaultAccessLog(anonToken(m), "healthmate", `${code} · ${act.label || "접촉"}(${act.tab || "-"})`); } catch (e) {}
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `프로 접촉 기록 — ${code} · ${act.label || "접촉"} · 결과 ${act.result || "연결됨"}` }); } catch (e) {}
  try { if (typeof notifPush === "function" && act.notify) notifPush({ ic: "check", t: act.notifyTitle || "담당 프로 안내", d: act.notify, target: "checkup" }); } catch (e) {}
  return { ok: true };
}

/* ── ⑨ 내 실적 — 단계 전진으로 정의(금액·수수료·순위 없음) ── */
function hmMyStats(code) {
  const members = hmScope(code);
  const q = hmInsQueue().filter((x) => x.code === code);
  let touches = 0, done7 = 0, stalledN = 0, adv = 0;
  const trans = {};
  members.forEach((m) => {
    const t = _hmLs("hifin_hm_touch_" + m.email, []); touches += t.length;
    if (t.some((x) => Date.now() - x.at < 7 * _HM_DAY)) done7++;
    const st = hmStageOf(m); if (st.stalled) stalledN++;
    const cache = _hmLs("hifin_hm_stagecache_" + m.email, null);
    if (cache && !cache.seed) { adv++; trans[cache.cur] = (trans[cache.cur] || 0) + 1; }
  });
  const viol = _hmLs("hifin_hm_lockviol", []).filter((x) => x.code === code).length;
  const firstDone = q.filter((x) => { const s = _hmLs("hifin_hm_resultseen_" + x.email, null); const t = _hmLs("hifin_hm_touch_" + x.email, []); return s && t.some((y) => y.key === "combo"); }).length;
  const firstNeed = q.filter((x) => _hmLs("hifin_hm_resultseen_" + x.email, null)).length;
  return { assigned: members.length, insAssigned: q.length, touches, done7, stalledN, adv, trans, lockOk: viol === 0, viol, firstRate: firstNeed ? Math.round(firstDone / firstNeed * 100) : 100 };
}

/* ── ⑧ 프로 제안함 — 모든 상태 변화에 사유. 자동 반영 없음(사람 검수) ── */
function hmIdeas() {
  let l = _hmLs("hifin_hm_ideas", null);
  if (l) return l;
  l = [
    { id: "ID-001", cat: "화면", title: "정체 회원에게 하이 문안 2안 제시", body: "정체 카드의 권장 문안이 1개뿐이라 회원 성향에 따라 고르기 어렵습니다. 격식/친근 2안이 필요합니다.", code: "HM-NB-26-007", dan: "강북지역단", tab: "⑨", at: Date.now() - 12 * _HM_DAY, status: "반영 완료", why: "하이 문안 템플릿 2안 채택 — 커밋 c71ef08 계열 반영(백서반영표 기록)", votes: 4 },
    { id: "ID-002", cat: "배분", title: "순번 배분 건너뛴 프로 우선권 표시", body: "한도 초과로 건너뛴 회차의 우선권이 있는지 화면에서 안 보입니다. 다음 회차 우선권 배지가 필요합니다.", code: "HM-SN-26-021", dan: "강남지역단", tab: "②", at: Date.now() - 6 * _HM_DAY, status: "검토중", why: "규칙은 존재(포인터 유지) — 배지 노출 방안 검토 중", votes: 2 },
    { id: "ID-003", cat: "규제", title: "만기 안내 문자에 광고 표기 여부 확인 요청", body: "만기 D-30 안내가 정보성인지 광고성인지 기준이 필요합니다. 법무 검토 요청드립니다.", code: "HM-WS-26-005", dan: "강서지역단", tab: "③", at: Date.now() - 3 * _HM_DAY, status: "보류", why: "법무 검토 대기 — 계약 관리 목적은 정보성으로 잠정 분류(사유 명시)", votes: 5 },
  ];
  _hmSave("hifin_hm_ideas", l);
  return l;
}
function hmIdeaAdd(code, o) {
  const p = hmProOf(code);
  if (!p) return { ok: false, reason: "코드 없음" };
  if (HM_BANNED.some((w) => (o.body || "").indexOf(w) >= 0)) { /* 금칙어는 제안 자체에는 완화 — 회원 정보만 차단 */ }
  if (/\d{6}-\d{7}|@hizenhealth/.test(o.body || "")) return { ok: false, reason: "회원 개인정보로 보이는 내용은 담을 수 없어요." };
  const l = hmIdeas();
  const it = { id: "ID-" + String(l.length + 1).padStart(3, "0"), cat: o.cat || "기타", title: (o.title || "").slice(0, 60), body: (o.body || "").slice(0, 2000), code, dan: p.dan, tab: o.tab || "-", at: Date.now(), status: "접수", why: "접수 완료 — 검토 대기", votes: 0 };
  l.unshift(it); _hmSave("hifin_hm_ideas", l);
  return { ok: true, idea: it };
}
function hmIdeaVote(id) { const l = hmIdeas(); const it = l.find((x) => x.id === id); if (it) { it.votes = (it.votes || 0) + 1; _hmSave("hifin_hm_ideas", l); } return l; }

/* ── ⑨ 고객 카드 조립 + 하이의 한 줄 ── */
function hmCustomerCard(m) {
  const stage = hmStageOf(m);
  const status = hmStatusOf(m, stage);
  const hb = hmHealthBrief(m);
  const plan = hmTouchPlan(m);
  const touches = _hmLs("hifin_hm_touch_" + m.email, []);
  const last = touches.length ? touches[touches.length - 1] : null;
  const next = plan.items.find((x) => !x.done && x.when > Date.now());
  const dueNow = plan.items.find((x) => x.due && !x.done);
  /* 하이의 한 줄 — 상태·단계·타이밍을 근거로 조립(새 문장 창작이 아니라 규칙 조립) */
  let hi;
  if (status.k === "HELD") hi = "검진결과 수령 전이에요. 지금은 프로필 사전 학습만 — 결과가 오면 제가 바로 알려드릴게요.";
  else if (dueNow) hi = `「${dueNow.title}」 시점이 왔어요. 오늘 연결하는 게 좋겠어요.`;
  else if (stage.stalled) {
    const nextStage = HM_STAGES[HM_STAGES.findIndex((s) => s.k === stage.cur) + 1];
    hi = `${stage.stalledDays}일째 ${stage.cur}에 멈춰 있어요.` + (nextStage ? ` ${nextStage.k}(${nextStage.name})로 가려면 ${nextStage.desc.split("—")[0].trim()}이 필요해요.` : "");
  } else if (next) hi = `다음 터치는 ${_hmDay(next.when)} 「${next.title.split("—")[0].trim()}」이에요. 그때까지는 지켜봐도 좋아요.`;
  else hi = "예정된 터치가 없어요. ⑨ 현황에서 단계 근거를 보고 다음 행동을 골라 주세요.";
  return { m, stage, status, hb, plan, last, next, dueNow, hi, mask: _hmMask(m.name), band: _hmBand(m), dan: hmDanOf(m) };
}

/* ── ① 신호 카드 — lrDetectType·lrScore 그대로 재사용(재구현 금지) ── */
function hmSignals(code) {
  const members = hmScope(code);
  const out = [];
  members.forEach((m) => {
    if (hmLockState(m).locked) return;   // 락 회원은 신호 목록에서도 제외(접촉 유도 자체를 막는다)
    let type = "L-ASK", sc = null;
    try { type = (typeof lrDetectType === "function") ? lrDetectType(m) : "L-ASK"; } catch (e) {}
    try { sc = (typeof lrScore === "function") ? lrScore(m, type) : null; } catch (e) {}
    if (!sc || sc.tier === "T4") return;   // 하이 판정: 지금은 상담보다 안내가 맞는 단계 — 카드 미생성
    const T = (typeof LR_TYPES !== "undefined" && LR_TYPES[type]) || { label: type };
    out.push({ m, mask: _hmMask(m.name), band: _hmBand(m), type, typeKo: T.label || type, direct: type === "L-ASK", tier: sc.tier, sla: sc.sla, why: (sc.why || []).slice(0, 3), stage: hmStageOf(m).cur });
  });
  return out.sort((a, b) => (a.direct === b.direct) ? (a.sla - b.sla) : (a.direct ? -1 : 1));
}
