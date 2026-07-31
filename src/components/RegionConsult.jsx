/* ══════════════ 내 지역 상담 안내(Phase 3) — "병원 진료를 안내받듯" 담당 지역단·상담사 연결 ══════════════
   설계: docs/lead_routing 보고서 §3.1 — 헤더(관할 지역단)·지도·상담사 카드·채널 선택·예약·가명 요약 토글·평가·재배정.
   원칙: 동의 게이트 필수 · 원본 검진수치 미전달 · 쿨다운/월 상한 강제 · 대리점 자격 상시 표시. */

function RegionConsultSection({ onTab }) {
  const m = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
    || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  const [tick, setTick] = useState(0);
  const R = useMemo(() => lrRegionOf(m), [m && m.email]);
  const leads = m ? lrLeads(m) : [];
  const activeLead = [...leads].reverse().find((x) => ["ASSIGNED", "CONTACTED"].includes(x.status));
  const doneLead = [...leads].reverse().find((x) => x.status === "CONTACTED");
  const consentOK = m ? lrConsentOK(m) : false;
  const cd = m ? lrCooldown(m) : { blocked: false, capped: false, monthlyN: 0 };

  const [agentId, setAgentId] = useState(null);
  const [channel, setChannel] = useState("화상");
  const [slot, setSlot] = useState("");
  const [briefing, setBriefing] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [cAgree, setCAgree] = useState({ health: false, insurance: false });
  const isEasy = (() => { try { return document.body.classList.contains("easyread"); } catch (e) { return false; } })();
  void isEasy;

  const SLOTS = ["내일 오전 10시", "내일 오후 3시", "모레 오전 11시", "모레 오후 7시(저녁)"];
  const gapCode = (() => { try { const g = (typeof analyzeCoverageGap === "function" && m) ? analyzeCoverageGap(m) : null; return g && g.gaps && g.gaps.length ? "GAP-" + g.gaps.length + "건" : "GAP-없음"; } catch (e) { return "GAP-SUMMARY"; } })();

  const submit = () => {
    const r = lrCreateLead(m, { type: "L-ASK", channel, slot, agentId, briefing, gapCode });
    if (!r.ok && r.reason === "consent") { setShowConsent(true); return; }
    if (!r.ok) { if (typeof toast === "function") toast(r.reason); return; }
    if (typeof toast === "function") toast(`✅ ${r.lead.dan} ${r.lead.agent}님께 배정됐어요 — ${channel} 상담`);
    setTick((t) => t + 1);
  };
  const doConsent = () => {
    try { vaultSaveConsents(m, { health: true, insurance: true, step: "region-consult" }); } catch (e) {}
    setShowConsent(false); setTick((t) => t + 1);
    if (typeof toast === "function") toast("동의가 기록됐어요(블록체인 이력) — 이어서 상담을 연결할게요");
  };
  void tick;

  const pts = [{ name: R.dan, addr: R.info.addr, tel: R.info.tel, tag: "담당 지역단", lat: R.info.lat, lng: R.info.lng }];

  return (
    <div>
      {/* ① 헤더 — 관할 안내 + 대리점 자격 */}
      <div style={{ background: "linear-gradient(125deg,#0B1F4B,#1D4ED8)", borderRadius: 16, padding: "18px 18px 15px", color: "#fff", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <MapPin size={18} color="#F5D98A" />
          <b style={{ fontSize: 17.5 }}>{m ? `${R.sido} ${R.sgg}는 ${R.dan}이 함께해요` : "내 지역 담당 상담 안내"}</b>
        </div>
        <div style={{ fontSize: 12.3, opacity: .85, marginTop: 6, lineHeight: 1.6 }}>
          병원 진료를 안내받듯, 우리 동네 담당 조직과 상담사를 연결해 드려요. 상담·모집은 라이선스 상담사가 수행해요.
        </div>
        {R.note && <div style={{ fontSize: 11.8, marginTop: 7, background: "rgba(245,217,138,.15)", border: "1px solid rgba(245,217,138,.4)", borderRadius: 9, padding: "7px 10px", color: "#FDE9B8" }}>ℹ️ {R.note}</div>}
        <div style={{ fontSize: 10.8, opacity: .75, marginTop: 8 }}>글로벌예방금융(주) · 금융위 등록 보험대리점 제2025060038호 · 인수사 현대해상(전속 제휴)</div>
      </div>

      {/* 진행 중 배정 카드 */}
      {activeLead && (
        <div className="card" style={{ border: "1.5px solid #BBF7D0", background: "#F0FDF4", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "#166534" }}>진행 중인 상담이 있어요</div>
          <div style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.7 }}>
            {activeLead.dan} · <b>{activeLead.agent}</b> · {activeLead.channel} 상담{activeLead.slot ? ` · ${activeLead.slot}` : ""}<br />
            상태: <b>{activeLead.status === "ASSIGNED" ? "배정 완료 — 4시간 내 첫 연락 원칙" : "일정 확정 — 상담 예정"}</b>
            {activeLead.briefing && <> · 가명 요약 사전 전달 ✓</>}
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
            {activeLead.status === "ASSIGNED" && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { lrSimContact(m, activeLead.id); setTick((t) => t + 1); }}>📞 (시연) 상담사 접촉 도착</button>}
            {activeLead.status === "CONTACTED" && [5, 4, 3].map((s) => <button key={s} className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { lrRate(m, activeLead.id, s); setTick((t) => t + 1); if (typeof toast === "function") toast("평가 감사해요 — 다음 배정 품질에 반영돼요"); }}>{"⭐".repeat(s)} 평가</button>)}
            <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { lrReassign(m, activeLead.id); setTick((t) => t + 1); if (typeof toast === "function") toast("다른 상담사로 재배정했어요"); }}>다른 상담사 요청</button>
            <button className="cbtn" style={{ margin: 0, width: "auto", padding: "7px 12px", fontSize: 11.5, color: "#B91C1C" }} onClick={() => { lrDecline(m, activeLead.id); setTick((t) => t + 1); if (typeof toast === "function") toast("종결했어요 — 30일간 다시 권하지 않아요"); }}>그만 받을래요</button>
          </div>
        </div>
      )}

      {/* ② 지도 */}
      {typeof MapView === "function" && <div className="card" style={{ marginBottom: 12 }}>
        <div className="rct" style={{ marginBottom: 8 }}><MapPin size={16} color="#2563EB" /> 담당 조직 위치</div>
        <MapView points={pts} height={190} accent="#1D4ED8" />
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{R.dan} · {R.info.addr}{R.info.tel ? ` · ${R.info.tel}` : ""}{R.info.branches.length ? ` · 관내 지점 ${R.info.branches.map((b) => b.n).join("·")}` : ""}</div>
      </div>}

      {/* ③ 상담사 카드 + ④ 채널 + ⑤ 슬롯 + ⑥ 요약 토글 */}
      {!activeLead && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="rct" style={{ marginBottom: 10 }}><Bot size={16} color="#7C3AED" /> 상담사 선택</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            {R.agents.map((a) => (
              <div key={a.id} onClick={() => setAgentId(a.id)} style={{ border: `2px solid ${agentId === a.id ? "#1D4ED8" : "var(--border)"}`, borderRadius: 13, padding: "12px 13px", cursor: "pointer", background: agentId === a.id ? "#EEF3FF" : "#fff" }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{a.name} <span style={{ fontWeight: 600, fontSize: 11.5, color: "var(--muted)" }}>경력 {a.career}년</span></div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "7px 0" }}>{a.tags.map((t) => <span key={t} style={{ fontSize: 10.5, fontWeight: 700, background: "#F1F5F9", borderRadius: 999, padding: "3px 9px", color: "#334155" }}>{t}</span>)}</div>
                <div style={{ fontSize: 11.3, color: "var(--muted)" }}><Clock size={11} /> {a.hours}{a.video ? " · 화상 가능" : ""}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.8, color: "var(--muted)", marginTop: 7 }}>※ 상담사 프로필은 시연용 예시이며, 실명부는 제휴 확정 후 연동됩니다.</div>

          <div className="rct" style={{ margin: "14px 0 8px" }}><MessageSquare size={15} color="#2563EB" /> 상담 방식 — 편한 걸 고르세요</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["방문", "전화", "화상", "채팅"].map((c) => <button key={c} className="cbtn" onClick={() => setChannel(c)} style={{ margin: 0, width: "auto", padding: "9px 18px", fontSize: 12.5, background: channel === c ? "#1D4ED8" : undefined, color: channel === c ? "#fff" : undefined }}>{c}</button>)}
          </div>

          <div className="rct" style={{ margin: "14px 0 8px" }}><CalendarCheck size={15} color="#16A34A" /> 예약 시간</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SLOTS.map((s) => <button key={s} className="cbtn" onClick={() => setSlot(s)} style={{ margin: 0, width: "auto", padding: "9px 14px", fontSize: 12, background: slot === s ? "#16A34A" : undefined, color: slot === s ? "#fff" : undefined }}>{s}</button>)}
          </div>

          <label style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "14px 0 4px", cursor: "pointer" }}>
            <input type="checkbox" checked={briefing} onChange={(e) => setBriefing(e.target.checked)} style={{ marginTop: 2 }} />
            <span style={{ fontSize: 12.3, lineHeight: 1.6 }}><b>상담 전 요약 보내기</b> — 내 보장공백 <b>분석 요약</b>({gapCode})을 상담사에게 미리 전달해요.<br />
              <span style={{ color: "var(--muted)", fontSize: 11.3 }}>원본 검진 수치는 전달되지 않아요(요약 코드만) · 인수심사·보험료 산정에 사용되지 않아요.</span></span>
          </label>

          {cd.blocked && <div className="chnote" style={{ margin: "8px 0", color: "#B45309" }}>최근 상담을 사양하셔서 30일간 다시 권하지 않아요 — 원하시면 아래 버튼으로 직접 연결은 언제든 가능해요.</div>}
          <button className="cbtn pri" style={{ marginTop: 10 }} onClick={submit}><MapPin size={15} /> {m ? `${R.dan} 상담 연결하기` : "로그인 후 이용할 수 있어요"}</button>
          <div className="chnote" style={{ marginTop: 8 }}>연결 전 개인정보 제3자 제공·건강 분석요약 제공 동의를 확인해요 · 월 최대 2건 연결(회원 보호) · 언제든 철회 가능</div>
        </div>
      )}

      {/* 동의 게이트(미동의 시) — 데이터 금고 동의 체계 재사용 */}
      {showConsent && (
        <div className="bkov" onClick={() => setShowConsent(false)}>
          <div className="bk" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="bkh"><div className="bt">상담 연결 전 동의 확인</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setShowConsent(false)}><X size={20} color="#8A97AE" /></button></div>
            <div className="bkb">
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>지역 상담 연결에는 아래 필수 동의가 필요해요 — 제공 항목은 최소화(연락 토큰·연령대·행정동·상담 유형)돼요.</div>
              {[["health", "[필수] 건강데이터 활용 동의", "보장공백 분석 요약 산출에 쓰여요"], ["insurance", "[필수] 보험 연계(제3자 제공) 동의", "담당 조직 배정·연락 목적으로만 제공돼요"]].map(([k, t, d]) => (
                <label key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "7px 2px", cursor: "pointer" }}>
                  <input type="checkbox" style={{ marginTop: 2 }} checked={!!cAgree[k]} onChange={(e) => setCAgree({ ...cAgree, [k]: e.target.checked })} />
                  <span style={{ fontSize: 12.3, lineHeight: 1.5 }}><b style={{ color: "#14337A" }}>{t}</b><br /><span style={{ color: "#64748B", fontSize: 11.5 }}>{d}</span></span>
                </label>
              ))}
              <button className="cbtn pri" disabled={!(cAgree.health && cAgree.insurance)} style={{ opacity: (cAgree.health && cAgree.insurance) ? 1 : .5 }} onClick={doConsent}><ShieldCheck size={15} /> 동의하고 상담 연결</button>
              <div className="chnote" style={{ marginTop: 8 }}>동의 이력은 블록체인에 기록되고, 동의관리에서 <b>언제든 철회</b>할 수 있어요(철회 시 배정 즉시 회수·전달분 파기 확인).</div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자(운영) 미니 콘솔 — 관측 전용 */}
      {typeof isAdminRole === "function" && isAdminRole() && (() => { const S = lrOpsStats(m); return (
        <div className="card" style={{ background: "#0B1F4B", color: "#DCE7FB", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#F5D98A" }}>리드 라우팅 운영 콘솔(관리자·관측 전용)</div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12.3, flexWrap: "wrap" }}>
            <span>누적 리드 <b>{S.total}</b></span><span>활성 배정 <b>{S.active}</b></span>
            <span>SLA 초과 <b style={{ color: S.overdue ? "#FCA5A5" : "#86EFAC" }}>{S.overdue}</b></span>
            {Object.entries(S.by).map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
          </div>
          <div style={{ fontSize: 10.8, opacity: .7, marginTop: 7 }}>회수 24h·쿨다운 30일·월 상한 2회를 시스템이 강제 — 상세 설계: docs/lead_routing 보고서</div>
        </div> ); })()}

      {/* 하단: 상담 이력 */}
      {leads.length > 0 && (
        <div className="card">
          <div className="rct" style={{ marginBottom: 8 }}><FileText size={15} color="#64748B" /> 내 상담 연결 이력</div>
          {[...leads].reverse().slice(0, 5).map((x) => (
            <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 2px", borderBottom: "1px solid var(--border)", fontSize: 12.2, flexWrap: "wrap" }}>
              <span>{new Date(x.ts).toLocaleDateString("ko-KR")} · {x.dan} · {x.agent} · {x.channel}</span>
              <b style={{ color: x.status === "CONSULTED" ? "#16A34A" : x.status === "DECLINED" ? "#B91C1C" : "#1D4ED8" }}>{{ ASSIGNED: "배정", CONTACTED: "일정 확정", CONSULTED: "완료" + (x.stars ? ` ★${x.stars}` : ""), DECLINED: "종결" }[x.status] || x.status}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
