/* ══════════════ A4 재가돌봄 가드 — 보호자를 위험하게 만들지 않는다 (Phase D) ══════════════
   헌법 6조
     ⓪**응급 지연 금지(최상위)** — 응급 징후 앞에서는 상담을 멈추고 119·진료를 먼저 안내한다.
     ①등급 판정 단정 금지(판정은 공단 등급판정위원회 소관)
     ②의료행위 판단·처방 금지(→A1)
     ③급여액·비용 확정 금지(한도액은 고시로 바뀐다)
     ④원가·수수료 노출 금지
     ⑤미제휴·미확인 기관 단정 금지(카탈로그 밖 발화 금지)
     ⑥보호자 죄책감 유발·강권 금지

   처리 원칙은 A2·A3와 같다 — **단정은 치환한다. 문구 부착만으로는 단정이 지워지지 않는다.**
   다만 ⓪는 예외: 치환이 아니라 **응급 안내를 응답 맨 앞에 강제 삽입**한다(뒤에 붙이면 못 보고 지나친다). */

const HC_GUARD_TEXT = {
  gradeAuthority: "※ 등급은 공단 등급판정위원회가 방문조사와 의사소견서를 보고 정해요 — 제가 미리 확정해 드릴 수는 없어요.",
  costVary: "※ 월 한도액은 해마다 고시로 바뀌고 감경 여부에 따라 달라져요 — 정확한 금액은 공단(1577-1000)이나 인정서로 확인해 주세요.",
  facility: "※ 기관 정보는 예시 데이터예요 — 실제 정원·인력·평가등급은 공단 기관검색(longtermcare.or.kr)에서 확인해 주세요.",
  medical: "※ 증상·수치 판단은 제가 할 수 있는 영역이 아니에요 — 의료진에게 보여드리는 게 맞아요.",
  safe: "이 부분은 제가 단정해서 말씀드리면 안 되는 영역이에요 — 확인된 제도 내용과 절차까지만 안내해 드릴게요.",
};

const HC_GUARD_RULES = [
  { id: "gradeAssert", law: "①등급 판정 단정 금지", mode: "fix+append",
    detect: /(\d\s*등급(이에요|입니다|예요|이세요|나옵니다|나와요|받으실\s*수\s*있어요|확실)|등급\s*(나옵니다|나와요|받으십니다)|인지지원등급(이에요|입니다|예요))/,
    fix: (s) => s
      .replace(/(\d\s*등급|인지지원등급)(이에요|입니다|예요|이세요)/g, "$1에 해당하는지는 판정을 받아봐야 알 수 있어요")
      .replace(/등급(이|가)?\s*(나옵니다|나와요|받으십니다)/g, "등급 판정을 신청해 보실 수 있어요")
      .replace(/등급\s*받으실\s*수\s*있어요/g, "등급 판정을 신청해 보실 수 있어요")
      .replace(/등급이\s*확실해요/g, "판정 결과를 기다려 보셔야 해요"),
    need: HC_GUARD_TEXT.gradeAuthority },
  { id: "medical", law: "②의료행위 판단·처방 금지", mode: "block", handback: "A1",
    /* 받침 유무로 어미가 갈린다 — "골절이에요"/"치매예요" 둘 다 잡아야 한다(어느 한쪽만 넣으면 그대로 새어 나간다) */
    detect: /((치매|뇌졸중|골절|폐렴|욕창|섬망|파킨슨)\s*(입니다|이에요|예요|이네요|네요|맞아요|맞습니다)|약을\s*(줄이|늘리|끊)(세요|시면)|용량을\s*조절하세요|입원하셔야\s*합니다|수술하셔야)/ },
  { id: "costAssert", law: "③급여액·비용 확정 금지", mode: "fix+append",
    detect: /(월\s*한도액은\s*\d|한\s*달에\s*\d+만\s*원(이에요|입니다|예요|만\s*내)|본인부담(금)?은\s*\d+만\s*원(이에요|입니다)|무료예요|공짜)/,
    fix: (s) => s
      .replace(/월\s*한도액은\s*([\d,]+)\s*원(이에요|입니다)?/g, "월 한도액은 등급·연도에 따라 달라서 공단에서 확인이 필요해요")
      /* 금액 단정은 어미가 여러 갈래다 — "…원이에요"만 치환하면 "…원만 내시면 돼요"가 그대로 남는다(Phase B 교훈) */
      .replace(/한\s*달에\s*[\d,]+\s*만?\s*원\s*만?\s*(내시면|부담하시면|드시면)\s*(돼요|됩니다|되세요)/g, "한 달 비용은 이용량과 감경 여부에 따라 달라져요")
      .replace(/한\s*달에\s*([\d,]+)\s*만\s*원(이에요|입니다|예요)/g, "한 달 비용은 이용량과 감경 여부에 따라 달라져요")
      .replace(/본인부담(금)?은\s*([\d,]+)\s*만\s*원(이에요|입니다)/g, "본인부담은 이용한 금액의 비율로 정해져요")
      .replace(/무료예요|공짜예요|공짜입니다/g, "본인부담이 면제되는 대상이 따로 있어요"),
    need: HC_GUARD_TEXT.costVary },
  { id: "cost", law: "④원가·수수료 노출 금지", mode: "strip",
    detect: /(원가율|공급\s*단가|매입가|수수료율|마진율|송객\s*수수료|CAC)/ },
  { id: "facilityAssert", law: "⑤미확인 기관 단정 금지", mode: "fix+append",
    detect: /(제휴\s*기관이에요|평가등급\s*[A-Z]등급이에요|정원이\s*\d+명이에요|여기가\s*제일\s*좋|이\s*기관을\s*추천드려요)/,
    fix: (s) => s
      .replace(/제휴\s*기관이에요/g, "예시 데이터에 등록된 기관이에요")
      .replace(/평가등급\s*([A-Z])등급이에요/g, "평가등급은 공단 기관검색에서 확인하실 수 있어요")
      .replace(/정원이\s*(\d+)명이에요/g, "정원은 공단 기관검색에서 확인하실 수 있어요")
      .replace(/여기가\s*제일\s*좋(아요|습니다)|이\s*기관을\s*추천드려요/g, "조건에 맞는 기관을 같은 기준으로 보여드릴게요"),
    need: HC_GUARD_TEXT.facility },
  { id: "guilt", law: "⑥보호자 죄책감 유발·강권 금지", mode: "fix",
    detect: /(진작\s*(하셨어야|했어야)|왜\s*이제\s*(오|와)|늦으셨(어요|네요)|불효|당연히\s*하셔야|안\s*하시면\s*안\s*돼요|반드시\s*맡기세요)/,
    fix: (s) => s
      .replace(/진작\s*(하셨어야죠|했어야죠|하셨어야\s*해요)/g, "지금부터 준비하셔도 늦지 않아요")
      .replace(/왜\s*이제\s*(오셨어요|왔어요|오셨나요)/g, "지금 알아보러 오신 것만으로 충분해요")
      .replace(/늦으셨어요|늦으셨네요/g, "지금 시작하셔도 괜찮아요")
      .replace(/불효(예요|입니다)/g, "누구나 겪는 어려움이에요")
      .replace(/당연히\s*하셔야죠|안\s*하시면\s*안\s*돼요|반드시\s*맡기세요/g, "선택은 가족분들이 하시면 돼요") },
];

/* ⓪ 응급 트리아지 — 상담보다 먼저. 가드가 아니라 '차단기'다.
   두 갈래로 읽는다.
     ① 말 — 보호자가 쓴 표현("쓰러지셨어요")
     ② 데이터 — 원격 모니터링이 잡은 수치(rpmState)
   ②가 필요한 이유: 보호자는 위험을 **모르고 물을 수 있다.** 새벽에 혈압이 급등한 줄 모르고
   "방문요양 알아봐 줘"라고만 물으면, 말만 읽는 트리아지는 그냥 지나친다. */
function hcTriage(question, ctx) {
  const q = String(question || "");
  let byWord = null;
  try {
    if (typeof LTC_EMERGENCY !== "undefined") {
      for (const w of LTC_EMERGENCY.critical) { if (q.indexOf(w) >= 0) { byWord = { level: "critical", hit: w, via: "말" }; break; } }
      if (!byWord) for (const w of LTC_EMERGENCY.urgent) { if (q.indexOf(w) >= 0) { byWord = { level: "urgent", hit: w, via: "말" }; break; } }
    }
  } catch (e) {}
  let byData = null;
  try {
    const rpm = (ctx && ctx.rpm) || null;
    if (rpm && rpm.level) byData = { level: rpm.level, hit: (rpm.reasons || [])[0] || "원격 모니터링 이상 신호", via: "측정", rpm: rpm };
  } catch (e) {}
  if (!byWord) return byData;
  if (!byData) return byWord;
  /* 둘 다 걸리면 높은 쪽을 따른다 — 낮춰 잡는 실수는 되돌릴 수 없다 */
  const win = byWord.level === "critical" || byData.level !== "critical" ? byWord : byData;
  return Object.assign({}, win, { rpm: byData.rpm, both: true });
}

/* 응급 안내 — 응답 **맨 앞**에 넣는다(뒤에 붙이면 스크롤 밖으로 밀려 못 본다) */
function hcEmergencyLines(level) {
  try {
    if (typeof LTC_EMERGENCY === "undefined") return [];
    if (level === "critical") return [LTC_EMERGENCY.line119, LTC_EMERGENCY.lineWhat];
    return [LTC_EMERGENCY.lineUrgent];
  } catch (e) { return []; }
}

function homecareGuard(lines, ctx) {
  ctx = ctx || {};
  const out = { lines: (lines || []).slice(), violations: [], blocked: false, handback: null, emergency: null };
  try {
    /* ⓪ 최상위 — 응급이면 안내를 맨 앞에 강제 삽입(상담 내용은 뒤에 남긴다: 보호자가 다음 단계를 잃지 않도록) */
    const tri = ctx.triage || null;
    if (tri) {
      const head = hcEmergencyLines(tri.level);
      out.lines = head.concat(out.lines.filter(function (l) { return head.indexOf(l) < 0; }));
      out.emergency = tri.level;
      out.violations.push({ id: "emergency", law: "⓪응급 우선 안내", mode: "prepend" });
    }
    let joined = out.lines.join("\n");
    for (const r of HC_GUARD_RULES) {
      if (!r.detect.test(joined)) continue;
      out.violations.push({ id: r.id, law: r.law, mode: r.mode });
      if (r.mode === "block") { out.blocked = true; out.handback = r.handback || null; break; }
      if (r.mode === "strip") { out.lines = out.lines.filter((l) => !r.detect.test(l)); joined = out.lines.join("\n"); }
      if (r.fix) { out.lines = out.lines.map(r.fix); joined = out.lines.join("\n"); }
      if (r.need && joined.indexOf(r.need) < 0) { out.lines.push(r.need); joined = out.lines.join("\n"); }
    }
    if (out.blocked) {
      /* 진단 단정이라도 응급 안내는 살린다 — 차단이 안전을 지우면 안 된다 */
      const head = tri ? hcEmergencyLines(tri.level) : [];
      out.lines = head.concat([HC_GUARD_TEXT.safe]);
      return out;
    }
  } catch (e) {}
  return out;
}

function hcGuardLog(q, v) {
  try {
    if (!v || !v.length) return;
    const k = "hifin_hc_guard";
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ q: String(q || "").slice(0, 60), ids: v.map((x) => x.id), ts: Date.now() });
    localStorage.setItem(k, JSON.stringify(l.slice(-200)));
  } catch (e) {}
}

try { if (typeof window !== "undefined") { window.__hifinHcGuard = { check: homecareGuard, triage: hcTriage, rules: HC_GUARD_RULES, text: HC_GUARD_TEXT }; } } catch (e) {}
