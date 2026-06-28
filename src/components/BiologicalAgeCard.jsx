function BiologicalAgeCard({ member }) {
  const organs = [["생체나이", member.biologicalAge, true], ["비만나이", member.obesityAge], ["심장나이", member.heartAge], ["간나이", member.liverAge], ["췌장나이", member.pancreasAge], ["신장나이", member.kidneyAge]];
  return (
    <div className="card">
      <div className="rct"><Activity size={18} color="#7C3AED" /> 생체나이 분석</div>
      <div className="demoorgans">{organs.map(([t, v, main]) => (
        <div className={`dorg ${main ? "main" : ""}`} key={t}><div className="ot">{t}</div><div className="ov">{v}<span>세</span></div>
          <div className="obar"><span style={{ width: Math.max(8, Math.min(100, (v - 30) / 60 * 100)) + "%", background: main ? "#2563EB" : (v > member.biologicalAge ? "#EF4444" : "#16A34A") }} /></div></div>
      ))}</div>
    </div>
  );
}
