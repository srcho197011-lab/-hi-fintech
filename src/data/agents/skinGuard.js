/* ══════════════ 스킨 헬스케어 가드 — 화장품법·표시광고 ══════════════
   ⚠️ shoppingGuard(건강기능식품)를 확장하지 않고 **따로 둔다.** 법령이 다르면 가드도 달라야 한다.
      건기식 고지문("건강기능식품은 의약품이 아닙니다")을 화장품에 붙이면 그 자체가 잘못된 표시다.

   헌법 7조
     ①의약품 오인 금지(치료·완화·재생)  ②효능 단정 금지  ③기능성화장품 범위 준수(미백·주름개선·자외선차단)
     ④안전성 단정 금지  ⑤진단 금지(→A1)  ⑥원가·마진 노출 금지  ⑦공정 비교 의무

   처리 원칙은 A2~A4와 같다 — **단정 표현은 치환한다.** 뒤에 고지를 덧붙이는 것은 교정이 아니다. */

const SKIN_GUARD_TEXT = {
  notDrug: "※ 화장품은 인체를 청결·미화하고 피부·모발의 건강을 유지·증진하기 위한 물품으로, 질병의 진단·치료·경감·처치·예방을 목적으로 하는 의약품이 아니에요.",
  seeDoctor: "※ 증상이 계속되거나 심해지면 피부과 진료로 확인해 주세요.",
  patch: "※ 피부가 예민하시면 사용 전 팔 안쪽에 소량 발라 확인(패치테스트)해 보시는 걸 권해요.",
  basis: "※ 비교는 표시된 기준(용량당 단가)으로만 했고, 어떤 제품이 더 낫다고 단정하지 않아요.",
  functional: "※ 기능성화장품은 미백·주름 개선·자외선 차단 세 가지로, 식약처 심사·보고를 확인한 제품에만 표기해요.",
  safe: "이 부분은 제가 단정해서 말씀드리면 안 되는 영역이에요 — 확인된 제품 정보와 비교 기준까지만 안내해 드릴게요.",
};

const SKIN_GUARD_RULES = [
  /* ① 의약품 오인 — 아토피·여드름·탈모 '치료'는 화장품이 말할 수 없다 */
  { id: "drugClaim", law: "①의약품 오인 금지", mode: "fix+append",
    detect: /(아토피|여드름|탈모|건선|주사|infl)?.{0,6}(치료(해요|합니다|돼요|됩니다|가\s*돼)|완치|낫게\s*해|낫습니다|없애\s*드려요|제거해\s*드려요|재생(시켜|해\s*드려요|됩니다))/,
    fix: (s) => s
      .replace(/아토피(를)?\s*(치료|완화)(해요|합니다|돼요|됩니다)/g, "보습에 도움을 줄 수 있어요 — 아토피는 피부과 진료가 먼저예요")
      .replace(/여드름(을)?\s*(치료|제거)(해요|합니다|돼요|됩니다)/g, "인체세정용·관리 제품이에요 — 염증성 여드름은 진료 대상이에요")
      .replace(/탈모(를)?\s*(치료|개선)(해요|합니다|돼요|됩니다)|발모(돼요|됩니다)/g, "두피·모발 관리 제품이에요 — 탈모는 진료로 확인하셔야 해요")
      .replace(/(상처|흉터)(를)?\s*재생(시켜\s*드려요|해\s*드려요|됩니다|해요)/g, "보습·진정 관리 제품이에요")
      .replace(/완치(됩니다|돼요)?/g, "관리에 도움을 줄 수 있어요")
      .replace(/낫게\s*해\s*(드려요|줍니다)|낫습니다/g, "도움을 줄 수 있어요")
      .replace(/치료(해요|합니다|돼요|됩니다)/g, "관리에 도움을 줄 수 있어요"),
    need: SKIN_GUARD_TEXT.notDrug },

  /* ② 효능 단정 — "하얘진다"·"주름이 없어진다"는 기능성 표현이 아니다 */
  { id: "efficacy", law: "②효능 단정 금지", mode: "fix+append",
    detect: /(하얘(져요|집니다|진다)|미백(돼요|됩니다)|주름이\s*(없어|사라|펴)|모공이\s*(없어|사라)|확실히\s*좋아(져요|집니다)|즉시\s*효과)/,
    fix: (s) => s
      .replace(/하얘(져요|집니다|진다)|미백(돼요|됩니다)/g, "미백에 도움을 줄 수 있어요")
      .replace(/주름이\s*(없어져요|사라져요|펴져요|없어집니다)/g, "주름 개선에 도움을 줄 수 있어요")
      .replace(/모공이\s*(없어져요|사라져요)/g, "결 관리에 도움을 줄 수 있어요")
      .replace(/확실히\s*좋아(져요|집니다)|즉시\s*효과(가\s*있어요|예요)?/g, "사용감·효과는 사람마다 달라요"),
    need: SKIN_GUARD_TEXT.notDrug },

  /* ③ 기능성화장품 범위 — 심사·보고를 확인하지 못한 것에 기능성을 붙이지 않는다 */
  { id: "functionalScope", law: "③기능성화장품 범위 준수", mode: "fix+append",
    detect: /(리프팅\s*기능성|탄력\s*기능성|모공\s*기능성|기능성\s*화장품이라\s*(탄력|리프팅|모공))/,
    fix: (s) => s
      .replace(/(리프팅|탄력|모공)\s*기능성\s*(화장품)?/g, "제조사 표기 기준의 일반 화장품")
      .replace(/기능성\s*화장품이라\s*(탄력|리프팅|모공)(에)?\s*좋아요/g, "기능성화장품은 미백·주름 개선·자외선 차단 세 가지예요"),
    need: SKIN_GUARD_TEXT.functional },

  /* ④ 안전성 단정 — "부작용 없다"·"아기에게 안전"은 말할 수 없다 */
  { id: "safety", law: "④안전성 단정 금지", mode: "fix+append",
    detect: /(부작용(이)?\s*없(어요|습니다|는)|무해(해요|합니다)|누구나\s*안전|(아기|임산부)(에게도|에게|한테도|한테|도)?\s*안전|100%\s*안전)/,
    fix: (s) => s
      .replace(/부작용(이)?\s*없(어요|습니다)|무해(해요|합니다)|100%\s*안전(해요|합니다)?/g, "성분은 그대로 알려드릴게요 — 피부에 따라 반응이 다를 수 있어요")
      .replace(/누구나\s*안전(해요|합니다)?/g, "피부 타입에 따라 다를 수 있어요")
      .replace(/(아기|임산부)(에게도|에게|한테도|한테|도)?\s*안전(해요|합니다)?/g, "사용 전 성분을 확인하시고 걱정되시면 전문가와 상의하세요"),
    need: SKIN_GUARD_TEXT.patch },

  /* ⑤ 진단 금지 — 병명을 말하지 않는다(A1로 넘긴다) */
  { id: "diagnose", law: "⑤진단 금지", mode: "block", handback: "A1",
    detect: /(지루성\s*피부염이에요|아토피예요|아토피입니다|건선이에요|주사(피부염)?예요|이건\s*\w*염이에요|피부암이에요)/ },

  /* ⑥ 원가·마진 노출 금지 */
  { id: "cost", law: "⑥원가·마진율 노출 금지", mode: "strip",
    detect: /(원가율|공급\s*단가|매입가|수수료율|마진율)/ },

  /* ⑦ 공정 비교 — 단정·비방·자사 우대 금지 */
  { id: "superlative", law: "⑦공정 비교 — 단정 금지", mode: "fix+append",
    detect: /(제일\s*좋(은|아요|습니다)|최고(예요|입니다)|1위(예요|입니다)|무조건\s*이거|가장\s*좋은\s*제품)/,
    fix: (s) => s
      .replace(/제일\s*좋은\s*제품(이에요|입니다)?|가장\s*좋은\s*제품(이에요|입니다)?/g, "이 기준에서 유리한 제품")
      .replace(/제일\s*좋(아요|습니다)|최고(예요|입니다)/g, "이 기준에서는 유리해요")
      .replace(/1위(예요|입니다)?/g, "이 비교에서 상위")
      .replace(/무조건\s*이거(예요|로\s*하세요)?/g, "기준에 따라 달라져요"),
    need: SKIN_GUARD_TEXT.basis },
  { id: "disparage", law: "⑦공정 비교 — 비방 금지", mode: "fix",
    detect: /(타사\s*제품은\s*별로|싸구려|품질이\s*나빠|저질|형편없)/,
    fix: (s) => s.replace(/(타사\s*제품은\s*별로예요|싸구려예요|품질이\s*나빠요|저질이에요|형편없어요)/g, "제품마다 기준이 달라 수치로만 비교해 드릴게요") },
];

/* 효능성 어휘가 있는데 '의약품 아님' 고지가 없으면 부착 */
const SKIN_EFFICACY_MENTION = /(도움|개선|진정|보습|미백|주름|자외선\s*차단|기능성)/;

function skinGuard(lines, ctx) {
  const out = { lines: (lines || []).slice(), violations: [], blocked: false, handback: null };
  try {
    let joined = out.lines.join("\n");
    for (const r of SKIN_GUARD_RULES) {
      if (!r.detect.test(joined)) continue;
      out.violations.push({ id: r.id, law: r.law, mode: r.mode });
      if (r.mode === "block") { out.blocked = true; out.handback = r.handback || null; break; }
      if (r.mode === "strip") { out.lines = out.lines.filter((l) => !r.detect.test(l)); joined = out.lines.join("\n"); }
      if (r.fix) { out.lines = out.lines.map(r.fix); joined = out.lines.join("\n"); }
      if (r.need && joined.indexOf(r.need) < 0) { out.lines.push(r.need); joined = out.lines.join("\n"); }
    }
    if (out.blocked) { out.lines = [SKIN_GUARD_TEXT.safe]; return out; }
    if (SKIN_EFFICACY_MENTION.test(joined) && joined.indexOf("의약품이 아니") < 0) {
      out.lines.push(SKIN_GUARD_TEXT.notDrug);
      out.violations.push({ id: "notDrug-warn", law: "① 의약품 아님 고지 보강", mode: "append" });
    }
  } catch (e) {}
  return out;
}

try { if (typeof window !== "undefined") { window.__hifinSkinGuard = { check: skinGuard, rules: SKIN_GUARD_RULES, text: SKIN_GUARD_TEXT }; } } catch (e) {}
