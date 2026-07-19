# -*- coding: utf-8 -*-
"""장기요양기관 공시 실데이터 → src/data/homecare.json 변환기 (Phase 4.5)

사용법:
  1) 공공데이터포털(data.go.kr)에서 「국민건강보험공단_장기요양기관 현황」 CSV를 내려받아
     이 폴더에 longterm_care.csv 로 저장 (인코딩 cp949/utf-8 자동 감지)
  2) python tools/homecare_ingest.py
  3) bash build_preview.sh 후 커밋 — 재가·돌봄 화면과 통합 지도의 demo 배지가 자동 해제됨

CSV 필수 컬럼(명칭이 다르면 아래 COLS 매핑만 수정):
  기관명 / 시도 / 시군구 / 주소 / 전화번호 / 급여종류(쉼표구분) / 경도 / 위도
좌표 컬럼이 없으면 주소 기반 지오코딩이 필요하므로, 심평원 좌표 병합(hira 매칭) 또는
카카오 로컬 API 지오코딩 단계를 추가할 것.
"""
import csv, json, sys, os

SRC = os.path.join(os.path.dirname(__file__), "longterm_care.csv")
DST = os.path.join(os.path.dirname(__file__), "..", "src", "data", "homecare.json")
COLS = { "name": "기관명", "sido": "시도", "sgg": "시군구", "addr": "주소", "tel": "전화번호", "svc": "급여종류", "lng": "경도", "lat": "위도" }
SIDO = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종시", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]

def read_rows(path):
    for enc in ("utf-8-sig", "cp949", "utf-8"):
        try:
            with open(path, encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise SystemExit("CSV 인코딩을 읽을 수 없습니다 (utf-8/cp949)")

def main():
    if not os.path.exists(SRC):
        raise SystemExit("tools/longterm_care.csv 가 없습니다 — 공공데이터포털에서 내려받아 저장하세요.")
    rows = read_rows(SRC)
    svc_set, providers = [], []
    def svc_idx(name):
        name = name.strip()
        if not name: return None
        if name not in svc_set: svc_set.append(name)
        return svc_set.index(name)
    def sido_idx(s):
        s = str(s or "").strip()
        for i, k in enumerate(SIDO):
            if s.startswith(k) or k in s: return i
        return 0
    for r in rows:
        try:
            lng = float(r.get(COLS["lng"]) or 0); lat = float(r.get(COLS["lat"]) or 0)
        except ValueError:
            lng = lat = 0
        svcs = [svc_idx(x) for x in str(r.get(COLS["svc"]) or "").split(",") if x.strip()]
        providers.append([
            str(r.get(COLS["name"]) or "").strip(), sido_idx(r.get(COLS["sido"])),
            str(r.get(COLS["sgg"]) or "").strip(), str(r.get(COLS["addr"]) or "").strip(),
            str(r.get(COLS["tel"]) or "").strip(), [s for s in svcs if s is not None],
            lng, lat, "",
        ])
    out = { "meta": { "source": "국민건강보험공단 장기요양기관 현황(공공데이터포털)", "asof": "", "demo": False, "count": len(providers) },
            "sido": SIDO, "svc": svc_set, "providers": providers }
    json.dump(out, open(DST, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    sys.stdout.write("homecare.json 저장: %d개 기관 (demo=False)\n" % len(providers))

if __name__ == "__main__":
    main()
