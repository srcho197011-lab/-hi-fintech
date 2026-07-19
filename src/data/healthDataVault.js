/* ══════════════ 건강검진·보험 데이터 수집 코어 (FHIR 코드화 + 블록체인 무결성 + 동의/감사 + 목업 수집) ══════════════
   회원으로부터 직접 받는 검진결과·보험가입 데이터를 ①표준코드(HL7 FHIR·LOINC/KCD) 변환 ②암호화·식별분리 ③해시체인 기록.
   ⚠️ 데모: OCR·공단연계·통합조회는 목업 시뮬레이션, 해시는 sha256 유사 시뮬. 실데이터는 체인에 올리지 않음(해시만 기록). */

/* ── 국가검진 서식 + 종합검진 주요 항목 → LOINC 표준 코드 매핑 ── */
const CKUP_LOINC = {
  height: { loinc: "8302-2", ko: "신장(키)", unit: "cm", ref: [140, 195] },
  weight: { loinc: "29463-7", ko: "체중", unit: "kg", ref: [40, 95] },
  bmi: { loinc: "39156-5", ko: "체질량지수(BMI)", unit: "kg/m²", ref: [18.5, 24.9] },
  waist: { loinc: "8280-0", ko: "허리둘레", unit: "cm", ref: [0, 90] },
  sbp: { loinc: "8480-6", ko: "수축기혈압", unit: "mmHg", ref: [0, 120] },
  dbp: { loinc: "8462-4", ko: "이완기혈압", unit: "mmHg", ref: [0, 80] },
  glucose: { loinc: "1558-6", ko: "공복혈당", unit: "mg/dL", ref: [70, 99] },
  hba1c: { loinc: "4548-4", ko: "당화혈색소(HbA1c)", unit: "%", ref: [0, 5.6] },
  tchol: { loinc: "2093-3", ko: "총콜레스테롤", unit: "mg/dL", ref: [0, 199] },
  hdl: { loinc: "2085-9", ko: "HDL 콜레스테롤", unit: "mg/dL", ref: [60, 200] },
  ldl: { loinc: "2089-1", ko: "LDL 콜레스테롤", unit: "mg/dL", ref: [0, 129] },
  tg: { loinc: "2571-8", ko: "중성지방", unit: "mg/dL", ref: [0, 149] },
  ast: { loinc: "1920-8", ko: "AST(SGOT)", unit: "IU/L", ref: [0, 40] },
  alt: { loinc: "1742-6", ko: "ALT(SGPT)", unit: "IU/L", ref: [0, 40] },
  ggt: { loinc: "2324-2", ko: "γ-GTP", unit: "IU/L", ref: [0, 63] },
  cr: { loinc: "2160-0", ko: "혈청 크레아티닌", unit: "mg/dL", ref: [0.5, 1.2] },
  egfr: { loinc: "62238-1", ko: "신사구체여과율(eGFR)", unit: "mL/min/1.73㎡", ref: [60, 200] },
  hb: { loinc: "718-7", ko: "혈색소(Hb)", unit: "g/dL", ref: [12, 17] },
  uprot: { loinc: "2888-6", ko: "요단백", unit: "", ref: null, qual: true },     // 음성/약양성/양성
  cxr: { loinc: "39044-3", ko: "흉부X선 판정", unit: "", ref: null, qual: true }, // 정상/비활동성/이상소견
};
const CKUP_ORDER = ["height", "weight", "bmi", "waist", "sbp", "dbp", "glucose", "hba1c", "tchol", "hdl", "ldl", "tg", "ast", "alt", "ggt", "cr", "egfr", "hb", "uprot", "cxr"];
/* 공단(NHIS) 연계로 확보 가능한 제한 항목 집합 — 나머지는 결과지 업로드 필요 */
const NHIS_AVAILABLE = ["height", "weight", "bmi", "waist", "sbp", "dbp", "glucose", "tchol", "hdl", "ldl", "tg", "hb", "uprot"];
/* 값 이상 여부 판정(정상범위 밖 → high/low/abn) */
function ckupFlag(key, value) {
  const s = CKUP_LOINC[key]; if (!s) return "";
  if (s.qual) { const v = String(value); return /양성|이상|결절|의심|비활동|활동성/.test(v) && !/음성|정상|없음/.test(v) ? "abn" : ""; }
  const n = Number(value); if (isNaN(n) || !s.ref) return "";
  if (key === "hdl") return n < 40 ? "low" : "";
  if (n > s.ref[1]) return "high"; if (n < s.ref[0]) return "low"; return "";
}

/* ── 결정론 RNG(회원 시드) ── */
function _vHash(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function _vRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* sha256 유사 64-hex 해시(데모 시뮬 — 무결성 체감용) */
function vaultHash(str) { str = String(str); let out = ""; for (let s = 0; s < 4; s++) { let h = (2166136261 ^ Math.imul(s + 1, 2654435761)) >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } const g = Math.imul(h ^ (s * 40503), 2246822519) >>> 0; out += ("00000000" + h.toString(16)).slice(-8) + ("00000000" + g.toString(16)).slice(-8); } return out.slice(0, 64); }
/* 가명처리 ID(익명 토큰) — 식별정보와 건강값을 분리 연결하는 키 */
function anonToken(member) { const id = (member && (member.email || member.id || member.name)) || "anon"; return "pt-" + vaultHash("hifin-pseudonym|" + id).slice(0, 20); }

/* ── 회원 특성 기반 검진값 합성(목업 OCR/공단 조회의 원천) ── */
function synthCheckupValues(member) {
  const seed = _vHash((member && (member.email || member.name || "m")) + "|ckup");
  const rng = _vRng(seed);
  const age = member ? (member.regAge != null ? Math.round(member.regAge) : (member.age || 45)) : 45;
  const dz = (member && (member.highRiskDiseases || member.diseases)) || [];
  const sex = (member && member.sex) || "남";
  const has = (re) => dz.some((d) => re.test(d)) || (member && member.name === "조성래" && /당뇨|지방간/.test(re.source));
  const R = (a, b) => Math.round(a + rng() * (b - a));
  const R1 = (a, b) => Math.round((a + rng() * (b - a)) * 10) / 10;
  const dm = has(/당뇨/), htn = has(/고혈압/), lip = has(/지질|고지혈/), liver = has(/간|지방간/), kid = has(/신장|콩팥/);
  const h = R(sex === "남" ? 165 : 153, sex === "남" ? 182 : 168);
  const w = R(sex === "남" ? 62 : 50, sex === "남" ? 92 : 74) + (has(/비만|대사/) ? 8 : 0);
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  return {
    height: h, weight: w, bmi, waist: R(sex === "남" ? 78 : 70, sex === "남" ? 96 : 88) + (bmi > 25 ? 6 : 0),
    sbp: htn ? R(138, 162) : R(108, 128), dbp: htn ? R(88, 100) : R(66, 82),
    glucose: dm ? R(128, 178) : R(82, 100), hba1c: dm ? R1(6.6, 8.4) : R1(5.1, 5.7),
    tchol: lip ? R(220, 268) : R(160, 205), hdl: R(sex === "남" ? 38 : 45, 66) - (lip ? 8 : 0), ldl: lip ? R(150, 190) : R(90, 132), tg: lip ? R(180, 320) : R(70, 155),
    ast: liver ? R(45, 88) : R(18, 34), alt: liver ? R(48, 96) : R(15, 36), ggt: liver ? R(70, 180) : R(16, 55),
    cr: kid ? R1(1.3, 1.9) : R1(0.6, 1.1), egfr: kid ? R(38, 58) : R(74, 108), hb: R1(sex === "남" ? 13.5 : 12.0, sex === "남" ? 16.8 : 14.6),
    uprot: kid ? "약양성(±)" : "음성(-)", cxr: rng() < 0.12 ? "비활동성 결핵 흔적" : "정상",
  };
}

/* ── OCR 목업 파서: 업로드/촬영본 → 항목별 값·신뢰도(source:'ocr') ──
   scenario: 'nhis-pdf'(카톡 국가검진 PDF·고신뢰) | 'book-photo'(종합검진 책자 사진) | 'lowres'(저화질·일부 저신뢰) */
function ocrParse(member, scenario) {
  const vals = synthCheckupValues(member);
  const seed = _vHash((member && member.email || "m") + "|ocr|" + (scenario || ""));
  const rng = _vRng(seed);
  const isFull = scenario !== "nhis"; // OCR(업로드/촬영)은 전체 서식, 공단은 일부
  const keys = isFull ? CKUP_ORDER : NHIS_AVAILABLE;
  const lowres = scenario === "lowres";
  const items = keys.map((key) => {
    let conf = scenario === "nhis-pdf" ? 0.9 + rng() * 0.09 : lowres ? 0.5 + rng() * 0.4 : 0.78 + rng() * 0.18;
    conf = Math.round(conf * 100) / 100;
    return { key, loinc: CKUP_LOINC[key].loinc, ko: CKUP_LOINC[key].ko, unit: CKUP_LOINC[key].unit, value: vals[key], confidence: conf, source: scenario === "nhis" ? "nhis" : "ocr", low: conf < 0.75 };
  });
  const lowN = items.filter((x) => x.low).length;
  return { items, scenario, quality: lowres ? "저해상도" : "양호", warn: lowres ? `저해상도 — ${lowN}개 항목 신뢰도 낮음(노란색), 값 확인·수정 권장` : (lowN ? `${lowN}개 항목 확인 권장` : ""), completeness: isFull ? "full" : "partial" };
}
/* 공단(NHIS) 연계 조회 목업 — 일부 항목만(partial), 최근 N년 이력 요약 */
function nhisFetch(member) {
  const r = ocrParse(member, "nhis");
  const thisYear = 2026;
  return { items: r.items, completeness: "partial", source: "nhis", years: [thisYear - 1, thisYear - 3, thisYear - 5], missing: CKUP_ORDER.filter((k) => NHIS_AVAILABLE.indexOf(k) < 0).map((k) => CKUP_LOINC[k].ko), note: "공단 제공 항목(혈액검사 일부 등) 기준의 부분 데이터입니다. 결과지를 업로드하시면 전체 정밀 분석이 가능합니다." };
}

/* ── HL7 FHIR 변환(Observation / DiagnosticReport) — 표준 코드값 체계로 저장 ── */
function toFHIR(member, items, meta) {
  meta = meta || {}; const token = anonToken(member);
  const observations = items.filter((it) => CKUP_LOINC[it.key]).map((it, i) => {
    const spec = CKUP_LOINC[it.key]; const flag = ckupFlag(it.key, it.value);
    const o = { resourceType: "Observation", id: "obs-" + i, status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
      code: { coding: [{ system: "http://loinc.org", code: spec.loinc, display: spec.ko }], text: spec.ko },
      subject: { reference: "Patient/" + token }, effectiveDateTime: meta.date || "2025-11-01",
      _source: it.source || "upload", _confidence: it.confidence };
    if (spec.qual) o.valueString = String(it.value);
    else o.valueQuantity = { value: Number(it.value), unit: spec.unit, system: "http://unitsofmeasure.org" };
    if (flag) o.interpretation = [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: flag === "high" ? "H" : flag === "low" ? "L" : "A" }] }];
    return o;
  });
  const report = { resourceType: "DiagnosticReport", id: "dr-1", status: "final",
    code: { coding: [{ system: "http://loinc.org", code: "55399-0", display: "국가건강검진 결과" }] },
    subject: { reference: "Patient/" + token }, effectiveDateTime: meta.date || "2025-11-01",
    result: observations.map((o) => ({ reference: "Observation/" + o.id })) };
  return { report, observations, token };
}

/* ── 블록체인(프라이빗 해시체인) — 원본해시·FHIR해시·동의이력 기록, 위변조 검증 ── */
const VAULT_CHAIN_KEY = "hifin_hashchain";
function _chainLoad() { try { return JSON.parse(localStorage.getItem(VAULT_CHAIN_KEY) || "[]"); } catch (e) { return []; } }
function _chainSave(c) { try { localStorage.setItem(VAULT_CHAIN_KEY, JSON.stringify(c)); } catch (e) {} }
function chainAppend(payload) {
  const chain = _chainLoad();
  const prev = chain.length ? chain[chain.length - 1].hash : "0".repeat(64);
  const body = { idx: chain.length, prev, ts: payload.ts || Date.now(), type: payload.type || "record", token: payload.token || null, fileHash: payload.fileHash || null, fhirHash: payload.fhirHash || null, consent: payload.consent || null, actor: payload.actor || "member", note: payload.note || "" };
  body.hash = vaultHash(JSON.stringify(body));
  chain.push(body); _chainSave(chain); return body;
}
function chainVerify() {
  const chain = _chainLoad(); let prev = "0".repeat(64);
  for (const b of chain) { if (b.prev !== prev) return { ok: false, at: b.idx, reason: "이전 블록 해시 불일치" }; const rest = Object.assign({}, b); delete rest.hash; if (vaultHash(JSON.stringify(rest)) !== b.hash) return { ok: false, at: b.idx, reason: "블록 해시 위변조" }; prev = b.hash; }
  return { ok: true, blocks: chain.length };
}
function chainForToken(token) { return _chainLoad().filter((b) => b.token === token); }

/* ── 데이터 금고(Vault) 저장·조회 + 접근 감사로그 ── */
function _vaultKey(token) { return "hifin_vault_" + token; }
function vaultLoad(token) { try { return JSON.parse(localStorage.getItem(_vaultKey(token)) || "null"); } catch (e) { return null; } }
function vaultAccessLog(token, actor, action) { try { const k = "hifin_vaultlog_" + token; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ ts: Date.now(), actor: actor || "member", action: action || "view" }); localStorage.setItem(k, JSON.stringify(l.slice(-100))); } catch (e) {} }
function vaultAccessHistory(token) { try { return JSON.parse(localStorage.getItem("hifin_vaultlog_" + token) || "[]"); } catch (e) { return []; } }
/* 확정 검진데이터 저장 — FHIR 변환 + 필드암호화(시뮬) + 원본/변환본 해시 체인기록 */
function vaultSaveCheckup(member, items, meta) {
  const token = anonToken(member); meta = meta || {};
  const fhir = toFHIR(member, items, meta);
  const fileHash = vaultHash("rawfile|" + token + "|" + (meta.fileName || "checkup") + "|" + JSON.stringify(items.map((i) => i.value)));
  const fhirHash = vaultHash(JSON.stringify(fhir.report) + JSON.stringify(fhir.observations));
  const rec = { token, kind: "checkup", date: meta.date || "2025-11-01", source: meta.source || "upload", completeness: meta.completeness || "full", channel: meta.channel || "upload", fileName: meta.fileName || null, items, fhir, fileHash, fhirHash, savedAt: Date.now() };
  const cur = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
  cur.checkups = (cur.checkups || []).filter((c) => c.date !== rec.date).concat(rec);
  try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
  const block = chainAppend({ type: "checkup", token, fileHash, fhirHash, note: `검진결과 저장(${rec.channel}·${rec.completeness}) ${items.length}항목` });
  vaultAccessLog(token, "member", "검진데이터 저장");
  return { rec, block };
}
/* 확정 보험데이터 저장 */
function vaultSaveInsurance(member, contracts, meta) {
  const token = anonToken(member); meta = meta || {};
  const fileHash = vaultHash("insfile|" + token + "|" + JSON.stringify(contracts));
  const rec = { token, kind: "insurance", source: meta.source || "aggregate", channel: meta.channel || "aggregate", contracts, fileHash, savedAt: Date.now() };
  const cur = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
  cur.insurance = contracts;
  try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
  const block = chainAppend({ type: "insurance", token, fileHash, note: `보험가입내역 저장(${rec.channel}) ${contracts.length}건` });
  vaultAccessLog(token, "member", "보험데이터 저장");
  return { rec, block };
}
function vaultSaveConsents(member, consentState) {
  const token = anonToken(member);
  const cur = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
  const prev = (cur.consents && cur.consents.state) || {};
  cur.consents = { state: Object.assign({}, prev, consentState), ts: Date.now() };   // 단계별 동의 누적 병합
  try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
  const consentHash = vaultHash(JSON.stringify(consentState) + Date.now());
  const block = chainAppend({ type: "consent", token, consent: consentState, note: "동의 이력 기록" });
  return { block, consentHash };
}
/* 실시간 무결성 검증 — 저장된 FHIR 변환본을 재해싱해 저장 해시와 대조(위변조 감지) */
function verifyVaultIntegrity(member) {
  const token = anonToken(member); const v = vaultLoad(token);
  if (!v) return { ok: true, checked: 0, bad: 0 };
  let checked = 0, bad = 0;
  (v.checkups || []).forEach((c) => { if (c && c.fhir) { checked++; const h = vaultHash(JSON.stringify(c.fhir.report) + JSON.stringify(c.fhir.observations)); if (h !== c.fhirHash) bad++; } });
  return { ok: bad === 0, checked, bad };
}
/* 온보딩 완료 상태(가입 후 데이터 제공 진행률) */
function onboardStatus(member) {
  if (!member) return { step1: false, step2: false, done: false };
  const v = vaultLoad(anonToken(member));
  const step1 = !!(v && v.checkups && v.checkups.length);
  const step2 = !!(v && v.insurance && v.insurance.length);
  return { step1, step2, done: step1 && step2, partial: step1 && v.checkups.every((c) => c.completeness === "partial") };
}
/* 시연 기준 인물(조성래) 데이터 금고 자동 시드 — 투자자·참여사 데모용(멱등).
   Phase1 정합: 2개년 검진(계보) + 보험 통합조회 + 무상 검진대비보험 증서(1탭 동의 발급분) +
   AI 분석 기록 + 거래 앵커 + 다층 접근 이력(누가·언제·무엇을 — 전부 회원에게 공개) */
function seedSelfVault(member) {
  if (!member) return false;
  const token = anonToken(member); const v = vaultLoad(token);
  if (v && ((v.checkups || []).length || (v.insurance || []).length)) return false;   // 이미 데이터 있음
  try {
    // ① 동의 5종 — 목적별 개별 동의(마케팅은 미동의: 일괄동의 없음의 증거)
    vaultSaveConsents(member, { health: true, ai: true, mkt: false, step: "checkup" });
    // ② 검진 2개년 — 작년 촬영본(부분)→올해 업로드(전체): 데이터가 해마다 자산으로 쌓이는 계보
    const vals = synthCheckupValues(member);
    const items = CKUP_ORDER.map((k) => ({ key: k, value: vals[k], source: "upload", confidence: 0.93 }));
    const itemsPrev = CKUP_ORDER.slice(0, Math.max(6, CKUP_ORDER.length - 4)).map((k) => ({ key: k, value: vals[k], source: "photo", confidence: 0.88 }));
    vaultSaveCheckup(member, itemsPrev, { source: "photo", channel: "photo", completeness: "partial", fileName: "검진결과_촬영본_2023.jpg", date: "2023-12-26" });
    vaultSaveCheckup(member, items, { source: "upload", channel: "upload", completeness: "full", fileName: "국가검진결과_2024.pdf", date: "2024-12-26" });
    // ③ 보험 통합조회 + 무상 검진대비보험 증서(검진 예약 1탭 동의로 발급된 증서 — Phase1)
    vaultSaveConsents(member, { insurance: true, link: true, step: "insurance" });
    const contracts = (typeof insAggregateFetch === "function") ? insAggregateFetch(member).contracts : [];
    if (contracts.length) vaultSaveInsurance(member, contracts, { source: "aggregate", channel: "aggregate" });
    const certB = chainAppend({ type: "ins-cert", token, note: "무상 검진대비보험 증서 발급(강북삼성병원 종합검진)" });
    try { const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); if (!l.length) { l.push({ id: "CERT-JSR2026A", center: "강북삼성병원 종합검진센터", date: "7/28", time: "09:00", at: Date.now(), hash: certB && certB.hash }); localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); } } catch (e) {}
    // ④ 분석·활용 기록 — AI 정밀리포트 생성(분석 결과의 지문도 체인에)
    chainAppend({ type: "record", token, note: "AI 정밀리포트 생성 — 분석 결과 해시 기록(가명 토큰 기준)" });
    // ⑤ 거래 앵커 — 쇼핑 적립·HTK 크레딧 전환
    if (typeof txAnchor === "function") {
      txAnchor({ ttype: "tx", token, kind: "건강쇼핑 적립", amount: 1200, unit: "원", memo: "밀크씨슬 구매 리워드" });
      txAnchor({ ttype: "swap", token, kind: "HTK 스왑", amount: 300, memo: "HTK → 보험·치료비 크레딧" });
    }
    // ⑥ 접근 이력 — "내 데이터를 누가 봤는가"를 회원이 전부 보는 화면의 시연 데이터
    vaultAccessLog(token, "AI 분석엔진", "정밀리포트 생성 조회(가명 토큰만 사용)");
    vaultAccessLog(token, "하이(AI 매니저)", "건강 상담 참조 조회");
    vaultAccessLog(token, "보험 보장분석", "보장 공백 요약 열람(가명 요약만 제공)");
    vaultAccessLog(token, "member", "검진대비보험 증서 발급");
    vaultAccessLog(token, "member", "접근 이력 열람");
  } catch (e) { return false; }
  return true;
}

/* 둘러보기(GUEST) 금고 예시 — 저장 없이 메모리에서 즉석 생성(쓰기 시뮬레이션 원칙 유지).
   체험 프로필(나이·성별·질환) 기준으로 검진 2개년·보험·증서·블록·접근 이력을 합성 — 나가면 사라짐 */
function guestVaultDemo(member) {
  try {
    const token = anonToken(member);
    const now = Date.now(), H = 3600000;
    const vals = synthCheckupValues(member);
    const mk = (ks, src, conf) => ks.map((k) => ({ key: k, value: vals[k], source: src, confidence: conf }));
    const items = mk(CKUP_ORDER, "upload", 0.93);
    const itemsPrev = mk(CKUP_ORDER.slice(0, Math.max(6, CKUP_ORDER.length - 4)), "photo", 0.88);
    const rec = (its, date, channel, completeness, fileName) => {
      const fhir = toFHIR(member, its, { date });
      return { token, kind: "checkup", date, source: channel, completeness, channel, fileName, items: its, fhir, fileHash: vaultHash("g|" + token + "|" + fileName), fhirHash: vaultHash(JSON.stringify(fhir.report) + JSON.stringify(fhir.observations)), savedAt: now };
    };
    const c1 = rec(itemsPrev, "2023-12-26", "photo", "partial", "검진결과_촬영본_2023.jpg");
    const c2 = rec(items, "2024-12-26", "upload", "full", "국가검진결과_2024.pdf");
    let contracts = []; try { contracts = insAggregateFetch(member).contracts; } catch (e) {}
    const B = [];
    const push = (type, note) => { B.push({ idx: B.length, type, token, note, hash: vaultHash(type + "|" + token + "|" + B.length), ts: now }); };
    push("consent", "동의 이력 기록(건강·AI — 마케팅 미동의)");
    push("checkup", "검진결과 저장(photo·partial) " + itemsPrev.length + "항목");
    push("checkup", "검진결과 저장(upload·full) " + items.length + "항목");
    push("consent", "동의 이력 기록(보험·연계)");
    if (contracts.length) push("insurance", "보험가입내역 저장(aggregate) " + contracts.length + "건");
    push("ins-cert", "무상 검진대비보험 증서 발급(검진 예약 1탭 동의)");
    push("record", "AI 정밀리포트 생성 — 분석 결과 해시 기록(가명 토큰 기준)");
    push("tx", "건강쇼핑 적립 1,200원 — 밀크씨슬 구매 리워드");
    const certs = [{ id: "CERT-GUEST01", center: "내 주변 제휴 검진센터", date: "7/28", time: "09:00", at: now, hash: (B.find((b) => b.type === "ins-cert") || {}).hash }];
    const access = [
      { ts: now - 20 * H, actor: "member", action: "검진데이터 저장(2개년)" },
      { ts: now - 18 * H, actor: "AI 분석엔진", action: "정밀리포트 생성 조회(가명 토큰만 사용)" },
      { ts: now - 9 * H, actor: "하이(AI 매니저)", action: "건강 상담 참조 조회" },
      { ts: now - 5 * H, actor: "보험 보장분석", action: "보장 공백 요약 열람(가명 요약만 제공)" },
      { ts: now - 2 * H, actor: "member", action: "검진대비보험 증서 발급" },
      { ts: now, actor: "member", action: "접근 이력 열람" },
    ];
    return { v: { token, checkups: [c1, c2], insurance: contracts, consents: { state: { health: true, ai: true, mkt: false, insurance: true, link: true }, ts: now } }, blocks: B, access, certs };
  } catch (e) { return null; }
}

/* 데이터 삭제·철회(파기) — 금고·체인기록(철회 사실은 체인에 남김) */
function vaultPurge(member) {
  const token = anonToken(member);
  try { localStorage.removeItem(_vaultKey(token)); localStorage.removeItem("hifin_vaultlog_" + token); } catch (e) {}
  chainAppend({ type: "erase", token, note: "회원 요청 — 데이터 파기(개인정보 삭제)" });
  vaultAccessLog(token, "member", "데이터 파기");
}

/* ── 보험 통합조회(신용정보원 '내보험다보여') 목업 → 계약 리스트 ── */
function insAggregateFetch(member) {
  const ins = (typeof memberInsurance === "function") ? memberInsurance(member) : null;
  const contracts = [];
  if (ins && ins.silson && ins.silson.enrolled) contracts.push({ insurer: ["현대해상", "삼성화재", "DB손해보험", "메리츠화재"][_vHash((member && member.email || "") + "s") % 4], product: "실손의료보험(" + ins.silson.gen + ")", kind: "실손", gen: ins.silson.gen, join: ins.silson.enrollYear ? ins.silson.enrollYear + "-03-15" : "2015-03-15", coGen: ins.silson.coGen, coNon: ins.silson.coNon, detailLack: ins.silson.gen === "3세대" || ins.silson.gen === "4세대" });
  (ins ? ins.riders : []).forEach((r, i) => contracts.push({ insurer: ["KB손해보험", "삼성생명", "한화생명", "교보생명"][i % 4], product: r.cat + " 진단비 특약", kind: "중대질환", cat: r.cat, benefit: r.benefit, join: "2018-07-0" + ((i % 8) + 1), detailLack: false }));
  return { contracts, source: "aggregate", note: "신용정보원 통합조회 결과(목업). 전 보험사 가입내역을 일괄 수신했습니다." };
}
/* 보험증권 OCR 목업 — 통합조회 대체/보완용 */
function insOcrParse(member) {
  const r = insAggregateFetch(member);
  return { contracts: r.contracts.map((c) => Object.assign({}, c, { _ocr: true, confidence: 0.82 + (_vRng(_vHash(c.product))() * 0.15) })), source: "ocr", note: "증권 OCR 추출 결과(목업) — 값 확인·확정이 필요합니다." };
}

/* ── 법률적 동의 5종(단계별 개별 동의) — 요약본 + 전문(초안, 법무 검토 필요) ── */
const VAULT_CONSENTS = [
  { key: "health", req: true, title: "민감정보(건강정보) 수집·이용 동의", law: "개인정보보호법 제23조", items: "건강검진 수치·판정·질환 정보", purpose: "AI 건강분석·맞춤 건강관리 서비스 제공", keep: "회원 탈퇴 시 또는 목적 달성 후 지체없이 파기(관계법령상 보존기간 예외)", deny: "미동의 시 건강분석·맞춤 서비스 제공이 제한됩니다." },
  { key: "insurance", req: true, title: "보험정보 수집·이용 동의", law: "개인정보보호법", items: "보험 가입내역·보장·담보 정보", purpose: "보장 분석·보험 솔루션 제공", keep: "회원 탈퇴 시 또는 목적 달성 후 파기", deny: "미동의 시 보험 보장 분석이 제한됩니다." },
  { key: "link", req: false, title: "제3자 정보제공·전송요구 동의(공단/통합조회)", law: "개인정보보호법·신용정보법", items: "국민건강보험공단 검진이력 / 신용정보원 보험가입내역", purpose: "본인 데이터 전송요구를 통한 조회·수신", keep: "수신 후 즉시 표준화 저장, 원문은 암호화 보관", deny: "해당 채널(공단/통합조회) 이용 시에만 필요합니다.", channelOnly: true },
  { key: "ai", req: true, title: "AI 분석 활용 동의", law: "개인정보보호법", items: "가명처리된 건강·보험 데이터", purpose: "AI 위험분석·의료비 예측·맞춤 상담", keep: "가명정보로 분석, 재식별 금지", deny: "미동의 시 AI 분석·상담 제공이 제한됩니다." },
  { key: "mkt", req: false, title: "마케팅 활용 동의(선택)", law: "정보통신망법", items: "연락처·관심분야", purpose: "상품·이벤트 안내", keep: "동의 철회 시까지", deny: "미동의해도 서비스 이용에 제한이 없습니다." },
];
const VAULT_LEGAL_NOTICE = "※ 본 동의문은 초안이며, 시행 전 법무 검토가 필요합니다. 14세 미만(어린이 검진·어린이실손)은 법정대리인 동의 절차가 별도 적용됩니다.";
