/* ══════════════ 리드 라우팅(Phase 3) — 내 지역 상담 안내: 지역단 매핑·상담사 매칭·리드 라이프사이클 ══════════════
   설계 근거: docs/lead_routing/현대해상_리드라우팅_설계보고서.md (2026-07-31)
   지역단 16개·주소는 현대해상 지점찾기 실사값[사실]. 상담사 프로필은 시연용 예시.
   원칙: ①동의 게이트 없이는 리드 생성 불가 ②원본 검진수치 미전달(요약 코드만) ③회수 24h·쿨다운 30일. */

/* ── 시도 → 관할 지역단 매핑(실사 16 + 공백 시도는 인접 관할[추정]) ── */
const LR_DAN = {
  /* 자체 지역단 보유 [사실 2026-07-31 실사] */
  "서울": { dans: ["강북지역단", "강남지역단", "강서지역단"], note: null },
  "경기": { dans: ["경기지역단", "성남지역단", "북부지역단"], note: null },
  "인천": { dans: ["경인지역단"], note: null },
  "강원": { dans: ["강원지역단"], note: null },
  "대전": { dans: ["충청지역단"], note: null },
  "충남": { dans: ["중부지역단"], note: null },
  "광주": { dans: ["호남지역단"], note: null },
  "전북": { dans: ["전북지역단"], note: null },
  "대구": { dans: ["대경지역단"], note: null },
  "부산": { dans: ["부산지역단"], note: null },
  "울산": { dans: ["영남지역단"], note: null },
  "경남": { dans: ["경남지역단"], note: null },
  /* 자체 지역단 공백 시도 — 인접 관할[추정] + 비대면 우선 제안(보고서 §2.3 예외1) */
  "세종": { dans: ["충청지역단"], note: "세종은 충청지역단 관할로 안내돼요(비대면 상담을 먼저 권해드려요)" },
  "충북": { dans: ["중부지역단"], note: "충북은 중부지역단 관할로 안내돼요(비대면 상담을 먼저 권해드려요)" },
  "전남": { dans: ["호남지역단"], note: "전남은 호남지역단 관할로 안내돼요(비대면 상담을 먼저 권해드려요)" },
  "경북": { dans: ["대경지역단"], note: "경북은 대경지역단 관할로 안내돼요(비대면 상담을 먼저 권해드려요)" },
  "제주": { dans: ["부산지역단"], note: "제주는 인접 권역 관할로 안내돼요(비대면 상담을 먼저 권해드려요)" },
};
/* 서울 구 단위 세분(강북·강남·강서 구분 — 행정동→지역단 1차 기준의 데모 축약) */
const LR_SEOUL_GU = {
  "강북지역단": ["종로구", "중구", "성북구", "강북구", "도봉구", "노원구", "동대문구", "중랑구", "성동구", "광진구", "용산구", "은평구", "서대문구", "마포구"],
  "강남지역단": ["강남구", "서초구", "송파구", "강동구"],
  "강서지역단": ["영등포구", "구로구", "금천구", "동작구", "관악구", "양천구", "강서구"],
};
/* 지역단 거점(실사 주소[사실]) + 대표 지점(실사 확인분) */
const LR_DAN_INFO = {
  "강북지역단": { addr: "서울 중구 명동2길20 14층", tel: "02-6744-1204", lat: 37.5637, lng: 126.9838, branches: [{ n: "세종로지점", a: "서울 중구 명동2길20 12층" }, { n: "광화문지점", a: "서울 중구 명동2길20 4층" }] },
  "강남지역단": { addr: "서울 송파구 송파대로570 6층", tel: "02-368-9912", lat: 37.5145, lng: 127.1066, branches: [{ n: "강남권 지점", a: "서울 송파구 송파대로570" }] },
  "강서지역단": { addr: "서울 영등포구 당산로141 12층", tel: "02-2628-4104", lat: 37.5340, lng: 126.9026, branches: [{ n: "강서권 지점", a: "서울 영등포구 당산로141" }] },
};
/* 상담사 프로필(시연용 예시 — 실명부는 R3 명부 수령 후 교체) */
const LR_AGENTS = {
  "강북지역단": [
    { id: "AG-N01", name: "김지원 상담사", career: 12, tags: ["유병자 설계", "실손 세대전환"], hours: "평일 10~19시", video: true },
    { id: "AG-N02", name: "박성호 상담사", career: 8, tags: ["가족 통합 설계", "치료비 플랜"], hours: "평일 9~18시 · 토 오전", video: true },
  ],
  "강남지역단": [
    { id: "AG-S01", name: "이수민 상담사", career: 15, tags: ["프리미엄 종합", "생활비 보장"], hours: "평일 9~18시", video: true },
    { id: "AG-S02", name: "정태윤 상담사", career: 7, tags: ["간편심사", "재산정 연계"], hours: "평일 11~20시", video: false },
  ],
  "강서지역단": [
    { id: "AG-W01", name: "한서연 상담사", career: 10, tags: ["가족 통합 설계", "유병자 설계"], hours: "평일 9~18시", video: true },
  ],
  _default: [
    { id: "AG-R01", name: "지역 전담 상담사", career: 9, tags: ["종합 설계"], hours: "평일 9~18시", video: true },
  ],
};

/* ══ Phase 1 — 전국 커버리지 매트릭스(2026-07-31 현대해상 지점찾기 실사값[사실]) ══
   br: '보험상담·가입 가능' 지점 수 · dans: 자체 지역단 · gap: 자체 지역단 공백(인접 관할[추정]) */
const LR_COVERAGE = [
  { sido: "서울", dans: ["강북", "강남", "강서"], br: 41, gap: false }, { sido: "경기", dans: ["경기", "성남", "북부"], br: 64, gap: false },
  { sido: "인천", dans: ["경인"], br: 14, gap: false }, { sido: "강원", dans: ["강원"], br: 9, gap: false },
  { sido: "대전", dans: ["충청"], br: 8, gap: false }, { sido: "세종", dans: [], br: 2, gap: true },
  { sido: "충남", dans: ["중부"], br: 15, gap: false }, { sido: "충북", dans: [], br: 8, gap: true },
  { sido: "광주", dans: ["호남"], br: 11, gap: false }, { sido: "전남", dans: [], br: 9, gap: true },
  { sido: "전북", dans: ["전북"], br: 18, gap: false }, { sido: "대구", dans: ["대경"], br: 10, gap: false },
  { sido: "경북", dans: [], br: 14, gap: true }, { sido: "부산", dans: ["부산"], br: 13, gap: false },
  { sido: "울산", dans: ["영남"], br: 14, gap: false }, { sido: "경남", dans: ["경남"], br: 16, gap: false },
  { sido: "제주", dans: [], br: 6, gap: true },
];

/* ══ Phase 2 — 리드 유형 정의(§2.1)·스코어링(§2.2)·가중 배분(§2.3) ══ */
const LR_TYPES = {
  "L-ASK": { label: "명시적 상담 신청", urg: 4, fit: 0, sla: 4 },
  "L-GAP": { label: "보장공백 발견", urg: 2, fit: 3, sla: 4 },
  "L-CKUP": { label: "검진 이상 후 보장 문의", urg: 3, fit: 3, sla: 4 },
  "L-CLAIM": { label: "보험금 청구 발생", urg: 3, fit: 2, sla: 4 },
  "L-RERATE": { label: "요율 재산정 신청", urg: 2, fit: 3, sla: 8 },
  "L-FAM": { label: "가족 단위 상담", urg: 2, fit: 3, sla: 8 },
  "L-QUIT": { label: "간편가입 이탈", urg: 2, fit: 2, sla: 8 },
  "L-CARE": { label: "치료비 지원(보호 — 제안 금지)", urg: 3, fit: 0, sla: 4 },
};
/* 문맥 기반 리드 유형 자동 감지 — 회원의 최근 이벤트에서 제안(회원이 바꿀 수 있음) */
function lrDetectType(m) {
  try { const cl = JSON.parse(localStorage.getItem("hifin_claims") || "[]"); if (cl.length && Date.now() - cl[cl.length - 1].at < 14 * 86400000) return "L-CLAIM"; } catch (e) {}
  try { const st = (typeof rerateState === "function") ? rerateState() : null; if (st && st.status === "done") return "L-RERATE"; } catch (e) {}
  try { const fam = (typeof familyLoad === "function" && m) ? (familyLoad(m.email, (m.name || "가")[0]) || []) : []; if (fam.length >= 2) return "L-FAM"; } catch (e) {}
  try { const R = (typeof demoReport === "function" && m) ? demoReport(m) : null; if (R && R.hr && R.hr.length) return "L-CKUP"; } catch (e) {}
  try { const g = (typeof analyzeCoverageGap === "function" && m) ? analyzeCoverageGap(m) : null; if (g && g.gaps && g.gaps.length) return "L-GAP"; } catch (e) {}
  return "L-ASK";
}
/* 스코어링(§2.2 의사코드의 실구현) — A 수용성(0~50) + F 적합도(0~50) → 티어.
   ⚠️ 법적 경계: 건강 변수는 등급/플래그만 산입하며 상담 우선순위 산정에만 사용(인수·요율 사용 금지). */
function lrScore(m, type) {
  const T = LR_TYPES[type] || LR_TYPES["L-ASK"];
  const why = [];
  let A = 0;
  if (type === "L-ASK") { A += 20; why.push(["직접 상담을 요청하셨어요", "+20"]); }
  else { A += T.urg * 4; why.push([T.label + " 이벤트 직후예요", "+" + T.urg * 4]); }
  A += 10; why.push(["최근 플랫폼 활동이 있어요", "+10"]);   // 데모: 접속 중=활동
  try { const done = lrLeads(m).filter((x) => x.status === "CONSULTED" && (x.stars || 0) >= 4); if (done.length) { A += 6; why.push(["지난 상담 만족(★4+)", "+6"]); } } catch (e) {}
  const cd = lrCooldown(m); if (cd.monthlyN >= 1) { A -= 15; why.push(["이번 달 접촉 이력(과다 접촉 방지)", "−15"]); }
  let F = 0;
  try { const g = (typeof analyzeCoverageGap === "function" && m) ? analyzeCoverageGap(m) : null; const n = g && g.gaps ? Math.min(3, g.gaps.length) : 0; if (n) { F += n * 5; why.push(["보장공백 " + n + "건(등급 산입)", "+" + n * 5]); } } catch (e) {}
  try { const R = (typeof demoReport === "function" && m) ? demoReport(m) : null; if (R && R.hr && R.hr.length) { F += 10; why.push(["검진 관리 필요 항목 있음(플래그만)", "+10"]); } } catch (e) {}
  try { const fam = (typeof familyLoad === "function" && m) ? (familyLoad(m.email, (m.name || "가")[0]) || []) : []; if (fam.length) { F += 8; why.push(["가족 " + fam.length + "명 등록", "+8"]); } } catch (e) {}
  try { const ins = (typeof memberInsurance === "function" && m) ? memberInsurance(m) : null; if (ins && (!ins.silson.enrolled || !(ins.riders || []).length)) { F += 7; why.push(["보장 형태상 공백 소지(실손/진단비)", "+7"]); } } catch (e) {}
  const age = (m && (m.regAge || m.age)) || 45; if (age >= 30 && age <= 55) { F += 5; why.push(["장기보험 적합 연령대", "+5"]); }
  try { const R2 = lrRegionOf(m); if (!R2.gap) { F += 5; why.push(["거주 지역 직접 커버리지", "+5"]); } } catch (e) {}
  A = Math.max(0, Math.min(50, A)); F = Math.max(0, Math.min(50, F));
  const s = A + F;
  const tier = s >= 70 ? "T1" : s >= 50 ? "T2" : s >= 30 ? "T3" : "T4";
  const sla = tier === "T1" ? (T.sla || 4) : tier === "T2" ? 8 : 48;
  return { A, F, sum: s, tier, sla, why };
}
/* 가중 배분(§2.3 [2]~[3]) — 배정잔량(역가중)·성과(평가)·SLA 준수 실적으로 상담사 선택 */
function lrPickAgent(m, R) {
  const all = lrLeads(m);
  const scored = R.agents.map((a) => {
    const mine = all.filter((x) => x.agentId === a.id);
    const active = mine.filter((x) => x.status === "ASSIGNED").length;
    const overdue = mine.filter((x) => x.status === "ASSIGNED" && Date.now() - x.ts > x.slaH * 3600000).length;
    const stars = mine.filter((x) => x.stars).map((x) => x.stars);
    const perf = stars.length ? stars.reduce((p, q) => p + q, 0) / stars.length / 5 : 0.7;
    const w = 0.35 * (1 / (1 + active)) + 0.25 * (overdue ? 0 : 1) + 0.20 * Math.min(1, perf) + 0.20;   // 상수항=가용 가정
    return { a, w };
  }).sort((x, y) => y.w - x.w);
  return scored[0].a;
}
/* ── 회원 → 관할 매핑 ── */
function lrRegionOf(m) {
  let sido = "서울", sgg = "";
  try { const r = (typeof memberRegion === "function") ? memberRegion() : null; if (r) { sido = r.sidoShort || "서울"; sgg = r.sgg || ""; } } catch (e) {}
  const map = LR_DAN[sido] || LR_DAN["서울"];
  let dan = map.dans[0];
  if (sido === "서울" && sgg) { for (const d in LR_SEOUL_GU) if (LR_SEOUL_GU[d].includes(sgg)) { dan = d; break; } }
  const info = LR_DAN_INFO[dan] || { addr: dan + " 거점", tel: "", lat: 37.5665, lng: 126.978, branches: [] };
  const agents = LR_AGENTS[dan] || LR_AGENTS._default;
  return { sido, sgg, dan, info, agents, note: map.note, gap: !!map.note };
}

/* ── 리드 저장(회원별)·라이프사이클 — CREATED→CONSENT_OK→ASSIGNED→CONTACTED→CONSULTED / RECALLED ── */
function _lrKey(m) { return "hifin_leads_" + ((m && m.email) || "self"); }
function lrLeads(m) { try { return JSON.parse(localStorage.getItem(_lrKey(m)) || "[]"); } catch (e) { return []; } }
function _lrSave(m, l) { try { localStorage.setItem(_lrKey(m), JSON.stringify(l.slice(-30))); } catch (e) {} }

/* 동의 게이트(보고서 §2.3 [0]) — 데이터 금고 동의 체계 재사용: health+insurance 필수 */
function lrConsentOK(m) {
  try { const v = vaultLoad(anonToken(m)); const st = (v && v.consents && v.consents.state) || {}; return !!(st.health && st.insurance); } catch (e) { return false; }
}

/* 쿨다운(30일)·월 접촉 상한(2회) — 회원 보호를 시스템이 강제(보고서 §2.3) */
function lrCooldown(m) {
  const l = lrLeads(m); const now = Date.now();
  const closed = l.filter((x) => x.status === "DECLINED" && now - x.ts < 30 * 86400000);
  const monthly = l.filter((x) => now - x.ts < 30 * 86400000 && ["ASSIGNED", "CONTACTED", "CONSULTED"].includes(x.status));
  return { blocked: closed.length > 0, monthlyN: monthly.length, capped: monthly.length >= 2 };
}

/* 리드 생성 — 동의·쿨다운 검증 → 지역 매핑 → 배정(SLA 타이머 시작) */
function lrCreateLead(m, opt) {
  if (!m) return { ok: false, reason: "로그인 후 이용할 수 있어요." };
  if (!lrConsentOK(m)) return { ok: false, reason: "consent" };
  const cd = lrCooldown(m);
  if (cd.capped) return { ok: false, reason: "이번 달 상담 연결이 이미 2건 있어요 — 회원 보호를 위해 다음 달에 다시 연결해 드릴게요." };
  const R = lrRegionOf(m);
  /* Phase 2: 유형 자동 감지 → 스코어링 → 가중 배분 */
  const type = opt.type || lrDetectType(m);
  const sc = lrScore(m, type);
  if (sc.tier === "T4") return { ok: false, reason: "지금은 상담보다 하이 안내가 더 맞는 단계예요 — 보장 분석을 먼저 보고 언제든 다시 연결해 드릴게요." };
  const agent = (opt.agentId && R.agents.find((a) => a.id === opt.agentId)) || lrPickAgent(m, R);
  const lead = {
    id: "LD-" + Date.now().toString(36).toUpperCase(),
    ts: Date.now(), type, tier: sc.tier, score: { A: sc.A, F: sc.F },
    dan: R.dan, sido: R.sido, sgg: R.sgg,
    agent: agent.name, agentId: agent.id,
    channel: opt.channel || "화상", slot: opt.slot || "",
    briefing: !!opt.briefing,   // 가명 보장공백 요약 사전 전달 동의(토글)
    gapCode: opt.briefing ? (opt.gapCode || "GAP-SUMMARY") : null,   // 원본 수치 미전달 — 코드만
    ageBand: (() => { const a = (m.regAge || m.age || 45); return Math.floor(a / 10) * 10 + "대"; })(),
    sex: m.sex || "-",   // 브리핑용 가명 최소 정보(연령대·성별) — 이름·연락처 원문은 리드에 싣지 않음(콜백 토큰 원칙)
    status: "ASSIGNED", slaH: sc.sla, retry: 0, history: [{ at: Date.now(), ev: `배정(${sc.tier} · A${sc.A}+F${sc.F}) — SLA ${sc.sla}h 시작` }],
  };
  const l = lrLeads(m); l.push(lead); _lrSave(m, l);
  try { vaultAccessLog(anonToken(m), "member", `지역 상담 리드 생성(${R.dan} · ${agent.name} · ${lead.channel})${lead.briefing ? " — 가명 요약 전달 동의" : ""}`); } catch (e) {}
  try { chainAppend({ type: "record", token: anonToken(m), note: `리드 ${lead.id} 생성 — ${R.dan} 배정(동의 검증 완료)` }); } catch (e) {}
  try { if (typeof notifPush === "function") notifPush(m, { t: "상담 배정 완료", d: `${R.dan} ${agent.name}님이 ${lead.channel} 상담으로 연락드려요(4시간 내 접촉 원칙)`, k: "ins" }); } catch (e) {}
  return { ok: true, lead };
}
function lrUpdate(m, id, patch, ev) {
  const l = lrLeads(m); const x = l.find((y) => y.id === id); if (!x) return null;
  Object.assign(x, patch); x.history.push({ at: Date.now(), ev });
  _lrSave(m, l); return x;
}
function lrRate(m, id, stars) { return lrUpdate(m, id, { status: "CONSULTED", stars }, `상담 완료 — 회원 평가 ${stars}점`); }
function lrReassign(m, id) {
  const l = lrLeads(m); const x = l.find((y) => y.id === id); if (!x) return null;
  const R = lrRegionOf(m);
  const other = R.agents.find((a) => a.id !== x.agentId) || R.agents[0];
  return lrUpdate(m, id, { agent: other.name, agentId: other.id, status: "ASSIGNED" }, `재배정 요청 — ${other.name}(으)로 변경`);
}
function lrDecline(m, id) { return lrUpdate(m, id, { status: "DECLINED" }, "회원 요청으로 종결 — 30일 쿨다운 시작"); }
/* 시연: 접촉 시뮬(콘솔·데모 버튼) */
function lrSimContact(m, id) { return lrUpdate(m, id, { status: "CONTACTED" }, "상담사 최초 접촉(SLA 내) — 일정 확정"); }

/* 관리자 콘솔용 집계(보고서 §3.2 대시보드 축약) */
function lrOpsStats(m) {
  const l = lrLeads(m);
  const by = {}; l.forEach((x) => { by[x.status] = (by[x.status] || 0) + 1; });
  const active = l.filter((x) => x.status === "ASSIGNED");
  const overdue = active.filter((x) => Date.now() - x.ts > x.slaH * 3600000);
  return { total: l.length, by, active: active.length, overdue: overdue.length };
}

/* ══ B2B 콘솔(보고서 §3.2) — 조직·상담사 화면용 엔진: 전 회원 리드 집계·결과 코드·SLA 회수·감사 로그 ══ */
const LR_RESULT_CODES = [["CONTACTED", "연결됨"], ["NOANSWER", "부재(재시도)"], ["DECLINED", "거절"], ["CONSULTED", "상담확정"], ["APPLIED", "청약연결"]];
/* 전 회원 리드 집계 — localStorage의 hifin_leads_* 전 키 스캔(콘솔은 가명 뷰만 소비) */
function lrAllLeads() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("hifin_leads_")) continue;
      let arr = []; try { arr = JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) {}
      arr.forEach((x) => out.push({ key: k, lead: x }));
    }
  } catch (e) {}
  return out.sort((a, b) => b.lead.ts - a.lead.ts);
}
function lrUpdateByKey(key, id, patch, ev) {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    const x = arr.find((y) => y.id === id); if (!x) return null;
    Object.assign(x, patch); (x.history = x.history || []).push({ at: Date.now(), ev });
    localStorage.setItem(key, JSON.stringify(arr)); return x;
  } catch (e) { return null; }
}
/* 결과 코드 입력(결과 없이 종결 불가 원칙 — UI가 강제) */
function lrSetResult(key, id, code) {
  const label = (LR_RESULT_CODES.find((c) => c[0] === code) || [code, code])[1];
  const patch = { status: code };
  if (code === "NOANSWER") { patch.status = "ASSIGNED"; }   // 부재는 배정 유지·재시도 카운트
  const x = lrUpdateByKey(key, id, patch, `결과 코드: ${label}`);
  if (x && code === "NOANSWER") lrUpdateByKey(key, id, { retry: (x.retry || 0) + 1 }, "재시도 예약");
  lrAudit(id, "결과 입력 — " + label);
  return x;
}
/* SLA 초과 회수 → 차순위 재배정(보고서 §2.3: 24h 회수·1회 재배정) */
function lrRecall(key, id) {
  const arr = (() => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; } })();
  const x = arr.find((y) => y.id === id); if (!x) return null;
  const pool = (LR_AGENTS[x.dan] || LR_AGENTS._default);
  const other = pool.find((a) => a.id !== x.agentId) || pool[0];
  lrAudit(id, "SLA 초과 회수 → 재배정(" + other.name + ")");
  return lrUpdateByKey(key, id, { agent: other.name, agentId: other.id, ts: Date.now(), status: "ASSIGNED" }, `SLA 초과 회수 — ${other.name} 재배정(타이머 재시작)`);
}
/* 감사 로그 — 콘솔에서 누가·언제·어떤 리드를 열람/처리했는지(보고서 §3.3 요건의 데모 구현) */
function lrAudit(leadId, action) {
  try {
    const k = "hifin_lead_audit";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ at: Date.now(), by: "콘솔(파트너 시연 계정)", leadId, action });
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}
function lrAuditList() { try { return JSON.parse(localStorage.getItem("hifin_lead_audit") || "[]"); } catch (e) { return []; } }
/* 콘솔 KPI(§6.1 축약): 응답률·SLA 준수율·전환율 */
function lrConsoleStats() {
  const all = lrAllLeads().map((x) => x.lead);
  const n = all.length;
  const contacted = all.filter((x) => ["CONTACTED", "CONSULTED", "APPLIED"].includes(x.status)).length;
  const applied = all.filter((x) => x.status === "APPLIED").length;
  const consulted = all.filter((x) => ["CONSULTED", "APPLIED"].includes(x.status)).length;
  const active = all.filter((x) => x.status === "ASSIGNED");
  const overdue = active.filter((x) => Date.now() - x.ts > x.slaH * 3600000).length;
  const slaOK = n ? Math.round(((n - overdue) / n) * 100) : 100;
  return { n, active: active.length, overdue, contacted, consulted, applied,
    respRate: n ? Math.round(contacted / n * 100) : 0, convRate: consulted ? Math.round(applied / consulted * 100) : 0, slaOK };
}
/* 시연 리드 시드 — 파일럿 큐 시연용(가상 회원 3건 · 1건은 SLA 초과 상태) */
function lrSeedDemo() {
  const k = "hifin_leads_demo@lead.sim";
  try { if (JSON.parse(localStorage.getItem(k) || "[]").length) return false; } catch (e) {}
  const now = Date.now();
  const mk = (i, over, st, tier, type, dan, sgg, age, sex, ch) => ({
    id: "LD-DEMO" + i, ts: now - (over ? 6.5 : 1 + i) * 3600000, type, tier, dan, sido: "서울", sgg,
    agent: (LR_AGENTS[dan] || LR_AGENTS._default)[0].name, agentId: (LR_AGENTS[dan] || LR_AGENTS._default)[0].id,
    channel: ch, slot: "", briefing: true, gapCode: "GAP-" + (i + 1) + "건", ageBand: age, sex, status: st, slaH: 4, retry: 0,
    history: [{ at: now - 3600000, ev: "배정(시연 리드)" }],
  });
  const demo = [
    mk(1, true, "ASSIGNED", "T1", "L-CKUP", "강북지역단", "성북구", "50대", "남", "방문"),
    mk(2, false, "ASSIGNED", "T2", "L-GAP", "강남지역단", "송파구", "40대", "여", "화상"),
    mk(3, false, "CONTACTED", "T1", "L-FAM", "강서지역단", "양천구", "60대", "여", "전화"),
  ];
  try { localStorage.setItem(k, JSON.stringify(demo)); } catch (e) {}
  return true;
}
