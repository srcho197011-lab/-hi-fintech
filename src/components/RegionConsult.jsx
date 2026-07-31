/* ══════════════ Phase 4 — 치료비+생활비 이원 담보 구조(보고서 §4.1) : 프리미엄 장기보험 개념 카드 ══════════════ */
function InsLifeCostCard({ onTab }) {
  const AX = [
    { t: "치료비 축 — 직접 의료비", c: "#1D4ED8", bg: "#EEF3FF", rows: [
      ["진단비", "암·뇌혈관·허혈성심장 3대 + 예측 위험 기반 특정질환"],
      ["수술·입원·통원", "기관·부위별 수술비 · 상급병실 차액"],
      ["비급여·고액치료", "표적항암·로봇수술 등 고액 치료 대비"]] },
    { t: "생활비 축 — 치료 중 소득 공백", c: "#B45309", bg: "#FFF7E8", rows: [
      ["입원일당(체증형)", "장기 입원 구간일수록 두터워지는 일당"],
      ["회복기 생활자금", "진단 후 N개월 분할 지급 — 월급처럼"],
      ["요양·간병", "간병인 일당 · 재가돌봄 서비스 연계"],
      ["소득보상 특약", "취업불능 보전 — 상품화는 인수사 검토 전제 [검토]"]] },
  ];
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="rct" style={{ marginBottom: 4 }}><HeartHandshake size={16} color="#B45309" /> 치료비 + 생활비, 두 축을 함께</div>
      <div style={{ fontSize: 12.3, color: "var(--muted)", marginBottom: 10, lineHeight: 1.6 }}>큰 병의 부담은 병원비만이 아니에요 — <b>치료받는 동안 끊기는 소득</b>까지가 진짜 치료비예요. 프리미엄 장기보험은 두 축을 함께 설계해요.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10 }}>
        {AX.map((a) => (
          <div key={a.t} style={{ border: "1.5px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ background: a.bg, color: a.c, fontWeight: 800, fontSize: 12.8, padding: "9px 13px" }}>{a.t}</div>
            <div style={{ padding: "4px 13px 9px" }}>{a.rows.map(([k, d]) => <div key={k} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}><b>{k}</b><span style={{ color: "var(--muted)" }}> — {d}</span></div>)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 14px", fontSize: 12 }} onClick={() => onTab && onTab("rerate")}><ShieldCheck size={13} /> 건강 관리로 보험료 인하(인하 전용 재산정)</button>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 14px", fontSize: 12 }} onClick={() => onTab && onTab("region")}><MapPin size={13} /> 가족 세대 설계 — 내 지역 상담</button>
      </div>
      <div className="chnote" style={{ marginTop: 9 }}>※ 담보 구성은 설계 방향(안)이며 실제 상품화·보장·보험료는 인수사(현대해상) 상품 정책과 관련 법령·심사에 따라 확정됩니다. 건강 성과 데이터는 <b>인하 전용</b>으로만 작동해요(인수 거절·할증 근거 사용 금지).</div>
    </div>
  );
}

/* ══════════════ 리드 라우팅 B2B 콘솔(보고서 §3.2) — 조직·상담사가 쓰는 화면: 배정 큐·브리핑·결과·대시보드 ══════════════
   원칙: ①동의 범위를 화면에 명시(볼 수 없는 것을 못 보게+명시) ②브리핑은 가명 요약만 ③결과 코드 없이 종결 불가 ④열람·처리 전건 감사 로그 */
function LeadOpsConsole() {
  const [tick, setTick] = useState(0);
  const [view, setView] = useState("queue");   // queue | audit
  const [brief, setBrief] = useState(null);    // {key, lead}
  void tick;
  const rows = lrAllLeads();
  const S = lrConsoleStats();
  const fmtAgo = (ts) => { const h = (Date.now() - ts) / 3600000; return h < 1 ? Math.round(h * 60) + "분 경과" : h.toFixed(1) + "h 경과"; };
  const slaLeft = (x) => { const left = x.slaH * 3600000 - (Date.now() - x.ts); return left <= 0 ? null : (left / 3600000).toFixed(1) + "h 남음"; };
  const openBrief = (r) => { lrAudit(r.lead.id, "브리핑 열람(가명 요약)"); setBrief(r); };
  const TYPE_L = { "L-ASK": "명시 신청", "L-GAP": "보장공백", "L-CKUP": "검진 이상 후 문의", "L-FAM": "가족 상담", "L-CLAIM": "청구 발생", "L-RERATE": "재산정" };

  return (
    <div>
      {/* KPI 헤더(§6.1 축약) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 9, marginBottom: 12 }}>
        {[["배정 리드", S.n + "건", "#1D4ED8"], ["활성 배정", S.active + "건", "#0EA5E9"], ["SLA 초과", S.overdue + "건", S.overdue ? "#DC2626" : "#16A34A"], ["응답률", S.respRate + "%", "#7C3AED"], ["SLA 준수", S.slaOK + "%", "#16A34A"], ["청약 전환", S.convRate + "%", "#B45309"]].map(([t, v, c]) => (
          <div key={t} className="card" style={{ padding: "11px 13px", margin: 0 }}><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{t}</div><b style={{ fontSize: 18, color: c }}>{v}</b></div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12, background: view === "queue" ? "#1D4ED8" : undefined, color: view === "queue" ? "#fff" : undefined }} onClick={() => setView("queue")}>배정 큐</button>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12, background: view === "cover" ? "#1D4ED8" : undefined, color: view === "cover" ? "#fff" : undefined }} onClick={() => setView("cover")}>조직 커버리지</button>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12, background: view === "pilot" ? "#1D4ED8" : undefined, color: view === "pilot" ? "#fff" : undefined }} onClick={() => setView("pilot")}>파일럿 KPI</button>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12, background: view === "comp" ? "#1D4ED8" : undefined, color: view === "comp" ? "#fff" : undefined }} onClick={() => setView("comp")}>컴플라이언스</button>
        <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12, background: view === "audit" ? "#1D4ED8" : undefined, color: view === "audit" ? "#fff" : undefined }} onClick={() => setView("audit")}>감사 로그</button>
        {!rows.some((r) => r.key.includes("demo@lead.sim")) && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "8px 14px", fontSize: 12 }} onClick={() => { lrSeedDemo(); setTick((t) => t + 1); }}>+ 시연 리드 3건 생성</button>}
      </div>

      {view === "queue" && (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 4 }}><FileText size={15} color="#1D4ED8" /> 배정 리드 큐 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 우선순위(T1→T3)·SLA 타이머 · 회수 24h 원칙</span></div>
          <div className="chnote" style={{ margin: "6px 0 10px" }}>🔒 <b>동의 범위</b>: 이 화면은 회원이 동의한 <b>가명 분석 요약</b>까지만 표시해요 — 이름·연락처 원문·원본 검진 수치는 제공되지 않아요(콜백 토큰 연결).</div>
          {!rows.length && <div style={{ fontSize: 12.5, color: "var(--muted)", padding: 10 }}>배정된 리드가 없어요 — 회원 화면(내 지역 상담)에서 연결하거나 시연 리드를 생성해 보세요.</div>}
          {rows.slice(0, 12).map((r) => { const x = r.lead; const over = x.status === "ASSIGNED" && Date.now() - x.ts > x.slaH * 3600000; return (
            <div key={x.id} style={{ border: `1.5px solid ${over ? "#FECACA" : "var(--border)"}`, background: over ? "#FEF2F2" : "#fff", borderRadius: 12, padding: "11px 13px", marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 12.8 }}>
                  <b style={{ color: x.tier === "T1" ? "#DC2626" : "#1D4ED8" }}>[{x.tier}{x.score ? ` A${x.score.A}·F${x.score.F}` : ""}]</b> <b>{x.id}</b> · {TYPE_L[x.type] || x.type} · {x.dan}{x.branch ? ` › ${x.branch}` : x.sgg ? ` (${x.sgg})` : ""} · {x.ageBand} {x.sex}{x.family ? <b style={{ color: "#B45309" }}> · 👪 가족 상담</b> : null}
                  <span style={{ color: "var(--muted)" }}> · 희망 {x.channel}{x.slot ? ` · ${x.slot}` : ""}</span>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: over ? "#DC2626" : "#16A34A" }}>
                  {x.status === "ASSIGNED" ? (over ? `⏰ SLA 초과 (${fmtAgo(x.ts)})` : `SLA ${slaLeft(x)}`) : { CONTACTED: "연결됨", CONSULTED: "상담확정", APPLIED: "청약연결", DECLINED: "거절 종결", RECALLED: "회수" }[x.status] || x.status}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <button className="cbtn" style={{ margin: 0, width: "auto", padding: "6px 11px", fontSize: 11 }} onClick={() => openBrief(r)}>📋 브리핑{x.briefing ? "(요약 동의 ✓)" : "(기본)"}</button>
                {["ASSIGNED", "CONTACTED"].includes(x.status) && LR_RESULT_CODES.map(([code, label]) => (
                  <button key={code} className="cbtn" style={{ margin: 0, width: "auto", padding: "6px 11px", fontSize: 11 }} onClick={() => { lrSetResult(r.key, x.id, code); setTick((t) => t + 1); }}>{label}</button>
                ))}
                {over && <button className="cbtn" style={{ margin: 0, width: "auto", padding: "6px 11px", fontSize: 11, color: "#DC2626", fontWeight: 800 }} onClick={() => { lrRecall(r.key, x.id); setTick((t) => t + 1); if (typeof toast === "function") toast("회수 후 차순위 상담사로 재배정 — 타이머 재시작"); }}>회수·재배정</button>}
              </div>
              <div style={{ fontSize: 10.8, color: "var(--muted)", marginTop: 6 }}>담당 {x.agent}{x.retry ? ` · 재시도 ${x.retry}회` : ""} · 결과 코드 입력 없이는 종결되지 않아요</div>
            </div> ); })}
        </div>
      )}

      {view === "cover" && (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 4 }}><MapPin size={15} color="#0B1F4B" /> 전국 조직 커버리지 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 현대해상 지점찾기 실사 2026-07-31 · 상담·가입 가능 지점 기준</span></div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "8px 0 12px", fontSize: 12.5 }}>
            <span>지역단 <b style={{ color: "#1D4ED8" }}>16개</b></span>
            <span>상담가능 지점 <b style={{ color: "#1D4ED8" }}>{LR_COVERAGE.reduce((s, x) => s + x.br, 0)}개</b></span>
            <span>커버리지 공백 시도 <b style={{ color: "#B45309" }}>{LR_COVERAGE.filter((x) => x.gap).length}개</b> <span style={{ color: "var(--muted)" }}>(인접 관할+비대면 보강)</span></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
            {LR_COVERAGE.map((c) => (
              <div key={c.sido} style={{ border: `1.5px solid ${c.gap ? "#F3DFB6" : "var(--border)"}`, background: c.gap ? "#FFFBEB" : "#fff", borderRadius: 11, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b style={{ fontSize: 13 }}>{c.sido}</b><b style={{ fontSize: 15, color: "#1D4ED8" }}>{c.br}</b></div>
                <div style={{ fontSize: 10.8, color: c.gap ? "#B45309" : "var(--muted)", marginTop: 4 }}>{c.dans.length ? c.dans.map((d) => d + "지역단").join(" · ") : "⚠️ 자체 지역단 없음 — 인접 관할"}</div>
              </div>
            ))}
          </div>
          <div className="chnote" style={{ marginTop: 10 }}>지역단은 영업파트+조직파트로 구성(2025-12-01 지역단 단일체계 개편) · 수도권 집중(전체의 44%) — 파일럿은 서울 강남지역단 권고. 상세 근거: docs/lead_routing 설계보고서 Phase 1.</div>
        </div>
      )}

      {view === "pilot" && (() => { const K = lrKpi(); const goal = { respRate: 80, consultRate: 40, convRate: 8 }; return (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 4 }}><Trophy size={15} color="#B45309" /> 파일럿 대시보드 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· {LR_PILOT.region} · {LR_PILOT.weeks}주 · 목표 리드 {LR_PILOT.target}건 (보고서 §6.4)</span></div>
          <div style={{ margin: "10px 0 4px", fontSize: 12, fontWeight: 700 }}>파일럿 진행률 — 리드 {K.n}/{LR_PILOT.target}건</div>
          <div style={{ height: 10, background: "#EEF1F6", borderRadius: 999, overflow: "hidden" }}><div style={{ width: K.progress + "%", minWidth: 6, height: "100%", background: "linear-gradient(90deg,#1D4ED8,#7C3AED)" }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, marginTop: 12 }}>
            {[["리드 응답률", K.respRate + "%", "≥80%", K.respRate >= goal.respRate],
              ["최초 접촉 중앙값", K.ttfc != null ? K.ttfc + "h" : "실측 전", "≤4h", K.ttfc != null && +K.ttfc <= 4],
              ["상담 실시율", K.consultRate + "%", "≥40%", K.consultRate >= goal.consultRate],
              ["청약 전환율", K.convRate + "%", "≥8%", K.convRate >= goal.convRate],
              ["민원·거절율", K.complaintRate + "%", "≤1.5%", +K.complaintRate <= 1.5],
              ["회원 만족도", K.stars ? "★" + K.stars : "실측 전", "≥4.2", K.stars && +K.stars >= 4.2],
              ["13회차 유지율", "실측 전", "≥85% [추정]", null],
              ["조직별 편차", Object.keys(K.byDan).length + "개 조직 집계", "상하위 2배 이내", null]].map(([t, v, g, ok]) => (
              <div key={t} className="card" style={{ padding: "10px 12px", margin: 0, border: `1.5px solid ${ok === null ? "var(--border)" : ok ? "#BBF7D0" : "#FECACA"}` }}>
                <div style={{ fontSize: 10.8, color: "var(--muted)", fontWeight: 700 }}>{t} <span style={{ color: "#94A3B8" }}>({g})</span></div>
                <b style={{ fontSize: 15, color: ok === null ? "#334155" : ok ? "#16A34A" : "#DC2626" }}>{v}</b>
              </div>))}
          </div>
          <div style={{ margin: "14px 0 6px", fontSize: 12, fontWeight: 700 }}>실행 로드맵</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LR_PILOT.roadmap.map(([t, d, st]) => (
              <div key={t} style={{ flex: "1 1 160px", border: `1.5px solid ${st === "now" ? "#1D4ED8" : "var(--border)"}`, background: st === "done" ? "#F0FDF4" : st === "now" ? "#EEF3FF" : "#fff", borderRadius: 11, padding: "9px 12px" }}>
                <b style={{ fontSize: 12, color: st === "now" ? "#1D4ED8" : st === "done" ? "#16A34A" : "#64748B" }}>{st === "done" ? "✓ " : st === "now" ? "▶ " : ""}{t}</b>
                <div style={{ fontSize: 10.8, color: "var(--muted)", marginTop: 3 }}>{d}</div>
              </div>))}
          </div>
          <div className="chnote" style={{ marginTop: 10 }}>정산(협의 전 예시): 유효 리드 기본료 + 청약 체결 성과 가산의 하이브리드 — 대가 성격은 광고·플랫폼 이용료로 구조화[법률 자문 전제] · 월 정산·리드 원장 상호 대사.</div>
        </div> ); })()}

      {view === "comp" && (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 8 }}><ShieldCheck size={15} color="#0B1F4B" /> 컴플라이언스 체크리스트 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 보고서 §5.1 C-1~C-10 · 최종 법률 자문 전제</span></div>
          {LR_COMPLIANCE.map((r) => (
            <div key={r.c} style={{ display: "flex", gap: 10, padding: "8px 2px", borderBottom: "1px solid var(--border)", fontSize: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <b style={{ minWidth: 40, color: "#0B1F4B" }}>{r.c}</b>
              <div style={{ flex: "1 1 300px" }}><b>{r.t}</b> <span style={{ color: "#64748B" }}>({r.basis})</span><div style={{ color: "var(--muted)", fontSize: 11.3, marginTop: 2 }}>{r.ctrl}</div></div>
              <span style={{ fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "3px 10px", background: r.enforced ? "#F0FDF4" : "#FFF7E8", color: r.enforced ? "#16A34A" : "#B45309" }}>{r.enforced ? "시스템 강제" : "협약·자문"}</span>
            </div>
          ))}
          <div className="chnote" style={{ marginTop: 10 }}>Go 기준: C-1·C-2 법률 검토 통과 + C-4 3자 구조 적법 의견 + 관할 매핑(R1) 확보 + 파일럿 KPI 달성 / 민감정보 전달 불가 의견·민원 기준 초과 시 No-Go (보고서 §5.4).</div>
        </div>
      )}

      {view === "audit" && (
        <div className="card" style={{ margin: 0 }}>
          <div className="rct" style={{ marginBottom: 8 }}><ShieldCheck size={15} color="#0B1F4B" /> 감사 로그 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 누가 언제 어떤 리드를 열람·처리했는지 전건 기록(회원 데이터 금고와 동기화 사상)</span></div>
          {[...lrAuditList()].reverse().slice(0, 15).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 2px", borderBottom: "1px solid var(--border)", fontSize: 11.8, flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", minWidth: 96 }}>{new Date(a.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              <b>{a.leadId}</b><span>{a.action}</span><span style={{ color: "var(--muted)" }}>{a.by}</span>
            </div>
          ))}
          {!lrAuditList().length && <div style={{ fontSize: 12.5, color: "var(--muted)", padding: 10 }}>기록이 없어요 — 브리핑 열람·결과 입력 시 자동 기록돼요.</div>}
        </div>
      )}

      {/* 브리핑 모달 — 가명 요약만·워터마크 경고 */}
      {brief && (
        <div className="bkov" onClick={() => setBrief(null)}>
          <div className="bk" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="bkh"><div className="bt">상담 전 브리핑 — 가명 요약</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setBrief(null)}><X size={20} color="#8A97AE" /></button></div>
            <div className="bkb">
              <div style={{ background: "#F8FAFF", border: "1.5px solid #C7D8FA", borderRadius: 12, padding: "13px 14px", fontSize: 13, lineHeight: 1.9 }}>
                · 회원: <b>{brief.lead.ageBand} {brief.lead.sex === "남" ? "남성" : brief.lead.sex === "여" ? "여성" : "-"}</b> · {brief.lead.sido} {brief.lead.sgg}<br />
                · 유형: <b>{brief.lead.type}</b> ({brief.lead.tier}){brief.lead.family ? <b style={{ color: "#B45309" }}> · 👪 가족을 위한 원격지 상담 — 피보험 대상 가족 본인 동의 확인 후 진행</b> : null} · 희망 채널 <b>{brief.lead.channel}</b><br />
                · 보장공백 요약: <b>{brief.lead.gapCode || "요약 전달 미동의 — 기본 정보만"}</b><br />
                · 연락: <b>콜백 토큰</b>으로 최초 연결(번호 원문 미제공 · 회원 수락 시 공개)
              </div>
              <div className="chnote" style={{ marginTop: 10 }}>⚠️ 본 요약은 상담 준비 목적입니다 — <b>인수 심사·보험료 산정에 사용할 수 없으며</b>, 열람 사실이 감사 로그와 회원 접근 이력에 기록됩니다. 화면 촬영·외부 공유 금지.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════ 내 지역 상담 안내(Phase 3) — "병원 진료를 안내받듯" 담당 지역단·상담사 연결 ══════════════
   설계: docs/lead_routing 보고서 §3.1 — 헤더(관할 지역단)·지도·상담사 카드·채널 선택·예약·가명 요약 토글·평가·재배정.
   원칙: 동의 게이트 필수 · 원본 검진수치 미전달 · 쿨다운/월 상한 강제 · 대리점 자격 상시 표시. */

function RegionConsultSection({ onTab }) {
  const m = ((typeof demoCurrentUser === "function") ? demoCurrentUser() : null)
    || ((typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  const [tick, setTick] = useState(0);
  /* 자율 지역 선택(형 지시) — 병원 안내처럼 전국 관할을 직접 고를 수 있다(멀리 계신 가족을 위한 상담) */
  const [pickSido, setPickSido] = useState(null);
  const [pickDan, setPickDan] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickBranch, setPickBranch] = useState(null);   // 선택 지점(지도 핀·연결 대상)
  const home = useMemo(() => lrRegionOf(m), [m && m.email]);
  const R = pickSido ? lrRegionBy(pickSido, pickDan) : home;
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
    const r = lrCreateLead(m, { channel, slot, agentId, briefing, gapCode, region: pickSido ? R : null, forFamily: !!pickSido, branch: pickBranch ? pickBranch.name : null, branchAddr: pickBranch ? pickBranch.addr : null });   // 지역·지점 선택 반영
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

  /* 지도 포인트 — 지점 선택 시 그 지점 핀(+지역단 거점 동시 표시) */
  const bg = pickBranch && typeof lrBranchGeo === "function" ? lrBranchGeo(pickBranch.addr, { lat: R.info.lat, lng: R.info.lng }) : null;
  const pts = pickBranch
    ? [{ name: pickBranch.name, addr: pickBranch.addr, tel: "", tag: "선택 지점", lat: bg.lat, lng: bg.lng },
       { name: R.dan, addr: R.info.addr, tel: R.info.tel, tag: "관할 지역단", lat: R.info.lat, lng: R.info.lng }]
    : [{ name: R.dan, addr: R.info.addr, tel: R.info.tel, tag: "담당 지역단", lat: R.info.lat, lng: R.info.lng }];

  return (
    <div>
      {/* ① 헤더 — 관할 안내 + 대리점 자격 */}
      <div style={{ background: "linear-gradient(125deg,#0B1F4B,#1D4ED8)", borderRadius: 16, padding: "18px 18px 15px", color: "#fff", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <MapPin size={18} color="#F5D98A" />
          <b style={{ fontSize: 17.5 }}>{(() => { const eun = (w) => { const c = w.charCodeAt(w.length - 1); return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0) ? "은" : "는"; }; if (pickSido) return `가족을 위한 상담 — ${R.sido}${eun(R.sido)} ${R.dan}이 함께해요`; if (m) { const p = `${R.sido} ${R.sgg}`.trim(); return `${p}${eun(p)} ${R.dan}이 함께해요`; } return "내 지역 담당 상담 안내"; })()}</b>
        </div>
        <div style={{ fontSize: 12.3, opacity: .85, marginTop: 6, lineHeight: 1.6 }}>
          {pickSido ? "멀리 계신 가족·지인을 위해 그 지역 담당 조직으로 상담을 연결해 드려요 — 가족분 동의 확인 후 진행돼요." : "병원 진료를 안내받듯, 우리 동네 담당 조직과 상담사를 연결해 드려요. 상담·모집은 라이선스 상담사가 수행해요."}
        </div>
        {R.note && <div style={{ fontSize: 11.8, marginTop: 7, background: "rgba(245,217,138,.15)", border: "1px solid rgba(245,217,138,.4)", borderRadius: 9, padding: "7px 10px", color: "#FDE9B8" }}>ℹ️ {R.note}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
          <button onClick={() => setShowPicker((v) => !v)} style={{ fontSize: 11.5, fontWeight: 800, background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.35)", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>🗺️ 다른 지역 선택 — 멀리 계신 가족을 위해</button>
          {pickSido && <button onClick={() => { setPickSido(null); setPickDan(null); setShowPicker(false); }} style={{ fontSize: 11.5, fontWeight: 800, background: "#F5D98A", color: "#0B1F4B", border: "none", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>↩ 내 지역으로 돌아가기</button>}
        </div>
        {showPicker && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.3, opacity: .8, marginBottom: 7 }}>전국 어디든 선택할 수 있어요 — 숫자는 상담 가능 지점 수(실사 기준), ⚠️는 인접 관할 안내 지역이에요.</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LR_COVERAGE.map((c) => (
                <button key={c.sido} onClick={() => { setPickSido(c.sido); setPickDan(null); setPickBranch(null); }} style={{ fontSize: 11.3, fontWeight: 700, background: pickSido === c.sido ? "#F5D98A" : "rgba(255,255,255,.12)", color: pickSido === c.sido ? "#0B1F4B" : "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{c.sido} {c.br}{c.gap ? " ⚠️" : ""}</button>
              ))}
            </div>
            {pickSido && (LR_DAN[pickSido] || {}).dans && LR_DAN[pickSido].dans.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {LR_DAN[pickSido].dans.map((d) => (
                  <button key={d} onClick={() => setPickDan(d)} style={{ fontSize: 11.3, fontWeight: 700, background: (pickDan || LR_DAN[pickSido].dans[0]) === d ? "#fff" : "rgba(255,255,255,.12)", color: (pickDan || LR_DAN[pickSido].dans[0]) === d ? "#0B1F4B" : "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{d}</button>
                ))}
              </div>
            )}
            {/* 지역 아래 지점 전체 — 선택하면 지도에 핀이 찍히고 그 지점으로 상담 연결 */}
            {(() => { const sd = pickSido || R.sido; const brs = (typeof lrBranchesOf === "function") ? lrBranchesOf(sd) : []; if (!brs.length) return null; return (
              <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,.18)", paddingTop: 9 }}>
                <div style={{ fontSize: 11.3, opacity: .85, marginBottom: 6 }}><b>{sd} 지점 {brs.length}곳</b> — 지점을 누르면 지도에 표시되고 그 지점으로 상담이 연결돼요.</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 168, overflowY: "auto" }}>
                  {brs.map((b) => (
                    <button key={b.name + b.short} title={b.addr} onClick={() => { if (pickSido == null) { setPickSido(sd); } setPickBranch(b); }}
                      style={{ fontSize: 11, fontWeight: 700, background: pickBranch && pickBranch.name === b.name ? "#fff" : "rgba(255,255,255,.1)", color: pickBranch && pickBranch.name === b.name ? "#0B1F4B" : "#fff", border: "1px solid rgba(255,255,255,.22)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>{b.name}</button>
                  ))}
                </div>
                {pickBranch && <div style={{ fontSize: 11.3, marginTop: 7, color: "#FDE9B8" }}>📍 선택: <b>{pickBranch.name}</b> · {pickBranch.addr}</div>}
              </div> ); })()}
          </div>
        )}
        <div style={{ fontSize: 10.8, opacity: .75, marginTop: 8 }}>글로벌예방금융(주) · 금융위 등록 보험대리점 제2025060038호 · 인수사 현대해상(전속 제휴)</div>
      </div>

      {/* 진행 중 배정 카드 */}
      {activeLead && (
        <div className="card" style={{ border: "1.5px solid #BBF7D0", background: "#F0FDF4", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "#166534" }}>진행 중인 상담이 있어요</div>
          <div style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.7 }}>
            {activeLead.dan}{activeLead.branch ? ` · ${activeLead.branch}` : ""} · <b>{activeLead.agent}</b> · {activeLead.channel} 상담{activeLead.slot ? ` · ${activeLead.slot}` : ""}<br />
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
        <div className="rct" style={{ marginBottom: 8 }}><MapPin size={16} color="#2563EB" /> {pickBranch ? `${pickBranch.name} 위치` : "담당 조직 위치"}</div>
        <MapView points={pts} height={190} accent="#1D4ED8" />
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
          {pickBranch ? <><b style={{ color: "#1D4ED8" }}>{pickBranch.name}</b> · {pickBranch.addr} · 관할 {R.dan} <button onClick={() => setPickBranch(null)} style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, background: "#F1F5F9", border: "1px solid var(--border)", borderRadius: 7, padding: "3px 8px", cursor: "pointer" }}>지점 선택 해제</button></>
            : <>{R.dan} · {R.info.addr}{R.info.tel ? ` · ${R.info.tel}` : ""}{R.info.branches.length ? ` · 관내 지점 ${R.info.branches.map((b) => b.n).join("·")}` : ""}</>}
        </div>
      </div>}

      {/* Phase 2 — 리드 유형·우선순위 투명 공개(XAI): 왜 이 우선순위인지 근거를 회원에게 보여준다 */}
      {!activeLead && m && (() => { const dtype = pickSido ? "L-FAM" : lrDetectType(m); const sc = lrScore(m, dtype); const TL = pickSido ? "가족 단위 상담(원격지)" : ((LR_TYPES[dtype] || {}).label || dtype); return (
        <div className="card" style={{ marginBottom: 12, border: "1.5px solid #DDD6FE", background: "#FBFAFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div className="rct" style={{ margin: 0 }}><Sparkles size={15} color="#7C3AED" /> 내 상담 우선순위</div>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#EDE9FE", color: "#6D28D9", borderRadius: 999, padding: "4px 11px" }}>{TL}</span>
              <b style={{ fontSize: 16, color: sc.tier === "T1" ? "#DC2626" : "#1D4ED8" }}>{sc.tier}</b>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>수용성 {sc.A} + 적합도 {sc.F} · 첫 연락 {sc.sla}시간 내</span>
            </div>
          </div>
          <details style={{ marginTop: 7 }}><summary style={{ cursor: "pointer", fontSize: 11.8, color: "#6D28D9", fontWeight: 700 }}>왜 이 우선순위인가요? (산정 근거 보기)</summary>
            <div style={{ marginTop: 6 }}>{sc.why.map(([w, p], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.8, padding: "3px 2px", color: "#475569" }}><span>· {w}</span><b style={{ color: p.startsWith("−") ? "#B91C1C" : "#6D28D9" }}>{p}</b></div>)}
              <div className="chnote" style={{ marginTop: 6 }}>건강 관련 항목은 <b>등급·유무만</b> 산정에 쓰이고(원수치 미사용), 상담 우선순위 목적으로만 사용돼요 — 인수 심사·보험료 산정과 무관해요.</div></div>
          </details>
        </div> ); })()}

      {/* ③ 상담사 카드 + ④ 채널 + ⑤ 슬롯 + ⑥ 요약 토글 */}
      {!activeLead && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="rct" style={{ marginBottom: 10 }}><Bot size={16} color="#7C3AED" /> 상담사 선택 <span style={{ fontSize: 10.8, color: "var(--muted)", fontWeight: 600 }}>· 미선택 시 배정잔량·성과·SLA 실적 가중으로 자동 배분</span></div>
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
          <button className="cbtn pri" style={{ marginTop: 10 }} onClick={submit}><MapPin size={15} /> {m ? `${pickBranch ? pickBranch.name : R.dan} 상담 연결하기` : "로그인 후 이용할 수 있어요"}</button>
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
              <details style={{ margin: "4px 2px" }}><summary style={{ cursor: "pointer", fontSize: 11.5, color: "#1D4ED8", fontWeight: 700 }}>동의 문구 전문 보기 (제공받는 자·항목·목적·보유기간)</summary>
                <div style={{ fontSize: 11.3, color: "#475569", lineHeight: 1.75, background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", marginTop: 6 }}>
                  <b>① 개인정보 제3자 제공(필수)</b> — 상담 연결을 위해 아래 정보를 현대해상화재보험㈜·글로벌예방금융㈜에 제공합니다. 항목: 연락 토큰, 연령대·성별, 거주 행정동, 상담 유형·희망 채널 / 목적: 보험 상담 배정·연락 / 보유: 상담 종료 후 6개월. 동의를 거부할 수 있으며, 거부 시 지역 상담 연결이 제한됩니다.<br />
                  <b>② 민감정보(건강 분석 요약) 제공(필수·별도)</b> — 보장공백 <b>분석 요약 코드</b>(원본 검진 수치 아님)를 상담 준비 목적으로 제공하는 데 별도로 동의합니다. 이 정보는 보험 인수 심사나 보험료 산정에 사용되지 않습니다.<br />
                  <span style={{ color: "#94A3B8" }}>※ 문구는 최종 법률 자문으로 확정 전의 초안입니다.</span>
                </div>
              </details>
              <button className="cbtn pri" disabled={!(cAgree.health && cAgree.insurance)} style={{ opacity: (cAgree.health && cAgree.insurance) ? 1 : .5 }} onClick={doConsent}><ShieldCheck size={15} /> 동의하고 상담 연결</button>
              <div className="chnote" style={{ marginTop: 8 }}>동의 이력은 블록체인에 기록되고, 동의관리에서 <b>언제든 철회</b>할 수 있어요 — 철회 시 배정 리드 <b>즉시 회수</b>·접촉 중지·전달분 파기 확인(72시간 내)이 자동 진행돼요.</div>
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
