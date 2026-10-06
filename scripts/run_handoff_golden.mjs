/* ══════════ 골든셋 탐색 러너 — 지시서 프롬프트 v1.3 §8-P3 ══════════
   코호트 인덱스를 __hifinCard(직접 호출)로 스캔해 「프로의 아침 5인」 조건에 맞는
   실존 회원을 찾는다 — 조건에 맞춰 데이터를 지어내지 않는다(케이스가 데이터를 고르지,
   데이터가 케이스에 꿰맞춰지지 않는다). 산출: fixtures/handoff_cards_sample_v1.json
   실행: bash build_preview.sh && python -m http.server 5601 → node scripts/run_handoff_golden.mjs */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { devLogin } from './devcred.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await devLogin(p);

/* 5조건 — 형 확정 시나리오(v1.3 §8-P3). male/female 표기는 프로필 원문을 그대로 허용 */
const male = s => /^남|^M/i.test(String(s)); const female = s => /^여|^F/i.test(String(s));
/* 데이터 대조 조정(2026-08-29 실스캔): M·지질과 체격·근골격 주도는 코호트 합성 분포에 실재하지 않음
   (질병 기반 합성이라 지질·bmi 단독 주의가 안 나옴) — 시나리오 취지를 유지한 채 실재 유형으로 치환.
   c2: 지질→신장·혈액·기타(M 단일 재검+코칭 취지 동일) · c4: body 가족특례→고령 쉬운말 변형 검증. */
/* 단계 배제 명시(형 지시 2026-10-06) — c1·c2·c4는 등급만 보고 stage를 보지 않아 종전에 D1 회원이
   첫 매치였다. 결과 대기(W)는 grade H/M에 걸리지 않아 자동으로 빠지지만 **명시하는 쪽이 낫고**,
   D2를 배제하지 않으면 c6·c7(둘 다 D2)과 합쳐 10케이스 중 3건이 골든타임으로 쏠려 c4의 취지
   (고령 쉬운말 본론 변형)가 3종 전문에 묻힌다. */
const notStage = c => c.member.stage !== "D1" && c.member.stage !== "D2";
const CASES = [
  { key: "c1", ko: "H 복합 · 50대 남 · 혈압/혈당 주도", pick: c => notStage(c) && c.grade === "H" && (c.group === "bp" || c.group === "sugar") && c.member.ageBand === "50대" && male(c.member.sex) && c.actions.some(a => a.key === "clinic") && c.member.stalledDays < 14 },
  { key: "c2", ko: "M 단일 · 40대 여 · 신장·혈액·기타(재검+코칭)", pick: c => notStage(c) && c.grade === "M" && c.group === "organ" && c.member.ageBand === "40대" && female(c.member.sex) && c.member.stalledDays < 14 },
  /* 지표군 커버리지 복구(적대적 리뷰 실증 2026-10-06) — 단계 배제를 넣으면서 c1~c4가 전부 D3로
     몰려 {sugar, organ, liver}만 남고 `co-lipid`·`tk-lipid`·`sd-lipid` 계열 문안이 비교 집합 밖으로
     나갔다(HEAD fixture의 c4는 group=lipid였다). 지표군을 케이스 조건에 명시해 되돌린다. */
  { key: "c2b", ko: "지질 주도 · 등급 무관(지질 계열 문안 고정)", pick: c => notStage(c) && c.group === "lipid" && !c.member.stalled },
  { key: "c3", ko: "간수치 + 절주 플래그 · 30대 남(습관 우선 특례)", pick: c => c.group === "liver" && male(c.member.sex) && c.member.ageBand === "30대" && c.evidence.some(e => e.indexOf("절주") >= 0) && c.member.stalledDays < 14 },
  { key: "c4", ko: "H · 70대↑ 여 · 쉬운말 변형(고령 대본)", pick: c => notStage(c) && c.grade === "H" && female(c.member.sex) && c.script.variant === "쉬운말" && c.member.stalledDays < 14 },
  { key: "c5", ko: "정체 14일+ · 관리 재개", pick: c => c.member.stalledDays >= 14 && c.trigger.indexOf("정체") === 0 },
  /* 단계 케이스(형 지시 2026-10-05) — 종전 5케이스는 D1 4건·정체 D4 1건이라, 단계 축으로 새로
     조립되는 경로(D2 골든타임·접촉 금지 prep·L6 응급 선행·L8 재산정)를 한 건도 지나지 않았다.
     조건은 「단계가 그 단계인 실존 회원」이지 특정 문안이 아니다 — 데이터가 케이스를 고르지 않는다. */
  { key: "c6", ko: "D2 첫 연결 골든타임 · 무료 3종 전달", pick: c => c.member.stage === "D2" && c.member.stalledDays < 14 && (c.script.firstconnect || []).length > 0 },
  /* ⚠️ c7 pick을 **실제 정체 판정**으로 바꿨다(적대적 리뷰 실증 2026-10-06): `stalledDays >= 14`는
     정체를 뜻하지 않아서(비정체 회원도 0~24일) 재생성된 fixture의 c7이 i=2 · variant 「기본」 ·
     grade '-'였다 — 케이스 이름이 주장하는 조립 경로(op-restart·cl-open)를 10케이스 중 아무도
     지나지 않았다. 카드가 들고 있는 member.stalled / variant를 본다. */
  { key: "c7", ko: "D2 정체 · 3종을 아직 못 받은 회원(재개 변형)", pick: c => c.member.stage === "D2" && c.member.stalled && c.script.variant.indexOf("정체") >= 0 && (c.script.firstconnect || []).length > 0 },
  /* ⚠️ c11 신설 — **쿼터로 명단 1번에 오는 카드 종류가 텍스트 고정 밖**이었다(적대적 리뷰 실증):
     새 fixture의 D2는 c6(L)·c7('-') 둘뿐이라 「fc 무료 3종 + seed(sd-*) + co-h 본론 + careplan 3칸」이
     한꺼번에 조립되는 D2/H·M 경로(실존 — 8H0005 로스터 1번)가 어디에도 고정돼 있지 않았다.
     이 경로는 trigger에 등급 사유가 병기되는 분기까지 함께 고정한다. */
  { key: "c11", ko: "D2 첫 연결 × 실등급(H·M) — 3종 + 등급 본론 + 케어플랜 동시 조립", pick: c => c.member.stage === "D2" && (c.grade === "H" || c.grade === "M") && !c.member.stalled && (c.script.firstconnect || []).length > 0 && (c.script.careplan || []).length > 0 },
  /* ⚠️ c12 신설 — 쉬운말 D2(65세↑). c4의 notStage가 D2를 배제하면서 「쉬운말 변형 × 무료 3종」이
     가드 밖으로 나갔는데, 그 유형이 바로 시연 로스터 2번 카드(i=20992 허종완 · D2 · 쉬운말)다. */
  { key: "c12", ko: "D2 첫 연결 × 65세↑ 쉬운말 — 3종 문안의 쉬운말 변형", pick: c => c.member.stage === "D2" && c.script.variant === "쉬운말" && !c.member.stalled && (c.script.firstconnect || []).length > 0 },
  { key: "c8", ko: "D1 접촉 금지 · 사전 준비(발송 문안 없음)", pick: c => c.member.stage === "D1" && (c.script.prep || []).length > 0 && c.trigger.indexOf("배정 완료") === 0 },
  { key: "c9", ko: "L6 가족·돌봄 · 응급 선행 안내", pick: c => c.member.stage === "L6" && (c.script.alert || []).length > 0 },
  { key: "c10", ko: "L8 평생주기 · 재산정 안내(심사 단서 동반)", pick: c => c.member.stage === "L8" && (c.script.stage || []).length > 0 },
];
/* 완화 단계 — 1차 스캔에서 비면 조건을 한 겹 풀어 재탐색(완화 사실은 산출물에 기록) */
const RELAX = {
  c3: c => c.group === "liver" && male(c.member.sex) && c.evidence.some(e => e.indexOf("절주") >= 0) && c.member.stalledDays < 14,
};

const t0 = Date.now(); const N = 6000; const CH = 400;
const found = {}; const relaxed = {}; const taken = new Set(); const stats = { scanned: 0, byGrade: {}, unpub: 0 };
for (let i = 0; i < N; i += CH) {
  const part = await p.evaluate((from, to) => {
    const out = [];
    for (let j = from; j < to; j++) { try { const c = window.__hifinCard(j); if (c && !c.error) out.push(c); } catch (e) {} }
    return out;
  }, i, Math.min(i + CH, N));
  for (const c of part) {
    stats.scanned++; stats.byGrade[c.grade] = (stats.byGrade[c.grade] || 0) + 1;
    if (!c.compliance.publishable) { stats.unpub++; continue; }
    /* 한 카드가 여러 케이스를 채우지 않게 — 10케이스 = 10명으로 고정한다(종전 루프는 채워진 **키**만
       건너뛰고 「이 카드는 이미 썼다」는 가드가 없어, 인덱스 순서가 흔들리면 10케이스가 실질 9건으로
       조용히 줄 수 있었다 · 형 지시 2026-10-06) */
    if (taken.has(c.member.cohortIndex)) continue;
    for (const cs of CASES) if (!found[cs.key] && cs.pick(c)) { found[cs.key] = c; taken.add(c.member.cohortIndex); break; }
  }
  if (Object.keys(found).length === CASES.length) break;
}
for (const cs of CASES) {
  if (found[cs.key] || !RELAX[cs.key]) continue;
  for (let i = 0; i < N && !found[cs.key]; i += CH) {
    const part = await p.evaluate((from, to) => { const out = []; for (let j = from; j < to; j++) { try { const c = window.__hifinCard(j); if (c && !c.error) out.push(c); } catch (e) {} } return out; }, i, Math.min(i + CH, N));
    for (const c of part) if (c.compliance.publishable && !taken.has(c.member.cohortIndex) && RELAX[cs.key](c)) { found[cs.key] = c; taken.add(c.member.cohortIndex); relaxed[cs.key] = true; break; }
  }
}
await b.close();

const missing = CASES.filter(cs => !found[cs.key]);
console.log(`스캔 ${stats.scanned}명 · 등급 분포 ${JSON.stringify(stats.byGrade)} · 발행불가 ${stats.unpub}`);
for (const cs of CASES) console.log(`${found[cs.key] ? "✅" : "❌"} ${cs.key} ${cs.ko}${relaxed[cs.key] ? " (완화 적용)" : ""}${found[cs.key] ? " → i=" + found[cs.key].member.cohortIndex + " " + found[cs.key].member.mask + " " + found[cs.key].grade + "/" + found[cs.key].groupKo : ""}`);
if (missing.length) { console.error("골든셋 미충족 — 조건 재협의 필요"); process.exit(1); }

mkdirSync(join(ROOT, "fixtures"), { recursive: true });
const doc = { meta: { v: "1.3", spec: "지시서 v1.3 §8-P3 + 단계 축(형 지시 2026-10-05) + 결과 대기·쿼터·창 상태(형 지시 2026-10-06)", scanned: stats.scanned, relaxed: Object.keys(relaxed),
    note: "코호트 실스캔 — 케이스가 데이터를 고름(역방향 조작 없음)",
    why: "v1.3 재생성 사유 — ①D2 trigger가 **창 상태**를 말한다(열림 「첫 연결 골든타임 — 무료 3종 전달」 / 만료 「첫 연결 미완료 — 무료 3종 미전달」)이고 H·M은 등급 사유를 병기 ②등급 '-'을 RISK_GRADE_META에 등재(timing.sla가 더는 「-」가 아니고 D2 '-'는 창에서 파생) ③card.member.stalled 신설(정체 프록시 제거) ④케이스 재정의 — c7은 실제 재개 변형만, c2b(지질)·c11(D2×실등급)·c12(D2×쉬운말) 신설 / v1.2 사유 — ①D1을 결과 대기(W)·사전 준비 카드로 바꿈(등급·권장 개입·통화 대본 미조립, grade W·gradeWhy 「검진 결과 수령 전 — 등급 미산정」·script.callScript false) ②D2 trigger를 「첫 연결 골든타임 — 무료 3종 전달」로 ③일일 로스터에 되돌릴 수 없는 창 쿼터(D2 3칸·만기 T5·T6 1칸) 신설 + 접촉 금지 단계 제외 + D2는 등급 '-'도 포함 ④전달 체크 6칸(「건강관리 동의 요청」 신설) ⑤c1·c2·c4에 단계 배제 명시, 한 카드가 두 케이스를 채우지 않게 가드 추가 / v1.1 사유 — D1 결과 기반 필드 절단·쉬운말 L5~L8 클로징·fc-ins 분할·단계 케이스 c6~c10 추가" },
  cases: CASES.map(cs => ({ key: cs.key, ko: cs.ko, relaxed: !!relaxed[cs.key], card: found[cs.key] })) };
writeFileSync(join(ROOT, "fixtures/handoff_cards_sample_v1.json"), JSON.stringify(doc, null, 2), "utf8");
console.log(`fixtures/handoff_cards_sample_v1.json 저장 · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
