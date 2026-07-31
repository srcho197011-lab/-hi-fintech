/* ══ 과업B(2026-07-31) — 운영 주체 자격 표시: 금융위 등록 보험대리점 공식 배지·상세 카드·고지 라인 ══
   문구 확정본(임의 수정 금지): 글로벌예방금융(주) · 보험대리점 등록번호 제2025060038호
   근거: 보험업법 제87조 제1항 및 보험업감독규정 제4-4조 제3항 */
const AGENCY_INFO = {
  corp: "글로벌예방금융(주)", regNo: "제2025060038호",
  basis: "보험업법 제87조 제1항 및 보험업감독규정 제4-4조 제3항",
  full: "본 보험·치료비 서비스는 보험업법 제87조 제1항 및 보험업감독규정 제4-4조 제3항에 근거하여 등록된 보험대리점 글로벌예방금융(주)가 운영합니다.",
};
function InsAgencyBadge({ onGo }) {
  const [open, setOpen] = useState(false);
  return (<>
    <button onClick={() => setOpen(true)} title="보험대리점 등록 정보 보기" aria-label="보험대리점 등록 정보"
      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(125deg,#0B1F4B,#14337A)", border: "1px solid #C9A84C", borderRadius: 11, padding: "8px 13px", cursor: "pointer", flexShrink: 0, boxShadow: "0 10px 22px -14px rgba(11,31,75,.85)" }}>
      <ShieldCheck size={17} color="#F5D98A" />
      <span style={{ textAlign: "left", lineHeight: 1.35 }}>
        <b style={{ display: "block", fontSize: 11.5, color: "#fff", letterSpacing: .2 }}>금융위 등록 보험대리점</b>
        <span style={{ fontSize: 10.5, color: "#F5D98A", fontWeight: 700 }}>{AGENCY_INFO.corp} · {AGENCY_INFO.regNo}</span>
      </span>
    </button>
    {open && (
      <div className="bkov" onClick={() => setOpen(false)}>
        <div className="bk" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="bkh"><div className="bt">보험대리점 등록 정보</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setOpen(false)}><X size={20} color="#8A97AE" /></button></div>
          <div className="bkb">
            <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(125deg,#0B1F4B,#14337A)", borderRadius: 13, padding: "16px 17px", boxShadow: "0 14px 28px -18px rgba(11,31,75,.9)" }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(245,217,138,.16)", border: "1px solid #C9A84C", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={25} color="#F5D98A" /></span>
              <div style={{ lineHeight: 1.5 }}>
                <b style={{ display: "block", fontSize: 16.5, color: "#fff" }}>{AGENCY_INFO.corp}</b>
                <span style={{ fontSize: 12.5, color: "#F5D98A", fontWeight: 800 }}>보험대리점 등록번호 {AGENCY_INFO.regNo}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, margin: "4px 2px" }}>{AGENCY_INFO.full}</p>
            <div style={{ fontSize: 12.3, color: "#475569", background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: 11, padding: "11px 13px", lineHeight: 1.8 }}>
              · 등록 근거: <b>{AGENCY_INFO.basis}</b><br />
              · 인수사: 현대해상(전속 제휴)<br />
              · 상담·모집은 <b>라이선스 상담사</b>가 수행합니다.
            </div>
            {onGo && <button className="cbtn" style={{ margin: 0 }} onClick={() => { setOpen(false); onGo("trust"); }}><ShieldCheck size={15} /> 신뢰 센터 보기</button>}
          </div>
        </div>
      </div>
    )}
  </>);
}
/* 섹션 하단 고지부 공용 1줄 — 기존 안내문 앞에 배치 */
function InsAgencyLine() {
  return <div className="ipscompliance" style={{ borderColor: "#C7D8FA", background: "#F8FAFF" }}><b>판매 주체</b> · {AGENCY_INFO.full} (등록번호 {AGENCY_INFO.regNo} · {AGENCY_INFO.basis})</div>;
}

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
];
// 담보: [art, 담보명, 기본형, 표준형, 고급형, (예비), 특약, 비고/정의]
const CHECK_COVERS = [
  ["immune", "암 진단금", "200만원", "500만원", "1,000만원", "1,000만원", "암치료비보장 특별약관(I)", "암 진단확정 시 1회 (기타암 제외 / 갑상선암·기타피부암·제자리암·경계성종양 해당없음)"],
  ["heartpulse", "급성심근경색", "200만원", "500만원", "1,000만원", "1,000만원", "급성심근경색증치료비보장 특별약관", "급성심근경색증 진단확정 시 가입금액 전액 1회"],
  ["brain", "뇌졸중", "200만원", "500만원", "1,000만원", "1,000만원", "뇌졸중치료비보장 특별약관", "뇌졸중 진단확정 시 가입금액 전액 1회"],
  ["device", "21대 질병 수술비", "100만원", "200만원", "300만원", "300만원", "질병수술비보장 특별약관", "13대·다발성3대·특정5대 질병 수술 1회당 지급"],
  ["badge", "마음케어진단", "100만원", "200만원", "300만원", "300만원", "정신질환진단보장 특별약관", "정신질환(F코드) 최초 진단확정 시 1회"],
  ["lock", "보이스피싱", "300만원", "300만원", "300만원", "300만원", "전화금융사기보장 특별약관", "전화금융사기 피해 보장 (보장비율 70%)"],
];

function EnrollModal({ onClose, onGo }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("standard");
  const [date, setDate] = useState(null);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 14); return d; });
  const idx = plan === "basic" ? 2 : plan === "standard" ? 3 : 4;
  const planName = CHECK_PLANS.find((p) => p.key === plan).name;
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">검진 예약 · 검진보험 자동가입{step < 4 ? ` (${step}/3)` : ""}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dbody">
          {step === 1 && (<>
            <div className="dsec"><div className="dh">1. 검진보험 플랜 선택</div>
              <div className="plansel">{CHECK_PLANS.map((p) => <div key={p.key} className={`pl ${plan === p.key ? "on" : ""}`} onClick={() => setPlan(p.key)}><div className="pn">{p.name}</div><div className="pp">{p.sub}{p.key === "basic" ? " · 암 200" : p.key === "standard" ? " · 암 500" : " · 암 1,000"}</div></div>)}</div>
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
            <div className="chnote" style={{ textAlign: "left", marginTop: 14 }}>※ 보험 가입·청구·상담은 <b>정식 라이선스 설계사·보험사 채널</b>을 통해 진행됩니다. 본 화면은 정보 제공·연결 목적의 예시이며, 보험료·보장은 상품·고지·심사에 따라 달라집니다.</div>
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
            <MiniTbl head={["구분", "기본형", "표준형", "고급형"]} rows={[["보험가입금액", ...d.amounts.slice(0, 3)]]} />
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
  const [info, setInfo] = useState({ name: PT.name, birth: "1970.11.20", sex: "남", phone: "", addr: PT.addr });
  // 가드레일 ⓟ(진단 #46): 주민등록번호 평문 수집 폼 제거 — 실번호 입력 대신 PASS 본인인증(시연) 완료 플래그로 대체
  const [rrnVerified, setRrnVerified] = useState(false);
  const rrnOk = rrnVerified;
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
          {typeof TrustLine === "function" && <TrustLine ctx="rrn" />}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#B45309", marginBottom: 5 }}><Lock size={11} style={{ verticalAlign: "-2px" }} /> 실명 확인 <span style={{ color: "var(--soft)", fontWeight: 600 }}>· 건강검진보험 가입 시 필수</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 9, padding: "9px 12px", background: "#F8FAFC", color: "var(--soft)", fontSize: 13, letterSpacing: "2px" }}>●●●●●● — ●●●●●●●</div>
            <button type="button" onClick={() => { setRrnVerified(true); if (typeof toast === "function") toast("PASS 본인인증이 완료되었습니다(시연)."); }} disabled={rrnVerified} style={{ border: "1px solid var(--border)", background: rrnVerified ? "#E7F8EE" : "#2563EB", borderRadius: 9, padding: "9px 13px", cursor: "pointer", color: rrnVerified ? "#15803D" : "#fff", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}><ShieldCheck size={13} /> {rrnVerified ? "인증 완료 ✓" : "PASS 본인인증(시연)"}</button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 5 }}>※ 시연 환경에서는 <b>주민등록번호를 수집하지 않습니다</b> — 실서비스는 PASS 간편 본인인증으로 대체되며, 인수심사 정보는 보험사에 암호화 전송됩니다.</div>
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
      <button className="cbtn pri" style={{ marginTop: 12, opacity: allReq && rrnOk ? 1 : .5 }} disabled={!(allReq && rrnOk)} onClick={() => setDone(true)}><ShieldCheck size={15} /> {!allReq ? "필수 항목에 모두 동의해 주세요" : !rrnOk ? "PASS 본인인증을 완료해 주세요" : "전자서명 후 건강검진보험 가입 동의 제출"}</button>
      <div className="chnote" style={{ marginTop: 8 }}>※ 보험가입·청약·심사는 정식 라이선스 보험대리점 글로벌예방금융㈜·GA코리아㈜ 및 보험사를 통해 진행됩니다. 본 화면은 동의서 양식 예시입니다.</div>
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
/* ── 하이 — 보험·보장 대화 상담(AI 주치의 형태) ── */
function _insBold(s) {
  return String(s).split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**")) ? <b key={i}>{p.slice(2, -2)}</b> : <React.Fragment key={i}>{p}</React.Fragment>);
}
/* ── 보험 AI 채팅 — 건강×보험 융합 컨텍스트 & 함수 라우팅(Tool Calling) ── */
function _insWonS(n) { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000).toFixed(n % 100000000 ? 1 : 0) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; }
function _insParseCost(text) { let m = String(text).match(/([0-9][0-9,]*)\s*만\s*원?/); if (m) return parseInt(m[1].replace(/,/g, ""), 10) * 10000; m = String(text).match(/([0-9][0-9,]{2,})\s*원/); if (m) return parseInt(m[1].replace(/,/g, ""), 10); return null; }
function _insTreat(text) { const t = String(text); if (/도수|물리치료/.test(t)) return { t: "도수치료", def: 100000 }; if (/mri|엠알아이/i.test(t)) return { t: "MRI", def: 500000 }; if (/비급여\s*주사|주사/.test(t)) return { t: "비급여주사", def: 100000 }; if (/입원/.test(t)) return { t: "입원", def: 3000000 }; if (/비급여/.test(t)) return { t: "비급여 치료", def: 300000 }; return { t: "통원 진료", def: 80000 }; }
/* 회원 컨텍스트(Mx) × 질문 → 융합 함수 호출 → 카드 응답. null이면 일반 약관상담으로 폴백 */
function _insFusionRoute(text, Mx, nm) {
  if (!Mx) return null;
  const HAND = "맞춤 헬스케어 보험 상담", cite = "※ 예시 기준 · 실제 보장·보험료·가입가능 여부는 약관·인수심사로 확정";
  const who = nm ? nm + "님" : "회원님";
  // 1) 내 실손 세대/정보
  if (/몇\s*세대|내\s*실손|실손\s*(정보|뭐|어떤|가입|은|이|현황)|내\s*보험\s*(뭐|어떤|정보|현황)/.test(text)) {
    const ins = Mx._ins || (typeof memberInsurance === "function" ? memberInsurance(Mx) : null); if (!ins) return null; const s = ins.silson;
    if (!s.enrolled) return { bubbles: [{ kind: "text", text: `${who}은 현재 **실손보험 미가입** 상태예요. 검진에서 이상이 나와도 치료비 안전망이 없어, 4·5세대 실손 또는 (해당 시)유병자·노후 실손 가입 검토를 권해요.` }, { kind: "card", card: { title: "🛡️ 내 실손 현황", items: ["가입: 미가입", "보장 공백: 치료비 전액 본인부담"], buttons: ["보장 공백 분석", HAND] } }], quicks: ["보장 공백 분석", "암보험 필요할까?", HAND] };
    return { bubbles: [{ kind: "text", text: `${who}의 실손은 **${s.gen}**(${s.type})이에요. ${s.feature}` }, { kind: "card", card: { title: `🛡️ 내 실손 — ${s.gen}`, items: [`가입시기: ${s.period}${s.enrollYear ? ` (${s.enrollYear}년 가입)` : ""}`, `급여 자기부담 ${s.coGen} · 비급여 ${s.coNon}`, `통원 회당 ${_insWonS(s.outLimit)} · 입원 ${_insWonS(s.inLimit)}`, `갱신 ${s.renew} · 재가입 ${s.reEnroll}`, `비급여 특약: ${s.riderNote}`, `월 보험료(추정) ${_insWonS(s.monthly)}`, `중대질환 진단비: ${ins.riders.length ? ins.riders.map((r) => r.cat).join("·") + " 보유" : "미보유"}`], buttons: ["도수치료 받으면 얼마 나와?", "세대 전환 유불리", "보장 공백 분석"] } }, { kind: "text", text: cite }], quicks: ["도수치료 받으면 얼마 나와?", "세대 전환 유불리", "보장 공백 분석", HAND] };
  }
  // 2) 예상 본인부담금 계산
  if (/얼마\s*(나와|드나|나오|내|들|듦|나감)|본인\s*부담|자기\s*부담|도수|mri|엠알아이|주사.*얼마|치료비.*(얼마|계산)|계산해/.test(text)) {
    const tr = _insTreat(text), cost = _insParseCost(text) || tr.def;
    const r = (typeof calcOutOfPocket === "function") ? calcOutOfPocket(Mx, tr.t, cost) : null; if (!r) return null;
    return { bubbles: [{ kind: "text", text: `**${tr.t}** ${_insWonS(cost)} 기준, ${r.gen} 실손으로 계산하면 예상 **본인부담금은 약 ${_insWonS(r.oop)}**이에요.` }, { kind: "card", card: { title: `💰 예상 본인부담 — ${tr.t}`, items: [`치료비: ${_insWonS(r.cost)} (${r.cat})`, `실손 보장(추정): ${_insWonS(r.covered)}`, `내 본인부담: 약 ${_insWonS(r.oop)}`, r.note], buttons: ["세대 전환 유불리", HAND] } }, { kind: "text", text: cite }], quicks: ["MRI 찍으면 얼마?", "세대 전환 유불리", "보장 공백 분석", HAND] };
  }
  // 3) 세대 전환 시뮬레이션
  if (/전환|바꿀|갈아|4세대|5세대|세대\s*(전환|변경|바꿔)|옮길|유불리/.test(text)) {
    const r = (typeof simulateGenerationSwitch === "function") ? simulateGenerationSwitch(Mx) : null; if (!r) return null;
    const items = [`현재: ${r.current.gen} · 월 ${_insWonS(r.current.monthly)} · 비급여 자기부담 ${r.current.coNon}`];
    r.options.forEach((o) => items.push(`${o.gen} 전환: 월 ${_insWonS(o.monthly)} (${o.saveMonthly > 0 ? "−" + _insWonS(o.saveMonthly) : "+" + _insWonS(-o.saveMonthly)}/월) · ${o.coDelta}`));
    const bub = [{ kind: "text", text: r.recommend }, { kind: "card", card: { title: "🔄 세대 전환 시뮬레이션", items, buttons: [HAND] } }];
    if (r.warning) bub.push({ kind: "text", text: `⚠️ ${r.warning}` });
    bub.push({ kind: "text", text: cite });
    return { bubbles: bub, quicks: ["보장 공백 분석", "도수치료 받으면 얼마 나와?", HAND] };
  }
  // 4) 보장 공백 / 필요 보험
  if (/공백|부족|필요한?\s*보험|암\s*보험\s*필요|어떤\s*보험|보험\s*추천|보장\s*(분석|점검|봐|괜찮|충분)|내\s*보험\s*(괜찮|충분|점검|봐)/.test(text)) {
    const g = (typeof analyzeCoverageGap === "function") ? analyzeCoverageGap(Mx) : null; if (!g) return null;
    const items = g.gaps.slice(0, 4).map((f) => `${f.sev === "crit" ? "🔴" : "🟠"} ${f.t} → ${f.a}`);
    if (!items.length) items.push("✅ 현재 건강위험 대비 보장이 충실합니다.");
    return { bubbles: [{ kind: "text", text: `${who} 건강데이터와 보험을 융합 분석한 결과, **보장 충실도 ${g.grade} · ${g.score}점**이에요.${g.top ? ` 가장 시급한 건 **${g.top.t}**입니다.` : ""}` }, { kind: "card", card: { title: "🧩 보장 공백 분석", items, buttons: [HAND, "세대 전환 유불리"] } }, { kind: "text", text: cite }], quicks: ["암보험 필요할까?", "도수치료 받으면 얼마 나와?", "세대 전환 유불리", HAND] };
  }
  // 5) 가족 보장 요약
  if (/가족|아내|배우자|남편|자녀|아이|우리\s*가족/.test(text)) {
    const f = (typeof getFamilyCoverageSummary === "function") ? getFamilyCoverageSummary(Mx) : null; if (!f) return null;
    if (!f.available) return { bubbles: [{ kind: "text", text: f.note }], quicks: ["보장 공백 분석", HAND] };
    return { bubbles: [{ kind: "text", text: "가족 보장 현황을 요약했어요. (동의 범위 내)" }, { kind: "card", card: { title: "👪 가족 보장 요약", items: f.rows.map((r) => `${r.name}${r.rel ? "(" + r.rel + ")" : ""} · ${r.gen} · ${r.grade} · ${r.topGap}`), buttons: [HAND] } }], quicks: ["보장 공백 분석", HAND] };
  }
  // 6) 검진지표 → 질환 → 보장(온톨로지)
  if (/혈당|당뇨|혈압|콜레스테롤|지질|간수치|지방간|신장|콩팥|폐|흡연|대사|암\s*위험|가족력/.test(text)) {
    const r = (typeof getDiseaseRiskCoverage === "function") ? getDiseaseRiskCoverage(Mx, text) : null; if (!r) return null;
    const items = [r.note].filter(Boolean).concat(r.mapped.map((x) => `${x.cat} 진단비: ${x.covered ? "보유 " + _insWonS(x.benefit) : "미보유 ⚠️"}`));
    return { bubbles: [{ kind: "text", text: `**${r.indicator}** 관련 위험은 **${r.disease}**로 이어질 수 있어요. 관련 중대질환 보장을 확인했어요.` }, { kind: "card", card: { title: `🔬 ${r.disease} 관련 보장`, items, buttons: ["보장 공백 분석", HAND] } }, { kind: "text", text: cite }], quicks: ["보장 공백 분석", "암보험 필요할까?", HAND] };
  }
  return null;
}
/* ══════════ 전용 「AI 보험·치료비 상담사」 업무 실행 층 (Phase1 §4 본체) ══════════
   insService(단일 출처)를 소비해 상담 중 실제 업무(납부·심사지급·재산정)를 실행한다.
   실수 방지: 금액이 움직이는 행동은 [진행 → 확인 카드 → ✅ 확정] 2단계 — 버튼 라벨에 대상 ID를 인코딩(무상태 확인 흐름).
   정책(INS_AI_POLICY) 상속: 가입·모집 요청은 실행하지 않고 GA 채널 안내로 응답. */
function _insServiceRoute(text, member) {
  if (typeof insService === "undefined" || !member) return null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  const rate = (typeof WALLET !== "undefined" && WALLET.rate) ? WALLET.rate : 10;
  // ⓐ 정책 가드 — 청약·모집 실행 요청은 정보 제공+GA 안내로 한정
  if (/가입\s*시켜|청약\s*해\s*줘|계약\s*해\s*줘|들어\s*줘.*보험/.test(text))
    return { bubbles: [{ kind: "text", text: "가입·청약은 제가 직접 실행할 수 없어요 — 보험업법상 모집은 **라이선스 채널(GA 보험중개)**을 통해서만 가능해요. 대신 **맞춤보험 탭의 간편가입(시연)**으로 절차를 체험하시거나, 보장 공백 분석으로 무엇이 필요한지 먼저 확인해 드릴게요." }], quicks: ["보장 공백 분석", "보장 사다리 확인", "맞춤 헬스케어 보험 상담"] };
  // ⓑ 납부 확정(2단계) — "✅ 납부 확정 · BILL-…"
  let mm = text.match(/^✅ 납부 확정 · (\S+)/);
  if (mm) { const r = insService.pay(member, mm[1]);
    return { bubbles: [{ kind: "text", text: r.ok ? `납부 완료 ✓ — ${r.bill.product} ${r.bill.ym}월분 ${won(r.bill.amount)}(${r.bill.htk.toLocaleString()} HTK)이 원장에서 차감됐어요. 잔액 ${r.balance.toLocaleString()} HTK. 순환의 30%는 나눔 재원에 적립됐고, 내역은 온체인에 기록됐어요.` : "🔒 " + r.reason }], quicks: r.ok ? ["나눔 현황 보여줘", "내 잔액 알려줘"] : ["지갑 충전은 어떻게 해?"] }; }
  // "납부 진행 · BILL-…" → 확인 카드
  mm = text.match(/^납부 진행 · (\S+)/);
  if (mm) { const S = insService.bills(member); const b = S && S.bills.find((x) => x.id === mm[1]);
    if (!b) return { bubbles: [{ kind: "text", text: "해당 청구서를 찾지 못했어요." }] };
    return { bubbles: [{ kind: "card", card: { title: "🧾 납부 확인", items: [`${b.product} · ${b.ym}월분`, `금액 ${won(b.amount)} → 약 ${Math.ceil(b.amount / rate).toLocaleString()} HTK 차감`, `납기 ${b.due} · 상태 ${b.status}`], buttons: [`✅ 납부 확정 · ${b.id}`] } }, { kind: "text", text: "확정을 누르면 지갑 토큰이 실제로 차감돼요 — 취소하려면 그냥 다른 질문을 이어가세요." }], quicks: [] }; }
  // 납부 조회 — "이번 달 보험료", "납부해 줘"
  if (/납부|보험료\s*(내|납|얼마|청구)|낼\s*(돈|보험료)|청구서/.test(text)) {
    const S = insService.bills(member);
    if (!S || !S.policies.length) return { bubbles: [{ kind: "text", text: "아직 납부할 계약이 없어요 — **맞춤보험 탭에서 간편가입(시연)**을 완료하면 매달 청구서가 생기고, 여기서 바로 납부까지 도와드려요." }], quicks: ["보장 사다리 확인", "보장 공백 분석"] };
    if (!S.unpaid.length) return { bubbles: [{ kind: "text", text: `이번 달 낼 보험료가 없어요 — 전부 납부 완료! (누적 수납 ${S.paidCount}건 · ${won(S.paidTotal)}) 잔액은 ${S.balance != null ? S.balance.toLocaleString() : "-"} HTK예요.` }], quicks: ["내 잔액 알려줘", "나눔 현황 보여줘"] };
    return { bubbles: [{ kind: "card", card: { title: `🧾 납부할 청구서 ${S.unpaid.length}건`, items: S.unpaid.slice(0, 4).map((b) => `${b.ym} ${b.product} · ${won(b.amount)} · ${b.status}`), buttons: S.unpaid.slice(0, 3).map((b) => `납부 진행 · ${b.id}`) } }, { kind: "text", text: `잔액 ${S.balance != null ? S.balance.toLocaleString() : "-"} HTK — 납부하면 원장에서 차감되고 온체인에 기록돼요.` }], quicks: [] };
  }
  // ⓒ 지급 확정(2단계) — "✅ 지급 확정 · CLM-…"
  mm = text.match(/^✅ 지급 확정 · (\S+)/);
  if (mm) { const r = insService.claimPay(member, mm[1]);
    return { bubbles: [{ kind: "text", text: r.ok ? `지급 완료 ✓ — ${r.claim.id} 보험금 ${won(r.payout)}(${r.htk.toLocaleString()} HTK)이 지갑에 입금됐어요. 잔액 ${r.balance.toLocaleString()} HTK · 온체인 기록 완료.` : "🔒 " + r.reason }], quicks: r.ok ? ["내 잔액 알려줘"] : ["보장 공백 분석"] }; }
  // 수동 청구 접수(상담사) — "청구 접수 — 도수치료 80000원"
  mm = text.match(/^청구 접수 — (.+?)\s+([\d,]+)원?$/);
  if (mm) { const r = insService.claimSubmit(member, { kind: mm[1].trim(), fee: parseInt(mm[2].replace(/,/g, ""), 10) });
    return { bubbles: [{ kind: "text", text: r.ok ? `접수 완료 ✓ — ${r.claim.id} (${r.claim.kind} · ${won(r.claim.fee)}). 바로 심사해 드릴까요?` : "🔒 " + r.reason }], quicks: r.ok ? [`심사 진행 · ${r.claim.id}`] : [] }; }
  if (/청구\s*접수\s*해|청구\s*넣어/.test(text))
    return { bubbles: [{ kind: "text", text: "청구를 접수해 드릴게요 — **\"청구 접수 — 도수치료 80000원\"** 형식으로 진료 종류와 금액을 보내주세요. 비대면 진료는 종료 시 자동 접수돼요(청구 0단계)." }], quicks: ["청구 접수 — 도수치료 80000원"] };
  // 이의신청(상담사) — "이의신청 — CLM-XXXX"
  mm = text.match(/^이의신청 — (\S+)/);
  if (mm) { const r = insService.claimAppeal(member, mm[1], "상담사 경유 재검토 요청");
    return { bubbles: [{ kind: "text", text: r.ok ? `이의신청이 접수됐어요 ✓ — ${r.claim.id} 재심사가 시작되고, 결과는 알림으로 알려드려요. 부지급이 끝이 아니에요.` : "🔒 " + r.reason }], quicks: ["청구 현황 보여줘"] }; }
  // "심사 진행 · CLM-…" → 심사 결과+확정 버튼
  mm = text.match(/^심사 진행 · (\S+)/);
  if (mm) { const rv = insService.claimReview(member, mm[1]);
    if (!rv.ok) return { bubbles: [{ kind: "text", text: "🔒 " + rv.reason }], quicks: ["보장 공백 분석"] };
    return { bubbles: [{ kind: "card", card: { title: "🩺 심사 결과 — 계산 내역(검증 가능)", items: (rv.breakdown || [rv.explain]).concat([`근거: ${rv.silson.product}${rv.silson.gen ? ` (${rv.silson.gen})` : ""}`]), buttons: [`✅ 지급 확정 · ${rv.claim.id}`] } }], quicks: [] }; }
  // 청구·지급 조회
  if (/청구\s*(현황|내역|상태|어떻|해줘)|보험금\s*(받|줘|지급|청구)|지급\s*해/.test(text)) {
    const cl = insService.claims(); const pending = cl.filter((c) => !/지급/.test(c.status || ""));
    if (!cl.length) return { bubbles: [{ kind: "text", text: "아직 청구가 없어요 — 비대면 진료를 마치면 서류 없이 자동으로 접수돼요(청구 0단계)." }], quicks: ["보장 공백 분석"] };
    if (!pending.length) return { bubbles: [{ kind: "text", text: `진행 중 청구는 없고, 지급 완료 ${cl.filter((c) => /지급/.test(c.status || "")).length}건이 있어요.` }], quicks: ["내 잔액 알려줘"] };
    return { bubbles: [{ kind: "card", card: { title: `📄 진행 중 청구 ${pending.length}건`, items: pending.slice(0, 4).map((c) => `${c.id} · ${c.kind || "진료"} · ${c.status}`), buttons: pending.slice(0, 3).map((c) => `심사 진행 · ${c.id}`) } }, { kind: "text", text: "심사를 진행하면 실손 계약 확인 후 지급액을 계산해 보여드리고, 확정 시 지갑으로 즉시 입금돼요." }], quicks: [] };
  }
  // ⓓ 재산정 — 확정 2단계
  if (/^✅ 인하 적용 확정$/.test(text)) { const r = insService.rerateApply(member);
    return { bubbles: [{ kind: "text", text: r.ok ? `재산정 적용 ✓ — 월 ${won(r.state.before)} → ${won(r.state.after)} (−${r.state.rate}%), 연 ${won(r.state.saving * 12)} 절감. 근거(${(r.state.improved || []).join("·")})는 4세대 자산으로 기록됐어요.` : r.reason }], quicks: ["내 자산 계보 보여줘"] }; }
  if (/재산정|보험료\s*(깎|내려|인하|다시\s*계산)/.test(text)) {
    const R = insService.rerate(member);
    if (R.state && R.state.status === "done") return { bubbles: [{ kind: "text", text: `이미 적용돼 있어요 — 월 ${won(R.state.before)} → ${won(R.state.after)} (−${R.state.rate}%).` }], quicks: [] };
    const C = R.compute;
    if (!C.eligible) return { bubbles: [{ kind: "text", text: C.reason + " 인하 전용이라 손해 볼 일은 없어요." }], quicks: ["검진결과 올리기"] };
    if (C.pct <= 0) return { bubbles: [{ kind: "text", text: "이번에는 개선 지표가 확인되지 않았어요 — 보험료는 그대로 유지돼요(인하 전용·불이익 없음). 다음 검진에서 다시 계산해 드릴게요." }], quicks: [] };
    return { bubbles: [{ kind: "card", card: { title: "📉 재산정 계산 결과", items: [`개선 지표 ${C.improvedN}건: ${C.improved.map((x) => x.ko).join("·")}`, `월 ${won(C.before)} → ${won(C.after)} (−${C.pct}%)`, "인하 전용 — 악화 지표로 오르는 일은 없어요"], buttons: ["✅ 인하 적용 확정"] } }], quicks: [] };
  }
  // 과업B — 실손 현황·검진보험(상담사)
  if (/내\s*실손\s*(보여|현황|알려|상태)|실손\s*현황/.test(text)) {
    const S = insService.silStatus(member);
    if (!S) return null;
    if (!S.has) return { bubbles: [{ kind: "text", text: `실손이 아직 없어요 — 같은 코호트 가입율은 ${S.peer ? S.peer.rate + "%" : "-"}예요. 보장 사다리 1단계(실손 우선 충당)부터 시작하는 걸 권해요.` }], quicks: ["보장 사다리 확인"] };
    return { bubbles: [{ kind: "card", card: { title: `🛡️ 내 실손 — ${S.contract.gen || S.gen + "세대"}`, items: [`${S.contract.product} · 월 ${Number(S.contract.monthly || 0).toLocaleString()}원`, `내가 내는 돈: 급여 ${S.contract.coGen || "-"} · 비급여 ${S.contract.coNon || "-"}`, `올해 남은 한도 — 급여 ${S.limits.pay.remain.toLocaleString()}원 · 비급여 ${S.limits.non.remain.toLocaleString()}원`, S.latestNote], buttons: ["청구 현황 보여줘"] } }], quicks: ["청구 현황 보여줘", "보장 공백 분석"] };
  }
  if (/검진\s*보험\s*(청구|현황|보여)|검진대비/.test(text)) {
    const S = insService.checkupIns(member);
    if (!S) return null;
    if (!S.policy) return { bubbles: [{ kind: "text", text: S.hasCheckup ? "검진 기록이 연결돼 있어요 — 맞춤보험 탭 ①에서 무상 발급을 받으실 수 있어요(확인 한 번이면 돼요)." : "검진 기록을 연결하면 무상 검진대비보험을 발급해 드려요." }], quicks: ["맞춤보험 열어줘"] };
    if (/청구/.test(text) && S.timeline.phase === "보장 중") {
      const r = insService.claimSubmit(member, { kind: "검진 연계 정밀검사", fee: 100000 });
      if (r.ok) return { bubbles: [{ kind: "text", text: `접수 완료 ✓ — ${r.claim.id} (검진 연계 정밀검사 지원). 바로 심사할까요?` }], quicks: [`심사 진행 · ${r.claim.id}`] };
      return { bubbles: [{ kind: "text", text: "🔒 " + r.reason }] };
    }
    return { bubbles: [{ kind: "card", card: { title: `🩺 검진대비보험 — ${S.timeline.phase}`, items: [`증서 ${S.policy.id} · 무상(추가 보험료 0원)`, `보장기간 ${new Date(S.timeline.start).toLocaleDateString("ko-KR")}~${new Date(S.timeline.end).toLocaleDateString("ko-KR")}`].concat(S.coverage.map(([scen, name, amt]) => `${name} ${amt.toLocaleString()}원 — "${scen}"일 때`)), buttons: S.timeline.phase === "보장 중" ? ["검진보험 청구해줘"] : [] } }], quicks: [] };
  }
  // M2 — 위험 예측·인수 시뮬(상담사)
  if (/위험\s*(예측|알려|얼마|분석)|무슨\s*병|질병\s*위험/.test(text)) {
    const R = insService.riskExplain(member);
    if (!R || !R.ok) return { bubbles: [{ kind: "text", text: (R && R.reason) || "검진 연결이 필요해요." }], quicks: ["검진결과 올리기"] };
    return { bubbles: [{ kind: "card", card: { title: `🔮 질병별 위험 — 같은 ${R.band} ${R.sex}성 대비`, items: R.risks.slice(0, 3).map((r) => `${r.ko}: 상위 ${r.topPct}% · ${r.trend} (근거: ${r.basis.map((b) => b.ko).join("·") || "정상"})`), buttons: ["가입 심사 미리보기"] } }, { kind: "text", text: R.honesty }], quicks: ["가입 심사 미리보기", "보장 공백 분석"] };
  }
  if (/가입\s*심사\s*미리보기|인수\s*(시뮬|예측|심사)/.test(text)) {
    const U = insService.underwrite(member, "맞춤보험");
    if (!U || !U.ok) return { bubbles: [{ kind: "text", text: (U && U.reason) || "검진 연결이 필요해요." }] };
    return { bubbles: [{ kind: "text", text: `예상 결과: **${U.decision}**\n${U.note}${U.disclosures.length ? `\n고지 자동 구성: ${U.disclosures.map((d) => d.item).join(" · ")} (다시 입력 안 하셔도 돼요)` : ""}\n${U.ga}` }], quicks: ["보장 사다리 확인", "맞춤 헬스케어 보험 상담"] };
  }
  // ⓔ 사다리·나눔·잔액
  if (/사다리|실손부터|뭐부터\s*(가입|시작)|기초\s*보장/.test(text)) { const L = insService.ladderCheck(member);
    return { bubbles: [{ kind: "text", text: L.note + (L.stage === "silson-first" ? "\n" + L.legal : "") }], quicks: ["보장 공백 분석", "맞춤 헬스케어 보험 상담"] }; }
  // 나눔 신청(상담사) — "지원 신청 — <사유>" 패턴으로 확인 후 실행
  mm = text.match(/^지원 신청 — (.+)/);
  if (mm) { const r = insService.donateApply(member, { reason: mm[1], channel: "상담사 접수" });
    return { bubbles: [{ kind: "text", text: r.ok ? `접수 완료 ✓ — ${r.app.id} · 긴급도 ${r.app.urgency.grade}(${r.app.urgency.score}점, 근거: ${r.app.urgency.basis.join("·") || "기본"}). 심사 진행 상황은 치료비·나눔 탭에서 늘 보여요.` : "🔒 " + r.reason }], quicks: ["나눔 현황 보여줘"] }; }
  if (/치료비\s*지원\s*신청|지원\s*신청\s*해/.test(text)) {
    const my = insService.donateReview(member);
    if (my.some((a) => a.status === "심사 대기" || a.status === "선정")) return { bubbles: [{ kind: "text", text: `이미 진행 중인 신청(${my[0].id} · ${my[0].status})이 있어요 — 치료비·나눔 탭에서 상태를 확인하세요.` }], quicks: ["나눔 현황 보여줘"] };
    return { bubbles: [{ kind: "text", text: "치료비 지원 신청을 도와드릴게요. 어떤 상황인지 한 줄로 보내주세요 — 예시처럼 **\"지원 신청 — 항암 치료 중 수술비 부담\"** 형식이면 바로 접수돼요. 신청 정보는 최고 민감등급으로 보호되고, 긴급도 기준은 공개돼 있어요." }], quicks: ["지원 신청 — 수술비 부담이 커요"] };
  }
  if (/나눔|기부|30\s*%|사각지대/.test(text)) { const S = insService.donateStatus();
    return { bubbles: [{ kind: "text", text: S.count ? `나눔 재원에 ${won(S.balance)}(${S.count}건)이 건별 적립돼 있어요 — 출처: ${Object.entries(S.bySource).map(([k, v]) => `${k} ${won(v)}`).join(" · ")}. 치료비 사각지대 지원에 쓰이는 순환의 30% 몫이에요.` : "아직 나눔 적립이 없어요 — 보험료 납부·건강쇼핑이 생기면 순환의 30%가 여기 쌓여요." }], quicks: ["치료비 지원 신청은 어떻게 해?"] }; }
  if (/잔액|얼마\s*있|토큰\s*(얼마|몇)/.test(text)) { const bal = (typeof tlBalance === "function") ? tlBalance(member) : null;
    if (bal == null) return null;
    const res = (typeof htkInsReserve === "function") ? htkInsReserve(bal) : Math.floor(bal * 0.3);
    return { bubbles: [{ kind: "text", text: `지금 ${bal.toLocaleString()} HTK(≈${won(bal * rate)})가 있어요 — 그중 보험·치료비 전용 ${res.toLocaleString()} HTK, 일반 ${(bal - res).toLocaleString()} HTK. 트랜잭션 원장 합산 기준이라 온체인 원장 탭에서 전건 검증할 수 있어요.` }], quicks: ["납부할 보험료 있어?", "나눔 현황 보여줘"] }; }
  return null;
}

function AIPlannerChat({ onSimple, initialAsk }) {
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const _self = !dm && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null;
  const member = dm || _self;
  const nm = member ? member.name : null;
  const PROD = (typeof INS_PRODUCT !== "undefined") ? INS_PRODUCT : { name: "상해보험", insurer: "현대해상", tel: "1588-5656" };
  const FAQ = (typeof INS_FAQ !== "undefined") ? INS_FAQ : [];
  // 회원 컨텍스트(Mx) — 건강데이터 + 실손/진단비를 융합 분석 함수에 주입(세션 로컬, JSON 형태)
  const Mx = useMemo(() => {
    if (!member) return null;
    const myIns = dm && typeof memberInsurance === "function" ? memberInsurance(dm) : (typeof selfInsurance === "function" ? selfInsurance() : null);
    // 조성래(시연 기준 인물): 음주·당뇨·지방간 컨텍스트를 주입해 간·신장 보장 공백이 드러나게
    const selfCtx = !dm ? { drinker: true, regAge: 54, sex: "남", highRiskCancerTypes: ["췌장암"], diseases: (member.diseases && member.diseases.length ? member.diseases : ["당뇨병", "지방간"]) } : {};
    return Object.assign({}, member, selfCtx, { _ins: myIns });
  }, [dm, member && member.name]);
  const topGap = useMemo(() => { if (!Mx || typeof analyzeCoverageGap !== "function") return null; try { const g = analyzeCoverageGap(Mx); return g && g.top ? g.top : null; } catch (e) { return null; } }, [Mx]);
  // 전용 상담사 컨텍스트 인계(Phase1 §4) — 탭에서 넘어온 ctx + 진행 중 건으로 문맥 있는 인사
  const insCtx = useMemo(() => { let c = null; try { c = window.__hifinInsCtx; window.__hifinInsCtx = null; } catch (e) {} if (!c && typeof insService !== "undefined") { try { c = insService.ctx(null, member); } catch (e) {} } return c; }, []);
  const ctxLine = insCtx && insCtx.pending && (insCtx.pending.bills > 0 || insCtx.pending.claims > 0)
    ? `\n\n📌 지금 진행 중인 건이 있어요 — ${[insCtx.pending.bills > 0 ? `납부 대기 청구서 ${insCtx.pending.bills}건` : null, insCtx.pending.claims > 0 ? `심사 대기 청구 ${insCtx.pending.claims}건` : null].filter(Boolean).join(" · ")}. 제가 바로 처리 도와드릴까요?` : "";
  const greetText = `안녕하세요${nm ? " " + nm + "님" : ""}! 보험·치료비 전용 상담사예요. 🤖\n보장 분석부터 **납부·청구 지급·요율 재산정 실행**까지 — 확인만 해주시면 제가 처리해요.`
    + (topGap ? `\n\n${nm ? nm + "님, " : ""}지금 가장 먼저 챙길 지점은 **${topGap.t}**이에요.` : "") + ctxLine;
  const greet = { who: "ai", bubbles: [{ kind: "text", text: greetText }] };
  const FUSION_QUICKS = ["납부할 보험료 있어?", "청구 현황 보여줘", "보장 공백 분석", "재산정 해줘", "내 잔액 알려줘", "나눔 현황 보여줘"];
  const [msgs, setMsgs] = useState([greet]);
  const [quicks, setQuicks] = useState(member ? FUSION_QUICKS : FAQ.slice(0, 6));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  const send = (textArg) => {
    const text = (textArg == null ? input : textArg).trim(); if (!text) return;
    if (text === "맞춤 헬스케어 보험 상담") { if (onSimple) onSimple(); return; }   // 맞춤 헬스케어 보험(내 몸 맞춤 간편보험 종합 상담) 섹션으로 연결
    if (text === "보험상담 신청" || text === "간편 가입 상담") { if (typeof openConsult === "function") openConsult("간편보험 — " + PROD.name + " 상담"); return; }   // 간편(단기) 분야로 접수(이원화)
    setInput(""); setQuicks([]);
    setMsgs((m) => [...m, { who: "me", bubbles: [{ kind: "text", text }] }]);
    setTyping(true);
    setTimeout(() => {
      // ⓪ 전용 상담사 업무 실행 층(insService — 납부·심사지급·재산정·사다리·나눔·잔액, 확인 2단계) → ① 융합 분석 → ② 약관 KB 폴백
      const svc = (typeof _insServiceRoute === "function") ? (() => { try { return _insServiceRoute(text, member); } catch (e) { return null; } })() : null;
      if (svc) { setTyping(false); setMsgs((m) => [...m, { who: "ai", bubbles: svc.bubbles }]); setQuicks(svc.quicks && svc.quicks.length ? svc.quicks : []); return; }
      // ① 건강×보험 융합 함수 라우팅(내 데이터 기반) → 없으면 ② 약관 KB 상담으로 폴백
      const fusion = (typeof _insFusionRoute === "function") ? (() => { try { return _insFusionRoute(text, Mx, nm); } catch (e) { return null; } })() : null;
      if (fusion) { setTyping(false); setMsgs((m) => [...m, { who: "ai", bubbles: fusion.bubbles }]); setQuicks(fusion.quicks || FUSION_QUICKS); return; }
      const res = (typeof insuranceCounsel === "function") ? insuranceCounsel(text) : null;
      const kbE = (typeof kbInsuranceMatch === "function") ? kbInsuranceMatch(text) : null;
      setTyping(false);
      if (res) {
        const bubbles = (kbE && typeof kbInsCite === "function") ? res.bubbles.map((b, i) => (i === 0 && b.kind === "text") ? { ...b, text: b.text + "\n" + kbInsCite(kbE) } : b) : res.bubbles;
        setMsgs((m) => [...m, { who: "ai", bubbles }]); setQuicks(res.quicks || []);
      } else if (kbE) {
        setMsgs((m) => [...m, { who: "ai", bubbles: [
          { kind: "text", text: `${kbE.item} — ${kbE.summary}\n${kbInsCite(kbE)}` },
          { kind: "card", card: { title: `📋 ${kbE.item}`, items: [kbE.summary, `관련: ${(kbE.related || []).join(" · ")}`, `출처: ${kbE.org} · ${kbE.src} · ${kbE.date}`], buttons: ["보험상담 신청"] } },
        ] }]); setQuicks(["보험금 청구 서류는?", "면책(안 주는 경우)은?", "보험상담 신청"]);
      }
      else { setMsgs((m) => [...m, { who: "ai", bubbles: [{ kind: "text", text: `‘${text}’에 딱 맞는 약관 조항을 찾지 못했어요. 😅 **보장·보험금·청구·면책·계약** 관련으로 물어보시거나 아래 추천 질문을 눌러보세요. 정확한 보장은 증권·약관 원문과 상담사 확인이 필요해요.` }] }]); setQuicks(FAQ.slice(0, 4).concat("보험상담 신청")); }
    }, 620);
  };
  useEffect(() => { if (initialAsk) { const t = setTimeout(() => send(initialAsk), 650); return () => clearTimeout(t); } }, []);
  return (
    <div className="aipwrap">
      <div className="aiphd"><span className="aipav"><Bot size={18} /></span><div className="aiphi"><b>하이 · 보험·보장 상담</b><span>건강데이터 × 실손·중대질환 융합 분석</span></div><span className="aipbadge">{member ? nm + "님 데이터 연동" : "약관 학습완료"}</span></div>
      {onSimple && <button className="aipsimple" onClick={onSimple}><span className="aipsimple-l"><Zap size={17} /> 간편단기특화보험</span><span className="aipsimple-r">위험질병별 1년 단기 밀도가입 <ChevronRight size={16} /></span></button>}
      <div className="aipbody">
        {msgs.map((m, i) => (
          <div key={i} className={`aiprow ${m.who}`}>
            {m.who === "ai" && <span className="aipmini"><Bot size={14} /></span>}
            <div className="aipmsg">
              {m.bubbles.map((b, j) => b.kind === "card"
                ? <div className="aipcard" key={j}><div className="aipct">{b.card.title}</div><ul>{b.card.items.map((it, k) => <li key={k}>{it}</li>)}</ul>{b.card.buttons && b.card.buttons.length > 0 && <div className="aipcbtns">{b.card.buttons.map((bt) => <button key={bt} onClick={() => send(bt)}>{bt}</button>)}</div>}</div>
                : <div className={`aipbub ${m.who}`} key={j}>{String(b.text).split("\n").map((ln, k) => <React.Fragment key={k}>{k > 0 && <br />}{_insBold(ln)}</React.Fragment>)}</div>
              )}
            </div>
          </div>
        ))}
        {typing && <div className="aiprow ai"><span className="aipmini"><Bot size={14} /></span><div className="aipmsg"><div className="aipbub ai aiptyping"><span /><span /><span /></div></div></div>}
        <div ref={endRef} />
      </div>
      {quicks.length > 0 && !typing && <div className="aipquicks">{quicks.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}
      <div className="aipinput">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="보장·보험금·청구·면책 무엇이든 물어보세요" />
        <button className={input.trim() ? "on" : ""} onClick={() => send()}><Send size={16} /></button>
      </div>
      <div className="chnote">※ 본 AI 분석은 <b>내 검진·보험 데이터를 융합한 정보 제공용</b>이며 특정 상품 청약 권유가 아닙니다. 모든 보장·보험료 수치는 <b>예시 기준</b>으로 실제 조건은 <b>가입 증권·약관 원문·관련 법령</b>에 따르며, 세대 전환 시 <b>1~2세대 해지의 불이익(재가입 불가)</b>을 반드시 확인하세요. 실제 가입·권유는 보험업법상 정식 라이선스 채널(GA 보험중개)로만 이루어집니다.</div>
    </div>
  );
}
/* ══════════ AI 간편가입 마법사 — 상담 전 자기주도 청약 시뮬레이션(현대해상 다이렉트 플로우 참조) ══════════
   상품확인→계약자정보→계약전 알릴의무(고지)→약관·동의→보험료 납입(시연)→청약완료(증권). ⚠️ 시연용, 실제 청약·결제 아님. */
function _num(s) { const m = String(s || "").replace(/,/g, "").match(/([0-9]+)/); return m ? parseInt(m[1], 10) : 0; }
function _wonK(n) { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000).toFixed(n % 100000000 ? 1 : 0) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; }
const ENROLL_DISCLOSURES = [
  ["최근 3개월 이내 의사로부터 질병 확정진단·질병의심소견·치료·입원·수술·투약을 받은 사실이 있습니까?"],
  ["최근 2년 이내 질병·상해로 입원·수술·계속 7일 이상 치료 또는 계속 30일 이상 투약을 받은 사실이 있습니까?"],
  ["최근 5년 이내 암·협심증·심근경색·심장판막증·간경화·뇌졸중으로 진단·입원·수술·투약을 받은 사실이 있습니까?"],
];
const ENROLL_CONSENTS = [
  ["terms", true, "보험약관·상품설명서를 확인하였으며, 계약자 보관용 청약서·약관을 교부(전자문서)받았습니다."],
  ["privacy", true, "개인(신용)정보의 수집·이용·제공에 동의합니다. (보험계약 인수·유지·관리 목적)"],
  ["disclosure", true, "계약 전 알릴 의무(고지의무)의 중요성과 위반 시 불이익을 안내받고 사실대로 알렸습니다."],
  ["fit", true, "적합성 원칙에 따른 상품 설명을 받았으며 본 상품이 본인에게 적합함을 확인합니다."],
  ["esign", true, "전자적 청약·전자서명 및 전자문서 수령에 동의합니다."],
  ["mkt", false, "(선택) 마케팅·상품 안내 목적의 정보 활용에 동의합니다."],
];
function SimpleEnrollWizard({ plan, member, onClose, onConsult }) {
  const [step, setStep] = useState(0);
  const nm = member ? member.name : "고객";
  const age = member ? (member.regAge != null ? Math.round(member.regAge) : (member.age || 45)) : 45;
  const sex = member ? (member.sex || "남") : "남";
  const byr = 2026 - age;
  const coverBase = _num(plan.cover) >= 10000 ? _num(plan.cover) : _num(plan.cover) * 10000; // "3,000만원"→30,000,000
  const premBase = _num(plan.prem); // "월 8,400원~"→8400
  // 담보(가입금액) 옵션 — 상품 기본 보장 중심 ±
  const COVERS = [Math.max(10000000, Math.round(coverBase * 0.5 / 10000000) * 10000000), coverBase, coverBase + 20000000].filter((v, i, a) => a.indexOf(v) === i && v > 0);
  const [cover, setCover] = useState(coverBase);
  const [term, setTerm] = useState("1년(자동갱신)");
  const premium = Math.max(1000, Math.round(premBase * (cover / (coverBase || 1)) / 100) * 100);
  const [f, setF] = useState({ name: nm, birth: `${byr}년 (${age}세)`, sex, phone: "", pay: "wallet" });
  const [disc, setDisc] = useState([null, null, null]); // 고지: true=예, false=아니오
  const [con, setCon] = useState(ENROLL_CONSENTS.map((c) => false));
  const allDisc = disc.every((d) => d !== null);
  const anyYes = disc.some((d) => d === true);
  const reqOk = ENROLL_CONSENTS.every((c, i) => !c[1] || con[i]);
  const [policyNo] = useState(() => "HI-2026-" + String(Math.floor(100000 + Math.random() * 899999)));
  const STEPS = ["상품 확인", "계약자 정보", "계약 전 알릴의무", "약관·동의", "보험료 납입", "청약 완료"];
  const canNext = step === 1 ? (f.name && f.phone.replace(/[^0-9]/g, "").length >= 10) : step === 2 ? allDisc : step === 3 ? reqOk : true;
  const toggleAll = () => { const v = !con.every(Boolean); setCon(ENROLL_CONSENTS.map(() => v)); };
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk ewz" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt"><Bot size={17} color="#2563EB" style={{ verticalAlign: "-3px" }} /> AI 간편가입 · {plan.name}</div><button className="ewx" onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="ewsteps">{STEPS.map((s, i) => <React.Fragment key={s}><span className={"ewstep" + (i === step ? " on" : i < step ? " done" : "")}>{i < step ? <Check size={11} /> : i + 1}<em>{s}</em></span>{i < STEPS.length - 1 && <span className="ewsa" />}</React.Fragment>)}</div>
        <div className="bkb ewb">
          {step === 0 && (<div className="ewpane">
            <div className="ewai"><Bot size={15} /> {nm}님, <b>{plan.name}</b> 가입을 도와드릴게요. 보장금액과 기간을 선택하면 예상 보험료를 계산해 드려요.</div>
            <div className="ewprod"><span className="ewpic" style={{ background: (plan.color || "#2563EB") + "1A", color: plan.color }}><ShieldCheck size={20} /></span><div><b>{plan.name}</b><p>{plan.desc}</p></div></div>
            <div className="ewfield"><label>보장금액(진단금)</label><div className="ewchips">{COVERS.map((v) => <button key={v} className={"ewchip" + (cover === v ? " on" : "")} onClick={() => setCover(v)}>{_wonK(v)}</button>)}</div></div>
            <div className="ewfield"><label>보험기간</label><div className="ewchips">{["1년(자동갱신)", "3년", "10년"].map((t) => <button key={t} className={"ewchip" + (term === t ? " on" : "")} onClick={() => setTerm(t)}>{t}</button>)}</div></div>
            <div className="ewprem"><span>예상 보험료</span><b>월 {premium.toLocaleString()}원</b></div>
            <div className="ewnote">※ 간편심사형(간편고지) · 표준체 기준 예시. 실제 보험료·인수는 고지·심사 결과에 따라 확정됩니다.</div>
          </div>)}
          {step === 1 && (<div className="ewpane">
            <div className="ewai"><Bot size={15} /> 계약자(피보험자) 정보를 확인해 주세요. 회원 정보는 자동으로 채웠어요.</div>
            <div className="ewform">
              <label>이름<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="성명" /></label>
              <label>생년(만 나이)<input value={f.birth} readOnly /></label>
              <label>성별<div className="ewseg">{["남", "여"].map((s) => <button key={s} className={f.sex === s ? "on" : ""} onClick={() => setF({ ...f, sex: s })}>{s}</button>)}</div></label>
              <label>휴대전화<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="010-0000-0000" inputMode="numeric" /></label>
            </div>
            <div className="ewnote">※ 입력 정보는 <b>시연용</b>으로 실제 전송·저장되지 않습니다. 본인인증은 정식 청약 시 별도 진행됩니다.</div>
          </div>)}
          {step === 2 && (<div className="ewpane">
            <div className="ewai"><Bot size={15} /> 계약 전 알릴 의무(고지)예요. 사실대로 답해 주세요. 간편고지 3가지 모두 <b>‘아니오’</b>면 간편가입이 가능해요.</div>
            {ENROLL_DISCLOSURES.map(([q], i) => (
              <div className="ewdisc" key={i}><p><b>Q{i + 1}.</b> {q}</p>
                <div className="ewseg wide">{[["예", true], ["아니오", false]].map(([lb, v]) => <button key={lb} className={disc[i] === v ? (v ? "on yes" : "on") : ""} onClick={() => { const n = [...disc]; n[i] = v; setDisc(n); }}>{lb}</button>)}</div>
              </div>
            ))}
            {anyYes && <div className="ewwarn"><AlertTriangle size={13} /> ‘예’ 항목이 있어 <b>간편심사(유병자형)·별도 인수심사</b>가 필요할 수 있어요. 시연에서는 계속 진행합니다.</div>}
            <div className="ewnote">※ 고지의무 위반 시 보장 제한·계약 해지 등 불이익이 있을 수 있습니다.</div>
          </div>)}
          {step === 3 && (<div className="ewpane">
            <div className="ewai"><Bot size={15} /> 약관과 필수 동의를 확인해 주세요. 필수 항목에 동의해야 청약이 진행돼요.</div>
            <button className="ewallcon" onClick={toggleAll}><span className={"ewck" + (con.every(Boolean) ? " on" : "")}>{con.every(Boolean) && <Check size={12} />}</span> 약관 전체 동의(선택 포함)</button>
            <div className="ewcons">{ENROLL_CONSENTS.map((c, i) => (
              <label className="ewcon" key={c[0]}><span className={"ewck" + (con[i] ? " on" : "")} onClick={() => { const n = [...con]; n[i] = !n[i]; setCon(n); }}>{con[i] && <Check size={12} />}</span>
                <span className="ewcont"><b>{c[1] ? "[필수]" : "[선택]"}</b> {c[2]} <a className="ewview" onClick={(e) => { e.preventDefault(); if (typeof toast === "function") toast("약관·설명서 전문은 청약 단계에서 제공됩니다(시연)."); }}>보기</a></span>
              </label>
            ))}</div>
            {!reqOk && <div className="ewnote" style={{ color: "#B91C1C" }}>필수 동의 항목에 모두 동의해 주세요.</div>}
          </div>)}
          {step === 4 && (<div className="ewpane">
            <div className="ewai"><Bot size={15} /> 마지막이에요. 보험료 납입 수단을 선택해 주세요. <b>시연이라 실제 결제는 이뤄지지 않아요.</b></div>
            <div className="ewsummary">
              <div><span>상품</span><b>{plan.name}</b></div>
              <div><span>보장금액</span><b>{_wonK(cover)}</b></div>
              <div><span>보험기간</span><b>{term}</b></div>
              <div><span>월 보험료</span><b style={{ color: "#2563EB" }}>{premium.toLocaleString()}원</b></div>
            </div>
            <div className="ewfield"><label>납입 수단</label><div className="ewpays">
              {[["wallet", "건강지갑(HTK)", Wallet], ["card", "신용/체크카드", Banknote], ["bank", "계좌 자동이체", FileText]].map(([k, t, Ic]) => <button key={k} className={"ewpay" + (f.pay === k ? " on" : "")} onClick={() => setF({ ...f, pay: k })}><Ic size={16} /> {t}</button>)}
            </div></div>
            <div className="ewnote">※ 결제·납입은 <b>시연용</b>이며 실제 청구되지 않습니다. 실제 납입은 보험사 정식 청약 절차에서 진행됩니다.</div>
          </div>)}
          {step === 5 && (<div className="ewpane ewdone">
            <div className="ewbadge"><Check size={30} /></div>
            <h3>청약이 완료되었습니다 🎉</h3>
            <p className="ewdsub">{nm}님의 <b>{plan.name}</b> 간편가입이 정상 접수되었어요.</p>
            <div className="ewcert">
              <div className="ewcert-h"><ShieldCheck size={15} color="#2563EB" /> 전자 보험증권 <span>{policyNo}</span></div>
              <div className="ewcert-b">
                <div><span>계약자/피보험자</span><b>{f.name} ({f.sex}·{f.birth})</b></div>
                <div><span>상품</span><b>{plan.name}</b></div>
                <div><span>보장금액</span><b>{_wonK(cover)}</b></div>
                <div><span>보험기간</span><b>{term}</b></div>
                <div><span>월 보험료</span><b>{premium.toLocaleString()}원 ({({ wallet: "건강지갑", card: "카드", bank: "자동이체" })[f.pay]})</b></div>
                <div><span>계약일 / 보장개시</span><b>오늘 / 익일 0시</b></div>
              </div>
            </div>
            <div className="ewdbtns">
              <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { if (typeof toast === "function") toast("전자증권(SBT)이 건강지갑에 발행되었습니다(시연)."); }}><FileText size={14} /> 증권 저장(건강지갑)</button>
              <button className="cbtn" style={{ margin: 0 }} onClick={() => { onClose(); if (onConsult) onConsult(); }}><MessageSquare size={14} /> 설계사 확인 상담</button>
            </div>
            <div className="ewnote" style={{ textAlign: "center" }}>※ 본 청약·증권은 <b>시연용 시뮬레이션</b>입니다. 실제 계약 체결·보장은 보험업법상 정식 라이선스 채널(GA 보험중개)과 보험사 인수심사를 통해 이루어집니다.</div>
          </div>)}
        </div>
        {step < 5 && (<div className="ewfoot">
          {step > 0 ? <button className="ewback" onClick={() => setStep(step - 1)}>이전</button> : <button className="ewback" onClick={onClose}>취소</button>}
          <button className={"ewnext" + (canNext ? "" : " off")} disabled={!canNext} onClick={() => { if (!canNext) return; if (step === 4 && typeof insService !== "undefined") { try { insService.policyCreate(member, { product: plan.name, monthly: premium, cover, term, pay: f.pay, policyNo }); if (typeof toast === "function") toast("계약이 원장에 기록됐어요 — 보험료 납부 탭에서 청구서를 확인하세요."); } catch (e) {} } setStep(step + 1); }}>
            {step === 4 ? "청약 완료하기" : "다음"} <ChevronRight size={15} />
          </button>
        </div>)}
      </div>
    </div>
  );
}

/* ── 간편 · 내 몸 맞춤 간편보험 — 발병 위험 질병별 1년 단기 밀도 가입 코너 ── */
function SimpleBodyInsurance({ initialPlanKey } = {}) {
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const _self = !dm && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null;
  const member = dm || _self;
  const [wiz, setWiz] = useState(null);
  let R = null; try { R = (dm && typeof demoReport === "function") ? demoReport(dm) : null; } catch (e) { R = null; }
  const nm = member ? member.name : null;
  const recos = new Set();
  try {
    if (R) {
      const hr = (R.hr || []).join(" ");
      const worst = (R.worstNames || []).join(" ");
      if (/암/.test(hr) || (R.cancerTotal && Number(R.cancerTotal) <= 2)) { recos.add("major"); recos.add("general"); }
      if (/갑상선/.test(hr)) recos.add("thyroid");
      if (/뇌|졸중/.test(worst + hr)) recos.add("brain");
      if (/심장|심근|관상|허혈/.test(worst + hr)) recos.add("heart");
      if (/간|췌장|신장|콩팥/.test(worst + hr)) recos.add("liver");
    }
  } catch (e) {}
  const PLANS = [
    ["major", "중대암 진단", HeartPulse, "#E11D48", "위·폐·간·췌장 등 고액암 진단 시 치료 집중 일시금", "진단금 5,000만원", "월 12,900원~"],
    ["general", "일반암 진단", ShieldCheck, "#DB2777", "일반암 진단 확정 시 치료비·소득보전 일시금", "진단금 3,000만원", "월 8,400원~"],
    ["thyroid", "갑상선암", Activity, "#0891B2", "갑상선암(소액암) 진단 보장", "진단금 1,000만원", "월 2,300원~"],
    ["insitu", "상피내암·제자리암", ShieldCheck, "#0D9488", "상피내암·경계성종양 등 조기 진단 보장", "진단금 1,000만원", "월 1,900원~"],
    ["brain", "뇌졸중·뇌혈관질환", Brain, "#7C3AED", "뇌졸중·뇌출혈 등 뇌혈관질환 진단 보장", "진단금 2,000만원", "월 5,600원~"],
    ["heart", "심근경색·허혈성심장질환", HeartPulse, "#EF4444", "급성심근경색 등 허혈성 심장질환 진단 보장", "진단금 2,000만원", "월 5,200원~"],
    ["liver", "간경화 등 중대질환", Stethoscope, "#B45309", "간경화·말기신부전 등 중대질환 진단 보장", "진단금 1,500만원", "월 4,300원~"],
    ["surgery", "기관·부위별 수술비", ClipboardList, "#2563EB", "수술 1~5종 분류 기준 부위별 수술비 보장", "수술비 최대 300만원", "월 3,100원~"],
    ["sports", "스포츠활동 상해", Trophy, "#F59E0B", "운동 중 골절·수술·입원 등 상해 보장", "골절 30만·수술 100만", "월 2,700원~"],
  ];
  const recoNames = PLANS.filter((p) => recos.has(p[0])).map((p) => p[1]);
  const planObj = (row) => ({ key: row[0], name: row[1], Ic: row[2], color: row[3], desc: row[4], cover: row[5], prem: row[6] });
  const openWiz = (row) => setWiz(planObj(row));
  // 검진 진단비 공백 등에서 특정 상품으로 진입 시 자동 오픈
  useEffect(() => { if (initialPlanKey) { const row = PLANS.find((p) => p[0] === initialPlanKey); if (row) setWiz(planObj(row)); } }, [initialPlanKey]);
  return (
    <div className="mhbox sbins">
      <div className="bt"><Sparkles size={16} style={{ verticalAlign: "-2px", color: "#F97316" }} /> 간편 · 내 몸 맞춤 간편보험</div>
      <div className="bs">발병 위험이 높은 질병만 골라 <b>1년 단위 단기보험</b>으로 밀도 있게 — 지금 내 몸(건강리포트)에 <b>꼭 필요한 보장만</b> 간편하게 가입하세요.</div>
      {nm && recoNames.length > 0 && (
        <div className="sbins-reco"><Sparkles size={13} /> AI가 <b>{nm}</b>님 건강리포트 기준으로 <b>{recoNames.slice(0, 3).join(" · ")}</b> 우선 가입을 추천했어요.</div>
      )}
      <div className="sbins-grid">
        {PLANS.map((row) => { const [k, name, Ic, c, desc, cover, prem] = row; return (
          <div key={k} className={`sbins-card${recos.has(k) ? " reco" : ""}`} style={{ "--sc": c }}>
            {recos.has(k) && <span className="sbins-badge">AI 추천</span>}
            <div className="sbins-hd"><span className="sbins-ic"><Ic size={18} /></span><b>{name}</b></div>
            <div className="sbins-desc">{desc}</div>
            <div className="sbins-cover"><ShieldCheck size={12} /> {cover}</div>
            <div className="sbins-foot"><span className="sbins-prem">{prem}<small>1년 단기·간편심사</small></span><button className="sbins-btn" onClick={() => openWiz(row)}>간편 가입</button></div>
          </div>); })}
      </div>
      {wiz && <SimpleEnrollWizard plan={wiz} member={member} onClose={() => setWiz(null)} onConsult={() => openConsult("간편 내몸맞춤 간편보험 — " + wiz.name + " 설계사 확인")} />}
      <div className="sbins-cta">
        <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("간편 내몸맞춤 간편보험 — 종합 설계")}><MessageSquare size={15} /> 내 몸 맞춤 간편보험 종합 상담</button>
        <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("manage")}><FileText size={15} /> 내 건강리포트로 위험 확인</button>
      </div>
      <div className="sbins-note"><b>1년 단기 일반손해보험 · 간편심사 · 자동갱신</b> — 장기보험이 아닌 단기 상품입니다. ※ 보장금액·보험료는 <b>예시(안)</b>이며, 실제 가입가능 담보·한도·보험료·심사기준은 제휴 보험사 상품약관과 관련 법령(보험업법 등)에 따라 확정됩니다.</div>
      <InsAgencyLine />
    </div>
  );
}
/* ── 맞춤 헬스케어 보험 — 플랫폼 구조도 인포그래픽 ── */
function PremiumPolicySection({ initialPlanKey } = {}) {
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
        <InsAgencyLine />
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.8, fontWeight: 800, color: "#14337A", background: "rgba(255,255,255,.85)", border: "1px solid #C7D8FA", borderRadius: 999, padding: "4px 12px", margin: "8px 0 2px" }}><ShieldCheck size={13} /> 장기보험 · 건강데이터 기반 종합 설계</div>
          <div className="hd">Health-InsurFin Tech 기반으로 개인 건강데이터를 분석하여 꼭 필요한 보장을 합리적인 비용으로 제공하고, 건강활동으로 적립한 건강자산으로 보험료 부담을 줄이는 새로운 건강금융 생태계를 만들어 갑니다.</div>
        </div>
        <div className="mhpartners">
          <div className="pt">함께하는 국내 초대형 보험사 파트너 <span className="clickhint"><Info size={11} /> 로고 클릭 시 제휴 상담</span></div>
          <div className="insco">{INSURERS.map(([n, c, domain, ab, slug]) => <div className="c" key={n} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")} title={`${n} 제휴 보험 상담 신청`}><InsLogo n={n} c={c} domain={domain} ab={ab} slug={slug} /><b>{n}</b></div>)}</div>
        </div>
      </div>

      <SimpleBodyInsurance initialPlanKey={initialPlanKey} />

      {/* 형 지시(2026-07-26): 플랫폼 구조도는 고객 화면에서 숨김 — 사업 구조 설명은 내부·제휴용. 복원 시 false→true */}
      {false && <div className="mhbox">
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
      </div>}

      <div className="mhbox">
        <div className="bt">HI-Fin Tech의 핵심 가치</div>
        <div className="corevals" style={{ marginTop: 14 }}>{VALUES.map(([Ic, t, d, c, bg]) => <div className="v" key={t}><span className="ic" style={{ background: bg, color: c }}><Ic size={22} /></span><b>{t}</b><p>{d}</p></div>)}</div>
      </div>

      <div className="mhend"><ShieldCheck size={16} /> HI-Fin Tech는 보험·헬스케어·금융·AI 기술이 융합된 차세대 국민 건강보장체계 구축을 지향합니다.</div>
      <div className="mhcta">
        <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><MessageSquare size={15} /> 내게 맞는 프리미엄보험 상담받기</button>
        <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={15} /> 건강지갑 보기</button>
      </div>
      <InsAgencyLine />
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
  const chronic = false; // 안내: 위험도는 높으나 진단 보유는 아님
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
      <div className="ahd" onClick={() => setOpen((o) => !o)}><Settings size={16} color="#2563EB" /> 실손보험 정책 관리 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· 관리자 설정</span><ChevronDown size={16} style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></div>
      {open && <div className="abd">{ROWS.map(([l, v]) => <div className="arow" key={l}><span className="lbl">{l}</span><span className="val">{v}</span></div>)}<div className="chnote" style={{ marginTop: 11 }}>※ 적립률·지원한도·재원은 운영 정책 및 참여기관 협약에 따라 설정됩니다. 본 화면은 관리자 설정 예시입니다.</div></div>}
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
/* ── 실손보험·중대질환 통계 패널 (10만+조성래 = 100,001명, 실통계 기반) ── */
function SilsonStatsPanel() {
  const _w = (n) => { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000).toFixed(n % 100000000 ? 1 : 0) + "억" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; };
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const _self = !dm && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null;
  const meObj = dm || _self;
  const myIns = dm && typeof memberInsurance === "function" ? memberInsurance(dm) : (typeof selfInsurance === "function" ? selfInsurance() : null);
  const mySol = meObj && typeof insuranceSolution === "function" ? (() => { try { return insuranceSolution(Object.assign({ _ins: myIns }, meObj)); } catch (e) { return null; } })() : null;
  const myName = dm ? dm.name : "조성래";
  const agg = (typeof insuranceAgg === "function") ? (() => { try { return insuranceAgg(); } catch (e) { return null; } })() : null;
  const SPEC = (typeof SILSON_SPEC !== "undefined") ? SILSON_SPEC : {};
  const CRIT = (typeof CRITICAL_DZ !== "undefined") ? CRITICAL_DZ : [];
  const GEN_ORDER = ["1세대", "2세대", "3세대", "4세대", "5세대", "노인실손", "어린이 실손", "미가입"];
  const GEN_COL = { "1세대": "#1D4ED8", "2세대": "#2563EB", "3세대": "#0891B2", "4세대": "#16A34A", "5세대": "#059669", "노인실손": "#D97706", "어린이 실손": "#DB2777", "미가입": "#94A3B8" };
  const n = agg ? agg.n : 100001;
  return (
    <div className="silwrap">
      <div className="bklbl2"><ShieldCheck size={16} color="#2563EB" /> 실손보험·중대질환 데이터 <span className="siln">회원 {n.toLocaleString()}명(10만 + 조성래) · 실통계 기반</span></div>

      {myIns && (<div className="silme">
        <div className="silme-h"><b>{myName}</b>님 보장 현황 <span className={"silbadge " + (myIns.silson.enrolled ? "on" : "off")}>{myIns.silson.gen === "미가입" ? "실손 미가입" : "실손 " + myIns.silson.gen}</span></div>
        {myIns.silson.enrolled ? (<div className="silme-grid">
          <div><span>급여 자기부담</span><b>{myIns.silson.coGen}</b></div>
          <div><span>비급여 자기부담</span><b>{myIns.silson.coNon}</b></div>
          <div><span>통원 한도</span><b>{_w(myIns.silson.outLimit)}/회</b></div>
          <div><span>입원 한도</span><b>{_w(myIns.silson.inLimit)}</b></div>
          <div><span>월 보험료(추정)</span><b>{_w(myIns.silson.monthly)}</b></div>
          <div><span>중대질환 진단비 특약</span><b>{myIns.riders.length ? _w(myIns.riderTotal) + " (" + myIns.riders.length + "종)" : "없음"}</b></div>
        </div>) : <div className="silme-none"><AlertTriangle size={13} /> 실손 미가입 — 검진 후 치료비 보장 공백. 무료 검진보험·적립 지원으로 보완 가능</div>}
        {myIns.dx.length > 0 && <div className="sildx">중대질환 진단 이력: {myIns.dx.map((d) => <span key={d.cat + d.sub}>{d.cat}·{d.sub} <b>{_w(d.benefit)}</b></span>)}</div>}
      </div>)}

      {mySol && (<div className="silsol">
        <div className="silsol-h"><Sparkles size={15} color="#7C3AED" /> AI 보험 솔루션 <span>건강데이터 × 보험데이터 융합 분석</span>
          <span className="silsol-score" style={{ color: mySol.grade === "충실" ? "#15803D" : mySol.grade === "보통" ? "#B45309" : "#B91C1C" }}>보장 충실도 {mySol.grade} · {mySol.score}점</span></div>
        {mySol.findings.length ? <div className="silsol-list">{mySol.findings.map((f, i) => { const C = { crit: "#DC2626", warn: "#D97706", good: "#15803D" }[f.sev]; return (
          <div className="silsol-f" key={i} style={{ borderLeftColor: C }}>
            <div className="silsol-ft"><span className="silsol-sev" style={{ background: C + "1A", color: C }}>{f.sev === "crit" ? "시급" : f.sev === "warn" ? "권고" : "양호"}</span> <b>{f.t}</b></div>
            <p>{f.d}</p><div className="silsol-a">→ {f.a}</div>
          </div>); })}</div> : <div className="silme-none"><Check size={13} color="#15803D" /> 현재 건강위험 대비 보장이 충실합니다.</div>}
        <div className="silnote">건강위험(위험등급·진단질병·암위험·예상의료비) × 보험(실손 세대·중대질환 진단비)을 결합한 개인 맞춤 분석입니다. 실제 가입은 전문 설계사 상담·인수심사를 전제로 합니다.</div>
      </div>)}

      <div className="silsub">세대별 보장 상세 (실손 1~5세대 + 노인·어린이)</div>
      <div className="silt-wrap"><table className="silt">
        <thead><tr><th>세대</th><th>판매기간</th><th>급여 자부담</th><th>비급여 자부담</th><th>통원 한도</th><th>입원 한도</th><th>월보험료(기준)</th></tr></thead>
        <tbody>{["1세대", "2세대", "3세대", "4세대", "5세대", "노인실손", "어린이 실손"].map((g) => { const s = SPEC[g] || {}; return (
          <tr key={g}><td style={{ color: GEN_COL[g], fontWeight: 800 }}>{g}</td><td>{s.period}</td><td>{s.coGen}</td><td>{s.coNon}</td><td>{_w(s.outLimit)}</td><td>{_w(s.inLimit)}{s.inNote ? " *" : ""}</td><td>{_w(s.monthlyBase)}~</td></tr>); })}
        </tbody>
      </table></div>
      <div className="silnote">* 5세대: 경증 비급여 한도 1천만 축소 · 자기부담 50%. 1세대는 자기부담 최소(통원 5천원 공제)이나 고령 보험료 급등.</div>

      {agg && (<>
        <div className="silsub">모집단 {n.toLocaleString()}명 실손 세대 분포 <span className="silmini">가입률 {(agg.enrollRate * 100).toFixed(1)}% · 평균 월보험료 {_w(agg.avgPremium)}</span></div>
        <div className="sildist">{GEN_ORDER.map((g) => { const c = agg.gens[g] || 0; const pct = c / n * 100; return (
          <div className="sildrow" key={g}><span className="sdlab" style={{ color: GEN_COL[g] }}>{g}</span><div className="sdbar"><i style={{ width: Math.max(0.5, pct) + "%", background: GEN_COL[g] }} /></div><span className="sdval">{pct.toFixed(1)}% · {(c / 10000).toFixed(1)}만</span></div>); })}</div>

        {agg.ageGen && (<>
          <div className="silsub">연령대 × 실손 세대 분포 히트맵 <span className="silmini">셀 = 해당 연령대 내 세대 비중</span></div>
          <div className="silt-wrap"><table className="silt silheat">
            <thead><tr><th>연령대</th>{["1세대", "2세대", "3세대", "4세대", "5세대", "노인실손", "어린이 실손", "미가입"].map((g) => <th key={g} style={{ color: GEN_COL[g] }}>{g.replace(" 실손", "")}</th>)}</tr></thead>
            <tbody>{["~18", "19-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"].map((lab, bi) => { const row = agg.ageGen[bi] || {}; const tot = row._tot || 1; return (
              <tr key={lab}><td className="rh">{lab}</td>{["1세대", "2세대", "3세대", "4세대", "5세대", "노인실손", "어린이 실손", "미가입"].map((g) => { const p = (row[g] || 0) / tot * 100; const bg = p <= 0 ? "transparent" : `rgba(37,99,235,${Math.min(0.85, 0.08 + p / 100 * 1.1).toFixed(2)})`; return <td key={g} style={{ background: bg, color: p >= 45 ? "#fff" : "#33405C", fontWeight: p >= 20 ? 700 : 500, textAlign: "center" }}>{p >= 0.5 ? p.toFixed(0) : "·"}</td>; })}</tr>); })}
            </tbody>
          </table></div>
          <div className="silnote">고연령일수록 1·2세대·노후실손, 젊을수록 3·4세대 비중이 높은 상관을 확인할 수 있습니다(단위 %).</div>
        </>)}
        {agg.riderBands && (<>
          <div className="silsub">중대질환 진단비 가입금액대 분포 <span className="silmini">보유 특약 진단비 합계 기준</span></div>
          <div className="sildist">{["미보유", "~2천만", "2~5천만", "5천만~1억", "1억+"].map((k) => { const c = agg.riderBands[k] || 0; const pct = c / n * 100; const col = k === "미보유" ? "#94A3B8" : ["#93C5FD", "#3B82F6", "#1D4ED8", "#7C3AED"][["~2천만", "2~5천만", "5천만~1억", "1억+"].indexOf(k)]; return (
            <div className="sildrow" key={k}><span className="sdlab" style={{ color: col, minWidth: 78 }}>{k}</span><div className="sdbar"><i style={{ width: Math.max(0.5, pct) + "%", background: col }} /></div><span className="sdval">{pct.toFixed(1)}% · {(c / 10000).toFixed(1)}만</span></div>); })}</div>
        </>)}

        <div className="silsub">중대질환 10대 구분 진단 분포 <span className="silmini">모집단 진단 이력 · 진단자 {(agg.dxN / 10000).toFixed(1)}만명({(agg.dxRate * 100).toFixed(1)}%)</span></div>
        <div className="silt-wrap"><table className="silt">
          <thead><tr><th>구분</th><th>주요 질환</th><th>대표 진단비</th><th>진단자(모집단)</th><th>진단율</th></tr></thead>
          <tbody>{CRIT.map((c) => { const cc = (agg.crit[c.cat] || { dx: 0 }); return (
            <tr key={c.key}><td style={{ fontWeight: 800, color: "#1D4ED8" }}>{c.cat}</td><td>{c.subs.join(" · ")}</td><td>{_w(c.benefit)}</td><td>{cc.dx.toLocaleString()}명</td><td>{(cc.dx / n * 100).toFixed(2)}%</td></tr>); })}
          </tbody>
        </table></div>
        <div className="silnote">중대질환 진단비는 상품·특약별 차이가 크며(암=일반·소액·고액 3단계, 뇌·심장은 광범위), 위 수치는 실통계 기반 시연용 추정 분포입니다.</div>
      </>)}
    </div>
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
      <SilsonStatsPanel />
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

/* ── 보험금 청구지원 워크플로(§6.10): 의료사건→기존계약→청구가능성→보장 7항목→서류 ── */
function ClaimSupportFlow({ onModal }) {
  const M = (typeof demoCurrentUser === "function" && demoCurrentUser()) || (typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null);
  const [step, setStep] = React.useState(0);
  if (!M) return null;
  const cp = (typeof memberClinicalProfile === "function") ? (() => { try { return memberClinicalProfile(M); } catch (e) { return null; } })() : null;
  const chk = (typeof genMemberCheckup === "function") ? (() => { try { return genMemberCheckup(Object.assign({}, M)); } catch (e) { return null; } })() : null;
  const dz = cp && cp.diagnoses.length ? cp.diagnoses[0].name : (chk && chk.comp.abnormals[0] ? chk.comp.abnormals[0].split(" ")[0] : "건강검진 이상소견");
  const event = cp && cp.diagnoses.length ? `${dz} 진료·처방(의료사건)` : `${dz} 정밀검사 필요`;
  const SEVEN = [
    ["관련 보장항목", `${dz} 질병 통원·진단비 / 검진 진단지원금`],
    ["보장기간", "계약 만기까지(예: 2045년)"],
    ["예상 보험금", "약 350,000원 (통원·진단 합산 · 심사 후 확정)"],
    ["예상 자기부담금", "약 20,000원 (통원 공제)"],
    ["면책 가능성", "가입 전 진단 이력(기왕증)·고지의무 위반 시 부지급 가능"],
    ["추가심사 가능성", "진단 경위·인과관계 확인 시 추가 심사 가능"],
    ["필요 청구서류", "진단서 · 진료비 세부내역서 · 영수증 · 신분증 (검진자료는 자동 연동)"],
  ];
  const STEPS = ["의료사건", "기존 계약 확인", "보장 7항목 참고분석", "청구 지원"];
  return (
    <div className="card">
      <div className="rct"><ShieldCheck size={18} color="#2563EB" /> 보험금 청구 지원 <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>{M.name}님</span></div>
      <div className="clm-steps">{STEPS.map((s, i) => <React.Fragment key={s}><span className={"clm-step" + (i <= step ? " on" : "")}>{i + 1}. {s}</span>{i < STEPS.length - 1 && <span className="clm-a">›</span>}</React.Fragment>)}</div>

      {step === 0 && <div>
        <div className="clm-lead">최근 <b>{event}</b>이 확인되었습니다. 보유 보험의 치료비 보장 가능성을 참고 분석해 드릴게요.</div>
        <button className="clm-btn pri" onClick={() => setStep(1)}>기존 보험계약 확인 ›</button>
      </div>}
      {step === 1 && <div>
        <div className="clm-lead">보유 계약을 확인했습니다.</div>
        <div className="clm-pol"><div><b>실손의료보험(4세대)</b><span>통원·입원 의료비 · 유지 중</span></div><div><b>건강검진 대비보험</b><span>진단지원금 · 유지 중</span></div></div>
        <button className="clm-btn pri" onClick={() => setStep(2)}>청구 가능성·보장 분석 ›</button>
      </div>}
      {step === 2 && <div>
        <div className="clm-lead"><b>{dz}</b> 관련 보장 가능성 참고 분석(7항목)입니다.</div>
        <div className="clm-seven">{SEVEN.map(([k, v]) => <div className="clm-row" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        <button className="clm-btn pri" onClick={() => setStep(3)}>청구 서류 준비·접수 ›</button>
      </div>}
      {step === 3 && <div>
        <div className="clm-lead">필요 서류를 안내하고 청구를 지원합니다.</div>
        <div className="clm-docs">{["진단서", "진료비 세부내역서", "영수증", "신분증"].map((d) => <span key={d} className="clm-doc">{d}</span>)}<span className="clm-doc auto">검진자료 자동 연동</span></div>
        <button className="clm-btn pri" onClick={() => onModal && onModal({ title: "보험금 청구 접수", sub: "청구가 접수되었습니다 · 보험사 심사 후 지급 확정", items: [["coin", "예상 보험금", "약 350,000원 (심사 후 확정)"], ["doc", "청구 서류", "진단서·세부내역서·영수증 (검진자료 자동 연동)"], ["shield", "안내", "지급 여부·금액은 보험사 심사로 결정됩니다"]] })}><Coins size={14} /> 청구 접수하기</button>
        <button className="clm-btn" onClick={() => setStep(0)}>처음부터</button>
      </div>}
      <div className="chnote" style={{ marginTop: 10 }}>※ 보험금은 <b>보험회사 심사</b>를 거쳐 결정되며 AI는 지급을 확정하지 않습니다. 청약·심사·지급은 보험사·정식 모집자격 보유자가 수행합니다(§4.6).</div>
    </div>
  );
}

/* ══ Phase 5 — 보험요율 재산정(Dynamic Re-rating, D3) — 인하 전용 옵트인 ══ */
function ReRatingCard() {
  const m = (typeof _member === "function") ? _member() : null;
  const [tick, setTick] = useState(0); void tick;
  if (!m) return null;
  const st = (typeof rerateState === "function") ? rerateState() : { status: "none" };
  const eligible = (typeof rerateEligible === "function") ? rerateEligible(m) : false;
  const apply = () => { try { const r = rerateApply(m); if (r && typeof toast === "function") toast(`요율 재산정 완료 — 월 ${r.before.toLocaleString()}원 → ${r.after.toLocaleString()}원 (-${r.rate}%)`); } catch (e) {} setTick((t) => t + 1); };
  return (
    <div className="rrcard">
      <div className="rr-hd"><TrendingUp size={16} /> 보험요율 재산정 <span className="rr-tag">Dynamic Re-rating · 인하 전용</span></div>
      <p className="rr-sub">보험료는 나이가 아니라 <b>내 관리</b>를 따라갑니다 — 4세대 성과 자산(지표 개선 증명)으로 재산정을 신청하면 <b>내려가거나 그대로</b>예요. 미신청·지표 악화가 인상으로 이어지지 않아요(소비자 보호 원칙). 보험사는 원본이 아닌 <b>요약 증명(성과 SBT)만</b> 열람해요.</p>
      {st.status === "done" ? (
        <div className="rr-done"><Check size={15} /> 재산정 완료 — 월 보험료 <s>{st.before.toLocaleString()}원</s> → <b>{st.after.toLocaleString()}원</b> (연 {(st.saving * 12).toLocaleString()}원 절감 · -{st.rate}%) · 체인 기록 ✓</div>
      ) : eligible ? (
        <div className="rr-act"><span className="rr-eli">✅ 신청 자격 충족 — 2개년 검진의 혈당·중성지방 개선이 성과 자산으로 증명돼요</span><button onClick={apply}><TrendingUp size={14} /> 재산정 신청 (인하 전용)</button></div>
      ) : (
        <div className="rr-act"><span className="rr-eli dim">재검진 데이터가 쌓이면 신청할 수 있어요 — 검진결과를 연결해 주세요</span></div>
      )}
      <div className="rr-note">※ 시연용 예시 — 실제 재산정은 보험사 심사·약관에 따르며, 하이핀은 검증된 요약 증명 전달만 담당해요.</div>
    </div>
  );
}

/* ══════════ 과업3 리뉴얼 탭 — 전 카드가 insService(원장·금고·코호트) 파생, JSX 금액 하드코딩 금지 ══════════ */

/* ① 보장분석 — 내 지갑의 보장 자산 뷰(금고 실계약 + 코호트 대비) */
function InsAnalysisTab({ onGo, onTab }) {
  const [tick, setTick] = useState(0); void tick;
  const m = insService.member();
  const g = m ? insService.gap(m) : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  const integ = (m && typeof verifyVaultIntegrity === "function") ? (() => { try { return verifyVaultIntegrity(m); } catch (e) { return null; } })() : null;
  if (!m || !g) return <div className="chnote">로그인 후 내 보장 자산을 확인할 수 있어요.</div>;
  if (!g.connected) return (
    <div className="card" style={{ textAlign: "center", padding: "30px 18px" }}>
      <Search size={30} color="#94A3B8" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 15.5, fontWeight: 800 }}>아직 연결된 보험이 없어요</div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 14px" }}>내 보험을 연결하면 <b>빠진 보장(보장 공백)</b>과 <b>같은 연령대 평균과의 비교</b>를 바로 보여드려요{g.peer ? ` — 지금 회원 평균 실손 가입율은 ${g.peer.silsonRate}%예요` : ""}.</p>
      <button className="cbtn pri" style={{ margin: "0 auto", width: "auto", padding: "11px 22px" }} onClick={() => { try { sessionStorage.setItem("hifin_force_onboard", "1"); } catch (e) {} if (typeof toast === "function") toast("데이터 연결을 열려면 화면을 새로고침해 주세요 — 또는 하이에게 '보험 연결'이라고 말해 보세요."); }}><FileText size={14} /> 내 보험 연결하기 (1분)</button>
    </div>);
  return (<>
    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div className="rct"><Search size={17} color="#2563EB" /> 내 보장 한눈에 <span className="cbadge" style={{ marginLeft: 8, color: "#15803D", background: "#E7F8EE" }}>내 지갑 실데이터</span>
        <button className="cbtn" style={{ marginLeft: "auto", width: "auto", margin: 0, padding: "6px 12px", fontSize: 11.5 }} onClick={() => { setTick((t) => t + 1); if (typeof toast === "function" && integ) toast(integ.ok ? "온체인 대조 완료 — 위변조 없음 ✓" : "⚠️ 무결성 불일치"); }}><ShieldCheck size={13} /> 온체인 검증{integ ? (integ.ok ? " ✓" : " ⚠") : ""}</button></div>
      <div className="costrow"><span className="cl">실손의료보험 (병원비 돌려받는 기본 보험)</span><span className="cv" style={{ color: g.silson ? "var(--green)" : "#B45309" }}>{g.silson ? `${g.silson.gen || ""} 가입 중 · 월 ${won(g.silson.monthly)}` : "미가입"}</span><span className="ca">{g.silson ? "보장 중" : "우선 보완"}</span></div>
      {g.contracts.filter((c) => c.kind !== "실손").map((c, i) => (
        <div className="costrow" key={i}><span className="cl">{c.product} ({c.insurer || "보험사"})</span><span className="cv">{c.benefit ? "진단금 " + won(c.benefit) : "가입 중"}{c.monthly ? ` · 월 ${won(c.monthly)}` : ""}</span><span className="ca">보장 중</span></div>
      ))}
      {g.peer && <div className="chnote" style={{ marginTop: 10 }}>👥 나와 같은 <b>합성 코호트 10만 명</b> 평균: 실손 가입율 {g.peer.silsonRate}% · 월 보험료 {won(g.peer.avgMonthly)} · 계약 {g.peer.avgContracts}건 — 평균이 아니라 <b>내 값</b>으로 판단하세요.</div>}
    </div>
    {g.solution && g.solution.findings && g.solution.findings.length > 0 && (
      <div className="card" style={{ border: "1.5px dashed #FBCFB6" }}>
        <div className="rct"><Sparkles size={16} color="#F59E0B" /> 빠진 보장(보장 공백) {g.solution.findings.length}건</div>
        {g.solution.findings.slice(0, 4).map((f, i) => <div className="costrow" key={i}><span className="cl">{f.t || f.title || f.cat || String(f.k || "보장 항목")}</span><span className="cv" style={{ color: "#B45309" }}>{f.d || f.desc || f.why || "보완 검토"}</span><span className="ca">{f.sev != null ? "중요도 " + f.sev : "공백"}</span></div>)}
        <button className="cbtn" style={{ marginTop: 8 }} onClick={() => onTab && onTab("custom")}><Sparkles size={14} /> 맞춤보험에서 보완하기</button>
      </div>)}
  </>);
}

/* ② 보장 사다리 카드(M3-1→M3 고도화) — 실손 확인 선행 + 자동 플랜(목표·진행률·달성 예상) */
function InsLadderCard({ onTab }) {
  const m = insService.member();
  const L = m ? insService.ladderCheck(m) : null;
  const P = m ? insService.ladderPlan(m) : null;
  if (!m || !L) return null;
  const first = L.stage === "silson-first";
  return (
    <div className="card" style={{ border: first ? "1.5px solid #FDBA74" : "1.5px solid #BBF7D0", background: first ? "#FFFBF5" : "#F7FEF9" }}>
      <div className="rct"><HeartHandshake size={17} color={first ? "#EA580C" : "#16A34A"} /> 보장 사다리 — {first ? "1단계: 실손부터" : "다음 단계: 맞춤 보장"}</div>
      <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.65 }}>{L.note}</p>
      <div className="costrow"><span className="cl">내 보험·치료비 적립금 (토큰의 30% 우선 적립)</span><span className="cv" style={{ color: "var(--blue)" }}>{L.reserve.toLocaleString()} HTK</span><span className="ca">{first ? "실손 우선 충당" : "맞춤보험 활용"}</span></div>
      {first && P && (<>
        <div style={{ margin: "8px 0 4px", fontSize: 12, fontWeight: 700 }}>자동 적립 플랜 — 목표 {P.goalWon.toLocaleString()}원(첫 3개월 보험료) · 진행 {P.progress}%</div>
        <div style={{ height: 10, background: "#FDE8D8", borderRadius: 99, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: P.progress + "%", background: "linear-gradient(90deg,#F97316,#FB923C)" }} /></div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5 }}>{P.note}{P.monthlyEarn ? ` (최근 월 적립 속도 ≈ ${P.monthlyEarn.toLocaleString()} HTK)` : ""}</div>
      </>)}
      {first && <div className="chnote" style={{ marginTop: 8 }}>{L.legal}</div>}
    </div>);
}

/* ══════════ 맞춤보험 4서브섹션(과업B) — 내 지갑 자산의 다른 뷰 ══════════ */
/* ① 건강검진대비보험 — 가입부터 청구까지 한 흐름 */
function InsCheckupInsSection({ onEnroll }) {
  const [tick, setTick] = useState(0); void tick;
  const [confirm, setConfirm] = useState(null);   // "issue" | {claim}
  const m = insService.member();
  const S = m ? insService.checkupIns(m) : null;
  const won = (n) => Number(n || 0).toLocaleString();
  if (!m || !S) return null;
  const nm = m.name || "회원";
  const TL = ["발급", "보장 시작", "지켜지는 중", "만료"];
  const tlIdx = !S.policy ? -1 : S.timeline.phase === "만료" ? 3 : S.timeline.phase === "보장 중" ? 2 : 1;
  const active = tlIdx === 2;
  return (
    <div className="card" id="cins-checkup" style={{ border: "1.5px solid #BFD0FF", overflow: "hidden" }}>
      {/* ── 히어로: 한 문장으로 마음에 닿기 ── */}
      <div style={{ margin: "-16px -16px 14px", padding: "22px 20px 18px", background: "linear-gradient(120deg,#1D4ED8 0%,#2563EB 55%,#0EA5E9 100%)", color: "#fff" }}>
        <div style={{ fontSize: 12, fontWeight: 700, opacity: .9, marginBottom: 6 }}><ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> ① 건강검진대비보험 · 보험료 0원</div>
        {!S.policy ? (
          <div style={{ fontSize: 17.5, fontWeight: 800, lineHeight: 1.5 }}>{nm}님, 검진 받으셨죠?<br />그 순간을 위해 <span style={{ color: "#FDE68A" }}>무료 보장</span>이 준비돼 있어요.</div>
        ) : (
          <div style={{ fontSize: 17.5, fontWeight: 800, lineHeight: 1.5 }}>{nm}님은 지금 <span style={{ color: "#FDE68A" }}>지켜지고 있어요.</span><br /><span style={{ fontSize: 13.5, fontWeight: 600, opacity: .95 }}>검진에서 무슨 일이 발견돼도 — 치료비 걱정에 치료를 미루는 일은 없게요.</span></div>
        )}
        {S.policy && <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", borderRadius: 99, padding: "5px 12px", fontSize: 11.5, fontWeight: 700 }}><Check size={13} /> {active ? "지금 보장되고 있어요" : S.timeline.phase} · {new Date(S.timeline.start).toLocaleDateString("ko-KR")} ~ {new Date(S.timeline.end).toLocaleDateString("ko-KR")}</div>}
      </div>

      {!S.policy ? (
        S.hasCheckup ? (<>
          <p style={{ fontSize: 13.5, color: "#3a4659", lineHeight: 1.7 }}>검진 기록(<b>{S.checkupDate}</b>)이 연결돼 있어요. 버튼 한 번이면 <b>암·뇌졸중·심근경색 진단금과 대부분 질병의 수술비</b>까지 지켜주는 보장이 켜져요 — <b style={{ color: "var(--green)" }}>돈은 한 푼도 들지 않아요.</b></p>
          <button className="cbtn pri" style={{ fontSize: 15, padding: "14px" }} onClick={() => setConfirm("issue")}><ShieldCheck size={16} /> 내 무료 보장 켜기 (10초)</button>
        </>) : (<>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>건강검진을 예약하시면 <b>보험료 0원</b>으로 검진 대비 보장이 함께 준비돼요 — 검진이 곧 보험이 되는 거예요.</p>
          <button className="cbtn pri" onClick={onEnroll}><CalendarCheck size={15} /> 검진 예약하고 무료 보장 받기</button>
        </>)
      ) : (<>
        {/* ── 타임라인(진행이 늘 보이게) ── */}
        <div style={{ display: "flex", gap: 4, margin: "0 0 12px", fontSize: 10.5, fontWeight: 700 }}>
          {TL.map((s, i) => <span key={s} style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 8, background: i <= tlIdx ? "#DBEAFE" : "#F1F5F9", color: i <= tlIdx ? "#1D4ED8" : "#94A3B8" }}>{i <= tlIdx ? "✓ " : ""}{s}</span>)}
        </div>
        {/* ── "만약에…" 시나리오 카드 — 큰 글씨·상황 언어 ── */}
        <div style={{ fontSize: 13, fontWeight: 800, margin: "2px 0 8px" }}>만약에 이런 일이 생기면요,</div>
        <div style={{ display: "grid", gap: 8 }}>
          {S.coverage.map(([scen, name, amt, d]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #E3ECFB", background: "#F8FAFF", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>😟 "{scen}"</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>💙 {d}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1D4ED8" }}>{won(amt)}<small style={{ fontSize: 11 }}>원</small></div>
                <div style={{ fontSize: 10, color: "var(--soft)" }}>{name} · 바로 지급</div>
              </div>
            </div>))}
        </div>
        {/* ── 약속 한 줄 + 행동 ── */}
        <div style={{ margin: "12px 0 10px", padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, fontSize: 13, lineHeight: 1.7, color: "#78350F" }}>
          <b>치료비 때문에 치료를 포기하지 마세요.</b> 받을 수 있는 치료비는 끝까지 받아서, 제대로 치료받으세요 — 청구는 서류 없이 <b>검진 기록으로 하이가 도와드려요.</b>
        </div>
        {S.claims.length > 0 && S.claims.map((c) => <div className="costrow" key={c.id}><span className="cl">청구 {c.id}</span><span className="cv">{/지급완료/.test(c.status) ? `지급 ${won(c.payout)}원 — 지갑에 들어왔어요` : c.status}</span><span className="ca" style={{ color: /지급완료/.test(c.status) ? "var(--green)" : "#B45309" }}>{/지급완료/.test(c.status) ? "완료 ✓" : "진행 중"}</span></div>)}
        {active && <button className="cbtn pri" style={{ marginTop: 4, fontSize: 14.5, padding: "13px" }} onClick={() => { const r = insService.claimSubmit(m, { kind: "검진 연계 정밀검사", fee: 100000 }); if (r.ok) { const rv = insService.claimReview(m, r.claim.id); if (rv.ok) setConfirm({ claim: rv }); else if (typeof toast === "function") toast("🔒 " + rv.reason); } else if (typeof toast === "function") toast("🔒 " + r.reason); }}><Coins size={15} /> 치료비 청구하기 — 서류 없이 바로</button>}
        <details style={{ fontSize: 12, margin: "10px 0 0" }}><summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--soft)" }}>미리 알려드려요 — 이런 경우는 보장이 어려워요</summary><ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>{S.exclusions.map((x) => <li key={x}>{x}</li>)}</ul></details>
      </>)}
      <div className="chnote" style={{ marginTop: 10 }}>※ 검진 연계 무상 보장은 보험업법 특별이익 제공 금지 규정 정합 검토 전제 · 가입은 GA 라이선스 채널 경유 — 발급·청구·지급 전 건이 온체인에 기록돼요.</div>
      {confirm === "issue" && (
        <div className="bkov" onClick={() => setConfirm(null)}><div className="bk" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
          <div className="bkh"><div className="bt"><ShieldCheck size={16} color="#2563EB" /> 발급 확인</div></div>
          <div className="bkb" style={{ padding: 18 }}>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>검진 기록 연동으로 <b>건강검진 대비보험(무상)</b>을 발급할까요? 보장은 <b>내일 0시부터 3개월</b>이고, 증서·계약이 내 지갑 원장과 체인에 기록돼요.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="cbtn" style={{ margin: 0 }} onClick={() => setConfirm(null)}>취소</button>
              <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const r = insService.issueCheckupIns(m); if (typeof toast === "function") toast(r.ok ? "발급 완료 ✓ — 증서가 온체인에 기록됐어요(보장은 내일 0시 개시)" : "🔒 " + r.reason); setConfirm(null); setTick((t) => t + 1); }}>✅ 발급 확정</button>
            </div>
          </div>
        </div></div>)}
      {confirm && confirm.claim && (
        <div className="bkov" onClick={() => setConfirm(null)}><div className="bk" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
          <div className="bkh"><div className="bt"><ShieldCheck size={16} color="#16A34A" /> 심사 결과 — 지급 확인</div></div>
          <div className="bkb" style={{ padding: 18 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>{confirm.claim.explain}</p>
            <details style={{ margin: "4px 0 8px", fontSize: 12 }}><summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--blue)" }}>계산 내역 펼쳐보기</summary><ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{confirm.claim.breakdown.map((ln, i) => <li key={i}>{ln}</li>)}</ul></details>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="cbtn" style={{ margin: 0 }} onClick={() => setConfirm(null)}>취소</button>
              <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const r = insService.claimPay(m, confirm.claim.claim.id); if (typeof toast === "function") toast(r.ok ? `지급 완료 ✓ +${r.htk.toLocaleString()} HTK (잔액 ${r.balance.toLocaleString()})` : "🔒 " + r.reason); setConfirm(null); setTick((t) => t + 1); }}>✅ 지급 실행</button>
            </div>
          </div>
        </div></div>)}
    </div>);
}
/* ② 실손보험현황 */
function InsSilStatusSection({ onTab }) {
  const m = insService.member();
  const S = m ? insService.silStatus(m) : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  if (!m || !S) return null;
  return (
    <div id="cins-silson">
      {!S.has ? (<>
        <div className="rct" style={{ margin: "4px 0 6px" }}><HeartHandshake size={17} color="#EA580C" /> ② 실손보험현황 <span className="cbadge" style={{ marginLeft: 8, color: "#B45309", background: "#FEF3E2" }}>미가입</span>{S.peer && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)" }}>같은 코호트 가입율 {S.peer.rate}%</span>}</div>
        <InsLadderCard onTab={onTab} />
      </>) : (
        <div className="card" style={{ border: "1.5px solid #BBF7D0" }}>
          <div className="rct"><HeartHandshake size={17} color="#16A34A" /> ② 실손보험현황 <span className="cbadge" style={{ marginLeft: 8, color: "#15803D", background: "#E7F8EE" }}>{S.contract.gen || S.gen + "세대"} 가입 중</span></div>
          <div className="costrow"><span className="cl">{S.contract.product} ({S.contract.insurer || "보험사"}) · 가입 {S.contract.join || "-"}</span><span className="cv">월 {won(S.contract.monthly)}</span><span className="ca">정상</span></div>
          <div className="costrow"><span className="cl">내가 내는 돈(자기부담) — 급여 {S.contract.coGen || "-"} · 비급여 {S.contract.coNon || "-"}</span><span className="cv">통원 회당 25만 · 입원 5천만</span><span className="ca">한도</span></div>
          <div className="costrow"><span className="cl">올해 남은 한도 — 급여</span><span className="cv" style={{ color: "var(--blue)" }}>{won(S.limits.pay.remain)} / {won(S.limits.pay.limit)}</span><span className="ca">사용 {won(S.limits.pay.used)}</span></div>
          <div className="costrow"><span className="cl">올해 남은 한도 — 비급여</span><span className="cv" style={{ color: "var(--blue)" }}>{won(S.limits.non.remain)} / {won(S.limits.non.limit)}</span><span className="ca">사용 {won(S.limits.non.used)}</span></div>
          <div className="chnote" style={{ marginTop: 8 }}>🔁 <b>내 세대 vs 최신 세대</b>: {S.latestNote}{S.peer ? ` · 같은 연령·성별 가입율 ${S.peer.rate}%` : ""}</div>
        </div>)}
    </div>);
}
/* ③ 내가 가입하고 있는 보험현황(살아있는 보험) */
function InsMyPoliciesSection({ onTab }) {
  const m = insService.member();
  const P = m ? insService.myPolicies(m) : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  if (!m || !P) return null;
  return (
    <div className="card" id="cins-mine">
      <div className="rct"><FileText size={17} color="#7C3AED" /> ③ 내가 가입하고 있는 보험 <span className="cbadge" style={{ marginLeft: 8, color: "#6D28D9", background: "#EDE9FE" }}>살아있는 보험 {P.count}건 · 월 {won(P.monthlyTotal)}</span></div>
      {P.alive.length ? P.alive.map((c, i) => {
        const expSoon = c.end && (new Date(c.end) - Date.now()) < 400 * 86400000;   // 만기 13개월 내 → 임박 배지
        return (
          <div className="costrow" key={i}><span className="cl">{c.kind ? `[${c.kind}] ` : ""}{c.product} ({c.insurer}){c.years ? ` · ${c.years}년차` : ""}{c.end ? ` · 만기 ${String(c.end).slice(0, 7)}` : ""}{c.detail ? ` · 진단비 ${won(c.detail.diag)}·수술비 ${won(c.detail.surgery)}·입원일당 ${won(c.detail.daily)}` : c.benefit ? ` · 보장 ${won(c.benefit)}` : ""}</span><span className="cv">월 {won(c.monthly)}</span><span className="ca" style={{ color: expSoon ? "#B45309" : "var(--green)" }}>{expSoon ? "만기 임박" : c.status}</span></div>);
      }) : <p style={{ fontSize: 12.5, color: "var(--muted)" }}>연결된 일반 보험이 아직 없어요 — 보험을 연결하거나 아래 프리미엄 추천에서 시작해 보세요.</p>}
      {P.lapsed.length > 0 && <details style={{ fontSize: 12, marginTop: 6 }}><summary style={{ cursor: "pointer", color: "var(--soft)", fontWeight: 700 }}>지난 계약(실효·만기) {P.lapsed.length}건 보기</summary>{P.lapsed.map((c, i) => <div className="costrow" key={i}><span className="cl">{c.product}</span><span className="cv">월 {won(c.monthly)}</span><span className="ca" style={{ color: "#B91C1C" }}>{c.status}</span></div>)}</details>}
      <button className="cbtn" style={{ marginTop: 8 }} onClick={() => onTab && onTab("analysis")}><Search size={14} /> 빠진 보장까지 — 보장분석 탭에서 자세히</button>
    </div>);
}

/* ②+ M2 위험 예측 카드 — 질병군 확률·동연령 백분위·근거·추세 + 인수 시뮬(포용 경로) */
function InsRiskCard() {
  const [uw, setUw] = useState(null);
  const m = insService.member();
  const R = m ? insService.riskExplain(m) : null;
  const CM = (R && R.ok) ? insService.coverageMatch(m) : null;
  if (!m) return null;
  if (!R || !R.ok) return (
    <div className="card"><div className="rct"><Sparkles size={16} color="#7C3AED" /> 질병별 위험 예측</div>
      <p style={{ fontSize: 12.5, color: "var(--muted)" }}>{(R && R.reason) || "검진 데이터를 연결하면 질병별 위험과 맞춤 보장을 예측해 드려요."}</p></div>);
  return (
    <div className="card" style={{ border: "1.5px solid #DDD6FE" }}>
      <div className="rct"><Sparkles size={17} color="#7C3AED" /> 질병별 위험 예측 <span className="cbadge" style={{ marginLeft: 8, color: "#6D28D9", background: "#EDE9FE" }}>내 검진 실측 기반 · {R.date}</span></div>
      {R.risks.slice(0, 3).map((r) => (
        <div key={r.code} style={{ border: "1px solid #EEF2F7", borderRadius: 10, padding: "8px 12px", margin: "5px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <b>{r.ko} <span style={{ fontSize: 10.5, color: "var(--soft)" }}>{r.code}</span></b>
            <span className="cbadge" style={{ color: r.topPct <= 30 ? "#B91C1C" : "#B45309", background: r.topPct <= 30 ? "#FDECEC" : "#FEF3E2" }}>같은 {R.band} {R.sex}성 중 상위 {r.topPct}%</span>
            <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: r.trend === "악화 추세" ? "#B91C1C" : r.trend === "개선 추세" ? "#15803D" : "var(--muted)" }}>{r.trend}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>근거: {r.basis.length ? r.basis.map((b) => `${b.ko} ${b.value}`).join(" · ") : "전 지표 정상범위"}</div>
        </div>))}
      {CM && CM.ok && CM.rows.filter((r) => r.gap > 0).slice(0, 2).map((r) => (
        <div className="costrow" key={r.code}><span className="cl">🧩 {r.ko} 보장 갭</span><span className="cv" style={{ color: "#B45309" }}>{r.gap.toLocaleString()}원 부족</span><span className="ca">보완 권장</span></div>))}
      <button className="cbtn" style={{ marginTop: 6 }} onClick={() => setUw(insService.underwrite(m, "맞춤보험"))}><ShieldCheck size={14} /> 가입 심사 미리보기 (인수 시뮬레이션)</button>
      {uw && uw.ok && (
        <div style={{ background: "#F8FAFF", border: "1px solid #DBEAFE", borderRadius: 10, padding: "9px 12px", marginTop: 8, fontSize: 12.2, lineHeight: 1.65 }}>
          <b style={{ color: "#1D4ED8" }}>예상 결과: {uw.decision}</b><br />{uw.note}
          {uw.disclosures.length > 0 && <div style={{ marginTop: 4, color: "var(--muted)" }}>고지 자동 구성: {uw.disclosures.map((d) => d.item).join(" · ")} <i>(다시 입력하실 필요 없어요)</i></div>}
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--soft)" }}>{uw.ga}</div>
        </div>)}
      <div className="chnote" style={{ marginTop: 8 }}>{R.honesty} 모델 성능(구분력·캘리브레이션)은 백테스트로 측정·공개돼요.</div>
    </div>);
}

/* ③ 보험료 납부 — 계약 원장·월납 청구서·수납(원장 실차감)·충전 */
function InsBillingTab() {
  const [tick, setTick] = useState(0); void tick;
  const [confirm, setConfirm] = useState(null);        // 실수 방지 — 금액 이동은 확인 단계
  const [topupWon, setTopupWon] = useState("");
  const m = insService.member();
  const S = m ? insService.bills(m) : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  const STC = { "청구": ["#2563EB", "#EAF0FE"], "유예": ["#B45309", "#FEF3E2"], "미납": ["#B91C1C", "#FDECEC"], "수납": ["#15803D", "#E7F8EE"], "실효처리": ["#64748B", "#F1F5F9"] };
  if (!m) return <div className="chnote">로그인 후 이용할 수 있어요.</div>;
  if (!S || !S.policies.length) return (
    <div className="card" style={{ textAlign: "center", padding: "30px 18px" }}>
      <Coins size={30} color="#94A3B8" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 15.5, fontWeight: 800 }}>납부할 계약이 아직 없어요</div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 14px" }}>맞춤보험에서 간편가입(시연)을 완료하면 계약이 <b>내 지갑 원장</b>에 기록되고, 매달 청구서가 여기 생겨요 — 납부하면 토큰이 실제로 차감됩니다.</p>
    </div>);
  const due = S.unpaid[0];
  return (<>
    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div className="rct"><Coins size={17} color="#2563EB" /> 이번에 낼 보험료 <span className="cbadge" style={{ marginLeft: 8, color: "#1D4ED8", background: "#EAF0FE" }}>잔액 {S.balance != null ? S.balance.toLocaleString() : "-"} HTK</span></div>
      {due ? (<>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 10px" }}>
          <div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{due.product}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{due.ym}월분 · 납기 {due.due} · <span style={{ color: STC[due.status][0], fontWeight: 700 }}>{due.status}</span></div></div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--blue)" }}>{won(due.amount)}</div>
        </div>
        <button className="cbtn pri" onClick={() => setConfirm(due)}><Check size={15} /> 지금 납부하기 (HTK 차감)</button>
      </>) : <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 700, padding: "6px 0" }}><Check size={14} style={{ verticalAlign: "-2px" }} /> 이번 달 낼 보험료가 없어요 — 전부 납부 완료!</div>}
    </div>
    <div className="card">
      <div className="rct"><FileText size={16} color="#7C3AED" /> 내 계약 (원장 기록)</div>
      {S.policies.map((p) => <div className="costrow" key={p.id}><span className="cl">{p.product} · {p.id}</span><span className="cv">월 {won(p.monthly)}</span><span className="ca" style={{ color: p.status === "active" ? "var(--green)" : "#B91C1C" }}>{p.status === "active" ? "정상" : "실효"}</span></div>)}
    </div>
    <div className="card">
      <div className="rct"><Coins size={16} color="#16A34A" /> 청구·납부 내역</div>
      {S.bills.slice(0, 8).map((b) => (
        <div className="costrow" key={b.id}><span className="cl">{b.ym} · {b.product}</span><span className="cv">{won(b.amount)}{b.status === "수납" && b.htk ? ` (${b.htk.toLocaleString()} HTK)` : ""}</span>
          <span className="ca" style={{ color: STC[b.status][0], background: STC[b.status][1], borderRadius: 8, padding: "2px 8px" }}>{b.status}</span>
          {b.status !== "수납" && b.status !== "실효처리" && <button className="cbtn" style={{ width: "auto", margin: "0 0 0 8px", padding: "5px 10px", fontSize: 11 }} onClick={() => setConfirm(b)}>납부</button>}</div>
      ))}
      <div className="chnote" style={{ marginTop: 8 }}>납기+7일 지나면 <b>유예</b>, +30일 <b>미납</b>, 3회 연속 미납 시 <b>실효</b>돼요 — 상태는 언제나 여기서 보여요.</div>
    </div>
    <div className="card">
      <div className="rct"><Wallet size={16} color="#0891B2" /> 지갑 충전 (시연 PG)</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="authinput" style={{ flex: 1 }} inputMode="numeric" placeholder="충전 금액(원)" value={topupWon} onChange={(e) => setTopupWon(e.target.value.replace(/[^0-9]/g, ""))} />
        <button className="cbtn" style={{ width: "auto", margin: 0, padding: "10px 16px" }} onClick={() => { const r = insService.topup(m, parseInt(topupWon, 10)); if (typeof toast === "function") toast(r.ok ? `충전 완료 — +${r.htk.toLocaleString()} HTK (잔액 ${r.balance.toLocaleString()})` : "🔒 " + r.reason); setTopupWon(""); setTick((t) => t + 1); }}>충전</button>
      </div>
      <div className="chnote" style={{ marginTop: 8 }}>※ 시연 PG — 실제 결제는 이뤄지지 않아요. 충전은 결제 전용(선불 방향)이며 현금 인출·환전은 규제 게이트가 차단합니다.</div>
    </div>
    {confirm && (
      <div className="bkov" onClick={() => setConfirm(null)}><div className="bk" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt"><Check size={16} color="#2563EB" /> 납부 확인</div></div>
        <div className="bkb" style={{ padding: 18 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}><b>{confirm.product}</b> {confirm.ym}월분 <b style={{ color: "var(--blue)" }}>{won(confirm.amount)}</b>을 지갑 토큰으로 납부할까요?<br /><span style={{ fontSize: 12, color: "var(--muted)" }}>약 {Math.ceil(confirm.amount / ((typeof WALLET !== "undefined" && WALLET.rate) || 10)).toLocaleString()} HTK가 차감되고, 내역은 온체인 원장에 기록돼요.</span></p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="cbtn" style={{ margin: 0 }} onClick={() => setConfirm(null)}>취소</button>
            <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const r = insService.pay(m, confirm.id); if (typeof toast === "function") toast(r.ok ? `납부 완료 ✓ — 잔액 ${r.balance.toLocaleString()} HTK · 나눔 재원에도 적립됐어요` : "🔒 " + r.reason); setConfirm(null); setTick((t) => t + 1); }}>납부 확정</button>
          </div>
        </div>
      </div></div>)}
  </>);
}

/* ④ 청구·지급 — 접수(실데이터)→심사(규칙)→지급 실행(잔액 실이동) */
function InsClaimPayTab({ onModal }) {
  const [tick, setTick] = useState(0); void tick;
  const [confirm, setConfirm] = useState(null);
  const m = insService.member();
  const claims = insService.claims();
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  return (<>
    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div className="rct"><FileText size={17} color="#2563EB" /> 내 청구 현황 <span className="cbadge" style={{ marginLeft: 8, color: "#1D4ED8", background: "#EAF0FE" }}>{claims.filter((c) => !/지급/.test(c.status || "")).length}건 진행 중</span></div>
      {!claims.length && (<div style={{ textAlign: "center", padding: "18px 8px" }}>
        <p style={{ fontSize: 12.5, color: "var(--muted)" }}>아직 청구가 없어요 — <b>비대면 진료를 마치면 서류 없이 자동으로 청구가 접수</b>돼요(청구 0단계).</p>
      </div>)}
      {claims.map((c) => {
        const paid = /지급완료/.test(c.status || "");
        const denied = /부지급/.test(c.status || "");
        const deny = denied && c.denyCode && typeof CLAIM_DENY !== "undefined" ? CLAIM_DENY[c.denyCode] : null;
        return (
          <React.Fragment key={c.id}>
            <div className="costrow"><span className="cl">{c.id}{c.kind ? " · " + c.kind : ""}{c.at ? " · " + new Date(c.at).toLocaleDateString("ko-KR") : ""}</span>
              <span className="cv" style={{ color: paid ? "var(--green)" : denied ? "#B91C1C" : "var(--blue)" }}>{paid ? `지급 ${won(c.payout)}` : (c.status || "접수")}</span>
              <span className="ca">{paid ? "지급완료" : denied ? "부지급" : /이의신청/.test(c.status || "") ? "재심사 중" : <button className="cbtn" style={{ width: "auto", margin: 0, padding: "5px 10px", fontSize: 11 }} onClick={() => { const rv = insService.claimReview(m, c.id); if (!rv.ok) { insService.claimPay(m, c.id); if (typeof toast === "function") toast("🔒 " + rv.reason); setTick((t) => t + 1); return; } setConfirm(rv); }}>심사·지급</button>}</span>
            </div>
            {denied && deny && (
              <div style={{ background: "#FFF7F7", border: "1px solid #FECACA", borderRadius: 10, padding: "8px 12px", margin: "2px 0 8px", fontSize: 12 }}>
                <b style={{ color: "#B91C1C" }}>{deny.ko}</b> — {deny.easy}<br /><span style={{ color: "var(--muted)" }}>해결: {deny.fix}</span>
                <button className="cbtn" style={{ width: "auto", margin: "6px 0 0", padding: "5px 10px", fontSize: 11 }} onClick={() => { const r = insService.claimAppeal(m, c.id, "재검토 요청"); if (typeof toast === "function") toast(r.ok ? "이의신청이 접수됐어요 — 재심사 결과를 알림으로 알려드려요" : r.reason); setTick((t) => t + 1); }}>이의신청</button>
              </div>)}
          </React.Fragment>);
      })}
      {(() => { const L = insService.claimLimits(m); return <div className="chnote" style={{ marginTop: 6 }}>올해 사용한 보장: 급여 {won(L.pay)} · 비급여 {won(L.non)} — 잔여 한도는 심사 시 계산 내역에서 보여드려요.</div>; })()}
      <div className="chnote" style={{ marginTop: 8 }}>심사 규칙: 실손 계약 확인 → 진료비에서 <b>내가 내는 돈(자기부담)</b>을 뺀 금액을 지급 → 지갑 토큰으로 즉시 입금(온체인 기록). 중복 지급은 차단돼요.</div>
    </div>
    <ClaimSupportFlow onModal={onModal} />
    {confirm && (
      <div className="bkov" onClick={() => setConfirm(null)}><div className="bk" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt"><ShieldCheck size={16} color="#16A34A" /> 심사 결과 — 지급 확인</div></div>
        <div className="bkb" style={{ padding: 18 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>{confirm.explain}<br /><span style={{ fontSize: 11.5, color: "var(--muted)" }}>근거: {confirm.silson.product}{confirm.silson.gen ? ` (${confirm.silson.gen})` : ""} · 자기부담 {confirm.silson.coGen}</span></p>
          {confirm.breakdown && (
            <details style={{ margin: "4px 0 8px", fontSize: 12 }}><summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--blue)" }}>계산 내역 펼쳐보기 (심사 근거 검증)</summary>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>{confirm.breakdown.map((ln, i) => <li key={i}>{ln}</li>)}</ul>
            </details>)}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="cbtn" style={{ margin: 0 }} onClick={() => setConfirm(null)}>취소</button>
            <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { const r = insService.claimPay(m, confirm.claim.id); if (typeof toast === "function") toast(r.ok ? `지급 완료 ✓ +${r.htk.toLocaleString()} HTK (잔액 ${r.balance.toLocaleString()})` : "🔒 " + r.reason); setConfirm(null); setTick((t) => t + 1); }}>지급 실행</button>
          </div>
        </div>
      </div></div>)}
  </>);
}

/* ⑤ 요율 재산정 — 실지표 개선도 계산(고정값 폐기)·인하 전용 */
function InsRerateTab() {
  const [tick, setTick] = useState(0); void tick;
  const m = insService.member();
  const R = m ? insService.rerate(m) : null;
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  if (!m || !R) return <div className="chnote">로그인 후 이용할 수 있어요.</div>;
  const C = R.compute, done = R.state && R.state.status === "done";
  return (<>
    <div className="card" style={{ border: "1.5px solid #BBF7D0" }}>
      <div className="rct"><ShieldCheck size={17} color="#16A34A" /> 보험료 다시 계산받기 <span className="cbadge" style={{ marginLeft: 8, color: "#15803D", background: "#E7F8EE" }}>인하 전용 — 올라가지 않아요</span></div>
      {done ? (
        <div style={{ padding: "6px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)" }}>적용 완료 ✓ 월 {won(R.state.before)} → {won(R.state.after)} (−{R.state.rate}%)</div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>근거: {(R.state.improved || []).join(" · ")} 개선 — 성과는 4세대 자산으로 기록됐어요.</p>
        </div>
      ) : !C.eligible ? (
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{C.reason}</p>
      ) : (<>
        <div className="costrow"><span className="cl">개선된 지표 (작년 → 올해)</span><span className="cv" style={{ color: C.improvedN ? "var(--green)" : "var(--muted)" }}>{C.improvedN ? C.improved.map((x) => x.ko).join(" · ") : "확인되지 않음"}</span><span className="ca">{C.improvedN}건</span></div>
        <div className="costrow"><span className="cl">현재 → 재산정 보험료(월)</span><span className="cv" style={{ color: "var(--blue)", fontWeight: 800 }}>{won(C.before)} → {won(C.after)}{C.pct > 0 ? ` (−${C.pct}%)` : ""}</span><span className="ca">{C.pct > 0 ? "인하 가능" : "유지"}</span></div>
        <button className="cbtn pri" style={{ marginTop: 8, opacity: C.pct > 0 ? 1 : .55 }} disabled={C.pct <= 0} onClick={() => { const r = insService.rerateApply(m); if (typeof toast === "function") toast(r.ok ? `재산정 적용 ✓ 연 ${(r.state.saving * 12).toLocaleString()}원 아껴요` : r.reason); setTick((t) => t + 1); }}><Check size={15} /> {C.pct > 0 ? "인하 적용 신청하기" : "개선 지표가 생기면 신청할 수 있어요"}</button>
        <div className="chnote" style={{ marginTop: 8 }}>지표가 나빠져도 보험료는 <b>절대 오르지 않아요</b>(단방향 게이트) — 데이터는 나에게 유리할 때만 쓰여요. 인하율은 제휴 보험사 계리 검증 전 시연 기준({insService.config.RERATE_PER_IMPROVE}%/지표·최대 {insService.config.RERATE_MAX_PCT}%)입니다.</div>
      </>)}
    </div>
  </>);
}

/* ⑥ 치료비·나눔 — 30% 실적립 원장·집행 공개·신청 접수 */
function InsShareTab() {
  const [tick, setTick] = useState(0); void tick;
  const [applying, setApplying] = useState(false);
  const [reason, setReason] = useState("");
  const m = insService.member();
  const S = insService.donateStatus();
  const won = (n) => Number(n || 0).toLocaleString() + "원";
  const myApply = (typeof myApplications === "function") ? myApplications(m) : [];   // S2: 내 신청만(계정 격리)
  return (<>
    <div className="card" style={{ border: "1.5px solid #FECDD3", background: "#FFF7F8" }}>
      <div className="rct"><HeartHandshake size={17} color="#E11D48" /> 나눔 재원 (순환의 {Math.round(insService.config.SHARE_RATE * 100)}%) <span className="cbadge" style={{ marginLeft: 8, color: "#BE123C", background: "#FFE4E6" }}>건별 실적립 원장</span></div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "4px 0 8px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#E11D48" }}>{won(S.balance)}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>적립 {S.count}건 — 결제·수납이 생길 때마다 자동으로 쌓여요</div>
      </div>
      {S.recent.length ? S.recent.map((t) => (
        <div className="costrow" key={t.seq}><span className="cl">{new Date(t.ts).toLocaleDateString("ko-KR")} · {t.source}</span><span className="cv" style={{ color: "#E11D48" }}>+{won(t.amount)}</span><span className="ca">적립</span></div>
      )) : <p style={{ fontSize: 12.5, color: "var(--muted)" }}>아직 적립 내역이 없어요 — 보험료를 납부하거나 건강쇼핑을 이용하면 순환의 {Math.round(insService.config.SHARE_RATE * 100)}%가 여기 쌓이는 걸 볼 수 있어요.</p>}
      <div className="chnote" style={{ marginTop: 8 }}>※ 시연 원장 — 실제 기부·집행은 제휴 공익재단·의료기관 심사 후 이루어지며, 집행 내역은 개인정보 보호 하에 통계·증빙으로 공개하도록 설계돼 있어요.</div>
    </div>
    <div className="card">
      <div className="rct"><FileText size={16} color="#7C3AED" /> 치료비 지원 신청 (사각지대 지원)</div>
      {myApply.map((a) => (
        <div key={a.id || a.at} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", margin: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b style={{ fontSize: 13 }}>{a.id || "신청"}</b>
            {a.urgency && <span className="cbadge" style={{ color: a.urgency.grade === "긴급" ? "#B91C1C" : a.urgency.grade === "높음" ? "#B45309" : "#1D4ED8", background: a.urgency.grade === "긴급" ? "#FDECEC" : a.urgency.grade === "높음" ? "#FEF3E2" : "#EAF0FE" }}>긴급도 {a.urgency.grade} · {a.urgency.score}점</span>}
            <span className="cbadge" style={{ marginLeft: "auto", color: a.status === "집행 완료" ? "#15803D" : "#B45309", background: a.status === "집행 완료" ? "#E7F8EE" : "#FEF3E2" }}>{a.status}</span>
          </div>
          {/* 상태 타임라인 — 문의할 필요 없이 진행이 늘 보이게 */}
          <div style={{ display: "flex", gap: 4, margin: "8px 0 4px", fontSize: 10.5, fontWeight: 700 }}>
            {["심사 대기", "선정", "집행 완료"].map((s, i) => { const on = ["심사 대기", "선정", "집행 완료"].indexOf(a.status) >= i || a.status === "보류" && i === 0; return <span key={s} style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRadius: 8, background: on ? "#DBEAFE" : "#F1F5F9", color: on ? "#1D4ED8" : "#94A3B8" }}>{s}</span>; })}
          </div>
          {a.settle && <div style={{ fontSize: 11.5, color: "var(--green)", fontWeight: 700 }}>✓ {a.settle.hosp}에 {a.settle.amount.toLocaleString()}원 직접 정산 — 현금을 거치지 않고 치료가 진행돼요{a.outcome ? ` · 성과: ${a.outcome.note}` : ""}</div>}
          {/* 심사·집행 시연 흐름(운영 심사 시뮬 — 정직 표기) */}
          {a.status === "심사 대기" && <button className="cbtn" style={{ marginTop: 6, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { const r = (typeof grantApprove === "function") ? grantApprove(a.id) : null; if (typeof toast === "function") toast(r && r.ok ? `선정 ✓ ${r.amount.toLocaleString()}원 배정(운영 심사 시연)` : "보류 — " + ((r && r.reason) || "")); setTick((t) => t + 1); }}><ShieldCheck size={12} /> 자격·긴급도 심사 실행 (운영 시연)</button>}
          {a.status === "선정" && <button className="cbtn pri" style={{ marginTop: 6, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { const r = (typeof directSettle === "function") ? directSettle(a.id) : null; if (typeof toast === "function") toast(r && r.ok ? `집행 완료 ✓ ${r.hosp} 직접 정산 ${r.amount.toLocaleString()}원 (기금 잔액 ${r.fundAfter.toLocaleString()}원)` : "🔒 " + ((r && r.reason) || "")); setTick((t) => t + 1); }}><HeartHandshake size={12} /> 병원 직접 정산 실행 (운영 시연)</button>}
          {a.status === "집행 완료" && !a.outcome && <button className="cbtn" style={{ marginTop: 6, width: "auto", padding: "7px 12px", fontSize: 11.5 }} onClick={() => { const r = (typeof outcomeRecord === "function") ? outcomeRecord(a.id, "치료 진행·회복 확인") : null; if (typeof toast === "function") toast(r && r.ok ? "성과가 기록됐어요 — 지원 효과가 기준 개선에 환류돼요" : ""); setTick((t) => t + 1); }}><Check size={12} /> 치료 성과 기록</button>}
        </div>
      ))}
      {!applying ? (
        <button className="cbtn" style={{ marginTop: 4 }} onClick={() => setApplying(true)}><HeartHandshake size={14} /> 치료비 지원 신청하기</button>
      ) : (<>
        <textarea className="authinput" style={{ width: "100%", minHeight: 64, marginTop: 6, fontFamily: "inherit" }} placeholder="어떤 치료비 지원이 필요한지 적어 주세요 (예: 수술비 부담, 항암 치료 중)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="cbtn" style={{ margin: 0 }} onClick={() => setApplying(false)}>취소</button>
          <button className="cbtn pri" style={{ margin: 0, opacity: reason.trim().length >= 10 ? 1 : .5 }} disabled={reason.trim().length < 10} onClick={() => { const r = (typeof needApply === "function") ? needApply(m, { reason: reason.trim(), channel: "본인 신청" }) : { ok: false, reason: "엔진 미탑재" }; if (typeof toast === "function") toast(r.ok ? `접수 완료 — 긴급도 ${r.app.urgency.grade}(${r.app.urgency.score}점)로 분류됐어요. 심사 기준: ${r.app.urgency.basis.join("·") || "기본"}` : "🔒 " + r.reason); if (r.ok) { setApplying(false); setReason(""); } setTick((t) => t + 1); }}>신청 접수</button>
        </div>
        <div className="chnote" style={{ marginTop: 6 }}>신청 정보는 최고 민감등급으로 보호되며 심사(자격·긴급도) 목적에만 사용돼요. 긴급도 기준(키워드·저소득·유병·실손 미가입 가중)은 공개돼 있어요.</div>
      </>)}
    </div>
    {/* S3-2 ImpactLedger — 집행 투명 공개(통계+마스킹+병원·금액만, 개인 식별 불가) */}
    {(() => { const I = (typeof impactSummary === "function") ? impactSummary() : null; if (!I) return null; return (
      <div className="card">
        <div className="rct"><ShieldCheck size={16} color="#0891B2" /> 집행 투명 공개 (ImpactLedger)</div>
        <div className="wins-grid" style={{ marginBottom: 8 }}>
          <div className="wins-box"><span className="wl">누적 적립</span><b>{I.inTotal.toLocaleString()} <small>원</small></b><span className="ww">순환의 30% 건별</span></div>
          <div className="wins-box pri"><span className="wl">누적 집행</span><b>{I.outTotal.toLocaleString()} <small>원</small></b><span className="ww">수혜 {I.settledN}건{I.avgDays != null ? ` · 평균 ${I.avgDays}일 내 집행` : ""}</span></div>
        </div>
        {I.rows.length ? I.rows.map((r) => (
          <div className="costrow" key={r.id}><span className="cl">{new Date(r.at).toLocaleDateString("ko-KR")} · {r.by} → {r.hosp}</span><span className="cv" style={{ color: "#E11D48" }}>{r.amount.toLocaleString()}원</span><span className="ca">{r.outcome ? "성과 확인" : "집행"}</span></div>
        )) : <p style={{ fontSize: 12.5, color: "var(--muted)" }}>아직 집행 내역이 없어요 — 선정·정산이 이루어지면 여기 공개돼요(이름은 마스킹).</p>}
        <div className="chnote" style={{ marginTop: 8 }}>수혜자 보호를 위해 <b>통계·마스킹된 내역·온체인 증빙</b>만 공개해요. 선정 기준(긴급도 스코어·중복 확인·기금 잔액)도 함께 공개됩니다.</div>
      </div>); })()}
  </>);
}

function InsuranceSection({ onGo }) {
  const [tab, setTab] = useState("custom");   // 과업A: 맞춤보험이 기본 랜딩 탭
  const [modal, setModal] = useState(null);
  const [enroll, setEnroll] = useState(false);
  const [cover, setCover] = useState(null);
  const [simplePlan, setSimplePlan] = useState(null);
  const [askSeed, setAskSeed] = useState(null);   // AI 주치의/Super Agent에서 넘어온 보험 문의
  const go = onGo || (() => {});
  // 과업3 재편: 구(舊) 8탭 키 → 신(新) 6탭 호환 매핑(딥링크 무중단)
  const TAB_ALIAS = { embed: "custom", premium: "custom", policy: "analysis", coverage: "analysis", claim: "claimpay" };
  const setTabX = (k) => setTab(TAB_ALIAS[k] || k);
  // 과업C: 조성래(hifin·관리자) 진입 시 보험 실현황 1회성 시드 보강 — 이후 전 화면은 금고·원장 저장본만 읽는다
  const [, _forceSeed] = useState(0);
  useEffect(() => { try { const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (!dm && typeof selfMember === "function" && typeof selfEnsureInsSeed === "function") { if (selfEnsureInsSeed(selfMember())) _forceSeed((x) => x + 1); } } catch (e) {} }, []);
  // 다른 섹션에서 특정 간편보험 진입(__hifinInsRoute) / 보험 AI상담 연결·자동질의(__hifinInsAsk) 라우팅 훅
  useEffect(() => {
    let r = null; try { r = window.__hifinInsRoute; } catch (e) {}
    if (r) { if (r.tab) setTabX(r.tab); setSimplePlan(r.planKey || null); try { window.__hifinInsRoute = null; } catch (e) {} }
    let a = null; try { a = window.__hifinInsAsk; } catch (e) {}
    if (a) { setTabX(a.tab || "ai"); setAskSeed(a.q || null); try { window.__hifinInsAsk = null; } catch (e) {} }
  }, []);
  /* 과업3 6탭 — 각 탭 = 내 지갑 자산의 다른 뷰(보장 자산·토큰 사용·순환의 몫). 과업A: 맞춤보험 최좌측(기본 랜딩) */
  const tabs = [["custom", "맞춤보험", Sparkles], ["analysis", "보장분석", Search], ["billing", "보험료 납부", Coins], ["claimpay", "청구·지급", FileText], ["rerate", "요율 재산정", ShieldCheck], ["share", "치료비·나눔", HeartHandshake], ["region", "내 지역 상담", MapPin]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="insurance" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>보험·치료비</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>건강검진대비보험 · 가입 · 보장조회 · 청구 · AI상담 — 치료비 걱정 없는 임베디드 보험</div></div></div>
      <div className="chtabs">{tabs.map(([k, t, Ic]) => <div key={k} className={`chtab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={15} /> {t}</div>)}</div>

      {tab === "analysis" && (<>
        <InsAnalysisTab onGo={go} onTab={setTab} />
        <InsurancePolicySection />
      </>)}
      {tab === "billing" && <InsBillingTab />}
      {tab === "claimpay" && <InsClaimPayTab onModal={setModal} />}
      {tab === "rerate" && <InsRerateTab />}
      {tab === "share" && <InsShareTab />}
      {tab === "region" && <RegionConsultSection onTab={setTab} />}
      {tab === "sports" && <SportsInsuranceSection onGo={go} />}
      {tab === "custom" && (<>
        {/* 과업B 미니 내비 — 4개 서브섹션 앵커 칩(3클릭 원칙) */}
        <div className="benefit" style={{ position: "sticky", top: 0, zIndex: 5 }}>
          {[["cins-checkup", "① 검진대비보험"], ["cins-silson", "② 실손현황"], ["cins-mine", "③ 내 보험현황"], ["cins-premium", "④ 내몸맞춤 프리미엄"]].map(([id, t]) => (
            <span key={id} style={{ cursor: "pointer" }} onClick={() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}><Sparkles size={14} /> {t}</span>))}
        </div>
        <InsCheckupInsSection onEnroll={() => setEnroll(true)} />
        {/* Phase4 업셀 배너 — 치료비(보험금) 수령 경험 회원에게만: 다음 공백은 '치료 중 생활비' */}
        {(() => { try { const cl = JSON.parse(localStorage.getItem("hifin_claims") || "[]"); if (!cl.length) return null; } catch (e) { return null; } return (
          <div className="card" style={{ border: "1.5px solid #F3DFB6", background: "linear-gradient(120deg,#FFFBEB,#FFF7E8)", margin: "10px 0 12px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 26 }}>💠</span>
              <div style={{ flex: "1 1 280px" }}>
                <b style={{ fontSize: 14.5, color: "#92400E" }}>치료비는 지켜졌어요 — 다음은 치료 '중' 생활비예요</b>
                <div style={{ fontSize: 12.3, color: "#78550F", marginTop: 4, lineHeight: 1.6 }}>보험금 수령을 경험하셨죠. 큰 병의 진짜 부담은 치료받는 동안 <b>일을 쉬며 끊기는 소득</b>이에요 — 장기 플랜은 그 공백까지 월급처럼 채워줘요.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="cbtn pri" style={{ margin: 0, width: "auto", padding: "9px 15px", fontSize: 12 }} onClick={() => { const el = document.getElementById("cins-premium"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}>치료비+생활비 설계 보기</button>
                <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 15px", fontSize: 12 }} onClick={() => setTab("region")}><MapPin size={13} /> 내 지역 상담</button>
              </div>
            </div>
          </div> ); })()}
        <InsSilStatusSection onTab={setTab} />
        <InsMyPoliciesSection onTab={setTab} />
        <div id="cins-premium">
          <div className="rct" style={{ margin: "10px 0 6px" }}><Sparkles size={17} color="#7C3AED" /> ④ 내몸맞춤 프리미엄보험</div>
          {typeof InsLifeCostCard === "function" && <InsLifeCostCard onTab={setTab} />}
          <InsRiskCard />
          <PremiumPolicySection initialPlanKey={simplePlan} />
        </div>
        <div style={{ display: "flex", gap: 8, margin: "4px 0 10px" }}>
          <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 14px", fontSize: 12 }} onClick={() => setTab("sports")}><Trophy size={13} /> 스포츠 임베디드 보험</button>
          <button className="cbtn" style={{ margin: 0, width: "auto", padding: "9px 14px", fontSize: 12 }} onClick={() => setTab("join")}><FileText size={13} /> 가입 동의서 작성</button>
        </div>
      </>)}
      {tab === "custom" && (<>
        <details style={{ margin: "2px 0 10px" }}><summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 13, color: "var(--blue)", padding: "8px 4px" }}>📋 검진대비보험 상품 상세·플랜 비교 펼쳐보기 (기본형·표준형·고급형 담보표)</summary>
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
            <thead><tr><th>담보</th><th>기본형<div style={{ fontSize: 10, color: "var(--soft)", fontWeight: 600 }}>국가검진</div></th><th>표준형<div style={{ fontSize: 10, color: "var(--soft)", fontWeight: 600 }}>종합검진</div></th><th className="hl">고급형<div style={{ fontSize: 10, color: "#0c4a6e", fontWeight: 600 }}>프리미엄검진</div></th></tr></thead>
            <tbody>{CHECK_COVERS.map((c, i) => <tr key={i} style={{ cursor: "pointer" }} onClick={() => setCover(c[1])} title="약관 상세 보기"><td>{c[1]}</td><td>{c[2]}</td><td>{c[3]}</td><td className="hl">{c[4]}</td></tr>)}</tbody>
          </table>
          <div className="chnote" style={{ marginTop: 8 }}>※ 암 진단금은 기타암 제외(갑상선암·기타피부암·제자리암·경계성종양 해당없음). 마음케어진단은 <b>기본형 100만원·표준형 200만원·고급형 300만원</b> 포함. 보이스피싱은 전 플랜 300만원(보장비율 70%).</div>
        </div>

        <div className="bklbl" style={{ margin: "2px 0 8px" }}><ShieldCheck size={14} color="#2563EB" style={{ verticalAlign: "-2px" }} /> 담보별 보장 상세 · 특별약관 <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>· 클릭하면 약관·보장표 조회</span></div>
        {CHECK_COVERS.map((c, i) => (
          <div className="adv" key={i} style={{ cursor: "pointer" }} onClick={() => setCover(c[1])} title="약관 상세 보기">
            <span className="ic" style={{ background: "#EAF0FE" }}><Art name={c[0]} size={20} /></span>
            <div style={{ flex: 1 }}><b>{c[1]}</b><p>{c[7]}</p><div style={{ fontSize: 10.5, color: "#7C3AED", fontWeight: 700, marginTop: 3 }}><FileText size={11} style={{ verticalAlign: "-2px" }} /> {c[6]} · 약관 보기 ›</div></div>
            <div style={{ alignSelf: "center", textAlign: "right", whiteSpace: "nowrap" }}><div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--blue)" }}>{c[4]}</div><div style={{ fontSize: 10, color: "var(--soft)" }}>최대 보장</div></div>
          </div>
        ))}

        <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
          <div className="rct"><CalendarCheck size={18} color="#2F5BEA" /> 검진 예약 → 자동가입 절차</div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,#0E9F6E 0%,#16A34A 45%,#0EA5E9 100%)", color: "#fff", borderRadius: 14, padding: "14px 16px", margin: "2px 0 14px", boxShadow: "0 14px 28px -16px rgba(14,165,233,.7)", position: "relative", overflow: "hidden" }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><Art name="coin" size={28} /></span>
            <div style={{ fontSize: 13.8, fontWeight: 700, lineHeight: 1.55 }}>검진 예약을 하면 자동으로 <b style={{ color: "#FDE68A" }}>건강토큰(Health Token)</b>이 적립되어 <b style={{ color: "#FDE68A" }}>무상 건강검진보험</b>이 가입됩니다.</div>
          </div>
          {[["검진 예약", "검진센터·일정을 예약하면 건강토큰(Health Token)이 적립되며 검진보험 가입이 함께 시작됩니다."], ["플랜 선택", "기본형·표준형·고급형 중 선택 (추가 보험료 0원·무상)."], ["자동가입 확정", "적립된 건강토큰으로 무상 가입 — 검진 15일 전부터 3개월간 보장(3개월 단위 연장)."], ["NFT 보험증서·결과 연동", "건강지갑에 SBT 증서 발행, 검진 결과가 자동 연동됩니다."], ["진단·수술 시 자동청구", "보장 사유 발생 시 검진·진료 기록으로 간편 청구."]].map(([t, d], i) => (
            <div className="istep" key={i}><span className="sn">{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="cbtn pri" style={{ margin: 0 }} onClick={() => setEnroll(true)}><CalendarCheck size={15} /> 검진 예약·자동가입 시작</button>
            <button className="cbtn" style={{ margin: 0, width: "auto", padding: "11px 16px" }} onClick={() => go("checkup")}><Building2 size={14} /> 검진센터 보기</button>
          </div>
        </div>
        <div className="chnote">※ 보험계약기간은 건강검진 15일 전부터 3개월(진단·수술 시까지)이며 3개월 단위로 연장 가능합니다. 보장금액·약관은 현대해상 전속 보험대리점 글로벌예방금융㈜ 및 GA코리아와의 전략적 제휴 운영 자료 기준 정리이며, 실제 가입·보장은 보험사 상품·고지·심사 및 정식 라이선스 채널에 따릅니다.</div>
        </details>
      </>)}

      {tab === "join" && <InsJoin onGo={go} />}

      {/* 과업3: 구 보장조회(INS_COVERAGE 정적 카드)·구 청구 탭(지급 52,000원 하드코딩)은 실데이터 탭(analysis·claimpay)으로 대체·삭제 */}

      {tab === "ai" && (<>
        <div className="airec">
          <div className="at"><MessageSquare size={16} color="#7C3AED" /> 하이 — 보험·보장 대화 상담</div>
          <div className="ap">약관과 제 데이터를 함께 학습한 <b>하이</b>가 보장·보험금·청구·면책·계약을 대화로 안내해 드려요. 무엇이든 물어보세요.</div>
        </div>
        <AIPlannerChat initialAsk={askSeed} onSimple={() => { setTab("premium"); setTimeout(() => { const el = document.querySelector(".sbins"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 350); }} />
      </>)}

      {/* 과업3 §4: 전용 「AI 보험·치료비 상담사」 슬롯 — 현 Phase는 보험 특화 대화(AIPlannerChat)로 연결, 차기 Phase에서 insService.ctx(tab) 컨텍스트를 받는 전용 상담사 본체 장착(정책: insService.policy) */}
      {tab !== "ai" && (
        <button className="cbtn pri" style={{ position: "fixed", right: 20, bottom: 96, width: "auto", margin: 0, zIndex: 40, borderRadius: 99, padding: "12px 18px", boxShadow: "0 14px 32px -12px rgba(37,99,235,.7)" }}
          onClick={() => { try { window.__hifinInsCtx = insService.ctx(tab); } catch (e) {} setTab("ai"); }}>
          <MessageSquare size={15} /> 보험 상담사
        </button>)}
      {cover && <CoverDetailModal name={cover} onClose={() => setCover(null)} />}
      {enroll && <EnrollModal onClose={() => setEnroll(false)} onGo={go} />}
      {modal && <InsModal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ====================== 건강금융지갑 ====================== */
