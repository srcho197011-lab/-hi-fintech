/* ══════════════ 하이 상황 추론 엔진(reasoner) — 2단계 SARG 응답 ══════════════
   파이프라인(hiNluCore.hiRespond): 의도분류 → 상태 스냅샷 로드 → [본 엔진] 룰 기반 상황 매칭(세그먼트 정의 재사용)
   → 매칭 시 SARG 4요소 응답(상황 파악→원인·전망→해결 경로→미리 보여주기) + preview 카드 + followup(알림 예약)
   → 미매칭 시 1단계 정적 답변으로 폴백. 미분류 질문은 qpat(보조 패턴)으로도 진입한다.
   원칙: 스냅샷에 없는 사실은 말하지 않는다(진단·처방 추론 금지 — U4 정책 계승). */

/* 인텐트 id ↔ 세그먼트 intents(접두 매칭) */
function _hiSegIntentHit(seg, intentId) {
  if (!intentId) return false;
  for (const p of (seg.intents || [])) { if (intentId.indexOf(p) === 0) return true; }
  return false;
}

/* ── SARG 응답 조립 — lines 4문장(쉬운말 모드 시 축약) + preview + followup + chips ── */
function hiSargAssemble(seg, snap, m) {
  const t = seg.sarg(snap);
  const easy = (typeof hiEasyOn === "function") ? hiEasyOn() : false;
  const lines = easy
    ? [t.situation, t.route].filter(Boolean)                     // 쉬운말: 상황+행동만 짧게
    : [t.situation, t.assess, t.route, t.guide].filter(Boolean);
  let followup = null;
  try { followup = seg.followup ? seg.followup(snap) : null; } catch (e) { followup = null; }
  const preview = seg.preview ? { route: seg.preview.route, title: seg.preview.title, description: seg.preview.desc, nav: seg.preview.nav || null } : null;
  /* 버튼: 세그먼트 칩(≤3) — "알림 받기"는 followup이 있을 때만 유효 */
  const buttons = (seg.chips || []).filter(function (b) { return b !== "알림 받기" || !!followup; }).slice(0, 3);
  const nav = seg.preview && seg.preview.nav ? { key: seg.preview.nav, label: (typeof AGENT_NAV_LABEL !== "undefined" && AGENT_NAV_LABEL[seg.preview.nav]) || seg.preview.title } : null;
  return { kind: "sarg", seg: seg.id, res: { lines: lines, buttons: buttons, nav: nav, preview: preview, followup: followup } };
}

/* ── 진입점 ①: 분류 성공 시 — 인텐트 × 상태로 세그먼트 매칭(정의 순서 = 섹션 내 우선순위) ── */
function hiReason(intentId, snap, m, rawText) {
  if (!snap) return null;
  try {
    for (const seg of HI_SEGMENTS) {
      if (seg.passive) continue;   // 상태 양호 세그먼트 — 1단계 정적 답변(실수치 툴 포함)이 정답이므로 가로채지 않음
      if (!_hiSegIntentHit(seg, intentId)) continue;
      if (!seg.when(snap)) continue;
      hiReasonLog(seg.id, rawText);
      return hiSargAssemble(seg, snap, m);
    }
  } catch (e) {}
  return null;
}

/* ── 진입점 ②: 분류 실패(미이해) 시 — qpat 보조 패턴으로 직접 매칭(구어·마이닝 질문 흡수) ── */
function hiReasonDirect(normText, snap, m, rawText) {
  if (!snap || !normText) return null;
  try {
    for (const seg of HI_SEGMENTS) {
      const pats = seg.qpat || [];
      if (!pats.length) continue;
      let hit = false;
      for (const p of pats) { if (normText.indexOf(p) >= 0) { hit = true; break; } }
      if (!hit || !seg.when(snap)) continue;
      hiReasonLog(seg.id, rawText);
      return hiSargAssemble(seg, snap, m);
    }
  } catch (e) {}
  return null;
}

/* ── 추론 로그 — 세그먼트별 발동 집계(커버리지 콘솔·학습 루프용). 질문 원문 100자만, 상태 원데이터 저장 금지 ── */
function hiReasonLog(segId, q) {
  try {
    const k = "hifin_hi_sarg_log";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ seg: segId, q: String(q || "").slice(0, 100), ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-300)));
  } catch (e) {}
}
function hiReasonReport(days) {
  try {
    const since = Date.now() - (days || 7) * 86400000;
    const l = JSON.parse(localStorage.getItem("hifin_hi_sarg_log") || "[]").filter(function (x) { return x.ts >= since; });
    const bySeg = {}; l.forEach(function (x) { bySeg[x.seg] = (bySeg[x.seg] || 0) + 1; });
    return { total: l.length, bySeg: bySeg };
  } catch (e) { return { total: 0, bySeg: {} }; }
}

/* ══════════ 알림 예약(followup) 저장소 — "알림 받기" 클릭 시 저장 → 도래 시 선제 알림으로 발화 ══════════ */
function hiFollowupSave(m, followup) {
  if (!m || !followup) return false;
  try {
    const k = "hifin_hi_followups_" + (m.email || "self");
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ id: "FU-" + Date.now().toString(36).toUpperCase(), type: followup.type || "notify", due: Date.now() + (followup.inDays || 1) * 86400000, message: followup.message, at: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-30)));
    return true;
  } catch (e) { return false; }
}
function hiFollowupList(m) {
  try { return JSON.parse(localStorage.getItem("hifin_hi_followups_" + ((m && m.email) || "self")) || "[]"); } catch (e) { return []; }
}
/* 도래한 알림 회수(1회 발화 후 제거) — agentProactive에서 호출 */
function hiFollowupDue(m) {
  try {
    const k = "hifin_hi_followups_" + ((m && m.email) || "self");
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    const now = Date.now();
    const due = l.filter(function (f) { return f.due <= now; });
    if (due.length) localStorage.setItem(k, JSON.stringify(l.filter(function (f) { return f.due > now; })));
    return due;
  } catch (e) { return []; }
}

/* ══════════ LLM 추론 폴백(3차) — 룰 미매칭 상태 의존 질문용 프롬프트 빌더 ══════════
   실서비스: 이 프롬프트를 LLM에 전달(스냅샷을 컨텍스트로 주입). 데모: 기존 AI 주치의 엔진이 폴백을 담당하므로
   빌더만 표준화해 둔다 — 시스템 프롬프트로 '스냅샷에 없는 사실 발화 금지'를 강제한다. */
function hiLlmFallbackPrompt(snap, question) {
  const ctx = snap ? JSON.stringify({
    검진: snap.s1, 분석: snap.s2, 보험: { 연동: snap.s3.insLinked, 계약수: snap.s3.contractCount, 휴면보험금: snap.s3.dormantAmt, 실손: snap.s3.silsonGen },
    지갑: snap.s4, 데이터: snap.s5, 가족: snap.s6, 초대: snap.s8,
  }) : "{}";
  return [
    "당신은 헬스케어 앱의 AI 매니저 '하이'입니다. 아래 [회원 상태]만이 유일한 사실입니다.",
    "규칙: ①[회원 상태]에 없는 사실은 절대 말하지 마세요. ②진단·처방·해지 권유 등 전문가 판단은 금지(행동 안내까지만).",
    "③답변은 SARG 4단계 — 상황 파악(1문장)→원인·전망→회원이 스스로 할 행동(단계별)→관련 화면 안내.",
    "④2~4문장, 따뜻한 존댓말.",
    "[회원 상태] " + ctx,
    "[질문] " + String(question || ""),
  ].join("\n");
}

/* 관리자 콘솔 노출 */
try { if (typeof window !== "undefined") { window.__hifinReasoner = { reason: hiReason, direct: hiReasonDirect, report: hiReasonReport, followups: hiFollowupList, prompt: hiLlmFallbackPrompt }; } } catch (e) {}
