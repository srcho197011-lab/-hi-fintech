/* ====================== 온가족 케어플랜 (가족 경제단위·공유지갑·아동/노인 특화) ====================== */
const FAM_REL = ["배우자", "자녀", "부모", "조부모", "형제"];
function famGroupOf(age, rel) {
  const a = Number(age) || 0;
  if (rel === "자녀" && a < 19) return "아동";
  if (rel === "부모" || rel === "조부모") return a && a < 65 ? "성인" : "노인";
  if (a > 0 && a < 19) return "아동";
  if (a >= 65) return "노인";
  return "성인";
}
function famGroupKey(g) { return g === "아동" ? "아동" : g === "노인" ? "노인" : g === "여성" ? "여성" : "만성질환"; }
function famFocus(g) {
  if (typeof GROUP_KB === "undefined") return null;
  return GROUP_KB[famGroupKey(g)] || null;
}
function famEarn(g) { return g === "아동" ? 400 : g === "노인" ? 650 : 520; }
function famCostEst(g) { return g === "아동" ? 60 : g === "노인" ? 420 : 180; } // 데모 추정 만원/년
function famGroupColor(g) { return g === "아동" ? "#F59E0B" : g === "노인" ? "#7C3AED" : "#2563EB"; }
function familyKey(email) { return "hifin_family_" + (email || "default"); }
function familyLoad(email, surname) {
  try { const v = localStorage.getItem(familyKey(email)); if (v) return JSON.parse(v); } catch (e) {}
  const s = surname || "가";
  return [
    { id: "f1", name: s + "경희", relation: "배우자", age: 53 },
    { id: "f2", name: s + "하준", relation: "자녀", age: 9 },
    { id: "f3", name: s + "순자", relation: "부모", age: 76 },
  ];
}
function familySave(email, list) { try { localStorage.setItem(familyKey(email), JSON.stringify(list)); } catch (e) {} }

function FamilyMemberRow({ m, expanded, onToggle, onRemove }) {
  const g = famGroupOf(m.age, m.relation);
  const col = famGroupColor(g);
  const f = famFocus(g);
  const dependent = g === "아동" || g === "노인";
  return (
    <div className="fmrow" style={{ borderLeftColor: col }}>
      <div className="fmhead" onClick={onToggle}>
        <span className="fmav" style={{ background: col + "1A", color: col }}><CircleUserRound size={20} /></span>
        <div className="fmid">
          <div className="fmn">{m.name} <span className="fmrel">{m.relation}</span> {dependent && <span className="fmdep">보호자 관리</span>}</div>
          <div className="fmsub">{m.age}세 · {g} {f && <span className="fmfocus">· {(f.focus || [])[0]}</span>}</div>
        </div>
        <span className="fmtog">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
      </div>
      {expanded && f && (
        <div className="fmdetail">
          <div className="fmd"><b><CalendarCheck size={13} color="#2563EB" /> 권장 검진</b><span>{(f.screening || []).slice(0, 3).join(" · ")}</span></div>
          <div className="fmd"><b><Pill size={13} color="#F59E0B" /> 영양</b><span>{(f.nutrition || []).slice(0, 4).join(" · ")}</span></div>
          <div className="fmd"><b><Salad size={13} color="#16A34A" /> 식단</b><span>{typeof f.diet === "string" ? f.diet : (f.diet || []).join(" · ")}</span></div>
          <div className="fmd"><b><Activity size={13} color="#7C3AED" /> 관리 포인트</b><span>{(f.focus || []).slice(0, 3).join(" · ")}</span></div>
          <div className="fmd"><b><ShieldCheck size={13} color="#EF4444" /> 지원제도</b><span>{(f.support || []).slice(0, 3).join(" · ")}</span></div>
          {dependent && (f.signs || []).length > 0 && <div className="fmwarn"><Bell size={12} /> 주의 신호: {(f.signs || []).slice(0, 3).join(" · ")}</div>}
          <button className="fmrm" onClick={onRemove}><X size={12} /> 구성원 제외</button>
        </div>
      )}
    </div>
  );
}

function FamilyCareSection({ member, onGo }) {
  const m = member || ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null);
  const go = onGo || (typeof nav === "function" ? nav : (() => {}));
  if (!m) return null;
  const email = m.email;
  const surname = (m.name || "가")[0];
  const [family, setFamily] = useState(() => familyLoad(email, surname));
  const [expanded, setExpanded] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [fName, setFName] = useState(""); const [fRel, setFRel] = useState("자녀"); const [fAge, setFAge] = useState("");
  useEffect(() => { setFamily(familyLoad(email, surname)); }, [email, surname]);

  const addMember = () => {
    if (!fName.trim() || !fAge) { if (typeof toast === "function") toast("이름과 나이를 입력해 주세요."); return; }
    const next = [...family, { id: "f" + Date.now(), name: fName.trim(), relation: fRel, age: Number(fAge) }];
    setFamily(next); familySave(email, next); setAddOpen(false); setFName(""); setFAge("");
    if (typeof toast === "function") toast(`✅ ${fName.trim()}님을 온가족 케어에 추가했어요.`);
  };
  const removeMember = (id) => { const next = family.filter((x) => x.id !== id); setFamily(next); familySave(email, next); };

  // 가족 경제단위 — 공유 건강금융지갑
  const base = (typeof WALLET !== "undefined") ? WALLET.total : 12480;
  const myEarn = (typeof careplanEarned === "function") ? careplanEarned(email) : 0;
  const famEarnSum = family.reduce((s, x) => s + famEarn(famGroupOf(x.age, x.relation)), 0);
  const sharedTotal = base + myEarn + famEarnSum;
  const headCount = family.length + 1;
  const myAge = (typeof demoReport === "function") ? (demoReport(m).reg || 50) : 50;
  const costSum = famCostEst(famGroupOf(myAge, "본인")) + family.reduce((s, x) => s + famCostEst(famGroupOf(x.age, x.relation)), 0);
  const kids = family.filter((x) => famGroupOf(x.age, x.relation) === "아동").length;
  const elders = family.filter((x) => famGroupOf(x.age, x.relation) === "노인").length;

  return (
    <div className="famcare">
      <div className="famhead">
        <span className="famico"><Users size={18} color="#16A34A" /></span>
        <div><div className="famt">온가족 케어플랜</div><div className="famsub">가족 경제단위 · 건강금융지갑 공유 · 아동·노인 통합 관리</div></div>
      </div>

      {/* 가족 공유 건강금융지갑 */}
      <div className="famwallet">
        <div className="fwl"><Coins size={14} /> 가족 공유 건강금융지갑</div>
        <div className="fwtot">{sharedTotal.toLocaleString()} <small>HTK</small></div>
        <div className="fwsub">≈ {(sharedTotal * 10).toLocaleString()}원 상당 · 가족 {headCount}명 적립 통합</div>
        <div className="fwbreak">
          <span><b>{base.toLocaleString()}</b>세대주</span>
          <span><b>+{myEarn.toLocaleString()}</b>내 케어플랜</span>
          <span><b>+{famEarnSum.toLocaleString()}</b>가족 건강활동</span>
        </div>
        <div className="fwnote">가족 구성원의 건강활동 적립이 하나의 지갑으로 모여, <b>아동 예방접종·검진비, 부모님 의료비·장기요양 본인부담</b>을 함께 결제합니다.</div>
        <button className="cbtn pri" style={{ margin: "10px 0 0", maxWidth: 260 }} onClick={() => go("wallet")}><Wallet size={14} /> 가족지갑 사용처 보기</button>
      </div>

      {/* 가족 경제단위 요약 */}
      <div className="famstat">
        <div className="fst"><span className="fsv">{headCount}명</span><span className="fsl">가족 경제단위</span></div>
        <div className="fst"><span className="fsv">{kids}·{elders}</span><span className="fsl">아동·노인</span></div>
        <div className="fst"><span className="fsv">{(myEarn + famEarnSum).toLocaleString()}</span><span className="fsl">건강활동 적립</span></div>
        <div className="fst"><span className="fsv">약 {costSum.toLocaleString()}만</span><span className="fsl">연 의료비 추정</span></div>
      </div>

      {/* 구성원 + 케어 */}
      <div className="famlistlbl"><HeartHandshake size={14} color="#16A34A" /> 가족 구성원 맞춤 케어 <span>· 클릭하면 검진·영양·관리 안내가 펼쳐져요</span></div>
      <div className="famlist">
        {family.map((x) => (
          <FamilyMemberRow key={x.id} m={x} expanded={expanded === x.id} onToggle={() => setExpanded(expanded === x.id ? null : x.id)} onRemove={() => removeMember(x.id)} />
        ))}
      </div>

      {addOpen ? (
        <div className="famadd">
          <div className="faih"><Plus size={14} color="#2563EB" /> 가족 구성원 추가</div>
          <div className="faiin">
            <input placeholder="이름" value={fName} onChange={(e) => setFName(e.target.value)} />
            <select value={fRel} onChange={(e) => setFRel(e.target.value)}>{FAM_REL.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <input placeholder="나이" type="number" value={fAge} onChange={(e) => setFAge(e.target.value)} style={{ maxWidth: 90 }} />
            <button className="csfgo" onClick={addMember}><Check size={13} /> 추가</button>
          </div>
        </div>
      ) : (
        <button className="famaddbtn" onClick={() => setAddOpen(true)}><Plus size={15} /> 가족 구성원 추가</button>
      )}

      <div className="famdisc"><ShieldCheck size={13} /> 가족 구성원 정보·동의는 본인/보호자 동의 하에 관리되며, 본 안내는 일반 건강관리 참고용입니다(데모). 확정 진단·처방은 의료진과 상담하세요.</div>
    </div>
  );
}
