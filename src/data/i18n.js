/* ══════════════ 언어 전환(KO ⇄ EN) — 번역 단일 소스 ══════════════
   해외 투자자·파트너·바이어가 이 화면을 영문으로 읽을 수 있게 한다.

   원칙 — 프롬프트(PROMPT_영문전환_언어토글)에서 정한 것을 그대로 지킨다.
   ① **없는 번역을 지어내지 않는다.** 키가 비면 한국어 원문을 그대로 보여주고 KO 배지를 단다.
      빈 문자열이나 키 이름(`nav.shop`)이 화면에 새어 나오면 실패다.
   ② **규제 문구는 번역이 아니라 병기다.** 건기식·화장품·보험 고지문은 한국어 원문이 법적 기준이라
      영문은 참고 번역으로 붙이고 "The Korean original prevails"를 함께 적는다.
   ③ **응급은 언어를 가리지 않는다.** 119·즉시 진료 안내는 EN에서 반드시 영문으로 나온다.
      못 읽는 언어로 된 응급 안내는 안내가 아니다.
   ④ **고유명사는 번역하지 않는다.** 제품명·브랜드·병원명·지역명은 그대로 둔다
      ("정관장 → Korea Ginseng Corp"으로 바꾸면 검색과 구매가 끊긴다).
   ⑤ 이번 범위는 P1(화면 뼈대)이다. 스토리·백서(P2)와 하이 답변·코퍼스(P3)는 대상이 아니다. */

const I18N_LANGS = ["ko", "en"];
const I18N_KEY = "hifin_lang";

const I18N = {
  /* ── 상단바 ── */
  "top.tagline":      { ko: "AI 헬스케어 · 핀테크", en: "AI Healthcare · Fintech" },
  "top.impact":       { ko: "임팩트기업", en: "Impact Company" },
  "top.search":       { ko: "통합 검색 (병원, 질환, 검진, 제품 등)", en: "Search hospitals, conditions, checkups, products" },
  "top.back":         { ko: "이전 화면으로", en: "Back" },
  "top.forward":      { ko: "다음 화면으로", en: "Forward" },
  "top.reload":       { ko: "새로고침", en: "Reload" },
  "top.alerts":       { ko: "알림", en: "Alerts" },
  "top.messages":     { ko: "메시지", en: "Messages" },
  "top.searchResult": { ko: "검색 결과", en: "Results" },
  "top.lang":         { ko: "언어", en: "Language" },
  "top.welcome":      { ko: "환영합니다!", en: "Welcome" },

  /* ── 사이드 내비(대분류) ── */
  "nav.home":         { ko: "HI-Fin Tech란", en: "About HI-Fin Tech" },
  "nav.home.s":       { ko: "회사 소개·비전·사회환원·커뮤니티", en: "Company · Vision · Social impact · Community" },
  "nav.checkup":      { ko: "건강검진 예약", en: "Health Checkup Booking" },
  "nav.checkup.s":    { ko: "예약·결과조회·검진보험", en: "Booking · Results · Checkup insurance" },
  "nav.care":         { ko: "검진 후 케어", en: "Post-Checkup Care" },
  "nav.care.s":       { ko: "주치의·건강현황·병원진료·재가돌봄·건강쇼핑", en: "Doctor · Status · Hospital · Home care · Shopping" },
  "nav.insurance":    { ko: "보험·치료비", en: "Insurance · Medical Costs" },
  "nav.insurance.s":  { ko: "조회·가입·청구·치료비", en: "Review · Enroll · Claim · Costs" },
  "nav.mywallet":     { ko: "나의 건강지갑", en: "My Health Wallet" },
  "nav.mywallet.s":   { ko: "금융지갑·Health NFT·우리가족건강관리", en: "Wallet · Health NFT · Family care" },
  "nav.partner":      { ko: "제휴·투자 신청", en: "Partnership · Investment" },
  "nav.partner.s":    { ko: "제휴 네트워크·회원/법인 투자", en: "Partner network · Individual & corporate investment" },
  "nav.ontology":     { ko: "온톨로지 · 하네스", en: "Ontology · Harness" },
  "nav.ontology.s":   { ko: "Ontology · Harness (운영)", en: "Ontology · Harness (Ops)" },
  "nav.alertcenter":  { ko: "알림센터", en: "Alert Center" },

  /* ── 검진 후 케어 탭 ── */
  "care.manage":      { ko: "나의 건강현황", en: "My Health Status" },
  "care.tele":        { ko: "비대면 원격진료", en: "Telemedicine" },
  "care.ai":          { ko: "하이-나의 주치의", en: "Hi · My Doctor" },
  "care.homecare":    { ko: "재가·돌봄", en: "Home Care" },
  "care.shop":        { ko: "건강쇼핑", en: "Health Shopping" },

  /* ── 건강쇼핑 ── */
  "shop.title":       { ko: "건강쇼핑", en: "Health Shopping" },
  "shop.diet":        { ko: "건강식단", en: "Health Meals" },
  "shop.supp":        { ko: "영양제", en: "Supplements" },
  "shop.skin":        { ko: "스킨 헬스케어", en: "Skin Healthcare" },
  "shop.device":      { ko: "홈케어의료기", en: "Home Medical Devices" },
  "shop.intel":       { ko: "AI 상담사", en: "AI Advisor" },
  "shop.sports":      { ko: "스포츠건강", en: "Sports & Fitness" },
  "shop.partners":    { ko: "특별제휴사", en: "Featured Partners" },
  "shop.sort":        { ko: "정렬", en: "Sort" },
  "shop.sort.reward": { ko: "적립높은순", en: "Highest reward" },
  "shop.sort.unit":   { ko: "용량당 단가순", en: "Price per volume" },
  "shop.sort.low":    { ko: "가격낮은순", en: "Price: low to high" },
  "shop.sort.high":   { ko: "가격높은순", en: "Price: high to low" },
  "shop.sort.partner":{ ko: "제휴 브랜드순", en: "Partner brands first" },
  "shop.all":         { ko: "전체", en: "All" },
  "shop.cart":        { ko: "담기", en: "Add" },
  "shop.source":      { ko: "출처", en: "Source" },
  "shop.lowest":      { ko: "최저가", en: "Lowest price" },

  /* 스킨 6대 분류 — 화면 필터와 같은 문자열을 쓴다 */
  "skin.cleansing":   { ko: "클렌징 케어", en: "Cleansing" },
  "skin.barrier":     { ko: "보습·장벽 케어", en: "Moisture & Barrier" },
  "skin.uv":          { ko: "자외선·환경 보호", en: "Sun & Environmental" },
  "skin.functional":  { ko: "기능성·트러블 케어", en: "Functional & Blemish" },
  "skin.derma":       { ko: "더마·전문 케어", en: "Derma & Professional" },
  "skin.device":      { ko: "디바이스·이너뷰티", en: "Devices & Inner Beauty" },
  "skin.concern":     { ko: "피부 고민으로 찾기", en: "Find by skin concern" },
  "skin.concern.s":   { ko: "고민 → 제품군 → 필요하면 진료까지 안내해 드려요", en: "Concern → product group → medical consultation when needed" },

  /* ── 공통 UI ── */
  "ui.close":         { ko: "닫기", en: "Close" },
  "ui.open":          { ko: "열기", en: "Open" },
  "ui.more":          { ko: "더보기", en: "More" },
  "ui.loading":       { ko: "불러오는 중…", en: "Loading…" },
  "ui.empty":         { ko: "표시할 내용이 없어요", en: "Nothing to show" },
  "ui.search":        { ko: "검색", en: "Search" },
  "ui.send":          { ko: "보내기", en: "Send" },
  "ui.confirm":       { ko: "확인", en: "Confirm" },
  "ui.cancel":        { ko: "취소", en: "Cancel" },

  /* ── 하이 독(영문 모드 안내) ── */
  "hi.name":          { ko: "하이", en: "Hi" },
  "hi.role":          { ko: "AI 매니저 · 항상 함께해요", en: "AI health manager · always with you" },
  "hi.open":          { ko: "하이와 대화하기", en: "Talk to Hi" },
  "hi.en.title":      { ko: "", en: "Hi is our AI health manager." },
  "hi.en.only":       { ko: "", en: "Consultation is currently available in Korean only." },
  "hi.en.does":       { ko: "", en: "What Hi does: checkup booking · result interpretation · coverage gap analysis · product comparison · home-care triage." },
  "hi.en.contact":    { ko: "", en: "For English inquiries, please use Partnership · Investment." },
  "hi.en.switch":     { ko: "", en: "Switch to Korean to start a consultation." },
  "hi.en.btn.ko":     { ko: "", en: "한국어로 상담하기 (Switch to Korean)" },
  "hi.en.btn.partner":{ ko: "", en: "Partnership · Investment" },
};

/* ── 규제 고지 — **병기**한다. 영문으로 갈아치우지 않는다(한국어 원문이 법적 기준) ── */
const I18N_NOTICE = {
  supplement: {
    ko: "건강기능식품은 질병의 예방·치료를 위한 의약품이 아니에요.",
    en: "Health functional foods are not medicines intended to prevent or treat disease.",
  },
  cosmetic: {
    ko: "화장품은 인체를 청결·미화하고 피부·모발의 건강을 유지·증진하기 위한 물품으로, 질병의 진단·치료·경감·처치·예방을 목적으로 하는 의약품이 아니에요.",
    en: "Cosmetics are products for cleansing and beautifying the body and maintaining or improving the health of skin and hair. They are not medicines intended to diagnose, treat, alleviate, manage or prevent disease.",
  },
  insurance: {
    ko: "보장·청구 결과는 약관과 심사에 따라 달라질 수 있어요 — 단정해 드리지 않아요.",
    en: "Coverage and claim outcomes depend on policy terms and review. We do not state them as certain.",
  },
  medical: {
    ko: "참고용 안내이며 진단·처방을 대체하지 않아요.",
    en: "For reference only. This does not replace diagnosis or prescription.",
  },
};
const I18N_NOTICE_PREVAIL = { ko: "", en: "Reference translation. The Korean original prevails." };

/* ── 응급 — EN에서 **반드시 영문**으로 나온다 ── */
const I18N_EMERGENCY = {
  "119": { ko: "119에 연락해 주세요.", en: "Call 119 (emergency) immediately." },
  now:   { ko: "오늘 중 진료로 확인하셔야 해요.", en: "Please see a doctor today." },
  stop:  { ko: "사용 중인 제품을 바로 멈춰 주세요.", en: "Stop using the product immediately." },
  er:    { ko: "가까운 응급실로 가 주세요.", en: "Go to the nearest emergency room." },
  derma: { ko: "피부과에서 바로 확인받으시는 게 좋아요.", en: "Please have this checked by a dermatologist right away." },
};

/* ── 런타임 ── */
function hiLang() {
  try {
    const v = localStorage.getItem(I18N_KEY);
    if (v && I18N_LANGS.indexOf(v) >= 0) return v;
  } catch (e) {}
  return "ko";                    /* 기본은 한국어 — 브라우저 언어로 임의 전환하지 않는다 */
}
function hiSetLang(l) {
  const lang = (I18N_LANGS.indexOf(l) >= 0) ? l : "ko";
  try { localStorage.setItem(I18N_KEY, lang); } catch (e) {}
  try {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);   /* 스크린리더·번역기·검색엔진이 읽는다 */
      document.body.dataset.lang = lang;
    }
    /* 전체 리로드로 바꾸지 않는다 — 상담·장바구니가 날아간다 */
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hifin:lang", { detail: { lang: lang } }));
  } catch (e) {}
  return lang;
}
/* 번역 조회 — 없으면 한국어를 그대로 돌려준다(키 문자열은 절대 노출하지 않는다) */
function t(key, fallbackKo) {
  const e = I18N[key];
  const ko = (e && e.ko) || "";
  const en = (e && e.en) || "";
  const want = (hiLang() === "en") ? (en || fallbackKo || ko) : (ko || fallbackKo || en);
  /* ⚠️ 어떤 경우에도 **키 문자열을 화면에 내보내지 않는다.**
     영문 전용 문구(hi.en.*)는 ko가 비어 있으므로, 비면 반대 언어 값으로 떨어진다.
     그래도 비면 빈 문자열 — 키 이름이 노출되는 것보다 낫다. */
  return want || fallbackKo || en || ko || "";
}
/* 이 키에 영문이 있는지 — 화면이 KO 배지를 달지 판단한다 */
function tHasEn(key) { const e = I18N[key]; return !!(e && e.en); }
/* 규제 고지 — EN이면 영문 + 한국어 원문 + 우선 표기를 함께 돌려준다 */
function tNotice(kind) {
  const n = I18N_NOTICE[kind];
  if (!n) return null;
  if (hiLang() !== "en") return { lines: [n.ko], prevail: null };
  return { lines: [n.en, n.ko], prevail: I18N_NOTICE_PREVAIL.en };
}
/* 응급 — EN이면 영문, KO면 한국어. 어느 쪽이든 반드시 값이 있다 */
function tEmergency(kind) {
  const e = I18N_EMERGENCY[kind];
  if (!e) return null;
  return hiLang() === "en" ? e.en : e.ko;
}

/* 첫 로드에 저장된 언어를 문서에 반영(새로고침해도 유지) */
try {
  if (typeof document !== "undefined") {
    const l0 = hiLang();
    document.documentElement.setAttribute("lang", l0);
    if (document.body) document.body.dataset.lang = l0;
  }
} catch (e) {}

try { if (typeof window !== "undefined") { window.__hifinI18n = { t: t, lang: hiLang, set: hiSetLang, map: I18N, notice: tNotice, emergency: tEmergency }; } } catch (e) {}
