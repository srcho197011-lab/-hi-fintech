/* ══════════════ A3 표시·광고 가드 — 건강기능식품·의료기기의 '말하면 안 되는 것'(Phase C) ══════════════
   헌법 6조
     ①효과 단정 금지  ②의약품 대체 암시 금지  ③진단·처방 금지(→A1)
     ④원가·마진율 노출 금지  ⑤카탈로그 밖 발화 금지  ⑥공정 비교 의무(기준 명시·단정 금지·비방 금지·자사 우대 금지)
   처리: 단정 표현은 **치환**(문구 부착만으로는 단정이 지워지지 않는다 — A2에서 얻은 교훈), 필수 고지는 부착, 진단은 차단.
   ⚠️ A3의 모든 응답이 통과해야 하는 마지막 관문. */

const SHOP_GUARD_TEXT = {
  notDrug: "※ 건강기능식품은 질병의 치료·예방을 위한 의약품이 아니에요.",
  withDoctor: "※ 복용 중인 약이 있으면 임의로 바꾸지 마시고 반드시 의사·약사와 상의하세요.",
  basis: "※ 비교는 표시된 기준(1일 단가·성분 함량)으로만 했고, 어떤 제품이 더 낫다고 단정하지 않아요.",
  safe: "이 부분은 제가 단정해서 말씀드리면 안 되는 영역이에요 — 확인된 제품 정보와 비교 기준까지만 안내해 드릴게요.",
};

const SHOP_GUARD_RULES = [
  { id: "efficacy", law: "①효과 단정 금지", mode: "fix+append",
    detect: /(치료(가\s*)?(돼|된다|됩니다|해요)|완치|낫습니다|낫아요|나아요|없어집니다|없어져요|예방(합니다|돼요|됩니다)|고칠\s*수|효과가\s*확실)/,
    fix: (s) => s
      .replace(/치료가\s*(돼요|된다|됩니다|되요)|치료해요|치료됩니다/g, "관리에 도움을 줄 수 있어요")
      .replace(/완치(됩니다|돼요|가\s*돼요)?/g, "관리에 도움을 줄 수 있어요")
      .replace(/낫습니다|낫아요|나아요|고칠\s*수\s*있어요/g, "도움을 줄 수 있어요")
      .replace(/없어집니다|없어져요/g, "개선에 도움을 줄 수 있어요")
      .replace(/예방(합니다|돼요|됩니다)/g, "관리에 도움을 줄 수 있어요")
      .replace(/효과가\s*확실(해요|합니다)/g, "인정된 기능성 범위에서 도움을 줄 수 있어요"),
    need: SHOP_GUARD_TEXT.notDrug },
  { id: "drugReplace", law: "②의약품 대체 암시 금지", mode: "fix+append",
    detect: /(약\s*대신|약을\s*끊|약\s*안\s*먹어도|처방약\s*대체|약보다\s*낫)/,
    fix: (s) => s
      .replace(/약\s*대신(에)?/g, "약과 별개로")
      .replace(/약을\s*끊(고|어도|으셔도)/g, "복약은 유지하시면서")
      .replace(/약\s*안\s*먹어도\s*(돼요|됩니다)/g, "복약 여부는 의사와 상의가 필요해요")
      .replace(/처방약\s*대체(해요|합니다)?/g, "처방약을 대체하지 않아요")
      .replace(/약보다\s*낫(아요|습니다)/g, "약과 역할이 달라요"),
    need: SHOP_GUARD_TEXT.withDoctor },
  { id: "diagnose", law: "③진단·처방 금지", mode: "block", handback: "A1",
    detect: /(당뇨입니다|고혈압입니다|암입니다|진단입니다|이\s*병이에요|하루\s*\d+\s*(정|알|캡슐)\s*(드세요|복용하세요))/ },
  { id: "cost", law: "④원가·마진율 노출 금지", mode: "strip",
    detect: /(원가율|공급\s*단가|매입가|수수료율|마진율|SC_COSTRATE)/ },
  { id: "superlative", law: "⑥공정 비교 — 단정 금지", mode: "fix+append",
    detect: /(제일\s*좋(은|아요|습니다)|최고(예요|입니다|의\s*제품)|1위|무조건\s*이거|가장\s*좋은\s*제품|베스트\s*원)/,
    fix: (s) => s
      .replace(/제일\s*좋은\s*제품(이에요|입니다)?|가장\s*좋은\s*제품(이에요|입니다)?/g, "이 기준에서 유리한 제품")
      .replace(/제일\s*좋(아요|습니다)|최고(예요|입니다)/g, "이 기준에서는 유리해요")
      .replace(/1위(예요|입니다)?|베스트\s*원/g, "이 비교에서 상위")
      .replace(/무조건\s*이거(예요|로\s*하세요)?/g, "기준에 따라 달라져요"),
    need: SHOP_GUARD_TEXT.basis },
  { id: "disparage", law: "⑥공정 비교 — 비방 금지", mode: "fix",
    detect: /(타사\s*제품은\s*별로|그건\s*싸구려|品質이\s*나빠|품질이\s*나빠요|저질|형편없)/,
    fix: (s) => s.replace(/(타사\s*제품은\s*별로예요|그건\s*싸구려예요|품질이\s*나빠요|저질이에요|형편없어요)/g, "제품마다 기준이 달라 수치로만 비교해 드릴게요") },
  { id: "selfPromote", law: "⑥공정 비교 — 자사 우대 금지", mode: "fix",
    detect: /(하이핀\s*제품이\s*제일|우리\s*제품이\s*(제일|더)\s*좋|하이핀\s*거\s*사세요)/,
    fix: (s) => s.replace(/(하이핀\s*제품이\s*제일\s*좋아요|우리\s*제품이\s*제일\s*좋아요|우리\s*제품이\s*더\s*좋아요|하이핀\s*거\s*사세요)/g, "하이핀 제품과 시장 제품을 같은 기준으로 함께 비교해 드릴게요") },
];

/* 효능을 언급했는데 '의약품 아님' 고지가 없으면 부착(①·② 보강) */
const SHOP_EFFICACY_MENTION = /(도움|개선|기능성|건강에|관리에|효능|효과)/;

function shoppingGuard(lines, ctx) {
  const out = { lines: (lines || []).slice(), violations: [], blocked: false, handback: null };
  try {
    let joined = out.lines.join("\n");
    for (const r of SHOP_GUARD_RULES) {
      if (!r.detect.test(joined)) continue;
      out.violations.push({ id: r.id, law: r.law, mode: r.mode });
      if (r.mode === "block") { out.blocked = true; out.handback = r.handback || null; break; }
      if (r.mode === "strip") { out.lines = out.lines.filter((l) => !r.detect.test(l)); joined = out.lines.join("\n"); }
      if (r.fix) { out.lines = out.lines.map(r.fix); joined = out.lines.join("\n"); }
      if (r.need && joined.indexOf(r.need) < 0) { out.lines.push(r.need); joined = out.lines.join("\n"); }
    }
    if (out.blocked) { out.lines = [SHOP_GUARD_TEXT.safe]; return out; }
    /* 효능 언급 시 의약품 아님 고지 필수 */
    if (SHOP_EFFICACY_MENTION.test(joined) && joined.indexOf("의약품이 아니") < 0) {
      out.lines.push(SHOP_GUARD_TEXT.notDrug);
      out.violations.push({ id: "notDrug-warn", law: "① 의약품 아님 고지 보강", mode: "append" });
    }
  } catch (e) {}
  return out;
}

function shopGuardLog(q, v) {
  try {
    if (!v || !v.length) return;
    const k = "hifin_shop_guard";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(q || "").slice(0, 60), ids: v.map((x) => x.id), ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}

try { if (typeof window !== "undefined") { window.__hifinShopGuard = { check: shoppingGuard, rules: SHOP_GUARD_RULES, text: SHOP_GUARD_TEXT }; } } catch (e) {}
