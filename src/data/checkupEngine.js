/* ═══════════════════════════════════════════════════════════════════════
   회원별 검진데이터 생성기 + AI 상담엔진(RAG)
   · genMemberCheckup(m) → { nat(국가건강검진 결과통보서), comp(종합건강진단결과표) }
     (건강분석리포트는 demoReport(m)를 재사용 — 이미 회원별 생성됨)
   · memberCheckupCounsel(text, m) → 로그인 회원의 '내 검진 결과' 항목별 상담
   · checkupEduCounsel(text) → 검진 이해(종합검진 목적·체성분·생체나이·암예방·항목기준)
   결정론적: 회원 id/email 시드 → 재현 가능. 값은 회원 위험프로필과 정합.
   ⚠️ 교육·안내 목적. 실제 판정·진단은 검진기관 의사 소견을 따릅니다.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 결정론적 난수 ── */
function _chkSeed(s) { let h = 2166136261; s = String(s || "x"); for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; } return h >>> 0; }
function _chkRng(seed) { let h = seed >>> 0; return () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; }; }
function _chkR(rng, lo, hi, dec) { const v = lo + (hi - lo) * rng(); const f = Math.pow(10, dec || 0); return Math.round(v * f) / f; }

/* ── 항목별 sev(0정상·1주의·2위험) → 값 범위 [lo,hi,소수] ── */
const _CHK_RANGE = {
  bmi: [[20, 24.4, 1], [25, 27.5, 1], [28, 33, 1]],
  waist: { m: [[76, 88, 0], [90, 95, 0], [96, 105, 0]], f: [[70, 80, 0], [85, 90, 0], [91, 99, 0]] },
  sbp: [[106, 119, 0], [122, 136, 0], [142, 159, 0]],
  dbp: [[66, 79, 0], [82, 89, 0], [92, 102, 0]],
  fbs: [[82, 98, 0], [102, 118, 0], [128, 158, 0]],
  hba1c: [[4.9, 5.6, 1], [5.8, 6.3, 1], [6.6, 8.0, 1]],
  tc: [[158, 196, 0], [204, 236, 0], [244, 286, 0]],
  tg: [[68, 142, 0], [154, 196, 0], [212, 330, 0]],
  hdl: { m: [[44, 62, 0], [36, 42, 0], [30, 36, 0]], f: [[54, 72, 0], [44, 49, 0], [38, 44, 0]] },
  ldl: [[88, 126, 0], [132, 157, 0], [162, 198, 0]],
  ast: [[18, 34, 0], [43, 66, 0], [72, 120, 0]],
  alt: [[15, 33, 0], [40, 60, 0], [66, 110, 0]],
  ggtp: { m: [[15, 55, 0], [70, 110, 0], [130, 240, 0]], f: [[11, 30, 0], [40, 68, 0], [80, 160, 0]] },
  cr: [[0.7, 1.2, 1], [1.3, 1.5, 1], [1.6, 2.4, 1]],
  egfr: [[78, 112, 0], [58, 66, 0], [34, 54, 0]],
  hb: { m: [[14, 16.2, 1], [12.4, 13.0, 1], [10.0, 12.2, 1]], f: [[12.6, 15.0, 1], [11.2, 11.9, 1], [9.4, 11.0, 1]] },
  plt: [[180, 320, 0], [132, 148, 0], [95, 125, 0]],
  ua: [[4.0, 6.7, 1], [7.1, 7.5, 1], [7.8, 9.2, 1]],
  tsh: [[0.7, 4.4, 2], [5.6, 7.0, 2], [0.05, 0.30, 2]],
  psa: [[0.4, 2.5, 1], [3.3, 4.9, 1], [5.5, 8.0, 1]],
  cea: [[0.6, 3.8, 1], [4.4, 6.5, 1], [7.5, 12, 1]],
  afp: [[1.5, 8.5, 1], [12, 19, 1], [25, 60, 1]],
  ca199: [[5, 30, 0], [38, 58, 0], [70, 150, 0]],
};

function _hrdHas(m, k) { return (m.highRiskDiseases || []).some((d) => d.indexOf(k) >= 0); }
function _hrcHas(m, k) { return (m.highRiskCancerTypes || []).some((c) => c.indexOf(k) >= 0); }

/* 회원 위험프로필 → 항목 severity */
function _chkSev(key, m) {
  const olderOrgan = (age) => (typeof age === "number" && typeof m.regAge === "number") ? (age > m.regAge + 6 ? 2 : age > m.regAge + 2 ? 1 : 0) : 0;
  switch (key) {
    case "sbp": case "dbp": return _hrdHas(m, "고혈압") ? 2 : olderOrgan(m.heartAge);
    case "fbs": case "hba1c": return _hrdHas(m, "당뇨") ? 2 : olderOrgan(m.pancreasAge);
    case "tc": case "tg": case "ldl": return (_hrdHas(m, "고지혈") || _hrdHas(m, "이상지질")) ? 2 : (_hrdHas(m, "지방간") ? 1 : olderOrgan(m.heartAge) ? 1 : 0);
    case "hdl": return (_hrdHas(m, "고지혈") || _hrdHas(m, "이상지질")) ? 1 : 0;
    case "ast": case "alt": case "ggtp": return _hrdHas(m, "지방간") ? 2 : (_hrdHas(m, "간") ? 1 : olderOrgan(m.liverAge));
    case "cr": case "egfr": return (_hrdHas(m, "콩팥") || _hrdHas(m, "신부전") || _hrdHas(m, "신장")) ? 2 : olderOrgan(m.kidneyAge) === 2 ? 1 : 0;
    case "hb": return _hrdHas(m, "빈혈") ? 2 : 0;
    case "ua": return _hrdHas(m, "통풍") ? 2 : 0;
    case "bmi": case "waist": return olderOrgan(m.obesityAge);
    case "tsh": return _hrdHas(m, "갑상선") ? 1 : 0;
    case "psa": return _hrcHas(m, "전립선") ? 1 : 0;
    case "cea": return _hrcHas(m, "대장") ? 1 : 0;
    case "afp": return _hrcHas(m, "간") ? 1 : 0;
    case "ca199": return _hrcHas(m, "췌장") ? 1 : 0;
    default: return 0;
  }
}

function _chkLabel(key, sev) {
  if (key === "bmi") return ["정상", "과체중", "비만"][sev];
  if (key === "waist") return ["정상", "복부비만 경계", "복부비만"][sev];
  return ["정상", "주의", "위험"][sev];
}
function _chkEmoji(sev) { return ["✅", "⚠️", "🚨"][sev]; }
function _refStr(item, sex) {
  const r = item.ref;
  if (Array.isArray(r)) { if (item.lowIsBad) return `${r[0]}${item.unit} 이상`; if (r[0] === 0) return `${r[1]}${item.unit} 이하`; return `${r[0]}~${r[1]}${item.unit}`; }
  const rr = r[sex] || r.m; const g = sex === "f" ? "여" : "남"; if (item.lowIsBad) return `${g} ${rr[0]}${item.unit} 이상`; if (rr[0] === 0) return `${g} ${rr[1]}${item.unit} 미만`; return `${g} ${rr[0]}~${rr[1]}${item.unit}`;
}

/* ═══ 최근 3년 추이(진행형태: 나아짐/악화/유지) ═══ */
const _CHK_CUR_YEAR = 2026;                                   // 최근(현재) 검진 연도
const TREND_LABEL = { improve: "나아짐", worsen: "악화", stable: "유지" };
const TREND_EMOJI = { improve: "📉✅", worsen: "📈⚠️", stable: "➡️" };

/* 값→판정 임계치 — 단일 소스는 clinicalBands.js(출처 동반). 여기서는 역참조만 한다(진실 1곳 · v1.3 §1-2).
   임계 변경은 clinicalBands에서 형 검수 표를 거쳐서만 — 값 변경은 코호트 전체 판정에 파급된다. */
const _TH = (typeof clinicalTH === "function") ? clinicalTH() : {};
function _thOf(key, sex) { const th = _TH[key]; if (!th) return null; const g = (x) => (x && typeof x === "object") ? (x[sex] || x.m) : x; return { dir: th.dir, t1: g(th.t1), t2: g(th.t2) }; }
function _judgeVal(key, v, sex) { const th = _thOf(key, sex); if (!th || v == null) return 0; if (th.dir === "lo") { if (v > th.t1) return 0; if (v > th.t2) return 1; return 2; } if (v < th.t1) return 0; if (v < th.t2) return 1; return 2; }

/* 회원 전체 건강 진행형태 결정(결정론) — 회원군을 나아짐·악화·유지로 분산 */
function _chkTrend(m) {
  const seed = _chkSeed("trend" + (m.id || m.email || m.name));
  if (m.category === "아동") return (seed % 2 === 0) ? "improve" : "stable";
  if (m.category === "노인" && (m.highRiskDiseases || []).length) return (seed % 3 === 0) ? "stable" : "worsen";
  return ["improve", "stable", "worsen"][seed % 3];
}

/* 항목별 3년 시계열 생성(현재값 고정, 과거 2년을 진행형태에 맞게 단조 생성) */
function _chkSeries(it, curVal, curSev, sex, trend, rng) {
  if (curVal == null) return null;
  const yrs = [_CHK_CUR_YEAR - 2, _CHK_CUR_YEAR - 1, _CHK_CUR_YEAR];
  const dec = (String(curVal).split(".")[1] || "").length;
  const put = (x, f) => { const p = Math.pow(10, dec); return Math.round((x * (1 + f)) * p) / p; };
  const higherWorse = !it.lowIsBad;
  let f1, f2;
  if (trend === "stable") { f1 = rng() * 0.06 - 0.03; f2 = rng() * 0.08 - 0.04; }
  else { const s1 = 0.05 + rng() * 0.05, s2 = 0.12 + rng() * 0.09; let sign = (trend === "improve") ? 1 : -1; if (!higherWorse) sign = -sign; f1 = sign * s1; f2 = sign * s2; }
  const clamp = (x) => Math.max(dec ? 0.1 : 1, x);
  const v2 = clamp(put(curVal, f2)), v1 = clamp(put(curVal, f1));
  const mk = (y, v, sv) => { const s = sv != null ? sv : _judgeVal(it.key, v, sex); return { year: y, value: v, sev: s, label: _chkLabel(it.key, s) }; };
  return [mk(yrs[0], v2), mk(yrs[1], v1), mk(yrs[2], curVal, curSev)];
}

/* 생체나이·의료비 3년 추이 */
function _reportTrend(m, trend, rng) {
  if (typeof demoReport !== "function") return null;
  const R = demoReport(m); const yrs = [_CHK_CUR_YEAR - 2, _CHK_CUR_YEAR - 1, _CHK_CUR_YEAR];
  const bio = R.bio, cost = R.costThis, sign = (trend === "improve") ? 1 : (trend === "worsen" ? -1 : 0);
  const s1 = trend === "stable" ? 0 : 0.9 + rng() * 0.8, s2 = trend === "stable" ? 0 : 2.1 + rng() * 1.5;
  const bioS = [+(bio + sign * s2).toFixed(1), +(bio + sign * s1).toFixed(1), +bio.toFixed(1)];
  const c1 = trend === "stable" ? 0 : sign * (0.06 + rng() * 0.05), c2 = trend === "stable" ? 0 : sign * (0.13 + rng() * 0.09);
  const costS = [Math.round(cost * (1 + c2)), Math.round(cost * (1 + c1)), Math.round(cost)];
  return { years: yrs, bio: bioS, cost: costS, reg: R.reg };
}

/* ── 회원별 국가검진(nat) + 종합검진(comp) 생성 (캐시) ── */
function genMemberCheckup(m) {
  if (!m) return null;
  if (m._chk) return m._chk;
  const sex = m.sex === "여" ? "f" : "m";
  const rng = _chkRng(_chkSeed(m.id || m.email || m.name));
  const trend = _chkTrend(m);
  const items = {};
  (typeof CHECKUP_ITEMS !== "undefined" ? CHECKUP_ITEMS : []).forEach((it) => {
    if (it.male && sex === "f") return;
    if (it.female && sex === "m") return;
    const sev = _chkSev(it.key, m);
    const rspec = _CHK_RANGE[it.key];
    let band;
    if (!rspec) band = null;
    else band = Array.isArray(rspec[0]) ? rspec[Math.min(sev, rspec.length - 1)] : (rspec[sex] || rspec.m)[Math.min(sev, 2)];
    const value = band ? _chkR(rng, band[0], band[1], band[2]) : null;
    const series = _chkSeries(it, value, sev, sex, trend, rng);
    items[it.key] = { key: it.key, name: it.name, value, unit: it.unit, sev, label: _chkLabel(it.key, sev), ref: _refStr(it, sex), item: it, series };
  });
  // 국가검진 판정
  const HRD = m.highRiskDiseases || [];
  const bpDmRisk = (items.sbp && items.sbp.sev === 2) || (items.fbs && items.fbs.sev === 2);
  const anyRisk1 = Object.keys(items).some((k) => items[k].sev >= 1);
  let grade;
  if (HRD.length) grade = "유질환자";
  else if (bpDmRisk) grade = "고혈압·당뇨병 질환의심";
  else if (anyRisk1) grade = "정상B";
  else grade = "정상A";
  // 생활습관 문진(관리포인트 기반)
  const mp = (m.managementPoints || []).join(" ");
  const life = [];
  if (/금연|흡연|담배/.test(mp) || _hrcHas(m, "폐")) life.push("금연 필요");
  if (/절주|음주|금주/.test(mp)) life.push("절주 필요");
  if (/운동|유산소|신체활동|근력/.test(mp) || (items.bmi && items.bmi.sev >= 1)) life.push("신체활동 필요");
  // 종합검진 소견(이상항목 요약)
  const abn = Object.keys(items).filter((k) => items[k].sev >= 1).map((k) => `${items[k].name} ${items[k].label}`);
  const nat = { grade, gradeDesc: (typeof NAT_GRADES !== "undefined" && NAT_GRADES[grade]) || "", diseases: HRD.slice(), life, date: `최근 검진(${_CHK_CUR_YEAR})`, src: typeof NAT_SRC !== "undefined" ? NAT_SRC : "국가건강검진" };
  const comp = { abnormals: abn, src: typeof COMP_SRC !== "undefined" ? COMP_SRC : "종합건강진단결과표" };
  const report = _reportTrend(m, trend, rng);
  m._chk = { items, sex, nat, comp, trend, trendLabel: TREND_LABEL[trend], years: [_CHK_CUR_YEAR - 2, _CHK_CUR_YEAR - 1, _CHK_CUR_YEAR], report };
  return m._chk;
}

/* ── 항목 매칭 ── */
function _matchItem(text) {
  const t = String(text).toLowerCase();
  let best = null;
  (typeof CHECKUP_ITEMS !== "undefined" ? CHECKUP_ITEMS : []).forEach((it) => {
    (it.aliases || []).forEach((a) => {
      const al = a.toLowerCase();
      if (!t.includes(al)) return;
      const isCode = /^[a-z0-9γ-]+$/.test(al);            // ldl/hdl/psa 등 코드 별칭 우선(총콜레스테롤 오매칭 방지)
      const score = al.length + (isCode ? 100 : 0);
      if (!best || score > best.score) best = { it, a, score };
    });
  });
  return best ? best.it : null;
}

/* ── 로그인 회원 '내 검진 결과' 상담 ── */
function memberCheckupCounsel(text, m) {
  if (!m || typeof CHECKUP_ITEMS === "undefined") return null;
  const raw = String(text || "");
  if (/\d{2,}/.test(raw)) return null;                       // 수치 직접 입력 → kbCheckupCounsel 담당
  if (/뭐야|뭔가|정의|이란|란\?|무엇인가/.test(raw)) return null; // 정의 질의 → 교육/질환 KB 담당
  if (/위험|예방|증상|합병증|생활습관|식단|운동|보험|영양제|추천/.test(raw)) return null; // 위험도·예방·증상 등은 타 엔진(리포트/질환KB)
  const chk = genMemberCheckup(m);
  const N = m.name || "회원";
  const it0 = _matchItem(raw);
  const trendQ = /추이|추세|변화|경과|3년|삼년|작년|재작년|나아졌|좋아졌|나빠졌|악화|호전|그대로|어떻게 변|추적/.test(raw);
  const _serLine = (row) => (row && row.series) ? `📈 최근 3년 추이: ${row.series.map((p) => `${p.year} ${p.value}${row.unit}(${p.label})`).join(" → ")} — 「${chk.trendLabel}」` : "";
  const _trendMsg = { improve: "이전보다 좋아지는 흐름이에요. 지금 관리를 계속 유지하세요. 👍", worsen: "이전보다 나빠지는 흐름이에요. 생활습관 교정과 정밀 추적이 필요해요.", stable: "큰 변화 없이 유지되고 있어요. 목표 범위로 개선해 보면 좋겠어요." }[chk.trend];

  // 최근 3년 전체 추이 요약(특정 항목 없이 추이 질의)
  if (trendQ && !it0) {
    const R = chk.report; const fmt = (n) => Number(n).toLocaleString("ko-KR");
    const worst = Object.keys(chk.items).filter((k) => chk.items[k].sev >= 1).slice(0, 3).map((k) => chk.items[k]);
    const lines = [
      `📊 ${N}님 최근 3년 검진 추이 — 전반적으로 「${chk.trendLabel}」 흐름 ${TREND_EMOJI[chk.trend]}`,
      R ? `• 생체나이: ${R.years.map((y, i) => `${y} ${R.bio[i]}세`).join(" → ")} (주민등록 ${R.reg}세)` : null,
      R ? `• 예상 의료비: ${R.years.map((y, i) => `${y} ${fmt(R.cost[i])}원`).join(" → ")}` : null,
      ...worst.map((row) => `• ${row.name}: ${row.series.map((p) => `${p.year} ${p.value}${row.unit}`).join(" → ")} (${row.series[0].label}→${row.series[2].label})`),
      worst.length ? null : "• 주요 항목이 3년간 정상 범위로 잘 유지되고 있어요.",
    ].filter(Boolean);
    const drills = worst.slice(0, 2).map((row) => `내 ${row.name.split("(")[0]} 추이`);
    return {
      bubbles: [
        { kind: "text", text: lines.join("\n") + `\n${_trendMsg}\n📚 근거: ${chk.nat.src} · ${chk.comp.src} · ${typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} (회원 3년 검진데이터 RAG)` },
        { kind: "card", card: { title: `🩺 ${N}님 3년 추이 코칭`, items: [_trendMsg, "항목별 상세 추이는 아래 버튼으로 확인하세요.", chk.trend === "worsen" ? "악화 항목은 관련 보장·건강미션으로 이어드려요." : "개선 흐름을 이어갈 건강미션을 추천해 드려요."], buttons: [...drills, "내 검진 결과 요약"].slice(0, 3) } },
      ],
      quicks: [...drills, "내 생체나이는?", "내 의료비 예측"].filter(Boolean).slice(0, 4),
    };
  }

  // 검진 결과 종합 요약
  if (/검진.*결과.*요약|결과.*요약|검진 요약|내 검진|국가검진 결과|종합검진 결과|검진결과 요약|검진 판정/.test(raw)) {
    const R = (typeof demoReport === "function") ? demoReport(m) : null;
    const abn = chk.comp.abnormals;
    const lines = [
      `📋 ${N}님 검진 결과 요약`,
      `• 국가건강검진 판정: 「${chk.nat.grade}」 — ${chk.nat.gradeDesc}`,
      abn.length ? `• 주의·이상 항목: ${abn.join(" · ")}` : `• 종합검진 주요 항목 모두 정상 범위입니다.`,
      chk.nat.life.length ? `• 생활습관 관리: ${chk.nat.life.join(" · ")}` : null,
      R ? `• 생체나이 ${R.bio}세(주민등록 ${R.reg}세, ${R.diff <= 0 ? R.diff + "세" : "+" + R.diff + "세"}) · 암위험 ${R.cancerTotal}등급(${R.evalLabel})` : null,
      R ? `• 올해 예상 의료비 약 ${Number(R.costThis).toLocaleString("ko-KR")}원` : null,
      `• 최근 3년 진행형태: 「${chk.trendLabel}」 ${TREND_EMOJI[chk.trend]}`,
    ].filter(Boolean);
    const drills = abn.slice(0, 2).map((s) => { const it = _matchItem(s); return it ? `내 ${it.name.split("(")[0]} 결과` : null; }).filter(Boolean);
    return {
      bubbles: [
        { kind: "text", text: lines.join("\n") + `\n📚 근거: ${chk.nat.src} · ${chk.comp.src} · ${typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} (회원 검진데이터 RAG)` },
        { kind: "card", card: { title: `🩺 ${N}님 사후관리 제안`, items: [chk.nat.grade === "유질환자" ? "진단된 만성질환은 정기 추적·복약 관리가 중요해요." : "정기검진 주기를 지키며 생활습관을 관리하세요.", "이상 항목은 아래 버튼으로 항목별 해석을 확인하세요.", "고위험 항목은 관련 건강미션·보장 안내로 이어드려요."], buttons: [...drills, "내 3년 검진 추이"].slice(0, 3) } },
      ],
      quicks: [...drills, "내 3년 검진 추이", "내 의료비 예측"].filter(Boolean).slice(0, 4),
    };
  }

  // 항목별 결과 (결과 단서 필요)
  const it = it0;
  if (!it) return null;
  const cue = trendQ || /결과|판정|수치|어때|어떤가|어떠|괜찮|해석|정상|기준|범위|의미|나왔|나온|어땠|내\s|제\s|나의|본인/.test(raw);
  if (!cue) return null;
  if (it.male && chk.sex === "f") return null;
  const row = chk.items[it.key];
  if (!row || row.value == null) return null;
  const emoji = _chkEmoji(row.sev);
  const interp = row.sev === 0 ? "현재 정상 범위입니다. 잘 유지하고 계세요. 👍" : (it.lowIsBad ? it.lo : it.hi);
  const serLine = _serLine(row);
  const cardItems = [`🎯 관리: ${it.tip}`, `🔗 관련 질환: ${it.dz}`, `🕒 진행형태: ${row.series ? `${row.series[0].label} → ${row.series[2].label}` : ""} (${chk.trendLabel})`];
  if (row.sev >= 1) cardItems.push("관련 건강미션·보장 안내를 이어서 받아보실 수 있어요.");
  const btns = [`${it.dz} 생활습관 관리법은?`];
  if (row.sev >= 1) btns.push(`${it.dz} 대비 보험`); else btns.push("내 검진 결과 요약");
  return {
    bubbles: [
      { kind: "text", text: `${emoji} ${N}님 ${it.name}: ${row.value}${it.unit} → 「${row.label}」 (참고치 ${row.ref})\n${serLine}\n${it.mean}\n${row.sev === 0 ? interp : interp + " " + _trendMsg}\n📚 근거: ${chk.comp.src} · 회원 검진데이터 · 참고치 국민건강보험공단·대한검진의학회` },
      { kind: "card", card: { title: `🩺 ${it.name} 관리 가이드`, items: cardItems, buttons: btns } },
    ],
    quicks: [`${it.dz} 생활습관 관리법은?`, "내 3년 검진 추이", row.sev >= 1 ? `${it.dz} 대비 보험` : "내 검진 결과 요약"].slice(0, 3),
  };
}

/* ── 회원 건강상태 8등급 분류(§6.7) → {grade, meta} ── */
function memberHealthGrade(m) {
  if (!m || typeof genMemberCheckup !== "function") return null;
  const chk = genMemberCheckup(m);
  const items = Object.keys(chk.items).map((k) => chk.items[k]);
  const sev2 = items.filter((r) => r.sev === 2).length;
  const sev1 = items.filter((r) => r.sev === 1).length;
  const HRD = m.highRiskDiseases || [];
  const cancer = m.cancerRiskGrade || 0;
  const sbp = chk.items.sbp ? chk.items.sbp.value : 0, dbp = chk.items.dbp ? chk.items.dbp.value : 0, fbs = chk.items.fbs ? chk.items.fbs.value : 0;
  const emergency = (sbp >= 155 && dbp >= 95) || fbs >= 150 && false; // 극단치만 긴급(데모 보수적)
  let grade;
  if (emergency || sbp >= 158) grade = "긴급";
  else if (cancer >= 7 || sev2 >= 4) grade = "고위험";
  else if (HRD.length && chk.trend === "worsen") grade = "치료중";
  else if (HRD.length) grade = "지속관리";
  else if (sev2 >= 1) grade = "이상";
  else if (sev1 >= 1) grade = "경계";
  else if ((typeof m.obesityAge === "number" && typeof m.regAge === "number" && m.obesityAge > m.regAge + 4) || cancer >= 4) grade = "주의";
  else grade = "정상";
  const meta = (typeof HEALTH_GRADES !== "undefined" && HEALTH_GRADES[grade]) || { c: "#64748B", bg: "#EEF1F8", act: "-", desc: "" };
  return { grade, meta, act: meta.act, desc: meta.desc, sev2, sev1 };
}

/* ── 통합 임상 프로필(§6.4) — 확정진단·복용약·진료필요도·이행상태 ── */
const _MED_BY_DZ = {
  "고혈압": { name: "암로디핀 5mg", dose: "1일 1회", cls: "칼슘채널차단제" },
  "당뇨병": { name: "메트포르민 500mg", dose: "1일 2회", cls: "경구혈당강하제" },
  "고지혈증": { name: "아토르바스타틴 10mg", dose: "1일 1회(저녁)", cls: "스타틴" },
  "이상지질혈증": { name: "로수바스타틴 10mg", dose: "1일 1회", cls: "스타틴" },
  "지방간": { name: "우르소데옥시콜산 200mg", dose: "1일 3회", cls: "간기능 보조" },
  "골다공증": { name: "알렌드로네이트 70mg", dose: "주 1회 + 칼슘·비타민D", cls: "비스포스포네이트" },
  "빈혈": { name: "철분제", dose: "1일 1회", cls: "철분보충" },
  "통풍": { name: "알로퓨리놀 100mg", dose: "1일 1회", cls: "요산저하제" },
  "갑상선": { name: "레보티록신 50mcg", dose: "1일 1회(공복)", cls: "갑상선호르몬" },
};
function memberClinicalProfile(m) {
  if (!m) return null;
  const HRD = m.highRiskDiseases || [];
  const rng = _chkRng(_chkSeed("clin" + (m.id || m.email || m.name)));
  const diagnoses = HRD.map((d, i) => ({ name: d, since: (2026 - (1 + Math.floor(rng() * 6))) + "년 진단" }));
  const meds = [];
  HRD.forEach((d) => { const key = Object.keys(_MED_BY_DZ).find((k) => d.indexOf(k) >= 0); if (key && !meds.some((x) => x.name === _MED_BY_DZ[key].name)) meds.push(_MED_BY_DZ[key]); });
  const G = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null;
  const CARE = { "긴급": "즉시 진료", "고위험": "우선 진료(1~2주 내)", "이상": "진료 권고", "경계": "재검사·생활관리", "치료중": "정기 추적·복약 관리", "지속관리": "정기 모니터링", "주의": "예방관리", "정상": "정기검진" };
  const careNeed = G ? (CARE[G.grade] || "정기검진") : "정기검진";
  const adherence = { med: meds.length ? 70 + Math.floor(rng() * 28) : null, checkupYear: 2026 - Math.floor(rng() * 2), mission: 40 + Math.floor(rng() * 55) };
  return { diagnoses, meds, careNeed, adherence, grade: G ? G.grade : null };
}

/* ── 로그인 회원 '내 건강상태 정밀 분석'(데이터하우스 세부 검진데이터 기반) ── */
function memberDeepAnalysis(text, m) {
  if (!m || typeof genMemberCheckup !== "function") return null;
  const raw = String(text || "");
  if (!/건강\s*상태.*분석|정밀\s*분석|종합\s*분석|건강\s*분석해|내\s*건강.*분석|건강상태\s*분석|상세\s*분석|자세.{0,3}분석|정밀.{0,4}건강|분석해\s*줘|분석해\s*주세요|분석 부탁/.test(raw)) return null;
  const chk = genMemberCheckup(m);
  const R = (typeof demoReport === "function") ? (() => { try { return demoReport(m); } catch (e) { return null; } })() : null;
  const N = m.name || "회원";
  const emoji = ["✅", "⚠️", "🚨"];
  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const shortName = (nm) => nm.split(" (")[0].split("(")[0];
  // 검진 이상항목 상세(위험>주의 순)
  const abn = Object.keys(chk.items).map((k) => chk.items[k]).filter((r) => r.sev >= 1 && r.series).sort((a, b) => b.sev - a.sev || b.series[2].value - a.series[2].value);
  const arrow = (r) => { const a = r.series[0].value, b = r.series[2].value; if (Math.abs(b - a) < Math.abs(a) * 0.02) return "→ 유지"; const worseUp = !(r.item && r.item.lowIsBad); const better = worseUp ? b < a : b > a; return better ? "📉 개선 중" : "📈 악화 중"; };
  const abnItems = abn.slice(0, 7).map((r) => { const p = r.series[2]; return `${emoji[r.sev]} ${r.name} ${p.value}${r.unit} 「${p.label}」 (참고치 ${r.ref}) · 3년 ${arrow(r)}`; });
  // 생체나이·장기
  const organLines = R ? R.organs.map((o) => `${o[0]} ${o[1]}세 ${o[3] ? "✓ 양호" : "▲ 노화 빠름"}`) : [];
  // 질병 위험 상위 + 암
  const dzTop = R ? R.diseases.slice().sort((a, b) => b[1] - a[1]).filter((d) => d[1] > 0).slice(0, 5).map((d) => `${d[0]} 동년배 대비 +${d[1]}% (10년 발생률 ${d[2]})`) : [];
  const cancerHi = R ? R.cancers.filter((c) => c[1] !== "양호").map((c) => `${c[0]} ${c[1]}`) : [];
  // 카테고리별 관리 액션
  const cats = {}; abn.forEach((r) => { const it = r.item; if (it && !cats[it.dz]) cats[it.dz] = it.tip; });
  const actions = Object.keys(cats).slice(0, 5).map((dz) => `${dz} → ${cats[dz]}`);
  const trendMsg = { improve: "최근 3년 전반적으로 개선되는 흐름이에요. 지금 관리를 계속 유지하세요. 👍", worsen: "최근 3년 악화 흐름이에요. 생활습관 교정과 정밀 추적이 필요해요.", stable: "최근 3년 큰 변화 없이 유지 중이에요. 이상 항목은 목표 범위로 개선을 권해요." }[chk.trend];
  const costLine = chk.report ? chk.report.years.map((y, i) => `'${String(y).slice(2)} ${fmt(chk.report.cost[i])}원`).join(" → ") : (R ? fmt(R.costThis) + "원" : "-");

  const G = (typeof memberHealthGrade === "function") ? memberHealthGrade(m) : null;
  const head = `🔬 ${N}님 정밀 건강분석입니다 (데이터하우스 검진데이터 기반)\n` +
    (G ? `• 건강상태 등급 「${G.grade}」 — ${G.act}\n` : "") +
    (R ? `• 생체나이 ${R.bio}세 (주민등록 ${R.reg}세, ${R.diff <= 0 ? R.diff : "+" + R.diff}세) · 종합평가 「${R.evalLabel}」 · 노화속도 ${R.agingSpeed}배\n` : "") +
    `• 국가건강검진 판정 「${chk.nat.grade}」 · 종합검진 이상항목 ${abn.length}건 · 최근 3년 진행형태 「${chk.trendLabel}」`;

  const bubbles = [{ kind: "text", text: head }];
  if (organLines.length) bubbles.push({ kind: "card", card: { title: "🧬 생체나이 · 장기 정밀", items: organLines, buttons: ["내 생체나이는?", "내 3년 검진 추이"] } });
  if (abnItems.length) bubbles.push({ kind: "card", card: { title: `📋 검진 이상항목 상세 (${abn.length}건)`, items: abnItems, buttons: abn.slice(0, 2).map((r) => `내 ${shortName(r.name)} 결과`) } });
  else bubbles.push({ kind: "card", card: { title: "📋 종합검진 결과", items: ["주요 항목이 모두 정상 범위입니다. 잘 유지하고 계세요. 👍"], buttons: ["내 3년 검진 추이"] } });
  const riskItems = dzTop.slice();
  if (cancerHi.length) riskItems.push(`⚠️ 주의 암종: ${cancerHi.slice(0, 4).join(" · ")}`);
  if (R) riskItems.push(`전체 암 발생 위험도 ${R.cancerTotal}등급 (${R.evalLabel})`);
  if (riskItems.length) bubbles.push({ kind: "card", card: { title: "📊 질병 · 암 발생 위험도", items: riskItems, buttons: [dzTop[0] ? `${dzTop[0].split(" ")[0]} 생활습관 관리법은?` : "내가 가장 조심해야 할 암은?", "내가 가장 조심해야 할 암은?"] } });
  const careItems = [`예상 의료비(3년): ${costLine}`].concat(actions.length ? actions : ["현재 뚜렷한 이상 항목이 없어요. 정기검진·생활습관을 유지하세요."]);
  bubbles.push({ kind: "card", card: { title: "🎯 핵심 관리 · 의료비", items: careItems, buttons: ["내 의료비 예측", "맞춤 홈케어 의료기기"] } });
  bubbles.push({ kind: "text", text: `${trendMsg}\n📚 근거: ${chk.nat.src} · ${chk.comp.src} · ${typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} (회원 검진데이터 RAG)\n※ 확정 진단이 아닌 위험 '가능성' 안내이며, 정확한 진단·판단은 의료진 상담이 필요합니다.` });

  const quicks = [abn[0] ? `내 ${shortName(abn[0].name)} 결과` : "내 3년 검진 추이", "내 3년 검진 추이", "내 의료비 예측", "내가 가장 조심해야 할 암은?"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  return { bubbles, quicks };
}

/* ── 검진 이해 교육 상담(회원 불필요) ── */
function checkupEduCounsel(text) {
  if (typeof CHECKUP_EDU === "undefined") return null;
  const t = String(text || "");
  const E = CHECKUP_EDU;
  const cite = (extra) => `\n📚 근거: 종합검진 목적·결과 이해 자료 · 체성분 자료(InBody) · 대한검진의학회${extra ? " · " + extra : ""}`;

  // 종합검진 목적
  if (/종합검진.*(왜|목적|이유|필요)|검진.*(왜 받|왜 해야|목적|필요한 이유)|건강검진.*(왜|목적)/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.purpose.title}\n${E.purpose.body}${cite()}` }, { kind: "card", card: { title: "🩺 정기검진 권장", items: ["국가건강검진: 만 20세 이상 2년마다(비사무직 매년)", "종합검진: 40세 전후부터 생활습관병·암 조기발견 목적", "이상 소견은 권고 주기보다 자주 정밀검진 권장"], buttons: ["체성분이 뭐예요?", "암검진 주기 알려줘"] } }], quicks: ["체성분이 뭐예요?", "생체나이란?", "암 예방 수칙", "내 검진 결과 요약"] };
  }
  // 체성분 / 내장지방 / 부종 / 골격근 / 신체발달 / 기초대사
  if (/체성분|내장지방|부종|골격근|체지방률|신체발달|기초대사|inbody|인바디|복부지방/i.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.body.title}\n${E.body.intro}${cite()}` }, { kind: "card", card: { title: "🧬 체성분 핵심 개념", items: E.body.items, buttons: ["비만 관리법은?", "내 검진 결과 요약"] } }], quicks: ["종합검진 왜 받아요?", "생체나이란?", "비만 생활습관 관리법은?", "내 검진 결과 요약"] };
  }
  // 생체나이
  if (/생체나이란|생체나이.*(뭐|무엇|의미|개념)|노화속도|노화등수/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.bioAge.title}\n${E.bioAge.body}${cite(typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "")}` }, { kind: "card", card: { title: "⏳ 생체나이 구성", items: ["비만체형·심장·간·췌장·신장 나이를 종합", "주민등록나이보다 많으면 노화가 빠른 것", "질병·암 위험도와 의료비 예측의 기준"], buttons: ["내 생체나이는?", "내 검진 결과 요약"] } }], quicks: ["내 생체나이는?", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  // 암예방 수칙
  if (/암\s*예방|암예방|예방\s*수칙|암.*생활수칙|식생활.*원칙|건강.*식습관/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.cancer15.title}${cite()}` }, { kind: "card", card: { title: "🥗 암예방·건강식생활", items: [...E.cancer15.items.slice(0, 8), "─ 건강한 식생활 5원칙 ─", ...E.diet5.items], buttons: ["종합검진 왜 받아요?", "암검진 주기 알려줘"] } }], quicks: ["암검진 주기 알려줘", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  // 암검진 주기
  if (/암검진.*(주기|언제|나이|대상)|위암검진|대장암검진|유방암검진|자궁경부암검진|폐암검진|간암검진|검진.*주기/.test(t) && typeof CANCER_SCREENING !== "undefined") {
    const items = CANCER_SCREENING.map((c) => `${c.name}: ${c.who} · ${c.method} · ${c.cycle}마다`);
    return { bubbles: [{ kind: "text", text: `국가 암검진 대상·주기 안내입니다.${cite()}` }, { kind: "card", card: { title: "🎗️ 국가 암검진 권장", items, buttons: ["종합검진 왜 받아요?", "내 검진 결과 요약"] } }], quicks: ["종합검진 왜 받아요?", "내가 가장 조심해야 할 암은?", "체성분이 뭐예요?"] };
  }
  // 판정 등급 의미
  if (/정상\s*a|정상\s*b|유질환자|질환의심|판정.*(등급|의미|뜻)|정상B가|정상A가/.test(t) && typeof NAT_GRADES !== "undefined") {
    const items = Object.keys(NAT_GRADES).map((k) => `${k}: ${NAT_GRADES[k]}`);
    return { bubbles: [{ kind: "text", text: `국가건강검진 판정 등급의 의미입니다.${cite()}` }, { kind: "card", card: { title: "📊 검진 판정 등급", items, buttons: ["내 검진 결과 요약", "종합검진 왜 받아요?"] } }], quicks: ["내 검진 결과 요약", "종합검진 왜 받아요?"] };
  }
  // 항목 기준(비로그인/일반) — 정의성 항목 질의
  const it = _matchItem(t);
  if (it && /(정상\s*(범위|치|수치|기준)|기준|참고치|의미|뭐|무엇|어떤 검사|이란)/.test(t)) {
    const ref = _refStr(it, /여/.test(t) ? "f" : "m");
    return { bubbles: [{ kind: "text", text: `${it.name} — ${it.mean}\n참고치: ${ref}\n${it.hi || it.lo || ""}${cite()}` }, { kind: "card", card: { title: `🔬 ${it.name}`, items: [`참고치: ${ref}`, `관련 질환: ${it.dz}`, `관리: ${it.tip}`], buttons: ["내 " + it.name.split("(")[0] + " 결과", "종합검진 왜 받아요?"] } }], quicks: ["내 검진 결과 요약", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  return null;
}
