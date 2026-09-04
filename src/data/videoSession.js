/* ══════════════ 영상 상담 세션 엔진(videoSession.js) — 영상 V0 (형 승인 2026-09-03) ══════════════
   원천 사상: 설계 프롬프트 v1.1 — 영상은 「네 번째 채널」이다. 전화·문자·앱알림 옆에 나란히 서고,
   그 안에서 진료·검진·구매가 일어나지 않는다(§0-V10 — 가리킬 뿐 대행하지 않는다).
   ⚠️ 원칙:
     · 영상은 회원이 켠다(§0-V7) — 프로는 요청만 하고, 수락은 회원 화면에서만 일어난다.
       이 파일에 「프로가 연결한다」에 해당하는 함수는 존재하지 않는다.
     · 녹화하지 않는다(§0-V8) — 세션 레코드에 미디어 필드가 없다. 저장 경로 자체를 만들지 않는다.
     · 요청도 접촉이다 — 락·동의·접촉 보류·재요청 한도를 통과하지 못하면 요청이 생성되지 않는다.
     · 때를 정하는 쪽은 회원이다(형 지시 2026-09-04) — 시간대 제약은 없다. 다만 「없다」가
       「아무 때나 걸어도 된다」는 뜻은 아니다. 먼저 여쭙고 회원이 좋다고 한 때가 상담 시간이다.
     · 규격 상수는 VIDEO_SPEC 단일 소스 — 화면·러너·관제가 같은 값을 읽는다(일수·횟수 하드코딩 분산 금지). */

const VIDEO_SPEC = {
  modes: ["text", "voice", "video"],  /* 회원이 언제든 오르내린다 — 낮추는 것은 항상 허용 */
  startMode: "voice",                 /* 권고: 음성으로 시작해 영상으로 승격(첫 연결의 부담 완화) */
  reRequestMax: 1,                    /* 재요청 1회 한도 — 거절 후 같은 통화에서 다시 묻지 않는다 */
  ringSec: 45,                        /* 호출 대기 — 지나면 무응답 만료(거절과 다르게 집계) */
  /* 시간대 상수 없음 — 회원이 원하는 때가 시간이다(형 확정 2026-09-04).
     광고성 알림의 야간 미발송(21~08시)은 별개 규칙이고 그대로 살아 있다 — 그건 광고고 이건 상담이다.
     상수를 남겨두지 않는 이유: 죽은 상수는 화면·하이 답변을 통해 없어진 규칙을 계속 말하게 된다. */
  summaryRequired: true,              /* 종료 시 요약 필수 — 요약 없이 세션이 닫히지 않는다 */
  recording: false,                   /* 녹화하지 않는다 — 이 값은 스위치가 아니라 명문이다 */
  consentKind: "v1",                  /* 영상 상담 이용 동의(V1에서 화면·문안 확정) */
};

/* 시드 — _hmHash(djb2)를 그대로 %100 하면 다른 키와 하위 비트가 상관돼 조건부 분포가 무너진다.
   실측(2026-09-03): 「v1 동의 보유자 중 무응답 시드(<12)」가 21.9%로 기대 12%의 두 배였다.
   murmur3 finalizer로 한 번 섞으면 11.4%로 수렴한다. 신규 시드는 반드시 이 함수를 쓴다.
   (기존 시드의 같은 편향은 스냅샷 전체가 흔들리므로 별도 과제 — 형 보고 2026-09-03) */
function _vsSeed(key) {
  let x = (typeof _hmHash === "function") ? _hmHash(key) : 0;
  x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13; x = Math.imul(x, 3266489917) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

/* 상태 — 전이는 아래 VS_EDGES에만 존재한다(임의 전이 금지) */
const VS_STATES = {
  idle:       { ko: "대기",       end: false },
  requested:  { ko: "요청됨",     end: false, note: "회원 수락 대기 — 프로는 여기서 더 할 수 있는 일이 없다" },
  declined:   { ko: "거절",       end: true,  note: "회원이 사양 — 상담과 절차는 그대로 이어진다(§0-V7)" },
  expired:    { ko: "무응답",     end: true,  note: "호출 시간 초과 — 거절이 아니므로 재요청 1회가 남는다" },
  connected:  { ko: "연결됨",     end: false },
  ended:      { ko: "종료",       end: false, note: "요약 작성 전 — 아직 기록이 닫히지 않았다" },
  summarized: { ko: "요약 확인",  end: true,  note: "회원이 요약을 확인해야 접촉 기록이 확정된다(§0-V8)" },
};
const VS_EDGES = {
  idle:      ["requested"],
  requested: ["connected", "declined", "expired"],
  connected: ["ended"],
  ended:     ["summarized"],
  declined:  [], expired: [], summarized: [],
};

/* ── 게이트 — 요청이 생성될 수 있는가(락·동의·접촉 보류·재요청 한도) ──
   반환의 ok가 false면 화면에 버튼이 없어야 한다(문구 숨김이 아니라 부재 — §0-V2와 같은 방식). */
function vsGateOf(ref, opt) {
  const o = opt || {};
  const i = (typeof ref === "number") ? ref : null;
  const m = (i == null) ? ref : null;
  const out = { ok: false, why: "", code: "" };

  /* ① 락 — 요청도 접촉이다 */
  let locked = false, lockWhy = "";
  if (i != null) {
    try { const c = (typeof cycleOf === "function") ? cycleOf(i) : null;
      if (c && (c.t === "T0" || c.t === "T1")) { locked = true; lockWhy = c.ko; } } catch (e) {}
  } else if (m) {
    try { const lk = (typeof hmLockState === "function") ? hmLockState(m) : null;
      if (lk && lk.locked) { locked = true; lockWhy = lk.why || "검진결과 수령 전"; } } catch (e) {}
  }
  if (locked) { out.code = "lock"; out.why = "접촉 금지 구간이에요(" + lockWhy + ") — 결과가 도착하면 하이가 자동으로 열어 드려요."; return out; }

  /* ② 접촉 보류(G8) — 채널이 늘었다고 접촉 총량이 늘지 않는다 */
  if (i != null) {
    try { const g = (typeof gSegOf === "function") ? gSegOf(i) : null;
      if (g && (g.blocked || (g.segs || []).indexOf("G8") >= 0)) {
        out.code = "hold"; out.why = "접촉 보류 대상이에요 — 민원 예방을 위해 어떤 채널로도 연락하지 않아요."; return out; } } catch (e) {}
  }

  /* ③ 동의 — 미보유면 요청 버튼이 없다 */
  let has = false;
  try { has = (typeof consentHas === "function") ? consentHas(VIDEO_SPEC.consentKind, i) : false; } catch (e) {}
  if (!has) { out.code = "consent"; out.why = "「영상 상담 이용」 동의가 없어요 — 전화·문자로 안내드려요."; return out; }

  /* ④ 재요청 한도 — 거절 뒤 다시 묻지 않는다(무응답은 한도를 쓰지 않는다).
     시간대 게이트를 걷어낸 뒤 이 한도가 접촉 총량의 유일한 제동이 되므로 실기록으로 배선한다
     — 인자로만 받으면 호출부가 넘기지 않는 한 영영 발동하지 않는 유령 규칙이 된다(V6+ 적발). */
  const tried = (o.declinedCount != null) ? Number(o.declinedCount) : vsDeclinedCount(ref);
  if (tried >= VIDEO_SPEC.reRequestMax) {
    out.code = "reask"; out.why = "이미 사양하셨어요 — 재요청은 " + VIDEO_SPEC.reRequestMax + "회까지예요."; return out;
  }
  out.ok = true; out.code = "open"; out.why = "요청 가능";
  return out;
}

/* ── 전이 — 허용된 간선만 통과한다 ── */
function vsCanMove(from, to) { return (VS_EDGES[from] || []).indexOf(to) >= 0; }
function vsMove(sess, to, meta) {
  if (!sess || !VS_STATES[to]) return { ok: false, why: "알 수 없는 상태예요" };
  if (!vsCanMove(sess.state, to)) return { ok: false, why: "허용되지 않은 전이예요(" + sess.state + "→" + to + ")" };
  sess.state = to;
  sess.trail.push({ to: to, at: (meta && meta.at) || null, by: (meta && meta.by) || "" });
  if (to === "connected") sess.mode = sess.mode || VIDEO_SPEC.startMode;
  /* 등재된 이름·화이트리스트 키(kind)만 쓴다 — 그 밖의 이름은 hiEvent가 조용히 버린다(§9) */
  try { const EV = { requested: "video_requested", connected: "video_connected", declined: "video_declined", summarized: "video_summarized" };
    if (EV[to]) hiEvent(EV[to], { kind: to }); } catch (e) {}
  return { ok: true, state: to };
}

/* 요청 — 프로가 할 수 있는 유일한 시작 행위(§0-V7). 게이트를 통과하지 못하면 세션이 생기지 않는다 */
function vsRequest(ref, opt) {
  const g = vsGateOf(ref, opt);
  if (!g.ok) { try { hiEvent("video_blocked", { kind: g.code }); } catch (e) {} return { ok: false, why: g.why, code: g.code }; }
  const sess = { state: "idle", mode: null, trail: [], shared: [], summary: null,
                 declinedCount: Number((opt && opt.declinedCount) || 0) };
  vsMove(sess, "requested", { by: "pro" });
  return { ok: true, sess: sess };
}
/* 수락·거절 — 회원만 호출한다. 프로 화면에는 이 두 함수를 부르는 버튼이 없다 */
function vsAccept(sess) { return vsMove(sess, "connected", { by: "member" }); }
function vsDecline(sess, ref) { const r = vsMove(sess, "declined", { by: "member" }); if (r.ok) { sess.declinedCount++; vsDeclineRecord(ref); } return r; }
function vsExpire(sess)  { return vsMove(sess, "expired", { by: "system" }); }

/* 거절 이력 — 세션 객체는 화면을 닫으면 사라지므로, 한도가 실제로 작동하려면 남아야 한다.
   기록하는 것은 「사양하셨다」는 사실과 날짜뿐 — 이유도 내용도 남기지 않는다. */
const _VS_DECL_KEY = "hifin_video_decl_";
function _vsRefKey(ref) {
  if (ref == null) return null;
  if (typeof ref === "number") return "i" + ref;
  return ref.email ? String(ref.email) : null;
}
function vsDeclineRecord(ref) {
  const k = _vsRefKey(ref); if (!k) return { ok: false };
  try {
    const key = _VS_DECL_KEY + k;
    const l = JSON.parse(localStorage.getItem(key) || "[]");
    l.push({ at: Date.now() });
    localStorage.setItem(key, JSON.stringify(l));
  } catch (e) {}
  return { ok: true };
}
function vsDeclinedCount(ref) {
  const k = _vsRefKey(ref); if (!k) return 0;
  try { return (JSON.parse(localStorage.getItem(_VS_DECL_KEY + k) || "[]")).length; } catch (e) { return 0; }
}

/* 모드 — 낮추는 것은 언제나 허용, 올리는 것은 회원 조작으로만(§0-V7) */
function vsSetMode(sess, mode, by) {
  if (!sess || sess.state !== "connected") return { ok: false, why: "연결 중에만 바꿀 수 있어요" };
  const cur = VIDEO_SPEC.modes.indexOf(sess.mode), nx = VIDEO_SPEC.modes.indexOf(mode);
  if (nx < 0) return { ok: false, why: "알 수 없는 모드예요" };
  if (nx > cur && by !== "member") return { ok: false, why: "영상은 회원이 켜요 — 프로는 요청만 할 수 있어요." };
  sess.mode = mode;
  try { hiEvent("video_connected", { kind: "mode-" + mode }); } catch (e) {}
  return { ok: true, mode: mode };
}
/* 품질 저하 폴백 — 시스템이 자동으로 낮춘다(올리지는 않는다) */
function vsDegrade(sess) {
  if (!sess || sess.state !== "connected") return { ok: false };
  const cur = VIDEO_SPEC.modes.indexOf(sess.mode);
  if (cur <= 0) return { ok: false, why: "더 낮출 수 없어요" };
  sess.mode = VIDEO_SPEC.modes[cur - 1];
  try { hiEvent("video_connected", { kind: "degrade-" + sess.mode }); } catch (e) {}
  return { ok: true, mode: sess.mode };
}

/* ── 종료·요약(영상 V4) — 요약 없이 닫히지 않는다. 남는 것은 요약뿐이다(§0-V8) ──
   요약도 기록이므로 활동결과 메모와 같은 사전을 받는다(§0-B — 금지어 스캔 통과분만 저장).
   그래서 여기서 새 규칙을 만들지 않고, 대본·메모가 쓰는 검사를 그대로 불러 쓴다. */
const VS_SUMMARY_SPEC = {
  minLen: 8, maxLen: 200,
  numeric: /\d+\s*(mmHg|mg\/dL|mmol|IU|%|점)/,   /* 원본 수치는 요약에도 남기지 않는다(화면 규격과 동일) */
};
/* 요약 초안 부품 — 창작하지 않고 조립한다(§0-V6 AI는 초안까지·발행은 사람 검수 뒤).
   프로가 그대로 쓸 수도, 고쳐 쓸 수도 있다. 어느 쪽이든 저장 전에 같은 검사를 받는다. */
const VS_SUMMARY_PARTS = {
  head: "검진 결과에서 확인이 필요한 부분을 설명드렸어요.",
  share: "함께 본 화면 — ",
  act: "다음 할 일로 {개입}을 안내드렸어요.",
  tail: "궁금하신 점은 언제든 말씀해 주시기로 했어요.",
};
function vsSummaryCheck(text) {
  const t = String(text || "").trim();
  if (t.length < VS_SUMMARY_SPEC.minLen) return { ok: false, why: t ? "요약이 너무 짧아요(" + VS_SUMMARY_SPEC.minLen + "자 이상)" : "요약 없이 기록을 닫을 수 없어요" };
  if (t.length > VS_SUMMARY_SPEC.maxLen) return { ok: false, why: "요약이 너무 길어요(" + VS_SUMMARY_SPEC.maxLen + "자 이내) — 무엇을 하기로 했는지만 남겨요." };
  if (typeof HM_BANNED !== "undefined" && HM_BANNED.some((w) => t.indexOf(w) >= 0))
    return { ok: false, why: "금칙어가 포함돼 있어요 — 단정·과장 표현은 요약에 남길 수 없어요." };
  try { const hits = hmForbiddenScan(t); if (hits.length) return { ok: false, why: "요약에 쓸 수 없는 표현이 있어요: " + hits[0].ko }; } catch (e) {}
  if (VS_SUMMARY_SPEC.numeric.test(t)) return { ok: false, why: "원본 수치는 요약에 남기지 않아요 — 구간·등급 표현으로 적어 주세요." };
  return { ok: true };
}
/* 초안 — 이번 통화에서 실제로 일어난 것만으로 만든다(띄운 화면·발행한 개입) */
function vsSummaryDraft(sess, card) {
  const parts = [VS_SUMMARY_PARTS.head];
  const sh = (sess && sess.shared) || [];
  if (sh.length) parts.push(VS_SUMMARY_PARTS.share + sh.map((k) => (VS_SHARE_DOCS[k] || {}).ko || k).join(" · ") + ".");
  /* 발행한 개입이 있으면 그것을, 없으면 권장 1순위를 적는다 — 어느 쪽이든 실제로 있었던 것만 */
  const iss = (sess && sess.issued) || [];
  const names = iss.length
    ? iss.map((k) => ((typeof INTERVENTIONS !== "undefined" && INTERVENTIONS[k]) || {}).ko || k)
    : (card && card.actions && card.actions[0] ? [card.actions[0].ko] : []);
  if (names.length) parts.push(VS_SUMMARY_PARTS.act.replace("{개입}", names.join(" · ")));
  parts.push(VS_SUMMARY_PARTS.tail);
  let t = parts.join(" ");
  if (t.length > VS_SUMMARY_SPEC.maxLen) t = parts.slice(0, 3).join(" ");
  return t;
}
function vsEnd(sess) { return vsMove(sess, "ended", { by: "either" }); }
function vsSummarize(sess, text, confirmedByMember) {
  if (!sess || sess.state !== "ended") return { ok: false, why: "종료 후에만 요약할 수 있어요" };
  const chk = vsSummaryCheck(text);
  if (!chk.ok) return chk;
  if (!confirmedByMember) return { ok: false, why: "회원 확인 전이에요 — 확인해야 기록이 확정돼요." };
  sess.summary = { text: String(text).trim(), confirmed: true, shared: ((sess.shared || []).slice()) };
  return vsMove(sess, "summarized", { by: "member" });
}

/* ── 화면 공유(영상 V3) — §0-V9 「화면에 띄우는 것도 발화다」 ──
   공유는 말과 같은 규격을 받는다. 등재된 화면만 존재하고, 등재 밖 화면은 버튼 자체가 없다.
   ⚠️ 목록에 없는 것이 목록의 내용이다:
     · 원본 수치 화면 — 프로 콘솔에도 없는 화면이라 공유할 대상 자체가 없다(등급·구간 라벨만).
     · 제안 화면 — 영상 안에서 제안이 일어나지 않는다(§0-V10). 공유가 아니라 부재가 규격이다. */
const VS_SHARE_DOCS = {
  report: { ko: "AI 정밀리포트", need: "s4", stages: null,
            what: "등급·관리 필요 항목·구간 라벨 — 원본 수치는 이 화면에 없다" },
  kit:    { ko: "케어 키트 구성", need: "s4", stages: null,
            what: "지표군에 맞춘 영양·기기·식단·진료과" },
  plan:   { ko: "60일 터치 플랜", need: "s4", stages: null,
            what: "언제 무엇을 하는지 — 회원이 자기 일정으로 본다" },
  covmap: { ko: "보장맵", need: "n1", stages: ["T4", "T5", "T6"],
            what: "공백·중복·절감 — 계약 정보로만 만들어진 산출물",
            why: "건강관리 구간(T3)에서 띄우면 건강 이야기가 보장 이야기로 번진다(§0-P·§0-V9)" },
};
/* 등재 목록에 들어와서는 안 되는 것 — 러너가 이 사전으로 검사한다 */
const VS_SHARE_FORBIDDEN = /원본|수치|주민|식별번호|제안|청약|가입\s*설계|보험료/;

function vsShareGate(key, ref, opt) {
  const d = VS_SHARE_DOCS[key];
  if (!d) return { ok: false, code: "unlisted", why: "등재되지 않은 화면이에요 — 공유할 수 없어요." };
  const i = (typeof ref === "number") ? ref : null;
  /* ① 국면 — 보장맵은 만기 국면에서만 */
  if (d.stages) {
    let t = (opt && opt.stage) || null;
    if (!t && i != null) { try { const c = cycleOf(i); t = c && c.t; } catch (e) {} }
    if (!t || d.stages.indexOf(t) < 0)
      return { ok: false, code: "stage", why: "「" + d.ko + "」은 만기 국면(" + d.stages.join("·") + ")에서만 띄울 수 있어요 — 지금은 " + (t || "판정 불가") + "예요." };
  }
  /* ② 동의 — 없으면 화면이 열리지 않는다 */
  let has = false;
  try { has = consentHas(d.need, i); } catch (e) {}
  if (!has) return { ok: false, code: "consent", why: "「" + d.ko + "」을 띄우려면 해당 동의가 필요해요." };
  /* ③ 산출물 — 보장맵은 분석이 끝나야 존재한다 */
  if (key === "covmap" && i != null) {
    let map = null;
    try { const c = covAnalysisOf(i); map = c && c.map; } catch (e) {}
    if (!map) return { ok: false, code: "absent", why: "아직 보장맵이 만들어지지 않았어요." };
  }
  return { ok: true, code: "open", why: "공유 가능" };
}
/* 공유 실행 — 연결 중에만, 게이트를 통과한 화면만. 무엇을 띄웠는지가 기록에 남는다 */
function vsShareDoc(sess, key, ref, opt) {
  if (!sess || sess.state !== "connected") return { ok: false, why: "연결 중에만 화면을 띄울 수 있어요" };
  const g = vsShareGate(key, ref, opt);
  if (!g.ok) { try { hiEvent("video_blocked", { kind: "share-" + g.code, key: key }); } catch (e) {} return { ok: false, why: g.why, code: g.code }; }
  sess.shared.push(key);
  try { hiEvent("video_shared", { key: key }); } catch (e) {} 
  return { ok: true, doc: key, ko: VS_SHARE_DOCS[key].ko };
}

/* 세션에 미디어가 남아 있지 않은가 — §0-V8의 기계 검사(러너·게이트가 호출) */
const VS_MEDIA_KEYS = ["media", "recording", "record", "blob", "stream", "audio", "video", "frames", "url"];
function vsNoMediaScan(sess) {
  const bad = [];
  const walk = (o, path) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (VS_MEDIA_KEYS.indexOf(String(k).toLowerCase()) >= 0) bad.push((path ? path + "." : "") + k);
      if (o[k] && typeof o[k] === "object") walk(o[k], (path ? path + "." : "") + k);
    }
  };
  walk(sess, "");
  return { ok: bad.length === 0, bad: bad };
}

/* ══ 세그먼트 연결(영상 V5) ══════════════════════════════════════════════
   영상은 채널일 뿐이고, 활동은 개입이 잇는다(§0-V10). 이 절이 하는 일은 셋이다.
     ① 어떤 자리에서 영상이 값진가 — 새 세그먼트를 만들지 않고 기존 G에 적합도만 얹는다.
     ② 통화 중 개입 발행 — 발행이지 실행이 아니다. 회원이 자기 앱에서 한다.
     ③ 완결 회수 — 「연결됨」 사실만 돌아온다. 무엇을 진료했는지는 돌아오지 않는다. */

/* ① 채널 적합도 — 함께 볼 것이 있는 자리에서 영상의 값이 생긴다 */
const VS_SEG_FIT = {
  G2:  { fit: "high", why: "결과 리포트를 함께 본다 — 이 채널의 최대 가치" },
  G12: { fit: "high", why: "겹치는 계약 표는 말로 설명하기 가장 어렵다" },
  G3:  { fit: "high", why: "보장맵을 함께 본다(공유는 §0-V9 게이트를 통과해야 한다)" },
  G14: { fit: "mid",  why: "오래 끊긴 관계의 재연결에는 목소리보다 얼굴" },
  G8:  { fit: "none", why: "접촉 보류 — 채널이 늘었다고 접촉 총량이 늘지 않는다" },
};
function vsSegFit(i) {
  let segs = [];
  try { const g = gSegOf(i); segs = (g && g.segs) || []; } catch (e) {}
  if (segs.indexOf("G8") >= 0) return { fit: "none", seg: "G8", why: VS_SEG_FIT.G8.why };
  for (const k of ["G2", "G12", "G3", "G14"]) if (segs.indexOf(k) >= 0) return Object.assign({ seg: k }, VS_SEG_FIT[k]);
  return { fit: "low", seg: segs[0] || null, why: "전화로 충분한 자리 — 영상은 부담이 될 수 있다" };
}

/* ② 개입 발행 — 통화 중에 「가리키는」 행위. 여기서 활동이 실행되지 않는다 */
function vsIssueAction(sess, key, ref) {
  if (!sess || sess.state !== "connected") return { ok: false, why: "연결 중에만 발행할 수 있어요" };
  const iv = (typeof INTERVENTIONS !== "undefined") ? INTERVENTIONS[key] : null;
  if (!iv) return { ok: false, why: "등재되지 않은 개입이에요" };
  sess.issued = sess.issued || [];
  if (sess.issued.indexOf(key) >= 0) return { ok: false, why: "이미 발행했어요" };
  sess.issued.push(key);
  try { hiEvent("video_action_issued", { key: key, nav: iv.nav }); } catch (e) {}
  return { ok: true, key: key, ko: iv.ko, nav: iv.nav, tab: iv.tab || null, ev: iv.ev,
           note: "회원 앱의 「" + iv.ko + "」 화면으로 가는 길이 열렸어요 — 실행은 회원이 해요." };
}

/* ③ 완결 회수 — 저장은 회원의 것이고, 프로가 꺼내는 것은 사실뿐이다 */
const _VS_TELE_KEY = "hifin_tele_booked_";
function teleBookRecord(m, meta) {
  if (!m || !m.email) return { ok: false };
  try {
    const k = _VS_TELE_KEY + m.email;
    const l = JSON.parse(localStorage.getItem(k) || "[]");
    l.push({ at: Date.now(), hosp: (meta && meta.hosp) || "", dept: (meta && meta.dept) || "" });
    localStorage.setItem(k, JSON.stringify(l));
  } catch (e) {}
  try { hiEvent("tele_booked", { via: (meta && meta.via) || "member" }); } catch (e) {}
  return { ok: true };
}
/* 프로가 읽는 회수 — 병원·진료과·내용은 반환하지 않는다(§0-V10·데이터 경계) */
function teleDoneOf(m) {
  if (!m || !m.email) return { done: false };
  try {
    const l = JSON.parse(localStorage.getItem(_VS_TELE_KEY + m.email) || "[]");
    if (!l.length) return { done: false };
    const last = l[l.length - 1];
    return { done: true, n: l.length, at: new Date(last.at).toISOString().slice(0, 10) };
  } catch (e) { return { done: false }; }
}

/* ── 러너·관제 훅(관리자) ── */
try {
  if (typeof window !== "undefined") {
    window.__hifinVideo = function (cmd, a, b2) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "spec")   return VIDEO_SPEC;
        if (cmd === "states") return { states: VS_STATES, edges: VS_EDGES };
        if (cmd === "gate")   return vsGateOf(a, b2 || {});
        if (cmd === "declrec") return vsDeclineRecord(a);
        if (cmd === "declcnt") return { n: vsDeclinedCount(a) };
        if (cmd === "declclear") { try { localStorage.removeItem(_VS_DECL_KEY + _vsRefKey(a)); } catch (e) {} return { ok: true }; }
        if (cmd === "docs")   return { docs: VS_SHARE_DOCS, forbidden: String(VS_SHARE_FORBIDDEN) };
        if (cmd === "share")  return vsShareGate(a, (b2 && b2.i), b2 || {});
        if (cmd === "sumspec") return { spec: VS_SUMMARY_SPEC, parts: VS_SUMMARY_PARTS };
        if (cmd === "sumcheck") return vsSummaryCheck(a);
        if (cmd === "segfit")  return vsSegFit(Number(a));
        if (cmd === "evdefs") { const need = ["video_requested","video_connected","video_declined","video_blocked","video_shared","video_summarized","video_action_issued","tele_booked"];
          const defs = (typeof HI_EVENT_DEFS !== "undefined") ? HI_EVENT_DEFS : {};
          return { missing: need.filter((n) => !defs[n]), n: need.length }; }
        if (cmd === "issueprobe") {   /* 개입 발행 규격 — 정상·중복·등재 밖·미연결 */
          const s1 = { state: "connected", shared: [], issued: [] };
          const r1 = vsIssueAction(s1, "clinic", 7), r2 = vsIssueAction(s1, "clinic", 7), r3 = vsIssueAction(s1, "not_registered", 7);
          const r4 = vsIssueAction({ state: "ended", shared: [], issued: [] }, "clinic", 7);
          return { first: r1.ok, dup: r2.ok, unlisted: r3.ok, notConnected: r4.ok, nav: r1.nav || null, ev: r1.ev || null }; }
        if (cmd === "teledone") { const dm = (typeof demoMembers !== "undefined" ? demoMembers : []); const mm = dm.find((d) => d.email === a); return teleDoneOf(mm || { email: a }); }
        if (cmd === "telebook") { const dm = (typeof demoMembers !== "undefined" ? demoMembers : []); const mm = dm.find((d) => d.email === a); return teleBookRecord(mm || { email: a }, { hosp: "테스트병원", dept: "내과", via: "runner" }); }
        if (cmd === "sumdraft") { let card = null; try { card = buildHandoffCard(Number(a), { v2: true }); } catch (e) {}
          return { draft: vsSummaryDraft({ shared: (b2 && b2.shared) || [] }, card) }; }
        if (cmd === "sim") {   /* 결정론 시뮬 — 코호트 i의 한 세션을 규격대로 굴린다 */
          const steps = [];
          const r = vsRequest(a, b2 || {});
          if (!r.ok) return { blocked: true, code: r.code, why: r.why };
          const s = r.sess;
          steps.push(s.state);
          const seed = _vsSeed("vs|" + a) % 100;
          if (seed < 12) { vsExpire(s); steps.push(s.state); return { steps: steps, mode: s.mode, media: vsNoMediaScan(s) }; }
          if (seed < 30) { vsDecline(s); steps.push(s.state); return { steps: steps, mode: s.mode, media: vsNoMediaScan(s) }; }
          vsAccept(s); steps.push(s.state);
          if (seed % 3 === 0) vsSetMode(s, "video", "member");
          if (seed % 7 === 0) vsDegrade(s);
          vsEnd(s); steps.push(s.state);
          vsSummarize(s, "결과 해설과 다음 절차를 안내했어요.", true); steps.push(s.state);
          return { steps: steps, mode: s.mode, summary: !!s.summary, media: vsNoMediaScan(s) };
        }
        return { error: "spec | states | gate | sim" };
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
