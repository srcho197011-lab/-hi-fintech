/* ====================== 검진 리포트 보관함 (건강관리 → 검진 리포트) ====================== */
/* 외부 검진 시스템(age.healthketch.com)에서 발행한 리포트를 고객 동의 후 업로드·보관.
   백엔드 없는 데모이므로 파일은 base64로 브라우저 localStorage에만 저장(회원별 키). */
function ReportVault({ user }) {
  const key = "hifin_reports_" + ((user && user.email) || "default");
  const load = () => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; } };
  const [list, setList] = useState(load);
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const who = (user && user.name) || "조성래";

  const save = (l) => {
    try { localStorage.setItem(key, JSON.stringify(l)); } catch (e) { setMsg({ t: "저장 공간이 부족합니다. 기존 리포트를 삭제하거나 더 작은 파일을 올려주세요.", e: true }); return false; }
    setList(l); return true;
  };
  const onPick = (e) => {
    setMsg(null);
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.size > 3 * 1024 * 1024) { setMsg({ t: "3MB 이하 파일만 업로드할 수 있습니다 (브라우저 로컬 저장 제한).", e: true }); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const item = { id: "r" + new Date().getTime(), name: f.name, type: f.type || "", size: f.size, dataUrl: reader.result, date: new Date().toLocaleString("ko-KR") };
      if (save([item, ...list])) setMsg({ t: "검진 리포트가 업로드되었습니다.", e: false });
    };
    reader.onerror = () => setMsg({ t: "파일을 읽지 못했습니다. 다시 시도해 주세요.", e: true });
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  const del = (id) => { setMsg(null); save(list.filter((r) => r.id !== id)); };
  const open = (r) => {
    const w = window.open("", "_blank");
    if (!w) { setMsg({ t: "팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.", e: true }); return; }
    if ((r.type || "").indexOf("image") === 0) w.document.write('<title>' + r.name + '</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="' + r.dataUrl + '" style="max-width:100%;max-height:100vh"></body>');
    else w.location.href = r.dataUrl;
  };
  const isImg = (r) => (r.type || "").indexOf("image") === 0;

  return (
    <div className="card">
      <div className="rct"><FileText size={18} color="#2F5BEA" /> 검진 리포트 <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{who}님 · {list.length}건</span></div>

      <div className="rvnote"><ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
        <div><b>고객 동의 후</b> 외부 검진 시스템(age.healthketch.com)에서 발행한 건강검진 리포트를 업로드해 보관·확인하세요. 업로드한 파일은 <b>이 브라우저(기기)에만</b> 저장되며 외부로 전송되지 않습니다.</div></div>

      <label className="rvagree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 고객 본인의 동의를 받아 리포트를 등록합니다.</label>

      <div className="rvup">
        <input ref={fileRef} type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={onPick} />
        <button className="rvbtn pri" disabled={!agree} onClick={() => fileRef.current && fileRef.current.click()}><Plus size={16} /> 리포트 업로드 (PDF·이미지)</button>
        <a className="rvbtn ghost" href="https://age.healthketch.com/#/intro" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> 발행 사이트 열기</a>
      </div>

      {msg && <div className={`rvmsg ${msg.e ? "err" : "ok"}`}>{msg.e ? <AlertTriangle size={14} /> : <Check size={14} />} {msg.t}</div>}

      {list.length === 0 ? (
        <div className="rvempty"><FileText size={30} color="#C2CCDD" /><div>아직 업로드된 검진 리포트가 없습니다.<br />동의 확인 후 발행된 리포트를 업로드해 주세요.</div></div>
      ) : (
        <div className="rvgrid">
          {list.map((r) => (
            <div className="rvitem" key={r.id}>
              <div className="rvthumb" onClick={() => open(r)} role="button" title="크게 보기">
                {isImg(r) ? <img src={r.dataUrl} alt={r.name} /> : <span className="rvpdf"><FileText size={30} color="#2F5BEA" /><em>PDF</em></span>}
              </div>
              <div className="rvmeta"><b title={r.name}>{r.name}</b><span>{r.date} · {(r.size / 1024).toFixed(0)}KB</span></div>
              <div className="rvact"><button onClick={() => open(r)}><ExternalLink size={13} /> 보기</button><button className="del" onClick={() => del(r.id)}><X size={13} /> 삭제</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
