/* ====================== 협력업체 온톨로지 · 하네스 — 집행과 제출 필드 사전 ======================
   Policy Enforcement — 집행 지점이 없으면 그림이다.
   지시서: docs/partner_gov/협력업체_온톨로지_하네스_내부통제_실행프롬프트_v2.3.md (§7 · §9 · §13-6)
   결정값: docs/partner_gov/P0_결정서_v1.1.md (⑪ 집행 로그 축 — (a) 등재 + 전용 키)

   이 파일이 소유하는 것 8가지
     ① 집행 수준 저장값과 **ratchet 로더** — 저장값은 **올릴 때만** 쓰이고, 배포 테이블보다 낮은
        수준을 지정하면 배포 테이블 값으로 폴백한다(§7-6 ②). 잠금은 등재가 아니라 **코드**다.
     ② 집행 지점(PEP) 4곳 배선 — pep.register · pep.settle · pep.expose · pep.export.
        네 지점이 **한 함수를 지난다**. 자리마다 따로 구현하면 한 곳이 빠지는 순간 샌다.
     ③ 면제 레지스트리 영속화 — 만료일 없는 면제는 등록 자체가 거부되고, 만료 경과는 **자동 차단 복귀**다.
     ④ 집행 레코드 4필드 — 사전 통지 · 소명 접수 기한 · 소명 내용 · 재심. **소명 없이 집행된 건수**를 따로 센다.
     ⑤ 차단 로그 3단계 — 이벤트 이름 등재 · payload 7키 접기 · **전용 저장 키**(공용 링버퍼와 공유하지 않는다).
     ⑥ 결정 로그 — 기존 감사로그와 **같은 스키마** + 행위자 유형 2종(협력업체 주체 · 시스템 판정기) 신설.
     ⑦ PG_FIELDS 제출 필드 사전 60필드 + **받지 않는 것** 명문화 + 자율심의기구 발급물 축.
     ⑧ 반출 산출물 조립 — 머리말 고지가 **데이터 안에** 박힌 표 · 문서 본문. 고지가 없으면 반출이 막힌다.

   이 파일이 소유하지 않는 것
     · 낱말 · 표시명 · 판정 축 → src/data/partnerGov.js (PG_TERMS · PG_AXES · pgDisplayName · PG_NAME_MODE)
     · 조항 · 판정 규칙 · 집행 수준 배포 테이블 · 임계 상수 → src/data/partnerPolicy.js
       (**집행 수준을 조항 본문에 쓰지 않는다** — §15-8. 이 파일은 그 테이블을 읽고 플로어를 통과시킬 뿐이다)
     · 지면 · 수치 정의 · 입력 계약 · 단계 집행 효과 · 클램프 목록 → src/data/partnerReport.js
     · 클램프 함수 구현(pgFieldClamp) → P5a. 여기서는 **잘라낼 목록을 읽어 반출을 막는 데만** 쓴다
     · 화면 · 서브탭 · 추적 지면 → P5a · P5b / 반출 플러밍(클립보드 · 인쇄 · 보호 예외) → P7(§10-6 ①③)
     · 거래 사실(거래처 · 주문 · 정산) → src/data/supplyData.js (읽기 전용 입력)

   ── 왜 네 지점이 같은 함수를 지나는가 ─────────────────────────────────────────────
     막는 것 셋이다. ①조항만 늘고 아무것도 막히지 않는 상태 ②막은 사실이 기록되지 않아 「통제가 돈다」를
     말로만 주장하는 상태 ③감시받는 쪽이 문지기 기준을 조정하는 상태. 세 번째가 ratchet 로더의 이유다.

   ── 집행 지점 상한은 코드 고정이다 ───────────────────────────────────────────────
     정산 보류 · 노출 차단은 거래상 지위 쟁점에 직접 닿으므로 **경고 · 기록 상한**이 코드에 박혀 있다
     (partnerPolicy.js 의 집행 지점 상한 표). 그리고 유인 · 알선 적합성 조항은 대표 확정으로 **조항 단위
     경고 · 기록 고정**이고 정산 산식은 **법률 검토 회신 전까지 동결**이다 — 이 파일은 그 산식을 읽지도
     호출하지도 않는다(아래 pgPepSettle 주석).

   ── 결정론(§11-5) ────────────────────────────────────────────────────────────────
     Math.random 0건 · 벽시계 0건. 기록의 시각축은 **호출자가 넘긴 기준일 문자열**과 순번이다.
     벽시계를 쓰면 같은 입력이 날마다 다른 로그를 만들고, 그러면 러너가 「N건 심고 N건 읽힘」을 단언할 수 없다.

   주의 — 단일 번들(import 없음 · 전역 공유)이다. 전역 이름(PG_* · pg*)을 grep 으로 확인한 뒤 추가했다.
     그리고 **다른 파일의 const 를 이 파일의 최상위에서 평가하지 않는다** — 매니페스트 순서가 앞이어도
     규칙을 함수 안에서만 읽는 것으로 통일해 TDZ 사고를 구조적으로 피한다(P1 에서 번들이 통째로 죽은 유형). */

const PG_ENFORCE_VER = "P4-1.0.0";

/* ══════════════ 저장 키 — 전부 dataCatalog.js 에 등재돼 있다 ══════════════
   미등재 키는 커밋이 막힌다(scripts/check_data_catalog.py). 다섯 키의 성격:
     집행 수준 저장값 · 면제 레지스트리 · 시정 과제 상태 · **집행 차단 로그 전용** · 발행 보고서 스냅샷(접두).
   ★ 차단 로그를 전용 키로 두는 이유 — 공용 이벤트 저장은 500건 링버퍼다. 회원 퍼널 이벤트가 몰리면
     차단 기록이 조용히 밀려 나가고, 그러면 「보고서 차단 건수 = 로그 건수」가 **데이터 유실로 깨진다**. */
const PG_ENFORCE_KEY = "hifin_pg_enforce";
const PG_EXEMPT_KEY = "hifin_pg_exempt";
const PG_REMEDY_KEY = "hifin_pg_remedy";
const PG_BLOCK_KEY = "hifin_pg_block";
const PG_REPORT_PREFIX = "hifin_pg_report_";
const PG_BLOCK_CAP = 2000;   /* 전용 링버퍼 — 공용 500건과 **공유하지 않는다** */

function _pgRead(k) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v; } catch (e) { return null; } }
function _pgWrite(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function _pgAsOf(ctx) { const c = ctx || {}; return c.asOf || (typeof PG_ASOF !== "undefined" ? PG_ASOF : "2026-10-25"); }
function _pgRank() { return (typeof PG_LEVEL_RANK !== "undefined") ? PG_LEVEL_RANK : { advisory: 1, soft: 2, hard: 3 }; }

/* ══════════════ ① 집행 수준 저장값 — ratchet 로더 ══════════════
   §7-6 ②가 요구하는 것은 「등재」가 아니라 **코드**다. 저장값 주입으로 집행 수준이 내려가면
   감시받는 쪽이 문지기 기준을 조정한 것이고, 그 순간 이 서브섹션은 통제가 아니라 장식이 된다.

   세 갈래로만 끝난다.
     applied  저장값이 배포 테이블보다 **높고** 승격 플로어를 통과했다 → 적용
     fallback 저장값이 배포 테이블보다 **낮다** → 무시하고 배포 테이블 값을 쓴다(ratchet)
     refused  더 높지만 플로어가 막았다(계약 조항 근거 미기재 · 근거 법령 미확인 · 지점 상한 · 조항 잠금)
   ⚠ 로더는 승격을 **직접 쓰지 않는다** — 반드시 배포 테이블의 전환 함수를 지난다. 직접 쓰면 플로어를
     우회하는 두 번째 경로가 생기고, 그 경로는 어떤 단언에도 걸리지 않는다. */
function pgEnforceStored() {
  const v = _pgRead(PG_ENFORCE_KEY);
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}
function pgEnforceStore(table) {
  return _pgWrite(PG_ENFORCE_KEY, (table && typeof table === "object") ? table : {});
}
function pgEnforceLoad(who) {
  const out = { applied: [], fallback: [], refused: [], hashBefore: null, hashAfter: null };
  if (typeof PG_ENFORCE === "undefined" || typeof pgEnforceSet !== "function") return out;
  const RANK = _pgRank();
  const peps = (typeof PG_PEPS !== "undefined") ? PG_PEPS : [];
  out.hashBefore = (typeof pgPolicyHash === "function") ? pgPolicyHash() : null;
  const stored = pgEnforceStored();
  for (const pid of Object.keys(stored)) {
    const row = stored[pid] || {};
    for (const pep of Object.keys(row)) {
      const want = row[pep];
      const tag = pid + "/" + pep + "=" + String(want);
      if (peps.indexOf(pep) < 0 || !RANK[want]) { out.refused.push(tag + " (등재되지 않은 지점 · 수준)"); continue; }
      const cur = (PG_ENFORCE[pid] || {})[pep] || "advisory";
      if (RANK[want] <= RANK[cur]) { out.fallback.push(tag + " → 배포 테이블 " + cur); continue; }
      const r = pgEnforceSet(pid, pep, want, who || "pgEnforceLoad");
      if (r && r.ok) out.applied.push(tag);
      else out.refused.push(tag + " (" + ((r && r.reason) || "거부") + ")");
    }
  }
  out.hashAfter = (typeof pgPolicyHash === "function") ? pgPolicyHash() : null;
  /* 해시가 바뀌었다면 배포 테이블이 저장값으로 **실제로 달라진** 것이다. 그 사실을 숨기지 않는다 —
     스냅샷의 정책 해시는 배포 시점 값이고, 드리프트가 있으면 재현 증명이 그만큼 약해진다. */
  out.drift = out.hashBefore !== out.hashAfter;
  return out;
}

/* ══════════════ ② 집행 지점(PEP) 4곳 ══════════════
   자리와 「무엇을 막는가」를 표로 선언한다. 화면 배선(버튼 · 모달 · 서브탭)의 소유자는 P5a · P5b 이고,
   이 파일은 **그 화면들이 반드시 지나야 하는 함수**를 둔다. 화면이 자기 판단으로 막으면 집행이 흩어진다. */
const PG_PEP_SITES = [
  { pep: "pep.register", ko: "신규 협력업체 등록 · 갱신", blocks: "자격 미충족 등록",
    fn: "pgPepRegister", cap: "soft", consumer: "P5a 온보딩 지면" },
  { pep: "pep.settle", ko: "정산 승인 · 대금 지급", blocks: "위반 등급 시 대금 보류",
    fn: "pgPepSettle", cap: "advisory", consumer: "P5a 정산 지면 · settle 에이전트 가드(P6)",
    note: "경고 · 기록 상한이 코드 고정이다. 유인 · 알선 조항은 조항 단위 고정이고 정산 산식은 동결이다" },
  { pep: "pep.expose", ko: "제품 · 서비스 노출(추천 · 상담 경로)", blocks: "심의 미확인 품목 · 미완료 회수 품목",
    fn: "pgPepExpose", cap: "advisory", consumer: "P5a 품목 지면 · 커머스 경로(사정권 밖 확인 필요)" },
  { pep: "pep.export", ko: "보고서 반출", blocks: "고지 없는 반출 · 열람 등급 클램프 밖 필드 노출",
    fn: "pgPepExport", cap: "hard", consumer: "P7 반출 플러밍(클립보드 · 인쇄)",
    note: "네 지점 중 유일하게 면제 불가 차단이 가능하다 — 막는 대상이 남의 거래가 아니라 **우리 자신의 반출**이다" },
];

/* 반출 집행 규약 — **조항이 아니다.** 근거가 법령이 아니라 당사 규약이고 판정 대상이 우리 산출물이므로
   조항 레지스트리에 세우지 않는다(세우면 유형 해당성 · 근거 법령 · 시정 과제가 없는 조항이 생긴다).
   그래서 집행 수준도 조항 테이블이 아니라 **이 배포 테이블**이 갖는다.
   ★ §7-7 의 승격 플로어(계약 조항 근거 · 근거 법령 확인 등급)를 적용하지 않는다. 플로어는
     「확인하지 못한 법으로 **남의** 거래를 끊지 않는다」를 위한 것이고, 이 지점이 막는 것은
     우리가 밖으로 내보내는 문서다 — 플로어를 적용하면 보호 장치가 보호 대상을 막는다. */
const PG_EXPORT_RULE = "PG-EXPORT";
const PG_EXPORT_ENFORCE = { "PG-EXPORT": { "pep.export": "hard" } };

/* 단계 × 원인의 집행 효과는 지면 계약이 소유한다. 여기서 다시 정하지 않고 **그 해석기를 재사용**한다 —
   두 번째 해석기를 만들면 같은 원인이 두 효과를 갖는다. */
function _pgEffect(cause, stage, grace) {
  if (typeof _pgStageEffect === "function") return _pgStageEffect(cause, stage, !!grace);
  return null;
}

/* 한 조항이 **이 지점에서** 막히는가. 두 조건이 함께 성립할 때만 막는다.
     ⓐ 원인의 집행 효과가 「차단」이다(법령 미확인 · 해당 없음 · 시행 전 · 판정기 오류는 차단이 아니다)
     ⓑ 플로어를 통과한 실효 집행 수준이 경고 · 기록보다 높다
   그리고 유효한 면제가 있으면 막지 않는다 — 면제 사실이 로그에 남아 부인방지가 성립한다. */
function pgPepDecide(policyId, rec, ctx, pep) {
  const c = ctx || {};
  const asOf = _pgAsOf(c);
  const stage = c.stage || "거래중";
  const kind = c.kind || (rec && rec.kind) || null;
  const r = pgDecide(policyId, rec, { kind: kind, stage: stage, asOf: asOf });
  const lv = pgEnforceLevel(policyId, pep, { kind: kind, cause: r.cause, stage: stage });
  const grace = !!(r.ruleRef && r.ruleRef.enforcementGrace);
  const eff = _pgEffect(r.cause, stage, grace);
  const ex = (typeof pgExemptFor === "function") ? pgExemptFor(policyId, rec && rec.partnerId, asOf) : null;
  const wouldBlock = !!(eff && eff.block === true) && lv.level !== "advisory";
  return {
    policyId: policyId, pep: pep, decision: r.decision, cause: r.cause,
    level: lv.level, declared: lv.declared, cap: lv.cap, floors: lv.floors,
    stage: stage, render: eff ? eff.render : null, grace: grace,
    exemption: ex, block: wouldBlock && !ex,
    exempted: wouldBlock && !!ex,
    remedy: (r.remedy || []).length,
  };
}

/* 네 지점이 지나는 **한 함수**. 지점마다 조항 집합이 다를 이유가 없다 — 같은 조항 전수를 보고
   그 지점의 상한과 원인 효과가 결과를 가른다. 그래야 「어느 지점에서 무엇이 막혔나」가 한 표로 읽힌다. */
function _pgPep(pep, rec, ctx) {
  const c = ctx || {};
  const out = { pep: pep, allow: true, blocks: [], exempted: [], advisories: [], rows: [],
    stage: c.stage || "거래중", asOf: _pgAsOf(c), level: null };
  if (typeof PG_POLICIES === "undefined" || typeof pgDecide !== "function") return out;
  for (const p of PG_POLICIES) {
    const d = pgPepDecide(p.id, rec, c, pep);
    out.rows.push(d);
    if (d.block) out.blocks.push(d);
    else if (d.exempted) out.exempted.push(d);
    else if (d.decision === "DENY" || d.cause === "input_missing" || d.cause === "law_unverified") out.advisories.push(d);
  }
  out.allow = out.blocks.length === 0;
  /* 차단은 로그로 증명한다 — 기록되지 않는 차단은 차단이 아니다 */
  for (const b of out.blocks) pgBlockLog({ policyId: b.policyId, pep: pep, cause: b.cause, partner: rec, ctx: c, level: b.level });
  /* 면제 통과도 같은 등급으로 증명한다 — 그 사실이 로그에 남아야 soft 의 정의가 성립한다(§7-2) */
  for (const x of out.exempted) pgExemptPassLog({ policyId: x.policyId, pep: pep, cause: x.cause, partner: rec, ctx: c, level: x.level });
  return out;
}

function pgPepRegister(rec, ctx) { return _pgPep("pep.register", rec, ctx); }

/* 정산 승인 · 대금 지급.
   ★ 이 함수는 escrowPay 를 호출하지 않고 정산 산식을 읽지도 않는다. 유인 · 알선 적합성 조항의
     판정 대상은 협력업체가 아니라 **우리 구조**이고, 판정이 불허로 떨어졌을 때 올바른 시정 과제는
     「차단」이 아니라 「구조 변경 과제」다. 구조 변경은 법률 검토 회신 뒤에 설계된다 —
     회신 없이 산식을 건드리면 ①이미 작동 중인 정산 흐름을 근거 없이 끊고 ②거래상 지위 쟁점에
     확인되지 않은 법령으로 들어간다. 「확인하지 못한 법으로 거래를 끊지 않는다」를 우리 자신에게
     적용한 것이다. 산식 동결의 단언 소유자는 scripts/fin_site_check.mjs 다(새 러너에 중복 배치하면
     검사 소유자가 이원화되고 금지가 **검출되지 않는 금지**로 남는다).
   경고 · 기록이 아무것도 안 한다는 뜻은 아니다 — 판정이 보고서에 뜨고 시정 과제가 소유자 · 기한과
     함께 등록된다. **막지 않는 것과 보이지 않는 것은 다르다.** */
function pgPepSettle(rec, ctx) { return _pgPep("pep.settle", rec, ctx); }

function pgPepExpose(rec, ctx) { return _pgPep("pep.expose", rec, ctx); }

/* ══════════════ ⑧ 반출 산출물 — 고지가 데이터 안에 박힌다 ══════════════
   반출물은 화면을 떠나 혼자 돌아다니므로 고지가 **데이터 안에** 있어야 한다. 렌더만 막으면 새어 나간다.
   ⚠ 이 함수는 **산출물 문자열까지만** 만든다. 클립보드 재작성 · 보호 예외 등록 · 인쇄 창 워터마크는
     P7 의 몫이다(§10-6 ①③). 다만 그 플러밍이 집어 가는 **본문**이 여기서 조립되므로,
     「부분 선택에도 고지가 따라간다」가 성립할 수 있는 형태(머리말 4줄 + 행마다 표시명 한 칸)로 만든다. */
const PG_EXPORT_COLS = [
  /* ★ 「판정 대상」이 **첫 열**이다(2026-10-26 신설). 이 열이 없던 동안 반출물은 ⓠ당사 조항의 불허를
     실명 법인의 식별자 · 표시명과 같은 행에 실어 내보냈다 — 실측: `V0001  한국암웨이(…)  PT-COM
     L-10  DENY  rule_violation` 3,132행. 같은 보고서가 B2 에서는 「당사 축은 조항 1건으로 센다」고
     적고 AI3 에서는 「두 축을 섞어 세지 않는다 — 섞으면 당사 책임 조항이 협력업체 결함으로 읽힌다」고
     선언하는데, 반출물에는 축 구분이 없어 **지면의 완화 장치(hover · 추적 레인 2)가 파일에서 사라졌다.**
     §15-1 이 최대 리스크로 지목한 「실명 법인에 대한 불이익 사실을 전문 감사 보고서 형식으로 적은
     문서」가 바로 이 경로였다. 그래서 ⓠ 행은 식별자 · 표시명 칸을 **당사**로 적는다(아래 pgExportRow). */
  { k: "axis", ko: "판정 대상", why: "ⓘ협력업체 / ⓠ당사 — 두 축을 한 분모로 읽지 못하게 한다" },
  { k: "partnerId", ko: "식별자", why: "안정 식별자 — 모드와 무관하게 나간다. ⓠ 행은 「당사」다" },
  { k: "dispName", ko: "표시명", why: "표시명 **한 칸만**. 실상호 원 필드는 싣지 않는다. ⓠ 행은 「당사」다" },
  { k: "kind", ko: "유형", why: "" },
  { k: "policyId", ko: "조항", why: "" },
  { k: "decision", ko: "결정", why: "" },
  { k: "cause", ko: "원인", why: "" },
  { k: "level", ko: "집행 수준", why: "" },
  { k: "stage", ko: "단계", why: "" },
];

/* 한 행 — 판정기 반환값과 표시명 함수에서만 만든다. 화면이 자체 문장을 만들지 않는다.
   표시명은 모드 스위치 하나를 지나므로, 코드 표기로 내려가면 이 행에서 상호가 **구조적으로** 사라진다. */
function pgExportRow(rec, d) {
  const name = (typeof pgDisplayName === "function") ? pgDisplayName(rec) : "";
  const red = (typeof pgRedactNames === "function") ? pgRedactNames : (function (t) { return t; });
  /* ★ ⓠ당사 조항 행은 **식별자와 표시명을 당사로 적는다.** 수범자가 우리인 조문의 판정을 실명 법인의
     식별자 옆에 싣지 않는다 — 그 행이 파일로 나가면 완화 장치(hover · 추적 레인)가 따라가지 않는다.
     축 값은 호출자가 넘기지 않고 **조항 레지스트리**에서 읽는다(지면이 축을 결정하면 두 곳이 갈린다). */
  const subj = (function () {
    try { if (typeof pgPolicy === "function") { const p = pgPolicy(d.policyId); if (p && p.subject) return p.subject; } } catch (e) {}
    return d.subject || "협력업체";
  })();
  const isSelf = subj === "당사";
  return {
    axis: isSelf ? "ⓠ당사" : "ⓘ협력업체",
    partnerId: isSelf ? "당사" : ((rec && rec.partnerId) || ""),
    dispName: isSelf ? "당사" : red(name),
    kind: isSelf ? "—" : ((rec && rec.kind) || ""),
    policyId: d.policyId, decision: d.decision, cause: d.cause || "",
    level: d.level, stage: d.stage,
  };
}

/* 산출물 조립 — 머리말 4줄은 지면 계약의 조립 함수가 유일한 경로다(문안을 여기 다시 적지 않는다). */
function pgExportBuild(rows, meta, kind) {
  const m = meta || {};
  const head = (typeof pgExportHead === "function")
    ? pgExportHead(m, kind === "doc" ? "doc" : "tsv")
    : { lines: [], noticeRequired: true };
  const cols = PG_EXPORT_COLS.map((c) => c.ko);
  const body = [];
  for (const r of (rows || [])) body.push(PG_EXPORT_COLS.map((c) => String(r[c.k] == null ? "" : r[c.k])).join("\t"));
  const lines = head.lines.slice();
  const text = lines.join("\n") + "\n" + cols.join("\t") + "\n" + body.join("\n") + "\n";
  return { kind: kind === "doc" ? "doc" : "tsv", head: lines, cols: cols, body: body, text: text,
    noticeRequired: head.noticeRequired, n: (rows || []).length };
}

/* 반출 집행 — 네 가지를 본다. 하나라도 걸리면 **면제 불가**로 막는다.
     ⓐ 고지 — 실명 표기에서 머리말 고지가 없거나 네 줄 중 빈 줄이 있으면 막는다. 실상호에 판정 등급이
        붙은 문서가 고지 없이 나가면 명예 · 신용 문제가 된다.
     ⓑ 클램프 — 열람 등급에서 잘라내야 하는 필드가 산출물에 있으면 막는다. 목록은 출처 등급 표에서
        **파생**한 하나뿐이다(목록을 두 곳에 두면 한쪽만 고쳐지는 순간 샌다).
     ⓒ 상호 원 필드 — 표시명 한 칸 외에 실상호 · 거래처명 원 필드가 실리면 막는다.
     ⓓ 복사 보호 전제 — 실명 표기는 복사 차단 설정을 전제한다. 전제가 깨진 상태의 실명 반출은
        허용하지 않는다(보호 설정은 저장값에서 오고 콘솔이 끌 수 있다). */
function pgExportGate(built, ctx) {
  const c = ctx || {};
  const level = c.level || "L1";
  const bad = [];
  /* ★ 고지 필수 여부는 **모드 스위치 한 곳**에서 읽는다. 넘겨받은 산출물 객체의 필드를 믿으면
     호출자가 noticeRequired 를 false 로 적어 보내 고지 검사를 통째로 건너뛸 수 있다 —
     집행이 호출자의 선언을 따르는 순간 그것은 집행이 아니다. */
  const required = (typeof pgExportNoticeRequired === "function") ? pgExportNoticeRequired() : true;
  const lines = (built && built.head) || [];
  const notice = (c.kind === "doc" || (built && built.kind === "doc"))
    ? (typeof PG_EXPORT_NOTICE_DOC !== "undefined" ? PG_EXPORT_NOTICE_DOC : "")
    : (typeof PG_EXPORT_NOTICE_TSV !== "undefined" ? PG_EXPORT_NOTICE_TSV : "");
  if (lines.length !== 4) bad.push({ why: "머리말이 4줄이 아니다", k: "head" });
  for (let i = 0; i < lines.length; i++) if (!String(lines[i] || "").trim()) bad.push({ why: "머리말 " + (i + 1) + "번째 줄이 비었다", k: "head" });
  if (required && notice && lines.indexOf(notice) < 0) bad.push({ why: "실명 표기인데 반출물 머리말 고지가 없다", k: "notice" });
  const drop = (typeof pgClampDrop === "function") ? pgClampDrop(level) : [];
  const dropBase = drop.map((x) => String(x).split(".").pop());
  for (const col of PG_EXPORT_COLS) if (dropBase.indexOf(col.k) >= 0) bad.push({ why: "열람 등급 " + level + " 에서 잘라내야 하는 필드가 산출물에 있다 — " + col.k, k: "clamp" });
  for (const col of PG_EXPORT_COLS) if (/^(legalName|vendorName|name)$/.test(col.k)) bad.push({ why: "반출물에 상호 원 필드가 실렸다 — 표시명 한 칸만 나간다", k: "name" });
  if (required) {
    let noCopy = true;
    try { if (typeof guardCfg === "function") noCopy = !!guardCfg().noCopy; } catch (e) { noCopy = true; }
    if (!noCopy) bad.push({ why: "실명 표기는 복사 차단 설정을 전제한다 — 전제가 깨진 상태의 실명 반출은 허용하지 않는다", k: "guard" });
  }
  return bad;
}
function pgPepExport(built, ctx) {
  const c = ctx || {};
  const RANK = _pgRank();
  const cap = (typeof PG_ENFORCE_CAP !== "undefined") ? (PG_ENFORCE_CAP["pep.export"] || "hard") : "hard";
  /* ★ 수준을 **묻는 함수는 하나**다. 여기서 표를 직접 읽으면 「이 지점의 집행 수준」에 답하는 자리가
     둘이 되고, P5a · P7 이 pgEnforceLevel 에 물었을 때 다른 답을 받는다(실측으로 advisory 를 받았다).
     pgEnforceLevel 이 pep.export 일 때 이 배포 테이블을 읽으므로 그 함수에 묻는다. */
  let lv = cap;
  if (typeof pgEnforceLevel === "function") {
    const q = pgEnforceLevel(PG_EXPORT_RULE, "pep.export", {});
    lv = (q && q.level) || "advisory";
  } else {
    lv = (PG_EXPORT_ENFORCE[PG_EXPORT_RULE] || {})["pep.export"] || "advisory";
  }
  if (RANK[lv] > RANK[cap]) lv = cap;
  const bad = pgExportGate(built, c);
  const out = { pep: "pep.export", allow: bad.length === 0 || lv === "advisory", level: lv, cap: cap,
    blocks: [], reasons: bad.map((b) => b.why), rule: PG_EXPORT_RULE };
  if (bad.length && lv !== "advisory") {
    out.allow = false;
    for (const b of bad) out.blocks.push({ policyId: PG_EXPORT_RULE, pep: "pep.export", cause: "rule_violation", level: lv, why: b.why });
    /* ★ 로그는 **반출 시도 1건에 1행**이다. 사유마다 한 행을 남기면 접힌 payload 가 똑같은 행이
       여러 개 생기고(사유 문장은 싣지 않으므로 구별되지 않는다) 「차단 건수 = 로그 건수」가
       사유 수만큼 부풀어 오른다. 막힌 것은 반출 한 건이고 사유는 그 한 건의 내용이다. */
    pgBlockLog({ policyId: PG_EXPORT_RULE, pep: "pep.export", cause: "rule_violation", partner: c.partner || null, ctx: c, level: lv });
  }
  return out;
}
/* 조립 + 집행을 한 번에 — 화면이 조립만 하고 집행을 잊는 경로를 만들지 않는다. */
function pgExportEmit(rows, meta, kind, ctx) {
  const built = pgExportBuild(rows, meta, kind);
  const gate = pgPepExport(built, Object.assign({ kind: kind }, ctx || {}));
  return { ok: gate.allow, gate: gate, out: gate.allow ? built : null, n: built.n };
}

/* ══════════════ ⑧-2 반출 플러밍 — 산출물이 화면을 떠나는 **마지막 한 걸음** (P7 · §10-6 ①②③) ══════════════
   P4 는 산출물 문자열까지 만들었고 그 위에 집행을 걸었다. 그래도 **밖으로 나가지는 않았다** —
   보호 기본값(noCopy)이 복사를 전부 막고, 인쇄 창은 보호 리스너 밖이고, 반출 사실이 기록되지 않았다.
   이 절이 그 셋을 닫는다. 지키는 것 넷 —
     ⓐ **부분 선택에도 고지가 따라간다.** 선례(.hmoex)는 선택 범위를 보지 않아서 표 행만 드래그하면
        첫 줄 고지 없이 나갔다. 그래서 복사 핸들러가 기본 복사를 막고 **클립보드를 다시 쓴다**.
        그 문자열을 만드는 자리는 **여기 하나**다 — 보호 유틸이 문안을 조립하면 고지의 원천이 둘이 된다.
     ⓑ **인쇄 창은 보호 밖이다.** `window.open` + `document.write` 로 띄운 창은 `applyGuard` 의 리스너와
        `#guardwm` 워터마크를 **따라가지 않는다**. 그래서 같은 스탬프를 인쇄 HTML 에 **직접 인라인**하고,
        열람 기록은 **원 창에서** 남긴다(새 창에서 남기면 저장소가 달라 기록이 어디에도 안 남는다).
     ⓒ **반출 1건에 로그 1행.** 사건 이름은 아래 표가 소유한다 — 러너가 그 표를 읽고 센다.
     ⓓ **집행을 건너뛰는 경로를 만들지 않는다.** 산출물을 만드는 함수가 곧 집행을 부른다.
   ⚠ 이 절은 정산 산식을 읽지도 호출하지도 않는다(§15-10 동결 — 단언 15-e 가 이 파일을 정적으로 본다). */

/* 반출 경로별 열람 기록 사건 이름 — 보호 유틸의 사건 축(view/export/print/devtool/printscreen)을 쓴다.
   새 사건 이름을 만들지 않는다: 접속 로그 통계(guardStats)가 세는 축이 그 다섯이고,
   여기서 이름을 새로 만들면 「반출 건수」가 통계의 어느 칸에도 들어가지 않는다. */
const PG_EXPORT_LOGEV = { tsv: "export", doc: "print", clip: "export" };

/* 클립보드 산출물 — **고지 한 줄이 선택 범위 앞에 붙는다.**
   ★ 판정은 「첫 줄이 고지인가」가 아니라 **「선택 안에 고지가 있는가」**다. 첫 줄 기준으로 하면
     전체 선택(첫 줄이 머리말 1번 「데이터 성격」)에도 고지가 덧붙어 **산출물에 고지가 두 번**
     들어간다(실측으로 그랬다). 그러면 「고지가 몇 번 들어갔나」가 전체 선택과 부분 선택에서
     다른 값이 되고, 애블레이션이 세는 대상이 흔들린다. 포함 기준이면 **두 경우 모두 정확히 1회**다. */
function pgExportClip(sel, kind) {
  const which = kind === "doc" ? "doc" : "tsv";
  const notice = (typeof pgExportNotice === "function") ? pgExportNotice(which) : "";
  const s = String(sel == null ? "" : sel);
  if (notice && s.indexOf(notice) >= 0) return { text: s, added: false, notice: notice, kind: which, times: 1 };
  const text = (notice ? notice + "\n" : "") + s;
  return { text: text, added: !!notice, notice: notice, kind: which,
    times: notice ? text.split(notice).length - 1 : 0 };
}

/* 워터마크 스탬프 — 보호 유틸이 화면 워터마크에 쓰는 **그 함수**를 부른다.
   여기서 열람자 · 날짜 · 세션을 다시 조립하면 화면 워터마크와 인쇄물 워터마크가 다른 말을 한다. */
function pgExportStamp() {
  try { if (typeof guardStamp === "function") return guardStamp(); } catch (e) {}
  return "";
}

const _PG_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
function _pgEsc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => _PG_ESC[c]); }

/* 인쇄 HTML — 머리말 고지 4줄이 **문서 첫머리**에 오고, 워터마크가 지면에 깔린다.
   표 본문은 조립 함수가 만든 산출물(built)에서만 온다 — 여기서 행을 다시 만들지 않는다. */
function pgExportDocHtml(built, stamp) {
  const b = built || { head: [], cols: [], body: [] };
  const wm = (typeof guardWmUrl === "function") ? guardWmUrl(stamp || "") : "";
  const head = (b.head || []).map((ln) => '<p class="pgnote">' + _pgEsc(ln) + "</p>").join("");
  const th = (b.cols || []).map((c) => "<th>" + _pgEsc(c) + "</th>").join("");
  const tr = (b.body || []).map((ln) => "<tr>" + String(ln).split("\t").map((v) => "<td>" + _pgEsc(v) + "</td>").join("") + "</tr>").join("");
  return "<!doctype html><html lang=\"ko\"><head><meta charset=\"utf-8\"><title>"
    + _pgEsc((typeof PG_SECTION_KO !== "undefined" ? PG_SECTION_KO : "협력업체") + " — 내부통제 보고서")
    + "</title><style>"
    + "body{font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;font-size:11px;color:#1F2937;margin:18px;"
    + (wm ? "background-image:url(\"" + wm + "\");background-repeat:repeat;" : "") + "}"
    + ".pgnote{font-size:10.5px;color:#334155;line-height:1.6;margin:0 0 4px;font-weight:700}"
    + ".pgstamp{font-size:9.5px;color:#64748B;margin:8px 0 10px}"
    + "table{border-collapse:collapse;width:100%}th,td{border:1px solid #CBD5E1;padding:3px 5px;text-align:left;font-size:10px}"
    + "th{background:#F1F5F9}@media print{body{margin:10px}}"
    + "</style></head><body>" + head
    + '<p class="pgstamp">' + _pgEsc(stamp || "") + "</p>"
    + "<table><thead><tr>" + th + "</tr></thead><tbody>" + tr + "</tbody></table></body></html>";
}

/* 열람 기록 — 반출 1건에 1행. 보호 유틸이 기록을 소유하므로 여기서 저장하지 않는다. */
function pgExportLog(kind, built) {
  const ev = PG_EXPORT_LOGEV[kind] || "export";
  const where = (typeof location !== "undefined" ? (location.hash || "/") : "/")
    + " · 협력업체 내부통제 보고서 " + (kind === "doc" ? "문서" : "표") + " " + ((built && built.n) || 0) + "행";
  let wrote = 0;
  try { if (typeof guardLog === "function") { guardLog(ev, where); wrote = 1; } } catch (e) { wrote = 0; }
  return { ev: ev, where: where, wrote: wrote };
}

/* 표(TSV) 반출 — 집행을 지나고, 통과하면 **그 자리에서** 기록을 남긴다.
   막히면 기록하지 않는다 — 막힌 사실은 차단 로그가 이미 들고 있고, 두 로그에 같은 사건을 적으면
   「반출 건수」와 「차단 건수」가 서로를 센다. */
function pgExportTsv(rows, meta, ctx) {
  const cls = (typeof pgExportClass === "function") ? pgExportClass() : null;
  const r = pgExportEmit(rows, meta, "tsv", ctx);
  if (!r.ok) return Object.assign({}, r, { log: null, cls: cls });
  return Object.assign({}, r, { log: pgExportLog("tsv", r.out), cls: cls });
}

/* 문서(인쇄) 반출 — ⓐ집행 ⓑ고지·워터마크를 인쇄 HTML 에 직접 심기 ⓒ인쇄 **직전** 원 창에 기록.
   창을 여는 것은 사람이 누른 뒤의 일이므로, 조립과 창 열기를 **가른다**(렌더가 창을 열지 않게). */
function pgExportDoc(rows, meta, ctx) {
  const r = pgExportEmit(rows, meta, "doc", ctx);
  if (!r.ok) return Object.assign({}, r, { html: null, stamp: "", log: null });
  const stamp = pgExportStamp();
  return Object.assign({}, r, { html: pgExportDocHtml(r.out, stamp), stamp: stamp, log: null,
    outside: "인쇄 창은 보호 리스너와 화면 워터마크 밖입니다 — 고지 · 워터마크 · 열람 기록을 이 산출물에 직접 심습니다" });
}
function pgExportDocOpen(plan) {
  if (!plan || !plan.ok || !plan.html) return { opened: false, log: null, why: "집행에서 막힌 산출물은 열지 않는다" };
  /* ★ 기록은 **원 창에서** 인쇄 호출보다 먼저 남긴다 — 새 창은 저장소가 달라 그쪽에서 적으면 사라진다. */
  const log = pgExportLog("doc", plan.out);
  let w = null;
  try { w = (typeof window !== "undefined" && window.open) ? window.open("", "_blank", "width=820,height=1000") : null; } catch (e) { w = null; }
  if (!w) return { opened: false, log: log, why: "팝업이 차단되었습니다 — 팝업을 허용한 뒤 다시 시도하세요" };
  try { w.document.write(plan.html); w.document.close(); } catch (e) { return { opened: false, log: log, why: "인쇄 창에 쓰지 못했습니다" }; }
  try { setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350); } catch (e) {}
  return { opened: true, log: log, why: null };
}

/* ══════════════ ③ 면제 레지스트리 영속화 ══════════════
   만료일 없는 면제는 **등록 자체를 거부**한다(검증 소유자는 정책 파일의 등록 함수다 — 여기서 다시
   검증하면 규칙이 두 곳에 산다). 이 파일이 더하는 것은 영속화와 **만료 경과 시 자동 차단 복귀**뿐이다.
   산업 표준에도 override 만료 규정이 없으므로 우리가 만든다 — 설계 단계에서 빠뜨리면 나중에 추가해도
   이미 등록된 면제가 영구히 남는다. */
function pgExemptStored() { const v = _pgRead(PG_EXEMPT_KEY); return Array.isArray(v) ? v : []; }
function pgExemptRegister(e, who, ctx) {
  const sink = [];
  if (typeof pgExemptAdd !== "function") return { ok: false, reason: "등록 함수가 없다" };
  const r = pgExemptAdd(e, sink);
  if (!r.ok) return r;
  const list = pgExemptStored();
  list.push({ policyId: e.policyId, partnerId: e.partnerId, reason: e.reason,
    approver: e.approver, approvedAt: e.approvedAt || _pgAsOf(ctx), expireAt: e.expireAt });
  _pgWrite(PG_EXEMPT_KEY, list);
  pgAuditAppend({ actor: who || e.approver, action: "면제 등록", target: e.partnerId,
    result: "성공", risk: "중간", ctx: ctx });
  return { ok: true, n: list.length };
}
/* 적재 — 만료 경과분은 **되살리지 않는다**. 그것이 「자동 차단 복귀」의 실체다.
   ★ 집행 수준 로더(pgEnforceLoad)와 **같은 모양**으로 돌려준다 — `{loaded, expired, rejected, drift}`.
     왜: 저장값 면제 1건이 `enforce.exemption` 을 null 에서 값으로 돌리고 soft 수준에서 차단을
     `block:true` → `block:false, exempted:true` 로 **뒤집는데**, 종전에는 정책 해시도 드리프트 신호도
     움직이지 않았다(실측: 해시 전후 동일 · drift 필드 자체가 없었다). 집행 수준 축은 ratchet +
     배포 테이블 폴백 + 해시 드리프트로 세 겹인데 면제 축만 신호가 0이면, §7-6 의 「감시받는 쪽이
     문지기 기준을 조정하는 구조를 막는다」가 **한 축에만** 걸려 있는 것이다.
   ★ 적재 건마다 감사 로그를 남긴다 — 「저장값에서 온 면제」와 「승인 절차를 지난 면제」가
     로그에서 구분되게 `via` 를 적는다(§7-8 「면제 등록 요청(승인 경유)」). */
function pgExemptLoad(ctx) {
  const asOf = _pgAsOf(ctx);
  const out = { loaded: 0, expired: 0, rejected: 0, hashBefore: null, hashAfter: null, drift: false };
  if (typeof pgExemptAdd !== "function") return out;
  out.hashBefore = (typeof pgPolicyHash === "function") ? pgPolicyHash() : null;
  for (const x of pgExemptStored()) {
    if (!x || !x.expireAt) { out.rejected++; continue; }
    if (String(x.expireAt) < String(asOf)) { out.expired++; continue; }
    const r = pgExemptAdd(x, []);
    if (r.ok) {
      out.loaded++;
      pgAuditAppend({ actor: x.approver, action: "면제 등록", target: x.partnerId,
        result: "성공", risk: "중간", via: "저장값 적재", ctx: ctx });
    } else out.rejected++;
  }
  out.hashAfter = (typeof pgPolicyHash === "function") ? pgPolicyHash() : null;
  out.drift = out.hashBefore !== out.hashAfter;
  return out;
}

/* ══════════════ ④ 집행 레코드 4필드 ══════════════
   통제 등급으로 대금을 보류하고 노출을 차단하는 것은 거래상 지위 쟁점에 직접 닿는다. 그래서 집행에는
   **사전 통지 · 소명 기회 · 재심**이 있어야 하고, 없으면 다투어졌을 때 방어되지 않는다.
   ★ 「소명 없이 집행된 건수」를 보고서에 **별도 집계**한다 — 0으로 보이게 만드는 것이 아니라 보이게 한다. */
const PG_ACTION_FIELDS = [
  { k: "noticeAt", ko: "사전 통지일", req: true, why: "통지 없는 집행은 절차가 아니다" },
  { k: "defenseDue", ko: "소명 접수 기한", req: true, why: "기한만 있고 소명할 곳이 없으면 모순이다 — 기한의 소유자는 조정 가능 설정이다" },
  { k: "defenseText", ko: "소명 내용", req: false, why: "비어 있을 수 있다. 비면 **소명 없이 집행된 건**으로 센다" },
  { k: "reviewResult", ko: "재심 결과", req: false, why: "비어 있을 수 있다. 재심 전 상태가 사실이다" },
];
function pgActionRecord(a, ctx) {
  const r = a || {};
  const bad = [];
  if (!r.policyId) bad.push("조항 없음");
  if (!r.partnerId) bad.push("대상 식별자 없음");
  if (!r.pep) bad.push("집행 지점 없음");
  for (const f of PG_ACTION_FIELDS) {
    if (!(f.k in r)) bad.push(f.ko + " 필드 자체가 없다");
    else if (f.req && !r[f.k]) bad.push(f.ko + " 비어 있음");
  }
  if (bad.length) return { ok: false, reason: bad.join(" / ") };
  const row = { policyId: r.policyId, partnerId: r.partnerId, pep: r.pep, level: r.level || "advisory",
    at: _pgAsOf(ctx), status: r.status || "진행" };
  for (const f of PG_ACTION_FIELDS) row[f.k] = r[f.k] || null;
  row.noDefense = !row.defenseText;
  return { ok: true, row: row };
}
/* 시정 과제 · 집행 레코드 상태 — 같은 키를 쓴다. 과제와 그 과제가 생긴 집행 사실은 한 묶음이다. */
function pgRemedyStored() { const v = _pgRead(PG_REMEDY_KEY); return Array.isArray(v) ? v : []; }
function pgRemedySave(row) { const l = pgRemedyStored(); l.push(row); return _pgWrite(PG_REMEDY_KEY, l.slice(-500)); }
function pgActionSave(a, ctx) {
  const r = pgActionRecord(a, ctx);
  if (!r.ok) return r;
  pgRemedySave(r.row);
  pgAuditAppend({ actor: a.actor || "SYS-PGDECIDE", action: "집행", target: a.partnerId,
    result: r.row.level === "advisory" ? "기록" : "차단", risk: r.row.noDefense ? "높음" : "중간", ctx: ctx });
  return r;
}
function pgActionStats() {
  const l = pgRemedyStored();
  const out = { total: l.length, noDefense: 0, byPep: {}, byStatus: {} };
  for (const r of l) {
    if (r.noDefense && r.level !== "advisory") out.noDefense++;
    out.byPep[r.pep] = (out.byPep[r.pep] || 0) + 1;
    out.byStatus[r.status] = (out.byStatus[r.status] || 0) + 1;
  }
  return out;
}

/* ══════════════ ⑤ 차단 로그 — 세 단계를 **함께** 한다 ══════════════
   ⓐ 이벤트 이름 등재 — 공용 버스는 미등재 이름을 조용히 버린다. 등재가 유일한 합법 경로다.
      단 이것은 회원 완결 퍼널의 단계가 아니다 — 단계 축에 숫자를 억지로 주면 퍼널 집계가
      **통제 차단 건수로 부풀어 오른다**. 그래서 단계 축 밖 분류로 등재했다(hiEvents.js).
   ⓑ payload 접기 — 화이트리스트를 늘리면 다른 이벤트의 계약면도 같이 넓어진다. 늘리지 않고 접는다.
      사유 문장은 싣지 않는다 — 40자 절단으로 잘려 **거짓 사유**가 된다. 사유는 판정기가 보유하고
      로그는 어느 조항 · 어느 지점 · 어느 원인만 남긴다.
   ⓒ 전용 저장 키 — 공용 500건 링버퍼면 회원 퍼널 이벤트가 차단 기록을 밀어낸다.
   ★ 식별자는 **모드와 무관하게 항상 코드 표기**다. 커밋이 반출이고, 로그는 저장 · 배포 경로다. */
const PG_BLOCK_MAP = [
  { to: "key", from: "policyId", why: "어느 조항인가" },
  { to: "kind", from: "pep", why: "어느 집행 지점인가" },
  { to: "grade", from: "cause", why: "어느 원인인가" },
  { to: "src", from: "pgLogRef(partner)", why: "누구인가 — **항상 코드 표기**다. 실상호 · 표시명을 싣지 않는다" },
];
function pgBlockFold(e) {
  const r = e || {};
  const ref = (typeof pgLogRef === "function") ? pgLogRef(r.partner) : "";
  return { key: String(r.policyId || ""), kind: String(r.pep || ""), grade: String(r.cause || ""), src: String(ref || "") };
}
/* 한 장부에 두 이름이 산다 — `pg_blocked`(막혔다)와 `pg_exempted`(면제로 통과했다).
   읽는 쪽은 **이름으로 가른다.** pgBlockAll() 은 종전과 같은 뜻(차단만)이어서 보고서의
   「집행 차단 건수」가 면제 통과만큼 부풀지 않는다. 원장 전문이 필요하면 pgLogAll() 을 쓴다. */
function pgLogAll() { const v = _pgRead(PG_BLOCK_KEY); return Array.isArray(v) ? v : []; }
function pgBlockAll() { return pgLogAll().filter((e) => e && e.name !== "pg_exempted"); }
function pgExemptPassAll() { return pgLogAll().filter((e) => e && e.name === "pg_exempted"); }
function _pgLogWrite(name, e) {
  const r = e || {};
  const p = pgBlockFold(r);
  const list = pgLogAll();
  /* 시각축은 벽시계가 아니라 **호출자가 넘긴 기준일 + 순번**이다 — 같은 입력이 같은 로그를 만든다 */
  list.push({ seq: list.length + 1, at: _pgAsOf(r.ctx), name: name, p: p, level: r.level || null, sim: true });
  _pgWrite(PG_BLOCK_KEY, list.slice(-PG_BLOCK_CAP));
  /* 공용 버스에도 같은 접힌 payload 를 보낸다 — 운영 콘솔이 한 버스만 읽기 때문이다.
     집계의 **원천은 전용 키**이고 공용 버스는 사본이다(공용은 밀려 나갈 수 있다). */
  try { if (typeof hiEvent === "function") hiEvent(name, p); } catch (x) {}
  return true;
}
function pgBlockLog(e) { return _pgLogWrite("pg_blocked", e); }
/* ★ 면제로 차단이 풀린 사실을 남긴다. 종전에는 `out.exempted` 가 **반환값 배열에만** 담겨
   로그 · 집계 · 보고서 어디에도 숫자로 남지 않았다(실측: 면제쪽 pgBlockAll 0건 · pgAuditAll 0건).
   §7-2 는 soft 를 「막되 면제로 통과 — **그 사실이 로그로 남아 부인방지**」로 정의하므로,
   기록이 없으면 soft 가 구현되지 않은 것이다. 「기록되지 않는 차단은 차단이 아니다」의 거울상이다. */
function pgExemptPassLog(e) { return _pgLogWrite("pg_exempted", e); }
/* 「차단」과 「면제 통과」를 **분리 집계**한다 — 한 숫자로 합치면 보고서가 「무엇이 막혔나」를
   말할 수 없고, 면제 통과를 빼 버리면 「누가 어느 조항을 면제로 지났나」가 숫자에서 사라진다.
   ★ total 은 **차단 건수**다(종전 뜻 그대로 — b7.blockedTotal 이 이 값을 읽는다). */
function pgBlockStats() {
  const l = pgBlockAll();
  const ex = pgExemptPassAll();
  const out = { total: l.length, blocked: l.length, exempted: ex.length,
    byPep: {}, byCause: {}, byPolicy: {}, src: {}, exemptByPep: {}, exemptByPolicy: {} };
  for (const e of l) {
    const p = e.p || {};
    out.byPep[p.kind] = (out.byPep[p.kind] || 0) + 1;
    out.byCause[p.grade] = (out.byCause[p.grade] || 0) + 1;
    out.byPolicy[p.key] = (out.byPolicy[p.key] || 0) + 1;
    if (p.src) out.src[p.src] = (out.src[p.src] || 0) + 1;
  }
  for (const e of ex) {
    const p = e.p || {};
    out.exemptByPep[p.kind] = (out.exemptByPep[p.kind] || 0) + 1;
    out.exemptByPolicy[p.key] = (out.exemptByPolicy[p.key] || 0) + 1;
  }
  return out;
}
function pgBlockClear() { return _pgWrite(PG_BLOCK_KEY, []); }

/* ══════════════ ⑥ 결정 로그 — 기존 감사로그와 같은 스키마 ══════════════
   행위자 유형을 2종 더한다. 현 감사로그의 행위자는 임직원뿐이라 **누가 판정했는지가 사람인지 코드인지
   구분되지 않는다** — 그 구분이 없으면 AI 거버넌스 축이 빈다.
   ⚠ 영속화하지 않는다. 다섯 번째 저장 키를 더하면 설계 단계에서 확정한 신규 키 5종을 넘고, 미등재 키는
     커밋이 막힌다. 영속 소유자는 보고서 발행 스냅샷(접두 키)을 세우는 단계다 —
     지금 남는 것은 **집행 사실**(전용 차단 로그)과 **시정 과제 상태**(전용 키)이고,
     판정 자체는 호출로만 존재한다(판정 결과를 저장하면 정책이 바뀌어도 낡은 판정이 거짓말한다). */
const PG_ACTOR_KINDS = [
  { k: "EMP", ko: "임직원", pat: "EMP####", exists: true },
  { k: "PT", ko: "협력업체 주체", pat: "PT####", exists: false, note: "로그인 주체는 아직 없다 — 소명 접수의 행위자 자리다" },
  { k: "SYS", ko: "시스템(판정기)", pat: "SYS-PGDECIDE", exists: true, note: "사람 승인과 시스템 판정을 로그에서 가른다" },
];
const PG_AUDIT_ACTIONS = ["판정 호출", "집행", "면제 등록", "소명 접수", "재심", "반출"];
const PG_AUDIT_CAP = 500;
const PG_AUDIT = [];
function pgActorKind(actor) {
  const a = String(actor || "");
  for (const k of PG_ACTOR_KINDS) if (a.indexOf(k.k) === 0) return k.k;
  return null;
}
/* ★ 기존 감사로그 6키(actor · ts · action · target · result · risk)는 **그대로** 둔다 — 스키마가
   같아야 한 지면에서 함께 읽힌다. `via` 는 그 위에 얹는 **경로 축** 한 칸이고, 같은 action 이
   어느 경로로 왔는지(승인 절차 / 저장값 적재)를 **문장 파싱 없이** 가르기 위한 것이다.
   result 문장에 접어 넣으면 집계가 다시 문장을 파싱해야 한다(§11-1 의 원칙은 집계에도 적용된다). */
function pgAuditRow(a, ctx) {
  const r = a || {};
  return { actor: String(r.actor || "SYS-PGDECIDE"), actorKind: pgActorKind(r.actor || "SYS-PGDECIDE"),
    ts: _pgAsOf(ctx || r.ctx), action: String(r.action || ""),
    target: String(r.target || ""), result: String(r.result || ""), risk: String(r.risk || "낮음"),
    via: r.via ? String(r.via) : "승인 경유" };
}
function pgAuditAppend(a) {
  const row = pgAuditRow(a, a && a.ctx);
  if (PG_AUDIT_ACTIONS.indexOf(row.action) < 0) return { ok: false, reason: "등재되지 않은 행위 — " + row.action };
  if (!row.actorKind) return { ok: false, reason: "행위자 유형 밖 — " + row.actor };
  PG_AUDIT.push(row);
  if (PG_AUDIT.length > PG_AUDIT_CAP) PG_AUDIT.splice(0, PG_AUDIT.length - PG_AUDIT_CAP);
  return { ok: true, n: PG_AUDIT.length };
}
function pgAuditAll() { return PG_AUDIT.slice(); }

/* ══════════════ ⑦ 제출 필드 사전 — 사전에 등재된 필드만 존재한다 ══════════════
   현대해상 제공 DB 사전이 이 패턴의 완성 선례다 — 필드마다 {n, k, ko, form, note}이고
   **사전 밖 필드나 금지 성질의 값이 유입되면 커밋 게이트가 차단한다.**
   ★ 사전의 발주서는 지면 계약의 제출 키 집합이다(pgSubmitKeys). 여기 적힌 키 집합이 그것과
     어긋나면 러너가 실패한다 — 사전을 손으로 늘리면 조항이 보지 않는 필드를 받게 되고,
     **받으면서 쓰지 않는 정보는 받지 말아야 한다**.
   ★ 등급은 전건 「미제출」이다. 통제 축 시연값을 보유/미보유 2값으로 만들지 않기 때문이고,
     그래서 실명 옆에 찍히는 것은 「미제출 N / N」이지 「미보유 · 중대 결함」이 아니다. */
const PG_FIELDS = [
  { n: 1, k: "access_policy", ko: "접근통제 정책 보유", form: "Y/N", note: "존재 판정 — 문서 보유 여부" },
  { n: 2, k: "access_review_at", ko: "계정 · 권한 점검일", form: "날짜", note: "기능 판정 — 주기 안의 기록인가" },
  { n: 3, k: "ad_review_doc", ko: "자율심의 결과서 사본", form: "문서 참조", note: "자율심의기구 발급물 — 제3자 조회 창구가 없다" },
  { n: 4, k: "ad_review_no", ko: "자율심의번호", form: "문자열", note: "자율심의기구 발급물 — 발급물 종류는 PG_REVIEW_BODIES" },
  { n: 5, k: "ad_review_org", ko: "심의기구명", form: "기구명", note: "자율심의기구 발급물 — PG_REVIEW_BODIES 의 기구 축" },
  { n: 6, k: "ad_review_to", ko: "자율심의 유효기간 만료일", form: "날짜", note: "자율심의기구 발급물 — 영역별 상한이 다르다" },
  { n: 7, k: "ai_generative", ko: "생성형 제품 · 서비스 여부", form: "Y/N", note: "" },
  { n: 8, k: "ai_highimpact", ko: "고영향 해당성", form: "Y/N", note: "성질 요건과 영역 요건을 함께 본다" },
  { n: 9, k: "ai_highimpact_basis", ko: "고영향 해당성 판정 근거", form: "문자열", note: "사업자 자체 확인 또는 소관 장관 확인 결과" },
  { n: 10, k: "ai_notice_shot", ko: "고지 화면 증빙", form: "문서 참조", note: "" },
  { n: 11, k: "ai_notice_text", ko: "사전 고지 문구", form: "문구", note: "" },
  { n: 12, k: "ai_used", ko: "인공지능 사용 여부 · 범위", form: "Y/N + 범위", note: "" },
  { n: 13, k: "antibribery_fn", ko: "반부패 체계 문서", form: "Y/N", note: "준법 기능과 **같은 축으로 뭉치지 않는다**" },
  { n: 14, k: "authority_reply", ko: "소관 부처 유권해석 회신", form: "문서 참조", note: "경계 사례의 판정 보류를 푸는 유일한 입력" },
  { n: 15, k: "biz_cert_at", ko: "사업자등록증 발급일", form: "날짜", note: "" },
  { n: 16, k: "biz_status", ko: "영업 상태", form: "계속사업자 / 휴업 / 폐업", note: "조회 사양이 확인되지 않아 판정에 쓰지 않는 구간이 있다" },
  { n: 17, k: "bizno", ko: "사업자등록번호", form: "10자리", note: "수신 시 체크섬 검증. **시연 단계에서 생성하지 않는다** — 실명 법인 옆의 가짜 번호는 허위 문서 형식이 된다" },
  { n: 18, k: "cert_list[]", ko: "정보보호 인증서 목록", form: "배열", note: "보유는 증거의 한 조각이지 조항 충족이 아니다" },
  { n: 19, k: "cert_scope", ko: "인증 범위 명세", form: "문자열", note: "범위 밖 인증은 그 조항의 증거가 아니다" },
  { n: 20, k: "complaint_stats", ko: "민원 처리 통계", form: "건수 요약", note: "" },
  { n: 21, k: "complaint_system", ko: "민원 · 분쟁 접수 · 처리 체계 보유", form: "Y/N", note: "" },
  { n: 22, k: "compliance_fn", ko: "준법 체계 문서", form: "Y/N", note: "존재 판정" },
  { n: 23, k: "compliance_ops[]", ko: "준법 운영 기록", form: "배열", note: "기능 판정" },
  { n: 24, k: "dpa_access_control", ko: "접근 제한 등 안전성 확보 조치에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 시행령 축" },
  { n: 25, k: "dpa_liability", ko: "의무 위반 시 손해배상 등 책임에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 시행령 축" },
  { n: 26, k: "dpa_no_other_use", ko: "목적 외 처리 금지에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 법 축" },
  { n: 27, k: "dpa_purpose_scope", ko: "위탁업무의 목적 및 범위", form: "Y/N", note: "**한 항목이다** — 둘로 쪼개면 분모가 어긋난다" },
  { n: 28, k: "dpa_safeguards", ko: "기술적 · 관리적 보호조치에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 법 축" },
  { n: 29, k: "dpa_subcontract_limit", ko: "재위탁 제한에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 시행령 축" },
  { n: 30, k: "dpa_supervision", ko: "관리 현황 점검 등 감독에 관한 사항", form: "Y/N", note: "위수탁 필수 기재 — 시행령 축" },
  { n: 31, k: "emg_drill_at", ko: "응급 전달 훈련일", form: "날짜", note: "기능 판정" },
  { n: 32, k: "emg_owner", ko: "응급 전달 책임자", form: "내부 식별자", note: "**성명 · 연락처를 받지 않는다** — 내부 식별자만" },
  { n: 33, k: "emg_route", ko: "응급 · 이상 상황 전달 경로", form: "경로 식별자", note: "등록 부재는 치명 결함이다" },
  { n: 34, k: "ethics_activity_at", ko: "윤리 · 책임자 활동 기록일", form: "날짜", note: "기능 판정" },
  { n: 35, k: "ethics_doc", ko: "책임자 지정 · 윤리규정 문서", form: "Y/N", note: "존재 판정" },
  { n: 36, k: "finding_closed[]", ko: "미비점 종결 이력", form: "배열", note: "기능 판정 — 등록에서 종결까지 추적된다" },
  { n: 37, k: "finding_process", ko: "미비점 처리 절차", form: "Y/N", note: "존재 판정" },
  { n: 38, k: "guideline_match", ko: "판단 요건 대조표", form: "{전문지식, 진단 · 처방 · 처치, 보건위생상 위해, 경계사례}", note: "하나라도 해당하면 의료행위다" },
  { n: 39, k: "label_doc", ko: "제품 라벨 · 성분표", form: "문서 참조", note: "미확인은 **판정 보류**이고 위반이 아니다" },
  { n: 40, k: "model_card", ko: "모델 카드", form: "문서 참조", note: "의도된 용도와 부적합 맥락" },
  { n: 41, k: "model_validation", ko: "모델 검증 보고서", form: "문서 참조", note: "" },
  { n: 42, k: "model_version", ko: "모델 버전", form: "문자열", note: "바뀌면 판정이 무효다" },
  { n: 43, k: "notice_channel", ko: "대외 고지 채널", form: "Y/N", note: "존재 판정" },
  { n: 44, k: "notice_recent_at", ko: "최근 고지 실적일", form: "날짜", note: "기능 판정" },
  { n: 45, k: "recall_list[]", ko: "회수 이력", form: "배열", note: "공표 조회 사양이 미확인이라 제출 축으로 받는다" },
  { n: 46, k: "recall_open", ko: "미완료 회수 보유 여부", form: "Y/N", note: "" },
  { n: 47, k: "risk_list", ko: "위험목록", form: "Y/N", note: "존재 판정" },
  { n: 48, k: "risk_updated_at", ko: "위험목록 최근 갱신일", form: "날짜", note: "기능 판정" },
  { n: 49, k: "sanction_level", ko: "행정처분 수준", form: "문자열", note: "" },
  { n: 50, k: "sanction_list[]", ko: "행정처분 이력", form: "배열", note: "조회 기간의 소유자는 정책 파일의 임계 표다" },
  { n: 51, k: "service_acts[]", ko: "제공 행위 목록", form: "배열", note: "" },
  { n: 52, k: "service_count", ko: "서비스 제공 건수", form: "정수", note: "레코드가 없으면 「해당 없음」이고 0%가 아니다" },
  { n: 53, k: "service_rate", ko: "서비스 이행률", form: "비율", note: "같은 이유로 분모 0은 「—」다" },
  { n: 54, k: "sub_consent_at", ko: "재위탁 동의 일자", form: "날짜", note: "위탁자 동의" },
  { n: 55, k: "sub_exists", ko: "재위탁 유무", form: "Y/N", note: "4차 포함" },
  { n: 56, k: "sub_party_ref", ko: "재수탁자 식별", form: "내부 식별자", note: "**개인식별자를 받지 않는다** — 법인 축 식별자만" },
  { n: 57, k: "training_done_at", ko: "교육 이행일", form: "날짜", note: "기능 판정" },
  { n: 58, k: "training_plan", ko: "교육 계획", form: "Y/N", note: "존재 판정" },
  { n: 59, k: "withdrawal_refusals[]", ko: "청약철회 거절 실적", form: "배열", note: "법정 제외 사유 밖의 거절이 있는가" },
  { n: 60, k: "withdrawal_terms", ko: "청약철회 약관 보유", form: "Y/N", note: "" },
];
const PG_FIELD_KEYS = PG_FIELDS.map((f) => f.k);
function pgFieldBase(k) { return String(k).replace(/\[\]$/, ""); }
function pgFieldOf(k) { const b = pgFieldBase(k); for (const f of PG_FIELDS) if (pgFieldBase(f.k) === b) return f; return null; }

/* 받지 않는 것 — **수집하지 않는 것이 통제다.** 「받지 않는다」를 사전에 적고 화면에 설계 우위로
   표시한다. 부재 자체가 설계의 결정적 우위이고, 그 사실을 적지 않으면 다음 사람이 「빠뜨렸다」고 읽는다. */
const PG_REFUSE = [
  { id: "r1", ko: "협력업체 임직원 개인정보", taken: false,
    what: "명부 · 연락처 · 자격증 원본 · 성명",
    why: "받지 않는다 — 통제 판정에 쓰이지 않는다. 책임자 축은 내부 식별자 한 칸으로 충분하고, 개인정보를 받으면 그 보관 자체가 새 위험이 된다." },
  { id: "r2", ko: "환자 · 수급자 식별정보", taken: false,
    what: "성명 · 생년 · 연락처 · 진료 · 급여 내역",
    why: "받지 않는다 — 협력업체 적합성 판정과 무관하고, 이 축을 한 번 받으면 보고서가 민감정보 처리면이 된다." },
  { id: "r3", ko: "협력업체의 원가 구성 상세", taken: false,
    what: "원가율 · 제조원가 · 판매관리비 명세",
    why: "받지 않는다 — 우리 쪽 원가 비노출 규약과 **대칭**이다. 대칭이 아니면 거래상 지위 쟁점이 된다." },
  { id: "r4", ko: "협력업체 내부 인사 · 급여 정보", taken: false,
    what: "인사 기록 · 급여 · 평가",
    why: "받지 않는다 — 통제항목 어디에도 입력으로 선언되지 않았다. 선언되지 않은 입력은 받지 않는다." },
];

/* 자율심의기구 발급물 — **공적 조회가 성립하지 않는다.** 세 영역 모두 민간 자율심의기구가 수행하고
   소관 부처는 그 기구의 등록 · 신고 접수 기관일 뿐 심의번호를 조회해 주는 창구가 아니다.
   그래서 증거는 구조적으로 「협력업체 제출(결과서 사본)」밖에 없고, 외부 소스로 등재하지 않는다 —
   조회 창구가 없는 것을 외부 소스로 등재하면 카탈로그가 거짓말한다.
   ⚠ 이 표는 **발급물의 종류 축**이고 제출 필드가 아니다. 필드는 위 사전의 4칸(사본 · 번호 · 기구명 ·
     유효기간)이고, 종류를 필드로 또 세우면 어느 조항도 쓰지 않는 필드 3개가 생긴다. */
const PG_REVIEW_BODIES = [
  { id: "ad-med", ko: "의료광고 자율심의", lawRef: "medAct", appliesTo: ["PT-MED"],
    body: "의사회 · 치과의사회 · 한의사회 등 자율심의기구", reg: "소관 부처 신고",
    valid: "기구 규정에 따른다 — 상한을 우리가 정하지 않는다", lookup: false },
  { id: "ad-food", ko: "식품 · 건강기능식품 표시 · 광고 자율심의", lawRef: "foodLabelAct", appliesTo: ["PT-COM"],
    body: "협회 등 자율심의기구", reg: "소관 부처 등록",
    valid: "기구 규정에 따른다", lookup: false },
  { id: "ad-dev", ko: "의료기기 광고 자율심의", lawRef: "mdAct", appliesTo: ["PT-COM", "PT-SVC"],
    body: "협회 · 조합 등 자율심의기구", reg: "소관 부처 체계",
    valid: "승인일 기준 상한이 있다 — 상한 값의 소유자는 정책 파일의 임계 표다", lookup: false },
];

/* 금지 성질 — 값의 **모양**으로 잡는다. 사전 밖 필드는 이름으로, 금지 성질은 값으로 잡아야
   「사전은 지켰는데 민감정보가 들어온」 경우를 본다. */
const PG_REFUSE_PAT = [
  { ko: "주민등록번호 형태", re: /\b\d{6}\s*-\s*[0-4]\d{6}\b/, why: "개인식별자는 어떤 필드에서도 받지 않는다" },
  { ko: "휴대전화번호 형태", re: /\b01[016-9]\s*-?\s*\d{3,4}\s*-?\s*\d{4}\b/, why: "연락처 원문을 받지 않는다" },
  { ko: "전자우편 형태", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, why: "개인 연락 수단을 받지 않는다" },
  { ko: "원가 구성 표기", re: /원가율|제조원가|판매관리비|송객수수료/, why: "원가 구성 상세는 대칭으로 받지 않는다" },
  { ko: "급여 · 인사 표기", re: /급여대장|연봉|인사기록/, why: "내부 인사 · 급여 정보를 받지 않는다" },
];

/* 제출 레코드 전수 검사 — **사전 밖 필드 0 · 금지 성질 값 유입 0**이 통과 조건이다. */
function pgFieldScan(submit) {
  const bad = [];
  const s = submit || {};
  for (const k of Object.keys(s)) {
    if (!pgFieldOf(k)) { bad.push({ k: k, why: "사전 밖 필드 — 사전에 등재된 필드만 존재한다" }); continue; }
    const v = s[k];
    const txt = (v === null || v === undefined) ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
    for (const p of PG_REFUSE_PAT) if (p.re.test(txt)) bad.push({ k: k, why: "금지 성질 값 유입(" + p.ko + ") — " + p.why });
  }
  return bad;
}
/* 사전과 발주서의 일치 — 조항이 선언한 제출 키 집합과 사전이 어긋나면 받으면서 쓰지 않거나
   쓰면서 받지 않는 필드가 생긴다. 둘 다 결함이다. */
function pgFieldAudit() {
  const bad = [];
  const want = (typeof pgSubmitKeys === "function") ? pgSubmitKeys() : [];
  for (const k of want) if (PG_FIELD_KEYS.indexOf(k) < 0) bad.push({ k: k, why: "조항이 쓰는데 사전에 없다(조항 고아)" });
  for (const k of PG_FIELD_KEYS) if (want.indexOf(k) < 0) bad.push({ k: k, why: "사전에 있는데 어느 조항도 쓰지 않는다(필드 고아) — 받으면서 쓰지 않는 정보는 받지 않는다" });
  const seenN = {}, seenK = {};
  for (const f of PG_FIELDS) {
    if (seenN[f.n]) bad.push({ k: f.k, why: "번호 중복" });
    if (seenK[f.k]) bad.push({ k: f.k, why: "키 중복" });
    seenN[f.n] = 1; seenK[f.k] = 1;
    if (!f.ko || !f.form) bad.push({ k: f.k, why: "이름 · 형식이 비었다 — 사전이 계약면이 되지 못한다" });
  }
  for (const r of PG_REFUSE) if (r.taken !== false || !r.why) bad.push({ k: r.id, why: "「받지 않는 것」의 선언이 비었다" });
  for (const b of PG_REVIEW_BODIES) {
    if (b.lookup !== false) bad.push({ k: b.id, why: "자율심의 발급물에 제3자 조회 창구가 있다고 표기됐다" });
    /* 근거 법령 키가 레지스트리에 없으면 이 표가 거짓말한다 — 이름만 적고 등재하지 않는 자리를 막는다 */
    if (typeof PG_LAWS !== "undefined" && b.lawRef && !PG_LAWS[b.lawRef])
      bad.push({ k: b.id, why: "근거 법령 키가 레지스트리에 없다 — " + b.lawRef });
  }
  return bad;
}

/* 시험 격리 — 러너가 같은 프로세스에서 두 번 돌 때 앞 회차의 기록이 섞이면 「N건 심고 N건 읽힘」을
   단언할 수 없다. 운영 경로에서는 부르지 않는다(결정 로그를 지우는 것은 통제의 반대다). */
function pgAuditClear() { PG_AUDIT.length = 0; return true; }
function pgRemedyClear() { return _pgWrite(PG_REMEDY_KEY, []); }

/* ══════════════ 개발 훅 — 러너가 화면을 거치지 않고 단언한다 ══════════════ */
if (typeof window !== "undefined") {
  window.__hifinPGEnforce = function () {
    return {
      ver: PG_ENFORCE_VER,
      keys: { enforce: PG_ENFORCE_KEY, exempt: PG_EXEMPT_KEY, remedy: PG_REMEDY_KEY, block: PG_BLOCK_KEY, reportPrefix: PG_REPORT_PREFIX },
      blockCap: PG_BLOCK_CAP,
      sites: PG_PEP_SITES, exportRule: PG_EXPORT_RULE, exportEnforce: PG_EXPORT_ENFORCE, exportCols: PG_EXPORT_COLS,
      blockMap: PG_BLOCK_MAP, actionFields: PG_ACTION_FIELDS, actorKinds: PG_ACTOR_KINDS, auditActions: PG_AUDIT_ACTIONS,
      fields: PG_FIELDS, fieldKeys: PG_FIELD_KEYS, refuse: PG_REFUSE, refusePat: PG_REFUSE_PAT.map((p) => p.ko),
      reviewBodies: PG_REVIEW_BODIES,
      counts: { fields: PG_FIELDS.length, refuse: PG_REFUSE.length, sites: PG_PEP_SITES.length,
        reviewBodies: PG_REVIEW_BODIES.length, actionFields: PG_ACTION_FIELDS.length, actorKinds: PG_ACTOR_KINDS.length },
      enforceStored: pgEnforceStored, enforceStore: pgEnforceStore, enforceLoad: pgEnforceLoad,
      pepDecide: pgPepDecide, register: pgPepRegister, settle: pgPepSettle, expose: pgPepExpose, export: pgPepExport,
      exportBuild: pgExportBuild, exportEmit: pgExportEmit, exportRow: pgExportRow, exportGate: pgExportGate,
      /* P7 반출 플러밍 — 러너가 산출물 · 클립보드 · 인쇄 HTML · 열람 기록을 **실측**한다(§10-6 ①②③) */
      exportClip: pgExportClip, exportTsv: pgExportTsv, exportDoc: pgExportDoc, exportDocOpen: pgExportDocOpen,
      exportDocHtml: pgExportDocHtml, exportLog: pgExportLog, exportLogEv: PG_EXPORT_LOGEV,
      exportClass: (typeof pgExportClass === "function") ? pgExportClass() : null,
      exportNoticeAt: (typeof PG_EXPORT_NOTICE_AT !== "undefined") ? PG_EXPORT_NOTICE_AT : [],
      exemptRegister: pgExemptRegister, exemptLoad: pgExemptLoad, exemptStored: pgExemptStored,
      exemptPassAll: pgExemptPassAll, exemptPassLog: pgExemptPassLog, logAll: pgLogAll,
      actionRecord: pgActionRecord, actionSave: pgActionSave, actionStats: pgActionStats, remedyClear: pgRemedyClear,
      blockLog: pgBlockLog, blockAll: pgBlockAll, blockStats: pgBlockStats, blockClear: pgBlockClear, blockFold: pgBlockFold,
      auditRow: pgAuditRow, auditAppend: pgAuditAppend, auditAll: pgAuditAll, auditClear: pgAuditClear, actorKind: pgActorKind,
      fieldScan: pgFieldScan, fieldAudit: pgFieldAudit, fieldOf: pgFieldOf,
    };
  };
}
