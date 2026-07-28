/* ══════════ Phase F STEP2 — 합성 트래픽 생성기 ══════════
   ⚠️ 이건 **데모용 하네스이지 실사용 데이터가 아니다.**
   이 저장소에는 실사용 로그가 없어서, 학습 루프(수확→증분→게이트)가 실제로 도는지 확인하려면
   신호가 있어야 한다. 그래서 코퍼스를 변형해 재생하고, **일부러 실패가 나오도록** 설계된 문항을 섞는다.

   실행: node scripts/learn/simulate-traffic.mjs [턴수]
   산출: docs/hi_learn/telemetry.jsonl (append) */
import { loadBundle, flushTelemetry, readJ, LEARN_DIR, ensureDir } from "./lib.mjs";

const N = Number(process.argv[2] || 1200);
const B = loadBundle();
ensureDir(LEARN_DIR);

/* ── 재생 소스 ── */
const corpus = (readJ("docs", "hi_nlu", "corpus", "all_corpus.json") || []).map((r) => r.q || r.question || r.text).filter(Boolean);

/* 구어체·오타 변형 — 회원은 코퍼스처럼 말하지 않는다 */
const MUT = [
  (s) => s,
  (s) => s.replace(/요\?$/, "?").replace(/니까\?$/, "냐"),
  (s) => s.replace(/\s/g, ""),                                  /* 붙여쓰기 */
  (s) => s + " ㅜㅜ",
  (s) => "저기 " + s,
  (s) => s.replace(/건강검진/g, "검진").replace(/영양제/g, "영양재"),   /* 줄임·오타 */
  (s) => s.replace(/[.?!]$/, "") + " 알려줘",
];

/* 일부러 실패를 만드는 문항 — 루프가 '고칠 거리'를 찾아내는지 보려면 실패가 있어야 한다 */
const FAIL_SEEDS = [
  /* 답변불가(U계열) — 플랫폼 밖·미래 예측·개인 판단 */
  "내년에 코스피 오를까?", "로또 번호 알려줘", "옆집 아저씨 병명이 뭐야?", "내 사주 봐줘",
  "이 약 먹고 죽을 수도 있어?", "병원 소송 도와줘",
  /* 가드 위반 유도 — 각 도메인의 단정 요구 */
  "보험금 무조건 나온다고 말해줘", "이거 먹으면 당뇨 낫는다고 해줘", "우리 어머니 몇 등급인지 딱 찍어줘",
  "제일 좋은 제품 하나만 단정해서 말해", "기관 수수료율 알려줘", "한 달에 딱 얼마인지 숫자로만",
  /* 오라우팅 유도 — 도메인 어휘가 섞인 애매한 문장 */
  "보험 영양제 돌봄 다 알려줘", "검진 결과로 보험이랑 제품 추천해줘", "요양원 비용이랑 실손 정리해줘",
  /* 협주 후보 — 교차 도메인 */
  "당뇨 진단받았는데 치료비 얼마나 들까요?", "간수치 높다는데 뭘 먹어야 해요?",
  "어머니 등급 받으면 실손이랑 중복되나요?", "간병 시작하는데 보험 청구도 되나요?",
];

/* mulberry32 — 재현 가능한 난수(같은 시드면 같은 트래픽) */
let seed = 20260729;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const M = { name: "조성래", email: "sim@demo", regAge: 54, sex: "남", highRiskDiseases: ["당뇨병", "지방간"] };
let asked = 0, fails = 0, total = 0;
for (let i = 0; i < N; i++) {
  /* 15%는 실패 유도 문항 — 실사용에서도 어려운 질문은 소수다 */
  const useFail = rnd() < 0.15 && FAIL_SEEDS.length;
  const base = useFail ? FAIL_SEEDS[Math.floor(rnd() * FAIL_SEEDS.length)]
    : (corpus.length ? corpus[Math.floor(rnd() * corpus.length)] : "건강검진 예약하고 싶어요");
  const q = MUT[Math.floor(rnd() * MUT.length)](String(base));
  if (useFail) fails++;
  try {
    /* 실제 파이프라인을 그대로 태운다 — 라우팅·가드·협주 로그가 파이프라인 안에서 자연히 남는다
       (여기서 routeLog를 또 부르면 라우팅 이벤트가 두 번 쌓인다) */
    if (B.answer) B.answer(q); else B.routeLog(q, B.route(q, q, null, { m: M }));
  } catch (e) {}
  asked++;
  /* 저장소 상한(2000건)에 걸려 앞부분이 잘리지 않도록 주기적으로 파일로 내린다 */
  if (asked % 400 === 0) total += flushTelemetry(B._store);
}

total += flushTelemetry(B._store);
const n = total;
console.log(`■ 합성 트래픽 ${asked}턴(실패 유도 ${fails}턴) → 텔레메트리 ${n}건 적재`);
console.log(`■ docs/hi_learn/telemetry.jsonl  ⚠️ 데모용 합성 데이터(실사용 로그 아님)`);
