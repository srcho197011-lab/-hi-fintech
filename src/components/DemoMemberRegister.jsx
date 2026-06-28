function DemoMemberRegister({ onLogin, onGoLogin, onChange }) {
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  const fmt = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const registered = demoRegistered();
  const list = demoListAll();
  const doRegister = () => { const r = demoRegisterAll(); setTick((t) => t + 1); onChange && onChange(); setMsg(r.added === 0 ? "이미 등록된 데모 회원은 제외하고 신규 회원만 등록했습니다." : (r.skipped > 0 ? `이미 등록된 데모 회원은 제외하고 신규 ${r.added}명만 등록했습니다.` : `데모 회원 ${r.added}명이 등록되었습니다.`)); };
  const exportDemo = (kind) => {
    const data = registered.length ? registered : list;
    let content, ext, mime;
    if (kind === "json") { content = JSON.stringify(data, null, 2); ext = "json"; mime = "application/json;charset=utf-8"; }
    else { const head = ["id", "name", "email", "biologicalAge", "cancerRiskGrade", "estimatedMedicalCost", "highRiskCancerTypes", "managementPoints"]; const esc = (v) => `"${String(v).replace(/"/g, '""')}"`; const rows = data.map((m) => [m.id, m.name, m.email, m.biologicalAge, m.cancerRiskGrade, m.estimatedMedicalCost, (m.highRiskCancerTypes || []).join("|"), (m.managementPoints || []).join("|")]); content = "﻿" + [head].concat(rows).map((r) => r.map(esc).join(",")).join("\r\n"); ext = "csv"; mime = "text/csv;charset=utf-8"; }
    try { const b = new Blob([content], { type: mime }); const url = URL.createObjectURL(b); const a = document.createElement("a"); a.href = url; a.download = `demo_members.${ext}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1500); toast(`데모 회원을 ${ext.toUpperCase()}로 내보냈습니다.`); } catch (e) { toast("내보내기에 실패했습니다."); }
  };
  const statSrc = registered.length ? registered : list;
  const avgBio = statSrc.length ? (statSrc.reduce((s, m) => s + m.biologicalAge, 0) / statSrc.length).toFixed(1) : "0";
  const avgCancer = statSrc.length ? (statSrc.reduce((s, m) => s + m.cancerRiskGrade, 0) / statSrc.length).toFixed(1) : "0";
  const sumCost = statSrc.reduce((s, m) => s + m.estimatedMedicalCost, 0);
  return (<>
    <div className="card">
      <div className="rct"><Users size={18} color="#2563EB" /> 데모 회원 일괄 등록 <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>등록됨 {registered.length} / 전체 {(demoMembers || []).length}명</span></div>
      <button className="cbtn pri" onClick={doRegister}><Check size={15} /> 데모 회원 16명 등록하기</button>
      {msg && <div className="demomsg"><Check size={14} /> {msg}</div>}
      <div className="demostats">
        <div className="dst"><div className="l">평균 생체나이</div><div className="v">{avgBio}세</div></div>
        <div className="dst"><div className="l">평균 암위험도</div><div className="v">{avgCancer}등급</div></div>
        <div className="dst"><div className="l">전체 예상 의료비</div><div className="v">{fmt(sumCost)}</div></div>
      </div>
      <div className="gorow" style={{ marginTop: 4 }}>
        <button className="gobtn" onClick={() => exportDemo("csv")}><FileText size={14} /> CSV 내보내기</button>
        <button className="gobtn" onClick={() => exportDemo("json")}><FileText size={14} /> JSON 내보내기</button>
        <button className="gobtn" onClick={() => onGoLogin && onGoLogin()}><CircleUserRound size={14} /> 로그인 화면</button>
      </div>
    </div>
    <div className="card">
      <div className="rct"><ClipboardList size={18} color="#7C3AED" /> 등록된 데모 회원 목록</div>
      <div className="demolistwrap"><table className="demolist">
        <thead><tr><th>이름</th><th>이메일</th><th>생체나이</th><th>암등급</th><th>예상 의료비</th><th>테스트</th></tr></thead>
        <tbody>{list.map((m) => { const cg = demoCancerGrade(m.cancerRiskGrade); return (
          <tr key={m.id}>
            <td className="nm">{m.name}</td>
            <td className="em">{m.email}</td>
            <td>{m.biologicalAge}세</td>
            <td><span className="dgrade" style={{ color: cg[1], background: cg[2] }}>{m.cancerRiskGrade}·{cg[0]}</span></td>
            <td>{fmt(m.estimatedMedicalCost)}</td>
            <td className="ta"><button onClick={() => onLogin && onLogin(m)}>로그인</button><button className="dash" onClick={() => onLogin && onLogin(m)}>대시보드</button></td>
          </tr>
        ); })}</tbody>
      </table></div>
    </div>
  </>);
}
