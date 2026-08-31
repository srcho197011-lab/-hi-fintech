# -*- coding: utf-8 -*-
"""내비게이션 인벤토리 추출기 — 설계 프롬프트 v2.1 §3 (P1).

코드가 진실이다: 섹션(L1)·서브섹션 탭(L2)·기능 앵커(L3)·도메인 어휘(L4)를
실제 소스에서 추출해 src/data/navInventory.js(단일 소스)를 생성한다.

사용법:
  python scripts/gen_nav_inventory.py           # 추출·생성(해시 동일하면 미변경)
  python scripts/gen_nav_inventory.py --check   # 신선도 검사만(빌드 게이트) — 불일치 시 exit 1
  python scripts/gen_nav_inventory.py --mark-bypass  # 비상 우회 표기(콘솔 드리프트 배지 점등)

원칙(v2.1):
  · 수기 목록 금지 — L1·L2는 소스 파싱. L3·L4는 소스 참조를 명기한 큐레이션(추출기 안에서만 관리).
  · 소스 형태가 바뀌어 파싱이 어긋나면 조용히 넘어가지 않고 실패한다(개수 하한 검증).
  · 별칭은 결정론 파생(공백·중점 제거 + 두벌식 영타) — 사람이 나열하지 않는다.
  · owner 경계(§4-2): checkup·manage·ai 계열은 sarg 소유로 표기 — 코퍼스 생성기가 이 라벨을 지킨다.
"""
import io, os, re, sys, hashlib, json, datetime
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "data", "navInventory.js")

# ── 감시 대상(§10-1) — 이 파일들이 바뀌면 인벤토리를 재생성해야 한다 ──
WATCH = [
    "src/core.jsx",                       # L1 SECTIONS · SEC_PARENT
    "src/App.jsx",                        # admin 게이트(ontology·healthmate 필터)
    "src/components/SectionGroups.jsx",   # L2 그룹 탭 3벌(home/care/mywallet)
    "src/components/Checkup.jsx",         # L2 검진 카테고리
    "src/components/Insurance.jsx",       # L2 보험 탭
    "src/components/Wallet.jsx",          # L2 지갑 탭
    "src/components/MyPage.jsx",          # L2 가족관리 탭
    "src/components/Nft.jsx",             # L2 NFT 탭
    "src/components/Hospital.jsx",        # L2 병원 탭
    "src/components/Community.jsx",       # L2 커뮤니티 탭
    "src/components/Social.jsx",          # L2 사회적기업 탭
    "src/components/HealthMate.jsx",      # L2 프로 워크벤치(관리자)
    "src/components/B2BConsole.jsx",      # L2 B2B 콘솔(관리자)
    "src/data/homecare.json",             # L4 재가 서비스
    "src/data/brandTokens.js",            # 고유명 토큰
    "scripts/gen_nav_inventory.py",       # 추출기 자신 — L3 큐레이션·파싱 규칙 변경도 드리프트다
]

def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding="utf-8").read()

def source_hash():
    h = hashlib.md5()
    for rel in WATCH:
        h.update(read(rel).encode("utf-8"))
    return h.hexdigest()[:16]

# ── 별칭 파생 — 두벌식 영타(demoAuth.js hangulToQwerty와 동일 표) ──
_CHO = ["r","R","s","e","E","f","a","q","Q","t","T","d","w","W","c","z","x","v","g"]
_JUNG = ["k","o","i","O","j","p","u","P","h","hk","ho","hl","y","n","nj","np","nl","b","m","ml","l"]
_JONG = ["","r","R","rt","s","sw","sg","e","f","fr","fa","fq","ft","fx","fv","fg","a","q","qt","t","T","d","w","c","z","x","v","g"]
def h2q(s):
    out = ""
    for ch in s:
        c = ord(ch)
        if 0xAC00 <= c <= 0xD7A3:
            i = c - 0xAC00
            out += _CHO[i // 588] + _JUNG[(i % 588) // 28] + _JONG[i % 28]
        else:
            out += ch
    return out

def aliases_of(label):
    base = re.sub(r"[①-⑨🩺🚨]|\(운영\)", "", label).strip()
    flat = re.sub(r"[\s·]", "", base)
    cand = {base, flat}
    if re.search(r"[가-힣]", flat):
        cand.add(h2q(flat))
    cand.discard(label)
    return sorted(x for x in cand if x)

# ── L1 섹션 — core.jsx SECTIONS ──
def extract_l1():
    src = read("src/core.jsx")
    m = re.search(r"const SECTIONS = \[(.*?)\n\];", src, re.S)
    assert m, "core.jsx SECTIONS 파싱 실패 — 소스 형태 변경"
    rows = re.findall(r'\{\s*k:\s*"([a-z]+)",\s*ic:\s*\w+,\s*t:\s*"([^"]+)",\s*s:\s*"([^"]+)"', m.group(1))
    assert len(rows) >= 8, "L1 섹션 %d개 — 하한(8) 미달" % len(rows)
    admin_m = re.search(r'x\.k !== "(\w+)" && x\.k !== "(\w+)"', read("src/App.jsx"))
    admins = set(admin_m.groups()) if admin_m else set()
    out = []
    for k, t, s in rows:
        out.append({"key": "sec." + k, "label": t, "path": t, "surface": "section", "nav": k,
                    "owner": "sarg" if k in ("checkup",) else "nav",
                    "admin": k in admins, "desc": s, "aliases": aliases_of(t)})
    return out

# ── L2 서브섹션 — 컴포넌트 탭 배열 파싱 ──
# (파일, 부모 nav 결정: 첫 키 → nav 매핑, admin 여부)
L2_FILES = [
    ("src/components/SectionGroups.jsx", {"story": "home", "manage": "care", "wallet": "mywallet"}, False),
    ("src/components/Insurance.jsx", {"custom": "insurance"}, False),
    ("src/components/Wallet.jsx", {"earn": "wallet"}, False),
    ("src/components/MyPage.jsx", {"family": "mypage"}, False),
    ("src/components/Nft.jsx", {"mine": "nft"}, False),
    ("src/components/Hospital.jsx", {"hosp": "hospital"}, False),
    ("src/components/Community.jsx", {"feed": "community"}, False),
    ("src/components/Social.jsx", {"index": "social"}, False),
    ("src/components/B2BConsole.jsx", {"subs": "partner"}, True),
]
# 탭이 이동 대상이 되는 화면의 owner — care 그룹의 manage/ai는 sarg 소유(§4-2)
SARG_TABS = {"manage", "ai"}

def extract_l2():
    out = []
    for rel, navmap, admin in L2_FILES:
        src = read(rel)
        arrays = re.findall(r"const (?:tabs|TABS) = \[(.*?)\];", src, re.S)
        got = 0
        for body in arrays:
            items = re.findall(r'\[\s*"([a-z]+)"\s*,\s*"([^"]+)"', body)
            if not items:
                continue
            first = items[0][0]
            nav = navmap.get(first)
            if nav is None:
                continue
            got += 1
            for k, label in items:
                out.append({"key": "tab.%s.%s" % (nav, k), "label": label, "path": nav + " › " + label,
                            "surface": "tab", "nav": k if k in SARG_TABS or _is_navkey(k) else nav, "tab": k,
                            "owner": "sarg" if k in SARG_TABS else "nav",
                            "admin": admin, "desc": "", "aliases": aliases_of(label)})
        assert got >= 1, rel + " — 탭 배열 파싱 실패(소스 형태 변경)"
    # Checkup 카테고리(cats — 검진은 sarg 소유 경계 안)
    src = read("src/components/Checkup.jsx")
    m = re.search(r"const cats = \[(.*?)\];", src, re.S)
    assert m, "Checkup cats 파싱 실패"
    for k, label in re.findall(r'\[\s*"([a-z]+)"\s*,\s*"([^"]+)"', m.group(1)):
        out.append({"key": "tab.checkup.%s" % k, "label": re.sub(r"^[^ ]*? ", "", label) if label[:1] in "🩺🚨" else label,
                    "path": "checkup › " + label, "surface": "tab", "nav": "checkup", "tab": k,
                    "owner": "sarg", "admin": False, "desc": "", "aliases": aliases_of(label)})
    # HealthMate 워크벤치(숫자 키 — 관리자·프로 전용)
    src = read("src/components/HealthMate.jsx")
    # 리터럴이 ];로 끝나거나 ].filter(...)(P5 ⑩ 관리자 필터) 체인으로 이어져도 읽는다
    m = re.search(r"const TABS = \[(.*?)\]\s*(?:;|\.filter)", src, re.S)
    assert m, "HealthMate TABS 파싱 실패"
    hm = re.findall(r'\[\s*(\d+)\s*,\s*"([^"]+)"', m.group(1))
    assert len(hm) >= 9, "HealthMate 워크벤치 %d개 — 하한(9) 미달" % len(hm)
    for n, label in hm:
        out.append({"key": "tab.healthmate.%s" % n, "label": label, "path": "healthmate › " + label,
                    "surface": "tab", "nav": "healthmate", "tab": n, "owner": "nav",
                    "admin": True, "desc": "", "aliases": aliases_of(label)})
    return out

# care 그룹 탭 중 자체 nav 키를 갖는 것(SectionGroups는 탭키=nav키)
def _is_navkey(k):
    return k in ("story", "home", "social", "community", "manage", "tele", "ai", "homecare", "shop",
                 "wallet", "mypage", "nft", "vault", "trust")

# ── L3 기능 앵커 — 소스 참조를 명기한 큐레이션(추출기 단일 관리 · 자동 전수는 P2) ──
L3 = [
    ("act.checkup.book",    "검진 예약하기",        "checkup", None, "sarg", False, "Checkup.jsx 예약 버튼"),
    ("act.checkup.upload",  "검진결과 올리기",       "onboarding", None, "nav", False, "DataOnboarding 진입"),
    ("act.ins.claim",       "보험금 간편청구",       "insurance", "claimpay", "nav", False, "insService claimSubmit"),
    ("act.ins.rerate",      "요율 재산정 신청",      "insurance", "rerate", "nav", False, "insService rerateApplyReal"),
    ("act.ins.billing",     "보험료 납부",          "insurance", "billing", "nav", False, "Insurance billing 탭"),
    ("act.shop.subs",       "정기배송 관리",         "shop", None, "nav", False, "subscription.js"),
    ("act.shop.rx",         "수령증 보여줘",         "ai", None, "tool", False, "nutriRx 수령증 QR"),
    ("act.wallet.topup",    "충전하기",             "wallet", "topup", "nav", False, "HtkTopup"),
    ("act.wallet.give",     "나눔·기부",            "wallet", "give", "nav", False, "Wallet give 탭"),
    ("act.family.add",      "가족 등록",            "mypage", "family", "nav", False, "FamilyCare"),
    ("act.consent.manage",  "동의관리",             "mypage", "consent", "nav", False, "MyPage consent 탭"),
    ("act.homecare.apply",  "돌봄 서비스 신청",      "homecare", None, "nav", False, "Homecare 신청"),
    ("act.tele.connect",    "원격진료 연결",         "tele", None, "nav", False, "SectionGroups tele"),
    ("act.consult.region",  "내 지역 상담",          "insurance", "region", "nav", False, "RegionConsult"),
]

def extract_l3():
    return [{"key": k, "label": lb, "path": nav + " › " + lb, "surface": "action", "nav": nav,
             **({"tab": tab} if tab else {}), "owner": ow, "admin": adm, "desc": ref,
             "aliases": aliases_of(lb)} for k, lb, nav, tab, ow, adm, ref in L3]

# ── L4 도메인 어휘 — 데이터 파일에서 추출 ──
def extract_l4():
    out = []
    # 재가 서비스 6종(homecare.json)
    try:
        hc = json.loads(read("src/data/homecare.json"))
        names = list(hc.get("svc") or [])            # 재가급여 서비스 종별 — svc 배열이 단일 소스
        assert len(names) >= 6, "homecare svc %d종 — 하한(6) 미달" % len(names)
        for n in names:
            out.append({"key": "dom.homecare." + h2q(re.sub(r"\s", "", n))[:14], "label": n,
                        "path": "homecare › " + n, "surface": "action", "nav": "homecare",
                        "owner": "qna", "admin": False, "desc": "homecare.json", "aliases": aliases_of(n)})
    except Exception as e:
        raise AssertionError("homecare.json 파싱 실패: %r" % e)
    # 검진 대표 검사 항목(Checkup exams)
    m = re.search(r"const exams = \[(.*?)\];", read("src/components/Checkup.jsx"), re.S)
    if m:
        for name, _d in re.findall(r'\[\s*"([^"]+)"\s*,\s*"([^"]+)"', m.group(1)):
            out.append({"key": "dom.exam." + h2q(re.sub(r"[\s·]", "", name))[:14], "label": name,
                        "path": "checkup › 검사항목 › " + name, "surface": "action", "nav": "checkup",
                        "owner": "qna", "admin": False, "desc": "Checkup.jsx exams", "aliases": aliases_of(name)})
    return out

# ── 개칭 이력 별칭(§4-N 형 확정 2026-08-31) — 회원이 옛 이름으로 불러도 라우팅이 살아야 한다 ──
LEGACY_ALIASES = {
    "sec.insurance":          ["보험·치료비", "보험치료비", "보험 치료비"],
    "tab.insurance.custom":   ["맞춤보험", "맞춤 보험"],
    "tab.healthmate.7":       ["보장분석 대화", "보장분석대화"],
}

# ── 생성 ──
def build():
    inv = extract_l1() + extract_l2() + extract_l3() + extract_l4()
    # key 중복 검증
    keys = [x["key"] for x in inv]
    dup = sorted({k for k in keys if keys.count(k) > 1})
    assert not dup, "key 중복: %s" % dup
    # 개칭 이력 별칭 병합(구 명칭 인식 유지)
    for x in inv:
        extra = LEGACY_ALIASES.get(x["key"])
        if extra:
            x["aliases"] = sorted(set(x["aliases"]) | set(extra))
    # 고유명 리터럴 린트(§3-3) — 신규 산출물에 브랜드 리터럴 직접 등장 금지(라벨이 실제 화면명인 경우는 예외 대상 아님)
    return inv

def render(inv, sh, bypass=False):
    today = datetime.date.today().isoformat()
    meta = {"version": 1, "sourceHash": sh, "generatedAt": today, "bypass": bypass}
    L = ["/* 자동 생성 파일 — 직접 수정 금지. 재생성: python scripts/gen_nav_inventory.py",
         "   단일 소스(설계 프롬프트 v2.1 §3): 코퍼스·사전·회귀·P1 판정기가 전부 이 파일을 참조한다. */",
         "const NAV_INV_META = " + json.dumps(meta, ensure_ascii=False) + ";",
         "const NAV_INVENTORY = ["]
    for x in inv:
        L.append("  " + json.dumps(x, ensure_ascii=False) + ",")
    L.append("];")
    return "\n".join(L) + "\n"

def current_stamp():
    try:
        m = re.search(r"const NAV_INV_META = (\{.*?\});", io.open(OUT, encoding="utf-8").read())
        return json.loads(m.group(1)) if m else None
    except Exception:
        return None

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    sh = source_hash()
    st = current_stamp()
    if mode == "--check":
        if st and st.get("sourceHash") == sh:
            print("nav-inventory fresh (%s)" % sh); return 0
        print("[DRIFT] 감시 파일이 바뀌었는데 인벤토리가 구버전입니다.")
        print("        재생성: python scripts/gen_nav_inventory.py")
        print("        비상 우회(1회용): HIFIN_NAV_BYPASS=1 bash build_preview.sh  ← 콘솔에 드리프트 배지가 켜집니다")
        return 1
    if mode == "--list-watch":                     # 커밋 게이트가 읽는 감시 목록(단일 소스)
        try: sys.stdout.reconfigure(newline=chr(10))   # Windows CRLF 변환 차단 - 게이트 grep가 기계 소비
        except Exception: pass
        for w in WATCH: print(w)
        return 0
    if mode == "--bypass-guard":                   # 배지 점등 상태면 재우회 불가(§10-1)
        if st and st.get("bypass"):
            print("[GATE] 드리프트 배지가 켜져 있습니다 - 재우회 불가. 먼저 재생성·회귀로 해소하세요.")
            return 1
        return 0
    if mode == "--clear-bypass":                   # 게이트 통과 후 배지 해소
        if st and st.get("bypass"):
            txt = io.open(OUT, encoding="utf-8").read()
            st["bypass"] = False
            txt = re.sub(r"const NAV_INV_META = \{.*?\};",
                         "const NAV_INV_META = " + json.dumps(st, ensure_ascii=False) + ";", txt, 1)
            io.open(OUT, "w", encoding="utf-8", newline="\n").write(txt)
            print("드리프트 배지 해소")
        return 0
    if mode == "--mark-bypass":
        if st:
            txt = io.open(OUT, encoding="utf-8").read()
            st["bypass"] = True
            txt = re.sub(r"const NAV_INV_META = \{.*?\};",
                         "const NAV_INV_META = " + json.dumps(st, ensure_ascii=False) + ";", txt, 1)
            io.open(OUT, "w", encoding="utf-8", newline="\n").write(txt)
            print("bypass 표기 — 콘솔 드리프트 배지 점등")
        return 0
    inv = build()
    if st and st.get("sourceHash") == sh and not st.get("bypass"):
        print("unchanged (%s) — %d항목" % (sh, len(inv))); return 0
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(render(inv, sh))
    by = {}
    for x in inv: by[x["surface"]] = by.get(x["surface"], 0) + 1
    print("generated %s — %d항목 %s hash=%s" % (os.path.relpath(OUT, ROOT), len(inv), by, sh))
    return 0

if __name__ == "__main__":
    sys.exit(main())
