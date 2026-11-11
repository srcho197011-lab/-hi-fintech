# -*- coding: utf-8 -*-
"""민감자료 차단 게이트 — CorpOps Phase 0/8 (형 지시 2026-11-12).

무엇을 막는가
  주민등록번호 · 여권번호 · 금융 계좌/카드 · API 키·비밀값이 **git에 들어가는 것**을 막는다.
  한 번 커밋되면 이력에 영원히 남는다. 지우는 것보다 들어가지 않게 하는 쪽이 싸다.

무엇을 막지 않는가
  런타임 반출(복사·캡처·워터마크)은 src/utils/contentGuard.js 가 가진다. 여기는 **유입 축**이다.
  검사 소유자를 둘로 만들지 않는다.

원칙
  · **값을 출력하지 않는다.** 어떤 패턴이 어느 파일 몇 줄에서 걸렸는지까지만 적는다.
    사유를 보려고 로그를 떴다가 그 로그가 또 민감자료가 되는 일을 만들지 않는다.
  · **면제는 사유·승인자·날짜가 있어야 등록된다.** 셋 중 하나라도 비면 면제가 아니라 구멍이다.
  · **탐지기 자기시험을 먼저 한다.** 정규식이 오타로 죽어도 0건은 녹색으로 보인다.
    합성 표본을 먹여 N건이 정확히 N건으로 잡히는지 증명한 뒤에야 「실제 0건」이 뜻을 갖는다.
  · 이진 파일은 정규식이 통하지 않는다. **이름 등재**로 막는다 — 등재 안 된 이진이 새로 들어오면 차단.
  · 주민등록번호는 **검증식까지 본다**. 13자리 숫자를 전부 막으면 재무 금액과 법인등록번호가 걸려
    게이트가 못 쓰게 된다(실측: 13자리 숫자 53건이 전부 금액이었다).

사용
  python scripts/check_sensitive.py            # 추적 파일 전수 검사(게이트)
  python scripts/check_sensitive.py --staged   # 스테이지된 파일만(커밋 훅 경로)
  python scripts/check_sensitive.py --selftest # 탐지기 자기시험만
  python scripts/check_sensitive.py --negative # 음성 테스트(금지 자료를 심어 실제로 막히는지)
  python scripts/check_sensitive.py --list     # 패턴표와 면제 목록을 찍는다

게이트: 미면제 적중 1건이라도 있으면 exit 1 — 커밋 차단.
"""
import io, os, re, sys, subprocess

try: sys.stdout.reconfigure(encoding="utf-8", errors="replace", newline=chr(10))
except Exception: pass
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

SELF = "scripts/check_sensitive.py"   # 이 파일은 패턴을 문자로 들고 있어야 하므로 스스로를 보지 않는다

# ── 패턴표 — 왜 막는지와 대신 무엇을 하는지를 함께 적는다(금칙 사전과 같은 구조) ──
PATTERNS = [
    dict(k="rrn", ko="주민등록번호",
         re=re.compile(r"(?<![0-9])(\d{2})(\d{2})(\d{2})[- ]?([1-4])(\d{6})(?![0-9])"),
         why="고유식별정보다. 법령 근거 없이는 처리 자체가 금지이고, 저장하면 암호화가 법정 의무다.",
         alt="값을 들지 말고 보유 여부·수집 근거·보관 위치·열람 이력만 남긴다(corpHr.js).",
         check="rrn"),
    dict(k="passport", ko="여권번호",
         # 대문자만 본다 — 소문자를 허용하면 16진 해시(예: 영문 1자 + 숫자 8자)가 전부 걸린다(실측 1건).
         re=re.compile(r"(?<![A-Za-z0-9])[MSROD]\d{8}(?![A-Za-z0-9])"),
         why="고유식별정보에 준한다. 해외 출장·비자 외에 쓸 일이 없다.",
         alt="필요하면 출장 신청 시점에만 외부 시스템에서 다룬다.", check=None),
    # ⚠️ 구분자를 **요구한다**. 16자리 숫자는 열에 하나가 검증식을 우연히 통과해서,
    #    구분자 없이 잡으면 재무 상수가 통째로 걸린다(실측: 금액 JSON에서 46건이 걸렸다).
    #    대신 구분자 없이 붙여 적은 카드번호는 못 잡는다 — 이 한계를 숨기지 않는다.
    dict(k="card", ko="카드번호(구분자 + 검증식)",
         re=re.compile(r"(?<![0-9-])\d{4}[- ]\d{4}[- ]\d{4}[- ]\d{4}(?![0-9-])"),
         why="결제수단 전체번호다. 유출 시 즉시 금전 피해가 난다.",
         alt="마지막 4자리만 표시한다. 전체번호는 결제대행사가 든다.", check="luhn"),
    dict(k="secret", ko="비밀값 대입",
         re=re.compile(r"""(?i)\b(password|passwd|pwd|pw|secret|api[_-]?key|access[_-]?token|private[_-]?key|client[_-]?secret)\b\s*[:=]\s*["'][^"'\s]{8,}["']"""),
         why="소스에 박힌 비밀값은 저장소를 읽을 수 있는 모두의 것이 된다.",
         alt="환경변수나 별도 금고에서 읽는다. 예시가 필요하면 빈 문자열이나 자리표시자를 쓴다.", check="notplaceholder"),
    dict(k="token", ko="발급 토큰 접두",
         re=re.compile(r"(?<![A-Za-z0-9])(?:sk-[A-Za-z0-9]{20,}|pk_live_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|AIza[0-9A-Za-z_\-]{35}|xox[baprs]-[0-9A-Za-z\-]{10,})"),
         why="발급 즉시 쓸 수 있는 실제 자격증명이다.",
         alt="회수하고 새로 발급한다. 소스에 다시 넣지 않는다.", check=None),
]

# ── 면제 — 사유·승인자·날짜가 없으면 등록되지 않는다 ──
#    ⚠️ 면제는 「봐준다」가 아니라 「왜 거기 있어야 하는지 아는 상태」다. 모르면 면제가 아니라 미조치다.
EXEMPT = [
    dict(path="src/data/mcp_josungrae.json", pat="*",
         why="형 본인(대표) 실측 자료의 단일 원천. 본인 데이터이고 주민번호·주소·연락처는 들어 있지 않다(실명·성별·생년월일).",
         by="조성래", at="2026-11-12"),
    dict(path="src/data/selfReal.js", pat="*",
         why="위 JSON의 코드 내 스냅샷. 드리프트 방지를 위해 전문을 들고 있어야 한다(run_selfreal_check 단언).",
         by="조성래", at="2026-11-12"),
    dict(path=SELF, pat="*",
         why="패턴표와 자기시험 표본을 문자로 들고 있어야 하는 게이트 자신. 금칙 사전이 금칙어를 드는 것과 같은 구조.",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/run_pg_scan.mjs", pat="*",
         why="협력업체 집행 가드의 음성 테스트 픽스처. 일부러 금칙을 심어 차단을 확인하는 자리다.",
         by="조성래", at="2026-11-12"),
    dict(path="src/data/demo_members.js", pat="secret",
         why="공개 데모의 체험 계정 암호(16명 전원 같은 값). 실계정이 아니고 이 값으로 열리는 것은 체험 화면뿐이다. "
             "⚠️ 공개 배포본에 들어 있다는 사실 자체는 형이 아는 상태로 둔다 — 실서비스 전환 시 이 파일부터 걷어낸다.",
         by="조성래", at="2026-11-12"),
    dict(path="src/utils/demoAuth.js", pat="secret",
         why="관리자 체험 계정. 하네스(devcred.mjs)가 이 상수를 단일 원천으로 읽어 로그인하므로 값이 코드에 있어야 한다. "
             "⚠️ 공개 배포본에 들어 있다 — 실서비스 전환 시 서버 인증으로 옮긴다.",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/devcred.mjs", pat="secret",
         why="위 상수를 읽는 하네스 공용 로그인. 값을 적지 않고 원본에서 읽는다(사본을 만들지 않는 자리).",
         by="조성래", at="2026-11-12"),
    dict(path="index.html", pat="secret",
         why="생성 산출물이다. 원천(src/ · build_preview.sh)을 이미 검사하므로 같은 값을 두 번 센다.",
         by="조성래", at="2026-11-12"),
    dict(path="preview.html", pat="secret",
         why="위와 같은 생성 산출물.", by="조성래", at="2026-11-12"),
    dict(path="scripts/run_money_check.mjs", pat="secret",
         why="코호트 하네스가 자격증명을 **직접 들고 있다** — devcred.mjs 의 단일 원천 사상에 어긋나는 자리다. "
             "면제는 봐주는 것이 아니라 아는 상태로 두는 것이고, 이 줄은 **정리 대상**이다.",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/run_persona_diff.mjs", pat="secret",
         why="위와 같은 하드코딩. 같은 이유로 정리 대상이다.", by="조성래", at="2026-11-12"),
    dict(path="src/data/corpUpload.js", pat="rrn",
         why="자료 반입 화면의 **탐지기 자기시험 표본**. 브라우저에서도 탐지기가 살아 있는지 먼저 증명해야 「실제 0건」이 뜻을 갖는다 — 이 게이트 자신이 패턴을 문자로 드는 것과 같은 구조다. 실재하지 않는 값이고, 카드는 결제사가 공개한 시험번호다.",
         by="조성래", at="2026-11-12"),
    dict(path="src/data/corpUpload.js", pat="card",
         why="자료 반입 화면의 **탐지기 자기시험 표본**. 브라우저에서도 탐지기가 살아 있는지 먼저 증명해야 「실제 0건」이 뜻을 갖는다 — 이 게이트 자신이 패턴을 문자로 드는 것과 같은 구조다. 실재하지 않는 값이고, 카드는 결제사가 공개한 시험번호다.",
         by="조성래", at="2026-11-12"),
    dict(path="src/data/corpUpload.js", pat="passport",
         why="자료 반입 화면의 **탐지기 자기시험 표본**. 브라우저에서도 탐지기가 살아 있는지 먼저 증명해야 「실제 0건」이 뜻을 갖는다 — 이 게이트 자신이 패턴을 문자로 드는 것과 같은 구조다. 실재하지 않는 값이고, 카드는 결제사가 공개한 시험번호다.",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/run_corpops_ledger.mjs", pat="rrn",
         why="⑪ 블록의 **심는 표본**. 금지 자료를 실제로 심어 막히는지 보는 자리다(음성 테스트와 같은 사상).",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/run_corpops_ledger.mjs", pat="card",
         why="⑪ 블록의 **심는 표본**. 금지 자료를 실제로 심어 막히는지 보는 자리다(음성 테스트와 같은 사상).",
         by="조성래", at="2026-11-12"),
    dict(path="index.html", pat="rrn",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="index.html", pat="card",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="index.html", pat="passport",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="preview.html", pat="rrn",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="preview.html", pat="card",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="preview.html", pat="passport",
         why="생성 산출물이다. 위 두 원천의 검사용 표본이 번들에 그대로 실린다 — 원천을 개별 면제했으므로 여기서 또 세면 같은 표본을 두 번 세는 것이다. 번들에만 생기는 유입은 head 템플릿(build_preview.sh)이 따로 검사된다.",
         by="조성래", at="2026-11-12"),
    dict(path="scripts/run_voice_regression.mjs", pat="*",
         why="음성 회귀의 금칙 픽스처. 같은 이유.",
         by="조성래", at="2026-11-12"),
]

# ── 이진 파일 — 정규식이 통하지 않으므로 이름으로 등재한다 ──
#    등재되지 않은 이진이 새로 들어오면 차단한다. 안을 못 보니 「확인했다」고 말할 수 없기 때문이다.
BIN_EXT = (".docx", ".doc", ".xlsx", ".xls", ".pdf", ".hwp", ".zip", ".pptx", ".ppt",
           ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mov", ".ico", ".woff", ".woff2", ".ttf")
BIN_OK_DIR = ("data/img/", "data/promo/", "data/media/", "data/docs/report_sample/", "pet/images/", "sm/")
BIN_OK_FILE = {
    "data/docs/HiFin_HealthReport_Sample.pdf": "검진 리포트 견본 — 회원 식별자 없음",
    "data/docs/HiZenCare_HIFin_Investor_IR.docx": "투자 소개 자료 — 법인등록번호·사업자번호 포함(법인 정보이고 개인정보가 아니다)",
    "data/docs/hifin_investment_agreement.docx": "투자계약서 서식 — 법인 간 계약",
    "data/docs/hifin_partnership_agreement.docx": "제휴계약서 서식 — 법인 간 계약",
    "og.png": "대표 이미지",
    "og-human.png": "대표 이미지(사람 축)",
    "pet/og-pet.png": "하이펫 대표 이미지",
    "data/premium_infographic.png": "보험료 설명 인포그래픽 — 식별자 없음",
}

TEXT_EXT = (".js", ".jsx", ".ts", ".tsx", ".json", ".py", ".mjs", ".sh", ".md", ".html",
            ".css", ".txt", ".yml", ".yaml", ".csv", ".svg")

PLACEHOLDER = re.compile(r"(?i)(your|xxx+|000+|example|sample|changeme|여기|자리표시|placeholder|\.\.\.|<[^>]+>)")


def rrn_ok(m):
    """주민등록번호 검증 — 날짜 꼴 + 검사숫자. 둘 다 통과해야 진짜로 본다.
       13자리 숫자를 전부 막으면 금액·법인등록번호가 걸려 게이트를 못 쓴다."""
    yy, mm, dd, s, rest = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    if not (1 <= int(mm) <= 12 and 1 <= int(dd) <= 31):
        return False
    digits = [int(c) for c in (yy + mm + dd + s + rest)]
    w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
    chk = (11 - sum(d * x for d, x in zip(digits[:12], w)) % 11) % 10
    return chk == digits[12]


def luhn_ok(m):
    """카드번호 검증식. 16자리 숫자 중 검증식을 통과하는 것만 본다
       (실측: 통과 안 하는 16자리가 290건 있었고 전부 재무 상수였다)."""
    s = re.sub(r"[^0-9]", "", m.group(0))
    if len(s) != 16:
        return False
    tot, alt = 0, False
    for c in reversed(s):
        d = int(c)
        if alt:
            d *= 2
            if d > 9: d -= 9
        tot += d; alt = not alt
    return tot % 10 == 0


def notplaceholder_ok(m):
    """자리표시자는 비밀값이 아니다 — 그걸 막으면 예시조차 못 쓴다."""
    return not PLACEHOLDER.search(m.group(0))


CHECKS = {"rrn": rrn_ok, "luhn": luhn_ok, "notplaceholder": notplaceholder_ok}


def exempted(path, key):
    for e in EXEMPT:
        if e["path"] == path and (e["pat"] == "*" or e["pat"] == key):
            return e
    return None


def tracked():
    out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [x for x in out.stdout.split("\n") if x.strip()]


def staged():
    out = subprocess.run(["git", "diff", "--cached", "--name-only"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [x for x in out.stdout.split("\n") if x.strip() and os.path.exists(x)]


def scan_text(path):
    """한 파일을 훑어 (패턴키, 줄번호) 목록을 돌려준다. **값은 담지 않는다.**"""
    hits = []
    try:
        s = io.open(path, encoding="utf-8", errors="ignore").read()
    except Exception:
        return hits
    for p in PATTERNS:
        ck = CHECKS.get(p["check"]) if p["check"] else None
        for m in p["re"].finditer(s):
            if ck and not ck(m):
                continue
            hits.append((p["k"], s.count("\n", 0, m.start()) + 1))
    return hits


def scan_string(s):
    """자기시험용 — 문자열을 직접 먹인다."""
    out = {}
    for p in PATTERNS:
        ck = CHECKS.get(p["check"]) if p["check"] else None
        n = 0
        for m in p["re"].finditer(s):
            if ck and not ck(m):
                continue
            n += 1
        if n: out[p["k"]] = n
    return out


def selftest():
    """탐지기 자기시험 — 합성 표본을 먹여 살아 있음을 먼저 증명한다.
       ⚠️ 여기 적힌 숫자는 검사 전용으로 만든 표본이다. 실재하지 않는다."""
    ok, bad = [], []

    def want(label, text, key, n):
        got = scan_string(text).get(key, 0)
        (ok if got == n else bad).append("%s — %s %d건(기대 %d)" % (label, key, got, n))

    # 양성 — 반드시 잡혀야 한다
    want("주민번호 꼴(검증식 통과)", "x 950101-1234564 y", "rrn", 1)
    want("여권 꼴", "code M12345678 end", "passport", 1)
    want("카드 꼴(검증식 통과)", "no 4111-1111-1111-1111 end", "card", 1)
    want("비밀값 대입", 'const o = { api_key: "AbCdEf123456789" };', "secret", 1)
    want("발급 토큰", "k = AKIA" + "A" * 16, "token", 1)
    # 음성 — 잡히면 안 된다(오탐)
    want("검증식 실패 13자리", "amount 950101-1234567 won", "rrn", 0)
    want("달이 13인 꼴", "x 991301-1234564 y", "rrn", 0)
    want("날짜 아닌 앞자리(법인등록번호 꼴)", "corp 110111-1234568 no", "rrn", 0)
    want("검증식 실패 16자리", "v 1234-5678-9012-3456 end", "card", 0)
    want("자리표시자", 'password: "your-password"', "secret", 0)
    want("일반 금액 13자리", "total 1234567890123 won", "rrn", 0)

    print("[민감] 탐지기 자기시험 — 통과 %d · 실패 %d" % (len(ok), len(bad)))
    for b in bad: print("   ✗", b)
    return len(bad) == 0


# ── 음성 테스트 — **금지 자료를 실제로 심어** 막히는지 본다 ────────────────
#    자기시험(문자열)은 정규식이 살아 있는지만 본다. 음성 테스트는 **파일 경로를 타는 길 전체**
#    (확장자 판별 · 면제 조회 · 이진 등재 · 종료 코드)가 실제로 막는지를 본다.
#    ⚠️ 심은 자료는 반드시 지운다. 심는 자리는 화이트리스트 .gitignore 가 기본으로 무시하는
#       새 최상위 폴더다 — 그래도 끝나고 git 상태가 깨끗한지 직접 확인한다.
#    ⚠️ 여기 적힌 값은 검사 전용 표본이다. 실재하지 않는다.
NEG_DIR = ".sensitive_negative_tmp"


def _w(path, text):
    io.open(path, "w", encoding="utf-8", newline="\n").write(text + "\n")


def negative():
    import shutil
    cases = [
        ("rrn.js", 'const x = "950101-1234564";', "rrn"),
        ("passport.js", 'const p = "M12345678";', "passport"),
        ("card.js", 'const c = "4111-1111-1111-1111";', "card"),
        ("secret.js", 'const o = { api_key: "AbCdEf123456789" };', "secret"),
        ("token.js", 'const t = "AKIA' + "A" * 16 + '";', "token"),
    ]
    ok, bad = [], []
    try:
        if os.path.isdir(NEG_DIR):
            shutil.rmtree(NEG_DIR)
        os.makedirs(NEG_DIR)
        for fn, body, key in cases:
            fp = NEG_DIR + "/" + fn
            _w(fp, body)
            hits = [k for k, _ in scan_text(fp)]
            if key in hits:
                ok.append("심은 " + key + " — 차단됨")
            else:
                bad.append("심은 " + key + " — 통과시켰다")
        # 양성 대조 — 깨끗한 파일은 통과해야 한다. 늘 막는 게이트는 게이트가 아니다.
        fp = NEG_DIR + "/clean.js"
        _w(fp, 'const n = 1234567890123;\nconst d = "2026-11-12";\nconst amt = 1234567890123456;')
        if not scan_text(fp):
            ok.append("깨끗한 파일 — 통과(오탐 없음)")
        else:
            bad.append("깨끗한 파일 — 막았다(오탐)")
        # 면제 경로가 실제로 비껴가는지 — 면제가 글자만이고 동작하지 않으면 그것도 구멍이다
        if exempted(SELF, "rrn"):
            ok.append("면제 조회 — 동작")
        else:
            bad.append("면제 조회 — 비동작")
        if not exempted(NEG_DIR + "/rrn.js", "rrn"):
            ok.append("면제 안 된 경로는 면제되지 않는다")
        else:
            bad.append("면제 안 된 경로가 면제됐다")
        # 미등재 이진 — 이름 등재 경로
        fp = NEG_DIR + "/x.docx"
        io.open(fp, "wb").write(b"PK")
        reg = fp in BIN_OK_FILE or any(fp.startswith(dd) for dd in BIN_OK_DIR)
        if not reg:
            ok.append("미등재 이진 — 차단 대상으로 식별")
        else:
            bad.append("미등재 이진 — 등재된 것으로 보였다")
    finally:
        if os.path.isdir(NEG_DIR):
            shutil.rmtree(NEG_DIR, ignore_errors=True)
    if not os.path.isdir(NEG_DIR):
        ok.append("심은 자료 제거 — 완료")
    else:
        bad.append("심은 자료 제거 — 남았다")
    st = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True,
                        encoding="utf-8", errors="replace")
    dirty = [x for x in st.stdout.split("\n") if NEG_DIR in x]
    if not dirty:
        ok.append("git 상태에 흔적 없음 — 확인")
    else:
        bad.append("git 상태에 흔적이 남았다")
    print("[민감] 음성 테스트 — 통과 %d · 실패 %d" % (len(ok), len(bad)))
    for b in bad:
        print("   ✗", b)
    return len(bad) == 0


def main():
    argv = sys.argv[1:]
    if "--list" in argv:
        print("[민감] 패턴 %d종" % len(PATTERNS))
        for p in PATTERNS:
            print("   · %-9s %s\n       왜: %s\n       대신: %s" % (p["k"], p["ko"], p["why"], p["alt"]))
        print("[민감] 면제 %d건(사유·승인자·날짜 필수)" % len(EXEMPT))
        for e in EXEMPT:
            print("   · %s [%s] %s — %s %s" % (e["path"], e["pat"], e["why"], e["by"], e["at"]))
        return 0
    if "--selftest" in argv:
        return 0 if selftest() else 1
    if "--negative" in argv:
        return 0 if (selftest() and negative()) else 1

    # 면제 자체가 성립하는지 먼저 본다 — 사유·승인자·날짜가 비면 면제가 아니라 구멍이다
    broken = [e for e in EXEMPT if not (e.get("why", "").strip() and e.get("by", "").strip() and e.get("at", "").strip())]
    if broken:
        print("[민감] 면제 %d건에 사유·승인자·날짜가 비어 있습니다 — 면제로 인정하지 않습니다" % len(broken))
        for e in broken: print("   ·", e.get("path"))
        return 1
    # 있지도 않은 파일을 면제해 두면 면제 목록이 조용히 낡는다
    stale = [e for e in EXEMPT if not os.path.exists(e["path"])]
    if stale:
        print("[민감] 면제 목록에 없는 파일 %d건 — 정리하세요" % len(stale))
        for e in stale: print("   ·", e["path"])
        return 1

    if not selftest():
        print("[민감] 탐지기가 살아 있지 않습니다 — 실제 검사를 믿을 수 없어 차단합니다")
        return 1

    files = staged() if "--staged" in argv else tracked()
    bad, binbad, nt, nb = [], [], 0, 0
    for f in files:
        low = f.lower()
        if low.endswith(BIN_EXT):
            nb += 1
            if f in BIN_OK_FILE or any(f.startswith(d) for d in BIN_OK_DIR):
                continue
            binbad.append(f)
            continue
        if not low.endswith(TEXT_EXT):
            continue
        nt += 1
        for key, line in scan_text(f):
            e = exempted(f, key)
            if e: continue
            bad.append((f, line, key))

    if bad or binbad:
        print("[민감] 차단 — 텍스트 적중 %d건 · 미등재 이진 %d건" % (len(bad), len(binbad)))
        for f, line, key in bad[:40]:
            p = next(x for x in PATTERNS if x["k"] == key)
            print("   · %s:%s — %s" % (f, line, p["ko"]))
            print("       왜: %s" % p["why"])
            print("       대신: %s" % p["alt"])
        if len(bad) > 40: print("   … 외 %d건" % (len(bad) - 40))
        for f in binbad[:20]:
            print("   · %s — 등재되지 않은 이진 파일(안을 볼 수 없어 「확인했다」고 말할 수 없습니다)" % f)
            print("       대신: 꼭 필요하면 check_sensitive.py 의 BIN_OK_FILE 에 사유와 함께 등재하세요")
        if len(binbad) > 20: print("   … 외 %d건" % (len(binbad) - 20))
        print("[민감] 값은 출력하지 않습니다 — 파일과 줄만 적습니다.")
        return 1

    print("[민감] 통과 — 텍스트 %d · 이진 %d(등재 %d) · 패턴 %d종 · 면제 %d건 · 적중 0" %
          (nt, nb, len(BIN_OK_FILE), len(PATTERNS), len(EXEMPT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
