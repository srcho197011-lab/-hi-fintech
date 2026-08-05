/* ══════════════ 내 결핍 처방전 — 검진 수치 → 권장 성분 → 제품 매칭 ══════════════
   설계 원칙(신뢰가 곧 전환율):
   ① 검진 수치 근거가 있는 성분만 '처방전'에 넣는다. 근거 없는 추천은 '일반 관리'로 분리한다.
   ② 보충제가 부적절한 영역(신장·갑상선·종양표지자 이상)은 추천 대신 진료 안내를 앞에 세운다.
   ③ 건강기능식품은 치료제가 아니며, 진단·처방은 하지 않는다(표현 가드).
   ④ 복용 중인 약과의 상호작용, 이미 먹고 있는 성분 중복은 먼저 경고한다 — 과잉 판매를 막는 것이 재구매를 만든다. */

/* 지표 → 권장 성분 매핑 (검진 항목 키는 checkupCatalog 기준) */
const RX_RULES = [
  { keys: ["tg"], ing: "오메가3", why: (v, u) => `중성지방 ${v}${u} — 기준(149 이하)보다 높아요. EPA·DHA는 혈중 중성지방 개선에 도움을 줄 수 있어요.`, prio: 3 },
  { keys: ["ldl", "tc"], ing: "오메가3", why: (v, u, n) => `${n} ${v}${u} — 관리 범위를 넘었어요. 혈행 개선 성분과 식이 조절을 함께 보는 걸 권해요.`, prio: 2 },
  { keys: ["alt", "ast", "ggtp"], ing: "밀크씨슬", why: (v, u, n) => `${n} ${v}${u} — 간 수치가 높아요. 실리마린은 간 건강에 도움을 줄 수 있어요(음주·과로 관리가 먼저예요).`, prio: 3 },
  { keys: ["hb"], ing: "종합비타민", why: (v, u) => `혈색소 ${v}${u} — 기준보다 낮아요. 철·엽산·B12 등 조혈 영양소가 포함된 제품을 고려할 수 있어요.`, prio: 3, lowIsBad: true },
  { keys: ["sbp", "dbp"], ing: "오메가3", why: (v, u, n) => `${n} ${v}${u} — 혈압 관리 구간이에요. 나트륨 조절·유산소 운동이 우선이고, 혈행 관리 성분을 보조로 볼 수 있어요.`, prio: 1 },
  { keys: ["bmi", "waist"], ing: "프로바이오틱스", why: (v, u, n) => `${n} ${v}${u} — 체중·복부비만 관리 구간이에요. 장 건강 관리는 체중 관리의 보조 축이 될 수 있어요.`, prio: 1 },
];
/* 보충제보다 진료가 먼저인 영역 — 추천을 만들지 않는다 */
const RX_MEDICAL_FIRST = {
  egfr: { dept: "신장내과", note: "신장 기능이 떨어진 상태에서는 일부 영양제가 부담이 될 수 있어요 — 제품 추천 대신 진료 상담을 먼저 권해요." },
  cr: { dept: "신장내과", note: "크레아티닌이 높은 구간이에요 — 보충제 복용 전 반드시 의료진과 상의하세요." },
  tsh: { dept: "내분비내과", note: "갑상선 수치 이상은 요오드·특정 성분에 영향을 받을 수 있어요 — 진료 확인이 먼저예요." },
  psa: { dept: "비뇨의학과", note: "종양표지자 이상은 정밀검사가 우선이에요 — 제품 안내는 하지 않아요." },
  cea: { dept: "소화기내과", note: "종양표지자 이상은 정밀검사가 우선이에요 — 제품 안내는 하지 않아요." },
  afp: { dept: "소화기내과", note: "종양표지자 이상은 정밀검사가 우선이에요 — 제품 안내는 하지 않아요." },
  ca199: { dept: "소화기내과", note: "종양표지자 이상은 정밀검사가 우선이에요 — 제품 안내는 하지 않아요." },
  fbs: null, hba1c: null,   // 혈당은 아래 별도 처리(식이·운동 우선 안내)
};
/* 성분별 복용 주의 — 약물 상호작용(안전 우선 표기) */
const RX_CAUTION = {
  "오메가3": "항응고제(와파린 등)를 드시면 출혈 위험이 커질 수 있어 복용 전 의료진과 상의하세요.",
  "밀크씨슬": "간 질환 치료 중이거나 복용약이 많은 경우, 약물 대사에 영향을 줄 수 있어 상의가 필요해요.",
  "종합비타민": "다른 영양제와 성분이 겹칠 수 있어요 — 중복 섭취량을 확인하세요.",
  "프로바이오틱스": "면역억제 치료 중이라면 복용 전 상의가 필요해요.",
};

/* 최신 검진 확인 시점(골든타임 판정용) — 데이터 금고의 마지막 검진 저장 시각 */
function _rxLastCheckupAt(m) {
  try {
    const v = vaultLoad(anonToken(m)); const ck = v && v.checkups && v.checkups[v.checkups.length - 1];
    return ck ? (ck.savedAt || 0) : 0;
  } catch (e) { return 0; }
}

/* 메인 — 검진 결과 기반 처방전 생성 */
function nutriRx(m) {
  if (!m || typeof genMemberCheckup !== "function") return null;
  let chk = null; try { chk = genMemberCheckup(Object.assign({}, m)); } catch (e) { return null; }
  if (!chk || !chk.items) return null;
  const products = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const rows = Object.keys(chk.items).map((k) => Object.assign({ key: k }, chk.items[k]));
  const abn = rows.filter((r) => r.sev >= 1);

  /* ① 진료 우선 영역 — 추천보다 앞에 세운다 */
  const medical = [];
  abn.forEach((r) => {
    const md = RX_MEDICAL_FIRST[r.key];
    if (md) medical.push({ key: r.key, name: (r.item && r.item.name) || r.key, value: r.series ? r.series[2].value : null, unit: r.unit || "", dept: md.dept, note: md.note });
  });
  const medicalKeys = new Set(medical.map((x) => x.key));

  /* ② 혈당 이상 — 식이·운동이 먼저라는 안내만(보충제 우선 추천 금지) */
  const glucose = abn.filter((r) => r.key === "fbs" || r.key === "hba1c").map((r) => ({
    name: (r.item && r.item.name) || r.key, value: r.series ? r.series[2].value : null, unit: r.unit || "",
    note: "혈당 관리는 식사·운동 조절이 우선이에요. 건강기능식품은 보조 수단이며 혈당 강하제를 대신하지 않아요.",
  }));

  /* ③ 근거 있는 성분 처방 */
  const byIng = {};
  RX_RULES.forEach((rule) => {
    rule.keys.forEach((k) => {
      const r = chk.items[k]; if (!r || r.sev < 1 || medicalKeys.has(k)) return;
      const v = r.series ? r.series[2].value : null; if (v == null) return;
      const nm = (r.item && r.item.name) || k;
      const cur = byIng[rule.ing];
      const score = rule.prio * 10 + r.sev * 3;
      const entry = { ing: rule.ing, key: k, name: nm, value: v, unit: r.unit || "", sev: r.sev, why: rule.why(v, r.unit || "", nm), score };
      if (!cur || score > cur.score) byIng[rule.ing] = entry;
    });
  });
  const picks = Object.values(byIng).sort((a, b) => b.score - a.score).slice(0, 4);

  /* ④ 성분 → 제품 매칭(가격·적립 기준 상위 2종) */
  const rx = picks.map((p) => {
    const cands = products.filter((x) => x.category === p.ing).sort((a, b) => a.price - b.price).slice(0, 2);
    return Object.assign({}, p, { products: cands, caution: RX_CAUTION[p.ing] || null });
  }).filter((x) => x.products.length);

  /* ⑤ 중복 경고 — 이미 정기배송·최근 구매한 성분 */
  const owned = new Set();
  try { (typeof subList === "function" ? subList(m) : []).filter((s) => s.status !== "canceled").forEach((s) => owned.add(s.category)); } catch (e) {}
  try { (typeof subOrders === "function" ? subOrders(m) : []).slice(-10).forEach((o) => owned.add(o.category)); } catch (e) {}
  const dup = rx.filter((x) => owned.has(x.ing)).map((x) => x.ing);

  /* ⑥ 골든타임 — 검진 결과 연계 후 7일 이내면 전환이 가장 잘 되는 구간 */
  const lastAt = _rxLastCheckupAt(m);
  const daysSince = lastAt ? Math.floor((Date.now() - lastAt) / 86400000) : null;
  const golden = daysSince != null && daysSince <= 7;

  return {
    asOf: chk.year || null, grade: chk.nat && chk.nat.grade,
    abnormalN: abn.length, rx, medical, glucose, dup, golden, daysSince,
    general: rx.length ? [] : ["지금 검진 수치에서는 특별히 보충이 필요한 항목이 보이지 않아요 — 무리한 추가 섭취보다 현재 관리를 유지하는 편이 좋아요."],
  };
}
/* 처방전 요약 한 줄(하이·배너용) */
function nutriRxLine(m) {
  const R = nutriRx(m); if (!R) return null;
  if (R.medical.length) return `${R.medical[0].name} 이상이 있어 제품보다 ${R.medical[0].dept} 상담을 먼저 권해요.`;
  if (!R.rx.length) return "지금은 보충이 필요한 항목이 보이지 않아요 — 현재 관리를 유지하세요.";
  const top = R.rx[0];
  return `${top.name} ${top.value}${top.unit} 기준으로 ${top.ing}부터 보는 걸 권해요.`;
}
