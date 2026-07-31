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
  const agent = (opt.agentId && R.agents.find((a) => a.id === opt.agentId)) || R.agents[0];
  const lead = {
    id: "LD-" + Date.now().toString(36).toUpperCase(),
    ts: Date.now(), type: opt.type || "L-ASK", tier: opt.tier || "T1",
    dan: R.dan, sido: R.sido, sgg: R.sgg,
    agent: agent.name, agentId: agent.id,
    channel: opt.channel || "화상", slot: opt.slot || "",
    briefing: !!opt.briefing,   // 가명 보장공백 요약 사전 전달 동의(토글)
    gapCode: opt.briefing ? (opt.gapCode || "GAP-SUMMARY") : null,   // 원본 수치 미전달 — 코드만
    ageBand: (() => { const a = (m.regAge || m.age || 45); return Math.floor(a / 10) * 10 + "대"; })(),
    sex: m.sex || "-",   // 브리핑용 가명 최소 정보(연령대·성별) — 이름·연락처 원문은 리드에 싣지 않음(콜백 토큰 원칙)
    status: "ASSIGNED", slaH: 4, retry: 0, history: [{ at: Date.now(), ev: "배정 — SLA 4h 시작" }],
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
