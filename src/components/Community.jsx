/* 커뮤니티 데이터(CAV_COLORS·COMM_FEED·COMM_GROUPS·COMM_QNA·COMM_REVIEW) → src/data/sectionData.js 로 이관 */
const cav = (i) => CAV_COLORS[i % CAV_COLORS.length];

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

