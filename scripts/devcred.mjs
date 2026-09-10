/* ══════════ 하네스 공용 개발 로그인 — 계정의 단일 소스 ══════════
   계정을 하네스마다 하드코딩해 두면, 계정을 바꾸는 순간 검사가 전부 멈춘다.
   2026-09-10에 실제로 그랬다 — demoAuth.js 한 줄을 고치자 하네스 11개가
   로그인 게이트를 못 넘어 커밋이 막혔고, 원인을 찾는 데 시간이 걸렸다.
   그래서 원본(src/utils/demoAuth.js AUTH_ADMIN)을 읽어 내보낸다.
   **계정을 바꿀 때 고칠 곳은 demoAuth.js 한 곳뿐이다.**

   로그인 절차(이동·입력·클릭·대기)도 10개 파일에 같은 코드가 복제돼 있었다.
   devLogin() 하나로 합쳤다 — 로그인 화면이 바뀌면 여기만 고치면 된다. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src/utils/demoAuth.js");

/* 원본에서 직접 읽는다 — 값을 여기에 적어 두면 단일 소스가 아니라 사본이 하나 더 느는 것이다 */
const _m = readFileSync(SRC, "utf8").match(/AUTH_ADMIN\s*=\s*\{\s*id:\s*"([^"]*)"\s*,\s*pw:\s*"([^"]*)"\s*\}/);
if (!_m) throw new Error("[devcred] src/utils/demoAuth.js 에서 AUTH_ADMIN 을 읽지 못했다 — 상수 형식이 바뀌었는지 확인할 것");

export const ID = _m[1];
export const PW = _m[2];
export const PREVIEW_URL = 'http://localhost:5601/preview.html';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 로그인 게이트 통과까지 한 묶음 — 이동·입력·클릭·정착 대기.
   id/pw를 생략하면 관리자 계정(demoAuth.js AUTH_ADMIN)으로 들어간다.
   코호트 회원으로 들어갈 때는 id/pw를 넘긴다. settleMs는 번들 부팅 대기(기본 4200ms). */
export async function devLogin(p, id, pw, settleMs) {
  await p.goto(PREVIEW_URL, { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction(() => (document.body.innerText || '').indexOf('아이디') >= 0, { timeout: 30000 });
  await p.evaluate(([i, w]) => {
    const S = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    S(document.querySelector('input[name="hifin-login-id"]'), i);
    S(document.querySelector('input[name="hifin-login-pw"]'), w);
    [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === '로그인').click();
  }, [id || ID, pw || PW]);
  await sleep(settleMs || 4200);
}
