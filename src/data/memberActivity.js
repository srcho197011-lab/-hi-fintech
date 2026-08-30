/* ══════════════ 회원 활동 데모(memberActivity.js) — 2단계 P4+ (형 지시 2026-08-30) ══════════════
   10만 데모 회원의 진료·커머스(식단/영양제/홈케어기기) 활동을 **검진 결과와 개연성 있게** 생성한다.
   원천: 등급·주도 지표군(riskGrade)·생활 플래그(life)·기존 질병 진료과(deptKey) — 활동은 원인(검진)의 그림자다.
   ⚠️ 원칙: 결정론(시드=인덱스) · 원본 수치 미포함 · 등급 깊이·여정 단계에 비례(D1~D2는 활동 얕고 L구간은 깊다) ·
   상품 권유 아님 — 이미 "하고 있는" 활동의 기록(걸어온 길·프로 맥락용). */

/* 개연성 매핑표(단일 소스) — 지표군 → 진료과·식단·영양 성분·홈케어기기 */
const MA_MAP = {
  bp:    { dept: "심장내과", visitKo: "혈압 추적 진료", meal: "저염 식단", supp: ["오메가3", "코엔자임Q10"], device: "가정용 혈압계", basis: "혈압" },
  sugar: { dept: "내분비내과", visitKo: "혈당 관리 진료", meal: "저당 식단", supp: ["바나바잎", "크롬"], device: "혈당측정기", basis: "혈당" },
  lipid: { dept: "내과", visitKo: "지질 관리 진료", meal: "저지방 식단", supp: ["오메가3", "홍국"], device: "체성분 측정기", basis: "콜레스테롤" },
  liver: { dept: "소화기내과", visitKo: "간기능 정밀 진료", meal: "간 건강 식단", supp: ["밀크시슬", "비타민B"], device: "활동량 밴드", basis: "간수치" },
  body:  { dept: "정형·재활의학과", visitKo: "근골격 관리 진료", meal: "고단백 식단", supp: ["칼슘·마그네슘", "단백질 보충"], device: "체성분 측정기", basis: "체격·근골격" },
  organ: { dept: "내과", visitKo: "정밀 확인 진료", meal: "균형 식단", supp: ["종합비타민"], device: "활동량 밴드", basis: "종합 지표" },
};
const MA_LIFE = { "금연 필요": { supp: "금연 보조(니코틴 대체)", ko: "금연 프로그램" }, "절주 필요": { supp: "간 회복(밀크시슬)", ko: "절주 미션" } };

function _maRng(i, salt) { let h = 374761393 ^ i; const s2 = salt || ""; for (let k = 0; k < s2.length; k++) h = (h ^ s2.charCodeAt(k)) * 16777619 >>> 0; return function () { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; }; }

/* 회원 활동 — {visits[], commerce[], basisKo} · depth: 여정 단계 인덱스(깊을수록 활동 축적) */
function memberActivity(i) {
  const m = (typeof cohortLoginProfile === "function") ? cohortLoginProfile(Number(i)) : null;
  if (!m) return null;
  const st = (typeof cohortStageOf === "function") ? cohortStageOf(Number(i)) : null;
  const order = ["D1", "D2", "D3", "D4", "L5", "L6", "L7", "L8"];
  const depth = st ? order.indexOf(st.cur) : 0;
  /* 검진 원천 — 등급·주도 지표군·플래그(needsEngine과 동일 판정 경로) */
  let grade = "-", group = "organ", flags = [];
  try {
    const chk = genMemberCheckup(m);
    const lifeAll = (chk.nat && chk.nat.life) || [];
    flags = lifeAll.filter((f) => /절주|금연/.test(f));
    const g = riskGradeOf(chk.items, chk.trend, flags);
    grade = g.grade;
    let leadKey = null, leadSev = 0;
    for (const k in chk.items) { const sv = chk.items[k].sev || 0; if (sv > leadSev) { leadSev = sv; leadKey = k; } }
    group = leadKey ? riskGroupOf(leadKey) : "organ";
  } catch (e) {}
  const map = MA_MAP[group] || MA_MAP.organ;
  const rng = _maRng(Number(i), "act");
  const visits = [], commerce = [];
  const gradeW = grade === "H" ? 3 : grade === "M" ? 2 : grade === "L" ? 1 : 0;   // 활동 강도 = 등급 × 여정 깊이

  /* ① 진료 — 검진 결과 후속(D2+): 주도 지표군 진료과 + 기존 질병 진료과 병행 */
  if (depth >= 1 && gradeW >= 1) {
    const n = Math.min(4, gradeW + (depth >= 4 ? 1 : 0) + (rng() < 0.4 ? 1 : 0) - (rng() < 0.3 ? 1 : 0));
    if (n >= 1) visits.push({ dept: map.dept, ko: map.visitKo, n: n, basis: map.basis + " 결과 후속" });
  }
  if (depth >= 2) {
    try { const raw = cohortMemberAt(Number(i));
      if (raw && raw.deptLabel && raw.diseases && raw.diseases.length && raw.deptLabel !== map.dept && rng() < 0.6)
        visits.push({ dept: raw.deptLabel, ko: raw.diseases[0] + " 진료", n: 1 + Math.floor(rng() * 2), basis: "기존 질환 관리" });
    } catch (e) {}
  }
  /* ② 커머스 — 식단·영양제·기기: 등급이 있고 여정이 D3+면 시작, 개월 수는 깊이 비례 */
  const months = () => Math.max(1, Math.min(18, Math.floor((depth - 1) * 2 + rng() * 6)));
  if (depth >= 2 && gradeW >= 1 && rng() < 0.75) commerce.push({ kind: "meal", ko: map.meal + " 구독", since: months(), basis: map.basis });
  if (depth >= 2 && (gradeW >= 1 ? rng() < 0.85 : rng() < 0.35)) {
    const s2 = map.supp[Math.floor(rng() * map.supp.length)];
    commerce.push({ kind: "supp", ko: s2 + " 정기배송", since: months(), basis: gradeW >= 1 ? map.basis : "예방 관리" });
  }
  if (depth >= 3 && gradeW >= 2 && rng() < 0.7) commerce.push({ kind: "device", ko: map.device + " 사용 중", since: months(), basis: map.basis + " 자가 기록" });
  /* ③ 생활 플래그 연동(금연·절주) */
  for (const f of flags) { const lm = MA_LIFE[f]; if (lm && depth >= 2 && rng() < 0.6) commerce.push({ kind: "habit", ko: lm.ko + " 진행", since: months(), basis: f }); }

  return { i: Number(i), grade: grade, group: group, basisKo: map.basis,
    visits: visits.slice(0, 2), commerce: commerce.slice(0, 3),
    boundary: "원본 수치 미포함 · 검진 결과 개연성 매핑(단일 소스 MA_MAP)", label: "[예시·시연 데이터]" };
}

/* 러너 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinActivity = function (i) {
      try { if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" }; return memberActivity(i); }
      catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
