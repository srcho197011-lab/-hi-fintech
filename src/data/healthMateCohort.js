/* ══════════════ 헬스메이트 데모 데이터 스케일업 — 프로 700 × 회원 10만 시군구 매칭 ══════════════
   설계서: docs/hi_healthmate/헬스메이트_데모데이터_스케일업_프롬프트_v1.0.md (형 확정 2026-08-20:
   ①퍼널=finModel 정합 ②프로=현대해상 설계사 하이핀 위촉 ③시군구=지점 밀도 가중)
   원칙: 지역 일치 제1원칙 · 결정론 on-demand(저장 0바이트) · 기존 10만 코호트 불변(별도 시드) ·
        체험 16명=상호작용층 / 코호트=관측층(행동은 세션 메모리만) */

/* ── 시드 유틸(별도 네임스페이스 — pilotCohort의 rng 소비 순서 불가침) ── */
function _hmcRng(s) { return _mul32(_hmHash(String(s))); }
const _HMC = { pros: null, admins: null, sggIdx: null, sggW: null, session: {}, view: {} };   // 메모리 캐시(저장 금지)

/* ── 지역단 약호 — 구 코드(HM-{약호}-26-{일련}) 재현 전용 ──
   프로 코드는 8H0001~8H9999 단일 번호대로 교체됐다(healthMate.js HM_CODES 주석). 약호는 이제
   표시·인증·배정에 쓰이지 않고, 저장소·스냅샷에 남은 옛 코드를 신 사번으로 역조회하기 위해
   legacyCode 필드를 만드는 데만 쓴다(hmCodeNorm). 지역단은 레코드의 dan 필드가 단일 소스다. */
/* 명부 전용 예약 번호 블록 — 8H0001~8H0010. 생성 프로는 8H0011부터 생성 순서 그대로 받는다(4단계 주석 참고). */
const HMC_RESERVED = 10;
const HMC_DAN_ABBR = { "강북지역단": "NB", "강남지역단": "SN", "강서지역단": "WS", "경기지역단": "GG", "성남지역단": "SNM", "북부지역단": "GBB", "경인지역단": "IC", "강원지역단": "GW", "충청지역단": "CC", "중부지역단": "JB", "호남지역단": "HN", "전북지역단": "JBK", "대경지역단": "DG", "부산지역단": "BS", "영남지역단": "YN", "경남지역단": "GN", "광역(전국)": "WD" };
const _HMC_GG_NORTH = ["의정부", "남양주", "파주", "구리", "양주"];   // 경기 북부지역단 관할(데모 축약)

/* 주소 → DISTRICTS 시군구 매칭(긴 명칭 우선 — "광주시" vs "광주" 오매칭 방지) */
function _hmcSggOfAddr(sido, addr) {
  const list = ((typeof DISTRICTS !== "undefined" && DISTRICTS[sido]) || []).slice().sort((a, b) => b.length - a.length);
  for (const d of list) if (addr.indexOf(d) === 0 || addr.indexOf(d.replace(/시$/, "")) === 0) return d;
  return list.length ? [...list].sort()[0] : "";
}
function _hmcDanOf(sido, sgg) {
  if (sido === "서울" && typeof LR_SEOUL_GU !== "undefined") { for (const d in LR_SEOUL_GU) if (LR_SEOUL_GU[d].indexOf(sgg) >= 0) return d; return "강북지역단"; }
  if (sido === "경기") { if (sgg.indexOf("성남") === 0) return "성남지역단"; if (_HMC_GG_NORTH.some((g) => sgg.indexOf(g) === 0)) return "북부지역단"; return "경기지역단"; }
  const map = (typeof LR_DAN !== "undefined" && LR_DAN[sido]) || null;
  return map ? map.dans[0] : "광역(전국)";
}

/* ── 프로 ~700명 생성 — 실사 지점 272개(LR_BRANCHES) 위에 배속 ── */
/* 명부 10명의 배속 — 사번별 명시 매핑(인덱스 산술 금지).
   예전에는 지역단 pool을 `pool[i % pool.length]`로 돌려 배속했는데, HM_CODES 배열 순서가 바뀌면
   전원의 시군구가 흔들렸다(사번 체계 교체로 실제로 순서가 바뀌었다). 이제 사번으로 못박는다.

   ⚠️ 8H0001 박성호 — 형 지시(2026-10-05): 은평지점 배속. 지점명·주소는 실사 지점 명부
      (leadBranches.js LR_BRANCHES["서울"]의 ["은평","은평구 통일로715"])에서 가져온 실사값이고,
      은평구는 LR_SEOUL_GU에서 강북지역단이라 기존 지역단(강북)과 그대로 정합한다.
   ⚠️⚠️ 이 한 줄(마포구 → 은평구)의 실측 파급 — 코호트 10만 명 중 **1,992명(1.99%)의 담당 프로가 바뀌었다**.
      전수 비교(구 배속 vs 현 배속): 은평구 1,818명 + 마포구 174명.
        · 은평구 — hmProsBySgg의 주 관할 pool이 16명 → 17명이 되고 박성호가 pool 앞에 들어가면서
          `pool[hash % pool.length]`가 전원 재추첨됐다(pool 길이가 바뀌면 전원이 흔들린다).
        · 마포구 — 주 관할 프로가 1명(박성호) → 0명이 되어 커버 공백 시군구가 됐다. 174명의 배정 근거가
          "주 관할"에서 "겸임(인접 관할 · 비대면 우선)"으로 바뀌고 담당은 8H0044·8H0058로 갔다.
        · 동반 변화 — ⑩ 관제탑의 지점 수 278 → 277, handoff_batch_report.byRosterGrade H 3209→3204 /
          L 930→939 / M 377→373.
      형 지시가 "은평지점"이므로 배속은 은평구로 유지한다. 되돌리거나 다시 옮기려면 위 숫자가 그만큼
      다시 움직인다는 뜻이고, 어느 쪽이든 실측치를 이 주석과 커밋에 남긴다.
   ⚠️ 나머지 9명의 시군구(관할)는 구 배속을 그대로 보존한다 — 바꾸면 위와 같은 재배정이 또 번진다.

   소속 지점은 전부 LR_BRANCHES 실사값으로 바꿨다(2026-10-05). 전에는 "강남구 거점"처럼 존재하지 않는
   조직 단위가 ⑩ 배분 목록·프로 검색에 실사 지점명과 섞여 나왔다. 관할 시군구에 실사 지점이 없는 경우
   (서초구·노원구·양천구)에는 같은 지역단의 실사 지점에 소속시킨다 — 소속 지점과 관할 시군구가 다른 것은
   이 모델이 coverage/gap으로 이미 표현하는 정상 상태이고, sgg를 건드리지 않으므로 재배정은 0명이다. */
const HMC_LEGACY_PLACE = {
  "8H0001": { sido: "서울", sgg: "은평구", branch: "은평지점", branchAddr: "서울 은평구 통일로715" },
  "8H0002": { sido: "서울", sgg: "강남구", branch: "강남지점", branchAddr: "서울 강남구 테헤란로322" },
  "8H0003": { sido: "서울", sgg: "서초구", branch: "강남지점", branchAddr: "서울 강남구 테헤란로322" },      /* 서초구 실사 지점 없음 → 같은 강남지역단 소속 */
  "8H0004": { sido: "서울", sgg: "송파구", branch: "송파지점", branchAddr: "서울 송파구 송파대로570" },
  "8H0005": { sido: "서울", sgg: "노원구", branch: "강북수유지점", branchAddr: "서울 도봉구 마들로13길61" },  /* 노원구 실사 지점 없음 → 같은 강북지역단 소속 */
  "8H0006": { sido: "서울", sgg: "양천구", branch: "강서지점", branchAddr: "서울 영등포구 당산로141" },       /* 양천구 실사 지점 없음 → 같은 강서지역단 소속 */
  "8H0007": { sido: "경기", sgg: "수원", branch: "수원지점", branchAddr: "경기 수원시 권선구 효원로268" },
  "8H0008": { sido: "경기", sgg: "용인", branch: "용인지점", branchAddr: "경기 용인시 기흥구 동백3로11번길53" },
  "8H0009": { sido: "", sgg: "", branch: "본사(광역)", branchAddr: "" },
  "8H0010": { sido: "", sgg: "", branch: "본사(광역)", branchAddr: "" },
};
function hmProsGen() {
  if (_HMC.pros) return _HMC.pros;
  const out = [];
  const seq = {};   // 지역단별 일련(100부터) — 구 코드(legacyCode) 재현 전용
  const nm = (rng) => { const sex = rng() < 0.55 ? "여" : "남"; const g = sex === "남" ? _GIVN_M : _GIVN_F; return _pick(rng, _SURN) + _pick(rng, g); };
  /* 1) 기존 명부 10명 보존(사번·이름 그대로) — 시군구·지점은 HMC_LEGACY_PLACE 명시 배속 */
  HM_CODES.forEach((p) => {
    const pl = HMC_LEGACY_PLACE[p.code] || { sido: "", sgg: "", branch: "본사(광역)", branchAddr: "" };
    out.push(Object.assign({}, p, { sido: pl.sido, sgg: pl.sgg, branch: pl.branch, branchAddr: pl.branchAddr, coverage: pl.sgg ? [pl.sgg] : [], legacy: true, hyundai: true }));
  });
  /* 2) 실사 지점 272 × 인구 가중 배치(2단계 P3 · 형 승인 2026-08-30)
     — 수도권은 많이, 도서·저밀도는 적게: 시도별 코호트 인구 가중(_SIDO — pilotCohort와 동일 원천)에
       비례해 지점당 인원(1~5명)을 결정론 배분. 목표: 시도별 프로당 담당 편차 축소(±20%). */
  const BR = (typeof LR_BRANCHES !== "undefined") ? LR_BRANCHES : {};
  const sggHasPro = {};
  const _sidoW = {}; let _wSum = 0;
  try { (_SIDO || []).forEach(([s2, w]) => { _sidoW[s2] = w; _wSum += w; }); } catch (e) {}
  const PRO_TARGET = 686;                                    // 가중 배분의 목표값(상한·하한 보정 때문에 실제 인원과 다르다 — 현재값은 hmProsGen().length가 단일 소스: 702명)
  Object.keys(BR).forEach((sido) => {
    BR[sido].forEach(([bname, addr], bi) => {
      const rng = _hmcRng("pro|" + sido + "|" + bname + "|" + bi);
      const sgg = _hmcSggOfAddr(sido, addr);
      const dan = _hmcDanOf(sido, sgg);
      /* 지점당 인원 = 시도 인구 몫 ÷ 시도 지점 수 → 1~5명(소수부는 지점 시드로 확률 반올림) */
      let n = 2 + (rng() < 0.5 ? 0 : 1);                     // 가중 원천 부재 시 기존 규칙 유지
      if (_wSum && _sidoW[sido] && BR[sido].length) {
        const ideal = PRO_TARGET * (_sidoW[sido] / _wSum) / BR[sido].length;
        n = Math.floor(ideal) + (rng() < (ideal - Math.floor(ideal)) ? 1 : 0);
        n = Math.max(1, Math.min(5, n));
      }
      for (let k = 0; k < n; k++) {
        const ab = HMC_DAN_ABBR[dan] || "WD";
        seq[ab] = (seq[ab] || 99) + 1;
        const g = rng();
        out.push({
          /* code·sabun은 4)에서 8H####로 일괄 부여한다. legacyCode는 구 코드 역조회 전용(표시 금지). */
          legacyCode: `HM-${ab}-26-${String(seq[ab]).padStart(3, "0")}`,
          name: nm(rng) + "", branch: bname + "지점", branchAddr: sido + " " + addr,
          sido, sgg, dan, coverage: [sgg],
          grade: g < 0.30 ? "HM1" : g < 0.70 ? "HM2" : g < 0.95 ? "HM3" : "HM4",
          gradeKo: g < 0.30 ? "안내" : g < 0.70 ? "상담" : g < 0.95 ? "설계·가족" : "지역리드",
          lic: rng() < 0.85, status: rng() < 0.92 ? "활성" : (rng() < 0.62 ? "교육중" : "정지"),
          since: "2026-0" + (1 + Math.floor(rng() * 7)),
          hyundai: true,   // 현대해상 소속 설계사 → 하이핀 프로 위촉(형 확정 ②)
        });
        sggHasPro[sido + "|" + sgg] = true;
      }
    });
  });
  /* 3) 지점 없는 시군구 → 같은 시도 프로가 겸임 관할(coverage 추가, gap 표기) — 커버 공백 0 */
  if (typeof DISTRICTS !== "undefined") Object.keys(DISTRICTS).forEach((sido) => {
    DISTRICTS[sido].forEach((sgg) => {
      if (sggHasPro[sido + "|" + sgg]) return;
      const pool = out.filter((p) => p.sido === sido && p.status === "활성" && !p.legacy);
      const base = pool.length ? pool : out.filter((p) => p.dan === "광역(전국)");
      const rng = _hmcRng("gap|" + sido + "|" + sgg);
      const take = Math.max(1, Math.min(2, Math.floor(base.length / 8)));
      for (let k = 0; k < take; k++) {
        const p = base[Math.floor(rng() * base.length)];
        if (p.coverage.indexOf(sgg) < 0) p.coverage.push(sgg);
        p.gap = true;
      }
    });
  });
  /* 4) 사번 = 프로 코드 부여(형 지시 2026-10-05) — 8H0001~8H9999 단일 번호대, 생성 순서 결정론.
        ▸ 8H0001~8H0010 = 명부(HM_CODES) 예약 블록. 명부가 번호를 직접 들고 온다(8H0001 박성호 = 시연 인증 기본값).
        ▸ 8H0011부터 = 생성 프로. **생성 순서 그대로** 연속 부여한다(현재 8H0011~8H0702).
        ⚠️ 전에는 "명부가 선점하지 않은 다음 빈 번호"를 찾는 방식이었다. 명부 번호가 흩어져 있을 때만
           의미가 있고, 대신 명부에 한 줄만 끼워 넣으면 생성 프로 692명이 전원 한 칸씩 밀렸다. 밀리면
           _hmcRng("stat|"+code)로 뽑는 프로별 실적·후기가 전부 바뀌고 hifin_handoff_result_<사번>
           활동 기록이 주인을 잃는다. 그래서 예약 블록을 상수로 고정하고 생성분은 그 뒤에서 센다.
        ⚠️ 명부를 10명보다 늘릴 때는 HMC_RESERVED를 먼저 키워야 한다(그러지 않으면 아래 단언에서 멈춘다).
           예약 블록을 키우는 순간 생성 프로가 재번호되므로, 그때는 실적 시드 변경을 각오하고 회귀를 다시 떠야 한다. */
  const used = {};
  out.forEach((p) => { if (p.code) used[p.code] = 1; });
  for (const c in used) {
    const n = Number(String(c).slice(2));
    if (!(n >= 1 && n <= HMC_RESERVED)) throw new Error("HM_CODES 사번이 예약 블록(8H0001~8H" + String(HMC_RESERVED).padStart(4, "0") + ") 밖입니다: " + c);
  }
  let nextN = HMC_RESERVED;
  out.forEach((p) => {
    if (!p.code) {
      nextN++;
      p.code = "8H" + String(nextN).padStart(4, "0");
      used[p.code] = 1;
    }
    p.sabun = p.code;   // 사번=코드 — 두 필드가 어긋날 수 없게 파생(화면 병기 금지)
  });
  _HMC.pros = out;
  return out;
}
function hmProsAll() { return hmProsGen(); }
function hmProsBySgg(sido, sgg) {
  const act = hmProsGen().filter((p) => p.status === "활성");
  const main = act.filter((p) => p.sido === sido && p.sgg === sgg);
  if (main.length) return { pool: main, gap: false };
  const cov = act.filter((p) => p.sido === sido && p.coverage.indexOf(sgg) >= 0);
  if (cov.length) return { pool: cov, gap: true };
  const any = act.filter((p) => p.sido === sido);
  return { pool: any.length ? any : act.filter((p) => p.dan === "광역(전국)"), gap: true };
}

/* ── 회원 시군구 — 지점 밀도 가중(형 확정 ③) · 별도 시드(기존 코호트 불변) ── */
function _hmcSggWeights(sido) {
  if (!_HMC.sggW) _HMC.sggW = {};
  if (_HMC.sggW[sido]) return _HMC.sggW[sido];
  const list = (typeof DISTRICTS !== "undefined" && DISTRICTS[sido]) || [];
  const cnt = {};
  ((typeof LR_BRANCHES !== "undefined" && LR_BRANCHES[sido]) || []).forEach(([b, addr]) => { const g = _hmcSggOfAddr(sido, addr); cnt[g] = (cnt[g] || 0) + 1; });
  const w = list.map((sgg) => [sgg, 1 + (cnt[sgg] || 0) * 2]);   // 라플라스 1 + 지점수×2 가중
  _HMC.sggW[sido] = w;
  return w;
}
function cohortRegion(i) {
  const m = (typeof cohortMemberAt === "function") ? cohortMemberAt(i) : null;
  if (!m) return null;
  const rng = _hmcRng("sgg|" + i);
  const sgg = _wpick(rng, _hmcSggWeights(m.sido));
  return { sido: m.sido, sgg };
}
/* 회원 → 프로 매칭(결정론) + 배정 근거 — 지역 일치 제1원칙 */
function cohortProOf(i) {
  const r = cohortRegion(i);
  if (!r) return null;
  const { pool, gap } = hmProsBySgg(r.sido, r.sgg);
  if (!pool.length) return null;
  const p = pool[_hmHash("asg|" + i) % pool.length];
  const at = p.branch || p.dan;
  const why = gap ? `${r.sido} ${r.sgg} 거주 → ${at} ${p.name} 프로 겸임(인접 관할 · 비대면 우선)` : `${r.sido} ${r.sgg} 거주 → ${at} ${p.name} 프로(주 관할)`;
  return { pro: p, gap, why, region: r };
}
/* 프로 → 담당 회원 인덱스(시군구 인덱스 캐시 — 10만 1회 순회 후 메모리 보관) */
function _hmcSggIndex() {
  if (_HMC.sggIdx) return _HMC.sggIdx;
  const idx = {};
  const c = (typeof pilotCohort === "function") ? pilotCohort() : [];
  for (let i = 1; i <= c.length; i++) { const r = cohortRegion(i); if (!r) continue; const k = r.sido + "|" + r.sgg; (idx[k] || (idx[k] = [])).push(i); }
  _HMC.sggIdx = idx;
  return idx;
}
function hmMembersOfPro(code) {
  const p = (typeof hmProOf === "function") ? hmProOf(code) : hmProsGen().find((x) => x.code === code);   // 구 코드도 수용(hmCodeNorm)
  if (!p) return [];
  const idx = _hmcSggIndex();
  const sggs = [p.sgg].concat(p.coverage.filter((s) => s !== p.sgg));
  const out = [];
  sggs.forEach((sgg) => {
    const arr = idx[p.sido + "|" + sgg] || [];
    arr.forEach((i) => { const a = cohortProOf(i); if (a && a.pro.code === p.code) out.push(i); });
  });
  return out;
}

/* ── 단계 퍼널 — finModel 정합(형 확정 ①) · 결정론 부여 + 가구 가중(L6+ 정합) ── */
const HM_FUNNEL = [
  /* [단계, 비율, finModel 근거] — 합 1.000 */
  ["D1", 0.550, "1 − checkupRate(0.45): 아직 검진 데이터가 없는 회원"],
  ["D2", 0.070, "checkupRate(0.45) × (1 − 리포트 발급 0.85)"],
  ["D3", 0.230, "checkupRate × 0.85 × (1 − productBuyerRate 0.38)"],
  ["D4", 0.060, "행동 결합 진입 — checkupRate × 0.85 × productBuyerRate 중 잔류 40%"],
  ["L5", 0.045, "× activeRate(0.45) 주기 지속"],
  ["L6", 0.029, "× serviceRate(0.30) 가구·돌봄 관여"],
  ["L7", 0.012, "× aiAgentRate 상한(0.08) — 데이터 주권·프리미엄 행사"],
  ["L8", 0.004, "다년(2개년+) 추이 도달 — 재산정 가능"],
];
function cohortStageOf(i) {
  const m = (typeof cohortMemberAt === "function") ? cohortMemberAt(i) : null;
  if (!m) return null;
  const r = _hmcRng("stage|" + i)();
  /* 가구 정보는 카드 표기·L6 문안에 사용(분포 가중은 상단 왜곡을 만들어 제거 — 퍼널 정확도 우선) */
  let famN = 1; try { famN = (typeof pilotFamily === "function") ? (pilotFamily(m.hid) || []).length : 1; } catch (e) {}
  let acc = 0, cur = "D1";
  for (const [k, p] of HM_FUNNEL) { acc += p; if (r < acc) { cur = k; break; } cur = k; }
  const order = HM_FUNNEL.map((x) => x[0]);
  const reached = order.slice(0, order.indexOf(cur) + 1);
  /* 정체 — D3 22%(최대 정체 구간)·기타 15%, 일수 30~90 시드 */
  const r2 = _hmcRng("stall|" + i)();
  const stallP = cur === "D3" ? 0.22 : 0.15;
  const stalled = cur !== "D1" && r2 < stallP;
  const stalledDays = stalled ? 30 + Math.floor(_hmcRng("sd|" + i)() * 60) : Math.floor(_hmcRng("sd|" + i)() * 25);
  /* 락 — D1 중 60%는 검진대비보험 가입(검진 전 접촉 금지) */
  const enrolled = cur === "D1" && _hmHash("enr|" + i) % 100 < 60;
  return { cur, reached, stalled, stalledDays, enrolled, famN };
}
function cohortStatusOf(i, st) {
  st = st || cohortStageOf(i);
  if (!st) return null;
  /* ⚠️ 첫 분기는 **단계**다(hmContactBlocked와 같은 축 · 적대적 리뷰 실증 2026-10-06 수선).
     종전에는 `st.enrolled`만 봐서, 비가입 D1(전국 21,925명 · 박성호 28명)이 아래 해시 분기로
     떨어져 「접촉 완료 / 진행 중 / 종결」이 찍혔다 — **한 번도 연락한 적 없는 회원에게 「접촉 완료」**가
     ②탭·⑨탭 시연 화면에 그대로 떴다(D1은 cohortSignalOf도 null, st.stalled도 false라 폴백까지 간다).
     HM_MSTATUS에 새 키를 만들지 않고 HELD 표기(「대기(접촉 금지)」)를 공유한다 — ②탭·⑨탭·⑩·하이가
     같은 라벨을 쓰게 하려면 상태 코드가 하나여야 한다. 갈라 적는 것은 why 한 줄뿐이다. */
  if (st.cur === "D1" || st.enrolled) return Object.assign({ k: "HELD" }, HM_MSTATUS.HELD, {
    why: st.enrolled ? "검진결과 수령 전 — 접촉 금지(락 · 하이가 자동 해제)" : "검진결과 수령 전 — 접촉 금지(락 아님 · 검진대비보험 미가입)" });
  if (cohortSignalOf(i)) return Object.assign({ k: "NEED" }, HM_MSTATUS.NEED, { why: "하이 신호 도래 — 접촉 시점" });
  if (st.stalled) return Object.assign({ k: "STALL" }, HM_MSTATUS.STALL, { why: `${st.cur} 단계에서 ${st.stalledDays}일 정체` });
  const r = _hmHash("ms|" + i) % 100;
  if (r < 55) return Object.assign({ k: "PROG" }, HM_MSTATUS.PROG, { why: "관리 진행 중" });
  if (r < 85) return Object.assign({ k: "DONE" }, HM_MSTATUS.DONE, { why: "최근 터치 완료" });
  return Object.assign({ k: "CLOSED" }, HM_MSTATUS.CLOSED, { why: "이번 사이클 종결" });
}
/* ① 신호 — D2~D4의 6%(그중 1/6은 직접 요청) */
const _HMC_SIG = [["L-CKUP", "검진 이벤트", 30], ["L-GAP", "보장공백", 28], ["L-CLAIM", "청구 직후", 12], ["L-RERATE", "재산정 완료", 10], ["L-FAM", "가족 단위 상담", 20]];
function cohortSignalOf(i) {
  const st = cohortStageOf(i);
  if (!st || ["D2", "D3", "D4"].indexOf(st.cur) < 0) return null;
  const h = _hmHash("sig|" + i) % 100;
  if (h >= 10) return null;
  if (h === 0) return { type: "L-ASK", typeKo: "직접 요청", direct: true, tier: "T1", sla: 4 };
  const rng = _hmcRng("sigt|" + i);
  const t = _wpick(rng, _HMC_SIG.map((x) => [[x[0], x[1]], x[2]]));
  const tier = rng() < 0.4 ? "T2" : "T3";
  return { type: t[0], typeKo: t[1], direct: false, tier, sla: tier === "T2" ? 8 : 48 };
}
/* 건강현황 브리프 — 원본 수치 없이 등급·플래그·밴드만(risk 1~5 → 라벨) */
const _HMC_GRADE = ["", "정상", "경계", "이상", "고위험", "긴급"];
function cohortHealthBrief(i) {
  const m = cohortMemberAt(i);
  if (!m) return null;
  const grade = _HMC_GRADE[Math.max(1, Math.min(5, m.risk || 2))];
  const band = (m.cancer || (m.risk || 0) >= 4) ? "상" : (m.risk || 0) >= 3 ? "중" : "하";
  return { grade, sevN: (m.diseases || []).length, band, year: "2026년", seen: _hmHash("seen|" + i) % 100 < 70 };
}
/* ⑨ 카드 조립 — 체험 카드와 동일 2축 + 하이 한 줄(규칙 조립) */
function cohortCardOf(i) {
  const m = cohortMemberAt(i);
  if (!m) return null;
  const stage = cohortStageOf(i);
  const status = cohortStatusOf(i, stage);
  const hb = cohortHealthBrief(i);
  const asg = cohortProOf(i);
  const nextStage = HM_STAGES[HM_STAGES.findIndex((s) => s.k === stage.cur) + 1];
  let hi;
  /* ⚠️ HELD가 단계 축으로 넓어졌으므로 이 문안이 **비가입 D1까지** 덮는다(수선 전에는 폴백
     「예정된 연락 때까지는 지켜봐도 좋아요 … 그 단계에 맞는 행동을 고르시면 돼요」가 나가
     접촉 금지 회원에게 행동을 권했다). 연락 권유 어휘를 쓰지 않는다 — 러너가 단언한다. */
  if (status.k === "HELD") hi = "검진결과 수령 전이에요. 지금은 프로필 사전 학습만 — 결과가 오면 제가 바로 알려드릴게요.";
  else if (status.k === "NEED") hi = "하이 신호가 도래했어요 — 오늘 연결하는 게 좋겠어요.";
  else if (stage.stalled) hi = `${stage.stalledDays}일째 ${stage.cur}에 멈춰 있어요.` + (nextStage ? ` ${nextStage.k}(${nextStage.name})로 가려면 ${nextStage.desc.split("—")[0].trim()}이 필요해요.` : "");
  else hi = "예정된 연락 때까지는 지켜봐도 좋아요 — 이 회원이 지금 어느 단계인지 보고, 그 단계에 맞는 행동을 고르시면 돼요.";
  return { i, cohort: true, m, stage: { cur: stage.cur, reached: stage.reached, stalled: stage.stalled, stalledDays: stage.stalledDays }, status, hb, hi,
    mask: _hmMask(m.name), band: _hmBandOf(m.age || 45), sex: m.sex, region: asg ? asg.region : null, why: asg ? asg.why : "", famN: stage.famN };
}
/* 전국 분포 — 루프 없이 수식(HM_FUNNEL × N) */
function hmNationStats() {
  const N = (typeof PILOT_N !== "undefined") ? PILOT_N : 100000;
  return HM_FUNNEL.map(([k, p, why]) => ({ k, n: Math.round(N * p), pct: Math.round(p * 1000) / 10, why }));
}
/* ── 접촉 금지 판정(단일 원천 · 형 지시 2026-10-06) ──
   실제 소비처(2026-10-06 실사 · 「전부 이 함수만 읽는다」는 보증이 아니라 오인 유발 문장이었다):
     읽는 곳 — cohortStatusOf · cohortCardOf · hmcTouch · vsGateOf(코호트 분기) · hmAct 진입 가드 ·
                HealthMate ⓪①③⑨탭 버튼 가드(_hmBlocked) · run_handoff_batch · run_video_regression.
     읽지 않는 곳 — hmLockState(상호작용층 실회원 경로)는 검진대비보험 큐 기준을 그대로 쓴다.
                    그래서 hmAct가 두 판정을 **OR**로 읽어 한 곳에서 합친다(아래 healthMate.js).
   기준을 락(검진대비보험 가입)에서 **단계**로 올렸다: 락은 D1 중 60%에만 붙으므로 비가입 D1
   21,925명은 접촉 기록이 통과하고 hmLockViolation도 울리지 않았다(실측). 로스터에서만 빼면
   ③탭 단계별 명단·⑨탭 드릴다운·영상 요청 세 경로가 열린 채 남는다 — 결과가 도착하기 전에는
   가입 여부와 무관하게 연락하지 않는다. */
function hmContactBlocked(i) {
  const st = (typeof cohortStageOf === "function") ? cohortStageOf(i) : null;
  return !!(st && (st.cur === "D1" || st.enrolled));
}
/* 관측층 접촉 — 세션 메모리만(localStorage 오염 금지 · 새로고침 시 초기화) */
function hmcTouch(code, i, label) {
  if (hmContactBlocked(i)) { hmLockViolation(code, { email: "cohort-" + i }); return { ok: false, reason: "접촉 금지 상태예요 — 검진결과 수령 후 하이가 자동으로 열어 드려요." }; }
  const sk = (typeof hmCodeNorm === "function") ? hmCodeNorm(code) : code;
  (_HMC.session[sk] || (_HMC.session[sk] = [])).push({ at: Date.now(), i, label });
  return { ok: true, session: true };
}
function hmcTouches(code) { const k = (typeof hmCodeNorm === "function") ? hmCodeNorm(code) : code; return _HMC.session[k] || []; }
/* 프로 1명 시점 요약(탭 배분) — 담당 회원 인덱스에서 파생.
   ⚠️ 세션 캐시(_HMC.view) — 이 함수는 담당 시군구 전 회원에 cohortProOf를 돌리고 1명씩 단계 판정까지 해서
      프로 1명당 수십 ms가 든다. 그런데 hmcProStats가 내부에서 이 함수를 **다시** 부르기 때문에
      운영본부의 프로 1명 집계가 늘 두 번 스캔했다(실측: 702명 전체 42초). 산출은 전부 결정론
      (cohortStageOf · cohortSignalOf · _hmHash — 저장소를 읽지 않는다)이라 같은 사번이면 항상 같은 값이고,
      접촉 기록(_HMC.session)은 이 산출에 들어오지 않으므로 캐시해도 「집계는 원천과 일치」가 깨지지 않는다.
      키는 정규화된 사번 — 구 코드(HM-…)로 들어와도 같은 칸을 쓴다. */
function hmcProView(code) {
  const ck = (typeof hmCodeNorm === "function") ? hmCodeNorm(code) : code;
  if (ck && _HMC.view[ck]) return _HMC.view[ck];
  const ids = hmMembersOfPro(code);
  const v = { ids, n: ids.length, held: [], preResult: [], ready: [], signals: [], stall: [], byStage: {}, riskHi: [], family: [], shop: [] };
  HM_STAGES.forEach((s) => { v.byStage[s.k] = []; });
  ids.forEach((i) => {
    const st = cohortStageOf(i);
    v.byStage[st.cur].push(i);
    if (st.enrolled) v.held.push(i);
    else if (st.cur === "D2" && _hmHash("rdy|" + i) % 100 < 18) v.ready.push(i);
    /* preResult — 접촉 금지인데 **락이 아닌** 회원(검진대비보험 미가입 D1). held와 합치면
       hmContactBlocked(D1 ∪ enrolled)와 정확히 같은 집합이고 서로 겹치지 않는다.
       hmContactBlocked(i)를 여기서 다시 부르지 않는 이유는 그 함수가 cohortStageOf를 한 번 더
       돌려 이 한 패스 스캔이 두 배가 되기 때문이다(위 캐시 주석의 42초 사례) — 판정 기준은
       저 함수가 단일 원천이고, 여기서는 이미 손에 든 st로 같은 분할만 만든다.
       **held(접촉 락)를 바꾸지 않는다** — ②탭 분해·⑩관제탑·하이 답변·hmOpsSnapshot이 모두
       「접촉 락 = 검진대비보험 가입」으로 같은 숫자를 쓰고 있어, 그 정의를 넓히면 네 곳이 한꺼번에
       흔들린다. 넓어진 「연락 금지 전체」는 held + preResult로 파생해서 쓴다. */
    if (st.cur === "D1" && !st.enrolled) v.preResult.push(i);
    if (cohortSignalOf(i)) v.signals.push(i);
    if (st.stalled) v.stall.push(i);
    const m = cohortMemberAt(i);
    if (m && (m.cancer || (m.risk || 0) >= 3) && ["D3", "D4", "L5"].indexOf(st.cur) >= 0) v.riskHi.push(i);
    if (["L6"].indexOf(st.cur) >= 0 || (st.famN >= 3 && ["D4", "L5"].indexOf(st.cur) >= 0)) v.family.push(i);
    if ((["D4", "L5"].indexOf(st.cur) >= 0 && _hmHash("shp|" + i) % 100 < 60) || (st.cur === "D3" && _hmHash("shp|" + i) % 100 < 12)) v.shop.push(i);
  });
  /* 캐시 상한 — 프로 명부가 702명이라 전원을 담아도 수 MB지만, 상한 없이 두는 습관은 남기지 않는다 */
  if (ck) { if (Object.keys(_HMC.view).length > 900) _HMC.view = {}; _HMC.view[ck] = v; }
  return v;
}

/* ── 프로 실적 데모(결정론) — 실적 = 단계 전진 기여(금액·수수료·순위 없음) ──
   담당 규모·단계 분포에서 파생 + 프로 시드(등급·경력)로 성과율 변주. 화면에 "시연 분포" 고지. */
const _HMC_CMT = [
  [5, "검진 결과를 어려운 말 없이 설명해 주셔서 좋았어요. 다음 검진도 부탁드려요."],
  [5, "보험 얘기를 먼저 꺼내지 않으시고 제 건강 얘기부터 들어주셔서 신뢰가 갔습니다."],
  [4, "만기 전에 미리 알려주셔서 놓치지 않고 재가입했어요."],
  [4, "부모님 돌봄 절차를 차근차근 알려주셨어요. 공단 판정은 기다리는 중이에요."],
  [4, "리포트 보는 법을 배우고 나니 제 검진표가 읽히기 시작했어요."],
  [3, "설명은 좋았는데 통화 시간이 조금 길었어요."],
  [5, "검진 전엔 연락이 없다가 결과 나온 날 바로 전화 주신 게 인상적이었어요."],
  [3, "안내는 정확했지만 다음 일정 안내가 조금 늦었어요."],
];
function hmcProStats(code) {
  const p = (typeof hmProOf === "function") ? hmProOf(code) : hmProsGen().find((x) => x.code === code);
  if (!p) return null;
  const v = hmcProView(p.code);
  const rng = _hmcRng("stat|" + p.code);   // 시드는 정규화된 사번 — 구 코드로 들어와도 같은 실적이 나온다
  /* 성과율 — 등급 서사(경험 많을수록 완료율↑) + 프로별 지터 */
  const base = { HM1: 0.72, HM2: 0.78, HM3: 0.85, HM4: 0.88 }[p.grade] || 0.78;
  const perf = Math.min(0.97, Math.max(0.6, base + (rng() - 0.5) * 0.12));
  /* 월별 단계 전진(최근 6개월) — 담당 규모 × 월 전진율(4~7%) × 성과율 */
  const now = new Date(2026, 7);   // 시연 기준월 고정(2026-08) — 재현 가능
  const adv6 = [];
  let advTotal = 0;
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k);
    const n = Math.round(v.n * (0.04 + rng() * 0.03) * perf * (0.7 + (5 - k) * 0.08));   // 위촉 초기→성장 곡선
    adv6.push({ ym: (d.getMonth() + 1) + "월", n });
    advTotal += n;
  }
  const stallFixed = Math.round(v.stall.length * perf * 0.6);
  const firstRate = Math.round(perf * 100);
  const expireRate = Math.min(100, Math.round((perf + 0.06) * 100));
  const slaRate = Math.min(100, Math.round((perf + 0.08) * 100));
  const touches = Math.round(advTotal * 2.4);
  /* 접촉 결과 분포 — LR_RESULT_CODES 의미 재사용 */
  const dist = [
    ["연결됨", Math.round(touches * 0.46)], ["상담확정", Math.round(touches * 0.18)],
    ["예약전환", Math.round(touches * 0.12)], ["부재(재시도)", Math.round(touches * 0.16)],
    ["거절", Math.round(touches * 0.08)],
  ];
  /* 회원 평가 — 평균★ + 코멘트(성과율과 톤 매칭·시드 선택) */
  const stars = Math.round((3.9 + perf * 1.0) * 10) / 10;
  const starsN = Math.max(3, Math.round(advTotal * 0.35));
  const cIdx = [];
  while (cIdx.length < 3) { const j = Math.floor(rng() * _HMC_CMT.length); if (cIdx.indexOf(j) < 0 && (perf > 0.8 ? _HMC_CMT[j][0] >= 4 : true)) cIdx.push(j); }
  const comments = cIdx.map((j) => ({ star: _HMC_CMT[j][0], text: _HMC_CMT[j][1] }));
  return { p, n: v.n, perf, adv6, advTotal, stallFixed, stallN: v.stall.length, firstRate, expireRate, slaRate, touches, dist, stars, starsN, comments };
}
/* HM4 지역리드 — 지역단 집계(개인 상세 불가 원칙: 합계·평균만) */
function hmcDanAgg(dan) {
  const pros = hmProsGen().filter((x) => x.dan === dan && x.status === "활성");
  let adv = 0, first = 0, n = 0;
  pros.slice(0, 40).forEach((x) => { const st = hmcProStats(x.code); if (st) { adv += st.advTotal; first += st.firstRate; n++; } });
  return { dan, pros: pros.length, advSum: adv, avgFirst: n ? Math.round(first / n) : 0, sampled: Math.min(40, pros.length) };
}

/* ══════════════ 운영자 명부(지점장·지역단장·본사) — 운영본부 범위 모델의 단일 소스 ══════════════
   형 지시(2026-10-05 ⑥): 「지점장은 자기 지점만 보이게 해줘.」
   전에는 운영본부에 들어온 사람이 **누구든 전국 702명·10만 회원을 다 봤다**. 세션 역할은 3종
   (ADMIN/MEMBER/GUEST)뿐이고 프로도 ADMIN으로 들어오므로, 「누가 보는가」를 가를 축이 사번뿐이었는데
   그 사번은 프로(8H####)에만 있었다. 그래서 **운영자에게도 사번을 준다 — 본사 1H · 지역단장 2H · 지점장 3H**(형 확정 2026-10-05).

   ⚠️ 사번대를 프로와 섞지 않는다. 1H·2H·3H와 8H는 첫 글자로 갈린다. 섞으면 hmCodeNorm·hmProOf가
      운영자를 프로로 해석하고, hifin_handoff_result_<사번> 활동 기록의 주인이 뒤섞인다.

   번호 체계(결정론 — 조직 목록에서 파생, 리터럴 금지) —
     · 1H0001~  본사(현재 3석). 범위 = 전국.
     · 2H0001~  지역단장. 시연에 쓰는 강북지역단이 2H0001, 나머지는 dan 정렬 순서.
     · 3H0001~  지점장.   3H0001 = 은평지점장(시연 기본값), 나머지는 "dan|branch" 정렬 순서.
   ⚠️ 정렬 기준을 바꾸면 전원이 재번호된다(이름 시드가 _hmcRng("adm|"+code)라서 이름까지 바뀐다).
      지점이 늘거나 줄면 그 지점 뒤쪽이 밀린다 — 운영자 사번은 실적 키가 아니라 범위 키이므로
      밀려도 집계가 깨지지는 않지만, 시연 중 사번을 적어 둔 자료는 다시 떠야 한다.
   ⚠️ 「광역(전국)」·「본사(광역)」은 구 명부 보존용 합성 버킷이다(hmProsGen 주석 참고). 담당자를
      안 만들면 그 10명이 어느 범위에도 안 들어가 미아가 되므로 규칙대로 만들되 syn 배지를 달아 둔다.

   이 명부는 **시연용 합성 데이터**다 — 실제 인사 시스템 연동이 아니고, 인증도 서버 검증 없이
   세션 안에서만 성립한다(그 사실을 운영본부 화면이 그대로 적는다). */
/* 사번대 — 숫자가 작을수록 넓게 본다(형 확정 2026-10-05): 본사 1H · 지역단장 2H · 지점장 3H · 프로 8H */
const HMA_PREFIX_HQ = "1H";   /* 1H0001~ 본사 */
const HMA_PREFIX_DAN = "2H";  /* 2H0001~ 지역단장 */
const HMA_PREFIX_BR = "3H";   /* 3H0001~ 지점장 — 3H0001은 시연 기본값인 은평지점장으로 고정 */
const HMA_PREFIX = HMA_PREFIX_BR;            /* 안내 문구의 대표 예시 */
const HMA_DEMO_BRANCH = "은평지점";            /* 3H0001 고정 — 현대해상 시연 기본 계정 */
const HMA_MAX = 9999;
const HM_ADMIN_ROLES = [
  { k: "hq", ko: "본사", scopeKo: "전국", desc: "전국 전체 — 지역단·지점·프로 전원" },
  { k: "dan", ko: "지역단장", scopeKo: "지역단", desc: "자기 지역단과 그 안의 지점·프로" },
  { k: "branch", ko: "지점장", scopeKo: "지점", desc: "자기 지점 하나와 그 소속 프로" },
];
function hmAdminRole(k) { for (const r of HM_ADMIN_ROLES) if (r.k === k) return r; return null; }
/* 직책명 — **합성 버킷에는 「…장」을 붙이지 않는다.**
   ⚠️ 전에는 규칙대로 이름 + "장"을 붙여서 「광역(전국)」 → **광역장**, 「본사(광역)」 → **본사장**이 됐다.
      실사 조직에 없는 직책인데 명부 검색에 그대로 떠서(실측: 「본사장 · 지점장 · 범위 지점」),
      보는 사람은 그것을 실제 직책으로 읽는다. 배지(syn)는 렌더에서 빠질 수 있으니 **이름 자체**를 고친다. */
function hmAdminTitle(role, dan, branch) {
  if (role === "dan") return String(dan || "").indexOf("광역") === 0 ? "광역 버킷 담당(실사 지역단 아님)" : String(dan || "").replace(/\(전국\)$/, "") + "장";
  return String(branch || "").indexOf("본사") === 0 ? "본사 버킷 담당(실사 지점 아님)" : String(branch || "").replace(/\(광역\)$/, "") + "장";
}
/* 본사 석 — 직책명만 고정하고 이름·입사월은 사번 시드에서 뽑는다 */
const HMA_HQ_SEATS = ["본사 운영총괄", "본사 운영기획", "본사 데이터운영"];
const _HMA_PAD = (pre, n) => pre + String(n).padStart(4, "0");

function hmAdminsGen() {
  if (_HMC.admins) return _HMC.admins;
  const pros = (typeof hmProsGen === "function") ? hmProsGen() : [];
  /* 조직 목록은 프로 명부에서 파생한다 — 지점·지역단 리터럴을 여기 두지 않는다 */
  const dmap = {}, bmap = {};
  pros.forEach((p) => {
    const d = p.dan || "광역(전국)", b = p.branch || "본사(광역)";
    dmap[d] = 1; bmap[d + "|" + b] = (bmap[d + "|" + b] || 0) + 1;
  });
  const dans = Object.keys(dmap).sort();            /* 기본 정렬(코드유닛) — 로케일에 흔들리지 않는다 */
  const brs = Object.keys(bmap).sort();
  /* 상한 단언 — 접두가 직책별로 갈려 블록 충돌은 없고, 네 자리를 넘는 경우만 막는다 */
  if (HMA_HQ_SEATS.length > HMA_MAX) throw new Error("운영자 사번 — 본사 석이 1H9999를 넘습니다: " + HMA_HQ_SEATS.length + "석");
  if (dans.length > HMA_MAX) throw new Error("운영자 사번 — 지역단장이 2H9999를 넘습니다: " + dans.length + "개");
  if (brs.length > HMA_MAX) throw new Error("운영자 사번 — 지점장이 3H9999를 넘습니다: " + brs.length + "곳");
  const nm = (rng) => { const sex = rng() < 0.5 ? "여" : "남"; const g = sex === "남" ? _GIVN_M : _GIVN_F; return { name: _pick(rng, _SURN) + _pick(rng, g), sex }; };
  const mk = (code, role, dan, branch, title, syn) => {
    const rng = _hmcRng("adm|" + code);
    const who = nm(rng);
    return { code, sabun: code, name: who.name, sex: who.sex,
      role, roleKo: hmAdminRole(role).ko, scopeKo: hmAdminRole(role).scopeKo,
      title, dan: dan || "", branch: branch || "", syn: !!syn, status: "활성",
      since: "202" + (4 + Math.floor(rng() * 3)) + "-0" + (1 + Math.floor(rng() * 9)) };
  };
  const out = [];
  HMA_HQ_SEATS.forEach((t, i) => out.push(mk(_HMA_PAD(HMA_PREFIX_HQ, i + 1), "hq", "", "", t, false)));
  /* 지역단장 — 시연에서 쓰는 강북지역단을 2H0001로 올리고 나머지는 정렬 순서 그대로 */
  const danDemo = dans.filter((d) => d.indexOf("강북") === 0);
  const danOrder = danDemo.concat(dans.filter((d) => danDemo.indexOf(d) < 0));
  danOrder.forEach((d, i) => out.push(mk(_HMA_PAD(HMA_PREFIX_DAN, i + 1), "dan", d, "", hmAdminTitle("dan", d, ""), d.indexOf("광역") === 0)));
  /* 지점장 — 3H0001은 시연 기본값(은평지점)으로 고정하고, 나머지는 "지역단|지점" 정렬 순서 그대로 */
  const brDemo = brs.filter((bk) => bk.split("|")[1] === HMA_DEMO_BRANCH);
  const brOrder = brDemo.concat(brs.filter((bk) => brDemo.indexOf(bk) < 0));
  brOrder.forEach((bk, i) => {
    const d = bk.split("|")[0], b = bk.split("|")[1];
    out.push(mk(_HMA_PAD(HMA_PREFIX_BR, i + 1), "branch", d, b, hmAdminTitle("branch", d, b), b.indexOf("본사") === 0));
  });
  _HMC.admins = out;
  return out;
}
function hmAdminOf(code) {
  const s = String(code || "").trim().toUpperCase();
  if (!s) return null;
  for (const a of hmAdminsGen()) if (a.code === s) return a;
  return null;
}
/* 직책·소속으로 찾기 — 화면이 사번 리터럴을 박지 않게(시연 기본값도 이 경로로 집는다) */
function hmAdminFind(role, dan, branch) {
  for (const a of hmAdminsGen()) {
    if (a.role !== role) continue;
    if (role === "hq") return a;
    if (role === "dan" && a.dan === dan) return a;
    if (role === "branch" && a.branch === branch && (!dan || a.dan === dan)) return a;
  }
  return null;
}
/* 시연 기본값 — 은평지점장(형 지시의 바로 그 화면) · 강북지역단장 · 본사 담당자.
   지점·지역단 이름은 실사 명부(LR_BRANCHES·LR_SEOUL_GU)에서 온 값이고, 8H0001 박성호의 소속과 같다. */
const HM_DEMO_ADMIN_BRANCH = "은평지점";
const HM_DEMO_ADMIN_DAN = "강북지역단";
function hmAdminDemo() {
  return {
    branch: hmAdminFind("branch", HM_DEMO_ADMIN_DAN, HM_DEMO_ADMIN_BRANCH) || hmAdminFind("branch", "", HM_DEMO_ADMIN_BRANCH),
    dan: hmAdminFind("dan", HM_DEMO_ADMIN_DAN, ""),
    hq: hmAdminFind("hq", "", ""),
  };
}
/* 인증 판정 — 프로 게이트(hmCodeCheck)와 같은 결. 안내 문구까지 여기서 돌려준다(화면이 짓지 않는다). */
function hmAdminCheck(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return { ok: false, why: "운영자 사번을 입력해 주세요 — 본사 1H · 지역단장 2H · 지점장 3H(예: 3H0001)." };
  if (s.indexOf("8H") === 0) return { ok: false, why: s + "는 프로 사번(8H####)이에요 — 운영본부는 운영자 사번(1H·2H·3H)으로 들어옵니다. 담당 회원 관리는 헬스메이트 센터에서 하세요." };
  if (!/^[123]H\d{4}$/.test(s)) return { ok: false, why: "운영자 사번 형식이 아니에요 — 본사 1H · 지역단장 2H · 지점장 3H + 네 자리(예: 3H0001)." };
  const a = hmAdminOf(s);
  if (!a) return { ok: false, why: s + "는 등재된 운영자 사번이 아니에요 — 아래 검색으로 지점·지역단 담당자를 찾아 주세요." };
  if (a.status !== "활성") return { ok: false, why: a.name + " " + a.title + "은 현재 " + a.status + " 상태예요." };
  return { ok: true, code: a.code, adm: a };
}

/* ── 러너·검증 훅(관리자 전용 · §7 훅 규약) ──
   ⑨탭 카드 조립기를 그대로 내보낸다 — 러너가 「D1 전건의 status.k가 HELD이고 하이 한 줄에 연락
   권유 어휘가 없다」를 **화면과 같은 경로로** 단언한다(DOM 덤프는 표본 28행에서 멈춘다). */
try {
  if (typeof window !== "undefined") {
    window.__hifinCohortCard = function (i) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        const c = cohortCardOf(Number(i));
        if (!c) return null;
        return { i: c.i, mask: c.mask, stage: c.stage, status: { k: c.status.k, ko: c.status.ko, why: c.status.why },
          hi: c.hi, blocked: (typeof hmContactBlocked === "function") ? hmContactBlocked(Number(i)) : null };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
