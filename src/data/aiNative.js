/* ══════════════ 하이(HI) — AI 네이티브 코어 (단일 에이전트 · 시맨틱 레이어 · 툴 레지스트리) ══════════════
   원칙 1) 쉬워야 한다: 3문장 답 + 버튼(≤3) + 화면 카드. 2) 처음부터 끝까지 동일 에이전트 '하이'.
   3층 시맨틱: ①HIFIN_LEXICON(용어사전·동의어·구어) ②지식그래프(기존 온톨로지 어댑터) ③TOOL_RUN(기능 레지스트리).
   ⚠️ 신규 기능·용어는 aiQnaBank(AGENT_QNA)+HIFIN_LEXICON+TOOL_RUN 3층 등록 후 배포(표준 절차). */

/* ── 페르소나(전 화면 동일) ── */
const AGENT_PERSONA = { name: "하이", full: "하이 · 하이핀 AI 매니저", tone: "따뜻한 존댓말, 짧은 문장, 먼저 챙겨주는 건강 매니저" };
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
  ["병원", ["뵹원", "병원비"]],
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

/* ── 메인: agentAnswer(text) — 단일 에이전트 '하이'의 응답 ──
   반환: { lines:[문장들], buttons:[≤3], nav:{key,label}|null, reset?:bool, matched:intentKey|null } */
const AGENT_NAV_LABEL = { home: "회사 소개", checkup: "건강검진 예약", care: "검진 후 케어", insurance: "보험·치료비", mywallet: "나의 건강지갑", partner: "제휴·투자", onboarding: "데이터 연결", ontology: "온톨로지" };
function agentAnswer(text) {
  const m = _member();
  const norm = lexNormalize(text);
  const it = agentMatch(norm);
  if (!it) {
    // 그래프 폴백: 검진지표 단어면 관계로 안내
    const g = agentGraphLookup(norm);
    agentStats(false); agentMissLog(text);
    if (g.length) { const h = g[0]; return { lines: [`${h.ind} 관련 질문이시군요 — ${h.note}.`, "리포트에서 내 수치 기준으로 자세히 봐드릴까요?"], buttons: ["내 리포트 요약", "관련 보장 확인", "사람 상담 연결"], nav: null, matched: "graph" }; }
    return { lines: [`아직 그 질문은 제가 정확히 답하기 어려워요 — 놓치지 않게 기록해 뒀어요.`, "비슷한 걸로 도와드릴 수 있는지 아래에서 골라보시겠어요?"], buttons: ["하이핀 소개해줘", "내 건강 봐줘", "사람 상담 연결"], nav: null, matched: null };
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
  return { lines, buttons: (it.b || []).slice(0, 3), nav, reset: !!(extra && extra.reset), matched: it.k };
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
  return { text: parts[0], buttons: ["내 건강 봐줘", "보장 공백 분석", "검진결과 올리기"] };
}
/* 데모·테스트 노출 */
try { if (typeof window !== "undefined") { window.__hifinAgent = agentAnswer; window.__hifinAgentGreet = agentGreeting; } } catch (e) {}
