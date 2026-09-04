/* ══════════════ 하이프로(hiProAgent.js) — 2단계 v1.4 축⑤ P6 (형 승인 2026-08-30) ══════════════
   프로 전용 에이전트 — A5 「코치」의 승격·개명(에이전트 중복 신설 금지). 프로가 궁금한 것과
   회원 상담 중 필요한 것에 그 자리에서 답한다. 카드 문맥이 있으면 자동 주입(coachAnswer 재사용).
   ⚠️ 헌법:
     · 새 문장 금지 — 답은 기존 단일 소스(단계 가이드·등급 메타·임계 라벨·개입·대본 블록·결과 코드·
       활동 매핑·니즈 통계·화면 인벤토리)의 조립. 연결어만 허용, 값은 전부 원천에서.
     · 의학 판정 금지(임계는 '기준 설명'만) · 상품 권유 답변 금지(§0-A) · 두 곡선 질문은 3단 고정(§0-P).
     · 원천이 없으면 지어내지 않는다 — "그건 아직 제 사전에 없어요" + 하이(운영) 문의 안내. */

/* ── 분류 사전(8카테고리) — 러너 코퍼스 생성과 공유(단일 소스) ── */
const HIPRO_CATS = [
  { cat: "stage",  ko: "제도·단계", pats: [/([DL][1-8])\s*(가|이|는|란|단계)?\s*(뭐|무엇|설명|알려)/, /단계.*(뭐|설명|가이드)/, /정체.*(면|일 때|어떻게)/, /락(이|은|이란|을|의|상태)?\s*(뭐|뭔|풀|해제|언제)/, /접촉\s*금지/, /다음\s*단계/] },
  { cat: "card",   ko: "카드 문맥", pats: [/왜\s*(이|이런)?\s*(지시|카드|연락)/, /뭐라고?\s*(시작|먼저)/, /첫\s*마디|오프닝/, /거절(하|이)?면/, /심각(하냐|한\s*거)냐?고/, /문자(로는|로|는)?\s*뭐/, /언제까지|기한/, /다음(은|엔)?\s*(뭐|어떻)/] },
  { cat: "clinical", ko: "임상 기준", pats: [/(혈압|혈당|공복혈당|당화혈색소|콜레스테롤|중성지방|간수치|AST|ALT|감마|크레아티닌|BMI|허리둘레|요산|TSH)\s*.*(기준|주의|위험|얼마|수치|구간)/i, /주의\s*구간.*(기준|뜻)/, /위험\s*구간.*(기준|뜻)/] },
  { cat: "curves", ko: "두 곡선 응답법", pats: [/회원이.*(비용|치료비|돈|얼마).*(물으면|질문|하면)/, /대비\s*현황.*(물으면|설명|답)/, /니즈.*(어떻게|답)/, /(생활비|준비금).*(물으면|설명)/] },
  { cat: "cost",   ko: "치료비·보장 기초", pats: [/실손\s*([1-5]세대)?.*(자기\s*부담|보장|차이|뭐)/, /본인\s*부담.*(뭐|얼마|계산)/, /진단금.*(뭐|평균|얼마)/, /치료비.*(구조|어떻게|준비)/] },
  { cat: "script", ko: "대본 찾기", pats: [/(거절|보류|수락|가족|바쁘|두려|무서|보험\s*질문|비용\s*질문).*(대본|응대|뭐라|문안)/, /대본.*(찾|보여|알려)/, /쉬운말.*(대본|버전)/] },
  { cat: "system", ko: "시스템 사용법", pats: [/(결과|기록).*(어디|어떻게)\s*(남|해|기록)/, /어디서\s*(봐|해|확인)/, /(관제탑|통합\s*운영|백업|카탈로그|지시서).*(어디|어떻게|뭐)/, /화면.*(어디|찾)/] },
  { cat: "video",  ko: "영상 상담", pats: [/영상\s*(상담|통화|연결)/, /(화상|카메라)\s*(상담|통화|켜|꺼)/, /녹화/, /(영상|화상).*(왜|안\s*되|못\s*해|불가)/, /화면\s*공유/, /(함께|같이)\s*보(는|기)/, /개입\s*발행/, /(진료|원격진료)\s*완결/, /영상\s*권장/] },
  { cat: "cycle",  ko: "60일 사이클·만기", pats: [/T[0-8]\s*(가|이|는|란|시점)?\s*(뭐|무엇|설명|알려|언제)/i, /(사이클|60일).*(뭐|무엇|설명|알려)/, /(만기|D-\s*\d+).*(뭐|언제|어떻게|하면|되면)/, /(보장맵|보장\s*맵).*(뭐|어떻게|누가|만들)/, /무인\s*(분석|보장분석)/, /승환.*(뭐|창|기간)/, /(세그먼트|G(?:1[0-4]|[1-9])[ab]?)\s*(가|이|는|이란)?\s*(뭐|무엇|설명)/i, /(제공\s*DB|제공\s*필드|현대해상.*(주는|제공))/, /2차\s*골든/] },
  { cat: "role",   ko: "역할·케어 플랜", pats: [/([DL][1-8]|첫\s*통화|첫\s*상담).*(역할|뭘\s*해|뭘\s*제안|어떻게\s*해)/, /케어\s*플랜.*(뭐|어떻게|조합)/, /(도구|영양제|식단|기기).*(언제|어떤\s*회원)/, /골든\s*타임/, /(3종|삼종).*(뭐|안내|말|전해|설명)/, /케어\s*키트/] },
];
/* 지표 별칭(프로 현장 표현 포함) — clinical·care 공용 */
const HIPRO_LAB = { "혈압": "sbp", "수축기": "sbp", "이완기": "dbp", "공복혈당": "fbs", "혈당": "fbs", "당화혈색소": "hba1c",
  "콜레스테롤": "tc", "LDL": "ldl", "HDL": "hdl", "중성지방": "tg", "간수치": "ast", "AST": "ast", "GOT": "ast",
  "ALT": "alt", "GPT": "alt", "감마지피티": "ggtp", "감마GTP": "ggtp", "GGT": "ggtp", "감마": "ggtp",
  "크레아티닌": "cr", "eGFR": "egfr", "사구체": "egfr", "혈색소": "hb", "빈혈수치": "hb", "BMI": "bmi", "체질량": "bmi",
  "허리둘레": "waist", "요산": "ua", "TSH": "tsh", "갑상선수치": "tsh" };
function _hiproDzKey(t) {   /* 질환명 최장 일치(disease_care 197키) */
  try {
    if (typeof _DZCARE === "undefined" || !_DZCARE) return null;
    const hit = Object.keys(_DZCARE).filter((k) => k.length >= 2 && t.indexOf(k) >= 0).sort((a, b2) => b2.length - a.length)[0];
    return hit || null;
  } catch (e) { return null; }
}
/* 직전 care 질환 — "관련 영양소는?" 같은 후속 질문의 맥락(같은 대화 안에서만) */
let _hiproLastDz = null;
const _HIPRO_FOLLOW = /(영양소|영양성분|영양제|보충제|식단|음식|먹|운동|기기|피해야|주의할|생활\s*습관)/;
/* 용어 정의 사전 — 답변 안에 등장하는 전문 용어("DASH가 뭐야?"). 정의도 원천 표기 필수(형 검수 대상) */
const HIPRO_TERMS = [
  { k: "DASH", ko: "대시 식단", def: "Dietary Approaches to Stop Hypertension — '고혈압을 멈추는 식사법'이에요. 소금(나트륨)을 줄이고 채소·과일·통곡물·저지방 유제품처럼 칼륨·마그네슘·식이섬유가 풍부한 음식 위주로 먹는 식단이에요.", src: "미국 NIH/NHLBI" },
  { k: "저염식", ko: "저염식", def: "소금을 하루 5g(나트륨 2g) 미만으로 줄인 식사예요 — WHO 권고 기준.", src: "WHO" },
  { k: "CBT-I", ko: "불면증 인지행동치료", def: "약 없이 수면 습관과 잠에 대한 생각을 바꿔 만성 불면을 치료하는 방법 — 만성 불면증의 1차 권장 치료예요.", src: "AASM/대한수면학회" },
  { k: "유산소 운동", ko: "유산소 운동", def: "걷기·자전거·수영처럼 숨이 약간 찰 정도로 계속하는 운동이에요. 주 150분 이상이 표준 권고예요.", src: "WHO 신체활동 지침" },
  { k: "근력운동", ko: "근력운동", def: "밴드·스쿼트·아령처럼 근육에 힘을 주는 운동이에요. 주 2회 이상이 권고예요.", src: "WHO 신체활동 지침" },
  { k: "혈당지수", ko: "혈당지수(GI)", def: "먹은 뒤 혈당을 얼마나 빨리 올리는지 나타내는 지수예요 — 낮을수록 혈당 관리에 유리해요.", src: "미국당뇨병학회(ADA)" },
  { k: "지중해식", ko: "지중해식 식단", def: "채소·과일·통곡물·올리브유·생선 위주로 먹고 붉은 고기·가공식품을 줄이는 식사법이에요 — 심혈관·간 건강 연구 근거가 많아요.", src: "AHA/EASL" },
  /* 관리 조합(MA_MAP)에 등장하는 영양 항목 — 답변 속 단어는 전부 물어볼 수 있어야 한다 */
  { k: "밀크시슬", ko: "밀크시슬", def: "엉겅퀴 씨앗(실리마린) 추출 영양제 — 간 건강 보조로 널리 쓰여요. 치료 효과의 근거는 제한적이라 '보조'로만 보세요.", src: "미국 NCCIH" },
  { k: "오메가3", ko: "오메가-3", def: "생선기름의 EPA·DHA 지방산이에요 — 중성지방을 낮추는 근거가 있어요.", src: "NIH ODS" },
  { k: "코엔자임", ko: "코엔자임Q10", def: "세포가 에너지를 만들 때 쓰는 물질을 담은 영양제 — 심혈관 보조로 연구되고 있어요(근거는 혼재).", src: "NIH ODS" },
];
/* 용어 질문("X가 뭐야/무슨 뜻") 추출 — 다른 카테고리 사전이 전부 우선하고, 마지막에만 판정 */
function _hiproTermOf(t) {
  const m = String(t).match(/^(.{1,24}?)(이|가|은|는|이란|란)?\s*(뭐야|뭐예요|뭐에요|뭔가요|뭐지|무슨\s*뜻|뜻이\s*뭐)/);
  if (!m) return null;
  const phrase = m[1].trim();
  if (!phrase) return null;
  /* 질환명 자체를 물으면 용어가 아니라 질환 요점 응답으로(기존 경로) */
  if (_hiproDzKey(phrase)) return { hit: "disease", dz: _hiproDzKey(phrase) };
  const up = phrase.toUpperCase();
  for (const d of HIPRO_TERMS) if (up.indexOf(d.k.toUpperCase()) >= 0) return { hit: "dict", term: d, phrase: phrase };
  /* 정의문 안에 등장하는 단어(예: 실리마린)도 그 정의로 답한다 — 답변 속 단어는 전부 물어볼 수 있어야 */
  const lastTok = phrase.split(/[\s,—-]+/).pop();
  for (const d of HIPRO_TERMS) if (lastTok.length >= 3 && d.def.toUpperCase().indexOf(lastTok.toUpperCase()) >= 0) return { hit: "dict", term: d, phrase: phrase };
  /* 사전에 없으면 197질환 원천에서 용어가 등장하는 문장을 찾는다(맥락 질환 우선) — 지어내지 않음 */
  try {
    if (typeof _DZCARE !== "undefined" && _DZCARE) {
      const scan = (dz) => {
        const e = _DZCARE[dz]; if (!e) return null;
        const cand = [];
        if (e.diet && e.diet.principle) cand.push({ s: e.diet.principle, f: "식단 원칙" });
        for (const l of e.lifestyle || []) if (l.tip) cand.push({ s: l.tip, f: "생활수칙", ref: l.source });
        for (const x of (e.supplements_recommended || []).concat(e.supplements_avoid || [])) if (x.name) cand.push({ s: x.name + " — " + (x.reason || ""), f: "영양", ref: x.source });
        for (const x of e.devices || []) if (x.name) cand.push({ s: x.name + " — " + (x.use || ""), f: "기기" });
        /* 접두 변형("저기 DASH가 뭐야")을 견디도록 전체구·마지막 어절 둘 다 시도 */
        const cands2 = [up]; const lastTok = up.split(/[\s,—-]+/).pop(); if (lastTok && lastTok !== up) cands2.push(lastTok);
        for (const c of cand) for (const u of cands2) if (u.length >= 2 && c.s.toUpperCase().indexOf(u) >= 0) return { dz: dz, field: c.f, sent: c.s, ref: c.ref };
        return null;
      };
      const order = _hiproLastDz ? [_hiproLastDz].concat(Object.keys(_DZCARE).filter((k) => k !== _hiproLastDz)) : Object.keys(_DZCARE);
      for (const dz of order) { const hit = scan(dz); if (hit) return { hit: "source", found: hit, phrase: phrase }; }
    }
  } catch (e) {}
  return null;
}
function hiproClassify(q) {
  const t = String(q || "").trim();
  /* ⑨ 질병·건강관리 상담(형 지시 2026-08-30) — 질환명 or 지표+상담 의도. 임상 '기준' 질문보다 앞서 판정 */
  const careIntent = /(관리|방법|식단|운동|영양소|영양성분|영양제|보충제|생활|습관|주의|조심|좋은|나쁜|피해야|뭐라고|어떻게\s*말|말해|설명해|알려)/.test(t);
  if (careIntent) {
    if (_hiproDzKey(t)) return "care";
    for (const ko in HIPRO_LAB) if (t.toUpperCase().indexOf(ko.toUpperCase()) >= 0 && !/(기준|구간|수치가\s*뭐)/.test(t)) return "care";
  }
  for (const c of HIPRO_CATS) for (const p of c.pats) if (p.test(t)) return c.cat;
  /* 카드 문맥 질문은 코치 사전(COACH_QTYPES)을 재사용 — 사전 이원화 금지 */
  try { if (typeof coachQType === "function" && coachQType(t)) return "card"; } catch (e) {}
  /* 용어 질문 — 답변에 나온 단어("DASH가 뭐야")를 정의 사전·원천 문장으로 되찾기(타 카테고리보다 뒤) */
  if (_hiproTermOf(t)) return "care";
  /* 후속 맥락 폴백 — 어떤 사전에도 안 걸리고, 직전에 질환 상담이 있었고, 이어 묻는 어휘일 때만(다른 카테고리보다 뒤) */
  if (_hiproLastDz && _HIPRO_FOLLOW.test(t)) return "care";
  return null;
}

/* ── 원천 조립 응답 — {cat, src, text, refs[]} · 값은 전부 원천, 문장은 접합 ── */
function hiproAnswer(q, ctx) {
  const cat = hiproClassify(q);
  const t = String(q || "");
  const R = (src, text, refs) => ({ cat: cat, src: src, text: text, refs: refs || [], label: "하이프로" });
  try {
    if (cat === "card") {
      if (ctx && ctx.card) {
        const a = coachAnswer(ctx.card, q);
        if (a) return R(a.source + ":" + a.id, a.text, ["카드 " + ctx.card.member.mask]);
      }
      return R("card:noctx", "그건 회원 카드를 보면서 답해드릴 수 있어요 — ⓪ 오늘의 지시서에서 카드를 연 상태로 물어봐 주세요.", ["coachAnswer"]);
    }
    /* ⑨ 질병·건강관리 상담 — 원천: disease_care.json(197질환·출처 동반) + MA_MAP + co-* 블록.
       응답 2부: 프로 브리핑(요점) + 회원용 스크립트(cs-* 승인 템플릿에 원천 값 치환) */
    if (cat === "care") {
      /* 용어 되찾기 우선 — "DASH가 뭐야"는 식단 상담이 아니라 단어 뜻 질문 */
      const term = _hiproTermOf(t);
      if (term && term.hit === "dict") {
        const d = term.term;
        return R("care:term:" + d.k, "[" + d.ko + "] " + d.def + " (출처: " + d.src + ")", ["용어사전." + d.k, d.src]);
      }
      if (term && term.hit === "source") {
        const f = term.found;
        return R("care:term:" + f.dz, "원천에는 이렇게 나와요 — " + f.dz + " " + f.field + ": " + String(f.sent).slice(0, 220) + (f.ref ? " (출처: " + f.ref + ")" : ""), ["disease_care." + f.dz]);
      }
      let dz = _hiproDzKey(t);
      /* 지표 어휘가 없고 질환명도 없으면 직전 질환의 후속 질문으로 본다(맥락) */
      let labKo = null; for (const ko in HIPRO_LAB) if (t.toUpperCase().indexOf(ko.toUpperCase()) >= 0) { labKo = ko; break; }
      if (!dz && !labKo && _hiproLastDz) dz = _hiproLastDz;
      if (dz) _hiproLastDz = dz;
      /* 치환 유틸 — ①슬롯 뒤 조사는 값의 받침에 맞춰 교정(새 문장 아님·조사 선택만) ②원칙은 명사구까지만 */
      const _batchim = (v) => { const s3 = String(v).replace(/[^가-힣]+$/, ""); const c = s3.charCodeAt(s3.length - 1); return c >= 0xAC00 && c <= 0xD7A3 ? { ok: true, has: (c - 0xAC00) % 28 > 0 } : { ok: false }; };
      const _JOSA = { 이에요: ["이에요", "예요"], 예요: ["이에요", "예요"], 은: ["은", "는"], 는: ["은", "는"], 이: ["이", "가"], 가: ["이", "가"], 을: ["을", "를"], 를: ["을", "를"] };
      const fill = (id, slots) => {
        const b2 = hmBlock(id); if (!b2) return "";
        return String(b2.t).replace(/\{([가-힣A-Za-z0-9]+)\}(이에요|예요|은|는|이|가|을|를)?/g, (m, k, j) => {
          if (slots[k] == null) return m;
          const v = String(slots[k]);
          if (!j) return v;
          const bt = _batchim(v);
          return v + (bt.ok ? _JOSA[j][bt.has ? 0 : 1] : j);
        });
      };
      const cutNoun = (p) => { const s3 = String(p).replace(/\(.*?\)/g, "").trim(); const m2 = s3.match(/^(.{2,24}?)(이|가|은|는|을|를)\s/); return m2 ? m2[1] : s3.split(/[-.,·]/)[0].trim().slice(0, 24); };
      if (dz && typeof _DZCARE !== "undefined" && _DZCARE[dz]) {
        const e = _DZCARE[dz];
        const life = (e.lifestyle || []).map((l) => l.tip).filter(Boolean);
        const rec = (e.supplements_recommended || []).map((x) => x.name).slice(0, 3);
        const avo = (e.supplements_avoid || []).map((x) => x.name).slice(0, 2);
        const dev = (e.devices || []).map((x) => x.name).slice(0, 2);
        const dietR = (e.diet && e.diet.recommend || []).slice(0, 3), dietA = (e.diet && e.diet.avoid || []).slice(0, 2);
        const principle = (e.diet && e.diet.principle) || (life[0] || "생활 관리");
        const slots = { 질환명: dz, 원칙: cutNoun(principle),
          권장식: dietR.join("·") || "균형 잡힌 식사", 회피식: dietA.join("·") || "짠 음식·과식",
          수칙1: (life[0] || "가벼운 걷기부터 시작하기").replace(/\(.*?\)/g, "").trim().replace(/[.\s]+$/, ""),
          수칙2: (life[1] || "꾸준한 기록").replace(/\(.*?\)/g, "").trim().replace(/[.\s]+$/, ""),
          기기: dev[0] || "건강 기록 앱" };
        /* 질문 초점별 응답 */
        if (/식단|먹|음식/.test(t)) {
          return R("care:" + dz + ":diet", "[" + dz + " · 식단] " + (e.diet && e.diet.principle || "") + " 권장: " + dietR.join(", ") + (dietA.length ? " / 줄이기: " + dietA.join(", ") : "") +
            "\n👄 회원에게는: “" + fill("cs-diet", slots) + "”", ["disease_care." + dz, "cs-diet"]);
        }
        if (/영양소|영양성분/.test(t)) {
          const nutriWhy = (e.supplements_recommended || []).slice(0, 3).map((x) => x.name + (x.reason ? "(" + String(x.reason).split(/[,.(]/)[0].trim().slice(0, 26) + ")" : "")).join(", ");
          return R("care:" + dz + ":nutri", "[" + dz + " · 영양소] 도움: " + (nutriWhy || "-") + " — 음식 우선: " + (dietR.join(", ") || "균형 잡힌 식사") + "." + (avo.length ? " ⚠️ 주의: " + avo.join(", ") + "." : "") +
            "\n👄 회원에게는: “" + fill("cs-nutri", { 질환명: dz, 영양소: rec.slice(0, 2).join("·") || "기본 영양", 권장식: dietR.slice(0, 2).join("·") || "균형 잡힌 식사" }) + "”", ["disease_care." + dz, "cs-nutri"]);
        }
        if (/영양제|보충제/.test(t)) {
          return R("care:" + dz + ":supp", "[" + dz + " · 영양] 도움: " + (rec.join(", ") || "-") + (avo.length ? " / ⚠️ 주의: " + avo.join(", ") : "") + " — 드시는 약과 상호작용 확인이 먼저예요." +
            "\n👄 회원에게는: “" + fill("cs-check", { 기기: "복용 중인 약 목록" }).replace("로 집에서 기록해 주시면 병원 한 번 수치보다 정확해요", "부터 같이 확인하고 맞는 성분을 담아드릴게요") + "”", ["disease_care." + dz, "ak-supp"]);
        }
        if (/운동|생활|습관/.test(t)) {
          return R("care:" + dz + ":life", "[" + dz + " · 생활] " + life.slice(0, 3).join(" ") +
            "\n👄 회원에게는: “" + fill("cs-life", slots) + "”", ["disease_care." + dz, "cs-life"]);
        }
        if (/뭐라고|말해|말\s*할|설명해/.test(t)) {
          return R("care:" + dz + ":talk", "👄 회원에게 이렇게 말해요 — “" + fill("cs-start", slots) + " " + fill("cs-life", slots) + "”" +
            "\n(근거: " + dz + " 관리 원칙 — " + String(principle).slice(0, 60) + ")", ["cs-start", "cs-life", "disease_care." + dz]);
        }
        return R("care:" + dz, "[" + dz + " 관리 요점] " + String(principle) + " 생활: " + life.slice(0, 2).join(" ") + (dev.length ? " 기기: " + dev.join(", ") + "." : "") +
          "\n👄 회원에게는: “" + fill("cs-start", slots) + "”", ["disease_care." + dz, "cs-start"]);
      }
      /* 지표 상담("감마지피티 높은 사람에게 뭐라고") — 지표군 블록 + MA_MAP 조합 */
      for (const ko in HIPRO_LAB) {
        if (t.toUpperCase().indexOf(ko.toUpperCase()) >= 0) {
          const k = HIPRO_LAB[ko], grp = riskGroupOf(k);
          const map = MA_MAP[grp] || MA_MAP.organ;
          const co = hmBlock("co-" + grp);
          return R("care:lab:" + k, "[" + ko + " · " + (HM_RISK_GROUPS[grp] || {}).ko + "] 관리 조합: " + map.visitKo + "(" + map.dept + ") · " + map.meal + " · " + map.supp.join("/") + " · " + map.device + "." +
            "\n👄 회원에게는: “" + (co ? co.t : "") + " " + hmBlock("sd-" + grp).t + "”", ["MA_MAP." + grp, "co-" + grp, "sd-" + grp]);
        }
      }
    }
    if (cat === "stage") {
      const m = t.match(/([DL][1-8])/i);
      const key = m ? m[1].toUpperCase() : (/정체/.test(t) ? "STALL" : /락|접촉\s*금지/.test(t) ? "LOCK" : null);
      if (key === "STALL") return R("guide:stall", "정체는 단계에서 " + 14 + "일 이상 멈춘 상태예요. 정체 배지가 뜨면 재개 대본(오프닝 「정체 재개」)으로 부담 없이 다시 시작해요 — 후속일이 오면 명단 맨 위로 올라와요.", ["HM_STAGE_GUIDE"]);
      if (key === "LOCK") return R("guide:lock", "락은 검진 결과 수령 전 접촉 금지 상태예요. 연락하면 안 되고, 결과가 오면 하이가 자동 해제하고 알려드려요.", ["cohortStageOf"]);
      const st = key ? HM_STAGES.find((x) => x.k === key) : null;
      const gd = key ? HM_STAGE_GUIDE[key] : null;
      if (st && gd) {
        if (/다음\s*단계/.test(t)) return R("guide:" + key, st.k + "(" + st.name + ") 다음으로 가려면 — " + gd.next, ["HM_STAGE_GUIDE." + key]);
        return R("guide:" + key, st.k + " " + st.name + " — " + st.desc + ". 들어오는 조건: " + gd.entry + " 프로가 하는 일: " + gd.doKo, ["HM_STAGE_GUIDE." + key]);
      }
    }
    if (cat === "clinical") {
      const KEYMAP = { "혈압": "sbp", "공복혈당": "fbs", "혈당": "fbs", "당화혈색소": "hba1c", "콜레스테롤": "tc", "중성지방": "tg", "간수치": "ast", "AST": "ast", "ALT": "alt", "감마": "ggtp", "크레아티닌": "cr", "BMI": "bmi", "허리둘레": "waist", "요산": "ua", "TSH": "tsh" };
      for (const ko in KEYMAP) {
        if (t.toUpperCase().indexOf(ko.toUpperCase()) >= 0) {
          const k = KEYMAP[ko];
          const l1 = clinicalBandLabel(k, 1), l2 = clinicalBandLabel(k, 2);
          const band = (typeof CLINICAL_BANDS !== "undefined") ? CLINICAL_BANDS.find((b2) => b2.key === k) : null;
          const srcKo = band && band.src ? (band.src.org + "(" + band.src.year + ")") : "";
          return R("clinical:" + k, "구간 이름은 「" + l1 + "」·「" + l2 + "」로 안내해요. 구체 수치 판정은 의사 선생님 몫이고, 프로는 구간 이름과 '확인이 필요하다'까지만 말해요." + (srcKo ? " 기준 출처: " + srcKo + "." : ""), ["clinicalBands." + k]);
        }
      }
    }
    if (cat === "cost") {
      const gm = t.match(/([1-5])세대/);
      if (gm && typeof SILSON_SPEC !== "undefined") {
        const g = gm[1] + "세대", sp = SILSON_SPEC[g];
        if (sp) return R("silson:" + g, g + " 실손은 급여 자기부담 " + Math.round((sp.coGen || 0) * 100) + "% · 비급여 " + Math.round((sp.coNon || 0) * 100) + "%예요. " + (sp.feature || ""), ["SILSON_SPEC." + g]);
      }
      if (/진단금/.test(t)) return R("benefit:mean", "시연 기준으로 암 진단금은 평균 3,000만원, 뇌·심장은 평균 2,000만원 수준으로 배정돼요(로그정규 분포). 개별 회원 보유액은 카드의 「걸어온 길」이나 보장 점검 화면에서 봐요.", ["insuranceCohort.INS_TARGETS"]);
      if (/본인\s*부담/.test(t)) return R("oop:calc", "본인 부담은 실손 세대별 자기부담률과 한도로 계산돼요 — 회원 화면 「내 대비 현황」의 치료비 줄이 그 결과예요. 프로는 이 숫자를 먼저 꺼내지 않고, 회원이 물을 때만(응대 6) 안내해요.", ["calcOutOfPocket", "§0-P"]);
      return R("cost:intro", "치료비 이야기의 순서는 '지금 준비된 것 확인 → 본인 부담으로 남는 부분 확인'이에요. 상세는 치료비 보장 점검(보장분석 탭)에서 같이 봐요 — 상품 권유는 대본에 없어요.", ["§0-A"]);
    }
    if (cat === "script") {
      const WANT = [["거절", "br-no"], ["보류", "br-hold2"], ["수락", "br-yes"], ["가족", "br2-fam"], ["바쁘", "br2-busy"], ["두려", "br2-fear"], ["무서", "br2-fear"], ["보험", "br-q-ins"], ["비용", "br2-treatcost"], ["쉬운말", "op-first-easy"]];
      for (const [ko, id] of WANT) if (t.indexOf(ko) >= 0) {
        const b = hmBlock(id);
        if (b) return R("block:" + id, "「" + b.ko + "」 — “" + b.t + "”", ["hmScriptBlocks." + id]);
      }
    }
    if (cat === "system") {
      if (/(결과|기록).*(남|기록|해)/.test(t)) return R("sys:result", "⓪ 오늘의 지시서에서 통화한 카드의 「📝 결과 남기기」를 눌러요 — 7가지 결과 중 하나 고르고 저장하면 끝(3탭). 완결·거절은 내일 명단에서 자동으로 빠져요.", ["HM_RESULT_CODES"]);
      if (/백업/.test(t)) return R("sys:backup", "온톨로지·하네스 → 데이터 운영 맨 아래 「백업·복원」에서 ⬇ 지금 백업을 누르면 JSON 파일로 저장돼요. USB 등 이 PC 밖에 보관하세요.", ["backupRestore"]);
      if (/관제탑|통합\s*운영/.test(t)) return R("sys:ops", "⑩ 통합 운영 탭이 관제탑이에요 — 배분·위험·응답 시한·완결 퍼널·활동 결과·하네스가 한 화면에 있어요(관측 전용).", ["HmTabOps"]);
      const g = (typeof navResolve === "function") ? navResolve(t, "ADMIN") : null;
      if (g && !g.clarify && g.label) return R("nav:" + g.nav, "「" + g.label + "」 화면에서 하실 수 있어요 — 왼쪽 메뉴나 하이에게 말하면 바로 이동해요.", ["navInventory"]);
    }
    if (cat === "curves") {
      return R("curves:3step", "3단으로만 답해요 — ①사실: “구간이 궁금하시죠, 앱의 「내 대비 현황」에서 회원님 기준으로 보실 수 있어요” ②판단 유보: “판단은 회원님이 하시는 거예요” ③절차: “보시다가 궁금한 건 하이나 저한테 물어보세요”. 프로가 먼저 숫자를 꺼내는 건 금지예요(가드가 차단).", ["§0-P", "br2-treatcost"]);
    }
    /* ⑪ 영상 상담(V6) — 원천: VIDEO_SPEC·VS_STATES·VS_SHARE_DOCS·VS_SEG_FIT·INTERVENTIONS·CONSENT_DEFS.v1 */
    if (cat === "video") {
      if (/녹화/.test(t) && typeof VIDEO_SPEC !== "undefined") {
        return R("video:record", "녹화하지 않아요 — 세션에 영상·음성을 담는 자리 자체가 없어요(저장 경로를 만들지 않았어요). 통화가 끝나면 남는 건 상담 요약뿐이고, 그 요약도 회원님이 확인하셔야 저장돼요. 검사가 세션에 미디어 항목이 섞이지 않았는지 매번 확인해요.", ["§0-V8", "VIDEO_SPEC.recording", "vsNoMediaScan"]);
      }
      if (/화면\s*공유|함께\s*보|같이\s*보/.test(t) && typeof VS_SHARE_DOCS !== "undefined") {
        const ks = Object.keys(VS_SHARE_DOCS);
        const cov = VS_SHARE_DOCS.covmap;
        return R("video:share", "함께 볼 수 있는 화면은 " + ks.length + "종이에요 — " + ks.map((k) => VS_SHARE_DOCS[k].ko).join(" · ") + ". 화면에 띄우는 것도 발화라서 말과 같은 규격을 받아요. 보장맵은 만기 국면(" + cov.stages.join("·") + ")에서만 띄울 수 있고요. 원본 수치 화면과 제안 화면은 목록에 없어요 — 숨긴 게 아니라 만들지 않았어요.", ["§0-V9", "VS_SHARE_DOCS"]);
      }
      if (/개입\s*발행/.test(t) && typeof INTERVENTIONS !== "undefined") {
        return R("video:issue", "통화 중에 다음 할 일을 가리키는 거예요 — 발행이지 실행이 아니에요. 진료·검진·구매는 이 화면에서 일어나지 않고, 회원님이 자기 앱에서 하세요. 발행하면 회원 앱의 해당 화면으로 가는 길이 열리고, 무엇을 발행했는지가 요약에 함께 남아요.", ["§0-V10", "INTERVENTIONS"]);
      }
      if (/(진료|원격진료)\s*완결/.test(t) && typeof INTERVENTIONS !== "undefined") {
        return R("video:teledone", "회원님이 원격진료 상담을 접수하시면 완결이에요. 프로 카드에는 「연결됨」과 날짜만 돌아와요 — 어느 병원에서 무엇을 진료하셨는지는 오지 않아요. 법 시행 전이라 접수가 완결점이고, 시행되면 처방 수령이 더해져요.", ["INTERVENTIONS.clinic", "tele_booked", "§0-V10"]);
      }
      if (/영상\s*권장/.test(t) && typeof VS_SEG_FIT !== "undefined") {
        const hi = Object.keys(VS_SEG_FIT).filter((k) => VS_SEG_FIT[k].fit === "high");
        return R("video:fit", "함께 볼 것이 있는 자리에서 영상의 값이 생겨요 — " + hi.join("·") + "이 그런 자리예요(리포트·계약 표·보장맵을 같이 봐요). 전화로 충분한 자리에서 영상은 부담이 될 수 있어서 권하지 않고, 접촉 보류(G8)는 어떤 채널로도 연락하지 않아요.", ["VS_SEG_FIT", "gSegment"]);
      }
      if (/왜|안\s*되|못\s*해|불가/.test(t) && typeof VIDEO_SPEC !== "undefined") {
        return R("video:gate", "요청이 막히는 이유는 다섯이에요 — ①접촉 락(검진 결과 전) ②접촉 보류(G8) ③「영상 상담 이용」 동의 없음 ④" + VIDEO_SPEC.hourFrom + "시~" + VIDEO_SPEC.hourTo + "시 밖 ⑤이미 사양하신 뒤(재요청 " + VIDEO_SPEC.reRequestMax + "회 한도). 막히면 버튼이 아예 없고 이유가 배지로 보여요.", ["vsGateOf", "VIDEO_SPEC"]);
      }
      if (typeof VIDEO_SPEC !== "undefined") {
        return R("video:what", "전화·문자·앱알림 옆에 놓인 네 번째 채널이에요. 프로는 요청만 하고 연결은 회원님이 수락하셔야 시작돼요 — 카메라도 회원님이 켜고 끄시고요. " + VIDEO_SPEC.modes.length + "가지 모드(문자·음성·영상)를 통화 중에 오르내릴 수 있는데, 올리는 건 회원님만 하실 수 있어요. 연결이 나빠지면 시스템이 한 단계 낮춰요.", ["§0-V7", "VIDEO_SPEC", "VS_STATES"]);
      }
    }
    /* ⑩ 60일 사이클·만기·보장맵·세그먼트·제공 DB(R6) — 원천: CYCLE_SPEC·CYCLE_STAGES·COV_FILTER_RULES·G_SEGMENTS·HY_FIELDS */
    if (cat === "cycle") {
      const tm = t.toUpperCase().match(/T([0-8])/);
      if (tm && typeof CYCLE_STAGES !== "undefined") {
        const k = "T" + tm[1], st2 = CYCLE_STAGES[k];
        if (st2) return R("cycle:" + k, k + " " + st2.ko + " — " + st2.act, ["CYCLE_STAGES." + k]);
      }
      if (/(사이클|60일)/.test(t) && typeof CYCLE_SPEC !== "undefined") {
        const C = CYCLE_SPEC;
        return R("cycle:spec", "검진일(D0)에 보장이 시작되고 " + C.expiryDay + "일 뒤 만기예요. 결과는 D+14~21에 도착하고(시연 " + C.resultDay + "일), 그때부터 " + C.goldenHours + "시간이 골든타임이에요. 만기 D-" + C.noticeDays + "에 보장분석, D-" + C.mapDays + "에 보장맵 안내, 만기 뒤 " + C.secondGoldenDays + "일이 2차 골든타임이고요. 프로가 만기를 말할 수 있는 시점의 잔여는 최대 " + C.maxRemainAtContact + "일이에요.", ["CYCLE_SPEC"]);
      }
      if (/2차\s*골든/.test(t) && typeof CYCLE_SPEC !== "undefined") {
        return R("cycle:second", "만기 뒤 " + CYCLE_SPEC.secondGoldenDays + "일이 2차 골든타임이에요 — 무보장 상태가 길어지면 조용히 이탈하시니까, 이 창 안에서 관계를 회복해요. 보험 이야기가 아니라 안부와 코칭이 먼저예요(mt-t7-keep).", ["CYCLE_SPEC", "mt-t7-keep"]);
      }
      if (/보장맵|무인\s*(분석|보장분석)/.test(t) && typeof COV_FILTER_RULES !== "undefined") {
        const f = COV_FILTER_RULES.map((x) => x.ko).join(" · ");
        return R("cycle:covmap", "만기 D-" + CYCLE_SPEC.noticeDays + "에 서버가 스스로 만드는 보장 지도예요 — 사람이 조회하는 화면 자체가 없어요. 계약 정보만으로 공백·중복·만기 캘린더를 산출하고, 여과 규칙(" + f + ")은 코드로 고정돼 있어 보장맵에 들어가지 않아요. 건강 데이터는 입력되지 않아요.", ["COV_FILTER_RULES", "covAnalysis"]);
      }
      if (/승환/.test(t)) {
        return R("cycle:switch", "최근 1개월·6개월 안에 계약 정리 이력이 있으면 승환 창이 켜져요. 그때는 비교안내 화면(월 보험료·보장 범위·기간·면책 재시작·환급금·인수 조건 6항)을 확인해야 다음으로 갈 수 있어요 — 시스템이 강제해요.", ["보험업법 §97③", "covAnalysis.switchWindow"]);
      }
      const gm = t.toUpperCase().match(/G(1[0-4]|[1-9])(A|B)?/);
      if (gm && typeof G_SEGMENTS !== "undefined") {
        const key = "G" + gm[1] + (gm[2] ? gm[2].toLowerCase() : "");
        const g = G_SEGMENTS.find((x) => x.g === key) || G_SEGMENTS.find((x) => x.g === "G" + gm[1]);
        if (g) return R("cycle:" + g.g, g.g + " " + g.ko + " — " + g.why, ["G_SEGMENTS." + g.g]);
      }
      if (/세그먼트/.test(t) && typeof G_SEGMENTS !== "undefined") {
        return R("cycle:segs", "행동과 시점으로 나눈 " + G_SEGMENTS.length + "종이에요 — 질환 이름은 하나도 없어요. 시간 세그먼트(골든타임·만기 D-20·D-7·보장 공백·다음 검진)는 달력이 자동으로 켜고, 접촉 보류(G8)가 가장 먼저 차단해요.", ["G_SEGMENTS"]);
      }
      if (/(제공\s*DB|제공\s*필드|현대해상)/.test(t) && typeof HY_FIELDS !== "undefined") {
        return R("cycle:feed", "현대해상에 나가는 건 " + HY_FIELDS.length + "개 필드예요 — 동의 상태·타이밍(사이클·만기·결과 경과)·세그먼트·보장맵 산출값·연락 토큰. 건강 상태를 알 수 있는 값은 하나도 없고, 등급도 제공하지 않아요. 사전 밖 필드가 생기면 커밋이 차단돼요.", ["HY_FIELDS", "§0-V3"]);
      }
      if (/만기/.test(t)) {
        return R("cycle:maturity", "만기 D-" + CYCLE_SPEC.noticeDays + "에 보장 종료를 미리 알려드리고(사실 고지), D-" + CYCLE_SPEC.mapDays + "에 보장맵을 보여드리면서 안내 동의를 여쭤요. 만기 당일엔 무보장 사실을 알려드리고요 — 동의를 안 하셔도 건강관리는 그대로 계속돼요.", ["CYCLE_SPEC", "mt-t4-notice", "mt-t5-ask"]);
      }
    }
    if (cat === "role") {
      const m = t.match(/([DL][1-8])/i);
      const key = m ? m[1].toUpperCase() : (/첫\s*(통화|상담)/.test(t) ? "D2" : null);
      if (key && HM_STAGE_GUIDE[key]) {
        const st = HM_STAGES.find((x) => x.k === key);
        return R("role:" + key, st.k + " 단계에서 프로의 역할 — " + HM_STAGE_GUIDE[key].doKo + (key === "D2" ? " 첫 통화의 목표는 회원이 그 주에 첫 관리 활동 1개를 시작하는 것 — 케어 플랜은 핵심 1개+보조 2개 조합으로 제안해요." : ""), ["HM_STAGE_GUIDE." + key, "P-1"]);
      }
      /* D2 골든타임·무료 3종·케어 키트(F4) — 원천: FREE3_DEF·HMR_GOLDEN_KEYS·HM_STAGE_GUIDE */
      if (/골든\s*타임/.test(t)) {
        const gk = (typeof HMR_GOLDEN_KEYS !== "undefined") ? HMR_GOLDEN_KEYS.map((g, ix) => (ix + 1) + " " + g.ko).join(" · ") : "";
        return R("role:golden", "D2 첫 통화(골든타임)에서 전할 다섯 가지 — " + gk + ". 대본의 ⭐ 첫 연결 파트가 이 순서대로 준비돼 있고, 통화 후 「결과 남기기」의 전달 체크 5칸에 누르면 ⑩관제탑에 집계돼요.", ["HMR_GOLDEN_KEYS", "HM_STAGE_GUIDE.D2"]);
      }
      if (/3종|삼종/.test(t) && typeof FREE3_DEF !== "undefined") {
        return R("role:free3", "무료 3종은 ① " + FREE3_DEF.items[0].long + " ② " + FREE3_DEF.items[1].long + " ③ " + FREE3_DEF.items[2].long + " — 셋 다 회원 부담 0원이에요. 회원에게는 대본의 fc-3svc 문장 그대로 전하면 돼요.", ["FREE3_DEF", "fc-3svc"]);
      }
      if (/케어\s*키트|키트/.test(t) && typeof FREE3_DEF !== "undefined") {
        const kit = FREE3_DEF.items[2];
        return R("role:kit", "맞춤 케어 키트 — " + (kit.parts || []).join(" · ") + ". 구성은 그 회원의 검진 결과가 정해요(혈압이면 가정용 혈압계, 혈당이면 혈당측정기 — MA_MAP 단일 소스). " + (kit.note || ""), ["FREE3_DEF.kit", "MA_MAP", "fc-kit"]);
      }
      if (/케어\s*플랜/.test(t)) return R("role:careplan", "케어 플랜은 핵심 1개+보조 2개 조합이에요 — 핵심은 등급이 정하고(고위험=진료 연결, 중위험=재검진), 보조는 식단·영양제·미션·기기 중 결과에 맞는 것. 조합은 하이가 계산해 카드에 담아드려요 — 즉석 조합은 금지예요.", ["interventionMap", "MA_MAP"]);
      if (/(영양제|식단|기기)/.test(t)) return R("role:tools", "도구는 검진 결과가 정해요 — 혈압이면 저염 식단·가정용 혈압계, 혈당이면 저당 식단·혈당측정기, 간이면 밀크시슬 같은 식으로 매핑돼 있어요(개연성 매핑 단일 소스). 카드의 「걸어온 길」에서 그 회원이 이미 하는 활동을 먼저 확인하세요.", ["MA_MAP"]);
    }
  } catch (e) {}
  return { cat: cat, src: null, text: "그건 아직 제 사전에 없어요 — 지어내지 않을게요. 화면 이동이나 회원 관련 질문은 하이에게, 제도 문의는 운영(⑩ 관제탑)에 남겨주세요.", refs: [], label: "하이프로", none: true };
}

/* 러너 훅(관리자) — 채점: 분류 일치 + 원천(src) 존재 + none 아님 */
try {
  if (typeof window !== "undefined") {
    /* 질환 원천(_DZCARE)은 온톨로지 화면의 지연 로드 — 하이프로는 첫 질문 전에 미리 킥오프 */
    try { if (typeof loadDzCare === "function") loadDzCare(); } catch (e2) {}
    window.__hifinTerms = function () {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        return HIPRO_TERMS.map((d) => d.k);
      } catch (e3) { return []; }
    };
    window.__hifinDzKeys = function () {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        return (typeof _DZCARE !== "undefined" && _DZCARE) ? Object.keys(_DZCARE) : [];
      } catch (e3) { return []; }
    };
    window.__hifinHiPro = function (q, cardIdx) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const ctx = cardIdx != null ? { card: buildHandoffCard(Number(cardIdx)) } : null;
        return hiproAnswer(q, ctx);
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
