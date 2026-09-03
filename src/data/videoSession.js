/* ══════════════ 영상 상담 세션 엔진(videoSession.js) — 영상 V0 (형 승인 2026-09-03) ══════════════
   원천 사상: 설계 프롬프트 v1.1 — 영상은 「네 번째 채널」이다. 전화·문자·앱알림 옆에 나란히 서고,
   그 안에서 진료·검진·구매가 일어나지 않는다(§0-V10 — 가리킬 뿐 대행하지 않는다).
   ⚠️ 원칙:
     · 영상은 회원이 켠다(§0-V7) — 프로는 요청만 하고, 수락은 회원 화면에서만 일어난다.
       이 파일에 「프로가 연결한다」에 해당하는 함수는 존재하지 않는다.
     · 녹화하지 않는다(§0-V8) — 세션 레코드에 미디어 필드가 없다. 저장 경로 자체를 만들지 않는다.
     · 요청도 접촉이다 — 락·동의·접촉 보류·시간대를 통과하지 못하면 요청이 생성되지 않는다.
     · 규격 상수는 VIDEO_SPEC 단일 소스 — 화면·러너·관제가 같은 값을 읽는다(일수·횟수 하드코딩 분산 금지). */

const VIDEO_SPEC = {
  modes: ["text", "voice", "video"],  /* 회원이 언제든 오르내린다 — 낮추는 것은 항상 허용 */
  startMode: "voice",                 /* 권고: 음성으로 시작해 영상으로 승격(첫 연결의 부담 완화) */
  reRequestMax: 1,                    /* 재요청 1회 한도 — 거절 후 같은 통화에서 다시 묻지 않는다 */
  ringSec: 45,                        /* 호출 대기 — 지나면 무응답 만료(거절과 다르게 집계) */
  hourFrom: 9, hourTo: 20,            /* 가능 시간대(형 확정 대기 · 권고 09~20시) */
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

/* ── 게이트 — 요청이 생성될 수 있는가(락·동의·접촉 보류·시간대·재요청 한도) ──
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

  /* ④ 시간대 — 야간 미발송 규칙과 정합 */
  const h = (o.hour != null) ? Number(o.hour) : new Date().getHours();
  if (h < VIDEO_SPEC.hourFrom || h >= VIDEO_SPEC.hourTo) {
    out.code = "hour"; out.why = "영상 상담은 " + VIDEO_SPEC.hourFrom + "시~" + VIDEO_SPEC.hourTo + "시에만 요청할 수 있어요."; return out;
  }

  /* ⑤ 재요청 한도 — 거절 뒤 다시 묻지 않는다(무응답은 한도를 쓰지 않는다) */
  const tried = Number(o.declinedCount || 0);
  if (tried > VIDEO_SPEC.reRequestMax - 1 + 0) {
    if (tried >= VIDEO_SPEC.reRequestMax) { out.code = "reask"; out.why = "이미 사양하셨어요 — 재요청은 " + VIDEO_SPEC.reRequestMax + "회까지예요."; return out; }
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
  try { hiEvent("video_state", { to: to }); } catch (e) {}
  return { ok: true, state: to };
}

/* 요청 — 프로가 할 수 있는 유일한 시작 행위(§0-V7). 게이트를 통과하지 못하면 세션이 생기지 않는다 */
function vsRequest(ref, opt) {
  const g = vsGateOf(ref, opt);
  if (!g.ok) { try { hiEvent("video_blocked", { code: g.code }); } catch (e) {} return { ok: false, why: g.why, code: g.code }; }
  const sess = { state: "idle", mode: null, trail: [], shared: [], summary: null,
                 declinedCount: Number((opt && opt.declinedCount) || 0) };
  vsMove(sess, "requested", { by: "pro" });
  return { ok: true, sess: sess };
}
/* 수락·거절 — 회원만 호출한다. 프로 화면에는 이 두 함수를 부르는 버튼이 없다 */
function vsAccept(sess) { return vsMove(sess, "connected", { by: "member" }); }
function vsDecline(sess) { const r = vsMove(sess, "declined", { by: "member" }); if (r.ok) sess.declinedCount++; return r; }
function vsExpire(sess)  { return vsMove(sess, "expired", { by: "system" }); }

/* 모드 — 낮추는 것은 언제나 허용, 올리는 것은 회원 조작으로만(§0-V7) */
function vsSetMode(sess, mode, by) {
  if (!sess || sess.state !== "connected") return { ok: false, why: "연결 중에만 바꿀 수 있어요" };
  const cur = VIDEO_SPEC.modes.indexOf(sess.mode), nx = VIDEO_SPEC.modes.indexOf(mode);
  if (nx < 0) return { ok: false, why: "알 수 없는 모드예요" };
  if (nx > cur && by !== "member") return { ok: false, why: "영상은 회원이 켜요 — 프로는 요청만 할 수 있어요." };
  sess.mode = mode;
  try { hiEvent("video_mode", { mode: mode, by: by || "" }); } catch (e) {}
  return { ok: true, mode: mode };
}
/* 품질 저하 폴백 — 시스템이 자동으로 낮춘다(올리지는 않는다) */
function vsDegrade(sess) {
  if (!sess || sess.state !== "connected") return { ok: false };
  const cur = VIDEO_SPEC.modes.indexOf(sess.mode);
  if (cur <= 0) return { ok: false, why: "더 낮출 수 없어요" };
  sess.mode = VIDEO_SPEC.modes[cur - 1];
  try { hiEvent("video_degrade", { mode: sess.mode }); } catch (e) {}
  return { ok: true, mode: sess.mode };
}

/* 종료·요약 — 요약 없이 닫히지 않는다. 남는 것은 요약뿐이다(§0-V8) */
function vsEnd(sess) { return vsMove(sess, "ended", { by: "either" }); }
function vsSummarize(sess, text, confirmedByMember) {
  if (!sess || sess.state !== "ended") return { ok: false, why: "종료 후에만 요약할 수 있어요" };
  const t = String(text || "").trim();
  if (!t) return { ok: false, why: "요약 없이 기록을 닫을 수 없어요" };
  if (typeof HM_BANNED !== "undefined" && HM_BANNED.some((w) => t.indexOf(w) >= 0))
    return { ok: false, why: "금칙어가 포함돼 있어요 — 단정·과장 표현은 요약에 남길 수 없어요." };
  if (!confirmedByMember) return { ok: false, why: "회원 확인 전이에요 — 확인해야 기록이 확정돼요." };
  sess.summary = { text: t, confirmed: true };
  return vsMove(sess, "summarized", { by: "member" });
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

/* ── 러너·관제 훅(관리자) ── */
try {
  if (typeof window !== "undefined") {
    window.__hifinVideo = function (cmd, a, b2) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (cmd === "spec")   return VIDEO_SPEC;
        if (cmd === "states") return { states: VS_STATES, edges: VS_EDGES };
        if (cmd === "gate")   return vsGateOf(a, b2 || {});
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
