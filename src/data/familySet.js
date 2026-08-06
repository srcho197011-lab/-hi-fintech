/* ══════════════ 가족 건강 세트 — 객단가를 늘리는 유일한 정직한 방법 ══════════════
   설계: 한 사람의 결핍만 보면 객단가는 3만원에서 멈춘다. 가족(부모·배우자·자녀)의 생애주기 필요를 함께 보면
   같은 상담 한 번이 3~4명의 관리로 확장된다 — 하이핀은 가족 등록·권한 구조가 이미 있어 이 확장이 자연스럽다.
   원칙: ①가족 본인 동의 없는 건강정보 공유 금지(§권한 매트릭스) — 세트 추천은 '연령·성별 기반 일반 권장'까지만
        ②본인 검진 수치 근거는 본인 항목에만 사용 ③치료제 아님·중복 섭취 경고 ④묶음 할인은 적립으로(가격 훼손 없이). */

/* 생애주기 기반 일반 권장 성분 — 검진 수치가 아니라 연령·성별·관계에 근거한 보편 권장(개인 건강정보 미사용) */
function famRecoIngredients(f) {
  const a = Number(f.age) || 0, sex = f.sex || "-", rel = f.relation || "";
  const out = [];
  if (rel === "부모" || rel === "조부모" || a >= 65) {
    out.push({ ing: "종합비타민", why: "고령기에는 식사량이 줄며 비타민·미네랄 섭취가 부족해지기 쉬워요." });
    out.push({ ing: "오메가3", why: "혈행 관리가 중요해지는 시기예요." });
    if (sex === "여") out.push({ ing: "콜라겐", why: "관절·피부 탄력 관리가 필요한 연령대예요." });
  } else if (a > 0 && a < 19) {
    out.push({ ing: "종합비타민", why: "성장기에 필요한 영양 균형을 보조해요." });
    out.push({ ing: "루테인", why: "학습·디지털 기기 사용이 많은 시기의 눈 관리예요." });
  } else if (sex === "여") {
    out.push({ ing: "비타민D", why: "실내 활동이 많은 성인 여성에게 흔히 권장돼요." });
    out.push({ ing: "프로바이오틱스", why: "장 건강은 전반적 컨디션의 기본이에요." });
  } else {
    out.push({ ing: "종합비타민", why: "불규칙한 식사·피로 관리를 위한 기본 보충이에요." });
    out.push({ ing: "밀크씨슬", why: "음주·과로가 잦은 성인에게 흔히 선택돼요." });
  }
  return out.slice(0, 2);
}
/* 가족 세트 구성 — 본인(검진 근거) + 가족(생애주기 권장) */
function famSetBuild(m) {
  if (!m) return null;
  const products = (typeof SUPP_PRODUCTS !== "undefined") ? SUPP_PRODUCTS : [];
  const pick = (ing) => products.filter((p) => p.category === ing).sort((a, b) => a.price - b.price)[0] || null;
  const members = [];

  /* 본인 — 검진 수치 근거(nutriRx 재사용) */
  let selfRx = null; try { selfRx = (typeof nutriRx === "function") ? nutriRx(m) : null; } catch (e) {}
  const selfItems = [];
  if (selfRx && selfRx.rx.length) {
    selfRx.rx.slice(0, 2).forEach((r) => { const p = r.products && r.products[0]; if (p) selfItems.push({ ing: r.ing, why: r.why, product: p, basis: "검진" }); });
  } else {
    famRecoIngredients({ age: m.regAge || m.age, sex: m.sex, relation: "본인" }).forEach((r) => { const p = pick(r.ing); if (p) selfItems.push({ ing: r.ing, why: r.why, product: p, basis: "생애주기" }); });
  }
  if (selfItems.length) members.push({ key: "self", name: (m.name || "회원") + "(본인)", relation: "본인", age: m.regAge || m.age, items: selfItems });

  /* 가족 — 연령·성별 기반 일반 권장(건강정보 미사용) */
  let fam = [];
  try { fam = (typeof familyLoad === "function") ? (familyLoad(m.email, (m.name || "가")[0]) || []) : []; } catch (e) {}
  fam.slice(0, 4).forEach((f) => {
    const items = [];
    famRecoIngredients(f).forEach((r) => { const p = pick(r.ing); if (p) items.push({ ing: r.ing, why: r.why, product: p, basis: "생애주기" }); });
    if (items.length) members.push({ key: f.id, name: f.name, relation: f.relation, age: f.age, sex: f.sex, group: (typeof famGroupOf === "function") ? famGroupOf(f.age, f.relation) : "", items });
  });
  if (!members.length) return null;

  /* 금액·적립 — 가족 묶음 보너스는 가격 할인이 아니라 적립 가산으로(판매가 훼손 금지) */
  const flat = [];
  members.forEach((mm) => mm.items.forEach((it) => flat.push(it)));
  const total = flat.reduce((s, x) => s + x.product.price, 0);
  const baseReward = flat.reduce((s, x) => s + ((typeof healthReward === "function") ? healthReward(x.product.price).reward : Math.floor(x.product.price * 0.25)), 0);
  const bonusRate = members.length >= 4 ? 0.15 : members.length >= 3 ? 0.10 : members.length >= 2 ? 0.05 : 0;
  const bonus = Math.floor(baseReward * bonusRate);
  return { members, count: members.length, itemCount: flat.length, total, baseReward, bonus, bonusRate, reward: baseReward + bonus };
}
/* 세트 담기 — 선택된 구성원의 제품을 장바구니에 일괄 추가 */
function famSetAdd(set, keys) {
  if (!set) return 0;
  let n = 0;
  set.members.filter((mm) => !keys || keys[mm.key]).forEach((mm) => mm.items.forEach((it) => {
    try { if (typeof shopCartAdd === "function") { shopCartAdd(it.product.id, 1); n++; } } catch (e) {}
  }));
  return n;
}
/* 하이·배너용 한 줄 */
function famSetLine(m) {
  const s = famSetBuild(m); if (!s) return null;
  return `가족 ${s.count}명 기준 ${s.itemCount}종 · 합계 ${s.total.toLocaleString()}원 · 적립 ${s.reward.toLocaleString()}원(묶음 보너스 ${Math.round(s.bonusRate * 100)}% 포함)`;
}
