/* 지갑 데이터(WALLET·WALLET_EARN·WALLET_USE·WALLET_GUIDE·WALLET_SEC) → src/data/sectionData.js 로 이관 */

function WalletSection({ onGo }) {
  const [tab, setTab] = useState("earn");
  const go = onGo || (() => {});
  const tabs = [["earn", "적립 현황", Coins], ["give", "나눔·기부", HeartHandshake], ["use", "사용처", Wallet], ["chain", "온체인 원장", Blocks], ["guide", "사용방법", Sparkles], ["sec", "AI·블록체인 보안", ShieldCheck]];
  const manwon = (n) => n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원";
  const won = (n) => n.toLocaleString() + "원";
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const cpPts = (dm && typeof careplanEarned === "function") ? careplanEarned(dm.email) : 0;
  const shopPts = (typeof shopHtkPts === "function") ? shopHtkPts(dm ? dm.email : "default") : 0;
  const shopWonBal = (typeof shopHtkWon === "function") ? shopHtkWon(dm ? dm.email : "default") : 0;
  const total = WALLET.total + cpPts + shopPts;
  const insRes = (typeof htkInsReserve === "function") ? htkInsReserve(total) : Math.floor(total * 0.30);
  const genRes = total - insRes;
  const insPct = (typeof HTK_INS_RATE !== "undefined") ? Math.round(HTK_INS_RATE * 100) : 30;
  // 재무회계 연동 — 플랫폼 나눔/적립(제품마진 50/30/20). 1차연도(10만 회원) 기준 연간.
  const fs = (typeof finSocial === "function") ? finSocial(0) : { give: 196650000, earn: 327750000, beneficiaries: 771 };
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="wallet" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강금융지갑</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>판매마진의 <b style={{ color: "#16A34A" }}>50%는 건강적립금</b>으로, <b style={{ color: "#E11D48" }}>{WALLET_SPLIT.give}%는 치료비 사각지대 나눔</b>으로 — 적립하고 나누는 건강금융</div></div></div>
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

      <div className="wins">
        <div className="wins-h"><span className="wins-ic"><ShieldCheck size={17} /></span><div><b>보험·치료비 적립금 <span className="wins-tag">우선 적립 {insPct}%</span></b><p>적립되는 Health Token의 <b>{insPct}%</b>를 <b>보험료·의료비 결제 전용</b> 적립금으로 <b>우선 적립</b>합니다.</p></div></div>
        <div className="wins-grid">
          <div className="wins-box pri"><span className="wl"><ShieldCheck size={12} /> 보험·치료비 적립금 <em>{insPct}% 우선</em></span><b>{insRes.toLocaleString()} <small>HTK</small></b><span className="ww">≈ {(insRes * WALLET.rate).toLocaleString()}원 · 보험료·치료비 결제</span></div>
          <div className="wins-box"><span className="wl"><Coins size={12} /> 일반 적립금 <em>{100 - insPct}%</em></span><b>{genRes.toLocaleString()} <small>HTK</small></b><span className="ww">≈ {(genRes * WALLET.rate).toLocaleString()}원 · 쇼핑·건강활동 사용</span></div>
        </div>
        <div className="wins-bar"><span className="pri" style={{ width: insPct + "%" }}>{insPct}%</span><span className="gen" style={{ width: (100 - insPct) + "%" }}>{100 - insPct}%</span></div>
      </div>

      <div className="wsplit">
        <div className="wsplit-h"><span className="ic"><Coins size={16} /></span><div><b>판매마진 분배 구조</b><p>회원의 소비가 <b style={{ color: "#16A34A" }}>나를 위한 적립</b>과 <b style={{ color: "#E11D48" }}>이웃을 위한 나눔</b>이 됩니다</p></div></div>
        <div className="wsplit-bar">
          <div className="seg earn" style={{ width: WALLET_SPLIT.earn + "%" }}>{WALLET_SPLIT.earn}%</div>
          <div className="seg give" style={{ width: WALLET_SPLIT.give + "%" }}>{WALLET_SPLIT.give}%</div>
          <div className="seg ops" style={{ width: WALLET_SPLIT.ops + "%" }}>{WALLET_SPLIT.ops}%</div>
        </div>
        <div className="wsplit-legend">
          <div><span className="dot earn" /> <b>{WALLET_SPLIT.earn}%</b> 건강적립금 <small>회원에게 Health Token 적립</small></div>
          <div><span className="dot give" /> <b>{WALLET_SPLIT.give}%</b> 치료비 나눔 <small>치료비 사각지대 기부</small></div>
          <div><span className="dot ops" /> <b>{WALLET_SPLIT.ops}%</b> 플랫폼 운영 <small>서비스·안전 준비금</small></div>
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
          {shopPts > 0 && (
          <div className="wcard" style={{ borderColor: "#F97316", background: "linear-gradient(180deg,#FFF7ED,#fff)" }}><span className="wi" style={{ background: "#FFEDD5" }}><Art name="capsule" size={22} /></span>
            <div style={{ flex: 1 }}><div className="wn">건강쇼핑 구매 적립 <span className="cbadge" style={{ color: "#C2410C", background: "#FFEDD5", fontSize: 10, padding: "1px 6px" }}>실적립</span></div><div className="wd">건강쇼핑(영양제·AI 상담사) 주문 시 판매마진 25%를 실제 적립 · 누적 {won(shopWonBal)}</div></div>
            <span className="wamt" style={{ color: "#F97316" }}>+{shopPts.toLocaleString()}</span></div>
          )}
          {WALLET_EARN.map(([a, t, amt, d, c], i) => (
          <div className="wcard" key={i}><span className="wi" style={{ background: c + "1A" }}><Art name={a} size={22} /></span>
            <div style={{ flex: 1 }}><div className="wn">{t}</div><div className="wd">{d}</div></div>
            <span className="wamt" style={{ color: "#16A34A" }}>{amt}</span></div>
        ))}</div>
        <div className="chnote">※ 적립률·항목은 예시입니다. 건강활동·데이터 제공·소비에 따라 Health Token이 자동 적립됩니다.</div>
      </>)}

      {tab === "give" && (<>
        <div className="wgive-hero">
          <div className="gh-l"><span className="ic"><HeartHandshake size={24} color="#fff" /></span>
            <div><b>치료비 사각지대 나눔</b><p>판매마진의 <b>{WALLET_SPLIT.give}%</b>를 치료비 사각지대 이웃의 치료비로 기부합니다 — 회원 추가 부담 없이.</p></div></div>
          <div className="gh-stats">
            <div><b>{manwon(fs.give)}</b><span>연간 나눔 기부</span></div>
            <div><b>{manwon(Math.round(fs.give / 12))}</b><span>이번 달 기부</span></div>
            <div><b>{fs.beneficiaries.toLocaleString()}명</b><span>치료비 지원</span></div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="rct"><Coins size={18} color="#E11D48" /> 나눔이 전달되는 과정</div>
          {WALLET_GIVE_FLOW.map((g) => (
            <div className="adv" key={g.n}><span className="ic" style={{ background: "#FDE7EC", color: "#E11D48", fontWeight: 800, display: "grid", placeItems: "center" }}>{g.n}</span>
              <div style={{ flex: 1 }}><b>{g.t}</b><p>{g.d}</p></div></div>
          ))}
        </div>

        <div className="bklbl" style={{ margin: "4px 0 8px" }}><HeartHandshake size={14} color="#E11D48" style={{ verticalAlign: "-2px" }} /> 누구를 돕나요 — 치료비 사각지대 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· {WALLET_GIVE_TARGETS.length}개 대상</span></div>
        <div className="wgrid">
          {WALLET_GIVE_TARGETS.map(([a, t, d, c], i) => (
            <div className="wcard" key={i}><span className="wi" style={{ background: c + "1A" }}><Art name={a} size={22} /></span>
              <div style={{ flex: 1 }}><div className="wn">{t}</div><div className="wd">{d}</div></div></div>
          ))}
        </div>

        <div className="wgive-my"><span className="ic"><Heart size={18} color="#E11D48" /></span><div>지금까지 <b>조성래님의 소비로 만들어진 나눔</b> <b style={{ color: "#E11D48" }}>{won(WALLET_GIVE.my)}</b> <small>— 내 건강 관리가 이웃의 치료비가 되었습니다.</small></div></div>
        <div className="chnote">※ 기부 비율(판매마진의 {WALLET_SPLIT.give}%)·수치는 <b>설계 목표·예시</b>입니다. 실제 기부는 제휴 공익재단·의료기관을 통해 심사 후 집행되며, 사용내역은 투명하게 공개하도록 설계합니다. ‘치료비 사각지대’는 재난적 의료비·실손 보장 사각지대·희귀중증질환 본인부담·취약계층 긴급 치료비 등을 포함합니다.</div>
      </>)}

      {tab === "use" && (<>
        <div className="weq">
          <div className="weq-h"><span className="weq-ic"><TrendingUp size={22} color="#fff" /></span>
            <div><b>소비자 참여형 토큰 환원 — 주식 참여 프로그램 <i className="weq-tag">예정</i></b>
              <p>구매·건강활동으로 적립한 리워드 토큰을, 회사가 정한 기준·관련 법령에 따라 향후 <b>당사 주식 또는 주식 취득 관련 권리</b>의 취득에 활용할 수 있도록 설계할 예정입니다. 소비자가 단순 구매자를 넘어 <b>기업의 성장과 가치 창출에 함께 참여</b>하고, 기업·소비자가 <b>장기 신뢰와 성과를 공유하는 생태계</b>를 지향합니다.</p></div></div>
          <div className="weq-flow">{["구매·건강활동", "리워드 토큰 적립", "법령·운영기준 검토", "주식·취득권리 참여"].map((s, i, a) => <React.Fragment key={i}><span className="weq-step">{s}</span>{i < a.length - 1 && <ChevronRight size={13} className="weq-arr" />}</React.Fragment>)}</div>
          <div className="weq-note">※ 토큰의 적립·사용·전환 및 주식(또는 관련 권리) 취득은 관계 법령·감독기관 정책·회사 운영기준·제휴기관 절차에 따라 달라질 수 있으며, <b>토큰이 주식으로 자동 전환되거나 주식 취득이 보장되는 것은 아닙니다.</b> 운영기준·토큰 적립·사용 조건·주식 취득 절차·이용 제한 등 세부 내용은 별도 약관 및 운영정책으로 안내해 드릴 예정입니다. (본 안내는 투자 권유·청약이 아닙니다.)</div>
        </div>
        <div className="benefit"><span><Art name="badge" size={16} /> 보험료 결제</span><span><Art name="building" size={16} /> 병원·검진비</span><span><Art name="pill" size={16} /> 건강제품</span><span><Art name="meal" size={16} /> 건강식단</span></div>
        {WALLET_USE.map(([a, t, d, lim, c], i) => (
          <div className="adv" key={i}><span className="ic" style={{ background: c + "1A" }}><Art name={a} size={20} /></span>
            <div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div>
            <div style={{ alignSelf: "center", textAlign: "right" }}><span className="cbadge" style={{ color: "#15803D", background: "#E7F8EE" }}>{lim}</span><div style={{ marginTop: 6 }}><button className="book" style={{ padding: "7px 12px" }} onClick={() => go(t.includes("보험") ? "insurance" : t.includes("병원") ? "hospital" : t.includes("식단") ? "shop" : "shop")}>사용하기</button></div></div>
          </div>
        ))}
        <div className="chnote">※ 사용한도는 예시입니다. 적립 토큰은 <b>플랫폼이 환전하여 현금(카드·계좌)으로 결제·정산</b>되며(가상자산 아님), 토큰 우선 차감 후 잔액은 현금결제됩니다. 스테이블코인 등 가상자산 직접 결제는 <b>법률 제정 후 도입</b> 예정입니다.</div>
      </>)}

      {tab === "chain" && (typeof HtkTokenLedger === "function" ? <HtkTokenLedger member={dm} base={total} /> : null)}

      {tab === "guide" && (<>
        <div className="airec"><div className="at"><Sparkles size={16} color="#7C3AED" /> 이렇게 쓰면 좋아요 · 사용 사례</div><div className="ap">건강활동으로 토큰을 적립하고, 보험료·병원·건강제품·식단 결제에 사용하는 대표 사례예요.</div></div>
        <div className="weq-lite"><span className="weq-lite-ic"><TrendingUp size={16} color="#7C3AED" /></span><div><b>더 나아가 — 주식 참여 프로그램(예정)</b><p>적립 토큰은 결제뿐 아니라, 회사 기준·법령에 따라 향후 <b>당사 주식·취득 권리 참여</b>에도 활용할 수 있도록 설계될 예정이에요. 소비자가 기업 성장에 함께 참여하는 구조 — <b>단, 자동 전환·취득 보장은 아니며 세부는 별도 약관 안내</b>. (투자 권유 아님)</p></div></div>
        {WALLET_GUIDE.map((g) => (
          <div className="gcase" key={g.n}>
            <div className="gh"><span className="gn">{g.n}</span> {g.t}</div>
            <div className="gd">{g.d}</div>
            <div className="gchips">{g.chips.map(([cls, txt], i) => <span key={i} className={cls}>{txt}</span>)}</div>
          </div>
        ))}
        <div className="chnote">※ 예시 수치는 예시입니다. 실제 적립·사용액은 활동·정책에 따라 달라집니다.</div>
      </>)}

      {tab === "sec" && (<>
        <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,#0B1F4D,#2F5BEA 60%,#7C3AED)", color: "#fff", borderRadius: 16, padding: "18px 18px", boxShadow: "0 16px 32px -20px rgba(47,91,234,.8)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={26} color="#fff" /></span>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.55 }}><b style={{ color: "#A7F3D0" }}>핀테크·헬스케어급 다층 보안</b>을 적용해 적립·환전·결제의 <b style={{ color: "#FDE68A" }}>위·변조 방지와 이상거래 탐지를 강화</b>합니다. <span style={{ opacity: .82, fontWeight: 600 }}>(설계 목표 · 시제품)</span></div>
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
        <div className="chnote">※ <b>현재는 시연용(프론트엔드 시제품)이며 실제 결제·암호화는 구현되어 있지 않습니다.</b> 적립 토큰은 가상자산이 아닌 <b>포인트로 운영되어 플랫폼 환전 후 현금결제</b>되며, 스테이블코인 등 가상자산 결제는 <b>법률 제정 후</b> 진행합니다. 완전한 보안을 보장하는 시스템은 없으며, 실제 서비스는 전자금융거래법·개인정보보호법 및 보안인증(ISMS-P 등)에 따라 단계적으로 구현됩니다.</div>
      </>)}
    </div>
  );
}

/* ====================== Health NFT ====================== */
// 보유: {art,type,name,meta,id,to,col}
