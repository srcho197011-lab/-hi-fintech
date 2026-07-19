/* ══════════ 회원 추천(리퍼럴) — 6대 획득 채널 ⑥ (Phase 3 · 정책 v2) ══════════
   정책 v2 (2026-07-19 재설계 — CAC<LTV·법규 검토 반영):
   ① 보상: 가입 시 추천인·피추천인 각 100 HTK(1,000원 상당) + 피추천인 '첫 검진 완료' 시 추천인 +300 HTK
      → 1건 최대 500 HTK(≈5,000원) < 검진센터 송객 순마진(5천~1만원) — 역마진 없음(네거티브 CAC 유지)
   ② 1단계만 인정: 직접 추천만 보상, 하위 추천(2단계 이상) 보상 없음 — 다단계판매 구조 아님(방문판매법 준수)
   ③ 코드 귀속(어트리뷰션): 초대 링크에 심긴 공유자 코드로 가입해야만 적립 — 코드 없는 가입은 보상 없음
   ④ 부정 방지: 실명 본인인증 1인 1계정 · 자기 코드 가입 차단 · 연 50건 한도 · 행동 기반 본보상 · 부정 수령 회수
   ⑤ HTK는 폐쇄형 포인트(현금 아님·양도 불가·플랫폼 내 사용) — 전자금융/가상자산 규제 비저촉 설계. ⚠️ 수치는 시연용 예시 */
const REF_POLICY = { joinInviter: 100, joinInvitee: 100, action: 300, annualCap: 50, level: 1 };

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

/* 코드 → 소유자 레지스트리 — 링크 공유 시 등록되어야 귀속 가능(코드가 심긴 링크만 적립) */
function _refCodes() { try { return JSON.parse(localStorage.getItem("hifin_ref_codes") || "{}"); } catch (e) { return {}; } }
function refRegisterCode(m) { try { const map = _refCodes(); map[refCode(m)] = { email: m.email, name: m.name }; localStorage.setItem("hifin_ref_codes", JSON.stringify(map)); } catch (e) {} }
function refOwnerOf(code) { try { return _refCodes()[String(code || "").toUpperCase()] || null; } catch (e) { return null; } }

/* 링크 생성·공유 — 코드 레지스트리 등록 + 모바일 공유 시트 → 클립보드 폴백 */
function refShare(m) {
  const link = refLink(m);
  refRegisterCode(m);
  const s = refState(m && m.email); s.invited += 1; refSave(m && m.email, s);
  try { if (typeof vaultAccessLog === "function" && typeof anonToken === "function") vaultAccessLog(anonToken(m), "member", "추천 링크 생성·공유(코드 " + refCode(m) + ")"); } catch (e) {}
  try { if (navigator.share) { navigator.share({ title: "하이핀 초대", text: "검진 예약만 해도 진단금 최대 1,000만 원 무료보험 + 3만 원 정밀리포트가 무료! 내 초대 코드로 가입하면 100 HTK 보너스까지.", url: link }); return { link, mode: "share" }; } } catch (e) {}
  try { if (navigator.clipboard) { navigator.clipboard.writeText(link); return { link, mode: "copy" }; } } catch (e) {}
  return { link, mode: "manual" };
}

/* ── 귀속(어트리뷰션) — 가입 시점에 유입 코드의 소유자를 찾아 1단계 보상 지급 ── */
function refAttribute(code, newEmail) {
  const owner = refOwnerOf(code);
  if (!owner) return { credited: false, reason: "코드 미등록(링크에 코드가 심겨 있어야 적립)" };
  if (owner.email === newEmail) return { credited: false, reason: "자기 코드 가입 — 보상 제외" };
  const s = refState(owner.email);
  if (s.joined >= REF_POLICY.annualCap) { s.joined += 1; refSave(owner.email, s); return { credited: false, owner, reason: "연간 한도(50건) 초과 — 보상 없이 집계만" }; }
  s.joined += 1; s.htk += REF_POLICY.joinInviter; refSave(owner.email, s);
  try { localStorage.setItem("hifin_ref_by_" + newEmail, String(code).toUpperCase()); } catch (e) {}   // 1단계 귀속 기록(행동 보상용)
  return { credited: true, owner, inviteeBonus: REF_POLICY.joinInvitee };
}

/* 행동 보상 — 피추천인이 '첫 검진'을 완료하면 추천인에게 +300 HTK (1회만) */
function refActionComplete(memberEmail) {
  try {
    const code = localStorage.getItem("hifin_ref_by_" + memberEmail);
    if (!code) return null;
    const doneK = "hifin_ref_done_" + memberEmail;
    if (localStorage.getItem(doneK)) return null;   // 1회만
    const owner = refOwnerOf(code); if (!owner) return null;
    const s = refState(owner.email); s.checked += 1; s.htk += REF_POLICY.action; refSave(owner.email, s);
    localStorage.setItem(doneK, "1");
    return { owner, reward: REF_POLICY.action };
  } catch (e) { return null; }
}

/* 랜딩 유입(?ref=코드) 인식 */
function refIncoming() {
  try {
    const m = (typeof location !== "undefined" ? location.search : "").match(/[?&]ref=([A-Za-z0-9]{4,8})/);
    if (m) localStorage.setItem("hifin_ref_in", m[1].toUpperCase());
    return localStorage.getItem("hifin_ref_in");
  } catch (e) { return null; }
}
function refConsumeIncoming() { try { const c = localStorage.getItem("hifin_ref_in"); localStorage.removeItem("hifin_ref_in"); return c; } catch (e) { return null; } }

/* 시연 — 실제 귀속 경로를 그대로 통과(코드 등록→코드 가입→검진 완료) */
function refSimulateJoin(email) {
  const m = { email, name: "회원" };
  refRegisterCode(m);
  const fake = "sim-" + Date.now().toString(36) + "@hifin.kr";
  return refAttribute(refCode(m), fake) && ((refState(email)));
}
function refSimulateCheck(email) {
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("hifin_ref_by_sim-") === 0) { const em = k.replace("hifin_ref_by_", ""); if (!localStorage.getItem("hifin_ref_done_" + em)) { refActionComplete(em); break; } } } } catch (e) {}
  return refState(email);
}
