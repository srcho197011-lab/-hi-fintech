/* ══════════════ 인계 카드 조립기(handoffCard.js) — 지시서 프롬프트 v1.3 §3 (P3 초판) ══════════════
   코호트 인덱스 → HandoffCard 완성체(대본 포함). 부품의 조립이지 발명이 아니다:
   판정 = checkupEngine(items·trend·생활플래그) → riskGrade → interventionMap → hmScriptBlocks 조립.
   ⚠️ 원칙:
     · 문장 즉석 생성 금지 — script는 approved 블록의 슬롯 치환만. 미승인 블록이 걸리면 카드 발행 불가.
     · 데이터 경계 — evidence·script에 원본 수치 미탑재(조립 후 숫자 검사 플래그 동봉).
     · 결정론 — 같은 인덱스는 언제나 같은 카드(코호트·검진·단계 전부 시드 기반).
     · E(응급)는 트리아지 소유 — 이 조립기는 다루지 않는다. */

const HANDOFF_SLOTS_SAFE = { 예약처: "가까운 제휴 검진센터", 다음약속: "다음 주" };   // 자유 텍스트 금지 — 고정 안전값

/* 대본 v2 스위치(2단계 P5) — 형이 신규 블록 전건(talk·seed·careplan·branch2·cost) 승인 시 true 전환.
   false인 동안 조립은 기존 v1 그대로(하네스·발행 불변) — 초안이 발행 경로에 스며들 수 없다. */
const HM_SCRIPT_V2 = true;   /* 2026-08-30 형 승인 — 대본 v2 정식 전환 */

function _hcMask(name) { return (String(name || "회")[0]) + "○○"; }
function _drOr(i, mod) { return ((Number(i) * 2654435761) >>> 0) % mod === 0; }   // 결정론 이지선다
function _hcFill(t, slots) { return String(t || "").replace(/\{([가-힣A-Za-z0-9]+)\}/g, (_, k) => (slots[k] != null ? slots[k] : "{" + k + "}")); }
function _hcBlock(id, slots, out) {
  const b = (typeof hmBlock === "function") ? hmBlock(id) : null;
  if (!b) { out.missing.push(id); return null; }
  if (!b.approved) { out.unapproved.push(id); }
  return { id: id, ko: b.ko, text: _hcFill(b.t, slots) };
}

function buildHandoffCard(i, opts) {
  const v2on = HM_SCRIPT_V2 || !!(opts && opts.v2);   /* 검수판 미리보기 — 규칙 이원화 없이 같은 조립기 */
  const out = { i: i, missing: [], unapproved: [] };
  const m = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(i) : null;
  if (!m) return null;
  /* stage는 cohortStageOf 원본을 직접 읽는다 — cohortCardOf의 stage 사본은 enrolled(락)를 누락(P5 실측) */
  const stage0 = (typeof cohortStageOf === "function") ? cohortStageOf(i) : null;
  const region = (typeof cohortRegion === "function") ? cohortRegion(i) : null;
  const proRes = (typeof cohortProOf === "function") ? cohortProOf(i) : null;
  const pro = proRes && proRes.pro;   /* cohortProOf는 {pro, gap, why, region} 래퍼를 반환 */
  const chk = (typeof genMemberCheckup === "function") ? genMemberCheckup(m) : null;
  if (!chk) return null;
  const lifeAll = (chk.nat && chk.nat.life) || [];
  /* L 판정 인자는 행동 위험 플래그(절주·금연)만 — "신체활동 필요"는 일반 리듬 신호라 등급 인자에서 제외(§2) */
  const flags = lifeAll.filter((f) => /절주|금연/.test(f));
  const g = (typeof riskGradeOf === "function") ? riskGradeOf(chk.items, chk.trend, flags) : { grade: "-", keys: [] };
  const stage = stage0;

  /* 주도 지표군 — sev2 우선, 없으면 sev1 첫 항목 */
  let leadKey = null, leadSev = 0;
  for (const k in chk.items) { const s = chk.items[k].sev || 0; if (s > leadSev) { leadSev = s; leadKey = k; } }
  const group = leadKey ? riskGroupOf(leadKey) : "organ";

  /* trigger — 우선순위: 정체 재개 > 등급 사유 > 추세·플래그 */
  const stalled = stage && stage.stalled && stage.stalledDays >= 14;
  const trigger = stalled ? ("정체 " + stage.stalledDays + "일 — 관리 재개")
    : g.grade === "H" || g.grade === "M" ? ("신규 검진 결과 수신 — " + (g.why || ""))
    : g.grade === "L" ? ("추세·생활 신호 — " + (g.why || "")) : "정기 리듬 점검";

  /* evidence — 등급·플래그·추세만(수치 없음) ≤3줄 */
  const ev = [];
  if (leadKey && leadSev) ev.push((typeof clinicalBandLabel === "function") ? clinicalBandLabel(leadKey, leadSev) : leadKey);
  const second = g.keys.find((k) => k !== leadKey);
  if (second && chk.items[second]) ev.push((typeof clinicalBandLabel === "function") ? clinicalBandLabel(second, chk.items[second].sev) : second);
  if (chk.trend === "worsen") ev.push("최근 3년 추세 악화");
  if (flags.length && ev.length < 3) ev.push("생활 플래그: " + flags.join("·"));
  const evidence = ev.slice(0, 3);

  /* actions — 매핑 + 특례(명문화 3종만) */
  let acts = (typeof interventionsFor === "function") ? interventionsFor(g.grade === "-" ? "L" : g.grade, group) : [];
  if (m.age >= 60 && group === "body") {
    acts = acts.map((a) => a.key === "move" ? Object.assign({}, a, { ko: a.ko + "(강도 하향)" }) : a);
    if (!acts.some((a) => a.key === "family")) acts.splice(1, 0, Object.assign({ key: "family" }, INTERVENTIONS.family));
  }
  if (group === "liver" && flags.some((f) => /절주/.test(f))) {
    acts.sort((a, b) => (a.key === "habit" ? -1 : b.key === "habit" ? 1 : 0));
  }
  acts = acts.slice(0, 3);

  /* script — 블록 조립(§3-S). 변형: 65세↑ 쉬운말 */
  const easy = m.age >= 65;
  const slots = {
    가명: _hcMask(m.name), 프로명: pro ? pro.name : "담당 프로",
    구간표현: evidence[0] || "확인이 필요한 구간", 개입명: acts[0] ? acts[0].ko : "확인",
    예약처: HANDOFF_SLOTS_SAFE.예약처, 다음약속: HANDOFF_SLOTS_SAFE.다음약속,
  };
  const gradeCo = g.grade === "H" ? "co-h" : g.grade === "M" ? "co-m" : "co-l";
  /* 정체 재개가 쉬운말보다 우선 — op-restart·cl-open(재큐 고지)은 시나리오의 핵심이라 변형에 밀리지 않는다 */
  const opening = stalled ? "op-restart" : (easy ? "op-first-easy" : "op-first");
  const script = {
    channel: "전화",     /* P3: 전 케이스 전화 1순위 — 알림·문자는 변형으로 동반 */
    variant: stalled && easy ? "정체 재개·쉬운말" : stalled ? "정체 재개" : easy ? "쉬운말" : "기본",
    opening: _hcBlock(opening, slots, out),
    core: [_hcBlock(easy ? (g.grade === "H" ? "co-h-easy" : "co-m-easy") : gradeCo, slots, out),
           !easy ? _hcBlock("co-" + group, slots, out) : null].filter(Boolean),
    ask: _hcBlock(easy && acts[0] && acts[0].key === "clinic" ? "ak-clinic-easy" : "ak-" + (acts[0] ? acts[0].key : "recheck"), slots, out),
    /* 화면 표기는 「회원 반응별 응대」(형 확정 2026-08-29) — 내부 필드명은 branches 유지 */
    branches: [
      _hcBlock("br-yes", slots, out), _hcBlock("br-hold2", slots, out),
      _hcBlock(easy ? "br-no-easy" : "br-no", slots, out),
      _hcBlock("br-q-serious", slots, out), _hcBlock("br-q-ins", slots, out),
    ].filter(Boolean),
    closing: _hcBlock(stalled ? "cl-open" : (easy ? "cl-done-easy" : "cl-done"), slots, out),
  };
  /* ── 대본 v2(P5 · HM_SCRIPT_V2 시) — 7파트: 생활 대화 2 · 씨앗 ≤1 · 케어 플랜(핵심1+보조2) · 응대 10 ── */
  if (v2on) {
    script.talk = [_hcBlock("tk-" + group, slots, out), _hcBlock(_drOr(i, 2) ? "tk-sleep" : "tk-fam", slots, out)].filter(Boolean);
    if (g.grade === "H" || g.grade === "M") script.seed = [_hcBlock("sd-" + group, slots, out)].filter(Boolean);
    else script.seed = [];
    const ckMap = { clinic: "ck-clinic", tele: "ck-clinic", recheck: "ck-recheck", diet: "ck-meal", supp: "ck-supp", move: "ck-care", habit: "ck-care", family: "ck-care" };
    script.careplan = acts.slice(0, 3).map((a) => _hcBlock(ckMap[a.key] || "ck-care", slots, out)).filter(Boolean)
      .filter((b2, ix, arr) => arr.findIndex((x) => x.id === b2.id) === ix);
    script.branches = script.branches.concat([
      _hcBlock("br2-treatcost", slots, out), _hcBlock("br2-fam", slots, out),
      _hcBlock("br2-oldins", slots, out), _hcBlock("br2-busy", slots, out), _hcBlock("br2-fear", slots, out),
    ].filter(Boolean));
    script.v2 = true;
  }
  /* ── D2 첫 연결 골든타임(F2 · 프롬프트 v1.1 §5 — 형 승인 2026-08-31) — D2 카드에만 fc 파트 삽입.
        재접촉·타 단계에 3종 반복 금지(스팸화 방지) · 키트 슬롯은 MA_MAP(검진 결과 기반)만 ── */
  const d2first = v2on && stage && stage.cur === "D2" && !stalled;
  if (d2first) {
    const ma = (typeof MA_MAP !== "undefined" && MA_MAP[group]) ? MA_MAP[group] : (typeof MA_MAP !== "undefined" ? MA_MAP.organ : null);
    const kitSlots = Object.assign({}, slots, ma ? {
      지표군: (HM_RISK_GROUPS[group] || {}).ko || group,
      영양소: (ma.supp || []).slice(0, 2).join("·") || "기본 영양",
      기기: ma.device || "건강 기록 앱", 진료과: ma.dept || "가까운 병원",
    } : { 지표군: group, 영양소: "기본 영양", 기기: "건강 기록 앱", 진료과: "가까운 병원" });
    /* fc 전용 치환 — 슬롯 뒤 조사를 값의 받침에 맞춰 교정(조사 선택만·새 문장 아님. 기존 대본 표기는 불변) */
    const _fcJ = { 이에요: ["이에요", "예요"], 예요: ["이에요", "예요"], 은: ["은", "는"], 는: ["은", "는"], 이: ["이", "가"], 가: ["이", "가"], 을: ["을", "를"], 를: ["을", "를"], 와: ["과", "와"], 과: ["과", "와"] };
    const fcFill = (t) => String(t).replace(/\{([가-힣A-Za-z0-9]+)\}(이에요|예요|은|는|이|가|을|를|와|과)?/g, (m, k, j) => {
      if (kitSlots[k] == null) return m;
      const v = String(kitSlots[k]);
      if (!j) return v;
      const s3 = v.replace(/[^가-힣]+$/, ""); const cc = s3.charCodeAt(s3.length - 1);
      if (!(cc >= 0xAC00 && cc <= 0xD7A3)) return v + j;
      return v + _fcJ[j][(cc - 0xAC00) % 28 > 0 ? 0 : 1];
    });
    const fcBlock = (id) => { const b2 = _hcBlock(id, kitSlots, out); return b2 ? Object.assign({}, b2, { text: fcFill((hmBlock(id) || {}).t || b2.text) }) : null; };
    /* 골든타임 오프닝은 결과 도착 결합(op-unlock) — 프롬프트 v1.1 §5 순서(op-unlock → fc-open …) */
    if (!easy) script.opening = _hcBlock("op-unlock", slots, out) || script.opening;
    script.firstconnect = ["fc-open", "fc-3svc", "fc-ins", "fc-ins-how", "fc-report", "fc-kit", "fc-kit-use", "fc-insight"]
      .map(fcBlock).filter(Boolean);
    script.fcTail = [fcBlock("fc-support"), fcBlock("fc-lifetime")].filter(Boolean);
    script.branches = script.branches.concat([fcBlock("fc-q-free"), fcBlock("fc-q-sell")].filter(Boolean));
  }
  /* ── 만기 국면 대본(R4 결선 · 형 승인 2026-09-03) — T4~T7 카드에만. 값은 covAnalysis 보장맵 실산출만 ──
        보장맵이 없으면(N1 미동의) 보장맵 화법(mt-t5-map)은 조립되지 않는다 — 동의가 곧 대본의 문 */
  if (v2on) {
    let cyc = null; try { cyc = (typeof cycleOf === "function") ? cycleOf(i) : null; } catch (e) {}
    const inMat = cyc && ["T4", "T5", "T6"].indexOf(cyc.t) >= 0;
    const inKeep = cyc && cyc.t === "T7" && cyc.secondGolden;
    if (inMat || inKeep) {
      let cov = null; try { cov = (typeof covAnalysisOf === "function") ? covAnalysisOf(i) : null; } catch (e) {}
      const map = cov && cov.map ? cov.map : null;
      const mSlots = Object.assign({}, slots, {
        잔여일: cyc.s14 != null ? String(cyc.s14) : "곧",
        공백영역: map && map.gaps.length ? map.gaps.map((g) => g.ko).slice(0, 2).join("·") : "비어 있는 부분",
        중복영역: map && map.overlaps.length ? map.overlaps[0].ko.split("(")[0].trim() : "겹치는 부분",
        절감액: map && map.annualSaveTotal ? Math.round(map.annualSaveTotal / 10000).toLocaleString() + "만원" : "-",
      });
      const ids = [];
      if (cyc.t === "T4") ids.push("mt-t4-notice");
      else if (cyc.t === "T5") { if (map && (map.gaps.length || map.overlaps.length)) ids.push("mt-t5-map"); ids.push("mt-t5-ask"); }
      else if (cyc.t === "T6") ids.push("mt-t6-notice");
      else ids.push("mt-t7-keep");
      script.maturity = ids.map((id) => _hcBlock(id, mSlots, out)).filter(Boolean);
      script.branches = script.branches.concat([_hcBlock("mt-q-why", mSlots, out), _hcBlock("mt-q-cost", mSlots, out)].filter(Boolean));
    }
    /* 회원 자발 건강 대화(§0-V5) — 회원이 먼저 꺼냈을 때만 쓰는 갈래. 본대본·응대 규격에 포함되지 않는 선택 갈래 */
    script.voluntary = ["vd-listen", "vd-confirm", "vd-offer", "vd-consent", "vd-boundary", "vd-record"]
      .map((id) => _hcBlock(id, slots, out)).filter(Boolean);
  }
  /* 채널 변형 — 규칙 적용(창작 아님): 알림=core[0]+ask 축약 · 문자=고정 형식(수치·등급 미포함) */
  script.notif = (script.core[0] ? script.core[0].text + " " : "") + (script.ask ? script.ask.text.split(".")[0] + "." : "");
  script.sms = "[하이핀] " + slots.가명 + "님, 검진 관련 안내드릴 내용이 있어요. 확인: {링크}";

  /* 데이터 경계 검사 — evidence·대본에 숫자(수치) 유입 여부 */
  const joined = evidence.join(" ") + " " + [script.opening, ...script.core, script.ask, ...script.branches, script.closing,
    ...(script.firstconnect || []), ...(script.fcTail || []), ...(script.maturity || [])]
    .filter(Boolean).map((b) => b.text).join(" ");
  const numLeak = /\d{2,}/.test(joined.replace(/2년|3년|1회|2분|150분|1,000만원|코엔자임Q10|\d+일\s*뒤|연\s*[\d,]+만원|D-\d+/g, ""));   // 관용 표현 예외 후 2자리 이상 숫자 검출(1,000만원=보장 사실 고지·§0-C 동반 / Q10=성분명·수치 아님)
  const slotLeak = /\{[가-힣A-Za-z]+\}/.test(joined);                            // 미치환 슬롯 잔존({링크}는 sms 전용 — joined 밖)

  const meta = (typeof RISK_GRADE_META !== "undefined") ? RISK_GRADE_META[g.grade] : null;
  const preCard = { script: script };   /* 가드 스캔용 최소 형태(§S-5 ⑨⑩ — 사전은 hmScriptGuard 단일 소스) */
  const scan = (typeof hmScriptScan === "function") ? hmScriptScan(preCard) : { ok: true, forbidden: [], spec: { ok: true, readSec: 0, sentences: 0 } };
  script.readSec = scan.spec ? scan.spec.readSec : 0;
  return {
    member: { mask: _hcMask(m.name), ageBand: Math.floor(m.age / 10) * 10 + "대", sex: m.sex, region: region ? region.sgg : "",
      stage: stage ? stage.cur : "D1", stalledDays: stage ? stage.stalledDays : 0, pro: pro ? pro.name + " 프로" : "", cohortIndex: i, callbackToken: "cb-" + i },
    grade: g.grade, gradeWhy: g.why, group: group, groupKo: (HM_RISK_GROUPS[group] || {}).ko || group,
    trigger: trigger, evidence: evidence,
    actions: acts.map((a, ix) => ({ order: ix + 1, key: a.key, ko: a.ko, nav: a.nav, tab: a.tab || null, ev: a.ev, evNote: a.evNote })),
    script: script,
    timing: { sla: meta ? meta.slaKo : "-", slaTier: meta ? meta.tier : "-",   /* 표기는 사람 말, 코드는 별도 필드 */
      lock: !!(stage && stage.enrolled),   /* 검진대비보험 가입·결과 수령 전 = 접촉 금지(하이가 자동 해제) — 로스터가 제외 */
      cooldown: "통과(시연)", requeue: "미완결 시 D+7 재큐" },
    compliance: { medical: scan.forbidden.filter((h) => h.key === "diagnosis" || h.key === "verdict" || h.key === "fear").length === 0,
      solicitation: scan.forbidden.filter((h) => h.key === "solicit" || h.key === "premium" || h.key === "reask").length === 0,
      dataBoundary: !numLeak && scan.forbidden.filter((h) => h.key === "cost").length === 0,
      slotsFilled: !slotLeak, specOk: scan.spec ? scan.spec.ok : true, specWhy: (scan.spec && scan.spec.why) || [], forbiddenHits: scan.forbidden,
      unapprovedBlocks: out.unapproved.length, missingBlocks: out.missing.length,
      publishable: out.missing.length === 0 && out.unapproved.length === 0 && !numLeak && !slotLeak && scan.ok },
    label: "[예시·시연 데이터]",
  };
}

/* 테스트·러너 훅 — 관리자 전용(§7 훅 규약) */
try {
  if (typeof window !== "undefined") {
    window.__hifinCardV2 = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; return buildHandoffCard(Number(i), { v2: true }); }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
    window.__hifinCard = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; return buildHandoffCard(Number(i)); }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
    /* 구간 스캔(러너·P5 배치용) — 카드 요약행만 반환(전체 카드 대비 1/20 크기) */
    window.__hifinCardScan = function (from, to) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const rows = [];
        for (let j = Number(from); j < Number(to); j++) {
          try {
            const m = cohortLoginProfile(j); if (!m) continue;
            const chk = genMemberCheckup(m);
            const c = buildHandoffCard(j); if (!c) continue;
            rows.push({ i: j, grade: c.grade, group: c.group, age: c.member.ageBand, sex: c.member.sex,
              sido: m.sido || "", sgg: c.member.region, lock: c.timing.lock,
              stall: c.member.stalledDays, flags: (chk.nat && chk.nat.life) || [], pub: c.compliance.publishable });
          } catch (e) {}
        }
        return rows;
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
