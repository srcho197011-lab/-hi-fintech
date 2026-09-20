/* ══════════════ 하이 목소리 — 듣기(STT)·말하기(TTS) 단일 모듈 (hiVoice.js) ══════════════
   화면마다 흩어져 있던 음성 코드(STT 4벌·TTS 3벌)를 여기 한 곳으로 모은다.
   한 곳을 고쳐도 나머지가 남는 구조를 끝낸다 — 설정은 이 파일에만 있다.
   ⚠️ 원칙:
     ① 외부 STT/TTS API를 쓰지 않는다 — 브라우저 내장 Web Speech만 쓴다(건강 발화를 밖으로 보내지 않는다).
        미지원 브라우저는 버튼을 숨기지 말고 **이유와 대안(글 입력)**을 말한다. 되는 척도, 말없이 사라지지도 않는다.
     ② 하이는 한 인격이다 — 화면마다 다른 목소리·속도를 고르지 않는다. 보이스 선택 규칙은 여기 하나뿐.
     ③ 낭독은 화면보다 통제가 어렵다(공공장소·가족 동석). 약 이름·원가·송객수수료·CAC·주민번호는
        **소리로 내보내지 않는다.** 마스킹은 hiVoiceSanitize 단일 지점에서만 한다(화면 텍스트는 건드리지 않는다).
     ④ 읽어주기 기본값은 꺼짐이고, 회원이 켜면 기억한다 — 켠 것만 말한다.
     ⑤ 되돌리기 어려운 행동(예약 확정·청구 제출·결제)은 소리로 실행하지 않는다 — 음성은 채우기까지다.
     ⑥ 이번 범위는 한국어(ko-KR)뿐 — 영문 모드에서는 마이크를 내보내지 않는다.
   번들에 import가 없으므로 전역 function/const로 노출한다. */

/* ── 공통 설정 — 화면별로 다시 정하지 않는다(설정 동일성은 이 상수 하나로 보장) ── */
const HI_VOICE_CFG = {
  lang: "ko-KR",
  interim: true,        /* 중간 결과를 보여준다 — 듣고 있다는 신호가 없으면 어르신은 같은 말을 두 번 하신다 */
  continuous: true,     /* 문장 중간에 쉬어도 반토막 나지 않게. 대신 무음 타임아웃으로 닫는다 */
  maxAlt: 3,
  silenceMs: 1800,      /* 무음 1.8초면 말이 끝난 것으로 본다 — 마이크를 계속 열어두지 않는다 */
  rate: 1.03,
  rateEasy: 0.92,       /* 쉬운 말 모드(큰 글씨)면 천천히 읽는다 — 고령 회원 배려 */
  pitchMale: 1.08,      /* 고지문이 약속한 '남성 중고음' — 지금까지 한 화면만 보정하고 있었다 */
  pitchSoft: 0.92,
  max: 120,             /* 낭독 상한(자) — 넘으면 끊고 '이어 듣기'로 넘긴다. 170자는 30초가 넘어 듣고 기다리기 어렵다 */
};
const HI_VOICE_KEY = "hifin_hi_read";            /* 읽어주기 켜짐 기억 — 기본은 꺼짐 */
const HI_VOICE_TAIL = "자세한 내용은 화면에서 보여드릴게요.";
const HI_VOICE_MED_MASK = "처방받으신 약";

/* 안내 문구 — 못 하는 것을 하는 척하지 않고, 대신 할 수 있는 길(글 입력)을 같이 준다 */
const HI_VOICE_MSG = {
  nostt: "이 브라우저는 음성 입력을 지원하지 않아요 — 크롬·엣지·삼성인터넷에서 쓰실 수 있어요. 지금은 아래 칸에 글로 적어주시면 똑같이 도와드릴게요.",
  notts: "이 브라우저는 읽어주기를 지원하지 않아요 — 크롬·엣지·삼성인터넷에서 쓰실 수 있어요. 답변은 화면으로 계속 보여드릴게요.",
  enOnly: "Voice is Korean-only for now. Please switch to 한국어, or type your question — I will answer the same way.",
};
/* 마이크 오류 — 종류마다 회원이 할 일이 다르다. 한 줄짜리 '실패'로 뭉뚱그리지 않는다 */
const HI_VOICE_ERR = {
  "not-allowed": "마이크 사용이 막혀 있어요 — 주소창 왼쪽 자물쇠를 눌러 마이크를 '허용'으로 바꿔주세요. 지금은 아래 칸에 글로 적어주셔도 똑같이 도와드려요.",
  "service-not-allowed": "이 브라우저에서 음성 인식이 차단돼 있어요 — 브라우저 설정에서 마이크를 허용해 주세요. 글로 적어주셔도 됩니다.",
  "no-speech": "소리가 들리지 않았어요 — 마이크를 한 번 더 누르고 조금만 크게 말씀해 주세요.",
  "audio-capture": "마이크를 찾지 못했어요 — 이어폰·헤드셋 연결을 확인해 주세요. 글로 적어주셔도 됩니다.",
  network: "인터넷이 잠시 끊겨 음성을 알아듣지 못했어요 — 잠시 후 다시 해보시거나 글로 적어주세요.",
  aborted: "",             /* 회원이 직접 멈춘 것 — 안내하지 않는다 */
};
const HI_VOICE_ERR_ETC = "음성 인식이 잠시 멈췄어요 — 마이크를 다시 눌러주시거나 아래 칸에 글로 적어주세요.";
function hiVoiceErrMsg(code) {
  const k = String(code || "");
  return Object.prototype.hasOwnProperty.call(HI_VOICE_ERR, k) ? HI_VOICE_ERR[k] : HI_VOICE_ERR_ETC;
}

/* ── 지원 여부 판정 ── */
function hiVoiceSupport() {
  const w = (typeof window !== "undefined") ? window : null;
  const stt = !!(w && (w.SpeechRecognition || w.webkitSpeechRecognition));
  const tts = !!(w && w.speechSynthesis);
  let reason = "";
  if (!stt) reason = HI_VOICE_MSG.nostt;
  else if (!tts) reason = HI_VOICE_MSG.notts;
  return { stt: stt, tts: tts, reason: reason };
}
/* 한국어 모드인가 — 이번 범위는 ko-KR뿐이다(영문에서 되는 척하지 않는다) */
function hiVoiceKoOK() {
  try { if (typeof hiLang === "function") return hiLang() !== "en"; } catch (e) {}
  return true;
}

/* ══════════ 낭독 텍스트 정제 — 소리로 나가기 전 마지막 관문(단일 지점) ══════════ */

/* 이모지·픽토그램·원문자 — 화면에서는 안내지만 소리로는 읽을 수 없는 잡음이다 */
const HI_VOICE_EMOJI = /[‼-㊙←-⇿⬀-⯿️⃣\uD800-\uDFFF]/g;
/* 장식 기호 — 표·구분선·목록 기호는 읽으면 문장이 끊긴다 */
const HI_VOICE_SYMBOL = /[※【】〔〕「」『』◆◇■□▲▼△▽●○★☆·•‧∙→←↑↓↔⇒═─━┃│┊…＊]/g;
/* 마크다운 — 강조·제목·코드·인용·표 구분자 */
const HI_VOICE_MD = /[*_`~#>|]/g;

/* 약 이름 — telemed 규칙(조제 뒤에도 비노출)을 음성에서는 전면 적용한다.
   화면 텍스트는 그대로 두고, 소리로 나가는 문장에서만 가린다. */
const HI_VOICE_MED_WORDS = [
  "암로디핀", "메트포르민", "하이드로코르티손", "로수바스타틴", "아토르바스타틴", "심바스타틴", "리피토",
  "텔미사르탄", "발사르탄", "로사르탄", "클로피도그렐", "아스피린", "이부프로펜", "타이레놀", "아세트아미노펜",
  "세티리진", "몬테루카스트", "판토프라졸", "에제티미브", "글리메피리드", "실로스타졸", "레바미피드",
  "와파린", "리바록사반", "프레드니솔론", "트라마돌", "아목시실린", "독시사이클린",
  /* 용량 표기 없이 상품명만 오는 것들 — 고정 목록은 여기까지가 한계다(아래 원천 읽기가 본진) */
  "타미플루", "콘서타", "자누비아", "디아미크롱", "록소닌", "스티렌", "가스모틴", "알마겔", "낙센", "부루펜",
];
/* 이름을 모르는 약도 '○○정 5mg' 꼴은 가린다 — 숫자+단위를 반드시 요구해 '결정·과정·측정' 같은 말이 걸리지 않게 한다.
   ⚠️ 제형만으로 거르면 선크림·수분크림·홍삼정·상처연고까지 '처방받으신 약'이 된다(저장소 실측 154종).
      지워버린 정보는 되돌아오지 않으므로, 용량 요구는 그대로 두고 아래 두 갈래로 보완한다. */
const HI_VOICE_MED_FORM = /[가-힣A-Za-z]{2,12}\s*(서방정|장용정|캡슐|정|시럽|연고|크림|패치)\s*\d+(\.\d+)?\s*(mg|㎎|밀리그램|g|%)/g;
/* ⓐ 일반어에 쓰이지 않는 제형 — 용량이 없어도 약이 분명하다(서방정·장용정·설하정·좌약) */
const HI_VOICE_MED_RX = /[가-힣A-Za-z]{2,12}\s*(서방정|장용정|설하정|좌약)/g;
/* ⓑ 회원의 처방·복약 기록에 실제로 적힌 이름 — 목록에 없어도 가린다.
   낭독이 새는 곳은 늘 '새로 들어온 데이터'다. 목록을 늘려 쫓아가는 대신 원천을 읽는다
   (telemed 규칙: 약 이름은 조제 뒤에도 비노출 — 소리는 공공장소라 화면보다 엄하게). */
function hiVoiceMedNames() {
  const out = [];
  const eat = (v) => {
    const head = String(v || "").split("—")[0].split("-")[0].trim().replace(/\s*\d+(\.\d+)?\s*(mg|㎎|밀리그램|g|%)\s*$/i, "").trim();
    if (head.length >= 2 && head.length <= 20 && out.indexOf(head) < 0) out.push(head);
  };
  try {
    for (const k of ["hifin_rx", "hifin_medrem"]) {
      const l = JSON.parse(localStorage.getItem(k) || "[]");
      if (Array.isArray(l)) for (const r of l) { if (r && r.med) eat(r.med); if (r && r.name) eat(r.name); }
    }
  } catch (e) {}
  return out;
}
function hiVoiceMaskMed(s) {
  let t = String(s || "");
  const words = HI_VOICE_MED_WORDS.concat(hiVoiceMedNames());
  for (const w of words) {
    if (!w || t.indexOf(w) < 0) continue;
    try {
      /* 뒤따르는 제형·용량만 함께 먹는다 — 조사(은/는/이/가)는 남겨 문장이 어그러지지 않게 */
      const esc = String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      t = t.replace(new RegExp(esc + "(서방정|장용정|캡슐|정|연고|시럽|크림|패치)?(\\s*\\d+(\\.\\d+)?\\s*(mg|㎎|밀리그램|g|%))?", "g"), HI_VOICE_MED_MASK);
    } catch (e) {}
  }
  t = t.replace(HI_VOICE_MED_FORM, HI_VOICE_MED_MASK);
  return t.replace(HI_VOICE_MED_RX, HI_VOICE_MED_MASK);
}

/* 내부 수익구조 — 회원 동선에서 금지된 말은 소리로도 나가지 않는다(문장 통째로 뺀다).
   ⚠️ '원가'를 경계 없이 부분일치로 잡으면 **회원가입·병원가야·지원가능**이 걸려 멀쩡한 문장이 통째로 사라진다.
      실제로 「회원가입은 1분이면 끝나요」와 「열이 나면 병원가야 해요」가 소리에서 지워졌다(2026-09-20).
      안전 지시가 이런 식으로 사라지면 원인을 찾기 어렵다 — 그래서 한글 경계를 넣고,
      원가 앞에 붙는 실제 회계 접두어(매출·제품·공급…)는 따로 열거한다.
      CAC·LTV는 영문 경계(\b)를 둬 'cache' 같은 단어에 걸리지 않게 한다. */
const HI_VOICE_BAN = /((?:^|[^가-힣]|매출|제품|공급|판매|조달|생산|도입|상품|구매|총|단위)\s*원가|송객\s*수수료|고객\s*획득\s*비용|고객획득비용|\bCAC\b|\bLTV\b|역마진)/i;
function hiVoiceMaskBan(s) {
  const t = String(s || "");
  if (!HI_VOICE_BAN.test(t)) return t;
  /* 문장 단위로 잘라 해당 문장만 버린다. 전부 걸리면 빈 문자열 — 말하지 않는 쪽이 안전하다 */
  const parts = t.replace(/([.?!])\s+/g, "$1").split("");
  return parts.filter((x) => !HI_VOICE_BAN.test(x)).join(" ").trim();
}

/* 주민등록번호 — 자리수 꼴이 보이면 숫자를 읽지 않는다 */
function hiVoiceMaskRrn(s) {
  let t = String(s || "");
  t = t.replace(/\d{6}\s*[-–—]\s*[1-4*][\d*]{6}/g, "주민등록번호");
  t = t.replace(/(주민(등록)?번호)\s*[:：]?\s*[\d*]{6,}[\d*\- ]*/g, "$1");
  return t;
}

/* 숫자·단위를 읽기 쉽게 — 엔진이 쉼표를 '쉼표'로, 140/90을 '나누기'로 읽는 것을 막는다 */
/* 단위는 **숫자 뒤에 붙었을 때만** 바꾼다 — 앞에 \b를 두면 '68kg'처럼 숫자에 붙은 단위를 놓치고,
   빼면 'html' 같은 평범한 글자가 걸린다. mg/dL은 mg보다 먼저 와야 한다(긴 것 먼저). */
const HI_VOICE_UNIT = [
  [/(\d)\s*mmHg\b/gi, "$1"],                 /* 혈압은 앞의 '140에 90'이 단위를 대신한다 — 소리로는 군더더기 */
  [/(\d)\s*mg\s*\/\s*dL\b/gi, "$1 밀리그램"],
  [/(\d)\s*kcal\b/gi, "$1 킬로칼로리"],
  [/(\d)\s*kg\b/gi, "$1 킬로그램"],
  [/(\d)\s*cm\b/gi, "$1 센티미터"],
  [/(\d)\s*mg\b/gi, "$1 밀리그램"],
  [/(\d)\s*mL\b/gi, "$1 밀리리터"],
  [/℃/g, "도"],
  [/%/g, "퍼센트"],
  [/\bHTK\b/g, "에이치티케이"],
];
function hiVoiceNum(s) {
  let t = String(s || "");
  t = t.replace(/(\d),(?=\d{3}(\D|$))/g, "$1");                       /* 1,234 → 1234 */
  t = t.replace(/(\d{2,3})\s*\/\s*(\d{2,3})/g, "$1에 $2");            /* 혈압 140/90 → 140에 90 */
  t = t.replace(/(\d)\s*~\s*(\d)/g, "$1에서 $2");
  for (const u of HI_VOICE_UNIT) t = t.replace(u[0], u[1]);
  return t;
}

/* 낭독 정제 — 이 함수를 거치지 않은 문장은 소리로 내보내지 않는다 */
function hiVoiceSanitize(raw) {
  let s = String(raw == null ? "" : raw);
  if (!s) return "";
  s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");     /* 링크는 글자만 남긴다 */
  s = s.replace(/https?:\/\/\S+/g, "");                /* 주소는 읽지 않는다 */
  s = hiVoiceMaskRrn(s);
  s = hiVoiceMaskMed(s);
  s = hiVoiceMaskBan(s);
  s = hiVoiceNum(s);
  s = s.replace(HI_VOICE_EMOJI, " ");
  s = s.replace(HI_VOICE_SYMBOL, " ");
  s = s.replace(HI_VOICE_MD, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/* 낭독 상한에서 자르기 — 문장 끝에서 끊는다(말이 중간에 잘리면 되묻게 된다) */
function hiVoiceCut(text, max) {
  const s = String(text || "").trim();
  const lim = max || HI_VOICE_CFG.max;
  if (s.length <= lim) return { head: s, rest: "" };
  const win = s.slice(0, lim);
  let at = Math.max(win.lastIndexOf("."), win.lastIndexOf("?"), win.lastIndexOf("!"));
  if (at < lim * 0.4) at = win.lastIndexOf(" ");
  if (at < lim * 0.4) at = lim - 1;
  const head = s.slice(0, at + 1).trim();
  const rest = s.slice(at + 1).trim();
  return { head: head + " " + HI_VOICE_TAIL, rest: rest };
}

/* 낭독용 한 문단 조립 — 답변 본문 + 카드의 핵심 수치 1~2문장까지.
   조립이지 생성이 아니다: 새 문장을 지어내지 않고 이미 화면에 있는 줄·라벨만 쓴다(협주 규약과 동일).
   도크 메시지({lines, cards})와 챗 버블([{kind,text|card}]) 두 모양을 모두 받는다. */
function hiVoiceSummarize(src) {
  const body = [];
  const facts = [];
  const add = (v) => { const s = hiVoiceSanitize(v); if (s) body.push(s); };
  const eatCard = (c) => {
    if (!c) return;
    const items = (c.items || []).map((x) => hiVoiceSanitize(x)).filter((x) => x && /\d/.test(x));
    if (!items.length) return;
    const title = hiVoiceSanitize(c.title || "");
    facts.push((title ? title + " " : "") + items.slice(0, 2).join(", "));
  };
  const eat = (n) => {
    if (!n) return;
    if (Array.isArray(n)) { n.forEach(eat); return; }
    if (typeof n === "string") { add(n); return; }
    if (n.card) { eatCard(n.card); return; }
    if (n.kind === "card") { eatCard(n); return; }
    if (n.text) add(n.text);
    if (n.lines) n.lines.forEach(add);
    if (n.cards) n.cards.forEach(eatCard);
  };
  eat(src);
  const out = body.join(" ") + (facts.length ? " " + facts.slice(0, 2).join(" ") : "");
  return out.replace(/\s+/g, " ").trim();
}

/* ══════════ 듣기(STT) — 인스턴스는 언제나 하나 ══════════ */
let _hiVoiceRec = null;       /* 살아 있는 인식기 — 재클릭해도 하나 더 만들지 않는다 */
let _hiVoiceQuiet = null;     /* 무음 타임아웃 */
let _hiVoiceDrop = false;     /* 독을 닫거나 화면을 떠난 뒤 결과가 배달되는 것을 막는다 */

function hiVoiceListening() { return !!_hiVoiceRec; }

/* 인식 시작. 이미 듣는 중이면 **취소**한다(재클릭 = 취소 · 인스턴스 중복 생성 금지).
   콜백: onStart · onInterim(중간결과, 확정분) · onFinal(확정문장) · onError(안내문구, 코드) · onEnd */
function hiVoiceListen(opts) {
  const o = opts || {};
  /* 재클릭은 **취소**다 — 잘못 말한 것을 물리려고 누르는 자리이므로 지금까지 들은 말을 배달하지 않는다.
     (무음 타임아웃 같은 시스템 종료만 drop 없이 두어 정상 전송으로 남긴다) */
  if (_hiVoiceRec) { hiVoiceStop({ drop: true }); return null; }
  if (!hiVoiceKoOK()) { if (o.onError) o.onError(HI_VOICE_MSG.enOnly, "lang"); return null; }
  if (!hiVoiceSupport().stt) { if (o.onError) o.onError(HI_VOICE_MSG.nostt, "unsupported"); return null; }
  hiVoiceCancel();            /* 끼어들기 — 하이가 말하는 중이면 먼저 입을 닫는다(에코 방지) */
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  let r = null;
  try { r = new R(); } catch (e) { if (o.onError) o.onError(HI_VOICE_ERR_ETC, "init"); return null; }
  _hiVoiceRec = r; _hiVoiceDrop = false;
  r.lang = o.lang || HI_VOICE_CFG.lang;
  r.interimResults = HI_VOICE_CFG.interim;
  r.continuous = HI_VOICE_CFG.continuous;
  try { r.maxAlternatives = HI_VOICE_CFG.maxAlt; } catch (e) {}
  let fin = "";
  const hush = () => {
    if (_hiVoiceQuiet) clearTimeout(_hiVoiceQuiet);
    _hiVoiceQuiet = setTimeout(() => { try { r.stop(); } catch (e) {} }, HI_VOICE_CFG.silenceMs);
  };
  r.onstart = () => { hush(); if (o.onStart) o.onStart(); };
  r.onresult = (e) => {
    let itm = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const tr = e.results[i];
      if (tr.isFinal) fin += tr[0].transcript; else itm += tr[0].transcript;
    }
    hush();
    if (o.onInterim) o.onInterim(itm, fin);
  };
  r.onerror = (e) => {
    const code = (e && e.error) || "";
    const msg = hiVoiceErrMsg(code);
    if (o.onError && msg) o.onError(msg, code);
  };
  r.onend = () => {
    if (_hiVoiceQuiet) { clearTimeout(_hiVoiceQuiet); _hiVoiceQuiet = null; }
    _hiVoiceRec = null;
    if (o.onEnd) o.onEnd();
    const said = fin.trim();
    if (said && !_hiVoiceDrop && o.onFinal) o.onFinal(said);
    _hiVoiceDrop = false;
  };
  try { r.start(); } catch (e) {
    _hiVoiceRec = null;
    if (o.onError) o.onError(HI_VOICE_ERR_ETC, "start");
    return null;
  }
  return function () { hiVoiceStop({ drop: true }); };   /* 밖에서 부르는 중지도 취소다 — 말이 끝나서 닫히는 것만 전송된다 */
}
/* 중지. { drop: true }면 지금까지 들은 말을 배달하지 않는다.
   ⚠️ **회원이 누른 중지는 전부 drop**이다 — X는 '지금까지 들은 말을 보내라'가 아니라 '없던 일로 하라'는 뜻이다.
      drop 없는 중지는 무음 타임아웃처럼 말이 끝나서 닫히는 경우뿐이다. */
function hiVoiceStop(opts) {
  _hiVoiceDrop = !!(opts && opts.drop);
  if (_hiVoiceQuiet) { clearTimeout(_hiVoiceQuiet); _hiVoiceQuiet = null; }
  const r = _hiVoiceRec;
  if (!r) return false;
  try { if (_hiVoiceDrop && r.abort) r.abort(); else r.stop(); } catch (e) { _hiVoiceRec = null; }
  return true;
}

/* ══════════ 말하기(TTS) — 목소리는 한 사람 ══════════ */
let _hiVoiceList = [];
let _hiVoiceBound = false;
let _hiVoiceOnAir = false;
let _hiVoiceRest = "";        /* 상한에서 끊긴 나머지 — '이어 듣기' */
let _hiVoiceLast = "";        /* 방금 읽은 전체 문장 — '다시 듣기' */
let _hiVoiceGen = 0;          /* 발화 세대 — cancel()이 일으키는 **이전 발화의 onend**가 새 발화를 꺼뜨리지 않게 */
const HI_VOICE_MALE = /injoon|injun|hyunsu|hyun-?su|\bmale\b|남성|남자/i;
const HI_VOICE_FEM = /heami|female|여성|여자|yuna|sun-?hi|sunhi|google/i;

function hiVoiceLoad() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  try {
    _hiVoiceList = window.speechSynthesis.getVoices().filter((v) => /ko/i.test(v.lang));
    if (!_hiVoiceBound && window.speechSynthesis.addEventListener) {
      /* onvoiceschanged 대입은 다른 화면이 덮어쓴다 — 리스너로 붙인다 */
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        try { _hiVoiceList = window.speechSynthesis.getVoices().filter((v) => /ko/i.test(v.lang)); } catch (e) {}
      });
      _hiVoiceBound = true;
    }
  } catch (e) { _hiVoiceList = []; }
  return _hiVoiceList;
}
/* 보이스 단일 선택 규칙 — 남성 우선 → 여성으로 알려진 것 제외 → 첫 한국어.
   화면마다 다시 고르지 않는다(지금까지 쇼핑은 환경에 따라 여성으로 말하고 있었다). */
function hiVoicePick() {
  const ko = _hiVoiceList.length ? _hiVoiceList : hiVoiceLoad();
  if (!ko.length) return null;
  return ko.find((v) => HI_VOICE_MALE.test(v.name)) || ko.find((v) => !HI_VOICE_FEM.test(v.name)) || ko[0];
}
/* 속도 — 쉬운 말 모드면 천천히. 이것도 화면이 아니라 여기서 정한다 */
function hiVoiceRate() {
  try {
    if (typeof document !== "undefined" && document.body && document.body.classList.contains("easyread")) return HI_VOICE_CFG.rateEasy;
  } catch (e) {}
  return HI_VOICE_CFG.rate;
}

function hiVoiceSpeaking() { return _hiVoiceOnAir; }
function hiVoiceRest() { return _hiVoiceRest; }

/* 말하기. 정제를 거치지 않은 문장은 여기서도 통과하지 못한다.
   콜백: onStart · onEnd(남은 분량 문자열) */
function hiVoiceSpeak(text, opts) {
  const o = opts || {};
  if (!hiVoiceSupport().tts || !hiVoiceKoOK()) return false;
  let clean = o.raw ? String(text || "") : hiVoiceSanitize(text);
  /* 정제가 문장을 통째로 걷어낸 경우(금지어만 있던 단문) — 무음으로 끝내지 않는다.
     아무 소리도 안 나면 회원은 기능이 고장 난 것으로 받아들인다. 읽을 수 없다는 것만 말하고 화면으로 넘긴다. */
  if (!clean && !o.raw && String(text || "").trim()) clean = HI_VOICE_TAIL;
  if (!clean) return false;
  hiVoiceCancel();
  const gen = ++_hiVoiceGen;
  const cut = hiVoiceCut(clean, o.max);
  _hiVoiceRest = cut.rest;
  if (!o.more) _hiVoiceLast = clean;
  let u = null;
  try { u = new SpeechSynthesisUtterance(cut.head); } catch (e) { return false; }
  u.lang = HI_VOICE_CFG.lang;
  u.rate = o.rate || hiVoiceRate();
  /* 목소리 지정은 실패해도 낭독 자체는 살린다 — 브라우저가 내주는 목소리 객체가 규격과 다르면 대입에서 예외가 난다(그때는 기본 목소리로 읽는다) */
  const v = hiVoicePick();
  try { if (v) u.voice = v; } catch (e) {}
  try { u.pitch = (v && HI_VOICE_MALE.test(v.name)) ? HI_VOICE_CFG.pitchMale : HI_VOICE_CFG.pitchSoft; } catch (e) {}
  u.onstart = () => { if (gen !== _hiVoiceGen) return; _hiVoiceOnAir = true; if (o.onStart) o.onStart(); };
  const done = () => { if (gen !== _hiVoiceGen) return; _hiVoiceOnAir = false; if (o.onEnd) o.onEnd(_hiVoiceRest); };
  u.onend = done;
  u.onerror = done;
  try { window.speechSynthesis.speak(u); } catch (e) { _hiVoiceOnAir = false; return false; }
  return true;
}
/* 이어 듣기 — 상한에서 끊긴 나머지를 이어서 읽는다 */
function hiVoiceMore(opts) {
  const rest = _hiVoiceRest;
  if (!rest) return false;
  _hiVoiceRest = "";
  return hiVoiceSpeak(rest, Object.assign({}, opts || {}, { raw: true, more: true }));
}
/* 다시 듣기 — 방금 읽은 문장을 처음부터 */
function hiVoiceAgain(opts) {
  if (!_hiVoiceLast) return false;
  return hiVoiceSpeak(_hiVoiceLast, Object.assign({}, opts || {}, { raw: true }));
}
/* 끊기 — 새 답변·화면 이동·회원이 말하기 시작할 때 */
function hiVoiceCancel() {
  _hiVoiceGen++;              /* 끊긴 발화의 onend는 여기서 무효가 된다 — 화면 상태는 끊은 쪽이 직접 내린다 */
  _hiVoiceOnAir = false;
  _hiVoiceRest = "";
  try { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
}

/* ── 읽어주기 켜짐 상태 — 기본 꺼짐, 켜면 기억(화면을 옮겨도 유지) ── */
function hiVoiceOn() {
  try { return localStorage.getItem(HI_VOICE_KEY) === "1"; } catch (e) { return false; }
}
function hiVoiceSetOn(v) {
  const on = !!v;
  try { localStorage.setItem(HI_VOICE_KEY, on ? "1" : "0"); } catch (e) {}
  if (!on) hiVoiceCancel();
  return on;
}

/* ── 되돌리기 어려운 행동은 소리로 실행하지 않는다 ──
   음성은 '채우기'까지고, 마지막 한 번은 화면 버튼이다. 좁게 잡는다 —
   넓히면 "보험 가입하고 싶어요" 같은 평범한 말까지 막혀 대화가 끊긴다. */
const HI_VOICE_RISKY = /(예약\s*확정|확정\s*(해|할게|해줘|해주세요)|제출\s*(해|할게|해줘|해주세요)|접수\s*(해줘|해주세요)|결제\s*(해|할게|해줘|해주세요|진행)|송금|계좌\s*이체|이체\s*(해|할게|해줘)|주문\s*(할게|해줘)|구매\s*(할게|해줘)|해지\s*(할게|해줘)|승인\s*(할게|해줘)|동의\s*(꺼|철회|해지|해제|취소)|철회\s*(해|할게|해줘|해주세요))/;
function hiVoiceRisky(text) {
  try { return HI_VOICE_RISKY.test(String(text || "")); } catch (e) { return false; }
}
const HI_VOICE_RISKY_MSG = "말씀하신 대로 적어뒀어요 — 확인하시고 보내기 버튼을 눌러주세요. 예약 확정·청구 제출·결제·동의 변경은 화면에서 한 번 더 확인하고 진행해요.";

/* ── 계측 채널 라벨 — 새 이벤트를 만들지 않는다(가공 이벤트 금지). 기존 payload에 라벨만 붙인다 ── */
function hiVoiceChannel(via) { return via === "voice" ? "voice" : "text"; }

/* ── 화면을 떠나면 입을 닫는다 — 보이지 않는 곳에서 계속 말하지 않게 ── */
try {
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => { hiVoiceCancel(); hiVoiceStop({ drop: true }); });
    window.addEventListener("hifin:lang", () => { hiVoiceCancel(); hiVoiceStop({ drop: true }); });
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => { if (document.hidden) { hiVoiceCancel(); hiVoiceStop({ drop: true }); } });
    }
    hiVoiceLoad();
    window.__hifinVoice = {
      support: hiVoiceSupport, sanitize: hiVoiceSanitize, summarize: hiVoiceSummarize,
      cut: hiVoiceCut, speak: hiVoiceSpeak, cancel: hiVoiceCancel, pick: hiVoicePick,
      on: hiVoiceOn, setOn: hiVoiceSetOn, risky: hiVoiceRisky, cfg: HI_VOICE_CFG,
    };
  }
} catch (e) {}
