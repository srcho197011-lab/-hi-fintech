# -*- coding: utf-8 -*-
"""전국 검진기관 통합 데이터셋 빌더 — data/checkup_orgs.json 생성 (재실행 가능)

원천:
  L1 검진기관/국민건강보험공단_검진기관기본_20240731.csv (cp949, 5,000행 = 공단 공개 파일 전체)
  L2 src/data/hira.json (심평원 병의원 79,562곳 · 좌표·종별) — 좌표/종별 조인
  L3 검진기관/전국보건기관표준데이터.csv (보건기관 — 공공검진지원 층)

출력(JSON):
  { meta: {asOf, sources, counts, geo: {hira, fallback, none}, matchRate},
    types: [...], geoSrc: ["hira","sgg","none"],
    orgs: [[n, sd, sg, tIdx, ad, p, lat|0, lng|0, gIdx, personal], ...] }
  personal(개인종합검진 가능) 판정: 전문검진센터·종합병원 검진 — 명칭·종별 근거(세부 프로그램은 기관 확인 권장)
"""
import csv, io, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")

SIDO_FULL = [
    ("서울특별시", "서울"), ("부산광역시", "부산"), ("대구광역시", "대구"), ("인천광역시", "인천"),
    ("광주광역시", "광주"), ("대전광역시", "대전"), ("울산광역시", "울산"),
    ("세종특별자치시", "세종"), ("경기도", "경기"), ("강원특별자치도", "강원"), ("강원도", "강원"),
    ("충청북도", "충북"), ("충청남도", "충남"), ("전북특별자치도", "전북"), ("전라북도", "전북"),
    ("전라남도", "전남"), ("경상북도", "경북"), ("경상남도", "경남"), ("제주특별자치도", "제주"), ("제주도", "제주"),
]
TYPES = ["전문검진센터", "종합병원 검진", "병원 검진", "의원 검진", "치과", "한방", "보건기관"]
GEOSRC = ["hira", "sgg", "none"]

def norm_name(s):
    s = unicodedata.normalize("NFC", s or "")
    s = re.sub(r"[\s\(\)\[\]·,\.]", "", s)
    s = re.sub(r"^(의료법인|재단법인|사단법인|학교법인|사회복지법인)", "", s)
    return s

def split_addr(ad):
    """공백 없는 주소에서 시도·시군구 추출"""
    ad = (ad or "").strip()
    for full, short in SIDO_FULL:
        if ad.startswith(full):
            rest = ad[len(full):]
            m = re.match(r"^([가-힣]{1,5}?(시|군|구))", rest)
            sg = m.group(1) if m else ""
            # ○○시△△구 형태 보정 (예: 수원시장안구)
            if sg.endswith("시"):
                m2 = re.match(r"^" + re.escape(sg) + r"([가-힣]{1,4}?구)", rest)
                if m2:
                    sg = sg + m2.group(1)
            return short, sg, ad
    return "", "", ad

def classify(name, hira_type):
    if hira_type in ("상급종합", "종합병원"):
        return 1
    if hira_type in ("병원", "요양병원", "정신병원", "한방병원"):
        return 5 if hira_type == "한방병원" else 2
    if hira_type == "한의원":
        return 5
    if hira_type in ("치과병원", "치과의원"):
        return 4
    if hira_type in ("보건소", "보건지소", "보건진료소", "보건의료원"):
        return 6
    n = name or ""
    if re.search(r"(검진센터|검진의원|건강관리협회|의학연구소|헬스케어|메디체크|건강증진)", n):
        return 0
    if "치과" in n:
        return 4
    if re.search(r"(한의원|한방)", n):
        return 5
    if re.search(r"(종합병원|대학교병원|대학병원|의료원)", n):
        return 1
    if n.endswith("병원"):
        return 2
    return 3  # 의원 검진(기본)

def main():
    # ── L2 hira 인덱스 ──
    hira = json.load(io.open(os.path.join(ROOT, "src/data/hira.json"), encoding="utf-8"))
    h_sido, h_type = hira["sido"], hira["type"]
    idx = {}
    # hira 스키마(Hospital.jsx 실사용 기준): [0]명칭 [1]종별idx [2]시도idx [3]시군구 [4]주소 [5]전화 [7]과목 [8]lng [9]lat
    for row in hira["hospitals"]:
        name, ti, si = row[0], row[1], row[2]
        key = (norm_name(name), h_sido[si] if si < len(h_sido) else "")
        # 세종시 표기 통일
        k2 = (key[0], "세종" if key[1] == "세종시" else key[1])
        idx.setdefault(k2, row)

    # 시군구 대표좌표(hira 평균) — 폴백용
    from collections import defaultdict
    sgg_geo = defaultdict(lambda: [0.0, 0.0, 0])
    for row in hira["hospitals"]:
        si = h_sido[row[2]] if row[2] < len(h_sido) else ""
        si = "세종" if si == "세종시" else si
        sg_raw = row[3] or ""
        lng, lat = row[8], row[9]
        if lat and lng:
            a = sgg_geo[(si, sg_raw)]
            a[0] += lat; a[1] += lng; a[2] += 1
    sgg_avg = {k: (v[0] / v[2], v[1] / v[2]) for k, v in sgg_geo.items() if v[2] > 0}

    orgs, seen = [], set()
    stat = {"hira": 0, "sgg": 0, "none": 0}

    # ── L1 공단 검진기관 ──
    p1 = os.path.join(ROOT, "검진기관/국민건강보험공단_검진기관기본_20240731.csv")
    rd = csv.reader(io.open(p1, encoding="cp949"))
    next(rd)
    for r in rd:
        if len(r) < 4:
            continue
        name, addr, _zip, phone = r[0].strip(), r[1].strip(), r[2].strip(), r[3].strip()
        sd, sg, ad = split_addr(addr)
        dkey = (norm_name(name), sd, ad[:14])
        if dkey in seen:
            continue
        seen.add(dkey)
        hrow = idx.get((norm_name(name), sd))
        lat = lng = 0.0
        g = 2
        t_hira = None
        if hrow:
            t_hira = h_type[hrow[1]] if hrow[1] < len(h_type) else None
            if hrow[9] and hrow[8]:
                lat, lng, g = round(hrow[9], 6), round(hrow[8], 6), 0
        if g != 0:
            # 시군구 대표좌표 폴백 — hira 시군구 키는 "서울강남구" 형태
            fk = (sd, (sd + sg) if sg else "")
            alt = sgg_avg.get(fk)
            if not alt and sg:
                # hira 시군구 표기가 축약형일 수 있어 부분 일치 시도
                for (ksd, ksg), v in sgg_avg.items():
                    if ksd == sd and sg and sg in ksg:
                        alt = v
                        break
            if alt:
                lat, lng, g = round(alt[0], 6), round(alt[1], 6), 1
        stat[GEOSRC[g]] += 1
        ti = classify(name, t_hira)
        orgs.append([name, sd, sg, ti, ad, phone, lat, lng, g, 1 if ti in (0, 1) else 0])

    n_nhis = len(orgs)

    # ── L3 보건기관 ──
    p3 = os.path.join(ROOT, "검진기관/전국보건기관표준데이터.csv")
    n_health = 0
    if os.path.exists(p3):
        rd = csv.reader(io.open(p3, encoding="cp949", errors="replace"))
        head = next(rd)
        for r in rd:
            if len(r) < 9:
                continue
            name, sd_full, sg = r[0].strip(), r[1].strip(), r[2].strip()
            ad = (r[4] or r[5] or "").strip()
            phone = r[8].strip()
            sd = next((s for f, s in SIDO_FULL if sd_full.startswith(f) or sd_full.startswith(s)), sd_full[:2])
            dkey = (norm_name(name), sd, ad[:14])
            if dkey in seen:
                continue
            seen.add(dkey)
            hrow = idx.get((norm_name(name), sd))
            lat = lng = 0.0
            g = 2
            if hrow and hrow[9] and hrow[8]:
                lat, lng, g = round(hrow[9], 6), round(hrow[8], 6), 0
            else:
                alt = sgg_avg.get((sd, sd + sg))
                if alt:
                    lat, lng, g = round(alt[0], 6), round(alt[1], 6), 1
            stat[GEOSRC[g]] += 1
            orgs.append([name, sd, sg, 6, ad, phone, lat, lng, g, 0])
            n_health += 1

    counts = {}
    for o in orgs:
        counts[TYPES[o[3]]] = counts.get(TYPES[o[3]], 0) + 1

    out = {
        "meta": {
            "asOf": "2024-07-31",
            "built": "2026-08-09",
            "sources": [
                "국민건강보험공단 검진기관기본(공공데이터포털 15133044 · 공개 파일 전체 5,000행)",
                "건강보험심사평가원 병원정보(hira · 2026.3) — 좌표·종별 조인",
                "전국보건기관표준데이터",
            ],
            "total": len(orgs), "nhis": n_nhis, "health": n_health,
            "counts": counts, "geo": stat,
            "personal": sum(1 for o in orgs if o[9]),
            "matchRate": round(stat["hira"] * 100.0 / max(1, len(orgs)), 1),
        },
        "types": TYPES, "geoSrc": GEOSRC,
        "orgs": orgs,
    }
    dst = os.path.join(ROOT, "data/checkup_orgs.json")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with io.open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("total:", len(orgs), "| nhis:", n_nhis, "| health:", n_health)
    print("types:", counts)
    print("geo:", stat, "| matchRate:", out["meta"]["matchRate"], "%")
    print("size: %.1f KB" % (os.path.getsize(dst) / 1024))

if __name__ == "__main__":
    main()
