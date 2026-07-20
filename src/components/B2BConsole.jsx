/* ====================== Phase 7 — B2B 콘솔: 기관 구독(D5)·의사 콘솔(D5)·검증기관 노드(D6)·거버넌스(A7) ====================== */

/* 구독료 — finModel 단일 소스(finSubFee)에서 연차별 요금 산출 */
function b2bSubFee(y) {
  try { if (typeof finSubFee === "function" && typeof finParams === "function") return finSubFee(finParams(), y); } catch (e) {}
  return y === 0 ? 0 : Math.min(3000000, 500000 + 500000 * (y - 1));
}
const B2B_INST = { name: "365가정의학과의원", type: "의원 · 원격주치의 참여기관", year: 2, since: "2025.11", nextBill: "2026.08.01",
  usage: [["원격진료 상담", 42, "건"], ["AI 예진 요약 수신", 38, "건"], ["전자처방 발행", 27, "건"], ["EMR 연동 조회", 156, "회"], ["UPI 결제·청구 연동", 31, "건"]], newPatients: 7 };

/* ── ① 기관 구독 콘솔 ── */
function B2BSubsConsole() {
  const fee = b2bSubFee(B2B_INST.year - 1);
  const maxU = Math.max(...B2B_INST.usage.map((u) => u[1]));
  const years = [1, 2, 3, 4, 5, 6, 7];
  const askHi = (q) => { try { window.dispatchEvent(new CustomEvent("agentask", { detail: q })); } catch (e) {} };
  return (
    <div className="b2b-pane">
      <div className="b2b-grid2">
        <div className="b2b-card">
          <div className="b2b-ch"><Building2 size={15} color="#2563EB" /> 우리 기관 구독 현황 <span className="b2b-demo">시연용 예시 기관</span></div>
          <div className="b2b-inst"><b>{B2B_INST.name}</b><span>{B2B_INST.type} · {B2B_INST.since} 참여</span></div>
          <div className="b2b-feerow">
            <div><em>{B2B_INST.year}차연도</em><b>월 {(fee / 10000).toLocaleString()}만원</b><span>다음 결제 {B2B_INST.nextBill} · UPI 자동정산</span></div>
            <div className="b2b-roi"><b>+{B2B_INST.newPatients}명</b><span>이번 달 비대면 상담 → 내원 전환</span></div>
          </div>
          <div className="b2b-ulbl">이번 달 이용량</div>
          {B2B_INST.usage.map((u) => (
            <div className="b2b-usage" key={u[0]}><span>{u[0]}</span><div className="b2b-bar"><i style={{ width: Math.round(u[1] / maxU * 100) + "%" }} /></div><b>{u[1]}{u[2]}</b></div>
          ))}
          <div className="b2b-bill"><FileText size={13} /> 월 청구서: 플랫폼 구독 {(fee / 10000).toLocaleString()}만원 (원격진료 모듈·AI 예진·전자처방 연동·EMR/UPI 사용료 포함 — 추가 과금 없음)</div>
        </div>
        <div className="b2b-card">
          <div className="b2b-ch"><Coins size={15} color="#F59E0B" /> 침투 요금제 — 1차연도 무료, 이후 단계 인상</div>
          <p className="b2b-p">시장 선점을 위해 <b>1차연도 0원</b>으로 시작하고, 2차연도부터 월 50만원 → 매년 +50만원씩, <b>월 300만원 상한</b>에서 멈춥니다. 재무모델(finModel)과 동일한 단일 소스 수치예요.</p>
          <div className="b2b-feechart">{years.map((y) => { const f = b2bSubFee(y - 1); return (
            <div className={`b2b-feebar ${y === B2B_INST.year ? "now" : ""}`} key={y}><i style={{ height: Math.max(6, Math.round(f / 3000000 * 100)) + "%" }} /><b>{f === 0 ? "무료" : (f / 10000) + "만"}</b><span>{y}차</span></div>
          ); })}</div>
          <ul className="b2b-inc">
            <li><Check size={12} /> 원격주치의 매칭·화상/메시지 진료·AI 예진 요약</li>
            <li><Check size={12} /> 전자처방→약국 전달·청구 0단계(보험 연동)</li>
            <li><Check size={12} /> EMR 연동·UPI 결제·검진 데이터 리포트</li>
            <li><Check size={12} /> 신규 환자 유치(비대면→내원 연계)·품질 인증 배지</li>
          </ul>
          <div className="b2b-btns"><button onClick={() => askHi("구독료 정책 알려줘")}>🤖 하이에게 구독료 정책 묻기</button><button onClick={() => askHi("3차연도 매출 얼마야?")}>📊 구독 매출 전망 보기</button></div>
        </div>
      </div>
    </div>
  );
}

/* ── ② 의사 콘솔 ── */
/* 의사 시점 상담 화면 — 예진 고정 + 환자 채팅 + 처방·검사·내원·진료종료 액션(시연 스크립트) */
const DRC_SCRIPT = {
  q1: ["아버지 혈압이 오늘 새벽 152/94까지 올라서 걱정돼서 연결했어요. 어지럼은 없다고 하시는데 약은 드시고 계세요.", "네, 암로디핀 5mg 하루 한 번 드세요. 최근 며칠 잠을 잘 못 주무시긴 했어요.", "알겠습니다, 말씀하신 대로 아침·저녁으로 재서 올릴게요. 감사합니다 선생님."],
  q2: ["팔 안쪽에 붉은 발진이 일주일째예요. 사진 첨부했는데 가렵기도 해요.", "생각해보니 새 세제로 바꾼 뒤부터 그런 것 같아요.", "네, 연고 처방해주시면 잘 바르고 일주일 뒤에 다시 보여드릴게요!"],
  q3: ["혈압이 오늘 아침 125에 75였어요. 약은 꼬박꼬박 먹고 있습니다.", "부작용은 특별히 없어요. 가끔 발목이 조금 붓는 느낌은 있어요.", "네 선생님, 다음 달에도 측정해서 보내드릴게요."],
};
const DRC_MED = { q1: "암로디핀정 5mg — 1일 1회(부친 재진 연계)", q2: "하이드로코르티손 연고 1% — 1일 2회 도포 · 7일분", q3: "암로디핀정 5mg — 1일 1회 아침 · 28일분" };
/* 실시간 영상 상담 데모 — 실물 데모 영상(의사 1 · 남성 환자 1 · 여성 환자 2 재사용) */
const DRC_VID = { doctor: "data/media/tele_doctor.mp4", q1: "data/media/tele_pt_male.mp4", q2: "data/media/tele_pt_female.mp4", q3: "data/media/tele_pt_female.mp4" };
const DRC_SHARE = {
  q1: [{ k: "rpm", t: "혈압 추이(RPM 자동수집)", kind: "chart", data: [["7/17", "132/84", 132], ["7/18", "141/88", 141], ["새벽 2:17", "152/94", 152]] }, { k: "med", t: "복약 기록", kind: "note", text: "암로디핀 5mg — 매일 아침 1회 · 최근 7일 복용률 100% · 어지럼 보고 없음" }],
  q2: [{ k: "p1", t: "피부 발진 사진(환자 제공)", kind: "photo", src: "data/media/tele_pt_female.mp4" }, { k: "v1", t: "환부 영상(환자 제공)", kind: "video", src: "data/media/tele_pt_female.mp4" }],
  q3: [{ k: "bp", t: "자가 혈압 기록(30일)", kind: "chart", data: [["6/22", "128/78", 128], ["7/5", "126/76", 126], ["오늘", "125/75", 125]] }, { k: "med", t: "복약 기록", kind: "note", text: "암로디핀 5mg — 아침 1회 · 부작용 보고 없음 · 가끔 발목 부종 언급" }],
};
/* SOAP 진료기록 — 의사 화면 전용 메모(localStorage 저장) */
function DrcSoap({ qid }) {
  const key = "hifin_soap_" + qid;
  const [v, setV] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "null") || { s: "", o: "", a: "", p: "" }; } catch (e) { return { s: "", o: "", a: "", p: "" }; } });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const save = () => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} if (typeof toast === "function") toast("📋 SOAP 진료기록 저장 — 진료 종료 시 요약에 반영됩니다."); };
  const F = [["s", "S · 주관적(환자 호소)", "예: 새벽 혈압 상승 걱정, 어지럼은 없음"], ["o", "O · 객관적(측정·소견)", "예: BP 152/94(새벽) · RPM 3일 연속 상승"], ["a", "A · 평가(판단)", "예: 조절 양호하나 야간 상승 관찰 필요"], ["p", "P · 계획(처방·추적)", "예: 동일 처방 유지 · 2주 후 재측정 리마인드"]];
  return (<div className="dvm-soap">{F.map(([k, l, ph]) => (<div key={k}><label>{l}</label><textarea rows={2} value={v[k]} onChange={set(k)} placeholder={ph} /></div>))}<button onClick={save}>💾 진료기록 저장</button><span>의사 화면 전용 — 환자에게는 진료 요약만 전달됩니다</span></div>);
}
/* 의사용 실시간 영상 상담 — 환자 영상 스테이지 + 의사 PIP + 공유 자료 + SOAP */
function DoctorVideoModal({ q, onClose, msgs, onSend }) {
  const [vin, setVin] = useState(""); const [panel, setPanel] = useState("share"); const [shared, setShared] = useState(null);
  const chat = msgs.filter((m) => m.who !== "sys").slice(-3);
  const sendV = () => { const x = vin.trim(); if (!x) return; setVin(""); onSend(x); };
  const items = DRC_SHARE[q.id] || [];
  return (
    <div className="dvm" onClick={onClose}>
      <div className="dvm-box" onClick={(e) => e.stopPropagation()}>
        <div className="dvm-hd"><b>🔴 LIVE 실시간 영상 상담</b><span>{q.name} · 의사 화면(윤우진 진료과장) · 데모 영상</span><button onClick={onClose} aria-label="닫기"><X size={16} /></button></div>
        <div className="dvm-main">
          <div className="dvm-stage">
            <video key={q.id} src={DRC_VID[q.id]} autoPlay loop muted playsInline />
            <span className="dvm-who">👤 {q.name} <i>환자 · LIVE</i></span>
            {shared && (
              <div className="dvm-share-ov" onClick={() => setShared(null)}>
                {shared.kind === "chart" ? (
                  <div className="dvm-chart"><b>📈 {shared.t}</b><div className="dvm-bars">{shared.data.map(([d, v2, n]) => (<div key={d} className="dvm-bar"><i style={{ height: Math.max(10, Math.round((n - 100) / 60 * 100)) + "%" }} /><b>{v2}</b><span>{d}</span></div>))}</div><em>닫으려면 클릭</em></div>
                ) : shared.kind === "note" ? (
                  <div className="dvm-chart"><b>📄 {shared.t}</b><p>{shared.text}</p><em>닫으려면 클릭</em></div>
                ) : (
                  <div className="dvm-photo"><video src={shared.src} autoPlay={shared.kind === "video"} loop muted playsInline /><b>{shared.kind === "photo" ? "🖼" : "🎬"} {shared.t}</b><em>닫으려면 클릭</em></div>
                )}
              </div>
            )}
            <div className="dvm-pip"><video src={DRC_VID.doctor} autoPlay loop muted playsInline /><span>나 · 의사</span></div>
            <div className="dvm-cap">{chat.map((m) => (<div key={m.id} className={`dvm-c ${m.who}`}>{m.who === "dr" ? "🩺 " : "👤 "}{String(m.text).slice(0, 58)}</div>))}</div>
          </div>
          <div className="dvm-side">
            <div className="dvm-tabs"><button className={panel === "share" ? "on" : ""} onClick={() => setPanel("share")}>📎 공유 자료</button><button className={panel === "soap" ? "on" : ""} onClick={() => setPanel("soap")}>📋 SOAP 기록</button></div>
            {panel === "share" ? (
              <div className="dvm-items">{items.map((it) => (<button key={it.k} className={shared && shared.k === it.k ? "on" : ""} onClick={() => setShared(shared && shared.k === it.k ? null : it)}>{it.kind === "photo" ? "🖼" : it.kind === "video" ? "🎬" : it.kind === "chart" ? "📈" : "📄"} {it.t}</button>))}
                <span>클릭하면 화상 화면에 크게 공유돼요 — 환자와 동시 열람</span></div>
            ) : <DrcSoap qid={q.id} />}
          </div>
        </div>
        <div className="dvm-in"><input value={vin} onChange={(e) => setVin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendV()} placeholder="화상 중 텍스트 메시지 (의사)" /><button className={vin.trim() ? "on" : ""} onClick={sendV}><Send size={14} /></button></div>
        <div className="dvm-disc">시연용 데모 영상 — 실제 환자·의료진·영상 연결이 아니며, 모든 공유·열람은 감사 기록을 전제로 합니다.</div>
      </div>
    </div>
  );
}
function DoctorChatModal({ q, onClose }) {
  let uid = 0;
  const [msgs, setMsgs] = useState(() => [{ id: "d0", who: "pt", text: (DRC_SCRIPT[q.id] || [])[0] || "안녕하세요 선생님, 상담 부탁드려요.", time: now() }]);
  const [input, setInput] = useState(""); const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(1); const [video, setVideo] = useState(false); const [ended, setEnded] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { try { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); } catch (e) {} }, [msgs, typing]);
  const isAsync = !!q.async;
  const push = (who, text, late) => setMsgs((m) => [...m, { id: "d" + (++uid) + "_" + m.length, who, text, late: late || null, time: now() }]);
  const send = (t) => {
    const x = (t != null ? t : input).trim(); if (!x || ended) return; setInput("");
    push("dr", x);
    const script = DRC_SCRIPT[q.id] || [];
    const nx = script[step];
    if (nx) { setTyping(true); setStep(step + 1); const lateLabel = isAsync ? ["3시간 뒤", "5시간 뒤", "이튿날 아침"][Math.min(step - 1, 2)] : null; setTimeout(() => { setTyping(false); push("pt", nx, lateLabel); }, isAsync ? 2600 : 1200); }
  };
  const actRx = () => { if (ended) return; push("sys", `💊 전자처방전 발행 — ${DRC_MED[q.id] || "진료 판단 처방"} · 환자가 약국을 선택하면 암호화 전송됩니다(약사법 절차).`); if (typeof toast === "function") toast("💊 전자처방전 발행(의사 화면 시연)"); };
  const actLab = () => { if (ended) return; push("sys", "🧪 검사 의뢰서 발행 — 혈액검사·영상검사를 제휴 검진기관에 의뢰했습니다. 결과 도착 시 비대면 결과 설명으로 이어집니다."); if (typeof toast === "function") toast("🧪 검사 의뢰(의사 화면 시연)"); };
  const actVisit = () => { if (ended) return; push("sys", "🏥 내원 안내 — 우리 병원 정밀검사·대면 진료 예약을 환자에게 전송했습니다(비대면→내원 연계)."); if (typeof toast === "function") toast("🏥 내원 안내 전송"); };
  const actEnd = () => { if (ended) return; setEnded(true); push("sys", "📋 진료 종료 — 진료 요약이 환자 데이터 금고(3세대 자산)로 전달되고 보험 청구가 자동 접수됩니다(청구 0단계). 복약·재진 리마인드는 하이가 이어받습니다."); if (typeof toast === "function") toast("📋 진료 요약 저장 · 청구 자동 접수(시연)"); };
  return (
    <div className="drc" onClick={onClose}>
      {video && <DoctorVideoModal q={q} onClose={() => setVideo(false)} msgs={msgs} onSend={(t) => send(t)} />}
      <div className="drcbox" onClick={(e) => e.stopPropagation()}>
        <div className="drc-hd"><span className="drc-av"><HeartPulse size={16} color="#fff" /></span>
          <div style={{ flex: 1 }}><b>{q.name} <em>환자</em></b><span>{q.mode} 진료 · {q.wait} · 의사 화면(윤우진 진료과장) 시연</span></div>
          <button className="drc-vc" onClick={() => setVideo(true)} title="화상 전환"><MonitorSmartphone size={15} /></button>
          <button className="drc-x" onClick={onClose} aria-label="닫기"><X size={16} /></button></div>
        <div className="drc-brief"><b>🤖 AI 예진 요약</b><span>{q.brief}</span>{q.rpm && <span className="drc-rpm">📈 {q.rpm}</span>}<i>열람 기록은 환자 데이터 금고에 남습니다</i></div>
        {isAsync && <div className="drc-async">⏱ 비동기 메시지 진료 — 환자가 편한 시간에 확인하고 답장합니다(24시간 내 응답). 실시간 대기가 없어 의사도 진료 사이사이에 답할 수 있어요. 시연에서는 몇 초로 압축됩니다.</div>}
        <div className="drc-body">
          {msgs.map((m) => m.who === "sys" ? (
            <div className="drc-sys" key={m.id}>{m.text}</div>
          ) : (
            <div className={`drc-msg ${m.who}`} key={m.id}>{m.late && <em className="drc-late">🕐 {m.late} 도착한 답장 (비동기)</em>}<div className="drc-bub">{m.text}</div><span>{m.time}</span></div>
          ))}
          {typing && <div className="drc-msg pt"><div className="drc-bub drc-typing">{isAsync ? "환자가 나중에 확인 후 답장합니다… (비동기 · 시연 압축)" : "환자가 입력 중…"}</div></div>}
          <div ref={endRef} />
        </div>
        <div className="drc-acts">
          <button onClick={actRx}>💊 처방 발행</button>
          <button onClick={actLab}>🧪 검사 의뢰</button>
          <button onClick={actVisit}>🏥 내원 안내</button>
          <button className="end" onClick={ended ? onClose : actEnd}>{ended ? "닫기" : "📋 진료 종료·요약"}</button>
        </div>
        <div className="drc-in">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={ended ? "진료가 종료되었습니다" : "환자에게 메시지를 입력하세요 (의사)"} disabled={ended} />
          <button className={input.trim() && !ended ? "on" : ""} onClick={() => send()}><Send size={15} /></button>
        </div>
        <div className="drc-disc">의사 화면 시연 — 실제 진료·처방이 아니며, 모든 열람·발행은 감사 기록을 전제로 합니다.</div>
      </div>
    </div>
  );
}
function DoctorConsole() {
  const [done, setDone] = useState({});
  const [live, setLive] = useState(null);
  const rxList = (() => { try { return JSON.parse(localStorage.getItem("hifin_rx") || "[]").slice(-3).reverse(); } catch (e) { return []; } })();
  const queue = [
    { id: "q1", name: "조성래(54)", brief: "생체나이 52.5 · 주의 장기 췌장·간 · 암위험 4등급", rpm: "부모 혈압 152/94 급등(RPM)", mode: "메시지", wait: "대기 2분" },
    { id: "q2", name: "김하늘(29)", brief: "피부 발진 사진 2매 첨부 · 초진(경증)", rpm: null, mode: "화상", wait: "대기 5분" },
    { id: "q3", name: "박정순(71)", brief: "고혈압 재진 · 최근 혈압 125/75 안정", rpm: null, mode: "메시지", wait: "비동기 · 24h 내", async: true },
  ];
  const accept = (q) => { setDone((d) => ({ ...d, [q.id]: true })); setLive(q); if (typeof toast === "function") toast(`🩺 ${q.name} 예진 확인 · 상담 연결 — 열람 기록이 회원 데이터 금고에 남습니다.`); };
  return (
    <div className="b2b-pane">
      {live && <DoctorChatModal q={live} onClose={() => setLive(null)} />}
      <div className="b2b-grid2">
        <div className="b2b-card">
          <div className="b2b-ch"><Stethoscope size={15} color="#7C3AED" /> 예진 수신함 — 오늘 대기열 <span className="b2b-demo">의사 화면 시연(윤우진 진료과장)</span></div>
          <p className="b2b-p">하이가 정리한 <b>AI 예진 요약이 먼저 도착</b>합니다 — 7분 진료를 30분 밀도로. 열람은 전부 회원 데이터 금고 접근 이력에 기록돼요.</p>
          {queue.map((q) => (
            <div className={`b2b-q ${done[q.id] ? "done" : ""}`} key={q.id}>
              <div className="b2b-qh"><b>{q.name}</b><span className="b2b-qm">{q.mode}</span><span className="b2b-qw">{q.wait}</span></div>
              <div className="b2b-qb">🤖 {q.brief}</div>
              {q.rpm && <div className="b2b-qr">📈 {q.rpm}</div>}
              <button onClick={() => accept(q)}>{done[q.id] ? "상담 화면 다시 열기 ✓" : "예진 확인 → 상담 시작"}</button>
            </div>
          ))}
        </div>
        <div className="b2b-card">
          <div className="b2b-ch"><FileText size={15} color="#16A34A" /> 발행·수익 현황</div>
          <div className="b2b-stats">
            <div><b>23건</b><span>이번 달 상담</span></div>
            <div><b>7명</b><span>내원 전환</span></div>
            <div><b>57.5만</b><span>상담 수익(원)</span></div>
          </div>
          <div className="b2b-ulbl">최근 전자처방 발행</div>
          {rxList.length ? rxList.map((r) => (
            <div className="b2b-rx" key={r.id}><b>{r.id}</b><span>{(r.med || "").split("—")[0]}</span><em>{r.status}</em></div>
          )) : <div className="b2b-empty">아직 발행 이력이 없어요 — 전문의 상담에서 처방을 발행하면 여기 나타나요.</div>}
          <div className="b2b-audit"><ShieldCheck size={13} color="#16A34A" /> 열람 감사: 예진·기록 열람은 목적·시각과 함께 회원의 데이터 금고 접근 이력에 기록되며, 회원이 언제든 확인할 수 있습니다.</div>
        </div>
      </div>
    </div>
  );
}

/* ── ③ 검증기관 노드 ── */
const B2B_NODES = [
  { n: "하이핀테크(운영)", t: "플랫폼 운영 노드 · Genesis", st: "운영중" },
  { n: "글로벌예방금융㈜", t: "보험 인수·청구 검증(현대해상 전속대리점)", st: "운영중" },
  { n: "서울 제휴 검진센터 연합", t: "검진 데이터 무결성 검증", st: "운영중" },
  { n: "대학병원 연구소(익명)", t: "가명 데이터 연구 활용 검증", st: "운영중" },
];
function ValidatorNodes({ onGo }) {
  const [nm, setNm] = useState(""); const [tp, setTp] = useState("의료기관"); const [mgr, setMgr] = useState("");
  const go = onGo || ((s) => { if (typeof nav === "function") nav(s); });
  const secName = (typeof trustPartnerLabel === "function") ? trustPartnerLabel() : "안랩(AhnLab) — 제휴 협의 중";
  const apply = () => { if (!nm.trim() || !mgr.trim()) { if (typeof toast === "function") toast("기관명과 담당자를 입력해 주세요."); return; } try { const l = JSON.parse(localStorage.getItem("hifin_nodes") || "[]"); l.push({ n: nm.trim(), t: tp, m: mgr.trim(), at: Date.now() }); localStorage.setItem("hifin_nodes", JSON.stringify(l)); } catch (e) {} if (typeof toast === "function") toast(`🔗 ${nm.trim()} 검증 노드 참여 신청 접수 — 심사 후 안내드립니다(시연).`); setNm(""); setMgr(""); };
  return (
    <div className="b2b-pane">
      <div className="b2b-grid2">
        <div className="b2b-card">
          <div className="b2b-ch"><ShieldCheck size={15} color="#2563EB" /> 검증 노드 현황 — 허가형(PoA) 컨소시엄</div>
          <p className="b2b-p">증서 발급·동의·접근기록의 <b>해시를 복수 기관이 교차 검증</b>합니다. 한 기관이 임의로 기록을 바꿀 수 없는 구조예요.</p>
          {B2B_NODES.map((x) => (
            <div className="b2b-node" key={x.n}><span className="b2b-nd on">●</span><div><b>{x.n}</b><span>{x.t}</span></div><em className="ok">{x.st}</em></div>
          ))}
          <div className="b2b-node"><span className="b2b-nd wait">●</span><div><b>{secName.split("—")[0]}</b><span>보안 검증·관제 노드</span></div><em className="wait">협의 중</em></div>
          <div className="b2b-road">로드맵: 허가형 PoA(현재) → 디지털자산 법제화 시 지분증명(PoS) 확장 · L3 체인 우선</div>
          <button className="b2b-link" onClick={() => go("nft")}><Landmark size={13} /> 온체인 원장에서 실제 블록 확인하기</button>
        </div>
        <div className="b2b-card">
          <div className="b2b-ch"><Handshake size={15} color="#16A34A" /> 우리 기관도 검증 노드로 참여</div>
          <p className="b2b-p">의료기관·보험사·연구기관·보안기업·공공기관이 참여할 수 있어요. 검증 기여에는 프로토콜 보상(HTK)이 배분됩니다.</p>
          <div className="b2b-form">
            <label>기관명</label><input value={nm} onChange={(e) => setNm(e.target.value)} placeholder="예: OO대학교병원" />
            <label>기관 유형</label><select value={tp} onChange={(e) => setTp(e.target.value)}>{["의료기관", "보험사", "연구기관", "보안기업", "공공기관"].map((x) => <option key={x}>{x}</option>)}</select>
            <label>담당자</label><input value={mgr} onChange={(e) => setMgr(e.target.value)} placeholder="성함·직함" />
          </div>
          <button className="b2b-sub" onClick={apply}><BadgeCheck size={14} /> 노드 참여 신청</button>
          <div className="b2b-note">안내: 시연용 접수이며 실제 심사·계약·노드 운영은 진행되지 않습니다.</div>
        </div>
      </div>
    </div>
  );
}

/* ── ④ 거버넌스 ── */
const GOV_PRINCIPLES = [
  ["데이터 주권", "회원 데이터의 활용 수익은 회원 50% · 참여기관 30% · 플랫폼 20%로 분배 — 회원 몫이 항상 우선입니다."],
  ["인하 전용 재산정", "건강 개선 데이터는 보험료 인하에만 쓰입니다. 인상 근거로는 쓰지 않아요."],
  ["1단계 리퍼럴", "추천 보상은 직접 추천 1단계만 인정 — 다단계 구조를 금지합니다."],
  ["증명 가능한 신뢰", "모든 증서·동의·접근기록은 블록체인 해시로 남고, 회원이 직접 검증할 수 있습니다."],
];
const GOV_PROPS = [
  { id: "GIP-3", t: "데이터 배당 분배율 50/30/20 유지", st: "가결", yes: 92, no: 8, closed: true },
  { id: "GIP-4", t: "검증 노드 추가 승인 — 대학연구소 1곳", st: "투표중", yes: 68, no: 12, closed: false },
  { id: "GIP-5", t: "리퍼럴 검진 완료 보상 300→350 HTK 조정", st: "예정", yes: 0, no: 0, closed: true },
];
function GovernancePanel() {
  const [votes, setVotes] = useState(() => { try { return JSON.parse(localStorage.getItem("hifin_gov_votes") || "{}"); } catch (e) { return {}; } });
  const myHtk = (typeof WALLET !== "undefined" && WALLET.total) || 12480;
  const cast = (id, v) => { const next = { ...votes, [id]: v }; setVotes(next); try { localStorage.setItem("hifin_gov_votes", JSON.stringify(next)); } catch (e) {} if (typeof toast === "function") toast(`🗳 ${id}에 ${v === "yes" ? "찬성" : "반대"} — 보유 ${myHtk.toLocaleString()} HTK 가중 반영(시연)`); };
  return (
    <div className="b2b-pane">
      <div className="b2b-grid2">
        <div className="b2b-card">
          <div className="b2b-ch"><Landmark size={15} color="#7C3AED" /> 프로토콜 헌법 — 바꿀 수 없는 원칙</div>
          {GOV_PRINCIPLES.map(([t, d]) => (
            <div className="b2b-pr" key={t}><b><ShieldCheck size={13} color="#7C3AED" /> {t}</b><span>{d}</span></div>
          ))}
          <div className="b2b-note">거버넌스는 법제화 전 시연이며 실제 의결권·지분권이 아닙니다. HTK는 폐쇄형 포인트예요.</div>
        </div>
        <div className="b2b-card">
          <div className="b2b-ch"><Users size={15} color="#2563EB" /> 안건 투표 — HTK 가중(보유 {myHtk.toLocaleString()} HTK)</div>
          {GOV_PROPS.map((p) => { const my = votes[p.id]; const yes = p.yes + (my === "yes" ? 2 : 0), no = p.no + (my === "no" ? 2 : 0); const tot = Math.max(1, yes + no); return (
            <div className="b2b-gov" key={p.id}>
              <div className="b2b-gh"><b>{p.id}</b><span>{p.t}</span><em className={p.st === "가결" ? "ok" : p.st === "투표중" ? "live" : "soon"}>{p.st}</em></div>
              {p.st !== "예정" && <div className="b2b-gbar"><i style={{ width: Math.round(yes / tot * 100) + "%" }} /><span>찬성 {Math.round(yes / tot * 100)}% · 반대 {Math.round(no / tot * 100)}%</span></div>}
              {!p.closed && <div className="b2b-gbtns">
                <button className={my === "yes" ? "on" : ""} onClick={() => cast(p.id, "yes")}>👍 찬성{my === "yes" ? " ✓" : ""}</button>
                <button className={my === "no" ? "no" : ""} onClick={() => cast(p.id, "no")}>👎 반대{my === "no" ? " ✓" : ""}</button>
              </div>}
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

/* ── 메인: B2B 콘솔 묶음 ── */
function B2BConsoleSection({ onGo }) {
  const [t, setT] = useState("subs");
  const tabs = [["subs", "기관 구독 콘솔", Building2], ["doctor", "의사 콘솔", Stethoscope], ["nodes", "검증기관 노드", ShieldCheck], ["gov", "거버넌스", Landmark]];
  return (
    <div className="b2b-wrap">
      <div className="b2b-head"><b>B2B 콘솔</b><span>기관 구독 · 의사 업무 · 검증 노드 · 프로토콜 거버넌스 — 파트너가 쓰는 화면</span></div>
      <div className="b2b-tabs">{tabs.map(([k, l, Ic]) => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}><Ic size={14} /> {l}</button>)}</div>
      {t === "subs" && <B2BSubsConsole />}
      {t === "doctor" && <DoctorConsole />}
      {t === "nodes" && <ValidatorNodes onGo={onGo} />}
      {t === "gov" && <GovernancePanel />}
    </div>
  );
}
