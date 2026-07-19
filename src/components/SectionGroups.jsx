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
  const map = { home: "home", story: "story", social: "social", community: "community" };
  const [tab, setTab] = useState(map[initial] || "home");
  useEffect(() => { setTab(map[initial] || "home"); }, [initial]);
  const tabs = [["home", "홈 · 소개", Home, "#2563EB"], ["story", "활용 스토리", BookOpen, "#EA580C"], ["social", "사회적기업", HeartHandshake, "#16A34A"], ["community", "커뮤니티", Users, "#7C3AED"]];
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

function CareSection({ initial, onGo }) {
  const map = { care: "ai", ai: "ai", manage: "manage", hospital: "hospital", homecare: "homecare", shop: "shop" };
  const [tab, setTab] = useState(map[initial] || "ai");
  useEffect(() => { setTab(map[initial] || "ai"); }, [initial]);
  const tabs = [["ai", "나의 주치의", Bot, "#7C3AED"], ["manage", "나의 건강현황", HeartPulse, "#E11D48"], ["hospital", "병원 진료·추가검진", Building2, "#2563EB"], ["homecare", "재가·돌봄", HeartHandshake, "#DB2777"], ["shop", "건강쇼핑", ShoppingCart, "#16A34A"]];
  return (
    <div style={{ marginTop: 4 }}>
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "ai" && <AIDoctor onGo={onGo} />}
      {tab === "manage" && <HealthManageSection onGo={onGo} />}
      {tab === "hospital" && <HospitalSection onGo={onGo} />}
      {tab === "homecare" && <HomecareSection onGo={onGo} />}
      {tab === "shop" && <ShopSection onGo={onGo} />}
    </div>
  );
}

function WalletHubSection({ initial, onGo }) {
  const map = { mywallet: "wallet", wallet: "wallet", nft: "nft", mypage: "mypage", vault: "vault" };
  const [tab, setTab] = useState(map[initial] || "wallet");
  useEffect(() => { setTab(map[initial] || "wallet"); }, [initial]);
  const tabs = [["wallet", "건강금융지갑", Wallet, "#059669"], ["mypage", "우리가족건강관리", Users, "#EA580C"], ["nft", "Health NFT", BadgeCheck, "#F59E0B"], ["vault", "데이터 금고", ShieldCheck, "#2563EB"]];
  return (
    <div style={{ marginTop: 4 }}>
      {typeof MyHealthHero === "function" && <MyHealthHero onGo={onGo} />}
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "wallet" && <WalletSection onGo={onGo} />}
      {tab === "mypage" && <MyPageSection onGo={onGo} />}
      {tab === "nft" && <NFTSection onGo={onGo} />}
      {tab === "vault" && (typeof DataVaultPanel === "function" ? <div style={{ marginTop: 16 }}><DataVaultPanel onGo={onGo} /></div> : null)}
    </div>
  );
}
