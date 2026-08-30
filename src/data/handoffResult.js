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

function _hmrKey(code) { return "hifin_handoff_result_" + code; }
function _hmrAll(code) { try { return JSON.parse(localStorage.getItem(_hmrKey(code)) || "[]"); } catch (e) { return []; } }

/* 기록 — 7코드 밖 거부·메모는 금지어 스캔 경유(§0-B) */
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
  const l = _hmrAll(code); l.push(row);
  try { localStorage.setItem(_hmrKey(code), JSON.stringify(l.slice(-800))); } catch (e) { return { ok: false, why: "저장 공간이 부족해요 — 백업 후 정리해 주세요" }; }
  try { hiEvent("handoff_resulted", { key: c.k, grade: entry.grade || "", n: entry.branch || 0, src: "sheet" }); } catch (e) {}
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
    try { for (let j = 0; j < localStorage.length; j++) { const k = localStorage.key(j); if (k && k.indexOf("hifin_handoff_result_") === 0) all = all.concat(JSON.parse(localStorage.getItem(k) || "[]")); } } catch (e) {}
    return all;
  })();
  const by = {}; const byBranch = {}; let followUps = 0;
  HM_RESULT_CODES.forEach((c) => by[c.k] = 0);
  l.forEach((r) => { by[r.result] = (by[r.result] || 0) + 1; if (r.branch) byBranch[r.branch] = (byBranch[r.branch] || 0) + 1; if (r.followUp) followUps++; });
  const accepted = by.R1 + by.R7, connected = accepted + by.R2 + by.R3;
  return { n: l.length, by: by, byBranch: byBranch, followUps: followUps,
    acceptRate: connected ? Math.round(accepted / connected * 100) : null,
    codes: HM_RESULT_CODES.map((c) => ({ k: c.k, ko: c.ko, icon: c.icon, n: by[c.k] || 0 })) };
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
        return { error: "record | stats | adjust" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
