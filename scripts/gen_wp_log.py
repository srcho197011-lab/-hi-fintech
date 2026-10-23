# -*- coding: utf-8 -*-
"""백서반영표 자동 로그 생성기 — 커밋 메시지의 "WP-Log:" 트레일러를 스캔해 src/data/wpAutoLog.js 를 만든다.

두 가지 표기를 모두 읽는다.
  (가) 완전형:  WP-Log: ch=8; ver=v1.2; feat=기능명; src=섹션경로; summary=반영 요약
  (나) 축약형:  WP-Log: ch=8 sec=로그인계정 kind=수선
      공백으로 나뉜 key=value. feat/summary 가 없으므로 커밋 제목과 본문 첫 줄로 채운다.
      2026-08-27 무렵부터 이 표기가 쓰였는데 파서가 (가)만 읽어 62건이 표에서 빠져 있었다.
      형식을 통일하는 대신 파서를 넓혔다 — 이미 쌓인 커밋 이력은 고칠 수 없기 때문이다.

원래는 bash 루프였는데 커밋 하나마다 grep·sed·awk 를 열 번 남짓 띄워서
252커밋에 8분 53초가 걸렸다. post-commit 훅이 매번 그만큼 멈춰 설 수는 없다.
한 번에 읽어 한 번에 쓰는 방식으로 바꿨다(같은 출력, 1초 미만).

사용: python scripts/gen_wp_log.py             (gen_wp_log.sh 가 이 파일을 부른다)
      python scripts/gen_wp_log.py --stdout   (파일을 쓰지 않고 표준출력 — 가드의 왕복 대조용)

── 화면 표기 규약(대표 지시 2026-10-23) ─────────────────────────────────────────
이 파일이 만드는 src/data/wpAutoLog.js 는 백서 ›반영 로그 **화면에 그대로 렌더된다**.
그래서 규약(화면 문자열에 「합성」·「가상 데이터」 금지 — 데이터셋은 「파일럿 코호트」)을
**여기서** 적용한다. 생성 파일을 손으로 고치면 post-commit 훅이 커밋 직후 재생성해
그 수정을 스스로 되돌리고 amend까지 한다(2026-10-23 실측 — 손수정 3건 전건 부활).
치환표는 scripts/wp_wording_table.json 단일 원천이고, scripts/run_wording_guard.mjs 가
같은 표를 읽어 「재생성해도 화면 문자열 0건」을 단언한다.
"""
import io, json, os, re, subprocess, sys

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = "src/data/wpAutoLog.js"
TABLE = "scripts/wp_wording_table.json"
TO_STDOUT = "--stdout" in sys.argv[1:]
US, RS = chr(31), chr(30)          # git log 필드·레코드 구분자
NL = chr(10)

# ── 표기 규약 치환 — 표가 없으면 치환하지 않는다(생성기가 표 없이 멈추지는 않는다) ──
try:
    _T = json.load(io.open(TABLE, encoding="utf-8"))
except Exception:
    _T = {"phrases": [], "allowPhrases": [], "allowCompoundPrev": "", "allowCompoundNext": "", "overrides": {}}
_PH = [(a, b) for a, b in (p for p in _T.get("phrases", []) if len(p) == 2)]
_ALLOW = [p for p in _T.get("allowPhrases", [])]
_CPREV = _T.get("allowCompoundPrev", "")
_CNEXT = _T.get("allowCompoundNext", "")
_OVER = dict((k, v) for k, v in _T.get("overrides", {}).items() if not k.startswith("_"))
_residual = []


def wording(s, h=""):
    """렌더되는 문자열에 표기 규약을 적용한다. 남은 금칙 낱말은 모아서 끝에 알린다."""
    if not s:
        return s
    for a, b in _PH:
        s = s.replace(a, b)
    i = -1
    while True:
        i = s.find("합성", i + 1)
        if i < 0:
            break
        prev, nxt = (s[i - 1] if i else ""), s[i + 2:i + 3]
        if (prev and prev in _CPREV) or (nxt and nxt in _CNEXT):
            continue                      # 정합성·적합성·합성어 — 다른 뜻
        if any(s.startswith(p, i) for p in _ALLOW):
            continue                      # 「합성 중」(협주 조립) — 데이터 성격 표기가 아니다
        _residual.append((h, s[max(0, i - 20):i + 22].replace(NL, " ")))
    return s

# git 이 없거나 저장소가 아니면(예: Vercel 정적 서빙) 기존 파일 유지 / 빈 배열 보장
def _no_git():
    if TO_STDOUT:
        sys.exit(2)                        # 가드가 대조할 원천이 없다 — 조용히 통과시키지 않는다
    if not os.path.exists(OUT):
        io.open(OUT, "w", encoding="utf-8", newline=NL).write("/* auto */" + NL + "const WP_AUTO_LOG = [];" + NL)
    sys.exit(0)

try:
    subprocess.run(["git", "rev-parse", "--git-dir"], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
except Exception:
    _no_git()

raw = subprocess.run(["git", "log", "--no-merges", "--date=short",
                      "--pretty=format:%h" + US + "%ad" + US + "%B" + RS],
                     check=True, stdout=subprocess.PIPE).stdout.decode("utf-8", "replace")


def esc(s):
    return (s or "").replace(chr(92), chr(92) * 2).replace('"', chr(92) + '"')


def field(key, payload):
    """key=값 을 세미콜론 전까지 — 대소문자 무시, 앞뒤 공백 제거"""
    m = re.search(key + r"=([^;]*)", payload, re.I)
    return m.group(1).strip() if m else ""


def sumfield(payload):
    """summary= 는 자유 문장이므로 줄 끝까지 가져간다"""
    m = re.search(r"summary=(.*)", payload, re.I)
    return m.group(1).strip() if m else ""


# 본문 첫 줄로 요약을 채울 때 건너뛸 줄 — 트레일러·서명·구분선·머리표는 요약이 아니다
SKIP = re.compile(r"^(WP-Log:|Co-Authored-By:|Signed-off-by:|[-=_─━]{3,}$)", re.I)
HEAD = re.compile(r"^[\[(■▶◆●·*#>\s]*$")


def body_summary(body_lines):
    for ln in body_lines:
        t = ln.strip()
        if not t or SKIP.match(t):
            continue
        # 「■ 문제」 같은 머리표만 있는 줄은 요약이 못 된다 — 실제 문장을 찾는다
        bare = re.sub(r"^[\[(■▶◆●·*#>\s]+", "", t)
        if len(bare) < 8 or HEAD.match(t):
            continue
        return t
    return ""


rows, n = [], 0
for rec in raw.split(RS):
    if not rec.strip():
        continue
    parts = rec.split(US)
    if len(parts) < 3:
        continue
    h, date, body = parts[0].strip(), parts[1].strip(), parts[2]
    lines = body.split(NL)

    trailer = next((l for l in lines if l.lower().startswith("wp-log:")), None)
    if not trailer:
        continue
    payload = trailer.split(":", 1)[1]

    # 축약형은 구분자를 넣어 같은 파서로 읽는다. 세미콜론이 이미 있으면(완전형) 손대지 않는다 —
    # summary 안의 자유 문장에 'word=' 가 섞여 있어도 잘리지 않게 하기 위함이다.
    if ";" not in payload:
        payload = re.sub(r"\s+([A-Za-z_]+)=", r"; \1=", payload)

    ch = field("ch", payload)
    ver = field("ver", payload) or "v1.1"
    feat = field("feat", payload)
    src = field("src", payload)
    sec = field("sec", payload)
    kind = field("kind", payload)
    summary = sumfield(payload)

    # 축약형 보충 — 커밋 제목을 기능명으로, 본문 첫 문장을 요약으로
    subject = lines[0].strip() if lines else ""
    if not feat:
        feat = subject
    if not src:
        src = sec
    if not summary:
        summary = body_summary(lines[1:])
    if kind:
        summary = "[" + kind + "] " + summary

    # 기능명조차 세울 수 없는 커밋(빈 메시지)은 표에 남기지 않는다 — 빈 행은 정보가 아니라 오염이다.
    if not feat:
        continue

    # ── 화면 표기 규약 — 렌더되는 세 필드(feat·src·summary)에 적용한다 ──
    # 해시 override 가 있으면 summary 전문을 갈아끼운다(치환표로 뜻이 살지 않는 한 번뿐인 문장용).
    if h in _OVER:
        summary = _OVER[h]
    feat = wording(feat, h)
    src = wording(src, h)
    summary = wording(summary, h)

    chArr = ",".join(g for g in (re.sub(r"[^0-9]", "", x) for x in ch.split(",")) if g)
    rows.append('  { date:"%s", ver:"%s", ch:[%s], feat:"%s", src:"%s", summary:"%s", refs:[], status:"반영", hash:"%s", auto:true },'
                % (date, esc(ver), chArr, esc(feat), esc(src), esc(summary), h))
    n += 1

body_out = ('/* AUTO-GENERATED by scripts/gen_wp_log.py — 직접 편집 금지.' + NL
            + '   커밋 메시지의 "WP-Log:" 트레일러에서 빌드/커밋 시 자동 생성됩니다. */' + NL
            + 'const WP_AUTO_LOG = [' + NL
            + ("".join(r + NL for r in rows))
            + '];' + NL)
if TO_STDOUT:
    out = io.open(sys.stdout.fileno(), "w", encoding="utf-8", newline="", closefd=False)
    out.write(body_out)
    out.flush()
    sys.exit(0)

io.open(OUT, "w", encoding="utf-8", newline=NL).write(body_out)


def say(msg):
    """콘솔 코드페이지(윈도 cp949)가 못 찍는 글자 하나로 **생성기가 죽지 않게** 한다.
    ⚠️ 실측 2026-10-23 — 경고문의 「⚠️」 한 글자에 UnicodeEncodeError 로 죽었고,
       gen_wp_log.sh 는 set -e, post-commit 은 `|| exit 0` 이라 **경고가 조용히 사라지고
       뒤따르는 재빌드·가드까지 건너뛰었다**. 할 말이 있을 때 죽는 것이 가장 나쁘다."""
    try:
        print(msg)
    except Exception:
        enc = getattr(sys.stdout, "encoding", None) or "ascii"
        sys.stdout.write(msg.encode(enc, "replace").decode(enc, "replace") + NL)


say("gen_wp_log: %d auto entries -> %s" % (n, OUT))
if _residual:
    # 표에 없는 금칙 표현이 커밋 메시지에서 들어왔다. 생성기는 뜻을 지어내지 않고 **이름만 댄다** —
    # 고치는 자리는 scripts/wp_wording_table.json(치환표 또는 해시 override)이다.
    say("gen_wp_log: [WARN] 표기 규약 미해결 %d건 — scripts/wp_wording_table.json 에 치환 또는 override 추가" % len(_residual))
    for h, c in _residual[:10]:
        say("  - %s ...%s..." % (h, c))
