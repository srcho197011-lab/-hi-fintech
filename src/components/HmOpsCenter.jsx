/* ══════════════ 헬스메이트 운영본부 — 운영 담당자 전용 관제 센터 ══════════════
   형 지시(2026-10-05 ⑤): 「⑩ 통합 운영」을 프로 콘솔에서 떼어내 지점장·지역단장·본사 직원용
   별도 화면으로 분리한다. 프로 개인에게는 보이지 않는다.

   ⚠️ 「보이지 않는다」의 실제 집행점 — 세션 역할(ADMIN/MEMBER/GUEST)로는 가를 수 없다. 프로도
      관리자 세션으로 들어오기 때문이다. 그래서 **사번 잠금 여부**(hmProSession — 세션에 사번이 있으면
      프로 개인 세션)로 가른다. 같은 조건이 세 곳에 걸려 있고 기준은 하나다:
        ① 사이드바 메뉴(App.jsx) ② 라우트 가드(App.jsx의 effect + 렌더 분기) ③ 이 화면의 admin 판정.
      전에는 ①~③이 전부 `isAdminRole()`뿐이어서, 사번 8H0001로 들어온 프로가 이 화면을 전부 열 수 있었고
      그 화면이 스스로 「프로 개인에게는 보이지 않습니다」라고 적고 있었다(화면이 자기를 반증).
      고지문은 이제 사실만 적는다 — 사번을 잠근 관리자만 접근, 다만 **관리자끼리의 범위 제한은 아직 없다**.

   원칙(ops-console 규약 승계) —
     ① 관측이지 조작이 아니다. 수기 재배분·등급 변경·명단 수정 같은 조작 기능을 두지 않는다.
     ② 집계는 원천과 일치한다. 숫자는 기존 엔진(hmOpsSnapshot · hmcProStats · hmcProView ·
        hmDailyRoster · handoffResult · cycleStage · hiEvents)에서만 모으고, 화면에서 새 수치를
        지어내지 않는다. 블록마다 「무엇을 세는지」를 한 줄로 밝힌다.
     ③ 비용·수수료·순위는 표기하지 않는다(원가 노출 금지 규칙).
     ④ 표본으로 집계한 값은 표본임을 그 자리에 적는다. 전수와 표본을 섞어 적지 않는다
        (같은 상자에 넣고 배지를 하나만 다는 것도 섞어 적는 것이다 — 그래서 상자를 쪼갠다).
     ⑤ 회원·프로 이름은 전부 시연용 합성 데이터다. 그 고지를 hero·푸터·내보낸 표 첫 줄 세 곳에 둔다
        — 표가 화면을 떠나도 고지가 따라가야 한다.

   조직 4단 — 본사 → 지역단(실사 16 + 광역 1) → 지점(실사 272 + 본사 1) → 프로(702).
     ⚠️ 1차 숫자를 17·273으로만 적지 않는다 — 「광역(전국)」·「본사(광역)」는 구 명부 보존용 합성 버킷이고,
        조직표를 처음 보는 사람은 그 숫자를 실사 조직으로 읽는다. 병기하고 행에 배지를 단다.
     · 조직 원천 = hmProsGen()(dan·branch·sido·sgg·grade·status·coverage)
     · 담당 회원 수·오늘 카드 수 = HM_OPS_BRANCHES(배치 스냅샷) ⟵ 사번(sabun)으로 조인
       ⚠️ 스냅샷에는 dan이 없다. 지역단·지점 귀속은 항상 hmProsGen() 쪽을 기준으로 삼는다.
     · 「사업단」은 데이터에 아직 없는 단위다 — 지역단 16개로 표기하고 그 사실을 화면에 적는다. */

const HMO_C = {
  navy: "#0B2239", navy2: "#132F4C", line: "#E2E8F0", ink: "#1F2937", mut: "#64748B",
  gold: "#FFB25E", sky: "#38BDF8", cyan: "#0891B2", ok: "#15803D", warn: "#D97706",
  stall: "#EA580C", red: "#B91C1C", blue: "#1D4ED8", soft: "#F8FAFC",
};
/* 단계별 색 — 데이터(D) 계열은 청색, 생애(L) 계열은 보라 계열로 구분 */
const HMO_STAGE_C = { D1: "#94A3B8", D2: "#38BDF8", D3: "#0891B2", D4: "#2563EB", L5: "#7C3AED", L6: "#A855F7", L7: "#C026D3", L8: "#DB2777" };

function HmoStyle() {
  return (<style>{`
  .hmowrap{font-size:13px;color:${HMO_C.ink}}
  .hmohero{background:linear-gradient(118deg,${HMO_C.navy},${HMO_C.navy2} 62%,#1E4976);border-radius:16px;color:#DCE7F2;padding:17px 21px}
  .hmohero .k{font-size:10.4px;letter-spacing:2.4px;font-weight:800;color:${HMO_C.sky}}
  .hmohero h2{margin:4px 0 2px;font-size:19.5px;font-weight:900;color:#fff}
  .hmohero p{margin:3px 0 0;font-size:11.8px;color:#9FB6CC;line-height:1.6}
  .hmokpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(124px,1fr));gap:8px;margin-top:11px}
  .hmokpi .n{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:8px 11px 9px}
  .hmokpi .n b{display:block;font-size:19px;line-height:1.2;color:#fff;font-variant-numeric:tabular-nums}
  .hmokpi .n span{display:block;font-size:11px;font-weight:700;color:#A8BFD4;margin-top:2px}
  .hmokpi .n em{display:block;font-size:9.8px;font-style:normal;color:#7E97AE;margin-top:2px}
  .hmotabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .hmotab{border:1.5px solid ${HMO_C.line};background:#fff;border-radius:999px;padding:7px 13px;font-size:12.2px;font-weight:800;cursor:pointer;color:${HMO_C.mut};display:flex;align-items:center;gap:5px}
  .hmotab.on{background:${HMO_C.navy};border-color:${HMO_C.navy};color:#fff}
  .hmocard{background:#fff;border:1px solid ${HMO_C.line};border-radius:14px;padding:13px 15px;margin-top:10px}
  .hmoct{font-size:12.8px;font-weight:900;color:${HMO_C.ink};margin-bottom:7px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .hmodef{font-size:10.6px;color:${HMO_C.mut};background:${HMO_C.soft};border-left:3px solid ${HMO_C.sky};border-radius:0 7px 7px 0;padding:5px 9px;margin:6px 0 8px;line-height:1.6}
  .hmopill{display:inline-block;border-radius:999px;padding:1.5px 8px;font-size:10.4px;font-weight:800}
  .hmogrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:10px;margin-top:10px}
  .hmocrumb{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:11px;background:#fff;border:1px solid ${HMO_C.line};border-radius:11px;padding:7px 10px}
  .hmocrumb .c{border:1px solid ${HMO_C.line};background:${HMO_C.soft};border-radius:8px;padding:4px 10px;font-size:11.6px;font-weight:800;color:${HMO_C.mut};cursor:pointer}
  .hmocrumb .c.on{background:${HMO_C.navy};border-color:${HMO_C.navy};color:#fff;cursor:default}
  .hmocrumb .c:hover{border-color:${HMO_C.sky}}
  .hmorow{display:flex;align-items:center;gap:7px;padding:3px 4px;border-radius:7px;cursor:pointer}
  .hmorow:hover{background:#F1F6FB}
  .hmorow.on{background:#EAF4FE;box-shadow:inset 0 0 0 1px ${HMO_C.sky}}
  .hmobar{flex:1;height:9px;background:#F1F5F9;border-radius:5px;overflow:hidden}
  .hmobar i{display:block;height:9px;border-radius:5px}
  .hmotbl{width:100%;border-collapse:collapse;font-size:11.4px}
  .hmotbl th{background:${HMO_C.soft};color:${HMO_C.mut};font-weight:800;font-size:10.6px;padding:5px 5px;border-bottom:1px solid ${HMO_C.line};text-align:right;white-space:nowrap;cursor:pointer;user-select:none}
  .hmotbl th.l,.hmotbl td.l{text-align:left}
  .hmotbl th.on{color:${HMO_C.blue}}
  .hmotbl td{padding:4px 5px;border-bottom:1px dashed #EEF2F6;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .hmotbl tbody tr{cursor:pointer}
  .hmotbl tbody tr:hover{background:#F1F6FB}
  .hmoin{border:1px solid #CBD5E1;border-radius:8px;padding:5px 9px;font-size:11.6px;font:inherit;font-size:11.6px}
  .hmobtn{border:1.5px solid ${HMO_C.navy};background:#fff;color:${HMO_C.navy};border-radius:9px;padding:5px 12px;font-size:11.6px;font-weight:800;cursor:pointer}
  .hmobtn.pri{background:${HMO_C.navy};color:#fff}
  .hmobtn:disabled{opacity:.45;cursor:not-allowed}
  .hmoex{width:100%;min-height:92px;border:1px solid ${HMO_C.line};border-radius:9px;padding:7px 9px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10.6px;color:#334155;background:${HMO_C.soft};resize:vertical}
  .hmonote{font-size:10.6px;color:${HMO_C.mut};line-height:1.65;margin-top:6px}
  .hmostagegrid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}
  .hmostage{border:1.5px solid ${HMO_C.line};background:#fff;border-radius:10px;padding:6px 4px;text-align:center;cursor:pointer}
  .hmostage.dead{cursor:default}
  .hmostage.dead:hover{border-color:${HMO_C.line}}
  .hmostage.on{border-color:${HMO_C.navy};background:#EAF4FE}
  .hmostage b{display:block;font-size:12.4px;font-weight:900}
  .hmostage span{display:block;font-size:9.6px;color:${HMO_C.mut};line-height:1.35;margin-top:1px}
  .hmostage em{display:block;font-size:11.4px;font-style:normal;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums}
  .hmomem{display:flex;gap:9px;align-items:flex-start;padding:7px 9px;border:1px solid ${HMO_C.line};border-radius:10px;margin-bottom:5px;background:#fff}
  .hmomem .nm{font-weight:900;font-size:12.4px;white-space:nowrap}
  @media (max-width:760px){.hmostagegrid{grid-template-columns:repeat(4,1fr)}}
  `}</style>);
}

/* ═══════════════════ 데이터 계층 — 조직 색인·프로 행(캐시) ═══════════════════ */
/* 세션 메모리 캐시. localStorage를 쓰지 않는다(관측 전용 화면 — 저장 키를 새로 만들지 않는다). */
const _HMO = { org: null, row: {}, cycle: null };

/* 조직 색인 — hmProsGen()(귀속) × HM_OPS_BRANCHES(담당·오늘) 사번 조인.
   스냅샷에 없는 프로(교육중·정지 등 비활성)는 managed/today 0으로 남긴다 — 인원에서 빼지 않는다. */
function hmoOrgIndex() {
  if (_HMO.org) return _HMO.org;
  const pros = (typeof hmProsGen === "function") ? hmProsGen() : [];
  const snap = (typeof HM_OPS_BRANCHES !== "undefined") ? HM_OPS_BRANCHES : [];
  const load = {};
  snap.forEach((b) => (b.pros || []).forEach((pr) => {
    const sb = (typeof hmCodeNorm === "function") ? hmCodeNorm(pr.sabun || pr.code) : (pr.sabun || pr.code);
    if (sb) load[sb] = { managed: pr.managed || 0, today: pr.today || 0 };
  }));
  const list = pros.map((p) => {
    const l = load[p.code] || { managed: 0, today: 0 };
    return {
      code: p.code, name: p.name, dan: p.dan || "광역(전국)", branch: p.branch || "본사(광역)",
      branchAddr: p.branchAddr || "", sido: p.sido || "", sgg: p.sgg || "",
      grade: p.grade, gradeKo: p.gradeKo, lic: !!p.lic, status: p.status, since: p.since,
      coverage: p.coverage || [], gap: !!p.gap, legacy: !!p.legacy,
      managed: l.managed, today: l.today, inSnap: !!load[p.code],
    };
  });
  const dans = {}, branches = {};
  list.forEach((p) => {
    const d = dans[p.dan] || (dans[p.dan] = { key: p.dan, pros: [], n: 0, active: 0, managed: 0, today: 0, branches: {} });
    d.pros.push(p); d.n++; if (p.status === "활성") d.active++; d.managed += p.managed; d.today += p.today;
    d.branches[p.branch] = 1;
    const bk = p.dan + "|" + p.branch;
    const b = branches[bk] || (branches[bk] = { key: bk, branch: p.branch, dan: p.dan, sido: p.sido, addr: p.branchAddr, pros: [], n: 0, active: 0, managed: 0, today: 0 });
    b.pros.push(p); b.n++; if (p.status === "활성") b.active++; b.managed += p.managed; b.today += p.today;
  });
  /* 실사 단위와 합성 버킷을 나눠 센다 — 실사는 지역단 16·지점 272이고, 나머지 「광역(전국)」·「본사(광역)」는
     구 명부를 보존하기 위한 버킷이다. 합쳐서 17·273으로만 적으면 조직표를 처음 보는 사람이 실사 숫자로 읽는다. */
  const SYN_DAN = "광역(전국)", SYN_BRANCH = "본사(광역)";
  const danKeys = Object.keys(dans), brKeys = Object.keys(branches);
  const hq = {
    n: list.length, active: list.filter((p) => p.status === "활성").length,
    edu: list.filter((p) => p.status === "교육중").length,
    off: list.filter((p) => p.status === "정지").length,
    managed: list.reduce((a, p) => a + p.managed, 0),
    today: list.reduce((a, p) => a + p.today, 0),
    dans: danKeys.length, branches: brKeys.length,
    dansReal: danKeys.filter((k) => k !== SYN_DAN).length,
    dansSyn: danKeys.filter((k) => k === SYN_DAN).length,
    branchesReal: brKeys.filter((k) => k.split("|")[1] !== SYN_BRANCH).length,
    branchesSyn: brKeys.filter((k) => k.split("|")[1] === SYN_BRANCH).length,
  };
  _HMO.org = { list, dans, branches, hq };
  return _HMO.org;
}
/* 선택 범위(scope) → 그 범위의 프로 배열 — 드릴다운·집계·표의 단일 기준 */
function hmoScopePros(scope) {
  const O = hmoOrgIndex();
  if (!scope || scope.level === "hq") return O.list;
  if (scope.level === "dan") return (O.dans[scope.dan] || { pros: [] }).pros;
  if (scope.level === "branch") return (O.branches[scope.dan + "|" + scope.branch] || { pros: [] }).pros;
  if (scope.level === "pro") return O.list.filter((p) => p.code === scope.code);
  return O.list;
}
function hmoScopeLabel(scope) {
  if (!scope || scope.level === "hq") return "본사 전체";
  if (scope.level === "dan") return scope.dan;
  if (scope.level === "branch") return scope.dan + " · " + scope.branch;
  const p = hmoOrgIndex().list.find((x) => x.code === scope.code);
  return p ? (p.branch + " · " + p.name + " 프로(" + p.code + ")") : scope.code;
}

/* 프로 1명 진행·실적 행 — 엔진 산출만 모은다(단계 분포·정체·락·신호 = hmcProView,
   전진·시한·터치 = hmcProStats, 결과 코드 = hmrStats). 첫 계산만 비싸고 이후 캐시. */
function hmoProRow(code) {
  if (_HMO.row[code]) return _HMO.row[code];
  const base = hmoOrgIndex().list.find((p) => p.code === code);
  if (!base) return null;
  let v = null, st = null;
  try { v = (typeof hmcProView === "function") ? hmcProView(code) : null; } catch (e) { v = null; }
  try { st = (typeof hmcProStats === "function") ? hmcProStats(code) : null; } catch (e) { st = null; }
  const byStage = {};
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  stages.forEach((s) => { byStage[s.k] = v ? ((v.byStage[s.k] || []).length) : 0; });
  /* 막힌 단계 = 정체 회원이 가장 많이 몰린 단계 + 그 단계 정체 인원/평균 체류일(cohortStageOf 원본) */
  const stallBy = {}; let daySum = 0, dayN = 0;
  if (v) v.stall.forEach((i) => {
    let s = null; try { s = (typeof cohortStageOf === "function") ? cohortStageOf(i) : null; } catch (e) {}
    if (!s) return;
    stallBy[s.cur] = (stallBy[s.cur] || 0) + 1;
    if (s.stalledDays) { daySum += s.stalledDays; dayN++; }
  });
  const blocked = Object.keys(stallBy).sort((a, b) => stallBy[b] - stallBy[a])[0] || null;
  const row = {
    code, name: base.name, branch: base.branch, dan: base.dan, sido: base.sido, sgg: base.sgg,
    grade: base.grade, gradeKo: base.gradeKo, status: base.status, lic: base.lic,
    managed: base.managed, today: base.today, inSnap: base.inSnap,
    n: v ? v.n : 0, byStage,
    held: v ? v.held.length : 0, ready: v ? v.ready.length : 0, signals: v ? v.signals.length : 0,
    stall: v ? v.stall.length : 0, riskHi: v ? v.riskHi.length : 0,
    blocked, blockedN: blocked ? stallBy[blocked] : 0,
    stallDays: dayN ? Math.round(daySum / dayN) : null,
    adv6: st ? st.adv6 : [], advTotal: st ? st.advTotal : 0, stallFixed: st ? st.stallFixed : 0,
    firstRate: st ? st.firstRate : null, expireRate: st ? st.expireRate : null, slaRate: st ? st.slaRate : null,
    touches: st ? st.touches : 0, stars: st ? st.stars : null, starsN: st ? st.starsN : 0,
  };
  _HMO.row[code] = row;
  return row;
}
/* 결과 기록(7코드) — 사번별 저장 키를 그대로 더한다(전수·즉시). 조직 필터가 가능한 유일한 경로.
   ⚠️ 캐시하지 않는다 — 프로가 방금 남긴 기록이 캐시에 가려 0으로 보이면 「집계는 원천과 일치」가 깨진다.
      비용은 사번당 저장 키 1회 읽기라 전원(702명)이어도 밀리초 단위다. */
function hmoResultAgg(codes) {
  const by = {}; let n = 0, followUps = 0, gRows = 0, gFull = 0;
  const RC = (typeof HM_RESULT_CODES !== "undefined") ? HM_RESULT_CODES : [];
  RC.forEach((c) => { by[c.k] = 0; });
  codes.forEach((c) => {
    let s = null; try { s = (typeof hmrStats === "function") ? hmrStats(c) : null; } catch (e) {}
    if (!s) return;
    n += s.n; followUps += s.followUps || 0;
    RC.forEach((x) => { by[x.k] += (s.by[x.k] || 0); });
    if (s.golden) { gRows += s.golden.rows || 0; gFull += s.golden.full || 0; }
  });
  const accepted = (by.R1 || 0) + (by.R7 || 0);
  const connected = accepted + (by.R2 || 0) + (by.R3 || 0);
  return { n, by, followUps, gRows, gFull,
    acceptRate: connected ? Math.round(accepted / connected * 100) : null,
    codes: RC.map((c) => ({ k: c.k, ko: c.ko, icon: c.icon, n: by[c.k] || 0 })) };
}
/* 여러 프로 행의 합·평균 — 평균은 「값이 있는 프로만」으로 낸다(0을 섞어 희석하지 않는다) */
function hmoSumRows(rows) {
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  const byStage = {}; stages.forEach((s) => { byStage[s.k] = 0; });
  const adv = {};
  let managed = 0, today = 0, n = 0, held = 0, ready = 0, signals = 0, stall = 0, riskHi = 0;
  let advTotal = 0, stallFixed = 0, touches = 0;
  let fr = 0, frN = 0, sl = 0, slN = 0, ex = 0, exN = 0, sd = 0, sdN = 0, sv = 0, svN = 0;
  rows.forEach((r) => {
    managed += r.managed; today += r.today; n += r.n;
    held += r.held; ready += r.ready; signals += r.signals; stall += r.stall; riskHi += r.riskHi;
    advTotal += r.advTotal; stallFixed += r.stallFixed; touches += r.touches;
    stages.forEach((s) => { byStage[s.k] += (r.byStage[s.k] || 0); });
    (r.adv6 || []).forEach((m) => { adv[m.ym] = (adv[m.ym] || 0) + m.n; });
    if (r.firstRate != null) { fr += r.firstRate; frN++; }
    if (r.slaRate != null) { sl += r.slaRate; slN++; }
    if (r.expireRate != null) { ex += r.expireRate; exN++; }
    if (r.stallDays != null) { sd += r.stallDays; sdN++; }
    if (r.stars != null) { sv += r.stars; svN++; }
  });
  const order = [];
  rows.forEach((r) => (r.adv6 || []).forEach((m) => { if (order.indexOf(m.ym) < 0) order.push(m.ym); }));
  return { pros: rows.length, managed, today, n, held, ready, signals, stall, riskHi, byStage,
    advTotal, stallFixed, touches,
    adv6: order.map((ym) => ({ ym, n: adv[ym] || 0 })),
    firstRate: frN ? Math.round(fr / frN) : null, slaRate: slN ? Math.round(sl / slN) : null,
    expireRate: exN ? Math.round(ex / exN) : null, stallDays: sdN ? Math.round(sd / sdN) : null,
    stars: svN ? Math.round(sv / svN * 10) / 10 : null };
}

/* ═══════════════════ 공통 조각 ═══════════════════ */
function HmoDef({ children }) { return <div className="hmodef">📐 <b>집계 정의</b> — {children}</div>; }
function HmoBox({ t, tag, tagC, children }) {
  return (<div className="hmocard"><div className="hmoct">{t}{tag ? <span className="hmopill" style={{ background: (tagC || {}).bg || "#EEF2F6", color: (tagC || {}).c || HMO_C.mut }}>{tag}</span> : null}</div>{children}</div>);
}
const HMO_TAG_DEMO = { bg: "#FEF3E2", c: "#B45309" };
const HMO_TAG_FULL = { bg: "#E7F8EE", c: "#15803D" };
const HMO_TAG_SAMP = { bg: "#EAF4FE", c: "#1D4ED8" };
function HmoBarRow({ label, n, max, color, right, on, onClick, sub }) {
  return (<div className={"hmorow" + (on ? " on" : "")} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
    <span style={{ width: 96, fontSize: 11.2, fontWeight: 800, color: on ? HMO_C.blue : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>
    <div className="hmobar"><i style={{ width: (max ? Math.max(1.5, n / max * 100) : 0) + "%", background: color || HMO_C.cyan }} /></div>
    <span style={{ width: 118, fontSize: 10.8, color: HMO_C.mut, textAlign: "right" }}>{right}</span>
    {sub ? <span style={{ fontSize: 10, color: "#94A3B8" }}>{sub}</span> : null}
  </div>);
}
/* 표 내보내기 — 화면 복사용 TSV. 파일 저장·외부 전송은 하지 않는다(관측 전용).
   ⚠️ 콘텐츠 보호(contentGuard)의 기본값이 noCopy라 화면 전체에서 copy 이벤트와 Ctrl+C가 막혀 있다.
      그대로 두면 이 버튼은 「선택은 되는데 클립보드에 아무것도 안 들어가는」 가짜 버튼이 된다(실측).
      그래서 contentGuard에 `textarea.hmoex` 한 곳만 예외를 두고, 복사하면 접속 로그에 export로 남긴다.
      표가 화면을 떠나도 고지가 따라가도록 TSV 첫 줄에 「[시연·합성 데이터] 범위 생성일」 주석 행을 넣는다. */
function HmoExport({ name, head, rows }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const tsv = ["# [시연·합성 데이터] " + name + " · 생성 " + new Date().toLocaleString("ko-KR", { hour12: false }) + " · 회원·프로 이름은 시연용 합성 데이터 — 외부 전달물에는 마스킹 규칙 적용"]
    .concat([head.join("\t")]).concat(rows.map((r) => r.join("\t"))).join("\n");
  return (<div style={{ marginTop: 8 }}>
    <button className="hmobtn" onClick={() => setOpen(!open)}><FileText size={12} style={{ verticalAlign: -2 }} /> 표 내보내기(화면 복사용) {open ? "▲" : "▼"}</button>
    {open && (<div style={{ marginTop: 6 }}>
      <textarea ref={ref} className="hmoex" readOnly value={tsv} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
        <button className="hmobtn pri" onClick={() => { try { ref.current.focus(); ref.current.select(); } catch (e) {} }}>전체 선택</button>
        <span className="hmonote" style={{ margin: 0 }}>{name} · {rows.length}행 · 탭 구분(엑셀에 그대로 붙여넣기) · 선택 후 Ctrl+C<br />
          🔒 콘텐츠 보호는 켜져 있고 <b>이 표 안에서만</b> 복사가 열려 있어요 — <b>복사 기록은 접속 로그(export)에 남습니다</b>. 첫 줄은 시연·합성 데이터 고지예요.</span>
      </div>
    </div>)}
  </div>);
}
/* 프로 행 점진 계산 — 한 틱에 5명씩. 큰 단위에서 화면이 멈추지 않게 하고 진행률을 보여준다.
   한 틱 2명이던 것을 5명으로 올렸다 — hmcProView에 세션 캐시가 생겨 중복 스캔(hmcProStats가 같은 view를
   다시 만들던 것)이 사라지면서 프로 1명당 비용이 절반이 됐다.
   그리고 중지를 만들었다: 전에는 「이 범위 전체」를 한 번 누르면 끝까지 되돌릴 방법이 없었다. */
function useHmoRows(codes, cap) {
  const key = codes.join(",") + "|" + cap;
  /* 프로 1~2명 범위(지점 일부·프로 단건)는 비용이 없으니 버튼 없이 바로 계산한다 */
  const auto = (cap === 0 ? codes.length : Math.min(codes.length, cap)) <= 2;
  const [st, setSt] = React.useState({ key, rows: [], run: auto });
  const take = React.useMemo(() => (cap === 0 ? codes : codes.slice(0, cap)), [key]);
  React.useEffect(() => { setSt({ key, rows: [], run: auto }); }, [key]);
  React.useEffect(() => {
    if (!st.run || st.key !== key || st.rows.length >= take.length) return;
    const id = setTimeout(() => setSt((s) => {
      if (s.key !== key || !s.run || s.rows.length >= take.length) return s;
      const add = take.slice(s.rows.length, s.rows.length + 5).map(hmoProRow).filter(Boolean);
      return { key: s.key, run: true, rows: s.rows.concat(add) };
    }), 0);
    return () => clearTimeout(id);
  }, [st, key, take]);
  const warm = take.filter((c) => _HMO.row[c]).length;
  return { rows: st.rows, total: take.length, all: codes.length, warm,
    running: st.run && st.rows.length < take.length, done: st.rows.length >= take.length && take.length > 0,
    start: () => setSt((s) => ({ key: s.key, rows: s.rows, run: true })),
    stop: () => setSt((s) => ({ key: s.key, rows: s.rows, run: false })) };
}
/* 예상 소요 — 아직 계산하지 않은 프로 수 × 1명당 약 27ms(캐시 적용 후 실측).
   「약 20초」라고 미리 알려 주는 일이 「시작하면 못 멈춘다」를 고치는 일보다 먼저다. */
function hmoEta(n) {
  const sec = Math.round(n * 0.027);
  if (sec < 2) return null;
  return sec < 60 ? "약 " + sec + "초" : "약 " + Math.round(sec / 60) + "분";
}
function HmoProgress({ R, label }) {
  if (R.done) return null;
  const left = Math.max(0, R.total - R.warm);
  const eta = hmoEta(left);
  if (!R.running) return (<div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
    <button className="hmobtn pri" onClick={R.start} disabled={!R.total}><Gauge size={12} style={{ verticalAlign: -2 }} /> {label || "집계 계산"}({R.total}명{eta ? " · " + eta : ""})</button>
    <span className="hmonote">프로 1명당 담당 회원 전건을 단계 판정해 집계해요 — 누른 범위만 계산하고 결과는 세션에 남습니다{R.warm ? ` (이미 계산해 둔 프로 ${R.warm}명)` : ""}{eta ? ` · 남은 ${left}명 ${eta} 걸려요(시작한 뒤에도 멈출 수 있어요).` : ""}</span>
  </div>);
  return (<div>
    <div className="hmobar" style={{ height: 10 }}><i style={{ width: (R.rows.length / Math.max(1, R.total) * 100) + "%", background: HMO_C.sky, height: 10 }} /></div>
    <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
      <span className="hmonote" style={{ margin: 0, flex: 1, minWidth: 180 }}>계산 중 {R.rows.length} / {R.total}명{hmoEta(Math.max(0, R.total - R.rows.length)) ? " · 남은 시간 " + hmoEta(Math.max(0, R.total - R.rows.length)) : ""} — 화면을 그대로 두셔도 되고, 지금까지 계산한 만큼으로 멈출 수도 있어요.</span>
      {typeof R.stop === "function" && <button className="hmobtn" onClick={R.stop}><X size={11} style={{ verticalAlign: -2 }} /> 집계 중지</button>}
    </div>
  </div>);
}

/* ═══════════════════ ① 조직 드릴다운 ═══════════════════ */
function HmoCrumb({ scope, onScope }) {
  const O = hmoOrgIndex();
  const steps = [{ t: "🏛 본사", s: { level: "hq" } }];
  if (scope.level !== "hq") steps.push({ t: scope.dan, s: { level: "dan", dan: scope.dan } });
  if (scope.level === "branch" || scope.level === "pro") steps.push({ t: scope.branch, s: { level: "branch", dan: scope.dan, branch: scope.branch } });
  if (scope.level === "pro") { const p = O.list.find((x) => x.code === scope.code); steps.push({ t: (p ? p.name + " 프로" : scope.code), s: scope }); }
  return (<div className="hmocrumb">
    <span style={{ fontSize: 10.6, fontWeight: 800, color: HMO_C.mut, marginRight: 2 }}>조직 경로</span>
    {steps.map((x, i) => (<React.Fragment key={i}>
      {i > 0 && <ChevronRight size={13} color="#94A3B8" />}
      <span className={"c" + (i === steps.length - 1 ? " on" : "")} onClick={() => { if (i < steps.length - 1) onScope(x.s); }} role="button" tabIndex={0}>{x.t}</span>
    </React.Fragment>))}
    {scope.level !== "hq" && (<button className="hmobtn" style={{ marginLeft: "auto" }} onClick={() => {
      if (scope.level === "pro") onScope({ level: "branch", dan: scope.dan, branch: scope.branch });
      else if (scope.level === "branch") onScope({ level: "dan", dan: scope.dan });
      else onScope({ level: "hq" });
    }}><ArrowLeft size={12} style={{ verticalAlign: -2 }} /> 한 단계 위로</button>)}
  </div>);
}
function HmoOrgDrill({ scope, onScope, metric }) {
  const O = hmoOrgIndex();
  const [q, setQ] = React.useState("");
  const mk = metric === "pros" ? "n" : metric === "today" ? "today" : "managed";
  const unit = metric === "pros" ? "명(프로)" : metric === "today" ? "건" : "명";
  /* 지역단 — 본사 레벨에서 16+광역 전원 */
  const dans = Object.values(O.dans).sort((a, b) => b[mk] - a[mk]);
  const maxD = Math.max(1, ...dans.map((d) => d[mk]));
  const danSel = scope.level !== "hq" ? scope.dan : null;
  const brs = danSel ? Object.values(O.branches).filter((b) => b.dan === danSel && (!q || b.branch.indexOf(q) >= 0)).sort((a, b) => b[mk] - a[mk]) : [];
  const maxB = Math.max(1, ...brs.map((b) => b[mk]));
  const brSel = (scope.level === "branch" || scope.level === "pro") ? scope.branch : null;
  const pros = brSel ? (O.branches[danSel + "|" + brSel] || { pros: [] }).pros.slice().sort((a, b) => b.managed - a.managed) : [];
  const maxP = Math.max(1, ...pros.map((p) => p.managed));
  return (<div>
    <HmoDef>인원 = hmProsGen() 귀속 프로 수(활성·교육중·정지 전원) · 담당 회원·오늘 카드 = 배치 스냅샷 HM_OPS_BRANCHES를 <b>사번으로 조인</b>해 합산. 지역단·지점 귀속은 스냅샷에 없어 항상 프로 명부(hmProsGen) 기준입니다.</HmoDef>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11.6, fontWeight: 900, marginBottom: 5 }}>2단 · 지역단 {O.hq.dansReal}개{O.hq.dansSyn ? " + 광역 " + O.hq.dansSyn : ""} <span style={{ fontWeight: 600, color: HMO_C.mut, fontSize: 10.4 }}>(누르면 지점이 열려요 · 「광역(전국)」은 실사 지역단이 아니라 구 명부 보존용 버킷)</span></div>
        <div style={{ maxHeight: 268, overflowY: "auto" }}>
          {dans.map((d) => (<HmoBarRow key={d.key} label={d.key} n={d[mk]} max={maxD} color={d.key === danSel ? HMO_C.blue : HMO_C.cyan}
            on={d.key === danSel} onClick={() => onScope(d.key === danSel ? { level: "hq" } : { level: "dan", dan: d.key })}
            right={`${d[mk].toLocaleString()}${unit} · 프로 ${d.n}(활성 ${d.active})`}
            sub={d.key === "광역(전국)" ? "실사 지역단 아님 — 구 명부 보존용" : ""} />))}
        </div>
      </div>
      <div>
        {!danSel ? <div className="hmonote" style={{ paddingTop: 22, textAlign: "center" }}>← 지역단을 먼저 고르세요.</div> : (<>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
            <div style={{ fontSize: 11.6, fontWeight: 900 }}>3단 · {danSel} 지점 {brs.length}곳</div>
            <input className="hmoin" value={q} onChange={(e) => setQ(e.target.value)} placeholder="지점 이름" style={{ flex: 1, minWidth: 70 }} />
          </div>
          <div style={{ maxHeight: 268, overflowY: "auto" }}>
            {brs.map((b) => (<HmoBarRow key={b.key} label={b.branch} n={b[mk]} max={maxB} color={b.branch === brSel ? HMO_C.blue : "#60A5FA"}
              on={b.branch === brSel} onClick={() => onScope(b.branch === brSel ? { level: "dan", dan: danSel } : { level: "branch", dan: danSel, branch: b.branch })}
              right={`${b[mk].toLocaleString()}${unit} · 프로 ${b.n}`}
              sub={b.branch === "본사(광역)" ? "실사 지점 아님 — 구 명부 보존용" : ""} />))}
            {!brs.length && <div className="hmonote">이름이 맞는 지점이 없어요.</div>}
          </div>
        </>)}
      </div>
      <div>
        {!brSel ? <div className="hmonote" style={{ paddingTop: 22, textAlign: "center" }}>← 지점을 고르면 소속 프로가 나와요.</div> : (<>
          <div style={{ fontSize: 11.6, fontWeight: 900, marginBottom: 5 }}>4단 · {brSel} 프로 {pros.length}명</div>
          <div style={{ maxHeight: 268, overflowY: "auto" }}>
            {pros.map((p) => (<HmoBarRow key={p.code} label={p.name + " " + p.code} n={p.managed} max={maxP} color={p.code === scope.code ? HMO_C.blue : "#A78BFA"}
              on={p.code === scope.code} onClick={() => onScope(p.code === scope.code ? { level: "branch", dan: danSel, branch: brSel } : { level: "pro", dan: p.dan, branch: p.branch, code: p.code })}
              right={`담당 ${p.managed.toLocaleString()}명 · 오늘 ${p.today}건`}
              sub={p.status !== "활성" ? p.status : (p.lic ? "" : "모집자격 없음")} />))}
          </div>
          {(O.branches[danSel + "|" + brSel] || {}).addr ? <div className="hmonote">지점 주소 {O.branches[danSel + "|" + brSel].addr} <span style={{ color: "#94A3B8" }}>(2026-07-31 지점찾기 실사값)</span></div> : null}
        </>)}
      </div>
    </div>
  </div>);
}

/* ═══════════════════ ② 조직 단위별 실적·통계 ═══════════════════ */
function HmoUnitStats({ scope, R, period }) {
  const S = hmoSumRows(R.rows);
  const codes = React.useMemo(() => hmoScopePros(scope).map((p) => p.code), [scope.level, scope.dan, scope.branch, scope.code]);
  const res = React.useMemo(() => hmoResultAgg(codes), [codes]);
  const base = hmoScopePros(scope);
  const snapManaged = base.reduce((a, p) => a + p.managed, 0);
  const snapToday = base.reduce((a, p) => a + p.today, 0);
  const adv = (S.adv6 || []).slice(period === 3 ? -3 : -6);
  const advSum = adv.reduce((a, m) => a + m.n, 0);
  const maxAdv = Math.max(1, ...adv.map((m) => m.n));
  const maxRes = Math.max(1, ...res.codes.map((c) => c.n));
  const partial = R.rows.length < R.all;
  return (<div>
    <div className="hmogrid">
      <HmoBox t={<><Users size={14} color={HMO_C.cyan} /> 담당·배분 <span style={{ fontWeight: 600, color: HMO_C.mut, fontSize: 10.6 }}>{hmoScopeLabel(scope)}</span></>} tag="전수" tagC={HMO_TAG_FULL}>
        <HmoDef>배치 스냅샷({(typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT.date : "-"})의 사번별 담당 회원 수(managed)·오늘 지시서 건수(today)를 이 단위 소속 프로 전원에 대해 더한 값입니다. 화면이 따로 계산하지 않습니다.</HmoDef>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.2 }}>
          {[["담당 회원", snapManaged.toLocaleString() + "명"], ["오늘 지시서", snapToday.toLocaleString() + "건"],
            ["소속 프로", base.length + "명"], ["활성", base.filter((p) => p.status === "활성").length + "명"],
            ["프로당 담당", base.length ? Math.round(snapManaged / base.length).toLocaleString() + "명" : "-"]].map(([k, v], i) => (
            <div key={i}><b style={{ fontSize: 15.5, color: HMO_C.navy, fontVariantNumeric: "tabular-nums" }}>{v}</b><div style={{ fontSize: 10.4, color: HMO_C.mut }}>{k}</div></div>))}
        </div>
        {base.some((p) => !p.inSnap) ? <div className="hmonote">스냅샷에 담당 배정이 없는 프로 {base.filter((p) => !p.inSnap).length}명(교육중·정지 등)은 담당 0명으로 집계돼요 — 인원에서 빼지 않습니다.</div> : null}
      </HmoBox>

      <HmoBox t={<><Target size={14} color={HMO_C.warn} /> 접촉 상태 — 지금 어디에 몰려 있나</>} tag={partial ? "표본" : "계산 범위 전수"} tagC={partial ? HMO_TAG_SAMP : HMO_TAG_FULL}>
        <HmoDef>계산한 프로 {R.rows.length}명의 담당 회원 {S.n.toLocaleString()}명을 단계 판정(cohortStageOf)해 센 값입니다. 접촉 락 = D1 검진결과 수령 전(연락 금지) · 정체 = 같은 단계 30~90일 체류 · 신호 = 하이 신호 도래.</HmoDef>
        {R.rows.length ? (<div style={{ fontSize: 12.2, lineHeight: 2 }}>
          접촉 락(연락 금지) <b style={{ color: "#64748B" }}>{S.held.toLocaleString()}명</b> · 첫 연결 대기 <b style={{ color: HMO_C.cyan }}>{S.ready.toLocaleString()}명</b><br />
          하이 신호 도래 <b style={{ color: HMO_C.blue }}>{S.signals.toLocaleString()}명</b> · 고위험 관리 <b style={{ color: HMO_C.red }}>{S.riskHi.toLocaleString()}명</b><br />
          정체 <b style={{ color: HMO_C.stall }}>{S.stall.toLocaleString()}명</b>({S.n ? Math.round(S.stall / S.n * 100) : 0}%) · 평균 체류 {S.stallDays != null ? S.stallDays + "일" : "-"}
        </div>) : <HmoProgress R={R} label="접촉 상태 계산" />}
      </HmoBox>

      <HmoBox t={<><Clock size={14} color={HMO_C.blue} /> 응답 시한·터치 수행 <span style={{ fontWeight: 600, fontSize: 10.6, color: HMO_C.mut }}>최근 {period}개월</span></>} tag="시연 분포" tagC={HMO_TAG_DEMO}>
        <HmoDef>hmcProStats의 프로별 지표 평균 — 시한 준수율(slaRate)·첫 연결 수행률(firstRate)·만기 터치 수행률(expireRate)은 담당 규모와 등급에서 파생한 <b>시연 분포</b>입니다(실기록 아님). 평균은 값이 있는 프로만으로 냅니다.</HmoDef>
        {R.rows.length ? (<div>
          {[["응답 시한 준수", S.slaRate, HMO_C.ok], ["첫 연결 수행", S.firstRate, HMO_C.cyan], ["만기 터치 수행", S.expireRate, HMO_C.warn]].map(([k, v, c], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <span style={{ width: 92, fontSize: 11.2, fontWeight: 700, color: "#475569" }}>{k}</span>
              <div className="hmobar"><i style={{ width: (v || 0) + "%", background: c }} /></div>
              <b style={{ width: 40, textAlign: "right", fontSize: 11.8 }}>{v != null ? v + "%" : "-"}</b></div>))}
          <div style={{ fontSize: 12, color: "#475569", marginTop: 5, lineHeight: 1.85 }}>
            접촉 시도 누계 <b>{S.touches.toLocaleString()}회</b> · 정체 해소 <b>{S.stallFixed.toLocaleString()}명</b>
            {S.stars != null && <> · 회원 평가 <b>★{S.stars}</b></>}
          </div>
        </div>) : <HmoProgress R={R} label="수행 지표 계산" />}
      </HmoBox>

      <HmoBox t={<><TrendingUp size={14} color={HMO_C.ok} /> 월별 단계 전진 추이</>} tag="시연 분포" tagC={HMO_TAG_DEMO}>
        <HmoDef>단계 전진 건수 = 회원이 D1→L8 중 다음 단계로 넘어간 건수(hmcProStats.adv6 월별 합). 기준월 2026-08 고정(재현 가능한 시연 시드) · 금액·수수료·순위는 집계하지 않습니다.</HmoDef>
        {R.rows.length ? (<div>
          <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 62 }}>
            {adv.map((m) => (<div key={m.ym} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: Math.round(m.n / maxAdv * 42) + 3, background: HMO_C.cyan, borderRadius: 4 }} />
              <div style={{ fontSize: 9.6, color: "#475569", marginTop: 3 }}>{m.ym}</div>
              <div style={{ fontSize: 9.6, color: "#94A3B8" }}>{m.n.toLocaleString()}</div>
            </div>))}
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{period}개월 합 <b>{advSum.toLocaleString()}건</b> · 담당 {S.n.toLocaleString()}명 대비 전진율 <b>{S.n ? Math.round(advSum / S.n * 100) : 0}%</b></div>
        </div>) : <HmoProgress R={R} label="전진 추이 계산" />}
      </HmoBox>

      <HmoBox t={<><FileText size={14} color="#7C3AED" /> 활동 결과 7코드 — 지시가 어떻게 끝났나</>} tag="실기록" tagC={HMO_TAG_FULL}>
        <HmoDef>프로가 「결과 남기기」로 직접 남긴 기록만 셉니다 — 저장 키 hifin_handoff_result_&#123;사번&#125;을 이 단위 프로 {codes.length}명분 전수 합산. 기록이 없으면 0으로 두고 추정하지 않습니다.</HmoDef>
        {res.n ? (<div>
          {res.codes.map((c) => (<div key={c.k} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ width: 86, fontSize: 10.8, fontWeight: 700, color: "#475569" }}>{c.icon} {c.ko}</span>
            <div className="hmobar" style={{ height: 8 }}><i style={{ width: (c.n / maxRes * 100) + "%", background: HMO_C.navy, height: 8 }} /></div>
            <b style={{ width: 28, textAlign: "right", fontSize: 11.4 }}>{c.n}</b></div>))}
          <div style={{ fontSize: 11.8, color: "#475569", marginTop: 5, lineHeight: 1.8 }}>
            기록 <b>{res.n}건</b> · 수락률 {res.acceptRate != null ? res.acceptRate + "%" : "-"} · 후속 약속 {res.followUps}건<br />
            ⭐ D2 골든타임 전달 체크 {res.gRows}건 중 5칸 완주 <b>{res.gFull}건</b>{res.gRows ? `(${Math.round(res.gFull / res.gRows * 100)}%)` : ""}
          </div>
        </div>) : <div className="hmonote">이 단위에서 아직 기록된 결과가 없어요 — 프로가 통화 후 「결과 남기기」를 누르면 여기 쌓입니다(가공·추정 없음).</div>}
      </HmoBox>
    </div>
  </div>);
}

/* ═══════════════════ ③ D1~L8 단계별 관리 현황 ═══════════════════ */
function HmoStageDist({ byStage, total, label, tag, tagC, sel, onSel }) {
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  const max = Math.max(1, ...stages.map((s) => byStage[s.k] || 0));
  return (<div>
    <div className="hmostagegrid">
      {stages.map((s) => { const n = byStage[s.k] || 0; const c = HMO_STAGE_C[s.k]; return (
        <div key={s.k} className={"hmostage" + (sel === s.k ? " on" : "") + (onSel ? "" : " dead")}
          title={onSel ? ((sel === s.k ? "다시 누르면 닫혀요 — " : "누르면 ") + s.k + " " + n.toLocaleString() + "명 현황이 열려요") : (s.k + " " + s.name + " — 이 분포 상자는 숫자만 보여줘요")}
          onClick={() => onSel && onSel(sel === s.k ? null : s.k)} role={onSel ? "button" : undefined} tabIndex={onSel ? 0 : undefined}>
          <b style={{ color: c }}>{s.k}</b><span>{s.name}</span>
          <em>{n.toLocaleString()}명</em>
          <div className="hmobar" style={{ height: 5, marginTop: 4 }}><i style={{ width: (n / max * 100) + "%", background: c, height: 5 }} /></div>
          <span style={{ fontSize: 9, color: "#A3AFC0" }}>{total ? (n / total * 100).toFixed(1) + "%" : "-"}</span>
        </div>); })}
    </div>
    <div className="hmonote">{label}{tag ? <span className="hmopill" style={{ background: (tagC || {}).bg, color: (tagC || {}).c, marginLeft: 6 }}>{tag}</span> : null}</div>
  </div>);
}
/* 프로 개별 진행표 — 프로마다 D1~L8에 몇 명 있고 어디서 막혀 있나(정렬·필터) */
const HMO_COLS = [
  ["name", "프로", "l"], ["branch", "지점", "l"], ["managed", "담당", ""], ["today", "오늘", ""],
  ["D1", "D1", ""], ["D2", "D2", ""], ["D3", "D3", ""], ["D4", "D4", ""],
  ["L5", "L5", ""], ["L6", "L6", ""], ["L7", "L7", ""], ["L8", "L8", ""],
  ["held", "락", ""], ["stall", "정체", ""], ["stallDays", "체류일", ""], ["blocked", "막힌 단계", "l"],
  ["advTotal", "6개월 전진", ""], ["slaRate", "시한%", ""],
];
function HmoProTable({ R, scope, onPick }) {
  const [sort, setSort] = React.useState({ k: "managed", dir: -1 });
  const [fs, setFs] = React.useState("");          /* 상태 필터 */
  const [fq, setFq] = React.useState("");          /* 지점·이름 검색 */
  const val = (r, k) => (r.byStage && r.byStage[k] != null ? r.byStage[k] : r[k]);
  let rows = R.rows.filter((r) => (!fs || r.status === fs) && (!fq || (r.branch + r.name + r.code + r.dan).indexOf(fq) >= 0));
  /* dir: 1 = 오름차순, -1 = 내림차순. 숫자는 (x−y)×dir, 문자는 사전순×dir — 빈 값은 맨 뒤로 */
  rows = rows.slice().sort((a, b) => {
    const x = val(a, sort.k), y = val(b, sort.k);
    if (typeof x === "string" || typeof y === "string") return String(x == null ? "" : x).localeCompare(String(y == null ? "" : y)) * sort.dir;
    return ((x == null ? -1 : x) - (y == null ? -1 : y)) * sort.dir;
  });
  const th = (k, t, cls) => (<th key={k} className={(cls || "") + (sort.k === k ? " on" : "")}
    onClick={() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : -1 }))}>{t}{sort.k === k ? (sort.dir < 0 ? " ▼" : " ▲") : ""}</th>);
  const exHead = HMO_COLS.map((c) => c[1]).concat(["사번", "지역단", "상태"]);
  const exRows = rows.map((r) => HMO_COLS.map((c) => { const v = val(r, c[0]); return v == null ? "" : String(v); }).concat([r.code, r.dan, r.status]));
  return (<div>
    <HmoDef>한 행 = 프로 1명. D1~L8 숫자는 그 프로의 담당 회원을 단계 판정해 센 인원 · 락 = 검진결과 수령 전(연락 금지) · 정체 = 같은 단계 30~90일 체류 · <b>막힌 단계 = 정체 회원이 가장 많이 몰린 단계</b>(괄호는 그 단계 정체 인원) · 체류일 = 정체 회원의 평균 체류일 · 6개월 전진·시한%는 hmcProStats 시연 분포.</HmoDef>
    {!R.done && <div style={{ marginBottom: 8 }}><HmoProgress R={R} label="프로 개별 진행표 계산" /></div>}
    {R.rows.length > 0 && (<>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        <input className="hmoin" value={fq} onChange={(e) => setFq(e.target.value)} placeholder="지점·이름·사번 검색" style={{ width: 160 }} />
        <select className="hmoin" value={fs} onChange={(e) => setFs(e.target.value)}>
          <option value="">상태 전체</option><option value="활성">활성</option><option value="교육중">교육중</option><option value="정지">정지</option>
        </select>
        <span className="hmonote" style={{ margin: 0 }}>{rows.length}명 표시 / 계산 {R.rows.length}명 {R.all > R.total ? `(이 범위 전체 ${R.all}명)` : ""} · 머리글을 누르면 정렬 · 행을 누르면 그 프로의 단계별 명단</span>
      </div>
      <div style={{ maxHeight: 420, overflow: "auto" }}>
        <table className="hmotbl"><thead><tr>{HMO_COLS.map((c) => th(c[0], c[1], c[2]))}</tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.code} onClick={() => onPick(r)}>
            <td className="l"><b>{r.name}</b> <span style={{ color: "#94A3B8", fontSize: 10.2 }}>{r.code}</span>{r.status !== "활성" ? <span className="hmopill" style={{ background: "#FEF2F2", color: HMO_C.red, marginLeft: 4 }}>{r.status}</span> : null}</td>
            <td className="l" style={{ color: "#475569" }}>{r.branch}</td>
            <td><b>{r.managed.toLocaleString()}</b></td><td>{r.today}</td>
            {["D1", "D2", "D3", "D4", "L5", "L6", "L7", "L8"].map((k) => (<td key={k} style={{ color: (r.byStage[k] || 0) ? HMO_STAGE_C[k] : "#CBD5E1", fontWeight: (r.byStage[k] || 0) ? 700 : 400 }}>{r.byStage[k] || 0}</td>))}
            <td style={{ color: "#64748B" }}>{r.held}</td>
            <td style={{ color: r.stall ? HMO_C.stall : "#CBD5E1", fontWeight: r.stall ? 800 : 400 }}>{r.stall}</td>
            <td>{r.stallDays != null ? r.stallDays : "-"}</td>
            <td className="l">{r.blocked ? <span className="hmopill" style={{ background: "#FFF4E8", color: "#C2410C" }}>{r.blocked} ({r.blockedN})</span> : <span style={{ color: "#CBD5E1" }}>없음</span>}</td>
            <td>{r.advTotal.toLocaleString()}</td><td>{r.slaRate != null ? r.slaRate + "%" : "-"}</td>
          </tr>))}</tbody></table>
      </div>
      <HmoExport name={"프로 개별 진행표 · " + hmoScopeLabel(scope)} head={exHead} rows={exRows} />
    </>)}
  </div>);
}
/* 프로 1명의 단계별 명단 — 관측 전용(연결·발송 버튼 없음). 관리자 콘솔이라 성명 전체 표기. */
function HmoProStageList({ row, onClose, initStage }) {
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  const [sel, setSel] = React.useState(initStage || null);
  const [page, setPage] = React.useState(1);
  React.useEffect(() => { setPage(1); }, [sel]);
  /* 분포 칩에서 단계를 고르고 프로를 누르면, 그 프로의 그 단계 명단이 바로 열린 상태로 들어온다 */
  React.useEffect(() => { if (initStage) setSel(initStage); }, [initStage, row.code]);
  const view = React.useMemo(() => { try { return hmcProView(row.code); } catch (e) { return null; } }, [row.code]);
  const ids = (sel && view) ? (view.byStage[sel] || []) : [];
  const PER = 20;
  const pages = Math.max(1, Math.ceil(ids.length / PER));
  const page2 = Math.min(page, pages);
  const show = ids.slice((page2 - 1) * PER, page2 * PER);
  const cards = React.useMemo(() => show.map((i) => { try { return cohortCardOf(i); } catch (e) { return null; } }).filter(Boolean), [sel, page2, row.code]);
  /* 내보내기용 전건 행은 단계를 고를 때 한 번만 조립한다(매 렌더 재조립 금지 — 단계 인원이 수백 명일 수 있다) */
  const exRows = React.useMemo(() => ids.map((i) => {
    let c = null; try { c = cohortCardOf(i); } catch (e) {}
    return c ? [c.m.name, c.band, c.sex, c.region ? c.region.sido : "", c.region ? c.region.sgg : "", c.status.ko, c.stage.stalled ? String(c.stage.stalledDays) : "0", c.hb ? c.hb.grade : "", c.hb ? c.hb.band : ""] : [];
  }).filter((r) => r.length), [sel, row.code]);
  const stg = stages.find((s) => s.k === sel);
  return (<div className="hmocard" style={{ borderColor: HMO_C.sky, boxShadow: "0 8px 22px -14px rgba(11,34,57,.5)" }}>
    <div className="hmoct">
      <Users size={14} color={HMO_C.blue} /> {row.name} 프로({row.code}) · {row.branch} — 단계별 명단
      <span className="hmopill" style={{ background: "#EEF2F6", color: HMO_C.mut }}>담당 {row.n.toLocaleString()}명</span>
      <button className="hmobtn" style={{ marginLeft: "auto" }} onClick={onClose}><X size={12} style={{ verticalAlign: -2 }} /> 닫기 · 표로 돌아가기</button>
    </div>
    <HmoDef>단계를 누르면 그 단계에 머무는 회원 명단이 열립니다(cview.byStage · 20명씩). 이 화면은 <b>관측 전용</b>이라 연결·발송 버튼이 없어요 — 접촉은 담당 프로의 콘솔에서만 일어납니다.</HmoDef>
    <HmoStageDist byStage={(() => { const o = {}; stages.forEach((s) => { o[s.k] = row.byStage[s.k] || 0; }); return o; })()}
      total={row.n} sel={sel} onSel={setSel}
      label={`담당 회원 ${row.n.toLocaleString()}명 전건 단계 판정 — 단계 칩을 누르면 명단이 열리고, 같은 칩을 다시 누르면 닫혀요.`} tag="전수" tagC={HMO_TAG_FULL} />
    {sel && (<div style={{ marginTop: 10, borderTop: "1px dashed " + HMO_C.line, paddingTop: 9 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 7 }}>
        <b style={{ fontSize: 12.6, color: HMO_C.navy }}>{sel} {stg ? stg.name : ""} — {ids.length.toLocaleString()}명</b>
        {stg ? <span className="hmonote" style={{ margin: 0 }}>{stg.desc}</span> : null}
        <button className="hmobtn" style={{ marginLeft: "auto" }} onClick={() => setSel(null)}><X size={11} style={{ verticalAlign: -2 }} /> 명단 닫기</button>
      </div>
      {!ids.length ? <div className="hmonote">이 단계에 있는 회원이 없어요 — 0명도 사실이라 그대로 표기합니다.</div> : (<>
        {cards.map((c) => (<div key={c.i} className="hmomem">
          <span className="nm">{c.m.name}</span>
          <span style={{ fontSize: 11, color: HMO_C.mut, whiteSpace: "nowrap" }}>{c.band} · {c.sex} · {c.region ? c.region.sido + " " + c.region.sgg : "-"}</span>
          <span className="hmopill" style={{ background: c.status.bg, color: c.status.c }}>{c.status.ko}</span>
          {c.stage.stalled ? <span className="hmopill" style={{ background: "#FFF4E8", color: "#C2410C" }}>{c.stage.stalledDays}일 정체</span> : null}
          <span style={{ fontSize: 11, color: "#475569" }}>건강 {c.hb ? c.hb.grade + " · 위험밴드 " + c.hb.band : "-"}</span>
          <span style={{ fontSize: 11, color: HMO_C.mut, flex: 1, minWidth: 140 }}>{c.hi}</span>
        </div>))}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
          <button className="hmobtn" disabled={page2 <= 1} onClick={() => setPage(page2 - 1)}>◀ 이전</button>
          <span className="hmonote" style={{ margin: 0 }}>{page2} / {pages} 쪽 · 총 {ids.length.toLocaleString()}명</span>
          <button className="hmobtn" disabled={page2 >= pages} onClick={() => setPage(page2 + 1)}>다음 ▶</button>
        </div>
        <HmoExport name={row.name + " 프로 · " + sel + " 단계 명단"} head={["이름", "연령대", "성별", "시도", "시군구", "관리상태", "정체일", "건강등급", "위험밴드"]} rows={exRows} />
      </>)}
    </div>)}
  </div>);
}
function HmoStageBoard({ scope, R, picked, onPick }) {
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  const S = hmoSumRows(R.rows);
  const nation = React.useMemo(() => { try { return (typeof hmNationStats === "function") ? hmNationStats() : []; } catch (e) { return []; } }, []);
  const hq = scope.level === "hq";
  const nByStage = {}; nation.forEach((x) => { nByStage[x.k] = x.n; });
  const advRate = S.n ? Math.round(S.advTotal / S.n * 100) : 0;
  /* 분포 칩에서 고른 단계 — 「누르면 인원 현황」(형 지시 ②)을 관리자 화면에서도 성립시킨다.
     이 상자의 숫자는 조직 단위 합계라 그 자리에 명단이 없다. 그래서 고른 단계에
     인원이 많은 프로를 내려 보여 주고, 프로를 누르면 그 프로의 그 단계 명단이 열린 상태로 들어간다.
     계산한 프로가 없으면(아직 집계 전) 칩에 동작을 주지 않고, 손가락 커서도 쓰지 않는다. */
  const [dsel, setDsel] = React.useState(null);
  const live = R.rows.length > 0;
  React.useEffect(() => { setDsel(null); }, [scope.level, scope.dan, scope.branch, scope.code]);
  const top = React.useMemo(() => {
    if (!dsel) return [];
    return R.rows.filter((r) => (r.byStage[dsel] || 0) > 0)
      .slice().sort((a, b) => (b.byStage[dsel] || 0) - (a.byStage[dsel] || 0)).slice(0, 12);
  }, [dsel, R.rows.length]);
  const dstg = dsel ? stages.find((x) => x.k === dsel) : null;
  const maxTop = Math.max(1, ...top.map((r) => r.byStage[dsel] || 0));
  return (<div>
    <HmoBox t={<><Network size={14} color={HMO_C.cyan} /> 단계별 인원 분포 — {hmoScopeLabel(scope)}</>}>
      {hq && !live ? (<>
        <HmoStageDist byStage={nByStage} total={nation.reduce((a, x) => a + x.n, 0)}
          label="전국 코호트 10만명 — HM_FUNNEL 비율 × 모집단 수식(finModel 정합, 루프 없이 전수). 이 상자는 수식 분포라 명단이 없어요 — 아래에서 집계를 누르면 칩이 눌리고 단계별 명단까지 이어져요." tag="전수(수식)" tagC={HMO_TAG_FULL} />
        <div style={{ marginTop: 9 }}><HmoProgress R={R} label="본사 소속 프로 단계 분포 계산" /></div>
      </>) : live ? (<>
        <HmoStageDist byStage={S.byStage} total={S.n} sel={dsel} onSel={setDsel}
          label={`계산한 프로 ${R.rows.length}명 / 이 범위 ${R.all}명의 담당 회원 ${S.n.toLocaleString()}명 전건 단계 판정 — 칩을 누르면 그 단계 인원이 많은 프로가 아래에 열리고, 프로를 누르면 그 단계 명단이 열려요(같은 칩을 다시 누르면 닫힘).`}
          tag={R.rows.length < R.all ? `표본 ${R.rows.length}/${R.all}명` : "범위 전수"} tagC={R.rows.length < R.all ? HMO_TAG_SAMP : HMO_TAG_FULL} />
        {dsel && (<div style={{ marginTop: 9, borderTop: "1px dashed " + HMO_C.line, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
            <b style={{ fontSize: 12.4, color: HMO_C.navy }}>{dsel} {dstg ? dstg.name : ""} — {(S.byStage[dsel] || 0).toLocaleString()}명이 몰린 프로 상위 {top.length}명</b>
            <span className="hmonote" style={{ margin: 0 }}>프로를 누르면 아래에 그 프로의 {dsel} 명단이 열려요</span>
            <button className="hmobtn" style={{ marginLeft: "auto" }} onClick={() => setDsel(null)}><X size={11} style={{ verticalAlign: -2 }} /> 닫기</button>
          </div>
          {top.length ? top.map((r) => (<HmoBarRow key={r.code} label={r.name + " " + r.code} n={r.byStage[dsel] || 0} max={maxTop}
            color={picked && picked.code === r.code ? HMO_C.blue : HMO_STAGE_C[dsel]} on={!!(picked && picked.code === r.code)}
            onClick={() => onPick(r)} right={`${dsel} ${(r.byStage[dsel] || 0).toLocaleString()}명 / 담당 ${r.n.toLocaleString()}명`} sub={r.branch} />))
            : <div className="hmonote">계산한 프로 중 이 단계에 회원이 있는 사람이 없어요 — 0명도 사실이라 그대로 적습니다.</div>}
        </div>)}
      </>) : <HmoProgress R={R} label="단계 분포 계산" />}
    </HmoBox>

    {/* 원칙 ④ — 전수와 표본을 섞어 적지 않는다. 같은 상자에 「시연 분포」와 「실판정」을 넣고
        배지를 하나만 달면, 발표 중에는 초록 배지와 큰 숫자만 눈에 들어온다. 그래서 둘로 쪼갰다. */}
    <div className="hmogrid">
      <HmoBox t={<><TrendingUp size={14} color={HMO_C.ok} /> 단계 전진·정체 해소</>} tag="시연 분포" tagC={HMO_TAG_DEMO}>
        <HmoDef>전진율 = 6개월 단계 전진 건수 ÷ 담당 회원 · 전진 건수·정체 해소는 모두 hmcProStats 파생값으로 담당 규모·등급에서 만든 <b>시연 분포</b>입니다(실기록 아님). 계산 범위 = 프로 {R.rows.length}명.</HmoDef>
        {live ? (<div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.2 }}>
          {[["단계 전진율(6개월)", advRate + "%", HMO_C.ok], ["전진 건수", S.advTotal.toLocaleString() + "건", HMO_C.cyan],
            ["정체 해소", S.stallFixed.toLocaleString() + "명", HMO_C.ok]].map(([k, v, c], i) => (
            <div key={i}><b style={{ fontSize: 16, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</b><div style={{ fontSize: 10.4, color: HMO_C.mut }}>{k} <span className="hmopill" style={{ background: HMO_TAG_DEMO.bg, color: HMO_TAG_DEMO.c }}>시연</span></div></div>))}
        </div>) : <div className="hmonote">위 블록에서 계산을 먼저 눌러 주세요.</div>}
      </HmoBox>
      <HmoBox t={<><Gauge size={14} color={HMO_C.warn} /> 체류·정체·접촉 락</>} tag={R.rows.length < R.all ? `표본 ${R.rows.length}/${R.all}명` : "계산 범위 전수(실판정)"} tagC={R.rows.length < R.all ? HMO_TAG_SAMP : HMO_TAG_FULL}>
        <HmoDef>평균 체류일 = 정체 회원의 체류일 평균(cohortStageOf.stalledDays) · 정체 비율 = 정체 회원 ÷ 담당 회원 · 접촉 락 = D1 검진결과 수령 전 — 셋 다 담당 회원 전건을 <b>단계 판정해 센 실판정값</b>입니다(추정 없음).</HmoDef>
        {live ? (<div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.2 }}>
          {[["평균 체류일(정체)", (S.stallDays != null ? S.stallDays + "일" : "-"), HMO_C.warn],
            ["정체 비율", (S.n ? Math.round(S.stall / S.n * 100) : 0) + "%", HMO_C.stall],
            ["정체 인원", S.stall.toLocaleString() + "명", HMO_C.stall],
            ["접촉 락", S.held.toLocaleString() + "명", "#64748B"]].map(([k, v, c], i) => (
            <div key={i}><b style={{ fontSize: 16, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</b><div style={{ fontSize: 10.4, color: HMO_C.mut }}>{k}</div></div>))}
        </div>) : <div className="hmonote">위 블록에서 계산을 먼저 눌러 주세요.</div>}
        {stages.length ? <div className="hmonote">정체가 가장 많이 쌓이는 구간은 D3(분석 데이터)입니다 — 단계 판정 규칙상 D3는 22%, 그 밖은 15%가 30~90일 정체로 들어갑니다(cohortStageOf).</div> : null}
      </HmoBox>
    </div>

    {picked ? <HmoProStageList row={picked} onClose={() => onPick(null)} initStage={dsel} /> : null}

    <HmoBox t={<><Users size={14} color="#7C3AED" /> 프로 개별 관리 진행사항 — D1~L8 진행표</>}>
      <HmoProTable R={R} scope={scope} onPick={onPick} />
    </HmoBox>
  </div>);
}

/* ═══════════════════ ④ 배치·배분 관제(기존 ⑩ 재구성) ═══════════════════ */
function HmoBatchOps() {
  const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const H = (typeof HM_HARNESS_SNAPSHOT !== "undefined") ? HM_HARNESS_SNAPSHOT : null;
  const W = (typeof HM_WEEKLY_SNAPSHOT !== "undefined") ? HM_WEEKLY_SNAPSHOT : null;
  const ev = React.useMemo(() => { try { return (typeof hiEventStats === "function") ? hiEventStats() : null; } catch (e) { return null; } }, []);
  if (!S || !S.total) return <div className="hmocard">배치 스냅샷이 아직 없어요 — scripts/run_handoff_batch.mjs를 돌리면 이 블록이 채워집니다(화면이 대신 추정하지 않습니다).</div>;
  const GU = { H: { ko: "H 고위험", c: "#EA580C", bg: "#FFF1E2" }, M: { ko: "M 중위험", c: "#D97706", bg: "#FEF7E0" }, L: { ko: "L 관심", c: "#0891B2", bg: "#E0F5FA" } };
  const load = (S.loadBySido || []).slice().sort((a, b) => b.perPro - a.perPro);
  const maxPer = Math.max(1, ...load.map((x) => x.perPro));
  return (<div className="hmogrid">
    <HmoBox t={<><Database size={14} color={HMO_C.cyan} /> 배치 상태 — 발행을 막는 구조</>} tag={S.pass ? "통과" : "차단"} tagC={S.pass ? HMO_TAG_FULL : { bg: "#FDECEC", c: HMO_C.red }}>
      <HmoDef>하나의 원천만 봅니다 — 배치 스냅샷({S.date}, 러너 {S.seconds}s). 관제 숫자 = 배치 리포트 숫자(운영 정합). 하나라도 실패하면 그날 지시서는 발행되지 않습니다.</HmoDef>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
        <span className="hmopill" style={{ background: S.pass ? "#E7F8EE" : "#FDECEC", color: S.pass ? HMO_C.ok : HMO_C.red }}>배치 {S.pass ? "통과 ✓" : "차단 ✗"}</span>
        {H && <span className="hmopill" style={{ background: H.pass ? "#E7F8EE" : "#FDECEC", color: H.pass ? HMO_C.ok : HMO_C.red }}>대본 하네스 {H.pass ? "통과 ✓" : "실패 ✗"}</span>}
        {H && <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>금지어 {H.forbiddenHits}건 · 골든셋 드리프트 {H.goldenDrift}건</span>}
        {H && <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>A5 회귀 {H.coachAcc}%</span>}
      </div>
      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.95 }}>
        카드 정의 <b>{S.cards.toLocaleString()}건</b> · 발행 가능 <b>{S.publishable === S.cards ? "100%" : S.publishable.toLocaleString()}</b> · 접촉 락 <b>{S.locked.toLocaleString()}명</b><br />
        전원 조립 검사 {S.rosterChecked}명 — 위반 <b style={{ color: S.rosterViol ? HMO_C.red : HMO_C.ok }}>{S.rosterViol}건</b> · 일일 지시서 평균 {S.avgRoster}건(상한 {S.maxRoster})
      </div>
      {W && W.week ? <div className="hmonote">📚 주간 학습 루프({W.week}) — 과다 사용 {W.monotony.length}블록 · 미사용 승인 {W.unused.length}블록 · 개선 후보 {W.candidates.length}건. 문안 반영은 대표 검수 경유만(자동 반영 없음).</div> : null}
    </HmoBox>

    <HmoBox t={<><AlertTriangle size={14} color={HMO_C.stall} /> 위험 분포 · 응답 시한 티어</>} tag="전수" tagC={HMO_TAG_FULL}>
      <HmoDef>카드 대상 {S.cards.toLocaleString()}건을 등급(H/M/L)으로 나눈 분포. 등급은 시한 티어로 이어집니다(H 48시간 · M 7일 · L 14일, 미응답은 D+7 재큐). E(응급)는 트리아지 소유로 카드 밖입니다.</HmoDef>
      {["H", "M", "L"].map((k) => { const n = S.byGrade[k] || 0; const g = GU[k]; return (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span className="hmopill" style={{ background: g.bg, color: g.c, width: 62, textAlign: "center" }}>{g.ko}</span>
          <div className="hmobar"><i style={{ width: (n / S.cards * 100) + "%", background: g.c }} /></div>
          <span style={{ width: 104, fontSize: 10.8, color: "#475569", textAlign: "right" }}>{n.toLocaleString()} ({(n / S.cards * 100).toFixed(1)}%)</span></div>); })}
      <div className="hmonote">대상아님(관리 리듬 양호) {(S.byGrade["-"] || 0).toLocaleString()}명 · 일일 로스터 등급 합계 {Object.entries(S.byRosterGrade || {}).map(([k, v]) => k + " " + v).join(" · ")}</div>
    </HmoBox>

    <HmoBox t={<><Gauge size={14} color={HMO_C.blue} /> 부하 균형 — 시도별 프로당 담당</>} tag="전수" tagC={HMO_TAG_FULL}>
      <HmoDef>프로당 담당 회원 = 시도 담당 합 ÷ 그 시도 활성 프로 수(배치 스냅샷 loadBySido). ratio는 전국 평균({S.loadAvg}명) 대비 배율 — 1.0에서 멀수록 재배속 검토 대상이지만, 이 화면에서 배분을 바꾸지는 않습니다.</HmoDef>
      <div style={{ maxHeight: 190, overflowY: "auto" }}>
        {load.map((x) => (<HmoBarRow key={x.sido} label={x.sido} n={x.perPro} max={maxPer}
          color={x.ratio >= 1.2 ? HMO_C.stall : x.ratio <= 0.92 ? "#60A5FA" : HMO_C.cyan}
          right={`${x.perPro}명/프로 · 프로 ${x.pros}명 · ×${x.ratio}`} />))}
      </div>
      <div className="hmonote">최대 ×{S.loadRatioMax} · 최소 ×{S.loadRatioMin} — 배분 원천 = 시군구 실사 배속(수기 재배분 없음).</div>
    </HmoBox>

    <HmoBox t={<><TrendingUp size={14} color={HMO_C.ok} /> 완결 퍼널 — 지시 → 접촉 → 완결</>} tag="세션 실기록" tagC={HMO_TAG_FULL}>
      <HmoDef>등재된 이벤트(hiEvents)만 셉니다 — 이번 세션에 실제로 일어난 행동 기록이고, 가공·보정하지 않습니다. 기록이 없으면 0으로 둡니다.</HmoDef>
      {ev && ev.total ? (<div>
        {[["지시서 발행", (ev.by || {}).handoff_issued || 0, HMO_C.cyan], ["접촉(원탭)", (ev.by || {}).handoff_contacted || 0, HMO_C.warn],
          ["결과 기록", (ev.by || {}).handoff_resulted || 0, "#7C3AED"], ["완결 트랜잭션", ev.stage ? ev.stage[3] : 0, HMO_C.ok]].map(([k, v, c], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ width: 86, fontSize: 11, fontWeight: 700, color: "#475569" }}>{k}</span>
            <div className="hmobar" style={{ height: 8 }}><i style={{ width: Math.min(100, v * 12) + "%", background: c, height: 8 }} /></div>
            <b style={{ width: 26, textAlign: "right", fontSize: 11.6 }}>{v}</b></div>))}
        <div className="hmonote">상위 기록: {(ev.names || []).slice(0, 4).map((x) => x.ko + " " + x.n).join(" · ")}</div>
      </div>) : <div className="hmonote">이번 세션에 기록된 이벤트가 아직 없어요 — 지시서 노출·원탭·검진 예약 등 실제 행동이 일어나면 집계됩니다.</div>}
    </HmoBox>
  </div>);
}
/* 60일 사이클·제공 DB 관제 — 표본 집계이므로 표본임을 그 자리에 적는다.
   ① 추출 — 전에는 `i = 1..12000, i += 3`이었다. 정의문에는 「코호트 10만명 중 3명마다 1명」이라고
      적어 두고 실제로는 앞쪽 12% 구간만 훑어서, 전국 대표성이 없는 값을 전국 표본으로 소개했다.
      이제 `step = 25`로 **1~100,000 전 구간**에서 4,000명을 균등 추출한다 — draw 수는 같고(비용 동일)
      정의문과 계산이 일치한다(관측 정직성).
   ② 캐시 — useMemo는 마운트 단위라 탭을 떠나면 날아가고, 돌아올 때마다 4,000명을 다시 판정했다
      (실측 612~655ms). 산출이 전부 결정론이라 모듈 캐시(_HMO.cycle)에 담아 한 번만 돈다. */
const HMO_CYCLE_STEP = 25;        /* 10만 ÷ 25 = 4,000명 균등 추출 */
const HMO_CYCLE_N = 100000;
function HmoCycleOps() {
  const M = React.useMemo(() => {
    if (_HMO.cycle) return _HMO.cycle;
    const dist = {}, seg = {}; let n2Yes = 0, t5plus = 0, recov = 0, uncov = 0, n = 0;
    try {
      for (let i = 1; i <= HMO_CYCLE_N; i += HMO_CYCLE_STEP) {
        const cy = (typeof cycleOf === "function") ? cycleOf(i) : null;
        if (!cy || !cy.t) continue;
        n++; dist[cy.t] = (dist[cy.t] || 0) + 1;
        if (["T5", "T6", "T7", "T8"].indexOf(cy.t) >= 0) { t5plus++; if (typeof consentHas === "function" && consentHas("n2", i)) n2Yes++; }
        if (cy.secondGolden) { uncov++; if (typeof consentHas === "function" && consentHas("n2", i)) recov++; }
        const g = (typeof gSegOf === "function") ? gSegOf(i) : null;
        if (g && g.top) seg[g.top] = (seg[g.top] || 0) + 1;
      }
    } catch (e) {}
    let feed = null; try { feed = (typeof hyFeedScan === "function") ? hyFeedScan(300) : null; } catch (e) {}
    const out = { dist, seg, n2Yes, t5plus, recov, uncov, n, feed };
    _HMO.cycle = out;
    return out;
  }, []);
  const T = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
  const maxT = Math.max(1, ...T.map((t) => M.dist[t] || 0));
  const segTop = Object.keys(M.seg).sort((a, b) => M.seg[b] - M.seg[a]).slice(0, 6);
  return (<HmoBox t={<><Clock size={14} color={HMO_C.blue} /> 60일 사이클 관제 — 달력이 정한 일</>} tag={`표본 ${M.n.toLocaleString()}명`} tagC={HMO_TAG_SAMP}>
    <HmoDef>코호트 10만명을 {HMO_CYCLE_STEP}명 간격으로 균등 추출해(인덱스 1·{1 + HMO_CYCLE_STEP}·{1 + HMO_CYCLE_STEP * 2}… · 최대 {Math.floor(HMO_CYCLE_N / HMO_CYCLE_STEP).toLocaleString()}명) 사이클 판정(cycleOf)한 <b>표본</b> 집계입니다 — 전수가 아니며, 비율은 표본 안에서만 유효합니다. 추출은 결정론이라 누를 때마다 같은 표본이고, 전 구간에서 뽑으므로 앞쪽 구간에 치우치지 않습니다. T5 동의율 = 만기 도달 회원 중 안내 동의(consentHas n2) 보유 비율.</HmoDef>
    <div style={{ display: "flex", gap: 3, marginTop: 6, alignItems: "flex-end", height: 52 }}>
      {T.map((t) => (<div key={t} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ height: Math.round((M.dist[t] || 0) / maxT * 34) + 2, background: ["T2", "T5", "T6"].indexOf(t) >= 0 ? HMO_C.gold : "#93C5FD", borderRadius: 3 }} />
        <div style={{ fontSize: 9.4, color: "#475569", marginTop: 2 }}>{t}</div>
        <div style={{ fontSize: 9, color: "#94A3B8" }}>{(M.dist[t] || 0).toLocaleString()}</div>
      </div>))}
    </div>
    <div style={{ fontSize: 11.8, color: "#334155", lineHeight: 1.85, marginTop: 6 }}>
      📋 <b>T5 동의율(60일마다 나오는 성적표)</b> — 만기 도달 {M.t5plus.toLocaleString()}명 중 안내 동의 <b style={{ color: HMO_C.blue }}>{M.n2Yes.toLocaleString()}명({M.t5plus ? Math.round(M.n2Yes / M.t5plus * 100) : 0}%)</b><br />
      🕐 <b>2차 골든타임 회복</b> — 무보장 {M.uncov.toLocaleString()}명 중 동의 보유 {M.recov.toLocaleString()}명({M.uncov ? Math.round(M.recov / M.uncov * 100) : 0}%)<br />
      🎯 <b>세그먼트 상위</b> — {segTop.map((g) => g + " " + M.seg[g].toLocaleString()).join(" · ") || "-"}<br />
      🔐 <b>현대해상 제공 DB 무결성</b> — 필드 {M.feed ? M.feed.fields : "-"}종 · 표본 {M.feed ? M.feed.n.toLocaleString() : "-"}건 검사 · 건강 상태 값 유입 <b style={{ color: M.feed && M.feed.ok ? HMO_C.ok : HMO_C.red }}>{M.feed ? M.feed.bad.length : "?"}건</b>{M.feed && M.feed.ok ? " — 사전 밖 필드·등급·질환명 0" : ""}
    </div>
  </HmoBox>);
}

/* ═══════════════════ ⑤ 운영자 도구·조직 체계 설명 ═══════════════════ */
function HmoToolbox({ scope, onScope, metric, onMetric, period, onPeriod, cap, onCap, R }) {
  const O = hmoOrgIndex();
  const dans = Object.keys(O.dans).sort();
  return (<div>
    <HmoBox t={<><Filter size={14} color={HMO_C.cyan} /> 보기 설정 — 기간·지역·계산 범위</>}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>기간(월별 추이)</div>
          <select className="hmoin" value={period} onChange={(e) => onPeriod(Number(e.target.value))}>
            <option value={3}>최근 3개월</option><option value={6}>최근 6개월</option></select></label>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>드릴다운 기준 숫자</div>
          <select className="hmoin" value={metric} onChange={(e) => onMetric(e.target.value)}>
            <option value="managed">담당 회원 수</option><option value="today">오늘 지시서 건수</option><option value="pros">소속 프로 수</option></select></label>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>지역단 바로 가기</div>
          <select className="hmoin" value={scope.level === "hq" ? "" : scope.dan} onChange={(e) => onScope(e.target.value ? { level: "dan", dan: e.target.value } : { level: "hq" })}>
            <option value="">본사 전체</option>{dans.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>한 번에 계산할 프로 수</div>
          <select className="hmoin" value={cap} onChange={(e) => onCap(Number(e.target.value))}>
            <option value={20}>20명(빠름)</option><option value={60}>60명</option><option value={0}>이 범위 전체</option></select></label>
        <span className="hmonote" style={{ margin: 0, flex: 1, minWidth: 180 }}>계산 범위를 넓히면 담당 회원 전건을 다시 판정하므로 시간이 걸려요(프로 1명당 담당 100~450명). 계산한 프로는 세션에 남아 다시 누르면 즉시 나옵니다 — 현재 {R.warm}명 계산 완료.</span>
      </div>
    </HmoBox>
    <HmoBox t={<><Info size={14} color={HMO_C.blue} /> 무엇을 보고 있는가 — 이 화면의 경계</>}>
      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.95 }}>
        · <b>관측 전용입니다.</b> 재배분·등급 변경·명단 수정·발송 같은 조작 기능을 두지 않았어요. 접촉은 담당 프로의 콘솔에서만 일어납니다.<br />
        · <b>조직 4단</b> = 본사 → 지역단(실사 {O.hq.dansReal}{O.hq.dansSyn ? " + 광역 " + O.hq.dansSyn : ""}) → 지점(실사 {O.hq.branchesReal}{O.hq.branchesSyn ? " + 본사 " + O.hq.branchesSyn : ""}) → 프로({O.hq.n}). 「광역(전국)」·「본사(광역)」는 실사 조직이 아니라 구 명부를 보존하기 위한 버킷이라 드릴다운 목록에 배지를 달아 두었습니다. 지점·주소는 2026-07-31 지점찾기 실사값이고, 지역단 거점 주소·좌표는 서울 3곳만 실사이며 나머지는 거점 도시 <b>추정</b>(제휴 협의 후 확정)입니다.<br />
        · <b>「사업단」 단위는 아직 데이터에 없습니다.</b> 현재 체계의 중간 단위는 지역단 {O.hq.dansReal}개뿐이어서, 사업단장 시점은 해당 지역단을 고르는 것으로 대신합니다 — 사업단 체계가 확정되면 이 축을 추가합니다. 그래서 이 화면은 「사업단장」이라는 말을 쓰지 않고 <b>지역단장</b>으로 적습니다.<br />
        · <b>역할 축 고지(지금의 한계)</b> — 세션 역할은 ADMIN/MEMBER/GUEST 3종이고, 프로와 운영 담당자를 가르는 기준은 <b>사번 잠금 여부</b>입니다. 사번으로 들어온 세션(프로 개인)에는 이 화면의 메뉴가 없고 라우트도 홈으로 되돌아갑니다 — 실제로 막혀 있는 유일한 경계가 이것입니다. 반대로 <b>지점장·지역단장·본사 직원을 서로 다른 범위로 제한하는 권한 축은 아직 없습니다</b>: 사번을 잠근 운영 담당자는 전국 전체를 볼 수 있습니다(운영자 사번에 소속을 붙이는 작업이 남아 있습니다). 숨기지 않고 그대로 적습니다.<br />
        · <b>전수와 표본을 섞지 않습니다.</b> 담당·오늘·배치·결과 7코드는 전수, 단계 분포·실적 지표는 「계산한 프로 N명」 범위, 60일 사이클은 표본 — 블록마다 배지로 구분해 적었습니다.<br />
        · <b>금액·수수료·순위는 집계하지 않습니다.</b> 실적은 단계 전진·수행률·정체 해소로만 봅니다.
      </div>
    </HmoBox>
  </div>);
}

/* ═══════════════════ 메인 ═══════════════════ */
function HmOpsCenterSection({ onGo }) {
  /* 접근 판정 — 「관리자 세션」만으로는 부족하다. 프로도 ADMIN 세션으로 들어오기 때문에,
     사번 잠금을 푼 세션(hmProSession)은 프로 개인으로 보고 잠금 화면만 보여 준다.
     사이드바·라우트 가드와 같은 조건을 쓴다(App.jsx) — 세 곳의 기준이 하나다. */
  const proSess = (typeof hmProSession === "function") ? hmProSession() : "";
  const admin = (typeof isAdminRole === "function") && isAdminRole() && !proSess;
  const [tab, setTab] = React.useState(0);
  const [scope, setScopeRaw] = React.useState({ level: "hq" });
  const [picked, setPicked] = React.useState(null);
  const [metric, setMetric] = React.useState("managed");
  const [period, setPeriod] = React.useState(6);
  const [cap, setCap] = React.useState(20);
  const setScope = (s) => { setScopeRaw(s); setPicked(null); };
  const codes = React.useMemo(() => (admin ? hmoScopePros(scope).map((p) => p.code) : []), [admin, scope.level, scope.dan, scope.branch, scope.code]);
  const R = useHmoRows(codes, scope.level === "pro" ? 0 : cap);
  /* 프로 단위로 내려오면 그 프로 행은 바로 띄운다(표를 거치지 않고도 단계별 명단에 닿게) */
  React.useEffect(() => {
    if (!admin || scope.level !== "pro") return;
    if (picked && picked.code === scope.code) return;
    const r = _HMO.row[scope.code];
    if (r) setPicked(r);
  }, [admin, scope.level, scope.code, R.rows.length]);
  if (!admin) {
    return (<div className="hmowrap"><HmoStyle />
      <div className="hmocard" style={{ maxWidth: 580 }}>
        <div className="hmoct"><Lock size={14} color={HMO_C.mut} /> 운영 담당자 화면이에요</div>
        <div style={{ fontSize: 12.4, color: "#475569", lineHeight: 1.9 }}>
          이 화면은 지점장·지역단장·본사 운영 담당자용이에요(관측 전용).
          {proSess
            ? <> 지금은 <b>프로 사번 {proSess}</b>으로 들어온 세션이라 열 수 없어요 — 담당 회원 관리는 <b>헬스메이트 센터</b>에서 계속하시고, 운영 담당자로 보려면 센터 오른쪽 위 <b>[사번 잠금]</b>을 먼저 눌러 주세요.</>
            : <> 담당 회원 관리는 <b>헬스메이트 센터</b>에서 사번으로 들어가 주세요.</>}
        </div>
        {typeof onGo === "function" && <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <button className="hmobtn pri" onClick={() => onGo("healthmate")}>헬스메이트 센터로</button>
          <button className="hmobtn" onClick={() => onGo("home")}>처음 화면으로</button>
        </div>}
      </div></div>);
  }
  const O = hmoOrgIndex();
  const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const TABS = [[0, "조직 드릴다운", Network], [1, "단위 실적·통계", TrendingUp], [2, "D1~L8 관리 현황", Target], [3, "배치·배분 관제", Database], [4, "운영자 도구", Filter]];
  return (<div className="hmowrap">
    <HmoStyle />
    <div className="hmohero">
      <div className="k">HEALTHMATE OPERATIONS HQ</div>
      <h2><Landmark size={19} style={{ verticalAlign: -3, marginRight: 6 }} />헬스메이트 운영본부</h2>
      <p>지점장 · 지역단장 · 본사 운영 담당자용 관제 센터 — <b style={{ color: HMO_C.gold }}>관측 전용</b>(조작 기능 없음) · 사번을 잠근 관리자 세션에서만 열립니다(프로 사번 세션에는 메뉴가 없고 라우트도 홈으로 되돌아갑니다){S ? ` · 기준 배치 ${S.date}` : ""}<br />
        <b style={{ color: HMO_C.gold }}>시연 고지</b> — 이 화면의 회원·프로 이름은 모두 <b>시연용 합성 데이터</b>입니다(본인 계정만 실측). 회원이 보는 화면과 외부 전달물에는 마스킹 규칙이 그대로 적용됩니다.</p>
      <div className="hmokpi">
        {[["조직", O.hq.dansReal + " · " + O.hq.branchesReal, "지역단(+광역 " + O.hq.dansSyn + ") · 지점(+본사 " + O.hq.branchesSyn + ")"],
          ["프로", O.hq.n.toLocaleString() + "명", "활성 " + O.hq.active + " · 교육 " + O.hq.edu + " · 정지 " + O.hq.off],
          ["담당 회원", O.hq.managed.toLocaleString() + "명", "배치 스냅샷 합계"],
          ["오늘 지시서", O.hq.today.toLocaleString() + "건", "프로당 상한 " + (S ? S.maxRoster : "-") + "건"],
          ["접촉 락", S ? S.locked.toLocaleString() + "명" : "-", "검진결과 수령 전"],
          ["배치 상태", S ? (S.pass ? "통과" : "차단") : "-", S ? "러너 " + S.seconds + "s" : ""]].map(([k, v, e], i) => (
          <div className="n" key={i}><b>{v}</b><span>{k}</span><em>{e}</em></div>))}
      </div>
    </div>
    <HmoCrumb scope={scope} onScope={setScope} />
    <div className="hmotabs">{TABS.map(([n, t, Ic]) => (
      <button key={n} className={"hmotab" + (tab === n ? " on" : "")} onClick={() => setTab(n)}><Ic size={13} /> {t}</button>))}</div>
    <div style={{ marginTop: 2 }}>
      {tab === 0 && (<HmoBox t={<><Network size={14} color={HMO_C.cyan} /> 조직 드릴다운 — 본사 → 지역단 → 지점 → 프로</>}>
        <HmoOrgDrill scope={scope} onScope={setScope} metric={metric} />
        <div className="hmonote">기준 숫자({metric === "managed" ? "담당 회원 수" : metric === "today" ? "오늘 지시서 건수" : "소속 프로 수"})는 「운영자 도구」에서 바꿀 수 있어요 · 위로 되돌아오기는 상단 조직 경로나 「한 단계 위로」.</div>
      </HmoBox>)}
      {tab === 1 && <HmoUnitStats scope={scope} R={R} period={period} />}
      {tab === 2 && <HmoStageBoard scope={scope} R={R} picked={picked} onPick={setPicked} />}
      {tab === 3 && (<div><HmoBatchOps /><HmoCycleOps /></div>)}
      {tab === 4 && <HmoToolbox scope={scope} onScope={setScope} metric={metric} onMetric={setMetric} period={period} onPeriod={setPeriod} cap={cap} onCap={setCap} R={R} />}
    </div>
    <div className="hmonote" style={{ textAlign: "center", padding: "12px 0 4px" }}>
      집계 원천 — hmProsGen(조직) · HM_OPS_BRANCHES/HM_OPS_SNAPSHOT(배분·배치) · hmcProView/hmcProStats(단계·실적) · handoffResult(활동 결과) · cycleStage(60일 사이클) · hiEvents(퍼널). 이 화면은 원천을 더해 보여줄 뿐, 수치를 새로 만들지 않습니다.
      <div style={{ marginTop: 3 }}>회원 이름·프로 이름·사번은 모두 <b>시연용 합성 데이터</b>예요(본인 계정만 실측) — 운영 담당자 화면이라 가리지 않고 전체 이름으로 보여드리고, 회원이 보는 화면과 외부 전달물에는 마스킹 규칙이 그대로 적용돼요. 표 내보내기로 뽑은 TSV에도 첫 줄에 같은 고지가 붙습니다.</div>
    </div>
  </div>);
}

/* 관리자 전용 테스트 훅 — 조직 롤업이 배치 스냅샷과 어긋나지 않는지 확인용(관측 전용) */
try {
  if (typeof window !== "undefined") {
    window.__hifinHmOps = function (cmd, arg) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        /* 화면과 같은 경계 — 프로 사번 세션에서는 조직 전체 집계를 콘솔로도 꺼낼 수 없다 */
        if (typeof hmProSession === "function" && hmProSession()) return { error: "pro session — 사번 잠금 후 사용" };
        const O = hmoOrgIndex();
        if (cmd === "org") return { hq: O.hq, dans: Object.keys(O.dans).length, branches: Object.keys(O.branches).length };
        if (cmd === "dan") return Object.values(O.dans).map((d) => ({ dan: d.key, pros: d.n, active: d.active, managed: d.managed, today: d.today, branches: Object.keys(d.branches).length }));
        if (cmd === "row") return hmoProRow(arg);
        if (cmd === "check") {
          const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
          return { managedSum: O.hq.managed, snapTotal: S ? S.total : null, managedMatch: !!S && O.hq.managed === S.total,
            prosAll: O.hq.n, snapProsAll: S ? S.prosAll : null, prosMatch: !!S && O.hq.n === S.prosAll };
        }
        return { error: "org | dan | row <사번> | check" };
      } catch (e) { return { error: String(e).slice(0, 180) }; }
    };
  }
} catch (e) {}
