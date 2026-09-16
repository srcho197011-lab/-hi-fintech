# -*- coding: utf-8 -*-
"""하이젠케어 전략적 투자요청서 — 투자금 산정·세부 예산 양식 생성기 v3.0
재현 순서(저장소 루트에서):
  1) node scripts/invest/fin_dump.mjs . scripts/invest/_fin.json          # finModel.js 기본값 덤프
  2) python scripts/invest/gen_budget.py scripts/invest/_fin.json docs/invest/하이젠케어_투자금산정_예산양식_v3.0.xlsx
  3) 엑셀로 열어 전체 재계산 후 저장(수식 값 캐시)
  4) python scripts/invest/verify_budget.py docs/invest/하이젠케어_투자금산정_예산양식_v3.0.xlsx   # 독립 정답지(oracle·oracle3) 대조 — 종료코드 0이어야 한다
docs/invest/ 는 .gitignore 대상(대외비)이라 산출물은 커밋되지 않고 이 생성기만 남는다."""
import json, sys, re
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.comments import Comment

FIN = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
import os as _os
sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import adjust
P = adjust.apply(FIN["P"])
import costs as CS
STREAMS = adjust.STREAMS          # 매출 줄(개시 계수·월 배분 단위) — adjust.py
C2 = P["cost2"]      # 대표 조정(약국 1차 200곳 · 기관별 구독료 · 검진 채널 분리 · 서비스 고객 수수료 0 · 헬스메이트센터 사용료) — adjust.py 한 곳에서
Y5 = FIN["years"]                 # finModel.js 원래 값(대조용 스냅샷)

FONT = "맑은 고딕"
BLUE = Font(name=FONT, size=10, color="0000FF")
BLACK = Font(name=FONT, size=10, color="000000")
GREEN = Font(name=FONT, size=10, color="008000")
BOLD = Font(name=FONT, size=10, bold=True)
TITLE = Font(name=FONT, size=15, bold=True, color="1A2B4A")
SUB = Font(name=FONT, size=10, color="555555")
HDR = Font(name=FONT, size=10, bold=True, color="FFFFFF")
YELLOW = PatternFill("solid", fgColor="FFFF00")
NAVY = PatternFill("solid", fgColor="1A2B4A")
SEC = PatternFill("solid", fgColor="E8EEF7")
TOT = PatternFill("solid", fgColor="F3F4F6")
KEY = PatternFill("solid", fgColor="FFF4CC")
THIN = Side(style="thin", color="C8CED8")
BTOP = Border(top=Side(style="thin", color="1A2B4A"))

F_WON = '#,##0;(#,##0);"-"'
F_MIL = '#,##0,,;(#,##0,,);"-"'          # 원을 백만원으로 표시
F_CNT = '#,##0;(#,##0);"-"'
F_PCT = '0.0%;(0.0%);"-"'
F_RATE = '0.00%'

wb = Workbook()
YRS = ["2027년(1차)", "2028년(2차)", "2029년(3차)", "2030년(4차)", "2031년(5차)"]
YC = ["D", "E", "F", "G", "H"]            # 연차 열(가정·인력계획·연간손익 공통)


def cell(ws, ref, v, font=BLACK, fmt=None, fill=None, bold=False, align=None, comment=None):
    c = ws[ref]
    c.value = v
    f = font
    if bold:
        f = Font(name=f.name, size=f.size, bold=True, color=f.color)
    c.font = f
    if fmt:
        c.number_format = fmt
    if fill:
        c.fill = fill
    if align:
        c.alignment = align
    if comment:
        c.comment = Comment(comment, "하이핀")
    return c


def header_row(ws, r, labels, start_col=1, fill=NAVY):
    for i, t in enumerate(labels):
        c = ws.cell(row=r, column=start_col + i, value=t)
        c.font = HDR
        c.fill = fill
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def section(ws, r, text, ncols):
    for col in range(1, ncols + 1):
        ws.cell(row=r, column=col).fill = SEC
    c = ws.cell(row=r, column=1, value=text)
    c.font = Font(name=FONT, size=10, bold=True, color="1A2B4A")


# ══════════════════════════════════════ 가정 ══════════════════════════════════════
A = wb.active
A.title = "가정"
cell(A, "A1", "가정 — 연차별 드라이버", TITLE)
cell(A, "A2", "파란 글씨 = 입력값 · 노란 칸 = 투자금에 영향이 큰 핵심 가정 · 기본값은 finModel.js(FIN_P_DEFAULT) 확정값 + 대표 조정(adjust.py · 근거 열 「대표 지시」 표기) + 판관비 근거 모델(costs.py · 비용근거 시트)", SUB)
header_row(A, 4, ["구분", "항목", "단위"] + YRS + ["근거 · 출처"])
AR = {}   # key -> row
r = 5

SRC = "finModel.js FIN_P_DEFAULT"
START_NOTE = getattr(adjust, "START_NOTE", {})     # 개시 계수·계절 지수 근거(adjust.py · 매출근거 시트)
REV_PLAN_NOTE = getattr(adjust, "REV_PLAN_NOTE", {})
REV_ADOPT = getattr(adjust, "REV_ADOPT", {})
V22_REV = [20561529400, 178938000000, 470272000000, 932008000000, 1586486400000]   # v2.2 매출액 합계(원) — oracle 스냅샷 2026-09-15
CARE_NOTE = getattr(adjust, "CARE_NOTE", {})


def put(key, label, unit, vals, fmt, note, key_assump=False, grp=""):
    global r
    cell(A, f"A{r}", grp, BOLD if grp else BLACK)
    cell(A, f"B{r}", label)
    cell(A, f"C{r}", unit, SUB)
    if isinstance(vals, list):
        for i, v in enumerate(vals[:5]):
            cell(A, f"{YC[i]}{r}", v, BLUE, fmt, YELLOW if key_assump else None)
    else:
        cell(A, f"D{r}", vals, BLUE, fmt, YELLOW if key_assump else None)
        for i in range(1, 5):
            A[f"{YC[i]}{r}"].fill = TOT
    cell(A, f"I{r}", note, SUB)
    AR[key] = r
    r += 1


def gap(title):
    global r
    r += 1
    section(A, r, title, 9)
    r += 1


gap("① 회원 · 이용")
put("membersEnd", "연말 회원(누적, 이탈 차감 후 순증 기준)", "명", P["membersEnd"], F_CNT, SRC + " membersEnd · 형 확정", True)
put("activeAbs", "하이핀 경유 검진 예약(연 · 연말 회원 기준 연 환산)", "건", P["activeAbs"], F_CNT, SRC + " activeAbs · 형 확정 2026-08-20 · 실제 반영은 ⑤-2 개시 계수·산정 방식을 거친 연간손익 「검진 예약(반영)」")
put("mktConsent", "마케팅(보험 안내) 동의 회원(누적)", "명", P["mktConsentEnd"], F_CNT, SRC + " mktConsentEnd · 형 확정 2026-08-20")
put("churn", "연간 회원 이탈률", "%", P["churn"], F_PCT, SRC + " churn — 총가입 필요량 산출용")

gap("② 제휴 기관 · AI 플랫폼 구독(EMR·UIP)")
put("centers", "검진센터(연말)", "곳", P["checkupCenters"], F_CNT, SRC + " checkupCenters")
put("hospitals", "병원(연말)", "곳", P["hospitals"], F_CNT, SRC + " hospitals")
put("pharmacies", "약국(연말)", "곳", P["pharmacies"], F_CNT, "1차 200곳 — 대표 지시 2026-09-14(모델 500곳) · 2~5차 모델값 · 5차 = 전국 약국 25,047곳(2024 심평원)의 48%")
put("subBase_c", "구독료 — 검진센터 월 기본(개시~2028)", "원/월", P["subFeeBaseT"]["centers"], F_WON, "대표 지시 2026-09-14 · 검진센터는 2027 무료(시장 선점) · 인상은 2029부터", True)
put("subBase_h", "구독료 — 병원 월 기본(개시~2028)", "원/월", P["subFeeBaseT"]["hospitals"], F_WON, "대표 지시 2026-09-14 · 대표 지시 2026-09-15: 병원·약국 진료 연계 매출(구독) 2027부터 · 인상 기산은 2029 그대로", True)
put("subBase_p", "구독료 — 약국 월 기본(개시~2028)", "원/월", P["subFeeBaseT"]["pharmacies"], F_WON, "대표 지시 2026-09-14 · 2027부터 과금(대표 지시 2026-09-15) · 20% 복리 인상은 2029부터", True)
put("subStep_c", "구독료 — 검진센터 연 인상폭", "원/월", P["subFeeStepT"]["centers"], F_WON, "모델 구조 유지(매년 +50만) · 0이면 고정 요금")
put("subStep_h", "구독료 — 병원 연 인상폭", "원/월", P["subFeeStepT"]["hospitals"], F_WON, "모델 구조 유지(매년 +50만) · 0이면 고정 요금")
put("subStep_p", "구독료 — 약국 연 인상폭(정액)", "원/월", P["subFeeStepT"]["pharmacies"], F_WON, "0 — 약국은 아래 인상률(20%)로 올린다")
put("subRate_c", "구독료 — 검진센터 연 인상률", "%", P["subFeeRateT"]["centers"], F_PCT, "0이면 정액 인상폭만 적용")
put("subRate_h", "구독료 — 병원 연 인상률", "%", P["subFeeRateT"]["hospitals"], F_PCT, "0이면 정액 인상폭만 적용")
put("subRate_p", "구독료 — 약국 연 인상률(복리)", "%", P["subFeeRateT"]["pharmacies"], F_PCT, "대표 지시 2026-09-14 — 매년 20% 복리 인상", True)
put("subStart_c", "구독 개시 연차 — 검진센터(1=2027 · 2=2028)", "연차", P["subStartYear"]["centers"], "0", "2 — 2027 무료 유지(대표 지시 2026-09-14)")
put("subStart_h", "구독 개시 연차 — 병원", "연차", P["subStartYear"]["hospitals"], "0", "1 — 대표 지시 2026-09-15 「병원·약국 진료수수료 매출은 2027년부터」를 AI 플랫폼 구독(EMR·UIP)으로 반영 · 환자 소개 대가는 의료법 §27③ 금지라 정액 구독 구조", True)
put("subStart_p", "구독 개시 연차 — 약국", "연차", P["subStartYear"]["pharmacies"], "0", "1 — 대표 지시 2026-09-15", True)
put("subCap", "구독료 — 상한(공통)", "원/월", P["subFeeCap"], F_WON, "월 300만 한도")
put("subPaid", "유료 전환 기관 비율", "%", P["subPaidRate"], F_PCT, SRC + " subPaidRate · 기관 이탈은 모델에 없음(0) — 검증보고서 v1.1 D4")
put("subCost", "구독 운영 원가율(클라우드·연동)", "%", P["subCostRate"], F_PCT, SRC + " subCostRate")

gap("③ 제품판매(건강쇼핑 · GMV 총액 인식)")
put("buyerRate", "구매 회원 비율", "%", P["productBuyerRate"], F_PCT, SRC + " productBuyerRate")
put("capture", "지갑 점유율(플랫폼 포착률)", "%", P["productCapture"], F_PCT, "기존 채널(오픈마켓·약국·마트) 병행 감안 70% 보수화")
put("ramp", "제품 가동률(연차별)", "%", P["productRamp"], F_PCT, "2027 = 100% — v2.2까지의 1차 가동률 1/3(형 확정 2026-09-07)은 ⑤-2 월별 개시 계수(7월부터, 대표 지시 2026-09-15)로 대체")
cats = P["productCats"]
for c in cats:
    put("arpu_" + c["key"], f"{c['label']} — 구매회원 1인 연 지출", "원/년", c["arpu"], F_WON, SRC + " productCats.arpu")
for c in cats:
    put("cost_" + c["key"], f"{c['label']} — 원가율", "%", c["cost"], F_PCT, SRC + " productCats.cost")
put("payRate", "결제 대행 수수료율(제품매출 대비)", "%", P["paymentRate"], F_RATE, SRC + " paymentRate")
put("rewardRate", "포인트(토큰) 적립률 — 제품마진 대비", "%", P["rewardRate"], F_PCT, "대표 지시 2026-09-16 — 적립 60%(종전 50%) · 제품마진에만 적용(원칙)", True)
put("donationRate", "기부금(치료비 나눔) — 제품마진 대비", "%", P["donationRate"], F_PCT, "대표 지시 2026-09-16 — 나눔 15%(종전 30%) · 제품마진에만 적용(원칙)", True)

gap("④ 검진 연계(자사운영 · 타사 제휴) · 헬스케어 서비스 · 예약")
put("chkOwnFee", "검진안내 자사운영 — 건당 매출", "원/건", P["chkOwnFee"], F_WON, "대표 지시 2026-09-14 · 모델은 채널 구분 없이 2.5만", True)
put("chkOwnCost", "검진안내 자사운영 — 3종 서비스 원가(검진대비보험·AI 리포트·케어 키트)", "원/건", P["chkOwnCost"], F_WON, "대표 지시 2026-09-14 · 건당 2만원 이내 유지")
put("chkPtnFee", "검진안내 타사 제휴(인피니티 등) — 건당 매출", "원/건", P["chkPtnFee"], F_WON, "대표 지시 2026-09-14 · 원가(2만)보다 낮음 — 회원 확보 장치", True)
put("chkPtnCost", "검진안내 타사 제휴 — 3종 서비스 원가", "원/건", P["chkPtnCost"], F_WON, "대표 지시 2026-09-14 · 자사와 같은 3종 제공")
put("chkOwnY1", "자사운영 비율 — 2027(1차 · 나머지는 타사 제휴)", "%", P["chkOwnShareY1"], F_PCT, "대표 확정 2026-09-14 · 1차 자사 20% : 타사 80%", True)
put("chkOwnStep", "자사운영 비율 — 연 상승폭(%p · 상한 100%)", "%", P["chkOwnShareStep"], F_PCT, "대표 확정 2026-09-14 — 20%에 매년 15%p를 더해 20→35→50→65→5차 80%(복리 아님)", True)
put("svcRate", "헬스케어 서비스 이용률(회원 대비 · 운영 지표)", "%", P["serviceRate"], F_PCT, SRC + " serviceRate")
put("svcFee", "헬스케어 서비스 — 고객 수수료", "원/명", P["serviceCommission"], F_WON, "0 — 대표 지시 2026-09-14: 검진 후 헬스케어 서비스는 고객 매출 없음, 병원·검진센터·약국 구독료로 받는다(모델 1.5만)")
put("svcCost", "헬스케어 서비스 원가율", "%", P["serviceCostRate"], F_PCT, SRC + " serviceCostRate")
put("resvPer", "예약 건수(검진 예약 1건당)", "건", P["resvPerActive"], '0.0', SRC + " resvPerActive")
put("resvFee", "예약 서비스 — 건당 수수료", "원/건", P["resvFee"], F_WON, "골프·시설 예약 건당 1만")
put("careRate", "재가·돌봄 수요(리드) 발생률(연말 회원 대비 · 연)", "%", P["careRate"], '0.00%', CARE_NOTE.get("careRate", ""), True)
put("carePerCenter", "파트너 센터 규모 — 센터당 월 연결 가능 수요(요금과 무관)", "건/곳·월", P["carePerCenter"], "0.0", CARE_NOTE.get("carePerCenter", ""))
put("careFee", "재가·돌봄 파트너 월 이용료(센터당 정액 · 제휴 돌봄기관 부담)", "원/곳·월", P["careFee"], F_WON, CARE_NOTE.get("careFee", ""), True)
put("careCost", "재가·돌봄 연계 원가율(매칭·정산 운영)", "%", P["careCostRate"], F_PCT, CARE_NOTE.get("careCost", "헬스케어 서비스 원가율 5% 준용"))

gap("⑤ 헬스메이트센터 사용료 — 동의 DB 공급 대가(전략적 투자자 우대 단가 · 한도 초과분 시가)")
put("insConv", "동의 DB 연간 공급 집행률(계약 전환율 아님)", "%", P["insConvRate"], F_PCT,
    "형 확정 2026-08-20 · 누적 동의 전체에 매년 적용 = 기존 동의자 재공급 전제(5년 786만 건 > 누적 동의 630만) · 하락 폭이 가장 불확실한 변수 — v3.0 기본값에서 집행률 −20%는 필요 총자금 A +3.4 · B +6.9억(급여 +20%는 +4.3~6.0억, 광고 단가 전체 +20%는 +6.5~11.9억) · 2027은 개시 일정으로 3.8만 건만 반영(조사 적정 1.4만~5.5만) · 검증보고서 v1.1 B3 라벨 권고 반영", True)
put("hmInvest", "전략적 투자금(현대해상 · 우대 조건 기준)", "원", P["hmInvest"], F_WON, "대표 지시 2026-09-14 — 투자금에 맞춰 아래 우대 단가·한도를 손으로 조절(자동 연동 없음) · 투자금 대비 할인 배수 산출에 쓰임", True)
put("hmMarket", "DB 건당 시가", "원/건", P["hmMarket"], F_WON, "대표 지시 2026-09-14 — 시가 10만원 가정 · 우대 한도를 넘는 공급 건에 적용(모델 보험 중개는 건당 7만)", True)
put("hmRate1", "우대 단가 — 2027(1차 · 시가 대비)", "%", P["hmRate1"], F_PCT, "대표 지시 2026-09-14 — 시가의 50% = 건당 5만원", True)
put("hmPriceStep", "우대 단가 — 연 인상폭", "원/건", P["hmPriceStep"], F_WON, "대표 지시 2026-09-16 — 5년 내내 건당 5만원 고정(인상 없음) · 시가를 넘지 않음", True)
put("hmCap1", "우대 한도 — 2027(1차)", "건", P["hmCap1"], F_CNT, "초년도 1년간 10만 건 — A는 달력 연도(2027-01~12), B·C는 오픈 기준 연차(2027-03~2028-02) · 2027 반영 공급은 3.8만 건이라 한도가 남는다", True)
put("hmCapStep", "우대 한도 — 연 증가", "건", P["hmCapStep"], F_CNT, "매년 +10만 건(10→20→30→40→50만) · 한도는 연도마다 새로 시작, 연내 누적 순서대로 적용")


gap("⑤-2 매출 개시 일정 — 2027년 월별 개시 계수(0~1) · 검진 계절 지수 · 매출 산정 방식(대표 지시 2026-09-15 · 매출근거 시트)")
put("insFullY1", "2027 헬스메이트센터 공급 — 전량 반영(1 = 연 환산 = 실제 공급)", "선택", P.get("insFullY1", 0), "0",
    "대표 지시 2026-09-16 — 2027년 현대해상 공급 DB는 연 환산이 아니라 실제 12만 건. 1이면 반영률 100%, 월 배분만 파일럿 일정(4월 개시)을 따른다. 0이면 개시 계수대로 반영", True)
put("revMode", "매출 산정 방식(2028~2031)", "선택", P["revMode"], "0", "2 = 월별 누적(월말 회원 ÷ 연말 회원 × 연간 단가 ÷ 12를 달마다 더함 — 세밀 · 기본) · 1 = 연말 기준(연말 회원 × 연간 단가 — 사업계획서·IM 방식) · 2027은 둘 다 월별 누적", True)
cell(A, f"A{r}", "", BOLD); cell(A, f"B{r}", "매출 줄 — 2027년 월별 개시 계수(1 = 그 달 잠재 매출 전부)", BOLD); cell(A, f"C{r}", "월 기준", BOLD)
for m_ in range(12):
    cell(A, f"{CL(4 + m_)}{r}", f"2027-{m_+1:02d}", BOLD, align=Alignment(horizontal="center"))
cell(A, f"P{r}", "근거 · 대표 지시", BOLD)
for col in range(1, 17):
    A.cell(row=r, column=col).fill = SEC
AR["F_hdr"] = r
r += 1
BASIS_LABEL = {"member": "회원", "season": "회원×검진 계절", "flat": "기관(균등)"}
for sk_, sl_, sb_ in STREAMS:
    cell(A, f"B{r}", sl_)
    cell(A, f"C{r}", BASIS_LABEL[sb_], SUB)
    for m_ in range(12):
        cell(A, f"{CL(4 + m_)}{r}", P["startF"][sk_][m_], BLUE, "0.00", YELLOW)
    cell(A, f"P{r}", START_NOTE.get(sk_, ""), SUB)
    AR["F_" + sk_] = r; r += 1
cell(A, f"B{r}", "검진 월별 계절 지수(매년 · 합계로 평균 1 환산)")
cell(A, f"C{r}", "지수", SUB)
for m_ in range(12):
    cell(A, f"{CL(4 + m_)}{r}", P["chkSeason"][m_], BLUE, "0.00")
cell(A, f"P{r}", START_NOTE.get("season", ""), SUB)
AR["season"] = r; r += 1
header_row(A, r, ["", "2028~2031 성숙 계수(연 · 월별 누적 방식에서만 · 0~1)", ""] + YRS, 1, SEC)
for col in range(1, 9):
    A.cell(row=r, column=col).font = BOLD
cell(A, f"P{r}", "커머스 — 회원이 계속 늘어 재구매가 덜 쌓인 코호트가 섞임(2027과 같은 코호트 모형: 0.84·0.88·0.91·0.93) · 돌봄 — 12개월 램프의 2028 잔여(0.93) · 나머지 1", SUB)
r += 1
for sk_, sl_, sb_ in STREAMS:
    cell(A, f"B{r}", f"성숙 계수 — {sl_}")
    cell(A, f"D{r}", "2027은 위 월별 계수", SUB)
    for i_ in range(1, 5):
        cell(A, f"{YC[i_]}{r}", P["matureY"].get(sk_, [1] * 5)[i_], BLUE, "0.00", YELLOW if P["matureY"].get(sk_) else None)
    AR["M_" + sk_] = r; r += 1
cell(A, f"B{r}", "월 기준 — 회원: 월말 회원 ÷ 연말 회원 ÷ 12 · 회원×검진 계절: 여기에 계절 지수를 곱함 · 기관(균등): 2027은 1/12(개시 계수 = 연말 유료 기관 중 그 달 과금 비중) · 2028부터는 산정 방식을 따름", SUB); r += 1
cell(A, f"B{r}", "연 반영률 = Σ(월 기준 × 개시 계수) → 연간손익 매출 = 연말 기준 연간 매출 × 반영률 · 월별예산은 (월 기준 × 개시 계수) 비중대로 편다", SUB); r += 1

gap("⑥ 마케팅 — 회원확보 5대 엔진 광고비(회원확보 사업계획서 v12.1의 방법대로 산출)")
put("mk1Target", "① 메디에이지 — 분기별 검진 도래 안내 대상", "명/분기", C2["mk1Target"], F_CNT, "사업계획서 v12.1 p4 — 결과리포트 수신 500만 중 분기별 검진 대상 약 150만(내부 추정) · 발송업체 복제 확대 시 2차부터 늘릴 것", True)
put("mk1Times", "① 대상자 1인당 분기 발송 횟수", "회", C2["mk1Times"], "0", "p4 — 월 1회 · 분기 3회 내외(쿨다운·수신거부 준수)")
put("mk1Unit", "① 안내 발송 단가(광고성 메시지)", "원/건", C2["mk1Unit"], F_WON, CS.NOTE.get("mk1Unit", ""), True)
put("mk2Impr", "② 9채널 타겟 광고 — 1차 월 노출", "회/월", C2["mk2Impr"], F_CNT, "사업계획서 v12.1 p5 — 일 100만 · 월 3,000만 노출", True)
put("mk2Elast", "② 2차부터 노출 탄력성(순증 회원 대비)", "배", C2["mk2Elast"], "0.00", CS.NOTE.get("mk2Elast", ""))
header_row(A, r, ["", "② 9채널 — 예산 비중(사업계획서 p5)과 유효 CPM", "", "예산 비중", "유효 CPM(원/천회)", "", "", "", "근거"], 1, SEC)
for col in range(1, 10):
    A.cell(row=r, column=col).font = BOLD
r += 1
CHROW = {}
for k_, lab_, _ in CS.CHANNELS:
    cell(A, f"B{r}", lab_)
    cell(A, f"D{r}", C2["chShare"][k_], BLUE, F_PCT)
    if k_ != "naver":
        cell(A, f"E{r}", C2["chCpm"][k_], BLUE, F_WON)
    cell(A, f"I{r}", CS.NOTE.get("cpm_" + k_, ""), SUB)
    CHROW[k_] = r; r += 1
cell(A, f"B{r}", "예산 비중 합계(100%여야 함)"); cell(A, f"D{r}", f"=SUM(D{CHROW['youtube']}:D{CHROW['etc']})", BLACK, F_PCT)
AR["chShareSum"] = r; r += 1
put("naverCpc", "② 네이버 검색SA — 클릭당 단가(건강검진 키워드)", "원/클릭", C2["naverCpc"], F_WON, CS.NOTE.get("naverCpc", ""))
put("naverCtr", "② 네이버 검색SA — 클릭률", "%", C2["naverCtr"], F_RATE, CS.NOTE.get("naverCtr", ""))
cell(A, f"E{CHROW['naver']}", f"=D{AR['naverCpc']}*D{AR['naverCtr']}*1000", BLACK, F_WON)
cell(A, f"B{r}", "② 예산 가중 평균 CPM = 1 ÷ Σ(비중 ÷ CPM)", BOLD)
_shr = f"D{CHROW['youtube']}:D{CHROW['etc']}"; _cpr = f"E{CHROW['youtube']}:E{CHROW['etc']}"
cell(A, f"D{r}", f'=IF(COUNTIFS({_shr},">0",{_cpr},"<=0")+COUNTIFS({_shr},">0",{_cpr},"")>0,0,IFERROR(1/SUMPRODUCT({_shr},1/({_cpr}+({_cpr}=0))),0))', BLACK, F_WON, KEY, bold=True)
cell(A, f"I{r}", "채널별 노출 = 매체비×비중÷CPM×1,000 → 월 노출을 채우는 매체비 = 노출×가중 CPM÷1,000 · 비중 0인 채널은 빠짐 · 비중>0인데 CPM 0/빈칸이면 0(입력 점검 경고)", SUB)
AR["mk2Cpm"] = r; r += 1
put("videoN", "② 영상 소재 제작(시즌 프로모션)", "편/년", C2["videoN"], "0", "p4·p5 — 계절 프로모션 4시즌 · 채널별 광고 4종")
put("videoUnit", "② 영상 소재 1편 제작비(30초)", "원/편", C2["videoUnit"], F_WON, CS.NOTE.get("videoUnit", ""))
put("cardN", "② 카드뉴스·배너 소재", "세트/년", C2["cardN"], "0", "월 1세트")
put("cardUnit", "② 카드뉴스·배너 1세트 제작비", "원/세트", C2["cardUnit"], F_WON, CS.NOTE.get("cardUnit", ""))
put("cardAdMsgs", "② 카드사 제휴 — 검진센터 결제 고객 타겟 광고", "건", C2["cardAdMsgs"], F_CNT, "p5 협의 — 제휴 확정 시 입력(기본 0)")
put("cardAdUnit", "② 카드사 타겟 광고 단가", "원/건", C2["cardAdUnit"], F_WON, CS.NOTE.get("cardAdUnit", ""))
cell(A, f"B{r}", "③ 안내업체 제휴(인피니티케어·한신메디피아 → GC케어·에임메드·착한의사 등) — 광고비 0 · 무료 3종 임베드(원가는 검진 3종 원가) · 연동 개발은 ⑩ AI 시스템 도입비", SUB); r += 1
put("qrCenters", "④ 현장 QR 배치 검진센터(누적)", "곳", C2["qrCenters"], F_CNT, "회원확보 요약서 5개년 목표 — 제휴 검진기관 1차 250 · 3차 450 · 5차 650(2·4차 보간)", True)
put("qrKit", "④ 센터당 QR 키트(안내판·테이블 스탠드·배너)", "원/곳", C2["qrKit"], F_WON, CS.NOTE.get("qrKit", ""))
put("qrSticker", "④ 결과지 봉투 QR 스티커(검진 예약 1건당 1매)", "원/매", C2["qrSticker"], "#,##0.0", CS.NOTE.get("qrSticker", ""))
put("qrShare", "④ QR 현장 가입 비중(순증 회원 대비)", "%", C2["qrShare"], F_PCT, "p7 — 전환율·확보 건수는 파일럿으로 검증 · 기본 0")
put("qrFee", "④ 센터 연계 수수료(QR 가입 1건당)", "원/건", C2["qrFee"], F_WON, "p7 협의 — 기본 0")
cell(A, f"B{r}", "⑤ 기업·업체 B2B(마인드카페·허그인허그맘·제니엘 등) — 광고비 0 · 계약 영업은 인력 섹션이 수행", SUB); r += 1

gap("⑦ AI 시스템 · 데이터 · 클라우드 운영비")
put("maintRate", "AI 시스템 유지보수 — 누적 도입비 대비(연)", "%", C2["maintRate"], F_PCT, CS.NOTE.get("maintRate", ""), True)
put("dataMonth", "데이터 유지관리(DB 운영·표준화·백업·로그) — 1차 월", "원/월", C2["dataMonth"], F_WON, CS.NOTE.get("dataMonth", ""))
put("secMonth", "보안관제 — 월", "원/월", C2["secMonth"], F_WON, CS.NOTE.get("secMonth", ""))
put("cloudMonth", "클라우드 기본 환경(운영·이중화·백업·보안) — 월", "원/월", C2["cloudMonth"], F_WON, CS.NOTE.get("cloudMonth", ""), True)
put("cloudBaseMembers", "클라우드 기본 환경이 수용하는 회원 수", "명", C2["cloudBaseMembers"], F_CNT, CS.NOTE.get("cloudBaseMembers", ""))
put("opsElast", "데이터 유지관리의 증가 탄력성(연말 회원 대비)", "배", C2["opsElast"], "0.00", CS.NOTE.get("opsElast", ""))
put("cloudPerMember", "클라우드 증설 — 수용 회원을 넘는 평균 회원 1인당 월", "원/인·월", C2["cloudPerMember"], "#,##0.0", CS.NOTE.get("cloudPerMember", ""))
put("consultsPerMember", "AI 상담 — 평균 회원 1인당 연 상담 수", "회/년", C2["consultsPerMember"], "0.0", CS.NOTE.get("consultsPerMember", ""))
put("tokIn", "AI 상담 1회 — 입력 토큰", "토큰", C2["tokIn"], F_CNT, CS.NOTE.get("tokIn", ""))
put("tokOut", "AI 상담 1회 — 출력 토큰", "토큰", C2["tokOut"], F_CNT, CS.NOTE.get("tokOut", ""))
put("priceIn", "LLM API — 입력 100만 토큰 단가", "원", C2["priceIn"], F_WON, CS.NOTE.get("priceIn", ""))
put("priceOut", "LLM API — 출력 100만 토큰 단가", "원", C2["priceOut"], F_WON, CS.NOTE.get("priceOut", ""))
put("bcRecords", "블록체인 앵커링 — 1차 기록 건수", "건", C2["bcRecords"], F_CNT, "대표 지시 2026-09-14 — 100만 건 · 2차부터 연말 회원에 비례", True)
put("bcUnit", "블록체인 앵커링 — 건당 비용", "원/건", C2["bcUnit"], F_WON, "대표 지시 2026-09-14 — 1건 40원 · " + CS.NOTE.get("bcUnit", ""))

gap("⑧ 영업 · 관리(매출 연동)")
put("salesRate", "영업비(매출 대비 · 표준 요율)", "%", P["salesRate"], F_PCT, SRC + " salesRate")
put("adminRate", "관리비(매출 대비 · 표준 요율)", "%", P["adminRate"], F_PCT, SRC + " adminRate")
put("opexScale", "영업·관리비 스케일(AI 네이티브 운영)", "%", P["opexScale"], F_PCT, "하이 CS 흡수·AI 출수납 자동화로 표준 요율의 30%")

gap("⑨ 자산 · 금융 · 세금")
put("life", "내용연수(AI 시스템·장비·데이터 이용권)", "년", C2["life"], "0", "정액 상각 · 취득 연도는 반년만 상각", True)
put("interest", "연 이자비용", "원", P["interestYear"], F_WON,
    "대표 지시 2026-09-16 — 장기차입금 제외. finModel.js의 장기차입 20억 가정과 연 이자 8억(암묵 40%) 고정 상수를 뺐다(0). 차입을 실제로 일으키면 그 조건으로 채울 것", True)
put("tax", "법인세율", "%", P["taxRate"], F_PCT, "손실 연도에는 0(환급 없음) · 현금은 이듬해 3월 납부(2027분은 2026 준비기간 비용을 이월결손금으로 차감)")
put("wcRate", "운전자본 증가(매출 대비)", "%", 0.02, F_PCT, "finModel.js 하드코딩 0.02 — 연간 FCF 메모에만 사용(현금 시트는 회수 지연을 명시해 0)")

gap("⑩ CAPEX 세부 — 1차 AI 시스템 도입(섹션별) · 메디에이지 데이터 투자 · 2차부터 고도화·확장")
put("officePerHead", "사무 장비 — 신규 인원 1인당", "원/인", C2["officePerHead"], F_WON, CS.NOTE.get("officePerHead", ""))
AR["capexFirst"] = r
for k_, lab_ in CS.AI_MODULES:
    put("ai_" + k_, "AI 시스템 도입(1차) — " + lab_, "원", C2["aiModule"][k_], F_WON, CS.NOTE.get("ai_" + k_, ""))
put("aiCommon", "AI 공통 플랫폼(1차 — 데이터 레이크·통합 인증·LLMOps·보안 설계)", "원", C2["aiCommon"], F_WON, CS.NOTE.get("aiCommon", ""))
put("capexLater", "AI 시스템 고도화 · 확장(2차부터)", "원", C2["capexLater"], F_WON, "finModel.js capex(2차 20억 · 3~5차 50억) 유지 — 섹션 확장·트래픽 증설")
put("isms", "보안 인증(1차 — ISMS-P 등)", "원", C2["isms"], F_WON, CS.NOTE.get("isms", "") + " · 매년 사후심사 비용은 공식 근거가 없어 넣지 않음")
cell(A, f"B{r}", "사무 장비(신규 인원 × 단가)"); cell(A, f"C{r}", "원", SUB)
cell(A, f"I{r}", "인력계획 인원 증가분 × 1인당 단가", SUB)
AR["capex_office"] = r; r += 1
put("medi", "메디에이지 데이터 투자(1차 — 삭제됨)", "원", C2["mediInvest"], F_WON, "대표 지시 2026-09-16 — 20억 일시 투자 삭제. 제휴 DB를 2027-01부터 1년에 걸쳐 받고, 가입한 회원의 리포트만 건당 구매한다(⑩-2)", True)
cell(A, f"B{r}", "CAPEX 합계", BOLD)
for i in range(5):
    col = YC[i]
    cell(A, f"{col}{r}", f"=SUM({col}{AR['capexFirst']}:{col}{AR['medi']})", BLACK, F_WON, TOT, bold=True)
cell(A, f"I{r}", "1차 = 섹션별 AI 도입 + 공통 플랫폼 + 보안 + 장비 · 2차부터 고도화·장비(메디에이지 투자는 삭제)", SUB)
AR["capexTotal"] = r
r += 1

gap("⑩-2 메디에이지 제휴 백그라운드 DB — 2027-01부터 1년에 걸쳐 확보 · 가입한 회원의 리포트만 건당 구매(대표 지시 2026-09-16)")
put("mediDb", "제휴 DB 총량", "건", C2["mediDb"], F_CNT, "메디에이지 백그라운드 DB 500만 건 — 누적 구매 건수의 한도", True)
put("mediMonths", "확보 기간(2027-01부터)", "개월", C2["mediMonths"], "0", "12개월 균등 유입 가정 — 그 달까지 받은 누적 DB가 그 시점 구매 한도")
put("mediFee", "리포트 구매 단가", "원/건", C2["mediFee"], F_WON, "대표 지시 — 통상가의 3배로 사준다(3,000원) · 가입 전환된 회원분만 지급", True)
put("mediPer", "가입 회원당 연 리포트 수", "건/인·년", C2["mediPer"], "0", "1 = 가입 시 1회 발행")
put("mediYears", "리포트를 사주는 연차", "차", C2["mediYears"], "0", "대표 지시 2026-09-16 — 1 = 초년도(2027) 가입분 33만 건까지만 구매 · 이후 연차는 0", True)
put("mediShare", "가입 회원 중 제휴 DB 경유 비율", "%", C2["mediShare"], F_PCT, "1차 목표 33만 명 전량을 제휴 DB 경유로 본 값 — 다른 유입 경로가 확인되면 낮출 것")
cell(A, f"I{r}", "구매 건수 = MIN(구매 연차 안의 총가입×경유 비율×회원당 리포트, 그때까지 확보한 누적 DB − 이미 산 건수) · 비용은 판관비(현금은 발생 월)", SUB)
r += 1

gap("⑪ 월 배분 — 회원 증가 램프(가중치, 합이 0이 아니면 됨)")
header_row(A, r, ["", "연도(오픈 2027-01부터)", "", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"], 1, SEC)
for col in range(1, 16):
    A.cell(row=r, column=col).font = BOLD
r += 1
MC = [CL(4 + i) for i in range(12)]    # D..O
ramps = [P["m1Ramp"]] + [[1] * 12 for _ in range(4)]
AR["rampRow"] = r
for y in range(5):
    cell(A, f"B{r}", YRS[y])
    for m in range(12):
        cell(A, f"{MC[m]}{r}", ramps[y][m], BLUE, "0.0")
    r += 1
cell(A, f"B{r-5}", YRS[0], comment="finModel.js m1Ramp — 2027년 월별 회원 증가 비중")

gap("⑫ 월 배분 — ② 9채널 매체비 2027(가중치) · 2028부터 12개월 균등 · 모두 0이면 균등")
AR["launchPhaseRow"] = r
cell(A, f"B{r}", YRS[0])
for m in range(12):
    cell(A, f"{MC[m]}{r}", 1, BLUE, "0.0")
r += 1

gap("⑬ 월 배분 — CAPEX 집행(시스템·장비 · 메디에이지 제외, 가중치) · 모두 0이면 12개월 균등")
AR["capexPhaseRow"] = r
for y in range(5):
    cell(A, f"B{r}", YRS[y])
    for m in range(12):
        cell(A, f"{MC[m]}{r}", 1, BLUE, "0.0")
    r += 1

gap("⑭ 인건비 월 경로")
put("payMode", "월 배분 방식 — 1: 연간÷12 균등 / 2: 연속 채용 경로", "선택", 2, "0", "연간 합계는 둘 다 같다. 균등은 해가 바뀔 때 월 인건비가 계단처럼 뛰어 가짜 저점을 만든다", True)
cell(A, f"B{r}", "연속 채용 경로의 2027-01(오픈 첫 달) 인건비 = 인력계획 1차 인건비 ÷ 12(준비기간에 채용 완료) — 인력계획 ⑦", SUB); r += 1

A.column_dimensions["A"].width = 12
A.column_dimensions["B"].width = 50
A.column_dimensions["C"].width = 8
for col in "DEFGH":
    A.column_dimensions[col].width = 16
for col in "IJKLMNO":
    A.column_dimensions[col].width = 12
A.column_dimensions["I"].width = 60
A.column_dimensions["P"].width = 70
A.freeze_panes = "D5"


def AREF(key, yi=0, absolute=True):
    """가정 시트 참조 — 연차 배열이면 yi 열, 스칼라면 $D"""
    return f"'가정'!${YC[yi]}${AR[key]}"


def ASCALAR(key):
    return f"'가정'!$D${AR[key]}"


# ══════════════════════════════════════ 인력계획 ══════════════════════════════════════
H = wb.create_sheet("인력계획")
cell(H, "A1", "인력계획 — 2027(1차) 섹션별 인원 · 업계 급여 → 2028부터 매출 증대 연동", TITLE)
cell(H, "A2", "대표 지시 2026-09-14 — 모델 인건비(1차 70억) 삭제. 1차는 섹션별 인원(대표 포함) + 자문임원, 급여는 업계 조사(비용근거 시트). 2차부터 섹션 인원 = MAX(1차, 올림(1차 × (연동 지표 ÷ 1차 지표)^인원 탄력성)).", SUB)
header_row(H, 4, ["구분", "섹션", "단위"] + YRS + ["비고 · 근거"])
HR = {}
hr = 5
section(H, hr, "① 섹션 입력 — 1차 인원 · 1차 기본연봉(세전, 부대비용 제외) · 연동 지표", 9); hr += 1
header_row(H, hr, ["", "섹션", "", "1차 인원(명)", "기본연봉(원/년)", "연동 지표(2차부터)", "", "", "급여 근거"], 1, SEC)
for col in range(1, 10):
    H.cell(row=hr, column=col).font = BOLD
hr += 1
for key_, lab_, h1_, dk_, base_ in C2["sections"]:
    cell(H, f"B{hr}", lab_)
    cell(H, f"D{hr}", h1_, BLUE, F_CNT, YELLOW)
    cell(H, f"E{hr}", base_, BLUE, F_WON)
    cell(H, f"F{hr}", CS.DRIVERS.get(dk_, "고정"), SUB)
    cell(H, f"I{hr}", CS.NOTE.get("sal_" + key_, ""), SUB)
    HR["in_" + key_] = hr; hr += 1
cell(H, f"B{hr}", "1차 인원 합계", BOLD); cell(H, f"D{hr}", f"=SUM(D{HR['in_'+C2['sections'][0][0]]}:D{hr-1})", BLACK, F_CNT, TOT, bold=True)
hr += 2
section(H, hr, "② 공통 입력 — 임금 인상률 · 인원 탄력성 · 사용자 부담 · 자문임원", 9); hr += 1
for k_, lab_, unit_, v_, fmt_ in [("wageGrowth", "임금 인상률(연)", "%", C2["wageGrowth"], F_PCT),
                                 ("headElast", "인원 탄력성 — 연동 지표 1% 증가 시 인원 증가율", "배", C2["headElast"], "0.00")]:
    cell(H, f"B{hr}", lab_); cell(H, f"C{hr}", unit_, SUB); cell(H, f"D{hr}", v_, BLUE, fmt_, YELLOW if k_ == "headElast" else None)
    cell(H, f"I{hr}", CS.NOTE.get(k_, ""), SUB)
    HR[k_] = hr; hr += 1
HR["bFirst"] = hr
for k_, lab_ in CS.BURDEN_KEYS:
    cell(H, f"B{hr}", "사용자 부담 — " + lab_ + (" · 연차별" if k_ == "pension" else "")); cell(H, f"C{hr}", "%", SUB)
    if k_ == "pension":
        for i in range(5):
            cell(H, f"{YC[i]}{hr}", C2["pensionY"][i], BLUE, F_RATE)
    else:
        cell(H, f"D{hr}", C2["burden"][k_], BLUE, F_RATE)
    cell(H, f"I{hr}", CS.NOTE.get("burden_" + k_, ""), SUB)
    HR["b_" + k_] = hr; hr += 1
cell(H, f"B{hr}", "사용자 부담 합계(4대보험·퇴직급여) — 기본연봉 대비", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"={YC[i]}{HR['b_pension']}+SUM($D${HR['b_pension']+1}:$D${hr-1})", BLACK, F_RATE, TOT, bold=True)
HR["bTotal"] = hr; hr += 1
cell(H, f"B{hr}", "복리후생(1인당 월 · 임금 인상률 연동)"); cell(H, f"C{hr}", "원/월", SUB); cell(H, f"D{hr}", C2["welfareMonth"], BLUE, F_WON)
cell(H, f"I{hr}", CS.NOTE.get("welfareMonth", ""), SUB)
HR["welf"] = hr; hr += 1
cell(H, f"B{hr}", "자문임원(의료·보험·법률·계리 사외 자문)"); cell(H, f"C{hr}", "명", SUB); cell(H, f"D{hr}", C2["advisors"], BLUE, F_CNT)
cell(H, f"I{hr}", "인원 합계·임차 인원에는 넣지 않음", SUB)
HR["advN"] = hr; hr += 1
cell(H, f"B{hr}", "자문임원 1인당 월 자문료"); cell(H, f"C{hr}", "원/월", SUB); cell(H, f"D{hr}", C2["advisorFee"], BLUE, F_WON)
cell(H, f"I{hr}", CS.NOTE.get("advisorFee", ""), SUB)
HR["advFee"] = hr; hr += 2

section(H, hr, "③ 연동 지표 — 연간손익에서", 9); hr += 1
for dk_ in ["active", "me", "insC", "catNutri", "catDevice", "catSports", "rev"]:
    cell(H, f"B{hr}", CS.DRIVERS[dk_]); cell(H, f"C{hr}", "원" if dk_ in ("catNutri", "catDevice", "catSports", "rev") else "건·명", SUB)
    HR["drv_" + dk_] = hr; hr += 1
cell(H, f"B{hr}", "1차(2027) 기준 지표(인원 증가의 분모) — 개시 계수 적용 전 연 환산 값(연간손익 「연 환산 매출」)", BOLD); hr += 1
for dk_ in ["active", "me", "insC", "catNutri", "catDevice", "catSports", "rev"]:
    cell(H, f"B{hr}", "  기준 — " + CS.DRIVERS[dk_]); cell(H, f"C{hr}", "원" if dk_ in ("catNutri", "catDevice", "catSports", "rev") else "건·명", SUB)
    HR["base_" + dk_] = hr; hr += 1
hr += 1

section(H, hr, "④ 섹션별 인원(명) — 2차부터 MAX(1차, 올림(1차 × (지표 ÷ 1차 기준 지표)^탄력성))", 9); hr += 1
HR["headStart"] = hr
for key_, lab_, h1_, dk_, base_ in C2["sections"]:
    cell(H, f"B{hr}", lab_); cell(H, f"C{hr}", "명", SUB)
    inr = HR["in_" + key_]
    for i in range(5):
        if i == 0 or dk_ is None:
            f_ = f"=$D${inr}"
        else:
            d_ = HR["drv_" + dk_]
            b_ = HR["base_" + dk_]
            f_ = f"=IF($D${b_}<=0,$D${inr},MAX($D${inr},ROUNDUP(ROUND($D${inr}*({YC[i]}{d_}/$D${b_})^$D${HR['headElast']},6),0)))"
        cell(H, f"{YC[i]}{hr}", f_, BLACK, F_CNT)
    cell(H, f"I{hr}", CS.DRIVERS.get(dk_, "고정"), SUB)
    HR["head_" + key_] = hr; hr += 1
cell(H, f"B{hr}", "인원 합계(자문임원 제외)", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=SUM({YC[i]}{HR['headStart']}:{YC[i]}{hr-1})", BLACK, F_CNT, TOT, bold=True)
HR["headTotal"] = hr; hr += 1
cell(H, f"B{hr}", "1인당 매출(매출액 ÷ 인원)")
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=IF({YC[i]}{HR['headTotal']}=0,0,{YC[i]}{HR['drv_rev']}/{YC[i]}{HR['headTotal']})", BLACK, F_MIL)
cell(H, f"I{hr}", "백만원/인 · 벤치마크는 비용근거 시트(국내 플랫폼 1인당 매출)", SUB)
HR["rpe"] = hr; hr += 2

section(H, hr, "⑤ 1인당 연 총인건비 = [기본연봉 × (1+사용자 부담) + 복리후생 월×12] × (1+인상률)^(연차−1)", 9); hr += 1
for key_, lab_, h1_, dk_, base_ in C2["sections"]:
    cell(H, f"B{hr}", lab_); cell(H, f"C{hr}", "원/년", SUB)
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", f"=$E${HR['in_'+key_]}*(1+$D${HR['wageGrowth']})^{i}*(1+{YC[i]}${HR['bTotal']})+$D${HR['welf']}*12*(1+$D${HR['wageGrowth']})^{i}", BLACK, F_WON)
    HR["unit_" + key_] = hr; hr += 1
hr += 1

section(H, hr, "⑥ 섹션별 인건비 = ROUND(인원 × 1인당 총인건비)", 9); hr += 1
HR["costStart"] = hr
for key_, lab_, h1_, dk_, base_ in C2["sections"]:
    cell(H, f"B{hr}", lab_); cell(H, f"C{hr}", "원", SUB)
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", f"=ROUND({YC[i]}{HR['head_'+key_]}*{YC[i]}{HR['unit_'+key_]},0)", BLACK, F_MIL)
    HR["cost_" + key_] = hr; hr += 1
cell(H, f"B{hr}", "자문임원 자문료"); cell(H, f"C{hr}", "원", SUB)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=ROUND($D${HR['advN']}*$D${HR['advFee']}*12,0)", BLACK, F_MIL)
HR["adv"] = hr; hr += 1
cell(H, f"B{hr}", "인건비 합계 → 연간손익", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=SUM({YC[i]}{HR['costStart']}:{YC[i]}{HR['adv']})", BLACK, F_MIL, TOT, bold=True)
HR["payTotal"] = hr; hr += 1
cell(H, f"B{hr}", "1인당 평균 인건비(합계 ÷ 인원)")
HR["avgSal"] = hr
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=IF({YC[i]}{HR['headTotal']}=0,0,{YC[i]}{HR['payTotal']}/{YC[i]}{HR['headTotal']})", BLACK, F_WON)
hr += 1
cell(H, f"B{hr}", "참고 — 삭제한 모델 인건비(finModel.js)", SUB)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", P["payroll"][i], SUB, F_MIL)
cell(H, f"I{hr}", "대표 지시로 삭제 — 비교용 표시만(계산에 쓰지 않음)", SUB)
HR["payModel"] = hr; hr += 2

section(H, hr, "⑦ 인건비 월 경로(연속 채용) — 2027-01(오픈 첫 달) = 2027 인건비 ÷ 12(준비기간에 채용 완료), 이후 전년 말에서 이어지고 연 합계 보존", 9); hr += 1
cell(H, f"B{hr}", "해당 연차 1월 인건비")
HR["payS"] = hr
for i in range(5):
    v = f"={YC[0]}{HR['payTotal']}/12" if i == 0 else f"={YC[i-1]}{hr+1}"
    cell(H, f"{YC[i]}{hr}", v, BLACK, F_WON)
hr += 1
cell(H, f"B{hr}", "해당 연차 12월 인건비 = 연간÷6 − 1월")
HR["payE"] = hr
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"={YC[i]}{HR['payTotal']}/6-{YC[i]}{HR['payS']}", BLACK, F_WON)
hr += 1
cell(H, f"B{hr}", "점검 — 경로 이상 여부")
HR["payWarn"] = hr
for i in range(5):
    s_, e_ = f"{YC[i]}{HR['payS']}", f"{YC[i]}{HR['payE']}"
    cell(H, f"{YC[i]}{hr}", f'=IF({ASCALAR("payMode")}=1,"균등 모드 — 해당 없음",IF(OR({s_}<0,{e_}<0),"음수 — 조정 필요",IF({e_}<{s_}-1,"연중 감소 — 1월 인건비 과대","정상")))', BLACK)
hr += 1

H.column_dimensions["A"].width = 6
H.column_dimensions["B"].width = 46
H.column_dimensions["C"].width = 7
for col in "DEFGH":
    H.column_dimensions[col].width = 16
H.column_dimensions["I"].width = 60
H.freeze_panes = "D5"


# ══════════════════════════════════════ 연간손익 ══════════════════════════════════════
Y = wb.create_sheet("연간손익")
cell(Y, "A1", "연간 손익 · 투자 — 2027~2031년(1~5차) 세부 계정", TITLE)
cell(Y, "A2", "단위: 백만원(수치는 원으로 계산, 표시만 백만원) · 운영 지표는 명·건·곳 · 초록 = 다른 시트 연결 · 검정 = 수식", SUB)
header_row(Y, 4, ["구분", "계정", "산식"] + YRS + ["5년 합계"])
YR = {}
yr = 5


def yline(key, label, formula_fn, fmt=F_MIL, expl="", grp="", total=False, font=BLACK, sum5=True):
    """formula_fn(i) -> 1~5차 열의 수식 문자열"""
    global yr
    cell(Y, f"A{yr}", grp, BOLD if grp else BLACK)
    cell(Y, f"B{yr}", label, BOLD if total else BLACK)
    cell(Y, f"C{yr}", expl, SUB)
    for i in range(5):
        cell(Y, f"{YC[i]}{yr}", formula_fn(i), font, fmt, TOT if total else None, bold=total)
    if sum5:
        cell(Y, f"I{yr}", f"=SUM(D{yr}:H{yr})", BLACK, fmt, TOT if total else None, bold=total)
    YR[key] = yr
    yr += 1


def ysec(t):
    global yr
    yr += 1
    section(Y, yr, t, 9)
    yr += 1


def yv(key, i):
    return f"{YC[i]}{YR[key]}"


ysec("운영 지표")
yline("me", "연말 회원", lambda i: f"={AREF('membersEnd', i)}", F_CNT, "가정", font=GREEN, sum5=False)
yline("mp", "기초 회원(전년 말)", lambda i: "=0" if i == 0 else f"={YC[i-1]}{YR['me']}", F_CNT, "전년 연말 회원", sum5=False)
yline("new", "순증 회원", lambda i: f"=MAX(0,{yv('me', i)}-{yv('mp', i)})", F_CNT, "연말 − 기초")
yline("gross_new", "총가입 필요량(이탈 보전 포함)", lambda i: f"={yv('new', i)}+ROUND({yv('mp', i)}*{ASCALAR('churn')},0)", F_CNT, "순증 + 기초×이탈률")
yline("active", "검진 예약(연 환산 · 가정)", lambda i: f"={AREF('activeAbs', i)}", F_CNT, "연말 회원 기준 연 환산", font=GREEN)
for sk_, sl_, sb_ in STREAMS:
    yline("eff_" + sk_, f"매출 반영률 — {sl_}", lambda i: "=1", F_PCT, "2027 = Σ(월 기준×개시 계수) · 2028~ = 산정 방식 2면 월별 누적 ÷ 연말 기준(1이면 100%)", sum5=False)
yline("activeAct", "검진 예약(반영)", lambda i: f"=ROUND({yv('active', i)}*{yv('eff_Chk', i)},0)", F_CNT, "연 환산 × 검진 반영률")
yline("chkShare", "검진안내 자사운영 비율", lambda i: f"=MIN(1,ROUND({ASCALAR('chkOwnY1')}+{ASCALAR('chkOwnStep')}*{i},6))", F_PCT, "1차 비율 + 상승폭×(연차−1), 상한 100%", sum5=False)
yline("chkOwnN", "검진안내 — 자사운영 건수", lambda i: f"=ROUND({yv('activeAct', i)}*{yv('chkShare', i)},0)", F_CNT, "검진 예약(반영)×자사 비율")
yline("chkPtnN", "검진안내 — 타사 제휴 건수", lambda i: f"={yv('activeAct', i)}-{yv('chkOwnN', i)}", F_CNT, "검진 예약(반영) − 자사 건수")
yline("mkt", "마케팅 동의 회원", lambda i: f"={AREF('mktConsent', i)}", F_CNT, "가정", font=GREEN, sum5=False)
yline("insts", "제휴 기관 합계", lambda i: f"={AREF('centers', i)}+{AREF('hospitals', i)}+{AREF('pharmacies', i)}", F_CNT, "검진센터+병원+약국", sum5=False)
FEE = lambda t, i: f"=IF({i+1}<{ASCALAR('subStart_'+t)},0,MIN({ASCALAR('subCap')},ROUND({ASCALAR('subBase_'+t)}*(1+{ASCALAR('subRate_'+t)})^{max(0, i-1)}+{ASCALAR('subStep_'+t)}*{max(0, i-1)},0)))"
yline("fee_c", "구독료(월) — 검진센터", lambda i: FEE("c", i), F_WON, "개시 연차 전 0 · 기본×(1+인상률)^MAX(0,연차−2)+정액×MAX(0,연차−2), 상한", sum5=False)
yline("fee_h", "구독료(월) — 병원", lambda i: FEE("h", i), F_WON, "", sum5=False)
yline("fee_p", "구독료(월) — 약국", lambda i: FEE("p", i), F_WON, "", sum5=False)
yline("paid_c", "유료 기관 — 검진센터", lambda i: f"=ROUND({AREF('centers', i)}*{ASCALAR('subPaid')},0)", F_CNT, "기관×유료 전환율", sum5=False)
yline("paid_h", "유료 기관 — 병원", lambda i: f"=ROUND({AREF('hospitals', i)}*{ASCALAR('subPaid')},0)", F_CNT, "", sum5=False)
yline("paid_p", "유료 기관 — 약국", lambda i: f"=ROUND({AREF('pharmacies', i)}*{ASCALAR('subPaid')},0)", F_CNT, "", sum5=False)
yline("buyers", "구매 회원", lambda i: f"=ROUND({yv('me', i)}*{ASCALAR('buyerRate')},0)", F_CNT, "연말 회원×구매 비율", sum5=False)
yline("svcUsers", "헬스케어 서비스 이용자(고객 과금 없음)", lambda i: f"=ROUND({yv('me', i)}*{ASCALAR('svcRate')},0)", F_CNT, "연말 회원×이용률 — 대가는 기관 구독료")
yline("resvFull", "예약 건수(연 환산)", lambda i: f"=ROUND({yv('active', i)}*{AREF('resvPer', i)},0)", F_CNT, "검진 예약(연 환산)×예약 배수")
yline("resv", "예약 건수(반영)", lambda i: f"=ROUND({yv('resvFull', i)}*{yv('eff_Resv', i)},0)", F_CNT, "연 환산 × 예약 반영률")
yline("careCtrFull", "재가·돌봄 파트너 센터(연말 · 연 환산)", lambda i: f"=IF({ASCALAR('carePerCenter')}<=0,0,ROUND({yv('me', i)}*{ASCALAR('careRate')}/12/{ASCALAR('carePerCenter')},0))", F_CNT, "연말 회원×수요율÷12÷센터당 월 수요", sum5=False)
yline("careNFull", "재가·돌봄 과금 센터·월(연 환산)", lambda i: f"={yv('careCtrFull', i)}*12", F_CNT, "센터×12")
yline("careN", "재가·돌봄 과금 센터·월(반영)", lambda i: f"=ROUND({yv('careNFull', i)}*{yv('eff_Care', i)},0)", F_CNT, "연 환산 × 돌봄 반영률")
yline("headTotal", "인원(명 · 인력계획)", lambda i: f"='인력계획'!{YC[i]}{HR['headTotal']}", F_CNT, "자문임원 제외", font=GREEN, sum5=False)
yline("mk2Impr", "② 채널 광고 월 노출", lambda i: f"={ASCALAR('mk2Impr')}" if i == 0 else f"=IF($D${YR['new']}<=0,{ASCALAR('mk2Impr')},ROUND({ASCALAR('mk2Impr')}*({yv('new', i)}/$D${YR['new']})^{ASCALAR('mk2Elast')},0))", F_CNT, "1차 × (순증 ÷ 1차 순증)^탄력성", sum5=False)
yline("qrNew", "④ QR 신규 배치 검진센터", lambda i: f"=MAX(0,{AREF('qrCenters', i)}" + ("" if i == 0 else f"-{AREF('qrCenters', i-1)}") + ")", F_CNT, "누적 배치의 증가분")
yline("avgMembers", "평균 회원(기초·연말 평균)", lambda i: f"=({yv('mp', i)}+{yv('me', i)})/2", F_CNT, "클라우드 회원 연동·AI 상담 모수", sum5=False)
yline("bcRec", "블록체인 앵커링 기록 건수", lambda i: f"=IF($D${YR['me']}<=0,{ASCALAR('bcRecords')},{ASCALAR('bcRecords')}*{yv('me', i)}/$D${YR['me']})", F_CNT, "1차 기록 건수 × 연말 회원 비례")
yline("swBuild", "AI 시스템 투자(1차 도입 · 2차부터 고도화)", lambda i: f"=SUM('가정'!{YC[i]}{AR['capexFirst']}:{YC[i]}{AR['aiCommon']})+'가정'!{YC[i]}{AR['capexLater']}", F_MIL, "유지보수 산정 기준 — CAPEX의 일부", font=GREEN)
yline("insCasesFull", "헬스메이트센터 DB 공급 건수(연 환산)", lambda i: f"=ROUND({yv('mkt', i)}*{ASCALAR('insConv')},0)", F_CNT, "누적 동의×공급 집행률(매년 재공급)")
yline("insCases", "헬스메이트센터 DB 공급 건수(반영)", lambda i: f"=ROUND({yv('insCasesFull', i)}*{yv('eff_Ins', i)},0)", F_CNT, "연 환산 × 사용료 반영률 — 우대 한도는 반영 건수에 적용")
yline("hmCap", "우대 한도(건)", lambda i: f"=MAX(0,{ASCALAR('hmCap1')}+{ASCALAR('hmCapStep')}*{i})", F_CNT, "1차 한도 + 연 증가×(연차−1), 0 미만 없음", sum5=False)
yline("hmPrice", "우대 단가(원/건)", lambda i: f"=MAX(0,MIN({ASCALAR('hmMarket')},ROUND({ASCALAR('hmMarket')}*{ASCALAR('hmRate1')},0)+{ASCALAR('hmPriceStep')}*{i}))", F_WON, "시가×1차 비율 + 인상폭×(연차−1), 0~시가", sum5=False)
yline("hmDiscN", "우대 단가 적용 건수", lambda i: f"=MIN({yv('insCases', i)},{yv('hmCap', i)})", F_CNT, "MIN(공급 건수, 한도)")
yline("hmFullN", "시가 적용 건수(한도 초과)", lambda i: f"={yv('insCases', i)}-{yv('hmDiscN', i)}", F_CNT, "공급 건수 − 우대 건수")

ysec("매출")
for c in cats:
    k = c["key"]
    yline("rev_" + k, f"제품판매 — {c['label']}",
          lambda i, k=k: f"=ROUND(ROUND({yv('buyers', i)}*{ASCALAR('arpu_'+k)}*{ASCALAR('capture')}*{AREF('ramp', i)},0)*{yv('eff_P', i)},0)",
          F_MIL, "구매회원×1인 지출×점유율×가동률 × 제품 반영률", grp="제품")
yline("revP", "제품판매 소계(GMV 총액)", lambda i: f"=SUM({YC[i]}{YR['rev_supp']}:{YC[i]}{YR['rev_sports']})", F_MIL, "", total=True)
yline("revChk_o", "검진안내 — 자사운영", lambda i: f"={yv('chkOwnN', i)}*{ASCALAR('chkOwnFee')}", F_MIL, "자사 건수×건당 매출", grp="수수료")
yline("revChk_t", "검진안내 — 타사 제휴(인피니티 등)", lambda i: f"={yv('chkPtnN', i)}*{ASCALAR('chkPtnFee')}", F_MIL, "타사 건수×건당 매출")
yline("revChk", "검진 연계 소계", lambda i: f"={yv('revChk_o', i)}+{yv('revChk_t', i)}", F_MIL, "", total=True)
yline("revSvc", "헬스케어 서비스 — 고객 수수료", lambda i: f"=ROUND({yv('svcUsers', i)}*{ASCALAR('svcFee')}*{yv('eff_Svc', i)},0)", F_MIL, "이용자×고객 수수료×반영률(기본 0 — 기관 구독료로 수취)")
yline("revResv", "예약 서비스 수수료", lambda i: f"={yv('resv', i)}*{ASCALAR('resvFee')}", F_MIL, "예약 건수(반영)×수수료")
yline("revCare", "재가·돌봄 파트너 이용료", lambda i: f"={yv('careN', i)}*{ASCALAR('careFee')}", F_MIL, "과금 센터·월(반영)×월 정액 — 건당 소개료·수익배분 없음", grp="돌봄")
for t_, tl_ in (("c", "검진센터"), ("h", "병원"), ("p", "약국")):
    yline("effSub_" + t_, f"구독 반영률 — {tl_}", lambda i, t_=t_: (f"={yv('eff_Sub', 0)}" if i == 0 else
          f"=IF(NOT({ASCALAR('revMode')}=2),1,IF({yv('paid_'+t_, i)}=0,0,{yv('paid_'+t_, i-1)}/{yv('paid_'+t_, i)}+(1-{yv('paid_'+t_, i-1)}/{yv('paid_'+t_, i)})*78/144))"),
          F_PCT, "2027 = 구독 개시 계수 합/12 · 2028~ = 전년 말→연말 유료 기관 직선 경로의 연평균 ÷ 연말", sum5=False)
yline("sub_c", "AI 플랫폼 구독 — 검진센터", lambda i: f"=ROUND({yv('paid_c', i)}*{yv('fee_c', i)}*12*{yv('effSub_c', i)},0)", F_MIL, "유료 검진센터×월 구독료×12×유형별 반영률", grp="구독")
yline("sub_h", "AI 플랫폼 구독 — 병원", lambda i: f"=ROUND({yv('paid_h', i)}*{yv('fee_h', i)}*12*{yv('effSub_h', i)},0)", F_MIL, "유료 병원×월 구독료×12×유형별 반영률")
yline("sub_p", "AI 플랫폼 구독 — 약국", lambda i: f"=ROUND({yv('paid_p', i)}*{yv('fee_p', i)}*12*{yv('effSub_p', i)},0)", F_MIL, "유료 약국×월 구독료×12×유형별 반영률")
yline("revSub", "AI 플랫폼 구독 소계(EMR·UIP 사용료)", lambda i: f"=SUM({YC[i]}{YR['sub_c']}:{YC[i]}{YR['sub_p']})", F_MIL, "", total=True)
yline("revIns_d", "헬스메이트센터 사용료 — 우대분", lambda i: f"={yv('hmDiscN', i)}*{yv('hmPrice', i)}", F_MIL, "우대 건수×우대 단가", grp="사용료")
yline("revIns_f", "헬스메이트센터 사용료 — 시가분(한도 초과)", lambda i: f"={yv('hmFullN', i)}*{ASCALAR('hmMarket')}", F_MIL, "초과 건수×시가")
yline("revIns", "헬스메이트센터 사용료 소계", lambda i: f"={yv('revIns_d', i)}+{yv('revIns_f', i)}", F_MIL, "IM은 「시스템사용료+광고료」 정산(법률검토 전제)", total=True)
yline("rev", "매출액 합계", lambda i: f"={yv('revP', i)}+{yv('revChk', i)}+{yv('revSvc', i)}+{yv('revResv', i)}+{yv('revCare', i)}+{yv('revSub', i)}+{yv('revIns', i)}", F_MIL, "", total=True)

ysec("매출원가")
for c in cats:
    k = c["key"]
    yline("cogs_" + k, f"제품 원가 — {c['label']}", lambda i, k=k: f"=ROUND({yv('rev_'+k, i)}*{ASCALAR('cost_'+k)},0)", F_MIL, "카테고리 매출×원가율", grp="제품")
yline("cogsP", "제품 원가 소계", lambda i: f"=SUM({YC[i]}{YR['cogs_supp']}:{YC[i]}{YR['cogs_sports']})", F_MIL, "", total=True)
yline("chkCogs_o", "검진 3종 원가 — 자사운영", lambda i: f"={yv('chkOwnN', i)}*{ASCALAR('chkOwnCost')}", F_MIL, "자사 건수×건당 원가", grp="서비스")
yline("chkCogs_t", "검진 3종 원가 — 타사 제휴", lambda i: f"={yv('chkPtnN', i)}*{ASCALAR('chkPtnCost')}", F_MIL, "타사 건수×건당 원가")
yline("chkCogs", "검진 3종 원가 소계", lambda i: f"={yv('chkCogs_o', i)}+{yv('chkCogs_t', i)}", F_MIL, "", total=True)
yline("svcCost", "헬스케어 서비스 원가", lambda i: f"=ROUND({yv('revSvc', i)}*{ASCALAR('svcCost')},0)", F_MIL, "서비스 매출×원가율")
yline("careCost", "재가·돌봄 연계 원가", lambda i: f"=ROUND({yv('revCare', i)}*{ASCALAR('careCost')},0)", F_MIL, "돌봄 연계 매출×원가율")
yline("subCost", "구독 운영 원가", lambda i: f"=ROUND({yv('revSub', i)}*{ASCALAR('subCost')},0)", F_MIL, "구독 매출×원가율")
yline("payFee", "결제 대행 수수료", lambda i: f"=ROUND({yv('revP', i)}*{ASCALAR('payRate')},0)", F_MIL, "제품 매출×수수료율")
yline("cogs", "매출원가 합계", lambda i: f"={yv('cogsP', i)}+{yv('chkCogs', i)}+{yv('svcCost', i)}+{yv('careCost', i)}+{yv('subCost', i)}+{yv('payFee', i)}", F_MIL, "", total=True)
yline("gross", "매출총이익", lambda i: f"={yv('rev', i)}-{yv('cogs', i)}", F_MIL, "매출 − 원가", total=True)
yline("gm", "매출총이익률", lambda i: f"=IF({yv('rev', i)}=0,0,{yv('gross', i)}/{yv('rev', i)})", F_PCT, "", sum5=False)

ysec("판매관리비")
yline("mk1", "① 메디에이지 검진 도래 안내 발송", lambda i: f"=ROUND({AREF('mk1Target', i)}*{ASCALAR('mk1Times')}*4*{ASCALAR('mk1Unit')},0)", F_MIL, "분기 대상×분기 발송 수×4×단가", grp="마케팅")
yline("media", "② 9채널 타겟 광고 매체비", lambda i: f"=ROUND({yv('mk2Impr', i)}*12*'가정'!$D${AR['mk2Cpm']}/1000,0)", F_MIL, "월 노출×12×가중 CPM÷1,000")
yline("creative", "② 광고 소재 제작(영상·카드뉴스)", lambda i: f"={ASCALAR('videoN')}*{ASCALAR('videoUnit')}+{ASCALAR('cardN')}*{ASCALAR('cardUnit')}", F_MIL, "편수×단가")
yline("cardAd", "② 카드사 제휴 타겟 광고", lambda i: f"={AREF('cardAdMsgs', i)}*{ASCALAR('cardAdUnit')}", F_MIL, "발송×단가(협의 전 0)")
yline("kit", "④ 검진센터 QR 키트", lambda i: f"=ROUND({yv('qrNew', i)}*{ASCALAR('qrKit')},0)", F_MIL, "신규 배치 센터×키트 단가")
yline("sticker", "④ 결과지 봉투 QR 스티커", lambda i: f"=ROUND({yv('activeAct', i)}*{ASCALAR('qrSticker')},0)", F_MIL, "검진 예약(반영)×스티커 단가")
yline("qrfee", "④ 센터 연계 수수료", lambda i: f"=ROUND({yv('new', i)}*{ASCALAR('qrShare')}*{ASCALAR('qrFee')},0)", F_MIL, "순증×QR 비중×수수료(협의 전 0)")
yline("mktSum", "마케팅 소계(5대 엔진 — ③·⑤는 광고비 0)", lambda i: f"=SUM({YC[i]}{YR['mk1']}:{YC[i]}{YR['qrfee']})", F_MIL, "", total=True)


def _medi_cum(i):
    """연차 i 말까지 받은 누적 제휴 DB 건수 — 2027-01부터 확보 개월에 걸쳐 균등 유입"""
    return f"ROUND({ASCALAR('mediDb')}*MIN(1,{(i + 1) * 12}/{ASCALAR('mediMonths')}),0)"


def _medi_n(i):
    prev = "0" if i == 0 else f"SUM($D${yr}:{YC[i-1]}{yr})"      # 같은 행(작성 중)의 앞 연차 누적
    want = f"IF({i + 1}>{ASCALAR('mediYears')},0,ROUND({yv('gross_new', i)}*{ASCALAR('mediShare')}*{ASCALAR('mediPer')},0))"
    return f"=MIN({want},MAX(0,{_medi_cum(i)}-{prev}))"


yline("mediN", "메디에이지 리포트 구매 건수(가입 전환분)", _medi_n, F_CNT,
      "MIN(총가입×경유 비율×회원당 리포트, 누적 확보 DB − 이미 산 건수) — 가정 ⑩-2", grp="제휴 DB")
yline("mediRep", "메디에이지 리포트 구매비", lambda i: f"=ROUND({yv('mediN', i)}*{ASCALAR('mediFee')},0)", F_MIL,
      "구매 건수 × 단가 — 20억 일시 투자를 대신하는 초년도 가입 연동 비용(현금은 발생 월)")
yline("reward", "포인트(토큰) 적립", lambda i: f"=ROUND(({yv('revP', i)}-{yv('cogsP', i)})*{ASCALAR('rewardRate')},0)", F_MIL, "제품마진×적립률", grp="고객·사회")
yline("donation", "기부금(치료비 나눔)", lambda i: f"=ROUND(({yv('revP', i)}-{yv('cogsP', i)})*{ASCALAR('donationRate')},0)", F_MIL, "제품마진×기부율")
yline("pay", "인건비(섹션별 인원 · 업계 급여 · 자문임원)", lambda i: f"='인력계획'!{YC[i]}{HR['payTotal']}", F_MIL, "인력계획 합계", grp="인력", font=GREEN)
yline("itMaint", "AI 시스템 유지보수", lambda i: "=ROUND((" + ("0" if i == 0 else f"SUM($D${YR['swBuild']}:{YC[i-1]}{YR['swBuild']})") + f"+0.5*{yv('swBuild', i)})*{ASCALAR('maintRate')},0)", F_MIL, "(전년까지 누적 투자 + 당해 투자×½)×요율", grp="AI·데이터")
OPSG = lambda i: f"IF($D${YR['me']}<=0,1,({yv('me', i)}/$D${YR['me']})^{ASCALAR('opsElast')})"
yline("itData", "데이터 유지관리", lambda i: f"=ROUND({ASCALAR('dataMonth')}*12*{OPSG(i)},0)", F_MIL, "월 비용×12×(회원 증가)^탄력성")
yline("itSec", "보안관제", lambda i: f"=ROUND({ASCALAR('secMonth')}*12,0)", F_MIL, "월 비용×12")
yline("cloudBase", "클라우드 기본 환경", lambda i: f"=ROUND({ASCALAR('cloudMonth')}*12,0)", F_MIL, "월 비용×12")
yline("cloudVar", "클라우드 증설(회원 연동)", lambda i: f"=ROUND(MAX(0,{yv('avgMembers', i)}-{ASCALAR('cloudBaseMembers')})*{ASCALAR('cloudPerMember')}*12,0)", F_MIL, "(평균 회원 − 기본 수용)×1인당 월×12")
yline("llm", "AI 상담 LLM API", lambda i: f"=ROUND({yv('avgMembers', i)}*{ASCALAR('consultsPerMember')}*({ASCALAR('tokIn')}*{ASCALAR('priceIn')}/1000000+{ASCALAR('tokOut')}*{ASCALAR('priceOut')}/1000000),0)", F_MIL, "평균 회원×상담 수×토큰×단가")
yline("bc", "블록체인 데이터 앵커링", lambda i: f"=ROUND({yv('bcRec', i)}*{ASCALAR('bcUnit')},0)", F_MIL, "기록 건수×건당 단가")
yline("itOpex", "AI·데이터·클라우드 소계", lambda i: f"=SUM({YC[i]}{YR['itMaint']}:{YC[i]}{YR['bc']})", F_MIL, "", total=True)
yline("salesCost", "영업비", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('salesRate')}*{ASCALAR('opexScale')},0)", F_MIL, "매출×요율×스케일", grp="운영")
yline("adminCost", "관리비", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('adminRate')}*{ASCALAR('opexScale')},0)", F_MIL, "매출×요율×스케일")
yline("sga", "판매관리비 합계", lambda i: "=" + "+".join(yv(k, i) for k in ["mktSum", "mediRep", "reward", "donation", "pay", "itOpex", "salesCost", "adminCost"]), F_MIL, "", total=True)

ysec("이익 — 상각 전(EBITDA)과 상각 후")


def depr_f(i):
    L_ = ASCALAR("life")
    terms = [f"'가정'!{YC[k]}{AR['capexTotal']}*IF({i-k}=0,0.5,IF({i-k}<{L_},1,IF({i-k}={L_},0.5,0)))" for k in range(i + 1)]
    return f"=ROUND(({'+'.join(terms)})/{L_},0)"


yline("ebitModel", "영업이익(상각 전 · 모델 표기 방식)", lambda i: f"={yv('gross', i)}-{yv('sga', i)}", F_MIL, "매출총이익 − 판관비 — finModel.js ebit와 같은 정의(실질 EBITDA)", total=False)
yline("depr", "감가상각비(CAPEX 정액 상각)", depr_f, F_MIL, "CAPEX÷내용연수 · 취득 연도 반년")
yline("ebit", "영업이익(보정)", lambda i: f"={yv('ebitModel', i)}-{yv('depr', i)}", F_MIL, "모델 표기 − 감가상각", total=True)
yline("opm", "영업이익률(보정)", lambda i: f"=IF({yv('rev', i)}=0,0,{yv('ebit', i)}/{yv('rev', i)})", F_PCT, "", sum5=False)
yline("ebitda", "EBITDA", lambda i: f"={yv('ebit', i)}+{yv('depr', i)}", F_MIL, "보정 영업이익 + 감가상각")
yline("int", "이자비용", lambda i: f"={ASCALAR('interest')}", F_MIL, "가정", font=GREEN)
yline("pbt", "법인세차감전이익", lambda i: f"={yv('ebit', i)}-{yv('int', i)}", F_MIL, "보정 영업이익 − 이자")
yline("nolOpen", "이월결손금(기초 · 2027은 2026 준비기간 비용 — A)", lambda i: "=0" if i == 0 else f"=MAX(0,{YC[i-1]}{yr}-{YC[i-1]}{yr-1})", F_MIL, "전년 기초 − 전년 세전이익(0 미만 없음)", sum5=False)
yline("tax", "법인세(이월결손금 반영 · 현금은 이듬해 3월 납부)", lambda i: f"=MAX(0,{yv('pbt', i)}-{yv('nolOpen', i)})*{ASCALAR('tax')}", F_MIL, "(세전이익 − 이월결손금) × 세율, 0 미만 없음")
yline("net", "당기순이익", lambda i: f"={yv('pbt', i)}-{yv('tax', i)}", F_MIL, "", total=True)

ysec("투자 · 현금")
yline("capex", "CAPEX", lambda i: f"='가정'!{YC[i]}{AR['capexTotal']}", F_MIL, "가정 CAPEX 합계", font=GREEN)
yline("capexMedi", "  그중 메디에이지 데이터 투자(삭제 — 0)", lambda i: f"='가정'!{YC[i]}{AR['medi']}", F_MIL, "대표 지시 2026-09-16로 0 · 리포트 구매비는 판관비 줄에 있음", font=GREEN)
yline("capexBuild1", "  그중 1차 초기 구축(AI 모듈·공통 플랫폼·보안 인증)", lambda i: (f"={yv('swBuild', 0)}+'가정'!$D${AR['isms']}" if i == 0 else "=0"), F_MIL, "현금은 준비기간 지급 — 2026-10 30% · 11월 40% · 12월 30%(A·B·C 공통 · 오픈 전 완료)")
yline("capexBase", "  그중 고도화 · 장비(월 배분)", lambda i: f"={yv('capex', i)}-{yv('capexMedi', i)}-{yv('capexBuild1', i)}", F_MIL, "월 배분(가정 ⑬) 대상")
yline("dwc", "운전자본 증가", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('wcRate')},0)", F_MIL, "매출×증가율")
yline("fcf", "잉여현금흐름(FCF · 보정)", lambda i: f"={yv('ebit', i)}-MAX(0,{yv('ebit', i)})*{ASCALAR('tax')}+{yv('depr', i)}-{yv('capex', i)}-{yv('dwc', i)}", F_MIL, "영업이익−세금(손실 시 0)+감가상각−CAPEX−운전자본", total=True)
yline("cumfcf", "누적 FCF(연 단위)", lambda i: f"={yv('fcf', 0)}" if i == 0 else f"={YC[i-1]}{yr}+{yv('fcf', i)}", F_MIL, "⚠ 연 단위 누적은 연중 저점을 보지 못한다 — 「현금·투자금」 시트 참조", sum5=False)

ysec("참고 — 합계에 넣지 않는 메모(투자 심사 대비)")
yline("netRev1", "순매출(제품 순액 · 대리인 가정)", lambda i: f"={yv('rev', i)}-{yv('cogsP', i)}", F_MIL, "매출 − 제품 원가 · 입점형이면 대리인일 가능성")
yline("netRev2", "순매출(포인트 이연 반영 · 상한)", lambda i: f"={yv('netRev1', i)}-{yv('reward', i)}", F_MIL, "적립 전액 이연 가정 — 실제는 사용률 반영(IFRS15)")
varr = f"(({ASCALAR('salesRate')}+{ASCALAR('adminRate')})*{ASCALAR('opexScale')})"
yline("prodContrib", "제품판매 한계 공헌", lambda i: f"={yv('revP', i)}-{yv('cogsP', i)}-{yv('payFee', i)}-{yv('reward', i)}-{yv('donation', i)}-{yv('revP', i)}*{varr}", F_MIL, "제품 − 원가·결제·적립·기부·매출연동 영업·관리비 — 적립금 생태계 비용")
yline("prodContribR", "제품판매 한계 공헌률", lambda i: f"=IF({yv('revP', i)}=0,0,{yv('prodContrib', i)}/{yv('revP', i)})", F_PCT, "적립 60%·기부 15%(대표 지시 2026-09-16)가 제품마진에서 빠진 뒤의 공헌률", sum5=False)
yline("chkGP_o", "검진안내 매출총이익 — 자사운영", lambda i: f"={yv('revChk_o', i)}-{yv('chkCogs_o', i)}", F_MIL, "기본값 건당 +1만")
yline("chkGP_t", "검진안내 매출총이익 — 타사 제휴", lambda i: f"={yv('revChk_t', i)}-{yv('chkCogs_t', i)}", F_MIL, "기본값 건당 −1만 — 손실액은 4차까지 커지고 5차에 줄어듦")
yline("chkGP", "검진안내 매출총이익 합계", lambda i: f"={yv('chkGP_o', i)}+{yv('chkGP_t', i)}", F_MIL, "기본값에서는 자사 비율 50%(3차연도)가 손익분기")
yline("insContrib", "헬스메이트센터 사용료 공헌이익", lambda i: f"={yv('revIns', i)}*(1-{varr})", F_MIL, "원가 없음 · 매출연동 판관비만 차감")
yline("ebitExIns", "사용료 제외 시 영업이익(보정)", lambda i: f"={yv('ebit', i)}-{yv('insContrib', i)}", F_MIL, "연도별 이익이 사용료 한 줄에 달려 있는 정도")
yline("hmBenefit", "투자자 우대 할인액(시가 대비 · 계획 기준)", lambda i: f"={yv('hmDiscN', i)}*({ASCALAR('hmMarket')}-{yv('hmPrice', i)})", F_MIL, "우대 건수×(시가 − 우대 단가) — 1차 공급이 늦으면(C) 1차 한도는 쓰이지 않는다")
yline("hmBenefitX", "누계 할인액 ÷ 전략적 투자금", lambda i: f"=IF({ASCALAR('hmInvest')}=0,0,SUM($D${YR['hmBenefit']}:{YC[i]}{YR['hmBenefit']})/{ASCALAR('hmInvest')})", '0.00"배"', "투자금 대비 가격 조절의 기준 지표", sum5=False)
yline("effCac1", "실효 CAC(순증 기준)", lambda i: f"=IF({yv('new', i)}=0,0,{yv('mktSum', i)}/{yv('new', i)})", F_WON, "5대 엔진 광고비÷순증 · 삭제한 모델 CAC 5천원과 비교", sum5=False)
yline("mktRatio", "광고비 ÷ 매출", lambda i: f"=IF({yv('rev', i)}=0,0,{yv('mktSum', i)}/{yv('rev', i)})", F_PCT, "국내 플랫폼 광고선전비율 중앙값 3.3%(비용근거 mkt_ratio_peer_median)", sum5=False)
yline("effCac2", "실효 CAC(총가입 기준)", lambda i: f"=IF({yv('gross_new', i)}=0,0,{yv('mktSum', i)}/{yv('gross_new', i)})", F_WON, "이탈 보전분 포함", sum5=False)

ysec("연 환산 매출 — 개시 계수·월별 누적 반영 전(연말 회원 × 연간 단가 · 사업계획서 방식) · 합계 밖 비교")
for c in cats:
    k = c["key"]
    yline("full_" + k, f"연 환산 — 제품판매 {c['label']}", lambda i, k=k: f"=ROUND({yv('buyers', i)}*{ASCALAR('arpu_'+k)}*{ASCALAR('capture')}*{AREF('ramp', i)},0)", F_MIL, "반영률 적용 전", grp="연 환산")
yline("fullP", "연 환산 — 제품판매 소계", lambda i: f"=SUM({YC[i]}{YR['full_supp']}:{YC[i]}{YR['full_sports']})", F_MIL, "", total=True)
yline("fullChk", "연 환산 — 검진 연계", lambda i: f"=ROUND({yv('active', i)}*{yv('chkShare', i)},0)*{ASCALAR('chkOwnFee')}+({yv('active', i)}-ROUND({yv('active', i)}*{yv('chkShare', i)},0))*{ASCALAR('chkPtnFee')}", F_MIL, "연 환산 검진 예약으로 자사·타사")
yline("fullSvc", "연 환산 — 헬스케어 서비스", lambda i: f"={yv('svcUsers', i)}*{ASCALAR('svcFee')}", F_MIL, "")
yline("fullResv", "연 환산 — 예약 서비스", lambda i: f"={yv('resvFull', i)}*{ASCALAR('resvFee')}", F_MIL, "")
yline("fullCare", "연 환산 — 재가·돌봄 연계", lambda i: f"={yv('careNFull', i)}*{ASCALAR('careFee')}", F_MIL, "")
yline("fullSub", "연 환산 — AI 플랫폼 구독", lambda i: "+".join(f"{yv('paid_'+t, i)}*{yv('fee_'+t, i)}*12" for t in "chp").join(["=", ""]), F_MIL, "유료 기관×월 구독료×12")
yline("fullIns", "연 환산 — 헬스메이트센터 사용료", lambda i: f"=MIN({yv('insCasesFull', i)},{yv('hmCap', i)})*{yv('hmPrice', i)}+MAX(0,{yv('insCasesFull', i)}-{yv('hmCap', i)})*{ASCALAR('hmMarket')}", F_MIL, "연 환산 건수에 같은 한도·단가")
yline("fullRev", "연 환산 매출액 합계", lambda i: "=" + "+".join(yv(k, i) for k in ["fullP", "fullChk", "fullSvc", "fullResv", "fullCare", "fullSub", "fullIns"]), F_MIL, "", total=True)
yline("fullRatio", "반영 매출 ÷ 연 환산 매출", lambda i: f"=IF({yv('fullRev', i)}=0,0,{yv('rev', i)}/{yv('fullRev', i)})", F_PCT, "2027 개시 일정 · 2028~ 산정 방식 효과", sum5=False)

ysec("IM 공급표 대조 — 합계 밖(사용료 모수인 공급 건수가 문서마다 다름 · 대표 결정 필요)")
yline("newConsent", "연 신규 동의", lambda i: f"={yv('mkt', i)}" if i == 0 else f"={yv('mkt', i)}-{YC[i-1]}{YR['mkt']}", F_CNT, "누적 동의의 연 증가분")
yline("imCases", "IM p7 공급 건수(연 신규 동의×집행률)", lambda i: f"=ROUND({yv('newConsent', i)}*{ASCALAR('insConv')},0)", F_CNT, "현대해상 IM 작성프롬프트 v1.2:74 · IM v1.1 p7")
yline("imRev", "IM 건수 기준 사용료(같은 우대·시가 구조)", lambda i: f"=MIN({yv('imCases', i)},{yv('hmCap', i)})*{yv('hmPrice', i)}+MAX(0,{yv('imCases', i)}-{yv('hmCap', i)})*{ASCALAR('hmMarket')}", F_MIL, "IM 원문은 건당 7만 — 공급 건수 차이만 보려고 같은 단가 구조를 적용")
yline("imDiff", "모델(연 환산) − IM 차이(사용료)", lambda i: f"={yv('fullIns', i)}-{yv('imRev', i)}", F_MIL, "연 환산끼리 — 2027 0 · 2028부터 누적 동의 재공급 여부만큼 · 반영 매출(개시 일정·월별 누적)은 더 작다")

# ── 인력계획 연동 지표 · 가정 사무 장비(연간손익 행이 정해진 뒤 채움) ──
DRVF = {"active": lambda i: f"='연간손익'!{YC[i]}{YR['activeAct']}", "me": lambda i: f"='연간손익'!{YC[i]}{YR['me']}",
        "insC": lambda i: f"='연간손익'!{YC[i]}{YR['insCases']}",
        "catNutri": lambda i: f"='연간손익'!{YC[i]}{YR['rev_supp']}+'연간손익'!{YC[i]}{YR['rev_diet']}",
        "catDevice": lambda i: f"='연간손익'!{YC[i]}{YR['rev_device']}",
        "catSports": lambda i: f"='연간손익'!{YC[i]}{YR['rev_sports']}+'연간손익'!{YC[i]}{YR['revResv']}",
        "rev": lambda i: f"='연간손익'!{YC[i]}{YR['rev']}"}
for dk_, fn_ in DRVF.items():
    for i in range(5):
        cell(H, f"{YC[i]}{HR['drv_'+dk_]}", fn_(i), GREEN, F_MIL if dk_ in ("catNutri", "catDevice", "catSports", "rev") else F_CNT)
BASEF = {"catNutri": f"='연간손익'!D{YR['full_supp']}+'연간손익'!D{YR['full_diet']}",
         "catDevice": f"='연간손익'!D{YR['full_device']}",
         "catSports": f"='연간손익'!D{YR['full_sports']}+'연간손익'!D{YR['fullResv']}",
         "rev": f"='연간손익'!D{YR['fullRev']}",
         "active": f"='연간손익'!D{YR['active']}",
         "insC": f"='연간손익'!D{YR['insCasesFull']}"}
for dk_ in ["active", "me", "insC", "catNutri", "catDevice", "catSports", "rev"]:
    cell(H, f"D{HR['base_'+dk_]}", BASEF.get(dk_, f"=D{HR['drv_'+dk_]}"), BLACK, F_MIL if dk_ in ("catNutri", "catDevice", "catSports", "rev") else F_CNT)
    cell(H, f"I{HR['base_'+dk_]}", "2027 연 환산(개시 계수 적용 전)" if dk_ in BASEF else "2027 값 그대로", SUB)
for i in range(5):
    prevh_ = "0" if i == 0 else f"'인력계획'!{YC[i-1]}{HR['headTotal']}"
    cell(A, f"{YC[i]}{AR['capex_office']}", f"=ROUND(MAX(0,'인력계획'!{YC[i]}{HR['headTotal']}-{prevh_})*$D${AR['officePerHead']},0)", GREEN, F_WON)

# ── 모델 대조 블록(finModel.js 실행값 스냅샷) ──
yr += 2
section(Y, yr, "finModel.js 대조 — 대표 조정(약국 1차 200곳 · 기관별 구독료 · 검진 채널 분리 · 서비스 고객 수수료 0 · 헬스메이트센터 사용료 우대·시가 · 신규 스트림 삭제 · 판관비 근거 모델 · v3.0 개시 일정·월별 누적·재가돌봄)만큼 2027부터 매출·원가·판관비·이익에 차이가 난다. 제품판매도 개시 일정·산정 방식만큼 다르다(모델값: finYears(5) 스냅샷 — 1차 가동률 33% · 연말 기준)", 9)
yr += 1
header_row(Y, yr, ["", "계정", ""] + YRS + [""])
yr += 1
YR["chkStart"] = yr
for key, lab, mk in [("rev", "매출액 합계", "revenue"), ("cogs", "매출원가 합계", "cogs"), ("gross", "매출총이익", "gross"),
                     ("sga", "판매관리비 합계", "sga"), ("ebitModel", "영업이익(모델 표기)", "ebit"), ("revP", "제품판매", "revProduct"),
                     ("revIns", "헬스메이트센터 사용료(모델: 보험 중개)", "revInsurance"), ("pay", "인건비", "payroll")]:
    cell(Y, f"B{yr}", lab + " — 모델값", SUB)
    for i in range(5):
        cell(Y, f"{YC[i]}{yr}", Y5[i][mk], BLUE, F_MIL, comment="finModel.js finYears(5)[%d].%s" % (i, mk) if i == 0 else None)
    yr += 1
    cell(Y, f"B{yr}", lab + " — 차이")
    for i in range(5):
        cell(Y, f"{YC[i]}{yr}", f"={YC[i]}{YR[key]}-{YC[i]}{yr-1}", BLACK, F_WON)
    YR["diff_" + key] = yr
    yr += 1

Y.column_dimensions["A"].width = 9
Y.column_dimensions["B"].width = 36
Y.column_dimensions["C"].width = 34
for col in "DEFGH":
    Y.column_dimensions[col].width = 14
Y.column_dimensions["I"].width = 15
Y.freeze_panes = "D5"


# ══════════════════════════════════════ 월별예산 ══════════════════════════════════════
M = wb.create_sheet("월별예산")
cell(M, "A1", "월별 예산 — 2027-01~2031-12(60개월) 세부 계정", TITLE)
cell(M, "A2", "단위: 백만원 · 연간손익의 각 계정을 배분 기준에 따라 월로 편다. 오른쪽 끝에 연간 합계 대조(차이 0이어야 정상).", SUB)
MCOL = [CL(4 + t) for t in range(60)]            # D .. BK
YSUMC = [CL(4 + 60 + i) for i in range(5)]      # BL .. BP 연간 합계
YDIFC = [CL(4 + 65 + i) for i in range(5)]      # BQ .. BU 차이
cell(M, "A4", "구분", HDR, fill=NAVY); cell(M, "B4", "계정", HDR, fill=NAVY); cell(M, "C4", "배분 기준", HDR, fill=NAVY)
cell(M, "A5", "", HDR, fill=NAVY); cell(M, "B5", "", HDR, fill=NAVY); cell(M, "C5", "", HDR, fill=NAVY)
for t in range(60):
    y, m = divmod(t, 12)
    cell(M, f"{MCOL[t]}4", YRS[y] if m == 0 else "", HDR, fill=NAVY)
    cell(M, f"{MCOL[t]}5", f"{m+1:02d}", HDR, fill=NAVY, align=Alignment(horizontal="center"))
    cell(M, f"{MCOL[t]}6", t + 1, SUB, "0", align=Alignment(horizontal="center"))
for i in range(5):
    cell(M, f"{YSUMC[i]}4", "연간 합계", HDR, fill=NAVY); cell(M, f"{YSUMC[i]}5", YRS[i], HDR, fill=NAVY)
    cell(M, f"{YDIFC[i]}4", "연간손익 대비 차이", HDR, fill=NAVY); cell(M, f"{YDIFC[i]}5", YRS[i], HDR, fill=NAVY)
cell(M, "B6", "기간 번호", SUB)
MR = {}
mr = 8


def ycols(y):
    return MCOL[y * 12], MCOL[y * 12 + 11]


def mline(key, label, basis, fn, fmt=F_MIL, total=False, grp="", reconcile_key=None, font=BLACK):
    """fn(t, y, m, col) -> 수식"""
    global mr
    cell(M, f"A{mr}", grp, BOLD if grp else BLACK)
    cell(M, f"B{mr}", label, BOLD if total else BLACK)
    cell(M, f"C{mr}", basis, SUB)
    for t in range(60):
        y, m = divmod(t, 12)
        cell(M, f"{MCOL[t]}{mr}", fn(t, y, m, MCOL[t]), font, fmt, TOT if total else None, bold=total)
    if reconcile_key is not None:
        for i in range(5):
            a, b = ycols(i)
            cell(M, f"{YSUMC[i]}{mr}", f"=SUM({a}{mr}:{b}{mr})", BLACK, fmt, TOT if total else None, bold=total)
            if reconcile_key:
                cell(M, f"{YDIFC[i]}{mr}", f"={YSUMC[i]}{mr}-'연간손익'!{YC[i]}{YR[reconcile_key]}", BLACK, F_WON)
    MR[key] = mr
    mr += 1


def msec(t):
    global mr
    mr += 1
    for col in range(1, 4 + 70):
        M.cell(row=mr, column=col).fill = SEC
    M.cell(row=mr, column=1, value=t).font = Font(name=FONT, size=10, bold=True, color="1A2B4A")
    mr += 1


msec("배분 기준 — 회원 증가 램프가 매출 인식 가중치를 만든다")
mline("ramp", "회원 증가 램프(가중)", "가정 ⑪", lambda t, y, m, c: f"='가정'!{MC[m]}{AR['rampRow']+y}", "0.0", font=GREEN)


def yrange(key, y):
    a, b = ycols(y)
    return f"${a}${MR[key]}:${b}${MR[key]}"


mline("newM", "월 신규 회원", "연간 순증 × 램프 비중",
      lambda t, y, m, c: f"=IF(SUM({yrange('ramp', y)})=0,'연간손익'!${YC[y]}${YR['new']}/12,'연간손익'!${YC[y]}${YR['new']}*{c}{MR['ramp']}/SUM({yrange('ramp', y)}))",
      F_CNT, reconcile_key="new")
mline("endM", "월말 누적 회원", "기초 회원 + 연내 누적 신규",
      lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['mp']}+SUM(${ycols(y)[0]}${MR['newM']}:{c}{MR['newM']})", F_CNT)
mline("w", "회원 가중(연내 비중)", "월말 회원 ÷ 연내 월말 회원 합",
      lambda t, y, m, c: f"=IF(SUM({yrange('endM', y)})=0,1/12,{c}{MR['endM']}/SUM({yrange('endM', y)}))", '0.00%', reconcile_key="")
REVMODE = ASCALAR("revMode")
mline("k", "회원 비율(월말 ÷ 연말)", "월별 누적 산정의 월 기준",
      lambda t, y, m, c: f"=IF('연간손익'!${YC[y]}${YR['me']}=0,0,{c}{MR['endM']}/'연간손익'!${YC[y]}${YR['me']})", '0.00%')
_SR = f"'가정'!$D${AR['season']}:$O${AR['season']}"
mline("sn", "검진 계절 지수(평균 1)", "가정 ⑤-2 × 12 ÷ 합계",
      lambda t, y, m, c: f"=IF(SUM({_SR})=0,1,'가정'!{MC[m]}${AR['season']}*12/SUM({_SR}))", "0.00", font=GREEN)
msec("매출 줄별 월 배분 — 월 기준 b · 개시 반영 g = b × 개시 계수(2027) · 월 배분 a = g ÷ 연내 g 합 · 연 반영률 = 연내 g 합")
for sk_, sl_, sb_ in STREAMS:
    if sb_ == "flat":
        def fb_(t, y, m, c):
            if y == 0:
                return "=1/12"
            num_, den_ = [], []
            for t_ in "chp":
                cur_ = f"'연간손익'!${YC[y]}${YR['paid_'+t_]}"; prev_ = f"'연간손익'!${YC[y-1]}${YR['paid_'+t_]}"
                full_ = f"{cur_}*'연간손익'!${YC[y]}${YR['fee_'+t_]}*12"
                num_.append(f"{full_}*IF({cur_}=0,0,({prev_}+({cur_}-{prev_})*{m+1}/12)/{cur_})")
                den_.append(full_)
            den_s = "+".join(den_)
            return f"=IF(NOT({REVMODE}=2),1/12,IF(({den_s})=0,0,({'+'.join(num_)})/12/({den_s})))"
    elif sb_ == "season":
        fb_ = lambda t, y, m, c: (f"=IF(OR({y}=0,{REVMODE}=2),{c}{MR['k']}*{c}{MR['sn']}/12,IF(SUMPRODUCT({yrange('w', y)},{yrange('sn', y)})=0,{c}{MR['w']},"
                                  f"{c}{MR['w']}*{c}{MR['sn']}/SUMPRODUCT({yrange('w', y)},{yrange('sn', y)})))")
    else:
        fb_ = lambda t, y, m, c: f"=IF(OR({y}=0,{REVMODE}=2),{c}{MR['k']}/12,{c}{MR['w']})"
    mline("b_" + sk_, f"{sl_} — 월 기준", {"flat": "기관 균등(2027) · 2028~ 유형별 기관 경로(월별 누적)", "season": "회원×계절", "member": "회원"}[sb_], fb_, '0.00%', grp=sk_)
    mline("g_" + sk_, f"{sl_} — 개시·성숙 반영", "월 기준 × 개시 계수(2027) · 성숙 계수(2028~)",
          lambda t, y, m, c, sk_=sk_: (f"={c}{MR['b_'+sk_]}*'가정'!{MC[m]}${AR['F_'+sk_]}" if y == 0 else f"={c}{MR['b_'+sk_]}*'가정'!${YC[y]}${AR['M_'+sk_]}"), '0.00%', reconcile_key="")
    mline("a_" + sk_, f"{sl_} — 월 배분", "g ÷ 연내 g 합(0이면 회원 가중)",
          lambda t, y, m, c, sk_=sk_: f"=IF(SUM({yrange('g_'+sk_, y)})=0,{c}{MR['w']},{c}{MR['g_'+sk_]}/SUM({yrange('g_'+sk_, y)}))", '0.00%', reconcile_key="")


def by_weight(akey, wkey="w"):
    return lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR[akey]}*{c}${MR[wkey]}"


msec("매출")
for cc in cats:
    mline("rev_" + cc["key"], f"제품판매 — {cc['label']}", "제품 월 배분", by_weight("rev_" + cc["key"], "a_P"), reconcile_key="rev_" + cc["key"], grp="제품")
mline("revP", "제품판매 소계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['rev_supp']}:{c}{MR['rev_sports']})", total=True, reconcile_key="revP")
mline("revChk", "검진 연계 수수료(자사+타사)", "검진 월 배분(계절)", by_weight("revChk", "a_Chk"), reconcile_key="revChk", grp="수수료")
mline("revSvc", "헬스케어 서비스 — 고객 수수료", "서비스 월 배분", by_weight("revSvc", "a_Svc"), reconcile_key="revSvc")
mline("revResv", "예약 서비스 수수료", "예약 월 배분(계절)", by_weight("revResv", "a_Resv"), reconcile_key="revResv")
mline("revCare", "재가·돌봄 파트너 이용료", "돌봄 월 배분", by_weight("revCare", "a_Care"), reconcile_key="revCare", grp="돌봄")
mline("revSub", "AI 플랫폼 구독(EMR·UIP)", "구독 월 배분", by_weight("revSub", "a_Sub"), reconcile_key="revSub", grp="구독")
mline("hmCasesM", "헬스메이트센터 DB 공급 건수(월 · 계획 기준)", "연간 × 사용료 월 배분 — 커버리지 미반영(현금은 현금·투자금 시트)",
      lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['insCases']}*{c}${MR['a_Ins']}", F_CNT, reconcile_key="insCases", grp="사용료")
mline("hmCumM", "연내 누적 공급 건수", "1월부터 누적",
      lambda t, y, m, c: f"=SUM(${ycols(y)[0]}{MR['hmCasesM']}:{c}{MR['hmCasesM']})", F_CNT)
mline("hmDiscM", "우대 단가 적용 건수(월)", "연내 누적 중 한도 이내분",
      lambda t, y, m, c: f"=MAX(0,MIN({c}{MR['hmCasesM']},'연간손익'!${YC[y]}${YR['hmCap']}-MIN('연간손익'!${YC[y]}${YR['hmCap']},{c}{MR['hmCumM']}-{c}{MR['hmCasesM']})))",
      F_CNT, reconcile_key="hmDiscN")
mline("revIns_d", "헬스메이트센터 사용료 — 우대분", "우대 건수 × 우대 단가",
      lambda t, y, m, c: f"={c}{MR['hmDiscM']}*'연간손익'!${YC[y]}${YR['hmPrice']}", reconcile_key="revIns_d")
mline("revIns_f", "헬스메이트센터 사용료 — 시가분", "(공급 − 우대 건수) × 시가",
      lambda t, y, m, c: f"=({c}{MR['hmCasesM']}-{c}{MR['hmDiscM']})*{ASCALAR('hmMarket')}", reconcile_key="revIns_f")
mline("revIns", "헬스메이트센터 사용료 소계", "연내 한도를 먼저 채우고 초과분 시가", lambda t, y, m, c: f"={c}{MR['revIns_d']}+{c}{MR['revIns_f']}",
      total=True, reconcile_key="revIns")
mline("rev", "매출액 합계", "합계",
      lambda t, y, m, c: f"={c}{MR['revP']}+{c}{MR['revChk']}+{c}{MR['revSvc']}+{c}{MR['revResv']}+{c}{MR['revCare']}+{c}{MR['revSub']}+{c}{MR['revIns']}",
      total=True, reconcile_key="rev")

for sk_, sl_, sb_ in STREAMS:
    for i in range(5):
        a_, b_ = ycols(i)
        base_ = f"IF(AND({i}>0,NOT({REVMODE}=2)),1,SUM('월별예산'!{a_}{MR['g_'+sk_]}:{b_}{MR['g_'+sk_]}))"
        if sk_ == "Ins" and i == 0:                       # 2027 사용료 전량 반영(대표 지시) — 연 환산 = 실제 공급
            base_ = f"IF({ASCALAR('insFullY1')}=1,1,{base_})"
        cell(Y, f"{YC[i]}{YR['eff_'+sk_]}", "=" + base_, BLACK, F_PCT)
mline("wRev", "매출 연동 비용 배분 비중", "월 매출 ÷ 연간 매출(연간 0이면 회원 가중)",
      lambda t, y, m, c: f"=IF('연간손익'!${YC[y]}${YR['rev']}=0,{c}${MR['w']},{c}{MR['rev']}/'연간손익'!${YC[y]}${YR['rev']})", '0.00%', reconcile_key="")


def by_rev(akey):
    return lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR[akey]}*{c}${MR['wRev']}"


msec("매출원가")
mline("cogsP", "제품 원가", "제품 월 배분", by_weight("cogsP", "a_P"), reconcile_key="cogsP", grp="제품")
mline("chkCogs", "검진 3종 원가(자사+타사)", "검진 월 배분", by_weight("chkCogs", "a_Chk"), reconcile_key="chkCogs", grp="서비스")
mline("svcCost", "헬스케어 서비스 원가", "서비스 월 배분", by_weight("svcCost", "a_Svc"), reconcile_key="svcCost")
mline("careCost", "재가·돌봄 연계 원가", "돌봄 월 배분", by_weight("careCost", "a_Care"), reconcile_key="careCost")
mline("subCost", "구독 운영 원가", "구독 월 배분", by_weight("subCost", "a_Sub"), reconcile_key="subCost")
mline("payFee", "결제 대행 수수료", "제품 월 배분", by_weight("payFee", "a_P"), reconcile_key="payFee")
mline("cogs", "매출원가 합계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['cogsP']}:{c}{MR['payFee']})", total=True, reconcile_key="cogs")
mline("gross", "매출총이익", "매출 − 원가", lambda t, y, m, c: f"={c}{MR['rev']}-{c}{MR['cogs']}", total=True, reconcile_key="gross")

msec("판매관리비")
flat12 = lambda akey: (lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR[akey]}/12")
mline("mk1", "① 메디에이지 안내 발송", "연간 ÷ 12", flat12("mk1"), reconcile_key="mk1", grp="마케팅")
mline("media", "② 9채널 매체비", "1차 가정 ⑫ 배분 · 2차부터 ÷ 12",
      lambda t, y, m, c: (f"=IF(SUM('가정'!$D${AR['launchPhaseRow']}:$O${AR['launchPhaseRow']})=0,'연간손익'!$D${YR['media']}/12,'연간손익'!$D${YR['media']}*'가정'!{MC[m]}{AR['launchPhaseRow']}/SUM('가정'!$D${AR['launchPhaseRow']}:$O${AR['launchPhaseRow']}))"
                          if y == 0 else f"='연간손익'!${YC[y]}${YR['media']}/12"), reconcile_key="media")
mline("creative", "② 광고 소재 제작", "연간 ÷ 12", flat12("creative"), reconcile_key="creative")
mline("cardAd", "② 카드사 제휴 타겟 광고", "연간 ÷ 12", flat12("cardAd"), reconcile_key="cardAd")
mline("kit", "④ 검진센터 QR 키트", "연간 ÷ 12", flat12("kit"), reconcile_key="kit")
mline("sticker", "④ 결과지 QR 스티커", "검진 월 배분", by_weight("sticker", "a_Chk"), reconcile_key="sticker")
mline("qrfee", "④ 센터 연계 수수료", "회원 가중", by_weight("qrfee"), reconcile_key="qrfee")
mline("mktSum", "마케팅 소계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['mk1']}:{c}{MR['qrfee']})", total=True, reconcile_key="mktSum")
mline("mediRep", "메디에이지 리포트 구매비", "연간 × 그 달 신규 회원 비중",
      lambda t, y, m, c: f"=IF('연간손익'!${YC[y]}${YR['new']}=0,'연간손익'!${YC[y]}${YR['mediRep']}/12,'연간손익'!${YC[y]}${YR['mediRep']}*{c}{MR['newM']}/'연간손익'!${YC[y]}${YR['new']})",
      reconcile_key="mediRep", grp="제휴 DB")
mline("reward", "포인트(토큰) 적립", "제품 월 배분", by_weight("reward", "a_P"), reconcile_key="reward", grp="고객·사회")
mline("donation", "기부금(치료비 나눔)", "제품 월 배분", by_weight("donation", "a_P"), reconcile_key="donation")
mline("pay", "인건비", "가정 ⑭ 방식(균등/연속 채용)",
      lambda t, y, m, c: f"=IF({ASCALAR('payMode')}=1,'연간손익'!${YC[y]}${YR['pay']}/12,'인력계획'!${YC[y]}${HR['payS']}+('인력계획'!${YC[y]}${HR['payE']}-'인력계획'!${YC[y]}${HR['payS']})*{m}/11)",
      reconcile_key="pay", grp="인력")
mline("itMaint", "AI 시스템 유지보수", "연간 ÷ 12", flat12("itMaint"), reconcile_key="itMaint", grp="AI·데이터")
mline("itData", "데이터 유지관리", "연간 ÷ 12", flat12("itData"), reconcile_key="itData")
mline("itSec", "보안관제", "연간 ÷ 12", flat12("itSec"), reconcile_key="itSec")
mline("cloudBase", "클라우드 기본", "연간 ÷ 12", flat12("cloudBase"), reconcile_key="cloudBase")
mline("cloudVar", "클라우드 회원 연동", "회원 가중", by_weight("cloudVar"), reconcile_key="cloudVar")
mline("llm", "AI 상담 LLM API", "회원 가중", by_weight("llm"), reconcile_key="llm")
mline("bc", "블록체인 앵커링", "회원 가중", by_weight("bc"), reconcile_key="bc")
mline("itOpex", "AI·데이터·클라우드 소계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['itMaint']}:{c}{MR['bc']})", total=True, reconcile_key="itOpex")
mline("salesCost", "영업비", "월 매출 비중", by_rev("salesCost"), reconcile_key="salesCost", grp="운영")
mline("adminCost", "관리비", "월 매출 비중", by_rev("adminCost"), reconcile_key="adminCost")
mline("sga", "판매관리비 합계", "합계", lambda t, y, m, c: "=" + "+".join(f"{c}{MR[k]}" for k in ["mktSum", "mediRep", "reward", "donation", "pay", "itOpex", "salesCost", "adminCost"]), total=True, reconcile_key="sga")

msec("이익 · 투자")
mline("ebitModel", "영업이익(상각 전)", "총이익 − 판관비", lambda t, y, m, c: f"={c}{MR['gross']}-{c}{MR['sga']}", reconcile_key="ebitModel")
mline("depr", "감가상각비", "연간 ÷ 12", lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['depr']}/12", reconcile_key="depr")
mline("ebit", "영업이익(보정)", "상각 전 − 감가상각", lambda t, y, m, c: f"={c}{MR['ebitModel']}-{c}{MR['depr']}", total=True, reconcile_key="ebit")
mline("int", "이자비용", "연간 ÷ 12", lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['int']}/12", reconcile_key="int")
mline("pbt", "법인세차감전이익", "영업이익 − 이자", lambda t, y, m, c: f"={c}{MR['ebit']}-{c}{MR['int']}", total=True, reconcile_key="pbt")
mline("capexBase", "CAPEX 집행 — AI 시스템·보안·장비", "가정 ⑬ 배분",
      lambda t, y, m, c: f"=IF(SUM('가정'!$D${AR['capexPhaseRow']+y}:$O${AR['capexPhaseRow']+y})=0,'연간손익'!${YC[y]}${YR['capexBase']}/12,'연간손익'!${YC[y]}${YR['capexBase']}*'가정'!{MC[m]}{AR['capexPhaseRow']+y}/SUM('가정'!$D${AR['capexPhaseRow']+y}:$O${AR['capexPhaseRow']+y}))",
      reconcile_key="capexBase")
mline("capexBuild1", "CAPEX 집행 — 1차 초기 구축", "계획 기준 표시 — 실제 지급은 준비기간(현금 시트)",
      lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['capexBuild1']}" if m == 0 else "=0", reconcile_key="capexBuild1")
mline("capexMedi", "CAPEX 집행 — 메디에이지 데이터 투자", "계획 기준 표시 — 실제 지급은 준비 첫 달(현금 시트)",
      lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['capexMedi']}" if m == 0 else "=0", reconcile_key="capexMedi")
mline("cumOp", "누적 영업이익(보정)", "월 누적", lambda t, y, m, c: (f"={c}{MR['ebit']}" if t == 0 else f"={MCOL[t-1]}{mr}+{c}{MR['ebit']}"))

M.column_dimensions["A"].width = 9
M.column_dimensions["B"].width = 30
M.column_dimensions["C"].width = 24
for col in MCOL + YSUMC + YDIFC:
    M.column_dimensions[col].width = 10.5
M.freeze_panes = "D7"



# ══════════════════════════════════════ 현금·투자금 ══════════════════════════════════════
from openpyxl.worksheet.datavalidation import DataValidation

C = wb.create_sheet("현금·투자금")
cell(C, "A1", "현금흐름 · 투자금 산정 — 월별 누적 현금 저점 기준(A 계획 · B 보수 · C 게이트 지연)", TITLE)
cell(C, "A2", "필요 총자금 = 누적 현금(조달 전) 최저점 + 안전 버퍼. 투자 요청액 = 필요 총자금 − 전략적 선급(10억 올림). 모델 밖 항목(임차·보증금·채용·일회성)은 현금에만 넣는다.", SUB)
header_row(C, 4, ["구분", "현금 레버", "A 계획", "B 보수", "C 게이트 지연", "단위", "설명"])
CR = {}
cr = 5
LV = ["C", "D", "E"]                                   # 블록별 레버 열
ROAD = [0, 0, 7 / 16, 7 / 16, 7 / 16, 1, 1, 1, 1, 1, 1, 1]
levers = [
    ("pre", "준비기간 — 준비 시작 월부터 오픈 전까지", [3, 5, 5], "개월", "A 대표 일정(2026-09-15): 2026-10 준비 시작 → 2027-01-01 오픈(3개월) · B·C: 오픈 2개월 지연(비용은 그대로 2026-10부터) · 0~24", "0", True),
    ("preOpex", "준비기간 월 운영비(기타 — 항목별로 따로 잡지 않은 비용)", [0, 0, 0], "원/월", "인건비·광고·IT·시스템 설치는 「준비기간 월별 비율」, 임차는 인원 기준, 일회성·메디에이지·이자는 각 레버로 따로", F_WON, False),
    ("lagP", "회수 지연 — 제품판매", [0, 0, 0], "개월", "카드·PG 정산 D+수일 → 같은 달(커머스 개시 2027-07은 가정 ⑤-2 개시 계수에 들어 있음)", "0", False),
    ("lagChk", "회수 지연 — 검진 연계", [1, 1, 1], "개월", "검진기관 월 정산 — 다음 달 입금", "0", True),
    ("lagSvc", "회수 지연 — 헬스케어 서비스 · 재가·돌봄 연계", [1, 1, 1], "개월", "제휴 기관 월 정산 — 다음 달 입금", "0", False),
    ("lagResv", "회수 지연 — 예약 서비스", [1, 1, 1], "개월", "제휴처 월 정산 — 다음 달 입금", "0", False),
    ("lagSub", "회수 지연 — AI 플랫폼 구독", [1, 1, 1], "개월", "기관 후불 청구 — 다음 달 입금(병원·약국 2027-01 과금 → 2027-02 첫 입금)", "0", False),
    ("lagIns", "회수 지연 — 헬스메이트센터 사용료", [1, 2, 2], "개월", "A: 월 정산 다음 달 입금 · B·C: 정산 지연 2개월", "0", True),
    ("cogsLag", "매출원가 지급 지연", [0, 0, 0], "개월", "A·B·C 모두 공급사 신용 0(보수 기준) — 1개월이면 필요자금 감소", "0", False),
    ("wc", "운전자본 증가(매출 대비)", [0, 0, 0], "%", "회수 지연을 항목별로 명시해 0(연간 FCF 메모는 가정 ⑨ 2% 사용)", F_PCT, False),
    ("rent", "1인당 월 임차료(관리비 포함)", [540000, 540000, 540000], "원/인·월", "[추정] 1인 3평 × 평당 월 18만 — 실제 임대 조건으로 교체", F_WON, False),
    ("depMonths", "임차보증금(월세 개월수)", [10, 10, 10], "개월", "[추정] 월세 10개월분", "0", False),
    ("depLook", "보증금 계약 인원 선행 기간", [6, 6, 6], "개월", "향후 N개월 최대 인원으로 계약 · 증액분만 예치", "0", False),
    ("adminHasRent", "관리비에 임차료 포함(1=포함 → 초과분만)", [0, 0, 0], "선택", "0 = 임차료를 인원 기준으로 따로(관리비와 상계하지 않음 — 보수 기준)", "0", False),
    ("hireRate", "채용 수수료(1인당 총인건비 대비)", [0.05, 0.05, 0.05], "%", "[추정] 헤드헌팅 15~20% × 외부 채용 비중 약 30%", F_PCT, False),
    ("oneOff", "일회성 거래비용(실사·법무·등기·사무 세팅)", [150000000, 150000000, 150000000], "원", "준비 첫 달(2026-10)", F_WON, False),
    ("mediQ", "메디에이지 데이터 투자 지급 — 준비 시작 후 N개월째", [1, 1, 1], "개월째", "1 = 준비 첫 달(2026-10) · 준비기간보다 뒤면 그 달 · 준비기간이 0이면 오픈 첫 달", "0", False),
    ("cashStart", "첫 입금 기간 번호(오픈 첫 달 = 1)", [1, 1, 1], "기간", "1 = 회수 지연만 적용(v3.0 — 매출 줄별 개시가 계획에 들어 있음) · 2 이상이면 그 전 매출을 그 달에 한꺼번에", "0", False),
    ("prodStart", "제품판매 추가 지연 — 개시 기간 번호", [1, 1, 1], "기간", "1 = 추가 지연 없음(커머스 2027-07 개시는 가정 ⑤-2에 반영) · 늦추면 그 전 제품 매출·원가·포인트 제외(연간손익은 계획 기준)", "0", False),
    ("preInt", "준비기간에도 이자 반영(1 = 반영)", [1, 1, 1], "선택", "차입이 있다면 준비 시작부터 이자 발생 — 보수 기준", "0", False),
    ("prepay", "전략적 선급액(헬스메이트센터 사용료 선급)", [0, 0, 0], "원", "⚠ 선급은 사용료의 조기 회수이지 신규 자금이 아니다 — 회수에서 상계", F_WON, False),
    ("prepayAt", "선급 수령 기간 번호", [1, 1, 1], "기간", "1 = 1차-01(오픈 첫 달)", "0", False),
    ("repay", "차입 원금 월 상환액", [0, 0, 0], "원/월", "기존 장기차입 만기·상환 조건으로 채울 것", F_WON, False),
    ("repayFrom", "상환 시작 기간 번호", [1, 1, 1], "기간", "", "0", False),
    ("repayTo", "상환 종료 기간 번호", [0, 0, 0], "기간", "0이면 상환 없음", "0", False),
    ("buf", "안전 버퍼", [6, 6, 6], "개월분", "2027년 월평균 고정비 기준 — 요약에 저점 달 기준 환산 병기", "0", True),
]
for k, lab, vals, unit, note, fmt, keyf in levers:
    cell(C, f"B{cr}", lab)
    for bi in range(3):
        v = vals[bi]
        cell(C, f"{LV[bi]}{cr}", v, GREEN if isinstance(v, str) else BLUE, fmt, YELLOW if keyf else None)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR[k] = cr; cr += 1
dvm = DataValidation(type="whole", operator="between", formula1="-23", formula2="60", showErrorMessage=True, error="기간 번호는 −23~60 정수")
C.add_data_validation(dvm)
for k_ in ("mediQ", "cashStart", "prodStart", "prepayAt", "repayFrom", "repayTo"):
    dvm.add(f"C{CR[k_]}:E{CR[k_]}")
dv = DataValidation(type="whole", operator="between", formula1="0", formula2="24", showErrorMessage=True,
                    errorTitle="준비기간", error="0~24개월만 입력할 수 있습니다(준비 열이 24칸).")
C.add_data_validation(dv); dv.add(f"C{CR['pre']}:E{CR['pre']}")
dvr = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", showErrorMessage=True, error="0~1(0%~100%)만 입력")
A.add_data_validation(dvr); dvr.add(f"D{AR['hmRate1']}")
dvn = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", showErrorMessage=True, error="0 이상만 입력")
A.add_data_validation(dvn)
dvn.add(f"E{CHROW['youtube']}:E{CHROW['etc']}")
dvl = DataValidation(type="whole", operator="greaterThanOrEqual", formula1="1", showErrorMessage=True, error="내용연수는 1년 이상 정수")
A.add_data_validation(dvl); dvl.add(f"D{AR['life']}")
for k_ in ("hmInvest", "hmMarket", "hmPriceStep", "hmCap1", "hmCapStep"):
    dvn.add(f"D{AR[k_]}")
cr += 1
section(C, cr, "공통 입력", 7); cr += 1
for k, lab, v, unit, note, fmt in [("startMonth", "준비 시작 월(인건비·광고·시스템 설치 개시)", datetime(2026, 10, 1), "월", "대표 일정 2026-09-15 — 2026-10 본격 준비 · 2027-01-01 오픈 · 병원·약국 구독 01 · 검진·사용료 04부터 서서히 · 커머스·돌봄 07부터", "yyyy-mm"),
                                   ("closeDate", "클로징 기준일", "입력", "", "투자금은 준비 첫 달(2026-10) 전에 들어와야 한다 — 첫 달에 메디에이지 20억 · 시스템 설치 선급 · 일회성 비용이 나간다", None),
                                   ("imAmt", "IM에 적힌 투자 금액", 10000000000, "원", "HI-Fin_현대해상_IM v1.1 — 요청액과 다르면 경고(전략적 투자금은 가정 ⑤ 별도)", F_WON)]:
    cell(C, f"B{cr}", lab)
    cell(C, f"C{cr}", v, GREEN if (isinstance(v, str) and v.startswith("=")) else BLUE, fmt, None)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR[k] = cr; cr += 1
cr += 1
section(C, cr, "월 배분 · 커버리지(오픈 기준 1~12개월째 가중 · 사용료 커버리지는 1차(오픈 후 12개월)에만 — 계획 개시 일정 위에 추가로 곱하는 스트레스)", 7); cr += 1
PHC = [CL(9 + m) for m in range(12)]                  # I .. T
cell(C, f"B{cr}", "월", BOLD)
for m in range(12):
    cell(C, f"{PHC[m]}{cr}", f"1차-{m+1:02d}", BOLD, align=Alignment(horizontal="center"))
cr += 1
PH = {}
for bi, tag in enumerate(["A", "B", "C"]):
    for key, lab in [("launch", "1차 매체비 배분(② 9채널)"), ("capex", "CAPEX 배분(메디에이지 제외)"), ("cov", "사용료 공급 커버리지(0~1)")]:
        cell(C, f"B{cr}", f"{tag} — {lab}")
        for m in range(12):
            if bi == 0 and key in ("launch", "capex"):
                src_row = AR["launchPhaseRow"] if key == "launch" else AR["capexPhaseRow"]
                cell(C, f"{PHC[m]}{cr}", f"='가정'!{MC[m]}{src_row}", GREEN, "0.00")
            else:
                if key == "launch":
                    v = 1
                elif key == "capex":
                    v = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0][m]
                else:
                    v = [1] * 12 if bi < 2 else [0] * 12
                    v = v[m]
                cell(C, f"{PHC[m]}{cr}", v, BLUE, "0.00", YELLOW if key == "cov" else None)
        note = {"launch": "A = 가정 ⑫ 연결 · B·C = 균등(오픈 전 광고는 준비기간 비율로 반영)", "capex": "A = 가정 ⑬ 연결 · B·C = 분기 선집행",
                "cov": ["A = 1(4월 개시·파일럿·권역 확대는 가정 ⑤-2 계획에 들어 있음)", "B = 1(오픈 2개월 지연 · 사용료 정산 2개월로 보수화)", "C = 오픈 후 첫 12개월(2027-03~2028-02) 미공급(법률의견·파일럿 Go 판정 지연) — 달력 2027만이면 C 130억"][bi]}[key]
        cell(C, f"U{cr}", note, SUB)
        PH[(tag, key)] = cr; cr += 1
dvc = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", showErrorMessage=True, error="커버리지는 0~1만 입력")
C.add_data_validation(dvc)
for tag_ in ("A", "B", "C"):
    dvc.add(f"I{PH[(tag_, 'cov')]}:T{PH[(tag_, 'cov')]}")
cr += 1
section(C, cr, "준비기간 월별 비율 — 준비 시작 월 기준(A·B·C 공통 · 오픈이 늦어져도 비용은 같은 달부터) · 인건비·광고·IT는 2027 월평균 대비 · 초기 구축은 배분 가중치", 7); cr += 1
cell(C, f"B{cr}", "준비 시작 후", BOLD)
for m_, lab_ in enumerate(["1개월째", "2개월째", "3개월째", "4개월째", "5개월째", "6개월째 이후"]):
    cell(C, f"{PHC[m_]}{cr}", lab_, BOLD, align=Alignment(horizontal="center"))
cr += 1
PRW = {}
PRE_DEF = {"pay": [0.6, 0.8, 1, 1, 1, 1], "mkt": [0.3, 0.6, 1, 1, 1, 1], "it": [0, 1, 1, 1, 1, 1], "build": [0.3, 0.4, 0.3, 0, 0, 0]}
PRE_NOTE = {"pay": "대표 일정: 2026-10 60% · 11월 80% · 12월 100%(2027-01 오픈 전 채용 완료) — 1차-01 월 인건비(인력계획 ⑦) 대비",
            "mkt": "2026-10 30% · 11월 60% · 12월 100% — 2027 광고비(5대 엔진) 월평균 대비 · 오픈 전 사전 광고로 2027 예산에 더해짐",
            "it": "2026-11(시스템 설치 중)부터 데이터 유지관리·보안관제·클라우드 기본 100%",
            "build": "2026-10 선급 30% · 11월 중도 40% · 12월 잔금 30%(SW 계약 관행 · 오픈 전 완료) — 가중치 합 0이면 오픈 첫 달 일시 · 6개월째 뒤는 0"}
for key_, lab_ in [("pay", "인건비 비율"), ("mkt", "광고비 비율"), ("it", "IT 고정 운영비 비율"), ("build", "초기 구축 배분(가중치)")]:
    cell(C, f"B{cr}", f"준비기간 {lab_}")
    for m_ in range(6):
        cell(C, f"{PHC[m_]}{cr}", PRE_DEF[key_][m_], BLUE, "0.00", YELLOW if key_ == "pay" else None)
    cell(C, f"U{cr}", PRE_NOTE[key_], SUB)
    PRW[key_] = cr; cr += 1
dvw = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", showErrorMessage=True, error="0 이상만 입력")
C.add_data_validation(dvw)
dvw.add(f"I{PRW['pay']}:N{PRW['build']}")
cr += 1

# ── 요약 ──
section(C, cr, "투자금 산정 결과", 7); cr += 1
header_row(C, cr, ["", "항목", "A 계획", "B 보수", "C 게이트 지연", "단위", "읽는 법"]); cr += 1
S_ROWS = [("low", "누적 현금 저점(조달 전)", "백만원", "음수의 크기만큼 현금이 먼저 나간다"),
          ("lowAt", "저점 시기", "기간", "이 달까지 버틸 자금이 있어야 한다"),
          ("lowCal", "저점 달력 월", "월", "준비 시작 월 기준"),
          ("fixed", "월 고정비(2027 월평균)", "백만원", "인건비+AI 유지보수+데이터+보안관제+클라우드 기본+관리비+이자 — 광고는 집행 조절이 가능해 제외"),
          ("buffer", "안전 버퍼", "백만원", "매출이 계획보다 늦을 때의 완충"),
          ("bufMonths", "버퍼 환산 — 저점 달 고정비 기준", "개월", "투자요청서에는 개월 수보다 하방 흡수력으로 표기"),
          ("need", "필요 총자금 = |저점| + 버퍼", "백만원", ""),
          ("prepay", "(−) 전략적 선급", "백만원", "신규 자금이 아니라 매출 조기 회수"),
          ("req", "투자 요청액(신규 · 10억 올림)", "백만원", "투자요청서 기재액"),
          ("pre", "준비기간 비용(이월결손금 시작)", "백만원", "준비 열 인건비·광고·IT·기타·이자·임차·채용·일회성"),
          ("tax1", "법인세 — 1차분(이월결손금 · 사용료 미공급 반영)", "백만원", "이듬해 달력 3월 납부"),
          ("pool1", "  이월결손금 잔액 — 1차 뒤", "백만원", ""),
          ("tax2", "법인세 — 2차분", "백만원", ""),
          ("pool2", "  이월결손금 잔액 — 2차 뒤", "백만원", ""),
          ("tax3", "법인세 — 3차분", "백만원", ""),
          ("pool3", "  이월결손금 잔액 — 3차 뒤", "백만원", ""),
          ("tax4", "법인세 — 4차분", "백만원", "5차분은 계획 기간(60개월) 밖에 납부"),
          ("imGap", "IM 투자 금액 대비", "백만원", "+면 IM보다 더 필요"),
          ("runway", "요청액 조달 시 소진 시기", "기간", "계획 기간 내 소진 없음이 정상")]
for k, lab, unit, note in S_ROWS:
    cell(C, f"B{cr}", lab, BOLD if k in ("need", "req") else BLACK)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR["s_" + k] = cr; cr += 1
cr += 1
section(C, cr, "점검", 7); cr += 1
CR["warnStart"] = cr
cr += 7

# ── 월별 그리드(준비 24열 + 본 기간 60열) ──
PRE = 24
GC = [CL(3 + j) for j in range(PRE + 60)]            # C .. CH
GL = GC[-1]


def grid_header(r0):
    cell(C, f"A{r0}", "", HDR, fill=NAVY); cell(C, f"B{r0}", "기간", HDR, fill=NAVY)
    cell(C, f"A{r0+1}", "", HDR, fill=NAVY); cell(C, f"B{r0+1}", "기간 번호(0 이하 = 준비기간)", HDR, fill=NAVY)
    for j, col in enumerate(GC):
        if j < PRE:
            lab = f"준비-{PRE-j}"; idx = j - PRE + 1
        else:
            t = j - PRE; lab = f"{t//12+1}차-{t%12+1:02d}"; idx = t + 1
        cell(C, f"{col}{r0}", lab, HDR, fill=NAVY, align=Alignment(horizontal="center"))
        cell(C, f"{col}{r0+1}", idx, HDR, "0", fill=NAVY, align=Alignment(horizontal="center"))


MRNG = lambda key: f"'월별예산'!$D${MR[key]}:$BK${MR[key]}"
VAR = f"(({ASCALAR('salesRate')}+{ASCALAR('adminRate')})*{ASCALAR('opexScale')})"
PAYS1 = f"'인력계획'!$D${HR['payS']}"
AVGSAL = f"'인력계획'!$D${HR['avgSal']}:$H${HR['avgSal']}"


def block(tag, bi, r0):
    R = {}
    LC = LV[bi]
    lv = lambda k: f"${LC}${CR[k]}"
    short = ["A", "B", "C"][bi]
    php = lambda key: f"$I${PH[(short, key)]}:$T${PH[(short, key)]}"
    section(C, r0, f"{tag} — 월별 현금흐름", 3); r0 += 1
    grid_header(r0); R["lab"] = r0; R["idx"] = r0 + 1; r0 += 2
    ri = R["idx"]
    cell(C, f"B{r0}", "달력 월", BOLD)
    for j_, col_ in enumerate(GC):
        cell(C, f"{col_}{r0}", f'=IF({col_}${ri}<=-{lv("pre")},"-",TEXT(EDATE($C${CR["startMonth"]},{col_}${ri}+{lv("pre")}-1),"yyyy-mm"))', BOLD, align=Alignment(horizontal="center"))
    R["cal"] = r0; r0 += 1
    prw = lambda key: f"$I${PRW[key]}:$N${PRW[key]}"
    WGT = lambda key, col: f"INDEX({prw(key)},1,MIN({col}${ri}+{lv('pre')},6))"
    BSUM = f"SUMPRODUCT({prw('build')},--({{1,2,3,4,5,6}}<={lv('pre')}))"
    GATE = lambda src, lagk, off=0: (lambda col: f"=IF({I(col)}<{lv('cashStart')},0,IF({I(col)}={lv('cashStart')},IF({lv('cashStart')}-{lv(lagk)}<1,0,SUM(INDEX({src},1,{1+off}):INDEX({src},1,{lv('cashStart')}-{lv(lagk)}+{off}))),IF({I(col)}-{lv(lagk)}<1,0,INDEX({src},1,{I(col)}-{lv(lagk)}+{off}))))")
    I = lambda col: f"{col}${ri}"                      # 기간 번호
    YEAR = lambda col: f"(INT(({I(col)}-1)/12)+1)"
    MON = lambda col: f"(MOD({I(col)}-1,12)+1)"
    M_AT = lambda key, col, shift="": f"INDEX({MRNG(key)},1,{I(col)}{shift})"
    SAME = lambda key, col: f"IF({I(col)}<1,0,{M_AT(key, col)})"

    def row(key, label, fn, bold=False, fill=None, fmt=F_MIL, font=BLACK):
        nonlocal r0
        cell(C, f"B{r0}", label, BOLD if bold else font)
        for col in GC:
            cell(C, f"{col}{r0}", fn(col), font, fmt, fill, bold=bold)
        R[key] = r0; r0 += 1

    cell(C, f"A{r0}", "보조", SUB)
    row("heads", "월 인원(월 인건비×12 ÷ 1인당 연 인건비)",
        lambda col: f"=IF({I(col)}<1,IF({I(col)}>-{lv('pre')},{PAYS1}*{WGT('pay', col)}*12/INDEX({AVGSAL},1,1),0),{M_AT('pay', col)}*12/INDEX({AVGSAL},1,{YEAR(col)}))",
        fmt='#,##0.0', font=SUB)
    row("hmDel", "사용료 공급 건수(커버리지 반영)",
        lambda col: f"=IF({I(col)}<1,0,{M_AT('hmCasesM', col)}*IF({I(col)}<=12,INDEX({php('cov')},1,{I(col)}),1))", fmt=F_CNT, font=SUB)

    def ystart(col):                                   # 같은 연차 1월 열(본 기간만)
        j = GC.index(col)
        return GC[PRE + ((j - PRE) // 12) * 12]

    def hm_at(col, key):
        return f"'연간손익'!${YC[(GC.index(col) - PRE) // 12]}${YR[key]}"
    row("rChk", "검진 연계 매출(발생)", lambda col: f"={SAME('revChk', col)}", font=SUB)
    row("rP", "제품판매 매출(발생 · 개시 전 0)", lambda col: f"=IF({I(col)}<{lv('prodStart')},0,{SAME('revP', col)})", font=SUB)
    row("rSub", "AI 플랫폼 구독 매출(발생)", lambda col: f"={SAME('revSub', col)}", font=SUB)
    row("rCare", "재가·돌봄 연계 매출(발생)", lambda col: f"={SAME('revCare', col)}", font=SUB)
    row("rOth", "기타 매출(예약·서비스 · 발생)", lambda col: f"={SAME('revResv', col)}+{SAME('revSvc', col)}", font=SUB)
    row("hmDelCum", "연내 누적 공급 건수(커버리지 반영)",
        lambda col: "=0" if GC.index(col) < PRE else f"=SUM(${ystart(col)}{R['hmDel']}:{col}{R['hmDel']})", fmt=F_CNT, font=SUB)
    row("insRec", "사용료 매출(커버리지 반영 · 실제 공급 건수로 한도 적용)",
        lambda col: "=0" if GC.index(col) < PRE else
        (f"={col}{R['hmDel']}*{ASCALAR('hmMarket')}-MAX(0,MIN({col}{R['hmDel']},{hm_at(col, 'hmCap')}-MIN({hm_at(col, 'hmCap')},{col}{R['hmDelCum']}-{col}{R['hmDel']})))"
         f"*({ASCALAR('hmMarket')}-{hm_at(col, 'hmPrice')})"), font=SUB)
    hr_first = GC[0]; hr_last = GC[-1]
    row("req", "보증금 필요액(향후 인원 기준)",
        lambda col: f"=IF({I(col)}<=-{lv('pre')},0,MAX({col}{R['heads']}:INDEX(${hr_first}${R['heads']}:${hr_last}${R['heads']},1,MIN({PRE+60},{I(col)}+{PRE}+{lv('depLook')}-1)))*{lv('rent')}*{lv('depMonths')})",
        font=SUB)
    cell(C, f"A{r0}", "유입", BOLD)

    def lagged(key, lagk):
        return GATE(MRNG(key), lagk)
    row("inP", "제품판매 회수", GATE(f"${hr_first}${R['rP']}:${hr_last}${R['rP']}", "lagP", PRE))
    row("inChk", "검진 연계 회수", lagged("revChk", "lagChk"))
    row("inSvc", "헬스케어 서비스 회수", lagged("revSvc", "lagSvc"))
    row("inCare", "재가·돌봄 연계 회수", lagged("revCare", "lagSvc"))
    row("inResv", "예약 서비스 회수", lagged("revResv", "lagResv"))
    row("inSub", "AI 플랫폼 구독 회수", lagged("revSub", "lagSub"))
    row("insCol", "헬스메이트센터 사용료 회수(선급 상계 전)", GATE(f"${hr_first}${R['insRec']}:${hr_last}${R['insRec']}", "lagIns", PRE))
    first = GC[0]
    prev = lambda col: GC[GC.index(col) - 1]
    # 선급 상계 — 잔액 보조행(다음 행)을 참조하므로 행 번호를 미리 잡는다
    r_off, r_bal = r0, r0 + 1
    recv = lambda col: f"IF({I(col)}={lv('prepayAt')},{lv('prepay')},0)"
    bal_prev = lambda col: ("0" if col == first else f"{prev(col)}{r_bal}")
    row("offset", "선급 상계(비현금)", lambda col: f"=IF({I(col)}<1,0,MIN({bal_prev(col)}+{recv(col)},{col}{R['insCol']}))")
    row("prepayBal", "선급 잔액(보조)", lambda col: f"={bal_prev(col)}+{recv(col)}-{col}{r_off}", font=SUB)
    row("inIns", "헬스메이트센터 사용료 회수(현금)", lambda col: f"={col}{R['insCol']}-{col}{R['offset']}")
    row("inTot", "유입 합계", lambda col: f"={col}{R['inP']}+{col}{R['inChk']}+{col}{R['inSvc']}+{col}{R['inCare']}+{col}{R['inResv']}+{col}{R['inSub']}+{col}{R['inIns']}", True, TOT)
    cell(C, f"A{r0}", "유출", BOLD)
    row("oCogs", "매출원가(제품판매 개시 전 제품 원가·결제 수수료 제외)", lambda col: f"=IF({I(col)}-{lv('cogsLag')}<1,0,{M_AT('cogs', col, '-' + lv('cogsLag'))}-IF({I(col)}-{lv('cogsLag')}<{lv('prodStart')},{M_AT('cogsP', col, '-' + lv('cogsLag'))}+{M_AT('payFee', col, '-' + lv('cogsLag'))},0))")
    row("oCust", "포인트 적립 · 기부금(제품판매 개시부터)", lambda col: f"=IF({I(col)}<{lv('prodStart')},0,{SAME('reward', col)}+{SAME('donation', col)})")
    row("oMkt", "광고 — ① 안내 발송 · ② 소재·카드사 · ④ QR", lambda col: "=" + "+".join(SAME(k, col) for k in ["mk1", "creative", "cardAd", "kit", "sticker", "qrfee"]))
    row("oMedia", "② 9채널 매체비(1차 배분 가중 · 2차부터 균등)",
        lambda col: f"=IF({I(col)}<1,0,IF({YEAR(col)}=1,'연간손익'!$D${YR['media']}*IF(SUM({php('launch')})=0,1/12,INDEX({php('launch')},1,{MON(col)})/SUM({php('launch')})),INDEX('연간손익'!$D${YR['media']}:$H${YR['media']},1,{YEAR(col)})/12))")
    row("oCapex", "CAPEX — AI 시스템·보안·장비",
        lambda col: f"=IF({I(col)}<1,0,INDEX('연간손익'!$D${YR['capexBase']}:$H${YR['capexBase']},1,{YEAR(col)})*IF(SUM({php('capex')})=0,1/12,INDEX({php('capex')},1,{MON(col)})/SUM({php('capex')})))")
    row("oPay", "인건비", lambda col: f"={SAME('pay', col)}")
    row("oOpex", "AI·데이터·클라우드 · 영업 · 관리", lambda col: "=" + "+".join(SAME(k, col) for k in ["itMaint", "itData", "itSec", "cloudBase", "cloudVar", "llm", "bc", "salesCost", "adminCost"]))
    row("oInt", "이자", lambda col: f"={SAME('int', col)}")
    row("oWc", "운전자본 증가", lambda col: f"=IF({I(col)}<1,0,({M_AT('rev', col)}-{M_AT('revIns', col)}+{col}{R['insRec']})*{lv('wc')})")
    row("oTax", "법인세 납부(달력 3월 · 직전 연도분 · 2027분은 2026 준비기간 비용 이월)",
        lambda col: f"=IF({I(col)}<1,0,IF(AND(MONTH(EDATE($C${CR['startMonth']},{I(col)}+{lv('pre')}-1))=3,INT(({I(col)}-1)/12)>=1),CHOOSE(INT(({I(col)}-1)/12),{LC}${CR['s_tax1']},{LC}${CR['s_tax2']},{LC}${CR['s_tax3']},{LC}${CR['s_tax4']},0),0))")
    row("oCovSave", "(−) 사용료 미공급분 매출연동 비용 절감(커버리지)",
        lambda col: f"=-IF({I(col)}<1,0,({M_AT('revIns', col)}-{col}{R['insRec']})*{VAR})")
    row("oRent", "임차료(인원 연동 · 모델 밖)",
        lambda col: f"=IF({I(col)}<1,{col}{R['heads']}*{lv('rent')},IF({lv('adminHasRent')}=1,MAX(0,{col}{R['heads']}*{lv('rent')}-{M_AT('adminCost', col)}),{col}{R['heads']}*{lv('rent')}))")
    row("oDep", "임차보증금 예치(증액분)",
        lambda col: (f"=MAX(0,{col}{R['req']})" if col == first else f"=MAX(0,{col}{R['req']}-MAX(${first}${R['req']}:{prev(col)}{R['req']}))"))
    row("oHire", "채용 수수료",
        lambda col: f"=MAX(0,{col}{R['heads']}-" + ("0" if col == first else f"{prev(col)}{R['heads']}") + f")*IF({I(col)}<1,INDEX({AVGSAL},1,1),INDEX({AVGSAL},1,{YEAR(col)}))*{lv('hireRate')}")
    row("oOne", "일회성 거래비용", lambda col: f"=IF({I(col)}=IF({lv('pre')}>0,1-{lv('pre')},1),{lv('oneOff')},0)")
    row("oBuild", "1차 초기 구축 — 시스템 설치(AI 모듈·공통·보안 인증)",
        lambda col: f"=IF({BSUM}>0,IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),'연간손익'!$D${YR['capexBuild1']}*({I(col)}+{lv('pre')}<=6)*{WGT('build', col)}/{BSUM},0),IF({I(col)}=1,'연간손익'!$D${YR['capexBuild1']},0))")
    row("oMedi", "메디에이지 리포트 구매(제휴 DB 가입 회원 · 발생 월)", lambda col: f"=IF({I(col)}<1,0,{SAME('mediRep', col)})")
    row("oPrePay", "준비기간 인건비", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),{PAYS1}*{WGT('pay', col)},0)")
    row("oPreOpex", "준비기간 기타 운영비", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),{lv('preOpex')},0)")
    row("oPreMkt", "준비기간 광고(오픈 전 사전 광고 — 발송·매체·소재·카드사)", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),('연간손익'!$D${YR['mk1']}+'연간손익'!$D${YR['media']}+'연간손익'!$D${YR['creative']}+'연간손익'!$D${YR['cardAd']})/12*{WGT('mkt', col)},0)")
    row("oPreInt", "준비기간 이자", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),{ASCALAR('interest')}/12*{lv('preInt')},0)")
    row("oPreIT", "준비기간 IT 운영(준비 2개월째부터)", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),('연간손익'!$D${YR['itData']}+'연간손익'!$D${YR['itSec']}+'연간손익'!$D${YR['cloudBase']})/12*{WGT('it', col)},0)")
    row("oRepay", "차입 원금 상환", lambda col: f"=IF(AND({I(col)}>={lv('repayFrom')},{I(col)}<={lv('repayTo')}),{lv('repay')},0)")
    row("outTot", "유출 합계", lambda col: f"=SUM({col}{R['oCogs']}:{col}{R['oRepay']})", True, TOT)
    row("net", "순현금흐름", lambda col: f"={col}{R['inTot']}-{col}{R['outTot']}", True)
    r_cum = r0
    row("cum", "누적 현금(조달 전)", lambda col: (f"={col}{R['net']}" if col == first else f"={prev(col)}{r_cum}+{col}{R['net']}"), True, KEY)
    row("fixedM", "월 고정비(버퍼 환산용)", lambda col: "=" + "+".join(SAME(k, col) for k in ["pay", "itMaint", "itData", "itSec", "cloudBase", "adminCost", "int"]), font=SUB)
    row("funded", "조달 후 누적 현금(요청액+선급)",
        lambda col: f"={LC}${CR['s_req']}+IF(AND({lv('prepay')}>0,{I(col)}>={lv('prepayAt')}),{lv('prepay')},0)+{col}{R['cum']}", font=SUB)
    row("flag", "소진 플래그", lambda col: f"=IF({col}{R['funded']}<0,1,0)", fmt="0", font=SUB)
    return R, r0 + 1


RA, cr = block("A 계획", 0, cr)
RB, cr = block("B 보수", 1, cr)
RC, cr = block("C 게이트 지연", 2, cr)
RBL = [RA, RB, RC]

for bi, R in enumerate(RBL):
    LC = LV[bi]
    cum = f"$C${R['cum']}:${GL}${R['cum']}"
    lab = f"$C${R['lab']}:${GL}${R['lab']}"
    pos = f"MATCH(MIN({cum}),{cum},0)"
    cell(C, f"{LC}{CR['s_low']}", f"=MIN(0,MIN({cum}))", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_lowAt']}", f'=IF(MIN({cum})>=0,"저점 없음",INDEX({lab},1,{pos}))', BLACK, align=Alignment(horizontal="right"))
    pre_rows = ["oPrePay", "oPreMkt", "oPreIT", "oPreOpex", "oPreInt", "oRent", "oHire", "oOne"]
    cell(C, f"{LC}{CR['s_pre']}", "=" + "+".join(f"SUM($C${R[k]}:${GC[PRE-1]}${R[k]})" for k in pre_rows), BLACK, F_MIL)
    base1_ = f"('연간손익'!$D${YR['pbt']}-('연간손익'!$D${YR['revIns']}-SUM(${GC[PRE]}${R['insRec']}:${GC[PRE+11]}${R['insRec']}))*(1-{VAR}))"
    cell(C, f"{LC}{CR['s_tax1']}", f"=MAX(0,{base1_}-{LC}{CR['s_pre']})*{ASCALAR('tax')}", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_pool1']}", f"=MAX(0,{LC}{CR['s_pre']}-{base1_})", SUB, F_MIL)
    for k_, pk_, yc_ in (("tax2", "pool1", "E"), ("tax3", "pool2", "F"), ("tax4", "pool3", "G")):
        cell(C, f"{LC}{CR['s_'+k_]}", f"=MAX(0,'연간손익'!${yc_}${YR['pbt']}-{LC}{CR['s_'+pk_]})*{ASCALAR('tax')}", BLACK, F_MIL)
    for k_, pk_, yc_ in (("pool2", "pool1", "E"), ("pool3", "pool2", "F")):
        cell(C, f"{LC}{CR['s_'+k_]}", f"=MAX(0,{LC}{CR['s_'+pk_]}-'연간손익'!${yc_}${YR['pbt']})", SUB, F_MIL)
    cell(C, f"{LC}{CR['s_lowCal']}", f'=IF(MIN({cum})>=0,"",INDEX($C${R["cal"]}:${GL}${R["cal"]},1,{pos}))', BLACK, align=Alignment(horizontal="right"))
    cell(C, f"{LC}{CR['s_fixed']}", "=(" + "+".join("'연간손익'!$D$%d" % YR[k] for k in ["pay", "itMaint", "itData", "itSec", "cloudBase", "adminCost", "int"]) + ")/12", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_buffer']}", f"=${LC}${CR['buf']}*{LC}{CR['s_fixed']}", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_bufMonths']}", f"=IFERROR({LC}{CR['s_buffer']}/INDEX($C${R['fixedM']}:${GL}${R['fixedM']},1,{pos}),0)", BLACK, "0.0")
    cell(C, f"{LC}{CR['s_need']}", f"=-{LC}{CR['s_low']}+{LC}{CR['s_buffer']}", BLACK, F_MIL, KEY, bold=True)
    cell(C, f"{LC}{CR['s_prepay']}", f"=${LC}${CR['prepay']}", GREEN, F_MIL)
    cell(C, f"{LC}{CR['s_req']}", f"=ROUNDUP(MAX(0,{LC}{CR['s_need']}-{LC}{CR['s_prepay']})/1000000000,0)*1000000000", BLACK, F_MIL, YELLOW, bold=True)
    cell(C, f"{LC}{CR['s_imGap']}", f"={LC}{CR['s_req']}-$C${CR['imAmt']}", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_runway']}", f'=IFERROR(INDEX({lab},1,MATCH(1,$C${R["flag"]}:${GL}${R["flag"]},0)),"소진 없음")', BLACK, align=Alignment(horizontal="right"))

w = CR["warnStart"]
warns = [
    f'=IF(MAX(C{CR["pre"]}:E{CR["pre"]})>24,"⚠ 준비기간이 24개월을 넘음 — 계산이 맞지 않으니 24 이하로","✓ 준비기간 정상(0~24)")',
    f'=IF(COUNTIF(\'인력계획\'!D{HR["payWarn"]}:H{HR["payWarn"]},"정상")+COUNTIF(\'인력계획\'!D{HR["payWarn"]}:H{HR["payWarn"]},"균등 모드 — 해당 없음")=5,"✓ 인건비 월 경로 정상","⚠ 인건비 월 경로 이상 — 인력계획 점검 행 확인")',
    f'=IF(ABS(D{CR["s_req"]}-$C${CR["imAmt"]})>=1000000000,"⚠ IM 투자 금액("&TEXT($C${CR["imAmt"]}/100000000,"0")&"억)과 B 요청액("&TEXT(D{CR["s_req"]}/100000000,"0")&"억)이 다릅니다"&IF(C{CR["s_req"]}>$C${CR["imAmt"]}," · 최소(A) "&TEXT(C{CR["s_req"]}/100000000,"0")&"억도 IM 초과","")&" — 문서 금액 통일 필요","✓ IM 금액과 B 요청액 일치")',
    f'=IF(SUM(C{CR["prepay"]}:E{CR["prepay"]})>0,"⚠ 전략적 선급 사용 중 — 투자금 헤드라인에 선급을 더하지 말 것","✓ 선급 없음")',
    f'=IF(AND(\'연간손익\'!D{YR["ebit"]}>0,\'연간손익\'!D{YR["ebitExIns"]}<\'연간손익\'!D{YR["ebit"]}*0.2),"ⓘ 2027 보정 영업이익 중 사용료 제외 시 "&TEXT(\'연간손익\'!D{YR["ebitExIns"]}/100000000,"0.0")&"억 — 흑자가 헬스메이트센터 사용료에 달려 있음",IF(AND(\'연간손익\'!E{YR["ebit"]}>0,\'연간손익\'!E{YR["ebitExIns"]}<\'연간손익\'!E{YR["ebit"]}*0.2),"ⓘ 2028 보정 영업이익 "&TEXT(\'연간손익\'!E{YR["ebit"]}/100000000,"0.0")&"억 중 사용료 제외 시 "&TEXT(\'연간손익\'!E{YR["ebitExIns"]}/100000000,"0.0")&"억 — 2028 흑자가 헬스메이트센터 사용료에 달려 있음","✓ 사용료 제외해도 흑자 연도의 이익이 남음"))',
    f'=IF(OR(ABS(\'가정\'!D{AR["chShareSum"]}-1)>0.0001,\'가정\'!D{AR["mk2Cpm"]}=0,ROUND(SUM($C${RA["oMedi"]}:${GL}${RA["oMedi"]})-SUM(\'연간손익\'!D{YR["mediRep"]}:H{YR["mediRep"]}),0)<>0,ROUND(SUM($C${RA["oBuild"]}:${GL}${RA["oBuild"]})-\'연간손익\'!D{YR["capexBuild1"]},0)<>0),"⚠ 입력 점검 — 9채널 비중 합계≠100% · 채널 CPM 0 · 메디에이지/초기 구축 지급 누락 중 하나","✓ 입력 점검 정상(채널 비중·CPM · 메디에이지·초기 구축 지급)")',
]
_FR = f"'가정'!$D${AR['F_P']}:$O${AR['F_Ins']}"; _MR = f"'가정'!$E${AR['M_P']}:$H${AR['M_Ins']}"; _RM = f"'가정'!$D${AR['revMode']}"
warns.append(f'=IF(OR(AND({_RM}<>1,{_RM}<>2),MAX({_FR})>1,MIN({_FR})<0,MAX({_MR})>1,MIN({_MR})<0),"⚠ 매출 개시 입력 — 산정 방식은 1·2, 개시·성숙 계수는 0~1",IF(EDATE($C${CR["startMonth"]},$C${CR["pre"]})<>DATE(2027,1,1),"ⓘ A 오픈 월이 2027-01이 아님 — 연차·개시 월 표기는 A 오픈 기준으로 읽을 것","✓ 매출 개시 입력 정상 · A 오픈 2027-01(연차 = 달력 연도)"))')
for i_, f_ in enumerate(warns):
    cell(C, f"B{w+i_}", f_, BLACK)
cell(Y, f"D{YR['nolOpen']}", f"='현금·투자금'!$C${CR['s_pre']}", GREEN, F_MIL)
# 가정 ⑤-2 월 머리글 — A 오픈 기준 달력 월(현금 시트 행이 정해진 뒤)
for m_ in range(12):
    cell(A, f"{CL(4 + m_)}{AR['F_hdr']}", f"=TEXT(EDATE('현금·투자금'!$C${CR['startMonth']},'현금·투자금'!$C${CR['pre']}+{m_}),\"yyyy-mm\")", BOLD, align=Alignment(horizontal="center"))
# 입력 검증 — v3.0 매출 개시 입력
dv3r = DataValidation(type="whole", operator="between", formula1="1", formula2="2", showErrorMessage=True, error="1(연말 기준) 또는 2(월별 누적)")
A.add_data_validation(dv3r); dv3r.add(f"D{AR['revMode']}")
dv3f = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", showErrorMessage=True, error="0~1만 입력(25%는 0.25)")
A.add_data_validation(dv3f); dv3f.add(f"D{AR['F_P']}:O{AR['F_Ins']}"); dv3f.add(f"E{AR['M_P']}:H{AR['M_Ins']}")
dv3s = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", showErrorMessage=True, error="0 이상만 입력")
A.add_data_validation(dv3s); dv3s.add(f"D{AR['season']}:O{AR['season']}"); dv3s.add(f"D{AR['careRate']}"); dv3s.add(f"D{AR['careFee']}")
dv3y = DataValidation(type="whole", operator="between", formula1="1", formula2="5", showErrorMessage=True, error="1~5 연차")
A.add_data_validation(dv3y); dv3y.add(f"D{AR['subStart_c']}:D{AR['subStart_p']}")
dv3c = DataValidation(type="decimal", operator="greaterThan", formula1="0", showErrorMessage=True, error="0보다 커야 함")
A.add_data_validation(dv3c); dv3c.add(f"D{AR['carePerCenter']}")

C.column_dimensions["A"].width = 6
C.column_dimensions["B"].width = 42
for col in GC:
    C.column_dimensions[col].width = 10
for col, wd in (("C", 15), ("D", 15), ("E", 15), ("F", 11), ("G", 14)):
    C.column_dimensions[col].width = wd
C.freeze_panes = "C5"


# ══════════════════════════════════════ 월별 자금필요표 ══════════════════════════════════════
NMM = 39
MM = [CL(4 + k) for k in range(NMM)]                 # D .. AP
FT = wb.create_sheet("월별자금필요표")
cell(FT, "A1", "월별 자금필요표 — 준비 시작 월부터 39개월(2026-10~2029-12 · 달력 월)", TITLE)
_SM = f"'현금·투자금'!$C${CR['startMonth']}"
cell(FT, "A2", '="선택 기준: "&CHOOSE($C$4,"A 계획","B 보수","C 게이트 지연")&" · 준비 시작 "&TEXT(' + _SM + ',"yyyy-mm")&" · 오픈 "&TEXT(EDATE(' + _SM + ',CHOOSE($C$4,\'현금·투자금\'!$C$' + str(CR['pre']) + ',\'현금·투자금\'!$D$' + str(CR['pre']) + ',\'현금·투자금\'!$E$' + str(CR['pre']) + ')),"yyyy-mm")&" · 대표 일정(A): 병원·약국 구독 2027-01 · 건강검진·헬스메이트센터 사용료 2027-04부터 서서히 · 건강커머스·재가돌봄 2027-07부터 · 단위 백만원"', SUB)
cell(FT, "B4", "기준 선택(1=A 계획 · 2=B 보수 · 3=C 게이트 지연)", BOLD)
cell(FT, "C4", 1, BLUE, "0", YELLOW)
dvf = DataValidation(type="whole", operator="between", formula1="1", formula2="3", showErrorMessage=True, error="1~3만 입력")
FT.add_data_validation(dvf); dvf.add("C4")
cell(FT, "D4", '=CHOOSE($C$4,"A 계획","B 보수","C 게이트 지연")', BOLD)
FSEL = lambda key: f"CHOOSE($C$4,'현금·투자금'!$C${CR['s_'+key]},'현금·투자금'!$D${CR['s_'+key]},'현금·투자금'!$E${CR['s_'+key]})"
PRESEL = f"CHOOSE($C$4,'현금·투자금'!$C${CR['pre']},'현금·투자금'!$D${CR['pre']},'현금·투자금'!$E${CR['pre']})"
fr = 6
section(FT, fr, "요약", 6); fr += 1
FR = {}
for k_, lab_, fmt_ in [("req", "투자 요청액(10억 올림)", F_MIL), ("need", "필요 총자금 = |저점| + 안전 버퍼", F_MIL), ("low", "누적 현금 저점(조달 전)", F_MIL),
                       ("lowCal", "저점 달력 월", None), ("buffer", "안전 버퍼(2027 월 고정비 6개월분)", F_MIL)]:
    cell(FT, f"B{fr}", lab_, BOLD if k_ == "req" else BLACK)
    cell(FT, f"C{fr}", "=" + FSEL(k_), GREEN, fmt_, YELLOW if k_ == "req" else None, bold=(k_ == "req"), align=Alignment(horizontal="right"))
    FR[k_] = fr; fr += 1
cell(FT, f"B{fr}", "투자 후 최저 잔액 = 요청액 + 저점"); cell(FT, f"C{fr}", f"=C{FR['req']}+C{FR['low']}", BLACK, F_MIL); FR["minBal"] = fr; fr += 1
cell(FT, f"B{fr}", "오픈 첫 달"); cell(FT, f"C{fr}", f"=TEXT(EDATE('현금·투자금'!$C${CR['startMonth']},{PRESEL}),\"yyyy-mm\")", BLACK, align=Alignment(horizontal="right")); fr += 2

header_row(FT, fr, ["구분", "항목", "39개월 합계"] + [""] * NMM)
FR["head"] = fr
TBL = lambda key, k: "CHOOSE($C$4," + ",".join(f"INDEX('현금·투자금'!$C${R_[key]}:${GL}${R_[key]},1,25-'현금·투자금'!${LC_}${CR['pre']}+{k})" for R_, LC_ in zip((RA, RB, RC), ("C", "D", "E"))) + ")"
for k in range(NMM):
    cell(FT, f"{MM[k]}{fr}", f"={TBL('cal', k)}", HDR, fill=NAVY, align=Alignment(horizontal="center"))
fr += 1
cell(FT, f"B{fr}", "모델 기간", SUB)
for k in range(NMM):
    cell(FT, f"{MM[k]}{fr}", f"={TBL('lab', k)}", SUB, align=Alignment(horizontal="center"))
FR["lab"] = fr; fr += 1


def frow(key, label, parts, grp="", fmt=F_MIL, total=True, bold=False, fill=None, stock=False):
    global fr
    cell(FT, f"A{fr}", grp, BOLD if grp else BLACK)
    cell(FT, f"B{fr}", label, BOLD if bold else BLACK)
    for k in range(NMM):
        cell(FT, f"{MM[k]}{fr}", "=" + "+".join(TBL(pk, k) for pk in parts), BLACK, fmt, fill, bold=bold)
    if not stock:
        cell(FT, f"C{fr}", f"=SUM(D{fr}:{MM[-1]}{fr})", BLACK, fmt, TOT if bold else None, bold=bold)
    FR[key] = fr; fr += 1


frow("heads", "월 인원(명 · 자문 제외)", ["heads"], grp="운영", fmt='#,##0.0', stock=True)
fr += 1
frow("rSub", "AI 플랫폼 구독(병원·약국 2027~ · 검진센터 2028~)", ["rSub"], grp="매출 발생")
frow("rChk", "건강검진 연계 매출", ["rChk"])
frow("rIns", "헬스메이트센터 사용료(현대해상)", ["insRec"])
frow("rP", "건강커머스(제품판매)", ["rP"])
frow("rCare", "재가·돌봄 파트너 이용료", ["rCare"])
frow("rOth", "기타(골프·시설 예약 · 서비스)", ["rOth"])
frow("rTot", "매출 합계", ["rSub", "rChk", "insRec", "rP", "rCare", "rOth"], bold=True, fill=TOT)
fr += 1
frow("iSub", "AI 플랫폼 구독 입금(병원·약국·검진센터)", ["inSub"], grp="현금 유입")
frow("iChk", "건강검진 연계 입금", ["inChk"])
frow("iIns", "헬스메이트센터 사용료 입금", ["inIns"])
frow("iP", "건강커머스 입금", ["inP"])
frow("iCare", "재가·돌봄 파트너 이용료 입금", ["inCare"])
frow("iOth", "기타 입금(예약·서비스)", ["inSvc", "inResv"])
frow("iTot", "유입 합계", ["inTot"], bold=True, fill=TOT)
fr += 1
frow("oPay", "인건비(준비기간 포함)", ["oPay", "oPrePay"], grp="현금 유출")
frow("oAd", "광고비(5대 엔진 · 오픈 전 광고 포함)", ["oMkt", "oMedia", "oPreMkt"])
frow("oBuild", "시스템 설치(1차 초기 구축)", ["oBuild"])
frow("oMedi", "메디에이지 리포트 구매(제휴 DB)", ["oMedi"])
frow("oIT", "AI·데이터·클라우드 · 영업 · 관리", ["oOpex", "oPreIT", "oPreOpex", "oCovSave"])
frow("oCogs", "매출원가(검진 3종·제품·결제 등)", ["oCogs"])
frow("oCust", "포인트 적립 · 기부금", ["oCust"])
frow("oRent", "임차 · 보증금 · 채용 · 일회성", ["oRent", "oDep", "oHire", "oOne"])
frow("oCapex", "고도화 CAPEX · 장비", ["oCapex"])
frow("oEtc", "이자 · 세금 · 운전자본 · 차입 상환", ["oInt", "oPreInt", "oTax", "oWc", "oRepay"])
frow("oTot", "유출 합계", ["outTot"], bold=True, fill=TOT)
fr += 1
frow("net", "순현금흐름", ["net"], grp="자금", bold=True)
frow("cum", "누적 현금(조달 전)", ["cum"], bold=True, fill=KEY, stock=True)
cell(FT, f"B{fr}", "투자금 투입(첫 달 전액 — 트랜치는 투자조건 시트)")
for k in range(NMM):
    cell(FT, f"{MM[k]}{fr}", f"=C{FR['req']}" if k == 0 else "=0", GREEN, F_MIL)
cell(FT, f"C{fr}", f"=SUM(D{fr}:{MM[-1]}{fr})", BLACK, F_MIL)
FR["inv"] = fr; fr += 1
cell(FT, f"B{fr}", "투자 후 현금 잔액", BOLD)
for k in range(NMM):
    cell(FT, f"{MM[k]}{fr}", f"=$C${FR['req']}+{MM[k]}{FR['cum']}", BLACK, F_MIL, KEY, bold=True)
FR["bal"] = fr; fr += 1
cell(FT, f"B{fr}", "점검 — 유출 항목 합 = 유출 합계", SUB)
for k in range(NMM):
    cell(FT, f"{MM[k]}{fr}", f"=ROUND(SUM({MM[k]}{FR['oPay']}:{MM[k]}{FR['oEtc']})-{MM[k]}{FR['oTot']},0)", SUB, F_WON)
FR["chk"] = fr; fr += 1
FT.column_dimensions["A"].width = 10
FT.column_dimensions["B"].width = 40
FT.column_dimensions["C"].width = 14
for c_ in MM:
    FT.column_dimensions[c_].width = 9.5
FT.freeze_panes = f"D{FR['head']+1}"

cell(M, "B7", "달력 월(A 계획 · 오픈 2027-01)", SUB)
for t in range(60):
    cell(M, f"{MCOL[t]}7", f"=TEXT(EDATE('현금·투자금'!$C${CR['startMonth']},{t}+'현금·투자금'!$C${CR['pre']}),\"yyyy-mm\")", SUB, align=Alignment(horizontal="center"))


# ══════════════════════════════════════ 투자조건 ══════════════════════════════════════
T = wb.create_sheet("투자조건")
cell(T, "A1", "투자조건 — 요청액 · 자금 사용처 · 트랜치 · 런웨이", TITLE)
cell(T, "A2", "밸류에이션·지분·투자 방식은 IM·텀시트 협의 사항이라 이 양식에 넣지 않는다. 사용처는 저점까지의 순소진을 계정별 유출 비중으로 나눈 값이다.", SUB)
tr = 4
cell(T, f"B{tr}", "기준 선택(1=A 계획 · 2=B 보수 · 3=C 게이트 지연)", BOLD)
cell(T, f"C{tr}", 2, BLUE, "0", YELLOW)
TR = {"sel": tr}
dv2 = DataValidation(type="whole", operator="between", formula1="1", formula2="3", showErrorMessage=True, error="1~3만 입력")
T.add_data_validation(dv2); dv2.add(f"C{tr}")
tr += 1
cell(T, f"B{tr}", "선택한 기준"); cell(T, f"C{tr}", f'=CHOOSE($C${TR["sel"]},"A 계획","B 보수","C 게이트 지연")', BLACK)
tr += 2
SEL = lambda key: f"CHOOSE($C${TR['sel']},'현금·투자금'!$C${CR['s_'+key]},'현금·투자금'!$D${CR['s_'+key]},'현금·투자금'!$E${CR['s_'+key]})"
section(T, tr, "① 요청액", 4); tr += 1
for k, lab, fmt in [("req", "투자 요청액(신규)", F_MIL), ("need", "필요 총자금", F_MIL), ("low", "누적 현금 저점", F_MIL), ("lowAt", "저점 시기", None), ("lowCal", "저점 달력 월", None),
                    ("buffer", "안전 버퍼", F_MIL), ("prepay", "전략적 선급", F_MIL), ("runway", "요청액 조달 시 소진 시기", None)]:
    cell(T, f"B{tr}", lab, BOLD if k == "req" else BLACK)
    cell(T, f"C{tr}", "=" + SEL(k), GREEN, fmt, YELLOW if k == "req" else None, bold=(k == "req"), align=Alignment(horizontal="right"))
    cell(T, f"D{tr}", "기간" if k in ("lowAt", "runway") else ("월" if k == "lowCal" else "백만원"), SUB)
    TR[k] = tr; tr += 1
tr += 1

section(T, tr, "② 자금 사용처 — 저점까지 순소진을 계정별 유출 비중으로 배분 + 버퍼 − 선급", 5); tr += 1
header_row(T, tr, ["", "사용처", "저점까지 총유출(참고)", "비중", "요청액 배분"], 1)
tr += 1
CATS = [("매출원가", ["oCogs"]), ("포인트 적립 · 기부금", ["oCust"]), ("마케팅(5대 엔진 광고 · 출시 전 사전 광고)", ["oMkt", "oMedia", "oPreMkt"]),
        ("CAPEX(1차 시스템 설치 · 고도화 · 보안 · 장비)", ["oBuild", "oCapex"]), ("메디에이지 리포트 구매(제휴 DB)", ["oMedi"]), ("인건비(준비기간 포함)", ["oPay", "oPrePay"]),
        ("AI·데이터·클라우드 · 영업 · 관리(준비기간 IT·기타 포함 · 사용료 미공급 절감 차감)", ["oOpex", "oPreIT", "oPreOpex", "oCovSave"]), ("임차 · 보증금 · 채용 · 일회성", ["oRent", "oDep", "oHire", "oOne"]),
        ("이자 · 세금 · 운전자본 · 차입 상환", ["oInt", "oPreInt", "oTax", "oWc", "oRepay"])]


def sumto(R, keys):
    cum = f"'현금·투자금'!$C${R['cum']}:${GL}${R['cum']}"
    idxr = f"'현금·투자금'!$C${R['idx']}:${GL}${R['idx']}"
    lowidx = f"INDEX({idxr},1,MATCH(MIN({cum}),{cum},0))"
    return "+".join(f"SUMIFS('현금·투자금'!$C${R[k]}:${GL}${R[k]},{idxr},\"<=\"&{lowidx})" for k in keys)


TR["catStart"] = tr
for lab, keys in CATS:
    cell(T, f"B{tr}", lab)
    cell(T, f"C{tr}", "=CHOOSE($C$%d,%s,%s,%s)" % (TR["sel"], sumto(RA, keys), sumto(RB, keys), sumto(RC, keys)), BLACK, F_MIL)
    tr += 1
TR["catEnd"] = tr - 1
cell(T, f"B{tr}", "총유출 합계(수입 충당분 포함)", BOLD)
cell(T, f"C{tr}", f"=SUM(C{TR['catStart']}:C{TR['catEnd']})", BLACK, F_MIL, TOT, bold=True)
TR["outSum"] = tr; tr += 1
cell(T, f"B{tr}", "같은 기간 유입(매출 회수)")
cell(T, f"C{tr}", "=CHOOSE($C$%d,%s,%s,%s)" % (TR["sel"], sumto(RA, ["inTot"]), sumto(RB, ["inTot"]), sumto(RC, ["inTot"])), BLACK, F_MIL)
TR["inSum"] = tr; tr += 1
for rr in range(TR["catStart"], TR["catEnd"] + 1):
    cell(T, f"D{rr}", f"=IF($C${TR['outSum']}=0,0,C{rr}/$C${TR['outSum']})", BLACK, F_PCT)
    cell(T, f"E{rr}", f"=D{rr}*(-{SEL('low')})", BLACK, F_MIL)
cell(T, f"B{tr}", "순소진 = |저점|", BOLD); cell(T, f"E{tr}", f"=SUM(E{TR['catStart']}:E{TR['catEnd']})", BLACK, F_MIL, TOT, bold=True); tr += 1
cell(T, f"B{tr}", "(+) 안전 버퍼"); cell(T, f"E{tr}", f"=C{TR['buffer']}", GREEN, F_MIL); tr += 1
cell(T, f"B{tr}", "(−) 전략적 선급"); cell(T, f"E{tr}", f"=-C{TR['prepay']}", GREEN, F_MIL); tr += 1
cell(T, f"B{tr}", "(+) 10억 단위 올림 조정"); cell(T, f"E{tr}", f"=C{TR['req']}-SUM(E{tr-3}:E{tr-1})", BLACK, F_MIL); tr += 1
cell(T, f"B{tr}", "투자 요청액(사용처 합계)", BOLD); cell(T, f"E{tr}", f"=SUM(E{tr-4}:E{tr-1})", BLACK, F_MIL, YELLOW, bold=True)
TR["useTotal"] = tr; tr += 2

section(T, tr, "③ 트랜치 — T1 클로징 · T2 마일스톤 달성 시", 5); tr += 1
cell(T, f"B{tr}", "T1 비율"); cell(T, f"C{tr}", 0.6, BLUE, F_PCT, YELLOW); TR["t1r"] = tr; tr += 1
cell(T, f"B{tr}", "T1 금액(10억 올림)", BOLD); cell(T, f"C{tr}", f"=MIN(C{TR['req']},ROUNDUP(C{TR['req']}*C{TR['t1r']}/1000000000,0)*1000000000)", BLACK, F_MIL, bold=True); TR["t1"] = tr; tr += 1
cell(T, f"B{tr}", "T2 금액", BOLD); cell(T, f"C{tr}", f"=C{TR['req']}-C{TR['t1']}", BLACK, F_MIL, bold=True); tr += 1
cell(T, f"B{tr}", "T1만 받았을 때 현금 소진 시기")


def t1_runway(R):
    lab = f"'현금·투자금'!$C${R['lab']}:${GL}${R['lab']}"
    cum = f"'현금·투자금'!$C${R['cum']}:${GL}${R['cum']}"
    return (f'IFERROR(INDEX({lab},1,MATCH(TRUE,INDEX($C${TR["t1"]}+{cum}<0,0),0)),"소진 없음")')


def t1_runway_cal(R):
    cal = f"'현금·투자금'!$C${R['cal']}:${GL}${R['cal']}"
    cum = f"'현금·투자금'!$C${R['cum']}:${GL}${R['cum']}"
    return (f'IFERROR(INDEX({cal},1,MATCH(TRUE,INDEX($C${TR["t1"]}+{cum}<0,0),0)),"")')


cell(T, f"C{tr}", "=CHOOSE($C$%d,%s,%s,%s)" % (TR["sel"], t1_runway(RA), t1_runway(RB), t1_runway(RC)), BLACK, align=Alignment(horizontal="right"))
cell(T, f"D{tr}", "=CHOOSE($C$%d,%s,%s,%s)" % (TR["sel"], t1_runway_cal(RA), t1_runway_cal(RB), t1_runway_cal(RC)), BLACK, align=Alignment(horizontal="center"))
cell(T, f"E{tr}", "← 달력 월 · T2는 이 달 이전에 들어와야 한다", SUB)
TR["t1run"] = tr; tr += 1
cell(T, f"B{tr}", "T2 마일스톤(입력)", BOLD); tr += 1
for ms in ["헬스메이트센터 DB 공급 파일럿 Go 판정 — 응답 80% · 상담 40% · 청약 8%(리드라우팅 설계보고서 §5.4)",
           "법률의견서 — 보험업법(모집 자격) · 신용정보법 · 개인정보보호법 §17·§23",
           "현대해상 제3자 제공 동의 수집 실적 — 목표 인원 입력",
           "AI 플랫폼 유료 전환 기관 — 목표 기관 수 입력"]:
    cell(T, f"B{tr}", ms, BLUE); tr += 1
tr += 1
section(T, tr, "④ 문서 금액 정합", 5); tr += 1
cell(T, f"B{tr}", "IM에 적힌 투자 금액"); cell(T, f"C{tr}", f"='현금·투자금'!$C${CR['imAmt']}", GREEN, F_MIL); TR["im"] = tr; tr += 1
cell(T, f"B{tr}", "요청액 − IM 금액"); cell(T, f"C{tr}", f"=C{TR['req']}-C{tr-1}", BLACK, F_MIL); tr += 1
cell(T, f"B{tr}", "전략적 투자금(현대해상 · 가정 ⑤ 우대 조건 기준)"); cell(T, f"C{tr}", f"={ASCALAR('hmInvest')}", GREEN, F_MIL); TR["hmInv"] = tr; tr += 1
cell(T, f"B{tr}", "추가 조달 필요액 = 요청액 − 전략적 투자금"); cell(T, f"C{tr}", f"=MAX(0,C{TR['req']}-C{tr-1})", BLACK, F_MIL); TR["gap"] = tr; tr += 1
cell(T, f"B{tr}", "⚠ IM의 「1차연도 공급 대가로 투자 회수」 서사는 같은 사용료를 투자 회수와 운영 현금에 두 번 쓴다 — IM 수정 필요", SUB); tr += 2
section(T, tr, "⑤ 헬스메이트센터 전략적 투자자 우대 조건 — 투자금 대비 할인 규모(조절은 가정 ⑤)", 7); tr += 1
header_row(T, tr, ["", "항목"] + YRS); tr += 1
TR["hmStart"] = tr
for key, lab, fmt in [("hmCap", "우대 한도(건)", F_CNT), ("hmPrice", "우대 단가(원/건)", F_WON), ("insCases", "공급 건수", F_CNT),
                      ("hmDiscN", "우대 단가 적용 건수", F_CNT), ("hmFullN", "시가 적용 건수(한도 초과)", F_CNT),
                      ("revIns", "헬스메이트센터 사용료(백만원)", F_MIL), ("hmBenefit", "시가 대비 할인액(백만원)", F_MIL),
                      ("hmBenefitX", "누계 할인액 ÷ 전략적 투자금", '0.00"배"')]:
    cell(T, f"B{tr}", lab, BOLD if key in ("hmBenefit", "hmBenefitX") else BLACK)
    for i in range(5):
        cell(T, f"{'CDEFG'[i]}{tr}", f"='연간손익'!{YC[i]}{YR[key]}", GREEN, fmt, KEY if key == "hmBenefitX" else None)
    TR["hm_" + key] = tr; tr += 1
cell(T, f"B{tr}", "시가(원/건)"); cell(T, f"C{tr}", f"={ASCALAR('hmMarket')}", GREEN, F_WON); tr += 1
cell(T, f"B{tr}", "5년 할인액 합계"); cell(T, f"C{tr}", f"=SUM('연간손익'!D{YR['hmBenefit']}:H{YR['hmBenefit']})", GREEN, F_MIL, KEY, bold=True)
cell(T, f"D{tr}", "백만원 · 계획 기준 — C(1차 미개시)는 1차 한도를 못 써 할인이 1차분만큼 작다", SUB); TR["hmBenefitSum"] = tr
T.column_dimensions["A"].width = 3
T.column_dimensions["B"].width = 54
T.column_dimensions["C"].width = 18
T.column_dimensions["D"].width = 12
T.column_dimensions["E"].width = 16
T.column_dimensions["F"].width = 16
T.column_dimensions["G"].width = 16


# ══════════════════════════════════════ 화면대조 ══════════════════════════════════════
S = wb.create_sheet("화면대조")
cell(S, "A1", "재무회계 온톨로지 화면 대조 — 화면은 1차연도 구조를 틱으로 흘리는 실시간 시뮬(v2.2까지 기준 · v3.0 개시 일정은 화면에 없음)", TITLE)
cell(S, "A2", "화면 값은 누적 중인 순간값이라 절대액이 아니라 구성비를 봐야 한다. 화면 값 출처: 2026-09-13 캡처.", SUB)
header_row(S, 4, ["구분", "화면 항목", "화면 값(원)", "화면 구성비", "대응 계정(연간손익)", "2027 모델(백만원)", "모델 구성비", "차이(%p)", "산식 · 비고"])
sr = 5
scr_rev = [("제품판매 매출 · 건강쇼핑(GMV)", 4737000, ["revP"], "v3.0 — 2027-07 개시 · 월말 회원 기준 월별 누적(화면 시뮬은 가동률 33%)"),
           ("검진 연계 수수료 · 건강검진센터", 3850000, ["revChk"], "자사 20%×3만 + 타사 80%×1만 = 1차 건당 평균 1.4만(원가 2만) — 화면 시뮬은 채널 구분 없이 2.5만"),
           ("헬스케어 서비스 수수료", 690000, ["revSvc"], "고객 수수료 0(대표 지시 2026-09-14) — 화면 시뮬은 이용자×1.5만 · 대가는 기관 구독료"),
           ("재가·돌봄 파트너 이용료", 0, ["revCare"], "v3.0 신설 — 2027-07 개시 · 센터당 월 정액(화면 시뮬에 없음)"),
           ("예약 서비스 수수료 · 골프·시설", 520000, ["revResv"], "예약 건수×1만"),
           ("EMR-UIP 사용료", 0, ["revSub"], "v3.0 — 병원·약국은 2027-01부터 과금(대표 지시 2026-09-15) · 화면 시뮬은 1차 무료"),
           ("보험 중개 수수료 · 퍼미션 동의(→ 헬스메이트센터 사용료)", 5180000, ["revIns"], "공급 건수 중 우대 한도까지 우대 단가(1차 5만), 초과분 시가 10만 — 화면 시뮬은 건당 7만")]
section(S, sr, "매출 구성", 9); sr += 1
r_s = sr
for lab, v, keys, note in scr_rev:
    cell(S, f"B{sr}", lab); cell(S, f"C{sr}", v, BLUE, F_WON)
    cell(S, f"E{sr}", " + ".join(keys), SUB)
    cell(S, f"F{sr}", "=" + "+".join(f"'연간손익'!$D${YR[k]}" for k in keys), GREEN, F_MIL)
    cell(S, f"I{sr}", note, SUB)
    sr += 1
r_e = sr - 1
cell(S, f"B{sr}", "매출 합계", BOLD)
cell(S, f"C{sr}", f"=SUM(C{r_s}:C{r_e})", BLACK, F_WON, TOT, bold=True)
cell(S, f"F{sr}", f"=SUM(F{r_s}:F{r_e})", BLACK, F_MIL, TOT, bold=True)
tot_rev = sr
for rr in range(r_s, r_e + 1):
    cell(S, f"D{rr}", f"=IF($C${tot_rev}=0,0,C{rr}/$C${tot_rev})", BLACK, F_PCT)
    cell(S, f"G{rr}", f"=IF($F${tot_rev}=0,0,F{rr}/$F${tot_rev})", BLACK, F_PCT)
    cell(S, f"H{rr}", f"=(D{rr}-G{rr})*100", BLACK, '0.0;-0.0;"-"')
sr += 2
section(S, sr, "비용 구성 — 비율은 매출 대비", 9); sr += 1
scr_cost = [("인건비 · 판관비", 3980359, ["pay"], "인력계획 합계"),
            ("검진·인프라 원가 · 매출원가", 3114500, ["chkCogs", "svcCost", "careCost", "subCost"], "검진 3종 원가(자사+타사) + 서비스·돌봄·구독 원가"),
            ("마케팅비 · 판관비", 2385194, ["mktSum"], "5대 엔진 광고비(발송·매체·제작·QR) — 화면 시뮬은 CAC+브랜드 8%+런칭"),
            ("제품 원가 · 매출원가", 2084280, ["cogsP"], "카테고리 매출×원가율"),
            ("포인트(토큰적립) 비용", 1326360, ["reward"], "제품마진×50%"),
            ("기부금(치료비 나눔)", 795816, ["donation"], "제품마진×30%"),
            ("연구개발비", 403147, ["itOpex"], "AI 유지보수·데이터·보안·클라우드·LLM·앵커링 — 화면 시뮬은 R&D+클라우드+GPU"),
            ("영업·관리비", 272185, ["salesCost", "adminCost"], "매출×요율×스케일 30%"),
            ("결제 대행 수수료", 104214, ["payFee"], "제품매출×2.2%"),
            ("감가상각비", 29840, ["depr"], "⚠ 시뮬은 전 연차 매출 0.2% 고정 — 이 양식은 CAPEX(AI 도입·메디에이지 투자 등)를 내용연수로 정액 상각")]
c_s = sr
for lab, v, keys, note in scr_cost:
    cell(S, f"B{sr}", lab); cell(S, f"C{sr}", v, BLUE, F_WON)
    cell(S, f"E{sr}", " + ".join(keys), SUB)
    cell(S, f"F{sr}", "=" + "+".join(f"'연간손익'!$D${YR[k]}" for k in keys), GREEN, F_MIL)
    cell(S, f"D{sr}", f"=IF($C${tot_rev}=0,0,C{sr}/$C${tot_rev})", BLACK, F_PCT)
    cell(S, f"G{sr}", f"=IF($F${tot_rev}=0,0,F{sr}/$F${tot_rev})", BLACK, F_PCT)
    cell(S, f"H{sr}", f"=(D{sr}-G{sr})*100", BLACK, '0.0;-0.0;"-"')
    cell(S, f"I{sr}", note, SUB)
    sr += 1
cell(S, f"B{sr}", "비용 합계", BOLD)
cell(S, f"C{sr}", f"=SUM(C{c_s}:C{sr-1})", BLACK, F_WON, TOT, bold=True)
cell(S, f"F{sr}", f"=SUM(F{c_s}:F{sr-1})", BLACK, F_MIL, TOT, bold=True)
cell(S, f"D{sr}", f"=IF($C${tot_rev}=0,0,C{sr}/$C${tot_rev})", BLACK, F_PCT, TOT)
cell(S, f"G{sr}", f"=IF($F${tot_rev}=0,0,F{sr}/$F${tot_rev})", BLACK, F_PCT, TOT)
sr += 1
cell(S, f"B{sr}", "영업이익(화면 = 매출 − 비용)", BOLD)
cell(S, f"C{sr}", f"=C{tot_rev}-C{sr-1}", BLACK, F_WON)
cell(S, f"F{sr}", f"=F{tot_rev}-F{sr-1}", BLACK, F_MIL)
cell(S, f"I{sr}", "모델 쪽은 감가상각을 차감한 보정 영업이익과 같다", SUB)
sr += 2
section(S, sr, "대조 범위 밖 불일치", 9); sr += 1
for t_ in ["이자·차입 — 화면 시뮬은 장기차입 2억(Finance.jsx FIN_LONGDEBT) · 이자 매출×0.18%, 이 양식은 대표 지시 2026-09-16로 장기차입과 이자를 모두 뺐다(0)",
           "KPI 런웨이 — 모델은 1차연도 EBIT(+5.1억)로 번을 계산해 내부값 Infinity, 화면에는 「흑자」로 표시(같은 해 순이익 −2.9억 · 모델 FCF −16.2억)"]:
    cell(S, f"B{sr}", t_, SUB); sr += 1
S.column_dimensions["A"].width = 4
S.column_dimensions["B"].width = 34
S.column_dimensions["C"].width = 14
S.column_dimensions["D"].width = 11
S.column_dimensions["E"].width = 26
S.column_dimensions["F"].width = 16
S.column_dimensions["G"].width = 11
S.column_dimensions["H"].width = 9
S.column_dimensions["I"].width = 60
S.freeze_panes = "C5"


# ══════════════════════════════════════ 안내 ══════════════════════════════════════
# ══════════════════════════════════════ 비용근거 ══════════════════════════════════════
EV = wb.create_sheet("비용근거", 1)
cell(EV, "A1", "비용근거 — 판관비·CAPEX 단가 조사(웹 조사 · 출처 URL · 교차 검증)", TITLE)
cell(EV, "A2", "조사일 2026-09-14 · 권고값은 부가세 제외 · 「양식 반영」은 가정·인력계획에 넣은 값(권고와 다르면 사유) · 검증 = 두 번째 조사자가 출처를 다시 열어 수치를 확인한 결과", SUB)
_evp = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "cost_evidence.json")
EVD = json.load(open(_evp, encoding="utf-8")) if _os.path.exists(_evp) else {"topics": []}
header_row(EV, 4, ["구분", "키", "항목", "단위", "하한", "중간", "상한", "권고", "양식 반영", "반영 위치 · 사유", "산출 근거", "신뢰도", "검증",
                   "출처 1", "URL 1", "출처 2", "URL 2", "출처 3", "URL 3", "검증 보정값"])
er = 5
TOPIC_LABEL = {"salary": "급여·사용자 부담", "ads": "광고 단가", "it": "AI·데이터·클라우드", "bench": "벤치마크", "manual": "지시·계획서·가정"}
_clean = lambda t: re.sub(r"\s*(Full (JSON|verdict file)[^:]*:|전체 JSON 저장:)?\s*[A-Za-z]:[/\\]Users[/\\]\S+", "", t or "").strip()
TOPIC_HEAD = {"salary": "2026 서울 기준 기본연봉(워크피디아·사람인 등)과 2026 사용자 부담 요율 — 1차 17명(대표 포함) + 자문 4명",
              "ads": "5대 엔진 중 광고비가 드는 ① 안내 발송 · ② 9채널 · ④ 현장 QR과 카드사 제휴 단가(VAT 별도 · 해외 CPM은 1,440원/USD 환산)",
              "it": "AI 모듈·공통 플랫폼(KOSA 2026 평균임금) · NCP 요금 · LLM 공식 단가(1,345.9원/USD) · 블록체인 앵커링",
              "bench": "국내 디지털헬스·인슈어테크 1인당 매출과 광고선전비율(DART 공시) · 인원 탄력성 관측치",
              "manual": "대표 지시 · 사업계획서 수치 · 조사 밖 보완 근거 · 양식 가정([가정]·[추정])"}
for tp in EVD.get("topics", []):
    vmap = {v["key"]: v for v in (tp.get("check") or {}).get("verdicts", [])}
    section(EV, er, f"{TOPIC_LABEL.get(tp['topic'], tp['topic'])} — {TOPIC_HEAD.get(tp['topic'], '')}", 20); er += 1
    for it_ in tp.get("items", []):
        ad = CS.ADOPT.get(it_["key"], (None, ""))
        vd = vmap.get(it_["key"], {})
        vals = [TOPIC_LABEL.get(tp["topic"], tp["topic"]), it_["key"], it_["item"], it_.get("unit", ""), it_.get("low"), it_.get("mid"), it_.get("high"),
                it_.get("recommended"), ad[0], ad[1], _clean(it_.get("basis", "")), it_.get("confidence", ""),
                _clean(vd.get("status", "") + (" — " + vd.get("note", "") if vd.get("note") else ""))[:1500]]
        for ci, v in enumerate(vals):
            fmt_ = '#,##0.####' if isinstance(v, (int, float)) and ci in (4, 5, 6, 7, 8) else None
            cell(EV, f"{CL(ci + 1)}{er}", v, BLUE if ci == 8 and v is not None else BLACK, fmt_)
        for si, src in enumerate(it_.get("sources", [])[:3]):
            cell(EV, f"{CL(14 + 2 * si)}{er}", f"{src.get('title', '')} · {src.get('date', '')} · {src.get('figure', '')}"[:300], SUB)
            cell(EV, f"{CL(15 + 2 * si)}{er}", src.get("url", ""), SUB)
        if vd.get("corrected_recommended") is not None:
            cell(EV, f"T{er}", vd["corrected_recommended"], BLACK, '#,##0.####')
        er += 1
    for cv in tp.get("caveats", [])[:8]:
        cv_ = re.sub(r"(Full JSON saved|전체 JSON 저장)[^.]*\.?", "", cv).strip()
        if cv_:
            cell(EV, f"C{er}", "⚠ " + cv_, SUB); er += 1
    er += 1
for col_, wd_ in zip("ABCDEFGHIJKLMNOPQRST", [14, 20, 40, 12, 12, 12, 12, 12, 12, 40, 60, 8, 70, 50, 40, 50, 40, 50, 40, 14]):
    EV.column_dimensions[col_].width = wd_
EV.freeze_panes = "D5"


# ══════════════════════════════════════ 매출계획 ══════════════════════════════════════
RP = wb.create_sheet("매출계획", 1)
cell(RP, "A1", "매출계획 — 매출 줄별 개시 일정 · 2027 월별 매출 · 2027~2031 연간 매출", TITLE)
cell(RP, "A2", '="대표 일정 2026-09-15 — 2026-10 준비 시작 · 2027-01-01 오픈 · 단위 백만원 · 2028~2031 매출 산정 방식: "&IF(' + ASCALAR("revMode") + '=2,"월별 누적(월말 회원 기준 · 기본)","연말 기준(사업계획서·IM 방식)")&" — 가정 ⑤-2에서 바꾼다"', SUB)
REV_LINES = [("Sub", "AI 플랫폼 구독(병원·약국 2027~ 진료 연계 · 검진센터 2028~)", "revSub", "fullSub", "다음 달", "sub"),
             ("Chk", "건강검진 연계(자사운영·타사 제휴)", "revChk", "fullChk", "다음 달", "chk"),
             ("Resv", "예약 서비스 수수료(골프·시설)", "revResv", "fullResv", "다음 달", "resv"),
             ("Ins", "헬스메이트센터 사용료(현대해상 DB 공급)", "revIns", "fullIns", "다음 달(B·C 2개월)", "ins"),
             ("P", "건강커머스(제품판매 · GMV 총액)", "revP", "fullP", "같은 달(카드·PG)", "commerce"),
             ("Care", "재가·돌봄 파트너 이용료(센터당 월 정액)", "revCare", "fullCare", "다음 달", "care"),
             ("Svc", "헬스케어 서비스 고객 수수료(0 — 기관 구독료로 수취)", "revSvc", "fullSvc", "다음 달", "svc")]
pr = 4
section(RP, pr, "① 매출 줄별 개시 일정 — 개시 계수와 검진 계절은 가정 ⑤-2, 조사 근거는 매출근거 시트", 9); pr += 1
header_row(RP, pr, ["", "매출 줄", "2027 개시 월", "월 기준", "2027 반영률(연 환산 매출 대비)", "입금", "늘어나는 방식 · 근거"], 1); pr += 1
RPR = {}
for sk_, lab_, rk_, fk_, cash_, nk_ in REV_LINES:
    fr_ = AR["F_" + sk_]
    cell(RP, f"B{pr}", lab_, BOLD)
    cell(RP, f"C{pr}", f'=IF(\'연간손익\'!$D${YR[rk_]}=0,"2027 매출 없음",IFERROR(TEXT(EDATE(\'현금·투자금\'!$C${CR["startMonth"]},\'현금·투자금\'!$C${CR["pre"]}+MATCH(TRUE,INDEX(\'가정\'!$D${fr_}:$O${fr_}>0,0),0)-1),"yyyy-mm"),"2027 매출 없음"))', BLACK, align=Alignment(horizontal="center"))
    cell(RP, f"D{pr}", {"member": "회원", "season": "회원×검진 계절", "flat": "기관(균등)"}[dict((k, b) for k, _, b in STREAMS)[sk_]], SUB)
    cell(RP, f"E{pr}", f"=IF('연간손익'!$D${YR[fk_]}=0,0,'연간손익'!$D${YR[rk_]}/'연간손익'!$D${YR[fk_]})", GREEN, F_PCT)
    cell(RP, f"F{pr}", cash_, SUB)
    cell(RP, f"G{pr}", REV_PLAN_NOTE.get(nk_, ""), SUB)
    pr += 1
pr += 1
section(RP, pr, "② 2027년 월별 매출(백만원) — 월별예산 2027 열", 16); pr += 1
header_row(RP, pr, ["", "매출 줄", "2027 합계"] + [f"=TEXT(EDATE('현금·투자금'!$C${CR['startMonth']},'현금·투자금'!$C${CR['pre']}+{m_}),\"yyyy-mm\")" for m_ in range(12)], 1); pr += 1
RPR["mStart"] = pr
for sk_, lab_, rk_, fk_, cash_, nk_ in REV_LINES:
    cell(RP, f"B{pr}", lab_)
    for m_ in range(12):
        cell(RP, f"{CL(4 + m_)}{pr}", f"='월별예산'!{MCOL[m_]}{MR[rk_]}", GREEN, F_MIL)
    cell(RP, f"C{pr}", f"=SUM(D{pr}:O{pr})", BLACK, F_MIL, TOT)
    RPR["m_" + sk_] = pr; pr += 1
cell(RP, f"B{pr}", "매출 합계", BOLD)
for m_ in range(12):
    col_ = CL(4 + m_)
    cell(RP, f"{col_}{pr}", f"=SUM({col_}{RPR['mStart']}:{col_}{pr-1})", BLACK, F_MIL, TOT, bold=True)
cell(RP, f"C{pr}", f"=SUM(D{pr}:O{pr})", BLACK, F_MIL, KEY, bold=True)
RPR["mTot"] = pr; pr += 1
cell(RP, f"B{pr}", "누적 매출")
for m_ in range(12):
    col_ = CL(4 + m_)
    cell(RP, f"{col_}{pr}", f"=SUM($D${RPR['mTot']}:{col_}{RPR['mTot']})", BLACK, F_MIL)
pr += 1
cell(RP, f"B{pr}", "월말 회원(명)", SUB)
for m_ in range(12):
    cell(RP, f"{CL(4 + m_)}{pr}", f"='월별예산'!{MCOL[m_]}{MR['endM']}", GREEN, F_CNT)
pr += 1
cell(RP, f"B{pr}", "점검 — 2027 합계 = 연간손익 2027 매출", SUB); cell(RP, f"C{pr}", f"=ROUND(C{RPR['mTot']}-'연간손익'!$D${YR['rev']},0)", SUB, F_WON)
RPR["mChk"] = pr; pr += 2

section(RP, pr, "③ 2027~2031 연간 매출(백만원) — 연간손익", 10); pr += 1
header_row(RP, pr, ["", "매출 줄", ""] + YRS + ["5년 합계", "구성비(5년)"], 1); pr += 1
RPR["yStart"] = pr
for sk_, lab_, rk_, fk_, cash_, nk_ in REV_LINES:
    cell(RP, f"B{pr}", lab_)
    for i in range(5):
        cell(RP, f"{YC[i]}{pr}", f"='연간손익'!{YC[i]}{YR[rk_]}", GREEN, F_MIL)
    cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", BLACK, F_MIL, TOT)
    RPR["y_" + sk_] = pr; pr += 1
cell(RP, f"B{pr}", "매출 합계", BOLD)
for i in range(5):
    cell(RP, f"{YC[i]}{pr}", f"=SUM({YC[i]}{RPR['yStart']}:{YC[i]}{pr-1})", BLACK, F_MIL, KEY, bold=True)
cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", BLACK, F_MIL, KEY, bold=True)
RPR["yTot"] = pr
for rr_ in range(RPR["yStart"], pr + 1):
    cell(RP, f"J{rr_}", f"=IF($I${pr}=0,0,I{rr_}/$I${pr})", BLACK, F_PCT)
pr += 1
cell(RP, f"B{pr}", "전년 대비 증가율")
for i in range(1, 5):
    cell(RP, f"{YC[i]}{pr}", f"=IF({YC[i-1]}{RPR['yTot']}=0,0,{YC[i]}{RPR['yTot']}/{YC[i-1]}{RPR['yTot']}-1)", BLACK, F_PCT)
pr += 1
cell(RP, f"B{pr}", "매출총이익", SUB)
for i in range(5):
    cell(RP, f"{YC[i]}{pr}", f"='연간손익'!{YC[i]}{YR['gross']}", GREEN, F_MIL)
cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", BLACK, F_MIL)
pr += 1
cell(RP, f"B{pr}", "영업이익(보정 · 상각 후)", SUB)
for i in range(5):
    cell(RP, f"{YC[i]}{pr}", f"='연간손익'!{YC[i]}{YR['ebit']}", GREEN, F_MIL)
cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", BLACK, F_MIL)
pr += 2

section(RP, pr, "④ 산정 방식 비교 — 연말 기준(사업계획서·IM 방식) 대비 · 합계 밖 참고", 10); pr += 1
header_row(RP, pr, ["", "구분", ""] + YRS + ["5년 합계", ""], 1); pr += 1
cmp_rows = [("반영 매출(현재 양식)", lambda i: f"='연간손익'!{YC[i]}{YR['rev']}", GREEN),
            ("연말 기준 매출(개시 일정 전 · 연말 회원 × 연간 단가)", lambda i: f"='연간손익'!{YC[i]}{YR['fullRev']}", GREEN),
            ("차이(반영 − 연말 기준)", None, BLACK),
            ("반영 비율", None, BLACK)]
r0_ = pr
for lab_, fn_, font_ in cmp_rows:
    cell(RP, f"B{pr}", lab_, BOLD if fn_ is None and "차이" in lab_ else BLACK)
    for i in range(5):
        if lab_.startswith("차이"):
            v_ = f"={YC[i]}{r0_}-{YC[i]}{r0_+1}"
        elif lab_.startswith("반영 비율"):
            v_ = f"=IF({YC[i]}{r0_+1}=0,0,{YC[i]}{r0_}/{YC[i]}{r0_+1})"
        else:
            v_ = fn_(i)
        cell(RP, f"{YC[i]}{pr}", v_, font_, F_PCT if lab_.startswith("반영 비율") else F_MIL)
    if not lab_.startswith("반영 비율"):
        cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", BLACK, F_MIL)
    pr += 1
RPR["cmpStart"] = r0_
cell(RP, f"B{pr}", "v2.2 매출(참고 · 1차 = 2027-02~2028-01 기준이라 연도가 한 달씩 어긋남)", SUB)
for i in range(5):
    cell(RP, f"{YC[i]}{pr}", V22_REV[i], SUB, F_MIL)
cell(RP, f"I{pr}", f"=SUM(D{pr}:H{pr})", SUB, F_MIL)
pr += 1
for t_ in ["연말 기준은 해마다 연말 회원이 1년 내내 있었다고 보는 방식이라, 회원이 빠르게 느는 해(2028 1.3백만 ← 2027 33만)에는 월별로 쌓은 값보다 크다. 투자금은 월별 현금으로 판단하므로 기본값은 월별 누적이다.",
           "2027은 두 방식 모두 월별 누적 — 개시 월 전 0, 개시 뒤 개시 계수만큼 늘어난다. 연 환산 대비 반영률은 ① 표."]:
    cell(RP, f"B{pr}", t_, SUB); pr += 1
RP.column_dimensions["A"].width = 3
RP.column_dimensions["B"].width = 44
RP.column_dimensions["C"].width = 13
for col_ in [CL(4 + k) for k in range(12)]:
    RP.column_dimensions[col_].width = 11.5
RP.column_dimensions["G"].width = 11.5
RP.freeze_panes = "C4"
# ① 표 G열 설명은 길어서 폭을 넓힌 P열 대신 G열에 두고 줄바꿈 없이 둔다

# ══════════════════════════════════════ 매출근거 ══════════════════════════════════════
RV = wb.create_sheet("매출근거", 3)
cell(RV, "A1", "매출근거 — 매출 줄별 개시·증가 속도 · 검진 계절 · 재가·돌봄 연계 · 보험 DB 단계 조사(출처 URL · 교차 검증)", TITLE)
cell(RV, "A2", "조사일 2026-09-15 · 대표 지시(개시 월)는 조사 대상이 아니다 — 조사는 개시 뒤 늘어나는 모양·계절·단가·구조의 근거 · 검증 = 두 번째 조사자가 출처를 다시 열어 확인한 결과", SUB)
_rvp = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "revenue_evidence.json")
RVD = json.load(open(_rvp, encoding="utf-8")) if _os.path.exists(_rvp) else {"topics": []}
header_row(RV, 4, ["구분", "키", "항목", "단위", "하한", "권고", "상한", "양식 반영", "반영 위치 · 사유", "산출 근거", "검증", "출처 1", "URL 1", "출처 2", "URL 2", "출처 3", "URL 3", "검증 보정값"])
vr = 5
RTOPIC = {"checkup_season": "검진 계절", "care_fee": "재가·돌봄 연계", "commerce_ramp": "건강커머스", "inst_saas_ramp": "병원·약국 구독", "ins_db_ramp": "보험 DB 공급", "manual": "대표 지시·양식 판단"}
_fmtv = lambda v: (", ".join(f"{x:g}" if isinstance(x, (int, float)) else str(x) for x in v) if isinstance(v, list) else v)
for tp in RVD.get("topics", []):
    vmap = {v["key"]: v for v in (tp.get("check") or {}).get("verdicts", [])}
    section(RV, vr, f"{RTOPIC.get(tp['topic'], tp['topic'])} — {_clean(tp.get('summary', ''))[:400]}", 18); vr += 1
    for it_ in tp.get("items", []):
        ad = REV_ADOPT.get(it_["key"], (None, ""))
        vd = vmap.get(it_["key"], {})
        vals = [RTOPIC.get(tp["topic"], tp["topic"]), it_["key"], it_.get("label", ""), it_.get("unit", ""), _fmtv(it_.get("low")), _fmtv(it_.get("recommended")), _fmtv(it_.get("high")),
                _fmtv(ad[0]), ad[1], _clean(it_.get("derivation", ""))[:1500], _clean(vd.get("status", "") + (" — " + vd.get("note", "") if vd.get("note") else ""))[:1500]]
        for ci, v in enumerate(vals):
            fmt_ = '#,##0.####' if isinstance(v, (int, float)) and ci in (4, 5, 6, 7) else None
            cell(RV, f"{CL(ci + 1)}{vr}", v, BLUE if ci == 7 and v is not None else BLACK, fmt_)
        for si, src in enumerate(it_.get("sources", [])[:3]):
            cell(RV, f"{CL(12 + 2 * si)}{vr}", f"{src.get('publisher', '')} · {src.get('title', '')} · {src.get('date', '')} · {src.get('quote', '')}"[:300], SUB)
            cell(RV, f"{CL(13 + 2 * si)}{vr}", src.get("url", ""), SUB)
        if vd.get("corrected_recommended") is not None:
            cell(RV, f"R{vr}", _fmtv(vd["corrected_recommended"]), BLACK)
        vr += 1
    for gp in tp.get("gaps", [])[:6]:
        cell(RV, f"C{vr}", "⚠ " + _clean(gp)[:600], SUB); vr += 1
    vr += 1
for col_, wd_ in zip("ABCDEFGHIJKLMNOPQR", [14, 22, 40, 12, 14, 18, 14, 18, 44, 70, 70, 50, 40, 50, 40, 50, 40, 16]):
    RV.column_dimensions[col_].width = wd_
RV.freeze_panes = "D5"

G = wb.create_sheet("안내", 0)
cell(G, "A1", "하이젠케어 전략적 투자요청서 — 투자금 산정 · 세부 예산 양식", Font(name=FONT, size=17, bold=True, color="1A2B4A"))
cell(G, "A2", "v3.0 · 2026-09-15 · 대표 일정 — 2026-10 준비 시작 · 2027-01-01 오픈 · 연차 = 2027~2031 달력 연도 · 매출 줄별 개시(병원·약국 구독 01 · 검진·사용료 04 · 커머스·돌봄 07) · 월별 누적 매출 산정 · 재가·돌봄 연계 매출 신설(매출계획·매출근거 시트) │ (v2.2) 월별 자금필요표 │ (v2.1) 급여 대표 지시(건강검진 6,850만 · 보험·치료비 평균 5,250만 · 대표 1.5억) │ (v2.0) 판관비 근거 모델 — 5대 엔진 광고비 · 1차 섹션별 17명·업계 급여(2차부터 매출 지표 연동) · AI 시스템 도입·데이터·클라우드·블록체인 · 메디에이지 데이터 투자 20억(비용근거 시트) │ 이전 반영: (v1.7) 검진 자사 비율 20%→5차 80% 확정 · (v1.6) 헬스메이트센터 사용료 우대 단가·한도, 신규 스트림 삭제 · (v1.5) 검진 채널 자사/타사 분리 · (v1.3~1.4) 약국 1차 200곳·기관별 구독료 │ 사이트(finModel.js) 미반영 — 확정 후 반영", SUB)
gr = 4
section(G, gr, "결론 — 투자금 산정 결과(가정을 바꾸면 자동 재계산)", 7); gr += 1
header_row(G, gr, ["", "항목", "A 계획", "B 보수", "C 게이트 지연", "단위", "비고"]); gr += 1
for k, lab, note in [("req", "투자 요청액(10억 올림)", "필요 총자금 − 전략적 선급"),
                     ("lowCal", "저점 달력 월", "달력 기준(A·B·C 공통)"),
                     ("need", "필요 총자금", "|저점| + 안전 버퍼"),
                     ("low", "누적 현금 저점", "조달 전"), ("lowAt", "저점 시기", "오픈 기준 기간(1차-01 = 오픈 첫 달: A 2027-01 · B·C 2027-03)"),
                     ("bufMonths", "버퍼 — 저점 달 고정비 기준", "2027 월평균 6개월분을 환산"),
                     ("runway", "요청액 조달 시 소진 시기", "")]:
    cell(G, f"B{gr}", lab, BOLD if k == "req" else BLACK)
    for bi, LCc in enumerate(["C", "D", "E"]):
        fmt = None if k in ("lowAt", "runway", "lowCal") else ("0.0" if k == "bufMonths" else F_MIL)
        cell(G, f"{LCc}{gr}", f"='현금·투자금'!{LCc}{CR['s_'+k]}", GREEN, fmt, YELLOW if k == "req" else None, bold=(k == "req"),
             align=Alignment(horizontal="right"))
    cell(G, f"F{gr}", "기간" if k in ("lowAt", "runway") else ("월" if k == "lowCal" else ("개월" if k == "bufMonths" else "백만원")), SUB)
    cell(G, f"G{gr}", note, SUB)
    gr += 1
gr += 1
section(G, gr, "점검(자동)", 7); gr += 1
for i_ in range(7):
    cell(G, f"B{gr}", f"='현금·투자금'!B{CR['warnStart']+i_}", BLACK); gr += 1
gr += 1
section(G, gr, "세 기준", 7); gr += 1
for t_ in ["사업 일정(대표 지시 2026-09-15) — 2026-10 본격 준비(인건비·광고·시스템 설치·메디에이지) → 2027-01-01 오픈 → 병원·약국 AI 플랫폼 구독 2027-01부터 · 건강검진 연계·헬스메이트센터 사용료 2027-04부터 서서히 · 건강커머스·재가돌봄 2027-07부터. 연차 = 달력 연도(1차 2027 ~ 5차 2031). 입금은 기관·검진·돌봄 다음 달, 커머스는 카드·PG라 같은 달.",
           "매출 산정 — 2027은 달마다 「월 기준 × 연말 기준 연간 매출 × 개시 계수」를 더한다(가정 ⑤-2 · 월별예산). 월 기준: 회원 줄(커머스·사용료·돌봄·골프 예약) = 월말 회원 ÷ 연말 회원 ÷ 12 · 검진 = 여기에 검진 계절 지수 · AI 플랫폼 구독 = 1/12(기관 균등, 개시 계수 = 그 달 과금 기관 비중). 2028~2031은 산정 방식 2(기본) = 같은 월별 누적(구독은 유형별 유료 기관의 전년 말→연말 경로) × 성숙 계수, 1 = 연말 회원 × 연간 단가(사업계획서·IM 방식). 두 방식의 차이는 매출계획 시트에 나란히 적었다.",
           "A 계획 — 위 일정 그대로. 준비 3개월: 인건비 60→80→100% · 사전 광고 30→60→100%(2027 광고 월평균 대비) · IT 운영 11월부터 · 시스템 설치 30/40/30% · 일회성 1.5억은 2026-10 · 메디에이지는 2027-01부터 가입 연동 리포트 구매(준비기간 지출 없음) · 이자 없음(장기차입 제외). 매출 연동 비용은 월 매출 비중, 인건비는 연속 채용 경로.",
           "B 보수 — 비용은 같은 2026-10부터 나가는데 오픈과 계획 월 전체가 2개월 늦게(2027-03 오픈) 시작 · 사용료 정산 2개월 지연 · CAPEX 분기 선집행. B·C의 기간(1차-01 = 2027-03)·검진 계절·우대 한도 연차도 오픈 기준으로 함께 민다(검진 계절을 달력에 고정해도 필요 총자금 +0.7억 · 요청액 그대로). 공급사 신용은 의도적으로 제외.",
           "C 게이트 지연 — B에 더해 오픈 후 첫 12개월(2027-03~2028-02) 헬스메이트센터 DB 공급이 없는 경우(법률의견·파일럿 Go 판정 지연). 미공급을 달력 2027로만 두면 C는 130억.",
           "투자요청서에는 B 요청액을 권고액, A를 최소 필요액으로 적고, C를 하방 시나리오로 병기한다. 요청액은 필요 총자금 전액이다(보유 현금을 차감하지 않음)."]:
    cell(G, f"B{gr}", t_); gr += 1
gr += 1
section(G, gr, "시트 구성과 쓰는 순서", 7); gr += 1
for sh, role in [("가정", "① 회원·기관·단가·요율 · 5대 엔진 광고 · AI·데이터·클라우드 · CAPEX · 월 배분(파란 글씨)"),
                 ("비용근거", "①-2 단가 조사 — 급여·광고·AI/IT·벤치마크, 출처 URL과 검증 결과"),
                 ("매출계획", "①-3 매출 줄별 개시 일정 · 2027 월별 매출 · 2027~2031 연간 매출 · 산정 방식 비교(연말 기준 대비)"),
                 ("매출근거", "①-4 개시 계수·검진 계절·돌봄 연계·구독 가입 속도·보험 DB 단계의 조사 출처와 검증 결과"),
                 ("인력계획", "② 1차 섹션별 인원 × 업계 급여 → 2차부터 매출 지표 연동 · 월 경로 점검"),
                 ("연간손익", "③ 2027~2031 세부 계정 · 매출 반영률 · 연 환산 매출 · 순매출·실효 CAC·사용료 제외 이익·투자자 우대 할인 메모 · IM 공급표 대조 · finModel 대조"),
                 ("월별예산", "④ 2027-01~2031-12 세부 계정 · 매출 줄별 월 배분 — 오른쪽 끝 연간 합계 대조(차이 0)"),
                 ("현금·투자금", "⑤ A·B·C 레버(준비기간·회수·간접비·선급·상환·버퍼) → 저점 → 필요 총자금 → 요청액"),
                 ("월별자금필요표", "⑤-2 2026-10~2029-12 달력 월별 매출(줄별)·입금·유출·누적 현금·투자 후 잔액(기준 선택)"),
                 ("투자조건", "⑥ 요청액 · 자금 사용처(순소진 배분) · 트랜치 · T1 소진 시기 · 전략적 투자금 대조 · 헬스메이트센터 우대 조건"),
                 ("화면대조", "⑦ 재무회계 온톨로지 화면과 2027 모델 구성비 대조(화면은 v2.2까지 기준)")]:
    cell(G, f"B{gr}", sh, BOLD); cell(G, f"C{gr}", role); gr += 1
gr += 1
section(G, gr, "색상 규칙", 7); gr += 1
for f_, fill_, t_ in [(BLUE, None, "파란 글씨 — 입력값(바꿔도 되는 셀)"), (BLACK, None, "검정 글씨 — 수식(고치지 말 것)"),
                      (GREEN, None, "초록 글씨 — 다른 시트를 끌어온 값"), (BLACK, YELLOW, "노란 칸 — 투자금에 영향이 큰 가정 · 결과 헤드라인"),
                      (BLACK, KEY, "연노랑 칸 — 결과 핵심값")]:
    cell(G, f"B{gr}", "예시 1,000", f_, F_WON, fill_); cell(G, f"C{gr}", t_); gr += 1
gr += 1
section(G, gr, "모델 점검 — 투자요청서 작성 전에 확인할 것", 7); gr += 1
for t_ in [
    "1. finModel.js 영업이익(ebit)은 감가상각을 빼지 않은 값(실질 EBITDA)이다. 이 양식은 「상각 전」과 「보정(상각 후)」을 나란히 두고, 상각은 CAPEX를 내용연수로 정액 계산한다.",
    "2. 장기차입금 제외(대표 지시 2026-09-16). finModel.js의 장기차입 20억 가정과 연 이자 8억(차입금과 연동되지 않은 고정 상수 · 암묵 이자율 40%)을 뺐다. 준비기간 이자도 0이다. 차입을 실제로 일으키면 가정 ⑨ 이자와 차입 상환 레버를 그 조건으로 채울 것.",
    "3. 모델 KPI 런웨이는 1차연도 EBIT(+5.1억)로 번을 계산해 내부값이 Infinity가 되고, 화면에는 「흑자」로 뜬다. 연간 흑자여도 월별 현금은 저점을 지난다 — 이 양식은 월별 현금으로 판단한다.",
    "4. 모델 FCF 산식 ebit×(1−세율)은 손실 연도에 세금 환급처럼 작동한다. v3.0 기본값은 2027 모델 표기 영업이익(상각 전)이 −18.1억이라 그 산식이면 세금이 약 −4.0억(가짜 환급)으로 잡힌다 — 이 양식은 손실 시 세금 0이고, 2026 준비기간 비용과 2027 손실을 이월결손금으로 2028부터 차감한다(연간손익 이월결손금 행 · 현금 요약 법인세 1~4차분).",
    "5. 헬스메이트센터 사용료는 원가가 없어 이익에 그대로 반영된다. 2027 반영 3.8만 건(연 환산 12만 건 × 반영률 31% — 4월 파일럿·수도권·8월 말 전국) = 전량 우대 5만 = 18.8억 · 조사상 2027 적정 1.4만~5.5만 건(중간 3만). 2028 31.6만 건 = 우대 20만×6만 + 시가 11.6만×10만 = 235.8억. 한도 초과분이 시가 10만이라 2028부터 모델(건당 7만)보다 크다 — 시가 10만의 근거를 첨부할 것(조사: 동의 DB 시장 5만~13만 · 상담 일정 확정 DB 15만~20만). 우대가 없으면(전량 시가) 필요 총자금이 A 7.8억 · B 10.7억 · C 0.7억 작다(요청 A 100 · B 110 · C 140억). ⚠ 명칭을 사용료로 바꿔도 보험업법 §99①(모집 대가) 위험은 그대로 — 유료 공급 전 법률의견 또는 GA 경로.",
    "6. 화면 시뮬의 감가상각은 전 연차 매출 0.2%로 고정돼 있다. 이 양식은 CAPEX 정액 상각이라 2027 3.1% → 2031 0.29%로 줄어든다(2027은 매출이 개시 일정만큼 작아 비율이 크다). 모델 영업이익과 함께 보정해야 한다.",
    "7. 사이트 사업계획(월·분기) 탭(finMonthlyY1)은 매출 연동 판관비와 인건비를 매월 1/12로 빼서 상반기 누적 영업손익이 −50.8억으로 나온다. 이 양식은 매출 가중·연속 채용으로 배분했다 — 제출 전 사이트도 같은 기준으로 맞출 것(확정 전에는 사이트 미반영 — 대표 지시).",
    "8. 사용료 모수(공급 건수)가 문서마다 다르다. 모델은 누적 동의에 매년 60%(2031 378만 건 연 환산), IM p7은 연 신규 동의×60%(2031 150만 건). 검증보고서 v1.1의 「동일 산식」은 틀렸다. 2027은 같지만 2028~2031이 크게 다르다 — 대표 결정 필요. v3.0은 여기에 개시 일정·월별 누적을 곱해 2027 3.8만 · 2031 309만 건을 반영한다.",
    "9. 제품판매는 총액 인식(finModel.js)인데 공급 데이터는 무재고·직배송(순액) 구조다. 적립 60%·기부 15%(대표 지시 2026-09-16 — 종전 50%·30%)를 제품마진에서 빼고 영업·관리비까지 뺀 한계 공헌은 약 9.9%다 — 제품 매출은 이익원이 아니라 회원 적립금 생태계의 원천이다.",
    "10. 운전자본 가정이 모델 안에서 세 갈래다(FCF 매출 2% 유출 · 영업CF 1% 유입 · BS 회전율). 투자요청서에 BS와 월별 현금표를 함께 싣기 전에 통일할 것.",
    "11. v2.0 판관비는 근거 모델이다 — 광고비는 사업계획서 v12.1의 5대 엔진(발송 건수·노출·채널 CPM·QR 센터), 인건비는 1차 섹션별 17명 × 업계 급여(워크피디아·사람인 등) + 자문 4명, AI·데이터·클라우드는 KOSA 2026 단가·NCP 요금·LLM 공식 단가. 단가와 출처 URL은 비용근거 시트, 검증 결과(확인·보정·근거 부족)도 함께 적었다.",
    "12. 민감도(v3.0 기본값, 필요 총자금 A·B·C · 올림 여유 A 9.9억 · B 3.3억 · C 4.8억 — A 필요 총자금 100.1억은 100억 경계를 900만원 넘은 값이라 유리한 변화 하나로 100억이 된다) — 집행률 −20%는 +3.4·+6.9·+3.2억(A 110 · B 130 · C 140억) · 광고 단가 전체 +20%는 +6.5·+11.9·+11.9억(A 110 · B 130 · C 150억) · 급여 +20%는 +4.3·+6.0·+6.0억(A 110 · B 130 · C 150억) · 메디에이지 투자 20억은 ±20억 · 인원 탄력성 0.5는 −0.8·−2.2·−2.7억(A 100 · B 120 · C 140억) · AI 모듈 표준 1억은 −1.9·−2.0·−2.0억(A 100 · B 120 · C 140억). 매출 일정 민감도 — 병원·약국 구독을 2028부터로 미루면 +5.7·+7.0·+7.0억(A 110 · B 130 · C 150억) · 모든 개시가 한 달씩 늦으면 +4.2·+4.4·+1.8억(A 110 · B 130 · C 140억) · 오픈이 한 달 늦으면(비용 그대로) +4.2억씩(A 110 · B 130 · C 140억) · 2027 커머스 미개시면 +4.1억씩(A 110 · B 130 · C 140억) · 모든 줄이 1월부터 전액이면 −18.4·−18.5·−11.5억(A 90 · B 100 · C 130억) · 연말 기준 산정(방식 1)이면 +0.6·0.0·−5.0억(그대로) · 성숙 계수를 끄면 0.0·−1.4·−1.7억(그대로). 현금 민감도 — 모든 매출 당월 입금이면 −10.6·−18.8·−19.1억(A 90 · B 100 · C 120억) · 제품판매가 다음 달 입금이면 +31.9·+37.7·+37.7억(A 140 · B 160 · C 180억) · 오픈 전 광고가 없으면 −4.3·−8.9·−8.9억(A 100 · B 110 · C 130억) · 준비기간 이자 제외 −2.0·−3.3·−3.3억(A 100 · B 120 · C 140억) · B·C 검진 계절을 달력에 고정하면 +0.7억(그대로) · C의 DB 미공급을 달력 2027로만 두면 −9.2억(C 130억).",
    "13. 2028부터 인원은 매출 지표에 비례(탄력성 1.0 · 2027 기준 지표는 개시 계수 적용 전 연 환산 = 2027년 말 운영 규모)해 2031 436명 · 1인당 매출 약 29.2억이다 — 네이버 별도 13.9억, 국내 디지털헬스 피어 중앙값 약 1.9억(검증 보정 1.92억). 산정 방식 1(연말 기준)이면 지표가 연말 규모라 2031 511명. 2027 17명(1인당 6.5억)은 피어 대비 매우 적은 인원이라 CS·B2B 영업·광고 운영·개인정보 준법을 누가 맡는지 설명이 필요하다.",
    "14. 보수적으로 둔 가정 — 대표 확인 필요: ① 포인트 적립·기부는 적립한 달에 현금 유출(실제는 사용 시점) ② 오픈 전 사전 광고(2026-10 30% · 11월 60% · 12월 100% — 발송·매체·소재·카드사만)를 2027 광고 예산에 더해 집행 ③ 무료 3종 원가는 하이핀 검진 예약분만(④ QR·⑤ B2B 가입자에게도 주면 추가) ④ 법무·회계감사·배상책임보험·인증 사후심사 같은 고정 관리비는 별도 줄 없음 ⑤ 2028부터 고도화 CAPEX와 클라우드 증설 일부 중복 가능 ⑥ (모델 경계) 2028~2031 성숙 계수는 연 단위 값이라 연중 모양은 회원·기관 경로를 따른다 — 커머스 0.84~0.93 · 돌봄 2028 0.93 ⑦ 법인세는 이월결손금(2026 준비기간 비용 A 11.5억 + 2027 손실)을 2028부터 차감해 2028분 38.4억(A)을 2029-03에 낸다 — 임차·채용 수수료(모델 밖 현금 항목)는 2027부터 과세표준에서 빼지 않음 ⑧ 검진 연계 건당 매출(자사 3만·타사 1만)과 돌봄 파트너 이용료는 의료법 §27③ · 노인장기요양보험법 §35⑥ 검토가 필요하다(조사 지적) — 정액·광고 구조, 비유료 기관 노출."]:
    cell(G, f"B{gr}", t_); gr += 1
G.column_dimensions["A"].width = 3
G.column_dimensions["B"].width = 34
for col, wd in (("C", 17), ("D", 17), ("E", 17), ("F", 9), ("G", 26)):
    G.column_dimensions[col].width = wd

for ws in wb.worksheets:
    ws.sheet_view.showGridLines = False
wb.save(OUT)
print("saved", OUT)
json.dump({"CR": CR, "YR": YR, "MR": MR, "HR": HR, "AR": AR, "RA": RA, "RB": RB, "RC": RC, "TR": TR, "FR": FR, "PH": {f"{k[0]}|{k[1]}": v for k, v in PH.items()}},
          open(OUT + ".map.json", "w", encoding="utf-8"), ensure_ascii=False)
print("rows 현금", cr, "투자조건", tr)
