/* ═══════════════════════════════════════════════════════════════════════
   회원별 검진데이터 생성기 + AI 상담엔진(RAG)
   · genMemberCheckup(m) → { nat(국가건강검진 결과통보서), comp(종합건강진단결과표) }
     (건강분석리포트는 demoReport(m)를 재사용 — 이미 회원별 생성됨)
   · memberCheckupCounsel(text, m) → 로그인 회원의 '내 검진 결과' 항목별 상담
   · checkupEduCounsel(text) → 검진 이해(종합검진 목적·체성분·생체나이·암예방·항목기준)
   결정론적: 회원 id/email 시드 → 재현 가능. 값은 회원 위험프로필과 정합.
   ⚠️ 교육·안내 목적. 실제 판정·진단은 검진기관 의사 소견을 따릅니다.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 결정론적 난수 ── */
function _chkSeed(s) { let h = 2166136261; s = String(s || "x"); for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; } return h >>> 0; }
function _chkRng(seed) { let h = seed >>> 0; return () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; }; }
function _chkR(rng, lo, hi, dec) { const v = lo + (hi - lo) * rng(); const f = Math.pow(10, dec || 0); return Math.round(v * f) / f; }

/* ── 항목별 sev(0정상·1주의·2위험) → 값 범위 [lo,hi,소수] ── */
const _CHK_RANGE = {
  bmi: [[20, 24.4, 1], [25, 27.5, 1], [28, 33, 1]],
  waist: { m: [[76, 88, 0], [90, 95, 0], [96, 105, 0]], f: [[70, 80, 0], [85, 90, 0], [91, 99, 0]] },
  sbp: [[106, 119, 0], [122, 136, 0], [142, 159, 0]],
  dbp: [[66, 79, 0], [82, 89, 0], [92, 102, 0]],
  fbs: [[82, 98, 0], [102, 118, 0], [128, 158, 0]],
  hba1c: [[4.9, 5.6, 1], [5.8, 6.3, 1], [6.6, 8.0, 1]],
  tc: [[158, 196, 0], [204, 236, 0], [244, 286, 0]],
  tg: [[68, 142, 0], [154, 196, 0], [212, 330, 0]],
  hdl: { m: [[44, 62, 0], [36, 42, 0], [30, 36, 0]], f: [[54, 72, 0], [44, 49, 0], [38, 44, 0]] },
  ldl: [[88, 126, 0], [132, 157, 0], [162, 198, 0]],
  ast: [[18, 34, 0], [43, 66, 0], [72, 120, 0]],
  alt: [[15, 33, 0], [40, 60, 0], [66, 110, 0]],
  ggtp: { m: [[15, 55, 0], [70, 110, 0], [130, 240, 0]], f: [[11, 30, 0], [40, 68, 0], [80, 160, 0]] },
  cr: [[0.7, 1.2, 1], [1.3, 1.5, 1], [1.6, 2.4, 1]],
  egfr: [[78, 112, 0], [58, 66, 0], [34, 54, 0]],
  hb: { m: [[14, 16.2, 1], [12.4, 13.0, 1], [10.0, 12.2, 1]], f: [[12.6, 15.0, 1], [11.2, 11.9, 1], [9.4, 11.0, 1]] },
  plt: [[180, 320, 0], [132, 148, 0], [95, 125, 0]],
  ua: [[4.0, 6.7, 1], [7.1, 7.5, 1], [7.8, 9.2, 1]],
  tsh: [[0.7, 4.4, 2], [5.6, 7.0, 2], [0.05, 0.30, 2]],
  psa: [[0.4, 2.5, 1], [3.3, 4.9, 1], [5.5, 8.0, 1]],
  cea: [[0.6, 3.8, 1], [4.4, 6.5, 1], [7.5, 12, 1]],
  afp: [[1.5, 8.5, 1], [12, 19, 1], [25, 60, 1]],
  ca199: [[5, 30, 0], [38, 58, 0], [70, 150, 0]],
};

function _hrdHas(m, k) { return (m.highRiskDiseases || []).some((d) => d.indexOf(k) >= 0); }
function _hrcHas(m, k) { return (m.highRiskCancerTypes || []).some((c) => c.indexOf(k) >= 0); }

/* 회원 위험프로필 → 항목 severity */
function _chkSev(key, m) {
  const olderOrgan = (age) => (typeof age === "number" && typeof m.regAge === "number") ? (age > m.regAge + 6 ? 2 : age > m.regAge + 2 ? 1 : 0) : 0;
  switch (key) {
    case "sbp": case "dbp": return _hrdHas(m, "고혈압") ? 2 : olderOrgan(m.heartAge);
    case "fbs": case "hba1c": return _hrdHas(m, "당뇨") ? 2 : olderOrgan(m.pancreasAge);
    case "tc": case "tg": case "ldl": return (_hrdHas(m, "고지혈") || _hrdHas(m, "이상지질")) ? 2 : (_hrdHas(m, "지방간") ? 1 : olderOrgan(m.heartAge) ? 1 : 0);
    case "hdl": return (_hrdHas(m, "고지혈") || _hrdHas(m, "이상지질")) ? 1 : 0;
    case "ast": case "alt": case "ggtp": return _hrdHas(m, "지방간") ? 2 : (_hrdHas(m, "간") ? 1 : olderOrgan(m.liverAge));
    case "cr": case "egfr": return (_hrdHas(m, "콩팥") || _hrdHas(m, "신부전") || _hrdHas(m, "신장")) ? 2 : olderOrgan(m.kidneyAge) === 2 ? 1 : 0;
    case "hb": return _hrdHas(m, "빈혈") ? 2 : 0;
    case "ua": return _hrdHas(m, "통풍") ? 2 : 0;
    case "bmi": case "waist": return olderOrgan(m.obesityAge);
    case "tsh": return _hrdHas(m, "갑상선") ? 1 : 0;
    case "psa": return _hrcHas(m, "전립선") ? 1 : 0;
    case "cea": return _hrcHas(m, "대장") ? 1 : 0;
    case "afp": return _hrcHas(m, "간") ? 1 : 0;
    case "ca199": return _hrcHas(m, "췌장") ? 1 : 0;
    default: return 0;
  }
}

function _chkLabel(key, sev) {
  if (key === "bmi") return ["정상", "과체중", "비만"][sev];
  if (key === "waist") return ["정상", "복부비만 경계", "복부비만"][sev];
  return ["정상", "주의", "위험"][sev];
}
function _chkEmoji(sev) { return ["✅", "⚠️", "🚨"][sev]; }
function _refStr(item, sex) {
  const r = item.ref;
  if (Array.isArray(r)) { if (item.lowIsBad) return `${r[0]}${item.unit} 이상`; if (r[0] === 0) return `${r[1]}${item.unit} 이하`; return `${r[0]}~${r[1]}${item.unit}`; }
  const rr = r[sex] || r.m; if (item.lowIsBad) return `${sex === "f" ? "여" : "남"} ${rr[0]}${item.unit} 이상`; return `${sex === "f" ? "여" : "남"} ${rr[0]}~${rr[1]}${item.unit}`;
}

/* ── 회원별 국가검진(nat) + 종합검진(comp) 생성 (캐시) ── */
function genMemberCheckup(m) {
  if (!m) return null;
  if (m._chk) return m._chk;
  const sex = m.sex === "여" ? "f" : "m";
  const rng = _chkRng(_chkSeed(m.id || m.email || m.name));
  const items = {};
  (typeof CHECKUP_ITEMS !== "undefined" ? CHECKUP_ITEMS : []).forEach((it) => {
    if (it.male && sex === "f") return;
    if (it.female && sex === "m") return;
    const sev = _chkSev(it.key, m);
    const rspec = _CHK_RANGE[it.key];
    let band;
    if (!rspec) band = null;
    else band = Array.isArray(rspec[0]) ? rspec[Math.min(sev, rspec.length - 1)] : (rspec[sex] || rspec.m)[Math.min(sev, 2)];
    const value = band ? _chkR(rng, band[0], band[1], band[2]) : null;
    items[it.key] = { key: it.key, name: it.name, value, unit: it.unit, sev, label: _chkLabel(it.key, sev), ref: _refStr(it, sex), item: it };
  });
  // 국가검진 판정
  const HRD = m.highRiskDiseases || [];
  const bpDmRisk = (items.sbp && items.sbp.sev === 2) || (items.fbs && items.fbs.sev === 2);
  const anyRisk1 = Object.keys(items).some((k) => items[k].sev >= 1);
  let grade;
  if (HRD.length) grade = "유질환자";
  else if (bpDmRisk) grade = "고혈압·당뇨병 질환의심";
  else if (anyRisk1) grade = "정상B";
  else grade = "정상A";
  // 생활습관 문진(관리포인트 기반)
  const mp = (m.managementPoints || []).join(" ");
  const life = [];
  if (/금연|흡연|담배/.test(mp) || _hrcHas(m, "폐")) life.push("금연 필요");
  if (/절주|음주|금주/.test(mp)) life.push("절주 필요");
  if (/운동|유산소|신체활동|근력/.test(mp) || (items.bmi && items.bmi.sev >= 1)) life.push("신체활동 필요");
  // 종합검진 소견(이상항목 요약)
  const abn = Object.keys(items).filter((k) => items[k].sev >= 1).map((k) => `${items[k].name} ${items[k].label}`);
  const nat = { grade, gradeDesc: (typeof NAT_GRADES !== "undefined" && NAT_GRADES[grade]) || "", diseases: HRD.slice(), life, date: "최근 검진", src: typeof NAT_SRC !== "undefined" ? NAT_SRC : "국가건강검진" };
  const comp = { abnormals: abn, src: typeof COMP_SRC !== "undefined" ? COMP_SRC : "종합건강진단결과표" };
  m._chk = { items, sex, nat, comp };
  return m._chk;
}

/* ── 항목 매칭 ── */
function _matchItem(text) {
  const t = String(text).toLowerCase();
  let best = null;
  (typeof CHECKUP_ITEMS !== "undefined" ? CHECKUP_ITEMS : []).forEach((it) => {
    (it.aliases || []).forEach((a) => { if (t.includes(a.toLowerCase()) && (!best || a.length > best.a.length)) best = { it, a }; });
  });
  return best ? best.it : null;
}

/* ── 로그인 회원 '내 검진 결과' 상담 ── */
function memberCheckupCounsel(text, m) {
  if (!m || typeof CHECKUP_ITEMS === "undefined") return null;
  const raw = String(text || "");
  if (/\d{2,}/.test(raw)) return null;                       // 수치 직접 입력 → kbCheckupCounsel 담당
  if (/뭐야|뭔가|정의|이란|란\?|무엇인가/.test(raw)) return null; // 정의 질의 → 교육/질환 KB 담당
  if (/위험|예방|증상|합병증|생활습관|식단|운동|보험|영양제|추천/.test(raw)) return null; // 위험도·예방·증상 등은 타 엔진(리포트/질환KB)
  const chk = genMemberCheckup(m);

  // 검진 결과 종합 요약
  if (/검진.*결과.*요약|결과.*요약|검진 요약|내 검진|국가검진 결과|종합검진 결과|검진결과 요약|검진 판정/.test(raw)) {
    const N = m.name || "회원";
    const R = (typeof demoReport === "function") ? demoReport(m) : null;
    const abn = chk.comp.abnormals;
    const lines = [
      `📋 ${N}님 검진 결과 요약`,
      `• 국가건강검진 판정: 「${chk.nat.grade}」 — ${chk.nat.gradeDesc}`,
      abn.length ? `• 주의·이상 항목: ${abn.join(" · ")}` : `• 종합검진 주요 항목 모두 정상 범위입니다.`,
      chk.nat.life.length ? `• 생활습관 관리: ${chk.nat.life.join(" · ")}` : null,
      R ? `• 생체나이 ${R.bio}세(주민등록 ${R.reg}세, ${R.diff <= 0 ? R.diff + "세" : "+" + R.diff + "세"}) · 암위험 ${R.cancerTotal}등급(${R.evalLabel})` : null,
      R ? `• 올해 예상 의료비 약 ${Number(R.costThis).toLocaleString("ko-KR")}원` : null,
    ].filter(Boolean);
    const drills = abn.slice(0, 2).map((s) => { const it = _matchItem(s); return it ? `내 ${it.name.split("(")[0]} 결과` : null; }).filter(Boolean);
    return {
      bubbles: [
        { kind: "text", text: lines.join("\n") + `\n📚 근거: ${chk.nat.src} · ${chk.comp.src} · ${typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "건강분석리포트"} (회원 검진데이터 RAG)` },
        { kind: "card", card: { title: `🩺 ${N}님 사후관리 제안`, items: [chk.nat.grade === "유질환자" ? "진단된 만성질환은 정기 추적·복약 관리가 중요해요." : "정기검진 주기를 지키며 생활습관을 관리하세요.", "이상 항목은 아래 버튼으로 항목별 해석을 확인하세요.", "고위험 항목은 관련 건강미션·보장 안내로 이어드려요."], buttons: [...drills, "내 생체나이는?"].slice(0, 3) } },
      ],
      quicks: [...drills, "내 의료비 예측", "내가 가장 조심해야 할 암은?"].filter(Boolean).slice(0, 4),
    };
  }

  // 항목별 결과 (결과 단서 필요)
  const it = _matchItem(raw);
  if (!it) return null;
  const cue = /결과|판정|수치|어때|어떤가|어떠|괜찮|해석|정상|기준|범위|의미|나왔|나온|어땠|내\s|제\s|나의|본인/.test(raw);
  if (!cue) return null;
  if (it.male && chk.sex === "f") return null;
  const row = chk.items[it.key];
  if (!row || row.value == null) return null;
  const N = m.name || "회원";
  const emoji = _chkEmoji(row.sev);
  const interp = row.sev === 0 ? "현재 정상 범위입니다. 잘 유지하고 계세요. 👍" : (it.lowIsBad ? it.lo : it.hi);
  const cardItems = [`🎯 관리: ${it.tip}`, `🔗 관련 질환: ${it.dz}`];
  if (row.sev >= 1) cardItems.push("관련 건강미션·보장 안내를 이어서 받아보실 수 있어요.");
  const btns = [`${it.dz} 생활습관 관리법은?`];
  if (row.sev >= 1) btns.push(`${it.dz} 대비 보험`); else btns.push("내 검진 결과 요약");
  return {
    bubbles: [
      { kind: "text", text: `${emoji} ${N}님 ${it.name}: ${row.value}${it.unit} → 「${row.label}」 (참고치 ${row.ref})\n${it.mean}\n${interp}\n📚 근거: ${chk.comp.src} · 회원 검진데이터 · 참고치 국민건강보험공단·대한검진의학회` },
      { kind: "card", card: { title: `🩺 ${it.name} 관리 가이드`, items: cardItems, buttons: btns } },
    ],
    quicks: [`${it.dz} 생활습관 관리법은?`, "내 검진 결과 요약", row.sev >= 1 ? `${it.dz} 대비 보험` : "내 생체나이는?"].slice(0, 3),
  };
}

/* ── 검진 이해 교육 상담(회원 불필요) ── */
function checkupEduCounsel(text) {
  if (typeof CHECKUP_EDU === "undefined") return null;
  const t = String(text || "");
  const E = CHECKUP_EDU;
  const cite = (extra) => `\n📚 근거: 종합검진 목적·결과 이해 자료 · 체성분 자료(InBody) · 대한검진의학회${extra ? " · " + extra : ""}`;

  // 종합검진 목적
  if (/종합검진.*(왜|목적|이유|필요)|검진.*(왜 받|왜 해야|목적|필요한 이유)|건강검진.*(왜|목적)/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.purpose.title}\n${E.purpose.body}${cite()}` }, { kind: "card", card: { title: "🩺 정기검진 권장", items: ["국가건강검진: 만 20세 이상 2년마다(비사무직 매년)", "종합검진: 40세 전후부터 생활습관병·암 조기발견 목적", "이상 소견은 권고 주기보다 자주 정밀검진 권장"], buttons: ["체성분이 뭐예요?", "암검진 주기 알려줘"] } }], quicks: ["체성분이 뭐예요?", "생체나이란?", "암 예방 수칙", "내 검진 결과 요약"] };
  }
  // 체성분 / 내장지방 / 부종 / 골격근 / 신체발달 / 기초대사
  if (/체성분|내장지방|부종|골격근|체지방률|신체발달|기초대사|inbody|인바디|복부지방/i.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.body.title}\n${E.body.intro}${cite()}` }, { kind: "card", card: { title: "🧬 체성분 핵심 개념", items: E.body.items, buttons: ["비만 관리법은?", "내 검진 결과 요약"] } }], quicks: ["종합검진 왜 받아요?", "생체나이란?", "비만 생활습관 관리법은?", "내 검진 결과 요약"] };
  }
  // 생체나이
  if (/생체나이란|생체나이.*(뭐|무엇|의미|개념)|노화속도|노화등수/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.bioAge.title}\n${E.bioAge.body}${cite(typeof REPORT_SRC !== "undefined" ? REPORT_SRC : "")}` }, { kind: "card", card: { title: "⏳ 생체나이 구성", items: ["비만체형·심장·간·췌장·신장 나이를 종합", "주민등록나이보다 많으면 노화가 빠른 것", "질병·암 위험도와 의료비 예측의 기준"], buttons: ["내 생체나이는?", "내 검진 결과 요약"] } }], quicks: ["내 생체나이는?", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  // 암예방 수칙
  if (/암\s*예방|암예방|예방\s*수칙|암.*생활수칙|식생활.*원칙|건강.*식습관/.test(t)) {
    return { bubbles: [{ kind: "text", text: `${E.cancer15.title}${cite()}` }, { kind: "card", card: { title: "🥗 암예방·건강식생활", items: [...E.cancer15.items.slice(0, 8), "─ 건강한 식생활 5원칙 ─", ...E.diet5.items], buttons: ["종합검진 왜 받아요?", "암검진 주기 알려줘"] } }], quicks: ["암검진 주기 알려줘", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  // 암검진 주기
  if (/암검진.*(주기|언제|나이|대상)|위암검진|대장암검진|유방암검진|자궁경부암검진|폐암검진|간암검진|검진.*주기/.test(t) && typeof CANCER_SCREENING !== "undefined") {
    const items = CANCER_SCREENING.map((c) => `${c.name}: ${c.who} · ${c.method} · ${c.cycle}마다`);
    return { bubbles: [{ kind: "text", text: `국가 암검진 대상·주기 안내입니다.${cite()}` }, { kind: "card", card: { title: "🎗️ 국가 암검진 권장", items, buttons: ["종합검진 왜 받아요?", "내 검진 결과 요약"] } }], quicks: ["종합검진 왜 받아요?", "내가 가장 조심해야 할 암은?", "체성분이 뭐예요?"] };
  }
  // 판정 등급 의미
  if (/정상\s*a|정상\s*b|유질환자|질환의심|판정.*(등급|의미|뜻)|정상B가|정상A가/.test(t) && typeof NAT_GRADES !== "undefined") {
    const items = Object.keys(NAT_GRADES).map((k) => `${k}: ${NAT_GRADES[k]}`);
    return { bubbles: [{ kind: "text", text: `국가건강검진 판정 등급의 의미입니다.${cite()}` }, { kind: "card", card: { title: "📊 검진 판정 등급", items, buttons: ["내 검진 결과 요약", "종합검진 왜 받아요?"] } }], quicks: ["내 검진 결과 요약", "종합검진 왜 받아요?"] };
  }
  // 항목 기준(비로그인/일반) — 정의성 항목 질의
  const it = _matchItem(t);
  if (it && /(정상\s*(범위|치|수치|기준)|기준|참고치|의미|뭐|무엇|어떤 검사|이란)/.test(t)) {
    const ref = _refStr(it, /여/.test(t) ? "f" : "m");
    return { bubbles: [{ kind: "text", text: `${it.name} — ${it.mean}\n참고치: ${ref}\n${it.hi || it.lo || ""}${cite()}` }, { kind: "card", card: { title: `🔬 ${it.name}`, items: [`참고치: ${ref}`, `관련 질환: ${it.dz}`, `관리: ${it.tip}`], buttons: ["내 " + it.name.split("(")[0] + " 결과", "종합검진 왜 받아요?"] } }], quicks: ["내 검진 결과 요약", "체성분이 뭐예요?", "종합검진 왜 받아요?"] };
  }
  return null;
}
