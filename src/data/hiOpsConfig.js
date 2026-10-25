/* ══════════════ 운영 설정 단일 소스 — 조정 가능한 것만 조정한다 (Phase G) ══════════════
   임계값이 코드 6곳에 흩어져 있었다(agentEnsemble·rpmAlert·harvest·promote·gate).
   여기로 모아 화면에서 조정할 수 있게 하되, **조정하면 안 되는 값은 잠근다.**

   ⚠️ 콘솔은 관측이지 조작이 아니다.
   관제 화면을 만들면 "다 켜고 끌 수 있게" 하고 싶어진다 — 그게 사고의 시작이다.
   응급 트리아지·가드 조항·이음말·게이트 기준은 **화면에서 못 바꾼다.**
   안전을 UI 토글로 만들면 언젠가 꺼진다.

   ⚠️ 설정이 없어도 서비스는 돈다.
   기본값은 코드에 남기고, 저장된 설정이 없거나 깨졌으면 기본값으로 동작한다. */

const OPS_KEY = "hifin_ops_config";

/* ── 조정 가능 — 화면에서 바꾼다 ── */
const OPS_SPEC = {
  ensEnabled:   { def: true, type: "bool",  label: "협주 사용", hint: "끄면 Phase E 이전 동작(단일 담당)" },
  ensMaxLines:  { def: 12,   type: "int", min: 8, max: 16, label: "협주 분량 상한(줄)", hint: "모바일에서 읽히는 길이" },
  ensMaxParts:  { def: 3,    type: "int", min: 2, max: 3,  label: "협주 파트 수", hint: "그 이상은 회원이 읽지 못한다" },
  confGap:      { def: 2,    type: "int", min: 1, max: 4,  label: "자동 라벨 확신 기준", hint: "1·2등 점수 격차가 이보다 작으면 사람에게" },
  impactGuard:  { def: 10,   type: "int", min: 1, max: 10, label: "수확 가중치 · 가드 위반", hint: "규제 사고 — 되돌릴 수 없다" },
  impactUnans:  { def: 5,    type: "int", min: 1, max: 10, label: "수확 가중치 · 답변불가" },
  impactHandback: { def: 4,  type: "int", min: 1, max: 10, label: "수확 가중치 · 오배정" },
  impactEns:    { def: 3,    type: "int", min: 1, max: 10, label: "수확 가중치 · 협주 누락" },
  impactMiss:   { def: 2,    type: "int", min: 1, max: 10, label: "수확 가중치 · 미매칭" },
  rpmHighSys:   { def: 160,  type: "int", min: 140, max: 179, label: "RPM 관찰 임계 · 수축기", hint: "오늘 안에 진료(urgent) — crisis(180)는 잠금" },
  rpmHighDia:   { def: 100,  type: "int", min: 90,  max: 119, label: "RPM 관찰 임계 · 이완기", hint: "crisis(120)는 잠금" },
  /* 협력업체 통제(P4 · 지시서 v2.3 §7-6) — **조정 가능한 것만** 여기 둔다.
     판정 임계와 집행 수준 하한은 여기 두지 않는다(정책 파일이 소유하고, 저장값 주입으로 바뀌지 않는다).
     코드에 상수로 흩뿌리면 다시 여섯 곳으로 흩어진다 — 그래서 조정 가능한 셋만 모았다. */
  pgDefenseDays:  { def: 14, type: "int", min: 7,  max: 30, label: "협력업체 소명 접수 기한(일)", hint: "기한만 있고 소명할 곳이 없으면 모순이다 — 소명면이 열릴 때 함께 쓰인다" },
  pgReportMonths: { def: 7,  type: "int", min: 1,  max: 12, label: "보고서 기간 범위(개월)", hint: "거래 사실의 창과 같아야 포착률이 1.0으로 선다" },
  pgSlaWarnPct:   { def: 10, type: "int", min: 1,  max: 50, label: "배송 기준일 초과율 경고 임계(%)", hint: "경고선이다 — 차단선이 아니다" },
};

/* ── 절대 잠금 — 화면에서 못 바꾼다. 존재는 보여주되 회색으로 ── */
const OPS_LOCKED = [
  { key: "emergencyDict", label: "응급 징후 사전(LTC_EMERGENCY)", where: "longtermCareKB.js",
    why: "안전을 UI 토글로 만들면 언젠가 꺼진다" },
  { key: "rpmCrisis", label: "RPM 즉시 진료 임계(수축기 180 / 이완기 120)", where: "rpmAlert.js",
    why: "즉시 진료 판단선은 화면에서 낮출 수 없다" },
  { key: "guardRules", label: "가드 조항 — A2 5조 · A3 6조 · A4 6조 · 협주 6조", where: "agents/*Guard.js",
    why: "규제 통제는 코드 리뷰와 하네스를 거쳐야 한다" },
  { key: "guardFix", label: "가드 치환 문구", where: "agents/*Guard.js",
    why: "문구 부착 ≠ 교정(Phase B) — 사람이 쓰고 하네스가 검증한다" },
  { key: "ensBridge", label: "협주 이음말 화이트리스트", where: "agentEnsemble.js",
    why: "협주는 조립이지 생성이 아니다(Phase E)" },
  { key: "gateCriteria", label: "게이트 통과 기준(정확도·하락폭 등)", where: "scripts/learn/gate.mjs",
    why: "문지기를 감시받는 쪽이 조정하면 문지기가 아니다" },
  /* 협력업체 통제(P4) — ⚠️ **등재는 집행이 아니다.** 이 목록은 「무엇이 잠겨 있는지」를 화면에 회색으로
     보여주는 문서 등재일 뿐이고, 실제 잠금은 코드에 있다: 통제 임계는 정책 파일이 소유하며 저장값을
     읽지 않고, 집행 수준은 전환 함수가 하향과 무근거 승격을 거부하고, 저장값 적재기는 배포 테이블보다
     낮은 수준을 **배포 테이블 값으로 폴백**한다. 그 셋을 러너가 주입 테스트로 단언한다. */
  { key: "pgThresh", label: "협력업체 통제 판정 임계", where: "src/data/partnerPolicy.js",
    why: "감시받는 쪽이 판정 기준을 조정하면 판정이 아니다 — 정책 파일은 저장값을 읽지 않는다" },
  { key: "pgEnforceFloor", label: "협력업체 집행 수준 하한·지점 상한", where: "src/data/partnerPolicy.js · src/data/partnerEnforce.js",
    why: "하향은 코드가 거부한다. 정산·노출 지점은 경고·기록 상한이 코드 고정이다" },
];
const OPS_LOCKED_KEYS = OPS_LOCKED.map(function (l) { return l.key; });

/* ── 읽기 ── */
function opsRaw() {
  try { const v = JSON.parse(localStorage.getItem(OPS_KEY) || "null"); return (v && typeof v === "object") ? v : {}; } catch (e) { return {}; }
}

/* 값 하나 — 저장값이 없거나 범위를 벗어나면 **기본값**으로 돌아간다 */
function opsGet(key) {
  const spec = OPS_SPEC[key];
  if (!spec) return undefined;
  const v = opsRaw()[key];
  if (v === undefined || v === null) return spec.def;
  if (spec.type === "bool") return typeof v === "boolean" ? v : spec.def;
  const n = Number(v);
  if (!isFinite(n)) return spec.def;
  if (spec.min != null && n < spec.min) return spec.def;
  if (spec.max != null && n > spec.max) return spec.def;
  return spec.type === "int" ? Math.round(n) : n;
}

/* 전체 — 화면·집계가 쓰는 스냅샷 */
function opsAll() {
  const out = {};
  for (const k in OPS_SPEC) out[k] = opsGet(k);
  return out;
}

/* ── 쓰기 — 잠금·범위 검증을 통과해야만 저장된다 ──
   반환: { ok } | { ok:false, reason } */
function opsSet(key, value) {
  if (OPS_LOCKED_KEYS.indexOf(key) >= 0) return { ok: false, reason: "locked", msg: "이 값은 코드에서만 변경할 수 있어요(하네스 통과 필요)." };
  const spec = OPS_SPEC[key];
  if (!spec) return { ok: false, reason: "unknown", msg: "알 수 없는 설정 항목이에요." };
  let v = value;
  if (spec.type === "bool") { if (typeof v !== "boolean") return { ok: false, reason: "type", msg: "true/false만 가능해요." }; }
  else {
    v = Number(v);
    if (!isFinite(v)) return { ok: false, reason: "type", msg: "숫자만 가능해요." };
    v = Math.round(v);
    if (spec.min != null && v < spec.min) return { ok: false, reason: "range", msg: `${spec.min} 이상이어야 해요.` };
    if (spec.max != null && v > spec.max) return { ok: false, reason: "range", msg: `${spec.max} 이하여야 해요.` };
  }
  try {
    const cur = opsRaw();
    cur[key] = v;
    cur._at = Date.now();
    localStorage.setItem(OPS_KEY, JSON.stringify(cur));
    return { ok: true, value: v };
  } catch (e) { return { ok: false, reason: "storage", msg: "저장에 실패했어요." }; }
}

function opsReset(key) {
  try {
    const cur = opsRaw();
    if (key) delete cur[key]; else return localStorage.removeItem(OPS_KEY), { ok: true };
    localStorage.setItem(OPS_KEY, JSON.stringify(cur));
    return { ok: true };
  } catch (e) { return { ok: false }; }
}
function opsChangedAt() { const r = opsRaw(); return r._at || null; }
function opsIsDefault(key) { return opsRaw()[key] === undefined; }

try { if (typeof window !== "undefined") { window.__hifinOps = { get: opsGet, all: opsAll, set: opsSet, reset: opsReset, spec: OPS_SPEC, locked: OPS_LOCKED, changedAt: opsChangedAt, isDefault: opsIsDefault }; } } catch (e) {}
