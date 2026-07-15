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
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; const name = f ? f.name : "검진결과.pdf";
    const scen = f && /pdf/i.test(f.type || f.name) ? "nhis-pdf" : "book-photo";
    runOcr(scen, name); e.target.value = "";
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
      <div className="obfoot"><button className="oblater" onClick={() => setPhase("intro")}>이전</button></div>
    </div>
  );

  if (phase === "capture") return (
    <div className="obstep">
      {channel === "upload" && (<>
        <div className="obclbl">검진결과 파일 업로드</div>
        <div className="obhelp"><b>📱 카톡에서 받은 파일 올리는 법</b><span>카톡 대화 → 파일 길게 눌러 <b>저장</b> → 아래 업로드에서 선택</span></div>
        <label className="obdrop"><input type="file" accept="image/*,application/pdf" onChange={onFile} hidden /><Paperclip size={26} color="#2563EB" /><b>파일 선택 또는 여기로 드래그</b><span>PDF · JPG · PNG</span></label>
        <div className="obdemo">시연용 예시로 바로 체험: <button onClick={() => runOcr("nhis-pdf", "국가검진결과_2025.pdf")}>국가검진 PDF</button><button onClick={() => runOcr("book-photo", "종합검진책자.jpg")}>종합검진 책자사진</button><button onClick={() => runOcr("lowres", "검진지_촬영.jpg")}>저화질 사진</button></div>
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
        {lowN > 0 && <div className="obhint">🟡 신뢰도 낮은 {lowN}개 항목은 노란색이에요. 값을 꼭 확인해 주세요.</div>}
        <div className="obreview">
          <div className="obreview-src"><FileText size={22} color="#94A3B8" /><span>{(ocr && ocr.fileName) || "공단 연계"}</span><small>원본 (암호화 보관)</small></div>
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

/* ── STEP 2. 보험가입데이터 제공 (다음 유닛에서 통합조회·증권 OCR 구현) ── */
function InsuranceCollect({ member, onDone, onLater }) {
  return (
    <div className="obstep">
      <div className="obintro"><div className="obintro-t"><ShieldCheck size={16} color="#2563EB" style={{ verticalAlign: -2 }} /> 보험가입데이터 제공 <span className="obchan-badge good" style={{ marginLeft: 6 }}>다음 단계</span></div>
        <p>통합조회(내보험다보여)로 전 보험사 가입내역을 한 번에 가져오거나, 증권을 업로드·촬영할 수 있어요. (이 화면은 곧 활성화됩니다)</p></div>
      <div className="obfoot2"><button className="oblater" onClick={onLater}>나중에 하기</button><button className="obnext" onClick={onDone}>홈으로 <ChevronRight size={15} /></button></div>
    </div>
  );
}

function DataOnboardingSection({ onGo }) {
  const go = onGo || (() => {});
  const role = (typeof authRole === "function") ? authRole() : "ADMIN";
  const member = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const [step, setStep] = useState(1);
  // GUEST·미가입 세션은 접근 차단 → 가입 유도
  if (role === "GUEST" || !member) return (
    <div className="obwrap"><div className="obgate">
      <Lock size={30} color="#94A3B8" />
      <h3>정회원 전용 기능이에요</h3>
      <p>건강검진·보험 데이터 연결은 회원가입을 완료한 정회원만 이용할 수 있어요. 지금 가입하고 내 데이터로 초개인화 분석을 받아보세요.</p>
      <button className="obnext" onClick={() => { if (typeof guestExit === "function" && role === "GUEST") guestExit(); else go("home"); }}>회원가입 하러가기 <ChevronRight size={15} /></button>
    </div></div>
  );
  return (
    <div className="obwrap">
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
