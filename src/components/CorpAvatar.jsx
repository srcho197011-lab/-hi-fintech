/* ══════════════ AI 팀장 아바타 렌더(CorpAvatar.jsx) · CorpOps Phase 2 (조성래님 지시 2026-11-11) ══════════════
   corpAvatars.js의 문양 명세를 SVG로 그린다. 상태는 테두리로만 말한다.
   ⚠️ AI임이 분명해야 한다 — 이 컴포넌트는 항상 AI 배지와 함께 쓰고, 사람 책임자는 글자로 적는다.
      사람 자리에 이 아바타를 쓰지 않는다(그러면 사람과 AI가 같은 모양이 된다). */

function CorpAvatar({ ai, size, state, title }) {
  const av = typeof corpAvatar === "function" ? corpAvatar(ai) : null;
  if (!av) return null;
  const S = (typeof CORP_AV_STATE !== "undefined" && CORP_AV_STATE[state || "idle"]) || { ring: "#2E2E37", w: 1.5, dash: "", pulse: false };
  const px = size || 96;
  const ring = S.ring || av.c;

  return (
    <svg className={"corp-av" + (S.pulse ? " pulse" : "")} width={px} height={px} viewBox="0 0 96 96"
      role="img" aria-label={(title || ai) + " 아바타"}>
      <circle cx="48" cy="48" r="45" fill="none" stroke={ring} strokeWidth={S.w} strokeDasharray={S.dash || undefined} />
      {state === "wait" && <circle cx="48" cy="48" r="38" fill="none" stroke={ring} strokeWidth="1" opacity=".4" />}
      <g stroke={av.c} fill={av.c} strokeLinecap="round" strokeLinejoin="round">
        {av.s.map((e, i) => {
          const o = e.o === undefined ? 1 : e.o;
          if (e.k === "line") return <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} strokeWidth={e.w} opacity={o} fill="none" />;
          if (e.k === "circle") return <circle key={i} cx={e.cx} cy={e.cy} r={e.r}
            fill={e.f ? av.c : "none"} stroke={e.f ? "none" : av.c} strokeWidth={e.w || 1}
            strokeDasharray={e.d || undefined} opacity={o} />;
          if (e.k === "path") return <path key={i} d={e.d} fill="none" strokeWidth={e.w} opacity={o} />;
          if (e.k === "poly") return <polygon key={i} points={e.p} fill="none" strokeWidth={e.w} opacity={o} />;
          if (e.k === "rect") return <rect key={i} x={e.x} y={e.y} width={e.w2} height={e.h} rx={e.rx}
            fill="none" strokeWidth={e.w} opacity={o} />;
          return null;
        })}
      </g>
    </svg>
  );
}

/* 사람 책임자 · AI 팀장을 한 줄로 — 둘을 같은 모양으로 쓰지 않는다 */
function CorpPair({ team, size }) {
  if (!team) return null;
  return (
    <div className="corp-pair">
      <div className="cp-human">
        <span className="cp-k">사람 책임자</span>
        <b>{team.own}</b><i>{team.ownTitle}</i>
      </div>
      <div className="cp-div" />
      <div className="cp-ai">
        <CorpAvatar ai={team.ai} size={size || 34} title={team.ai} />
        <span className="cp-k">AI 팀장</span>
        <b style={{ color: team.c }}>{team.ai}</b>
        <span className="corp-ai">AI</span>
      </div>
    </div>
  );
}
