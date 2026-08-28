/* ══════════════ 내비 라우팅(navRouting.js) — 설계 프롬프트 v2.1 §4 (P2) ══════════════
   라우팅 헌법 P1의 본 구현: navInventory(105항목·단일 소스) 기반 명시적 섹션·기능 지목 판정.
   P0의 수기 12군 표(HI_NAV_P1)를 대체한다 — 인벤토리가 바뀌면 판정기도 자동으로 따라온다.
   ⚠️ 원칙:
     · 최장 일치 — 긴 엔티티가 짧은 조각을 이긴다(부분문자열 오식 차단)
     · owner 경계(§4-2) — sarg(검진·건강현황·주치의) 타깃은 화면·이동 동사가 명시된 때만 착지,
       tool·qna 타깃은 가로채지 않는다(실수치 툴·Q&A가 정답)
     · 값 질문 가드 — 얼마/몇/잔액 등은 통과(기존 툴 보존)
     · 모호성 되묻기 1회(§4-1) — 같은 길이로 후보 2navs면 추측하지 않고 버튼 2개로 되묻는다.
       2회 연속 되묻기는 금지 — 두 번째는 1순위로 확정한다. */

/* ── 동사 분류표(§4 · P3 코퍼스 생성기와 공유) ── */
const NAV_VERB = {
  /* 이동·열람형 — 착지 의도로 본다 */
  move: /(확인해|보여|열어|열래|가줘|가자|가고싶|이동|들어가|접속|찾아줘|어디(야|에|있|서)|볼래|볼게|보러|띄워)/,
  /* sarg 소유 타깃 전용 — '화면을 지목했다'가 명백한 표현만(분기 상담 보호) */
  sargMove: /(화면|메뉴|탭|예약화면)|(열어|들어가|이동|띄워|가줘)/,
  /* 값·수치 질문 — 화면 안내가 아니라 실수치 툴이 답한다 */
  value: /(얼마|몇\s?[개명원건번%]|몇이|잔액|쌓였|적립됐|언제(야|까지|부터)|왜)/,
  /* 방법형 — 기존 Q&A가 더 좋은 답을 갖고 있어 P1이 가로채지 않는다 */
  how: /(어떻게|하는\s?법|사용법|방법)/,
};

/* 핵심어 파생에서 제외하는 일반어 — 이것만으로는 화면 지목이 아니다 */
const NAV_STOPCORE = ["건강", "관리", "서비스", "센터", "화면", "신청", "안내", "현황", "설정", "기록", "검색", "찾기", "연결", "알림", "보기", "예약"];

/* ── 매칭 인덱스 — NAV_INVENTORY + 브랜드 별칭에서 1회 조립(지연) ── */
let _navIdx = null;       // [{pat, e}] 길이 내림차순
let _navAmbig = null;     // { core: [entry, entry] } 자동 발견 다의어
function _navEntries() {
  const out = [];
  try {
    (typeof NAV_INVENTORY !== "undefined" ? NAV_INVENTORY : []).forEach((e) => {
      if (e.owner === "tool") return;                     // 실수치 툴 소유 — 가로채지 않음
      const pats = new Set([e.label].concat(e.aliases || []));
      /* 핵심어 파생 — "비대면 원격진료" → "원격진료"처럼 회원이 부르는 짧은 이름 */
      String(e.label).split(/[\s·›()\/－-]+/).forEach((tk) => {
        const t = tk.replace(/[①-⑨🩺🚨]/g, "").trim();
        if (t.length >= 3 && /^[가-힣A-Za-z]+$/.test(t) && NAV_STOPCORE.indexOf(t) < 0) pats.add(t);
      });
      pats.forEach((p) => {
        const q = String(p).replace(/[\s·]/g, "");
        if (q.length < 2) return;
        out.push({ pat: q, e });
        /* 정규화 변형 — lexNormalize가 동의어를 표준어로 바꾸므로 패턴 쪽도 같은 변형을 등록 */
        try { const nq = (typeof lexNormalize === "function") ? String(lexNormalize(q)).replace(/[\s·]/g, "") : q; if (nq && nq !== q && nq.length >= 2) out.push({ pat: nq, e }); } catch (err) {}
      });
    });
    /* 브랜드 별칭 → 대표 화면(§3-3 사전 통합): 건강지갑 계열은 나의 건강지갑으로 */
    if (typeof BRAND_TOKENS !== "undefined") {
      const map = { WALLETSEC: "tab.mywallet.wallet", CHECKINS: "sec.insurance" };
      BRAND_TOKENS.forEach((b) => {
        const key = map[b.token]; if (!key) return;
        const e = (NAV_INVENTORY || []).find((x) => x.key === key); if (!e) return;
        [b.label].concat(b.aliases).forEach((p) => { const q = String(p).replace(/[\s·]/g, ""); if (q.length >= 2) out.push({ pat: q, e }); });
      });
    }
  } catch (err) {}
  return out;
}
function _navBuild() {
  if (_navIdx) return;
  const rows = _navEntries();
  /* 같은 패턴이 서로 다른 nav를 가리키면 — 다의어 후보. 자동 등록(ambiguityPairs 단일 소스) */
  const byPat = {};
  rows.forEach((r) => { (byPat[r.pat] = byPat[r.pat] || []).push(r.e); });
  _navAmbig = {};
  const keep = [];
  Object.keys(byPat).forEach((p) => {
    const navs = {}; byPat[p].forEach((e) => { navs[e.nav] = e; });
    const uniq = Object.keys(navs);
    if (uniq.length === 1) keep.push({ pat: p, e: byPat[p][0] });
    else {
      /* 표면 우선(section > tab > action) + 라벨 순 — 결정론 후보 2개만 */
      const cand = Object.values(navs).sort((a, b) => {
        const so = { section: 0, tab: 1, action: 2 };
        return (so[a.surface] - so[b.surface]) || (a.label < b.label ? -1 : 1);
      }).slice(0, 2);
      _navAmbig[p] = cand;
      keep.push({ pat: p, e: cand[0], ambig: p });     // 인덱스에는 1순위 + ambig 표식
    }
  });
  keep.sort((a, b) => b.pat.length - a.pat.length);     // 최장 일치
  _navIdx = keep;
}
/* 자동 발견 다의어 표 — 리포트·함정 세트가 읽는다 */
function navAmbigPairs() { _navBuild(); return Object.keys(_navAmbig).map((p) => ({ pat: p, cands: _navAmbig[p].map((e) => ({ key: e.key, label: e.label, nav: e.nav })) })); }

/* 다의어 해소(공용) — 부모-자식이면 자식, 비sarg 유일이면 그쪽, 남으면 되묻기 후보 반환 */
function _navAmbigResolve(pat, admin) {
  const cands = (_navAmbig[pat] || []).filter((e) => !e.admin || admin);
  if (cands.length === 2 && typeof secParent === "function") {
    const [a, b] = cands;
    if (secParent(a.nav) === b.nav) return { mode: "auto", e: a };
    if (secParent(b.nav) === a.nav) return { mode: "auto", e: b };
  }
  const nonSarg = cands.filter((e) => e.owner !== "sarg");
  if (nonSarg.length === 1) return { mode: "auto", e: nonSarg[0] };
  if (cands.length >= 2) return { mode: "clarify", cands };
  return cands.length === 1 ? { mode: "auto", e: cands[0] } : { mode: "none" };
}

/* ── 되묻기 상태 — 2회 연속 금지(§4-1) ── */
let _navClarifyPat = null;

/* ── 본 판정기 ── */
function navResolve(normText) {
  _navBuild();
  const t = String(normText || "");
  if (!t || NAV_VERB.value.test(t) || NAV_VERB.how.test(t)) return null;
  const tm = t.replace(/[\s·]/g, "");                    // 매칭 전용 평탄본 — 중점·공백 표기가 달라도 같은 화면
  const admin = (typeof isAdminRole === "function") ? isAdminRole() : false;
  let best = null, bestPat = "", bestAmbig = null;
  for (const r of _navIdx) {
    if (r.pat.length <= bestPat.length) break;           // 길이 내림차순 — 더 짧으면 중단
    if (tm.indexOf(r.pat) < 0) continue;
    if (r.e.admin && !admin) continue;
    best = r.e; bestPat = r.pat; bestAmbig = r.ambig || null;
  }
  if (!best) return null;
  const hasMove = NAV_VERB.move.test(t);
  /* ── 다의어 해소를 owner 가드보다 먼저 — 1순위가 sarg여도 비(非)sarg 후보가 유일하면 그쪽이 정답이다 ── */
  if (bestAmbig) {
    const rz = _navAmbigResolve(bestAmbig, admin);
    if (rz.mode === "auto") { best = rz.e; bestAmbig = null; }
    else if (rz.mode === "clarify") {
      /* 진짜 되묻기 — 이동 의도가 확인될 때만(스치듯 언급에 되묻지 않는다), 2회 연속 금지 */
      if (!hasMove && (bestPat.length < 4 || tm.length > bestPat.length + 4)) return null;
      if (_navClarifyPat !== bestAmbig) {
        _navClarifyPat = bestAmbig;
        return { clarify: true, matched: "nav-ambig:" + bestAmbig,
          lines: ["「" + bestAmbig + "」 관련 화면이 두 곳 있어요 — 어디를 열어드릴까요?"],
          buttons: rz.cands.map((e) => e.label), nav: null };
      }
      best = rz.cands[0]; bestAmbig = null;
    } else if (rz.mode === "none") return null;
  }
  if (best.owner === "sarg" && !NAV_VERB.sargMove.test(t)) return null;   // §4-2 — 분기 상담 보호
  if (best.owner === "qna" && !hasMove) return null;                      // 어휘만 언급 — Q&A가 답
  /* 동사 없는 명사 단독 호출 — 패턴이 4자 이상이고 문장이 짧을 때만 이동 의도로 본다 */
  if (!hasMove && !(best.owner === "sarg") && (bestPat.length < 4 || tm.length > bestPat.length + 4)) return null;
  _navClarifyPat = null;
  return _navAnswer(best);
}
/* 응답 조립 — 섹션 가이드 재사용 + 탭 한 줄(§5-3). 새 문장 창작 없음(고정 템플릿 2개) */
function _navAnswer(e) {
  let g = null;
  try { g = (typeof AGENT_SEC_GUIDES !== "undefined") ? AGENT_SEC_GUIDES.find((x) => x.k === e.nav) : null; } catch (err) {}
  const secLabel = (typeof AGENT_NAV_LABEL !== "undefined" && AGENT_NAV_LABEL[e.nav]) || (g && g.label) || e.label;
  const _flat = (x) => String(x).replace(/[\s·]/g, "");
  const sameName = _flat(e.label) === _flat(secLabel);
  const lines = [(g && g.guide) || (secLabel + " 화면을 열어드릴게요.")];
  if (e.surface !== "section" && !sameName) lines.push("찾으시는 「" + e.label.replace(/^[①-⑨]\s?/, "") + "」 화면으로 바로 데려다드릴게요.");
  /* 탭 착지 시드 — 실소비처 확인된 2곳만(Insurance.__hifinInsAsk · Checkup._checkupTab). 나머지는 섹션 착지 */
  try {
    if (e.tab && e.nav === "insurance") window.__hifinInsAsk = { tab: e.tab };
    if (e.tab && e.nav === "checkup" && typeof _checkupTab !== "undefined") _checkupTab = e.tab;
  } catch (err) {}
  return { lines, buttons: ((g && g.btns) || []).slice(0, 3),
    nav: { key: e.nav, label: secLabel + (e.surface === "tab" && !sameName ? " › " + e.label.replace(/^[①-⑨]\s?/, "") : "") },
    matched: "nav-p1:" + e.key, tab: e.tab || null };
}

/* ── 함정 세트(§7) — 인덱스와 같은 단일 소스에서 생성: 교차 부분문자열 + 다의어 ── */
function navTrapSet() {
  _navBuild();
  const traps = [];
  const pats = _navIdx.map((r) => r.pat);
  for (const r of _navIdx) {
    for (const s of _navIdx) {
      if (r === s || r.e.nav === s.e.nav) continue;
      if (s.pat.length > r.pat.length && s.pat.indexOf(r.pat) >= 0) {
        /* r.pat이 s.pat의 부분문자열 — 긴 쪽 질문은 반드시 긴 쪽으로 */
        traps.push({ q: s.pat + (s.e.owner === "sarg" ? " 화면 열어줘" : " 보여줘"), expect: s.e.nav, kind: "substr", note: r.pat + "⊂" + s.pat, admin: s.e.admin });
      }
    }
  }
  const adminNow = (typeof isAdminRole === "function") ? isAdminRole() : false;
  Object.keys(_navAmbig || {}).forEach((p) => {
    const rz = _navAmbigResolve(p, adminNow);          // 판정기와 같은 해소기 — 로직 이원화 금지
    if (rz.mode === "auto") traps.push({ q: p + " 열어줘", expect: rz.e.nav, kind: "ambig-auto", admin: false });
    else if (rz.mode === "clarify") traps.push({ q: p + " 열어줘", expect: "CLARIFY", kind: "ambig", admin: false });
  });
  /* 경계 회귀 — sarg·tool·값 질문은 null이어야 한다 */
  traps.push({ q: "건강검진 결과 알려줘", expect: null, kind: "owner-sarg" });
  traps.push({ q: "내 건강 봐줘", expect: null, kind: "owner-sarg" });
  traps.push({ q: "적립금 얼마 쌓였어", expect: null, kind: "value" });
  traps.push({ q: "수령증 보여줘", expect: null, kind: "owner-tool" });
  return traps;
}

/* ── 테스트 훅(§7) — 관리자 세션에서만 동작. 전수 채점은 UI 경유 금지 원칙의 실행 수단 ── */
try {
  if (typeof window !== "undefined") {
    window.__hifinNavTest = function (q, debug) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const norm = (typeof lexNormalize === "function") ? lexNormalize(q) : String(q || "");
        const r = navResolve(norm);
        const out = r ? { matched: r.matched, nav: r.nav ? r.nav.key : null, tab: r.tab || null, clarify: !!r.clarify, buttons: r.buttons || [] } : null;
        if (!debug) return out;
        _navBuild();
        const hits = [];
        for (const x of _navIdx) if (norm.indexOf(x.pat) >= 0 && hits.length < 8) hits.push(x.pat + "→" + x.e.nav + "/" + x.e.owner + (x.ambig ? "(ambig)" : "") + (x.e.admin ? "[adm]" : ""));
        return { norm: norm, hits: hits, res: out };
      } catch (e) { return { error: String(e).slice(0, 120) }; }
    };
    window.__hifinNavTraps = function () { try { return navTrapSet(); } catch (e) { return []; } };
    window.__hifinNavAmbig = function () { try { return navAmbigPairs(); } catch (e) { return []; } };
  }
} catch (e) {}
