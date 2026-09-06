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
/* ── C3: 실제 SHA-256(동기 순수 JS 구현 — FIPS 180-4) — 구 FNV 시뮬을 대체, API 불변(무중단) ── */
const _SHA_K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
function sha256Hex(str) {
  const msg = unescape(encodeURIComponent(String(str)));
  const len = msg.length, bitLen = len * 8;
  const withOne = len + 1, total = (((withOne + 8 + 63) >> 6) << 6);
  const w = new Uint8Array(total);
  for (let i = 0; i < len; i++) w[i] = msg.charCodeAt(i);
  w[len] = 0x80;
  w[total - 4] = (bitLen >>> 24) & 255; w[total - 3] = (bitLen >>> 16) & 255; w[total - 2] = (bitLen >>> 8) & 255; w[total - 1] = bitLen & 255;
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const W = new Int32Array(64);
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let t = 0; t < 16; t++) W[t] = (w[off + t * 4] << 24) | (w[off + t * 4 + 1] << 16) | (w[off + t * 4 + 2] << 8) | w[off + t * 4 + 3];
    for (let t = 16; t < 64; t++) { const s0 = rr(W[t - 15], 7) ^ rr(W[t - 15], 18) ^ (W[t - 15] >>> 3); const s1 = rr(W[t - 2], 17) ^ rr(W[t - 2], 19) ^ (W[t - 2] >>> 10); W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0; }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + _SHA_K[t] + W[t]) | 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => ("00000000" + ((x >>> 0).toString(16))).slice(-8)).join("");
}
/* 구 FNV 시뮬(레거시 검증·이관 증빙용으로 보존) */
function vaultHashLegacy(str) { str = String(str); let out = ""; for (let s = 0; s < 4; s++) { let h = (2166136261 ^ Math.imul(s + 1, 2654435761)) >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } const g = Math.imul(h ^ (s * 40503), 2246822519) >>> 0; out += ("00000000" + h.toString(16)).slice(-8) + ("00000000" + g.toString(16)).slice(-8); } return out.slice(0, 64); }
function vaultHash(str) { return sha256Hex(str); }   // C3: 전 호출부가 실제 SHA-256 사용(표기 정직성 완성)
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
/* C3 이관 — 구(FNV) 체인을 SHA-256으로 1회 재봉인: 백업(hifin_hashchain_legacy) 보존 + 이관 블록에 구 최종해시 봉인(연속성 증빙·롤백 경로) */
function _chainMigrateV2() {
  try {
    if (localStorage.getItem("hifin_hash_v2")) return;
    const chain = _chainLoad();
    if (chain.length) {
      localStorage.setItem("hifin_hashchain_legacy", JSON.stringify(chain));
      const legacyFinal = chain[chain.length - 1].hash;
      let prev = "0".repeat(64);
      const re = chain.map((b) => { const nb = Object.assign({}, b); delete nb.hash; nb.prev = prev; nb.hash = vaultHash(JSON.stringify(nb)); prev = nb.hash; return nb; });
      const mig = { idx: re.length, prev, ts: Date.now(), type: "migration", token: null, fileHash: null, fhirHash: legacyFinal, consent: null, actor: "system", note: "해시 이관(FNV 시뮬→SHA-256) — 구 체인 최종해시 봉인·백업 보존" };
      mig.hash = vaultHash(JSON.stringify(mig));
      re.push(mig); _chainSave(re);
    }
    localStorage.setItem("hifin_hash_v2", "1");
  } catch (e) {}
}
/* 머클루트 스냅샷(주기 앵커 준비) — 전 블록 해시의 머클루트를 보관 */
function chainSnapshot() {
  _chainMigrateV2();
  const chain = _chainLoad();
  const root = (typeof merkleRoot === "function") ? merkleRoot(chain.map((b) => b.hash)) : null;
  const snap = { ts: Date.now(), blocks: chain.length, root };
  try { const l = JSON.parse(localStorage.getItem("hifin_chain_snapshots") || "[]"); l.push(snap); localStorage.setItem("hifin_chain_snapshots", JSON.stringify(l.slice(-20))); } catch (e) {}
  return snap;
}
function chainAppend(payload) {
  _chainMigrateV2();
  const chain = _chainLoad();
  const prev = chain.length ? chain[chain.length - 1].hash : "0".repeat(64);
  const body = { idx: chain.length, prev, ts: payload.ts || Date.now(), type: payload.type || "record", token: payload.token || null, fileHash: payload.fileHash || null, fhirHash: payload.fhirHash || null, consent: payload.consent || null, actor: payload.actor || "member", note: payload.note || "" };
  body.hash = vaultHash(JSON.stringify(body));
  chain.push(body); _chainSave(chain); return body;
}
function chainVerify() {
  _chainMigrateV2();
  const chain = _chainLoad(); let prev = "0".repeat(64);
  for (const b of chain) { if (b.prev !== prev) return { ok: false, at: b.idx, reason: "이전 블록 해시 불일치" }; const rest = Object.assign({}, b); delete rest.hash; if (vaultHash(JSON.stringify(rest)) !== b.hash) return { ok: false, at: b.idx, reason: "블록 해시 위변조" }; prev = b.hash; }
  return { ok: true, blocks: chain.length };
}
function chainForToken(token) { return _chainLoad().filter((b) => b.token === token); }

/* ── 데이터 금고(Vault) 저장·조회 + 접근 감사로그 ── */
function _vaultKey(token) { return "hifin_vault_" + token; }
/* C3: 금고 저장 해시(fhirHash/fileHash)도 SHA-256으로 1회 재계산(verifyVaultIntegrity 정합 유지) */
function _vaultMigrateV2(token, v) {
  try {
    if (!v || localStorage.getItem("hifin_vault_v2_" + token)) return v;
    (v.checkups || []).forEach((c) => { if (c && c.fhir) { c.fhirHash = vaultHash(JSON.stringify(c.fhir.report) + JSON.stringify(c.fhir.observations)); if (c.items) c.fileHash = vaultHash("rawfile|" + token + "|" + (c.fileName || "checkup") + "|" + JSON.stringify(c.items.map((i) => i.value))); } });
    localStorage.setItem(_vaultKey(token), JSON.stringify(v));
    localStorage.setItem("hifin_vault_v2_" + token, "1");
  } catch (e) {}
  return v;
}
function vaultLoad(token) { try { return _vaultMigrateV2(token, JSON.parse(localStorage.getItem(_vaultKey(token)) || "null")); } catch (e) { return null; } }
function vaultAccessLog(token, actor, action) { try { const k = "hifin_vaultlog_" + token; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ ts: Date.now(), actor: actor || "member", action: action || "view" }); localStorage.setItem(k, JSON.stringify(l.slice(-100))); } catch (e) {} }
function vaultAccessHistory(token) { try { return JSON.parse(localStorage.getItem("hifin_vaultlog_" + token) || "[]"); } catch (e) { return []; } }
/* 확정 검진데이터 저장 — FHIR 변환 + 필드암호화(시뮬) + 원본/변환본 해시 체인기록 */
function vaultSaveCheckup(member, items, meta) {
  const token = anonToken(member); meta = meta || {};
  const fhir = toFHIR(member, items, meta);
  const fileHash = vaultHash("rawfile|" + token + "|" + (meta.fileName || "checkup") + "|" + JSON.stringify(items.map((i) => i.value)));
  const fhirHash = vaultHash(JSON.stringify(fhir.report) + JSON.stringify(fhir.observations));
  /* ⚠️ source는 기본값을 주지 않는다(H-1 수선) — 누락 시 「실제 업로드」로 둔갑하던 fail-open이었다.
     시연 시드가 source를 빠뜨리면 실데이터로 기록되므로, 없으면 저장을 거부한다(fail-closed). */
  if (!meta || !meta.source) return { ok: false, reason: "source가 없어 저장하지 않았어요 — 데이터 출처는 생략할 수 없어요." };
  const rec = { token, kind: "checkup", date: meta.date || "2025-11-01", source: meta.source, completeness: meta.completeness || "full", channel: meta.channel || "upload", fileName: meta.fileName || null, items, fhir, fileHash, fhirHash, savedAt: Date.now() };
  const cur = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
  cur.checkups = (cur.checkups || []).filter((c) => c.date !== rec.date).concat(rec);
  try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
  const block = chainAppend({ type: "checkup", token, fileHash, fhirHash, note: `검진결과 저장(${rec.channel}·${rec.completeness}) ${items.length}항목` });
  vaultAccessLog(token, "member", "검진데이터 저장");
  return { ok: true, rec, block };
}
/* 확정 보험데이터 저장 */
function vaultSaveInsurance(member, contracts, meta) {
  const token = anonToken(member); meta = meta || {};
  const fileHash = vaultHash("insfile|" + token + "|" + JSON.stringify(contracts));
  if (!meta || !meta.source) return { ok: false, reason: "source가 없어 저장하지 않았어요 — 데이터 출처는 생략할 수 없어요." };
  const rec = { token, kind: "insurance", source: meta.source, channel: meta.channel || "aggregate", contracts, fileHash, savedAt: Date.now() };
  const cur = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
  cur.insurance = contracts;
  try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
  const block = chainAppend({ type: "insurance", token, fileHash, note: `보험가입내역 저장(${rec.channel}) ${contracts.length}건` });
  vaultAccessLog(token, "member", "보험데이터 저장");
  return { ok: true, rec, block };
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
/* ── 시연 기준 인물 검진 연차 시드(2단계 분기응답 기준) ──
   실측 리포트 기준일(2024.12.26)이 최신 검진이고, 그 전해 촬영본이 함께 있는 2개년 계보 —
   올해(2026) 미수검이라 하이는 "2024년 결과 vs 2026년 예약" 두 갈래를 제시하고, 2023~2024 추이도 보여줄 수 있다.
   ⚠️ 단년만 필요하면 years를 [2024]로 두면 된다(그 외 코드 변경 불필요 — 금고·증서가 자동 이관된다). */
const SELF_CHECKUP_SEED = { years: [2023, 2024], monthDay: "-12-26" };
const SELF_SEED_FILE = /^(국가검진결과|검진결과_촬영본)_(\d{4})\.(pdf|jpg)$/;

/* 시드로 저장된 금고를 현재 SELF_CHECKUP_SEED 기준으로 1회 이관 — 회원이 직접 올린 자료가 섞여 있으면 건드리지 않는다 */
function _migrateSelfCheckupSeed(member, token, v) {
  try {
    const cks = v.checkups || [];
    if (!cks.length) return false;
    if (!cks.every((c) => SELF_SEED_FILE.test(c.fileName || ""))) return false;   // 회원 업로드분 포함 → 이관 대상 아님
    const have = cks.map((c) => Number((String(c.fileName).match(SELF_SEED_FILE) || [])[2])).sort();
    const want = SELF_CHECKUP_SEED.years.slice().sort();
    if (have.length === want.length && have.every((y, i) => y === want[i])) return false;   // 이미 일치
    const cur = vaultLoad(token); cur.checkups = [];
    try { localStorage.setItem(_vaultKey(token), JSON.stringify(cur)); } catch (e) {}
    _seedSelfCheckups(member);
    _migrateSelfCert();
    return true;
  } catch (e) { return false; }
}
/* 검진대비보험 증서(시드분)도 최신 검진 연도에 맞춘다 — 증서 연도와 검진 연도가 어긋나 보이지 않게 */
function _migrateSelfCert() {
  try {
    const y = SELF_CHECKUP_SEED.years[SELF_CHECKUP_SEED.years.length - 1];
    const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]");
    let hit = false;
    l.forEach((c) => { if (c && /^CERT-JSR\d{4}A$/.test(c.id || "")) { c.id = `CERT-JSR${y}A`; c.date = String(y) + SELF_CHECKUP_SEED.monthDay; hit = true; } });
    if (hit) localStorage.setItem("hifin_ins_certs", JSON.stringify(l));
  } catch (e) {}
}
function _seedSelfCheckups(member) {
  const vals = synthCheckupValues(member);
  const items = CKUP_ORDER.map((k) => ({ key: k, value: vals[k], source: "upload", confidence: 0.93 }));
  SELF_CHECKUP_SEED.years.forEach((y, i) => {
    const last = i === SELF_CHECKUP_SEED.years.length - 1;
    const use = last ? items : CKUP_ORDER.slice(0, Math.max(6, CKUP_ORDER.length - 4)).map((k) => ({ key: k, value: vals[k], source: "photo", confidence: 0.88 }));
    vaultSaveCheckup(member, use, {
      source: last ? "upload" : "photo", channel: last ? "upload" : "photo",
      completeness: last ? "full" : "partial",
      fileName: last ? `국가검진결과_${y}.pdf` : `검진결과_촬영본_${y}.jpg`,
      date: String(y) + SELF_CHECKUP_SEED.monthDay,
    });
  });
}

function seedSelfVault(member) {
  if (!member) return false;
  const token = anonToken(member); const v = vaultLoad(token);
  if (v && ((v.checkups || []).length || (v.insurance || []).length)) { _migrateSelfCheckupSeed(member, token, v); return false; }   // 이미 데이터 있음
  try {
    // ① 동의 5종 — 목적별 개별 동의(상담·안내는 미동의: 일괄동의 없음의 증거)
    vaultSaveConsents(member, { health: true, ai: true, mkt: false, step: "checkup" });
    // ② 검진 연차 시드 — SELF_CHECKUP_SEED 기준(기본: 2025년 1건 · 2026년 미수검 = 분기응답 대상)
    _seedSelfCheckups(member);
    // ③ 보험 통합조회 + 무상 검진대비보험 증서(검진 예약 1탭 동의로 발급된 증서 — Phase1)
    vaultSaveConsents(member, { insurance: true, link: true, step: "insurance" });
    const contracts = (typeof insAggregateFetch === "function") ? insAggregateFetch(member).contracts : [];
    if (contracts.length) vaultSaveInsurance(member, contracts, { source: "aggregate", channel: "aggregate" });
    const certB = chainAppend({ type: "ins-cert", token, note: "무상 검진대비보험 증서 발급(강북삼성병원 종합검진)" });
    try { const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); if (!l.length) { l.push({ id: `CERT-JSR${SELF_CHECKUP_SEED.years[SELF_CHECKUP_SEED.years.length - 1]}A`, center: "강북삼성병원 종합검진센터", date: String(SELF_CHECKUP_SEED.years[SELF_CHECKUP_SEED.years.length - 1]) + SELF_CHECKUP_SEED.monthDay, time: "09:00", at: Date.now(), hash: certB && certB.hash });localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); } } catch (e) {}
    // ④ 분석·활용 기록 — AI 정밀리포트 생성(분석 결과의 지문도 체인에)
    chainAppend({ type: "record", token, note: "AI 정밀리포트 생성 — 분석 결과 해시 기록(가명 토큰 기준)" });
    // ⑤ 거래 앵커 — 쇼핑 적립·HTK 크레딧 전환
    if (typeof txAnchor === "function") {
      txAnchor({ ttype: "tx", token, kind: "건강쇼핑 적립", amount: 1200, unit: "원", memo: "밀크씨슬 구매 리워드" });
      txAnchor({ ttype: "swap", token, kind: "HTK 스왑", amount: 300, memo: "HTK → 치료비 케어 크레딧" });
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

/* ══ 과업C — 조성래(hifin) 보험 실현황 1회성 보강 시드(기존 데이터 보존·멱등) ══
   보험 섹션 진입 시 호출: 검진(seedSelfVault)·실손·일반 보험 2건·검진대비보험 발급 이력을 금고·원장에 정식 저장 — 화면은 그 저장본만 읽는다. */
/* 조성래 실계약(2026-07-26 형 제공 — 신용정보원 조회 실데이터 기준) — 월 보험료·가입일·만기 실값 */
const SELF_REAL_CONTRACTS = [
  { insurer: "현대해상", product: "무배당 하이라이프 新행복을다모은보험(Hi1112 · 실손 포함 종합)", kind: "실손", gen: "2세대", join: "2012-03-29", end: "2079-03-29", coGen: "10%", coNon: "20%", monthly: 154000, years: 14 },
  { insurer: "현대해상", product: "무배당 행복가득 생활보장보험(Hi2006 · 가족 실손 포함 종합)", kind: "가족실손종합", gen: "3세대", join: "2020-06-30", end: "2040-06-30", monthly: 150000, years: 6 },
  { insurer: "현대해상", product: "무배당 내삶엔(3N) 맞춤간편건강보험(세만기형)", kind: "건강", join: "2025-07-28", end: "2070-07-28", monthly: 121000, years: 1 },
  { insurer: "현대해상", product: "무배당 하이라이프 퍼펙트스타 종합보험(Hi1112)", kind: "건강종합", join: "2012-03-27", end: "2102-03-27", monthly: 98500, years: 14 },
  { insurer: "현대해상", product: "무배당 하이라이프 퍼펙트스타 종합보험(Hi1112) — 2건차", kind: "건강종합", join: "2012-03-27", end: "2105-03-27", monthly: 97000, years: 14 },
  { insurer: "현대해상", product: "무배당 뉴하이카 운전자상해보험(Hi2504)", kind: "운전자·상해", join: "2025-07-29", end: "2045-07-29", monthly: 183000, years: 1 },
  { insurer: "현대해상", product: "Hicar 자동차보험 개인용(CM)", kind: "자동차", join: "2026-05-26", end: "2027-05-26", monthly: 480000, years: 0 },
  { insurer: "KB손해보험", product: "플러스사랑 단체상해보험(II) — 피보험자", kind: "단체상해", join: "2024-08-01", end: "2027-07-31", monthly: 10000, years: 2 },
  { insurer: "DB손해보험", product: "나에게 맞춘 초경증 간편건강보험2407", kind: "간편건강", join: "2024-11-15", end: "2044-11-15", monthly: 35000, years: 2 },
];
function selfEnsureInsSeed(member) {
  try {
    if (!member) return false;
    /* 검진 연차 시드가 바뀌었으면 먼저 이관 — 아래 v3·v4 조기 반환에 막혀 이관이 누락되지 않게 */
    try { const tk0 = anonToken(member); const v0 = vaultLoad(tk0); if (v0) _migrateSelfCheckupSeed(member, tk0, v0); } catch (e) {}
    // v4(2026-07-26): 목업 계약을 형 실계약 9건으로 교체(검진·체인·원장은 보존)
    if (!localStorage.getItem("hifin_self_ins_v4")) {
      seedSelfVault(member);
      vaultSaveInsurance(member, SELF_REAL_CONTRACTS, { source: "self-real", channel: "aggregate" });
      if (typeof pbPolicyCreate === "function") pbPolicyCreate(member, { product: "건강검진 대비보험(무상)", monthly: 0, cover: "진단지원 최대 100만", term: "3개월(검진 연동)" });
      if (typeof tlSync === "function") tlSync(member);
      localStorage.setItem("hifin_self_ins_v4", "1");
      localStorage.setItem("hifin_self_ins_v3", "1");
      return true;
    }
    if (localStorage.getItem("hifin_self_ins_v3")) return false;
    seedSelfVault(member);   // 검진 2개년·통합조회·증서(멱등 — 기존 있으면 skip)
    const token = anonToken(member);
    const v = vaultLoad(token) || { token, checkups: [], insurance: [], consents: null };
    const has = (re) => (v.insurance || []).some((c) => re.test((c.kind || "") + (c.product || "")));
    const add = [];
    if (!has(/실손/)) add.push({ insurer: "현대해상", product: "실손의료보험", kind: "실손", gen: "2세대", join: "2013", coGen: "10%", coNon: "20%", monthly: 41200 });
    if (!has(/암/)) add.push({ insurer: "현대해상", product: "암보험(진단비)", kind: "암", benefit: 30000000, monthly: 28400, years: 9, detail: { diag: 30000000, surgery: 6000000, daily: 50000 } });
    if (!has(/운전자/)) add.push({ insurer: "DB손해보험", product: "운전자보험", kind: "일반", benefit: 10000000, monthly: 9800, years: 5, detail: { diag: 10000000, surgery: 2000000, daily: 30000 } });
    if (add.length) vaultSaveInsurance(member, (v.insurance || []).concat(add), { source: "self-seed", channel: "aggregate" });
    // 검진대비보험 발급 이력(무상 계약) — pbPolicyCreate 멱등
    if (typeof pbPolicyCreate === "function") pbPolicyCreate(member, { product: "건강검진 대비보험(무상)", monthly: 0, cover: "진단지원 최대 100만", term: "3개월(검진 연동)" });
    if (typeof tlSync === "function") tlSync(member);   // 원장 제네시스 보장(12,480 이월)
    localStorage.setItem("hifin_self_ins_v3", "1");
    return true;
  } catch (e) { return false; }
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
    push("consent", "동의 이력 기록(건강·AI — 상담·안내 미동의)");
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

/* ══════════ Phase 5 프로토콜 UX — 세대 계보(D1)·데이터 배당(D2)·요율 재산정(D3) ══════════ */
/* 데이터 활용 배당 — 가명화 데이터가 연구에 활용되면 약속된 분배율로 지급(시연: 검진 보유 시 1건) */
function dataDividends(m) {
  try {
    const v = vaultLoad(anonToken(m)); if (!v || !(v.checkups || []).length) return [];
    return [{ id: "DIV-2607", study: "췌장질환 조기발견 연구(가명결합 · 기관 IRB 승인)", org: "K-대학병원 연구소", gens: [1, 2], htk: 1200, date: "2026-07-15" }];
  } catch (e) { return []; }
}
/* 보험요율 재산정(Dynamic Re-rating) — 인하 및 가입확대형 전용 옵트인. 보험사는 원본이 아닌 요약 증명만 열람 */
function rerateState() { try { return JSON.parse(localStorage.getItem("hifin_rerate") || "null") || { status: "none" }; } catch (e) { return { status: "none" }; } }
function rerateEligible(m) { try { const v = vaultLoad(anonToken(m)); return !!(v && (v.checkups || []).length >= 2); } catch (e) { return false; } }
function rerateApply(m) {
  try {
    const before = 12400, after = 11100;
    const s = { status: "done", before, after, saving: before - after, rate: Math.round((before - after) / before * 1000) / 10, at: Date.now() };
    localStorage.setItem("hifin_rerate", JSON.stringify(s));
    const tk = anonToken(m);
    chainAppend({ type: "record", token: tk, note: "보험요율 재산정 — 4세대 성과 증명(혈당·중성지방 개선) 제출 · 인하 적용" });
    // 과업2ⓑ: 성과 확정 = 4세대 실자산 레코드 append(프록시 공식 아님)
    try { const k = "hifin_g4_" + tk; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ kind: "rerate", saving: s.saving, at: s.at }); localStorage.setItem(k, JSON.stringify(l)); } catch (e2) {}
    vaultAccessLog(tk, "보험사(요약 증명만)", "성과 SBT 요약 열람 — 요율 재산정 심사(원본 미제공)");
    return s;
  } catch (e) { return null; }
}
/* 세대형 자산 계보 — 1세대(원본)→2세대(분석)→3세대(활용)→4세대(성과) 자산 수 집계 */
function assetLineage(m) {
  try {
    const tk = anonToken(m); const v = vaultLoad(tk) || {}; const blocks = (typeof chainForToken === "function") ? chainForToken(tk) : [];
    const g1 = (v.checkups || []).length;
    // 과업2ⓑ: g2·g4는 실자산 레코드(생성 이벤트 append) 우선 — 레코드가 없는 기존 회원은 종전 프록시 폴백(무중단)
    let g2rec = [], g4rec = [];
    try { g2rec = JSON.parse(localStorage.getItem("hifin_g2_" + tk) || "[]"); } catch (e) {}
    try { g4rec = JSON.parse(localStorage.getItem("hifin_g4_" + tk) || "[]"); } catch (e) {}
    const g2 = g2rec.length || g1;   // 실레코드 없으면 검진 1건당 리포트 1건 프록시
    let certs = 0, claims = 0;
    try { certs = (JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]")).length; } catch (e) {}
    try { claims = (JSON.parse(localStorage.getItem("hifin_claims") || "[]")).length; } catch (e) {}
    const g3 = certs + claims + blocks.filter((b) => b.type === "tx" || b.type === "swap").length;
    const rr = rerateState();
    const g4 = g4rec.length || ((g1 >= 2 ? 1 : 0) + (rr.status === "done" ? 1 : 0));
    return { g1, g2, g3, g4, total: g1 + g2 + g3 + g4 };
  } catch (e) { return { g1: 0, g2: 0, g3: 0, g4: 0, total: 0 }; }
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
  { key: "mkt", req: false, title: "보험계약 상담·안내 동의(선택)", law: "정보통신망법", items: "연락처·관심분야", purpose: "가입한 보험계약 상담, 보험금 지급·심사 관련 안내, 건강등급 산정 결과 안내, 새 계약 시 기존 계약과의 중요사항 비교설명, 서비스 만족도 조사, 건강·보험 상품 안내", keep: "동의 철회 시까지", deny: "미동의해도 서비스 이용에 제한이 없습니다." },
];
const VAULT_LEGAL_NOTICE = "※ 본 동의문은 초안이며, 시행 전 법무 검토가 필요합니다. 14세 미만(어린이 검진·어린이실손)은 법정대리인 동의 절차가 별도 적용됩니다.";

/* [H-2 W1] 이관 함수는 두지 않는다 —
   금고에 쓰는 경로를 전수 확인한 결과 전부 demoCurrentUser() || selfMember()를 지나고,
   authCurrent()로 직접 쓰는 곳은 없다. 즉 이름 토큰에는 애초에 아무것도 쓰인 적이 없다
   (실측: 본인 계정의 저장 키 9개가 전부 email 기준). 옮길 것이 없는데 쓰기 권한을 가진
   코드를 두면 위험만 남으므로 넣지 않는다. 재발은 run_identity_check.mjs가 막는다. */

/* 회귀용 훅 — 금고 저장의 fail-closed 경계를 하네스가 직접 두드린다(H-1) */
try { if (typeof window !== "undefined") { window.__hifinVault = { saveCheckup: vaultSaveCheckup, saveInsurance: vaultSaveInsurance, load: vaultLoad, token: anonToken,
      /* 지금 로그인한 회원이 실제로 쓰는 토큰 — 「키가 존재하는가」가 아니라 「누가 어느 금고를 읽는가」를 검사하려면 이게 필요하다 */
      myToken: () => { try { const m = (typeof demoCurrentUser === "function" && demoCurrentUser()) || (typeof selfMember === "function" ? selfMember() : null); return m ? { token: anonToken(m), who: m.name || "", email: m.email || "", id: m.id || "" } : null; } catch (e) { return { err: String(e) }; } } }; } } catch (e) {}
