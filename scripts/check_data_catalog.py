# -*- coding: utf-8 -*-
"""데이터 카탈로그 게이트 — 데이터 운영계획 v1.1 §6 D-1 (2026-08-30 형 승인).
소스 전체에서 브라우저 저장 키(localStorage/sessionStorage)를 추출해
dataCatalog.js 등재 목록과 대조한다. 미등재 키 발견 = exit 1(커밋 차단).
사용: python scripts/check_data_catalog.py            # 게이트 검사
      python scripts/check_data_catalog.py --emit     # 현재 스캔 키를 JS 배열로 출력(카탈로그 갱신용)
원칙: 새 키는 dataCatalog.js에 그룹·설명과 함께 등재한 뒤에만 코드에 넣을 수 있다."""
import io, os, re, sys, glob
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace", newline=chr(10))
except Exception: pass
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

STATIC_RE = re.compile(r"(?:localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*['\"]([A-Za-z0-9_\-]+)['\"]\s*[,)]")
PREFIX_RE = re.compile(r"['\"]((?:hifin|pi)_[A-Za-z0-9_]*_)['\"]\s*\+")

def scan():
    stat, pref = set(), set()
    for f in glob.glob("src/**/*.js*", recursive=True):
        try: s = io.open(f, encoding="utf-8", errors="ignore").read()
        except Exception: continue
        for m in STATIC_RE.findall(s): stat.add(m)
        for m in PREFIX_RE.findall(s): pref.add(m)
    # 접두로 커버되는 정적 키는 접두 쪽으로 흡수
    stat2 = {k for k in stat if not any(k.startswith(p) or k + "_" == p for p in pref)}
    return sorted(stat2), sorted(pref)

def load_catalog():
    s = io.open("src/data/dataCatalog.js", encoding="utf-8").read()
    stat = set(re.findall(r'"([A-Za-z0-9_\-]+)"', re.search(r"HIFIN_KEYS_STATIC = \[(.*?)\]", s, re.S).group(1)))
    pref = set(re.findall(r'"([A-Za-z0-9_\-]+)"', re.search(r"HIFIN_KEYS_PREFIX = \[(.*?)\]", s, re.S).group(1)))
    return stat, pref

def main():
    stat, pref = scan()
    if "--emit" in sys.argv:
        print("const HIFIN_KEYS_STATIC = [" + ", ".join('"%s"' % k for k in stat) + "];")
        print("const HIFIN_KEYS_PREFIX = [" + ", ".join('"%s"' % k for k in pref) + "];")
        return 0
    cs, cp = load_catalog()
    missS = [k for k in stat if k not in cs]
    missP = [k for k in pref if k not in cp]
    ghostS = [k for k in cs if k not in stat]
    if missS or missP:
        print("[CATALOG] 미등재 저장 키 발견 — dataCatalog.js에 등재 후 커밋하세요")
        for k in missS: print("  · 정적:", k)
        for k in missP: print("  · 접두:", k)
        return 1
    print("[CATALOG] 통과 — 정적 %d · 접두 %d 전건 등재 일치%s" % (
        len(stat), len(pref), (" (카탈로그 잔존 %d건 — 정리 후보)" % len(ghostS)) if ghostS else ""))
    return 0

if __name__ == "__main__":
    sys.exit(main())
