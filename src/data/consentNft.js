/* ══════════════ D2 — ConsentNFT · LeadDBFactory · RevenueShareLedger (전부 RegGate 뒤) ══════════════
   허락 기반 AI(정체성 ④)의 완성형: 동의를 [범위·기간·대상·목적·철회]가 담긴 조건부 증서로 발행·체인 기록.
   - 철회는 즉시 효력: revoked 이후 모든 소비 경로(cnAllowed)가 차단되고 철회 이력도 체인에 남는다.
   - LeadDB 2층 분리: ⓐ통계 DB(비식별 집계 — 퍼미션 불요) ⓑ리드 DB(ConsentNFT 보유 회원만 — 생성 시점 코드 강제+감사).
   - dataFee: 이자·배당이 아니라 "내 데이터를 쓴 대가"(이용 대가) — 가드레일 ⓗ(배당 타입 미정의)와 구분되는 법적 성격을 명시.
   - 가드레일 ⓛ: 리드 행에는 건강 원본이 아니라 등급·세그먼트만. 신용정보법·개인정보보호법(2026.9 강화) 검토 표기. */

const CN_SCOPES = { mkt: "맞춤 보험·건강 안내(마케팅)", study: "가명 연구 활용", stats: "통계 참여" };
const CN_CONFIG = { DATA_FEE_WON: 500, FEE_SPLIT_MEMBER: 0.5 };   // 리드 1건 제공 대가(시연)·회원 배분율 50%(백서 분배 원칙) — 정산 주기·요율은 계약으로 확정

function _cnKey(m) { return "hifin_consent_nft_" + ((typeof anonToken === "function" && m) ? anonToken(m) : "anon"); }
function cnList(m) { try { return JSON.parse(localStorage.getItem(_cnKey(m)) || "[]"); } catch (e) { return []; } }
function _cnSave(m, l) { try { localStorage.setItem(_cnKey(m), JSON.stringify(l)); } catch (e) {} }
/* 발행 — 회원 본인의 사전 포괄동의를 증서로 구조화(건별 재동의 생략의 법적 실질) */
function cnIssue(m, o) {
  o = o || {};
  const scope = (o.scope && o.scope.length) ? o.scope : ["mkt"];
  const l = cnList(m);
  if (l.some((c) => c.status === "active" && c.scope.join() === scope.join())) return { ok: false, reason: "같은 범위의 유효한 동의 증서가 이미 있어요" };
  const nft = { id: "CNFT-" + Date.now().toString(36).toUpperCase(), scope, scopeKo: scope.map((s) => CN_SCOPES[s] || s),
    to: o.to || "제휴 보험사·GA(현대해상 계열)", until: o.until || (new Date(Date.now() + 365 * 86400000)).toISOString().slice(0, 10),
    purpose: o.purpose || "보장 공백 기반 맞춤 안내", status: "active", issuedAt: Date.now() };
  nft.hash = (typeof vaultHash === "function") ? vaultHash(JSON.stringify(nft)) : null;
  l.push(nft); _cnSave(m, l);
  if (typeof chainAppend === "function") chainAppend({ type: "consent-nft", token: (typeof anonToken === "function") ? anonToken(m) : null, fhirHash: nft.hash, note: `조건부 동의 증서 발행 — ${nft.id} · [${nft.scopeKo.join("·")}] → ${nft.to} · ~${nft.until} (철회 가능)` });
  try { if (scope.indexOf("mkt") >= 0 && typeof vaultSaveConsents === "function") vaultSaveConsents(m, { mkt: true, step: "consent-nft" }); } catch (e) {}
  return { ok: true, nft };
}
/* 철회 — 즉시 효력 + 체인 이력 */
function cnRevoke(m, id) {
  const l = cnList(m); const c = l.find((x) => x.id === id);
  if (!c) return { ok: false, reason: "증서를 찾을 수 없습니다" };
  if (c.status === "revoked") return { ok: false, reason: "이미 철회된 증서입니다" };
  c.status = "revoked"; c.revokedAt = Date.now();
  _cnSave(m, l);
  if (typeof chainAppend === "function") chainAppend({ type: "consent-nft", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `동의 증서 철회 — ${c.id} (즉시 효력 · 이후 소비 전면 차단)` });
  try { if (c.scope.indexOf("mkt") >= 0 && typeof vaultSaveConsents === "function") vaultSaveConsents(m, { mkt: false, step: "consent-nft-revoke" }); } catch (e) {}
  return { ok: true, nft: c };
}
/* 소비 검증 — active + 미만료 + 범위 포함일 때만 true (철회 즉시 false) */
function cnAllowed(m, scopeItem) {
  return cnList(m).some((c) => c.status === "active" && c.scope.indexOf(scopeItem) >= 0 && (!c.until || new Date(c.until + "T23:59:59") >= new Date()));
}

/* ══ LeadDBFactory — 2층 분리 ══ */
function statsDb() {   // ⓐ 비식별 통계(코호트 집계) — 퍼미션 불요
  const st = (typeof cohortInsStats === "function") ? cohortInsStats() : null;
  return st ? { kind: "stats", n: st.n, silsonRate: st.silsonRate, uninsured: st.uninsured, genMix: st.genMix, label: "합성 코호트 비식별 집계" } : null;
}
function leadDbBuild() {   // ⓑ 리드 DB — RegGate 시뮬 게이트 + 동의 보유자만(코드 강제)
  const g = (typeof regGateAllowed === "function") ? regGateAllowed("leadDb", "simulation") : { ok: false, reason: "게이트 없음" };
  if (!g.ok) { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: "리드 DB 생성 시도 차단 — " + g.reason }); return { ok: false, reason: g.reason }; }
  const rows = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("hifin_consent_nft_") !== 0) continue;
      const token = k.replace("hifin_consent_nft_", "");
      const list = JSON.parse(localStorage.getItem(k) || "[]");
      const c = list.find((x) => x.status === "active" && x.scope.indexOf("mkt") >= 0 && (!x.until || new Date(x.until + "T23:59:59") >= new Date()));
      if (!c) continue;   // ★ 무동의·철회·만료는 생성 시점에 원천 배제
      // 가드레일 ⓛ: 세그먼트 정보만(원본 건강값 배제) — 금고에서 등급성 정보만 파생
      let seg = { silson: "미상", ageBand: "미상", sex: "미상" };
      try { const v = JSON.parse(localStorage.getItem("hifin_vault_" + token) || "null"); const sil = v && (v.insurance || []).find((x) => x.kind === "실손"); seg.silson = sil ? (sil.gen || "가입") : "미가입"; } catch (e) {}
      rows.push({ consentId: c.id, tokenMasked: token.slice(0, 8) + "…", seg, until: c.until, purpose: c.purpose });
    }
  } catch (e) {}
  const db = { kind: "lead", builtAt: Date.now(), rows, sim: true };
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `리드 DB 생성(시뮬) — 동의 증서 보유 ${rows.length}건만 편입(무동의 0명 강제)` });
  return { ok: true, db, audit: leadDbAudit(db) };
}
function leadDbAudit(db) {   // 무동의 0명 증명 — 행별 증서 재검증
  let bad = 0;
  (db.rows || []).forEach((r) => {
    let found = false;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("hifin_consent_nft_") === 0) { const list = JSON.parse(localStorage.getItem(k) || "[]"); if (list.some((c) => c.id === r.consentId && c.status === "active" && (!c.until || new Date(c.until + "T23:59:59") >= new Date()))) { found = true; break; } } } } catch (e) {}
    if (!found) bad++;
  });
  return { rows: (db.rows || []).length, violations: bad, ok: bad === 0 };
}
/* ══ RevenueShareLedger — 데이터 이용 대가(dataFee) 지급: RegGate 시뮬 게이트 + 원장 tx ══ */
function dataFeePay(m, consentId) {
  const g = (typeof regGateAllowed === "function") ? regGateAllowed("dataFee", "simulation") : { ok: false };
  if (!g.ok) return { ok: false, reason: g.reason };
  if (!cnAllowed(m, "mkt")) return { ok: false, reason: "유효한 동의 증서가 없어 지급할 수 없어요(철회 즉시 중단)" };
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const won = Math.round(CN_CONFIG.DATA_FEE_WON * CN_CONFIG.FEE_SPLIT_MEMBER);
  const htk = Math.round(won / rate);
  const r = (typeof tlAppend === "function") ? tlAppend(m, { type: "dataFee", amount: htk, memo: `데이터 이용 대가 — 리드 제공 1건(${consentId || "동의 증서"}) · ${won.toLocaleString()}원 상당 (이자·배당 아님 — 이용 대가)`, ref: consentId }) : { ok: false };
  if (!r.ok) return r;
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function") ? anonToken(m) : null, note: `데이터 이용 대가 지급(시뮬) — ${won.toLocaleString()}원(${htk} HTK) · 동의 증서 검증 후` });
  if (typeof notifPush === "function") notifPush({ ic: "coin", t: "데이터 이용 대가 입금", d: `내 동의로 제공된 데이터 1건의 대가 ${won.toLocaleString()}원(${htk} HTK)이 입금됐어요`, target: "insurance" });
  return { ok: true, won, htk, balance: r.balance };
}
