/* ── 국가건강정보포털 전체 코퍼스(664개) — data/kdca.json 1회 로드 ── */
let _kdcaPromise = null;
function loadKdca() {
  if (!_kdcaPromise) {
    _kdcaPromise = fetch("./data/kdca.json")
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
/* ── 질병관리청 학습용 Q&A 데이터셋(1,947쌍) — data/kdca_qa.json 1회 로드 ── */
let _qaPromise = null;
function loadQA() {
  if (!_qaPromise) {
    _qaPromise = fetch("./data/kdca_qa.json").then((r) => r.ok ? r.json() : null).catch(() => null);
  }
  return _qaPromise;
}
function useQA() {
  const [qa, setQa] = useState(null);
  useEffect(() => { let on = true; loadQA().then((d) => on && setQa(d)); return () => { on = false; }; }, []);
  return qa;
}
/* ── 임상 진료지침/환자 리플릿 학습 Q&A — data/guidelines.json 1회 로드 ── */
let _glPromise = null;
function loadGuidelines() {
  if (!_glPromise) _glPromise = fetch("./data/guidelines.json").then((r) => r.ok ? r.json() : null).catch(() => null);
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
/* ── 조성래님 개인 건강분석 리포트(프롬에이지 Premium) — data/report.json 1회 로드 ── */
let _reportPromise = null;
function loadReport() {
  if (!_reportPromise) {
    _reportPromise = fetch("./data/report.json").then((r) => r.ok ? r.json() : null).catch(() => null);
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
  ["질병 정보", HeartPulse, "고혈압"], ["증상 정보", Activity, "가슴 통증"], ["검사 정보", Stethoscope, "혈압"], ["치료 정보", Pill, "당뇨"], ["생활습관 관리", Salad, "고혈압"],
  ["심뇌혈관질환", Brain, "뇌졸중"], ["암 정보", ShieldCheck, "비급여"], ["희귀질환", FileText, "루게릭"], ["정신건강", Users, "우울"], ["응급상황", AlertTriangle, "가슴 통증"],
  ["청소년 건강", Users, "청소년"], ["노인 건강", HeartHandshake, "노인"], ["약품·식품", Pill, "약물"], ["예방접종", ShieldCheck, "예방접종"], ["금연·생활", Salad, "금연"],
];
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

/* 상담 세션·보험추천 로그 — 명세 8항 테이블 구조(메모리 데모, 실서비스는 DB insert) */
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

/* 보장 유형별 월 보험료 추정(데모, 원) — 생활관리절감은 할인 */
const PREMIUM_EST = { "중증질환": 38000, "비급여": 24000, "간병치매": 32000, "특수분야": 18000, "생활관리절감": -8000 };
/* 회원 건강상태 기반 맞춤 질문 다수 생성 */
function memberQuestions(m) {
  if (!m) return [];
  const qs = ["내 종합 케어플랜", "내 건강상태를 분석해줘", "내 리포트 요약", "내 생체나이는?", "내 의료비 예측", "내 건강 후속조치", "내가 가장 조심해야 할 암은?"];
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
  return (
    <div className="adcard adcare">
      <div className="adt2"><HeartHandshake size={16} color="#16A34A" /> {N}님 맞춤 건강 액션 — 다른 섹션 연계 안내</div>
      <div className="caregrid">
        {actions.map((a, i) => (
          <div className="carec" key={i} style={{ borderTopColor: a.col }}>
            <span className="ci" style={{ background: a.col + "1A", color: a.col }}><a.ic size={20} /></span>
            <div className="ct">{a.t}</div>
            <div className="cd">{a.d}</div>
            <button className="cbtn" style={{ margin: "8px 0 0", width: "100%" }} onClick={() => nav(a.to)}>{a.btn} <ChevronRight size={13} /></button>
          </div>
        ))}
      </div>
      <div className="aiddisc"><AlertTriangle size={14} /> 권고는 검진 데이터 기반 참고 안내이며, 확정 진단·처방은 의료진 상담이 필요합니다.</div>
    </div>
  );
}
/* ③ 관계레이어 시각화 — 종합 케어플랜 카드(6영역 + 섹션 연계 버튼) */
function CarePlanCard({ member }) {
  if (!member || typeof buildCarePlan !== "function") return null;
  const p = buildCarePlan(member);
  if (!p) return null;
  const ICO = { hospital: Building2, checkup: CalendarCheck, pill: Pill, device: MonitorSmartphone, salad: Salad, shield: ShieldCheck };
  return (
    <div className="adcard cplan">
      <div className="adt2"><HeartHandshake size={16} color="#16A34A" /> {p.name}님 종합 케어플랜 <span className="cplvl">{p.level}</span></div>
      <div className="cpgrid">
        {p.domains.map((dmn, i) => { const Ic = ICO[dmn.icon] || Sparkles; return (
          <div className="cprow" key={i} style={{ borderLeftColor: dmn.color }}>
            <span className="ci" style={{ background: dmn.color + "1A", color: dmn.color }}><Ic size={18} /></span>
            <div className="cpb"><div className="cpt">{dmn.title}</div><div className="cpn">{dmn.need}</div><div className="cpr">{dmn.reason}</div></div>
            <button className="cpgo" style={{ color: dmn.color }} onClick={() => nav(dmn.to)}>{dmn.btn} <ChevronRight size={13} /></button>
          </div>
        ); })}
      </div>
      <div className="aiddisc"><AlertTriangle size={14} /> 검진 데이터 기반 참고 안내이며, 확정 진단·처방은 의료진 상담이 필요합니다.</div>
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
  const [lang, setLang] = useState("ko");
  const T = UI_STR[lang];
  const riskLabel = (i) => lang === "en" ? RISK_EN[i] : RISK[i][0];
  const recogRef = useRef(null);
  const panelRef = useRef(null);
  const sttOK = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsOK = typeof window !== "undefined" && !!window.speechSynthesis;
  const emergencyHit = detectEmergency(q) || (result && result.risk === 4);
  const FILTERS = [["증상", "증상으로 찾기"], ["질병", "질병명으로 찾기"], ["검사", "검사·치료로 찾기"], ["생활관리", "생활관리로 찾기"]];

  const run = (query, f) => {
    const qq = query !== undefined ? query : q;
    const ff = f !== undefined ? f : filter;
    setQ(qq); if (f !== undefined) setFilter(f);
    // 데모 회원 로그인 시 — 개인 데이터 기반 분석 답변
    const member = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
    if (member && /내 건강|건강상태|분석해|조심|가장.*암|의료비|보험|건강지갑|보험료|줄일|필요한|내가|내 .*위험|후속조치/.test(qq)) {
      setPersonal(demoPersonalAnswer(member)); setResult(null); setMatches([]); setSubmitted(true); setEasy(false);
      logConsult(qq, null, 0); setLogTick((n) => n + 1);
      setTimeout(() => { try { panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {} }, 60);
      return;
    }
    setPersonal(null);
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
        <div className="aidrech">{T.catlist}</div>
        <div className="aidcatlist">{CAT_GROUPS.map(([name, pred]) => { const n = kb.filter(pred).length; return <button key={name} className={browseCat === name ? "on" : ""} onClick={() => setBrowseCat(browseCat === name ? null : name)}>{name} <span>{n}</span></button>; })}</div>
        {browseCat && (() => { const grp = CAT_GROUPS.find((g) => g[0] === browseCat); const list = grp ? kb.filter(grp[1]) : []; return (
          <div className="aidbrowse">
            <div className="bbh">{browseCat} <b>{list.length}{lang === "en" ? "" : "건"}</b><span className="bbx" onClick={() => setBrowseCat(null)}>{T.close}</span></div>
            {list.map((c) => <button className="brow" key={c.id} onClick={() => run(c.title)}><span className="bl"><span className="bt">{c.title}</span><span className="bs">{c.summary}</span></span><span className="brisk" style={{ color: RISK[c.risk][1], background: RISK[c.risk][2] }}>{riskLabel(c.risk)}</span></button>)}
          </div>
        ); })()}
      </>)}

      {/* 상담 결과 */}
      {submitted && (
        <div className="aidresult" ref={panelRef}>
          {personal ? (<>
            <div className="adcard adpersonal">
              <div className="adtop"><div><div className="adt">{personal.title}</div><div className="adcat">시연용 데모 데이터 기반 분석</div></div>
                <span className="adrisk" style={{ color: personal.grade[1], background: personal.grade[2] }}>암위험 {personal.grade[0]}</span></div>
              {personal.sections.map(([label, items], i) => (
                <div className="adsec" key={i}><div className="adsl"><Check size={14} color="#2563EB" /> {i + 1}. {label}</div><ul>{(items || []).map((x, j) => <li key={j}>{x}</li>)}</ul></div>
              ))}
              <div className="adcta">
                <button className="cbtn pri" style={{ margin: 0 }} onClick={() => openConsult("내 몸 맞춤 프리미엄보험")}><Sparkles size={14} /> 맞춤 보험 추천받기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("wallet")}><Wallet size={14} /> 건강지갑 보기</button>
                <button className="cbtn" style={{ margin: 0 }} onClick={() => nav("demo")}><CircleUserRound size={14} /> 내 대시보드</button>
              </div>
              <div className="aiddisc" style={{ marginTop: 12 }}><AlertTriangle size={14} /> 본 내용은 시연용 데모 데이터 기반 분석이며, 실제 의학적 진단이나 보험 가입 심사를 대체하지 않습니다.</div>
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
                <div className="adinsnote">{lang === "en" ? "Demo estimate; actual premium/earning depends on insurer underwriting & terms." : "※ 데모 추정치입니다. 실제 보험료·적립·지원액은 보험사 인수·심사 및 약관에 따릅니다."}</div>
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
          <div className="aidreset"><button onClick={() => { setSubmitted(false); setResult(null); setPersonal(null); setQ(""); setFilter(null); }}><ArrowLeft size={14} /> {T.reset}</button></div>
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
            <div className="aidlognote">※ 데모용 메모리 기록입니다. 실서비스에서는 <b>ai_doctor_sessions</b>·<b>insurance_recommendation_logs</b> 테이블에 개인정보보호 기준으로 분리·암호화 저장됩니다.</div>
          </div>
        )}
      </div>

      {/* 법적 고지 */}
      <div className="aiddisc"><AlertTriangle size={14} /> 본 서비스는 건강정보 제공 및 상담 보조 서비스이며, 의사의 진단·처방·치료를 대체하지 않습니다. 증상이 지속되거나 악화되는 경우 반드시 의료기관을 방문하시기 바랍니다. 응급 증상(가슴통증·호흡곤란·의식저하·마비·심한 출혈 등) 시 즉시 119 또는 가까운 응급실을 이용하세요.</div>
    </div>
  );
}
function HelpDot() { return <span className="hdq">Q</span>; }

function AIDoctor() {
  const [mode, setMode] = useState("chat");
  const tabsRef = useRef(null);
  const goTabs = (m) => { setMode(m); setTimeout(() => { try { tabsRef.current && tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {} }, 60); };
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="ai" /></span>
        <div><div className="scaffold stitle" style={{ fontSize: 22, fontWeight: 800 }}>AI 주치의 건강상담</div>
          <div className="ssub" style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}><Info size={13} /> 질병관리청 국가건강정보포털 기반 공신력 있는 건강정보로 질병·증상·검사·치료·생활습관 상담 · 음성(STT·TTS) · 진단이 아닌 위험 가능성 안내</div></div></div>
      <div className="conn" style={{ marginBottom: 14 }}>
        <span className="cdot" style={{ background: "#16A34A", boxShadow: "0 0 0 4px rgba(22,163,74,.15)" }} />
        <div className="ctxt"><b>질병관리청 국가건강정보포털 · 대한의학회 임상 진료지침 · 국립암센터 국가암검진 권고안 · 국가암정보센터 암정보 학습</b><div style={{ color: "var(--muted)", marginTop: 2 }}>664개 질환의 증상·검사·치료·생활습관, 전문 학회(대한고혈압·당뇨병·금연학회 등) 진료지침, 7대암 검진 권고와 암별 증상·원인·예방을 학습해 음성·텍스트로 상담합니다. (참고용·진단 아님)</div></div>
      </div>
      <AIDoctorSection onText={() => goTabs("chat")} onVoice={() => goTabs("voice")} />
      <div className="aitabs" ref={tabsRef} style={{ marginTop: 18 }}>
        <div className={`aitab ${mode === "chat" ? "on" : ""}`} onClick={() => setMode("chat")}><MessageSquare size={15} /> 텍스트 상담(대화형)</div>
        <div className={`aitab ${mode === "voice" ? "on" : ""}`} onClick={() => setMode("voice")}><Mic size={15} /> 음성 상담(대화형)</div>
      </div>
      {mode === "voice" ? <VoiceDoctor /> : <Chat />}
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
function aiRespond(text, corpus, report, QA) {
  const has = (...ks) => ks.some((k) => text.includes(k));
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
  const kb = useKdca();
  const report = useReport();
  const qa = useLearnedQA();
  const endRef = useRef(null);
  const chatMember = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, quicks]);
  const send = (textArg) => {
    const text = (textArg ?? input).trim(); if (!text) return;
    if (ACTION_NAV[text]) { setPlus(false); if (typeof nav === "function") nav(ACTION_NAV[text]); return; }
    setInput(""); setPlus(false); setQuicks([]);
    const meId = ++UID;
    setMsgs((m) => [...m, { id: meId, who: "me", kind: "text", text, time: now(), unread: true }]);
    setTimeout(() => { setMsgs((m) => m.map((x) => x.id === meId ? { ...x, unread: false } : x)); setTyping(true); }, 500);
    setTimeout(() => { const res = aiRespond(text, kb, report, qa); setTyping(false);
      setMsgs((m) => [...m, ...res.bubbles.map((b, i) => ({ id: ++UID, who: "ai", kind: b.kind, text: b.text, card: b.card, time: now(), first: i === 0 }))]);
      setQuicks(res.quicks || []); }, 1400);
  };
  const attach = (label) => { setPlus(false); send(label === "리포트" ? "📄 프롬에이지 Premium 리포트를 공유했어요. 분석해줘" : label === "사진" ? "🖼️ 사진을 보냈어요" : "📎 파일을 보냈어요"); };
  return (
    <div className="kt">
      <div className="kt-head"><ArrowLeft size={20} className="ic" /><span className="av-ai" style={{ width: 32, height: 32 }}><SecIcon k="ai" /></span>
        <div style={{ flex: 1 }}><div className="nm">AI 주치의</div><div className="st"><span className="dot" /> 온라인 · 24시간 상담</div></div>
        <Search size={18} className="ic" style={{ marginRight: 12 }} /><Menu size={20} className="ic" /></div>
      {chatMember && (
        <div className="kt-acts">
          <button onClick={() => nav("checkup")}>🔬 추가검진</button>
          <button onClick={() => nav("hospital")}>🏥 병원진료</button>
          <button onClick={() => nav("shop")}>💊 영양·홈케어</button>
          <button onClick={() => nav("shop")}>🥗 건강식단</button>
        </div>
      )}
      <div className="kt-body">
        <div className="daypill">2026년 5월 8일</div>
        {msgs.map((m) => (
          <div className={`msg ${m.who}`} key={m.id}>
            {m.who === "ai" && <span className="av-ai">{m.first ? <SecIcon k="ai" /> : null}</span>}
            <div className="col">{m.who === "ai" && m.first && <div className="who">AI 주치의</div>}
              <div className="bubble-row">{m.kind === "card" ? <KCard card={m.card} onBtn={(b) => send(b)} /> : <div className={`bubble ${m.who}`}>{m.who === "ai" ? <Sents text={m.text} /> : m.text}</div>}
                <div className="meta">{m.who === "me" && m.unread && <span className="unread">1</span>}<span>{m.time}</span></div></div></div></div>
        ))}
        {typing && <div className="msg ai"><span className="av-ai"><SecIcon k="ai" /></span><div className="typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      {quicks.length > 0 && !typing && <div className="quicks">{quicks.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}
      <div className="kt-input">
        {plus && (<div className="plus-sheet">
          <button onClick={() => attach("리포트")}><FileText size={20} color="#7C3AED" />리포트 공유</button>
          <button onClick={() => attach("사진")}><ImageIcon size={20} color="#2563EB" />사진</button>
          <button onClick={() => attach("파일")}><Paperclip size={20} color="#16A34A" />파일</button>
          <button onClick={() => { setPlus(false); send("음성으로 상담하고 싶어요"); }}><Mic size={20} color="#F59E0B" />음성 상담</button></div>)}
        <button className="pl" onClick={() => setPlus((p) => !p)}>{plus ? <X size={22} /> : <Plus size={22} />}</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="메시지를 입력하세요" />
        <Smile size={22} className="pl" /><button className={`send ${input.trim() ? "on" : "off"}`} onClick={() => send()}><Send size={16} /></button>
      </div>
      <div className="kt-disc">AI 상담은 의료진의 진단을 대체하지 않으며, 참고용 건강정보 안내입니다.</div>
    </div>
  );
}
function KCard({ card, onBtn }) {
  return (<div className={`kcard ${card.compact ? "compact" : ""}`}><div className="kt-t">{card.title}</div>
    <div className="kt-i">{card.items.map((it, i) => <div className="li" key={i}><span className="d" />{it}</div>)}</div>
    <div className="kt-b">{card.buttons.map((b) => <button key={b} onClick={() => onBtn(b)}>{b}</button>)}</div></div>);
}

/* ====================== Report (실데이터) ====================== */
