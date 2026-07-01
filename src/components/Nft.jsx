/* NFT 데이터(NFT_MINE·NFT_ISSUE·NFT_USE·NFT_SEC) → src/data/sectionData.js 로 이관 */

function NFTSection({ onGo }) {
  const [tab, setTab] = useState("mine");
  const go = onGo || (() => {});
  const tabs = [["mine", "내 Health NFT", BadgeCheck], ["issue", "발급 종류", FileText], ["use", "활용·연계", Sparkles], ["sec", "무결성·보안", ShieldCheck]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="nft" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>Health NFT</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강인증서·검진/보험 증서(SBT) · 건강리포트 NFT · 의료기록 무결성 · 데이터 제공 증명</div></div></div>
      <DemoMemberBanner />

      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "mine" && (<>
        <div className="benefit">
          <span><Art name="badge" size={16} /> 보유 {NFT_MINE.length}개</span>
          <span><Art name="lock" size={16} /> SBT 양도불가</span>
          <span><Art name="hash" size={16} /> 위·변조 방지</span>
          <span><Art name="coin" size={16} /> 데이터 제공 보상 연계</span>
        </div>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><BadgeCheck size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> 조성래님 건강지갑 NFT/SBT</div>
        <div className="nftgrid">{NFT_MINE.map((n, i) => (
          <div className="nftc" key={i}>
            <div className="nh"><span className="ni" style={{ background: n.col + "1A" }}><Art name={n.art} size={24} /></span>
              <div style={{ flex: 1 }}><span className="cbadge" style={{ color: n.col, background: n.col + "14" }}>{n.type}</span><span className="sbtbadge" style={{ marginLeft: 5 }}>SBT</span><div className="nname" style={{ marginTop: 5 }}>{n.name}</div><div className="nmeta">{n.meta}</div></div></div>
            <div className="nfoot"><span className="nftid">{n.id}</span><button className="book" style={{ marginLeft: "auto", padding: "7px 12px" }} onClick={() => go(n.to)}>연계 보기</button></div>
          </div>
        ))}</div>
        <div className="chnote">※ 표시된 토큰 ID·내역은 예시입니다. NFT/SBT는 검진·보험·건강관리 활동에 따라 본인 건강지갑에 발행됩니다.</div>
      </>)}

      {tab === "issue" && (<>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><FileText size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 발급되는 Health NFT 종류</div>
        {NFT_ISSUE.map(([a, t, d], i) => (
          <div className="adv" key={i}><span className="ic" style={{ background: "#F1ECFE" }}><Art name={a} size={20} /></span><div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div></div>
        ))}
        <div className="chnote">※ 각 활동(검진 예약·보험 가입·리포트 분석·데이터 제공)이 완료되면 해당 NFT/SBT가 자동 발행되도록 설계됩니다.</div>
      </>)}

      {tab === "use" && (<>
        <div className="airec"><div className="at"><Sparkles size={16} color="#7C3AED" /> Health NFT는 이렇게 쓰여요 · 연계 사례</div><div className="ap">검진·보험·진료·데이터 활동으로 발행된 NFT/SBT를 증빙·인증·보상·공유에 활용합니다.</div></div>
        {NFT_USE.map((g) => (
          <div className="gcase" key={g.n}>
            <div className="gh"><span className="gn">{g.n}</span> {g.t}</div>
            <div className="gd">{g.d}</div>
            <div className="gchips" style={{ alignItems: "center" }}><span className="ern">연계 · {g.chip}</span><button className="book" style={{ padding: "6px 11px", marginLeft: 4 }} onClick={() => go(g.to)}>{g.chip} 이동</button></div>
          </div>
        ))}
        <div className="chnote">※ 예시 흐름은 예시입니다. 실제 연계·증빙은 각 서비스·기관 연동 시 동작합니다.</div>
      </>)}

      {tab === "sec" && (<>
        <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,#4C1D95,#7C3AED 60%,#2F5BEA)", color: "#fff", borderRadius: 16, padding: "18px 18px", boxShadow: "0 16px 32px -20px rgba(124,58,237,.8)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={26} color="#fff" /></span>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.55 }}>건강·보험 인증서를 <b style={{ color: "#DDD6FE" }}>양도불가 SBT</b>로 발행하고, <b style={{ color: "#FDE68A" }}>온체인 해시로 위·변조를 방지</b>하도록 설계합니다. <span style={{ opacity: .82, fontWeight: 600 }}>(설계 목표 · 시제품)</span></div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <div className="rct"><Lock size={18} color="#7C3AED" /> 무결성·보안 설계</div>
          {NFT_SEC.map(([a, t, d], i) => (
            <div className="adv" key={i}><span className="ic" style={{ background: "#F1ECFE" }}><Art name={a} size={20} /></span><div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div></div>
          ))}
          <div className="benefit" style={{ marginTop: 10, marginBottom: 0 }}><span><Art name="lock" size={16} /> 양도불가(SBT)</span><span><Art name="hash" size={16} /> 온체인 무결성</span><span><Art name="badge" size={16} /> 선택 공개</span><span><Art name="sparkle" size={16} /> 위·변조 탐지</span></div>
        </div>
        <div className="chnote">※ <b>현재는 시연용(프론트엔드 시제품)이며 실제 블록체인 발행·온체인 정산은 구현되어 있지 않습니다.</b> 온체인 NFT/SBT·가상자산 연계는 관련 <b>법률 제정 후 단계적으로 도입</b>되며, 그 전까지 인증서는 플랫폼 내 무결성 검증·암호화 보관으로 운영됩니다. 원문 건강정보는 오프체인 암호화 보관, 온체인엔 해시만 기록합니다.</div>
      </>)}
    </div>
  );
}

/* ====================== 마이페이지 ====================== */
