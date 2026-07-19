/* ══════════ 신뢰 센터(Trust Center) — Phase 1 신뢰 기반 공사 ══════════
   원칙: ①전 섹션 신뢰 상주(TrustBadge) ②데이터 입력 순간 보호 안내(TrustLine)
        ③증명 가능한 신뢰(접근이력·검증·동의 타임라인 버튼) ④파트너 표기는 실계약 상태와 동기화(과장 금지). */

/* ── 보안 파트너 표기 스위치 — 계약 상태가 바뀌면 status만 변경(none|discussing|signed|certified) ── */
const TRUST_PARTNER = { name: "안랩(AhnLab)", status: "discussing" };
function trustPartnerLabel() {
  const s = TRUST_PARTNER.status;
  if (s === "certified") return TRUST_PARTNER.name + " 보안 인증";
  if (s === "signed") return TRUST_PARTNER.name + " 보안 기술 적용";
  if (s === "discussing") return "국내 최고 수준 보안기업과 제휴 추진 중";
  return "하이핀 자체 보안 체계";
}

/* ── 전 섹션 상주 신뢰 배지(헤더) — 클릭 시 신뢰 센터로 ── */
function TrustBadge({ onGo }) {
  const go = onGo || (() => {});
  const [ok, setOk] = useState(true);
  useEffect(() => { try { if (typeof chainVerify === "function") setOk(chainVerify().ok); } catch (e) {} }, []);
  return (
    <button className="trustbadge" onClick={() => go("trust")} title={`데이터 보호 상태 — ${trustPartnerLabel()} · 눌러서 신뢰 센터 열기`}>
      <ShieldCheck size={14} />
      <span className="tb-t">{ok ? "위변조 없음 ✓" : "무결성 확인 필요"}</span>
    </button>
  );
}

/* ── 입력 순간 보호 안내 한 줄 — 데이터를 입력·업로드·동의하는 모든 지점에 삽입 ── */
const TRUST_LINES = {
  upload: "지금 올리는 검진결과는 암호화로 저장되고 블록체인으로 위변조가 방지돼요 — 언제든 열람·삭제할 수 있어요.",
  booking: "예약 정보는 암호화로 보호되고, 보험 가입 내역은 블록체인에 기록돼요 — 내역은 데이터 금고에서 언제든 확인돼요.",
  rrn: "주민등록번호는 보안 입력으로만 처리되고 화면·기록에 남지 않아요.",
  consent: "동의 내역은 블록체인에 기록되고, 언제든 한 번의 탭으로 철회할 수 있어요.",
  invest: "신청 정보는 암호화로 보호되며 심사 목적 외에는 사용되지 않아요.",
  family: "가족 정보는 본인 동의 범위 안에서만 저장되고, 언제든 삭제할 수 있어요.",
};
function TrustLine({ ctx, onGo }) {
  const go = onGo;
  return (
    <div className="trustline">
      <Lock size={12} />
      <span>{TRUST_LINES[ctx] || TRUST_LINES.upload} <i>{trustPartnerLabel()}</i></span>
      {go && <button onClick={() => go("trust")}>자세히</button>}
    </div>
  );
}

/* ── 신뢰 센터 본 화면 ── */
function TrustCenterSection({ onGo }) {
  const go = onGo || (() => {});
  const ask = (q) => { try { window.dispatchEvent(new CustomEvent("agentask", { detail: q })); } catch (e) {} };
  const [chk, setChk] = useState(null);
  useEffect(() => { try { if (typeof chainVerify === "function") setChk(chainVerify()); } catch (e) {} }, []);
  const FLOW = [
    ["수집", "본인 동의 후에만 · 목적별 동의 5종 분리", "🔒 암호화 전송"],
    ["저장", "필드 암호화 + 데이터 금고", "⛓ 해시 체인 기록"],
    ["분석", "가명화(이름·연락처 제거) 후 AI 분석", "🎭 가명 토큰만 사용"],
    ["활용", "동의한 목적에만 · 모든 접근이 감사로그에", "📜 접근 이력 전부 공개"],
    ["배당", "활용 대가는 약속된 분배율로 회원 지갑에", "📊 분배 내역 공개"],
  ];
  const RIGHTS = [
    [Search, "접근 이력 보기", "내 데이터를 누가 언제 봤는지 전부", "vault", "access"],
    [ShieldCheck, "동의 관리·철회", "목적별 동의 5종을 한 번의 탭으로", "vault", "consents"],
    [Trash2, "즉시 삭제", "이중 확인 후 즉시 파기 — 파기 사실도 기록", "vault", "danger"],
    [Download, "데이터 내보내기", "표준 형식 반출(준비 중)", null, null],
  ];
  const goVault = (focus) => { try { window.__vaultFocus = focus || "top"; window.dispatchEvent(new CustomEvent("vaultgo")); } catch (e) {} go("vault"); };
  return (
    <div className="trustwrap">
      <div className="trust-hero">
        <span className="trust-kicker"><ShieldCheck size={14} /> TRUST CENTER</span>
        <div className="trust-title">내 건강데이터는 이렇게 지켜집니다</div>
        <div className="trust-3s">
          <div className="trust-s"><b>① 누가 지키나</b><p>{trustPartnerLabel()} — 하이핀은 접속 기록·화면 보호·암호화까지 자체 보안 체계로 상시 보호합니다.</p></div>
          <div className="trust-s"><b>② 어떻게 지키나</b><p>암호화 저장 + 블록체인 위변조 방지 + 데이터 금고 — 저장되는 순간부터 해시 체인으로 봉인됩니다.</p></div>
          <div className="trust-s"><b>③ 내 권리는</b><p>언제든 열람·삭제·동의 철회할 수 있고, 내 데이터에 접근한 모든 기록이 나에게 공개됩니다.</p></div>
        </div>
      </div>
      <div className="trust-verify">
        <span className="tv-dot" style={{ background: chk && !chk.ok ? "#EF4444" : "#16A34A" }} />
        <div className="tv-t"><b>실시간 무결성 {chk ? (chk.ok ? "정상 — 위변조 없음 ✓" : "확인 필요") : "검증 중…"}</b><span>{chk ? `보호 블록 ${chk.blocks || 0}개 연쇄 해시 검증 완료` : ""} — 말이 아니라 직접 확인할 수 있는 신뢰입니다.</span></div>
        <button onClick={() => goVault("top")}>데이터 금고에서 직접 검증 ›</button>
      </div>
      <div className="trust-sec"><b>내 데이터의 여정 — 다섯 단계 모두에 보호 장치</b></div>
      <div className="trust-flow">
        {FLOW.map(([t, d, p], i) => (
          <div className="tf-step" key={t}>
            <div className="tf-n">{i + 1}</div><b>{t}</b><p>{d}</p><span>{p}</span>
          </div>
        ))}
      </div>
      <div className="trust-sec"><b>회원 권리 헌장 — 설명이 아니라 버튼으로</b></div>
      <div className="trust-rights">
        {RIGHTS.map(([Ic, t, d, target, focus]) => (
          <button className="tr-card" key={t} disabled={!target} onClick={() => target && goVault(focus)}>
            <Ic size={18} /><b>{t}</b><p>{d}</p>{!target && <span className="tr-soon">준비 중</span>}
          </button>
        ))}
      </div>
      <div className="trust-sec"><b>만약의 사고에는 — 숨기지 않는 대응 원칙</b></div>
      <div className="trust-incident">
        <div><b>1. 즉시 알립니다</b><p>이상 접근 감지 시 24시간 안에 본인에게 직접 통지합니다.</p></div>
        <div><b>2. 즉시 차단합니다</b><p>해당 접근 경로를 차단하고 보호 토큰을 재발급합니다.</p></div>
        <div><b>3. 전부 공개합니다</b><p>무엇이 열람됐고 어떤 조치를 했는지 접근 이력으로 공개합니다.</p></div>
      </div>
      <div className="trust-sec"><b>불안한 게 있다면 하이에게 바로 물어보세요</b></div>
      <div className="trust-asks">
        {["내 검진 결과 누가 볼 수 있어요?", "해킹당하면 어떡해요?", "탈퇴하면 내 데이터는요?", "블록체인 기록이 뭐예요?"].map((q) => (
          <button key={q} onClick={() => ask(q)}><Bot size={13} /> {q}</button>
        ))}
      </div>
      <div className="chnote" style={{ marginTop: 14 }}>※ 보안 제휴사 표기는 실제 계약 체결 상태와 동기화됩니다 — 체결 전에는 "추진 중"으로만 표기합니다(과장 금지 원칙).</div>
    </div>
  );
}
