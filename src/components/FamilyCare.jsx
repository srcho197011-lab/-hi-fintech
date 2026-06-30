/* ====================== 온가족 케어플랜 (가족 경제단위·공유지갑·아동/노인·보호자 관리·DID·계정연동·SOS·리포트) ====================== */
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
function famFocus(g) { return (typeof GROUP_KB === "undefined") ? null : (GROUP_KB[famGroupKey(g)] || null); }
function famEarn(g) { return g === "아동" ? 400 : g === "노인" ? 650 : 520; }
function famCostEst(g) { return g === "아동" ? 60 : g === "노인" ? 420 : 180; }
function famGroupColor(g) { return g === "아동" ? "#F59E0B" : g === "노인" ? "#7C3AED" : "#2563EB"; }
function famTasks(g) {
  if (g === "아동") return ["예방접종(NIP) 일정 확인", "영유아·학생 건강검진", "시력·구강 검진", "스마트폰·당류 생활관리"];
  if (g === "노인") return ["노인 건강검진 예약", "복약 관리(다제약물)", "낙상 위험 점검", "인지선별검사", "폐렴구균·대상포진 접종"];
  if (g === "여성") return ["여성암 검진(유방·자궁경부)", "골밀도·갑상선 점검", "철분·칼슘 관리"];
  return ["국가 일반건강검진", "운동·식이 생활관리", "스트레스·수면 관리"];
}
const FAM_TASK_EARN = 80;
const FAM_SPEND_OPTS = [{ item: "아동 예방접종비", amount: 300 }, { item: "부모님 검진비", amount: 1200 }, { item: "가족 복약·영양비", amount: 200 }];
function lsLoad(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function lsSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function familyLoad(email, surname) {
  const v = lsLoad("hifin_family_" + (email || "default"), null);
  if (v) return v;
  const s = surname || "가";
  return [{ id: "f1", name: s + "경희", relation: "배우자", age: 53 }, { id: "f2", name: s + "하준", relation: "자녀", age: 9 }, { id: "f3", name: s + "순자", relation: "부모", age: 76 }];
}
function familySave(email, list) { lsSave("hifin_family_" + (email || "default"), list); }
function famDemoList() { return (typeof demoMembers !== "undefined" && Array.isArray(demoMembers)) ? demoMembers : []; }
function famLinkedReport(linkEmail) {
  if (!linkEmail || typeof demoMembers === "undefined" || typeof demoReport !== "function") return null;
  const src = demoMembers.find((x) => x.email === linkEmail); if (!src) return null;
  const R = demoReport(src);
  return { bio: R.bio, diff: R.diff, cancerTotal: R.cancerTotal, tags: [...(src.highRiskCancerTypes || []), ...(src.highRiskDiseases || [])].slice(0, 3) };
}

function FamilyMemberRow({ m, expanded, onToggle, onRemove, tasks, taskState, onTask, consent, onConsent, memberList, linkedEmail, onLink, sosActive, onSOS, guardian }) {
  const g = famGroupOf(m.age, m.relation);
  const col = famGroupColor(g);
  const f = famFocus(g);
  const dependent = g === "아동" || g === "노인";
  const isElder = g === "노인";
  const tdone = tasks.filter((_, i) => taskState[i]).length;
  const tpct = tasks.length ? Math.round(tdone / tasks.length * 100) : 0;
  const lr = famLinkedReport(linkedEmail);
  return (
    <div className="fmrow" style={{ borderLeftColor: col }}>
      <div className="fmhead" onClick={onToggle}>
        <span className="fmav" style={{ background: col + "1A", color: col }}><CircleUserRound size={20} /></span>
        <div className="fmid">
          <div className="fmn">{m.name} <span className="fmrel">{m.relation}</span> {dependent && <span className="fmdep">보호자 관리</span>} {linkedEmail && <span className="fmlinkb">데이터 연동</span>}</div>
          <div className="fmsub">{m.age}세 · {g} · 관리 {tpct}%{!consent && <span className="fmnoc"> · 동의대기</span>}</div>
        </div>
        <span className="fmtog">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
      </div>
      {expanded && (
        <div className="fmdetail">
          <div className="fmconsent"><span><ShieldCheck size={13} color={consent ? "#16A34A" : "#94A3B8"} /> 데이터 공유 동의(DID) {consent ? "· 공유중" : "· 대기"}</span>
            <button className={`fmsw ${consent ? "on" : ""}`} onClick={onConsent} aria-label="동의 전환"><i /></button></div>
          {consent ? (<>
            <div className="fmlink"><span><Activity size={13} color="#2563EB" /> 본인 계정 건강데이터 연동</span>
              <select value={linkedEmail || ""} onChange={(e) => onLink(e.target.value)}><option value="">연동 안 함</option>{memberList.map((mm) => <option key={mm.email} value={mm.email}>{mm.name}</option>)}</select></div>
            {lr && (<div className="fmlinked"><div><b>{lr.bio}세</b><span>생체나이</span></div><div><b>{lr.diff > 0 ? "+" : ""}{lr.diff}</b><span>실연령차</span></div><div><b>{lr.cancerTotal}등급</b><span>암위험</span></div><div className="fmlz">{lr.tags.length ? lr.tags.join("·") : "양호"}</div></div>)}
            {isElder && (<div className="fmsoswrap">
              <button className="fmsosbtn" onClick={onSOS}><AlertTriangle size={14} /> 응급 SOS {sosActive ? "닫기" : ""}</button>
              {sosActive && (<div className="fmsospanel"><b>🚨 응급 알림 (데모)</b>
                <p>보호자 <b>{guardian}</b>님께 {m.name}님의 위치·상태 알림을 발송합니다(데모, 실제 발송 없음).</p>
                <p>낙상·이상징후 자동 감지 시 보호자·지정 연락처에 자동 호출되도록 설계됩니다.</p>
                <p className="fmsos119">실제 응급 상황에서는 즉시 <b>119</b>에 연락하세요.</p>
                <button className="fmsosgo" onClick={() => { if (typeof toast === "function") toast(`🚨 (데모) ${m.name}님 응급 알림을 보호자 ${guardian}님께 발송했습니다.`); onSOS(); }}><Bell size={13} /> 보호자에게 알림(데모)</button></div>)}
            </div>)}
            <div className="fmtasklbl"><ClipboardList size={13} color="#2563EB" /> 보호자 관리 체크리스트 <span>{tdone}/{tasks.length} · 완료 시 가족지갑 +{FAM_TASK_EARN} HTK</span></div>
            <div className="fmtaskbar"><i style={{ width: tpct + "%" }} /></div>
            <div className="fmtasks">{tasks.map((t, i) => (<button key={i} className={`fmtask ${taskState[i] ? "done" : ""}`} onClick={() => onTask(i)}>{taskState[i] ? <Check size={13} /> : <span className="fmtb" />} {t}</button>))}</div>
            {f && (<div className="fmcareinfo">
              <div className="fmd"><b><CalendarCheck size={13} color="#2563EB" /> 검진</b><span>{(f.screening || []).slice(0, 3).join(" · ")}</span></div>
              <div className="fmd"><b><Pill size={13} color="#F59E0B" /> 영양</b><span>{(f.nutrition || []).slice(0, 3).join(" · ")}</span></div>
              <div className="fmd"><b><Salad size={13} color="#16A34A" /> 식단</b><span>{typeof f.diet === "string" ? f.diet : (f.diet || []).join(" · ")}</span></div>
              <div className="fmd"><b><ShieldCheck size={13} color="#EF4444" /> 지원</b><span>{(f.support || []).slice(0, 3).join(" · ")}</span></div>
              {dependent && (f.signs || []).length > 0 && <div className="fmwarn"><Bell size={12} /> 주의 신호: {(f.signs || []).slice(0, 3).join(" · ")}</div>}
            </div>)}
          </>) : (<div className="fmnocons">데이터 공유에 동의하면 맞춤 케어와 보호자 체크리스트가 제공됩니다.</div>)}
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
  const [taskMap, setTaskMap] = useState(() => lsLoad("hifin_famtask_" + email, {}));
  const [consentMap, setConsentMap] = useState(() => lsLoad("hifin_famconsent_" + email, {}));
  const [spend, setSpend] = useState(() => lsLoad("hifin_famspend_" + email, []));
  const [linkMap, setLinkMap] = useState(() => lsLoad("hifin_famlink_" + email, {}));
  const [sosId, setSosId] = useState(null);
  const [autoAlert, setAutoAlert] = useState(() => lsLoad("hifin_famauto_" + email, true));
  useEffect(() => { setFamily(familyLoad(email, surname)); setTaskMap(lsLoad("hifin_famtask_" + email, {})); setConsentMap(lsLoad("hifin_famconsent_" + email, {})); setSpend(lsLoad("hifin_famspend_" + email, [])); setLinkMap(lsLoad("hifin_famlink_" + email, {})); }, [email, surname]);

  const consentOf = (id) => (consentMap[id] !== undefined ? consentMap[id] : true);
  const toggleTask = (id, i) => { const cur = { ...(taskMap[id] || {}) }; cur[i] = !cur[i]; const next = { ...taskMap, [id]: cur }; setTaskMap(next); lsSave("hifin_famtask_" + email, next); if (cur[i] && typeof toast === "function") toast(`✅ 보호자 관리 완료 · 가족지갑 +${FAM_TASK_EARN} HTK`); };
  const toggleConsent = (id) => { const next = { ...consentMap, [id]: !consentOf(id) }; setConsentMap(next); lsSave("hifin_famconsent_" + email, next); };
  const setLink = (id, le) => { const next = { ...linkMap, [id]: le }; if (!le) delete next[id]; setLinkMap(next); lsSave("hifin_famlink_" + email, next); if (le && typeof toast === "function") toast("✅ 본인 계정 건강데이터를 연동했어요."); };
  const addSpendItem = (opt) => { const e = { id: "s" + Date.now(), item: opt.item, amount: opt.amount }; const next = [...spend, e]; setSpend(next); lsSave("hifin_famspend_" + email, next); if (typeof toast === "function") toast(`💳 (데모) 가족지갑에서 ${opt.item} ${opt.amount.toLocaleString()} HTK 결제`); };
  const removeSpend = (id) => { const next = spend.filter((x) => x.id !== id); setSpend(next); lsSave("hifin_famspend_" + email, next); };
  const addMember = () => { if (!fName.trim() || !fAge) { if (typeof toast === "function") toast("이름과 나이를 입력해 주세요."); return; } const next = [...family, { id: "f" + Date.now(), name: fName.trim(), relation: fRel, age: Number(fAge) }]; setFamily(next); familySave(email, next); setAddOpen(false); setFName(""); setFAge(""); if (typeof toast === "function") toast(`✅ ${fName.trim()}님을 온가족 케어에 추가했어요.`); };
  const removeMember = (id) => { const next = family.filter((x) => x.id !== id); setFamily(next); familySave(email, next); };

  const base = (typeof WALLET !== "undefined") ? WALLET.total : 12480;
  const myEarn = (typeof careplanEarned === "function") ? careplanEarned(email) : 0;
  const famEarnSum = family.reduce((s, x) => s + famEarn(famGroupOf(x.age, x.relation)), 0);
  const taskEarnSum = family.reduce((s, x) => s + Object.values(taskMap[x.id] || {}).filter(Boolean).length * FAM_TASK_EARN, 0);
  const spentSum = spend.reduce((s, x) => s + x.amount, 0);
  const totalEarn = myEarn + famEarnSum + taskEarnSum;
  const sharedAvail = base + totalEarn - spentSum;
  const headCount = family.length + 1;
  const myAge = (typeof demoReport === "function") ? (demoReport(m).reg || 50) : 50;
  const costSum = famCostEst(famGroupOf(myAge, "본인")) + family.reduce((s, x) => s + famCostEst(famGroupOf(x.age, x.relation)), 0);
  const kids = family.filter((x) => famGroupOf(x.age, x.relation) === "아동").length;
  const elders = family.filter((x) => famGroupOf(x.age, x.relation) === "노인").length;
  const memberList = famDemoList();
  const memberStats = family.map((x) => { const g = famGroupOf(x.age, x.relation); const tks = famTasks(g); const dn = Object.values(taskMap[x.id] || {}).filter(Boolean).length; const pct = tks.length ? Math.round(dn / tks.length * 100) : 0; return { id: x.id, name: x.name, g, total: tks.length, done: dn, pct, consent: consentOf(x.id), linked: famLinkedReport(linkMap[x.id] || "") }; });
  const openCare = memberStats.reduce((s, x) => s + (x.consent ? (x.total - x.done) : 0), 0);
  const noConsentN = memberStats.filter((x) => !x.consent).length;
  const focusN = memberStats.filter((x) => x.g === "노인" || x.g === "아동").length;
  const linkedN = memberStats.filter((x) => x.linked).length;
  const alerts = [];
  memberStats.forEach((x) => { if (!x.consent) { alerts.push({ id: x.id, name: x.name, text: "데이터 공유 동의 필요", col: "#94A3B8" }); return; } if (x.linked && x.linked.cancerTotal >= 6) alerts.push({ id: x.id, name: x.name, text: "고위험 — 병원 상담 권장", col: "#EF4444" }); if (x.pct < 100) alerts.push({ id: x.id, name: x.name, text: `보호자 케어 ${x.total - x.done}건 남음`, col: "#F59E0B" }); });
  const topAlerts = alerts.slice(0, 4);
  const ranking = [...memberStats].sort((a, b) => b.pct - a.pct);
  const totalDone = memberStats.reduce((s, x) => s + x.done, 0);
  const consentN = memberStats.filter((x) => x.consent).length;
  const missions = [
    { t: "가족 전원 데이터 공유 동의", cur: consentN, max: memberStats.length || 1, reward: 200 },
    { t: "이번 주 보호자 케어 6건 완료", cur: Math.min(totalDone, 6), max: 6, reward: 300 },
    { t: "가족지갑 1만 HTK 적립", cur: Math.min(totalEarn, 10000), max: 10000, reward: 500 },
  ];
  const sendAlert = (a) => { if (typeof toast === "function") toast(`🔔 (데모) ${a.name}님께 '${a.text}' 케어 알림을 발송했습니다.`); };
  const toggleAuto = () => { const v = !autoAlert; setAutoAlert(v); lsSave("hifin_famauto_" + email, v); if (typeof toast === "function") toast(v ? "가족 케어 자동 알림을 켰어요." : "자동 알림을 껐어요."); };

  const printFamilyReport = () => {
    const rows = family.map((x) => { const g = famGroupOf(x.age, x.relation); const tks = famTasks(g); const dn = Object.values(taskMap[x.id] || {}).filter(Boolean).length; const f = famFocus(g); const cons = consentOf(x.id); return `<tr><td>${x.name} (${x.relation})</td><td>${x.age}세 · ${g}</td><td>${tks.length ? Math.round(dn / tks.length * 100) : 0}% (${dn}/${tks.length})</td><td>${cons ? "공유중" : "대기"}</td><td>${cons && f ? (f.screening || []).slice(0, 2).join(", ") : "-"}</td></tr>`; }).join("");
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${m.name}님 온가족 케어 리포트</title><style>body{font-family:system-ui,'Malgun Gothic',sans-serif;padding:30px;color:#15234A}h1{font-size:20px;margin:0 0 4px}.sub{color:#7886a8;font-size:12px}.box{background:#F1FBF5;border:1px solid #C4ECD3;border-radius:10px;padding:12px;margin:14px 0;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:8px}td{border-bottom:1px solid #e5e9f0;padding:9px;font-size:12.5px}thead td{font-weight:700;background:#f6f8fc}.disc{margin-top:14px;font-size:11px;color:#a05a00}</style></head><body><div class="sub">HI-Fin Tech · 온가족 케어플랜</div><h1>${m.name}님 가족 건강·금융 리포트</h1><div class="box"><b>가족 경제단위:</b> ${headCount}명(아동 ${kids}·노인 ${elders}) · <b>공유 건강금융지갑:</b> ${sharedAvail.toLocaleString()} HTK(적립 +${totalEarn.toLocaleString()} / 사용 -${spentSum.toLocaleString()}) · <b>연 의료비 추정:</b> 약 ${costSum.toLocaleString()}만원</div><table><thead><tr><td>구성원</td><td>나이·구분</td><td>관리 진행률</td><td>데이터 동의</td><td>권장 검진</td></tr></thead><tbody>${rows}</tbody></table><div class="disc">※ 데모 예시 수치이며 일반 건강관리 참고용입니다. 확정 진단·처방은 의료진과 상담하세요.</div></body></html>`;
    const w = window.open("", "_blank", "width=760,height=900"); if (!w) { if (typeof toast === "function") toast("팝업이 차단되었습니다. 허용 후 다시 시도하세요."); return; } w.document.write(html); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350);
  };

  return (
    <div className="famcare">
      <div className="famhead">
        <span className="famico"><Users size={18} color="#16A34A" /></span>
        <div style={{ flex: 1 }}><div className="famt">온가족 케어플랜</div><div className="famsub">가족 경제단위 · 공유지갑 · 보호자 관리 · DID · 계정연동</div></div>
        <button className="famrep" onClick={printFamilyReport}><FileText size={13} /> 가족 리포트</button>
      </div>

      <div className="famdash">
        <div className="fdh"><ClipboardList size={14} color="#2563EB" /> 세대주 대시보드 · 가족 통합 관리
          <button className={`fdauto ${autoAlert ? "on" : ""}`} onClick={toggleAuto}><Bell size={12} /> 자동 알림 {autoAlert ? "ON" : "OFF"}</button></div>
        <div className="fdgrid">
          <div className="fdc"><b>{openCare}</b><span>미완료 케어</span></div>
          <div className="fdc"><b>{noConsentN}</b><span>동의 필요</span></div>
          <div className="fdc"><b>{focusN}</b><span>집중관리(노·아)</span></div>
          <div className="fdc"><b>{linkedN}</b><span>데이터 연동</span></div>
        </div>
        {topAlerts.length > 0 ? (<div className="fdalerts">{topAlerts.map((a, i) => (
          <div className="fdalert" key={i}><span className="fdad" style={{ background: a.col }} /><div className="fdax"><b>{a.name}</b> {a.text}</div><button className="fdsend" onClick={() => sendAlert(a)} disabled={!autoAlert}><Bell size={12} /> 알림</button></div>
        ))}</div>) : (<div className="fdok"><Check size={14} color="#16A34A" /> 가족 케어가 모두 정상입니다.</div>)}
      </div>

      <div className="famwallet">
        <div className="fwl"><Coins size={14} /> 가족 공유 건강금융지갑</div>
        <div className="fwtot">{sharedAvail.toLocaleString()} <small>HTK</small></div>
        <div className="fwsub">≈ {(sharedAvail * 10).toLocaleString()}원 상당 · 가족 {headCount}명 통합 잔액</div>
        <div className="fwbreak"><span><b>{base.toLocaleString()}</b>세대주</span><span><b>+{totalEarn.toLocaleString()}</b>가족 적립</span><span><b>-{spentSum.toLocaleString()}</b>가족 사용</span></div>
        <div className="fwnote">가족 구성원의 건강활동·보호자 관리 적립이 하나의 지갑으로 모여, <b>아동 예방접종·검진비, 부모님 의료비·장기요양 본인부담</b>을 함께 결제합니다.</div>
        <button className="cbtn pri" style={{ margin: "10px 0 0", maxWidth: 260 }} onClick={() => go("wallet")}><Wallet size={14} /> 가족지갑 사용처 보기</button>
      </div>

      <div className="famstat">
        <div className="fst"><span className="fsv">{headCount}명</span><span className="fsl">가족 경제단위</span></div>
        <div className="fst"><span className="fsv">{kids}·{elders}</span><span className="fsl">아동·노인</span></div>
        <div className="fst"><span className="fsv">{totalEarn.toLocaleString()}</span><span className="fsl">건강활동 적립</span></div>
        <div className="fst"><span className="fsv">약 {costSum.toLocaleString()}만</span><span className="fsl">연 의료비 추정</span></div>
      </div>

      <div className="famrank">
        <div className="frh"><Sparkles size={14} color="#F59E0B" /> 가족 건강 랭킹 <span>· 보호자 케어 진행률</span></div>
        <div className="frlist">{ranking.map((x, i) => (
          <div className="frrow" key={x.id}><span className="frmedal">{["🥇", "🥈", "🥉"][i] || (i + 1)}</span><span className="frn">{x.name} <small>{x.g}</small></span><div className="frbar"><i style={{ width: x.pct + "%", background: famGroupColor(x.g) }} /></div><b className="frp">{x.pct}%</b></div>
        ))}</div>
        <div className="frh" style={{ marginTop: 13 }}><Coins size={14} color="#16A34A" /> 가족 건강 미션 <span>· 달성 시 가족지갑 적립</span></div>
        <div className="fmislist">{missions.map((ms, i) => { const done = ms.cur >= ms.max; const pc = Math.min(100, Math.round(ms.cur / ms.max * 100)); return (
          <div className={`fmis ${done ? "done" : ""}`} key={i}><div className="fmistop"><span>{done ? <Check size={13} color="#16A34A" /> : <span className="fmisb" />} {ms.t}</span><b>+{ms.reward}</b></div><div className="fmisbar"><i style={{ width: pc + "%" }} /></div><span className="fmisc">{ms.cur.toLocaleString()}/{ms.max.toLocaleString()}{done ? " · 달성!" : ""}</span></div>
        ); })}</div>
      </div>

      <div className="famlistlbl"><HeartHandshake size={14} color="#16A34A" /> 가족 구성원 맞춤 케어 <span>· 클릭하면 동의·연동·SOS·체크리스트가 펼쳐져요</span></div>
      <div className="famlist">
        {family.map((x) => (
          <FamilyMemberRow key={x.id} m={x} expanded={expanded === x.id} onToggle={() => setExpanded(expanded === x.id ? null : x.id)} onRemove={() => removeMember(x.id)}
            tasks={famTasks(famGroupOf(x.age, x.relation))} taskState={taskMap[x.id] || {}} onTask={(i) => toggleTask(x.id, i)}
            consent={consentOf(x.id)} onConsent={() => toggleConsent(x.id)} memberList={memberList} linkedEmail={linkMap[x.id] || ""} onLink={(le) => setLink(x.id, le)}
            sosActive={sosId === x.id} onSOS={() => setSosId(sosId === x.id ? null : x.id)} guardian={m.name} />
        ))}
      </div>

      {addOpen ? (
        <div className="famadd">
          <div className="faih"><Plus size={14} color="#2563EB" /> 가족 구성원 추가</div>
          <div className="faiin"><input placeholder="이름" value={fName} onChange={(e) => setFName(e.target.value)} /><select value={fRel} onChange={(e) => setFRel(e.target.value)}>{FAM_REL.map((r) => <option key={r} value={r}>{r}</option>)}</select><input placeholder="나이" type="number" value={fAge} onChange={(e) => setFAge(e.target.value)} style={{ maxWidth: 90 }} /><button className="csfgo" onClick={addMember}><Check size={13} /> 추가</button></div>
        </div>
      ) : (<button className="famaddbtn" onClick={() => setAddOpen(true)}><Plus size={15} /> 가족 구성원 추가</button>)}

      <div className="famspend">
        <div className="fsh"><Wallet size={14} color="#16A34A" /> 가족지갑 공동 결제 <span>· 구성원 의료비를 가족 적립으로 결제(데모)</span></div>
        <div className="fsopts">{FAM_SPEND_OPTS.map((o, i) => (<button key={i} className="fsopt" onClick={() => addSpendItem(o)} disabled={sharedAvail < o.amount}><Coins size={13} /> {o.item} <b>-{o.amount.toLocaleString()}</b></button>))}</div>
        {spend.length > 0 && (<div className="fslist">{spend.slice().reverse().map((s) => (<div className="fsrow" key={s.id}><span className="fsi">{s.item}</span><span className="fsa">-{s.amount.toLocaleString()} HTK</span><button onClick={() => removeSpend(s.id)} aria-label="취소"><X size={12} /></button></div>))}</div>)}
      </div>

      <div className="famdisc"><ShieldCheck size={13} /> 가족 구성원 정보·데이터 공유는 본인/보호자 DID 동의 하에 관리되며, 결제·적립·연동 수치는 데모 예시입니다. 응급 SOS는 데모이며 실제 응급 시 119에 연락하세요.</div>
    </div>
  );
}
