/* ══════════════ A1 · AI 주치의 에이전트 (Phase A 파일럿) ══════════════
   담당: 검진 결과 해석·수치 의미, 생체나이·위험도 해설, 질환·증상·약물 정보, 재검 권고 설명, 생활습관
   비담당: 예약 실행(A0) · 보장·청구(A2) · 제품(A3) · 돌봄(A4) → **핸드백/핸드오프**로 넘긴다
   RAG 1차: 지식(kdca·kdca_qa·guidelines)에서 근거를 검색해 응답에 인용(cite)을 붙인다.
   ⚠️ 근거 없는 의료 발화 금지 — 인용이 비면 반드시 참고용 가드 문구를 붙이고 단정하지 않는다. */

/* 지식 캐시 — 화면(AgentDock)이 지연 로드한 것을 넣어준다. Node 검증에서는 파일을 직접 주입한다. */
let _a1KB = { kb: null, rp: null, qa: null };
function hiDoctorSetKB(kb, rp, qa) { _a1KB = { kb: kb || null, rp: rp || null, qa: qa || null }; }
function hiDoctorKBReady() { return !!(_a1KB.kb || _a1KB.qa); }

/* ── 범위 밖 판정 → 담당 이전 ── */
const A1_TO_A2 = /(보험|보장|실손|진단비|보험금|보험료|청구|휴면|본인부담|공제|약관)/;
const A1_TO_A0 = /(예약|검진센터|검진기관|예약해|접수해|데이터연결|업로드해|적립금|충전|초대|로그인|비밀번호)/;
const A1_TO_A3 = /(영양제|보충제|구매|주문|배송|가격|최저가|제품추천|어디서\s*사)/;
const A1_TO_A4 = /(간병|돌봄|방문간호|방문요양|요양등급|장기요양|요양원|복지용구)/;
function _a1Outbound(question) {
  const q = String(question || "");
  if (A1_TO_A2.test(q)) return { to: "A2", reason: "insurance" };
  if (A1_TO_A4.test(q)) return { to: "A4", reason: "homecare" };
  if (A1_TO_A3.test(q)) return { to: "A3", reason: "shopping" };
  if (A1_TO_A0.test(q)) return { to: "A0", reason: "booking" };
  return null;
}

/* ── RAG 1차 — 근거 검색(키워드 스코어) ──
   반환: [{ source, title, snippet, score }] · 점수 기준 미달이면 빈 배열(=근거 없음) */
function _a1Tokens(q) {
  const raw = String(q || "").replace(/[^가-힣a-zA-Z0-9]+/g, " ").trim();
  const out = [];
  raw.split(/\s+/).forEach(function (w) {
    if (w.length >= 2) out.push(w.toLowerCase());
    if (w.length >= 4) { out.push(w.slice(0, 2)); out.push(w.slice(0, 3)); }   // 조사·어미 흡수(고혈압은 → 고혈압)
  });
  return [...new Set(out)].filter(function (w) { return !/^(알려|해줘|주세요|뭐야|뭔가요|어때|어떻게|설명|보여|나는|제가|저는|우리)$/.test(w); });
}
function hiDoctorRetrieve(question, topK) {
  const toks = _a1Tokens(question);
  if (!toks.length) return [];
  const hits = [];
  const scoreText = function (txt, weight) {
    if (!txt) return 0;
    const s = String(txt).toLowerCase();
    let n = 0;
    toks.forEach(function (t) { if (t.length >= 2 && s.indexOf(t) >= 0) n += weight * Math.min(3, t.length - 1); });
    return n;
  };
  try {
    const items = (_a1KB.kb && _a1KB.kb.items) || [];
    for (const it of items) {
      const sc = scoreText(it.t, 3) + scoreText(it.k, 2) + scoreText(it.s, 0.4);
      if (sc >= 6) hits.push({ source: "질병관리청 국가건강정보포털", title: it.t, snippet: String(it.s || "").slice(0, 120), url: it.u || null, score: sc });
    }
  } catch (e) {}
  try {
    const qa = (_a1KB.qa && _a1KB.qa.qa) || [];
    for (const it of qa) {
      const sc = scoreText(it.q, 3) + scoreText(it.a, 0.3);
      if (sc >= 6) hits.push({ source: "임상 진료지침·질환 Q&A", title: String(it.q || "").slice(0, 60), snippet: String(it.a || "").slice(0, 120), score: sc });
    }
  } catch (e) {}
  hits.sort(function (a, b) { return b.score - a.score; });
  /* 같은 제목 중복 제거 */
  const seen = {}, out = [];
  for (const h of hits) { if (seen[h.title]) continue; seen[h.title] = 1; out.push(h); if (out.length >= (topK || 3)) break; }
  return out;
}

/* ── 에이전트 진입점 ──
   반환: { agent, lines, cards, buttons, cite, nav } | { handback:{to,reason} } | null(=담당 불가, 상위 파이프라인에 위임) */
function aiDoctorAgent(question, ctx) {
  const q = String(question || "");
  /* ① 범위 밖 — 프로토콜로 이전(기존 insHandoff 하드코딩을 대체) */
  const out = _a1Outbound(q);
  if (out) return { handback: out };

  /* ② 기존 검증된 주치의 엔진을 그대로 사용(무회귀) */
  let doc = null;
  try { doc = (typeof aiRespond === "function") ? aiRespond(q, _a1KB.kb, _a1KB.rp, _a1KB.qa) : null; } catch (e) { doc = null; }
  if (!doc || !doc.bubbles || !doc.bubbles.length) return null;
  const first = doc.bubbles[0];
  const generic = first.kind !== "card" && /정보를 찾지 못했어요|이렇게 안내해 드릴 수 있어요/.test(first.text || "");
  if (generic) return null;                     // 주치의도 모르면 상위 파이프라인이 이어받는다

  const lines = doc.bubbles.filter(function (b) { return b.kind !== "card"; }).map(function (b) { return b.text; }).filter(Boolean);
  const cards = doc.bubbles.filter(function (b) { return b.kind === "card" && b.card; }).map(function (b) { return b.card; });
  const buttons = [...new Set([].concat(...cards.map(function (c) { return c.buttons || []; })).concat(doc.quicks || []))].slice(0, 3);

  /* ③ 근거(RAG) — 없으면 참고용 가드를 반드시 붙인다 */
  const cite = hiDoctorRetrieve(q, 3);
  if (!cite.length) {
    const guard = (typeof AGENT_GUARDS !== "undefined" && AGENT_GUARDS.med) ? AGENT_GUARDS.med : "※ 참고용 안내예요 — 진단·처방이 아니며, 증상이 있으면 병원 상담을 권해요.";
    if (!lines.some(function (l) { return /참고용|진단·처방/.test(l); })) lines.push(guard);
  }
  return { agent: "A1", lines: lines, cards: cards, buttons: buttons, cite: cite, nav: null };
}

try { if (typeof window !== "undefined") { window.__hifinA1 = { answer: aiDoctorAgent, retrieve: hiDoctorRetrieve, setKB: hiDoctorSetKB, ready: hiDoctorKBReady }; } } catch (e) {}
