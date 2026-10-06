/* ══════════════ 운영본부 질의 응답 엔진(hmOpsAsk.js) — 형 지시 2026-10-05 ⑦ ══════════════
   지시 두 줄 —
     ① 「은평지점 현황 보여줘」처럼 말하면 **그 화면을 띄워 줄 것**(범위·탭을 그 단위로 옮긴다).
     ② 「은평지점 오늘의 지시서 이행율 보여 줘」처럼 물으면 **조사해서 답할 것**(하이가 계산해 숫자로).

   ⚠️ 이 파일은 운영본부(HmOpsCenter)의 **두 번째 창구**다. 화면 가드를 통과한 숫자만 꺼낼 수 있어야 한다.
      그래서 다음 다섯 가지를 구조로 못박았다 —
        ① 조직 이름은 **hmoOrgIndex()(= 지금 인증된 직책으로 이미 잘린 색인)에서만** 찾는다.
           `hmoOrgIndexAll()`은 **절대 쓰지 않는다** — 전체 색인으로 이름을 찾으면 「범위 밖이라 못
           보여준다」고 답하는 과정에서 그 단위의 **존재**를 확인해 주게 된다(범위 제한이 아니라 범위 「표시」).
           범위 안에서 못 찾으면 그것이 곧 거절 사유이고, 하이는 그 단위가 세상에 있는지 없는지 말하지 않는다.
        ② 숫자는 **범위 통과 함수만** 쓴다(hmoScopePros · hmoProRow · hmoResultAgg · hmoCycleAgg).
           hmcProView/hmcProStats를 직접 부르면 앞단의 색인 조회(범위 가드)를 건너뛰어 다른 지점 사번의
           행이 만들어진다 — hmoProRow가 캐시보다 범위 확인을 먼저 하도록 고쳐 둔 이유가 그것이다.
        ③ 숫자를 낸 답에는 **①숫자 ②집계 정의 한 줄 ③범위·기준일**을 늘 함께 적는다(hmoaTail 한 곳에서 만든다).
        ④ 조회 사실은 guardLog("hmops_ask", …)에 남긴다 — 화면 밖 창구도 콘솔 훅과 같은 감사 기준.
        ⑤ 관측 전용이다. 배정·재배분·등급 수정·발송은 **만들지 않는다**(거절 문안만 둔다).

   ⚠️ 가장 큰 함정은 성능이 아니라 **이름**이다(조사 실측) —
        · 「은평」은 범위 안에서도 은평·은평중앙·은평TC·은평제일 **4개 지점의 접두**다.
        · 「중부지점」은 강북지역단과 영남지역단 **두 곳에 실재**한다. 지점명만으로 모으면 남의 지역단 프로가
          섞여 들어온다(조사 중 실제로 70명 대신 71명이 모였고 hmoProRow의 범위 가드만이 막아 줬다).
      → 조직명은 자체 오타 사전 없이 **완전일치 → 유일 최장 접두 → 되묻기**만 한다. 회원 NLU의 음성 오인식
        보정(hiMishearNorm)·오타 사전은 건강·보험 어휘용이라 조직명에 태우지 않는다.
      → 지점·지역단 목록은 리터럴로 적지 않고 **매번 색인에서 뽑는다**(지점이 늘거나 줄면 사번·정렬이 밀린다).

   ⚠️ 저장 키를 새로 만들지 않는다 — 운영본부는 「관측 전용이라 저장 키를 새로 만들지 않는다」가 _HMO 캐시
      주석에 명시돼 있고, 새 키를 만들면 dataCatalog 등재까지 번진다. 화면 이동 신호는 **전역 CustomEvent
      하나**(hifin:hmops)이고 sessionStorage·상설 전역 함수(window.__hifinHmOpsGo 류)는 두지 않는다
      — `__hifinHmScope`가 범위 제한을 통째로 우회했던 전례가 그 종류였다. */

/* ── 탭 번호(0~4 고정) — 화면 TABS와 같은 순서 ── */
const HMOA_TABS = [
  { n: 0, ko: "① 조직 드릴다운" },
  { n: 1, ko: "② 단위 실적·통계" },
  { n: 2, ko: "③ D1~L8 관리 현황" },
  { n: 3, ko: "④ 배치·배분 관제" },
  { n: 4, ko: "⑤ 운영자 도구" },
];
function hmoaTabKo(n) { const t = HMOA_TABS.find((x) => x.n === n); return t ? t.ko : "①"; }

/* ── 비용 게이트(조사 실측) ──
   프로 행(hmoProRow) = 첫 호출 986~1,486ms(10만 코호트 시군구 색인 1회 구축) + 프로당 중앙값 12ms.
   오늘 로스터(hmDailyRoster) = 프로당 29~71ms(중앙값 ~33ms).
   화면의 점진 계산은 한 틱 5명씩 끊어 돌지만 **하이의 동기 집계는 메인 스레드를 통째로 잡는다**.
   그래서 프로 수로 가른다 — ≤12명 즉시 / 13~80명 계산하고 걸린 시간을 적음 / 80명 초과는 계산하지 않고
   탭을 열어 「집계 계산」 버튼으로 넘긴다(강북지역단 70명 2.2초 · 전국 702명 9~10초 · 로스터는 전국 23초). */
const HMOA_FAST = 12, HMOA_SLOW = 80, HMOA_ROSTER_MAX = 12;

function hmoaN(n) { return (n == null || isNaN(n)) ? "-" : Number(n).toLocaleString(); }
/* 비율 포맷터는 **이 한 곳**이다 — 화면 블록(HmOpsCenter)도 이 함수를 부른다.
   ⚠️ 전에는 화면이 Math.round(정수)·하이가 소수 1자리였다. 같은 모집단(정체 57명 / 담당 600명)인데
      화면 「10%」·하이 「9.5%」가 같은 운영자에게 동시에 보였다 — ops-console 규약 「집계는 원천과 일치」는
      **표기까지** 포함해야 운영자가 같은 숫자로 읽는다. 정의가 둘이면 한쪽만 고쳐져서 다시 갈라진다. */
function hmoaPct(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
function hmoaPctKo(a, b) { const p = hmoaPct(a, b); return p == null ? "-" : p + "%"; }
/* 단위 명사도 한 곳에서 꺼낸다 — 같은 지표를 화면은 「회」, 하이는 「건」으로 적던 어긋남을 없앤다 */
const HMOA_UNIT = { touches: "회", stallFixed: "명", cards: "건", today: "건", result: "건", pros: "명", managed: "명" };
function hmoaU(k) { return HMOA_UNIT[k] || ""; }
/* 부하 배율 정의문 — **화면과 하이가 같은 문장을 쓴다**(한 곳에서 만든다).
   ⚠️ 배율의 분모는 「어느 범위의 프로당 평균인가」다. 하이는 선택 단위 평균, 화면 ④는 관리 범위 평균을
      쓰면서 둘 다 「이 범위 평균 대비」라고 적어, 같은 지점의 배율이 1.45와 1.09로 갈렸다(실측).
      숫자를 억지로 하나로 만들 수는 없다(모집단이 다르다) — 그래서 **기준 범위를 문장에 이름으로 박는다**. */
/* ⚠️ 「집계 정의 — 」 머리말은 **붙이지 않는다** — 화면 HmoDef가 이미 그 머리말을 달고 있어서
   같이 붙이면 「집계 정의 — 집계 정의 —」가 된다(실측). 하이 쪽에서만 머리말을 붙여 쓴다. */
function hmoaLoadDef(unitKo, baseLabel, avg) {
  return unitKo + "이고, 배율은 「" + baseLabel + "」의 프로당 평균(" + hmoaN(avg) + "명/프로) 대비예요 — 기준 범위가 다르면 같은 지점도 배율이 달라지니 이 이름을 함께 읽어 주세요(전국 평균 대비 배율은 본사 범위 전용이에요). 담당 0인 프로도 분모에 들어가요(교육중·정지·스냅샷 미등재).";
}
/* 회원 축 숫자를 답할 때 늘 붙는 한 줄 — 「인원은 답하고 명단은 대화로 꺼내지 않는다」는 경계를
   운영자가 매번 볼 수 있게 한다(거절은 묻지 않은 질의에도 경계가 있다는 사실을 알려 주는 쪽이 안전하다). */
const HMOA_NOLIST = "회원 한 분 단위(이름·연락처·검진값)와 명단은 제가 대화로 꺼내지 않아요 — 인원까지만 답하고 명단 화면은 ③ D1~L8 관리 현황 탭에서만 봐요.";
function hmoaToday() { try { return new Date().toISOString().slice(0, 10); } catch (e) { return ""; } }
function hmoaSnapDate() { try { return (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT.date : ""; } catch (e) { return ""; } }

/* 운영자 표기 — 「누구 범위로 답한 것인가」. 계정 전환 뒤에도 직전 답과 구별되도록 사번·직책을 함께 적는다
   (세션 신원은 state로 복사하지 않고 매번 hmoAdmin()에서 읽는 구조라, 전환 전 답이 대화에 그대로 남는다). */
function hmoaWho(adm) { return adm ? (adm.title + " " + adm.code) : "미인증"; }

/* 범위·기준일 꼬리말 — 숫자를 낸 답에는 **반드시** 이 줄이 붙는다(한 곳에서 만들어 빠뜨릴 수 없게) */
function hmoaTail(ctx, extra) {
  const d = hmoaSnapDate(), t = hmoaToday();
  const dateNote = (d && t && d !== t) ? ("기준 배치 " + d + "(오늘 " + t + " — 날짜가 스냅샷과 달라 「오늘」은 「현재 기준 로스터」라는 뜻이에요)") : ("기준일 " + (d || t));
  return "범위 — " + ctx.label + " · 답한 계정 " + hmoaWho(ctx.adm) + " · " + dateNote + (extra ? " · " + extra : "");
}

/* ═══════════════════ 조직 단위 해석 ═══════════════════ */
/* ⚠️ 모집단은 hmoOrgIndex() 하나다(이미 직책으로 잘려 있다). 전체 색인은 이 파일에 등장하지 않는다. */
function hmoaIndex() { try { return (typeof hmoOrgIndex === "function") ? hmoOrgIndex() : null; } catch (e) { return null; } }

/* 조직명 정규화 — 공백 제거 + 접미(지점·지역단) 분리. 오타 사전·음성 보정은 **태우지 않는다**. */
function hmoaCore(name, suf) { return String(name || "").replace(/\s+/g, "").replace(suf, ""); }

/* 질의에서 조직 단위를 읽는다.
   돌려주는 kind —
     "ok"      해석 성공 → scope·label
     "ambig"   후보 여럿 → cands(범위 안의 것만) 되묻기
     "out"     이름은 말했는데 범위 안에 없음 → 거절(존재 여부는 말하지 않는다)
     "up"      전국·본사를 물었지만 직책이 그 위가 아님 → 거절
     "admcode" 운영자 사번(1H·2H·3H)을 입력 → 계정 전환 안내(조직 질의가 아니다)
     null      조직 이름이 없음 → 지금 보던 범위(또는 관리 범위 뿌리)로 답한다 */
function hmoaUnit(q, adm) {
  const qs = String(q || "").replace(/\s+/g, "");
  const qu = qs.toUpperCase();
  const O = hmoaIndex();
  if (!O) return null;
  /* ① 운영자 사번 우선 — 조직 질의가 아니라 「계정 전환」이다(1H 본사 · 2H 지역단장 · 3H 지점장) */
  const am = qu.match(/[123]H\d{4}/);
  if (am) return { kind: "admcode", said: am[0] };
  /* ② 프로 사번(8H####) — 범위 안에 있어야 한다 */
  const pm = qu.match(/8H\d{4}/);
  if (pm) {
    const p = O.list.find((x) => x.code === pm[0]);
    if (!p) return { kind: "out", said: pm[0] };
    return { kind: "ok", unit: "pro", scope: { level: "pro", dan: p.dan, branch: p.branch, code: p.code },
      label: p.branch + " " + p.name + " 프로(" + p.code + ")" };
  }
  /* ③ 전국·본사 — 본사 직책만 열린다(그 밖은 거절. 전국의 존재는 누구나 아는 사실이라 숨길 대상이 아니다) */
  if (/전국|전사|본사전체|본사범위/.test(qs) || /^본사/.test(qs)) {
    if (adm && adm.role === "hq") return { kind: "ok", unit: "hq", scope: { level: "hq" }, label: "본사 전체(전국)" };
    return { kind: "up", said: /전국|전사/.test(qs) ? "전국" : "본사" };
  }
  /* ④ 「내 범위」류 — 관리 범위의 뿌리.
     ⚠️ 전에는 이 분기가 ⑤(명시 조직명)보다 **먼저 이기고 끝났다**. 그래서 「우리 지역단 은평지점 현황
        보여줘」가 한마디 언급 없이 「본사 전체(전국)」로 답해졌다(실측 1H0001) — 이 파일이 가장 경계한다고
        적어 둔 「엉뚱한 숫자에 그 이름이 붙는」 바로 그 종류다. 지금은 범위 토큰을 지운 문장에서 명시 조직명을
        한 번 더 보고, **둘이 동시에 잡히면 옮기지 않고 되묻는다**(어느 쪽을 버려도 운영자의 말과 달라진다). */
  if (HMOA_SELF.test(qs)) {
    const r = (typeof hmoAdmRoot === "function") ? hmoAdmRoot(adm) : { level: "hq" };
    const selfLabel = (typeof hmoScopeLabel === "function") ? hmoScopeLabel(r) : "내 범위";
    const alt = hmoaNamedUnit(String(q || "").replace(HMOA_SELF_CUT, " "), O);
    if (alt && alt.kind === "ok" && !hmoaScopeEq(alt.scope, r)) return { kind: "ambig", cands: [selfLabel, alt.label] };
    return { kind: "ok", unit: "self", scope: r, label: selfLabel };
  }
  return hmoaNamedUnit(q, O);
}

/* 범위 토큰(「내 범위」류) — 판정과 제거를 같은 자리에서 관리한다(둘이 어긋나면 위 ④가 조용히 틀린다) */
const HMOA_SELF = /내범위|제범위|우리범위|내관할|우리관할|관리범위|내지점|우리지점|저희지점|내지역단|우리지역단|저희지역단/;
const HMOA_SELF_CUT = /(내|제|우리|저희)\s*(범위|관할|지점|지역단)|관리\s*범위/g;

/* 명시 조직명 해석(⑤~ⓓ) — hmoaUnit에서 떼어냈다. 범위 토큰이 섞인 문장에서도 **같은 규칙으로** 한 번 더
   돌려 보기 위해서다(규칙이 두 벌이 되면 한쪽만 고쳐져 라벨이 갈린다). */
function hmoaNamedUnit(q, O) {
  const qs = String(q || "").replace(/\s+/g, "");
  if (!O) return null;
  /* ⑤ 지역단·지점 이름 — **고쳐서 단정하지 않는다**. 세 걸음뿐이다:
        ⓐ 접미(지점·지역단)가 붙은 **명시 토큰**은 색인의 공식 이름과 완전일치(또는 그 이름으로 끝날 때)만 인정
        ⓑ 접미 없이 말했으면 **토큰 단위 완전일치**(「은평」 = 은평지점의 핵심 이름)
        ⓒ 접두는 **후보가 하나일 때만** 채택하고, 여럿이면 옮기지 않고 되묻는다
     ⚠️ ⓐ를 「부분 문자열 포함」으로 하면 조용히 틀린다 — 은평지점장 색인에 은평지점 하나만 있을 때
        「은평중앙지점 보여줘」가 '은평'을 품고 있다는 이유로 **은평지점**을 띄웠다(실측). 범위 제한이 아니라
        **라벨이 틀리는** 사고이고, 이 화면이 가장 경계해 온 종류다. 그래서 접미가 붙은 이름은 이름 전체로만 본다.
     ⚠️ scope에 dan을 **반드시** 함께 넣는다 — O.branches 키가 `dan + "|" + branch`이고 중부지점은
        강북지역단·영남지역단 두 곳에 실재하므로 지점명만 보내면 엉뚱한 지점이 열린다. */
  const dans = Object.keys(O.dans);
  const brs = Object.keys(O.branches).map((k) => O.branches[k]);
  const mkDan = (d) => ({ t: "dan", label: d, dan: d, scope: { level: "dan", dan: d } });
  const mkBr = (b) => ({ t: "branch", label: b.dan + " " + b.branch, dan: b.dan, branch: b.branch,
    scope: { level: "branch", dan: b.dan, branch: b.branch } });
  const one = (x) => ({ kind: "ok", unit: x.t, scope: x.scope, label: x.label });
  const pick = (l) => (l.length === 1 ? one(l[0]) : { kind: "ambig", cands: l.map((x) => x.label) });
  /* 토큰 — 공백·구두점으로 끊는다. 접미가 붙은 이름은 토큰 안에서 전부 뽑는다(붙여 쓴 입력도 잡힌다). */
  const toks = [], said = [];
  String(q || "").split(/[\s,.·\/()\[\]「」『』"'?!~]+/).forEach((tk) => {
    const t = tk.replace(/\s+/g, "");
    if (!t) return;
    const re = /([가-힣A-Za-z0-9]+?)(지점|지역단)/g; let m;
    while ((m = re.exec(t))) said.push({ name: m[1] + m[2], t: m[2] === "지점" ? "branch" : "dan" });
    const bare = t.replace(/(에서|으로|로|의|은|는|이|가|을|를|도|만|과|와|요)$/, "");
    if (bare.length >= 2) toks.push(bare);
    if (t.length >= 2 && toks.indexOf(t) < 0) toks.push(t);
  });
  /* ⓐ 명시 토큰 — 이름 전체가 일치하거나, 토큰이 그 이름으로 끝날 때만(「우리은평지점」 → 은평지점) */
  if (said.length) {
    const findDan = (nm) => dans.filter((d) => nm === d || nm.slice(-d.length) === d).sort((a, b) => b.length - a.length);
    const findBr = (nm) => brs.filter((b) => nm === b.branch || nm.slice(-b.branch.length) === b.branch);
    let danHit = null, danFail = null, brHits = null, brFail = null;
    said.filter((s) => s.t === "dan").forEach((s) => { const f = findDan(s.name); if (f.length) { if (!danHit) danHit = f[0]; } else if (!danFail) danFail = s.name; });
    said.filter((s) => s.t === "branch").forEach((s) => {
      const f = findBr(s.name);
      if (!f.length) { if (!brFail) brFail = s.name; return; }
      const mx = Math.max.apply(null, f.map((b) => b.branch.length));
      let top = f.filter((b) => b.branch.length === mx);
      if (danHit) { const nr = top.filter((b) => b.dan === danHit); if (nr.length) top = nr; }   /* 「강북지역단 중부지점」 */
      if (!brHits) brHits = top;
    });
    if (brFail) return { kind: "out", said: brFail };
    if (danFail) return { kind: "out", said: danFail };
    if (brHits) return pick(brHits.map(mkBr));
    if (danHit) return one(mkDan(danHit));
  }
  /* ⓑ 접미 없는 토큰 — 핵심 이름 완전일치 */
  const danCore = {}, brCore = {};
  dans.forEach((d) => { const c = hmoaCore(d, /지역단$/); (danCore[c] || (danCore[c] = [])).push(d); });
  brs.forEach((b) => { const c = hmoaCore(b.branch, /지점$/); (brCore[c] || (brCore[c] = [])).push(b); });
  for (const t of toks) {
    if (brCore[t]) return pick(brCore[t].map(mkBr));
    if (danCore[t]) return pick(danCore[t].map(mkDan));
  }
  /* ⓒ 접두 — **후보가 하나일 때만** 채택. 지표 어휘로 읽히는 토큰은 건너뛴다(엉뚱한 지점이 열리지 않게). */
  for (const t of toks) {
    if (hmoaMetric(t)) continue;
    const pre = [].concat(
      ...Object.keys(brCore).filter((c) => c.indexOf(t) === 0).map((c) => brCore[c].map(mkBr)),
      ...Object.keys(danCore).filter((c) => c.indexOf(t) === 0).map((c) => danCore[c].map(mkDan)));
    if (pre.length) return pick(pre);
  }
  /* ⓓ 프로 이름 — 완전일치(동명이인이면 되묻기) */
  const nm = O.list.filter((p) => p.name && p.name.length >= 2 && qs.indexOf(p.name) >= 0);
  if (nm.length) {
    const mk = (p) => ({ t: "pro", label: p.branch + " " + p.name + " 프로(" + p.code + ")",
      scope: { level: "pro", dan: p.dan, branch: p.branch, code: p.code } });
    return pick(nm.map(mk));
  }
  return null;
}

/* 해석한 scope가 지금 직책 안인지 — 화면과 **같은 함수**(hmoScopeClamp)로 판정한다.
   clamp는 범위 밖이면 조용히 뿌리로 되돌리므로, 「되돌아갔다」는 사실 자체가 범위 밖이라는 뜻이다.
   ⚠️ 조용한 되돌림에만 의지하면 「은평지점으로 옮겼어요」라고 말한 뒤 화면은 뿌리에 있는 상황이 생긴다
      — 그래서 여기서 먼저 걸러 내고, 실패하면 이동 신호를 **아예 쏘지 않는다**. */
/* scope 객체 비교 — **새 모델을 만들지 않는다**. 화면이 쓰는 네 가지 모양 그대로다:
   {level:"hq"} · {level:"dan",dan} · {level:"branch",dan,branch} · {level:"pro",dan,branch,code} */
function hmoaScopeEq(a, b) {
  if (!a || !b) return false;
  return a.level === b.level && (a.dan || "") === (b.dan || "")
    && (a.branch || "") === (b.branch || "") && (a.code || "") === (b.code || "");
}
function hmoaInScope(scope, adm) {
  if (!scope) return false;
  try {
    const c = (typeof hmoScopeClamp === "function") ? hmoScopeClamp(scope, adm) : scope;
    return hmoaScopeEq(c, scope);
  } catch (e) { return false; }
}

/* ═══════════════════ 지표 사전 ═══════════════════ */
/* pat = 공백 제거한 질의에 거는 정규식 · tab = 그 숫자가 사는 탭 · cost = "free"(즉시) / "rows"(프로 행 집계)
   / "roster"(오늘 로스터) / "cycle"(사이클) / "none"(원천 없음·금지) */
/* ⚠️ 이 배열은 **첫 매치가 이긴다**(순서가 곧 우선순위다). 그래서 두 규칙을 지킨다 —
     ① 좁은 지표(담당 회원·이행율)를 넓은 지표(소속 프로·발행 건수) **앞에** 둔다.
     ② 범용 토큰(`인원`·`몇명`·`활성`)은 어느 pat에도 혼자 들어가지 않는다. 축을 가르는 명사
        (회원·프로)를 반드시 품은 형태로만 적는다.
   ⚠️ 「매치 길이가 긴 것이 이긴다」(패턴 특이도)로 바꾸는 안은 **쓰지 않았다** — 대표 지시 ②의 그 질문
      「은평지점 오늘의 지시서 이행율」에서 today의 `오늘의지시서`(6자)가 fulfil의 `이행율`(3자)을 이겨
      발행 건수로 답한다(설계 검증). 질문의 **끝에 오는 지표어**가 묻는 것이라서, 길이가 아니라
      이 사전의 순서가 우선순위다. 새 지표를 넣을 때는 「더 좁은 쪽을 위로」만 지키면 된다.
   ⚠️ 겹침 실측(고쳐 둔 사고) — pros가 managed보다 앞이고 pros.pat에 `인원`·`몇명`이 있던 동안
      「담당 회원 몇 명이에요?」가 전부 「소속 프로 4명」으로 답해졌다(화면 KPI는 담당 600명). */
const HMOA_METRICS = [
  { k: "fulfil",  tab: 3, cost: "free",   pat: /이행율|이행률|이행현황|지시서이행|이행이|수행했/ },
  { k: "opened",  tab: 3, cost: "free",   pat: /열람율|열람률|열람|열어본|지시서를연|확인한프로/ },
  { k: "roster",  tab: 3, cost: "roster", pat: /로스터|오늘구성|등급구성|제외사유|왜7건|왜7|후보수/ },
  { k: "today",   tab: 3, cost: "free",   pat: /오늘지시서|오늘의지시서|지시서건수|발행건수|오늘카드|오늘몇건|지시서몇/ },
  { k: "cycle",   tab: 3, cost: "cycle",  pat: /사이클|60일|T5|동의율|만기도달|무보장|골든타임회복|2차골든/ },
  { k: "load",    tab: 3, cost: "free",   pat: /부하|프로당|평균담당|배율|균형|쏠림|과부하/ },
  { k: "batch",   tab: 3, cost: "free",   pat: /배치상태|발행가능|러너|배치통과|배치는|조립위반/ },
  { k: "stage",   tab: 2, cost: "rows",   pat: /단계분포|단계별|D1~L8|D1-L8|D1L8|단계현황|단계는/ },
  { k: "stall",   tab: 2, cost: "rows",   pat: /정체|막힌단계|체류|정체율|멈춘/ },
  { k: "held",    tab: 2, cost: "rows",   pat: /접촉락|연락금지|락인원|락은|락이/ },
  { k: "ready2",  tab: 2, cost: "rows",   pat: /첫연결대기|신호도래|하이신호|고위험|위험관리/ },
  { k: "family",  tab: 2, cost: "rows",   pat: /가족단위|가구|쇼핑연계|쇼핑/ },
  { k: "result",  tab: 1, cost: "free",   pat: /7코드|결과코드|결과기록|활동결과|R1|결과남긴/ },
  { k: "accept",  tab: 1, cost: "free",   pat: /수락률|수락율|후속약속|후속일/ },
  /* `\d칸` — 사전이 늘면 「6칸 몇 건이에요」가 미매치로 다른 지표에 떨어진다(형 지시 2026-10-06) */
  { k: "golden",  tab: 1, cost: "free",   pat: /전달체크|완주율|골든타임전달|\d칸/ },
  { k: "adv",     tab: 1, cost: "rows",   pat: /전진|전진율|실적은|실적을|실적이/ },
  { k: "perf",    tab: 1, cost: "rows",   pat: /시한준수|준수율|첫연결수행|만기터치|수행률|수행율|SLA/i },
  /* `만족도`를 혼자 두면 「고객 만족도 지수」(원천 없음)가 조용히 「회원 평가 별점」으로 답해졌다 —
     지표 이름이 다르면 답하지 않고 되묻는 쪽이 맞다(실측: 4.8★이 만족도 지수로 읽혔다). */
  { k: "touch",   tab: 1, cost: "rows",   pat: /접촉시도|정체해소|회원평가|별점|회원만족도|평가별점/ },
  { k: "grade",   tab: 1, cost: "free",   pat: /등급분포|HM1|HM2|HM3|HM4|모집자격|자격보유|커버공백|겸임/ },
  /* managed가 pros **앞**이다 — 「담당 회원 몇 명」·「우리 지점 회원 수」는 회원 축 질문이다 */
  { k: "managed", tab: 0, cost: "free",   pat: /담당회원|담당인원|회원수|회원은몇|회원몇|담당은몇|담당몇|회원인원|관리회원/ },
  { k: "pros",    tab: 0, cost: "free",   pat: /프로수|소속프로|프로는몇|프로몇|프로인원|활성프로|교육중프로|정지프로|프로현황/ },
  { k: "snap",    tab: 0, cost: "free",   pat: /미등재|스냅샷어긋|지점수차이|0건지점|오늘0/ },
  { k: "nation",  tab: 3, cost: "free",   pat: /전국단계분포|전국분포|수식분포/ },
  { k: "feed",    tab: 3, cost: "free",   pat: /제공DB|피드|무결성|스키마검사|사전밖/i },
  { k: "harness", tab: 3, cost: "free",   pat: /하네스|금지어|골든셋|드리프트|대본품질/ },
  { k: "weekly",  tab: 3, cost: "free",   pat: /학습루프|주간학습|과다사용|미사용승인|개선후보/ },
  { k: "funnel",  tab: 3, cost: "free",   pat: /퍼널|완결퍼널|이벤트집계/ },
  { k: "sla",     tab: 3, cost: "free",   pat: /시한티어|48시간|재큐|응답시한은|시한규칙/ },
  /* 원천이 없거나 설계상 집계하지 않는 것 — 지어내지 않고 「없다」고 답한다 */
  { k: "x_contact", tab: null, cost: "none", pat: /통화성공|연결률|연결율|접촉성공|통화시각|통화소요|통화기록/ },
  /* 원가·획득비용 어휘는 **명시 거절**이 안전하다 — 빠지면 unknown으로 떨어져 「범위 안내」가 나오고,
     운영자는 「물어보면 알려 주는 것인가」를 알 수 없다(원가 비노출 규약은 경계를 보여 주는 쪽이다). */
  { k: "x_rank",    tab: null, cost: "none", pat: /순위|등수|몇등|랭킹|금액|수수료|원가|매출|수입|커미션|인센티브|CAC|고객획득|획득비용|마진|단가|송객|LTV|ROAS|객단가/i },
  { k: "x_dept",    tab: null, cost: "none", pat: /사업단/ },
];
function hmoaMetric(q) {
  const qs = String(q || "").replace(/\s+/g, "");
  for (const m of HMOA_METRICS) if (m.pat.test(qs)) return m;
  return null;
}

/* ═══════════════════ 집계 — 전부 범위 통과 함수만 쓴다 ═══════════════════ */
function hmoaCtx(adm, scope, label) {
  const pros = (typeof hmoScopePros === "function") ? hmoScopePros(scope) : [];
  return { adm, scope, label, pros, codes: pros.map((p) => p.code), O: hmoaIndex() };
}
/* 범위 합계 — 담당·오늘·상태는 색인 그대로다(활성·교육중·정지를 인원에서 빼지 않는다) */
function hmoaRoll(ctx) {
  const r = { n: ctx.pros.length, active: 0, edu: 0, off: 0, managed: 0, today: 0, inSnap: 0, lic: 0, gap: 0, byGrade: {} };
  ctx.pros.forEach((p) => {
    if (p.status === "활성") r.active++; else if (p.status === "교육중") r.edu++; else if (p.status === "정지") r.off++;
    r.managed += p.managed; r.today += p.today; if (p.inSnap) r.inSnap++; if (p.lic) r.lic++; if (p.gap) r.gap++;
    r.byGrade[p.grade] = (r.byGrade[p.grade] || 0) + 1;
  });
  return r;
}
/* 오늘 결과 기록 — 사번별 저장 키를 **날짜로 걸러** 센다(hmrStats는 날짜를 쪼개 주지 않는다).
   ⚠️ 캐시하지 않는다. 프로가 방금 남긴 기록이 캐시에 가려 0으로 보이면 「집계는 원천과 일치」가 깨진다.
      비용은 사번당 저장 키 1회 읽기 — 702명 전수 3ms(실측)라 사실상 0이다. */
function hmoaResultOn(codes, date) {
  let rows = 0, all = 0; const by = {};
  codes.forEach((c) => {
    let l = []; try { l = (typeof _hmrAll === "function") ? _hmrAll(c) : []; } catch (e) { l = []; }
    all += l.length;
    l.forEach((r) => { if (r && r.date === date) { rows++; by[r.result] = (by[r.result] || 0) + 1; } });
  });
  return { rows, all, by };
}
/* ── 오늘의 지시서 이행율 — **화면과 하이가 같은 이 함수 하나만 쓴다**(형 지시 ②의 그 지표) ──
   ⚠️⚠️ 전에는 분자·분모가 **서로 다른 모집단**이었다. 분모는 스냅샷의 오늘 발행 합인데 분자는 그 사번의
      오늘자 결과 **전부**여서, 담당 밖·전일 카드 기록이 섞이면 비율이 100%를 넘었다(실측: 8H0001 키에
      오늘자 40건을 심으니 「발행 28건 · 결과 40건 → 142.9%」). 이행율이 100%를 넘는 숫자는 운영자가
      무엇을 본 것인지 알 수 없게 만든다.
   ⚠️⚠️ 그렇다고 분자를 「**지금** 로스터에 실린 회원 ∩ 오늘자 결과」로 잡으면 **언제나 0**이다 —
      결과를 남긴 회원은 hmrRosterAdjust가 그날 로스터에서 내려 버린다(R7 완결·R1 D+7 재큐·R3 쉬어가기·
      R5 번호 확인). 즉 「일을 한 카드는 보드에서 사라진다」. 실측으로 확인했다(로스터 회원 3명에게 오늘자
      R1·R7을 심었더니 교집합 0건 · 그 3건은 전부 「로스터 밖」으로 셌다).
   → 그래서 **오늘 발행된 카드의 모집단을 이렇게 정의한다**:
        분모 = 지금 보드에 남은 카드 + 오늘 결과로 내려간 카드(= 분자)
        분자 = 오늘자 결과 7코드 중 **그 프로의 담당 회원**인 행(회원 중복은 1건)
     담당 밖 기록은 분자·분모 어디에도 넣지 않고 「담당 밖 N건」으로 따로 적는다.
     이 정의는 분자가 분모에 포함되므로 **100%를 넘을 수 없다**(상한이 수식에서 나온다).
   ⚠️ 비용 — 로스터 조립이 프로당 약 33ms라 프로 수가 상한(HMOA_ROSTER_MAX)을 넘으면 이 계산을 하지 않고
      「스냅샷 발행 ÷ 오늘자 결과 전부」로 적되 **교집합을 확인하지 않았다고 쓰고** 비율을 100%로 캡한다. */
function hmoaFulfil(pros, date, force) {
  const list = pros || [];
  const codes = list.map((p) => p.code);
  const snapIssued = list.reduce((a, p) => a + (p.today || 0), 0);
  const strict = codes.length > 0 && (!!force || codes.length <= HMOA_ROSTER_MAX);
  const t0 = Date.now();
  let live = 0, done = 0, outside = 0, todayRows = 0;
  const by = {};
  codes.forEach((c) => {
    let l = []; try { l = (typeof _hmrAll === "function") ? _hmrAll(c) : []; } catch (e) { l = []; }
    l = l.filter((r) => r && r.date === date);
    todayRows += l.length;
    l.forEach((r) => { by[r.result] = (by[r.result] || 0) + 1; });
    if (!strict) return;
    /* 담당 회원 집합 — 「이 프로의 카드였는가」를 가르는 유일한 키(회원 식별자는 결과 행의 i뿐이다) */
    let mine = null;
    try {
      const ids = (typeof hmMembersOfPro === "function") ? hmMembersOfPro(c) : null;
      if (ids) { mine = {}; ids.forEach((i) => { mine[i] = 1; }); }
    } catch (e) { mine = null; }
    const seen = {};
    l.forEach((r) => {
      const i = Number(r.i);
      if (mine && !mine[i]) { outside++; return; }
      if (!seen[i]) { seen[i] = 1; done++; }
    });
    try {
      const R = (typeof hmDailyRoster === "function") ? hmDailyRoster(c, date) : null;
      if (R && R.list) live += R.list.length;
    } catch (e) {}
  });
  const issued = strict ? (live + done) : snapIssued;
  const num = strict ? done : todayRows;
  const raw = hmoaPct(num, issued);
  return { strict, pros: codes.length, issued, snapIssued, live, num, todayRows, by,
    outside: strict ? outside : null, over: !strict && todayRows > snapIssued,
    pct: raw == null ? null : Math.min(100, raw), ms: Date.now() - t0 };
}
/* 오늘 지시서를 연 프로 — Today 보드 1회 노출 플래그(hifin_handoff_issued_{사번}_{날짜}).
   ⚠️ 건수가 아니라 **프로 1/0 플래그**라 「카드 몇 건을 봤나」는 알 수 없다. */
function hmoaOpened(codes, date) {
  let n = 0;
  codes.forEach((c) => { try { if (localStorage.getItem("hifin_handoff_issued_" + c + "_" + date)) n++; } catch (e) {} });
  return n;
}
/* 전사(전국) 숫자를 문장에 붙여도 되는 범위인가 — **본사 담당자 범위에서만** 참이다.
   ⚠️ 화면은 이미 이 규칙을 지킨다(⑤ 운영자 도구 「전국 조직 규모는 본사 담당자 범위에서만 표기해요」 ·
      ④ 비hq 상자는 전사 평균을 띄우지 않는다). 하이만 지키지 않아서 지점장 세션에서
      「전사로는 색인 702명 중 스냅샷 648명」·「전사 평균 6.97건」이 나왔고, 648 × 6.97 ≈ 4,516으로
      **전국 오늘 발행 건수가 역산**됐다(실측). 그래서 네 자리(snap·today·batch·held)가 이 한 함수를 본다. */
function hmoaHq(ctx) { return !!(ctx && ctx.adm && ctx.adm.role === "hq"); }
/* 프로 행 집계 — 반드시 hmoProRow 경유(범위 가드가 캐시보다 앞에 있다). 걸린 시간을 함께 돌려준다. */
function hmoaRows(ctx) {
  const t0 = Date.now();
  const rows = ctx.codes.map((c) => { try { return hmoProRow(c); } catch (e) { return null; } }).filter(Boolean);
  const sum = (typeof hmoSumRows === "function") ? hmoSumRows(rows) : null;
  return { rows, sum, ms: Date.now() - t0 };
}

/* ═══════════════════ 지표별 답변 ═══════════════════ */
/* 각 함수는 {lines, buttons?} 를 돌려준다. 꼬리말(범위·기준일)은 호출자가 붙인다. */
const HMOA_ANS = {
  /* ── 오늘의 지시서 이행율 — 형 지시 ②의 바로 그 지표 ──
     ⚠️ 분모는 튼튼하고 분자는 비어 있다. 분모(발행 건수)는 스냅샷과 라이브 로스터가 일치하지만, 분자로
        쓸 수 있는 **유일한 실기록**은 결과 7코드이고 시연 환경에서는 702 사번 전수 0건이다(실측).
        그대로 숫자만 읽히면 「지점이 일을 안 했다」로 읽힌다 → 분모·분자·정의·기록 위치를 한 묶음으로 답한다.
     ⚠️ 접촉(원탭)은 세션 메모리이고 hiEvents에는 사번·조직이 없어 **분자로 쓸 수 없다**. */
  fulfil: function (ctx) {
    const r = hmoaRoll(ctx), d = hmoaToday();
    const F = hmoaFulfil(ctx.pros, d);
    const op = hmoaOpened(ctx.codes, d);
    return { lines: [
      ctx.label + " 오늘의 지시서 이행율 — 오늘 발행 " + hmoaN(F.issued) + "건 중 결과를 남긴 카드 " + hmoaN(F.num) + "건 → " +
        (F.pct == null ? "분모가 0이라 비율을 내지 않아요" : F.pct + "%") + "예요.",
      F.strict
        ? "집계 정의 — 분모 = **오늘 발행된 카드** = 지금 보드에 남은 카드 " + hmoaN(F.live) + "건 + 오늘 결과로 내려간 카드 " + hmoaN(F.num) + "건이에요(결과를 남긴 카드는 그날 로스터에서 내려가요 — R7 완결 · R1 D+7 재큐 · R3 쉬어가기 · R5 번호 확인). 분자 = 오늘자 결과 7코드 중 **그 프로의 담당 회원**인 행(회원 중복은 1건)이고, 분자가 분모에 들어 있어 **100%를 넘을 수 없어요**(라이브 조립 " + F.ms + "ms · 프로 " + F.pros + "명)."
          + (F.outside ? " 오늘자 기록 중 " + hmoaN(F.outside) + "건은 그 프로의 담당 회원이 아니어서 분자·분모 어디에도 넣지 않았어요(담당 밖 기록)." : "")
          + (F.snapIssued !== F.issued ? " 배치 스냅샷의 오늘 발행 합은 " + hmoaN(F.snapIssued) + "건이에요 — 라이브 조립과 다른 이유는 ①완결된 카드 자리에 다른 후보가 채워지거나 ②스냅샷 기준일이 오늘과 다르기 때문이에요(온디맨드 조립이라 「발행 로그」가 따로 없어요)." : "")
        : "집계 정의 — 분모 = 배치 스냅샷의 사번별 오늘 발행 건수 합(프로당 상한 7건) · 분자 = 오늘자 결과 7코드 행 수예요. ⚠️ 프로 " + F.pros + "명(로스터 조립 상한 " + HMOA_ROSTER_MAX + "명)이라 **담당 회원과의 교집합은 확인하지 않았어요** — 담당 밖·전일 카드 기록이 분자에 섞일 수 있어서 비율은 100%로 캡해 적어요(프로당 33ms라 전국은 23초 멈춰요). 지점 단위로 좁혀 물어보시면 교집합까지 재서 답해 드려요."
          + (F.over ? " 실제로 오늘자 기록 " + hmoaN(F.todayRows) + "건 > 스냅샷 발행 " + hmoaN(F.snapIssued) + "건이라 분모 밖 기록이 섞여 있어요." : ""),
      "선행 지표 — 오늘 지시서를 연 프로 " + op + "/" + r.n + "명(Today 보드 1회 노출 플래그). 프로 1/0이라 「몇 건을 봤나」는 알 수 없어요. 접촉(원탭)·통화는 조직·날짜로 가를 키가 없어서 분자로 쓰지 않아요.",
      "⚠️ 이 기록은 브라우저 localStorage에 쌓여요 — 프로가 자기 기기에서 남긴 기록은 이 기기에 없어요. 지금 답은 「이 기기에 모인 기록 기준」이고, 실운영에서는 서버 집계로 바뀌어야 해요." +
        (F.num === 0 && F.issued > 0 ? " 그래서 0%는 「일을 안 했다」가 아니라 「이 기기에 기록이 없다」는 뜻이에요." : "") +
        " 같은 숫자를 " + hmoaTabKo(3) + " 탭 「오늘의 지시서 이행율」 블록에서도 보실 수 있어요(화면과 제가 같은 함수를 써요).",
    ], buttons: ["오늘 지시서 발행 건수", "결과 7코드 분포"] };
  },
  opened: function (ctx) {
    const r = hmoaRoll(ctx), d = hmoaToday();
    const op = hmoaOpened(ctx.codes, d);
    return { lines: [
      ctx.label + " 오늘 지시서 열람 — " + op + "/" + r.n + "명(" + (hmoaPct(op, r.n) == null ? "-" : hmoaPct(op, r.n) + "%") + ")이 오늘 지시서를 열었어요.",
      "집계 정의 — 분자 = Today 보드가 1회 노출될 때 남는 플래그(hifin_handoff_issued_사번_날짜)를 가진 프로 수 / 분모 = 범위 소속 프로 수예요. 프로 1/0 플래그라 「카드 몇 건을 봤나」는 셀 수 없고, 열람은 이행의 **선행** 지표예요.",
    ], buttons: ["오늘의 지시서 이행율"] };
  },
  today: function (ctx) {
    const r = hmoaRoll(ctx);
    const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
    return { lines: [
      ctx.label + " 오늘 지시서 발행 " + hmoaN(r.today) + "건 — 프로 " + r.n + "명" + (r.n ? "(프로당 평균 " + (Math.round(r.today / r.n * 100) / 100) + "건)" : "") + "이에요.",
      "집계 정의 — 배치 스냅샷(HM_OPS_BRANCHES)의 사번별 today 합이에요. 라이브 대체 원천은 hmDailyRoster(사번, 날짜).list.length이고 프로당 상한은 " + (S ? S.maxRoster : 7) + "건이에요." +
        (hmoaHq(ctx) && S ? " 전사 평균은 " + S.avgRoster + "건이고, 그 숫자는 본사 범위에서만 적어요." : ""),
    ], buttons: ["오늘의 지시서 이행율", "왜 담당은 많은데 오늘은 몇 건이에요?"] };
  },
  managed: function (ctx) {
    const r = hmoaRoll(ctx);
    return { lines: [
      ctx.label + " 담당 회원 " + hmoaN(r.managed) + "명 — 프로 " + r.n + "명" + (r.n ? "(프로당 평균 " + hmoaN(Math.round(r.managed / r.n)) + "명)" : "") + "이에요.",
      "집계 정의 — 배치 스냅샷을 사번으로 조인해 범위 프로의 managed를 더한 값이에요. 지역단·지점 귀속은 스냅샷에 없어 항상 프로 명부(hmProsGen) 기준이에요." +
        (r.inSnap < r.n ? " 이 범위에는 스냅샷 미등재 프로가 " + (r.n - r.inSnap) + "명 있어 담당 0·오늘 0으로 집계돼요(결함이 아니라 교육중·정지 등 비활성 사유예요)." : ""),
      HMOA_NOLIST,
    ], buttons: ["오늘 지시서 발행 건수", "프로당 담당 부하"] };
  },
  /* ⚠️ 프로 수 답에 **담당 회원 수를 함께** 적는다 — 「인원」류 질문이 프로 수로 답해졌을 때 운영자가
     화면 KPI(담당 600명)와 어긋나는 숫자(프로 4명)만 보고도 어느 축의 답인지 바로 알 수 있게. */
  pros: function (ctx) {
    const r = hmoaRoll(ctx);
    return { lines: [
      ctx.label + " 소속 프로 " + r.n + "명 — 활성 " + r.active + " · 교육중 " + r.edu + " · 정지 " + r.off + "명이에요(이 프로들이 맡은 담당 회원은 " + hmoaN(r.managed) + "명).",
      "집계 정의 — hmProsGen() 귀속 프로 전원이에요(**사람 수**예요 — 회원 수가 아니에요). 활성·교육중·정지는 status 필드 그대로이고 **인원에서 빼지 않아요**(교육중·정지는 담당 0·오늘 0으로 들어가요).",
    ], buttons: ["담당 회원 수", "프로 등급 분포"] };
  },
  grade: function (ctx) {
    const r = hmoaRoll(ctx);
    const ks = Object.keys(r.byGrade).sort();
    const mk = ks.map((k) => k + " " + r.byGrade[k] + "명").join(" · ");
    return { lines: [
      ctx.label + " 프로 등급 분포 — " + (mk || "-") + " (모집자격 보유 " + r.lic + "/" + r.n + "명 · 겸임 커버 " + r.gap + "명)이에요.",
      "집계 정의 — 범위 프로를 등급(HM1~HM4)·모집자격(lic)·겸임 커버(gap)로 센 분포예요. 원천은 조직 색인에 이미 들어 있어 추가 계산이 없어요.",
    ], buttons: ["소속 프로 수"] };
  },
  load: function (ctx) {
    const r = hmoaRoll(ctx);
    const avg = r.n ? r.managed / r.n : 0;
    const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
    if (ctx.scope.level === "hq" && S) {
      const top = (S.loadBySido || []).slice(0, 3).map((x) => x.sido + " " + x.perPro + "명(배율 " + x.ratio + ")").join(" · ");
      return { lines: [
        "전국 프로당 평균 담당 " + S.loadAvg + "명 — 배율은 " + S.loadRatioMin + "~" + S.loadRatioMax + "배 사이예요. 상위 " + top + ".",
        "집계 정의 — 시도별 담당 합 ÷ 그 시도 프로 수이고, 배율은 **전국 평균 대비**예요(본사 범위 전용 — 지점 라벨을 붙이면 안 되는 숫자예요).",
      ], buttons: ["배치 상태"] };
    }
    /* 범위 안에서의 배율 — **그 범위 평균** 대비다(전국 평균 대비는 본사 범위 전용) */
    const unit = ctx.scope.level === "dan" ? "branch" : "pro";
    const rows = [];
    if (unit === "branch") {
      const bs = {};
      ctx.pros.forEach((p) => { const b = bs[p.branch] || (bs[p.branch] = { k: p.branch, n: 0, managed: 0 }); b.n++; b.managed += p.managed; });
      Object.keys(bs).forEach((k) => { const b = bs[k]; rows.push({ k: k, per: b.n ? b.managed / b.n : 0 }); });
    } else ctx.pros.forEach((p) => rows.push({ k: p.name + "(" + p.code + ")", per: p.managed }));
    rows.sort((a, b) => b.per - a.per);
    const fmt = (x) => x.k + " " + hmoaN(Math.round(x.per)) + "명(배율 " + (avg ? Math.round(x.per / avg * 100) / 100 : "-") + ")";
    return { lines: [
      ctx.label + " 프로당 평균 담당 " + hmoaN(Math.round(avg)) + "명 — 가장 많은 쪽 " + (rows[0] ? fmt(rows[0]) : "-") + " · 가장 적은 쪽 " + (rows.length > 1 ? fmt(rows[rows.length - 1]) : "-") + "이에요.",
      "집계 정의 — " + hmoaLoadDef(unit === "branch" ? "지점별 담당 합 ÷ 그 지점 프로 수" : "프로별 담당 회원 수", ctx.label, Math.round(avg)),
      "⚠️ " + hmoaTabKo(3) + " 탭의 「부하 균형」 상자는 **관리 범위 평균**이 분모라, 같은 지점이라도 배율이 제 숫자와 다를 수 있어요 — 두 상자 모두 기준 범위 이름을 적어 두었으니 그 이름으로 비교해 주세요.",
    ], buttons: ["담당 회원 수"] };
  },
  snap: function (ctx) {
    const r = hmoaRoll(ctx);
    const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
    const miss = ctx.pros.filter((p) => !p.inSnap);
    return { lines: [
      ctx.label + " 스냅샷 미등재 프로 " + miss.length + "/" + r.n + "명" + (miss.length ? " — " + miss.slice(0, 6).map((p) => p.name + "(" + p.code + " · " + p.status + ")").join(" · ") + (miss.length > 6 ? " 외 " + (miss.length - 6) + "명" : "") : "") + "이에요.",
      "집계 정의 — 배치 스냅샷에 담당 배정이 없는 프로예요(담당 0·오늘 0으로 집계돼요). 차이는 교육중·정지 프로와 스냅샷에 없는 지점이에요 — 「오늘 0건」 지점이 보이면 결함이 아니라 이 사유예요." +
        (hmoaHq(ctx) && S ? " 전사로는 색인 " + hmoaN(S.prosAll) + "명 중 스냅샷 " + hmoaN(S.pros) + "명이고, 그 숫자는 본사 범위에서만 적어요." : ""),
    ], buttons: ["소속 프로 수"] };
  },
  /* ── 결과 7코드(실기록) ── */
  result: function (ctx) {
    const a = (typeof hmoResultAgg === "function") ? hmoResultAgg(ctx.codes) : null;
    if (!a) return { lines: ["결과 기록 집계기를 불러오지 못했어요."] };
    const d = hmoaToday(), on = hmoaResultOn(ctx.codes, d);
    const mk = a.codes.filter((c) => c.n > 0).map((c) => c.icon + " " + c.k + " " + c.ko + " " + c.n + "건").join(" · ");
    return { lines: [
      ctx.label + " 활동 결과 7코드 — 누적 " + hmoaN(a.n) + "건" + (a.n ? "(" + mk + ")" : "") + " · 그중 오늘 " + on.rows + "건이에요.",
      "집계 정의 — 프로가 「결과 남기기」로 직접 남긴 **실기록**만이에요(사번별 저장 키 1회 읽기 · 702명 전수 3ms). 기록이 없으면 0으로 두고 추정하지 않아요.",
      a.n === 0 ? "⚠️ 이 기기에는 기록이 아직 0건이에요 — 기록은 프로 각자의 브라우저 localStorage에 쌓이고, 실운영에서는 서버 집계로 바뀌어야 해요." :
        "수락률 " + (a.acceptRate == null ? "-" : a.acceptRate + "%") + " · 후속 약속 " + a.followUps + "건.",
    ], buttons: ["수락률", "골든타임 전달 체크 완주율"] };
  },
  accept: function (ctx) {
    const a = (typeof hmoResultAgg === "function") ? hmoResultAgg(ctx.codes) : null;
    if (!a) return { lines: ["결과 기록 집계기를 불러오지 못했어요."] };
    const conn = (a.by.R1 || 0) + (a.by.R7 || 0) + (a.by.R2 || 0) + (a.by.R3 || 0);
    return { lines: [
      ctx.label + " 수락률 " + (a.acceptRate == null ? "분모가 0이라 비율을 내지 않아요" : a.acceptRate + "%") + " — 연결 " + conn + "건 중 수락(R1 연결·수락 + R7 완결 확인) " + ((a.by.R1 || 0) + (a.by.R7 || 0)) + "건 · 후속 약속 " + a.followUps + "건이에요.",
      "집계 정의 — 분모는 **연결된 건만**이에요(R1+R7+R2 보류+R3 거절). 부재(R4)·번호 오류(R5)·락 확인(R6)은 분모에서 빠져요. 후속 약속은 followUp 날짜가 적힌 행 수예요.",
    ], buttons: ["결과 7코드 분포"] };
  },
  golden: function (ctx) {
    const a = (typeof hmoResultAgg === "function") ? hmoResultAgg(ctx.codes) : null;
    if (!a) return { lines: ["결과 기록 집계기를 불러오지 못했어요."] };
    const pct = hmoaPct(a.gFull, a.gRows);
    /* 숫자와 항목 이름을 **같은 사전에서 생성**한다 — 종전에는 둘 다 문자열로 복제돼 있어
       숫자만 고치면 하이가 「6칸」이라 말하면서 5개만 열거했다(형 지시 2026-10-06) */
    const GK = (typeof HMR_GOLDEN_KEYS !== "undefined") ? HMR_GOLDEN_KEYS : [];
    /* ⚠️ 헤드라인에 현재 사전 길이(「6칸 모두 체크」)를 쓰지 않는다 — 분자는 기록 시점 사전을
       따르므로 라벨이 분자와 다른 기준을 말하게 된다(적대적 리뷰 실증 2026-10-06). 기준별 분해를
       같은 답변 안에서 낭독한다. */
    const fg = a.gFullByGn || {};
    const fgKo = Object.keys(fg).sort().map((k) => k + "칸 사전 " + fg[k] + "건").join(" · ");
    return { lines: [
      ctx.label + " D2 골든타임 전달 체크 완주율 " + (pct == null ? "체크가 있는 행이 0건이라 비율을 내지 않아요" : pct + "%") + " — 체크가 하나라도 있는 행 " + a.gRows + "건 중 **전부 체크(기록 시점 기준)** " + a.gFull + "건이에요" + (fgKo ? " (기준별 — " + fgKo + " · 현재 사전 " + GK.length + "칸)" : "") + ".",
      "집계 정의 — 현재 " + GK.length + "칸은 " + GK.map((g) => g.ko).join(" · ") + "이에요(HMR_GOLDEN_KEYS). 결과 기록과 같은 실기록 원천이에요.",
      "완주 기준 칸 수는 **기록 시점 사전**을 따릅니다 — 「건강관리 동의 요청」 칸은 2026-10-06 신설이라, 그 전 기록에는 칸이 없어서 0건이 미이행은 아니에요. 그래서 헤드라인도 「6칸」이 아니라 「전부 체크(기록 시점 기준)」로 말해요.",
      "분모는 전달 체크를 **한 칸이라도 누른 D2 통화 행**이에요 — 한 칸도 누르지 않은 통화는 이 비율에 들어가지 않아요(그래서 체크를 안 하는 프로가 많아지면 비율은 올라갑니다).",
    ], buttons: ["결과 7코드 분포"] };
  },
  /* ── 프로 행 집계(비용 게이트 통과 후) ── */
  stage: function (ctx, R) {
    const stages = (typeof HM_STAGES !== "undefined") ? HM_STAGES : [];
    const s = R.sum;
    const mk = stages.map((x) => x.k + " " + hmoaN(s.byStage[x.k] || 0)).join(" · ");
    return { lines: [
      ctx.label + " D1~L8 단계 분포(담당 " + hmoaN(s.n) + "명 전건) — " + mk + "이에요.",
      "집계 정의 — 범위 프로 " + s.pros + "명의 담당 회원 전건을 단계 판정(cohortStageOf)해 센 인원이에요. 접촉 락 " + hmoaN(s.held) + "명 · 첫 연결 대기 " + hmoaN(s.ready) + "명 · 하이 신호 도래 " + hmoaN(s.signals) + "명 · 고위험 관리 " + hmoaN(s.riskHi) + "명.",
      HMOA_NOLIST,
    ], buttons: ["정체 많은 프로", "접촉 락 인원"] };
  },
  stall: function (ctx, R) {
    const s = R.sum;
    const top = R.rows.slice().sort((a, b) => b.stall - a.stall).slice(0, 3);
    const blocked = {};
    R.rows.forEach((r) => { if (r.blocked) blocked[r.blocked] = (blocked[r.blocked] || 0) + r.blockedN; });
    const bk = Object.keys(blocked).sort((a, b) => blocked[b] - blocked[a])[0];
    return { lines: [
      ctx.label + " 정체 " + hmoaN(s.stall) + "명 / 담당 " + hmoaN(s.n) + "명(정체율 " + (hmoaPct(s.stall, s.n) == null ? "-" : hmoaPct(s.stall, s.n) + "%") + ") · 평균 체류 " + (s.stallDays == null ? "-" : s.stallDays + "일") + (bk ? " · 가장 막힌 단계 " + bk + "(" + blocked[bk] + "명)" : "") + "이에요.",
      "집계 정의 — 정체 = 같은 단계에 30~90일 머문 회원이고, 정체율은 담당 전건 대비예요. 평균 체류일은 값이 있는 프로만 평균해요(0을 섞어 희석하지 않아요). " + HMOA_NOLIST,
      (s.stall && top.length && ctx.scope.level !== "pro") ? "정체가 많은 프로 — " + top.filter((r) => r.stall > 0).map((r) => r.name + "(" + r.code + ") " + r.stall + "명" + (r.blocked ? " · 막힌 단계 " + r.blocked + " " + r.blockedN + "명" : "")).join(" · ") + "." : "",
    ].filter(Boolean), buttons: ["D1~L8 단계 분포", "정체 해소 건수"] };
  },
  held: function (ctx, R) {
    const s = R.sum;
    const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
    return { lines: [
      ctx.label + " 접촉 락 " + hmoaN(s.held) + "명 / 담당 " + hmoaN(s.n) + "명(" + (hmoaPct(s.held, s.n) == null ? "-" : hmoaPct(s.held, s.n) + "%") + ")이에요.",
      "집계 정의 — D1 중 검진대비보험 가입자(검진 결과 수령 전)로 **연락 금지** 상태예요. 결과가 들어오면 하이가 자동으로 풀어요." +
        (hmoaHq(ctx) && S ? " 전국 스냅샷 값은 " + hmoaN(S.locked) + "명이고, 그 숫자는 조직 축이 없어 본사 범위에서만 적어요." : ""),
      HMOA_NOLIST,
    ], buttons: ["D1~L8 단계 분포"] };
  },
  ready2: function (ctx, R) {
    const s = R.sum;
    return { lines: [
      ctx.label + " 첫 연결 대기 " + hmoaN(s.ready) + "명 · 하이 신호 도래 " + hmoaN(s.signals) + "명 · 고위험 관리 " + hmoaN(s.riskHi) + "명이에요(담당 " + hmoaN(s.n) + "명 기준).",
      "집계 정의 — 첫 연결 대기 = D2 중 18% 시드 · 신호 도래 = D2~D4의 하이 신호(cohortSignalOf) · 고위험 = 암 또는 위험 3등급 이상이면서 D3·D4·L5인 회원이에요. " + HMOA_NOLIST,
    ], buttons: ["D1~L8 단계 분포"] };
  },
  family: function (ctx, R) {
    const s = R.sum;
    /* family·shop은 hmoSumRows가 합하지 않으므로 여기서 센다(정의는 hmcProView 원본 그대로).
       ⚠️ hmcProView를 직접 부르는 유일한 자리라서, **R.rows(이미 hmoProRow의 범위 가드를 통과한 행)의
          사번만** 넘긴다. ctx.codes를 그대로 넘기면 가드를 건너뛰어 다른 지점 사번의 행이 만들어진다. */
    let fam = 0, shop = 0;
    R.rows.forEach((r) => {
      try {
        const v = (typeof hmcProView === "function") ? hmcProView(r.code) : null;
        if (v) { fam += v.family.length; shop += v.shop.length; }
      } catch (e) {}
    });
    return { lines: [
      ctx.label + " 가족 단위 관여 " + hmoaN(fam) + "명 · 쇼핑 연계 " + hmoaN(shop) + "명이에요(담당 " + hmoaN(s.n) + "명 기준).",
      "집계 정의 — 가족 = L6이거나 가구 3인 이상의 D4·L5 · 쇼핑 = D4·L5의 60% 시드와 D3의 12% 시드예요. 운영본부 화면에는 아직 블록이 없고 원천만 있어서, 여기서만 답해 드려요.",
    ], buttons: ["D1~L8 단계 분포"] };
  },
  adv: function (ctx, R) {
    const s = R.sum;
    const mk = (s.adv6 || []).map((m) => m.ym + " " + hmoaN(m.n)).join(" · ");
    return { lines: [
      ctx.label + " 단계 전진 6개월 합 " + hmoaN(s.advTotal) + "건(전진율 " + (hmoaPct(s.advTotal, s.n) == null ? "-" : hmoaPct(s.advTotal, s.n) + "%") + ")" + (mk ? " — " + mk : "") + "이에요.",
      "집계 정의 — 전진 = 다음 단계로 넘어간 건수(기준월 2026-08 고정)이고 전진율은 담당 전건 대비예요.",
      "⚠️ 이 값은 담당 규모·등급에서 파생한 **시연 분포**예요 — 실적 실기록이 아니에요. 실기록으로 답할 수 있는 건 결과 7코드와 오늘 발행 건수뿐이에요.",
    ], buttons: ["결과 7코드 분포"] };
  },
  perf: function (ctx, R) {
    const s = R.sum;
    return { lines: [
      ctx.label + " 응답 시한 준수율 " + (s.slaRate == null ? "-" : s.slaRate + "%") + " · 첫 연결 수행률 " + (s.firstRate == null ? "-" : s.firstRate + "%") + " · 만기 터치 수행률 " + (s.expireRate == null ? "-" : s.expireRate + "%") + "예요.",
      "집계 정의 — 값이 있는 프로만 평균해요(0을 섞어 희석하지 않아요).",
      "⚠️ 전부 등급 기본값 ± 시드 지터에서 파생한 **시연 분포**예요. 실제 통화 시각 기록이 없어서 「시한 내 응답했는가」의 실기록은 아직 없어요 — 이 숫자를 「이행율」로 읽으시면 시연 분포가 실기록으로 둔갑해요.",
    ], buttons: ["오늘의 지시서 이행율", "결과 7코드 분포"] };
  },
  touch: function (ctx, R) {
    const s = R.sum;
    return { lines: [
      ctx.label + " 접촉 시도 누계 " + hmoaN(s.touches) + hmoaU("touches") + " · 정체 해소 " + hmoaN(s.stallFixed) + hmoaU("stallFixed") + " · 회원 평가 " + (s.stars == null ? "-" : "★" + s.stars) + "이에요.",
      "집계 정의 — 접촉 시도는 전진 합 × 2.4 파생, 평가는 3.9 + 성과율 파생이에요(단위는 지표 사전 HMOA_UNIT에서 꺼내 화면 ② 탭과 같게 적어요 — 같은 숫자를 「회」와 「건」으로 갈라 적지 않습니다).",
      "⚠️ 「회원 평가」는 시연 분포 별점이에요 — 「고객 만족도 지수」 같은 다른 이름의 지표는 원천이 없어서, 이름이 다르면 제가 바꿔 답하지 않고 되물어요.",
      "⚠️ 전부 **시연 분포**예요(실기록 아님).",
    ], buttons: ["단계 전진 건수"] };
  },
  /* ── 오늘 로스터 ── */
  roster: function (ctx) {
    const d = hmoaToday(), t0 = Date.now();
    const acc = { managed: 0, candidates: 0, locked: 0, preResult: 0, offCycle: 0, unpublishable: 0, resultSkipped: 0, followUpBoost: 0,
      d2Quota: 0, matQuota: 0, d2Cand: 0, d2OpenCand: 0, d2OpenSeated: 0, dashD2: 0, hCand: 0, cards: 0, byGrade: {} };
    /* 쿼터·상한 상수 — 로스터가 counts.win으로 내보낸다. 폴백은 상수 부재 시에만 쓰이는 값이다 */
    let W = { d2: 3, mat: 1, max: 7, target: 5 };
    ctx.codes.forEach((c) => {
      let r = null; try { r = (typeof hmDailyRoster === "function") ? hmDailyRoster(c, d) : null; } catch (e) { r = null; }
      if (!r) return;
      acc.cards += r.list.length;
      /* 키 배열에 preResult를 넣지 않고 문장만 고치면 하이가 「접촉 금지 단계 제외 undefined」를 말하고,
         배열만 고치면 더 조용히 틀린다 — 아래 분해 문장은 **산술 등식 낭독**이다(형 지시 2026-10-06) */
      ["managed", "candidates", "locked", "preResult", "offCycle", "unpublishable", "resultSkipped", "followUpBoost",
        "d2Quota", "matQuota", "d2Cand", "d2OpenCand", "d2OpenSeated", "dashD2", "hCand"].forEach((k) => { acc[k] += (r.counts[k] || 0); });
      /* 쿼터·상한 상수는 로스터가 돌려주는 값을 그대로 쓴다 — 하이 문장에 숫자를 복제하지 않는다 */
      if (r.counts.win) W = r.counts.win;
      Object.keys(r.counts.byGrade || {}).forEach((g) => { acc.byGrade[g] = (acc.byGrade[g] || 0) + r.counts.byGrade[g]; });
    });
    /* 화이트리스트를 두지 않는다 — 새 상태(W·D2의 '-')가 생기면 「로스터 N건인데 등급 합 < N」이 되어
       「분자는 분모에 포함」 규약을 어긴다.
       ⚠️ 다만 **표시 순서는 중증도 고정**이다 — Object.keys().sort()는 '-'→H→L→M→W(문자순)를 내서
          같은 줄에서 위험 순서가 뒤집힌 채 낭독됐다(화면 ⓪탭과 같은 수선 · 적대적 리뷰). */
    const _ord = ["H", "M", "L", "W", "-"];
    const gk = _ord.filter((g) => acc.byGrade[g]).concat(Object.keys(acc.byGrade).filter((g) => acc.byGrade[g] && _ord.indexOf(g) < 0).sort());
    return { lines: [
      ctx.label + " 오늘 로스터 " + hmoaN(acc.cards) + "건 — 등급 " + (gk.length ? gk.map((g) => g + " " + acc.byGrade[g]).join(" · ") : "-") + "이에요(라이브 조립 " + (Date.now() - t0) + "ms).",
      "왜 담당은 많은데 오늘은 이만큼인가 — 담당 " + hmoaN(acc.managed) + "명 → 후보 " + hmoaN(acc.candidates) + "명(접촉 락 제외 " + hmoaN(acc.locked) + " · 접촉 금지 단계 제외 " + hmoaN(acc.preResult) + " · 대상 아님 " + hmoaN(acc.offCycle) + " · 발행 불가 " + hmoaN(acc.unpublishable) + " · 결과 기록으로 제외 " + hmoaN(acc.resultSkipped) + ") → 발행 " + hmoaN(acc.cards) + "건(프로당 상한 7건 · 후속일 가산 " + acc.followUpBoost + "건).",
      "집계 정의 — hmDailyRoster(사번, " + d + ")를 범위 프로 " + ctx.codes.length + "명에게 그 자리에서 조립한 값이에요(온디맨드 결정론 — 저장하지 않아요).",
      /* ⚠️ 「골든타임이 열려 있는 카드」라고 단언하지 않는다(적대적 리뷰 실증 2026-10-06) — 쿼터 자격은
         단계이고 창 상태는 **정렬 1순위**다. 전국 좌석 중 창이 없는 D2가 3분의 1이었으므로, 이 문장은
         자격·정렬·창 분해를 그대로 낭독하고 쿼터 상수도 리터럴이 아니라 counts에서 읽는다.
         ⚠️ 쿼터가 선점하는 대가(H 고위험 미등재)도 같은 답변에서 말한다 — 「D2 우선」의 가격이다. */
      "선별 규칙 — 되돌릴 수 없는 창을 상한 " + W.max + "건 안에서 먼저 앉혀요: D2 **첫 연결 미완료** 최대 " + W.d2 + "칸 " + hmoaN(acc.d2Quota) + "건(자격은 D2 단계 · 창이 열린 카드를 1순위로 앉혀요 — 후보 " + hmoaN(acc.d2Cand) + "명 중 창 열림 " + hmoaN(acc.d2OpenCand) + "명 · 등재 " + hmoaN(acc.d2OpenSeated) + "명) · 만기 D-7·당일 최대 " + W.mat + "칸 " + hmoaN(acc.matQuota) + "건. 남은 칸은 등급(H)·만기 선두군 → 나머지 순서예요. 접촉 금지 단계(결과 대기)는 명단에 올리지 않아요.",
      "쿼터의 대가 — 이 범위에서 H 고위험 후보 " + hmoaN(acc.hCand) + "명 중 " + hmoaN(acc.byGrade.H || 0) + "명이 올랐고 **" + hmoaN(Math.max(0, acc.hCand - (acc.byGrade.H || 0))) + "명은 상한 " + W.max + "건 밖**이에요. H는 48시간 시한 등급이라, 쿼터 칸 수(" + W.d2 + "+" + W.mat + ")를 조정할 근거는 이 숫자예요.",
    ], buttons: ["오늘의 지시서 이행율"] };
  },
  /* ── 60일 사이클 — 화면과 **같은 모집단·같은 함수**(hmoCycleAgg)를 쓴다 ──
     ⚠️ 모집단은 드릴다운이 아니라 **직책(관리 범위)**에 고정돼 있다. 누를 때마다 바뀌면 같은 화면의 숫자가
        클릭마다 흔들려 비교가 안 되기 때문이다 — 그래서 하이도 같은 고정을 따르고, 그 사실을 말로 적는다. */
  cycle: function (ctx) {
    const M = (typeof hmoCycleAgg === "function") ? hmoCycleAgg(ctx.adm) : null;
    if (!M) return { lines: ["사이클 집계기를 불러오지 못했어요."] };
    const T = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
    const mk = T.filter((t) => M.dist[t]).map((t) => t + " " + hmoaN(M.dist[t])).join(" · ");
    const root = (typeof hmoScopeLabel === "function") ? hmoScopeLabel(hmoAdmRoot(ctx.adm)) : ctx.label;
    return { lines: [
      root + " 60일 사이클 — " + (mk || "판정된 회원이 없어 분포가 비었어요") + ". T5 동의율 = 만기 도달 " + hmoaN(M.t5plus) + "명 중 안내 동의 " + hmoaN(M.n2Yes) + "명(" + (hmoaPct(M.n2Yes, M.t5plus) == null ? "-" : Math.round(M.n2Yes / M.t5plus * 100) + "%") + ") · 2차 골든타임 회복 = 무보장 " + hmoaN(M.uncov) + "명 중 동의 보유 " + hmoaN(M.recov) + "명.",
      "집계 정의 — " + (M.full ? "전수 " : "표본(간격 " + M.step + ") ") + hmoaN(M.drawN) + "명 중 **판정 " + hmoaN(M.n) + "명 · 미판정 " + hmoaN(M.unjudged) + "명**이에요(미판정은 검진 예약·이력이 없어 사이클이 시작되지 않은 회원 — 분포·비율에서 빠져요)." +
        (M.src && M.src.capped ? " ⚠️ 이 범위 프로 " + M.src.prosAll + "명 중 앞 " + M.src.pros + "명까지만 훑었어요(표본 조립 상한) — 전원이 아니라는 사실을 그대로 적어요." : ""),
      "⚠️ 모집단은 **직책(관리 범위 = " + root + ")**에 고정돼 있어요 — 지점을 따로 고르셔도 사이클 숫자는 화면과 같은 모집단으로 답해요(클릭마다 흔들리면 비교가 안 되니까요).",
    ], buttons: ["오늘 지시서 발행 건수", "담당 회원 수"] };
  },
  /* ── 전사 공통 스냅샷(범위로 쪼개지지 않는다 — 라벨을 「전사」로 고정) ── */
  batch: function (ctx) {
    const S = (typeof HM_OPS_SNAPSHOT !== "undefined") ? HM_OPS_SNAPSHOT : null;
    if (!S) return { lines: ["배치 스냅샷을 불러오지 못했어요."] };
    return { lines: [
      "오늘 발행 가능 여부 — **전사 공통** 판정이에요. " + (S.pass ? "통과" : "차단") + " · 기준 " + S.date + " · 러너 " + S.seconds + "초 · 전원 조립 위반 " + S.rosterViol + "건 · 프로당 상한 " + S.maxRoster + "건." +
        (hmoaHq(ctx) ? " 일일 평균은 " + S.avgRoster + "건이고, 그 숫자는 본사 범위에서만 적어요." : ""),
      "집계 정의 — 배치 러너·대본 하네스의 **통과 여부**예요. 시스템 판정이라 조직으로 쪼개지지 않아서 지점·지역단 라벨을 붙이지 않고 「전사」로만 적어요(전국 평균 건수처럼 범위 밖 규모가 드러나는 숫자는 본사 범위에서만 적어요).",
    ], buttons: ["오늘 지시서 발행 건수"] };
  },
  harness: function () {
    const H = (typeof HM_HARNESS_SNAPSHOT !== "undefined") ? HM_HARNESS_SNAPSHOT : null;
    if (!H) return { lines: ["대본 하네스 스냅샷을 불러오지 못했어요."] };
    return { lines: [
      "대본 품질 게이트 — **전사 공통**. " + (H.pass ? "통과" : "차단") + " · 표본 " + hmoaN(H.sample) + " · 금지어 적발 " + H.forbiddenHits + "건 · 골든셋 드리프트 " + H.goldenDrift + "건 · 코칭 정확도 " + H.coachAcc + "%(기준 " + H.date + ").",
      "집계 정의 — 대본 하네스의 통과 여부와 적발 건수예요. 조직 축이 없어 「전사」로만 적어요.",
    ] };
  },
  weekly: function () {
    const W = (typeof HM_WEEKLY_SNAPSHOT !== "undefined") ? HM_WEEKLY_SNAPSHOT : null;
    if (!W) return { lines: ["주간 학습 루프 스냅샷을 불러오지 못했어요."] };
    return { lines: [
      "주간 학습 루프 — **전사 공통**(주 " + W.week + "). 블록 종수 " + W.blockKinds + " · 블록 수 " + W.blockTotal + " · 미사용 " + (W.unused || []).length + "종 · 개선 후보 " + (W.candidates || []).length + "건.",
      "집계 정의 — 블록 수 집계예요. 문안 반영은 대표 검수를 거치므로 이 수치는 관측값일 뿐이에요.",
    ] };
  },
  feed: function (ctx) {
    if (ctx.scope.level !== "hq") return { refuse: true, lines: [
      "제공 DB 무결성은 전국 피드의 **스키마 검사**라 조직 축이 없어요 — 본사 범위에서만 적어요.",
      "지금 범위(" + ctx.label + ")에서는 그 숫자에 지점·지역단 라벨을 붙일 방법이 없어서 꺼내지 않아요.",
    ] };
    /* 화면 ④ 탭이 이미 돌려 둔 값이 있으면 그것을 쓴다 — 같은 호출(hyFeedScan 300)이라 숫자가 같고,
       같은 검사를 두 번 돌리지 않는다(실측 300건 5초). 없을 때만 직접 돌리고 걸린 시간을 적는다. */
    let f = null, ms = 0, warm = false;
    try { const C = (typeof hmoCycleCached === "function") ? hmoCycleCached(ctx.adm) : null; if (C && C.feed) { f = C.feed; warm = true; } } catch (e) {}
    if (!f) { const t0 = Date.now(); try { f = (typeof hyFeedScan === "function") ? hyFeedScan(300) : null; } catch (e) { f = null; } ms = Date.now() - t0; }
    if (!f) return { lines: ["제공 DB 검사기를 불러오지 못했어요."] };
    const bad = (f.bad || []).length;
    return { lines: [
      "현대해상 제공 DB 무결성 — 표본 " + hmoaN(f.n) + "건 검사 결과 " + (f.ok ? "통과" : "적발 " + bad + "건") + ". 필드 종수 " + f.fields + "종 · 사전 밖 값 유입 " + bad + "건이에요." + (bad ? " 첫 건 — " + f.bad[0].why + " · " + f.bad[0].k + "." : ""),
      "집계 정의 — 전국 피드의 **스키마** 검사(hyFeedScan 300건)예요. 조직 축이 없어 본사 범위 전용이에요." +
        (warm ? " 화면 ④ 탭이 이미 돌려 둔 값을 그대로 썼어요(같은 호출이라 숫자가 같아요)." : (ms >= 300 ? " 검사에 " + (Math.round(ms / 100) / 10) + "초 걸렸어요 — 결과는 세션에 남지 않으니 ④ 탭에서도 한 번 더 돌아요." : "")),
    ] };
  },
  nation: function (ctx) {
    if (ctx.scope.level !== "hq") return { refuse: true, lines: [
      "전국 단계 분포는 비율 수식(HM_FUNNEL × 10만)으로 낸 값이라 **명단도 조직 축도 없어요** — 본사 범위에서만 적어요.",
      "지점·지역단 라벨을 붙이면 안 되는 대표 사례예요. 지금 범위(" + ctx.label + ")의 단계 분포는 담당 회원 전건을 판정해서 따로 낼 수 있어요 — 그걸로 보여드릴까요?",
    ], buttons: ["내 범위 D1~L8 분포"] };
    let l = null; try { l = (typeof hmNationStats === "function") ? hmNationStats() : null; } catch (e) { l = null; }
    if (!l) return { lines: ["전국 분포 수식을 불러오지 못했어요."] };
    return { lines: [
      "전국 단계 분포(수식 전수) — " + l.map((x) => x.k + " " + hmoaN(x.n) + "(" + x.pct + "%)").join(" · ") + "이에요.",
      "집계 정의 — 루프 없는 비율 수식(HM_FUNNEL × 코호트 10만)이에요. 명단이 없고 조직 축도 없어서 본사 범위에서만 표기해요.",
    ] };
  },
  sla: function () {
    const G = (typeof RISK_GRADE_META !== "undefined") ? RISK_GRADE_META : null;
    if (!G) return { lines: ["응답 시한 규칙표를 불러오지 못했어요."] };
    return { lines: [
      "응답 시한 티어(규칙 상수) — H " + G.H.slaKo + "(" + G.H.tier + ") · M " + G.M.slaKo + "(" + G.M.tier + ") · L " + G.L.slaKo + "(" + G.L.tier + ") · E " + G.E.slaKo + "예요. 미응답은 D+7에 재큐돼요.",
      /* W가 생긴 뒤 규칙표가 4종만 말하면 「규칙표에 없는 상태」가 화면에 돈다(형 지시 2026-10-06) */
      "결과 대기(W)는 " + (G.W ? G.W.slaKo : "결과 도착 후 산정") + " — 검진 결과가 도착하기 전에는 등급을 매기지 않고, 그 구간은 접촉 금지라 명단에도 올리지 않아요.",
      /* '-'도 규칙표에 적는다 — ①로 명단에 오르기 시작한 등급이라, 표에 없으면 「규칙표에 없는 상태」가
         시한 없이 명단 최상단에 서게 된다(적대적 리뷰 실증: 로스터 '-' 전국 802건) */
      (G["-"] ? "등급 해당 없음('-')은 " + G["-"].slaKo + "이에요 — 다만 그중 **D2 첫 연결 카드**는 명단에 올라오고, 그 카드의 시한은 등급이 아니라 첫 연결 창(goldenLeftH)에서 파생돼요(창이 열려 있으면 「잔여 N시간」, 지났으면 「창 만료 — 가능한 빨리」). 티어는 H/M/L 집계에 섞지 않으려고 「-」로 둬요." : ""),
      "집계 정의 — 등급→시한 매핑은 규칙이라 즉답할 수 있어요. 다만 「시한 내 실제로 응답했는가」의 **실기록은 아직 없어요**(응답 시각 저장이 없습니다).",
    ], buttons: ["오늘의 지시서 이행율"] };
  },
  funnel: function () {
    let s = null; try { s = (typeof hiEventStats === "function") ? hiEventStats() : null; } catch (e) { s = null; }
    if (!s) return { lines: ["이벤트 집계기를 불러오지 못했어요."] };
    const st = s.stage || {};
    const top = (s.names || []).slice(0, 3).map((x) => x.ko + " " + hmoaN(x.n)).join(" · ");
    return { lines: [
      "완결 퍼널 — 기록 " + hmoaN(s.total) + "건(1단 발행·안내 " + hmoaN(st[1] || 0) + " → 2단 접촉·결과 " + hmoaN(st[2] || 0) + " → 3단 완결 " + hmoaN(st[3] || 0) + ")" + (top ? " · 많은 것 " + top : "") + ".",
      "집계 정의 — 이벤트 payload에 사번·조직·회원 식별자가 없어서 **범위로 가를 수 없어요**. 저장도 최근 500건 상한이라, 이 숫자는 「이 기기에 쌓인 기록」이에요 — 지점·지역단 라벨을 붙이지 않아요.",
    ] };
  },
  /* ── 원천이 없거나 설계상 집계하지 않는 것 ── */
  x_contact: function () {
    return { refuse: true, lines: [
      "그 숫자는 지금 원천이 없어요 — 접촉(원탭)은 세션 메모리에만 남고, 이벤트에는 사번·조직·회원이 없어서 조직·날짜로 가를 키가 없어요.",
      "그래서 「이행율」을 접촉 기준으로는 답하지 않아요. 실기록으로 답할 수 있는 건 **결과 7코드**와 **오늘 발행 건수**예요 — 그걸로 보여드릴까요?",
    ], buttons: ["오늘의 지시서 이행율", "결과 7코드 분포"] };
  },
  x_rank: function () {
    return { refuse: true, lines: [
      "금액·수수료·순위는 이 화면이 집계하지 않아요(원천도 두지 않았어요).",
      "실적은 단계 전진·수행률·정체 해소로만 봐요 — 그 숫자로 보여드릴까요?",
    ], buttons: ["단계 전진 건수", "정체 많은 프로"] };
  },
  x_dept: function () {
    return { refuse: true, lines: [
      "사업단 축은 데이터에 없어요 — 조직 중간 단위는 지역단 16개(+광역 버킷 1)뿐이에요.",
      "「사업단장 시점」은 해당 **지역단**을 고르는 것으로 대신해요. 화면과 답변 모두 「지역단장」으로 적어요.",
    ] };
  },
};

/* ═══════════════════ 거절 문안(조작·회원 개인·건강 상담) ═══════════════════ */
function hmoaRefuseIntent(q) {
  const qs = String(q || "").replace(/\s+/g, "");
  if (/재배분|배정변경|배정바꿔|등급수정|등급바꿔|발송해|보내줘|옮겨줘|배정해|수정해줘|변경해줘|삭제해/.test(qs)) {
    return { lines: [
      "배정 변경·재배분·등급 수정·발송은 여기 없어요. 운영본부는 **관측 전용**이라 조작 기능을 두지 않았고, 배분은 시군구 실사 배속에서만 나와요.",
      "부하가 한쪽으로 몰린 것이 보이면 " + hmoaTabKo(3) + "에서 배율로 확인하실 수 있어요.",
    ], buttons: ["프로당 담당 부하"] };
  }
  /* ⚠️ 「누구인가요」·「명단 보여줘」가 빠져 있어서 「고위험 회원 누구인가요」는 거절 문장 없이 인원을,
     「정체 회원 명단 보여줘」는 인원 + 프로 이름·사번을 답했다(실측). 개인정보가 새지는 않았지만
     **경계가 있는지 운영자가 알 수 없는** 것이 문제다 — 회원 축의 「누구·명단」 형태는 전부 여기서 받는다. */
  if (/회원이름|회원명단|연락처|전화번호|주민|검진값|혈압수치|누구인지|이름알려/.test(qs)
    || /(회원|환자|고객|가입자)[가-힣A-Za-z0-9]{0,4}(누구|명단|리스트|목록)/.test(qs)) {
    return { lines: [
      "회원 한 분 단위(이름·연락처·검진값)는 제가 대화로 꺼내지 않아요. 운영본부는 관측 전용이고, 회원 단위 확인은 담당 프로의 콘솔에서만 해요.",
      "단계별 인원과 명단 화면까지는 " + hmoaTabKo(2) + "에서 보실 수 있어요.",
    ], buttons: ["내 범위 D1~L8 분포"] };
  }
  if (/내건강|제건강|혈압은|당뇨|콜레스테롤|보장공백|보험추천|보험료|어떤보험/.test(qs)) {
    return { lines: [
      "건강·보험 상담은 회원 화면에서 받아요. 운영본부에서는 조직·관리 현황만 답해요 — 회원 상담 동선을 이 화면에서 열지 않아요.",
    ] };
  }
  return null;
}

/* ═══════════════════ 본체 ═══════════════════ */
/* 「현황 보여줘」 = 이동만 / 「이행율 알려줘」 = 숫자만 / 「은평지점 이행율 보여줘」 = 이동 + 숫자.
   ⚠️ 탭은 **보여 달라고 하셨을 때만** 옮긴다(운영자가 보기를 요청하지 않았으면 지금 보던 탭을 유지한다
      — 운영자 전환 때도 탭을 되돌리지 않기로 한 기존 결정과 같은 결). */
/* ⚠️⚠️ 두 글자 범용 토큰을 **공백 제거한 문장 전체**에 걸면 다른 단어 안에 걸려 조용히 틀린다(실측) —
      「평균 응**대시**간 알려줘」가 `대시`에 걸려 현황 분기로 들어가, 원천이 없는 지표인데도
      「본사 전체(전국) … 프로 702명 · 담당 회원 100,000명 · 오늘 지시서 4,516건」을 답했다.
      「못 알아들었다」고 되묻는 unknown 경로가 통째로 우회된 것이고, 같은 결로 `가자`는 「참**가자**」,
      `이동`은 「**이동**통신」, `전반`은 「**전반**기」에 걸린다.
   → ① 긴 어구는 문장 전체에 걸되 `대시`는 `대시보드`로 늘리고 `전반`은 뺀다.
     ② 다른 단어에 흡수되는 두 글자 토큰(가자·이동)은 **토큰 하나와 완전일치**할 때만 본다
        (「은평지점으로 이동」의 토큰은 `이동`이지만 「이동통신」은 토큰이 `이동통신`이라 걸리지 않는다). */
const HMOA_SHOW = /보여|띄워|열어|화면|보자|볼래|확인하고싶|보고싶|가볼까/;
const HMOA_SHOW_TOK = /^(가자|이동|이동해|이동해줘|이동하자|이동시켜|이동시켜줘)$/;
const HMOA_VIEW = /현황|상황|어떻게되|어떤가|요약|대시보드|한눈|전반적/;
/* 토큰 — hmoaNamedUnit과 **같은 끊기 규칙**을 쓴다(한 곳에서 만든다) */
function hmoaToks(q) {
  const out = [];
  String(q || "").split(/[\s,.·\/()\[\]「」『』"'?!~]+/).forEach((tk) => {
    const t = tk.replace(/\s+/g, "");
    if (t) out.push(t);
  });
  return out;
}
function hmoaWantShow(q) {
  const qs = String(q || "").replace(/\s+/g, "");
  if (HMOA_SHOW.test(qs)) return true;
  return hmoaToks(q).some((t) => HMOA_SHOW_TOK.test(t));
}

function hmOpsAsk(text, opt) {
  const q = String(text || "");
  const qs = q.replace(/\s+/g, "");
  /* 입력 채널 — 음성이면 **이동을 즉시 발행하지 않는다**(아래 finish). 숫자 답변은 음성에도 그대로 준다. */
  const voice = !!(opt && opt.channel === "voice");
  const adm = (typeof hmoAdmin === "function") ? hmoAdmin() : null;
  /* ⓪ 미인증 — 이동도 집계도 하지 않는다. 화면이 HmoAdminGate라서 리스너가 없고 이벤트는 사라진다. */
  if (!adm) {
    return { kind: "gate", lines: [
      "아직 운영자 사번을 인증하지 않으셨어요 — **인증 전에는 숫자를 하나도 집계하지 않아요**.",
      "화면 가운데 인증 칸에 사번을 넣어 주세요: 본사 **1H####** · 지역단장 **2H####** · 지점장 **3H####**(예: 3H0001). 그 직책만큼 범위가 열려요.",
    ], buttons: [], nav: null };
  }
  /* ① 조작·회원 개인·건강 상담 — 숫자를 꺼내기 전에 먼저 막는다 */
  const rf = hmoaRefuseIntent(q);
  if (rf) return { kind: "refuse", lines: rf.lines, buttons: rf.buttons || [], nav: null };

  const met = hmoaMetric(q);
  /* ② 원천이 없거나 설계상 집계하지 않는 지표 — **조직 해석보다 먼저** 답한다.
     「우리 지점 전국 몇 등이에요?」를 조직 해석에 먼저 태우면 「전국은 본사만 봐요」라는 엉뚱한 거절이
     나오고, 정작 「순위는 원천도 두지 않았다」는 사실을 말하지 못한다(실측). 이 답들은 범위 정보를
     하나도 흘리지 않으므로 앞에 두어도 안전하다. */
  if (met && met.cost === "none") {
    const a0 = HMOA_ANS[met.k]();
    return { kind: "refuse", lines: a0.lines, buttons: a0.buttons || [], nav: null };
  }
  const unit = hmoaUnit(q, adm);

  /* ③ 운영자 사번을 치신 경우 — 조직 질의가 아니라 계정 전환이다 */
  if (unit && unit.kind === "admcode") {
    return { kind: "refuse", lines: [
      unit.said + "는 **운영자 사번**이에요 — 조직 단위가 아니라 계정이에요. 제가 계정을 바꿀 수는 없어요.",
      "범위를 바꾸시려면 머리띠에서 잠금을 풀고 그 사번으로 다시 인증해 주세요. 지금은 " + hmoaWho(adm) + " 범위(" + hmoScopeLabel(hmoAdmRoot(adm)) + ")로만 답해요.",
    ], buttons: ["내 범위는 어디까지예요?"], nav: null };
  }
  /* ④ 범위 밖 단위 — 숫자를 꺼내지 않고, 그 단위가 있는지 없는지도 말하지 않는다 */
  if (unit && (unit.kind === "out" || unit.kind === "up")) {
    const root = hmoScopeLabel(hmoAdmRoot(adm));
    const lines = unit.kind === "up"
      ? ["「" + unit.said + "」은 본사 범위에서만 봐요 — 지금은 " + hmoaWho(adm) + "으로 인증하셔서 " + root + "까지만 보여드려요.",
         "범위를 바꾸시려면 머리띠에서 잠금을 푸시고 그 계정으로 다시 인증해 주세요."]
      : ["「" + unit.said + "」은 지금 범위(" + root + ")에 없어요. 저는 인증된 계정의 직책만큼만 보고, **범위 밖은 있는지 없는지도 말씀드리지 않아요**.",
         "다른 범위를 보시려면 머리띠에서 잠금을 푸시고 그 계정으로 다시 인증해 주세요."];
    if (met && met.cost !== "none") lines.push("같은 지표를 제 범위(" + root + ")로는 바로 보여드릴 수 있어요.");
    return { kind: "refuse", lines, buttons: met && met.cost !== "none" ? ["내 범위 " + hmoaMetricKo(met.k)] : ["내 범위는 어디까지예요?"], nav: null };
  }
  /* ⑤ 후보가 여럿 — 옮기지 않고 되묻는다(동명이지점·접두 충돌) */
  if (unit && unit.kind === "ambig") {
    return { kind: "refuse", lines: [
      "그 이름으로는 범위 안에 후보가 " + unit.cands.length + "곳이에요 — 하나를 골라 주시면 그 단위로 옮겨 드려요: " + unit.cands.join(" / ") + ".",
      "이름을 임의로 고쳐서 단정하지 않아요(지점 이름은 완전일치 또는 유일한 접두만 받아요) — 엉뚱한 지점 숫자에 그 이름이 붙는 것이 가장 나쁜 사고라서요.",
    ], buttons: unit.cands.slice(0, 3).map((c) => c + " 현황 보여줘"), nav: null };
  }

  /* ⑥ 대상 범위 확정 — 이름을 말했으면 그 단위, 아니면 지금 보던 범위(없으면 관리 범위 뿌리).
     ⚠️ 「옮겼다」는 말은 **실제로 달라졌을 때만** 한다. 이미 그 범위를 보고 있는데 「옮겼어요」라고 적으면
        운영자는 자기가 무엇을 본 것인지 헷갈린다(화면만 조용히 바뀌는 것과 똑같이 나쁘다). */
  const now = (typeof hmoScopeNow === "function") ? hmoScopeNow() : null;
  const base = (now && now.scope) ? now.scope : hmoAdmRoot(adm);
  const named = !!(unit && unit.kind === "ok");
  const scope = named ? unit.scope : base;
  const moved = named && !hmoaScopeEq(scope, base);
  if (!hmoaInScope(scope, adm)) {
    /* 해석은 성공했지만 직책 밖 — 이동 신호를 **아예 쏘지 않는다**(조용한 되돌림에 의지하지 않는다) */
    return { kind: "refuse", lines: [
      "그 단위는 지금 범위(" + hmoScopeLabel(hmoAdmRoot(adm)) + ")에 없어요 — 범위 밖은 있는지 없는지도 말씀드리지 않아요.",
      "범위를 바꾸시려면 머리띠에서 잠금을 푸시고 그 계정으로 다시 인증해 주세요.",
    ], buttons: ["내 범위는 어디까지예요?"], nav: null };
  }
  const label = hmoScopeLabel(scope);
  const wantShow = hmoaWantShow(q);
  const wantView = HMOA_VIEW.test(qs);
  /* 되돌아가기 탭 — 하이가 옮기기 **직전에** 보던 탭을 hmOpsAskGo가 적어 둔다(아래 _hmoaBack).
     같은 단위로 되돌아오면 탭도 그 자리로 되돌린다 — 범위만 돌려주고 탭을 ①에 남기면 운영자가 열어 둔
     명단이 사라진 자리에서 처음부터 다시 찾아 들어가야 한다(실측). */
  const backTab = (_hmoaBack && hmoaScopeEq(scope, _hmoaBack.scope) && typeof _hmoaBack.tab === "number") ? _hmoaBack.tab : null;
  /* 탭 — 「보여 달라」고 하셨을 때만 건드린다. 지표가 있으면 그 지표가 사는 탭, 없으면 ①(조직 드릴다운). */
  const tab = wantShow ? (met && met.tab != null ? met.tab : ((wantView || moved) ? (backTab != null ? backTab : 0) : null)) : null;
  const fromTab = (now && typeof now.tab === "number") ? now.tab : null;
  const mkNav = (t) => ({ scope, tab: (t == null ? null : t), label, from: base, fromLabel: hmoScopeLabel(base), fromTab });
  const nav = (moved || tab != null) ? mkNav(tab) : null;
  /* 이동 안내 문구 — **실제로 달라진 것만** 적는다. 같은 질문을 두 번 해도 두 번 다 「옮겼어요」라고
     적던 것이 ⑥ 주석의 자기 규칙을 metric 분기에서만 지킨 탓이었다(실측: 연속 2회 같은 문장). */
  /* 탭 문구도 **달라진 것만** 적는다 — 이미 그 탭이면 「맞췄어요」가 아니라 「그대로예요」다 */
  const tabKo = (t) => (t == null ? " 탭은 그대로 뒀어요." : (t === fromTab ? " 탭도 이미 " + hmoaTabKo(t) + " 탭이라 그대로예요." : " 탭은 " + hmoaTabKo(t) + " 탭으로 맞췄어요."));
  const moveLine = (nv) => {
    if (!nv) return null;
    if (voice) return "「" + label + "」 단위로 알아들었어요 — 다만 **음성 한마디로는 화면을 옮기지 않아요**(잘못 들으면 다른 지점이 열려요). 아래 「" + hmoaMoveChip(label) + "」를 눌러 주시면 그때 옮겨 드릴게요. 숫자는 그대로 아래에 적어요.";
    if (moved) return "「" + label + "」 단위로 알아들었어요 — 범위를 그 단위로 옮기고" + tabKo(nv.tab);
    if (nv.tab != null && nv.tab !== fromTab) return "이미 「" + label + "」 단위를 보고 계셔서 범위는 그대로 두고 탭만 " + hmoaTabKo(nv.tab) + " 탭으로 맞췄어요.";
    return "이미 「" + label + "」 단위를 보고 계셔서 **범위·탭은 그대로 두고** 숫자만 드려요.";
  };
  const tabLine = (t) => (voice ? (hmoaTabKo(t) + " 탭에 있어요 — 음성으로는 화면을 옮기지 않으니 아래 버튼을 눌러 주세요.")
    : (hmoaTabKo(t) + " 탭을 열어 드렸어요."));
  /* 끝맺음 — 음성이면 이동을 **발행하지 않고** 확인 칩으로 넘긴다(되돌리기 어려운 것은 버튼으로). */
  const finish = (kind, lines, btns, nv) => {
    const bs = (btns || []).filter(Boolean);
    if (nv && voice) {
      const cf = Object.assign({}, nv, { chip: hmoaMoveChip(nv.label) });
      return { kind, lines, buttons: [cf.chip].concat(bs).slice(0, 3), nav: null, navConfirm: cf };
    }
    return { kind, lines, buttons: bs.slice(0, 3), nav: nv || null };
  };

  /* ⑦ 지표가 없으면 — 「현황 보여줘」(이동 + 요약) 또는 되묻기.
     ⚠️ **moved만으로는 들어가지 않는다** — 「우리 지점 이탈률 몇 퍼센트예요?」처럼 사전에 없는 지표를
        물었는데 범위 토큰 때문에 현황 분기로 들어가면, 묻지 않은 숫자(프로 4명·담당 600명)가 그 질문의
        답처럼 읽힌다(실측). 「보여 달라」거나 「현황」이라고 하셨을 때만 요약을 드린다. */
  if (!met) {
    if (wantView || (named && wantShow)) {
      const ctx = hmoaCtx(adm, scope, label);
      const r = hmoaRoll(ctx);
      hmoaLog(adm, label, "현황(이동)");
      return finish(nav ? "both" : "num", [
        moveLine(nav) || ("「" + label + "」 단위 — 범위·탭은 그대로 두고 숫자만 드려요."),
        label + " — 프로 " + r.n + "명(활성 " + r.active + " · 교육중 " + r.edu + " · 정지 " + r.off + ") · 담당 회원 " + hmoaN(r.managed) + "명 · 오늘 지시서 " + hmoaN(r.today) + "건이에요.",
        "집계 정의 — 인원은 hmProsGen() 귀속 전원, 담당·오늘은 배치 스냅샷을 사번으로 조인한 합이에요. " + hmoaTail(ctx),
      ], ["오늘의 지시서 이행율", "내 범위 D1~L8 분포", nav && nav.fromLabel !== label ? nav.fromLabel + " 현황 보여줘" : "프로당 담당 부하"], nav);
    }
    return { kind: "unknown", lines: [
      "그 지표는 제가 아직 못 알아들었어요 — 지어내지 않고 되묻는 쪽을 택할게요(범위·탭은 건드리지 않았어요).",
      "제가 바로 답할 수 있는 것 — 담당 회원 수 · 오늘 지시서 발행 건수 · **오늘의 지시서 이행율** · 결과 7코드·수락률·골든타임 완주율 · 배치 상태 · 응답 시한 규칙이에요(즉시).",
      "계산이 조금 걸리는 것 — D1~L8 단계 분포 · 정체·접촉 락·고위험 · 단계 전진·수행률(시연 분포) · 오늘 로스터 구성 · 60일 사이클·T5 동의율이에요. 「○○지점 현황 보여줘」처럼 말씀하시면 화면도 그 단위로 옮겨요.",
    ], buttons: ["오늘의 지시서 이행율", "내 범위 D1~L8 분포", "정체 많은 프로"], nav: null };
  }

  const ctx = hmoaCtx(adm, scope, label);
  /* ⑧ 비용 게이트 — 프로 행·로스터 집계는 프로 수로 가른다 */
  if (met.cost === "rows" && ctx.codes.length > HMOA_SLOW) {
    return finish("refuse", [
      "지금 범위 " + ctx.label + " — 프로 " + ctx.codes.length + "명이라 제가 대화에서 한 번에 집계하지 않아요. 제 집계는 동기라서 그 사이 화면이 통째로 멈춰요(프로당 약 12ms · " + ctx.codes.length + "명이면 " + Math.round(ctx.codes.length * 0.012) + "초쯤).",
      tabLine(met.tab) + " 거기 「집계 계산」 버튼은 한 틱에 5명씩 끊어 돌고 **중간에 멈출 수도** 있어요.",
      "지점이나 프로 한 분 단위로 좁혀 물어보시면 제가 바로 계산해 드려요.",
    ], ["오늘 지시서 발행 건수", "담당 회원 수"], mkNav(met.tab));
  }
  if (met.cost === "roster" && ctx.codes.length > HMOA_ROSTER_MAX) {
    return finish("refuse", [
      "지금 범위 " + ctx.label + " — 프로 " + ctx.codes.length + "명이라 오늘 로스터를 대화에서 조립하지 않아요. 프로당 약 33ms라 " + ctx.codes.length + "명이면 " + Math.round(ctx.codes.length * 0.033) + "초 동안 화면이 멈춰요(전국은 23초).",
      "지점 단위(프로 " + HMOA_ROSTER_MAX + "명까지)로 좁혀 물어보시면 바로 조립해 드려요. 발행 건수만이면 스냅샷으로 즉시 답할 수 있어요. " + tabLine(met.tab),
    ], ["오늘 지시서 발행 건수"], mkNav(met.tab));
  }

  /* ⑨ 집계 — 프로 행이 필요한 지표는 hmoProRow 경유(캐시는 화면이 그대로 재사용한다) */
  let R = null, slow = "";
  if (met.cost === "rows") {
    const warm = ctx.codes.filter((c) => { try { return !!hmoaWarm(c); } catch (e) { return false; } }).length;
    R = hmoaRows(ctx);
    /* ⚠️ 「세션에 남아 ③ 탭에서 **바로 떠요**」는 사실이 아니었다 — 화면은 cap(기본 20명)으로 모집단을
       자르고 「집계 계산」 버튼을 먼저 받으므로, 하이가 전건(70명)으로 답한 직후 같은 탭이 표본 20명으로
       3배 다른 숫자를 보여 줬다(실측 2H0001: 하이 D1 5,347 / 화면 D1 1,553).
       → ① 문구를 「버튼을 누르면 **다시 계산하지 않고** 뜬다」로 정확히 바꾸고
         ② 하이가 범위 전건을 계산했으면 이동 신호에 cap(=0, 범위 전체)을 실어 **화면 모집단을 하이와 맞춘다**
            (받는 쪽은 허용값 0·20·60만 받는다 — tab을 0~4로 검증하는 것과 같은 방식). */
    const mine = (R.rows.length >= ctx.codes.length) ? "범위 전건(프로 " + R.rows.length + "명)" : "프로 " + R.rows.length + "명";
    const where = nav
      ? (hmoaTabKo(met.tab) + " 탭에서 「집계 계산」을 누르면 **다시 계산하지 않고** 그대로 떠요(모집단도 제가 쓴 " + mine + "으로 맞춰 뒀어요).")
      : (hmoaTabKo(met.tab) + " 탭에서 「집계 계산」을 누르면 **다시 계산하지 않고** 그대로 떠요 — 다만 그 탭의 기본 모집단은 앞 20명이라 제가 쓴 " + mine + "과 다를 수 있어요(「…보여줘」라고 하시면 모집단까지 맞춰 드려요).");
    if (R.ms >= 300) slow = "이번 집계에 " + (Math.round(R.ms / 100) / 10) + "초 걸렸어요(" + (ctx.codes.length > HMOA_FAST ? "프로 " + ctx.codes.length + "명 · " : "") + "처음 한 번은 10만 코호트 색인을 만드느라 더 걸려요). 계산해 둔 " + mine + "은 세션에 남아요 — " + where;
    else if (warm < ctx.codes.length) slow = "계산해 둔 " + mine + "은 세션에 남아요 — " + where;
    if (!R.rows.length) {
      return { kind: "refuse", lines: ["이 범위에서 집계할 프로 행을 만들지 못했어요 — 범위 색인에 없는 사번은 계산하지 않아요(범위 가드)."], buttons: [], nav: null };
    }
  }
  const a = HMOA_ANS[met.k](ctx, R);
  if (a.refuse) return { kind: "refuse", lines: a.lines, buttons: a.buttons || [], nav: null };

  hmoaLog(adm, label, hmoaMetricKo(met.k));
  const lines = [];
  const ml = moveLine(nav);
  if (ml) lines.push(ml);
  a.lines.forEach((l) => lines.push(l));
  /* 전사 공통·기기 단위 지표는 범위 꼬리말을 붙이지 않는다 — 범위 라벨이 붙으면 그것이 곧 틀린 라벨이다 */
  if (["batch", "harness", "weekly", "funnel", "sla", "nation", "feed"].indexOf(met.k) < 0) lines.push(hmoaTail(ctx, slow));
  else if (slow) lines.push(slow);
  /* 선택 단위를 쓰지 않는 블록으로 보냈을 때 — 「탭 숫자는 관리 범위 기준」이라고 **답에 적는다**.
     ④ 탭의 사이클·전사 블록은 관리 범위(직책)로 고정돼 있어서, 하이가 답한 선택 단위 숫자와
     같은 화면에 다른 숫자가 나란히 선다(실측: 하이 은평지점 28건 / 화면 강북지역단 460건). */
  if (nav && nav.tab === 3 && ["cycle", "batch", "harness", "weekly", "funnel", "nation", "feed", "sla"].indexOf(met.k) >= 0) {
    lines.push("⚠️ " + hmoaTabKo(3) + " 탭의 이 블록은 **관리 범위(직책) 기준**이라 제가 답한 선택 단위 숫자와 모집단이 달라요 — 선택 단위 숫자는 이 대화에, 관리 범위 숫자는 화면에 있어요.");
  }
  const btns = (a.buttons || []).slice(0, 2);
  if (nav && nav.fromLabel !== label) btns.push(nav.fromLabel + " 현황 보여줘");
  /* 하이가 범위 전건을 계산했으면 화면 모집단(cap)도 같은 전건으로 맞춘다 */
  if (nav && met.cost === "rows" && R && R.rows.length >= ctx.codes.length) nav.cap = 0;
  return finish(nav ? "both" : "num", lines, btns, nav);
}

/* 지표 한국어 이름 — 되묻기·버튼 문구가 같은 사전을 쓴다(화면이 알려 준 예시를 박아 두지 않는다) */
const HMOA_KO = {
  fulfil: "오늘의 지시서 이행율", opened: "오늘 지시서 열람율", today: "오늘 지시서 발행 건수",
  managed: "담당 회원 수", pros: "소속 프로 수", grade: "프로 등급 분포", load: "프로당 담당 부하",
  snap: "스냅샷 미등재 프로", result: "결과 7코드 분포", accept: "수락률", golden: "골든타임 전달 체크 완주율",
  stage: "D1~L8 분포", stall: "정체 인원·정체율", held: "접촉 락 인원", ready2: "첫 연결·신호·고위험",
  family: "가족·쇼핑 연계", adv: "단계 전진 건수", perf: "수행률(시연 분포)", touch: "접촉 시도·평가(시연 분포)",
  roster: "오늘 로스터 구성", cycle: "60일 사이클·T5 동의율", batch: "배치 상태", harness: "대본 하네스",
  weekly: "주간 학습 루프", feed: "제공 DB 무결성", nation: "전국 단계 분포", sla: "응답 시한 규칙", funnel: "완결 퍼널",
};
function hmoaMetricKo(k) { return HMOA_KO[k] || k; }
/* 이미 계산해 둔 프로 행인지 — 캐시를 **읽지 않고** 존재만 본다(hmoProRow 경유 원칙을 깨지 않는다) */
function hmoaWarm(code) { try { return (typeof hmoRowWarm === "function") ? hmoRowWarm(code) : false; } catch (e) { return false; } }

/* 조회 감사 흔적 — 숫자를 낸 질의는 한 줄 남긴다.
   `__hifinHmScope`가 가드 없이 전국을 뱉으면서 로그도 남기지 않아 감사 흔적조차 없던 사고를 되풀이하지
   않기 위해, 화면 밖 창구(독)도 콘솔 훅과 같은 기준으로 기록한다. */
function hmoaLog(adm, label, metric) {
  try { if (typeof guardLog === "function") guardLog("hmops_ask", (adm ? adm.code + " " + adm.title : "미인증") + " · " + label + " · " + metric); } catch (e) {}
}

/* ═══════════════════ 화면 이동 신호 ═══════════════════ */
/* 전역 CustomEvent 하나(hifin:hmops). 받는 쪽은 HmOpsCenterSection의 리스너 → setScope + setTab이고,
   setScope가 hmoScopeClamp를 통과시키므로 범위 밖 scope가 들어와도 조용히 뿌리로 되돌아간다.
   ⚠️ 코드베이스 선례와 같은 결이다(vaultgo · hifin:tele · dlmove · agentask).
   ⚠️ 해석이 성공한 단위에만 보낸다 — 실패하면 호출자가 nav를 null로 돌려주므로 이벤트가 아예 없다. */
const HMOA_EVT = "hifin:hmops";
/* 떠나기 직전의 범위·탭 — 되돌아가기가 **탭까지** 복원하도록 이동 발행 한 곳에서만 적는다.
   ⚠️ 저장 키를 새로 만들지 않는다(모듈 메모리 한 칸 · 관측 전용 화면 규약). 이 값으로 범위가 넓어지는
      일은 없다 — 되돌아갈 scope는 이미 clamp를 통과한 「직전 선택」이고, 받는 쪽에서 또 clamp된다. */
let _hmoaBack = null;
/* 음성 확인 칩 문구 — 엔진과 독이 **같은 문자열**을 봐야 칩 클릭을 알아본다(한 곳에서 만든다) */
function hmoaMoveChip(label) { return label + " 화면으로 옮기기"; }
function hmOpsAskGo(nav) {
  if (!nav || !nav.scope) return false;
  try {
    window.dispatchEvent(new CustomEvent(HMOA_EVT, { detail: { scope: nav.scope, tab: nav.tab, cap: nav.cap, why: nav.label } }));
    /* ⚠️ 범위가 그대로인 이동(탭만 옮기는 경우)에 표식을 갱신하면, 같은 단위를 두 번 물었을 때
       탭이 ①↔④으로 왔다 갔다 한다(실측). **떠난 자리**가 있을 때만 적는다. */
    if (nav.from && !hmoaScopeEq(nav.from, nav.scope)) {
      _hmoaBack = { scope: nav.from, tab: (typeof nav.fromTab === "number" ? nav.fromTab : null), label: nav.fromLabel };
    }
    return true;
  } catch (e) { return false; }
}
