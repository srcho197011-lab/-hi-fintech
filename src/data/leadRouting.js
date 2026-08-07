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
/* 지역단 거점 — 서울 3곳은 실사 주소[사실], 그 외는 거점 도시 좌표[추정 — 주소는 제휴 협의(R1·R2) 후 확정] */
const LR_DAN_INFO = {
  "강북지역단": { addr: "서울 중구 명동2길20 14층", tel: "02-6744-1204", lat: 37.5637, lng: 126.9838, branches: [{ n: "세종로지점", a: "서울 중구 명동2길20 12층" }, { n: "광화문지점", a: "서울 중구 명동2길20 4층" }] },
  "강남지역단": { addr: "서울 송파구 송파대로570 6층", tel: "02-368-9912", lat: 37.5145, lng: 127.1066, branches: [{ n: "강남권 지점", a: "서울 송파구 송파대로570" }] },
  "강서지역단": { addr: "서울 영등포구 당산로141 12층", tel: "02-2628-4104", lat: 37.5340, lng: 126.9026, branches: [{ n: "강서권 지점", a: "서울 영등포구 당산로141" }] },
  "경기지역단": { addr: "경기 수원 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 37.2636, lng: 127.0286, branches: [] },
  "성남지역단": { addr: "경기 성남 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 37.4449, lng: 127.1389, branches: [] },
  "북부지역단": { addr: "경기 의정부 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 37.7381, lng: 127.0337, branches: [] },
  "경인지역단": { addr: "인천 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 37.4563, lng: 126.7052, branches: [] },
  "강원지역단": { addr: "강원 춘천 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 37.8813, lng: 127.7298, branches: [] },
  "충청지역단": { addr: "대전 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 36.3504, lng: 127.3845, branches: [] },
  "중부지역단": { addr: "충남 천안 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 36.8151, lng: 127.1139, branches: [] },
  "호남지역단": { addr: "광주 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.1595, lng: 126.8526, branches: [] },
  "전북지역단": { addr: "전북 전주 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.8242, lng: 127.1480, branches: [] },
  "대경지역단": { addr: "대구 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.8714, lng: 128.6014, branches: [] },
  "부산지역단": { addr: "부산 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.1796, lng: 129.0756, branches: [] },
  "영남지역단": { addr: "울산 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.5384, lng: 129.3114, branches: [] },
  "경남지역단": { addr: "경남 창원 거점(주소는 제휴 확정 후 표기)", tel: "", lat: 35.2281, lng: 128.6811, branches: [] },
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

/* 자율 지역 선택(형 지시 2026-07-31) — 병원 안내처럼 전국 어느 지역이든 직접 선택: 멀리 계신 가족을 위한 상담 연결 */
function lrRegionBy(sido, danName) {
  const map = LR_DAN[sido] || LR_DAN["서울"];
  const dan = (danName && map.dans.includes(danName)) ? danName : map.dans[0];
  const info = LR_DAN_INFO[dan] || { addr: dan + " 거점", tel: "", lat: 37.5665, lng: 126.978, branches: [] };
  const agents = LR_AGENTS[dan] || LR_AGENTS._default;
  return { sido, sgg: "", dan, info, agents, note: map.note, gap: !!map.note, picked: true };
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
  const R = opt.region || lrRegionOf(m);   // 자율 지역 선택 시 그 관할로 배정(가족 상담 등)
  /* Phase 2: 유형 자동 감지 → 스코어링 → 가중 배분 */
  const type = opt.type || (opt.forFamily ? "L-FAM" : null) || lrDetectType(m);
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
    family: !!opt.forFamily,   // 원격지(가족을 위한) 상담 표시 — 콘솔 브리핑에 노출
    branch: opt.branch || null, branchAddr: opt.branchAddr || null,   // 회원이 직접 고른 지점(있으면 그 지점으로 안내)
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
/* ══ Phase 5 — 동의 철회 시 배정 리드 즉시 회수(보고서 §5.3: T+0 회수 → 24h 접촉중지 → 72h 파기확인) ══ */
function lrWithdrawAll(m) {
  if (!m) return 0;
  const l = lrLeads(m); let k = 0;
  l.forEach((x) => {
    if (["ASSIGNED", "CONTACTED"].includes(x.status)) {
      x.status = "WITHDRAWN"; k++;
      (x.history = x.history || []).push({ at: Date.now(), ev: "동의 철회 — 즉시 회수·접촉 중지, 전달분 파기 확인 절차 개시(T+72h)" });
      lrAudit(x.id, "동의 철회 회수(WITHDRAWN)");
    }
  });
  if (k) {
    _lrSave(m, l);
    try { chainAppend({ type: "consent", token: anonToken(m), note: `동의 철회 — 지역 상담 배정 ${k}건 즉시 회수·파기 절차 개시` }); } catch (e) {}
    try { if (typeof notifPush === "function") notifPush(m, { t: "상담 연결 중단", d: `동의 철회로 배정 ${k}건이 회수됐어요 — 전달 정보 파기 확인까지 알려드릴게요`, k: "ins" }); } catch (e) {}
  }
  return k;
}

/* ══ Phase 5 — 컴플라이언스 체크리스트(보고서 §5.1 C-1~C-10 요약) · 시스템 강제 항목은 enforced 표기 ══ */
const LR_COMPLIANCE = [
  { c: "C-1", t: "개인정보 제3자 제공 동의", basis: "개인정보보호법 §17①2", ctrl: "리드 생성 전 동의 게이트 — 미동의 시 생성 불가", enforced: true },
  { c: "C-2", t: "민감정보(건강) 별도 동의·코드화", basis: "개인정보보호법 §23①", ctrl: "원본 수치 미전달 — 분석 요약 코드만, 요약 전달은 별도 토글 동의", enforced: true },
  { c: "C-3", t: "가명처리로 동의 대체 불가", basis: "개인정보보호법 §28-2", ctrl: "적법 근거는 항상 동의 — 가명화는 최소화 수단으로만", enforced: true },
  { c: "C-4", t: "모집 자격·역할 경계", basis: "보험업법 §2·§83~87", ctrl: "하이핀=연결·광고 / 모집=글로벌예방금융(제2025060038호)·현대해상 — 화면 문구 준수 [법률 자문 전제]", enforced: false },
  { c: "C-5", t: "특별이익 제공 금지", basis: "보험업법 §98", ctrl: "혜택은 플랫폼 활동 대가로만 — 계약 체결과 비연동", enforced: false },
  { c: "C-6", t: "부당 권유(승환) 금지", basis: "보험업법 §97", ctrl: "1~2세대 실손 해지 경고 하드코딩(하이 가드) · 기존계약 비교 고지", enforced: true },
  { c: "C-7", t: "취약 회원 보호(L-CARE)", basis: "금소법 §17~19 취지", ctrl: "치료비 지원 신청자 60일 상품 제안 금지 — 시스템 플래그", enforced: true },
  { c: "C-8", t: "개인신용정보 동의", basis: "신용정보법 §32·§33", ctrl: "계약 보유 형태는 동의 항목에 별도 명시", enforced: false },
  { c: "C-9", t: "광고성 정보 사전 동의·수신거부", basis: "정보통신망법 §50", ctrl: "mkt 미동의 시 알림 불가 · DNC 즉시 회수 · 쿨다운 30일·월 2회 상한", enforced: true },
  { c: "C-10", t: "건강정보 차별 금지(인하·가입확대 전용)", basis: "감독규정·협약 명문화", ctrl: "재산정 API 인하·가입확대값만 수용 — 인상·인수 거절·할증 사용 계약상 금지", enforced: true },
];

/* ══ Phase 6 — 파일럿 설정·KPI 실측(보고서 §6.1·§6.4) ══ */
const LR_PILOT = {
  region: "서울 강남지역단", weeks: 8, target: 300,
  criteria: [["리드 응답률", "≥ 80%"], ["최초 접촉(T1)", "≤ 4영업시간"], ["상담 실시율", "≥ 40%"], ["청약 전환율", "≥ 8%"], ["민원·수신거부율", "≤ 1.5%"], ["회원 만족도", "≥ 4.2/5"]],
  roadmap: [["P0 준비", "법률 자문·협약·R1~R3 수령·동의 UX", "done"], ["P1 파일럿", "강남지역단 8주 · 리드 300건", "now"], ["P2 권역 확대", "수도권 7개 지역단", "wait"], ["P3 전국 확산", "16개 지역단+공백 5개 시도 보강", "wait"]],
};
function lrKpi() {
  const all = lrAllLeads().map((x) => x.lead);
  const n = all.length;
  const contacted = all.filter((x) => ["CONTACTED", "CONSULTED", "APPLIED"].includes(x.status));
  const ttfcArr = contacted.map((x) => { const h = (x.history || []).find((y) => /연결됨|접촉/.test(y.ev)); return h ? (h.at - x.ts) / 3600000 : null; }).filter((v) => v != null && v >= 0).sort((a, b) => a - b);
  const ttfc = ttfcArr.length ? ttfcArr[Math.floor(ttfcArr.length / 2)] : null;
  const consulted = all.filter((x) => ["CONSULTED", "APPLIED"].includes(x.status)).length;
  const applied = all.filter((x) => x.status === "APPLIED").length;
  const declined = all.filter((x) => x.status === "DECLINED").length;
  const stars = all.filter((x) => x.stars).map((x) => x.stars);
  const byDan = {}; all.forEach((x) => { const d = byDan[x.dan] = byDan[x.dan] || { n: 0, ap: 0 }; d.n++; if (x.status === "APPLIED") d.ap++; });
  return {
    n, respRate: n ? Math.round(contacted.length / n * 100) : 0,
    ttfc: ttfc != null ? ttfc.toFixed(1) : null,
    consultRate: contacted.length ? Math.round(consulted / contacted.length * 100) : 0,
    convRate: consulted ? Math.round(applied / consulted * 100) : 0,
    complaintRate: n ? (declined / n * 100).toFixed(1) : "0.0",
    stars: stars.length ? (stars.reduce((p, q) => p + q, 0) / stars.length).toFixed(1) : null,
    byDan, progress: Math.min(100, Math.round(n / LR_PILOT.target * 100)),
  };
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
