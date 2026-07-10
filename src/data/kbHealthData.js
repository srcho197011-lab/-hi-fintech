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
