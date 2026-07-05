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

function WhitepaperSection() {
  const [sel, setSel] = useState(1);
  const [showPrin, setShowPrin] = useState(false);
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {WP_META.kinds.map((k, i) => <span key={i} style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.24)", borderRadius: 999, padding: "3px 11px", fontSize: 11.5, fontWeight: 700 }}>{k}</span>)}
        </div>
      </div>

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
        </div>
      </div>

      <div className="chnote" style={{ marginTop: 14 }}>※ 본 백서는 <b>온톨로지 운영 콘솔에서 장별로 조사·작성·검증하며 계속 업그레이드</b>됩니다. Palantir Ontology·Claude Harness는 참고한 설계철학으로 인용하며 HI-Fin Tech 자체 아키텍처로 재구성합니다. 의료·금융·토큰 사항은 현행법 가능 영역과 제도개선 필요 영역을 구분하며, 본 문서는 초안으로 전문가 법률 검토를 전제로 합니다.</div>
    </div>
  );
}
