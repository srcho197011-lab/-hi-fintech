# -*- coding: utf-8 -*-
"""판관비·CAPEX 근거 모델(투자금 양식 v2.0 · v2.1 급여 대표 지시) — 엑셀 생성기(gen_budget.py)와 정답지(oracle.py·oracle3.py)가 같이 읽는 단일 소스.

대표 지시(2026-09-14)
  1. 광고비는 「회원확보 사업계획서 v12.1」의 다섯 길목 방법대로 다시 산출한다.
     ① 메디에이지 결과조회·검진 도래 안내(분기 150만 × 분기 3회) · ② 9채널 타겟 광고(일 100만·월 3,000만 노출, 채널 예산 비중)
     · ③ 안내업체 제휴(광고비 0) · ④ 검진센터 현장 QR(제휴 검진기관 250 → 450 → 650) · ⑤ 기업 B2B(광고비 0 — 영업 인력).
  2. 메디에이지 제휴 DB — 20억 일시 투자를 삭제(대표 지시 2026-09-16)하고, 제휴 DB 500만 건을 2027-01부터 12개월에 걸쳐 받으면서
     초년도(2027)에 가입한 회원의 리포트만 건당 3,000원(통상가의 3배)에 사준다 — 33만 건 · 9.9억. 현금은 발생 월에 나간다.
  3. 모델 인건비(1차 70억)를 지우고 1차연도는 섹션별 인원(대표 포함 17명 + 자문임원)으로, 업계 급여 조사로 산정한다.
     2차연도부터는 섹션마다 연결된 매출 지표의 증가에 맞춰 인원을 늘린다(인원 탄력성).
  4. 초기 AI 시스템(섹션별) 도입비 · 데이터 유지관리비 · 클라우드 비용 · 블록체인 앵커링(100만 건 × 40원).
단가 근거는 「비용근거」 시트(웹 조사·출처 URL)에 둔다. 사이트 finModel.js에는 반영하지 않는다(확정 전 — 대표 지시).
"""
import math


def xround(x):
    """엑셀 ROUND(x,0)과 같게(양수)"""
    return math.floor(round(x, 7) + 0.5)


# ── 섹션: key, 이름, 1차 인원, 연동 지표, 1차 기본연봉(원/년) ──
SECTIONS = [
    ("checkup", "건강검진", 2, "active", 0),
    ("clinic", "진료안내", 2, "me", 0),
    ("care", "돌봄·재가", 1, "me", 0),
    ("ins", "보험·치료비(보험 admin · 헬스메이트센터)", 5, "insC", 0),
    ("nutri", "건강식단·영양제", 1, "catNutri", 0),
    ("skin", "피부건강", 1, "me", 0),
    ("device", "홈케어 의료기기", 1, "catDevice", 0),
    ("sports", "스포츠활동", 1, "catSports", 0),
    ("finance", "경영관리·회계", 1, "rev", 0),
    ("cto", "AI·전산 총괄", 1, "rev", 0),
    ("ceo", "대표이사", 1, None, 0),
]
DRIVERS = {"active": "검진 예약 건수", "me": "연말 회원", "insC": "헬스메이트센터 DB 공급 건수",
           "catNutri": "제품 매출(영양제·건강식단)", "catDevice": "제품 매출(홈케어 의료기기)",
           "catSports": "제품 매출(스포츠) + 예약 서비스 매출", "rev": "매출액 합계"}
BURDEN_KEYS = [("pension", "국민연금(사용자)"), ("health", "건강보험(사용자)"), ("ltc", "장기요양보험(사용자)"),
               ("employment", "고용보험(사용자 · 실업급여+고용안정)"), ("accident", "산재보험"),
               ("severance", "퇴직급여 적립")]
CHANNELS = [("youtube", "유튜브(동영상·쇼츠)", 0.22), ("meta", "인스타·페이스북", 0.18), ("kakao", "카카오(모먼트·톡채널)", 0.14),
            ("naver", "네이버 검색SA", 0.12), ("tiktok", "틱톡·릴스", 0.08), ("crm", "CRM(앱푸시·카톡)", 0.08),
            ("influencer", "인플루언서·UGC", 0.07), ("etc", "기타(커뮤니티·디스플레이 등 2개)", 0.11)]
AI_MODULES = [("checkup", "건강검진(예약·결과 온보딩·리포트)"), ("clinic", "진료안내(송객·원격진료 연계)"),
              ("care", "돌봄·재가(트리아지·돌봄 연계)"), ("ins", "보험·치료비(청구 admin·헬스메이트센터 DB 공급·동의 증서)"),
              ("nutri", "건강식단·영양제(상담·추천)"), ("skin", "피부건강(상담·추천)"), ("device", "홈케어 의료기기(RPM 연동)"),
              ("sports", "스포츠활동(예약·활동 기록)"), ("finance", "경영관리·회계(정산·ERP 연동)")]

COST = {
    # 인력
    "sections": [list(s) for s in SECTIONS],
    "burden": {k: 0.0 for k, _ in BURDEN_KEYS},
    "pensionY": [0.0] * 5,                             # 국민연금 사용자 요율(연차별) — burden["pension"] 대신 사용
    "wageGrowth": 0.0,
    "headElast": 0.0,
    "welfareMonth": 0,                                 # 복리후생(원/인·월 · 임금 인상률 연동)
    "advisors": 0, "advisorFee": 0,
    # 마케팅 ①
    "mk1Target": [1_500_000] * 5, "mk1Times": 3, "mk1Unit": 0,
    # 마케팅 ②
    "mk2Impr": 30_000_000, "mk2Elast": 0.0,
    "chShare": {k: s for k, _, s in CHANNELS},
    "chCpm": {k: 0 for k, _, _ in CHANNELS},          # 원/1,000회(네이버는 CPC×CTR로 계산)
    "naverCpc": 0, "naverCtr": 0.0,
    "videoN": 4, "videoUnit": 0, "cardN": 12, "cardUnit": 0,
    "cardAdMsgs": [0] * 5, "cardAdUnit": 0,
    # 마케팅 ④
    "qrCenters": [250, 350, 450, 550, 650], "qrKit": 0, "qrSticker": 0, "qrShare": 0.0, "qrFee": 0,
    # AI·데이터·클라우드 운영비
    "maintRate": 0.0, "dataMonth": 0, "secMonth": 0, "opsElast": 0.0,
    "cloudMonth": 0, "cloudBaseMembers": 300_000, "cloudPerMember": 0,   # 기본 환경이 수용하는 회원 수를 넘는 분만 회원 연동
    "consultsPerMember": 0.0, "tokIn": 0, "tokOut": 0, "priceIn": 0, "priceOut": 0,
    "bcRecords": 1_000_000, "bcUnit": 40,
    # CAPEX
    "aiModule": {k: 0 for k, _ in AI_MODULES}, "aiCommon": 0, "isms": 0, "officePerHead": 0,
    "capexLater": [0, 2_000_000_000, 5_000_000_000, 5_000_000_000, 5_000_000_000],
    "mediInvest": 0, "life": 5,
    # 메디에이지 제휴 백그라운드 DB(대표 지시 2026-09-16) — 20억 일시 투자를 없애고, DB를 2027-01부터 12개월에 걸쳐 받으면서
    # 그중 실제로 가입한 회원의 리포트만 건당 구매한다(통상가의 3배). 누적 구매는 총량과 그때까지 확보한 누적 DB를 넘지 못한다.
    "mediDb": 5_000_000, "mediMonths": 12, "mediFee": 3_000, "mediPer": 1, "mediShare": 1.0, "mediYears": 1,
}


NOTE = {}          # 가정·인력계획 근거 열 문구(키 → 출처 요약) — 비용근거 조사 반영 시 채움
ADOPT = {}         # 비용근거 키 → (양식 반영값, 반영 위치 · 사유)


def medi_db_cum(C, months):
    """2027-01부터 균등 확보한다고 볼 때 그 달 말까지 누적으로 받은 제휴 DB 건수(months = 2027-01을 1로 센 개월 수)"""
    n = C.get("mediMonths", 12) or 12
    return xround(C.get("mediDb", 0) * min(1.0, max(0.0, months / n)))


def medi_report(P, C, rows, a, y):
    """메디에이지 제휴 DB에서 실제로 가입한 회원의 리포트 구매비(연차 y) — 건당 단가 × 가입 수
       · 구매 연차는 mediYears까지(대표 지시 2026-09-16: 초년도 가입분까지만) · 누적 한도 = 그때까지 확보한 DB
       · 인피니티케어 연계 가입(P infinityVolume)은 메디에이지 DB를 거치지 않으므로 뺀다(대표 지시 2026-09-17 — 33만 중 15만 → 18만 건)"""
    gnew = a["new"] + xround(a["mp"] * P.get("churn", 0))          # 총가입(순증 + 이탈 보전) — 연간손익 「총가입 필요량」과 같은 정의
    a["gnew"] = gnew
    prev = sum(r.get("mediN", 0) for r in rows)
    cap = max(0, medi_db_cum(C, (y + 1) * 12) - prev)              # 연차 말 기준 누적 확보량에서 이미 산 건수를 뺀 나머지
    via = max(0, gnew - P.get("infinityVolume", 0))                 # 메디에이지 경유 후보 = 총가입 − 인피니티케어 연계
    want = xround(via * C.get("mediShare", 1.0) * C.get("mediPer", 1)) if y < C.get("mediYears", 1) else 0
    a["mediN"] = min(want, cap)
    a["mediRep"] = xround(a["mediN"] * C.get("mediFee", 0))


def driver_base(P, a, k):
    """2차부터 인원 증가의 기준이 되는 1차 지표 — 1차는 매출 개시 계수 적용 전 연 환산 값(v3.0) · 이전 방식은 제품 가동률로 연 환산"""
    if "catFull" in a and "startF" in P:
        if k == "catNutri":
            return a["catFull"]["supp"] + a["catFull"]["diet"]
        if k == "catDevice":
            return a["catFull"]["device"]
        if k == "catSports":
            return a["catFull"]["sports"] + a["revResvFull"]
        if k == "rev":
            return a["revFull"]
        if k == "active":
            return a["activeFull"]
        if k == "insC":
            return a["insCFull"]
        return driver(a, k)
    r1 = P["productRamp"][0] or 1.0
    if k == "catNutri":
        return (a["cat"]["supp"][0] + a["cat"]["diet"][0]) / r1
    if k == "catDevice":
        return a["cat"]["device"][0] / r1
    if k == "catSports":
        return a["cat"]["sports"][0] / r1 + a["revResv"]
    if k == "rev":
        return a["rev"] - a["revP"] + a["revP"] / r1
    return driver(a, k)


def driver(a, k):
    if k is None:
        return 1
    if k == "catNutri":
        return a["cat"]["supp"][0] + a["cat"]["diet"][0]
    if k == "catDevice":
        return a["cat"]["device"][0]
    if k == "catSports":
        return a["cat"]["sports"][0] + a["revResv"]
    if k == "insC":
        return a["insC"]
    return a[k]


def heads(P, C, rows, a, y):
    """섹션별 인원 — 1차는 입력, 2차부터 MAX(1차, ROUNDUP(ROUND(1차×(지표/1차 기준 지표)^탄력성, 6))) · 1차 기준은 제품 가동률을 연 환산"""
    out = {}
    first = rows[0] if y > 0 else a
    for key, _, h1, dk, _ in C["sections"]:
        if y == 0 or dk is None:
            out[key] = h1
            continue
        d1 = driver_base(P, first, dk); dy = driver(a, dk)
        if d1 <= 0:
            out[key] = h1
            continue
        v = round(h1 * (dy / d1) ** C["headElast"], 6)
        out[key] = max(h1, math.ceil(v))
    return out


def burden_mult(C, y):
    return 1 + C["pensionY"][y] + sum(C["burden"][k] for k, _ in BURDEN_KEYS if k != "pension")


def blend_cpm(C):
    """예산 가중 평균 CPM = 1 ÷ Σ(비중 ÷ CPM) — 비중 0인 채널은 빠진다. 비중 > 0인데 CPM ≤ 0이면 입력 오류로 0(점검 경고)"""
    s = 0.0
    for k, _, _ in CHANNELS:
        cpm = C["naverCpc"] * C["naverCtr"] * 1000 if k == "naver" else C["chCpm"][k]
        sh = C["chShare"][k]
        if sh > 0 and cpm <= 0:
            return 0.0
        if sh > 0:
            s += sh / cpm
    return 1 / s if s else 0.0


def sw_build(C, y):
    """해당 연차 소프트웨어(AI 시스템) 투자 — 1차: 섹션 모듈 + 공통 플랫폼, 2차부터: 고도화·확장"""
    if y == 0:
        return sum(C["aiModule"].values()) + C["aiCommon"] + C["capexLater"][0]
    return C["capexLater"][y]


def annual_costs(P, rows, a, y):
    """oracle.annual 안에서 연차 y의 판관비·CAPEX 항목을 계산해 a에 채운다(rows = 앞선 연차들)"""
    C = P["cost2"]
    first = rows[0] if y > 0 else a
    # 인력
    hd = heads(P, C, rows, a, y)
    mult = burden_mult(C, y)
    pay_s = {}
    for key, _, _, _, base in C["sections"]:
        gy = (1 + C["wageGrowth"]) ** y
        pay_s[key] = xround(hd[key] * (base * gy * mult + C["welfareMonth"] * 12 * gy))
    adv = xround(C["advisors"] * C["advisorFee"] * 12)
    a["heads"] = hd; a["headTotal"] = sum(hd.values()); a["pay_s"] = pay_s; a["advisor"] = adv
    a["pay"] = sum(pay_s.values()) + adv
    # 마케팅
    a["mk1"] = xround(C["mk1Target"][y] * C["mk1Times"] * 4 * C["mk1Unit"])
    n1 = first["new"]
    impr = C["mk2Impr"] if y == 0 else (xround(C["mk2Impr"] * (a["new"] / n1) ** C["mk2Elast"]) if n1 > 0 else C["mk2Impr"])
    a["mk2Impr"] = impr
    a["media"] = xround(impr * 12 * blend_cpm(C) / 1000)
    a["creative"] = C["videoN"] * C["videoUnit"] + C["cardN"] * C["cardUnit"]
    a["cardAd"] = C["cardAdMsgs"][y] * C["cardAdUnit"]
    prevc = C["qrCenters"][y - 1] if y > 0 else 0
    a["qrNew"] = max(0, C["qrCenters"][y] - prevc)
    a["kit"] = xround(a["qrNew"] * C["qrKit"])
    a["sticker"] = xround(a["active"] * C["qrSticker"])
    a["qrfee"] = xround(a["new"] * C["qrShare"] * C["qrFee"])
    a["mktSum"] = a["mk1"] + a["media"] + a["creative"] + a["cardAd"] + a["kit"] + a["sticker"] + a["qrfee"]
    # 메디에이지 제휴 DB 리포트 구매(가입 연동 · 광고 소계 밖) — 누적은 DB 총량과 그때까지 확보한 누적 DB가 한도
    medi_report(P, C, rows, a, y)
    # AI·데이터·클라우드
    sw_prev = sum(sw_build(C, k) for k in range(y))
    a["swBuild"] = sw_build(C, y)
    a["itMaint"] = xround((sw_prev + 0.5 * a["swBuild"]) * C["maintRate"])
    g = (a["me"] / first["me"]) ** C["opsElast"] if first["me"] > 0 else 1.0
    a["itData"] = xround(C["dataMonth"] * 12 * g)
    a["itSec"] = xround(C["secMonth"] * 12)
    a["cloudBase"] = xround(C["cloudMonth"] * 12)
    avgm = (a["mp"] + a["me"]) / 2
    a["avgMembers"] = avgm
    a["cloudVar"] = xround(max(0.0, avgm - C["cloudBaseMembers"]) * C["cloudPerMember"] * 12)
    per = C["tokIn"] * C["priceIn"] / 1e6 + C["tokOut"] * C["priceOut"] / 1e6
    a["llm"] = xround(avgm * C["consultsPerMember"] * per)
    a["bcRec"] = C["bcRecords"] * a["me"] / first["me"] if first["me"] > 0 else C["bcRecords"]
    a["bc"] = xround(a["bcRec"] * C["bcUnit"])
    a["itOpex"] = a["itMaint"] + a["itData"] + a["itSec"] + a["cloudBase"] + a["cloudVar"] + a["llm"] + a["bc"]
    # CAPEX · 상각
    prevh = rows[y - 1]["headTotal"] if y > 0 else 0
    a["office"] = xround(max(0, a["headTotal"] - prevh) * C["officePerHead"])
    a["isms"] = C["isms"] if y == 0 else 0
    a["build1"] = (a["swBuild"] + a["isms"]) if y == 0 else 0   # 1차 초기 구축(AI 모듈·공통·보안 인증) — 출시 전에 지급
    a["medi"] = C["mediInvest"] if y == 0 else 0
    a["capex"] = a["swBuild"] + a["isms"] + a["office"] + a["medi"]
    L = C["life"]
    caps = [r["capex"] for r in rows[:y]] + [a["capex"]]
    dep = 0.0
    for k, cx in enumerate(caps):
        j = y - k
        f = 0.5 if j == 0 else (1.0 if j < L else (0.5 if j == L else 0.0))
        dep += cx * f / L
    a["depr"] = xround(dep)


# ══════════ 조사 반영(2026-09-14 · cost_evidence.json — 웹 조사 4 + 출처 교차검증 4) ══════════
_BASE = {"checkup": 68_500_000, "clinic": 41_000_000, "care": 36_000_000, "ins": 52_500_000, "nutri": 43_000_000, "skin": 43_000_000,
         "device": 48_000_000, "sports": 40_000_000, "finance": 60_000_000, "cto": 120_000_000, "ceo": 150_000_000}
# 대표 지시 2026-09-14(v2.1): 건강검진 6,850만 · 보험 평균 5,250만 · 대표 1.5억 — 조사 권고(4,400만·4,240만·8,400만) 대신
for _s in COST["sections"]:
    _s[4] = _BASE[_s[0]]
COST["burden"].update(pension=0.0475, health=0.03595, ltc=0.004724, employment=0.0115, accident=0.0066, severance=0.0833)
COST["pensionY"] = [0.0475, 0.05, 0.0525, 0.055, 0.0575]   # 9.5%(2026) → 매년 +0.5%p(13%까지) · 사용자 절반
COST.update(welfareMonth=250_000, wageGrowth=0.035, headElast=1.0, advisors=4, advisorFee=1_000_000,
            mk1Unit=31, mk2Elast=1.0, naverCpc=5_000, naverCtr=0.015,
            videoUnit=3_000_000, cardUnit=150_000, cardAdUnit=120, qrKit=60_000, qrSticker=25, qrShare=0.0, qrFee=0,
            maintRate=0.15, dataMonth=4_000_000, secMonth=1_200_000, opsElast=0.5,
            cloudMonth=3_800_000, cloudBaseMembers=300_000, cloudPerMember=12,
            consultsPerMember=12, tokIn=21_200, tokOut=2_000, priceIn=2691.8, priceOut=13459,
            aiCommon=300_000_000, isms=45_000_000, officePerHead=2_000_000)
COST["chCpm"].update(youtube=6_000, meta=9_000, kakao=4_000, tiktok=8_000, crm=15_000, influencer=20_000, etc=2_000)
COST["aiModule"].update(checkup=150_000_000, clinic=100_000_000, care=100_000_000, ins=220_000_000, nutri=100_000_000,
                        skin=100_000_000, device=100_000_000, sports=100_000_000, finance=100_000_000)

NOTE.update({
    "sal_checkup": "대표 지시 2026-09-14 — 6,850만(2명 평균) · 조사 권고 4,400만(리드 5,000만+담당 3,800만, 워크피디아·사람인)",
    "sal_clinic": "salary_clinic — 리드 4,700만+담당 3,500만 · 사람인 상담실장·병원코디네이터·고용24 의료코디네이터 · 확인",
    "sal_care": "salary_care — 2026 사회복지시설 인건비 가이드라인 5호봉 연 2,970만 대비 민간 상위 · 워크피디아 · 확인",
    "sal_ins": "대표 지시 2026-09-14 — 5명 평균 5,250만 · 조사 권고 4,240만(팀장 6,000만+담당 3,800만, 사람인 손해사정사·보험심사)",
    "sal_nutri": "salary_nutri — 영양사 우대 MD · 워크피디아·사람인 · 확인",
    "sal_skin": "salary_skin — 브랜드MD 5~7년 · 사람인 · 확인",
    "sal_device": "salary_device — 의료기기 MD/RA(공개 통계 없어 인증심사원 등 대용) · 신뢰도 낮음 · 확인",
    "sal_sports": "salary_sports — 워크피디아 스포츠·레크리에이션 전문가 5~10년 · 확인",
    "sal_finance": "salary_finance — 워크피디아 경영 관련 사무원 10년+(5~29명) 중위 ×1.06 · 확인",
    "sal_cto": "salary_cto — KOSA 2026 SW기술자 평균임금·헤드헌터 CTO 가이드 · 확인",
    "sal_ceo": "대표 지시 2026-09-14 — 1.5억 · 조사 권고 8,400만(공식 통계 없음, 신뢰도 낮음 · 조사 범위 상한 1.2억)",
    "wageGrowth": "wage_growth — 2025 명목임금 +3.1%(고용노동부) · 2026 전망 3~4%",
    "headElast": "대표 지시(매출 증대에 따라)를 비례 1.0으로 적용 — 보수적. 국내 피어 관측 0.2~0.8(bench headcount_elasticity 권고 0.5)",
    "burden_pension": "개정 국민연금법 — 2026 9.5%에서 매년 +0.5%p(13%까지), 사용자 절반 4.75→5.75% · 기준소득월액 상한은 반영 안 함(보수적)",
    "burden_health": "2026 건강보험료율 7.19%의 절반",
    "burden_ltc": "2026 장기요양 0.9448%(건보료의 13.14%)의 절반",
    "burden_employment": "실업급여 0.9% + 고용안정·직업능력개발 0.25%(150인 미만)",
    "burden_accident": "2026 산재보험료율 고시 — 전문·보건·교육·여가 서비스 6‰ + 출퇴근 0.6‰",
    "burden_severance": "근로자퇴직급여보장법 — 연 1개월분(1/12)",
    "welfareMonth": "welfare — 고용노동부 기업체노동비용조사 법정 외 복리비 월 28.97만(전 규모) 참고 · 25만 채택",
    "advisorFee": "advisor_fee — 사외 자문 월 50만~300만 · 100만 채택 · 인원 4명은 [가정] 의료·보험·법률·계리 각 1명(통계 없음)",
    "mk1Unit": "비용근거 msg_lms — SOLAPI 월 100만~199만 건 구간 LMS 31원(VAT 별도) · 검증 확인 · 광고성 정보는 사전 수신동의(정보통신망법 §50) 필요",
    "cpm_youtube": "cpm_youtube — 범퍼 CPM 3,000~6,000원·인스트림 CPV 15~80원(PNA 2026) · 혼합 6,000원은 판단값",
    "cpm_meta": "cpm_meta — 국내 원화 공식 수치 없음 · 해외 벤치마크 환산 · 신뢰도 낮음(테스트 캠페인으로 확인)",
    "cpm_kakao": "cpm_kakao — 카카오 비즈니스 가이드 비즈보드 CPM 기본 입찰 3,000원 · 4,000원 채택",
    "cpm_naver": "네이버 검색SA 유효 CPM = 클릭당 단가 × 클릭률 × 1,000(아래 입력)",
    "cpm_tiktok": "cpm_tiktok — APAC 가이드 한국 CPM $5~10 · 신뢰도 낮음",
    "cpm_crm": "crm_push — 카카오 채널 메시지 15원/건(VAT 별도) · 자체 앱 푸시(FCM)는 무료",
    "cpm_influencer": "cpv_influencer — 태그바이 단가식(평균 조회 ÷ 1,000 × 2만원)",
    "cpm_etc": "cpm_display — 카카오 모먼트 디스플레이 기본 입찰 1,000원·커뮤니티 광고 · 2,000원",
    "naverCpc": "cpc_naver_checkup — 건강검진 모바일 순위 입찰 7,590~12,180원 · 건강검진예약 3,360~6,500원(2026-09-14 조회) · 5,000원",
    "naverCtr": "ctr_naver_sa — 파워링크 평균 CTR 0.8~2.4%(네이버 2024 비즈니스 리포트 인용) · 1.5%",
    "mk2Elast": "[가정] 순증 회원에 비례(1.0) — 사업계획서 p5 신규의 이듬해 반복 접점 편입을 반영하면 1 미만 가능",
    "videoUnit": "creative_video30 — 크몽 거래·광고 영상 30초 80만~1,000만 · 300만",
    "cardUnit": "creative_cardnews — 크몽 배너 가이드 평균 15만",
    "cardAdUnit": "card_target_lms — 신한카드 타겟 LMS 120원/건(오픈애즈 2024) · 발송 건수는 협의 전 0",
    "qrKit": "qr_pop — X배너·스탠드·안내판 인쇄 단가 합산 6만원/센터",
    "qrSticker": "qr_sticker — 50mm 스티커 1,000매 1.2만~2.7만 · 25원/매",
    "maintRate": "SW 유지관리 요율 — 공공 10~15%(전자신문 2021·SPRi), 대가산정 가이드 등급별 11~19% · 15% 채택",
    "dataMonth": "data_maintenance — KOSA 2026 정보시스템운용자·데이터분석가 평균임금 × 부분 투입 M/M · 400만",
    "secMonth": "security_monitoring — NCP Security Monitoring 공식 단가 합산 88만(Anti-DDoS 1회 과금) · 120만은 [가정] 이중화 여유 포함",
    "cloudMonth": "cloud_base — NCP 요금 API 단가로 운영 환경 구성(API 서버·Cloud DB HA·LB·NAT·스토리지·로그) 월 380만 · 확인",
    "cloudBaseMembers": "cloud_base 구성의 기준 규모 — 약 30만 회원",
    "cloudPerMember": "cloud_per_member — 권고 구성의 회원 비례 항목 ÷ 30만 = 약 12원(검증 보정값)",
    "opsElast": "[가정] 규모의 경제 — 회원이 2배면 데이터 유지관리 약 1.4배",
    "consultsPerMember": "[가정] 평균 회원 1인당 월 1회 AI 상담",
    "tokIn": "tokens_per_consult — 4턴 × (프롬프트 800 + 검색 3,000) + 대화 이력 = 입력 21,200(검증 보정값)",
    "tokOut": "tokens_per_consult — 출력 2,000",
    "priceIn": "llm_price_anthropic_in — Claude Sonnet 5 입력 $2/MTok × 1,345.9원(2026-09-11) · 국내 HyperCLOVA X면 1,250원",
    "priceOut": "llm_price_anthropic_out — Sonnet 5 출력 $10/MTok × 1,345.9원",
    "bcUnit": "blockchain_anchor — 조사상 보수적 상한(Kaia 약 0.08원·Polygon 약 2.7원·NCP 블록체인 약 6.3원/건) — 올인 예산으로 표기",
    "officePerHead": "[추정] 업무용 노트북·모니터·주변기기 1인당 200만 — 공식 단가 근거 없음",
    "ai_checkup": "[판단] 표준 1억(ai_build_module)에 복잡도 가중 1.5 — 검진 결과 23종 온보딩·리포트 연동 · 조사 근거는 표준 1억까지",
    "ai_clinic": "ai_build_module — 도메인 RAG·에이전트 린 외주 1식 1억(KOSA 2026 bottom-up 약 1.02억 · 공공 사례 2.15억) · 확인",
    "ai_care": "ai_build_module 표준 1억",
    "ai_ins": "[판단] 조사 범위 상한 2.2억(ai_build_module 5천만~2.2억) — 청구 admin + 헬스메이트센터 DB 공급 + 동의 증서(준법 요구 최대)",
    "ai_nutri": "ai_build_module 표준 1억", "ai_skin": "ai_build_module 표준 1억", "ai_device": "ai_build_module 표준 1억",
    "ai_sports": "ai_build_module 표준 1억", "ai_finance": "ai_build_module 표준 1억",
    "aiCommon": "ai_platform_common — KOSA 2026 평균임금 약 30M/M bottom-up · 신뢰도 낮음",
    "isms": "isms_p_initial — 간편인증 심사수수료 600만~1,100만 + 컨설팅 · 4,500만",
})
ADOPT.update({
    **{"salary_" + k: (v, "인력계획 ① " + dict((s[0], s[1]) for s in SECTIONS)[k] + " 기본연봉") for k, v in _BASE.items()},
    "salary_checkup": (68_500_000, "인력계획 ① 건강검진 — 대표 지시(권고 4,400만 대신)"),
    "salary_ins": (52_500_000, "인력계획 ① 보험·치료비 평균 — 대표 지시(권고 4,240만 대신)"),
    "salary_ceo": (150_000_000, "인력계획 ① 대표이사 — 대표 지시(권고 8,400만 대신)"),
    "directive_salary": (None, "인력계획 ① 건강검진·보험·대표 기본연봉"),
    "advisor_fee": (1_000_000, "인력계획 ② 자문료(원/인·월)"), "advisor_count": (4, "인력계획 ② 자문임원 수 — 가정(통계 없음)"),
    "burden_pension": (4.75, "인력계획 ② 국민연금 사용자(%) — 1차 4.75 → 5차 5.75"), "burden_health": (3.595, "인력계획 ②"), "burden_ltc": (0.4724, "인력계획 ②"),
    "burden_employment": (1.15, "인력계획 ②"), "burden_accident": (0.66, "인력계획 ②"), "severance": (8.33, "인력계획 ② 퇴직급여"),
    "welfare": (250_000, "인력계획 ② 복리후생(원/인·월)"), "wage_growth": (3.5, "인력계획 ② 임금 인상률(%)"),
    "msg_lms": (31, "가정 ⑥ ① 발송 단가 — 광고 문안 길이상 LMS"), "msg_sms": (None, "참고"), "msg_friendtalk": (None, "참고 — 카카오 브랜드 메시지 대안"),
    "msg_friendtalk_image": (None, "참고"), "msg_alimtalk": (None, "미채택 — 알림톡은 광고 불가"), "msg_080": (None, "참고 — 월 3.4만(미미해 제외)"),
    "cpm_youtube": (6_000, "가정 ⑥ ② 유튜브"), "cpm_meta": (9_000, "가정 ⑥ ② 인스타·페이스북"), "cpm_kakao": (4_000, "가정 ⑥ ② 카카오"),
    "cpm_tiktok": (8_000, "가정 ⑥ ② 틱톡·릴스"), "cpm_display": (2_000, "가정 ⑥ ② 기타(커뮤니티·디스플레이)"),
    "cpc_naver_checkup": (5_000, "가정 ⑥ ② 네이버 클릭당 단가"), "ctr_naver_sa": (1.5, "가정 ⑥ ② 네이버 클릭률(%)"),
    "cpv_influencer": (20_000, "가정 ⑥ ② 인플루언서(1,000회 조회당)"), "crm_push": (15_000, "가정 ⑥ ② CRM(1,000건당)"),
    "creative_video30": (3_000_000, "가정 ⑥ ② 영상 1편 × 연 4편"), "creative_cardnews": (150_000, "가정 ⑥ ② 카드뉴스 1세트 × 연 12세트"),
    "card_target_lms": (120, "가정 ⑥ ② 카드사 단가 — 발송 건수는 협의 전 0"), "qr_pop": (60_000, "가정 ⑥ ④ 센터당 QR 키트"),
    "qr_sticker": (25_000, "가정 ⑥ ④ 스티커 — 1,000매 2.5만 = 25원/매로 입력"), "center_referral_fee": (0, "미채택 — 검증에서 근거 부족 · 협의 전 0"),
    "cac_health_app_kr": (None, "참고 — 검증 근거 부족 · 산출 실효 CAC와 비교만"),
    "ai_build_module": (100_000_000, "가정 ⑩ 표준 모듈 1억 — 건강검진 1.5억 · 보험·치료비 2.2억(상한)"), "sw_wage_2026_mid": (None, "참고 — 모듈 단가 삼각측량"),
    "sw_wage_2026_senior": (None, "참고"), "ai_platform_common": (300_000_000, "가정 ⑩ AI 공통 플랫폼"), "isms_p_initial": (45_000_000, "가정 ⑩ 보안 인증"),
    "isms_p_annual": (None, "미채택 — 사후심사 수수료 공식 근거 없음"),
    "llm_price_anthropic_in": (2691.8, "가정 ⑦ LLM 입력 단가(Claude Sonnet 5)"), "llm_price_anthropic_out": (13459, "가정 ⑦ LLM 출력 단가"),
    "llm_price_openai_in": (None, "비교"), "llm_price_openai_out": (None, "비교"), "llm_price_clova_in": (None, "비교 — 국내 모델 전환 시 절감"),
    "llm_price_clova_out": (None, "비교"), "tokens_per_consult": (23_200, "가정 ⑦ 입력 21,200 + 출력 2,000(검증 보정값)"),
    "cloud_base": (3_800_000, "가정 ⑦ 클라우드 기본 환경(30만 회원 수용)"), "cloud_per_member": (12, "가정 ⑦ 증설 1인당(검증 보정값)"),
    "storage_per_gb": (None, "참고"), "data_maintenance": (4_000_000, "가정 ⑦ 데이터 유지관리 월"), "security_monitoring": (1_200_000, "가정 ⑦ 보안관제 월"),
    "blockchain_anchor": (40, "가정 ⑦ 대표 지시 40원 — 조사상 보수적 상한"),
    "headcount_elasticity": (1.0, "인력계획 ② 탄력성 1.0 — 대표 지시 비례 적용(권고 0.5보다 보수적)"),
    "mkt_ratio_peer_median": (None, "비교 — 연간손익 광고비 ÷ 매출 메모 행"), "rpe_peer_median_kr_digital_health": (None, "비교 — 인력계획 1인당 매출 행"),
    "rpe_naver": (None, "비교 — 인력계획 1인당 매출 행"), "rpe_kakao": (None, "비교"),
    "directive_sections": (17, "인력계획 ① 1차 인원"), "directive_medi": (2_000_000_000, "가정 ⑩ 메디에이지 데이터 투자"),
    "directive_bc": (40, "가정 ⑦ 블록체인 앵커링 단가 · 1차 100만 건"), "plan_mk1": (1_500_000, "가정 ⑥ ① 분기 대상 · 분기 3회"),
    "plan_mk2": (30_000_000, "가정 ⑥ ② 1차 월 노출 · 채널 비중"), "plan_qr": (250, "가정 ⑥ ④ 1차 배치 센터(누적 250→650)"),
    "maint_rate": (15, "가정 ⑦ 유지보수 요율(%)"), "office_per_head": (2_000_000, "가정 ⑩ 사무 장비 단가"),
    "consults_per_member": (12, "가정 ⑦ AI 상담 수"), "ops_elast": (0.5, "가정 ⑦ 탄력성"), "mk2_elast": (1.0, "가정 ⑥ ② 노출 탄력성"),
    "capex_later": (5_000_000_000, "가정 ⑩ 고도화 2차 20억 · 3~5차 50억(3~5차 값)"),
})
