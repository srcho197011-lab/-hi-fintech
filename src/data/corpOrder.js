/* ══════════════════════════════════════════════════════════════════════════
   업무 지시 — 조성래님이 말로 시키면, 할 일로 쪼갠다

   조성래님 지시(2026-11-12): 「회계팀 대시보드 안에서 핀테크 팀장에게 대화로 업무를 진행하는
   시스템. 예를 들면 11월 11일 행했던 전표를 모두 역분개하고 은행 거래내역을 다시 받아
   다시 전표를 만들어 달라는 지시를 하였을 때 핀테크 팀장이 행할 수 있도록.」

   ⚠️ 이 파일이 지키는 것 셋 —

   ① **쪼개기까지가 AI, 승인은 사람.** 조직 원천(corpOrg M2)이 「전표 승인」·「월마감 확정」·
      「전표 삭제」를 cannot 으로 적어 두었다. 지시를 받았다고 그 선을 넘지 않는다.
      핀테크가 하는 일은 **대상을 고르고 초안을 만드는 것**까지다.

   ② **못 알아들으면 되묻는다.** 날짜를 지어내지 않고, 모르는 행위를 비슷한 것으로 바꾸지
      않는다. 알아들은 것은 **되읽어 주고** 조성래님이 보고 고칠 수 있게 한다.
      지금까지는 「역분개해 줘」가 조용히 「전표 현황」 표로 답했다 — 거절보다 나쁘다.
      거절은 못 한다고 말하지만, 그건 딴 소리를 하면서 답한 척한 것이다.

   ③ **반쯤 하다 멈춘 자리를 남긴다.** 조성래님 지시 한 문장에 성격이 다른 셋이 들어 있다 —
      역분개(기계가 초안까지) · 은행 내역 다시 받기(사람이 올려야 한다) · 전표 다시 만들기
      (앞 둘이 끝나야 한다). 브라우저가 닫혀도 「어디까지 했는지」가 남아야 한다.
      그래서 대화 기록이 아니라 **따로 적는다**(대화 기록은 40턴만 남기고 잘린다).
   ══════════════════════════════════════════════════════════════════════════ */

const CORP_ORDER_KEY = "hifin_corp_task";

/* ── ① 낱말 사전 — 아는 것만 적는다 ──────────────────────────────────────
   모르는 말을 비슷한 것으로 바꾸지 않는다. 사전에 없으면 되묻는다. */
const CORP_ORD_ACT = [
  { k: "reverse", ko: "역분개", who: "ai",
    w: ["역분개", "반대분개", "역분계", "되돌려", "되돌리", "무효로", "취소 전표"],
    d: "그날 은행 내역에서 만든 전표를 **역분개 초안**으로 만듭니다(승인·전기는 사람이 합니다)" },
  /* ⚠️ who 가 **상황에 따라 바뀌는** 유일한 일이다. 저장소 폴더가 이어져 있으면 거기서
     가져올 수 있으니 내 몫이고, 안 이어져 있으면 조성래님이 올려 주셔야 하니 조성래님 몫이다.
     은행 계좌 자체를 여는 일은 **어느 쪽이든 못 한다** — 조성래님이 내려받아 저장소에 두셔야 한다. */
  { k: "refetch", ko: "은행 내역 가져오기", who: "human",
    w: ["다시 받", "다시 다운", "다시 내려", "다시 가져", "새로 받", "내려받", "다운받", "다시 조회", "가져와", "가져오"],
    d: "저장소 폴더가 이어져 있으면 제가 찾아 가져옵니다 — 은행 계좌 자체는 조성래님이 내려받아 저장소에 두셔야 합니다" },
  { k: "rebuild", ko: "전표 다시 만들기", who: "ai",
    w: ["다시 만들", "다시 전표", "전표를 다시", "재생성", "다시 쳐", "다시 작성", "새로 만들"],
    d: "올라온 은행 내역에서 전표를 다시 만듭니다(역분개가 전기된 뒤에만 됩니다)" },
];
/* 행위를 못 알아들었을 때 **되묻는 말**에 쓸 목록 — 아는 것만 늘어놓는다 */
function corpOrdActs() { return CORP_ORD_ACT.map(function (a) { return a.ko; }); }

/* ── ② 날짜 — 지어내지 않는다 ────────────────────────────────────────────
   ⚠️ 연도가 없으면 **가정했다고 말한다.** 「12월 15일」을 1월에 말하면 작년일 수 있다.
      기계가 말없이 정하면 엉뚱한 날의 전표를 역분개한다. */
function corpOrdPad(n) { return String(n).padStart(2, "0"); }
function corpOrdDate(q, todayIso) {
  const s = String(q || "");
  const today = /^\d{4}-\d{2}-\d{2}$/.test(todayIso || "") ? todayIso : "";
  /* 그 달에 **실제로 있는 날**인지 센다 — 2월 30일은 없다. 31로만 거르면 만들어진다. */
  const dim = function (Y, M) {
    const t = [31, (Y % 4 === 0 && Y % 100 !== 0) || Y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return t[M - 1] || 0;
  };
  const mk = function (y, m, d, assumed, why) {
    const Y = +y, M = +m, D = +d;
    if (!(M >= 1 && M <= 12 && D >= 1 && D <= dim(Y, M))) return null;
    return { iso: Y + "-" + corpOrdPad(M) + "-" + corpOrdPad(D), assumed: !!assumed, why: why || "" };
  };
  /* ⓐ 연도까지 적힌 것 — 가장 확실하다 */
  let m = /(\d{4})[-./년]\s*(\d{1,2})[-./월]\s*(\d{1,2})/.exec(s);
  if (m) { const r = mk(m[1], m[2], m[3], false); if (r) return r; }
  /* ⓑ 연도 없는 것 — 오늘의 연도로 읽되 **가정이라고 적는다** */
  m = /(\d{1,2})\s*월\s*(\d{1,2})\s*일?/.exec(s);
  if (!m) m = /(?:^|[^\d])(\d{1,2})[./](\d{1,2})(?:[^\d]|$)/.exec(s);
  if (m) {
    if (!today) return { iso: "", assumed: false, why: "연도가 적혀 있지 않고 오늘이 정해지지 않아 며칠인지 셀 수 없습니다" };
    const r = mk(today.slice(0, 4), m[1], m[2], true, "연도를 적지 않으셔서 올해(" + today.slice(0, 4) + "년)로 읽었습니다");
    if (r) return r;
  }
  /* ⓒ 어제·오늘 */
  if (/어제|전일|지난날/.test(s)) {
    if (!today) return { iso: "", assumed: false, why: "오늘이 정해지지 않아 어제를 셀 수 없습니다" };
    const y = typeof corpBjvShiftDay === "function" ? corpBjvShiftDay(today, -1) : "";
    return { iso: y, assumed: true, why: "「어제」를 " + y + " 로 읽었습니다" };
  }
  if (/오늘|금일/.test(s)) {
    if (!today) return { iso: "", assumed: false, why: "오늘이 정해지지 않았습니다" };
    return { iso: today, assumed: true, why: "「오늘」을 " + today + " 로 읽었습니다" };
  }
  return { iso: "", assumed: false, why: "며칠 것인지 적어 주세요(예: 11월 11일 · 2026-11-11)" };
}

/* ── ③ 지시 읽기 — 알아들은 것만 돌려준다 ──────────────────────────────── */
function corpOrdParse(q, todayIso) {
  const s = String(q || "");
  const acts = CORP_ORD_ACT.filter(function (a) {
    return a.w.some(function (w) { return s.replace(/\s/g, "").indexOf(w.replace(/\s/g, "")) >= 0; });
  });
  const date = corpOrdDate(s, todayIso);
  return { q: s, acts: acts, date: date };
}

/* ── ④ 대상 고르기 — 「모두」가 어디까지인가 ────────────────────────────
   조성래님 확정(2026-11-12): **은행 내역에서 만든 전표만**(by = "은행반입").
   손으로 넣은 전표를 같이 역분개하면 은행 재반입으로 복구되지 않아 영영 되돌릴 수 없다.
   ⚠️ 전기(posted)된 것만 센다 — 기표·검토는 장부에 올라가 있지 않아, 역분개해 봤자
      효과 0인 유령 두 장만 남는다(실측). 그건 역분개가 아니라 **물리는 것**이 맞다. */
/* 「은행 내역에서 나온 것」의 범위 — 작성자가 **사람이 아닌** 전표다.
   ⚠️ 「은행반입」(은행 대사 지면)만 보면 안 된다. 자료 반입 창구로 올린 전표는 by 가 「반입」이고,
      그것도 은행 내역에서 나온 것이라 은행 파일을 다시 올리면 복구된다(실측).
      손으로 적은 전표(by 가 사람 이름)만 건드리지 않는다 — 그건 재반입으로 돌아오지 않는다. */
const CORP_ORD_FROMBANK = ["은행반입", "반입"];
function corpOrdFromBank(j) { return CORP_ORD_FROMBANK.indexOf(String((j && j.by) || "")) >= 0; }

function corpOrdTargets(jvs, iso) {
  const all = jvs || [];
  const day = all.filter(function (j) { return j.d === iso; });
  const bank = day.filter(corpOrdFromBank);
  const posted = bank.filter(function (j) { return j.st === "posted"; });
  /* 이미 역분개된 것은 빼고, 왜 뺐는지 적는다 */
  const revd = {};
  all.forEach(function (j) { if (j.rev) revd[j.rev] = j.id; });
  const hit = posted.filter(function (j) { return !revd[j.id]; });
  const already = posted.filter(function (j) { return !!revd[j.id]; })
    .map(function (j) { return { id: j.id, by: revd[j.id] }; });
  return {
    rows: hit, n: hit.length,
    day: day.length, bank: bank.length,
    draft: bank.filter(function (j) { return j.st !== "posted"; }),
    hand: day.filter(function (j) { return !corpOrdFromBank(j); }),
    /* 은행줄과 **직접 짝이 지어진** 것과 아닌 것을 가른다 — 복구가 보장되는 범위가 다르다 */
    linked: hit.filter(function (j) { return !!j.bk; }).length,
    loose: hit.filter(function (j) { return !j.bk; }).length,
    already: already,
  };
}

/* ── ⑤ 역분개 초안 만들기 ────────────────────────────────────────────────
   ⚠️ 작성자는 **핀테크**다. 「조성래」로 적으면 승인 가능자가 조성래 한 명뿐이라
      「작성자 ≠ 승인자」에 걸려 **영원히 전기되지 않는다**(실측).
   ⚠️ 날짜는 조성래님 확정대로 **역분개한 날**이다. 원전표 날짜로 적으면 그 달이 마감돼 있을 때
      한 건도 들어가지 않는다. */
function corpOrdReverse(jvs, iso, atIso, ledger) {
  const T = corpOrdTargets(jvs, iso);
  const seq = {};
  (jvs || []).forEach(function (j) {
    const m = /^(\d{8})-(\d+)$/.exec(String(j.id || ""));
    if (!m) return;
    const d = m[1].slice(0, 4) + "-" + m[1].slice(4, 6) + "-" + m[1].slice(6, 8);
    if (!seq[d] || +m[2] > seq[d]) seq[d] = +m[2];
  });
  const made = [], held = [];
  T.rows.forEach(function (j) {
    const draft = typeof corpJvReverse === "function" ? corpJvReverse(j, "핀테크", atIso) : null;
    if (!draft) { held.push({ id: j.id, why: "역분개를 만들지 못했습니다" }); return; }
    seq[atIso] = (seq[atIso] || 0) + 1;
    draft.id = typeof corpJvNo === "function" ? corpJvNo(atIso, seq[atIso])
      : atIso.replace(/-/g, "") + "-" + corpOrdPad(seq[atIso]);
    const chk = typeof corpJvCheck === "function" ? corpJvCheck(draft, ledger) : { ok: true, errs: [] };
    if (!chk.ok) { seq[atIso]--; held.push({ id: j.id, why: chk.errs.join(" · ") }); return; }
    made.push(draft);
  });
  return { made: made, held: held, target: T };
}

/* ── ⑥ 전표 다시 만들기 — 앞에 매여 있다 ────────────────────────────────
   선행조건이 **둘**이다. 하나만 보면 장부가 두 배가 된다(실측 — 역분개가 기표인 채로
   다시 만들면 103 잔액이 은행보다 많아지는데 항등식 13개가 전부 녹색이었다). */
function corpOrdCanRebuild(jvs, iso, led, todayIso) {
  const T = corpOrdTargets(jvs, iso);
  const all = jvs || [];
  const revOf = {};
  all.forEach(function (j) { if (j.rev) revOf[j.rev] = j; });
  const orig = all.filter(function (j) { return j.d === iso && corpOrdFromBank(j) && j.st === "posted"; });
  const notYet = orig.filter(function (j) { const r = revOf[j.id]; return !r || r.st !== "posted"; });
  const due = typeof corpBjvDue === "function" ? corpBjvDue(led && led.bankCov, todayIso) : { ok: false, ko: "셀 수 없습니다" };
  const bankN = ((led && led.bank) || []).filter(function (l) { return l.d === iso; }).length;
  const need = [];
  if (notYet.length) need.push("역분개 " + notYet.length + "건이 아직 전기되지 않았습니다 — 전표 지면에서 검토 · 승인해 주세요");
  if (!bankN) need.push(iso + " 자 은행 내역이 담겨 있지 않습니다 — 은행 대사 지면에서 올려 주세요");
  return { ok: need.length === 0, need: need, notYet: notYet, bankN: bankN, due: due, target: T };
}

/* ── ⑦ 할 일로 쪼개기 ────────────────────────────────────────────────────
   한 문장에 일이 여럿이면 **차례대로** 세운다. 앞 단계가 안 끝나면 뒤는 잠겨 있다.
   단계마다 **누가 하는지**를 적는다 — 이게 이 화면의 본체다. */
function corpOrdSteps(parsed, jvs, led, todayIso, fs) {
  const iso = parsed.date.iso;
  const F = fs || null;
  const out = [];
  parsed.acts.forEach(function (a) {
    if (a.k === "reverse") {
      const T = corpOrdTargets(jvs, iso);
      out.push({
        k: "reverse", ko: "역분개 초안 만들기", who: "ai", d: a.d,
        n: T.n, can: T.n > 0,
        why: T.n > 0 ? "" : (T.day === 0
          ? iso + " 자 전표가 장부에 없습니다"
          : (T.bank === 0 ? iso + " 자 전표 " + T.day + "건은 모두 손으로 적은 것입니다 — 은행 내역에서 나온 전표만 역분개합니다"
            : "은행 전표 " + T.bank + "건이 있지만 전기된 것이 없거나 이미 역분개되었습니다")),
        note: [
          T.hand.length ? "손으로 적은 전표 " + T.hand.length + "건은 **건드리지 않습니다**(은행 파일을 다시 올려도 돌아오지 않습니다)" : "",
          T.loose ? "그중 " + T.loose + "건은 은행줄과 직접 짝이 지어져 있지 않습니다 — 같은 날 은행 내역을 올리시면 다시 만들어지지만, 짝을 제가 보증하지는 못합니다" : "",
          T.draft.length ? "아직 전기되지 않은 " + T.draft.length + "건은 역분개 대상이 아닙니다(장부에 올라가 있지 않습니다)" : "",
          T.already.length ? "이미 역분개된 " + T.already.length + "건은 뺐습니다" : "",
        ].filter(Boolean),
      });
    } else if (a.k === "refetch") {
      /* 저장소가 이어져 있고 **그날 것이 하나뿐**이면 내가 가져온다.
         여럿이면 고르지 않는다 — 수정일이 파일명 날짜와 어긋나는 것이 실제로 있어,
         기계가 집으면 틀린 달의 장부가 선다. */
      const M = F && F.match;
      const mine = !!(F && F.linked && M && M.n === 1);
      out.push({
        k: "refetch", ko: "은행 내역 가져오기", who: mine ? "ai" : "human", d: a.d,
        n: M ? M.n : null, can: mine,
        why: mine ? "" : (!F || !F.linked
          ? "저장소 폴더가 아직 이어져 있지 않습니다 — 자료실이나 은행 대사 지면에서 한 번 이어 주시면 제가 찾아 가져옵니다. 그 전까지는 조성래님이 올려 주셔야 합니다"
          : (F.scope && !F.scope.ok ? F.scope.why
            : (M ? M.why : "저장소에서 찾지 못했습니다"))),
        pick: mine ? M.only : null,
        list: M ? (M.n > 1 ? M.exact : M.month) : [],
        note: [
          F && F.linked && F.scope && F.scope.dir ? "저장소의 **" + F.scope.dir + "** 안만 봅니다(회계 자료가 거기 있습니다)" : "",
          mine ? "그날 것이 하나뿐이라 그걸 씁니다 — 고른 것이 아니라 그것밖에 없는 것입니다" : "",
          M && M.n > 1 ? "여럿이라 **제가 고르지 않습니다** — 아래에서 골라 주세요" : "",
          "은행 계좌 자체는 제가 열지 못합니다 — 조성래님이 내려받아 저장소에 두셔야 합니다",
        ].filter(Boolean),
      });
    } else if (a.k === "rebuild") {
      const C = corpOrdCanRebuild(jvs, iso, led, todayIso);
      out.push({
        k: "rebuild", ko: "전표 다시 만들기", who: "ai", d: a.d,
        n: C.bankN, can: C.ok,
        why: C.ok ? "" : C.need.join(" · "),
        note: ["앞의 두 단계가 끝나야 열립니다 — 역분개가 전기되지 않은 채로 다시 만들면 같은 거래가 두 번 섭니다"],
      });
    }
  });
  return out;
}

/* ── ⑧ 대화에서 부르는 자리 — 못 알아들으면 되묻는다 ──────────────────── */
function corpOrderPlan(q, ctx) {
  const todayIso = (ctx && ctx.today) ||
    (typeof corpOpsToday === "function" ? corpOpsToday(ctx && ctx.now) : "");
  const P = corpOrdParse(q, todayIso);
  if (!P.acts.length) {
    return { kind: "ask", t: "무엇을 해 드릴지 알아듣지 못했습니다 — 지어내지 않겠습니다. 제가 할 수 있는 일은 이것뿐입니다: "
      + corpOrdActs().join(" · ") + ".", tools: corpOrdActs() };
  }
  if (!P.date.iso) {
    return { kind: "ask", t: P.date.why + " (" + P.acts.map(function (a) { return a.ko; }).join(" · ") + " 를 하려면 날짜가 있어야 합니다)",
      tools: corpOrdActs() };
  }
  const led = typeof corpLedgerRead === "function" ? corpLedgerRead() : { jv: [], bank: [] };
  const jvs = typeof corpJvAll === "function" ? corpJvAll(led) : [];
  const steps = corpOrdSteps(P, jvs, led, todayIso, ctx && ctx.fs);
  const head = "**" + P.date.iso + "** 로 읽었습니다"
    + (P.date.assumed ? "(" + P.date.why + " — 다르면 날짜를 적어 다시 말씀해 주세요)" : "")
    + ". 할 일 " + steps.length + "가지로 나눴습니다. 승인 · 전기는 조성래님이 하십니다.";
  return { kind: "order", t: head, order: { q: String(q || ""), iso: P.date.iso, assumed: !!P.date.assumed, steps: steps, at: todayIso } };
}

/* ── ⑨ 작업 기록 — 반쯤 하다 멈춘 자리가 남아야 한다 ────────────────────
   ⚠️ 대화 기록(hifin_corp_chat)에 넣지 않는다 — 40턴만 남기고 잘리고, 형제 필드를
      다음 읽기에서 버린다(실측). 지시는 며칠 걸릴 수 있으니 따로 적는다. */
function corpOrderRead() {
  const empty = { v: 1, tasks: [] };
  try {
    const raw = localStorage.getItem(CORP_ORDER_KEY);
    if (!raw) return empty;
    const o = JSON.parse(raw);
    return { v: 1, tasks: Array.isArray(o && o.tasks) ? o.tasks : [] };
  } catch (e) { return empty; }
}
function corpOrderWrite(st) {
  try { localStorage.setItem(CORP_ORDER_KEY, JSON.stringify({ v: 1, tasks: (st && st.tasks || []).slice(-60) })); return true; }
  catch (e) { return false; }
}
/* 지시 하나에 번호를 준다 — 같은 지시를 두 번 눌러도 두 번 집행되지 않게 */
function corpOrdId(iso, at, n) { return "WO-" + String(iso || "").replace(/-/g, "") + "-" + corpOrdPad(n || 1); }
function corpOrdNextId(st, iso, at) {
  const pre = "WO-" + String(iso || "").replace(/-/g, "") + "-";
  let max = 0;
  ((st && st.tasks) || []).forEach(function (t) {
    const id = String(t.id || "");
    if (id.indexOf(pre) !== 0) return;
    const n = +id.slice(pre.length);
    if (n > max) max = n;
  });
  return corpOrdId(iso, at, max + 1);
}

/* ── ⑩ 검산 — 화면과 커밋 게이트 러너가 이 함수 하나를 같이 본다 ────────
   ⚠️ 양성만 세면 아무것도 안 하는 코드가 만점을 받는다. 음성 표본을 함께 넣는다. */
const CORP_ORD_T_OK = [
  "11월 11일 전표를 모두 역분개해 줘",
  "2026-11-11 역분개 해줘",
  "어제 은행 전표 되돌려 줘",
  "11/11 전표 다시 만들어 줘",
  "11월 11일 전표 역분개하고 은행 내역 다시 받아서 다시 전표 만들어 줘",
];
const CORP_ORD_T_ASK = [
  "전표 좀 어떻게 해 줘",            /* 무엇을 할지 모른다 */
  "역분개해 줘",                      /* 며칠 것인지 모른다 */
  "다 되돌려 줘",                     /* 날짜가 없다 */
  "지난주 거 정리해 줘",              /* 행위도 날짜도 흐릿하다 */
];
function corpOrdSelfTest(todayIso) {
  const today = todayIso || "2026-11-12";
  const ok = CORP_ORD_T_OK.map(function (q) { return { q: q, p: corpOrdParse(q, today) }; });
  const ask = CORP_ORD_T_ASK.map(function (q) { return { q: q, p: corpOrdParse(q, today) }; });
  const d = function (q) { return corpOrdDate(q, today); };
  return [
    { k: "act", ko: "할 일을 알아듣는다", n: ok.length,
      ok: ok.every(function (x) { return x.p.acts.length > 0; }),
      got: ok.filter(function (x) { return !x.p.acts.length; }).map(function (x) { return x.q; }).join(" / ") || "전건",
      want: "전건" },
    { k: "date", ko: "날짜를 알아듣는다", n: ok.length,
      ok: ok.every(function (x) { return !!x.p.date.iso; }),
      got: ok.filter(function (x) { return !x.p.date.iso; }).map(function (x) { return x.q; }).join(" / ") || "전건",
      want: "전건" },
    { k: "iso", ko: "같은 날을 가리킨다", n: 4,
      ok: d("11월 11일").iso === "2026-11-11" && d("2026-11-11").iso === "2026-11-11"
        && d("11/11").iso === "2026-11-11" && d("어제").iso === "2026-11-11",
      got: [d("11월 11일").iso, d("2026-11-11").iso, d("11/11").iso, d("어제").iso].join(" "), want: "전부 2026-11-11" },
    { k: "assumed", ko: "연도를 지어냈으면 **그렇게 적는다**", n: 2,
      ok: d("11월 11일").assumed === true && d("2026-11-11").assumed === false
        && (d("11월 11일").why || "").length > 0,
      got: JSON.stringify([d("11월 11일").assumed, d("2026-11-11").assumed]), want: "[true,false]" },
    { k: "ask", ko: "못 알아들으면 **되묻는다**(지어내지 않는다)", n: ask.length,
      ok: ask.every(function (x) { return x.p.acts.length === 0 || !x.p.date.iso; }),
      got: ask.filter(function (x) { return x.p.acts.length > 0 && x.p.date.iso; }).map(function (x) { return x.q; }).join(" / ") || "전건 되묻기",
      want: "전건 되묻기" },
    { k: "multi", ko: "한 문장에 든 일 셋을 모두 집는다", n: 3,
      ok: corpOrdParse(CORP_ORD_T_OK[4], today).acts.length === 3,
      got: corpOrdParse(CORP_ORD_T_OK[4], today).acts.map(function (a) { return a.ko; }).join(" · "),
      want: "역분개 · 은행 내역 다시 받기 · 전표 다시 만들기" },
    { k: "noday", ko: "오늘을 모르면 「어제」를 지어내지 않는다", n: 1,
      ok: corpOrdDate("어제 역분개", "").iso === "" && (corpOrdDate("어제 역분개", "").why || "").length > 0,
      got: JSON.stringify(corpOrdDate("어제 역분개", "")), want: "빈 날짜 + 이유" },
    { k: "bad", ko: "없는 날짜를 만들지 않는다", n: 2,
      ok: corpOrdDate("13월 40일", today).iso === "" && corpOrdDate("2026-02-30", today).iso !== "2026-02-30",
      got: [corpOrdDate("13월 40일", today).iso, corpOrdDate("2026-02-30", today).iso].join(" / "), want: "둘 다 안 만든다" },
    { k: "who", ko: "단계마다 누가 하는지 적혀 있다", n: CORP_ORD_ACT.length,
      ok: CORP_ORD_ACT.every(function (a) { return a.who === "ai" || a.who === "human"; }),
      got: CORP_ORD_ACT.map(function (a) { return a.ko + "=" + a.who; }).join(" · "), want: "전건" },
    { k: "human", ko: "은행에서 가져오는 일은 **사람 몫**이라고 적혀 있다", n: 1,
      ok: (CORP_ORD_ACT.find(function (a) { return a.k === "refetch"; }) || {}).who === "human",
      got: (CORP_ORD_ACT.find(function (a) { return a.k === "refetch"; }) || {}).who, want: "human" },
  ];
}
function corpOrdVerdict(todayIso) {
  const rows = corpOrdSelfTest(todayIso);
  const zero = rows.filter(function (r) { return !(r.n > 0); });
  const fail = rows.filter(function (r) { return !r.ok; });
  return { rows: rows, pass: fail.length === 0 && zero.length === 0, fail: fail, zero: zero };
}
