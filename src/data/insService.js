/* ══════════════ 과업3 — insService: 치료비 케어 서비스 API층 (화면 = AI 상담사 단일 출처) ══════════════
   Phase 1 실행 지시서 §4. 모든 탭 기능을 화면 전용 함수가 아니라 서비스 함수로 구현 —
   화면(6탭)과 향후 「AI 치료비 케어 전용 상담사」가 같은 함수를 소비한다.
   역할 분담: 전역 '하이' = 얕은 안내·네비 / 전용 상담사(차기 Phase) = 본 서비스로 깊은 업무 수행.
   규제 가드레일(상담사 상속용 정책 상수): INS_AI_POLICY — 정보 제공까지만·청약 권유/지급 확정/의료 진단 금지·모집은 GA 경유. */

const INS_AI_POLICY = {
  allow: ["보장·계약·청구·납부 정보 조회", "갭 분석 설명", "절차 안내", "확인 단계를 거친 서비스 실행(납부 등)"],
  deny: ["청약 권유·특정 상품 추천 확정", "보험금 지급 여부 확정 판단", "의료 진단", "모집 행위(GA 경유 안내로 대체)"],
  note: "보험 상담은 정보 제공까지 — 가입·지급 확정은 보험사·GA 라이선스 채널이 수행합니다.",
};
/* 불가피한 상수(config) — 사유 주석 필수(하드코딩 금지 원칙의 예외 등록) */
const INS_CONFIG = {
  PREMIUM_MARGIN_RATE: 0.10,   // 보험료 중 플랫폼 중개 수수료 가정(재무엔진 보험 중개 산식과 정합) — 나눔 재원 산출 기반
  SHARE_RATE: ((typeof WALLET_SPLIT !== "undefined" && WALLET_SPLIT.give != null) ? WALLET_SPLIT.give : 15) / 100,   // 순환 마진의 나눔 적립 비율(사업계획서 원칙4 · WALLET_SPLIT.give에서 파생 — sectionData.js가 manifest 앞 순서, 형 확정 15%)
  TELE_VISIT_FEE: 15900,       // 비대면 진찰료 수가 근사(2026 의원급 초진 기준 근사치) — 청구 지급 산정의 기본 진료비
  RERATE_PER_IMPROVE: 1.5,     // 개선 지표 1개당 요율 인하 %(계리 검증 전 시연 가정 — 제휴 보험사 협의 대상)
  RERATE_MAX_PCT: 15,          // 인하 상한 %(인하 및 가입확대형 전용 단방향 게이트)
};

function _isMember() { try { const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (dm) return dm; if (typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") return selfMember(); } catch (e) {} return null; }

/* ══ 실알림(과업4) — 수납·지급·재산정 이벤트가 알림센터에 실제로 쌓인다 ══ */
function notifAll() { try { return JSON.parse(localStorage.getItem("hifin_notifs") || "[]"); } catch (e) { return []; } }
function notifPush(o) { try { const l = notifAll(); l.unshift({ ts: Date.now(), ic: o.ic || "check", t: o.t || "알림", d: o.d || "", target: o.target || "insurance" }); localStorage.setItem("hifin_notifs", JSON.stringify(l.slice(0, 20))); } catch (e) {} }

/* ══ SharingPool(S1-1 기초) — 나눔 재원 기금 원장: 거래 건별 적립 tx(연출 카운터 아님) ══ */
function spLedger() { try { return JSON.parse(localStorage.getItem("hifin_sharing_pool") || "[]"); } catch (e) { return []; } }
/* dir: +1 적립(기본) / -1 지출(병원 직접 정산 — S3-1). 지출은 잔액 검증 통과 시에만 기록 */
function spAppend(o) {
  o = o || {}; const amount = Math.max(0, Math.round(o.amount || 0)); if (!amount) return null;
  const dir = o.dir === -1 ? -1 : 1;
  const l = spLedger();
  if (dir < 0) { const bal = l.reduce((s, t) => s + (t.dir === -1 ? -t.amount : t.amount), 0); if (bal < amount) return null; }   // 기금 음수 차단
  const tx = { seq: l.length, ts: Date.now(), source: o.source || "기타", amount, dir, ref: o.ref || null, by: o.by || null };
  l.push(tx);
  try { localStorage.setItem("hifin_sharing_pool", JSON.stringify(l)); } catch (e) { return null; }
  if (typeof chainAppend === "function") chainAppend({ type: "share", token: o.token || null, note: dir > 0 ? `나눔 재원 적립 — ${tx.source} · ${amount.toLocaleString()}원 (순환 ${Math.round(INS_CONFIG.SHARE_RATE * 100)}%)` : `나눔 기금 집행 — ${tx.source} · ${amount.toLocaleString()}원` });
  return tx;
}
function spSummary() {
  const l = spLedger();
  const inTotal = l.filter((t) => t.dir !== -1).reduce((s, t) => s + t.amount, 0);
  const outTotal = l.filter((t) => t.dir === -1).reduce((s, t) => s + t.amount, 0);
  return { count: l.length, balance: inTotal - outTotal, inTotal, outTotal, recent: l.slice(-8).reverse(),
    bySource: l.filter((t) => t.dir !== -1).reduce((m, t) => { m[t.source] = (m[t.source] || 0) + t.amount; return m; }, {}) };
}

/* ══ ClaimEngine(P2 고도화) — 자동심사 룰셋 · 급여/비급여 · 연간 한도 · 중복 지문 · 부지급 사유·이의신청 ══ */
function _claims() { try { return JSON.parse(localStorage.getItem("hifin_claims") || "[]"); } catch (e) { return []; } }
function _claimsSave(l) { try { localStorage.setItem("hifin_claims", JSON.stringify(l)); } catch (e) {} }
/* 부지급 사유 코드 — 쉬운 언어 설명 + 해결 경로(거절도 친절하게) */
const CLAIM_DENY = {
  NO_CONTRACT: { ko: "실손 계약 미확인", easy: "지급이 안 된 이유: 실손 보험 연결이 확인되지 않았어요", fix: "보장분석 탭에서 내 보험을 연결하면 다시 심사할 수 있어요" },
  DUP: { ko: "중복 청구", easy: "지급이 안 된 이유: 같은 진료 건으로 이미 지급받으셨어요", fix: "다른 진료 건이라면 이의신청으로 알려주세요" },
  LIMIT: { ko: "연간 한도 소진", easy: "지급이 안 된 이유: 올해 보장 한도를 모두 사용했어요", fix: "내년 갱신 후 한도가 초기화돼요 — 잔여 한도는 계산 내역에서 확인" },
  NO_RIDER: { ko: "특약 미가입", easy: "지급이 안 된 이유: 이 항목(3대 비급여)은 별도 특약 가입이 필요해요", fix: "치료비 준비 진단 탭에서 특약 보완을 검토해 보세요" },
  /* 만기 경과 — 전에는 만기 검사가 없어서 보장이 끝난 뒤에도 검진 트랙이 자동승인됐다(결함). */
  COVER_END: { ko: "보장 종료", easy: "지급이 안 된 이유: 검진대비보험 보장 기간이 끝났어요", fix: "다음 검진 주기를 잡으면 같은 보장이 다시 열려요" },
};
/* 연간 사용 한도 원장 — 급여/비급여 누적(청구 지급 시 차감) */
function _limitUsed(m) { try { const y = new Date().getFullYear(); const o = JSON.parse(localStorage.getItem("hifin_claim_used_" + ((m && m.email) || "d")) || "{}"); return (o.year === y) ? o : { year: y, pay: 0, non: 0 }; } catch (e) { return { year: new Date().getFullYear(), pay: 0, non: 0 }; } }
function _limitAdd(m, cls, amt) { try { const o = _limitUsed(m); o[cls === "비급여" ? "non" : "pay"] += amt; localStorage.setItem("hifin_claim_used_" + ((m && m.email) || "d"), JSON.stringify(o)); } catch (e) {} }
/* 진료건 지문(중복 탐지) — 진료일+종류+금액 */
function _claimFp(c) { return (typeof vaultHash === "function") ? vaultHash("clmfp|" + new Date(c.at || 0).toDateString() + "|" + (c.kind || "") + "|" + (c.fee || 0)) : String(c.at); }
function _mySilson(m) { try { const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(m)) : null; return (v && v.insurance || []).find((k) => k.kind === "실손" || /실손/.test(k.product || "")) || null; } catch (e) { return null; } }
/* 자동심사 — 산정 근거(breakdown)를 회원이 펼쳐보게 반환 */
function claimReview(m, claimId) {
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  if (!c) return { ok: false, reason: "청구 건을 찾을 수 없습니다" };
  if (/지급/.test(c.status || "")) return { ok: false, code: "DUP", deny: CLAIM_DENY.DUP, reason: "이미 지급된 청구입니다(중복 지급 차단)" };
  // ① 검진대비보험 정액 트랙(과업B) — 실손이 아닌 검진 연동 무상 보장(진단지원 정액·한도 미차감)
  if (/검진/.test(c.kind || "")) {
    const pol = ((typeof pbPolicies === "function") ? pbPolicies(m) : []).find((p) => /검진.?대비/.test(p.product));
    if (!pol) return { ok: false, code: "NO_CONTRACT", deny: { ko: "검진대비보험 미발급", easy: "지급이 안 된 이유: 검진대비보험이 아직 발급되지 않았어요", fix: "치료비 준비 진단 탭 ①에서 검진 연동 무상 발급을 먼저 받아 주세요" }, reason: "검진대비보험이 발급되어 있지 않아요" };
    /* 개시·만기 판정은 보장 창 한 소스(insCheckupWindow)에서 — 전에는 pol.createdAt + 1일만 봐서
       ① 기기마다 개시일이 달라지고 ② 만기가 지난 뒤에도 자동승인이 났다. 두 결함을 함께 닫는다. */
    const W = (typeof insCheckupWindow === "function") ? insCheckupWindow(m, pol) : null;
    /* 거절 문구의 날짜도 창에서 만든다 — 개시 판정 근거를 계약 coverFrom으로 옮겼는데 설명만
       「발급 다음날」·「내일」로 남아 있었다. 조성래는 증서(2024-12-26)·계약 생성(벽시계)·보장 개시
       (2026-09-06)가 전부 다른 날이라 어느 쪽도 맞지 않는 문장이었다. */
    if (W && W.phase === "보장 개시 대기") return { ok: false, code: "NO_CONTRACT",
      deny: { ko: "보장 개시 전", easy: `보장은 보장 개시일(${insDayStr(W.start)}) 0시부터 시작돼요`, fix: `${insDayStr(W.start)} 이후에 다시 청구해 주세요` },
      reason: `보장 개시 전이에요(보장 개시일 ${insDayStr(W.start)} 0시 개시)` };
    if (W && W.ended) return { ok: false, code: "COVER_END",
      deny: Object.assign({}, CLAIM_DENY.COVER_END, { easy: `지급이 안 된 이유: 검진대비보험 보장 기간이 ${insDayStr(W.end)}에 끝났어요` }),
      reason: `보장 종료 — 검진대비보험 만기 경과(${insDayStr(W.end)}) · 다음 검진 주기를 잡으면 같은 보장이 다시 열려요` };
    /* ── 두 번째 축: **청구 건의 진료일**(c.at) ───────────────────────────────────
       전에는 계약 국면(W.phase·W.ended)만 봤다 — 청구 건의 날짜는 심사에 **한 번도** 들어가지
       않았다. 그래서 보장 창 밖의 진료일로 접수한 검진 청구가 그대로 자동승인됐다(실측 2026-10-08 ·
       창 2026. 9. 6. ~ 2026. 11. 5. · 판정 2026. 10. 6.: 진료일 2026-12-01 → ok payout 100,000 /
       2026-08-01 → ok 100,000 / 2024-12-26(실측 검진일) → ok 100,000). 같은 카드의 면책 목록은
       바로 두 줄 아래에서 「보장 기간 밖에 받은 진단」을 보장하지 않는다고 적고 있었다 —
       화면과 심사가 서로 다른 말을 한 자리다.
       두 축은 뜻이 다르므로 함께 본다: 위 분기는 「계약이 지금 유효한가」, 이 분기는
       「그 진료가 보장 기간 안에 있었나」. 경계는 창과 같다(start 포함 · end 배타적). */
    const _at = Number(c.at) || null;
    if (W && _at != null && _at < W.start) return { ok: false, code: "NO_CONTRACT",
      deny: { ko: "보장 개시 전 진료", easy: `지급이 안 된 이유: 진료일(${insDayStr(_at)})이 보장 개시일(${insDayStr(W.start)}) 0시보다 앞서요`,
              fix: `보장 기간(${insDayStr(W.start)} ~ ${insDayStr(W.end)}) 안에 받은 진료로 청구해 주세요` },
      reason: `보장 개시 전 진료 — 진료일 ${insDayStr(_at)} · 보장 개시일 ${insDayStr(W.start)} 0시` };
    if (W && _at != null && _at >= W.end) return { ok: false, code: "COVER_END",
      deny: Object.assign({}, CLAIM_DENY.COVER_END, { easy: `지급이 안 된 이유: 진료일(${insDayStr(_at)})이 보장 기간(${insDayStr(W.start)} ~ ${insDayStr(W.end)}) 밖이에요` }),
      reason: `보장 기간 밖 진료 — 진료일 ${insDayStr(_at)} · 검진대비보험 만기 ${insDayStr(W.end)} · 다음 검진 주기를 잡으면 같은 보장이 다시 열려요` };
    const fp0 = _claimFp(c);
    if (l.some((x) => x.id !== c.id && /지급/.test(x.status || "") && _claimFp(x) === fp0)) return { ok: false, code: "DUP", deny: CLAIM_DENY.DUP, reason: CLAIM_DENY.DUP.easy };
    const payout = 100000;   // 카탈로그(기본형 정밀검사 지원금) — CHECK_COVERS 근거
    return { ok: true, claim: c, silson: { product: pol.product, gen: "무상", coGen: "정액" }, fee: c.fee || payout, payout, track: "자동승인",
      breakdown: [`검진대비보험 정액 지원 — 정밀검사 지원금 ${payout.toLocaleString()}원(자기부담 없음)`, `근거 계약: ${pol.id} (검진 연동·무상·추가 보험료 0원)`, "심사 트랙: 자동승인(정액 — 연간 실손 한도와 무관)"],
      explain: `검진대비보험 정액 지원금 ${payout.toLocaleString()}원 지급(내가 내는 돈 0원)` };
  }
  const silson = _mySilson(m);
  if (!silson) return { ok: false, code: "NO_CONTRACT", deny: CLAIM_DENY.NO_CONTRACT, reason: CLAIM_DENY.NO_CONTRACT.easy };
  // 중복 지문 — 동일 진료건 기지급 여부
  const fp = _claimFp(c);
  if (l.some((x) => x.id !== c.id && /지급/.test(x.status || "") && _claimFp(x) === fp)) return { ok: false, code: "DUP", deny: CLAIM_DENY.DUP, reason: CLAIM_DENY.DUP.easy };
  // 급여/비급여 분류 — 3대 비급여(도수·주사·MRI)는 특약 확인
  const fee = c.fee || INS_CONFIG.TELE_VISIT_FEE;
  const nonPay = /도수|주사|MRI|엠알아이|비급여/.test(c.kind || "");
  const riderKey = /도수/.test(c.kind || "") ? "dosu" : /주사/.test(c.kind || "") ? "injection" : /MRI|엠알아이/.test(c.kind || "") ? "mri" : null;
  const gen = parseInt(String(silson.gen || "4").replace(/\D/g, ""), 10) || 4;
  if (nonPay && gen >= 3 && riderKey) { const rd = silson.riders3; if (rd && rd[riderKey] === false) return { ok: false, code: "NO_RIDER", deny: CLAIM_DENY.NO_RIDER, reason: CLAIM_DENY.NO_RIDER.easy }; }
  // 세대별 자기부담 산식(진단 §2-2B 규정) — 계약 저장값 우선, 없으면 세대 기본
  const GEN_SELF = { 1: [0, 0], 2: [10, 20], 3: [10, 30], 4: [20, 30], 5: [20, 30] };
  const selfPct = nonPay ? (parseInt(String(silson.coNon || "").replace(/\D/g, ""), 10) || GEN_SELF[gen][1]) : (parseInt(String(silson.coGen || "").replace(/\D/g, ""), 10) || GEN_SELF[gen][0]);
  // 연간 잔여한도 — 급여/비급여 별도(계약 한도 저장값 없으면 세대 기본: 급여 5천만·비급여 2천만/3세대 5천만)
  const limit = nonPay ? (gen <= 2 ? 100000000 : gen === 3 ? 50000000 : 20000000) : (gen <= 2 ? 100000000 : 50000000);
  const used = _limitUsed(m)[nonPay ? "non" : "pay"];
  const remain = Math.max(0, limit - used);
  if (remain <= 0) return { ok: false, code: "LIMIT", deny: CLAIM_DENY.LIMIT, reason: CLAIM_DENY.LIMIT.easy };
  const raw = Math.round(fee * (1 - selfPct / 100) / 100) * 100;
  const payout = Math.min(raw, remain);
  // 심사 트랙 — 고액은 수동심사 큐(자동승인 아님)
  const track = fee >= 1000000 ? "수동심사" : "자동승인";
  return { ok: true, claim: c, silson: { product: silson.product, gen: silson.gen, coGen: selfPct + "%" }, fee, payout, track,
    breakdown: [`진료비 ${fee.toLocaleString()}원 (${nonPay ? "비급여" : "급여"} 항목)`, `내가 내는 돈(자기부담 ${selfPct}%) − ${(fee - raw).toLocaleString()}원`, `연간 잔여 한도 ${remain.toLocaleString()}원 중 지급 ${payout.toLocaleString()}원`, `심사 트랙: ${track}${track === "수동심사" ? " (100만 원 이상 고액 — 담당자 확인 후 지급)" : " (규칙 심사 통과)"}`],
    explain: `진료비 ${fee.toLocaleString()}원 − 내가 내는 돈(자기부담 ${selfPct}%) = 지급 ${payout.toLocaleString()}원` };
}
/* 수동 청구 접수(상담사·화면 공용) — 지문 중복 즉시 차단 */
function claimSubmit(m, o) {
  o = o || {};
  const fee = Math.max(0, Math.floor(o.fee || 0));
  if (!fee) return { ok: false, reason: "진료비 금액을 알려주세요" };
  /* id에 접수 **순번**을 더한다(2026-10-08 수선) — 전에는 "CLM-" + Date.now()뿐이어서 같은
     밀리초에 접수한 두 청구가 **같은 id**를 갖고, claimReview가 `l.find((x) => x.id === claimId)`로
     먼저 들어온 건을 집었다. 청구 원장(hifin_claims)은 회원별이 아니라 **한 개**라, 그 경우
     다른 회원의 진료일로 내 청구가 심사됐다(실측: 벽시계를 한 값으로 고정한 격리 컨텍스트에서
     전건 충돌 — 조성래의 2026-10-06 건이 다른 회원 심사 결과로 돌아왔다). 순번은 원장 길이에서
     나오므로 난수가 아니다(회귀 결정론 유지 — rng 금지 규칙과 정합). */
  const l = _claims();
  const c = { id: "CLM-" + Date.now().toString(36).toUpperCase() + "-" + (l.length + 1).toString(36).toUpperCase(), at: o.date || Date.now(), status: "접수", kind: o.kind || "진료", fee, channel: o.channel || "수동 접수" };
  const fp = _claimFp(c);
  if (l.some((x) => /지급/.test(x.status || "") && _claimFp(x) === fp)) return { ok: false, code: "DUP", reason: CLAIM_DENY.DUP.easy };
  l.push(c); _claimsSave(l);
  try { if (typeof hiEvent === "function") hiEvent("claim_submitted", { kind: c.kind }); } catch (e0) {}
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: (typeof anonToken === "function" && m) ? anonToken(m) : null, note: `보험금 청구 접수 — ${c.id} · ${c.kind} ${fee.toLocaleString()}원` });
  return { ok: true, claim: c };
}
/* 이의신청 — 부지급도 끝이 아니게 */
function claimAppeal(m, claimId, reason) {
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  if (!c) return { ok: false, reason: "청구 건을 찾을 수 없습니다" };
  c.appeal = { at: Date.now(), reason: String(reason || "재검토 요청").slice(0, 200) };
  c.status = "이의신청 접수";
  _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: `청구 이의신청 접수 — ${c.id}` });
  if (typeof notifPush === "function") notifPush({ ic: "doc", t: "이의신청 접수", d: `${c.id} 재심사가 시작됐어요 — 결과는 알림으로 알려드려요`, target: "insurance" });
  return { ok: true, claim: c };
}
function claimPay(m, claimId) {
  const rv = claimReview(m, claimId); if (!rv.ok) { const l0 = _claims(); const c0 = l0.find((x) => x.id === claimId); if (c0 && rv.code && !/지급/.test(c0.status || "")) { c0.status = "부지급(" + rv.code + ")"; c0.denyCode = rv.code; _claimsSave(l0); } return rv; }
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  const htk = Math.round(rv.payout / rate);
  if (typeof tlEarn !== "function") return { ok: false, reason: "원장을 사용할 수 없습니다" };
  const r = tlEarn(m, htk, `보험금 지급 — ${rv.claim.id} (${rv.payout.toLocaleString()}원)`, rv.claim.id);
  if (!r.ok) return r;
  const l = _claims(); const c = l.find((x) => x.id === claimId);
  c.status = "지급완료"; c.paidAt = Date.now(); c.payout = rv.payout; c.txRef = r.tx && r.tx.hash;
  _claimsSave(l);
  if (typeof chainAppend === "function") chainAppend({ type: "payout", token: (typeof anonToken === "function") ? anonToken(m) : null, fhirHash: c.txRef || null, note: `보험금 지급 실행 — ${c.id} · ${rv.payout.toLocaleString()}원 (${htk.toLocaleString()} HTK 크레딧)` });
  if (rv.silson.coGen !== "정액") _limitAdd(m, /비급여/.test((rv.breakdown && rv.breakdown[0]) || "") ? "비급여" : "급여", rv.payout);   // P2: 연간 한도 누적 차감(검진 정액 트랙 제외)
  notifPush({ ic: "coin", t: "보험금 지급 완료", d: `${c.id} · ${rv.payout.toLocaleString()}원이 지갑에 입금됐어요`, target: "insurance" });
  return { ok: true, claim: c, payout: rv.payout, htk, balance: r.balance };
}

/* ══ 요율 재산정(M2-2 초기) — 인하폭을 실지표 개선도로 계산(고정값 12,400→11,100 폐기) ══ */
function rerateCompute(m) {
  try {
    const v = (typeof vaultLoad === "function") ? vaultLoad(anonToken(m)) : null;
    const cks = (v && v.checkups || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (cks.length < 2) return { eligible: false, reason: "검진 2개년 데이터가 필요해요 — 올해 검진결과를 연결하면 재산정을 신청할 수 있어요", need: 2 - cks.length };
    const mapOf = (ck) => { const o = {}; (ck.items || []).forEach((it) => { const n = Number(it.value); if (!isNaN(n)) o[it.key] = n; }); return o; };
    const prev = mapOf(cks[cks.length - 2]), cur = mapOf(cks[cks.length - 1]);
    const KEYS = ["glucose", "hba1c", "tg", "ldl", "tchol", "sbp", "dbp", "ast", "alt", "ggt", "bmi"];   // 개선 판정 대상(낮을수록 좋은 지표)
    const improved = [], worsened = [];
    KEYS.forEach((k) => { if (prev[k] == null || cur[k] == null) return; const d = prev[k] - cur[k]; const thr = Math.max(1, prev[k] * 0.03); if (d >= thr) improved.push({ k, ko: (typeof CKUP_LOINC !== "undefined" && CKUP_LOINC[k]) ? CKUP_LOINC[k].ko : k, from: prev[k], to: cur[k] }); else if (-d >= thr) worsened.push(k); });
    // 현재 보험료(실데이터): 금고 실손 계약 monthly → 없으면 유지 불가 안내
    let monthly = null; try { const sil = (v.insurance || []).find((k) => k.kind === "실손" || /실손/.test(k.product || "")); monthly = sil && (sil.monthly || null); } catch (e) {}
    if (!monthly) monthly = 12400;   // config 폴백: 실손 미연결 회원의 시연 기준 보험료(연결 시 실값 대체) — 사유: 빈 화면 방지
    const pct = Math.min(INS_CONFIG.RERATE_MAX_PCT, improved.length * INS_CONFIG.RERATE_PER_IMPROVE);
    const after = Math.round(monthly * (1 - pct / 100) / 100) * 100;
    // 인하 및 가입확대형 전용 단방향 게이트: 개선 없으면 "유지"(인상·거절 경로 없음 — 악화 지표는 표시만)
    /* [실측 통일 2026-10-05] 비교한 두 검진의 날짜를 함께 돌려준다 —
       본인 계정은 실측 2시점(2020-06-23 → 2024-12-26)이라 「작년 → 올해」가 아니다. 화면이 날짜를 밝혀야 한다. */
    return { eligible: true, improvedN: improved.length, improved, worsenedN: worsened.length, worsened, pct, before: monthly, after: pct > 0 ? after : monthly, saving: pct > 0 ? monthly - after : 0, downOnly: true,
      fromDate: cks[cks.length - 2].date || "", toDate: cks[cks.length - 1].date || "",
      /* [실측 통일 2026-10-06] 「개선/악화 N건」을 말할 때 **측정기관이 같은지**를 함께 밝힌다 —
         본인 계정 실측은 2020 명지병원 ↔ 2024 서울늘편한내과의원으로 기관이 달라 같은 선에 놓고 읽을 수 없다. */
      fromProvider: cks[cks.length - 2].provider || "", toProvider: cks[cks.length - 1].provider || "",
      sameProvider: !!(cks[cks.length - 2].provider && cks[cks.length - 1].provider && cks[cks.length - 2].provider === cks[cks.length - 1].provider) };
  } catch (e) { return { eligible: false, reason: "재산정 계산 오류" }; }
}
function rerateApplyReal(m) {
  const c = rerateCompute(m);
  if (!c.eligible) return { ok: false, reason: c.reason };
  if (c.pct <= 0) return { ok: false, reason: "이번에는 개선 지표가 확인되지 않았어요 — 보험료는 그대로 유지돼요(인하·가입확대 전용·불이익 없음)" };
  try {
    const s = { status: "done", before: c.before, after: c.after, saving: c.saving, rate: c.pct, improved: c.improved.map((x) => x.ko), at: Date.now() };
    localStorage.setItem("hifin_rerate", JSON.stringify(s));
    const tk = anonToken(m);
    if (typeof chainAppend === "function") chainAppend({ type: "record", token: tk, note: `보험요율 재산정 — 4세대 성과(${s.improved.join("·")}) 실증 · 월 ${c.before.toLocaleString()}→${c.after.toLocaleString()}원 인하` });
    try { const k = "hifin_g4_" + tk; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ kind: "rerate", saving: s.saving, improved: s.improved, at: s.at }); localStorage.setItem(k, JSON.stringify(l)); } catch (e2) {}
    if (typeof vaultAccessLog === "function") vaultAccessLog(tk, "보험사(요약 증명만)", "성과 요약 열람 — 요율 재산정 심사(원본 미제공)");
    notifPush({ ic: "check", t: "요율 재산정 적용", d: `월 ${c.before.toLocaleString()}→${c.after.toLocaleString()}원 (−${c.pct}%) — 관리 성과가 보험료가 됐어요`, target: "insurance" });
    try { if (typeof hiEvent === "function") hiEvent("rerate_applied", { n: c.pct }); } catch (e3) {}
    return { ok: true, state: s, compute: c };
  } catch (e) { return { ok: false, reason: "적용 저장 실패" }; }
}

/* ══ 검진대비보험 보장기간의 **단일 근거** ══════════════════════════════════════════
   [실측 통일 2026-10-06] 전에는 회원 화면(치료비 케어 ①)이 pol.createdAt —— 그 기기가 금고를 처음
   시드한 벽시계 시각 —— 으로 기간을 계산해 「보장 개시 대기 · 2026.10.7 ~ 2026.12.5」라고 띄우면서
   바로 아래에 증서 이름을 「CERT-JSR2024A(증서 날짜 2024-12-26)」라고 적었고, 프로 콘솔 ⑨의 같은 사람
   행은 증서 날짜 기준으로 「만기 경과(2025.2.25)」라고 말했다. 새 기기에서 열 때마다 회원 화면의
   기간이 달라졌다. 이제 두 화면이 이 함수 하나를 호출한다(각자 계산하면 다시 갈라진다).
   근거 우선순위 ⓐ 계약 보장 개시일(pol.coverFrom) ⓑ 증서 날짜(c.date→c.at) ⓒ 청약일(시연) ⓓ 계약 생성 시각.
   ⓐ가 1순위인 이유: 보장 창의 주인은 증서가 아니라 **계약**이다. 실측 증서(CERT-JSR2024A · 2024-12-26)로
   열렸던 1차 보장은 2025-02-25에 이미 끝났고, 그 증서를 고쳐서 창을 다시 열 수는 없다(실측 불변).
   재가입으로 다시 열린 창은 계약 레코드의 coverFrom이 말한다 — 1차 이력은 prior로 함께 반환한다. */

/* ── 시연 기준일(단일 상수) ─────────────────────────────────────────────────────────
   형 지시(2026-10-06) 「검진대비보험 만기 경과되지 않고 **한 달이 남도록** 조치해 줘」.
   창의 **양쪽**(보장 개시일 coverFrom · 판정 시각 now)을 이 상수 하나에서 파생시킨다.
   한쪽만 고정하면 날이 지날수록 잔여일이 줄어들고, 어느 날 조용히 「보장 종료」로 넘어간다.
   ⚠️ escrowPay._escNow()의 「실시계가 기준일 이후면 실시계」 분기를 **베끼지 않는다** —
      그 규칙이면 2026-11-06부터 「보장 종료」와 「만기까지 30일」이 한 줄에 같이 뜬다.
   범위: 검진대비보험 보장 창 전용. 법령 시행일(regGate)·동의 취득일·접속 로그·체인 블록 시각·
      정체 일수·제공 DB·연간 한도 원장은 벽시계 그대로다(전역 now로 승격하지 않는다).
   잔여일을 바꾸려면 remainDays 한 줄만 고친다(coverFrom·만기·배지·프로 ⑨가 함께 따라온다).
   ⚠️ 저장소에는 재무·에스크로 기준일 FB_ASOF(2027-09-17 · finBudget.js:12)가 따로 있다 —
      이 상수와 11개월 차다. 합치지 않는 것은 **형이 정한 값**이다(2026-10-06 지시: asOf 2026-10-06 ·
      잔여 30일). FB_ASOF는 회원 10만 실적 환산 시점(= 사업 미래 시점)이고 이 상수는 시연에서
      보여 줄 「오늘」이라 뜻이 다르다. 그래서 여기서 FB_ASOF를 파생하지 않고, 반대로 이 값이
      escrowPay._escNow()처럼 실시계로 승격되지도 않게 한다(가드가 _escNow·FB_ASOF 미참조를 단언).
      두 기준일을 합치려면 형 확정이 먼저다 — 합치는 날 아래 remainDays는 그대로 두면 된다. */
const INS_DEMO = { asOf: "2026-10-06", remainDays: 30, label: "시연 기준일" };
const INS_COVER_DAYS = 60;                      /* 발급 익일 0시 + 60일 — CYCLE_SPEC.expiryDay와 정합(형 확정 2026-09-03) */
/* "YYYY-MM-DD" → 로컬 0시 ms(날짜 문자열에서만 만든다 — 인자 없는 new Date() 금지) */
function insDateMs(s) {
  const d = String(s || "").replace(/[^0-9]/g, "");
  if (d.length < 8) return null;
  const t = new Date(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8))).getTime();
  return isNaN(t) ? null : t;
}
function insAsOfMs() { return insDateMs(INS_DEMO.asOf); }
/* 창 판정 시각 — 기준일 그 자체다. 실시계 비교 분기를 넣지 않는다(의도된 설계). */
function insNow() { return insAsOfMs(); }
/* 창 날짜 **단일 포맷터**(2026-10-08) — 전에는 같은 만기일이 한 화면에서 두 철자로 섰다:
   배지·증서는 toLocaleDateString("ko-KR")의 「2026. 11. 5.」, 거절 문구·프로 ⑨ mend 행은
   「2026.11.5」. 숫자는 하나지만 형이 한 화면에서 두 표기를 읽는다. 이제 창을 소비하는 문구는
   전부 이 함수를 부른다(로케일 의존 없이 ko-KR 표기를 직접 만든다 — 환경마다 달라지지 않게). */
function insDayStr(ms) { const d = new Date(ms); return d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + "."; }
/* 창 판정 시각을 **시드로 가른다**(2026-10-08 수선) ───────────────────────────────────
   전에는 insNow()(기준일 고정)를 **모든** 창의 개시·만기 판정에 썼다. 그러면 기준일 이후에
   열리는 창 —— 즉 오늘 「내 무료 보장 켜기」를 누르는 모든 회원 —— 은 now < start가 영구히 참이라
   「보장 개시 대기」에서 빠져나오지 못하고 청구가 영원히 거절됐다(코호트 회원 실측 2026-10-08:
   배지 「보장 개시 대기 · 2026. 10. 9. ~ 2026. 12. 8. · 만기까지 63일」 · claimReview NO_CONTRACT ·
   「내일 다시 청구해 주세요」의 그 내일이 오지 않음). 계획이 hmTouchPlan 첫 연결 블록에 대해
   경고한 「영구 미도래」가 창의 **개시 쪽**에 그대로 재현된 자리다.
   그래서 기준일 시계는 **시연 시드 창(coverSeed "demo")에만** 적용한다 —
   증서·청약·계약 생성 시각에서 온 창(seed "live")은 벽시계로 판정해 다음날 자연히 개시된다. */
function insJudgeNow(seed) { return seed === "demo" ? insAsOfMs() : Date.now(); }
/* 보장 창 산식의 유일한 구현 — 발급 익일 0시 + INS_COVER_DAYS일. 국면·잔여일도 여기서만 나온다. */
function insWindowOf(issueAtMs, seed) {
  const st = new Date(issueAtMs); st.setDate(st.getDate() + 1); st.setHours(0, 0, 0, 0);
  const start = st.getTime(), end = start + INS_COVER_DAYS * 86400000, now = insJudgeNow(seed);
  /* end는 **배타적** 경계다(보장 마지막 날 24시 = 표기상 만기일 0시).
     전에는 ended: now > end여서 만기일 당일에 「지금 보장되고 있어요 · 만기까지 0일」이 하루 떴고
     claimReview도 그날 자동승인했다(실측). now >= end면 종료로 고정한다. */
  const phase = now >= end ? "보장 종료" : now >= start ? "보장 중" : "보장 개시 대기";
  return { start, end, now, seed: seed || "live", phase, ended: phase === "보장 종료",
    /* 잔여일은 「보장 중」에서만 뜻이 있다. 개시 전에는 end − now가 보험기간(60일)을 넘어
       「60일 상품인데 만기까지 106일」이 배지에 섰다(증서 날짜 2026-11-20 실측) —
       구조적으로 불가능하게 null로 돌리고, 개시 전에는 startsInDays를 쓴다. */
    remainDays: phase === "보장 중" ? Math.max(1, Math.ceil((end - now) / 86400000)) : null,
    startsInDays: phase === "보장 개시 대기" ? Math.max(1, Math.ceil((start - now) / 86400000)) : null };
}
/* 시연 시드 보장 개시일 — 기준일에 remainDays가 남도록 역산(= 기준일 − (60 − 30 + 1)일 = 2026-09-05 청약 → 09-06 개시 → 11-05 만기) */
function insDemoCoverFrom() { return insAsOfMs() - Math.max(1, INS_COVER_DAYS - INS_DEMO.remainDays + 1) * 86400000; }
function insCertAt(c) {
  if (!c) return null;
  const d = String(c.date || "").replace(/[^0-9]/g, "");
  if (d.length >= 8) {
    const t = new Date(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8))).getTime();
    if (!isNaN(t)) return t;
  }
  return c.at || null;
}
/* 내 증서 전체 — 증서 날짜(insCertAt) 오름차순. 「1차 증서」·「최신 증서」를 가려 쓰려면
   목록이 필요하다. 전에는 insCheckupCert(= 마지막 1건)만 있어서, 증서가 2건이 되는 순간
   **최신 증서를 「1차 증서」라고 부르고** 1차 보장 이력 줄이 화면에서 사라졌다(실측:
   예약완료 경로가 만든 CERT-NEW01(2026-11-20) 1건을 더하자 근거 문구가 「1차 증서 CERT-NEW01」이
   되고 prior가 null이 됐다). 예약 1건만 보여 주면 재현되는 주력 흐름이다. */
function insCheckupCerts(m) {
  try {
    const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]");
    return l.filter((x) => x && x.insured && x.insured.name === (m && m.name))
      .map((x) => ({ c: x, at: insCertAt(x) })).filter((x) => x.at != null)
      .sort((a, b) => a.at - b.at);
  } catch (e) { return []; }
}
/* 최신 증서(화면이 「내 가입증서 보기」로 띄우는 것) */
function insCheckupCert(m) { const l = insCheckupCerts(m); return l.length ? l[l.length - 1].c : null; }
/* 창보다 **앞선 가장 이른** 증서 = 1차 증서. 없으면 null(근거 문구에 조각을 붙이지 않는다). */
function insCheckupCertFirst(m, beforeMs) {
  const l = insCheckupCerts(m);
  for (let i = 0; i < l.length; i++) if (beforeMs == null || l[i].at < beforeMs) return l[i];
  return null;
}
/* {issuedAt, start, end, phase, remainDays, basis, seed, src, cert, prior, ended} — 근거가 하나도 없으면 null.
   pol을 넘기지 않으면 여기서 찾는다(프로 콘솔 ⑨ hmTouchPlan은 계약을 모른 채 호출한다 —
   폴백이 없으면 회원 화면은 계약 coverFrom을, 콘솔은 증서를 보고 같은 사람이 두 기간으로 갈라진다). */
function insCheckupWindow(m, pol) {
  try {
    if (!pol) { try { pol = ((typeof pbPolicies === "function") ? pbPolicies(m) : []).find((p) => /검진.?대비/.test(p.product)) || null; } catch (e0) { pol = null; } }
    let issueAt = null, src = null, basis = null, seed = null;
    const cert = insCheckupCert(m);                       /* 최신 증서 — 신원 표시용 */
    const certAt = cert ? insCertAt(cert) : null;
    const certSrc = cert ? ("증서 " + cert.id + (cert.date ? " · 발급 " + String(cert.date).replace(/-/g, ".") : "")) : null;
    if (pol && pol.coverFrom != null) { issueAt = pol.coverFrom; basis = "policy"; seed = pol.coverSeed === "demo" ? "demo" : "live"; }
    if (!issueAt && certAt) { issueAt = certAt; basis = "cert"; seed = "live"; src = certSrc; }
    /* seed는 「기준일(INS_DEMO)에서 파생된 날짜인가」의 뜻만 갖는다 — 전에는 청약 큐 분기가
       issueAt = q.at(벽시계 청약 시각)을 쓰면서 seed = "demo"를 함께 박아, 날마다 달라지는 창에
       배지가 「· 시연 기준일 2026.10.06」 칩과 「(시연 시드)」 꼬리를 붙였다(규칙의 역방향 위반). */
    if (!issueAt && typeof hmInsQueue === "function") { try { const q = hmInsQueue().find((x) => x.email === (m && m.email)); if (q) { issueAt = q.at; basis = "queue"; seed = "live"; src = "청약일 기준"; } } catch (e) {} }
    if (!issueAt && pol && pol.createdAt) { issueAt = pol.createdAt; basis = "created"; seed = "live"; src = "계약 생성 시각(증서 미발급)"; }
    if (!issueAt) return null;
    const W = insWindowOf(issueAt, seed);
    /* 1차 증서 = 창보다 앞선 **가장 이른** 증서(마지막 증서가 아니다). 라벨도 「1차 증서」로 박지 않고
       「연계 증서」로 적는다 — 그 증서가 몇 번째인지는 데이터가 말해 주지 않는다. */
    const first = (basis === "policy") ? insCheckupCertFirst(m, issueAt) : null;
    if (!src) src = "계약 보장 개시일 " + insDayStr(W.start) + (seed === "demo" ? "(시연 시드)" : "") + (first ? " · 연계 증서 " + first.c.id : "");
    /* 앞선 보장 창 — 연계 증서(실측)로 산출되는, 이미 지난 창. 읽기만 한다(증서를 고치거나 더하지 않는다).
       계약 레코드는 1건뿐이고 바뀐 것은 coverFrom 하나이므로, 이 값으로 「재가입·재개·만기 종료」 같은
       **계약 행위**를 단정하지 않는다(화면 문구는 Insurance.jsx에서 산출임을 밝혀 적는다). */
    const prior = first ? Object.assign({ cert: first.c }, insWindowOf(first.at, "live")) : null;
    /* now를 함께 돌려준다 — 이 창을 소비하는 쪽(프로 ⑨ hmTouchPlan)이 insNow()를 따로 부르면
       시연 시드가 아닌 창까지 기준일로 판정한다. 판정 시각도 창 한 소스에서 나오게 한다. */
    return { issuedAt: issueAt, now: W.now, start: W.start, end: W.end, phase: W.phase, remainDays: W.remainDays,
      startsInDays: W.startsInDays, basis, seed, src, cert, priorCert: first ? first.c : null, prior, ended: W.ended };
  } catch (e) { return null; }
}
/* 검진대비보험 계약의 보장 창을 시연 기준일에 맞춘다(멱등).
   coverSeed "live"(실계약에서 온 개시일)는 건드리지 않는다 — 시연 시드만 다시 쓴다. */
function insCheckupCoverEnsure(m) {
  try {
    if (!m || typeof pbPolicies !== "function" || typeof pbPolicyPatch !== "function") return false;
    const pol = pbPolicies(m).find((p) => /검진.?대비/.test(p.product));
    if (!pol || pol.coverSeed === "live") return false;
    const want = insDemoCoverFrom(), term = INS_COVER_DAYS + "일(검진 연동)";
    if (pol.coverFrom === want && pol.coverSeed === "demo" && pol.term === term) return false;
    pbPolicyPatch(m, pol.id, { coverFrom: want, coverSeed: "demo", term });
    return true;
  } catch (e) { return false; }
}

/* ══ insService — 상담사·화면 공용 진입점 ══ */
const insService = {
  policy: INS_AI_POLICY, config: INS_CONFIG,
  member: _isMember,
  /* ① 보장분석 — 금고 실계약 + 코호트 통계(재합성 금지) */
  gap(m) {
    m = m || _isMember(); if (!m) return null;
    let contracts = []; try { const v = vaultLoad(anonToken(m)); contracts = (v && v.insurance) || []; } catch (e) {}
    const silson = contracts.find((c) => c.kind === "실손" || /실손/.test(c.product || "")) || null;
    const sol = (typeof insuranceSolution === "function") ? (() => { try { return insuranceSolution(m); } catch (e) { return null; } })() : null;
    const stats = (typeof cohortInsStats === "function") ? (() => { try { return cohortInsStats(); } catch (e) { return null; } })() : null;
    return { connected: contracts.length > 0, contracts, silson, solution: sol,
      peer: stats ? { silsonRate: Math.round(stats.silsonRate * 100), avgMonthly: Math.round(stats.avgMonthly), avgContracts: Math.round(stats.avgContracts * 10) / 10 } : null };
  },
  /* ② 보장 사다리(M3-1) — 실손 확인 선행 → 미가입자 HTK 우선 충당 */
  ladderCheck(m) {
    m = m || _isMember(); if (!m) return null;
    const g = this.gap(m);
    const bal = (typeof tlSync === "function") ? (tlSync(m) != null ? tlSync(m) : 0) : ((typeof tlBalance === "function") ? tlBalance(m) : 0);   // 과업C: 제네시스 미생성 계정도 원장 동기화 후 잔액(빈 0 HTK 표시 버그 수정)
    const insRes = (typeof htkInsReserve === "function") ? htkInsReserve(bal) : Math.floor(bal * 0.3);
    if (g && g.silson) return { stage: "custom", silson: g.silson, reserve: insRes, note: "실손 보장이 확인됐어요 — 추가 적립 토큰은 예측 위험 기반 치료비 준비 진단에 쓸 수 있어요." };
    return { stage: "silson-first", reserve: insRes, note: "실손(기초 보장)이 아직 없어요 — 치료비 케어 적립금(" + insRes.toLocaleString() + " HTK)을 실손 가입·보험료에 우선 충당하는 것을 권해요.",
      legal: "※ 토큰의 보험료 충당은 보험업법 특별이익 제공 금지 규정 정합 검토 전제 · 가입은 GA 라이선스 채널 경유" };
  },
  /* ③ 납부 */
  bills(m) { m = m || _isMember(); return (typeof pbSummary === "function") ? pbSummary(m) : null; },
  pay(m, billId) { m = m || _isMember(); const r = (typeof pbPay === "function") ? pbPay(m, billId) : { ok: false }; return r; },
  topup(m, won) { m = m || _isMember(); return (typeof pbTopup === "function") ? pbTopup(m, won) : { ok: false }; },
  policyCreate(m, o) { m = m || _isMember(); return (typeof pbPolicyCreate === "function") ? pbPolicyCreate(m, o) : { ok: false }; },
  /* ④ 청구·지급 */
  claims() { return _claims().slice().reverse(); },
  claimStatus(id) { return _claims().find((c) => c.id === id) || null; },
  claimReview(m, id) { return claimReview(m || _isMember(), id); },
  claimPay(m, id) { return claimPay(m || _isMember(), id); },
  claimSubmit(m, o) { return claimSubmit(m || _isMember(), o); },
  claimAppeal(m, id, reason) { return claimAppeal(m || _isMember(), id, reason); },
  claimLimits(m) { m = m || _isMember(); return _limitUsed(m); },
  /* ═ 치료비 준비 진단 4서브섹션(과업B) — 화면·상담사 공용 ═ */
  /* ①-1 검진대비보험 현황 — 검진 연동 발급·타임라인·청구 연결 */
  checkupIns(m) {
    m = m || _isMember(); if (!m) return null;
    let hasCheckup = false, checkupDate = null;
    try { const v = vaultLoad(anonToken(m)); const cks = (v && v.checkups) || []; hasCheckup = cks.length > 0; checkupDate = cks.length ? cks[cks.length - 1].date : null; } catch (e) {}
    const pol = ((typeof pbPolicies === "function") ? pbPolicies(m) : []).find((p) => /검진.?대비/.test(p.product));
    /* 보장기간은 insCheckupWindow 하나에서 읽는다 — 프로 콘솔 ⑨(hmTouchPlan)와 같은 근거(증서 날짜) */
    const timeline = pol ? insCheckupWindow(m, pol) : null;
    const ended = !!(timeline && timeline.ended);
    /* 「이 계약이 자기 보장 기간을 한 번이라도 산 적이 있나」 — 계약 생성 시각이 창의 만기 뒤면
       그 보장 기간에 이 계약은 **존재하지 않았다**. 전에는 화면이 그 경우에도 타임라인 4단계
       (발급·보장 시작·지켜지는 중·보장 종료)를 전건 점등하고 「보장 기간에는 이렇게 지켜드렸어요」
       (과거완료)라고 적었다(실측: 코호트 회원 발급 직후 창 2025. 11. 2. ~ 2026. 1. 1. · 계약
       createdAt은 누른 그 순간). 데이터에 없는 과거 보장을 화면이 단정한 자리다 — 조성래 카드에서
       「재가입으로 재개」를 지운 것과 같은 종류의 단정이다.
       ⚠️ 창이 **아직 끝나지 않았으면**(보장 중·개시 대기) 이 판정은 뜻이 없다 — ended를 함께 본다.
       그러지 않으면 기준일 창(만기 2026-11-05)을 그 날짜 뒤에 처음 시드한 기기에서 배지는
       「보장 중」인데 카드는 「이미 지난 기간이에요」가 되어, 창 하나에서 두 말이 나온다
       (실측: 벽시계 2026-11-15 격리 컨텍스트). 국면은 창 한 소스가 말하고 이 값은 그 위에 얹힌다. */
    const neverActive = !!(pol && timeline && timeline.ended && timeline.end <= (pol.createdAt || 0));
    const claims = _claims().filter((c) => /검진/.test(c.kind || ""));
    return { hasCheckup, checkupDate, policy: pol || null, timeline, claims, ended, neverActive,
      /* 만기일 표기는 insDayStr 한 포맷터 — 전에는 여기만 toLocaleDateString이라 같은 날짜가 두 철자로 섰다 */
      endedNote: ended ? `보장 종료 — 검진대비보험 만기 경과(${insDayStr(timeline.end)}) · 다음 검진 주기를 잡으면 무상 보장이 다시 시작돼요` : null,
      coverSrc: timeline ? timeline.src : null,
      coverage: [
        ["검진에서 암이 발견됐어요", "일반암 진단금", 10000000, "확정 진단과 동시에 — 치료 시작 비용부터 해결 (기타암 제외)"],
        ["뇌졸중·심근경색 진단을 받았어요", "2대 질환 진단금", 10000000, "골든타임 치료에 바로 보태세요"],
        ["수술이 필요하대요", "질병 수술비", 3000000, "암·뇌·심장뿐 아니라 대부분 질병의 수술 시"],
        ["정밀검사를 더 받아보래요", "정밀검사 지원", 100000, "복부초음파·조직검사 등 추가 검사비"],
      ],   // 카탈로그(CHECK_COVERS 고급형) 근거 — 암·뇌졸중·급성심근경색 각 1,000만원 · 21대 질병 수술비 300만원.
           // 정밀검사 지원 10만원은 무상 정액 지원금(insService.claimEval payout)과 동일 값으로 고정.
           // "진단금 최대 1,000만 원" 문구(홈 스토리·검진·하이 안내)와 정합.
      /* 면책 문구는 심사가 실제로 보는 **양쪽 경계**를 적는다(claimReview의 진료일 축과 한 입) —
         전에는 개시 전만 적어 두고 만기 후 진료일은 자동승인됐다. */
      exclusions: [timeline
        ? `보장 기간(${insDayStr(timeline.start)} 0시 ~ ${insDayStr(timeline.end)} 0시) 밖에 받은 진단 — 개시 전·만기 후 진료일은 심사에서 거절돼요`
        : "보장이 시작되기 전에 받은 진단", "일부러 낸 사고", "검진과 관계없는 일반 진료비(그건 실손보험 영역이에요)"] };
  },
  /* ①-2 검진대비보험 발급 — 검진 기록 필수·PolicyLedger+증서+체인 */
  issueCheckupIns(m) {
    m = m || _isMember(); if (!m) return { ok: false, reason: "로그인이 필요해요" };
    const st = this.checkupIns(m);
    if (!st.hasCheckup) return { ok: false, reason: "검진 기록이 아직 없어요 — 검진결과를 먼저 연결해 주세요(무상 발급의 연동 조건)" };
    if (st.policy) return { ok: false, reason: "이미 발급된 검진대비보험이 있어요(" + st.policy.id + ")" };
    /* 창의 주인은 증서가 아니라 **계약**이다 — 발급 시점에 보장 개시일을 계약에 동봉한다(2026-10-08 수선).
       전에는 coverFrom을 넘기지 않아 근거가 ⓑ증서(= 연계 검진일)로 떨어졌고, 그 날짜가 시드 리터럴
       (코호트 2025-11-01 · 체험 회원 2024-12-26)이라 60일 창이 **이미 닫혀** 있었다. 실측(vm 프로브,
       금고 주입 없음): 코호트 42·7·113 전건 issueOk=true인데 phase=「보장 종료」 · 창 2025. 11. 2. ~
       2026. 1. 1. · claimReview COVER_END · 발급 알림은 「보장 개시 2025. 11. 2. 0시」. 오늘 체결한
       계약을 두고 11개월 전에 보장이 개시·종료됐다고 회원에게 말한 자리다.
       하한 규칙 — 연계 검진일로 열리는 창이 아직 닫히지 않았으면 그 날짜를 쓴다(확인 모달의
       「연계 검진일 다음날 0시」 서술이 지켜진다). 이미 닫혔으면 **발급일**을 하한으로 내려
       창을 연다(발급 다음날 0시 개시 — 그 내일은 실제로 온다).
       coverSeed "live": 실계약에서 온 개시일이라 벽시계로 판정한다(기준일 시계는 시연 시드 전용). */
    const _ckAt = insDateMs(st.checkupDate);
    const _w0 = (_ckAt != null) ? insWindowOf(_ckAt, "live") : null;
    const _cf = (_w0 && !_w0.ended) ? _ckAt : Date.now();
    const r = (typeof pbPolicyCreate === "function") ? pbPolicyCreate(m, { product: "건강검진 대비보험(무상)", monthly: 0, cover: "진단지원 최대 100만", term: INS_COVER_DAYS + "일(검진 연동)", coverFrom: _cf, coverSeed: "live" }) : { ok: false };
    if (!r.ok) return r;
    /* 증서에 insured를 담는다 — 문서화된 근거 우선순위 ⓑ(증서 날짜)는 insCheckupCert가
       `x.insured.name === m.name`인 증서만 「내 것」으로 인정하는데, 이 경로가 push하는 레코드에
       insured가 없어서 ⓑ가 **도달 불가**였다(코호트 회원 발급 직후 basis가 "cert"가 아니라
       "created"로 떨어지는 것을 실측). 폴백 사다리가 끊겨 있던 자리이고, 증서 모달이 다른 회원의
       증서를 띄우던 자리이기도 하다. 실측 증서(CERT-JSR2024A)는 손대지 않는다. */
    try { const tk = anonToken(m); const b = chainAppend({ type: "ins-cert", token: tk, note: `검진대비보험 증서 발급 — ${r.policy.id} · 검진(${st.checkupDate}) 연동 무상` }); const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); l.push({ id: "CERT-" + r.policy.id.slice(-5), center: "검진 연동 발급", date: st.checkupDate, at: Date.now(), insured: { name: m.name }, hash: b && b.hash }); localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); } catch (e) {}
    /* 개시 시점은 창이 말한다 — 「익일 0시」로 단정하면 연계 검진일 기준으로 열리는 창과 어긋난다 */
    const _W = insCheckupWindow(m);
    if (typeof notifPush === "function") notifPush({ ic: "check", t: "검진대비보험 발급", d: `검진 기록 연동으로 무상 보장이 준비됐어요${_W ? `(보장 개시 ${insDayStr(_W.start)} 0시)` : ""}`, target: "insurance" });
    return { ok: true, policy: r.policy, window: _W };
  },
  /* ② 실손 현황 — 세대·한도·잔여·코호트 대비 */
  silStatus(m) {
    m = m || _isMember(); if (!m) return null;
    const sil = _mySilson(m);
    const st = (typeof cohortInsStats === "function") ? (() => { try { return cohortInsStats(); } catch (e) { return null; } })() : null;
    const peer = st ? { rate: Math.round(st.silsonRate * 100), avgMonthly: Math.round(st.avgMonthly) } : null;
    if (!sil) return { has: false, peer };
    const gen = parseInt(String(sil.gen || "4").replace(/\D/g, ""), 10) || 4;
    const limitPay = gen <= 2 ? 100000000 : 50000000;
    const limitNon = gen <= 2 ? 100000000 : gen === 3 ? 50000000 : 20000000;
    const used = _limitUsed(m);
    return { has: true, contract: sil, gen, peer,
      limits: { pay: { limit: limitPay, used: used.pay, remain: Math.max(0, limitPay - used.pay) }, non: { limit: limitNon, used: used.non, remain: Math.max(0, limitNon - used.non) } },
      latestNote: gen >= 4 ? "이미 최신 세대예요 — 자기부담은 있지만 보험료가 가장 낮아요." : `현재 ${gen}세대 → 4세대 전환 시 보험료는 내려가지만 내가 내는 돈(자기부담)이 늘어요. 병원 이용이 많다면 유지가 유리할 수 있어요(전환 전 상담 권장).` };
  },
  /* ③ 살아있는 보험 현황 — 일반 계약 집계(보장분석과 동일 소스) */
  myPolicies(m) {
    m = m || _isMember(); if (!m) return null;
    let vaultC = []; try { const v = vaultLoad(anonToken(m)); vaultC = (v && v.insurance) || []; } catch (e) {}
    const wizard = ((typeof pbPolicies === "function") ? pbPolicies(m) : []).filter((p) => !/검진.?대비/.test(p.product));
    const alive = vaultC.filter((c) => c.kind !== "실손").map((c) => ({ src: "연동", product: c.product, insurer: c.insurer, monthly: c.monthly || 0, years: c.years, benefit: c.benefit, kind: c.kind, status: "정상", detail: c.detail || null, join: c.join || null, end: c.end || null }))
      .concat(wizard.filter((p) => p.status === "active").map((p) => ({ src: "청약", product: p.product, insurer: "글로벌예방금융(GA)", monthly: p.monthly, years: 0, benefit: null, kind: "맞춤", status: "정상" })));
    const lapsed = wizard.filter((p) => p.status !== "active").map((p) => ({ product: p.product, monthly: p.monthly, status: "실효" }));
    const g = this.gap(m);   // 단일 출처 — 보장분석 탭과 같은 함수
    return { alive, lapsed, count: alive.length, monthlyTotal: alive.reduce((s, c) => s + (c.monthly || 0), 0),
      byGroup: g && g.solution && g.solution.findings ? null : null, gapLink: true };
  },
  /* ④ 프리미엄 적합(위험→추천 랩핑) */
  premiumFit(m) { m = m || _isMember(); return { risk: this.riskExplain(m), match: this.coverageMatch(m) }; },
  /* ②+ M2 — 위험 예측·보장 매칭·인수 시뮬·사다리 플랜(riskEngine 연동) */
  riskExplain(m) { m = m || _isMember(); return (typeof riskPredict === "function") ? riskPredict(m) : null; },
  coverageMatch(m) { m = m || _isMember(); return (typeof coverageMatch === "function") ? coverageMatch(m) : null; },
  underwrite(m, product) { m = m || _isMember(); return (typeof underwrite === "function") ? underwrite(m, product) : null; },
  ladderPlan(m) { m = m || _isMember(); return (typeof ladderPlan === "function") ? ladderPlan(m) : null; },
  /* ⑤ 재산정 */
  rerate(m) { m = m || _isMember(); return { state: (typeof rerateState === "function") ? rerateState() : null, compute: rerateCompute(m) }; },
  rerateApply(m) { return rerateApplyReal(m || _isMember()); },
  /* ⑥ 나눔 (S2/S3 — sharingEngine 연동) */
  donateStatus() { return spSummary(); },
  donateApply(m, o) { m = m || _isMember(); return (typeof needApply === "function") ? needApply(m, o) : { ok: false, reason: "엔진 미탑재" }; },
  donateReview(m) { m = m || _isMember(); return (typeof myApplications === "function") ? myApplications(m) : []; },
  donateImpact() { return (typeof impactSummary === "function") ? impactSummary() : null; },
  /* 상담사 컨텍스트 인계 규약 — {tab, member요약, 진행 중 건} */
  ctx(tab, m) {
    m = m || _isMember();
    const bills = this.bills(m); const claims = _claims().filter((c) => !/지급/.test(c.status || ""));
    return { tab: tab || null, member: m ? { name: m.name, cohortIndex: m.cohortIndex || null } : null,
      pending: { bills: bills ? bills.unpaid.length : 0, claims: claims.length },
      rerate: (typeof rerateState === "function") ? rerateState().status : null,
      ladder: m ? (this.ladderCheck(m) || {}).stage : null, policy: INS_AI_POLICY };
  },
};
