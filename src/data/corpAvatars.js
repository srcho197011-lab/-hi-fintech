/* ══════════════ AI 팀장 아바타 — 문양 단일 원천(corpAvatars.js) · CorpOps Phase 2 (조성래님 지시 2026-11-11) ══════════════
   AI 팀장 8명에게 각자의 모습을 준다. 사람 사진이 아니라 **점과 선으로 짜인 기하 문양**이다 —
   총괄 대시보드 중앙의 조직 온톨로지(구·점)와 같은 시각 언어라 한 화면에서 따로 놀지 않는다.
   ⚠️ 원칙:
     · 사람과 AI를 같은 모양으로 쓰지 않는다 — 아바타 옆에는 항상 AI 배지가 붙고,
       사람 책임자는 이름·직위를 글자로 적는다(CorpAvatar.jsx가 강제).
     · 좌표는 **고정값**이다. 이 파일에 Math.random을 두지 않는다(결정론 규약).
     · 사내 전용 — 회원 화면에는 노출하지 않는다.
   좌표계: 96×96 · 중심 (48,48) · 테두리 원 r=45 */

/* 요소 명세 — k: line|circle|path|poly|rect, w: 선 굵기, f: 채움, o: 불투명도, d: 점선 */
const CORP_AVATARS = {
  "나침반": { c: "#FF8A65", why: "8방향 방사 바늘 + 중심점 — 방향을 가리킨다", s: [
    { k: "line", x1: 48, y1: 48, x2: 65, y2: 31, w: 1, o: .45 },
    { k: "line", x1: 48, y1: 48, x2: 65, y2: 65, w: 1, o: .45 },
    { k: "line", x1: 48, y1: 48, x2: 31, y2: 65, w: 1, o: .45 },
    { k: "line", x1: 48, y1: 48, x2: 31, y2: 31, w: 1, o: .45 },
    { k: "circle", cx: 65, cy: 31, r: 1.8, f: 1, o: .45 }, { k: "circle", cx: 65, cy: 65, r: 1.8, f: 1, o: .45 },
    { k: "circle", cx: 31, cy: 65, r: 1.8, f: 1, o: .45 }, { k: "circle", cx: 31, cy: 31, r: 1.8, f: 1, o: .45 },
    { k: "line", x1: 48, y1: 48, x2: 48, y2: 19, w: 2 }, { k: "line", x1: 48, y1: 48, x2: 77, y2: 48, w: 2 },
    { k: "line", x1: 48, y1: 48, x2: 48, y2: 77, w: 2 }, { k: "line", x1: 48, y1: 48, x2: 19, y2: 48, w: 2 },
    { k: "circle", cx: 48, cy: 19, r: 3, f: 1 }, { k: "circle", cx: 77, cy: 48, r: 2.4, f: 1 },
    { k: "circle", cx: 48, cy: 77, r: 2.4, f: 1 }, { k: "circle", cx: 19, cy: 48, r: 2.4, f: 1 },
    { k: "circle", cx: 48, cy: 48, r: 4.6, f: 1 }, { k: "circle", cx: 48, cy: 48, r: 9, w: 1, o: .5 } ] },

  "핀테크": { c: "#E8795A", why: "저울 축 + 좌우 점열 — 차변·대변의 균형", s: [
    { k: "line", x1: 48, y1: 24, x2: 48, y2: 72, w: 2 },
    { k: "line", x1: 22, y1: 34, x2: 74, y2: 34, w: 2 },
    { k: "line", x1: 22, y1: 34, x2: 22, y2: 44, w: 1.4 }, { k: "line", x1: 74, y1: 34, x2: 74, y2: 44, w: 1.4 },
    { k: "path", d: "M 13 44 Q 22 58 31 44", w: 1.6, o: .85 },
    { k: "path", d: "M 65 44 Q 74 58 83 44", w: 1.6, o: .85 },
    { k: "circle", cx: 18, cy: 48, r: 1.9, f: 1, o: .9 }, { k: "circle", cx: 22, cy: 51, r: 1.9, f: 1, o: .9 },
    { k: "circle", cx: 26, cy: 48, r: 1.9, f: 1, o: .9 }, { k: "circle", cx: 70, cy: 48, r: 1.9, f: 1, o: .9 },
    { k: "circle", cx: 74, cy: 51, r: 1.9, f: 1, o: .9 }, { k: "circle", cx: 78, cy: 48, r: 1.9, f: 1, o: .9 },
    { k: "circle", cx: 48, cy: 30, r: 3.4, f: 1 },
    { k: "line", x1: 38, y1: 64, x2: 58, y2: 64, w: 1.4, o: .45 },
    { k: "line", x1: 40, y1: 70, x2: 56, y2: 70, w: 1.4, o: .45 } ] },

  "인총이": { c: "#D96A52", why: "3×3 격자 점 + 외곽 호 — 사람과 자산을 챙긴다", s: [
    { k: "path", d: "M 16 48 A 32 32 0 0 1 48 16", w: 2 },
    { k: "path", d: "M 80 48 A 32 32 0 0 1 48 80", w: 2 },
    { k: "line", x1: 33, y1: 33, x2: 63, y2: 33, w: 1, o: .3 }, { k: "line", x1: 33, y1: 48, x2: 63, y2: 48, w: 1, o: .3 },
    { k: "line", x1: 33, y1: 63, x2: 63, y2: 63, w: 1, o: .3 }, { k: "line", x1: 33, y1: 33, x2: 33, y2: 63, w: 1, o: .3 },
    { k: "line", x1: 48, y1: 33, x2: 48, y2: 63, w: 1, o: .3 }, { k: "line", x1: 63, y1: 33, x2: 63, y2: 63, w: 1, o: .3 },
    { k: "circle", cx: 33, cy: 33, r: 2.6, f: 1 }, { k: "circle", cx: 48, cy: 33, r: 2.6, f: 1 }, { k: "circle", cx: 63, cy: 33, r: 2.6, f: 1 },
    { k: "circle", cx: 33, cy: 48, r: 2.6, f: 1 }, { k: "circle", cx: 48, cy: 48, r: 4.2, f: 1 }, { k: "circle", cx: 63, cy: 48, r: 2.6, f: 1 },
    { k: "circle", cx: 33, cy: 63, r: 2.6, f: 1 }, { k: "circle", cx: 48, cy: 63, r: 2.6, f: 1 }, { k: "circle", cx: 63, cy: 63, r: 2.6, f: 1 } ] },

  "헬시": { c: "#FF7A6B", why: "심박 파형 + 맥점 — 회원의 건강을 살핀다", s: [
    { k: "circle", cx: 48, cy: 48, r: 30, w: 1.2, o: .28 },
    { k: "path", d: "M 15 48 H 29 L 35 31 L 44 67 L 52 39 L 57 48 H 81", w: 2.4 },
    { k: "circle", cx: 44, cy: 67, r: 3, f: 1 }, { k: "circle", cx: 35, cy: 31, r: 2.6, f: 1 },
    { k: "circle", cx: 15, cy: 48, r: 1.8, f: 1, o: .5 }, { k: "circle", cx: 81, cy: 48, r: 1.8, f: 1, o: .5 } ] },

  "인슈러": { c: "#E6906A", why: "덮개 호 3겹 + 아래 점 — 덮이지 않은 곳을 찾는다", s: [
    { k: "path", d: "M 19 53 A 29 29 0 0 1 77 53", w: 2.2 },
    { k: "path", d: "M 27 55 A 21 21 0 0 1 69 55", w: 1.6, o: .58 },
    { k: "path", d: "M 35 57 A 13 13 0 0 1 61 57", w: 1.2, o: .32 },
    { k: "circle", cx: 48, cy: 23, r: 2.6, f: 1 },
    { k: "circle", cx: 19, cy: 53, r: 1.8, f: 1, o: .45 }, { k: "circle", cx: 77, cy: 53, r: 1.8, f: 1, o: .45 },
    { k: "circle", cx: 36, cy: 70, r: 3.1, f: 1 }, { k: "circle", cx: 48, cy: 70, r: 3.1, f: 1 },
    /* 오른쪽 하나만 비어 있다 — 덮이지 않은 곳(보장 갭) */
    { k: "circle", cx: 60, cy: 70, r: 3.1, w: 1.4, o: .42, d: "2.2 2.2" } ] },

  "애디": { c: "#FF9E7A", why: "동심원 파동 3겹 + 발신점 — 퍼지고 돌아온다", s: [
    { k: "circle", cx: 48, cy: 48, r: 32, w: 1.4, o: .2 },
    { k: "circle", cx: 48, cy: 48, r: 24, w: 1.6, o: .4 },
    { k: "circle", cx: 48, cy: 48, r: 16, w: 1.8, o: .7 },
    { k: "circle", cx: 48, cy: 48, r: 5.2, f: 1 },
    { k: "circle", cx: 48, cy: 16, r: 2.4, f: 1, o: .85 }, { k: "circle", cx: 80, cy: 48, r: 2.4, f: 1, o: .85 },
    { k: "circle", cx: 48, cy: 80, r: 2.4, f: 1, o: .85 }, { k: "circle", cx: 16, cy: 48, r: 2.4, f: 1, o: .85 },
    { k: "circle", cx: 71, cy: 25, r: 1.6, f: 1, o: .45 }, { k: "circle", cx: 71, cy: 71, r: 1.6, f: 1, o: .45 },
    { k: "circle", cx: 25, cy: 71, r: 1.6, f: 1, o: .45 }, { k: "circle", cx: 25, cy: 25, r: 1.6, f: 1, o: .45 } ] },

  "온톨로": { c: "#F2815F", why: "노드-엣지 그물 5점 — 데이터 지도를 그린다", s: [
    { k: "line", x1: 48, y1: 21, x2: 23, y2: 41, w: 1.5, o: .6 }, { k: "line", x1: 48, y1: 21, x2: 73, y2: 41, w: 1.5, o: .6 },
    { k: "line", x1: 23, y1: 41, x2: 33, y2: 71, w: 1.5, o: .6 }, { k: "line", x1: 73, y1: 41, x2: 63, y2: 71, w: 1.5, o: .6 },
    { k: "line", x1: 33, y1: 71, x2: 63, y2: 71, w: 1.5, o: .6 }, { k: "line", x1: 23, y1: 41, x2: 73, y2: 41, w: 1.5, o: .6 },
    { k: "line", x1: 48, y1: 21, x2: 48, y2: 48, w: 1.5, o: .6 }, { k: "line", x1: 23, y1: 41, x2: 63, y2: 71, w: 1.5, o: .6 },
    { k: "line", x1: 73, y1: 41, x2: 33, y2: 71, w: 1.5, o: .6 },
    { k: "circle", cx: 48, cy: 21, r: 3.8, f: 1 }, { k: "circle", cx: 23, cy: 41, r: 3.2, f: 1 },
    { k: "circle", cx: 73, cy: 41, r: 3.2, f: 1 }, { k: "circle", cx: 33, cy: 71, r: 3.2, f: 1 },
    { k: "circle", cx: 63, cy: 71, r: 3.2, f: 1 }, { k: "circle", cx: 48, cy: 48, r: 2.4, f: 1, o: .7 } ] },

  "하네스": { c: "#C75B45", why: "육각 방패 2겹 + 잠금점 — 막고 검증한다", s: [
    { k: "poly", p: "48,17 74,32 74,62 48,79 22,62 22,32", w: 2 },
    { k: "poly", p: "48,31 62,39 62,57 48,66 34,57 34,39", w: 1.4, o: .55 },
    { k: "circle", cx: 48, cy: 17, r: 2.6, f: 1, o: .9 }, { k: "circle", cx: 74, cy: 32, r: 2.2, f: 1, o: .9 },
    { k: "circle", cx: 74, cy: 62, r: 2.2, f: 1, o: .9 }, { k: "circle", cx: 48, cy: 79, r: 2.6, f: 1, o: .9 },
    { k: "circle", cx: 22, cy: 62, r: 2.2, f: 1, o: .9 }, { k: "circle", cx: 22, cy: 32, r: 2.2, f: 1, o: .9 },
    { k: "rect", x: 43, y: 46, w2: 10, h: 9, rx: 1.6, w: 1.8 },
    { k: "path", d: "M 45 46 V 43 a 3 3 0 0 1 6 0 v 3", w: 1.6 },
    { k: "circle", cx: 48, cy: 50.5, r: 1.5, f: 1 } ] },
};

/* 상태 — 테두리로만 말한다. 「사람 승인 대기」만 유독 밝은 이유는 사람이 움직여야 하는 유일한 상태라서다. */
const CORP_AV_STATE = {
  idle: { label: "대기", ring: "#2E2E37", w: 1.5, dash: "", pulse: false },
  work: { label: "작업 중", ring: "", w: 2, dash: "", pulse: true },          /* ring 빈값 = 팀 색 */
  wait: { label: "사람 승인 대기", ring: "#FFB38A", w: 4, dash: "", pulse: false },
  stop: { label: "중단", ring: "#8A8A93", w: 1.5, dash: "4 5", pulse: false },
};

function corpAvatar(ai) { return CORP_AVATARS[ai] || null; }
const CORP_AVATAR_COUNT = Object.keys(CORP_AVATARS).length;
