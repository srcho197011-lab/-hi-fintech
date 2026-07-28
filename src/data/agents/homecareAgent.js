/* ══════════════ A4 · 재가돌봄 에이전트 (Phase D) ══════════════
   회원은 대개 '보호자'다. 본인이 아픈 게 아니라 **부모님이 아프고, 보호자는 지쳐 있고, 절차는 낯설다.**
   그래서 A4의 일은 정보를 쏟는 게 아니라 **다음 한 걸음을 알려주는 것**이다.

   응답 순서
     ⓪ 트리아지 — 응급 징후가 보이면 상담을 멈추고 119·진료를 먼저 안내한다(무엇보다 우선)
     ① 필요 도출 — 등급이 있는지 없는지에 따라 할 말이 완전히 달라진다
     ② 절차·급여·비용 — 제도를 단계로 풀어주고, 비율로 계산하고, 금액은 단정하지 않는다
     ③ 기관 연결 — 지역·급여종류로 좁혀 같은 기준으로 보여준다
   담당 밖(증상·수치 A1 / 보험금·청구 A2 / 검진 예약 A0 / 제품 구매 A3)은 핸드백. */

const A4_TO_A1 = /(무슨\s*병|질환이|수치\s*의미|해석해|정상\s*범위|약\s*(부작용|상호|복용량)|몇\s*알\s*먹|치매\s*검사\s*결과|검진\s*결과)/;
const A4_TO_A2 = /(보험금|청구|실손|보장\s*(공백|되나|돼요)|간병보험|보험료|휴면)/;
const A4_TO_A0 = /(검진\s*예약|건강검진\s*받|데이터\s*연결|결과지\s*올리|본인인증)/;
const A4_TO_A3 = /(영양제|건강기능식품|비타민|최저가|장바구니|주문)/;
function _a4Outbound(q) {
  const s = String(q || "");
  /* 복지용구는 장기요양 급여라 A4가 담당한다 — '구매' 단어가 있어도 A3로 넘기지 않는다 */
  if (/복지용구/.test(s)) return null;
  if (A4_TO_A2.test(s)) return { to: "A2", reason: "insurance" };
  if (A4_TO_A3.test(s)) return { to: "A3", reason: "product" };
  if (A4_TO_A1.test(s)) return { to: "A1", reason: "medical" };
  if (A4_TO_A0.test(s)) return { to: "A0", reason: "booking" };
  return null;
}

/* ── 의도 판별 ── */
const A4_INTENT = {
  apply: /(신청|어떻게\s*받|절차|어디에\s*문의|접수|등급\s*받|등급신청|등급\s*신청)/,
  grade: /(등급이\s*(뭐|무엇)|등급\s*종류|몇\s*등급|등급\s*기준|인지지원|등급이\s*어떻게)/,
  cost: /(얼마|비용|본인부담|한도액|월\s*한도|부담금|돈이\s*얼마|가격)/,
  svc: /(방문요양|방문목욕|방문간호|주야간보호|단기보호|복지용구|방문재활|뭘\s*받|어떤\s*서비스|급여\s*종류|무슨\s*서비스)/,
  find: /(기관|센터|찾아|추천|어디로|근처|알아봐|검색)/,
};

/* 지역·급여종류 추출 — 기관 검색용 */
function _a4Region(q) {
  try {
    const d = (typeof _homecareData !== "undefined" && _homecareData) ? _homecareData : null;
    if (!d) return null;
    for (const s of d.sido) { if (String(q).indexOf(s) >= 0) return s; }
  } catch (e) {}
  return null;
}
function _a4Svc(q) {
  try {
    const d = (typeof _homecareData !== "undefined" && _homecareData) ? _homecareData : null;
    const list = d ? d.svc : (typeof LTC_SERVICES !== "undefined" ? LTC_SERVICES.map(function (s) { return s.key; }) : []);
    for (const s of list) { if (String(q).indexOf(s) >= 0) return s; }
  } catch (e) {}
  return null;
}

/* 기관 조회 — 카탈로그에 실재하는 것만. 로드 전이면 조회하지 않고 화면으로 안내한다(지어내지 않는다). */
function a4Providers(region, svc, limit) {
  try {
    const d = (typeof _homecareData !== "undefined" && _homecareData) ? _homecareData : null;
    if (!d) return null;
    const si = region ? d.sido.indexOf(region) : -1;
    const vi = svc ? d.svc.indexOf(svc) : -1;
    const rows = d.providers.filter(function (p) {
      if (si >= 0 && p[1] !== si) return false;
      if (vi >= 0 && (!Array.isArray(p[5]) || p[5].indexOf(vi) < 0)) return false;
      return true;
    });
    return { total: rows.length, rows: rows.slice(0, limit || 3).map(function (p) {
      return { name: p[0], sido: d.sido[p[1]] || "", gu: p[2] || "", addr: p[3] || "", svcs: (p[5] || []).map(function (i) { return d.svc[i]; }).filter(Boolean) };
    }) };
  } catch (e) { return null; }
}

/* ── 필요 도출 — 등급 보유 여부가 모든 상담의 갈림길 ── */
function _a4Need(ctx) {
  const m = (ctx && ctx.m) || null;
  const snap = (ctx && ctx.snap) || null;
  const out = { hasFamily: false, elder: null, gradeKnown: false, rpm: null };
  let fam = null;
  try {
    fam = (m && (m.family || m.familyMembers)) || null;
    /* 화면에서 등록한 가족은 저장소에 있다 — 회원 객체에 없어도 여기서 읽어온다 */
    if (!Array.isArray(fam) && m && m.email && typeof familyLoad === "function") fam = familyLoad(m.email, (m.name || "").slice(0, 1));
    if (Array.isArray(fam) && fam.length) {
      out.hasFamily = true;
      const e = fam.find(function (f) { return Number(f.age) >= 75 || /모|부|조모|조부/.test(String(f.relation || "")); });
      if (e) out.elder = { name: e.name || "", relation: e.relation || "가족", age: e.age || null };
    }
    if (!out.hasFamily && snap && snap.s6 && snap.s6.familyCount > 0) out.hasFamily = true;
  } catch (e) {}
  /* 원격 모니터링 경보 — 보호자가 묻지 않아도 A4는 알고 있어야 한다 */
  try {
    if (typeof rpmState === "function" && Array.isArray(fam) && m) out.rpm = rpmState(m.email, fam);
  } catch (e) {}
  return out;
}

/* 지식 인용 — 답변 근거를 붙인다(A1·A2와 동일 규약) */
function a4Retrieve(question, topK) {
  const q = String(question || "");
  const hits = [];
  try {
    if (typeof LTC_FAQ !== "undefined") {
      for (const f of LTC_FAQ) {
        let sc = 0;
        for (const k of f.kw) { if (q.indexOf(k) >= 0) sc += k.length; }
        if (sc) hits.push({ source: "노인장기요양보험 제도 안내", title: f.q, snippet: String(f.a).replace(/\*\*/g, "").slice(0, 90), score: sc });
      }
    }
    if (typeof LTC_SERVICES !== "undefined") {
      for (const s of LTC_SERVICES) { if (q.indexOf(s.key) >= 0) hits.push({ source: "재가급여 종류", title: s.key, snippet: String(s.what).replace(/\*\*/g, "").slice(0, 90), score: s.key.length * 2 }); }
    }
  } catch (e) {}
  hits.sort(function (a, b) { return b.score - a.score; });
  return hits.slice(0, topK || 2).map(function (h) { return { source: h.source, title: h.title, snippet: h.snippet }; });
}

/* ── 진입점 ──
   반환: { agent:"A4", lines, buttons, cite, nav, calc, providers } | { handback } | null */
function homecareAgent(question, ctx) {
  const q = String(question || "");
  ctx = ctx || {};
  const nav = { key: "homecare", label: "재가·돌봄" };

  /* ⓪ 트리아지 — 담당 밖 판정보다도 먼저. 응급은 어떤 규칙보다 위에 있다.
     말(질문 표현)과 데이터(원격 모니터링 수치)를 함께 읽는다. */
  const need = _a4Need(ctx);
  /* [Phase E] 협주 파트에서는 **배경 측정 경보를 앞세우지 않는다.**
     협주는 이미 "지금 응급이 아니다"라고 판정하고 들어온 경로다(말-응급·critical은 판정에서 걸러진다).
     그 뒤에 파트가 배경 경보를 첫 줄로 올리면, 등급·실손을 물었는데 혈압 이야기가 답을 가로챈다. */
  const rpmForTriage = (ctx && ctx.ensemble) ? null : need.rpm;
  const triage = (typeof hcTriage === "function") ? hcTriage(q, { rpm: rpmForTriage }) : null;

  /* 담당 밖으로 넘길지 판단 — **지금 벌어지는 응급**만 이 판단을 건너뛴다.
     배경 경보(측정값)가 켜져 있다고 해서 보험금·검진 질문까지 A4가 삼키면 안 된다.
     다만 측정값이 crisis 구간이면 무엇보다 우선한다. */
  const nowEmergency = triage && (triage.via === "말" || triage.level === "critical");
  /* [Phase E] 협주 파트 호출에서는 핸드백하지 않는다 — 라우팅은 협주가 이미 정했다(경계는 ensembleGuard ②가 지킨다) */
  const ob = (nowEmergency || (ctx && ctx.ensemble)) ? null : _a4Outbound(q);
  if (ob) return { handback: ob };

  let lines = [], buttons = [], cite = [], calc = null, providers = null;

  /* ① 비용 — 한도액을 알려주면 계산하고, 모르면 계산하지 않는다(추정 금지) */
  if (A4_INTENT.cost.test(q)) {
    const mm = q.replace(/,/g, "").match(/(\d+)\s*만\s*원|(\d{5,})\s*원/);
    const won = mm ? (mm[1] ? Number(mm[1]) * 10000 : Number(mm[2])) : null;
    const facility = /(시설|요양원|입소)/.test(q);
    calc = (won && typeof ltcCopay === "function") ? ltcCopay(won, { facility: facility }) : null;
    if (calc) {
      lines.push(`${calc.kind} 기준으로 계산해 드릴게요 — 한도액 ${calc.limit.toLocaleString()}원이면 본인부담은 ${calc.copay.toLocaleString()}원(${Math.round(calc.rate * 100)}%)이에요.`);
      lines.push(`나머지 ${calc.insurer.toLocaleString()}원은 공단이 부담해요.`);
      lines.push(`감경 대상에 해당하시면 ${calc.reduced.min.toLocaleString()}~${calc.reduced.max.toLocaleString()}원 수준으로 낮아질 수 있어요 — 적용 여부는 공단이 소득·재산으로 판단해요.`);
      if (typeof LTC_COPAY !== "undefined") lines.push(LTC_COPAY.overLimit.replace(/\*\*/g, ""));
      cite.push({ source: "본인부담률(제도)", title: `${calc.kind} ${Math.round(calc.rate * 100)}%` });
    } else {
      lines.push("한 달 비용은 **등급별 월 한도액 안에서 얼마나 쓰셨는지**로 정해져요.");
      lines.push("재가급여는 이용액의 15%가 본인부담이고, 감경 대상이면 6~9% 수준으로 낮아져요. 기초생활수급자는 본인부담이 없어요.");
      lines.push("월 한도액은 해마다 고시로 바뀌어서 제가 임의로 말씀드리지 않을게요 — 인정서에 적힌 금액이나 공단(1577-1000)으로 확인해 주세요.");
      lines.push("한도액을 알려주시면(예: \"한도액 150만원\") 본인부담을 바로 계산해 드릴게요.");
      cite.push({ source: "본인부담률(제도)", title: "재가 15% · 시설 20% · 감경 6~9%" });
    }
    buttons = ["등급 신청은 어떻게 해?", "재가·돌봄 화면 열기"];
  }

  /* ② 신청 절차 — 보호자가 가장 많이 막히는 지점을 단계로 */
  if (!lines.length && A4_INTENT.apply.test(q)) {
    lines.push("장기요양 등급 신청은 이렇게 진행돼요 — 신청일부터 30일 이내 판정이 원칙이에요.");
    try {
      for (const s of LTC_APPLY) lines.push(`${s.step}. ${s.title} — ${String(s.body).replace(/\*\*/g, "")}`);
    } catch (e) {}
    lines.push("가장 중요한 건 2단계예요 — 방문조사 때 **평소 상태를 그대로** 보여드려야 실제 필요가 반영돼요.");
    cite.push({ source: "노인장기요양보험 신청 절차", title: "신청 → 방문조사 → 의사소견서 → 등급판정 → 계약" });
    buttons = ["한 달에 얼마나 들어?", "어떤 서비스를 받을 수 있어?", "재가·돌봄 화면 열기"];
  }

  /* ③ 등급 — 판정 권한은 공단에 있다. 기준만 보여준다. */
  if (!lines.length && A4_INTENT.grade.test(q)) {
    lines.push("장기요양 등급은 인정점수로 나뉘어요 — 점수는 공단 방문조사(52개 항목)와 의사소견서로 매겨져요.");
    try { for (const g of LTC_GRADES) lines.push(`· ${g.key}(${g.score}) — ${g.state}`); } catch (e) {}
    lines.push("어느 등급에 해당하는지는 **공단 등급판정위원회**가 정해요 — 제가 미리 확정해 드릴 수는 없어요.");
    cite.push({ source: "장기요양 인정점수 구간", title: "1~5등급 · 인지지원등급" });
    buttons = ["등급 신청은 어떻게 해?", "재가·돌봄 화면 열기"];
  }

  /* ④ 급여 종류 — 특정 급여를 물으면 그것만, 아니면 전체 */
  if (!lines.length && A4_INTENT.svc.test(q)) {
    const one = _a4Svc(q);
    try {
      if (one && typeof ltcService === "function" && ltcService(one)) {
        const s = ltcService(one);
        lines.push(`${s.key} — ${String(s.what).replace(/\*\*/g, "")}`);
        lines.push(`누가: ${s.who} · 언제 쓰면 좋냐면: ${s.when}`);
        lines.push("이용하려면 장기요양 등급이 있어야 해요. 등급이 없으면 먼저 신청부터 하시면 돼요.");
        cite.push({ source: "재가급여 종류", title: s.key });
      } else if (typeof LTC_SERVICES !== "undefined") {
        lines.push("집에서 받을 수 있는 재가급여는 7가지예요.");
        for (const s of LTC_SERVICES) lines.push(`· ${s.key} — ${String(s.what).replace(/\*\*/g, "").split(".")[0]}.`);
        lines.push("등급이 있으면 이 중에서 필요한 걸 조합해 쓰실 수 있어요.");
        cite.push({ source: "재가급여 종류", title: "방문요양·방문목욕·방문간호·주야간보호·단기보호·복지용구·방문재활" });
      }
    } catch (e) {}
    buttons = ["기관 찾아줘", "한 달에 얼마나 들어?"];
  }

  /* ⑤ 기관 검색 — 카탈로그에 있는 것만, 조건과 함께 */
  if (!lines.length && A4_INTENT.find.test(q)) {
    const region = _a4Region(q), svc = _a4Svc(q);
    providers = a4Providers(region, svc, 3);
    if (providers && providers.total) {
      lines.push(`${[region, svc].filter(Boolean).join(" · ") || "전국"} 조건으로 ${providers.total.toLocaleString()}곳이 있어요 — 세 곳만 먼저 보여드릴게요.`);
      for (const p of providers.rows) lines.push(`· ${p.name}(${p.sido} ${p.gu}) — ${p.svcs.join("·")}`);
      lines.push("재가·돌봄 화면에서 지역·급여종류로 더 좁혀 보실 수 있어요.");
      cite.push({ source: "장기요양기관 목록(예시 데이터)", title: `${[region, svc].filter(Boolean).join(" · ") || "전국"} ${providers.total.toLocaleString()}곳` });
    } else {
      lines.push("재가·돌봄 화면에서 지역과 급여종류를 고르시면 기관을 바로 찾아드릴게요.");
      lines.push("공식 정보(정원·인력·평가등급)는 공단 기관검색(longtermcare.or.kr)에서 확인하실 수 있어요.");
    }
    buttons = ["재가·돌봄 화면 열기", "어떤 서비스를 받을 수 있어?"];
  }

  /* ⑥ FAQ — 위에서 안 잡힌 질문 */
  if (!lines.length) {
    try {
      if (typeof LTC_FAQ !== "undefined") {
        let best = null;
        for (const f of LTC_FAQ) {
          let sc = 0;
          for (const k of f.kw) { if (q.indexOf(k) >= 0) sc += k.length; }
          if (sc && (!best || sc > best.sc)) best = { f: f, sc: sc };
        }
        if (best) {
          lines.push(String(best.f.a).replace(/\*\*/g, ""));
          cite.push({ source: "노인장기요양보험 제도 안내", title: best.f.q });
          buttons = ["등급 신청은 어떻게 해?", "재가·돌봄 화면 열기"];
        }
      }
    } catch (e) {}
  }

  /* ⑦ 응급 — 조치가 먼저지만, 보호자가 그다음에 무엇을 할지도 남겨둔다(경황 없을 때 다시 찾기 어렵다) */
  if (triage) {
    /* 측정으로 잡힌 경보는 **무슨 수치를 보고 그러는지** 밝힌다 — 근거 없는 경보는 다음번에 무시당한다.
       지표가 여럿 울리면 심한 것부터(rpmTriage가 이미 정렬해 둔 순서) */
    if (triage.rpm) {
      const r = triage.rpm;
      (r.alerts || []).forEach(function (a) {
        lines.push(`${r.elder.relation} ${r.elder.name}님 ${a.label} — ${a.text}(${a.latest.label} 자동 감지).`);
        (a.reasons || []).forEach(function (x) { lines.push("· " + x); });
      });
      lines.push("가정용 기기가 잡은 값이라 진단은 아니에요 — 그래서 더더욱 의료진이 직접 보셔야 해요.");
      /* 조용한 지표도 한 줄 — '무엇을 지켜보고 있는지' 알면 보호자의 불안이 줄어든다 */
      try {
        const quiet = (typeof rpmQuiet === "function") ? rpmQuiet(r) : [];
        if (quiet.length) lines.push("같이 보고 있는 " + quiet.map(function (x) { return x.label + " " + x.latest; }).join(" · ") + "는 지금 이상 없어요.");
      } catch (e) {}
    }
    if (!lines.length) lines.push("지금은 상담보다 조치가 먼저예요 — 진정되고 나면 돌봄 준비를 이어서 도와드릴게요.");
    buttons = triage.level === "critical" ? ["지금 연결 가능한 의사", "재가·돌봄 화면 열기"] : ["지금 연결 가능한 의사", "등급 신청은 어떻게 해?"];
    if (triage.rpm) cite.unshift({ source: "원격 모니터링(RPM) 측정값",
      title: `${triage.rpm.elder.name}님 ${triage.rpm.alerts.map(function (a) { return a.label; }).join("·")} 추이`,
      snippet: triage.rpm.reasons[0] });
  }

  if (!lines.length) return null;

  /* 보호자 상황을 알면 한 줄 덧붙인다(등급 유무가 갈림길) — 단 응급일 때는 붙이지 않는다.
     지금 병원에 가야 하는 사람에게 등급 신청 이야기를 얹으면 정작 해야 할 일이 묻힌다. */
  if (!triage && need.elder && !/등급/.test(lines.join(""))) {
    lines.push(`${need.elder.relation} ${need.elder.name}님 건강관리가 등록돼 있어요 — 등급이 아직 없으시면 신청부터 도와드릴게요.`);
  }

  const g = (typeof homecareGuard === "function") ? homecareGuard(lines, { triage: triage }) : { lines: lines, violations: [] };
  try { if (typeof hcGuardLog === "function") hcGuardLog(q, g.violations); } catch (e) {}
  if (g.blocked) return { handback: { to: g.handback || "A1", reason: "medical-guard" } };
  if (!cite.length) cite = a4Retrieve(q, 2);
  /* 대화 버블은 마크다운을 렌더하지 않는다 — 강조 기호가 그대로 보이면 오히려 읽기를 방해한다 */
  g.lines = (g.lines || []).map(function (l) { return String(l).replace(/\*\*/g, ""); });
  return { agent: "A4", lines: g.lines, cards: [], buttons: buttons.slice(0, 3), cite: cite.slice(0, 3),
    nav: nav, calc: calc, providers: providers, emergency: g.emergency || null, guard: g.violations };
}

try { if (typeof window !== "undefined") { window.__hifinA4 = { answer: homecareAgent, need: _a4Need, providers: a4Providers, retrieve: a4Retrieve }; } } catch (e) {}
