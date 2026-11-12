/* ══════════════ 섹션별 자료 반입(corpUpload.js) · CorpOps (조성래님 지시 2026-11-12) ══════════════
   조성래님이 실제 자료를 올리는 자리. 전표 · 은행 내역 · 계약 · 인사 · 문서 목록을 받는다.

   ⚠️ 서버가 없다. 파일은 **브라우저 안에서만** 읽힌다 — 어디로도 전송되지 않는다.
      그래서 두 가지가 따라온다.
        ① 용량 한계가 있다. 브라우저 저장소는 수 MB가 한계라, 큰 파일은 **미리보기와 검증까지만**
           하고 반입은 거부한다. 「반입했다」고 적어 놓고 일부만 들어가는 것보다 낫다.
        ② 파일을 고르는 순간부터 그 내용이 이 화면에 뜬다. 민감자료가 섞여 있으면 **읽기 전에** 막는다.

   원칙
     · **받기 전에 본다.** 주민등록번호 꼴이 섞인 자료는 미리보기도 하지 않고 거부한다.
       커밋 게이트(check_sensitive.py)와 같은 판정을 브라우저에서도 한다 — 들어오는 길이 둘이면
       한쪽만 막는 것은 막는 것이 아니다.
     · **검증을 통과한 줄만 반입한다.** 한 줄이라도 틀리면 그 줄만 빼고, 뺀 사실과 이유를 적는다.
       전부 받거나 전부 거부하는 방식은 실무에서 쓸 수 없다.
     · **반입은 되돌릴 수 있다.** 직전 반입을 통째로 물릴 수 있어야 한다.
     · 열 이름이 제각각인 것을 전제한다 — 매핑을 사람이 고른다. 추측해서 넣지 않는다. */

const CORP_UP_KEY = "hifin_corp_upload";   /* dataCatalog.js 등재 필수 — 반입 이력 */
const CORP_UP_MAXKB = 1024;                /* 한 번에 받는 상한. 넘으면 미리보기까지만 한다 */

/* ── ① 섹션 정의 — 무엇을 어디로 받는가 ───────────────────────────────
   need  필수 열. 하나라도 매핑이 비면 반입하지 않는다.
   opt   선택 열.
   into  반입 대상(기존 저장 키). 「어디로 들어가는지」를 화면이 먼저 말한다.
   deny  이 섹션에서 **절대 받지 않는** 열 이름. 들어오면 그 열을 떼고 받는다. */
const CORP_UP_SPEC = [
  {
    k: "jv", ko: "회계 전표", team: "M2", into: "재무현황(장부)", live: true,
    d: "날짜 · 적요 · 계정 · 차변 · 대변. 한 전표가 여러 줄이면 전표번호로 묶습니다.",
    need: ["no", "date", "desc", "acct", "dr", "cr"], opt: ["memo"],
    deny: [],
    label: { no: "전표번호", date: "일자", desc: "적요", acct: "계정과목(코드 또는 이름)", dr: "차변", cr: "대변", memo: "줄 적요" },
  },
  {
    k: "bank", ko: "은행 거래내역", team: "M2", into: "재무현황(은행 대사 · 전표)", live: true,
    d: "은행에서 내려받은 거래내역을 그대로 올립니다(.xlsx 또는 CSV). "
       + "**입금액 · 출금액이 두 열로 나뉘어 있어도 받습니다** — 은행마다 열 순서가 거꾸로라 "
       + "어느 쪽이 입금인지 **사람이 확정합니다**. 추측하면 모든 부호가 뒤집힙니다. "
       + "**잔액 열을 꼭 맞춰 주세요** — 잔액이 이어지는지 보아야 흘린 거래를 잡습니다.",
    need: ["date", "desc"], opt: ["inAmt", "outAmt", "amt", "io", "bal", "cls"],
    deny: [],
    /* 힌트를 창구마다 덮어쓴다 — 은행 표에서 「적요」는 거래 수단(BZ뱅크·타행MB)이고
       상대가 적힌 칸은 「내용」이다. 전역 힌트를 그대로 쓰면 상대를 통째로 버린다. */
    hint: { desc: ["내용", "적요", "摘要", "desc"], date: ["거래일시", "거래일", "일자", "날짜", "date"],
      /* 「전체선택」은 은행 사이트의 체크박스 열이다. 거기에 분류를 적어 쓰는 관행이 있어
         후보로는 올리되, 맞는지는 **열 맞추기에서 사람이 확인한다**(제안은 확정이 아니다). */
      cls: ["분류", "전체선택", "계정", "계정과목", "class", "category"] },
    label: { date: "거래일시", desc: "내용(상대 · 적요)", inAmt: "입금액", outAmt: "출금액",
      amt: "금액(한 열에 부호로)", io: "입출 구분", bal: "잔액", cls: "분류(계정으로 보낼 낱말)" },
  },
  {
    k: "ct", ko: "계약", team: "M1", into: "계약 대장",
    d: "계약명 · 상대 · 개시일 · 만료일 · 금액. **만료일 없는 줄은 받지 않습니다.**",
    need: ["ko", "party", "from", "to"], opt: ["amount", "kind", "note"],
    deny: [],
    label: { ko: "계약명", party: "상대", from: "개시일", to: "만료일", amount: "금액", kind: "종류", note: "비고" },
  },
  {
    k: "hr", ko: "인사 기록", team: "M3", into: "조직 · 인사",
    d: "성명 · 직위 · 소속 · 합류일. **주민번호·주소·연락처 열은 떼고 받습니다.**",
    need: ["name", "title", "team"], opt: ["joined", "expertise", "cert"],
    deny: ["rrn", "주민", "주민등록번호", "생년월일", "birth", "주소", "addr", "연락처", "전화", "phone", "휴대", "이메일", "email", "급여", "salary"],
    label: { name: "성명", title: "직위", team: "소속 팀 코드", joined: "합류일", expertise: "전문영역", cert: "자격증(보유 사실)" },
  },
  {
    k: "doc", ko: "자료 목록", team: "M3", into: "자료실(팀별 게시판)", live: true,
    d: "저장소 목차입니다. scripts/gen_vault_index.py 가 만든 04_자료목록.csv 를 그대로 올리세요. "
       + "파일 자체가 아니라 **목록**을 받습니다 — 종류·법인·팀 판별은 화면이 합니다.",
    need: ["rel", "name"], opt: ["dir", "size", "at", "ext"],
    deny: [],
    label: { rel: "경로", name: "파일명", dir: "폴더", size: "크기", at: "수정일", ext: "확장자" },
  },
];
function corpUpSpec(k) { return CORP_UP_SPEC.find((x) => x.k === k) || null; }

/* ── ② 민감자료 — **받기 전에** 본다 ──────────────────────────────────
   커밋 게이트와 같은 판정이다. 들어오는 길이 둘인데 한쪽만 막으면 막는 것이 아니다.
   ⚠️ 값을 화면에 띄우지 않는다. 몇 줄 몇 열에서 어떤 종류가 걸렸는지까지만 적는다. */
function corpUpRrnOk(s) {
  const m = /^(\d{2})(\d{2})(\d{2})[- ]?([1-4])(\d{6})$/.exec(String(s).replace(/\s/g, ""));
  if (!m) return false;
  if (!(+m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31)) return false;
  const d = (m[1] + m[2] + m[3] + m[4] + m[5]).split("").map(Number);
  const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  return ((11 - d.slice(0, 12).reduce((n, x, i) => n + x * w[i], 0) % 11) % 10) === d[12];
}
/* 카드 검증식 — 구분자만 보면 재무 숫자가 걸린다. 커밋 게이트와 같은 판정을 쓴다. */
function corpUpLuhn(s) {
  const d = String(s).replace(/[^0-9]/g, "");
  if (d.length !== 16) return false;
  let t = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let x = +d[i];
    if (alt) { x *= 2; if (x > 9) x -= 9; }
    t += x; alt = !alt;
  }
  return t % 10 === 0;
}
const CORP_UP_SCAN = [
  /* 앞뒤가 숫자면 더 긴 숫자의 일부다 — 금액 한가운데를 주민번호로 읽지 않는다 */
  { k: "rrn", ko: "주민등록번호", re: /(?:^|[^0-9])(\d{6}[- ]?[1-4]\d{6})(?![0-9])/g, check: corpUpRrnOk, grp: 1,
    why: "고유식별정보입니다. 이 시스템은 값을 담지 않습니다 — 그 열을 지우고 다시 올려 주세요." },
  { k: "card", ko: "카드번호", re: /(?:^|[^0-9-])(\d{4}[- ]\d{4}[- ]\d{4}[- ]\d{4})(?![0-9-])/g, check: corpUpLuhn, grp: 1,
    why: "결제수단 전체번호입니다. 마지막 네 자리만 남기고 다시 올려 주세요." },
  { k: "passport", ko: "여권번호", re: /\b[MSROD]\d{8}\b/g, check: null,
    why: "고유식별정보에 준합니다. 그 열을 지우고 다시 올려 주세요." },
];
/* 표 전체를 훑어 적중 좌표만 돌려준다 — 값은 담지 않는다 */
function corpUpScan(rows, head) {
  const hit = [];
  (rows || []).forEach((r, ri) => {
    (r || []).forEach((cell, ci) => {
      const s = String(cell == null ? "" : cell);
      if (!s) return;
      CORP_UP_SCAN.forEach((p) => {
        p.re.lastIndex = 0;
        let m;
        while ((m = p.re.exec(s)) !== null) {
          const v = p.grp ? m[p.grp] : m[0];
          if (p.check && !p.check(v)) continue;
          hit.push({ k: p.k, ko: p.ko, why: p.why, row: ri + 1, col: (head && head[ci]) || ("" + (ci + 1)) });
          break;
        }
      });
    });
  });
  return hit;
}
/* 받지 않기로 한 열 — 이름으로 떼어 낸다. 떼었다는 사실을 화면이 적는다. */
function corpUpDenyCols(head, spec) {
  if (!spec || !spec.deny.length) return [];
  return (head || []).map((h, i) => ({ h: h, i: i }))
    .filter(({ h }) => spec.deny.some((d) => String(h || "").toLowerCase().indexOf(String(d).toLowerCase()) >= 0));
}

/* ── ③ CSV 파싱 — 따옴표와 줄바꿈을 지킨다 ───────────────────────────── */
function corpUpParseCsv(text) {
  const s = String(text || "").replace(/^﻿/, "");
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c === "\r") { /* 무시 */ }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((x) => String(x).trim() !== ""));
  if (!nonEmpty.length) return { head: [], rows: [] };
  return { head: nonEmpty[0].map((x) => String(x).trim()), rows: nonEmpty.slice(1) };
}

/* 열 이름에서 매핑 후보를 **제안**한다. 확정은 사람이 한다 — 추측해서 넣지 않는다. */
const CORP_UP_HINT = {
  no: ["전표", "번호", "no", "voucher", "id"], date: ["일자", "날짜", "date", "거래일"],
  desc: ["적요", "내용", "摘要", "desc", "memo", "비고"], acct: ["계정", "과목", "acct", "account"],
  dr: ["차변", "출금", "debit", "dr"], cr: ["대변", "입금", "credit", "cr"],
  amt: ["금액", "amount", "amt"], io: ["구분", "입출", "type"],
  /* ⚠️ 「입금액」에는 「금액」이 들어 있다 — amt 가 입금 열을 집어가면 출금이 통째로 사라진다.
     그래서 ⓐ 머리글이 **그대로 같은** 것을 먼저 보고 ⓑ 입금·출금이 둘 다 잡히면 amt 를 비운다. */
  inAmt: ["입금액", "입금(원)", "입금", "deposit", "입금금액"],
  outAmt: ["출금액", "지급(원)", "출금", "지급", "withdraw", "출금금액"],
  bal: ["거래후잔액", "잔액", "balance", "잔고"],
  ko: ["계약명", "문서명", "제목", "name", "title", "ko"], party: ["상대", "거래처", "party"],
  from: ["개시", "시작", "from", "start"], to: ["만료", "종료", "to", "end"],
  amount: ["금액", "계약금", "amount"], kind: ["종류", "유형", "kind", "type"],
  name: ["파일명", "성명", "이름", "name"],   /* 「파일명」이 먼저다 — 자료 목록의 열 이름이다 */ title: ["직위", "직급", "title"], team: ["소속", "팀", "team", "부서"],
  joined: ["합류", "입사", "joined", "hire"], expertise: ["전문", "담당", "expertise"], cert: ["자격", "cert"],
  cls: ["분류", "class", "cls", "category"], where: ["보관", "위치", "where"], note: ["비고", "note"],
  rel: ["경로", "rel", "path"], dir: ["폴더", "dir", "folder"], size: ["크기", "size"],
  at: ["수정", "날짜", "at", "date"], ext: ["확장자", "ext"],
};
function corpUpSuggest(head, spec) {
  const out = {};
  if (!spec) return out;
  const H = (head || []).map((h) => String(h == null ? "" : h).replace(/\s+/g, "").toLowerCase());
  const taken = {};
  const keys = spec.need.concat(spec.opt);
  const hintsOf = (k) => ((spec.hint && spec.hint[k]) || CORP_UP_HINT[k] || []).map((x) => String(x).replace(/\s+/g, "").toLowerCase());
  /* ⓐ 머리글이 힌트와 **그대로 같은** 것 먼저 — 「입금액」이 「금액」에 먹히지 않게 */
  keys.forEach((k) => {
    /* ⚠️ 힌트를 **적은 순서대로** 본다. 머리글 순서로 보면 은행 표에서 「적요」(거래 수단)가
       「내용」(상대)보다 앞에 있다는 이유만으로 상대를 통째로 버린다. */
    const hs = hintsOf(k);
    for (let x = 0; x < hs.length; x++) {
      const i = H.findIndex((h, j) => !taken[j] && h && h === hs[x]);
      if (i >= 0) { out[k] = i; taken[i] = 1; break; }
    }
  });
  /* ⓑ 남은 것만 부분 일치로 */
  keys.forEach((k) => {
    if (out[k] !== undefined) return;
    const hs = hintsOf(k);
    for (let x = 0; x < hs.length; x++) {
      const i = H.findIndex((h, j) => !taken[j] && h && h.indexOf(hs[x]) >= 0);
      if (i >= 0) { out[k] = i; taken[i] = 1; break; }
    }
  });
  /* ⓒ 입금·출금이 둘 다 잡혔으면 한 열짜리 금액·구분은 **비운다** — 둘을 같이 쓰면 두 번 센다 */
  if (out.inAmt !== undefined && out.outAmt !== undefined) { delete out.amt; delete out.io; }
  return out;
}

/* ── ④ 검증 — 줄 단위로 본다. 틀린 줄만 뺀다 ───────────────────────── */
function corpUpValidate(kind, head, rows, map) {
  const spec = corpUpSpec(kind);
  const ok = [], bad = [];
  const need = spec ? spec.need : [];
  const missing = need.filter((k) => map[k] === undefined || map[k] === null || map[k] === "");
  if (missing.length) {
    return { ok: [], bad: [], missing: missing, msg: "필수 열이 매핑되지 않았습니다 — " + missing.map((k) => spec.label[k]).join(" · ") };
  }
  const g = (r, k) => String(r[map[k]] == null ? "" : r[map[k]]).trim();
  const num = (v) => { const n = Number(String(v).replace(/[,\s원]/g, "")); return isFinite(n) ? n : NaN; };
  /* 은행 표의 거래일시는 「2026.11.11 20:05:15」 꼴이다. 시각을 이유로 줄을 떨구면
     그 파일은 한 줄도 안 들어간다. 시각은 **버리지 않고 따로 보관한다** —
     같은 날 같은 금액 두 줄을 가르는 유일한 표시이기 때문이다. */
  const DTRE = /^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const dt = (v) => {
    const m = DTRE.exec(String(v).trim());
    if (!m) return "";
    return m[1] + "-" + String(+m[2]).padStart(2, "0") + "-" + String(+m[3]).padStart(2, "0");
  };
  const tm = (v) => {
    const m = DTRE.exec(String(v).trim());
    if (!m || !m[4]) return "";
    return String(+m[4]).padStart(2, "0") + ":" + m[5] + ":" + (m[6] || "00");
  };
  (rows || []).forEach((r, i) => {
    const why = [];
    const o = { _row: i + 2 };                 /* 머리글이 1행이므로 +2 */
    need.concat(spec.opt).forEach((k) => { if (map[k] !== undefined && map[k] !== "") o[k] = g(r, k); });
    if (o.date !== undefined) { const t = tm(o.date); const d = dt(o.date); if (!d) why.push("일자 형식을 읽지 못했습니다"); else { o.date = d; o.time = t; } }
    /* 입금·출금·잔액 — 숫자가 아니면 **지어내지 않고** 그 줄을 뺀다.
       ⚠️ 잔액 0 은 참값이다(계좌를 비운 날이 실제로 있다). 빈칸과 0 을 가른다. */
    ["inAmt", "outAmt"].forEach((k) => {
      if (o[k] === undefined || o[k] === "") { if (o[k] === "") o[k] = 0; return; }
      const a = num(o[k]); if (isNaN(a)) why.push(spec.label[k] + "이(가) 숫자가 아닙니다"); else o[k] = a;
    });
    if (o.bal !== undefined) {
      if (String(o.bal).trim() === "") o.bal = null;
      else { const a = num(o.bal); if (isNaN(a)) why.push("잔액이 숫자가 아닙니다"); else o.bal = a; }
    }
    if (kind === "bank" && o.inAmt !== undefined && o.outAmt !== undefined) {
      const i = +o.inAmt || 0, u = +o.outAmt || 0;
      if (i > 0 && u > 0) why.push("한 줄에 입금과 출금이 같이 적혀 있습니다 — 어느 쪽인지 알 수 없습니다");
      if (i === 0 && u === 0) why.push("입금과 출금이 모두 0입니다");
    }
    if (o.from !== undefined) { const d = dt(o.from); if (!d) why.push("개시일 형식을 읽지 못했습니다"); else o.from = d; }
    if (o.to !== undefined) { const d = dt(o.to); if (!d) why.push("만료일이 없거나 형식을 읽지 못했습니다 — 만료일 없는 계약은 받지 않습니다"); else o.to = d; }
    if (o.dr !== undefined || o.cr !== undefined) {
      const a = num(o.dr || 0), b = num(o.cr || 0);
      if (isNaN(a) || isNaN(b)) why.push("차변·대변이 숫자가 아닙니다");
      else { o.dr = a; o.cr = b; if (a > 0 && b > 0) why.push("한 줄에 차변과 대변이 같이 적혀 있습니다"); if (a === 0 && b === 0) why.push("금액이 0입니다"); }
    }
    if (o.amt !== undefined) { const a = num(o.amt); if (isNaN(a)) why.push("금액이 숫자가 아닙니다"); else o.amt = a; }
    if (o.amount !== undefined && o.amount !== "") { const a = num(o.amount); if (isNaN(a)) why.push("금액이 숫자가 아닙니다"); else o.amount = a; }
    need.forEach((k) => { if (o[k] === "" || o[k] === undefined) why.push(spec.label[k] + "이(가) 비었습니다"); });
    if (kind === "jv" && o.acct && typeof corpAcct === "function") {
      const code = /^\d{3}$/.test(o.acct) ? o.acct : ((typeof CORP_ACCT !== "undefined" ? CORP_ACCT.find((a) => a.n === o.acct) : null) || {}).c;
      if (!code || !corpAcct(code)) why.push("계정과목 「" + o.acct + "」을(를) 계정과목표에서 찾지 못했습니다");
      else o.acctCode = code;
    }
    (why.length ? bad : ok).push(why.length ? { row: o._row, why: why } : o);
  });
  return { ok: ok, bad: bad, missing: [], msg: "" };
}

/* 전표는 번호로 묶는다 — 묶고 나서 차대가 맞는지 본다 */
function corpUpGroupJv(rows) {
  const by = {};
  rows.forEach((r) => { (by[r.no] = by[r.no] || []).push(r); });
  return Object.keys(by).map((no) => {
    const l = by[no];
    const dr = l.reduce((n, x) => n + (+x.dr || 0), 0);
    const cr = l.reduce((n, x) => n + (+x.cr || 0), 0);
    return {
      no: no, d: l[0].date, desc: l[0].desc, lines: l, dr: dr, cr: cr,
      ok: dr === cr && dr > 0,
      why: dr !== cr ? "차변 " + dr + " ≠ 대변 " + cr : (dr === 0 ? "합계가 0입니다" : ""),
    };
  }).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.no < b.no ? -1 : 1)));
}

/* ── ④-2 저장 모양으로 바꾼다 ────────────────────────────────────────
   화면이 즉석에서 모양을 만들면 러너가 못 본다. 바꾸는 자리를 하나로 둔다. */

/* 은행 — 입출 구분이 따로 있으면 그걸 따르고, 없으면 적힌 부호를 그대로 쓴다.
   ⚠️ 부호를 추측하지 않는다. 「출금」인지 모르는 줄을 음수로 만들면 잔액이 조용히 틀어진다. */
function corpUpBankIn(s) {
  const t = String(s || "").trim();
  if (!t) return null;
  if (/^(입금|입|수입|in|deposit|\+)$/i.test(t)) return 1;
  if (/^(출금|출|지급|지출|out|withdraw|withdrawal|-)$/i.test(t)) return -1;
  return null;
}
function corpUpToBank(rows) {
  const lines = [], dropped = [];
  (rows || []).forEach((r) => {
    const two = r.inAmt !== undefined || r.outAmt !== undefined;
    const a = two ? (+r.inAmt || 0) - (+r.outAmt || 0)
                  : (corpUpBankIn(r.io) === null ? (+r.amt || 0) : Math.abs(+r.amt || 0) * corpUpBankIn(r.io));
    const x = {
      d: r.date, t: r.time || "", a: a, m: String(r.desc || "").trim(),
      bal: r.bal === undefined || r.bal === null || r.bal === "" ? null : +r.bal,
      cls: String(r.cls || "").trim(), row: r._row || 0,
    };
    /* ⚠️ 버리는 줄을 **센다.** 조용히 건너뛰면 장부가 은행보다 적어지고 아무도 모른다. */
    if (!x.d) { dropped.push({ row: x.row, why: "일자를 읽지 못했습니다" }); return; }
    if (a === 0) { dropped.push({ row: x.row, why: "입금도 출금도 0입니다" }); return; }
    lines.push(x);
  });
  return { lines: lines, dropped: dropped, n: (rows || []).length };
}
/* 같은 줄을 두 번 받지 않는다 — 같은 파일을 두 번 올리면 잔액이 두 배가 된다 */
function corpUpMergeBank(prev, add) {
  /* ⚠️ 일자+금액+적요로는 못 가른다 — 조성래님 파일에 2026-11-10 1,800,000원이 두 줄 있고
     적요가 둘 다 「타행MB」다(내용만 다르다). 그 키로는 진짜 거래 둘이 한 건으로 접힌다.
     같은 줄 판정은 corpBjvKey 한 곳에서만 한다 — 두 벌이 되면 한쪽만 고쳐진다. */
  const key = (x) => (typeof corpBjvKey === "function" ? corpBjvKey(x)
    : [x.d || "", x.t || "", Math.round(+x.a || 0), x.bal == null ? "" : Math.round(+x.bal), String(x.m || "").replace(/\s+/g, "")].join("|"));
  const seen = {};
  (prev || []).forEach((x) => { seen[key(x)] = 1; });
  const out = (prev || []).slice();
  let dup = 0;
  (add || []).forEach((x) => {
    const k = key(x);
    if (seen[k]) { dup++; return; }
    seen[k] = 1; out.push(x);
  });
  out.sort((a, b) => {
    const ka = (a.d || "") + " " + (a.t || ""), kb = (b.d || "") + " " + (b.t || "");
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return { lines: out, dup: dup, added: out.length - (prev || []).length };
}
/* 자료 목록 — 목차는 **갈아 끼운다**. 지난 목차에 이어 붙이면 지워진 파일이 영영 남는다. */
function corpUpToVault(rows) {
  return (rows || []).map((r) => ({
    rel: String(r.rel || "").trim(), name: String(r.name || "").trim(),
    dir: String(r.dir || "").trim(), size: +r.size || 0,
    at: String(r.at || "").trim(), ext: String(r.ext || "").trim().toLowerCase(),
  })).filter((x) => x.rel && x.name);
}

/* ── ⑤ 반입 이력 — 되돌릴 수 있어야 한다 ───────────────────────────── */
function corpUpRead() {
  const empty = { v: 1, log: [] };
  try {
    const raw = localStorage.getItem(CORP_UP_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, log: Array.isArray(o.log) ? o.log : [] };
  } catch (e) { return empty; }
}
function corpUpWrite(st) {
  try { localStorage.setItem(CORP_UP_KEY, JSON.stringify({ v: 1, log: (st.log || []).slice(-50) })); return true; }
  catch (e) { return false; }
}
function corpUpSizeKb(text) { return Math.round((String(text || "").length * 2) / 1024); }

/* ── ⑥ 단언 — 화면과 러너가 같은 함수를 부른다 ───────────────────── */
function corpUpVerdict() {
  const specs = CORP_UP_SPEC;
  const noLabel = specs.filter((s) => s.need.concat(s.opt).some((k) => !s.label[k]));
  const noInto = specs.filter((s) => !s.into || !s.d);
  const hr = corpUpSpec("hr");
  /* 민감 탐지기 자기시험 — 합성 표본을 먹여 살아 있음을 먼저 증명한다 */
  const pos = corpUpScan([["950101-1234564"], ["4111-1111-1111-1111"], ["M12345678"]], ["c"]);
  const neg = corpUpScan([["950101-1234567"], ["1234-5678-9012-3456"], ["2026-11-12"], ["1234567890123"]], ["c"]);
  const csv = corpUpParseCsv('a,b\n"1,2",3\n');
  return [
    { k: "spec", ko: "섹션 정의", n: specs.length, ok: specs.length > 0 && noInto.length === 0, got: specs.length + "종", want: "반입처·설명 전건" },
    { k: "label", ko: "열마다 이름", n: specs.reduce((n, s) => n + s.need.length + s.opt.length, 0), ok: noLabel.length === 0, got: noLabel.length + "종 누락", want: "0종" },
    { k: "deny", ko: "인사에서 받지 않는 열 목록", n: hr ? hr.deny.length : 0, ok: !!hr && hr.deny.length > 0 && hr.deny.indexOf("rrn") >= 0, got: hr ? hr.deny.length + "개" : "없음", want: "주민번호 포함" },
    { k: "scanpos", ko: "민감 탐지기 자기시험(양성)", n: 3, ok: pos.length === 3, got: pos.length + "건 탐지", want: "3건" },
    { k: "scanneg", ko: "민감 탐지기 자기시험(음성)", n: 4, ok: neg.length === 0, got: neg.length + "건 오탐", want: "0건" },
    { k: "csv", ko: "CSV 따옴표 파싱", n: 1, ok: csv.head.length === 2 && csv.rows[0] && csv.rows[0][0] === "1,2", got: JSON.stringify(csv.rows[0] || []), want: '["1,2","3"]' },
    { k: "max", ko: "용량 상한 선언", n: 1, ok: CORP_UP_MAXKB > 0, got: CORP_UP_MAXKB + "KB", want: "> 0" },
  ];
}
function corpUpPass() {
  const rows = corpUpVerdict();
  const zero = rows.filter((r) => !(r.n > 0));
  const fail = rows.filter((r) => !r.ok);
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
