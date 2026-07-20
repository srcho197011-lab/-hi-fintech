/* ── 국가건강정보포털 전체 코퍼스(664개) — src/data/kdca.json 1회 로드 ── */
let _kdcaPromise = null;
function loadKdca() {
  if (!_kdcaPromise) {
    _kdcaPromise = fetch("./src/data/kdca.json")
      .then((r) => { if (!r.ok) throw new Error("KB 로드 실패 (" + r.status + ")"); return r.json(); })
      .catch(() => null); // 실패 시 큐레이션 KB로 폴백
  }
  return _kdcaPromise;
}
function useKdca() {
  const [kb, setKb] = useState(null);
  useEffect(() => { let on = true; loadKdca().then((d) => on && setKb(d)); return () => { on = false; }; }, []);
  return kb;
}
/* ── 질병관리청 학습용 Q&A 데이터셋(1,947쌍) — src/data/kdca_qa.json 1회 로드 ── */
let _qaPromise = null;
function loadQA() {
  if (!_qaPromise) {
    _qaPromise = fetch("./src/data/kdca_qa.json").then((r) => r.ok ? r.json() : null).catch(() => null);
  }
  return _qaPromise;
}
function useQA() {
  const [qa, setQa] = useState(null);
  useEffect(() => { let on = true; loadQA().then((d) => on && setQa(d)); return () => { on = false; }; }, []);
  return qa;
}
/* ── 임상 진료지침/환자 리플릿 학습 Q&A — src/data/guidelines.json 1회 로드 ── */
let _glPromise = null;
function loadGuidelines() {
  if (!_glPromise) _glPromise = fetch("./src/data/guidelines.json").then((r) => r.ok ? r.json() : null).catch(() => null);
  return _glPromise;
}
function useGuidelines() {
  const [g, setG] = useState(null);
  useEffect(() => { let on = true; loadGuidelines().then((d) => on && setG(d)); return () => { on = false; }; }, []);
  return g;
}
// 진료지침(우선) + 질병관리청 Q&A 병합 — 같은 질환은 진료지침이 먼저 매칭
function useLearnedQA() {
  const qa = useQA();
  const gl = useGuidelines();
  return useMemo(() => {
    if (!qa && !gl) return null;
    return { meta: { count: ((gl && gl.qa) ? gl.qa.length : 0) + ((qa && qa.qa) ? qa.qa.length : 0), qaCount: (qa && qa.meta) ? qa.meta.count : 0, glCount: (gl && gl.meta) ? gl.meta.count : 0 }, qa: [...((gl && gl.qa) || []), ...((qa && qa.qa) || [])] };
  }, [qa, gl]);
}
// 동의어·구어 → 표준 질환키 확장(질문에 별칭이 있으면 표준키를 덧붙여 매칭률↑)
const QA_ALIAS = {
  "이상지질혈증": ["콜레스테롤", "중성지방", "고지혈", "ldl", "hdl", "엘디엘", "기름기"],
  "고혈압": ["혈압이", "혈압약", "혈압관리", "혈압조절", "혈압수치", "혈압측정"],
  "당뇨병": ["당뇨", "혈당", "당화혈색소", "당수치"],
  "만성콩팥병": ["콩팥", "신부전", "사구체"],
  "만성폐쇄성폐질환": ["copd", "폐쇄성폐", "만성폐쇄"],
  "금연": ["담배", "니코틴", "금연약", "끊는법", "끊고싶"],
  "비만": ["뱃살", "체중감량", "살빼", "다이어트", "복부비만"],
  "심방세동": ["부정맥", "맥박이", "맥이불규칙", "심장이두근"],
  "편두통": ["편두통"],
  "백내장": ["백내장", "수정체"],
  "하지정맥류": ["정맥류", "하지정맥", "다리혈관"],
  "성매개감염": ["성병", "임질", "클라미디아", "성매개"],
  "골다공증": ["골다공", "골밀도", "뼈가약", "뼈가얇"],
  "갑상선질환": ["갑상선", "갑상샘"],
  "불면증": ["불면", "잠이안", "잠을못", "숙면"],
  "우울증과 스트레스": ["우울감", "우울증", "무기력", "의욕없"],
};
const QA_ALIAS_ENTRIES = Object.keys(QA_ALIAS).map((k) => [k, QA_ALIAS[k]]);
function expandAlias(t) {
  let ext = t;
  for (const [canon, alts] of QA_ALIAS_ENTRIES) {
    if (!t.includes(canon) && alts.some((a) => t.includes(a))) ext += canon;
  }
  return ext;
}
// 변별력 없는 흔한 단어(질환 매칭에서 제외)
const QA_STOP = new Set(["무엇", "뭐예요", "뭔가요", "어떻게", "어떤", "알려", "알려줘", "방법", "관리", "증상", "원인", "예방", "치료", "검사", "검진", "위험", "인가요", "하나요", "받나요", "되나요", "무슨", "대해", "대한", "좋은", "좋아", "해줘", "궁금", "이란", "나요", "건가요", "있나요", "뭐가", "관련", "정보", "주세요", "싶어", "싶은", "보여", "그리고", "때문", "경우", "정도", "관해"]);
// 정확 매칭 실패 시 — 질문 토큰이 항목 질문(q)·질환명(dz)과 겹치는 정도로 폴백
function qaFuzzy(raw, Q) {
  if (!Q || !Q.qa) return null;
  const toks = [...new Set((raw.match(/[가-힣a-zA-Z]{2,}/g) || []).filter((w) => !QA_STOP.has(w)))];
  if (!toks.length) return null;
  let best = null, bestScore = 0;
  for (const it of Q.qa) {
    const hay = (it.q || "") + " " + (it.dz || "");
    let s = 0; for (const w of toks) if (hay.includes(w)) s += w.length;
    if (s > bestScore) { bestScore = s; best = it; }
  }
  return bestScore >= 4 ? best : null; // 2글자 질환토큰 2개 또는 4글자 이상 겹침
}
// 학습된 Q&A에서 질문 매칭: 질환키(k) 포함 + 의도 라벨 우선
function qaMatch(t, Q, intent) {
  if (!Q || !Q.qa) return null;
  const want = intent === "검사" ? "검사" : intent === "치료" ? "치료" : intent === "생활" ? "생활" : intent === "증상" ? "증상" : "개요";
  let best = null, bestScore = -1;
  for (const it of Q.qa) {
    if (!it.k || !t.includes(it.k)) continue;
    let score = it.k.length * 10;
    if (it.t === want) score += 5; else if (it.t === "개요") score += 1;
    if (score > bestScore) { bestScore = score; best = it; }
  }
  return best;
}
// 매칭된 Q&A 항목 → 음성/텍스트 답변(라벨 접두 + 답변)
function qaAnswer(cp) {
  const lab = cp.t === "검사" ? "의 검사 방법이에요. " : cp.t === "치료" ? "의 치료 방법이에요. " : cp.t === "생활" ? "의 생활습관 관리예요. " : cp.t === "증상" ? "의 증상이에요. " : "에 대해 알려드릴게요. ";
  const src = cp.src ? ` (출처: ${cp.src})` : "";
  return `${cp.dz}${lab}${cp.a}${src}`;
}
/* ── 병원·진료과 안내 ── */
const CANCER_DEPT = { "위암": "소화기내과", "대장암": "소화기내과", "간암": "소화기내과", "췌장암": "소화기내과", "담낭암": "소화기내과", "폐암": "호흡기내과", "유방암": "유방외과", "자궁경부암": "산부인과", "갑상선암": "내분비내과·갑상선외과", "전립선암": "비뇨의학과", "신장암": "비뇨의학과", "방광암": "비뇨의학과" };
const DISEASE_DEPT = { "고혈압": "순환기내과(내과)", "이상지질혈증": "순환기내과(내과)", "당뇨병": "내분비내과(내과)", "심방세동": "순환기내과", "만성폐쇄성폐질환": "호흡기내과", "천식": "호흡기내과", "만성콩팥병": "신장내과", "골다공증": "내분비내과·정형외과", "골관절염": "정형외과", "백내장": "안과", "하지정맥류": "흉부외과(혈관외과)", "편두통": "신경과", "불면증": "정신건강의학과·신경과", "우울증과 스트레스": "정신건강의학과", "갑상선질환": "내분비내과", "성매개감염": "비뇨의학과·산부인과", "소화성궤양": "소화기내과", "위염": "소화기내과" };
function deptFor(dz) {
  for (const k in CANCER_DEPT) if (dz.includes(k)) return { dept: CANCER_DEPT[k], cancer: true };
  for (const k in DISEASE_DEPT) if (dz.includes(k)) return { dept: DISEASE_DEPT[k], cancer: false };
  return { dept: null, cancer: /암/.test(dz) };
}
// 질환·암은 정밀검사가 필요 → 검사장비·유경험 전문의 갖춘 검진센터/상급병원 안내
function hospitalAdvice(dz) {
  const { dept, cancer } = deptFor(dz);
  if (cancer) {
    const d = dept ? `${dept}와 영상의학과 등 해당 분야 ` : "해당 분야 ";
    return `${dz}은 CT, MRI, 내시경, 초음파(필요 시 초음파내시경) 같은 정밀검사가 필요한 분야예요. 그래서 동네 의원보다는, 이런 검사 장비를 제대로 갖추고 ${d}진료 경험이 풍부한 전문의가 있는 건강검진센터나 상급종합병원에서 정밀검사를 받으시는 것이 좋습니다. 앱의 ‘병원 찾기’에서 가까운 건강검진센터·전문병원을 안내해 드릴 수 있어요. (참고용 안내예요.)`;
  }
  const d = dept || "관련 진료과";
  return `${dz}은 가까운 ${d}에서 진료와 꾸준한 관리를 받으실 수 있어요. 다만 증상이 복잡하거나 정밀검사가 필요하면, 검사 장비를 갖추고 경험 많은 전문의가 있는 종합병원·건강검진센터가 더 적합합니다. 앱의 ‘병원 찾기’에서 주변 병원을 찾아드릴게요.`;
}
// 질문에서 질환명 식별(병원 안내용)
function identifyDz(t, QA) {
  const cp = qaMatch(t, QA, null);
  if (cp) return cp.dz.replace(/\s*검진$/, "").replace(/\(COPD\)/, "");
  for (const k of KDCA_KB) for (const a of k.al) if (t.includes(a)) return k.d;
  return null;
}
/* ── 조성래님 개인 건강분석 리포트(프롬에이지 Premium) — src/data/report.json 1회 로드 ── */
let _reportPromise = null;
function loadReport() {
  if (!_reportPromise) {
    _reportPromise = fetch("./src/data/report.json").then((r) => r.ok ? r.json() : null).catch(() => null);
  }
  return _reportPromise;
}
function useReport() {
  const [rp, setRp] = useState(null);
  useEffect(() => { let on = true; loadReport().then((d) => on && setRp(d)); return () => { on = false; }; }, []);
  return rp;
}
// 개인 리포트 기반 답변(개인화 질문일 때만). 일반 질환정보는 null → KDCA로 위임
function reportAnswer(q, R) {
  if (!R) return null;
  const t = (q || "").replace(/\s/g, "");
  const N = R.meta.name;
  // 생체나이·노화·장기 나이
  if (/생체나이|노화|장기나이|간나이|췌장나이|심장나이|신장나이|콩팥나이|몇살|몇세/.test(t)) {
    const bad = R.organs.filter((o) => o[2] === "나쁨").map((o) => `${o[0]} 나이 ${o[1]}세`).join(", ");
    return `${N}님의 생체나이는 ${R.meta.bioAge}세로 주민등록나이 ${R.meta.regAge}세보다 ${Math.abs(R.meta.diff)}세 젊어요. 노화속도는 ${R.meta.speed}배로 동년배 평균보다 느리고, 노화등수는 ${R.meta.rank}등으로 종합 '${R.meta.overall}'이에요.${bad ? ` 다만 ${bad}는 '나쁨'으로 나와 관리가 필요해요.` : ""}`;
  }
  // 의료비·의료 이용
  if (/의료비|병원비|의료이용|외래|입원|비용|돈/.test(t)) {
    return `${N}님의 올해 예상 의료비는 약 ${won(R.cost.ty)}으로 동년배 평균 ${won(R.cost.tyAvg)}보다 ${R.cost.ty >= R.cost.tyAvg ? "조금 높아요" : "낮은 편이에요"}. 10년 후엔 약 ${won(R.cost.y10)}으로 늘어날 것으로 예상돼요(생체나이 기반 추정). 모두 연간 기준이에요.`;
  }
  const personal = /내|나의|제|저의|위험|등급|얼마|몇|어때|어떤가|상태|높|낮|걸릴|발생|예측/.test(t);
  // 특정 암 (개인화 질문일 때)
  if (personal) for (const c of R.cancer) {
    const base = c.n.replace("암", "");
    if (t.includes(c.n) || (base.length >= 2 && t.includes(base))) {
      return `${N}님의 ${c.n} 발생 위험도는 ${c.risk}%로 '${c.grade}' 등급(전체 대비 ${c.level})이에요. 예방하려면 ${c.do[0]}을 실천하고, ${c.avoid[0]}는 피하세요. 참고로, ${c.remember[0]}.`;
    }
  }
  // 특정 질병 (개인화 질문일 때)
  if (personal) for (const d of R.disease) {
    const alias = d.n === "당뇨병" ? /당뇨/ : d.n === "고지혈증" ? /고지혈|콜레스테롤|이상지질/ : d.n === "급성심근경색증" ? /심근경색|심장/ : null;
    if (t.includes(d.n) || (alias && alias.test(t))) {
      const dir = d.rel >= 0 ? `${d.rel}% 높아요` : `${Math.abs(d.rel)}% 낮아요`;
      return `${N}님의 ${d.n} 발생 위험도는 동년배(50대 남성)보다 ${dir}. 10년 내 평균 발생률은 ${d.rate}%예요. ${d.guide[0]}, ${d.guide[1]} 등이 도움이 돼요.`;
    }
  }
  // 종합 요약
  if (/리포트|종합|요약|분석결과|내건강|전체|어때|상태|총평/.test(t)) {
    const hiD = R.disease.filter((d) => d.rel > 0).map((d) => d.n).join("·") || "특별히 없음";
    const warnC = R.cancer.filter((c) => /고위험|위험|경고/.test(c.grade)).map((c) => c.n).join("·");
    return `${N}님 리포트(검진일 ${R.meta.date}) 요약이에요. 생체나이 ${R.meta.bioAge}세로 종합 '${R.meta.overall}'이에요. 질병 9종 중 동년배보다 위험이 높은 건 ${hiD}이고, 전체 암은 ${R.cancerTotal.grade}등급(${R.cancerTotal.label})이에요.${warnC ? ` 다만 ${warnC}이 '경고' 수준이라 주의가 필요해요.` : ""} 간·췌장 생체나이가 다소 높아 관리하면 좋겠어요.`;
  }
  return null;
}
/* ── 건강분석 리포트 상세 분석(다중 카드) — 원본 리포트(report.json)의 전 항목을 풍부하게 구조화 ── */
function reportAnalysisCards(R) {
  if (!R || !R.meta) return null;
  const M = R.meta;
  const money = (n) => (typeof won === "function" ? won(n) : Number(n).toLocaleString("ko-KR") + "원");
  const bubbles = [];
  bubbles.push({ kind: "text", text: `${M.name}님 건강분석 리포트를 항목별로 자세히 분석해 드릴게요. 📋\n검진일 ${M.date}${M.source ? " · " + M.source : ""}\n※ 참고용 분석이며 의료진의 진단·처방을 대체하지 않아요.` });
  // 1) 생체나이·노화 종합
  const younger = M.diff <= 0;
  bubbles.push({ kind: "card", card: { title: "🧬 생체나이 · 노화 종합", items: [
    `생체나이 ${M.bioAge}세 — 실제나이 ${M.regAge}세보다 ${Math.abs(M.diff)}세 ${younger ? "젊음 ✅" : "많음 ⚠️"}`,
    `노화속도 ${M.speed}배 — 동년배 평균보다 ${M.speed <= 1 ? "느림(양호)" : "빠름(주의)"}`,
    `노화등수 상위 ${M.rank}% · 종합 등급 ‘${M.overall}’`,
  ], buttons: [] } });
  // 2) 장기별 생체나이
  const organs = R.organs || [];
  if (organs.length) {
    const worst = organs.slice().sort((a, b) => b[1] - a[1]).slice(0, 2).map((o) => o[0]).join("·");
    bubbles.push({ kind: "card", card: { title: "🫀 장기별 생체나이 (5개 장기)", items: organs.map((o) => `${o[0]}: ${o[1]}세 · ${o[2]}${o[2] === "나쁨" ? " ⚠️" : ""}`).concat([`→ 가장 관리가 필요한 장기: ${worst}`]), buttons: ["간 췌장 관리 방법"] } });
  }
  // 3) 암 위험 종합
  const cancers = R.cancer || [];
  const warnCancers = cancers.filter((c) => /경고|고위험|위험/.test(c.grade));
  if (cancers.length) {
    const top = cancers.slice().sort((a, b) => (b.risk || 0) - (a.risk || 0)).slice(0, 5);
    bubbles.push({ kind: "card", card: { title: `🎗 암 위험 종합 — 전체 ${R.cancerTotal.grade}/${R.cancerTotal.of || 10}등급(${R.cancerTotal.label})`, items: top.map((c) => `${c.n}: 위험도 ${c.risk}% · ‘${c.grade}’ (전체대비 ${c.level})`), buttons: ["🔬 특수검진 정밀검사 보기"] } });
  }
  // 4) 경고/고위험 암 집중관리(최대 2종)
  warnCancers.slice(0, 2).forEach((c) => {
    bubbles.push({ kind: "card", card: { title: `⚠️ ${c.n} — ‘${c.grade}’ 집중관리 (위험도 ${c.risk}%)`, items: []
      .concat((c.do || []).slice(0, 2).map((x) => `✅ 실천: ${x}`))
      .concat((c.avoid || []).slice(0, 2).map((x) => `🚫 회피: ${x}`))
      .concat((c.remember || []).slice(0, 1).map((x) => `💡 ${x}`)), buttons: [`${c.n} 자세히`] } });
  });
  // 5) 질병 위험도(동년배 대비)
  const dz = R.disease || [];
  const hiDz = dz.filter((d) => d.rel > 0).sort((a, b) => b.rel - a.rel);
  if (dz.length) {
    bubbles.push({ kind: "card", card: { title: `🩺 질병 위험도 — ${dz.length}종 (동년배 대비)`, items: dz.slice().sort((a, b) => b.rel - a.rel).map((d) => `${d.n}: ${d.rel >= 0 ? "+" : ""}${d.rel}% · 10년 발생률 ${d.rate}%${d.rel > 0 ? " ⚠️" : ""}`), buttons: [] } });
  }
  // 6) 위험 높은 질병 관리 가이드(최대 2종)
  hiDz.slice(0, 2).forEach((d) => {
    bubbles.push({ kind: "card", card: { title: `📌 ${d.n} 관리 가이드 (동년배보다 +${d.rel}%)`, items: []
      .concat((d.guide || []).slice(0, 3).map((x) => `✅ ${x}`))
      .concat((d.warn || []).slice(0, 2).map((x) => `⚠️ 이런 신호: ${x}`)), buttons: [`${d.n} 자세히`] } });
  });
  // 7) 예상 의료비
  const C = R.cost;
  if (C) { const dp = C.tyAvg ? Math.round((C.ty - C.tyAvg) / C.tyAvg * 100) : 0;
    bubbles.push({ kind: "card", card: { title: "💰 예상 의료비 (연간 기준)", items: [
      `올해 약 ${money(C.ty)} — 동년배 평균 ${money(C.tyAvg)}보다 ${dp >= 0 ? "+" + dp : dp}%${dp > 0 ? " ⚠️" : ""}`,
      `10년 후 약 ${money(C.y10)}${C.y10Avg ? ` (평균 ${money(C.y10Avg)})` : ""} — 생체나이 기반 증가 추정`,
      `현 추세 유지 시 10년간 누적 약 ${money(Math.round((C.ty + C.y10) / 2 * 10))} 예상`,
    ], buttons: ["의료비 예측"] } });
  }
  // 8) 종합 판단 + 맞춤 액션
  const focusList = [warnCancers.map((c) => c.n).join("·"), hiDz.map((d) => d.n).join("·")].filter(Boolean).join(" / ");
  bubbles.push({ kind: "card", card: { title: "🧭 종합 판단 · 우선 관리 방향", items: [
    `전반적으로 생체나이·노화는 ${M.speed <= 1 ? "양호" : "주의"}, 종합 ‘${M.overall}’`,
    focusList ? `집중 관리 필요: ${focusList}` : "특별한 고위험 항목은 없어요",
    `노화 빠른 장기(${(organs.slice().sort((a, b) => b[1] - a[1])[0] || [])[0] || "-"}) 중심으로 검진·생활관리 권장`,
  ], buttons: [] } });
  bubbles.push({ kind: "card", card: memberActionCard() });
  const quicks = []
    .concat(warnCancers[0] ? [`${warnCancers[0].n} 자세히`] : [])
    .concat(hiDz[0] ? [`${hiDz[0].n} 자세히`] : [])
    .concat(["의료비 예측", "내 생체나이"]).slice(0, 4);
  return { bubbles, quicks };
}
// 질문 의도 분류
function intentOf(t) {
  if (/검사|진단|검진|확인하는/.test(t)) return "검사";
  if (/치료|약|수술|낫|치료법|시술|목표|조절/.test(t)) return "치료";
  if (/생활|습관|식단|음식|운동|관리|예방|줄이|좋은|좋아지/.test(t)) return "생활";
  if (/증상|징후|아프|통증|느낌|나타나/.test(t)) return "증상";
  if (/원인|뭐|무엇|정의|위험|어떤병|이란|이뭐|개요/.test(t)) return "문제";
  return null;
}
// 코퍼스에서 질문에 가장 구체적으로(긴 제목으로) 매칭되는 항목
function kdcaSearch(t, corpus) {
  if (!corpus || !corpus.items) return null;
  let best = null;
  for (const it of corpus.items) {
    const k = it.k; if (!k || k.length < 2) continue;
    if (t.includes(k) && (!best || k.length > best.k.length)) best = it;
  }
  return best;
}
// 코퍼스 항목 + 의도 → 음성용 답변
function corpAnswer(it, intent) {
  const pick = { 검사: "dx", 치료: "tx", 생활: "lf", 증상: "sx", 문제: "s" }[intent];
  const body = (pick && it[pick]) || it.s || it.sx || it.dx || it.tx || it.lf || "";
  if (!body) return null;
  const lab = intent === "검사" ? "의 검사 방법이에요. " : intent === "치료" ? "의 치료 방법이에요. " : intent === "생활" ? "의 생활습관 관리예요. " : intent === "증상" ? "의 증상이에요. " : "에 대해 알려드릴게요. ";
  return `${it.t}${lab}${body}`;
}
// 답변을 문단(줄바꿈)·문장(종결부호) 단위로 분리 — 숫자 목록(1.)·소수점은 보호
function splitSent(t) {
  if (!t) return [];
  var MK = "\u0001";
  return String(t).split(/\n+/).flatMap(function (par) {
    var marked = par
      .replace(/([^0-9])([.!?\u2026])\s*(\d+[.)])/g, "$1$2" + MK + "$3")
      .replace(/([\uac00-\ud7a3])(\d+[.)]\s)/g, "$1" + MK + "$2")
      .replace(/([^\n])([\u2460-\u2473])(?=\s)/g, "$1" + MK + "$2")
      .replace(/([^0-9])([.!?\u2026])\s+/g, "$1$2" + MK);
    return marked.split(MK).map(function (s) { return s.trim(); }).filter(Boolean);
  }).filter(Boolean);
}
// 말풍선 안에 문장·문단 줄나눔 렌더 — 목록(1./①)은 들여쓰기, 도입 문장은 강조
function Sents({ text, lead }) {
  const lines = splitSent(text);
  return lines.map((s, j) => {
    const mk = s.match(/^(\d+[.)]|[①-⑳])\s*/);
    if (mk) {
      return (
        <span key={j} style={{ display: "flex", gap: 7, marginTop: 7, lineHeight: 1.62, alignItems: "flex-start" }}>
          <b style={{ color: "var(--blue)", fontWeight: 800, flexShrink: 0, minWidth: 16 }}>{mk[1]}</b>
          <span>{s.slice(mk[0].length)}</span>
        </span>
      );
    }
    const intro = j === 0; // 도입 문장 강조
    return (
      <span key={j} style={{ display: "block", marginTop: j ? 7 : 0, lineHeight: 1.62, fontWeight: intro ? 700 : 400, color: intro ? "var(--text)" : undefined }}>{intro && lead ? lead : null}{s}</span>
    );
  });
}
function aiWho() { try { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; return (m && m.name) ? m.name : "조성래"; } catch (e) { return "조성래"; } }
function consult(q, corpus, report, QA) {
  const raw = (q || "").trim();
  const t = expandAlias(raw.replace(/\s/g, "")); // 동의어·구어 확장
  // 0) 병원·진료과 안내 의도 — "어떤 병원/어디로 가야/진료과/검진센터"
  if (/병원|검진센터|진료과|어느과|무슨과|어느진료|어디로|어디서검사|어디서진단|어디서진료|어디서받|진료받을|진료를받|검사받을|검사를받/.test(t)) {
    const dz = identifyDz(t, QA);
    if (dz) return hospitalAdvice(dz);
    return "증상이나 질환에 따라 가야 할 진료과가 달라요. 어떤 증상이나 질환인지 알려주시면 알맞은 진료과와 병원을 안내해 드릴게요. 특히 암처럼 정밀검사가 필요한 경우엔, 검사 장비를 갖추고 경험 많은 전문의가 있는 건강검진센터나 상급종합병원이 좋습니다. 앱의 ‘병원 찾기’에서 가까운 병원·검진센터도 찾아보실 수 있어요.";
  }
  // 0-1) 온톨로지 기반 — 검진항목 해석·보험 보장 공백·후속조치(회원 리포트 연계 + 거버넌스)
  const onto = (typeof ontologyConsult === "function") ? ontologyConsult(q) : null;
  if (onto) return onto;
  // 1) 개인 건강분석 리포트(조성래님) 우선 — 개인화 질문이면 리포트로 답변
  const rep = reportAnswer(q, report);
  if (rep) return rep;
  const intent = intentOf(t);
  // 1) 큐레이션 KB(개인화·간결) — 가장 긴 별칭 매칭
  let kb = null, kbLen = 0;
  for (const k of KDCA_KB) for (const a of k.al) if (t.includes(a) && a.length > kbLen) { kb = k; kbLen = a.length; }
  // 2) 학습된 질병관리청 Q&A + 임상 진료지침 매칭
  const cp = qaMatch(t, QA, intent);
  const cpLen = cp ? cp.k.length : 0;
  const want = intent === "검사" ? "검사" : intent === "치료" ? "치료" : intent === "생활" ? "생활" : intent === "증상" ? "증상" : "개요";
  // 더 구체적인(긴) 매칭을 우선, 동률이면 큐레이션 KB. 단 의도가 맞는 전문 진료지침(src)은 큐레이션보다 우선
  if (kb && kbLen >= cpLen && !(cp && cp.src && cp.t === want)) {
    const note = KDCA_NOTE[kb.d] || "";
    if (intent === "검사") return `${note}${kb.d}의 검사 방법이에요. ${kb.검사}`;
    if (intent === "치료") return `${note}${kb.d}의 치료 방법이에요. ${kb.치료}`;
    if (intent === "생활") return `${note}${kb.d}의 생활습관 관리예요. ${kb.생활}`;
    if (intent === "증상" || intent === "문제") return `${note}${kb.문제}`;
    return `${note}${kb.d}에 대해 알려드릴게요. ${kb.문제} 검사 방법은요, ${kb.검사} 그리고 생활습관 관리는요, ${kb.생활}`;
  }
  if (cp) return qaAnswer(cp);
  // 3) 폴백: 코퍼스 직접 검색
  const cp2 = kdcaSearch(t, corpus);
  if (cp2) { const a = corpAnswer(cp2, intent); if (a) return a; }
  // 4) 폴백: 질문 토큰 유사도(다양한 표현 대응)
  const fz = qaFuzzy(raw, QA);
  if (fz) return qaAnswer(fz);
  // 5) 대화형 — 인사·감사·이용안내
  if (/안녕|반가|하이|헬로/.test(t)) return `안녕하세요 ${aiWho()}님! 하이예요. 질환의 증상, 검사, 치료, 생활습관부터 내 건강리포트, 의료비까지 음성으로 도와드릴게요. 무엇이 궁금하세요?`;
  if (/고마워|고맙|감사|수고|땡큐/.test(t)) return "도움이 되었다니 기뻐요. 더 궁금한 점이 있으면 언제든 말씀해 주세요.";
  if (/안내|어떻게|무엇을|뭘물|뭐물|도와|도움|기능|사용법|할수있|예시|물어보면|물어볼/.test(t))
    return "이렇게 도와드릴 수 있어요. 질환 이름과 함께 증상, 검사, 치료, 생활습관을 물어보시거나, ‘내 리포트 요약’, ‘의료비 예측’처럼 말씀해 주세요. 예를 들어 ‘갑상선염 증상’, ‘고혈압 생활습관 관리’, ‘내 당뇨 위험’처럼요.";
  const n = QA && QA.meta ? QA.meta.count : 0;
  return `‘${q}’에 대한 정보는 찾지 못했어요. 질병관리청 Q&A ${n ? n.toLocaleString("ko-KR") + "쌍 " : ""}학습 기반으로, 질환 이름과 함께 증상, 검사, 치료, 생활습관을 물어보시면 돼요. 예를 들어 ‘당뇨 검사 방법’, ‘갑상선염 증상’처럼요.`;
}

function VoiceDoctor() {
  const [trans, setTrans] = useState([{ who: "a", text: `안녕하세요 ${aiWho()}님, 하이예요. 질병관리청 국가건강정보포털, 대한의학회 임상 진료지침, 국립암센터 국가암검진 권고안과 국가암정보센터 자료를 학습해 음성으로 건강상담을 도와드릴게요. 마이크를 누르고 궁금한 점을 말씀해 주세요.` }]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1.03);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");
  const kb = useKdca();
  const report = useReport();
  const qa = useLearnedQA();
  const recogRef = useRef(null);
  const endRef = useRef(null);
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsOK = typeof window !== "undefined" && !!window.speechSynthesis;
  // 한국어 남성 음성 우선 선택(Edge의 InJoon·Hyunsu 등). 없으면 여성 제외 후 첫 음성.
  const pickMale = (ko) => { if (!ko.length) return ""; const male = ko.find((v) => /injoon|injun|hyunsu|hyun-?su|\bmale\b|남성|남자/i.test(v.name)); const notFem = ko.find((v) => !/heami|female|여성|여자|yuna|sun-?hi|sunhi|google/i.test(v.name)); return ((male || notFem || ko[0]).voiceURI) || ""; };
  useEffect(() => { if (!ttsOK) return; const load = () => { const ko = window.speechSynthesis.getVoices().filter((v) => /ko/i.test(v.lang)); setVoices(ko); setVoiceURI((u) => u || pickMale(ko)); }; load(); window.speechSynthesis.onvoiceschanged = load; return () => { try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {} }; }, []);
  const selVoice = voices.find((x) => x.voiceURI === voiceURI);
  const isMale = !!(selVoice && /injoon|injun|hyunsu|hyun-?su|\bmale\b|남성|남자/i.test(selVoice.name));
  const speak = (t) => { if (!ttsOK) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; u.rate = rate; u.pitch = isMale ? 1.08 : 0.82; const v = voices.find((x) => x.voiceURI === voiceURI); if (v) u.voice = v; u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); window.speechSynthesis.speak(u); };
  const stopSpeak = () => { if (ttsOK) window.speechSynthesis.cancel(); setSpeaking(false); };
  const handle = (q) => { if (!q || !q.trim()) return; const a = consult(q, kb, report, qa); setTrans((p) => [...p, { who: "u", text: q }, { who: "a", text: a }]); setText(""); setInterim(""); setTimeout(() => speak(a), 120); setTimeout(() => endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }), 250); };
  const startStt = () => { if (!sttOK) return; stopSpeak(); const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); recogRef.current = r; r.lang = "ko-KR"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1; let fin = ""; r.onstart = () => { setListening(true); setInterim(""); }; r.onresult = (e) => { let itm = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const tr = e.results[i]; if (tr.isFinal) fin += tr[0].transcript; else itm += tr[0].transcript; } setInterim(itm); }; r.onerror = () => setListening(false); r.onend = () => { setListening(false); if (fin.trim()) handle(fin.trim()); }; try { r.start(); } catch (e) { setListening(false); } };
  const stopStt = () => { if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } setListening(false); };
  useEffect(() => () => { stopSpeak(); if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } }, []);
  const qaCount = qa && qa.meta ? qa.meta.count : 0;
  const glChips = qa && qa.qa ? qa.qa.filter((x) => x.src).filter((_, i) => i % 5 === 0).slice(0, 3).map((x) => x.q) : [];
  const qaChips = qa && qa.qa ? qa.qa.filter((x) => !x.src && (x.t === "증상" || x.t === "치료")).filter((_, i) => i % 53 === 0).slice(0, 3).map((x) => x.q) : [];
  const vMember = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const chips = vMember ? memberQuestions(vMember).slice(0, 6) : ["내 리포트 요약", ...(glChips.length ? glChips : ["고혈압 목표 혈압은 얼마인가요?", "당뇨병 진단기준은 무엇인가요?"]), ...(qaChips.length ? qaChips : ["갑상선염의 증상은 무엇인가요?"])];
  const count = kb && kb.items ? (kb.meta && kb.meta.count || kb.items.length) : "660+";
  return (
    <div className="kt">
      <div className="kt-head"><ArrowLeft size={20} className="ic" /><span className="av-ai" style={{ width: 32, height: 32 }}><SecIcon k="ai" /></span>
        <div style={{ flex: 1 }}><div className="nm">AI 주치의 · 음성</div><div className="st"><span className="dot" /> {listening ? "듣는 중…" : speaking ? "답변 중…" : "온라인 · 보이스 상담"}</div></div>
        {speaking ? <button className="cbtn2" style={{ margin: 0, padding: "5px 10px" }} onClick={stopSpeak}><X size={12} /> 멈춤</button> : <Volume2 size={18} className="ic" style={{ color: isMale ? "#2563EB" : "var(--soft)" }} />}</div>
      {vMember && (
        <div className="kt-acts">
          <button onClick={() => nav("checkup")}>🔬 추가검진</button>
          <button onClick={() => nav("hospital")}>🏥 병원진료</button>
          <button onClick={() => nav("shop")}>💊 영양·홈케어</button>
          <button onClick={() => nav("shop")}>🥗 건강식단</button>
        </div>
      )}
      <div className="kt-body">
        <div className="daypill"><BookOpen size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> 질병관리청·임상 진료지침·국가암정보센터 {qaCount ? qaCount.toLocaleString("ko-KR") : "1,900+"}건 학습 · {isMale ? "남성 음성" : "남성형 중저음"}</div>
        {trans.map((m, i) => {
          if (m.who === "a") {
            const showAv = i === 0 || trans[i - 1].who !== "a";
            return (
              <div className="msg ai" key={i}>
                <span className="av-ai">{showAv ? <SecIcon k="ai" /> : null}</span>
                <div className="col">{showAv && <div className="who">AI 주치의</div>}
                  <div className="bubble-row">
                    <div className="bubble ai" style={{ cursor: "pointer" }} onClick={() => speak(m.text)} title="다시 듣기"><Sents text={m.text} lead={<Volume2 size={13} style={{ verticalAlign: -2, marginRight: 5, color: "var(--blue)" }} />} /></div>
                    <div className="meta"><span onClick={() => speak(m.text)} style={{ cursor: "pointer", fontSize: 11, color: "var(--blue)", fontWeight: 700, whiteSpace: "nowrap" }}>다시듣기</span></div>
                  </div></div></div>
            );
          }
          return (
            <div className="msg me" key={i}>
              <div className="col"><div className="bubble-row">
                <div className="bubble me">{m.text}</div>
                <div className="meta"><span style={{ fontSize: 11, color: "var(--soft)", whiteSpace: "nowrap" }}><Mic size={11} style={{ verticalAlign: -1 }} /> 음성</span></div>
              </div></div></div>
          );
        })}
        {speaking && <div className="msg ai"><span className="av-ai"><SecIcon k="ai" /></span><div className="typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      {(listening || interim) && <div style={{ padding: "7px 14px", fontSize: 12.8, color: "var(--blue)", fontWeight: 600, background: "#EEF3FF", borderTop: "1px solid var(--border)" }}>{listening ? "🎙 듣는 중… 말씀하세요 " : ""}{interim && "“" + interim + "”"}</div>}
      <div className="quicks">{chips.map((c) => <button key={c} onClick={() => handle(c)}>{c}</button>)}</div>
      {ttsOK && <div style={{ display: "flex", gap: 7, alignItems: "center", padding: "8px 12px", flexWrap: "wrap", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 800 }}><Volume2 size={12} style={{ verticalAlign: -2 }} /> 속도</span>
        {[["느림", 0.85], ["보통", 1.03], ["빠름", 1.3]].map(([l, r]) => <div key={l} className={`fsel ${rate === r ? "on" : ""}`} style={{ padding: "4px 11px", fontSize: 11 }} onClick={() => setRate(r)}>{l}</div>)}
        {voices.length > 1 && <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} style={{ border: "1px solid var(--border)", background: "#F7F9FC", borderRadius: 10, padding: "5px 9px", fontSize: 11, fontWeight: 700, color: "var(--text)", outline: "none", cursor: "pointer", maxWidth: 170 }}>{voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>🔊 {v.name}</option>)}</select>}
      </div>}
      <div className="kt-input">
        <button className="pl" onClick={() => listening ? stopStt() : startStt()} disabled={!sttOK} style={{ color: listening ? "#EF4444" : "var(--blue)" }} title={sttOK ? "마이크" : "이 브라우저는 음성인식 미지원"}>{listening ? <X size={22} /> : <Mic size={22} />}</button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle(text)} placeholder={sttOK ? "마이크를 누르고 말하거나 입력하세요" : "여기에 입력하세요 (음성인식 미지원)"} />
        <button className={`send ${text.trim() ? "on" : "off"}`} onClick={() => handle(text)}><Send size={16} /></button>
      </div>
      <div className="kt-disc">출처: <b>질병관리청 국가건강정보포털</b>, <b>대한의학회 임상 진료지침</b>, <b>국립암센터 국가암검진 권고안</b>, <b>국가암정보센터</b> 자료 학습 · 참고용(진단 아님) · 응급 시 119. 음성인식(STT)은 Chrome·Edge에서 마이크 권한 허용 시 동작합니다. <b>남성 중고음 음성</b>은 브라우저에 한국어 남성 음성(예: Edge의 InJoon·Hyunsu)이 있으면 자동 적용되고, 없으면 보유 음성을 중저음으로 낮춰 남성형으로 들려드립니다.</div>
    </div>
  );
}

/* ===== AI 주치의 — 국가건강정보 기반 구조화 상담 ===== */
/* 더미 건강정보 KB — 질병관리청 국가건강정보포털 콘텐츠 '구조(스키마)' 기반.
   ※ 실서비스는 OpenAPI 승인 후 동일 필드로 교체. 원문 무단복제·변형 금지, 출처·라이선스 표시. */
const HC_SRC = "질병관리청 국가건강정보포털";
const HC_URL = "https://health.kdca.go.kr/healthinfo/";
const HC_LIC = "공공누리 유형 확인 필요(상업적 이용·원문 변형 제한 여부 사전 확인)";
/* ── 국가건강정보포털 OpenAPI 연동 어댑터(스텁) ──
   실서비스: 승인받은 OpenAPI 엔드포인트에서 콘텐츠를 받아 mapKdcaItem으로 동일 스키마로 변환.
   원문 무단복제·변형 금지 — original_content/summary/출처/라이선스 필드 보존. */
const KDCA_API = {
  enabled: false,                          // OpenAPI 이용허락·승인 후 true
  endpoint: "https://api.odcloud.kr/api/health-contents", // 승인 후 발급 URL로 교체
  serviceKey: "",                          // 발급 키(서버 측 보관 권장)
};
function kdcaArr(v) { return Array.isArray(v) ? v : (typeof v === "string" && v ? v.split(/[;,·\n]/).map((s) => s.trim()).filter(Boolean) : []); }
function mapKdcaItem(raw) { // OpenAPI 응답 1건 → 내부 스키마(필드명은 실제 응답에 맞게 조정)
  return {
    id: raw.cntntsSn ? `kdca_${raw.cntntsSn}` : (raw.id || ""),
    category: raw.upCntntsNm || raw.category || "건강정보", subCategory: raw.cntntsClNm || raw.subCategory || "",
    title: raw.cntntsNm || raw.title || "", summary: raw.cntntsSumry || raw.summary || "", definition: raw.dfn || raw.definition || "",
    causes: kdcaArr(raw.cause), symptoms: kdcaArr(raw.symptom), tests: kdcaArr(raw.exam), treatment: kdcaArr(raw.trt),
    prevention: kdcaArr(raw.prvntn), lifestyle: kdcaArr(raw.lifestyle), whenDoctor: kdcaArr(raw.visit), emergency: kdcaArr(raw.emergency),
    relatedDiseases: kdcaArr(raw.relDisease), relatedTests: kdcaArr(raw.relTest), relatedDepartments: kdcaArr(raw.relDept),
    kw: kdcaArr(raw.keyword), risk: Number(raw.risk) || 0, ins: kdcaArr(raw.insTag),
    sourceName: HC_SRC, sourceUrl: raw.url || HC_URL, published: raw.regDt || "", updated: raw.updtDt || "",
    licenseType: raw.license || HC_LIC, citationText: `출처: ${HC_SRC} · ${raw.cntntsNm || raw.title || ""}`,
    original_content: raw.cntntsCn || "", // 원문 보존(변형 금지)
  };
}
async function fetchHealthContents() { // 콘텐츠 로더 — 미승인 시 로컬 더미, 승인 후 OpenAPI fetch
  if (!KDCA_API.enabled) return HEALTH_CONTENTS;
  try {
    const res = await fetch(`${KDCA_API.endpoint}?serviceKey=${encodeURIComponent(KDCA_API.serviceKey)}&returnType=JSON&perPage=1000`);
    const json = await res.json();
    const items = (json.data || json.items || []).map(mapKdcaItem).filter((c) => c.title);
    return items.length ? items : HEALTH_CONTENTS;
  } catch (e) { return HEALTH_CONTENTS; }
}
const RISK = [
  ["일반 정보", "#16A34A", "#E7F8EE"], ["생활관리 필요", "#2563EB", "#E8F1FE"], ["병원 상담 권장", "#F59E0B", "#FEF3E2"],
  ["빠른 진료 권장", "#EA580C", "#FFF1E8"], ["응급상황 가능성", "#EF4444", "#FDECEC"],
];
const INS_META = {
  "중증질환": [ShieldCheck, "#EF4444", "#FDECEC", "중증질환 보장", ["암 진단·치료", "뇌혈관질환", "심혈관질환", "희귀난치질환"]],
  "비급여": [Coins, "#2563EB", "#E8F1FE", "비급여 보장", ["고가 신약·비급여 항암", "특수검사·신의료기술", "로봇수술·첨단재생치료"]],
  "간병치매": [HeartHandshake, "#DB2777", "#FCE7F3", "간병·치매 보장", ["장기요양·치매관리", "재가돌봄", "간병인 비용"]],
  "특수분야": [Sparkles, "#7C3AED", "#F1ECFE", "특수분야 보장", ["치과·안과", "재활·정신건강", "피부·재건치료"]],
  "생활관리절감": [HeartPulse, "#16A34A", "#E7F8EE", "생활관리 기반 보험료 절감", ["건강검진·운동·식단 관리", "금연·절주·만성질환 관리", "건강지갑 적립으로 보험료 지원"]],
};
const REC_Q = [
  ["가슴 통증이 있을 때 어떤 검사를 받아야 하나요?", "가슴 통증"], ["고혈압은 생활습관으로 얼마나 관리할 수 있나요?", "고혈압"],
  ["당뇨 전단계는 어떻게 관리해야 하나요?", "당뇨"], ["부모님 치매가 걱정될 때 어떤 검사를 받아야 하나요?", "치매"],
  ["암 치료 중 비급여 치료비는 어떤 보장이 필요할까요?", "비급여"], ["눈이 침침하고 백내장이 의심될 때 확인할 것은 무엇인가요?", "백내장"],
  ["콜레스테롤이 높다는데 어떻게 관리하나요?", "고지혈증"], ["잠이 잘 안 올 때 어떻게 해야 하나요?", "불면"], ["유방암 검진은 언제 받아야 하나요?", "유방암"],
];
const HC_CATS = [
  ["질병 정보", HeartPulse, "고혈압"], ["증상 정보", Activity, "가슴 통증"], ["검진항목 해석", Stethoscope, "혈압 수치"], ["치료 정보", Pill, "당뇨"], ["생활습관 관리", Salad, "고혈압 생활습관 관리법은?"],
  ["영양·홈케어기기", HeartPulse, "당뇨 영양제 추천"], ["건강 식단", Salad, "고혈압 식단"], ["의료지원제도", ShieldCheck, "내가 받을 수 있는 의료지원제도"], ["심뇌혈관질환", Brain, "뇌졸중"], ["암 정보", ShieldCheck, "대장암 검진"],
  ["대상군 케어(노인·여성·아동)", Users, "노인 건강관리"], ["정신건강", Users, "우울"], ["희귀질환", FileText, "루게릭"], ["예방접종", ShieldCheck, "예방접종"], ["응급상황", AlertTriangle, "가슴 통증"],
];
/* 데이터하우스 온톨로지 — 카테고리별 전체 목록(실데이터 기반 카운트·브라우즈) */
function ontoCategories() {
  const out = [];
  if (typeof NUTRITION_KB !== "undefined" && NUTRITION_KB) out.push({ name: "영양 가이드", key: "nutr", count: NUTRITION_KB.length, items: NUTRITION_KB.map((e) => ({ t: e.dz[0], s: `영양소 ${e.nutrients.slice(0, 3).join("·")} · 식품 ${(e.food || []).slice(0, 2).join("·")}`, q: `${e.dz[0]} 영양제 추천` })) });
  if (typeof DEVICE_KB !== "undefined" && DEVICE_KB) out.push({ name: "홈케어 의료기기", key: "dev", count: DEVICE_KB.length, items: DEVICE_KB.map((e) => ({ t: e.dz[0], s: e.items.map((it) => it[0]).slice(0, 2).join("·"), q: `${e.dz[0]} 홈케어 의료기기` })) });
  if (typeof DIET_KB !== "undefined" && DIET_KB) out.push({ name: "건강 식단", key: "diet", count: DIET_KB.length, items: DIET_KB.map((e) => ({ t: e.dz[0], s: e.principle, q: `${e.dz[0]} 식단` })) });
  if (typeof SUPPORT_KB !== "undefined" && SUPPORT_KB) out.push({ name: "의료지원제도", key: "support", count: SUPPORT_KB.length, items: SUPPORT_KB.map((e) => ({ t: e.name, s: e.who, q: `${e.name} 지원제도` })) });
  if (typeof CHECKUP_ONTOLOGY !== "undefined" && CHECKUP_ONTOLOGY) out.push({ name: "검진항목 해석", key: "checkup", count: CHECKUP_ONTOLOGY.length, items: CHECKUP_ONTOLOGY.map((e) => ({ t: e.key, s: `${e.unit || ""} · 정상 ${(e.grades && e.grades[0] && e.grades[0][1]) || ""}`, q: `${e.key} 수치` })) });
  if (typeof CASE_KB !== "undefined" && CASE_KB) out.push({ name: "맞춤 사례", key: "case", count: CASE_KB.length, items: CASE_KB.map((e) => ({ t: e.profile, s: e.actions.slice(0, 2).join("·"), q: "나와 비슷한 회원 관리 사례" })) });
  if (typeof GROUP_KB !== "undefined" && GROUP_KB) out.push({ name: "대상군 케어", key: "group", count: Object.keys(GROUP_KB).length, items: Object.entries(GROUP_KB).map(([k, e]) => ({ t: k, s: (e.focus || []).slice(0, 2).join("·"), q: `${k} 건강관리` })) });
  return out;
}
const CAT_GROUPS = [
  ["만성질환", (c) => c.subCategory === "만성질환"],
  ["암 정보", (c) => c.subCategory === "암정보"],
  ["심뇌혈관", (c) => c.category === "심뇌혈관질환정보"],
  ["호흡기", (c) => c.subCategory === "호흡기"],
  ["소화기", (c) => c.subCategory === "소화기"],
  ["근골격", (c) => c.subCategory === "근골격"],
  ["신경", (c) => c.subCategory === "신경"],
  ["정신건강", (c) => c.subCategory === "정신건강정보" || c.subCategory === "정신건강"],
  ["희귀질환", (c) => c.subCategory === "희귀질환정보"],
  ["약품·식품", (c) => c.subCategory === "약품/식품정보"],
  ["감염·예방", (c) => c.subCategory === "감염병" || c.subCategory === "감염·피부"],
  ["생애주기", (c) => /청소년|노인/.test(c.subCategory)],
];
const FAV_NEWS_KO = ["새 생활관리 정보가 업데이트되었어요.", "관련 검진 권고가 변경되었어요.", "계절 주의사항이 추가되었어요.", "관련 보장 정보가 갱신되었어요."];
const FAV_NEWS_EN = ["New lifestyle tips updated.", "Screening recommendation changed.", "Seasonal precautions added.", "Coverage info refreshed."];
const RISK_EN = ["General info", "Lifestyle care", "See a doctor", "Prompt care", "Possible emergency"];
const UI_STR = {
  ko: { tag: "국가건강정보 기반", title: "국가건강정보 기반 AI 주치의", desc: "공신력 있는 건강정보와 AI 분석을 결합해 질병·증상·검사·치료·생활관리 상담을 제공합니다.", bText: "텍스트로 상담하기", bVoice: "음성으로 상담하기", bIns: "내 보험 보장 분석하기", bigOn: "글자 작게", bigOff: "글자 크게", ph: "증상, 질병, 검사, 치료, 생활관리 방법을 질문해 주세요.", go: "검색", recQ: "추천 질문", cats: "건강정보 카테고리", catlist: "카테고리별 전체 목록", fav: "⭐ 자주 본 질환 즐겨찾기", listen: "듣는 중… 말씀해 주세요", close: "닫기 ✕", emgT: "현재 증상은 응급상황 가능성이 있습니다.", emgS: "즉시 119 또는 가까운 응급실에 연락하시기 바랍니다.", emgBtn: "119 전화", summary: "핵심 요약", causes: "가능한 원인", symptoms: "확인해야 할 증상", tests: "필요한 검사·진료", lifestyle: "생활관리 방법", whenDoctor: "병원 방문이 필요한 경우", emergency: "응급실 방문이 필요한 위험 신호", relDz: "관련 질환", relTest: "관련 검사", relDept: "관련 진료과", insTitle: "관련 보험·보장 검토 포인트", source: "출처", related: "관련 건강정보", none: "검색 결과가 없습니다.", noneSub: "다른 키워드로 검색해 주세요. 예: 고혈압, 당뇨, 가슴 통증, 치매, 백내장", reset: "다른 주제 검색", filters: ["증상으로 찾기", "질병명으로 찾기", "검사·치료로 찾기", "생활관리로 찾기"], note: "" },
  en: { tag: "Based on National Health Info", title: "AI Doctor · National Health Info", desc: "Combining credible national health information with AI analysis to consult on diseases, symptoms, tests, treatment and lifestyle.", bText: "Text consult", bVoice: "Voice consult", bIns: "Analyze my coverage", bigOn: "Smaller text", bigOff: "Larger text", ph: "Ask about symptoms, diseases, tests, treatment, or lifestyle.", go: "Search", recQ: "Suggested questions", cats: "Health categories", catlist: "Browse by category", fav: "⭐ Favorite conditions", listen: "Listening… please speak", close: "Close ✕", emgT: "Your symptoms may indicate an emergency.", emgS: "Call 119 or go to the nearest ER immediately.", emgBtn: "Call 119", summary: "Summary", causes: "Possible causes", symptoms: "Symptoms to check", tests: "Tests & care", lifestyle: "Lifestyle management", whenDoctor: "When to see a doctor", emergency: "Emergency warning signs", relDz: "Related conditions", relTest: "Related tests", relDept: "Departments", insTitle: "Insurance coverage to consider", source: "Source", related: "Related health info", none: "No results found.", noneSub: "Try another keyword, e.g. hypertension, diabetes, chest pain.", reset: "Search another topic", filters: ["By symptom", "By disease", "By test/treatment", "By lifestyle"], note: "Detailed health content is shown in Korean per the source (KDCA National Health Information Portal). Some controls remain in Korean in this prototype." },
};
const EMERGENCY_KW = ["가슴통증", "흉통", "가슴이아프", "가슴이답답", "호흡곤란", "숨이안", "숨쉬기힘", "숨이차", "의식저하", "의식이없", "쓰러", "마비", "반신", "말이안나", "심한출혈", "피가멈추지", "갑자기안보", "시야장애", "극심한두통", "벼락두통", "심한두통", "자살", "죽고싶"];
function detectEmergency(text) { const s = (text || "").toLowerCase().replace(/\s/g, ""); return EMERGENCY_KW.some((k) => s.includes(k)); }
function searchHealth(query, filter, list) {
  const s = (query || "").trim().toLowerCase().replace(/\s/g, ""); if (!s) return [];
  const norm = (t) => (t || "").toLowerCase().replace(/\s/g, "");
  return (list && list.length ? list : HEALTH_CONTENTS).map((c) => {
    const F = { "증상": c.symptoms.join(" "), "질병": c.title + " " + c.relatedDiseases.join(" "), "검사": c.tests.join(" ") + " " + c.treatment.join(" "), "생활관리": c.lifestyle.join(" ") + " " + c.prevention.join(" ") };
    let sc = 0;
    const tn = norm(c.title);
    // 양방향 매칭: 짧은 검색어는 필드가 포함, 자연어 문장은 키워드가 질문에 포함
    if (tn.includes(s) || (tn.length >= 2 && s.includes(tn))) sc += 12;
    c.kw.forEach((k) => { const kn = norm(k); if (kn && (s.includes(kn) || kn.includes(s))) sc += 7; });
    if (norm(c.summary).includes(s)) sc += 3;
    Object.keys(F).forEach((k) => { if (norm(F[k]).includes(s)) sc += (filter === k ? 9 : 4); });
    return [c, sc];
  }).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
}
function citeText(c) { return `출처: ${HC_SRC} · ${c.title} · ${c.sourceUrl} · 확인일 2026-06-28`; }

/* 상담 세션·보험추천 로그 — 명세 8항 테이블 구조(메모리 시연용, 실서비스는 DB insert) */
let LOGID = 1000;
let LOG_CONSENT = true;   // 동의관리(DID) — 동의 시에만 상담로그 저장
const FAV_KEY = "hifin_ai_fav";
const FAVORITES = (() => { try { return (typeof localStorage !== "undefined" && JSON.parse(localStorage.getItem(FAV_KEY))) || []; } catch (e) { return []; } })(); // 자주 본 질환 즐겨찾기 [{id,title}] · localStorage 영속
function saveFav() { try { if (typeof localStorage !== "undefined") localStorage.setItem(FAV_KEY, JSON.stringify(FAVORITES)); } catch (e) {} }
const AI_SESSIONS = [];   // ai_doctor_sessions
const INS_REC_LOGS = [];  // insurance_recommendation_logs
const RISK_ACTION = ["일반 건강정보 참고", "생활습관 관리 권장", "병원 진료 상담 권장", "빠른 진료 권장", "즉시 119·응급실 연락"];
function logConsult(question, content, riskIdx) {
  if (!LOG_CONSENT) return null; // 동의 철회 시 저장하지 않음
  const ts = new Date().toISOString();
  const session = { id: `sess_${++LOGID}`, user_id: "user_demo", question, answer_summary: content ? content.summary : "(검색 결과 없음)", risk_level: RISK[riskIdx][0], recommended_action: RISK_ACTION[riskIdx], referenced_content_ids: content ? [content.id] : [], created_at: ts };
  AI_SESSIONS.push(session);
  if (content) INS_REC_LOGS.push({ id: `insrec_${LOGID}`, user_id: "user_demo", session_id: session.id, detected_risks: content.ins, recommended_coverages: content.ins.map((t) => (INS_META[t] || [])[3]).filter(Boolean), health_wallet_suggestion: "건강활동 적립 건강자산으로 보험료·의료비 지원 가능", created_at: ts });
  // Foundry 닫힌 루프: 로그인 회원의 데이터 스토리지에도 상담 이벤트 적재 → 분석 앱에서 5대 안내로 연결
  try { if (typeof consultAdd === "function" && typeof demoCurrentUser === "function") { const cu = demoCurrentUser(); if (cu) consultAdd(cu, { id: session.id, topic: (content && content.title) || question.slice(0, 12), kind: "증상질문", question, riskIdx, risk: RISK[riskIdx][0], riskColor: RISK[riskIdx][1], riskBg: RISK[riskIdx][2], source: "상담(실시간)" }); } } catch (e) {}
  // saveToBackend(session) — 실서비스: Supabase/PostgreSQL insert (ai_doctor_sessions, insurance_recommendation_logs)
  return session;
}

/* AI 주치의 → 검진·병원 딥링크 */
let HEALTH_LINK = null;
function linkToSection(to, title, dept) { HEALTH_LINK = { to, title, dept: dept || "" }; nav(to); }
function AiLinkBanner({ target }) {
  const [link] = useState(() => (HEALTH_LINK && HEALTH_LINK.to === target ? HEALTH_LINK : null));
  useEffect(() => { if (HEALTH_LINK && HEALTH_LINK.to === target) HEALTH_LINK = null; }, []);
  if (!link) return null;
  return (
    <div className="ailink">
      <span className="ai"><SecIcon k="ai" /></span>
      <div className="lt"><b>AI 주치의 상담에서 연결되었습니다</b><span>“{link.title}” 관련 {target === "hospital" ? (link.dept ? link.dept + " 병원" : "병원") + " 안내" : "검진 안내"}</span></div>
      <button onClick={() => nav("ai")}><ArrowLeft size={14} /> 상담으로</button>
    </div>
  );
}

/* 보장 유형별 월 보험료 추정(시연용, 원) — 생활관리절감은 할인 */
const PREMIUM_EST = { "중증질환": 38000, "비급여": 24000, "간병치매": 32000, "특수분야": 18000, "생활관리절감": -8000 };
/* 회원 건강상태 기반 맞춤 질문 다수 생성 */
function memberQuestions(m) {
  if (!m) return [];
  const qs = ["내 종합 케어플랜", "나와 비슷한 회원 관리 사례", "내 건강상태를 분석해줘", "내 리포트 요약", "내 생체나이는?", "내 의료비 예측", "내 건강 후속조치", "내가 가장 조심해야 할 암은?"];
  (m.highRiskCancerTypes || []).forEach((c) => { qs.push(`내 ${c} 위험은?`); qs.push(`${c} 검진은 어떻게 받나요?`); });
  (m.highRiskDiseases || []).forEach((dz) => { qs.push(`내 ${dz} 위험은?`); qs.push(`${dz} 생활관리법은?`); });
  const hd = m.highRiskDiseases || [];
  if (hd.includes("당뇨병")) qs.push("혈당 수치 의미");
  if (hd.includes("고혈압")) qs.push("혈압 기준이 뭐예요?");
  if (hd.includes("고지혈증")) qs.push("콜레스테롤 기준은?");
  const d0 = hd[0] || (m.highRiskCancerTypes || [])[0];
  if (d0) { qs.push(`${d0} 영양제 추천`); qs.push(`${d0} 식단`); }
  qs.push("맞춤 홈케어 의료기기", "내가 받을 수 있는 의료지원제도");
  return [...new Set(qs)];
}
const ORGAN_DEPT = { "간": "소화기내과", "췌장": "소화기내과", "심장": "순환기내과", "신장": "신장내과", "비만": "가정의학과", "비만체형": "가정의학과" };
/* 권고 상태 기반 타 섹션 연계 안내(추가검진·병원·영양제·식단) */
function MemberCareLinks({ member }) {
  if (!member) return null;
  const R = demoReport(member), N = member.name;
  const cancers = member.highRiskCancerTypes || [], dzs = member.highRiskDiseases || [];
  const worst = (R.worstNames && R.worstNames[0]) || "";
  const dept = cancers.length ? (deptFor(cancers[0]).dept || "전문 진료과") : (ORGAN_DEPT[worst] || "내과");
  const actions = [
    { ic: CalendarCheck, col: "#2563EB", t: "추가 검진 예약", d: `${cancers.length ? cancers.join("·") + " 등 " : ""}고위험 항목은 권고 주기보다 자주 정밀검진을 받는 것이 좋아요.`, btn: "검진 예약하기", to: "checkup" },
    { ic: Building2, col: "#7C3AED", t: "병원·진료과 안내", d: `${cancers[0] || worst || "건강"} 관련은 ${dept} 진료가 적합해요. 가까운 병원·검진센터를 찾아드려요.`, btn: "병원 찾기", to: "hospital" },
    { ic: Pill, col: "#F59E0B", t: "영양 및 홈케어의료기", d: `${(R.worstNames || []).join("·") || "건강 관리"}에 맞춘 영양제·홈케어 의료기기를 추천해 드려요.`, btn: "보러 가기", to: "shop" },
  ];
  if (dzs.length) actions.push({ ic: Salad, col: "#16A34A", t: "만성질환 관리 식단", d: `${dzs.join("·")} 관리를 위한 저염·저당·균형 식단을 안내해요.`, btn: "식단 보기", to: "shop" });
  // 은근한 정밀검사 추천 — 뇌·신경·암 위험 신호가 뚜렷할 때만
  const _sig = cancers.concat(dzs).join(" ");
  if (/치매|인지|알츠하이머|파킨슨|뇌졸중|뇌혈관|떨림|손저림|기억/.test(_sig)) {
    actions.push({ ic: Brain, col: "#7C3AED", t: "뇌 정밀검사 참고", d: "뇌·신경 관련 위험 신호가 보여요. 증상이 나타나기 전 AI 뇌영상 정밀검사(예: 휴런)로 조기에 확인하는 방법도 있어요.", btn: "특수검진 살펴보기", to: "checkup", tab: "special" });
  } else if (cancers.length) {
    actions.push({ ic: ShieldCheck, col: "#DC2626", t: "암 정밀검사 참고", d: `${cancers[0]} 위험이 있으니, 혈액 액체생검 등 첨단 정밀 조기검진도 참고해 보세요.`, btn: "특수검진 살펴보기", to: "checkup", tab: "special" });
  }
  return (
    <div className="adcard adcare">
      <div className="adt2"><HeartHandshake size={16} color="#16A34A" /> {N}님 맞춤 건강 액션 — 다른 섹션 연계 안내</div>
      <div className="caregrid">
        {actions.map((a, i) => (
          <div className="carec" key={i} style={{ borderTopColor: a.col }}>
            <span className="ci" style={{ background: a.col + "1A", color: a.col }}><a.ic size={20} /></span>
            <div className="ct">{a.t}</div>
            <div className="cd">{a.d}</div>
            <button className="cbtn" style={{ margin: "8px 0 0", width: "100%" }} onClick={() => { if (a.tab) _checkupTab = a.tab; nav(a.to); }}>{a.btn} <ChevronRight size={13} /></button>
          </div>
        ))}
      </div>
      <div className="aiddisc"><AlertTriangle size={14} /> 권고는 검진 데이터 기반 참고 안내이며, 확정 진단·처방은 의료진 상담이 필요합니다.</div>
    </div>
  );
}
/* ③ 관계레이어 시각화 — 종합 케어플랜 카드(6영역 + 섹션 연계 버튼) */
function CarePlanCard({ member }) {
  const key = "hifin_careplan_" + ((member && member.email) || "default");
  const gkey = "hifin_careguard_" + ((member && member.email) || "default");
  const [status, setStatus] = useState({});
  const [guard, setGuard] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [gName, setGName] = useState(""); const [gPhone, setGPhone] = useState("");
  useEffect(() => { try { setStatus(JSON.parse(localStorage.getItem(key) || "{}")); } catch (e) { setStatus({}); } try { setGuard(JSON.parse(localStorage.getItem(gkey) || "null")); } catch (e) { setGuard(null); } }, [key, gkey]);
  const doShare = () => { if (!gName.trim()) { if (typeof toast === "function") toast("보호자 성함을 입력해 주세요."); return; } const g = { name: gName.trim(), phone: gPhone.trim() }; setGuard(g); try { localStorage.setItem(gkey, JSON.stringify(g)); } catch (e) {} setShareOpen(false); setGName(""); setGPhone(""); if (typeof toast === "function") toast(`✅ 보호자 ${g.name}님께 케어플랜 공유 안내를 보냈습니다.`); };
  const unShare = () => { setGuard(null); try { localStorage.removeItem(gkey); } catch (e) {} if (typeof toast === "function") toast("보호자 공유를 해제했습니다."); };
  if (!member || typeof buildCarePlan !== "function") return null;
  const p = buildCarePlan(member);
  if (!p) return null;
  const ICO = { hospital: Building2, checkup: CalendarCheck, pill: Pill, device: MonitorSmartphone, salad: Salad, shield: ShieldCheck };
  const STAT = ["할 일", "진행중", "완료 ✓"];
  const REWARD = (typeof CAREPLAN_REWARD !== "undefined") ? CAREPLAN_REWARD : { "병원·진료": 300, "추가 검진": 500, "영양·홈케어의료기": 100, "홈케어 기기": 100, "맞춤 식단": 100, "의료지원제도": 50 };
  const cycle = (title) => { const nx = (((status[title] || 0) + 1) % 3); const next = { ...status, [title]: nx }; setStatus(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {} if (nx === 2 && typeof toast === "function") toast(`✅ ${title} 완료 · +${REWARD[title] || 100} HTK 건강금융지갑 적립!`); };
  const done = p.domains.filter((dmn) => (status[dmn.title] || 0) === 2).length;
  const pct = Math.round(done / p.domains.length * 100);
  const earned = p.domains.reduce((s, dmn) => s + (((status[dmn.title] || 0) === 2) ? (REWARD[dmn.title] || 100) : 0), 0);
  const maxPts = p.domains.reduce((s, dmn) => s + (REWARD[dmn.title] || 100), 0);
  const printPlan = () => {
    const rows = p.domains.map((dmn, i) => `<tr><td>${i + 1}. ${dmn.title} [${dmn.urgency}]</td><td>${dmn.need}</td><td>${STAT[status[dmn.title] || 0].replace(" ✓", "")}</td></tr>`).join("");
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${p.name}님 종합 케어플랜</title><style>body{font-family:system-ui,'Malgun Gothic',sans-serif;padding:30px;color:#1B2A52}h1{font-size:20px;margin:0 0 6px}table{width:100%;border-collapse:collapse;margin-top:10px}td{border-bottom:1px solid #e5e9f0;padding:9px;font-size:13px}.lv{display:inline-block;background:#E7F8EE;color:#16A34A;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700}.disc{margin-top:16px;font-size:11px;color:#a05a00}</style></head><body><div style="font-size:12px;color:#7886a8">HI-Fin Tech · AI 주치의 종합 케어플랜</div><h1>${p.name}님 종합 케어플랜 <span class="lv">${p.level}</span></h1><div style="font-size:12px;color:#667">진행률 ${pct}% (${done}/${p.domains.length})</div><table><thead><tr><td><b>영역</b></td><td><b>권장 내용</b></td><td><b>상태</b></td></tr></thead><tbody>${rows}</tbody></table><div class="disc">※ 검진 데이터 기반 참고 안내이며, 확정 진단·처방은 의료진 상담이 필요합니다.</div></body></html>`;
    const w = window.open("", "_blank", "width=720,height=900"); if (!w) { if (typeof toast === "function") toast("팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요."); return; } w.document.write(html); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350);
  };
  return (
    <div className="adcard cplan">
      <div className="adt2"><HeartHandshake size={16} color="#16A34A" /> {p.name}님 종합 케어플랜 <span className="cplvl">{p.level}</span><button className="cpshare" onClick={() => setShareOpen((v) => !v)}><Users size={13} /> 가족 공유</button><button className="cpprint" onClick={printPlan}><FileText size={13} /> 인쇄</button></div>
      {guard && (<div className="cpguard"><Users size={13} color="#16A34A" /> 보호자 <b>{guard.name}</b>님과 공유 중{guard.phone ? ` (${guard.phone})` : ""} <button onClick={unShare}>공유 해제</button></div>)}
      {shareOpen && (<div className="cpshareform"><div className="csfh"><Users size={14} color="#2563EB" /> 보호자(가족)에게 케어플랜 공유 <small>진행상황을 함께 관리할 수 있어요</small></div>
        <div className="csfin"><input placeholder="보호자 성함" value={gName} onChange={(e) => setGName(e.target.value)} /><input placeholder="휴대폰(선택)" value={gPhone} onChange={(e) => setGPhone(e.target.value)} /><button className="csfgo" onClick={doShare}><Send size={13} /> 공유</button></div>
        <div className="csfnote">※ 현재 환경에서는 실제 문자가 발송되지 않습니다. 동의한 보호자에게만 공유하세요.</div></div>)}
      <div className="cpprog"><div className="cppt">진행률 <b>{pct}%</b> <span>{done}/{p.domains.length} 완료</span><span className="cprew"><Coins size={12} /> +{earned.toLocaleString("ko-KR")} HTK <small>/ 최대 {maxPts.toLocaleString("ko-KR")}</small></span><button className="cprwbtn" onClick={() => nav("wallet")}>건강금융지갑 ›</button></div><div className="cppbar"><i style={{ width: pct + "%" }} /></div></div>
      <div className="cpgrid">
        {p.domains.map((dmn, i) => { const Ic = ICO[dmn.icon] || Sparkles; const st = status[dmn.title] || 0; return (
          <div className="cprow" key={i} style={{ borderLeftColor: dmn.color, opacity: st === 2 ? 0.72 : 1 }}>
            <span className="ci" style={{ background: dmn.color + "1A", color: dmn.color }}><Ic size={18} /></span>
            <div className="cpb"><div className="cpt">{dmn.title} {dmn.urgency && <span className={`cpurg ${dmn.urgency === "긴급" ? "u1" : dmn.urgency === "권장" ? "u2" : "u3"}`}>{dmn.urgency}</span>}</div><div className="cpn">{dmn.need}</div><div className="cpr">{dmn.reason}</div></div>
            <div className="cpacts">
              <button className={`cpstat s${st}`} onClick={() => cycle(dmn.title)} title="상태 변경">{STAT[st]}</button>
              <button className="cpgo" style={{ color: dmn.color }} onClick={() => nav(dmn.to)}>{dmn.btn} <ChevronRight size={13} /></button>
            </div>
          </div>
        ); })}
      </div>
      <div className="aiddisc"><AlertTriangle size={14} /> 검진 데이터 기반 참고 안내이며, 확정 진단·처방은 의료진 상담이 필요합니다. 진행상태는 이 기기에 저장됩니다.</div>
    </div>
  );
}
/* ④ 사례기반 심층 상담 시각화 카드 */
function CaseCard({ data, onPlan }) {
  if (!data) return null;
  return (
    <div className="adcard casecard">
      <div className="adt2"><Users size={16} color="#7C3AED" /> 사례기반 심층 상담 <span className="cplvl" style={{ color: "#7C3AED", background: "#F3EDFE", borderColor: "#DDD0F7" }}>의료법 준수 참고</span></div>
      <div className="ccprof"><span className="ccpi"><ClipboardList size={16} color="#7C3AED" /></span><div><b>{data.name}님과 비슷한 프로필</b><span>{data.profile} 회원들의 일반적 관리 흐름</span></div></div>
      <div className="cctl">{data.actions.map((a, i) => (<div className="cctli" key={i}><span className="ccn">{i + 1}</span><div className="ccx">{a}</div></div>))}</div>
      <div className="cctend"><Sparkles size={14} color="#16A34A" /> {data.tendency}</div>
      <div className="adcta"><button className="cbtn pri" style={{ margin: 0 }} onClick={onPlan}><HeartHandshake size={14} /> 내 케어플랜 보기</button><button className="cbtn" style={{ margin: 0 }} onClick={() => nav("checkup")}><CalendarCheck size={14} /> 검진 예약</button></div>
      <div className="aiddisc" style={{ marginTop: 10 }}><AlertTriangle size={14} /> 일반적 건강관리 경향에 대한 참고 안내이며 효과를 보장하지 않습니다. 구체적 치료·약물은 의료진과 상담하세요.</div>
    </div>
  );
}

/* ── 복원: 화상·기기·전문의 상담 컴포넌트(AIDoctorSection 삭제 시 함께 지워졌던 부분) ── */
function HelpDot() { return <span className="hdq">Q</span>; }

/* ===== 나의 주치의 — 웨어러블·홈케어기기 / 화상상담 / 전문의 1:1 ===== */
const MD_DEVICES = [
  { k: "watch", name: "스마트워치", brand: "Galaxy/Apple Watch", icon: "activity", vitals: [["심박수", "72 bpm"], ["걸음수", "8,420보"], ["수면", "6h 40m"]] },
  { k: "bp", name: "가정용 혈압계", brand: "오므론·휴비딕", icon: "heart", vitals: [["혈압", "128/82"], ["맥박", "70 bpm"]] },
  { k: "glucose", name: "혈당측정기/CGM", brand: "케어센스·덱스콤", icon: "activity", vitals: [["공복혈당", "104 mg/dL"], ["식후 2h", "142 mg/dL"]] },
  { k: "body", name: "체성분계", brand: "인바디·샤오미", icon: "monitor", vitals: [["체중", "72.4 kg"], ["체지방", "23.1%"], ["근육량", "31.2 kg"]] },
];
const MD_SPECIALISTS = [
  { id: "sp1", name: "김재현 교수", dept: "순환기내과", hosp: "서울대병원", tags: ["고혈압", "부정맥", "심부전"], rating: 4.9, exp: "23년" },
  { id: "sp2", name: "이서윤 교수", dept: "내분비내과", hosp: "세브란스병원", tags: ["당뇨", "갑상선", "골다공증"], rating: 4.8, exp: "18년" },
  { id: "sp3", name: "박준호 교수", dept: "소화기내과", hosp: "서울아산병원", tags: ["위·대장내시경", "간질환"], rating: 4.9, exp: "21년" },
  { id: "sp4", name: "정민아 교수", dept: "산부인과", hosp: "삼성서울병원", tags: ["여성암검진", "갱년기", "골반건강"], rating: 4.9, exp: "16년" },
  { id: "sp5", name: "최우성 교수", dept: "신경과", hosp: "분당서울대병원", tags: ["뇌졸중", "치매", "두통"], rating: 4.7, exp: "20년" },
  { id: "sp6", name: "한지후 교수", dept: "소아청소년과", hosp: "서울아산병원", tags: ["성장·발달", "예방접종", "소아비만"], rating: 4.8, exp: "15년" },
];
function VideoCallModal({ title, sub, onClose, msgs, onSend }) {
  const [t, setT] = useState(0); const [vin, setVin] = useState("");
  const [vidOk, setVidOk] = useState(true);
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, "0"), ss = String(t % 60).padStart(2, "0");
  /* 화상 중에도 텍스트로 대화 — 최근 대화가 자막처럼 겹쳐 보이고 입력창으로 바로 질문 */
  const chat = Array.isArray(msgs) ? msgs.filter((m) => m.kind === "text").slice(-3) : null;
  const sendV = () => { const x = vin.trim(); if (!x || !onSend) return; setVin(""); onSend(x); };
  return (
    <div className="vcall" onClick={onClose}>
      <div className="vcbox" onClick={(e) => e.stopPropagation()}>
        {vidOk && <video className="vcvid" src="data/media/tele_doctor.mp4" autoPlay loop muted playsInline onError={() => setVidOk(false)} />}
        <div className={"vcmain" + (vidOk ? " hasvid" : "")}>{!vidOk && <span className="vcav"><Stethoscope size={42} color="#fff" /></span>}<div className="vcnm">{title}</div><div className="vcsub">{sub} · 데모 영상</div><div className="vctime"><span className="vcrec" /> {mm}:{ss}</div></div>
        <div className="vcself"><HeartPulse size={18} color="#fff" /><span>나</span></div>
        {chat && chat.length > 0 && <div className="vcchat">{chat.map((m) => <div key={m.id} className={`vcmsg ${m.who}`}>{m.who === "ai" ? "👨‍⚕️ " : "🙂 "}{String(m.text).split("\n")[0].slice(0, 64)}</div>)}</div>}
        <div className="vcctrl">
          <button className="vcb" title="마이크(음성 입력)" onClick={() => { if (typeof toast === "function") toast("🎙 음성 입력(시연) — 말씀하시면 텍스트로 변환돼 함께 전달돼요"); }}><Mic size={17} /></button>
          <button className="vcb" title="화면"><MonitorSmartphone size={17} /></button>
          <button className="vcb end" onClick={onClose} title="종료"><Phone size={17} /></button>
        </div>
        {onSend && <div className="vcinput"><input value={vin} onChange={(e) => setVin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendV()} placeholder="화상 중에도 텍스트로 질문할 수 있어요" /><button className={`vcsend ${vin.trim() ? "on" : ""}`} onClick={sendV}><Send size={14} /></button></div>}
        <div className="vcnote">시연용 화상상담 화면입니다. 실제 영상 연결은 제공되지 않습니다.</div>
      </div>
    </div>
  );
}
function DeviceSheet({ onClose, onShare }) {
  const [conn, setConn] = useState({});
  const toggle = (k) => setConn((c) => ({ ...c, [k]: !c[k] }));
  const anyConn = Object.values(conn).some(Boolean);
  const ICO = { activity: Activity, heart: HeartPulse, monitor: MonitorSmartphone };
  const share = () => { const lines = MD_DEVICES.filter((d) => conn[d.k]).flatMap((d) => d.vitals.map((v) => `${v[0]} ${v[1]}`)); onShare(lines.length ? lines.join(" · ") : ""); onClose(); };
  return (
    <div className="dsheet">
      <div className="dsh"><HeartPulse size={15} color="#16A34A" /> 웨어러블·홈케어 의료기기 연결 <button onClick={onClose} aria-label="닫기"><X size={15} /></button></div>
      <div className="dslist">{MD_DEVICES.map((d) => { const Ic = ICO[d.icon] || Activity; const on = !!conn[d.k]; return (
        <div className={`drow ${on ? "on" : ""}`} key={d.k}>
          <span className="dav"><Ic size={18} color={on ? "#16A34A" : "#94A3B8"} /></span>
          <div className="dinfo"><b>{d.name}</b><span>{d.brand}</span>{on && <div className="dvit">{d.vitals.map((v, i) => <em key={i}>{v[0]} <b>{v[1]}</b></em>)}</div>}</div>
          <button className={`dconn ${on ? "on" : ""}`} onClick={() => toggle(d.k)}>{on ? "연결됨" : "연결"}</button>
        </div>
      ); })}</div>
      <button className="dshare" disabled={!anyConn} onClick={share}><Send size={14} /> 연결된 건강데이터 주치의에게 공유</button>
      <div className="dsnote">안내: 실제 기기 연동(BLE·HealthKit·Google Fit)은 향후 제공하며 수치는 예시입니다.</div>
    </div>
  );
}
const TM_STEPS = [
  { n: 1, t: "병원 참여 등록", d: "의료기관이 원격주치의로 신청 — 면허·진료과·의료진 프로필 인증 후 등록", ic: "hospital" },
  { n: 2, t: "환자 매칭", d: "지역(시·군·구)·진료과·증상·건강리포트 기반으로 우리 동네 전문의 추천", ic: "match" },
  { n: 3, t: "비대면 상담", d: "채팅·화상으로 1차 상담 — 증상·검진결과·웨어러블 측정값 공유", ic: "chat" },
  { n: 4, t: "내원 진료 연계", d: "전문의가 자기 병원 정밀검사·진료 예약으로 연결(병원이 신규 환자 유치)", ic: "visit" },
  { n: 5, t: "사후관리·리워드", d: "지속 관리·재방문·건강지갑 적립·만족도 평가로 신뢰 형성", ic: "reward" },
];
function TeleProcess() {
  const ICO = { hospital: Building2, match: Users, chat: MessageSquare, visit: CalendarCheck, reward: Coins };
  return (
    <div className="tproc">
      <div className="tproch"><BadgeCheck size={14} color="#2563EB" /> 원격주치의 제도 — 병원 참여형 비대면 진료 연계</div>
      <div className="tprocsteps">{TM_STEPS.map((s) => { const Ic = ICO[s.ic] || Stethoscope; return (
        <div className="tpstep" key={s.n}><span className="tpn">{s.n}</span><span className="tpic"><Ic size={15} color="#2563EB" /></span><div className="tpx"><b>{s.t}</b><span>{s.d}</span></div></div>
      ); })}</div>
      <div className="tprocnote"><Info size={12} /> 병원은 비대면 상담으로 신규 환자를 만나 <b>자기 병원 내원으로 연계(유치)</b>하고, 환자는 가까운 우수 전문의를 빠르게 만납니다.</div>
      {typeof TELE_FLOW !== "undefined" && (
        <div className="tpflow"><b>Hi-Fin 활용 흐름 <span>· 현행 제도와 정합하는 모델</span></b>
          <div className="tpflowc">{TELE_FLOW.map((x, i) => <React.Fragment key={x}>{i > 0 && <span className="tpar">→</span>}<em>{x}</em></React.Fragment>)}</div>
        </div>
      )}
      {typeof TELE_GLOBAL !== "undefined" && (
        <div className="tglobal">
          <b>🌍 해외 운영 사례 — 같은 모델이 이미 세계 표준</b>
          <p className="tg-head">{TELE_GLOBAL.head}</p>
          {TELE_GLOBAL.cases.map((g) => (
            <div className="tg-case" key={g.c}>
              <div className="tg-t"><em>{g.c}</em><span>{g.co}</span></div>
              <div className="tg-svc">{g.svc.map((s) => <i key={s}>{s}</i>)}</div>
              <div className="tg-flow">{g.flow.map((f, i) => <React.Fragment key={f}>{i > 0 && <span className="tpar">→</span>}<em>{f}</em></React.Fragment>)}</div>
              <div className="tg-lim">※ {g.lim}</div>
            </div>
          ))}
          <p className="tg-foot">{TELE_GLOBAL.foot}</p>
        </div>
      )}
    </div>
  );
}
function TeleCompliance() {
  const r = (typeof TELE_RULES !== "undefined") ? TELE_RULES : null;
  if (!r) return null;
  return (
    <div className="tcomp">
      <div className="tcomph"><ShieldCheck size={14} color="#16A34A" /> 비대면진료 가능 조건 공시 <span>현행 의료법 기준</span></div>
      <div className="tcstat"><Info size={12} /> {r.status}</div>
      <div className="tcp">{r.principle}</div>
      <div className="tcgrid">
        <div className="tcb ok"><b>재진 — 폭넓게 가능</b><ul>{r.revisit.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="tcb lim"><b>초진 — 제한적 허용</b><ul>{r.first.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
      <div className="tcrow"><span className="tcic"><Building2 size={13} color="#2563EB" /></span><div><b>의료기관 종별</b><p>{r.tier}</p></div></div>
      <div className="tcrow"><span className="tcic"><FileText size={13} color="#7C3AED" /></span><div><b>처방전</b><p>{r.rx}</p></div></div>
      {typeof TELE_ACTS !== "undefined" && (
        <div className="tcacts">
          <b>비대면으로 가능한 행위 <span>의료법·관련 고시 기준 · 의사의 전문적 판단 전제</span></b>
          <div className="tcactg">{TELE_ACTS.map((a) => (
            <div className={`tcact ${a.ok === "가능" ? "ok" : "lim"}`} key={a.act}><span className="tcan">{a.act}</span><span className="tcas">{a.ok}</span><span className="tcae">{a.ex}</span></div>
          ))}</div>
        </div>
      )}
      {typeof TELE_LEGAL !== "undefined" && (
        <div className="tclegal">
          <b><ShieldCheck size={13} color="#B45309" /> 사업화 법적 검토 4대 축</b>
          {TELE_LEGAL.map((l) => <div className="tclrow" key={l.law}><em>{l.law}</em><span>{l.pt}</span></div>)}
        </div>
      )}
      <div className="tcnote">※ 본 서비스의 전문의 상담은 시연용 예시이며, 실제 비대면진료는 위 제도 요건과 의료진 판단에 따라 진행됩니다. 의료인이 부적절하다고 판단하면 대면진료로 전환됩니다.</div>
    </div>
  );
}
function HospitalJoinModal({ onClose }) {
  const [hn, setHn] = useState(""); const [dp, setDp] = useState(DEPT_CATS[0].label); const [mgr, setMgr] = useState(""); const [tel, setTel] = useState("");
  const submit = () => { if (!hn.trim() || !mgr.trim()) { if (typeof toast === "function") toast("병원명과 담당자를 입력해 주세요."); return; } if (typeof toast === "function") toast(`🏥 ${hn.trim()} 원격주치의 참여 신청이 접수되었습니다. 심사 후 등록 안내드립니다.`); onClose(); };
  return (
    <div className="hjmodal" onClick={onClose}><div className="hjbox" onClick={(e) => e.stopPropagation()}>
      <div className="hjh"><Building2 size={16} color="#2563EB" /> 우리 병원 원격주치의 참여 신청 <button onClick={onClose} aria-label="닫기"><X size={16} /></button></div>
      <p className="hjp">비대면 상담으로 신규 환자를 만나 내원 진료로 연계하세요. 면허·진료과 인증 후 등록됩니다.</p>
      <div className="hjf"><label>의료기관명</label><input value={hn} onChange={(e) => setHn(e.target.value)} placeholder="예: 연세내과의원" /></div>
      <div className="hjf"><label>진료과</label><select value={dp} onChange={(e) => setDp(e.target.value)}>{DEPT_CATS.map((c) => <option key={c.key}>{c.label}</option>)}</select></div>
      <div className="hjrow"><div className="hjf"><label>담당자</label><input value={mgr} onChange={(e) => setMgr(e.target.value)} placeholder="성함" /></div><div className="hjf"><label>연락처</label><input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="전화(선택)" /></div></div>
      <button className="hjsub" onClick={submit}><BadgeCheck size={14} /> 참여 신청</button>
      <div className="hjnote">안내: 실제 심사·계약·정산은 진행되지 않습니다.</div>
    </div></div>
  );
}
/* ══ 처방 약국 — 주소 기준 최근접 자동 배정(P1~P4) + 클릭 즉시 2점 지도(M1~M4) ══ */
/* 시연 좌표: 자택(강남구) 기준 온누리 ≈150m·건강제일 ≈420m가 실제 Haversine 계산과 일치(H4: 상세 주소 비노출) */
const PH_HOME = { lat: 37.5006, lng: 127.0364, label: "자택 주소 기준" };
const PH_CUR = { lat: 37.4986, lng: 127.04, label: "현재 위치 기준" };
const PH_LIST = [
  { n: "온누리약국", lat: 37.50175, lng: 127.03695, open: true, part: true, addr: "서울 강남구 테헤란로 ○○", tel: "02-555-0001", hrs: "09:00~21:00" },
  { n: "건강제일약국", lat: 37.49895, lng: 127.04065, open: true, part: true, addr: "서울 강남구 역삼로 ○○", tel: "02-555-0002", hrs: "09:00~20:00" },
  { n: "새서울약국", lat: 37.5053, lng: 127.0325, open: false, part: false, addr: "서울 강남구 봉은사로 ○○", tel: "02-555-0003", hrs: "오늘 영업 종료" },
];
function phDist(a, b) { const R = 6371000, r = Math.PI / 180; const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r; const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2); return Math.round(2 * R * Math.asin(Math.sqrt(s))); }
function phWalk(d) { return Math.max(1, Math.round(d / 80)); }
function phRank(pt) { return PH_LIST.map((p) => ({ ...p, d: phDist(pt, p) })).sort((a, b) => a.d - b.d || (b.open - a.open) || (b.part - a.part)); }
/* M2·M3 — 자택 핀+배정 약국 핀+도보 경로선 2점 지도, 핀 탭 시 하단 시트(확정·배송·길안내) */
function PharmAssignMap({ base, target, list, onConfirm }) {
  const ref = useRef(null); const mapRef = useRef(null); const layRef = useRef(null);
  const [sheet, setSheet] = useState(target);
  useEffect(() => { setSheet(target); }, [target && target.n]);
  useEffect(() => {
    if (typeof L === "undefined" || !ref.current || !target) return;
    if (!mapRef.current) { mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([target.lat, target.lng], 16); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(mapRef.current); }
    const map = mapRef.current;
    if (layRef.current) map.removeLayer(layRef.current);
    const g = L.layerGroup().addTo(map); layRef.current = g;
    L.marker([base.lat, base.lng], { icon: L.divIcon({ className: "", html: '<div class="ph-homepin">🏠</div>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(g);
    list.forEach((p) => {
      L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="ph-pin${p.n === target.n ? " on" : ""}">💊<span>${p.n}</span></div>`, iconSize: [10, 10], iconAnchor: [5, 5] }) }).addTo(g).on("click", () => setSheet(p));
    });
    L.polyline([[base.lat, base.lng], [target.lat, target.lng]], { color: "#2563EB", weight: 3, dashArray: "7 7" }).addTo(g);
    map.flyTo([target.lat, target.lng], 16, { duration: .5 });
    setTimeout(() => { try { map.invalidateSize(); map.flyTo([target.lat, target.lng], 16, { duration: .3 }); } catch (e) {} }, 250);
  }, [base && base.label, target && target.n]);
  if (!target) return null;
  const s = sheet || target; const d = phDist(base, s);
  return (
    <div className="phmap">
      <div ref={ref} className="phmap-c" />
      <div className="phsheet">
        <b>💊 {s.n} {s.part && <i className="ph-vf">위변조 없음 ✓ 제휴</i>}</b>
        <span>{s.addr} · {s.hrs} · {s.tel}</span>
        <em>{base.label} · {d}m · 도보 {phWalk(d)}분 {s.open ? "· 영업중" : "· 영업 종료"}</em>
        <div className="phsheet-b">
          <button className="pri" onClick={() => onConfirm(s.n, "방문")}>방문 수령 확정</button>
          <button onClick={() => onConfirm(s.n, "배송")}>배송 수령</button>
          <a href={kakaoHref(s.n, s.lat, s.lng)} target="_blank" rel="noreferrer">🚕 길안내</a>
        </div>
      </div>
    </div>
  );
}
/* P1 — "고르세요"가 아니라 "배정해 드렸어요": 기준점 토글·대안 병기·클릭 즉시 지도 포커스 */
function PharmPickCard({ onPick }) {
  const [base, setBase] = useState("home");
  const [showMap, setShowMap] = useState(false);
  const [focus, setFocus] = useState(null);
  const pt = base === "home" ? PH_HOME : PH_CUR;
  const ranked = phRank(pt);
  const assigned = ranked.find((p) => p.open) || ranked[0];
  const skipped = ranked[0].open ? null : ranked[0];
  const others = ranked.filter((p) => p.n !== assigned.n);
  const focusPharm = (p) => { setFocus(p); setShowMap(true); };
  return (
    <div className="pharmpick wide">
      <div className="pp-hd">🏪 수령 약국 배정 <span>처방전은 선택한 약국으로만 암호화 전송돼요 ✓</span></div>
      <div className="ph-base">
        <button className={base === "home" ? "on" : ""} onClick={() => { setBase("home"); setFocus(null); }}>🏠 자택 주소 기준</button>
        <button className={base === "cur" ? "on" : ""} onClick={() => { setBase("cur"); setFocus(null); }}>📍 현재 위치 기준</button>
        <i>⚠ 시연용 예시 데이터</i>
      </div>
      <div className="ph-assign">
        <b>{assigned.n} <em className="asg">배정</em> {assigned.part && <em className="vf">위변조 없음 ✓ 제휴</em>}</b>
        <span>{pt.label} · {assigned.d}m · 도보 {phWalk(assigned.d)}분 · {assigned.open ? "영업중" : "영업 종료"}</span>
        <p>{pt.label.replace(" 기준", "")}에서 가장 가까운 약국으로 자동 배정했어요 — 변경하시려면 아래 다른 약국을 누르세요.</p>
        {skipped && <p className="ph-skip">※ 최근접 {skipped.n}({skipped.d}m)은 지금 영업 종료라, 영업중인 약국으로 배정했어요.</p>}
        <div className="ph-btns">
          <button className="pri" onClick={() => onPick(assigned.n, "방문")}>방문 수령 확정</button>
          <button onClick={() => onPick(assigned.n, "배송")}>배송 수령</button>
          <button onClick={() => focusPharm(assigned)}>🗺 지도</button>
          <a href={kakaoHref(assigned.n, assigned.lat, assigned.lng)} target="_blank" rel="noreferrer">🚕 길안내</a>
        </div>
      </div>
      {others.map((p) => (
        <div className={`pp-row ${!p.open ? "closed" : ""}`} key={p.n} onClick={() => focusPharm(p)}>
          <b>{p.n}</b><span>{p.d}m · 도보 {phWalk(p.d)}분 {p.open ? "· 영업중" : "· 영업 종료"}</span>
          <button onClick={(e) => { e.stopPropagation(); onPick(p.n, "방문"); }}>방문 수령</button>
          <button className="dv" onClick={(e) => { e.stopPropagation(); onPick(p.n, "배송"); }}>배송 수령</button>
        </div>
      ))}
      {showMap && <PharmAssignMap base={pt} target={focus || assigned} list={ranked} onConfirm={onPick} />}
      {!showMap && <button className="pp-map" onClick={() => focusPharm(assigned)}>🗺 지도에서 위치 보기 — 자택 핀 + 배정 약국 핀 + 도보 경로</button>}
    </div>
  );
}
function SpecialistChat() {
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("강남구");
  const [deptKey, setDeptKey] = useState(() => (typeof tmDeptForMember === "function" ? tmDeptForMember() : "fm"));
  const [showProc, setShowProc] = useState(false); const [showRule, setShowRule] = useState(false); const [join, setJoin] = useState(false);
  const [sel, setSel] = useState(null); const [booked, setBooked] = useState(false); const [visit, setVisit] = useState("재진");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState(""); const [typing, setTyping] = useState(false);
  const [plus, setPlus] = useState(false);
  /* 통합 상담(UnifiedConsult) — 화상+텍스트 한 화면: session(상담 시작됨)·vmode(null=텍스트만/split=기본/full=확대/pip=축소)·camOff(음성만) */
  const [session, setSession] = useState(false);
  const [vmode, setVmode] = useState(null);
  const [camOff, setCamOff] = useState(false);
  const [vidErr, setVidErr] = useState(false);
  const [lawOpen, setLawOpen] = useState(false);
  const [csEnded, setCsEnded] = useState(false);
  const fileRef = useRef(null); const endRef = useRef(null);
  const vmodeRef = useRef(null); useEffect(() => { vmodeRef.current = vmode; }, [vmode]);
  const kbAutoRef = useRef(null);
  /* M1: 키보드가 올라오면 화상은 자동 PIP로 축소, 내려가면 원복(visualViewport) */
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const f = () => { try { const kb = window.innerHeight - vv.height; if (kb > 120) { if ((vmodeRef.current === "split" || vmodeRef.current === "full") && !kbAutoRef.current) { kbAutoRef.current = vmodeRef.current; setVmode("pip"); } } else if (kbAutoRef.current) { setVmode(kbAutoRef.current); kbAutoRef.current = null; } } catch (e) {} };
    vv.addEventListener("resize", f); return () => vv.removeEventListener("resize", f);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  const list = (typeof genSpecialists === "function") ? genSpecialists(sido, sigungu, deptKey) : [];
  const sigus = (typeof REGION_KB !== "undefined" && REGION_KB[sido]) || [];
  const onSido = (s) => { setSido(s); const arr = REGION_KB[s] || []; setSigungu(arr[0] || ""); };
  /* Phase 6 — AI 예진 요약(I2-1): 하이가 검진·리포트·RPM을 정리해 의사에게 먼저 전달(7분 진료를 30분 밀도로) */
  const pick = (s) => {
    setSel(s); setBooked(false);
    let brief = null;
    try {
      const m = (typeof _member === "function") ? _member() : null;
      const R = (m && typeof demoReport === "function") ? demoReport(m) : null;
      if (m && R) {
        brief = { name: m.name, bio: R.bio, worst: (R.worstNames || []).join("·"), risk: `암위험 ${R.cancerTotal}등급(${R.evalLabel})`, hr: (R.hr || []).join("·"), rpm: (typeof window !== "undefined" && window._teleRPM) || null };
        try { vaultAccessLog(anonToken(m), `${s.name}(${s.hosp})`, "AI 예진 요약 열람(진료 목적 · 가명 요약만)"); } catch (e) {}
      }
    } catch (e) {}
    try { if (typeof window !== "undefined") window._teleRPM = null; } catch (e) {}
    setMsgs([
      ...(brief ? [{ id: ++UID, who: "ai", kind: "brief", brief, time: now() }] : []),
      { id: ++UID, who: "ai", kind: "text", text: `안녕하세요, ${s.sigungu} ${s.hosp} ${s.dept} ${s.name}입니다.${brief ? " 하이가 정리한 예진 요약을 먼저 확인했습니다 — 핵심만 여쭤볼게요." : " 비대면으로 먼저 살펴드리고, 필요하면 저희 병원 내원 진료로 연계해 드릴게요."} 어떤 점이 궁금하신가요?`, first: true, time: now() },
    ]);
  };
  const reply = () => { if (!sel) return; const canned = `말씀 주신 내용 잘 확인했습니다. ${sel.dept} 관점에서는 ${sel.tags[0]} 관련 정기적 관찰과 생활관리가 우선이며, 필요 시 정밀검사를 권합니다. 정확한 진단·처방은 화상상담 또는 ${sel.hosp} 내원 진료로 도와드리겠습니다.`; setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: canned, first: true, time: now() }]); }, 1300); };
  const send = (textArg) => { const text = (textArg ?? input).trim(); if (!text || !sel) return; setInput(""); setPlus(false); setMsgs((m) => [...m, { id: ++UID, who: "me", kind: "text", text, time: now() }]); reply(); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const isImg = /^image\//.test(f.type); const rd = new FileReader(); rd.onload = () => { setMsgs((m) => [...m, isImg ? { id: ++UID, who: "me", kind: "image", src: rd.result, time: now() } : { id: ++UID, who: "me", kind: "file", text: f.name, time: now() }]); reply(); }; rd.readAsDataURL(f); e.target.value = ""; setPlus(false); };
  const book = () => { if (booked || !sel) return; setBooked(true); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `✅ ${sel.hosp}(${sel.sigungu}) 원격진료 상담이 접수되었습니다.\n현재는 내원 예약 목적의 상담만 가능해요 — 상담 내역과 첨부 자료가 ${sel.name}께 전달되며, 방문일에 정밀검사·진료로 연계됩니다.\n비대면진료 제도화 법령이 시행되면 같은 접수 그대로 진료·처방까지 원격으로 진행되고, ${(typeof _member === "function" && _member()) ? _member().name : "회원"}님은 우선 연결 대상으로 등록돼요. 방문·진료 시 건강지갑 적립도 함께 제공됩니다.`, first: true, time: now() }]); if (typeof toast === "function") toast(`🏥 ${sel.hosp} 원격진료 상담 접수(내원 연계) · 상담내역 전달`); };
  /* U1·U4 — 원격상담 시작: 접수는 별도 화면 없이 스트림 카드로, 화상은 선택(나중에 '화상 켜기'로 승격) */
  const startConsult = (withVideo) => {
    if (!sel) return;
    if (!session) {
      setSession(true); setCsEnded(false);
      setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `🩺 원격상담이 시작됐어요 — 화상과 텍스트를 한 화면에서 함께 쓸 수 있어요. 말로 하셔도 되고, 의사가 글로 남긴 안내는 통화 중에도 말풍선으로 보여요.\n(현재는 내원 예약 목적 상담 — 법 시행 즉시 이 화면 그대로 진료로 전환됩니다)`, first: true, time: now() }]);
    }
    if (withVideo) { setVmode("split"); setCamOff(false); setVidErr(false); }
    if (typeof toast === "function") toast(withVideo ? "📹 화상 연결(시연) — 텍스트 입력도 계속 열려 있어요" : "💬 텍스트 상담 시작 — 언제든 '화상 켜기'로 승격돼요");
  };
  /* A3 — 상담 종료: 하이 요약 카드 자동 생성 + 2세대 자산 편입(위변조 없음 ✓) */
  const endConsult = () => {
    setVmode(null); kbAutoRef.current = null;
    if (csEnded || !sel) return; setCsEnded(true);
    let hash = null;
    try { const m2 = (typeof _member === "function") ? _member() : null; if (m2) { const tk = anonToken(m2); const b = chainAppend({ type: "record", token: tk, note: `원격상담 요약(${sel.hosp} ${sel.name}) — 2세대 분석 자산 편입` }); hash = b && b.hash; vaultAccessLog(tk, "member", "원격상담 종료 — 하이 요약 생성·자산 편입"); } } catch (e) {}
    setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "hisum", hisum: { dr: `${sel.name} (${sel.hosp})`, tips: `${sel.tags[0]} 관련 생활관리 유지 · 이상 증상 시 즉시 재상담`, next: "2주 후 재측정 리마인드 · 필요 시 내원 정밀검사 연계(하이가 챙겨드려요)", hash }, time: now() }]);
    if (typeof toast === "function") toast("🤖 하이가 상담 요약을 남겼어요 — 기록은 데이터 금고에 편입");
  };
  /* M5 — 네트워크 불안정: 영상이 끊겨도 텍스트는 유지, 재연결 안내 */
  const netNotice = () => { setVidErr(true); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: "📶 영상이 불안정해요 — 텍스트로 계속 상담할 수 있어요. 화상 영역의 '화상 재연결'을 누르면 다시 시도하고, 그동안의 채팅 기록은 그대로 보존돼요.", first: true, time: now() }]); };
  /* 하이 퍼스트: "원격상담 시작해줘" 딥링크 — 의사 선택 직후 자동 시작 */
  useEffect(() => { try { if (sel && typeof window !== "undefined" && window._teleAutoStart) { window._teleAutoStart = false; setTimeout(() => startConsult(true), 250); } } catch (e) {} }, [sel]);
  /* Phase 6 — 진료 후 팔로업(I2-5)+청구 0단계(I2-7): 처방 발행 시 전자처방전 문서·요약 자산화·자동 청구·복약 리마인드 */
  const rxIssue = () => {
    if (!sel) return;
    let clmId = null, hash = null;
    const rxNo = "RX-" + Date.now().toString(36).toUpperCase();
    const med = (typeof window !== "undefined" && window._rxMed) || "처방 의약품 — 의료인의 진료 판단에 따름";
    try { if (typeof window !== "undefined") window._rxMed = null; } catch (e) {}
    const mName = (typeof _member === "function" && _member()) ? _member().name : "회원";
    try {
      const m = (typeof _member === "function") ? _member() : null;
      if (m) {
        const tk = anonToken(m);
        const b = chainAppend({ type: "record", token: tk, note: `전자처방전 발행(${rxNo} · ${sel.hosp} ${sel.name}) — 3세대 활용 자산 편입` }); hash = b && b.hash;
        clmId = "CLM-" + Date.now().toString(36).toUpperCase();
        const l = JSON.parse(localStorage.getItem("hifin_claims") || "[]"); l.push({ id: clmId, at: Date.now(), status: "자동접수(진료 연동)" }); localStorage.setItem("hifin_claims", JSON.stringify(l));
        const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); rl.push({ id: rxNo, med, doctor: sel.name, hosp: sel.hosp, at: Date.now(), status: "발급됨(약국 미전송)" }); localStorage.setItem("hifin_rx", JSON.stringify(rl));
        localStorage.setItem("hifin_medrem", JSON.stringify({ doctor: sel.name, hosp: sel.hosp, med, at: Date.now() }));
        vaultAccessLog(tk, "member", "원격진료 완료 — 전자처방전 발행 · 요약 자산화 · 보험 청구 자동 접수");
      }
    } catch (e) {}
    setMsgs((m) => [...m,
      { id: ++UID, who: "ai", kind: "rx", rx: { no: rxNo, med, pt: mName, dr: `${sel.name} (${sel.hosp})`, date: new Date().toLocaleDateString("ko-KR"), hash }, time: now() },
      { id: ++UID, who: "ai", kind: "text", text: `💊 전자처방전을 발행했습니다. 아래에서 수령하실 약국을 선택하시면 처방전이 해당 약국으로만 암호화 전송됩니다(약사법 절차 준수).${clmId ? `\n📦 진료 요약이 3세대(활용) 자산으로 데이터 금고에 저장됐고, 보험 청구가 자동 접수됐어요(${clmId} · 서류 0장 — 청구 0단계). 복약 리마인드는 하이가 챙겨드릴게요.` : ""}`, first: true, time: now() },
      { id: ++UID, who: "ai", kind: "pharm", time: now() }]);
    if (typeof toast === "function") toast("💊 전자처방전 발행 · 요약 자산화 · 청구 자동 접수");
  };
  /* 검사 의뢰(가능행위) — 혈액검사·영상검사 의뢰서 발행 */
  const labOrder = () => {
    if (!sel) return;
    try { const m = (typeof _member === "function") ? _member() : null; if (m) vaultAccessLog(anonToken(m), `${sel.name}(${sel.hosp})`, "비대면 검사 의뢰서 발행(혈액·영상)"); } catch (e) {}
    setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `🧪 혈액검사·복부초음파 검사 의뢰서를 발행해 가까운 제휴 검진기관으로 전송했습니다. 검사 후 결과가 도착하면 하이가 알려드리고, 비대면으로 결과 설명 상담을 이어드립니다. (검사 의뢰·검사결과 설명은 비대면 가능 행위입니다)`, first: true, time: now() }]);
    if (typeof toast === "function") toast("🧪 검사 의뢰서 전송 완료");
  };
  /* 약국 선택 → 전송·접수·조제·수령 실시간 추적 체인(약사법 절차) */
  const pharmPick = (ph, mode) => {
    try { const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); if (rl.length) { rl[rl.length - 1].status = `${ph} 전송(${mode} 수령)`; rl[rl.length - 1].pharm = ph; localStorage.setItem("hifin_rx", JSON.stringify(rl)); } } catch (e) {}
    setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `📤 ${ph}(으)로 전자처방전 전송 완료 — ${mode} 수령. 처방전은 선택하신 약국으로만 암호화 전송되며, 이후 단계는 하이가 실시간으로 알려드려요.`, first: true, time: now() }]);
    if (typeof toast === "function") toast(`📤 ${ph} 처방전 전송(${mode})`);
    setTimeout(() => { setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `🏪 ${ph} 접수 완료 — 약사가 처방을 검토하고 조제를 시작했어요. (조제중)`, first: true, time: now() }]); }, 2500);
    setTimeout(() => {
      setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: mode === "배송" ? `🚚 조제 완료 · 배송 시작 — 오늘 저녁 도착 예정이에요. 수령이 확인되면 복약지도 안내와 함께 복약 리마인드를 시작할게요. (의약품 배송은 약사법 허용 범위에서 운영됩니다)` : `✅ 조제 완료 — 지금 방문하시면 수령 가능해요. 신분 확인 후 약사의 복약지도와 함께 수령하세요. 수령 확인 후 복약 리마인드를 시작할게요.`, first: true, time: now() }]);
      try { const rl = JSON.parse(localStorage.getItem("hifin_rx") || "[]"); if (rl.length) { rl[rl.length - 1].status = mode === "배송" ? "조제 완료 · 배송중" : "조제 완료 · 방문 수령 대기"; localStorage.setItem("hifin_rx", JSON.stringify(rl)); } } catch (e) {}
      if (typeof toast === "function") toast(mode === "배송" ? "🚚 조제 완료 · 배송 시작" : "✅ 조제 완료 · 수령 가능");
    }, 5500);
  };
  /* 처방 가능 대표 사례 시나리오 — 가이드 진료 체험 */
  const runCase = (c) => {
    if (!sel) return;
    try { if (typeof window !== "undefined") window._rxMed = c.med || null; } catch (e) {}
    setMsgs((m) => [...m, { id: ++UID, who: "me", kind: "text", text: c.me, time: now() }]);
    setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: c.dr, first: true, time: now() }]); setTimeout(() => { if (c.act === "lab") labOrder(); else rxIssue(); }, 900); }, 1300);
  };
  const tier = sel ? ((typeof tmHospTier === "function") ? tmHospTier(sel.hosp) : "의원급") : "";
  const eligMsg = visit === "재진" ? "재진·만성질환 관리·경과관찰은 비대면 상담이 폭넓게 가능합니다." : (tier === "병원급" ? "병원급 초진 비대면은 희귀질환·제1형 당뇨·수술 후 경과관찰 등에 한해 허용됩니다." : "초진은 의료취약지·거동불편·장애·희귀질환 등에 한해 제한적으로 허용되며, 해당하지 않으면 대면진료로 안내됩니다.");
  if (!sel) {
    const cat = DEPT_CATS.find((c) => c.key === deptKey) || DEPT_CATS[0];
    return (
      <div className="spwrap">
        <div className="splbl"><Stethoscope size={15} color="#2563EB" /> 원격주치의 — 전국 비대면 전문의 상담 <span>· 지역·진료과로 우리 동네 전문의를 찾으세요</span>
          <button className="tmproc" onClick={() => { setShowProc((v) => !v); setShowRule(false); }}><Info size={12} /> 제도 안내</button>
          <button className="tmproc rule" onClick={() => { setShowRule((v) => !v); setShowProc(false); }}><ShieldCheck size={12} /> 비대면 가능 조건</button></div>
        {showProc && <TeleProcess />}
        {showRule && <TeleCompliance />}
        <div className="tmfilter">
          <div className="tmf"><label>지역 (시·도)</label><select value={sido} onChange={(e) => onSido(e.target.value)}>{(typeof REGION_KB !== "undefined" ? Object.keys(REGION_KB) : []).map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="tmf"><label>시·군·구</label><select value={sigungu} onChange={(e) => setSigungu(e.target.value)}>{sigus.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="tmcats">{DEPT_CATS.map((c) => <button key={c.key} className={deptKey === c.key ? "on" : ""} onClick={() => setDeptKey(c.key)}>{c.label}</button>)}</div>
        <div className="tmcount"><b>{tmSidoShort(sido)} {sigungu}</b> · {cat.label} · 원격주치의 {list.length}명 <span style={{ color: "#16A34A", fontWeight: 800 }}>· 지금 연결 가능 {list.filter((s) => (parseInt(String(s.id).replace(/\D/g, "") || "0", 10) % 3) !== 0).length}명 · 평균 대기 2분</span></div>
        <div className="splist">{list.map((s) => (
          <div className="dspcard" key={s.id} onClick={() => pick(s)}>
            <span className="spav"><Stethoscope size={20} color="#2563EB" /></span>
            <div className="spinfo"><b>{s.name} <small>{s.dept}</small></b><span>{s.hosp} · {tmSidoShort(s.sido)} {s.sigungu} · 경력 {s.exp}</span>
              <div className="sptags">{s.tags.map((t) => <em key={t}>{t}</em>)}<em className={tmHospTier(s.hosp) === "병원급" ? "tmtier hosp" : "tmtier"}>{tmHospTier(s.hosp)}</em><em className="tmtele">비대면 가능</em>{s.sameDay && <em className="tmday">당일</em>}{(parseInt(String(s.id).replace(/\D/g, "") || "0", 10) % 3) !== 0 && <em className="tmnow">● 지금 연결 가능</em>}</div></div>
            <div className="spmeta"><span className="sprate"><Star size={11} /> {s.rating} <small>({s.reviews})</small></span><span className="tmfee">상담 {(s.fee / 10000).toLocaleString()}만원</span><button className="spgo">상담</button></div>
          </div>
        ))}</div>
        <button className="tmjoin" onClick={() => setJoin(true)}><Building2 size={15} /> 우리 병원도 원격주치의로 참여하기</button>
        {join && <HospitalJoinModal onClose={() => setJoin(false)} />}
        <div className="kt-disc">안내: 전국 전문의는 시연용 가상 데이터이며 응답은 예시입니다. 실제 진단·처방은 의료기관에서 받으세요. 응급 시 119.</div>
      </div>
    );
  }
  return (
    <div className={`kt ktuni ${vmode || "novid"}`}>
      <div className="kt-head"><ArrowLeft size={20} className="ic" onClick={() => setSel(null)} style={{ cursor: "pointer" }} /><span className="av-ai" style={{ width: 32, height: 32, background: "#EAF0FE" }}><Stethoscope size={18} color="#2563EB" /></span>
        <div style={{ flex: 1 }}><div className="nm">{sel.name} · {sel.dept}</div><div className="st"><span className="dot" /> {sel.hosp} · {tmSidoShort(sel.sido)} {sel.sigungu}</div></div>
        <button className="ktib" onClick={() => (vmode ? setVmode(null) : startConsult(true))} title={vmode ? "화상 끄기" : "화상 켜기"}><MonitorSmartphone size={18} /></button></div>
      <div className="tmcta">
        <div className="tmctat"><Building2 size={14} color="#2563EB" /> <b>{sel.hosp}</b> 원격주치의 · {tmSidoShort(sel.sido)} {sel.sigungu}</div>
        <p>화상·음성·텍스트를 한 화면에서 — 접수·예진 전달·연결이 이 화면 안에서 끝나요. 필요 시 우리 병원 정밀검사·진료로 연계해 드려요.</p>
        <div className="tmctab">
          <button className={`pri ${session ? "done" : ""}`} onClick={() => startConsult(true)}><MonitorSmartphone size={13} /> {session ? (vmode ? "원격상담 진행 중 ✓" : "화상 다시 켜기") : "원격상담 시작"}</button>
          {!session && <button onClick={() => startConsult(false)}>💬 텍스트로만 시작</button>}
          {session && <button className={booked ? "done" : ""} onClick={book}><CalendarCheck size={13} /> {booked ? "내원 연계 접수됨 ✓" : "내원 진료 연계"}</button>}
        </div>
      </div>
      {typeof TELE_LAW_NOTICE !== "undefined" && (
        <div className={`telaw fold ${lawOpen ? "open" : ""}`} onClick={() => setLawOpen(!lawOpen)} role="button">
          <b>⚖️ 원격진료 시스템 완비 — 법 시행 즉시 개시 <i className="telaw-tg">{lawOpen ? "▲ 접기" : "▼ 자세히"}</i></b>
          {lawOpen ? <p>{TELE_LAW_NOTICE.on} {TELE_LAW_NOTICE.wait} <em>{TELE_LAW_NOTICE.now}</em></p> : <span className="telaw-min">{TELE_LAW_NOTICE.now}</span>}
        </div>
      )}
      <div className="teli">
        <span className="telil"><ShieldCheck size={12} /> 비대면 진료유형</span>
        <button className={visit === "재진" ? "on" : ""} onClick={() => setVisit("재진")}>재진·만성질환</button>
        <button className={visit === "초진" ? "on" : ""} onClick={() => setVisit("초진")}>초진</button>
        <span className={`telim ${visit === "초진" ? "lim" : ""}`}>{tier} · {eligMsg}</span>
      </div>
      {vmode && (
        <div className={`uvc ${vmode} ${camOff ? "cam0" : ""}`}>
          {!camOff && !vidErr ? (
            <video src="data/media/tele_doctor.mp4" autoPlay loop muted playsInline onError={netNotice} />
          ) : (
            <div className="uvc-audio"><span className="uvc-prof"><Stethoscope size={28} color="#fff" /></span><div className="uvc-wave"><i /><i /><i /><i /><i /></div><em>{vidErr ? "영상 불안정 — 음성·텍스트로 계속 상담 중" : "카메라 꺼짐 — 음성 상담 중"}</em></div>
          )}
          <div className="uvc-ov"><b>{sel.name} · {sel.dept}</b><span>{sel.hosp} · 의료인 면허 확인 ✓</span><em>🔒 이 상담은 안전하게 암호화됩니다 ✓ · ⚠ 시연용</em></div>
          <div className="uvc-self"><video src="data/media/tele_pt_male.mp4" autoPlay loop muted playsInline /><span>나</span></div>
          {vmode === "full" && <div className="uvc-cap">{msgs.filter((m) => m.kind === "text").slice(-2).map((m) => <div key={m.id} className={`uvc-c ${m.who}`}>{m.who === "me" ? "🙂 " : "👨‍⚕️ "}{String(m.text).split("\n")[0].slice(0, 56)}</div>)}</div>}
          <div className="uvc-ctl">
            <button onClick={() => { if (vidErr) { setVidErr(false); setCamOff(false); } else setCamOff(!camOff); }}>{vidErr ? "📷 화상 재연결" : camOff ? "📷 켜기" : "📷 끄기"}</button>
            <button onClick={() => setVmode(vmode === "full" ? "split" : "full")}>{vmode === "full" ? "▣ 기본" : "⛶ 확대"}</button>
            <button onClick={() => setVmode(vmode === "pip" ? "split" : "pip")}>{vmode === "pip" ? "▣ 기본" : "◱ 축소"}</button>
            <button className="end" onClick={endConsult}>종료</button>
          </div>
        </div>
      )}
      <div className="kt-body">
        <div className="daypill"><Stethoscope size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> 원격주치의 1:1 상담 · 참고용</div>
        {msgs.map((m) => (
          <div className={`msg ${m.who}`} key={m.id}>
            {m.who === "ai" && <span className="av-ai" style={{ background: "#EAF0FE" }}>{m.first ? <Stethoscope size={16} color="#2563EB" /> : null}</span>}
            <div className="col">{m.who === "ai" && m.first && <div className="who">{sel.name}</div>}
              <div className="bubble-row">{m.kind === "brief" ? (
                <div className="prebrief">
                  <div className="pb-hd">🤖 AI 예진 요약 — {sel ? sel.name : "의사"}께 전달됨 <span className="pb-flow">접수 ✓ → 예진 전달 ✓ → 연결됨 · 대기 0분</span></div>
                  <div className="pb-rows">
                    <span><b>{m.brief.name}</b> · 생체나이 {m.brief.bio}세</span>
                    {m.brief.worst && <span>주의 장기: {m.brief.worst}</span>}
                    <span>{m.brief.risk}</span>
                    {m.brief.hr && <span>고위험: {m.brief.hr}</span>}
                    {m.brief.rpm && <span className="pb-rpm">📈 RPM: {m.brief.rpm}</span>}
                  </div>
                  <div className="pb-note">검진·리포트 기반 가명 요약만 전달 · 열람 기록은 데이터 금고 접근 이력에 남아요</div>
                </div>
              ) : m.kind === "hisum" ? (
                <div className="hisum">
                  <div className="hs-hd">🤖 하이 상담 요약 — 종료 시 자동 생성</div>
                  <div className="hs-rows">
                    <span><i>의사 안내</i>{m.hisum.tips}</span>
                    <span><i>다음 일정</i>{m.hisum.next}</span>
                    <span><i>담당</i>{m.hisum.dr}</span>
                  </div>
                  <div className="hs-ft">진료 기록이 2세대(분석) 자산으로 데이터 금고에 편입 — 위변조 없음 ✓{m.hisum.hash ? ` · 해시 ${String(m.hisum.hash).slice(0, 12)}…` : ""}</div>
                </div>
              ) : m.kind === "rx" ? (
                <div className="rxdoc">
                  <div className="rx-hd">📄 전자처방전 <span className="rx-no">{m.rx.no}</span></div>
                  <div className="rx-rows">
                    <span><i>환자</i>{m.rx.pt}</span>
                    <span><i>발행</i>{m.rx.dr} · {m.rx.date}</span>
                    <span><i>처방</i>{m.rx.med}</span>
                    <span><i>유효기간</i>발행일로부터 3일 · 지정 약국 접수 기준</span>
                  </div>
                  <div className="rx-ft">🔗 위변조 방지 {m.rx.hash ? `해시 ${String(m.rx.hash).slice(0, 16)}…` : "해시 기록"} · 데이터 금고 저장 · 선택한 약국으로만 암호화 전송</div>
                </div>
              ) : m.kind === "pharm" ? (
                <PharmPickCard onPick={pharmPick} />
              ) : m.kind === "image" ? <img className="chatimg" src={m.src} alt="첨부" /> : m.kind === "file" ? <div className="chatfile"><Paperclip size={14} /> {m.text}</div> : <div className={`bubble ${m.who}`}>{m.who === "ai" ? <Sents text={m.text} /> : m.text}</div>}
                <div className="meta"><span>{m.time}</span></div></div></div></div>
        ))}
        {typing && <div className="msg ai"><span className="av-ai" style={{ background: "#EAF0FE" }}><Stethoscope size={16} color="#2563EB" /></span><div className="typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      {typeof TELE_CASES !== "undefined" && <div className="telcases"><span className="telml">진료 사례 체험</span>{TELE_CASES.map((c) => <button key={c.key} onClick={() => runCase(c)}>{c.label}</button>)}</div>}
      <div className="telmodes"><span className="telml">진료 방식</span><button className={!vmode ? "on" : ""} onClick={() => setVmode(null)}>💬 메시지(비동기 · 24h 내 답변)</button><button className={vmode && camOff ? "on" : ""} onClick={() => { startConsult(true); setCamOff(true); }}>🎙 음성</button><button className={vmode && !camOff ? "on" : ""} onClick={() => startConsult(true)}>📹 화상</button></div>
      <div className="quicks"><button onClick={() => (vmode ? setVmode(null) : startConsult(true))}>📹 {vmode ? "화상 끄기" : "화상 켜기"}</button><button onClick={book}>🏥 내원 연계</button><button onClick={rxIssue}>💊 처방전 발행</button><button onClick={() => send("검진 결과를 상담받고 싶어요")}>검진 결과 상담</button></div>
      <div className="kt-input">
        {plus && (<div className="plus-sheet"><button onClick={() => fileRef.current && fileRef.current.click()}><ImageIcon size={20} color="#2563EB" />사진·검진결과</button><button onClick={() => fileRef.current && fileRef.current.click()}><Paperclip size={20} color="#16A34A" />파일</button><button onClick={() => { setPlus(false); startConsult(true); }}><MonitorSmartphone size={20} color="#7C3AED" />화상 켜기</button></div>)}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onFile} />
        <button className="pl" onClick={() => setPlus((p) => !p)}>{plus ? <X size={22} /> : <Plus size={22} />}</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={vmode ? "화상 중에도 텍스트로 질문할 수 있어요" : "전문의에게 메시지를 입력하세요"} />
        <button className="mic" onClick={() => { if (typeof toast === "function") toast("🎤 음성 입력(시연) — 말씀하시면 텍스트로 변환돼 입력창에 들어가요"); }} title="음성으로 입력"><Mic size={18} /></button>
        <button className={`send ${input.trim() ? "on" : "off"}`} onClick={() => send()}><Send size={16} /></button>
      </div>
      <div className="kt-disc">원격주치의 상담 · 참고용이며 실제 진단·처방을 대체하지 않습니다. 응급 시 119.</div>
    </div>
  );
}

function AIDoctor() {
  /* 하이 딥링크: teleprep 툴이 window._teleGoSpecialist를 세우면 전문의 상담 탭으로 바로 진입 */
  const [thread, setThread] = useState(() => { try { if (typeof window !== "undefined" && window._teleGoSpecialist) { window._teleGoSpecialist = false; return "specialist"; } } catch (e) {} return "ai"; });
  useEffect(() => { const f = () => setThread("specialist"); window.addEventListener("telego", f); return () => window.removeEventListener("telego", f); }, []);
  const tabsRef = useRef(null);
  const goThread = (t) => { setThread(t); setTimeout(() => { try { tabsRef.current && tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {} }, 60); };
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="ai" /></span>
        <div><div className="scaffold stitle" style={{ fontSize: 22, fontWeight: 800 }}>나의 주치의</div>
          <div className="ssub" style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}><Info size={13} /> 24시간 AI 주치의 + 전문의 1:1 상담 · 텍스트·음성·화상 · 파일첨부 · 웨어러블/홈케어기기 연동 · 진단이 아닌 참고용 안내</div></div></div>
      <div className="aitabs" ref={tabsRef} style={{ marginTop: 18 }}>
        <div className={`aitab ${thread === "ai" ? "on" : ""}`} onClick={() => setThread("ai")}><Bot size={15} /> AI 주치의 · 24시간</div>
        <div className={`aitab ${thread === "specialist" ? "on" : ""}`} onClick={() => setThread("specialist")}><Stethoscope size={15} /> 전문의 상담</div>
      </div>
      {thread === "specialist" ? <SpecialistChat /> : <Chat />}
    </div>
  );
}
/* ====================== AI Super Agent — 최상위 고객 전담 관문 ====================== */
function SuperAgentSection({ onGo }) {
  const go = onGo || ((s) => { if (typeof nav === "function") nav(s); });
  const GRID = (typeof AGENT_NAV !== "undefined") ? AGENT_NAV : [];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico" style={{ background: "linear-gradient(135deg,#6D28D9,#7C3AED)" }}><SecIcon k="ai" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>하이</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}><Info size={13} /> {aiWho()}님 고객 전담 · 모든 서비스를 한 곳에서 안내 — 아래 버튼을 고르거나 무엇이든 물어보세요(텍스트·음성)</div></div></div>
      <div className="agentgrid">
        {GRID.map((m) => (
          <button className="agentcard" key={m[1]} onClick={() => go(m[1])}>
            <span className="ac-ic">{m[0].split(" ")[0]}</span>
            <span className="ac-t">{m[0].replace(/^\S+\s/, "")}</span>
            <span className="ac-s">{(m[2] || "").replace(/해 드려요\.?$|하실 수 있어요\.?$/, "")}</span>
          </button>
        ))}
      </div>
      <Chat superAgent />
    </div>
  );
}

let UID = 100;
const now = () => { const d = new Date(); let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0"); const ap = h < 12 ? "오전" : "오후"; h = h % 12 || 12; return `${ap} ${h}:${m}`; };
/* 채팅 액션 버튼 → 섹션 네비게이션 매핑 */
const ACTION_NAV = { "🔬 추가 검진 예약": "checkup", "🏥 병원·진료 안내": "hospital", "💊 영양 및 홈케어의료기": "shop", "🥗 건강 식단 안내": "shop", "간편단기특화보험 보기": "insurance" };
/* Super Agent → 검진 화면 AI 주치의 핸드오프 씨앗(건강 질문을 넘겨받아 이어서 상담) */
let _doctorSeed = null;
const DOCTOR_HANDOFF = "🩺 검진 화면에서 이어 상담";
/* 보험·보장 문의는 약관 학습 보험 AI 상담사(보험·치료비 › AI보험상담)로 연결 */
const INS_HANDOFF = "🛡️ 보험 화면에서 이어서 봐드릴게요";
function insHandoff() {
  return { bubbles: [
    { kind: "text", text: "**제가 보험 내용도 이어서 봐드릴게요.** 보험·치료비 화면에서 지금 질문 그대로, 성래님 데이터 기준으로 자세히 분석해 드려요." },
    { kind: "card", card: { title: "🛡️ 하이의 보험 분석", items: ["질환·검진 위험과 연계한 보장 공백·본인부담·세대 전환 분석", "실손 세대·중대질환 진단비 안내(정보 제공)", "청약·가입은 정식 라이선스 채널(GA)로 안내"], buttons: [INS_HANDOFF] } },
  ], quicks: [INS_HANDOFF, "내 리포트 요약"] };
}
/* ===== AI Super Agent — 사이트 전 섹션을 연결하는 고객 전담 오케스트레이터 =====
   [라벨, 섹션키, 요약, 인식 키워드[]] — 버튼 이동·자연어 라우팅·연관 안내에 공통 사용 */
const AGENT_NAV = [
  ["🩺 건강 상담 (AI 주치의)", "ai", "증상·질환·검사·치료·생활관리를 AI 주치의가 24시간 상담해 드려요.", ["건강 상담", "주치의", "증상 상담", "질환 상담", "전문의 상담"]],
  ["📅 건강검진 예약하기", "checkup", "국가·개인·기업·특수검진 예약과 결과조회, 검진보험까지 안내해 드려요.", ["검진", "건강검진", "예약", "국가검진", "특수검진", "내시경", "검진기관", "검진센터", "검진 결과"]],
  ["🛡️ 나의 보험 알아보기", "insurance", "내 건강위험 기반 보장 분석과 가입·청구, 치료비 지원을 안내해 드려요.", ["보험", "보장", "가입", "청구", "실손", "보험금", "보험료"]],
  ["💰 나의 적립금(자산) 알아보기", "wallet", "건강활동으로 쌓인 Health Token(건강자산) 적립·사용·나눔을 확인하실 수 있어요.", ["적립금", "자산", "지갑", "포인트", "토큰", "htk", "적립", "건강자산", "리워드", "건강금융"]],
  ["🛒 건강쇼핑·AI 상담사", "shop", "영양제·건강식단·의료기기와 AI 상담사의 맞춤 추천을 안내해 드려요.", ["쇼핑", "영양제", "의료기기", "상품", "최저가", "건강기능식품", "제품 구매", "건강식단"]],
  ["🏥 병원 진료 찾기", "hospital", "증상·질환에 맞는 진료과와 가까운 병원을 찾아 안내해 드려요.", ["병원", "진료", "의원", "진료과", "전문의", "외래", "병원 찾"]],
  ["🏠 재가·돌봄 서비스", "homecare", "퇴원 후 방문간호·재활·돌봄 서비스를 매칭해 드려요.", ["재가", "돌봄", "간병", "방문간호", "요양", "방문재활", "퇴원 후"]],
  ["📋 내 건강 리포트·관리", "manage", "건강분석 리포트와 맞춤 케어플랜을 관리하실 수 있어요.", ["케어플랜", "관리 리포트", "건강관리 메뉴"]],
  ["💜 사회공헌·치료비 나눔", "social", "판매마진 기반 치료비 사각지대 나눔(어르신·장애아동) 활동을 소개해 드려요.", ["기부", "나눔", "사회공헌", "사회적기업", "치료비 나눔", "어르신 지원", "장애아동"]],
  ["🌐 온톨로지·하네스", "ontology", "플랫폼 지식 온톨로지·운영 하네스와 백서를 확인하실 수 있어요.", ["온톨로지", "하네스", "ontology", "harness", "백서", "운영시스템"]],
];
function agentNavKey(text) {
  if (!text) return null;
  for (const m of AGENT_NAV) { if (text === m[0] || text === `${m[0]} 바로가기`) return m[1]; }
  if (/바로가기|이동|가기|보러/.test(text)) {
    const bare = (l) => l.replace(/^[^가-힣a-zA-Z]+/, "").replace(/ 알아보기| 예약하기| 찾기| 서비스| 관리| 하기/g, "").trim();
    for (const m of AGENT_NAV) { const b = bare(m[0]); if (b && text.includes(b)) return m[1]; }
  }
  return null;
}
/* 정밀 인텐트 룰 — 같은 명사라도 동사(결과/조회 vs 예약/청구/가입/사용)에 따라 다른 안내로 분기.
   질문↔답변 정합성을 높이기 위한 학습 레이어(룰을 추가할수록 정교해짐). */
const CHK_RESULT = "🗂 검진 결과·사후관리 바로가기";
const AGENT_INTENTS = [
  { re: /검진.{0,6}(결과|조회|내역|기록|판정|소견|나왔|받았)|(결과|판정).{0,4}검진|검진.{0,3}봤/, sum: "받으신 건강검진 결과 조회와 사후관리(재검·추적관리)를 안내해 드려요. 상세한 항목별 분석은 ‘건강분석 리포트’에서 확인하실 수 있어요.", btns: [CHK_RESULT, "📋 내 리포트 요약"] },
  { re: /검진.{0,6}(예약|신청|접수|받고 ?싶|잡|하고 ?싶)/, sum: "국가·개인·기업·특수검진 예약을 도와드릴게요.", btns: ["📅 건강검진 예약하기 바로가기"] },
  { re: /(보험금|실손).{0,6}(청구|받|신청|서류)|청구.{0,4}(보험|방법|절차)/, sum: "실손·보험금 청구 절차와 필요 서류를 안내해 드려요.", btns: ["🛡️ 나의 보험 알아보기 바로가기"] },
  { re: /보험.{0,6}(가입|추천|보장|분석|설계|들고|알아)/, sum: "내 건강위험 기반 보장 분석과 가입을 안내해 드려요.", btns: ["🛡️ 나의 보험 알아보기 바로가기"] },
  { re: /(적립|자산|지갑|토큰|포인트|htk).{0,6}(사용|쓰|결제|어디|얼마|조회|잔액|얼만)/, sum: "적립한 Health Token(건강자산) 잔액·사용처(보험료·의료비·쇼핑)를 안내해 드려요.", btns: ["💰 나의 적립금(자산) 알아보기 바로가기"] },
  { re: /병원.{0,6}(찾|추천|어디|가까운|진료과)/, sum: "증상·질환에 맞는 진료과와 가까운 병원을 찾아 안내해 드려요.", btns: ["🏥 병원 진료 찾기 바로가기"] },
];
function superAgentRoute(text) {
  const raw = (text || "");
  // 1) 정밀 인텐트 룰 우선(동사 기반 분기)
  const it = AGENT_INTENTS.find((r) => r.re.test(raw));
  if (it) return {
    bubbles: [
      { kind: "text", text: it.sum },
      { kind: "card", card: { title: "🧭 하이 안내", items: [it.sum, "아래 버튼을 누르면 바로 이동해요."], buttons: it.btns } },
    ],
    quicks: AGENT_NAV.slice(0, 4).map((m) => m[0]),
  };
  // 2) 키워드 폴백 라우팅
  const t = raw.toLowerCase();
  const hit = AGENT_NAV.find((m) => m[3].some((k) => t.includes(k.toLowerCase())));
  if (!hit) return null;
  const [label, , sum] = hit;
  return {
    bubbles: [
      { kind: "text", text: `${sum}` },
      { kind: "card", card: { title: "🧭 하이 안내", items: [sum, "아래 버튼을 누르면 해당 서비스로 바로 이동해요."], buttons: [`${label} 바로가기`] } },
    ],
    quicks: AGENT_NAV.slice(0, 4).map((m) => m[0]),
  };
}
function agentHubCard() {
  return { title: "🧭 무엇을 도와드릴까요? — 서비스 바로가기", items: ["궁금한 건 무엇이든 물어보세요. 요약해 드리고 해당 서비스로 안내해요."], buttons: AGENT_NAV.slice(0, 6).map((m) => m[0]) };
}
/* 리포트/개인 답변 후 — 회원 병명별 후속질문 */
function reportFollowupQuestions() {
  const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  if (!m) return ["내 생체나이", "의료비 예측", "내 건강 후속조치"];
  const qs = [];
  (m.highRiskDiseases || []).forEach((dz) => qs.push(`내 ${dz} 위험은?`));
  (m.highRiskCancerTypes || []).forEach((c) => qs.push(`내 ${c} 위험은?`));
  qs.push("내 생체나이", "의료비 예측");
  return [...new Set(qs)].slice(0, 6);
}
/* 연계 액션 카드(추가검진·병원·영양제·식단) */
function memberActionCard() {
  return { compact: true, title: `${aiWho()}님 맞춤 건강 액션 — 연계 안내`, items: ["고위험 항목 추가·정밀 검진 권고", "관련 진료과·가까운 병원 안내", "영양 및 홈케어 의료기기 추천", "만성질환 관리 식단"], buttons: ["🔬 추가 검진 예약", "🏥 병원·진료 안내", "💊 영양 및 홈케어의료기", "🥗 건강 식단 안내"] };
}
/* ── 질환 상담 KB — 설명·감별(차이) → 관리 → 검진·정밀검사 추천 순 ── */
const COUNSEL_KB = [
  {
    keys: ["파킨슨", "손떨림", "서동", "안정시 진전", "도파민", "손 떨림"],
    name: "파킨슨병",
    def: "파킨슨병은 도파민을 만드는 뇌 신경세포가 서서히 줄어드는 퇴행성 뇌질환이에요. 가만히 있을 때의 손떨림(안정 시 진전)·행동이 느려짐(서동)·근육 경직·자세 불안정이 대표 증상입니다.",
    diff: ["치매(알츠하이머): ‘기억·인지’ 저하가 중심", "파킨슨병: ‘운동’ 증상(떨림·느림·경직)이 중심", "본태성 진전(단순 손떨림): 움직일 때 떨림 — 파킨슨은 가만히 있을 때 떨림+서동을 동반"],
    manage: ["신경과 진료 후 약물치료(레보도파 등)로 도파민 보충", "규칙적 유산소·스트레칭·균형 운동으로 기능 유지", "낙상 예방 환경(미끄럼 방지·손잡이)", "변비·기립성저혈압·수면 문제 함께 관리"],
    screen: ["증상이 뚜렷해지기 전 조기 발견이 핵심이에요.", "AI 뇌 MRI(흑질 나이그로좀·뉴로멜라닌 정량)나 혈액 알파-시누클레인 검사로 조기 확인 가능", "대표 정밀검사 기관: 휴런(Heuron)·피플바이오"],
  },
  {
    keys: ["알츠하이머", "치매", "기억력", "건망", "인지장애", "깜빡", "기억이"],
    name: "알츠하이머·치매",
    def: "치매는 기억·판단·언어 등 인지기능이 지속적으로 떨어져 일상생활이 어려워지는 상태예요. 알츠하이머병이 치매의 가장 흔한 원인(약 60~70%)입니다.",
    diff: ["알츠하이머 치매: 최근 기억력 저하부터 서서히 진행", "혈관성 치매: 뇌졸중·혈관 손상으로 계단식 악화", "파킨슨: 운동 증상이 먼저(인지저하는 후기에 동반 가능)"],
    manage: ["신경과·정신건강의학과 진료 및 인지기능 검사", "약물치료(콜린분해효소억제제 등)로 진행 지연", "규칙적 운동·사회활동·인지훈련", "혈압·혈당·콜레스테롤 등 혈관위험인자 관리"],
    screen: ["만 60세 이상은 치매안심센터에서 무료 조기검진을 받을 수 있어요.", "혈액 아밀로이드·타우 바이오마커로 증상 전 위험을 평가하는 정밀검사도 있음", "대표 정밀검사 기관: 피플바이오(알츠온)·퀀타매트릭스"],
  },
  {
    keys: ["뇌졸중", "중풍", "뇌경색", "뇌출혈", "반신마비", "발음이 어눌", "안면마비"],
    name: "뇌졸중",
    def: "뇌졸중은 뇌혈관이 막히거나(뇌경색) 터져(뇌출혈) 뇌가 손상되는 응급질환이에요. 갑작스러운 한쪽 마비·발음 어눌·심한 두통·어지럼이 신호입니다.",
    diff: ["뇌졸중: 갑자기(급성) 발생 — 즉시 119", "파킨슨·치매: 서서히(만성) 진행", "일과성 허혈발작(TIA): 증상이 잠깐 나타났다 사라짐 — 큰 뇌졸중의 경고"],
    manage: ["증상 발생 즉시 119 (골든타임 내 치료가 결정적)", "고혈압·당뇨·고지혈·부정맥·금연 등 위험인자 관리", "재활치료로 기능 회복", "재발 예방 약물(항혈소판·항응고) 복용"],
    screen: ["경동맥 초음파·뇌 MRI/MRA로 혈관 상태를 확인할 수 있어요.", "심뇌혈관 위험이 높으면 정기 정밀검진 권장", "가까운 신경과·검진센터에서 상담하세요"],
  },
  {
    keys: ["암검진", "암 조기", "조기암", "액체생검", "암 의심", "암 가족력", "암이 걱정", "암 무섭", "암 예방"],
    name: "암 조기검진",
    def: "암은 초기에 증상이 거의 없어 정기 검진으로 조기에 찾는 것이 생존율을 크게 높여요. 국가암검진(위·대장·간·유방·자궁경부·폐)이 기본입니다.",
    diff: ["국가암검진: 6대 암을 연령·주기별 무료/저비용 검진", "정밀 영상·내시경: 이상 소견 시 추가 확인", "액체생검(혈액 ctDNA): 혈액으로 여러 암을 조기 선별하는 첨단 방법"],
    manage: ["연령·성별·가족력에 맞는 국가암검진 주기 준수", "금연·절주·체중·식이 등 생활습관 관리", "이상 증상(체중감소·출혈·지속 통증) 시 즉시 진료"],
    screen: ["국가암검진에 더해 혈액 액체생검(ctDNA·메틸레이션)으로 여러 암을 한 번에 조기 선별하는 정밀검사도 활용할 수 있어요.", "대표 정밀검사 기관: 아이엠비디엑스(IMBDx)·지노믹트리"],
  },
];
/* ── 암 전용 상담 KB(22종) — 설명·위험인자/예방 → 증상 → 검진·진단 → 병기·치료 → 관리 → 예후 → 응급신호
   ※ 초안(전문가 검토 전제) · 국가암정보센터·국가암검진 기준 참고. 진단·처방을 대체하지 않습니다. */
const CANCER_KB = [
  { name: "췌장암", keys: ["췌장암", "이자암", "췌장 암"],
    desc: "췌장암은 소화·혈당조절을 하는 췌장에 생기는 암으로, 초기 증상이 거의 없고 주변 장기·혈관으로 잘 퍼져 조기발견이 특히 어려운 암이에요. 대부분 췌관에서 생기는 선암입니다.",
    risk: ["흡연(최대 위험인자)·과음", "만성췌장염·오래된 당뇨(특히 최근 갑자기 생긴 당뇨)", "비만·고지방식", "가족력·유전(BRCA2 등)·유전성췌장염"],
    sym: ["초기엔 대개 무증상", "명치~등으로 뻗치는 통증, 눕기 힘든 상복부 불편", "황달(눈·피부 노랑, 진한 소변, 회색 변)", "설명 안 되는 급격한 체중감소·식욕저하·새로 생긴 당뇨"],
    screen: ["국가암검진 대상은 아니며, 가족력·유전·만성췌장염 등 고위험군은 복부 MRI/MRCP·초음파내시경(EUS)로 추적", "종양표지자 CA19-9는 보조 지표", "이상 소견 시 조영증강 CT로 진단·병기 확인"],
    treat: ["수술(근치적 절제)이 유일한 완치 기회 — 초기에만 가능", "수술 전후·진행암은 항암화학요법(폴피리녹스·젬시타빈 등)·방사선", "황달·통증 완화 시술(담도 스텐트 등) 병행"],
    manage: ["금연·절주가 최우선 예방·관리", "소화효소제·혈당관리·충분한 영양(체중유지)", "통증은 참지 말고 적극 조절", "우울·불안 동반 흔함 → 심리지지 병행"],
    prog: "조기발견이 어려워 예후가 나쁜 편이지만, 초기에 수술하면 생존율이 크게 올라가요. 흡연·음주 회피와 고위험군 정밀추적이 핵심입니다.",
    red: ["황달 + 심한 상복부/등 통증·급격한 체중감소 → 즉시 진료", "고열·오한 동반 황달(담관염) → 응급"] },
  { name: "위암", keys: ["위암", "위 암", "stomach cancer"],
    desc: "위암은 위 점막에서 생기는 암으로, 우리나라에서 매우 흔해요. 헬리코박터 감염·짠 음식·흡연이 주요 원인이며, 조기위암은 내시경만으로도 완치가 가능합니다.",
    risk: ["헬리코박터 파일로리 감염", "짜고 탄 음식·훈제·가공육, 흡연·과음", "위축성위염·장상피화생, 가족력"],
    sym: ["초기엔 대개 무증상", "속쓰림·소화불량·상복부 불편", "진행 시 체중감소·빈혈·검은변·구토·삼킴곤란"],
    screen: ["국가암검진: 만 40세 이상 2년마다 위내시경(또는 위장조영)", "이상 소견 시 조직검사·복부CT로 병기 확인"],
    treat: ["조기위암: 내시경 점막하박리술(ESD)로 절제 가능", "진행위암: 위절제 수술 + 항암화학요법", "전이·재발은 표적치료·면역항암제"],
    manage: ["헬리코박터 제균, 저염·신선채소 위주 식이", "금연·절주, 규칙적 식사", "수술 후 소량씩 자주 먹기(덤핑 예방)"],
    prog: "국가검진 덕에 조기 발견이 많아 치료 성적이 좋은 편이에요. 40세부터 2년마다 위내시경이 핵심입니다.",
    red: ["토혈·흑색변·삼킴곤란·급격한 체중감소 → 진료"] },
  { name: "대장암", keys: ["대장암", "결장암", "직장암", "대장 암", "colon cancer"],
    desc: "대장암은 대장(결장·직장) 점막의 선종(용종)이 암으로 진행하는 경우가 많아, 용종 단계에서 제거하면 예방이 가능한 대표적 암이에요.",
    risk: ["붉은 고기·가공육·고지방·저섬유 식이, 비만·운동부족", "음주·흡연, 가족력·유전(린치증후군·가족성용종증)", "염증성장질환(궤양성대장염·크론병)"],
    sym: ["초기엔 대개 무증상", "혈변·검은변, 배변습관 변화(가늘어짐·변비·설사 반복)", "복통·복부팽만·빈혈·체중감소"],
    screen: ["국가암검진: 만 50세 이상 1년마다 분변잠혈검사 → 양성 시 대장내시경", "가족력 등 고위험군은 더 이른 나이부터 대장내시경"],
    treat: ["용종·조기암: 내시경 절제", "진행암: 수술 + 항암화학요법(±방사선, 직장암)", "전이는 표적치료·면역항암제"],
    manage: ["섬유질(채소·통곡)↑, 붉은/가공육↓, 규칙적 운동·체중관리", "금연·절주", "정기 대장내시경으로 용종 추적"],
    prog: "용종 단계 제거로 예방 가능하고 조기 치료 성적이 우수해요. 50세부터 분변검사, 고위험군은 대장내시경이 핵심입니다.",
    red: ["지속 혈변·심한 복통·구토(장폐색 의심) → 응급"] },
  { name: "간암", keys: ["간암", "간세포암", "간 암", "liver cancer", "hcc"],
    desc: "간암(간세포암)은 대부분 만성 B·C형 간염이나 간경변을 배경으로 생겨요. 고위험군을 정기 추적하면 조기에 발견해 치료할 수 있습니다.",
    risk: ["만성 B형·C형 간염, 간경변", "과음·알코올간질환, 지방간(대사증후군)", "아플라톡신(곰팡이 독소)"],
    sym: ["초기엔 대개 무증상", "진행 시 오른쪽 윗배 통증·덩어리·복부팽만(복수)", "황달·체중감소·피로"],
    screen: ["국가암검진: 만 40세 이상 고위험군(간경변·B/C형 간염 보유자) 6개월마다 간초음파 + 혈액 AFP", "이상 시 조영증강 CT/MRI로 진단"],
    treat: ["초기: 수술절제·간이식·고주파열치료(RFA)", "중기: 경동맥화학색전술(TACE)", "진행: 표적치료·면역항암제"],
    manage: ["B형간염 항바이러스제·C형간염 완치치료로 근본 위험 낮추기", "금주가 필수, B형간염 백신 접종", "정기 초음파+AFP 추적"],
    prog: "고위험군 6개월 간격 추적으로 조기 발견 시 완치도 가능해요. 간염·간경변 관리가 예방의 핵심입니다.",
    red: ["피 토함·검은변(정맥류 출혈)·심한 복통+발열(복막염)·심한 졸림(간성뇌증) → 응급"] },
  { name: "폐암", keys: ["폐암", "폐 암", "lung cancer"],
    desc: "폐암은 흡연이 최대 원인이며, 초기 증상이 거의 없어 저선량 CT 검진으로 조기에 찾는 것이 중요해요. 비소세포폐암과 소세포폐암으로 나뉩니다.",
    risk: ["흡연·간접흡연(최대 위험)", "라돈·석면·미세먼지·직업적 발암물질", "가족력·만성폐질환(COPD)"],
    sym: ["초기엔 대개 무증상", "2주 이상 지속되는 기침·객담, 혈담(각혈)", "흉통·호흡곤란·쉰 목소리·체중감소"],
    screen: ["국가암검진: 만 54~74세 중 30갑년 이상 흡연력 고위험군 2년마다 저선량 흉부 CT", "이상 결절은 조직검사·PET-CT로 확인"],
    treat: ["비소세포암 초기: 수술(±항암·방사선)", "진행암: 표적치료(EGFR·ALK 등)·면역항암제·항암화학·방사선", "소세포암: 항암화학+방사선 중심"],
    manage: ["금연이 예방·치료의 핵심(간접흡연도 피하기)", "실내 라돈·미세먼지 관리, 독감·폐렴 예방접종", "호흡재활·영양관리"],
    prog: "저선량 CT 조기검진으로 초기 발견 시 완치율이 크게 올라가요. 흡연 고위험군의 정기 검진이 결정적입니다.",
    red: ["대량 객혈·심한 호흡곤란·얼굴·목 부종(상대정맥증후군) → 응급"] },
  { name: "유방암", keys: ["유방암", "유방 암", "breast cancer"],
    desc: "유방암은 여성에게 가장 흔한 암 중 하나예요. 자가검진과 정기 유방촬영으로 조기에 발견하면 치료 성적이 매우 좋습니다.",
    risk: ["가족력·유전(BRCA1/2), 이른 초경·늦은 폐경·늦은 첫 출산", "비만·음주·호르몬 노출", "고밀도 유방"],
    sym: ["통증 없는 단단한 멍울(가장 흔한 신호)", "유두 분비물(특히 혈성)·함몰, 피부 함몰·귤껍질 변화", "겨드랑이 멍울"],
    screen: ["국가암검진: 만 40세 이상 여성 2년마다 유방촬영술", "고위험군은 유방초음파·MRI 병행, 매달 자가검진"],
    treat: ["수술(유방보존·전절제) + 필요시 방사선", "호르몬수용체·HER2에 따라 호르몬치료·표적치료·항암", "병기·아형별 맞춤 치료"],
    manage: ["체중·음주 관리, 규칙적 운동", "정기 검진·자가검진 습관", "치료 후 림프부종·골밀도 관리"],
    prog: "조기 발견 시 생존율이 매우 높아요. 40세부터 2년마다 유방촬영 + 자가검진이 핵심입니다.",
    red: ["빠르게 커지는 멍울·유두 혈성분비·피부 궤양 → 진료"] },
  { name: "자궁경부암", keys: ["자궁경부암", "자궁 경부암", "cervical cancer", "자궁경부 암"],
    desc: "자궁경부암은 대부분 인유두종바이러스(HPV) 감염이 원인이에요. HPV 백신 접종과 정기 세포검사로 예방·조기발견이 가능한 대표적 암입니다.",
    risk: ["고위험 HPV 지속감염", "이른 성경험·다수 파트너, 흡연", "면역저하"],
    sym: ["초기엔 대개 무증상", "성관계 후 출혈·비정상 질출혈, 지속되는 질분비물", "진행 시 골반통·배뇨장애"],
    screen: ["국가암검진: 만 20세 이상 여성 2년마다 자궁경부세포검사", "이상 시 HPV검사·질확대경·조직검사, HPV백신으로 예방"],
    treat: ["초기(상피내): 원추절제 등 국소치료", "침윤암: 수술·방사선·항암", "진행은 동시항암방사선요법"],
    manage: ["HPV 백신 접종(남녀 모두 권장)·금연", "정기 세포검사, 안전한 성생활", "치료 후 정기 추적"],
    prog: "백신+정기검진으로 예방·조기발견이 가장 잘 되는 암이에요. 20세부터 2년마다 세포검사가 핵심입니다.",
    red: ["다량 질출혈·심한 골반통·배뇨/배변 장애 → 진료"] },
  { name: "갑상선암", keys: ["갑상선암", "갑상선 암", "thyroid cancer"],
    desc: "갑상선암은 목 앞 갑상선에 생기는 암으로, 대부분(유두암) 천천히 자라고 예후가 매우 좋아요. 대부분 목의 결절(혹)로 발견됩니다.",
    risk: ["어린 시절 방사선 노출, 가족력", "일부는 요오드 섭취 이상과 관련"],
    sym: ["대개 무증상, 목에 만져지는 단단한 혹", "커지면 쉰 목소리·삼킴/호흡 곤란·목 압박감"],
    screen: ["국가암검진 항목은 아니며, 목 결절이 만져지거나 위험요인 있으면 갑상선 초음파", "의심 결절은 미세침흡인세포검사(FNA)로 확인"],
    treat: ["갑상선 절제 수술 + 필요시 방사성요오드치료", "이후 갑상선호르몬 보충", "저위험 미세유두암은 적극 감시(추적관찰)도 선택지"],
    manage: ["수술 후 호르몬제 규칙 복용·정기 추적", "칼슘·성대 기능 확인", "과도한 걱정보다 정기 관찰"],
    prog: "대부분 진행이 느리고 치료 성적이 매우 좋은 암이에요. 목 결절은 초음파로 확인하는 것이 좋습니다.",
    red: ["빠르게 커지는 목 혹·쉰 목소리·삼킴/호흡 곤란 → 진료"] },
  { name: "전립선암", keys: ["전립선암", "전립샘암", "prostate cancer", "전립선 암"],
    desc: "전립선암은 고령 남성에서 흔하며 대개 천천히 진행해요. 혈액 PSA 검사와 진찰로 조기에 발견할 수 있습니다.",
    risk: ["고령, 가족력·유전(BRCA)", "서구식 고지방 식이·비만", "인종적 요인"],
    sym: ["초기엔 대개 무증상", "진행 시 배뇨곤란·야간뇨·혈뇨(전립선비대와 감별 필요)", "전이 시 뼈 통증"],
    screen: ["국가암검진 항목은 아니며, 50세 이상(가족력은 더 일찍) 혈액 PSA + 직장수지검사 상담", "이상 시 전립선 MRI·조직검사"],
    treat: ["저위험: 적극적 감시(추적)", "국소암: 수술·방사선", "진행·전이: 호르몬치료·항암·표적치료"],
    manage: ["채소·건강한 지방 위주 식이·체중관리", "정기 PSA 추적", "치료 후 배뇨·성기능 관리"],
    prog: "대개 천천히 진행하고 조기 치료 성적이 좋아요. 50세부터 PSA 상담이 도움이 됩니다.",
    red: ["소변 못 봄(급성요폐)·혈뇨·심한 뼈 통증 → 진료"] },
  { name: "신장암", keys: ["신장암", "신세포암", "콩팥암", "kidney cancer", "신장 암"],
    desc: "신장암(신세포암)은 콩팥에 생기는 암으로, 증상이 없어 건강검진 초음파·CT에서 우연히 발견되는 경우가 많아요.",
    risk: ["흡연·비만·고혈압", "만성신질환·투석, 가족력(유전성)"],
    sym: ["초기엔 대개 무증상(우연 발견 많음)", "혈뇨·옆구리 통증·옆구리 덩어리(고전적 3징)", "체중감소·발열·피로"],
    screen: ["국가검진 항목은 아니며, 복부 초음파/CT에서 발견", "고위험군은 영상검사로 추적"],
    treat: ["국소암: 부분/근치적 신절제(수술)", "작은 종양은 냉동·고주파치료·감시", "진행·전이: 표적치료·면역항암제"],
    manage: ["금연·체중·혈압 관리", "신기능 보호(수분·약물 주의)", "정기 영상 추적"],
    prog: "우연히 조기 발견되면 수술로 완치되는 경우가 많아요. 금연·혈압·체중 관리가 예방에 중요합니다.",
    red: ["육안적 혈뇨·심한 옆구리 통증·만져지는 덩어리 → 진료"] },
  { name: "방광암", keys: ["방광암", "방광 암", "bladder cancer"],
    desc: "방광암은 흡연이 가장 큰 원인이며, 통증 없는 혈뇨가 대표 신호예요. 조기에 발견하면 방광을 보존하며 치료할 수 있습니다.",
    risk: ["흡연(최대 위험)", "화학물질·염료 직업 노출", "고령·만성 방광염증"],
    sym: ["통증 없는 육안적 혈뇨(가장 흔한 신호)", "빈뇨·절박뇨·배뇨통(방광염과 감별)"],
    screen: ["국가검진 항목은 아니며, 혈뇨 시 소변세포검사·방광내시경(진단의 핵심)", "영상(CT 요로조영)으로 병기 확인"],
    treat: ["표재성: 경요도절제(TURBT) + 방광내 BCG/항암 주입", "근침윤성: 방광절제·항암·방사선", "전이: 항암·면역항암제"],
    manage: ["금연이 예방·재발방지의 핵심, 수분 충분히", "정기 방광내시경 추적(재발 흔함)"],
    prog: "통증 없는 혈뇨를 놓치지 않으면 조기 발견 가능해요. 흡연이 최대 위험이므로 금연이 중요합니다.",
    red: ["통증 없는 육안적 혈뇨 → 반드시 검사", "소변 못 봄(응고 폐색)·발열 동반 → 응급"] },
  { name: "담낭·담도암", keys: ["담낭암", "담도암", "쓸개암", "담관암", "gallbladder", "담낭 암"],
    desc: "담낭암·담도암은 쓸개와 담관에 생기는 암으로, 초기 증상이 없고 황달로 발견되는 경우가 많아 조기발견이 어려운 암이에요.",
    risk: ["담석·만성 담낭염, 도자기담낭", "간흡충(민물고기 생식)·담관 이상", "비만·고령"],
    sym: ["초기엔 대개 무증상", "황달(눈·피부 노랑, 진한 소변)·가려움", "오른쪽 윗배 통증·체중감소"],
    screen: ["국가검진 항목은 아니며, 복부 초음파/CT/MRI·MRCP로 진단", "종양표지자 CA19-9 보조"],
    treat: ["수술(근치절제)이 완치 기회 — 초기에만 가능", "진행암: 항암화학·방사선", "황달은 담도 배액·스텐트로 완화"],
    manage: ["담석·간흡충 예방(민물고기 익혀 먹기)", "비만·대사 관리", "황달·통증 적극 관리"],
    prog: "조기발견이 어려워 예후가 나쁜 편이라 담석·고위험군 관리가 중요해요. 황달은 즉시 검사가 필요합니다.",
    red: ["황달 + 고열·오한·복통(담관염) → 즉시 응급"] },
  { name: "식도암", keys: ["식도암", "식도 암", "esophageal cancer"],
    desc: "식도암은 음식이 지나가는 식도에 생기는 암으로, 삼킴곤란이 대표 신호예요. 흡연·음주·뜨거운 음식이 위험을 높입니다.",
    risk: ["흡연·과음(특히 함께하면 크게 증가)", "뜨거운 음식·자극적 식이", "역류성식도염·바렛식도(선암), 고령"],
    sym: ["초기엔 대개 무증상", "삼킬 때 걸림·통증(점차 고형식→유동식)", "체중감소·목쉼·역류"],
    screen: ["국가검진 항목은 아니며, 위내시경에서 함께 관찰·조직검사", "바렛식도 등 고위험군은 정기 내시경 추적"],
    treat: ["초기: 내시경 절제", "진행: 수술 + 항암·방사선(동시요법)", "진행·전이는 항암·면역항암제"],
    manage: ["금연·절주, 뜨겁고 자극적인 음식 피하기", "역류 관리(취침 전 금식·상체거상)"],
    prog: "삼킴곤란을 놓치지 않고 조기에 찾으면 치료 성적이 좋아져요. 금연·절주가 예방의 핵심입니다.",
    red: ["삼킴곤란 악화·토혈/흑색변·급격한 체중감소 → 진료"] },
  { name: "난소암", keys: ["난소암", "난소 암", "ovarian cancer"],
    desc: "난소암은 초기 증상이 모호해 늦게 발견되기 쉬운 여성암이에요. 가족력·유전(BRCA)이 있으면 위험이 높습니다.",
    risk: ["가족력·유전(BRCA1/2·린치증후군)", "출산 경험 없음·이른 초경/늦은 폐경", "고령"],
    sym: ["초기엔 대개 무증상", "지속되는 복부팽만·소화불량·골반통", "포만감·빈뇨, 진행 시 복수"],
    screen: ["효과적 국가검진법은 없음 — 고위험군은 골반초음파·CA125로 추적, 유전상담", "의심 시 영상·수술적 진단"],
    treat: ["수술(종양 감축) + 백금기반 항암화학요법", "BRCA 변이는 PARP억제제 표적치료", "재발 흔해 유지치료"],
    manage: ["가족력 있으면 유전상담·검사", "지속되는 복부 증상 방치 말고 진료", "치료 후 정기 추적"],
    prog: "조기 발견이 어렵지만 적극 치료로 관리해요. 지속되는 복부팽만·소화불량은 꼭 진료받는 것이 중요합니다.",
    red: ["지속 복부팽만·골반통·복수·갑작스런 극심한 복통(염전/파열) → 진료/응급"] },
  { name: "자궁내막암", keys: ["자궁내막암", "자궁체부암", "자궁 내막암", "endometrial cancer"],
    desc: "자궁내막암은 자궁 안쪽 내막에 생기는 암으로, 폐경 후 질출혈이 대표 신호예요. 비교적 조기에 증상이 나타나 발견이 빠른 편입니다.",
    risk: ["비만·당뇨·고혈압, 에스트로겐 단독 노출", "이른 초경/늦은 폐경·무배란(다낭성난소)", "타목시펜 복용·가족력(린치)"],
    sym: ["폐경 후 질출혈(가장 중요한 신호)", "비정상 질출혈·분비물, 골반통"],
    screen: ["국가검진 항목은 아니며, 폐경 후 출혈 시 자궁초음파·내막조직검사", "고위험군은 정기 평가"],
    treat: ["수술(자궁적출±난소절제) 중심", "필요시 방사선·호르몬·항암", "초기 발견 시 완치율 높음"],
    manage: ["체중·혈당 관리, 폐경 후 출혈은 반드시 검사", "정기 부인과 진료"],
    prog: "폐경 후 출혈로 비교적 일찍 발견돼 치료 성적이 좋은 편이에요. 출혈을 방치하지 않는 것이 핵심입니다.",
    red: ["폐경 후 질출혈·비정상 출혈 → 반드시 진료"] },
  { name: "뇌종양", keys: ["뇌종양", "뇌 종양", "교모세포종", "brain tumor", "글리오마"],
    desc: "뇌종양은 뇌·주변 조직에 생기는 종양으로, 양성부터 악성(교모세포종 등)까지 다양해요. 두통·신경증상으로 나타납니다.",
    risk: ["대부분 원인 불명, 일부 방사선 노출·유전증후군", "다른 암의 뇌전이도 흔함"],
    sym: ["점점 심해지는 두통(특히 새벽·구토 동반)", "경련(성인 새 발작)·한쪽 위약·시야/언어 장애", "성격변화·인지저하"],
    screen: ["국가검진 항목은 아니며, 신경증상 시 뇌 MRI가 진단의 핵심", "조직검사로 종류·등급 확인"],
    treat: ["수술 절제(가능한 만큼) + 방사선·항암(악성)", "위치·등급별 맞춤 치료", "부종·경련 등 대증치료 병행"],
    manage: ["경련·부종 약물 관리, 재활치료", "정기 MRI 추적"],
    prog: "종류·등급에 따라 예후가 매우 달라요. 새로 생긴 심한 두통·경련·신경증상은 빨리 MRI로 확인해야 합니다.",
    red: ["갑작스런 심한 두통·경련·한쪽 마비·의식저하 → 즉시 119"] },
  { name: "후두암", keys: ["후두암", "후두 암", "성대암", "laryngeal cancer"],
    desc: "후두암은 목소리를 내는 후두에 생기는 암으로, 지속되는 쉰 목소리가 대표 신호예요. 흡연·음주가 주요 원인입니다.",
    risk: ["흡연(최대 위험)·과음", "역류·직업적 자극물질 노출", "고령 남성"],
    sym: ["2주 이상 지속되는 쉰 목소리", "목 이물감·통증·삼킴곤란", "진행 시 호흡곤란·목 멍울"],
    screen: ["국가검진 항목은 아니며, 이비인후과 후두내시경으로 확인·조직검사", "영상(CT)으로 병기"],
    treat: ["초기: 방사선 또는 후두보존 수술(목소리 보존)", "진행: 후두절제·항암·방사선"],
    manage: ["금연·절주가 예방·재발방지의 핵심", "쉰 목소리 2주↑ 지속 시 진료", "음성재활"],
    prog: "쉰 목소리를 놓치지 않으면 조기 발견해 목소리를 보존하며 치료할 수 있어요. 금연·절주가 중요합니다.",
    red: ["호흡곤란·침 못 삼킴·객혈 → 응급"] },
  { name: "구강암", keys: ["구강암", "혀암", "입안암", "구강 암", "oral cancer"],
    desc: "구강암은 혀·잇몸·입안 점막에 생기는 암으로, 2주 이상 낫지 않는 궤양·백색/적색반이 신호예요.",
    risk: ["흡연·씹는담배·과음", "고위험 HPV, 잘 맞지 않는 틀니·만성 자극", "구강위생 불량"],
    sym: ["2주 이상 낫지 않는 입안 궤양·멍울", "백색반·적색반, 출혈·통증·삼킴곤란", "목 멍울"],
    screen: ["국가검진 항목은 아니며, 치과·이비인후과 진찰·조직검사", "영상으로 병기"],
    treat: ["수술 절제(± 재건) + 필요시 방사선·항암", "초기 발견 시 기능보존 가능"],
    manage: ["금연·절주, 구강위생·정기 치과검진", "2주↑ 안 낫는 병변은 반드시 진료"],
    prog: "눈에 보이는 부위라 조기 발견이 가능해요. 2주 이상 낫지 않는 병변은 꼭 검사받는 것이 중요합니다.",
    red: ["2주 이상 낫지 않는 궤양·멍울·출혈 → 진료"] },
  { name: "피부암", keys: ["피부암", "흑색종", "피부 암", "멜라노마", "skin cancer", "기저세포암", "편평세포암"],
    desc: "피부암은 자외선 노출과 관련이 크며, 흑색종은 악성도가 높지만 조기발견 시 완치율이 높아요. 점의 변화(ABCDE)를 관찰하세요.",
    risk: ["과도한 햇볕·화상력·태닝, 밝은 피부", "고령·면역저하, 가족력", "만성 상처·방사선"],
    sym: ["새로 생기거나 변하는 점(ABCDE: 비대칭·경계불규칙·색다양·지름6mm↑·변화)", "낫지 않는 상처·궤양·출혈하는 병변"],
    screen: ["국가검진 항목은 아니며, 자가점검(ABCDE) + 피부과 더모스코피·조직검사", "고위험군 정기 진찰"],
    treat: ["수술 절제(기본)", "흑색종 진행 시 면역항암제·표적치료", "비흑색종은 국소치료·방사선도"],
    manage: ["자외선 차단(자외선차단제·모자·의류), 태닝 피하기", "정기 자가점검(ABCDE)"],
    prog: "흑색종도 조기 절제하면 완치율이 높아요. 점의 변화를 관찰하고 이상하면 바로 피부과 진료가 핵심입니다.",
    red: ["점이 커지거나 색·모양 비대칭·경계불규칙·출혈/궤양 → 즉시 피부과"] },
  { name: "림프종", keys: ["림프종", "림프암", "임파선암", "임파암", "lymphoma", "호지킨"],
    desc: "림프종은 면역세포(림프구)에 생기는 혈액암으로, 통증 없는 림프절(임파선) 부종이 대표 신호예요. 호지킨·비호지킨 림프종으로 나뉩니다.",
    risk: ["면역저하(HIV·이식 후)·자가면역질환", "일부 감염(EBV·헬리코박터), 고령", "일부 화학물질 노출"],
    sym: ["통증 없이 커지는 림프절(목·겨드랑이·사타구니)", "발열·야간 식은땀·설명 안 되는 체중감소(B증상)", "피로·가려움"],
    screen: ["국가검진 항목은 아니며, 림프절 조직검사가 진단의 핵심", "PET-CT·골수검사로 병기"],
    treat: ["항암화학요법(±방사선)이 중심, 종류·병기별 맞춤", "표적치료(항CD20 등)·면역치료", "일부는 조혈모세포이식"],
    manage: ["치료 중 감염 예방·영양관리", "정기 추적(재발 감시)"],
    prog: "혈액암이지만 종류에 따라 완치율이 높은 편이에요. 통증 없이 커지는 림프절과 발열·체중감소를 놓치지 않는 것이 중요합니다.",
    red: ["고열 지속·심한 호흡곤란·급격히 커지는 림프절 → 진료"] },
  { name: "백혈병", keys: ["백혈병", "혈액암", "leukemia"],
    desc: "백혈병은 골수에서 비정상 백혈구가 과도하게 증식하는 혈액암이에요. 급성·만성, 골수성·림프구성으로 나뉘며 감염·출혈·빈혈이 나타납니다.",
    risk: ["방사선·일부 화학물질(벤젠)·항암치료 이력", "유전질환(다운증후군 등), 흡연", "대부분 뚜렷한 원인 없음"],
    sym: ["반복 감염·고열, 멍·출혈(잇몸·코피)", "창백·피로(빈혈), 뼈 통증", "림프절·간·비장 종대"],
    screen: ["국가검진 항목은 아니며, 혈액검사(혈구수치)·말초혈액도말·골수검사로 진단", "유전자·염색체 검사로 분류"],
    treat: ["급성: 항암화학요법(관해유도)±조혈모세포이식", "만성골수성: 표적치료(TKI)", "종류별 맞춤 치료"],
    manage: ["치료 중 감염·출혈 예방(위생·주의)", "영양·수혈 지원", "정기 혈액검사 추적"],
    prog: "종류에 따라 완치·장기관리가 가능해요. 반복 감염·멍·창백이 지속되면 혈액검사가 필요합니다.",
    red: ["고열·심한 출혈·의식저하 → 즉시 응급"] },
  { name: "다발골수종", keys: ["다발골수종", "골수종", "multiple myeloma", "다발성골수종"],
    desc: "다발골수종은 골수의 형질세포가 암으로 변해 뼈·신장·혈액을 침범하는 혈액암이에요. 고령에서 뼈 통증·골절·빈혈로 나타납니다.",
    risk: ["고령, 남성·특정 인종", "의미불명 단클론감마병증(MGUS) 이력", "대부분 원인 불명"],
    sym: ["뼈 통증·병적 골절(특히 척추·갈비)", "빈혈·피로, 신장기능 저하", "고칼슘혈증(갈증·혼란)·반복 감염"],
    screen: ["국가검진 항목은 아니며, 혈액·소변 단백전기영동(M단백)·골수검사·영상으로 진단"],
    treat: ["표적·면역조절제·스테로이드 병합요법", "자가조혈모세포이식(가능 시)", "뼈 보호제(비스포스포네이트)"],
    manage: ["뼈 건강·신장 보호(수분·약물 주의)", "감염 예방·정기 추적"],
    prog: "완치보다는 장기 관리하는 암으로, 치료 발전으로 생존기간이 늘고 있어요. 고령의 반복 뼈 통증·골절은 검사가 필요합니다.",
    red: ["심한 뼈 통증·갑작스런 골절·심한 갈증/혼란(고칼슘)·소변량 급감 → 응급"] },
  { name: "고환암", keys: ["고환암", "고환 암", "정소암", "testicular cancer"],
    desc: "고환암은 20~40대 젊은 남성에서 비교적 흔한 고형암이지만, 치료 성적이 매우 좋은 암이에요. 대부분 한쪽 고환의 통증 없는 멍울로 발견됩니다.",
    risk: ["잠복고환(정류고환) 병력", "가족력·본인 반대쪽 고환암 이력", "20~40대 젊은 남성"],
    sym: ["한쪽 고환에 만져지는 통증 없는 단단한 멍울·부종", "음낭의 묵직함·불편감", "드물게 유방 압통(호르몬)"],
    screen: ["국가검진 항목은 아니며, 음낭 초음파가 진단의 핵심", "종양표지자(AFP·β-hCG·LDH)·CT로 병기 확인", "자가검진(샤워 후 부드럽게 만져보기) 권장"],
    treat: ["고환절제술(진단·치료 겸함)", "병기·종류에 따라 항암화학요법·방사선", "전이 있어도 완치율이 높은 편"],
    manage: ["젊은 남성 자가검진 습관, 치료 전 정자 보관 상담", "치료 후 정기 추적·반대쪽 고환 관찰"],
    prog: "전이가 있어도 완치율이 매우 높은 대표적 암이에요. 통증 없는 고환 멍울을 발견하면 바로 비뇨의학과 진료가 핵심입니다.",
    red: ["갑작스런 심한 고환 통증·부종(염전과 감별) → 즉시 응급", "새로 만져지는 고환 멍울 → 진료"] },
  { name: "육종", keys: ["육종", "연부조직육종", "골육종", "sarcoma", "뼈암", "물렁조직암"],
    desc: "육종은 근육·지방·혈관·뼈·연골 등 결합조직에서 생기는 드문 암이에요. 연부조직육종과 뼈에 생기는 골육종 등으로 나뉩니다.",
    risk: ["방사선 치료 이력·일부 유전증후군(리-프라우메니 등)", "만성 림프부종, 일부 화학물질", "대부분 원인 불명"],
    sym: ["점점 커지는 통증 없는 덩어리(연부조직)", "뼈 통증·붓기·병적 골절(골육종, 특히 청소년)", "커지며 주변 압박 증상"],
    screen: ["국가검진 항목은 아니며, MRI·CT 영상 + 조직검사가 진단의 핵심", "전이 평가 위해 흉부 CT·PET"],
    treat: ["광범위 수술 절제가 중심(가능한 사지·기능 보존)", "항암화학요법·방사선 병합(종류·등급별)", "전문 육종센터의 다학제 치료 권장"],
    manage: ["새로 생기거나 커지는 덩어리는 방치 말고 진료", "치료 후 재활·정기 영상 추적"],
    prog: "드물고 종류·등급에 따라 예후가 달라, 조기에 전문센터에서 치료하는 것이 중요해요. 커지는 덩어리·지속되는 뼈 통증은 검사가 필요합니다.",
    red: ["빠르게 커지는 덩어리·심한 뼈 통증·병적 골절 → 진료"] },
  { name: "부신암", keys: ["부신암", "부신 암", "부신피질암", "adrenal cancer", "부신종양"],
    desc: "부신암(부신피질암)은 콩팥 위 부신에 생기는 드문 암이에요. 호르몬을 과다 분비하거나(기능성) 커지면서 증상을 일으킵니다.",
    risk: ["일부 유전증후군(리-프라우메니·베크위드-비데만)", "대부분 원인 불명"],
    sym: ["호르몬 과다: 살이 급격히 찌고 얼굴 둥글어짐(쿠싱)·고혈압·여드름·다모", "옆구리·복부 덩어리·통증", "저칼륨·근력저하"],
    screen: ["국가검진 항목은 아니며, 복부 CT/MRI + 호르몬 혈액·소변검사", "우연히 발견된 부신종괴는 크기·기능 평가"],
    treat: ["수술(근치적 부신절제)이 완치 기회", "미토탄 등 약물·항암화학요법", "호르몬 과다 증상 조절"],
    manage: ["혈압·혈당·전해질 관리, 수술 후 호르몬 보충 여부 확인", "정기 영상·호르몬 추적"],
    prog: "드문 암으로 조기 수술이 예후를 좌우해요. 갑작스런 쿠싱 증상·고혈압·복부 덩어리는 검사가 필요합니다.",
    red: ["갑작스런 심한 고혈압·심한 복통·급성 무기력·의식저하 → 진료/응급"] },
  { name: "흉선종", keys: ["흉선종", "흉선암", "가슴샘암", "thymoma", "흉선 종양"],
    desc: "흉선종·흉선암은 가슴 가운데(종격동)의 흉선에 생기는 종양이에요. 중증근무력증 등 자가면역질환과 잘 동반됩니다.",
    risk: ["대부분 원인 불명", "중증근무력증 등 자가면역질환 동반이 많음"],
    sym: ["초기엔 대개 무증상(검진 영상서 우연 발견)", "커지면 기침·흉통·호흡곤란·상대정맥 압박", "중증근무력증(눈꺼풀 처짐·복시·근력저하)"],
    screen: ["국가검진 항목은 아니며, 흉부 CT/MRI로 발견·평가", "필요시 조직검사, 근무력증 관련 항체 검사"],
    treat: ["수술 절제가 기본(완전절제가 중요)", "진행·악성은 방사선·항암 병합", "동반 근무력증 함께 치료"],
    manage: ["동반 자가면역질환 관리, 수술 후 정기 영상 추적", "호흡·근력 증상 관찰"],
    prog: "흉선종은 대개 천천히 자라고 완전 절제 시 예후가 좋은 편이에요. 근무력증 증상이나 종격동 종괴가 있으면 정밀검사가 필요합니다.",
    red: ["심한 호흡곤란·삼킴/숨 곤란(근무력 위기)·얼굴·목 부종 → 응급"] },
  { name: "소장암", keys: ["소장암", "소장 암", "small bowel cancer", "소장 종양"],
    desc: "소장암은 위와 대장 사이 소장에 생기는 드문 암이에요. 증상이 모호하고 내시경 접근이 어려워 늦게 발견되는 경우가 많습니다.",
    risk: ["크론병 등 만성 장염증", "가족성용종증·린치증후군, 셀리악병", "고령"],
    sym: ["초기엔 대개 무증상", "모호한 복통·간헐적 장폐색·복부팽만", "출혈(빈혈·검은변)·체중감소"],
    screen: ["국가검진 항목은 아니며, CT 조영·소장조영·캡슐내시경·풍선내시경으로 진단", "고위험군(크론병 등)은 정기 추적"],
    treat: ["수술 절제가 기본", "종류(선암·신경내분비·림프종·GIST)별 항암·표적치료", "GIST는 표적치료(이매티닙)"],
    manage: ["기저 장질환 관리, 원인불명 복통·빈혈 방치 말기", "정기 추적"],
    prog: "드물어 진단이 늦기 쉬우므로, 원인불명의 반복 복통·장폐색·빈혈은 소장 검사를 고려해야 해요.",
    red: ["심한 복통·구토·복부팽만(장폐색)·다량 출혈 → 응급"] },
  { name: "항문암", keys: ["항문암", "항문 암", "anal cancer"],
    desc: "항문암은 항문·항문관에 생기는 암으로, 대부분 인유두종바이러스(HPV) 감염과 관련이 있어요. 치질로 오인되기 쉬워 지속 증상은 확인이 필요합니다.",
    risk: ["고위험 HPV 감염, 항문 성접촉·다수 파트너", "면역저하(HIV 등), 흡연", "만성 항문 염증"],
    sym: ["항문 출혈·통증·이물감(치질과 감별 필요)", "항문 주위 멍울·가려움·분비물", "배변습관 변화"],
    screen: ["국가검진 항목은 아니며, 항문 진찰·항문경·조직검사로 진단", "고위험군은 항문 세포검사(HPV) 고려, HPV백신 예방"],
    treat: ["대부분 동시항암화학방사선요법으로 항문 보존", "재발·잔존 시 수술", "초기 발견 시 성적 좋음"],
    manage: ["HPV백신·금연·안전한 성생활", "치질로 자가진단 말고 지속 증상은 진료"],
    prog: "치질로 오인해 늦추지 않으면 항문을 보존하며 치료할 수 있어요. 지속되는 항문 출혈·통증·멍울은 꼭 검사받으세요.",
    red: ["지속되는 항문 출혈·심한 통증·커지는 멍울 → 진료"] },
  { name: "신경내분비종양", keys: ["신경내분비종양", "신경내분비암", "카르시노이드", "net종양", "neuroendocrine", "카르시노이드종양"],
    desc: "신경내분비종양(NET)은 호르몬을 분비하는 신경내분비세포에서 생기는 종양으로, 위장관·췌장·폐 등에 발생해요. 천천히 자라지만 호르몬 증상을 일으킬 수 있습니다.",
    risk: ["일부 유전증후군(MEN1·폰히펠린다우 등)", "대부분 원인 불명"],
    sym: ["기능성: 얼굴 화끈거림(홍조)·설사·천명(카르시노이드증후군)", "저혈당·위궤양(췌장 NET 종류별)", "비기능성은 종괴 압박·우연 발견"],
    screen: ["국가검진 항목은 아니며, CT/MRI·내시경 + 소마토스타틴수용체 영상(도타톡PET)", "혈액 크로모그라닌A·소변 5-HIAA 등 표지자"],
    treat: ["수술 절제가 기본", "소마토스타틴유사체(호르몬 조절)·표적치료·PRRT(방사성표지치료)", "진행성은 항암"],
    manage: ["호르몬 증상(홍조·설사) 조절·영양관리", "정기 영상·표지자 추적"],
    prog: "대개 천천히 자라 장기 관리가 가능한 종양이에요. 원인불명의 반복 홍조·설사·저혈당은 NET 감별을 고려합니다.",
    red: ["심한 홍조·저혈압·호흡곤란(카르시노이드 위기)·심한 저혈당 → 응급"] },
  { name: "외음부암", keys: ["외음부암", "외음암", "질암", "외음 암", "vulvar cancer", "vaginal cancer"],
    desc: "외음부암·질암은 여성 생식기 바깥쪽(외음)·질에 생기는 드문 암이에요. HPV 감염·만성 자극과 관련되며, 폐경 후 여성에서 더 흔합니다.",
    risk: ["고위험 HPV 감염, 흡연", "만성 외음 피부질환(경화태선)·전암병변", "고령·면역저하"],
    sym: ["낫지 않는 외음/질 가려움·통증·멍울·궤양", "비정상 출혈·분비물", "색·피부 변화"],
    screen: ["국가검진 항목은 아니며, 부인과 진찰·질확대경·조직검사로 진단", "HPV백신·정기 부인과 진찰로 예방·조기발견"],
    treat: ["수술 절제(범위별)", "필요시 방사선·항암(동시요법)", "초기 발견 시 기능·예후 좋음"],
    manage: ["HPV백신·금연, 낫지 않는 외음 증상은 진료", "만성 외음질환 정기 관찰"],
    prog: "드물지만 조기 발견 시 치료가 잘 돼요. 낫지 않는 외음/질 가려움·멍울·궤양은 부인과 진찰이 필요합니다.",
    red: ["낫지 않는 외음/질 멍울·궤양·비정상 출혈 → 진료"] },
];
/* 암별 예방·관리 수칙(이렇게 하세요/피하세요/기억하세요) — 국가암정보센터형 일반 주의사항. 회원 공통 활용 */
const CANCER_CARE = {
  "간암": { do: ["첨가물 없는 커피", "신선한 식품(곰팡이·아플라톡신 피하기)"], avoid: ["약물 오남용·민간요법", "알코올 하루 3잔(45g) 이상"], remember: ["간기능 수치만으론 조기발견 어려워 간초음파 병행 권장", "간경변·만성 B/C형 간염 고위험군은 6개월마다 간초음파+AFP"] },
  "담낭·담도암": { do: ["민물고기 충분히 익혀 먹기(간흡충 예방)"], avoid: ["3cm 이상 담석·담낭용종 방치"], remember: ["이유 없는 소화불량·복부팽만 지속 시 진료", "초기 증상 적고 전이 빨라 건강검진 중요"] },
  "췌장암": { do: ["당뇨·만성췌장염 등 관련질환 관리", "과일·채소·식물성 단백질"], avoid: ["흡연(비흡연자의 1.7배)", "용매제·타르·금속가루 등 직업상 노출"], remember: ["조기발견 혈액검사 없음 — 고위험군은 초음파내시경 도움", "유전적 영향 10%, 유전자검사는 전문의 상담"] },
  "위암": { do: ["항산화물질(파·마늘·양파·과일)", "40세 이상 2년마다 위내시경"], avoid: ["짠·부패·탄 음식, 질산염", "흡연·장기 음주(1.5~2.5배)"], remember: ["영양보충제 항산화는 예방효과 뚜렷하지 않음", "가족력·위암전단계 병변 시 자주 내시경"] },
  "대장암": { do: ["통곡류(귀리·보리·현미)", "칼슘(우유·치즈·보충제)"], avoid: ["붉은 육류·가공육", "음주(일 알코올 30g 이상)"], remember: ["매년 분변잠혈검사, 이상 시 대장내시경", "내시경만 시행 시 5~10년 주기"] },
  "폐암": { do: ["자전거·런닝·등산 등 중강도 운동", "간접흡연·석면·라돈·미세먼지 피하기"], avoid: ["흡연(85% 이상 원인, 11배)", "라돈·중금속 직업 노출"], remember: ["흡연량·기간 비례해 위험↑, 금연 빠를수록 좋음", "흡연자 고용량 베타카로틴은 폐암 위험↑"] },
  "신장암": { do: ["혈압 관리(고혈압 1.4~3.2배)", "체중 조절(비만 약 2.5배)"], avoid: ["동물성지방 과다", "튀기거나 심하게 구운 육류·고칼로리"], remember: ["1기 발견 시 5년 생존율 88~100%", "40대 이후 복부 초음파·CT·MRI 적극 시행"] },
  "방광암": { do: ["적합한 식수(비소 주의)", "녹황색 채소·과일(베타카로틴)"], avoid: ["흡연(가장 주된 요인)·간접흡연", "고무·가죽·염료 등 화학약품 노출"], remember: ["5년 생존율 약 77%이나 전이암은 낮아 조기발견 중요", "혈뇨 시 추가 검사 권장"] },
  "전립선암": { do: ["적정 체중 유지", "라이코펜(토마토)·셀레늄·제니스테인(콩)"], avoid: ["동물성 지방(육류·유제품)", "흡연·농약·유기용제"], remember: ["남성호르몬 억제제는 주치의 상담 후", "검진 시 PSA 또는 전립선 초음파 도움"] },
  "갑상선암": { do: ["십자화과 채소(브로콜리·양배추·무)", "갑상선종·결절 정기 검사"], avoid: ["불필요한 목 부위 방사선 촬영", "과체중·비만(호르몬 불균형)"], remember: ["증상 없으면 일상 검진 비권장, 가족력·방사선 노출 시 상담", "수질암 가족력은 가족 RET 유전자 검사"] },
};
function cancerCounsel(text) {
  const t = (text || "");
  const c = CANCER_KB.find((x) => x.keys.some((k) => t.includes(k)));
  if (!c) return null;
  const cards = [];
  cards.push({ kind: "card", card: { title: "🎗 위험인자 · 예방수칙", items: c.risk, buttons: [] } });
  cards.push({ kind: "card", card: { title: "🔎 주요 증상 (초기엔 없을 수 있어요)", items: c.sym, buttons: [] } });
  cards.push({ kind: "card", card: { title: "🔬 검진 · 조기진단", items: c.screen, buttons: ["🔬 특수검진 정밀검사 보기"] } });
  cards.push({ kind: "card", card: { title: "💊 병기 · 치료", items: c.treat, buttons: [] } });
  cards.push({ kind: "card", card: { title: "🥗 생활 · 영양 관리", items: c.manage, buttons: ["🏥 병원·진료 안내"] } });
  // 암별 예방·관리 수칙(이렇게 하세요 / 피하세요 / 기억하세요) — 국가암정보센터형 일반 주의사항
  const care = (typeof CANCER_CARE !== "undefined") ? CANCER_CARE[c.name] : null;
  if (care) cards.push({ kind: "card", card: { title: "🎯 예방·관리 수칙", items: []
    .concat((care.do || []).map((x) => `✅ 이렇게 하세요: ${x}`))
    .concat((care.avoid || []).map((x) => `🚫 이건 피하세요: ${x}`))
    .concat((care.remember || []).map((x) => `💡 기억하세요: ${x}`)), buttons: [] } });
  cards.push({ kind: "card", card: { title: "📈 예후 · 조기발견 포인트", items: [c.prog], buttons: [] } });
  if ((c.red || []).length) cards.push({ kind: "card", card: { title: "🚨 이런 증상은 즉시 진료·119", items: c.red, buttons: [] } });
  const others = CANCER_KB.filter((x) => x.name !== c.name).slice(0, 2).map((x) => `${x.name} 알아보기`);
  return {
    bubbles: [{ kind: "text", text: `${c.name}에 대해 안내해 드릴게요.\n\n${c.desc}\n\n※ 초안(전문가 검토 전제) — 진단·처방을 대체하지 않아요. 증상이 있으면 꼭 진료받으세요.` }, ...cards],
    quicks: [...others, "국가암검진 안내", "내 리포트 요약"],
  };
}
/* ── 장기별 건강관리 KB — "간 췌장 관리 방법"처럼 여러 장기를 물으면 각각 분리 응답 ── */
const ORGAN_CARE = {
  "간": { al: ["간", "liver"], short: "간", title: "간 건강관리", desc: "간은 해독·영양대사·담즙 생성을 맡는 장기예요. 손상돼도 증상이 늦게 나타나 ‘침묵의 장기’로 불립니다.",
    care: ["절주·금연, 표준체중 유지(지방간 예방)", "B형간염 백신 접종, 약물·건강식품 남용 주의(간독성)", "간 건강 성분(밀크씨슬 등)은 보조일 뿐 — 원인 관리가 우선"],
    screen: ["혈액 간수치(AST·ALT·감마GTP)·간초음파", "B/C형 간염·간경변 고위험군은 6개월마다 초음파+AFP(간암 조기검진)"],
    red: ["황달(눈·피부 노랑)·심한 졸림/헛소리·피 토함/검은변 → 즉시 진료"] },
  "췌장": { al: ["췌장", "이자", "pancrea"], short: "췌장", title: "췌장 건강관리", desc: "췌장은 소화효소와 혈당조절 호르몬(인슐린)을 만드는 장기예요. 염증·암이 생기면 조기발견이 어렵습니다.",
    care: ["금연·절주가 최우선(췌장염·췌장암 위험 낮추기)", "저지방·규칙적 식사, 혈당·중성지방 관리", "새로 생긴 당뇨·지속되는 상복부통은 방치하지 않기"],
    screen: ["혈액 아밀라아제·리파아제(췌장 효소), 복부 초음파/CT", "가족력·만성췌장염 등 고위험군은 복부 MRI/MRCP·초음파내시경(EUS)·CA19-9"],
    red: ["명치~등으로 뻗치는 극심한 통증·구토·황달·급격한 체중감소 → 즉시 진료"] },
  "심장": { al: ["심장", "심혈관", "관상동맥", "heart"], short: "심장", title: "심장 건강관리", desc: "심장은 온몸에 혈액을 보내는 펌프예요. 혈관이 좁아지면 협심증·심근경색으로 이어질 수 있습니다.",
    care: ["혈압·콜레스테롤·혈당 관리, 금연·절주", "저염·채소 위주 식이, 규칙적 유산소 운동·체중관리", "스트레스 관리·충분한 수면"],
    screen: ["혈압·심전도·혈중 지질, 필요시 심초음파·운동부하·관상동맥 CT"],
    red: ["20분 이상 가슴 압박·식은땀·왼팔/턱 방사통·호흡곤란 → 즉시 119"] },
  "신장": { al: ["신장", "콩팥", "kidney", "신기능"], short: "신장(콩팥)", title: "신장(콩팥) 건강관리", desc: "신장은 노폐물을 걸러 소변으로 내보내고 혈압·전해질을 조절해요. 기능이 떨어져도 초기엔 증상이 거의 없습니다.",
    care: ["혈압·혈당 철저 관리, 저염식·적정 수분", "진통소염제(NSAID)·조영제·한약 신독성 주의", "단백뇨·부종 있으면 조기 진료"],
    screen: ["혈액 크레아티닌·eGFR(사구체여과율), 소변검사(단백뇨·혈뇨)", "당뇨·고혈압 환자는 정기 신장기능 추적"],
    red: ["소변량 급감·심한 부종·호흡곤란·의식저하(고칼륨) → 응급"] },
  "폐": { al: ["폐", "호흡기", "lung", "기관지"], short: "폐", title: "폐 건강관리", desc: "폐는 산소를 들이고 이산화탄소를 내보내는 호흡기관이에요. 흡연·미세먼지에 취약합니다.",
    care: ["금연·간접흡연 회피가 가장 중요, 실내 라돈·미세먼지 관리", "독감·폐렴 예방접종, 유산소 운동", "직업적 분진·석면 노출 보호"],
    screen: ["흉부 X선·폐기능검사, 30갑년 이상 흡연 고위험군(54~74세)은 2년마다 저선량 흉부 CT"],
    red: ["대량 객혈·심한 호흡곤란·입술 청색 → 즉시 119"] },
  "위": { al: ["위장", "위 건강", "위암", "위염", "stomach"], short: "위", title: "위 건강관리", desc: "위는 음식을 소화하는 장기로, 헬리코박터 감염·짠 음식·흡연에 영향을 받아요.",
    care: ["헬리코박터 제균, 저염·신선채소 위주, 탄 음식·가공육 줄이기", "금연·절주, 규칙적 식사"],
    screen: ["만 40세 이상 2년마다 위내시경(국가암검진)"],
    red: ["토혈·흑색변·삼킴곤란·급격한 체중감소 → 진료"] },
  "장": { al: ["대장", "장 건강", "장건강", "colon", "소화기"], short: "장(대장)", title: "장(대장) 건강관리", desc: "대장은 수분을 흡수하고 대변을 만들어요. 용종이 암으로 진행할 수 있어 정기 검진이 중요합니다.",
    care: ["섬유질(채소·통곡)↑, 붉은/가공육↓, 규칙적 운동·체중관리", "금연·절주, 충분한 수분·규칙적 배변"],
    screen: ["만 50세 이상 1년마다 분변잠혈검사 → 양성 시 대장내시경(국가암검진)"],
    red: ["지속 혈변·심한 복통·구토(장폐색 의심) → 응급"] },
  "뇌": { al: ["뇌 건강", "뇌건강", "뇌혈관", "brain", "치매 예방"], short: "뇌", title: "뇌 건강관리", desc: "뇌는 인지·운동·감각을 총괄해요. 혈관 위험인자 관리가 뇌졸중·혈관성 치매 예방에 중요합니다.",
    care: ["혈압·혈당·콜레스테롤·부정맥 관리, 금연·절주", "규칙적 운동·인지활동·사회활동, 충분한 수면", "머리 외상 예방"],
    screen: ["혈압·혈당·지질, 위험군은 경동맥 초음파·뇌 MRI/MRA, 60세↑ 치매 조기검진"],
    red: ["갑자기 한쪽 마비·발음장애·시야장애·벼락두통 → 즉시 119"] },
  "갑상선": { al: ["갑상선", "thyroid"], short: "갑상선", title: "갑상선 건강관리", desc: "갑상선은 대사를 조절하는 호르몬을 만들어요. 기능 이상(항진·저하)이나 결절이 생길 수 있습니다.",
    care: ["요오드 적정 섭취(과다·부족 모두 주의)", "목에 만져지는 혹·체중/맥박 변화 관찰"],
    screen: ["혈액 갑상선기능검사(TSH·free T4), 결절 있으면 갑상선 초음파"],
    red: ["고열+심한 빈맥+의식저하(갑상선중독발작)·급성 목 부종/호흡곤란 → 응급"] },
  "담낭": { al: ["담낭", "쓸개", "담도", "gallbladder"], short: "담낭·담도", title: "담낭·담도 건강관리", desc: "담낭(쓸개)은 담즙을 저장했다 분비해요. 담석·염증·암이 생길 수 있습니다.",
    care: ["규칙적 식사·급격한 체중감량 피하기, 비만·대사 관리", "민물고기 생식 피하기(간흡충)"],
    screen: ["복부 초음파(담석·담낭벽), 이상 시 CT/MRI·MRCP"],
    red: ["오른쪽 윗배 통증 + 고열·오한·황달(담관염) → 즉시 응급"] },
  "전립선": { al: ["전립선", "전립샘", "prostate"], short: "전립선", title: "전립선 건강관리", desc: "전립선은 남성 생식기관으로, 나이가 들며 비대·염증·암이 생길 수 있어요.",
    care: ["채소·건강한 지방 위주 식이·체중관리, 규칙적 운동", "배뇨증상(약뇨·야간뇨) 관찰"],
    screen: ["50세 이상(가족력은 더 일찍) 혈액 PSA + 직장수지검사 상담"],
    red: ["소변을 전혀 못 봄(급성요폐)·혈뇨·심한 뼈 통증 → 진료"] },
  "방광": { al: ["방광", "bladder"], short: "방광", title: "방광 건강관리", desc: "방광은 소변을 저장·배출해요. 흡연이 방광암의 최대 위험인자입니다.",
    care: ["금연이 가장 중요, 충분한 수분", "통증 없는 혈뇨는 반드시 확인"],
    screen: ["소변검사, 혈뇨 시 소변세포검사·방광내시경"],
    red: ["통증 없는 육안적 혈뇨·소변 못 봄(응고 폐색) → 진료/응급"] },
  "눈": { al: ["눈 건강", "눈건강", "시력", "안구", "eye"], short: "눈", title: "눈 건강관리", desc: "눈은 노화·자외선·혈당에 영향을 받아요. 녹내장·황반변성·당뇨망막병증은 조기 발견이 시력을 지킵니다.",
    care: ["자외선 차단(선글라스), 혈당·혈압 관리, 금연", "디지털 눈 피로 관리(20-20-20), 루테인 등은 보조"],
    screen: ["40세 이상 정기 안압·안저검사, 당뇨 환자는 매년 안저검사"],
    red: ["갑작스런 시력저하·눈 통증+구토·커튼처럼 가리는 시야 → 즉시 안과"] },
};
function multiOrganCounsel(text) {
  const t = (text || "");
  const keys = Object.keys(ORGAN_CARE).filter((k) => ORGAN_CARE[k].al.some((a) => t.includes(a)));
  const uniq = [...new Set(keys)];
  if (uniq.length < 2) return null; // 2개 이상 장기를 함께 물을 때만 분리 응답
  const list = uniq.slice(0, 4).map((k) => ORGAN_CARE[k]);
  const bubbles = [{ kind: "text", text: `${list.map((o) => o.short).join(" · ")}을(를) 나눠서 각각 안내해 드릴게요. 🩺\n※ 초안(전문가 검토 전제) — 진단·처방을 대체하지 않아요.` }];
  list.forEach((o) => {
    bubbles.push({ kind: "text", text: `【 ${o.title} 】\n${o.desc}` });
    bubbles.push({ kind: "card", card: { title: `🩺 ${o.short} — 관리 · 검진`, items: [...o.care, ...o.screen.map((s) => `🔬 ${s}`)], buttons: ["🏥 병원·진료 안내"] } });
    if ((o.red || []).length) bubbles.push({ kind: "card", card: { title: `🚨 ${o.short} — 이런 증상은 즉시 진료`, items: o.red, buttons: [] } });
  });
  return { bubbles, quicks: list.slice(0, 3).map((o) => `${o.short} 정밀검사`).concat(["내 리포트 요약"]) };
}
/* ── 다중 질환/암 분리 응답 — "위암 대장암 차이"처럼 여러 주제를 물으면 각각 요약 + 자세히 ── */
function collectTopics(text) {
  const t = (text || ""); const out = []; const seen = new Set();
  const add = (name, obj) => { if (!seen.has(name)) { seen.add(name); out.push(obj); } };
  CANCER_KB.forEach((c) => { if (c.keys.some((k) => t.includes(k))) add(c.name, { name: c.name, kind: "cancer", c }); });
  COUNSEL_KB.forEach((e) => { if (e.name !== "암 조기검진" && e.keys.some((k) => t.includes(k))) add(e.name, { name: e.name, kind: "counsel", e }); });
  if (typeof DZ_GROUPS !== "undefined") DZ_GROUPS.forEach((g) => g.members.forEach((m) => { if (m.keys.some((k) => t.includes(k))) add(m.name, { name: m.name, kind: "disease", m }); }));
  return out;
}
function multiTopicCounsel(text) {
  if (/자세히|자세하게/.test(text || "")) return null; // 개별 상세 요청은 통과
  const topics = collectTopics(text);
  if (topics.length < 2) return null;
  const cmp = /차이|비교|vs|다른점|구분|감별|둘다|모두/.test(text || "");
  const first = (s) => (s || "").split(/[.。]\s?/)[0];
  const list = topics.slice(0, 4);
  const bubbles = [{ kind: "text", text: `${list.map((x) => x.name).join(" · ")}을(를) 나눠서 ${cmp ? "비교·" : ""}안내해 드릴게요. 🩺\n※ 초안(전문가 검토 전제) — 진단·처방을 대체하지 않아요.` }];
  list.forEach((x) => {
    if (x.kind === "cancer") { const c = x.c; const sym = c.sym.find((s) => !/무증상/.test(s)) || c.sym[0];
      bubbles.push({ kind: "card", card: { title: `🎗 ${c.name}`, items: [`${first(c.desc)}.`, `위험인자: ${c.risk[0]}`, `대표 증상: ${sym}`, `검진: ${c.screen[0]}`], buttons: [`${c.name} 자세히`] } });
    } else if (x.kind === "counsel") { const e = x.e;
      bubbles.push({ kind: "card", card: { title: `🩺 ${e.name}`, items: [`${first(e.def)}.`, `차이: ${e.diff[0]}`, `관리: ${e.manage[0]}`], buttons: [`${e.name} 자세히`] } });
    } else { const m = x.m;
      bubbles.push({ kind: "card", card: { title: `🩺 ${m.name}`, items: [m.def, `주요 증상: ${m.sym}`, `검진: ${m.screen}`].filter(Boolean), buttons: [`${m.name} 자세히`] } });
    }
  });
  return { bubbles, quicks: list.slice(0, 3).map((x) => `${x.name} 자세히`).concat(["내 리포트 요약"]) };
}
function counselAnswer(text) {
  const t = (text || "");
  const e = COUNSEL_KB.find((c) => c.keys.some((k) => t.includes(k)));
  if (!e) return null;
  return {
    bubbles: [
      { kind: "text", text: `${e.name}에 대해 안내해 드릴게요.\n\n${e.def}` },
      { kind: "card", card: { title: "🔎 다른 질환과의 차이 (감별)", items: e.diff, buttons: [] } },
      { kind: "card", card: { title: "🩺 관리 방법", items: e.manage, buttons: [] } },
      { kind: "card", card: { title: "🔬 검진·조기진단", items: e.screen, buttons: ["🔬 특수검진 정밀검사 보기"] } },
      ...deepCards(e.name),
    ],
    quicks: ["치매와 파킨슨 차이", "국가암검진 안내", "내 리포트 요약"],
  };
}
/* ── 계통별 질환 카테고리 — 같은 계열 질환을 증상 차이로 감별 + 관리·검진·영양·기기·생활습관 ── */
const DZ_GROUPS = [
  {
    key: "women", label: "여성질환 · 비뇨생식계(N)",
    members: [
      { name: "방광염", keys: ["방광염", "빈뇨", "잔뇨", "소변 자주", "오줌 자주", "소변볼때"], def: "방광에 세균(주로 대장균)이 침입해 생기는 염증. 여성은 요도가 짧아(3~4cm) 흔해요.", sym: "빈뇨·배뇨통·잔뇨감·하복부 불편(발열은 드묾)", screen: "소변검사(+문진)로 진단, 항생제 치료. 자주 반복되면 비뇨의학과 정밀검사를 받으세요.", nutri: ["수분 충분히(1.5~2L)", "크랜베리(프로안토시아니딘)", "프로바이오틱스(유산균)", "비타민C"], avoid: ["카페인·알코올(방광 자극)", "탄산·매운 음식", "과도한 당분"], device: ["온열 패드(하복부 완화)", "좌욕기"], life: ["소변 참지 않고 완전 배뇨", "성관계 후 배뇨", "앞→뒤 방향 위생", "면 속옷·통풍"] },
      { name: "요도염", keys: ["요도염", "요도 분비물", "배뇨통", "소변 따가"], def: "요도에 생기는 염증. 배뇨통·분비물이 특징이며 성매개 감염과 관련될 수 있어요.", sym: "배뇨 시 통증·요도 분비물·가려움(방광염과 혼동 쉬움)", screen: "소변·분비물 검사(필요 시 성매개감염 검사). 원인균에 맞춘 항생제.", nutri: ["수분 충분히", "프로바이오틱스", "비타민C·아연(면역)"], avoid: ["카페인·알코올·자극적 음식"], device: ["좌욕기"], life: ["안전한 성관계·파트너 동시 치료", "위생 관리", "충분한 수분"] },
      { name: "질염", keys: ["질염", "냉이", "질 분비물", "질 가려움", "칸디다", "냉 증가"], def: "질 내 세균 균형이 무너지거나 곰팡이(칸디다)·세균·트리코모나스에 감염돼 생기는 염증.", sym: "질 분비물(냉) 색·냄새 변화·가려움·작열감(배뇨통보다 분비물·가려움 중심)", screen: "질 분비물 검사(간단·통증 적음). 원인별(항진균·항생제) 치료.", nutri: ["유산균(락토바실러스)·프로바이오틱스", "발효식품", "충분한 수분"], avoid: ["과도한 당분(칸디다 증식)", "잦은 질 세정제(정상 균총 파괴)"], device: ["좌욕기"], life: ["면 속옷·통풍·건조 유지", "꽉 끼는 옷 피하기", "질 내 세정 지양", "면역력 관리"] },
      { name: "자궁근종", keys: ["자궁근종", "근종", "생리 과다", "월경 과다", "생리량 많"], def: "자궁 근육에 생기는 양성종양. 에스트로겐 영향으로 자라며 가임기 여성에 흔해요.", sym: "생리과다·골반통·빈혈·압박 증상(무증상도 많음)", screen: "골반 초음파로 진단·추적(무증상 시 3~6개월 추적관찰), 필요 시 MRI.", nutri: ["섬유질(과잉 에스트로겐 배출)", "오메가3(연어·고등어·아마씨·호두)", "비타민D", "녹색채소"], avoid: ["과도한 붉은 고기·포화지방", "과음(에스트로겐 대사 부담)", "정제당"], device: ["온열 패드(골반통 완화)"], life: ["정기 초음파 추적", "체중·혈당 관리", "규칙적 운동", "빈혈 시 철분 관리"] },
      { name: "자궁내막증", keys: ["자궁내막증", "심한 생리통", "골반통", "성교통", "생리통 심"], def: "자궁내막 조직이 자궁 밖(난소·골반)에 자라는 질환. 폐경 전까지 진행돼 평생 관리가 필요해요.", sym: "심한 생리통·만성 골반통·성교통·난임(일반 생리통보다 심함)", screen: "골반 초음파(혹 있으면)·MRI. 유착만 있으면 영상 진단이 어려워 전문의 진료가 필요.", nutri: ["항염 식이·오메가3", "섬유질·과일채소", "비타민D"], avoid: ["트랜스지방·붉은 고기", "과도한 정제당·알코올"], device: ["온열 패드(골반통 완화)"], life: ["당뇨·고혈압처럼 평생 관리", "규칙적 운동·스트레스 관리", "정기 추적"] },
    ],
  },
  {
    key: "gi", label: "소화기질환 · 위장(K)",
    members: [
      { name: "위염", keys: ["위염", "속쓰림", "명치", "소화불량", "더부룩"], def: "위 점막에 생기는 염증(급성·만성). 헬리코박터·약물·자극적 음식·스트레스가 원인이에요.", sym: "명치 통증·속쓰림·더부룩함·구역(위·십이지장궤양은 통증 리듬이 뚜렷)", screen: "위내시경(+헬리코박터 검사)로 진단·조직검사.", nutri: ["규칙적 식사", "양배추·브로콜리", "프로바이오틱스"], avoid: ["맵고 기름진·짠 음식", "카페인·알코올", "진통제(NSAIDs) 남용"], device: [], life: ["소량씩 규칙적 식사", "금연·절주", "식후 바로 눕지 않기", "스트레스 관리"] },
      { name: "위·십이지장궤양", keys: ["궤양", "위궤양", "십이지장"], def: "위·십이지장 점막이 깊게 헐어 생기는 병. 헬리코박터·진통제가 주원인이에요.", sym: "공복/식후 명치통증·속쓰림, 흑색변·토혈은 응급 신호", screen: "위내시경·헬리코박터 검사. 제균 치료가 핵심.", nutri: ["규칙적 식사", "단백질·비타민", "프로바이오틱스"], avoid: ["NSAIDs·아스피린", "술·담배", "자극적 음식"], device: [], life: ["헬리코박터 제균 치료 준수", "금연·절주", "흑색변·토혈 시 즉시 진료"] },
      { name: "역류성식도염", keys: ["역류", "신물", "가슴쓰림", "목 이물감"], def: "위산이 식도로 역류해 식도 점막에 염증이 생기는 병.", sym: "가슴쓰림·신물 역류·목 이물감·만성기침(위염은 명치 중심)", screen: "위내시경(필요 시 24시간 산도검사).", nutri: ["소량 식사", "저지방식"], avoid: ["카페인·초콜릿·탄산·기름진 음식", "취침 전 식사·과식"], device: ["침대 머리쪽 높이기(경사 베개)"], life: ["식후 3시간 눕지 않기", "체중 감량", "금연·절주"] },
      { name: "과민성대장증후군", keys: ["과민성", "과민성대장", "설사 변비", "배가 자주"], def: "기질적 이상 없이 복통과 배변 습관 변화가 반복되는 기능성 장질환.", sym: "복통과 함께 설사/변비 반복·배변 후 완화(내시경상 이상은 없음)", screen: "기질적 질환 배제 위해 대장내시경 등 검사.", nutri: ["저포드맵(FODMAP) 식이", "수용성 식이섬유", "프로바이오틱스"], avoid: ["과도한 카페인·알코올", "기름진·매운 음식·과식"], device: [], life: ["규칙적 식사·수면", "스트레스 관리", "규칙적 운동"] },
      { name: "지방간", keys: ["지방간", "간수치", "간이 안좋"], def: "간에 지방이 과도하게 쌓인 상태. 비만·음주·대사증후군과 관련돼요.", sym: "대개 무증상·피로·오른쪽 윗배 불편", screen: "복부 초음파·간수치(혈액)·섬유화 검사.", nutri: ["채소·식이섬유", "오메가3", "커피(적당)"], avoid: ["과당·정제당", "술", "포화지방·튀김"], device: ["체지방계(체중)"], life: ["체중 7~10% 감량", "유산소·근력운동", "절주·금주"] },
    ],
  },
  {
    key: "cardio", label: "순환기질환 · 심혈관(I)",
    members: [
      { name: "고혈압", keys: ["고혈압", "혈압이 높", "혈압 높"], def: "동맥 혈압이 지속적으로 높은 상태. 심뇌혈관 질환의 가장 큰 위험인자예요.", sym: "대개 무증상·두통·어지럼(합병증 전까지 조용)", screen: "가정혈압 측정·정기 혈압검사·표적장기(심장·신장·눈) 검사.", nutri: ["칼륨(채소·과일)", "마그네슘", "오메가3", "저염(DASH 식단)"], avoid: ["나트륨(짠 음식)", "과음", "카페인 과다"], device: ["가정용 자동혈압계"], life: ["저염식·체중관리", "유산소 운동", "금연·절주", "스트레스 관리"] },
      { name: "이상지질혈증", keys: ["고지혈", "이상지질", "콜레스테롤", "중성지방"], def: "혈중 콜레스테롤·중성지방이 높은 상태. 동맥경화·심혈관질환의 원인이에요.", sym: "무증상(대개 피검사로 발견)", screen: "공복 지질검사(총콜레스테롤·LDL·HDL·중성지방).", nutri: ["오메가3", "식이섬유(귀리·콩)", "견과류", "식물성 스테롤"], avoid: ["포화지방·트랜스지방", "정제당", "과음"], device: [], life: ["유산소 운동", "체중관리", "금연", "LDL 목표 관리"] },
      { name: "부정맥", keys: ["부정맥", "두근", "심장이 두근", "맥이"], def: "심장 박동이 불규칙하거나 너무 빠르거나 느린 상태. 심방세동은 뇌졸중 위험을 높여요.", sym: "두근거림·가슴 답답·어지럼·실신", screen: "심전도·24시간 홀터·심장초음파.", nutri: ["마그네슘·칼륨", "오메가3", "충분한 수분"], avoid: ["카페인·알코올·에너지드링크", "과도한 자극"], device: ["웨어러블 심전도/심박 측정기"], life: ["카페인·음주 절제", "충분한 수면", "심방세동 시 항응고 관리"] },
      { name: "협심증", keys: ["협심증", "관상동맥", "가슴이 조이", "가슴 답답"], def: "심장 근육에 혈액을 공급하는 관상동맥이 좁아져 생기는 흉통.", sym: "운동·스트레스 시 가슴 압박·조이는 통증(안정 시 완화)·목·팔 방사통", screen: "운동부하검사·관상동맥 CT·심전도.", nutri: ["오메가3", "식이섬유", "채소·과일"], avoid: ["포화지방·트랜스지방", "흡연", "과음"], device: ["가정용 혈압계"], life: ["금연 필수", "혈압·혈당·지질 관리", "규칙적 운동", "가슴통증 지속 시 즉시 119"] },
    ],
  },
  {
    key: "endo", label: "내분비·대사질환 · 호르몬(E)",
    members: [
      { name: "당뇨병", keys: ["당뇨", "혈당이 높", "혈당 높", "당뇨병"], def: "인슐린 부족·저항으로 혈당이 높아지는 대사질환. 합병증 예방이 핵심이에요.", sym: "다뇨·갈증·체중감소·피로(초기 무증상 많음)", screen: "공복혈당·당화혈색소(HbA1c)·합병증(눈·신장·신경) 검사.", nutri: ["식이섬유", "마그네슘", "통곡물·저GI 식품"], avoid: ["정제당·단순당", "포화지방", "과음"], device: ["혈당계·연속혈당측정기(CGM)"], life: ["규칙적 식사·탄수화물 관리", "유산소+근력운동", "체중관리", "금연"] },
      { name: "갑상선기능저하증", keys: ["갑상선저하", "갑상선기능저하", "갑상선 저하"], def: "갑상선호르몬이 부족해 대사가 느려지는 병.", sym: "피로·추위 민감·체중증가·변비·서맥·부종", screen: "갑상선기능검사(TSH·T4)·항체.", nutri: ["요오드(적정)", "셀레늄", "철분"], avoid: ["과도한 요오드", "생 십자화채소·콩 과다"], device: [], life: ["처방 갑상선호르몬 규칙 복용", "정기 TSH 추적", "규칙적 운동"] },
      { name: "갑상선기능항진증", keys: ["갑상선항진", "갑상선기능항진", "갑상선 항진"], def: "갑상선호르몬이 과다해 대사가 빨라지는 병(그레이브스병 등).", sym: "체중감소·더위 민감·두근거림·손떨림·불안·설사", screen: "갑상선기능검사(TSH↓·T4↑)·항체·초음파.", nutri: ["칼로리·단백질 보충", "칼슘·비타민D"], avoid: ["과도한 요오드(미역·김 과다)", "카페인"], device: [], life: ["항갑상선제 복용 준수", "정기 추적", "눈 증상 시 안과"] },
      { name: "골다공증", keys: ["골다공", "뼈가 약", "골밀도"], def: "뼈의 양·질이 줄어 골절 위험이 높아지는 병. 폐경 후 여성에 흔해요.", sym: "무증상·골절로 발견·키 감소·등 굽음", screen: "골밀도검사(DEXA).", nutri: ["칼슘", "비타민D", "단백질", "마그네슘"], avoid: ["과음·흡연", "과도한 카페인·나트륨"], device: ["체중부하 운동기구"], life: ["체중부하·근력운동", "낙상 예방", "금연·절주", "햇볕(비타민D)"] },
    ],
  },
  {
    key: "msk", label: "근골격질환 · 관절·뼈(M)",
    members: [
      { name: "골관절염", keys: ["골관절염", "퇴행성관절염", "무릎이 아", "관절이 아"], def: "연골이 닳아 생기는 퇴행성 관절질환. 나이·체중·과사용과 관련돼요.", sym: "활동 시 악화·쉬면 완화되는 관절통·짧은 조조강직·부종", screen: "X-ray·관절 진찰.", nutri: ["오메가3", "비타민D", "글루코사민·콜라겐(참고)"], avoid: ["과체중(관절 부담)", "고강도 충격 운동"], device: ["온열 찜질기", "보조기·지팡이"], life: ["체중 감량", "저충격 운동(수영·자전거)", "근력 강화"] },
      { name: "류마티스관절염", keys: ["류마티스", "류마티스관절염", "여러 관절"], def: "자가면역으로 여러 관절에 대칭성 염증이 생기는 만성질환.", sym: "여러 관절 대칭성 통증·1시간 이상 조조강직·전신 피로(퇴행성과 달리 아침에 심함)", screen: "류마티스인자·항CCP·염증수치·X-ray.", nutri: ["오메가3", "항염 식이", "비타민D"], avoid: ["가공식품·정제당", "흡연"], device: ["온·냉 찜질기"], life: ["항류마티스제(DMARDs) 조기치료", "관절 보호·운동", "금연"] },
      { name: "통풍", keys: ["통풍", "요산", "엄지발가락"], def: "요산 결정이 관절에 쌓여 급성 염증을 일으키는 병.", sym: "엄지발가락 등 급성 관절통·발적·부종(밤에 심함)", screen: "혈중 요산·관절액 검사.", nutri: ["수분 충분히", "저지방 유제품", "비타민C"], avoid: ["고퓨린(내장·붉은고기·등푸른생선 과다)", "맥주·과당·과음"], device: [], life: ["체중관리·절주", "수분 섭취", "요산강하제 복용 준수"] },
      { name: "허리디스크", keys: ["허리디스크", "디스크", "추간판", "허리 다리 저림"], def: "추간판(디스크)이 튀어나와 신경을 눌러 통증·저림을 일으키는 병.", sym: "허리통증+다리 방사통(저림)·기침 시 악화", screen: "MRI·신경학적 검사.", nutri: ["항염 식이", "비타민D·칼슘"], avoid: ["장시간 앉기·무거운 것 들기", "흡연"], device: ["요추 지지대·온열기", "자세 교정 방석"], life: ["코어 강화 운동", "바른 자세", "체중관리", "급성기 안정 후 조기 활동"] },
    ],
  },
  {
    key: "resp", label: "호흡기질환 · 폐(J)",
    members: [
      { name: "천식", keys: ["천식", "쌕쌕", "천명", "숨이 차"], def: "기도의 만성 염증으로 발작적 기침·천명·호흡곤란이 반복되는 병.", sym: "쌕쌕거림(천명)·발작성 기침·호흡곤란·가슴 답답(밤·새벽 악화)", screen: "폐기능검사(스파이로메트리)·기관지확장/유발 검사·알레르기 검사.", nutri: ["오메가3", "비타민D", "항산화 과일·채소"], avoid: ["알레르겐·미세먼지", "흡연·간접흡연", "찬 공기 급노출"], device: ["흡입기(스페이서)", "피크플로미터(최대호기유량)", "공기청정기"], life: ["흡입 스테로이드 규칙 사용", "유발인자 회피", "금연", "독감·폐렴 예방접종"] },
      { name: "COPD", keys: ["copd", "만성폐쇄", "폐기종", "만성기관지염"], def: "주로 흡연으로 기도·폐포가 손상돼 숨길이 좁아지는 진행성 폐질환.", sym: "만성 기침·가래·점점 심해지는 호흡곤란(활동 시)", screen: "폐기능검사(스파이로메트리)·흉부 X-ray/CT.", nutri: ["충분한 단백질·칼로리", "항산화 영양"], avoid: ["흡연(절대 금연)", "대기오염·미세먼지"], device: ["흡입기", "가정용 산소포화도 측정기", "네뷸라이저"], life: ["금연 필수", "호흡재활·운동", "독감·폐렴 예방접종", "급성악화 시 진료"] },
      { name: "알레르기비염", keys: ["비염", "알레르기비염", "콧물", "재채기", "코막힘"], def: "알레르겐에 코 점막이 과민 반응해 생기는 염증.", sym: "재채기·맑은 콧물·코막힘·코 가려움(감기와 달리 발열 없고 반복)", screen: "알레르기 피부반응·혈액(IgE) 검사.", nutri: ["비타민C·D", "프로바이오틱스", "오메가3"], avoid: ["집먼지진드기·꽃가루·반려동물 털", "미세먼지"], device: ["코 세척기(생리식염수)", "공기청정기", "제습기"], life: ["항히스타민·비강 스테로이드 사용", "알레르겐 회피·환경관리", "침구 관리"] },
      { name: "만성기침", keys: ["만성기침", "기침이 오래", "기침 계속"], def: "8주 이상 지속되는 기침. 후비루·역류·천식이 흔한 원인이에요.", sym: "8주 이상 지속 기침(원인별로 동반 증상 다름)", screen: "흉부 X-ray·폐기능·필요 시 역류/부비동 검사.", nutri: ["수분 충분히", "꿀(대증)", "항염 식이"], avoid: ["흡연·자극적 연기", "찬 공기·건조"], device: ["가습기", "공기청정기"], life: ["원인 질환 치료(천식·역류·비염)", "금연", "실내 습도 유지"] },
    ],
  },
  {
    key: "renal", label: "신장·비뇨질환 · 콩팥(N)",
    members: [
      { name: "만성콩팥병", keys: ["콩팥", "신장", "만성콩팥", "신부전", "거품뇨", "단백뇨"], def: "콩팥 기능이 서서히 떨어지는 병. 당뇨·고혈압이 주원인이에요.", sym: "초기 무증상·부종·피로·야간뇨·거품뇨(진행 시)", screen: "eGFR(사구체여과율)·요단백·크레아티닌 혈액검사.", nutri: ["단계별 단백질 조절", "수분 적정"], avoid: ["나트륨·칼륨·인 과다(진행 시)", "NSAIDs 진통제", "과도한 단백질"], device: ["가정용 혈압계"], life: ["혈압·혈당 철저 관리", "저염식", "신독성 약물 주의", "정기 신장 검사"] },
      { name: "전립선비대증", keys: ["전립선", "전립선비대", "소변줄기 약", "야간뇨"], def: "나이 들며 전립선이 커져 배뇨 장애가 생기는 남성 질환.", sym: "약한 소변줄기·잔뇨감·야간뇨·빈뇨·배뇨 지연", screen: "직장수지검사·PSA·요류검사·초음파(전립선암 감별 포함).", nutri: ["아연", "토마토(리코펜)", "쏘팔메토(참고)"], avoid: ["과도한 카페인·알코올(특히 취침 전)", "항히스타민제(배뇨 악화)"], device: [], life: ["취침 전 수분 절제", "규칙적 배뇨", "PSA로 전립선 정기검진"] },
      { name: "요로결석", keys: ["요로결석", "결석", "옆구리 통증", "신장결석"], def: "소변 성분이 뭉쳐 요로에 생긴 돌. 극심한 옆구리 통증이 특징이에요.", sym: "갑작스러운 극심한 옆구리·하복부 통증·혈뇨·구역", screen: "요검사·비조영 CT·초음파.", nutri: ["수분 충분히(하루 2L+)", "구연산(레몬)", "적정 칼슘"], avoid: ["과도한 나트륨·동물성 단백질", "수산 많은 음식 과다(시금치 등)", "과당"], device: [], life: ["수분 충분히 섭취", "재발 예방 식이", "통증·발열 시 응급"] },
    ],
  },
  {
    key: "mental", label: "정신건강 · 마음(F)",
    members: [
      { name: "우울증", keys: ["우울", "우울증", "의욕이 없", "무기력", "우울해"], def: "지속적인 우울감·흥미 저하로 일상이 어려워지는 병. 치료가 잘 되는 질환이에요.", sym: "2주 이상 우울·흥미상실·수면/식욕 변화·무기력·집중저하", screen: "정신건강의학과 진료·우울척도(PHQ-9). ※ 자살 생각이 들면 즉시 1393(자살예방상담).", nutri: ["오메가3", "비타민D", "트립토판·마그네슘", "규칙적 식사"], avoid: ["과음·카페인 과다", "고정제당"], device: ["광치료기(계절성)"], life: ["규칙적 운동·햇볕", "수면 위생", "전문 상담·약물치료", "고립 피하기"] },
      { name: "불안장애", keys: ["불안", "불안장애", "초조", "걱정이 많"], def: "과도한 걱정·긴장이 지속돼 일상에 지장을 주는 병.", sym: "과도한 걱정·초조·긴장·두근거림·근긴장·수면장애", screen: "정신건강의학과 진료·불안척도(GAD-7).", nutri: ["마그네슘", "오메가3", "카페인 줄이기"], avoid: ["카페인·알코올", "자극적 콘텐츠"], device: [], life: ["복식호흡·이완요법", "규칙적 운동", "인지행동치료·필요 시 약물", "수면 관리"] },
      { name: "불면증", keys: ["불면", "불면증", "잠이 안", "잠을 못"], def: "잠들기·유지가 어려운 상태가 반복돼 낮 기능이 떨어지는 병.", sym: "입면 지연·자주 깸·이른 각성·주간 피로", screen: "수면 문진·필요 시 수면다원검사.", nutri: ["마그네슘", "트립토판(따뜻한 우유)", "저녁 카페인 제한"], avoid: ["저녁 카페인·알코올", "취침 전 스마트폰(블루라이트)", "낮잠 과다"], device: ["수면 추적 웨어러블", "백색소음기"], life: ["일정한 취침·기상", "침실은 어둡고 시원하게", "자기 전 이완", "수면제한요법(CBT-I)"] },
      { name: "공황장애", keys: ["공황", "공황장애", "공황발작"], def: "예기치 못한 극심한 공포 발작(공황발작)이 반복되는 병.", sym: "갑작스러운 심한 두근거림·호흡곤란·어지럼·죽을 것 같은 공포(수분 내 최고조)", screen: "정신건강의학과 진료(심장 등 신체질환 배제 검사 병행).", nutri: ["카페인 줄이기", "마그네슘", "규칙적 식사"], avoid: ["카페인·알코올·자극제", "과호흡"], device: [], life: ["복식호흡·이완", "인지행동치료·약물", "규칙적 생활", "발작은 위험하지 않음을 이해"] },
    ],
  },
  {
    key: "ent", label: "안·이비인후질환 · 눈·귀(H)",
    members: [
      { name: "백내장", keys: ["백내장", "눈이 뿌옇", "시야 흐릿"], def: "수정체가 혼탁해져 시야가 흐려지는 노인성 눈질환.", sym: "점진적 시야 흐림·눈부심·색 바랜 시야(통증 없음)", screen: "안과 세극등·시력검사.", nutri: ["루테인·지아잔틴", "비타민C·E", "오메가3"], avoid: ["자외선(선글라스 필요)", "흡연", "고혈당"], device: ["자외선 차단 선글라스"], life: ["자외선 차단", "금연·혈당관리", "정기 안과검진", "진행 시 수술"] },
      { name: "녹내장", keys: ["녹내장", "안압", "시야가 좁"], def: "안압 등으로 시신경이 손상돼 시야가 좁아지는 병(실명 원인).", sym: "초기 무증상·주변 시야 좁아짐(급성은 안통·두통·구토)", screen: "안압·시신경(OCT)·시야검사.", nutri: ["항산화 영양", "오메가3"], avoid: ["과도한 카페인(일시적 안압)", "엎드린 자세 장시간"], device: [], life: ["안압 낮추는 안약 규칙 점안", "정기 안과검진(조기발견 중요)", "급성 안통 시 응급"] },
      { name: "이명", keys: ["이명", "귀에서 소리", "귀울림", "삐 소리"], def: "외부 소리 없이 귀에서 소리가 들리는 증상.", sym: "삐-·윙- 등 귀울림(수면·집중 방해)", screen: "청력검사·이과 진찰(원인 감별).", nutri: ["마그네슘·아연", "비타민B12"], avoid: ["큰 소음·이어폰 과사용", "카페인·니코틴", "스트레스"], device: ["소리치료기(백색소음)", "보청기(난청 동반 시)"], life: ["소음 노출 줄이기", "스트레스·수면 관리", "기저질환 치료"] },
      { name: "어지럼", keys: ["어지럼", "어지러", "현훈", "이석증", "빙빙"], def: "균형을 담당하는 전정기관 문제 등으로 생기는 어지럼.", sym: "빙빙 도는 어지럼(현훈)·자세 변화 시 악화·구역(이석증 등)", screen: "전정기능·청력검사·이과/신경과 진찰.", nutri: ["수분", "마그네슘"], avoid: ["급격한 머리 움직임", "탈수·과음", "카페인 과다"], device: [], life: ["이석정복술(이석증)", "전정재활운동", "천천히 자세 변경", "마비·발음장애 동반 시 즉시 119"] },
    ],
  },
  {
    key: "skin", label: "피부질환 · 피부(L)",
    members: [
      { name: "아토피피부염", keys: ["아토피", "가려움", "습진", "피부 건조"], def: "가려움과 재발성 습진이 특징인 만성 알레르기 피부염.", sym: "심한 가려움·건조·습진(접히는 부위)·재발(밤에 심함)", screen: "피부 진찰·알레르기 검사.", nutri: ["오메가3", "비타민D", "프로바이오틱스"], avoid: ["악화 음식(개인차)", "뜨거운 물 목욕·과한 비누", "건조·땀·자극"], device: ["가습기", "저자극 보습기"], life: ["충분한 보습(하루 여러 번)", "미지근한 물 짧은 샤워", "면 소재·자극 회피", "처방 약(스테로이드/면역조절제) 준수"] },
      { name: "건선", keys: ["건선", "비늘", "각질이 두꺼"], def: "면역 이상으로 피부가 붉고 두꺼워지며 은백색 각질이 생기는 만성질환.", sym: "은백색 비늘 덮인 붉은 판(무릎·팔꿈치·두피)·가려움(관절 침범 가능)", screen: "피부 진찰(필요 시 조직검사)·관절 침범 평가.", nutri: ["오메가3", "비타민D", "항염 식이"], avoid: ["흡연·과음", "스트레스", "외상·자극"], device: ["광선치료(병원)", "보습기"], life: ["보습·적정 자외선", "금연·절주·체중관리", "스트레스 관리", "관절 증상 시 류마티스 협진"] },
      { name: "대상포진", keys: ["대상포진", "포진", "띠 모양", "신경통"], def: "수두 바이러스가 재활성화돼 신경을 따라 통증·수포가 생기는 병.", sym: "한쪽 신경 따라 띠 모양 수포·심한 통증·화끈거림(발진 전 통증 선행)", screen: "임상 진단(수포 양상). 72시간 내 치료가 중요.", nutri: ["단백질·비타민", "수분", "면역 지원"], avoid: ["과로·스트레스(면역 저하)"], device: [], life: ["72시간 내 항바이러스제 시작", "50세 이상 예방접종", "신경통 지속 가능·통증관리", "휴식·면역 관리"] },
      { name: "두드러기", keys: ["두드러기", "팽진", "피부가 부풀", "발진 가려움"], def: "피부에 팽진(부풀어오름)과 가려움이 나타나는 알레르기 반응.", sym: "가려운 팽진이 생겼다 사라짐·혈관부종(입술·눈)·만성은 6주 이상", screen: "유발인자 문진·필요 시 알레르기 검사.", nutri: ["항히스타민 식이", "비타민C·D"], avoid: ["유발 음식·약물", "열·압박·스트레스"], device: [], life: ["항히스타민제", "유발인자 회피", "호흡곤란·입술부종 시 즉시 응급(아나필락시스)"] },
    ],
  },
  {
    key: "cancer", label: "주요암 · 국가암검진(C)",
    members: [
      { name: "위암", keys: ["위암"], def: "위 점막에서 생기는 암. 초기 무증상이 많아 정기 검진이 핵심이에요.", sym: "소화불량·상복부 불편·체중감소·흑색변(초기 무증상 많음)", screen: "국가암검진: 만 40세 이상 2년마다 위내시경.", nutri: ["신선한 채소·과일", "비타민C"], avoid: ["짠 음식·염장·훈제식품", "가공육", "흡연·과음", "헬리코박터 방치"], device: [], life: ["헬리코박터 치료", "금연·절주", "정기 위내시경"] },
      { name: "대장암", keys: ["대장암", "직장암"], def: "대장·직장 점막에서 생기는 암. 용종에서 진행하며 조기발견 시 완치율이 높아요.", sym: "배변습관 변화·혈변·복통·체중감소·빈혈", screen: "국가암검진: 만 50세 이상 매년 분변잠혈검사(이상 시 대장내시경).", nutri: ["식이섬유(채소·통곡물)", "칼슘·비타민D"], avoid: ["붉은 고기·가공육", "과음·흡연", "고지방식"], device: [], life: ["50세부터 정기검진", "섬유질 식이·운동", "금연·절주"] },
      { name: "간암", keys: ["간암"], def: "간에서 생기는 암. B/C형 간염·간경변이 주요 위험요인이에요.", sym: "무증상·우상복부통·체중감소·황달(진행 시)", screen: "고위험군(간경변·B/C형 간염) 6개월마다 초음파+AFP(혈액).", nutri: ["균형 식이", "커피(적당)"], avoid: ["음주(금주 권장)", "아플라톡신(곰팡이 곡물)", "흡연"], device: [], life: ["B형간염 예방접종·C형 치료", "금주", "고위험군 6개월 검진"] },
      { name: "폐암", keys: ["폐암"], def: "폐에서 생기는 암. 흡연이 최대 위험인자예요.", sym: "만성 기침·객혈·호흡곤란·체중감소·흉통", screen: "고위험 흡연자(30갑년 이상, 54~74세) 2년마다 저선량 흉부CT.", nutri: ["항산화 채소·과일"], avoid: ["흡연·간접흡연", "라돈·미세먼지"], device: [], life: ["금연이 최선의 예방", "고위험군 저선량CT", "직업적 발암물질 관리"] },
      { name: "유방암", keys: ["유방암", "유방에 멍울", "가슴에 멍울"], def: "유방 조직에서 생기는 여성암 1위. 조기발견 시 예후가 좋아요.", sym: "유방 멍울·유두 분비물·피부/유두 변화(통증 없는 경우 많음)", screen: "국가암검진: 만 40세 이상 여성 2년마다 유방촬영술.", nutri: ["채소·과일·식이섬유"], avoid: ["과음", "폐경 후 비만·체중증가", "흡연"], device: [], life: ["자가검진·정기 유방촬영", "체중관리·운동", "가족력 시 전문 상담"] },
      { name: "자궁경부암", keys: ["자궁경부암", "경부암"], def: "자궁경부에서 생기는 암. HPV 감염이 주원인이며 예방접종·검진으로 예방 가능해요.", sym: "초기 무증상·비정상 질출혈·성교 후 출혈(진행 시)", screen: "국가암검진: 만 20세 이상 여성 2년마다 자궁경부세포검사.", nutri: ["면역 지원 영양"], avoid: ["흡연", "성매개감염 방치"], device: [], life: ["HPV 예방접종", "정기 세포검사", "안전한 성생활"] },
      { name: "갑상선암", keys: ["갑상선암", "목에 혹", "갑상선 결절"], def: "갑상선에 생기는 암. 대개 진행이 느리고 예후가 좋아요.", sym: "대개 무증상·목 앞 혹(결절)·쉰 목소리·삼킴 불편(진행 시)", screen: "목 초음파·세침흡인검사(국가검진 항목 아님, 결절 시).", nutri: ["적정 요오드"], avoid: ["과도한 방사선 노출"], device: [], life: ["목 결절 발견 시 초음파", "대개 예후 양호·과잉진단 주의"] },
      { name: "전립선암", keys: ["전립선암"], def: "전립선에 생기는 남성암. 고령·가족력이 위험요인이에요.", sym: "초기 무증상·배뇨증상·혈뇨(전립선비대증과 감별 필요)", screen: "PSA 혈액검사·직장수지·조직검사(선별검사는 상담 후 결정).", nutri: ["토마토(리코펜)", "채소"], avoid: ["고지방식", "비만"], device: [], life: ["50세 이상 PSA 상담", "가족력 시 조기 상담", "식이·운동"] },
    ],
  },
  {
    key: "child", label: "소아질환 · 소아청소년(P)",
    members: [
      { name: "소아비만", keys: ["소아비만", "아이 비만", "애가 살"], def: "성장기 아동의 과체중·비만. 성인병 조기 발생 위험을 높여요.", sym: "또래보다 과체중·대사이상 조기 위험", screen: "성장도표(BMI 백분위)·대사(혈당·지질) 검사.", nutri: ["균형식·채소", "우유·단백질"], avoid: ["가당음료·패스트푸드", "과도한 스낵", "좌식·스크린 과다"], device: ["가정용 체성분계"], life: ["가당음료 줄이기", "신체활동 1시간/일", "스크린 시간 제한", "가족 함께 식습관 개선"] },
      { name: "ADHD", keys: ["adhd", "주의력결핍", "산만한 아이", "과잉행동"], def: "주의력 결핍·과잉행동·충동성이 발달수준에 비해 심한 신경발달질환.", sym: "부주의·산만·과잉행동·충동성(여러 상황에서 지속)", screen: "소아정신과·발달평가(부모/교사 평가척도).", nutri: ["규칙적 식사·오메가3", "단백질 아침식"], avoid: ["과도한 가당·인공첨가", "수면 부족", "과도한 스크린"], device: [], life: ["행동치료·필요 시 약물", "규칙적 생활·수면", "구조화된 환경", "발달재활서비스 연계"] },
      { name: "성장부진", keys: ["성장부진", "저신장", "키가 안", "키가 작"], def: "또래 대비 키가 현저히 작거나(3백분위 미만) 성장속도가 느린 상태.", sym: "또래보다 현저히 작은 키·성장속도 감소", screen: "성장도표·골연령(X-ray)·성장호르몬 등 검사.", nutri: ["단백질·칼슘·아연", "비타민D", "균형식"], avoid: ["수면 부족", "불균형 식이"], device: [], life: ["충분한 수면(성장호르몬)", "규칙적 운동", "정기 성장 추적", "원인 질환 배제"] },
      { name: "모세기관지염", keys: ["모세기관지염", "rsv", "영유아 기침", "아기 쌕쌕"], def: "영유아에서 RSV 등으로 세기관지에 생기는 염증.", sym: "콧물·기침 후 쌕쌕거림·호흡곤란·수유곤란(영유아)", screen: "임상 진단·필요 시 흉부X-ray·RSV 검사.", nutri: ["수분·수유 유지"], avoid: ["간접흡연", "밀집·감염 노출"], device: ["가습기", "콧물 흡인기"], life: ["수분 유지·콧물 관리", "호흡곤란·청색증 시 즉시 응급", "손위생·예방"] },
    ],
  },
  {
    key: "infect", label: "감염질환 · 감염(A/B)",
    members: [
      { name: "인플루엔자", keys: ["독감", "인플루엔자", "고열 근육통"], def: "인플루엔자 바이러스에 의한 급성 호흡기 감염(일반 감기보다 전신증상이 심함).", sym: "갑작스러운 고열·근육통·오한·기침(감기보다 전신증상 심함)", screen: "임상·신속항원검사.", nutri: ["수분·휴식", "비타민C·D"], avoid: ["과로", "감염 노출"], device: ["체온계"], life: ["매년 독감 예방접종", "손위생·마스크", "고위험군 항바이러스제"] },
      { name: "폐렴", keys: ["폐렴", "폐렴증상"], def: "폐 실질에 생기는 감염성 염증. 고령·만성질환자에 위험해요.", sym: "고열·기침·화농성 가래·호흡곤란·흉통", screen: "흉부X-ray·혈액·객담검사.", nutri: ["수분·단백질", "휴식"], avoid: ["흡연", "면역저하 방치"], device: ["산소포화도 측정기", "체온계"], life: ["폐렴구균·독감 예방접종(고위험군)", "금연", "조기 진료"] },
      { name: "결핵", keys: ["결핵", "2주 이상 기침", "야간발한"], def: "결핵균에 의한 감염병. 주로 폐를 침범하며 공기로 전파돼요.", sym: "2주 이상 기침·미열·야간발한·체중감소·객혈", screen: "흉부X-ray·객담검사(도말·배양)·IGRA.", nutri: ["고단백·고열량", "비타민"], avoid: ["치료 중단(내성 위험)", "과음"], device: [], life: ["6개월 이상 약물 완치까지 복용", "전파 예방(마스크·환기)", "접촉자 검진"] },
      { name: "바이러스간염", keys: ["간염", "b형간염", "c형간염", "황달"], def: "B·C형 간염 바이러스 등에 의한 간의 염증. 만성화 시 간경변·간암 위험.", sym: "무증상·피로·황달·복부불편(만성은 조용히 진행)", screen: "간염 표지자(HBsAg·anti-HCV)·간수치·초음파.", nutri: ["균형식", "커피(적당)"], avoid: ["음주", "간독성 약물·건강기능식품 남용"], device: [], life: ["B형 예방접종", "C형 항바이러스 완치치료", "간암 정기검진(고위험군)"] },
      { name: "코로나19", keys: ["코로나", "covid", "코로나19"], def: "SARS-CoV-2 바이러스에 의한 호흡기 감염병.", sym: "발열·기침·인후통·후각/미각 저하·근육통", screen: "신속항원·PCR 검사.", nutri: ["수분·휴식", "비타민D"], avoid: ["감염 노출", "고위험군 방치"], device: ["체온계", "산소포화도 측정기"], life: ["예방접종(고위험군)", "손위생·환기", "고위험군 조기 항바이러스제"] },
    ],
  },
  {
    key: "blood", label: "혈액질환 · 혈액(D)",
    members: [
      { name: "철결핍성빈혈", keys: ["빈혈", "철결핍", "어지럽고 창백", "철분 부족"], def: "철분 부족으로 적혈구·헤모글로빈이 감소한 가장 흔한 빈혈.", sym: "피로·창백·어지럼·숨참·손발톱 변화", screen: "혈액검사(Hb·페리틴·철).", nutri: ["철분(붉은 살코기·간·시금치)", "비타민C(철 흡수↑)", "엽산·B12"], avoid: ["차·커피 식사와 동시 섭취(철 흡수↓)", "위장출혈 방치"], device: [], life: ["철분제 복용(식간·비타민C 병용)", "원인(월경과다·위장출혈) 규명", "균형 식이"] },
      { name: "혈소판감소증", keys: ["혈소판감소", "혈소판이 낮", "멍이 잘", "점상출혈"], def: "혈소판이 감소해 출혈 경향이 커지는 상태.", sym: "쉽게 멍·점상출혈·잇몸/코피·월경과다", screen: "혈액검사(혈소판수)·필요 시 골수검사.", nutri: ["균형식", "비타민K·엽산"], avoid: ["항혈소판제·아스피린 자의 복용", "과음", "외상"], device: [], life: ["출혈 유발 약물 주의", "심한 출혈 시 즉시 진료", "원인 질환 치료"] },
      { name: "백혈병", keys: ["백혈병"], def: "골수의 조혈세포가 암성으로 증식하는 혈액암.", sym: "지속 발열·피로·창백·잦은 감염·멍·출혈·뼈 통증", screen: "혈액검사(백혈구 이상)·골수검사·염색체/유전자 검사.", nutri: ["감염 예방 위생 식이", "고단백"], avoid: ["감염 노출(면역저하)", "생것·비위생 음식"], device: [], life: ["신속한 혈액종양내과 진료", "감염 예방", "치료(항암·이식) 순응"] },
      { name: "림프종", keys: ["림프종", "림프절이 붓", "목 멍울"], def: "림프계(림프절)에서 생기는 혈액암.", sym: "무통성 림프절 종대·발열·야간발한·체중감소(B증상)", screen: "림프절 조직검사·PET-CT·혈액검사.", nutri: ["균형식·고단백"], avoid: ["감염 노출", "진단 지연"], device: [], life: ["지속되는 림프절 종대 시 진료", "치료 순응", "정기 추적"] },
    ],
  },
  {
    key: "geriatric", label: "노인성질환 · 노년(R)",
    members: [
      { name: "근감소증", keys: ["근감소", "근육량 감소", "기력이 없", "자주 넘어"], def: "나이 들며 근육량·근력이 감소하는 병. 낙상·쇠약·사망 위험을 높여요.", sym: "근력 저하·보행 느림·자주 넘어짐·쉽게 지침", screen: "악력·보행속도·근육량(체성분) 측정.", nutri: ["단백질(체중당 1~1.2g)", "류신·비타민D", "오메가3"], avoid: ["단백질 부족", "과도한 안정·활동 저하"], device: ["악력계", "체성분계"], life: ["저항성(근력) 운동", "충분한 단백질", "비타민D·햇볕", "낙상 예방"] },
      { name: "노쇠", keys: ["노쇠", "허약", "기운이 없는 노인"], def: "여러 신체 기능이 떨어져 스트레스에 취약해진 상태(frailty).", sym: "체중감소·피로·근력저하·보행 느림·활동 감소", screen: "노쇠 척도·노인포괄평가(CGA).", nutri: ["충분한 단백질·열량", "다양한 영양소"], avoid: ["영양부족·고립", "다약제 부작용"], device: [], life: ["운동·영양·사회활동 병행", "복용약 정리(다약제 관리)", "예방접종", "정기 노인 기능평가"] },
      { name: "요실금", keys: ["요실금", "소변이 새", "지릴"], def: "본인 의지와 무관하게 소변이 새는 증상. 삶의 질에 큰 영향을 줘요.", sym: "기침·재채기 시 새거나(복압성)·급하게 마려움(절박성)", screen: "배뇨일지·요검사·요역동학 검사.", nutri: ["수분 적정(과도 제한 금지)"], avoid: ["카페인·알코올(방광 자극)", "변비"], device: ["골반저근(케겔) 보조기"], life: ["골반저근(케겔) 운동", "방광 훈련", "체중관리", "전문 진료(치료 가능)"] },
      { name: "연하곤란", keys: ["연하곤란", "삼킴장애", "사레", "삼키기 힘"], def: "음식·물을 삼키기 어려운 상태. 흡인성 폐렴 위험이 있어요.", sym: "삼킬 때 사레·기침·목에 걸림·식사 시간 지연", screen: "연하검사(비디오투시)·이비인후과/재활의학과 평가.", nutri: ["점도 조절식(연하식)", "안전한 수분 섭취"], avoid: ["딱딱·마른 음식", "급하게 먹기"], device: ["연하 보조식기·점도증진제"], life: ["바른 자세로 천천히 식사", "연하재활 운동", "흡인 예방", "영양 유지"] },
    ],
  },
];
/* 질환 심화 — 약물·합병증·응급신호(레드플래그). 이름은 카테고리/COUNSEL_KB의 name과 일치. */
/* 질환 심화 카드: drug(약물·치료) · comp(합병증) · interact(복약·상호작용 주의) · age(연령·성별 맞춤 주의신호) · red(응급신호)
   ※ 초안(전문가 검토 전제) — 실제 처방·용량은 반드시 의료진과 상의하세요. */
const DZ_DEEP = {
  "뇌졸중": { drug: "급성기 혈전용해제(4.5시간 내)·혈전제거술, 예방 항혈소판제·항응고제(심방세동)", comp: ["편마비·언어·삼킴 장애", "혈관성 치매", "재발·낙상"], interact: ["와파린 복용 시 비타민K 많은 음식(시금치·낫토·녹즙) 섭취량을 갑자기 늘리거나 줄이지 말 것", "아스피린·NSAID(진통소염제)·은행잎제제 병용 시 출혈 위험↑", "새 약·건강식품 추가 전 반드시 의료진 확인"], age: ["고령: 뚜렷한 마비 없이 갑작스런 헛소리·의식혼탁(섬망)으로 올 수 있음 → 진료", "여성: 어지럼·심한 두통·딸꾹질만 나타나기도 함"], red: ["갑자기 한쪽 마비·발음 어눌·시야장애·심한 두통·어지럼 → 즉시 119(골든타임 4.5시간)"] },
  "파킨슨병": { drug: "레보도파·도파민효능제·MAO-B억제제 등", comp: ["보행장애·낙상·연하곤란", "후기 인지저하", "기립성저혈압"], interact: ["레보도파는 고단백 식사와 함께 먹으면 흡수↓(식전 30분~식후 1시간), 철분제와 시간차 복용", "MAO-B억제제 + 일부 항우울제·감기약 → 상호작용 주의"], age: ["고령: 기립성저혈압으로 일어설 때 실신·낙상 → 천천히 일어나기, 낙상 시 고관절 골절 주의"], red: ["갑작스런 삼킴장애·심한 낙상·의식변화 → 진료", "약을 갑자기 중단하면 고열·근강직(악성증후군) → 응급"] },
  "알츠하이머·치매": { drug: "콜린분해효소억제제(도네페질 등)·메만틴", comp: ["일상생활 수행 저하", "배회·낙상·영양불량", "동반 우울"], interact: ["항콜린제(일부 감기약·수면제·과민성방광약)는 인지 악화·섬망 유발 → 병용 주의"], age: ["고령: 감염·탈수·변비만으로도 갑자기 혼란·헛소리(섬망) → 원인 찾는 진료 필요"], red: ["급격한 인지저하·발열·탈수 동반(섬망) → 진료"] },
  "고혈압": { drug: "ARB/ACE억제제·칼슘차단제·이뇨제 등", comp: ["뇌졸중·심근경색·심부전", "신부전·망막병증"], interact: ["ACE/ARB + 칼륨보충제·칼륨보존이뇨제 → 고칼륨혈증(부정맥) 위험", "NSAID(진통소염제)는 혈압↑·신장부담, 일부 감기약(교감신경약)도 혈압↑"], age: ["고령: 기립성저혈압으로 어지럼·실신 주의", "임신: 임신 중 혈압상승은 임신중독증(자간전증) 감별 필요"], red: ["수축기 180↑ + 심한 두통·흉통·시야장애·신경증상 → 응급(고혈압 위기)"] },
  "협심증": { drug: "항혈소판제(아스피린)·스타틴·베타차단제·설하 니트로글리세린", comp: ["심근경색·심부전·부정맥"], interact: ["니트로글리세린 + 발기부전치료제(실데나필 등) → 심한 저혈압, 절대 병용 금기", "아스피린 + 항응고제·NSAID → 출혈 위험↑"], age: ["여성·고령·당뇨: 전형적 가슴통증 없이 소화불량·극심한 피로·턱/등 통증으로 나타날 수 있음 → 놓치지 말 것"], red: ["20분 이상 지속되는 가슴 압박·식은땀·왼팔/턱 방사통·호흡곤란 → 즉시 119"] },
  "심근경색": { drug: "재관류치료(스텐트/혈전용해)·아스피린+P2Y12억제제(이중항혈소판)·스타틴·베타차단제", comp: ["심부전·부정맥·심장파열", "재경색"], interact: ["이중항혈소판제 복용 중 임의 중단은 스텐트 혈전 → 절대 자가중단 금지", "NSAID·일부 위장약(오메프라졸)과 항혈소판제 상호작용 주의"], age: ["여성·고령·당뇨: 흉통 없이 식은땀·구역·호흡곤란·실신만 나타날 수 있음 → 의심되면 바로 119"], red: ["가슴을 쥐어짜는 통증 20분 이상·식은땀·구토·호흡곤란 → 즉시 119(1분이 심근을 살림)"] },
  "부정맥": { drug: "심박수조절제·항부정맥제, 심방세동은 항응고제(뇌졸중 예방)", comp: ["뇌졸중(심방세동)", "심부전"], interact: ["항부정맥제 + QT연장 약물(일부 항생제·항구토제) → 위험한 부정맥", "와파린-비타민K, DOAC + NSAID 출혈 주의"], age: ["고령: 심방세동은 증상 없이 뇌졸중으로 처음 나타나기도 함 → 맥박 불규칙 시 검사"], red: ["실신·심한 어지럼·흉통 동반 두근거림 → 응급"] },
  "심부전": { drug: "ACE/ARB(또는 ARNI)·베타차단제·MRA·SGLT2억제제·이뇨제", comp: ["급성 폐부종", "부정맥·신기능 저하"], interact: ["NSAID·일부 당뇨약(글리타존)은 부종·악화, 과도한 나트륨(짠 음식)은 급성 악화 유발"], age: ["고령: 갑작스런 체중증가(3일 2kg↑)·야간 호흡곤란은 악화 신호"], red: ["누우면 숨차고 새벽에 숨막혀 깸·분홍 거품 가래·심한 부종 → 응급(급성 폐부종)"] },
  "심방세동": { drug: "심박수/리듬 조절제 + 뇌졸중 예방 항응고제(CHA2DS2-VASc 평가)", comp: ["뇌졸중·전신색전", "심부전"], interact: ["와파린은 비타민K 음식·항생제·소염제와 상호작용 커 INR 정기검사 필수, DOAC도 신기능 따라 용량조절"], age: ["고령: 무증상 흔함 → 정기 맥박·심전도로 조기발견이 뇌졸중 예방"], red: ["실신·갑작스런 한쪽 마비·언어장애(색전성 뇌졸중) → 즉시 119"] },
  "폐색전증": { drug: "항응고제(헤파린→경구 항응고제), 중증은 혈전용해", comp: ["폐경색·우심부전", "재발·만성 폐고혈압"], interact: ["항응고제 복용 중 출혈 징후(잇몸·혈뇨·검은변) 주의, 임의 중단은 재발"], age: ["장시간 여행·수술 후·경구피임약/임신 여성은 위험↑ → 한쪽 다리 붓고 아프면 주의"], red: ["갑작스런 호흡곤란·가슴통증(숨쉴 때 심함)·각혈·실신 → 즉시 119"] },
  "대동맥류": { drug: "혈압·심박 엄격 조절(베타차단제 등)·금연, 크기 커지면 수술/스텐트", comp: ["파열(치명적)", "박리"], interact: ["과도한 힘주기·무거운 것 들기·혈압 급상승 유발 상황 피하기"], age: ["고령 남성·흡연·고혈압에서 위험↑ → 정기 초음파/CT 추적"], red: ["찢어지는 듯한 갑작스런 가슴·등·복부 통증·실신 → 즉시 119(파열·박리 응급)"] },
  "기흉": { drug: "소량은 관찰·산소, 많으면 흉관삽입", comp: ["긴장성 기흉(응급)", "재발"], age: ["마르고 키 큰 젊은 남성·흡연자에서 잘 생김"], red: ["갑작스런 한쪽 가슴통증·호흡곤란, 특히 얼굴 창백·저혈압·목정맥 팽대(긴장성 기흉) → 즉시 119"] },
  "당뇨병": { drug: "메트포르민·SGLT2억제제·GLP-1·인슐린 등", comp: ["망막·신장·신경병증", "심혈관질환·당뇨발"], interact: ["설폰요소제·인슐린 + 음주·식사거름 → 저혈당, SGLT2억제제는 탈수·요로감염·(드물게)정상혈당 케톤산증 주의", "스테로이드·일부 이뇨제는 혈당↑"], age: ["고령: 저혈당이 어지럼·혼란·낙상으로 나타남 → 무리한 목표혈당 피하기", "소아·1형: 배아프고 토하며 숨가쁨(케톤산증) → 응급"], red: ["고혈당(의식저하·심한 갈증·구토) 또는 저혈당(식은땀·떨림·의식저하) → 응급"] },
  "저혈당증": { drug: "의식 있으면 단순당 15g(주스·사탕), 의식 없으면 글루카곤·정맥포도당", comp: ["의식소실·경련", "반복 시 인지저하"], interact: ["당뇨약(설폰요소제·인슐린)+음주·공복 운동은 저혈당 유발, 베타차단제는 저혈당 경고증상(떨림) 가림"], age: ["고령: 저혈당을 치매·뇌졸중으로 오인하기 쉬움"], red: ["식은땀·떨림·혼란 후 의식저하·경련 → 즉시 당분 공급, 의식 없으면 119"] },
  "갑상선기능항진증": { drug: "항갑상선제(메티마졸)·베타차단제·방사성요오드", comp: ["갑상선중독발작", "심방세동·골다공증"], interact: ["메티마졸 복용 중 고열·심한 인후통(무과립구증) → 즉시 검사, 요오드 과다(김·조영제) 주의"], red: ["고열·심한 빈맥·의식저하(갑상선중독발작) → 즉시 응급"] },
  "갑상선기능저하증": { drug: "레보티록신(갑상선호르몬) 보충, 공복 복용", comp: ["점액수종혼수", "이상지질혈증·서맥"], interact: ["레보티록신 복용 후 4시간 내 철분·칼슘·제산제·커피와 함께 먹으면 흡수↓ → 시간차 복용"], age: ["고령·겨울: 심한 무기력·저체온·의식저하(점액수종혼수) 주의", "임신: 태아 발달에 중요 → 용량 조절 필요"], red: ["극심한 무기력·저체온·의식저하(점액수종혼수) → 즉시 응급"] },
  "만성콩팥병": { drug: "ARB/ACE억제제·SGLT2억제제(신장보호)·빈혈/인 관리제", comp: ["말기신부전(투석)", "심혈관질환·빈혈·골질환"], interact: ["NSAID(진통소염제)·조영제·일부 항생제·한약(신독성)은 신기능 악화, 칼륨 높은 음식·약 주의"], age: ["고령: 탈수·감염 시 급성 악화 쉬움"], red: ["소변량 급감·심한 부종·호흡곤란·고칼륨(부정맥) → 응급"] },
  "급성신손상": { drug: "원인 교정·수액/이뇨 조절, 중증은 투석", comp: ["고칼륨혈증·폐부종", "만성신질환 진행"], interact: ["탈수 상태에서 NSAID·조영제·ACE/ARB 병용은 신장 급성악화 → '3제 병용' 주의"], age: ["고령: 설사·구토·발열로 탈수되면 쉽게 발생 → 수분 관리"], red: ["소변이 거의 안 나오고 부종·호흡곤란·의식저하 → 즉시 응급"] },
  "고칼륨혈증": { drug: "원인약 중단·칼슘글루콘산(심장보호)·인슐린/포도당·투석", comp: ["치명적 부정맥·심정지"], interact: ["ACE/ARB·칼륨보존이뇨제·칼륨보충제·일부 소염제 병용 시 급증, 신장병 환자는 바나나·토마토 등 고칼륨 음식 주의"], red: ["심한 근무력·가슴 두근·서맥·실신(부정맥) → 즉시 응급"] },
  "천식": { drug: "흡입 스테로이드(조절제)·속효성 기관지확장제(완화제)", comp: ["급성 악화·호흡부전"], interact: ["아스피린·NSAID·베타차단제는 천식 악화 유발 가능 → 복용 전 알리기"], age: ["소아: 밤·새벽 기침·쌕쌕거림 반복, 말·수유 힘들어하면 악화 신호 → 진료"], red: ["완화제에 반응 없는 심한 호흡곤란·말하기 힘듦·입술 청색 → 즉시 119"] },
  "COPD": { drug: "흡입 기관지확장제(LAMA/LABA)·흡입스테로이드", comp: ["급성악화·호흡부전·폐성심"], interact: ["진정제·수면제 과다는 호흡억제, 감염 시 악화 → 예방접종(독감·폐렴) 권장"], age: ["고령: 산소 과다 투여가 오히려 위험할 수 있어 의료진 지시 따르기"], red: ["급격한 호흡곤란 악화·의식저하·청색증 → 응급"] },
  "폐렴": { drug: "원인균 맞춤 항생제·해열제", comp: ["패혈증·호흡부전·흉막염"], age: ["고령: 고열 없이 축 처지고 헛소리·식욕저하·호흡만 빨라지기도 함(비전형) → 놓치지 말 것", "소아: 늑골 사이가 쑥 들어가는 호흡·처짐 → 진료"], red: ["고열 지속·호흡곤란·의식저하·산소포화도 저하 → 응급"] },
  "위·십이지장궤양": { drug: "PPI(위산억제제)·H.pylori 제균 항생제", comp: ["출혈·천공·유문협착"], interact: ["아스피린·NSAID·스테로이드는 궤양·출혈 유발 → 위장약과 함께, 술·흡연은 치유 방해"], age: ["고령: NSAID 장기복용 시 증상 없이 출혈되기도 함"], red: ["토혈·흑색변·심한 복통(천공 의심) → 즉시 응급"] },
  "요로결석": { drug: "진통제·요관확장(알파차단제)·필요 시 체외충격파쇄석", comp: ["수신증·요로감염·신기능 저하"], red: ["극심한 옆구리 통증 + 고열·오한(감염 동반) → 즉시 응급(패혈증 위험)"] },
  "신우신염": { drug: "원인균 맞춤 항생제(중증은 입원 정맥주사)", comp: ["패혈증·신농양", "신기능 저하"], age: ["여성·임신부에서 흔함, 임신 중 신우신염은 조기진통 위험 → 적극 치료"], red: ["고열·오한·옆구리 통증·구토, 소변량 감소·혈압저하(패혈증) → 즉시 응급"] },
  "통풍": { drug: "급성기 NSAID/콜히친/스테로이드, 예방 요산강하제(알로푸리놀 등)", comp: ["만성 통풍결절·관절변형", "신결석·신장병"], interact: ["이뇨제(하이드로클로로티아지드 등)는 요산↑로 통풍 유발·악화, 콜히친 + 마크로라이드/스타틴 → 독성↑, 알로푸리놀은 급성기엔 시작·중단 신중"], red: ["관절 발열·전신 고열(감염성 관절염 감별) → 진료"] },
  "골다공증": { drug: "비스포스포네이트·데노수맙·칼슘/비타민D, 중증은 골형성촉진제", comp: ["척추·고관절 골절", "만성 통증·기능저하"], interact: ["경구 비스포스포네이트는 아침 공복에 물로 복용하고 30분간 눕지 말 것(식도염), 칼슘·제산제와 시간차"], age: ["고령: 가벼운 낙상·기침에도 척추압박골절 → 낙상 예방이 핵심"], red: ["넘어진 뒤 고관절·허리 심한 통증으로 못 움직임 → 골절 의심, 진료"] },
  "간경변": { drug: "원인치료(항바이러스·금주)·이뇨제(복수)·정맥류 예방(베타차단제)", comp: ["식도정맥류 출혈·간성뇌증", "복수·감염·간암"], interact: ["간대사 약물·아세트아미노펜 과량·NSAID·진정제 주의(간성뇌증·출혈 유발), 술은 절대 금지"], age: [], red: ["피 토함·검은변(정맥류 출혈), 심한 졸림·헛소리(간성뇌증), 배가 붓고 열·복통(복막염) → 즉시 응급"] },
  "췌장염": { drug: "금식·수액·진통, 원인(담석·음주) 교정", comp: ["췌장 괴사·가성낭종", "쇼크·다장기부전"], interact: ["음주는 재발·악화의 최대 원인, 일부 약물(이뇨제·스테로이드 등)도 유발 가능"], red: ["명치~등으로 뻗치는 극심한 복통·구토·발열, 저혈압·의식저하 → 즉시 응급"] },
  "담석증": { drug: "무증상은 경과관찰, 증상·합병증은 담낭절제(수술)", comp: ["담낭염·담관염", "췌장염"], age: ["여성·비만·40대·급격한 체중감량에서 흔함"], red: ["오른쪽 윗배 통증 + 고열·오한·황달(담관염) → 즉시 응급"] },
  "간질": { drug: "항경련제(단독→병합), 규칙적 복용이 핵심", comp: ["경련지속상태", "낙상·외상·돌연사(SUDEP)"], interact: ["항경련제 임의 중단·수면부족·과음은 발작 유발, 일부 항경련제는 피임약·다른 약효 저하"], age: ["소아: 열성경련과 감별 필요", "고령: 뇌졸중 후 발작 가능"], red: ["경련이 5분 이상 지속되거나 회복 없이 반복 → 즉시 119(경련지속상태)"] },
  "뇌수막염": { drug: "세균성은 즉시 항생제(±스테로이드), 바이러스성은 대증치료 — 조기치료가 생명", comp: ["뇌부종·경련·청력소실", "패혈증·사망"], age: ["영유아: 잘 안 먹고 축 처짐·대천문 팽대·고음의 울음", "소아·청년: 목 뻣뻣함·심한 두통·빛 눈부심"], red: ["고열 + 심한 두통·목 뻣뻣함·구토·의식저하·자반(점상출혈) → 즉시 119"] },
  "열성경련": { drug: "대부분 저절로 멈춤, 길면 항경련제 — 대개 예후 양호", comp: ["대개 후유증 없음", "드물게 뇌수막염 감별 필요"], age: ["생후 6개월~5세에 흔함, 열 오를 때 발생"], red: ["경련 5분 이상 지속·반복, 경련 후 목 뻣뻣·의식 안 돌아옴·처짐 → 즉시 119(뇌수막염 감별)", "옆으로 눕히고 입에 아무것도 넣지 말 것"] },
  "임신중독증": { drug: "혈압조절·경련예방(황산마그네슘), 근본치료는 분만", comp: ["자간증(경련)·태반조기박리", "HELLP증후군·태아위험"], age: ["첫 임신·고령임신·다태·기존 고혈압/신장병에서 위험↑"], red: ["임신 20주 후 심한 두통·시야 번쩍임/흐림·상복부 통증·급격한 부종·소변감소 → 즉시(자간전증), 경련 시 119"] },
  "대상포진": { drug: "항바이러스제(72시간 내)·진통제(신경통)", comp: ["대상포진후신경통", "눈·귀 침범"], age: ["고령·면역저하: 신경통이 오래가고 심함 → 조기 항바이러스제·예방접종 권장"], red: ["눈 주변 발진·시력변화 → 즉시 안과(실명 위험)"] },
  "우울증": { drug: "SSRI 등 항우울제(효과까지 2~4주)", comp: ["자살·자해", "기능저하·만성화"], interact: ["SSRI + 트립탄·트라마돌·MAOI → 세로토닌증후군, NSAID·항응고제 병용 시 출혈↑, 임의 중단은 금단증상"], age: ["청소년·젊은 성인: 항우울제 초기 자살사고 증가 가능 → 초기 세심한 관찰", "노인: 우울이 신체증상·인지저하로 위장(가성치매)되기도 함"], red: ["자살 생각·자해 충동 → 즉시 자살예방상담 1393·응급실"] },
  "공황장애": { drug: "SSRI·필요 시 단기 항불안제", comp: ["광장공포증·회피", "우울 동반"], interact: ["항불안제(벤조디아제핀)는 의존·졸림, 술과 병용 위험"], red: ["흉통·호흡곤란이 심장질환과 감별 안 되면 → 응급 평가"] },
  "조현병": { drug: "항정신병약(꾸준한 복용이 재발 예방의 핵심)", comp: ["재발·기능저하", "자·타해 위험"], interact: ["항정신병약 임의 중단은 재발, 일부 약은 QT연장·대사증후군 → 정기 모니터링"], age: ["젊은 성인 발병 많음, 초발 조기치료가 예후 좌우"], red: ["자·타해 위험·심한 초조·명령 환청, 고열+근강직+의식저하(악성증후군) → 즉시 응급"] },
  "알코올사용장애": { drug: "금단 관리(벤조디아제핀·티아민)·재발방지제(날트렉손 등)", comp: ["간질환·췌장염·인지저하", "금단 섬망·경련"], interact: ["술 + 진정제·수면제·아세트아미노펜은 위험, 티아민(비타민B1) 없이 포도당만 주면 악화"], age: ["고령·장기음주: 금단 섬망(진전섬망) 위험 큼"], red: ["금주 후 심한 손떨림·환각·발한·경련·의식혼탁(진전섬망) → 즉시 응급(치명적)"] },
  "결핵": { drug: "표준 4제 병합요법(최소 6개월, 끝까지 복용)", comp: ["파종성 결핵·재발", "내성결핵"], interact: ["리팜핀은 강력한 효소유도제 → 피임약·와파린·일부 약효 저하(용량조정), 소변·눈물 주황색은 정상"], red: ["대량 객혈·심한 호흡곤란 → 응급"] },
  "백혈병": { drug: "항암화학요법·표적치료·조혈모세포이식", comp: ["감염(호중구감소)·출혈·빈혈"], age: ["소아: 발열·멍·뼈 통증·창백 지속 시 검사"], red: ["고열·심한 출혈·의식저하 → 즉시 응급"] },
  "두드러기": { drug: "항히스타민제, 중증(아나필락시스)은 에피네프린", comp: ["만성 두드러기", "아나필락시스"], interact: ["아스피린·NSAID·조영제·일부 음식이 유발·악화 가능"], age: [], red: ["입술/혀 부종·호흡곤란·어지럼(아나필락시스) → 즉시 에피네프린·119"] },
  "자궁내막증": { drug: "진통제·호르몬치료(경구피임약·프로게스틴·GnRH작용제)", comp: ["난임", "만성 골반통·유착·난소낭종"], red: ["갑작스런 극심한 골반통(낭종 파열·꼬임 의심) → 응급"] },
  "위암": { drug: "병기별 수술·항암화학요법·표적치료", comp: ["전이·재발", "출혈·위 폐색"], red: ["토혈·흑색변·급격한 체중감소·삼킴 곤란 → 진료"] },
  "대장암": { drug: "병기별 수술·항암화학요법·표적치료", comp: ["장폐색·천공", "전이·재발"], red: ["지속 혈변·심한 복통·구토(장폐색 의심) → 응급"] },
  "이상지질혈증": { drug: "스타틴·에제티미브·(중성지방 높으면)페노피브레이트·오메가3", comp: ["동맥경화→심근경색·뇌졸중", "췌장염(고중성지방)"], interact: ["스타틴 + 자몽주스·일부 항생제(마크로라이드)·피브레이트 → 근육통·횡문근융해 위험", "근육통·갈색뇨 생기면 알리기"], red: ["심한 근육통·힘 빠짐·콜라색 소변(횡문근융해) → 진료"] },
  "비만": { drug: "생활습관 우선, 필요 시 GLP-1(삭센다·위고비)·오르리스타트, 고도비만은 수술", comp: ["당뇨·고혈압·지방간·수면무호흡", "관절질환·일부 암"], interact: ["GLP-1은 구역·구토 흔함, 담석·췌장염 주의"], red: [] },
  "빈혈": { drug: "원인별 — 철결핍은 철분제, 비타민B12/엽산 결핍은 보충, 출혈은 지혈", comp: ["심부전·인지저하(고령)", "원인 종양·출혈 놓침"], interact: ["철분제는 제산제·커피·차·칼슘과 함께 먹으면 흡수↓, 위장장애 시 식후 복용"], age: ["고령·남성·폐경 후 여성의 철결핍빈혈은 위·대장 출혈(암 포함) 감별 필요"], red: ["창백·심한 어지럼·가슴 두근·실신, 검은변/혈변 동반 → 진료"] },
  "폐암": { drug: "병기별 수술·항암·방사선·표적치료·면역항암제", comp: ["전이(뇌·뼈)", "객혈·상대정맥증후군·흉수"], age: ["장기 흡연·고령: 저선량 CT 조기검진 권장"], red: ["대량 객혈·심한 호흡곤란·얼굴·목 부종(상대정맥증후군) → 응급"] },
  "폐결핵": { drug: "표준 4제 병합요법(최소 6개월, 끝까지) — 임의 중단은 내성", comp: ["파종성 결핵", "객혈·재발·내성"], interact: ["리팜핀은 피임약·와파린·일부 약효 저하(강력 효소유도), 소변·눈물 주황색은 정상"], red: ["대량 객혈·심한 호흡곤란 → 응급"] },
  "수면무호흡증": { drug: "CPAP(양압기)·체중감량·구강내장치, 원인 따라 수술", comp: ["고혈압·부정맥·심혈관질환", "주간졸림→사고"], interact: ["수면제·음주는 무호흡 악화 → 피하기"], red: ["운전 중 심한 졸림·기억 안 나는 졸음운전 → 위험, 즉시 관리"] },
  "폐섬유증": { drug: "항섬유화제(피르페니돈·닌테다닙)·산소치료, 진행성", comp: ["급성악화·호흡부전", "폐고혈압"], red: ["수일 내 급격히 심해지는 호흡곤란·기침·발열(급성악화) → 응급"] },
  "신부전": { drug: "원인치료·수분/전해질 조절, 말기는 투석·이식", comp: ["고칼륨혈증·폐부종", "심혈관질환·빈혈·골질환"], interact: ["NSAID·조영제·신독성 항생제·한약 주의, 약 용량을 신기능에 맞게 조절"], red: ["소변량 급감·심한 부종·호흡곤란·의식저하·고칼륨(부정맥) → 응급"] },
  "사구체신염": { drug: "원인별 면역억제·스테로이드·혈압조절(ARB/ACE)", comp: ["만성신부전 진행", "고혈압·부종"], red: ["콜라색 소변·심한 부종·소변량 감소·고혈압 → 진료"] },
  "신증후군": { drug: "스테로이드·면역억제제·이뇨제·ARB, 저염식", comp: ["혈전(신정맥·폐색전)", "감염·고지혈증·급성신손상"], interact: ["스테로이드 장기복용 시 골다공증·감염·혈당↑ 관리, 이뇨제 과다는 탈수"], red: ["한쪽 다리 붓고 아픔·갑작스런 호흡곤란(혈전·색전) → 응급"] },
  "간염": { drug: "A/E형 대증치료, B형 항바이러스제, C형 완치 항바이러스제", comp: ["전격간부전", "만성화→간경변·간암(B·C형)"], interact: ["아세트아미노펜 과량·음주·일부 한약은 간부담 → 주의"], red: ["심한 노란 눈·의식저하·헛소리·출혈경향(전격간부전) → 즉시 응급"] },
  "지방간": { drug: "생활습관(체중 7~10% 감량·금주)이 핵심, 동반질환 관리", comp: ["지방간염→간섬유화·간경변", "심혈관질환"], red: [] },
  "역류성식도염": { drug: "PPI(위산억제제)·생활습관(취침 전 금식·상체거상)", comp: ["식도협착·바렛식도(→식도암 감시)"], interact: ["PPI 장기복용은 골절·비타민B12/마그네슘 저하 가능, NSAID·음주·흡연은 악화"], red: ["삼킬 때 걸림·체중감소·토혈/흑색변 → 진료(합병증 감별)"] },
  "위염": { drug: "위산억제제·점막보호제, H.pylori 있으면 제균", comp: ["궤양·출혈", "위축성위염→위암 위험"], interact: ["NSAID·아스피린·술·흡연은 위점막 손상 → 위장약과 함께"], red: ["토혈·흑색변·심한 명치통증 → 응급"] },
  "궤양성대장염": { drug: "5-ASA·스테로이드·면역조절제·생물학제제", comp: ["중독성거대결장·천공·대량출혈", "장기 유병 시 대장암 위험"], interact: ["생물학제제·면역억제제는 감염·결핵 재활성 위험 → 사전검사·예방접종"], red: ["하루 다회 혈성 설사 + 고열·복부팽만·심한 복통(중독성거대결장) → 응급"] },
  "크론병": { drug: "스테로이드·면역조절제·생물학제제, 협착·누공은 수술", comp: ["장협착·누공·농양", "천공·영양불량"], interact: ["생물학제제·면역억제제는 감염·결핵 재활성 위험 → 사전검사"], red: ["심한 복통·복부팽만·구토(장폐색)·고열(농양) → 응급"] },
  "치질": { drug: "좌욕·섬유질·연고/좌약, 심하면 결찰·수술", comp: ["혈전성 치핵(심한 통증)", "빈혈(만성출혈)"], red: ["멈추지 않는 다량 출혈·심한 통증·발열(감염) → 진료"] },
  "편두통": { drug: "급성기 트립탄·NSAID, 잦으면 예방약(베타차단제·토피라메이트·CGRP항체)", comp: ["만성편두통·약물과용두통"], interact: ["트립탄 + SSRI/SNRI → 세로토닌증후군, 진통제 주 10일↑ 복용은 약물과용두통 유발"], red: ["평소와 다른 '벼락두통'·마비·발음장애·발열·목경직 동반 → 즉시 응급(뇌출혈·뇌수막염 감별)"] },
  "다발성경화증": { drug: "급성기 스테로이드, 질병조절제(면역조절)", comp: ["재발·진행성 장애", "시신경염·보행·배뇨장애"], red: ["갑작스런 한쪽 시력저하·마비·심한 어지럼(재발) → 진료"] },
  "근위축성측삭경화증": { drug: "릴루졸·에다라본(진행 지연)·다학제 지지치료", comp: ["호흡근 마비·연하곤란", "흡인성폐렴"], red: ["심한 호흡곤란·사레·삼킴곤란으로 못 먹음 → 진료(호흡·영양 지원)"] },
  "안면마비": { drug: "벨마비는 조기 스테로이드(±항바이러스제)·눈 보호", comp: ["불완전 회복·후유증", "노출성 각막손상"], age: [], red: ["얼굴마비에 팔다리 힘빠짐·발음장애·심한 두통 동반 → 즉시 119(뇌졸중 감별, 벨마비는 이마도 마비/뇌졸중은 이마 보존)"] },
  "삼차신경통": { drug: "카르바마제핀 등 항경련제(1차), 난치는 수술/시술", comp: ["삶의 질 저하·우울"], interact: ["카르바마제핀은 피부 중증약물이상반응·저나트륨·간·혈액 이상 → 초기 모니터링"], red: ["발열·시력변화·다른 신경증상 동반 시 → 이차성 원인 감별"] },
  "유방암": { drug: "수술·항암·방사선·호르몬치료·표적치료", comp: ["전이·재발", "림프부종"], age: ["가족력·BRCA 변이는 위험↑ → 정기검진·상담"], red: ["새로 만져지는 딱딱한 멍울·피부 함몰·유두 분비/함몰·겨드랑이 멍울 → 진료"] },
  "자궁경부암": { drug: "병기별 수술·방사선·항암, 예방은 HPV백신·정기 자궁경부세포검사", comp: ["전이·재발", "요관폐색·출혈"], age: ["만 20세 이상 2년마다 국가 자궁경부암 검진"], red: ["성관계 후 출혈·비정상 질출혈·다량 냉 → 진료"] },
  "난소암": { drug: "수술·항암(백금기반)·표적치료(PARP억제제)", comp: ["복막전이·복수", "장폐색"], age: ["가족력·BRCA 변이 위험↑, 초기 증상 모호해 늦게 발견되기 쉬움"], red: ["지속되는 복부팽만·소화불량·골반통·복수 → 진료"] },
  "자궁내막암": { drug: "수술(자궁적출)·방사선·호르몬·항암", comp: ["전이·재발"], age: ["폐경 후 출혈은 반드시 검사(자궁내막암 대표 신호)"], red: ["폐경 후 질출혈·비정상 출혈 → 진료"] },
  "갱년기장애": { drug: "생활관리, 증상 심하면 호르몬치료(HRT)·비호르몬 대안", comp: ["골다공증·심혈관 위험↑", "우울·불면"], interact: ["호르몬치료는 유방암·혈전·뇌졸중 위험을 개인별로 따져 결정 → 자궁 있으면 프로게스틴 병용"], red: ["호르몬치료 중 한쪽 다리 붓고 아픔·갑작스런 호흡곤란·흉통(혈전) → 응급"] },
  "난소낭종": { drug: "대부분 경과관찰, 크거나 증상 있으면 수술", comp: ["꼬임(염전)·파열·출혈"], red: ["갑작스런 극심한 한쪽 아랫배 통증·구토·실신(염전·파열) → 즉시 응급"] },
  "다낭성난소증후군": { drug: "생활습관·체중관리, 경구피임약·메트포르민, 임신원하면 배란유도", comp: ["난임·자궁내막증식", "당뇨·대사증후군"], age: [], red: [] },
  "임신성당뇨": { drug: "식이·운동 우선, 필요 시 인슐린(임신 중 안전), 분만 후 재평가", comp: ["거대아·난산·신생아 저혈당", "산모 후일 당뇨 위험↑"], red: ["태동 급감·심한 갈증/구토·의식저하 → 진료"] },
  "골반염": { drug: "광범위 항생제(성매개감염 포함), 파트너 동시치료", comp: ["난임·만성골반통·자궁외임신 위험", "난관난소농양"], red: ["심한 아랫배 통증·고열·오한·구토(농양·복막염) → 응급"] },
  "전립선암": { drug: "감시요법·수술·방사선·호르몬치료, PSA로 추적", comp: ["전이(뼈)", "요폐·요실금"], age: ["50세↑(가족력은 더 일찍) PSA 상담"], red: ["소변 못 봄(급성요폐)·뼈 통증·혈뇨 → 진료"] },
  "전립선비대증": { drug: "알파차단제·5알파환원효소억제제, 심하면 수술(TURP)", comp: ["급성요폐·방광결석·요로감염", "신기능 저하"], interact: ["알파차단제 + 발기부전치료제 → 저혈압, 감기약(항히스타민·비충혈제거제)은 요폐 유발"], age: ["고령 남성에서 흔함"], red: ["소변이 전혀 안 나오고 아랫배 팽창·통증(급성요폐) → 즉시 응급(도뇨)"] },
  "방광암": { drug: "경요도절제·BCG 방광내주입·항암, 진행성은 방광절제", comp: ["재발·전이", "요관폐색"], age: ["흡연·고령이 최대 위험인자"], red: ["통증 없는 육안적 혈뇨 → 반드시 검사(방광암 대표 신호)"] },
  "요실금": { drug: "골반저운동·방광훈련, 절박성은 항무스카린제/베타3작용제, 복압성은 수술", comp: ["피부염·위축·삶의 질 저하", "낙상(급하게 화장실)"], interact: ["항무스카린제는 노인 인지저하·변비·구갈·요폐 주의"], age: ["여성(출산·폐경)·고령에서 흔함"], red: ["갑작스런 요실금 + 다리 저림·대변실금(마미증후군) → 즉시 응급"] },
  "녹내장": { drug: "안압하강 점안제(꾸준히)·레이저·수술, 시야는 회복 안 됨", comp: ["비가역 시야손실·실명"], interact: ["항콜린제·일부 감기약·스테로이드는 급성 폐쇄각녹내장 유발 가능(좁은각 환자)"], age: ["고령·가족력·고도근시 위험↑ → 정기 안압·시야검사"], red: ["갑작스런 눈 통증·충혈·시력저하·구토·무지개 잔상(급성 폐쇄각) → 즉시 응급(실명 위험)"] },
  "당뇨망막병증": { drug: "혈당·혈압 조절, 진행성은 레이저·항VEGF주사·수술", comp: ["유리체출혈·망막박리", "실명"], age: ["당뇨 환자는 증상 없어도 매년 안저검사"], red: ["갑작스런 시력저하·검은 점 쏟아짐·시야 커튼(출혈·박리) → 즉시 안과"] },
  "망막박리": { drug: "응급 수술(레이저·유리체절제·공막돌륭술)", comp: ["영구 시력손실"], red: ["번쩍임·날파리 급증·검은 커튼이 시야를 가림 → 즉시 안과(응급 수술 골든타임)"] },
  "황반변성": { drug: "습성은 항VEGF 주사, 건성은 생활관리·영양제(AREDS)", comp: ["중심시력 손실"], age: ["고령·흡연·가족력 위험↑ → 암슬러격자 자가점검"], red: ["직선이 휘어 보임·중심 시야 왜곡/암점 → 즉시 안과(습성 조기치료)"] },
  "돌발성난청": { drug: "고용량 스테로이드(경구/고실내) — 조기치료가 회복 좌우", comp: ["영구 청력손실·이명"], red: ["갑자기 한쪽 귀가 안 들림·이명·어지럼 → 72시간 내 즉시 이비인후과(응급)"] },
  "메니에르병": { drug: "저염식·이뇨제, 급성기 전정억제제·항구토제", comp: ["점진적 청력손실·이명", "낙상"], interact: ["카페인·염분·과음은 악화 유발"], red: ["수 시간 지속되는 심한 회전성 어지럼·구토·청력변동 → 진료(중추성 감별)"] },
  "류마티스관절염": { drug: "조기 DMARD(메토트렉세이트 등)·생물학제제·스테로이드", comp: ["관절변형·기능상실", "폐·심혈관·골다공증"], interact: ["메토트렉세이트는 엽산 병용·음주 금지·감염/간·폐독성 모니터, 생물학제제는 결핵·감염 위험"], red: ["고열·심한 관절 부종/발적(감염성 관절염 감별)·급성 호흡곤란 → 응급"] },
  "추간판탈출증": { drug: "안정·소염진통·물리치료·주사, 심하면 수술", comp: ["신경손상·근력저하", "마미증후군"], red: ["양다리 마비·대소변 조절 장애·회음부 감각소실(마미증후군) → 즉시 응급 수술"] },
  "척추질환": { drug: "보존치료(운동·물리치료·약물), 협착·불안정은 수술", comp: ["신경압박·보행장애", "마미증후군"], age: ["고령: 척추관협착증으로 걷다 다리 저려 쉬어야 함"], red: ["다리 마비·대소변 장애·발열 동반 요통(감염·종양) → 응급"] },
  "골절": { drug: "정복·고정(깁스/수술)·재활, 골다공증 동반 시 골관리", comp: ["부정유합·감염", "지방색전·구획증후군"], age: ["고령 고관절골절은 합병증·사망위험↑ → 조기수술·재활"], red: ["개방성 상처·심한 변형·손발 창백/감각소실(혈관·구획증후군)·심한 부종 → 즉시 응급"] },
  "아토피피부염": { drug: "보습·국소 스테로이드/칼시뉴린억제제, 중증은 듀필루맙·면역억제제", comp: ["세균·헤르페스 이차감염", "수면·삶의 질 저하"], age: ["영유아·소아에서 흔함, 성장하며 호전되기도"], red: ["진물·고열·급속히 퍼지는 물집(포진상습진·감염) → 진료"] },
  "건선": { drug: "국소치료·광선치료, 중등도↑는 전신약·생물학제제", comp: ["건선관절염", "심혈관·대사증후군 동반↑"], interact: ["생물학제제는 감염·결핵 위험, 일부 약(베타차단제·리튬)은 건선 악화"], red: ["전신 홍피증·고열·오한(홍피성·농포성 건선) → 응급"] },
  "피부암": { drug: "수술절제가 기본, 진행성 흑색종은 면역·표적치료", comp: ["전이(흑색종)", "재발"], age: ["과도한 햇볕·화상력·고령 위험↑ → 자가점검(ABCDE)"], red: ["점이 커지거나 색·모양 비대칭·경계불규칙·출혈/궤양 → 즉시 피부과"] },
  "불안장애": { drug: "SSRI/SNRI(1차)·인지행동치료, 단기 항불안제", comp: ["우울 동반·회피·기능저하"], interact: ["벤조디아제핀은 의존·졸림, 술 병용 위험"], red: ["자살 생각·공황과 함께 흉통/실신 → 응급 평가"] },
  "불면증": { drug: "수면위생·인지행동치료(1차), 필요 시 단기 수면제", comp: ["주간기능저하·사고", "우울·불안 악화"], interact: ["수면제 + 음주·진정제는 호흡억제·낙상, 장기·고용량은 의존"], age: ["고령: 수면제는 낙상·인지저하 위험 → 최소용량"], red: [] },
  "양극성장애": { drug: "기분안정제(리튬·발프로산)·비정형 항정신병약", comp: ["자·타해(조증·우울)", "재발"], interact: ["리튬은 이뇨제·NSAID·탈수로 혈중농도↑(중독), 정기 혈중농도·신장·갑상선 검사 필수"], red: ["자살·과격행동·리튬중독(심한 떨림·구토·의식저하) → 즉시 응급"] },
  "강박장애": { drug: "SSRI(고용량)·노출반응방지 인지행동치료", comp: ["우울 동반·기능저하"], red: ["자살 생각·일상 불가능할 만큼 악화 → 진료"] },
  "외상후스트레스장애": { drug: "트라우마 중심 심리치료(1차)·SSRI/SNRI", comp: ["우울·물질사용·자살위험"], red: ["자살 생각·심한 해리·공격성 → 응급 평가"] },
  "섭식장애": { drug: "영양재활·심리치료, 신경성폭식은 SSRI", comp: ["전해질이상·부정맥", "무월경·골다공증·재급식증후군"], age: ["청소년·젊은 여성에서 흔함"], red: ["실신·심한 서맥/부정맥·저칼륨(구토·설사약 남용) → 즉시 응급"] },
  "구강암": { drug: "수술·방사선·항암", comp: ["전이·재발", "섭식·발음 장애"], age: ["흡연·음주·씹는담배·HPV 위험↑"], red: ["2주 이상 낫지 않는 입안 궤양·멍울·백/적색반·출혈 → 진료"] },
  "치주질환": { drug: "스케일링·치주치료·구강위생, 심하면 수술", comp: ["치아상실", "당뇨·심혈관질환과 상호악화"], age: ["당뇨 환자는 치주질환이 잘 생기고 혈당조절도 악화"], red: ["잇몸 붓고 고름·발열·얼굴 붓기(농양) → 진료"] },
  "수두": { drug: "대증치료, 고위험군은 항바이러스제, 예방은 백신", comp: ["세균 이차감염·폐렴·뇌염", "성인·면역저하 시 중증"], age: ["신생아·임신부·면역저하자 노출은 중증 위험 → 즉시 상담"], red: ["고열 지속·심한 두통/경련·호흡곤란·물집 세균감염 → 응급"] },
  "홍역": { drug: "대증치료·비타민A, 예방은 MMR백신", comp: ["폐렴·중이염·뇌염", "아급성경화성뇌염(드묾)"], age: ["영유아·면역저하 중증 위험, 전염력 매우 강함 → 격리"], red: ["고열 지속·호흡곤란·경련·의식저하 → 응급"] },
  "수족구병": { drug: "대증치료(대부분 자연회복)", comp: ["탈수(입안 통증)", "드물게 뇌수막염·심근염"], age: ["영유아에서 흔함, 어린이집 전파"], red: ["못 먹고 소변 급감(탈수)·고열 지속·경련·심한 처짐·가슴 두근 → 응급"] },
  "로타바이러스장염": { drug: "경구수액(ORS)로 탈수 교정이 핵심, 예방은 백신", comp: ["탈수·전해질이상"], age: ["영유아 탈수 빨라 위험 → 소변·눈물·활력 관찰"], red: ["소변 급감·눈물 없이 축 처짐·눈 움푹·구토로 못 먹음(중등도 탈수) → 응급"] },
  "신생아황달": { drug: "광선치료, 심하면 교환수혈", comp: ["핵황달(뇌손상)"], age: ["생후 첫 주 흔하나, 심하면 뇌손상 위험"], red: ["생후 24시간 내 황달·손발바닥까지 노랑·잘 안 먹고 처짐·고음 울음(핵황달 위험) → 즉시 진료"] },
  "대사증후군": { drug: "생활습관(체중감량·운동)이 기본, 구성요소(혈압·혈당·지질)별 약물", comp: ["당뇨·심혈관질환·지방간"], red: [] },
  "만성피로": { drug: "원인질환(빈혈·갑상선·우울·수면장애) 감별·교정, 대증관리", comp: ["기능저하·우울"], red: ["체중감소·발열·야간발한·멍울 동반 피로 → 기저질환(감염·암) 감별 진료"] },
  "고요산혈증": { drug: "생활습관(절주·고퓨린 절제), 증상·합병증 있으면 요산강하제", comp: ["통풍발작·통풍결절", "신결석·신장병"], interact: ["이뇨제·저용량 아스피린은 요산↑, 알로푸리놀 초기 발작 주의"], red: [] },
  "감기": { drug: "대증치료(해열·진해·비충혈제거), 항생제는 불필요(세균감염 아니면)", comp: ["부비동염·중이염·기관지염", "고위험군은 폐렴"], age: ["영유아·고령·만성질환자는 합병증 주의"], red: ["고열 지속·호흡곤란·심한 두통/목경직·의식저하 → 폐렴·수막염 감별 진료"] },
  "심혈관질환": { drug: "위험인자 관리(항혈소판·스타틴·혈압/혈당조절)·생활습관", comp: ["심근경색·심부전·부정맥·뇌졸중"], age: ["여성·고령·당뇨는 증상이 비전형적일 수 있음"], red: ["20분 이상 가슴 압박·식은땀·호흡곤란·실신 → 즉시 119"] },
  "말초동맥질환": { drug: "금연·운동·항혈소판제·스타틴·혈관확장제, 중증은 혈관성형/우회", comp: ["급성 사지 허혈", "궤양·괴저·절단"], red: ["갑자기 한쪽 다리/팔이 창백·차갑고·심한 통증·감각저하(급성 동맥폐색) → 즉시 응급(6시간 골든타임)"] },
  "심장판막질환": { drug: "증상·심부전 관리, 중증은 판막수술/시술(TAVI 등)", comp: ["심부전·부정맥·감염성심내막염", "혈전·색전"], interact: ["기계판막은 평생 와파린(INR 관리) 필요, 시술·발치 전 예방적 항생제 상의"], red: ["심한 호흡곤란·실신·흉통 → 응급"] },
  "기립성저혈압": { drug: "원인약 조정·수분/염분·압박스타킹, 필요 시 미도드린 등", comp: ["실신·낙상·골절"], interact: ["혈압약·이뇨제·전립선약(알파차단제)·항우울제가 유발/악화"], age: ["고령: 낙상→고관절골절 위험 → 천천히 일어나기"], red: ["일어설 때 반복 실신·낙상·의식소실 → 진료"] },
  "선천성심질환": { drug: "결손·중증도별 경과관찰·약물·중재시술·수술", comp: ["심부전·부정맥·폐고혈압", "감염성심내막염"], age: ["영유아: 수유 중 처짐·청색증·체중 안 늚 → 진료"], red: ["입술·손발 파랗게 변함·심한 호흡곤란·처짐(청색증 발작) → 즉시 응급"] },
  "갑상선결절": { drug: "대부분 양성 경과관찰(초음파·세침검사), 악성/증상은 수술", comp: ["악성(갑상선암)", "압박증상"], red: ["빠르게 커지는 결절·목소리 변화·삼킴/호흡 곤란 → 진료"] },
  "갑상선암": { drug: "수술(갑상선절제)·방사성요오드·갑상선호르몬, 예후 대체로 좋음", comp: ["재발·전이(드묾)", "수술 후 부갑상선/성대 영향"], red: ["단단히 커지는 목 멍울·쉰 목소리·삼킴곤란 → 진료"] },
  "쿠싱증후군": { drug: "원인(스테로이드·종양) 교정, 종양은 수술", comp: ["당뇨·고혈압·골다공증·감염", "혈전"], interact: ["장기 스테로이드가 흔한 원인 → 임의 중단 금지(부신위기 위험), 감량은 의료진과"], red: ["스테로이드 복용자가 감염·수술·구토로 급성 무기력·저혈압·의식저하(부신위기) → 즉시 응급"] },
  "부신기능저하증": { drug: "부족 호르몬 평생 보충(하이드로코르티손 등)", comp: ["부신위기(치명적)"], interact: ["감염·수술·스트레스 시 스테로이드 증량 필요, 임의 중단 금지, 응급카드 소지 권장"], red: ["심한 무기력·구토·복통·저혈압·의식저하(부신위기) → 즉시 스테로이드·119"] },
  "뇌하수체종양": { drug: "호르몬조절(도파민효능제 등)·수술·방사선", comp: ["시야장애", "호르몬 이상·뇌하수체졸중"], red: ["갑작스런 심한 두통·시야장애·복시·의식저하(뇌하수체졸중) → 즉시 응급"] },
  "당뇨병성신경병증": { drug: "혈당조절이 기본, 통증은 항경련제(프레가발린)·항우울제(둘록세틴)", comp: ["당뇨발궤양·절단", "위마비·기립성저혈압"], age: ["발 감각저하로 상처를 모르고 방치 → 매일 발 점검"], red: ["발 상처가 붓고 냄새·발열·검게 변함(감염·괴저) → 즉시 진료"] },
  "고프로락틴혈증": { drug: "도파민효능제(카베르골린 등), 원인약 조정", comp: ["불임·성기능저하·골밀도저하"], interact: ["일부 항정신병약·위장약(메토클로프라미드)이 프로락틴↑ 유발"], red: ["심한 두통·시야장애 동반(종양) → 진료"] },
  "지질대사장애": { drug: "식이·운동·스타틴 등 지질강하제, 중성지방 매우 높으면 피브레이트", comp: ["동맥경화", "급성췌장염(고중성지방)"], red: ["심한 명치~등 통증·구토(고중성지방 췌장염) → 응급"] },
  "과민성대장증후군": { drug: "식이조절(저포드맵)·증상별 약물(진경제·지사/완하제)", comp: ["삶의 질 저하", "불안·우울 동반"], red: ["체중감소·혈변·야간 증상·발열·빈혈(경고징후) → 기질적 질환 감별 진료"] },
  "기관지염": { drug: "대부분 바이러스성 대증치료, 세균감염 의심 시 항생제", comp: ["폐렴(고위험군)", "천식·COPD 악화"], red: ["고열 지속·호흡곤란·화농성 가래·흉통 → 폐렴 감별 진료"] },
  "간질성폐질환": { drug: "원인별 스테로이드·면역억제·항섬유화제·산소", comp: ["폐섬유화·호흡부전", "폐고혈압·급성악화"], red: ["수일 내 급격히 심해지는 호흡곤란·기침·발열 → 응급(급성악화)"] },
  "미만성범세기관지염": { drug: "저용량 마크로라이드 장기요법·호흡관리", comp: ["기관지확장증·호흡부전", "반복 감염"], red: ["급격한 호흡곤란·화농성 가래 급증·발열 → 진료"] },
  "다낭성신장질환": { drug: "혈압조절(ARB/ACE)·수분, 톨밥탄(진행지연), 말기는 투석/이식", comp: ["만성신부전", "뇌동맥류·낭종감염/출혈"], age: ["가족력 있으면 뇌동맥류 선별 상담"], red: ["갑작스런 심한 두통(뇌동맥류 파열)·옆구리통증+혈뇨/발열(낭종출혈·감염) → 응급"] },
  "요독증": { drug: "투석·수분/전해질/독소 관리, 근본은 신대체요법", comp: ["심막염·뇌증·출혈경향"], red: ["의식저하·경련·심한 구토·호흡곤란·가슴통증(심막염) → 응급"] },
  "전해질불균형": { drug: "원인 교정·수액/전해질 보충 또는 제거(속도 조절 중요)", comp: ["부정맥·경련·의식저하"], interact: ["이뇨제·설사/구토·일부 약이 나트륨/칼륨 이상 유발"], red: ["심한 무기력·경련·의식저하·부정맥(두근·실신) → 응급"] },
  "신장결석": { drug: "수분·진통제·알파차단제 배출유도, 큰 결석은 체외충격파/내시경", comp: ["수신증·요로감염·신기능 저하"], red: ["극심한 옆구리 통증 + 고열·오한(감염 동반)·소변량 급감 → 즉시 응급"] },
  "뇌혈관질환": { drug: "위험인자 관리·항혈소판/항응고, 협착은 시술/수술", comp: ["뇌졸중·혈관성치매"], red: ["갑자기 한쪽 마비·발음장애·시야장애·심한 두통 → 즉시 119(골든타임 4.5시간)"] },
  "말초신경병증": { drug: "원인(당뇨·비타민결핍·독성) 교정, 통증은 항경련제/항우울제", comp: ["감각소실→상처·궤양", "보행장애·낙상"], red: ["급속히 진행하는 대칭성 위약·호흡곤란(길랑-바레 등) → 즉시 응급"] },
  "긴장성두통": { drug: "생활관리·스트레칭, 진통제(과용 금지)·예방약", comp: ["약물과용두통·만성화"], interact: ["진통제 주 10일↑ 상습 복용은 약물과용두통 유발"], red: ["평소와 다른 벼락두통·마비·발열·목경직 → 이차성 두통 감별 응급"] },
  "본태성진전": { drug: "베타차단제(프로프라놀롤)·프리미돈, 심하면 시술", comp: ["삶의 질·글씨/식사 어려움"], interact: ["카페인·스트레스·피로는 악화, 소량 음주로 완화되나 치료법 아님"], red: ["안정 시 떨림·느린 동작·보행장애 동반(파킨슨 감별) → 진료"] },
  "자궁근종": { drug: "무증상은 경과관찰, 증상은 호르몬치료·색전술·수술", comp: ["빈혈(과다월경)", "압박·난임·드문 변성"], red: ["갑작스런 심한 골반통·발열(근종 변성/염전)·다량 출혈로 어지럼 → 응급"] },
  "질염": { drug: "원인별(칸디다 항진균제·세균성 메트로니다졸·트리코모나스)", comp: ["재발·상행감염(골반염)", "임신 합병증"], interact: ["메트로니다졸 복용 중 음주는 심한 구역·홍조(디설피람 반응) → 금주"] },
  "월경장애": { drug: "원인별 호르몬조절·경구피임약·지혈, 기저질환 치료", comp: ["빈혈", "기저질환(다낭성·갑상선·근종) 신호"], red: ["과다 출혈로 어지럼·실신·큰 핏덩이 지속 → 진료"] },
  "소아비만": { drug: "가족 참여 식이·활동 습관이 기본", comp: ["소아 당뇨·지방간·고혈압", "성조숙·심리문제"], age: ["성장기이므로 무리한 절식보다 습관 개선"], red: [] },
  "소아천식": { drug: "흡입 스테로이드(조절제)·속효성 기관지확장제(완화제)", comp: ["급성악화·응급실 방문", "성장·활동 제한"], age: ["밤·새벽 기침·쌕쌕거림 반복, 운동 시 기침"], red: ["완화제에 반응 없는 심한 호흡곤란·말 못함·늑골 함몰·입술 청색 → 즉시 119"] },
  "성장지연": { drug: "원인(성장호르몬결핍·갑상선·만성질환·영양) 평가·교정", comp: ["최종키 손실·심리적 영향"], age: ["성장곡선 이탈·또래보다 현저히 작음 → 조기 평가가 중요"], red: [] },
  "ADHD": { drug: "행동치료·환경조정 + 필요 시 약물(메틸페니데이트 등)", comp: ["학습·또래관계 문제", "동반 불안·우울·틱"], interact: ["자극제는 식욕저하·수면지연·심박/혈압 상승 → 심장 이상력 확인, 정기 관찰"], red: ["약 복용 후 흉통·실신·심한 기분변화 → 진료"] },
  "성조숙증": { drug: "필요 시 사춘기지연 주사(GnRH작용제)로 최종키·심리 보호", comp: ["최종키 손실·심리적 부담"], age: ["여아 8세·남아 9세 이전 2차성징 → 평가"], red: [] },
  "영유아 발달지연": { drug: "조기 재활·언어·작업치료, 원인 평가", comp: ["학습·사회성 지연"], age: ["뒤집기·앉기·걷기·말 등 발달 이정표 지연 → 조기중재가 예후 좌우"], red: ["발달이 오히려 퇴행(하던 걸 못함)·경련 → 즉시 진료"] },
  "미숙아": { drug: "신생아집중치료·호흡/영양지원·감염관리", comp: ["호흡곤란·감염·미숙아망막병증", "발달지연"], age: ["교정연령으로 발달 평가, 예방접종·안검진 일정 준수"], red: ["무호흡·청색증·처짐·수유거부·발열/저체온 → 즉시 응급"] },
  "퇴행성관절염": { drug: "체중관리·운동·물리치료, 진통(아세트아미노펜/NSAID)·주사, 말기 인공관절", comp: ["통증·기능장애·변형"], interact: ["NSAID 장기복용은 위장출혈·신장·혈압 주의(고령)"], red: ["관절이 갑자기 붓고 열나고 심한 통증(감염성/결정성 관절염 감별) → 진료"] },
  "요통": { drug: "대부분 보존치료(활동유지·물리치료·진통), 원인별 치료", comp: ["만성화", "신경압박"], red: ["다리 마비·대소변 장애·회음부 감각소실(마미증후군), 발열·체중감소·야간통(감염·종양) → 응급/진료"] },
  "회전근개파열": { drug: "물리치료·소염·주사, 완전파열·기능장애는 수술", comp: ["오십견·근위축", "재파열"], red: ["외상 후 팔을 전혀 못 듦·급격한 근력저하 → 진료"] },
  "오십견": { drug: "스트레칭·물리치료·소염·관절내주사(대개 자연호전)", comp: ["장기 운동제한·근위축"], red: ["외상·발열 동반·야간 심한 통증 지속 → 다른 원인 감별"] },
  "척추측만증": { drug: "경과관찰·보조기, 심한 각도는 수술", comp: ["체형변화·요통", "중증은 폐기능 영향"], age: ["성장기 급격 진행 → 정기 관찰이 중요"], red: ["급격한 곡선 진행·호흡곤란·다리 신경증상 → 진료"] },
  "반월상연골손상": { drug: "안정·물리치료, 잠김/불안정은 관절경 수술", comp: ["연골손상·조기 관절염"], red: ["무릎이 걸려 안 펴짐(잠김)·심한 부종·불안정 → 진료"] },
  "인대손상": { drug: "RICE(안정·냉찜질·압박·거상)·재활, 완전파열은 수술", comp: ["관절 불안정·재손상"], red: ["관절 심한 불안정·체중부하 불가·변형 → 골절 감별 진료"] },
  "골관절염": { drug: "체중관리·운동·물리치료·진통제, 진행 시 주사/수술", comp: ["통증·변형·기능장애"], red: ["관절 급성 발적·발열·극심한 통증(감염/통풍 감별) → 진료"] },
  "알레르기비염": { drug: "회피·비강 스테로이드·항히스타민제·면역치료", comp: ["부비동염·중이염·수면장애", "천식 동반"], interact: ["1세대 항히스타민제는 졸림·운전주의"], red: [] },
  "탈모": { drug: "남성형은 피나스테리드/미녹시딜, 원형탈모는 스테로이드·면역치료", comp: ["심리적 위축"], interact: ["피나스테리드는 임신부 접촉 금기(태아위험), 성기능 부작용 가능"], red: ["넓은 부위 급속 탈모·두피 흉터·전신증상 동반 → 진료(원인 감별)"] },
  "여드름": { drug: "국소(레티노이드·과산화벤조일·항생제), 중증은 경구 이소트레티노인", comp: ["흉터·색소침착", "심리적 영향"], interact: ["이소트레티노인은 강력한 기형유발 → 임신 절대 금기·헌혈 금지·간/지질 검사"], red: [] },
  "백반증": { drug: "국소 스테로이드/칼시뉴린억제제·광선치료", comp: ["미용·심리적 영향", "자가면역질환 동반 가능"], red: [] },
  "무좀": { drug: "국소 항진균제, 손발톱은 경구 항진균제(장기)", comp: ["이차 세균감염(봉와직염)", "재발"], age: ["당뇨·혈관질환자는 상처·감염 주의"], red: ["당뇨환자 발이 붓고 붉고 열남(봉와직염) → 진료"] },
  "습진": { drug: "보습·국소 스테로이드/칼시뉴린억제제, 유발인자 회피", comp: ["이차감염·태선화"], red: ["진물·고름·발열 동반 급속 악화(감염) → 진료"] },
  "사마귀": { drug: "냉동·국소약·레이저(HPV, 면역에 따라 자연소실도)", comp: ["전염·재발"], red: [] },
  "지루피부염": { drug: "항진균·저강도 스테로이드 샴푸/크림, 만성 재발성 관리", comp: ["가려움·재발"], red: [] },
  "근시": { drug: "안경·콘택트·드림렌즈, 성인은 라식/라섹/렌즈삽입", comp: ["고도근시는 망막박리·녹내장·황반변성 위험↑"], age: ["소아 진행 억제(저농도 아트로핀·드림렌즈) 상담"], red: ["갑작스런 시력저하·번쩍임·날파리 급증·시야 커튼(망막박리) → 즉시 안과"] },
  "백내장": { drug: "진행 시 수정체 인공수정체 교체 수술(효과적)", comp: ["수술 미시행 시 시력저하", "드물게 녹내장 유발"], age: ["고령에서 흔함, 눈부심·야간시력 저하"], red: ["갑작스런 통증·충혈·급격한 시력저하 → 다른 응급질환 감별"] },
  "노안": { drug: "돋보기·다초점 안경/렌즈, 필요 시 수술", comp: ["근거리 작업 피로"], age: ["40대부터 자연 진행"], red: [] },
  "결막염": { drug: "세균성 항생제 점안·바이러스성 대증(전염주의)·알레르기성 항히스타민", comp: ["각막염(시력위협)", "유행성 전파"], red: ["심한 통증·시력저하·빛 눈부심(각막 침범) → 안과"] },
  "안구건조증": { drug: "인공눈물·눈꺼풀 관리·항염 점안(사이클로스포린 등)", comp: ["각막손상·시력저하", "삶의 질 저하"], interact: ["항히스타민·일부 혈압/우울약이 건조 악화"], red: ["심한 통증·시력저하·충혈 지속 → 각막손상 감별"] },
  "사시": { drug: "교정안경·가림치료·프리즘, 필요 시 수술", comp: ["약시·입체시 저하"], age: ["소아 조기치료가 약시 예방에 중요"], red: ["갑작스런 사시·복시·두통·처진 눈꺼풀(신경마비) → 즉시 진료"] },
  "약시": { drug: "원인교정(안경)·가림/약물치료(건강한 눈 가리기)", comp: ["영구 시력저하(치료시기 놓치면)"], age: ["만 8세 이전 조기치료가 결정적 → 소아 시력검사"], red: [] },
  "익상편": { drug: "인공눈물·자외선 차단, 시력/미용 문제 시 수술", comp: ["난시·시력저하", "재발"], red: [] },
  "중이염": { drug: "급성은 대증/항생제, 삼출성은 경과관찰·환기관, 만성은 수술", comp: ["청력저하·고막천공", "드물게 유양돌기염·안면마비"], age: ["영유아에서 흔함, 보채고 귀 만지고 발열"], red: ["귀 뒤 붓고 발열·심한 두통·안면마비·어지럼(합병증) → 즉시 진료"] },
  "어지럼증": { drug: "원인별 — BPPV는 이석정복술, 전정신경염 대증, 중추성은 원인치료", comp: ["낙상", "중추성(뇌졸중) 놓침"], red: ["어지럼에 발음장애·복시·한쪽마비·심한 두통·보행불가(중추성/뇌졸중) → 즉시 119"] },
  "부비동염": { drug: "급성은 대증(±항생제), 만성은 비강스테로이드·비세척·수술", comp: ["안와·두개내 감염(드묾)"], red: ["눈 주위 붓고 붉음·시력변화·복시·심한 두통·고열(안와/두개 합병증) → 즉시 응급"] },
  "알레르기성비염": { drug: "회피·비강 스테로이드·항히스타민제·면역치료", comp: ["부비동염·중이염·수면/집중 저하", "천식 동반"], red: [] },
  "이명": { drug: "원인 평가·소리치료·인지행동치료, 동반 난청 관리", comp: ["수면·집중·우울"], red: ["한쪽 박동성 이명·갑작스런 난청·어지럼·신경증상 → 진료(혈관/종양·돌발성난청 감별)"] },
  "편도염": { drug: "대증(수분·진통), 세균성(연쇄구균)은 항생제", comp: ["편도주위농양", "류마티스열·사구체신염(연쇄구균)"], red: ["침도 못 삼킴·입 못 벌림·한쪽 심한 부종·목소리 변화(편도주위농양)·호흡곤란 → 즉시 응급"] },
  "후두염": { drug: "음성휴식·수분·대증, 세균감염 시 항생제", comp: ["기도폐색(급성후두개염·크룹)"], age: ["소아: 컹컹 기침·쌕쌕(크룹)"], red: ["침 흘리며 못 삼킴·앉아서 고개 내밀고 힘겨운 호흡·고열(급성후두개염) → 즉시 119(기도응급)"] },
  "코골이": { drug: "체중감량·측와위·금주, 무호흡 동반 시 양압기/수술", comp: ["수면무호흡→고혈압·심혈관·주간졸림"], red: ["자다 숨 멈춤·심한 주간졸림·아침 두통 → 수면검사(무호흡 감별)"] },
  "인후두역류질환": { drug: "생활습관(취침 전 금식·체중)·PPI, 원인관리", comp: ["만성 후두자극·쉰목소리", "드물게 협착"], red: ["삼킴곤란·체중감소·목 멍울·지속되는 쉰목소리 → 진료(종양 감별)"] },
  "청력손실": { drug: "원인별 — 전음성은 치료/수술, 감각신경성은 보청기·인공와우", comp: ["의사소통·인지·우울"], age: ["고령 난청 방치는 인지저하↑ → 조기 보청기"], red: ["갑자기 한쪽 귀 안 들림(돌발성난청) → 72시간 내 즉시 이비인후과"] },
  "발기부전": { drug: "PDE5억제제(실데나필 등)·생활습관·원인질환 치료", comp: ["심혈관질환의 조기신호일 수 있음", "심리적 위축"], interact: ["PDE5억제제 + 질산염(니트로글리세린)·일부 전립선약 → 위험한 저혈압, 절대 병용 금기"], age: ["중년 발기부전은 당뇨·심혈관 위험 신호 → 검진 권장"], red: ["4시간 이상 지속되는 통증성 발기(지속발기증) → 즉시 응급(조직손상)"] },
  "방광염": { drug: "충분한 수분·단기 항생제", comp: ["신우신염(상행)", "재발"], age: ["여성에서 흔함, 임신 중은 적극 치료"], red: ["고열·오한·옆구리통증·구토(신우신염) → 응급"] },
  "정계정맥류": { drug: "대부분 경과관찰, 통증·난임·위축은 수술/색전", comp: ["난임·고환위축"], red: ["갑작스런 심한 고환통증·부종(염전 감별) → 즉시 응급"] },
  "혈뇨": { drug: "원인규명이 핵심(결석·감염·종양·신질환)", comp: ["기저 종양(방광·신장암) 놓침", "빈혈(다량출혈)"], age: ["40세↑·흡연·통증 없는 혈뇨는 비뇨기암 감별 필수"], red: ["다량 혈뇨로 소변 못 봄(응고 폐색)·어지럼·발열 동반 → 응급"] },
  "과민성방광": { drug: "방광훈련·골반저운동, 항무스카린제/베타3작용제", comp: ["삶의 질 저하·수면장애", "절박성 요실금"], interact: ["항무스카린제는 노인 인지저하·변비·구갈·요폐 주의"], red: ["혈뇨·통증·발열 동반(감염·종양 감별) → 진료"] },
  "요도염": { drug: "성매개감염(임질·클라미디아) 항생제, 파트너 동시치료", comp: ["부고환염·전립선염", "여성 상행감염(골반염)·난임"], red: ["고열·회음부/음낭 심한 통증·부종(부고환염·전립선염) → 진료"] },
  "적응장애": { drug: "심리치료·스트레스 관리, 필요 시 단기 증상약", comp: ["우울·불안으로 진행", "기능저하"], red: ["자살 생각·심한 무기력으로 일상 불가 → 진료"] },
  "신체화장애": { drug: "규칙적 단일주치의 관리·인지행동치료, 동반 우울/불안 치료", comp: ["불필요한 검사·시술 반복", "기능저하"], red: ["새로 발생한 객관적 이상소견(체중감소·발열·출혈 등) → 기질적 질환 재평가"] },
  "충치": { drug: "충전·크라운, 깊으면 신경치료", comp: ["치수염·치근단농양", "치아상실"], red: ["심한 욱신거림·잇몸/얼굴 붓기·발열(농양) → 진료"] },
  "치수염": { drug: "신경치료(근관치료)·통증조절", comp: ["치근단농양·봉와직염", "치아상실"], red: ["얼굴·목 붓고 열나며 입 벌리기/삼킴 곤란(심부감염) → 즉시 응급"] },
  "부정교합": { drug: "교정치료(장치·투명교정), 골격성은 수술 병행", comp: ["저작·발음·턱관절 문제", "충치·치주질환↑"], red: [] },
  "구내염": { drug: "대증(가글·국소약), 대부분 1~2주 자연치유", comp: ["통증으로 섭식저하", "탈수(소아)"], red: ["2주 이상 낫지 않는 궤양·멍울·출혈(구강암 감별)·고열·못 먹어 탈수 → 진료"] },
  "사랑니매복": { drug: "증상·위험 시 발치, 무증상은 경과관찰", comp: ["지치주위염·인접치 손상·낭종"], red: ["잇몸 심한 부종·고름·입 못 벌림·발열·삼킴곤란(심부감염) → 즉시 응급"] },
  "턱관절장애": { drug: "생활관리(딱딱한 것 피하기)·물리치료·교합안정장치·약물", comp: ["만성통증·개구제한"], red: ["입이 안 다물어지거나 안 벌어짐(탈구·잠김)·심한 통증 → 진료"] },
  "소화불량": { drug: "생활습관·원인별(위산억제·위장운동촉진), H.pylori 있으면 제균", comp: ["기질적 질환(궤양·암) 감별 필요"], red: ["체중감소·삼킴곤란·토혈/흑색변·빈혈·55세↑ 새 증상(경고징후) → 위내시경"] },
  "만성요통": { drug: "운동·물리치료·자세교정·약물, 원인별 치료", comp: ["기능저하·우울", "신경압박"], red: ["다리 마비·대소변 장애·발열·체중감소·야간통 → 응급/정밀검사"] },
  "견비통": { drug: "스트레칭·물리치료·소염·주사, 원인(회전근개·오십견·경추) 감별", comp: ["운동제한·근위축"], red: ["외상 후 팔 못 듦·목에서 팔로 저림·힘빠짐 동반 → 진료"] },
  "수족냉증": { drug: "보온·금연·운동, 기저질환(레이노·갑상선·빈혈·혈관질환) 감별", comp: ["레이노현상", "동상 위험"], red: ["손발이 창백→청색→통증으로 변하고 궤양·괴사(중증 레이노/혈관폐색) → 진료"] },
  "안면신경마비": { drug: "벨마비는 조기 스테로이드(±항바이러스제)·눈 보호·재활", comp: ["불완전 회복", "노출성 각막손상"], red: ["얼굴마비에 팔다리 위약·발음장애·심한 두통 동반 → 즉시 119(뇌졸중 감별)"] },
  "만성두통": { drug: "유형별(긴장성·편두통) 관리·예방약, 진통제 과용 금지", comp: ["약물과용두통·만성화·우울"], interact: ["진통제 주 10일↑ 상습복용은 약물과용두통 악화"], red: ["평소와 다른 벼락두통·마비·발열·목경직·시야장애(이차성) → 즉시 응급"] },
  "산후조리": { drug: "휴식·영양·수유지원·산후 우울 선별", comp: ["산후출혈·감염·혈전", "산후우울"], red: ["다량 질출혈·발열·심한 복통·한쪽 다리 붓고 아픔(혈전)·자해 생각 → 즉시 진료/응급"] },
};
/* 이름 정규화 매칭 — 데이터하우스 표기(위십이지장궤양)와 심화표기(위·십이지장궤양), 급성심근경색↔심근경색 등 흡수 */
function _deepFind(name) {
  if (!name) return null;
  if (DZ_DEEP[name]) return DZ_DEEP[name];
  const norm = (s) => (s || "").replace(/[·\s]/g, "");
  const nn = norm(name);
  const keys = Object.keys(DZ_DEEP);
  const exact = keys.find((k) => norm(k) === nn);
  if (exact) return DZ_DEEP[exact];
  const partial = keys.filter((k) => { const nk = norm(k); return nk.length >= 2 && (nn.includes(nk) || nk.includes(nn)); }).sort((a, b) => b.length - a.length)[0];
  return partial ? DZ_DEEP[partial] : null;
}
/* 최근 상담의 영양소·홈케어기기 추천을 건강쇼핑 당당상담 AI로 넘기기 위해 보관 */
function careRecSet(supp, device, dz) { try { if (typeof window !== "undefined") window._lastCareRec = { supp: (supp || []).slice(0, 8), device: (device || []).slice(0, 8), dz: dz || "" }; } catch (e) {} }
const SHOP_SUPP_BTN = "🛒 건강쇼핑에서 성분·제품 보기";
const SHOP_DEVICE_BTN = "🛒 홈케어 기기 보기";
/* 홈케어기기 직결 생활관리 명사(질병 KB에 없는 미용·관절·여성건강 등) — 건강 정보를 먼저 알려주고,
   그 안에서 '홈케어 기기 보기'를 누르면(원할 때만) GN바디닥터로 자연 연결. 상품·가격·브랜드 강조 없음. */
const GN_DEVICE_TOPICS = [
  { keys: ["주름", "리프팅", "탄력", "안티에이징", "동안피부", "피부탄력"], area: "피부 탄력·주름 관리",
    tips: ["자외선 차단이 광노화 예방의 핵심이에요(사계절 SPF)", "보습·충분한 수면·금연", "비타민C·단백질 등 균형 잡힌 영양"],
    dev: "집에서 꾸준히 관리하고 싶다면 가정용 피부 케어 기기도 도움이 될 수 있어요.",
    groups: ["skin"] },
  { keys: ["피부관리", "피부미용", "피부톤", "모공", "뷰티디바이스"], area: "피부 관리",
    tips: ["세안·보습·자외선 차단 기본 루틴", "충분한 수분·수면", "자극(과한 각질제거·뜨거운 물) 최소화"],
    dev: "홈 뷰티 디바이스로 꾸준한 관리를 이어갈 수 있어요.",
    groups: ["skin"] },
  { keys: ["관절", "무릎관리", "무릎통증", "관절통증", "무릎"], area: "관절 건강",
    tips: ["적정 체중 유지로 관절 부담을 줄여요", "저충격 운동(수영·자전거)·근력 강화", "무리한 충격·계단 과사용 주의"],
    red: "붓고 열나거나 극심한 통증이 지속되면 정형외과 진료를 받으세요.",
    dev: "온열·저주파 홈케어 기기가 통증 완화·이완에 도움이 될 수 있어요.",
    groups: ["msk"], care: ["관절 재활 운동"] },
  { keys: ["여성건강", "여성질환", "여성질병", "질건강"], area: "여성 건강·골반저 케어",
    tips: ["규칙적인 골반저근(케겔) 운동", "수분·배뇨 습관 관리", "정기 부인과 검진"],
    red: "출혈·통증·발열 등 이상 증상은 병원 진료가 우선이에요.",
    dev: "골반저근 강화를 돕는 가정용 기기도 함께 활용할 수 있어요.",
    groups: ["women"], pin: ["요실금"], care: ["산후관리", "갱년기 관리"] },
];
/* 비질병 케어 토픽 상담 — 산후관리·골반저근·갱년기·산부인과·관절재활 등. 클릭·질의 시 전용 생활관리 상담. */
const CARE_TOPICS = [
  { keys: ["산후관리", "산후회복", "산후조리", "출산후", "산후"], title: "산후 관리",
    intro: "출산 후 6~8주(산욕기)는 몸이 임신 전으로 회복되는 시기예요. 무리하지 않고 이렇게 관리하면 좋아요.",
    tips: ["오로(분비물)는 색·양이 점점 줄어드는 게 정상 — 갑자기 늘거나 악취 나면 진료", "골반저근(케겔) 운동으로 요실금·골반 회복", "수분·단백질·철분 충분히(빈혈 예방)", "수유 시 유방 울혈·유선염 주의", "산후 6주 검진 꼭 받기"],
    red: "대량 출혈·심한 복통·38도 이상 발열·가슴 멍울+발열·심한 우울·무기력은 바로 진료하세요.",
    dev: "", follow: ["골반저근 관리", "방광염", "🏥 병원·진료 안내"] },
  { keys: ["골반저", "케겔", "골반저근", "케겔운동"], title: "골반저근(케겔) 관리",
    intro: "골반저근은 방광·자궁을 받치는 근육이에요. 꾸준히 단련하면 요실금 예방·산후 회복·골반 건강에 도움이 돼요.",
    tips: ["소변을 참듯 항문·질을 조여 5초 유지 후 이완 — 10회 3세트/일", "배·허벅지 힘은 빼고 숨은 참지 않기", "앉아서·누워서 언제든 가능", "기침·재채기 전 미리 조이면 복압성 요실금 예방"],
    red: "운동해도 요실금이 지속·악화되거나 골반 통증·묵직함이 심하면 비뇨의학과·산부인과 진료를 받으세요.",
    dev: "가정용 골반저근 트레이너로 강도를 관리할 수 있어요.", follow: ["요실금", "산후관리", "🏥 병원·진료 안내"] },
  { keys: ["갱년기", "폐경"], title: "갱년기 관리",
    intro: "폐경 전후 호르몬 변화로 홍조·수면장애·기분변화·골밀도 감소가 올 수 있어요. 생활관리로 완화할 수 있어요.",
    tips: ["규칙적 유산소+근력 운동(골밀도·기분)", "칼슘·비타민D·단백질 충분히", "카페인·술·매운 음식(홍조 유발) 줄이기", "수면 위생·스트레스 관리", "증상이 심하면 호르몬치료 등 전문 상담"],
    red: "폐경 후 질출혈·심한 우울·가슴 통증은 바로 진료하세요.",
    dev: "", follow: ["골다공증", "자궁근종", "골반저근 관리", "🏥 병원·진료 안내"] },
  { keys: ["산부인과"], title: "산부인과 진료 안내",
    intro: "산부인과는 여성 생식기·임신·출산·폐경 전반을 다뤄요. 이럴 때 방문하시면 좋아요.",
    tips: ["비정상 출혈·심한 생리통·분비물 이상", "계획임신·임신 확인·산전관리", "자궁경부암 검진(만 20세↑ 2년마다)·초음파", "폐경·갱년기 증상 상담", "피임·성건강 상담"],
    red: "심한 하복통+발열, 임신 중 출혈·복통은 바로 진료하세요.",
    dev: "", follow: ["질염", "자궁근종", "방광염", "🏥 병원·진료 안내"] },
  { keys: ["관절재활", "재활운동", "관절운동", "근력강화운동"], title: "관절 재활·운동 관리",
    intro: "관절은 '안 쓰면 굳고, 무리하면 상해요'. 통증 없는 범위에서 꾸준히 움직이는 게 핵심이에요.",
    tips: ["저충격 운동(수영·자전거·평지 걷기)", "관절 주변 근력 강화(허벅지·둔부)", "스트레칭·가동범위 운동", "온열로 이완 후 운동, 급성 통증 시 냉찜질·휴식"],
    red: "갑작스런 심한 통증·부종·무릎이 안 펴짐(잠김)은 진료를 받으세요.",
    dev: "온열·저주파 홈케어 기기가 이완·통증 완화에 도움이 될 수 있어요.", follow: ["골관절염", "류마티스관절염", "🏥 병원·진료 안내"] },
];
function careTopicCounsel(text) {
  const t = (text || "").replace(/\s/g, ""); if (!t || t.length > 16) return null;
  const hit = CARE_TOPICS.find((c) => c.keys.some((k) => t.includes(k))); if (!hit) return null;
  const items = hit.tips.map((x) => `· ${x}`);
  if (hit.dev) items.push(hit.dev);
  if (hit.red) items.push(`🚨 ${hit.red}`);
  return { bubbles: [
    { kind: "text", text: `${hit.title}에 대해 알려드릴게요.\n${hit.intro}\n※ 참고용 안내이며 진단·치료를 대체하지 않아요.` },
    { kind: "card", card: { title: `🩺 ${hit.title}`, items, buttons: hit.dev ? [SHOP_DEVICE_BTN] : [] } },
  ], quicks: (hit.follow || ["🏥 병원·진료 안내", "내 리포트 요약"]).slice(0, 5) };
}
/* 주제 → 관련 질환을 질환 온톨로지(DZ_GROUPS)에서 자동 도출 — 그룹에 질환을 추가하면 유도 버튼도 자동 확장.
   pin은 그룹 경계를 넘어 임상적으로 관련된 질환(예: 여성 골반건강↔요실금)을 우선 연결. */
function _topicDiseases(topic) {
  const out = []; (topic.pin || []).forEach((n) => { if (!out.includes(n)) out.push(n); });
  const GRP = (typeof DZ_GROUPS !== "undefined") ? DZ_GROUPS : [];
  (topic.groups || []).forEach((gk) => { const g = GRP.find((x) => x.key === gk); if (g) g.members.forEach((m) => { if (!out.includes(m.name)) out.push(m.name); }); });
  return out;
}
// 일반(비질병) 주제 상담 — 생활관리 정보를 먼저 주고, 온톨로지가 연결한 관련 질환을 고르면 본격 상담으로 이어짐.
function gnDeviceCounsel(text) {
  const t = (text || "").replace(/\s/g, "");
  if (!t || t.length > 16) return null; // 짧은 명사형 질의만(문장형은 일반 상담으로)
  const hit = GN_DEVICE_TOPICS.find((g) => g.keys.some((k) => t.includes(k)));
  if (!hit) return null;
  if (typeof careRecSet === "function") careRecSet([], [], hit.area);
  const dz = _topicDiseases(hit).slice(0, 3);
  const care = hit.care || [];
  const follow = dz.concat(care).concat(["🏥 병원·진료 안내"]).slice(0, 6);
  const items = hit.tips.map((x) => `· ${x}`);
  if (hit.red) items.push(`※ ${hit.red}`);
  items.push(hit.dev);
  const picks = dz.concat(care).slice(0, 3).join(" · ");
  return { bubbles: [
    { kind: "text", text: `${hit.area}에 대해 알려드릴게요. 생활 속에서 이렇게 관리하면 도움이 돼요.\n※ 참고용 안내이며 진단·치료를 대체하지 않아요.` },
    { kind: "card", card: { title: `🩺 ${hit.area} 생활관리`, items, buttons: [SHOP_DEVICE_BTN] } },
    { kind: "text", text: picks ? `혹시 아래 증상·관리가 궁금하시면 눌러 주세요 — 바로 자세히 상담해 드릴게요.\n(예: ${picks} 등)` : "궁금한 증상·관리를 눌러 주시면 자세히 상담해 드릴게요." },
  ], quicks: follow };
}
function deepCards(name) {
  const d = _deepFind(name); if (!d) return [];
  const out = [];
  const dc = []; if (d.drug) dc.push(`💊 약물·치료: ${d.drug}`); (d.comp || []).forEach((c) => dc.push(`⚠️ 합병증: ${c}`));
  if (dc.length) out.push({ kind: "card", card: { title: "💊 주요 약물·치료 · ⚠️ 합병증", items: dc, buttons: [] } });
  if ((d.interact || []).length) out.push({ kind: "card", card: { title: "💊 복약·상호작용 주의 (약·음식 함께 먹을 때)", items: d.interact, buttons: [] } });
  if ((d.age || []).length) out.push({ kind: "card", card: { title: "👶🧓 연령·성별 맞춤 주의신호", items: d.age, buttons: [] } });
  if ((d.red || []).length) out.push({ kind: "card", card: { title: "🚨 응급신호 — 이럴 땐 즉시 병원·119", items: d.red, buttons: ["🚨 응급신호 자가체크"] } });
  return out;
}
/* DZ_DEEP에만 있고 데이터하우스 197개에 없는 질환(예: 뇌수막염)도 상담되도록 */
function deepOnlyCounsel(text) {
  const norm = (s) => (s || "").replace(/[·\s]/g, "");
  const nt = norm(text);
  const key = Object.keys(DZ_DEEP).filter((k) => { const nk = norm(k); return nk.length >= 2 && nt.includes(nk); }).sort((a, b) => b.length - a.length)[0];
  if (!key) return null;
  const cards = deepCards(key); if (!cards.length) return null;
  return { bubbles: [{ kind: "text", text: `${key}의 약물·치료·합병증·복약주의·응급신호를 정리해 드릴게요.\n※ 초안(전문가 검토 전제) — 실제 처방·용량은 의료진과 상의하세요.` }, ...cards], quicks: ["🏥 병원·진료 안내", "내 리포트 요약"] };
}
/* ====== 약물 상담 DB — 약물명으로 물어도 효능·복용법·부작용·상호작용·응급신호 안내 ======
   ※ 초안(전문가 검토 전제) — 실제 처방·용량·중단은 반드시 의료진·약사와 상의. 진단·처방을 대체하지 않습니다. */
const DRUG_KB = {
  "메트포르민": { alias: ["글루코파지", "다이아벡스"], use: "2형 당뇨 1차 혈당강하제(인슐린 저항성 개선)", dose: "위장장애 줄이려 식사 중/후 복용, 서서히 증량", side: ["속쓰림·설사·메스꺼움(대개 적응)", "장기복용 시 비타민B12 저하", "드물게 젖산산증"], caution: ["조영제 촬영 전후·심한 탈수·수술 시 일시중단", "심한 신장·간 기능저하 시 주의"], red: ["심한 근육통·과호흡·심한 무기력·복통(젖산산증) → 즉시 응급"] },
  "인슐린": { alias: ["란투스", "휴마로그", "노보래피드"], use: "혈당을 낮추는 주사호르몬(1형·필요한 2형·임신성 당뇨)", dose: "종류별 작용시간 다름, 식사·활동에 맞춰 용량·시간 준수, 주사부위 교체", side: ["저혈당", "주사부위 지방변형", "체중증가"], caution: ["식사 거르거나 음주·운동 늘면 저혈당↑, 사탕·주스 상비", "보관온도(냉장) 준수"], red: ["식은땀·떨림·혼란 후 의식저하·경련(중증 저혈당) → 당분 공급, 의식 없으면 119"] },
  "SGLT2억제제": { alias: ["자디앙", "포시가", "엠파글리플로진", "다파글리플로진"], use: "당뇨 혈당강하 + 심장·신장 보호", dose: "1일 1회, 수분 충분히", side: ["요로·생식기 감염", "탈수·저혈압", "드물게 정상혈당 케톤산증"], caution: ["금식·수술·심한 감염 시 일시중단 상의, 회음부 통증·부종(괴사성근막염) 주의"], red: ["구역·구토·복통·과호흡(케톤산증), 회음부 심한 통증·발열 → 즉시 응급"] },
  "GLP-1": { alias: ["삭센다", "위고비", "오젬픽", "리라글루타이드", "세마글루타이드"], use: "당뇨 혈당강하·체중감량(식욕조절)", dose: "주사(일부 경구), 서서히 증량", side: ["구역·구토·변비(대개 적응)", "식욕저하"], caution: ["췌장염·담석 병력 주의, 갑상선수질암 가족력 시 상의"], red: ["심한 명치~등 통증·지속 구토(췌장염) → 즉시 응급"] },
  "스타틴": { alias: ["아토르바스타틴", "로수바스타틴", "리피토", "크레스토", "심바스타틴"], use: "LDL콜레스테롤 강하로 심근경색·뇌졸중 예방", dose: "1일 1회(대개 저녁), 꾸준히 복용", side: ["근육통", "간효소 상승", "드물게 혈당 약간↑"], caution: ["자몽주스·일부 항생제(마크로라이드)·피브레이트 병용 시 근육병증↑", "근육통·갈색뇨 생기면 알리기"], red: ["심한 근육통·힘 빠짐·콜라색 소변(횡문근융해) → 진료"] },
  "아스피린": { alias: ["아스트릭스", "저용량아스피린"], use: "항혈소판(심근경색·뇌졸중 예방) 또는 해열진통", dose: "예방은 저용량 1일 1회, 위장보호 위해 식후", side: ["위장출혈·속쓰림", "출혈경향", "드물게 천식 악화"], caution: ["다른 항혈소판·항응고제·NSAID 병용 시 출혈↑, 수술·시술 전 중단 여부 상의", "소아 바이러스감염 시 금기(라이증후군)"], red: ["토혈·흑색변·멎지 않는 출혈·심한 복통 → 응급"] },
  "클로피도그렐": { alias: ["플라빅스", "항혈소판제"], use: "스텐트·심근경색·뇌졸중 후 혈전 예방", dose: "1일 1회, 임의 중단 금지(스텐트 혈전 위험)", side: ["출혈경향·멍", "위장장애"], caution: ["일부 위장약(오메프라졸)·NSAID와 상호작용, 수술·발치 전 반드시 상의"], red: ["멎지 않는 출혈·흑색변·갑작스런 한쪽 마비/흉통 → 응급"] },
  "와파린": { alias: ["쿠마딘", "항응고제"], use: "심방세동·기계판막·혈전에서 혈전 예방", dose: "매일 같은 시간, 정기적 INR 혈액검사로 용량 조절", side: ["출혈(잇몸·코피·혈뇨·멍)"], caution: ["비타민K 많은 음식(시금치·낫토·녹즙) 섭취량을 갑자기 바꾸지 말 것, 항생제·소염제·많은 약과 상호작용 커 새 약 전 반드시 확인, 음주 주의"], red: ["멎지 않는 출혈·검은변·붉은/갈색 소변·심한 두통(뇌출혈) → 즉시 응급"] },
  "DOAC": { alias: ["엘리퀴스", "자렐토", "아픽사반", "리바록사반", "에독사반", "프라닥사"], use: "심방세동·정맥혈전에서 혈전 예방(INR 검사 불필요)", dose: "1일 1~2회 정시 복용, 빠뜨리면 임의로 두 배 복용 금지", side: ["출혈경향"], caution: ["신기능에 따라 용량조절, NSAID·항혈소판 병용 출혈↑, 수술 전 중단시점 상의"], red: ["멎지 않는 출혈·검은변·심한 두통·갑작스런 마비 → 즉시 응급"] },
  "암로디핀": { alias: ["노바스크", "칼슘차단제"], use: "고혈압·협심증(혈관확장)", dose: "1일 1회", side: ["발목 부종", "안면홍조·두통", "잇몸 비대"], caution: ["자몽주스와 병용 시 작용↑, 다른 혈압약과 저혈압 주의"], red: ["실신할 듯한 어지럼·심한 저혈압 → 진료"] },
  "ARB": { alias: ["로사르탄", "텔미사르탄", "발사르탄", "칸데사르탄", "아모잘탄"], use: "고혈압·심부전·신장보호", dose: "1일 1회, 꾸준히", side: ["어지럼", "드물게 고칼륨"], caution: ["칼륨보충제·칼륨보존이뇨제 병용 시 고칼륨, NSAID는 효과↓·신장부담, 임신 중 금기"], red: ["근무력·심한 두근·서맥(고칼륨), 임신 확인 시 즉시 중단 상의"] },
  "ACE억제제": { alias: ["라미프릴", "에날라프릴", "페린도프릴"], use: "고혈압·심부전·신장보호", dose: "1일 1회", side: ["마른기침(흔함)", "어지럼", "고칼륨"], caution: ["기침 심하면 ARB로 변경 상의, 임신 금기, 칼륨·NSAID 주의"], red: ["입술·혀·목 부종·호흡곤란(혈관부종) → 즉시 119"] },
  "베타차단제": { alias: ["비소프롤롤", "카베디롤", "프로프라놀롤", "네비볼롤"], use: "고혈압·협심증·부정맥·심부전·(진전·편두통 예방)", dose: "1일 1~2회, 임의 중단 금지(반동성 악화)", side: ["서맥·피로·손발 참", "천식 악화 가능"], caution: ["갑자기 끊으면 혈압·맥박 반동 상승, 당뇨 시 저혈당 증상(떨림) 가릴 수 있음"], red: ["심한 서맥·실신·호흡곤란 → 응급"] },
  "이뇨제": { alias: ["푸로세미드", "라식스", "하이드로클로로티아지드", "스피로노락톤"], use: "고혈압·부종·심부전", dose: "아침 복용(야간뇨 방지), 체중·소변량 관찰", side: ["전해질이상(저칼륨/저나트륨)", "탈수·통풍 유발", "스피로노락톤은 고칼륨"], caution: ["구토·설사·더위로 탈수 시 주의, 통풍·당뇨 영향, 다른 혈압약과 저혈압"], red: ["심한 무기력·근경련·부정맥(전해질이상)·심한 어지럼 → 진료"] },
  "니트로글리세린": { alias: ["니트로", "설하정", "나이트로글리세린"], use: "협심증 흉통 완화(혈관확장)", dose: "흉통 시 혀 밑에 1정, 5분 간격 최대 3회", side: ["두통·안면홍조·어지럼"], caution: ["발기부전치료제(실데나필 등)와 병용 절대 금기(심한 저혈압), 앉아서 복용"], red: ["3정·15분 후에도 흉통 지속 → 즉시 119(심근경색)"] },
  "PPI": { alias: ["오메프라졸", "판토프라졸", "에소메프라졸", "넥시움", "라베프라졸"], use: "위산억제(역류성식도염·궤양·위염)", dose: "식전 30분~1시간, 필요기간만", side: ["두통·설사"], caution: ["장기복용 시 골절·비타민B12/마그네슘 저하·감염 위험, 클로피도그렐과 상호작용(종류 선택)"], red: ["삼킴곤란·체중감소·토혈/흑색변(합병증) → 진료"] },
  "레보티록신": { alias: ["씬지로이드", "신지로이드", "갑상선호르몬"], use: "갑상선기능저하 호르몬 보충", dose: "아침 공복, 복용 후 30분~1시간 음식·다른 약 피하기", side: ["과량 시 두근·체중감소·불면(항진 증상)"], caution: ["철분·칼슘·제산제·커피와 4시간 간격, 임신 중 용량 증가 필요"], red: ["심한 가슴 두근·흉통·고열(과량·중독) → 진료"] },
  "메티마졸": { alias: ["안티로이드", "항갑상선제", "메르카졸"], use: "갑상선기능항진 치료", dose: "정해진 용량 규칙적 복용", side: ["발진·관절통", "드물게 무과립구증·간독성"], caution: ["임신 초기 주의(대체약 상의)"], red: ["고열·심한 인후통(무과립구증), 심한 황달(간독성) → 즉시 검사·응급"] },
  "레보도파": { alias: ["마도파", "시네메트", "퍼킨"], use: "파킨슨병(도파민 보충)", dose: "고단백 식사와 시간차(식전 30분~식후 1시간), 정시 복용", side: ["구역", "기립성저혈압", "장기복용 시 이상운동"], caution: ["갑자기 중단 금지(악성증후군), 철분제와 시간차"], red: ["약 중단 후 고열·근강직·의식저하(악성증후군) → 즉시 응급"] },
  "도네페질": { alias: ["아리셉트", "치매약", "콜린분해효소억제제"], use: "알츠하이머 치매 인지기능", dose: "대개 취침 전 1일 1회", side: ["구역·설사·식욕저하", "서맥·어지럼", "생생한 꿈"], caution: ["서맥·실신 병력·소화성궤양 주의"], red: ["실신·심한 서맥·검은변(위장출혈) → 진료"] },
  "SSRI": { alias: ["설트랄린", "에스시탈로프람", "플루옥세틴", "렉사프로", "프로작", "항우울제"], use: "우울·불안·공황·강박", dose: "1일 1회, 효과까지 2~4주, 임의 중단 시 금단증상", side: ["초기 구역·불면·성기능저하", "저나트륨(고령)"], caution: ["트립탄·트라마돌·MAOI와 세로토닌증후군, NSAID·항응고제와 출혈↑, 청소년 초기 자살사고 관찰"], red: ["고열·근경련·초조·의식변화(세로토닌증후군), 자살 생각 → 즉시 응급·1393"] },
  "벤조디아제핀": { alias: ["알프라졸람", "자낙스", "디아제팜", "로라제팜", "항불안제", "신경안정제"], use: "불안·불면·공황·경련(단기)", dose: "필요 최소기간·최소용량, 장기·고용량은 의존", side: ["졸림·어지럼·기억력저하", "낙상(고령)"], caution: ["술·수면제·마약성진통제와 병용 시 호흡억제, 갑자기 끊으면 금단(경련)"], red: ["과량+음주로 심한 졸림·호흡느림·의식저하 → 즉시 119"] },
  "리튬": { alias: ["탄산리튬", "기분안정제"], use: "양극성장애 기분안정", dose: "정해진 용량, 정기 혈중농도·신장·갑상선 검사 필수", side: ["떨림·갈증·다뇨", "체중증가·갑상선저하"], caution: ["탈수·이뇨제·NSAID·저염식이 혈중농도↑(중독), 수분 충분히"], red: ["심한 손떨림·구토·설사·비틀거림·의식저하(리튬중독) → 즉시 응급"] },
  "콜히친": { alias: ["콜킨", "통풍약"], use: "급성 통풍발작·예방", dose: "정해진 저용량 준수(과량 위험)", side: ["설사·복통·구역"], caution: ["마크로라이드 항생제·스타틴·자몽과 병용 시 독성↑, 신장·간 저하 시 감량"], red: ["심한 설사·구토·근육통·저림(중독) → 진료"] },
  "알로푸리놀": { alias: ["자이로릭", "요산강하제", "페북소스타트", "페브릭"], use: "요산 강하(통풍·고요산 예방)", dose: "급성발작 중엔 시작 신중, 시작 초기 발작예방 병용", side: ["발진", "드물게 중증 약물이상반응(SCAR)"], caution: ["복용 초기 통풍발작 가능(정상), 신장기능 따라 용량"], red: ["전신 발진·물집·점막 벗겨짐·발열(중증 약물반응) → 즉시 응급"] },
  "NSAID": { alias: ["이부프로펜", "나프록센", "덱시부프로펜", "낙센", "소염진통제", "진통소염제", "쎄레브렉스"], use: "통증·염증·발열", dose: "필요 최소기간, 반드시 식후", side: ["위장장애·궤양·출혈", "신장부담·부종·혈압↑"], caution: ["항응고·항혈소판제와 출혈↑, 심부전·신장병·고령 주의, 아스피린 천식 환자 금기"], red: ["토혈·흑색변·심한 복통, 소변량 급감·심한 부종 → 응급"] },
  "아세트아미노펜": { alias: ["타이레놀", "아세트아미노펜", "써스펜", "타세놀"], use: "해열·진통(위장부담 적음)", dose: "1일 최대량(대개 3~4g) 초과 금지, 복합감기약에 중복 함유 주의", side: ["대개 안전"], caution: ["과량·음주 시 간손상, 간질환자 주의, 여러 감기약 동시복용 시 중복 주의"], red: ["과량 복용 후 구역·상복부통·황달(간손상) → 즉시 응급(해독제 골든타임)"] },
  "스테로이드": { alias: ["프레드니솔론", "프레드니손", "소론도", "메드롤", "부신피질호르몬"], use: "염증·자가면역·알레르기 등 광범위", dose: "정해진 용량, 장기복용은 서서히 감량(임의 중단 금지)", side: ["혈당↑·체중·부종", "골다공증·감염·위장장애", "불면·기분변화"], caution: ["갑자기 끊으면 부신위기, 감염·수술 시 증량 필요, 위장약·칼슘/비타민D 병행"], red: ["장기 복용자가 감염·구토로 급성 무기력·저혈압·의식저하(부신위기) → 즉시 응급"] },
  "항히스타민제": { alias: ["세티리진", "지르텍", "로라타딘", "클라리틴", "펙소페나딘", "알레그라"], use: "알레르기(비염·두드러기·가려움)", dose: "1일 1회(2세대 권장), 필요시", side: ["1세대는 졸림·구갈·변비", "2세대는 졸림 적음"], caution: ["1세대는 운전·고령 주의(인지·요폐·녹내장), 술과 병용 시 졸림↑"], red: ["아나필락시스(입술 부종·호흡곤란)는 항히스타민만으론 부족 → 에피네프린·119"] },
  "프레가발린": { alias: ["리리카", "가바펜틴", "뉴론틴", "신경통약"], use: "신경병증통증·대상포진후신경통·간질보조", dose: "서서히 증량·감량(임의 중단 금지)", side: ["어지럼·졸림·부종·체중증가"], caution: ["술·진정제와 병용 시 졸림·호흡억제, 신장기능 따라 용량, 운전 주의"], red: ["심한 졸림·호흡느림·심한 부종 → 진료"] },
  "메토트렉세이트": { alias: ["엠티엑스", "MTX", "류마티스약"], use: "류마티스관절염·건선 등 면역조절", dose: "★주 1회 복용(매일 복용 금지 — 치명적 과량), 엽산 병용", side: ["구내염·구역·간효소↑", "골수억제·탈모"], caution: ["음주 금지, 감염·간·폐 독성 모니터, 임신 금기(중단 후 계획), NSAID·일부 항생제 주의"], red: ["고열·심한 구내염·출혈·기침/호흡곤란(골수억제·폐독성) → 즉시 응급", "매일 복용했다면(과량) → 즉시 응급"] },
  "카르바마제핀": { alias: ["테그레톨", "항경련제"], use: "간질·삼차신경통·기분안정", dose: "서서히 증량, 정기 혈액·간·나트륨 검사", side: ["어지럼·복시·저나트륨", "드물게 중증 피부반응·골수억제"], caution: ["HLA 유전형(아시아인 SJS 위험) 사전검사 권장, 피임약·많은 약 효과↓, 임신 주의"], red: ["전신 발진·물집·점막 벗겨짐·발열(SJS), 고열·인후통(골수억제) → 즉시 응급"] },
  "비스포스포네이트": { alias: ["알렌드로네이트", "포사맥스", "리세드로네이트", "골다공증약", "이반드로네이트"], use: "골다공증(골흡수 억제)", dose: "★아침 공복에 물 한 컵으로, 복용 후 30분간 눕지 말고 음식·다른 약 금지", side: ["식도자극·속쓰림", "드물게 턱뼈괴사·비전형골절"], caution: ["칼슘·제산제와 시간차, 치과 발치·임플란트 전 알리기, 신장저하 주의"], red: ["삼킬 때 심한 통증·가슴통증(식도염), 지속되는 허벅지·사타구니 통증(비전형골절) → 진료"] },
  "피나스테리드": { alias: ["프로페시아", "피나", "두타스테리드", "아보다트", "탈모약"], use: "남성형 탈모·전립선비대", dose: "1일 1회 꾸준히(중단 시 원상)", side: ["성욕·발기 감소(일부)", "유방압통"], caution: ["임신부는 부서진 알약 접촉도 금기(태아 기형), 헌혈 제한, PSA 수치에 영향"], red: ["유방 멍울·분비물·심한 기분변화 → 진료"] },
  "이소트레티노인": { alias: ["로아큐탄", "이소티논", "여드름약", "아큐탄"], use: "중증 여드름", dose: "정해진 용량, 지방식과 함께 흡수↑", side: ["입술·피부 건조", "간효소·지질↑", "야맹·기분변화"], caution: ["★강력한 기형유발 — 임신 절대 금기(복용 중·후 피임), 헌혈 금지, 음주·비타민A 보충 피하기, 정기 혈액검사"], red: ["임신 확인·심한 우울/자살생각·심한 복통(췌장염) → 즉시 진료·응급"] },
  "흡입기": { alias: ["흡입 스테로이드", "기관지확장제", "벤토린", "심비코트", "렐바", "스피리바", "천식흡입기"], use: "천식·COPD(조절제=매일 스테로이드, 완화제=속효성 확장제)", dose: "조절제는 증상 없어도 매일, 흡입 후 입 헹구기(칸디다 예방), 흡입법 정확히", side: ["구강칸디다·목쉼(스테로이드)", "두근·손떨림(확장제)"], caution: ["완화제 사용 빈도 늘면 조절 안 되는 것 → 진료, 완화제만 의존 금물"], red: ["완화제에도 반응 없는 심한 호흡곤란·말 못함·입술 청색 → 즉시 119"] },
  "알파차단제": { alias: ["탐스로신", "하루날", "전립선약", "실로도신"], use: "전립선비대 배뇨증상 완화", dose: "대개 취침 후/식후, 기립성저혈압 주의", side: ["어지럼·기립성저혈압", "사정장애", "코막힘"], caution: ["발기부전치료제와 병용 시 저혈압, 백내장 수술 전 안과에 복용 알리기(홍채이완)"], red: ["일어설 때 실신·심한 어지럼 → 진료"] },
  "PDE5억제제": { alias: ["실데나필", "비아그라", "타다라필", "시알리스", "발기부전치료제"], use: "발기부전(일부 폐고혈압)", dose: "성행위 전 복용(종류별 시간차)", side: ["두통·안면홍조·코막힘", "소화불량·시야 변화"], caution: ["★질산염(니트로글리세린)·일부 전립선약과 병용 절대 금기(치명적 저혈압), 심장질환자 상의"], red: ["4시간 이상 지속되는 통증성 발기(지속발기증) → 즉시 응급, 흉통·실신 → 119"] },
  "트립탄": { alias: ["수마트립탄", "이미그란", "졸미트립탄", "편두통약"], use: "편두통 급성기 치료", dose: "두통 초기에, 월 사용일 제한(약물과용두통 방지)", side: ["가슴·목 조임감·저림", "졸림"], caution: ["SSRI/SNRI와 세로토닌증후군, 심혈관질환·조절 안 된 고혈압엔 금기"], red: ["심한 흉통·호흡곤란(심장), 고열·근경련·초조(세로토닌증후군) → 응급"] },
  "항생제": { alias: ["아목시실린", "오구멘틴", "세파", "아지트로마이신", "레보플록사신", "항생제"], use: "세균감염 치료(바이러스 감기엔 효과 없음)", dose: "★처방기간을 끝까지 복용(임의 중단은 내성), 정해진 간격", side: ["설사·구역·질칸디다", "발진"], caution: ["일부는 우유·제산제와 흡수↓, 와파린·일부 약과 상호작용, 퀴놀론은 힘줄손상·QT주의", "설사 심하면 위막성대장염 감별"], red: ["두드러기·입술부종·호흡곤란(알레르기), 심한 물설사·발열(위막성대장염) → 응급"] },
};
const DRUG_ALIAS = (() => { const m = {}; Object.keys(DRUG_KB).forEach((k) => { m[k] = k; (DRUG_KB[k].alias || []).forEach((a) => { m[a] = k; }); }); return m; })();
function drugCounsel(text) {
  const t = (text || "").replace(/\s/g, "");
  const hit = Object.keys(DRUG_ALIAS).filter((a) => a.length >= 2 && t.includes(a.replace(/\s/g, ""))).sort((a, b) => b.length - a.length)[0];
  if (!hit) return null;
  const key = DRUG_ALIAS[hit]; const d = DRUG_KB[key]; if (!d) return null;
  const cards = [];
  cards.push({ kind: "card", card: { title: "💊 효능·용도 · 복용법", items: [`효능: ${d.use}`, `복용법: ${d.dose}`], buttons: [] } });
  if ((d.side || []).length) cards.push({ kind: "card", card: { title: "⚠️ 주요 부작용", items: d.side, buttons: [] } });
  if ((d.caution || []).length) cards.push({ kind: "card", card: { title: "🔗 복약·상호작용 주의", items: d.caution, buttons: [] } });
  if ((d.red || []).length) cards.push({ kind: "card", card: { title: "🚨 이럴 땐 즉시 병원·119", items: d.red, buttons: [] } });
  return { bubbles: [{ kind: "text", text: `‘${key}’ 약물 정보를 안내해 드릴게요.\n※ 초안(전문가 검토 전제) — 실제 복용·용량·중단은 반드시 의사·약사와 상의하세요. 진단·처방을 대체하지 않습니다.` }, ...cards], quicks: ["🏥 병원·진료 안내", "내 리포트 요약", "다른 약 검색"] };
}
function groupCounsel(text) {
  for (const g of DZ_GROUPS) {
    const m = g.members.find((x) => x.keys.some((k) => text.includes(k)));
    if (!m) continue;
    careRecSet(m.nutri, m.device, m.name);
    return {
      bubbles: [
        { kind: "text", text: `${m.name}에 대해 안내해 드릴게요.\n\n${m.def}\n\n주요 증상: ${m.sym}` },
        { kind: "card", card: { title: `🔎 비슷한 ${g.label.split(" ")[0]} 감별 (증상 차이)`, items: g.members.map((x) => `${x.name}: ${x.sym}`), buttons: [] } },
        { kind: "card", card: { title: "💊 도움되는 영양소 / ⚠️ 주의 영양소", items: m.nutri.map((n) => `✅ ${n}`).concat(m.avoid.map((a) => `⚠️ ${a}`)), buttons: [SHOP_SUPP_BTN] } },
        { kind: "card", card: { title: "🏠 홈케어 기기 · 🩺 생활습관", items: m.device.map((d) => `🏠 ${d}`).concat(m.life.map((l) => `· ${l}`)), buttons: [SHOP_DEVICE_BTN] } },
        { kind: "card", card: { title: "🔬 검진 안내", items: [m.screen], buttons: ["🏥 병원·진료 안내"] } },
        ...deepCards(m.name),
      ],
      quicks: g.members.filter((x) => x.name !== m.name).slice(0, 2).map((x) => x.name).concat(["내 리포트 요약"]),
    };
  }
  return null;
}
/* 데이터하우스(disease_care.json, 197개 질병) 기반 관리 안내 — 영양·기기·식단·생활습관 */
function dataHouseCounsel(text) {
  if (typeof _DZCARE === "undefined" || !_DZCARE) return null;
  const keys = Object.keys(_DZCARE);
  const k = keys.filter((x) => x.length >= 2 && text.includes(x)).sort((a, b) => b.length - a.length)[0];
  if (!k) return null;
  const e = _DZCARE[k]; if (!e) return null;
  const nm = (arr) => (arr || []).map((s) => s.name).filter(Boolean).slice(0, 4);
  const cards = [];
  const rec = nm(e.supplements_recommended), avo = nm(e.supplements_avoid);
  const dev = nm(e.devices);
  careRecSet(rec, dev, k);
  if (rec.length || avo.length) cards.push({ kind: "card", card: { title: "💊 도움되는 영양소 / ⚠️ 주의 영양소", items: rec.map((n) => `✅ ${n}`).concat(avo.map((n) => `⚠️ ${n}`)), buttons: rec.length ? [SHOP_SUPP_BTN] : [] } });
  if (dev.length) cards.push({ kind: "card", card: { title: "🏠 홈케어 기기", items: dev, buttons: [SHOP_DEVICE_BTN] } });
  const diet = e.diet && (e.diet.recommend || []).slice(0, 5); if (diet && diet.length) cards.push({ kind: "card", card: { title: "🥗 건강 식단", items: diet, buttons: [] } });
  const life = (e.lifestyle || []).map((l) => l.tip).filter(Boolean).slice(0, 4); if (life.length) cards.push({ kind: "card", card: { title: "🩺 생활습관", items: life, buttons: [] } });
  const deep = deepCards(k);
  if (!cards.length && !deep.length) return null;
  return { bubbles: [{ kind: "text", text: `${k} 관리 안내예요. 데이터하우스(전 세계 가이드라인 기반)에서 정리한 영양·기기·식단·생활습관입니다.` }, ...cards, ...deep], quicks: ["관련 진료과·병원 찾기", "추가 정밀검진", "내 리포트 요약"] };
}
function aiRespond(text, corpus, report, QA) {
  const has = (...ks) => ks.some((k) => text.includes(k));
  // 보험·보장 의도는 질병 정보로 답하지 말고 보험 AI 상담사로 연결(예: 'OO 대비 보험')
  if (text !== INS_HANDOFF && /(대비\s*보험|보험|보장|실손|진단비|보험금|보험료|청구)/.test(text)) return insHandoff();
  if (text.includes("다른 약 검색") || (text.includes("약") && has("어떤 약", "약 종류", "무슨 약", "약물 목록")))
    return { bubbles: [{ kind: "text", text: "약 이름을 입력하시면 효능·복용법·부작용·상호작용·응급신호를 안내해 드려요. 아래 예시를 눌러보셔도 돼요.\n※ 정보 제공용이며 진단·처방을 대체하지 않습니다." }], quicks: ["메트포르민 부작용", "와파린 주의사항", "아스피린", "스타틴", "타이레놀 복용법"] };
  if (report && report.meta && /리포트|건강분석|건강 분석|종합\s*분석|건강\s*총평|전체.*분석|분석.*리포트|리포트.*분석/.test(text)) {
    const _rc = reportAnalysisCards(report); if (_rc) return _rc;
  }
  // AI KB 라운지 RAG — 검진 수치 판정 + 근거 + 관련 보험·건강미션(예: '공복혈당 110', '혈압 140/90', 'BMI 27')
  if (typeof kbCheckupCounsel === "function") { const _kb = kbCheckupCounsel(text); if (_kb) return _kb; }
  // 회원 검진데이터 RAG — '내 건강상태 분석'(데이터하우스 세부 검진데이터로 정밀 다중카드 분석)
  if (typeof memberDeepAnalysis === "function") { const _cm1 = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; const _da = memberDeepAnalysis(text, _cm1); if (_da) return _da; }
  // 회원 검진데이터 RAG — 로그인 회원의 '내 검진 결과'(예: '내 콜레스테롤 결과', '내 검진 결과 요약', '내 공복혈당 어때?')
  if (typeof memberCheckupCounsel === "function") { const _cm0 = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; const _mc = memberCheckupCounsel(text, _cm0); if (_mc) return _mc; }
  // AI KB 라운지 RAG — 질환 정의·개요(예: '고혈압이 뭐야?', '당뇨병 위험요인') → KB 정의·위험요인·근거 (질환명은 항목기준보다 우선)
  if (typeof kbDiseaseCounsel === "function") { const _dz = kbDiseaseCounsel(text); if (_dz) return _dz; }
  // 검진 이해 KB — 종합검진 목적·체성분·생체나이·암예방·항목 기준(예: '체성분이 뭐예요?', '공복혈당 정상 범위')
  if (typeof checkupEduCounsel === "function") { const _ec = checkupEduCounsel(text); if (_ec) return _ec; }
  // 커머스 온톨로지 — 공급업체/제품/질환-제품 질의(예: 'GN바디닥터 찾아줘', '여성 웰니스 케어기기', '요실금 영양제')
  if (typeof commerceCounsel === "function") { const _cm = commerceCounsel(text); if (_cm) return _cm; }
  const _topics = multiTopicCounsel(text);
  if (_topics) return _topics;
  const _organs = multiOrganCounsel(text);
  if (_organs) return _organs;
  const _cancer = cancerCounsel(text);
  if (_cancer) return _cancer;
  const _grp = groupCounsel(text);
  if (_grp) return _grp;
  // 비질병 케어 토픽(산후관리·골반저근·갱년기·산부인과·관절재활) — 전용 생활관리 상담
  if (typeof careTopicCounsel === "function") { const _ct = careTopicCounsel(text); if (_ct) return _ct; }
  // 홈케어기기 직결 생활관리 명사(주름·피부·관절·여성건강) — 기존 질병답변이 없을 때만 건강정보+소프트 기기 안내
  if (typeof gnDeviceCounsel === "function") { const _gn = gnDeviceCounsel(text); if (_gn) return _gn; }
  const _counsel = counselAnswer(text);
  if (_counsel) return _counsel;
  const _drug = drugCounsel(text);
  if (_drug) return _drug;
  const _dh = dataHouseCounsel(text);
  if (!_dh) { const _deep = deepOnlyCounsel(text); if (_deep) return _deep; }
  if (!_dh) { const _route = superAgentRoute(text); if (_route) return _route; }
  // 음성 상담과 동일한 학습 엔진(consult) — 리포트·질병관리청 Q&A·진료지침·국가암검진/암정보, 동의어·구어 대응
  const ans = consult(text, corpus, report, QA);
  const generic = !ans || ans.startsWith("이렇게 도와드릴 수 있어요") || ans.includes("정보는 찾지 못했어요") || ans.startsWith("안녕하세요 조성래님! AI 주치의예요") || ans.startsWith("도움이 되었다니");
  if (ans && !generic) {
    const et = expandAlias((text || "").replace(/\s/g, ""));
    const qcp = qaMatch(et, QA, intentOf(et)) || qaFuzzy(text, QA);
    const isReport = /생체나이|노화등수|위험도는|리포트 요약이에요|리포트\(검진일|위험은 ‘|원으로 예상/.test(ans);
    const isOnto = /등급 기준은요|단계로 보여요/.test(ans);
    const quicks = qcp ? [`${qcp.dz} 생활습관 관리법은?`, `${qcp.dz}의 증상은 무엇인가요?`, "내 리포트 요약"]
      : (isReport || isOnto) ? reportFollowupQuestions() : ["내 리포트 요약", "의료비 예측", "혈당 수치 의미"];
    return { bubbles: [{ kind: "text", text: ans }], quicks };
  }
  if (_dh) return _dh;
  if (has("보험", "청구", "보험금", "보장"))
    return { bubbles: [{ kind: "text", text: "저는 건강검진 해석·생활관리·병원 안내를 중심으로 도와드려요. 보험 보장조회·청구는 ‘보험’ 메뉴에서 확인하시거나 전문 상담원 연결을 안내해 드릴게요." }], quicks: ["혈당 수치 의미", "내 건강 후속조치", "내 리포트 요약"] };
  if (has("퇴원", "재가", "수술", "간병", "돌봄", "방문간호", "재활"))
    return { bubbles: [{ kind: "text", text: "퇴원 후 관리가 궁금하시군요. 보통 방문간호·재활·식단관리·원격 모니터링을 함께 설계해요. 필요한 항목을 알려주시면 재가/돌봄서비스를 매칭해 드릴게요." }], quicks: ["재가/돌봄서비스 신청", "방문재활 알아보기", "퇴원 후 회복 관리"] };
  if (has("식단", "영양", "음식"))
    return { bubbles: [{ kind: "text", text: `${aiWho()}님 건강분석 기준으로, 채소·식물성 단백질·식이섬유 위주의 균형 식단과 절주가 도움이 돼요.` }, { kind: "card", card: { title: "맞춤 식단 가이드", items: ["식이섬유(잡곡·해조류·채소)", "채소·식물성 단백질 늘리기", "포화지방·가공육 줄이기", "절주(하루 2잔 이하)"], buttons: ["식단 구독하기", "영양제 함께 보기"] } }], quicks: ["식단 구독하기", "내 건강 후속조치", "당뇨 예방 운동"] };
  // (질환·리포트·암 등 학습 답변은 위 consult 엔진이 음성 상담과 동일하게 처리)
  // 대화형 — 인사·감사
  if (has("안녕", "반가", "하이", "ㅎㅇ", "헬로"))
    return { bubbles: [{ kind: "text", text: `안녕하세요 ${aiWho()}님! 😊 하이예요. 질환의 증상·검사·치료·생활습관부터 내 건강리포트·의료비까지 도와드릴게요. 무엇이 궁금하세요?` }], quicks: ["내 리포트 요약", "당뇨 검사 방법", "의료비 예측"] };
  if (has("고마워", "고맙", "감사", "수고", "땡큐"))
    return { bubbles: [{ kind: "text", text: "도움이 되었다니 기뻐요! 더 궁금한 점이 있으면 언제든 물어보세요. 😊" }], quicks: ["내 리포트 요약", "갑상선염의 증상은 무엇인가요?", "의료비 예측"] };
  // 이용 안내 — "안내해줘 / 어떻게 / 뭘 물어보면 돼?" 등
  if (has("안내", "어떻게", "무엇을", "뭘 물", "뭐 물", "뭐라고", "도와", "도움", "기능", "사용법", "메뉴", "할 수 있", "할수있", "예시", "물어보면", "물어볼"))
    return { bubbles: [
      { kind: "text", text: "이렇게 안내해 드릴 수 있어요. 아래 버튼을 누르거나, 질환 이름과 함께 ‘증상·검사·치료·생활습관’을 물어보시면 돼요." },
      { kind: "card", card: { title: "AI 주치의 이용 안내", items: ["내 건강리포트 요약·질병/암 위험도", "질환별 증상·검사·치료·생활습관(질병관리청 Q&A 1,947쌍)", "검진항목 해석·의료비·생체나이 예측", "병원·진료과 안내, 건강 후속조치"], buttons: ["내 리포트 요약", "갑상선염의 증상은 무엇인가요?", "의료비 예측"] } },
      { kind: "text", text: "예: ‘고혈압 생활습관 관리법은?’, ‘위암 검사는 어떻게 하나요?’, ‘내 당뇨 위험’처럼 물어보세요." },
    ], quicks: ["내 리포트 요약", "당뇨 검사 방법", "고혈압 생활습관 관리법은?", "혈당 수치 의미"] };
  return { bubbles: [{ kind: "text", text: `‘${text}’에 대한 정보를 찾지 못했어요. 😅 질환 이름과 함께 ‘증상·검사·치료·생활습관’을 물어보시거나, 아래 추천 질문을 눌러보세요. 리포트 분석·의료비·검진항목 해석도 도와드려요.` }], quicks: ["내 리포트 요약", "당뇨 검사 방법", "갑상선염의 증상은 무엇인가요?", "의료비 예측", "혈당 수치 의미"] };
}

function Chat({ superAgent, acceptsSeed }) {
  const [msgs, setMsgs] = useState(() => superAgent ? [
    { id: 1, who: "ai", kind: "text", text: `안녕하세요 ${aiWho()}님, 하이예요. 🤖\n위 버튼에서 원하는 서비스를 고르시거나, 무엇이든 말씀하거나(텍스트·음성) 물어보세요. 요약해 드리고 해당 서비스로 안내해 드릴게요.`, time: now(), first: true },
  ] : [
    { id: 1, who: "ai", kind: "text", text: `안녕하세요 ${aiWho()}님, 하이예요. 👨‍⚕️\n건강분석 리포트를 바탕으로 증상·질환·검사·치료를 함께 살펴드릴게요.`, time: now(), first: true },
    { id: 2, who: "ai", kind: "text", text: "무엇을 도와드릴까요? 아래에서 골라보셔도 돼요.", time: now() },
  ]);
  const [quicks, setQuicks] = useState(() => { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; return m ? memberQuestions(m).slice(0, 5) : ["혈당 수치 의미", "내 건강 후속조치", "건강분석 리포트 분석", "당뇨 예방 관리", "의료비 예측"]; });
  const [input, setInput] = useState(""); const [typing, setTyping] = useState(false); const [plus, setPlus] = useState(false);
  const [listening, setListening] = useState(false); const [interim, setInterim] = useState(""); const [tts, setTts] = useState(false);
  const [video, setVideo] = useState(false); const [devOpen, setDevOpen] = useState(false);
  const kb = useKdca();
  const report = useReport();
  const qa = useLearnedQA();
  const endRef = useRef(null); const recogRef = useRef(null); const fileRef = useRef(null); const voicesRef = useRef([]); const lastQRef = useRef("");
  const chatMember = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsOK = typeof window !== "undefined" && !!window.speechSynthesis;
  useEffect(() => { try { if (typeof loadDzCare === "function") loadDzCare(); } catch (e) {} }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, quicks]);
  useEffect(() => { if (!ttsOK) return; const load = () => { voicesRef.current = window.speechSynthesis.getVoices().filter((v) => /ko/i.test(v.lang)); }; load(); window.speechSynthesis.onvoiceschanged = load; return () => { try { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); } catch (e) {} }; }, []);
  useEffect(() => () => { if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } }, []);
  const speak = (t) => { if (!ttsOK || !tts || !t) return; try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[#*•]/g, "")); u.lang = "ko-KR"; u.rate = 1.03; const ko = voicesRef.current; const male = ko.find((v) => /injoon|hyunsu|male|남/i.test(v.name)); if (male) u.voice = male; else if (ko[0]) u.voice = ko[0]; window.speechSynthesis.speak(u); } catch (e) {} };
  const pushAI = (res) => { setMsgs((m) => [...m, ...res.bubbles.map((b, i) => ({ id: ++UID, who: "ai", kind: b.kind, text: b.text, card: b.card, time: now(), first: i === 0 }))]); setQuicks(res.quicks || []); const firstText = (res.bubbles.find((b) => b.kind !== "card") || {}).text; if (firstText) speak(firstText); };
  const send = (textArg) => {
    const text = (textArg ?? input).trim(); if (!text) return;
    if (text === "🔬 특수검진 정밀검사 보기") { setPlus(false); setQuicks([]); try { _checkupTab = "special"; } catch (e) {} if (typeof nav === "function") nav("checkup"); return; }
    if (text === "🚨 응급신호 자가체크" || text === "🚨 응급신호 보기") { setPlus(false); setQuicks([]); try { _checkupTab = "emergency"; } catch (e) {} if (typeof nav === "function") nav("checkup"); return; }
    if (text === "🗂 검진 결과·사후관리 바로가기") { setPlus(false); setQuicks([]); try { _checkupTab = "result"; } catch (e) {} if (typeof nav === "function") nav("checkup"); return; }
    if (text === DOCTOR_HANDOFF) { setPlus(false); setQuicks([]); try { _doctorSeed = lastQRef.current || null; _checkupTab = "doctor"; } catch (e) {} if (typeof nav === "function") nav("checkup"); return; }
    if (text === INS_HANDOFF) { setPlus(false); setQuicks([]); try { if (typeof window !== "undefined") window.__hifinInsAsk = { tab: "ai", q: lastQRef.current || "보장 공백 분석" }; } catch (e) {} if (typeof nav === "function") nav("insurance"); return; }
    if (text === SHOP_DEVICE_BTN) { setPlus(false); setQuicks([]); try { if (typeof window !== "undefined") { window._shopGo = Object.assign({ cat: "device", brand: "GN바디닥터" }, window._lastCareRec || {}); window._shopIntel = null; } } catch (e) {} if (typeof nav === "function") nav("shop"); return; }
    if (text === SHOP_SUPP_BTN) { setPlus(false); setQuicks([]); try { if (typeof window !== "undefined") window._shopIntel = Object.assign({ kind: "supp" }, window._lastCareRec || {}); } catch (e) {} if (typeof nav === "function") nav("shop"); return; }
    if (ACTION_NAV[text]) { setPlus(false); if (typeof nav === "function") nav(ACTION_NAV[text]); return; }
    { const _nk = (typeof agentNavKey === "function") ? agentNavKey(text) : null; if (_nk) { setPlus(false); setQuicks([]); if (typeof nav === "function") nav(_nk); return; } }
    setInput(""); setPlus(false); setQuicks([]);
    lastQRef.current = text;
    const meId = ++UID;
    setMsgs((m) => [...m, { id: meId, who: "me", kind: "text", text, time: now(), unread: true }]);
    setTimeout(() => { setMsgs((m) => m.map((x) => x.id === meId ? { ...x, unread: false } : x)); setTyping(true); }, 500);
    setTimeout(() => {
      const res = aiRespond(text, kb, report, qa); setTyping(false); pushAI(res);
      // Super Agent에서 실제 건강 상담 답변이면 '검진 화면에서 이어 상담' 버튼 제공(섹션 안내 라우팅은 제외)
      if (superAgent) {
        const isRoute = (res.bubbles || []).some((b) => b.card && /하이 안내/.test(b.card.title || ""));
        if (!isRoute) setQuicks((q) => (q || []).includes(DOCTOR_HANDOFF) ? q : [...(q || []), DOCTOR_HANDOFF]);
      }
    }, 1400);
  };
  useEffect(() => { if (!acceptsSeed) return; if (typeof _doctorSeed !== "undefined" && _doctorSeed) { const q = _doctorSeed; _doctorSeed = null; const tid = setTimeout(() => send(q), 500); return () => clearTimeout(tid); } }, []);
  const startStt = () => { if (!sttOK) return; if (ttsOK) window.speechSynthesis.cancel(); const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); recogRef.current = r; r.lang = "ko-KR"; r.interimResults = true; r.continuous = false; let fin = ""; r.onstart = () => { setListening(true); setInterim(""); }; r.onresult = (e) => { let itm = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const tr = e.results[i]; if (tr.isFinal) fin += tr[0].transcript; else itm += tr[0].transcript; } setInterim(itm); }; r.onerror = () => setListening(false); r.onend = () => { setListening(false); setInterim(""); if (fin.trim()) send(fin.trim()); }; try { r.start(); } catch (e) { setListening(false); } };
  const stopStt = () => { if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } setListening(false); };
  const aiAck = (label) => { setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `${label}을(를) 잘 받았어요. 내용을 참고해 건강관리 안내를 도와드릴게요. 더 궁금한 점이 있으면 말씀해 주세요.`, time: now(), first: true }]); }, 1200); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const isImg = /^image\//.test(f.type); const rd = new FileReader(); rd.onload = () => { setMsgs((m) => [...m, isImg ? { id: ++UID, who: "me", kind: "image", src: rd.result, time: now() } : { id: ++UID, who: "me", kind: "file", text: f.name, time: now() }]); aiAck(isImg ? "사진" : "파일"); }; rd.readAsDataURL(f); e.target.value = ""; setPlus(false); };
  const shareDevice = (summary) => { setDevOpen(false); if (!summary) return; const meId = ++UID; setMsgs((m) => [...m, { id: meId, who: "me", kind: "text", text: `🩺 기기 측정값 공유 — ${summary}`, time: now() }]); setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `연동된 측정값을 확인했어요(${summary}). 수치 추이를 바탕으로 생활관리·검진을 안내해 드릴게요. 이상 수치가 지속되면 진료를 권합니다. (참고용)`, time: now(), first: true }]); }, 1300); };
  return (
    <div className="kt">
      {video && <VideoCallModal title="AI 주치의 화상상담" sub="24시간 비대면 상담" onClose={() => setVideo(false)} />}
      <div className="kt-head"><ArrowLeft size={20} className="ic" /><span className="av-ai" style={{ width: 32, height: 32 }}><SecIcon k="ai" /></span>
        <div style={{ flex: 1 }}><div className="nm">{superAgent ? "하이" : "하이 · 건강 상담"}</div><div className="st"><span className="dot" /> {superAgent ? "고객 전담 · 모든 서비스 연결" : "온라인 · 24시간 상담"}</div></div>
        {ttsOK && <button className={`ktib ${tts ? "on" : ""}`} onClick={() => { setTts((v) => { if (v && ttsOK) window.speechSynthesis.cancel(); return !v; }); }} title="음성 읽기"><Volume2 size={17} /></button>}
        <button className="ktib" onClick={() => setDevOpen((v) => !v)} title="기기 연결"><HeartPulse size={17} /></button>
        <button className="ktib" onClick={() => setVideo(true)} title="화상상담"><MonitorSmartphone size={17} /></button></div>
      {chatMember && (
        <div className="kt-acts">
          <button onClick={() => nav("checkup")}>🔬 추가검진</button>
          <button onClick={() => nav("hospital")}>🏥 병원진료</button>
          <button onClick={() => nav("shop")}>💊 영양·홈케어</button>
          <button onClick={() => nav("shop")}>🥗 건강식단</button>
        </div>
      )}
      {devOpen && <DeviceSheet onClose={() => setDevOpen(false)} onShare={shareDevice} />}
      <div className="kt-body">
        <div className="daypill"><Bot size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> 질병관리청·임상 진료지침·국가암정보센터 학습 · 참고용</div>
        {msgs.map((m) => (
          <div className={`msg ${m.who}`} key={m.id}>
            {m.who === "ai" && <span className="av-ai">{m.first ? <SecIcon k="ai" /> : null}</span>}
            <div className="col">{m.who === "ai" && m.first && <div className="who">AI 주치의</div>}
              <div className="bubble-row">{m.kind === "card" ? <KCard card={m.card} onBtn={(b) => send(b)} /> : m.kind === "image" ? <img className="chatimg" src={m.src} alt="첨부 이미지" /> : m.kind === "file" ? <div className="chatfile"><Paperclip size={14} /> {m.text}</div> : <div className={`bubble ${m.who}`}>{m.who === "ai" ? <Sents text={m.text} /> : m.text}</div>}
                <div className="meta">{m.who === "me" && m.unread && <span className="unread">1</span>}<span>{m.time}</span></div></div></div></div>
        ))}
        {typing && <div className="msg ai"><span className="av-ai"><SecIcon k="ai" /></span><div className="typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      {(listening || interim) && <div className="kt-listening">{listening ? "🎙 듣는 중… 말씀하세요 " : ""}{interim && "“" + interim + "”"}</div>}
      {quicks.length > 0 && !typing && <div className="quicks">{quicks.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}
      <div className="kt-input">
        {plus && (<div className="plus-sheet">
          <button onClick={() => { setPlus(false); send("📄 프롬에이지 Premium 리포트를 공유했어요. 분석해줘"); }}><FileText size={20} color="#7C3AED" />리포트 공유</button>
          <button onClick={() => fileRef.current && fileRef.current.click()}><ImageIcon size={20} color="#2563EB" />사진</button>
          <button onClick={() => fileRef.current && fileRef.current.click()}><Paperclip size={20} color="#16A34A" />파일</button>
          <button onClick={() => { setPlus(false); setDevOpen(true); }}><HeartPulse size={20} color="#EF4444" />기기 연결</button>
          <button onClick={() => { setPlus(false); setVideo(true); }}><MonitorSmartphone size={20} color="#0EA5E9" />화상상담</button></div>)}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onFile} />
        <button className="pl" onClick={() => setPlus((p) => !p)}>{plus ? <X size={22} /> : <Plus size={22} />}</button>
        {sttOK && <button className="pl" onClick={() => listening ? stopStt() : startStt()} style={{ color: listening ? "#EF4444" : "var(--blue)" }} title="음성 입력">{listening ? <X size={22} /> : <Mic size={22} />}</button>}
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={sttOK ? "메시지 입력 또는 🎤 음성" : "메시지를 입력하세요"} />
        <button className={`send ${input.trim() ? "on" : "off"}`} onClick={() => send()}><Send size={16} /></button>
      </div>
      <div className="kt-disc">AI 상담은 의료진의 진단을 대체하지 않으며, 참고용 건강정보 안내입니다. 음성·화상·파일첨부·기기연동은 예시이며 응급 시 119.</div>
    </div>
  );
}
function KCard({ card, onBtn }) {
  return (<div className={`kcard ${card.compact ? "compact" : ""}`}><div className="kt-t">{card.title}</div>
    <div className="kt-i">{card.items.map((it, i) => <div className="li" key={i}><span className="d" />{it}</div>)}</div>
    <div className="kt-b">{card.buttons.map((b) => <button key={b} onClick={() => onBtn(b)}>{b}</button>)}</div></div>);
}

/* ====================== Report (실데이터) ====================== */
