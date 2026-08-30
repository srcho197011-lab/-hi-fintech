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
  dz => dz + " 운동이나 생활습관", dz => dz + " 회원에게 뭐라고 말해요", dz => dz + "에 피해야 할 것"];
const careCorpus = [];
for (const dz of dzKeys) for (const f of CARE_FORMS) for (const v of variants(f(dz), 9)) careCorpus.push({ cat: "care", q: v });
console.log(`care 코퍼스: 질환 ${dzKeys.length} × 6형 → ${careCorpus.length.toLocaleString()}문항`);

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
await b.close();

const acc = (ok / n * 100).toFixed(2);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const pass = Number(acc) >= 99;
console.log(`[하이프로] ${n.toLocaleString()}문항 · 정답 ${ok.toLocaleString()} · 정확도 ${acc}% · ${secs}s → ${pass ? "PASS" : "FAIL"}`);
if (fails.length) for (const f of fails) console.error(" ×", JSON.stringify(f).slice(0, 180));
writeFileSync(join(ROOT, "scripts/hipro_regression_snapshot.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), n, ok, acc: Number(acc), seconds: Number(secs), pass }, null, 2) + "\n", "utf8");
process.exit(pass ? 0 : 1);
