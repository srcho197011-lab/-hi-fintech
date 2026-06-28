/* 데모 인증/회원 저장 유틸 — localStorage 기반(백엔드 없음). + 자가 테스트 runDemoTests() */
const DEMO_KEY = "hifin_demo_members";
const DEMO_SESSION_KEY = "hifin_demo_session";
function demoRegistered() { try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch (e) { return []; } }
function demoRegisterAll() {
  const cur = demoRegistered();
  const emails = new Set(cur.map((m) => m.email));
  let added = 0, skipped = 0;
  (demoMembers || []).forEach((m) => { if (emails.has(m.email)) { skipped++; } else { cur.push(m); emails.add(m.email); added++; } });
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(cur)); } catch (e) {}
  return { added, skipped, total: cur.length };
}
function demoListAll() { const r = demoRegistered(); return r.length ? r : (demoMembers || []); }
function demoFindByEmail(email) { const e = (email || "").trim().toLowerCase(); return demoListAll().find((m) => m.email.toLowerCase() === e); }
function demoAuthenticate(email, pw) { const m = demoFindByEmail(email); return (m && pw === "Demo@1234") ? m : null; }
function demoCurrentUser() { try { return JSON.parse(localStorage.getItem(DEMO_SESSION_KEY)); } catch (e) { return null; } }
function demoNotify() { try { window.dispatchEvent(new Event("demochange")); } catch (e) {} }
function demoSetSession(m) { try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(m)); } catch (e) {} demoNotify(); }
function demoLogout() { try { localStorage.removeItem(DEMO_SESSION_KEY); } catch (e) {} demoNotify(); }

/* ── 일반 로그인/회원가입 인증(게이트) — localStorage 기반 ── */
const AUTH_KEY = "hifin_authed";       // 게이트 통과(현재 로그인) 사용자 {name,email,realVerified}
const USERS_KEY = "hifin_users";       // 실명확인 후 가입한 일반 회원 저장소
function authCurrent() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch (e) { return null; } }
function authSet(u) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); } catch (e) {} demoNotify(); }
function appLogout() { try { localStorage.removeItem(AUTH_KEY); localStorage.removeItem(DEMO_SESSION_KEY); } catch (e) {} demoNotify(); }
function usersAll() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch (e) { return []; } }
function usersSave(l) { try { localStorage.setItem(USERS_KEY, JSON.stringify(l)); } catch (e) {} }
function userFindByEmail(email) { const e = (email || "").trim().toLowerCase(); return usersAll().find((u) => (u.email || "").toLowerCase() === e) || null; }
function userRegister(u) { if (userFindByEmail(u.email)) return false; const l = usersAll(); l.push(u); usersSave(l); return true; }
/* 데모회원(Demo@1234) → 가입회원(개별 비번) 순으로 인증 */
function appAuthenticate(email, pw) { const m = demoAuthenticate(email, pw); if (m) return m; const u = userFindByEmail(email); return (u && u.password === pw) ? u : null; }

/* 테스트 시나리오 자가검증(11항목) — 실제 로직/데이터에 대해 단언 */
function runDemoTests() {
  const t = [];
  const add = (name, pass, detail) => t.push({ name, pass: !!pass, detail: detail || "" });
  const M = demoMembers || [];
  add("데모 회원 16명 일괄 등록 가능", M.length === 16 && M.every((m) => m.isDemoUser === true), `${M.length}명 · isDemoUser`);
  demoRegisterAll();
  const r2 = demoRegisterAll();
  add("중복 등록 방지 가능", r2.added === 0, `재실행 신규 ${r2.added}명`);
  add("회원별 로그인 가능", !!demoAuthenticate(M[0].email, "Demo@1234") && !demoAuthenticate(M[0].email, "wrong"), "정상/오류 비번 구분");
  add("회원별 대시보드 데이터 상이", M.length > 6 && M[0].biologicalAge !== M[6].biologicalAge, "회원 간 값 다름");
  const cg = (g) => demoCancerGrade(g)[0];
  add("암위험도 등급 색상 정상", cg(3) === "양호" && cg(5) === "주의" && cg(7) === "경고" && cg(8) === "고위험", "1-3/4-5/6-7/8+");
  const m7 = demoFindByEmail("pcb570815@hizenhealth.com") || M[6];
  add("10년 후 의료비 자동 계산", demoCostForecast(m7.estimatedMedicalCost) === Math.round(m7.estimatedMedicalCost * 1.4), "×1.4");
  const recP = demoInsuranceRecs({ highRiskCancerTypes: ["췌장암"], cancerRiskGrade: 7 }).some((r) => r[0].indexOf("고액암") >= 0);
  const recC = demoInsuranceRecs({ highRiskCancerTypes: ["대장암"], cancerRiskGrade: 5 }).some((r) => r[0].indexOf("대장암") >= 0);
  add("보험 추천이 암위험도별 상이", recP && recC, "췌장→고액암 / 대장→대장암");
  const w = demoWalletCalc({ cancerRiskGrade: 7, managementPoints: ["a", "b", "c"] });
  add("건강지갑 예상 적립액 계산", w.total === 60000 && w.focus === 20000 && w.practice === 10000, `총 ${w.total.toLocaleString("ko-KR")}원`);
  const pa = demoPersonalAnswer(M[6] || M[0]);
  add("AI 주치의 회원별 응답", !!pa && pa.sections.length === 6 && pa.title.indexOf((M[6] || M[0]).name) >= 0, "7파트 구조화 분석");
  const noOverflow = (typeof document !== "undefined") ? (document.body.scrollWidth <= document.documentElement.clientWidth + 2) : true;
  add("모바일/반응형 가로 넘침 없음", noOverflow, `현재 폭 ${typeof document !== "undefined" ? document.documentElement.clientWidth : "?"}px`);
  const errs = (typeof window !== "undefined" && window.__demoErrors) ? window.__demoErrors.length : 0;
  add("콘솔 오류 없음(런타임)", errs === 0, `JS 오류 ${errs}건`);
  return t;
}
const DEMO_CHK_NAMES = ["데모 회원 16명 일괄 등록 가능", "중복 등록 방지 가능", "회원별 로그인 가능", "회원별 대시보드 데이터 상이", "암위험도 등급 색상 정상", "10년 후 의료비 자동 계산", "보험 추천이 암위험도별 상이", "건강지갑 예상 적립액 계산", "AI 주치의 회원별 응답", "모바일/반응형 가로 넘침 없음", "콘솔 오류 없음(런타임)"];
