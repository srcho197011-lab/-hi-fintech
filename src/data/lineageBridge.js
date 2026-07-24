/* ══════════════ M1-1 계보 실연결(Lineage Bridge) — 1세대(금고 실검진값) → 2세대(AI 분석) ══════════════
   진단 보고서(HIFIN-AUDIT-INS-20260724) 축2 M1-1 구현.
   문제: 생체나이·장기나이·암위험이 이름 시드 난수(demoMakeProfile)로 생성되어 금고의 실검진값과 단절.
   해결: 금고(hifin_vault_*)에 검진 레코드가 있으면 AI 분석 입력을 "실측값의 결정론 함수"로 교체.
   - 계산은 CKUP_LOINC 정상범위 대비 편차 등급(0~3)의 합산 — 어떤 지표가 몇 점 기여했는지 근거(evidence) 전건 추적.
   - 금고가 비어 있으면 기존 합성 프로필 폴백(무중단) — demoReport._lineage.source 로 구분 표기.
   - 가드레일 ⓔ/ⓖ: 위험 정보이지 진단이 아니며, 산출 근거를 회원이 확인할 수 있는 구조. */

/* ── 금고 최신 검진 레코드 → key→value 맵 ── */
function vaultCheckupMap(member) {
  try {
    if (!member) return null;
    const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(member)) : null;
    if (!v || !v.checkups || !v.checkups.length) return null;
    const sorted = v.checkups.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const latest = sorted[sorted.length - 1];
    const map = {};
    (latest.items || []).forEach((it) => { if (it && it.key != null && it.value != null) map[it.key] = it.value; });
    if (!Object.keys(map).length) return null;
    return { map, date: latest.date, channel: latest.channel, completeness: latest.completeness, n: Object.keys(map).length, history: sorted.length };
  } catch (e) { return null; }
}

/* ── 지표 편차 등급 — 정상범위(ref) 초과율 → 0(정상)·1(경계)·2(주의)·3(위험) ── */
function _lbSev(key, val) {
  const s = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC[key] : null;
  if (!s) return { sev: 0, flag: "" };
  if (s.qual) { const f = (typeof ckupFlag === "function") ? ckupFlag(key, val) : ""; return { sev: f ? 2 : 0, flag: f }; }
  const n = Number(val);
  if (isNaN(n) || !s.ref) return { sev: 0, flag: "" };
  let ratio = 0, flag = "";
  if (key === "hdl") { if (n < 40) { ratio = (40 - n) / 40; flag = "low"; } }
  else if (n > s.ref[1]) { ratio = (n - s.ref[1]) / Math.max(1, s.ref[1]); flag = "high"; }
  else if (n < s.ref[0]) { ratio = (s.ref[0] - n) / Math.max(1, s.ref[0]); flag = "low"; }
  const sev = ratio >= 0.5 ? 3 : ratio >= 0.22 ? 2 : ratio > 0 ? 1 : 0;
  return { sev, flag, ratio: Math.round(ratio * 100) / 100 };
}

/* ── 장기 그룹 ↔ 지표 매핑(근거 추적의 기본 단위) ── */
const LB_ORGANS = [
  { field: "obesityAge", ko: "비만체형", keys: ["bmi", "waist", "weight"] },
  { field: "heartAge", ko: "심장", keys: ["sbp", "dbp", "ldl", "tchol", "tg", "hdl"] },
  { field: "liverAge", ko: "간", keys: ["ast", "alt", "ggt"] },
  { field: "pancreasAge", ko: "췌장", keys: ["glucose", "hba1c"] },
  { field: "kidneyAge", ko: "신장", keys: ["cr", "egfr", "uprot"] },
];

/* ── 2세대 분석 프로필 — 실검진값의 결정론 함수(설명가능) ──
   반환: { fields:{biologicalAge, 장기나이 5종, cancerRiskGrade}, evidence, date, n } 또는 null(금고 비어있음) */
function lineageProfile(member) {
  const ck = vaultCheckupMap(member);
  if (!ck) return null;
  const reg = (typeof demoRegAge === "function") ? demoRegAge(member) : (member.regAge || member.age || 45);
  const fields = {}, evidence = [];
  let totalSev = 0, riskyOrgans = 0;
  LB_ORGANS.forEach((org) => {
    let sevSum = 0; const items = [];
    org.keys.forEach((k) => {
      if (ck.map[k] == null) return;
      const r = _lbSev(k, ck.map[k]);
      sevSum += r.sev;
      const spec = CKUP_LOINC[k];
      items.push({ key: k, ko: spec.ko, value: ck.map[k], unit: spec.unit, sev: r.sev, flag: r.flag });
    });
    const delta = sevSum === 0 ? (items.length ? -2 : 0) : Math.min(10, Math.round(sevSum * 1.7));
    fields[org.field] = Math.max(18, reg + delta);
    if (sevSum >= 3) riskyOrgans++;
    totalSev += sevSum;
    evidence.push({ organ: org.ko, field: org.field, age: fields[org.field], delta, sevSum, items: items.sort((a, b) => b.sev - a.sev) });
  });
  const bioDelta = totalSev === 0 ? -2 : Math.min(9, Math.round(totalSev * 0.6));
  fields.biologicalAge = Math.max(19, reg + bioDelta);
  const cxrAbn = _lbSev("cxr", ck.map.cxr).sev > 0 ? 1 : 0;
  fields.cancerRiskGrade = Math.max(2, Math.min(8, 2 + riskyOrgans + cxrAbn + (reg >= 60 ? 1 : 0)));
  return { fields, evidence, date: ck.date, channel: ck.channel, completeness: ck.completeness, n: ck.n, history: ck.history, reg, totalSev };
}

/* ── 표시용 회원 보정 — 금고 실측 기반이면 생체·장기나이·암등급을 교체한 회원 객체 반환(없으면 원본) ── */
function lineageMember(m) { try { const lp = lineageProfile(m); return lp ? Object.assign({}, m, lp.fields, { _lineageVault: true }) : m; } catch (e) { return m; } }

/* ── 근거 요약 한 줄(회원 표시용) — 이상 지표 상위 3개 ── */
function lineageEvidenceLine(lp) {
  if (!lp) return "";
  const abn = lp.evidence.flatMap((e) => e.items).filter((i) => i.sev > 0).sort((a, b) => b.sev - a.sev).slice(0, 3);
  if (!abn.length) return "전 지표 정상범위 — 관리 상태 양호";
  return "근거: " + abn.map((i) => `${i.ko} ${i.value}${i.unit}(${i.sev >= 3 ? "위험" : i.sev >= 2 ? "주의" : "경계"})`).join(" · ");
}
