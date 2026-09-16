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
    대표 확정(2026-09-14): 「매년 15%씩 상승」은 20%에 매년 15%p를 더해 5차 80%로 만든다는 뜻(복리 아님).
  · 검진 후 헬스케어 서비스는 고객에게 받는 매출이 없다 — 병원·검진센터·약국 구독료로 받는다.
    그래서 고객 수수료를 0으로 둔다(이용률은 운영 지표로 남긴다).
  · 「보험 중개 수수료」를 「헬스메이트센터 사용료」로 바꾸고 전략적 투자금에 연동한 우대 단가를 둔다(대표 지시 2026-09-14 추가).
    기준 — 투자금 100억 · DB 건당 시가 10만원 가정.
    우대 단가 — 1차연도 시가의 50%(5만원), 매년 +1만원(5→6→7→8→9만, 시가 상한).
    우대 한도 — 1차연도 10만 건, 매년 +10만 건(10→20→30→40→50만). 한도를 넘는 공급 건은 시가.
    한도는 연도마다 새로 시작하고, 연내 누적 공급 순서대로 한도까지 우대 단가를 적용한다(월별 배분·현금도 같은 순서).
  · 신규 스트림(광고·제휴 · AI Agent 프리미엄 · API·데이터·분석)은 삭제한다(대표 지시 2026-09-14 추가) — 매출 0.
  · 판관비·CAPEX를 근거 기반으로 다시 짠다(v2.0) — 광고비(5대 엔진) · 메디에이지 데이터 투자 20억 · 섹션별 인력 ·
    AI 시스템 도입 · 데이터·클라우드·블록체인. 계산과 기본값은 costs.py 한 곳에 있다.
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
    "hmRate1": 0.50, "hmPriceStep": 0,                 # 우대 단가 5만 고정(대표 지시 2026-09-16) — 시가×50%, 매년 인상 없음
    "hmCap1": 100_000, "hmCapStep": 100_000,           # 우대 한도 1차 10만 건 · 매년 +10만 건
    "dropNewStreams": True,                            # ⑥ 신규 스트림 삭제
    "cost2": True,                                     # 판관비·CAPEX 근거 모델(v2.0 · costs.py)
    # ── v3.1 대표 지시(2026-09-16): 장기차입금 제외 — finModel.js의 장기차입 20억 가정과 연 이자 8억(암묵 40%) 고정 상수를 뺀다 ──
    "interestYear": 0,
    # ── v3.0 대표 일정(2026-09-15): 2026-10 준비 시작 · 2027-01-01 오픈 · 연차 = 2027~2031 달력 연도 ──
    "revMode": 2,                                      # 매출 산정 방식(2028~): 2 = 월별 누적(월말 회원 기준) · 1 = 연말 기준(사업계획서 방식)
    # 대표 지시 2026-09-16 — 2027년 현대해상 공급 DB는 「연 환산 12만」이 아니라 실제 12만 건. 반영률을 1로 두고 월 배분만 파일럿 일정을 따른다.
    "insFullY1": 1,
    # 대표 지시 2026-09-16 — 제품마진 배분: 포인트 적립 50→60% · 기부(치료비 나눔) 30→15%
    "rewardRate": 0.60, "donationRate": 0.15,
    # 대표 지시 2026-09-16 — 회원 경로 조정: 5차년도(2031) 최종 700만 명. 1차 33만은 유지하고 2~5차를 다시 잡는다.
    # 검진 예약(활성)·마케팅 동의 회원은 종전 회원 대비 비율을 그대로 두고 같이 줄인다(1만 단위 반올림).
    "membersEnd": [330_000, 900_000, 2_200_000, 4_200_000, 7_000_000],
    "activeAbs": [250_000, 620_000, 1_440_000, 2_660_000, 4_200_000],
    "mktConsentEnd": [200_000, 550_000, 1_380_000, 2_660_000, 4_400_000],
    # 대표 지시 2026-09-16 — 초년도 제품판매(건강커머스)는 실제 가동 기간을 고려해 보수적으로 30% 감액(0.70배).
    # 매출에 비례하는 제품 원가·결제 수수료·적립·기부도 같이 줄고, 광고비 등 고정성 비용은 그대로 둔다.
    "prodAdjY1": 0.70,
    "subStartYear": {"centers": 2, "hospitals": 1, "pharmacies": 1},   # 병원·약국 구독 2027부터 · 검진센터는 2028부터(1차 무료 유지)
    "productRampY1": 1.0,                              # 1차 제품 가동률 1/3을 월 개시 계수(7월부터)로 대체
    # 재가·돌봄 연계 — 제휴 돌봄기관(방문요양·주야간보호·등록 간병업체)이 내는 센터당 월 정액 파트너 이용료(건당 소개료·수익배분 없음)
    "careRate": 0.01, "carePerCenter": 3, "careFee": 300_000, "careCostRate": 0.05,
    # 검진 월별 계절 지수(매년) — 국가 일반검진(연말 쏠림, 검증 보정값)과 민간 종합검진(일산병원)의 50:50
    "chkSeason": [0.0281, 0.0347, 0.0588, 0.0858, 0.0873, 0.0871, 0.0946, 0.0914, 0.0708, 0.1031, 0.1181, 0.1404],
    # 2028~2031 연 성숙 계수(월별 누적 방식에서만) — 커머스는 회원이 계속 늘어 재구매가 덜 쌓인 코호트가 섞임(2027과 같은 코호트 모형) · 돌봄은 12개월 램프의 2028 잔여
    "matureY": {"P": [1, 0.84, 0.88, 0.91, 0.93], "Care": [1, 0.93, 1, 1, 1]},
    "startF": {                                        # 2027년 월별 개시 계수(0~1) — 2028년부터 성숙 계수 · 근거는 매출근거 시트
        "P": [0, 0, 0, 0, 0, 0, 0.28, 0.47, 0.59, 0.68, 0.74, 0.78],         # 7월 개시 · 재구매 누적 램프 × 회원 증가 코호트 보정
        "Chk": [0, 0, 0, 0.25, 0.45, 0.65, 0.80, 0.90, 1, 1, 1, 1],          # 4월 개시 · 약 5개월에 정상 궤도(조사 가정)
        "Resv": [0, 0, 0, 0.25, 0.45, 0.65, 0.80, 0.90, 1, 1, 1, 1],         # 검진 예약 연동
        "Svc": [0, 0, 0, 0, 0, 0, 0.30, 0.36, 0.42, 0.48, 0.53, 0.59],       # 고객 수수료 0 — 돌봄과 같은 줄기
        "Care": [0, 0, 0, 0, 0, 0, 0.30, 0.36, 0.42, 0.48, 0.53, 0.59],      # 7월 개시 · 30%에서 12개월에 100%(조사 권고 선형)
        "Sub": [0, 0, 0.08, 0.15, 0.23, 0.31, 0.40, 0.50, 0.61, 0.73, 0.86, 1.00],   # 3월 과금 개시(대표 지시 2026-09-16) · 연말 유료 기관 중 그 달 과금 비중
        "Ins": [0, 0, 0, 0.06, 0.10, 0.28, 0.41, 0.60, 0.81, 0.92, 0.98, 1.00],           # 4월 파일럿 → 6~8월 수도권 → 8월 말 전국(회원 증가분은 월 기준에 있어 뺌)
    },
}
HM_KEYS = ("hmInvest", "hmMarket", "hmRate1", "hmPriceStep", "hmCap1", "hmCapStep")
TIMING_KEYS = ("revMode", "matureY", "subStartYear", "careRate", "carePerCenter", "careFee", "careCostRate", "chkSeason", "startF", "insFullY1", "prodAdjY1")
# 매출 줄(개시 계수 · 월 배분 단위) — key, 이름, 배분 기준(member = 회원 가중 · season = 회원 가중 × 검진 계절 · flat = 12개월 균등)
STREAMS = [("P", "제품판매(건강커머스)", "member"), ("Chk", "검진 연계(자사·타사)", "season"), ("Resv", "예약 서비스(골프·시설)", "member"),
           ("Svc", "헬스케어 서비스(고객 수수료)", "member"), ("Care", "재가·돌봄 파트너 이용료", "member"),
           ("Sub", "AI 플랫폼 구독(병원·약국·검진센터)", "flat"), ("Ins", "헬스메이트센터 사용료", "member")]


def apply(P):
    Q = copy.deepcopy(P)
    Q["pharmacies"][0] = ADJ["pharmaciesY1"]
    for k in ("membersEnd", "activeAbs", "mktConsentEnd"):     # 회원 경로(대표 지시 2026-09-16 · 2031 700만)
        Q[k] = list(ADJ[k])
    Q["subFeeBaseT"] = dict(ADJ["subFeeBaseT"])
    Q["subFeeStepT"] = dict(ADJ["subFeeStepT"])
    Q["subFeeRateT"] = dict(ADJ["subFeeRateT"])
    for k in ("chkOwnFee", "chkOwnCost", "chkPtnFee", "chkPtnCost", "chkOwnShareY1", "chkOwnShareStep", "serviceCommission",
              "interestYear", "rewardRate", "donationRate") + HM_KEYS:
        Q[k] = ADJ[k]
    if ADJ["dropNewStreams"]:
        Q["adPerActive"] = [0] * 5; Q["aiAgentRate"] = [0] * 5; Q["apiClients"] = [0] * 5
    if ADJ["cost2"]:                                   # 판관비·CAPEX 근거 모델 — costs.py
        import costs
        Q["cost2"] = copy.deepcopy(costs.COST)
    for k in TIMING_KEYS:                              # v3.0 매출 개시 일정
        Q[k] = copy.deepcopy(ADJ[k])
    Q["productRamp"] = list(Q["productRamp"]); Q["productRamp"][0] = ADJ["productRampY1"]
    return Q


START_NOTE = {
    "P": "7월 개시 · 재구매 코호트 램프(Recharge 건기식 구독 86.6/57.6/33.8% · 라플라스 식품 구독 60/42/25%) 평균 0.28→0.92(6개월) × 회원 증가 코호트 보정(검증 지적) → 0.28/0.47/0.59/0.68/0.74/0.78 · 2028 상반기 잔여 램프는 넣지 않음(2028부터 1)",
    "Chk": "4월 개시 · 신규 검진 예약 서비스 약 5개월에 정상 궤도 — 공개 월별 데이터 없음(착한의사·굿닥·똑닥 이정표만)이라 조사 가정 0.25/0.45/0.65/0.80/0.90/1",
    "Resv": "예약 건수 = 검진 예약 × 배수(모델)라 개시는 검진과 같은 4월 · 골프·시설 예약이라 검진 계절은 쓰지 않고 회원 기준(검증 지적)",
    "Svc": "고객 수수료 0(대표 지시 2026-09-14) — 돌봄과 같은 줄기로 둠(매출 0)",
    "Care": "7월 개시 · 30%에서 12개월에 걸쳐 100%(케어닥 16개월 흑자 · 케어네이션 30개월에 월 1,500건 · 스마일시니어 연 100곳 — 조사 권고 12개월) · 2028 상반기 잔여 램프 제외",
    "Sub": "3월 과금 개시(대표 지시 2026-09-16 — 종전 1월) · 준비기간(2026-10~12) 파일럿이 3월에 유료 전환(연말의 8%) 뒤 12월 100% — 딥카스 월 3~5곳 · 니어닥 2개월 400곳(유료 50%+) · 실손24 5개월 26% · 합계 4.87개월분(종전 5.84)",
    "Ins": "리드라우팅 설계보고서 P1 파일럿 8주(4~5월 강남 300건) → P2 12주(수도권 7개 지역단 ≈ 물량 55%) → P3 8월 말 전국 · 신규 권역 성숙 0.5/0.75/0.9/1(금융위 비교·추천 주간 추이) · 조사 계수에서 회원 증가분(m/12)을 뺀 값 · 대표 지시 2026-09-16로 2027 반영률은 1(실제 12만 건), 이 계수는 월 배분에만 쓴다",
    "season": "국가 일반검진(연말 쏠림 · 12월 20% · 검증 보정) 50% + 민간 종합검진(일산병원 2018~19 · 12월 8%) 50% — 제휴 센터 12월 수용 한계 반영 · 매년 적용",
}
CARE_NOTE = {
    "careRate": "care_target_rate — 연말 회원의 1%/년이 돌봄 수요(리드) 발생(장기요양 인정자 123.5만 · 65세+ 20.3% 기반 도출 · 범위 0.5~1.6%)",
    "carePerCenter": "파트너 센터 규모 산정용 — 센터당 월 3건 연결 가능(요금과 무관 · 조사 가정)",
    "careFee": "care_fee_per_center_month — 센터당 월 30만(15만~50만) 정액 · 노인장기요양보험법 §35⑥ · 의료법 §27③ 때문에 건당 소개료·수익배분 금지, 광고 표기 · 비유료 센터 노출 병행, 법률의견 필요",
    "careCost": "헬스케어 서비스 원가율 5% 준용(파트너 관리·정산)",
}
REV_PLAN_NOTE = {
    "sub": "3월 과금 개시(대표 지시 2026-09-16) · 연말 유료 기관 중 그 달 과금 비중 0.08→1(합 4.87개월분) · 2028~ 유형별 유료 기관 직선 경로 · 병원 50만은 선도 EMR(9만)의 5.6배 — 정액 SaaS·광고로만(환자 흐름 대가 금지)",
    "chk": "4월 개시 · 0.25→1(5개월) × 검진 계절(연말 쏠림) · 검진기관 건당 수수료 구조는 의료법 §27③ 검토 필요(조사 지적)",
    "resv": "골프·시설 예약 — 검진 예약 × 배수라 4월 개시 · 회원 기준(검진 계절 없음)",
    "ins": "대표 지시 2026-09-16 — 2027 공급은 실제 12만 건(연 환산 = 반영, 가정 ⑤-2 전량 반영 = 1) · 월 배분만 파일럿 일정(4~5월 파일럿 → 6~8월 수도권 → 8월 말 전국) · 우대 단가 5만 고정 · 조사상 2027 적정 1.4만~5.5만 건(중간 3만)보다 크므로 공급 계약 근거 첨부 필요 · 보험업법 §99① 법률의견 전제",
    "commerce": "7월 개시 · 재구매 코호트 램프 × 회원 증가 보정 0.28→0.78 · **2027은 대표 지시 2026-09-16로 실제 가동 기간을 고려해 보수적으로 30% 감액(반영률 ×0.70 · 가정 ⑤-2)** · 2028~2031 성숙 0.84·0.88·0.91·0.93 · 카드·PG 같은 달 입금",
    "care": "7월 개시 · 센터당 월 30만 정액 × 파트너 센터(연말 회원×1%÷12÷3) · 30%→12개월 100%(2028 성숙 0.93)",
    "svc": "고객 수수료 0(대표 지시) — 매출 없음",
}
REV_ADOPT = {
    "checkup_month_share": ([0.015, 0.031, 0.055, 0.075, 0.088, 0.083, 0.082, 0.082, 0.065, 0.099, 0.125, 0.2], "가정 ⑤-2 계절 지수의 50%(검증 보정값)"),
    "private_checkup_season": ([0.0411, 0.0384, 0.0626, 0.0966, 0.0865, 0.0911, 0.1072, 0.1008, 0.0766, 0.1071, 0.1112, 0.0808], "가정 ⑤-2 계절 지수의 50%"),
    "checkup_q4_share": (None, "참고 — 반영 계절 지수 4분기 36%"),
    "new_service_ramp": ([0, 0, 0, 0.25, 0.45, 0.65, 0.8, 0.9, 1, 1, 1, 1], "가정 ⑤-2 검진·예약 개시 계수"),
    "checkup_2027_monthly_allocation": (None, "참고 — 양식은 월말 회원 기준이라 모양만 비교"),
    "checkup_national_volume_2024": (None, "참고"), "checkup_cum_anchors_national": (None, "참고"),
    "checkup_season_nhis_cohort": (None, "참고"), "checkup_month_share_ilsan_general": (None, "참고"),
    "care_target_rate": (0.01, "가정 ④ 재가·돌봄 수요 발생률"), "care_match_rate": (None, "미채택 — 요금 기준 아님(성과 지표)"),
    "care_fee_structure": ("센터당 월 정액", "가정 ④ — 건당 소개료·수익배분 없음"),
    "care_fee_per_center_month": (300000, "가정 ④ 파트너 월 이용료"),
    "care_fee_per_match_equivalent": (None, "참고 — 요금 기준으로 쓰지 않음"),
    "care_partner_centers": (None, "참고 — 양식 산출 2027 연 환산 92곳"),
    "care_ramp": (12, "가정 ⑤-2 돌봄 개시 계수 30%→12개월"), "care_revenue_2027_2031": (None, "비교 — 매출계획 시트"),
    "ltc_recognized_and_home_care_2025": (None, "참고"), "private_caregiving_market": (None, "참고"),
    "commerce_ramp_6m": ([0.28, 0.47, 0.59, 0.68, 0.74, 0.78], "가정 ⑤-2 커머스 개시 계수 — 권고 램프(0.28~0.92)에 회원 증가 코호트 보정 · 2028~ 성숙 계수도 같은 모형"),
    "health_food_month_index": (None, "미채택 — 폭 0.94~1.08로 작아 커머스는 회원 가중 배분"),
    "health_food_month_index_2027_calendar": (None, "참고"), "gift_heavy_month_index_agri": (None, "참고"),
    "sports_leisure_month_index_2025": (None, "참고"), "food_bev_online_market_2025": (None, "참고"),
    "repeat_buildup": (None, "개시 계수 산출에 사용"), "hff_online_channel_share": (None, "참고"),
    "seasonality_recommendation": (None, "미채택(균등 허용 범위)"),
    "inst_ramp_12m": ([0.08, 0.13, 0.19, 0.26, 0.33, 0.41, 0.5, 0.59, 0.68, 0.78, 0.89, 1], "가정 ⑤-2 구독 개시 계수"),
    "trial_months": (None, "무료 기간은 준비기간 안에"),
    "emr_price_benchmark": (None, "비교 — 병원 50만 · 약국 20만(대표 지시)은 상단"), "ai_addon_price_benchmark": (None, "비교"),
    "plan_fee_ratio_vs_benchmark": (None, "⚠ 요금 근거 보강 필요"), "plan_count_penetration": (None, "참고"),
    "churn_benchmark": (None, "미반영 — 기관 이탈 0(모델)"), "trial_to_paid_conversion": (None, "참고"),
    "bench_deepcars_billing_hospitals": (None, "참고"), "bench_vitalcare_hospitals": (None, "참고"), "bench_cloud_emr_clinics": (None, "참고"),
    "bench_doctornow_partners": (None, "참고"), "bench_pm20_conversion_pace": (None, "참고"), "clinic_emr_market_share": (None, "참고"),
    "pharmacy_claim_sw_share": (None, "참고"),
    "ins_ramp_9m": ([0.06, 0.1, 0.28, 0.41, 0.6, 0.81, 0.92, 0.98, 1], "가정 ⑤-2 사용료 개시 계수(4~12월) — 조사 계수 ÷ 회원 지수(m/12)"),
    "launch_backloading_fsc": (None, "참고"), "toss_partner_ramp": (None, "참고"),
    "s_required_for_120k": (None, "⚠ 연 환산 12만 건은 조사상 과대 — 양식 2027 반영 건수와 대조"),
    "ins_2027_supply_plausible": (None, "비교 — 양식 2027 반영 37,632건 · 조사 중간 3만"), "ins_2027_revenue_implied": (None, "비교"),
    "db_price_benchmark": (None, "비교 — 우대 5만은 시장 하단"), "db_price_scheduled_tier": (None, "참고"),
    "price_pressure_2026_2027": (None, "참고"), "regulatory_gate": (None, "⚠ 유료 공급 전 법률의견(보험업법 §99①)"),
    "platform_fee_benchmark_comparison": (None, "참고"), "platform_lead_scale_toss": (None, "참고"),
}


def member_ends(P, y):
    """y(0부터) 연차 월말 누적 회원 — 전년 말 + 연내 순증×램프 누적(엑셀 월별예산 endM 행과 같은 순서)"""
    me = P["membersEnd"][y]; mp = 0 if y == 0 else P["membersEnd"][y - 1]
    new = max(0, me - mp)
    ramp = P["m1Ramp"] if y == 0 else [1] * 12
    rs = sum(ramp)
    adds = [new / 12 if rs == 0 else new * r / rs for r in ramp]
    ends = []; c = mp
    for x in adds:
        c += x; ends.append(c)
    return ends, me


def member_weights(P, y):
    """월별 회원 가중 w = 월말 누적 회원 ÷ 연내 월말 회원 합"""
    ends, _ = member_ends(P, y)
    W = sum(ends)
    return [1 / 12 if W == 0 else e / W for e in ends]


def season_norm(P):
    s = P["chkSeason"]; S = sum(s)
    return [1.0] * 12 if S == 0 else [v * 12 / S for v in s]


def paid_count(P, t, y):
    cnt = {"centers": P["checkupCenters"], "hospitals": P["hospitals"], "pharmacies": P["pharmacies"]}[t][y]
    return math.floor(cnt * P["subPaidRate"] + 0.5)


def sub_type_eff(P, t, y):
    """기관 유형 t의 연 반영률 — 2027은 구독 개시 계수 합/12, 월별 누적의 2028~는 전년 말→연말 유료 기관 직선 경로의 연평균 ÷ 연말, 연말 기준은 1"""
    mode = P.get("revMode", 2)
    if y == 0:
        return stream_weights(P, 0, "Sub")[2]
    if mode != 2:
        return 1
    cur = paid_count(P, t, y); prev = paid_count(P, t, y - 1)
    return 0 if cur == 0 else prev / cur + (1 - prev / cur) * 78 / 144


def stream_weights(P, y, key):
    """(월 기준 b, 개시 반영 g = b×개시 계수, 연 반영률 eff, 월 배분 a = g÷Σg)
    2027(및 월별 누적 방식의 2028~): 회원 연동 줄 b = 월말 회원 ÷ 연말 회원 ÷ 12(×검진 계절) · 구독 b = 1/12(2027) 또는 회원 비율/12
    연말 기준 방식의 2028~: eff = 1(연말 회원 × 연간 단가 그대로), 월 배분만 회원 가중(×계절) · 구독은 균등"""
    basis = dict((k, b) for k, _, b in STREAMS)[key]
    mode = P.get("revMode", 2)
    ends, me = member_ends(P, y)
    w = member_weights(P, y)
    S = season_norm(P) if basis == "season" else [1.0] * 12
    k = [0.0 if me == 0 else e / me for e in ends]
    stock = (y == 0 or mode == 2)
    if basis == "flat" and not (y == 0 or mode != 2):
        # 월별 누적 2028~: 유형별 유료 기관이 전년 말에서 연말까지 직선으로 늘어나는 경로 × 유형별 연 구독료 비중
        full = {t: paid_count(P, t, y) * fee(P, t, y) * 12 for t in TYPES}
        S = sum(full.values())
        b = []
        for m in range(12):
            num = 0.0
            for t in TYPES:
                cur = paid_count(P, t, y); prev = paid_count(P, t, y - 1)
                kt = 0 if cur == 0 else (prev + (cur - prev) * (m + 1) / 12) / cur
                num += full[t] * kt
            b.append(0 if S == 0 else num / 12 / S)
    elif basis == "flat":
        b = [1 / 12] * 12
    elif stock:
        b = [k[m] * S[m] / 12 for m in range(12)]
    else:
        ws = [w[m] * S[m] for m in range(12)]; T = sum(ws)
        b = w if T == 0 else [v / T for v in ws]
    F = P["startF"][key] if y == 0 else [P.get("matureY", {}).get(key, [1] * 5)[y]] * 12
    g = [b[m] * F[m] for m in range(12)]
    G = sum(g)
    eff = 1 if (y > 0 and mode != 2) else G
    if key == "Ins" and y == 0 and P.get("insFullY1", 0) == 1:
        eff = 1.0                                      # 2027 사용료는 연 환산 = 실제 공급(대표 지시) · 월 배분 a만 파일럿 일정을 따른다
    if key == "P" and y == 0:
        eff *= P.get("prodAdjY1", 1.0)                 # 2027 제품판매 기간 보정(대표 지시 — 보수적으로 30% 감액) · 월 배분 a는 그대로
    a = w if G == 0 else [v / G for v in g]
    return b, g, eff, a


def xround(x):
    """엑셀 ROUND(x,0)과 같게 — 십진수로 .5인데 이진수로 조금 모자라는 경우까지 올림"""
    return math.floor(round(x, 7) + 0.5)


def fee(P, t, y):
    """유형 t의 y(0부터) 연차 월 구독료 — 개시 연차 전 0원, 개시 후 기본×(1+인상률)^MAX(0,연차−2) + 정액×MAX(0,연차−2), 반올림, 상한
    (인상 기산은 2차연도(2028) 그대로 — 2027에 개시하는 병원·약국은 2027·2028 모두 기본료)"""
    start = P.get("subStartYear", {}).get(t, 2)
    if y + 1 < start:
        return 0
    k = max(0, y - 1)
    v = P["subFeeBaseT"][t] * (1 + P["subFeeRateT"][t]) ** k + P["subFeeStepT"][t] * k
    return min(P["subFeeCap"], xround(v))


def own_share(P, y):
    """y(0부터) 연차 자사운영 비율 — 1차 비율 + 상승폭×(연차−1), 상한 100%"""
    return min(1.0, round(P["chkOwnShareY1"] + P["chkOwnShareStep"] * y, 6))


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
