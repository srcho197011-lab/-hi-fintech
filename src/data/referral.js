/* ══════════ 회원 추천(리퍼럴) — 6대 획득 채널 ⑥ (Phase 3 획득 엔진) ══════════
   설계(사업계획서 제3장): 추천인·피추천인 양측 HTK 적립 + 피추천인 '검진 완료' 시 추가 보상(행동 기반 — 허수 가입 방지).
   보상 재원 = 검진센터 송객수수료 마진 → 지급 후에도 획득 손익 흑자(네거티브 CAC). ⚠️ 수치는 시연용 예시. */
const REF_REWARD = { inviter: 500, invitee: 500, action: 1000 };

function refState(email) { try { return JSON.parse(localStorage.getItem("hifin_ref_" + (email || "default")) || "null") || { invited: 0, joined: 0, checked: 0, htk: 0 }; } catch (e) { return { invited: 0, joined: 0, checked: 0, htk: 0 }; } }
function refSave(email, s) { try { localStorage.setItem("hifin_ref_" + (email || "default"), JSON.stringify(s)); } catch (e) {} }

/* 내 추천 코드 — 이메일 기반 결정적 6자리(혼동 문자 제외) */
function refCode(m) {
  const seed = (m && (m.email || m.name)) || "guest";
  let h = 7; for (let i = 0; i < seed.length; i++) h = ((h * 31 + seed.charCodeAt(i)) >>> 0);
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let c = "";
  for (let i = 0; i < 6; i++) { c += A[h % A.length]; h = ((h >>> 5) ^ (h * 13 + i)) >>> 0; }
  return c;
}
function refLink(m) { return "https://hi-fintech.com/?ref=" + refCode(m); }

/* 링크 생성·공유 — 모바일 공유 시트 → 클립보드 폴백. 생성 이력은 감사로그에 */
function refShare(m) {
  const link = refLink(m);
  const s = refState(m && m.email); s.invited += 1; refSave(m && m.email, s);
  try { if (typeof vaultAccessLog === "function" && typeof anonToken === "function") vaultAccessLog(anonToken(m), "member", "추천 링크 생성·공유"); } catch (e) {}
  try { if (navigator.share) { navigator.share({ title: "하이핀 초대", text: "검진 예약만 해도 진단금 최대 1,000만 원 무료보험 + 3만 원 정밀리포트가 무료! 내 초대로 가입하면 500 HTK 보너스까지.", url: link }); return { link, mode: "share" }; } } catch (e) {}
  try { if (navigator.clipboard) { navigator.clipboard.writeText(link); return { link, mode: "copy" }; } } catch (e) {}
  return { link, mode: "manual" };
}

/* 시연: 피추천인 가입/검진완료 — 보상 적립 흐름 데모(행동 기반 2단 보상) */
function refSimulateJoin(email) { const s = refState(email); s.joined += 1; s.htk += REF_REWARD.inviter; refSave(email, s); return s; }
function refSimulateCheck(email) { const s = refState(email); s.checked += 1; s.htk += REF_REWARD.action; refSave(email, s); return s; }

/* 랜딩 유입(?ref=코드) 인식 — 게이트 안내·가입 시 양측 보상 귀속 */
function refIncoming() {
  try {
    const m = (typeof location !== "undefined" ? location.search : "").match(/[?&]ref=([A-Za-z0-9]{4,8})/);
    if (m) localStorage.setItem("hifin_ref_in", m[1].toUpperCase());
    return localStorage.getItem("hifin_ref_in");
  } catch (e) { return null; }
}
function refConsumeIncoming() { try { const c = localStorage.getItem("hifin_ref_in"); localStorage.removeItem("hifin_ref_in"); return c; } catch (e) { return null; } }
