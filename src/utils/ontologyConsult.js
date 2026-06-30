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
  const personal = /내|나의|제가|제몸|제건강|저의|위험|등급|얼마|몇|어때|어떤가|상태|높|낮|걸릴|발생|예측|조심/.test(t);
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
/* ── 데이터하우스 핸들러(영양·의료기기·식단·의료지원제도·대상군) ── */
function kbMatch(KB, t) { for (const e of KB) for (const a of e.dz) if (t.includes(a)) return e; return null; }
function ontoMemberDisease(mr) { if (!mr || !mr.m) return ""; if ((mr.m.highRiskDiseases || []).length) return mr.m.highRiskDiseases[0]; if ((mr.m.highRiskCancerTypes || []).length) return "암"; return ""; }
function ontoNutrition(t, mr) {
  let e = kbMatch(NUTRITION_KB, t), who = "";
  if (!e && mr) { const md = ontoMemberDisease(mr); e = md ? kbMatch(NUTRITION_KB, md) : null; if (e) who = `${mr.m.name}님(${md}) 기준 `; }
  if (!e) return "어떤 질환·증상에 대한 영양인지 알려주시면(예: 당뇨 영양제, 간 건강 영양소) 맞춤으로 안내해 드릴게요.";
  return `${who}영양 안내예요. 권장 영양소는 ${e.nutrients.join("·")}이고, 도움이 될 수 있는 영양제는 ${e.supp.join("·")}이에요. 권장 식품은 ${e.food.join("·")}, 줄이면 좋은 건 ${e.avoid.join("·")}이에요. ※ 영양제는 의약품이 아니며 개인차가 있어, 복용약·질환이 있으면 섭취 전 전문가와 상담하세요.`;
}
function ontoDevice(t, mr) {
  let e = kbMatch(DEVICE_KB, t), who = "";
  if (!e && mr) { const md = ontoMemberDisease(mr); e = md ? kbMatch(DEVICE_KB, md) : null; if (e) who = `${mr.m.name}님(${md}) 기준 `; }
  if (!e) return "어떤 관리(예: 혈압·혈당·심장·호흡·관절)에 쓸 홈케어 기기인지 알려주시면 안내해 드릴게요.";
  return `${who}홈케어 의료기기 안내예요. ${e.items.map(([n, u]) => `${n}(${u})`).join(", ")} 등이 자가관리에 도움이 돼요. ※ 의료기기는 사용 전 사용법·주의사항을 확인하세요.`;
}
function ontoDiet(t, mr) {
  let e = kbMatch(DIET_KB, t), who = "";
  if (!e && mr) { const md = ontoMemberDisease(mr); e = md ? kbMatch(DIET_KB, md) : null; if (e) who = `${mr.m.name}님(${md}) 기준 `; }
  if (!e) return "어떤 질환 관리 식단인지 알려주시면(예: 당뇨 식단, 고혈압 식단) 안내해 드릴게요.";
  return `${who}식단 안내예요. 원칙은 ‘${e.principle}’이에요. 권장: ${e.rec.join("·")} / 주의: ${e.avoid.join("·")}. ※ 치료식이 필요하면 영양사·의료진 상담을 권해요.`;
}
function ontoSupport(t, mr) {
  const hit = SUPPORT_KB.find((p) => t.includes(p.name.replace(/\s/g, "")) || (/산정특례|특례/.test(t) && p.name.includes("산정특례")) || (/장기요양|요양/.test(t) && p.name.includes("장기요양")) || (/본인부담|상한/.test(t) && p.name.includes("상한")) || (/재난적|고액의료/.test(t) && p.name.includes("재난적")) || (/암환자/.test(t) && p.name.includes("암환자")) || (/영유아|아동검진/.test(t) && p.name.includes("영유아")) || (/치매/.test(t) && p.name.includes("치매")) || (/의료급여/.test(t) && p.name.includes("의료급여")));
  if (hit) return `${hit.name} 안내예요. 대상은 ${hit.who}, 내용은 ${hit.what}. 신청은 ${hit.how} ※ 대상·금액은 기준·심사에 따라 달라질 수 있어요.`;
  if (mr && mr.R) {
    const recs = ["국가건강검진"];
    if (mr.R.cancerTotal >= 6 || (mr.m.highRiskCancerTypes || []).length) recs.push("중증질환 산정특례", "암환자 의료비 지원");
    if (mr.R.reg >= 65) recs.push("노인장기요양보험");
    if ((mr.m.highRiskDiseases || []).includes("치매")) recs.push("치매국가책임제");
    recs.push("본인부담상한제");
    return `${mr.m.name}님 상태 기준으로 살펴볼 만한 제도는 ${[...new Set(recs)].slice(0, 4).join(", ")} 등이에요. 어떤 제도가 궁금하세요?(예: 산정특례, 장기요양) ※ 실제 대상·지원은 공단·보건소 심사에 따릅니다.`;
  }
  return "의료지원제도는 국가건강검진·본인부담상한제·재난적의료비·중증질환 산정특례·노인장기요양·치매국가책임제·의료급여 등이 있어요. 궁금한 제도명을 말씀해 주세요.";
}
function ontoGroup(t) {
  for (const k in GROUP_KB) { const g = GROUP_KB[k]; if (g.aliases.some((a) => t.includes(a))) return `${k} 건강 안내예요. 주요 질환은 ${g.diseases.slice(0, 6).join("·")} 등이고, 관리 포인트는 ${g.focus.slice(0, 3).join(" / ")}이에요. 권장 검진은 ${g.screening.slice(0, 3).join("·")}, 도움이 되는 영양은 ${g.nutrition.slice(0, 3).join("·")}, 식단은 ‘${g.diet}’예요. 관련 지원제도는 ${g.support.slice(0, 2).join("·")}이에요. ${ONTO_GOVERNANCE.diagnosis}`; }
  return null;
}
/* 케어플랜 실천 적립표(영역별 HTK) — 카드·지갑 공용 단일 소스 */
const CAREPLAN_REWARD = { "병원·진료": 300, "추가 검진": 500, "영양·홈케어의료기": 100, "홈케어 기기": 100, "맞춤 식단": 100, "의료지원제도": 50 };
function careplanEarned(email) {
  try { const st = JSON.parse(localStorage.getItem("hifin_careplan_" + (email || "default")) || "{}"); return Object.keys(st).reduce((s, k) => s + (st[k] === 2 ? (CAREPLAN_REWARD[k] || 100) : 0), 0); } catch (e) { return 0; }
}
/* ── ③ 관계레이어 — 회원 상태 → 진료·검진·영양·기기·식단·제도 ‘필요성’ 구조화 도출 ── */
function buildCarePlan(m) {
  if (!m || typeof demoReport !== "function") return null;
  const R = demoReport(m);
  const cancers = m.highRiskCancerTypes || [], dzs = m.highRiskDiseases || [];
  const isElder = R.reg >= 65, worst = (R.worstNames || [])[0] || "";
  const has = (x) => dzs.includes(x);
  const dept = new Set(), screen = new Set(), nutr = new Set(), dev = new Set(), diet = new Set(), prog = new Set(["국가건강검진"]);
  // 암: 진료과·검진 누적
  cancers.forEach((c) => { if (typeof deptFor === "function") { const dd = deptFor(c).dept; if (dd) dept.add(dd); } screen.add((typeof SCREENING_KB !== "undefined" && SCREENING_KB[c]) || (c + " 정밀검진")); });
  if (cancers.length) { const n = kbMatch(NUTRITION_KB, "암"); if (n) n.nutrients.slice(0, 2).forEach((x) => nutr.add(x)); }
  // 질환별 누적(모든 위험요인 교차)
  dzs.forEach((dz) => {
    if (typeof deptFor === "function") { const dd = deptFor(dz).dept; if (dd) dept.add(dd); }
    const n = kbMatch(NUTRITION_KB, dz); if (n) n.nutrients.slice(0, 2).forEach((x) => nutr.add(x));
    const dv = kbMatch(DEVICE_KB, dz); if (dv) dv.items.slice(0, 1).forEach((x) => dev.add(x[0]));
    const di = kbMatch(DIET_KB, dz); if (di) diet.add(di.principle);
  });
  if (!dept.size && worst && typeof ORGAN_DEPT !== "undefined" && ORGAN_DEPT[worst]) dept.add(ORGAN_DEPT[worst]);
  // 동반질환 교차 규칙
  if (has("당뇨병")) screen.add("당뇨 합병증 검사(안저·미세단백뇨)");
  if (has("당뇨병") && has("고혈압")) { screen.add("콩팥기능(eGFR) 검사"); dept.add("신장내과"); }
  if (has("고지혈증") || has("허혈심장질환") || has("급성심근경색증")) { screen.add("심전도·관상동맥 평가"); dept.add("순환기내과"); }
  if (has("뇌졸중") || has("뇌혈관질환")) { screen.add("경동맥 초음파·뇌영상"); dept.add("신경과"); }
  // 대상군(노인) 자동 반영
  if (isElder && typeof GROUP_KB !== "undefined") { const g = GROUP_KB["노인"]; g.screening.slice(0, 2).forEach((x) => screen.add(x)); g.nutrition.slice(0, 1).forEach((x) => nutr.add(x)); dev.add("낙상감지·응급호출"); prog.add("노인장기요양보험"); }
  // 제도
  if (R.cancerTotal >= 6 || cancers.length) { prog.add("중증질환 산정특례"); prog.add("암환자 의료비 지원"); }
  if (has("치매")) prog.add("치매국가책임제");
  const high = cancers.length > 0 || R.cancerTotal >= 8;
  const join = (s, fb, n) => { const a = [...s]; return a.length ? a.slice(0, n || 3).join("·") : fb; };
  const domains = [
    { icon: "hospital", title: "병원·진료", need: join(dept, "내과", 3), reason: cancers.length ? `${cancers.join("·")} 고위험` : dzs.length ? dzs.join("·") : "정기 점검", to: "hospital", btn: "병원 찾기", color: "#7C3AED", pri: high ? 0 : 1 },
    { icon: "checkup", title: "추가 검진", need: join(screen, "권장 주기 정기검진", 2), reason: `암위험 ${R.cancerTotal}등급${dzs.length ? " · 동반질환" : ""}`, to: "checkup", btn: "검진 예약", color: "#2563EB", pri: cancers.length ? 0 : 2 },
    { icon: "pill", title: "영양·홈케어의료기", need: join(nutr, "균형 영양", 3), reason: "맞춤 영양 보강", to: "shop", btn: "보러 가기", color: "#F59E0B", pri: 3 },
    { icon: "device", title: "홈케어 기기", need: join(dev, "혈압·체성분 모니터", 2), reason: "자가 모니터링", to: "shop", btn: "기기 보기", color: "#0E7490", pri: 3 },
    { icon: "salad", title: "맞춤 식단", need: join(diet, "저염·저당 균형식", 1), reason: "식이 관리", to: "shop", btn: "식단 보기", color: "#16A34A", pri: 4 },
    { icon: "shield", title: "의료지원제도", need: join(prog, "국가건강검진", 2), reason: isElder ? "고령·고위험" : "기본 지원", to: "insurance", btn: "제도 안내", color: "#EF4444", pri: (R.cancerTotal >= 6 || isElder) ? 1 : 5 },
  ];
  domains.forEach((dmn) => { dmn.urgency = dmn.pri <= 0 ? "긴급" : dmn.pri <= 2 ? "권장" : "관리"; });
  domains.sort((a, b) => a.pri - b.pri);
  return { name: m.name, level: high ? "전문의 상담 권장" : R.cancerTotal >= 6 ? "병원 상담 권장" : "생활관리 중심", elder: isElder, domains };
}
function ontoCarePlan(mr) {
  if (!mr || !mr.R) return "건강검진 결과가 연동되면 진료·추가검진·영양·홈케어 기기·식단·의료지원제도를 한 번에 종합해 드려요. 로그인 후 ‘내 종합 케어플랜’이라고 물어봐 주세요.";
  const p = buildCarePlan(mr.m);
  const parts = p.domains.map((dmn, i) => `${i + 1}) ${dmn.title}: ${dmn.need}`);
  return `${p.name}님 종합 케어플랜이에요(현재 ‘${p.level}’ 단계). ${parts.join(". ")}. ${ONTO_GOVERNANCE.diagnosis}`;
}
function ontologyConsult(q) {
  const raw = (q || "").trim(); if (!raw) return null;
  const t = raw.replace(/\s/g, "").toLowerCase();
  const mr = ontoMember();
  // 로그인 회원이면 개인 리포트(생체나이·질병·암·의료비·종합) 우선
  // ③ 관계레이어 — 종합 케어플랜(진료·검진·영양·기기·식단·제도 통합)
  if (/종합케어|케어플랜|종합추천|내게필요한|필요한관리|종합관리|토탈케어|한번에추천/.test(t)) return ontoCarePlan(mr);
  // 데이터하우스 — 영양·의료기기·식단·의료지원제도·대상군 (개인 리포트보다 먼저: '영양제'의 '제' 오인 방지)
  if (/영양제|영양소|영양|보충제|뭐먹|뭘먹|먹으면좋|먹어야할/.test(t)) return ontoNutrition(t, mr);
  if (/의료기기|측정기|혈압계|혈당계|홈케어|자가측정|모니터링기|기기추천/.test(t)) return ontoDevice(t, mr);
  if (/식단|식이|음식|먹거리/.test(t)) return ontoDiet(t, mr);
  if (/지원제도|의료지원|지원금|의료비지원|산정특례|장기요양|본인부담상한|재난적|의료급여|치매국가|제도안내|받을수있는.*제도|혜택/.test(t)) return ontoSupport(t, mr);
  { const grp = ontoGroup(t); if (grp) return grp; }
  // 로그인 회원이면 개인 리포트(생체나이·질병·암·의료비·종합)
  if (mr && mr.R) { const rep = ontoReportAnswer(q, mr); if (rep) return rep; }
  // 후속조치 / 다음 행동
  if (/후속조치|뭘해야|뭘하면|무엇을해야|무엇부터|어떻게관리|다음단계|다음에뭐|관리우선|뭐부터|어떻게해야/.test(t)) return ontoNext(mr);
  // A) 검진 항목 해석 (수치·기준·해석 맥락일 때만)
  const it = ontoCheckupFind(t);
  if (it && /수치|정상|기준|결과|해석|의미|뜻|높|낮|범위|등급|관리|낮추|상승|올라|검진|뭐예|뭔가/.test(t)) return ontoCheckupAnswer(it, mr);
  return null;
}
