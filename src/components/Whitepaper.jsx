/* ====================== 백서(White Paper) 관리·열람 — 온톨로지 운영 콘솔 [백서] 탭 ======================
   whitepaper.js(WHITEPAPER/WP_META/WP_STATUS/WP_PHASES)를 장별로 렌더·관리한다.
   진도 대시보드 · 4단계 로드맵 · 목차(상태badge) · 장 리더(본문 블록/출처/규제구분). */

function WpBadge({ st, small }) {
  const s = WP_STATUS[st] || WP_STATUS.planned;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, fontWeight: 800, fontSize: small ? 11 : 12, padding: small ? "2px 8px" : "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: small ? 10 : 11 }}>{s.ic}</span>{s.label}
    </span>
  );
}

/* 굵게(**..**) 라이트 파서 */
function WpRich({ x }) {
  const parts = String(x).split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**") ? <b key={i} style={{ color: "#0F1F45" }}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>)}</>;
}

/* 본문 블록 렌더 */
function WpBlock({ b }) {
  if (b.t === "h") return <div style={{ fontSize: 16, fontWeight: 900, color: "#12203F", margin: "18px 0 8px", letterSpacing: -0.2 }}>{b.x}</div>;
  if (b.t === "p") return <p style={{ fontSize: 14, lineHeight: 1.8, color: "#374151", margin: "0 0 10px" }}><WpRich x={b.x} /></p>;
  if (b.t === "list") return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 4, listStyle: "none" }}>
      {b.items.map((it, i) => <li key={i} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.7, color: "#374151", marginBottom: 6 }}><span style={{ color: "#2563EB", fontWeight: 900, flexShrink: 0 }}>▸</span><span><WpRich x={it} /></span></li>)}
    </ul>
  );
  if (b.t === "note") return (
    <div style={{ background: "linear-gradient(135deg,#EFF6FF,#F0FDFA)", border: "1px solid #BFDBFE", borderLeft: "4px solid #2563EB", borderRadius: 12, padding: "13px 16px", margin: "12px 0", fontSize: 13.5, lineHeight: 1.75, color: "#1E3A5F" }}>
      <b style={{ color: "#1D4ED8" }}>📌 </b><WpRich x={b.x} />
    </div>
  );
  if (b.t === "quote") return <blockquote style={{ borderLeft: "3px solid #A78BFA", margin: "12px 0", padding: "4px 0 4px 14px", color: "#4C1D95", fontStyle: "italic", fontSize: 14 }}>“{b.x}”{b.by ? <span style={{ display: "block", fontSize: 12, color: "#7C3AED", marginTop: 4 }}>— {b.by}</span> : null}</blockquote>;
  if (b.t === "kv") return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
        <thead><tr>{b.head.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "9px 12px", background: "#12203F", color: "#fff", fontWeight: 800, fontSize: 12.5, borderRight: i < b.head.length - 1 ? "1px solid #2A3A5E" : "none" }}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, ri) => <tr key={ri} style={{ background: ri % 2 ? "#F8FAFC" : "#fff" }}>{r.map((c, ci) => <td key={ci} style={{ padding: "9px 12px", borderBottom: "1px solid #E5E7EB", color: ci === 0 ? "#12203F" : "#374151", fontWeight: ci === 0 ? 800 : 500, borderRight: "1px solid #EEF2F7" }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  if (b.t === "legal") return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
      <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontWeight: 900, color: "#047857", fontSize: 13, marginBottom: 8 }}>✅ 현행법상 가능</div>
        {b.now.map((it, i) => <div key={i} style={{ fontSize: 12.5, color: "#065F46", lineHeight: 1.6, marginBottom: 5, display: "flex", gap: 6 }}><span>·</span><span>{it}</span></div>)}
      </div>
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontWeight: 900, color: "#C2410C", fontSize: 13, marginBottom: 8 }}>⚖️ 법·제도 개선 필요</div>
        {b.reform.map((it, i) => <div key={i} style={{ fontSize: 12.5, color: "#9A3412", lineHeight: 1.6, marginBottom: 5, display: "flex", gap: 6 }}><span>·</span><span>{it}</span></div>)}
      </div>
    </div>
  );
  return null;
}

function WhitepaperSection({ onGo }) {
  const [sel, setSel] = useState(1);
  const [showPrin, setShowPrin] = useState(false);
  const [view, setView] = useState("paper"); // paper | refs
  const prog = React.useMemo(() => wpProgress(), []);
  const ch = WHITEPAPER.find((c) => c.no === sel) || WHITEPAPER[0];
  const filled = ch.body && ch.body.length > 0;

  return (
    <div style={{ marginTop: 14 }}>
      {/* ── 백서 헤더 ── */}
      <div style={{ background: "linear-gradient(135deg,#0B2654,#1D4ED8 55%,#0F8A74)", borderRadius: 18, padding: "22px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 0.4, opacity: 0.92, marginBottom: 8 }}>
          <BookOpen size={15} /> WHITE PAPER · {WP_META.code} · {WP_META.version}
        </div>
        <div style={{ fontSize: 23, fontWeight: 900, lineHeight: 1.28, letterSpacing: -0.4 }}>{WP_META.title}</div>
        <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 6 }}>{WP_META.subtitle}</div>
        {WP_META.vision ? (
          <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderLeft: "4px solid #FDE68A", borderRadius: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.3 }}>“{WP_META.vision}”</div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 4 }}>{WP_META.visionSub}</div>
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {WP_META.kinds.map((k, i) => <span key={i} style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.24)", borderRadius: 999, padding: "3px 11px", fontSize: 11.5, fontWeight: 700 }}>{k}</span>)}
        </div>
      </div>

      {/* ── 뷰 토글: 백서 열람 / 반영 로그 / 근거자료실 ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {[["paper", "📖 백서 열람"], ["log", "🗂 반영 로그"], ["refs", "🔎 근거자료실"]].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{ cursor: "pointer", border: "1px solid " + (view === k ? "#1D4ED8" : "#D8DEEA"), background: view === k ? "#1D4ED8" : "#fff", color: view === k ? "#fff" : "#475569", fontWeight: 800, fontSize: 13, padding: "9px 18px", borderRadius: 10 }}>{label}</button>
        ))}
      </div>

      {view === "log" ? <WpChangeLog onGoChapter={(n) => { setSel(n); setView("paper"); }} onGoRefs={() => setView("refs")} /> : null}
      {view === "refs" ? <WpRefLibrary onGoChapter={(n) => { setSel(n); setView("paper"); }} /> : null}
      {view === "paper" ? (
      <React.Fragment>

      {/* ── 진도 대시보드 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 14 }}>
        {[["전체 장", `${prog.total}장`, "#2563EB"], ["검증완료", `${prog.done}장`, "#16A34A"], ["작업중", `${prog.inprog}장`, "#F59E0B"], ["예정", `${prog.planned}장`, "#94A3B8"], ["종합 진행률", `${prog.pct}%`, "#0F8A74"]].map(([t, v, c], i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 700, marginTop: 2 }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 8, background: "#E5E9F0", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${prog.pct}%`, height: "100%", background: "linear-gradient(90deg,#2563EB,#0F8A74)", borderRadius: 999, transition: "width .4s" }} />
      </div>

      {/* ── 핵심 원칙(접기) ── */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginTop: 12 }}>
        <div onClick={() => setShowPrin((v) => !v)} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800, color: "#92400E", fontSize: 13 }}>
          <span>⚖️ 백서 작성 3대 원칙 (참고 설계철학 인용 · 규제구분 · 초안 성격)</span>
          <span>{showPrin ? "▲" : "▼"}</span>
        </div>
        {showPrin && <ol style={{ margin: "10px 0 2px", paddingLeft: 20, color: "#78350F", fontSize: 12.5, lineHeight: 1.7 }}>{WP_META.principles.map((p, i) => <li key={i} style={{ marginBottom: 6 }}>{p}</li>)}</ol>}
      </div>

      {/* ── 4단계 로드맵 ── */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#12203F", marginBottom: 8 }}>📚 편집 로드맵 (4단계)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          {WP_PHASES.map((ph) => (
            <div key={ph.key} style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#1D4ED8" }}>{ph.title}</div>
              <div style={{ fontSize: 11, color: "#6B7280", margin: "3px 0 8px", lineHeight: 1.5 }}>{ph.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {ph.chapters.map((n) => { const c = WHITEPAPER.find((x) => x.no === n); const s = WP_STATUS[c ? c.status : "planned"]; return (
                  <span key={n} onClick={() => setSel(n)} title={c ? c.title : ""} style={{ cursor: "pointer", width: 24, height: 24, borderRadius: 7, background: s.bg, color: s.color, border: sel === n ? "2px solid #1D4ED8" : "1px solid transparent", fontSize: 11, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
                ); })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 목차 + 리더 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, marginTop: 18, alignItems: "start" }} className="wp-grid">
        {/* 목차 */}
        <div style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 14, padding: 8, maxHeight: 620, overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#6B7280", padding: "8px 10px 6px", letterSpacing: 0.3 }}>목차 (24장)</div>
          {WHITEPAPER.map((c) => (
            <div key={c.no} onClick={() => setSel(c.no)} style={{ cursor: "pointer", padding: "9px 10px", borderRadius: 9, marginBottom: 2, background: sel === c.no ? "#EFF6FF" : "transparent", border: sel === c.no ? "1px solid #BFDBFE" : "1px solid transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: sel === c.no ? "#1D4ED8" : "#94A3B8", minWidth: 20 }}>{String(c.no).padStart(2, "0")}</span>
                <span style={{ fontSize: 12.5, fontWeight: sel === c.no ? 800 : 600, color: sel === c.no ? "#12203F" : "#374151", flex: 1, lineHeight: 1.3 }}>{c.title}</span>
              </div>
              <div style={{ marginLeft: 27, marginTop: 4 }}><WpBadge st={c.status} small /></div>
            </div>
          ))}
        </div>

        {/* 리더 */}
        <div style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 14, padding: "22px 26px", minHeight: 400 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1D4ED8", letterSpacing: 0.3 }}>제{ch.no}장 · {ch.part}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><WpBadge st={ch.status} /><span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{ch.version} · {ch.updated}</span></div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0F1F45", margin: "6px 0 4px", letterSpacing: -0.5 }}>{ch.title}</h2>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>{ch.subtitle}</div>

          {/* 섹션 칩 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 14, borderBottom: "1px solid #EEF2F7", marginBottom: 6 }}>
            {ch.sections.map((s, i) => <span key={i} style={{ background: "#F1F5F9", color: "#475569", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>{s}</span>)}
          </div>

          {ch.summary ? <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.7, color: "#334155", margin: "12px 0" }}><b style={{ color: "#0F1F45" }}>요약 · </b>{ch.summary}</div> : null}

          {filled ? (
            <div style={{ marginTop: 4 }}>{ch.body.map((b, i) => <WpBlock key={i} b={b} />)}</div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#64748B" }}>이 장은 아직 작성 전(예정)입니다</div>
              <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>조사 → 작성 → 검토 → 검증 순으로 함께 채워 나갑니다.<br />섹션 구성은 위에 등록되어 있습니다.</div>
            </div>
          )}

          {/* 출처 */}
          {ch.sources && ch.sources.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #EEF2F7" }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#6B7280", marginBottom: 8 }}>📎 출처 · 참고자료</div>
              {ch.sources.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 5, display: "flex", gap: 8 }}>
                  <span style={{ color: "#94A3B8", fontWeight: 800 }}>[{i + 1}]</span>
                  <span><b style={{ color: "#334155" }}>{s.title}</b>{s.org ? ` — ${s.org}` : ""}{s.note ? <span style={{ color: "#F59E0B" }}> · {s.note}</span> : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* 플랫폼 연계 & 확장성 */}
          {WP_NEXUS[ch.no] && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "2px solid #EEF2F7", background: "linear-gradient(180deg,#FBFCFE,#fff)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F1F45", marginBottom: 12 }}>🔗 플랫폼 연계 &amp; 확장성</div>
              <div style={{ display: "grid", gap: 11 }}>
                <div style={{ display: "flex", gap: 9 }}>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#7C3AED", background: "#EDE9FE", padding: "3px 9px", borderRadius: 7, height: "fit-content" }}>확장성</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{WP_NEXUS[ch.no].ex}</span>
                </div>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#1D4ED8", background: "#DBEAFE", padding: "3px 9px", borderRadius: 7, height: "fit-content" }}>관련 섹션</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {WP_NEXUS[ch.no].sec.map((k) => { const s = (typeof SECTIONS !== "undefined" ? SECTIONS : []).find((x) => x.k === k); const label = s ? s.t : k; return (
                      <span key={k} onClick={() => onGo && onGo(k)} title={`${label} 화면으로 이동`} style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "4px 11px", borderRadius: 999 }}>{label} ↗</span>
                    ); })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 9 }}>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#0F8A74", background: "#D1FAE5", padding: "3px 9px", borderRadius: 7, height: "fit-content" }}>실행 참조</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{WP_NEXUS[ch.no].impl}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chnote" style={{ marginTop: 14 }}>※ 본 백서는 <b>온톨로지 운영 콘솔에서 장별로 조사·작성·검증하며 계속 업그레이드</b>됩니다. Palantir Ontology·Claude Harness는 참고한 설계철학으로 인용하며 HI-Fin Tech 자체 아키텍처로 재구성합니다. 의료·금융·토큰 사항은 현행법 가능 영역과 제도개선 필요 영역을 구분하며, 본 문서는 초안으로 전문가 법률 검토를 전제로 합니다.</div>
      </React.Fragment>
      ) : null}
    </div>
  );
}

/* ── 백서 반영 로그(변경 이력표) — 플랫폼 변경 → 백서 반영 기록·백업 ── */
function WpChangeLog({ onGoChapter, onGoRefs }) {
  const [ver, setVer] = useState("all");
  const [reload, setReload] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [f, setF] = useState({ feat: "", ch: "", src: "", summary: "" });
  const log = React.useMemo(() => (typeof wpLogAll === "function" ? wpLogAll() : []).slice().sort((a, b) => (b.date + b.ver).localeCompare(a.date + a.ver)), [reload]);
  const rel = React.useMemo(() => (typeof wpChapterSources === "function" ? wpChapterSources() : []), [reload]);
  const vers = ["all"].concat([...new Set(log.map((e) => e.ver))]);
  const rows = ver === "all" ? log : log.filter((e) => e.ver === ver);
  const reflected = log.filter((e) => e.status === "반영").length;
  const chCovered = new Set(log.flatMap((e) => e.ch || [])).size;
  const srcCount = rel.reduce((s, c) => s + c.sources.length, 0);

  const download = (name, text, mime) => { try { const blob = new Blob(["﻿" + text], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000); } catch (e) { if (typeof toast === "function") toast("내보내기를 지원하지 않는 환경입니다."); } };
  const esc = (s) => { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const exportCSV = () => { const head = ["일시", "버전", "챕터", "플랫폼 기능", "반영 내용", "근거", "상태", "출처", "커밋"]; const lines = log.map((e) => [e.date, e.ver, (e.ch || []).map((n) => "제" + n + "장").join(" "), e.feat, e.summary, (e.refs || []).join("·"), e.status, e.auto ? "자동(커밋)" : "수동", e.hash || ""].map(esc).join(",")); download("백서_반영로그.csv", [head.join(","), ...lines].join("\n"), "text/csv;charset=utf-8"); };
  const exportJSON = () => download("백서_반영로그.json", JSON.stringify(log, null, 2), "application/json;charset=utf-8");
  const addEntry = () => {
    if (!f.feat.trim() || !f.summary.trim()) { if (typeof toast === "function") toast("플랫폼 기능과 반영 내용을 입력하세요."); return; }
    const stamp = (() => { try { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; } catch (e) { return "2026-07-12"; } })();
    const ch = f.ch.split(/[,\s]+/).map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));
    if (typeof wpLogAppend === "function") wpLogAppend({ date: stamp, ver: "v1.1+", ch, feat: f.feat.trim(), src: f.src.trim() || "플랫폼", summary: f.summary.trim(), refs: [], status: "반영" });
    setF({ feat: "", ch: "", src: "", summary: "" }); setAddOpen(false); setReload((v) => v + 1); if (typeof toast === "function") toast("✅ 반영 로그에 기록되었습니다.");
  };
  const stC = (s) => s === "반영" ? { c: "#16A34A", bg: "#E7F8EE" } : s === "초판" ? { c: "#2563EB", bg: "#E8F1FE" } : { c: "#B45309", bg: "#FEF3E2" };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ background: "#F8FAFC", border: "1px solid #E5E9F0", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#0F1F45" }}>🗂 백서 반영 로그 · 변경 이력표</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={exportCSV} style={btnS(false)}>⬇ CSV</button>
            <button onClick={exportJSON} style={btnS(false)}>⬇ JSON</button>
            <button onClick={() => setAddOpen((v) => !v)} style={btnS(addOpen)}>＋ 기록 추가</button>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: "#5A6B86", margin: "8px 0 0", lineHeight: 1.6 }}>플랫폼 기능이 백서에 반영될 때마다 한 줄씩 기록됩니다. <b style={{ color: "#7C3AED" }}>⚙ 자동</b> 표시는 <b>커밋(=배포) 시 <code>WP-Log:</code> 트레일러에서 파이프라인이 자동 기록</b>한 항목이며, 커밋 해시가 함께 남아 추적됩니다. <b>챕터에 추가된 근거자료는 근거자료실에 자동 반영</b>되고, 로그는 <b>백업(CSV·JSON)</b>으로 내보내 피드백·감사에 활용합니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 12 }}>
          {[["반영 기록", reflected + "건", "#16A34A"], ["백서 버전", (log[0] || {}).ver || "v1.1", "#2563EB"], ["반영 챕터", chCovered + "장", "#7C3AED"], ["연동 근거자료", srcCount + "건", "#0F8A74"]].map(([t, v, c], i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 11, padding: "11px 13px" }}><div style={{ fontSize: 18, fontWeight: 900, color: c }}>{v}</div><div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, marginTop: 2 }}>{t}</div></div>
          ))}
        </div>
        {addOpen && <div style={{ background: "#fff", border: "1px solid #D8DEEA", borderRadius: 11, padding: 12, marginTop: 10, display: "grid", gap: 7 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 7 }}>
            <input value={f.feat} onChange={(e) => setF({ ...f, feat: e.target.value })} placeholder="플랫폼 기능 (예: 청구지원 워크플로)" style={inS} />
            <input value={f.ch} onChange={(e) => setF({ ...f, ch: e.target.value })} placeholder="챕터 (예: 15)" style={inS} />
          </div>
          <input value={f.src} onChange={(e) => setF({ ...f, src: e.target.value })} placeholder="위치 (예: 치료비 케어 › 보험금청구)" style={inS} />
          <input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="반영 내용 요약" style={inS} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={addEntry} style={{ ...btnS(true), padding: "8px 16px" }}>기록</button></div>
        </div>}
      </div>

      {/* 버전 필터 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {vers.map((v) => <span key={v} onClick={() => setVer(v)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 999, background: ver === v ? "#1D4ED8" : "#EEF2F7", color: ver === v ? "#fff" : "#475569", border: "1px solid " + (ver === v ? "transparent" : "#E5E9F0") }}>{v === "all" ? "전체" : v}</span>)}
      </div>

      {/* 로그 테이블 */}
      <div style={{ overflowX: "auto", border: "1px solid #E5E9F0", borderRadius: 12, marginTop: 10, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>
          <thead><tr style={{ background: "#F4F7FB" }}>{["일시", "버전", "챕터", "플랫폼 기능", "반영 내용", "상태"].map((h) => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((e, i) => { const s = stC(e.status); return (
            <tr key={i} style={{ borderTop: "1px solid #EEF1F8" }}>
              <td style={{ ...tdS, whiteSpace: "nowrap", fontFamily: "ui-monospace,Menlo,monospace", color: "#64748B" }}>{e.date}</td>
              <td style={{ ...tdS, whiteSpace: "nowrap", fontWeight: 800 }}>{e.ver}</td>
              <td style={tdS}>{(e.ch || []).length ? (e.ch || []).map((n) => <span key={n} onClick={() => onGoChapter && onGoChapter(n)} style={{ cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 7px", borderRadius: 6, marginRight: 4, display: "inline-block" }}>제{n}장</span>) : <span style={{ color: "#94A3B8" }}>—</span>}</td>
              <td style={{ ...tdS, fontWeight: 700, color: "#12203F" }}>{e.feat}{e.auto ? <span title={"커밋 " + (e.hash || "")} style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "#7C3AED", background: "#F1EBFB", padding: "1px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>⚙ 자동{e.hash ? " " + e.hash : ""}</span> : null}</td>
              <td style={{ ...tdS, color: "#475569" }}>{e.summary}{e.refs && e.refs.length ? <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "#0F8A74" }}>근거: {e.refs.join(" · ")}</span> : null}</td>
              <td style={tdS}><span style={{ fontSize: 11, fontWeight: 800, color: s.c, background: s.bg, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{e.status}</span></td>
            </tr>
          ); })}</tbody>
        </table>
      </div>

      {/* 백서 ↔ 근거자료 관계 */}
      <div style={{ marginTop: 20, marginBottom: 6, fontSize: 14, fontWeight: 900, color: "#0F1F45", display: "flex", alignItems: "center", gap: 8 }}>🔗 백서 ↔ 근거자료 관계 <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6B7280" }}>챕터별 근거 · 클릭 시 이동</span></div>
      <div style={{ display: "grid", gap: 8 }}>{rel.map((c) => (
        <div key={c.no} style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 11, padding: "11px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span onClick={() => onGoChapter && onGoChapter(c.no)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 800, color: "#1D4ED8" }}>제{c.no}장 {c.title}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0F8A74", background: "#E7F6F1", padding: "2px 8px", borderRadius: 999 }}>{c.ver}</span>
            <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>근거 {c.sources.length}건</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>{c.sources.map((s, i) => <span key={i} onClick={onGoRefs} title={s.org} style={{ cursor: "pointer", fontSize: 11, color: "#475569", background: "#F1F5F9", border: "1px solid #E5E9F0", borderRadius: 7, padding: "3px 8px" }}>{s.title.length > 42 ? s.title.slice(0, 42) + "…" : s.title}</span>)}</div>
        </div>
      ))}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, lineHeight: 1.6 }}>※ 챕터에 근거자료를 추가하면 <b onClick={onGoRefs} style={{ cursor: "pointer", color: "#0F8A74" }}>근거자료실</b>에 자동 반영됩니다. 반영 로그는 로컬(브라우저)에 저장되며 CSV·JSON으로 백업할 수 있습니다.</div>
    </div>
  );
}
function btnS(on) { return { cursor: "pointer", fontSize: 11.5, fontWeight: 800, color: on ? "#fff" : "#475569", background: on ? "#1D4ED8" : "#fff", border: "1px solid " + (on ? "transparent" : "#D8DEEA"), borderRadius: 8, padding: "6px 11px" }; }
const thS = { fontSize: 11, color: "#64748B", fontWeight: 700, textAlign: "left", padding: "9px 11px", whiteSpace: "nowrap" };
const tdS = { padding: "9px 11px", verticalAlign: "top", color: "#334155", lineHeight: 1.5 };
const inS = { border: "1px solid #D8DEEA", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: "#334155", outline: "none", width: "100%" };

/* ── 근거자료실(Evidence Library) — 법령·통계·표준 검색 ── */
function WpRefLibrary({ onGoChapter }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const stats = React.useMemo(() => wpRefStats(), []);
  const results = React.useMemo(() => wpSearchRefs(q, cat), [q, cat]);
  const catList = [["all", "전체", stats.total]].concat(Object.keys(WP_REF_CATS).map((k) => [k, WP_REF_CATS[k].label, (stats.byCat.find((b) => b.k === k) || {}).n || 0]));

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ background: "#F8FAFC", border: "1px solid #E5E9F0", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#0F1F45" }}>🔎 근거자료실 · 법령 · 통계 · 표준</div>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700 }}>전체 {stats.total}건 · 검증완료 <b style={{ color: "#16A34A" }}>{stats.done}</b>건</div>
        </div>

        {/* 검색 입력 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #D8DEEA", borderRadius: 10, padding: "9px 13px" }}>
          <Search size={16} color="#94A3B8" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="법령·기관·키워드 검색 (예: 마이데이터, FHIR, GDPR, 보장률)" style={{ border: "none", outline: "none", flex: 1, fontSize: 13.5, color: "#334155", background: "transparent" }} />
          {q ? <span onClick={() => setQ("")} style={{ cursor: "pointer", color: "#94A3B8", fontSize: 16 }}>×</span> : null}
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {catList.map(([k, label, n]) => {
            const c = WP_REF_CATS[k];
            const on = cat === k;
            return <span key={k} onClick={() => setCat(k)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 999, background: on ? (c ? c.color : "#1D4ED8") : (c ? c.bg : "#EEF2F7"), color: on ? "#fff" : (c ? c.color : "#475569"), border: "1px solid " + (on ? "transparent" : "#E5E9F0") }}>{label} {n}</span>;
          })}
        </div>
      </div>

      {/* 결과 목록 */}
      <div style={{ marginTop: 12 }}>
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: 14 }}>검색 결과가 없습니다.</div>
        ) : results.map((r) => {
          const c = WP_REF_CATS[r.cat] || WP_REF_CATS.cite;
          return (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #E5E9F0", borderRadius: 12, padding: "13px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 900, color: c.color, background: c.bg, padding: "3px 9px", borderRadius: 7 }}>{c.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#12203F", lineHeight: 1.5 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{r.org}{r.year ? ` · ${r.year}` : ""}{r.note ? <span style={{ color: r.status === "done" ? "#16A34A" : "#F59E0B" }}> · {r.status === "done" ? "검증완료" : r.note}</span> : ""}</div>
                  {r.tags && r.tags.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>{r.tags.map((t, i) => <span key={i} style={{ fontSize: 10.5, color: "#64748B", background: "#F1F5F9", padding: "2px 7px", borderRadius: 6 }}>#{t}</span>)}</div> : null}
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  {r.ch && r.ch.length ? <span onClick={() => onGoChapter && onGoChapter(r.ch[0])} title={`제${r.ch[0]}장으로 이동`} style={{ cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1D4ED8", background: "#EFF6FF", padding: "3px 8px", borderRadius: 6 }}>제{r.ch[0]}장</span> : null}
                  {r.url ? <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: "#0F8A74", textDecoration: "none" }}>원문 ↗</a> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chnote" style={{ marginTop: 12 }}>※ 근거자료실은 <b>장별 인용출처(검증완료)</b>와 <b>핵심 법령·표준 카탈로그</b>를 함께 검색합니다. 카탈로그 항목은 해당 장 작성 시 원문·최신개정을 검증해 <b>검증완료</b>로 승격됩니다. 법령 원문은 국가법령정보센터, 통계는 발행기관 원자료를 우선합니다.</div>
    </div>
  );
}
