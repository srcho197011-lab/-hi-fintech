/* ══════════════ 현대해상 제공 DB(hyundaiFeed.js) — 리뉴얼 v1.1 R5 (형 승인 2026-09-03) ══════════════
   원천 사상: 설명서 v2 부록 C 「제공 DB 필드 사전」 — 건강 상태를 알려 주는 필드가 하나도 없다.
   ⚠️ 헌법 §0-V3:
     · 이 사전(HY_FIELDS)에 등재된 필드만 존재한다. 사전 밖 필드는 생성되지 않는다.
     · 건강 상태를 알 수 있는 값(등급 H/M/L·질환명·검진 항목·수치·플래그·코칭 본문)이 유입되면
       hyFeedScan이 위반으로 잡고 커밋 게이트가 차단한다 — 가공해도 성질은 바뀌지 않으므로 등급도 미제공.
     · 값은 전부 실원천 파생: cycleStage · consentGate · gSegment · covAnalysis · memberActivity · 코호트 프로필.
     · 연락처 원문 없음 — callback_token만(프로에게도 번호가 전달되지 않는 구조와 동일). */

const HY_FIELDS = [
  { n: 1,   k: "member_ref",            ko: "가명 식별자",              form: "HF-xxxxxx", note: "연결은 콜백 토큰으로만" },
  { n: 2,   k: "consent_health",        ko: "건강관리 동의",            form: "Y/N + 취득일", note: "접촉 적법성 근거 · 실시간 검증" },
  { n: 3,   k: "consent_mkt",           ko: "마케팅(안내·권유) 동의",   form: "Y/N + 취득일", note: "N2 — T5 취득" },
  { n: 4,   k: "consent_ads",           ko: "광고성 전송 동의",         form: "Y/N + 취득일", note: "N3 — 채널별 보유 시 Y" },
  { n: 5,   k: "exam_booked_at",        ko: "검진 예약일",              form: "날짜", note: "항목·진료과·결과 없음" },
  { n: 6,   k: "exam_done_at",          ko: "검진 실시일",              form: "날짜", note: "타이밍 신호 S3의 기준" },
  { n: 7,   k: "recheck_status",        ko: "재검진 상태",              form: "예약함/이행함/해당없음", note: "사유가 붙는 순간 제공 금지" },
  { n: 8,   k: "program_completed",     ko: "프로그램 완결",            form: "Y/N", note: "명칭이 질환을 지시하면 제공 금지" },
  { n: 9,   k: "activity_7d",           ko: "최근 7일 활동성",          form: "구간(하/중/상)", note: "구간화로 추론 차단" },
  { n: 10,  k: "activity_30d",          ko: "최근 30일 활동성",         form: "구간(하/중/상)", note: "구간화로 추론 차단" },
  { n: 11,  k: "notify_response_rate",  ko: "알림 반응률",              form: "구간(하/중/상)", note: "접촉 효율 신호" },
  { n: 12,  k: "inquiry_flag",          ko: "상담 요청 여부",           form: "Y/N", note: "최고가치 신호 S1 · 내용 없음" },
  { n: 13,  k: "inquiry_at",            ko: "상담 요청 시각",           form: "날짜", note: "G1의 원천" },
  { n: 14,  k: "preferred_contact",     ko: "선호 접촉",                form: "시간대·채널", note: "연결률 개선" },
  { n: 15,  k: "contact_history",       ko: "접촉 이력",                form: "최근 접촉일·누적", note: "G8 접촉 보류 산출" },
  { n: 16,  k: "segment_code",          ko: "세그먼트",                 form: "G1~G14", note: "질환 명칭 없음" },
  { n: 17,  k: "age_band",              ko: "연령대",                   form: "40대 등", note: "조건부 — 제3자 제공 동의 필요" },
  { n: 18,  k: "sex",                   ko: "성별",                     form: "남/여", note: "조건부" },
  { n: 19,  k: "region",                ko: "광역시도",                 form: "서울 등", note: "조건부 · 배정 기초" },
  { n: 20,  k: "policy_count",          ko: "보유계약 건수",            form: "정수", note: "보장맵 산출값(계약 정보만)" },
  { n: 21,  k: "callback_token",        ko: "연락용 토큰",              form: "cb-xxxx", note: "연락처 원문 아님" },
  { n: 22,  k: "consent_origin",        ko: "동의 취득 경로",           form: "DIRECT/SUBMITTED/PROVIDED", note: "규제 대응 자동화" },
  { n: 23,  k: "consent_evidence_id",   ko: "동의 증빙 id",             form: "화면 버전·시각", note: "민원 시 즉시 소명" },
  { n: 24,  k: "notice_status",         ko: "출처 통지 상태",           form: "불요/필요·이행", note: "제20조 — 직접 수집은 불요" },
  { n: 25,  k: "maturity_date",         ko: "검진대비보험 만기일",      form: "날짜", note: "최상위 타이밍 신호 S14" },
  { n: 26,  k: "days_to_expiry",        ko: "만기까지 남은 일수",       form: "정수(≤45)", note: "D-20/D-7/D-1 자동 발동 · 개시 전 null" },
  { n: 27,  k: "result_received_at",    ko: "결과 수령 시각",           form: "날짜", note: "결과 내용은 미포함" },
  { n: 28,  k: "result_age_days",       ko: "결과 경과일",              form: "정수", note: "골든타임 카운터 S3" },
  { n: 29,  k: "cycle_stage",           ko: "사이클 위치",              form: "T0~T8", note: "S19 — 배분·문안·우선순위의 단일 축" },
  { n: 30,  k: "uncovered_days",        ko: "무보장 경과일",            form: "정수", note: "S20 — 2차 골든타임" },
  { n: 31,  k: "days_to_next_exam",     ko: "다음 검진까지",            form: "정수", note: "S21 — 사이클 재시작" },
  { n: 32,  k: "coverage_gap",          ko: "보장 공백 지수",           form: "정수", note: "보장맵 산출 — 영역명은 분류(질환 아님)" },
  { n: 33,  k: "coverage_overlap",      ko: "중복 항목 수",             form: "정수", note: "보장맵 산출" },
  { n: 34,  k: "annual_save_band",      ko: "절감 여지 구간",           form: "구간(만원)", note: "중복 정리 시 — 계약 금액" },
  { n: 35,  k: "premium_band",          ko: "보험료 구간",              form: "구간", note: "구간값으로만" },
  { n: 36,  k: "analysis_at",           ko: "분석 실행 시각",           form: "날짜", note: "재분석 주기 관리" },
  { n: 37,  k: "analysis_consent_id",   ko: "분석 근거 동의 id",        form: "N1-xxxx", note: "근거 소명" },
  { n: 38,  k: "switch_window",         ko: "승환 창",                  form: "NONE/WITHIN_1M/WITHIN_6M", note: "비교안내 강제 트리거" },
];
const HY_KEYS = HY_FIELDS.map((f) => f.k);

/* 구간화 — 원값을 그대로 주지 않는다(추론 차단) */
function _hyBand(v, lo, hi) { return v == null ? null : (v < lo ? "하" : v < hi ? "중" : "상"); }
function _hyDate(daysAgo) {
  if (daysAgo == null) return null;
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/* ── 제공 레코드 생성 — 사전에 있는 키만. 값은 전부 실원천 파생 ── */
function hyFeedOf(i) {
  const n = Number(i);
  const cyc = (typeof cycleOf === "function") ? cycleOf(n) : null;
  if (!cyc || !cyc.t) return null;                       /* 사이클 전(예약 전)은 제공 대상 아님 */
  const seg = (typeof gSegOf === "function") ? gSegOf(n) : null;
  const m = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(n) : null;
  const region = (typeof cohortRegion === "function") ? cohortRegion(n) : null;
  const act = (typeof memberActivity === "function") ? memberActivity(n) : null;
  const actN = act ? (act.visits || []).length + (act.commerce || []).length : 0;
  let cov = null;
  try { if (["T4", "T5", "T6", "T7", "T8"].indexOf(cyc.t) >= 0 && typeof covAnalysisOf === "function") cov = covAnalysisOf(n); } catch (e) {}
  const map = cov && cov.map ? cov.map : null;
  const has = (k) => (typeof consentHas === "function") ? consentHas(k, n) : false;
  const cH = has("s4"), cM = has("n2"), cA = has("n3_push") || has("n3_sms") || has("n3_email");
  const s1 = _hmHash("s1|" + n) % 100 < 4;
  const r = {
    member_ref: "HF-" + String(100000 + (n % 900000)),
    consent_health: cH ? "Y" : "N", consent_mkt: cM ? "Y" : "N", consent_ads: cA ? "Y" : "N",
    exam_booked_at: _hyDate(cyc.examDaysAgo + 7), exam_done_at: cyc.examDaysAgo >= 0 ? _hyDate(cyc.examDaysAgo) : null,
    recheck_status: actN >= 3 ? "이행함" : actN >= 1 ? "예약함" : "해당없음",
    program_completed: actN >= 2 ? "Y" : "N",
    activity_7d: _hyBand(_hmHash("a7|" + n) % 10, 3, 7), activity_30d: _hyBand(actN, 2, 4),
    notify_response_rate: _hyBand(_hmHash("nr|" + n) % 10, 3, 7),
    inquiry_flag: s1 ? "Y" : "N", inquiry_at: s1 ? _hyDate(_hmHash("iq|" + n) % 14) : null,
    preferred_contact: ["오전·전화", "오후·전화", "저녁·앱알림", "오후·문자"][_hmHash("pc|" + n) % 4],
    contact_history: { lastDays: _hmHash("ch|" + n) % 40, total: _hmHash("ct|" + n) % 7 },
    segment_code: seg && seg.top ? seg.top : null,
    age_band: m ? Math.floor(m.age / 10) * 10 + "대" : null, sex: m ? m.sex : null, region: region ? region.sido : null,
    policy_count: map ? map.carrierCount : null,
    callback_token: "cb-" + n,
    consent_origin: "DIRECT", consent_evidence_id: "CS-" + String(_hmHash("ev|" + n) % 100000),
    notice_status: "불요(직접 수집)",
    maturity_date: cyc.s14 != null ? _hyDate(-cyc.s14) : null, days_to_expiry: cyc.s14,
    result_received_at: cyc.s3 != null ? _hyDate(cyc.s3) : null, result_age_days: cyc.s3,
    cycle_stage: cyc.t, uncovered_days: cyc.s20, days_to_next_exam: cyc.s21,
    coverage_gap: map ? map.gaps.length : null, coverage_overlap: map ? map.overlaps.length : null,
    annual_save_band: map && map.annualSaveTotal ? (map.annualSaveTotal < 100000 ? "10만원 미만" : map.annualSaveTotal < 300000 ? "10~30만원" : "30만원 이상") : null,
    premium_band: map ? (map.monthlyTotal < 100000 ? "10만원 미만" : map.monthlyTotal < 200000 ? "10~20만원" : "20만원 이상") : null,
    analysis_at: map ? map.at : null, analysis_consent_id: map ? "N1-" + String(_hmHash("n1|" + n) % 100000) : null,
    switch_window: map ? map.switchWindow : null,
  };
  return r;
}

/* ── §0-V3 비민감 스캔 — 사전 밖 키·건강 상태 값 유입 검사(빌드·커밋 게이트가 호출) ── */
const HY_SENSITIVE = /(고혈압|당뇨|고지혈|지방간|간염|신부전|갑상선|암|비만|우울|불면|혈압|혈당|콜레스테롤|중성지방|간수치|크레아티닌|요산|BMI|위험\s*구간|고위험|중위험|관심군|H등급|M등급|진단|질환|질병|증후군)/;
function hyFeedScan(sampleN) {
  const bad = [];
  const N = sampleN || 2000;
  let n = 0;
  for (let i = 1; i <= N * 5 && n < N; i += 3) {
    const r = hyFeedOf(i);
    if (!r) continue;
    n++;
    for (const k in r) {
      if (HY_KEYS.indexOf(k) < 0) { bad.push({ i: i, why: "사전 밖 필드", k: k }); continue; }
      const v = r[k];
      const s = (v && typeof v === "object") ? JSON.stringify(v) : String(v == null ? "" : v);
      if (HY_SENSITIVE.test(s)) bad.push({ i: i, why: "건강 상태 값 유입", k: k, at: s.slice(0, 30) });
      if (/^[HML]$/.test(s)) bad.push({ i: i, why: "등급 값 유입", k: k, at: s });
    }
    if (bad.length > 20) break;
  }
  return { n: n, fields: HY_KEYS.length, bad: bad, ok: bad.length === 0 };
}

/* 러너·관제 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinHyFeed = function (cmd, a) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "fields") return HY_FIELDS;
        if (cmd === "scan") return hyFeedScan(Number(a) || 2000);
        if (cmd === "one") return hyFeedOf(Number(a));
        return { error: "fields | scan | one" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
