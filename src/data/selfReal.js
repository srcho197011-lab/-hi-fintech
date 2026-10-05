/* ══════════════ 본인(isSelf) 계정 실측 단일 소스 — src/data/mcp_josungrae.json ══════════════
   형 지시(2026-10-05): 「조성래(본인 계정) 화면의 수치를 실측 리포트 값으로 통일하라.」

   원천 2종(PDF 원문 추출):
     ① 국민건강보험공단 국가건강검진 결과통보서 2024-12-26(서울늘편한내과의원) — 12항목 + 암검진
     ② 메디에이지연구소 프롬에이지 Premium 건강분석리포트 2026-05-08 — 생체나이·장기 5종·질병 9종·암 10종·의료비
     (+ 명지병원 종합건강진단결과표 2020-06-23 — 지질·종양표지자 등 6패널)

   규칙(형 지시 ①~④)
   · 본인 계정(isSelf)만 실측. 체험 회원 16명·코호트 10만은 기존 합성 유지(합성 고지도 유지).
   · 화면·엔진은 값을 다시 만들지 않고 **읽어 쓴다**. 파생 불가 값은 「해당 없음」으로 비운다.
   · 실측에 있는 경고(췌장암·간/췌장 노화·당뇨 +6.2%)는 지우지 않는다. 종합 라벨은 리포트대로 「좋음」.
   · 이 파일은 _manifest.txt 맨 앞에 둔다 — core.jsx PT 등 다른 파일의 **최상위 const 초기화**가 이 값을 읽는다.

   동기 보장: JSON 전문을 번들에 문자열로 싣고 최초 호출 때 1회 파싱한다(시연 중 비동기 지연으로 빈 화면이 뜨지 않게).
   원천은 여전히 mcp_josungrae.json 하나다 — 아래 스냅샷이 파일과 다르면 로드 직후 콘솔 경고 +
   window.__hifinSelfRealDrift=true (검증: node scripts/run_selfreal_check.mjs). */

const SELF_REAL_JSON = String.raw`{
  "mcp": {
    "server": "nhis-mcp-checkup",
    "org": "국민건강보험공단",
    "protocol": "MCP 1.0 (local resource bridge)",
    "resource": "nhis://checkup/josungrae",
    "tool": "get_member_checkup",
    "issuedAt": "2026-05-08",
    "consent": "본인 동의(DID) · 마이데이터",
    "note": "국민건강보험공단 건강검진 결과(조성래 실측, PDF 원문 추출). 정적 데모에서는 http 서버가 MCP 리소스 브리지 역할을 하며 실제 fetch로 수신됩니다."
  },
  "member": { "name": "조성래", "sex": "남", "regAge": 54.1, "birth": "1970-12-02", "region": "서울 은평구" },
  "national": {
    "title": "국가건강검진 결과통보서",
    "org": "국민건강보험공단",
    "provider": "서울늘편한내과의원",
    "date": "2024-12-26",
    "judgment": "정상B · 유질환자(고혈압, 잘 조절됨)",
    "items": [
      { "k": "체질량지수(BMI)", "v": 24.9, "unit": "kg/㎡", "ref": "18.5~24.9", "flag": "정상" },
      { "k": "허리둘레", "v": 82.0, "unit": "cm", "ref": "남 <90", "flag": "정상" },
      { "k": "혈압", "v": "119/78", "unit": "mmHg", "ref": "<120/80", "flag": "유질환자(관리중)" },
      { "k": "혈색소", "v": 17.0, "unit": "g/dL", "ref": "13.0~16.5", "flag": "이상(적혈구증다증 소견)" },
      { "k": "공복혈당", "v": 100, "unit": "mg/dL", "ref": "<100", "flag": "공복혈당장애 의심" },
      { "k": "AST", "v": 36, "unit": "IU/L", "ref": "≤40", "flag": "정상" },
      { "k": "ALT", "v": 43, "unit": "IU/L", "ref": "≤35", "flag": "간기능 이상 의심" },
      { "k": "감마지티피", "v": 18, "unit": "IU/L", "ref": "남 ≤63", "flag": "정상" },
      { "k": "혈청크레아티닌", "v": 1.1, "unit": "mg/dL", "ref": "≤1.5", "flag": "정상" },
      { "k": "eGFR", "v": 75, "unit": "mL/min/1.73㎡", "ref": "≥60", "flag": "정상" },
      { "k": "요단백", "v": "음성", "unit": "", "ref": "음성", "flag": "정상" },
      { "k": "흉부촬영", "v": "정상", "unit": "", "ref": "-", "flag": "정상" }
    ],
    "cancer": [
      { "type": "위암", "method": "위내시경", "date": "2024-12-26", "result": "위염(위체부소만) · 조직진단 위염", "flag": "추적" },
      { "type": "대장암", "method": "분변잠혈검사", "date": "2023-11-30", "result": "음성(0 ng/ml, 기준 100)", "flag": "정상" }
    ],
    "lifestyle": ["절주 필요", "신체활동 필요"]
  },
  "comprehensive": {
    "title": "종합건강진단결과표",
    "org": "명지병원",
    "date": "2020-06-23",
    "summary": "총콜레스테롤·중성지방 높음(식이·운동 권고). 상복부초음파 우측 신낭종(1.4cm) 추적. 위내시경 미란 동반 만성 표층성 위염 + 다발성 위궤양 → 만성 활동성 위염(H.pylori 음성).",
    "panels": {
      "지질": [
        { "k": "총콜레스테롤", "v": 218, "unit": "mg/dL", "ref": "<200", "flag": "경계" },
        { "k": "중성지방", "v": 173, "unit": "mg/dL", "ref": "<150", "flag": "경계" },
        { "k": "HDL", "v": 57, "unit": "mg/dL", "ref": "≥60", "flag": "주의" },
        { "k": "LDL", "v": 146, "unit": "mg/dL", "ref": "<130", "flag": "높음" }
      ],
      "당대사": [
        { "k": "공복혈당", "v": 88, "unit": "mg/dL", "ref": "0~99", "flag": "정상" },
        { "k": "당화혈색소(HbA1c)", "v": 5.2, "unit": "%", "ref": "4.9~6.5", "flag": "정상" },
        { "k": "요산", "v": 6.0, "unit": "mg/dL", "ref": "4.0~7.0", "flag": "정상" }
      ],
      "간담도": [
        { "k": "AST", "v": 28, "unit": "IU/L", "ref": "0~40", "flag": "정상" },
        { "k": "ALT", "v": 26, "unit": "IU/L", "ref": "0~35", "flag": "정상" },
        { "k": "감마지티피", "v": 9, "unit": "IU/L", "ref": "11~63", "flag": "정상" },
        { "k": "총빌리루빈", "v": 1.11, "unit": "mg/dL", "ref": "0.2~1.2", "flag": "정상" }
      ],
      "신장·전해질": [
        { "k": "BUN", "v": 15.5, "unit": "mg/dL", "ref": "8~22", "flag": "정상" },
        { "k": "크레아티닌", "v": 1.0, "unit": "mg/dL", "ref": "0~1.5", "flag": "정상" },
        { "k": "eGFR(C-G)", "v": 84, "unit": "mL/min", "ref": "60~200", "flag": "정상" }
      ],
      "종양표지자": [
        { "k": "AFP(간암)", "v": 3.5, "unit": "ng/mL", "ref": "0~10.9", "flag": "정상" },
        { "k": "CEA(대장암)", "v": 0.8, "unit": "ng/mL", "ref": "0~4.1", "flag": "정상" },
        { "k": "CA19-9(췌장암)", "v": 4.84, "unit": "U/mL", "ref": "0~34", "flag": "정상" },
        { "k": "PSA(전립선암)", "v": 0.99, "unit": "ng/dL", "ref": "0~3.0", "flag": "정상" }
      ],
      "갑상선": [
        { "k": "TSH", "v": 2.66, "unit": "uIU/mL", "ref": "0.35~5.50", "flag": "정상" },
        { "k": "Free T4", "v": 1.51, "unit": "ng/dL", "ref": "0.89~1.76", "flag": "정상" }
      ]
    },
    "imaging": [
      { "k": "흉부 X선", "v": "No active lesion (특이소견 없음)" },
      { "k": "상복부 초음파", "v": "우측 신낭종 1.4cm (Small renal cyst, right)" },
      { "k": "심전도", "v": "정상 리듬" },
      { "k": "폐기능(FVC/FEV1)", "v": "98.3% / 76.76% (정상)" }
    ]
  },
  "report": {
    "title": "건강분석리포트 (프롬에이지 Premium)",
    "org": "메디에이지연구소",
    "date": "2026-05-08",
    "bioAge": 52.5,
    "regAge": 54.1,
    "agingSpeed": 0.97,
    "agingRank": 37,
    "overall": "좋음",
    "organs": [
      { "k": "비만체형", "age": 50.9, "flag": "좋음" },
      { "k": "심장", "age": 50.7, "flag": "좋음" },
      { "k": "간", "age": 54.4, "flag": "나쁨" },
      { "k": "췌장", "age": 56.2, "flag": "나쁨" },
      { "k": "신장", "age": 53.4, "flag": "좋음" }
    ],
    "cancerGrade": "4 / 10 등급 (낮은 편)",
    "cancerWarn": [{ "type": "췌장암", "risk": "17.3%", "flag": "경고" }],
    "diseaseTop": [
      { "k": "당뇨병", "risk": "+6.2%", "inc10y": "10.9%" },
      { "k": "고혈압", "risk": "-3.9%", "inc10y": "22.3%" }
    ],
    "diseaseAll": [
      { "k": "비만", "risk": "-24.8%", "inc10y": "25.5%" },
      { "k": "고지혈증", "risk": "-17.1%", "inc10y": "46.4%" },
      { "k": "고혈압", "risk": "-3.9%", "inc10y": "22.3%" },
      { "k": "당뇨병", "risk": "+6.2%", "inc10y": "10.9%" },
      { "k": "허혈심장질환", "risk": "-5.0%", "inc10y": "12.0%" },
      { "k": "급성심근경색증", "risk": "-8.9%", "inc10y": "8.1%" },
      { "k": "뇌혈관질환", "risk": "-3.7%", "inc10y": "10.8%" },
      { "k": "뇌졸중", "risk": "-4.7%", "inc10y": "6.9%" },
      { "k": "치매", "risk": "-5.5%", "inc10y": "5.9%" }
    ],
    "cancerAll": [
      { "k": "간암", "risk": "1.5%", "vs": "높음", "flag": "주의", "inc": "50대 남성 인구 10만명당 27.1명" },
      { "k": "담낭암", "risk": "7.1%", "vs": "낮음", "flag": "주의", "inc": "50대 11.4" },
      { "k": "췌장암", "risk": "17.3%", "vs": "높음", "flag": "경고", "inc": "50대 18.2" },
      { "k": "위암", "risk": "3.5%", "vs": "낮음", "flag": "주의", "inc": "50대 23.3" },
      { "k": "대장암", "risk": "5.0%", "vs": "낮음", "flag": "주의", "inc": "50대 22.0" },
      { "k": "폐암", "risk": "15.6%", "vs": "낮음", "flag": "양호", "inc": "50대 11.8" },
      { "k": "신장암", "risk": "5.8%", "vs": "낮음", "flag": "주의", "inc": "50대 24.6" },
      { "k": "방광암", "risk": "10.4%", "vs": "낮음", "flag": "양호", "inc": "50대 13.4" },
      { "k": "전립선암", "risk": "5.5%", "vs": "낮음", "flag": "주의", "inc": "50대 8.9" },
      { "k": "갑상선암", "risk": "9.8%", "vs": "낮음", "flag": "주의", "inc": "50대 23.0" }
    ],
    "cost": { "thisYear": 2381477, "avgPeer": 2247942, "in10y": 3089692, "in10yPeer": 2915692 },
    "visits": {
      "thisYear": { "outpatient": 24, "outpatientPeer": 22, "inpatient": 24, "inpatientPeer": 22 },
      "in10y": { "outpatient": 24, "outpatientPeer": 22, "inpatient": 20, "inpatientPeer": 19 }
    },
    "notAvailable": ["혈소판", "복약 순응도", "생활미션 이행률", "위험 밴드 상위 N%", "중대질환 진단비 특약 금액", "보장 충실도 점수", "연도별 생체나이 추이(2024 이전)"]
  },
  "meta": {
    "recordCount": 63,
    "sources": ["국민건강보험공단", "명지병원", "메디에이지연구소"],
    "srcLabel": "실측 · 국민건강보험공단 결과통보서(2024-12-26) + 메디에이지 프롬에이지 Premium(2026-05-08)",
    "provenance": {
      "report.diseaseAll": "건강분석리포트(조성래).pdf INDEX 2 원문 추출 — src/core.jsx DISEASES 상수 이관(2026-10-05). 9종 수치·10년 발생률 모두 PDF 대조 확인.",
      "report.cancerAll": "건강분석리포트(조성래).pdf INDEX 3 재대조 완료(2026-10-06) — 암종별 상세 페이지(p.19~28)의 「50대 남성대비 OO발생 위험도 N% · 높음/낮음 · 등급」 세 값을 그대로 옮겼다. risk는 동년배(50대 남성) 기준 상대 위험도이고, vs(높음·낮음)가 그 방향이며, flag는 5등급 배지(고위험·위험·경고·주의·양호)다. 등급과 risk %의 대소가 어긋나 보이는 것(폐암 15.6% 양호 / 갑상선암 9.8% 주의)은 원문 그대로이므로 화면은 vs를 함께 적고 등급에서 수식어를 파생하지 않는다.",
      "report.cost.in10yPeer / report.visits": "건강분석리포트(조성래).pdf 종합분석(p.5) 재대조 완료(2026-10-06) — 금년도 외래 24일(동년배 22일)·입원 24일(동년배 22일), 10년 후 외래 24일(22일)·입원 20일(19일). 금년도 두 행이 같은 값인 것은 원문 그대로다(복사 아님)."
    },
    "disclaimer": "실측 검진데이터(교육·시연용). 확정 진단·처방은 의료진 상담이 필요합니다. 본인(isSelf) 계정 화면만 이 문서를 원천으로 쓰며, 체험 회원 16명·코호트 10만은 합성 데이터입니다."
  }
}
`;

var _srDoc;                                   /* var — 혹시 선언 순서가 밀려도 TDZ로 터지지 않게 */
function selfRealReport() {
  if (_srDoc === undefined) { try { _srDoc = JSON.parse(SELF_REAL_JSON); } catch (e) { _srDoc = null; } }
  return _srDoc || null;
}
/* 출처 고지 한 줄(본인 화면 전용) */
function selfRealSrcLabel() { try { const d = selfRealReport(); return (d && d.meta && d.meta.srcLabel) || ""; } catch (e) { return ""; } }

/* ── 본인 판정 — 여기만 통과한 경로에서 실측을 쓴다(체험 회원·코호트로 새면 persona_diff가 잡는다) ── */
function selfRealIsSelf(m) {
  try {
    if (!m || m.isDemoUser === true) return false;
    if (m.isSelf === true || m.id === "SELF-JOSUNGRAE") return true;
    try { if (typeof HM_SELF_EMAIL !== "undefined" && m.email && m.email === HM_SELF_EMAIL) return true; } catch (e) {}
    const d = selfRealReport();
    return !!(d && m.realVerified === true && m.name === d.member.name);
  } catch (e) { return false; }
}

/* ── 작은 파서들 ── */
function _srPct(s) { const n = Number(String(s == null ? "" : s).replace(/[^0-9.+-]/g, "")); return isNaN(n) ? null : n; }
function selfRealSev(flag) { const f = String(flag || ""); if (!f || /^정상/.test(f) || /^음성/.test(f)) return 0; return 1; }   /* 원천 flag만 본다 — 재계산 금지 */
function selfRealCancerGrade() { try { const d = selfRealReport(); const mm = String(d.report.cancerGrade).match(/(\d+)\s*\/\s*(\d+)/); return mm ? Number(mm[1]) : null; } catch (e) { return null; } }
function selfRealCancerGradeLabel() { try { const d = selfRealReport(); const mm = String(d.report.cancerGrade).match(/\(([^)]+)\)/); return mm ? mm[1] : ""; } catch (e) { return ""; } }

/* ── 원천 항목명 → 표준키 **단일 표** ─────────────────────────────────────────────
   v = 데이터 금고 키(CKUP_LOINC) · c = 검진 항목현황 키(CHECKUP_ITEMS).
   [실측 통일 2026-10-06] 전에는 맵이 두 벌이라 **서로 다른 행을 떨어뜨렸다** —
     · 금고에는 요단백·흉부촬영이 있는데 검진 항목현황에는 없었고(2024 12항목 → 10행),
     · 반대로 요산·종양표지자 4종·TSH는 항목현황에만 있고 금고에는 없었다.
   이제 표는 하나다. 그 화면의 표준코드 사전에 대응 항목이 **없으면 null로 명시**하고,
   해당 행은 조용히 버리지 않고 「표준코드 미매핑」으로 개수를 고지한다(값을 만들지 않는다).
   ※ null을 코드로 메우지 않는 이유 — LOINC/카탈로그 코드는 실측 원천(결과지·리포트)에 없는 값이다. */
const _SR_KEYMAP = {
  /* 국가건강검진 결과통보서 2024-12-26 — 12행 전부 양쪽에 실린다 */
  "체질량지수(BMI)": { v: "bmi", c: "bmi" },
  "허리둘레": { v: "waist", c: "waist" },
  "혈압": { v: "sbp+dbp", c: "sbp+dbp" },                 /* 아래 _srRows에서 2행(sbp·dbp)으로 쪼개되 **판정 행은 하나**로 센다 */
  "혈색소": { v: "hb", c: "hb" },
  "공복혈당": { v: "glucose", c: "fbs" },
  "AST": { v: "ast", c: "ast" },
  "ALT": { v: "alt", c: "alt" },
  "감마지티피": { v: "ggt", c: "ggtp" },
  "혈청크레아티닌": { v: "cr", c: "cr" },
  "eGFR": { v: "egfr", c: "egfr" },
  "요단백": { v: "uprot", c: "uprot" },                   /* 정성 항목(음성) — CHECKUP_ITEMS에 없어 원천 이름·단위로 렌더된다 */
  "흉부촬영": { v: "cxr", c: "cxr" },                     /* 정성 항목(정상) — 위와 같음 */
  /* 명지병원 종합건강진단결과표 2020-06-23 */
  "총콜레스테롤": { v: "tchol", c: "tc" },
  "중성지방": { v: "tg", c: "tg" },
  "HDL": { v: "hdl", c: "hdl" },
  "LDL": { v: "ldl", c: "ldl" },
  "당화혈색소(HbA1c)": { v: "hba1c", c: "hba1c" },
  "크레아티닌": { v: "cr", c: "cr" },
  "eGFR(C-G)": { v: "egfr", c: "egfr" },
  "요산": { v: null, c: "ua" },                           /* 금고 표준코드(CKUP_LOINC)에 없음 */
  "TSH": { v: null, c: "tsh" },
  "PSA(전립선암)": { v: null, c: "psa" },
  "CEA(대장암)": { v: null, c: "cea" },
  "AFP(간암)": { v: null, c: "afp" },
  "CA19-9(췌장암)": { v: null, c: "ca199" },
  "총빌리루빈": { v: null, c: null },                     /* 양쪽 표준코드 사전에 없음 — 개수만 고지 */
  "BUN": { v: null, c: null },
  "Free T4": { v: null, c: null },
};
/* 그 화면의 표준코드에 대응이 없어 싣지 못한 원천 행 이름(= 조용히 버리지 않고 고지할 대상) */
function _srUnmapped(src, which) {
  return (src.rows || []).filter((it) => { const e = _SR_KEYMAP[it.k]; return !e || !e[which]; }).map((it) => it.k);
}
/* 원천 행 수 — 혈압은 2행으로 쪼개도 **판정 행 1개**로 센다(배지의 「N항목」 기준) */
function _srRowCount(src, which) {
  return (src.rows || []).filter((it) => { const e = _SR_KEYMAP[it.k]; return !!(e && e[which]); }).length;
}

/* 원천 행 → {key, value} 목록(혈압은 sbp/dbp 2행으로 쪼개지만 **판정 행은 하나**로 센다) */
function _srRows(src, which) {
  const out = [];
  (src.rows || []).forEach((it) => {
    const e = _SR_KEYMAP[it.k];
    if (it.k === "혈압") {
      if (!e || !e[which]) return;
      const p = String(it.v).split("/");
      out.push({ key: "sbp", value: Number(p[0]), raw: it.v, flagKo: it.flag, flagRow: "혈압", srcRef: it.ref, unit: it.unit, ko: "수축기혈압", srcDate: src.date, srcTitle: src.title });
      out.push({ key: "dbp", value: Number(p[1]), raw: it.v, flagKo: it.flag, flagRow: "혈압", srcRef: it.ref, unit: it.unit, ko: "이완기혈압", srcDate: src.date, srcTitle: src.title });
      return;
    }
    const k = e ? e[which] : null; if (!k) return;
    out.push({ key: k, value: it.v, raw: it.v, flagKo: it.flag, flagRow: it.k, srcRef: it.ref, unit: it.unit, ko: it.k, srcDate: src.date, srcTitle: src.title });
  });
  return out;
}
/* 원천 2시점 — ①2024-12-26 국가검진 ②2020-06-23 종합검진(패널 평탄화) */
function selfRealSources() {
  const d = selfRealReport(); if (!d) return [];
  const comp = d.comprehensive, panels = comp.panels || {};
  const compRows = Object.keys(panels).reduce((a, p) => a.concat(panels[p].map((x) => Object.assign({ panel: p }, x))), []);
  return [
    { date: d.national.date, title: d.national.title, org: d.national.org, provider: d.national.provider, rows: d.national.items || [], year: Number(String(d.national.date).slice(0, 4)) },
    { date: comp.date, title: comp.title, org: comp.org, provider: comp.org, rows: compRows, year: Number(String(comp.date).slice(0, 4)) },
  ];
}

/* ── 「추이 없음」의 근거 **한 문장** — 생체나이 카드·검진 항목현황·요율 재산정·하이가 같은 문장을 쓴다 ──
   (전에는 「시점 1개」·「2시점이라 산출 불가」·「악화 4건」·「연도별 추이 가능」이 동시에 나왔다) */
function selfRealTrendNote() {
  try {
    const d = selfRealReport(); if (!d) return "";
    const S = selfRealSources().slice().sort((a, b) => a.year - b.year);
    if (S.length < 2) return "";
    /* 간격은 **날짜**로 센다 — 연도만 빼면 2020-06-23 → 2024-12-26이 「4년」으로 줄어 사실과 어긋난다 */
    const a = S[0].date.split("-").map(Number), b = S[S.length - 1].date.split("-").map(Number);
    const mo = (b[0] - a[0]) * 12 + (b[1] - a[1]) - (b[2] < a[2] ? 1 : 0);
    const gap = Math.floor(mo / 12) + "년" + (mo % 12 ? " " + (mo % 12) + "개월" : "");
    const sameOrg = S.every((x) => (x.provider || x.org) === (S[0].provider || S[0].org));
    return `연도별 추이는 산출하지 않습니다 — 리포트 생체나이는 ${d.report.date} 1시점이고, 검진은 ${S.map((x) => `${x.date}(${x.provider || x.org})`).join(" · ")} ${S.length}시점·${gap} 간격${sameOrg ? "" : "·측정기관 상이"}입니다.`;
  } catch (e) { return ""; }
}
/* 「내 3년 검진 추이」 대신 쓰는 라벨 — 실제 보유 시점만 말한다 */
function selfRealCompareLabel() {
  try { const ys = selfRealSources().map((x) => x.year).sort((a, b) => a - b); return ys.length >= 2 ? `내 검진 ${ys.length}시점 비교(${ys.join("·")})` : `내 검진 결과(${ys[0]})`; } catch (e) { return "내 검진 결과"; }
}
/* 측정기관이 같은지 — 「개선/악화 N건」을 말하는 화면이 기관 상이를 고지하게 한다 */
function selfRealSameProvider() {
  try { const S = selfRealSources(); return S.every((x) => (x.provider || x.org) === (S[0].provider || S[0].org)); } catch (e) { return true; }
}

/* ── ① 금고 시드 레코드(실측 2건) — 합성 생성기(synthCheckupValues)를 쓰지 않는다 ── */
function selfRealVaultRecords() {
  try {
    const S = selfRealSources(); if (!S.length) return [];
    const mk = (src, meta) => ({
      /* [실측 통일 2026-10-06] raw(원문 값)·unit도 함께 싣는다 — 혈압은 금고에 sbp/dbp로 쪼개지므로
         raw가 없으면 화면이 「혈압 119」처럼 반쪽만 쓰게 된다(결과지 원문은 「119/78mmHg」). */
      items: _srRows(src, "v").map((r) => ({ key: r.key, value: r.value, source: meta.source, confidence: 1, flagKo: r.flagKo, flagRow: r.flagRow, raw: r.raw, unit: r.unit, srcRef: r.srcRef, srcDate: src.date, srcTitle: src.title })),
      /* provider(측정기관)·원천 행 수·표준코드 미매핑 목록을 금고 레코드에 함께 싣는다 —
         화면이 「어디서 잰 값인지」와 「원천 몇 행 중 몇 행을 실었는지」를 추측하지 않게. */
      meta: Object.assign({ date: src.date, channel: "upload", provider: src.provider || src.org || "",
        srcRows: (src.rows || []).length, rowsUsed: _srRowCount(src, "v"), unmapped: _srUnmapped(src, "v") }, meta),
    });
    return [
      mk(S[1], { source: "self-real", completeness: "partial", fileName: "종합건강진단결과표_2020.pdf" }),
      mk(S[0], { source: "self-real", completeness: "full", fileName: "국가건강검진_결과통보서_2024.pdf" }),
    ];
  } catch (e) { return []; }
}

/* ── 국가검진(최신) 이상·의심 항목 — 판정 행 기준 4항목(혈압·혈색소·공복혈당·ALT) ── */
function selfRealAbnormals() {
  try {
    const d = selfRealReport(); if (!d) return [];
    return (d.national.items || []).filter((it) => selfRealSev(it.flag) > 0)
      .map((it) => ({ ko: it.k, value: it.v, unit: it.unit || "", ref: it.ref || "", flag: it.flag, date: d.national.date }));
  } catch (e) { return []; }
}
/* 2020 종합검진 경계·주의 항목(6년 전 — 헤드라인 건수에 넣지 않고 따로 보여 준다) */
function selfRealOldAbnormals() {
  try {
    const S = selfRealSources(); if (S.length < 2) return [];
    return _srRows(S[1], "c").filter((r) => selfRealSev(r.flagKo) > 0)
      .map((r) => ({ ko: r.ko, value: r.value, unit: r.unit || "", ref: r.srcRef || "", flag: r.flagKo, date: r.srcDate }));
  } catch (e) { return []; }
}
/* 영상·내시경·암검진 소견(수치가 아닌 실측 소견) */
function selfRealFindings() {
  try {
    const d = selfRealReport(); if (!d) return null;
    return { cancer: d.national.cancer || [], imaging: (d.comprehensive && d.comprehensive.imaging) || [], summary: (d.comprehensive && d.comprehensive.summary) || "", compDate: d.comprehensive && d.comprehensive.date, natDate: d.national.date };
  } catch (e) { return null; }
}

/* 금고에 실측 2건이 실제로 들어 있는지 — 화면이 「실측 검진 연동 ✓」 배지를 달기 전에 확인한다.
   (회원이 직접 올린 결과지가 섞여 이관이 건너뛰어진 기기에서는 금고가 아직 구 합성일 수 있다.
    ok:null = 확인 경로 없음 — 이 경우에만 원천 기준으로 표기하고, false면 배지를 내린다.) */
function selfRealVaultCheck(m) {
  try {
    if (!m || typeof vaultLoad !== "function" || typeof anonToken !== "function") return { ok: null, dates: [], n: 0 };
    const v = vaultLoad(anonToken(m));
    const cks = (v && v.checkups) || [];
    const have = cks.filter((c) => c.source === "self-real").map((c) => c.date).sort();
    const want = selfRealSources().map((x) => x.date).sort();
    return { ok: want.length > 0 && want.length === have.length && want.every((d, i) => d === have[i]), dates: have, n: have.length, total: cks.length };
  } catch (e) { return { ok: null, dates: [], n: 0 }; }
}

/* ── ② 리포트 파생 — 전부 읽어 쓴다 ── */
function selfRealOrgans() {   /* [이름, 나이, 좋음/나쁨, good] — demoReport.organs 형식 */
  try { return (selfRealReport().report.organs || []).map((o) => [o.k, o.age, o.flag, o.flag === "좋음"]); } catch (e) { return []; }
}
function selfRealOrganAge(ko) { try { const o = (selfRealReport().report.organs || []).find((x) => x.k === ko); return o ? o.age : null; } catch (e) { return null; } }
function selfRealDiseases() { /* [이름, 상대위험 %, 10년 발생률] */
  try { return (selfRealReport().report.diseaseAll || []).map((x) => [x.k, _srPct(x.risk), x.inc10y]); } catch (e) { return []; }
}
function selfRealDiseaseOf(ko) { try { return (selfRealReport().report.diseaseAll || []).find((x) => x.k === ko) || null; } catch (e) { return null; } }
function selfRealCancers() { /* [이름, 등급] */
  try { return (selfRealReport().report.cancerAll || []).map((x) => [x.k, x.flag]); } catch (e) { return []; }
}
function selfRealCancerOf(ko) { try { return (selfRealReport().report.cancerAll || []).find((x) => x.k === ko) || null; } catch (e) { return null; } }
function selfRealCancerWarn() { try { return selfRealReport().report.cancerWarn || []; } catch (e) { return []; } }
function selfRealCost() { try { return selfRealReport().report.cost || null; } catch (e) { return null; } }
function selfRealVisits() { try { return selfRealReport().report.visits || null; } catch (e) { return null; } }

/* 관리 포인트 — 원천(생활습관 문진 + 장기 나쁨 + 암경고 + 이상항목)에서 파생. 상수 문구를 만들지 않는다. */
function selfRealManagementPoints() {
  try {
    const d = selfRealReport(); if (!d) return [];
    const out = [];
    const bp = (d.national.items || []).find((x) => x.k === "혈압");
    if (bp && selfRealSev(bp.flag) > 0) out.push(`고혈압 관리 유지 — 혈압 ${bp.v}mmHg 「${bp.flag}」`);
    (d.national.lifestyle || []).forEach((l) => out.push(`${l} (국가검진 생활습관 문진)`));
    const bad = (d.report.organs || []).filter((o) => o.flag !== "좋음");
    if (bad.length) out.push(`${bad.map((o) => o.k + " " + o.age + "세").join("·")} 노화 — 복부 초음파 등 정밀검사 상담`);
    (d.report.cancerWarn || []).forEach((w) => out.push(`${w.type} 「${w.flag}」(위험도 ${String(w.risk).replace(/^\+/, "")}) — 전문의 상담`));
    selfRealAbnormals().forEach((a) => { if (/공복혈당/.test(a.ko)) out.push(`공복혈당 ${a.value}${a.unit} 「${a.flag}」 — 혈당 모니터링`); if (/ALT/.test(a.ko)) out.push(`ALT ${a.value}${a.unit} 「${a.flag}」 — 간수치 추적`); if (/혈색소/.test(a.ko)) out.push(`혈색소 ${a.value}${a.unit} 「${a.flag}」 — 혈액내과 확인`); });
    return out;
  } catch (e) { return []; }
}

/* ── 본인 프로필(selfMember·core.jsx PT의 단일 소스) ── */
function selfRealProfile() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const r = d.report, mb = d.member;
    const bp = (d.national.items || []).find((x) => x.k === "혈압");
    const confirmed = /유질환자\(([^)]+)\)/.exec(d.national.judgment || "");
    return {
      name: mb.name, sex: mb.sex, regAge: mb.regAge, birth: mb.birth, region: mb.region,
      biologicalAge: r.bioAge, agingSpeed: r.agingSpeed, agingRank: r.agingRank, overall: r.overall,
      obesityAge: selfRealOrganAge("비만체형"), heartAge: selfRealOrganAge("심장"), liverAge: selfRealOrganAge("간"),
      pancreasAge: selfRealOrganAge("췌장"), kidneyAge: selfRealOrganAge("신장"),
      cancerRiskGrade: selfRealCancerGrade(), cancerGradeLabel: selfRealCancerGradeLabel(),
      highRiskCancerTypes: (r.cancerWarn || []).map((w) => w.type),
      /* 확정 질환은 국가검진 판정에 적힌 것 하나(고혈압·잘 조절됨)뿐이다 — 당뇨·지방간은 「위험·의심」 단계 */
      highRiskDiseases: confirmed ? [String(confirmed[1]).split(",")[0].trim()] : [],
      confirmedNote: confirmed ? confirmed[1] : "",
      /* 「고혈압, 잘 조절됨」 → 「고혈압(잘 조절됨)」 — 화면 문구용 */
      confirmedLabel: confirmed ? (() => { const ps = String(confirmed[1]).split(",").map((s) => s.trim()); return ps[0] + (ps[1] ? `(${ps.slice(1).join(", ")})` : ""); })() : "",
      bpNote: bp ? `${bp.v}mmHg 「${bp.flag}」` : "",
      judgment: d.national.judgment, checkupDate: d.national.date, reportDate: r.date,
      estimatedMedicalCost: (r.cost || {}).thisYear,
      managementPoints: selfRealManagementPoints(),
      src: selfRealSrcLabel(),
    };
  } catch (e) { return null; }
}

/* ── ③ 계보(1세대 금고 → 2세대 분석) 실측 치환 — lineageProfile 호환 형식 ── */
function selfRealLineage() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const p = selfRealProfile(); if (!p) return null;
    const ab = selfRealAbnormals();
    const evidence = (d.report.organs || []).map((o) => ({ organ: o.k, field: null, age: o.age, delta: null, sevSum: null, src: "메디에이지 프롬에이지 Premium " + d.report.date,
      items: ab.filter((a) => (o.k === "간" && /ALT|AST|감마/.test(a.ko)) || (o.k === "췌장" && /공복혈당/.test(a.ko)) || (o.k === "심장" && /혈압/.test(a.ko))).map((a) => ({ key: a.ko, ko: a.ko, value: a.value, unit: a.unit, sev: 1, flag: a.flag })) }));
    return {
      fields: { biologicalAge: p.biologicalAge, obesityAge: p.obesityAge, heartAge: p.heartAge, liverAge: p.liverAge, pancreasAge: p.pancreasAge, kidneyAge: p.kidneyAge, cancerRiskGrade: p.cancerRiskGrade },
      evidence, date: d.national.date, channel: "upload", completeness: "full",
      n: (d.national.items || []).length, history: selfRealSources().length, reg: p.regAge, totalSev: null, real: true,
    };
  } catch (e) { return null; }
}

/* ── ④ demoReport(R) 실측 치환 — 화면·하이·프로 콘솔이 모두 이 한 덩이를 읽는다 ── */
function selfRealShape(m) {
  try {
    const d = selfRealReport(); if (!d) return null;
    const p = selfRealProfile(); if (!p) return null;
    const r = d.report, cost = r.cost || {}, ab = selfRealAbnormals();
    const organs = selfRealOrgans();
    const worst = organs.filter((o) => o[2] !== "좋음").sort((a, b) => b[1] - a[1]).map((o) => o[0].replace("비만체형", "비만"));
    const diff = +(p.biologicalAge - p.regAge).toFixed(1);
    const cgLabel = p.cancerGradeLabel || "";
    const cg = [cgLabel, "#16A34A", "#E7F8EE"];                       /* 암 위험도 라벨(리포트 「낮은 편」) */
    /* [실측 통일 2026-10-06] 「연동 ✓」는 금고에 실측 2건이 실제로 있을 때만 단정한다(형 지시 ④ — 없는 사실을 적지 않는다) */
    const vc = selfRealVaultCheck(m);
    const flags = [
      vc.ok === false
        ? { t: `실측 원천 기준 ${d.national.date} · ${d.national.org} 결과통보서 ${(d.national.items || []).length}항목 — 데이터 금고 반영 대기(현재 ${vc.n}건)`, c: "#B45309", bg: "#FEF3E2", ic: "warn" }
        : { t: `실측 검진 연동 ✓ ${d.national.date} · ${d.national.org} 결과통보서 ${(d.national.items || []).length}항목`, c: "#065F46", bg: "#D1FAE5", ic: "check" },
      { t: "근거: " + (ab.length ? ab.map((a) => `${a.ko} ${a.value}${a.unit}(${a.flag})`).join(" · ") : "전 항목 정상"), c: "#1E40AF", bg: "#DBEAFE" },
    ];
    if (worst.length) flags.push({ t: `노화 빠른 장기: ${worst.join("·")}`, c: "#B91C1C", bg: "#FDECEC" });
    (r.cancerWarn || []).forEach((w) => flags.push({ t: `${w.flag} 암: ${w.type} 위험도 ${String(w.risk).replace(/^\+/, "")}`, c: "#fff", bg: "#EF4444", ic: "warn" }));
    if (p.highRiskDiseases.length) flags.push({ t: `확정 질환: ${p.confirmedLabel || p.highRiskDiseases.join("·")} — 국가검진 ${d.national.date}`, c: "#B45309", bg: "#FEF3E2", ic: "warn" });
    flags.push({ t: `암위험 ${p.cancerRiskGrade}등급/10 · ${cgLabel}`, c: "#15803D", bg: "#E7F8EE" });
    flags.push({ t: `노화속도 ${r.agingSpeed}배(${r.agingSpeed > 1 ? "빠름" : "느림"})`, c: r.agingSpeed > 1 ? "#B45309" : "#15803D", bg: r.agingSpeed > 1 ? "#FEF3E2" : "#E7F8EE", ic: r.agingSpeed > 1 ? "up" : "check" });
    return {
      bio: r.bioAge, reg: p.regAge, diff, agingRank: r.agingRank, agingSpeed: r.agingSpeed,
      organs, worstNames: worst, cg, cgLabel, evalLabel: r.overall,
      diseases: selfRealDiseases(), cancers: selfRealCancers(), cancerTotal: p.cancerRiskGrade,
      costThis: cost.thisYear, cost10: cost.in10y, costPeer: cost.avgPeer, cost10Peer: cost.in10yPeer,
      visits: r.visits || null, recs: p.managementPoints, hr: p.highRiskCancerTypes, hrd: p.highRiskDiseases,
      judgment: p.judgment, abnormals: ab, flags, sex: p.sex, src: p.src, selfReal: true,
      vaultOk: vc.ok, vaultDates: vc.dates, trendNote: selfRealTrendNote(), compareLabel: selfRealCompareLabel(),
      _lineage: { source: "self-real", date: d.national.date, n: (d.national.items || []).length, history: selfRealSources().length, evidence: (selfRealLineage() || {}).evidence || [], totalSev: null, src: p.src },
    };
  } catch (e) { return null; }
}

/* ── ⑤ 검진 항목현황(genMemberCheckup 호환) — 실측 2시점만, 중간 연도는 만들지 않는다 ── */
function selfRealCheckup() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const CAT = (typeof CHECKUP_ITEMS !== "undefined") ? CHECKUP_ITEMS : [];
    const S = selfRealSources();
    const byKey = {};
    S.slice().sort((a, b) => a.year - b.year).forEach((src) => {
      _srRows(src, "c").forEach((r) => {
        (byKey[r.key] = byKey[r.key] || []).push({ year: src.year, date: src.date, value: r.value, flag: r.flagKo, sev: selfRealSev(r.flagKo), label: r.flagKo, srcTitle: src.title, srcRef: r.srcRef, ko: r.ko });
      });
    });
    const items = {};
    Object.keys(byKey).forEach((k) => {
      const pts = byKey[k], cur = pts[pts.length - 1];
      const it = CAT.find((x) => x.key === k) || null;
      /* 참고치는 **결과지에 인쇄된 값**을 먼저 쓴다 — 카탈로그 기준치로 바꾸면 판정 문구(원천)와 어긋난다
         (예: HDL 57 — 결과표 기준 「≥60 · 주의」인데 카탈로그 기준은 「≥40 · 정상」). */
      items[k] = { key: k, name: (it && it.name) || cur.ko, value: cur.value, unit: (it && it.unit) || "",
        sev: cur.sev, label: cur.label,
        ref: cur.srcRef || ((it && typeof _refStr === "function") ? _refStr(it, "m") : ""),
        srcRef: cur.srcRef, item: it, series: pts, cur, srcDate: cur.date, srcTitle: cur.srcTitle, points: pts.length };
    });
    const judgment = String(d.national.judgment || "");
    const grade = /정상A/.test(judgment) ? "정상A" : /정상B/.test(judgment) ? "정상B" : /유질환자/.test(judgment) ? "유질환자" : "정상B";
    const conf = /유질환자\(([^)]+)\)/.exec(judgment);
    const gd = (typeof NAT_GRADES !== "undefined" && NAT_GRADES[grade]) || "";
    const ab = selfRealAbnormals();
    return {
      selfReal: true, sex: "m", items,
      nat: { grade, gradeLabel: judgment, gradeDesc: gd + (conf ? ` 다만 ${conf[1]} — 유질환(관리중)으로 지속 관리가 필요합니다.` : ""),
        diseases: conf ? [conf[1]] : [], life: (d.national.lifestyle || []).slice(), date: d.national.date,
        org: d.national.org, provider: d.national.provider, src: (typeof NAT_SRC !== "undefined" ? NAT_SRC : "국가건강검진") + " 결과통보서(" + d.national.date + ")" },
      comp: { abnormals: ab.map((a) => `${a.ko} ${a.value}${a.unit} 「${a.flag}」`), date: d.comprehensive.date, org: d.comprehensive.org,
        summary: d.comprehensive.summary, src: (typeof COMP_SRC !== "undefined" ? COMP_SRC : "종합건강진단결과표") + "(" + d.comprehensive.date + ")" },
      abnMain: ab, abnOld: selfRealOldAbnormals(), findings: selfRealFindings(),
      trend: null, trendLabel: "해당 없음",                             /* 2시점(6년 간격·기관 상이) — 추이 산출 불가 */
      trendNote: selfRealTrendNote(), trendCompareLabel: selfRealCompareLabel(),
      years: S.slice().sort((a, b) => a.year - b.year).map((x) => x.year),
      /* 배지의 「N항목」과 표의 행 수가 어긋나지 않도록 원천 행 수를 함께 들고 나간다(가드가 단언한다) */
      natRows: _srRowCount(S[0], "c"), compRows: _srRowCount(S[1], "c"),
      unmapped: { nat: _srUnmapped(S[0], "c"), comp: _srUnmapped(S[1], "c") },
      report: null, src: selfRealSrcLabel(),
    };
  } catch (e) { return null; }
}

/* ── ⑥ 건강상태 등급(memberHealthGrade 호환) — 리포트 「좋음」 + 국가검진 유질환자(관리중) ⇒ 「지속관리」 ── */
function selfRealGrade() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const ab = selfRealAbnormals();
    const grade = /유질환자/.test(d.national.judgment || "") ? "지속관리" : (ab.length ? "경계" : "정상");
    const meta = (typeof HEALTH_GRADES !== "undefined" && HEALTH_GRADES[grade]) || { c: "#2563EB", bg: "#E8F1FE", act: "정기상담·모니터링", desc: "장기 추적 필요" };
    return { grade, meta, act: meta.act, desc: `${d.national.judgment} · 리포트 종합 「${d.report.overall}」`, sev2: 0, sev1: ab.length, selfReal: true };
  } catch (e) { return null; }
}

/* ── ⑦ 통합 임상 프로필(memberClinicalProfile 호환) — 원천에 없는 칸은 null(「해당 없음」) ── */
function selfRealClinical() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const conf = /유질환자\(([^)]+)\)/.exec(d.national.judgment || "");
    const parts = conf ? String(conf[1]).split(",").map((s) => s.trim()) : [];
    return {
      diagnoses: parts.length ? [{ name: parts[0] + (parts[1] ? `(${parts.slice(1).join(", ")})` : ""), since: `${d.national.date} 국가검진 판정` }] : [],
      suspects: selfRealAbnormals().filter((a) => /의심|이상/.test(a.flag)).map((a) => ({ name: a.ko, note: `${a.value}${a.unit} 「${a.flag}」` })),
      meds: [], medsNote: "해당 없음 — 원천(결과통보서·리포트)에 처방 정보가 없습니다",
      careNeed: `정기상담·모니터링 (${d.national.judgment})`,
      adherence: { med: null, mission: null, checkupYear: null },
      adherenceNote: "해당 없음 — 복약 순응도·생활미션 이행률은 원천에 없습니다",
      grade: (selfRealGrade() || {}).grade || null, selfReal: true, src: selfRealSrcLabel(),
    };
  } catch (e) { return null; }
}

/* ── ⑧ 질병 위험 행(프로 콘솔 ④·치료비 케어 위험 예측) — 백분위는 원천에 없어 비운다 ── */
function selfRealRiskRows() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const dm = selfRealDiseaseOf("당뇨병"), ht = selfRealDiseaseOf("고혈압");
    const liver = selfRealOrganAge("간"), panc = selfRealOrganAge("췌장");
    const ab = selfRealAbnormals();
    const f = (re) => ab.filter((a) => re.test(a.ko)).map((a) => `${a.ko} ${a.value}${a.unit}(${a.flag})`).join(" · ");
    const rows = [];
    if (dm) rows.push({ ko: "당뇨병", code: "E11", band: null, why: `리포트 동년배 대비 ${dm.risk} · 10년 발생률 ${dm.inc10y}${f(/공복혈당/) ? " · " + f(/공복혈당/) : ""}`, trend: "해당 없음" });
    rows.push({ ko: "간질환", code: "K76", band: null, why: `간 생체나이 ${liver}세(나쁨)${f(/ALT|AST|감마/) ? " · " + f(/ALT|AST|감마/) : ""}`, trend: "해당 없음" });
    if (ht) rows.push({ ko: "고혈압", code: "I10", band: null, why: `국가검진 유질환자(관리중) · 리포트 동년배 대비 ${ht.risk} · 10년 발생률 ${ht.inc10y}${f(/혈압/) ? " · " + f(/혈압/) : ""}`, trend: "해당 없음" });
    (d.report.cancerWarn || []).forEach((w) => rows.push({ ko: w.type, code: "C25", band: null, why: `리포트 암경고 — 위험도 ${String(w.risk).replace(/^\+/, "")} · 췌장 생체나이 ${panc}세(나쁨)`, trend: "해당 없음" }));
    return { src: `실측 — ${d.report.org} ${d.report.date} · ${d.national.org} ${d.national.date}`, rows, bandNote: "위험 밴드(상위 N%)는 원천에 없어 표시하지 않습니다", selfReal: true };
  } catch (e) { return null; }
}

/* ── ⑨ 보험 보장분석 근거(insuranceStats) — 실측 신호만 ── */
function selfRealInsBasis() {
  try {
    const d = selfRealReport(); if (!d) return null;
    const p = selfRealProfile();
    const ab = selfRealAbnormals();
    const g = (re) => (ab.find((a) => re.test(a.ko)) || null);
    const fbs = g(/공복혈당/), alt = g(/ALT/);
    const dm = selfRealDiseaseOf("당뇨병");
    const cyst = ((d.comprehensive && d.comprehensive.imaging) || []).find((x) => /신낭종|renal cyst/i.test(x.v || ""));
    return {
      diseases: p ? p.highRiskDiseases.slice() : [],
      ciDiseases: ["고혈압(관리중)"].concat(fbs ? [`당뇨병 위험 — 공복혈당 ${fbs.value}${fbs.unit} 「${fbs.flag}」`] : []).concat(alt ? [`간기능 이상 의심 — ALT ${alt.value}${alt.unit}`] : []),
      cancerTypes: p ? p.highRiskCancerTypes.slice() : [],
      drinker: (d.national.lifestyle || []).some((l) => /절주|음주/.test(l)),
      drinkerBasis: "국가검진 생활습관 문진 「절주 필요」",
      kidneyBasis: [fbs ? `공복혈당 ${fbs.value}${fbs.unit} 「${fbs.flag}」` : null, dm ? `당뇨병 위험 동년배 대비 ${dm.risk}(10년 ${dm.inc10y})` : null, cyst ? `${cyst.k} — ${cyst.v}(${d.comprehensive.date})` : null].filter(Boolean).join(" · ") + " — 당뇨 합병증(투석·이식) 시 고액 의료비",
      liverBasis: [alt ? `ALT ${alt.value}${alt.unit} 「${alt.flag}」` : null, `간 생체나이 ${selfRealOrganAge("간")}세(나쁨)`, "국가검진 생활습관 「절주 필요」"].filter(Boolean).join(" · ") + " — 간경화·간부전 진행 시 고액 치료비",
      cancerBasis: (d.report.cancerWarn || []).map((w) => `${w.type} 「${w.flag}」 위험도 ${String(w.risk).replace(/^\+/, "")}`).join(" · ") + ` · 암위험 ${d.report.cancerGrade}`,
      src: selfRealSrcLabel(),
    };
  } catch (e) { return null; }
}

/* ── 스냅샷 드리프트 감시(표시에 영향 없음 — 콘솔 경고 + 플래그만) ── */
try {
  if (typeof window !== "undefined" && typeof fetch === "function" && !window.__hifinSelfRealChecked) {
    window.__hifinSelfRealChecked = true;
    fetch("./src/data/mcp_josungrae.json").then((r) => (r.ok ? r.text() : null)).then((t) => {
      if (!t) return;
      const a = JSON.stringify(JSON.parse(t)), b = JSON.stringify(selfRealReport());
      window.__hifinSelfRealDrift = a !== b;
      if (a !== b) console.warn("[selfReal] 번들 스냅샷 ≠ src/data/mcp_josungrae.json — node scripts/run_selfreal_check.mjs 로 확인하세요.");
    }).catch(() => {});
  }
} catch (e) {}
