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
  { key: "fear", ko: "공포 소구", re: /(큰일\s*납니다|위험합니다\s*지금\s*당장|생명이\s*위독|손\s*쓸\s*수\s*없)/ },
];

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
  const blocks = [s.opening, ...(s.core || []), s.ask, ...(s.branches || []), s.closing].filter(Boolean);
  const why = [];
  let nSent = 0;
  for (const b of blocks) {
    /* 45자 한도는 쉬운말 '블록'의 규격 — 혼합 대본(쉬운말 변형에 공용 분기 동석)에 소급하지 않는다(§S-5 ⑩ 해석) */
    const lim = /-easy$/.test(b.id) ? 45 : 60;
    for (const sent of _hmSentences(b.text)) {
      nSent++;
      if (sent.length > lim) why.push(`문장 초과(${sent.length}>${lim}자) [${b.id}] ${sent.slice(0, 24)}…`);
    }
  }
  if (nSent > 20) why.push(`본대본 문장 수 초과(${nSent}>20)`);
  const smsLen = String(s.sms || "").replace("{링크}", "bit.ly/xxxxxxx").length;
  if (smsLen > 80) why.push(`문자 길이 초과(${smsLen}>80자)`);
  /* 읽기 시간 추정 — 분당 300자(전화 응대 표준 말속도 근사) */
  const chars = blocks.map((b) => b.text.length).reduce((a, b2) => a + b2, 0);
  return { ok: why.length === 0, why, sentences: nSent, readSec: Math.round(chars / 5) };
}

/* ── 대본 종합 스캔 — 조립 카드 1장에 대한 §S-5 ⑨⑩ 판정(러너·조립기 공용) ── */
function hmScriptScan(card) {
  const s = card && card.script; if (!s) return { ok: false, forbidden: [{ key: "none", ko: "script 없음" }], spec: null };
  const blocks = [s.opening, ...(s.core || []), s.ask, ...(s.branches || []), s.closing].filter(Boolean);
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
    window.__hifinScriptScan = function () {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const out = []; const pendingAdmin = [];
        for (const bl of HM_SCRIPT_BLOCKS) {
          if (bl.part === "channel") continue;             // 규칙 서술문(회원 발화 아님)
          const hits = hmForbiddenScan(bl.t);
          if (hits.length) out.push({ id: bl.id, hits: hits });
          if (!bl.approved) {
            /* admin(관리 사무)은 조립 미사용 초안 — 검수 대기 목록으로 분리(실패 아님). 조립 파트 미승인만 실패 */
            if (bl.part === "admin") pendingAdmin.push(bl.id);
            else out.push({ id: bl.id, hits: [{ key: "unapproved", ko: "미승인 블록" }] });
          }
        }
        return { n: HM_SCRIPT_BLOCKS.length, bad: out, pendingAdmin: pendingAdmin };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
