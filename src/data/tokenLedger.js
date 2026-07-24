/* ══════════════ C1-1 TokenLedger — HTK 단일 트랜잭션 원장 ══════════════
   진단 보고서(HIFIN-AUDIT-INS-20260724) 축3 C1-1 구현.
   원칙:
   - 잔액 = Σ트랜잭션(제네시스 이월 + 적립 − 차감). 숫자 카운터가 아니라 건별 tx로 재구성 가능.
   - 각 tx는 prev 해시로 연결(로컬 해시체인) — tlVerify()가 연결·해시·잔액을 전건 재계산 검증.
   - 이중지불·음수 방지: 차감(spend/transfer/swap)은 원장 잔액 검사를 통과해야만 기록.
   - 증권성 차단(가드레일 ⓗ): 트랜잭션 유형은 화이트리스트 — 이자·배당 유형은 정의 자체가 없다.
   - 무중단 이관: 기존 분산 카운터(WALLET.total 상수·케어플랜·쇼핑·htkDelta)는 제네시스로 1회 이월하고,
     이후 증가분은 tlSync()가 스냅샷 대비 차액을 earn tx로 흡수(레거시 코드는 그대로 동작).
   - 체인 앵커: 원장 자체가 해시 연결이므로 tlAppend는 기본 무앵커. 해시체인(hifin_hashchain) 앵커링은
     기존 호출부(txAnchor)가 담당(중복 기록 방지) — C2-1에서 이벤트 타입 확장 예정. */

/* ── 저장/조회 ── */
function _tlEmail(m) { return (typeof m === "string") ? (m || "default") : ((m && m.email) || "default"); }
function _tlKey(email) { return "hifin_htk_tl_" + (email || "default"); }
/* C3: 원장 트랜잭션 해시도 SHA-256으로 1회 재봉인(백업 _legacy 보존 — tlVerify 정합 유지) */
function _tlMigrateV2(email, arr) {
  try {
    if (!arr.length || localStorage.getItem(_tlKey(email) + "_v2")) return arr;
    localStorage.setItem(_tlKey(email) + "_legacy", JSON.stringify(arr));
    let prev = "0".repeat(64);
    const re = arr.map((t) => { const nt = Object.assign({}, t); delete nt.hash; nt.prev = prev; nt.hash = _tlHash(nt, prev); prev = nt.hash; return nt; });
    _tlSave(email, re);
    localStorage.setItem(_tlKey(email) + "_v2", "1");
    return re;
  } catch (e) { return arr; }
}
function tlAll(m) { try { const email = _tlEmail(m); return _tlMigrateV2(email, JSON.parse(localStorage.getItem(_tlKey(email)) || "[]")); } catch (e) { return []; } }
function _tlSave(m, arr) { try { localStorage.setItem(_tlKey(_tlEmail(m)), JSON.stringify(arr)); return true; } catch (e) { return false; } }

/* ── 트랜잭션 유형 화이트리스트(방향) — 이자·배당 없음(유사수신·증권성 원천 차단). topup=선불 충전(현금→HTK 유입만, 역방향은 RegGate 차단).
   dataFee(D2)=데이터 "이용 대가"(내 데이터를 쓴 값) — 원금·이자·배당이 아니며 RegGate dataFee 게이트 통과 시에만 발생(가드레일 ⓗ 우회 아님을 명시) ── */
function _tlDir(type) { return ({ genesis: 1, earn: 1, topup: 1, dataFee: 1, spend: -1, transfer: -1, swap: -1 })[type] || 0; }
function tlTypeLabel(type) { return ({ genesis: "이월", earn: "적립", topup: "충전", dataFee: "데이터 대가", spend: "사용", transfer: "전송", swap: "스왑" })[type] || type; }

/* ── 해시(결정론 — vaultHash 재사용) ── */
function _tlHash(tx, prev) { return (typeof vaultHash === "function") ? vaultHash(["tl", prev, tx.seq, tx.type, tx.amount, tx.memo || "", tx.ts].join("|")) : ""; }

/* ── 잔액 = 트랜잭션 합산(재구성 가능) ── */
function tlBalance(m) { return tlAll(m).reduce((s, t) => s + (_tlDir(t.type) > 0 ? t.amount : -t.amount), 0); }

/* ── 원장 기록(검증 통과 시에만) ── */
function tlAppend(m, o) {
  o = o || {};
  const email = _tlEmail(m);
  const amount = Math.max(0, Math.floor(o.amount || 0));
  if (!amount) return { ok: false, reason: "수량이 없습니다" };
  const dir = _tlDir(o.type);
  if (!dir) return { ok: false, reason: "허용되지 않은 트랜잭션 유형입니다" };            // 화이트리스트 강제
  const arr = tlAll(email);
  if (dir < 0 && tlBalance(email) < amount) return { ok: false, reason: "잔액 부족 — 이중지불이 차단되었습니다" };
  const prev = arr.length ? arr[arr.length - 1].hash : "0".repeat(64);
  const tx = { seq: arr.length, ts: Date.now(), type: o.type, amount, memo: o.memo || "", ref: o.ref || null, prev };
  tx.hash = _tlHash(tx, prev);
  arr.push(tx);
  if (!_tlSave(email, arr)) return { ok: false, reason: "원장 저장 실패" };
  return { ok: true, tx, balance: tlBalance(email) };
}
function tlEarn(m, amount, memo, ref) { return tlAppend(m, { type: "earn", amount, memo, ref }); }
function tlSpend(m, amount, memo, type, ref) { tlEnsureGenesis(m); return tlAppend(m, { type: type || "spend", amount, memo, ref }); }

/* ── 제네시스 이월 — 기존 분산 카운터 4계열을 1회 원장으로 흡수 ── */
function tlEnsureGenesis(m) {
  const email = _tlEmail(m);
  if (tlAll(email).length) return false;
  const base = (m && typeof m !== "string" && m.htkBase) ? m.htkBase : ((typeof WALLET !== "undefined" && WALLET.total) ? WALLET.total : 0);   // Phase1 §2-4: 코호트 개인화 이월(인덱스 결정론), 조성래·기존 회원은 기존값 보존
  const cp = (typeof careplanEarned === "function") ? careplanEarned(email) : 0;
  const shop = (typeof shopHtkPts === "function") ? shopHtkPts(email) : 0;
  const legacy = (typeof htkDelta === "function" && m && typeof m !== "string") ? htkDelta(m) : 0;   // 기존 온체인 델타(감소 전용)
  tlAppend(email, { type: "genesis", amount: base, memo: "기존 지갑 기준잔액 이월" });
  if (cp > 0) tlAppend(email, { type: "genesis", amount: cp, memo: "AI 케어플랜 실천 적립 이월" });
  if (shop > 0) tlAppend(email, { type: "genesis", amount: shop, memo: "건강쇼핑 적립 이월" });
  if (legacy < 0) tlAppend(email, { type: "spend", amount: Math.min(-legacy, tlBalance(email)), memo: "기존 온체인 거래(전송·스왑) 반영 이월" });
  try { localStorage.setItem(_tlKey(email) + "_snap", JSON.stringify({ cp: cp, shop: shop })); } catch (e) {}
  return true;
}

/* ── 동기화 — 레거시 적립 소스의 증가분을 차액 earn으로 흡수(이중계상 방지 스냅샷) ──
   반환: 원장 잔액(원장이 영속되지 않는 환경(게스트 쓰기가드)에서는 null → 호출부가 레거시 폴백) */
function tlSync(m) {
  const email = _tlEmail(m);
  tlEnsureGenesis(m);
  if (!tlAll(email).length) return null;                                     // 쓰기 차단 환경 — 폴백 신호
  let snap = { cp: 0, shop: 0, ref: 0 };
  try { snap = JSON.parse(localStorage.getItem(_tlKey(email) + "_snap") || "{}") || {}; } catch (e) {}
  const cp = (typeof careplanEarned === "function") ? careplanEarned(email) : 0;
  const shop = (typeof shopHtkPts === "function") ? shopHtkPts(email) : 0;
  const ref = (typeof refState === "function") ? (refState(email).htk || 0) : 0;   // 과업2ⓐ: 리퍼럴 적립도 단일 원장으로 흡수(4계열 통합 완성)
  if (cp > (snap.cp || 0)) tlEarn(email, cp - (snap.cp || 0), "AI 케어플랜 실천 적립");
  if (shop > (snap.shop || 0)) tlEarn(email, shop - (snap.shop || 0), "건강쇼핑 구매 적립");
  if (ref > (snap.ref || 0)) tlEarn(email, ref - (snap.ref || 0), "친구초대·가족등록 리워드");
  try { localStorage.setItem(_tlKey(email) + "_snap", JSON.stringify({ cp: cp, shop: shop, ref: ref })); } catch (e) {}
  return tlBalance(email);
}

/* ── 전건 재검증 — 연결 해시·트랜잭션 해시·전 구간 음수 잔액 검사 ── */
function tlVerify(m) {
  const arr = tlAll(m);
  let prev = "0".repeat(64), bal = 0;
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i];
    if (t.prev !== prev) return { ok: false, at: i, reason: "연결(prev) 해시 불일치 — 원장 순서 위변조" };
    if (_tlHash(t, prev) !== t.hash) return { ok: false, at: i, reason: "트랜잭션 해시 재계산 불일치 — 내용 위변조" };
    if (!_tlDir(t.type)) return { ok: false, at: i, reason: "허용되지 않은 유형: " + t.type };
    bal += _tlDir(t.type) > 0 ? t.amount : -t.amount;
    if (bal < 0) return { ok: false, at: i, reason: "음수 잔액 구간 — 이중지불 흔적" };
    prev = t.hash;
  }
  return { ok: true, n: arr.length, balance: bal };
}
