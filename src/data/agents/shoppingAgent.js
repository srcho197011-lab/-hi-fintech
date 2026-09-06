/* ══════════════ A3 · 건강쇼핑 에이전트 (Phase C) ══════════════
   최고의 임무: **비교해서 회원이 스스로 고르게 한다.**
     ① 필요 도출 — 회원 건강상태(위험 질환)에서 관리 영역을 먼저 정한다(수치 해석은 하지 않는다 → A1)
     ② 후보 수집 — 플랫폼 안팎(시장 유통가 기준 제품 포함)을 같은 표에 올린다
     ③ 비교·선택 가이드 — 1일 단가·성분 함량·성분당 단가를 정규화해 기준을 밝히고 보여준다
   담당 밖(질환·수치·복용량 A1 / 보장·청구 A2 / 예약·연결 A0 / 돌봄 A4)은 핸드백.
   모든 응답은 shoppingGuard(헌법 6조)를 통과해야 나간다. */

/* A1(주치의) 인계 — 섭취 시기·상호작용은 비교표가 답할 문제가 아니다(H-1 수선:
   「오메가3 언제 먹어요?」가 카테고리만 걸려 비교표로 응답되던 결함) */
const A3_TO_A1 = /(무슨\s*병|질환이|증상|수치\s*의미|해석해|생체나이|이\s*수치|정상\s*범위|몇\s*알\s*먹|복용량|하루\s*몇\s*(정|알|캡슐)|같이\s*먹어도|병용|약\s*(부작용|상호)|언제\s*먹|공복|식후|식전|아침에\s*먹|저녁에\s*먹|자기\s*전\s*먹|먹는\s*시간|복용\s*시간|임신|수유|(당뇨|고혈압|고지혈|지방간|빈혈|암)\s*(맞지|맞나|인가|일까|이야|인지))/;
const A3_TO_A2 = /(보험|보장|실손|청구|보험금|보험료|휴면)/;
const A3_TO_A0 = /(검진\s*예약|예약해\s*줘|센터\s*찾|데이터\s*연결|결과지\s*올리|본인인증|로그인)/;
const A3_TO_A4 = /(간병|돌봄|방문간호|방문요양|요양등급|장기요양|요양원)/;
function _a3Outbound(q) {
  const s = String(q || "");
  if (A3_TO_A2.test(s)) return { to: "A2", reason: "insurance" };
  if (A3_TO_A4.test(s)) return { to: "A4", reason: "homecare" };
  if (A3_TO_A1.test(s)) return { to: "A1", reason: "checkup-result" };
  if (A3_TO_A0.test(s)) return { to: "A0", reason: "booking" };
  return null;
}

/* ── 질문 → 비교 카테고리 추론(카탈로그 카테고리명·동의어) ── */
const A3_CAT_ALIAS = {
  "오메가3": ["오메가3", "오메가쓰리", "epa", "dha", "혈행", "중성지방", "콜레스테롤", "고지혈"],
  "루테인": ["루테인", "눈영양제", "눈에좋은", "황반"],
  "프로바이오틱스": ["프로바이오틱스", "유산균", "장건강", "배변"],
  "밀크씨슬": ["밀크씨슬", "실리마린", "간영양제", "간에좋은", "간수치", "지방간"],
  "비타민D": ["비타민d", "비타민디", "뼈건강", "골밀도", "골다공"],
  "마그네슘": ["마그네슘"],
  "비타민C": ["비타민c", "비타민씨"],
  "종합비타민": ["종합비타민", "멀티비타민"],
  "홍삼": ["홍삼", "면역"],
  "콜라겐": ["콜라겐", "피부"],
  "아연": ["아연"],
  "혈압계": ["혈압계", "혈압측정"],
  "혈당측정": ["혈당측정", "혈당기", "혈당계", "시험지"],
  "체성분·체중": ["체중계", "체성분"],
  /* [확장] 홈케어 의료기기 — 나머지 카테고리도 이름으로 찾을 수 있게 */
  "체온·산소": ["체온계", "산소포화도", "산소측정"],
  "네블라이저": ["네블라이저", "흡입기", "분무기"],
  "보청기": ["보청기", "소리증폭", "집음기"],
  "안마·마사지": ["안마기", "마사지기", "안마의자"],
  "온열·찜질": ["찜질기", "온열기", "온열매트"],
  "저주파·EMS": ["저주파", "ems"],
  "요실금·골반": ["요실금", "골반底", "케겔"],
  /* [확장] 건강식단 — 하위 카테고리마다 축이 다르므로 각각 연결한다(섞어 비교하지 않는다) */
  "맞춤도시락": ["맞춤도시락", "건강도시락", "도시락"],
  "질환케어": ["질환케어", "환자식", "당뇨식단", "케어식단", "연화식"],
  "균형영양식": ["균형영양식", "영양음료", "식사대용"],
  "단백질": ["단백질", "프로틴", "닭가슴살"],
  "밀키트": ["밀키트"],
  /* [스킨] 6대 분류 — agentRegistry의 A3 scope 단어와 **반드시 함께** 넣는다(별칭만 넣으면 답변불가가 된다) */
  "클렌징 케어": ["클렌징", "클렌징폼", "클렌징오일", "세안제", "각질", "필링", "토너패드", "클렌저"],
  "보습·장벽 케어": ["보습", "수분크림", "진정크림", "토너", "스킨로션", "에센스", "세럼", "앰플", "피부장벽", "미스트"],
  "자외선·환경 보호": ["선크림", "썬크림", "자외선차단", "선케어", "선스틱", "선쿠션", "선팩트", "spf"],
  "기능성·트러블 케어": ["기능성화장품", "미백화장품", "주름개선", "트러블케어", "모공관리", "아이크림", "아이세럼"],
  "더마·전문 케어": ["더마", "더마코스메틱", "시카", "저자극화장품", "민감성화장품", "시술후관리", "시트마스크", "마스크팩"],
  "디바이스·이너뷰티": ["뷰티디바이스", "홈뷰티", "피부측정", "갈바닉", "led마스크"],
  "간편식": ["간편식", "반찬"],
  "건강차": ["건강차", "약선차"],
  "AI맞춤식": ["ai맞춤식", "맞춤식단"],
};
function _a3Category(q) {
  const t = String(q || "").toLowerCase().replace(/\s+/g, "");
  let best = null;
  for (const cat in A3_CAT_ALIAS) {
    for (const w of A3_CAT_ALIAS[cat]) { if (t.indexOf(w) >= 0 && (!best || w.length > best.len)) best = { cat: cat, len: w.length }; }
  }
  return best ? best.cat : null;
}

/* ── 필요 도출 — 회원 건강상태에서 관리 영역을 찾는다(수치 해석 금지) ── */
function _a3Need(ctx) {
  const m = ctx && ctx.m;
  const risks = (m && (m.highRiskDiseases || [])) || [];
  if (!risks.length) return null;
  let hit = null;
  try {
    if (typeof COMM_DISEASE !== "undefined") {
      for (const d of COMM_DISEASE) {
        if (risks.some(function (r) { return d.kw.some(function (k) { return String(r).indexOf(k) >= 0; }); })) { hit = d; break; }
      }
    }
  } catch (e) {}
  if (!hit) return null;
  /* 관리 영역 → 카테고리 후보(온톨로지 영역명과 카탈로그 카테고리 연결) */
  const AREA_CAT = { "혈행": "오메가3", "간": "밀크씨슬", "장": "프로바이오틱스", "눈": "루테인", "혈당": "혈당측정", "혈압": "혈압계", "관절": "종합비타민" };
  const cat = (hit.areas || []).map(function (a) { return AREA_CAT[a]; }).filter(Boolean)[0] || null;
  return { disease: hit.label, area: (hit.areas || [])[0], category: cat, note: hit.note };
}

/* ── 진입점 ──
   반환: { agent:"A3", lines, buttons, cite, nav, catalog, compare } | { handback } | null */
/* ── 이 카테고리가 화장품인가 ── 화장품이면 건기식 가드가 아니라 화장품 가드를 태운다 */
function _a3IsSkin(cat) {
  try { if (typeof SKIN_CAT_LIST !== "undefined") return SKIN_CAT_LIST.indexOf(cat) >= 0; } catch (e) {}
  return false;
}
/* 법령이 다르면 가드도 다르다 — 건기식 고지문을 화장품에 붙이면 그 자체가 잘못된 표시다 */
function _a3Guard(cat, lines) {
  if (_a3IsSkin(cat) && typeof skinGuard === "function") return skinGuard(lines, {});
  return shoppingGuard(lines, {});
}

function shoppingAgent(question, ctx) {
  const q = String(question || "");
  ctx = ctx || {};
  /* [Phase E] 협주 파트 호출에서는 핸드백하지 않는다 — 라우팅은 협주가 이미 정했다(경계는 ensembleGuard ②가 지킨다) */
  const ob = (ctx && ctx.ensemble) ? null : _a3Outbound(q);
  if (ob) return { handback: ob };

  /* ⓪-0 결핍 처방전 질의 — "내 검진에 맞는 영양제"는 내 수치를 근거로 답한다(광고형 추천과 구분) */
  if (/(내\s*검진|검진\s*결과.{0,6}(맞|기준)|내\s*수치.{0,6}(맞|기준)|결핍|부족한\s*(영양|성분)|처방전|나한테\s*(맞|필요)|나에게\s*(맞|필요))/.test(q)) {
    let m2 = null;
    try { m2 = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null) || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null); } catch (e) {}
    let R = null; try { R = (m2 && typeof nutriRx === "function") ? nutriRx(m2) : null; } catch (e) {}
    if (R) {
      const ls = [];
      if (R.medical.length) ls.push(`먼저 알려드릴 게 있어요 — ${R.medical[0].name} 수치 때문에 제품보다 ${R.medical[0].dept} 진료가 먼저예요. ${R.medical[0].note}`);
      if (R.rx.length) {
        ls.push(`${(m2.name || "회원")}님 ${R.asOf || "최근"}년 검진 기준으로 우선순위를 뽑았어요 — ${R.rx.map((x, i) => `${i + 1}) ${x.ing}(${x.name} ${x.value}${x.unit})`).join(" · ")}.`);
        ls.push(R.rx[0].why);
        if (R.dup.length) ls.push(`다만 ${R.dup.join("·")}는 이미 드시고 있어서 중복이 될 수 있어요 — 기존 제품부터 확인해 주세요.`);
      } else if (R.general.length) ls.push(R.general[0]);
      ls.push("건강기능식품은 치료제가 아니고 이 안내는 진단이 아니에요 — 복용 중인 약이 있으면 의사·약사와 상의하세요.");
      return { agent: "A3", lines: ls, cards: [], buttons: ["건강쇼핑 가기"], cite: [{ source: "내 검진 데이터", title: "결핍 처방전(수치 근거)" }],
        nav: { key: "shop", label: "건강쇼핑" }, catalog: { products: [], values: [] }, compare: null, guard: [] };
    }
  }
  /* ⓪-0c 가족 세트 질의 — 가족 건강정보는 쓰지 않고 연령·성별 일반 권장으로 구성한다 */
  if (/(가족\s*(세트|영양제|건강\s*세트|꺼|것)|부모님\s*영양제|아이\s*영양제|온\s*가족|우리\s*가족.{0,6}(영양|챙))/.test(q)) {
    let m4 = null;
    try { m4 = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null) || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null); } catch (e) {}
    let S = null; try { S = (m4 && typeof famSetBuild === "function") ? famSetBuild(m4) : null; } catch (e) {}
    if (S && S.count >= 2) {
      const ls = [
        `가족 ${S.count}명 기준으로 세트를 구성해봤어요 — ${S.members.map((x) => `${x.name}(${x.items.map((i) => i.ing).join("·")})`).join(" / ")}.`,
        `합계 ${S.total.toLocaleString()}원 · 적립 ${S.reward.toLocaleString()}원(가족 묶음 보너스 ${Math.round(S.bonusRate * 100)}% 포함)이에요.`,
        "가족 구성원 추천은 나이·성별에 따른 일반 권장이에요 — 가족의 건강검진 정보는 본인 동의 없이 쓰지 않아요. 건강기능식품은 치료제가 아니고, 이미 드시는 성분과 겹치지 않는지 확인해 주세요.",
      ];
      return { agent: "A3", lines: ls, cards: [], buttons: ["건강쇼핑 가기"], cite: [{ source: "가족 구성·생애주기", title: "가족 건강 세트" }],
        nav: { key: "shop", label: "건강쇼핑" }, catalog: { products: [], values: [] }, compare: null, guard: [] };
    }
  }
  /* ⓪-0b 복용 순응·효과 질의 — 기록된 순응률과 '함께 기록된 변화'로 답한다(효과 단정 금지) */
  if (/(복용\s*(체크|기록|했|현황)|먹었|얼마나\s*먹|효과\s*(있|없|어때|봤)|순응|잘\s*듣|성과\s*(리포트|확인))/.test(q)) {
    let m3 = null;
    try { m3 = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null) || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null); } catch (e) {}
    let O = null; try { O = (m3 && typeof adhOutcome === "function") ? adhOutcome(m3) : null; } catch (e) {}
    if (O && O.summary.items.length) {
      const S = O.summary; const ls = [];
      ls.push(`복용 기록 기준으로 총 ${S.totalDays}일, 평균 순응률 ${S.avgRate}%예요(오늘 ${S.checkedToday}/${S.items.length} 체크).`);
      if (O.rows.length) {
        const r = O.rows[0];
        ls.push(`${r.ing} ${r.days}일 복용 기간과 함께 ${r.name}이 ${r.from}${r.unit} → ${r.to}${r.unit}로 ${r.better ? "개선 방향" : "관리 필요 방향"}으로 기록됐어요.`);
        ls.push("다만 생활습관·치료 등 다른 요인이 함께 작용하기 때문에 제품의 효과로 단정하지는 않아요 — 개선분은 원하시면 4세대 성과 자산으로 기록해 드려요.");
      } else ls.push("다음 검진이 연계되면 복용 기간과 함께 기록된 변화를 보여드릴게요 — 지금은 꾸준히 체크하는 게 가장 중요해요.");
      return { agent: "A3", lines: ls, cards: [], buttons: ["건강쇼핑 가기"], cite: [{ source: "복용 기록·검진 데이터", title: "순응률·성과 리포트" }],
        nav: { key: "shop", label: "건강쇼핑" }, catalog: { products: [], values: [] }, compare: null, guard: [] };
    }
  }
  /* ⓪-1 정기배송(재구매) 질의 — 커머스 담당 에이전트가 소진 예측·구독 현황을 직접 답한다 */
  if (/(정기\s*배송|정기\s*구독|구독\s*(현황|관리)|재구매|자동\s*배송|떨어질\s*때|떨어지면|다\s*먹었|언제\s*떨어져|얼마나\s*남았)/.test(q)) {
    let m = null;
    try { m = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null) || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? selfMember() : null); } catch (e) {}
    let r = null;
    try { r = (m && typeof TOOL_RUN !== "undefined" && TOOL_RUN.subs) ? TOOL_RUN.subs(m) : null; } catch (e) {}
    if (r && r.lines) return { agent: "A3", lines: r.lines, cards: [], buttons: (r.buttons || ["건강쇼핑 가기"]).slice(0, 3),
      cite: [{ source: "하이핀 정기배송", title: "소진 예측·구독 원장" }], nav: { key: "shop", label: "건강쇼핑" },
      catalog: { products: [], values: [] }, compare: null, guard: [] };
  }
  const wantsCompare = /(비교|추천|뭐가\s*(나|좋)|뭐\s*먹|먹으면\s*좋|어떤\s*(게|걸)|골라|고르|가성비|싼|저렴|차이|사고\s*싶|살까)/.test(q);
  const asksEfficacy = /(먹으면.{0,8}(낫|나아|좋아|효과)|효과\s*있|정말\s*(되|좋)|도움\s*되|치료(가\s*)?되)/.test(q);
  let cat = _a3Category(q);
  const need = _a3Need(ctx);
  let lines = [], buttons = [], cite = [], catalog = { products: [], values: [] }, cmp = null;
  let nav = { key: "shop", label: "건강쇼핑" };

  /* ⓪ 피부 즉시 진료 신호 — **상담보다 위에 있다.** 제품 추천을 하지 않고 진료 안내만 낸다.
     (A4 응급 트리아지와 같은 사상: 덧붙이는 게 아니라 앞에 세운다) */
  let urgent = null;
  try { urgent = (typeof skinUrgent === "function") ? skinUrgent(q) : null; } catch (e) {}
  if (urgent) {
    const uLines = [urgent.line];
    if (urgent.level !== "critical") uLines.push("피부 증상 자체는 AI 주치의가 이어서 봐드릴게요 — 제품 안내는 그다음에 도와드릴게요.");
    let uNav = { key: "shop", label: "건강쇼핑" };
    let uBtn = ["119 안내"];
    if (urgent.dept) {
      try { const g = (typeof skinTeleGo === "function") ? skinTeleGo(urgent.dept) : null; if (g) { uNav = { key: g.to, label: "비대면 원격진료" }; uBtn = [g.label, "병원 찾기"]; } } catch (e) {}
    }
    return { agent: "A3", lines: uLines, cards: [], buttons: uBtn, cite: [{ source: "안전 안내", title: "피부 즉시 진료 신호" }],
      nav: uNav, catalog: { products: [], values: [] }, compare: null, emergency: true, guard: [] };
  }

  /* ⓪-b 피부 고민 상담 — 고민 → 제품군 → (선을 넘으면) 진료 */
  let concern = null;
  try { concern = (typeof skinConcernOf === "function") ? skinConcernOf(q) : null; } catch (e) {}
  if (concern && !cat) cat = concern.primary;

  /* ① 카테고리를 못 잡았는데 비교를 원하면 — 건강상태에서 필요를 먼저 도출 */
  if (!cat && need && need.category) cat = need.category;

  /* ② 비교 실행 */
  if (cat && (wantsCompare || _a3Category(q) || need || concern)) {
    try { cmp = (typeof compareProducts === "function") ? compareProducts(cat, {}) : null; } catch (e) { cmp = null; }
  }
  if (cmp) {
    if (concern) {
      try { const cl = (typeof skinConcernLines === "function") ? skinConcernLines(concern, null) : null; if (cl) lines = lines.concat(cl.slice(0, 3)); } catch (e) {}
    }
    if (need && need.category === cat) lines.push(`${need.disease} 관리가 필요하신 상태라 ${need.area} 관리 영역부터 보여드릴게요.`);
    try { lines = lines.concat(compareToLines(cmp)); } catch (e) {}
    try { catalog = compareFacts(cmp); } catch (e) {}
    /* 근거 — 성분 출처·가격 출처·질환 영역 매핑 */
    const withSpec = cmp.rows.filter(function (r) { return r.specSrc; });
    if (withSpec.length) cite.push({ source: "제품 라벨 표시(다나와 상세)", title: withSpec.map(function (r) { return r.name.slice(0, 14); }).slice(0, 2).join(" · ") });
    cite.push({ source: "가격 조사", title: [...new Set(cmp.rows.map(function (r) { return r.priceSource; }))].join("·") + " 기준" });
    /* 온톨로지 근거는 **건강상태가 이 카테고리를 고른 경우에만** — 회원이 직접 지목한 성분에 붙이면 근거가 어긋난다 */
    if (need && need.category === cat) cite.push({ source: "커머스 온톨로지", title: need.disease + " → " + need.area + " 관리 영역" });
    buttons = ["건강쇼핑 가기", "다른 성분도 비교해줘"];
    /* 고민에 진료 연계 조건이 붙어 있으면 문장으로 알리고 원격진료로 연결한다(새 화면을 만들지 않는다) */
    if (concern && concern.refer && concern.dept) {
      let deptLabel = "피부과";
      try { deptLabel = (typeof skinDeptLabel === "function") ? skinDeptLabel(concern.dept) : deptLabel; } catch (e) {}
      lines.push(`※ ${concern.refer} ${deptLabel} 상담을 받아보시는 게 좋아요 — 제품으로 붙잡고 있을 일이 아니에요.`);
      try { const g = (typeof skinTeleGo === "function") ? skinTeleGo(concern.dept) : null; if (g) buttons = [g.label].concat(buttons); } catch (e) {}
      cite.push({ source: "피부 고민 온톨로지", title: concern.label + " → " + concern.primary });
    }
  }

  /* ②-b 효능 질문 — 인정된 기능성 표시 범위 안에서만 설명한다(치료 단정 금지) */
  if (!lines.length && asksEfficacy) {
    let claim = null;
    try {
      const pool = ((typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : []).concat((typeof DEVICE_PRODUCTS !== "undefined") ? DEVICE_PRODUCTS : []);
      const p0 = cat ? pool.find(function (p) { return p.category === cat && p.claim; }) : null;
      claim = p0 ? p0.claim : null;
    } catch (e) {}
    lines = [
      claim ? `${cat}는 「${claim}」로 인정된 기능성 범위 안에서 도움을 줄 수 있어요.` : "건강기능식품은 인정된 기능성 표시 범위 안에서 도움을 줄 수 있어요.",
      "질병을 낫게 하거나 약을 대신하지는 않아요 — 지금 치료 중이시면 담당 의사와 상의하시는 게 우선이에요.",
      "원하시면 같은 목적의 제품을 성분·가격 기준으로 비교해 드릴게요.",
    ];
    buttons = cat ? [cat + " 비교해줘", "건강쇼핑 가기"] : ["건강쇼핑 가기"];
    if (cat) cite.push({ source: "인정 기능성 표시(제품 라벨)", title: cat });
  }

  /* ③ 비교가 아니면 기존 커머스 상담(제품·공급사·카테고리) */
  if (!lines.length) {
    let cc = null;
    try { cc = (typeof commerceCounsel === "function") ? commerceCounsel(q) : null; } catch (e) {}
    if (cc && cc.bubbles && cc.bubbles.length) {
      lines = cc.bubbles.filter(function (b) { return b.kind !== "card"; }).map(function (b) { return String(b.text || "").replace(/\*\*/g, ""); }).filter(Boolean);
      const cards = cc.bubbles.filter(function (b) { return b.kind === "card" && b.card; }).map(function (b) { return b.card; });
      buttons = (cc.quicks || []).slice(0, 3);
      if (lines.length) {
        const g1 = _a3Guard(cat, lines);
        try { shopGuardLog(q, g1.violations); } catch (e) {}
        if (g1.blocked) return { handback: { to: g1.handback || "A1", reason: "diagnosis-guard" } };
        return { agent: "A3", lines: g1.lines, cards: cards, buttons: buttons, cite: cite, nav: nav, catalog: catalog, compare: null, guard: g1.violations };
      }
    }
  }
  if (!lines.length) return null;

  const g = _a3Guard(cat, lines);
  try { shopGuardLog(q, g.violations); } catch (e) {}
  if (g.blocked) return { handback: { to: g.handback || "A1", reason: "diagnosis-guard" } };
  return { agent: "A3", lines: g.lines, cards: [], buttons: buttons.slice(0, 3), cite: cite.slice(0, 3), nav: nav, catalog: catalog, compare: cmp, guard: g.violations };
}

try { if (typeof window !== "undefined") { window.__hifinA3 = { answer: shoppingAgent, category: _a3Category, need: _a3Need }; } } catch (e) {}
