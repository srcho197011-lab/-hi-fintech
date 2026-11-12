/* ══════════════════════════════════════════════════════════════════════════
   은행 한 줄 → 전표 한 장

   형 지시(2026-11-12): 「은행거래내역 자료에 따라서만 전표를 발생시켜. 그리고 책임자가
   전표를 넣을 수 있도록 시스템을 만들고. 은행자료를 전일 것을 매일 업로드만 시키면
   전표가 쳐져서 실시간 재무제표가 만들어 지도록.」

   ⚠️ 이 파일이 지키는 것 하나 — **기계는 고르지 않는다.**
   은행 줄에는 금액·날짜·상대가 있지만 **계정이 없다.** 계정은 거래를 한 사람만 안다.
   그래서 확실한 대응 하나만 코드에 두고, 나머지는 전부 사람에게 묻는다.
   형이 실제로 쓰신 분류를 보면 왜 그래야 하는지가 그대로 보인다:
     · 「매입비용」 — 10월엔 251 외상매입금, 11월엔 831 지급수수료로 **갈렸다**
     · 「수수료」   — 831 두 건, 253 미지급금 한 건으로 **갈렸다**
     · 「영업외수익」으로 적힌 줄이 출금이었고 사람이 951 이자비용으로 고쳤다
   한 낱말이 늘 한 계정이면 자동이 되지만, 실제 장부는 그렇지 않다.
   기계가 하나로 못 박으면 **둘 중 하나는 반드시 틀린다.**

   ⚠️ 그리고 이 파일이 들고 있는 것 — **잔액 사슬.**
   「은행 대사 차이 0」은 사실 항진식이다. 짝지은 줄은 금액이 같으니 구조적으로 늘 0이고,
   조작한 은행줄을 먹여도 통과한다. 전표를 은행줄에서 만들면 미대사까지 0이 되어
   「언제나 100% 맞는」 공허한 통과가 된다. 그걸 막는 **단 하나의 외부 사실**이
   은행 표의 잔액 열이다 — 잔액이 한 줄이라도 안 맞으면 거래를 흘린 것이다.
   ══════════════════════════════════════════════════════════════════════════ */

const CORP_BJV_KEY = "hifin_corp_bankmap";

/* ── ① 확실한 대응 — **하나뿐이다** ────────────────────────────────────────
   낱말이 계정과목표의 이름과 **그대로 같고**, 실제 장부에서 갈린 적이 없는 것만 둔다.
   「매입비용」·「수수료」는 여기 없다. 표에 없는 이름이고, 실제로 갈렸다. */
const CORP_BJV_SURE = [
  { w: "상품매출", c: "401", dir: "in", why: "계정과목표의 이름과 그대로 같고, 10·11월 전건이 401로 갔다" },
];

/* 사람이 확정한 대응을 기억한다 — 없으면 형이 매일 열한 번씩 고르셔야 한다.
   ⚠️ 다만 **틀린 선택도 영구히 복제된다.** 그래서 한 낱말이 두 계정으로 쓰인 적이
      있으면 기억을 쓰지 않고 **매번 다시 묻는다**(corpBjvPick 의 split 갈래). */
function corpBjvRead() {
  const empty = { v: 1, map: {}, log: [] };
  try {
    const raw = localStorage.getItem(CORP_BJV_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, map: (o && typeof o.map === "object" && o.map) || {}, log: Array.isArray(o && o.log) ? o.log : [] };
  } catch (e) { return empty; }
}
function corpBjvWrite(st) {
  try { localStorage.setItem(CORP_BJV_KEY, JSON.stringify({ v: 1, map: (st && st.map) || {}, log: (st && st.log) || [] })); return true; }
  catch (e) { return false; }
}
function corpBjvWord(s) { return String(s == null ? "" : s).replace(/\s+/g, "").trim(); }

/* 지난 장부에서 이 낱말이 어느 계정으로 갔는지 **센다**.
   기억이 아니라 실제 전표에서 읽는다 — 기억은 지워질 수 있지만 장부는 남는다. */
function corpBjvPast(jvs, word) {
  const w = corpBjvWord(word);
  const hit = {};
  if (!w) return hit;
  (jvs || []).forEach(function (j) {
    const txt = corpBjvWord(j.desc) + corpBjvWord((j.l || []).map(function (x) { return x[3]; }).join(""));
    if (txt.indexOf(w) < 0) return;
    (j.l || []).forEach(function (x) {
      if (x[0] === "103") return;                 /* 상대편(보통예금)은 센다고 뜻이 없다 */
      hit[x[0]] = (hit[x[0]] || 0) + 1;
    });
  });
  return hit;
}

/* 한 낱말의 계정을 고른다 — 또는 **고르지 못한다고 말한다.**
   돌려주는 것에 왜 그런지를 함께 담는다. 「모름」이 이유 없이 뜨면 사람이 못 고친다. */
function corpBjvPick(word, dir, st, jvs) {
  const w = corpBjvWord(word);
  if (!w) return { c: "", src: "none", why: "분류 칸이 비었습니다 — 엑셀의 분류 열에 적어 주시거나 여기서 고르세요" };
  /* 지금 사람이 고른 것이 **맨 앞**이다 — 사전도, 지난 장부도 이걸 못 덮는다.
     이 줄이 뒤에 있으면 「갈린 낱말」이 영원히 고를 수 없는 줄이 된다. */
  const chosen = ((st && st.pick) || {})[w + "|" + dir];
  if (chosen) return { c: chosen, src: "picked", why: "책임자가 방금 고른 계정입니다" };
  const past = corpBjvPast(jvs, w);
  const used = Object.keys(past);
  if (used.length > 1) {
    return { c: "", src: "split", why: "「" + w + "」은(는) 지난 장부에서 " + used.length + "개 계정으로 갈렸습니다(" + used.join(" · ") + ") — 이번 줄은 어느 쪽인지 사람이 골라야 합니다", past: past };
  }
  const sure = CORP_BJV_SURE.find(function (x) { return x.w === w && (!x.dir || x.dir === dir); });
  if (sure) return { c: sure.c, src: "sure", why: sure.why, past: past };
  const saved = ((st && st.map) || {})[w + "|" + dir];
  if (saved) return { c: saved, src: "saved", why: "전에 사람이 「" + w + "」을(를) 이 계정으로 확정했습니다", past: past };
  if (used.length === 1) {
    return { c: "", src: "hint", why: "지난 장부에서 「" + w + "」은(는) " + used[0] + " 로 갔습니다 — 이번에도 같은지는 사람이 확인해 주세요", past: past, hint: used[0] };
  }
  return { c: "", src: "unknown", why: "「" + w + "」에 맞는 계정을 알지 못합니다 — 계정과목표에 없는 이름입니다. 골라 주세요", past: past };
}

/* ── ② 잔액 사슬 — 흘린 거래를 잡는 **단 하나의 외부 사실** ──────────────
   은행 표가 내림차순이든 오름차순이든, 날짜 오름차순으로 세운 뒤
   `잔액[i] = 잔액[i-1] + 입금 - 출금` 이 서야 한다. 한 군데라도 안 서면
   그 사이에 **표에 없는 거래가 있다.** 그러면 전표를 만들지 않는다. */
function corpBjvSort(lines) {
  return (lines || []).slice().sort(function (a, b) {
    const ka = (a.d || "") + " " + (a.t || ""), kb = (b.d || "") + " " + (b.t || "");
    if (ka !== kb) return ka < kb ? -1 : 1;
    return (a.row || 0) - (b.row || 0);
  });
}
function corpBjvChain(lines) {
  const L = corpBjvSort(lines).filter(function (x) { return x.bal !== null && x.bal !== undefined && x.bal !== ""; });
  const breaks = [];
  for (let i = 1; i < L.length; i++) {
    const want = (+L[i - 1].bal || 0) + (+L[i].a || 0);
    if (Math.round(want) !== Math.round(+L[i].bal || 0)) {
      breaks.push({ row: L[i].row || i + 1, d: L[i].d, want: Math.round(want), got: Math.round(+L[i].bal || 0), gap: Math.round((+L[i].bal || 0) - want) });
    }
  }
  /* 첫 줄의 직전 잔액 — 역산한 값이다. 「이 표가 전부라면」의 값일 뿐이고
     그 앞에 빠진 거래가 있으면 못 잡는다. 그렇게 적어 둔다. */
  const open = L.length ? Math.round((+L[0].bal || 0) - (+L[0].a || 0)) : null;
  return {
    n: Math.max(0, L.length - 1), ok: breaks.length === 0 && L.length > 1,
    breaks: breaks, open: open, last: L.length ? Math.round(+L[L.length - 1].bal || 0) : null,
    noBal: (lines || []).length - L.length,
  };
}

/* ── ③ 같은 줄인가 ────────────────────────────────────────────────────────
   ⚠️ 일자+금액+적요로는 **못 가른다.** 형 파일에 2026-11-10 에 1,800,000원이
      두 줄 있고 적요가 둘 다 「타행MB」다(내용만 다르다). 그 키로는 진짜 거래
      두 건이 한 건으로 접힌다 — 실제로 접혔다. 시각과 잔액까지 넣는다. */
function corpBjvKey(x) {
  return [x.d || "", x.t || "", Math.round(+x.a || 0), x.bal === null || x.bal === undefined ? "" : Math.round(+x.bal), corpBjvWord(x.m)].join("|");
}

/* ── ④ 전표로 바꾼다 ──────────────────────────────────────────────────────
   전표번호는 **거래일시 오름차순**으로 그날 01부터. 10·11월 기존 12건을
   역산해 확정한 규약이다(엑셀 줄 순서를 뒤집은 것).
   분개: 입금 → (차)103 / (대)분류계정 · 출금 → (차)분류계정 / (대)103.

   ⚠️ 계정을 못 고른 줄은 **건너뛰지 않는다.** 건너뛰면 장부가 은행보다 적어지고,
      그 차이는 아무도 모른다. 보류 목록에 번호와 이유를 달고 남긴다.
      (전표가 된 줄) + (보류 줄) = (은행 줄) 이 늘 서야 한다. */
function corpBjvBuild(lines, st, ledger, jvs) {
  const L = corpBjvSort(lines);
  const have = {};
  (jvs || []).forEach(function (j) { if (j.bk) have[j.bk] = j.id; });
  const seq = {};
  const made = [], held = [], dup = [];
  /* 그날 이미 쓰인 번호부터 이어 붙인다 — 기존 전표와 번호가 부딪히지 않게 */
  (jvs || []).forEach(function (j) {
    const id = String(j.id || ""), m = /^(\d{8})-(\d+)$/.exec(id);
    if (!m) return;
    const d = m[1].slice(0, 4) + "-" + m[1].slice(4, 6) + "-" + m[1].slice(6, 8);
    if (!seq[d] || +m[2] > seq[d]) seq[d] = +m[2];
  });
  /* 은행에서 만들지 않은 전표도 **같은 거래일 수 있다.** 손으로 넣었거나 표로 반입한 것이
     이미 장부에 있으면, 은행줄을 그대로 전표로 만들면 그 거래가 두 번 선다.
     ⚠️ 그렇다고 조용히 건너뛰지도 않는다 — 같은 날 같은 금액이 진짜로 두 건일 수도 있다.
        「이미 있을 수 있습니다」로 세워 **사람에게 보인다.** 한 전표는 한 번만 짝짓는다. */
  const soft = (jvs || []).filter(function (j) { return !j.bk; }).map(function (j) {
    const l = (j.l || []).find(function (x) { return x[0] === "103"; });
    return l ? { id: j.id, d: j.d, in: +l[1] || 0, out: +l[2] || 0, used: false } : null;
  }).filter(Boolean);
  L.forEach(function (x, i) {
    const row = x.row || i + 1;
    const key = corpBjvKey(x);
    if (have[key]) { dup.push({ row: row, d: x.d, a: x.a, m: x.m, id: have[key], why: "이 은행줄에서 만든 전표가 이미 있습니다" }); return; }
    const dir = (+x.a || 0) >= 0 ? "in" : "out";
    const abs0 = Math.abs(+x.a || 0);
    const hit = soft.find(function (p) { return !p.used && p.d === x.d && (dir === "in" ? p.in : p.out) === abs0; });
    if (hit) {
      hit.used = true;
      dup.push({ row: row, d: x.d, a: x.a, m: x.m, id: hit.id, soft: true,
        why: "장부에 같은 날 같은 금액의 보통예금 전표(" + hit.id + ")가 이미 있습니다 — 같은 거래로 보입니다. 두 건이 맞다면 그 전표를 먼저 정리해 주세요" });
      return;
    }
    const p = corpBjvPick(x.cls, dir, st, jvs);
    if (!p.c) { held.push({ row: row, d: x.d, t: x.t, a: x.a, m: x.m, cls: x.cls, dir: dir, why: p.why, hint: p.hint || "", bk: key }); return; }
    const amt = Math.abs(+x.a || 0);
    const desc = (corpBjvWord(x.cls) ? corpBjvWord(x.cls) + " — " : "") + String(x.m || "").trim();
    seq[x.d] = (seq[x.d] || 0) + 1;
    const jv = {
      id: (typeof corpJvNo === "function" ? corpJvNo(x.d, seq[x.d]) : x.d.replace(/-/g, "") + "-" + String(seq[x.d]).padStart(2, "0")),
      d: x.d, desc: desc, by: "은행반입", ap: null, st: "draft", bk: key, bt: x.t || "",
      l: dir === "in"
        ? [["103", amt, 0, "은행 입금"], [p.c, 0, amt, corpBjvWord(x.cls) || "분류"]]
        : [[p.c, amt, 0, corpBjvWord(x.cls) || "분류"], ["103", 0, amt, "은행 출금"]],
    };
    const chk = typeof corpJvCheck === "function" ? corpJvCheck(jv, ledger) : { ok: true, errs: [] };
    if (!chk.ok) { seq[x.d]--; held.push({ row: row, d: x.d, t: x.t, a: x.a, m: x.m, cls: x.cls, dir: dir, why: chk.errs.join(" · "), bk: key }); return; }
    made.push(jv);
  });
  return { made: made, held: held, dup: dup, n: L.length, chain: corpBjvChain(L) };
}

/* ── ⑤ 검산 — 화면과 커밋 게이트 러너가 이 함수 하나를 같이 본다 ──────── */
function corpBjvRows(lines, st, ledger, jvs) {
  const B = corpBjvBuild(lines, st, ledger, jvs);
  const C = B.chain;
  const bookBal = (function () {
    if (typeof corpStatements !== "function") return null;
    const S = corpStatements(jvs || [], "");
    const r = (S.trial && S.trial.rows || []).find(function (x) { return x.c === "103"; });
    return r ? Math.round(r.bal) : 0;
  })();
  return [
    { k: "cover", ko: "은행 줄 = 전표 + 보류 + 이미 있음", n: B.n,
      ok: B.n > 0 && B.made.length + B.held.length + B.dup.length === B.n,
      got: B.made.length + " + " + B.held.length + " + " + B.dup.length + " / " + B.n, want: "같을 것" },
    { k: "chain", ko: "잔액 사슬 전건 성립", n: C.n,
      ok: C.ok, got: C.breaks.length ? C.breaks.length + "군데 끊김(" + C.breaks[0].row + "행 " + (typeof corpWon === "function" ? corpWon(C.breaks[0].gap) : C.breaks[0].gap) + ")" : "끊김 없음",
      want: "끊김 0", skip: C.n === 0, why: C.n === 0 ? "잔액 열이 맞춰지지 않았습니다 — 흘린 거래를 잡을 길이 없어 검사하지 않았습니다" : "" },
    { k: "bal", ko: "은행 마지막 잔액 = 장부 보통예금", n: C.last === null ? 0 : 1,
      ok: C.last !== null && bookBal !== null && C.last === bookBal,
      got: (typeof corpWon === "function" ? corpWon(C.last || 0) + " / " + corpWon(bookBal || 0) : C.last + " / " + bookBal), want: "같을 것",
      skip: C.last === null, why: C.last === null ? "잔액 열이 맞춰지지 않았습니다" : "" },
    { k: "nobal", ko: "잔액이 빈 줄 0건", n: B.n,
      ok: C.noBal === 0, got: C.noBal + "건", want: "0건" },
    { k: "dupkey", ko: "같은 줄 판정에 시각·잔액이 들어간다", n: B.n,
      ok: B.n === 0 || corpBjvKey({ d: "2026-11-10", t: "11:27:40", a: 1800000, bal: 1, m: "타행MB" })
        !== corpBjvKey({ d: "2026-11-10", t: "11:11:56", a: 1800000, bal: 2, m: "타행MB" }),
      got: "다름", want: "다를 것" },
    { k: "dupwhy", ko: "건너뛴 줄마다 어느 전표와 겹치는지 적는다", n: B.dup.length,
      ok: B.dup.every(function (d) { return d.id && (d.why || "").trim(); }),
      got: B.dup.filter(function (d) { return !d.id || !(d.why || "").trim(); }).length + "건 누락", want: "0건",
      skip: B.dup.length === 0, why: B.dup.length === 0 ? "겹치는 줄이 없습니다 — 검사할 대상이 없습니다" : "" },
    { k: "held", ko: "계정을 못 고른 줄은 **남는다**(사라지지 않는다)", n: B.held.length + B.made.length,
      ok: B.held.every(function (h) { return (h.why || "").trim(); }),
      got: B.held.length + "건 보류 · 사유 " + B.held.filter(function (h) { return (h.why || "").trim(); }).length + "건", want: "전건 사유" },
  ];
}
function corpBjvVerdict(lines, st, ledger, jvs) {
  const rows = corpBjvRows(lines, st, ledger, jvs);
  const skip = rows.filter(function (r) { return r.skip; });
  const live = rows.filter(function (r) { return !r.skip; });
  const zero = live.filter(function (r) { return !(r.n > 0); });
  const fail = live.filter(function (r) { return !r.ok; });
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero, skip: skip };
}

/* ── ⑥ 자기시험 — 음성 표본이 **실제로 깨지는지** 본다 ────────────────────
   「맞는 표본이 통과한다」만 세면, 아무것도 검사하지 않는 코드도 만점을 받는다. */
const CORP_BJV_T = [
  { row: 2, d: "2026-11-10", t: "11:05:45", a: 900000, bal: 1977986, m: "입금A", cls: "상품매출" },
  { row: 3, d: "2026-11-10", t: "11:11:56", a: 1800000, bal: 3777986, m: "입금B", cls: "상품매출" },
  { row: 4, d: "2026-11-10", t: "11:25:55", a: -2420000, bal: 1357986, m: "출금A", cls: "상품매출" },
  { row: 5, d: "2026-11-10", t: "11:27:40", a: 120000, bal: 1477986, m: "입금C", cls: "상품매출" },
];
function corpBjvSelfTest() {
  const good = corpBjvChain(CORP_BJV_T);
  const flip = corpBjvChain(CORP_BJV_T.map(function (x, i) { return i === 2 ? Object.assign({}, x, { a: -x.a }) : x; }));
  const bend = corpBjvChain(CORP_BJV_T.map(function (x, i) { return i === 1 ? Object.assign({}, x, { a: x.a + 1 }) : x; }));
  const drop = corpBjvChain(CORP_BJV_T.filter(function (x, i) { return i !== 1; }));
  const swap = corpBjvChain(CORP_BJV_T.map(function (x) { return Object.assign({}, x, { a: -x.a }); }));
  return [
    { k: "ok", ko: "맞는 표본은 사슬이 선다", n: good.n, ok: good.ok && good.n === 3, got: good.breaks.length + "군데 끊김 · 분모 " + good.n, want: "0군데 · 분모 3" },
    { k: "open", ko: "직전 잔액을 역산한다", n: 1, ok: good.open === 1077986, got: String(good.open), want: "1077986" },
    { k: "flip", ko: "한 줄 부호를 뒤집으면 **깨진다**", n: flip.n, ok: !flip.ok, got: flip.breaks.length + "군데", want: "≥ 1군데" },
    { k: "bend", ko: "1원만 비틀어도 **깨진다**", n: bend.n, ok: !bend.ok, got: bend.breaks.length + "군데", want: "≥ 1군데" },
    { k: "drop", ko: "한 줄을 빼면 **깨진다**(흘린 거래를 잡는다)", n: drop.n, ok: !drop.ok, got: drop.breaks.length + "군데", want: "≥ 1군데" },
    { k: "swap", ko: "입금·출금 열을 맞바꾸면 **깨진다**", n: swap.n, ok: !swap.ok, got: swap.breaks.length + "군데", want: "≥ 1군데" },
    { k: "empty", ko: "빈 표는 통과가 아니다", n: 1, ok: !corpBjvChain([]).ok, got: "불성립", want: "불성립" },
  ];
}

/* ── ⑦ 매일 운영 — 어디까지 들어왔는가 ───────────────────────────────────
   ⚠️ 「거래가 있던 마지막 날」로 세면 안 된다 — 거래가 0건인 날과 **안 올린 날**이
      구분되지 않는다. 올린 사람이 적어 준 기간(from~to)으로 센다.
   ⚠️ 날짜는 **인자로 받는다.** 함수 안에서 오늘을 읽으면 러너가 벽시계에 매달린다. */
function corpBjvDays(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) return 0;
  const a = Date.parse(from + "T00:00:00Z"), b = Date.parse(to + "T00:00:00Z");
  if (!isFinite(a) || !isFinite(b)) return 0;
  return Math.round((b - a) / 86400000);
}
function corpBjvShiftDay(iso, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  const t = Date.parse(iso + "T00:00:00Z");
  if (!isFinite(t)) return "";
  return new Date(t + n * 86400000).toISOString().slice(0, 10);
}
/* 오늘(주입)을 받아 「어제 것까지 들어왔는가」를 센다 */
function corpBjvDue(cov, todayIso) {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(todayIso || "") ? todayIso : "";
  const y = today ? corpBjvShiftDay(today, -1) : "";
  if (!cov || !cov.to) {
    return { ok: false, late: null, to: "", need: y, ko: y ? "아직 한 번도 올리지 않았습니다 — " + y + " 까지의 내역이 필요합니다" : "오늘이 정해지지 않아 세지 못합니다" };
  }
  if (!y) return { ok: false, late: null, to: cov.to, need: "", ko: "오늘이 정해지지 않아 세지 못합니다" };
  const late = corpBjvDays(cov.to, y);
  if (late <= 0) return { ok: true, late: 0, to: cov.to, need: "", ko: cov.to + " 까지 들어왔습니다 — 어제(" + y + ") 것까지 있습니다" };
  return { ok: false, late: late, to: cov.to, need: corpBjvShiftDay(cov.to, 1) + " ~ " + y,
    ko: cov.to + " 까지만 들어왔습니다 — " + corpBjvShiftDay(cov.to, 1) + " 부터 " + y + " 까지 " + late + "일치가 비어 있습니다" };
}
