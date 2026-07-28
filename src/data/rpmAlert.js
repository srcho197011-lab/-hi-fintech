/* ══════════════ RPM 경보 단일 소스 — 원격 모니터링 이상신호 (Phase D 연계) ══════════════
   '새벽 2시 17분' 장면을 화면 하나에 가둬두지 않는다.
   가정용 기기가 잡은 이상 신호는 **가족케어 화면과 하이(A4)가 같은 것을 보고 같은 판단을 해야** 한다.
   그래서 경보 상태를 이 파일 하나로 모으고, 화면과 에이전트가 모두 여기서 읽는다.

   ⚠️ 의료 경계 — 여기서 하는 일은 **판정이 아니라 트리아지**다.
   "고혈압입니다"라고 말하지 않는다. "이 수치면 지금 의료진이 봐야 한다"까지만 말한다.
   기준선은 널리 쓰이는 **행동 기준**(수축기 180 / 이완기 120 이상 = 즉시 진료)을 쓰고, 진단은 하지 않는다. */

const RPM_THRESH = {
  crisis: { sys: 180, dia: 120 },   /* 즉시 진료 — 지체하면 안 되는 구간 */
  high: { sys: 160, dia: 100 },     /* 오늘 안에 진료 상담 */
  riseSys: 15,                       /* 3일 새 수축기 상승 폭(추세 경보) */
  nightHour: [0, 5],                 /* 이 시간대 급등은 따로 본다(수면 중 상승은 위험 신호) */
};

/* 데모 시나리오 — 사업계획서의 '새벽 2시 17분' 장면. 실기기 연동 시 이 배열이 측정값으로 교체된다. */
const RPM_DEMO_SERIES = [
  { day: "7/17", label: "7/17", sys: 132, dia: 84, night: false },
  { day: "7/18", label: "7/18", sys: 141, dia: 88, night: false },
  { day: "7/19", label: "새벽 2:17", sys: 152, dia: 94, night: true },
];

function rpmAckKey(email) { return "hifin_rpm_ack_" + (email || "default"); }
function rpmAcked(email) { try { return !!JSON.parse(localStorage.getItem(rpmAckKey(email)) || "false"); } catch (e) { return false; } }
function rpmAck(email, on) { try { localStorage.setItem(rpmAckKey(email), JSON.stringify(on ? 1 : 0)); } catch (e) {} }

/* 측정 계열 → 트리아지 수준. 말이 아니라 **데이터로** 위험을 읽는 경로다. */
function rpmTriage(series) {
  if (!Array.isArray(series) || !series.length) return null;
  const last = series[series.length - 1];
  const first = series[0];
  const reasons = [];
  let level = null;
  if (last.sys >= RPM_THRESH.crisis.sys || last.dia >= RPM_THRESH.crisis.dia) {
    level = "critical"; reasons.push(`최근 측정 ${last.sys}/${last.dia} — 즉시 진료가 필요한 구간이에요`);
  } else if (last.sys >= RPM_THRESH.high.sys || last.dia >= RPM_THRESH.high.dia) {
    level = "urgent"; reasons.push(`최근 측정 ${last.sys}/${last.dia} — 오늘 안에 의료진이 보셔야 해요`);
  }
  const rise = last.sys - first.sys;
  if (rise >= RPM_THRESH.riseSys) {
    reasons.push(`${series.length}일 새 수축기가 ${first.sys}에서 ${last.sys}로 ${rise} 올랐어요`);
    if (!level) level = "urgent";
  }
  if (last.night) {
    reasons.push("새벽 시간대 급등이라 그냥 지나치기 어려워요");
    if (!level) level = "urgent";
  }
  if (!level) return null;
  return { level: level, reasons: reasons, latest: last, first: first, rise: rise };
}

/* 회원의 현재 경보 — 해제했으면 없는 것으로 본다(단, 수치가 crisis면 해제해도 다시 띄운다) */
function rpmState(email, family) {
  try {
    const fam = Array.isArray(family) ? family : [];
    const elder = fam.find(function (x) {
      const a = Number(x.age) || 0;
      return a >= 65 || /부모|조부모|모|부$/.test(String(x.relation || ""));
    });
    if (!elder) return null;
    const series = RPM_DEMO_SERIES;
    const tri = rpmTriage(series);
    if (!tri) return null;
    const acked = rpmAcked(email);
    /* 해제 버튼이 위험을 지우지는 못한다 — crisis는 다시 올린다 */
    if (acked && tri.level !== "critical") return null;
    return { elder: elder, series: series, level: tri.level, reasons: tri.reasons, latest: tri.latest, rise: tri.rise, acked: acked };
  } catch (e) { return null; }
}

/* 원격진료 예진 요약 — 의사 화면에 먼저 가는 한 줄(가족케어·A4가 같은 문장을 쓴다) */
function rpmTeleSummary(st) {
  if (!st) return "";
  const s = st.series.map(function (p) { return p.sys + "/" + p.dia; }).join("→");
  /* 라벨에 이미 '새벽'이 들어 있으면 또 붙이지 않는다("새벽 2:17 새벽 급등") */
  const night = st.latest.night && String(st.latest.label).indexOf("새벽") < 0 ? "새벽 " : "";
  return `${st.elder.relation} ${st.elder.name}님 혈압 ${st.series.length}일 추이 ${s} · ${st.latest.label} ${night}급등(RPM 자동 감지)`;
}

try { if (typeof window !== "undefined") { window.__hifinRpm = { state: rpmState, triage: rpmTriage, ack: rpmAck, acked: rpmAcked, summary: rpmTeleSummary, thresh: RPM_THRESH }; } } catch (e) {}
