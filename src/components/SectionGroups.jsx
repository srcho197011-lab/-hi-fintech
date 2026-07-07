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
function GroupTabs({ tabs, tab, setTab }) {
  return (
    <div className="chtabs" style={{ marginBottom: 6 }}>
      {tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}
    </div>
  );
}

function HomeHub({ initial, onGo }) {
  const map = { home: "home", social: "social", community: "community" };
  const [tab, setTab] = useState(map[initial] || "home");
  useEffect(() => { setTab(map[initial] || "home"); }, [initial]);
  const tabs = [["home", "홈 · 소개", Home], ["social", "사회적기업", HeartHandshake], ["community", "커뮤니티", Users]];
  return (
    <div style={{ marginTop: 4 }}>
      <GroupHead ic={Home} title="HI-Fin Tech란" sub="회사 소개 · 비전 · 사회적 가치환원 · 커뮤니티" color="#2563EB" />
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "home" && <HomeView onGo={onGo} />}
      {tab === "social" && <SocialSection onGo={onGo} />}
      {tab === "community" && <CommunitySection onGo={onGo} />}
    </div>
  );
}

function CareSection({ initial, onGo }) {
  const map = { care: "hospital", hospital: "hospital", homecare: "homecare", shop: "shop" };
  const [tab, setTab] = useState(map[initial] || "hospital");
  useEffect(() => { setTab(map[initial] || "hospital"); }, [initial]);
  const tabs = [["hospital", "병원 진료·추가검진", Building2], ["homecare", "재가·돌봄", HeartHandshake], ["shop", "건강쇼핑", ShoppingCart]];
  return (
    <div style={{ marginTop: 4 }}>
      <GroupHead ic={HeartHandshake} title="검진 후 케어" sub="검진 결과에 맞춘 병원 진료·추가 정밀검진 · 재가·돌봄 · 맞춤 건강쇼핑" color="#DB2777" />
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "hospital" && <HospitalSection onGo={onGo} />}
      {tab === "homecare" && <HomecareSection onGo={onGo} />}
      {tab === "shop" && <ShopSection onGo={onGo} />}
    </div>
  );
}

function WalletHubSection({ initial, onGo }) {
  const map = { mywallet: "ai", ai: "ai", manage: "manage", wallet: "wallet", nft: "nft", mypage: "mypage" };
  const [tab, setTab] = useState(map[initial] || "ai");
  useEffect(() => { setTab(map[initial] || "ai"); }, [initial]);
  const tabs = [["ai", "나의 주치의", Bot], ["manage", "건강관리", HeartPulse], ["wallet", "건강금융지갑", Wallet], ["nft", "Health NFT", BadgeCheck], ["mypage", "마이페이지", Settings]];
  return (
    <div style={{ marginTop: 4 }}>
      <GroupHead ic={Wallet} title="나의 건강지갑" sub="AI 주치의 · 건강관리 · 건강금융지갑 · Health NFT · 마이페이지를 한 곳에서" color="#059669" />
      <GroupTabs tabs={tabs} tab={tab} setTab={setTab} />
      {tab === "ai" && <AIDoctor onGo={onGo} />}
      {tab === "manage" && <HealthManageSection onGo={onGo} />}
      {tab === "wallet" && <WalletSection onGo={onGo} />}
      {tab === "nft" && <NFTSection onGo={onGo} />}
      {tab === "mypage" && <MyPageSection onGo={onGo} />}
    </div>
  );
}
