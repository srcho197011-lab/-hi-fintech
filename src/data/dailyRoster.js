/* ══════════════ 일일 지시서 로스터(dailyRoster.js) — 지시서 프롬프트 v1.3 §5-F (P5) ══════════════
   프로 1인의 「오늘의 지시서」 선별기. 시드 = 날짜 + 프로 사번(8H####) — 같은 날 같은 프로는 언제나 같은 로스터.
   대량 저장이 아니라 온디맨드 결정론 조립(A6): 열람 시점에 관할 회원을 조립해 우선순위로 5±2건.
   ⚠️ 원칙: 락(검진 전 접촉 금지) 회원 제외 · E는 트리아지 소유(카드 없음) · 발행 불가 카드 제외 ·
   수기 편집·재배분 기능 없음 — 로스터는 데이터에서만 나온다. */

const HM_ROSTER_TARGET = 5, HM_ROSTER_MAX = 7;   // 5±2건(§5-F) — 상한·목표는 규약 문서 소관(불변)
/* ── 되돌릴 수 없는 창 쿼터(제품 규칙 · 형 지시 2026-10-06) ──
   상한(7) 안에서 **먼저 앉히는** 자리다. 상한을 올리지 않으므로 「5±2건」 규약은 그대로 지켜진다.
     d2  D2 **첫 연결 미완료** 최대 3칸 — 무료 3종을 한 번도 받지 못한 회원이다.
     mat 만기 D-7·당일(T5·T6) 최대 1칸 — CYCLE_STAGES가 「가장 중요한 30초」로 정의한 두 번째
         되돌릴 수 없는 창이다. 쿼터를 D2에만 주면 이 창이 밀린다(R3 수선의 재발).
   ⚠️ 쿼터 이름이 「골든타임이 열린 카드」가 아니라 **「첫 연결 미완료」**인 이유(적대적 리뷰 실증
      2026-10-06): D2는 cycleOf 판정상 열린 창(T2·잔여>0) 42.8% · 창 종료(T2·잔여 0h) 16.7% ·
      창 밖(T3) 40.5%로 갈린다(i≤6000 D2 432명 실측 185/72/175). 자격을 「열린 창」으로 좁히면
      나머지 57%는 무료 3종을 **영구히 못 받는다**(등급 '-'가 44%라 종전 경로로는 자리가 없다).
      그래서 자격은 단계로 두고, **열린 창을 1순위로 앉혀** 「창이 닫히면 되돌릴 수 없다」는 주장이
      실제로 그 카드에서 참이 되게 한다. 창 상태는 trigger·배지·리포트·⑩·하이가 **같은 분해**로 적는다.
   후보가 적으면 그만큼만 앉히고, 빈 칸은 종전 규칙(H·만기 선두군 → 나머지)이 채운다.
   ⚠️ 특정 사번 분기는 없다 — 전 프로에 같은 규칙이 적용되고, D2 후보가 0인 프로는 자동 degrade한다.
   왜 점수가 아니라 쿼터인가: cycBoost(400~800)는 등급 한 칸(1000)을 넘지 못하고, D2는
   cycleStage 판정상 T2/T3밖에 될 수 없어 **등급 H가 아닌 D2는 선두군에 들어갈 길이 구조적으로 없다**.
   ⚠️ 이 상수를 화면·하이 문장에 숫자로 복제하지 말 것 — counts.win으로 내보내 한 곳에서 읽는다. */
const HM_ROSTER_WINDOW = { d2: 3, mat: 1 };

function _drHash(s) { let h = 5381; for (let k = 0; k < s.length; k++) h = ((h << 5) + h + s.charCodeAt(k)) >>> 0; return h; }

/* 우선순위 점수 — 높을수록 먼저. 규칙 명문화(즉석 판단 금지):
   H(연결 우선) 300 > 정체 재개 +150 > M 200 > L 100 · 신호 SLA 임박 가산 · 동점은 날짜·프로 시드로 결정 */
function _drScore(card, sig, dateStr, code) {
  /* W(결과 대기)는 0 — 단계 필터의 이중 가드다. L과 동점 100이면 자리가 비는 날 접촉 금지 카드가
     다시 올라온다(형 지시 2026-10-06) */
  let s = card.grade === "H" ? 300 : card.grade === "M" ? 200 : card.grade === "W" ? 0 : 100;
  /* ⚠️ 정체 가산은 **실제 정체 판정**(card.member.stalled)만 본다 — `stalledDays >= 14` 프록시는
     정체를 뜻하지 않는다(cohortStageOf가 비정체 회원에게도 0~24일을 넣는다). 실측: D2 432명 중
     stalledDays≥14가 230명인데 실제 정체는 77명 — 153명(66.5%)이 오판이었다(적대적 리뷰 실증) */
  if (card.member.stalled) s += 150;
  if (sig && typeof sig.sla === "number") s += Math.max(0, 100 - sig.sla);
  return s * 1000 + (_drHash(dateStr + "|" + code + "|" + card.member.cohortIndex) % 997);
}

function hmDailyRoster(code, dateStr) {
  /* 시드는 정규화된 사번 — 세션에 구 코드가 남아 있어도 같은 날 같은 프로는 같은 로스터 순서가 된다 */
  code = (typeof hmCodeNorm === "function") ? hmCodeNorm(code) : code;
  const ids = (typeof hmMembersOfPro === "function") ? hmMembersOfPro(code) : [];
  const cand = []; let lockedN = 0, offN = 0, unpubN = 0, resultSkipN = 0, followUpN = 0, preN = 0, dashD2N = 0;
  for (const i of ids) {
    let card = null;
    try { card = buildHandoffCard(i); } catch (e) {}
    if (!card) continue;
    /* ⚠️ 락 검사를 **그대로 먼저** 둔다(형 지시 2026-10-06) — 단계 검사를 앞에 두면 counts.locked가
       전국 0이 되어 같은 화면의 ③탭 KPI(「접촉 락 N명」)와 ⓪탭 헤더가, 하이의 한 답변 안에서
       단계 분포의 락(32,855명)과 로스터 분해의 락(0)이 서로 충돌한다. */
    if (card.timing.lock) { lockedN++; continue; }
    /* 접촉 금지 — 결과 대기 전건. 락은 D1의 60%만 걸러내므로(비가입 D1은 통과했다) 단계로 끊는다 */
    if (card.member.stage === "D1") { preN++; continue; }
    /* off-cycle(등급 '-') 제외에서 **D2만 면제** — 첫 연결 골든타임은 등급과 무관하게 한 번은 반드시
       나가야 하는 안내다(D2의 44%가 '-'라 명단에 오르지 못했다).
       ⚠️ dashD2 카운터는 **면제가 실제로 작동했는가**를 러너가 양성으로 검사하는 자리다
          (면제를 되돌리면 이 수가 0이 되고 러너가 FAIL한다 — 적대적 리뷰 실증: 종전엔 되돌려도 PASS) */
    if (card.grade === "-") {
      if (card.member.stage !== "D2") { offN++; continue; }
      dashD2N++;
    }
    if (!card.compliance.publishable) { unpubN++; continue; }
    /* P2: 어제까지의 결과 기록이 오늘의 명단을 바꾼다 — 완결·거절 쿨다운 제외, 후속일 도래 가산(§0-B 순환) */
    let adj = { skip: false, boost: 0 };
    try { if (typeof hmrRosterAdjust === "function") adj = hmrRosterAdjust(code, i, dateStr); } catch (e) {}
    if (adj.skip) { resultSkipN++; continue; }
    if (adj.boost) followUpN++;
    const sig = (typeof cohortSignalOf === "function") ? cohortSignalOf(i) : null;
    /* R3 — 60일 사이클 부스트: 만기 국면이 달력 값으로 로스터에 올라온다(후속 약속 1000보다는 아래) */
    let cyc = null, cycBoost = 0;
    try {
      cyc = (typeof cycleOf === "function") ? cycleOf(i) : null;
      if (cyc) {
        if (cyc.t === "T5") cycBoost = 800;                 /* 만기 D-7 — 보장맵 안내+동의 요청, 가장 중요한 30초 */
        else if (cyc.t === "T6") cycBoost = 700;            /* 만기 당일 — 2차 골든타임 개시 */
        else if (cyc.t === "T4") cycBoost = 500;            /* D-20 — 보장 종료 예고 */
        else if (cyc.secondGolden) cycBoost = 400;          /* T7 무보장 회복 창 */
      }
    } catch (e) {}
    cand.push({ i: i, card: card, sig: sig, followUp: !!adj.boost, cycle: cyc ? cyc.t : null,
      /* 골든타임 잔여 시간 — 창이 이미 닫힌(0h) 카드는 null로 둔다. cycleOf를 여기서 한 번만 부르고
         정렬에서 다시 부르지 않는다(결정론·비용 둘 다) */
      gleft: (cyc && cyc.t === "T2" && cyc.goldenLeftH > 0) ? cyc.goldenLeftH : null,
      score: _drScore(card, sig, dateStr, code) + (adj.boost || 0) * 1000 + cycBoost });
  }
  cand.sort((a, b) => b.score - a.score);
  /* 건수 — ①되돌릴 수 없는 창(D2 첫 연결·만기 D-7/당일)을 상한 안에서 먼저 앉히고,
     ②H와 만기 국면(T4~T6·무보장 회복 창)은 등급 무관 선두 그룹(R3 수정: H 우선 규칙이 만기 카드를
     밀어내던 결함), ③나머지로 목표(5) 채움, 상한 7 */
  const isMat = (c) => c.cycle && ["T4", "T5", "T6"].indexOf(c.cycle) >= 0;
  /* D2 쿼터 정렬 — 「창이 열린 것 → 잔여 적은 순 → 비정체 → 점수」.
     ⚠️ 창 가중이 **1순위**다(적대적 리뷰 실증 2026-10-06 수선). 종전 1순위는 `stalledDays >= 14`
        프록시였고 그 값은 정체를 뜻하지 않아서, 잔여 24시간 카드가 창 없는 카드 3장에 밀려 5번으로
        내려가는 실사례(8H0004)가 있었다 — 주석이 적어 둔 근거(「창이 닫히는 순서」)와 정반대였다.
     ⚠️ 「잔여 적은 순」만 쓰면 goldenLeftH 정의상 잔여 0h(=창 종료)가 1순위로 올라와 규칙의 근거를
        배반하므로, 열림 여부를 먼저 가른 뒤 열린 것들 안에서만 잔여를 비교한다.
     정체를 뒤로 보내는 이유: 「한동안 챙겨드리지 못해서요」로 시작하는 재개 카드가 첫 연결 자리를
     차지하면 그 자리의 목적이 사라진다 — 단, 판정은 실제 정체(member.stalled)로 한다. */
  const d2q = cand.filter((c) => c.card.member.stage === "D2")
    .sort((a, b) => (a.gleft === null ? 1 : 0) - (b.gleft === null ? 1 : 0)
      || (a.gleft === null ? 0 : a.gleft - b.gleft)
      || (a.card.member.stalled ? 1 : 0) - (b.card.member.stalled ? 1 : 0)
      || b.score - a.score)
    .slice(0, HM_ROSTER_WINDOW.d2);
  const matq = cand.filter((c) => ["T5", "T6"].indexOf(c.cycle) >= 0 && d2q.indexOf(c) < 0)
    .sort((a, b) => (a.cycle === "T6" ? 0 : 1) - (b.cycle === "T6" ? 0 : 1) || b.score - a.score)
    .slice(0, HM_ROSTER_WINDOW.mat);
  const win = d2q.concat(matq);
  const hs = cand.filter((c) => win.indexOf(c) < 0 && (c.card.grade === "H" || isMat(c))).slice(0, HM_ROSTER_MAX - win.length);
  const rest = cand.filter((c) => win.indexOf(c) < 0 && hs.indexOf(c) < 0);
  const lead = win.concat(hs);
  const list = lead.concat(rest).slice(0, Math.max(lead.length, Math.min(HM_ROSTER_TARGET, cand.length))).slice(0, HM_ROSTER_MAX);
  const byGrade = {}; list.forEach((c) => byGrade[c.card.grade] = (byGrade[c.card.grade] || 0) + 1);
  return { code: code, date: dateStr, list: list,
    counts: { managed: ids.length, candidates: cand.length, locked: lockedN, preResult: preN, offCycle: offN, unpublishable: unpubN,
      resultSkipped: resultSkipN, followUpBoost: followUpN, byGrade: byGrade,
      /* 쿼터 실측 — 러너가 「배정한 쿼터가 실제로 명단에 올랐는가」를 검사한다(후보 수도 함께 둔다).
         ⚠️ 러너의 양성 단언은 **쿼터 산출이 아니라 후보 수**를 기대값으로 써야 한다 — d2Quota는
            쿼터 코드 자신의 산출이라 쿼터를 지우면 0이 되어 영구 무해통과였다(적대적 리뷰 실증).
         d2OpenCand/d2OpenSeated — 「창이 열린 D2」 후보 대비 등재. 이 쌍이 쿼터 독립 게이트다.
         dashD2 — 등급 '-' D2 면제가 작동한 수(0이면 면제가 사라졌다는 뜻).
         hCand — 오늘 후보 중 H 고위험 수. 「H가 쿼터에 밀려 명단 밖으로 나간 수」를 러너·리포트·
                 ⑩이 세려면 **분모가 필요하다**(종전에는 어디에도 없었다). */
      d2Quota: d2q.length, matQuota: matq.length,
      d2Cand: cand.filter((c) => c.card.member.stage === "D2").length,
      d2OpenCand: cand.filter((c) => c.card.member.stage === "D2" && c.gleft !== null).length,
      d2OpenSeated: list.filter((c) => c.card.member.stage === "D2" && c.gleft !== null).length,
      dashD2: dashD2N, hCand: cand.filter((c) => c.card.grade === "H").length,
      matCand: cand.filter((c) => ["T5", "T6"].indexOf(c.cycle) >= 0).length,
      /* 상한·쿼터 상수 동반 — 화면·하이 문장이 숫자를 복제하지 않고 여기서 읽는다(단일 소스) */
      win: { d2: HM_ROSTER_WINDOW.d2, mat: HM_ROSTER_WINDOW.mat, max: HM_ROSTER_MAX, target: HM_ROSTER_TARGET } } };
}

/* 러너·콘솔 훅 — 관리자 전용 프로필에서도 프로 콘솔(코드 게이트 뒤)에서도 쓰도록 카드 요약+검사 필드 동반 */
try {
  if (typeof window !== "undefined") {
    /* 프로 목록(러너용) — 기본 활성만, "all"이면 전원(사번·배치 전수 검증용) */
    window.__hifinPros = function (mode) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const l = mode === "all" ? hmProsGen() : hmProsGen().filter((x) => x.status === "활성");
        return l.map((x) => ({ code: x.code, sabun: x.sabun, name: x.name, sido: x.sido, sgg: x.sgg, branch: x.branch, status: x.status, legacy: !!x.legacy }));
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
    /* 전체 카드 동반 로스터(형 검수 표본·실렌더용) */
    window.__hifinRosterFull = function (code, dateStr) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const r = hmDailyRoster(String(code), String(dateStr));
        return { code: r.code, date: r.date, counts: r.counts, cards: r.list.map((c) => c.card) };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
    window.__hifinRoster = function (code, dateStr) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const r = hmDailyRoster(String(code), String(dateStr));
        return { code: r.code, date: r.date, counts: r.counts,
          /* stage·cycle·sd 동반 — 이것이 없으면 「로스터에 접촉 금지 단계가 있으면 위반」을
             러너가 **물리적으로 검사할 수 없다**(형 지시 2026-10-06) */
          rows: r.list.map((c) => ({ i: c.i, grade: c.card.grade, group: c.card.group, mask: c.card.member.mask,
            stage: c.card.member.stage, cycle: c.cycle, sd: c.card.member.stalledDays, stalled: !!c.card.member.stalled, gleft: c.gleft,
            sla: c.card.timing.sla, pub: c.card.compliance.publishable, lock: c.card.timing.lock,
            variant: c.card.script.variant, readSec: c.card.script.readSec })) };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
