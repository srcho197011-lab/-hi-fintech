/* ══════════════ 스크립트 가드(hmScriptGuard.js) — 지시서 프롬프트 v1.3 §S-5 ⑨⑩ (P4) ══════════════
   대본 전문+분기 전체의 금지어·경계·규격 스캔. 발행을 막는 구조 — 점수가 아니라 차단이다.
   금지 사전은 여기가 단일 소스: 러너·조립기·콘솔이 같은 사전을 읽는다(사전 이원화 금지).
   ⚠️ 오탐 설계 원칙: "진단이 아니라"(부정 문맥)와 "{프로명}입니다"(자기소개)는 정상 문장 —
   전면 종결어 금지가 아니라 **판정 결합**(질환·위험어 + 단정 종결)만 잡는다. */

/* ── 금지 패턴 사전 — 유형별(각 항: re + 사유). 블록 문안과 조립 대본 양쪽에 적용 ── */
const HM_FORBIDDEN = [
  /* ① 진단·확정 — 질환·판정어와 단정 종결의 결합(의료행위 경계) */
  /* 조사·부사가 끼면 놓치던 결함 수선(영상 V4 적발) — "당뇨병이 확실합니다"가 통과했었다 */
  { key: "diagnosis", ko: "진단·확정 표현",
    re: /(당뇨병?|고혈압|고지혈증|간염|지방간|신부전|갑상선\s*질환|암)\s*(이|가|은|는)?\s*(거의|분명|확실히|틀림없이)?\s*(입니다|이에요|예요|이시네요|이십니다|맞으세요|확실)/ },
  { key: "verdict", ko: "판정 단정",
    re: /(진단\s*(입니다|이에요|됐어요|되셨|받으셨다고 보|이 확실)|위험\s*상태\s*입니다|병\s*이\s*있(습니다|어요)\b)/ },
  /* ② 상품 권유 개시 — 유료 신규 상품(§5-1 권유 경계). 회원 질문 응답(br-q-ins)은 '개시'가 아니라 예외 —
     보장 설명은 A2 인계 화면에서만, 대본 안에서 가입·추가를 입에 올리면 차단 */
  /* 수식어가 끼면 놓치던 결함 수선(영상 V4 적발) — "보험 하나 더 가입하시라고"가 통과했었다.
     사이 간격은 10자까지만 — 「…보험은 예약하실 때 0원으로 이미 가입되어 있어요」(fc-ins 사실 안내)를
     오탐하지 않는 경계다(실측: 그 문장의 간격은 18자). */
  { key: "solicit", ko: "상품 권유 개시",
    re: /(보험|특약|상품|플랜)[^.!?]{0,10}?(가입하|가입을|가입시|을\s*추가|추천드|권해드|들어보시|바꾸시|갈아타)/ },
  { key: "premium", ko: "보험료·금액 흥정", re: /(보험료|월\s*납입|저렴한\s*상품|더\s*싼)/ },
  /* ③ 원가·수수료(전사 규칙 — 회원 접점 노출 금지) */
  { key: "cost", ko: "원가·수수료 노출", re: /(원가|송객\s*수수료|수수료율|CAC|마진)/ },
  /* ④ 공포 소구·단정 예후(응대 톤 경계) */
  { key: "fear", ko: "공포 소구", re: /(큰일\s*납니다|위험합니다\s*지금\s*당장|생명이\s*위독|손\s*쓸\s*수\s*없|늦기\s*전에|지금\s*아니면|마지막\s*기회|서두르지\s*않으면)/ },
  /* ⑤ §0-V1(리뉴얼 R4) — 건강→보장 연결 발화: "…수치가 안 좋으시니 …보장을 늘리시죠" 류.
     제안의 근거는 언제나 보장맵(만기·공백·중복)뿐 — 건강 상태를 보험 이야기의 근거로 삼는 문장은 차단.
     회원 자발 대화(vd)·만기 대본(mt)에도 동일 적용 */
  { key: "h2i", ko: "건강→보장 연결(§0-V1)",
    re: /(수치|결과|검진|기능|간수치|혈압|혈당|콜레스테롤|위험\s*구간|등급|건강\s*상태)[^.!?]{0,16}(높|낮|안\s*좋|좋지\s*않|나쁘|나빠|걱정|위험)[^.!?]{0,24}(보험|보장|특약|진단비|가입|준비하|늘리|들어\s*두)/ },
];

/* §0-P 보험 선행 감지(v2) — 상품 어휘가 치료비 어휘보다 먼저 나오는 블록(보험은 수면 아래) */
function hmInsFirstScan(text) {
  const t = String(text || "");
  const ins = t.search(/보험|보장|특약|상품/);
  const treat = t.search(/치료비|의료비|치료|건강/);
  return ins >= 0 && (treat < 0 || ins < treat);
}
/* §0-P 적용 예외(형 확정 2026-09-03) — 「보험을 먼저 꺼내지 않는다」는 건강관리 흐름에 거는
   규칙이다. 보험이 대화의 주제로 이미 정해진 자리에까지 걸면 승인 대본이 통째로 발행 불가가 된다.
   예외는 셋뿐이고, 셋 다 「프로가 먼저 꺼낸 것이 아니다」라는 같은 근거를 가진다.
     ① 파트  maturity — 만기 고지가 주제. 근거는 계약이지 건강이 아니다.
              branch/branch2·voluntary — 회원이 먼저 물었거나 스스로 연 문(§0-V5).
              counsel/admin/channel — 조립 대본 밖(관리 사무·참고·규칙 서술).
     ② 응대  id에 "-q-" — 회원 질문에 답하는 자리. 파트와 무관하며, 새 응대 블록도 자동 적용된다.
     ③ 명시  fc-3svc·fc-ins — 검진과 함께 이미 붙은 0원 보장의 사실 안내(권유가 아니다).
   firstconnect를 파트째 빼지는 않는다 — 건강 블록(fc-open·fc-report·fc-kit)이 함께 들어 있어
   구멍이 생긴다. 실측(2026-09-03) 결과 이 파트에서 실제로 걸린 것은 위 셋뿐이었고,
   건강관리 흐름(opening·talk·core·seed·ask·careplan·closing)은 히트 0이었다.
   ⚠️ 형 지시 2026-10-05 — 단계 과업 파트(prep·alert·stage)와 L5~L8 여정(lifejourney)이 실제로 조립되기
   시작했다. 이 파트들은 건강관리 흐름이므로 **예외로 두지 않는다**(lifejourney를 예외 목록에서 내렸다) —
   실측으로 lj-* 6종·pr-* 3종·sj-* 4종·em-* 1종 전건이 보험 선행 히트 0이어서 예외가 필요 없다.
   ⚠️ cost(tc-*)는 **조립 위치로 갈라진다**(2026-10-05 수선). tc-brief·tc-gapfact가 D3·D4의 본대본
   (script.stage)에 들어왔으므로 「조립 대본 밖」이라는 예외 근거가 사라졌다. 그래서 예외는
   「본대본 밖에 있을 때」로 좁혔다 — hmInsFirstExempt(block, inFlow)의 inFlow가 true면 cost도 검사한다.
   현재 tc-* 문안에는 보험 어휘가 없어 실제 히트는 0이지만, 보호 없이 본대본에 앉혀 두지 않는다. */
const HM_INSFIRST_EXEMPT_PARTS = ["maturity", "branch", "branch2", "voluntary", "counsel", "admin", "channel"];
const HM_INSFIRST_EXEMPT_PARTS_OFFFLOW = ["cost"];   /* 본대본 밖에서만 예외(조립되면 검사 대상) */
/* fc-ins-cert는 **슬롯 이름 때문에** 걸린다(2026-10-05 실측): 사전 전건 스캔은 치환 전 템플릿
   「{보험적용}. {보험증서}. …」을 읽으므로 슬롯 이름의 "보험"이 보험 선행으로 잡힌다. 조립된 문장
   (「받으신 검진에 따라 … 심사가 끝나면 증서가 데이터 금고로 발급돼요」)에는 보험 어휘가 없다.
   내용 근거도 fc-ins과 같다 — 검진과 함께 이미 붙은 0원 보장의 사실 안내(권유가 아니다). */
const HM_INSFIRST_EXEMPT_IDS = ["fc-3svc", "fc-3svc-easy", "fc-ins", "fc-ins-cert"];
function hmInsFirstExempt(block, inFlow) {
  if (!block) return true;
  const id = String(block.id || "");
  if (HM_INSFIRST_EXEMPT_IDS.indexOf(id) >= 0) return true;
  if (id.indexOf("-q-") >= 0) return true;                 /* 회원 질문 응대 */
  const part = block.part || _hmPartOfId(id);
  if (HM_INSFIRST_EXEMPT_PARTS.indexOf(part) >= 0) return true;
  return !inFlow && HM_INSFIRST_EXEMPT_PARTS_OFFFLOW.indexOf(part) >= 0;
}
/* 조립 카드의 블록에는 part가 실려 오지 않을 수 있다 — id 접두로 되짚는다(사전과 같은 규약) */
function _hmPartOfId(id) {
  const s = String(id || "");
  if (/^mt-/.test(s)) return "maturity";
  if (/^vd-/.test(s)) return "voluntary";
  if (/^br/.test(s)) return "branch";
  if (/^lj-/.test(s)) return "lifejourney";
  if (/^ad-/.test(s)) return "admin";
  if (/^ch-/.test(s)) return "channel";
  if (/^fc-/.test(s)) return "firstconnect";
  /* 단계 축 파트(형 지시 2026-10-05) — 사전과 같은 규약으로 되짚는다. 전부 예외가 아닌 파트다 */
  if (/^pr-/.test(s)) return "prep";
  if (/^em-/.test(s)) return "alert";
  if (/^sj-/.test(s)) return "stage";
  if (/^tc-/.test(s)) return "cost";
  return "";
}
/* §0-P 선발화 감지(v2) — 조립 대본에 니즈 수치 표현이 회원 질문 응답(branch) 밖에서 등장하면 차단 */
const HM_NEEDS_UTTER = /(만원\s*구간|HTK|개월분|생활비\s*공백|대비\s*현황)/;

/* 요율 재산정 고지 게이트(형 지시 2026-10-05) — 「부담이 줄어드는 재산정 대상이 되셨어요」처럼
   요율 인하 대상 **확정을 통보**하는 문장은, 같은 블록 안에 「확정은 심사를 거친다」는 단서를
   반드시 동반해야 한다. fc-ins가 보장 사실에 ※ 고지를 붙이는 것과 같은 성격이다.
   금지어 사전에 넣지 않은 이유: 문장 자체는 금지가 아니라 **단서 없이 쓰는 것**이 금지다 —
   사전에 넣으면 단서를 제대로 붙인 블록도 함께 막힌다. */
const HM_RERATE_CLAIM = /(재산정\s*대상이?\s*되셨|부담이\s*줄어드는\s*재산정|요율[^.!?]{0,10}(인하|내려))/;
const HM_RERATE_HEDGE = /(심사|확정은|달라질\s*수)/;

/* 예외(허용) 문맥 — 금지 패턴보다 먼저 소거. 자기소개·부정 문맥·화면 명칭 */
const HM_FORBIDDEN_ALLOW = [
  /진단이\s*아니라/,            // "진단이 아니라 '확인이 필요한 구간'" — 경계 준수의 핵심 문장
  /(담당|프로|하이핀)\s*[가-힣]*\s*(입니다|이에요)/,  // 자기소개
  /보장분석\s*화면/,             // 화면 명칭(A2 인계 안내)
];

function hmForbiddenScan(text) {
  let t = String(text || "");
  for (const a of HM_FORBIDDEN_ALLOW) t = t.replace(new RegExp(a.source, "g"), " ");
  const hits = [];
  for (const f of HM_FORBIDDEN) { const m = t.match(f.re); if (m) hits.push({ key: f.key, ko: f.ko, at: m[0] }); }
  return hits;
}

/* ── 규격 검사(§S-5 ⑩) — 본대본 ≤20문장 · 문장당 ≤60자(쉬운말 ≤45자) · 문자 ≤80자 ── */
function _hmSentences(text) {
  return String(text || "").split(/(?<=[.!?…])\s+|(?<=요\.)\s*/).map((s) => s.trim()).filter(Boolean);
}
function hmSpecCheck(card) {
  const s = card && card.script; if (!s) return { ok: false, why: ["script 없음"] };
  /* 단계 축 파트(형 지시 2026-10-05) — alert(응급 선행)·prep(D1 사전 준비)·stage(단계 과업)가 본대본에 든다.
     fcExtra(D2 보조·접이식)는 본대본 문장 수에는 넣지 않되 아래에서 같은 문장 길이 한도로 검사한다. */
  const blocks = [...(s.alert || []), ...(s.prep || []), s.opening, ...(s.firstconnect || []), ...(s.talk || []), ...(s.core || []), ...(s.seed || []), ...(s.stage || []), s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), ...(s.branches || []), s.closing].filter(Boolean);
  const why = [];
  /* D2 첫 연결(firstconnect 동반)은 골든타임 1회 한정 확장 — D2 전수 실측 최대 47문장 기반 ≤48. 읽기 7분대는 형 확정(2026-08-31: 그대로 유지) */
  const taskN = ((s.alert || []).length + (s.prep || []).length + (s.stage || []).length);
  const maxSent = (s.firstconnect && s.firstconnect.length) ? 48 : (s.v2 ? (24 + ((s.maturity && s.maturity.length) ? 8 : 0) + (taskN ? 8 : 0)) : 20);   /* 만기 파트 가산 — R4 결선 · 단계 과업 가산 — 형 지시 2026-10-05 */   /* 본대본(응대 제외) 한도 — 응대는 상황별 선택지라 전부 읽지 않는다 */
  /* 본대본(프로가 처음부터 끝까지 소리 내어 읽는 줄) — prep는 **회원 발화가 아니라 프로가 읽는
     지시문**이라 발화 문장 수에서 뺀다(ch-* 규칙 블록과 같은 성격). 문장 길이는 아래에서 그대로 검사한다. */
  const flowBlocks = [...(s.alert || []), s.opening, ...(s.firstconnect || []), ...(s.talk || []), ...(s.core || []), ...(s.seed || []), ...(s.stage || []), s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), s.closing].filter(Boolean);                            /* v2: 생활 대화·씨앗 포함 전화 3~5분(§4-S3) */
  const sideBlocks = [...(s.prep || []), ...(s.fcExtra || [])].filter(Boolean);   /* 문장 수 밖 · 길이·금지어는 동일 검사 */
  if (s.v2) {
    const qN = (s.talk || []).reduce((a, b2) => a + (String(b2.text).match(/\?/g) || []).length, 0);
    if (qN < 2) why.push("유도 질문 부족(" + qN + "<2)");
    if ((s.seed || []).length > 2) why.push("씨앗 과다(" + s.seed.length + ">2)");
    /* §0-P 선발화 — 니즈 수치 표현이 응대(질문 응답) 밖에서 등장하면 차단 */
    const nonBranch = flowBlocks.concat(sideBlocks);
    for (const b2 of nonBranch) if (HM_NEEDS_UTTER.test(b2.text)) why.push("선발화 감지 [" + b2.id + "]");
  }
  /* 요율 재산정 단서 게이트 — 단서 없는 인하 확정 통보를 막는다(형 지시 2026-10-05) */
  for (const b2 of flowBlocks.concat(sideBlocks)) {
    if (HM_RERATE_CLAIM.test(b2.text) && !HM_RERATE_HEDGE.test(b2.text)) why.push("재산정 단서 누락 [" + b2.id + "]");
  }
  const brMax = 12 + ((s.maturity && s.maturity.length) ? 2 : 0);   /* 만기 국면 응대 2종(mt-q) 가산 — R4 결선 */
  if (s.v2 && (s.branches || []).length > brMax) why.push("응대 과다(" + s.branches.length + ">" + brMax + ")");
  let nSent = 0;
  /* 45자 한도는 **블록 id의 -easy 접미**로 판정한다 — 카드 variant가 쉬운말이어도 공용 블록
     (분기·만기·3종 사실 안내 등)은 60자 규격으로 읽는다.
     ⚠️ 이건 「해석」이 아니라 **남아 있는 구멍**이다(형 지시 2026-10-05 실측): 쉬운말 카드 547장 중
        545장에 45자 초과 문장이 있고, 변형 기준으로 바꾸면 그 545장이 즉시 발행 불가가 된다.
        그래서 ①이번에 조립 경로에 오른 단계 파트(prep·alert·stage·cost·lifejourney)에는 쉬운말
        변형을 전건 만들어 **실제로 짧은 문장이 나가게** 했고, ②공용 블록의 쉬운말 변형은 형 검수
        대기로 남겼다. 판정 기준을 variant로 바꾸는 것은 ②가 끝난 뒤의 일이다(순서가 반대면
        545장이 먼저 멈춘다). 지금 상태를 정당화하는 주석이 아니라 남은 일의 기록이다. */
  const lim = (b) => (/-easy$/.test(b.id) ? 45 : 60);
  for (const b of (s.v2 ? flowBlocks : blocks)) {
    for (const sent of _hmSentences(b.text)) {
      nSent++;
      if (sent.length > lim(b)) why.push(`문장 초과(${sent.length}>${lim(b)}자) [${b.id}] ${sent.slice(0, 24)}…`);
    }
  }
  /* 문장 수 밖(prep 지시문 · fcExtra 접이식) — 문장 길이는 본대본과 같은 한도로 검사한다.
     「접어 두면 검사도 안 받는다」가 되지 않게(형 지시 2026-10-05 · R6 누락 전례와 같은 구멍) */
  for (const b of sideBlocks) {
    for (const sent of _hmSentences(b.text)) if (sent.length > lim(b)) why.push(`문장 초과(${sent.length}>${lim(b)}자) [${b.id}] ${sent.slice(0, 24)}…`);
  }
  if (nSent > maxSent) why.push(`본대본 문장 수 초과(${nSent}>${maxSent})`);
  const smsLen = String(s.sms || "").replace("{링크}", "bit.ly/xxxxxxx").length;
  if (smsLen > 80) why.push(`문자 길이 초과(${smsLen}>80자)`);
  /* 읽기 시간 추정 — 분당 300자(전화 응대 표준 말속도 근사).
     ⚠️ 정의 통일(형 지시 2026-10-05) — 종전 readSec은 응대(branches)를 포함하면서 fcExtra는 빼서
        「프로가 실제로 읽는 분량」이 아니었다(계측 집합을 바꾸면 발화량이 늘어도 숫자는 줄었다).
        이제 readSec = 본대본(flowBlocks) 한 통화를 처음부터 끝까지 읽는 시간이고,
        readSecAll = 접이식·응대까지 전부 읽었을 때의 상한이다. 둘을 함께 적어 둔다. */
  const sumLen = (l) => l.map((b) => b.text.length).reduce((a, b2) => a + b2, 0);
  const flowChars = sumLen(s.v2 ? flowBlocks : blocks);
  const allChars = sumLen(blocks.concat(s.fcExtra || []));   /* blocks에 prep·branches가 이미 들어 있다 — 중복 합산 금지 */
  return { ok: why.length === 0, why, sentences: nSent,
    readSec: Math.round(flowChars / 5), readSecAll: Math.round(allChars / 5) };
}

/* ── 대본 종합 스캔 — 조립 카드 1장에 대한 §S-5 ⑨⑩ 판정(러너·조립기 공용) ── */
function hmScriptScan(card) {
  const s = card && card.script; if (!s) return { ok: false, forbidden: [{ key: "none", ko: "script 없음" }], spec: null };
  /* 조립 카드에 실리는 전 파트를 검사한다 — 첫 연결(fc)·만기(mt)·자발(vd)이 빠져 있으면
     그 파트의 슬롯 치환 문장이 금지어 검사를 통과하지 않은 채 발행된다(R6 적발) */
  /* 본대본(inFlow)과 참고 갈래를 갈라 모은다 — §0-P의 cost 예외가 「조립 위치」로 갈리기 때문이다.
     prep는 프로 지시문이지만 카드에 실려 발행되므로 본대본과 같은 검사를 받는다(발화 문장 수만 제외). */
  const flow = [...(s.alert || []), ...(s.prep || []), s.opening, ...(s.firstconnect || []),
    ...(s.talk || []), ...(s.core || []), ...(s.seed || []), ...(s.stage || []),
    s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), s.closing].filter(Boolean);
  const side = [...(s.fcExtra || []), ...(s.branches || []), ...(s.voluntary || [])].filter(Boolean);
  const blocks = flow.concat(side);
  const forbidden = [];
  for (const b of blocks) {
    const inFlow = flow.indexOf(b) >= 0;
    for (const h of hmForbiddenScan(b.text)) forbidden.push(Object.assign({ block: b.id }, h));
    /* §0-P 보험 선행 — 건강관리 흐름에서 프로가 먼저 보험을 꺼내면 차단(예외는 위 규약) */
    if (!hmInsFirstExempt(b, inFlow) && hmInsFirstScan(b.text)) {
      const m = String(b.text || "").match(/보험|보장|특약|상품/);
      forbidden.push({ block: b.id, key: "insfirst", ko: "보험 선행(§0-P)", at: m ? m[0] : "" });
    }
  }
  for (const h of hmForbiddenScan(s.notif)) forbidden.push(Object.assign({ block: "notif" }, h));
  for (const h of hmForbiddenScan(s.sms)) forbidden.push(Object.assign({ block: "sms" }, h));
  /* 재권유 카운트 — 제안(ak-*) 문장이 한 대본에 2회 이상이면 차단(§3-S 금지) */
  const askN = blocks.filter((b) => /^ak-/.test(b.id)).length;
  if (askN >= 2) forbidden.push({ block: "script", key: "reask", ko: "재권유 2회", at: askN + "회" });
  const spec = hmSpecCheck(card);
  return { ok: forbidden.length === 0 && spec.ok, forbidden, spec };
}

/* 러너 훅 — 관리자 전용: 블록 사전 원문 전건 스캔(§S-5 ⑨ 원천 검사) */
try {
  if (typeof window !== "undefined") {
    window.__hifinScriptScan = function (mode, text) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (mode === "text") return { hits: hmForbiddenScan(String(text || "")) };   /* 임의 문안 스캔(가드 검증·R4+ 스튜디오 선검사) */
        if (mode === "insfirst") {   /* §0-P 실측 — 파트별 보험 선행 히트와 차단 대상(예외 규약 검증) */
          const by = {}; const blocked = [];
          for (const bl of HM_SCRIPT_BLOCKS) {
            if (bl.part === "channel") continue;
            const hit = hmInsFirstScan(bl.t), ex = hmInsFirstExempt(bl);
            by[bl.part] = by[bl.part] || { n: 0, hit: 0, ids: [] };
            by[bl.part].n++;
            if (hit) { by[bl.part].hit++; by[bl.part].ids.push(bl.id + (ex ? "(예외)" : "")); if (!ex) blocked.push(bl.id); }
          }
          return { by: by, blocked: blocked, exempt: HM_INSFIRST_EXEMPT_PARTS.slice(), exemptIds: HM_INSFIRST_EXEMPT_IDS.slice() };
        }
        if (mode === "insfirst-text") {   /* 임의 문안 — 가드 실효 대조(양성/음성) */
          const b2 = (text && typeof text === "object") ? text : { id: "test", part: "core", text: String(text || "") };
          return { hit: hmInsFirstScan(b2.text), exempt: hmInsFirstExempt(b2),
                   blocked: !hmInsFirstExempt(b2) && hmInsFirstScan(b2.text) };
        }
        const out = []; const pendingAdmin = [];
        for (const bl of HM_SCRIPT_BLOCKS) {
          if (bl.part === "channel") continue;             // 규칙 서술문(회원 발화 아님)
          const hits = hmForbiddenScan(bl.t);
          if (hits.length) out.push({ id: bl.id, hits: hits });
          if (!bl.approved) {
            /* admin(관리 사무)·lifejourney(L5~L8 초안)는 조립 미사용 — 검수 대기 목록으로 분리(실패 아님). 조립 파트 미승인만 실패 */
            if (["admin", "lifejourney", "talk", "seed", "careplan", "branch2", "cost", "firstconnect", "maturity", "voluntary"].indexOf(bl.part) >= 0) pendingAdmin.push(bl.id);
            else out.push({ id: bl.id, hits: [{ key: "unapproved", ko: "미승인 블록" }] });
          }
        }
        return { n: HM_SCRIPT_BLOCKS.length, bad: out, pendingAdmin: pendingAdmin };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
