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
/* 로그인 회원 개인 리포트 답변(생체나이·질병·암·의료비·종합) — demoReport 기반, 비로그인 시 null → 기존 report.json 위임 */
function ontoReportAnswer(q, mr) {
  if (!mr || !mr.R) return null;
  const R = mr.R, N = mr.m.name, t = (q || "").replace(/\s/g, "");
  const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
  if (/생체나이|노화|장기나이|간나이|췌장나이|심장나이|신장나이|콩팥나이|몇살|몇세/.test(t)) {
    const bad = R.organs.filter((o) => !o[3]).map((o) => `${o[0].replace("비만체형", "비만")} ${o[1]}세`).join(", ");
    const yo = R.diff <= 0 ? `${Math.abs(R.diff)}세 젊어요` : `${R.diff}세 많아요`;
    return `${N}님의 생체나이는 ${R.bio}세로 주민등록나이 ${R.reg}세보다 ${yo}. 노화속도 ${R.agingSpeed}배, 노화등수 ${R.agingRank}등으로 종합 ‘${R.evalLabel}’이에요.${bad ? ` 다만 ${bad}는 노화가 빠른 편이라 관리가 필요해요.` : ""} ${ONTO_GOVERNANCE.diagnosis}`;
  }
  if (/의료비|병원비|의료이용|외래|입원|비용|돈/.test(t)) {
    return `${N}님의 올해 예상 의료비는 약 ${won(R.costThis)}이고, 생체나이 기반으로 10년 후엔 약 ${won(R.cost10)}으로 예상돼요. 위험요인 관리로 의료비 부담을 낮출 수 있어요.`;
  }
  const personal = /내|나의|제|저의|위험|등급|얼마|몇|어때|어떤가|상태|높|낮|걸릴|발생|예측|조심/.test(t);
  if (personal) for (const c of R.cancers) {
    const base = c[0].replace("암", "");
    if (t.includes(c[0]) || (base.length >= 2 && t.includes(base))) {
      const isHr = (R.hr || []).some((h) => h.indexOf(base) >= 0);
      return `${N}님의 ${c[0]} 위험은 ‘${c[1]}’ 수준이에요${isHr ? "(고위험군 분류)" : ""}. ${isHr ? "권고 주기보다 자주 검진하고 전문의 상담을 권해요." : "권고 주기에 맞춘 정기 검진을 유지하세요."} ${ONTO_GOVERNANCE.diagnosis}`;
    }
  }
  if (personal) for (const dz of R.diseases) {
    const nm = dz[0];
    const alias = nm === "당뇨병" ? /당뇨/ : nm === "고지혈증" ? /고지혈|콜레스테롤|이상지질/ : nm === "뇌졸중" ? /뇌졸중|뇌출혈|중풍/ : nm === "뇌혈관질환" ? /뇌혈관|뇌출혈/ : nm === "급성심근경색증" ? /심근경색|심장마비/ : nm === "허혈심장질환" ? /허혈|협심|심장병/ : null;
    if (t.includes(nm) || (alias && alias.test(t))) {
      const dir = dz[1] >= 0 ? `${dz[1]}% 높아요` : `${Math.abs(dz[1])}% 낮아요`;
      return `${N}님의 ${nm} 위험도는 동년배보다 ${dir}. 10년 내 평균 발생률은 약 ${dz[2]} 수준이에요. 생활습관 관리와 정기 검진이 도움이 돼요. ${ONTO_GOVERNANCE.diagnosis}`;
    }
  }
  if (/리포트|종합|요약|분석결과|내건강|전체|총평|어때|상태/.test(t)) {
    const hiD = R.diseases.filter((d) => d[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map((d) => d[0]).join("·") || "특별히 없음";
    const warnC = (R.cancers || []).filter((c) => /경고/.test(c[1])).map((c) => c[0]).join("·");
    const hrdStr = (R.hrd && R.hrd.length) ? ` 특히 ${R.hrd.join("·")}은 적극 관리가 필요해요.` : "";
    return `${N}님 리포트 요약이에요. 생체나이 ${R.bio}세로 종합 ‘${R.evalLabel}’이에요. 동년배보다 위험이 높은 질병은 ${hiD}이고, 암위험은 ${R.cancerTotal}등급이에요.${warnC ? ` ${warnC}이 ‘경고’ 수준이고,` : ""}${hrdStr} ${ONTO_GOVERNANCE.diagnosis}`;
  }
  return null;
}
function ontologyConsult(q) {
  const raw = (q || "").trim(); if (!raw) return null;
  const t = raw.replace(/\s/g, "").toLowerCase();
  const mr = ontoMember();
  // 로그인 회원이면 개인 리포트(생체나이·질병·암·의료비·종합) 우선
  if (mr && mr.R) { const rep = ontoReportAnswer(q, mr); if (rep) return rep; }
  // 후속조치 / 다음 행동
  if (/후속조치|뭘해야|뭘하면|무엇을해야|무엇부터|어떻게관리|다음단계|다음에뭐|관리우선|뭐부터|어떻게해야/.test(t)) return ontoNext(mr);
  // A) 검진 항목 해석 (수치·기준·해석 맥락일 때만)
  const it = ontoCheckupFind(t);
  if (it && /수치|정상|기준|결과|해석|의미|뜻|높|낮|범위|등급|관리|낮추|상승|올라|검진|뭐예|뭔가/.test(t)) return ontoCheckupAnswer(it, mr);
  return null;
}
