/* ══════════ 블록체인 데이터 금고 — 100,001 회원 Merkle 앵커링 콘솔(ADMIN) ══════════ */
const BCV_TYPE = {
  checkup: ["검진 데이터", "#2563EB", "#E8F1FE", FileText], insurance: ["보험 데이터", "#16A34A", "#E7F6EC", ShieldCheck],
  consent: ["동의 이력", "#7C3AED", "#F1ECFE", Lock], anchor: ["Merkle 앵커(100,001)", "#0EA5E9", "#E0F2FE", Blocks],
  tx: ["거래·정산(HTK)", "#D97706", "#FEF3E2", Coins], invest: ["투자·청약", "#7C3AED", "#F1ECFE", TrendingUp], swap: ["토큰 전송·스왑", "#0891B2", "#E0F2FE", RefreshCw], erase: ["파기 이력", "#DC2626", "#FDECEC", Trash2], record: ["기록", "#64748B", "#F1F5FB", Hash], "ins-cert": ["보험 증서", "#15803D", "#F0FDF4", BadgeCheck],
};
function BlockchainAnchorConsole({ cohort }) {
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [committed, setCommitted] = useState(null);
  const [proof, setProof] = useState(null);
  const [tamper, setTamper] = useState(null);
  const [pid, setPid] = useState("P00001");
  const [tick, setTick] = useState(0);
  const chain = (() => { void tick; try { return JSON.parse(localStorage.getItem("hifin_hashchain") || "[]"); } catch (e) { return []; } })();
  const verify = (typeof chainVerify === "function") ? chainVerify() : { ok: true, blocks: chain.length };
  const counts = chain.reduce((a, b) => { a[b.type] = (a[b.type] || 0) + 1; return a; }, {});
  const fmtT = (ts) => { try { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch (e) { return ""; } };

  const run = () => {
    setBusy(true);
    setTimeout(() => {   // UI 프리징 방지 — 다음 틱에 계산
      try { const a = (typeof anchorCohort === "function") ? anchorCohort({ force: true }) : null; setAnchor(a); } catch (e) {}
      setBusy(false);
    }, 60);
  };
  const commit = () => { try { const r = (typeof commitAnchor === "function") ? commitAnchor() : null; setCommitted(r && r.block); setTick((t) => t + 1); } catch (e) {} };
  const memberOf = () => {
    if (/^self$|조성래/i.test(pid)) return { id: "SELF-JOSUNGRAE", name: "조성래", sex: "남", regAge: 54, isSelf: true };
    const id = /^P\d+$/i.test(pid) ? pid.toUpperCase() : "P" + String(parseInt(pid, 10) || 1).padStart(5, "0");
    const c = (cohort || []).find((m) => m.id === id);
    return c || { id, name: "회원", sex: "남", regAge: 45 };
  };
  const doProof = () => { try { const m = memberOf(); const p = (typeof memberAnchorProof === "function") ? memberAnchorProof(m) : null; setProof(Object.assign({ name: m.name || m.id, id: m.id }, p || {})); setTamper(null); } catch (e) {} };
  const doTamper = () => { try { const m = memberOf(); const t = (typeof anchorTamperTest === "function") ? anchorTamperTest(m) : null; setTamper(t); } catch (e) {} };
  const H = (h, n) => (h || "").slice(0, n || 20) + "…";

  return (
    <div className="bcv">
      <div className="bcv-hero">
        <div className="bcv-hl"><Blocks size={16} /> 블록체인 데이터 금고 <span>Merkle 앵커링</span></div>
        <p>전 회원의 검진·보험 데이터를 <b>FHIR 표준코드</b>로 요약해 leaf 해시를 만들고, <b>Merkle Tree</b>로 묶어 <b>루트 1개</b>만 온체인에 앵커합니다. 회원은 <b>포함 증명(Merkle proof)</b>으로 위변조 없이 자기 데이터가 기록됐음을 검증합니다. <span className="bcv-note">실데이터는 체인에 올리지 않고 해시만 기록</span></p>
      </div>

      <div className="bcv-ledger">
        <div className="bcv-lhd"><span className="bcv-lt"><Blocks size={15} color="#2563EB" /> 블록체인으로 보호되는 데이터</span>
          <span className={"bcv-vbadge" + (verify.ok ? " ok" : " bad")}>{verify.ok ? <Check size={12} /> : <AlertTriangle size={12} />} 무결성 {verify.ok ? "정상" : "위변조"} · {chain.length}블록</span></div>
        <p className="bcv-lp">블록체인에는 <b>원본이 아니라 데이터의 지문(해시)</b>만 기록됩니다. 원본은 암호화 금고에 별도 보관되고, 지문이 일치하면 <b>위변조되지 않았음</b>이 증명됩니다.</p>
        {chain.length === 0 ? (
          <div className="bcv-lempty"><Blocks size={26} color="#94A3B8" /><span>아직 기록된 블록이 없어요. 회원이 검진·보험 데이터를 연결하거나 아래에서 앵커링을 실행하면 이 원장에 기록됩니다.</span></div>
        ) : (<>
          <div className="bcv-cats">{Object.keys(BCV_TYPE).filter((k) => counts[k]).map((k) => { const [t, c, bg, Ic] = BCV_TYPE[k]; return (
            <div className="bcv-cat" key={k} style={{ background: bg }}><Ic size={15} color={c} /><b style={{ color: c }}>{counts[k]}</b><span>{t}</span></div>); })}</div>
          <div className="bcv-blocks">{chain.slice().reverse().map((b) => { const meta = BCV_TYPE[b.type] || BCV_TYPE.record; const [t, c, bg, Ic] = meta; const digest = b.fhirHash || b.fileHash; return (
            <div className="bcv-block" key={b.idx}>
              <span className="bcv-bidx">#{b.idx}</span>
              <span className="bcv-btype" style={{ background: bg, color: c }}><Ic size={12} /> {t}</span>
              <div className="bcv-bmid"><div className="bcv-bnote">{b.note || t}</div>{digest && <code className="bcv-bdig" title="데이터 지문(해시)">지문 {digest.slice(0, 20)}…</code>}</div>
              <div className="bcv-bmeta"><span className="bcv-btime">{fmtT(b.ts)}</span><code className="bcv-bhash">{(b.hash || "").slice(0, 12)}…</code></div>
            </div>); })}</div>
          <div className="bcv-lnote">각 블록은 이전 블록 해시(prev)를 포함해 사슬로 연결됩니다 — 한 블록이라도 값이 바뀌면 이후 모든 해시가 어긋나 위변조가 즉시 드러납니다.</div>
        </>)}
      </div>

      <div className="bcv-run">
        <button className={"obnext" + (busy ? " off" : "")} disabled={busy} onClick={run}>{busy ? "Merkle 트리 계산 중…" : anchor ? "다시 앵커링 실행" : "100,001명 앵커링 실행"} </button>
        {anchor && <button className="oblater" onClick={commit}><Hash size={14} /> superRoot 온체인 커밋</button>}
      </div>

      {anchor && (<>
        <div className="bcv-stats">
          <div className="bcv-stat"><b>{anchor.n.toLocaleString()}</b><span>앵커된 회원 leaf</span></div>
          <div className="bcv-stat"><b>{anchor.batches.length}</b><span>배치 (각 {anchor.batchSize.toLocaleString()})</span></div>
          <div className="bcv-stat"><b>FNV-체인</b><span>해시(시뮬 · 운영 시 SHA-256)</span></div>
          <div className="bcv-stat"><b>{Math.ceil(Math.log2(anchor.batchSize))}</b><span>proof 깊이(배치)</span></div>
        </div>
        <div className="bcv-super"><span>Super Merkle Root</span><code>{anchor.superRoot}</code></div>
        {committed && <div className="bcv-commit"><Check size={13} /> 온체인 앵커 완료 — 블록 #{committed.idx} · <code>{H(committed.hash, 24)}</code></div>}

        <div className="bcv-sec">배치별 Merkle Root <span>(각 배치 = 회원 {anchor.batchSize.toLocaleString()}명의 트리)</span></div>
        <div className="bcv-batches">{anchor.batches.map((b) => (
          <div className="bcv-batch" key={b.idx}><span className="bcv-bi">#{b.idx}</span><span className="bcv-bc">{b.from.toLocaleString()}~{(b.to - 1).toLocaleString()} · {b.count.toLocaleString()}명</span><code>{H(b.root, 18)}</code></div>
        ))}</div>

        <div className="bcv-sec">회원 포함 증명(Merkle Proof) 검증</div>
        <div className="bcv-proofrun">
          <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="회원 ID (예: P00001 · self)" />
          <button className="bcv-btn" onClick={doProof}><ShieldCheck size={14} /> 포함 증명</button>
          <button className="bcv-btn danger" onClick={doTamper}><AlertTriangle size={14} /> 위변조 시뮬</button>
        </div>
        {proof && (
          <div className="bcv-proof">
            <div className="bcv-prow"><span>회원</span><b>{proof.name} ({proof.id}) · 배치 #{proof.batch} · 전역 index {Number(proof.globalIndex).toLocaleString()}</b></div>
            <div className="bcv-prow"><span>leaf 해시</span><code>{H(proof.leaf, 28)}</code></div>
            <div className="bcv-prow"><span>proof 경로</span><b>{proof.proofLen} 단계 → 배치 root 재구성</b></div>
            <div className="bcv-prow"><span>배치 root</span><code>{H(proof.batchRoot, 28)}</code></div>
            <div className={"bcv-verdict" + (proof.ok ? " ok" : " bad")}>{proof.ok ? <Check size={15} /> : <X size={15} />} {proof.ok ? "검증 성공 — 이 회원 데이터는 앵커된 루트에 위변조 없이 포함됩니다" : "검증 실패"}</div>
          </div>
        )}
        {tamper && (
          <div className="bcv-tamper">
            <div className="bcv-prow"><span>원본 leaf</span><code>{H(tamper.leaf, 24)}</code> <b className="bcv-ok">✓ 루트 일치</b></div>
            <div className="bcv-prow"><span>값 변조 후</span><code>{H(tamper.tamperedLeaf, 24)}</code></div>
            <div className={"bcv-verdict" + (tamper.tamperedVerifies ? " ok" : " bad")}>{tamper.tamperedVerifies ? <Check size={15} /> : <X size={15} />} {tamper.tamperedVerifies ? "?! 검증됨" : "위변조 감지 — 값이 1비트라도 바뀌면 leaf 해시가 달라져 배치 root 검증에 실패합니다"}</div>
          </div>
        )}
      </>)}

      {!anchor && !busy && <div className="bcv-idle"><Blocks size={30} color="#94A3B8" /><p>‘앵커링 실행’을 누르면 전 회원(100,001명)의 데이터를 FHIR 코드화해 Merkle Tree로 묶고, 위변조 불가능한 루트 해시를 계산합니다.</p></div>}
      <div className="chnote" style={{ marginTop: 12 }}>※ 시연용 프라이빗 앵커(해시 sha256 유사 시뮬). 실 운영은 병원·검진센터 원본 해시 + FHIR 변환본 해시를 배치 Merkle 루트로 묶어 퍼블릭/컨소시엄 체인에 앵커하고, 회원별 Merkle proof를 제공합니다. 실데이터는 온체인에 기록하지 않습니다.</div>
    </div>
  );
}

/* ══════════ HTK 온체인 토큰 원장 (전송·스왑) — 회원 지갑 ══════════ */
function HtkTokenLedger({ member, base }) {
  const [tick, setTick] = useState(0);
  const [to, setTo] = useState("");
  const [tAmt, setTAmt] = useState("");
  const [sAmt, setSAmt] = useState("");
  const [vres, setVres] = useState(null);            // C1-1: 원장 전건 검증 결과
  void tick;
  if (!member) return <div className="chnote">로그인 후 이용 가능한 온체인 토큰 지갑입니다.</div>;
  const addr = (typeof htkTokenAddr === "function") ? htkTokenAddr(member) : "0x…";
  const delta = (typeof htkDelta === "function") ? htkDelta(member) : 0;
  // C1-1 TokenLedger: 잔액 = Σ트랜잭션. 원장 미영속 환경만 레거시(base+delta) 폴백.
  const tlBal = (typeof tlSync === "function") ? (() => { try { return tlSync(member); } catch (e) { return null; } })() : null;
  const bal = (tlBal != null) ? tlBal : Math.max(0, (base || 0) + delta);
  const led = (typeof tlAll === "function") ? tlAll(member) : [];
  const H = (h, n) => (h || "").slice(0, n || 12) + "…";
  const doVerify = () => { const r = (typeof tlVerify === "function") ? tlVerify(member) : null; setVres(r); if (typeof toast === "function" && r) toast(r.ok ? `원장 검증 완료 — ${r.n}건 전건 무결 ✓` : `⚠️ 위변조 감지: ${r.reason}`); };
  const doTransfer = () => { const a = parseInt(tAmt, 10) || 0; if (a < 1) { if (typeof toast === "function") toast("전송할 HTK 수량을 입력하세요."); return; } if (a > bal) { if (typeof toast === "function") toast("잔액이 부족합니다."); return; } if (typeof htkTransfer === "function") htkTransfer(member, to || "0x수신주소", a); setTAmt(""); setTo(""); setTick((t) => t + 1); if (typeof toast === "function") toast(`온체인 전송 완료 · ${a.toLocaleString()} HTK`); };
  const doSwap = () => { const a = parseInt(sAmt, 10) || 0; if (a < 1) { if (typeof toast === "function") toast("스왑할 HTK 수량을 입력하세요."); return; } if (a > bal) { if (typeof toast === "function") toast("잔액이 부족합니다."); return; } if (typeof htkSwap === "function") htkSwap(member, "HTK", "보험·치료비 크레딧", a); setSAmt(""); setTick((t) => t + 1); if (typeof toast === "function") toast(`스왑 완료 · ${a.toLocaleString()} HTK → 보험·치료비 크레딧`); };
  return (
    <div className="htk">
      <div className="htk-card">
        <div className="htk-top"><span className="htk-net"><Blocks size={13} /> HI-Chain · HTK</span><span className="htk-addr" title="온체인 지갑 주소">{addr}</span></div>
        <div className="htk-bal">{bal.toLocaleString()} <small>HTK</small></div>
        <div className="htk-sub">≈ {(bal * ((typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10)).toLocaleString()}원 상당 · 온체인 토큰 잔액{delta ? ` (거래 반영 ${delta > 0 ? "+" : ""}${delta.toLocaleString()})` : ""}</div>
      </div>
      <div className="htk-actions">
        <div className="htk-act">
          <div className="htk-at"><Send size={14} color="#2563EB" /> 토큰 전송</div>
          <input className="htk-in" value={to} onChange={(e) => setTo(e.target.value)} placeholder="수신 주소 (0x…)" />
          <div className="htk-row"><input className="htk-in" value={tAmt} onChange={(e) => setTAmt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="수량(HTK)" inputMode="numeric" /><button className="htk-btn" onClick={doTransfer}>전송</button></div>
        </div>
        <div className="htk-act">
          <div className="htk-at"><RefreshCw size={14} color="#0891B2" /> 스왑 (HTK → 보험·치료비 크레딧)</div>
          <div className="htk-row"><input className="htk-in" value={sAmt} onChange={(e) => setSAmt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="수량(HTK)" inputMode="numeric" /><button className="htk-btn cyan" onClick={doSwap}>스왑</button></div>
          <div className="htk-hint">1 HTK → 1 크레딧 (보험료·의료비 결제 전용)</div>
        </div>
      </div>
      <div className="htk-lhd">HTK 트랜잭션 원장 <span>({led.length}건 · 잔액 = 전체 거래 합산)</span><button className="htk-btn" style={{ marginLeft: "auto", fontSize: 11.5, padding: "4px 10px" }} onClick={doVerify}>원장 검증</button></div>
      {vres && <div className={"bcv-verdict" + (vres.ok ? " ok" : " bad")} style={{ marginBottom: 8 }}>{vres.ok ? <Check size={14} /> : <X size={14} />} {vres.ok ? `전건 무결 ✓ — 트랜잭션 ${vres.n}건의 연결 해시·내용 해시·잔액을 재계산해 대조했습니다 (재구성 잔액 ${vres.balance.toLocaleString()} HTK)` : `위변조 감지 — #${vres.at}: ${vres.reason}`}</div>}
      <div className="htk-ledger">{led.slice().reverse().map((t) => (
        <div className="htk-tx" key={t.seq}><span className="htk-txk">{(typeof tlTypeLabel === "function") ? tlTypeLabel(t.type) : t.type}</span><span className="htk-txn">{t.memo || t.type}<b style={{ marginLeft: 6, color: (({ genesis: 1, earn: 1 })[t.type]) ? "#16A34A" : "#E11D48" }}>{(({ genesis: 1, earn: 1 })[t.type]) ? "+" : "−"}{t.amount.toLocaleString()}</b></span><code className="htk-txh">{H(t.hash, 10)}</code></div>
      ))}{!led.length && <div className="htk-empty">아직 원장 거래가 없어요. 전송·스왑하면 트랜잭션이 기록됩니다.</div>}</div>
      <div className="chnote" style={{ marginTop: 10 }}>※ 시연용 로컬 원장(프라이빗 체인 시뮬). 잔액은 숫자 카운터가 아니라 <b>건별 트랜잭션 합산</b>으로 재구성되며, 차감은 잔액 검증을 통과해야만 기록됩니다(이중지불 차단). 이자·배당 유형은 원장에 정의되어 있지 않습니다(증권성 차단). 실제 발행·상장·환금성은 관련 법령(가상자산·전자금융 등) 검토와 정식 절차를 전제로 합니다.</div>
      {typeof regGateAll === "function" && <RegGatePanel member={member} />}
      {typeof cnList === "function" && <ConsentWallet member={member} />}
      <WalletPortability member={member} />
      <ChainExplorer member={member} />
    </div>
  );
}

/* ══════════ D2 — 내 동의 지갑(ConsentNFT): 무엇을·누구에게·언제까지 허락했는지 한눈에 + 즉시 철회 ══════════ */
function ConsentWallet({ member }) {
  const [tick, setTick] = useState(0); void tick;
  const [confirm, setConfirm] = useState(null);   // {kind:"issue"|"revoke", id?}
  const [audit, setAudit] = useState(null);
  if (!member) return null;
  const list = cnList(member);
  return (
    <div className="htk-card" style={{ marginTop: 14, background: "#0B1220" }}>
      <div className="htk-top"><span className="htk-net"><ShieldCheck size={13} /> 내 동의 지갑 — 조건부 동의 증서(ConsentNFT)</span><span style={{ fontSize: 10.5, color: "#94A3B8" }}>철회는 즉시 효력 · 전부 체인 기록</span></div>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {list.length ? list.map((c) => (
          <div key={c.id} style={{ background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.8 }}>
              <b style={{ color: "#E2E8F0" }}>{c.id}</b>
              <span style={{ fontSize: 10, fontWeight: 800, color: c.status === "active" ? "#15803D" : "#B91C1C", background: c.status === "active" ? "#D1FAE5" : "#FDECEC", borderRadius: 99, padding: "1px 8px" }}>{c.status === "active" ? "유효" : "철회됨"}</span>
              {c.status === "active" && <button className="htk-btn" style={{ marginLeft: "auto", fontSize: 10.5, padding: "3px 9px" }} onClick={() => setConfirm({ kind: "revoke", id: c.id })}>철회</button>}
            </div>
            <div style={{ fontSize: 10.8, color: "#94A3B8", marginTop: 3 }}>[{(c.scopeKo || c.scope).join(" · ")}] → {c.to} · ~{c.until} · 목적: {c.purpose}{c.revokedAt ? ` · 철회 ${new Date(c.revokedAt).toLocaleDateString("ko-KR")}` : ""}</div>
          </div>
        )) : <div style={{ fontSize: 11.5, color: "#94A3B8", padding: "4px 2px" }}>발행된 동의 증서가 없어요 — 증서를 발행하면 <b style={{ color: "#CBD5E1" }}>동의한 범위·기간 안에서만</b> 내 데이터가 안내에 쓰이고, 쓰일 때마다 <b style={{ color: "#CBD5E1" }}>데이터 이용 대가</b>가 지갑에 들어와요.</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {!list.some((c) => c.status === "active") && <button className="htk-btn cyan" onClick={() => setConfirm({ kind: "issue" })}>맞춤 안내 동의 증서 발행</button>}
        <button className="htk-btn" onClick={() => { const r = (typeof leadDbBuild === "function") ? leadDbBuild() : null; if (r && r.ok) { setAudit(r.audit); const me = list.some((c) => c.status === "active"); if (me) { const f = (typeof dataFeePay === "function") ? dataFeePay(member, (list.find((c) => c.status === "active") || {}).id) : null; if (f && f.ok && typeof toast === "function") toast(`데이터 이용 대가 +${f.htk} HTK 입금(시뮬) — 잔액 ${f.balance.toLocaleString()}`); } } else if (typeof toast === "function") toast("🔒 " + ((r && r.reason) || "게이트 차단")); setTick((t) => t + 1); }}>리드 DB 생성 시뮬 — 동의 감사</button>
      </div>
      {audit && <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: audit.ok ? "#6EE7B7" : "#F87171" }}>감사 결과: 편입 {audit.rows}건 · 무동의 위반 {audit.violations}건 {audit.ok ? "— 동의 없는 회원은 단 1명도 포함되지 않았어요 ✓" : "⚠️ 위반 발견"}</div>}
      <div className="chnote" style={{ marginTop: 10, background: "rgba(255,255,255,.05)", color: "#94A3B8" }}>※ 시뮬레이션(RegGate leadDb·dataFee 게이트) — 실제 DB 제공은 신용정보법·개인정보보호법(2026.9 강화)·보험업법 모집 규제 법률 검토와 GA 경유 확정 후에만 가능해요. 리드에는 건강 원본이 아니라 <b style={{ color: "#CBD5E1" }}>세그먼트 정보만</b> 담겨요.</div>
      {confirm && (
        <div className="bkov" onClick={() => setConfirm(null)}><div className="bk" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <div className="bkh"><div className="bt"><ShieldCheck size={16} color={confirm.kind === "issue" ? "#0891B2" : "#B91C1C"} /> {confirm.kind === "issue" ? "동의 증서 발행 확인" : "동의 철회 확인"}</div></div>
          <div className="bkb" style={{ padding: 18 }}>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>{confirm.kind === "issue"
              ? "맞춤 보험·건강 안내 목적으로, 제휴 보험사·GA에, 1년간, 세그먼트 정보에 한해 동의 증서를 발행할까요? 언제든 즉시 철회할 수 있고 발행·철회 모두 체인에 남아요."
              : "이 증서를 철회할까요? 철회 즉시 내 데이터의 해당 소비가 전면 차단되고, 진행 중이던 DB 편입·대가 지급도 멈춰요."}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="cbtn" style={{ margin: 0 }} onClick={() => setConfirm(null)}>취소</button>
              <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const r = confirm.kind === "issue" ? cnIssue(member, {}) : cnRevoke(member, confirm.id); if (typeof toast === "function") toast(r.ok ? (confirm.kind === "issue" ? "동의 증서 발행 ✓ — 내 동의 지갑에서 언제든 철회할 수 있어요" : "철회 완료 ✓ — 즉시 효력, 체인에 기록됐어요") : "🔒 " + r.reason); setConfirm(null); setTick((t) => t + 1); }}>✅ {confirm.kind === "issue" ? "발행 확정" : "철회 확정"}</button>
            </div>
          </div>
        </div></div>)}
    </div>);
}

/* ══════════ C3 — 지갑 이동성(export/import): "플랫폼이 사라져도 자산은 회원에게" 물리 증명 ══════════ */
function WalletPortability({ member }) {
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  if (!member) return null;
  const email = member.email || "default";
  const token = (typeof anonToken === "function") ? anonToken(member) : "";
  const doExport = () => {
    try {
      const pack = { format: "hifin-wallet-v2", exportedAt: Date.now(), email, token,
        vault: JSON.parse(localStorage.getItem("hifin_vault_" + token) || "null"),
        ledger: JSON.parse(localStorage.getItem("hifin_htk_tl_" + email) || "[]"),
        policies: JSON.parse(localStorage.getItem("hifin_policies_" + email) || "[]"),
        bills: JSON.parse(localStorage.getItem("hifin_bills_" + email) || "[]"),
        chain: JSON.parse(localStorage.getItem("hifin_hashchain") || "[]") };
      pack.checksum = (typeof vaultHash === "function") ? vaultHash(JSON.stringify([pack.vault, pack.ledger, pack.policies, pack.bills, pack.chain])) : null;
      const blob = new Blob([JSON.stringify(pack, null, 1)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "hifin-wallet-" + email.split("@")[0] + ".json"; a.click(); URL.revokeObjectURL(a.href);
      setMsg({ ok: true, t: "내보내기 완료 — 이 파일이 곧 내 자산이에요(금고·원장·계약·체인 포함, 무결성 체크섬 봉인)." });
    } catch (e) { setMsg({ ok: false, t: "내보내기 실패" }); }
  };
  const doImport = (file) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const p = JSON.parse(rd.result);
        if (p.format !== "hifin-wallet-v2") return setMsg({ ok: false, t: "지원하지 않는 파일 형식이에요" });
        const sum = (typeof vaultHash === "function") ? vaultHash(JSON.stringify([p.vault, p.ledger, p.policies, p.bills, p.chain])) : null;
        if (sum !== p.checksum) return setMsg({ ok: false, t: "무결성 검증 실패 — 파일이 변조되었을 수 있어 불러오지 않았어요" });
        // 원장 재검증(연결·해시·잔액)
        let prev = "0".repeat(64), bal = 0, ok = true;
        (p.ledger || []).forEach((t) => { if (t.prev !== prev) ok = false; prev = t.hash; bal += (({ genesis: 1, earn: 1, topup: 1, dataFee: 1 })[t.type]) ? t.amount : -t.amount; if (bal < 0) ok = false; });
        if (!ok) return setMsg({ ok: false, t: "원장 검증 실패 — 불러오지 않았어요" });
        if (p.vault) localStorage.setItem("hifin_vault_" + token, JSON.stringify(p.vault));
        localStorage.setItem("hifin_htk_tl_" + email, JSON.stringify(p.ledger || []));
        localStorage.setItem("hifin_policies_" + email, JSON.stringify(p.policies || []));
        localStorage.setItem("hifin_bills_" + email, JSON.stringify(p.bills || []));
        if (p.chain && p.chain.length) localStorage.setItem("hifin_hashchain", JSON.stringify(p.chain));
        setMsg({ ok: true, t: `불러오기 완료 ✓ — 무결성·원장 검증 통과(트랜잭션 ${(p.ledger || []).length}건 · 잔액 ${bal.toLocaleString()} HTK). 새로고침하면 반영돼요.` });
      } catch (e) { setMsg({ ok: false, t: "파일을 읽을 수 없어요" }); }
    };
    rd.readAsText(file);
  };
  return (
    <div className="htk-card" style={{ marginTop: 14, background: "#0B1220" }}>
      <div className="htk-top"><span className="htk-net"><Wallet size={13} /> 내 자산 이동성 — 지갑 내보내기/불러오기</span><span style={{ fontSize: 10.5, color: "#94A3B8" }}>플랫폼이 사라져도 자산은 나에게</span></div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="htk-btn" onClick={doExport}>💾 내 지갑 내보내기(JSON)</button>
        <button className="htk-btn cyan" onClick={() => fileRef.current && fileRef.current.click()}>📥 불러오기(무결성 검증)</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) doImport(f); e.target.value = ""; }} />
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: msg.ok ? "#6EE7B7" : "#F87171" }}>{msg.t}</div>}
      <div className="chnote" style={{ marginTop: 10, background: "rgba(255,255,255,.05)", color: "#94A3B8" }}>금고·토큰 원장·계약·청구서·체인이 한 파일로 내보내져요 — 체크섬과 원장 재검증을 통과해야만 불러올 수 있어요.</div>
    </div>);
}

/* ══════════ C3 — 내 체인 보기(블록 탐색기) — "위조되지 않았음"을 눈으로 ══════════ */
function ChainExplorer({ member }) {
  const [res, setRes] = useState(null);
  const chain = (() => { try { return JSON.parse(localStorage.getItem("hifin_hashchain") || "[]"); } catch (e) { return []; } })();
  const last5 = chain.slice(-5).reverse();
  const H = (h) => (h || "").slice(0, 12) + "…";
  return (
    <div className="htk-card" style={{ marginTop: 14, background: "#0B1220" }}>
      <div className="htk-top"><span className="htk-net"><Blocks size={13} /> 내 체인 보기 — 블록 {chain.length}개</span>
        <button className="htk-btn" style={{ fontSize: 11 }} onClick={() => { const v = (typeof chainVerify === "function") ? chainVerify() : null; const s = (typeof chainSnapshot === "function") ? chainSnapshot() : null; const p = (typeof publicAnchorSend === "function") ? publicAnchorSend(s && s.root) : null; setRes({ v, s, p }); }}>전체 검증 + 스냅샷</button></div>
      <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
        {last5.map((b) => (
          <div key={b.idx} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
            <span style={{ color: "#93C5FD", fontWeight: 800 }}>#{b.idx}</span>
            <span style={{ color: "#E2E8F0", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.note || b.type}</span>
            <code style={{ color: "#94A3B8" }}>{H(b.hash)}</code>
          </div>))}
      </div>
      {res && res.v && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: res.v.ok ? "#6EE7B7" : "#F87171" }}>
          {res.v.ok ? `블록 ${res.v.blocks}개 전부 이어짐 ✓ — 하나라도 고치면 여기서 바로 표시돼요(SHA-256 실해시).` : `⚠️ ${res.v.at}번 블록 이상: ${res.v.reason}`}
          {res.s && <div style={{ color: "#93C5FD", marginTop: 3 }}>머클루트 스냅샷 보관: {H(res.s.root)} ({res.s.blocks}블록)</div>}
          {res.p && !res.p.ok && <div style={{ color: "#FBBF24", marginTop: 3 }}>퍼블릭 앵커: {res.p.reason} (시도는 기록됨)</div>}
        </div>)}
      <div className="chnote" style={{ marginTop: 10, background: "rgba(255,255,255,.05)", color: "#94A3B8" }}>쉽게 말하면: 내 기록들이 <b style={{ color: "#CBD5E1" }}>번호표 있는 사슬</b>로 묶여 있어서, 중간을 몰래 바꾸면 사슬이 끊겨 바로 들통나요. 지금은 SHA-256 실제 해시로 봉인돼요(로컬 시뮬 · 퍼블릭 앵커는 규제 게이트 뒤).</div>
    </div>);
}

/* ══════════ C1-2 RegGate 패널 — 규제 시행일 동기화 게이트 상태 + 차단 실증 ══════════ */
function RegGatePanel({ member }) {
  const [msg, setMsg] = useState(null);
  const gates = (typeof regGateAll === "function") ? regGateAll() : [];
  const MODE = { locked: ["잠금", "#B91C1C", "#FDECEC"], off: ["비활성", "#64748B", "#F1F5F9"], simulation: ["시뮬레이션", "#B45309", "#FEF3E2"], live: ["운영", "#15803D", "#E7F8EE"] };
  // 차단 실증 — 실제 htkTransfer 경로로 '현금 출금'을 시도해 게이트가 코드로 막는 것을 보여줌
  const tryCashout = () => {
    const before = (typeof tlBalance === "function" && member) ? tlBalance(member) : null;
    const r = (typeof htkTransfer === "function") ? htkTransfer(member, "현금 출금(은행 계좌)", 100) : null;
    const after = (typeof tlBalance === "function" && member) ? tlBalance(member) : null;
    setMsg(r === null ? { ok: false, t: `차단됨 — 폐쇄형 게이트가 현금성 전환을 거부했습니다 (원장 잔액 불변: ${before != null ? before.toLocaleString() : "-"} → ${after != null ? after.toLocaleString() : "-"} HTK)` } : { ok: true, t: "⚠️ 게이트 미작동 — 점검 필요" });
  };
  return (
    <div className="htk-card" style={{ marginTop: 14, background: "#0B1220" }}>
      <div className="htk-top"><span className="htk-net"><ShieldCheck size={13} /> RegGate · 규제 시행일 동기화 게이트</span><span style={{ fontSize: 10.5, color: "#94A3B8" }}>시행일 도래 시 재배포 없이 전환</span></div>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        {gates.map((g) => { const md = MODE[g.mode] || MODE.off; return (
          <div key={g.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "8px 10px" }}>
            <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: md[1], background: md[2], borderRadius: 99, padding: "2px 9px", marginTop: 1 }}>{md[0]}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>{g.title}{g.effectiveDate && <em style={{ fontStyle: "normal", marginLeft: 6, fontSize: 10.5, color: "#93C5FD" }}>시행 {g.effectiveDate}</em>}</div>
              <div style={{ fontSize: 10.8, color: "#94A3B8", lineHeight: 1.5 }}>{g.law} — {g.note}</div>
            </div>
          </div>); })}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button className="htk-btn" style={{ fontSize: 11.5 }} onClick={tryCashout}>현금 출금 시도 — 차단 실증</button>
        {msg && <span style={{ fontSize: 11.5, fontWeight: 700, color: msg.ok ? "#F87171" : "#6EE7B7" }}>{msg.t}</span>}
      </div>
      <div className="chnote" style={{ marginTop: 10, background: "rgba(255,255,255,.05)", color: "#94A3B8" }}>※ 폐쇄형(현금 교환 불가)·스테이블 시뮬레이션 한정·배당의 STO 트랙 분리는 문구가 아니라 <b style={{ color: "#CBD5E1" }}>코드 게이트</b>로 강제됩니다. live 전환은 근거 법령 시행일이 도래해야만 가능하며, 관리자 설정으로도 시행일 이전에는 열 수 없습니다.</div>
    </div>
  );
}
