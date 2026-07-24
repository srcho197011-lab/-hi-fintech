/* 체험 회원 로그인 시 각 섹션 상단에 표시되는 개인 건강요약 배너 */
function DemoMemberBanner() {
  let m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  if (!m) return null;
  m = (typeof lineageMember === "function") ? lineageMember(m) : m;   // M1-1: 금고 실검진값 기반 보정
  const cg = demoCancerGrade(m.cancerRiskGrade);
  // 초개인화: 회원이 직접 제공한 데이터가 연결되면 출처 라벨 표시
  let src = null, integ = null; try { const v = (typeof vaultLoad === "function" && typeof anonToken === "function") ? vaultLoad(anonToken(m)) : null; const ck = v && v.checkups && v.checkups[v.checkups.length - 1]; if (ck) { const y = (ck.date || "2025").slice(0, 4); src = (ck.channel === "nhis" ? `내 ${y}년 국가검진(공단연계·부분)` : ck.channel === "photo" ? `내 ${y}년 검진결과(촬영)` : `내 ${y}년 국가검진 기준`); integ = (typeof verifyVaultIntegrity === "function") ? verifyVaultIntegrity(m) : null; } } catch (e) {}
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const items = [
    ["생체나이", m.biologicalAge + "세", null],
    ["간/췌장 나이", m.liverAge + "/" + m.pancreasAge + "세", null],
    ["암위험", m.cancerRiskGrade + "등급 · " + cg[0], cg[1]],
    ["고위험 암", (m.highRiskCancerTypes || []).join("·") || "-", null],
    ["금년 의료비", fmt(m.estimatedMedicalCost), null],
    ["10년 후 의료비", fmt(demoCostForecast(m.estimatedMedicalCost)), "#EF4444"],
  ];
  return (
    <div className="demoband">
      <div className="dbh"><span className="pa">{m.name[0]}</span>
        <div className="dbt"><b>{m.name}님 맞춤 건강요약</b><span>{src ? "회원이 직접 연결한 데이터로 분석했어요." : "로그인한 체험 회원 데이터가 이 섹션에 반영됩니다."}</span></div>
        {src ? <span className="dbsrc"><ShieldCheck size={12} /> {src}{integ && integ.ok ? " · 위변조 없음 ✓" : ""}</span> : <span className="demobadge"><AlertTriangle size={12} /> 시연용 예시 데이터</span>}</div>
      <div className="dbgrid">{items.map(([l, v, c]) => <div className="dbi" key={l}><span>{l}</span><b style={c ? { color: c } : null}>{v}</b></div>)}</div>
    </div>
  );
}
