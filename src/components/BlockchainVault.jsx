/* ══════════ 블록체인 데이터 금고 — 100,001 회원 Merkle 앵커링 콘솔(ADMIN) ══════════ */
function BlockchainAnchorConsole({ cohort }) {
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [committed, setCommitted] = useState(null);
  const [proof, setProof] = useState(null);
  const [tamper, setTamper] = useState(null);
  const [pid, setPid] = useState("P00001");

  const run = () => {
    setBusy(true);
    setTimeout(() => {   // UI 프리징 방지 — 다음 틱에 계산
      try { const a = (typeof anchorCohort === "function") ? anchorCohort({ force: true }) : null; setAnchor(a); } catch (e) {}
      setBusy(false);
    }, 60);
  };
  const commit = () => { try { const r = (typeof commitAnchor === "function") ? commitAnchor() : null; setCommitted(r && r.block); } catch (e) {} };
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

      <div className="bcv-run">
        <button className={"obnext" + (busy ? " off" : "")} disabled={busy} onClick={run}>{busy ? "Merkle 트리 계산 중…" : anchor ? "다시 앵커링 실행" : "100,001명 앵커링 실행"} </button>
        {anchor && <button className="oblater" onClick={commit}><Hash size={14} /> superRoot 온체인 커밋</button>}
      </div>

      {anchor && (<>
        <div className="bcv-stats">
          <div className="bcv-stat"><b>{anchor.n.toLocaleString()}</b><span>앵커된 회원 leaf</span></div>
          <div className="bcv-stat"><b>{anchor.batches.length}</b><span>배치 (각 {anchor.batchSize.toLocaleString()})</span></div>
          <div className="bcv-stat"><b>SHA-256</b><span>해시 알고리즘(시뮬)</span></div>
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
