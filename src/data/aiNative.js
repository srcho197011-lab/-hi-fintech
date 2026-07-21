/* ══════════════ 하이(HI) — AI 네이티브 코어 (단일 에이전트 · 시맨틱 레이어 · 툴 레지스트리) ══════════════
   원칙 1) 쉬워야 한다: 3문장 답 + 버튼(≤3) + 화면 카드. 2) 처음부터 끝까지 동일 에이전트 '하이'.
   3층 시맨틱: ①HIFIN_LEXICON(용어사전·동의어·구어) ②지식그래프(기존 온톨로지 어댑터) ③TOOL_RUN(기능 레지스트리).
   ⚠️ 신규 기능·용어는 aiQnaBank(AGENT_QNA)+HIFIN_LEXICON+TOOL_RUN 3층 등록 후 배포(표준 절차). */

/* ── 페르소나(전 화면 동일) ── */
const AGENT_PERSONA = { name: "하이", full: "하이", tone: "따뜻한 존댓말, 짧은 문장, 먼저 챙겨주는 건강 매니저" };
function agentWho() { try { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (m && m.name) return m.name; if (typeof authCurrent === "function") { const a = authCurrent(); if (a && a.name) return a.name; } } catch (e) {} return "회원"; }

/* ── ① 용어사전(Lexicon) — 동의어·구어·오타 → 표준어 치환 ── */
const HIFIN_LEXICON = [
  // [표준어, [변형들]] — 긴 변형 먼저 치환
  ["실손", ["실비보험", "실비", "실손의료보험", "의료실비"]],
  ["체중", ["몸무게", "몸무개", "무게"]],
  ["신장", ["키"]],
  ["결제", ["돈내는거", "돈내기", "계산하기", "돈냄"]],
  ["적립금", ["포인트", "마일리지", "캐시", "포인트머니"]],
  ["HTK", ["헬스토큰", "하이토큰", "에이치티케이"]],
  ["검진결과", ["검진표", "결과지", "검사지", "검진자료", "검진지", "건강검진결과"]],
  ["업로드", ["올리기", "올려", "등록하기", "첨부"]],
  ["공복혈당", ["빈속혈당", "아침혈당", "공복혈당수치"]],
  ["당화혈색소", ["에이원씨", "hba1c", "a1c"]],
  ["콜레스테롤", ["코레스테롤", "콜레스톨", "콜레스트롤", "고지혈수치"]],
  ["γGTP", ["감마지티피", "감마gtp", "ggt"]],
  ["고혈압", ["혈압높은거", "혈압병"]],
  ["당뇨병", ["당뇨", "혈당병", "당뇨끼"]],
  ["보험금청구", ["보험금타기", "보험금받기", "보험청구"]],
  ["주식청약", ["공모주", "청약", "주식신청"]],
  ["데이터금고", ["금고", "내데이터보관함", "데이타금고"]],
  ["둘러보기", ["구경하기", "체험모드", "게스트모드"]],
  ["검진대비보험", ["무료보험", "검진보험", "공짜보험"]],
  ["환불", ["돈돌려", "반품환불"]],
  ["상담원", ["상담사", "직원", "사람"]],
  ["가입", ["개설", "등록", "회원되기"]],
  ["삭제", ["지우기", "없애기", "지워"]],
  ["예약", ["에약", "예악"]],
  ["병원", ["뵹원"]],
  ["보험", ["보흠", "보험료"]],
];
/* 질의 정규화: 소문자 → 동의어 치환 → 공백·문장부호 제거 */
function lexNormalize(text) {
  let t = String(text || "").toLowerCase();
  for (const [std, vars] of HIFIN_LEXICON) { for (const v of vars.slice().sort((a, b) => b.length - a.length)) { t = t.split(v.toLowerCase()).join(std.toLowerCase()); } }
  return t.replace(/[\s\.\,\?\!\~\^\;\:\'\"()\[\]…]/g, "");
}

/* ── ② 지식그래프 어댑터 — 기존 온톨로지(CI_ONTOLOGY·healthOntology·insuranceStats)를 단일 그래프로 조회 ── */
function agentGraphLookup(normText) {
  const hits = [];
  try { if (typeof CI_ONTOLOGY !== "undefined") { for (const o of CI_ONTOLOGY) { if (o.indKeys.some((k) => normText.includes(k.toLowerCase()))) hits.push({ type: "지표→질환→보장", ind: o.ind, disease: o.disease, ci: o.ci, note: o.note }); } } } catch (e) {}
  return hits;
}

/* ── 기억: 세션 내(런타임) + 세션 간(localStorage, 회원별) ── */
function _memKey() { try { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; return "hifin_agent_mem_" + ((m && m.email) || "self"); } catch (e) { return "hifin_agent_mem_self"; } }
function agentMemLoad() { try { return JSON.parse(localStorage.getItem(_memKey()) || "null") || {}; } catch (e) { return {}; } }
function agentMemSave(patch) { try { const cur = agentMemLoad(); localStorage.setItem(_memKey(), JSON.stringify(Object.assign(cur, patch, { ts: Date.now() }))); } catch (e) {} }
function agentMemClear() { try { localStorage.removeItem(_memKey()); } catch (e) {} }

/* ── 가드레일(카테고리별 자동 부착) ── */
const AGENT_GUARDS = {
  med: "※ 참고용 안내예요 — 진단·처방이 아니며, 증상이 있으면 병원 상담을 권해요.",
  ins: "※ 예시 기준 안내예요 — 실제 보장·보험료는 약관·인수심사로 확정되고, 1~2세대 해지는 재가입이 안 되니 신중하세요.",
  inv: "※ 비상장주식·토큰은 원금 손실 위험이 있어요. 한도(연 10%·1인 1%)와 약관을 꼭 확인하세요.",
};

/* ── ③ 기능 레지스트리(TOOL_RUN) — 회원의 말에서 의도 파악 → 기능 실행 → 대화로 보고 ── */
function _won(n) { n = Math.round(n || 0); return n >= 100000000 ? (n / 100000000).toFixed(1) + "억원" : n >= 10000 ? Math.round(n / 10000).toLocaleString() + "만원" : n.toLocaleString() + "원"; }
function _member() { try { const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; if (dm) return dm; if (typeof authRole === "function" && authRole() !== "GUEST" && typeof selfMember === "function") return selfMember(); } catch (e) {} return null; }
const TOOL_RUN = {
  rep(m) { try { const R = (typeof demoReport === "function") ? demoReport(m) : null; if (!R) return null; return { lines: [`${m.name}님 리포트 요약이에요 — 생체나이 ${R.bio}세(실제보다 ${R.diff > 0 ? "+" : ""}${R.diff}세), 암위험 ${R.cancerTotal}등급(${R.evalLabel}).`, `관리가 필요한 장기: ${R.worstNames.join("·")} · 금년 예상 의료비 ${_won(R.costThis)}, 10년 후 ${_won(R.cost10)}.`] }; } catch (e) { return null; } },
  gap(m) { try { const g = (typeof analyzeCoverageGap === "function") ? analyzeCoverageGap(m) : null; if (!g) return null; const top = g.gaps.slice(0, 3).map((f) => `${f.sev === "crit" ? "🔴" : "🟠"} ${f.t}`); return { lines: [`보장 충실도 ${g.grade} · ${g.score}점이에요.`, top.length ? "우선 챙길 것: " + top.join(" / ") : "현재 보장이 충실해요."] }; } catch (e) { return null; } },
  sil(m) { try { const ins = (typeof memberInsurance === "function") ? memberInsurance(m) : null; if (!ins) return null; const s = ins.silson; if (!s.enrolled) return { lines: [`${m.name}님은 현재 실손 미가입이에요 — 치료비 안전망이 없어서 4·5세대 신규 가입 검토를 권해요.`] }; return { lines: [`${m.name}님 실손은 ${s.gen}(급여 자기부담 ${s.coGen}·비급여 ${s.coNon})이에요.`, `통원 회당 ${_won(s.outLimit)}·입원 ${_won(s.inLimit)}, 월 보험료 약 ${_won(s.monthly)} · 진단비: ${ins.riders.length ? ins.riders.map((r) => r.cat).join("·") + " 보유" : "미보유"}.`] }; } catch (e) { return null; } },
  oop(m, text) { try { const t = String(text || ""); const kind = /mri/i.test(t) ? "MRI" : /주사/.test(t) ? "비급여주사" : /입원/.test(t) ? "입원" : "도수치료"; const base = { MRI: 500000, 비급여주사: 100000, 입원: 3000000, 도수치료: 100000 }[kind]; const r = (typeof calcOutOfPocket === "function") ? calcOutOfPocket(m, kind, base) : null; if (!r) return null; return { lines: [`${kind} ${_won(base)} 기준, ${r.gen} 실손 적용 시 예상 본인부담은 약 ${_won(r.oop)}이에요.`, r.note] }; } catch (e) { return null; } },
  gen(m) { try { const r = (typeof simulateGenerationSwitch === "function") ? simulateGenerationSwitch(m) : null; if (!r) return null; const opts = r.options.map((o) => `${o.gen} 전환 시 월 ${_won(o.monthly)}(${o.saveMonthly > 0 ? "-" : "+"}${_won(Math.abs(o.saveMonthly))})`).join(", "); return { lines: [`현재 ${r.current.gen} 월 ${_won(r.current.monthly)} → ${opts}.`, r.recommend, r.warning].filter(Boolean) }; } catch (e) { return null; } },
  riskcancer(m) { try { const r = (typeof getDiseaseRiskCoverage === "function") ? getDiseaseRiskCoverage(m, "암") : null; if (!r) return null; const c = r.mapped[0]; return { lines: [c && c.covered ? `암 진단비는 ${_won(c.benefit)} 보유 중이에요 — 검진 위험도와 함께 보면 적정성이 보여요.` : "암 진단비가 아직 없어요 — 검진상 위험도가 있다면 우선 보완을 권해요."] }; } catch (e) { return null; } },
  riskbh(m) { try { const r = (typeof getDiseaseRiskCoverage === "function") ? getDiseaseRiskCoverage(m, "혈압") : null; if (!r) return null; return { lines: ["뇌·심장 보장을 확인했어요 — " + r.mapped.map((x) => `${x.cat} 진단비 ${x.covered ? _won(x.benefit) + " 보유" : "미보유 ⚠️"}`).join(" · ")] }; } catch (e) { return null; } },
  wallet(m) { try { const base = (typeof WALLET !== "undefined" ? WALLET.total : 12480); const cp = (m && typeof careplanEarned === "function") ? careplanEarned(m.email) : 0; const sp = (typeof shopHtkPts === "function") ? shopHtkPts(m ? m.email : "default") : 0; const d = (typeof htkDelta === "function") ? htkDelta(m) : 0; const tot = Math.max(0, base + cp + sp + d); const ins = Math.floor(tot * 0.3); return { lines: [`지금 총 ${tot.toLocaleString()} HTK(≈${_won(tot * 10)})가 있어요.`, `그중 보험·치료비 전용 ${ins.toLocaleString()} HTK, 일반 ${ (tot - ins).toLocaleString()} HTK — 쇼핑·청약에 쓸 수 있어요.`] }; } catch (e) { return null; } },
  vault(m) { try { const token = (typeof anonToken === "function") ? anonToken(m) : ""; const v = (typeof vaultLoad === "function") ? vaultLoad(token) : null; const ok = (typeof chainVerify === "function") ? chainVerify() : { ok: true, blocks: 0 }; const integ = (typeof verifyVaultIntegrity === "function") ? verifyVaultIntegrity(m) : { ok: true }; const ck = v && v.checkups ? v.checkups.length : 0; const insN = v && v.insurance ? v.insurance.length : 0; return { lines: [`데이터 금고에 검진 ${ck}건·보험 ${insN}건이 보관 중이에요 — 블록체인 무결성 ${ok.ok ? "정상" : "이상"} · 해시 대조 ${integ.ok ? "위변조 없음 ✓" : "불일치"}.`] }; } catch (e) { return null; } },
  fam(m) { try { const f = (typeof getFamilyCoverageSummary === "function") ? getFamilyCoverageSummary(m) : null; if (!f) return null; if (!f.available) return { lines: [f.note] }; return { lines: ["가족 보장 요약이에요 — " + f.rows.slice(0, 3).map((r) => `${r.name}(${r.gen}·${r.grade})`).join(", ") + "."] }; } catch (e) { return null; } },
  ci(m) { try { const p = (typeof ciRiskProfile === "function") ? ciRiskProfile(m) : null; if (!p || !p.hasRisk) return { lines: ["지금 검진 기준으로는 표준 권장검사(국가검진·내시경·경동맥초음파)를 안내드려요."] }; return { lines: ["위험 질환 기준 권장 정밀검진이에요 — " + p.rows.slice(0, 2).map((r) => `${r.disease}: ${r.checkups.slice(0, 2).join("·")}`).join(" / ") + "."] }; } catch (e) { return null; } },
  onbo(m) { try { const ob = (typeof onboardStatus === "function") ? onboardStatus(m) : { step1: false, step2: false }; return { lines: [ob.done ? "검진·보험 데이터가 모두 연결돼 있어요 — 추가 연도 업로드도 언제든 환영이에요!" : ob.step1 ? "검진은 연결됐고 보험 연결만 남았어요 — 1분이면 끝나요." : "아직 검진결과가 연결 전이에요 — 사진 한 장이면 시작돼요."] }; } catch (e) { return null; } },
  consult() { try { if (typeof openConsult === "function") openConsult("하이(AI 매니저) 경유 — 사람 상담 연결"); } catch (e) {} return { lines: ["상담 신청 창을 열었어요 — 접수되면 상담사가 연락드리고, 저도 옆에서 계속 도와드릴게요."] }; },
  easy() { try { const on = document.body.classList.toggle("easyread"); localStorage.setItem("hifin_easyread", on ? "1" : ""); return { lines: [on ? "쉬운 말 모드를 켰어요 — 글씨를 키우고 더 쉽게 설명할게요." : "쉬운 말 모드를 껐어요."] }; } catch (e) { return null; } },
  reset() { return { lines: ["대화를 새로 시작해요. 무엇이든 물어보세요!"], reset: true }; },
  // 재무 질의 — 통합 재무엔진(finModel.js) 자연어 인터페이스(매출·손익·구독료·CAC·LTV·EV·런웨이·시나리오)
  fin(m, text) { try { return (typeof finAsk === "function") ? finAsk(text) : null; } catch (e) { return null; } },

  /* ══ Phase 2 하이 퍼스트 — 거래 실행 툴(조회를 넘어, 말 한마디로 실행) ══ */
  // 검진 예약 제안(내 지역 기준 센터+일시) → "이대로 예약 확정"으로 bookdo 실행
  bookprep(m) { try {
    const list = (typeof CHECKUP_INST !== "undefined") ? CHECKUP_INST : [];
    const reg = (typeof memberRegion === "function") ? memberRegion() : null;
    const sido = reg && reg.sidoShort ? reg.sidoShort : "서울";
    const pool = list.filter((c) => (c.sd || "").indexOf(sido) >= 0);
    const pick = (pool.length ? pool : list)[0]; if (!pick) return null;
    const d = new Date(); d.setDate(d.getDate() + 9);
    const dateK = (d.getMonth() + 1) + "/" + d.getDate();
    try { window._hiBookPending = { center: { name: pick.n, b: pick.b, r: pick.sd, area: pick.sg, tags: ["종합검진"] }, date: dateK, time: "09:00" }; } catch (e) {}
    return { lines: [`${m.name}님 지역(${sido}) 기준으로 골라봤어요 — ${pick.n}(${pick.sd} ${pick.sg}), 가장 빠른 자리는 ${dateK}(토) 오전 9시예요.`, "예약과 동시에 무료 검진대비보험(진단금 최대 1,000만 원)이 함께 준비돼요. 이대로 확정할까요?"], buttons: ["이대로 예약 확정", "다른 센터 볼래요"] };
  } catch (e) { return null; } },
  bookdo(m) { try {
    const p = (typeof window !== "undefined") ? window._hiBookPending : null;
    if (!p) return { lines: ["먼저 \"검진 예약해줘\"라고 말씀해 주시면 센터와 날짜를 골라드릴게요."] };
    try { if (typeof submitCheckupBooking === "function") submitCheckupBooking(p.center, { center: p.center.name, date: p.date, time: p.time, via: "hi", freeIns: true }); } catch (e) {}
    let hash = null;
    try { const tk = anonToken(m); const b = chainAppend({ type: "ins-cert", token: tk, note: `무상 검진대비보험 증서 발급(${p.center.name} · 하이 예약)` }); hash = b && b.hash; vaultAccessLog(tk, "member", "하이 대화 예약 — 검진대비보험 증서 발급"); } catch (e) {}
    const cert = { id: "CERT-" + Date.now().toString(36).toUpperCase(), center: p.center.name, date: p.date, time: p.time, at: Date.now(), hash };
    try { const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); l.push(cert); localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); localStorage.removeItem("hifin_ins_deferred"); window._hiBookPending = null; } catch (e) {}
    try { if (typeof refActionComplete === "function" && m && m.email) refActionComplete(m.email); } catch (e) {}
    return { lines: [`끝났어요! ${p.center.name} ${p.date} ${p.time} 예약을 확정하고, 무료 검진대비보험 증서(${cert.id})까지 발급했어요 — 블록체인에 기록됐고 데이터 금고에서 확인할 수 있어요.`, "검진 전날, 준비사항을 제가 먼저 알려드릴게요."] };
  } catch (e) { return null; } },
  // 보험금 청구 — 서류 자동 구성 제안 → "청구 접수 진행해줘"로 접수
  claimprep(m) { try {
    const R = (typeof demoReport === "function") ? demoReport(m) : null;
    return { lines: ["청구 준비를 시작할게요 — 데이터 금고의 검진·진료 기록으로 서류를 자동 구성해요(재입력 0).", `대상: 최근 진료·검진 연계 항목${R && R.hr && R.hr.length ? ` (참고: ${R.hr[0]} 관련 정밀검사비도 보장 확인 대상이에요)` : ""}. 이대로 접수할까요?`], buttons: ["청구 접수 진행해줘", "보장 공백 분석"] };
  } catch (e) { return null; } },
  claimdo(m) { try {
    const id = "CLM-" + Date.now().toString(36).toUpperCase(); let hash = null;
    try { const tk = anonToken(m); const b = chainAppend({ type: "record", token: tk, note: "보험금 청구 접수(하이 대화) — 서류 자동 구성" }); hash = b && b.hash; vaultAccessLog(tk, "member", "보험금 청구 접수(하이)"); } catch (e) {}
    try { const l = JSON.parse(localStorage.getItem("hifin_claims") || "[]"); l.push({ id, at: Date.now(), status: "접수", hash }); localStorage.setItem("hifin_claims", JSON.stringify(l)); } catch (e) {}
    return { lines: [`청구가 접수됐어요 — 접수번호 ${id}. 검진·진료 기록을 자동 첨부했고, 심사 진행 상황은 제가 먼저 알려드릴게요.`, "※ 실제 지급 여부·금액은 보험사 심사에 따라요."] };
  } catch (e) { return null; } },
  // 가족 등록 — "어머니 82세 추가해줘" 한마디로 완료
  famadd(m, text) { try {
    const t = String(text || "");
    const REL = [["어머니|노모|모친", "부모", "여"], ["아버지|부친", "부모", "남"], ["아내|와이프|배우자", "배우자", "여"], ["남편", "배우자", "남"], ["아들", "자녀", "남"], ["딸", "자녀", "여"]];
    const hit = REL.find((r) => new RegExp(r[0]).test(t));
    if (!hit) return { lines: ["누구를 등록할까요? 예를 들어 \"어머니 82세 추가해줘\"처럼 말씀해 주세요."], buttons: ["어머니 82세 추가해줘", "아내 51세 추가해줘"] };
    const label = (t.match(new RegExp(hit[0])) || [hit[0].split("|")[0]])[0];
    const ageM = t.match(/(\d{1,3})\s*세/);
    const age = ageM ? parseInt(ageM[1], 10) : (hit[1] === "부모" ? 78 : 50);
    const list = (typeof familyLoad === "function") ? (familyLoad(m.email, (m.name || "가")[0]) || []) : [];
    list.push({ id: "f" + Date.now().toString(36), name: label, relation: hit[1], age, sex: hit[2] });
    if (typeof familySave === "function") familySave(m.email, list);
    try { vaultAccessLog(anonToken(m), "member", `가족 등록(${label} · 하이 대화)`); } catch (e) {}
    try { if (typeof refFamilyAdd === "function") refFamilyAdd(m.email, label); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("famrefresh")); } catch (e) {}   // 화면 목록 즉시 갱신
    return { lines: [`${label}(${age}세)님을 우리가족건강관리에 등록했어요 — 검진 일정·응급 안내를 함께 챙겨드릴게요. 가족 등록 보상 +100 HTK도 적립됐어요!`, "가족 정보는 본인 동의 범위에서만 저장되고, 언제든 삭제할 수 있어요."] };
  } catch (e) { return null; } },
  // 가족 제외 — "아버지 삭제해줘" 한마디로(이름 우선 매칭 → 최근 추가분부터)
  famdel(m, text) { try {
    const t = String(text || "");
    const list = (typeof familyLoad === "function") ? (familyLoad(m.email, (m.name || "가")[0]) || []) : [];
    let idx = -1;
    for (let i = list.length - 1; i >= 0; i--) { const f = list[i]; if (f.name && f.name.length >= 2 && t.indexOf(f.name) >= 0) { idx = i; break; } }
    if (idx < 0) {
      const REL = [["어머니|노모|모친", "부모"], ["아버지|부친", "부모"], ["아내|배우자", "배우자"], ["남편", "배우자"], ["아들", "자녀"], ["딸", "자녀"]];
      const hit = REL.find((r) => new RegExp(r[0]).test(t));
      if (hit) for (let i = list.length - 1; i >= 0; i--) { const f = list[i]; if (f.relation === hit[1] && new RegExp(hit[0]).test(f.name || "")) { idx = i; break; } }
    }
    if (idx < 0) return { lines: ["누구를 제외할까요? 등록된 이름이나 관계로 말씀해 주세요 — 예: \"아버지 삭제해줘\"", list.length ? "지금 등록된 가족: " + list.map((f) => `${f.name}(${f.relation})`).join(", ") : "등록된 가족이 없어요."] };
    const rm = list.splice(idx, 1)[0];
    if (typeof familySave === "function") familySave(m.email, list);
    try { window.dispatchEvent(new CustomEvent("famrefresh")); } catch (e) {}
    try { vaultAccessLog(anonToken(m), "member", `가족 제외(${rm.name} · 하이 대화)`); } catch (e) {}
    return { lines: [`${rm.name}(${rm.relation})님을 가족 구성원에서 제외했어요.`, "잘못 제외했다면 \"" + rm.name + " " + (rm.age || "") + "세 추가해줘\"라고 하시면 다시 등록돼요."] };
  } catch (e) { return null; } },
  // 동의 변경 — 목적별 동의를 대화 한마디로(변경 이력은 체인 기록)
  consentdo(m, text) { try {
    const t = String(text || "");
    const KEY = [["마케팅|광고|수신", "mkt", "마케팅 알림"], ["보험", "insurance", "보험 연계"], ["연계|제3자|제휴", "link", "기관 연계"], ["ai|분석", "ai", "AI 분석"], ["건강|검진", "health", "건강데이터 활용"]];
    const hit = KEY.find((k) => new RegExp(k[0], "i").test(t));
    if (!hit) return { lines: ["어떤 동의를 바꿀까요? 목적별로 하나씩, 말 한마디면 돼요."], buttons: ["마케팅 동의 꺼줘", "마케팅 동의 켜줘"] };
    const on = /(켜|동의할|허용|받을)/.test(t) && !/(꺼|철회|거부|취소|해제)/.test(t);
    const st = {}; st[hit[1]] = on;
    if (typeof vaultSaveConsents === "function") vaultSaveConsents(m, st);
    return { lines: [`${hit[2]} 동의를 ${on ? "켰어요" : "철회했어요"} — 변경 이력이 블록체인에 기록됐고, 언제든 다시 바꿀 수 있어요.`] };
  } catch (e) { return null; } },
  // 무료 검진대비보험 가입 — 건너뛰었던 회원의 재가입을 한마디로(Phase1 deferred 마감)
  insjoin(m) { try {
    let hash = null;
    try { const tk = anonToken(m); const b = chainAppend({ type: "ins-cert", token: tk, note: "무상 검진대비보험 증서 발급(하이 대화 가입)" }); hash = b && b.hash; vaultAccessLog(tk, "member", "검진대비보험 가입(하이)"); } catch (e) {}
    const cert = { id: "CERT-" + Date.now().toString(36).toUpperCase(), center: "검진 예약 연동", date: "-", time: "", at: Date.now(), hash };
    try { const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); l.push(cert); localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); localStorage.removeItem("hifin_ins_deferred"); } catch (e) {}
    return { lines: [`무료 검진대비보험 가입을 완료했어요 — 증서 ${cert.id}가 데이터 금고에 기록됐어요(보험료 0원).`, "보장은 검진 예약과 연동돼요. ※ 실제 보장·인수는 보험사 심사에 따라요."] };
  } catch (e) { return null; } },
  // 무상 검진대비보험 상세 브리핑 — 예약 화면 수준의 플랜·담보·금액을 대화로 + 예약 화면 연결
  inscover(m) { try {
    const C = (typeof CHECK_COVERS !== "undefined") ? CHECK_COVERS : [];
    const age = m && m.regAge ? m.regAge : 54, sex = m && m.sex ? m.sex : "남";
    const table = C.map((r) => `· ${r[1]} — 기본형 ${r[2]} · 표준형 ${r[3]} · 고급형 ${r[4]}`).join("\n");
    return { lines: [
      "건강검진을 예약만 하면 보험료 0원으로 자동 가입되는 '검진대비보험'이에요 — 하이핀 회원 혜택이라 추가 입력도 없어요.",
      "플랜은 검진에 따라 자동 적용돼요 — 기본형(국가검진) · 표준형(종합검진 50만 원 미만) · 고급형(50만 원 이상).",
      "보장 내용 전체예요:\n" + table,
      `${age}세 ${sex}성 기준 고급형이면, 암·뇌졸중·급성심근경색 진단 확정 시 각 최대 1,000만 원까지 받아요. 인수는 현대해상 전속대리점 글로벌예방금융㈜ · 가입 내역은 블록체인에 기록돼요.`,
      "아래 버튼으로 검진 예약 화면에서 바로 확인·예약할 수 있고, 저한테 \"검진 예약해줘\"라고 하시면 제가 예약과 가입까지 한 번에 끝내드려요.",
    ], buttons: ["검진 예약해줘", "보장 내용 자세히"] };
  } catch (e) { return null; } },
  /* ══ Phase 5 프로토콜 UX — 계보·배당·재산정 툴 ══ */
  // 자산 계보 — "당신의 검진 하나가 이렇게 자랐습니다"를 이야기로
  lineage(m) { try {
    const l = (typeof assetLineage === "function") ? assetLineage(m) : null; if (!l) return null;
    return { lines: [
      `${m.name}님의 데이터 자산 계보예요 — 1세대(원본) ${l.g1}건 → 2세대(분석) ${l.g2}건 → 3세대(활용) ${l.g3}건 → 4세대(성과) ${l.g4}건, 총 ${l.total}개 자산이 세대별 SBT로 쌓여 있어요.`,
      "이야기로 풀면: 올리신 검진 결과지(1세대)가 AI 리포트(2세대)가 되고, 보험 증서·청구·거래(3세대)로 쓰이고, 재검진에서 지표가 좋아지면 성과 증명(4세대)이 돼요 — 쓰일수록 자산이 늘어나는 복리 구조죠.",
      "각 자산이 연구·심사에 활용되면 분배율(회원 50%)대로 배당이 돌아와요.",
    ], buttons: ["배당 내역 보여줘", "요율 재산정 신청해줘"] };
  } catch (e) { return null; } },
  // 데이터 배당 내역 — 조용한 입금(12월 장면)
  divi(m) { try {
    const ds = (typeof dataDividends === "function") ? dataDividends(m) : [];
    if (!ds.length) return { lines: ["아직 지급된 데이터 배당이 없어요 — 검진결과를 연결하면 가명화 데이터가 연구에 활용될 때마다 배당이 지급돼요."], buttons: ["검진결과 올리기"] };
    const d = ds[0];
    return { lines: [`${d.date}에 데이터 활용 배당 +${d.htk.toLocaleString()} HTK가 지급됐어요 — ${m.name}님의 ${d.gens.map((g) => g + "세대").join("·")} 자산이 「${d.study}」에 활용됐어요(${d.org} · 가명 요약만 제공).`, "내 데이터가 어딘가의 민석을 조금 더 일찍 발견하는 데 쓰이고, 그 대가가 약속대로 돌아온 거예요. 동의·계보·접근 기록은 데이터 금고에서 전부 확인돼요."], buttons: ["내 자산 계보 보여줘"] };
  } catch (e) { return null; } },
  // 요율 재산정 — 인하 전용 실행(이듬해 3월 장면)
  reratedo(m) { try {
    const st = (typeof rerateState === "function") ? rerateState() : { status: "none" };
    if (st.status === "done") return { lines: [`이미 재산정이 완료됐어요 — 월 ${st.before.toLocaleString()}원 → ${st.after.toLocaleString()}원(-${st.rate}%), 연 ${(st.saving * 12).toLocaleString()}원 절감이에요.`] };
    if (!(typeof rerateEligible === "function" && rerateEligible(m))) return { lines: ["아직 재산정 자격 전이에요 — 재검진 데이터가 쌓여 지표 개선이 증명되면 제가 먼저 알려드릴게요. 인하 전용이라 손해 볼 일은 없어요."], buttons: ["검진결과 올리기"] };
    const r = (typeof rerateApply === "function") ? rerateApply(m) : null; if (!r) return null;
    return { lines: [`재산정 신청을 제출했어요 — 4세대 성과 증명(혈당·중성지방 개선)이 보험사에 요약으로만 전달됐고, 즉시 반영됐어요: 월 보험료 ${r.before.toLocaleString()}원 → ${r.after.toLocaleString()}원 (-${r.rate}% · 연 ${(r.saving * 12).toLocaleString()}원 절감).`, "보험료가 나이가 아니라 관리를 따라간 순간이에요. 기록은 블록체인·접근 이력에 남았어요."] };
  } catch (e) { return null; } },
  // 친구 초대(리퍼럴) — "친구 초대해줘" 한마디로 링크 생성·복사·공유까지(획득 채널 ⑥)
  refer(m) { try {
    const r = (typeof refShare === "function") ? refShare(m) : null; if (!r) return null;
    return { lines: [
      `초대 링크를 만들었어요${r.mode === "copy" ? " — 클립보드에 복사해뒀으니 붙여넣기만 하세요!" : r.mode === "share" ? " — 공유 창을 열었어요!" : "!"}`,
      r.link,
      "이 링크에는 " + m.name + "님의 코드가 심겨 있어요 — 친구가 이 코드로 가입해야 두 분 모두 100 HTK가 적립되고, 친구가 첫 검진을 마치면 +300 HTK를 더 드려요.",
      "직접 추천 1단계만 인정되고(다단계 아님), 가족을 등록해도 100 HTK가 적립돼요. HTK는 폐쇄형 포인트라 현금이 아니에요.",
    ], buttons: ["초대 현황 보여줘"] };
  } catch (e) { return null; } },
  refstat(m) { try {
    const s = (typeof refState === "function") ? refState(m.email) : null; if (!s) return null;
    return { lines: [`지금까지 초대 ${s.invited}건 · 가입 ${s.joined}명 · 가족 등록 ${s.family || 0}명 · 검진 완료 ${s.checked}명 — 리퍼럴 적립 ${s.htk.toLocaleString()} HTK예요.`, s.joined || s.family ? "잘 늘고 있어요 — 검진까지 마치면 보상이 더 커져요!" : "아직 가입한 친구가 없어요 — 등산 모임, 가족 단톡방부터 시작해보실래요?"], buttons: ["친구 초대해줘", "어머니 82세 추가해줘"] };
  } catch (e) { return null; } },
  // 근처 검진센터 찾기 — 회원 지역 기준 후보 제시(하이가 조건 해석)
  nearfind(m) { try {
    const list = (typeof CHECKUP_INST !== "undefined") ? CHECKUP_INST : [];
    const reg = (typeof memberRegion === "function") ? memberRegion() : null;
    const sido = reg && reg.sidoShort ? reg.sidoShort : "서울";
    const pool = list.filter((c) => (c.sd || "").indexOf(sido) >= 0).slice(0, 3);
    const rows = (pool.length ? pool : list.slice(0, 3)).map((c) => `· ${c.n} (${c.sd} ${c.sg})`);
    return { lines: [`${sido} 기준 가까운 제휴 검진센터예요:`].concat(rows), buttons: ["검진 예약해줘"] };
  } catch (e) { return null; } },
  /* ══ Phase 6 비대면진료 — 하이 퍼스트 경로 ══ */
  // 원격진료 연결 준비 — 예진 요약 예고 + 전문의 상담 탭 딥링크(+RPM 경보 컨텍스트)
  teleprep(m) { try {
    try { if (typeof window !== "undefined") { window._teleGoSpecialist = true; window._teleAutoStart = true; } window.dispatchEvent(new CustomEvent("telego")); } catch (e) {}
    const nm = m && m.name ? m.name : "회원";
    const a = (typeof rpmAlert === "function") ? rpmAlert(m) : null;
    if (a) { try { window._teleRPM = `${a.rel} ${a.name}님 ${a.summary}`; } catch (e) {} }
    return { lines: [
      "지금 연결 가능한 원격주치의를 준비했어요 — 지역·진료과별 전문의 중 ● 지금 연결 가능 표시가 있는 분은 평균 2분 안에 연결돼요.",
      `${nm}님의 예진 요약(생체나이·주의 장기·위험도·최근 측정)도 미리 정리해뒀어요 — 의사를 선택하는 순간 가명 요약으로 먼저 전달돼서, 7분 진료가 30분 밀도가 돼요. 열람 기록은 데이터 금고에 남아요.`,
      a ? `📈 ${a.rel} ${a.name}님의 RPM 혈압 경보(${a.summary})도 예진 요약에 함께 포함해뒀어요.` : null,
      "비대면으로는 문진·처방전(고혈압·당뇨약 등)·검사 의뢰·검진결과 설명·경과관찰까지 가능해요. 진료 후엔 전자처방→약국 선택→약 수령, 그리고 보험 청구는 서류 0장으로 자동 접수돼요(청구 0단계).",
    ].filter(Boolean), buttons: ["전문의 상담 열기", "비대면으로 뭐가 가능해?"] };
  } catch (e) { return null; } },
  // 가족 RPM 혈압 경보 — 새벽 2:17 장면(I2-6): 경보 상세 + 진료 연결 유도
  rpmcheck(m) { try {
    const a = (typeof rpmAlert === "function") ? rpmAlert(m) : null;
    if (!a) return { lines: ["지금 활성화된 가족 RPM 경보는 없어요 — 연동된 가족 기기에서 이상 추세가 감지되면 제가 먼저 알려드릴게요."], buttons: [] };
    const rows = a.series.map((s) => `· ${s[0]} — ${s[1]}`).join("\n");
    try { window._teleRPM = `${a.rel} ${a.name}님 ${a.summary}`; } catch (e) {}
    return { lines: [
      `🔴 ${a.rel} ${a.name}님(${a.age}세) 혈압 경보예요 — 가정용 혈압계(RPM)가 자동 감지했어요:\n${rows}`,
      "사흘 연속 상승에 새벽 급등이 겹쳐 있어요. 지금 연결 가능한 의사에게 비대면으로 먼저 보여드리는 걸 권해요 — 예진 요약에 이 추이를 포함해뒀어요.",
      "심한 두통·가슴 통증·한쪽 마비·발음 이상 같은 증상이 있다면 진료 연결 말고 즉시 119예요.",
    ], buttons: ["원격진료 연결해줘", "경보 해제해줘"] };
  } catch (e) { return null; } },
  /* Phase 7 — B2B 콘솔 딥링크: 기관 구독·의사 콘솔·검증 노드·거버넌스 */
  b2bgo() { try {
    try { if (typeof window !== "undefined") { window._piB2B = true; window.dispatchEvent(new CustomEvent("b2bgo")); } } catch (e) {}
    return { lines: [
      "B2B 콘솔을 열어드릴게요 — 파트너 기관이 쓰는 화면 4종이 모여 있어요:",
      "① 기관 구독 콘솔 — 침투 요금제(1차 무료→월 50만→상한 300만)·이용량·월 청구서\n② 의사 콘솔 — AI 예진 수신함·대기열·처방 발행·열람 감사\n③ 검증기관 노드 — PoA 컨소시엄 현황·노드 참여 신청\n④ 거버넌스 — 프로토콜 헌법·안건 HTK 가중 투표",
    ], buttons: ["구독료 정책 알려줘", "제휴 조건이 뭐예요?"] };
  } catch (e) { return null; } },
  /* 약국 배정(H1·H2) — "약 어디서 받아?" 한마디로 배정→확정→전송 완결 */
  pharmassign() { try {
    if (typeof phRank !== "function") return null;
    const r = phRank(PH_HOME); const a = r.find((p) => p.open) || r[0];
    return { lines: [
      `자택에서 가장 가까운 ${a.n}(${a.d}m · 도보 ${phWalk(a.d)}분 · 영업중${a.part ? " · 위변조 없음 ✓ 제휴" : ""})으로 배정해 드릴까요?`,
      `차순위는 ${r.filter((p) => p.n !== a.n).slice(0, 2).map((p) => `${p.n}(${p.d}m${p.open ? "" : " · 영업 종료"})`).join(" · ")}이에요. 배송 수령도 가능해요.`,
      "처방전은 확정한 약국으로만 암호화 전송돼요 ✓",
    ], buttons: ["약국 확정해줘", "배송으로 받을래"] };
  } catch (e) { return null; } },
  pharmdo() { try {
    const r = phRank(PH_HOME); const a = r.find((p) => p.open) || r[0];
    try { const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); if (rl.length) { rl[rl.length - 1].status = `${a.n} 전송(방문 수령)`; rl[rl.length - 1].pharm = a.n; localStorage.setItem("hifin_rx", JSON.stringify(rl)); } } catch (e) {}
    return { lines: [`📤 ${a.n}(으)로 처방전 전송 완료 ✓ — 도보 ${phWalk(a.d)}분이에요. 약국 접수·조제가 시작되면 알려드리고, 준비되면 수령 알림을 드릴게요.`, "방문 시 신분 확인 후 약사의 복약지도와 함께 수령하세요."] };
  } catch (e) { return null; } },
  pharmdv() { try {
    const r = phRank(PH_HOME); const a = r.find((p) => p.open) || r[0];
    try { const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); if (rl.length) { rl[rl.length - 1].status = `${a.n} 전송(배송 수령)`; rl[rl.length - 1].pharm = a.n; localStorage.setItem("hifin_rx", JSON.stringify(rl)); } } catch (e) {}
    return { lines: [`📦 ${a.n}에 배송 수령으로 접수했어요 ✓ — 조제중 → 배송중 → 수령완료 단계마다 알려드릴게요. (의약품 배송은 약사법 허용 범위에서 운영됩니다)`] };
  } catch (e) { return null; } },
  /* 방문수령증·배송추적(Q4·H1) — "수령증 보여줘"·"약 어디쯤이야?"·"약 받았어?" 상태 조회 */
  pickup() { try {
    const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); const r = [...rl].reverse().find((x) => x.pu || x.dl);
    if (!r) return { lines: ["아직 발급된 수령증·배송추적 QR이 없어요 — 처방 후 방문/배송 수령을 확정하면 핸드폰에 QR이 발급돼요."], buttons: [] };
    if (r.dl && !r.pu) {
      const step = r.dlStep || 0; const names = ["약국 접수", "조제중", "배송중", "배송 수령 완료 ✓"];
      return { lines: [
        `🚚 배송추적 ${r.dl} — ${r.pharm || "약국"} → 자택 · 처방 ${r.id} · 상태: ${names[step]}${step < 3 ? " (도착 예정 오늘 저녁)" : ""}`,
        step >= 3 ? "배송 수령까지 끝났어요 — 복약 리마인드는 제가 챙기고 있어요 💊" : "기사님이 도착하면 원격상담 화면의 배송추적 QR을 보여주세요 — 스캔으로 수령이 확인돼요(약사법 수령 확인 · 이름·주민번호 미포함).",
      ] };
    }
    const st = r.puUsed ? "수령 완료 ✓" : (/조제 완료/.test(r.status || "") ? "수령 대기(조제 완료)" : "조제중");
    return { lines: [
      `🎫 방문수령증 ${r.pu} — ${r.pharm || "약국"} · 처방 ${r.id} · 상태: ${st}`,
      r.puUsed ? "이미 수령을 마치셨어요 — 복약 리마인드는 제가 챙기고 있어요 💊" : "약국 카운터에서 원격상담 화면의 수령증 QR 카드를 보여주시면 돼요 — QR을 탭하면 크게 보여요(유효 24시간 · 1회용 · 이름·주민번호 미포함).",
    ] };
  } catch (e) { return null; } },
  rpmack(m) { try {
    localStorage.setItem("hifin_rpm_ack_" + m.email, "1");
    try { window.dispatchEvent(new CustomEvent("rpmrefresh")); } catch (e) {}
    return { lines: ["경보를 해제했어요 — 같은 추세가 이어지거나 새 이상 신호가 감지되면 다시 알려드릴게요."] };
  } catch (e) { return null; } },
  // 비대면 가능행위 공시 — 의료법·고시 기준 표를 대화로
  telecan() { try {
    const A = (typeof TELE_ACTS !== "undefined") ? TELE_ACTS : [];
    const rows = A.map((a) => `· ${a.act} — ${a.ok === "가능" ? "가능" : a.ok}(${a.ex})`).join("\n");
    return { lines: [
      "현행 의료법·관련 고시 기준, 비대면진료에서 가능한 행위예요(의사의 전문적 판단 전제):\n" + rows,
      "모든 의료행위가 원격으로 되는 건 아니에요 — 대면진료가 원칙이고 재진·만성질환 중심으로 허용돼요. 의료인이 부적절하다고 판단하면 대면으로 전환돼요.",
    ], buttons: ["원격진료 연결해줘"] };
  } catch (e) { return null; } },
};

/* ── 미답변 로그 + 커버리지 지표 ── */
function agentMissLog(text) { try { const k = "hifin_agent_miss"; const l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ q: String(text).slice(0, 80), ts: Date.now() }); localStorage.setItem(k, JSON.stringify(l.slice(-200))); } catch (e) {} }
function agentStats(hit) { try { const k = "hifin_agent_stats"; const s = JSON.parse(localStorage.getItem(k) || "{\"total\":0,\"hit\":0}"); s.total++; if (hit) s.hit++; localStorage.setItem(k, JSON.stringify(s)); } catch (e) {} }
function agentCoverage() { try { return JSON.parse(localStorage.getItem("hifin_agent_stats") || "{\"total\":0,\"hit\":0}"); } catch (e) { return { total: 0, hit: 0 }; } }
function agentMisses() { try { return JSON.parse(localStorage.getItem("hifin_agent_miss") || "[]"); } catch (e) { return []; } }
/* 주간 학습 루프(시뮬): 미답변 → 신규 Q&A 후보 생성 → 검수 대기 목록 */
function agentLearnLoop() {
  const misses = agentMisses(); if (!misses.length) return { generated: 0, pending: [] };
  const uniq = {}; misses.forEach((x) => { uniq[x.q] = (uniq[x.q] || 0) + 1; });
  const pending = Object.keys(uniq).sort((a, b) => uniq[b] - uniq[a]).slice(0, 20).map((q) => ({ q, freq: uniq[q], draft: `[검수 필요] "${q}"에 대한 표준답변 초안 — 관련 용어사전·툴 매핑 지정 후 AGENT_QNA에 등록` }));
  try { localStorage.setItem("hifin_agent_pending", JSON.stringify(pending)); } catch (e) {}
  return { generated: pending.length, pending };
}

/* ── 인텐트 매칭(정규화 질의 × AGENT_QNA 패턴 스코어) ── */
function agentMatch(normText) {
  let best = null, bestScore = 0;
  for (const it of (typeof AGENT_QNA !== "undefined" ? AGENT_QNA : [])) {
    if (!it.p || !it.p.length) continue;
    let score = 0;
    for (const pat of it.p) { const pn = pat.toLowerCase(); if (normText.includes(pn)) score = Math.max(score, pn.length); }
    if (score > bestScore) { bestScore = score; best = it; }
  }
  return bestScore >= 2 ? best : null;
}

/* ── 섹션 활용 가이드 — 모든 섹션·서브섹션을 대화로 열고 사용법 안내(내비게이션 레이어) ──
   words: 섹션을 부르는 모든 표현(도와줘/보여줘/열어줘/사용법/가고싶어 등 동사는 자동 허용) */
const AGENT_SEC_GUIDES = [
  { k: "checkup", label: "건강검진 예약", words: ["검진예약", "건강검진", "검진센터", "검진받", "검진신청", "검진잡", "검진하러", "국가검진", "종합검진", "검진현황", "예약현황"], guide: "건강검진 예약 화면을 안내해 드릴게요. 내 주변 검진센터를 비교해 예약하면 무료 검진대비보험이 자동으로 붙고, 결과 조회·사후관리까지 이어져요. 화면에서 지역·항목을 고르셔도 되고, 저한테 '내 주변 검진센터 찾아줘'라고 하셔도 돼요.", btns: ["내 주변 검진센터 찾아줘", "무료 보험이 뭐예요?", "어떤 검진 받아야 해?"] },
  { k: "ai", label: "AI 주치의 상담", words: ["주치의", "건강상담", "ai상담", "의사상담", "증상상담", "건강물어"], guide: "AI 주치의 상담을 열어드릴게요. 질환 증상·검사·치료·생활습관을 무엇이든 물어볼 수 있고, 음성·사진으로도 상담돼요. 필요하면 화상상담·병원 안내로 이어져요.", btns: ["내 리포트 요약", "당뇨 관리법 알려줘"] },
  { k: "manage", label: "내 건강현황", words: ["건강현황", "건강리포트", "리포트보", "내건강상태", "생체나이보", "건강분석보"], guide: "내 건강현황 화면에서 생체나이·장기나이·암위험·의료비 예측 리포트를 볼 수 있어요. 검진결과가 연결돼 있으면 실제 내 수치 기준이에요.", btns: ["내 리포트 요약", "검진결과 올리기"] },
  { k: "hospital", label: "병원진료 안내", words: ["병원진료", "병원안내", "병원찾", "진료과", "병원가야", "어느병원", "병원추천", "병원어디", "어디병원", "병원좀", "병원알려"], guide: "병원진료 안내를 열어드릴게요. 증상·질환에 맞는 진료과와 내 주변 병원을 찾아 예약 안내까지 도와드려요. 진료 결과를 알려주시면 케어플랜도 갱신돼요.", btns: ["증상으로 진료과 찾기"] },
  { k: "homecare", label: "재가돌봄", words: ["재가돌봄", "돌봄서비스", "방문간호", "간병", "요양", "퇴원후", "부모님돌봄"], guide: "재가돌봄 화면에서 방문간호·재활·간병 서비스를 신청할 수 있어요. 퇴원 후 회복 관리나 부모님 돌봄이 필요할 때 조건에 맞는 서비스를 매칭해 드려요.", btns: ["돌봄 서비스 상담"] },
  { k: "shop", label: "건강쇼핑", words: ["건강쇼핑", "쇼핑", "영양제사", "영양제보", "식단사", "기기사", "홈케어기기", "쇼핑몰", "상품보", "몰열어"], guide: "건강쇼핑을 열어드릴게요. 건강식단·영양제·홈케어 의료기기를 국내 최저가로 제공하고, 검진 결과에 맞춘 맞춤 추천도 있어요. 구매하면 마진의 50%가 HTK로 적립돼요.", btns: ["내 맞춤 추천 보여줘", "혈압에 좋은 영양제", "적립은 얼마나 돼?"] },
  { k: "insurance", label: "보험·치료비", words: ["보험섹션", "보험화면", "보험보", "보험열어", "보장조회", "보험가입", "치료비화면", "보험쪽", "보험메뉴"], guide: "보험·치료비 화면을 안내해 드릴게요. 보장조회 → AI 보험솔루션(보장공백·본인부담) → 간편가입 → 보험금 청구까지 한 곳에서 돼요. 제 데이터 기준 분석은 말만 하시면 바로 해드려요.", btns: ["보장 공백 분석", "내 실손 몇 세대야?", "보험금 청구 어떻게 해?"] },
  { k: "wallet", label: "건강금융지갑", words: ["건강지갑", "금융지갑", "지갑보", "지갑열", "적립현황", "적립내역", "온체인", "토큰지갑"], guide: "건강금융지갑을 열어드릴게요. HTK 적립 현황과 보험·치료비 전용 적립(30% 우선), 나눔·기부, 온체인 원장(전송·스왑)까지 볼 수 있어요.", btns: ["적립금 얼마 쌓였어?", "토큰 전송하는 법"] },
  { k: "nft", label: "Health NFT", words: ["nft", "엔에프티", "보험증서nft", "건강nft"], guide: "Health NFT 화면에서 검진보험 증서·건강 기록의 NFT(SBT)를 확인할 수 있어요. 위변조가 안 되는 내 건강 자산 증명이에요.", btns: ["NFT가 뭐예요?"] },
  { k: "mypage", label: "우리가족건강관리", words: ["가족관리", "우리가족", "가족건강", "마이페이지", "가족등록", "동의관리", "내정보수정"], guide: "우리가족건강관리를 열어드릴게요. 가족을 등록해 건강·보장 현황을 함께 보고, 보호자 체크리스트·응급 SOS·동의관리(DID)까지 한 화면에서 돼요.", btns: ["가족 보장 요약", "동의 철회하고 싶어"] },
  { k: "partner", label: "제휴·투자", words: ["제휴신청", "제휴하고", "투자신청", "투자하고", "주식청약", "청약화면", "파트너신청", "입점신청"], guide: "제휴·투자 화면을 안내해 드릴게요. 검진센터·병원·약국 제휴 신청과 회원 적립금 주식청약, 법인 투자까지 여기서 진행돼요.", btns: ["적립금으로 주식 어떻게 사?", "제휴 조건이 뭐예요?"] },
  { k: "onboarding", label: "데이터 연결", words: ["데이터연결", "검진연결", "검진결과업로드", "결과올리", "보험연결", "데이터올리"], guide: "데이터 연결을 열어드릴게요. 검진결과(사진·PDF·공단)와 보험(통합조회)을 연결하면 모든 분석이 내 실제 데이터 기준으로 바뀌어요 — 각 1분이면 돼요.", btns: ["사진으로 올려도 돼요?", "공단 조회는 뭐예요?"] },
  { k: "mywallet", label: "나의 건강지갑(전체)", words: ["데이터금고열", "금고열어", "금고보여"], guide: "데이터 금고를 열어드릴게요. 내 검진·보험 데이터와 블록체인 보호 블록, 접근 이력, 동의 현황을 보고 즉시 삭제도 할 수 있어요.", btns: ["내 정보 안전해요?"] },
  { k: "trust", label: "신뢰 센터", words: ["신뢰센터", "데이터보호센터", "보안어떻게", "어떻게보호", "안전한지보여", "트러스트"], guide: "신뢰 센터를 열어드릴게요. 내 데이터를 누가·어떻게 지키는지 3문장으로 확인하고, 접근 이력·동의·즉시 삭제까지 버튼으로 직접 실행할 수 있어요.", btns: ["내 검진 결과 누가 볼 수 있어요?", "해킹당하면 어떡해요?"] },
  { k: "intro", label: "회사 소개", words: ["회사소개보", "소개화면", "비전보여", "하이핀이란"], guide: "HI-Fin Tech 소개 화면이에요. 회사 비전·사회적 가치환원·커뮤니티를 볼 수 있어요.", btns: ["하이핀이 뭘 해주는 곳이야?"] },
  { k: "story", label: "활용 스토리", words: ["활용스토리", "활용법", "고객여정", "스토리보여", "이야기로", "성래스토리", "어떻게쓰는지"], guide: "'결과지를 버리던 남자' — 조성래 님의 10년 이야기로 하이핀의 모든 기능을 여행처럼 보여드려요. 장면마다 실제 화면으로 바로 이동할 수 있어요.", btns: ["검진 예약 도와줘", "내 건강 봐줘"] },
  { k: "social", label: "사회적기업", words: ["사회공헌", "사회환원", "기부활동", "나눔활동"], guide: "사회적기업 화면에서 치료비 사각지대 나눔 등 하이핀의 사회환원 활동을 볼 수 있어요. 회원 소비의 30% 마진이 나눔 재원이 돼요.", btns: ["나눔은 어떻게 이뤄져요?"] },
  { k: "community", label: "커뮤니티", words: ["커뮤니티", "게시판", "후기보", "회원들이야기"], guide: "커뮤니티에서 회원들의 건강 이야기와 전문가 답변을 볼 수 있어요.", btns: [] },
];
const AGENT_NAV_VERBS = /(도와|보여|열어|가줘|가고|가자|이동|안내|알려|사용법|쓰는법|어떻게|이용|하고싶|하려면|해줘|해봐|부탁|시작|들어가|접속|메뉴|화면)/;
function agentNavIntent(rawText, normText) {
  for (const g of AGENT_SEC_GUIDES) {
    if (g.k === "ontology" && typeof authRole === "function" && authRole() !== "ADMIN") continue;
    for (const w of g.words) { if (normText.includes(w)) { return g; } }
  }
  return null;
}

/* ── 메인: agentAnswer(text) — 단일 에이전트 '하이'의 응답 ──
   반환: { lines:[문장들], buttons:[≤3], nav:{key,label}|null, reset?:bool, matched:intentKey|null } */
const AGENT_NAV_LABEL = { story: "활용 스토리", intro: "회사 소개", home: "회사 소개", trust: "신뢰 센터", checkup: "건강검진 예약", care: "검진 후 케어", insurance: "보험·치료비", mywallet: "나의 건강지갑", partner: "제휴·투자", onboarding: "데이터 연결", ontology: "온톨로지", shop: "건강쇼핑", ai: "AI 주치의 상담", manage: "내 건강현황", hospital: "병원진료 안내", homecare: "재가돌봄", wallet: "건강금융지갑", nft: "Health NFT", mypage: "우리가족건강관리", social: "사회적기업", community: "커뮤니티" };
function agentAnswer(text) {
  const m = _member();
  const norm = lexNormalize(text);
  const it = agentMatch(norm);
  if (!it) {
    // ① 섹션 활용 가이드(내비게이션 레이어): "검진예약 도와줘" "쇼핑 보여줘" 등 → 사용법 안내 + 화면 열기
    const sg = agentNavIntent(text, norm);
    if (sg) {
      agentStats(true); agentMemSave({ lastIntent: "nav_" + sg.k, lastCat: "nav", lastQ: String(text).slice(0, 60) });
      return { lines: [sg.guide], buttons: (sg.btns || []).slice(0, 3), nav: { key: sg.k, label: sg.label }, matched: "nav_" + sg.k };
    }
    // ② 그래프 폴백: 검진지표 단어면 관계로 안내
    const g = agentGraphLookup(norm);
    agentStats(false); agentMissLog(text);
    if (g.length) { const h = g[0]; return { lines: [`${h.ind} 관련 질문이시군요 — ${h.note}.`, "리포트에서 내 수치 기준으로 자세히 봐드릴까요?"], buttons: ["내 리포트 요약", "관련 보장 확인", "사람 상담 연결"], nav: null, matched: "graph" }; }
    return { lines: [`아직 그 질문은 제가 정확히 답하기 어려워요 — 놓치지 않게 기록해 뒀어요.`, "비슷한 걸로 도와드릴 수 있는지 아래에서 골라보시겠어요?"], buttons: ["하이핀 소개해줘", "내 건강 봐줘", "사람 상담 연결"], nav: null, matched: null };
  }
  /* 재무 내부지표(매출·영업이익·구독료 정책·CAC/LTV·기업가치)는 관리자 세션에서만 응답 — 회원에게 원가·수익구조 비노출 */
  if (it.c === "fin" && !(typeof isAdminRole === "function" && isAdminRole())) {
    agentStats(true);
    return { lines: [
      "회사 매출·수익성 같은 재무 정보는 투자자·파트너 대상 자료라 회원 화면에서는 안내해 드리지 않아요.",
      "제휴나 투자에 관심 있으시면 '제휴·투자 신청'에서 상담을 도와드릴게요.",
    ], buttons: ["제휴 신청 가기"], nav: { key: "partner", label: "제휴·투자" }, matched: "fin_restricted" };
  }
  agentStats(true);
  agentMemSave({ lastIntent: it.k, lastCat: it.c, lastQ: String(text).slice(0, 60) });
  let lines = it.a ? [it.a.replace(/성래님/g, agentWho() + "님")] : [];
  let extra = null;
  if (it.tool && TOOL_RUN[it.tool]) { try { extra = TOOL_RUN[it.tool](m, text); } catch (e) { extra = null; } }
  if (extra && extra.lines) lines = it.tool === "rep" || it.tool === "sil" || it.tool === "gap" || it.tool === "wallet" ? [lines[0]].filter(Boolean).concat(extra.lines) : lines.concat(extra.lines);
  if (!lines.length) lines = ["네, 도와드릴게요!"];
  if (it.guard && AGENT_GUARDS[it.guard]) lines.push(AGENT_GUARDS[it.guard]);
  const nav = it.nav ? { key: it.nav, label: AGENT_NAV_LABEL[it.nav] || "바로가기" } : null;
  /* 실행 툴이 다음 행동 버튼을 제안하면 그것이 우선(하이 퍼스트 다단계 실행) */
  return { lines, buttons: ((extra && extra.buttons) || it.b || []).slice(0, 3), nav, reset: !!(extra && extra.reset), matched: it.k };
}

/* ── 재접속 인사(기억 연속성) + 오늘의 브리핑 ── */
function agentGreeting() {
  const m = _member(); const who = agentWho();
  const mem = agentMemLoad();
  const parts = [];
  try {
    const ob = (m && typeof onboardStatus === "function") ? onboardStatus(m) : null;
    if (ob && !ob.step1) parts.push(`${who}님, 어서 오세요! 검진결과를 연결하면 제가 바로 분석해 드릴 수 있어요 — 사진 한 장이면 1분이에요.`);
    else if (ob && !ob.step2) parts.push(`${who}님, 검진 분석은 준비됐어요. 보험까지 연결하면 보장 공백 분석이 완성돼요 — 이어서 해드릴까요?`);
    else if (mem.lastQ) parts.push(`${who}님, 다시 오셨네요! 지난번 "${mem.lastQ}" 이야기 이어서 해드릴까요?`);
    else {
      const R = (m && typeof demoReport === "function") ? demoReport(m) : null;
      if (R && R.hr && R.hr.length) parts.push(`${who}님, 어서 오세요. 검진상 ${R.hr[0]} 위험이 보여서 오늘은 그 관리부터 챙겨드리고 싶어요.`);
      else parts.push(`${who}님, 어서 오세요! 오늘은 무엇을 도와드릴까요?`);
    }
  } catch (e) { parts.push(`${who}님, 어서 오세요! 무엇을 도와드릴까요?`); }
  return { text: parts[0], buttons: ["검진예약 질문 도우미", "내 건강 봐줘", "보장 공백 분석", "검진결과 올리기"] };
}
/* ── 선제 알림(Proactive) — 회원이 묻기 전에 하이가 먼저 챙긴다(하이 퍼스트 원칙 3) ── */
/* 가족 RPM 경보 상태 — 노인 가족 + 미해제 시 활성(새벽 2:17 장면의 데이터 소스) */
function rpmAlert(m) { try {
  if (!m || !m.email) return null;
  if (localStorage.getItem("hifin_rpm_ack_" + m.email)) return null;
  const fam = (typeof familyLoad === "function") ? familyLoad(m.email, (m.name || "가")[0]) : [];
  const elder = (fam || []).find((x) => (typeof famGroupOf === "function" ? famGroupOf(x.age, x.relation) : "") === "노인");
  if (!elder) return null;
  return { name: elder.name, rel: elder.relation, age: elder.age, series: [["7/17", "132/84"], ["7/18", "141/88"], ["오늘 새벽 2:17", "152/94"]], summary: "혈압 3일 연속 상승 132/84→141/88→152/94 · 오늘 새벽 2:17 급등(RPM 자동 감지)" };
} catch (e) { return null; } }

function agentProactive() {
  const m = _member(); const out = [];
  if (!m) return out;
  /* RPM 경보 — 최우선(새벽 2:17 장면): 세션당 1회 선제 안내 */
  try { const a = rpmAlert(m); if (a && !sessionStorage.getItem("hifin_rpm_seen")) { out.push({ text: `🔴 오늘 새벽 2:17, ${a.rel} ${a.name}님 혈압이 152/94까지 올랐어요(3일 연속 상승 · 가정 혈압계 RPM 자동 감지). 지금 연결 가능한 의사에게 먼저 보여드릴까요?`, buttons: ["원격진료 연결해줘", "가족 혈압 경보 보여줘"] }); sessionStorage.setItem("hifin_rpm_seen", "1"); } } catch (e) {}
  /* 방문수령증(V4) — 수령 완료 시 복약 리마인드 시작 안내(1회), 조제 완료 시 QR 준비 안내(세션 1회) */
  try { const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); const r = [...rl].reverse().find((x) => x.pu || x.dl); if (r && ((r.pu && r.puUsed) || (r.dl && (r.dlStep || 0) >= 3)) && !localStorage.getItem("hifin_pu_done_" + (r.pu || r.dl))) { out.push({ text: `💊 ${r.pharm || "약국"} ${r.dl && !r.pu ? "배송 " : ""}수령 완료 확인! 오늘부터 복약 리마인드를 시작할게요 — ${(r.med || "").split("—")[0].trim()}`, buttons: [] }); localStorage.setItem("hifin_pu_done_" + (r.pu || r.dl), "1"); } else if (r && r.pu && !r.puUsed && /조제 완료/.test(r.status || "") && !sessionStorage.getItem("hifin_pu_ready")) { out.push({ text: "🎫 조제가 끝났어요 — 약국 방문 시 수령증 QR을 준비하세요. '수령증 보여줘'라고 하시면 바로 확인돼요.", buttons: ["수령증 보여줘"] }); sessionStorage.setItem("hifin_pu_ready", "1"); } else if (r && r.dl && !r.pu && (r.dlStep || 0) === 2 && !sessionStorage.getItem("hifin_dl_ready")) { out.push({ text: "🚚 약이 배송 중이에요 — 기사님 도착 시 배송추적 QR을 보여주시면 수령이 확인돼요. '배송 어디쯤이야?'로 언제든 확인하세요.", buttons: ["수령증 보여줘"] }); sessionStorage.setItem("hifin_dl_ready", "1"); } } catch (e) {}
  try { const d = JSON.parse(localStorage.getItem("hifin_ins_deferred") || "null"); if (d) out.push({ text: `지난번 ${d.center || "검진"} 예약은 보험 없이 하셨죠 — 무료 검진대비보험, 지금 1분 안에 준비해드릴까요? (이 안내는 한 번만 드려요)`, buttons: ["검진보험 가입해줘", "괜찮아요"] }); } catch (e) {}
  try {
    const ob = (typeof onboardStatus === "function") ? onboardStatus(m) : null;
    if (ob && !ob.step1) out.push({ text: "검진결과를 아직 안 올리셨어요 — 사진 한 장이면 1분 만에 정밀리포트가 나와요.", buttons: ["검진결과 올리기"] });
    else if (ob && !ob.step2) out.push({ text: "보험까지 연결하면 보장 공백 분석이 완성돼요 — 이어서 해드릴까요?", buttons: ["보험 연결하기"] });
  } catch (e) {}
  try { const certs = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); const c = certs[certs.length - 1]; if (c && c.date && c.date !== "-") out.push({ text: `${c.date} ${c.center} 검진이 다가와요 — 전날 준비사항(금식 등)을 제가 챙겨드릴게요.`, buttons: ["검진 준비사항 알려줘"] }); } catch (e) {}
  /* Phase 5 선제 알림 — 배당 지급·요율 재산정 자격(묻기 전에 먼저) */
  try { if (!localStorage.getItem("hifin_divi_seen")) { const ds = (typeof dataDividends === "function") ? dataDividends(m) : []; if (ds.length) { out.push({ text: `데이터 활용 배당 +${ds[0].htk.toLocaleString()} HTK가 지급됐어요 — ${m.name}님의 데이터가 「${ds[0].study.split("(")[0]}」에 활용됐어요.`, buttons: ["배당 내역 보여줘"] }); localStorage.setItem("hifin_divi_seen", "1"); } } } catch (e) {}
  try { const st = (typeof rerateState === "function") ? rerateState() : { status: "done" }; if (st.status !== "done" && typeof rerateEligible === "function" && rerateEligible(m)) out.push({ text: "개선된 건강상태로 보험료 재산정을 신청할 수 있어요 — 인하 전용이라 손해 볼 일은 없어요.", buttons: ["요율 재산정 신청해줘"] }); } catch (e) {}
  return out.slice(0, 3);
}

/* 데모·테스트 노출 */
try { if (typeof window !== "undefined") { window.__hifinAgent = agentAnswer; window.__hifinAgentGreet = agentGreeting; window.__hifinProactive = agentProactive; } } catch (e) {}
