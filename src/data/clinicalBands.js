/* ══════════════ 임상 판정 구간(clinicalBands.js) — 프로 지시서 프롬프트 v1.3 §1-2 (P1) ══════════════
   검진지표별 판정 임계의 단일 소스. checkupEngine._TH의 현행 값을 추출해 정식화하고
   각 지표에 근거 지침(기관·문서·연도·대표 URL)을 동반한다.
   ⚠️ 원칙:
     · 진실 1곳 — checkupEngine은 이 파일(clinicalTH)을 역참조한다. 임계의 중복 정의 금지.
     · 출처 없는 임계 입력 금지 — status가 "관례"인 항목은 t2(위험선)가 검사실·기관 관례라는 뜻이며,
       공식 지침 임계가 확인되면 형 검수 표를 거쳐서만 갱신한다(회귀 보호 — 값 변경은 코호트 전체에 파급).
     · 구간 의미 — normal(<t1) / border(t1~t2, 라벨 "주의") / danger(≥t2, 라벨 "위험"). dir "lo"는 반대 방향.
       v1.3 §2의 초(L) 등급은 값이 정상권일 때의 경계 진입·추세 판정으로, P2 riskGrade가 t0(선택)으로 다룬다.
     · 교육·안내 목적 — 실제 판정·진단은 검진기관 의사 소견을 따른다(의료 경계). */
const CLINICAL_BANDS = [
  /* ── 체격 ── */
  { key: "bmi",   ko: "체질량지수", unit: "kg/m²", dir: "hi", t1: 25,  t2: 28,
    src: { org: "대한비만학회", doc: "비만 진료지침", year: 2022, url: "https://www.kosso.or.kr" },
    status: "검수 대기", note: "지침 비만 1단계 25·2단계 30 — 현행 t2=28은 지침(30)과 상충. 보수 채택 유지 여부 형 결정" },
  { key: "waist", ko: "허리둘레", unit: "cm", dir: "hi", t1: { m: 90, f: 85 }, t2: { m: 100, f: 95 },
    src: { org: "대한비만학회", doc: "복부비만 기준", year: 2022, url: "https://www.kosso.or.kr" },
    status: "관례", note: "t1(남90·여85)은 공식 복부비만 기준. t2는 공식 임계 아님(관례 구간)" },
  /* ── 혈압 ── */
  { key: "sbp", ko: "수축기혈압", unit: "mmHg", dir: "hi", t1: 120, t2: 140,
    src: { org: "대한고혈압학회", doc: "고혈압 진료지침", year: 2022, url: "https://www.koreanhypertension.org" },
    status: "정합", note: "주의혈압 120~129 · 고혈압 ≥140/90 — 정합(t1은 주의혈압 진입선, 보수 채택)" },
  { key: "dbp", ko: "이완기혈압", unit: "mmHg", dir: "hi", t1: 80, t2: 90,
    src: { org: "대한고혈압학회", doc: "고혈압 진료지침", year: 2022, url: "https://www.koreanhypertension.org" },
    status: "정합", note: "고혈압전단계 80~89 · 고혈압 ≥90 — 정합" },
  /* ── 혈당 ── */
  { key: "fbs", ko: "공복혈당", unit: "mg/dL", dir: "hi", t1: 100, t2: 126,
    src: { org: "대한당뇨병학회", doc: "당뇨병 진료지침", year: 2023, url: "https://www.diabetes.or.kr" },
    status: "정합", note: "공복혈당장애 100~125 · 당뇨병 ≥126 — 정합" },
  { key: "hba1c", ko: "당화혈색소", unit: "%", dir: "hi", t1: 5.7, t2: 6.5,
    src: { org: "대한당뇨병학회", doc: "당뇨병 진료지침", year: 2023, url: "https://www.diabetes.or.kr" },
    status: "정합", note: "전단계 5.7~6.4 · 당뇨병 ≥6.5 — 정합" },
  /* ── 지질 ── */
  { key: "tc", ko: "총콜레스테롤", unit: "mg/dL", dir: "hi", t1: 200, t2: 240,
    src: { org: "한국지질·동맥경화학회", doc: "이상지질혈증 진료지침 제5판", year: 2022, url: "https://www.lipid.or.kr" },
    status: "정합", note: "경계 200~239 · 높음 ≥240 — 정합" },
  { key: "tg", ko: "중성지방", unit: "mg/dL", dir: "hi", t1: 150, t2: 200,
    src: { org: "한국지질·동맥경화학회", doc: "이상지질혈증 진료지침 제5판", year: 2022, url: "https://www.lipid.or.kr" },
    status: "정합", note: "경계 150~199 · 높음 ≥200 — 정합" },
  { key: "hdl", ko: "HDL콜레스테롤", unit: "mg/dL", dir: "lo", t1: { m: 40, f: 50 }, t2: { m: 34, f: 40 },
    src: { org: "한국지질·동맥경화학회", doc: "이상지질혈증 진료지침 제5판", year: 2022, url: "https://www.lipid.or.kr" },
    status: "관례", note: "낮음 남<40·여<50은 공식. t2(심한 저하)는 관례 구간" },
  { key: "ldl", ko: "LDL콜레스테롤", unit: "mg/dL", dir: "hi", t1: 130, t2: 160,
    src: { org: "한국지질·동맥경화학회", doc: "이상지질혈증 진료지침 제5판", year: 2022, url: "https://www.lipid.or.kr" },
    status: "정합", note: "경계 130~159 · 높음 ≥160 — 정합(위험군별 목표치는 별개)" },
  /* ── 간 ── */
  { key: "ast", ko: "AST", unit: "IU/L", dir: "hi", t1: 40, t2: 70,
    src: { org: "국민건강보험공단", doc: "국가건강검진 결과통보서 참고치", year: 2024, url: "https://www.nhis.or.kr" },
    status: "관례", note: "정상 상한 40은 국가검진 참고치. t2는 재검 권고 관례선" },
  { key: "alt", ko: "ALT", unit: "IU/L", dir: "hi", t1: 35, t2: 66,
    src: { org: "국민건강보험공단", doc: "국가건강검진 결과통보서 참고치", year: 2024, url: "https://www.nhis.or.kr" },
    status: "관례", note: "정상 상한 35는 국가검진 참고치. t2는 관례선" },
  { key: "ggtp", ko: "γ-GTP", unit: "IU/L", dir: "hi", t1: { m: 63, f: 35 }, t2: { m: 130, f: 80 },
    src: { org: "국민건강보험공단", doc: "국가건강검진 결과통보서 참고치", year: 2024, url: "https://www.nhis.or.kr" },
    status: "관례", note: "정상 상한 남63·여35는 국가검진 참고치. t2는 관례선" },
  /* ── 신장 ── */
  { key: "cr", ko: "혈청크레아티닌", unit: "mg/dL", dir: "hi", t1: 1.3, t2: 1.6,
    src: { org: "KDIGO", doc: "CKD Clinical Practice Guideline", year: 2024, url: "https://kdigo.org" },
    status: "관례", note: "성별·근육량 영향 큼 — eGFR 병행 판정이 원칙. t1·t2는 통상 참고" },
  { key: "egfr", ko: "eGFR", unit: "mL/min/1.73m²", dir: "lo", t1: 60, t2: 45,
    src: { org: "KDIGO", doc: "CKD Clinical Practice Guideline", year: 2024, url: "https://kdigo.org" },
    status: "정합", note: "G3a <60 · G3b <45 — 정합" },
  /* ── 혈액 ── */
  { key: "hb", ko: "혈색소", unit: "g/dL", dir: "lo", t1: { m: 13, f: 12 }, t2: { m: 12, f: 11 },
    src: { org: "WHO", doc: "Haemoglobin concentrations for anaemia", year: 2011, url: "https://www.who.int" },
    status: "정합", note: "빈혈 남<13 · 여<12 — 정합. t2는 중등도 근사" },
  { key: "plt", ko: "혈소판", unit: "천/µL", dir: "lo", t1: 150, t2: 130,
    src: { org: "검사의학 표준 참고치", doc: "혈소판감소 기준", year: 2024, url: "https://www.kslm.org" },
    status: "관례", note: "<150 혈소판감소 통상 기준. t2는 관례선" },
  /* ── 기타 ── */
  { key: "ua", ko: "요산", unit: "mg/dL", dir: "hi", t1: 7.0, t2: 7.5,
    src: { org: "대한류마티스학회", doc: "고요산혈증·통풍 지침", year: 2023, url: "https://www.rheum.or.kr" },
    status: "정합", note: "고요산혈증 >7.0 — 정합. t2는 관례선" },
  { key: "tsh", ko: "TSH", unit: "µIU/mL", dir: "hi", t1: 5.5, t2: 7.0,
    src: { org: "검사실 참고치", doc: "TSH 참고범위", year: 2024, url: "https://www.kslm.org" },
    status: "관례", note: "검사실별 상한 4.2~5.5 편차 — 관례 채택. 저하(항진증) 방향은 별도 해석" },
  /* ── 종양표지자(선별 참고 — 진단 아님) ── */
  { key: "psa", ko: "PSA", unit: "ng/mL", dir: "hi", t1: 3.0, t2: 5.0,
    src: { org: "대한비뇨의학회", doc: "전립선암 조기검진 권고", year: 2023, url: "https://www.urology.or.kr" },
    status: "정합", note: "국내 권고 컷오프 3.0(보수) — 정합" },
  { key: "cea", ko: "CEA", unit: "ng/mL", dir: "hi", t1: 4.1, t2: 7.0,
    src: { org: "검사실 참고치", doc: "CEA 참고범위(비흡연 ≤5)", year: 2024, url: "https://www.kslm.org" },
    status: "관례", note: "참고치 ≤5(비흡연) — 현행 t1=4.1 보수 채택" },
  { key: "afp", ko: "AFP", unit: "ng/mL", dir: "hi", t1: 10.9, t2: 22,
    src: { org: "검사실 참고치", doc: "AFP 참고범위(≤10 내외)", year: 2024, url: "https://www.kslm.org" },
    status: "관례", note: "참고 상한 ~10 — 정합 근사" },
  { key: "ca199", ko: "CA19-9", unit: "U/mL", dir: "hi", t1: 34, t2: 60,
    src: { org: "검사실 참고치", doc: "CA19-9 참고범위(≤37)", year: 2024, url: "https://www.kslm.org" },
    status: "검수 대기", note: "표준 참고 상한 37 — 현행 34는 보수 채택(상충 아님·낮은 문턱). 형 확인" },
];

/* checkupEngine 역참조용 — 기존 _TH와 동일 구조 { key: {dir,t1,t2} } 파생 */
function clinicalTH() {
  const out = {};
  CLINICAL_BANDS.forEach((b) => { out[b.key] = { dir: b.dir, t1: b.t1, t2: b.t2 }; });
  return out;
}
/* 구간 라벨(스크립트 슬롯 {구간표현}의 원천 — P3에서 hmScriptBlocks가 사용) */
function clinicalBandLabel(key, sev) {
  const b = CLINICAL_BANDS.find((x) => x.key === key);
  if (!b) return ["정상", "주의", "위험"][sev] || "";
  return [b.ko + " 정상", b.ko + " 주의 구간", b.ko + " 위험 구간"][sev] || "";
}
