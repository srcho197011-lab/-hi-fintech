/* ══════════════ RPM 경보 단일 소스 — 원격 모니터링 이상신호 (Phase D 연계) ══════════════
   '새벽 2시 17분' 장면을 화면 하나에 가둬두지 않는다.
   가정용 기기가 잡은 이상 신호는 **가족케어 화면과 하이(A4)가 같은 것을 보고 같은 판단을 해야** 한다.
   그래서 경보 상태를 이 파일 하나로 모으고, 화면과 에이전트가 모두 여기서 읽는다.

   ⚠️ 의료 경계 — 여기서 하는 일은 **판정이 아니라 트리아지**다.
   "고혈압입니다"라고 말하지 않는다. "이 수치면 지금 의료진이 봐야 한다"까지만 말한다.
   기준선은 널리 쓰이는 **행동 기준**을 쓰고, 진단은 하지 않는다.

   ⚙️ 지표를 늘릴 때는 코드가 아니라 **RPM_METRICS에 항목 하나**를 더한다.
   각 지표는 { key, label, unit, fmt, series, evaluate }만 채우면 트리아지·화면·에이전트에 자동으로 얹힌다. */

/* ── 지표별 행동 기준 — 진단 기준이 아니라 '언제 사람을 부를 것인가'의 선 ── */
const RPM_THRESH = {
  bp: {
    crisis: { sys: 180, dia: 120 },   /* 즉시 진료 — **잠금**: 화면에서 못 바꾼다 */
    high: { sys: 160, dia: 100 },     /* 오늘 안에 진료 — 관찰 임계는 운영 설정으로 조정 가능 */
    riseSys: 15,                       /* 3일 새 수축기 상승 폭(추세 경보) */
  },
  glucose: {
    lowCrisis: 54,                     /* 중증 저혈당 — 즉시 조치 */
    low: 70,                           /* 저혈당 */
    high: 300,                         /* 고혈당 */
    highCrisis: 400,                   /* 즉시 진료 */
  },
  spo2: {
    crisis: 90,                        /* 90% 미만 — 즉시 */
    low: 94,                           /* 94% 미만 — 오늘 안에 */
    drop: 4,                           /* 최근 하락 폭 */
  },
  fall: {
    /* 낙상은 수치가 아니라 사건이다. '응답 없음'이 갈림길. */
    noResponseMin: 5,                  /* 감지 후 이 시간(분) 넘게 응답 없으면 즉시 */
  },
};

/* ── 지표 레지스트리 ──
   evaluate(series) → { level, reasons[] } | null
   series의 각 점은 { label, night?, ...지표별 필드 } */
const RPM_METRICS = [
  {
    key: "bp", label: "혈압", unit: "mmHg", icon: "🩸",
    fmt: function (p) { return p.sys + "/" + p.dia; },
    evaluate: function (s) {
      /* crisis는 코드 상수 그대로(잠금), high만 운영 설정을 따른다 */
      const _o = (k, d) => { try { return (typeof opsGet === "function") ? opsGet(k) : d; } catch (e) { return d; } };
      const T = { crisis: RPM_THRESH.bp.crisis, riseSys: RPM_THRESH.bp.riseSys,
        high: { sys: _o("rpmHighSys", RPM_THRESH.bp.high.sys), dia: _o("rpmHighDia", RPM_THRESH.bp.high.dia) } };
      const last = s[s.length - 1], first = s[0];
      const reasons = []; let level = null;
      if (last.sys >= T.crisis.sys || last.dia >= T.crisis.dia) {
        level = "critical"; reasons.push(`최근 측정 ${last.sys}/${last.dia} — 즉시 진료가 필요한 구간이에요`);
      } else if (last.sys >= T.high.sys || last.dia >= T.high.dia) {
        level = "urgent"; reasons.push(`최근 측정 ${last.sys}/${last.dia} — 오늘 안에 의료진이 보셔야 해요`);
      }
      const rise = last.sys - first.sys;
      if (rise >= T.riseSys) { reasons.push(`${s.length}일 새 수축기가 ${first.sys}에서 ${last.sys}로 ${rise} 올랐어요`); if (!level) level = "urgent"; }
      if (last.night) { reasons.push("새벽 시간대 급등이라 그냥 지나치기 어려워요"); if (!level) level = "urgent"; }
      return level ? { level: level, reasons: reasons } : null;
    },
  },
  {
    key: "glucose", label: "혈당", unit: "mg/dL", icon: "🍬",
    fmt: function (p) { return p.mgdl + (p.fasting ? "(공복)" : ""); },
    evaluate: function (s) {
      const T = RPM_THRESH.glucose, last = s[s.length - 1];
      const reasons = []; let level = null;
      if (last.mgdl < T.lowCrisis) {
        level = "critical"; reasons.push(`최근 혈당 ${last.mgdl} — 중증 저혈당 구간이에요. 의식이 있으시면 당분을 바로 드시게 하고 119에 연락해 주세요`);
      } else if (last.mgdl >= T.highCrisis) {
        level = "critical"; reasons.push(`최근 혈당 ${last.mgdl} — 즉시 진료가 필요한 구간이에요`);
      } else if (last.mgdl < T.low) {
        level = "urgent"; reasons.push(`최근 혈당 ${last.mgdl} — 저혈당이에요. 당분 섭취 후에도 회복되지 않으면 바로 진료가 필요해요`);
      } else if (last.mgdl >= T.high) {
        level = "urgent"; reasons.push(`최근 혈당 ${last.mgdl} — 오늘 안에 의료진이 보셔야 해요`);
      }
      /* 반복되는 저혈당은 한 번보다 위험하다 — 특히 새벽 저혈당 */
      const lows = s.filter(function (p) { return p.mgdl < T.low; }).length;
      if (lows >= 2) { reasons.push(`최근 ${s.length}회 중 ${lows}회가 저혈당이었어요 — 약 용량을 의료진과 점검하셔야 해요`); if (!level) level = "urgent"; }
      if (level && last.night) reasons.push("새벽 시간대라 곁에서 확인해 주실 분이 필요해요");
      return level ? { level: level, reasons: reasons } : null;
    },
  },
  {
    key: "spo2", label: "산소포화도", unit: "%", icon: "🫁",
    fmt: function (p) { return p.pct + "%"; },
    evaluate: function (s) {
      const T = RPM_THRESH.spo2, last = s[s.length - 1], first = s[0];
      const reasons = []; let level = null;
      if (last.pct < T.crisis) {
        level = "critical"; reasons.push(`최근 산소포화도 ${last.pct}% — 즉시 도움이 필요한 구간이에요`);
      } else if (last.pct < T.low) {
        level = "urgent"; reasons.push(`최근 산소포화도 ${last.pct}% — 오늘 안에 의료진이 보셔야 해요`);
      }
      const drop = first.pct - last.pct;
      if (drop >= T.drop) { reasons.push(`${s.length}회 새 ${first.pct}%에서 ${last.pct}%로 ${drop}%p 떨어졌어요`); if (!level) level = "urgent"; }
      return level ? { level: level, reasons: reasons } : null;
    },
  },
  {
    key: "fall", label: "낙상 감지", unit: "", icon: "⚠️",
    fmt: function (p) { return p.detected ? (p.responded ? "감지·응답함" : "감지·응답 없음") : "이상 없음"; },
    evaluate: function (s) {
      const T = RPM_THRESH.fall, last = s[s.length - 1];
      if (!last.detected) return null;
      const reasons = [];
      /* 낙상은 수치가 아니라 사건이다 — 응답이 없으면 그 자체가 최상위 신호 */
      if (!last.responded && (last.minutes || 0) >= T.noResponseMin) {
        reasons.push(`낙상이 감지되고 ${last.minutes}분째 응답이 없어요 — 지금 바로 확인이 필요해요`);
        return { level: "critical", reasons: reasons };
      }
      if (!last.responded) { reasons.push("낙상이 감지됐는데 아직 응답이 확인되지 않았어요"); return { level: "critical", reasons: reasons }; }
      reasons.push(`${last.label}에 낙상이 감지됐어요 — 겉으로 괜찮아 보여도 머리를 부딪히셨다면 진료가 필요해요`);
      if (last.repeat) reasons.push("최근 반복된 낙상이라 원인을 찾아보셔야 해요(약·어지럼·주거 환경)");
      return { level: "urgent", reasons: reasons };
    },
  },
];

/* ── 데모 계열 — 사업계획서의 '새벽 2시 17분' 장면.
   실기기 연동 시 이 값들이 측정값으로 교체된다(판정 로직은 그대로).
   혈압만 경보가 걸리고 나머지는 정상 — 모든 지표가 한꺼번에 울리는 상황은 현실적이지 않다. */
const RPM_DEMO = {
  bp: [
    { label: "7/17", sys: 132, dia: 84 },
    { label: "7/18", sys: 141, dia: 88 },
    { label: "새벽 2:17", sys: 152, dia: 94, night: true },
  ],
  glucose: [
    { label: "7/17", mgdl: 112, fasting: true },
    { label: "7/18", mgdl: 108, fasting: true },
    { label: "7/19", mgdl: 118, fasting: true },
  ],
  spo2: [
    { label: "7/17", pct: 97 },
    { label: "7/18", pct: 96 },
    { label: "7/19", pct: 97 },
  ],
  fall: [
    { label: "7/19", detected: false },
  ],
};

function rpmAckKey(email) { return "hifin_rpm_ack_" + (email || "default"); }
function rpmAcked(email) { try { return !!JSON.parse(localStorage.getItem(rpmAckKey(email)) || "false"); } catch (e) { return false; } }
function rpmAck(email, on) { try { localStorage.setItem(rpmAckKey(email), JSON.stringify(on ? 1 : 0)); } catch (e) {} }

function rpmMetric(key) { for (const m of RPM_METRICS) { if (m.key === key) return m; } return null; }
const RPM_RANK = { critical: 2, urgent: 1 };

/* 측정 계열 → 트리아지. 말이 아니라 **데이터로** 위험을 읽는 경로다.
   data: { bp:[...], glucose:[...], ... } — 없는 지표는 건너뛴다(기기가 없으면 경보도 없다). */
function rpmTriage(data) {
  if (!data) return null;
  /* 예전 호출 형태(계열 배열 하나 = 혈압) 호환 */
  const src = Array.isArray(data) ? { bp: data } : data;
  const alerts = [];
  for (const m of RPM_METRICS) {
    const s = src[m.key];
    if (!Array.isArray(s) || !s.length) continue;
    let r = null;
    try { r = m.evaluate(s); } catch (e) { r = null; }
    if (!r) continue;
    alerts.push({ metric: m.key, label: m.label, icon: m.icon, unit: m.unit, series: s,
      latest: s[s.length - 1], level: r.level, reasons: r.reasons,
      text: s.map(function (p) { return m.fmt(p); }).join(" → ") });
  }
  if (!alerts.length) return null;
  alerts.sort(function (a, b) { return (RPM_RANK[b.level] || 0) - (RPM_RANK[a.level] || 0); });
  const primary = alerts[0];
  return {
    level: primary.level, alerts: alerts, primary: primary,
    reasons: alerts.reduce(function (acc, a) { return acc.concat(a.reasons); }, []),
  };
}

/* 회원의 현재 경보 — 해제했으면 없는 것으로 본다(단, critical이면 해제해도 다시 띄운다) */
function rpmState(email, family, dataOverride) {
  try {
    const fam = Array.isArray(family) ? family : [];
    const elder = fam.find(function (x) {
      const a = Number(x.age) || 0;
      return a >= 65 || /부모|조부모|모|부$/.test(String(x.relation || ""));
    });
    if (!elder) return null;
    const data = dataOverride || RPM_DEMO;
    const tri = rpmTriage(data);
    if (!tri) return null;
    const acked = rpmAcked(email);
    /* 해제 버튼이 위험을 지우지는 못한다 — critical은 다시 올린다 */
    if (acked && tri.level !== "critical") return null;
    return { elder: elder, level: tri.level, alerts: tri.alerts, primary: tri.primary,
      reasons: tri.reasons, data: data, acked: acked,
      series: tri.primary.series, latest: tri.primary.latest };
  } catch (e) { return null; }
}

/* 감시 중이지만 조용한 지표 — "지켜보고 있다"를 보여주는 것도 안심의 일부다 */
function rpmQuiet(st) {
  if (!st) return [];
  const firing = st.alerts.map(function (a) { return a.metric; });
  const out = [];
  for (const m of RPM_METRICS) {
    const s = st.data[m.key];
    if (!Array.isArray(s) || !s.length || firing.indexOf(m.key) >= 0) continue;
    out.push({ metric: m.key, label: m.label, icon: m.icon, latest: m.fmt(s[s.length - 1]) });
  }
  return out;
}

/* 원격진료 예진 요약 — 의사 화면에 먼저 가는 한 줄(가족케어·A4가 같은 문장을 쓴다) */
function rpmTeleSummary(st) {
  if (!st) return "";
  const parts = st.alerts.map(function (a) {
    /* 라벨에 이미 '새벽'이 들어 있으면 또 붙이지 않는다("새벽 2:17 새벽 급등") */
    const night = a.latest.night && String(a.latest.label).indexOf("새벽") < 0 ? "새벽 " : "";
    return `${a.label} ${a.series.length}회 추이 ${a.text} · ${a.latest.label} ${night}이상(RPM 자동 감지)`;
  });
  return `${st.elder.relation} ${st.elder.name}님 — ` + parts.join(" / ");
}

try { if (typeof window !== "undefined") { window.__hifinRpm = { state: rpmState, triage: rpmTriage, ack: rpmAck, acked: rpmAcked, summary: rpmTeleSummary, quiet: rpmQuiet, metrics: RPM_METRICS, thresh: RPM_THRESH, demo: RPM_DEMO }; } } catch (e) {}
