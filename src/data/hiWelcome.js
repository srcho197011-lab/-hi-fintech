/* ══════════════ 하이 웰컴 — 첫 로그인 안내 온보딩(hiWelcome.js) ══════════════
   하이의 첫 임무: 회원이 "자기가 하고 싶은 건강활동"을 제대로 찾아서 실제로 하도록 안내한다.
   ⚠️ 원칙:
     ① 기능 나열이 아니라 회원의 말(하고 싶은 일)로 묻는다 — "건강검진 받고 싶어요"처럼.
     ② 안내는 반드시 화면으로 착지한다 — 설명만 하고 끝나지 않는다(nav 필수).
     ③ 순서는 회원 상태가 정한다 — 검진결과·보험 연결 여부로 오늘 먼저 할 일이 앞에 온다.
     ④ 여기서 만드는 응답은 질의 전송이 아니라 로컬 생성이다 — 미답변 로그를 오염시키지 않는다.
     ⑤ 섹션 설명은 AGENT_SEC_GUIDES(섹션 가이드) 단일 소스를 재사용한다 — 문구 이원화 금지. */

/* 회원이 하고 싶은 건강활동 — 회원 언어(want) → 섹션(sec/nav) 매핑.
   sec = AGENT_SEC_GUIDES의 k(설명 재사용), nav = 실제 이동 화면 키. 다를 수 있다(예: 원격진료). */
const HI_WANT = [
  { k: "checkup",  ic: "🩺", want: "건강검진 받고 싶어요",        hint: "내 주변 검진센터 예약 + 무료 3종",      sec: "checkup",    nav: "checkup" },
  { k: "upload",   ic: "📄", want: "검진결과 분석해줘",           hint: "사진 한 장이면 1분 · 정밀리포트",       sec: "onboarding", nav: "onboarding" },
  { k: "report",   ic: "📊", want: "내 건강상태 알고 싶어요",      hint: "생체나이·이상항목·질병 위험",           sec: "manage",     nav: "manage" },
  { k: "tele",     ic: "💬", want: "아픈데 진료받고 싶어요",       hint: "검진결과를 아는 전문의 비대면 진료",     sec: null,         nav: "tele" },
  { k: "insurance",ic: "🛡️", want: "내 보험 부족한 게 뭔지 봐줘",  hint: "보장 공백 분석 · 청구 · 치료비",        sec: "insurance",  nav: "insurance" },
  { k: "shop",     ic: "💊", want: "뭘 먹어야 좋을지 알려줘",      hint: "내 검진 수치가 지목한 영양·식단",       sec: "shop",       nav: "shop" },
  { k: "homecare", ic: "👪", want: "부모님 돌봄이 걱정돼요",       hint: "방문간호·요양·간병 매칭",              sec: "homecare",   nav: "homecare" },
  { k: "wallet",   ic: "💰", want: "내 적립금·혜택 보여줘",        hint: "HTK 적립 원장 · 치료비 전용 30%",       sec: "wallet",     nav: "wallet" },
  { k: "intro",    ic: "🏠", want: "하이핀이 뭐예요?",             hint: "무엇을 해주는 곳인지 3분 안에",         sec: "intro",      nav: "intro" },
];
/* 자리가 고정된 둘 — 처음은 항상 '검진 예약'(모든 여정의 입구), 끝은 항상 '하이핀이 뭐예요?'(처음 온 분의 질문).
   그 사이 순서만 회원 상태가 정한다. */
const HI_WANT_FIRST = "checkup";
const HI_WANT_LAST = "intro";
/* 검진 예약 안내 — 회원이 가장 먼저 만나는 문장.
   국가검진 대상 여부를 앞세우지 않는다. 하이핀에서 예약해야 무료 3종이 붙는다는 것이 핵심이기 때문이다. */
const HI_WANT_CHECKUP_GUIDE = "건강검진 예약을 도와드릴게요. 전국 제휴 검진센터를 지역·항목·가격으로 비교해서 원하는 날짜에 예약하실 수 있어요. 국가검진 대상이시면 본인부담 0원으로, 종합검진은 추가 항목까지 함께 잡아드려요.";
const HI_WANT_CHECKUP_FREE3 = "그리고 하이핀을 통해 예약하고 검진을 받으시면 무료 3종 서비스가 함께 제공돼요 — ① 검진대비보험(보험료 0원 · 암 진단금 최대 1,000만원) ② AI 정밀리포트(생체나이·질병 위험 분석) ③ 전문가 상담. 세 가지 모두 회원 부담 0원이에요.";
const HI_WANT_CHECKUP_BTNS = ["내 주변 검진센터 찾아줘", "무료 3종이 뭐예요?", "어떤 검진 받아야 해?"];

/* '하이핀이 뭐예요?' — 섹션 가이드는 화면 안내문이라 처음 온 분의 질문에는 답이 되지 않는다.
   무엇을 해주는 곳인지, 돈이 드는지, 무엇부터 하면 되는지 세 가지를 먼저 말한다. */
const HI_WANT_INTRO_GUIDE = "하이핀은 건강검진을 중심으로 건강관리·진료·보험·건강쇼핑을 하나로 잇는 AI 건강금융 플랫폼이에요. 검진 결과를 올리시면 제가 분석해서 지금 무엇을 하면 좋을지 알려드리고, 필요한 진료·보장·영양까지 이어드려요.";
const HI_WANT_INTRO_FREE = "이용료는 없어요. 하이핀을 통해 검진을 예약하고 받으시면 무료 3종 서비스(검진대비보험 0원 · AI 정밀리포트 · 전문가 상담)를 함께 드리고, 건강쇼핑에서는 마진의 50%를 적립금으로 돌려드려요.";
const HI_WANT_INTRO_BTNS = ["무료 3종이 뭐예요?", "검진결과 올리는 법", "적립금은 어떻게 쌓여요?"];

/* 원격진료는 섹션 가이드에 별도 항목이 없다 — 여기서 단일 문구로 관리(설명 이원화를 피하려 예외를 명시) */
const HI_WANT_TELE_GUIDE = "비대면 원격진료를 열어드릴게요. 시·도 → 시·군·구 → 진료과로 좁혀 우리 동네 전문의를 찾고, 예진부터 처방·약국 수령까지 한 흐름으로 이어져요. 제 검진 데이터를 같이 보고 상담해요.";
const HI_WANT_TELE_BTNS = ["증상으로 진료과 찾기", "지금 연결 가능한 의사"];

/* ── 시간대 인사 ── */
function _hiTimeHello() {
  let h = 12; try { h = new Date().getHours(); } catch (e) {}
  if (h < 6)  return { ko: "늦은 시간까지 애쓰시네요", em: "🌙" };
  if (h < 11) return { ko: "좋은 아침이에요",          em: "☀️" };
  if (h < 14) return { ko: "점심은 챙기셨어요?",        em: "🌤️" };
  if (h < 18) return { ko: "오후도 힘내세요",          em: "🌈" };
  if (h < 22) return { ko: "오늘 하루 수고 많으셨어요",  em: "🌆" };
  return { ko: "늦었는데 와주셨네요",                  em: "🌙" };
}
/* 이 세션에서 웰컴을 이미 보여줬는가 — 로그인 1회만 크게 인사한다 */
function hiWelcomeSeen() { try { return !!sessionStorage.getItem("hifin_hi_welcome"); } catch (e) { return false; } }
function hiWelcomeMark() { try { sessionStorage.setItem("hifin_hi_welcome", "1"); } catch (e) {} }
/* 이 회원에게 웰컴을 처음 보여주는가(계정 최초) — 문구를 다르게 쓴다 */
function _hiFirstEver(m) {
  try { const k = "hifin_hi_welcomed_" + ((m && m.email) || "self"); if (localStorage.getItem(k)) return false; localStorage.setItem(k, "1"); return true; }
  catch (e) { return false; }
}

/* ── 웰컴 인사말 — 밝게, 짧게, 그리고 바로 다음 행동으로 ── */
function hiWelcomeGreeting(m) {
  const who = (typeof agentWho === "function") ? agentWho() : ((m && m.name) || "회원");
  const T = _hiTimeHello();
  const first = _hiFirstEver(m);
  let ob = null; try { ob = (m && typeof onboardStatus === "function") ? onboardStatus(m) : null; } catch (e) {}
  const line = first
    ? `${who}님, 반가워요! ${T.em} 저는 ${who}님 전담 AI 매니저 <b>하이</b>예요.`
    : `${who}님, ${T.ko}! ${T.em} 다시 뵈어 반가워요.`;
  let sub;
  if (ob && !ob.step1) sub = "제 첫 번째 일은 <b>하고 싶은 건강활동을 제대로 찾아드리는 것</b>이에요. 검진결과만 연결되면 나머지는 제가 다 챙길게요.";
  else if (ob && !ob.step2) sub = "검진 분석은 준비됐어요. 오늘은 <b>무엇을 하고 싶으신지</b>만 골라 주시면 제가 거기까지 데려다드릴게요.";
  else if (first) sub = "무엇을 하고 싶으신지만 알려주세요 — <b>제가 화면까지 데려다드릴게요.</b> 메뉴는 찾지 않으셔도 돼요.";
  else sub = "오늘은 <b>무엇을 하고 싶으세요?</b> 고르시면 바로 그 화면으로 모실게요.";
  return { line, sub, first, who };
}

/* ── 오늘 먼저 할 일 순서 — 회원 상태가 정한다 ── */
function hiWantList(m, n) {
  const byK = {}; HI_WANT.forEach((w) => { byK[w.k] = w; });
  let order;
  let ob = null; try { ob = (m && typeof onboardStatus === "function") ? onboardStatus(m) : null; } catch (e) {}
  if (ob && !ob.step1)       order = ["upload", "checkup", "tele", "insurance", "shop", "homecare", "report", "wallet"];
  else if (ob && !ob.step2)  order = ["report", "insurance", "checkup", "tele", "shop", "homecare", "wallet", "upload"];
  else                       order = ["report", "checkup", "tele", "insurance", "shop", "homecare", "wallet", "upload"];
  /* 앞뒤 고정 자리를 비우고 가운데만 상태 순서로 채운 뒤 다시 끼운다 */
  const mid = order.filter((k) => k !== HI_WANT_FIRST && k !== HI_WANT_LAST);
  const total = n || (mid.length + 2);
  const out = [byK[HI_WANT_FIRST]]
    .concat(mid.slice(0, Math.max(0, total - 2)).map((k) => byK[k]))
    .concat([byK[HI_WANT_LAST]]);
  return out.filter(Boolean);
}

/* ── 활동 선택 응답 — 섹션 가이드를 재사용하고 반드시 화면으로 착지시킨다 ── */
function hiWantAnswer(k, m) {
  const w = HI_WANT.find((x) => x.k === k);
  if (!w) return null;
  let guide = null, btns = [], lines2 = null;
  if (w.k === "checkup") { guide = HI_WANT_CHECKUP_GUIDE; lines2 = HI_WANT_CHECKUP_FREE3; btns = HI_WANT_CHECKUP_BTNS.slice(); }
  else if (w.k === "intro") { guide = HI_WANT_INTRO_GUIDE; lines2 = HI_WANT_INTRO_FREE; btns = HI_WANT_INTRO_BTNS.slice(); }
  else if (w.k === "tele") { guide = HI_WANT_TELE_GUIDE; btns = HI_WANT_TELE_BTNS.slice(); }
  else {
    try {
      const g = (typeof AGENT_SEC_GUIDES !== "undefined") ? AGENT_SEC_GUIDES.find((x) => x.k === w.sec) : null;
      if (g) { guide = g.guide; btns = (g.btns || []).slice(0, 3); }
    } catch (e) {}
  }
  if (!guide) guide = `${w.want.replace(/요$/, "")}시군요 — 바로 도와드릴게요.`;
  const label = (typeof AGENT_NAV_LABEL !== "undefined" && AGENT_NAV_LABEL[w.nav]) ? AGENT_NAV_LABEL[w.nav]
    : (w.k === "tele" ? "비대면 원격진료" : w.want);
  /* 회원 상태를 한 줄 덧붙인다 — 같은 안내라도 내 상황에 맞게 들리도록 */
  const extra = _hiWantContext(w.k, m);
  const lines = [guide]; if (lines2) lines.push(lines2); if (extra) lines.push(extra);
  return { lines, buttons: btns, nav: { key: w.nav, label } };
}
/* 활동별 내 상황 한 줄(데이터가 있을 때만 — 없으면 침묵) */
function _hiWantContext(k, m) {
  if (!m) return null;
  try {
    if (k === "report" || k === "upload") {
      const R = (typeof demoReport === "function") ? demoReport(m) : null;
      if (R && k === "report") return `지금 ${m.name}님은 생체나이 ${R.bio}세 · 관리가 필요한 항목이 ${(R.worstNames || []).length}개 보여요.`;
      const ob = (typeof onboardStatus === "function") ? onboardStatus(m) : null;
      if (ob && !ob.step1 && k === "upload") return "아직 검진결과가 연결되지 않았어요 — 이것부터 하면 나머지 분석이 전부 내 실제 수치 기준으로 바뀌어요.";
    }
    if (k === "insurance") {
      const g = (typeof analyzeCoverageGap === "function") ? analyzeCoverageGap(m) : null;
      if (g) return `현재 보장 충실도는 ${g.grade}(${g.score}점)이에요 — 화면에서 부족한 항목부터 짚어드릴게요.`;
    }
    if (k === "homecare") {
      const fam = (typeof familyLoad === "function") ? familyLoad(m.email, (m.name || "가")[0]) : [];
      if (fam && fam.length) return `등록된 가족 ${fam.length}분 기준으로 필요한 돌봄을 함께 봐드릴게요.`;
    }
    if (k === "wallet") {
      const w = (typeof demoWalletCalc === "function") ? demoWalletCalc(m) : null;
      if (w && w.total) return `${m.name}님은 검진 연계로 ${Number(w.total).toLocaleString()}원 상당이 이미 적립 대상이에요.`;
    }
  } catch (e) {}
  return null;
}

/* ── 하단 빠른 칩 — 섹션 안내형(회원 언어). 독 하단에 상시 노출 ── */
function hiQuickChips(m) {
  return hiWantList(m, 4).map((w) => w.want);   // 앞=검진 예약, 뒤=하이핀 소개가 고정으로 포함된다
}
/* 칩 문구 → 활동 키(칩을 눌렀을 때 로컬 응답으로 처리하기 위한 역인덱스) */
function hiWantKeyOf(text) {
  const t = String(text || "").trim();
  const w = HI_WANT.find((x) => x.want === t);
  return w ? w.k : null;
}
