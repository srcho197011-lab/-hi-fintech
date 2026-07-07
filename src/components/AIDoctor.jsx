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
    return `${N}님의 올해 예상 의료비는 약 ${won(R.cost.ty)}으로 동년배 평균 ${won(R.cost.tyAvg)}보다 조금 높아요. 10년 후엔 약 ${won(R.cost.y10)}으로 예상되고, 외래·입원 일수는 각각 ${R.cost.out}일, ${R.cost.inp}일 수준이에요.`;
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
  if (/안녕|반가|하이|헬로/.test(t)) return `안녕하세요 ${aiWho()}님! AI 주치의예요. 질환의 증상, 검사, 치료, 생활습관부터 내 건강리포트, 의료비까지 음성으로 도와드릴게요. 무엇이 궁금하세요?`;
  if (/고마워|고맙|감사|수고|땡큐/.test(t)) return "도움이 되었다니 기뻐요. 더 궁금한 점이 있으면 언제든 말씀해 주세요.";
  if (/안내|어떻게|무엇을|뭘물|뭐물|도와|도움|기능|사용법|할수있|예시|물어보면|물어볼/.test(t))
    return "이렇게 도와드릴 수 있어요. 질환 이름과 함께 증상, 검사, 치료, 생활습관을 물어보시거나, ‘내 리포트 요약’, ‘의료비 예측’처럼 말씀해 주세요. 예를 들어 ‘갑상선염 증상’, ‘고혈압 생활습관 관리’, ‘내 당뇨 위험’처럼요.";
  const n = QA && QA.meta ? QA.meta.count : 0;
  return `‘${q}’에 대한 정보는 찾지 못했어요. 질병관리청 Q&A ${n ? n.toLocaleString("ko-KR") + "쌍 " : ""}학습 기반으로, 질환 이름과 함께 증상, 검사, 치료, 생활습관을 물어보시면 돼요. 예를 들어 ‘당뇨 검사 방법’, ‘갑상선염 증상’처럼요.`;
}

function VoiceDoctor() {
  const [trans, setTrans] = useState([{ who: "a", text: `안녕하세요 ${aiWho()}님, AI 주치의예요. 질병관리청 국가건강정보포털, 대한의학회 임상 진료지침, 국립암센터 국가암검진 권고안과 국가암정보센터 자료를 학습해 음성으로 건강상담을 도와드릴게요. 마이크를 누르고 궁금한 점을 말씀해 주세요.` }]);
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
function AIDoctorSection({ onText, onVoice }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(null);
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [big, setBig] = useState(false);
  const [slow, setSlow] = useState(false);
  const [easy, setEasy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [kb, setKb] = useState(HEALTH_CONTENTS);
  const [showLog, setShowLog] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [favTick, setFavTick] = useState(0);
  const [browseCat, setBrowseCat] = useState(null);
  const [readingKey, setReadingKey] = useState(null);
  const [personal, setPersonal] = useState(null);
  const [ontoTxt, setOntoTxt] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [lang, setLang] = useState("ko");
  const T = UI_STR[lang];
  const riskLabel = (i) => lang === "en" ? RISK_EN[i] : RISK[i][0];
  const recogRef = useRef(null);
  const panelRef = useRef(null);
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsOK = typeof window !== "undefined" && !!window.speechSynthesis;
  const emergencyHit = detectEmergency(q) || (result && result.risk === 4);
  const FILTERS = [["증상", "증상으로 찾기"], ["질병", "질병명으로 찾기"], ["검사", "검사·치료로 찾기"], ["생활관리", "생활관리로 찾기"]];
  const ontoCats = (typeof ontoCategories === "function") ? ontoCategories() : [];

  const run = (query, f) => {
    const qq = query !== undefined ? query : q;
    const ff = f !== undefined ? f : filter;
    setQ(qq); if (f !== undefined) setFilter(f);
    // 체험 회원 로그인 시 — 개인 데이터 기반 분석 답변
    const member = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
    if (member && /사례|비슷한 회원|비슷한분|비슷한 사람|다른 회원|관리 사례|성공 사례/.test(qq)) {
      const ci = (typeof buildCaseInsight === "function") ? buildCaseInsight(member) : null;
      const onto = (typeof ontologyConsult === "function") ? ontologyConsult(qq) : null;
      if (ci || onto) { setCaseData(ci); setOntoTxt(ci ? null : onto); setPersonal(null); setResult(null); setMatches([]); setSubmitted(true); setEasy(false); logConsult(qq, null, 0); setLogTick((n) => n + 1); setTimeout(() => { try { panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {} }, 60); return; }
    }
    if (member && /내 건강|건강상태|분석해|조심|가장.*암|의료비|보험|건강지갑|보험료|줄일|필요한|내가|내 .*위험|후속조치|케어플랜|종합 케어|종합관리/.test(qq)) {
      setOntoTxt(null); setCaseData(null); setPersonal(demoPersonalAnswer(member)); setResult(null); setMatches([]); setSubmitted(true); setEasy(false);
      logConsult(qq, null, 0); setLogTick((n) => n + 1);
      setTimeout(() => { try { panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {} }, 60);
      return;
    }
    // 데이터하우스 온톨로지(영양·기기·식단·제도·검진·대상군) — 코퍼스 검색보다 우선
    { const ontoG = (typeof ontologyConsult === "function") ? ontologyConsult(qq) : null;
      if (ontoG && /영양|보충제|식단|식이|의료기기|혈압계|혈당계|홈케어|지원제도|의료지원|산정특례|장기요양|치매국가|본인부담상한|검진|수치|기준|노인|여성|아동|소아|대상군|건강관리/.test(qq)) {
        setOntoTxt(ontoG); setCaseData(null); setPersonal(null); setResult(null); setMatches([]); setSubmitted(true); setEasy(false); logConsult(qq, null, 0); setLogTick((n) => n + 1); setTimeout(() => { try { panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {} }, 60); return;
      }
    }
    setPersonal(null); setOntoTxt(null); setCaseData(null);
    const list = searchHealth(qq, ff, kb);
    setMatches(list); setResult(list[0] || null); setSubmitted(true); setEasy(false);
    const rIdx = (detectEmergency(qq) || (list[0] && list[0].risk === 4)) ? 4 : (list[0] ? list[0].risk : 0);
    logConsult(qq, list[0] || null, rIdx); setLogTick((n) => n + 1);
    setTimeout(() => { try { panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {} }, 60);
  };
  const answerText = (c, simple) => {
    if (!c) return "";
    if (simple) return `${c.title}. 쉽게 말씀드리면, ${c.summary} 증상이 심하거나 ${c.whenDoctor[0]} 경우에는 병원에 가세요. ${c.emergency[0]} 같은 응급 증상이 있으면 즉시 119에 연락하세요. 이 정보의 출처는 ${HC_SRC}입니다.`;
    const L = (t, a) => a && a.length ? `${t}. ${a.join(", ")}. ` : "";
    return `${c.title} 상담입니다. 핵심 요약. ${c.summary} ` + L("가능한 원인", c.causes) + L("확인할 증상", c.symptoms) + L("필요한 검사", c.tests) + L("생활관리", c.lifestyle) + `병원 방문 기준. ${c.whenDoctor.join(", ")}. 응급 위험 신호. ${c.emergency.join(", ")}. 출처는 ${HC_SRC}입니다.`;
  };
  const buildPrintHtml = (c) => {
    const sec = (t, a) => a && a.length ? `<h3>${t}</h3><ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
    const rl = RISK[c.risk] ? RISK[c.risk][0] : "";
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${c.title} 상담 결과</title><style>body{font-family:system-ui,'Malgun Gothic',sans-serif;color:#1B2A52;padding:30px;line-height:1.6;}h1{font-size:21px;margin:0 0 4px;}h3{font-size:13px;margin:12px 0 3px;}ul{margin:0 0 6px 18px;padding:0;}li{font-size:13px;}.risk{display:inline-block;padding:3px 11px;border-radius:999px;font-size:12px;font-weight:700;background:#EEF3FF;color:#2563EB;}.sum{background:#F5F7FB;border-radius:8px;padding:12px;margin:8px 0;}.src{margin-top:20px;font-size:11px;color:#667;background:#f5f7fb;padding:12px;border-radius:8px;word-break:break-all;}.disc{margin-top:10px;font-size:11px;color:#a05a00;}.brand{font-size:12px;color:#7886a8;}</style></head><body><div class="brand">HI-Fin Tech · 국가건강정보 기반 AI 주치의</div><h1>${c.title} <span class="risk">${rl}</span></h1><div class="sum"><b>핵심 요약</b><br>${c.summary}</div>${sec("가능한 원인", c.causes)}${sec("확인해야 할 증상", c.symptoms)}${sec("필요한 검사·진료", c.tests)}${sec("생활관리 방법", c.lifestyle)}${sec("병원 방문이 필요한 경우", c.whenDoctor)}${sec("응급실 방문이 필요한 위험 신호", c.emergency)}<div class="src">${citeText(c)}<br>라이선스: ${HC_LIC}</div><div class="disc">본 자료는 건강정보 제공·상담 보조용이며 의사의 진단·처방·치료를 대체하지 않습니다. 증상이 지속·악화되면 의료기관을 방문하세요. 응급 시 119.</div></body></html>`;
  };
  const printConsult = (c) => { if (!c) { toast("인쇄할 상담 결과가 없습니다."); return; } const w = window.open("", "_blank", "width=760,height=900"); if (!w) { toast("팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요."); return; } w.document.write(buildPrintHtml(c)); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350); };
  const shareGuardian = async (c) => {
    if (!c) { toast("공유할 상담 결과가 없습니다."); return; }
    const text = `[HI-Fin Tech AI 주치의 상담]\n${answerText(c)}\n${citeText(c)}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${c.title} 상담 결과`, text }); return; }
      catch (e) { if (e && e.name === "AbortError") return; } // 사용자가 취소하면 종료, 그 외 오류는 클립보드로 폴백
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); toast("상담 내용을 클립보드에 복사했습니다. 보호자에게 붙여넣어 전달하세요."); return; }
    } catch (e) {}
    toast("이 브라우저는 공유를 지원하지 않습니다. 상담 내용을 길게 눌러 복사해 주세요.");
  };
  const isFav = (id) => FAVORITES.some((f) => f.id === id);
  const toggleFav = (c) => { const i = FAVORITES.findIndex((f) => f.id === c.id); if (i >= 0) { FAVORITES.splice(i, 1); toast("즐겨찾기에서 제거했습니다."); } else { FAVORITES.push({ id: c.id, title: c.title }); toast("즐겨찾기에 추가했습니다."); } saveFav(); setFavTick((v) => v + 1); };
  const speak = (text) => { if (!ttsOK) { toast("이 브라우저는 음성 답변(TTS)을 지원하지 않습니다."); return; } window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ko-KR"; u.rate = slow ? 0.8 : 1.0; u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); window.speechSynthesis.speak(u); };
  // 섹션별 순차 읽기 + 하이라이트
  const readAloud = (c) => {
    if (!c) return;
    if (!ttsOK) { toast("이 브라우저는 음성 답변(TTS)을 지원하지 않습니다."); return; }
    window.speechSynthesis.cancel();
    const parts = [
      ["summary", `위험도 분류는 ${riskLabel(dispRisk)}. 핵심 요약. ${c.summary}`],
      ["causes", c.causes.length ? `가능한 원인. ${c.causes.join(", ")}` : ""],
      ["symptoms", c.symptoms.length ? `확인해야 할 증상. ${c.symptoms.join(", ")}` : ""],
      ["tests", c.tests.length ? `필요한 검사·진료. ${c.tests.join(", ")}` : ""],
      ["lifestyle", c.lifestyle.length ? `생활관리 방법. ${c.lifestyle.join(", ")}` : ""],
      ["whenDoctor", c.whenDoctor.length ? `병원 방문 기준. ${c.whenDoctor.join(", ")}` : ""],
      ["emergency", c.emergency.length ? `응급 위험 신호. ${c.emergency.join(", ")}` : ""],
    ].filter((p) => p[1]);
    setSpeaking(true);
    let i = 0;
    const next = () => {
      if (i >= parts.length) { setSpeaking(false); setReadingKey(null); return; }
      const [key, text] = parts[i];
      setReadingKey(key);
      const u = new SpeechSynthesisUtterance(text); u.lang = "ko-KR"; u.rate = slow ? 0.8 : 1.0;
      u.onend = () => { i += 1; next(); };
      u.onerror = () => { setSpeaking(false); setReadingKey(null); };
      window.speechSynthesis.speak(u);
    };
    next();
  };
  const stopSpeak = () => { if (ttsOK) window.speechSynthesis.cancel(); setSpeaking(false); setReadingKey(null); };
  const startStt = () => {
    if (!sttOK) { toast("현재 브라우저에서는 음성 입력(STT)을 지원하지 않습니다."); return; }
    stopSpeak(); const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); recogRef.current = r;
    r.lang = "ko-KR"; r.interimResults = false; r.continuous = false; let fin = "";
    r.onstart = () => setListening(true); r.onresult = (e) => { for (let i = 0; i < e.results.length; i++) if (e.results[i].isFinal) fin += e.results[i][0].transcript; };
    r.onerror = () => setListening(false); r.onend = () => { setListening(false); if (fin.trim()) run(fin.trim()); };
    try { r.start(); } catch (e) { setListening(false); }
  };
  useEffect(() => () => { stopSpeak(); if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } }, []);
  useEffect(() => { let on = true; fetchHealthContents().then((d) => { if (on && d && d.length) setKb(d); }); return () => { on = false; }; }, []);

  const Sec = ({ ic: Ic, t, items, c, k }) => (!items || !items.length) ? null : (
    <div className={`adsec ${readingKey === k ? "reading" : ""}`}><div className="adsl"><Ic size={14} color={c || "#2563EB"} /> {t}</div><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
  );
  const Chips = ({ t, items }) => (!items || !items.length) ? null : (
    <div className="adchipline"><span className="adcl">{t}</span>{items.map((x, i) => <span className="adchip" key={i} onClick={() => run(x)}>{x}</span>)}</div>
  );
  const dispRisk = emergencyHit ? 4 : (result ? result.risk : 0);
  // 관련 질환 비교 — KB에 존재하는 연관 질환만 매칭
  const kbFind = (name) => { const n = (name || "").replace(/\(.*?\)/g, "").trim(); return kb.find((c) => c.title === name) || kb.find((c) => c.title.indexOf(n) >= 0 || (n && n.indexOf(c.title.replace(/\(.*?\)/g, "").trim()) >= 0)); };
  const compareRows = result ? [result].concat((result.relatedDiseases || []).map(kbFind).filter((c) => c && c.id !== result.id)).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).slice(0, 4) : [];
  // 건강지갑 보험료 시뮬레이션 — 감지 보장 → 추정 보험료 vs 건강자산 충당
  const krw = (n) => n.toLocaleString("ko-KR") + "원";
  const wMonthEarn = (typeof WALLET !== "undefined" && WALLET.monthEarn) || 1840;
  const wTotal = (typeof WALLET !== "undefined" && WALLET.total) || 12480;
  const grossPremium = result ? result.ins.filter((t) => (PREMIUM_EST[t] || 0) > 0).reduce((s, t) => s + PREMIUM_EST[t], 0) : 0;
  const lifeDiscount = result && result.ins.indexOf("생활관리절감") >= 0 ? 8000 : 0;
  const walletSupport = result ? Math.min(wMonthEarn, Math.max(0, grossPremium - lifeDiscount)) : 0;
  const netPremium = Math.max(0, grossPremium - lifeDiscount - walletSupport);
  const coverRate = grossPremium ? Math.round((lifeDiscount + walletSupport) / grossPremium * 100) : 0;

  return (
    <div className={`aidoc ${big ? "big" : ""}`}>
      {/* Hero */}
      <div className="aidhero">
        <div className="aidh-l">
          <div className="aidh-tag"><BookOpen size={13} /> {T.tag}</div>
          <h3>{T.title}</h3>
          <p>{T.desc}</p>
          <div className="aidh-btns">
            <button className="pri" onClick={() => onText && onText()}><MessageSquare size={15} /> {T.bText}</button>
            <button onClick={() => onVoice && onVoice()}><Mic size={15} /> {T.bVoice}</button>
            <button onClick={() => nav("insurance")}><ShieldCheck size={15} /> {T.bIns}</button>
          </div>
        </div>
        <div className="aidh-tools">
          <button className="aidlang" onClick={() => setLang((v) => v === "ko" ? "en" : "ko")} title="Language">{lang === "ko" ? "EN" : "한국어"}</button>
          <button className={`aidbig ${big ? "on" : ""}`} onClick={() => setBig((v) => !v)} title="고령자 친화 큰 글자 모드">가<span>+</span> {big ? T.bigOn : T.bigOff}</button>
        </div>
      </div>

      {/* 응급 경고 배너 */}
      {emergencyHit && (
        <div className="aidemg">
          <div className="el"><AlertTriangle size={20} /><div><b>{T.emgT}</b><span>{T.emgS}</span></div></div>
          <a className="ebtn" href="tel:119"><Phone size={15} /> {T.emgBtn}</a>
        </div>
      )}

      {lang === "en" && <div className="aidnote2"><Info size={13} /> {T.note}</div>}

      {/* 검색·상담 */}
      <div className="aidsearch">
        <div className="aiders">
          <Search size={18} className="ic" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder={T.ph} />
          <button className={`mic ${listening ? "on" : ""}`} onClick={() => listening ? (recogRef.current && recogRef.current.stop()) : startStt()} title={sttOK ? "음성으로 질문하기" : "이 브라우저는 음성입력 미지원"}>{listening ? <X size={18} /> : <Mic size={18} />}</button>
          <button className="go" onClick={() => run()}>{T.go}</button>
        </div>
        <div className="aidfilters">{FILTERS.map(([k, label], i) => <button key={k} className={filter === k ? "on" : ""} onClick={() => run(q, filter === k ? null : k)}>{T.filters[i]}</button>)}</div>
        {listening && <div className="aidlisten"><Mic size={13} /> {T.listen}</div>}
      </div>

      {!submitted && (<>
        {(typeof demoCurrentUser === "function" && demoCurrentUser()) && (<>
          <div className="aidrech">⭐ {demoCurrentUser().name}님 맞춤 질문 <span className="clickhint"><Info size={11} /> 건강상태 기반 자동 생성</span></div>
          <div className="aidfav">{memberQuestions(demoCurrentUser()).slice(0, 14).map((qq) => <button key={qq} onClick={() => run(qq)}>{qq}</button>)}</div>
        </>)}
        {FAVORITES.length > 0 && (
          <div className="aidfnews">
            <div className="fnh"><Bell size={14} /> {T.fav}</div>
            {FAVORITES.slice(0, 5).map((f, i) => <button className="fnr" key={f.id} onClick={() => run(f.title)}><span className="fnt">★ {f.title}</span><span className="fnm">{(lang === "en" ? FAV_NEWS_EN : FAV_NEWS_KO)[i % 4]}</span><ChevronRight size={15} /></button>)}
          </div>
        )}
        <div className="aidrech">{T.recQ}</div>
        <div className="aidrecq">{REC_Q.map(([disp, query]) => <button key={disp} onClick={() => run(query)}><HelpDot /> {disp}</button>)}</div>
        <div className="aidrech">{T.cats}</div>
        <div className="aidcats">{HC_CATS.map(([t, Ic, query]) => <button key={t} onClick={() => run(query)}><span className="ci"><Ic size={17} /></span>{t}</button>)}</div>
        <div className="aidrech">건강 지식 데이터하우스 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>· AI 주치의 온톨로지(영양·기기·식단·제도·검진·사례·대상군)</span></div>
        <div className="aidcatlist">{ontoCats.map((c) => <button key={c.key} className={browseCat === c.key ? "on" : ""} onClick={() => setBrowseCat(browseCat === c.key ? null : c.key)}>{c.name} <span>{c.count}</span></button>)}</div>
        {browseCat && (() => { const grp = ontoCats.find((g) => g.key === browseCat); if (!grp) return null; return (
          <div className="aidbrowse">
            <div className="bbh">{grp.name} <b>{grp.items.length}{lang === "en" ? "" : "건"}</b><span className="bbx" onClick={() => setBrowseCat(null)}>{T.close}</span></div>
            {grp.items.map((it, i) => <button className="brow" key={i} onClick={() => run(it.q)}><span className="bl"><span className="bt">{it.t}</span><span className="bs">{it.s}</span></span><span className="brisk" style={{ color: "#2563EB", background: "#EAF0FE" }}>AI 상담 ›</span></button>)}
          </div>
        ); })()}
      </>)}

      {/* 상담 결과 */}
      {submitted && (
        <div className="aidresult" ref={panelRef}>
          {caseData ? (
            <CaseCard data={caseData} onPlan={() => run("내 종합 케어플랜")} />
          ) : ontoTxt ? (
            <div className="adcard">
              <div className="adt2"><Sparkles size={16} color="#7C3AED" /> 사례기반 심층 상담 <span className="cplvl" style={{ color: "#7C3AED", background: "#F3EDFE", borderColor: "#DDD0F7" }}>의료법 준수 참고안내</span></div>
              <div className="aianswer" style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, fontSize: 13.5, color: "#2a3550", marginTop: 6 }}>{ontoTxt}</div>
              <div className="adcta">
                <button className="cbtn pri" style={{ margin: 0 }} onClick={() => run("내 종합 케어플랜")}><HeartHandshake size={14} /> 내 케어플랜 보기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("checkup")}><CalendarCheck size={14} /> 검진 예약</button>
              </div>
              <div className="aiddisc" style={{ marginTop: 10 }}><AlertTriangle size={14} /> 일반적 건강관리 경향에 대한 참고 안내이며, 효과를 보장하지 않습니다. 구체적 치료·약물은 의료진과 상담하세요.</div>
            </div>
          ) : personal ? (<>
            <div className="adcard adpersonal">
              <div className="adtop"><div><div className="adt">{personal.title}</div><div className="adcat">시연용 예시 데이터 기반 분석</div></div>
                <span className="adrisk" style={{ color: personal.grade[1], background: personal.grade[2] }}>암위험 {personal.grade[0]}</span></div>
              {personal.sections.map(([label, items], i) => (
                <div className="adsec" key={i}><div className="adsl"><Check size={14} color="#2563EB" /> {i + 1}. {label}</div><ul>{(items || []).map((x, j) => <li key={j}>{x}</li>)}</ul></div>
              ))}
              <div className="adcta">
                <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><Sparkles size={14} /> 맞춤 보험 추천받기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={14} /> 건강지갑 보기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("demo")}><CircleUserRound size={14} /> 내 대시보드</button>
              </div>
              <div className="aiddisc" style={{ marginTop: 12 }}><AlertTriangle size={14} /> 본 내용은 시연용 예시 데이터 기반 분석이며, 실제 의학적 진단이나 보험 가입 심사를 대체하지 않습니다.</div>
            </div>
            <CarePlanCard member={demoCurrentUser()} />
            </>) : result ? (<>
            <div className="adcard">
              <div className="adtop">
                <div><div className="adt">{result.title}</div><div className="adcat">{result.category}{result.subCategory ? " · " + result.subCategory : ""}</div></div>
                <span className="adrisk" style={{ color: RISK[dispRisk][1], background: RISK[dispRisk][2] }}>{riskLabel(dispRisk)}</span>
              </div>
              <div className={`adsum ${readingKey === "summary" ? "reading" : ""}`}><b>{T.summary}</b><p>{result.summary}</p></div>
              {easy && <div className="adeasy"><Info size={14} /> 쉬운 설명: {answerText(result, true)}</div>}
              <Sec ic={Info} t={T.causes} items={result.causes} c="#F59E0B" k="causes" />
              <Sec ic={Activity} t={T.symptoms} items={result.symptoms} c="#EF4444" k="symptoms" />
              <Sec ic={Stethoscope} t={T.tests} items={result.tests} c="#2563EB" k="tests" />
              <Sec ic={Salad} t={T.lifestyle} items={result.lifestyle} c="#16A34A" k="lifestyle" />
              <Sec ic={Building2} t={T.whenDoctor} items={result.whenDoctor} c="#7C3AED" k="whenDoctor" />
              <Sec ic={AlertTriangle} t={T.emergency} items={result.emergency} c="#EF4444" k="emergency" />
              <Chips t={T.relDz} items={result.relatedDiseases} />
              <Chips t={T.relTest} items={result.relatedTests} />
              <div className="adchipline"><span className="adcl">{T.relDept}</span>{result.relatedDepartments.map((d, i) => <span className="addept" key={i}>{d}</span>)}</div>
              <div className="adacts">
                <button className={readingKey ? "on" : ""} onClick={() => readAloud(result)}><Volume2 size={14} /> 답변 듣기{readingKey ? " · 읽는 중" : ""}</button>
                <button onClick={() => speak(`위험도 분류는 ${RISK[dispRisk][0]} 입니다. ` + answerText(result, true))}><Volume2 size={14} /> 쉬운 설명으로 듣기</button>
                <button className={slow ? "on" : ""} onClick={() => setSlow((v) => !v)}>{slow ? "느리게 ✓" : "느리게 읽기"}</button>
                <button className={easy ? "on" : ""} onClick={() => setEasy((v) => !v)}>쉬운 설명 {easy ? "끄기" : "보기"}</button>
                <button onClick={() => shareGuardian(result)}><Users size={14} /> 보호자 공유</button>
                <button onClick={() => printConsult(result)}><FileText size={14} /> PDF·인쇄</button>
                <button className={isFav(result.id) ? "on" : ""} onClick={() => toggleFav(result)}>{isFav(result.id) ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기"}</button>
                {speaking && <button onClick={stopSpeak}><X size={14} /> 멈춤</button>}
              </div>
            </div>

            {/* 관련 질환 비교표 */}
            {compareRows.length > 1 && (
              <div className="adcard adcompare">
                <div className="adt2"><Activity size={16} color="#2F5BEA" /> {lang === "en" ? "Compare related conditions" : "관련 질환 비교"}</div>
                <div className="acwrap"><table className="actbl">
                  <thead><tr><th>{lang === "en" ? "Condition" : "질환"}</th><th>{lang === "en" ? "Risk" : "위험도"}</th><th>{lang === "en" ? "Key test" : "주요 검사"}</th><th>{lang === "en" ? "Dept." : "진료과"}</th></tr></thead>
                  <tbody>{compareRows.map((c) => (
                    <tr key={c.id} className={c.id === result.id ? "cur" : ""} onClick={() => run(c.title)}>
                      <td className="cn">{c.title}{c.id === result.id && <span className="curtag">{lang === "en" ? "now" : "현재"}</span>}</td>
                      <td><span className="acrisk" style={{ color: RISK[c.risk][1], background: RISK[c.risk][2] }}>{riskLabel(c.risk)}</span></td>
                      <td>{c.tests[0] || "-"}</td>
                      <td>{c.relatedDepartments[0] || "-"}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
                <div className="adinsnote">{lang === "en" ? "Tap a row to open that condition." : "※ 행을 누르면 해당 질환 상담으로 이동합니다."}</div>
              </div>
            )}

            {/* 멀티턴 follow-up — 증상 추가 → 재분류 */}
            {result.emergency.length > 0 && (
              <div className="adcard adfollow">
                <div className="adt2"><MessageSquare size={16} color="#EA580C" /> {lang === "en" ? "Add a symptom to re-check risk" : "증상을 더 알려주시면 위험도를 다시 분류해요"}</div>
                <div className="adfchips">{result.emergency.slice(0, 4).map((s, i) => <button key={i} onClick={() => run(`${result.title} ${s}`)}><Plus size={13} /> {s.replace(/\s*→.*$/, "")}</button>)}</div>
                <div className="adinsnote">{lang === "en" ? "If a chosen sign is an emergency, it switches to a 119 alert." : "선택한 증상이 응급 신호면 즉시 119 안내로 전환됩니다."}</div>
              </div>
            )}

            {/* 보험 보장 검토 */}
            <div className="adcard adins">
              <div className="adt2"><ShieldCheck size={16} color="#2F5BEA" /> {T.insTitle}</div>
              <div className="adinsg">{result.ins.map((tag) => { const m = INS_META[tag]; if (!m) return null; const Ic = m[0]; return (
                <div className="adinsc" key={tag}><div className="ah" style={{ color: m[1] }}><span style={{ background: m[2] }}><Ic size={16} /></span>{m[3]}</div><ul>{m[4].map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              ); })}</div>
              <div className="adinsnote">※ 보장 가능 여부·보험금 지급은 보험사 인수·심사 결과에 따르며, 본 안내로 단정하지 않습니다.</div>
              <div className="adcta">
                <button className="cbtn pri" style={{ margin: 0 }} onClick={() => nav("insurance")}><Search size={14} /> 내 건강위험 기반 보험 보장 분석하기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><Sparkles size={14} /> 내몸맞춤 프리미엄보험 추천받기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={14} /> 건강지갑으로 보험료 부담 줄이기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => openConsult("건강·보험 종합 상담")}><MessageSquare size={14} /> 상담사와 연결하기</button>
              </div>
            </div>

            {/* 건강지갑 보험료 시뮬레이션 */}
            {grossPremium > 0 && (
              <div className="adcard adsim">
                <div className="adt2"><Wallet size={16} color="#16A34A" /> {lang === "en" ? "Health Wallet premium simulation" : "건강지갑 보험료 시뮬레이션"}</div>
                <div className="simrow"><span>{lang === "en" ? "Est. monthly premium" : "예상 월 보험료"}</span><b>{krw(grossPremium)}</b></div>
                {lifeDiscount > 0 && <div className="simrow disc"><span>{lang === "en" ? "Lifestyle-care discount" : "생활관리 절감"}</span><b>−{krw(lifeDiscount)}</b></div>}
                <div className="simrow disc"><span>{lang === "en" ? "Wallet earned this month" : "건강지갑 이번 달 적립 지원"}</span><b>−{krw(walletSupport)}</b></div>
                <div className="simrow net"><span>{lang === "en" ? "Your net premium" : "실 부담 보험료"}</span><b>{krw(netPremium)}</b></div>
                <div className="simbar"><span style={{ width: coverRate + "%" }} /></div>
                <div className="simnote">{lang === "en" ? `Health assets cover about ${coverRate}% of your premium. You hold ${wTotal.toLocaleString("ko-KR")} HTK.` : `건강지갑·생활관리로 보험료의 약 ${coverRate}%를 충당합니다. 누적 건강자산 ${wTotal.toLocaleString("ko-KR")} HTK 보유.`}</div>
                <div className="adcta">
                  <button className="cbtn pri" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={14} /> {lang === "en" ? "Open Health Wallet" : "건강지갑에서 적립 늘리기"}</button>
                  <button className="cbtn" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><Sparkles size={14} /> {lang === "en" ? "Get a tailored quote" : "맞춤 보험료 상담받기"}</button>
                </div>
                <div className="adinsnote">{lang === "en" ? "Demo estimate; actual premium/earning depends on insurer underwriting & terms." : "※ 예시 추정치입니다. 실제 보험료·적립·지원액은 보험사 인수·심사 및 약관에 따릅니다."}</div>
              </div>
            )}

            {/* 출처 */}
            <div className="adsource"><div className="ah"><BookOpen size={14} /> {T.source}</div><p>{citeText(result)}</p><p className="lic">라이선스: {HC_LIC}</p></div>

            <div className="adlinks">
              <div className="alh"><ChevronRight size={14} /> 상담 결과 바로 연결</div>
              <div className="alb">
                <button onClick={() => linkToSection("checkup", result.title)}><CalendarCheck size={14} /> 관련 검진 예약</button>
                <button onClick={() => linkToSection("hospital", result.title, result.relatedDepartments[0])}><Building2 size={14} /> {result.relatedDepartments[0] || "관련"} 병원 찾기</button>
                <button onClick={() => nav("manage")}><Activity size={14} /> 내 건강 리포트</button>
              </div>
            </div>

            {matches.length > 1 && (<>
              <div className="aidrech" style={{ marginTop: 16 }}>{T.related}</div>
              <div className="aidrel">{matches.slice(1, 5).map((c) => <button key={c.id} onClick={() => run(c.title)}><b>{c.title}</b><span>{c.summary}</span></button>)}</div>
            </>)}
          </>) : (
            <div className="aidnone"><Search size={26} color="#B8C2D6" /><div><b>{T.none}</b><p>{T.noneSub}</p></div></div>
          )}
          <div className="aidreset"><button onClick={() => { setSubmitted(false); setResult(null); setPersonal(null); setOntoTxt(null); setCaseData(null); setQ(""); setFilter(null); }}><ArrowLeft size={14} /> {T.reset}</button></div>
        </div>
      )}

      {/* 상담 기록(세션 로그) */}
      <div className="aidlog">
        <button className="aidlogtog" onClick={() => setShowLog((v) => !v)}><FileText size={14} /> 내 상담 기록 {AI_SESSIONS.length}건 {showLog ? "접기 ▲" : "보기 ▼"}</button>
        {showLog && (
          <div className="aidlogbody">
            {AI_SESSIONS.length === 0 ? <div className="aidlogempty">아직 상담 기록이 없습니다. 위에서 검색해 보세요.</div> :
              AI_SESSIONS.slice(-5).reverse().map((s) => { const ri = RISK.findIndex((r) => r[0] === s.risk_level); const ins = INS_REC_LOGS.find((x) => x.session_id === s.id); return (
                <div className="aidlogrow" key={s.id}>
                  <div className="ll"><span className="lq">“{s.question}”</span><span className="lrisk" style={{ color: RISK[ri < 0 ? 0 : ri][1], background: RISK[ri < 0 ? 0 : ri][2] }}>{s.risk_level}</span></div>
                  <div className="lm">권장: {s.recommended_action} · 참조: {s.referenced_content_ids.join(", ") || "-"}{ins && ins.recommended_coverages.length ? " · 보장: " + ins.recommended_coverages.join(", ") : ""}</div>
                </div>
              ); })}
            <div className="aidlognote">※ 예시용 메모리 기록입니다. 실서비스에서는 <b>ai_doctor_sessions</b>·<b>insurance_recommendation_logs</b> 테이블에 개인정보보호 기준으로 분리·암호화 저장됩니다.</div>
          </div>
        )}
      </div>

      {/* 법적 고지 */}
      <div className="aiddisc"><AlertTriangle size={14} /> 본 서비스는 건강정보 제공 및 상담 보조 서비스이며, 의사의 진단·처방·치료를 대체하지 않습니다. 증상이 지속되거나 악화되는 경우 반드시 의료기관을 방문하시기 바랍니다. 응급 증상(가슴통증·호흡곤란·의식저하·마비·심한 출혈 등) 시 즉시 119 또는 가까운 응급실을 이용하세요.</div>
    </div>
  );
}
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
function VideoCallModal({ title, sub, onClose }) {
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, "0"), ss = String(t % 60).padStart(2, "0");
  return (
    <div className="vcall" onClick={onClose}>
      <div className="vcbox" onClick={(e) => e.stopPropagation()}>
        <div className="vcmain"><span className="vcav"><Stethoscope size={42} color="#fff" /></span><div className="vcnm">{title}</div><div className="vcsub">{sub}</div><div className="vctime"><span className="vcrec" /> {mm}:{ss}</div></div>
        <div className="vcself"><HeartPulse size={18} color="#fff" /><span>나</span></div>
        <div className="vcctrl">
          <button className="vcb" title="마이크"><Mic size={17} /></button>
          <button className="vcb" title="화면"><MonitorSmartphone size={17} /></button>
          <button className="vcb end" onClick={onClose} title="종료"><Phone size={17} /></button>
        </div>
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
function SpecialistChat() {
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("강남구");
  const [deptKey, setDeptKey] = useState(() => (typeof tmDeptForMember === "function" ? tmDeptForMember() : "fm"));
  const [showProc, setShowProc] = useState(false); const [showRule, setShowRule] = useState(false); const [join, setJoin] = useState(false);
  const [sel, setSel] = useState(null); const [booked, setBooked] = useState(false); const [visit, setVisit] = useState("재진");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState(""); const [typing, setTyping] = useState(false);
  const [video, setVideo] = useState(false); const [plus, setPlus] = useState(false);
  const fileRef = useRef(null); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  const list = (typeof genSpecialists === "function") ? genSpecialists(sido, sigungu, deptKey) : [];
  const sigus = (typeof REGION_KB !== "undefined" && REGION_KB[sido]) || [];
  const onSido = (s) => { setSido(s); const arr = REGION_KB[s] || []; setSigungu(arr[0] || ""); };
  const pick = (s) => { setSel(s); setBooked(false); setMsgs([{ id: ++UID, who: "ai", kind: "text", text: `안녕하세요, ${s.sigungu} ${s.hosp} ${s.dept} ${s.name}입니다. 비대면으로 먼저 살펴드리고, 필요하면 저희 병원 내원 진료로 연계해 드릴게요. 어떤 점이 궁금하신가요?`, first: true, time: now() }]); };
  const reply = () => { if (!sel) return; const canned = `말씀 주신 내용 잘 확인했습니다. ${sel.dept} 관점에서는 ${sel.tags[0]} 관련 정기적 관찰과 생활관리가 우선이며, 필요 시 정밀검사를 권합니다. 정확한 진단·처방은 화상상담 또는 ${sel.hosp} 내원 진료로 도와드리겠습니다.`; setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: canned, first: true, time: now() }]); }, 1300); };
  const send = (textArg) => { const text = (textArg ?? input).trim(); if (!text || !sel) return; setInput(""); setPlus(false); setMsgs((m) => [...m, { id: ++UID, who: "me", kind: "text", text, time: now() }]); reply(); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const isImg = /^image\//.test(f.type); const rd = new FileReader(); rd.onload = () => { setMsgs((m) => [...m, isImg ? { id: ++UID, who: "me", kind: "image", src: rd.result, time: now() } : { id: ++UID, who: "me", kind: "file", text: f.name, time: now() }]); reply(); }; rd.readAsDataURL(f); e.target.value = ""; setPlus(false); };
  const book = () => { if (booked || !sel) return; setBooked(true); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `✅ ${sel.hosp}(${sel.sigungu}) 내원 예약이 접수되었습니다. 비대면 상담 내역과 첨부 자료가 ${sel.name}께 전달되며, 방문일에 정밀검사·진료로 연계됩니다. 방문·진료 시 건강지갑 적립도 함께 제공됩니다.`, first: true, time: now() }]); if (typeof toast === "function") toast(`🏥 ${sel.hosp} 내원 예약 접수 · 상담내역 전달`); };
  const rxIssue = () => { if (!sel) return; setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `💊 전자처방전을 발행해 지정 약국으로 전송했습니다. 약국에서 조제 후 수령(방문·배송) 안내를 받으실 수 있습니다. 비대면진료 후 처방은 의료인의 진료 판단에 따라 발행됩니다.`, first: true, time: now() }]); if (typeof toast === "function") toast("💊 전자처방전 약국 전송 완료"); };
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
        <div className="tmcount"><b>{tmSidoShort(sido)} {sigungu}</b> · {cat.label} · 원격주치의 {list.length}명</div>
        <div className="splist">{list.map((s) => (
          <div className="dspcard" key={s.id} onClick={() => pick(s)}>
            <span className="spav"><Stethoscope size={20} color="#2563EB" /></span>
            <div className="spinfo"><b>{s.name} <small>{s.dept}</small></b><span>{s.hosp} · {tmSidoShort(s.sido)} {s.sigungu} · 경력 {s.exp}</span>
              <div className="sptags">{s.tags.map((t) => <em key={t}>{t}</em>)}<em className={tmHospTier(s.hosp) === "병원급" ? "tmtier hosp" : "tmtier"}>{tmHospTier(s.hosp)}</em><em className="tmtele">비대면 가능</em>{s.sameDay && <em className="tmday">당일</em>}</div></div>
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
    <div className="kt">
      {video && <VideoCallModal title={`${sel.name} · ${sel.dept}`} sub={`${sel.hosp} 화상상담`} onClose={() => setVideo(false)} />}
      <div className="kt-head"><ArrowLeft size={20} className="ic" onClick={() => setSel(null)} style={{ cursor: "pointer" }} /><span className="av-ai" style={{ width: 32, height: 32, background: "#EAF0FE" }}><Stethoscope size={18} color="#2563EB" /></span>
        <div style={{ flex: 1 }}><div className="nm">{sel.name} · {sel.dept}</div><div className="st"><span className="dot" /> {sel.hosp} · {tmSidoShort(sel.sido)} {sel.sigungu}</div></div>
        <button className="ktib" onClick={() => setVideo(true)} title="화상상담"><MonitorSmartphone size={18} /></button></div>
      <div className="tmcta">
        <div className="tmctat"><Building2 size={14} color="#2563EB" /> <b>{sel.hosp}</b> 원격주치의 · {tmSidoShort(sel.sido)} {sel.sigungu}</div>
        <p>비대면 상담 후, 필요 시 우리 병원 정밀검사·진료로 연계해 드려요.</p>
        <div className="tmctab"><button onClick={() => setVideo(true)}><MonitorSmartphone size={13} /> 화상상담</button><button className={`pri ${booked ? "done" : ""}`} onClick={book}><CalendarCheck size={13} /> {booked ? "내원 예약 접수됨 ✓" : "내원 예약"}</button></div>
      </div>
      <div className="teli">
        <span className="telil"><ShieldCheck size={12} /> 비대면 진료유형</span>
        <button className={visit === "재진" ? "on" : ""} onClick={() => setVisit("재진")}>재진·만성질환</button>
        <button className={visit === "초진" ? "on" : ""} onClick={() => setVisit("초진")}>초진</button>
        <span className={`telim ${visit === "초진" ? "lim" : ""}`}>{tier} · {eligMsg}</span>
      </div>
      <div className="kt-body">
        <div className="daypill"><Stethoscope size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> 원격주치의 1:1 상담 · 참고용</div>
        {msgs.map((m) => (
          <div className={`msg ${m.who}`} key={m.id}>
            {m.who === "ai" && <span className="av-ai" style={{ background: "#EAF0FE" }}>{m.first ? <Stethoscope size={16} color="#2563EB" /> : null}</span>}
            <div className="col">{m.who === "ai" && m.first && <div className="who">{sel.name}</div>}
              <div className="bubble-row">{m.kind === "image" ? <img className="chatimg" src={m.src} alt="첨부" /> : m.kind === "file" ? <div className="chatfile"><Paperclip size={14} /> {m.text}</div> : <div className={`bubble ${m.who}`}>{m.who === "ai" ? <Sents text={m.text} /> : m.text}</div>}
                <div className="meta"><span>{m.time}</span></div></div></div></div>
        ))}
        {typing && <div className="msg ai"><span className="av-ai" style={{ background: "#EAF0FE" }}><Stethoscope size={16} color="#2563EB" /></span><div className="typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      <div className="quicks"><button onClick={() => setVideo(true)}>📹 화상상담</button><button onClick={book}>🏥 내원 예약</button><button onClick={rxIssue}>💊 처방전 발행</button><button onClick={() => send("검진 결과를 상담받고 싶어요")}>검진 결과 상담</button></div>
      <div className="kt-input">
        {plus && (<div className="plus-sheet"><button onClick={() => fileRef.current && fileRef.current.click()}><ImageIcon size={20} color="#2563EB" />사진·검진결과</button><button onClick={() => fileRef.current && fileRef.current.click()}><Paperclip size={20} color="#16A34A" />파일</button><button onClick={() => { setPlus(false); setVideo(true); }}><MonitorSmartphone size={20} color="#7C3AED" />화상상담</button></div>)}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onFile} />
        <button className="pl" onClick={() => setPlus((p) => !p)}>{plus ? <X size={22} /> : <Plus size={22} />}</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="전문의에게 메시지를 입력하세요" />
        <button className={`send ${input.trim() ? "on" : "off"}`} onClick={() => send()}><Send size={16} /></button>
      </div>
      <div className="kt-disc">원격주치의 상담 · 참고용이며 실제 진단·처방을 대체하지 않습니다. 응급 시 119.</div>
    </div>
  );
}

function AIDoctor() {
  const [thread, setThread] = useState("ai");
  const tabsRef = useRef(null);
  const goThread = (t) => { setThread(t); setTimeout(() => { try { tabsRef.current && tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {} }, 60); };
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="ai" /></span>
        <div><div className="scaffold stitle" style={{ fontSize: 22, fontWeight: 800 }}>나의 주치의</div>
          <div className="ssub" style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}><Info size={13} /> 24시간 AI 주치의 + 전문의 1:1 상담 · 텍스트·음성·화상 · 파일첨부 · 웨어러블/홈케어기기 연동 · 진단이 아닌 참고용 안내</div></div></div>
      <AIDoctorSection onText={() => goThread("ai")} onVoice={() => goThread("ai")} />
      <div className="aitabs" ref={tabsRef} style={{ marginTop: 18 }}>
        <div className={`aitab ${thread === "ai" ? "on" : ""}`} onClick={() => setThread("ai")}><Bot size={15} /> AI 주치의 · 24시간</div>
        <div className={`aitab ${thread === "specialist" ? "on" : ""}`} onClick={() => setThread("specialist")}><Stethoscope size={15} /> 전문의 상담</div>
      </div>
      {thread === "specialist" ? <SpecialistChat /> : <Chat />}
    </div>
  );
}

let UID = 100;
const now = () => { const d = new Date(); let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0"); const ap = h < 12 ? "오전" : "오후"; h = h % 12 || 12; return `${ap} ${h}:${m}`; };
/* 채팅 액션 버튼 → 섹션 네비게이션 매핑 */
const ACTION_NAV = { "🔬 추가 검진 예약": "checkup", "🏥 병원·진료 안내": "hospital", "💊 영양 및 홈케어의료기": "shop", "🥗 건강 식단 안내": "shop" };
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
function groupCounsel(text) {
  for (const g of DZ_GROUPS) {
    const m = g.members.find((x) => x.keys.some((k) => text.includes(k)));
    if (!m) continue;
    return {
      bubbles: [
        { kind: "text", text: `${m.name}에 대해 안내해 드릴게요.\n\n${m.def}\n\n주요 증상: ${m.sym}` },
        { kind: "card", card: { title: `🔎 비슷한 ${g.label.split(" ")[0]} 감별 (증상 차이)`, items: g.members.map((x) => `${x.name}: ${x.sym}`), buttons: [] } },
        { kind: "card", card: { title: "💊 도움되는 영양소 / ⚠️ 주의 영양소", items: m.nutri.map((n) => `✅ ${n}`).concat(m.avoid.map((a) => `⚠️ ${a}`)), buttons: [] } },
        { kind: "card", card: { title: "🏠 홈케어 기기 · 🩺 생활습관", items: m.device.map((d) => `🏠 ${d}`).concat(m.life.map((l) => `· ${l}`)), buttons: [] } },
        { kind: "card", card: { title: "🔬 검진 안내", items: [m.screen], buttons: ["🏥 병원·진료 안내"] } },
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
  if (rec.length || avo.length) cards.push({ kind: "card", card: { title: "💊 도움되는 영양소 / ⚠️ 주의 영양소", items: rec.map((n) => `✅ ${n}`).concat(avo.map((n) => `⚠️ ${n}`)), buttons: [] } });
  const dev = nm(e.devices); if (dev.length) cards.push({ kind: "card", card: { title: "🏠 홈케어 기기", items: dev, buttons: [] } });
  const diet = e.diet && (e.diet.recommend || []).slice(0, 5); if (diet && diet.length) cards.push({ kind: "card", card: { title: "🥗 건강 식단", items: diet, buttons: [] } });
  const life = (e.lifestyle || []).map((l) => l.tip).filter(Boolean).slice(0, 4); if (life.length) cards.push({ kind: "card", card: { title: "🩺 생활습관", items: life, buttons: [] } });
  if (!cards.length) return null;
  return { bubbles: [{ kind: "text", text: `${k} 관리 안내예요. 데이터하우스(전 세계 가이드라인 기반)에서 정리한 영양·기기·식단·생활습관입니다.` }, ...cards], quicks: ["관련 진료과·병원 찾기", "추가 정밀검진", "내 리포트 요약"] };
}
function aiRespond(text, corpus, report, QA) {
  const has = (...ks) => ks.some((k) => text.includes(k));
  const _grp = groupCounsel(text);
  if (_grp) return _grp;
  const _counsel = counselAnswer(text);
  if (_counsel) return _counsel;
  const _dh = dataHouseCounsel(text);
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
    return { bubbles: [{ kind: "text", text: `안녕하세요 ${aiWho()}님! 😊 AI 주치의예요. 질환의 증상·검사·치료·생활습관부터 내 건강리포트·의료비까지 도와드릴게요. 무엇이 궁금하세요?` }], quicks: ["내 리포트 요약", "당뇨 검사 방법", "의료비 예측"] };
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

function Chat() {
  const [msgs, setMsgs] = useState([
    { id: 1, who: "ai", kind: "text", text: `안녕하세요 ${aiWho()}님, AI 주치의예요. 👨‍⚕️\n건강분석 리포트를 바탕으로 함께 살펴드릴게요.`, time: now(), first: true },
    { id: 2, who: "ai", kind: "text", text: "무엇을 도와드릴까요? 아래에서 골라보셔도 돼요.", time: now() },
  ]);
  const [quicks, setQuicks] = useState(() => { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; return m ? memberQuestions(m).slice(0, 5) : ["혈당 수치 의미", "내 건강 후속조치", "건강분석 리포트 분석", "당뇨 예방 관리", "의료비 예측"]; });
  const [input, setInput] = useState(""); const [typing, setTyping] = useState(false); const [plus, setPlus] = useState(false);
  const [listening, setListening] = useState(false); const [interim, setInterim] = useState(""); const [tts, setTts] = useState(false);
  const [video, setVideo] = useState(false); const [devOpen, setDevOpen] = useState(false);
  const kb = useKdca();
  const report = useReport();
  const qa = useLearnedQA();
  const endRef = useRef(null); const recogRef = useRef(null); const fileRef = useRef(null); const voicesRef = useRef([]);
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
    if (ACTION_NAV[text]) { setPlus(false); if (typeof nav === "function") nav(ACTION_NAV[text]); return; }
    setInput(""); setPlus(false); setQuicks([]);
    const meId = ++UID;
    setMsgs((m) => [...m, { id: meId, who: "me", kind: "text", text, time: now(), unread: true }]);
    setTimeout(() => { setMsgs((m) => m.map((x) => x.id === meId ? { ...x, unread: false } : x)); setTyping(true); }, 500);
    setTimeout(() => { const res = aiRespond(text, kb, report, qa); setTyping(false); pushAI(res); }, 1400);
  };
  const startStt = () => { if (!sttOK) return; if (ttsOK) window.speechSynthesis.cancel(); const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); recogRef.current = r; r.lang = "ko-KR"; r.interimResults = true; r.continuous = false; let fin = ""; r.onstart = () => { setListening(true); setInterim(""); }; r.onresult = (e) => { let itm = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const tr = e.results[i]; if (tr.isFinal) fin += tr[0].transcript; else itm += tr[0].transcript; } setInterim(itm); }; r.onerror = () => setListening(false); r.onend = () => { setListening(false); setInterim(""); if (fin.trim()) send(fin.trim()); }; try { r.start(); } catch (e) { setListening(false); } };
  const stopStt = () => { if (recogRef.current) { try { recogRef.current.stop(); } catch (e) {} } setListening(false); };
  const aiAck = (label) => { setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `${label}을(를) 잘 받았어요. 내용을 참고해 건강관리 안내를 도와드릴게요. 더 궁금한 점이 있으면 말씀해 주세요.`, time: now(), first: true }]); }, 1200); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const isImg = /^image\//.test(f.type); const rd = new FileReader(); rd.onload = () => { setMsgs((m) => [...m, isImg ? { id: ++UID, who: "me", kind: "image", src: rd.result, time: now() } : { id: ++UID, who: "me", kind: "file", text: f.name, time: now() }]); aiAck(isImg ? "사진" : "파일"); }; rd.readAsDataURL(f); e.target.value = ""; setPlus(false); };
  const shareDevice = (summary) => { setDevOpen(false); if (!summary) return; const meId = ++UID; setMsgs((m) => [...m, { id: meId, who: "me", kind: "text", text: `🩺 기기 측정값 공유 — ${summary}`, time: now() }]); setTyping(true); setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++UID, who: "ai", kind: "text", text: `연동된 측정값을 확인했어요(${summary}). 수치 추이를 바탕으로 생활관리·검진을 안내해 드릴게요. 이상 수치가 지속되면 진료를 권합니다. (참고용)`, time: now(), first: true }]); }, 1300); };
  return (
    <div className="kt">
      {video && <VideoCallModal title="AI 주치의 화상상담" sub="24시간 비대면 상담" onClose={() => setVideo(false)} />}
      <div className="kt-head"><ArrowLeft size={20} className="ic" /><span className="av-ai" style={{ width: 32, height: 32 }}><SecIcon k="ai" /></span>
        <div style={{ flex: 1 }}><div className="nm">AI 주치의</div><div className="st"><span className="dot" /> 온라인 · 24시간 상담</div></div>
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
