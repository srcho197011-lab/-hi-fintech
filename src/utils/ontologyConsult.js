/* ====================== 온톨로지 기반 상담 엔진 ======================
   검진항목 해석 / 보험 보장 공백 분석 / 후속조치 안내 — 회원 건강리포트 연계 + AI 거버넌스.
   해당 의도가 아니면 null 반환 → 기존 질환정보 엔진(consult)에 위임. */
function ontoMember() {
  try { const m = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null; return m ? { m, R: demoReport(m) } : null; } catch (e) { return null; }
}
function ontoCheckupFind(t) {
  let best = null, len = 0;
  for (const it of CHECKUP_ONTOLOGY) for (const a of it.aliases) { const k = a.toLowerCase(); if (t.includes(k) && k.length > len) { best = it; len = k.length; } }
  return best;
}
/* 검진 항목 ↔ 회원 장기(생체나이) 매핑 — 개인화 노트용 */
const ONTO_ORGAN = { "간수치": "간", "신장기능": "신장", "공복혈당": "췌장", "당화혈색소": "췌장", "콜레스테롤": "심장", "중성지방": "심장", "혈압": "심장", "체질량지수": "비만체형" };
function ontoCheckupAnswer(it, mr) {
  const grades = it.grades.map(([g, v]) => `${g} ${v}${it.unit ? " " + it.unit : ""}`).join(" / ");
  let personal = "";
  if (mr && mr.R) { const orgn = ONTO_ORGAN[it.key]; if (orgn) { const o = mr.R.organs.find((x) => x[0] === orgn); if (o && o[2] === "나쁨") personal = ` 참고로 ${mr.m.name}님은 ${orgn === "비만체형" ? "비만" : orgn} 생체나이가 다소 높게 나와, 이 항목을 특히 관리하시면 좋아요.`; } }
  return `${it.key} 검사 결과 해석을 도와드릴게요. ${it.explain} 등급 기준은요, ${grades} 정도로 봐요. 이 수치는 ${it.diseases.slice(0, 3).join("·")} 위험과 연결될 수 있어요.${personal} ${ONTO_GOVERNANCE.diagnosis}`;
}
function ontoNext(mr) {
  if (!mr || !mr.R) return "건강검진 결과가 연동되면 다음 행동(병원 진료·상담원 연결·건강관리)을 단계로 안내해 드릴게요. 로그인 후 물어봐 주세요.";
  const R = mr.R, N = mr.m.name;
  const high = (R.hr && R.hr.length) || R.cancerTotal >= 8;
  const lvl = high ? "전문의 상담 권장" : R.cancerTotal >= 6 ? "병원 상담 권장" : "생활관리로 충분";
  const worst = R.worstNames ? R.worstNames.join("·") : "";
  const rec = (R.recs && R.recs.length) ? R.recs.slice(0, 2).join(", ") : "규칙적 운동·식이 관리";
  const head = high ? `${ONTO_GOVERNANCE.highRisk} ` : "";
  return `${head}${N}님 검진 위험을 종합하면 현재 ‘${lvl}’ 단계로 보여요. 다음 순서로 권해드려요. 1) ${worst ? worst + " 등 노화가 빠른 부분은 관련 진료과 상담" : "필요 시 가까운 병원 진료"}, 2) 앱의 ‘병원 찾기’로 검진센터·전문병원 예약, 3) 건강관리(${rec}) 실천, 4) 더 궁금하면 전문 상담원 연결. ${ONTO_GOVERNANCE.diagnosis}`;
}
function ontologyConsult(q) {
  const raw = (q || "").trim(); if (!raw) return null;
  const t = raw.replace(/\s/g, "").toLowerCase();
  const mr = ontoMember();
  // 후속조치 / 다음 행동

  if (/후속조치|뭘해야|뭘하면|무엇을해야|무엇부터|어떻게관리|다음단계|다음에뭐|관리우선|뭐부터|어떻게해야/.test(t)) return ontoNext(mr);
  // A) 검진 항목 해석 (수치·기준·해석 맥락일 때만)
  const it = ontoCheckupFind(t);
  if (it && /수치|정상|기준|결과|해석|의미|뜻|높|낮|범위|등급|관리|낮추|상승|올라|검진|뭐예|뭔가/.test(t)) return ontoCheckupAnswer(it, mr);
  return null;
}
