/* 설명서 갱신 재촬영 — 01(동의 개편 예약)·08(6칸 헤더)·09(터치 플랜+배지 카드) (임시 — 실행 후 삭제) */
import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = 'docs/hi_hyundai_guide/shots';

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1440, height: 980 } });
try {
  const p = await b.newPage();
  await p.goto('http://localhost:5601/preview.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(() => {
    const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    S(document.querySelector('input[name="hifin-login-id"]'), '하이');
    S(document.querySelector('input[name="hifin-login-pw"]'), '하이1');
    [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '로그인').click();
  });
  await sleep(4500);
  const hide = () => p.evaluate(() => { for (const el of document.querySelectorAll('div')) { const st = getComputedStyle(el); if (st.position === 'fixed' && (el.innerText || '').indexOf('AI 매니저 · 항상 함께해요') >= 0 && el.offsetWidth < 620) el.style.display = 'none'; } });
  await hide();
  /* 01 — 검진 예약(동의 UX 개편: 전체 토글+펼침 보이게) */
  await p.evaluate(() => { const c = [...document.querySelectorAll('button,a,div,span')].filter(x => (x.innerText || '').trim() === '건강검진 예약'); if (c.length) c[0].click(); });
  await sleep(2500); await hide();
  await p.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(x => (x.innerText || '').trim() === '예약'); if (btn) btn.click(); });
  await sleep(1800); await hide();
  await p.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(x => (x.innerText || '').indexOf('모든 항목 한 번에 동의') >= 0); if (btn) { btn.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } });
  await sleep(400);
  await p.screenshot({ path: OUT + '/01_checkup_booking_free3.png' });
  console.log('📸 01');
  await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b2 => b2.innerText.trim() === '✕'); if (x) x.click(); });
  await sleep(500);
  /* 프로 콘솔(T5 카드 보유 프로) */
  await p.evaluate(() => {
    const today = new Date().toISOString().slice(0, 10);
    const l = window.__hifinPros('all');
    const pros = (l && l.pros ? l.pros : l || []).filter(x => x.status === '활성').slice(0, 200);
    for (const pr of pros) {
      try {
        const r = window.__hifinRosterFull(pr.code, today);
        if (!r || !r.cards) continue;
        if (r.cards.some(card => { const i = card.member && card.member.cohortIndex; const cy = i != null ? window.__hifinCycle(i) : null; return cy && ["T4", "T5"].indexOf(cy.t) >= 0; })) { sessionStorage.setItem('hifin_hm_code', pr.code); return; }
      } catch (e) {}
    }
  });
  await p.evaluate(() => { const c = [...document.querySelectorAll('button,a,div,span')].filter(x => (x.innerText || '').trim() === '헬스메이트 센터'); if (c.length) c[0].click(); });
  await sleep(3200); await hide();
  /* 08 — 콘솔 헤더(6칸: 만기 임박 포함) */
  await p.evaluate(() => window.scrollTo(0, 0)); await sleep(400); await hide();
  await p.screenshot({ path: OUT + '/08_console_header.png' });
  console.log('📸 08');
  /* 09 — 오늘의 카드(터치 플랜 펼침 + 사이클 배지 카드 보이게) */
  await p.evaluate(() => { const sum = [...document.querySelectorAll('summary')].find(x => (x.innerText || '').indexOf('60일 터치 플랜') >= 0); if (sum) { sum.click(); sum.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); } });
  await sleep(500); await hide();
  await p.screenshot({ path: OUT + '/09_today_cards.png' });
  console.log('📸 09');
} finally { await b.close(); }
