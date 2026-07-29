/* ══════════════ 피부 고민 → 제품군 → 진료 연계 온톨로지 ══════════════
   피부 고민 → 적합한 제품군 → 추천 제품 → 필요 시 피부과·여성의학과 상담

   설계 원칙(A4 재가돌봄 트리아지와 같은 사상)
   ① **제품으로 해결되지 않는 것은 제품으로 팔지 않는다.** 진료 신호가 잡히면 추천을 멈춘다.
   ② 진료 안내는 **답변 맨 앞에 삽입**한다 — 뒤에 덧붙이는 건 교정이 아니다.
   ③ **오발동도 실패다.** "여드름 화장품 추천해줘"에 응급 안내가 붙으면 회원은 쇼핑을 못 한다.
      그래서 신호 패턴은 증상 서술에서만 걸리도록 좁게 쓴다.
   ④ A3는 **진단하지 않는다.** 병명을 말하지 않고 "진료에서 확인하시는 게 좋아요"까지만 간다.
   진료과 키는 telemed.js의 DEPT_CATS를 그대로 쓴다(derma=피부과 · obgy=산부인과/여성의학과). */

/* ── 즉시 진료 — 상담보다 위에 있는 규칙 ── */
const SKIN_URGENT = [
  { key: "anaphylaxis", level: "critical", dept: null,
    re: /(입술|눈).{0,6}(붓|부어|부었|부종)|숨.{0,4}(쉬기힘|막히|차|가쁘)|호흡곤란|목이.{0,3}붓/,
    line: "지금 하시는 말씀은 급성 알레르기 반응일 수 있어요. **사용 중인 제품을 바로 멈추시고 119 또는 응급실로 연락해 주세요.** 제품 안내는 그다음에 도와드릴게요." },
  { key: "fever-rash", level: "urgent", dept: "derma",
    re: /(열|발열|미열).{0,12}(발진|두드러기|뾰루지|붉은반점)|(발진|두드러기).{0,12}(열이|발열)|(하루|이틀|갑자기).{0,6}(번지|퍼지|확산)/,
    line: "열이 함께 있거나 빠르게 번지는 발진은 오늘 중 진료로 확인하셔야 해요. 피부과 진료가 어려우면 응급실도 방법이에요." },
  { key: "mole-change", level: "urgent", dept: "derma",
    re: /(점|검은반점|모반).{0,10}(커지|커졌|색이변|색깔이변|모양이변|번지|피가|출혈)|비대칭.{0,6}점/,
    line: "점의 크기·색·모양이 달라지는 건 **제품으로 관리할 사안이 아니에요.** 피부과에서 바로 확인받으시는 게 좋아요." },
  { key: "pus", level: "urgent", dept: "derma",
    re: /(고름|화농|진물|곪|짓무)|(심하게|많이).{0,4}아프|통증이.{0,4}(심|커)/,
    line: "고름·진물이나 심한 통증은 감염이 있을 수 있어요. 짜거나 바르기 전에 진료로 확인해 주세요." },
  { key: "steroid", level: "urgent", dept: "derma",
    re: /(스테로이드|스테로이드연고|호르몬연고).{0,14}(오래|장기|계속|끊|중단|끊었|악화|심해)/,
    line: "스테로이드 연고는 임의로 끊는 것도, 계속 쓰는 것도 위험할 수 있어요. 피부과에서 조절을 상의해 주세요." },
];

/* ── 고민 12종 ── */
const SKIN_CONCERN = [
  { key: "sensitive", label: "민감·붉어짐", kw: ["민감성", "민감한피부", "예민한피부", "따갑", "쓰라", "자극받"],
    primary: "보습·장벽 케어", secondary: "더마·전문 케어", sunCare: ["진정", "저자극"],
    refer: "2주 넘게 계속되거나 화끈거림·부종이 같이 오면", dept: "derma" },
  { key: "dry", label: "건조·당김", kw: ["건조", "당김", "당겨", "각질", "푸석"],
    primary: "보습·장벽 케어", secondary: "클렌징 케어", sunCare: ["보습", "장벽"],
    refer: "각질이 갈라지거나 피가 비치고 온몸이 가려우면", dept: "derma" },
  { key: "acne", label: "여드름·트러블", kw: ["여드름", "트러블", "뾰루지", "좁쌀"],
    primary: "기능성·트러블 케어", secondary: "클렌징 케어",
    refer: "곪거나 아프고 흉이 남기 시작하면", dept: "derma" },
  { key: "acne-hormonal", label: "성인 여성 턱선 여드름", kw: ["턱여드름", "턱선여드름", "생리전여드름", "생리때여드름", "호르몬여드름"],
    primary: "기능성·트러블 케어", secondary: "더마·전문 케어",
    refer: "생리주기마다 반복되고 생리불순·다모가 같이 오면", dept: "obgy" },
  { key: "pigment", label: "색소·기미·잡티", kw: ["기미", "잡티", "색소", "미백", "톤업", "칙칙"],
    primary: "기능성·트러블 케어", secondary: "자외선·환경 보호",
    refer: "점이나 반점의 모양·색·크기가 달라지면", dept: "derma" },
  { key: "wrinkle", label: "주름·탄력", kw: ["주름", "탄력", "처짐", "리프팅", "안티에이징", "노화"],
    primary: "기능성·트러블 케어", secondary: "디바이스·이너뷰티", refer: null, dept: null },
  { key: "pore", label: "모공·피지", kw: ["모공", "피지", "번들", "블랙헤드", "지성"],
    primary: "클렌징 케어", secondary: "기능성·트러블 케어", refer: null, dept: null },
  { key: "redness", label: "홍조", kw: ["홍조", "얼굴이빨", "붉은기", "안면홍조"],
    primary: "더마·전문 케어", secondary: "보습·장벽 케어", sunCare: ["진정", "저자극"],
    refer: "붉은기가 가라앉지 않고 실핏줄이 도드라지면", dept: "derma" },
  { key: "scalp", label: "두피·모발", kw: ["두피", "머리카락", "비듬", "탈모"],
    primary: "더마·전문 케어", secondary: "디바이스·이너뷰티",
    refer: "머리카락이 갑자기 많이 빠지거나 동그랗게 비면", dept: "derma" },
  { key: "post-procedure", label: "시술 후 관리", kw: ["시술후", "레이저후", "필링후", "박피후", "리쥬란", "재생관리"],
    primary: "더마·전문 케어", secondary: "보습·장벽 케어", sunCare: ["더마", "저자극"],
    refer: "진물·열감·통증이 심해지면 **시술받으신 병원에 먼저**", dept: "derma" },
  { key: "pregnancy", label: "임신·수유 중", kw: ["임신", "임산부", "수유중", "모유수유"],
    primary: "보습·장벽 케어", secondary: "자외선·환경 보호", sunCare: ["저자극", "더마"],
    refer: "성분을 써도 되는지 궁금하시면", dept: "obgy" },
  { key: "menopause", label: "갱년기 건조·가려움", kw: ["갱년기", "폐경", "완경"],
    primary: "보습·장벽 케어", secondary: "디바이스·이너뷰티",
    refer: "온몸이 가렵고 잠을 설칠 정도면", dept: "obgy" },
];

/* 진료과 라벨 — telemed.js DEPT_CATS를 단일 소스로 쓰고, 없으면 최소 표기로 떨어진다 */
function skinDeptLabel(key) {
  try {
    if (typeof DEPT_CATS !== "undefined") {
      const d = DEPT_CATS.find(function (c) { return c.key === key; });
      if (d) return d.clinic || d.label;
    }
  } catch (e) {}
  return key === "obgy" ? "여성의학과" : "피부과";
}

/* ── 즉시 진료 신호 판정 — 잡히면 제품 추천을 하지 않는다 ── */
function skinUrgent(question) {
  const t = String(question || "");
  for (const u of SKIN_URGENT) if (u.re.test(t)) return u;
  return null;
}

/* ── 고민 판정 — 가장 긴 키워드가 이긴다(턱여드름이 여드름을 이겨야 한다) ── */
function skinConcernOf(question) {
  const t = String(question || "").toLowerCase().replace(/\s+/g, "");
  let best = null;
  for (const c of SKIN_CONCERN) {
    for (const w of c.kw) {
      if (t.indexOf(w) >= 0 && (!best || w.length > best.len)) best = { c: c, len: w.length };
    }
  }
  return best ? best.c : null;
}

/* ── 고민 상담 문장 — 제품군까지만 말하고, 선을 넘으면 진료로 넘긴다 ── */
function skinConcernLines(concern, picks) {
  if (!concern) return null;
  const lines = [];
  lines.push(`${concern.label} 고민이시군요. 이런 순서로 보시면 편해요.`);
  lines.push(`· 먼저 볼 제품군 → **${concern.primary}**`);
  if (concern.secondary) lines.push(`· 같이 보면 좋은 것 → ${concern.secondary}`);
  if (picks && picks.length) {
    lines.push("· 이 분류에서 지금 비교 가능한 제품이에요");
    picks.forEach(function (p) { lines.push(`   - ${p.name}(${p.brand}) · ${p.volume}`); });
  }
  if (concern.refer && concern.dept) {
    lines.push(`※ ${concern.refer} **${skinDeptLabel(concern.dept)} 상담**을 받아보시는 게 좋아요 — 제품으로 붙잡고 있을 일이 아니에요.`);
  }
  lines.push("※ 화장품은 인체를 청결·미화하고 피부·모발의 건강을 유지·증진하기 위한 물품으로, 질병의 진단·치료·경감·처치·예방을 목적으로 하는 의약품이 아니에요.");
  return lines;
}

/* ── 원격진료 연결 — 새 화면을 만들지 않고 기존 비대면 원격진료 탭을 연다 ──
   window._teleGo.dept를 심어 두면 원격주치의 화면이 그 진료과로 열린다(Shop의 _shopGo와 같은 방식). */
function skinTeleGo(deptKey) {
  try { if (typeof window !== "undefined") window._teleGo = { dept: deptKey || "derma" }; } catch (e) {}
  return { label: "🩺 " + skinDeptLabel(deptKey) + " 원격진료 연결", to: "tele" };
}
