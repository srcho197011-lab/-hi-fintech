/* ====================== AI KB 라운지 — 실측 적재 지식: 질환 · 치료비 케어 · 법률·제도 ======================
   출처: 질병관리청·국가건강정보포털·관련 전문학회(고혈압·당뇨병·심장·뇌졸중·간·신장·지질) / 보험 약관·금융위 / 국가법령정보센터.
   ⚠️ 참고용 요약. 진단·치료는 의료진, 보험 보장은 증권·약관, 법률 적용은 관계기관·전문가 검토를 따릅니다.
   ※ 토큰·보험료 지원·환급·기본소득 등은 확정 제도가 아닌 '규제 검토가 필요한 사업모델'로 표기. */

/* 질환 — 정의·위험요인·예방관리·응급/진료 기준 */
const KB_DISEASE = [
  { id: "dz-htn", name: "고혈압", summary: "진료실 혈압 140/90mmHg 이상이 지속되는 상태(가정혈압 135/85↑).", risk: "고령·비만·고염식·과음·운동부족·스트레스·가족력", manage: "저염식·체중감량·주 150분 유산소·금연·절주·필요 시 약물", care: "심한 두통·시야장애·의식저하·흉통 시 즉시 진료(고혈압성 응급)", related: ["심근경색", "뇌졸중", "만성콩팥병"], org: "대한고혈압학회", src: "고혈압 진료지침(2022)", date: "2022-05", grade: "A" },
  { id: "dz-dm", name: "당뇨병", summary: "공복혈당 126 또는 당화혈색소 6.5% 이상. 인슐린 분비·작용 이상.", risk: "비만·가족력·운동부족·고령·임신성당뇨 과거력", manage: "저당·고식이섬유 식이·규칙 운동·혈당 자가측정·약물", care: "심한 고혈당(다뇨·탈수)·저혈당(의식저하·발한) 시 응급", related: ["신장질환", "망막병증", "심뇌혈관질환"], org: "대한당뇨병학회", src: "당뇨병 진료지침(2023)", date: "2023-05", grade: "A" },
  { id: "dz-dyslip", name: "이상지질혈증", summary: "LDL·중성지방 상승 또는 HDL 저하로 동맥경화 위험이 커진 상태.", risk: "고지방식·비만·과음·당뇨·흡연·가족성 고지혈증", manage: "포화·트랜스지방↓·유산소 운동·체중관리·스타틴 등 약물", care: "흉통·호흡곤란 등 심혈관 증상 동반 시 진료", related: ["협심증", "심근경색", "뇌졸중"], org: "한국지질동맥경화학회", src: "이상지질혈증 진료지침", date: "2022-11", grade: "A" },
  { id: "dz-mets", name: "대사증후군", summary: "복부비만·혈압·공복혈당·중성지방·HDL 이상 중 3가지 이상 동반.", risk: "내장비만·인슐린저항성·운동부족·과식", manage: "체중 5~10% 감량·유산소+근력운동·식이개선", care: "동반 질환(당뇨·고혈압) 악화 시 진료", related: ["당뇨병", "심뇌혈관질환"], org: "질병관리청", src: "국가건강정보포털", date: "2025-01", grade: "A" },
  { id: "dz-stroke", name: "뇌졸중(뇌혈관질환)", summary: "뇌혈관이 막히거나(뇌경색) 터져서(뇌출혈) 뇌 손상이 생기는 질환.", risk: "고혈압·당뇨·심방세동·흡연·고지혈·고령", manage: "위험인자 관리·항혈전제(처방 시)·금연·혈압조절", care: "🚨 FAST(얼굴처짐·팔마비·발음장애) 시 즉시 119 — 골든타임", related: ["고혈압", "후유장해"], org: "대한뇌졸중학회", src: "뇌졸중 진료지침", date: "2022-01", grade: "A" },
  { id: "dz-mi", name: "심근경색·협심증", summary: "관상동맥이 좁아지거나 막혀 심장근육에 혈류가 부족해지는 질환.", risk: "고지혈·당뇨·고혈압·흡연·비만·가족력", manage: "위험인자 관리·금연·운동·약물·필요 시 시술", care: "🚨 20분 이상 지속되는 흉통·식은땀·좌측팔 통증 시 즉시 119", related: ["이상지질혈증", "돌연사"], org: "대한심장학회", src: "심혈관질환 진료지침", date: "2023-01", grade: "A" },
  { id: "dz-nafld", name: "지방간", summary: "간에 지방이 과다 축적된 상태(알코올성/비알코올성).", risk: "비만·과음·당뇨·이상지질혈증·운동부족", manage: "체중감량·절주·유산소 운동·혈당·지질 관리", care: "황달·복수·의식저하 등 간부전 징후 시 진료", related: ["간경화", "간암"], org: "대한간학회", src: "간질환 진료지침", date: "2023-01", grade: "B" },
  { id: "dz-ckd", name: "만성콩팥병(CKD)", summary: "eGFR 60 미만 또는 단백뇨가 3개월 이상 지속되는 상태.", risk: "당뇨·고혈압·고령·신독성 약물·가족력", manage: "혈압·혈당 조절·염분/단백 조절·신독성 약물 주의", care: "부종·소변량 감소·심한 피로 시 신장내과 진료", related: ["당뇨병", "고혈압"], org: "대한신장학회", src: "KDIGO/진료지침 참고", date: "2023-01", grade: "A" },
];

/* 치료비 케어 — 상해보험 약관 학습 요약(참고용) */
const KB_INSURANCE = [
  { id: "ins-injury", item: "상해의 정의", summary: "보험기간 중 발생한 ‘급격하고 우연한 외래의 사고’. 질병은 상해에 미포함.", related: ["상해보험"], org: "상해보험 약관", src: "현대단체상해 약관(학습)", date: "2026-01", grade: "B" },
  { id: "ins-pay", item: "사망·후유장해 보험금", summary: "상해 직접결과 사망 시 사망보험금(가입금액), 후유장해 시 장해지급률×가입금액.", related: ["상해보험"], org: "상해보험 약관", src: "현대단체상해 약관(학습)", date: "2026-01", grade: "B" },
  { id: "ins-excl", item: "면책(안 주는 경우)", summary: "고의·자해, 음주(0.03%↑)·무면허·약물 운전 중 사고, 위험활동 등은 보상 제외.", related: ["상해보험"], org: "상해보험 약관", src: "약관 제5조", date: "2026-01", grade: "B" },
  { id: "ins-docs", item: "보험금 청구서류", summary: "① 청구서 ② 사고증명서(진단서·장해진단서·입원확인서) ③ 신분증 ④ 기타.", related: ["보험금 청구"], org: "상해보험 약관", src: "약관 제7조", date: "2026-01", grade: "B" },
  { id: "ins-term", item: "지급기한·소멸시효", summary: "신체손해 보험금 접수 후 3영업일 이내 지급·가지급 50%. 청구권 소멸시효 3년(상법 662조).", related: ["보험금 지급"], org: "상법/약관", src: "상법 제662조·약관 제8조", date: "2026-01", grade: "A" },
  { id: "ins-cool", item: "청약철회·고지의무", summary: "증권 수령 15일 내 청약철회 가능. 계약 전 알릴의무(고지)는 청약서에 사실대로 기재·자필서명.", related: ["계약"], org: "보험업법/약관", src: "약관 계약자 유의사항", date: "2026-01", grade: "A" },
  { id: "ins-silson", item: "실손의료보험(4세대)", summary: "급여/비급여 보장 분리, 자기부담률 상향, 비급여 이용량과 연계한 보험료 할인·할증(2021.7 도입).", related: ["실손보험", "치료비"], org: "금융위원회·보험업계", src: "4세대 실손 표준약관", date: "2021-07", grade: "B" },
  { id: "ins-embed", item: "임베디드·미니(소액단기)보험", summary: "상품·서비스에 결합하거나 특정 위험만 단기·소액으로 보장하는 형태. 소액단기전문보험업 제도.", related: ["임베디드보험"], org: "보험업법", src: "소액단기전문보험업(2021)", date: "2021-06", grade: "B" },
];

/* ── AI 주치의 RAG: 질환 정의·개요 질의 → KB_DISEASE 매칭(근거 인용) ── */
const KB_DZ_ALIAS = {
  "dz-htn": ["고혈압"],
  "dz-dm": ["당뇨병", "당뇨"],
  "dz-dyslip": ["이상지질혈증", "고지혈증", "고지혈", "콜레스테롤"],
  "dz-mets": ["대사증후군"],
  "dz-stroke": ["뇌졸중", "뇌경색", "뇌출혈", "중풍", "뇌혈관"],
  "dz-mi": ["심근경색", "협심증", "관상동맥", "심장마비", "허혈성심장"],
  "dz-nafld": ["지방간"],
  "dz-ckd": ["만성콩팥병", "콩팥병", "신부전", "만성신장", "ckd"],
};
function kbDiseaseCounsel(text) {
  if (!text || typeof KB_DISEASE === "undefined") return null;
  const raw = String(text);
  // 증상·검사·치료 등 심화 질의는 기존 상담 엔진에 위임
  if (/증상|검사|치료|약물|복용|생활습관|합병증|식단|운동|영양|검진|수치는/.test(raw)) return null;
  let dz = null, alias = "";
  for (const d of KB_DISEASE) { const al = (KB_DZ_ALIAS[d.id] || [d.name.split("(")[0]]); const hit = al.find((a) => raw.toLowerCase().includes(a.toLowerCase())); if (hit) { dz = d; alias = hit; break; } }
  if (!dz) return null;
  const overview = /뭐야|뭔가|무엇|정의|이란|란[\s?]|이 뭐|개요|원인|위험\s?요인|어떤\s?(병|질환)|설명|알려줘|위험은|왜 생/.test(raw);
  const bareName = raw.replace(/[\s?!.]/g, "").length <= (alias.length + 3);
  if (!overview && !bareName) return null;
  const emerg = /🚨/.test(dz.care);
  return {
    bubbles: [
      { kind: "text", text: `${dz.name} — ${dz.summary}\n📚 근거: AI KB 라운지 · ${dz.org} ${dz.src}(${dz.date}) · 승인 지식(신뢰도 ${dz.grade})` },
      { kind: "card", card: { title: `🩺 ${dz.name} 핵심 안내`, items: [
        `⚠️ 주요 위험요인: ${dz.risk}`,
        `🎯 예방·관리: ${dz.manage}`,
        `${emerg ? "🚑" : "🩺"} 진료·응급 기준: ${dz.care}`,
        `🔗 관련: ${(dz.related || []).join(" · ")}`,
      ], buttons: [`${dz.name} 증상은 무엇인가요?`, `${dz.name} 검사 방법`] } },
    ],
    quicks: [`${dz.name} 생활습관 관리법은?`, dz.related && dz.related[0] ? `${dz.related[0]} 대비 보험` : "내 리포트 요약", "내 리포트 요약"].slice(0, 3),
  };
}

/* ── AI 설계사 RAG: 보험 질의 → KB_INSURANCE 매칭(근거 인용) ── */
const KB_INS_KW = {
  "ins-injury": ["상해", "급격", "우연", "외래", "상해가", "상해란"],
  "ins-pay": ["사망", "후유장해", "장해", "진단금", "지급률", "얼마 받", "보험금 얼마"],
  "ins-excl": ["면책", "안주", "안 주", "음주", "무면허", "고의", "자살", "보상 안", "제외되", "부지급"],
  "ins-docs": ["청구", "서류", "구비", "제출", "청구방법", "필요서류"],
  "ins-term": ["며칠", "지급기한", "소멸시효", "3년", "언제 나오", "기한", "가지급"],
  "ins-cool": ["청약철회", "철회", "고지", "알릴의무", "취소", "병력", "가입 취소"],
  "ins-silson": ["실손", "실비", "4세대", "자기부담", "비급여"],
  "ins-embed": ["임베디드", "미니보험", "소액", "단기보험", "소액단기"],
};
function kbInsuranceMatch(text) {
  if (!text || typeof KB_INSURANCE === "undefined") return null;
  const low = String(text).toLowerCase();
  let best = null;
  KB_INSURANCE.forEach((e) => {
    const kws = KB_INS_KW[e.id] || [e.item];
    let sc = 0; kws.forEach((k) => { const kn = k.toLowerCase(); if (kn && low.includes(kn)) sc = Math.max(sc, kn.length); });
    if (sc > 0 && (!best || sc > best.sc)) best = { e, sc };
  });
  return best ? best.e : null;
}
function kbInsCite(e) { return e ? `📚 근거: AI KB 라운지 · ${e.org} ${e.src}(${e.date}) · 승인 지식(신뢰도 ${e.grade})` : ""; }

/* 법률·제도 — 사업모델이 검토해야 할 규제(허용/주의/금지 소지 구분)
   ★ 2026-10-25 단일화(P0 결정 ⑩ · 지시서 §13-5 산출물 ⑧) — 이 배열은 더 이상 원천이 아니다.
     원천은 src/data/partnerPolicy.js 의 PG_LAWS 이고 여기는 **뷰**다. 왜 바꿨는가:
       ① 여기 있던 grade 는 **지식 신뢰도(A/B)**이고 조문 확인 등급이 아니었다. 한 열에 두면
          「A등급 법령」이 「원문 확인된 법령」으로 읽힌다 — 두 열을 따로 둔다(verified 가 추가됐다).
       ② 등재 2건이 사실과 어긋나 있었다(제도명 1건 · 근거 법률 1건). 두 테이블에 같은 법령을
          따로 적는 구조가 그 어긋남을 만들었고, 뷰로 바꾸면 중복 등재가 구조적으로 불가능해진다.
       ③ 조문 번호가 **확인 등급 게이트**를 지나게 됐다(지시서 §6-4). 원문 확인되지 않은 조문은
          번호를 찍지 않고 「조문 미확인」으로 렌더된다 — 미확인 조문 번호를 인쇄하지 않는다.
     행 수(10)와 필드 이름은 그대로다. **행 순서는 바뀐다** — PG_LAWS 등재 순서를 따르므로
       선두가 의료법에서 개인정보 보호법으로 옮겨진다(검색·스크롤 위치가 달라진다).
       순서를 종전대로 고정하려면 PG_LAWS 의 kb 필드에 정렬 키를 두어야 하고, 그러면 순서가
       **두 곳**에 살게 된다 — 그래서 등재 순서 하나로 둔다.
     법령을 더하거나 고치려면 PG_LAWS 의 해당 항목과 그 kb 필드를 고친다. 여기에 행을 쓰지 않는다. */
const KB_LEGAL = (typeof pgKbLegal === "function") ? pgKbLegal() : [];
