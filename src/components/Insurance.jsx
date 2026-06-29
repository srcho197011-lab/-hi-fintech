const INS_PRODUCTS = [
  ["immune", "(무)건강한미래 암보험", "췌장암·간암 등 특정암 진단비 강화 · 표적항암·수술·입원비", "월 38,400원", "췌장암 경고 · 암 주의 다수"],
  ["heart", "간·소화기 질환 보장보험", "간질환·췌장염·복부 정밀검사·입원 치료비 보장", "월 22,100원", "간 54.4세 · 췌장 56.2세"],
  ["heartpulse", "당뇨케어 건강보험", "당뇨 진단·합병증(신장·망막·신경) 보장", "월 19,800원", "당뇨병 위험 +6.2%"],
  ["badge", "4세대 실손의료비", "입원·통원 실제 치료비 보장 (자기부담 일부)", "월 13,200원", "치료비 기본 대비"],
];
const INS_COVERAGE = [
  { name: "무료 검진보험 (임베디드·자동가입)", status: "보유", rows: [["검진 중 질환 진단지원금", "한도 1,000,000원"], ["검진 연계 정밀검사비", "한도 300,000원"]], note: "검진 예약 시 추가 보험료 없이 자동가입" },
  { name: "4세대 실손의료비", status: "보유", rows: [["입원 치료비", "한도 50,000,000원"], ["통원 치료비", "회당 한도 200,000원"]], note: "2023.04 가입 · 갱신형" },
  { name: "암보험", status: "미가입", rows: [["암 진단비", "가입 시 30,000,000원"], ["표적항암 치료비", "가입 시 별도 보장"]], note: "췌장암 경고 — 가입 권장" },
];

// 건강검진 대비보험 (현대해상 전속 보험대리점 글로벌예방금융㈜·GA코리아 제휴 운영) — 담보·플랜
const CHECK_PLANS = [
  { key: "basic", name: "기본형", sub: "국가검진" },
  { key: "standard", name: "표준형", sub: "종합검진" },
  { key: "premium", name: "고급형", sub: "프리미엄검진" },
  { key: "psych", name: "심리케어프리미엄", sub: "선택형" },
];
// 담보: [art, 담보명, 기본형, 표준형, 고급형, 심리케어프리미엄, 특약, 비고/정의]
const CHECK_COVERS = [
  ["immune", "암 진단금", "200만원", "500만원", "1,000만원", "1,000만원", "암치료비보장 특별약관(I)", "암 진단확정 시 1회 (기타암 제외 / 갑상선암·기타피부암·제자리암·경계성종양 해당없음)"],
  ["heartpulse", "급성심근경색", "200만원", "500만원", "1,000만원", "1,000만원", "급성심근경색증치료비보장 특별약관", "급성심근경색증 진단확정 시 가입금액 전액 1회"],
  ["brain", "뇌졸중", "200만원", "500만원", "1,000만원", "1,000만원", "뇌졸중치료비보장 특별약관", "뇌졸중 진단확정 시 가입금액 전액 1회"],
  ["device", "21대 질병 수술비", "100만원", "200만원", "300만원", "300만원", "질병수술비보장 특별약관", "13대·다발성3대·특정5대 질병 수술 1회당 지급"],
  ["badge", "정신질환 진단", "-", "-", "-", "300만원", "정신질환진단보장 특별약관", "정신질환(F코드) 최초 진단확정 시 1회 (심리케어프리미엄 선택형 한정)"],
  ["lock", "보이스피싱", "300만원", "300만원", "300만원", "300만원", "전화금융사기보장 특별약관", "전화금융사기 피해 보장 (보장비율 70%)"],
];

function EnrollModal({ onClose, onGo }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("standard");
  const [date, setDate] = useState(null);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 14); return d; });
  const idx = plan === "basic" ? 2 : plan === "standard" ? 3 : plan === "premium" ? 4 : 5;
  const planName = CHECK_PLANS.find((p) => p.key === plan).name;
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">검진 예약 · 검진보험 자동가입{step < 4 ? ` (${step}/3)` : ""}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dbody">
          {step === 1 && (<>
            <div className="dsec"><div className="dh">1. 검진보험 플랜 선택</div>
              <div className="plansel">{CHECK_PLANS.map((p) => <div key={p.key} className={`pl ${plan === p.key ? "on" : ""}`} onClick={() => setPlan(p.key)}><div className="pn">{p.name}</div><div className="pp">{p.sub}{p.key === "psych" ? " · 정신질환 포함" : p.key === "basic" ? " · 암 200" : p.key === "standard" ? " · 암 500" : " · 암 1,000"}</div></div>)}</div>
              <div className="chnote" style={{ marginTop: 8 }}>※ 검진 예약과 연계되어 <b>추가 보험료 없이</b> 자동가입됩니다.</div>
            </div>
            <div className="dsec"><div className="dh">2. 검진 희망일</div>
              <div className="cal">{days.map((d, i) => { const k = `${d.getMonth() + 1}/${d.getDate()}`; return (<div key={i} className={`calc ${date === k ? "on" : ""}`} onClick={() => setDate(k)}><div className="d">{d.getDate()}</div><div className="w">{W[d.getDay()]}</div></div>); })}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}><MapPin size={12} style={{ verticalAlign: "-2px" }} /> 검진센터: 서울 KMI 한국의학연구소 광화문센터 <span style={{ color: "var(--soft)" }}>(검진 섹션에서 변경 가능)</span></div>
            </div>
          </>)}
          {step === 2 && (<>
            <div className="dsec"><div className="dh">{planName} 보장 내용</div>
              {CHECK_COVERS.map((c, i) => <div className="feat" key={i}><span className="num" style={{ background: "#EAF0FE" }}><Art name={c[0]} size={18} /></span><div><b style={{ fontSize: 13 }}>{c[1]} · <span style={{ color: c[idx] === "-" ? "var(--soft)" : "var(--blue)" }}>{c[idx] === "-" ? "해당없음" : c[idx]}</span></b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c[7]}</div></div></div>)}
            </div>
            <div className="dsec"><div className="dh">보험계약기간</div>
              <div className="feat"><CalendarCheck size={15} color="#2563EB" /><div style={{ fontSize: 12.5 }}>건강검진 <b>15일 전부터 3개월</b>(진단·수술 시까지) · 3개월 단위 연장 가능</div></div>
            </div>
          </>)}
          {step === 3 && (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>검진 예약 · 검진보험 자동가입 완료</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{planName} · {date || "검진일 예약"} · 서울 KMI 광화문센터</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
                <div className="resitem" style={{ margin: 0, borderColor: "#FCD34D", background: "linear-gradient(120deg,#FFFBEB,#fff)" }}><span className="ic" style={{ background: "#FEF3C7" }}><Art name="coin" size={20} /></span><div><b style={{ fontSize: 13 }}>건강토큰(Health Token) 적립</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>검진 예약으로 적립된 토큰으로 <b style={{ color: "#B45309" }}>무상 건강검진보험</b>이 가입됩니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#E7F8EE" }}><Art name="badge" size={20} /></span><div><b style={{ fontSize: 13 }}>검진보험 자동가입</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>추가 보험료 없이 {planName} 보장이 적용됩니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic"><Art name="hash" size={20} /></span><div><b style={{ fontSize: 13 }}>NFT 보험증서 발행</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>건강지갑에 SBT 보험증서가 발행됩니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#FEF3E2" }}><Art name="doc" size={20} /></span><div><b style={{ fontSize: 13 }}>검진 결과 자동 연동</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>검진 중·후 질환 진단 시 자동 청구로 연결됩니다.</div></div></div>
              </div>
            </div>
          )}
        </div>
        <div className="bkfoot" style={{ display: "flex", gap: 8 }}>
          {step === 1 && <button className="cbtn pri" style={{ margin: 0, opacity: date ? 1 : .5 }} disabled={!date} onClick={() => setStep(2)}>{date ? "다음 · 보장 확인" : "검진 희망일을 선택하세요"}</button>}
          {step === 2 && (<><button className="cbtn" style={{ margin: 0, width: "auto", padding: "12px 16px" }} onClick={() => setStep(1)}>이전</button><button className="cbtn pri" style={{ margin: 0 }} onClick={() => setStep(3)}><ShieldCheck size={15} /> 예약·자동가입 확정</button></>)}
          {step === 3 && (<><button className="cbtn" style={{ margin: 0, width: "auto", padding: "12px 16px" }} onClick={() => { onClose(); onGo && onGo("checkup"); }}>검진 상세</button><button className="cbtn pri" style={{ margin: 0 }} onClick={onClose}>확인</button></>)}
        </div>
      </div>
    </div>
  );
}

function InsModal({ title, sub, items, onClose }) {
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{title}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          <div className="bkconfirm">
            <div className="ic"><Check size={30} color="#16A34A" /></div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
              {(items || []).map(([a, t, d], i) => <div className="resitem" key={i} style={{ margin: 0 }}><span className="ic" style={{ background: "#EAF0FE" }}><Art name={a} size={20} /></span><div><b style={{ fontSize: 13 }}>{t}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{d}</div></div></div>)}
            </div>
            <div className="chnote" style={{ textAlign: "left", marginTop: 14 }}>※ 보험 가입·청구·상담은 <b>정식 라이선스 설계사·보험사 채널</b>을 통해 진행됩니다. 본 화면은 정보 제공·연결 목적의 데모이며, 보험료·보장은 상품·고지·심사에 따라 달라집니다.</div>
            <button className="cbtn pri" style={{ marginTop: 14 }} onClick={onClose}>확인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 담보별 특별약관 상세 (약관 요약·정리)

function MiniTbl({ head, rows }) {
  return (
    <table className="instbl">
      <thead><tr>{head.map((h, i) => <th key={i} className={i === head.length - 1 && head.length > 2 ? "hl" : ""}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j === r.length - 1 && r.length > 2 ? "hl" : ""}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function GroupTbl({ groups }) {
  return (
    <table className="instbl">
      <thead><tr><th>구분</th><th>분류항목</th><th>분류번호</th></tr></thead>
      <tbody>{groups.map((grp) => [
        <tr key={grp.g + "_h"}><td colSpan={3} style={{ background: "#E0F2FE", color: "#075985", fontWeight: 800, textAlign: "left" }}>{grp.g}</td></tr>,
        ...grp.items.map((it, i) => <tr key={grp.g + i}><td>{it[0]}</td><td style={{ textAlign: "left", fontWeight: 600, color: "#3a4659" }}>{it[1]}</td><td style={{ whiteSpace: "nowrap" }}>{it[2]}</td></tr>),
      ])}</tbody>
    </table>
  );
}

function CoverDetailModal({ name, onClose }) {
  const d = COVER_DETAIL[name];
  if (!d) return null;
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15 }}><Art name={d.art} size={20} /> {name}<span className="cbadge" style={{ color: "#7C3AED", background: "#F1ECFE", marginLeft: 8 }}><FileText size={10} /> {d.tokyak}</span></div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dbody">
          <div className="dsec"><div className="dh">보장금액 (플랜별)</div>
            <MiniTbl head={["구분", "기본형", "표준형", "고급형", "심리케어프리미엄"]} rows={[["보험가입금액", ...d.amounts]]} />
          </div>
          <div className="dsec"><div className="dh">보험금 지급사유</div><p style={{ fontSize: 12.8, color: "#3a4659", lineHeight: 1.65 }}>{d.pay}</p></div>
          {d.table && <div className="dsec"><div className="dh">{d.tableTitle || "분류·지급 기준"}</div><MiniTbl head={d.table.head} rows={d.table.rows} /></div>}
          {d.groups && <div className="dsec"><div className="dh">{d.groupsTitle || "분류표"}</div><GroupTbl groups={d.groups} /></div>}
          {d.def && <div className="dsec"><div className="dh">질병 정의</div><p style={{ fontSize: 12.5, color: "#3a4659", lineHeight: 1.6 }}>{d.def}</p></div>}
          {d.diag && <div className="dsec"><div className="dh">진단확정</div><p style={{ fontSize: 12.5, color: "#3a4659", lineHeight: 1.6 }}>{d.diag}</p></div>}
          {d.notes && d.notes.length > 0 && <div className="dsec"><div className="dh">유의사항</div>{d.notes.map((n, i) => <div className="feat" key={i}><Info size={14} color="#F59E0B" /><div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{n}</div></div>)}</div>}
          <div className="chnote" style={{ marginTop: 4 }}>※ 위 내용은 현대해상 전속 보험대리점 글로벌예방금융㈜ 및 GA코리아와의 전략적 제휴로 운영되는 검진 대비보험 자료를 요약·정리한 것입니다. 일부 비율( )은 상품 확정 시 채워지며, 실제 보장·지급은 약관 원문·상품·심사 결과에 따릅니다.</div>
        </div>
        <div className="bkfoot"><button className="cbtn pri" style={{ margin: 0 }} onClick={onClose}>확인</button></div>
      </div>
    </div>
  );
}

const PROVIDERS = ["하이젠케어㈜", "현대해상화재보험㈜", "DB손해보험㈜", "삼성화재해상보험㈜", "KB손해보험㈜", "글로벌예방금융㈜", "GA코리아㈜"];

function InsJoin({ onGo }) {
  const [ag, setAg] = useState({});
  const [open, setOpen] = useState({});
  const [svc, setSvc] = useState({ s0: true, s1: true, s2: true, s3: true, s4: true });
  const [info, setInfo] = useState({ name: PT.name, birth: "1970.11.20", sex: "남", phone: "", addr: PT.addr, rrn1: "", rrn2: "" });
  const [showRrn, setShowRrn] = useState(false);
  const rrnOk = info.rrn1.length === 6 && info.rrn2.length === 7;
  const [done, setDone] = useState(false);
  const set = (k, v) => setAg((p) => ({ ...p, [k]: v }));
  const tog = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const required = ["grpConfirm", "grpAgree", "collect", "third", "esign", "insExplain"];
  const allReq = required.every((k) => ag[k] === "yes" || ag[k] === true);

  const Agree = ({ k, required: rq, title, summary, full, prov }) => (
    <div className="card" style={{ borderLeft: "4px solid " + (ag[k] === "yes" ? "#16A34A" : ag[k] === "no" ? "#EF4444" : "#CBD5E1") }}>
      <div className="rct" style={{ fontSize: 14, alignItems: "center" }}>{title}<span className={`reqtag ${rq ? "req" : "opt"}`}>{rq ? "필수" : "선택"}</span></div>
      <p style={{ fontSize: 12.3, color: "#3a4659", lineHeight: 1.6 }}>{summary}</p>
      {prov && <div className="provlist">{PROVIDERS.map((p) => <span key={p}>{p}</span>)}</div>}
      {full && <><button className="atoggle" onClick={() => tog(k)}>{open[k] ? "전문 접기 ▲" : "전문 보기 ▼"}</button>{open[k] && <div className="fulltxt">{full}</div>}</>}
      <div className="agree"><button className={`yes ${ag[k] === "yes" ? "on" : ""}`} onClick={() => set(k, "yes")}><Check size={14} style={{ verticalAlign: "-2px" }} /> 동의함</button><button className={`no ${ag[k] === "no" ? "on" : ""}`} onClick={() => set(k, "no")}>동의하지 않음</button></div>
    </div>
  );
  const Confirm = ({ k, title, summary, full }) => (
    <div className="card" style={{ borderLeft: "4px solid " + (ag[k] ? "#2563EB" : "#CBD5E1") }}>
      <div className="rct" style={{ fontSize: 14, alignItems: "center" }}>{title}<span className="reqtag req">필수</span></div>
      <p style={{ fontSize: 12.3, color: "#3a4659", lineHeight: 1.6 }}>{summary}</p>
      {full && <><button className="atoggle" onClick={() => tog(k)}>{open[k] ? "전문 접기 ▲" : "전문 보기 ▼"}</button>{open[k] && <div className="fulltxt">{full}</div>}</>}
      <div className="agree"><button className={`chk ${ag[k] ? "on" : ""}`} onClick={() => set(k, !ag[k])}><Check size={14} style={{ verticalAlign: "-2px" }} /> 위 내용을 확인했습니다</button></div>
    </div>
  );

  if (done) return (
    <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E7F8EE", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Check size={30} color="#16A34A" /></div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>건강검진보험 가입 동의가 접수되었습니다</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>제휴 보험대리점 <b>글로벌예방금융㈜</b>가 청약·인수심사를 진행하며, 보험증권은 건강지갑(NFT 증서)으로 발행됩니다.</p>
      <button className="cbtn pri" style={{ maxWidth: 260, margin: "16px auto 0" }} onClick={() => setDone(false)}>확인</button>
    </div>
  );

  return (<>
    <div className="airec">
      <div className="at"><ShieldCheck size={16} color="#2F5BEA" /> 보험가입 · 건강검진보험 가입동의</div>
      <div className="ap">본 보험가입은 제휴 보험대리점 <b>글로벌예방금융㈜</b>(공동 GA코리아㈜)가 운영합니다. 보험계약자는 <b>하이젠케어 주식회사</b>이며, 회원은 건강검진보험의 피보험자로 가입합니다. <b>보험가입 여부와 무관하게 회원자격·건강관리 서비스는 유지</b>됩니다.</div>
    </div>

    <div className="card">
      <div className="rct"><FileText size={18} color="#2563EB" /> 보험계약 개요</div>
      <div className="costrow"><span className="cl">보험계약자</span><span className="cv">하이젠케어 주식회사</span><span className="ca" /></div>
      <div className="costrow"><span className="cl">보험대리점(GA)</span><span className="cv">글로벌예방금융㈜ / GA코리아㈜</span><span className="ca">운영·모집</span></div>
      <div className="costrow"><span className="cl">보험회사</span><span className="cv" style={{ color: "var(--soft)" }}>제휴 보험사 (확정 시 표기)</span><span className="ca" /></div>
      <div className="costrow"><span className="cl">보험종목</span><span className="cv">단체상해보험 · 건강보험 등</span><span className="ca" /></div>
      <div className="costrow"><span className="cl">보험기간</span><span className="cv" style={{ color: "var(--soft)" }}>가입 확정 시 산정</span><span className="ca" /></div>
      <div className="chnote" style={{ marginTop: 8 }}>※ 본 건강검진보험은 회원의 건강증진·질병예방·치료비 부담 경감 및 경제적 위험보장을 목적으로 운영됩니다.</div>
    </div>

    <div className="bklbl" style={{ margin: "2px 0 8px" }}><ShieldCheck size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 건강검진보험 가입동의서</div>
    <Confirm k="grpConfirm" title="피보험자 확인사항" summary="① 회원 가입 ② 보험가입과 무관한 회원자격 ③ 부가서비스·위험관리 수단 ④ 보험 주요내용·보장·지급사유·면책 설명 제공 — 위 사항을 확인합니다." full={FULL_GRP} />
    <Agree k="grpAgree" required title="건강검진보험 가입 동의" summary="하이젠케어㈜가 계약자로 체결하는 건강검진보험계약의 피보험자로 가입하고, 계약 체결·유지·관리 및 보험금 지급에 필요한 범위에서 보험회사·보험대리점의 정보처리에 동의합니다." />

    <div className="bklbl" style={{ margin: "4px 0 8px" }}><CircleUserRound size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 회원가입 및 통합 동의서</div>
    <div className="card">
      <div className="rct"><CircleUserRound size={17} color="#2563EB" /> 회원 기본정보</div>
      <div className="consig">
        <input placeholder="성명" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
        <input placeholder="생년월일 (예: 1970.11.20)" value={info.birth} onChange={(e) => setInfo({ ...info, birth: e.target.value })} />
        <input placeholder="휴대전화" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
        <input placeholder="이메일(ID)" value={info.email || ""} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
        <input placeholder="주소" style={{ gridColumn: "1 / -1" }} value={info.addr} onChange={(e) => setInfo({ ...info, addr: e.target.value })} />
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#B45309", marginBottom: 5 }}><Lock size={11} style={{ verticalAlign: "-2px" }} /> 주민등록번호 <span style={{ color: "var(--soft)", fontWeight: 600 }}>· 건강검진보험 가입 시 필수 (보안입력)</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input inputMode="numeric" maxLength={6} placeholder="앞 6자리" value={info.rrn1} onChange={(e) => setInfo({ ...info, rrn1: e.target.value.replace(/\D/g, "").slice(0, 6) })} style={{ flex: 1, letterSpacing: "2px" }} />
            <span style={{ fontWeight: 800, color: "var(--soft)" }}>—</span>
            <input inputMode="numeric" maxLength={7} type={showRrn ? "text" : "password"} placeholder="뒤 7자리" value={info.rrn2} onChange={(e) => setInfo({ ...info, rrn2: e.target.value.replace(/\D/g, "").slice(0, 7) })} style={{ flex: 1, letterSpacing: "3px" }} />
            <button type="button" onClick={() => setShowRrn((v) => !v)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 9, padding: "9px 11px", cursor: "pointer", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }} title={showRrn ? "가리기" : "표시"}><Lock size={13} /> {showRrn ? "가리기" : "표시"}</button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 5 }}>※ 뒷자리는 입력 즉시 마스킹(●)되며, 보험 인수심사 목적으로만 <b>암호화 전송·저장</b>됩니다. {rrnOk && <span style={{ color: "var(--green)", fontWeight: 700 }}><Check size={11} style={{ verticalAlign: "-2px" }} /> 입력 완료</span>}</div>
        </div>
      </div>
      <div className="rct" style={{ fontSize: 13.5, marginTop: 14 }}>서비스 이용 신청 <span className="reqtag opt">선택</span></div>
      <div className="svcchk">{[["s0", "건강검진 예약·관리"], ["s1", "AI 건강분석·상담"], ["s2", "건강금융지갑"], ["s3", "병원·건강관리 연계"], ["s4", "보험서비스·청구 지원"]].map(([k, t]) => <span key={k} className={svc[k] ? "on" : ""} onClick={() => setSvc({ ...svc, [k]: !svc[k] })}><Check size={13} /> {t}</span>)}</div>
    </div>

    <Agree k="collect" required title="개인정보·건강정보 수집·이용 동의" summary="회원가입·본인확인, 건강검진·건강관리, AI 건강위험도 분석, 건강금융지갑, 보험계약·지급심사 등을 위해 개인정보·민감(건강)정보를 수집·이용합니다." full={FULL_COLLECT} />
    <Agree k="third" required title="개인정보·민감정보 제3자 제공 동의" summary="건강관리·보험서비스 제공을 위해 아래 수탁·제휴사에 개인정보를 제공합니다." prov full={FULL_THIRD} />
    <Agree k="market" title="마케팅 정보 활용 동의 (선택)" summary="건강관리·보험·검진·병원·건강식품·의료서비스 및 제휴서비스 안내를 위해 개인정보를 활용합니다. 미동의 시에도 기본 서비스 이용에 제한이 없습니다." full={FULL_MARKET} />
    <Agree k="esign" required title="전자문서 및 전자서명 동의" summary="「전자문서 및 전자거래 기본법」·「전자서명법」에 따라 전자문서·전자서명으로 회원가입·서비스 신청·보험가입 및 각종 계약을 체결하는 것에 동의합니다." />
    <Confirm k="insExplain" title="보험가입 및 설명 확인" summary="보험서비스 신청 시 보험상품의 주요내용·보장내용·면책사항·보험금 지급제한 사항 등에 대해 충분한 설명을 제공받았음을 확인합니다." />

    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div style={{ fontSize: 12.5, color: "#3a4659", lineHeight: 1.6 }}>본인은 상기 내용을 충분히 읽고 이해하였으며 자발적인 의사에 따라 본 동의서를 작성·제출합니다. <b>(전자서명)</b></div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>신청인: <b style={{ color: "var(--text)" }}>{info.name || "—"}</b> · 하이젠케어 주식회사 귀중</div>
      <button className="cbtn pri" style={{ marginTop: 12, opacity: allReq && rrnOk ? 1 : .5 }} disabled={!(allReq && rrnOk)} onClick={() => setDone(true)}><ShieldCheck size={15} /> {!allReq ? "필수 항목에 모두 동의해 주세요" : !rrnOk ? "주민등록번호를 입력해 주세요" : "전자서명 후 건강검진보험 가입 동의 제출"}</button>
      <div className="chnote" style={{ marginTop: 8 }}>※ 보험가입·청약·심사는 정식 라이선스 보험대리점 글로벌예방금융㈜·GA코리아㈜ 및 보험사를 통해 진행됩니다. 본 화면은 동의서 양식 데모입니다.</div>
    </div>
  </>);
}

/* ── 보험사 로고: 로컬 공식 로고 → 로고 API → 파비콘 → 브랜드 컬러 폴백 ──
   data/logos/<slug>.(svg|png) 에 공식 로고 파일을 넣으면 그 로고가 1순위로 표시됩니다. */
function InsLogo({ n, c, domain, ab, slug }) {
  const exts = ["svg", "png", "jpg", "jpeg", "webp"];
  const SRCS = [
    ...(slug ? exts.map((e) => `./data/logos/${slug}.${e}`) : []),
    domain && `https://logo.clearbit.com/${domain}`,
    domain && `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ].filter(Boolean);
  const [i, setI] = useState(0);
  if (i >= SRCS.length) return <span className="lg" style={{ background: c }}>{ab}</span>;
  const isFav = SRCS[i].indexOf("s2/favicons") >= 0;
  return <img className={isFav ? "lgfav" : "lgimg"} src={SRCS[i]} alt={`${n} 로고`} loading="lazy" onError={() => setI((x) => x + 1)} />;
}
/* ── 내 몸 맞춤 프리미엄보험 공지문 ── */
function PremiumNotice() {
  const NT = [
    "국민건강보험과 실손보험만으로는 고액 비급여 치료비, 간병비, 중증질환에 따른 소득상실 등 증가하는 의료비 부담을 충분히 해결하기 어렵습니다.",
    "또한 기존 보험은 개인의 실제 건강상태를 충분히 반영하지 못해 불필요한 보장과 높은 보험료 부담이 발생하는 경우가 많습니다.",
    "Health-InsurFin Tech 기반 내몸맞춤 프리미엄보험은 건강검진, 의료데이터, 생활습관 데이터를 AI로 분석하여 개인에게 꼭 필요한 보장을 합리적인 비용으로 제공합니다.",
    "나아가 건강검진, 병원 이용, 건강관리 활동 등을 통해 적립된 건강자산을 디지털 건강지갑(Health Wallet)에 축적하고, 이를 보험료와 의료비 재원으로 활용함으로써 국민의 의료비 부담을 줄이는 새로운 건강금융 생태계를 구축합니다.",
  ];
  return (
    <div className="pnotice">
      <div className="ph"><Info size={15} /> 공지 · 내 몸 맞춤 프리미엄보험 안내</div>
      <div className="pb">{NT.map((p, i) => <p key={i}>{p}</p>)}</div>
    </div>
  );
}
/* ── 맞춤 헬스케어 보험 — 플랫폼 구조도 인포그래픽 ── */
function PremiumPolicySection() {
  const IMG_EXTS = ["png", "jpg", "jpeg", "svg", "webp"];
  const [imgExt, setImgExt] = useState(0);
  const [useImg, setUseImg] = useState(false); // 인터랙티브 HTML 버전을 기본으로
  // [표시명, 컬러, 도메인, 약칭, 로컬 로고 slug(data/logos/<slug>.svg|png)]
  const INSURERS = [
    ["현대해상", "#0067B1", "hi.co.kr", "현대", "hi"], ["삼성화재", "#1428A0", "samsungfire.com", "삼성", "samsungfire"], ["DB손해보험", "#008C44", "idbins.com", "DB", "db"], ["KB손해보험", "#FFB81C", "kbinsure.co.kr", "KB", "kb"], ["메리츠손해보험", "#ED1C24", "meritzfire.com", "메리츠", "meritz"],
    ["삼성생명", "#1428A0", "samsunglife.com", "삼성", "samsunglife"], ["한화생명", "#F37321", "hanwhalife.com", "한화", "hanwhalife"], ["교보생명", "#6CB33F", "kyobo.co.kr", "교보", "kyobo"], ["신한라이프", "#0046FF", "shinhanlife.com", "신한", "shinhanlife"], ["NH농협생명", "#008C3F", "nhlife.co.kr", "NH", "nhlife"],
  ];
  const STAGES = [
    ["데이터 수집", ClipboardList, [[Stethoscope, "건강검진 데이터"], [FileText, "의료 마이데이터"], [Activity, "유전체 정보"], [MonitorSmartphone, "생활습관 데이터(운동·식단·수면)"], [Pill, "건강활동 데이터(영양제·구독·진료)"]]],
    ["AI 건강 분석 엔진", Brain, [[null, "개인 건강위험 분석"], [null, "질병 발생 예측"], [null, "맞춤형 보장 필요도 분석"], [null, "건강 개선 인사이트 제공"]]],
    ["초개인화 보험 설계", ClipboardList, [[null, "필요 보장 선별"], [null, "맞춤형 보장 구성"], [null, "보험료 최적화"], [null, "실시간 보장 조정"]]],
    ["보험 서비스", ShieldCheck, [[ShieldCheck, "보험 가입/관리"], [Banknote, "보험료 납부"], [FileText, "보험금 청구"], [Search, "보장 내역 조회"], [Bot, "AI 상담 서비스"]]],
    ["보험사 파트너", Building2, [[null, "초대형 보험사 제휴"], [null, "상품 제공 · 인수 · 지급"]]],
    ["건강지갑(Health Wallet)", Wallet, [[null, "건강활동으로 적립"], [null, "보험료 결제"], [null, "의료비 결제"], [null, "건강 리워드 사용"]]],
  ];
  const VALUES = [
    [ShieldCheck, "맞춤형 보장", "개인별 건강위험에 기반한 최적의 보장 설계", "#16A34A", "#E7F8EE"],
    [Coins, "보험료 절감", "불필요한 보장은 줄이고 합리적인 보험료 제공", "#2563EB", "#E8F1FE"],
    [HeartPulse, "건강자산 적립", "건강활동으로 건강자산을 쌓아 보험료 부담 완화", "#EF4444", "#FDECEC"],
    [TrendingUp, "예방 중심", "질병 예측·관리로 건강한 삶 지원", "#7C3AED", "#F1ECFE"],
    [Users, "취약계층 지원", "ESG 및 사회공헌 연계로 의료 접근성 향상", "#F59E0B", "#FEF3E2"],
    [Lock, "데이터 보안", "최고 수준의 보안으로 안전한 데이터 관리", "#0E7490", "#E0F2FE"],
  ];
  const [stageInfo, setStageInfo] = useState(null);
  // 단계별 상세 설명 + 바로가기 [설명, 버튼라벨, 액션]
  const STAGE_META = {
    "데이터 수집": ["건강검진·의료 마이데이터·유전체·생활습관·건강활동 데이터를 안전하게 수집·연동합니다.", "건강검진 보러가기", () => nav("checkup")],
    "AI 건강 분석 엔진": ["수집된 데이터를 AI가 분석해 개인 건강위험·질병 발생을 예측하고 맞춤 보장 필요도를 도출합니다.", "내 건강 리포트 보기", () => nav("manage")],
    "초개인화 보험 설계": ["분석 결과로 꼭 필요한 보장만 선별·구성하고 보험료를 최적화하며 실시간으로 보장을 조정합니다.", "맞춤 설계 상담받기", () => openConsult("내 몸 맞춤 프리미엄보험")],
    "보험 서비스": ["보험 가입·관리, 보험료 납부, 보험금 청구, 보장 조회, AI 상담을 한 곳에서 제공합니다.", "보험 서비스로 이동", () => nav("insurance")],
    "보험사 파트너": ["국내 초대형 보험사와 제휴해 상품 제공·인수·지급을 담당합니다. 제휴 상담을 신청하세요.", "제휴 보험 상담받기", () => openConsult("내 몸 맞춤 프리미엄보험")],
    "건강지갑(Health Wallet)": ["건강활동으로 적립한 건강자산을 보험료·의료비 결제와 건강 리워드로 사용합니다.", "건강지갑 보기", () => nav("wallet")],
  };
  if (useImg) {
    return (
      <div style={{ marginTop: 4 }}>
        <PremiumNotice />
        <img src={`./data/premium_infographic.${IMG_EXTS[imgExt]}`} alt="내 몸 맞춤 프리미엄보험 — Hi-Fin Tech 플랫폼 구조도 및 핵심 가치 안내" loading="lazy"
          onClick={() => openConsult("내 몸 맞춤 프리미엄보험")} title="맞춤 보험 상담 신청"
          style={{ width: "100%", borderRadius: 16, display: "block", border: "1px solid var(--border)", boxShadow: "0 14px 32px -24px rgba(20,40,90,.5)", cursor: "pointer" }}
          onError={() => (imgExt + 1 < IMG_EXTS.length ? setImgExt(imgExt + 1) : setUseImg(false))} />
        <div className="mhcta">
          <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><MessageSquare size={15} /> 내게 맞는 프리미엄보험 상담받기</button>
          <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={15} /> 건강지갑 보기</button>
        </div>
        <div className="ipscompliance"><b>안내</b> · 본 내용은 Health-InsurFin Tech의 <b>맞춤 헬스케어 보험 정책(안) 개요</b>로 참고용이며, 보험사 파트너·상품 구성·보장·보험료·인수기준 및 사회공헌 재원 연계는 관련 법령(보험업법 등)·금융당국 인가·참여기관 협약 및 법적 검토 결과에 따라 확정·변경될 수 있습니다.</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 4 }}>
      <PremiumNotice />
      <div className="mhhero">
        <div>
          <div className="ht">프리미엄 헬스케어 보험</div>
          <h2>내 몸 맞춤 프리미엄보험</h2>
          <div className="hd">Health-InsurFin Tech 기반으로 개인 건강데이터를 분석하여 꼭 필요한 보장을 합리적인 비용으로 제공하고, 건강활동으로 적립한 건강자산으로 보험료 부담을 줄이는 새로운 건강금융 생태계를 만들어 갑니다.</div>
        </div>
        <div className="mhpartners">
          <div className="pt">함께하는 국내 초대형 보험사 파트너 <span className="clickhint"><Info size={11} /> 로고 클릭 시 제휴 상담</span></div>
          <div className="insco">{INSURERS.map(([n, c, domain, ab, slug]) => <div className="c" key={n} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")} title={`${n} 제휴 보험 상담 신청`}><InsLogo n={n} c={c} domain={domain} ab={ab} slug={slug} /><b>{n}</b></div>)}</div>
        </div>
      </div>

      <div className="mhbox">
        <div className="bt">HI-Fin Tech 플랫폼 구조도</div>
        <div className="bs">건강관리부터 보험설계, 보험금 청구, 건강자산 관리까지 원스톱 통합 플랫폼</div>
        <div style={{ textAlign: "center", marginTop: 8 }}><span className="clickhint"><Info size={11} /> 각 단계를 클릭하면 상세 설명과 바로가기를 볼 수 있습니다</span></div>
        <div className="platwrap"><div className="platflow">
          {STAGES.map(([h, HIc, items], i) => (
            <React.Fragment key={h}>
              <div className="stage" onClick={() => setStageInfo(h)} title={`${h} 자세히 보기`}><div className="sh"><span className="shi"><HIc size={18} /></span>{h}</div>{items.map(([ItIc, it]) => <div className="it" key={it}>{ItIc ? <ItIc size={12} className="iti" /> : <span className="d" />}{it}</div>)}</div>
              {i < STAGES.length - 1 && <div className="arrow"><ChevronRight size={18} /></div>}
            </React.Fragment>
          ))}
        </div></div>
        <div className="platfb"><span className="ln" /><RefreshCw size={14} /> 건강관리 피드백 &amp; 리워드 제공 <span className="ln r" /></div>
      </div>

      <div className="mhbox">
        <div className="bt">HI-Fin Tech의 핵심 가치</div>
        <div className="corevals" style={{ marginTop: 14 }}>{VALUES.map(([Ic, t, d, c, bg]) => <div className="v" key={t}><span className="ic" style={{ background: bg, color: c }}><Ic size={22} /></span><b>{t}</b><p>{d}</p></div>)}</div>
      </div>

      <div className="mhend"><ShieldCheck size={16} /> HI-Fin Tech는 보험·헬스케어·금융·AI 기술이 융합된 차세대 국민 건강보장체계 구축을 지향합니다.</div>
      <div className="mhcta">
        <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><MessageSquare size={15} /> 내게 맞는 프리미엄보험 상담받기</button>
        <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={15} /> 건강지갑 보기</button>
      </div>
      <div className="ipscompliance"><b>안내</b> · 본 내용은 Health-InsurFin Tech의 <b>맞춤 헬스케어 보험 정책(안) 개요</b>로 참고용이며, 보험사 파트너·상품 구성·보장·보험료·인수기준 및 사회공헌 재원 연계는 관련 법령(보험업법 등)·금융당국 인가·참여기관 협약 및 법적 검토 결과에 따라 확정·변경될 수 있습니다.</div>
      {stageInfo && STAGE_META[stageInfo] && (
        <div className="bkov" onClick={() => setStageInfo(null)}>
          <div className="bk" onClick={(e) => e.stopPropagation()}>
            <div className="bkh"><div className="bt">{stageInfo}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setStageInfo(null)}><X size={20} color="#8A97AE" /></button></div>
            <div className="bkb">
              <p style={{ fontSize: 13.5, color: "#33405C", lineHeight: 1.75, margin: "2px 0 14px" }}>{STAGE_META[stageInfo][0]}</p>
              <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const fn = STAGE_META[stageInfo][2]; setStageInfo(null); fn(); }}><ChevronRight size={15} /> {STAGE_META[stageInfo][1]}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 실손보험 정책 — 건강자산 기반 보험지원 모델 ── */
function HealthAssetWallet() {
  const W = [["누적 건강자산", "12,480", "HTK"], ["이번 달 적립 건강자산", "+1,240", "HTK"], ["실손보험 지원 가능", "약 32,000", "원/월"]];
  const ST = [["건강검진대비보험", "적용 중", true], ["실손보험 추천", "5세대 실손", true], ["노후/유병력자 실손", "해당 시 안내", false], ["사회공헌 지원 대상", "현재 비대상", false]];
  return (
    <div className="ipswallet">
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Art name="wallet" size={20} /> <b style={{ fontSize: 14.5, fontWeight: 800 }}>조성래님 건강금융지갑 · 실손 지원 현황</b></div>
      <div className="wg">{W.map(([k, v, u]) => <div className="wi" key={k}><div className="k">{k}</div><div className="v">{v} <small>{u}</small></div></div>)}</div>
      <div className="wst">{ST.map(([k, v, on]) => <span className="chip" key={k}>{on ? <Check size={12} /> : <Info size={12} />} {k}: <b>{v}</b></span>)}</div>
    </div>
  );
}
function InsuranceRecommendationCard({ report }) {
  const age = (report && report.meta && report.meta.regAge) || 54.1;
  const chronic = false; // 데모: 위험도는 높으나 진단 보유는 아님
  const rec = age >= 60 ? "노후실손보험" : chronic ? "유병력자 실손보험" : "5세대 실손보험";
  const TYPES = [
    ["일반 회원", "5세대 실손보험", "최신 기준의 표준형 실손보험. 자기부담·보장구조가 5세대 기준으로 설계됩니다."],
    ["60세 이상 회원", "노후실손보험", "고령층 대상 보험료 부담을 낮춘 실손보험. 노후 의료비 대비에 적합합니다."],
    ["만성질환 보유 회원", "유병력자 실손보험", "고혈압·당뇨·고지혈증 등 유병력자도 가입 가능한 실손보험입니다."],
  ];
  return (
    <div className="ipsrec">
      {TYPES.map(([seg, name, desc]) => (
        <div className={`rc ${name === rec ? "on" : ""}`} key={name}>
          {name === rec && <span className="rfit"><Check size={10} /> 조성래님 추천</span>}
          <div className="rtag">{seg}</div>
          <div className="rt">{name}</div>
          <div className="rd">{desc}</div>
        </div>
      ))}
    </div>
  );
}
function InsuranceSupportAdmin() {
  const [open, setOpen] = useState(false);
  const ROWS = [
    ["건강활동별 적립률", "1.0%"], ["건강쇼핑 구매 적립률", "2.0%"], ["정밀영양 서비스 적립률", "3.0%"],
    ["건강검진 예약 적립금", "5,000 HTK"], ["실손보험 지원 한도", "월 50,000원"], ["고령층(65+) 우대 지원률", "+30%"],
    ["의료취약계층 지원률", "+50%"], ["ESG 기금 재원", "등록 3건"], ["재단별 지원금", "노인나눔·한국의료재단 외"],
    ["보험사별 실손 상품", "5세대·노후·유병력자"],
  ];
  return (
    <div className="ipsadmin">
      <div className="ahd" onClick={() => setOpen((o) => !o)}><Settings size={16} color="#2563EB" /> 실손보험 정책 관리 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 관리자 설정(데모)</span><ChevronDown size={16} style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></div>
      {open && <div className="abd">{ROWS.map(([l, v]) => <div className="arow" key={l}><span className="lbl">{l}</span><span className="val">{v}</span></div>)}<div className="chnote" style={{ marginTop: 11 }}>※ 적립률·지원한도·재원은 운영 정책 및 참여기관 협약에 따라 설정됩니다. 본 화면은 관리자 설정 예시(데모)입니다.</div></div>}
    </div>
  );
}
function InsurancePlanCompare() {
  const COLS = ["5세대 실손보험", "노후실손보험", "유병력자 실손보험"];
  const COVER = [
    ["가입 연령", ["0~65세(상품별 ~75세)", "50~75세", "~70세 · 간편심사"]],
    ["자기부담 (급여)", ["20%", "20%", "30%"]],
    ["자기부담 (비급여)", ["중증 30% · 비중증 50%", "30%", "30% (입원 최소 10만·외래 2만)"]],
    ["보장 한도 (입원·연간)", ["급여 5,000만원 · 비급여 중증 5,000만원 / 비중증 1,000만원", "상해·질병 각 1억원 · 요양병원 5,000만원 · 상급병실 2,000만원", "급여+비급여 연 5,000만원"]],
    ["보장 한도 (통원·외래)", ["급여 회당 20만원 · 비급여 별도 한도", "회당 100만원 (외래·약제)", "연 180회 · 회당 자기부담 후 보장"]],
    ["주요 보장 구조", ["중증 비급여 특약1 + 일반 특약2 · 임신/출산 급여 신규", "노후 의료비 대비 · 요양병원·상급병실 보장", "최근 2년 치료이력만 심사 · 만성질환자 가입"]],
    ["특징", ["비급여 축소·보험료 4세대比 약 30%↓ · 도수/체외충격파/비급여주사 제외", "고령층 대상 · 자기부담↑·보험료↓", "고혈압·당뇨 등 유병자도 가입 · 도수/MRI 등 제외"]],
  ];
  const AGES = ["30대", "40대", "50대", "60대", "70대", "80대", "90대"];
  const FEE = {
    "5세대 실손보험": ["6,000", "8,700", "12,300", "19,300", "28,000*", "40,000*", "—"],
    "노후실손보험": ["—", "—", "15,000", "22,000", "33,000", "48,000", "62,000"],
    "유병력자 실손보험": ["22,000", "28,000", "36,000", "48,000", "65,000", "85,000*", "—"],
  };
  return (
    <>
      <div className="bklbl2"><FileText size={16} color="#2563EB" /> 실손보험별 보장내용 비교</div>
      <div className="ipstblwrap">
        <table className="ipstbl">
          <thead><tr><th>구분</th>{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{COVER.map(([k, vals]) => <tr key={k}><td className="rh">{k}</td>{vals.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="bklbl2" style={{ marginTop: 14 }}><Coins size={16} color="#2563EB" /> 연령대별 월 보험료 예시 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 남성·표준체·갱신형 기준 추정</span></div>
      <div className="ipstblwrap">
        <table className="ipstbl fee">
          <thead><tr><th>연령</th>{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{AGES.map((a, r) => <tr key={a}><td className="rh">{a}</td>{COLS.map((c) => <td key={c}>{FEE[c][r] === "—" ? <span className="na">—</span> : FEE[c][r] + "원"}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="chnote">※ 월 보험료는 <b>예시·추정치</b>(남성·표준체·갱신형 기준)로 성별·보험사·갱신주기·할인특약에 따라 달라집니다. <b>‘*’</b>는 신규가입 연령 초과로 <b>갱신 유지 시</b> 예상치, <b>‘—’</b>는 해당 보험의 가입연령에 해당하지 않음을 뜻합니다. 5세대 실손은 2026.5 출시 기준이며, 정확한 보장·보험료는 보험사 상품설명서·비교공시를 확인하고 보험설계사·대리점 상담이 필요합니다.</div>
    </>
  );
}
function InsurancePolicySection() {
  const report = useReport();
  const FLOW = [["heartpulse", "건강활동", "검진·쇼핑·영양·운동"], ["coin", "건강자산 적립", "활동별 HTK 적립"], ["wallet", "건강금융지갑", "자동 반영·관리"], ["badge", "실손보험 지원", "보험료·의료비 재원"], ["heart", "의료비 부담 완화", "치료비 걱정 ↓"]];
  const ACTS = [["calendar", "건강검진 예약 및 수검"], ["capsule", "건강식품 구매"], ["badge", "정밀영양 서비스 이용"], ["heart", "건강관리 프로그램 참여"], ["gift", "건강쇼핑 이용"], ["heartpulse", "운동 및 건강행동 실천"]];
  const ORGS = ["노인나눔재단", "한국의료재단", "사회적기업", "대기업 ESG 기금", "공익재단·기부기관"];
  return (
    <div style={{ marginTop: 4 }}>
      <div className="ipshero">
        <h2>Health-InsurFin Tech 실손보험지원</h2>
        <div className="sub">건강생활이 건강자산이 되고, 건강자산이 의료비 부담을 줄이는 지속가능한 포용적 실손보험 지원 모델</div>
        <div className="desc">HI-Fin Tech는 회원의 일상 건강활동(건강검진·건강쇼핑·정밀영양·건강관리)에서 발생하는 건강자산을 건강금융지갑에 적립해 실손보험료·의료비 부담 완화 재원으로 활용합니다. 특히 <b>고령층(노인)·유병자·보험 사각지대 계층</b>처럼 민간 실손보험에서 배제되기 쉬운 분들을 사회공헌 재원과 연계해 함께 보장하는 <b>포용적 건강보험 생태계</b>를 지향합니다.</div>
      </div>
      <div className="bklbl2"><HeartHandshake size={16} color="#2563EB" /> 보험 사각지대 없는 포용적 실손 지원</div>
      <div className="ipsinclsub">연령·기왕증·경제적 사유로 민간 실손보험 가입이 어려운 계층을, 건강활동 적립금과 사회공헌·ESG 재원으로 함께 보장합니다.</div>
      <div className="ipsincl">
        {[
          ["노인 (고령층)", "65세 이상 고령층", "연령 상한·보험료 급증으로 신규 실손 가입이 어렵습니다.", ["건강활동 적립금으로 의료비 자기부담 완화", "간편심사·무심사형 보장 연계 안내", "사회공헌·ESG 재원 매칭 지원"], HeartHandshake, "#2563EB", "#E8F1FE"],
          ["유병자 (만성질환자)", "고혈압·당뇨 등 만성질환 보유자", "기왕증으로 인수 거절·보험료 할증되는 경우가 많습니다.", ["유병자 실손(간편심사 보험) 연계 안내", "건강관리 프로그램으로 위험도 개선", "건강 개선 실적에 따른 적립·보장 강화"], Activity, "#16A34A", "#E7F8EE"],
          ["보험 사각지대 계층", "저소득·청년·1인가구·플랫폼 노동자", "보험료 부담으로 실손에 미가입한 사각지대입니다.", ["일상 건강소비 기반 무상·저비용 임베디드 보장", "공익재단·기부 매칭으로 보험료 지원", "디지털 간편 가입으로 진입장벽 제거"], ShieldCheck, "#7C3AED", "#F1ECFE"],
        ].map(([t, who, diff, sup, Ic, c, bg]) => (
          <div className="ipsinclc" key={t} style={{ borderTopColor: c }}>
            <div className="ih"><span className="ic" style={{ background: bg, color: c }}><Ic size={20} /></span><div><b>{t}</b><span className="who">{who}</span></div></div>
            <div className="diff"><AlertTriangle size={12} /> {diff}</div>
            <ul>{sup.map((s) => <li key={s}><Check size={13} color={c} /> {s}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="ipsflow">
        {FLOW.map(([ic, b, p], i) => (
          <React.Fragment key={b}>
            <div className="st"><div className="ic"><Art name={ic} size={20} /></div><b>{b}</b><p>{p}</p></div>
            {i < FLOW.length - 1 && <div className="ar"><ChevronRight size={18} /></div>}
          </React.Fragment>
        ))}
      </div>
      <div className="bklbl2"><Coins size={16} color="#2563EB" /> 건강자산 적립 구조</div>
      <div className="ipsacts">
        {ACTS.map(([ic, name]) => (
          <div className="ipsact" key={name}>
            <div className="ah"><span className="ic"><Art name={ic} size={18} /></span><b>{name}</b></div>
            <div className="steps">
              <div className="s"><span className="d" /> 건강자산 적립</div><div className="ln" />
              <div className="s"><span className="d" /> 건강금융지갑 반영</div><div className="ln" />
              <div className="s"><span className="d" /> 실손보험 지원재원 활용</div>
            </div>
          </div>
        ))}
      </div>
      <div className="bklbl2"><Banknote size={16} color="#2563EB" /> 실손보험 지원 재원</div>
      <div className="ipsfund">
        <div className="fc personal">
          <div className="ft"><CircleUserRound size={16} color="#2563EB" /> 개인 건강자산 재원</div>
          <ul>
            <li><Check size={13} /> 플랫폼 내 건강제품·서비스 소비에서 발생하는 개인 적립금</li>
            <li><Check size={13} /> 건강금융지갑에 자동 적립</li>
            <li><Check size={13} /> 실손보험료 및 의료비 부담 완화에 활용</li>
          </ul>
        </div>
        <div className="fc">
          <div className="ft"><HeartHandshake size={16} color="#2563EB" /> 사회공헌 연계 재원</div>
          <div className="orgs">{ORGS.map((o) => <span key={o}>{o}</span>)}</div>
          <div className="fnote">고령층 및 의료취약계층 지원을 위해 재단, 사회적기업, 대기업 ESG 기금, 공익재단과의 협력을 통해 실손보험 지원 재원을 확대합니다.</div>
        </div>
      </div>
      <div className="bklbl2"><Wallet size={16} color="#2563EB" /> 건강금융지갑 · 실손 지원 현황</div>
      <HealthAssetWallet />
      <div className="bklbl2"><ShieldCheck size={16} color="#2563EB" /> 실손보험 추천</div>
      <InsuranceRecommendationCard report={report} />
      <div className="chnote" style={{ marginTop: 8 }}>※ 위 추천은 회원의 연령·건강검진 결과·만성질환·기존 보험 보유 여부를 기준으로 한 <b>안내</b>이며, 실제 보험 설명 및 청약은 보험업법상 자격을 보유한 <b>보험대리점 또는 보험설계사</b>가 수행합니다.</div>
      <InsurancePlanCompare />
      <div className="bklbl2"><Settings size={16} color="#2563EB" /> 관리자 · 정책 관리</div>
      <InsuranceSupportAdmin />
      <div className="ipscompliance"><b>안내</b> · 본 서비스는 회원의 건강관리 및 보험정보 안내를 위한 서비스이며, 실제 보험계약의 체결, 인수심사, 보험료, 보장내용 및 보험금 지급 여부는 해당 보험회사와 약관에 따라 결정됩니다. 보험상품의 설명 및 청약은 보험업법상 자격을 보유한 보험대리점 또는 보험설계사가 수행합니다. 사회공헌 재원 및 보험료 지원은 참여기관과의 협약, 기금 조성 및 법적 검토 결과에 따라 달라질 수 있습니다.</div>
    </div>
  );
}

function InsuranceSection({ onGo }) {
  const [tab, setTab] = useState("embed");
  const [modal, setModal] = useState(null);
  const [enroll, setEnroll] = useState(false);
  const [cover, setCover] = useState(null);
  const go = onGo || (() => {});
  const tabs = [["embed", "건강검진대비보험", ShieldCheck], ["policy", "실손보험지원", HeartHandshake], ["sports", "스포츠 임베디드 보험", Trophy], ["premium", "맞춤 헬스케어 보험", Sparkles], ["join", "보험가입", FileText], ["coverage", "보장조회", Search], ["claim", "보험금청구", Coins], ["ai", "AI보험상담", MessageSquare]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="insurance" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>보험·치료비</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강검진대비보험 · 가입 · 보장조회 · 청구 · AI상담 — 치료비 걱정 없는 임베디드 보험</div></div></div>
      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "sports" && <SportsInsuranceSection onGo={go} />}
      {tab === "policy" && <InsurancePolicySection />}
      {tab === "premium" && <PremiumPolicySection />}
      {tab === "embed" && (<>
        <div className="benefit">
          <span><Art name="check" size={16} /> 추가 보험료 0원</span>
          <span><Art name="calendar" size={16} /> 검진 연계 자동가입</span>
          <span><Art name="badge" size={16} /> NFT 보험증서</span>
          <span><Art name="doc" size={16} /> 검진 결과 자동 연동</span>
        </div>
        <div className="card">
          <div className="rct"><ShieldCheck size={18} color="#2563EB" /> 건강검진 대비보험 <span style={{ fontSize: 11.5, color: "var(--soft)", fontWeight: 600 }}>· 현대해상 전속 보험대리점 글로벌예방금융㈜ 및 GA코리아와의 전략적 제휴 운영</span><span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--green)", background: "#E7F8EE", padding: "4px 10px", borderRadius: 999 }}>검진 연계 자동가입</span></div>
          <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.65 }}>건강검진을 예약하면 <b>추가 보험료 없이 검진 대비보험이 자동 가입</b>됩니다. 검진 전후 발견되기 쉬운 <b>암·뇌졸중·급성심근경색·정신질환</b> 등을 진단·수술비로 보장해 치료비 부담을 덜어드립니다.</p>
          <button className="cbtn pri" onClick={() => setEnroll(true)}><CalendarCheck size={15} /> 검진 예약하고 자동가입</button>
        </div>

        <div className="card">
          <div className="rct"><Coins size={18} color="#2563EB" /> 플랜별 담보·보장금액</div>
          <table className="instbl">
            <thead><tr><th>담보</th><th>기본형<div style={{ fontSize: 10, color: "var(--soft)", fontWeight: 600 }}>국가검진</div></th><th>표준형<div style={{ fontSize: 10, color: "var(--soft)", fontWeight: 600 }}>종합검진</div></th><th>고급형<div style={{ fontSize: 10, color: "var(--soft)", fontWeight: 600 }}>프리미엄검진</div></th><th className="hl">심리케어<br />프리미엄<div style={{ fontSize: 10, color: "#0c4a6e", fontWeight: 600 }}>선택형</div></th></tr></thead>
            <tbody>{CHECK_COVERS.map((c, i) => <tr key={i} style={{ cursor: "pointer" }} onClick={() => setCover(c[1])} title="약관 상세 보기"><td>{c[1]}</td><td>{c[2]}</td><td>{c[3]}</td><td>{c[4]}</td><td className="hl">{c[5]}</td></tr>)}</tbody>
          </table>
          <div className="chnote" style={{ marginTop: 8 }}>※ 암 진단금은 기타암 제외(갑상선암·기타피부암·제자리암·경계성종양 해당없음). 정신질환 진단은 <b>심리케어프리미엄(선택형)</b>에만 300만원 포함. 보이스피싱은 전 플랜 300만원(보장비율 70%).</div>
        </div>

        <div className="bklbl" style={{ margin: "2px 0 8px" }}><ShieldCheck size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 담보별 보장 상세 · 특별약관 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 클릭하면 약관·보장표 조회</span></div>
        {CHECK_COVERS.map((c, i) => (
          <div className="adv" key={i} style={{ cursor: "pointer" }} onClick={() => setCover(c[1])} title="약관 상세 보기">
            <span className="ic" style={{ background: "#EAF0FE" }}><Art name={c[0]} size={20} /></span>
            <div style={{ flex: 1 }}><b>{c[1]}</b><p>{c[7]}</p><div style={{ fontSize: 10.5, color: "#7C3AED", fontWeight: 700, marginTop: 3 }}><FileText size={11} style={{ verticalAlign: "-2px" }} /> {c[6]} · 약관 보기 ›</div></div>
            <div style={{ alignSelf: "center", textAlign: "right", whiteSpace: "nowrap" }}><div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--blue)" }}>{c[5]}</div><div style={{ fontSize: 10, color: "var(--soft)" }}>최대 보장</div></div>
          </div>
        ))}

        <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
          <div className="rct"><CalendarCheck size={18} color="#2F5BEA" /> 검진 예약 → 자동가입 절차</div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,#0E9F6E 0%,#16A34A 45%,#0EA5E9 100%)", color: "#fff", borderRadius: 14, padding: "14px 16px", margin: "2px 0 14px", boxShadow: "0 14px 28px -16px rgba(14,165,233,.7)", position: "relative", overflow: "hidden" }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><Art name="coin" size={28} /></span>
            <div style={{ fontSize: 13.8, fontWeight: 700, lineHeight: 1.55 }}>검진 예약을 하면 자동으로 <b style={{ color: "#FDE68A" }}>건강토큰(Health Token)</b>이 적립되어 <b style={{ color: "#FDE68A" }}>무상 건강검진보험</b>이 가입됩니다.</div>
          </div>
          {[["검진 예약", "검진센터·일정을 예약하면 건강토큰(Health Token)이 적립되며 검진보험 가입이 함께 시작됩니다."], ["플랜 선택", "기본형·표준형·고급형·심리케어프리미엄 중 선택 (추가 보험료 0원·무상)."], ["자동가입 확정", "적립된 건강토큰으로 무상 가입 — 검진 15일 전부터 3개월간 보장(3개월 단위 연장)."], ["NFT 보험증서·결과 연동", "건강지갑에 SBT 증서 발행, 검진 결과가 자동 연동됩니다."], ["진단·수술 시 자동청구", "보장 사유 발생 시 검진·진료 기록으로 간편 청구."]].map(([t, d], i) => (
            <div className="istep" key={i}><span className="sn">{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="cbtn pri" style={{ margin: 0 }} onClick={() => setEnroll(true)}><CalendarCheck size={15} /> 검진 예약·자동가입 시작</button>
            <button className="cbtn" style={{ margin: 0, width: "auto", padding: "11px 16px" }} onClick={() => go("checkup")}><Building2 size={14} /> 검진센터 보기</button>
          </div>
        </div>
        <div className="chnote">※ 보험계약기간은 건강검진 15일 전부터 3개월(진단·수술 시까지)이며 3개월 단위로 연장 가능합니다. 보장금액·약관은 현대해상 전속 보험대리점 글로벌예방금융㈜ 및 GA코리아와의 전략적 제휴 운영 자료 기준 정리이며, 실제 가입·보장은 보험사 상품·고지·심사 및 정식 라이선스 채널에 따릅니다.</div>
      </>)}

      {tab === "join" && <InsJoin onGo={go} />}

      {tab === "coverage" && (<>
        <div className="benefit"><span><Art name="search" size={16} /> 보유 보험 통합 조회</span><span><Art name="badge" size={16} /> 보장 항목·한도</span><span><Art name="sparkle" size={16} /> 부족 보장 분석</span></div>
        {INS_COVERAGE.map((c, i) => (
          <div className="card" key={i} style={c.status === "미가입" ? { border: "1.5px dashed #FBCFB6" } : {}}>
            <div className="rct" style={{ marginBottom: 8 }}><ShieldCheck size={17} color={c.status === "보유" ? "#16A34A" : "#F59E0B"} /> {c.name}<span className="cbadge" style={{ marginLeft: 8, color: c.status === "보유" ? "#15803D" : "#B45309", background: c.status === "보유" ? "#E7F8EE" : "#FEF3E2" }}>{c.status}</span></div>
            {c.rows.map(([l, v], j) => <div className="costrow" key={j}><span className="cl">{l}</span><span className="cv" style={{ color: c.status === "보유" ? "var(--green)" : "var(--muted)" }}>{v}</span><span className="ca">{c.status === "보유" ? "보장 중" : "미적용"}</span></div>)}
            <p style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 8 }}>{c.note}</p>
            {c.status === "미가입" && <button className="cbtn" style={{ marginTop: 4 }} onClick={() => setTab("join")}><FileText size={14} /> 이 보장 가입하기</button>}
          </div>
        ))}
        <div className="chnote">※ 보장 내역은 데모 예시입니다. 실제 보유계약은 신용정보원·보험사 연동(본인 인증) 시 조회됩니다.</div>
      </>)}

      {tab === "claim" && (<>
        <div className="card">
          <div className="rct"><Coins size={18} color="#16A34A" /> 청구 가능 건</div>
          <div className="resitem"><span className="ic" style={{ background: "#E8F1FE" }}><Art name="calendar" size={20} /></span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>건강검진 (복부초음파) · 2024.12.26</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>검진보험 진단지원금 청구 가능 · 예상 100,000원</div></div>
            <button className="cbtn" style={{ width: "auto", margin: 0, padding: "9px 14px" }} onClick={() => setModal({ title: "보험금 청구", sub: "원클릭 청구가 접수되었습니다", items: [["coin", "청구 금액", "예상 100,000원 (심사 후 확정)"], ["doc", "필요 서류", "검진 결과·영수증은 검진센터에서 자동 연동"]] })}>원클릭 청구</button></div>
          <p style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 4 }}>검진·진료 기록이 연동되어 서류 제출 없이 간편하게 청구됩니다.</p>
        </div>
        <div className="card">
          <div className="rct"><FileText size={18} color="#7C3AED" /> 청구 이력</div>
          {[["2024.03.18", "통원 치료비", "지급 52,000원"], ["2023.11.02", "건강검진 진단지원금", "지급 100,000원"]].map(([d, t, v], i) => (
            <div className="costrow" key={i}><span className="cl">{d} · {t}</span><span className="cv" style={{ color: "var(--green)" }}>{v}</span><span className="ca">지급완료</span></div>
          ))}
        </div>
        <div className="chnote">※ 청구·지급은 보험사 심사 결과에 따라 확정됩니다. 본 화면은 데모입니다.</div>
      </>)}

      {tab === "ai" && (<>
        <div className="airec">
          <div className="at"><MessageSquare size={16} color="#7C3AED" /> AI 보험상담</div>
          <div className="ap">조성래님 건강상태와 보유 보장을 바탕으로 부족한 보장·치료비 대비를 안내해 드려요. 궁금한 것을 물어보세요.</div>
        </div>
        <div className="card">
          <div className="rct"><Sparkles size={18} color="#2F5BEA" /> 자주 묻는 질문</div>
          {["췌장암 경고인데 어떤 보장이 필요할까요?", "검진보험은 무엇을 보장하나요?", "실손보험 청구는 어떻게 하나요?", "보험료를 줄이는 방법이 있나요?"].map((q, i) => (
            <div className="adv" key={i} style={{ cursor: "pointer" }} onClick={() => setModal({ title: "AI 보험상담", sub: "상담이 연결되었습니다", items: [["chat", q, "AI가 1차 안내 후, 정식 라이선스 설계사 상담으로 연결합니다."]] })}><span className="ic" style={{ background: "#EAF0FE" }}><Art name="chat" size={20} /></span><div style={{ flex: 1 }}><b style={{ fontWeight: 700, fontSize: 13 }}>{q}</b></div><ChevronRight size={16} color="#9AA6BC" /></div>
          ))}
        </div>
        <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
          <div className="rct"><HeartHandshake size={18} color="#2F5BEA" /> 전문 상담사 연결</div>
          <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>보험 가입·보장설계는 <b>정식 라이선스 설계사</b>가 고지·심사 안내와 함께 도와드립니다. 상담을 신청하면 채널로 연결됩니다.</p>
          <button className="cbtn pri" onClick={() => setModal({ title: "보험상담 신청", sub: "상담 신청이 접수되었습니다", items: [["chat", "AI 1차 분석 전달", "조성래님 건강·보장 분석을 상담사에게 전달합니다."], ["badge", "정식 채널 연결", "라이선스 설계사가 연락처로 상담을 진행합니다."]] })}><MessageSquare size={15} /> 보험상담 신청</button>
        </div>
        <div className="chnote">※ AI 안내는 참고용이며, 보험 권유·가입·계약은 보험업법상 정식 라이선스 채널을 통해서만 이루어집니다.</div>
      </>)}

      {cover && <CoverDetailModal name={cover} onClose={() => setCover(null)} />}
      {enroll && <EnrollModal onClose={() => setEnroll(false)} onGo={go} />}
      {modal && <InsModal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ====================== 건강금융지갑 ====================== */
