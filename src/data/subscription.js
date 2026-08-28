/* ══════════════ 정기배송(구독) 엔진 — 소진 예측·자동 재배송·순응 리마인드 ══════════════
   설계 배경: 영양제·건강식품 매출은 신규 획득이 아니라 '끊기지 않게 하는 것'에서 나온다.
   ① 구매 시 복용 주기로 소진일 자동 계산 → ② 소진 D-7 선제 안내 → ③ 정기배송 전환 → ④ 스킵·일시정지로 이탈 방지.
   원칙: 회원 화면에 원가·마진 비노출(적립금만 표기) · 자동 결제는 회원 확인 2단계 · 언제든 해지 가능(위약 없음). */

/* ── 회분(총 섭취 횟수) 파싱: "50포"·"60캡슐"·"600정"·"100g"(serving.total 기준) ── */
function subServings(p) {
  try {
    if (p && p.serving && p.serving.total) return Math.max(1, Math.round(p.serving.total));
    const v = String((p && p.volume) || "");
    const m = v.match(/(\d[\d,]*)\s*(포|캡슐|정|스틱|병|개|매|팩)/);
    if (m) return Math.max(1, parseInt(m[1].replace(/,/g, ""), 10));
    const g = v.match(/(\d[\d,]*)\s*(g|ml|mL)/);
    if (g) return Math.max(1, parseInt(g[1].replace(/,/g, ""), 10));
  } catch (e) {}
  return 30;
}
/* 1일 섭취량 — 라벨(serving.perDay) 우선, 없으면 카테고리 기본값 */
const SUB_PERDAY_DEFAULT = { "프로바이오틱스": 1, "홍삼": 1, "비타민C": 1, "종합비타민": 1, "오메가3": 1, "루테인": 1, "밀크씨슬": 1, "마그네슘": 1, "비타민D": 1, "콜라겐": 1, "아연": 1 };
function subPerDay(p) {
  try { if (p && p.serving && p.serving.perDay) return Math.max(0.5, p.serving.perDay); } catch (e) {}
  return (p && SUB_PERDAY_DEFAULT[p.category]) || 1;
}
/* 소진 예상 일수 — 총 회분 ÷ 1일 섭취량 (상한 180일: 대용량 제품의 비현실적 주기 방지) */
function subDays(p, qty) {
  const n = subServings(p) * Math.max(1, qty || 1);
  const d = Math.round(n / subPerDay(p));
  return Math.max(7, Math.min(180, d));
}
/* 권장 배송 주기(일) — 소진일에 맞춘 30·60·90일 중 선택지 */
function subCycleOptions(p, qty) {
  const d = subDays(p, qty);
  const base = d <= 35 ? 30 : d <= 70 ? 60 : 90;
  return { recommend: base, options: [30, 60, 90], estDays: d };
}

/* ── 구독 원장(회원별) ── */
function _subKey(m) { return "hifin_subs_" + ((m && m.email) || "self"); }
function subList(m) { try { return JSON.parse(localStorage.getItem(_subKey(m)) || "[]"); } catch (e) { return []; } }
function _subSave(m, l) { try { localStorage.setItem(_subKey(m), JSON.stringify(l.slice(-40))); } catch (e) {} }
const DAY = 86400000;
function _fmtD(ts) { try { const d = new Date(ts); return `${d.getMonth() + 1}월 ${d.getDate()}일`; } catch (e) { return ""; } }

/* 구독 생성 — 상품·수량·주기(일). 첫 배송은 즉시(주문분), 다음 배송은 주기 후 */
function subCreate(m, p, qty, cycle) {
  if (!m || !p) return null;
  const q = Math.max(1, qty || 1);
  const cyc = cycle || subCycleOptions(p, q).recommend;
  const l = subList(m);
  const exist = l.find((s) => s.pid === p.id && s.status !== "canceled");
  if (exist) { exist.qty = q; exist.cycle = cyc; exist.status = "active"; _subSave(m, l); try { if (typeof hiEvent === "function") hiEvent("sub_registered", { kind: "renew" }); } catch (e) {} return exist; }
  const now = Date.now();
  const s = {
    id: "SUB-" + now.toString(36).toUpperCase(), pid: p.id, name: p.name, brand: p.brand, category: p.category,
    price: p.price, qty: q, cycle: cyc, estDays: subDays(p, q),
    startAt: now, lastShipAt: now, nextShipAt: now + cyc * DAY, runOutAt: now + subDays(p, q) * DAY,
    shipped: 1, skipped: 0, status: "active",
    history: [{ at: now, ev: `정기배송 시작 — ${cyc}일마다 · 1회차 발송` }],
  };
  l.push(s); _subSave(m, l);
  try { if (typeof hiEvent === "function") hiEvent("sub_registered", { kind: "new" }); } catch (e) {}
  try { vaultAccessLog(anonToken(m), "member", `정기배송 등록(${p.name} · ${cyc}일 주기)`); } catch (e) {}
  try { if (typeof notifPush === "function") notifPush(m, { t: "정기배송이 시작됐어요", d: `${p.name} · ${cyc}일마다 배송 · 다음 ${_fmtD(s.nextShipAt)} · 언제든 건너뛰기·해지 가능`, k: "shop" }); } catch (e) {}
  return s;
}
function _subFind(m, id) { const l = subList(m); return { l, s: l.find((x) => x.id === id) }; }
function subUpdate(m, id, patch, ev) {
  const { l, s } = _subFind(m, id); if (!s) return null;
  Object.assign(s, patch); (s.history = s.history || []).push({ at: Date.now(), ev });
  _subSave(m, l); return s;
}
/* 이번 회차 건너뛰기 — 이탈 대신 '쉬어가기'(해지 방어의 핵심 장치) */
function subSkip(m, id) {
  const { s } = _subFind(m, id); if (!s) return null;
  return subUpdate(m, id, { nextShipAt: s.nextShipAt + s.cycle * DAY, skipped: (s.skipped || 0) + 1 }, `이번 회차 건너뛰기 — 다음 ${_fmtD(s.nextShipAt + s.cycle * DAY)}`);
}
function subPause(m, id) { return subUpdate(m, id, { status: "paused" }, "일시정지 — 재개 전까지 발송 없음"); }
function subResume(m, id) {
  const { s } = _subFind(m, id); if (!s) return null;
  const next = Math.max(Date.now() + 3 * DAY, s.nextShipAt);
  return subUpdate(m, id, { status: "active", nextShipAt: next }, `재개 — 다음 ${_fmtD(next)}`);
}
function subCancel(m, id) { return subUpdate(m, id, { status: "canceled" }, "해지 — 위약금 없음"); }
function subChangeCycle(m, id, cycle) {
  const { s } = _subFind(m, id); if (!s) return null;
  return subUpdate(m, id, { cycle, nextShipAt: s.lastShipAt + cycle * DAY }, `배송 주기 변경 — ${cycle}일마다`);
}
/* 지금 받기(앞당김) — 소진 임박 시 회원 확인 후 즉시 발송 */
function subShipNow(m, id) {
  const { s } = _subFind(m, id); if (!s) return null;
  const now = Date.now();
  const r = (typeof healthReward === "function") ? healthReward(s.price * s.qty) : { reward: Math.floor(s.price * s.qty * 0.25) };
  const bonus = Math.floor(r.reward * 0.1);   // 정기배송 유지 보너스 10%(적립 규칙은 마진 내에서 운영)
  try { if (typeof shopHtkAdd === "function") shopHtkAdd(m.email, r.reward + bonus); } catch (e) {}
  return subUpdate(m, id, {
    lastShipAt: now, nextShipAt: now + s.cycle * DAY, runOutAt: now + s.estDays * DAY, shipped: (s.shipped || 0) + 1,
  }, `${(s.shipped || 0) + 1}회차 발송 — 적립 ${(r.reward + bonus).toLocaleString()}원(정기 보너스 포함)`);
}

/* ── 소진 예측 — D-7 이내 항목(정기배송 미등록 주문분 포함) ── */
function _ordKey(m) { return "hifin_shop_orders_" + ((m && m.email) || "self"); }
function subOrders(m) { try { return JSON.parse(localStorage.getItem(_ordKey(m)) || "[]"); } catch (e) { return []; } }
/* 주문 기록 — 구독 전환 제안의 근거(주문 이력이 없으면 재구매 시점을 알 수 없다) */
function subLogOrder(m, items) {
  if (!m || !items || !items.length) return null;
  const l = subOrders(m); const now = Date.now();
  items.forEach(({ p, qty }) => {
    if (!p) return;
    l.push({ pid: p.id, name: p.name, category: p.category, price: p.price, qty: qty || 1, at: now, estDays: subDays(p, qty || 1), runOutAt: now + subDays(p, qty || 1) * DAY });
  });
  try { localStorage.setItem(_ordKey(m), JSON.stringify(l.slice(-60))); } catch (e) {}
  return l.length;
}
/* 소진 임박(기본 7일 이내) — 구독분은 다음 배송일, 단품 주문분은 소진 예정일 기준 */
function subDue(m, withinDays) {
  const w = (withinDays || 7) * DAY, now = Date.now(), out = [];
  subList(m).filter((s) => s.status === "active").forEach((s) => {
    if (s.runOutAt - now <= w) out.push({ kind: "sub", id: s.id, name: s.name, days: Math.max(0, Math.round((s.runOutAt - now) / DAY)), nextShipAt: s.nextShipAt, sub: s });
  });
  const subs = new Set(subList(m).filter((s) => s.status !== "canceled").map((s) => s.pid));
  const seen = new Set();
  [...subOrders(m)].reverse().forEach((o) => {
    if (subs.has(o.pid) || seen.has(o.pid)) return; seen.add(o.pid);
    if (o.runOutAt - now <= w) out.push({ kind: "order", pid: o.pid, name: o.name, days: Math.max(0, Math.round((o.runOutAt - now) / DAY)), order: o });
  });
  return out.sort((a, b) => a.days - b.days);
}
/* 구독 요약(지갑·하이 카드용) */
function subSummary(m) {
  const l = subList(m).filter((s) => s.status !== "canceled");
  const active = l.filter((s) => s.status === "active");
  const monthly = active.reduce((s, x) => s + Math.round(x.price * x.qty * (30 / x.cycle)), 0);
  const next = active.slice().sort((a, b) => a.nextShipAt - b.nextShipAt)[0] || null;
  return { count: active.length, paused: l.length - active.length, monthly, next, due: subDue(m, 7) };
}
