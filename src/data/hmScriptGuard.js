/* ══════════════ 스크립트 가드(hmScriptGuard.js) — 지시서 프롬프트 v1.3 §S-5 ⑨⑩ (P4) ══════════════
   대본 전문+분기 전체의 금지어·경계·규격 스캔. 발행을 막는 구조 — 점수가 아니라 차단이다.
   금지 사전은 여기가 단일 소스: 러너·조립기·콘솔이 같은 사전을 읽는다(사전 이원화 금지).
   ⚠️ 오탐 설계 원칙: "진단이 아니라"(부정 문맥)와 "{프로명}입니다"(자기소개)는 정상 문장 —
   전면 종결어 금지가 아니라 **판정 결합**(질환·위험어 + 단정 종결)만 잡는다. */

/* ── 금지 패턴 사전 — 유형별(각 항: re + 사유). 블록 문안과 조립 대본 양쪽에 적용 ── */
const HM_FORBIDDEN = [
  /* ① 진단·확정 — 질환·판정어와 단정 종결의 결합(의료행위 경계) */
  { key: "diagnosis", ko: "진단·확정 표현",
    re: /(당뇨병?|고혈압|고지혈증|간염|지방간|신부전|갑상선\s*질환|암)\s*(입니다|이에요|예요|이시네요|이십니다|맞으세요|확실)/ },
  { key: "verdict", ko: "판정 단정",
    re: /(진단\s*(입니다|이에요|됐어요|되셨|받으셨다고 보|이 확실)|위험\s*상태\s*입니다|병\s*이\s*있(습니다|어요)\b)/ },
  /* ② 상품 권유 개시 — 유료 신규 상품(§5-1 권유 경계). 회원 질문 응답(br-q-ins)은 '개시'가 아니라 예외 —
     보장 설명은 A2 인계 화면에서만, 대본 안에서 가입·추가를 입에 올리면 차단 */
  { key: "solicit", ko: "상품 권유 개시",
    re: /(보험|특약|상품|플랜)\s*(가입|을\s*추가|추천드|권해드|들어보시|바꾸시|갈아타)/ },
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
/* §0-P 선발화 감지(v2) — 조립 대본에 니즈 수치 표현이 회원 질문 응답(branch) 밖에서 등장하면 차단 */
const HM_NEEDS_UTTER = /(만원\s*구간|HTK|개월분|생활비\s*공백|대비\s*현황)/;

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
  const blocks = [s.opening, ...(s.firstconnect || []), ...(s.talk || []), ...(s.core || []), ...(s.seed || []), s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), ...(s.branches || []), s.closing].filter(Boolean);
  const why = [];
  /* D2 첫 연결(firstconnect 동반)은 골든타임 1회 한정 확장 — D2 전수 실측 최대 47문장 기반 ≤48. 읽기 7분대는 형 확정(2026-08-31: 그대로 유지) */
  const maxSent = (s.firstconnect && s.firstconnect.length) ? 48 : (s.v2 ? (24 + ((s.maturity && s.maturity.length) ? 8 : 0)) : 20);   /* 만기 파트 가산 — R4 결선 */   /* 본대본(응대 제외) 한도 — 응대는 상황별 선택지라 전부 읽지 않는다 */
  const flowBlocks = [s.opening, ...(s.firstconnect || []), ...(s.talk || []), ...(s.core || []), ...(s.seed || []), s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), s.closing].filter(Boolean);                            /* v2: 생활 대화·씨앗 포함 전화 3~5분(§4-S3) */
  if (s.v2) {
    const qN = (s.talk || []).reduce((a, b2) => a + (String(b2.text).match(/\?/g) || []).length, 0);
    if (qN < 2) why.push("유도 질문 부족(" + qN + "<2)");
    if ((s.seed || []).length > 2) why.push("씨앗 과다(" + s.seed.length + ">2)");
    /* §0-P 선발화 — 니즈 수치 표현이 응대(질문 응답) 밖에서 등장하면 차단 */
    const nonBranch = [s.opening, ...(s.firstconnect || []), ...(s.talk || []), ...(s.core || []), ...(s.seed || []), s.ask, ...(s.careplan || []), ...(s.maturity || []), ...(s.fcTail || []), s.closing].filter(Boolean);
    for (const b2 of nonBranch) if (HM_NEEDS_UTTER.test(b2.text)) why.push("선발화 감지 [" + b2.id + "]");
  }
  const brMax = 12 + ((s.maturity && s.maturity.length) ? 2 : 0);   /* 만기 국면 응대 2종(mt-q) 가산 — R4 결선 */
  if (s.v2 && (s.branches || []).length > brMax) why.push("응대 과다(" + s.branches.length + ">" + brMax + ")");
  let nSent = 0;
  for (const b of (s.v2 ? flowBlocks : blocks)) {
    /* 45자 한도는 쉬운말 '블록'의 규격 — 혼합 대본(쉬운말 변형에 공용 분기 동석)에 소급하지 않는다(§S-5 ⑩ 해석) */
    const lim = /-easy$/.test(b.id) ? 45 : 60;
    for (const sent of _hmSentences(b.text)) {
      nSent++;
      if (sent.length > lim) why.push(`문장 초과(${sent.length}>${lim}자) [${b.id}] ${sent.slice(0, 24)}…`);
    }
  }
  if (nSent > maxSent) why.push(`본대본 문장 수 초과(${nSent}>${maxSent})`);
  const smsLen = String(s.sms || "").replace("{링크}", "bit.ly/xxxxxxx").length;
  if (smsLen > 80) why.push(`문자 길이 초과(${smsLen}>80자)`);
  /* 읽기 시간 추정 — 분당 300자(전화 응대 표준 말속도 근사) */
  const chars = blocks.map((b) => b.text.length).reduce((a, b2) => a + b2, 0);
  return { ok: why.length === 0, why, sentences: nSent, readSec: Math.round(chars / 5) };
}

/* ── 대본 종합 스캔 — 조립 카드 1장에 대한 §S-5 ⑨⑩ 판정(러너·조립기 공용) ── */
function hmScriptScan(card) {
  const s = card && card.script; if (!s) return { ok: false, forbidden: [{ key: "none", ko: "script 없음" }], spec: null };
  const blocks = [s.opening, ...(s.talk || []), ...(s.core || []), ...(s.seed || []), s.ask, ...(s.careplan || []), ...(s.branches || []), s.closing].filter(Boolean);
  const forbidden = [];
  for (const b of blocks) for (const h of hmForbiddenScan(b.text)) forbidden.push(Object.assign({ block: b.id }, h));
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
