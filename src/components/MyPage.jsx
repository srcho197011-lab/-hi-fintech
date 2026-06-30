function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 44, height: 26, borderRadius: 999, background: on ? "var(--green)" : "#CBD5E1", position: "relative", cursor: "pointer", transition: ".2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: ".2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </div>
  );
}
/* 마이페이지 데이터(MY_CONSENT·MY_NOTI·MY_FAMILY) → src/data/sectionData.js 로 이관 */

function MyPageSection({ onGo }) {
  const [tab, setTab] = useState("profile");
  const go = onGo || (() => {});
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const [consent, setConsent] = useState(MY_CONSENT.map((c) => c[3]));
  const [noti, setNoti] = useState(MY_NOTI.map((n) => n[2]));
  const [logQ, setLogQ] = useState("");
  const [logRisk, setLogRisk] = useState(null);
  const [logConsent, setLogConsent] = useState(LOG_CONSENT);
  const [logVer, setLogVer] = useState(0);
  const [logPeriod, setLogPeriod] = useState(null);
  const exportLog = (fmt) => {
    if (!AI_SESSIONS.length) { toast("내보낼 상담 기록이 없습니다."); return; }
    let content, ext, mime;
    if (fmt === "json") {
      content = JSON.stringify({ ai_doctor_sessions: AI_SESSIONS, insurance_recommendation_logs: INS_REC_LOGS }, null, 2);
      ext = "json"; mime = "application/json;charset=utf-8";
    } else {
      const head = ["id", "question", "risk_level", "recommended_action", "referenced_content_ids", "recommended_coverages", "created_at"];
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const rows = AI_SESSIONS.map((s) => { const ins = INS_REC_LOGS.find((x) => x.session_id === s.id); return [s.id, s.question, s.risk_level, s.recommended_action, s.referenced_content_ids.join("|"), ins ? ins.recommended_coverages.join("|") : "", s.created_at]; });
      content = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
      ext = "csv"; mime = "text/csv;charset=utf-8";
    }
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `ai_consult_log.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast(`상담 기록을 ${ext.toUpperCase()} 파일로 내보냈습니다.`);
    } catch (e) { toast("내보내기에 실패했습니다."); }
  };
  const tabs = [["profile", "내 정보", CircleUserRound], ["consent", "동의관리", Lock], ["family", "가족 건강", Users], ["ailog", "상담 기록", MessageSquare], ["noti", "알림 설정", Bell]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="mypage" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>마이페이지</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>내 정보 · 동의관리(DID) · 가족 건강관리 · 알림 설정</div></div></div>

      <DemoMemberBanner />
      {dm && typeof CarePlanCard === "function" && <CarePlanCard member={dm} />}
      {dm && typeof FamilyCareSection === "function" && <FamilyCareSection member={dm} onGo={onGo} />}
      <div className="profile">
        <span className="pa">{dm ? dm.name[0] : "조"}</span>
        <div><div className="pn">{dm ? dm.name : "조성래"} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{dm ? `생체나이 ${dm.biologicalAge}세 · 데모회원` : "54.1세 · 남"}</span></div><div className="pmeta"><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {dm ? `${dm.email} · 멤버십 데모 · ID ${dm.id}` : <>{PT.addr} · 멤버십 <b style={{ color: "#B45309" }}>골드</b> · 등록번호 {PT.reg}</>}</div></div>
        <div className="pstats">
          {[["12,480", "Health Token", "wallet"], ["6", "Health NFT", "nft"], ["1", "검진 예약", "checkup"], ["1", "보유 보험", "insurance"]].map(([v, k, to]) => (<div className="pstat" key={k} style={{ cursor: "pointer" }} onClick={() => go(to)}><div className="v">{v}</div><div className="k">{k}</div></div>))}
        </div>
      </div>

      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "ailog" && (() => {
        const nowMs = Date.now();
        const sessions = AI_SESSIONS.slice().reverse().filter((s) => (!logQ.trim() || s.question.includes(logQ.trim())) && (!logRisk || s.risk_level === logRisk) && (!logPeriod || (nowMs - new Date(s.created_at).getTime()) <= logPeriod * 86400000));
        return (
        <div className="card">
          <div className="rct"><MessageSquare size={18} color="#2563EB" /> AI 주치의 상담 기록 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{AI_SESSIONS.length}건</span></div>
          <div className="logconsent">
            <div className="lc-l"><Lock size={15} color={logConsent ? "#16A34A" : "#94A3B8"} /><div><b>상담 기록 저장 동의 (DID)</b><span>{logConsent ? "동의함 — 상담 내용이 안전하게 기록됩니다." : "철회됨 — 새 상담은 저장되지 않습니다."}</span></div></div>
            <button className={`tgl ${logConsent ? "on" : ""}`} onClick={() => { const v = !logConsent; LOG_CONSENT = v; setLogConsent(v); toast(v ? "상담 기록 저장에 동의했습니다." : "동의를 철회했습니다. 새 상담은 저장되지 않습니다."); }} aria-label="상담 기록 저장 동의 토글"><span /></button>
          </div>
          {AI_SESSIONS.length === 0 ? (
            <div style={{ textAlign: "center", padding: "26px 14px", color: "var(--muted)" }}>
              <MessageSquare size={26} color="#B8C2D6" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>{logConsent ? "아직 상담 기록이 없습니다." : "동의 철회 상태입니다. 저장된 기록이 없습니다."}</div>
              <button className="cbtn pri" style={{ maxWidth: 260, margin: "14px auto 0" }} onClick={() => go("ai")}><MessageSquare size={15} /> AI 주치의 상담하러 가기</button>
            </div>
          ) : (<>
            <div className="logstats">
              <div className="lsh"><TrendingUp size={14} color="#2563EB" /> 위험도 분포</div>
              {RISK.map((r) => { const cnt = AI_SESSIONS.filter((s) => s.risk_level === r[0]).length; const pct = AI_SESSIONS.length ? Math.round(cnt / AI_SESSIONS.length * 100) : 0; return (
                <div className="lsrow" key={r[0]}><span className="lsl" style={{ color: r[1] }}>{r[0]}</span><div className="lsbar"><span style={{ width: pct + "%", background: r[1] }} /></div><span className="lsv">{cnt} · {pct}%</span></div>
              ); })}
            </div>
            <div className="logfilter">
              <div className="lf-s"><Search size={14} /><input value={logQ} onChange={(e) => setLogQ(e.target.value)} placeholder="상담 내용 검색" /></div>
              <div className="lf-r">
                <button className={!logRisk ? "on" : ""} onClick={() => setLogRisk(null)}>전체</button>
                {RISK.map((r) => <button key={r[0]} className={logRisk === r[0] ? "on" : ""} style={logRisk === r[0] ? { color: "#fff", background: r[1], borderColor: r[1] } : { color: r[1] }} onClick={() => setLogRisk(r[0])}>{r[0]}</button>)}
              </div>
              <div className="lf-r"><span className="lfl">기간</span>{[["전체", null], ["오늘", 1], ["최근 7일", 7], ["최근 30일", 30]].map(([t, v]) => <button key={t} className={logPeriod === v ? "on" : ""} onClick={() => setLogPeriod(v)}>{t}</button>)}</div>
            </div>
            {sessions.length === 0 ? <div className="aidlogempty" style={{ padding: "18px 4px" }}>조건에 맞는 상담 기록이 없습니다.</div> :
              sessions.slice(0, 20).map((s) => { const ri = RISK.findIndex((r) => r[0] === s.risk_level); const ins = INS_REC_LOGS.find((x) => x.session_id === s.id); return (
                <div className="mylog" key={s.id}>
                  <div className="mlh"><span className="mlq">“{s.question}”</span><span className="mlr" style={{ color: RISK[ri < 0 ? 0 : ri][1], background: RISK[ri < 0 ? 0 : ri][2] }}>{s.risk_level}</span></div>
                  <div className="mlm">권장: {s.recommended_action}{s.referenced_content_ids.length ? " · 참조: " + s.referenced_content_ids.join(", ") : ""}</div>
                  {ins && ins.recommended_coverages.length ? <div className="mlc"><ShieldCheck size={12} /> 보장 검토: {ins.recommended_coverages.join(", ")}</div> : null}
                </div>
              ); })}
            <div className="logmeta">{sessions.length}건 표시 · 전체 {AI_SESSIONS.length}건</div>
            <div className="chnote">※ 본 기록은 데모용 세션 로그입니다. 실서비스에서는 <b>ai_doctor_sessions</b>·<b>insurance_recommendation_logs</b> 테이블에 개인정보보호 기준으로 분리·암호화 저장되며, <b>동의 철회 시 즉시 삭제</b>됩니다.</div>
            <div className="gorow" style={{ marginTop: 4 }}><button className="gobtn pri" onClick={() => go("ai")}><MessageSquare size={14} /> 상담 계속하기</button><button className="gobtn" onClick={() => exportLog("csv")}><FileText size={14} /> CSV 내보내기</button><button className="gobtn" onClick={() => exportLog("json")}><FileText size={14} /> JSON 내보내기</button><button className="gobtn" onClick={() => { if (AI_SESSIONS.length) { AI_SESSIONS.length = 0; INS_REC_LOGS.length = 0; setLogVer((v) => v + 1); toast("상담 기록을 모두 삭제했습니다."); } }}><X size={14} /> 기록 전체 삭제</button></div>
          </>)}
        </div>);
      })()}

      {tab === "profile" && (<>
        <div className="card">
          <div className="rct"><CircleUserRound size={18} color="#2563EB" /> 개인정보 <button className="cbtn2" style={{ marginLeft: "auto" }} onClick={() => toast("개인정보 수정 화면은 준비 중입니다.")}><RefreshCw size={13} /> 수정</button></div>
          {[["성명", PT.name], ["생년월일", "1970.11.20"], ["성별", "남"], ["휴대전화", "010-****-1234"], ["이메일(ID)", "srcho197011@***.com"], ["주소", PT.addr]].map(([l, v]) => (
            <div className="costrow" key={l}><span className="cl">{l}</span><span className="cv" style={{ color: "var(--text)" }}>{v}</span><span className="ca" /></div>
          ))}
          <div className="chnote" style={{ marginTop: 8 }}>※ 휴대전화·이메일은 일부 마스킹되어 표시됩니다. 주민등록번호 등 민감정보는 본인인증(PASS) 후 암호화 처리됩니다.</div>
        </div>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#7C3AED" /> 내 활동 요약</div>
          <div className="benefit" style={{ marginBottom: 0 }}><span><Art name="coin" size={15} /> 토큰 12,480</span><span><Art name="badge" size={15} /> NFT 6</span><span><Art name="calendar" size={15} /> 예약 1</span><span><Art name="people" size={15} /> 모임 3</span><span><Art name="star" size={15} /> 후기 4</span></div>
          <div className="gorow" style={{ marginTop: 12 }}><button className="gobtn pri" onClick={() => go("manage")}><Activity size={14} /> 건강관리</button><button className="gobtn" onClick={() => go("wallet")}><Coins size={14} /> 건강금융지갑</button><button className="gobtn" onClick={() => go("nft")}><BadgeCheck size={14} /> Health NFT</button></div>
        </div>
      </>)}

      {tab === "consent" && (<>
        <div className="airec"><div className="at"><Lock size={16} color="#2F5BEA" /> 동의관리 · DID(분산신원)</div><div className="ap">내 데이터 제공·활용 동의를 직접 관리하고 언제든 철회할 수 있어요. 필수 항목은 서비스 이용에 필요합니다.</div></div>
        {MY_CONSENT.map(([a, t, d, _def, req], i) => (
          <div className="resitem" key={i}><span className="ic" style={{ background: "#EAF0FE" }}><Art name={a} size={18} /></span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t} <span className={`reqtag ${req === "필수" ? "req" : "opt"}`} style={{ marginLeft: 4 }}>{req}</span></b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>{d}</div></div>
            <Toggle on={consent[i]} onClick={() => { if (req === "필수") return; setConsent((p) => p.map((v, j) => j === i ? !v : v)); }} />
          </div>
        ))}
        <div className="resitem"><span className="ic" style={{ background: "#E7F8EE" }}><Art name="lock" size={18} /></span>
          <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>AI 주치의 상담 기록 저장 <span className="reqtag opt" style={{ marginLeft: 4 }}>선택</span></b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>AI 상담 질문·위험도·보장추천을 내 기록으로 저장합니다(‘상담 기록’ 탭에서 조회·삭제·내보내기).</div></div>
          <Toggle on={logConsent} onClick={() => { const v = !logConsent; LOG_CONSENT = v; setLogConsent(v); toast(v ? "상담 기록 저장에 동의했습니다." : "동의를 철회했습니다."); }} />
        </div>
        <div className="chnote">※ DID 기반으로 제공받는 자·목적·항목을 확인하고 동의/철회할 수 있습니다. 필수 동의 철회 시 일부 서비스 이용이 제한될 수 있습니다. <b>AI 상담 기록 저장</b>은 ‘상담 기록’ 탭의 동의 상태와 연동됩니다.</div>
      </>)}

      {tab === "family" && (<>
        <div className="bklbl" style={{ margin: "2px 0 8px" }}><Users size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 가족 건강관리 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 동의 기반 공유</span></div>
        {MY_FAMILY.map(([ini, name, rel, status, to, c], i) => (
          <div className="center" key={i}>
            <div className="cimg" style={{ width: 56, height: 56, background: c }}><span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{ini}</span></div>
            <div className="cmain"><div className="cname">{name}<span className="cbadge" style={{ color: "#475569", background: "#EEF1F8" }}>{rel}</span></div><div className="cmeta">{status}</div></div>
            <div className="cright"><div className="obtns">{to ? <button className="book" onClick={() => go(to)}>건강 보기</button> : <button className="book" onClick={() => toast("가족 건강 연동 요청을 보냈습니다.")}>연동 요청</button>}</div></div>
          </div>
        ))}
        <button className="cbtn" onClick={() => toast("가족 구성원 초대 링크가 생성되었습니다.")}><Plus size={15} /> 가족 구성원 추가</button>
        <div className="chnote">※ 가족 건강정보는 본인·가족의 동의(DID) 하에 공유되며, 고령 가족은 재가·돌봄 서비스와 연계됩니다.</div>
      </>)}

      {tab === "noti" && (<>
        <div className="benefit"><span><Art name="badge" size={16} /> 카카오톡 알림</span><span><Art name="hash" size={16} /> 앱 푸시</span><span><Art name="chat" size={16} /> 문자</span></div>
        {MY_NOTI.map(([a, t, d], i) => (
          <div className="resitem" key={i}><span className="ic" style={{ background: "#FEF8E0" }}><Art name={a} size={18} /></span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t}</b><div style={{ fontSize: 11.3, color: "var(--muted)" }}>{d}</div></div>
            <Toggle on={noti[i]} onClick={() => setNoti((p) => p.map((v, j) => j === i ? !v : v))} />
          </div>
        ))}
        <div className="chnote">※ 알림 채널(카카오톡·푸시·문자)은 동의 및 정책에 따라 발송됩니다. 마케팅 알림은 미동의 시 발송되지 않습니다.</div>
      </>)}
    </div>
  );
}

/* ====================== 커뮤니티 ====================== */
