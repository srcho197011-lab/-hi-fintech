/* ══════════════ 100,001 회원 데이터 블록체인 앵커링 (FHIR leaf → Merkle Tree → 배치 앵커 → proof 검증) ══════════════
   전 회원의 검진·보험 데이터를 FHIR 표준코드로 요약해 leaf 해시를 만들고, Merkle Tree로 묶어 루트 1개만 온체인 앵커.
   회원은 Merkle proof로 자기 데이터가 루트에 포함됐음을 검증하고, 값이 바뀌면 루트 불일치로 위변조가 드러난다.
   ⚠️ 데모: 해시는 sha256 유사 시뮬(vaultHash 재사용), 프라이빗 앵커. 실데이터는 온체인 미기록(해시만). */

/* 조성래(100,001번째) 앵커용 객체 */
function _anchorSelf() { return { id: "SELF-JOSUNGRAE", name: "조성래", sex: "남", regAge: 54, isSelf: true }; }

/* 회원 → FHIR 코드화 요약(LOINC:값 + 실손세대·진단비) → leaf 해시(결정론) */
function memberDataLeaf(m) {
  const ck = (typeof synthCheckupValues === "function") ? synthCheckupValues(m) : {};
  const ins = m._ins || (m.isSelf && typeof selfInsurance === "function" ? selfInsurance() : (typeof memberInsurance === "function" ? memberInsurance(m) : null));
  const token = (typeof anonToken === "function") ? anonToken(m) : (m.id || m.name);
  const fhir = (typeof CKUP_LOINC !== "undefined") ? ["glucose", "sbp", "tchol", "ast", "cr", "hb"].map((k) => (CKUP_LOINC[k] ? CKUP_LOINC[k].loinc : k) + ":" + (ck[k] != null ? ck[k] : "")).join("|") : "";
  const insD = ins && ins.silson ? (ins.silson.gen + ":" + (ins.riders || []).map((r) => r.cat + r.benefit).join(",")) : "";
  return vaultHash("leaf|" + token + "|" + fhir + "|" + insD);
}

/* ── Merkle Tree ── */
function _mParent(a, b) { return vaultHash(a + b); }
function merkleRoot(leaves) { if (!leaves.length) return "0".repeat(64); let lvl = leaves; while (lvl.length > 1) { const nx = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = (i + 1 < lvl.length) ? lvl[i + 1] : lvl[i]; nx.push(_mParent(a, b)); } lvl = nx; } return lvl[0]; }
function merkleProof(leaves, index) {
  const proof = []; let lvl = leaves, idx = index;
  while (lvl.length > 1) {
    const sibIdx = idx % 2 === 0 ? Math.min(idx + 1, lvl.length - 1) : idx - 1;
    proof.push({ sib: lvl[sibIdx], right: idx % 2 === 0 });
    const nx = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = (i + 1 < lvl.length) ? lvl[i + 1] : lvl[i]; nx.push(_mParent(a, b)); }
    idx = Math.floor(idx / 2); lvl = nx;
  }
  return proof;
}
function verifyProof(leaf, proof, root) { let h = leaf; for (const p of proof) h = p.right ? _mParent(h, p.sib) : _mParent(p.sib, h); return h === root; }

/* ── 배치 앵커링: 100,001 회원 → 배치별 Merkle root → super Merkle root ── */
let _anchorCache = null;
function anchorMembers() { const c = (typeof pilotCohort === "function") ? pilotCohort() : []; return c.concat([_anchorSelf()]); }
function anchorCohort(opts) {
  opts = opts || {};
  if (_anchorCache && !opts.force) return _anchorCache;
  const members = anchorMembers();
  const batchSize = opts.batchSize || 10000;
  const batches = [];
  for (let i = 0; i < members.length; i += batchSize) {
    const chunk = members.slice(i, i + batchSize);
    const leaves = chunk.map(memberDataLeaf);
    batches.push({ idx: batches.length, from: i, to: i + chunk.length, count: chunk.length, root: merkleRoot(leaves) });
  }
  const superRoot = merkleRoot(batches.map((b) => b.root));
  _anchorCache = { n: members.length, batchSize, batches, superRoot, builtAt: Date.now() };
  return _anchorCache;
}
/* super root를 프라이빗 앵커 체인에 커밋(온체인 앵커 시뮬) */
function commitAnchor(opts) {
  const a = anchorCohort(opts);
  const block = (typeof chainAppend === "function") ? chainAppend({ type: "anchor", token: null, fhirHash: a.superRoot, note: `Merkle 앵커: 회원 ${a.n.toLocaleString()}명 · 배치 ${a.batches.length} · superRoot` }) : null;
  return { anchor: a, block };
}

/* ── 특정 회원의 Merkle proof(포함 증명) ── */
function _memberGlobalIndex(m, n) {
  if (m && m.isSelf) return n - 1;
  if (m && typeof m.id === "string" && /^P\d+$/.test(m.id)) return parseInt(m.id.slice(1), 10) - 1;
  return 0;
}
function memberAnchorProof(m, opts) {
  const a = anchorCohort(opts);
  const gi = Math.max(0, Math.min(a.n - 1, _memberGlobalIndex(m, a.n)));
  const bIdx = Math.floor(gi / a.batchSize);
  const batch = a.batches[bIdx];
  const members = anchorMembers();
  const chunk = members.slice(batch.from, batch.to);
  const leaves = chunk.map(memberDataLeaf);
  const localIdx = gi - batch.from;
  const leaf = leaves[localIdx];
  const proof = merkleProof(leaves, localIdx);
  const ok = verifyProof(leaf, proof, batch.root);
  return { globalIndex: gi, batch: bIdx, leaf, proof, proofLen: proof.length, batchRoot: batch.root, superRoot: a.superRoot, ok };
}
/* ── HTK 지갑·거래·정산 원장 블록체인 기록 ──
   적립·사용·전송·정산 트랜잭션을 해시체인에 기록(지문만). 회원/지갑 원장의 위변조 방지. */
function txAnchor(o) {
  o = o || {};
  let token = o.token;
  if (!token) { try { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; token = m && typeof anonToken === "function" ? anonToken(m) : "wallet"; } catch (e) { token = "wallet"; } }
  const amt = o.amount != null ? Number(o.amount).toLocaleString() + " " + (o.unit || "HTK") : "";
  const note = [o.kind || "거래", amt, o.memo].filter(Boolean).join(" · ");
  const digest = (typeof vaultHash === "function") ? vaultHash("tx|" + token + "|" + (o.kind || "") + "|" + (o.amount || "") + "|" + (o.memo || "") + "|" + (o.ts || "")) : null;
  return (typeof chainAppend === "function") ? chainAppend({ type: o.ttype || "tx", token, fhirHash: digest, note }) : null;
}

/* ── HTK 온체인 토큰 원장 (전송·스왑) — 지갑 주소·잔액·트랜잭션 ── */
function htkTokenAddr(member) { const t = (typeof anonToken === "function" && member) ? anonToken(member) : "wallet"; return "0x" + vaultHash("htk-addr|" + t).slice(0, 16); }
function htkDelta(member) { try { const t = (typeof anonToken === "function" && member) ? anonToken(member) : "wallet"; return Number(JSON.parse(localStorage.getItem("hifin_htkbal_" + t) || "0")) || 0; } catch (e) { return 0; } }
function _htkAdjust(member, d) { try { const t = (typeof anonToken === "function" && member) ? anonToken(member) : "wallet"; localStorage.setItem("hifin_htkbal_" + t, JSON.stringify(htkDelta(member) + d)); } catch (e) {} }
/* C1-1: 차감은 TokenLedger(단일 원장) 검증을 먼저 통과해야 실행 — 이중지불·음수 잔액 차단. 레거시 델타는 무중단 병행.
   C1-2: 현금성 목적지(현금·원화·출금·스테이블 등)는 RegGate(폐쇄형·시행일 동기화)가 코드로 차단. */
function htkTransfer(member, to, amount, memo) { amount = Math.max(0, Math.floor(amount || 0)); if (!amount) return null; if (typeof regGateCashGuard === "function") { const g = regGateCashGuard(String(to || "") + " " + String(memo || "")); if (!g.ok) { if (typeof toast === "function") toast("🔒 " + g.reason); return null; } } if (typeof tlSpend === "function") { const r = tlSpend(member, amount, "전송 → " + (to || "0x…") + (memo ? " · " + memo : ""), "transfer"); if (r && !r.ok) { if (typeof toast === "function") toast("🔒 " + r.reason); return null; } } _htkAdjust(member, -amount); return txAnchor({ ttype: "swap", token: (typeof anonToken === "function" && member) ? anonToken(member) : null, kind: "HTK 전송", amount, memo: "→ " + (to || "0x…") + (memo ? " · " + memo : "") }); }
function htkSwap(member, from, to, amount) { amount = Math.max(0, Math.floor(amount || 0)); if (!amount) return null; if (typeof regGateCashGuard === "function") { const g = regGateCashGuard(String(to || "")); if (!g.ok) { if (typeof toast === "function") toast("🔒 " + g.reason); return null; } } if (typeof tlSpend === "function") { const r = tlSpend(member, amount, (from || "HTK") + " → " + (to || "보험·치료비 크레딧"), "swap"); if (r && !r.ok) { if (typeof toast === "function") toast("🔒 " + r.reason); return null; } } _htkAdjust(member, -amount); return txAnchor({ ttype: "swap", token: (typeof anonToken === "function" && member) ? anonToken(member) : null, kind: "HTK 스왑", amount, memo: (from || "HTK") + " → " + (to || "보험·치료비 크레딧") }); }
function htkLedger(member) { const t = (typeof anonToken === "function" && member) ? anonToken(member) : "wallet"; return (typeof chainForToken === "function") ? chainForToken(t).filter((b) => b.type === "swap") : []; }

/* 위변조 시뮬: 회원 값이 바뀌면 leaf가 달라져 같은 proof·root로 검증 실패 */
function anchorTamperTest(m, opts) {
  const p = memberAnchorProof(m, opts);
  const tampered = vaultHash(p.leaf + "|VALUE-CHANGED");
  return { original: p.ok, tamperedVerifies: verifyProof(tampered, p.proof, p.batchRoot), leaf: p.leaf, tamperedLeaf: tampered, root: p.batchRoot };
}
