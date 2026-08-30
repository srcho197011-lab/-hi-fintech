/* ══════════════ 회원 행동층 백업·복원(backupRestore.js) — 데이터 운영 v1.1 §L3 브리지 (형 지시 2026-08-30) ══════════════
   문제(형 진단 그대로): L3(브라우저 localStorage)는 ①leveldb 이진 파일로 사람이 못 읽고 ②오리진별 완전 분리
   (localhost ↔ hi-fintech.com 상호 불가시) ③기록 삭제·PC 교체 한 번이면 경고 없이 전량 유실·복구 불가.
   해법(D-2 서버 이관 전 브리지): 전 키 JSON 스냅샷 다운로드 + 파일 복원 + 개발자도구 붙여넣기 스니펫.
   ⚠️ 백업 파일에는 가명 금고 원본이 포함 — 본인 보관 전용, 외부 전송·공유 금지(화면에 고지). */

const HIFIN_BACKUP_VER = 1;
const HIFIN_BACKUP_LAST_KEY = "hifin_backup_last";   /* dataCatalog 등재(ops) — 마지막 백업 시각 */

function _bkSum(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); }

/* 수집 — hifin_*·pi_* 전 키(세션 스토리지는 휘발 설계라 제외) */
function hifinBackupCollect() {
  const data = {};
  for (let j = 0; j < localStorage.length; j++) {
    const k = localStorage.key(j);
    if (!/^(hifin_|pi_)/.test(k) || k === HIFIN_BACKUP_LAST_KEY) continue;
    data[k] = localStorage.getItem(k);
  }
  const body = JSON.stringify(data);
  return { ver: HIFIN_BACKUP_VER, app: "hifin", origin: (typeof location !== "undefined" ? location.origin : "?"),
    at: new Date().toISOString(), keys: Object.keys(data).length, bytes: body.length * 2, sum: _bkSum(body), data: data };
}

/* 다운로드 — hifin_backup_<날짜>_<호스트>.json */
function hifinBackupDownload() {
  const bk = hifinBackupCollect();
  const name = "hifin_backup_" + bk.at.slice(0, 10) + "_" + String(bk.origin).replace(/[^a-zA-Z0-9.]/g, "").slice(-24) + ".json";
  const blob = new Blob([JSON.stringify(bk, null, 1)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  try { localStorage.setItem(HIFIN_BACKUP_LAST_KEY, JSON.stringify({ at: bk.at, keys: bk.keys, bytes: bk.bytes, sum: bk.sum })); } catch (e) {}
  return { name: name, keys: bk.keys, kb: Math.round(bk.bytes / 1024) };
}

/* 복원 — 검증(버전·체크섬·카탈로그 대조) 후 적용. 덮어쓰기 전 현재 상태를 자동 백업 스냅샷으로 남긴다 */
function hifinRestoreApply(bk, opts) {
  const out = { ok: false, restored: 0, skippedUnknown: [], overwritten: 0, why: null };
  try {
    if (!bk || bk.app !== "hifin" || !bk.data) { out.why = "하이핀 백업 파일이 아니에요"; return out; }
    if (bk.ver > HIFIN_BACKUP_VER) { out.why = "이 파일은 더 새로운 버전(" + bk.ver + ")이에요 — 앱 업데이트 후 복원하세요"; return out; }
    if (bk.sum && _bkSum(JSON.stringify(bk.data)) !== bk.sum) { out.why = "체크섬 불일치 — 파일이 손상됐거나 수정됐어요"; return out; }
    if (!(opts && opts.skipPreBackup)) {
      try { const pre = hifinBackupCollect(); sessionStorage.setItem("hifin_restore_undo", JSON.stringify(pre.data).slice(0, 4500000)); } catch (e) {}
    }
    for (const k in bk.data) {
      if (typeof hifinCatalogKnown === "function" && !hifinCatalogKnown(k)) { out.skippedUnknown.push(k); continue; }
      if (localStorage.getItem(k) != null) out.overwritten++;
      localStorage.setItem(k, bk.data[k]);
      out.restored++;
    }
    out.ok = true;
  } catch (e) { out.why = String(e).slice(0, 160); }
  return out;
}
function hifinBackupLast() {
  try { return JSON.parse(localStorage.getItem(HIFIN_BACKUP_LAST_KEY) || "null"); } catch (e) { return null; }
}

/* 관리자·러너 훅 — 왕복 검증·비상 운영용 */
try {
  if (typeof window !== "undefined") {
    window.__hifinBackup = function (cmd, arg) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "collect") return hifinBackupCollect();
        if (cmd === "restore") return hifinRestoreApply(arg);
        if (cmd === "last") return hifinBackupLast();
        return { error: "collect | restore | last" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}

/* ── 개발자도구(F12 콘솔) 붙여넣기 스니펫 — 화면이 죽었거나 다른 오리진에서도 쓰는 자족 코드(앱 함수 의존 0) ── */
const HIFIN_SNIPPET_BACKUP = `(function(){var d={};for(var j=0;j<localStorage.length;j++){var k=localStorage.key(j);if(/^(hifin_|pi_)/.test(k))d[k]=localStorage.getItem(k);}var s=JSON.stringify(d),h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;var bk={ver:1,app:"hifin",origin:location.origin,at:new Date().toISOString(),keys:Object.keys(d).length,sum:h.toString(16),data:d};var b=new Blob([JSON.stringify(bk,null,1)],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="hifin_backup_"+bk.at.slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();console.log("백업 완료 — "+bk.keys+"개 키");})();`;
const HIFIN_SNIPPET_RESTORE = `(function(){var i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=function(){var f=i.files[0],r=new FileReader();r.onload=function(){try{var bk=JSON.parse(r.result);if(bk.app!=="hifin"||!bk.data){alert("하이핀 백업 파일이 아니에요");return;}var n=0;for(var k in bk.data){if(/^(hifin_|pi_)/.test(k)){localStorage.setItem(k,bk.data[k]);n++;}}alert("복원 완료 — "+n+"개 키. 새로고침하면 반영돼요.");}catch(e){alert("복원 실패: "+e);}};r.readAsText(f);};i.click();})();`;
