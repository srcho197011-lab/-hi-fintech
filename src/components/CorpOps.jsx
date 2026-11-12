/* ══════════════ 회사 총괄운영 — 총괄 대시보드(CorpOps.jsx) · Phase 1 (형 지시 2026-11-11) ══════════════
   화면: 다크 콕핏 3단 — 좌(지표) · 중앙(조직 온톨로지 · 원근 회전) · 우(사람이 결정할 것 · 루틴).
   ⚠️ 원칙:
     · 실데이터가 붙기 전에는 지표를 「미연결」로 둔다 — 숫자를 지어내지 않는다(Phase 10에서 연결).
     · 「자동 실행」이라 쓰지 않는다 — 백엔드가 없어 브라우저가 닫히면 아무것도 돌지 않는다.
       루틴의 실체는 「예약 — 다음 열람 시」다.
     · 사람과 AI를 같은 모양으로 쓰지 않는다 — AI에는 AI 배지가 붙는다.
     · 좌표·점은 corpOrg.js의 고정 시드 산출물을 읽는다 — 이 파일에 Math.random을 두지 않는다.
   원천: src/data/corpOrg.js(조직·일정 단일 소스) */

function CorpOps({ onGo, onTab }) {
  const wrapRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const [view, setView] = React.useState("dash");   /* dash 총괄 · org 조직도 */
  const [sel, setSel] = React.useState(null);
  const [spin, setSpin] = React.useState(true);
  const [showLink, setShowLink] = React.useState(true);
  const [showDot, setShowDot] = React.useState(true);
  const st = React.useRef({ rot: 0, target: null, hover: null, sel: null, spin: true, link: true, dot: true });

  React.useEffect(() => { st.current.sel = sel; }, [sel]);
  React.useEffect(() => { st.current.spin = spin; }, [spin]);
  React.useEffect(() => { st.current.link = showLink; }, [showLink]);
  React.useEffect(() => { st.current.dot = showDot; }, [showDot]);

  /* 팀 선택 — 중앙 원 박스와 좌측 팀 바로가기가 같은 동작을 한다 */
  const pick = React.useCallback((id) => {
    setSel(prev => {
      const next = (prev === id) ? null : id;
      const t = next ? corpTeam(next) : null;
      st.current.target = t ? (Math.PI - t.th) : null;
      if (t) setSpin(false);
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (view !== "dash") return;
    const svg = svgRef.current; if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    let W = 0, H = 0, CX = 0, CY = 0, R = 0, FOC = 0, raf = 0, last = 0;
    const TAU = Math.PI * 2;

    svg.innerHTML = "";
    const defs = mk("defs", {});
    defs.innerHTML = '<filter id="corpGl" x="-70%" y="-70%" width="240%" height="240%">' +
      '<feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    svg.appendChild(defs);
    const gLink = mk("g", {}), gCore = mk("g", {}), gNode = mk("g", {});
    svg.appendChild(gLink); svg.appendChild(gCore); svg.appendChild(gNode);

    function measure() {
      const b = svg.getBoundingClientRect();
      W = b.width || 600; H = b.height || 420; CX = W / 2; CY = H / 2 + 10;
      R = Math.min(W * 0.40, Math.max(66, (H - 124) * 0.50)); FOC = R * 3.4;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    }
    const proj = (x, y, z) => { const k = FOC / (FOC + z); return { x: CX + x * k, y: CY + y * k, k }; };

    function draw() {
      const S = st.current, P = {};
      CORP_TEAMS.forEach(t => {
        const a = t.th + S.rot;
        const x = R * Math.cos(t.ph) * Math.sin(a), y = R * Math.sin(t.ph), z = R * Math.cos(t.ph) * Math.cos(a);
        P[t.id] = Object.assign(proj(x, y, z), { z: z, t: t });
      });

      /* 코어 */
      gCore.innerHTML = "";
      const c0 = proj(0, 0, 0);
      gCore.appendChild(mk("circle", { cx: c0.x, cy: c0.y, r: R * 0.085, fill: "none", stroke: "#E8795A", "stroke-width": 1, opacity: .30 }));
      gCore.appendChild(mk("circle", { cx: c0.x, cy: c0.y, r: R * 0.05, fill: "#E8795A", opacity: .55, filter: "url(#corpGl)" }));
      const ct = mk("text", { x: c0.x, y: c0.y + R * 0.17, "text-anchor": "middle", fill: "#8B8B94", "font-size": 10 });
      ct.textContent = "하이핀"; gCore.appendChild(ct);

      /* 연결선 */
      gLink.innerHTML = "";
      if (S.link) {
        const key = S.hover || S.sel;
        CORP_LINKS.forEach(pair => {
          const A = P[pair[0]], B = P[pair[1]]; if (!A || !B) return;
          const zm = (A.z + B.z) / 2, op = 0.07 + 0.17 * (1 - (zm + R) / (2 * R));
          const hl = key && (pair[0] === key || pair[1] === key);
          gLink.appendChild(mk("line", {
            x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: hl ? "#FF9E7A" : "#E8795A",
            "stroke-width": hl ? 1.6 : 0.9, opacity: hl ? 0.62 : (S.sel ? op * 0.45 : op),
          }));
        });
      }

      /* 노드 — 뒤에서 앞으로 */
      gNode.innerHTML = "";
      /* ⚠️ 그린 자리를 적어 둔다. 고르기는 **이 좌표로** 센다 —
         보이지 않는 넓은 원을 깔아 두면 앞 노드가 뒤 노드의 클릭을 가로채
         「M1 을 눌렀는데 M3 가 열리는」 일이 생긴다(실측). 좌표로 세면 보이는 대로 골라진다. */
      S.pos = [];
      CORP_TEAMS.slice().sort((p, q) => P[q.id].z - P[p.id].z).forEach(t => {
        const q = P[t.id], k = q.k, near = 1 - (q.z + R) / (2 * R);
        const hl = (S.hover === t.id) || (S.sel === t.id);
        let op = 0.34 + 0.66 * near; if (S.sel && S.sel !== t.id) op *= 0.42;
        const rr = R * 0.168 * k * (S.sel === t.id ? 1.08 : 1);
        const g = mk("g", { opacity: op, style: "cursor:pointer" });
        g.dataset.id = t.id;

        if (S.dot) {
          (CORP_DOTS[t.id] || []).forEach(d => {
            const dx = d.x * rr * 1.62, dy = d.y * rr * 1.62, dz = d.z * rr * 1.62;
            const pp = proj((q.x - CX) / k + dx, (q.y - CY) / k + dy, q.z + dz);
            const dn = 1 - (dz + rr * 1.7) / (rr * 3.4);
            g.appendChild(mk("circle", { cx: pp.x, cy: pp.y, r: Math.max(.5, 1.5 * k * d.s), fill: t.c, opacity: 0.22 + 0.5 * dn }));
          });
        }
        if (hl || near > 0.72) g.appendChild(mk("circle", { cx: q.x, cy: q.y, r: rr * 1.26, fill: t.c, opacity: hl ? .14 : .07, filter: "url(#corpGl)" }));
        g.appendChild(mk("circle", { cx: q.x, cy: q.y, r: rr, fill: "#0C0C0F", stroke: t.c, "stroke-width": hl ? 2 : 1.3, opacity: .97 }));
        g.appendChild(mk("circle", { cx: q.x, cy: q.y, r: rr * 0.80, fill: "none", stroke: t.c, "stroke-width": .6, opacity: .30 }));

        const fit = Math.min(1, (rr * 1.70) / (t.sh.length * Math.max(8.4, 11.0 * k)));
        const fs = Math.max(7.4, 11.0 * k * fit);
        const t1 = mk("text", { x: q.x, y: q.y - fs * 0.42, "text-anchor": "middle", fill: "#F2EFEC", "font-size": fs, "font-weight": 700, "letter-spacing": "-.03em" });
        t1.textContent = t.sh; g.appendChild(t1);

        /* 사람 책임자 · AI 팀장을 나란히 */
        const ps = Math.max(6.4, fs * 0.72);
        const pair = mk("text", { x: q.x, y: q.y + ps * 1.22, "text-anchor": "middle", "font-size": ps, "font-weight": 600 });
        const s1 = mk("tspan", { fill: "#CFCBC7" }); s1.textContent = t.own;
        const s2 = mk("tspan", { fill: "#5F5F68" }); s2.textContent = " · ";
        const s3 = mk("tspan", { fill: t.c }); s3.textContent = t.ai;
        pair.appendChild(s1); pair.appendChild(s2); pair.appendChild(s3); g.appendChild(pair);

        if (near > 0.62) {
          const am = mk("text", { x: q.x, y: q.y + ps * 2.22, "text-anchor": "middle", fill: "#55555E", "font-size": Math.max(5.4, ps * 0.70), "letter-spacing": ".06em" });
          am.textContent = "사람 · AI"; g.appendChild(am);
        }
        const t3 = mk("text", { x: q.x, y: q.y - rr - 4.5 * k, "text-anchor": "middle", fill: "#6E6E78", "font-size": Math.max(6.2, 7.6 * k), "letter-spacing": ".04em" });
        t3.textContent = t.id; g.appendChild(t3);
        S.pos.push({ id: t.id, x: q.x, y: q.y, r: rr, z: q.z });
        gNode.appendChild(g);
      });
    }

    function loop(ts) {
      const S = st.current, dt = last ? Math.min(60, ts - last) : 16;
      if (S.target !== null) {
        let d = ((S.target - S.rot + Math.PI) % TAU + TAU) % TAU - Math.PI;
        if (Math.abs(d) < 0.004) { S.rot = S.target; S.target = null; } else S.rot += d * Math.min(1, dt * 0.0075);
      } else if (S.spin) S.rot += dt * 0.000125;
      last = ts; draw(); raf = requestAnimationFrame(loop);
    }

    /* 어느 팀을 눌렀나 — DOM 이 아니라 **마지막으로 그린 좌표**로 센다.
       viewBox 가 CSS 크기와 같아 화면 좌표에서 테두리 위치만 빼면 그대로 쓸 수 있다.
       겹쳐 보이면 **앞에 있는 쪽**(z 가 작은 쪽)이 골라진다 — 보이는 대로다. */
    const idAt = (e) => {
      const list = st.current.pos || [];
      if (!list.length) return null;
      const b = svg.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      let hit = null;
      list.forEach((p) => {
        const d = Math.sqrt((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y));
        if (d > p.r * 1.2) return;                 /* 원 밖이면 그 팀이 아니다 */
        if (!hit || p.z < hit.z) hit = p;          /* 겹치면 앞에 있는 쪽 */
      });
      return hit ? hit.id : null;
    };
    const onMove = (e) => { st.current.hover = idAt(e); };
    const onLeave = () => { st.current.hover = null; };

    /* ⚠️ click 으로는 원을 고를 수 없다 — 그래프를 **매 프레임 다시 그리기** 때문이다.
       gNode.innerHTML = "" 가 원을 통째로 지웠다 다시 만들므로, 누른 요소와 뗀 요소가 달라지고
       브라우저는 click 을 **공통 조상**(svg)에 쏜다. 그러면 노드를 눌렀는데도 pick(null) 이 돌아
       아무 일도 일어나지 않는다. 사람 손의 클릭은 100ms 안팎이라 그 사이 예닐곱 프레임이 지나간다
       — 2ms 짜리 자동 클릭으로는 재현되지 않아 오래 숨어 있던 자리다(실측: 120ms 뒤 다른 요소).
       그래서 **누르는 순간** 어느 팀인지를 적어 두고, 뗄 때 그 값으로 고른다. */
    let downId = null, downPt = null;
    const onDown = (e) => { downId = idAt(e); downPt = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!downPt) return;
      const moved = Math.abs(e.clientX - downPt.x) + Math.abs(e.clientY - downPt.y);
      const id = downId, from = downPt;
      downId = null; downPt = null;
      if (moved > 10) return;                       /* 끌었으면 고르지 않는다 */
      const r = svg.getBoundingClientRect();        /* 밖에서 뗐으면 고르지 않는다 */
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      void from;
      pick(id);
    };
    const onCancel = () => { downId = null; downPt = null; };
    const onResize = () => measure();

    measure();
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseleave", onLeave);
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointercancel", onCancel);
    window.addEventListener("pointerup", onUp);     /* 창 밖에서 떼도 상태가 남지 않게 */
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("mouseleave", onLeave);
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
    };
  }, [pick, view]);

  const selT = sel ? corpTeam(sel) : null;
  const sch = CORP_SCHEDULE;

  /* 루틴·캘린더는 **실제 오늘**로 계산한다 — 근무일과 회의 요일을 따지기 때문이다.
     실행 기록이 없으므로(실데이터 미연결) 「예정 시각이 지났다 = 밀렸다」로만 판정한다.
     이것이 「열었을 때 밀린 것을 알려준다」의 실체다. */
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const cal = typeof corpCalendar === "function" ? corpCalendar(now) : { y: now.getFullYear(), m: now.getMonth() + 1, rows: [] };
  const fmt = (d) => d ? (String(d.getMonth() + 1) + "/" + d.getDate() + " " +
    String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")) : "—";
  const routines = (sch.routines || []).map(r => {
    const w = typeof corpRoutineWhen === "function" ? corpRoutineWhen(r, now) : {};
    if (w.kind === "release") return { r: r, state: "rel", when: "배포 전" };
    /* ⚠️ 「밀림」이라 쓰지 않는다 — 루틴을 실행하는 기능이 아직 없으므로(P7) 안 돌린 것이 아니라
       돌릴 수 있는 상태가 아니다. 지난 예정과 다음 예정을 그대로 보일 뿐이다. */
    return { r: r, state: "wait", when: "다음 " + fmt(w.next), prev: w.prev ? fmt(w.prev) : null };
  });
  const lateN = 0;
  /* ⚠️ 「주간회의 자료」 루틴(월 09:30)을 회의 시각으로 읽던 결함을 P7에서 고쳤다 —
     회의 시각의 단일 원천은 CORP_SCHEDULE.weekly.time 이다. 자료 통합은 회의 30분 전 준비이지 회의가 아니다. */
  const nextMeet = (function () {
    if (typeof corpMtgWeek !== "function") return null;
    const w = corpMtgWeek(now); if (!w) return null;
    return { dday: w.dday, label: fmt(w.at), live: w.live };
  })();

  return (
    <div className="corpops" ref={wrapRef}>
      <div className="corp-top">
        <div className="corp-vtabs">
          <button className={"corp-vt" + (view === "dash" ? " on" : "")} onClick={() => setView("dash")}>총괄</button>
          <button className={"corp-vt" + (view === "org" ? " on" : "")} onClick={() => setView("org")}>조직도</button>
          <button className={"corp-vt" + (view === "mtg" ? " on" : "")} onClick={() => setView("mtg")}>주간회의</button>
          <button className={"corp-vt" + (view === "gov" ? " on" : "")} onClick={() => setView("gov")}>일정 · 결재</button>
          <button className={"corp-vt" + (view === "up" ? " on" : "")} onClick={() => setView("up")}>자료 반입</button>
          <button className={"corp-vt" + (view === "ag" ? " on" : "")} onClick={() => setView("ag")}>AI 팀장 대화</button>
          <button className={"corp-vt" + (view === "vt" ? " on" : "")} onClick={() => setView("vt")}>자료실</button>
          {sel && <button className={"corp-vt" + (view === "team" ? " on" : "")} onClick={() => setView("team")}
            style={{ borderColor: (corpTeam(sel) || {}).c }}>{(corpTeam(sel) || {}).sh} 팀</button>}
        </div>
        <div className="corp-sp" />
        <div className="corp-stub">실데이터 미연결 · 지표는 연결 후 채워집니다</div>
      </div>

      {view === "org" && <CorpOrgChart sel={sel} pick={pick} onTab={onTab} open={(id) => { pick(id); setView("team"); }} />}
      {view === "mtg" && typeof CorpMeetingSection === "function" && <CorpMeetingSection />}
      {view === "gov" && typeof CorpBoardSection === "function" && <CorpBoardSection />}
      {view === "up" && typeof CorpUploadSection === "function" && <CorpUploadSection />}
      {view === "ag" && typeof CorpAgentChatSection === "function" && <CorpAgentChatSection />}
      {view === "vt" && typeof CorpVaultSection === "function" && <CorpVaultSection />}
      {view === "team" && sel && <CorpTeamBoard team={corpTeam(sel)} onGo={onGo} onTab={onTab} back={() => setView("dash")} />}

      <div className="corp-shell" style={view !== "dash" ? { display: "none" } : undefined}>
        {/* ── 좌 ── */}
        <div className="corp-col corp-L">
          <div className="corp-blk">
            <div className="corp-lab">현금 · 런웨이</div>
            <div className="corp-kpi"><div><span className="n">—</span><span className="u">원</span><div className="k">현금 잔고</div></div><div className="corp-dlt">미연결</div></div>
            <div className="corp-kpi"><div><span className="n">—</span><span className="u">개월</span><div className="k">런웨이</div></div><div className="corp-dlt">—</div></div>
          </div>
          <div className="corp-blk">
            <div className="corp-lab">이번 달 <b>실적</b></div>
            <div className="corp-kpi"><div><span className="n">—</span><span className="u">원</span><div className="k">매출</div></div><div className="corp-dlt">—</div></div>
            <div className="corp-kpi"><div><span className="n">—</span><span className="u">건</span><div className="k">전표</div></div><div className="corp-dlt">—</div></div>
          </div>
          <div className="corp-blk">
            <div className="corp-lab">업무시간 <b>확정</b></div>
            <div className="corp-row"><span className="m">근무</span><span className="s">{sch.work.from} ~ {sch.work.to}</span></div>
            <div className="corp-row"><span className="m">점심</span><span className="s">{sch.work.lunch}</span></div>
            <div className="corp-row"><span className="m">주간회의</span><span className="s">{sch.weekly.day} {sch.weekly.time} · {sch.weekly.mode}</span></div>
          </div>
          <div className="corp-blk">
            <div className="corp-lab">캘린더 <b>{cal.y}.{String(cal.m).padStart(2, "0")}</b>
              <span className="corp-callegend"><i className="cl-meet" />회의 <i className="cl-work" />근무</span></div>
            <table className="corp-cal"><tbody>
              <tr>{["일", "월", "화", "수", "목", "금", "토"].map(d => <th key={d}>{d}</th>)}</tr>
              {cal.rows.map((row, i) => (
                <tr key={i}>{row.map((c, j) => (
                  <td key={j} className={!c ? "off" : [c.work ? "w" : "", c.meet ? "m" : "", c.today ? "t" : "", c.past ? "p" : ""].join(" ")}>
                    {c ? c.d : ""}</td>))}</tr>
              ))}
            </tbody></table>
            <div className="corp-row" style={{ marginTop: 8 }}>
              <span className="m">다음 주간회의</span>
              <span className="s">{nextMeet ? (nextMeet.dday === 0 ? "오늘 " : "D-" + nextMeet.dday + " ") + nextMeet.label : "—"}</span>
            </div>
          </div>

          <div className="corp-blk">
            <div className="corp-lab">팀 바로가기 <b>{CORP_SUMMARY.teams}</b></div>
            {CORP_DIV.map(d => {
              const list = CORP_TEAMS.filter(t => t.div === d.id);
              if (!list.length) return null;
              return (
                <div key={d.id}>
                  <div className="corp-divname">{d.name}</div>
                  {list.map(t => (
                    <div key={t.id} className={"corp-team" + (sel === t.id ? " sel" : "")} onClick={() => pick(t.id)}
                      title={t.name + " — 책임자 " + t.own + " · AI 팀장 " + t.ai}>
                      <span className="dot" style={{ background: t.c }} />
                      <span className="tn">{t.sh}</span>
                      <span className="ag"><b>{t.own}</b><i> · </i><b style={{ color: t.c }}>{t.ai}</b></span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="corp-blk corp-last">
            <div className="corp-lab">인원</div>
            <div className="corp-row"><span className="m">재직</span><span className="s"><b>{CORP_SUMMARY.peopleN}</b>명</span></div>
            <div className="corp-row"><span className="m">채워진 자리</span><span className="s"><b>{CORP_SUMMARY.filled}</b> / {CORP_SUMMARY.cap}</span></div>
            <div className="corp-note">겸임이 있어 <b>자리 수와 사람 수가 다릅니다</b> — 합류 전 자리는 0으로 둡니다.</div>
          </div>
        </div>

        {/* ── 중앙 ── */}
        <div className="corp-col corp-C">
          <svg ref={svgRef} className="corp-stage" />
          <div className="corp-cap">
            <h3>조직 온톨로지</h3>
            <p>원 = 팀 · 원 안은 <b>사람 책임자 · AI 팀장</b> · 선 = 팀 사이 업무 흐름<br />
              원근 회전 — 앞은 크고 밝게, 뒤는 작고 흐리게.<br />
              <b>원을 누르면</b> 그 팀이 정면으로 오고 아래에 안내가 열립니다 — 같은 원을 다시 누르면 닫힙니다.</p>
          </div>
          {selT && (
            <div className="corp-selbox">
              <div className="sx">
                <span className="sdot" style={{ background: selT.c }} />
                <span className="sid">{selT.id}</span>
                <span className="sname">{selT.name}</span>
                <span className="sgrp">{(corpDiv(selT.div) || {}).name}</span>
                <button className="corp-btn on" onClick={() => setView("team")}>팀 대시보드 →</button>
                <button className="sclose" onClick={() => pick(selT.id)}>닫기</button>
              </div>
              <div className="sy">
                <div className="sp"><span className="pk">사람 책임자</span><b>{selT.own}</b><i>{selT.ownTitle}</i></div>
                <div className="pdiv" />
                <div className="sp">
                  {typeof CorpAvatar === "function" && <CorpAvatar ai={selT.ai} size={26} />}
                  <span className="pk">AI 팀장</span><b style={{ color: selT.c }}>{selT.ai}</b><span className="corp-ai">AI</span>
                </div>
                <div className="pdiv" />
                <div className="sp"><span className="pk">인원</span><b>{selT.head} / {selT.cap}</b><i>{selT.joined}</i></div>
              </div>
              <div className="sw">{selT.work}</div>
              <div className="sv">
                <div><span className="vk ok">{selT.ai}가 하는 일</span>{selT.can.join(" · ")}</div>
                <div><span className="vk no">사람이 마무리</span>{selT.cannot.map(x => x.act).join(" · ")}</div>
              </div>
            </div>
          )}
          <div className="corp-ctl">
            <button className={"corp-btn" + (spin ? " on" : "")} onClick={() => { setSpin(s => !s); st.current.target = null; }}>{spin ? "회전 멈춤" : "회전 시작"}</button>
            <button className={"corp-btn" + (!showLink ? " on" : "")} onClick={() => setShowLink(v => !v)}>{showLink ? "연결선 끄기" : "연결선 켜기"}</button>
            <button className={"corp-btn" + (!showDot ? " on" : "")} onClick={() => setShowDot(v => !v)}>{showDot ? "점 끄기" : "점 켜기"}</button>
          </div>
        </div>

        {/* ── 우 ── */}
        <div className="corp-col corp-R">
          <div className="corp-sec">
            <div className="corp-sh"><b>지금 사람이 결정할 것</b><span className="c">0</span></div>
            <div className="corp-empty">대기 중인 결재가 없습니다 — 결재 흐름은 Phase 9에서 붙습니다</div>
          </div>
          <div className="corp-sec">
            <div className="corp-sh"><b>이번 주 회의</b><span className="c">{sch.weekly.day} {sch.weekly.time.split("~")[0]}</span></div>
            <div className="corp-card">
              <div className="ti">주간 업무회의
                <button className="corp-pill go" onClick={() => setView("mtg")}>지면 열기 →</button></div>
              <div className="by">{sch.weekly.mode} · 사람 {CORP_SUMMARY.peopleN} + AI 팀장 {CORP_SUMMARY.agents}
                {CORP_SUMMARY.pendingN > 0 && <span className="corp-vac"> · 책임자 공석 {CORP_SUMMARY.pendingN}석</span>}</div>
              <div className="ds">금요일에 각 AI 팀장이 주간보고 초안을 만들고, 팀 책임자가 확정하면 월 09:30에 <b>나침반</b>이 1부로 통합합니다.
                참석 인원은 <b>재직자</b>만 셉니다 — 합류 전 책임자는 참석자가 아니라 공석입니다.</div>
            </div>
          </div>
          <div className="corp-sec">
            <div className="corp-sh"><b>책임자 · AI 팀장</b><span className="c">{CORP_SUMMARY.agents}</span></div>
            {CORP_TEAMS.map(t => (
              <div key={t.id} className={"corp-rt" + (sel === t.id ? " sel" : "")} onClick={() => pick(t.id)}>
                <span className="dot" style={{ background: t.c }} />
                <span className="nm"><b>{t.own}</b><i> · </i><b style={{ color: t.c }}>{t.ai}</b></span>
                <span className="corp-ai">AI</span><span className="w">{t.id}</span>
              </div>
            ))}
          </div>
          <div className="corp-sec corp-last">
            <div className="corp-sh"><b>루틴</b><span className="c">{sch.routines.length}</span></div>
            {routines.map((r, i) => (
              <div key={i} className="corp-rt" title={"AI " + r.r.ai + " — " + r.r.does + " / 사람이 마무리 — " + r.r.human}>
                <span className="nm">{r.r.t}<i className="rt-ai">{r.r.ai} · {r.r.does}</i></span>
                <span className={"corp-pill " + (r.state === "rel" ? "rel" : "wait")}>
                  {r.state === "rel" ? "배포 전" : "예정"}</span>
                <span className="w">{r.when}</span>
              </div>
            ))}
            <div className="corp-note">예정 시각은 업무시간과 주기로 계산한 <b>실제 값</b>입니다.
              생성 경로가 붙은 것은 주간회의 관련 <b>셋</b>뿐이고, 나머지 아홉은 아직 돌 수 있는 상태가 아닙니다(실행 기록은 Phase 10).
              백엔드가 없어 브라우저가 닫히면 스스로 돌지 않습니다 — <b>열었을 때 그 주차 자료가 없으면 그때 만드는</b> 방식입니다.
              <button className="corp-pill go" onClick={() => setView("mtg")}>루틴 상태 보기 →</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ 조직도 — 본부·팀·사람 책임자·AI 팀장과 책임 경계 (Phase 2) ══════════════
   ⚠️ 두 가지를 반드시 함께 보인다:
     ① AI가 끝까지 하는 일   ② 사람이 마무리하는 일과 **무엇이 그것을 막는지**
   「AI는 ~하지 않습니다」라는 문장만으로는 부족하다 — 차단 조건이 없으면 그건 선언일 뿐이다. */
function CorpOrgChart({ sel, pick, open, onTab }) {
  const S = CORP_SUMMARY;
  return (
    <div className="corp-org">
      <div className="co-head">
        <div>
          <h3>조직구조와 책임 체계</h3>
          <p>모든 팀에 <b>사람 책임자 1명</b>과 <b>AI 팀장 1명</b>이 쌍으로 있습니다.
            되돌릴 수 없거나 · 책임이 회사 밖으로 나가거나 · 법적 효과가 생기는 일은 <b>사람이 마무리합니다</b>.</p>
        </div>
        <div className="co-sum">
          <div><span className="n">{S.teams}</span><span className="k">팀</span></div>
          <div><span className="n">{S.agents}</span><span className="k">AI 팀장</span></div>
          <div><span className="n">{S.peopleN}</span><span className="k">재직 인원</span></div>
          <div><span className="n">{S.filled}<em>/{S.cap}</em></span><span className="k">채워진 자리</span></div>
        </div>
      </div>

      <div className="co-ceo"><span className="co-crown">CEO</span> 조성래
        <span className="co-note">경영관리본부 3팀 겸임 · 법상 정보보호 최고책임자 · 개인정보 보호책임자</span></div>

      {CORP_DIV.map(d => {
        const list = CORP_TEAMS.filter(t => t.div === d.id);
        if (!list.length) return null;
        return (
          <div key={d.id} className="co-div">
            <div className="co-dname">{d.name}<i>{d.note}</i></div>
            <div className="co-grid">
              {list.map(t => (
                <div key={t.id} className={"co-card" + (sel === t.id ? " sel" : "")}
                  style={{ "--tc": t.c }} onClick={() => (typeof open === "function" ? open(t.id) : pick(t.id))}>
                  <div className="co-top">
                    {typeof CorpAvatar === "function" && <CorpAvatar ai={t.ai} size={44} title={t.ai} />}
                    <div className="co-id">
                      <div className="co-tname">{t.name}<span className="co-code">{t.id}</span></div>
                      <div className="co-pair">
                        <b>{t.own}</b><i>{t.ownTitle}</i>
                        <span className="co-sep">·</span>
                        <b style={{ color: t.c }}>{t.ai}</b><span className="corp-ai">AI</span>
                      </div>
                    </div>
                    <div className={"co-head-c" + (t.head === 0 ? " zero" : "")}>{t.head} / {t.cap}
                      <i>{t.joined}</i></div>
                  </div>
                  <div className="co-work">{t.work}</div>
                  <div className="co-pages">{t.pages.map((p, i) => (
                    <span key={i} className={p.kind === "new" ? "pg-new" : (p.kind === "mod" ? "pg-mod" : "")}>{p.t}
                      {p.kind === "new" && <i>{p.at}</i>}
                      {p.kind === "mod" && <i>신설</i>}</span>))}</div>
                  <div className="co-split">
                    <div className="co-can">
                      <div className="co-ck"><b>{t.ai}</b>가 끝까지 하는 일</div>
                      <ul>{t.can.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                    <div className="co-cannot">
                      <div className="co-nk">사람이 마무리 — 무엇이 막는가</div>
                      <ul>{t.cannot.map((x, i) => (
                        <li key={i}><b>{x.act}</b><span className="co-by">{x.by}</span>
                          <em className={x.at === "기존" ? "done" : (x.at === "—" ? "none" : "")}>
                            {x.at === "기존" ? "이미 코드에 있음" : (x.at === "—" ? "경로 자체를 두지 않음" : x.at + "에서 강제")}</em></li>
                      ))}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="co-div">
        <div className="co-dname">전사 공통<i>팀에 귀속하지 않음</i></div>
        <div className="co-grid">
          <div className="co-card" style={{ "--tc": "#6366F1" }}
            onClick={() => typeof onTab === "function" && onTab("whitepaper")}>
            <div className="co-top">
              <div className="co-id">
                <div className="co-tname">백서<span className="co-code">전사</span></div>
                <div className="co-pair"><b>전 팀 열람</b><span className="co-sep">·</span>
                  <i>담당 AI 없음 — 사람이 쓰고 사람이 고친다</i></div>
              </div>
            </div>
            <div className="co-work">제품·사업·기술의 기록. 특정 팀의 산출물이 아니라 회사 전체가 함께 보는 지면입니다.</div>
            <div className="co-pages"><span>백서 열기 →</span></div>
          </div>
        </div>
      </div>

      <div className="co-foot">
        <b>자리와 사람은 다릅니다</b> — 실제 재직 인원은 <b>{S.peopleN}명</b>({S.people.join(" · ")})이고,
        채워진 자리는 <b>{S.filled} / {S.cap}</b>입니다. CEO가 경영관리본부 세 팀을 겸임하므로 자리 수가 사람 수보다 큽니다.
        합류 전 자리는 0으로 둡니다 — {S.pending.join(" · ")} {S.pendingN}분은 합류일이 정해지면 숫자가 올라갑니다.
        없는 인원을 있는 것처럼 세면 투자사에 제출한 보안 리포트의 「인력 0명」 선언과 어긋납니다.
      </div>
    </div>
  );
}

/* ══════════════ 팀 대시보드 — 현황 + 기존 지면 + 계획/대비 (Phase 3) ══════════════
   ⚠️ 컴포넌트를 복제하지 않는다. 기존 지면은 **같은 전역 컴포넌트를 그대로 호출**한다 —
      복제하면 같은 화면이 두 벌이 되고 진실이 갈린다.
      회계팀이 본보기다: 재무현황(실적·신설) + 재무계획(기존 「재무회계」 이관) + 예실 대비. */
function CorpTeamBoard({ team, onGo, onTab, back }) {
  const [page, setPage] = React.useState(0);
  React.useEffect(() => { setPage(0); }, [team && team.id]);
  if (!team) return null;
  const pg = team.pages[page] || team.pages[0];
  const Render = pg && pg.comp ? corpPageComp(pg.comp) : null;

  return (
    <div className="corp-board" style={{ "--tc": team.c }}>
      <div className="cb-head">
        <button className="cb-back" onClick={back}>← 총괄</button>
        {typeof CorpAvatar === "function" && <CorpAvatar ai={team.ai} size={38} />}
        <div className="cb-id">
          <div className="cb-name">{team.name}<span className="cb-code">{team.id}</span>
            <span className="cb-div">{(corpDiv(team.div) || {}).name}</span></div>
          <div className="cb-pair"><b>{team.own}</b><i>{team.ownTitle}</i>
            <span className="co-sep">·</span>
            <b style={{ color: team.c }}>{team.ai}</b><span className="corp-ai">AI</span></div>
        </div>
        <div className="cb-kpi">
          {team.kpis ? null : null}
          <div><b>{team.head} / {team.cap}</b><span>자리</span></div>
          <div><b>{team.pages.length}</b><span>지면</span></div>
        </div>
      </div>

      <div className="cb-tabs">
        {team.pages.map((p, i) => (
          <button key={i} className={"cb-tab" + (i === page ? " on" : "")} onClick={() => setPage(i)}>
            {p.t}
            {p.kind === "new" && <em className="cb-soon">{p.at}</em>}
            {p.kind === "mod" && <em className="cb-mod">신설</em>}
            {p.kind === "tab" && <em className="cb-live">기존</em>}
            {p.kind === "nav" && <em className="cb-out">이동</em>}
          </button>
        ))}
      </div>
      {pg && pg.note && <div className="cb-note">{pg.note}</div>}

      <div className="cb-body">
        {pg && pg.kind === "new" && (
          <div className="cb-soonbox">
            <div className="cb-st">{pg.t}</div>
            <p>이 지면은 <b>{pg.at}</b>에서 만듭니다. 지금은 자리만 잡혀 있습니다 —
              데이터가 없는데 숫자를 채우면 그게 먼저 깨집니다.</p>
          </div>
        )}
        {pg && pg.kind === "mod" && (
          Render ? <div className="cb-mod-body"><Render onGo={onGo} onTab={onTab} team={team.id} /></div> : (
            <div className="cb-soonbox">
              <div className="cb-st">{pg.t}</div>
              <p>이 지면의 컴포넌트({pg.comp})를 찾지 못했습니다 — 번들 적재 순서를 확인해야 합니다.</p>
            </div>
          )
        )}
        {pg && pg.kind === "nav" && (
          <div className="cb-soonbox">
            <div className="cb-st">{pg.t}</div>
            <p>이 지면은 회사 총괄운영 밖에 있습니다. 같은 화면을 두 벌로 만들지 않고 그대로 씁니다.</p>
            <button className="corp-btn on" onClick={() => typeof onGo === "function" && onGo(pg.nav)}>
              {pg.t} 열기 →</button>
          </div>
        )}
        {pg && pg.kind === "tab" && (
          Render ? (
            <div className="cb-embed">
              <div className="cb-embedbar">같은 컴포넌트를 그대로 부릅니다 — 복제본이 아닙니다
                <button className="cb-jump" onClick={() => typeof onTab === "function" && onTab(pg.tab)}>
                  기존 탭에서 보기 →</button></div>
              <Render onGo={onGo} onTab={onTab} />
            </div>
          ) : (
            <div className="cb-soonbox">
              <div className="cb-st">{pg.t}</div>
              <p>이 지면은 온톨로지·하네스 상단 탭에 그대로 있습니다. 복제하지 않고 그 탭으로 보냅니다.</p>
              <button className="corp-btn on" onClick={() => typeof onTab === "function" && onTab(pg.tab)}>
                {pg.t} 탭 열기 →</button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* 기존 지면 컴포넌트 — 이름으로 전역 함수를 잇는다(복제 아님).
   eval·window 조회를 쓰지 않는다 — 번들이 모듈 스코프라 둘 다 불안정하다.
   전부 함수 선언이라 호이스팅되므로 렌더 시점 조회로 충분하다. */
function corpPageComp(name) {
  try {
    if (name === "BizOpsConsole") return typeof BizOpsConsole === "function" ? BizOpsConsole : null;
    if (name === "SupplyOntology") return typeof SupplyOntology === "function" ? SupplyOntology : null;
    if (name === "FinanceSection") return typeof FinanceSection === "function" ? FinanceSection : null;
    if (name === "CorpLedgerSection") return typeof CorpLedgerSection === "function" ? CorpLedgerSection : null;
    if (name === "CorpPlanActualSection") return typeof CorpPlanActualSection === "function" ? CorpPlanActualSection : null;
    if (name === "CorpHrSection") return typeof CorpHrSection === "function" ? CorpHrSection : null;
    if (name === "CorpDocsSection") return typeof CorpDocsSection === "function" ? CorpDocsSection : null;
    if (name === "CorpContractSection") return typeof CorpContractSection === "function" ? CorpContractSection : null;
    if (name === "CorpReleaseSection") return typeof CorpReleaseSection === "function" ? CorpReleaseSection : null;
    if (name === "CorpSecuritySection") return typeof CorpSecuritySection === "function" ? CorpSecuritySection : null;
    if (name === "CorpVaultSection") return typeof CorpVaultSection === "function" ? CorpVaultSection : null;
    if (name === "MarketingSection") return typeof MarketingSection === "function" ? MarketingSection : null;
    if (name === "DataOpsConsole") return typeof DataOpsConsole === "function" ? DataOpsConsole : null;
    if (name === "FoundationOntology") return typeof FoundationOntology === "function" ? FoundationOntology : null;
    if (name === "OpsConsoleSection") return typeof OpsConsoleSection === "function" ? OpsConsoleSection : null;
  } catch (e) { return null; }
  return null;
}
