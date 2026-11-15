/* ══════════════ 디자인 토큰 가드 — 모양이 다시 표류하지 않게 (조성래님 지시 2026-11-15) ══════════════

   「디자인에서 AI티가 덜 나게 하고 싶어. 쓸데없는 테두리나 그림자나 그라데이션을 삭제해줘.
    그리고 모서리 라운드 값을 일관성있게 관리하고, 시인성이 좋게 개선해줘.」

   한 번 고치는 것으로는 **관리**가 아니다. 2026-11-15 이전에 모서리 값이 21종까지 불어난 것은
   누가 잘못해서가 아니라 **막는 것이 없었기 때문**이다. 토큰을 세워 둬도 다음 사람이
   `border-radius:11px` 를 적으면 아무도 모른다. 그래서 여기서 센다.

   ⚠️ 이 검사기는 **세는 것부터 센다.** 훑을 거리가 0이면 통과가 아니라 실패다 —
      파일을 못 읽었는데 「위반 0건」이라 적는 것이 가장 나쁜 거짓말이다.                          */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(join(ROOT, f), 'utf8');

/* 눈금 — :root 에 선 것과 같아야 한다. 여기만 고치면 되게 한 곳에 둔다 */
const RADIUS = ['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-xl', '--r-pill', '--r-circle'];
const SHADOW = ['--shadow-pop', '--shadow-pop-dark', '--shadow-pop-up'];
/* 그라데이션은 히어로 배너에만. 그 밖은 단색이다 */
const HERO = /hero|\.wbal(?![-\w])|\.ontocta(?![-\w])/;
const FONT_MIN = 10;

/* ── 남겨 둔 자리와 그 까닭 ───────────────────────────────────────────────
   예외를 코드에 적어 두지 않으면 다음 사람이 「가드가 또 운다」며 가드를 끈다.
   그래서 여기에 **왜 남겼는지**를 같이 적는다. 까닭을 못 적겠으면 예외가 아니다. */
const GRAD_OK = {
  '.side': '왼쪽 내비 기둥 — 면이 길어 단색이면 아래가 떠 보인다',
  '.agent .bot': '에이전트 카드 바닥 — 글자가 아니라 면의 끝을 알린다',
  '.corp-C': '조직도 가운데 기둥 — 위아래 경계를 선 없이 가른다',
  '.mktfilm-msg': '영상 자막 띠 — 영상 위라 단색이면 글자가 묻힌다',
};
const SHADOW_OK = {
  '.tgl span': '토글 손잡이 — 트랙 안에서 움직이는 물체라 그림자가 위치를 말한다',
  '.fmsw i': '토글 손잡이 — 같은 까닭',
};
/* JSX 쪽 토글 손잡이(파일:줄 로 못 박는다 — 줄이 바뀌면 다시 보게 한다) */
const JSX_SHADOW_OK = { 'src/components/MyPage.jsx': '토글 손잡이' };

const bad = [];
const seen = { css: 0, jsx: 0, radius: 0, shadow: 0, grad: 0, font: 0 };
const add = (f, line, what, txt) => bad.push({ f, line, what, txt: txt.slice(0, 110) });

/* ── ① :root 에 토큰이 실제로 서 있는가 ───────────────────────────────── */
const css = rd('data/app.css');
seen.css = css.length;
const root = css.slice(0, css.indexOf('}') + 1);
for (const t of [...RADIUS, ...SHADOW, '--border-strong', '--border-dark']) {
  if (root.indexOf(t + ':') < 0) add('data/app.css', 1, '토큰 없음', t + ' 가 :root 에 없습니다');
}

/* ── ② CSS 를 규칙 단위로 훑는다 ──────────────────────────────────────── */
const lineOf = (s, i) => s.slice(0, i).split('\n').length;
const BLK = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = BLK.exec(css)) !== null) {
  const sel = m[1].trim().replace(/\n/g, ' ');
  const body = m[2];
  const ln = lineOf(css, m.index);
  const inKeyframe = /^[\d.]+%|^(from|to)$/.test(sel.split(',')[0].trim());

  /* 모서리 — 날값 금지. 네 모서리를 따로 준 선언과 0 은 뜻이 있어 허용한다 */
  for (const r of body.matchAll(/(?<![-\w])border-radius:\s*([^;}]+)/g)) {
    seen.radius++;
    const v = r[1].trim();
    if (v.startsWith('var(--r-')) continue;
    if (v === '0' || v.includes(' ')) continue;          /* 막대 머리·말풍선 꼬리 */
    add('data/app.css', ln, '모서리 날값', sel + ' { border-radius:' + v + ' }');
  }

  /* 그림자 — 토큰 · 링(0 0 0) · none · 키프레임만 */
  for (const r of body.matchAll(/(?<![-\w])box-shadow:\s*([^;}]+)/g)) {
    seen.shadow++;
    const v = r[1].trim();
    if (inKeyframe || v === 'none') continue;
    if (SHADOW.some((t) => v.includes('var(' + t + ')'))) continue;
    if (/^0\s+0\s+0(\s|$)/.test(v)) continue;            /* 상태 링 · 포커스 링 */
    if (SHADOW_OK[sel]) continue;                        /* 까닭을 적어 남긴 자리 */
    add('data/app.css', ln, '그림자 날값', sel + ' { box-shadow:' + v + ' }');
  }

  /* 그라데이션 — 히어로 배너에만 */
  if (body.includes('gradient(')) {
    seen.grad++;
    /* 투명이 섞인 것은 장식이 아니라 **구조**다 — 격자무늬 · 페이드 · 구분선 */
    /* 끝이 투명해지는 것은 장식이 아니라 구조다 — transparent 든, 알파가 1 미만인 rgba 든 같다 */
    const fade = /gradient\([^)]*(transparent|rgba\([^)]*,\s*0?\.[0-9])/.test(body);
    if (!HERO.test(sel) && !fade && !GRAD_OK[sel]) {
      add('data/app.css', ln, '그라데이션', sel + ' — 히어로가 아닙니다');
    }
  }

  /* 읽히지 않는 글자색 — --soft 는 흰 바탕에서 2.56:1 이다 */
  if (/(?<![-\w])color:\s*(var\(--soft\)|#94A3B8)/i.test(body)) {
    add('data/app.css', ln, '대비 미달', sel + ' — --soft 를 글자색으로 쓸 수 없습니다(2.56:1)');
  }
}

/* 글자 크기 하한 */
for (const r of css.matchAll(/font-size:\s*([0-9.]+)px/g)) {
  seen.font++;
  if (parseFloat(r[1]) < FONT_MIN) add('data/app.css', lineOf(css, r.index), '글자 너무 작음', r[0]);
}

/* ── ③ JSX 인라인도 같은 눈금을 진다 ──────────────────────────────────── */
const walk = (d, out = []) => {
  for (const n of readdirSync(join(ROOT, d))) {
    const rel = d + '/' + n;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(jsx|js)$/.test(n)) out.push(rel);
  }
  return out;
};
for (const f of walk('src')) {
  const t = rd(f);
  seen.jsx++;
  t.split('\n').forEach((ln, i) => {
    for (const r of ln.matchAll(/borderRadius: *([0-9]+)(?![\w.])/g)) {
      add(f, i + 1, '모서리 날값', r[0]);
    }
    for (const r of ln.matchAll(/boxShadow: *"([^"]*)"/g)) {
      const v = r[1];
      if (SHADOW.some((x) => v.includes('var(' + x + ')'))) continue;
      if (/^0 0 0(\s|$)/.test(v)) continue;
      if (JSX_SHADOW_OK[f]) continue;                    /* 까닭을 적어 남긴 자리 */
      add(f, i + 1, '그림자 날값', r[0]);
    }
    for (const r of ln.matchAll(/fontSize: *([0-9.]+)(?![\w.])/g)) {
      if (parseFloat(r[1]) < FONT_MIN) add(f, i + 1, '글자 너무 작음', r[0]);
    }
    if (/color: *"#94A3B8"/.test(ln)) add(f, i + 1, '대비 미달', '--soft 색을 글자색으로');
  });
}

/* ── ④ 분모가 0이면 통과가 아니라 실패다 ─────────────────────────────── */
const floor = [
  ['CSS 바이트', seen.css, 100000],
  ['JSX 파일', seen.jsx, 30],
  ['모서리 선언', seen.radius, 800],
  ['그림자 선언', seen.shadow, 10],
  ['글자 크기 선언', seen.font, 500],
];
let dead = false;
for (const [n, got, min] of floor) {
  if (got < min) { console.log('[디자인] ✗ 훑은 양이 모자랍니다 — ' + n + ' ' + got + ' (최소 ' + min + ')'); dead = true; }
}
if (dead) { console.log('[디자인] 검사기가 대상을 제대로 못 읽었습니다. 통과로 치지 않습니다.'); process.exit(1); }

/* ── ⑤ 보고 ───────────────────────────────────────────────────────────── */
const by = {};
for (const b of bad) by[b.what] = (by[b.what] || 0) + 1;
if (bad.length) {
  console.log('[디자인] ✗ 위반 ' + bad.length + '건');
  for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log('   · ' + k + ' ' + v + '건');
  for (const b of bad.slice(0, 25)) console.log('     ' + b.f + ':' + b.line + '  [' + b.what + ']  ' + b.txt);
  if (bad.length > 25) console.log('     … 그 밖 ' + (bad.length - 25) + '건');
  console.log('   모서리는 ' + RADIUS.join(' · ') + ' 중에서 고르십시오.');
  console.log('   그림자는 실제로 떠 있는 것에만 ' + SHADOW.join(' · ') + ' 로.');
  process.exit(1);
}
console.log('[디자인] 통과 — 모서리 ' + seen.radius + ' · 그림자 ' + seen.shadow
  + ' · 그라데이션 ' + seen.grad + '(히어로만) · 글자 ' + seen.font + '건 전수 눈금 일치');
