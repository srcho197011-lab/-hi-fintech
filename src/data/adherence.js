/* ══════════════ 복용 순응 · 성과 증명 — 재구매 명분과 4세대 자산의 원천 ══════════════
   설계: 영양제는 '샀는가'가 아니라 '먹었는가'가 결과를 만든다. 복용을 기록하면 ①회원은 효과를 눈으로 보고
   ②재구매 이유가 설득 없이 생기며 ③그 기록이 4세대 성과 자산(RWE)이 되어 브랜드 실증 인증·요율 재정립으로 환류된다.
   정직성 원칙: 수치 변화를 제품의 효과로 단정하지 않는다 — '함께 기록된 변화'로만 표기한다. */

function _adhKey(m) { return "hifin_adh_" + ((m && m.email) || "self"); }
function adhLoad(m) { try { return JSON.parse(localStorage.getItem(_adhKey(m)) || "{}"); } catch (e) { return {}; } }
function _adhSave(m, o) { try { localStorage.setItem(_adhKey(m), JSON.stringify(o)); } catch (e) {} }
function _adhDay(ts) { const d = new Date(ts || Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

/* 오늘 복용할 목록 — 정기배송 중인 제품 + 최근 60일 내 주문분(구독 미등록분) */
function adhToday(m) {
  if (!m) return [];
  const out = [], seen = new Set();
  try {
    (typeof subList === "function" ? subList(m) : []).filter((s) => s.status === "active").forEach((s) => {
      if (seen.has(s.pid)) return; seen.add(s.pid);
      out.push({ pid: s.pid, name: s.name, category: s.category, since: s.startAt, from: "sub" });
    });
  } catch (e) {}
  try {
    const now = Date.now();
    [...(typeof subOrders === "function" ? subOrders(m) : [])].reverse().forEach((o) => {
      if (seen.has(o.pid) || now - o.at > 60 * 86400000) return; seen.add(o.pid);
      out.push({ pid: o.pid, name: o.name, category: o.category, since: o.at, from: "order" });
    });
  } catch (e) {}
  const log = adhLoad(m); const today = _adhDay();
  return out.map((x) => Object.assign(x, { checked: !!((log[x.pid] || {})[today]) }));
}
/* 오늘 복용 체크(토글) */
function adhCheck(m, pid) {
  if (!m || !pid) return null;
  const log = adhLoad(m); const today = _adhDay();
  const rec = log[pid] || {};
  if (rec[today]) delete rec[today]; else rec[today] = Date.now();
  log[pid] = rec; _adhSave(m, log);
  return !!rec[today];
}
/* 제품별 순응 통계 — 복용일수·연속일수·순응률(시작일 대비) */
function adhStats(m, pid, since) {
  const rec = (adhLoad(m)[pid]) || {};
  const days = Object.keys(rec).sort();
  const total = days.length;
  const start = since || (days.length ? new Date(days[0]).getTime() : Date.now());
  const elapsed = Math.max(1, Math.round((Date.now() - start) / 86400000) + 1);
  const rate = Math.min(100, Math.round((total / elapsed) * 100));
  /* 연속 복용일 — 오늘(또는 어제)부터 역순으로 이어진 날 수 */
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = _adhDay(Date.now() - i * 86400000);
    if (rec[d]) streak++;
    else if (i > 0) break;   // 오늘 미체크는 허용(어제까지 연속 인정)
  }
  return { total, elapsed, rate, streak, startAt: start };
}
/* 전체 순응 요약 */
function adhSummary(m) {
  const list = adhToday(m);
  if (!list.length) return { items: [], avgRate: 0, totalDays: 0, checkedToday: 0 };
  const items = list.map((x) => Object.assign({}, x, adhStats(m, x.pid, x.since)));
  const avgRate = Math.round(items.reduce((s, x) => s + x.rate, 0) / items.length);
  return { items, avgRate, totalDays: items.reduce((s, x) => s + x.total, 0), checkedToday: items.filter((x) => x.checked).length };
}

/* ── 성과 카드 — 복용 성분이 겨냥한 검진 지표의 '함께 기록된 변화' ── */
const ADH_TARGET = {   // 성분 → 관찰 지표(권장 근거와 동일 매핑: nutriRx RX_RULES와 정합)
  "밀크씨슬": ["alt", "ast", "ggtp"],
  "오메가3": ["tg", "ldl", "tc"],
  "종합비타민": ["hb"],
  "프로바이오틱스": ["bmi", "waist"],
};
function adhOutcome(m) {
  if (!m || typeof genMemberCheckup !== "function") return null;
  let chk = null; try { chk = genMemberCheckup(Object.assign({}, m)); } catch (e) { return null; }
  if (!chk || !chk.items) return null;
  const S = adhSummary(m);
  const rows = [];
  S.items.forEach((it) => {
    const keys = ADH_TARGET[it.category] || [];
    keys.forEach((k) => {
      const r = chk.items[k]; if (!r || !r.series || r.series.length < 2) return;
      const prev = r.series[r.series.length - 2], now = r.series[r.series.length - 1];
      if (prev.value == null || now.value == null) return;
      const lowIsBad = !!(r.item && r.item.lowIsBad);
      const diff = now.value - prev.value;
      const better = lowIsBad ? diff > 0 : diff < 0;
      rows.push({
        pid: it.pid, product: it.name, ing: it.category, days: it.total, rate: it.rate, streak: it.streak,
        key: k, name: (r.item && r.item.name) || k, unit: r.unit || "",
        from: prev.value, to: now.value, fromYear: prev.year, toYear: now.year,
        better, diff: Math.round(Math.abs(diff) * 10) / 10, sev: now.sev,
      });
    });
  });
  /* 제품당 대표 지표 1개(변화폭이 큰 것) */
  const byProduct = {};
  rows.forEach((r) => { const c = byProduct[r.pid]; if (!c || r.diff > c.diff) byProduct[r.pid] = r; });
  const list = Object.values(byProduct).sort((a, b) => (b.better - a.better) || (b.diff - a.diff));
  return { rows: list, summary: S, improved: list.filter((x) => x.better).length };
}
/* 4세대 성과 자산 편입 — 회원이 동의(버튼)한 경우에만 기록 */
function adhCommitOutcome(m, row) {
  if (!m || !row) return null;
  try {
    const tk = anonToken(m);
    const k = "hifin_g4_" + tk;
    let l = []; try { l = JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) {}
    const rec = { at: Date.now(), kind: "supplement-outcome", ing: row.ing, product: row.product,
      metric: row.key, from: row.from, to: row.to, days: row.days, rate: row.rate };
    l.push(rec); localStorage.setItem(k, JSON.stringify(l.slice(-40)));
    chainAppend({ type: "record", token: tk, note: `4세대 성과 자산 편입 — ${row.ing} ${row.days}일 복용 · ${row.name} ${row.from}→${row.to}${row.unit}` });
    vaultAccessLog(tk, "member", `성과 자산 편입(${row.ing} · ${row.name})`);
    return rec;
  } catch (e) { return null; }
}
/* 하이·배너용 한 줄 요약 */
function adhLine(m) {
  const O = adhOutcome(m); if (!O || !O.summary.items.length) return null;
  const S = O.summary;
  if (!O.rows.length) return `복용 기록 ${S.totalDays}일 · 평균 순응률 ${S.avgRate}% — 다음 검진에서 변화를 함께 확인해요.`;
  const r = O.rows[0];
  return `${r.ing} ${r.days}일 복용 · ${r.name} ${r.from}→${r.to}${r.unit}${r.better ? " (개선 방향)" : ""}`;
}
