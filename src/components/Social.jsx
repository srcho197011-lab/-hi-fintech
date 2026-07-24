/* ====================== 사회적기업 온톨로지 ====================== */
const socWon = (n) => (n >= 100000000 ? (n / 100000000).toFixed(1).replace(/\.0$/, "") + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : Math.round(n).toLocaleString() + "원");
const socNum = (n) => (n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "만" : n.toLocaleString());

function socialImpact() {
  const agg = (typeof pilotAgg === "function") ? pilotAgg() : { n: 100000, needyN: 8200, gapN: 21000, households: 42000, totalCost: 0 };
  // 재무회계 모델 연동 — 제품마진 → 적립50%·나눔30%·운영20%(+특별지원: 어르신 치료비·장애아동 재활). 1차연도(10만 회원, 파일럿 규모) 기준.
  const fs = (typeof finSocial === "function") ? finSocial(0) : { margin: 655500000, earn: 327750000, give: 196650000, ops: 131100000, animal: 8193750, beneficiaries: 771 };
  const earn = fs.earn, give = fs.give, ops = fs.ops, animal = fs.animal, marginTotal = fs.margin;
  const activeRate = 0.45;
  const activeN = Math.round(agg.n * activeRate);
  const beneficiaries = fs.beneficiaries;            // 치료비 수혜자 = 나눔 ÷ 1인 지원액
  const socialValue = give + Math.round(earn * 0.6) + animal; // 사회적 편익 근사
  const sroi = Math.round(socialValue / ops * 10) / 10;
  return { agg, participants: agg.n, activeN, activeRate, earn, give, ops, animal, marginTotal, beneficiaries, needyN: agg.needyN, gapN: agg.gapN, households: agg.households, socialValue, sroi };
}

/* SEI 종합지수 게이지(원형) */
function SocGauge({ score, grade, size = 128 }) {
  const r = size / 2 - 10, C = 2 * Math.PI * r, off = C * (1 - score / 100);
  return (
    <div className="socgauge" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%" }}>
        <defs><linearGradient id="socgauge-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34D399" /><stop offset=".5" stopColor="#22D3EE" /><stop offset="1" stopColor="#FB7185" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#socgauge-g)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="socgauge-c"><b>{score}</b><span>/ 100</span><em>{grade}</em></div>
    </div>
  );
}

/* 사회적가치 온톨로지(가치사슬) */
function SocValueGraph() {
  const nodes = [
    { id: "citizen", t: "시민", x: 60, y: 70, c: "#22D3EE" },
    { id: "join", t: "참여·소비", x: 190, y: 70, c: "#38BDF8" },
    { id: "margin", t: "판매마진", x: 320, y: 70, c: "#818CF8" },
    { id: "earn", t: "건강적립\n환원 50%", x: 250, y: 178, c: "#16A34A" },
    { id: "give", t: "치료비나눔\n30%", x: 390, y: 178, c: "#E11D48" },
    { id: "animal", t: "특별지원\n어르신·아동", x: 490, y: 90, c: "#7C3AED" },
    { id: "gap", t: "의료비\n사각지대", x: 470, y: 260, c: "#A78BFA" },
    { id: "impact", t: "사회적\n임팩트", x: 300, y: 285, c: "#FB7185" },
  ];
  const N = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const links = [["citizen", "join", ""], ["join", "margin", ""], ["margin", "earn", "환원"], ["margin", "give", "나눔"], ["margin", "animal", "5%"], ["earn", "citizen", "적립"], ["give", "gap", "지원"], ["gap", "impact", ""], ["earn", "impact", ""]];
  return (
    <div className="ontgraph">
      <svg viewBox="0 0 560 330" style={{ width: "100%", height: "auto", display: "block" }}>
        {links.map(([a, b, lbl], i) => { const A = N[a], B = N[b]; return (<g key={i}><line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#3A4A67" strokeWidth="1.5" strokeDasharray={lbl ? "5 4" : "none"} />{lbl && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} fill="#9AA9C6" fontSize="9.5" fontWeight="700" textAnchor="middle">{lbl}</text>}</g>); })}
        {nodes.map((nd) => { const ls = nd.t.split("\n"); return (<g key={nd.id}>
          <circle cx={nd.x} cy={nd.y} r="30" fill="#0F1B33" stroke={nd.c} strokeWidth="2" />
          {ls.map((l, i) => <text key={i} x={nd.x} y={nd.y + 4 - (ls.length - 1) * 6 + i * 12} fill="#EAF2FF" fontSize="9.5" fontWeight="800" textAnchor="middle">{l}</text>)}
        </g>); })}
      </svg>
      <div className="ontgraph-note">시민의 <b>참여·소비</b>가 <b style={{ color: "#818CF8" }}>판매마진</b>이 되고 → <b style={{ color: "#16A34A" }}>건강적립(50%)</b>으로 회원에게 환원, <b style={{ color: "#E11D48" }}>치료비 나눔(30%)</b>·<b style={{ color: "#7C3AED" }}>특별지원(어르신·아동)</b>으로 사각지대에 전달되어 <b style={{ color: "#FB7185" }}>사회적 임팩트</b>로 순환합니다.</div>
    </div>
  );
}

/* 실시간 사회적 임팩트 카운터 */
function SocLiveCounter({ base }) {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1400); return () => clearInterval(id); }, []);
  const items = [
    { ic: Users, c: "#22D3EE", label: "오늘 참여 활동", v: 1240 + t * 3, unit: "건" },
    { ic: HandCoins, c: "#16A34A", label: "오늘 건강적립 환원", v: 3120000 + t * 8400, money: true },
    { ic: HeartHandshake, c: "#E11D48", label: "오늘 치료비 나눔", v: 1870000 + t * 5100, money: true },
    { ic: HeartHandshake, c: "#7C3AED", label: "오늘 어르신·아동 지원", v: 78000 + t * 260, money: true },
  ];
  // 과업4: 모델 추정(연출 카운터)과 SharingPool 실적립 원장을 라벨로 구분 병기 — 시뮬레이션 정직성
  const sp = (typeof spSummary === "function") ? (() => { try { return spSummary(); } catch (e) { return null; } })() : null;
  return (<>
    <div className="soclive">
      {items.map((it, i) => (
        <div className="soclive-c" key={i}>
          <span className="soclive-ic" style={{ background: it.c + "22", color: it.c }}><it.ic size={16} /></span>
          <div><div className="soclive-v" style={{ color: it.c }}>{it.money ? socWon(it.v) : it.v.toLocaleString() + it.unit}</div><div className="soclive-k">{it.label} <i className="soclive-dot" style={{ background: it.c }} /></div></div>
        </div>
      ))}
    </div>
    <div className="chnote" style={{ marginTop: 8 }}>위 카운터는 <b>재무 모델 추정(시연 연출)</b>이에요. 내 행동으로 실제 쌓인 <b>나눔 재원 실적립 원장</b>은 {sp && sp.count ? <b style={{ color: "#E11D48" }}>{sp.balance.toLocaleString()}원 · {sp.count}건</b> : "아직 0건"} — 보험·치료비 › 치료비·나눔 탭에서 건별로 확인·검증할 수 있어요.</div>
  </>);
}

const SOC_CERTS = [
  ["사회적기업 인증(예비)", "고용노동부 사회적기업 인증 요건 — 사회적 목적 실현·이해관계자 참여·이익 재투자", "#16A34A", "Award"],
  ["이익 재투자 구조", "판매마진 80%(적립50+나눔30)를 회원·사각지대에 환원 — 이윤의 사회적 재분배", "#E11D48", "Recycle"],
  ["ESG·ISO 26000 정합", "사회책임(S) 중심 운영 — 취약계층 의료접근성·동물복지·투명한 임팩트 공시", "#2563EB", "Globe"],
  ["임팩트 투명성", "나눔 집행내역을 제휴 공익재단·의료기관 심사와 함께 투명 공개하도록 설계", "#7C3AED", "Scale"],
];

function SocCertIcon({ name, size, color }) {
  const p = { size, color };
  if (name === "Award") return <Award {...p} />;
  if (name === "Recycle") return <Sprout {...p} />;
  if (name === "Globe") return <Globe {...p} />;
  return <Scale {...p} />;
}

function SocialSection({ onGo }) {
  const go = onGo || (() => {});
  const [tab, setTab] = useState("index");
  const si = React.useMemo(() => socialImpact(), []);
  const pillars = [
    { key: "참여", label: "모든 시민의 참여", score: 84, Ic: Users, color: "#22D3EE", metric: socNum(si.activeN) + "명", sub: `활동 참여 ${Math.round(si.activeRate * 100)}% · 전 연령·계층 개방`, to: "community" },
    { key: "환원", label: "수익의 환원", score: 91, Ic: HandCoins, color: "#16A34A", metric: socWon(si.earn), sub: "판매마진 50%를 건강적립금으로 회원 환원", to: "wallet" },
    { key: "나눔", label: "기부·나눔", score: 88, Ic: HeartHandshake, color: "#E11D48", metric: socWon(si.give), sub: "판매마진 30% 치료비 사각지대 + 특별지원(어르신·장애아동)", to: "wallet" },
    { key: "지원", label: "의료비 사각지대 지원", score: 80, Ic: ShieldCheck, color: "#A78BFA", metric: si.beneficiaries.toLocaleString() + "명", sub: `치료비 수혜자 · 잠재대상 ${socNum(si.needyN)}명`, to: "insurance" },
  ];
  const sei = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length * 10) / 10;
  const grade = sei >= 90 ? "AAA" : sei >= 85 ? "AA+" : sei >= 80 ? "AA" : sei >= 70 ? "A" : "BBB";
  const splitRows = [["건강적립 환원", WALLET_SPLIT.earn, "#16A34A", si.earn], ["치료비 사각지대 나눔", WALLET_SPLIT.give, "#E11D48", si.give], ["플랫폼 운영", WALLET_SPLIT.ops, "#64748B", si.ops]];
  const tabs = [["index", "사회적 지수", Gauge], ["impact", "실시간 임팩트", Zap], ["graph", "가치 온톨로지", Network], ["give", "나눔·수혜", HeartHandshake]];
  return (
    <div style={{ marginTop: 16 }}>
      {/* 히어로 */}
      <div className="sochero">
        <div className="sochero-bg"><span style={{ background: "#12A594" }} /><span style={{ background: "#FB7185" }} /></div>
        <div className="sochero-l">
          <span className="ontotag" style={{ background: "rgba(18,165,148,.18)", borderColor: "rgba(18,165,148,.45)", color: "#5EEAD4" }}><HeartHandshake size={13} /> Social Enterprise · 사회적가치 온톨로지</span>
          <div className="ontotitle">사회적기업 온톨로지</div>
          <p>모든 시민의 <b>참여</b>, 수익의 <b>환원</b>, 치료비 사각지대 <b>기부·지원</b>을 하나의 지표로 — HI-Fin은 <b>이윤을 사회적으로 재분배</b>하는 헬스케어 사회적기업을 지향합니다.</p>
          <div className="sochero-kpis">
            <div><b>{socNum(si.participants)}명</b><span>참여 시민</span></div>
            <div><b>{socWon(si.earn + si.give)}</b><span>누적 환원·나눔</span></div>
            <div><b>{si.beneficiaries.toLocaleString()}명</b><span>치료비 수혜자</span></div>
            <div><b>{si.sroi}배</b><span>사회적투자수익(SROI)</span></div>
          </div>
        </div>
        <div className="sochero-r">
          <SocGauge score={sei} grade={grade} />
          <div className="sochero-sei">사회적기업 지수(SEI) <b>{grade}</b></div>
        </div>
      </div>

      <div className="chtabs" style={{ marginTop: 14 }}>{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "index" && (<>
        <div className="socmission">
          <div className="socmission-h"><span className="socmission-ic"><HeartHandshake size={17} color="#5EEAD4" /></span><b>미션 · 비전</b><i className="socmission-tag">Impact Mission</i></div>
          <p><b>AI 헬스케어·핀테크 임팩트기업</b>은 사회적기업의 가치 기반 위에서 <b>의료비 사각지대 해소와 건강 형평성 증진</b>을 핵심 목표로 합니다. AI와 디지털 기술을 활용하여 <b>예방 중심의 건강관리, 의료비 부담 완화, 금융·보험 서비스의 접근성 확대</b>를 지원하고, <b>취약계층 보호와 지역사회 통합돌봄</b>을 사업모델에 내재화하여 사회적 가치와 경제적 가치를 함께 창출합니다. 또한 혁신 역량을 갖춘 <b>헬스케어 중소기업의 ESG 경영과 시장 진출</b>을 지원함으로써 지속가능한 헬스케어 생태계를 조성하고, <b>소비자·기업·지역사회가 함께 성장하는 포용적 가치순환 구조</b>를 실현합니다.</p>
          <div className="socmission-pills">{["의료비 사각지대 해소", "건강 형평성", "예방 중심 건강관리", "취약계층·통합돌봄", "헬스케어 중소기업 ESG", "포용적 가치순환"].map((t) => <span key={t}>{t}</span>)}</div>
        </div>
        <div className="socpillars">
          {pillars.map((p) => (
            <div className="socpillar" key={p.key} style={{ borderTopColor: p.color }} onClick={() => go(p.to)}>
              <div className="socpillar-h"><span className="socpillar-ic" style={{ background: p.color + "22", color: p.color }}><p.Ic size={17} /></span><div className="socpillar-t"><b>{p.label}</b><span>{p.key}</span></div><div className="socpillar-sc" style={{ color: p.color }}>{p.score}</div></div>
              <div className="socpillar-v">{p.metric}</div>
              <div className="socpillar-bar"><i style={{ width: p.score + "%", background: p.color }} /></div>
              <div className="socpillar-sub">{p.sub}</div>
            </div>
          ))}
        </div>

        <div className="ontpanel" style={{ marginTop: 14 }}>
          <div className="ontph"><PieChart size={15} color="#16A34A" /> 판매마진 분배 구조 <span>· 이익의 사회적 재분배</span></div>
          <div className="socsplit-bar">{splitRows.map(([t, p, c]) => <div key={t} style={{ width: p + "%", background: c }} title={`${t} ${p}%`} />)}</div>
          <div className="socsplit-rows">
            {splitRows.map(([t, p, c, amt]) => (<div className="socsplit-r" key={t}><span className="dot" style={{ background: c }} /><b>{p}%</b> {t}<em>{socWon(amt)}</em></div>))}
          </div>
          <div className="socsplit-extra"><HeartHandshake size={13} color="#7C3AED" /> 추가로 판매마진의 일부(25%×5%)를 <b>어르신 치료비·장애아동 재활 지원</b>에 기부 — 누적 <b style={{ color: "#7C3AED" }}>{socWon(si.animal)}</b></div>
          <div className="finpl-note">회원 추가 부담 없이, 소비에서 발생한 판매마진의 <b>{WALLET_SPLIT.earn + WALLET_SPLIT.give}%</b>가 회원(적립)과 이웃(나눔)에게 돌아갑니다. 운영({WALLET_SPLIT.ops}%)도 사회적 목적 재투자에 사용됩니다.</div>
        </div>

        <div className="ontpanel">
          <div className="ontph"><Award size={15} color="#16A34A" /> 사회적기업 성과·인증 지표</div>
          <div className="soccerts">
            {SOC_CERTS.map(([t, d, c, ic]) => (
              <div className="soccert" key={t}><span className="soccert-ic" style={{ background: c + "1E", color: c }}><SocCertIcon name={ic} size={17} color={c} /></span><div><b>{t}</b><p>{d}</p></div></div>
            ))}
          </div>
          <div className="chnote" style={{ marginTop: 10 }}>※ 사회적 지수(SEI)·SROI·인증 지표는 <b>설계 목표·시연용 추정치</b>입니다. 실제 인증·임팩트 성과는 제3자 검증·공시 절차를 거쳐 확정됩니다.</div>
        </div>
      </>)}

      {tab === "impact" && (<>
        <div className="ontpanel">
          <div className="ontph"><Zap size={15} color="#FB7185" /> 실시간 사회적 임팩트 <span>· 참여·환원·나눔 실시간 누적</span></div>
          <SocLiveCounter base={si} />
        </div>
        <div className="ontpanel">
          <div className="ontph"><Gauge size={15} color="#22D3EE" /> 사회적투자수익률(SROI) <span>· 투입 대비 사회적 가치</span></div>
          <div className="socsroi">
            <div className="socsroi-big"><b>{si.sroi}</b><span>배</span><em>운영 투입 1원당 창출한 사회적 가치</em></div>
            <div className="socsroi-brk">
              {[["치료비 나눔 편익", si.give, "#E11D48"], ["건강적립 환원 효과", Math.round(si.earn * 0.6), "#16A34A"], ["특별지원(어르신·장애아동)", si.animal, "#7C3AED"]].map(([t, v, c]) => (
                <div className="socsroi-r" key={t}><span className="dot" style={{ background: c }} />{t}<em>{socWon(v)}</em></div>
              ))}
              <div className="socsroi-r tot"><span className="dot" style={{ background: "#22D3EE" }} />총 사회적 가치<em>{socWon(si.socialValue)}</em></div>
            </div>
          </div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><ShieldCheck size={15} color="#A78BFA" /> 의료비 사각지대 현황 <span>· 파일럿 코호트 {socNum(si.participants)}명 기준</span></div>
          <div className="socgapkpi">
            {[["치료비 사각지대 잠재대상", si.needyN, "#E11D48"], ["보장 공백 회원", si.gapN, "#A78BFA"], ["누적 수혜자", si.beneficiaries, "#16A34A"], ["지원 가구", si.households > 0 ? Math.round(si.beneficiaries * 0.7) : 269, "#F59E0B"]].map(([t, v, c]) => (
              <div className="socgapkpi-c" key={t}><div className="socgapkpi-v" style={{ color: c }}>{v.toLocaleString()}명</div><div className="socgapkpi-k">{t}</div></div>
            ))}
          </div>
          <div className="finpl-note">코호트 {socNum(si.participants)}명 중 <b style={{ color: "#E11D48" }}>{socNum(si.needyN)}명</b>이 치료비 사각지대 잠재대상입니다. 나눔 준비금으로 <b>{si.beneficiaries.toLocaleString()}명</b>에게 치료비를 전달했으며, 참여 확대로 지원을 늘려갑니다.</div>
        </div>
      </>)}

      {tab === "graph" && (
        <div className="ontpanel">
          <div className="ontph"><Network size={15} color="#12A594" /> 사회적가치 온톨로지 (참여 → 환원·나눔 → 사각지대 지원)</div>
          <SocValueGraph />
        </div>
      )}

      {tab === "give" && (<>
        <div className="ontpanel">
          <div className="ontph"><HeartHandshake size={15} color="#E11D48" /> 누구를 돕나요 — 치료비 사각지대 <span>· {WALLET_GIVE_TARGETS.length}개 대상</span></div>
          <div className="socgive">
            {WALLET_GIVE_TARGETS.map(([a, t, d, c], i) => (
              <div className="socgive-c" key={i} style={{ borderLeftColor: c }}><span className="socgive-ic" style={{ background: c + "1E" }}><Art name={a} size={18} /></span><div><b>{t}</b><p>{d}</p></div></div>
            ))}
          </div>
          <div className="socgive-cta"><Heart size={16} color="#E11D48" /><div>누적 <b style={{ color: "#E11D48" }}>{socWon(si.give)}</b>를 <b>{si.beneficiaries.toLocaleString()}명</b>의 치료비 사각지대 이웃에게 전달했습니다.</div><button className="book" onClick={() => go("wallet")}>나눔 현황 보기</button></div>
        </div>
        <div className="ontpanel">
          <div className="ontph"><HeartHandshake size={15} color="#7C3AED" /> 특별 사회공헌 <span>· 판매마진 연계 기부(예정)</span></div>
          <div className="socanimal">
            <span className="socanimal-ic" style={{ background: "#EEF2FF" }}><Users size={22} color="#4F46E5" /></span>
            <div><b>어르신 치료비 사각지대 개선 사업</b><p>회원의 제품 구매 판매마진 일부가 <b>어르신 재난적 의료비·치료비 사각지대</b> 지원에 쓰입니다. 제휴기관: <b>한국노인나눔재단(예정)</b> · 누적 <b style={{ color: "#4F46E5" }}>{socWon(Math.round(si.animal * 0.6))}</b> 지원.</p></div>
            <button className="book" onClick={() => go("shop")}>구매로 후원하기</button>
          </div>
          <div className="socanimal" style={{ marginTop: 10 }}>
            <span className="socanimal-ic" style={{ background: "#FCE7F3" }}><Activity size={22} color="#DB2777" /></span>
            <div><b>장애아동 재활사업 지원</b><p>판매마진 일부가 <b>장애아동 재활치료·디지털 치료</b> 지원에 쓰입니다. 제휴기관: <b>잼잼테라퓨틱스 · 장애아동복지 재단 등(예정)</b> · 누적 <b style={{ color: "#DB2777" }}>{socWon(si.animal - Math.round(si.animal * 0.6))}</b> 지원.</p></div>
            <button className="book" onClick={() => go("shop")}>구매로 후원하기</button>
          </div>
          <div className="chnote" style={{ marginTop: 10 }}>※ 기부 비율·수치·제휴기관은 설계 목표·예시(예정)입니다. 실제 기부는 제휴 공익재단·전문기관 심사를 거쳐 집행되며, 집행내역을 투명하게 공개하도록 설계합니다.</div>
        </div>
      </>)}
    </div>
  );
}
