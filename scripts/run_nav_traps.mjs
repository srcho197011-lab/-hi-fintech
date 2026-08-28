/* 함정 세트 러너(설계 프롬프트 v2.1 §7 · P2 게이트) — 관리자 세션에서 __hifinNavTest 직접 호출(UI 경유 금지).
   함정·다의어는 navRouting.js가 같은 인덱스에서 생성한다(단일 소스). 실행:
     1) bash build_preview.sh && python -m http.server 5601   (저장소 루트)
     2) node scripts/run_nav_traps.mjs                        (puppeteer-core 필요 — NODE_PATH로 지정 가능)
   게이트: 실패 0건이어야 커밋한다. */
import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox','--disable-gpu'], defaultViewport:{width:1280,height:900} });
const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(String(e).slice(0,180)));
await p.goto('http://localhost:5601/preview.html',{waitUntil:'networkidle2',timeout:90000});
await p.waitForFunction(()=> (document.body.innerText||'').indexOf('아이디')>=0,{timeout:30000});
await p.evaluate(()=>{const S=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};S(document.querySelector('input[name="hifin-login-id"]'),'하이');S(document.querySelector('input[name="hifin-login-pw"]'),'하이1');[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='로그인').click();});
await sleep(4200);
const hook = await p.evaluate(()=> typeof window.__hifinNavTest);
console.log('hook:', hook);
const t0 = Date.now();
const res = await p.evaluate(()=>{
  const traps = window.__hifinNavTraps();
  const out = { total: traps.length, fail: [], byKind: {} , ambig: window.__hifinNavAmbig().length };
  for (const t of traps) {
    out.byKind[t.kind] = (out.byKind[t.kind]||0)+1;
    const r = window.__hifinNavTest(t.q);
    let ok;
    if (t.expect === "CLARIFY") ok = !!(r && r.clarify);
    else if (t.expect === null) ok = (r === null);
    else ok = !!(r && !r.clarify && r.nav === t.expect);
    // 되묻기 상태 오염 방지 — clarify 후 다음 판정 초기화용 무해 질의
    if (r && r.clarify) window.__hifinNavTest("ㅡ");
    if (!ok && out.fail.length < 25) out.fail.push({ q: t.q, kind: t.kind, expect: t.expect, got: r && (r.clarify ? "CLARIFY" : r.nav), note: t.note||"" });
    if (!ok) out.failN = (out.failN||0)+1;
  }
  return out;
});
console.log(`traps: ${res.total} | kinds:`, JSON.stringify(res.byKind), `| ambig pairs: ${res.ambig}`);
console.log(`실패: ${res.failN||0} | 소요 ${(Date.now()-t0)/1000}s`);
if (res.fail.length) res.fail.forEach(f=>console.log('  ✘', f.kind, JSON.stringify(f.q), '기대', f.expect, '실제', f.got, f.note));
else console.log('=== 함정 세트 100% 통과 ===');
// 스모크: 대표 시나리오
for (const [q, want] of [["내 건강지갑 확인해줘","mywallet|wallet"],["원격진료 어디서 해?","tele"],["보험료 납부 화면 열어줘","insurance"],["요율 재산정 보여줘","insurance"],["기업검진 화면 열어줘","checkup"],["건강검진 결과 알려줘","null"],["적립 현황 보여줘","wallet"]]) {
  const r = await p.evaluate((x)=>window.__hifinNavTest(x), q);
  const got = r ? (r.clarify?"CLARIFY":`${r.nav}${r.tab?">"+r.tab:""}`) : "null";
  const ok = want==="null" ? got==="null" : want.split("|").some(w=>got.startsWith(w));
  console.log(`${ok?'✔':'✘'} ${q} → ${got}`);
}
console.log('errors:', errs.length, errs.slice(0,2));
await b.close();
