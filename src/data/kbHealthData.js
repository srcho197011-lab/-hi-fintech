/* ====================== AI KB 라운지 — 실측 적재 지식: 건강검진 항목별 정상/주의/위험 구간 ======================
   출처: 국가건강검진(건강검진 실시기준)·대한고혈압학회(2022)·대한당뇨병학회(2023 진료지침)·
        한국지질동맥경화학회(이상지질혈증 진료지침)·대한비만학회(2022)·대한진단검사의학회 참고 범위.
   ⚠️ 참고용 요약(수치는 성별·검사법·기관에 따라 차이). 개인 판정은 검진기관 판독·의료진 상담을 따릅니다. */

const KB_CHECKUP = [
  { id: "chk-bp", item: "혈압 (수축기/이완기)", unit: "mmHg", normal: "< 120 / 80 (정상)", caution: "120–139 / 80–89 (주의·전단계)", danger: "≥ 140 / 90 (고혈압)", meaning: "지속 상승 시 심근경색·뇌졸중·신장질환 위험 증가. 가정혈압 병행 측정 권장.", related: ["고혈압", "심뇌혈관질환"], org: "대한고혈압학회", src: "고혈압 진료지침(2022)", date: "2022-05", grade: "A" },
  { id: "chk-fbs", item: "공복혈당", unit: "mg/dL", normal: "< 100 (정상)", caution: "100–125 (공복혈당장애)", danger: "≥ 126 (당뇨병 의심)", meaning: "공복 8시간 후 측정. 126 이상이 재확인되면 당뇨병 진단 기준.", related: ["당뇨병", "대사증후군"], org: "대한당뇨병학회", src: "당뇨병 진료지침(2023)", date: "2023-05", grade: "A" },
  { id: "chk-hba1c", item: "당화혈색소 (HbA1c)", unit: "%", normal: "< 5.7 (정상)", caution: "5.7–6.4 (당뇨 전단계)", danger: "≥ 6.5 (당뇨병)", meaning: "최근 2–3개월 평균 혈당. 공복 없이 측정 가능, 혈당 변동에 덜 민감.", related: ["당뇨병"], org: "대한당뇨병학회", src: "당뇨병 진료지침(2023)", date: "2023-05", grade: "A" },
  { id: "chk-tc", item: "총콜레스테롤", unit: "mg/dL", normal: "< 200 (적정)", caution: "200–239 (경계)", danger: "≥ 240 (높음)", meaning: "LDL·HDL·중성지방의 합산 지표. 단독보다 LDL·HDL과 함께 해석.", related: ["이상지질혈증", "심뇌혈관질환"], org: "한국지질동맥경화학회", src: "이상지질혈증 진료지침", date: "2022-11", grade: "A" },
  { id: "chk-ldl", item: "LDL 콜레스테롤 (나쁜)", unit: "mg/dL", normal: "< 100 (적정)", caution: "130–159 (경계)", danger: "≥ 160 (높음)", meaning: "동맥경화 핵심 위험인자. 심혈관 위험군은 목표치가 더 낮음(<70 등).", related: ["이상지질혈증", "협심증"], org: "한국지질동맥경화학회", src: "이상지질혈증 진료지침", date: "2022-11", grade: "A" },
  { id: "chk-hdl", item: "HDL 콜레스테롤 (좋은)", unit: "mg/dL", normal: "≥ 60 (좋음)", caution: "40–59 (보통)", danger: "< 40 (낮음·위험)", meaning: "혈관 청소 역할. 낮을수록 심혈관 위험↑. 운동·금연으로 개선.", related: ["이상지질혈증"], org: "한국지질동맥경화학회", src: "이상지질혈증 진료지침", date: "2022-11", grade: "A" },
  { id: "chk-tg", item: "중성지방 (TG)", unit: "mg/dL", normal: "< 150 (적정)", caution: "150–199 (경계)", danger: "≥ 200 (높음)", meaning: "과음·과식·비만과 연관. 500 이상은 급성췌장염 위험.", related: ["이상지질혈증", "지방간"], org: "한국지질동맥경화학회", src: "이상지질혈증 진료지침", date: "2022-11", grade: "A" },
  { id: "chk-bmi", item: "체질량지수 (BMI)", unit: "kg/㎡", normal: "18.5–22.9 (정상)", caution: "23–24.9 (비만전단계)", danger: "≥ 25 (비만)", meaning: "아시아 기준. 25–29.9 1단계, 30–34.9 2단계, ≥35 3단계 비만.", related: ["비만", "대사증후군"], org: "대한비만학회", src: "비만 진료지침(2022)", date: "2022-10", grade: "A" },
  { id: "chk-wc", item: "허리둘레 (복부비만)", unit: "cm", normal: "남 < 90 / 여 < 85", caution: "경계", danger: "남 ≥ 90 / 여 ≥ 85 (복부비만)", meaning: "내장지방 지표. 대사증후군 진단기준 중 하나.", related: ["복부비만", "대사증후군"], org: "대한비만학회", src: "비만 진료지침(2022)", date: "2022-10", grade: "A" },
  { id: "chk-ast", item: "AST (SGOT)", unit: "IU/L", normal: "≤ 40 (정상)", caution: "41–50 (경계)", danger: "> 50 (상승)", meaning: "간·심장·근육 손상 시 상승. ALT와 함께 간기능 평가.", related: ["간질환", "지방간"], org: "대한진단검사의학회", src: "검사 참고범위", date: "2024-01", grade: "B" },
  { id: "chk-alt", item: "ALT (SGPT)", unit: "IU/L", normal: "≤ 40 (정상)", caution: "41–50 (경계)", danger: "> 50 (상승)", meaning: "간세포 손상에 특이적. 지방간·간염에서 상승.", related: ["간질환", "지방간", "간염"], org: "대한진단검사의학회", src: "검사 참고범위", date: "2024-01", grade: "B" },
  { id: "chk-ggt", item: "감마지티피 (γ-GTP)", unit: "IU/L", normal: "남 11–63 / 여 8–35", caution: "경계상승", danger: "기준 초과 (상승)", meaning: "음주·담도질환·지방간에서 상승. 알코올성 간질환 지표.", related: ["간질환", "알코올성간질환"], org: "대한진단검사의학회", src: "검사 참고범위", date: "2024-01", grade: "B" },
  { id: "chk-hb", item: "혈색소 (헤모글로빈)", unit: "g/dL", normal: "남 13–16.5 / 여 12–15.5", caution: "경계", danger: "남 < 13 / 여 < 12 (빈혈)", meaning: "빈혈·다혈구증 선별. 낮으면 철결핍·만성질환·출혈 확인.", related: ["빈혈"], org: "대한진단검사의학회", src: "검사 참고범위", date: "2024-01", grade: "B" },
  { id: "chk-cr", item: "혈청 크레아티닌", unit: "mg/dL", normal: "남 0.7–1.3 / 여 0.6–1.1", caution: "경계", danger: "기준 초과 (상승)", meaning: "신장 배설기능 지표. eGFR 계산의 기초값.", related: ["신장질환", "만성콩팥병"], org: "대한진단검사의학회", src: "검사 참고범위", date: "2024-01", grade: "B" },
  { id: "chk-egfr", item: "사구체여과율 (eGFR)", unit: "mL/min/1.73㎡", normal: "≥ 90 (정상)", caution: "60–89 (경도감소)", danger: "< 60 (만성콩팥병 의심)", meaning: "신장 여과능력. 60 미만이 3개월 이상 지속 시 만성콩팥병.", related: ["만성콩팥병", "신장질환"], org: "대한신장학회", src: "KDIGO/진료지침 참고", date: "2023-01", grade: "A" },
  { id: "chk-upro", item: "요단백 (소변검사)", unit: "정성", normal: "음성 (−)", caution: "약양성 (±)", danger: "양성 (+ 이상)", meaning: "신장질환·당뇨병성 신증 선별. 양성 지속 시 정밀검사.", related: ["신장질환", "당뇨병"], org: "국가건강검진", src: "건강검진 실시기준", date: "2025-01", grade: "A" },
  { id: "chk-hbsag", item: "B형간염 표면항원 (HBsAg)", unit: "정성", normal: "음성 (−)", caution: "—", danger: "양성 (+, 감염)", meaning: "B형간염 바이러스 감염 여부. 양성 시 간기능·바이러스 정밀검사.", related: ["간염", "간질환"], org: "국가건강검진", src: "건강검진 실시기준", date: "2025-01", grade: "A" },
];
/* KB 적재 메타(전 항목 공통) */
const KB_CHECKUP_META = { domain: "건강검진", fresh: "최신", status: "승인", reviewedBy: "의료 자문(검토완료)", loadedAt: "2026-07", count: KB_CHECKUP.length };

/* ── ③ 관리자 승인 워크플로: 수집 → 자동검증 → 관리자 검토 → 전문가 검토 → 승인 ── */
const KB_STAGES = ["수집", "자동검증", "관리자 검토", "전문가 검토", "승인"];
const KB_QUEUE = [
  { id: "Q1", title: "2026 고혈압 목표혈압 개정안 반영", domain: "질환", org: "대한고혈압학회", date: "2026-06", grade: "A", risk: "보통", flags: ["최신성"], stage: 2 },
  { id: "Q2", title: "당화혈색소 6.0% 관리 권고 문구", domain: "건강검진", org: "대한당뇨병학회", date: "2026-05", grade: "A", risk: "낮음", flags: [], stage: 2 },
  { id: "Q3", title: "실손보험 4세대 자기부담 변경 요약", domain: "치료비 케어", org: "금융위원회", date: "2026-06", grade: "B", risk: "높음", flags: ["법률변경", "전문가필요"], stage: 2 },
  { id: "Q4", title: "가상자산이용자보호법 — 포인트/토큰 구분", domain: "법률·제도", org: "금융위원회", date: "2026-04", grade: "B", risk: "높음", flags: ["법률변경", "전문가필요"], stage: 3 },
  { id: "Q5", title: "오메가3 기능성 표시 — 상충 자료 검토", domain: "건강소비·자산", org: "식약처/상업자료", date: "2026-03", grade: "C", risk: "보통", flags: ["상충", "중복"], stage: 1 },
  { id: "Q6", title: "대사증후군 진단기준 요약", domain: "질환", org: "질병관리청", date: "2026-06", grade: "A", risk: "낮음", flags: [], stage: 2 },
];

/* ── ② RAG 연결: 검진 수치 → KB 판정 + 근거 + 관련 보험·건강미션 ── */
const KB_CHK_MATCH = [
  { id: "chk-bp", keys: ["혈압"], special: "bp", rng: [60, 300] },
  { id: "chk-hba1c", keys: ["당화혈색소", "당화", "hba1c", "a1c"], band: (v) => v < 5.7 ? 0 : v < 6.5 ? 1 : 2, labels: ["정상", "당뇨 전단계", "당뇨병"], rng: [3, 20] },
  { id: "chk-fbs", keys: ["공복혈당", "혈당"], band: (v) => v < 100 ? 0 : v < 126 ? 1 : 2, labels: ["정상", "공복혈당장애(당뇨 전단계)", "당뇨병 의심"], rng: [40, 600] },
  { id: "chk-ldl", keys: ["ldl", "엘디엘"], band: (v) => v < 130 ? 0 : v < 160 ? 1 : 2, labels: ["적정~정상", "경계", "높음"], rng: [20, 400] },
  { id: "chk-hdl", keys: ["hdl", "에이치디엘"], band: (v) => v >= 60 ? 0 : v >= 40 ? 1 : 2, labels: ["좋음", "보통", "낮음"], rng: [10, 150] },
  { id: "chk-tg", keys: ["중성지방", "트리글리", "tg"], band: (v) => v < 150 ? 0 : v < 200 ? 1 : 2, labels: ["적정", "경계", "높음"], rng: [20, 3000] },
  { id: "chk-tc", keys: ["총콜레스테롤", "콜레스테롤", "콜레스"], band: (v) => v < 200 ? 0 : v < 240 ? 1 : 2, labels: ["적정", "경계", "높음"], rng: [50, 600] },
  { id: "chk-bmi", keys: ["bmi", "체질량", "비만도"], band: (v) => v < 18.5 ? 1 : v < 23 ? 0 : v < 25 ? 1 : 2, labels: ["정상", "주의(저체중/과체중)", "비만"], rng: [10, 70] },
  { id: "chk-ast", keys: ["ast", "sgot"], band: (v) => v <= 40 ? 0 : v <= 50 ? 1 : 2, labels: ["정상", "경계", "상승"], rng: [1, 2000] },
  { id: "chk-alt", keys: ["alt", "sgpt"], band: (v) => v <= 40 ? 0 : v <= 50 ? 1 : 2, labels: ["정상", "경계", "상승"], rng: [1, 2000] },
  { id: "chk-ggt", keys: ["감마지티피", "감마", "ggt", "gtp"], band: (v) => v <= 63 ? 0 : v <= 100 ? 1 : 2, labels: ["정상", "경계", "상승"], rng: [1, 3000] },
  { id: "chk-egfr", keys: ["egfr", "사구체", "여과율"], band: (v) => v >= 90 ? 0 : v >= 60 ? 1 : 2, labels: ["정상", "경도감소", "만성콩팥병 의심"], rng: [1, 200] },
];
const KB_CHK_MISSION = {
  "chk-fbs": ["정상 혈당 유지 — 정제탄수화물 절제·주 150분 유산소", "식후 10분 걷기·정제탄수화물↓·체중 5% 감량·3개월 후 재검", "공복혈당 자가측정·내분비내과 상담·식이·운동 집중관리"],
  "chk-hba1c": ["균형식·규칙 운동 유지", "저당·고식이섬유 식단·주 3회 운동·3개월 후 재검", "혈당관리 프로그램·내분비내과 상담"],
  "chk-bp": ["저염식·주 150분 유산소 유지", "저염(하루 5g↓)·체중감량·가정혈압 기록·1개월 관찰", "가정혈압 측정·심장내과 상담·복약 상담"],
  "chk-tc": ["채소·통곡물 위주 유지", "포화지방↓·유산소 운동·3~6개월 후 재검", "이상지질혈증 관리·순환기내과 상담"],
  "chk-ldl": ["식이·운동 유지", "포화·트랜스지방↓·유산소·재검", "LDL 목표관리·전문의 상담(약물치료 여부)"],
  "chk-hdl": ["현 상태 유지", "금연·유산소 운동·불포화지방 섭취", "생활습관 집중 개선·전문의 상담"],
  "chk-tg": ["절주·당류 절제 유지", "절주·당류↓·유산소·재검", "중성지방 관리·전문의 상담(500↑ 췌장염 주의)"],
  "chk-bmi": ["현 체중 유지·근력운동", "체중 5~10% 감량·허리둘레 관리·식이일지", "비만 클리닉·대사증후군 관리 상담"],
  "chk-ast": ["절주·간 부담 줄이기", "절주·체중관리·재검", "간 정밀검사·소화기내과 상담"],
  "chk-alt": ["절주·지방간 예방 유지", "절주·지방간 관리·재검", "간 정밀검사·소화기내과 상담"],
  "chk-ggt": ["절주 유지", "절주 4주 후 재검", "알코올성 간질환 평가·전문의 상담"],
  "chk-egfr": ["수분·혈압·혈당 관리", "염분·단백 과다 주의·혈압/혈당 관리·재검", "신장내과 상담·만성콩팥병 평가"],
};
function kbCheckupCounsel(text) {
  if (!text || typeof KB_CHECKUP === "undefined") return null;
  const nums = (String(text).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (!nums.length) return null;
  const low = String(text).toLowerCase().replace(/\s/g, "");
  let m = null;
  for (const it of KB_CHK_MATCH) { if (it.keys.some((k) => low.includes(k.toLowerCase().replace(/\s/g, "")))) { m = it; break; } }
  if (!m) return null;
  const kb = KB_CHECKUP.find((e) => e.id === m.id); if (!kb) return null;
  let sev, label, valStr, unit = "";
  if (m.special === "bp") {
    const s = nums[0]; if (s < m.rng[0] || s > m.rng[1]) return null;
    const d = nums.length > 1 ? nums[1] : null;
    const sB = s >= 140 ? 2 : s >= 120 ? 1 : 0; const dB = (d != null) ? (d >= 90 ? 2 : d >= 80 ? 1 : 0) : 0; const b = Math.max(sB, dB);
    sev = ["정상", "주의", "위험"][b]; label = ["정상 혈압", "주의혈압·고혈압 전단계", "고혈압"][b]; valStr = d != null ? (s + "/" + d) : ("" + s); unit = " mmHg";
  } else {
    const v = nums[0]; if (v < m.rng[0] || v > m.rng[1]) return null;
    const b = m.band(v); sev = ["정상", "주의", "위험"][b]; label = m.labels[b]; valStr = "" + v; unit = kb.unit && !/정성/.test(kb.unit) ? (" " + kb.unit) : "";
  }
  const dz = kb.related || [];
  const sevIdx = sev === "정상" ? 0 : sev === "주의" ? 1 : 2;
  const mission = (KB_CHK_MISSION[m.id] || ["균형잡힌 생활습관 유지", "생활습관 개선·재검", "전문의 상담"])[sevIdx];
  const insNote = dz.length ? `${dz.join("·")} 대비 보장(질병·검진연계·간편단기특화)을 점검해 보세요.` : "필요 보장을 점검해 보세요.";
  const emoji = sev === "정상" ? "✅" : sev === "주의" ? "⚠️" : "🚨";
  const items = [`🎯 건강미션: ${mission}`, `🛡️ 관련 보험: ${insNote}`];
  if (sev !== "정상") items.push("🩺 재검·의료진 상담 시점을 확인하고, 필요 시 진료를 예약하세요.");
  return {
    bubbles: [
      { kind: "text", text: `${emoji} ${kb.item.split(" (")[0]} ${valStr}${unit} → 「${sev}」 ${label}\n${kb.meaning}\n📚 근거: AI KB 라운지 · ${kb.org} ${kb.src}(${kb.date})` },
      { kind: "card", card: { title: `📋 ${sev} — 관련 보험·건강미션 안내`, items, buttons: ["🛡️ 나의 보험 알아보기 바로가기", "📋 내 건강 리포트·관리 바로가기"] } },
    ],
    quicks: [dz[0] ? `${dz[0]} 관리법 알려줘` : "이 수치 관리법", "간편단기특화보험 보기", "내 리포트 요약"],
  };
}
