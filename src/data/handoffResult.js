/* ══════════════ 활동결과 기록(handoffResult.js) — 2단계 v1.4 축① P2 (형 승인 2026-08-30) ══════════════
   지시 발행→접촉 다음의 빈칸: "그래서 어떻게 됐나"의 영속 기록. 프로 활동이 처음으로 데이터가 된다.
   ⚠️ 헌법:
     · §0-B 기록은 선택지다 — 결과는 7코드 클릭, 자유 텍스트는 보조 메모 1칸(금지어 스캔 통과분만 저장).
     · 7코드 밖 값은 저장 거부(기록 무결 — 하네스 §7-①).
     · 저장: hifin_handoff_result_{프로코드} (dataCatalog 등재) · 이벤트: handoff_resulted(등재).
     · 기록이 다음 지시를 바꾼다 — 완결·거절은 로스터 제외(거절 30일 쿨다운), 부재·보류는 후속일 도래 시 우선 가산. */

const HM_RESULT_CODES = [
  { k: "R1", ko: "연결·수락", desc: "개입 알림 발송함", icon: "✅", next: "완결 이벤트 대기" },
  { k: "R2", ko: "연결·보류", desc: "생각해 보시기로", icon: "⏸", next: "후속일에 다시" },
  { k: "R3", ko: "연결·거절", desc: "괜찮다고 하심",   icon: "🙅", next: "30일 쉬어가기" },
  { k: "R4", ko: "부재",     desc: "전화 안 받으심",   icon: "📵", next: "다음 기회에 재시도" },
  { k: "R5", ko: "번호 오류", desc: "연락처가 달라요",  icon: "⚠️", next: "정보 확인 필요" },
  { k: "R6", ko: "락 확인",   desc: "검진 전 — 중단",   icon: "🔒", next: "결과 오면 자동 해제" },
  { k: "R7", ko: "완결 확인", desc: "행동까지 끝남",    icon: "🏁", next: "다음 주기 관리로" },
];
function hmrCode(k) { return HM_RESULT_CODES.find((c) => c.k === k) || null; }

function _hmrKey(code) { return "hifin_handoff_result_" + ((typeof hmCodeNorm === "function") ? hmCodeNorm(code) : code); }
/* 사번 체계 교체(2026-10-05) 1회 이관 — 구 코드 키(hifin_handoff_result_HM-…)에 쌓인 활동 기록을
   신 사번 키로 옮긴다. 하지 않으면 ⑩블록⑦ 전체 집계(prefix 스캔)에는 남는데 프로별 드릴다운은 0건이
   되어 집계와 상세가 어긋난다. 멱등 — 플래그 1개로 1회만 돈다. */
function _hmrMigrateCodes() {
  try {
    if (localStorage.getItem("hifin_hm_resultkey_mig_v2")) return;
    const P = "hifin_handoff_result_";
    const olds = [];
    for (let j = 0; j < localStorage.length; j++) { const k = localStorage.key(j); if (k && k.indexOf(P) === 0 && /^HM-/.test(k.slice(P.length))) olds.push(k); }
    olds.forEach((k) => {
      const nk = _hmrKey(k.slice(P.length));
      if (nk === k) return;
      const cur = JSON.parse(localStorage.getItem(nk) || "[]");
      const add = JSON.parse(localStorage.getItem(k) || "[]");
      localStorage.setItem(nk, JSON.stringify(cur.concat(add)));
      localStorage.removeItem(k);
    });
    localStorage.setItem("hifin_hm_resultkey_mig_v2", "1");
  } catch (e) {}
}
function _hmrAll(code) { _hmrMigrateCodes(); try { return JSON.parse(localStorage.getItem(_hmrKey(code)) || "[]"); } catch (e) { return []; } }

/* 기록 — 7코드 밖 거부·메모는 금지어 스캔 경유(§0-B) */
/* D2 골든타임 전달 체크(F3 — 프롬프트 v1.1 §5.3) — 시트·집계·⑩관제가 같은 사전을 읽는다.
   칸 수를 코드·문구에 숫자로 박지 말고 **전부 HMR_GOLDEN_KEYS.length에서 파생**시킨다.
   순서는 대본 조립 순서(handoffCard의 firstconnect → fcTail = fc-support·fc-consent·fc-lifetime)와
   같아야 프로가 대본을 따라가며 누른다.
   ⚠️ 「건강관리 동의 **요청**」이다(형 지시 2026-10-06) — 발화(fc-consent)는 「지금 화면으로
      보내드릴게요」까지이고, 동의 **보유**는 consentGate의 s4·60일 사이클 T5 동의율이라는 별도
      원천이 있다. 같은 이름을 쓰면 두 숫자가 어긋날 때 설명할 자리가 없다
      (전달 체크는 「말했는가」, s4는 「받았는가」). */
const HMR_GOLDEN_KEYS = [
  { k: "svc3",    ko: "무료 3종 안내" },
  { k: "ins",     ko: "보험 혜택·적용법" },
  { k: "report",  ko: "리포트 발행·안내" },
  { k: "kit",     ko: "케어 키트 안내" },
  { k: "support", ko: "향후 지원 약속" },
  { k: "consent", ko: "건강관리 동의 요청" },   /* 2026-10-06 신설 — 그 전 기록에는 이 칸이 없다 */
];
/* 기록 시점 사전의 키 목록 — 사전은 **뒤에 추가만** 해 왔으므로 앞 gn개가 그 시점의 사전이다
   (이 전제가 깨지는 변경, 즉 중간 삽입·키 이름 변경을 하면 과거 행 판정이 틀어진다 — 그럴 때는
   row에 키 목록 자체를 남기는 쪽으로 바꿀 것). */
function _hmrKeysAt(gn) { return HMR_GOLDEN_KEYS.slice(0, gn || 5).map((g) => g.k); }
/* 완주 판정 — 길이 비교가 아니라 **기록 시점 사전의 전 키가 들어 있는가**(중복 무해) */
function _hmrFull(r) { const need = _hmrKeysAt(r.gn), have = r.golden || []; return need.length > 0 && need.every((k) => have.indexOf(k) >= 0); }
function hmrRecord(code, entry) {
  const c = hmrCode(entry && entry.result);
  if (!c) return { ok: false, why: "결과는 7코드 중에서만 고를 수 있어요" };
  if (entry.memo) {
    try { const hits = hmForbiddenScan(entry.memo); if (hits.length) return { ok: false, why: "메모에 쓸 수 없는 표현이 있어요: " + hits[0].ko }; } catch (e) {}
    entry.memo = String(entry.memo).slice(0, 120);
  }
  const row = { i: Number(entry.i), date: String(entry.date || new Date().toISOString().slice(0, 10)),
    result: c.k, branch: entry.branch != null ? Number(entry.branch) : null,
    followUp: entry.followUp || null, memo: entry.memo || "", at: Date.now() };
  /* D2 골든타임 전달 체크(F3) — 사전 선택지 코드만(§0-B: 자유 텍스트 아님·코드 밖 거부) */
  if (entry.golden && entry.golden.length) {
    const gv = entry.golden.filter((k) => HMR_GOLDEN_KEYS.some((g) => g.k === k));
    if (gv.length !== entry.golden.length) return { ok: false, why: "전달 체크는 정해진 " + HMR_GOLDEN_KEYS.length + "칸에서만 고를 수 있어요" };
    /* ⚠️ **중복 제거**(적대적 리뷰 실증 2026-10-06): 종전에는 사전에 있는 키의 중복이 통과하고
       완주 판정이 길이 비교(`>= gn`)여서 `['svc3','svc3','ins','report','kit','support']`가
       consent 미체크인데도 6칸 완주로 집계됐다(라이브 실측 full 1 · consent 0). 화면 토글로는
       중복이 생기지 않지만 기록 경로(__hifinResult('record', …))가 열려 있고, 완주율은 ⑩·하이가
       그대로 쓰는 실기록 지표다. 저장 단계에서 집합으로 만들고, 완주는 아래에서 **키 포함**으로 본다. */
    row.golden = gv.filter((k, ix) => gv.indexOf(k) === ix);
    /* gn — 이 행이 기록된 시점의 사전 크기. 없으면 사전을 늘리는 순간 **과거 전건 체크 행이
       전부 미완주로 떨어진다**(완주 기준이 분자 쪽에서 바뀌는 유형). row 필드라 새 저장 키가
       없어 dataCatalog 선등재·check_data_catalog 게이트를 건드리지 않는다. */
    row.gn = HMR_GOLDEN_KEYS.length;
  }
  const l = _hmrAll(code); l.push(row);
  try { localStorage.setItem(_hmrKey(code), JSON.stringify(l.slice(-800))); } catch (e) { return { ok: false, why: "저장 공간이 부족해요 — 백업 후 정리해 주세요" }; }
  try { hiEvent("handoff_resulted", { key: c.k, grade: entry.grade || "", n: entry.branch || 0, src: "sheet" }); } catch (e) {}
  try {
    if (row.golden && row.golden.length) {
      hiEvent("golden_delivered", { n: row.golden.length, keys: row.golden.join(",") });
      if (row.golden.indexOf("kit") >= 0) hiEvent("kit_offered", { i: row.i });
    }
  } catch (e) {}
  return { ok: true, row: row, ko: c.ko };
}

/* 회원별 최근 결과 — 로스터 반영용(같은 프로 기록 안에서) */
function hmrLastOf(code, i) {
  const l = _hmrAll(code);
  for (let j = l.length - 1; j >= 0; j--) if (l[j].i === Number(i)) return l[j];
  return null;
}
/* 로스터 조정 판정 — dailyRoster가 호출: skip(제외) / boost(가산) / 0 */
function hmrRosterAdjust(code, i, dateStr) {
  const r = hmrLastOf(code, i);
  if (!r) return { skip: false, boost: 0 };
  const days = Math.floor((new Date(dateStr) - new Date(r.date)) / 86400000);
  if (r.result === "R7") return { skip: true, why: "완결" };
  if (r.result === "R3" && days < 30) return { skip: true, why: "거절 쉬어가기(" + (30 - days) + "일 남음)" };
  if (r.result === "R5") return { skip: true, why: "연락처 확인 필요" };
  if ((r.result === "R2" || r.result === "R4") && r.followUp && dateStr >= r.followUp) return { skip: false, boost: 180, why: "후속일 도래" };
  if (r.result === "R1" && days < 7) return { skip: true, why: "완결 대기(D+7 재큐)" };
  return { skip: false, boost: 0 };
}

/* 프로별·전체 통계 — ⑩블록⑦(활동 결과 관제)의 원천 */
function hmrStats(code) {
  const l = code ? _hmrAll(code) : (function () {
    let all = [];
    try { for (let j = 0; j < localStorage.length; j++) { const k = localStorage.key(j); if (k && k.indexOf("hifin_handoff_result_") === 0) { const v = JSON.parse(localStorage.getItem(k) || "[]"); if (Array.isArray(v)) all = all.concat(v); } } } catch (e) {}
    return all;
  })();
  const by = {}; const byBranch = {}; let followUps = 0;
  const gBy = {}; let gRows = 0; HMR_GOLDEN_KEYS.forEach((g) => gBy[g.k] = 0);
  HM_RESULT_CODES.forEach((c) => by[c.k] = 0);
  l.forEach((r) => { by[r.result] = (by[r.result] || 0) + 1; if (r.branch) byBranch[r.branch] = (byBranch[r.branch] || 0) + 1; if (r.followUp) followUps++;
    if (r.golden && r.golden.length) { gRows++; r.golden.forEach((k) => { if (gBy[k] != null) gBy[k]++; }); } });
  const accepted = by.R1 + by.R7, connected = accepted + by.R2 + by.R3;
  return { n: l.length, by: by, byBranch: byBranch, followUps: followUps,
    acceptRate: connected ? Math.round(accepted / connected * 100) : null,
    codes: HM_RESULT_CODES.map((c) => ({ k: c.k, ko: c.ko, icon: c.icon, n: by[c.k] || 0 })),
    /* D2 골든타임(F3) — 전달률 = 전달 체크 완주 비율·항목별 분포(체크 기록 안에서만 — 가공 아님).
       ⚠️ 완주 기준 칸 수는 **기록 시점 사전**(row.gn)을 따른다 — gn이 없는 과거 행은 5칸 시절 기록이다.
       ⚠️ 분모(rows)는 「체크를 한 칸이라도 누른 행」이라 자기선택 표본이다 — 집계 정의에 함께 적는다.
       ⚠️ fullByGn — **기록 시점 사전별 완주 수**를 함께 돌려준다(적대적 리뷰 실증 2026-10-06).
          종전에는 화면·하이가 분자(기록 시점 기준)를 들고 라벨만 현재 사전 길이로 찍어, 5칸 시절
          기록 1건이 「6칸 완주 1건」으로 표시됐다 — 숫자는 안 틀렸지만 라벨이 분자와 다른 기준을
          말했다. 화면·하이는 헤드라인을 「전부 체크(기록 시점 기준)」로 적고 이 분해를 함께 낭독한다. */
    golden: { rows: gRows, by: gBy, full: l.filter((r) => r.golden && r.golden.length && _hmrFull(r)).length,
      fullByGn: (function () { const o = {}; l.forEach((r) => { if (r.golden && r.golden.length && _hmrFull(r)) { const k = String(r.gn || 5); o[k] = (o[k] || 0) + 1; } }); return o; })(),
      dictN: HMR_GOLDEN_KEYS.length,
      keys: HMR_GOLDEN_KEYS.map((g) => ({ k: g.k, ko: g.ko, n: gBy[g.k] || 0 })) } };
}

/* 러너·검증 훅(관리자) */
try {
  if (typeof window !== "undefined") {
    window.__hifinResult = function (cmd, code, arg) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "record") return hmrRecord(code, arg);
        if (cmd === "stats") return hmrStats(code || null);
        if (cmd === "adjust") return hmrRosterAdjust(code, arg && arg.i, arg && arg.date);
        /* keys — 전달 체크 사전 자체. 러너가 「칸↔대본 블록 1:1」과 사전 축소를 검사한다(③ 가드) */
        if (cmd === "keys") return { n: HMR_GOLDEN_KEYS.length, keys: HMR_GOLDEN_KEYS.map((g) => ({ k: g.k, ko: g.ko })) };
        return { error: "record | stats | adjust | keys" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
