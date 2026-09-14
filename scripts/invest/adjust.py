# -*- coding: utf-8 -*-
"""투자금 양식 전용 조정값 — finModel.js 기본값 위에 대표 지시를 덮어쓴다.
엑셀 생성기(gen_budget.py)와 정답지(oracle3.py)가 이 한 곳을 같이 읽는다.
사이트의 finModel.js 자체는 바꾸지 않았다 — 반영할지는 대표 결정 사항이다.

2026-09-14 대표 지시
  · 약국 제휴는 1차연도 200곳에서 시작(모델 500곳). 2~5차는 모델값 유지.
  · AI 플랫폼 구독료를 기관 유형별로 분리 — 2차연도 월 기본료 검진센터 30만 · 병원 50만 · 약국 20만.
    1차연도 무료, 연 인상폭(월 50만), 상한(월 300만)은 모델 구조를 그대로 두고 유형별로 따로 고칠 수 있게 했다.
  · 약국 구독료는 정액(+50만)이 아니라 연 20% 복리 인상(대표 지시 2026-09-14 추가).
    월 구독료 = 기본료 × (1+인상률)^(연차−2) + 정액 인상폭 × (연차−2), 원 단위 반올림, 상한 적용.
  · 검진 연계를 두 채널로 분리(대표 지시 2026-09-14 추가).
    자사운영 검진안내 — 건당 매출 3만 · 3종 서비스 원가 2만
    타사 제휴 검진안내(인피니티 등) — 건당 매출 1만 · 3종 서비스 원가 2만
    채널 비율 — 1차연도 자사 20% : 타사 80%, 이후 자사 비율 매년 +15%p(20→35→50→65→80%, 상한 100%).
    「15%씩 상승」은 %p 가산으로 해석했다(복리 15%면 5차 35.0%).
  · 검진 후 헬스케어 서비스는 고객에게 받는 매출이 없다 — 병원·검진센터·약국 구독료로 받는다.
    그래서 고객 수수료를 0으로 둔다(이용률은 운영 지표로 남긴다).
  · 「보험 중개 수수료」를 「헬스메이트센터 사용료」로 바꾸고 전략적 투자금에 연동한 우대 단가를 둔다(대표 지시 2026-09-14 추가).
    기준 — 투자금 100억 · DB 건당 시가 10만원 가정.
    우대 단가 — 1차연도 시가의 50%(5만원), 매년 +1만원(5→6→7→8→9만, 시가 상한).
    우대 한도 — 1차연도 10만 건, 매년 +10만 건(10→20→30→40→50만). 한도를 넘는 공급 건은 시가.
    한도는 연도마다 새로 시작하고, 연내 누적 공급 순서대로 한도까지 우대 단가를 적용한다(월별 배분·현금도 같은 순서).
  · 신규 스트림(광고·제휴 · AI Agent 프리미엄 · API·데이터·분석)은 삭제한다(대표 지시 2026-09-14 추가) — 매출 0.
"""
import copy
import math

TYPES = ("centers", "hospitals", "pharmacies")          # 검진센터 · 병원 · 약국
ADJ = {
    "pharmaciesY1": 200,
    "subFeeBaseT": {"centers": 300000, "hospitals": 500000, "pharmacies": 200000},
    "subFeeStepT": {"centers": 500000, "hospitals": 500000, "pharmacies": 0},
    "subFeeRateT": {"centers": 0.0, "hospitals": 0.0, "pharmacies": 0.20},
    "chkOwnFee": 30000, "chkOwnCost": 20000,          # 자사운영 검진안내
    "chkPtnFee": 10000, "chkPtnCost": 20000,          # 타사 제휴 검진안내(인피니티 등)
    "chkOwnShareY1": 0.20, "chkOwnShareStep": 0.15,   # 자사 비율 1차 20% · 매년 +15%p
    "serviceCommission": 0,                            # 헬스케어 서비스 고객 수수료 없음
    "hmInvest": 10_000_000_000,                        # 전략적 투자금(우대 조건 기준)
    "hmMarket": 100_000,                               # DB 건당 시가
    "hmRate1": 0.50, "hmPriceStep": 10_000,            # 우대 단가 1차 시가×50% · 매년 +1만
    "hmCap1": 100_000, "hmCapStep": 100_000,           # 우대 한도 1차 10만 건 · 매년 +10만 건
    "dropNewStreams": True,                            # ⑥ 신규 스트림 삭제
}
HM_KEYS = ("hmInvest", "hmMarket", "hmRate1", "hmPriceStep", "hmCap1", "hmCapStep")


def apply(P):
    Q = copy.deepcopy(P)
    Q["pharmacies"][0] = ADJ["pharmaciesY1"]
    Q["subFeeBaseT"] = dict(ADJ["subFeeBaseT"])
    Q["subFeeStepT"] = dict(ADJ["subFeeStepT"])
    Q["subFeeRateT"] = dict(ADJ["subFeeRateT"])
    for k in ("chkOwnFee", "chkOwnCost", "chkPtnFee", "chkPtnCost", "chkOwnShareY1", "chkOwnShareStep", "serviceCommission") + HM_KEYS:
        Q[k] = ADJ[k]
    if ADJ["dropNewStreams"]:
        Q["adPerActive"] = [0] * 5; Q["aiAgentRate"] = [0] * 5; Q["apiClients"] = [0] * 5
    return Q


def xround(x):
    """엑셀 ROUND(x,0)과 같게 — 십진수로 .5인데 이진수로 조금 모자라는 경우까지 올림"""
    return math.floor(round(x, 7) + 0.5)


def fee(P, t, y):
    """유형 t의 y(0부터) 연차 월 구독료 — 1차 0원, 2차부터 기본×(1+인상률)^(연차−2) + 정액×(연차−2), 반올림, 상한"""
    if y == 0:
        return 0
    k = y - 1
    v = P["subFeeBaseT"][t] * (1 + P["subFeeRateT"][t]) ** k + P["subFeeStepT"][t] * k
    return min(P["subFeeCap"], xround(v))


def own_share(P, y):
    """y(0부터) 연차 자사운영 비율 — 1차 비율 + 상승폭×(연차−1), 상한 100%"""
    return min(1.0, P["chkOwnShareY1"] + P["chkOwnShareStep"] * y)


def checkup(P, y, active):
    """검진 연계 채널 분리 — (자사 건수, 타사 건수, 매출, 원가). 자사 건수는 원 단위 반올림, 타사 = 나머지"""
    own = xround(active * own_share(P, y))
    ptn = active - own
    rev = own * P["chkOwnFee"] + ptn * P["chkPtnFee"]
    cost = own * P["chkOwnCost"] + ptn * P["chkPtnCost"]
    return own, ptn, rev, cost


def hm_terms(P, y):
    """y(0부터) 연차 헬스메이트센터 우대 조건 — (우대 한도 건수, 우대 단가, 시가). 우대 단가 = MIN(시가, ROUND(시가×1차 비율)+인상폭×(연차−1))"""
    cap = max(0, P["hmCap1"] + P["hmCapStep"] * y)
    price = max(0, min(P["hmMarket"], xround(P["hmMarket"] * P["hmRate1"]) + P["hmPriceStep"] * y))
    return cap, price, P["hmMarket"]


def hm_fee(P, y, cases):
    """연간 공급 건수 → (우대 건수, 시가 건수, 사용료, 시가 대비 할인액)"""
    cap, price, mkt = hm_terms(P, y)
    disc = min(cases, cap)
    full = cases - disc
    return disc, full, disc * price + full * mkt, disc * (mkt - price)
