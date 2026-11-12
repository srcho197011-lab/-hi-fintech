# -*- coding: utf-8 -*-
"""자료 저장소 목차 생성 — 회사 자료 게시판에 반입할 CSV를 만든다.

이 스크립트는 **사실만 내보낸다** — 경로 · 파일명 · 크기 · 수정일 · 확장자.
종류(확인원·장부·은행…)와 법인 판별은 **화면(src/data/corpVault.js)이 한다.**
두 곳에서 분류하면 규칙이 갈라지고, 갈라진 줄도 모른다.

⚠️ 목록은 git에 넣지 않는다. 파일명이 곧 회사 자료의 목차라,
   공개 배포본에 실리면 대외비 저장소의 목차를 공개하는 셈이다.
   생성한 CSV는 저장소 안(_반입)에 두고, 형이 자료 반입 창구로 올린다.

사용: python scripts/gen_vault_index.py [저장소경로]
"""
import csv, io, os, sys, time

try: sys.stdout.reconfigure(encoding="utf-8", errors="replace", newline=chr(10))
except Exception: pass

DEFAULT_ROOT = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "0.HI-fin 온톨로지하네스")
SKIP_PREFIX = ("~$",)          # 엑셀·워드 임시 파일
SKIP_DIR = {"__pycache__", ".git"}


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_ROOT
    if not os.path.isdir(root):
        print("[자료실] 저장소를 찾지 못했습니다 —", root)
        return 1
    rows = []
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP_DIR]
        rel_dir = os.path.relpath(dp, root).replace("\\", "/")
        if rel_dir == ".": rel_dir = ""
        for f in sorted(fn):
            if f.startswith(SKIP_PREFIX): continue
            p = os.path.join(dp, f)
            try:
                sz = os.path.getsize(p)
                mt = time.strftime("%Y-%m-%d", time.localtime(os.path.getmtime(p)))
            except Exception:
                sz, mt = 0, ""
            rows.append({
                "rel": (rel_dir + "/" + f) if rel_dir else f,
                "name": f,
                "dir": rel_dir,
                "size": sz,
                "at": mt,
                "ext": (os.path.splitext(f)[1].lower() or "").lstrip("."),
            })
    out_dir = os.path.join(root, "02.회계", "_반입")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "04_자료목록.csv")
    with io.open(out, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["경로", "파일명", "폴더", "크기", "수정일", "확장자"])
        for r in rows:
            w.writerow([r["rel"], r["name"], r["dir"], r["size"], r["at"], r["ext"]])
    mb = sum(r["size"] for r in rows) / 1048576.0
    print("[자료실] %d건 · %.1f MB → %s" % (len(rows), mb, out))
    print("[자료실] 종류·법인 판별은 화면(corpVault.js)이 합니다 — 여기서는 사실만 내보냅니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
