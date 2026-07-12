/* ====================== 사업 운영 콘솔 (온톨로지·하네스) ======================
   의료마이데이터 사업방법서 §11·§12·§13·§14 —
   수익모델(B2C 구독·B2B + 가드레일) · 5단계 추진 로드맵 · KPI 5범주 · 리스크 레지스터.
   ⚠️ 사업·운영 계획의 시각화. 수익·법적 주의사항은 규제 검토를 전제로 한다. */

const BIZ_TIERS = [
  { name: "무료", price: "₩0", per: "", feat: ["검진결과 통합 보관", "기본 건강 리포트", "AI KB 질환·검진 안내"], cta: "기본 제공", best: false },
  { name: "라이트", price: "₩9,900", per: "/월", feat: ["무료 기능 전체", "월 AI 건강상담", "맞춤 건강관리계획", "정기 건강 리포트"], cta: "라이트 시작", best: false },
  { name: "프리미엄", price: "₩29,900", per: "/월", feat: ["라이트 기능 전체", "지속 건강관리·모니터링", "홈케어 기기 연동", "전문가 상담 연결", "우리가족 건강관리"], cta: "프리미엄 시작", best: true },
];
const BIZ_B2B = [
  { k: "검진센터 제휴", d: "사후관리 솔루션·검진 CRM·미수검자·재검 관리", guard: "진료비 연동 수수료 구조 배제(의료법 유인·알선)" },
  { k: "기업 건강관리", d: "임직원 검진 사후관리·고위험군 관리·건강교육", guard: "개인 질병정보 X — 적법 처리된 통계만 제공" },
  { k: "보험사 제휴", d: "검진 대비보험·가입자 건강관리·청구지원", guard: "건강관리 동의를 보험 마케팅 동의로 전환 금지" },
  { k: "건강관리 상품", d: "홈케어기기·식단·운동·영양·심리케어", guard: "건강위험 과장으로 구매 유도 금지" },
];
const BIZ_ROADMAP = [
  { s: "계약·설계", goal: "사업자 선정·제공 데이터 확인·법적 역할·API 명세·단가 협상·계약·개인정보 영향분석", gate: "제공항목표·API 명세·계약서·테스트 계정 확인(구두 설명만으로 착수 금지)" },
  { s: "소규모 실증", goal: "제휴 검진센터 1곳·회원 100~1,000명·제한된 검사·상담 기능", gate: "동의완료율·수신성공률·누락률·상담참여율·병원방문 전환율·1인당 원가" },
  { s: "유료화 검증", goal: "실제 유료회원·검진센터·기업·보험사 계약 확보", gate: "실제 유료고객·서면계약·마이데이터 제공계약·데이터 단가 포함 흑자·병원연계 적법성" },
  { s: "상용화", goal: "회원 1만+·다수 검진센터·의료기관 네트워크·기기연동·기업/보험 서비스", gate: "ISMS-P 인증·24h 보안관제·AI 품질평가 체계" },
  { s: "직접 전문기관", goal: "개인정보관리 전문기관 지정 검토", gate: "반복매출·운영인력·보안조직·심사 대응·인프라 여력·직접운영 경제성 우월" },
];
const BIZ_KPI = [
  { cat: "데이터", col: "#0E8FA6", ms: [["회원 동의율", "82%"], ["데이터 연결률", "74%"], ["전송 성공률", "99.2%"], ["데이터 완전성", "96%"]] },
  { cat: "상담", col: "#7C3AED", ms: [["상담 참여율", "61%"], ["반복 이용률", "44%"], ["건강정보 이해도", "88%"], ["전문가 이관율", "7%"]] },
  { cat: "의료연계", col: "#2563EB", ms: [["예약 전환율", "38%"], ["실제 방문율", "72%"], ["재검사 완료율", "65%"]] },
  { cat: "건강관리", col: "#16A34A", ms: [["복약 순응도", "83%"], ["측정 이행률", "58%"], ["위험등급 개선율", "21%"]] },
  { cat: "사업", col: "#EA580C", ms: [["유료 전환율", "9%"], ["회원당 매출", "월 6,800원"], ["고객획득비(CAC)", "24,000원"], ["계약 유지율", "91%"]] },
];
const BIZ_RISK = [
  { r: "마이데이터 제공범위가 예상보다 좁음", i: "높음", c: "계약 전 항목표·API 샘플·테스트 계정 검증, 불가능 항목은 계획에서 제외" },
  { r: "데이터 단가가 과도함", i: "중간", c: "1인당 총원가 계산·월 호출 제한·신규 데이터 발생 시만 갱신·기본/프리미엄 분리" },
  { r: "분석보고서 정확도 부족", i: "높음", c: "모델 검증자료 요구·위험도 근거 표시·의료진 검토·확정진단 표현 금지·오류 정정" },
  { r: "회원이 상담을 이용하지 않음", i: "중간", c: "검진 직후 자동연결·핵심위험 3개 우선·음성/문자/영상 선택·짧고 구체적 목표" },
  { r: "의료법·보험업법 문제", i: "높음", c: "병원 소개수수료 배제·의료진/AI 역할분리·보험상담 자격 구분·동의 분리·변호사 검토" },
  { r: "개인정보 유출", i: "높음", c: "데이터 분리보관·암호화·최소권한·접근로그·외부 AI 전송통제·사고대응·사이버보험" },
];

function BizOpsConsole({ onGo }) {
  const [tab, setTab] = useState("revenue");
  const [rd, setRd] = useState(0);
  const SUB = [["revenue", "수익모델", Coins], ["roadmap", "추진 로드맵", Route], ["kpi", "KPI", Target], ["risk", "리스크", AlertTriangle]];
  return (
    <div className="biz">
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#1A1030,#0F1B33)", borderColor: "#4A2A6B" }}>
        <span className="ontstore-ic" style={{ background: "#14091F" }}><Target size={15} color="#C4B5FD" /></span>
        <div><b>사업 운영 콘솔</b><p>사업방법서의 <b>수익모델·추진 로드맵·KPI·리스크</b>를 운영 관점에서 정리합니다. B2C 구독과 B2B 채널에는 각각 <b>법적 가드레일</b>이 붙고, 단계별 <b>검증 게이트</b>와 <b>KPI·리스크 통제</b>로 지속 가능성을 점검합니다.</p></div>
      </div>

      <div className="aitabs" style={{ margin: "12px 0" }}>{SUB.map(([k, t, Ic]) => <div key={k} className={`aitab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={14} /> {t}</div>)}</div>

      {tab === "revenue" && <>
        <div className="biz-h">B2C 구독 요금제 <span>§11.1</span></div>
        <div className="biz-tiers">{BIZ_TIERS.map((t) => (
          <div className={"biz-tier" + (t.best ? " best" : "")} key={t.name}>
            {t.best && <span className="biz-badge">추천</span>}
            <div className="biz-tn">{t.name}</div>
            <div className="biz-tp">{t.price}<em>{t.per}</em></div>
            <div className="biz-tf">{t.feat.map((f) => <div key={f}><Check size={13} color="#16A34A" /> {f}</div>)}</div>
            <button className={"biz-tcta" + (t.best ? " pri" : "")} onClick={() => onGo && onGo("mywallet")}>{t.cta}</button>
          </div>
        ))}</div>
        <div className="biz-h" style={{ marginTop: 20 }}>B2B 채널 · 법적 가드레일 <span>§11.2–11.4</span></div>
        <div className="biz-b2b">{BIZ_B2B.map((b) => (
          <div className="biz-bc" key={b.k}><div className="biz-bk">{b.k}</div><div className="biz-bd">{b.d}</div><div className="biz-bg"><ShieldCheck size={12} color="#EA580C" /> {b.guard}</div></div>
        ))}</div>
      </>}

      {tab === "roadmap" && <>
        <div className="biz-h">5단계 추진 로드맵 <span>§12 · 단계별 검증 게이트</span></div>
        <div className="biz-rdbar">{BIZ_ROADMAP.map((r, i) => <button key={i} className={"biz-rdstep" + (i === rd ? " on" : "") + (i < rd ? " done" : "")} onClick={() => setRd(i)}><i>{i + 1}</i>{r.s}</button>)}</div>
        <div className="biz-rddetail">
          <div className="biz-rdh">{rd + 1}단계 · {BIZ_ROADMAP[rd].s}</div>
          <div className="biz-rdrow"><span>목표</span><b>{BIZ_ROADMAP[rd].goal}</b></div>
          <div className="biz-rdrow"><span>검증 게이트</span><b>{BIZ_ROADMAP[rd].gate}</b></div>
        </div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 각 단계의 검증 게이트가 확인되지 않으면 다음 단계로 확장하지 않습니다. 특히 "공단 데이터 제공 가능"은 계약·테스트 확인 전까지 확정으로 보지 않습니다.</div>
      </>}

      {tab === "kpi" && <>
        <div className="biz-h">KPI 체계 · 5범주 <span>§13</span></div>
        <div className="biz-kpi">{BIZ_KPI.map((g) => (
          <div className="biz-kg" key={g.cat} style={{ borderTopColor: g.col }}>
            <div className="biz-kgh" style={{ color: g.col }}>{g.cat} KPI</div>
            {g.ms.map(([k, v]) => <div className="biz-km" key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>
        ))}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 예시 지표입니다. 실서비스에서는 동의·전송·상담·의료연계·건강관리·사업 지표를 실시간 계측해 손익분기 회원 수까지 추적합니다.</div>
      </>}

      {tab === "risk" && <>
        <div className="biz-h">리스크 레지스터 · 6종 <span>§14</span></div>
        <div className="biz-risk">{BIZ_RISK.map((r, i) => { const ic = r.i === "높음" ? "#EF4444" : "#F59E0B"; return (
          <div className="biz-rk" key={i}>
            <div className="biz-rkt">위험 {i + 1}. {r.r} <span style={{ color: ic, background: ic + "1A" }}>{r.i}</span></div>
            <div className="biz-rkc"><ShieldCheck size={12} color="#16A34A" /> {r.c}</div>
          </div>
        ); })}</div>
      </>}
    </div>
  );
}
