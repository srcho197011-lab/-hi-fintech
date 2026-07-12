/* ====================== 규제·거버넌스 콘솔 (데이터 하우스) ======================
   의료마이데이터 사업방법서 §6.5·§8·§9·§10·§15·§16 —
   분석결과 5구분 · 의료행위 경계 · SaMD 검토 · 4-DB 분리 · 외부 AI 전송통제 ·
   마이데이터 사업자 평가 · 사업 진행(Go/No-Go) 판단기준.
   ⚠️ 규제 통제 정책의 시각화·자가점검 콘솔. 실제 준수는 법률·보안 검토를 전제로 한다. */

/* 분석결과 5구분(§6.5) */
const CMP_ANALYSIS = [
  { k: "데이터 사실", col: "#64748B", ex: "공복혈당 130 mg/dL (참고치 70~99) — 검진 원천값" },
  { k: "AI 해석", col: "#2563EB", ex: "공복혈당장애 범위로 당대사 관리가 필요한 상태로 해석" },
  { k: "위험 예측", col: "#F59E0B", ex: "현 추세 유지 시 당뇨병 진행 위험 — 동년배 대비 +6.2%(참고)" },
  { k: "진료 권고", col: "#0E8FA6", ex: "내분비내과 방문·당화혈색소 재검을 권고(의료기관 안내)" },
  { k: "의료진 확정진단", col: "#DC2626", ex: "당뇨병 여부의 확정 진단·처방은 의료진 판단(AI 미확정)" },
];
/* 의료행위 경계(§10.1) */
const CMP_AICAN = ["검사결과 정리·시각화", "건강정보 쉬운 설명", "생활습관 관리 안내", "복약 알림", "병원 방문 권고", "의료기관 예약 지원", "보험보장 참고 분석"];
const CMP_DOCTOR = ["질병 확정진단", "처방·처방 변경", "수술·시술 결정", "의료영상 확정판독", "긴급성 최종판단", "질병 치료 지시"];
/* SaMD 리스크(§10.2) */
const CMP_SAMD = [
  { f: "검진결과 해석·설명", r: "낮음", note: "정보 제공 — SaMD 비해당(초기 서비스 범위)" },
  { f: "생활습관·복약 관리", r: "낮음", note: "웰니스 — SaMD 비해당" },
  { f: "질병 위험 예측(참고)", r: "중간", note: "참고정보로 제한, 확정진단 표현 금지 시 관리 가능" },
  { f: "질병 진단·의료진 의사결정 지원", r: "높음", note: "SaMD 해당 가능 — 별도 인허가 검토 필요(초기 미제공)" },
];
/* 4-DB 분리(§8.2) */
const CMP_DB = [
  { k: "식별정보 DB", ic: "id", d: "이름·연락처·생년월일·본인인증키", col: "#DC2626" },
  { k: "건강정보 DB", ic: "heart", d: "가명 회원키·검진·진료·처방·위험분석·관리성과", col: "#0E8FA6" },
  { k: "동의·권한 DB", ic: "lock", d: "동의항목·일자·유효기간·철회일·제공기관·이용목적", col: "#7C3AED" },
  { k: "상담기억 DB", ic: "chat", d: "상담요약·회원질문·건강목표·실천장애·후속조치", col: "#16A34A" },
];
/* 외부 생성형 AI 전송통제(§9) */
const CMP_AICTRL = [
  "소비자용 AI에 실명 건강정보 입력 금지", "기업용 API·전용환경만 사용", "모델 학습 미사용 계약 확인",
  "최소 데이터만 전송", "이름·주민번호 등 PII 제거", "AI 입출력 로그 접근통제", "해외이전 여부 확인",
];
/* 마이데이터 사업자 평가 12항목(§15) */
const CMP_VENDOR = [
  ["법적 자격", "지정·허가·공식 사업지위"], ["실제 데이터", "제공 가능 기관·항목"], ["공단 연계", "국민건강보험공단 데이터 제공"],
  ["검진센터 연계", "종합검진 데이터 수신"], ["분석기능", "만성·중대질환 위험분석"], ["모델 검증", "정확도·검증기관·버전관리"],
  ["API", "명세·속도·안정성·테스트"], ["보안", "인증·암호화·접근통제·관제"], ["회원권리", "동의·철회·삭제·정정"],
  ["비용", "초기·건당·월·최소물량"], ["책임", "오류·유출·장애 책임"], ["확장성", "대량회원·다기관 연계"],
];
/* Go/No-Go 판단기준(§16) */
const CMP_GONOGO = [
  "회원의 적법한 데이터 전송 경로가 있는가?",
  "의료마이데이터 사업자와 서면계약이 체결됐는가?",
  "실제 제공 가능한 데이터 항목·API가 확인됐는가?",
  "회원 1인당 데이터·AI·운영 원가보다 매출이 큰가?",
  "의료·보험·개인정보 규제에 맞는 운영구조인가?",
];

function ComplianceConsole() {
  const [tab, setTab] = useState("analysis");
  const SUB = [["analysis", "분석결과 5구분", Bot], ["scope", "의료행위 경계", Stethoscope], ["samd", "SaMD 검토", ShieldCheck], ["db", "데이터 아키텍처", Database], ["aictrl", "외부 AI 통제", Server], ["vendor", "사업자 평가", Route], ["gonogo", "Go/No-Go", Scale]];
  const _icby = { id: Fingerprint, heart: HeartPulse, lock: Lock, chat: MessageSquare };
  // 사업자 평가 상태
  const [scores, setScores] = useState(() => CMP_VENDOR.map(() => 2));
  const vAvg = (scores.reduce((s, x) => s + x, 0) / scores.length);
  const vGrade = vAvg >= 2.5 ? ["적합", "#16A34A"] : vAvg >= 1.5 ? ["보완 필요", "#F59E0B"] : ["부적합", "#EF4444"];
  // Go/No-Go 상태
  const [gng, setGng] = useState(CMP_GONOGO.map(() => false));
  const goCount = gng.filter(Boolean).length;
  const verdict = goCount === CMP_GONOGO.length ? ["GO — 대규모 개발·투자 검토 가능", "#16A34A", "#0E241C"] : ["NO-GO — 미확인 항목 존재, 대규모 확장 보류", "#EF4444", "#2A1212"];

  return (
    <div className="cmp">
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#221033,#0F1B33)", borderColor: "#3B2258" }}>
        <span className="ontstore-ic" style={{ background: "#1A0E2A" }}><Scale size={15} color="#C4B5FD" /></span>
        <div><b>규제·거버넌스 콘솔</b><p>의료마이데이터 사업방법서의 <b>규제 통제 항목</b>을 시각화·자가점검합니다 — 분석결과 5구분, 의료행위/AI 경계, SaMD 검토, 4-DB 분리, 외부 AI 전송통제, 사업자 평가, 사업 진행 판단(Go/No-Go). <b style={{ color: "#C4B5FD" }}>플랫폼 운영의 법적·안전 전제를 점검하는 콘솔</b>입니다.</p></div>
      </div>

      <div className="aitabs" style={{ margin: "12px 0" }}>{SUB.map(([k, t, Ic]) => <div key={k} className={`aitab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Ic size={14} /> {t}</div>)}</div>

      {tab === "analysis" && <>
        <div className="cmp-h">분석결과 5구분 <span>§6.5 · AI 위험예측을 확정진단으로 표시하지 않는다</span></div>
        <div className="cmp-5">{CMP_ANALYSIS.map((a, i) => (
          <div className="cmp-5r" key={a.k} style={{ borderLeftColor: a.col }}>
            <span className="cmp-5b" style={{ color: a.col, background: a.col + "1E" }}>{i + 1}. {a.k}</span>
            <span className="cmp-5e">{a.ex}</span>
          </div>
        ))}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 상담·리포트에서 데이터 사실 / AI 해석 / 위험 예측 / 진료 권고 / 의료진 확정진단을 라벨로 구분해 표시합니다. AI는 진단·처방을 확정하지 않습니다.</div>
      </>}

      {tab === "scope" && <>
        <div className="cmp-h">건강관리 vs 의료행위 경계 <span>§10.1</span></div>
        <div className="cmp-2col">
          <div className="cmp-col ok"><div className="cmp-colh"><Check size={14} /> AI(하이핀)가 가능</div>{CMP_AICAN.map((x) => <div className="cmp-li" key={x}>{x}</div>)}</div>
          <div className="cmp-col no"><div className="cmp-colh"><Stethoscope size={14} /> 의료진에게 이관</div>{CMP_DOCTOR.map((x) => <div className="cmp-li" key={x}>{x}</div>)}</div>
        </div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 이상소견·고위험·긴급 신호는 상담 라우팅에서 의료기관 진료로 연결하며, AI는 최종 판단을 대신하지 않습니다.</div>
      </>}

      {tab === "samd" && <>
        <div className="cmp-h">소프트웨어 의료기기(SaMD) 규제 검토 <span>§10.2</span></div>
        {CMP_SAMD.map((s) => { const rc = s.r === "높음" ? "#EF4444" : s.r === "중간" ? "#F59E0B" : "#16A34A"; return (
          <div className="cmp-samd" key={s.f}><span className="cmp-sf">{s.f}</span><span className="cmp-sr" style={{ color: rc, background: rc + "1A" }}>{s.r}</span><span className="cmp-sn">{s.note}</span></div>
        ); })}
        <div className="chnote" style={{ marginTop: 10 }}>※ AI가 질병 진단·예측 또는 의료진 의사결정을 직접 지원하면 SaMD 해당 가능 → 초기 서비스는 <b>참고정보·생활관리·진료권고</b>로 범위를 제한합니다.</div>
      </>}

      {tab === "db" && <>
        <div className="cmp-h">데이터 저장 아키텍처 · 4-DB 분리 <span>§8.2</span></div>
        <div className="cmp-dbgrid">{CMP_DB.map((d) => { const Ic = _icby[d.ic] || Database; return (
          <div className="cmp-db" key={d.k} style={{ borderTopColor: d.col }}><div className="cmp-dbh"><Ic size={15} color={d.col} /> {d.k}</div><div className="cmp-dbd">{d.d}</div></div>
        ); })}</div>
        <div className="cmp-key"><KeyRound size={14} color="#C4B5FD" /> 식별정보와 건강정보는 <b>분리 저장</b>하고 별도 <b>연결키</b>로만 매핑합니다. 유출 시에도 원문·신원 결합을 차단합니다.</div>
      </>}

      {tab === "aictrl" && <>
        <div className="cmp-h">외부 생성형 AI 데이터 전송통제 <span>§9</span></div>
        <div className="cmp-ctrl">{CMP_AICTRL.map((x) => <div className="cmp-cli" key={x}><ShieldCheck size={13} color="#34D399" /> {x}</div>)}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 실명 건강정보는 일반 소비자용 AI에 입력하지 않으며, 기업용 API·전용환경에서 <b>최소 데이터·PII 제거</b> 후 처리하고 학습 미사용을 계약으로 확인합니다.</div>
      </>}

      {tab === "vendor" && <>
        <div className="cmp-h">마이데이터 사업자 선정 평가 <span>§15 · 12항목</span><span className="cmp-vgrade" style={{ color: vGrade[1], background: vGrade[1] + "1A" }}>{vGrade[0]} · 평균 {vAvg.toFixed(1)}/3</span></div>
        <div className="cmp-vtbl">{CMP_VENDOR.map(([k, d], i) => (
          <div className="cmp-vrow" key={k}>
            <div className="cmp-vk"><b>{k}</b><span>{d}</span></div>
            <div className="cmp-vsc">{[0, 1, 2, 3].map((n) => <button key={n} className={"cmp-vdot" + (scores[i] >= n && n > 0 ? " on" : "") + (n === 0 ? " zero" : "")} onClick={() => setScores((p) => p.map((v, j) => j === i ? n : v))} title={["미확인", "미흡", "보통", "우수"][n]}>{n || "–"}</button>)}</div>
          </div>
        ))}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 자료 제출 없이 구두로 "모든 의료데이터 연계 가능"이라는 업체와는 계약하지 않습니다. 지정서·항목표·API명세·모델 검증자료·견적서·표준계약서 확인이 전제입니다.</div>
      </>}

      {tab === "gonogo" && <>
        <div className="cmp-h">사업 진행(Go/No-Go) 판단기준 <span>§16 · 5가지</span></div>
        <div className="cmp-gng">{CMP_GONOGO.map((q, i) => (
          <label key={i} className={"cmp-gq" + (gng[i] ? " on" : "")} onClick={() => setGng((p) => p.map((v, j) => j === i ? !v : v))}>
            <span className="cmp-gc">{gng[i] ? <Check size={13} /> : null}</span>{q}
          </label>
        ))}</div>
        <div className="cmp-verdict" style={{ color: verdict[1], background: verdict[2], borderColor: verdict[1] + "55" }}>
          <b>{goCount}/{CMP_GONOGO.length} 확인</b> — {verdict[0]}
        </div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 특히 "국민건강보험공단 데이터도 제공 가능"이라는 말은 <b>계약상 제공항목·실제 테스트 결과</b>가 확인되기 전까지 확정된 것으로 보지 않습니다. 위 5가지가 확인되지 않으면 대규모 개발·투자를 진행하지 않습니다.</div>
      </>}
    </div>
  );
}
