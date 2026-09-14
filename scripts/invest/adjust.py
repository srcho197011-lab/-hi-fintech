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
"""
import copy

TYPES = ("centers", "hospitals", "pharmacies")          # 검진센터 · 병원 · 약국
ADJ = {
    "pharmaciesY1": 200,
    "subFeeBaseT": {"centers": 300000, "hospitals": 500000, "pharmacies": 200000},
    "subFeeStepT": {"centers": 500000, "hospitals": 500000, "pharmacies": 0},
    "subFeeRateT": {"centers": 0.0, "hospitals": 0.0, "pharmacies": 0.20},
}


def apply(P):
    Q = copy.deepcopy(P)
    Q["pharmacies"][0] = ADJ["pharmaciesY1"]
    Q["subFeeBaseT"] = dict(ADJ["subFeeBaseT"])
    Q["subFeeStepT"] = dict(ADJ["subFeeStepT"])
    Q["subFeeRateT"] = dict(ADJ["subFeeRateT"])
    return Q


def fee(P, t, y):
    """유형 t의 y(0부터) 연차 월 구독료 — 1차 0원, 2차부터 기본×(1+인상률)^(연차−2) + 정액×(연차−2), 반올림, 상한"""
    if y == 0:
        return 0
    k = y - 1
    v = P["subFeeBaseT"][t] * (1 + P["subFeeRateT"][t]) ** k + P["subFeeStepT"][t] * k
    return min(P["subFeeCap"], int(v + 0.5))
