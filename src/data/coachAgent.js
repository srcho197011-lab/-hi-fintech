/* ══════════════ A5 코치 응답기(coachAgent.js) — 지시서 프롬프트 v1.3 §S-6 (P4) ══════════════
   프로의 질문("뭐라고 시작해요?" "거절하면요?")에 그 카드의 대본·필드로 답하는 보조 에이전트.
   ⚠️ 새 문장 금지(§9): 답은 언제나 ①카드의 블록 문장 그대로 ②카드 필드 값의 나열 — 둘 중 하나다.
   블록 사전 밖 문장을 답하면 회귀가 실패한다(§S-6). 성숙 단계는 섀도(ready:false) — 라우터 미위임. */

/* 질문 유형 사전 — 정답 원천(source)은 카드 안에서만. 패턴은 러너 코퍼스 생성과 공유 */
const COACH_QTYPES = [
  { q: "why",      ko: "왜 이 지시예요?",        pats: [/왜\s*(이|이런)?\s*(지시|카드|연락)/, /이유가?\s*(뭐|무엇)/, /근거가?\s*(뭐|있)/] },
  { q: "start",    ko: "뭐라고 시작해요?",        pats: [/뭐라고?\s*(시작|말(을)?\s*꺼내|먼저)/, /첫\s*마디/, /오프닝/] },
  { q: "reject",   ko: "거절하면요?",             pats: [/거절(하|이)?면/, /싫다(고)?\s*하면/, /괜찮다고?\s*하면/, /안\s*한다(고)?\s*하면/] },
  { q: "serious",  ko: "심각하냐고 물으면요?",     pats: [/심각(하냐|하|한\s*거)냐?고?\s*물으면/, /심각한\s*거냐고/, /큰\s*병이냐고/] },
  { q: "sms",      ko: "문자로는 뭐라고 보내요?",  pats: [/문자(로는|로|는)?\s*뭐/, /문자\s*(보내|내용)/, /sms/i] },
  { q: "deadline", ko: "언제까지 해야 해요?",      pats: [/언제까지/, /기한(이)?\s*(언제|있)/, /마감/] },
  { q: "next",     ko: "다음은 뭐예요?",           pats: [/다음(은|엔|에는)?\s*(뭐|무엇|어떻게)/, /그\s*다음/, /후속/] },
];

function coachQType(text) {
  const t = String(text || "").trim();
  for (const d of COACH_QTYPES) for (const p of d.pats) if (p.test(t)) return d.q;
  return null;
}

/* 응답 조립 — card는 buildHandoffCard 산출물. 반환 {q, source:"block"|"field", id, text} */
function coachAnswer(card, qtext) {
  const q = coachQType(qtext);
  if (!card || !card.script || !q) return null;
  const s = card.script;
  const findBr = (pref) => (s.branches || []).find((b) => b.id.indexOf(pref) === 0) || null;
  switch (q) {
    case "why":      /* 필드 나열 — trigger·근거·등급 사유(새 문장 없음: 값의 연결) */
      return { q, source: "field", id: "trigger", text: card.trigger + " · " + card.gradeWhy + (card.evidence[0] ? " · " + card.evidence[0] : "") };
    case "start":    return s.opening ? { q, source: "block", id: s.opening.id, text: s.opening.text } : null;
    case "reject": { const b = findBr("br-no"); return b ? { q, source: "block", id: b.id, text: b.text } : null; }
    case "serious": { const b = findBr("br-q-serious"); return b ? { q, source: "block", id: b.id, text: b.text } : null; }
    case "sms":      return { q, source: "field", id: "sms", text: s.sms };
    case "deadline": return { q, source: "field", id: "sla", text: "SLA " + card.timing.sla + " · " + card.timing.requeue };
    case "next": {   /* 1순위 개입과 완결 조건 — actions 필드 나열 */
      const a = card.actions && card.actions[0];
      return a ? { q, source: "field", id: "actions", text: a.order + "순위 " + a.ko + " · 완결 = " + a.evNote.split("—")[0].trim() } : null;
    }
  }
  return null;
}

/* 회귀 채점용 — 응답 문장이 카드 안 원천(블록 문장·필드 값)만으로 설명되는지(§S-6 블록 사전 밖 문장 검출) */
function coachAnswerVerify(card, ans) {
  if (!ans) return false;
  if (ans.source === "block") {
    const s = card.script;
    const all = [s.opening, ...(s.core || []), s.ask, ...(s.branches || []), s.closing].filter(Boolean);
    return all.some((b) => b.id === ans.id && b.text === ans.text);
  }
  /* field 응답: 카드 필드 값들을 응답에서 제거했을 때 잔여가 구분자·공백뿐이면 새 문장 0
     (값 자체에 구분자가 든 필드(sla 등)가 있어 split 비교는 오탐 — 잔여 검사로 판정) */
  const pool = [card.trigger, card.gradeWhy, ...(card.evidence || []), card.script.sms,
    "SLA " + card.timing.sla, card.timing.requeue]
    .concat((card.actions || []).map((a) => a.order + "순위 " + a.ko))
    .concat((card.actions || []).map((a) => "완결 = " + a.evNote.split("—")[0].trim()))
    .sort((x, y) => String(y).length - String(x).length);   // 긴 값 먼저 제거(부분 겹침 방지)
  let rest = String(ans.text);
  for (const v of pool) { if (v) rest = rest.split(v).join(" "); }
  return /^[\s·,.]*$/.test(rest);
}

/* 회귀 러너 훅 — 관리자 전용(§7 훅 규약): 카드 조립 + 코치 응답 + 원천 검증을 한 번에 */
try {
  if (typeof window !== "undefined") {
    window.__hifinCoach = function (i, qtext) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const card = buildHandoffCard(Number(i)); if (!card) return null;
        const ans = coachAnswer(card, qtext);
        return { qtype: coachQType(qtext), ans: ans, verified: ans ? coachAnswerVerify(card, ans) : false };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
