/* ══════════════ 회사 총괄운영 — 총괄 대시보드(CorpOps.jsx) · Phase 1 (형 지시 2026-11-11) ══════════════
   화면: 다크 콕핏 3단 — 좌(지표) · 중앙(조직 온톨로지 · 원근 회전) · 우(사람이 결정할 것 · 루틴).
   ⚠️ 원칙:
     · 실데이터가 붙기 전에는 지표를 「미연결」로 둔다 — 숫자를 지어내지 않는다(Phase 10에서 연결).
     · 「자동 실행」이라 쓰지 않는다 — 백엔드가 없어 브라우저가 닫히면 아무것도 돌지 않는다.
       루틴의 실체는 「예약 — 다음 열람 시」다.
     · 사람과 AI를 같은 모양으로 쓰지 않는다 — AI에는 AI 배지가 붙는다.
     · 좌표·점은 corpOrg.js의 고정 시드 산출물을 읽는다 — 이 파일에 Math.random을 두지 않는다.
   원천: src/data/corpOrg.js(조직·일정 단일 소스) */

function CorpOps({ onGo }) {
  const wrapRef = React.useRef(null);
  const svgRef = React.useRef(null);
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

    const onMove = (e) => {
      const g = e.target.closest ? e.target.closest("g[data-id]") : null;
      st.current.hover = g ? g.dataset.id : null;
    };
    const onLeave = () => { st.current.hover = null; };
    const onClick = (e) => { const g = e.target.closest ? e.target.closest("g[data-id]") : null; pick(g ? g.dataset.id : null); };
    const onResize = () => measure();

    measure();
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseleave", onLeave);
    svg.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("mouseleave", onLeave);
      svg.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, [pick]);

  const selT = sel ? corpTeam(sel) : null;
  const sch = CORP_SCHEDULE;

  return (
    <div className="corpops" ref={wrapRef}>
      <div className="corp-top">
        <div className="corp-logo">회사 <span>총괄운영</span></div>
        <div className="corp-tag">사람 책임자 + AI 팀장</div>
        <div className="corp-sp" />
        <div className="corp-stub">Phase 1 — 실데이터 미연결 · 지표는 연결 후 채워집니다</div>
      </div>

      <div className="corp-shell">
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
            <div className="corp-row"><span className="m">현재</span><span className="s"><b>{CORP_SUMMARY.head}</b> / 정원 {CORP_SUMMARY.cap}</span></div>
            <div className="corp-note">합류 전 자리는 0으로 둡니다 — 없는 인원을 있는 것처럼 세지 않습니다.</div>
          </div>
        </div>

        {/* ── 중앙 ── */}
        <div className="corp-col corp-C">
          <svg ref={svgRef} className="corp-stage" />
          <div className="corp-cap">
            <h3>조직 온톨로지</h3>
            <p>원 = 팀 · 원 안은 <b>사람 책임자 · AI 팀장</b> · 선 = 팀 사이 업무 흐름<br />
              원근 회전 — 앞은 크고 밝게, 뒤는 작고 흐리게. 원을 누르면 그 팀이 정면으로 옵니다.</p>
          </div>
          {selT && (
            <div className="corp-selbox">
              <div className="sx">
                <span className="sdot" style={{ background: selT.c }} />
                <span className="sid">{selT.id}</span>
                <span className="sname">{selT.name}</span>
                <span className="sgrp">{(corpDiv(selT.div) || {}).name}</span>
                <button className="sclose" onClick={() => pick(selT.id)}>닫기</button>
              </div>
              <div className="sy">
                <div className="sp"><span className="pk">사람 책임자</span><b>{selT.own}</b><i>{selT.ownTitle}</i></div>
                <div className="pdiv" />
                <div className="sp"><span className="pk">AI 팀장</span><b style={{ color: selT.c }}>{selT.ai}</b><span className="corp-ai">AI</span></div>
                <div className="pdiv" />
                <div className="sp"><span className="pk">인원</span><b>{selT.head} / {selT.cap}</b><i>{selT.joined}</i></div>
              </div>
              <div className="sw">{selT.work}</div>
              <div className="sv">
                <div><span className="vk ok">{selT.ai}가 하는 일</span>{selT.can.join(" · ")}</div>
                <div><span className="vk no">사람이 마무리</span>{selT.cannot.join(" · ")}</div>
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
              <div className="ti">주간 업무회의 <span className="corp-pill wait">자료 미생성</span></div>
              <div className="by">{sch.weekly.mode} · 사람 {sch.weekly.joinPeople} + AI 팀장 {sch.weekly.joinAgents}</div>
              <div className="ds">금요일에 각 AI 팀장이 주간보고 초안을 만들고, 팀 책임자가 확정하면 월 09:30에 <b>나침반</b>이 1부로 통합합니다.</div>
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
            {sch.routines.slice(0, 6).map((r, i) => (
              <div key={i} className="corp-rt">
                <span className="nm">{r[0]}</span>
                <span className="corp-pill wait">예약</span>
                <span className="w">{r[1]}</span>
              </div>
            ))}
            <div className="corp-note">브라우저가 닫혀 있으면 돌지 않습니다 — 「예약」은 <b>다음 열람 시 점검</b>이라는 뜻입니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
