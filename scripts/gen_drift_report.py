# -*- coding: utf-8 -*-
"""주간 드리프트 리포트 — 설계 프롬프트 v2.1 §10-3 (P6).

인벤토리의 변화(추가·삭제·개명)를 git 기준으로 요약한다.
  python scripts/gen_drift_report.py            # HEAD 대비 현재
  python scripts/gen_drift_report.py HEAD~20    # 지정 리비전 대비(주간 실행 시 지난주 커밋)
산출: docs/hi_nav10k/드리프트_리포트_<날짜>.md (+표준출력).
U7 미답변의 '인벤토리 밖 화면 지칭 후보'는 브라우저 로컬 저장이라 여기 없다 —
커버리지 콘솔(온톨로지 › 헬스케어 › 하이 커버리지)에서 본다.
"""
import io, os, re, sys, json, subprocess, datetime
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
REV = sys.argv[1] if len(sys.argv) > 1 else "HEAD"

def parse(txt):
    rows = {}
    for l in txt.split("\n"):
        l = l.strip().rstrip(",")
        if l.startswith("{"):
            try:
                r = json.loads(l); rows[r["key"]] = r
            except Exception: pass
    meta = re.search(r"const NAV_INV_META = (\{.*?\});", txt)
    return rows, (json.loads(meta.group(1)) if meta else {})

cur_txt = io.open("src/data/navInventory.js", encoding="utf-8").read()
try:
    old_txt = subprocess.run(["git", "show", REV + ":src/data/navInventory.js"],
                             capture_output=True, text=True, encoding="utf-8").stdout or ""
except Exception:
    old_txt = ""
cur, cmeta = parse(cur_txt)
old, ometa = parse(old_txt)

added   = sorted(set(cur) - set(old))
removed = sorted(set(old) - set(cur))
renamed = sorted(k for k in set(cur) & set(old) if cur[k]["label"] != old[k]["label"])

snap = {}
try: snap = json.loads(io.open("scripts/nav_regression_snapshot.json", encoding="utf-8").read())
except Exception: pass

today = datetime.date.today().isoformat()
L = ["# 내비 드리프트 리포트 — %s (기준: %s)" % (today, REV), "",
     "| 항목 | 값 |", "|---|---|",
     "| 인벤토리 | v%s · %s개 항목 · hash `%s` |" % (cmeta.get("version"), len(cur), cmeta.get("sourceHash")),
     "| 드리프트 배지(비상 우회) | %s |" % ("⚠ 점등 — 해소 필요" if cmeta.get("bypass") else "정합"),
     "| 변경 | 추가 %d · 삭제 %d · 개명 %d |" % (len(added), len(removed), len(renamed)),
     "| 최근 회귀 스냅샷 | %s — 관리자 %s%% · 회원 %s%% · 누출 %s건 · NLU %s%% |" % (
         snap.get("date", "-"), snap.get("accAdmin", "-"), snap.get("accMember", "-"), snap.get("leaks", "-"), snap.get("nluAcc", "-")), ""]
if added:   L += ["## 추가 — 코퍼스 증분 생성 대상(§10-2)", ""] + ["- `%s` %s" % (k, cur[k]["label"]) for k in added] + [""]
if removed: L += ["## 삭제 — 소거 + 리다이렉트 응답 등록 대상(후속 화면은 형 매핑표)", ""] + ["- `%s` %s" % (k, old[k]["label"]) for k in removed] + [""]
if renamed: L += ["## 개명 — 구명칭 aliases 자동 강등 확인 대상", ""] + ["- `%s` %s → %s" % (k, old[k]["label"], cur[k]["label"]) for k in renamed] + [""]
if not (added or removed or renamed): L += ["변경 없음 — 인벤토리가 기준 리비전과 동일하다.", ""]
L += ["*U7 '인벤토리 밖 화면 지칭 후보'는 커버리지 콘솔에서 확인(브라우저 로컬 집계).*"]

out = "\n".join(L)
path = "docs/hi_nav10k/드리프트_리포트_%s.md" % today
io.open(path, "w", encoding="utf-8").write(out)
print(out)
print("\n→", path)
