/* ══════════════ 헬스메이트 운영본부 — 운영 담당자 전용 관제 센터 ══════════════
   형 지시(2026-10-05 ⑤): 「⑩ 통합 운영」을 프로 콘솔에서 떼어내 지점장·지역단장·본사 직원용
   별도 화면으로 분리한다. 프로 개인에게는 보이지 않는다.

   ⚠️ 「보이지 않는다」의 실제 집행점 — 세션 역할(ADMIN/MEMBER/GUEST)로는 가를 수 없다. 프로도
      관리자 세션으로 들어오기 때문이다. 그래서 **사번 잠금 여부**(hmProSession — 세션에 사번이 있으면
      프로 개인 세션)로 가른다. 같은 조건이 세 곳에 걸려 있고 기준은 하나다:
        ① 사이드바 메뉴(App.jsx) ② 라우트 가드(App.jsx의 effect + 렌더 분기) ③ 이 화면의 admin 판정.
      전에는 ①~③이 전부 `isAdminRole()`뿐이어서, 사번 8H0001로 들어온 프로가 이 화면을 전부 열 수 있었고
      그 화면이 스스로 「프로 개인에게는 보이지 않습니다」라고 적고 있었다(화면이 자기를 반증).
      고지문은 이제 사실만 적는다 — 사번을 잠근 관리자만 접근.

   ⚠️⚠️ 두 번째 경계(형 지시 2026-10-05 ⑥ 「지점장은 자기 지점만 보이게 해줘」) — 위 경계를 통과한
      사람은 **누구든 전국 702명·10만 회원을 다 봤다**. 운영본부에 들어왔다는 사실만으로 전국이 열렸다.
      이제 운영본부는 들어오자마자 **운영자 사번(본사 1H · 지역단장 2H · 지점장 3H)을 한 번 더 묻고**, 그 사번의 직책으로 범위를 자른다
      (명부·판정 = healthMateCohort.js hmAdminsGen/hmAdminCheck · 세션 키 = hifin_hmops_admin).
        · 지점장   = 자기 지점 하나와 그 소속 프로만. 본사·지역단은 **표시만**, 다른 지점은 목록에 없다.
        · 지역단장 = 자기 지역단과 그 안의 지점·프로만.
        · 본사     = 전국(종전과 동일).
      ⚠️ 집행은 화면 한 곳이 아니라 **데이터 경로 한 곳**이다 — `hmoOrgIndex()`가 더 이상 전체 색인을
         돌려주지 않고, 현재 운영자 범위로 잘린 색인(`hmoViewIndex`)을 돌려준다. 조직 목록·실적 집계·
         D1~L8 표·프로 행·표 내보내기가 전부 이 하나를 통과하므로, 「한 탭만 가리고 다른 탭에서 전국이
         보이는」 구멍이 생기지 않는다. 전체 색인이 필요한 곳(배치 스냅샷 정합 검사)만 `hmoOrgIndexAll()`을
         명시적으로 부르고, 그 자리는 본사 범위에서만 열린다.
      ⚠️ 범위로 쪼갤 수 없는 숫자는 **범위 밖이면 아예 적지 않는다**. 배치 스냅샷의 전국 등급 분포
         (byGrade)·시도별 부하는 전국 집계 하나뿐이어서 지점 몫으로 나눌 방법이 없다 — 지점장 화면에서는
         그 상자를 「표기 보류」로 두고 왜 보류인지 적는다. 전국 숫자를 지점 라벨로 다는 것이 가장 나쁘다.
      ⚠️ **세션 키를 쓰는 경로는 HmoAdminGate 하나**다(형 지시 ⑥ 2차 수선). hero 머리띠에 있던 「은평지점장 /
         강북지역단장 / 본사(전국)」 한 번 클릭 전환 버튼은 재인증 없이 세션 키를 바꿨고, 목록이 adm과 무관한
         고정 3인이라 다른 지점장 세션에서도 남의 지점이 열렸다(상향·횡이동 우회) — 그래서 없앴다.
         범위를 바꾸려면 잠금 해제 → 게이트 재인증. 운영자 신원도 **state로 복사하지 않고 세션에서 바로 읽는다**
         (라벨과 숫자가 다른 원천을 보면 전국 숫자에 지점 라벨이 붙는다).
      ⚠️ 관리자 콘솔 훅(__hifinHmOps · __hifinHmScope)은 **화면과 같은 세 겹 가드**를 쓴다 — 화면만 막고 콘솔이
         전국을 뱉으면 범위 제한이 아니라 범위 「표시」일 뿐이다.
      ⚠️ 이 명부는 시연용 합성 데이터고 인증은 세션 안에서만 성립한다(서버 검증 없음). 화면이 그대로 적는다.

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
  .hmocrumb .c.dead{cursor:default;opacity:.66;background:#F1F5F9}
  .hmocrumb .c.dead:hover{border-color:${HMO_C.line}}
  .hmocrumb .c.on.dead{opacity:1;background:${HMO_C.navy};color:#fff}
  .hmoscope{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.26);border-radius:12px;padding:8px 12px;margin-top:11px;display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .hmoscope b{color:#fff;font-size:13px}
  .hmoscope .w{font-size:11.4px;color:#C8DCEC;line-height:1.6}
  .hmosw{border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:4px 11px;font-size:11.2px;font-weight:800;cursor:pointer;font-family:inherit}
  .hmosw.on{background:#fff;color:${HMO_C.navy};border-color:#fff;cursor:default}
  .hmosw:hover{background:rgba(255,255,255,.22)}
  .hmosw.on:hover{background:#fff}
  .hmorow{display:flex;align-items:center;gap:7px;padding:3px 4px;border-radius:7px;cursor:pointer}
  .hmorow:hover{background:#F1F6FB}
  .hmorow.on{background:#EAF4FE;box-shadow:inset 0 0 0 1px ${HMO_C.sky}}
  .hmorow.dead{cursor:default}
  .hmorow.dead:hover:not(.on){background:transparent}
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
  /* 하이 독이 열려 있으면 본문 오른쪽을 비운다 — 독(372px·우측 18px 고정)이 하필 **4단 프로 칼럼**을 덮었다
     (실측 1500×1100: 손세훈·박성호·전예진·양지오 행과 지점 주소가 가려짐). 지점장이 가장 보고 싶은 칼럼이다.
     독의 열림 여부는 body.hidock-open 한 곳에 있으므로 화면 간 상태 전달 없이 여기서 받는다. */
  @media (min-width:1180px){body.hidock-open .hmowrap{padding-right:398px}}
  @media (max-width:760px){.hmostagegrid{grid-template-columns:repeat(4,1fr)}}
  `}</style>);
}

/* ═══════════════════ 데이터 계층 — 조직 색인·프로 행(캐시) ═══════════════════ */
/* 세션 메모리 캐시. localStorage를 쓰지 않는다(관측 전용 화면 — 저장 키를 새로 만들지 않는다).
   view·cycle·mids는 **운영자 범위별로 칸이 나뉜다** — 한 칸을 공유하면 본사로 한 번 본 뒤
   지점장으로 바꿨을 때 앞 사람의 전국 집계가 그대로 보인다(범위 제한이 캐시에서 뚫린다). */
const _HMO = { org: null, view: {}, row: {}, cycle: {}, mids: {} };

/* ── 운영자 신원·관리 범위 ──────────────────────────────────────────────────────
   세션(hifin_hmops_admin)에 있는 운영자 사번 → 명부 레코드. 없으면 null이고, null이면 화면이
   집계를 시작하지 않고 인증 게이트만 보여 준다(「인증 전에는 아무것도 집계하지 않는다」). */
function hmoAdmin() {
  let c = "";
  try { c = (typeof hmoAdminSession === "function") ? hmoAdminSession() : ""; } catch (e) { c = ""; }
  if (!c) return null;
  try { return (typeof hmAdminOf === "function") ? hmAdminOf(c) : null; } catch (e) { return null; }
}
/* 범위 캐시 키 — 직책+소속. 사번이 아니라 범위로 잡는다(같은 지점의 담당자가 바뀌어도 같은 집계다). */
function hmoAdmKey(adm) { return adm ? (adm.role + "|" + (adm.dan || "") + "|" + (adm.branch || "")) : "none"; }
/* 관리 범위의 뿌리 — 드릴다운이 이 아래로만 내려간다(위로는 못 올라간다) */
function hmoAdmRoot(adm) {
  if (!adm || adm.role === "hq") return { level: "hq" };
  if (adm.role === "dan") return { level: "dan", dan: adm.dan };
  return { level: "branch", dan: adm.dan, branch: adm.branch };
}
/* 뿌리 깊이 — 0 본사 / 1 지역단 / 2 지점. 조직 경로에서 이 깊이보다 위는 「표시만」이 된다. */
function hmoAdmDepth(adm) { return !adm || adm.role === "hq" ? 0 : adm.role === "dan" ? 1 : 2; }

/* 조직 색인(전체) — hmProsGen()(귀속) × HM_OPS_BRANCHES(담당·오늘) 사번 조인.
   스냅샷에 없는 프로(교육중·정지 등 비활성)는 managed/today 0으로 남긴다 — 인원에서 빼지 않는다.
   ⚠️ 이 함수는 **전국 전체**를 돌려준다. 화면은 이것을 직접 부르지 않는다 — hmoOrgIndex()를 부른다.
      여기를 직접 부르는 곳은 「배치 스냅샷 전수 정합 검사」뿐이고, 그 자리는 본사 범위에서만 열린다. */
function hmoOrgIndexAll() {
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
  _HMO.org = hmoRollup(list);
  return _HMO.org;
}
/* 프로 배열 → 조직 롤업(지역단·지점·합계). 전체 색인과 범위 색인이 **같은 함수**로 만들어진다 —
   둘을 따로 짜면 한쪽만 고쳐져서 범위 집계와 전체 집계의 정의가 갈라진다.
   ⚠️ hq 필드는 「이 롤업의 합계」다. 본사 범위에서는 전국 합계고, 지점장 범위에서는 그 지점 합계다. */
function hmoRollup(list) {
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
  return { list, dans, branches, hq };
}
/* ── 범위 색인 — 운영자 직책으로 **프로 명부를 먼저 자르고** 그 위에서만 롤업한다 ──
   ⚠️ 여기가 범위 제한의 유일한 집행점이다. 「전체를 롤업한 뒤 화면에서 숨긴다」가 아니라
      「범위 밖 프로는 애초에 모집단에 없다」 — 그래서 어느 탭에서 어떻게 더해도 범위 밖이 섞이지 않는다.
   ⚠️ 지점장 범위에서는 O.dans에 자기 지역단 1개, O.branches에 자기 지점 1곳만 존재한다. 다른 지점 키로
      조회하면 undefined가 되어 빈 배열이 나오고, 그 상태를 hmoScopeClamp가 뿌리로 되돌린다. */
function hmoViewIndex(adm) {
  const k = hmoAdmKey(adm);
  if (_HMO.view[k]) return _HMO.view[k];
  const A = hmoOrgIndexAll();
  let list = A.list;
  if (adm && adm.role === "dan") list = list.filter((p) => p.dan === adm.dan);
  else if (adm && adm.role === "branch") list = list.filter((p) => p.dan === adm.dan && p.branch === adm.branch);
  const v = hmoRollup(list);
  v.adm = adm || null;
  _HMO.view[k] = v;
  return v;
}
/* 화면·집계가 부르는 단일 색인 — 항상 「지금 인증된 운영자 범위로 잘린 것」만 돌려준다.
   인증 전(adm = null)에는 전국이 아니라 **빈 색인**을 돌려준다 — 게이트를 우회해도 집계가 0이다. */
function hmoOrgIndex() {
  const a = hmoAdmin();
  if (!a) { if (!_HMO.view.none) _HMO.view.none = Object.assign(hmoRollup([]), { adm: null }); return _HMO.view.none; }
  return hmoViewIndex(a);
}
/* 선택 범위를 관리 범위 안으로 묶는다 — 범위 밖 scope가 들어오면 조용히 뿌리로 되돌린다.
   딥링크·프로그램 이동·캐시에 남은 앞 사람의 선택까지 여기 한 곳에서 걸린다. */
function hmoScopeClamp(scope, adm) {
  const a = (adm === undefined) ? hmoAdmin() : adm;
  const root = hmoAdmRoot(a);
  if (!a) return root;
  const s = scope || root;
  if (a.role === "hq") return s;
  if (a.role === "dan") {
    if (s.level === "hq" || s.dan !== a.dan) return root;
    return s;
  }
  if (s.level === "hq" || s.level === "dan") return root;
  if (s.dan !== a.dan || s.branch !== a.branch) return root;
  return s;
}
/* 선택 범위(scope) → 그 범위의 프로 배열 — 드릴다운·집계·표의 단일 기준(범위 고정 포함) */
function hmoScopePros(scope) {
  const O = hmoOrgIndex();
  const s = hmoScopeClamp(scope);
  if (!s || s.level === "hq") return O.list;
  if (s.level === "dan") return (O.dans[s.dan] || { pros: [] }).pros;
  if (s.level === "branch") return (O.branches[s.dan + "|" + s.branch] || { pros: [] }).pros;
  if (s.level === "pro") {
    const hit = O.list.filter((p) => p.code === s.code);
    if (hit.length) return hit;
    /* 범위 밖 프로 사번 — 뿌리로 되돌린다(재귀 없이 한 번에) */
    const r = hmoAdmRoot(hmoAdmin());
    if (r.level === "hq") return O.list;
    if (r.level === "dan") return (O.dans[r.dan] || { pros: [] }).pros;
    return (O.branches[r.dan + "|" + r.branch] || { pros: [] }).pros;
  }
  return O.list;
}
function hmoScopeLabel(scope) {
  const s = hmoScopeClamp(scope);
  if (!s || s.level === "hq") return "본사 전체(전국)";
  if (s.level === "dan") return s.dan;
  if (s.level === "branch") return s.dan + " · " + s.branch;
  const p = hmoOrgIndex().list.find((x) => x.code === s.code);
  return p ? (p.branch + " · " + p.name + " 프로(" + p.code + ")") : s.code;
}
/* 집계 정의에 붙는 범위 한 줄 — 「범위 밖은 애초에 집계에 들어오지 않는다」를 블록마다 같은 문장으로 적는다.
   HmoDef 한 곳에 붙이므로, 새 블록을 만들어도 고지가 저절로 따라간다(빠뜨릴 수 없는 구조). */
function hmoScopeNote() {
  const a = hmoAdmin();
  if (!a) return "";
  const O = hmoOrgIndex();
  const who = a.role === "hq" ? "본사 담당자" : a.title;
  if (a.role === "hq") return who + " 범위 — 전국 프로 " + O.hq.n.toLocaleString() + "명(담당 회원 " + O.hq.managed.toLocaleString() + "명) 전체가 모집단입니다.";
  const where = a.role === "dan" ? a.dan : (a.dan + " " + a.branch);
  return who + " 범위 — " + where + " 소속 프로 " + O.hq.n.toLocaleString() + "명(담당 회원 " + O.hq.managed.toLocaleString() + "명)만 모집단입니다. 범위 밖 프로·회원은 애초에 집계에 들어오지 않습니다(화면에서 가리는 것이 아닙니다).";
}

/* 프로 1명 진행·실적 행 — 엔진 산출만 모은다(단계 분포·정체·락·신호 = hmcProView,
   전진·시한·터치 = hmcProStats, 결과 코드 = hmrStats). 첫 계산만 비싸고 이후 캐시. */
function hmoProRow(code) {
  /* ⚠️ 캐시보다 **범위 확인이 먼저**다. 전에는 캐시 조회가 첫 줄이었는데, 그러면 본사 범위에서 한 번
     계산해 둔 행이 _HMO.row에 남아 있다가 지점장 범위에서 다른 지점 사번을 물었을 때 그대로 답한다
     — 범위 제한이 화면이 아니라 캐시에서 뚫리는 경우다. 범위 색인에 없는 사번은 캐시가 있어도 null. */
  const base = hmoOrgIndex().list.find((p) => p.code === code);
  if (!base) return null;
  if (_HMO.row[code]) return _HMO.row[code];
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
/* 집계 정의 — 「무엇을 세는지」 + 「어디까지 세는지」. 범위 줄은 hmoScopeNote가 한 곳에서 만든다. */
function HmoDef({ children }) {
  const note = hmoScopeNote();
  return (<div className="hmodef">📐 <b>집계 정의</b> — {children}
    {note ? <><br />🔐 <b>집계 범위</b> — {note}</> : null}</div>);
}
function HmoBox({ t, tag, tagC, children }) {
  return (<div className="hmocard"><div className="hmoct">{t}{tag ? <span className="hmopill" style={{ background: (tagC || {}).bg || "#EEF2F6", color: (tagC || {}).c || HMO_C.mut }}>{tag}</span> : null}</div>{children}</div>);
}
const HMO_TAG_DEMO = { bg: "#FEF3E2", c: "#B45309" };
const HMO_TAG_FULL = { bg: "#E7F8EE", c: "#15803D" };
const HMO_TAG_SAMP = { bg: "#EAF4FE", c: "#1D4ED8" };
function HmoBarRow({ label, n, max, color, right, on, onClick, sub }) {
  /* 누를 수 없는 행(관리 범위 상위·표시 전용)은 손가락 커서도 주지 않는다 — 눌러도 안 되는 것을 눌러 보게 두지 않는다 */
  return (<div className={"hmorow" + (on ? " on" : "") + (onClick ? "" : " dead")} onClick={onClick || undefined} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
    <span style={{ width: 96, fontSize: 11.2, fontWeight: 800, color: on ? HMO_C.blue : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>
    <div className="hmobar"><i style={{ width: (max ? Math.max(1.5, n / max * 100) : 0) + "%", background: color || HMO_C.cyan }} /></div>
    <span style={{ width: 118, fontSize: 10.8, color: HMO_C.mut, textAlign: "right" }}>{right}</span>
    {sub ? <span style={{ fontSize: 10, color: "#94A3B8" }}>{sub}</span> : null}
  </div>);
}
/* 표 내보내기 — 화면 복사용 TSV. 파일 저장·외부 전송은 하지 않는다(관측 전용).
   ⚠️ 표에도 **관리 범위**를 적는다 — 지점장이 뽑은 TSV가 전국 표로 오해되면 안 되고, 거꾸로 전국 표가
      지점 표로 둔갑해도 안 된다. 첫 줄에 「누구 범위의 표인가」가 함께 따라간다.
   ⚠️ 콘텐츠 보호(contentGuard)의 기본값이 noCopy라 화면 전체에서 copy 이벤트와 Ctrl+C가 막혀 있다.
      그대로 두면 이 버튼은 「선택은 되는데 클립보드에 아무것도 안 들어가는」 가짜 버튼이 된다(실측).
      그래서 contentGuard에 `textarea.hmoex` 한 곳만 예외를 두고, 복사하면 접속 로그에 export로 남긴다.
      표가 화면을 떠나도 고지가 따라가도록 TSV 첫 줄에 「[시연·합성 데이터] 범위 생성일」 주석 행을 넣는다. */
function HmoExport({ name, head, rows }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const admLine = (() => { const a = hmoAdmin(); if (!a) return ""; return " · 관리 범위 " + (a.role === "hq" ? "전국(본사 담당자)" : (a.role === "dan" ? a.dan : a.dan + " " + a.branch) + "(" + a.title + ")"); })();
  const tsv = ["# [시연·합성 데이터] " + name + admLine + " · 생성 " + new Date().toLocaleString("ko-KR", { hour12: false }) + " · 회원·프로 이름은 시연용 합성 데이터 — 외부 전달물에는 마스킹 규칙 적용"]
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
/* 조직 경로 — 관리 범위보다 **상위 단계는 표시만** 한다(눌러지지 않고 자물쇠 배지가 붙는다).
   지우지 않고 남긴 이유 — 지점장도 자기 지점이 어떤 지역단·본사 아래에 있는지는 알아야 한다.
   위치는 보여 주고 **숫자는 주지 않는다** — 상위로 올라가는 길은 열지 않는다. */
function HmoCrumb({ scope, onScope, adm }) {
  const O = hmoOrgIndex();
  const depth = hmoAdmDepth(adm);
  const steps = [{ t: "🏛 본사", s: { level: "hq" } }];
  if (scope.level !== "hq") steps.push({ t: scope.dan, s: { level: "dan", dan: scope.dan } });
  if (scope.level === "branch" || scope.level === "pro") steps.push({ t: scope.branch, s: { level: "branch", dan: scope.dan, branch: scope.branch } });
  if (scope.level === "pro") { const p = O.list.find((x) => x.code === scope.code); steps.push({ t: (p ? p.name + " 프로" : scope.code), s: scope }); }
  const cur = steps.length - 1;
  const upTo = scope.level === "pro" ? { level: "branch", dan: scope.dan, branch: scope.branch }
    : scope.level === "branch" ? { level: "dan", dan: scope.dan } : { level: "hq" };
  const canUp = cur > depth;
  return (<div className="hmocrumb">
    <span style={{ fontSize: 10.6, fontWeight: 800, color: HMO_C.mut, marginRight: 2 }}>조직 경로</span>
    {steps.map((x, i) => {
      const dead = i < depth || i === cur;                 /* 관리 범위 상위 또는 현재 칩 — 눌러도 움직이지 않는다 */
      const locked = i < depth;
      return (<React.Fragment key={i}>
        {i > 0 && <ChevronRight size={13} color="#94A3B8" />}
        <span className={"c" + (i === cur ? " on" : "") + (locked ? " dead" : "")}
          title={locked ? "관리 범위 밖이에요 — 어디에 속해 있는지만 표시하고, 그 단계의 집계는 열지 않습니다." : undefined}
          onClick={() => { if (!dead) onScope(x.s); }} role={dead ? undefined : "button"} tabIndex={dead ? undefined : 0}>
          {locked ? <Lock size={10} style={{ verticalAlign: -1, marginRight: 3 }} /> : null}{x.t}</span>
      </React.Fragment>);
    })}
    {canUp && (<button className="hmobtn" style={{ marginLeft: "auto" }} onClick={() => onScope(upTo)}>
      <ArrowLeft size={12} style={{ verticalAlign: -2 }} /> 한 단계 위로</button>)}
    {!canUp && depth > 0 && (<span className="hmonote" style={{ margin: 0, marginLeft: "auto" }}>
      여기가 관리 범위의 꼭대기예요 — 더 위로는 올라갈 수 없어요.</span>)}
  </div>);
}
function HmoOrgDrill({ scope, onScope, metric, adm }) {
  const O = hmoOrgIndex();
  const [q, setQ] = React.useState("");
  const depth = hmoAdmDepth(adm);                 /* 0 본사 / 1 지역단장 / 2 지점장 */
  const lockDan = depth >= 1, lockBr = depth >= 2;
  const mk = metric === "pros" ? "n" : metric === "today" ? "today" : "managed";
  const unit = metric === "pros" ? "명(프로)" : metric === "today" ? "건" : "명";
  /* 지역단 — 색인이 이미 범위로 잘려 있으므로, 지점장·지역단장에게는 애초에 자기 지역단 1개만 들어온다.
     다른 지역단·지점을 「회색으로 비활성」해서 보여 주는 길도 있었지만, 그건 존재를 알려 주는 일이다. */
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
    {depth > 0 && <div className="hmonote" style={{ marginTop: 0, marginBottom: 6 }}>🔐 <b>관리 범위 밖은 목록에 없어요</b> — {lockBr ? "자기 지점 1곳과 그 소속 프로만 나옵니다(다른 지점은 숨긴 것이 아니라 조회 대상이 아니에요)." : "자기 지역단과 그 안의 지점·프로만 나옵니다."} 상위 단위({lockBr ? "본사·지역단" : "본사"})는 소속을 보여 주기 위해 <b>표시만</b> 합니다.</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11.6, fontWeight: 900, marginBottom: 5 }}>2단 · 지역단 {O.hq.dansReal}개{O.hq.dansSyn ? " + 광역 " + O.hq.dansSyn : ""} <span style={{ fontWeight: 600, color: HMO_C.mut, fontSize: 10.4 }}>{lockDan ? "(관리 범위 — 고정)" : "(누르면 지점이 열려요 · 「광역(전국)」은 실사 지역단이 아니라 구 명부 보존용 버킷)"}</span></div>
        <div style={{ maxHeight: 268, overflowY: "auto" }}>
          {dans.map((d) => (<HmoBarRow key={d.key} label={d.key} n={d[mk]} max={maxD} color={d.key === danSel ? HMO_C.blue : HMO_C.cyan}
            on={d.key === danSel} onClick={lockDan ? null : () => onScope(d.key === danSel ? { level: "hq" } : { level: "dan", dan: d.key })}
            right={`${d[mk].toLocaleString()}${unit} · 프로 ${d.n}(활성 ${d.active})`}
            sub={d.key === "광역(전국)" ? "실사 지역단 아님 — 구 명부 보존용" : (lockDan ? "관리 범위" : "")} />))}
        </div>
      </div>
      <div>
        {!danSel ? <div className="hmonote" style={{ paddingTop: 22, textAlign: "center" }}>← 지역단을 먼저 고르세요.</div> : (<>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
            <div style={{ fontSize: 11.6, fontWeight: 900 }}>3단 · {danSel} 지점 {brs.length}곳{lockBr ? " (관리 범위 — 고정)" : ""}</div>
            {!lockBr && <input className="hmoin" value={q} onChange={(e) => setQ(e.target.value)} placeholder="지점 이름" style={{ flex: 1, minWidth: 70 }} />}
          </div>
          <div style={{ maxHeight: 268, overflowY: "auto" }}>
            {brs.map((b) => (<HmoBarRow key={b.key} label={b.branch} n={b[mk]} max={maxB} color={b.branch === brSel ? HMO_C.blue : "#60A5FA"}
              on={b.branch === brSel} onClick={lockBr ? null : () => onScope(b.branch === brSel ? { level: "dan", dan: danSel } : { level: "branch", dan: danSel, branch: b.branch })}
              right={`${b[mk].toLocaleString()}${unit} · 프로 ${b.n}`}
              sub={b.branch === "본사(광역)" ? "실사 지점 아님 — 구 명부 보존용" : (lockBr ? "관리 범위" : "")} />))}
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
function HmoStageBoard({ scope, R, picked, onPick, adm }) {
  const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
  const S = hmoSumRows(R.rows);
  const nation = React.useMemo(() => { try { return (typeof hmNationStats === "function") ? hmNationStats() : []; } catch (e) { return []; } }, []);
  /* ⚠️ 전국 코호트 10만 수식 분포(hmNationStats)는 조직 축이 없는 **전국 숫자**다 — 본사 범위에서만 띄운다.
        지점장 화면에 이 상자를 띄우면 「지점 분포」로 읽히고, 그게 범위 제한을 가장 크게 무너뜨린다. */
  const hq = scope.level === "hq" && (!adm || adm.role === "hq");
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
/* ⚠️ 이 탭이 범위 제한의 가장 약한 고리였다 — 숫자가 전부 배치 스냅샷(전국 집계 1개)에서 오기 때문이다.
      스냅샷은 전국 등급 분포·시도별 부하를 「합쳐진 하나」로만 들고 있어서 지점 몫으로 나눌 방법이 없다.
      그래서 본사 범위에서는 아래 HmoBatchOps(스냅샷 그대로)를, 지점장·지역단장 범위에서는
      HmoBatchScoped(스냅샷 합계 대신 **범위 안 프로의 배분 원천을 직접 더한 값**)를 띄운다.
      쪼갤 수 없는 숫자는 전국 숫자를 지점 라벨로 다는 대신 **표기 보류**로 둔다 — 그게 가장 나쁜 거짓말이다. */
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
/* 전사 공통 운영 상태 — 「오늘 지시서가 발행 가능한가」의 시스템 판정.
   조직·회원 숫자가 아니라 배치 러너·대본 하네스의 통과 여부라서 범위 제한 대상이 아니다.
   ⚠️ 그래도 상자를 따로 떼고 라벨을 붙인다 — 같은 상자에 회원 숫자와 섞어 두면 전국 숫자가 범위 숫자로 읽힌다. */
function HmoBatchSystem() {
  const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const H = (typeof HM_HARNESS_SNAPSHOT !== "undefined") ? HM_HARNESS_SNAPSHOT : null;
  const W = (typeof HM_WEEKLY_SNAPSHOT !== "undefined") ? HM_WEEKLY_SNAPSHOT : null;
  if (!S) return <div className="hmocard">배치 스냅샷이 아직 없어요 — scripts/run_handoff_batch.mjs를 돌리면 이 블록이 채워집니다(화면이 대신 추정하지 않습니다).</div>;
  return (<HmoBox t={<><Database size={14} color={HMO_C.cyan} /> 발행 가능 여부 — 전사 공통 배치 상태</>} tag={S.pass ? "통과" : "차단"} tagC={S.pass ? HMO_TAG_FULL : { bg: "#FDECEC", c: HMO_C.red }}>
    <div className="hmodef">📐 <b>집계 정의</b> — 배치 러너·대본 하네스의 <b>통과 여부</b>만 봅니다({S.date} · 러너 {S.seconds}s). 하나라도 실패하면 그날 지시서는 전사에서 발행되지 않습니다.
      <br />🔐 <b>집계 범위</b> — 이 상자만 <b>전사 공통 운영 상태</b>예요. 조직·회원 숫자가 아니라 시스템 판정이라 관리 범위로 쪼개지지 않습니다 — 범위 안 회원·배분 숫자는 아래 상자에서만 봅니다.</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
      <span className="hmopill" style={{ background: S.pass ? "#E7F8EE" : "#FDECEC", color: S.pass ? HMO_C.ok : HMO_C.red }}>배치 {S.pass ? "통과 ✓" : "차단 ✗"}</span>
      <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>전원 조립 위반 {S.rosterViol}건</span>
      <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>프로당 지시서 상한 {S.maxRoster}건</span>
      {H && <span className="hmopill" style={{ background: H.pass ? "#E7F8EE" : "#FDECEC", color: H.pass ? HMO_C.ok : HMO_C.red }}>대본 하네스 {H.pass ? "통과 ✓" : "실패 ✗"}</span>}
      {H && <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>금지어 {H.forbiddenHits}건 · 골든셋 드리프트 {H.goldenDrift}건</span>}
      {H && <span className="hmopill" style={{ background: "#EEF2F6", color: "#475569" }}>A5 회귀 {H.coachAcc}%</span>}
    </div>
    {W && W.week ? <div className="hmonote">📚 주간 학습 루프({W.week}) — 과다 사용 {W.monotony.length}블록 · 미사용 승인 {W.unused.length}블록 · 개선 후보 {W.candidates.length}건. 문안 반영은 대표 검수 경유만(자동 반영 없음).</div> : null}
  </HmoBox>);
}
/* 지점장·지역단장 범위의 배치·배분 관제 — 전국 스냅샷 합계를 쓰지 않고 **범위 안 프로의 배분 원천만** 더한다. */
function HmoBatchScoped({ adm }) {
  const O = hmoOrgIndex();
  const branch = !!(adm && adm.role === "branch");
  const ev = React.useMemo(() => { try { return (typeof hiEventStats === "function") ? hiEventStats() : null; } catch (e) { return null; } }, []);
  /* 분포 단위 — 지역단장은 지점별, 지점장은 프로별. 「무엇 하나당 몇 명인가」의 단위를 섞어 적지 않는다. */
  const rows = branch
    ? O.list.slice().map((p) => ({ k: p.code, label: p.name + " " + p.code, per: p.managed, sub: p.status !== "활성" ? p.status : "" })).sort((a, b) => b.per - a.per)
    : Object.values(O.branches).map((b) => ({ k: b.key, label: b.branch, per: b.n ? Math.round(b.managed / b.n * 10) / 10 : 0, sub: "프로 " + b.n + "명" })).sort((a, b) => b.per - a.per);
  const avg = O.hq.n ? Math.round(O.hq.managed / O.hq.n * 10) / 10 : 0;       /* 범위 안 프로당 평균 — 전국 평균이 아니다 */
  const maxPer = Math.max(1, ...rows.map((r) => r.per));
  const ratio = (v) => (avg ? Math.round(v / avg * 100) / 100 : 0);
  const SD = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT.date : "-";
  return (<div className="hmogrid">
    <HmoBox t={<><Users size={14} color={HMO_C.cyan} /> 배분 현황 — {hmoScopeLabel(hmoAdmRoot(adm))}</>} tag="범위 전수" tagC={HMO_TAG_FULL}>
      <HmoDef>배치 스냅샷({SD})의 <b>사번별</b> 담당 회원 수·오늘 지시서 건수를 이 범위 소속 프로에 대해서만 더한 값입니다 — 전국 합계를 비율로 나눈 환산값이 아닙니다.</HmoDef>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.2 }}>
        {[["소속 프로", O.hq.n + "명"], ["활성", O.hq.active + "명"], ["담당 회원", O.hq.managed.toLocaleString() + "명"],
          ["오늘 지시서", O.hq.today.toLocaleString() + "건"], ["프로당 담당", avg ? avg.toLocaleString() + "명" : "-"]].map(([k, v], i) => (
          <div key={i}><b style={{ fontSize: 15.5, color: HMO_C.navy, fontVariantNumeric: "tabular-nums" }}>{v}</b><div style={{ fontSize: 10.4, color: HMO_C.mut }}>{k}</div></div>))}
      </div>
      <div className="hmonote">교육중 {O.hq.edu}명 · 정지 {O.hq.off}명은 담당 0명으로 집계돼요(인원에서 빼지 않습니다). 재배분·배정 변경 기능은 이 화면에 없어요 — 관측 전용입니다.</div>
    </HmoBox>

    <HmoBox t={<><Gauge size={14} color={HMO_C.blue} /> 부하 균형 — {branch ? "프로별 담당" : "지점별 프로당 담당"}</>} tag="범위 전수" tagC={HMO_TAG_FULL}>
      <HmoDef>{branch ? "프로 1명당 담당 회원 수(배치 스냅샷 managed)" : "지점 담당 합 ÷ 그 지점 프로 수"} · 배율은 <b>이 범위 평균({avg.toLocaleString()}명/프로)</b> 대비입니다 — <b>전국 평균이 아닙니다</b>(전국 평균은 본사 범위에서만 표기). 1.0에서 멀수록 재배속 검토 대상이지만, 이 화면에서 배분을 바꾸지는 않습니다.</HmoDef>
      <div style={{ maxHeight: 210, overflowY: "auto" }}>
        {rows.map((r) => (<HmoBarRow key={r.k} label={r.label} n={r.per} max={maxPer}
          color={ratio(r.per) >= 1.2 ? HMO_C.stall : ratio(r.per) <= 0.82 ? "#60A5FA" : HMO_C.cyan}
          right={`${r.per.toLocaleString()}명${branch ? "" : "/프로"} · ×${ratio(r.per)}`} sub={r.sub} />))}
        {!rows.length && <div className="hmonote">이 범위에 배분 원천이 아직 없어요.</div>}
      </div>
    </HmoBox>

    <HmoBox t={<><AlertTriangle size={14} color={HMO_C.mut} /> 위험 등급(H/M/L) 분포 — 표기 보류</>} tag="범위로 쪼갤 수 없음" tagC={{ bg: "#EEF2F6", c: "#64748B" }}>
      <HmoDef>배치 스냅샷은 등급 분포(byGrade)와 시도별 부하를 <b>전국 집계 하나로만</b> 들고 있어서, 이 범위 몫으로 쪼갤 수가 없습니다. 쪼갤 수 없는 숫자를 범위 라벨로 다는 대신 비워 둡니다.</HmoDef>
      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.95 }}>
        · 전국 등급 분포·시도별 부하는 <b>본사 담당자 범위에서만</b> 표기해요 — 전국 숫자에 「{branch ? (adm ? adm.branch : "") : (adm ? adm.dan : "")}」 이름을 붙이는 일은 하지 않습니다.<br />
        · 이 범위의 위험·정체·접촉 락은 <b>「D1~L8 관리 현황」 탭</b>에서 담당 회원 전건을 실제로 단계 판정해 보여드려요(추정 없음) — 고위험 관리·정체 인원·평균 체류일이 거기 있습니다.
      </div>
    </HmoBox>

    <HmoBox t={<><TrendingUp size={14} color={HMO_C.ok} /> 완결 퍼널 — 지시 → 접촉 → 완결</>} tag="이 브라우저 세션" tagC={HMO_TAG_FULL}>
      <HmoDef>등재된 이벤트(hiEvents)만 셉니다 — <b>이 브라우저 세션에 실제로 일어난 행동</b> 기록이라 조직 축이 없어요(다른 지점의 행동이 섞이는 것이 아니라, 애초에 이 기기에서 일어난 일만 남습니다). 가공·보정하지 않고, 기록이 없으면 0으로 둡니다.</HmoDef>
      {ev && ev.total ? (<div>
        {[["지시서 발행", (ev.by || {}).handoff_issued || 0, HMO_C.cyan], ["접촉(원탭)", (ev.by || {}).handoff_contacted || 0, HMO_C.warn],
          ["결과 기록", (ev.by || {}).handoff_resulted || 0, "#7C3AED"], ["완결 트랜잭션", ev.stage ? ev.stage[3] : 0, HMO_C.ok]].map(([k, v, c], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ width: 86, fontSize: 11, fontWeight: 700, color: "#475569" }}>{k}</span>
            <div className="hmobar" style={{ height: 8 }}><i style={{ width: Math.min(100, v * 12) + "%", background: c, height: 8 }} /></div>
            <b style={{ width: 26, textAlign: "right", fontSize: 11.6 }}>{v}</b></div>))}
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
const HMO_CYCLE_STEP = 25;        /* 10만 ÷ 25 = 4,000명 균등 추출(본사 범위) */
const HMO_CYCLE_N = 100000;
const HMO_CYCLE_PROS = 60;        /* 범위 표본 조립 상한 — 프로 60명까지 훑는다(걸리면 화면에 적는다) */
const HMO_CYCLE_DRAWS = 2000;     /* 범위 표본 draw 상한 — 지역단도 2,000명 안에서 균등 추출 */
/* ③ 범위 — 전에는 운영자가 누구든 **전국 10만 전 구간**에서 뽑았다. 지점장 화면에서 그 표본은
      「우리 지점 회원 분포」로 읽히지만 실제로는 전국 분포였다(가장 조용한 종류의 거짓말).
      이제 본사 범위만 전국 10만을 뽑고, 지점장·지역단장 범위는 **자기 범위 프로의 담당 회원**에서만 뽑는다.
      표본 모집단은 관리 범위의 뿌리(드릴다운이 아니라 직책)로 잡는다 — 드릴다운마다 표본이 바뀌면
      같은 화면의 숫자가 클릭에 따라 흔들려 비교가 안 된다. */
function hmoScopeMemberIds(adm) {
  const k = hmoAdmKey(adm);
  if (_HMO.mids[k]) return _HMO.mids[k];
  const pros = hmoScopePros(hmoAdmRoot(adm));
  const take = pros.slice(0, HMO_CYCLE_PROS);        /* 명부 순서 = hmProsGen 생성 순서(결정론) */
  const ids = [];
  take.forEach((p) => { try { (((typeof hmMembersOfPro === "function") ? hmMembersOfPro(p.code) : []) || []).forEach((i) => ids.push(i)); } catch (e) {} });
  const r = { ids, pros: take.length, prosAll: pros.length, capped: pros.length > HMO_CYCLE_PROS };
  _HMO.mids[k] = r;
  return r;
}
function HmoCycleOps({ adm }) {
  const hq = !adm || adm.role === "hq";
  const ckey = hmoAdmKey(adm);
  const M = React.useMemo(() => {
    if (_HMO.cycle[ckey]) return _HMO.cycle[ckey];
    const dist = {}, seg = {}; let n2Yes = 0, t5plus = 0, recov = 0, uncov = 0, n = 0;
    /* 모집단 — 본사는 전국 인덱스(1·26·51…), 그 밖은 범위 안 담당 회원 인덱스에서 균등 추출.
       ⚠️ step을 함께 내보낸다. 범위가 작은 지점은 step === 1이 되어 **전수**가 되는데, 정의문이
          「균등 추출해(463명)」이라고 적어서 추출한 적 없는 숫자를 추출이라고 소개했다(실측: ids 600 · step 1). */
    let draw = [], src = null, step = HMO_CYCLE_STEP;
    if (hq) { for (let i = 1; i <= HMO_CYCLE_N; i += HMO_CYCLE_STEP) draw.push(i); }
    else {
      src = hmoScopeMemberIds(adm);
      step = Math.max(1, Math.ceil(src.ids.length / HMO_CYCLE_DRAWS));
      for (let j = 0; j < src.ids.length; j += step) draw.push(src.ids[j]);
    }
    try {
      draw.forEach((i) => {
        const cy = (typeof cycleOf === "function") ? cycleOf(i) : null;
        if (!cy || !cy.t) return;
        n++; dist[cy.t] = (dist[cy.t] || 0) + 1;
        if (["T5", "T6", "T7", "T8"].indexOf(cy.t) >= 0) { t5plus++; if (typeof consentHas === "function" && consentHas("n2", i)) n2Yes++; }
        if (cy.secondGolden) { uncov++; if (typeof consentHas === "function" && consentHas("n2", i)) recov++; }
        const g = (typeof gSegOf === "function") ? gSegOf(i) : null;
        if (g && g.top) seg[g.top] = (seg[g.top] || 0) + 1;
      });
    } catch (e) {}
    /* 제공 DB 무결성(hyFeedScan)은 전국 피드의 **스키마** 검사라 조직 축이 없다 — 본사 범위에서만 띄운다 */
    let feed = null;
    if (hq) { try { feed = (typeof hyFeedScan === "function") ? hyFeedScan(300) : null; } catch (e) { feed = null; } }
    /* draw N명 중 판정 M명 / 미판정 N−M명 — 이 셋을 **같이** 들고 나간다.
       전에는 n(판정)만 내보내서, 600명을 전수로 돌렸는데 463명이라고만 적혔다(미판정 137명이 조용히 빠졌다).
       미판정 사유는 하나다 — cycleOf가 검진 예약·검진 이력을 못 찾아 `t: null`(「사이클 전」)을 돌려주는 경우. */
    const out = { dist, seg, n2Yes, t5plus, recov, uncov, n, feed, hq, src,
      drawN: draw.length, unjudged: draw.length - n, step, full: step === 1 };
    _HMO.cycle[ckey] = out;
    return out;
  }, [ckey]);
  const T = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
  const maxT = Math.max(1, ...T.map((t) => M.dist[t] || 0));
  const segTop = Object.keys(M.seg).sort((a, b) => M.seg[b] - M.seg[a]).slice(0, 6);
  const judgeNote = <>{M.full ? "전수" : "draw"} {M.drawN.toLocaleString()}명 중 <b>사이클 판정 가능 {M.n.toLocaleString()}명</b>(미판정 {M.unjudged.toLocaleString()}명 — <b>검진 예약·검진 이력이 없어 사이클이 아직 시작되지 않은 회원</b>입니다. cycleOf가 「사이클 전」을 돌려주고 단계(T0~T8)가 없어 분포·비율에서 빠집니다)</>;
  return (<HmoBox t={<><Clock size={14} color={HMO_C.blue} /> 60일 사이클 관제 — 달력이 정한 일</>}
    tag={M.full ? `전수 ${M.drawN.toLocaleString()}명 중 판정 ${M.n.toLocaleString()}명` : `표본 ${M.n.toLocaleString()}명 / draw ${M.drawN.toLocaleString()}명`}
    tagC={M.full ? HMO_TAG_FULL : HMO_TAG_SAMP}>
    {/* ⚠️ 문구를 계산과 일치시킨다 — step === 1이면 「추출」이 아니라 「전수 판정」이고, 어느 경우든
           draw·판정·미판정 세 숫자를 함께 적는다. 범위가 작은 지점일수록 드롭 비율이 통계를 흔들어
           지점 간 비교가 왜곡되므로, 지점장이 자기 숫자를 믿고 읽으려면 몇 명이 왜 빠졌는지 보여야 한다. */}
    <HmoDef>{M.hq
      ? <>전국 코호트 10만명을 {HMO_CYCLE_STEP}명 간격으로 균등 추출해(인덱스 1·{1 + HMO_CYCLE_STEP}·{1 + HMO_CYCLE_STEP * 2}… · draw {M.drawN.toLocaleString()}명) 사이클 판정(cycleOf)한 <b>표본</b> 집계입니다 — 전수가 아니며, 비율은 표본 안에서만 유효합니다. {judgeNote}.</>
      : (M.full
        ? <>이 범위 프로 {M.src ? M.src.pros : 0}명의 <b>담당 회원 {M.src ? M.src.ids.length.toLocaleString() : 0}명 전수</b>를 사이클 판정(cycleOf)한 집계입니다 — 추출하지 않았습니다(이 범위는 {HMO_CYCLE_DRAWS.toLocaleString()}명 상한 안이라 간격이 1입니다). {judgeNote}. 범위 밖 회원은 모집단에 애초에 없습니다.{M.src && M.src.capped ? " ⚠️ 이 범위 프로 " + M.src.prosAll + "명 중 앞 " + M.src.pros + "명까지만 훑었어요(표본 조립 상한) — 전원이 아니라는 사실을 그대로 적습니다." : ""}</>
        : <>이 범위 프로 {M.src ? M.src.pros : 0}명의 <b>담당 회원 {M.src ? M.src.ids.length.toLocaleString() : 0}명</b>에서 {M.step}명 간격으로 균등 추출해(draw {M.drawN.toLocaleString()}명) 사이클 판정(cycleOf)한 <b>표본</b> 집계입니다 — 전국 코호트 표본을 비율로 환산한 값이 아니고, 범위 밖 회원은 표본 모집단에 애초에 없습니다. {judgeNote}.{M.src && M.src.capped ? " ⚠️ 이 범위 프로 " + M.src.prosAll + "명 중 앞 " + M.src.pros + "명까지만 훑었어요(표본 조립 상한) — 전원이 아니라는 사실을 그대로 적습니다." : ""}</>)}
      {" "}{M.full ? "전수라" : "추출은 결정론이라"} 누를 때마다 같은 숫자예요. 모집단은 <b>직책(관리 범위)</b>에 고정되고 드릴다운 선택에 따라 바뀌지 않습니다 — 누를 때마다 바뀌면 같은 화면의 숫자가 클릭마다 흔들려 비교가 안 됩니다. T5 동의율 = 만기 도달 회원 중 안내 동의(consentHas n2) 보유 비율.</HmoDef>
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
      {M.hq
        ? <>🔐 <b>현대해상 제공 DB 무결성</b> — 필드 {M.feed ? M.feed.fields : "-"}종 · 표본 {M.feed ? M.feed.n.toLocaleString() : "-"}건 검사 · 건강 상태 값 유입 <b style={{ color: M.feed && M.feed.ok ? HMO_C.ok : HMO_C.red }}>{M.feed ? M.feed.bad.length : "?"}건</b>{M.feed && M.feed.ok ? " — 사전 밖 필드·등급·질환명 0" : ""}</>
        : <>🔐 <b>현대해상 제공 DB 무결성</b> — 전국 피드의 <b>스키마 검사</b>라 조직 축이 없어서 본사 담당자 범위에서만 표기해요 — 전국 검사 값에 지점 이름을 붙이지 않습니다.</>}
    </div>
  </HmoBox>);
}

/* ═══════════════════ ⑤ 운영자 도구·조직 체계 설명 ═══════════════════ */
function HmoToolbox({ scope, onScope, metric, onMetric, period, onPeriod, cap, onCap, R, adm }) {
  const O = hmoOrgIndex();
  const dans = Object.keys(O.dans).sort();
  const depth = hmoAdmDepth(adm);
  const root = hmoAdmRoot(adm);
  return (<div>
    <HmoBox t={<><Filter size={14} color={HMO_C.cyan} /> 보기 설정 — 기간·지역·계산 범위</>}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>기간(월별 추이)</div>
          <select className="hmoin" value={period} onChange={(e) => onPeriod(Number(e.target.value))}>
            <option value={3}>최근 3개월</option><option value={6}>최근 6개월</option></select></label>
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>드릴다운 기준 숫자</div>
          <select className="hmoin" value={metric} onChange={(e) => onMetric(e.target.value)}>
            <option value="managed">담당 회원 수</option><option value="today">오늘 지시서 건수</option><option value="pros">소속 프로 수</option></select></label>
        {depth === 0
          ? (<label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>지역단 바로 가기</div>
              <select className="hmoin" value={scope.level === "hq" ? "" : scope.dan} onChange={(e) => onScope(e.target.value ? { level: "dan", dan: e.target.value } : { level: "hq" })}>
                <option value="">본사 전체</option>{dans.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>)
          : (<label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>관리 범위(고정)</div>
              <div className="hmoin" style={{ background: HMO_C.soft, fontWeight: 800, color: HMO_C.navy, whiteSpace: "nowrap" }}>
                <Lock size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{hmoScopeLabel(root)}</div></label>)}
        <label style={{ fontSize: 11 }}><div style={{ color: HMO_C.mut, fontWeight: 800, marginBottom: 3 }}>한 번에 계산할 프로 수</div>
          <select className="hmoin" value={cap} onChange={(e) => onCap(Number(e.target.value))}>
            <option value={20}>20명(빠름)</option><option value={60}>60명</option><option value={0}>이 범위 전체</option></select></label>
        <span className="hmonote" style={{ margin: 0, flex: 1, minWidth: 180 }}>계산 범위를 넓히면 담당 회원 전건을 다시 판정하므로 시간이 걸려요(프로 1명당 담당 100~450명). 계산한 프로는 세션에 남아 다시 누르면 즉시 나옵니다 — 현재 {R.warm}명 계산 완료.</span>
      </div>
    </HmoBox>
    <HmoBox t={<><Info size={14} color={HMO_C.blue} /> 무엇을 보고 있는가 — 이 화면의 경계</>}>
      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.95 }}>
        · <b>관측 전용입니다.</b> 재배분·등급 변경·명단 수정·발송 같은 조작 기능을 두지 않았어요. 접촉은 담당 프로의 콘솔에서만 일어납니다.<br />
        · <b>조직 4단</b> = 본사 → 지역단 → 지점 → 프로. {depth === 0
          ? <>지금 범위(본사)에서 보이는 것은 지역단 실사 {O.hq.dansReal}{O.hq.dansSyn ? " + 광역 " + O.hq.dansSyn : ""} · 지점 실사 {O.hq.branchesReal}{O.hq.branchesSyn ? " + 본사 " + O.hq.branchesSyn : ""} · 프로 {O.hq.n}명입니다.</>
          : <>지금 범위({hmoScopeLabel(root)})에서 보이는 것은 지점 {O.hq.branchesReal}{O.hq.branchesSyn ? " + 본사 " + O.hq.branchesSyn : ""} · 프로 {O.hq.n}명입니다 — 전국 조직 규모는 본사 담당자 범위에서만 표기해요.</>} 「광역(전국)」·「본사(광역)」는 실사 조직이 아니라 구 명부를 보존하기 위한 버킷이라 드릴다운 목록에 배지를 달아 두었습니다. 지점·주소는 2026-07-31 지점찾기 실사값이고, 지역단 거점 주소·좌표는 서울 3곳만 실사이며 나머지는 거점 도시 <b>추정</b>(제휴 협의 후 확정)입니다.<br />
        · <b>「사업단」 단위는 아직 데이터에 없습니다.</b> 현재 체계의 중간 단위는 지역단뿐이어서, 사업단장 시점은 해당 지역단을 고르는 것으로 대신합니다 — 사업단 체계가 확정되면 이 축을 추가합니다. 그래서 이 화면은 「사업단장」이라는 말을 쓰지 않고 <b>지역단장</b>으로 적습니다.<br />
        · <b>권한 축 — 두 겹입니다.</b> ① <b>프로 vs 운영 담당자</b>는 사번 잠금 여부(hmProSession)로 가릅니다. 프로 사번으로 들어온 세션에는 이 화면의 메뉴가 없고 라우트도 홈으로 되돌아갑니다. ② <b>운영 담당자끼리의 범위</b>는 운영자 사번(본사 1H · 지역단장 2H · 지점장 3H)의 직책으로 가릅니다 — 지점장은 자기 지점 하나, 지역단장은 자기 지역단, 본사만 전국입니다. 집행은 화면이 아니라 <b>데이터 경로</b>에서 합니다: 조직 색인을 돌려주는 함수가 범위로 잘린 것만 돌려주므로, 조직 목록·실적·D1~L8 표·배치 관제·표 내보내기가 전부 같은 제한을 받습니다(한 탭만 가려지는 구멍이 없습니다).<br />
        · <b>범위를 바꾸는 길은 하나입니다.</b> 머리띠에 있던 「은평지점장 / 강북지역단장 / 본사(전국)」 한 번 클릭 전환 버튼을 없앴어요 — 재인증 없이 세션 키가 바뀌었고, 목록이 고정 3인이라 다른 지점장 세션에서도 남의 지점이 열렸습니다(상향·횡이동 우회). 지금은 <b>[범위 전환 — 잠금 해제 후 재인증]</b>으로 인증 게이트를 다시 거쳐야 하고, 세션 키를 쓰는 경로는 그 게이트 하나뿐입니다. 관리자 콘솔 훅(__hifinHmOps · __hifinHmScope)도 화면과 같은 세 겹 가드(프로 세션 차단 · 미인증 거부 · 전국 비교는 본사 범위 전용)를 쓰고, 조회하면 접속 로그에 남습니다.<br />
        · <b>이 범위 제한의 한계(그대로 적습니다)</b> — 운영자 명부는 <b>시연용 합성 데이터</b>이고 실제 인사 시스템 연동이 아닙니다. 인증은 <b>서버 검증 없이</b> 이 탭 세션 안에서만 성립하므로, 기기를 쓰는 사람이 게이트에서 다른 운영자 사번을 골라 범위를 바꿀 수 있습니다 — 실운영에서는 사내 인증(SSO)과 서버측 권한 검사로 대체해야 합니다. 지금 보장되는 것은 「고른 범위 밖 데이터는 이 화면·표·콘솔 훅 어디에서도 집계되지 않는다」까지입니다.<br />
        · <b>전수와 표본을 섞지 않습니다.</b> 담당·오늘·배치·결과 7코드는 전수, 단계 분포·실적 지표는 「계산한 프로 N명」 범위, 60일 사이클은 표본 — 블록마다 배지로 구분해 적었습니다.<br />
        · <b>금액·수수료·순위는 집계하지 않습니다.</b> 실적은 단계 전진·수행률·정체 해소로만 봅니다.
      </div>
    </HmoBox>
  </div>);
}

/* ═══════════════════ 운영자 사번 게이트 — 「누가 보고 있는가」를 먼저 정한다 ═══════════════════ */
/* 프로 콘솔의 사번 게이트(HealthMate.jsx HmGate)와 같은 결로 만들었다 — 입력칸에 시연 기본값이
   값으로 채워져 있고, [인증]은 사람이 누른다(자동 제출하지 않는다). 다른 점은 하나다:
   여기서 고른 사번은 「무엇을 할 수 있는가」가 아니라 **「무엇이 보이는가」**를 정한다.
   ⚠️ 인증 전에는 집계를 시작하지 않는다 — 범위가 정해지지 않은 상태의 전국 집계를 먼저 돌려 두고
      나중에 가리는 설계는, 그 1초 동안 전국이 보이는 설계다. */
function HmoAdminGate({ onPass, onGo }) {
  const list = React.useMemo(() => { try { return (typeof hmAdminsGen === "function") ? hmAdminsGen() : []; } catch (e) { return []; } }, []);
  const demo = React.useMemo(() => { try { return (typeof hmAdminDemo === "function") ? hmAdminDemo() : null; } catch (e) { return null; } }, []);
  const DEF = (demo && demo.branch) ? demo.branch.code : (list.length ? list[0].code : "");
  const [code, setCode] = React.useState(DEF);
  const [err, setErr] = React.useState("");
  const [q, setQ] = React.useState("");
  const cur = React.useMemo(() => { try { return (typeof hmAdminOf === "function") ? hmAdminOf(code) : null; } catch (e) { return null; } }, [code]);
  /* 고른 운영자의 관리 범위 크기 — 세션에 넣기 **전에** 미리 보여 준다(무엇이 열릴지 알고 누르게) */
  const peek = React.useMemo(() => { if (!cur) return null; try { const V = hmoViewIndex(cur); return V.hq; } catch (e) { return null; } }, [cur && cur.code]);
  const hits = q.trim().length >= 2
    ? list.filter((a) => [a.code, a.name, a.title, a.roleKo, a.dan, a.branch].join("|").toUpperCase().indexOf(q.trim().toUpperCase()) >= 0).slice(0, 8)
    : [];
  const submit = (c) => {
    const raw = (c == null ? code : c);
    const r = hmoAdminSwitch(raw);          /* 세션·감사 기록은 전환 함수 한 곳에서 */
    if (!r.ok) { setErr(r.why); return; }
    onPass(r.adm);
  };
  const quick = [demo && demo.branch, demo && demo.dan, demo && demo.hq].filter(Boolean);
  return (<div className="hmowrap"><HmoStyle />
    <div className="hmohero">
      <div className="k">HEALTHMATE OPERATIONS HQ</div>
      <h2><Landmark size={19} style={{ verticalAlign: -3, marginRight: 6 }} />헬스메이트 운영본부</h2>
      <p>먼저 <b style={{ color: HMO_C.gold }}>운영자 사번</b>으로 들어오세요 — 직책에 따라 <b>보이는 범위가 다릅니다</b>.
        지점장은 자기 지점 하나와 그 소속 프로만, 지역단장은 자기 지역단, 본사 담당자만 전국을 봅니다.<br />
        <b style={{ color: HMO_C.gold }}>시연 고지</b> — 운영자 명부·회원·프로 이름은 모두 <b>시연용 합성 데이터</b>이고, 인증은 서버 검증 없이 <b>이 탭 세션</b> 안에서만 성립합니다(실운영은 사내 인증·서버측 권한 검사로 대체).</p>
    </div>
    <div className="hmocard" style={{ maxWidth: 620 }}>
      <div className="hmoct"><Lock size={14} color={HMO_C.navy} /> 운영자 사번 인증 — 관리 범위를 정합니다</div>
      <div className="hmonote" style={{ marginTop: 0 }}>운영자 사번 체계는 <b>본사 1H · 지역단장 2H · 지점장 3H</b>로 프로 사번(8H####)과 갈려 있어요(숫자가 작을수록 넓게 봅니다). 이 탭 세션에만 보관되고, 탭을 닫거나 <b>[범위 잠금 해제]</b>를 누르면 즉시 잠겨요.</div>
      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
        <input value={code} aria-label="운영자 사번" autoComplete="off" spellCheck={false}
          onChange={(e) => { setCode(e.target.value); if (err) setErr(""); }} placeholder={DEF}
          style={{ flex: 1, border: "1.5px solid #CBD5E1", borderRadius: 9, padding: "10px 12px", font: "inherit", fontSize: 14.5, fontWeight: 800, letterSpacing: 1.4, color: HMO_C.ink }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        <button className="hmobtn pri" style={{ fontSize: 13, fontWeight: 900, padding: "10px 18px" }} onClick={() => submit()}>인증</button>
      </div>
      {cur && (<div style={{ marginTop: 8, background: HMO_C.soft, border: "1px solid " + HMO_C.line, borderRadius: 10, padding: "8px 11px", fontSize: 12.3, lineHeight: 1.7, color: HMO_C.ink }}>
        <b style={{ color: HMO_C.navy }}>{cur.code}</b> — <b>{cur.name} {cur.title}</b> · 직책 {cur.roleKo} · 범위 {cur.role === "hq" ? "전국" : (cur.role === "dan" ? cur.dan : cur.dan + " " + cur.branch)}
        {cur.syn ? <span className="hmopill" style={{ background: "#FEF3E2", color: "#B45309", marginLeft: 5 }}>구 명부 보존용 버킷</span> : null}
        <div style={{ color: HMO_C.mut, marginTop: 2 }}>이 사번으로 들어가면 보이는 것 — 프로 <b style={{ color: HMO_C.ink }}>{peek ? peek.n.toLocaleString() : "-"}명</b>(활성 {peek ? peek.active : "-"}) · 담당 회원 <b style={{ color: HMO_C.ink }}>{peek ? peek.managed.toLocaleString() : "-"}명</b> · 지점 {peek ? peek.branchesReal + (peek.branchesSyn ? " + 본사 " + peek.branchesSyn : "") : "-"}곳{cur.role === "hq" ? " (전국)" : " (이 범위 밖은 집계에 들어오지 않아요)"}</div>
      </div>)}
      {err && <div style={{ color: HMO_C.red, fontSize: 12, fontWeight: 700, marginTop: 8 }}>{err}</div>}
      <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 800, color: HMO_C.navy }}>시연용 한 번 클릭 — 「지점장은 이만큼만 봅니다 → 본사는 전국을 봅니다」</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
        {quick.map((a) => (<button key={a.code} className="hmobtn" onClick={() => submit(a.code)}>
          {a.role === "hq" ? "본사 담당자로 보기" : a.title + "으로 보기"} <span style={{ color: HMO_C.mut, fontWeight: 600 }}>· {a.name} · {a.code}</span></button>))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 800, color: HMO_C.navy }}>운영자 검색 — 사번·이름·직책·지점·지역단</div>
      {/* ⚠️ 사번 예시를 리터럴로 적지 않는다. 전에는 「예:  …」이라고 적어 뒀는데 은평지점장은 실측 이고
             은 정렬 순서상 전혀 다른 지점이었다 — 시연 중 화면이 알려 준 예시를 그대로 치면 엉뚱한 지점이 열린다.
             지점장 사번은 'dan|branch' 정렬 인덱스에서 파생되므로(지점이 늘거나 줄면 뒤가 밀린다) 명부에서 뽑아 쓴다. */}
      <input className="hmoin" value={q} onChange={(e) => setQ(e.target.value)} placeholder={"예: 은평 · 지점장 · 강북지역단" + (DEF ? " · " + DEF : "")} style={{ width: "100%", boxSizing: "border-box", marginTop: 5 }} />
      {hits.map((a) => (<div key={a.code} onClick={() => submit(a.code)} role="button" tabIndex={0}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, border: "1px solid #F1F5F9", borderRadius: 9, padding: "7px 11px", marginTop: 5, cursor: "pointer", fontSize: 12 }}>
        <span><b>{a.name} {a.title}</b> <span style={{ color: HMO_C.mut }}>· {a.code}{a.dan ? " · " + a.dan : ""}</span></span>
        <span className="hmopill" style={{ background: "#EAF4FE", color: HMO_C.blue }}>{a.roleKo} · 범위 {a.scopeKo}</span>
      </div>))}
      {q.trim().length >= 2 && !hits.length && <div className="hmonote">일치하는 운영자가 없어요 — 운영자 사번은 1H·2H·3H로 시작해요.</div>}
      {/* 명부 집계는 **실사/합성을 갈라 적는다** — 이 화면은 다른 곳에서 실사(지역단 16·지점 272)와 합성 버킷(+1)을
          꼬박꼬박 갈라 적는데(hmoRollup의 dansReal/branchesReal) 여기서만 「지점장 273」이라고 합쳐 적고 있었다.
          같은 화면이 한쪽에서는 나누고 한쪽에서는 합쳐 적으면 그 자체가 집계 정의 불일치다. */}
      <div className="hmonote" style={{ marginTop: 11 }}>{(() => {
        const cnt = (r, syn) => list.filter((a) => a.role === r && !!a.syn === syn).length;
        return <>명부 {list.length.toLocaleString()}명(본사 {cnt("hq", false)} · 지역단장 실사 {cnt("dan", false)}{cnt("dan", true) ? " + 광역 버킷 " + cnt("dan", true) : ""} · 지점장 실사 {cnt("branch", false)}{cnt("branch", true) ? " + 본사 버킷 " + cnt("branch", true) : ""})</>;
      })()} — 조직 목록에서 결정론으로 생성한 <b>시연 명부</b>예요. 「광역 버킷 담당」·「본사 버킷 담당」은 실사 조직의 직책이 아니라 구 명부를 보존하기 위한 버킷 관리자라 이름에 그대로 적어 두었습니다. 이 화면은 끝까지 <b>관측 전용</b>이라, 어떤 범위로 들어오든 재배분·명단 수정·발송 기능은 없습니다.</div>
      {typeof onGo === "function" && <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
        <button className="hmobtn" onClick={() => onGo("healthmate")}>헬스메이트 센터로</button>
        <button className="hmobtn" onClick={() => onGo("home")}>처음 화면으로</button>
      </div>}
    </div>
  </div>);
}

/* 운영자 전환 — **세션을 쓰는 유일한 함수**(게이트와 전환 칩이 같은 길을 쓴다).
   형 지시(2026-10-05)로 띠의 전환 칩을 되살리되, 「범위를 바꾸는 버튼」이 아니라 **계정을 바꿔 다시 인증하는 버튼**으로 둔다.
   그래서 ①쓰기 경로는 여전히 하나이고 ②전환마다 접속 로그·해시체인에 누구로 열었는지 남고 ③화면이 「계정이 범위를 정한다」를 계속 말한다.
   시연에서 「지점장은 자기 지점만 → 본사는 전국」을 한 번 클릭으로 이어 보여 주되, 바뀐 것이 범위가 아니라 **로그인한 사람**임을 띠가 적는다. */
function hmoAdminSwitch(raw) {
  const r = (typeof hmAdminCheck === "function") ? hmAdminCheck(raw) : null;
  if (!r || !r.ok) return r || { ok: false, why: "운영자 명부를 불러오지 못했어요 — 새로고침해 주세요." };
  try { if (typeof hmoAdminSessionSet === "function") hmoAdminSessionSet(r.code); } catch (e) {}
  try { if (typeof guardLog === "function") guardLog("hmops_scope", "운영본부 범위 인증 — " + r.adm.code + " " + r.adm.title); } catch (e) {}
  try { if (typeof chainAppend === "function") chainAppend({ type: "record", token: null, note: "운영본부 접속 — " + r.adm.code + "(" + r.adm.title + " · 범위 " + r.adm.scopeKo + ")" }); } catch (e) {}
  return r;
}

/* 지금 누구로 무엇을 보고 있는가 — hero 안의 신원·범위 띠.
   ⚠️⚠️ 여기에 「은평지점장 / 강북지역단장 / 본사(전국)」 전환 버튼을 상설로 달아 뒀었다. 재인증 없이 한 번
      클릭으로 세션 키가 바뀌었다 — 실측 ① 은평지점장(3H0001) 세션에서 「본사(전국)」을 누르자 즉시 KPI가
      프로 702명·담당 회원 100,000명·접촉 락 32,855명(전국)으로 바뀌었다. 실측 ② 그 목록은 adm과 무관한
      hmAdminDemo() 고정 3인이라, 부산 금정지점장 세션에서도 「은평지점장」 버튼이 보이고 누르면 남의 지점이
      그대로 열렸다(상향뿐 아니라 **횡이동** 우회). 즉 「지점장 계정으로 들어가면 자기 지점만 보인다」는
      시연 문장을 같은 화면의 버튼이 1초 만에 반증했다.
      → 전환 버튼을 없앴다. **세션 키를 쓰는 경로는 HmoAdminGate 하나뿐**이고, 범위를 바꾸려면 잠금을 풀고
        게이트에서 다시 인증한다(게이트에는 시연용 한 번 클릭 3종이 그대로 있어 시연 동선은 유지된다).
      ⚠️ 범위를 바꾸는 버튼을 「관측 전용 화면」에 두는 것 자체가 조작이다 — 보이는 범위가 그 화면의 전부이므로.
      → 형 지시(2026-10-05)로 **시연용 계정 전환 칩**을 되살렸다. 다만 ①세션을 쓰는 함수는 hmoAdminSwitch 하나로 유지하고
        ②전환마다 접속 로그·해시체인에 남기며 ③띠가 「범위가 아니라 계정을 바꾼다」를 적는다. 범위 판정은 그대로
        인증한 계정의 직책이 하고, 데이터 경로(hmoOrgIndex·hmoScopeClamp)의 집행에는 손대지 않았다. */
function HmoScopeBar({ adm, onUnlock, onSwitch }) {
  const O = hmoOrgIndex();
  /* 시연 전환 3인(지점장·지역단장·본사) — 명부 고정값이라 누구 세션에서든 같은 세 계정이 보인다.
     이것이 「남의 지점으로 횡이동」처럼 보이지 않도록 버튼은 사번과 직책을 함께 적는다. */
  const demo3 = React.useMemo(() => { try { const d = hmAdminDemo(); return [d.branch, d.dan, d.hq].filter(Boolean); } catch (e) { return []; } }, []);
  const where = adm.role === "hq" ? "전국" : (adm.role === "dan" ? adm.dan : adm.dan + " " + adm.branch);
  return (<div className="hmoscope">
    <Lock size={14} color="#FFB25E" />
    <div style={{ flex: 1, minWidth: 220 }}>
      <b>{adm.title} {adm.name} 님</b> <span className="w">({adm.code} · {adm.roleKo})</span>
      <div className="w">관리 범위: <b style={{ color: "#FFB25E" }}>{where}</b> — 프로 {O.hq.n.toLocaleString()}명(활성 {O.hq.active}) · 담당 회원 {O.hq.managed.toLocaleString()}명 · 오늘 지시서 {O.hq.today.toLocaleString()}건{adm.role === "hq" ? " · 전국 전체" : " · 이 범위 밖 데이터는 집계에 들어오지 않아요"}</div>
    </div>
    {(demo3 || []).map((a) => (
      <button key={a.code} className={"hmosw" + (a.code === adm.code ? " on" : "")} style={{ order: 9 }}
        title={a.title + " " + a.name + " · 사번 " + a.code + " · 범위 " + a.scopeKo}
        onClick={() => { if (a.code === adm.code) return; const r = hmoAdminSwitch(a.code); if (r.ok && onSwitch) onSwitch(r.adm); }}>
        {a.code === adm.code ? "● " : ""}{a.roleKo} <b>{a.code}</b>
      </button>
    ))}
    <button className="hmosw" style={{ order: 10 }} onClick={onUnlock}>잠금 해제 — 다른 사번으로</button>
    <span className="w" style={{ width: "100%", order: 11 }}>위 버튼은 <b>시연용 계정 전환</b>이에요 — 범위를 바꾸는 것이 아니라 <b>그 계정으로 다시 인증</b>합니다(전환할 때마다 접속 로그·해시체인에 남아요). 보이는 범위는 언제나 <b>인증한 계정의 직책</b>이 정하고, 실제 운영에서는 사내 인증(SSO)이 이 자리를 대신합니다. 보던 탭은 그대로 유지돼요.</span>
  </div>);
}

/* ═══════════════════ 메인 ═══════════════════ */
function HmOpsCenterSection({ onGo }) {
  /* 접근 판정 — 「관리자 세션」만으로는 부족하다. 프로도 ADMIN 세션으로 들어오기 때문에,
     사번 잠금을 푼 세션(hmProSession)은 프로 개인으로 보고 잠금 화면만 보여 준다.
     사이드바·라우트 가드와 같은 조건을 쓴다(App.jsx) — 세 곳의 기준이 하나다. */
  const proSess = (typeof hmProSession === "function") ? hmProSession() : "";
  const admin = (typeof isAdminRole === "function") && isAdminRole() && !proSess;
  /* 두 번째 경계 — 운영자 신원(직책)으로 범위를 자른다. 세션에 운영자 사번이 없으면 게이트만 보여 준다.
     ⚠️⚠️ 신원의 원천은 **세션 하나**다(state로 복사하지 않는다). 전에는 라벨·잠금·드릴다운 깊이·탭 분기는
        React state `adm`이 정하고 숫자(hmoOrgIndex·hmoScopePros·hmoScopeNote·KPI)는 매 호출 때
        sessionStorage를 다시 읽었다. 둘을 맞춰 주는 effect가 없어 한쪽만 바뀌면 화면이
        **전국 숫자에 지점 라벨을 달았다** — 실측(은평지점장 상태에서 세션 키만 본사 사번으로 바꾸고 탭 클릭):
        머리띠 「은평지점장 … 관리 범위: 강북지역단 은평지점 — 프로 702명 · 담당 회원 100,000명」,
        조직 경로는 「여기가 관리 범위의 꼭대기예요」라면서 드릴다운에 17개 지역단이 전부 떴다(한 화면이 서로를 반박).
        → 렌더마다 세션에서 읽는다. 숫자를 만드는 함수들과 **같은 값을 같은 시점에** 본다.
        → 세션이 밖에서 바뀌면(storage·탭 복귀) 틱을 올려 다시 읽고, null이면 그대로 게이트로 돌아간다.
        → _HMO.cycle·_HMO.mids 캐시 키도 이 세션 파생 adm으로 잡히므로 「세션 기준 산출물이 다른 범위 키에
          저장되는」 어긋남이 생기지 않는다. */
  const [admTick, setAdmTick] = React.useState(0);
  void admTick;                                   /* 세션 재검사 트리거 — 값 자체는 쓰지 않는다 */
  const adm = hmoAdmin();
  const admCode = adm ? adm.code : "";
  const [tab, setTab] = React.useState(0);
  const [scope, setScopeRaw] = React.useState(() => hmoAdmRoot(hmoAdmin()));
  const [picked, setPicked] = React.useState(null);
  const [metric, setMetric] = React.useState("managed");
  const [period, setPeriod] = React.useState(6);
  const [cap, setCap] = React.useState(20);
  /* 세션이 이 화면 밖에서 바뀌는 경우(다른 탭·개발자도구·로그아웃)에도 같은 재검사를 돌린다 */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const h = () => setAdmTick((t) => t + 1);
    window.addEventListener("storage", h);
    document.addEventListener("visibilitychange", h);
    return () => { window.removeEventListener("storage", h); document.removeEventListener("visibilitychange", h); };
  }, []);
  /* 운영자가 바뀌면 선택 범위는 새 범위의 뿌리로 — 앞 사람의 선택이 남아 있으면 안 된다.
     ⚠️ 탭은 되돌리지 않는다. 전에는 setTab(0)으로 늘 조직 드릴다운으로 튀어서 「같은 탭에서 본사는 이렇게,
        지점장은 이렇게」를 보여 주려면 매번 탭을 다시 눌러야 했다(시연 리듬이 끊김). 탭 5종은 본사·지역단·지점
        어느 범위에서도 모두 열리므로(배치 탭만 구성이 다르다) 되돌릴 이유가 없다. */
  React.useEffect(() => { setScopeRaw(hmoAdmRoot(hmoAdmin())); setPicked(null); }, [admCode]);
  /* 범위 고정(clamp)을 **상태를 세울 때** 한 번 더 한다 — 데이터 경로(hmoScopePros)에도 같은 고정이 있지만,
     화면 상태가 범위 밖 값을 들고 있으면 조직 경로·제목이 범위 밖 이름을 적는다. */
  const setScope = (s) => { setScopeRaw(hmoScopeClamp(s, adm)); setPicked(null); };
  const enter = () => { setAdmTick((t) => t + 1); setScopeRaw(hmoAdmRoot(hmoAdmin())); setPicked(null); };
  const unlock = () => {
    try { if (typeof hmoAdminSessionClear === "function") hmoAdminSessionClear(); } catch (e) {}
    try { if (typeof guardLog === "function") guardLog("hmops_unlock", "운영본부 범위 잠금 해제"); } catch (e) {}
    setAdmTick((t) => t + 1); setPicked(null);
  };
  /* 렌더에 쓰는 범위는 **항상 clamp를 통과한 값**이다 — state가 어떤 이유로든 범위 밖을 들고 있어도
     라벨·조직 경로·집계가 같은 하나를 본다(라벨만 맞추는 수선은 전국 데이터를 화면에 남겨 둔다). */
  const sc = hmoScopeClamp(scope, adm);
  const codes = React.useMemo(() => ((admin && adm) ? hmoScopePros(sc).map((p) => p.code) : []),
    [admin, admCode, sc.level, sc.dan, sc.branch, sc.code]);
  const R = useHmoRows(codes, sc.level === "pro" ? 0 : cap);
  /* 프로 단위로 내려오면 그 프로 행은 바로 띄운다(표를 거치지 않고도 단계별 명단에 닿게) */
  React.useEffect(() => {
    if (!admin || !adm || sc.level !== "pro") return;
    if (picked && picked.code === sc.code) return;
    const r = _HMO.row[sc.code];
    if (r) setPicked(r);
  }, [admin, admCode, sc.level, sc.code, R.rows.length]);
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
  if (!adm) return <HmoAdminGate onPass={enter} onGo={onGo} />;
  const O = hmoOrgIndex();
  const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
  const hqRole = adm.role === "hq";
  const TABS = [[0, "조직 드릴다운", Network], [1, "단위 실적·통계", TrendingUp], [2, "D1~L8 관리 현황", Target], [3, "배치·배분 관제", Database], [4, "운영자 도구", Filter]];
  /* KPI — 본사 범위에서만 전국 스냅샷 숫자(접촉 락)를 올린다. 지점장 화면의 KPI는 전부 범위 합계다. */
  const KPI = hqRole
    ? [["조직", O.hq.dansReal + " · " + O.hq.branchesReal, "지역단(+광역 " + O.hq.dansSyn + ") · 지점(+본사 " + O.hq.branchesSyn + ")"],
       ["프로", O.hq.n.toLocaleString() + "명", "활성 " + O.hq.active + " · 교육 " + O.hq.edu + " · 정지 " + O.hq.off],
       ["담당 회원", O.hq.managed.toLocaleString() + "명", "배치 스냅샷 합계(전국)"],
       ["오늘 지시서", O.hq.today.toLocaleString() + "건", "프로당 상한 " + (S ? S.maxRoster : "-") + "건"],
       ["접촉 락", S ? S.locked.toLocaleString() + "명" : "-", "전국 · 검진결과 수령 전"],
       ["배치 상태", S ? (S.pass ? "통과" : "차단") : "-", S ? "전사 공통 · 러너 " + S.seconds + "s" : ""]]
    : [["관리 범위", adm.role === "dan" ? adm.dan : adm.branch, adm.role === "dan" ? "지역단 · 지점 " + O.hq.branchesReal + "곳" : adm.dan],
       ["프로", O.hq.n.toLocaleString() + "명", "활성 " + O.hq.active + " · 교육 " + O.hq.edu + " · 정지 " + O.hq.off],
       ["담당 회원", O.hq.managed.toLocaleString() + "명", "이 범위 소속 프로 합계"],
       ["오늘 지시서", O.hq.today.toLocaleString() + "건", "프로당 상한 " + (S ? S.maxRoster : "-") + "건"],
       ["프로당 담당", O.hq.n ? Math.round(O.hq.managed / O.hq.n).toLocaleString() + "명" : "-", "이 범위 평균"],
       ["배치 상태", S ? (S.pass ? "통과" : "차단") : "-", S ? "전사 공통 · 러너 " + S.seconds + "s" : ""]];
  return (<div className="hmowrap">
    <HmoStyle />
    <div className="hmohero">
      <div className="k">HEALTHMATE OPERATIONS HQ</div>
      <h2><Landmark size={19} style={{ verticalAlign: -3, marginRight: 6 }} />헬스메이트 운영본부</h2>
      <p>지점장 · 지역단장 · 본사 운영 담당자용 관제 센터 — <b style={{ color: HMO_C.gold }}>관측 전용</b>(조작 기능 없음) · 사번을 잠근 관리자 세션에서만 열리고, 그 안에서 <b style={{ color: HMO_C.gold }}>운영자 사번의 직책만큼</b> 보입니다{S ? ` · 기준 배치 ${S.date}` : ""}<br />
        <b style={{ color: HMO_C.gold }}>시연 고지</b> — 이 화면의 운영자·회원·프로 이름은 모두 <b>시연용 합성 데이터</b>입니다(본인 계정만 실측). 회원이 보는 화면과 외부 전달물에는 마스킹 규칙이 그대로 적용됩니다.</p>
      <HmoScopeBar adm={adm} onUnlock={unlock} onSwitch={() => enter()} />
      <div className="hmokpi">
        {KPI.map(([k, v, e], i) => (<div className="n" key={i}><b>{v}</b><span>{k}</span><em>{e}</em></div>))}
      </div>
    </div>
    <HmoCrumb scope={sc} onScope={setScope} adm={adm} />
    <div className="hmotabs">{TABS.map(([n, t, Ic]) => (
      <button key={n} className={"hmotab" + (tab === n ? " on" : "")} onClick={() => setTab(n)}><Ic size={13} /> {t}</button>))}</div>
    <div style={{ marginTop: 2 }}>
      {tab === 0 && (<HmoBox t={<><Network size={14} color={HMO_C.cyan} /> 조직 드릴다운 — {hqRole ? "본사 → 지역단 → 지점 → 프로" : (adm.role === "dan" ? adm.dan + " → 지점 → 프로" : adm.branch + " → 프로")}</>}>
        <HmoOrgDrill scope={sc} onScope={setScope} metric={metric} adm={adm} />
        <div className="hmonote">기준 숫자({metric === "managed" ? "담당 회원 수" : metric === "today" ? "오늘 지시서 건수" : "소속 프로 수"})는 「운영자 도구」에서 바꿀 수 있어요 · 위로 되돌아오기는 상단 조직 경로나 「한 단계 위로」{hqRole ? "" : "(관리 범위 안에서만)"}.</div>
      </HmoBox>)}
      {tab === 1 && <HmoUnitStats scope={sc} R={R} period={period} />}
      {tab === 2 && <HmoStageBoard scope={sc} R={R} picked={picked} onPick={setPicked} adm={adm} />}
      {tab === 3 && (<div>{hqRole ? <HmoBatchOps /> : <div><HmoBatchSystem /><HmoBatchScoped adm={adm} /></div>}<HmoCycleOps adm={adm} /></div>)}
      {tab === 4 && <HmoToolbox scope={sc} onScope={setScope} metric={metric} onMetric={setMetric} period={period} onPeriod={setPeriod} cap={cap} onCap={setCap} R={R} adm={adm} />}
    </div>
    <div className="hmonote" style={{ textAlign: "center", padding: "12px 0 4px" }}>
      집계 원천 — hmProsGen(조직) · HM_OPS_BRANCHES/HM_OPS_SNAPSHOT(배분·배치) · hmcProView/hmcProStats(단계·실적) · handoffResult(활동 결과) · cycleStage(60일 사이클) · hiEvents(퍼널). 이 화면은 원천을 더해 보여줄 뿐, 수치를 새로 만들지 않습니다.
      <div style={{ marginTop: 3 }}>지금 보고 있는 범위 — <b>{adm.title} {adm.name}</b>({adm.code}) · {hqRole ? "전국" : hmoScopeLabel(hmoAdmRoot(adm))}. 범위 밖 프로·회원은 모든 탭·모든 표에서 집계되지 않습니다(조직 색인을 돌려주는 한 함수에서 잘립니다).</div>
      <div style={{ marginTop: 3 }}>운영자·회원·프로 이름과 사번은 모두 <b>시연용 합성 데이터</b>예요(본인 계정만 실측) — 운영 담당자 화면이라 가리지 않고 전체 이름으로 보여드리고, 회원이 보는 화면과 외부 전달물에는 마스킹 규칙이 그대로 적용돼요. 표 내보내기로 뽑은 TSV에도 첫 줄에 같은 고지와 관리 범위가 붙습니다.</div>
    </div>
  </div>);
}

/* 관리자 전용 테스트 훅 — 조직 롤업이 배치 스냅샷과 어긋나지 않는지 확인용(관측 전용)
   ⚠️ 콘솔도 화면과 **같은 범위**를 받는다. 전에는 화면만 막고 콘솔은 전국을 뱉는 경우가 흔한 구멍이었다:
      지점장 세션에서 __hifinHmOps("dan")을 치면 전국 지역단 17줄이 그대로 나왔다. 이제 hmoOrgIndex()가
      범위로 잘린 색인을 돌려주므로 콘솔 출력도 같이 잘리고, 응답에 scope를 함께 적어 어느 범위의 값인지 밝힌다.
   ⚠️ "check"(배치 스냅샷 전수 정합)는 전국 합계와 비교하는 검사라 **본사 범위에서만** 열린다.
      지점 합계를 전국 총계와 비교하면 언제나 불일치가 나오고, 그 불일치는 버그가 아니라 질문이 틀린 것이다. */
try {
  if (typeof window !== "undefined") {
    window.__hifinHmOps = function (cmd, arg) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        /* 화면과 같은 경계 ① — 프로 사번 세션에서는 조직 전체 집계를 콘솔로도 꺼낼 수 없다 */
        if (typeof hmProSession === "function" && hmProSession()) return { error: "pro session — 사번 잠금 후 사용" };
        /* 화면과 같은 경계 ② — 운영자 사번 인증 전에는 범위가 없으므로 아무 집계도 내주지 않는다 */
        const adm = hmoAdmin();
        if (!adm) return { error: "운영본부에서 운영자 사번(본사 1H · 지역단장 2H · 지점장 3H)을 먼저 인증하세요 — 범위가 정해지지 않으면 집계하지 않습니다" };
        const scope = { admin: adm.code, title: adm.title, role: adm.role, dan: adm.dan || null, branch: adm.branch || null };
        const O = hmoOrgIndex();
        if (cmd === "who") return { scope, pros: O.hq.n, managed: O.hq.managed, branches: O.hq.branches, dans: O.hq.dans };
        if (cmd === "org") return { scope, hq: O.hq, dans: Object.keys(O.dans).length, branches: Object.keys(O.branches).length };
        if (cmd === "dan") return { scope, rows: Object.values(O.dans).map((d) => ({ dan: d.key, pros: d.n, active: d.active, managed: d.managed, today: d.today, branches: Object.keys(d.branches).length })) };
        if (cmd === "branch") return { scope, rows: Object.values(O.branches).map((b) => ({ branch: b.branch, dan: b.dan, pros: b.n, active: b.active, managed: b.managed, today: b.today })) };
        if (cmd === "row") {
          /* 범위 밖 사번은 색인에 없으므로 행이 만들어지지 않는다 — 그 사실을 에러로 분명히 적는다 */
          const r = hmoProRow(arg);
          return r || { scope, error: "이 범위의 프로가 아니에요: " + String(arg) };
        }
        if (cmd === "check") {
          if (adm.role !== "hq") return { scope, error: "배치 스냅샷 전수 정합 검사는 본사 범위에서만 — 지점·지역단 합계는 전국 총계와 비교 대상이 아닙니다" };
          const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
          const A = hmoOrgIndexAll();
          return { scope, managedSum: A.hq.managed, snapTotal: S ? S.total : null, managedMatch: !!S && A.hq.managed === S.total,
            prosAll: A.hq.n, snapProsAll: S ? S.prosAll : null, prosMatch: !!S && A.hq.n === S.prosAll };
        }
        return { scope, error: "who | org | dan | branch | row <사번> | check(본사 전용)" };
      } catch (e) { return { error: String(e).slice(0, 180) }; }
    };
    /* 범위 모델 확인 — 지금 인증된 범위가 무엇을 보는지. 본사 범위에서만 「운영자 3명 비교 + 전국 합계」를 연다.
       ⚠️⚠️ 전에는 여기가 **범위 제한을 통째로 우회하는 창구**였다. 형제 훅 __hifinHmOps는 ①프로 세션
          ②운영자 미인증 ③본사 전용(check)까지 세 겹으로 막아 뒀는데, 이 함수는 isAdminRole()만 보고
          hmoViewIndex(3종)와 hmoOrgIndexAll()을 직접 불러 결과를 그대로 뱉었다. 실측(2026-10-05):
          **운영자 사번을 아직 하나도 넣지 않은 게이트 화면에서** __hifinHmScope() → nationwide
          {pros:702, managed:100000, dans:17, branches:273} + hq{702·10만·4,516건} + dan{강북 70명·9,645명}.
          은평지점장(3H0001) 세션에서도 같은 값이 나왔다. 화면이 스스로 적어 둔 보장 문구
          「고른 범위 밖 데이터는 이 화면 어디에서도 집계되지 않는다」와 「인증 전에는 아무것도 집계하지 않는다」가
          둘 다 이 한 함수에서 깨졌고, guardLog 기록도 없어 감사 흔적조차 남지 않았다.
          → 지금은 __hifinHmOps와 **같은 세 겹 가드**를 쓰고, 조회 사실을 접속 로그에 남긴다.
       ⚠️ 세션을 건드리지 않는다(hmoViewIndex에 레코드를 직접 넘긴다) — 확인하려고 범위를 바꿔 버리면 안 된다.
       ⚠️ 이 비교를 노드 하네스(scripts/)로 옮기는 안은 **이 번들에서는 성립하지 않는다** — src/는 단일 Babel
          모듈로 조립돼 함수가 window에 없고, 노드 측에서 hmAdminsGen/hmoViewIndex를 직접 부를 길이 없다
          (실측: page.evaluate에서 ReferenceError). 그래서 훅은 남기고 **가드를 같게** 맞추는 쪽을 택했다. */
    window.__hifinHmScope = function () {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        /* 화면과 같은 경계 ① — 프로 사번 세션 */
        if (typeof hmProSession === "function" && hmProSession()) return { error: "pro session — 사번 잠금 후 사용" };
        /* 화면과 같은 경계 ② — 운영자 사번 인증 전에는 범위가 없다 */
        const adm = hmoAdmin();
        if (!adm) return { error: "운영본부에서 운영자 사번(본사 1H · 지역단장 2H · 지점장 3H)을 먼저 인증하세요 — 범위가 정해지지 않으면 집계하지 않습니다" };
        if (typeof hmAdminDemo !== "function") return { error: "운영자 명부 미탑재" };
        try { if (typeof guardLog === "function") guardLog("hmops_scope_probe", "범위 모델 조회 — " + adm.code + " " + adm.title); } catch (e) {}
        const one = (a) => {
          if (!a) return null;
          const V = hmoViewIndex(a);
          return { admin: a.code, title: a.title, role: a.role, dan: a.dan || null, branch: a.branch || null,
            pros: V.hq.n, active: V.hq.active, managed: V.hq.managed, today: V.hq.today,
            dans: Object.keys(V.dans).length, branches: Object.keys(V.branches).length };
        };
        const mine = one(adm);
        /* 화면과 같은 경계 ③ — 전국 합계·남의 범위 비교는 본사 범위에서만 */
        if (adm.role !== "hq") return { mine, note: "지점장·지역단장 범위에서는 자기 범위 하나만 돌려줍니다 — 운영자 3명 비교와 전국 합계는 본사 범위에서만 열립니다(화면과 같은 경계)." };
        const d = hmAdminDemo();
        const all = hmoOrgIndexAll();
        return { mine, branch: one(d.branch), dan: one(d.dan), hq: one(d.hq),
          nationwide: { pros: all.hq.n, managed: all.hq.managed, dans: all.hq.dans, branches: all.hq.branches },
          admins: hmAdminsGen().length };
      } catch (e) { return { error: String(e).slice(0, 180) }; }
    };
  }
} catch (e) {}
