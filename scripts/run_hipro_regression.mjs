/* ══════════ 하이프로 1만 Q&A 전수 회귀 — 2단계 v1.4 축⑤ P6 ══════════
   결정론 생성(8카테고리 × 주제 × 표현 변형 — nav10k 패턴) → 전수 채점.
   채점: 분류 일치 · 원천(src) 존재 · "사전에 없음" 아님. 게이트: 정확도 99%+ · 기존 회귀 저하 0(커밋 게이트 별도).
   대량 저장 금지 — 코퍼스는 실행 중 생성·채점만(§9). 산출: scripts/hipro_regression_snapshot.json */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();

/* 표현 변형기(결정론) — 어미·존칭·어순 */
const WRAP = [q => q, q => q + "?", q => "하이프로, " + q, q => "프로인데 " + q, q => q + " 알려줘", q => q + " 궁금해요",
  q => "저기 " + q, q => q + " 좀", q => "급해요 — " + q, q => "지금 " + q, q => q + " 알수있을까요", q => "협주 중인데 " + q, q => "회원 앞이에요, " + q, q => q + " 부탁해요"];
function variants(base, n) { const out = []; for (let k = 0; k < n; k++) out.push(WRAP[k % WRAP.length](base)); return [...new Set(out)]; }

/* 주제 시드 — {cat, q(기본형)} */
const seeds = [];
const STAGES = ["D1", "D2", "D3", "D4", "L5", "L6", "L7", "L8"];
for (const st of STAGES) {
  seeds.push({ cat: "stage", q: st + "가 뭐예요" }, { cat: "stage", q: st + " 단계 설명해줘" }, { cat: "stage", q: st + "에서 다음 단계 가려면" });
  seeds.push({ cat: "role", q: st + "에서 프로 역할이 뭐예요" }, { cat: "role", q: st + " 회원한테는 뭘 제안해요" });
}
seeds.push({ cat: "stage", q: "정체면 어떻게 해요" }, { cat: "stage", q: "락이 뭐예요" }, { cat: "stage", q: "접촉 금지는 언제 풀려요" });
const CARDQ = ["왜 이 지시예요", "이 카드 이유가 뭐예요", "뭐라고 시작해요", "첫 마디 알려줘", "오프닝 뭐예요", "거절하면 어떻게 해요", "싫다고 하면 어떻게 해요", "심각하냐고 물으면", "큰 병이냐고 물어보면", "문자로는 뭐라고 보내요", "문자 내용 알려줘", "언제까지 해야 해요", "기한이 언제예요", "다음은 뭐예요"];
for (const q of CARDQ) seeds.push({ cat: "card", q, needCard: true });
const CLIN = ["혈압", "공복혈당", "당화혈색소", "콜레스테롤", "중성지방", "간수치", "AST", "ALT", "크레아티닌", "BMI", "허리둘레", "요산", "TSH"];
for (const c of CLIN) { seeds.push({ cat: "clinical", q: c + " 주의 구간 기준이 뭐예요" }, { cat: "clinical", q: c + " 위험 기준 알려줘" }); }
for (const g of ["1세대", "2세대", "3세대", "4세대", "5세대"]) { seeds.push({ cat: "cost", q: "실손 " + g + " 자기부담 얼마예요" }, { cat: "cost", q: g + " 실손 보장 차이가 뭐예요" }); }
seeds.push({ cat: "cost", q: "진단금은 평균 얼마예요" }, { cat: "cost", q: "본인부담은 어떻게 계산해요" }, { cat: "cost", q: "치료비는 어떻게 준비해요" });
for (const s2 of ["거절", "보류", "수락", "가족", "바쁘다는 회원", "무서워하는 회원", "보험 질문", "비용 질문", "쉬운말"]) seeds.push({ cat: "script", q: s2 + " 응대 대본 찾아줘" });
seeds.push({ cat: "system", q: "결과 기록 어디서 해요" }, { cat: "system", q: "통화 결과 어떻게 남겨요" }, { cat: "system", q: "백업 어떻게 해요" }, { cat: "system", q: "관제탑이 뭐예요" }, { cat: "system", q: "통합 운영 어디 있어요" });
seeds.push({ cat: "curves", q: "회원이 치료비 얼마냐고 물으면 어떻게 해요" }, { cat: "curves", q: "회원이 비용 질문하면" }, { cat: "curves", q: "대비 현황 물으면 어떻게 답해요" }, { cat: "curves", q: "회원이 생활비 걱정을 물으면" });
seeds.push({ cat: "role", q: "케어 플랜은 어떻게 조합해요" }, { cat: "role", q: "첫 상담에서 뭘 제안해요" }, { cat: "role", q: "영양제는 어떤 회원한테 어울려요" }, { cat: "role", q: "식단은 언제 제안해요" }, { cat: "role", q: "기기는 어떤 회원에게 필요해요" });
/* 60일 사이클·만기·보장맵·세그먼트·제공DB(R6) */
for (const t of ["T0","T1","T2","T3","T4","T5","T6","T7","T8"]) seeds.push({ cat: "cycle", q: t + "가 뭐예요" });
seeds.push({ cat: "cycle", q: "60일 사이클이 뭐예요" }, { cat: "cycle", q: "만기 되면 어떻게 해요" }, { cat: "cycle", q: "보장맵이 뭐예요" },
  { cat: "cycle", q: "무인 보장분석 누가 해요" }, { cat: "cycle", q: "승환 창이 뭐예요" }, { cat: "cycle", q: "세그먼트가 뭐예요" },
  { cat: "cycle", q: "G2가 뭐예요" }, { cat: "cycle", q: "G10b 설명해줘" }, { cat: "cycle", q: "G8이 뭐예요" },
  { cat: "cycle", q: "제공 DB 뭐가 나가요" }, { cat: "cycle", q: "2차 골든타임이 뭐예요" });

/* 영상 상담(V6) — 원천: VIDEO_SPEC·VS_SHARE_DOCS·VS_SEG_FIT·INTERVENTIONS */
seeds.push({ cat: "video", q: "영상 상담이 뭐예요" }, { cat: "video", q: "영상 통화 어떻게 해요" },
  { cat: "video", q: "녹화되나요" }, { cat: "video", q: "녹화 남아요?" },
  { cat: "video", q: "화면 공유 뭐가 돼요" }, { cat: "video", q: "같이 보기 어떤 게 있어요" },
  { cat: "video", q: "영상 요청이 왜 안 돼요" }, { cat: "video", q: "화상 연결이 불가한 이유는" },
  { cat: "video", q: "개입 발행이 뭐예요" }, { cat: "video", q: "진료 완결은 언제 잡혀요" },
  { cat: "video", q: "원격진료 완결 어떻게 확인해요" }, { cat: "video", q: "영상 권장은 무슨 뜻이에요" },
  { cat: "video", q: "카메라 켜야 하나요" },
  /* 시간대 — 게이트에서 뺐으니 문항으로 지킨다(형 지시 2026-09-04) */
  { cat: "video", q: "밤에도 영상 요청 돼요" }, { cat: "video", q: "야간에 영상 상담 가능해요" },
  { cat: "video", q: "새벽에 영상 통화 되나요" }, { cat: "video", q: "영상 상담 시간 제한 있어요" },
  { cat: "video", q: "몇 시까지 영상 요청할 수 있어요" }, { cat: "video", q: "영상 상담 시간대가 어떻게 돼요" });

/* D2 골든타임·3종·케어 키트(F4) */
seeds.push({ cat: "role", q: "골든타임에 뭘 말해요" }, { cat: "role", q: "골든타임이 뭐예요" }, { cat: "role", q: "무료 3종 뭐라고 안내해요" }, { cat: "role", q: "3종 서비스가 뭐예요" }, { cat: "role", q: "케어 키트가 뭐예요" }, { cat: "role", q: "케어 키트 구성은 어떻게 정해져요" });

/* 변형 확장 → 1만+ */
const corpus = [];
for (const s2 of seeds) for (const v of variants(s2.q, 14)) corpus.push({ cat: s2.cat, q: v, needCard: !!s2.needCard });
/* 카드 문맥 문항은 카드 15장에 교차 적용해 증폭 */
const CARD_IDX = Array.from({length: 50}, (_, k) => 1 + k * 61);   // 결정론 30카드
console.log(`코퍼스: 시드 ${seeds.length} → 변형 ${corpus.length}문항(카드 문맥은 ×${CARD_IDX.length})`);

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1280, height: 900 } });
const p = await b.newPage();
await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
await p.evaluate(() => { const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; S(document.querySelector('input[name="hifin-login-id"]'), '하이'); S(document.querySelector('input[name="hifin-login-pw"]'), '하이1'); [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click(); });
await sleep(4200);

/* care 코퍼스 — 질환 197키는 페이지 원천(_DZCARE)에서 동적 수신(사전 이원화 금지) × 질문 6형 × 변형 */
const dzKeys = await p.evaluate(() => (window.__hifinDzKeys ? window.__hifinDzKeys() : []));
if (!Array.isArray(dzKeys) || dzKeys.length < 100) { console.error("질환 원천 수신 실패:", dzKeys && dzKeys.length); await b.close(); process.exit(1); }
const CARE_FORMS = [dz => dz + " 건강관리 방법", dz => dz + " 식단 뭐가 좋아요", dz => dz + "에 좋은 영양제 있어요",
  dz => dz + " 운동이나 생활습관", dz => dz + " 회원에게 뭐라고 말해요", dz => dz + "에 피해야 할 것", dz => dz + "에 좋은 영양소는"];
const careCorpus = [];
for (const dz of dzKeys) for (const f of CARE_FORMS) for (const v of variants(f(dz), 9)) careCorpus.push({ cat: "care", q: v });
/* 용어 질문 — 사전 키는 페이지 원천(HIPRO_TERMS)에서 동적 수신 + 원천 문장 검색형 대표 */
const termKeys = await p.evaluate(() => (window.__hifinTerms ? window.__hifinTerms() : []));
if (!Array.isArray(termKeys) || !termKeys.length) { console.error("용어 사전 수신 실패"); await b.close(); process.exit(1); }
const TERM_FORMS = [k => k + "가 뭐야", k => k + "이 뭐예요", k => k + " 무슨 뜻이야"];
for (const k of termKeys) for (const f of TERM_FORMS) for (const v of variants(f(k), 6)) careCorpus.push({ cat: "care", q: v });
console.log(`care 코퍼스: 질환 ${dzKeys.length} × ${CARE_FORMS.length}형 + 용어 ${termKeys.length} × ${TERM_FORMS.length}형 → ${careCorpus.length.toLocaleString()}문항(+후속 맥락 시나리오)`);

let n = 0, ok = 0; const fails = [];
const plain = corpus.filter(c => !c.needCard).concat(careCorpus);
const cardQ = corpus.filter(c => c.needCard);
const CH = 400;
for (let i = 0; i < plain.length; i += CH) {
  const part = await p.evaluate((qs) => qs.map(x => { const r = window.__hifinHiPro(x.q); return { cat: x.cat, q: x.q, got: r.cat, src: r.src, none: !!r.none }; }), plain.slice(i, i + CH));
  for (const r of part) { n++; if (r.got === r.cat && r.src && !r.none) ok++; else if (fails.length < 12) fails.push(r); }
}
for (const ci of CARD_IDX) {
  const part = await p.evaluate((qs, idx) => qs.map(x => { const r = window.__hifinHiPro(x.q, idx); return { cat: x.cat, q: x.q, got: r.cat, src: r.src, none: !!r.none }; }), cardQ, ci);
  for (const r of part) { n++; if (r.got === r.cat && r.src && !r.none) ok++; else if (fails.length < 12) fails.push({ ...r, ci }); }
}
/* 후속 맥락 시나리오 — 질환 질문 뒤 "관련 영양소는?"류가 직전 질환으로 이어지는지(결정론: 매 5번째 질환) */
const FOLLOW_QS = ["관련 영양소는?", "식단은 어떻게 해요", "피해야 할 음식은?", "관련 기기 있어요?"];
const ctxDz = dzKeys.filter((_, i) => i % 5 === 0);
for (const dz of ctxDz) {
  const part = await p.evaluate((d, fqs) => {
    window.__hifinHiPro(d + " 건강관리 방법 알려줘");   // 맥락 심기
    return fqs.map(fq => { const r = window.__hifinHiPro(fq); return { q: d + " → " + fq, got: r.cat, src: r.src, none: !!r.none, hitDz: (r.src || "").indexOf(d) >= 0 }; });
  }, dz, FOLLOW_QS);
  for (const r of part) { n++; if (r.got === "care" && r.src && !r.none && r.hitDz) ok++; else if (fails.length < 12) fails.push(r); }
}
/* 시간대 문구 검사(형 지시 2026-09-04) — 분류가 맞아도 문장이 옛 규칙을 말하면 소용없다.
   판정 기준은 내가 쓴 실제 문안에서 역으로 뽑는다(문안과 검사가 어긋나면 검사가 헛돈다). */
const HOURQ = ["밤에도 영상 요청 돼요", "야간에 영상 상담 가능해요", "새벽에 영상 통화 되나요",
  "영상 상담 시간 제한 있어요", "몇 시까지 영상 요청할 수 있어요", "영상 상담 시간대가 어떻게 돼요",
  "영상 요청이 왜 안 돼요", "영상 상담이 뭐예요"];
const hourChk = await p.evaluate((qs) => qs.map(q => { const r = window.__hifinHiPro(q) || {}; return { q, cat: r.cat || null, src: r.src || "", none: !!r.none, text: r.text || "" }; }), HOURQ);
const hourBad = [];
const OLD = /(9\s*시\s*~\s*20\s*시|20\s*시\s*(밖|까지|에만)|시간대\s*밖|시간대에만|막히는\s*이유는\s*다섯|undefined시)/;
for (const r of hourChk) {
  if (r.cat !== "video") hourBad.push("분류 이탈: " + r.q + " → " + r.cat);
  if (!r.src || r.none) hourBad.push("원천 없음: " + r.q);
  if (OLD.test(r.text)) hourBad.push("옛 시간대 문구 잔존: " + r.q + " → " + r.text.slice(0, 40));
  /* 부재만으로는 부족 — 관련 답변 전건이 「정해진 시간대는 없다」를 실제로 말해야 한다 */
  if (!/정해진\s*시간대는\s*없/.test(r.text)) hourBad.push("시간 무제한 미명시: " + r.q);
}
/* 형 원칙의 두 반쪽 — ①때를 정하는 쪽이 회원 ②그렇다고 약속 없는 심야 발신 허용은 아니다 */
const hoursAns = hourChk.find(r => r.q === "영상 상담 시간 제한 있어요") || {};
if (!/(때를\s*정하는\s*쪽이\s*회원|여쭤보시고|원하시는\s*때)/.test(hoursAns.text || "")) hourBad.push("「때를 정하는 쪽이 회원」이 답변에 없음");
if (!/약속\s*없이\s*심야에\s*먼저\s*거는\s*건\s*원칙이\s*아니/.test(hoursAns.text || "")) hourBad.push("심야 콜드콜 경계가 답변에 없음");
if (!/광고[\s\S]{0,40}(야간|밤\s*9)/.test(hoursAns.text || "")) hourBad.push("광고성 야간 미발송 규칙과의 구분이 없음");
const gateAns = hourChk.find(r => r.q === "영상 요청이 왜 안 돼요") || {};
if (!/막히는\s*이유는\s*넷/.test(gateAns.text || "")) hourBad.push("차단 사유가 넷으로 정리되지 않음");

await b.close();

const acc = (ok / n * 100).toFixed(2);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const pass = Number(acc) >= 99 && hourBad.length === 0;
console.log(`[하이프로] ${n.toLocaleString()}문항 · 정답 ${ok.toLocaleString()} · 정확도 ${acc}% · ${secs}s → ${pass ? "PASS" : "FAIL"}`);
console.log(`[시간대  ] 영상 문구 ${hourChk.length}건 검사 · 위반 ${hourBad.length}`);
if (fails.length) for (const f of fails) console.error(" ×", JSON.stringify(f).slice(0, 180));
if (hourBad.length) for (const h of hourBad) console.error(" × 시간대", h);
writeFileSync(join(ROOT, "scripts/hipro_regression_snapshot.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), n, ok, acc: Number(acc), hourChecks: hourChk.length, hourBad: hourBad.length, seconds: Number(secs), pass }, null, 2) + "\n", "utf8");
process.exit(pass ? 0 : 1);
