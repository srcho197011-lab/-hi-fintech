/* ====================== 상담 인텔리전스 (Foundry형 분석 앱) ======================
   회원 데이터 스토리지의 상담 이력 → 온톨로지 신호 정규화 → 5대 실행 안내. */
function _ciAgo(d) { return d <= 0 ? "오늘" : d === 1 ? "어제" : d + "일 전"; }
const CI_PIPE = [
  ["스토리지·보안", "회원별 상담 데이터 보관(암호화·DID 동의)", Lock, "#22D3EE"],
  ["데이터 통합", "상담·검진·위험도 통합", Network, "#38BDF8"],
  ["온톨로지", "증상·질환·진료과 의미 정규화", Sparkles, "#A78BFA"],
  ["분석·모델링", "최근성 가중 신호 집계", Activity, "#F472B6"],
  ["운영 앱", "5대 실행 안내로 연결", LayoutDashboard, "#34D399"],
];
const CI_GROUPS = [
  { key: "checkup", t: "추가검진 안내", Ic: ClipboardList, c: "#2563EB", to: "checkup", btn: "검진 예약" },
  { key: "dept", t: "진료과목별 진료 안내", Ic: Stethoscope, c: "#7C3AED", to: "hospital", btn: "병원 찾기" },
  { key: "nutrition", t: "영양 안내", Ic: Pill, c: "#16A34A", to: "shop", btn: "영양제 보기" },
  { key: "device", t: "치료기기 안내", Ic: MonitorSmartphone, c: "#0891B2", to: "shop", btn: "기기 보기" },
  { key: "diet", t: "건강식단 안내", Ic: Salad, c: "#EA580C", to: "shop", btn: "식단 보기" },
];

function CiRecoItem({ group, it, go }) {
  return (
    <div className="ci-reco">
      <div className="ci-reco-src"><Network size={10} /> 근거 <b>{it.from}</b> 상담 · {_ciAgo(it.recent != null ? it.recent : 99)}</div>
      {group.key === "checkup" && (<><div className="ci-reco-t">{it.title} <span className="ci-kind">{it.kind}</span></div><p>{it.detail}</p></>)}
      {group.key === "dept" && (<><div className="ci-reco-t">{it.label} <span className="ci-kind">{it.clinic}</span></div><p>{(it.tags || []).join(" · ")}</p></>)}
      {group.key === "nutrition" && (<><div className="ci-reco-t">{it.dz[0]} 맞춤 영양</div><p><b>영양소</b> {it.nutrients.join(", ")}<br /><b>영양제</b> {it.supp.join(", ")}<br /><b>권장식품</b> {it.food.join(", ")} · <b>주의</b> {it.avoid.join(", ")}</p></>)}
      {group.key === "device" && (<><div className="ci-reco-t">{it.dz[0]} 홈케어 기기</div><p>{it.items.map((x, i) => <span key={i} className="ci-dev">{x[0]} <em>— {x[1]}</em></span>)}</p></>)}
      {group.key === "diet" && (<><div className="ci-reco-t">{it.dz[0]} 식단</div><p><b>원칙</b> {it.principle}<br /><b>권장</b> {it.rec.join(", ")} · <b>주의</b> {it.avoid.join(", ")}</p></>)}
      <button className="ci-reco-btn" style={{ color: group.c, borderColor: group.c + "55" }} onClick={() => go(group.to)}>{group.btn} <ChevronRight size={12} /></button>
    </div>
  );
}

function ConsultIntel({ onGo }) {
  const go = onGo || (() => {});
  const members = typeof demoMembers !== "undefined" ? demoMembers : [];
  const cur = typeof demoCurrentUser === "function" ? demoCurrentUser() : null;
  const roster = cur && !members.some((m) => (m.id || m.email) === (cur.id || cur.email)) ? [cur, ...members] : members;
  const cohort = React.useMemo(() => (typeof pilotCohort === "function" ? pilotCohort() : []), []);
  const [member, setMember] = useState(cur || members[0] || cohort[0] || null);
  const [q, setQ] = useState("");
  const results = React.useMemo(() => { const qq = q.trim(); if (!qq) return []; const up = qq.toUpperCase(); return cohort.filter((m) => (m.name && m.name.indexOf(qq) >= 0) || (m.id && m.id.indexOf(up) >= 0) || (m.diseases && m.diseases.some((d) => d.indexOf(qq) >= 0))).slice(0, 24); }, [q, cohort]);
  const A = React.useMemo(() => (member && typeof analyzeConsults === "function" ? analyzeConsults(member) : null), [member]);
  const catOf = (m) => m.category || (m.isChild ? "아동" : m.age >= 65 ? "노인" : m.sex === "여" ? "여성" : "일반");
  const ageOf = (m) => (m.regAge != null ? m.regAge : m.age);
  const mid = member ? (member.id || member.email) : "";
  const inRoster = roster.some((m) => (m.id || m.email) === mid);
  if (!A) return <div className="ontpanel"><div className="finpl-note">분석할 회원 데이터가 없습니다.</div></div>;
  const kpis = [["총 상담 이벤트", A.stats.total + "건", "#22D3EE"], ["최근 14일", A.stats.last14 + "건", "#F472B6"], ["최다 신호", A.stats.topTopic, "#A78BFA"], ["도출 안내", A.stats.recoCount + "건", "#34D399"], ["안내 커버리지", A.stats.coverage + "/5", "#FBBF24"]];
  return (
    <div style={{ marginTop: 16 }}>
      {/* Foundry 파이프라인 */}
      <div className="ontpanel">
        <div className="ontph"><Network size={15} color="#22D3EE" /> Foundry 파이프라인 <span>· 상담 → 스토리지 → 분석 → 실행 안내</span></div>
        <div className="ci-pipe">{CI_PIPE.map(([t, d, Ic, c], i) => (<React.Fragment key={i}><div className="ci-pipe-s"><span className="ci-pipe-ic" style={{ background: c + "22", color: c }}><Ic size={15} /></span><b>{t}</b><em>{d}</em></div>{i < CI_PIPE.length - 1 && <ChevronRight size={16} className="ci-pipe-arr" />}</React.Fragment>))}</div>
      </div>

      {/* 회원 선택 + KPI */}
      <div className="ontpanel">
        <div className="ci-head">
          <div className="ontph" style={{ margin: 0 }}><Users size={15} color="#38BDF8" /> 분석 대상 회원 <span>· 전체 {cohort.length.toLocaleString()}명 검색</span></div>
          <select className="ci-sel" value={inRoster ? mid : "__cohort"} onChange={(e) => { if (e.target.value === "__cohort") return; const f = roster.find((m) => (m.id || m.email) === e.target.value); if (f) setMember(f); }}>
            <optgroup label="샘플·로그인 회원">{roster.map((m) => <option key={m.id || m.email} value={m.id || m.email}>{m.name} · {catOf(m)} · {ageOf(m)}세{cur && (m.id || m.email) === (cur.id || cur.email) ? " (로그인)" : ""}</option>)}</optgroup>
            {!inRoster && member && <option value="__cohort">{member.name} · {catOf(member)} · {ageOf(member)}세 (검색됨)</option>}
          </select>
        </div>
        <div className="ci-searchrow">
          <div className="ci-search2"><Search size={14} color="#8FA1C0" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · ID(P00001) · 질병으로 10만 회원 검색" />{q && <button className="ci-clr" onClick={() => setQ("")}><X size={13} /></button>}</div>
          <div className="ci-selnow">분석 중 <b>{member.name}</b> <span className="ci-mono">{mid}</span> · {catOf(member)} {ageOf(member)}세{member.sido ? ` · ${member.sido}` : ""}</div>
        </div>
        {q.trim() && (
          <div className="ci-results">
            {results.length ? results.map((m) => (
              <button className="ci-res" key={m.id} onClick={() => { setMember(m); setQ(""); }}>
                <span className="ci-res-id ci-mono">{m.id}</span><b>{m.name}</b><span className="ci-res-sa">{m.sex} {m.age}</span>
                <span className="ci-res-dz">{m.diseases && m.diseases.length ? m.diseases.slice(0, 2).join(", ") + (m.diseases.length > 2 ? " 외" : "") : "건강"}</span>
                {m.riskLabel && <span className="ci-res-risk" style={{ color: m.riskColor, background: (m.riskColor || "#888") + "22" }}>{m.riskLabel}</span>}
              </button>
            )) : <div className="ci-nores">'{q}' 검색 결과가 없습니다.</div>}
            {results.length >= 24 && <div className="ci-more">상위 24명 표시 · 이름·ID·질병으로 더 구체적으로 검색하세요</div>}
          </div>
        )}
        <div className="ci-kpis">{kpis.map(([k, v, c], i) => <div className="ci-kpi" key={i}><div className="ci-kpi-v" style={{ color: c }}>{v}</div><div className="ci-kpi-k">{k}</div></div>)}</div>
      </div>

      <div className="ci-2col">
        {/* 상담 타임라인 */}
        <div className="ontpanel">
          <div className="ontph"><MessageSquare size={15} color="#F472B6" /> 상담 이력 <span>· 시간흐름(최신 우선)</span></div>
          <div className="ci-tl">
            {A.events.slice(0, 12).map((e) => (
              <div className="ci-tl-r" key={e.id}>
                <div className="ci-tl-d"><b>{_ciAgo(e.daysAgo)}</b><span>{e.kind}</span></div>
                <div className="ci-tl-m"><div className="ci-tl-top">{e.topic} <span className="ci-risk" style={{ color: e.riskColor, background: e.riskBg }}>{e.risk}</span></div><p>"{e.question}"</p></div>
              </div>
            ))}
          </div>
          <div className="finpl-note">{member.name}님의 상담이 회원 데이터 하우스에 시간순으로 보관됩니다. 최근 상담일수록 분석 가중치가 높습니다.</div>
        </div>

        {/* 신호 집계 */}
        <div className="ontpanel">
          <div className="ontph"><TrendingUp size={15} color="#A78BFA" /> 온톨로지 신호 <span>· 최근성 가중</span></div>
          <div className="ci-sig">
            {A.signals.slice(0, 7).map((s) => (
              <div className="ci-sig-r" key={s.label}>
                <span className="ci-sig-l">{s.isCancer && <i className="ci-sig-c" title="암 위험 신호" />}{s.label}</span>
                <div className="ci-sig-bar"><i style={{ width: Math.max(8, s.score / A.maxScore * 100) + "%", background: s.isCancer ? "#EF4444" : "#A78BFA" }} /></div>
                <span className="ci-sig-v">{s.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="finpl-note">상담·검진·위험도 신호를 진료과·질환 온톨로지로 정규화해 점수화합니다({A.signals.length}개 신호).</div>
        </div>
      </div>

      {/* 5대 실행 안내 */}
      <div className="ontpanel">
        <div className="ontph"><Sparkles size={15} color="#34D399" /> 분석 결과 · 5대 실행 안내 <span>· 상담 근거 기반</span></div>
        <div className="ci-groups">
          {CI_GROUPS.map((g) => {
            const items = A.reco[g.key] || [];
            return (
              <div className="ci-group" key={g.key} style={{ borderTopColor: g.c }}>
                <div className="ci-group-h"><span className="ci-group-ic" style={{ background: g.c + "22", color: g.c }}><g.Ic size={16} /></span><b>{g.t}</b><span className="ci-group-n" style={{ color: g.c }}>{items.length}</span></div>
                {items.length ? items.slice(0, 4).map((it, i) => <CiRecoItem key={i} group={g} it={it} go={go} />) : <div className="ci-empty">해당 신호 없음 — 안내 없음</div>}
              </div>
            );
          })}
        </div>
        <div className="chnote" style={{ marginTop: 12 }}>※ 상담 내용은 <b>시연용 합성 데이터</b>이며 실제 진단이 아닙니다. 5대 안내는 상담·검진·위험도 신호를 온톨로지(CHECKUP·DISEASE·DEPT·NUTRITION·DEVICE·DIET)로 매핑한 <b>결과 안내</b>로, 확정 진단·처방이 아닙니다. 실서비스는 회원 동의(DID) 하에 암호화 저장·분석됩니다.</div>
      </div>
    </div>
  );
}
