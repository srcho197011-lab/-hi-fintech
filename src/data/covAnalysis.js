/* ══════════════ 무인 보장분석·보장맵(covAnalysis.js) — 리뉴얼 v1.1 R2 (형 승인 2026-09-02) ══════════════
   원천 사상: 설명서 v2 「만기 보장분석 — 사람의 손을 거치지 않는 여섯 단계」.
   ⚠️ 원칙:
     · 프로의 관여는 A6(보장맵 열람) 이후에만 — 조회(A4) 화면 자체가 존재하지 않는다.
     · 여과 규칙은 코드로 고정(운영자가 끌 수 없음) — 부담보·인수거절·청구 사유·유병자 상품 표시·고지 내용은
       보장맵에 절대 들어가지 않는다. 여과 건수만 로그로 남는다.
     · 보장맵은 계약 정보만으로 산출(§0-V1의 물리적 기반) — 건강 데이터 입력이 없다.
     · 원천: 계약=cohortInsurance[실구현] · 공백=cohortGapProfile[실구현] · 만기=cycleOf[실구현] · 동의=consentGate[실구현].
     · 중복 절감액 근사 규칙: 같은 보장이 겹치는 계약 중 월납이 가장 작은 쪽 연납액(×12)을 "정리 시 절감"으로 본다. */

/* 표준 분류(보장맵 매트릭스 축) — 상품 분류이며 건강 상태가 아니다 */
const COV_CATS = [
  { k: "cancer", ko: "암 진단" }, { k: "brain", ko: "뇌혈관 진단" }, { k: "heart", ko: "심장 진단" },
  { k: "life", ko: "사망·정기" }, { k: "injury", ko: "상해" }, { k: "driver", ko: "운전자" }, { k: "silson", ko: "실손의료" },
];

/* A5 여과 규칙(코드 고정) — 제거 대상과 사유. 시연 원본의 민감 파생 필드를 세고 산출물에서 배제 */
const COV_FILTER_RULES = [
  { k: "load",    ko: "유병 할증·인수 조건 이력", why: "부위·질환을 직접 지시" },
  { k: "disease", ko: "기왕증·질환명 참조",       why: "건강 상태 추론 유발" },
  { k: "claim",   ko: "보험금 청구·지급 사유",     why: "치료 이력을 지시" },
  { k: "senior",  ko: "유병자·간편심사 상품 표시", why: "상품 성격이 건강을 추론시킴" },
];

/* 승환 창 판정(시드 — 실 런칭 시 신계약·해지 실데이터) — NONE 82% / 6개월 내 13% / 1개월 내 5% */
function _covSwitchWindow(i) {
  const h = _hmHash("cov|sw|" + i) % 100;
  return h < 82 ? "NONE" : h < 95 ? "WITHIN_6M" : "WITHIN_1M";
}

/* ── 6단계 무인 파이프라인 — 반환에 조회 원본은 포함되지 않는다(A6 원칙) ── */
function covAnalysisOf(i) {
  const n = Number(i);
  const steps = [];
  const S = (k, ok, note) => steps.push({ k: k, ok: !!ok, note: note });
  /* A1 트리거 — 만기 D-20 이후만(T4~) */
  const cyc = (typeof cycleOf === "function") ? cycleOf(n) : null;
  const due = cyc && cyc.t && ["T4", "T5", "T6", "T7", "T8"].indexOf(cyc.t) >= 0;
  S("A1 트리거", due, due ? "만기 D-" + (cyc.s14 != null ? cyc.s14 : 0) + " — 대상 큐 편입" : "만기 D-20 전 — 대상 아님");
  if (!due) return { steps: steps, map: null, blockedAt: "A1" };
  /* A2 동의 검증 — N1 실시간 */
  const gate = (typeof consentGate === "function") ? consentGate("n1", n, "covA2") : { ok: false };
  S("A2 동의 검증", gate.ok, gate.ok ? "보장분석 동의(N1) 보유 확인" : "N1 미보유·철회 — 이후 단계 미실행(제외 로그)");
  if (!gate.ok) return { steps: steps, map: null, blockedAt: "A2" };
  /* A3 재확인 통지 — 거부 3%(시드) */
  const refused = _hmHash("cov|a3|" + n) % 100 < 3;
  S("A3 재확인 통지", !refused, refused ? "회원이 분석을 거부 — 즉시 제외" : "「분석을 진행합니다 / 거부하실 수 있습니다」 통지 완료");
  if (refused) return { steps: steps, map: null, blockedAt: "A3" };
  /* A4 조회 — 자사 계약 정보(시연: 합성 코호트). 화면 없음·식별값 미기록 */
  const ins = (typeof cohortInsurance === "function") ? cohortInsurance(n) : null;
  S("A4 조회", !!ins, ins ? "계약 " + ins.contracts.length + "건 + 실손 " + (ins.hasSilson ? "1" : "0") + "건 — 메모리에서만 사용" : "조회 실패");
  if (!ins) return { steps: steps, map: null, blockedAt: "A4" };
  /* A5 여과·산출 — 민감 파생 필드 제거(건수 로그) 후 보장맵 생성 */
  let filtered = 0;
  const fLog = [];
  const dzN = (ins._m.diseases || []).length;
  if (dzN > 0) { filtered += dzN; fLog.push("disease×" + dzN); }
  const loadN = ins.contracts.filter((c) => c.monthly > 0 && dzN >= 1).length;
  if (loadN) { filtered += loadN; fLog.push("load×" + loadN); }
  const claimN = _hmHash("cov|cl|" + n) % 3;                       /* 청구 이력(시드) — 산출물 미포함 */
  if (claimN) { filtered += claimN; fLog.push("claim×" + claimN); }
  const cats = COV_CATS.map((c) => {
    if (c.k === "silson") return { k: c.k, ko: c.ko, has: !!ins.hasSilson, limit: ins.silson ? ins.silson.limitPay : 0, gen: ins.silson ? ins.silson.gen : null };
    const hit = ins.contracts.filter((x) => x.type === c.k);
    return { k: c.k, ko: c.ko, has: hit.length > 0, limit: hit.reduce((s, x) => s + x.benefit, 0), n: hit.length };
  });
  /* 공백 — cohortGapProfile 재사용 + 실손 미가입 */
  const gp = (typeof cohortGapProfile === "function") ? cohortGapProfile(n) : null;
  const gaps = [];
  if (gp) for (const g of gp.gaps) { const cat = COV_CATS.find((c) => c.k === g.cat); if (cat) gaps.push({ k: g.cat, ko: cat.ko, why: g.why }); }
  if (!ins.hasSilson) gaps.push({ k: "silson", ko: "실손의료", why: ins.uninsured ? ins.uninsured.reasonKo : "실손 미가입" });
  /* 중복 — 입원일당이 2계약 이상에 겹치면 정리 후보(근사 규칙: 최소 월납 연납액) */
  const daily = ins.contracts.filter((c) => c.detail && c.detail.daily > 0);
  const overlaps = [];
  if (daily.length >= 2) {
    const minC = daily.reduce((a, b2) => a.monthly < b2.monthly ? a : b2);
    overlaps.push({ ko: "입원일당 중복(" + daily.length + "계약)", annualSave: minC.monthly * 12 });
  }
  const silRiders = ins.silson && ins.silson.riders3;
  if (silRiders && ins.contracts.some((c) => c.type === "injury") && silRiders.dosu) {
    overlaps.push({ ko: "상해 통원·도수 특약 겹침", annualSave: Math.round(ins.silson.monthly * 0.25) * 12 });
  }
  /* 만기·갱신 캘린더 — 검진대비보험 만기 + 갱신형 계약 */
  const calendar = [{ ko: "검진대비보험 만기", inDays: cyc.s14 != null ? cyc.s14 : 0, done: cyc.s14 == null }];
  ins.contracts.filter((c) => c.renewable).slice(0, 3).forEach((c, ix) => {
    calendar.push({ ko: c.name + " 갱신", inDays: 30 + ((_hmHash("cov|cal|" + n + "|" + ix) % 300)) });
  });
  S("A5 여과·산출", true, "여과 " + filtered + "건(" + (fLog.join("·") || "없음") + ") 제거 → 보장맵 생성");
  /* A6 배포 — 보장맵만. 조회 원본(ins)은 반환에 미포함 */
  const map = {
    cats: cats, gaps: gaps, overlaps: overlaps,
    annualSaveTotal: overlaps.reduce((s, o) => s + o.annualSave, 0),
    monthlyTotal: ins.monthlyTotal, carrierCount: ins.contracts.length + (ins.hasSilson ? 1 : 0),
    calendar: calendar, switchWindow: _covSwitchWindow(n),
    basis: "계약 정보만으로 산출 — 건강 데이터 미입력", at: new Date().toISOString().slice(0, 10),
  };
  S("A6 배포", true, "보장맵만 프로 콘솔 적재 — 조회 원본 파기·접근 경로 없음");
  return { steps: steps, map: map, blockedAt: null };
}

/* 러너 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinCov = function (i) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        return covAnalysisOf(Number(i));
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
