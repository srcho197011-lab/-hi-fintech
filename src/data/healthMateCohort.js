/* ══════════════ 헬스메이트 데모 데이터 스케일업 — 프로 700 × 회원 10만 시군구 매칭 ══════════════
   설계서: docs/hi_healthmate/헬스메이트_데모데이터_스케일업_프롬프트_v1.0.md (형 확정 2026-08-20:
   ①퍼널=finModel 정합 ②프로=현대해상 설계사 하이핀 위촉 ③시군구=지점 밀도 가중)
   원칙: 지역 일치 제1원칙 · 결정론 on-demand(저장 0바이트) · 기존 10만 코호트 불변(별도 시드) ·
        체험 16명=상호작용층 / 코호트=관측층(행동은 세션 메모리만) */

/* ── 시드 유틸(별도 네임스페이스 — pilotCohort의 rng 소비 순서 불가침) ── */
function _hmcRng(s) { return _mul32(_hmHash(String(s))); }
const _HMC = { pros: null, sggIdx: null, sggW: null, session: {} };   // 메모리 캐시(저장 금지)

/* ── 지역단 약호(코드 생성용) ── */
const HMC_DAN_ABBR = { "강북지역단": "NB", "강남지역단": "SN", "강서지역단": "WS", "경기지역단": "GG", "성남지역단": "SNM", "북부지역단": "GBB", "경인지역단": "IC", "강원지역단": "GW", "충청지역단": "CC", "중부지역단": "JB", "호남지역단": "HN", "전북지역단": "JBK", "대경지역단": "DG", "부산지역단": "BS", "영남지역단": "YN", "경남지역단": "GN", "광역(전국)": "WD" };
const _HMC_GG_NORTH = ["의정부", "남양주", "파주", "구리", "양주"];   // 경기 북부지역단 관할(데모 축약)

/* 주소 → DISTRICTS 시군구 매칭(긴 명칭 우선 — "광주시" vs "광주" 오매칭 방지) */
function _hmcSggOfAddr(sido, addr) {
  const list = ((typeof DISTRICTS !== "undefined" && DISTRICTS[sido]) || []).slice().sort((a, b) => b.length - a.length);
  for (const d of list) if (addr.indexOf(d) === 0 || addr.indexOf(d.replace(/시$/, "")) === 0) return d;
  return list.length ? [...list].sort()[0] : "";
}
function _hmcDanOf(sido, sgg) {
  if (sido === "서울" && typeof LR_SEOUL_GU !== "undefined") { for (const d in LR_SEOUL_GU) if (LR_SEOUL_GU[d].indexOf(sgg) >= 0) return d; return "강북지역단"; }
  if (sido === "경기") { if (sgg.indexOf("성남") === 0) return "성남지역단"; if (_HMC_GG_NORTH.some((g) => sgg.indexOf(g) === 0)) return "북부지역단"; return "경기지역단"; }
  const map = (typeof LR_DAN !== "undefined" && LR_DAN[sido]) || null;
  return map ? map.dans[0] : "광역(전국)";
}

/* ── 프로 ~700명 생성 — 실사 지점 272개(LR_BRANCHES) 위에 배속 ── */
function hmProsGen() {
  if (_HMC.pros) return _HMC.pros;
  const out = [];
  const seq = {};   // 지역단별 일련(100부터 — 기존 HM_CODES 10명과 충돌 방지)
  const nm = (rng) => { const sex = rng() < 0.55 ? "여" : "남"; const g = sex === "남" ? _GIVN_M : _GIVN_F; return _pick(rng, _SURN) + _pick(rng, g); };
  /* 1) 기존 명부 10명 보존(코드·이름 그대로) — 대표 시군구·지점 부여 */
  const LEGACY_SGG = { "강남지역단": ["강남구", "서초구", "송파구"], "강북지역단": ["노원구", "마포구"], "강서지역단": ["양천구"], "경기지역단": ["수원", "용인"], "광역(전국)": [""] };
  HM_CODES.forEach((p, i) => {
    const pool = LEGACY_SGG[p.dan] || [""];
    const sgg = pool[i % pool.length];
    out.push(Object.assign({}, p, { sido: p.dan === "경기지역단" ? "경기" : p.dan === "광역(전국)" ? "" : "서울", sgg, branch: sgg ? sgg + " 거점" : "본사(광역)", branchAddr: "", coverage: sgg ? [sgg] : [], legacy: true, hyundai: true }));
  });
  /* 2) 실사 지점 272 × 인구 가중 배치(2단계 P3 · 형 승인 2026-08-30)
     — 수도권은 많이, 도서·저밀도는 적게: 시도별 코호트 인구 가중(_SIDO — pilotCohort와 동일 원천)에
       비례해 지점당 인원(1~5명)을 결정론 배분. 목표: 시도별 프로당 담당 편차 축소(±20%). */
  const BR = (typeof LR_BRANCHES !== "undefined") ? LR_BRANCHES : {};
  const sggHasPro = {};
  const _sidoW = {}; let _wSum = 0;
  try { (_SIDO || []).forEach(([s2, w]) => { _sidoW[s2] = w; _wSum += w; }); } catch (e) {}
  const PRO_TARGET = 686;                                    // 비(非)기존 명부 목표(기존 10명 별도 — 총 ~696)
  Object.keys(BR).forEach((sido) => {
    BR[sido].forEach(([bname, addr], bi) => {
      const rng = _hmcRng("pro|" + sido + "|" + bname + "|" + bi);
      const sgg = _hmcSggOfAddr(sido, addr);
      const dan = _hmcDanOf(sido, sgg);
      /* 지점당 인원 = 시도 인구 몫 ÷ 시도 지점 수 → 1~5명(소수부는 지점 시드로 확률 반올림) */
      let n = 2 + (rng() < 0.5 ? 0 : 1);                     // 가중 원천 부재 시 기존 규칙 유지
      if (_wSum && _sidoW[sido] && BR[sido].length) {
        const ideal = PRO_TARGET * (_sidoW[sido] / _wSum) / BR[sido].length;
        n = Math.floor(ideal) + (rng() < (ideal - Math.floor(ideal)) ? 1 : 0);
        n = Math.max(1, Math.min(5, n));
      }
      for (let k = 0; k < n; k++) {
        const ab = HMC_DAN_ABBR[dan] || "WD";
        seq[ab] = (seq[ab] || 99) + 1;
        const g = rng();
        out.push({
          code: `HM-${ab}-26-${String(seq[ab]).padStart(3, "0")}`,
          name: nm(rng) + "", branch: bname + "지점", branchAddr: sido + " " + addr,
          sido, sgg, dan, coverage: [sgg],
          grade: g < 0.30 ? "HM1" : g < 0.70 ? "HM2" : g < 0.95 ? "HM3" : "HM4",
          gradeKo: g < 0.30 ? "안내" : g < 0.70 ? "상담" : g < 0.95 ? "설계·가족" : "지역리드",
          lic: rng() < 0.85, status: rng() < 0.92 ? "활성" : (rng() < 0.62 ? "교육중" : "정지"),
          since: "2026-0" + (1 + Math.floor(rng() * 7)),
          hyundai: true,   // 현대해상 소속 설계사 → 하이핀 프로 위촉(형 확정 ②)
        });
        sggHasPro[sido + "|" + sgg] = true;
      }
    });
  });
  /* 3) 지점 없는 시군구 → 같은 시도 프로가 겸임 관할(coverage 추가, gap 표기) — 커버 공백 0 */
  if (typeof DISTRICTS !== "undefined") Object.keys(DISTRICTS).forEach((sido) => {
    DISTRICTS[sido].forEach((sgg) => {
      if (sggHasPro[sido + "|" + sgg]) return;
      const pool = out.filter((p) => p.sido === sido && p.status === "활성" && !p.legacy);
      const base = pool.length ? pool : out.filter((p) => p.dan === "광역(전국)");
      const rng = _hmcRng("gap|" + sido + "|" + sgg);
      const take = Math.max(1, Math.min(2, Math.floor(base.length / 8)));
      for (let k = 0; k < take; k++) {
        const p = base[Math.floor(rng() * base.length)];
        if (p.coverage.indexOf(sgg) < 0) p.coverage.push(sgg);
        p.gap = true;
      }
    });
  });
  /* 4) 사번 부여(2단계 P3 · 형 승인) — 8H0001부터 전원(기존 명부 포함), 생성 순서 결정론 */
  out.forEach((p, i) => { p.sabun = "8H" + String(i + 1).padStart(4, "0"); });
  _HMC.pros = out;
  return out;
}
function hmProsAll() { return hmProsGen(); }
function hmProsBySgg(sido, sgg) {
  const act = hmProsGen().filter((p) => p.status === "활성");
  const main = act.filter((p) => p.sido === sido && p.sgg === sgg);
  if (main.length) return { pool: main, gap: false };
  const cov = act.filter((p) => p.sido === sido && p.coverage.indexOf(sgg) >= 0);
  if (cov.length) return { pool: cov, gap: true };
  const any = act.filter((p) => p.sido === sido);
  return { pool: any.length ? any : act.filter((p) => p.dan === "광역(전국)"), gap: true };
}

/* ── 회원 시군구 — 지점 밀도 가중(형 확정 ③) · 별도 시드(기존 코호트 불변) ── */
function _hmcSggWeights(sido) {
  if (!_HMC.sggW) _HMC.sggW = {};
  if (_HMC.sggW[sido]) return _HMC.sggW[sido];
  const list = (typeof DISTRICTS !== "undefined" && DISTRICTS[sido]) || [];
  const cnt = {};
  ((typeof LR_BRANCHES !== "undefined" && LR_BRANCHES[sido]) || []).forEach(([b, addr]) => { const g = _hmcSggOfAddr(sido, addr); cnt[g] = (cnt[g] || 0) + 1; });
  const w = list.map((sgg) => [sgg, 1 + (cnt[sgg] || 0) * 2]);   // 라플라스 1 + 지점수×2 가중
  _HMC.sggW[sido] = w;
  return w;
}
function cohortRegion(i) {
  const m = (typeof cohortMemberAt === "function") ? cohortMemberAt(i) : null;
  if (!m) return null;
  const rng = _hmcRng("sgg|" + i);
  const sgg = _wpick(rng, _hmcSggWeights(m.sido));
  return { sido: m.sido, sgg };
}
/* 회원 → 프로 매칭(결정론) + 배정 근거 — 지역 일치 제1원칙 */
function cohortProOf(i) {
  const r = cohortRegion(i);
  if (!r) return null;
  const { pool, gap } = hmProsBySgg(r.sido, r.sgg);
  if (!pool.length) return null;
  const p = pool[_hmHash("asg|" + i) % pool.length];
  const why = gap ? `${r.sido} ${r.sgg} 거주 → ${p.branch} ${p.name} 프로 겸임(인접 관할 · 비대면 우선)` : `${r.sido} ${r.sgg} 거주 → ${p.branch} ${p.name} 프로(주 관할)`;
  return { pro: p, gap, why, region: r };
}
/* 프로 → 담당 회원 인덱스(시군구 인덱스 캐시 — 10만 1회 순회 후 메모리 보관) */
function _hmcSggIndex() {
  if (_HMC.sggIdx) return _HMC.sggIdx;
  const idx = {};
  const c = (typeof pilotCohort === "function") ? pilotCohort() : [];
  for (let i = 1; i <= c.length; i++) { const r = cohortRegion(i); if (!r) continue; const k = r.sido + "|" + r.sgg; (idx[k] || (idx[k] = [])).push(i); }
  _HMC.sggIdx = idx;
  return idx;
}
function hmMembersOfPro(code) {
  const p = hmProsGen().find((x) => x.code === code);
  if (!p) return [];
  const idx = _hmcSggIndex();
  const sggs = [p.sgg].concat(p.coverage.filter((s) => s !== p.sgg));
  const out = [];
  sggs.forEach((sgg) => {
    const arr = idx[p.sido + "|" + sgg] || [];
    arr.forEach((i) => { const a = cohortProOf(i); if (a && a.pro.code === code) out.push(i); });
  });
  return out;
}

/* ── 단계 퍼널 — finModel 정합(형 확정 ①) · 결정론 부여 + 가구 가중(L6+ 정합) ── */
const HM_FUNNEL = [
  /* [단계, 비율, finModel 근거] — 합 1.000 */
  ["D1", 0.550, "1 − checkupRate(0.45): 아직 검진 데이터가 없는 회원"],
  ["D2", 0.070, "checkupRate(0.45) × (1 − 리포트 발급 0.85)"],
  ["D3", 0.230, "checkupRate × 0.85 × (1 − productBuyerRate 0.38)"],
  ["D4", 0.060, "행동 결합 진입 — checkupRate × 0.85 × productBuyerRate 중 잔류 40%"],
  ["L5", 0.045, "× activeRate(0.45) 주기 지속"],
  ["L6", 0.029, "× serviceRate(0.30) 가구·돌봄 관여"],
  ["L7", 0.012, "× aiAgentRate 상한(0.08) — 데이터 주권·프리미엄 행사"],
  ["L8", 0.004, "다년(2개년+) 추이 도달 — 재산정 가능"],
];
function cohortStageOf(i) {
  const m = (typeof cohortMemberAt === "function") ? cohortMemberAt(i) : null;
  if (!m) return null;
  const r = _hmcRng("stage|" + i)();
  /* 가구 정보는 카드 표기·L6 문안에 사용(분포 가중은 상단 왜곡을 만들어 제거 — 퍼널 정확도 우선) */
  let famN = 1; try { famN = (typeof pilotFamily === "function") ? (pilotFamily(m.hid) || []).length : 1; } catch (e) {}
  let acc = 0, cur = "D1";
  for (const [k, p] of HM_FUNNEL) { acc += p; if (r < acc) { cur = k; break; } cur = k; }
  const order = HM_FUNNEL.map((x) => x[0]);
  const reached = order.slice(0, order.indexOf(cur) + 1);
  /* 정체 — D3 22%(최대 정체 구간)·기타 15%, 일수 30~90 시드 */
  const r2 = _hmcRng("stall|" + i)();
  const stallP = cur === "D3" ? 0.22 : 0.15;
  const stalled = cur !== "D1" && r2 < stallP;
  const stalledDays = stalled ? 30 + Math.floor(_hmcRng("sd|" + i)() * 60) : Math.floor(_hmcRng("sd|" + i)() * 25);
  /* 락 — D1 중 60%는 검진대비보험 가입(검진 전 접촉 금지) */
  const enrolled = cur === "D1" && _hmHash("enr|" + i) % 100 < 60;
  return { cur, reached, stalled, stalledDays, enrolled, famN };
}
function cohortStatusOf(i, st) {
  st = st || cohortStageOf(i);
  if (!st) return null;
  if (st.enrolled) return Object.assign({ k: "HELD" }, HM_MSTATUS.HELD, { why: "검진결과 수령 전 — 접촉 금지(하이가 자동 해제)" });
  if (cohortSignalOf(i)) return Object.assign({ k: "NEED" }, HM_MSTATUS.NEED, { why: "하이 신호 도래 — 접촉 시점" });
  if (st.stalled) return Object.assign({ k: "STALL" }, HM_MSTATUS.STALL, { why: `${st.cur} 단계에서 ${st.stalledDays}일 정체` });
  const r = _hmHash("ms|" + i) % 100;
  if (r < 55) return Object.assign({ k: "PROG" }, HM_MSTATUS.PROG, { why: "관리 진행 중" });
  if (r < 85) return Object.assign({ k: "DONE" }, HM_MSTATUS.DONE, { why: "최근 터치 완료" });
  return Object.assign({ k: "CLOSED" }, HM_MSTATUS.CLOSED, { why: "이번 사이클 종결" });
}
/* ① 신호 — D2~D4의 6%(그중 1/6은 직접 요청) */
const _HMC_SIG = [["L-CKUP", "검진 이벤트", 30], ["L-GAP", "보장공백", 28], ["L-CLAIM", "청구 직후", 12], ["L-RERATE", "재산정 완료", 10], ["L-FAM", "가족 단위 상담", 20]];
function cohortSignalOf(i) {
  const st = cohortStageOf(i);
  if (!st || ["D2", "D3", "D4"].indexOf(st.cur) < 0) return null;
  const h = _hmHash("sig|" + i) % 100;
  if (h >= 10) return null;
  if (h === 0) return { type: "L-ASK", typeKo: "직접 요청", direct: true, tier: "T1", sla: 4 };
  const rng = _hmcRng("sigt|" + i);
  const t = _wpick(rng, _HMC_SIG.map((x) => [[x[0], x[1]], x[2]]));
  const tier = rng() < 0.4 ? "T2" : "T3";
  return { type: t[0], typeKo: t[1], direct: false, tier, sla: tier === "T2" ? 8 : 48 };
}
/* 건강현황 브리프 — 원본 수치 없이 등급·플래그·밴드만(risk 1~5 → 라벨) */
const _HMC_GRADE = ["", "정상", "경계", "이상", "고위험", "긴급"];
function cohortHealthBrief(i) {
  const m = cohortMemberAt(i);
  if (!m) return null;
  const grade = _HMC_GRADE[Math.max(1, Math.min(5, m.risk || 2))];
  const band = (m.cancer || (m.risk || 0) >= 4) ? "상" : (m.risk || 0) >= 3 ? "중" : "하";
  return { grade, sevN: (m.diseases || []).length, band, year: "2026년", seen: _hmHash("seen|" + i) % 100 < 70 };
}
/* ⑨ 카드 조립 — 체험 카드와 동일 2축 + 하이 한 줄(규칙 조립) */
function cohortCardOf(i) {
  const m = cohortMemberAt(i);
  if (!m) return null;
  const stage = cohortStageOf(i);
  const status = cohortStatusOf(i, stage);
  const hb = cohortHealthBrief(i);
  const asg = cohortProOf(i);
  const nextStage = HM_STAGES[HM_STAGES.findIndex((s) => s.k === stage.cur) + 1];
  let hi;
  if (status.k === "HELD") hi = "검진결과 수령 전이에요. 지금은 프로필 사전 학습만 — 결과가 오면 제가 바로 알려드릴게요.";
  else if (status.k === "NEED") hi = "하이 신호가 도래했어요 — 오늘 연결하는 게 좋겠어요.";
  else if (stage.stalled) hi = `${stage.stalledDays}일째 ${stage.cur}에 멈춰 있어요.` + (nextStage ? ` ${nextStage.k}(${nextStage.name})로 가려면 ${nextStage.desc.split("—")[0].trim()}이 필요해요.` : "");
  else hi = "예정 터치까지는 지켜봐도 좋아요 — 단계 근거를 보고 다음 행동을 골라 주세요.";
  return { i, cohort: true, m, stage: { cur: stage.cur, reached: stage.reached, stalled: stage.stalled, stalledDays: stage.stalledDays }, status, hb, hi,
    mask: _hmMask(m.name), band: (Math.floor((m.age || 45) / 10) * 10) + "대", sex: m.sex, region: asg ? asg.region : null, why: asg ? asg.why : "", famN: stage.famN };
}
/* 전국 분포 — 루프 없이 수식(HM_FUNNEL × N) */
function hmNationStats() {
  const N = (typeof PILOT_N !== "undefined") ? PILOT_N : 100000;
  return HM_FUNNEL.map(([k, p, why]) => ({ k, n: Math.round(N * p), pct: Math.round(p * 1000) / 10, why }));
}
/* 관측층 접촉 — 세션 메모리만(localStorage 오염 금지 · 새로고침 시 초기화) */
function hmcTouch(code, i, label) {
  const st = cohortStageOf(i);
  if (st && st.enrolled) { hmLockViolation(code, { email: "cohort-" + i }); return { ok: false, reason: "접촉 금지 상태예요 — 검진결과 수령 후 하이가 자동으로 열어 드려요." }; }
  (_HMC.session[code] || (_HMC.session[code] = [])).push({ at: Date.now(), i, label });
  return { ok: true, session: true };
}
function hmcTouches(code) { return _HMC.session[code] || []; }
/* 프로 1명 시점 요약(탭 배분) — 담당 회원 인덱스에서 파생 */
function hmcProView(code) {
  const ids = hmMembersOfPro(code);
  const v = { ids, n: ids.length, held: [], ready: [], signals: [], stall: [], byStage: {}, riskHi: [], family: [], shop: [] };
  HM_STAGES.forEach((s) => { v.byStage[s.k] = []; });
  ids.forEach((i) => {
    const st = cohortStageOf(i);
    v.byStage[st.cur].push(i);
    if (st.enrolled) v.held.push(i);
    else if (st.cur === "D2" && _hmHash("rdy|" + i) % 100 < 18) v.ready.push(i);
    if (cohortSignalOf(i)) v.signals.push(i);
    if (st.stalled) v.stall.push(i);
    const m = cohortMemberAt(i);
    if (m && (m.cancer || (m.risk || 0) >= 3) && ["D3", "D4", "L5"].indexOf(st.cur) >= 0) v.riskHi.push(i);
    if (["L6"].indexOf(st.cur) >= 0 || (st.famN >= 3 && ["D4", "L5"].indexOf(st.cur) >= 0)) v.family.push(i);
    if ((["D4", "L5"].indexOf(st.cur) >= 0 && _hmHash("shp|" + i) % 100 < 60) || (st.cur === "D3" && _hmHash("shp|" + i) % 100 < 12)) v.shop.push(i);
  });
  return v;
}

/* ── 프로 실적 데모(결정론) — 실적 = 단계 전진 기여(금액·수수료·순위 없음) ──
   담당 규모·단계 분포에서 파생 + 프로 시드(등급·경력)로 성과율 변주. 화면에 "시연 분포" 고지. */
const _HMC_CMT = [
  [5, "검진 결과를 어려운 말 없이 설명해 주셔서 좋았어요. 다음 검진도 부탁드려요."],
  [5, "보험 얘기를 먼저 꺼내지 않으시고 제 건강 얘기부터 들어주셔서 신뢰가 갔습니다."],
  [4, "만기 전에 미리 알려주셔서 놓치지 않고 재가입했어요."],
  [4, "부모님 돌봄 절차를 차근차근 알려주셨어요. 공단 판정은 기다리는 중이에요."],
  [4, "리포트 보는 법을 배우고 나니 제 검진표가 읽히기 시작했어요."],
  [3, "설명은 좋았는데 통화 시간이 조금 길었어요."],
  [5, "검진 전엔 연락이 없다가 결과 나온 날 바로 전화 주신 게 인상적이었어요."],
  [3, "안내는 정확했지만 다음 일정 안내가 조금 늦었어요."],
];
function hmcProStats(code) {
  const p = hmProsGen().find((x) => x.code === code);
  if (!p) return null;
  const v = hmcProView(code);
  const rng = _hmcRng("stat|" + code);
  /* 성과율 — 등급 서사(경험 많을수록 완료율↑) + 프로별 지터 */
  const base = { HM1: 0.72, HM2: 0.78, HM3: 0.85, HM4: 0.88 }[p.grade] || 0.78;
  const perf = Math.min(0.97, Math.max(0.6, base + (rng() - 0.5) * 0.12));
  /* 월별 단계 전진(최근 6개월) — 담당 규모 × 월 전진율(4~7%) × 성과율 */
  const now = new Date(2026, 7);   // 시연 기준월 고정(2026-08) — 재현 가능
  const adv6 = [];
  let advTotal = 0;
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k);
    const n = Math.round(v.n * (0.04 + rng() * 0.03) * perf * (0.7 + (5 - k) * 0.08));   // 위촉 초기→성장 곡선
    adv6.push({ ym: (d.getMonth() + 1) + "월", n });
    advTotal += n;
  }
  const stallFixed = Math.round(v.stall.length * perf * 0.6);
  const firstRate = Math.round(perf * 100);
  const expireRate = Math.min(100, Math.round((perf + 0.06) * 100));
  const slaRate = Math.min(100, Math.round((perf + 0.08) * 100));
  const touches = Math.round(advTotal * 2.4);
  /* 접촉 결과 분포 — LR_RESULT_CODES 의미 재사용 */
  const dist = [
    ["연결됨", Math.round(touches * 0.46)], ["상담확정", Math.round(touches * 0.18)],
    ["예약전환", Math.round(touches * 0.12)], ["부재(재시도)", Math.round(touches * 0.16)],
    ["거절", Math.round(touches * 0.08)],
  ];
  /* 회원 평가 — 평균★ + 코멘트(성과율과 톤 매칭·시드 선택) */
  const stars = Math.round((3.9 + perf * 1.0) * 10) / 10;
  const starsN = Math.max(3, Math.round(advTotal * 0.35));
  const cIdx = [];
  while (cIdx.length < 3) { const j = Math.floor(rng() * _HMC_CMT.length); if (cIdx.indexOf(j) < 0 && (perf > 0.8 ? _HMC_CMT[j][0] >= 4 : true)) cIdx.push(j); }
  const comments = cIdx.map((j) => ({ star: _HMC_CMT[j][0], text: _HMC_CMT[j][1] }));
  return { p, n: v.n, perf, adv6, advTotal, stallFixed, stallN: v.stall.length, firstRate, expireRate, slaRate, touches, dist, stars, starsN, comments };
}
/* HM4 지역리드 — 지역단 집계(개인 상세 불가 원칙: 합계·평균만) */
function hmcDanAgg(dan) {
  const pros = hmProsGen().filter((x) => x.dan === dan && x.status === "활성");
  let adv = 0, first = 0, n = 0;
  pros.slice(0, 40).forEach((x) => { const st = hmcProStats(x.code); if (st) { adv += st.advTotal; first += st.firstRate; n++; } });
  return { dan, pros: pros.length, advSum: adv, avgFirst: n ? Math.round(first / n) : 0, sampled: Math.min(40, pros.length) };
}
