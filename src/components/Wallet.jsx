/* 지갑 데이터(WALLET·WALLET_EARN·WALLET_USE·WALLET_GUIDE·WALLET_SEC) → src/data/sectionData.js 로 이관 */

function WalletSection({ onGo }) {
  const [tab, setTab] = useState("earn");
  const go = onGo || (() => {});
  const tabs = [["earn", "적립 현황", Coins], ["use", "사용처", Wallet], ["guide", "사용방법", Sparkles], ["sec", "AI·블록체인 보안", ShieldCheck]];
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const cpPts = (dm && typeof careplanEarned === "function") ? careplanEarned(dm.email) : 0;
  const total = WALLET.total + cpPts;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="wallet" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강금융지갑</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Health Token 적립·사용 · 보험료·병원·건강제품·식단 결제 · AI·블록체인 보안 설계</div></div></div>
      <DemoMemberBanner />

      <div className="wbal">
        <span className="wglow" />
        <div className="wlbl"><Coins size={14} /> 총 적립 Health Token</div>
        <div className="wtot">{total.toLocaleString()} <small>HTK</small></div>
        <div className="wsub">≈ {(total * WALLET.rate).toLocaleString()}원 상당 · 멤버십 등급 <b>{WALLET.grade}</b>{cpPts > 0 && <span style={{ marginLeft: 8, color: "#A7F3D0", fontWeight: 700 }}>· AI 케어플랜 실천 +{cpPts.toLocaleString()} 포함</span>}</div>
        <div className="wrow">
          <div><b style={{ color: "#A7F3D0" }}>+{WALLET.monthEarn.toLocaleString()}</b><span>이번 달 적립</span></div>
          <div><b style={{ color: "#FECACA" }}>−{WALLET.monthUse.toLocaleString()}</b><span>이번 달 사용</span></div>
          <div><b>{(WALLET.total - 8200).toLocaleString()}</b><span>전월 대비 ▲</span></div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, opacity: .95 }}><ShieldCheck size={14} /> AI·블록체인 보안 설계</div>
        </div>
      </div>

      <div className="chtabs" style={{ marginTop: 14 }}>{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "earn" && (<>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><Coins size={14} color="#16A34A" style={{ verticalAlign: "-2px" }} /> 항목별 적립 토큰 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· {WALLET_EARN.length}개 적립 채널</span></div>
        <div className="wgrid">
          {dm && (
          <div className="wcard" style={{ borderColor: "#16A34A", background: "linear-gradient(180deg,#F3FCF6,#fff)" }}><span className="wi" style={{ background: "#E7F8EE" }}><Art name="heart" size={22} /></span>
            <div style={{ flex: 1 }}><div className="wn">AI 케어플랜 실천 적립 <span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE", fontSize: 10, padding: "1px 6px" }}>NEW</span></div><div className="wd">종합 케어플랜 영역을 완료하면 자동 적립 (병원·검진·영양·기기·식단·제도)</div></div>
            <span className="wamt" style={{ color: "#16A34A" }}>+{cpPts.toLocaleString()}</span></div>
          )}
          {WALLET_EARN.map(([a, t, amt, d, c], i) => (
          <div className="wcard" key={i}><span className="wi" style={{ background: c + "1A" }}><Art name={a} size={22} /></span>
            <div style={{ flex: 1 }}><div className="wn">{t}</div><div className="wd">{d}</div></div>
            <span className="wamt" style={{ color: "#16A34A" }}>{amt}</span></div>
        ))}</div>
        <div className="chnote">※ 적립률·항목은 데모 예시입니다. 건강활동·데이터 제공·소비에 따라 Health Token이 자동 적립됩니다.</div>
      </>)}

      {tab === "use" && (<>
        <div className="benefit"><span><Art name="badge" size={16} /> 보험료 결제</span><span><Art name="building" size={16} /> 병원·검진비</span><span><Art name="pill" size={16} /> 건강제품</span><span><Art name="meal" size={16} /> 건강식단</span></div>
        {WALLET_USE.map(([a, t, d, lim, c], i) => (
          <div className="adv" key={i}><span className="ic" style={{ background: c + "1A" }}><Art name={a} size={20} /></span>
            <div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div>
            <div style={{ alignSelf: "center", textAlign: "right" }}><span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE" }}>{lim}</span><div style={{ marginTop: 6 }}><button className="book" style={{ padding: "7px 12px" }} onClick={() => go(t.includes("보험") ? "insurance" : t.includes("병원") ? "hospital" : t.includes("식단") ? "shop" : "shop")}>사용하기</button></div></div>
          </div>
        ))}
        <div className="chnote">※ 사용한도는 데모 예시입니다. 적립 토큰은 <b>플랫폼이 환전하여 현금(카드·계좌)으로 결제·정산</b>되며(가상자산 아님), 토큰 우선 차감 후 잔액은 현금결제됩니다. 스테이블코인 등 가상자산 직접 결제는 <b>법률 제정 후 도입</b> 예정입니다.</div>
      </>)}

      {tab === "guide" && (<>
        <div className="airec"><div className="at"><Sparkles size={16} color="#7C3AED" /> 이렇게 쓰면 좋아요 · 사용 사례</div><div className="ap">건강활동으로 토큰을 적립하고, 보험료·병원·건강제품·식단 결제에 사용하는 대표 사례예요.</div></div>
        {WALLET_GUIDE.map((g) => (
          <div className="gcase" key={g.n}>
            <div className="gh"><span className="gn">{g.n}</span> {g.t}</div>
            <div className="gd">{g.d}</div>
            <div className="gchips">{g.chips.map(([cls, txt], i) => <span key={i} className={cls}>{txt}</span>)}</div>
          </div>
        ))}
        <div className="chnote">※ 예시 수치는 데모입니다. 실제 적립·사용액은 활동·정책에 따라 달라집니다.</div>
      </>)}

      {tab === "sec" && (<>
        <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,#0B1F4D,#2F5BEA 60%,#7C3AED)", color: "#fff", borderRadius: 16, padding: "18px 18px", boxShadow: "0 16px 32px -20px rgba(47,91,234,.8)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={26} color="#fff" /></span>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.55 }}><b style={{ color: "#A7F3D0" }}>핀테크·헬스케어급 다층 보안</b>을 적용해 적립·환전·결제의 <b style={{ color: "#FDE68A" }}>위·변조 방지와 이상거래 탐지를 강화</b>합니다. <span style={{ opacity: .82, fontWeight: 600 }}>(설계 목표 · 현재 데모)</span></div>
        </div>

        <div className="card" style={{ marginTop: 12, border: "1.5px solid #BFD0FF", background: "linear-gradient(180deg,#F7F9FF,#fff)" }}>
          <div className="rct"><Coins size={18} color="#2563EB" /> 결제 방식 안내</div>
          <div className="adv"><span className="ic" style={{ background: "#E7F8EE" }}><Art name="coin" size={20} /></span><div style={{ flex: 1 }}><b>현재 — 포인트 환전 후 현금결제</b><p>적립된 Health Token은 <b>플랫폼이 환전하여 현금(카드·계좌)으로 결제·정산</b>합니다. 가상자산이 아닌 포인트로 운영됩니다.</p></div></div>
          <div className="adv"><span className="ic" style={{ background: "#FEF3E2" }}><Art name="hash" size={20} /></span><div style={{ flex: 1 }}><b>향후 — 가상자산 결제(법제화 후)</b><p>스테이블코인 등 <b>가상자산 직접 결제는 관련 법률 제정 후 도입</b> 예정이며, 블록체인 온체인 정산·SBT 증서도 그 단계에서 적용합니다.</p></div></div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="rct"><Lock size={18} color="#2F5BEA" /> 보안 핵심 기술 <span style={{ fontSize: 11.5, color: "var(--soft)", fontWeight: 600 }}>· 포인트·현금결제 기준</span></div>
          {WALLET_SEC.map(([a, t, d], i) => (
            <div className="adv" key={i}><span className="ic" style={{ background: "#EAF0FE" }}><Art name={a} size={20} /></span><div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div></div>
          ))}
          <div className="benefit" style={{ marginTop: 10, marginBottom: 0 }}><span><Art name="lock" size={16} /> 전송·저장 암호화</span><span><Art name="hash" size={16} /> 위·변조 방지</span><span><Art name="badge" size={16} /> 본인인증·MFA</span><span><Art name="sparkle" size={16} /> 이상거래 탐지</span></div>
        </div>
        <div className="chnote">※ <b>현재는 데모(프론트엔드 시제품)이며 실제 결제·암호화는 구현되어 있지 않습니다.</b> 적립 토큰은 가상자산이 아닌 <b>포인트로 운영되어 플랫폼 환전 후 현금결제</b>되며, 스테이블코인 등 가상자산 결제는 <b>법률 제정 후</b> 진행합니다. 완전한 보안을 보장하는 시스템은 없으며, 실제 서비스는 전자금융거래법·개인정보보호법 및 보안인증(ISMS-P 등)에 따라 단계적으로 구현됩니다.</div>
      </>)}
    </div>
  );
}

/* ====================== Health NFT ====================== */
// 보유: {art,type,name,meta,id,to,col}
