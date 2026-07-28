/* ══════════════ A2 규제 가드 — 보험 상담의 '말하면 안 되는 것'을 코드로 막는다 ══════════════
   근거: insService.js INS_AI_POLICY(allow/deny) — 선언만 있던 정책을 **응답 후처리 검사기**로 승격.
   헌법 5조
     ①청약 권유·특정 상품 추천 확정 금지  ②보험금 지급 여부 확정 판단 금지  ③의료 진단 금지(→A1)
     ④모집 행위 금지(청약·설계·체결 → GA·보험사 채널)  ⑤1·2세대 실손 해지 유도 금지(재가입 불가 경고 필수)
   + 공통: 원가·수수료 등 내부 수익구조 노출 금지
   처리: 위반 표현은 (a)정보·비교형으로 자동 교정 (b)필수 문구 부착 (c)교정 불가 시 응답 폐기 후 안전 응답.
   ⚠️ 이 파일은 A2의 모든 응답이 통과해야 하는 마지막 관문이다(insuranceAgent에서 항상 호출). */

const INS_GUARD_TEXT = {
  review: "※ 실제 지급 여부·금액은 약관과 보험사 심사에 따라 결정돼요.",
  reEnroll: "※ 1·2세대 실손은 한 번 해지하면 같은 조건으로 재가입할 수 없어요 — 유지·전환은 숫자를 보고 직접 정하세요.",
  channel: "가입·설계·청약은 라이선스 보유 채널(현대해상 전속대리점 글로벌예방금융㈜)에서 진행돼요 — 원하시면 상담을 연결해 드릴게요.",
  compare: "제가 정해 드리지는 않고, 비교에 필요한 숫자와 근거만 보여드릴게요.",
  safe: "이 부분은 제가 단정해서 말씀드리면 안 되는 영역이에요 — 확인된 정보와 절차까지만 안내해 드리고, 결정이 필요한 부분은 상담으로 이어드릴게요.",
};

/* 5조 + 공통 — detect: 위반 탐지 / mode: fix(교정)·append(문구 부착)·block(폐기) */
const INS_GUARD_RULES = [
  { id: "solicit", law: "①청약 권유·상품 추천 확정 금지", mode: "fix",
    detect: /(가입하세요|가입하시는\s*게\s*좋|가입을\s*권(해|장)드립니다|추천드립니다|추천해\s*드립니다|이\s*상품으로\s*하세요|꼭\s*가입|반드시\s*가입|드시는\s*게\s*좋)/g,
    fix: (s) => s.replace(/(가입하세요|가입하시는\s*게\s*좋습니다|가입을\s*권해드립니다|가입을\s*권장드립니다|추천드립니다|추천해\s*드립니다|이\s*상품으로\s*하세요|꼭\s*가입하세요|반드시\s*가입하세요)/g, "비교해 보실 수 있어요") },
  { id: "payout", law: "②보험금 지급 확정 판단 금지", mode: "fix+append",
    detect: /(받으실\s*수\s*있습니다|받을\s*수\s*있어요|지급됩니다|지급돼요|지급될\s*거예요|보상됩니다|무조건\s*(지급|보상)|확실히\s*받)/,
    fix: (s) => s
      .replace(/확실히\s*받으실\s*수\s*있어요|확실히\s*받을\s*수\s*있어요|확실히\s*받아요|확실히\s*받으실\s*수\s*있습니다/g, "받을 수 있는지는 심사로 결정돼요")
      .replace(/받으실\s*수\s*있습니다|받으실\s*수\s*있어요/g, "받으실 수 있는지는 심사로 결정돼요")
      .replace(/받을\s*수\s*있습니다|받을\s*수\s*있어요/g, "받을 수 있는지는 심사로 결정돼요")
      .replace(/무조건\s*(지급|보상)(됩니다|돼요|이에요)?/g, "지급 여부는 약관에 따라 달라져요")
      .replace(/지급될\s*거예요|지급됩니다|지급돼요/g, "지급 여부는 심사로 결정돼요")
      .replace(/보상됩니다|보상돼요/g, "보상 여부는 심사로 결정돼요"),
    need: INS_GUARD_TEXT.review },
  { id: "diagnose", law: "③의료 진단 금지", mode: "block", handback: "A1",
    detect: /(진단입니다|진단이에요|암입니다|당뇨입니다|고혈압입니다|확실히\s*(암|당뇨|고혈압|뇌졸중)|병이\s*있으세요|치료가\s*필요합니다)/ },
  { id: "brokerage", law: "④모집 행위 금지", mode: "fix",
    detect: /(청약해\s*드릴게요|청약\s*진행할게요|계약\s*체결해|설계해\s*드릴게요|가입시켜\s*드릴게요|제가\s*가입해)/g,
    fix: (s) => s.replace(/(청약해\s*드릴게요|청약\s*진행할게요|계약\s*체결해\s*드릴게요|설계해\s*드릴게요|가입시켜\s*드릴게요|제가\s*가입해\s*드릴게요)/g, INS_GUARD_TEXT.channel) },
  { id: "surrender", law: "⑤1·2세대 해지 유도 금지", mode: "fix",
    detect: /(해지하세요|해지하시는\s*게\s*(좋|나)|갈아타세요|전환하세요|바꾸세요|정리하세요)/g,
    fix: (s) => s.replace(/(해지하세요|해지하시는\s*게\s*좋아요|해지하시는\s*게\s*나아요|갈아타세요|전환하세요|바꾸세요|정리하세요)/g, "유지와 전환을 숫자로 비교해 보실 수 있어요") },
  { id: "cost", law: "공통·내부 수익구조 노출 금지", mode: "strip",
    detect: /(원가|송객\s*수수료|중개\s*수수료|마진율|수수료율|CAC|LTV|PREMIUM_MARGIN)/ },
];

/* 해지·전환을 '언급'만 해도 재가입 불가 경고가 없으면 부착(⑤ 보강) */
const INS_SURRENDER_MENTION = /(해지|전환|갈아타|세대\s*전환)/;
const INS_OLD_GEN = /(1세대|2세대|구실손|표준화)/;
/* 지급·보험금 언급 시 심사 문구가 없으면 부착(② 보강) */
const INS_PAYOUT_MENTION = /(보험금|지급|보상|청구)/;

function insuranceGuard(lines, ctx) {
  const out = { lines: (lines || []).slice(), violations: [], blocked: false, handback: null };
  try {
    let joined = out.lines.join("\n");

    /* 1) 규칙별 처리 */
    for (const r of INS_GUARD_RULES) {
      if (!r.detect.test(joined)) { r.detect.lastIndex = 0; continue; }
      r.detect.lastIndex = 0;
      out.violations.push({ id: r.id, law: r.law, mode: r.mode });
      if (r.mode === "block") { out.blocked = true; out.handback = r.handback || null; break; }
      if (r.mode === "strip") { out.lines = out.lines.filter((l) => !r.detect.test(l)); r.detect.lastIndex = 0; joined = out.lines.join("\n"); }
      /* 교정과 문구 부착은 mode와 무관하게 정의된 것을 모두 적용 — 단정 표현은 '지우고' 안내 문구는 '더한다' */
      if (r.fix) { out.lines = out.lines.map(r.fix); joined = out.lines.join("\n"); }
      if (r.need && joined.indexOf(r.need) < 0) { out.lines.push(r.need); joined = out.lines.join("\n"); }
    }
    if (out.blocked) {
      out.lines = [INS_GUARD_TEXT.safe];
      return out;
    }

    /* 2) 필수 문구 보강 — 언급만 해도 붙는 안전장치 */
    if (INS_SURRENDER_MENTION.test(joined) && (INS_OLD_GEN.test(joined) || (ctx && ctx.oldGen))) {
      if (joined.indexOf("재가입") < 0) { out.lines.push(INS_GUARD_TEXT.reEnroll); out.violations.push({ id: "surrender-warn", law: "⑤ 재가입 불가 경고 보강", mode: "append" }); joined = out.lines.join("\n"); }
    }
    if (INS_PAYOUT_MENTION.test(joined) && !/약관|심사|보험사\s*심사/.test(joined)) {
      out.lines.push(INS_GUARD_TEXT.review); out.violations.push({ id: "payout-warn", law: "② 심사 결정 문구 보강", mode: "append" });
    }
  } catch (e) {}
  return out;
}

/* 위반 시도 로그 — 유형과 원문 60자만(개인정보·상태 원데이터 저장 금지) */
function insGuardLog(question, v) {
  try {
    if (!v || !v.length) return;
    const k = "hifin_ins_guard";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(question || "").slice(0, 60), ids: v.map((x) => x.id), ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}
function insGuardReport(days) {
  try {
    const since = Date.now() - (days || 7) * 86400000;
    const l = JSON.parse(localStorage.getItem("hifin_ins_guard") || "[]").filter((x) => x.ts >= since);
    const byId = {};
    l.forEach((x) => (x.ids || []).forEach((i) => { byId[i] = (byId[i] || 0) + 1; }));
    return { total: l.length, byId };
  } catch (e) { return { total: 0, byId: {} }; }
}

try { if (typeof window !== "undefined") { window.__hifinInsGuard = { check: insuranceGuard, report: insGuardReport, rules: INS_GUARD_RULES, text: INS_GUARD_TEXT }; } } catch (e) {}
