/* ══════════════ 일일 지시서 로스터(dailyRoster.js) — 지시서 프롬프트 v1.3 §5-F (P5) ══════════════
   프로 1인의 「오늘의 지시서」 선별기. 시드 = 날짜 + 프로코드 — 같은 날 같은 프로는 언제나 같은 로스터.
   대량 저장이 아니라 온디맨드 결정론 조립(A6): 열람 시점에 관할 회원을 조립해 우선순위로 5±2건.
   ⚠️ 원칙: 락(검진 전 접촉 금지) 회원 제외 · E는 트리아지 소유(카드 없음) · 발행 불가 카드 제외 ·
   수기 편집·재배분 기능 없음 — 로스터는 데이터에서만 나온다. */

const HM_ROSTER_TARGET = 5, HM_ROSTER_MAX = 7;   // 5±2건(§5-F)

function _drHash(s) { let h = 5381; for (let k = 0; k < s.length; k++) h = ((h << 5) + h + s.charCodeAt(k)) >>> 0; return h; }

/* 우선순위 점수 — 높을수록 먼저. 규칙 명문화(즉석 판단 금지):
   H(연결 우선) 300 > 정체 재개 +150 > M 200 > L 100 · 신호 SLA 임박 가산 · 동점은 날짜·프로 시드로 결정 */
function _drScore(card, sig, dateStr, code) {
  let s = card.grade === "H" ? 300 : card.grade === "M" ? 200 : 100;
  if (card.member.stalledDays >= 14) s += 150;
  if (sig && typeof sig.sla === "number") s += Math.max(0, 100 - sig.sla);
  return s * 1000 + (_drHash(dateStr + "|" + code + "|" + card.member.cohortIndex) % 997);
}

function hmDailyRoster(code, dateStr) {
  const ids = (typeof hmMembersOfPro === "function") ? hmMembersOfPro(code) : [];
  const cand = []; let lockedN = 0, offN = 0, unpubN = 0, resultSkipN = 0, followUpN = 0;
  for (const i of ids) {
    let card = null;
    try { card = buildHandoffCard(i); } catch (e) {}
    if (!card) continue;
    if (card.timing.lock) { lockedN++; continue; }
    if (card.grade === "-") { offN++; continue; }
    if (!card.compliance.publishable) { unpubN++; continue; }
    /* P2: 어제까지의 결과 기록이 오늘의 명단을 바꾼다 — 완결·거절 쿨다운 제외, 후속일 도래 가산(§0-B 순환) */
    let adj = { skip: false, boost: 0 };
    try { if (typeof hmrRosterAdjust === "function") adj = hmrRosterAdjust(code, i, dateStr); } catch (e) {}
    if (adj.skip) { resultSkipN++; continue; }
    if (adj.boost) followUpN++;
    const sig = (typeof cohortSignalOf === "function") ? cohortSignalOf(i) : null;
    cand.push({ i: i, card: card, sig: sig, followUp: !!adj.boost,
      score: _drScore(card, sig, dateStr, code) + (adj.boost || 0) * 1000 });
  }
  cand.sort((a, b) => b.score - a.score);
  /* 건수 — H는 상한 내 전부, 나머지로 목표(5) 채움, 상한 7 */
  const hs = cand.filter((c) => c.card.grade === "H").slice(0, HM_ROSTER_MAX);
  const rest = cand.filter((c) => c.card.grade !== "H");
  const list = hs.concat(rest).slice(0, Math.max(hs.length, Math.min(HM_ROSTER_TARGET, cand.length))).slice(0, HM_ROSTER_MAX);
  const byGrade = {}; list.forEach((c) => byGrade[c.card.grade] = (byGrade[c.card.grade] || 0) + 1);
  return { code: code, date: dateStr, list: list,
    counts: { managed: ids.length, candidates: cand.length, locked: lockedN, offCycle: offN, unpublishable: unpubN,
      resultSkipped: resultSkipN, followUpBoost: followUpN, byGrade: byGrade } };
}

/* 러너·콘솔 훅 — 관리자 전용 프로필에서도 프로 콘솔(코드 게이트 뒤)에서도 쓰도록 카드 요약+검사 필드 동반 */
try {
  if (typeof window !== "undefined") {
    /* 프로 목록(러너용 — 활성만) */
    window.__hifinPros = function () {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        return hmProsGen().filter((x) => x.status === "활성").map((x) => ({ code: x.code, name: x.name, sido: x.sido, sgg: x.sgg }));
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
          rows: r.list.map((c) => ({ i: c.i, grade: c.card.grade, group: c.card.group, mask: c.card.member.mask,
            sla: c.card.timing.sla, pub: c.card.compliance.publishable, lock: c.card.timing.lock,
            variant: c.card.script.variant, readSec: c.card.script.readSec })) };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
