/* ══════════════ 내 대비 현황(NeedsCard.jsx) — 2단계 v1.4 축⓪ P1 실장(형 확정: 섹션=A안·위젯=B안 병용) ══════════════
   두 곡선이 만나는 화면. §0-A 구간만·평가어 없음 / §0-P 회원이 눌러 물을 때만 해설(3단: 사실→판단 유보→절차) —
   누르는 순간 needs_asked가 기록된다(두 곡선 교차의 계측). 불안 색(적색) 미사용 — 네이비/브랜드 중립(§D). */

function _ncMember() {
  try { const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (dm) return dm; } catch (e) {}
  try { if (typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") return selfMember(); } catch (e) {}
  return null;
}

function NeedsCard({ variant }) {
  const m = _ncMember();
  const [open, setOpen] = React.useState(null);   // "cost" | "income" | "fund"
  const sum = React.useMemo(() => { try { return m ? needsSummaryOf(m) : null; } catch (e) { return null; } }, [m && (m.id || m.email)]);
  if (!m || !sum) return null;
  const ask = (k) => {
    const next = open === k ? null : k;
    setOpen(next);
    if (next) { try { hiEvent("needs_asked", { key: k, src: variant || "card" }); } catch (e) {} }
  };
  const hospital = sum.cost.steps[2], exam = sum.cost.steps[0];
  const NAVY = "#0B2239", BRAND = "#C2410C", MUT = "#64748B";
  /* 3단 해설(§0-P 고정 구조) — 사실 → 판단 유보 → 절차. 문장은 이 컴포넌트가 아니라 데이터의 조립 */
  const EXPLAIN = {
    cost: [["사실", `지금 관리 단계 기준으로, 정밀검사는 ${exam.oopBand}, 입원까지 가면 ${hospital.oopBand}이 내가 내는 돈 구간이에요(${hospital.note}).`],
      ["판단", "지금 무엇을 준비할지는 정해진 답이 없어요 — 판단은 스스로 하시는 거예요."],
      ["절차", "치료비 보장 점검(보장분석 탭)에서 지금 가진 것부터 확인할 수 있어요. 궁금한 건 하이에게 물어보세요."]],
    income: sum.income.applicable
      ? [["사실", `치료에 전념하는 기간(${sum.income.durKo})의 생활비로 ${sum.income.needBand}이 필요하고, 가진 진단금 ${sum.income.diagManwon}만원을 빼면 ${sum.income.gapBand}이 남아요.`],
        ["판단", "이 구간을 어떻게 볼지는 가정마다 달라요 — 숫자만 보여드려요."],
        ["절차", "근거 통계의 출처는 카드 하단에 있어요. 자세한 건 하이 또는 담당 헬스케어 전문가에게 물어보세요."]]
      : [["사실", "지금은 예방 관리 구간이라 생활비 공백 계산 단계가 아니에요."],
        ["판단", "관리를 이어가면 이 칸은 계속 이 상태를 지키는 게 목표예요."],
        ["절차", "검진·미션을 이어가면 준비됨 칸이 대신 차올라요."]],
    fund: [["사실", `검진·미션·건강쇼핑으로 ${sum.fund.htk.toLocaleString()} HTK가 쌓였고, ${sum.fund.monthsKo}이에요.`],
      ["판단", "쓸지 모을지는 언제든 바꿀 수 있어요 — 지갑의 주인은 나예요."],
      ["절차", "건강지갑에서 적립 내역과 사용처를 볼 수 있어요."]],
  };
  const rows = [
    { k: "cost", lbl: "치료비", d1: "이 관리 단계에서 예상되는 내가 내는 돈", d2: `입원 기준 · 정밀검사는 ${exam.oopBand}`, v: hospital.oopBand + " 구간", c: NAVY },
    { k: "income", lbl: "생활비", d1: "치료 기간 소득 공백으로 필요한 돈",
      d2: sum.income.applicable ? `가진 진단금 ${sum.income.diagManwon}만원을 뺀 나머지예요` : "지금은 예방 관리 구간이에요",
      v: sum.income.applicable ? sum.income.gapBand + " 구간" : "해당 없음", c: NAVY },
    { k: "fund", lbl: "준비됨", d1: "건강활동으로 쌓인 준비금", d2: sum.fund.monthsKo, v: sum.fund.htk.toLocaleString() + " HTK", c: BRAND },
  ];
  if (variant === "widget") {   /* B안 — 3칼럼 콤팩트(홈·지갑 요약) */
    return (<div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,#0B2239,#16405F)", color: "#fff", padding: "9px 14px" }}>
        <b style={{ fontSize: 13.5 }}>🧾 내 대비 현황</b><span style={{ fontSize: 10.5, color: "#9FB7CC" }}>구간으로만 · 판단은 내가 · [예시·시연]</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {rows.map((r) => (<div key={r.k} onClick={() => ask(r.k)} style={{ padding: "12px 8px", textAlign: "center", cursor: "pointer", borderRight: "1px solid #EEF2F6", background: r.k === "fund" ? "#FFFBF5" : "#fff" }}>
          <div style={{ fontSize: 11.5, fontWeight: 900, color: MUT }}>{r.lbl}</div>
          <div style={{ fontSize: 15.5, fontWeight: 900, color: r.c, margin: "4px 0 2px" }}>{r.v}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.45 }}>{r.d2}</div>
        </div>))}
      </div>
      {open && <div style={{ padding: "9px 14px", background: "#F8FAFC", borderTop: "1px solid #EEF2F6", fontSize: 12, lineHeight: 1.7 }}>
        {EXPLAIN[open].map(([t, x]) => <div key={t}><b style={{ color: BRAND, marginRight: 6 }}>{t}</b>{x}</div>)}</div>}
    </div>);
  }
  /* A안 — 3줄 리스트형(치료비 케어 섹션 상단, 형 확정 2026-08-30) */
  return (<div className="card" style={{ padding: 0, overflow: "hidden", margin: "12px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,#0B2239,#16405F)", color: "#fff", padding: "11px 16px" }}>
      <b style={{ fontSize: 15 }}>🧾 내 대비 현황</b>
      <span style={{ fontSize: 11, color: "#9FB7CC" }}>지금 단계 기준 · 구간으로만 보여드려요 · [예시·시연]</span>
    </div>
    {rows.map((r) => (<div key={r.k} onClick={() => ask(r.k)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: "1px solid #EEF2F6", cursor: "pointer", background: open === r.k ? "#F8FAFC" : "#fff" }}>
      <div style={{ width: 62, fontSize: 14.5, fontWeight: 900, color: NAVY }}>{r.lbl}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.6, color: "#374151" }}>{r.d1}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{r.d2}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: r.c, whiteSpace: "nowrap" }}>{r.v}</div>
      <span style={{ color: "#CBD5E1", fontSize: 12 }}>{open === r.k ? "▲" : "▼"}</span>
    </div>))}
    {open && <div style={{ padding: "11px 16px", background: "#F8FAFC", borderBottom: "1px solid #EEF2F6", fontSize: 12.6, lineHeight: 1.75 }}>
      {EXPLAIN[open].map(([t, x]) => <div key={t} style={{ marginBottom: 3 }}><b style={{ color: BRAND, marginRight: 7 }}>{t}</b>{x}</div>)}
      {open === "income" && sum.income.applicable && <div style={{ fontSize: 10.4, color: MUT, marginTop: 5 }}>근거: {sum.income.durSrc} · {sum.income.livingSrc} (일부 검수 대기 — 공식 확정 전 보수적 근사)</div>}
    </div>}
    <div style={{ padding: "9px 16px", fontSize: 11.6, color: MUT, background: "#FFFBF5" }}>
      검진 결과·미션 완결·계약이 바뀌면 자동으로 다시 계산돼요 · <b style={{ color: BRAND }}>궁금한 줄을 눌러보세요</b>
    </div>
  </div>);
}
