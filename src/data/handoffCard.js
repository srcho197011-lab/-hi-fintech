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

/* ══ 단계 축(형 지시 2026-10-05) ══
   「D2 단계에서는 무료 3종 안내가 나가야 하는데, 그 단계에 맞는 스크립트가 짜여 있는지 다시 확인하고
    단계에 맞게 수정해 달라」 — 이전 조립기는 등급·지표군·나이·정체·개입·사이클만 보고 **단계는 D2 하나만**
   봤다. 그래서 D1·D3·D4·L5~L8 대본이 서로 구분되지 않았고(실측 25블록 211초 동일), 형 검수를 통과한
   lj-*(L5~L8)·tc-*(치료비) 블록이 한 번도 조립되지 않았다. 이 표가 그 단일 선택축이다.
     open/easyOpen   첫 마디(단계마다 다르다) — 단, 정체 14일+는 op-restart가 그대로 이긴다(기존 규약).
     alert/easyAlert 응급 선행 안내 — 상담보다 위·맨 앞(a4-triage-safety).
     prep/easyPrep   통화가 아닌 사전 준비(D1 접촉 금지) — 화면이 통화 대본을 접고 이것을 먼저 띄운다.
     task/easyTask   그 단계의 과업(HM_STAGE_GUIDE.doKo를 대본으로).
     close/easyClose 다음 약속(L 구간은 약속형 cl-promise).
   ⚠️ easy* 칸이 왜 필요한가(형 지시 2026-10-05 수선) — 종전에는 「쉬운말이면 cl-done-easy」가
      plan.close보다 먼저 판정돼, 표에 close를 적어 둔 L5~L8의 65세↑ 회원 전건이 cl-promise에
      도달하지 못했다(L7·L8은 예약 행위가 없는 단계인데 「예약되면 문자 가요」로 끝났다).
      같은 구멍이 과업·응급·사전 준비에도 있었다 — 쉬운말 카드라고 표기한 채 60자 문장을 섞어 읽었다.
      그래서 **단계 표가 변형까지 함께 고르는** 단일 선택축이 된다(변형이 표를 덮지 않는다).
   ⚠️ 골든셋 — fixtures/handoff_cards_sample_v1.json은 이 변경과 함께 단계 케이스(D2·정체 D2·L6·L8)를
      새로 넣고, 하네스 flat()이 prep·alert·stage·firstconnect·fcExtra·fcTail까지 비교한다. */
const HM_STAGE_PLAN = {
  D1: { prep: ["pr-d1-hold", "pr-d1-learn", "pr-d1-unlock"], easyPrep: ["pr-d1-hold-easy", "pr-d1-learn-easy", "pr-d1-unlock-easy"] },
  D2: { open: "op-unlock", easyOpen: "op-unlock-easy" },
  D3: { open: "op-report", easyOpen: "op-report-easy", task: ["sj-d3-report", "tc-brief"], easyTask: ["sj-d3-report-easy", "tc-brief-easy"] },
  D4: { open: "op-life", easyOpen: "op-life-easy", task: ["sj-d4-life", "tc-gapfact"], easyTask: ["sj-d4-life-easy", "tc-gapfact-easy"] },
  L5: { open: "op-rhythm", easyOpen: "op-rhythm-easy", task: ["lj-l5-rhythm", "lj-l5-recheck"], easyTask: ["lj-l5-rhythm-easy", "lj-l5-recheck-easy"], close: "cl-promise", easyClose: "cl-promise-easy" },
  L6: { open: "op-family", easyOpen: "op-family-easy", alert: ["em-care-first"], easyAlert: ["em-care-first-easy"], task: ["lj-l6-family", "sj-l6-care"], easyTask: ["lj-l6-family-easy", "sj-l6-care-easy"], close: "cl-promise", easyClose: "cl-promise-easy" },
  L7: { open: "op-rights", easyOpen: "op-rights-easy", task: ["lj-l7-rights", "sj-l7-reward"], easyTask: ["lj-l7-rights-easy", "sj-l7-reward-easy"], close: "cl-promise", easyClose: "cl-promise-easy" },
  L8: { open: "op-good", easyOpen: "op-good-easy", task: ["lj-l8-rerate", "lj-l8-replan"], easyTask: ["lj-l8-rerate-easy", "lj-l8-replan-easy"], close: "cl-promise", easyClose: "cl-promise-easy" },
};

/* 무료 3종 문안 슬롯 — 단일 원천은 src/data/free3Def.js뿐이다(프롬프트 v1.1 §9).
   형 지시 2026-10-05(절단 폐기): 종전에는 원천의 " · " 구획을 잘라 슬롯에 넣었다. 그 방식은
     ① 명사구를 이어 붙여 비문을 만들고(「증서는 데이터 금고 발급돼요」)
     ② 원천에 구획이 하나 늘거나 용어 안에 공백이 들어가면 슬롯이 밀려,
        폴백 문자열로 조용히 떨어지면서 **기타암 제외 고지만 정확히 사라지는** 경로를 만든다.
   그래서 대본이 쓰는 문장은 FREE3_DEF.say(구어체 완성 문장)에서 그대로 받는다. 폴백은 없다 —
   say 키가 없으면 out.missing에 올려 그 카드를 **발행 불가**로 떨어뜨린다(고지 약화 금지). */
function _hcFree3Slots(out) {
  const D = (typeof FREE3_DEF !== "undefined") ? FREE3_DEF : null;
  const push = (why) => { if (out && out.missing) out.missing.push(why); };
  if (!D || !D.items || D.items.length < 3) { push("free3Def:items"); return {}; }
  const it = D.items, say = D.say || {};
  const need = (typeof FREE3_SAY_KEYS !== "undefined") ? FREE3_SAY_KEYS : [];
  let ok = true;
  for (const k of need) if (!say[k]) { push("free3Def.say." + k); ok = false; }
  /* 구획 규약 단언 — note를 더 이상 자르지는 않지만, 원천이 규약을 벗어나면 다른 소비자(free3Long·
     하이프로 role:free3)가 먼저 깨진다. 여기서 먼저 울리게 해 둔다(§표기 규약 ①). */
  const seg = (s) => String(s || "").split(/\s+·\s+/).filter(Boolean).length;
  if (seg(it[0].note) !== 3) { push("free3Def.items[0].note 구획 3개 아님(" + seg(it[0].note) + ")"); ok = false; }
  if (!ok) return {};
  return {
    삼종명: D.name,
    보험명: it[0].ko,
    보험가입: say.insApply, 보험진단금: say.insCover, 보험수술비: say.insSurg,
    보험적용: say.insForm, 보험증서: say.insCert, 보험고지: say.insNotice,
    리포트명: it[1].ko, 리포트요약: say.reportWhat,
    키트명: it[2].ko,
  };
}

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
  /* 단계는 **카드 상단의 사실 주장**까지 정한다(형 지시 2026-10-05 수선).
     종전에는 단계축이 대본 파트만 더했고 trigger·evidence·앱알림·문자는 단계를 보지 않은 채
     genMemberCheckup에서 결과를 끌어왔다. 그래서 D1 카드가 한 장 안에서 스스로를 뒤집었다 —
     대본은 「검진 결과가 들어오기 전이라 접촉 금지 구간」인데 trigger는 「신규 검진 결과 수신 —
     위험 구간 3항목」, 문자는 「검진 관련 안내드릴 내용이 있어요. 확인: {링크}」였다.
     프로는 카드 상단만 보고 전화를 걸 수 있다 — 그래서 결과 기반 필드를 D1에서 만들지 않는다. */
  const stKey = stage && stage.cur ? stage.cur : "D1";
  const preResult = stKey === "D1";   /* 결과 수령 전 구간 — 결과를 사실로 말하지 않는다 */
  /* ══ 등급을 매기지 않는다(형 지시 2026-10-06) ══
     결과가 도착하기 전(D1)에는 위험 등급을 **없애거나 다른 값에 섞지 않고** 네 번째 상태
     「결과 대기(W)」로 카드에 명시한다. 그리고 그 등급에서 파생되는 모든 것 — 응답 시한·권장 개입
     3종·등급별 본론·씨앗·케어 플랜·주도 지표군, 그리고 그 위에 서 있던 통화 대본 전체 — 을
     **폴백 없이 조립하지 않는다**. D1 카드는 「등급이 없는 카드」가 아니라 「아직 등급을 매길 수
     없다고 적힌, 통화 대본이 아닌 사전 준비(prep) 카드」가 된다.
     ⚠️ 새 플래그를 만들지 않는다 — preResult 하나가 이미 같은 사실을 들고 있다(같은 사실을 두
        변수가 말하면 뒤에 한쪽만 고쳐져 새는 구조가 남는다). */
  const gc = preResult ? { grade: "W", why: "검진 결과 수령 전 — 등급 미산정", keys: [] } : g;

  /* 주도 지표군 — sev2 우선, 없으면 sev1 첫 항목.
     결과 수령 전에는 지표군도 단정하지 않는다 — 「등급은 결과 대기인데 지표군은 간 기능」이라는
     자기모순 페어가 memberContext 360뷰와 10만 지표군 분포로 흘러갔다(형 지시 2026-10-06) */
  let leadKey = null, leadSev = 0;
  for (const k in chk.items) { const s = chk.items[k].sev || 0; if (s > leadSev) { leadSev = s; leadKey = k; } }
  const group = preResult ? null : (leadKey ? riskGroupOf(leadKey) : "organ");

  /* 골든타임 창 실산출 — cycleOf 한 번만 부르고 trigger·timing이 같은 값을 읽는다.
     ⚠️ D2라는 사실만으로 「골든타임」이라고 쓰지 않는다(적대적 리뷰 실증 2026-10-06): cycleOf 판정상
        D2는 열린 창(T2·잔여>0) 42.8% · 창 종료(T2·잔여 0h) 16.7% · 창 밖(T3) 40.5%로 갈리고,
        종전에는 창 밖 T3 카드 140건까지 「첫 연결 골든타임」을 달았다 — 시연에서 「왜 골든타임인가」를
        물으면 cycleOf가 T3(코칭 구간)라고 답하는 카드가 셋 중 한 장이었다.
     ⚠️ cycleOf는 **날짜가 아니라 회원 시드**로 경과일을 파생한다(_cycleExamOffset) — 그래서 이 분기를
        trigger에 넣어도 골든셋 텍스트가 날마다 흔들리지 않는다(결정론 유지). */
  let gLeftH = null;
  try { if (stKey === "D2" && typeof cycleOf === "function") { const _cy = cycleOf(i, stage); if (_cy && _cy.t === "T2" && _cy.goldenLeftH > 0) gLeftH = _cy.goldenLeftH; } } catch (e) {}
  /* trigger — 우선순위: 결과 대기(D1) > 정체 재개 > D2 첫 연결 > 등급 사유 > 추세·플래그.
     D1이 맨 앞인 이유: 접촉이 한 번도 없었던 구간이라 「정체 — 관리 재개」도 성립하지 않는다.
     D2가 등급 사유 **앞**인 이유(형 지시 2026-10-06): 등급 '-'인 D2 회원이 「정기 리듬 점검」을
     머리에 달고 무료 3종 골든타임 전문을 본문으로 읽어, 카드 머리글이 본문을 부정했다.
     ⚠️ H·M D2는 **등급 사유를 뒤에 병기**한다(적대적 리뷰 실증: i=158 H·「위험 구간 2항목」·시한
        48시간인데 머리글은 안내 과업만 말했다 — i≤6000에서 43건). 카드 머리글이 배지를 부정하지
        않게, 한 줄에 과업과 위험 사실을 함께 둔다. */
  const stalled = stage && stage.stalled && stage.stalledDays >= 14;
  const d2Lead = gLeftH != null ? "첫 연결 골든타임 — 무료 3종 전달" : "첫 연결 미완료 — 무료 3종 미전달";
  const trigger = preResult ? "배정 완료 — 결과 대기(접촉 금지)"
    : stalled ? ("정체 " + stage.stalledDays + "일 — 관리 재개")
    : stKey === "D2" ? (d2Lead + ((gc.grade === "H" || gc.grade === "M") && gc.why ? " · " + gc.why : ""))
    : gc.grade === "H" || gc.grade === "M" ? ("신규 검진 결과 수신 — " + (gc.why || ""))
    : gc.grade === "L" ? ("추세·생활 신호 — " + (gc.why || "")) : "정기 리듬 점검";

  /* evidence — 등급·플래그·추세만(수치 없음) ≤3줄. D1은 결과 근거가 존재하지 않는 구간이라
     「검진 예약 확인」 한 줄만 둔다(결과 항목을 근거로 적지 않는다) */
  const ev = [];
  if (preResult) ev.push("검진 예약 확인 · 결과 대기");
  else {
    if (leadKey && leadSev) ev.push((typeof clinicalBandLabel === "function") ? clinicalBandLabel(leadKey, leadSev) : leadKey);
    const second = g.keys.find((k) => k !== leadKey);
    if (second && chk.items[second]) ev.push((typeof clinicalBandLabel === "function") ? clinicalBandLabel(second, chk.items[second].sev) : second);
    if (chk.trend === "worsen") ev.push("최근 3년 추세 악화");
    if (flags.length && ev.length < 3) ev.push("생활 플래그: " + flags.join("·"));
  }
  const evidence = ev.slice(0, 3);

  /* actions — 매핑 + 특례(명문화 3종만).
     ⚠️ 절단은 이 블록 **전체**를 감싼다(형 지시 2026-10-06). acts를 빈 배열로만 두면 바로 아래
        60세↑ 특례의 `[].splice(1,0,x)`가 `[x]`를 만들어 개입이 되살아나고, coachAgent.next가
        non-null이 되어 하네스 ⑤가 「정상」으로 **조용히 PASS**한다. */
  let acts = [];
  if (!preResult) {
    acts = (typeof interventionsFor === "function") ? interventionsFor(gc.grade === "-" ? "L" : gc.grade, group) : [];
    if (m.age >= 60 && group === "body") {
      acts = acts.map((a) => a.key === "move" ? Object.assign({}, a, { ko: a.ko + "(강도 하향)" }) : a);
      if (!acts.some((a) => a.key === "family")) acts.splice(1, 0, Object.assign({ key: "family" }, INTERVENTIONS.family));
    }
    if (group === "liver" && flags.some((f) => /절주/.test(f))) {
      acts.sort((a, b) => (a.key === "habit" ? -1 : b.key === "habit" ? 1 : 0));
    }
    acts = acts.slice(0, 3);
  }

  /* script — 블록 조립(§3-S). 변형: 65세↑ 쉬운말 */
  const easy = m.age >= 65;
  const plan = HM_STAGE_PLAN[stKey] || {};
  const slots = Object.assign({
    가명: _hcMask(m.name), 프로명: pro ? pro.name : "담당 프로",
    /* D1은 evidence가 결과 근거가 아니라 「예약 확인」이라 구간 표현으로 쓰지 않는다(없는 구간을 말하지 않는다) */
    구간표현: (!preResult && evidence[0]) || "확인이 필요한 구간", 개입명: acts[0] ? acts[0].ko : "확인",
    예약처: HANDOFF_SLOTS_SAFE.예약처, 다음약속: HANDOFF_SLOTS_SAFE.다음약속,
  }, _hcFree3Slots(out));
  /* 등급별 쉬운말 — L·'-'에 "조금 높은 항목이 하나 있어요"(co-m-easy)가 나가던 결함 수선(형 지시 2026-10-05) */
  const gradeCo = gc.grade === "H" ? "co-h" : gc.grade === "M" ? "co-m" : "co-l";
  const gradeCoEasy = gc.grade === "H" ? "co-h-easy" : gc.grade === "M" ? "co-m-easy" : "co-l-easy";
  /* 정체 재개가 쉬운말보다 우선 — op-restart·cl-open(재큐 고지)은 시나리오의 핵심이라 변형에 밀리지 않는다.
     정체가 아니면 단계가 첫 마디를 정한다(HM_STAGE_PLAN) — D1은 통화 자체가 없어 표에 open이 없다 */
  let opening = stalled ? "op-restart" : (easy ? "op-first-easy" : "op-first");
  if (!stalled) { const so = easy ? plan.easyOpen : plan.open; if (so) opening = so; }
  /* ⚠️ 통화 대본 미조립(형 지시 2026-10-06) — preResult 카드는 오프닝·본론·제안·응대·클로징을
     **만들지 않는다**. 본론만 끊으면 「내용 없는 통화 대본」이 되어 종전보다 나쁘다: 실측으로 D1
     카드는 prep 「오늘은 연락하지 않아요」와 opening op-first 「지금 2분 정도 괜찮으세요?」를 한 장
     안에 함께 조립했다(표에 open이 없으면 op-first로 폴백하기 때문이다).
     구현 규약 — **스칼라 파트는 null · 배열 파트는 빈 배열**(러너·화면이 양쪽을 다르게 가드한다). */
  const script = {
    channel: "전화",     /* P3: 전 케이스 전화 1순위 — 알림·문자는 변형으로 동반 */
    variant: stalled && easy ? "정체 재개·쉬운말" : stalled ? "정체 재개" : easy ? "쉬운말" : "기본",
    callScript: !preResult,   /* 통화를 권하는 카드인가 — 결과 대기(D1)는 false(가드가 반대 방향도 본다) */
    stage: [], prep: [], alert: [],   /* 단계 축 파트 — 아래 v2 구간에서 채운다 */
    opening: preResult ? null : _hcBlock(opening, slots, out),
    core: preResult ? [] : [_hcBlock(easy ? gradeCoEasy : gradeCo, slots, out),
           !easy ? _hcBlock("co-" + group, slots, out) : null].filter(Boolean),
    ask: preResult ? null : _hcBlock(easy && acts[0] && acts[0].key === "clinic" ? "ak-clinic-easy" : "ak-" + (acts[0] ? acts[0].key : "recheck"), slots, out),
    /* 화면 표기는 「회원 반응별 응대」(형 확정 2026-08-29) — 내부 필드명은 branches 유지 */
    branches: preResult ? [] : [
      _hcBlock("br-yes", slots, out), _hcBlock("br-hold2", slots, out),
      _hcBlock(easy ? "br-no-easy" : "br-no", slots, out),
      _hcBlock("br-q-serious", slots, out), _hcBlock("br-q-ins", slots, out),
    ].filter(Boolean),
    /* 쉬운말 변형이 단계 표를 덮지 않는다 — easyClose가 있으면 그것, 없을 때만 cl-done-easy(형 지시 2026-10-05) */
    closing: preResult ? null : _hcBlock(stalled ? "cl-open" : (easy ? (plan.easyClose || "cl-done-easy") : (plan.close || "cl-done")), slots, out),
  };
  /* ── 대본 v2(P5 · HM_SCRIPT_V2 시) — 7파트: 생활 대화 2 · 씨앗 ≤1 · 케어 플랜(핵심1+보조2) · 응대 10 ── */
  if (v2on) {
    /* L6은 가족·돌봄 단계 — 생활 대화의 공통 한 칸을 동전던지기에 맡기지 않고 가족(tk-fam)으로 고정한다.
       결과 대기(preResult)는 생활 대화·씨앗·케어 플랜·추가 응대를 조립하지 않는다 — 통화가 없다 */
    if (!preResult) {
      script.talk = [_hcBlock("tk-" + group, slots, out),
        _hcBlock(stKey === "L6" ? "tk-fam" : (_drOr(i, 2) ? "tk-sleep" : "tk-fam"), slots, out)].filter(Boolean);
      if (gc.grade === "H" || gc.grade === "M") script.seed = [_hcBlock("sd-" + group, slots, out)].filter(Boolean);
      else script.seed = [];
    } else { script.talk = []; script.seed = []; }
    /* ── 단계 과업(형 지시 2026-10-05) — 응급 선행 → 사전 준비 → 과업. 단계가 유일한 선택축이고,
          쉬운말 변형도 그 표 안에서 고른다(easyAlert·easyPrep·easyTask). 변형 칸이 비어 있으면
          기본 칸을 쓴다 — 「쉬운말이라 표를 무시한다」가 되지 않게.
          ⚠️ 이 세 파트는 결과 대기 카드에도 그대로 조립된다 — D1의 과업은 prep 3블록이다 ── */
    const pick = (ez, base) => ((easy && ez) ? ez : (base || []));
    script.alert = pick(plan.easyAlert, plan.alert).map((id) => _hcBlock(id, slots, out)).filter(Boolean);
    script.prep = pick(plan.easyPrep, plan.prep).map((id) => _hcBlock(id, slots, out)).filter(Boolean);
    script.stage = pick(plan.easyTask, plan.task).map((id) => _hcBlock(id, slots, out)).filter(Boolean);
    if (!preResult) {
      const ckMap = { clinic: "ck-clinic", tele: "ck-clinic", recheck: "ck-recheck", diet: "ck-meal", supp: "ck-supp", move: "ck-care", habit: "ck-care", family: "ck-care" };
      script.careplan = acts.slice(0, 3).map((a) => _hcBlock(ckMap[a.key] || "ck-care", slots, out)).filter(Boolean)
        .filter((b2, ix, arr) => arr.findIndex((x) => x.id === b2.id) === ix);
      /* 홈케어 기기(ck-device)는 개입 사전에 키가 없어 영구 미조립이었다 — D4(생활 밀착)에서 빈 보조 칸을 채운다.
         3칸 상한은 그대로라 대본이 길어지지 않는다(중복 제거로 비는 칸만 쓴다) */
      if (stKey === "D4" && script.careplan.length < 3) {
        const dev = _hcBlock("ck-device", slots, out); if (dev) script.careplan.push(dev);
      }
      script.branches = script.branches.concat([
        _hcBlock("br2-treatcost", slots, out), _hcBlock("br2-fam", slots, out),
        _hcBlock("br2-oldins", slots, out), _hcBlock("br2-busy", slots, out), _hcBlock("br2-fear", slots, out),
      ].filter(Boolean));
    } else { script.careplan = []; }
    script.v2 = true;
  }
  /* ── D2 첫 연결 골든타임(F2 · 프롬프트 v1.1 §5 — 형 승인 2026-08-31) — D2 카드에만 fc 파트 삽입.
        재접촉·타 단계에 3종 반복 금지(스팸화 방지) · 키트 슬롯은 MA_MAP(검진 결과 기반)만.
        형 지시 2026-10-05 — `!stalled` 조건을 걷었다: 무료 3종은 D2 회원이 **한 번은 반드시** 받아야 하는
        안내이고, 정체 D2(294명 중 46명·16%)는 그 한 번을 아직 못 받은 사람들이다. 정체면 첫 마디만
        op-restart로 두고 3종 파트는 그대로 붙인다(안내를 놓친 사람에게 더 필요하다). ── */
  const d2first = v2on && stage && stage.cur === "D2";
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
    /* 골든타임 오프닝은 결과 도착 결합(op-unlock) — HM_STAGE_PLAN.D2가 이미 고른다(쉬운말도 op-unlock-easy로).
       정체 D2만 op-restart를 유지한다 — "한동안 챙겨드리지 못해서요"가 이 회원에게는 사실이다.
       형 지시 2026-10-05 — ①무료 3종(보험 혜택·리포트·케어 키트) ②향후 지원 약속 ③건강관리 동의가
       한 통화에 전부 들어가도록 순서를 고쳤다: 3종(fc) → 지원 약속(fc-support) → 동의(fc-consent) → 평생 약속.
       정체 D2는 첫 마디(op-restart)의 전제에 맞춰 fc-open·fc-kit도 재개 변형을 쓴다 —
       「오늘부터 챙겨드리게 됐어요」/「며칠 안에 집으로 가요」는 61일 정체 회원에게 사실이 아니다.
       보조 파트(fcExtra)는 **접힌 참고 갈래**다 — 본대본 분량 산정에서 빠지지만 문장 길이·금지어는
       같은 한도로 검사하고(§S-5 ⑩), 읽기 시간(readSec)도 본대본과 따로 적는다(readSecAll).
       본대본 분량은 fc-ins를 쪼개 실제로 줄였다(190자 5문장 → 124자 4문장 + fc-ins-cert는 fcExtra). */
    script.firstconnect = [stalled ? "fc-open-restart" : "fc-open", easy ? "fc-3svc-easy" : "fc-3svc",
      "fc-ins", "fc-report", stalled ? "fc-kit-restart" : "fc-kit"]
      .map(fcBlock).filter(Boolean);
    script.fcExtra = ["fc-ins-cert", "fc-ins-how", "fc-kit-use", "fc-insight"].map(fcBlock).filter(Boolean);
    script.fcTail = [fcBlock("fc-support"), fcBlock(easy ? "fc-consent-easy" : "fc-consent"), fcBlock("fc-lifetime")].filter(Boolean);
    script.branches = script.branches.concat([fcBlock("fc-q-free"), fcBlock("fc-q-sell")].filter(Boolean));
  }
  /* ── 만기 국면 대본(R4 결선 · 형 승인 2026-09-03) — T4~T7 카드에만. 값은 covAnalysis 보장맵 실산출만 ──
        보장맵이 없으면(N1 미동의) 보장맵 화법(mt-t5-map)은 조립되지 않는다 — 동의가 곧 대본의 문 */
  if (v2on && !preResult) {
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
      /* ⚠️ 상호 배타(형 지시 2026-10-05) — 만기 파트가 보장 주제를 이미 쥐고 있으면 단계 과업의
         치료비 블록(tc-*)을 뺀다. 종전 D4 대본은 tc-gapfact로 보장 공백을 설명한 뒤 몇 블록 뒤
         mt-t7-keep이 「오늘은 보험 이야기가 아니라 안부예요」라고 말해 한 통화 안에서 스스로를
         뒤집었다(D4·L5에서 재현). 승인된 만기 문안을 고치는 대신 조립에서 겹치지 않게 한다. */
      if (script.stage && script.stage.length) script.stage = script.stage.filter((b2) => !/^tc-/.test(b2.id));
    }
    /* 회원 자발 건강 대화(§0-V5) — 회원이 먼저 꺼냈을 때만 쓰는 갈래. 본대본·응대 규격에 포함되지 않는 선택 갈래.
       결과 대기 구간에는 통화 자체가 없으므로 이 갈래도 조립하지 않는다(형 지시 2026-10-06) */
    script.voluntary = ["vd-listen", "vd-confirm", "vd-offer", "vd-consent", "vd-boundary", "vd-record"]
      .map((id) => _hcBlock(id, slots, out)).filter(Boolean);
  }
  if (preResult) script.voluntary = [];
  /* 채널 변형 — 규칙 적용(창작 아님): 알림=core[0]+ask 축약 · 문자=고정 형식(수치·등급 미포함).
     D1(결과 수령 전)은 **발송 문안을 만들지 않는다** — 복사해 보내기만 하면 되는 자리에 결과 안내
     문자가 놓여 있던 것이 접촉 금지 구간의 가장 큰 위험이었다(형 지시 2026-10-05).
     ⚠️ null이 아니라 「발송 없음」 고지 문장을 넣는 이유: A5 코치(coachAgent)의 「문자로는 뭐라고
        보내요?」가 이 필드를 원천으로 읽는다 — null이면 코치가 답할 원천을 잃는다. 문안에는 이름도
        링크도 없어 그대로 복사해도 발송문이 되지 않는다. */
  if (preResult) {
    script.notif = "앱알림은 결과가 도착한 뒤에 나가요 — 지금은 발송하지 않아요.";
    script.sms = "문자 문안은 결과가 도착한 뒤에 만들어져요 — 지금은 보내지 않아요.";
  } else {
    script.notif = (script.core[0] ? script.core[0].text + " " : "") + (script.ask ? script.ask.text.split(".")[0] + "." : "");
    script.sms = "[하이핀] " + slots.가명 + "님, 검진 관련 안내드릴 내용이 있어요. 확인: {링크}";
  }

  /* 데이터 경계 검사 — evidence·대본에 숫자(수치) 유입 여부 */
  const allBlocks = [script.opening, ...script.core, script.ask, ...script.branches, script.closing,
    ...(script.alert || []), ...(script.prep || []), ...(script.stage || []),
    ...(script.firstconnect || []), ...(script.fcExtra || []), ...(script.fcTail || []), ...(script.maturity || [])]
    .filter(Boolean);
  const joined = evidence.join(" ") + " " + allBlocks.map((b) => b.text).join(" ");
  /* 119 예외는 **응급 안내 블록(em-*)에만** 준다. 종전에는 replace 목록에 벌거벗은 `119`를 넣어
     문장 어디의 119든 지웠고, 「공복혈당 119로 확인됐어요」(당뇨 전단계 실임상값)가 유출 검사를
     통과하는 길이 열려 있었다. 수축기혈압 119 mmHg도 같다(형 지시 2026-10-05 수선). */
  const numSrc = evidence.join(" ") + " " + allBlocks.map((b) => /^em-/.test(b.id) ? b.text.replace(/119/g, "") : b.text).join(" ");
  const numLeak = /\d{2,}/.test(numSrc.replace(/2년|3년|1회|2분|150분|1,000만원|코엔자임Q10|\d+일\s*뒤|연\s*[\d,]+만원|D-\d+/g, ""));   // 관용 표현 예외 후 2자리 이상 숫자 검출(1,000만원=보장 사실 고지·§0-C 동반 / Q10=성분명·수치 아님)
  const slotLeak = /\{[가-힣A-Za-z]+\}/.test(joined);                            // 미치환 슬롯 잔존({링크}는 sms 전용 — joined 밖)

  const meta = (typeof RISK_GRADE_META !== "undefined") ? RISK_GRADE_META[gc.grade] : null;
  const preCard = { script: script };   /* 가드 스캔용 최소 형태(§S-5 ⑨⑩ — 사전은 hmScriptGuard 단일 소스) */
  const scan = (typeof hmScriptScan === "function") ? hmScriptScan(preCard) : { ok: true, forbidden: [], spec: { ok: true, readSec: 0, sentences: 0 } };
  /* readSec = 본대본을 처음부터 끝까지 읽는 시간 · readSecAll = 접이식·응대까지 전부 읽었을 때의 상한.
     화면은 둘을 함께 적는다 — 한 숫자만 적으면 「계측 집합을 바꿔 짧아 보이게」 하는 길이 열린다 */
  script.readSec = scan.spec ? scan.spec.readSec : 0;
  script.readSecAll = scan.spec ? (scan.spec.readSecAll || scan.spec.readSec) : 0;
  return {
    member: { mask: _hcMask(m.name), ageBand: Math.floor(m.age / 10) * 10 + "대", sex: m.sex, region: region ? region.sgg : "",
      stage: stage ? stage.cur : "D1", stalledDays: stage ? stage.stalledDays : 0,
      /* stalled — **정체 판정** 그 자체. stalledDays는 정체 여부를 뜻하지 않으므로(cohortStageOf가
         비정체 회원에게도 0~24일을 넣는다) 로스터 정렬·점수·배지가 이 필드를 읽는다 */
      stalled: !!stalled, pro: pro ? pro.name + " 프로" : "", cohortIndex: i, callbackToken: "cb-" + i },
    grade: gc.grade, gradeWhy: gc.why, group: group,
    groupKo: preResult ? "결과 도착 후 판정" : ((HM_RISK_GROUPS[group] || {}).ko || group),
    trigger: trigger, evidence: evidence,
    actions: acts.map((a, ix) => ({ order: ix + 1, key: a.key, ko: a.ko, nav: a.nav, tab: a.tab || null, ev: a.ev, evNote: a.evNote })),
    script: script,
    timing: {
      /* sla — 사람 말 표기. 등급 '-'은 RISK_GRADE_META에 등재했으므로 더는 "-"로 떨어지지 않고,
         그중 **D2 카드만** 실제 창(goldenLeftH)에서 시한을 파생해 덮어쓴다. 등급 H/M/L의 시한은
         건드리지 않는다 — 48시간·7일·14일은 등급 규약이고 창은 과업 창이라 축이 다르다. */
      sla: (gc.grade === "-" && stKey === "D2")
        ? (gLeftH != null ? "첫 연결 골든타임 " + gLeftH + "시간 남음" : "첫 연결 창 만료 — 가능한 빨리")
        : (meta ? meta.slaKo : "-"),
      slaTier: meta ? meta.tier : "-",   /* 표기는 사람 말, 코드는 별도 필드 */
      goldenLeftH: gLeftH,               /* 창 잔여 실산출 — 화면·러너가 재계산하지 않는다 */
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
            rows.push({ i: j, grade: c.grade, group: c.group, stage: c.member.stage,   /* stage — 배치 러너의 모집단 판정이 단계를 읽는다(형 지시 2026-10-06) */
              age: c.member.ageBand, sex: c.member.sex,
              sido: m.sido || "", sgg: c.member.region, lock: c.timing.lock,
              stall: c.member.stalledDays, flags: (chk.nat && chk.nat.life) || [], pub: c.compliance.publishable });
          } catch (e) {}
        }
        return rows;
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
