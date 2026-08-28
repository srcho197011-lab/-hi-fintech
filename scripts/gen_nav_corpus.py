# -*- coding: utf-8 -*-
"""내비 코퍼스 생성기 — 설계 프롬프트 v2.1 §6 (P3).

1만+ 질문을 사람이 쓰지 않는다: navInventory(단일 소스) × 동사 분류표 × 어미 × 잡음의
결정론 조합으로 생성하고, 라벨 6필드(nav·tab·intent·action_type·completion_event·owner)를
생성 시점에 함께 기록한다(자동채점 근거).

사용법:
  python scripts/gen_nav_corpus.py            # docs/hi_nav10k/nav_corpus_v1.jsonl 생성(+통계)
  python scripts/gen_nav_corpus.py --sample   # 표본 200문항 검수표(md)만 재출력

원칙(v2.1):
  · 결정론 — 시드 고정(mulberry32). 재생성해도 문항·순서가 동일하다.
  · 저장 정책(§6) — jsonl은 저장소에 넣지 않는다(결정론 재생성물). 생성기·리포트만 커밋.
  · owner 경계(§4-2) — sarg 타깃의 착지 문항은 화면 동사 명시형만. 경계 음성 문항을 함께 생성.
  · completion_event — P1 매핑표에서 실사 확인된 이벤트만 사용(미확인 2종 사용 금지 §9).
  · 다의어 패턴(2개 nav 충돌)은 문항 표면에서 제외 — 되묻기는 런타임 함정 세트(P2)가 검증한다.
  ⚠️ 동사·불용어 상수는 src/data/navRouting.js(NAV_VERB·NAV_STOPCORE)와 동기 유지할 것.
"""
import io, os, re, sys, json, hashlib
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INV = os.path.join(ROOT, "src", "data", "navInventory.js")
OUT = os.path.join(ROOT, "docs", "hi_nav10k", "nav_corpus_v1.jsonl")
REP = os.path.join(ROOT, "docs", "hi_nav10k", "P3_코퍼스_표본검수표_v1.0.md")
SEED = 20260828

# ── mulberry32 — navRouting/기존 생성기와 같은 계열의 결정론 난수 ──
def mulberry32(a):
    state = [a & 0xFFFFFFFF]
    def rnd():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + ((t ^ (t >> 7)) * (t | 61) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rnd

# ── 동사 분류표 — navRouting.js NAV_VERB와 동기(활용형 표면 목록) ──
V_MOVE = [  # (표면, 어미 레지스터) — 이동·열람형: 착지 의도
    ("보여줘", "반말"), ("보여주세요", "해요"), ("보여 주시겠어요?", "합쇼"),
    ("열어줘", "반말"), ("열어주세요", "해요"), ("열어 주시겠어요?", "합쇼"),
    ("확인해줘", "반말"), ("확인해 주세요", "해요"),
    ("어디야?", "반말"), ("어디에 있어요?", "해요"), ("어디서 봐요?", "해요"),
    ("가줘", "반말"), ("들어가고 싶어요", "해요"), ("찾아줘", "반말"), ("띄워줘", "반말"),
    ("볼래", "반말"), ("볼게요", "해요"), ("보러 갈게요", "해요"), ("이동해 주세요", "합쇼"),
    ("접속해줘", "반말"), ("들어가 볼게요", "해요"), ("열어봐", "반말"),
]
V_SARG = [  # sarg 소유 타깃 전용 — '화면 지목'이 명백한 표현(navRouting sargMove 충족)
    ("화면 열어줘", "반말"), ("화면 보여주세요", "해요"), ("메뉴 열어주세요", "해요"), ("탭 열어줘", "반말"),
]
V_SARG_NEG = [  # sarg 경계 음성 — 착지가 아니라 분기 상담이 답해야 한다(기대: navResolve null)
    ("결과 알려줘", "반말"), ("결과 설명해 주세요", "해요"), ("어때?", "반말"), ("요약해줘", "반말"),
]
V_VALUE = [  # 값 질문 — 실수치 툴 보존(기대: null)
    ("얼마야?", "반말"), ("얼마 있어요?", "해요"), ("잔액 알려줘", "반말"), ("몇 개야?", "반말"),
]
V_HOW = [   # 방법형 — 기존 Q&A가 답(기대: null)
    ("어떻게 해?", "반말"), ("사용법 알려주세요", "해요"), ("하는 법 알려줘", "반말"),
]
PREFIX = ["", "내 ", "지금 ", "좀 "]   # "우리 "는 표면과 붙어 새 단어를 만든다("우리+가족·재가") — 제외
NAV_STOPCORE = ["건강", "관리", "서비스", "센터", "화면", "신청", "안내", "현황", "설정", "기록", "검색", "찾기", "연결", "알림", "보기", "예약"]
# 런타임 가드 정규식(navRouting NAV_VERB value·how와 동기) — 표면 자체가 가드에 걸리는 라벨(예: 사용방법)은 문항 제외
RE_GUARD = re.compile(r"(얼마|몇\s?[개명원건번%]|몇이|잔액|쌓였|적립됐|언제(야|까지|부터)|왜|어떻게|하는\s?법|사용법|방법)")
# 브랜드 별칭 → 대표 화면(navRouting §3-3와 동기) — 충돌 탐지에 포함해 다의어를 정확히 걸러낸다
BRAND_PATS = { "나의 건강지갑": "wallet", "건강지갑": "wallet", "건강금융지갑": "wallet", "검진대비보험": "insurance", "무료보험": "insurance", "검진보험": "insurance", "건강검진대비보험": "insurance" }

# ── completion_event — P1 매핑표 실사 확인 10종만(§9 가공 이벤트 금지) ──
ACT_EVENT = {
    "act.checkup.book":   ("실행형", "cert_issued"),
    "act.ins.claim":      ("실행형", "claim_submitted"),
    "act.ins.rerate":     ("실행형", "rerate_applied"),
    "act.shop.subs":      ("실행형", "sub_registered"),
    "act.consent.manage": ("기록형", "consent_updated"),
    "act.family.add":     ("기록형", "family_linked"),
    # tele_connected·homecare_applied는 실사 미확인 — 확인 전 사용 금지(안내형으로 라벨)
}

def load_inventory():
    s = io.open(INV, encoding="utf-8").read()
    return [json.loads(l.strip().rstrip(",")) for l in s.split("\n") if l.strip().startswith("{")]

def surfaces_of(e):
    """질문 표면형: 라벨(평탄) + 한글 별칭 + 핵심어(navRouting과 같은 규칙) + 영타 별칭(잡음)"""
    base = re.sub(r"[①-⑨🩺🚨]|\(운영\)", "", e["label"]).strip()
    ko, qw = set(), set()
    flat = re.sub(r"[\s·]", "", base)
    if flat: ko.add(flat)
    ko.add(base)
    for a in e.get("aliases", []):
        (qw if re.match(r"^[a-zA-Z0-9]+$", a) else ko).add(a)
    for tk in re.split(r"[\s·›()/－-]+", base):
        t = tk.strip()
        if len(t) >= 3 and re.match(r"^[가-힣A-Za-z]+$", t) and t not in NAV_STOPCORE:
            ko.add(t)
    return sorted(x for x in ko if len(re.sub(r"\s", "", x)) >= 2), sorted(qw)

def main():
    inv = load_inventory()
    # ── 다의어 패턴 제외 — 같은 표면형이 2개 nav를 가리키면 문항 표면에서 뺀다(런타임 함정이 담당) ──
    pat_navs = {}
    ent_surf = {}
    for e in inv:
        if e["owner"] == "tool":       # 실수치 툴 소유 — 착지 문항 대상 아님
            continue
        ko, qw = surfaces_of(e)
        ent_surf[e["key"]] = (ko, qw)
        for p in ko:
            pat_navs.setdefault(re.sub(r"[\s·]", "", p), set()).add(e["nav"])
    for bp, bn in BRAND_PATS.items():
        pat_navs.setdefault(re.sub(r"[\s·]", "", bp), set()).add(bn)
    ambig = {p for p, ns in pat_navs.items() if len(ns) > 1}

    rnd = mulberry32(SEED)
    rows = []
    def push(q, e, intent, at, ev, route, register, noise=""):
        rows.append({
            "q": q.strip(), "intent": intent, "nav": e["nav"] if route == "nav" else None,
            "tab": e.get("tab") if route == "nav" else None,
            "action_type": at, "completion_event": ev, "owner": e["owner"],
            "route": route, "register": register, "noise": noise,
            "role": "ADMIN" if e.get("admin") else "MEMBER", "key": e["key"],
        })

    for e in inv:
        if e["owner"] == "tool":
            continue
        ko, qw = ent_surf[e["key"]]
        ko = [p for p in ko if re.sub(r"[\s·]", "", p) not in ambig and not RE_GUARD.search(p)]
        if not ko:
            continue
        at_def, ev_def = ACT_EVENT.get(e["key"], ("안내형", "nav_opened"))
        # ① 착지 양성 — owner별 동사군
        verbs = V_SARG if e["owner"] == "sarg" else V_MOVE
        for p in ko:
            for v, reg in verbs:
                for pre in PREFIX:
                    if rnd() < (0.45 if e["owner"] != "sarg" else 0.05):   # 전체량 조절(결정론)
                        continue
                    josa = "을 " if rnd() < 0.25 and not v.startswith(("어디", "화면", "메뉴", "탭")) else " "
                    push(pre + p + josa + v, e, "nav." + e["key"] + ".move", at_def, ev_def, "nav", reg)
        # 명사 단독 호출(4자 이상 패턴만 — navResolve 규칙과 동일 · owner=nav 한정)
        for p in ko:
            if len(re.sub(r"[\s·]", "", p)) >= 4 and e["owner"] == "nav":   # 길이도 평탄본 기준(런타임과 동일)
                if rnd() < 0.7:
                    push(p, e, "nav." + e["key"] + ".bare", at_def, ev_def, "nav", "명사형")
                if rnd() < 0.5:
                    push(p + " 화면", e, "nav." + e["key"] + ".bare2", at_def, ev_def, "nav", "명사형")
        # IME 영타(잡음 — 별칭에 이미 결정론 파생돼 있다)
        for p in qw:
            if len(p) >= 6 and e["owner"] == "nav" and rnd() < 0.55:
                push(p + " 열어줘", e, "nav." + e["key"] + ".ime", at_def, ev_def, "nav", "반말", "ime")
        # 띄어쓰기 잡음
        p0 = re.sub(r"[\s·]", "", ko[0])
        if len(p0) >= 4 and e["owner"] == "nav":
            spaced = p0[:2] + " " + p0[2:]
            push(spaced + " 보여줘", e, "nav." + e["key"] + ".spacing", at_def, ev_def, "nav", "반말", "spacing")
        # ② 경계 음성 — 라우터가 가로채면 안 되는 질문(§4-2·값·방법)
        if e["owner"] == "sarg":
            for v, reg in V_SARG_NEG:
                if rnd() < 0.95:
                    push(ko[0] + " " + v, e, "neg." + e["key"] + ".sarg", "조회형", "value_rendered", "sarg", reg)
        if e["nav"] in ("wallet", "mywallet") or "적립" in e["label"]:
            for v, reg in V_VALUE:
                if rnd() < 0.95:
                    push(ko[0] + " " + v, e, "neg." + e["key"] + ".value", "조회형", "value_rendered", "tool", reg)
        if rnd() < (0.95 if e["surface"] == "section" else 0.3):
            v, reg = V_HOW[int(rnd() * len(V_HOW)) % len(V_HOW)]
            push(ko[0] + " " + v, e, "neg." + e["key"] + ".how", "안내형", "nav_opened", "qna", reg)

    # ── 중복 제거(질문 텍스트 기준) + 결정론 셔플 ──
    seen, uniq = set(), []
    for r in rows:
        k = re.sub(r"\s+", " ", r["q"])
        if k in seen: continue
        seen.add(k); uniq.append(r)
    order = sorted(range(len(uniq)), key=lambda i: hashlib.md5((str(SEED) + "|" + uniq[i]["q"]).encode("utf-8")).hexdigest())
    uniq = [uniq[i] for i in order]

    inv_meta = re.search(r"const NAV_INV_META = (\{.*?\});", io.open(INV, encoding="utf-8").read()).group(1)
    head = {"meta": {"seed": SEED, "inventory": json.loads(inv_meta), "total": len(uniq)}}
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(head, ensure_ascii=False) + "\n")
        for r in uniq:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # 통계
    from collections import Counter
    cr = Counter(r["route"] for r in uniq); cg = Counter(r["register"] for r in uniq)
    ca = Counter(r["action_type"] for r in uniq); cro = Counter(r["role"] for r in uniq)
    print("문항 %d (양성 %d · 경계 음성 %d) → %s" % (len(uniq), cr["nav"], len(uniq) - cr["nav"], os.path.relpath(OUT, ROOT)))
    print("route:", dict(cr), "| register:", dict(cg))
    print("action_type:", dict(ca), "| role:", dict(cro), "| 다의어 제외 패턴:", len(ambig))

    # ── 표본 200 검수표(층화: route×register 균형, 결정론) ──
    strata = {}
    for r in uniq:
        strata.setdefault((r["route"], r["register"]), []).append(r)
    sample = []
    keys = sorted(strata.keys())
    qi = 0
    while len(sample) < 200 and any(strata.values()):
        k = keys[qi % len(keys)]; qi += 1
        if strata[k]: sample.append(strata[k].pop(0))
    L = ["# P3 코퍼스 표본 검수표 — 200문항 (전체 %d문항 중 층화 추출)" % len(uniq), "",
         "> 시드 %d · 결정론 재생성 동일 · 다의어 패턴 %d종 제외(런타임 함정 담당) · jsonl은 저장소 미포함(§6)" % (SEED, len(ambig)), "",
         "| # | 질문 | 기대 응답자 | nav›tab | 유형 | 어미 | 역할 |", "|---|---|---|---|---|---|---|"]
    RT = {"nav": "화면 안내", "sarg": "분기 상담", "tool": "실수치 툴", "qna": "Q&A"}
    for i, r in enumerate(sample):
        L.append("| %d | %s | %s | %s | %s | %s | %s |" % (
            i + 1, r["q"].replace("|", "｜"), RT[r["route"]],
            (r["nav"] or "—") + ("›" + r["tab"] if r.get("tab") else ""),
            r["action_type"], r["register"], "관리자" if r["role"] == "ADMIN" else ""))
    io.open(REP, "w", encoding="utf-8").write("\n".join(L))
    print("표본 검수표:", os.path.relpath(REP, ROOT))
    return 0

if __name__ == "__main__":
    sys.exit(main())
