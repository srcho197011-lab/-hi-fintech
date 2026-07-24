/* ══════════════ C1-2 RegGate — 규제 시행일 동기화 기능 게이트 ══════════════
   진단 보고서(HIFIN-AUDIT-INS-20260724) 축3 C1-2 구현. (사업계획서 원칙5 · IDF-14의 코드 실체화)
   문제: "폐쇄형 HTK·법제화 후 도입·L3 우선"이 전부 UI 문구였고 기능 게이팅 조건문이 0건.
   해결: 규제 민감 기능 4종을 중앙 게이트로 등록하고, 호출부가 반드시 게이트 판정을 통과해야 실행.
   원칙:
   - live(실운영) 전환은 근거 법령 시행일이 코드로 확인돼야만 가능 — 시행일 미확정/미도래면 관리자 override로도 불가(하드 플로어).
   - 시행일이 도래하면 재배포 없이 자동 개방 판정(시행일 동기화) — IDF-14 "재배포 없이 일괄 전환".
   - 법제 확정 전에는 simulation 모드만 허용(가드레일 ⓒ) — UI에 시뮬레이션임을 상시 표기.
   - 배당·이자는 게이트 이전에 TokenLedger 화이트리스트에서 유형 자체가 없음(가드레일 ⓗ) — 이 게이트는 그 위의 2차 방어선. */

/* ── 게이트 정의(기본값) — 외부 환경 확인 2026-07: 디지털자산기본법 2단계 입법 협의 중 · 토큰증권 2027-02-04 시행 예정 ── */
const REG_GATE_DEFS = {
  closedLoop: { title: "폐쇄형 HTK — 현금 교환·출금 차단", law: "가상자산이용자보호법 정합 · 디지털자산기본법(협의 중)", mode: "locked", effectiveDate: null,
    note: "HTK의 현금 인출·환전·원화 전환 경로를 코드로 차단합니다. 법제 확정 전 고정." },
  stablecoin: { title: "스테이블코인 정산(보험료·보험금)", law: "디지털자산기본법 2단계(스테이블 발행·유통 규율 — 입법 협의 중)", mode: "simulation", effectiveDate: null,
    note: "법제 확정 전에는 시뮬레이션 모드만 — 실자금 정산 경로 차단." },
  sto: { title: "배당·토큰증권(STO) 트랙", law: "토큰증권 제도(자본시장법·전자증권법 개정 — 2027-02-04 시행 예정)", mode: "off", effectiveDate: "2027-02-04",
    note: "데이터 배당의 증권형 분배는 STO 트랙으로 분리 — 시행일 도래+발행 절차 전 개방 불가." },
  openChain: { title: "개방형 체인·코인 발행(L3)", law: "디지털자산기본법 + 코인 발행 6조건(백서·사업계획서)", mode: "off", effectiveDate: null,
    note: "L3 앱체인 우선 전략 — 법제 확정과 6조건 충족 전 차단." },
};

/* ── 관리자 운영 모드 저장(override) — live 하드 플로어는 regGateAllowed에서 별도 강제 ── */
function _rgOverrides() { try { return JSON.parse(localStorage.getItem("hifin_reggate") || "{}"); } catch (e) { return {}; } }
function regGateState(key) {
  const def = REG_GATE_DEFS[key]; if (!def) return null;
  const ov = _rgOverrides()[key] || {};
  return Object.assign({ key }, def, ov.mode ? { mode: ov.mode, overridden: true } : {});
}
function regGateAll() { return Object.keys(REG_GATE_DEFS).map(regGateState); }

/* ── 판정 — want: "simulation" | "live". 반환 {ok, sim?, reason?} ── */
function regGateAllowed(key, want) {
  const st = regGateState(key);
  if (!st) return { ok: false, reason: "미등록 게이트: " + key };
  if (st.mode === "locked") return { ok: false, reason: `${st.title} — 규제 게이트 잠금(${st.law})` };
  if (want === "live") {
    if (!st.effectiveDate) return { ok: false, reason: `${st.title} — 근거 법령 시행일 미확정: 실운영 개방 불가(코드 차단)` };
    if (new Date() < new Date(st.effectiveDate + "T00:00:00")) return { ok: false, reason: `${st.title} — 시행일(${st.effectiveDate}) 도래 전: 실운영 개방 불가(코드 차단)` };
    if (st.mode !== "live") return { ok: false, reason: `${st.title} — 시행일은 도래했으나 운영 전환 미승인(현재 모드: ${st.mode})` };
    return { ok: true };
  }
  if (st.mode === "off") return { ok: false, reason: `${st.title} — 비활성(시뮬레이션 포함)` };
  return { ok: true, sim: st.mode !== "live" };
}

/* ── 운영 모드 전환(관리자 전용) — live는 시행일 하드 플로어를 여기서도 강제 ── */
function regGateSet(key, mode) {
  if (!(typeof isAdminRole === "function" && isAdminRole())) return { ok: false, reason: "관리자만 게이트 모드를 변경할 수 있습니다" };
  const def = REG_GATE_DEFS[key]; if (!def) return { ok: false, reason: "미등록 게이트" };
  if (def.mode === "locked") return { ok: false, reason: def.title + " — 잠금 게이트는 법제 확정 전 전환 불가" };
  if (mode === "live") { const chk = regGateState(key); if (!chk.effectiveDate || new Date() < new Date(chk.effectiveDate + "T00:00:00")) return { ok: false, reason: "시행일 미확정/미도래 — live 전환은 코드가 거부합니다" }; }
  if (["off", "simulation", "live"].indexOf(mode) < 0) return { ok: false, reason: "허용되지 않은 모드" };
  try { const ov = _rgOverrides(); ov[key] = { mode }; localStorage.setItem("hifin_reggate", JSON.stringify(ov)); } catch (e) {}
  return { ok: true, state: regGateState(key) };
}

/* ── 현금성 전환 감지 — 폐쇄형 강제의 실행 지점(htkSwap/htkTransfer 등에서 호출) ── */
function regGateCashGuard(targetText) {
  const t = String(targetText || "");
  if (/현금|원화|KRW|출금|인출|환전|계좌|이체(?!.*크레딧)/.test(t)) return regGateAllowed("closedLoop", "live");   // closedLoop는 locked → 항상 차단 사유 반환
  if (/스테이블|USDK|KRWx|stable/i.test(t)) { const r = regGateAllowed("stablecoin", "live"); return r.ok ? r : { ok: false, reason: r.reason + " — 현재는 시뮬레이션만 가능해요" }; }
  return { ok: true };
}
