/* ====================== 고객 여정 통합 섹션 래퍼 (탭으로 기존 화면 재사용) ======================
   - HomeHub: HI-Fin Tech란 (홈 · 사회적기업 · 커뮤니티)
   - CareSection: 검진 후 케어 (병원 진료·추가검진 · 재가·돌봄 · 건강쇼핑)
   - WalletHubSection: 나의 건강지갑 (주치의 · 건강관리 · 금융지갑 · Health NFT · 마이페이지)
   initial = 현재 섹션 키(딥링크) → 해당 탭으로 진입. 탭 클릭은 내부 상태로 전환. */

function GroupHead({ ic: Ic, title, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0 12px" }}>
      <span style={{ width: 44, height: 44, borderRadius: 13, background: (color || "#2563EB") + "16", display: "grid", placeItems: "center", flexShrink: 0 }}><Ic size={22} color={color || "#2563EB"} /></span>
      <div><div style={{ fontSize: 19, fontWeight: 900, color: "#0F1F45", letterSpacing: -0.3 }}>{title}</div><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}>{sub}</div></div>
    </div>
  );
}
const GTAB_PAL = ["#2563EB", "#DB2777", "#16A34A", "#EA580C", "#7C3AED", "#0891B2"];
function GroupTabs({ tabs, tab, setTab }) {
  return (
    <div className="chtabs lv1" style={{ marginBottom: 8 }}>
      {tabs.map(([k, t, Ic, c], i) => (
        <div key={k} className={`chtab ${tab === k ? "on" : ""}`} style={{ "--cc": c || GTAB_PAL[i % GTAB_PAL.length] }} onClick={() => setTab(k)}>
          <span className="ch-ic"><Ic size={19} /></span><span className="ch-t">{t}</span>
        </div>
      ))}
    </div>
  );
}

function HomeHub({ initial, onGo }) {
  /* 기본 진입은 '활용 스토리'(이야기로 플랫폼 이해) — 회사 소개는 intro 키로 딥링크 */
  const map = { home: "story", story: "story", intro: "home", social: "social", community: "community" };
  const [tab, setTab] = useState(map[initial] || "story");
  useEffect(() => { setTab(map[initial] || "story"); }, [initial]);
  const tabs = [["story", "활용 스토리", BookOpen, "#EA580C"], ["home", "홈 · 소개", Home, "#2563EB"], ["social", "사회적기업", HeartHandshake, "#16A34A"], ["community", "커뮤니티", Users, "#7C3AED"]];
  return (
    <div style={{ marginTop: 4 }}>
      {typeof AgentHomeBriefing === "function" && <AgentHomeBriefing />}
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "home" && <HomeView onGo={onGo} />}
      {tab === "story" && (typeof StoryJourney === "function" ? <StoryJourney onGo={onGo} /> : null)}
      {tab === "social" && <SocialSection onGo={onGo} />}
      {tab === "community" && <CommunitySection onGo={onGo} />}
    </div>
  );
}

/* 비대면 원격진료 — 전문의 원격상담 + 병원·약국 검색(내원 연계)을 하나의 탭으로 통합 */
function TeleCareSection({ onGo }) {
  const [sub, setSub] = useState("consult");
  const subs = [["consult", "전문의 원격상담", Stethoscope, "#2563EB"], ["hospital", "병원·추가검진 찾기", Building2, "#0EA5E9"]];
  return (
    <div style={{ marginTop: 4 }}>
      <div className="chtabs lv2" style={{ marginBottom: 6 }}>
        {subs.map(([k, t, Ic, c]) => <div key={k} className={`chtab ${sub === k ? "on" : ""}`} onClick={() => setSub(k)}><Ic size={14} color={sub === k ? "#fff" : c} /> {t}</div>)}
      </div>
      {sub === "consult" ? <AIDoctor mode="specialist" onGo={onGo} /> : <HospitalSection onGo={onGo} />}
    </div>
  );
}
function CareSection({ initial, onGo }) {
  /* 탭 순서 = 사이드 서브메뉴 순서: 나의 건강현황 · 비대면 원격진료 · AI 주치의 · 재가·돌봄 · 건강쇼핑 */
  const map = { care: "ai", ai: "ai", manage: "manage", tele: "tele", hospital: "tele", homecare: "homecare", shop: "shop" };
  const [tab, setTab] = useState(map[initial] || "ai");
  useEffect(() => { setTab(map[initial] || "ai"); }, [initial]);
  /* 같은 섹션 안에서 다시 부를 때 — initial 값이 그대로면 위 useEffect가 안 돈다.
     (건강쇼핑 → 원격진료를 두 번째 누르면 탭이 안 바뀌던 원인)
     진료과 지정 신호를 받으면 탭도 함께 원격진료로 돌린다. */
  useEffect(() => {
    const h = () => setTab("tele");
    window.addEventListener("hifin:tele", h);
    return () => window.removeEventListener("hifin:tele", h);
  }, []);
  const tabs = [["manage", "나의 건강현황", HeartPulse, "#E11D48"], ["tele", "비대면 원격진료", Building2, "#2563EB"], ["ai", "AI 주치의", Bot, "#7C3AED"], ["homecare", "재가·돌봄", HeartHandshake, "#DB2777"], ["shop", "건강쇼핑", ShoppingCart, "#16A34A"]];
  return (
    <div style={{ marginTop: 4 }}>
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "manage" && <HealthManageSection onGo={onGo} />}
      {tab === "tele" && <TeleCareSection onGo={onGo} />}
      {tab === "ai" && <AIDoctor mode="ai" onGo={onGo} />}
      {tab === "homecare" && <HomecareSection onGo={onGo} />}
      {tab === "shop" && <ShopSection onGo={onGo} />}
    </div>
  );
}

/* ── 추천(리퍼럴) 카드 — 회원이 회원을 모집한다(획득 채널 ⑥). 지갑 허브 상주 ── */
function ReferralCard() {
  const m = (typeof _member === "function") ? _member() : null;
  const [tick, setTick] = useState(0); void tick;
  if (!m) return null;
  const s = (typeof refState === "function") ? refState(m.email) : { invited: 0, joined: 0, checked: 0, htk: 0 };
  const code = (typeof refCode === "function") ? refCode(m) : "";
  const doShare = () => { try { const r = refShare(m); if (typeof toast === "function") toast(r.mode === "share" ? "공유 창을 열었어요" : "초대 링크를 복사했어요 — 붙여넣어 공유하세요!"); } catch (e) {} setTick((t) => t + 1); };
  const askHi = () => { try { window.dispatchEvent(new CustomEvent("agentask", { detail: "친구 초대해줘" })); } catch (e) {} };
  const sim = (fn, msg) => { try { fn(m.email); if (typeof toast === "function") toast(msg); } catch (e) {} setTick((t) => t + 1); };
  return (
    <div className="refcard">
      <div className="ref-hd"><Gift size={16} /> 친구 초대 — 둘 다 100 HTK <span className="ref-code">내 코드 {code}</span></div>
      <div className="ref-sub">내 코드가 심긴 링크로 친구가 가입하면 <b>나도 친구도 각 100 HTK</b>, 친구가 첫 검진까지 마치면 <b>나에게 +300 HTK</b>! <b>가족을 등록해도 +100 HTK</b>예요. <i>(코드 없는 가입은 적립되지 않아요)</i></div>
      <div className="ref-btns">
        <button className="pri" onClick={doShare}><Send size={13} /> 초대 링크 공유·복사</button>
        <button onClick={askHi}><Bot size={13} /> 하이에게 "친구 초대해줘"</button>
      </div>
      <div className="ref-stats">
        <span>초대 <b>{s.invited}</b></span><span>가입 <b>{s.joined}</b></span><span>가족 <b>{s.family || 0}</b></span><span>검진완료 <b>{s.checked}</b></span><span>적립 <b>{s.htk.toLocaleString()} HTK</b></span>
        <span className="ref-sims"><button onClick={() => sim(refSimulateJoin, "내 코드로 친구 1명이 가입했어요 — +100 HTK 적립!")}>시연:코드가입</button><button onClick={() => sim(refSimulateCheck, "친구가 첫 검진을 완료했어요 — +300 HTK 적립!")}>시연:검진</button></span>
      </div>
      <div className="ref-legal">직접 추천 <b>1단계만</b> 인정(하위 추천 보상 없음 — 다단계 아님) · 실명 본인인증 <b>1인 1계정</b> · 자기 코드 가입 제외 · <b>가족 등록 포함</b>(등록 시 +100) · HTK는 <b>폐쇄형 포인트</b>(현금 아님·양도 불가·플랫폼 내 사용)이며 부정 수령 시 회수됩니다 · 보상 총액(건당 최대 500 HTK≈5천 원)은 검진센터 송객 수수료 마진 내에서 지급돼요</div>
    </div>
  );
}

function WalletHubSection({ initial, onGo }) {
  const map = { mywallet: "wallet", wallet: "wallet", nft: "nft", mypage: "mypage", vault: "vault", trust: "trust" };
  const [tab, setTab] = useState(map[initial] || "wallet");
  useEffect(() => { setTab(map[initial] || "wallet"); }, [initial]);
  // 신뢰 센터 → 데이터 금고 딥링크(같은 섹션 키에서도 탭 전환되도록 이벤트 수신)
  useEffect(() => { const h = () => setTab("vault"); window.addEventListener("vaultgo", h); return () => window.removeEventListener("vaultgo", h); }, []);
  const tabs = [["wallet", "건강금융지갑", Wallet, "#059669"], ["mypage", "우리가족건강관리", Users, "#EA580C"], ["nft", "Health NFT", BadgeCheck, "#F59E0B"], ["vault", "데이터 금고", ShieldCheck, "#2563EB"], ["trust", "신뢰 센터", Lock, "#0891B2"]];
  return (
    <div style={{ marginTop: 4 }}>
      {typeof MyHealthHero === "function" && <MyHealthHero onGo={onGo} />}
      {typeof ReferralCard === "function" && <ReferralCard />}
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "wallet" && <WalletSection onGo={onGo} />}
      {tab === "mypage" && <MyPageSection onGo={onGo} />}
      {tab === "nft" && <NFTSection onGo={onGo} />}
      {tab === "vault" && (typeof DataVaultPanel === "function" ? <div style={{ marginTop: 16 }}><DataVaultPanel onGo={onGo} /></div> : null)}
      {tab === "trust" && (typeof TrustCenterSection === "function" ? <TrustCenterSection onGo={onGo} /> : null)}
    </div>
  );
}
