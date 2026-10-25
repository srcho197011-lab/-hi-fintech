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

        ⑰ 반출물 고지의 **자리 · 경로 · 단일 원천** — 지시서 §15-9 세 번째 문구 · §4-6-3 · §10-6 ①②③.
          반출물은 화면을 떠나 혼자 돌아다니므로 고지가 **데이터 안에** 박혀야 한다. 이 검사가 보는 것은
          ⓐ자리 분모(PG_EXPORT_NOTICE_AT 3곳 — 자리를 세지 않으면 「고지 0건」과 「자리 0개」가
          구별되지 않는다) ⓑ각 자리의 조립 함수가 그 파일에 **실재하고 불리는가**(죽은 선언 금지)
          ⓒ문안이 **용어 원천 한 파일에만** 사는가(두 곳에 살면 한쪽만 고쳐지는 순간 산출물이 갈린다)
          ⓓ탐지기 자기시험(문안을 한 글자 바꾼 사본이 FAIL 로 잡히는가).
          ★ 「산출물에 고지가 실제로 따라 나가는가」는 **run_pg_scan 단언 23**이 소유한다 —
            렌더·소스 기준으로는 부분 선택 복사 구멍을 통과하기 때문이고(§15-9 ★), 검사 소유자를
            이원화하지 않기 위해 여기서는 **정적 축만** 본다.

   ── 협력업체 온톨로지·하네스(2026-10-25 P1)에서 추가한 검사 ──
        ⑨ 금칙 사전 0건 — src/data/partnerGov.js 의 **PG_FORBID 를 읽어** 그 표의 `bad` 낱말이
          화면 문자열에 남아 있지 않은지 센다. **사전을 이원화하지 않는다**(hmScriptGuard 와 같은 원칙) —
          이 러너는 금칙어를 자기 소스에 적지 않고 표에서 가져온다. 그래서 낱말을 더하려면 표만 고치면 된다.
          면제는 **표 자신이 사는 줄뿐**이다(금칙 사전은 금칙어를 문자로 들고 있어야 한다).
        ⑩ 용어 단일 원천 — 개칭 라벨이 두 곳에서 갈리지 않는가. Ontology.jsx 의 상위 탭 리터럴
          (내비 추출기가 읽는 유일한 자리)과 partnerGov.js 의 PG_SECTION_KO 가 **같은 문자열**인지 대조한다.
          두 곳에 둬야 하는 이유는 추출기가 상수를 읽을 수 없기 때문이고, 그래서 가드로 묶는다.
        ⑪ 판정 어법 1곳 — 「적합 / 보완 필요 / 부적합」 3등급이 렌더되는 자리가 정확히 한 곳인가.
          협력업체 일반 적합성 판정은 총점·3등급을 쓰지 않으므로(결함 3등급을 쓴다), 이 어법이 두 곳에
          서면 같은 협력업체가 두 방법론으로 등급을 받는다.
        ⑫ 정산 라벨 — ⓐ라벨을 `.split(" ")[0]` 로 만드는 자리 0건(8라벨 중 5건이 공백에서 잘렸다)
          ⓑ정산 금액 라벨이 PG_SETTLE_LABEL 경유인지 ⓒ전표ID를 순번으로 만드는 자리 0건
          ⓓ`sort(() => rng() - 0.5)` 0건(메모리 cohort-determinism)
        ⑬ 「같은 장부」 문안 0건 — 온톨로지 GMV(주문 시드 장부)와 재무회계 제품판매 매출(회원 환산 계획
          모델)은 **산정 기준이 다르다**. 두 값이 다른 동안 「재무회계 손익계산서에 반영됩니다」류로 적으면
          독자가 한쪽으로 다른 쪽을 검산하려 한다.
        ⑭ 판정 지면 이름 렌더 — 지시서 §14-3 ⑦ · §13-6 단언 16-ⓒ. **표시명은 pgDisplayName() 경유만**이고
          판정 지면에서 `v.name`·`p.legalName`·`o.vendorName`·`s.vendorName` 을 직접 렌더하지 않는다.
          ⚠ **이 검사의 함정은 「판정 지면이 아직 비어 있으면 0 = 0 으로 통과한다」**는 것이다. 이 저장소가
            두 번 겪은 형태(dailyRoster 2026-10-06 · 보장 창 2026-10-08)라 세 겹으로 막는다:
              ⓐ **탐지기 자기시험** — 양성 리터럴 4종 · 음성 리터럴 2종을 패턴에 먹여 정규식이 살아 있음을
                 먼저 증명한다. 패턴이 깨져 0건이 되는 경우를 분모 없이 통과시키지 않는다.
              ⓑ **감시목록 신선도** — 판정을 렌더할 수 있는 컴포넌트(pgDecide·pgDecideAll·pgPepDecide·
                 PG_POLICIES·pgTrustConclusion·inputRefs·pgReport* 참조, 또는 조항ID 리터럴 L-0#·P-0#·
                 T-0#·G-0# 렌더)를 **전수 탐색**해 등록부(PG_VERDICT) 밖이면 FAIL. P5a 가
                 PartnerGovReport.jsx 를 「감시 밖에서 신설」하는 경로를 닫는다.
              ⓒ **스캔 분모 하한** — 컴포넌트 전수 파일 수가 바닥(PG_COMP_FLOOR) 밑으로 내려가면 FAIL.
                 탐색 대상이 조용히 비는 사고(경로 오타 · walk 실패)를 잡는다.
            그리고 **거래 사실 레이어(서브탭 ②)는 사정권 밖**이다(§4-6-1 ⓓ) — Vendor360 의 실상호 렌더는
            「있어야 하는」 것이라 등록부가 지면을 `verdict` / `facts` 두 성질로 가른다.
        ⑯ AI 기반 운용 고지 · 생성형 산출 표시 애블레이션 — 지시서 §8-3-1 · 자기 거버넌스 G-08 · G-09.
          인공지능 투명성 확보 의무의 수범자가 **하이핀 자신**이다(하이가 전 화면에 상주하는 생성형 에이전트다).
          자리와 문안을 러너에 적지 않고 **PG_AI_NOTICE 표에서 읽는다** — 적으면 자리가 늘 때 조용히 통과한다.
          ⓐ문안이 선언 파일에 있는가 ⓑ렌더 파일이 그 문안의 조회 경로를 부르는가(죽은 문자열 금지)
          ⓒ표가 비거나 항목별 자리가 1곳이면 FAIL(분모를 먼저 세운다).
        ⑮ 미비점 3등급 어법 0건 — 지시서 §14-3 ④ · §5-6. 「단순한 미비점 / 유의한 미비점 / 중요한 취약점」은
          **내부회계관리제도(우리 자신)의 어법**이고 판정축이 「재무제표 왜곡표시 가능성 × 금액적 중요성」이다.
          협력업체 판정의 판정축은 「법령 위반 가능성 × 회원 피해 범위」이므로 그 어법을 가져오면 **판정축이
          바뀐 것을 낱말이 숨긴다**. 용어집 항목(PG_TERMS.icfr)은 그 셋을 **문자로 들고 있어야** 하므로
          면제하되, **그 항목이 「협력업체 판정에 쓰지 않는다」를 말하는지 함께 단언**한다(무사유 면제 금지).

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
  /* 법인 축 고지(2026-10-25 P1) — NOTICE 11항목은 전부 **개인(회원) 축**이었다. 협력업체 거래 레이어는
     의도적으로 실상호를 쓰므로 가명 표기 규약을 적용할 수 없고(적용하면 거짓이 된다) 법인 축 규약이 따로 필요하다.
     ⓐ 거래 사실 레이어의 성격 표기 ⓑ 판정 지면 규약 — **지면이 서기 전에** 등재한다.
        P7로 미루면 2026-10-23에 적발된 「다른 문단의 고지가 바닥을 메워 통과」 함정에 그대로 걸린다. */
  ["src/components/SupplyOntology.jsx", [/거래처 상호는 실제 상호이며, 거래·통제 수치는 시연 시드 데이터입니다/], "협력업체 거래 레이어 — 상호·수치 성격(법인 축)"],
  /* ⚠ P5a(2026-10-25)에서 **요구 파일을 옮겼다.** 판정 지면 규약은 선등재 당시 지면이 없어서
     패널 파일에 걸어 두었는데, 이제 지면이 생겼으므로 **그 지면을 렌더하는 파일**이 요구를 받는다.
     옮기지 않고 패널 파일에 남겨 두면 그 문구가 렌더되지 않는 죽은 문자열이 되고, 그것이 바로
     2026-10-23에 적발된 「다른 자리의 고지가 바닥을 메워 통과」 형태다. 문구 자체는 그대로다. */
  ["src/components/PartnerGovReport.jsx", [/법령 준수 판정은 자가점검 산출물이며 해당 기관의 실제 준수 여부를 뜻하지 않습니다/], "협력업체 판정 지면 규약(보고서 머리 B1)"],
  /* ★ 세 번째 문구(2026-10-26 P7) — **반출물 전용**이다. §15-9 가 「셋 다 NOTICE 에 등재해 애블레이션
     대상으로 둔다」고 적었고, 앞 두 문구는 화면이지만 이 문구는 **데이터(표 첫머리 · 인쇄 머리말 ·
     클립보드)에 심긴다**. 그래서 ⓐ문안의 생존은 여기(정적 등재)가 ⓑ산출물에 실제로 따라 나가는지는
     run_pg_scan 단언 23(실측)이 소유한다 — 두 검사의 대상이 다르다. 문안은 §4-6-3 문자 단위 확정이다. */
  ["src/data/partnerGov.js", [/# 시연 판정 · 실제 평가가 아님 — 본 표의 법령 준수 판정은 시연 시드 데이터에 대한 자가점검 산출물이며, 기재된 기관의 실제 준수 여부를 뜻하지 않습니다\./,
                              /시연 판정 · 실제 평가가 아님 — 본 보고서의 법령 준수 판정은 시연 시드 데이터에 대한 자가점검 산출물이며, 기재된 기관의 실제 준수 여부를 뜻하지 않습니다\./],
   "반출물 머리말 고지 2문안(표 · 문서) — 실명 표기에서 필수"],
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
/* ⚠ 바닥 이동 기록(2026-10-25 · P3) — 「적합성」 2건이 `kbDomainData.js` 에서 `partnerPolicy.js` 로
   **옮겨갔다**. 지워진 것이 아니다: `KB_LEGAL` 이 정책 레지스트리의 뷰로 바뀌면서 금융소비자보호 행의
   「6대 판매원칙(적합성·…)」·「설명·적합성 의무」 두 문장이 `PG_LAWS.fcpAct.kb` 로 이사했다.
   바닥을 **내린** 것이 아니라 **옮긴** 것이므로 전역 합계는 줄지 않았고(화면 축 8 → 8), 두 축의
   파일별 바닥만 소유자를 바꿨다. 바닥을 내려 통과시키는 것과 구별되게 이 기록을 남긴다 —
   다음 사람이 같은 자리를 보면 `git log -S"적합성" -- src/data/kbDomainData.js` 로 대조할 수 있다. */
const WORDS = ["정합성", "적합성", "합성어"];
/* ⓐ 화면 바닥 — screenOnly 기준(주석이 메울 수 없다). 화면 라벨 오치환을 잡는다. */
const FLOOR_SCREEN = {
  "정합성": { "src/components/Ontology.jsx": 2, "src/data/whitepaper.js": 4, "src/data/wpAutoLog.js": 2 },
  "적합성": { "src/components/Insurance.jsx": 1, "src/data/partnerPolicy.js": 2, "src/data/telemed.js": 1, "src/data/whitepaper.js": 4 },
  "합성어": {},
};
/* ⓑ 코드·주석 바닥 — 전문 기준. 「합성어」처럼 화면에 안 나오고 **NLU 사전·분해 규칙**에 사는 낱말은
   화면 바닥으로는 지킬 수 없다. 전문 바닥을 따로 둬 치환 사고를 여기서도 잡는다(뜻이 다른 두 축이다). */
const FLOOR_TEXT = {
  "정합성": { "src/components/AIDoctor.jsx": 1, "src/components/Ontology.jsx": 2, "src/data/pilotCohort.js": 4, "src/data/whitepaper.js": 4, "src/data/wpAutoLog.js": 2 },
  "적합성": { "src/components/Insurance.jsx": 1, "src/data/partnerPolicy.js": 4, "src/data/telemed.js": 1, "src/data/whitepaper.js": 5 },
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

/* ══════════ 협력업체 온톨로지·하네스 검사 ⑨~⑬ (2026-10-25 P1) ══════════ */

/* ── ⑨ 금칙 사전 0건 — 사전을 이원화하지 않는다 ──────────────────────────────
   금칙어를 이 러너에 적으면 사전이 둘이 된다. 그래서 **PG_FORBID 표를 읽어** 낱말을 가져온다.
   표는 src/data/partnerGov.js 안의 `{ bad: "…", use: "…", why: "…" }` 리터럴이고, 단일 번들이라
   import 가 없으므로 정규식으로 긁는다(표 형태가 바뀌면 하한 검증에서 죽는다 — 조용히 넘어가지 않는다). */
const PGOV = "src/data/partnerGov.js";
let forbidWords = [], forbidHits = 0, sectionKo = null;
{
  let s = null;
  try { s = rd(PGOV); } catch (e) { fails.push({ chk: "⑨금칙사전", file: PGOV, why: "용어·금칙 단일 원천이 없다 — 개칭 가드가 설 수 없다" }); }
  if (s != null) {
    /* scope 가 검사 소유자를 정한다 — "absolute" 만 이 검사가 센다.
       "context"(예: 다른 뜻으로는 정확한 말) 는 전용 검사가 이미 소유하고 있으므로 건드리지 않는다:
       한 낱말을 두 검사가 보면 어느 쪽이 단일 원천인지 정해지지 않는다. 표가 소유자를 선언하고 가드가 따른다. */
    const rows = [...s.matchAll(/\{\s*bad:\s*"([^"]+)",\s*scope:\s*"([^"]+)"/g)].map((m) => ({ bad: m[1], scope: m[2] }));
    if (rows.length < 5)
      fails.push({ chk: "⑨금칙사전", file: PGOV, why: `PG_FORBID 에서 ${rows.length}행만 읽었다(하한 5) — 표 형태가 바뀌었는지 확인하라(요구: { bad: "…", scope: "…", … })` });
    forbidWords = rows.filter((r) => r.scope === "absolute").map((r) => r.bad);
    const ctxOwned = rows.filter((r) => r.scope !== "absolute").map((r) => r.bad);
    if (ctxOwned.length) console.log(`[⑨금칙사전] 문맥 한정(전용 검사 소유 · ⑨ 미집행): ${ctxOwned.join("·")}`);
    const km = s.match(/const PG_SECTION_KO = "([^"]+)"/);
    if (!km) fails.push({ chk: "⑩용어원천", file: PGOV, why: "PG_SECTION_KO 를 읽을 수 없다 — 개칭 라벨의 단일 원천이 사라졌다" });
    else sectionKo = km[1];
    /* 표 자신은 면제다 — 금칙 사전은 금칙어를 문자로 들고 있어야 한다. 그 외 자리는 전부 위반이다. */
    for (const p of FILES) {
      if (rel(p) === PGOV) continue;
      const t = screenOnly(rd(rel(p)));
      for (const w of forbidWords) {
        let i = -1;
        while ((i = t.indexOf(w, i + 1)) >= 0) {
          forbidHits++;
          fails.push({ chk: "⑨금칙사전", file: rel(p), line: t.slice(0, i).split("\n").length,
            why: `화면 문자열에 금칙어 「${w}」 — 대체어와 사유는 ${PGOV} 의 PG_FORBID 에 있다`,
            ctx: t.slice(Math.max(0, i - 36), i + 36).replace(/\s+/g, " ") });
        }
      }
    }
  }
}

/* ── ⑩ 용어 단일 원천 — 개칭 라벨이 두 곳에서 갈리지 않는가 ──
   내비 추출기(gen_nav_inventory.py)는 Ontology.jsx 의 topTabs **리터럴**에서 라벨을 읽는다(상수를 읽을 수 없다).
   그래서 라벨이 두 곳에 있고, 어긋나면 화면과 인벤토리가 다른 이름을 말한다 — 그 둘을 여기서 묶는다. */
{
  const ONT = "src/components/Ontology.jsx";
  const s = rd(ONT);
  const m = s.match(/\["partner",\s*"([^"]+)"/);
  if (!m) fails.push({ chk: "⑩용어원천", file: ONT, why: "상위 탭 partner 라벨 리터럴을 찾을 수 없다 — 내비 추출기도 같이 죽는다(gen_nav_inventory.py 하한 검증)" });
  else if (sectionKo && m[1] !== sectionKo)
    fails.push({ chk: "⑩용어원천", file: ONT, why: `상위 탭 라벨 「${m[1]}」이 PG_SECTION_KO 「${sectionKo}」와 다르다 — 화면과 내비 인벤토리가 다른 이름을 말한다` });
  if (/top === "supply"/.test(s))
    fails.push({ chk: "⑩용어원천", file: ONT, why: '라우팅 키가 개칭 전("supply")으로 남아 있다 — 탭 키는 "partner"다' });
}

/* ── ⑪ 판정 어법 1곳 — 「적합 / 보완 필요 / 부적합」 3등급 ── */
let gradeSpots = [];
for (const p of FILES) {
  const t = screenOnly(rd(rel(p)));
  if (t.indexOf("보완 필요") >= 0) gradeSpots.push(rel(p) + ":" + (t.slice(0, t.indexOf("보완 필요")).split("\n").length));
}
if (gradeSpots.length !== 1)
  fails.push({ chk: "⑪판정어법", why: `「적합/보완 필요/부적합」 3등급 어법이 ${gradeSpots.length}곳에 있다(요구 1곳 — 의료마이데이터 사업자 선정 평가 전용). 협력업체 일반 적합성 판정은 총점·3등급을 쓰지 않는다(결함 3등급을 쓴다)`, ctx: gradeSpots.join(" / ") });

/* ── ⑫ 정산 라벨 · 결정론 정적 검사 ── */
let labelFails = 0;
{
  const SO = "src/components/SupplyOntology.jsx", SD = "src/data/supplyData.js";
  const so = rd(SO), sd = rd(SD);
  /* ⓐ 라벨을 공백으로 잘라 만들지 않는다 — 8라벨 중 5건이 잘려 「공급사 가용재고」가 「공급사」가 됐다 */
  for (const [f, s] of [[SO, so], [SD, sd]]) {
    const t = screenOnly(s);
    if (/\.t\.split\(" "\)\[0\]/.test(t) || /\.split\(" "\)\[0\]/.test(t)) {
      labelFails++;
      fails.push({ chk: "⑫정산라벨", file: f, why: '라벨을 `.split(" ")[0]` 로 만드는 자리가 있다 — 라벨의 단일 원천은 partnerGov.js 의 PG_COUNT_LABEL 이다' });
    }
  }
  /* ⓑ 정산 금액 라벨은 PG_SETTLE_LABEL 경유다 — 독립 장부로 읽히게 적지 않는다 */
  if (!/PG_SETTLE_LABEL/.test(so)) {
    labelFails++;
    fails.push({ chk: "⑫정산라벨", file: SO, why: "정산 금액 라벨이 PG_SETTLE_LABEL 경유가 아니다 — 정산은 주문 파생 종속 장부이고 라벨이 그 사실을 말해야 한다" });
  }
  if (/정산누계/.test(screenOnly(so))) {
    labelFails++;
    fails.push({ chk: "⑫정산라벨", file: SO, why: "「정산누계」가 화면에 남아 있다 — 독립 장부로 읽힌다. PG_SETTLE_LABEL 을 쓴다" });
  }
  /* ⓒ 전표ID는 결정적 키다 — 순번은 「주문 0건 셀은 행을 만들지 않는다」와 양립하지 않는다 */
  if (/id:\s*"T"\s*\+\s*String\(/.test(sd)) {
    labelFails++;
    fails.push({ chk: "⑫정산라벨", file: SD, why: '전표ID를 순번("T" + String(...))으로 만든다 — 한 셀이 비면 뒤의 전 행이 다른 셀을 가리킨다. 결정적 키("T-" + vendorId + "-" + period)를 쓴다' });
  }
  /* ⓓ 결정론 — 셔플 정렬 금지(메모리 cohort-determinism).
     ⚠ **주석을 걷어낸 뒤 센다.** 금지 패턴을 주석으로 적어 둔 자리가 이미 있고(pilotCohort.js 의
        Fisher-Yates 주석이 왜 그 패턴을 쓰지 않는지 설명한다), 전문에서 세면 **금지를 문서화한 코드가
        금지 위반으로 잡힌다.** 그러면 다음 사람이 설명 주석을 지워서 가드를 통과시킨다. */
  for (const p of FILES) {
    const s2 = screenOnly(rd(rel(p)));
    if (/sort\(\s*\(\s*\)\s*=>\s*(?:rng|Math\.random)\(\)\s*-\s*0\.5\s*\)/.test(s2)) {
      labelFails++;
      fails.push({ chk: "⑫정산라벨", file: rel(p), why: "sort(() => rng() - 0.5) — 결정론이 깨진다(Fisher-Yates 를 쓴다)" });
    }
  }
}

/* ── ⑬ 「같은 장부」 문안 0건 ──
   온톨로지는 주문 시드 장부, 재무회계는 회원 환산 계획 모델이다. 두 값이 다른 동안 한쪽이 다른 쪽에
   「반영됩니다」라고 주장하면 독자가 검산하려 하고, 그 검산은 반드시 실패한다. */
let sameLedger = 0;
{
  const SO = "src/components/SupplyOntology.jsx";
  const t = screenOnly(rd(SO));
  for (const re of [/ERP 전표로 자동 전기<\/b>되어 재무회계[^<]*손익계산서/, /재무회계 손익계산서에서 확인/, /손익계산서[^。\n]{0,40}에 반영됩니다/]) {
    if (re.test(t)) {
      sameLedger++;
      fails.push({ chk: "⑬같은장부", file: SO, why: `온톨로지 GMV(주문 시드 장부)와 재무회계 제품판매 매출(회원 환산 계획 모델)은 산정 기준이 다르다 — 「같은 장부」로 읽히는 문안을 두지 않는다. 요구: 두 지면의 주인이 다르다는 명기. 걸린 패턴: ${re}` });
    }
  }
}

/* ── ⑭ 판정 지면 이름 렌더 — 표시명은 pgDisplayName() 경유만(§14-3 ⑦ · §13-6 단언 16-ⓒ) ──
   ★ 지면의 성질을 두 값으로 가른다. `facts` = 거래 사실 레이어(실상호가 **있어야** 하는 지면 · §4-6-1 ⓓ) ·
     `verdict` = 판정 · 등급 · 결함이 렌더되는 지면(모드 스위치 사정권). 등록부에 없는 판정 지면은 FAIL 이다. */
const PG_VERDICT = [
  { f: "src/components/SupplyOntology.jsx", kind: "facts",
    why: "거래 · 운영 실적(서브탭 ②) — 실상호가 있어야 하는 지면이다. 가명 표기를 적용하면 거짓이 된다(§4-6-1 ⓓ · §15-9)" },
  { f: "src/components/PartnerGovReport.jsx", kind: "verdict",
    why: "판정 지면 · 보고서(서브탭 ④⑤) — **P5a 산출물이라 아직 없다.** 생기는 순간 이 검사가 직접 렌더를 잡는다" },
];
/* 직접 이름 렌더 패턴 — JSX 보간과 속성 양쪽을 본다. 표시 함수를 거친 자리는 잡지 않는다. */
const NAME_RENDER = [
  /\{\s*(?:v|p|o|s|r|rec|row|part|partner|vend)\s*\.\s*(?:name|legalName|vendorName)\s*\}/,
  /\{\s*(?:v|p|o|s|r|rec|row|part|partner|vend)\s*\.\s*(?:name|legalName|vendorName)\s*(?:\|\||\?)/,
  /(?:title|alt|aria-label)\s*=\s*\{\s*(?:v|p|o|s|r|rec|row|part|partner|vend)\s*\.\s*(?:name|legalName|vendorName)\s*\}/,
];
let verdictFails = 0, verdictScanned = 0, verdictMissing = 0;
{
  /* ⓐ 탐지기 자기시험 — 분모를 먼저 세운다. 패턴이 깨져 0건이 되는 경우를 통과시키지 않는다. */
  const POS = ["<b>{v.name}</b>", "<span>{p.legalName}</span>", "{o.vendorName}", 'title={s.vendorName}'];
  const NEG = ["{pgDisplayName(p)}", "{pgCode(rec)}"];
  const hitAny = (t) => NAME_RENDER.some((re) => re.test(t));
  for (const t of POS) if (!hitAny(t)) { verdictFails++; fails.push({ chk: "⑭이름렌더", why: `탐지기 자기시험 실패 — 양성 리터럴을 놓친다: ${t}. 패턴이 깨진 상태로 0건을 보고하면 검사가 사라진 것과 같다` }); }
  for (const t of NEG) if (hitAny(t)) { verdictFails++; fails.push({ chk: "⑭이름렌더", why: `탐지기 자기시험 실패 — 표시 함수 경유를 위반으로 잡는다(오탐): ${t}` }); }
  /* ⓑ 감시목록 신선도 — 판정을 렌더할 수 있는 컴포넌트가 등록부 밖에 있으면 FAIL */
  const REG = PG_VERDICT.map((x) => x.f);
  const VERDICT_SIG = /\bpgDecide\b|\bpgDecideAll\b|\bpgPepDecide\b|\bPG_POLICIES\b|\bpgTrustConclusion\b|\bpgReport[A-Za-z]*\(|\binputRefs\b|["'`](?:L|P|T|G)-\d\d["'`]/;
  const comps = FILES.filter((p) => /[\\/]components[\\/][^\\/]+\.jsx$/.test(p));
  for (const p of comps) {
    const r = rel(p);
    if (!VERDICT_SIG.test(screenOnly(rd(r)))) continue;
    if (REG.indexOf(r) < 0) {
      verdictFails++;
      fails.push({ chk: "⑭이름렌더", file: r, why: "판정을 렌더할 수 있는 컴포넌트가 **등록부(PG_VERDICT) 밖**에 있다 — 감시 밖에서 신설된 판정 지면이다. 등록부에 성질(verdict / facts)과 사유를 적고 다시 돌린다" });
    }
  }
  /* ⓒ 등록된 판정 지면의 직접 렌더 0건 + 분모 하한 */
  for (const e of PG_VERDICT) {
    let src = null;
    try { src = rd(e.f); } catch (err) { src = null; }
    if (src == null) { verdictMissing++; continue; }
    verdictScanned++;
    if (e.kind !== "verdict") continue;
    const t = screenOnly(src);
    for (const re of NAME_RENDER) {
      const m = t.match(new RegExp(re.source, "g"));
      if (m) {
        verdictFails += m.length;
        fails.push({ chk: "⑭이름렌더", file: e.f, why: `판정 지면에서 상호를 **직접 렌더**한다 ${m.length}건 — 표시명은 pgDisplayName() 한 함수에서만 나온다(§4-6-1 ⓐ). 걸린 것: ${m.slice(0, 3).join(" / ")}` });
      }
    }
  }
  const PG_COMP_FLOOR = 57;   /* 2026-10-25 실측 src/components/*.jsx 전수. 탐색이 조용히 비는 사고를 잡는다 */
  if (comps.length < PG_COMP_FLOOR) {
    verdictFails++;
    fails.push({ chk: "⑭이름렌더", why: `컴포넌트 전수 탐색이 바닥 밑이다 — ${comps.length} < ${PG_COMP_FLOOR}. 탐색 대상이 비면 ⓑ가 0 = 0 으로 통과한다` });
  }
}

/* ── ⑮ 미비점 3등급 어법 0건 — 협력업체 판정에 내부회계관리제도 어법을 가져오지 않는다(§14-3 ④ · §5-6) ── */
const ICFR_WORDS = ["단순한 미비점", "유의한 미비점", "중요한 취약점"];
let icfrHits = 0;
{
  /* 면제 — 용어집 항목 한 줄뿐이다(금칙 사전이 금칙어를 문자로 들고 있어야 하는 것과 같은 구조).
     ⚠ 무사유 면제 금지 — 그 항목이 「협력업체 판정에 쓰지 않는다」를 **실제로** 말하는지 함께 단언한다. */
  const PGV = "src/data/partnerGov.js";
  const gov = rd(PGV);
  const icfrLine = (gov.split(/\r?\n/).filter((l) => /icfr:/.test(l))[0]) || "";
  if (!icfrLine) {
    icfrHits++;
    fails.push({ chk: "⑮미비점", file: PGV, why: "용어집에 미비점 3등급 항목(icfr)이 없다 — 쓰지 않는 어법은 **쓰지 않는다고 적힌 자리**가 있어야 한다(§5-6)" });
  } else if (!/협력업체 판정에 쓰지 않는다/.test(icfrLine)) {
    icfrHits++;
    fails.push({ chk: "⑮미비점", file: PGV, why: "용어집 icfr 항목이 「협력업체 판정에 쓰지 않는다」를 말하지 않는다 — 면제의 전제가 깨졌다(무사유 면제 금지)" });
  }
  for (const p of FILES) {
    const r = rel(p);
    const t = screenOnly(rd(r));
    for (const w of ICFR_WORDS) {
      let i = -1;
      while ((i = t.indexOf(w, i + 1)) >= 0) {
        const line = t.slice(0, i).split(/\r?\n/).length;
        if (r === PGV && /icfr:/.test(t.split(/\r?\n/)[line - 1] || "")) continue;   /* 용어집 항목 면제 */
        icfrHits++;
        fails.push({ chk: "⑮미비점", file: r, line, why: `「${w}」 — 내부회계관리제도 어법이다(판정축: 재무제표 왜곡표시 가능성 × 금액적 중요성). 협력업체 판정은 결함 3등급(경미 / 중대 / 치명 · 판정축: 법령 위반 가능성 × 회원 피해 범위)을 쓴다(§4-5-1 · §5-6)` });
      }
    }
  }
}

/* ── ⑯ AI 기반 운용 고지 · 생성형 산출 표시 애블레이션 — 법정 의무 문구다(§8-3-1 · G-08 · G-09) ──
   왜 이 러너가 소유하는가: 이 검사의 실체는 **문구가 그 자리에 있는가**이고, 그것이 ③고지가 하는 일이다.
   ③과 달리 **요구 목록을 러너에 적지 않는다** — 자리와 문안을 `PG_AI_NOTICE` 표에서 읽는다.
   러너에 적으면 자리가 늘어날 때 검사가 「0건으로 조용히 통과」한다(⑨가 금칙 사전을 읽는 것과 같은 이유).
   애블레이션의 두 축을 **둘 다** 본다:
     ⓐ 문안이 선언 파일에 있는가 — 그 문장만 지우면 FAIL(문안 애블레이션)
     ⓑ 렌더 파일이 그 문안의 **조회 경로를 부르는가** — 호출만 지워도 FAIL(렌더 애블레이션).
        문자열만 검사하면 「문구는 소스에 있는데 아무 데서도 불리지 않는」 죽은 문자열이 통과한다.
   ⓒ 분모 — 표가 비거나 항목별 자리가 1곳뿐이면 FAIL(0 = 0 으로 통과하지 않는다). */
const PGAI = "src/data/partnerAI.js";
let aiNoticeRows = 0, aiNoticeFails = 0;
{
  let s = null;
  try { s = rd(PGAI); } catch (e) {
    aiNoticeFails++;
    fails.push({ chk: "⑯AI고지", file: PGAI, why: "AI 거버넌스 선언 원천이 없다 — G-08 · G-09 애블레이션이 설 수 없다" });
  }
  if (s != null) {
    /* 문안 원천 두 곳 — 하이 독(이 파일)과 보고서 지면 선언(partnerReport.js) */
    const dock = {};
    const dm = s.match(/const PG_AI_DOCK_NOTICE = \{([\s\S]*?)\n\};/);
    if (dm) for (const m of dm[1].matchAll(/(\w+):\s*"([^"]+)"/g)) dock[m[1]] = m[2];
    const decl = {};
    try {
      const rp = rd("src/data/partnerReport.js");
      for (const m of rp.matchAll(/(aiNotice\w+):\s*"([^"]+)"/g)) decl[m[1]] = m[2];
    } catch (e) {}
    /* ★ 호출 경로를 **함수 이름과 인자로 갈라** 선언한다 — 한 칸에 `f("k")` 로 적으면 표 안에
       escape 가 들어가 정규식이 그 자리에서 끊긴다(실측으로 끊겼다). 갈라 두면 둘 다 단언할 수 있다. */
    const rows = [...s.matchAll(/\{\s*gid:\s*"(G-\d\d)",\s*at:\s*"([^"]+)",\s*src:\s*"(\w+)",\s*key:\s*"(\w+)",\s*srcFile:\s*"([^"]+)",\s*file:\s*"([^"]+)",\s*render:\s*"(\w+)",\s*renderArg:\s*(?:"(\w+)"|null)/g)]
      .map((m) => ({ gid: m[1], at: m[2], src: m[3], key: m[4], srcFile: m[5], file: m[6], render: m[7], renderArg: m[8] || null }));
    aiNoticeRows = rows.length;
    /* ⓒ 분모 먼저 — 표 형태가 바뀌어 0행이 읽히면 검사가 사라진 것과 같다 */
    if (rows.length < 4) {
      aiNoticeFails++;
      fails.push({ chk: "⑯AI고지", file: PGAI, why: `PG_AI_NOTICE 에서 ${rows.length}행만 읽었다(하한 4) — 표 형태가 바뀌었는지 확인하라(요구: { gid, at, src, key, srcFile, file, render, renderArg, owner, why })` });
    }
    for (const gid of ["G-08", "G-09"]) {
      const n = rows.filter((r) => r.gid === gid).length;
      if (n < 2) {
        aiNoticeFails++;
        fails.push({ chk: "⑯AI고지", file: PGAI, why: `${gid} 의 고지 자리가 ${n}곳이다(하한 2 — 하이 독과 판정 지면) · 한 곳만 남으면 그 자리를 떼는 것으로 의무가 사라진다` });
      }
    }
    for (const r of rows) {
      const text = r.src === "PG_AI_DOCK_NOTICE" ? dock[r.key] : decl[r.key];
      /* ⓐ 문안 애블레이션 */
      if (!text) {
        aiNoticeFails++;
        fails.push({ chk: "⑯AI고지", file: r.srcFile, why: `${r.gid} 「${r.at}」 의 고지 문안(${r.src}.${r.key})을 읽을 수 없다 — 인공지능 투명성 확보 의무 문구다. 지우면 안 된다` });
        continue;
      }
      let src = null;
      try { src = rd(r.srcFile); } catch (e) { src = null; }
      if (src == null || src.indexOf(text) < 0) {
        aiNoticeFails++;
        fails.push({ chk: "⑯AI고지", file: r.srcFile, why: `${r.gid} 「${r.at}」 의 고지 문안이 선언 파일에 없다 — 문안 애블레이션 실패` });
      }
      /* ⓑ 렌더 애블레이션 — 호출 경로가 그 파일에 살아 있는가(문자열만 있고 불리지 않는 자리를 잡는다) */
      let dst = null;
      try { dst = screenOnly(rd(r.file)); } catch (e) { dst = null; }
      const call = r.renderArg ? `${r.render}("${r.renderArg}")` : `${r.render}(`;
      if (dst == null || dst.indexOf(call) < 0) {
        aiNoticeFails++;
        fails.push({ chk: "⑯AI고지", file: r.file, why: `${r.gid} 「${r.at}」 의 렌더 호출 ${call} 이 없다 — 문구가 소스에 있어도 화면에 서지 않는다(죽은 문자열)` });
      }
    }
  }
}

/* ── ⑰ 반출물 고지의 자리 · 경로 · 단일 원천 (P7 · §15-9 세 번째 문구 · §4-6-3 · §10-6) ──
   ★ 요구 목록을 러너에 적지 않는다 — 자리와 조립 경로를 `PG_EXPORT_NOTICE_AT` 표에서 읽는다(⑨·⑯과
     같은 원칙). 러너에 적으면 자리가 늘어날 때 검사가 「0건으로 조용히 통과」한다.
   ★ 「산출물에 고지가 따라 나가는가」는 run_pg_scan 단언 23 이 소유한다(실측). 여기는 정적 축만. */
const PGTERMS = "src/data/partnerGov.js";
let exAtRows = 0, exFails = 0, exNoticeN = 0, exScan = 0;
const EX_SCAN_FLOOR = 150;   /* src 전수 하한 — 2026-10-26 실측 183파일 */
{
  let s0 = null;
  try { s0 = rd(PGTERMS); } catch (e) {
    exFails++;
    fails.push({ chk: "⑰반출고지", file: PGTERMS, why: "용어 원천이 없다 — 반출물 고지의 자리·문안이 설 수 없다" });
  }
  if (s0 != null) {
    /* 문안 2개 — 용어 원천이 상수로 들고 있다(문자 단위 생존은 검사 ③이 정규식으로 본다) */
    const notices = {};
    for (const m of s0.matchAll(/const PG_EXPORT_NOTICE_(TSV|DOC) = "([^"]+)";/g)) notices[m[1].toLowerCase()] = m[2];
    exNoticeN = Object.keys(notices).length;
    if (exNoticeN !== 2) {
      exFails++;
      fails.push({ chk: "⑰반출고지", file: PGTERMS, why: "반출물 고지 문안을 " + exNoticeN + "개만 읽었다(요구 2 — 표용 · 문서용) · 코드 표기로 내려도 문구는 지우지 않는다" });
    }
    /* 자리 표 — {at, ko, by, notice, fn[], file, rule} */
    const at = [...s0.matchAll(/\{\s*at:\s*"(\w+)",\s*ko:\s*"([^"]+)",\s*by:\s*"([^"]+)",\s*notice:\s*"(\w+)",\s*\n?\s*fn:\s*\[([^\]]*)\],\s*file:\s*"([^"]+)",\s*\n?\s*rule:\s*"([^"]+)"/g)]
      .map((m) => ({ at: m[1], ko: m[2], by: m[3], notice: m[4],
        fn: m[5].split(",").map((x) => x.replace(/["\s]/g, "")).filter(Boolean), file: m[6], rule: m[7] }));
    exAtRows = at.length;
    /* ⓐ 분모 먼저 — 표 형태가 바뀌어 0행이 읽히면 검사가 사라진 것과 같다 */
    if (at.length < 3) {
      exFails++;
      fails.push({ chk: "⑰반출고지", file: PGTERMS, why: `PG_EXPORT_NOTICE_AT 에서 ${at.length}행만 읽었다(하한 3 — 표 첫 줄 · 문서 머리말 · 클립보드 산출물) · 표 형태가 바뀌었는지 확인하라` });
    }
    for (const r of at) {
      if (!notices[r.notice]) {
        exFails++;
        fails.push({ chk: "⑰반출고지", file: PGTERMS, why: `자리 「${r.ko}」 가 가리키는 문안(${r.notice})이 없다 — 자리만 남고 고지가 사라진다` });
      }
      if (!r.fn.length || !r.file || !r.rule) {
        exFails++;
        fails.push({ chk: "⑰반출고지", file: PGTERMS, why: `자리 「${r.ko}」 에 조립 함수 · 파일 · 규약 중 빈 칸이 있다 — 소유자 없는 자리는 다음 세션에 사라진다` });
        continue;
      }
      /* ⓑ 조립 경로가 그 파일에 **실재하고 불리는가** — 선언만 있고 아무도 안 부르면 죽은 자리다 */
      let dst = null;
      try { dst = screenOnly(rd(r.file)); } catch (e) { dst = null; }
      if (dst == null) {
        exFails++;
        fails.push({ chk: "⑰반출고지", file: r.file, why: `자리 「${r.ko}」 의 조립 파일을 읽을 수 없다` });
        continue;
      }
      for (const fn of r.fn) {
        if (dst.indexOf(fn + "(") < 0) {
          exFails++;
          fails.push({ chk: "⑰반출고지", file: r.file, why: `자리 「${r.ko}」 의 조립 함수 ${fn}() 호출이 그 파일에 없다 — 문구가 선언돼 있어도 산출물에 실리지 않는다(죽은 자리)` });
        }
      }
    }
    /* ⓒ 단일 원천 — 문안이 용어 원천 밖의 src 파일에 리터럴로 복제되지 않았는가.
       ⚠ FILES 는 **절대 경로**다(walk 가 join(ROOT,…) 로 쌓는다). 처음엔 그 값을 rd() 에 넘겼는데
         rd() 가 다시 join(ROOT, 절대경로) 를 해서 **전건 읽기 실패 → catch → 0건 통과**가 됐다.
         음성 테스트로 적발했다(보호 유틸에 고지를 복제했는데 이 검사가 통과했다 — run_pg_scan
         단언 23-g 만 잡았다). 그래서 ⓔ **스캔 분모**를 함께 센다 — 읽은 파일 수가 바닥 밑이면 FAIL. */
    let exScanned = 0;
    for (const f of FILES) {
      const r0 = rel(f);
      if (r0 === PGTERMS) continue;
      let t = null;
      try { t = readFileSync(f, "utf8"); } catch (e) { continue; }
      exScanned++;
      for (const k of Object.keys(notices)) {
        const body = notices[k].replace(/^# /, "");
        if (body.length > 20 && t.indexOf(body) >= 0) {
          exFails++;
          fails.push({ chk: "⑰반출고지", file: r0, why: `반출물 고지 문안(${k})이 용어 원천 밖에 복제돼 있다 — 한쪽만 고쳐지는 순간 산출물이 갈린다(조회는 pgExportNotice()로 한다)` });
        }
      }
    }
    exScan = exScanned;
    if (exScanned < EX_SCAN_FLOOR) {
      exFails++;
      fails.push({ chk: "⑰반출고지", file: PGTERMS, why: `단일 원천 스캔이 ${exScanned}파일만 읽었다(바닥 ${EX_SCAN_FLOOR}) — 탐색 대상이 조용히 비는 사고(경로 형태 · walk 실패)를 잡는다` });
    }
    /* ⓓ 탐지기 자기시험 — 문안을 한 글자 바꾼 사본이 잡히는가(분모 없이 0건을 통과시키지 않는다) */
    const probe = String(notices.tsv || "").replace("시연 판정", "시연판정");
    const live = Object.values(notices).some((v) => String(v).indexOf("시연 판정 · 실제 평가가 아님") >= 0);
    const caught = probe && probe.indexOf("시연 판정 · 실제 평가가 아님") < 0;
    if (!live || !caught) {
      exFails++;
      fails.push({ chk: "⑰반출고지", file: PGTERMS, why: "탐지기 자기시험 실패 — 문안 비교가 살아 있지 않다(한 글자 바꾼 사본이 통과한다)" });
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
console.log(`[⑨금칙사전] PG_FORBID ${forbidWords.length}낱말(${forbidWords.join("·")}) · 화면 잔존 ${forbidHits}건(목표 0)`);
console.log(`[⑩용어원천] PG_SECTION_KO 「${sectionKo || "(없음)"}」 ↔ 상위 탭 리터럴 대조 · 불일치 ${fails.filter((f) => f.chk === "⑩용어원천").length}건`);
console.log(`[⑪판정어법] 「적합/보완 필요/부적합」 렌더 ${gradeSpots.length}곳(요구 1) — ${gradeSpots.join(" / ") || "(없음)"}`);
console.log(`[⑫정산라벨] split 라벨·정산 라벨·전표ID·셔플정렬 위반 ${labelFails}건(목표 0)`);
console.log(`[⑬같은장부] 「재무회계에 반영」류 문안 ${sameLedger}건(목표 0)`);
console.log(`[⑭이름렌더] 등록 지면 ${PG_VERDICT.length}(스캔 ${verdictScanned} · 미생성 ${verdictMissing}) · 컴포넌트 전수 ${FILES.filter((p) => /[\\/]components[\\/][^\\/]+\.jsx$/.test(p)).length}(바닥 57) · 위반 ${verdictFails}건(목표 0)`);
console.log(`[⑮미비점 ] 「단순한/유의한 미비점·중요한 취약점」 ${icfrHits}건(목표 0 · 용어집 1줄 면제)`);
console.log(`[⑯AI고지 ] PG_AI_NOTICE ${aiNoticeRows}자리(하한 4 · 항목별 2) · 문안·렌더 애블레이션 위반 ${aiNoticeFails}건(목표 0)`);
console.log(`[⑰반출고지] PG_EXPORT_NOTICE_AT ${exAtRows}자리(하한 3) · 문안 ${exNoticeN}(요구 2 · 단일 원천) · 위반 ${exFails}건(목표 0 · 산출물 실증은 run_pg_scan 단언 23) · 단일 원천 스캔 ${exScan}파일(바닥 ${EX_SCAN_FLOOR})`);

/* ── ⑱ 당사 지면 실측의 교차 검사 (2026-10-26 신설 · 지적 ⓠ L-10) ──
   왜 필요한가: 당사 축 조항의 불허가 「제출받지 못했다」가 아니라 「세어 보니 0곳이다」에 기대게
   바꿨다(PG_SELF_SCAN). 그 측정은 **고지 레지스트리**를 읽는다. 그런데 누군가 중개 지면 컴포넌트에
   고지 문구를 직접 넣고 레지스트리에 등재하지 않으면, 측정값은 0 으로 남아 **사실과 다른 불허**가
   실명 법인 보고서에 남는다. 두 축(컴포넌트 소스 ↔ 레지스트리)이 **독립 소유자**이므로 교차로 센다. */
const PGREP = "src/data/partnerReport.js";
let selfScanRows = 0, selfScanFails = 0, selfScanStatic = {};
{
  let s0 = null;
  try { s0 = rd(PGREP); } catch (e) {
    selfScanFails++;
    fails.push({ chk: "⑱당사실측", file: PGREP, why: "지면 계약 파일이 없다 — 당사 축 실측의 선언이 설 수 없다" });
  }
  if (s0 != null) {
    const rows = [...s0.matchAll(/\{\s*k:\s*"(\w+)",\s*ko:\s*"([^"]+)",\s*policy:\s*"([\w-]+)",\s*\n?\s*where:\s*"([^"]+)",\s*match:\s*"([^"]+)",\s*\n?\s*registry:\s*"(\w+)",\s*staticOwner:\s*"([^"]+)"/g)]
      .map((m) => ({ k: m[1], ko: m[2], policy: m[3], where: m[4], match: m[5], registry: m[6], owner: m[7] }));
    selfScanRows = rows.length;
    if (rows.length < 1) {
      selfScanFails++;
      fails.push({ chk: "⑱당사실측", file: PGREP, why: "PG_SELF_SCAN 에서 0행을 읽었다(하한 1) — 표 형태가 바뀌었는지 확인하라(요구: { k, ko, policy, where, match, registry, staticOwner, how, note })" });
    }
    for (const r of rows) {
      /* ⓐ 레지스트리가 실재하는가 */
      if (s0.indexOf("const " + r.registry + " = [") < 0) {
        selfScanFails++;
        fails.push({ chk: "⑱당사실측", file: PGREP, why: `실측 대상 레지스트리 ${r.registry} 가 없다 — 「세어 보았다」가 셀 것이 없는 선언이 된다` });
        continue;
      }
      /* ⓑ 레지스트리에서 매칭되는 자리 수 = 「측정값」의 정적 재현 */
      const seg = s0.slice(s0.indexOf("const " + r.registry + " = ["));
      const end = seg.indexOf("\n];");
      const tbl = seg.slice(0, end < 0 ? seg.length : end);
      const inReg = (tbl.match(new RegExp(r.match, "g")) || []).length;
      /* ⓒ 화면 컴포넌트에서 그 문구가 렌더되는 자리 수 */
      /* FILES 는 **절대 경로**다 — rd() 는 ROOT 와 join 하므로 절대 경로를 넘기면 던진다.
         종전 구현이 그 예외를 조용히 넘겨서(catch 로 continue) 화면 쪽 분모가 **항상 0**이었다.
         애블레이션으로 드러났다 — 레지스트리만 올려도 「1 ↔ 0」이 되어 우연히 잡혔을 뿐,
         화면에만 심는 반대 방향은 한 번도 보지 못했다. rel() 로 상대 경로를 만든다. */
      const comp = FILES.map((x) => rel(x)).filter((x) => /^src[/]components[/][^/]+[.]jsx$/.test(x));
      if (!comp.length) {
        selfScanFails++;
        fails.push({ chk: "\u3238\ub2f9\uc0ac\uc2e4\uc81d", file: PGREP, why: "\ud654\uba74 \ucf54\ud3ec\ub10c\ud2b8\ub97c 0\uac1c \uc77d\uc5c8\ub2e4" });
      }
      let inScreen = 0;
      const screenAt = [];
      for (const f of comp) {
        const t = rd(f);
        const n = (t.match(new RegExp(r.match, "g")) || []).length;
        if (n) { inScreen += n; screenAt.push(f); }
      }
      selfScanStatic[r.k] = { registry: inReg, screen: inScreen, at: screenAt };
      if (inReg !== inScreen) {
        selfScanFails++;
        fails.push({ chk: "⑱당사실측", file: PGREP,
          why: `「${r.ko}」(${r.policy}) — 레지스트리 등재 ${inReg}곳 ↔ 화면 렌더 ${inScreen}곳 이 어긋난다` +
               (screenAt.length ? ` (화면: ${screenAt.join(" · ")})` : "") +
               ". 등재 없이 화면에만 넣으면 측정값이 0 으로 남아 사실과 다른 불허가 보고서에 남고, 거꾸로면 렌더되지 않는 고지를 충족으로 센다" });
      }
    }
  }
}

/* ── ⑲ 제재 종류 렌더 게이트 (2026-10-26 신설 · 지적 ⑩) ──
   왜 필요한가: 레지스트리의 제재 항목 중 **원문확인은 1건**뿐인데 지면 6자리가 `sanction.kind` 를
   그대로 인쇄했다. 데이터 자신이 그 항목에 「제재 축을 판정 · 렌더에 쓰지 않는다」고 적어 두었는데도
   그랬다. 조문 번호에 세운 논리(원문확인이 아니면 번호를 찍지 않는다)를 제재 축에 적용한 게이트가
   `pgSanctionRender()` 이고, **게이트 밖에서 kind 를 렌더하는 자리 0건**을 여기서 센다. */
let sancFails = 0, sancSpots = [];
{
  /* FILES 는 **절대 경로**다 — rel() 로 바꿔야 rd() 가 읽는다. 종전 구현은 예외를 조용히
     넘겨서 **한 파일도 스캔하지 않고 0건으로 통과**했다. 애블레이션으로 드러났다:
     제재 종류를 게이트 밖에서 렌더하도록 되돌려도 이 검사가 녹색이었다. */
  const SCAN = FILES.map((x) => rel(x)).filter((x) => /^src[/]components[/](PartnerGovReport|SupplyOntology|Ontology)[.]jsx$/.test(x));
  if (SCAN.length < 3) {
    sancFails++;
    fails.push({ chk: "⑲제재게이트", file: "(없음)", why: "판정 · 엔진 · AI 지면 파일을 0개 읽었다 — 분모가 비면 검사가 공집합에서 통과한다" });
  }
  for (const f of SCAN) {
    const t = rd(f);
    const lines = t.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (/^\s*(\/\*|\*|\/\/)/.test(L)) continue;                 /* 주석은 사정권이 아니다 */
      if (!/sanction\s*(\.|\[")kind/.test(L) && !/sanction\.kind/.test(L)) continue;
      /* 게이트를 지나면 통과 — `_pgSanc(...)` 또는 `pgSanctionRender(...)` 안에서만 허용한다 */
      if (/_pgSanc\(|pgSanctionRender\(/.test(L)) continue;
      sancFails++;
      sancSpots.push(f + ":" + (i + 1));
      fails.push({ chk: "⑲제재게이트", file: f, line: i + 1,
        why: "제재 종류를 게이트(_pgSanc / pgSanctionRender) 밖에서 렌더한다 — 확인 등급이 원문확인이 아닌 제재를 인쇄하면 「알고도 인쇄했다」는 기록이 된다",
        ctx: L.trim().slice(0, 110) });
    }
  }
}

/* ── ⑳ 분모 이름이 라벨에 든다 (2026-10-26 신설 · 지적 ⑬) ──
   왜 필요한가: B1 의 「출처 등급 비중」이 **보고서 내용물의 출처 비중**으로 읽혔다. 그 수치의 분모는
   제출 · 객체 필드 사전이고 보고서 지표 집합과 **다른 집합**이다. 라벨에 원천 집합의 이름이 들어 있어야
   독자가 다른 질문의 답을 읽지 않는다. 그리고 지표 축 비중이 **별 칸으로 함께** 적혀야 한다. */
let denomFails = 0;
{
  let s0 = null;
  try { s0 = rd(PGREP); } catch (e) { s0 = null; }
  if (s0 == null) {
    denomFails++;
    fails.push({ chk: "⑳분모라벨", file: PGREP, why: "지면 계약 파일이 없다" });
  } else {
    const row = s0.match(/\{\s*id:\s*"b1\.gradeMix"[\s\S]{0,400}?\},/);
    if (!row) {
      denomFails++;
      fails.push({ chk: "⑳분모라벨", file: PGREP, why: "b1.gradeMix 선언을 읽지 못했다 — 표 형태가 바뀌었는지 확인하라" });
    } else if (!/할당표|PG_SOURCE_MAP|필드 사전/.test(row[0])) {
      denomFails++;
      fails.push({ chk: "⑳분모라벨", file: PGREP, why: "b1.gradeMix 의 라벨 · 정의에 **원천 집합의 이름**이 없다 — 「출처 등급 비중」만 적으면 보고서 내용물의 비중으로 읽힌다" });
    }
    if (s0.indexOf('id: "b1.metricMix"') < 0) {
      denomFails++;
      fails.push({ chk: "⑳분모라벨", file: PGREP, why: "지표 축 비중(b1.metricMix)이 선언되지 않았다 — 두 질문의 답을 한 칸으로 적으면 안 된다" });
    }
    if (s0.indexOf("function pgMetricGradeMix") < 0) {
      denomFails++;
      fails.push({ chk: "⑳분모라벨", file: PGREP, why: "pgMetricGradeMix() 가 없다 — 지표 축 비중을 지면이 세게 하면 §10-4 규약 4 위반이다" });
    }
  }
}

console.log(`[⑱당사실측] PG_SELF_SCAN ${selfScanRows}항목 · 레지스트리↔화면 교차 ${JSON.stringify(selfScanStatic)} · 위반 ${selfScanFails}건(목표 0)`);
console.log(`[⑲제재게이트] 제재 종류 게이트 밖 렌더 ${sancSpots.length}곳(목표 0)${sancSpots.length ? " — " + sancSpots.join(" / ") : ""}`);
console.log(`[⑳분모라벨] b1 출처 등급 분모 이름 · 지표 축 별 칸 · 위반 ${denomFails}건(목표 0)`);

const secs = ((Date.now() - t0) / 1000).toFixed(1);
/* ⚠️ 스냅샷에 소요 시간을 넣지 않는다 — 돌릴 때마다 값이 흔들리면 post-commit 훅이 매 커밋
   amend·재빌드를 하게 된다(훅이 이 파일을 같은 커밋에 편입한다). 내용이 바뀔 때만 바뀌어야 한다. */
writeFileSync(join(ROOT, "scripts/wording_guard_snapshot.json"),
  JSON.stringify({ files: FILES.length, screen: screenHits, comment: commentHits, compound: compoundHits, exempt: exemptHits,
    notices: NOTICE.length, counts, perFile, perFileText, virtual: virtualHits, bundle: bundleHits,
    wpRoundTrip: fails.filter((f) => f.chk === "⑦생성왕복").length === 0,
    pgForbidWords: forbidWords, pgForbidHits: forbidHits, pgSectionKo: sectionKo,
    gradeSpots, pgLabelFails: labelFails, pgSameLedger: sameLedger,
    pgVerdictPages: PG_VERDICT.length, pgVerdictScanned: verdictScanned, pgVerdictMissing: verdictMissing,
    pgNameRenderFails: verdictFails, pgIcfrHits: icfrHits,
    pgAiNoticeRows: aiNoticeRows, pgAiNoticeFails: aiNoticeFails,
    pgExportNoticeAt: exAtRows, pgExportNotices: exNoticeN, pgExportNoticeFails: exFails, pgExportScan: exScan,
    pgSelfScanRows: selfScanRows, pgSelfScanStatic: selfScanStatic, pgSelfScanFails: selfScanFails,
    pgSanctionGateSpots: sancSpots, pgDenomLabelFails: denomFails,
    fails: fails.length }, null, 2) + "\n", "utf8");

if (fails.length) {
  console.log(`\n총 ${fails.length}건 위반 → FAIL`);
  fails.slice(0, 20).forEach((f) => console.log(`  · [${f.chk}] ${f.file ? f.file + (f.line ? ":" + f.line : "") + " " : ""}${f.why}${f.ctx ? "\n      …" + f.ctx + "…" : ""}`));
  process.exit(1);
}
console.log(`총 소요 ${secs}s → PASS`);
