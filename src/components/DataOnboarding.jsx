/* ══════════ 건강검진·보험 데이터 수집 온보딩 (STEP1 검진 → STEP2 보험) ══════════
   정회원 전용. 3채널 수집(업로드/촬영/연계) → OCR 확인 → FHIR 코드화 + 블록체인 기록. ⚠️ 시연 목업. */

/* 보안 3단 신뢰 카드 — "내 데이터는 이렇게 지켜집니다" */
function DataSecurityCards() {
  const C = [
    [ShieldCheck, "#2563EB", "#E8F1FE", "표준코드 변환(FHIR)", "검진 수치를 국제표준 코드(HL7 FHIR·LOINC)로 바꿔 저장해요. 값 자체가 코드체계로 전환됩니다."],
    [Lock, "#16A34A", "#E7F8EE", "암호화·분리 보관", "건강값은 AES-256로 암호화하고, 이름·주민번호와 물리적으로 분리해 익명 토큰에만 연결해요."],
    [FileText, "#7C3AED", "#F1ECFE", "블록체인 위변조 방지", "원본·변환본 해시와 동의 이력을 블록체인에 기록해 위변조를 검증해요. 실데이터는 체인에 올리지 않아요."],
  ];
  return (
    <div className="obsec">
      <div className="obsec-h"><ShieldCheck size={15} color="#2563EB" /> 내 데이터는 이렇게 지켜집니다</div>
      <div className="obsec-grid">{C.map(([Ic, c, bg, t, d]) => (
        <div className="obseccard" key={t}><span className="obsec-ic" style={{ background: bg, color: c }}><Ic size={18} /></span><b>{t}</b><p>{d}</p></div>
      ))}</div>
    </div>
  );
}
/* 단계별 개별 동의(요약+전문) */
function DataConsentList({ keys, state, onToggle }) {
  const [open, setOpen] = useState(null);
  const list = (typeof VAULT_CONSENTS !== "undefined" ? VAULT_CONSENTS : []).filter((c) => keys.indexOf(c.key) >= 0);
  return (
    <div className="obconsent">
      {list.map((c) => (
        <div className="obcon" key={c.key}>
          <label className="obcon-h"><span className={"obck" + (state[c.key] ? " on" : "")} onClick={() => onToggle(c.key)}>{state[c.key] && <Check size={12} />}</span>
            <span className="obcon-t"><b>{c.req ? "[필수]" : "[선택]"}</b> {c.title} <a onClick={(e) => { e.preventDefault(); setOpen(open === c.key ? null : c.key); }}>{open === c.key ? "접기" : "전문"}</a></span></label>
          {open === c.key && (
            <div className="obcon-full">
              <div><b>근거</b> {c.law}</div><div><b>수집 항목</b> {c.items}</div><div><b>목적</b> {c.purpose}</div><div><b>보유·파기</b> {c.keep}</div><div><b>거부 시</b> {c.deny}</div>
            </div>
          )}
        </div>
      ))}
      <div className="obcon-legal"><AlertTriangle size={12} /> {typeof VAULT_LEGAL_NOTICE !== "undefined" ? VAULT_LEGAL_NOTICE : ""}</div>
    </div>
  );
}

/* ── STEP 1. 건강검진결과 데이터 제공 ── */
function CheckupCollect({ member, onDone, onLater }) {
  const [phase, setPhase] = useState("intro");        // intro | channel | capture | review | done
  const [consent, setConsent] = useState({ health: false, ai: false, mkt: false, link: false });
  const [channel, setChannel] = useState(null);       // upload | photo | nhis
  const [ocr, setOcr] = useState(null);
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(null);
  const [nhisAuthed, setNhisAuthed] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProg, setOcrProg] = useState(0);
  const [keyInput, setKeyInput] = useState(() => { try { const k = localStorage.getItem("hifin_ocr_key"); return k && k !== "helloworld" ? k : ""; } catch (e) { return ""; } });
  const saveKey = () => { const k = keyInput.trim(); if (typeof setOcrKey === "function") setOcrKey(k || "helloworld"); if (typeof toast === "function") toast(k ? "OCR API 키를 저장했어요. 이제 더 안정적으로 인식돼요." : "기본 키로 돌아갔어요."); };
  const reqOk = consent.health && consent.ai;
  const w = (n) => { const s = (typeof CKUP_LOINC !== "undefined") ? CKUP_LOINC : {}; return n; };

  const runOcr = (scenario, fileName) => {
    const r = ocrParse(member, scenario);
    setOcr(Object.assign({ fileName }, r)); setRows(r.items.map((x) => Object.assign({}, x))); setPhase("review");
  };
  const runNhis = () => {
    const r = nhisFetch(member);
    setOcr(Object.assign({ channel: "nhis" }, r)); setRows(r.items.map((x) => Object.assign({}, x))); setPhase("review");
  };
  // 실제 파일 업로드 → 진짜 OCR(텍스트 추출) → 항목 파싱 → 확인
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = "";
    if (typeof realOcrExtract !== "function") { runOcr(/pdf/i.test(f.type || f.name) ? "nhis-pdf" : "book-photo", f.name); return; }
    const imgUrl = /image\//.test(f.type || "") ? (() => { try { return URL.createObjectURL(f); } catch (e) { return null; } })() : null;
    setOcrBusy(true); setOcrProg(0);
    try {
      const r = await realOcrExtract(f, (p) => setOcrProg(Math.round((p || 0) * 100)));
      const eng = r.engine === "ocr.space" ? "클라우드 OCR" : r.engine === "tesseract" ? "브라우저 OCR" : r.engine === "pdf.js" ? "PDF 텍스트" : "OCR";
      const warn = (r.matchedCount === 0 ? `자동 인식이 어려웠어요(${eng}). 아래 원본 사진을 보며 값을 직접 입력해 주세요.` : (r.matchedCount < 6 ? `${eng}로 ${r.matchedCount}개 항목을 인식했어요. 원본을 보며 나머지를 확인·입력해 주세요.` : `${eng}로 ${r.matchedCount}개 항목을 인식했어요. 원본과 대조해 확인해 주세요.`));
      setOcr({ fileName: f.name, completeness: "full", scenario: "real", warn, imgUrl, rawText: r.rawText || "" });
      setRows(r.items.map((x) => Object.assign({}, x)));
      setPhase("review");
    } catch (err) {
      if (typeof toast === "function") toast("파일을 읽지 못했어요. 다시 시도하거나 값을 직접 입력해 주세요.");
      const rr = ocrParse(member, "lowres");
      setOcr({ fileName: f.name, completeness: "full", scenario: "real-fail", warn: "자동 인식 실패 — 아래 원본 사진을 보며 값을 직접 입력해 주세요.", imgUrl });
      setRows(rr.items.map((x) => Object.assign({}, x, { value: "", low: true, confidence: 0 })));
      setPhase("review");
    } finally { setOcrBusy(false); }
  };
  const confirmSave = () => {
    const items = rows.map((r) => ({ key: r.key, value: r.value, source: r.source, confidence: r.confidence }));
    const meta = { source: channel === "nhis" ? "nhis" : channel === "photo" ? "ocr" : "upload", channel: channel || "upload", completeness: ocr.completeness || "full", fileName: (ocr && ocr.fileName) || null, date: "2025-11-01" };
    if (typeof vaultSaveConsents === "function") vaultSaveConsents(member, Object.assign({ step: "checkup" }, consent));
    const res = (typeof vaultSaveCheckup === "function") ? vaultSaveCheckup(member, items, meta) : null;
    setSaved(res); setPhase("done");
  };
  const flag = (r) => (typeof ckupFlag === "function") ? ckupFlag(r.key, r.value) : "";

  if (phase === "intro") return (
    <div className="obstep">
      <DataSecurityCards />
      <div className="obintro">
        <div className="obintro-t">검진결과를 연결하면 <b>AI 정밀 건강분석</b>이 시작돼요</div>
        <p>카톡·문자로 받은 검진결과 파일이나 종이 결과지를 올려 주세요. 국가검진은 공단 연계로 간편히 가져올 수도 있어요.</p>
      </div>
      <div className="obclbl">데이터 수집·이용 동의 <span>(항목별 개별 동의)</span></div>
      <DataConsentList keys={["health", "ai", "mkt"]} state={consent} onToggle={(k) => setConsent((s) => ({ ...s, [k]: !s[k] }))} />
      <div className="obfoot">
        <button className="oblater" onClick={onLater}>나중에 하기</button>
        <button className={"obnext" + (reqOk ? "" : " off")} disabled={!reqOk} onClick={() => setPhase("channel")}>동의하고 시작 <ChevronRight size={15} /></button>
      </div>
    </div>
  );

  if (phase === "channel") return (
    <div className="obstep">
      <div className="obclbl">검진결과 제공 방법 선택</div>
      <div className="obchans">
        <button className="obchan reco" onClick={() => { setChannel("upload"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#E8F1FE", color: "#2563EB" }}><Paperclip size={20} /></span>
          <div className="obchan-b"><b>파일 업로드 <span className="obchan-badge good">전체 분석 (권장)</span></b><p>카톡·문자로 받은 검진결과(PDF·JPG). 연도별 다중 업로드 지원</p></div><ChevronRight size={16} />
        </button>
        <button className="obchan reco" onClick={() => { setChannel("photo"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#F1ECFE", color: "#7C3AED" }}><ImageIcon size={20} /></span>
          <div className="obchan-b"><b>사진 촬영 <span className="obchan-badge good">전체 분석 (권장)</span></b><p>책자·종이 결과지를 카메라로 촬영. 여러 장 연속 촬영</p></div><ChevronRight size={16} />
        </button>
        <button className="obchan" onClick={() => { setChannel("nhis"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#FEF3E2", color: "#D97706" }}><Building2 size={20} /></span>
          <div className="obchan-b"><b>국민건강보험공단 연계 <span className="obchan-badge warn">간편 · 일부 항목만</span></b><p>본인인증 후 최근 10년 국가검진 이력을 한 번에. <b>AI 분석이 제한될 수 있어요</b></p></div><ChevronRight size={16} />
        </button>
      </div>
      {typeof TrustLine === "function" && <TrustLine ctx="upload" />}
      <div className="obfoot"><button className="oblater" onClick={() => setPhase("intro")}>이전</button></div>
    </div>
  );

  if (phase === "capture") return (
    <div className="obstep">
      {channel === "upload" && (<>
        <div className="obclbl">검진결과 파일 업로드</div>
        <div className="obhelp"><b>📱 카톡에서 받은 파일 올리는 법</b><span>카톡 대화 → 파일 길게 눌러 <b>저장</b> → 아래 업로드에서 선택 · <b>실제 파일에서 값을 추출</b>합니다</span></div>
        {ocrBusy ? (
          <div className="obocr"><span className="obocr-spin" /><b>파일에서 검진 값을 추출 중… {ocrProg}%</b><span>이미지·PDF를 텍스트로 인식하고 있어요 (처음 실행 시 인식 엔진을 내려받아 조금 걸릴 수 있어요)</span></div>
        ) : (
          <label className="obdrop"><input type="file" accept="image/*,application/pdf" onChange={onFile} hidden /><Paperclip size={26} color="#2563EB" /><b>검진결과 파일 선택 (실제 인식)</b><span>PDF · JPG · PNG — 업로드한 파일에서 값을 추출합니다</span></label>
        )}
        <div className="obdemo">인식이 어려우면 예시로 흐름 체험: <button onClick={() => runOcr("nhis-pdf", "예시_국가검진.pdf")}>국가검진(예시)</button><button onClick={() => runOcr("book-photo", "예시_종합검진.jpg")}>종합검진(예시)</button></div>
        <details className="obkeyset">
          <summary>⚙️ 인식 정확도 높이기 — 무료 OCR API 키 설정</summary>
          <p>ocr.space에서 <b>무료 키</b>를 받아 넣으면(월 25,000건·5MB) 공용키 제한 없이 더 안정적으로 인식돼요. 발급: ocr.space/ocrapi/freekey → 이메일 입력 → SUBSCRIBE → 메일로 키 수신.</p>
          <div className="obkeyrow"><input value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="OCR.space API 키 붙여넣기" /><button onClick={saveKey}>저장</button></div>
        </details>
        <div className="obfoot"><button className="oblater" onClick={() => setPhase("channel")}>이전</button></div>
      </>)}
      {channel === "photo" && (<>
        <div className="obclbl">결과지 촬영</div>
        <div className="obcam"><div className="obframe"><span /><span /><span /><span /><ImageIcon size={30} color="#7C3AED" /><em>문서 모서리를 프레임에 맞춰 주세요</em></div></div>
        <div className="obfoot2"><button className="oblater" onClick={() => setPhase("channel")}>이전</button><button className="obnext" onClick={() => runOcr("book-photo", "촬영본.jpg")}><ImageIcon size={15} /> 촬영 · 인식</button></div>
      </>)}
      {channel === "nhis" && (<>
        <div className="obclbl">공단 연계 조회</div>
        <div className="obnhis">
          <div className="obnhis-hd"><Building2 size={18} color="#D97706" /> 국민건강보험공단 · 건강정보 고속도로</div>
          <p>본인인증 후 최근 10년 국가검진 이력을 조회합니다. <b>공단은 혈액검사 일부 항목만 제공</b>하여 전체 정밀분석에는 한계가 있어요.</p>
          <label className="obcon obcon-inline"><span className={"obck" + (consent.link ? " on" : "")} onClick={() => setConsent((s) => ({ ...s, link: !s.link }))}>{consent.link && <Check size={12} />}</span><span className="obcon-t"><b>[필수]</b> 제3자 정보제공·전송요구 동의(공단 연계)</span></label>
          {!nhisAuthed
            ? <button className={"obnext" + (consent.link ? "" : " off")} disabled={!consent.link} onClick={() => setNhisAuthed(true)}><Lock size={15} /> 휴대폰 본인인증</button>
            : <button className="obnext" onClick={runNhis}><Building2 size={15} /> 공단 검진이력 조회</button>}
        </div>
        <div className="obfoot"><button className="oblater" onClick={() => setPhase("channel")}>이전</button></div>
      </>)}
    </div>
  );

  if (phase === "review") {
    const lowN = rows.filter((r) => r.low).length;
    return (
      <div className="obstep">
        <div className="obclbl">추출 결과 확인 <span>(값을 확인·수정 후 확정)</span></div>
        {ocr && ocr.completeness === "partial" && <div className="obbanner"><AlertTriangle size={14} /> 공단 제공 항목({rows.length}개) 기준의 <b>부분 데이터</b>입니다. 결과지를 업로드하면 전체 정밀 분석이 가능해요.</div>}
        {ocr && ocr.scenario && /real/.test(ocr.scenario) && ocr.warn && <div className="obhint" style={{ color: "#2563EB" }}>🔎 {ocr.warn}</div>}
        {lowN > 0 && <div className="obhint">🟡 인식 안 됨/신뢰도 낮은 {lowN}개 항목은 노란색이에요. 값을 확인·입력해 주세요.</div>}
        <div className="obreview">
          <div className="obreview-src">{ocr && ocr.imgUrl ? <img src={ocr.imgUrl} alt="검진결과 원본" className="obreview-img" /> : <FileText size={22} color="#94A3B8" />}<span>{(ocr && ocr.fileName) || "공단 연계"}</span><small>원본 (암호화 보관) · 대조하며 입력</small></div>
          <div className="obreview-tbl">
            <div className="obr-head"><span>검진 항목</span><span>LOINC</span><span>값</span></div>
            {rows.map((r, i) => { const fl = flag(r); return (
              <div className={"obr-row" + (r.low ? " low" : "")} key={r.key}>
                <span className="obr-k">{r.ko}</span>
                <span className="obr-loinc">{r.loinc}</span>
                <span className="obr-v"><input value={r.value} onChange={(e) => { const n = [...rows]; n[i] = Object.assign({}, r, { value: e.target.value, low: false }); setRows(n); }} /><em className="obr-unit">{r.unit}</em>{fl && <b className={"obr-flag " + fl}>{fl === "high" ? "▲높음" : fl === "low" ? "▼낮음" : "이상"}</b>}</span>
              </div>); })}
          </div>
        </div>
        {ocr && ocr.rawText && ocr.rawText.trim() && <details className="obraw"><summary>🔎 OCR가 읽은 원문 보기 (인식 확인용)</summary><pre>{ocr.rawText.slice(0, 1500)}</pre></details>}
        <div className="obfoot2"><button className="oblater" onClick={() => setPhase("channel")}>다시 선택</button><button className="obnext" onClick={confirmSave}><Check size={15} /> 확인 완료 · 저장</button></div>
      </div>
    );
  }

  // done
  const block = saved && saved.block;
  const partial = ocr && ocr.completeness === "partial";
  return (
    <div className="obstep obdone">
      <div className="obdone-ic"><ShieldCheck size={34} /></div>
      <h3>암호화 완료 · 블록체인 기록 완료 ✓</h3>
      <p className="obdone-sub">{member ? member.name : "회원"}님의 검진데이터가 표준코드(FHIR)로 변환되어 안전하게 보관됐어요.</p>
      <div className="obdone-steps">
        <span><Check size={13} /> FHIR 변환({rows.length}항목·LOINC)</span><span><Check size={13} /> AES-256 암호화·식별 분리</span><span><Check size={13} /> 블록 #{block ? block.idx : 0} 기록</span>
      </div>
      {block && <div className="obhash"><FileText size={12} /> 블록 해시 <code>{block.hash.slice(0, 32)}…</code></div>}
      {partial && <div className="obbanner"><AlertTriangle size={14} /> <b>공단 제공 항목 기준의 부분 분석</b>입니다. 검진결과지를 업로드하시면 전체 정밀 분석이 가능해요. <button className="obbanner-btn" onClick={() => { setChannel("upload"); setOcr(null); setSaved(null); setPhase("channel"); }}>업로드로 보완</button></div>}
      <div className="obdone-cta"><button className="obnext" onClick={onDone}>보험 데이터 연결하기 (2단계) <ChevronRight size={15} /></button><button className="oblater" onClick={onLater}>나중에 하기</button></div>
    </div>
  );
}

/* ── STEP 2. 보험가입데이터 제공 (통합조회 1순위 + 증권 업로드/촬영) ── */
function InsuranceCollect({ member, onDone, onLater }) {
  const [phase, setPhase] = useState("intro");      // intro | channel | capture | review | done
  const [consent, setConsent] = useState({ insurance: false, link: false });
  const [channel, setChannel] = useState("aggregate"); // aggregate(1순위·기본) | upload | photo
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(null);
  const w = (n) => { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; };

  const runAgg = () => { const r = insAggregateFetch(member); setData(Object.assign({ channel: "aggregate" }, r)); setRows(r.contracts); setPhase("review"); };
  const runOcr = () => { const r = insOcrParse(member); setData(Object.assign({ channel: "ocr" }, r)); setRows(r.contracts); setPhase("review"); };
  const confirmSave = () => {
    if (typeof vaultSaveConsents === "function") vaultSaveConsents(member, Object.assign({ step: "insurance" }, consent));
    const res = (typeof vaultSaveInsurance === "function") ? vaultSaveInsurance(member, rows, { source: channel === "aggregate" ? "aggregate" : "ocr", channel }) : null;
    setSaved(res); setPhase("done");
  };

  if (phase === "intro") return (
    <div className="obstep">
      <div className="obintro">
        <div className="obintro-t">보험가입 내역을 연결하면 <b>보장 공백 분석</b>이 완성돼요</div>
        <p>본인인증 한 번으로 전 보험사 가입내역을 한 번에 가져올 수 있어요(가장 편리·정확). 실손 세대·중대질환 진단비까지 반영됩니다.</p>
      </div>
      <div className="obclbl">보험정보 수집·이용 동의</div>
      <DataConsentList keys={["insurance"]} state={consent} onToggle={(k) => setConsent((s) => ({ ...s, [k]: !s[k] }))} />
      <div className="obfoot">
        <button className="oblater" onClick={onLater}>나중에 하기</button>
        <button className={"obnext" + (consent.insurance ? "" : " off")} disabled={!consent.insurance} onClick={() => setPhase("channel")}>동의하고 시작 <ChevronRight size={15} /></button>
      </div>
    </div>
  );

  if (phase === "channel") return (
    <div className="obstep">
      <div className="obclbl">보험가입 내역 제공 방법 선택</div>
      <div className="obchans">
        <button className="obchan reco obchan-lg" onClick={() => { setChannel("aggregate"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#E7F6EC", color: "#16A34A" }}><ShieldCheck size={22} /></span>
          <div className="obchan-b"><b>보험가입내역 통합조회 <span className="obchan-badge reco2">추천 · 1순위</span></b><p><b>본인인증 한 번으로 모든 보험사의 가입내역을 한 번에</b> 가져옵니다 (가장 편리·정확). 신용정보원 ‘내보험다보여’ 연계</p></div><ChevronRight size={16} />
        </button>
        <button className="obchan" onClick={() => { setChannel("upload"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#E8F1FE", color: "#2563EB" }}><Paperclip size={20} /></span>
          <div className="obchan-b"><b>보험증권 파일 업로드</b><p>통합조회가 어려운 경우. 증권 PDF·이미지에서 담보를 추출</p></div><ChevronRight size={16} />
        </button>
        <button className="obchan" onClick={() => { setChannel("photo"); setPhase("capture"); }}>
          <span className="obchan-ic" style={{ background: "#F1ECFE", color: "#7C3AED" }}><ImageIcon size={20} /></span>
          <div className="obchan-b"><b>증권·안내장 사진 촬영</b><p>종이 증권·안내장을 촬영해 담보를 추출</p></div><ChevronRight size={16} />
        </button>
      </div>
      {typeof TrustLine === "function" && <TrustLine ctx="upload" />}
      <div className="obfoot"><button className="oblater" onClick={() => setPhase("intro")}>이전</button></div>
    </div>
  );

  if (phase === "capture") return (
    <div className="obstep">
      {channel === "aggregate" && (<>
        <div className="obclbl">통합조회 연계</div>
        <div className="obnhis" style={{ borderColor: "#BBE7CC", background: "#F4FCF6" }}>
          <div className="obnhis-hd" style={{ color: "#15803D" }}><ShieldCheck size={18} color="#16A34A" /> 신용정보원 · 내보험다보여</div>
          <p style={{ color: "#2F6B45" }}>본인인증 후 <b>전 보험사 가입내역</b>을 일괄 수신합니다. 실손 세대·중대질환 진단비 담보가 자동 반영돼요.</p>
          <label className="obcon obcon-inline"><span className={"obck" + (consent.link ? " on" : "")} onClick={() => setConsent((s) => ({ ...s, link: !s.link }))}>{consent.link && <Check size={12} />}</span><span className="obcon-t"><b>[필수]</b> 제3자 정보제공·전송요구 동의(통합조회 연계)</span></label>
          {!authed
            ? <button className={"obnext" + (consent.link ? "" : " off")} disabled={!consent.link} onClick={() => setAuthed(true)}><Lock size={15} /> 휴대폰 본인인증</button>
            : <button className="obnext" onClick={runAgg}><ShieldCheck size={15} /> 전 보험사 가입내역 조회</button>}
        </div>
        <div className="obfoot"><button className="oblater" onClick={() => setPhase("channel")}>이전</button></div>
      </>)}
      {channel === "upload" && (<>
        <div className="obclbl">보험증권 파일 업로드</div>
        <label className="obdrop"><input type="file" accept="image/*,application/pdf" hidden onChange={(e) => { runOcr(); e.target.value = ""; }} /><Paperclip size={26} color="#2563EB" /><b>증권 파일 선택</b><span>PDF · JPG · PNG</span></label>
        <div className="obdemo">시연용 예시: <button onClick={runOcr}>증권 OCR 예시 실행</button></div>
        <div className="obfoot"><button className="oblater" onClick={() => setPhase("channel")}>이전</button></div>
      </>)}
      {channel === "photo" && (<>
        <div className="obclbl">증권 촬영</div>
        <div className="obcam"><div className="obframe"><span /><span /><span /><span /><ImageIcon size={30} color="#7C3AED" /><em>증권 전체가 프레임에 들어오게 촬영</em></div></div>
        <div className="obfoot2"><button className="oblater" onClick={() => setPhase("channel")}>이전</button><button className="obnext" onClick={runOcr}><ImageIcon size={15} /> 촬영 · 인식</button></div>
      </>)}
    </div>
  );

  if (phase === "review") return (
    <div className="obstep">
      <div className="obclbl">수신 보험계약 확인 <span>({rows.length}건)</span></div>
      {data && data.channel === "aggregate" && <div className="obhint">✅ 신용정보원 통합조회로 전 보험사 가입내역을 일괄 수신했어요.</div>}
      <div className="obcontracts">
        {rows.map((c, i) => (
          <div className="obcontract" key={i}>
            <div className="obc-top"><b>{c.product}</b><span className={"obc-kind " + (c.kind === "실손" ? "sil" : "ci")}>{c.kind}</span></div>
            <div className="obc-meta">{c.insurer} · 가입 {c.join}{c.gen ? " · " + c.gen : ""}</div>
            <div className="obc-detail">{c.kind === "실손" ? `급여 자기부담 ${c.coGen || "-"} · 비급여 ${c.coNon || "-"}` : `${c.cat} 진단비 ${w(c.benefit)}`}{c.confidence ? ` · 인식 ${Math.round(c.confidence * 100)}%` : ""}</div>
            {c.detailLack && <div className="obc-lack"><AlertTriangle size={11} /> 담보 상세(자기부담 등) 일부 부족 — 증권 업로드로 보완 권장</div>}
          </div>
        ))}
      </div>
      <div className="obfoot2"><button className="oblater" onClick={() => setPhase("channel")}>다시 선택</button><button className="obnext" onClick={confirmSave}><Check size={15} /> 확인 완료 · 저장</button></div>
    </div>
  );

  const block = saved && saved.block;
  return (
    <div className="obstep obdone">
      <div className="obdone-ic"><ShieldCheck size={34} /></div>
      <h3>보험 데이터 연결 완료 ✓</h3>
      <p className="obdone-sub">{rows.length}건의 보험계약이 저장되어 <b>AI 보험 솔루션·상담</b>에 즉시 반영됐어요.</p>
      <div className="obdone-steps"><span><Check size={13} /> 실손 세대·진단비 스키마 저장</span><span><Check size={13} /> 암호화·블록체인 기록</span><span><Check size={13} /> AIPlannerChat 반영</span></div>
      {block && <div className="obhash"><FileText size={12} /> 블록 해시 <code>{block.hash.slice(0, 32)}…</code></div>}
      <div className="obdone-cta"><button className="obnext" onClick={onDone}>초개인화 홈으로 <ChevronRight size={15} /></button></div>
    </div>
  );
}

function DataOnboardingSection({ onGo }) {
  const go = onGo || (() => {});
  const role = (typeof authRole === "function") ? authRole() : "ADMIN";
  const isGuest = role === "GUEST";
  // 체험회원(GUEST)도 차단 없이 전 과정 시연 — 유사회원 매칭 프로필(없으면 체험 프로필)로 진행, 쓰기는 세션 시뮬레이션(쓰기가드)
  let member = (typeof demoCurrentUser === "function" && demoCurrentUser()) || (!isGuest && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  if (!member) {
    let gm = null; try { gm = (typeof authCurrent === "function") ? ((authCurrent() || {}).match || null) : null; } catch (e) {}
    member = { id: "GUEST-DEMO", name: "체험회원", age: (gm && gm.age) || 45, sex: (gm && gm.sex) || "남" };
  }
  const [step, setStep] = useState(() => { try { const ob = onboardStatus(member); return (ob.step1 && !ob.step2) ? 2 : 1; } catch (e) { return 1; } });
  return (
    <div className="obwrap">
      {isGuest && <div className="finlink" style={{ marginBottom: 10 }}><Sparkles size={13} color="#F97316" /> <b>체험 모드</b> — 회원가입 없이 검진결과 업로드→OCR→블록체인 기록까지 전 과정을 그대로 시연합니다. 데이터는 이 세션에만 임시 저장돼요(가입 시 실제 저장).</div>}
      <div className="obhd">
        <div><div className="obhd-t">내 건강·보험 데이터 연결</div><div className="obhd-s">회원으로부터 직접 받는 데이터로 초개인화 분석을 시작합니다 · 2단계 중 {step}단계</div></div>
        <div className="obprog"><i style={{ width: (step === 1 ? 50 : 100) + "%" }} /></div>
      </div>
      <div className="obtabs"><span className={"obtab" + (step === 1 ? " on" : "") + (step > 1 ? " done" : "")}>{step > 1 ? <Check size={12} /> : 1} 건강검진</span><span className="obtab-a" /><span className={"obtab" + (step === 2 ? " on" : "")}>2 보험가입</span></div>
      {step === 1 && <CheckupCollect member={member} onDone={() => setStep(2)} onLater={() => go("home")} />}
      {step === 2 && <InsuranceCollect member={member} onDone={() => go("home")} onLater={() => go("home")} />}
    </div>
  );
}

/* ── 데이터 금고(Vault) — 마이페이지: 내 데이터·블록체인 무결성·접근이력·동의현황·삭제/철회 ── */
function DataVaultPanel({ onGo }) {
  const nav = onGo || (() => {});
  const member = (typeof demoCurrentUser === "function" && demoCurrentUser()) || (typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const fillDemo = () => { if (typeof seedSelfVault === "function") { try { seedSelfVault(member); } catch (e) {} } setTick((t) => t + 1); if (typeof toast === "function") toast("데모 데이터를 채웠어요(검진·보험·거래·블록체인)."); };
  // 시연 기준 인물(조성래·운영자 로그인)은 금고가 비어 있으면 자동 시드 — 투자자·참여사 데모가 빈 화면으로 시작하지 않게
  useEffect(() => {
    try {
      const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
      if (!dm && member && typeof seedSelfVault === "function" && seedSelfVault(member)) setTick((t) => t + 1);
    } catch (e) {}
  }, []);
  if (!member) return (
    <div className="card dvempty"><ShieldCheck size={30} color="#94A3B8" /><b>로그인이 필요해요</b><p>회원으로 로그인하면 내 건강·보험 데이터를 안전하게 보관·관리할 수 있어요.</p></div>
  );
  const token = (typeof anonToken === "function") ? anonToken(member) : "";
  /* 둘러보기(GUEST) — 저장 없이 메모리 예시 금고(내 체험 프로필 기준)로 전체 화면 체험 */
  const guest = (typeof isGuestRole === "function") && isGuestRole();
  const gd = guest ? ((typeof guestVaultDemo === "function") ? guestVaultDemo(member) : null) : null;
  const v = gd ? gd.v : ((typeof vaultLoad === "function") ? vaultLoad(token) : null);
  const chainOk = gd ? { ok: true, blocks: gd.blocks.length } : ((typeof chainVerify === "function") ? chainVerify() : { ok: true, blocks: 0 });
  const myBlocks = gd ? gd.blocks : ((typeof chainForToken === "function") ? chainForToken(token) : []);
  const integ = gd ? { ok: true, checked: (gd.v.checkups || []).length, bad: 0 } : ((typeof verifyVaultIntegrity === "function") ? (() => { try { return verifyVaultIntegrity(member); } catch (e) { return null; } })() : null);
  const access = gd ? gd.access : ((typeof vaultAccessHistory === "function") ? vaultAccessHistory(token) : []);
  const w = (n) => { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; };
  const fmt = (ts) => { try { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch (e) { return ""; } };
  const BT = { checkup: "검진 저장", insurance: "보험 저장", consent: "동의 기록", erase: "데이터 파기", record: "기록" };
  const purge = () => { if (typeof vaultPurge === "function") vaultPurge(member); setConfirm(false); setTick((t) => t + 1); if (typeof toast === "function") toast("데이터를 파기했습니다. 블록체인에 파기 이력이 기록됐어요."); };
  void tick;

  if (!v || (!(v.checkups || []).length && !(v.insurance || []).length)) return (
    <div className="card dvempty">
      <ShieldCheck size={30} color="#94A3B8" />
      <b>아직 연결된 데이터가 없어요</b>
      <p>건강검진·보험 데이터를 직접 업로드·연결하면 여기 데이터 금고에서 FHIR 코드화·블록체인으로 안전하게 관리하고 언제든 열람·삭제할 수 있어요.</p>
      <div className="dvempty-btns">
        <button className="obnext" onClick={() => nav("onboarding")}>데이터 연결하기 (실제 업로드) <ChevronRight size={15} /></button>
        <button className="oblater" onClick={fillDemo}>데모 데이터 채우기</button>
      </div>
    </div>
  );

  return (
    <div className="dv">
      {gd && <div className="dv-guestnote">👀 둘러보기 예시 금고 — 내 체험 프로필(나이·성별·질환) 기준으로 즉석 생성된 시연 데이터예요. 실제로 저장되지 않고, 나가면 사라져요.</div>}
      <div className="dv-hd"><ShieldCheck size={18} color="#2563EB" /> 데이터 금고 <span className="dv-token">익명 토큰 {token}</span>
        <button className="dv-add" onClick={() => nav("onboarding")}><Paperclip size={13} /> 데이터 추가 연결 (검진·보험 업로드)</button></div>
      <div className="dv-integrity"><span className={"dv-ibadge" + (chainOk.ok ? " ok" : " bad")}>{chainOk.ok ? <Check size={13} /> : <AlertTriangle size={13} />} 블록체인 무결성 {chainOk.ok ? "정상" : "위변조 감지"}</span>
        {integ && integ.checked > 0 && <span className={"dv-ibadge" + (integ.ok ? " ok" : " bad")}>{integ.ok ? <Check size={13} /> : <AlertTriangle size={13} />} 데이터 해시 대조 {integ.ok ? "위변조 없음 ✓" : "불일치"}</span>}
        <span className="dv-blk">내 블록 {myBlocks.length} · 전체 {chainOk.blocks}</span></div>

      <div className="dv-sec">내 데이터</div>
      {(v.checkups || []).map((c, i) => (
        <div className="dv-item" key={"c" + i}><span className="dv-ic" style={{ background: "#E8F1FE", color: "#2563EB" }}><FileText size={16} /></span>
          <div className="dv-ib"><b>건강검진 {c.date} <span className={"dv-tag " + (c.completeness === "full" ? "full" : "part")}>{c.completeness === "full" ? "전체" : "부분"}</span></b><span>{c.channel === "nhis" ? "공단 연계" : c.channel === "photo" ? "사진 촬영" : "파일 업로드"} · {(c.items || []).length}항목 · FHIR/LOINC</span></div>
          <code className="dv-hash">{(c.fhirHash || "").slice(0, 10)}…</code></div>
      ))}
      {(v.insurance || []).length > 0 && (
        <div className="dv-item"><span className="dv-ic" style={{ background: "#E7F6EC", color: "#16A34A" }}><ShieldCheck size={16} /></span>
          <div className="dv-ib"><b>보험 가입내역 <span className="dv-tag full">{v.insurance.length}건</span></b><span>{v.insurance.map((x) => x.product).slice(0, 2).join(" · ")}{v.insurance.length > 2 ? " 외" : ""}</span></div></div>
      )}
      {(() => { try { const certs = gd ? gd.certs : JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); if (!certs.length) return null; const c = certs[certs.length - 1]; return (
        <div className="dv-item"><span className="dv-ic" style={{ background: "#F0FDF4", color: "#15803D" }}><BadgeCheck size={16} /></span>
          <div className="dv-ib"><b>무상 검진대비보험 증서 <span className="dv-tag full">{certs.length}건</span></b><span>{c.id} · {c.center} · 검진 예약 1탭 동의로 발급 · 블록체인 기록 ✓</span></div>
          <code className="dv-hash">{String(c.hash || "").slice(0, 10)}…</code></div>
      ); } catch (e) { return null; } })()}

      <div className="dv-sec">접근 이력 <span>(내 데이터에 접근한 모든 조회)</span></div>
      <div className="dv-log">{(access.slice(-6).reverse()).map((a, i) => <div className="dv-lrow" key={i}><span>{fmt(a.ts)}</span><b>{a.actor === "member" ? "본인" : a.actor}</b><span className="dv-la">{a.action}</span></div>)}{!access.length && <div className="dv-lrow"><span className="dv-la">기록 없음</span></div>}</div>

      <div className="dv-sec">내 데이터 보호 블록 <span>(블록체인에 기록된 내 데이터 지문 · {myBlocks.length}블록)</span></div>
      <div className="dvchain">{myBlocks.slice().reverse().map((b) => { const meta = (typeof BCV_TYPE !== "undefined" && BCV_TYPE[b.type]) || ["기록", "#64748B", "#F1F5FB", FileText]; const Ic = meta[3]; return (
        <div className="dvcblk" key={b.idx}><span className="dvcb-t" style={{ background: meta[2], color: meta[1] }}><Ic size={11} /> {meta[0]}</span><span className="dvcb-n">{b.note || meta[0]}</span><code className="dvcb-h">{(b.hash || "").slice(0, 10)}…</code></div>
      ); })}{!myBlocks.length && <div className="dv-lrow"><span className="dv-la">기록된 블록이 없어요</span></div>}</div>
      <div className="dvchain-note">내 검진·보험·동의·거래의 <b>지문(해시)</b>만 블록체인에 기록됩니다. 원본은 암호화 금고 보관 · 지문 일치 시 위변조 없음 증명.</div>

      <div className="dv-sec">동의 현황</div>
      <div className="dv-consents">{(typeof VAULT_CONSENTS !== "undefined" ? VAULT_CONSENTS : []).map((c) => { const on = v.consents && v.consents.state && v.consents.state[c.key]; return <span className={"dv-con" + (on ? " on" : "")} key={c.key}>{on ? <Check size={11} /> : <X size={11} />} {c.title.split("(")[0].replace(" 동의", "")}</span>; })}</div>

      <div className="dv-danger">
        <div><b>데이터 삭제·철회</b><p>내 건강·보험 데이터를 즉시 파기합니다. 파기 이력은 블록체인에 기록됩니다.</p></div>
        <button className="dv-del" onClick={() => setConfirm(true)}><Trash2 size={14} /> 즉시 삭제</button>
      </div>

      {confirm && (
        <div className="bkov" onClick={() => setConfirm(false)}><div className="bk" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
          <div className="bkh"><div className="bt">데이터 파기</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setConfirm(false)}><X size={20} color="#8A97AE" /></button></div>
          <div className="bkb"><p style={{ fontSize: 13, color: "#33405C", lineHeight: 1.7 }}>연결된 <b>건강검진·보험 데이터</b>를 즉시 파기합니다. 이 작업은 되돌릴 수 없으며, 파기 사실이 블록체인에 기록됩니다. 계속할까요?</p>
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}><button className="oblater" style={{ flex: 1 }} onClick={() => setConfirm(false)}>취소</button><button className="dv-del" style={{ flex: 1, justifyContent: "center" }} onClick={purge}><Trash2 size={14} /> 파기</button></div></div>
        </div></div>
      )}
    </div>
  );
}
