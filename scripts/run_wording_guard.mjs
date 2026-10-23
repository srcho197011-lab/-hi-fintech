/* ══════════ 화면 표기 규약 가드 — 「합성」 0건 · 가명 표기 고지 (대표 지시 2026-10-23) ══════════
   왜 있는가: 「합성 코호트」·「시연용 합성 데이터」라는 표기가 **데이터의 신뢰도를 떨어뜨리는 오해**를
   불러서 화면 문자열에서 전부 뺐다(대표 지시). 대신 데이터셋은 「파일럿 코호트」로 부르고, 신원은
   「이름·식별자는 가명으로 표시되며 특정 개인을 알아볼 수 없습니다」 한 뜻으로 적는다.
   규약 본문은 src/data/insuranceCohort.js 머리 주석(단일 원천)에 있다.

   검사 ① 화면 문자열 — 주석을 걷어낸 뒤 렌더되는 문자열·내보내기 머리말에 「합성」 0건
          (정합성·적합성·합성어·합성동 같은 **다른 뜻의 낱말은 건드리지 않는다** — 복합어 허용)
        ② 면제의 전제 — 유일한 예외인 selfReal.js 원천 스냅샷(= mcp_josungrae.json 전문·드리프트 금지)의
          그 문장이 **화면에 그대로 찍히지 않는가**(meta.disclaimer 직접 렌더 0건)
        ③ 고지가 서 있는가 — 「합성」만 빼고 고지를 날려 버리면 더 나쁘다. 화면별 필수 문구를 요구한다
        ④ 법적 오표기 금지 — 「가명정보」·「가명처리된 개인정보」로 덩어리째 부르지 않는다
          (개인정보보호법상 가명정보는 실제 개인정보를 가공한 것을 뜻한다 — 이 코호트는 그것이 아니다)
        ⑤ 다른 뜻 보존 — 정합성·적합성·합성어 건수가 규약 교체로 줄지 않았는가(오치환 적발)
          ⚠️ ③과 **같은 기준**으로 센다 — screenOnly(주석 제거) · **파일별 바닥** · 복합어 총계 바닥.
             처음엔 전문(주석 포함) 전역 합계로 셌는데, 화면 라벨 「데이터 정합성 검증」을 잘못 치환하고
             같은 파일 주석에 「정합성」 한 건을 끼워 넣자 바닥이 메워져 **PASS**가 났다(2026-10-23 실측).
             주석이 화면의 바닥을 메우면 오치환 적발기가 아니라 오치환 은폐기가 된다.
        ⑥ 같은 어감 — 화면 문자열에 「가상 데이터·가상 인물·가상 회원」 0건
          (가상자산·가상계좌·감가상각은 전혀 다른 뜻이라 세지 않는다 — 뒤 낱말을 묶어 한정한다)
        ⑦ 생성기 왕복 — src/data/wpAutoLog.js(백서 ›반영 로그 화면)는 커밋 메시지에서 **재생성되는 파일**이다.
          `gen_wp_log.py --stdout`(파일 미기록)과 디스크 전문을 바이트 대조해 「재생성해도 ①이 0건」을 단언한다.
          손수정은 post-commit 훅이 커밋 직후 되돌려 amend까지 한다 — 규약은 생성기에서 적용해야 산다.

        ⑧ 배포 산출물 — 추적·배포되는 index.html(번들)의 화면 문자열에도 금칙 0건
          (src 가 깨끗해도 번들이 낡으면 옛 문구가 배포된다 — 「src 스캔 = 번들 스캔」 전제를 실제로 확인한다)

   실행: node scripts/run_wording_guard.mjs      (브라우저 불필요 — 정적 스캔, 2초 미만 · ⑧은 빌드된 번들을 읽는다)
         HIFIN_WORDING_PROBE=1 …                  (⑤ 바닥 재기준용 — 파일별 실측치를 찍는다)
   게이트: scripts/githooks/pre-commit 의 `^src/` 블록에 편입(사람이 칠 때만 도는 가드는 안 도는 가드다)
   산출: scripts/wording_guard_snapshot.json
   ⚠️ 빌드는 src/를 _manifest.txt 순서로 이어 붙일 뿐이므로 **src 스캔 = 번들 스캔**이다.
      데이터 JSON(hira·kdca·disease_care)의 「합성」은 콜라겐 합성·단백질 합성·창원 합성동으로
      전부 다른 뜻이라 대상이 아니다. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const t0 = Date.now();
const fails = [];
const rd = (f) => readFileSync(join(ROOT, f), "utf8");
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, "/");

/* ── 스캔 대상 — 화면이 사는 곳(JSX 텍스트·문자열 사전·내보내기 머리말) ── */
const FILES = [];
(function walk(d) {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e)) FILES.push(p);
  }
})(join(ROOT, "src"));

/* ── 주석 판별 ─────────────────────────────────────────────────────────────
   문자열 상태는 **따라가지 않는다**. JSX 텍스트의 홑따옴표(「'」) 하나가 렉서를 어긋나게 해
   주석 전체를 화면으로 오판하기 때문이다. 주석만 보면 되고, 그때 걸리는 함정은 둘뿐이다 —
     ⓐ 문자열 안의 「//」(http:// 같은 URL) → 앞 글자가 「:」면 주석으로 보지 않는다
     ⓑ 정규식 안의 「/*」 → src에는 없다(아래 ③에서 실제로 확인한다) */
function commentMask(src) {
  const m = new Uint8Array(src.length);
  let i = 0, mode = 0;                         /* 0=코드 1=블록 2=줄 */
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (mode === 0) {
      if (c === "/" && d === "*") { mode = 1; m[i] = m[i + 1] = 1; i += 2; continue; }
      if (c === "/" && d === "/" && src[i - 1] !== ":" && src[i - 1] !== "/") { mode = 2; m[i] = m[i + 1] = 1; i += 2; continue; }
      i++; continue;
    }
    if (mode === 1) { m[i] = 1; if (c === "*" && d === "/") { m[i + 1] = 1; i += 2; mode = 0; continue; } i++; continue; }
    m[i] = 1; if (c === "\n") { mode = 0; }                     /* 줄 주석 */
    i++;
  }
  return m;
}

/* 주석을 공백으로 지운 「화면만 남은」 사본 — ③·⑤·⑥이 같은 기준으로 세기 위한 단일 도구 */
const screenOnly = (s) => { const m = commentMask(s); let o = ""; for (let i = 0; i < s.length; i++) o += m[i] ? (s[i] === "\n" ? "\n" : " ") : s[i]; return o; };

/* ── 복합어(다른 뜻) 허용 — 정합성·적합성·부합성·종합성·합성어·합성동 ──
   ⚠️ 여기에 낱말을 더할 때는 **데이터를 가리키는 말이 아닌지** 먼저 보라. */
const COMPOUND_PREV = "정적부종";
const COMPOUND_NEXT = "어동";

/* ── 면제 — 사유와 함께만 둔다(무사유 면제 금지) ── */
const EXEMPT = [
  { file: "src/data/selfReal.js", phrase: "합성 데이터입니다.",
    why: "본인 실측 원천 스냅샷(mcp_josungrae.json 전문) — 드리프트 금지라 손대지 않는다. 화면에는 찍지 않는다(검사 ②)" },
  /* 종전에 있던 wpAutoLog.js의 「합성 중 새 문장」(협주 조립) 면제는 **없앴다** — 면제보다 치환이 강하다.
     생성기 치환표(scripts/wp_wording_table.json)가 「합성 중」→「조립 중」으로 바꾼다(저장소가 쓰는 말). */
];

/* ── ① 화면 문자열 스캔 ── */
let screenHits = 0, commentHits = 0, compoundHits = 0, exemptHits = 0;
for (const p of FILES) {
  const s = rd(rel(p)), m = commentMask(s);
  let i = -1;
  while ((i = s.indexOf("합성", i + 1)) >= 0) {
    if (m[i]) { commentHits++; continue; }
    const prev = s[i - 1] || "", next = s[i + 2] || "";
    if (COMPOUND_PREV.indexOf(prev) >= 0 || COMPOUND_NEXT.indexOf(next) >= 0) { compoundHits++; continue; }
    const ex = EXEMPT.find((e) => e.file === rel(p) && s.startsWith(e.phrase, i));
    if (ex) { exemptHits++; continue; }
    screenHits++;
    fails.push({ chk: "①화면문자열", file: rel(p), line: s.slice(0, i).split("\n").length,
      why: "화면 문자열에 「합성」 — 데이터셋은 「파일럿 코호트」, 신원은 「가명으로 표시」로 적는다",
      ctx: s.slice(Math.max(0, i - 36), i + 36).replace(/\s+/g, " ") });
  }
}

/* ── ②-ⓑ 전제 확인 — 문자열·정규식 안에 「/*」가 없는가(있으면 주석 판별이 어긋난다) ── */
const CSTART = ['"/*', "'/*", "`/*", "\\/\\*", "[/]\\*"];
for (const p of FILES) {
  const s = rd(rel(p));
  for (const lit of CSTART) if (s.indexOf(lit) >= 0)
    fails.push({ chk: "②전제", file: rel(p), why: `문자열·정규식 안의 「${lit}」 — 주석 판별이 어긋날 수 있다(가드의 commentMask를 고쳐라)` });
}

/* ── ② 면제의 전제 — 원천 고지를 화면이 그대로 찍지 않는가 ── */
{
  const SR = rd("src/data/selfReal.js");
  if (SR.indexOf("합성 데이터입니다.") < 0)
    fails.push({ chk: "②전제", file: "src/data/selfReal.js", why: "원천 스냅샷 문장이 바뀌었다 — 면제의 전제가 깨졌다(mcp_josungrae.json과 대조: run_selfreal_check)" });
  const renders = [];
  for (const p of FILES) {
    if (rel(p) === "src/data/selfReal.js") continue;
    const s = rd(rel(p)), m = commentMask(s);
    let i = -1;
    while ((i = s.indexOf(".disclaimer", i + 1)) >= 0) if (!m[i]) renders.push(rel(p) + ":" + s.slice(0, i).split("\n").length);
  }
  if (renders.length) fails.push({ chk: "②전제", why: "원천 meta.disclaimer를 화면이 그대로 찍는다 — 고지를 화면에 직접 적어라", ctx: renders.join(" / ") });
}

/* ── ③ 고지가 서 있는가 — 「합성」만 빼고 고지를 날리면 더 나쁘다 ──
   ⚠️ 요구 문구는 **주석을 걷어낸 뒤**에 찾는다. 규약을 적은 주석이 같은 문구를 품고 있어서,
      주석까지 세면 화면에서 고지를 지워도 통과해 버린다(실측 — 이 가드를 만들며 걸린 함정). */
/* ⚠️ 신원 고지(가명 표기)와 **성격 표기**(시연용 예시 데이터 · 시연 데이터 · 실제 개인정보가 아닙니다)를
   **둘 다** 요구한다. 신원만 요구하면 「실제 개인정보를 가명처리해 들고 있다」로 읽히는 상태가
   규약으로 굳는다 — 2026-10-23 실측으로 로그인·보장분석·위험예측·운영본부 푸터에서 걸린 자리다.
   ⚠️ 성격 표기는 **데이터셋 호칭과 같은 줄에서** 요구한다. 파일 어딘가에 그 낱말이 있기만 하면
      되게 두면, 다른 문단의 고지가 바닥을 메워 **그 문장에서 표식을 떼어도 통과한다**
      (2026-10-23 애블레이션 실측 — AuthGate에서 성격 표기만 떼었더니 96행 둘러보기 고지가 메워 PASS). */
const NOTICE = [
  ["src/components/AuthGate.jsx", [/파일럿 코호트 10만 명[^\n]*(시연용 예시 데이터|실제 개인정보가 아닙니다)/, /가명으로 표시/], "로그인 체험계정 안내(호칭+성격 동반)"],
  ["src/components/Insurance.jsx", [/파일럿 코호트 10만 명[^\n]*(시연용 예시 데이터|실제 개인정보가 아닙니다)/], "치료비 케어 보장분석 또래 평균(호칭+성격 동반)"],
  ["src/components/ConsultIntel.jsx", [/상담 내용은 <b>시연용 데이터<\/b>[^\n]{0,200}가명으로 표시/], "상담 인텔리전스 고지(성격+신원 동반)"],
  ["src/components/HealthMate.jsx", [/이 콘솔에 표시되는 회원 이름·식별자는 <b>가명으로 표시<\/b>/, /마스킹 규칙/, /체험 회원 16명·코호트 10만 명은 시연 시드/], "프로 콘솔 푸터·법령 띠"],
  ["src/components/HmOpsCenter.jsx", [/\[시연 데이터 · 가명 표기\]/, /가명으로 표시되며 특정 개인을 알아볼 수 없습니다/, /가명으로 표시<\/b>되어 특정 개인/, /가명으로 표시<\/b>돼 특정 개인/], "운영본부 — 내보내기 머리말·게이트·hero·푸터"],
  /* hero·게이트·푸터 세 자리 모두 성격+신원을 같이 적는다(한 화면 안에서 표기 강도가 엇갈리지 않게) */
  ["src/components/HmOpsCenter.jsx", [/<b>시연 데이터<\/b>이며 <b>가명으로 표시<\/b>되어 특정 개인/, /<b>시연 데이터<\/b>이며 <b>가명으로 표시<\/b>돼 특정 개인/], "운영본부 — hero·게이트·푸터의 성격+신원 동반"],
  ["src/components/Ontology.jsx", [/파일럿 코호트 · 이름·식별자는 가명으로 표시/, /실제 개인정보가 아닙니다/], "헬스케어 온톨로지 — 데이터 보강 로드맵 칩"],
  ["src/components/Finance.jsx", [/파일럿 코호트<\/b>[^\n]{0,140}가명 표기/], "재무 원장 재생 고지(호칭+신원 동반)"],
  ["src/components/DataConnector.jsx", [/파일럿 코호트 10만 명은 시연 시드 데이터입니다[^\n]{0,80}가명으로 표시되며 특정 개인을 알아볼 수 없습니다/], "실데이터 커넥터 푸터(성격+신원 동반)"],
  ["src/components/AIDoctor.jsx", [/전국 전문의 명단은 시연용 데이터이며 이름·식별자는 가명으로 표시됩니다/], "원격진료 3화면 공용 안내문"],
  ["src/data/riskEngine.js", [/파일럿 코호트\(시연용 예시 데이터[^)]*\) 대비 통계 모델/], "위험 예측 정직성 고지"],
];
for (const [f, res, what] of NOTICE) {
  const s = screenOnly(rd(f));
  for (const re of res) if (!re.test(s)) fails.push({ chk: "③고지", file: f, why: `고지/표기가 사라졌다(${what}) — 요구: ${re}` });
}
/* 규약 자체는 주석에 산다 — 그 자리는 전문(주석 포함)에서 확인한다(다음 사람이 규약을 지우면 되돌아간다) */
for (const [f, re, what] of [["src/data/insuranceCohort.js", /화면 표기 규약/, "표기 규약 단일 원천"],
                             ["src/data/insuranceCohort.js", /「파일럿 코호트」/, "데이터셋 호칭 규약"],
                             ["src/data/pilotCohort.js", /화면 표기 규약은 insuranceCohort\.js/, "코호트 생성기 → 규약 가리킴"]]) {
  if (!re.test(rd(f))) fails.push({ chk: "③고지", file: f, why: `규약 주석이 사라졌다(${what}) — 요구: ${re}` });
}

/* ── ④ 법적 오표기 금지 — **이 코호트를** 「가명정보」라고 덩어리째 부르지 않는다 ──
   ⚠️ 낱말 자체를 금지하면 안 된다. 실서비스의 개인정보 처리 방침(동의 항목·법령 카드)은 실제 개인정보를
      다루므로 「가명처리」·「가명정보」가 정확한 말이다. 금지되는 것은 **코호트/시연 데이터를 가리켜**
      그렇게 부르는 것뿐이므로, 같은 문맥(±120자)에 코호트·파일럿·체험·시연이 함께 있을 때만 잡는다. */
const BAD_TERMS = [/가명정보/g, /가명처리된?\s*개인정보/g];
const COHORT_CTX = /코호트|파일럿|체험\s*회원|체험계정|시연/;
for (const p of FILES) {
  const s = rd(rel(p)), m = commentMask(s);
  for (const re of BAD_TERMS) {
    re.lastIndex = 0;
    let hit;
    while ((hit = re.exec(s))) {
      if (m[hit.index]) continue;
      const win = s.slice(Math.max(0, hit.index - 120), hit.index + 120);
      if (!COHORT_CTX.test(win)) continue;
      fails.push({ chk: "④오표기", file: rel(p), line: s.slice(0, hit.index).split("\n").length,
        why: "개인정보보호법상 「가명정보」는 실제 개인정보를 가공한 것을 뜻한다 — 이 코호트는 그것이 아니다. 「이름·식별자가 가명으로 표시된다」까지만 적어라",
        ctx: win.replace(/\s+/g, " ") });
    }
  }
}

/* ── ⑤ 다른 뜻 보존 — 오치환(정합성·적합성·합성어가 줄어듦) 적발 ──
   기준은 ③과 같다: **screenOnly(주석 제거) · 파일별 바닥**. 전역 합계를 전문에서 세면
   화면에서 줄어든 것을 주석이 메워 PASS가 난다(2026-10-23 애블레이션 실측 — 그 구멍을 닫는다).
   바닥을 다시 뜰 때는 `HIFIN_WORDING_PROBE=1 node scripts/run_wording_guard.mjs`. */
const WORDS = ["정합성", "적합성", "합성어"];
/* ⓐ 화면 바닥 — screenOnly 기준(주석이 메울 수 없다). 화면 라벨 오치환을 잡는다. */
const FLOOR_SCREEN = {
  "정합성": { "src/components/Ontology.jsx": 2, "src/data/whitepaper.js": 4, "src/data/wpAutoLog.js": 2 },
  "적합성": { "src/components/Insurance.jsx": 1, "src/data/kbDomainData.js": 2, "src/data/telemed.js": 1, "src/data/whitepaper.js": 4 },
  "합성어": {},
};
/* ⓑ 코드·주석 바닥 — 전문 기준. 「합성어」처럼 화면에 안 나오고 **NLU 사전·분해 규칙**에 사는 낱말은
   화면 바닥으로는 지킬 수 없다. 전문 바닥을 따로 둬 치환 사고를 여기서도 잡는다(뜻이 다른 두 축이다). */
const FLOOR_TEXT = {
  "정합성": { "src/components/AIDoctor.jsx": 1, "src/components/Ontology.jsx": 2, "src/data/pilotCohort.js": 4, "src/data/whitepaper.js": 4, "src/data/wpAutoLog.js": 2 },
  "적합성": { "src/components/Insurance.jsx": 1, "src/data/kbDomainData.js": 2, "src/data/telemed.js": 1, "src/data/whitepaper.js": 5 },
  "합성어": { "src/data/aiNative.js": 3, "src/data/hiNluCore.js": 3, "src/data/hiNluDict.js": 1 },
};
const counts = {}, perFile = {}, perFileText = {};
for (const k of WORDS) { counts[k] = 0; perFile[k] = {}; perFileText[k] = {}; }
for (const p of FILES) {
  const raw = rd(rel(p)), s = screenOnly(raw);
  for (const k of WORDS) {
    const n = s.split(k).length - 1, t = raw.split(k).length - 1;
    if (n) { counts[k] += n; perFile[k][rel(p)] = n; }
    if (t) perFileText[k][rel(p)] = t;
  }
}
if (process.env.HIFIN_WORDING_PROBE === "1")
  console.log("[probe ⑤] 화면=" + JSON.stringify(perFile) + "\n[probe ⑤] 전문=" + JSON.stringify(perFileText));
for (const [axis, FL, src, label] of [["화면", FLOOR_SCREEN, perFile, "화면 문자열(주석은 세지 않는다)"],
                                      ["전문", FLOOR_TEXT, perFileText, "파일 전문(코드·주석 포함)"]]) {
  for (const k of WORDS) for (const [f, floor] of Object.entries(FL[k])) {
    const now = src[k][f] || 0;
    if (now < floor) fails.push({ chk: "⑤다른뜻", file: f,
      why: `${label}의 「${k}」가 ${floor}건 → ${now}건으로 줄었다 — 다른 뜻의 낱말을 잘못 치환했는지 확인하라(축: ${axis})` });
  }
}
/* 복합어 총계에도 바닥을 건다 — ①이 「복합어로 보고 넘긴」 건수가 줄면 그만큼 오치환 후보다 */
const COMPOUND_FLOOR = 16;
if (compoundHits < COMPOUND_FLOOR) fails.push({ chk: "⑤다른뜻",
  why: `복합어(다른 뜻) 통과 건수가 ${COMPOUND_FLOOR} → ${compoundHits}건으로 줄었다 — 정합성·적합성·합성어류를 잘못 치환했는지 확인하라` });

/* ── ⑥ 같은 어감 — 「가상 데이터·가상 인물·가상 회원」도 화면에서 쓰지 않는다 ──
   ⚠️ 낱말 「가상」을 금지하면 안 된다. 가상자산이용자보호법·가상계좌·감가상각은 전혀 다른 뜻이고
      화면에서 정확한 말이다. 그래서 **뒤에 오는 낱말로 한정**해 데이터 성격을 가리키는 자리만 잡는다. */
const VIRTUAL = /가상\s*(데이터|인물|회원|명단)/g;
let virtualHits = 0;
for (const p of FILES) {
  const s = screenOnly(rd(rel(p)));
  VIRTUAL.lastIndex = 0;
  let hit;
  while ((hit = VIRTUAL.exec(s))) {
    virtualHits++;
    fails.push({ chk: "⑥같은어감", file: rel(p), line: s.slice(0, hit.index).split("\n").length,
      why: "화면 문자열에 「가상 데이터·인물·회원」 — 「합성」과 같은 어감이다. 성격은 「시연용 데이터」, 신원은 「가명으로 표시」로 적는다",
      ctx: s.slice(Math.max(0, hit.index - 36), hit.index + 36).replace(/\s+/g, " ") });
  }
}

/* ── ⑦ 생성기 왕복 — 백서 ›반영 로그는 커밋 메시지에서 재생성되는 화면이다 ──
   손수정은 post-commit 훅(gen_wp_log.sh → build_preview.sh → commit --amend)이 커밋 직후 되돌린다.
   그래서 「디스크의 wpAutoLog.js == 생성기가 지금 만들 내용」을 바이트로 대조한다 —
   이것과 ①(그 파일 0건)이 함께 서면 「재생성해도 0건」이 증명된다. 파일은 쓰지 않는다(--stdout). */
{
  const WP = "src/data/wpAutoLog.js";
  const py = ["python", "python3", "py"];
  let got = null, errs = [];
  for (const exe of py) {
    const r = spawnSync(exe, ["scripts/gen_wp_log.py", "--stdout"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
    if (r.error) { errs.push(`${exe}: ${r.error.code || r.error.message}`); continue; }
    if (r.status !== 0) { errs.push(`${exe}: exit ${r.status} ${(r.stderr || "").trim().slice(-200)}`); continue; }
    got = r.stdout; break;
  }
  if (got == null) {
    fails.push({ chk: "⑦생성왕복", file: WP, why: `생성기를 돌릴 수 없어 왕복을 대조하지 못했다(조용히 통과시키지 않는다) — ${errs.join(" / ")}` });
  } else if (got !== rd(WP)) {
    /* 어디가 다른지 첫 줄만 집어 준다 — 전문 diff는 사람이 `py scripts/gen_wp_log.py` 로 본다 */
    const a = got.split("\n"), b = rd(WP).split("\n");
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    fails.push({ chk: "⑦생성왕복", file: WP, line: i + 1,
      why: "디스크 내용이 생성기 출력과 다르다 — 이 파일을 손으로 고쳤거나 낡았다. `py scripts/gen_wp_log.py`로 재생성하고, 표기는 scripts/wp_wording_table.json(치환표·override)에서 고쳐라",
      ctx: `생성기: ${(a[i] || "(없음)").slice(0, 110)} / 디스크: ${(b[i] || "(없음)").slice(0, 110)}` });
  }
}

/* ── ⑧ 배포 산출물 대조 — src 스캔이 「번들 스캔과 같다」는 전제를 실제로 확인한다 ──
   index.html 은 추적 파일이고 push 하면 그대로 배포된다(Vercel). src 는 깨끗한데 번들이 낡아
   옛 문구가 배포되는 경우를 src 스캔만으로는 못 본다. 번들은 src 를 _manifest 순서로 이어 붙인 것이라
   같은 주석 판별기를 그대로 쓸 수 있다. (preview.html 은 .gitignore 대상이라 보지 않는다.) */
let bundleHits = 0;
{
  const B = "index.html";
  let s = null;
  try { s = rd(B); } catch (e) { fails.push({ chk: "⑧번들", file: B, why: "번들이 없다 — `bash build_preview.sh` 후 다시 돌려라" }); }
  if (s != null) {
    const m = commentMask(s);
    for (const [needle, tag] of [["합성", "「합성」"], ["가상 데이터", "「가상 데이터」"], ["가상 인물", "「가상 인물」"], ["가상 회원", "「가상 회원」"]]) {
      let i = -1;
      while ((i = s.indexOf(needle, i + 1)) >= 0) {
        if (m[i]) continue;
        if (needle === "합성") {
          const prev = s[i - 1] || "", next = s[i + 2] || "";
          if (COMPOUND_PREV.indexOf(prev) >= 0 || COMPOUND_NEXT.indexOf(next) >= 0) continue;
          /* 유일한 면제 — selfReal.js 원천 스냅샷 문장(검사 ②가 「화면이 찍지 않는다」를 따로 지킨다) */
          if (s.startsWith("합성 데이터입니다.", i)) continue;
        }
        bundleHits++;
        fails.push({ chk: "⑧번들", file: B, line: s.slice(0, i).split("\n").length,
          why: `배포 번들의 화면 문자열에 ${tag} — src 는 깨끗한데 번들이 낡았을 수 있다(\`bash build_preview.sh\`)`,
          ctx: s.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, " ") });
      }
    }
  }
}

/* ── 보고 ── */
console.log(`[①화면  ] ${FILES.length}파일 스캔 · 화면 「합성」 ${screenHits}건(목표 0) · 주석 ${commentHits} · 복합어 ${compoundHits} · 면제 ${exemptHits}`);
console.log(`[②전제  ] 원천 스냅샷 면제 유지 · meta.disclaimer 직접 렌더 ${fails.filter((f) => f.chk === "②전제").length}건`);
console.log(`[③고지  ] 화면 ${NOTICE.length}곳 필수 문구 · 누락 ${fails.filter((f) => f.chk === "③고지").length}건`);
console.log(`[④오표기] 「가명정보」류 ${fails.filter((f) => f.chk === "④오표기").length}건(목표 0)`);
const floorSum = (k) => Object.values(FLOOR_SCREEN[k]).reduce((a, b) => a + b, 0);
console.log(`[⑤다른뜻] 화면 기준 — 정합성 ${counts["정합성"]}(바닥합 ${floorSum("정합성")}) · 적합성 ${counts["적합성"]}(${floorSum("적합성")}) · 합성어 ${counts["합성어"]}(${floorSum("합성어")}) · 복합어 통과 ${compoundHits}(바닥 ${COMPOUND_FLOOR}) · 파일별 미달 ${fails.filter((f) => f.chk === "⑤다른뜻").length}건`);
console.log(`[⑥같은어감] 화면 「가상 데이터·인물·회원」 ${virtualHits}건(목표 0)`);
console.log(`[⑦생성왕복] wpAutoLog.js = gen_wp_log.py --stdout · 불일치 ${fails.filter((f) => f.chk === "⑦생성왕복").length}건`);
console.log(`[⑧번들   ] index.html(배포 산출물) 화면 문자열 금칙 ${bundleHits}건(목표 0)`);

const secs = ((Date.now() - t0) / 1000).toFixed(1);
/* ⚠️ 스냅샷에 소요 시간을 넣지 않는다 — 돌릴 때마다 값이 흔들리면 post-commit 훅이 매 커밋
   amend·재빌드를 하게 된다(훅이 이 파일을 같은 커밋에 편입한다). 내용이 바뀔 때만 바뀌어야 한다. */
writeFileSync(join(ROOT, "scripts/wording_guard_snapshot.json"),
  JSON.stringify({ files: FILES.length, screen: screenHits, comment: commentHits, compound: compoundHits, exempt: exemptHits,
    notices: NOTICE.length, counts, perFile, perFileText, virtual: virtualHits, bundle: bundleHits,
    wpRoundTrip: fails.filter((f) => f.chk === "⑦생성왕복").length === 0,
    fails: fails.length }, null, 2) + "\n", "utf8");

if (fails.length) {
  console.log(`\n총 ${fails.length}건 위반 → FAIL`);
  fails.slice(0, 20).forEach((f) => console.log(`  · [${f.chk}] ${f.file ? f.file + (f.line ? ":" + f.line : "") + " " : ""}${f.why}${f.ctx ? "\n      …" + f.ctx + "…" : ""}`));
  process.exit(1);
}
console.log(`총 소요 ${secs}s → PASS`);
