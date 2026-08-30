/* ══════════════ 회원 컨텍스트(memberContext.js) — 데이터 운영계획 v1.1 §5 D-1 (2026-08-30 형 승인) ══════════════
   에이전트(하이 A0~A5)가 회원 상담에 필요한 전부를 **한 번에** 받는 360뷰 — 개별 배선 제거의 단일 진입점.
   ⚠️ 원칙:
     · 원본 수치는 담지 않는다 — 등급·구간 라벨·플래그만(데이터 경계 상속). 수치가 필요한 화면은 기존 경로 유지.
     · 조립이지 저장이 아니다 — 호출 시점 결정론 조립(캐시는 호출자 책임), 새 저장 키 없음.
     · 동의 게이트 — consent 필드가 범위를 밝히고, D-2에서 범위 밖 필드는 조회 자체가 실패하도록 승격 예정. */

function memberContext(i) {
  const prof = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(Number(i)) : null;
  if (!prof) return null;
  const card = (typeof buildHandoffCard === "function") ? buildHandoffCard(Number(i)) : null;
  const stage = (typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null;
  const proRes = (typeof cohortProOf === "function") ? cohortProOf(Number(i)) : null;
  const region = (typeof cohortRegion === "function") ? cohortRegion(Number(i)) : null;
  const ins = (typeof cohortInsurance === "function") ? cohortInsurance(Number(i)) : null;
  const sig = (typeof cohortSignalOf === "function") ? cohortSignalOf(Number(i)) : null;
  return {
    v: 1,                                                     /* 스키마 버전 — D-2 이관 러너가 검증 */
    member: { id: prof.id, mask: card ? card.member.mask : (String(prof.name || "회")[0] + "○○"),
      ageBand: Math.floor((prof.age || 0) / 10) * 10 + "대", sex: prof.sex,
      region: region ? (region.sido + " " + region.sgg) : prof.sido,
      diseases: (prof.highRiskDiseases || []).slice(0, 5), cancerRiskGrade: prof.cancerRiskGrade },
    checkup: card ? { grade: card.grade, why: card.gradeWhy, group: card.groupKo, evidence: card.evidence,
      trigger: card.trigger } : null,
    journey: stage ? { stage: stage.cur, reached: stage.reached, stalled: stage.stalled,
      stalledDays: stage.stalledDays, locked: !!stage.enrolled, famN: stage.famN } : null,
    care: card ? { actions: card.actions.map((a) => ({ order: a.order, ko: a.ko, nav: a.nav, done: a.ev })),
      sla: card.timing.sla, requeue: card.timing.requeue, publishable: card.compliance.publishable } : null,
    script: card ? { variant: card.script.variant, opening: card.script.opening && card.script.opening.text,
      readSec: card.script.readSec } : null,
    pro: proRes && proRes.pro ? { name: proRes.pro.name + " 프로", code: proRes.pro.code, branch: proRes.pro.branch } : null,
    insurance: ins ? { htkBase: ins.htkBase, gen: ins.silsonGen || ins.gen || null, n: (ins.contracts || ins.list || []).length || undefined } : null,
    signal: sig ? { type: sig.typeKo, direct: !!sig.direct, tier: sig.tier, slaH: sig.sla } : null,
    consent: { scope: ["건강·AI 활용(기본)"], src: "시연 기본값 — D-2에서 ConsentNFT 실범위로 교체", numericData: false },
    boundary: "원본 수치 미포함 · 등급·구간 라벨만(데이터 경계)",
  };
}

/* 관리자·러너 훅 */
try {
  if (typeof window !== "undefined") {
    window.__hifinCtx = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; return memberContext(i); }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
