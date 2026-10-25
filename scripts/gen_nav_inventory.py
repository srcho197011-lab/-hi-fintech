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
    # ── 협력업체 온톨로지·하네스(2026-10-25 P1) — 감시 구멍 닫기 ──
    # 이 세 파일 + 용어 원천은 **어떤 커밋 게이트의 감시목록에도 없었다**. 그래서 개칭·신설이
    # 「무사 통과」했는데, 그것은 안전의 증거가 아니라 감시 밖이라는 증거다
    # (dailyRoster.js·보장 창에서 이미 두 번 재발한 유형이다). 새 게이트를 발명하지 않고
    # pre-commit 이 --list-watch 로 읽는 이 목록에 편입해 기존 내비 게이트를 발동시킨다.
    "src/components/Ontology.jsx",         # 온톨로지 상위 9탭(L2) — 개칭 사정권
    "src/components/SupplyOntology.jsx",   # 협력업체 온톨로지·하네스 패널(거래 사실 레이어)
    "src/data/supplyData.js",              # 거래 사실 생성기 — 정산은 주문 파생 종속 장부다
    "src/data/partnerGov.js",              # 용어·표시명 단일 원천(PG_TERMS · PG_NAME_MODE · pgDisplayName)
    # ── P3(2026-10-25) — 정책 레지스트리·판정기. 지시서 §13-5 산출물 ⑦·§14-3이 「P3에 1파일」로 못 박았다.
    #    P1에서 미리 넣지 않은 이유는 read()에 예외 처리가 없어 파일이 없으면 빌드·커밋이 동시에 죽기 때문이고,
    #    이제 파일이 생겼으므로 편입한다. 조문·확인 등급·집행 수준이 바뀌면 내비 게이트도 함께 발동한다.
    "src/data/partnerPolicy.js",           # PG_LAWS · PG_POLICIES · PG_ENFORCE · pgDecide(하드 플로어)
    # ── P7(2026-10-26) — 보고서 지면. 서브탭 5개가 여기서 렌더되고, 지면이 바뀌면 L3 등재도 흔들린다.
    #    P5a·P5b가 「navInventory 재생성이 nav 회귀 기대치를 흔든다」는 사유로 미뤘던 항목이고,
    #    지금 등재(아래 서브탭 블록)와 함께 들어온다 — 감시 밖에 신설 지면을 남기지 않는다.
    "src/components/PartnerGovReport.jsx",  # 내부통제 보고서 · 정책 엔진 지면(서브탭 ④⑤)
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
    # 온톨로지 상위 탭(관리자 전용) — 등재가 없으면 하이가 지칭으로 찾아갈 수 없다.
    # navInventory 106항목에 온톨로지 하위 탭이 **한 건도 없었다**(sec.ontology 1건뿐).
    # ⚠ topTabs 의 라벨은 **리터럴**이어야 한다 — 이 추출기가 소스에서 읽는 유일한 자리이고,
    #   상수로 바꾸면 여기서 라벨을 못 읽어 하한 검증에서 죽는다. 라벨의 뜻 원천은 partnerGov.js 의
    #   PG_SECTION_KO 이고, 둘이 어긋나지 않는지는 run_wording_guard 가 정적으로 대조한다.
    src = read("src/components/Ontology.jsx")
    m = re.search(r"const topTabs = \[(.*?)\];", src, re.S)
    assert m, "Ontology topTabs 파싱 실패 — 소스 형태 변경"
    ot = re.findall(r'\[\s*"([a-z]+)"\s*,\s*"([^"]+)"', m.group(1))
    assert len(ot) >= 9, "온톨로지 상위 탭 %d개 — 하한(9) 미달" % len(ot)
    for k, label in ot:
        out.append({"key": "tab.ontology.%s" % k, "label": label, "path": "ontology › " + label,
                    "surface": "tab", "nav": "ontology", "tab": k, "owner": "nav",
                    "admin": True, "desc": "", "aliases": aliases_of(label)})
    # 협력업체 온톨로지·하네스 서브탭 5개(L3 · 관리자 전용 · P7 · 지시서 §13-10 산출물 ③)
    # 왜 등재하는가 — 서브탭 분할(P5a) 뒤 하이가 「내부통제 보고서 보여줘」로 찾아갈 수 없었다.
    #   상위 탭 1건(tab.ontology.partner)만 등재돼 있어서 **지면 5개가 지칭 밖**이었다.
    # ⚠ 라벨의 단일 원천은 partnerGov.js 의 PG_SUBTABS 다(컴포넌트는 그 상수만 쓴다 — §0-5).
    #   착지는 상위 탭(ontology › partner)이다. 서브탭 시드 경로는 두지 않는다 — 실소비처가
    #   확인된 탭 시드는 insurance·checkup 두 곳뿐이고(위 _tabEntries 주석), 없는 시드를 만들면
    #   「착지했다고 적는데 화면은 안 바뀌는」 자리가 생긴다.
    src = read("src/data/partnerGov.js")
    m = re.search(r"const PG_SUBTABS = \[(.*?)\];", src, re.S)
    assert m, "PG_SUBTABS 파싱 실패 — 소스 형태 변경"
    st = re.findall(r'\{\s*k:\s*"(\w+)",\s*ko:\s*"([^"]+)"', m.group(1))
    assert len(st) == 5, "협력업체 서브탭 %d개 — 요구 5(PG_SUBTABS)" % len(st)
    for k, label in st:
        out.append({"key": "sub.partner.%s" % k, "label": label,
                    "path": "ontology › 협력업체 온톨로지 · 하네스 › " + label,
                    "surface": "tab", "nav": "ontology", "tab": "partner", "owner": "nav",
                    "admin": True, "desc": "", "aliases": aliases_of(label)})
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
    "tab.healthmate.7":       ["보장분석 대화", "보장분석대화", "치료비 보장 점검"],
    # ①~⑨ 탭 개칭(형 지시 2026-10-05 ④ — 「지금 할 일」 결로 통일) · ⑩은 관리자 화면으로 이관
    "tab.healthmate.1":       ["회원 신호", "회원신호", "회원 접촉 신호"],
    "tab.healthmate.2":       ["보험 배정·대기", "보험배정대기", "보험 배정", "배정·대기"],
    "tab.healthmate.3":       ["검진 후 터치", "검진후터치", "검진 후 안내"],
    "tab.healthmate.4":       ["질병 예측", "질병예측", "질병 위험 예측"],
    "tab.healthmate.5":       ["건강 행동", "건강행동", "건강 습관"],
    "tab.healthmate.6":       ["가족·재가", "가족재가", "가족 재가돌봄"],
    "tab.healthmate.8":       ["프로 제안함", "프로제안함", "제안함"],
    "tab.healthmate.9":       ["내 고객·실적", "내고객실적", "내 고객", "내 실적"],
    # ⑩ 통합 운영 → 헬스메이트 운영본부(관리자 전용 별도 화면)로 이관. 탭이 사라져 tab.healthmate.10 키도
    # 사라지므로, 옛 이름·관제탑·새 이름을 부모 섹션(센터)에 붙여 둔다 — 관리자는 센터에 착지해 하위 메뉴로 들어간다
    # (hmops는 L1 SECTIONS가 아니라 센터 하위 화면이라 독립 엔티티가 없다. admin 게이트는 sec.healthmate가 이미 갖고 있다).
    "sec.healthmate":         ["통합 운영", "통합운영", "관제탑", "헬스메이트 운영본부", "운영본부", "운영 본부"],
}

# ── 생성 ──
def build():
    inv = extract_l1() + extract_l2() + extract_l3() + extract_l4()
    # key 중복 검증
    keys = [x["key"] for x in inv]
    dup = sorted({k for k in keys if keys.count(k) > 1})
    assert not dup, "key 중복: %s" % dup
    # 개칭 이력 별칭 병합(구 명칭 인식 유지) — 라벨과 같은 규칙으로 평탄본·두벌식 영타까지 파생한다.
    # (파생하지 않으면 "rjawlsgnxjcl"(검진후터치) 같은 영타 질문이 개칭 후 어디에도 안 걸린다)
    for x in inv:
        extra = LEGACY_ALIASES.get(x["key"])
        if extra:
            grown = set(extra)
            for a in extra:
                flat = re.sub(r"[\s·]", "", a)
                if not flat:
                    continue
                grown.add(flat)
                if re.search(r"[가-힣]", flat):
                    grown.add(h2q(flat))
            x["aliases"] = sorted((set(x["aliases"]) | grown) - {x["label"]})
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

REG_SNAP = os.path.join(ROOT, "src", "data", "navRegSnapshot.js")

def reg_stamp():
    """navRegSnapshot.js가 '어느 인벤토리에서 측정됐는지' — inventory.sourceHash를 읽는다."""
    try:
        txt = io.open(REG_SNAP, encoding="utf-8").read()
        m = re.search(r'"inventory"\s*:\s*(\{.*?\})', txt)
        return json.loads(m.group(1)) if m else None
    except Exception:
        return None

def reg_drift(sh):
    """회귀 스냅샷이 현재 인벤토리보다 낡았는지. (낡음, 스냅샷해시) 반환.
       META만 비교하던 기존 게이트는 이걸 못 잡았다 — 인벤토리를 재생성하고 회귀를 다시 돌리지 않으면
       스냅샷의 date만 올라가 '오늘 회귀 통과'로 보이는데 측정은 재생성 이전 번들에서 한 것이 된다
       (실측: META 3df3de89…/2026-10-05 vs 스냅샷 d04422010…/2026-09-22). AgentDock이 이 스냅샷을
       화면에 찍으므로 '최신 통과' 표시가 실제 상태와 어긋난다."""
    rs = reg_stamp()
    got = (rs or {}).get("sourceHash")
    return (got != sh, got)

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    sh = source_hash()
    st = current_stamp()
    if mode in ("--check", "--check-reg"):
        hard = (mode == "--check-reg")
        if not (st and st.get("sourceHash") == sh):
            print("[DRIFT] 감시 파일이 바뀌었는데 인벤토리가 구버전입니다.")
            print("        재생성: python scripts/gen_nav_inventory.py")
            print("        비상 우회(1회용): HIFIN_NAV_BYPASS=1 bash build_preview.sh  ← 콘솔에 드리프트 배지가 켜집니다")
            return 1
        stale, got = reg_drift(sh)
        if stale:
            print("[STALE] 내비 회귀 스냅샷이 현재 인벤토리보다 낡았습니다 — 측정 %s vs 인벤토리 %s" % (got, sh))
            print("        재측정: python scripts/gen_nav_corpus.py && node scripts/run_nav_regression.mjs")
            print("        (AgentDock 운영 콘솔이 이 스냅샷을 '회귀 통과'로 표시하므로 그대로 두면 화면이 사실과 어긋납니다)")
            return 1 if hard else 0
        print("nav-inventory fresh (%s)" % sh); return 0
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
