const CAV_COLORS = ["#3B5BDB", "#16A34A", "#DB2777", "#F59E0B", "#0EA5E9", "#7C3AED", "#EF4444", "#0D9488"];
const cav = (i) => CAV_COLORS[i % CAV_COLORS.length];
const COMM_FEED = [
  ["김", "당뇨 예방·관리", "2시간 전", "당뇨 전단계, 식단으로 6개월 만에 정상화한 후기", "공복혈당 118 → 95. 저당·고식이섬유 식단과 매일 8천보 걷기로 약 없이 정상화했어요. 제가 먹은 식단표 공유합니다.", 342, 88, true],
  ["최", "금연·절주 챌린지", "1일 전", "금연 100일 달성! 몸의 변화 공유합니다", "기침이 줄고 아침 컨디션이 완전히 달라졌어요. 니코틴 패치 + 챌린지 인증이 정말 도움됐습니다. 같이 하실 분!", 415, 120, false],
  ["이", "간·췌장 건강", "5시간 전", "간수치(GTP) 높을 때 도움된 생활습관 5가지", "절주, 야식 끊기, 밀크씨슬, 주 3회 유산소, 복부 초음파 정기검진. 3개월 만에 수치가 절반으로 떨어졌어요.", 210, 41, true],
  ["정", "당뇨 예방·관리", "2일 전", "CGM(연속혈당측정기) 2주 사용 후기", "음식별 혈당 반응이 눈에 보이니 식습관이 바뀌네요. 흰쌀밥 스파이크가 제일 컸어요. 추천합니다.", 178, 33, false],
  ["박", "검진 정보", "1일 전", "복부초음파 검진, 어디서 받는 게 좋을까요?", "췌장까지 잘 보는 곳 추천 부탁드려요. 가족력이 있어서 정기적으로 받으려고 합니다.", 96, 53, false],
];
const COMM_GROUPS = [
  ["heartpulse", "당뇨 예방·관리", "12,840명", "혈당·식단·CGM 정보 공유", true, "#F59E0B"],
  ["heart", "간·췌장 건강", "8,210명", "간수치·지방간·복부검진", true, "#0D9488"],
  ["immune", "암 예방·극복", "6,720명", "암 검진·치료·생활관리", true, "#DB2777"],
  ["heartpulse", "심혈관 건강", "9,530명", "혈압·콜레스테롤·심장", false, "#EF4444"],
  ["meal", "다이어트·체중관리", "21,300명", "식단·운동·체중 기록", false, "#16A34A"],
  ["leaf", "금연·절주", "7,440명", "금연·절주 챌린지·후기", false, "#22C55E"],
  ["moon", "수면·스트레스", "5,980명", "수면의 질·스트레스 관리", false, "#6366F1"],
  ["people", "50+ 건강관리", "4,310명", "중년 이후 건강·검진", false, "#2563EB"],
];
const COMM_QNA = [
  { q: "공복혈당이 110인데 당뇨 전단계인가요?", asker: "익명", spec: "내분비내과 전문의", done: true, a: "공복혈당 100~125mg/dL은 ‘공복혈당장애(당뇨 전단계)’에 해당합니다. 식이·운동으로 상당 부분 정상화가 가능하니 3~6개월 생활습관 개선 후 재검을 권합니다." },
  { q: "복부초음파에서 지방간이 나왔는데 운동만으로 좋아지나요?", asker: "이○○", spec: "소화기내과 전문의", done: true, a: "비알코올성 지방간은 체중 7~10% 감량 시 호전되는 경우가 많습니다. 절주·유산소 운동·저당 식단을 병행하고, 간수치·초음파로 추적관찰하세요." },
  { q: "췌장암 가족력이 있는데 어떤 검사를 받아야 하나요?", asker: "익명", spec: "소화기내과 전문의", done: true, a: "고위험군은 복부 초음파·복부 CT/MRI, 필요 시 초음파내시경(EUS)을 고려합니다. 금연·당뇨 관리가 예방에 중요하며 전문의 상담을 권합니다." },
  { q: "콜레스테롤이 높게 나왔는데 약을 꼭 먹어야 하나요?", asker: "박○○", spec: "가정의학과 전문의", done: false, a: "" },
];
const COMM_REVIEW = [
  ["검진센터", "KMI 한국의학연구소 광화문센터", 4.8, "예약·검진·결과까지 빠르고 친절했어요. 결과 설명도 자세합니다.", "조○○"],
  ["병원", "○○내과의원 (은평)", 4.6, "의사선생님이 검사 수치를 그림까지 그려가며 설명해주셔서 이해가 쏙쏙.", "김○○"],
  ["제품", "밀크씨슬 (간 영양제)", 4.7, "3개월 복용 후 GTP 수치가 눈에 띄게 좋아졌어요. 꾸준히 먹는 중.", "이○○"],
  ["식단", "풀무원 디자인밀 저당식", 4.5, "맛있고 혈당 스파이크가 적어요. 바쁜 직장인에게 강추.", "최○○"],
];

function CommunitySection({ onGo }) {
  const [tab, setTab] = useState("feed");
  const go = onGo || (() => {});
  const tabs = [["feed", "인기 피드", TrendingUp], ["groups", "질환별 모임", Users], ["qna", "전문가 Q&A", MessageSquare], ["review", "건강 후기", Star]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="community" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>커뮤니티</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>질환별 모임 · 전문가 Q&A · 건강 후기 — 함께 관리하고 활동하면 Health Token 적립</div></div></div>

      <div className="chalbar">
        <span style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><Footprints size={22} color="#fff" /></span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>이번 주 챌린지 · 하루 8,000보 걷기</div><div style={{ fontSize: 12, opacity: .92, marginTop: 2 }}>참여 3,210명 · 달성 시 <b>+200 HTK</b> · 조성래님 현재 6일째 🔥</div></div>
        <button className="book" style={{ background: "#fff", color: "#F97316", border: "none", padding: "9px 14px", flexShrink: 0 }} onClick={() => go("wallet")}>리워드</button>
      </div>

      <div className="chtabs" style={{ marginTop: 14 }}>{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "feed" && (<>
        {COMM_FEED.map((p, i) => (
          <div className="post" key={i}>
            <div className="ph"><span className="cav" style={{ background: cav(i) }}>{p[0]}</span>
              <div><div className="pname">{p[0]}○○</div><div className="pmeta2">{p[1]} · {p[2]}</div></div>
              <span className="ptag">{p[1]}</span></div>
            <div className="pt2">{p[3]}</div>
            <div className="pbody">{p[4]}</div>
            <div className="pstat"><span><Heart size={14} color="#EF4444" /> {p[5].toLocaleString()}</span><span><MessageSquare size={14} /> {p[6]}</span><span style={{ marginLeft: "auto", color: "var(--blue)", cursor: "pointer" }} onClick={() => go("manage")}>관련 건강관리 ›</span></div>
          </div>
        ))}
        <div className="chnote">※ 데모 게시물입니다. 의학 정보는 참고용이며 진단·치료는 전문의와 상담하세요. 커뮤니티 활동(글·후기·Q&A) 시 Health Token이 적립됩니다.</div>
      </>)}

      {tab === "groups" && (<>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><Sparkles size={14} color="#7C3AED" style={{ verticalAlign: "-2px" }} /> 조성래님 맞춤 추천 모임 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 당뇨·간/췌장·암 위험 기반</span></div>
        <div className="wgrid">{COMM_GROUPS.map(([a, name, mem, d, rec, c], i) => (
          <div className="wcard" key={i}><span className="wi" style={{ background: c + "1A" }}><Art name={a} size={22} /></span>
            <div style={{ flex: 1 }}><div className="wn">{name}{rec && <span className="cbadge" style={{ color: "#7C3AED", background: "#F1ECFE", marginLeft: 5 }}><Sparkles size={10} /> 추천</span>}</div><div className="wd">{d}</div><div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 3, fontWeight: 700 }}><Users size={11} style={{ verticalAlign: "-2px" }} /> {mem}</div></div>
            <button className="book" style={{ alignSelf: "center", padding: "7px 12px" }} onClick={() => toast(`'${name}' 모임에 가입했습니다. Health Token이 적립됩니다.`)}>가입</button></div>
        ))}</div>
        <div className="chnote">※ 추천 모임은 조성래님 리포트(당뇨 위험·간 54.4세·췌장암 경고) 기반 데모입니다.</div>
      </>)}

      {tab === "qna" && (<>
        <div className="airec"><div className="at"><MessageSquare size={16} color="#7C3AED" /> 전문가 Q&A <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>· 의료진이 답변</span></div><div className="ap">건강에 대한 궁금증을 남기면 의료진이 답변해 드려요. (참고용 정보이며 진단·치료를 대신하지 않습니다)</div></div>
        {COMM_QNA.map((x, i) => (
          <div className="qcard" key={i}>
            <div className="q"><span className="qm">Q</span><div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>{x.q}</b><div style={{ fontSize: 11, color: "var(--soft)", marginTop: 2 }}>{x.asker} · {x.done ? "답변완료" : "답변 대기"}</div></div></div>
            {x.done ? <div className="a"><span className="am">A</span><div><div style={{ fontSize: 11.5, color: "#15803D", fontWeight: 800, marginBottom: 3 }}>{x.spec}</div><div style={{ fontSize: 12.3, color: "#3a4659", lineHeight: 1.6 }}>{x.a}</div></div></div>
              : <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 9, background: "#FEF8E0", borderRadius: 10, padding: "9px 11px" }}><Clock size={12} style={{ verticalAlign: "-2px" }} /> {x.spec} 배정 · 답변을 준비 중입니다.</div>}
          </div>
        ))}
        <button className="cbtn pri" onClick={() => go("ai")}><MessageSquare size={15} /> 질문하기 · AI 1차 상담</button>
        <div className="chnote">※ 데모 Q&A입니다. 보험·의료 권유가 아닌 일반 건강정보 제공이며, 구체적 진단·처방은 의료기관에서 받으세요.</div>
      </>)}

      {tab === "review" && (<>
        <div className="benefit"><span><Art name="check" size={16} /> 검진센터</span><span><Art name="building" size={16} /> 병원</span><span><Art name="pill" size={16} /> 건강제품</span><span><Art name="meal" size={16} /> 건강식단</span></div>
        {COMM_REVIEW.map(([type, name, rate, txt, who], i) => (
          <div className="post" key={i}>
            <div className="ph"><span className="cav" style={{ background: cav(i + 2) }}>{who[0]}</span>
              <div><div className="pname">{who}</div><div className="pmeta2">{type} 후기</div></div>
              <span className="ptag" style={{ color: "#B45309", background: "#FEF3E2" }}><Star size={11} style={{ verticalAlign: "-2px" }} /> {rate}</span></div>
            <div className="pt2" style={{ fontSize: 13.5 }}>{name}</div>
            <div className="pbody">{txt}</div>
            <div className="pstat"><span><Heart size={14} color="#EF4444" /> {(120 + i * 47).toLocaleString()}</span><span style={{ marginLeft: "auto", color: "var(--blue)", cursor: "pointer" }} onClick={() => go(type === "검진센터" ? "checkup" : type === "병원" ? "hospital" : "shop")}>해당 서비스 ›</span></div>
          </div>
        ))}
        <div className="chnote">※ 후기는 데모이며, 특정 기관·제품에 대한 의료광고·유인·알선이 아닙니다. 이용자의 합리적 선택을 돕기 위한 참고 정보입니다(의료법 준수).</div>
      </>)}
    </div>
  );
}

