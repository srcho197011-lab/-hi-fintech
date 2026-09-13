# -*- coding: utf-8 -*-
"""하이젠케어 전략적 투자요청서 — 투자금 산정·세부 예산 양식 생성기 v1.1
재현 순서(저장소 루트에서):
  1) node scripts/invest/fin_dump.mjs . scripts/invest/_fin.json          # finModel.js 기본값 덤프
  2) python scripts/invest/gen_budget.py scripts/invest/_fin.json docs/invest/하이젠케어_투자금산정_예산양식_v1.1.xlsx
  3) 엑셀로 열어 전체 재계산 후 저장(수식 값 캐시)
  4) python scripts/invest/oracle3.py                                     # 독립 정답지 — 엑셀 요약값과 같아야 한다
docs/invest/ 는 .gitignore 대상(대외비)이라 산출물은 커밋되지 않고 이 생성기만 남는다."""
"""(v1.0 머리말) 하이젠케어 전략적 투자요청서 — 투자금 산정·세부 예산 양식 생성기
입력: finModel.js 덤프(fin.json) · 출력: xlsx
원칙: 모든 계산은 수식(가정 시트 연결) · 원 단위로 계산하고 백만원으로 표시 · 기본값 = finModel 확정값"""
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.comments import Comment

FIN = json.load(open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]
P = FIN["P"]
Y5 = FIN["years"]

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
YRS = ["1차연도", "2차연도", "3차연도", "4차연도", "5차연도"]
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
cell(A, "A2", "파란 글씨 = 입력값 · 노란 칸 = 투자금에 영향이 큰 핵심 가정 · 기본값은 finModel.js(FIN_P_DEFAULT) 확정값", SUB)
header_row(A, 4, ["구분", "항목", "단위", "1차연도", "2차연도", "3차연도", "4차연도", "5차연도", "근거 · 출처"])
AR = {}   # key -> row
r = 5

SRC = "finModel.js FIN_P_DEFAULT"


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
put("activeAbs", "하이핀 경유 검진 예약(연)", "건", P["activeAbs"], F_CNT, SRC + " activeAbs · 형 확정 2026-08-20")
put("mktConsent", "마케팅(보험 안내) 동의 회원(누적)", "명", P["mktConsentEnd"], F_CNT, SRC + " mktConsentEnd · 형 확정 2026-08-20")
put("churn", "연간 회원 이탈률", "%", P["churn"], F_PCT, SRC + " churn — 총가입 필요량 산출용")

gap("② 제휴 기관 · AI 플랫폼 구독(EMR·UIP)")
put("centers", "검진센터(연말)", "곳", P["checkupCenters"], F_CNT, SRC + " checkupCenters")
put("hospitals", "병원(연말)", "곳", P["hospitals"], F_CNT, SRC + " hospitals")
put("pharmacies", "약국(연말)", "곳", P["pharmacies"], F_CNT, SRC + " pharmacies · 5차 = 전국 약국 25,047곳(2024 심평원)의 48%")
put("subBase", "구독료 — 2차연도 월 기본", "원/월", P["subFeeBase"], F_WON, "1차연도 무료(시장 선점) → 2차 월 50만")
put("subStep", "구독료 — 연 인상폭", "원/월", P["subFeeStep"], F_WON, "매년 +50만")
put("subCap", "구독료 — 상한", "원/월", P["subFeeCap"], F_WON, "월 300만 한도")
put("subPaid", "유료 전환 기관 비율", "%", P["subPaidRate"], F_PCT, SRC + " subPaidRate · 기관 이탈은 모델에 없음(0) — 검증보고서 v1.1 D4")
put("subCost", "구독 운영 원가율(클라우드·연동)", "%", P["subCostRate"], F_PCT, SRC + " subCostRate")

gap("③ 제품판매(건강쇼핑 · GMV 총액 인식)")
put("buyerRate", "구매 회원 비율", "%", P["productBuyerRate"], F_PCT, SRC + " productBuyerRate")
put("capture", "지갑 점유율(플랫폼 포착률)", "%", P["productCapture"], F_PCT, "기존 채널(오픈마켓·약국·마트) 병행 감안 70% 보수화")
put("ramp", "제품 가동률(연차별)", "%", P["productRamp"], F_PCT, "1차연도 준비·초기 광고 기간 1/3 · 형 확정 2026-09-07")
cats = P["productCats"]
for c in cats:
    put("arpu_" + c["key"], f"{c['label']} — 구매회원 1인 연 지출", "원/년", c["arpu"], F_WON, SRC + " productCats.arpu")
for c in cats:
    put("cost_" + c["key"], f"{c['label']} — 원가율", "%", c["cost"], F_PCT, SRC + " productCats.cost")
put("payRate", "결제 대행 수수료율(제품매출 대비)", "%", P["paymentRate"], F_RATE, SRC + " paymentRate")
put("rewardRate", "포인트(토큰) 적립률 — 제품마진 대비", "%", P["rewardRate"], F_PCT, "적립 50% · 제품마진에만 적용(원칙)")
put("donationRate", "기부금(치료비 나눔) — 제품마진 대비", "%", P["donationRate"], F_PCT, "나눔 30% · 제품마진에만 적용(원칙)")

gap("④ 검진 연계 · 헬스케어 서비스 · 예약")
put("chkFee", "검진 연계 — 건당 매출", "원/건", P["checkupFee"], F_WON, "형 확정 2026-08-20")
put("chkCost", "검진 3종 서비스 원가(검진대비보험·AI 리포트·케어 키트)", "원/건", P["checkupCost3"], F_WON, "건당 2만원 이내 유지 · 형 확정 2026-08-31")
put("svcRate", "헬스케어 서비스 이용률(회원 대비)", "%", P["serviceRate"], F_PCT, SRC + " serviceRate")
put("svcFee", "헬스케어 서비스 — 1인 수수료", "원/명", P["serviceCommission"], F_WON, SRC + " serviceCommission")
put("svcCost", "헬스케어 서비스 원가율", "%", P["serviceCostRate"], F_PCT, SRC + " serviceCostRate")
put("resvPer", "예약 건수(검진 예약 1건당)", "건", P["resvPerActive"], '0.0', SRC + " resvPerActive")
put("resvFee", "예약 서비스 — 건당 수수료", "원/건", P["resvFee"], F_WON, "골프·시설 예약 건당 1만")

gap("⑤ 보험 중개 — 1차연도 매출 2위(32%, 1위는 제품판매 35%)")
put("insConv", "동의 DB 연간 공급 집행률(계약 전환율 아님)", "%", P["insConvRate"], F_PCT,
    "형 확정 2026-08-20 · 누적 동의 전체에 매년 적용 = 기존 동의자 재공급 전제(5년 786만 건 > 누적 동의 630만) · 하락 폭이 가장 불확실한 변수 — 같은 ±20%에서는 인건비가 더 민감 · 검증보고서 v1.1 B3 라벨 권고 반영", True)
put("insFee", "보험 중개 — 건당 수수료", "원/건", P["insFeePerCase"], F_WON, "형 확정 2026-08-20", True)

gap("⑥ 신규 스트림(2차연도부터)")
put("adPer", "광고·제휴 — 검진 예약 1건당", "원", P["adPerActive"], F_WON, SRC + " adPerActive")
put("agentRate", "AI Agent 프리미엄 구독률(회원 대비)", "%", P["aiAgentRate"], F_PCT, SRC + " aiAgentRate")
put("agentFee", "AI Agent 프리미엄 — 연 요금", "원/년", P["aiAgentFeeYear"], F_WON, "연 2.4만")
put("apiN", "API·데이터·분석 계약(B2B)", "건", P["apiClients"], F_CNT, SRC + " apiClients")
put("apiFee", "API·데이터·분석 — 건당 연 계약액", "원/년", P["apiFeeYear"], F_WON, "연 6천만")

gap("⑦ 판매관리비")
put("cac", "회원확보비(CAC) — 순증 1인당", "원/명", P["cac"], F_WON, "형 확정 · 회원 증가 속도에 따라 기간 인식", True)
put("brandRate", "브랜드·퍼포먼스 마케팅(매출 대비)", "%", P["brandMktRate"], F_PCT, "CAC와 별도 · 형 확정 상향")
put("launch", "초기 런칭 광고 선투입(절대액)", "원", P["launchMkt"], F_WON, "1차연도만 · 형 확정 2026-09-07")
put("payrollModel", "인건비 — 모델 확정값(인력계획 대조용)", "원", P["payroll"], F_WON, "인건비는 「인력계획」 시트가 원천 — 이 줄은 대조 기준", False)
put("rndRate", "연구개발(매출 대비 · 표준 요율)", "%", P["rndRate"], F_PCT, SRC + " rndRate")
put("cloudPer", "클라우드(검진 예약 1건당)", "원", P["cloudPerActive"], F_WON, SRC + " cloudPerActive")
put("gpuPer", "GPU(검진 예약 1건당)", "원", P["gpuPerActive"], F_WON, SRC + " gpuPerActive")
put("salesRate", "영업비(매출 대비 · 표준 요율)", "%", P["salesRate"], F_PCT, SRC + " salesRate")
put("adminRate", "관리비(매출 대비 · 표준 요율)", "%", P["adminRate"], F_PCT, SRC + " adminRate")
put("opexScale", "기타 운영비 스케일(AI 네이티브 운영)", "%", P["opexScale"], F_PCT, "하이 CS 흡수·AI 출수납 자동화로 표준 요율의 30%")

gap("⑧ 자산 · 금융 · 세금")
put("deprYear", "연 감가상각비(정상 연도)", "원", P["deprYear"], F_WON, SRC + " deprYear")
put("deprY1", "초년도 감가상각 인식 비율", "%", P["deprY1Rate"], F_PCT, "자산 취득 직후라 50%")
put("interest", "연 이자비용", "원", P["interestYear"], F_WON,
    "⚠ 장기차입 20억 대비 연 8억 = 암묵 이자율 40%(리스 포함 37.7%) · 차입금과 연동되지 않은 고정 상수 — 모델값 확인 필요", True)
put("tax", "법인세율", "%", P["taxRate"], F_PCT, "손실 연도에는 0(환급 없음) · 다음 해 3월 납부")
put("wcRate", "운전자본 증가(매출 대비)", "%", 0.02, F_PCT, "finModel.js 하드코딩 0.02 — A(계획) 기준에서 사용")
put("capital", "기존 조달 — 자본금", "원", P["capital"], F_WON, SRC + " capital")
put("surplus", "기존 조달 — 자본잉여금", "원", P["surplus"], F_WON, SRC + " surplus")
put("longDebt", "기존 조달 — 장기차입", "원", P["longDebt"], F_WON, SRC + " longDebt")
put("lease", "기존 조달 — 리스부채(비현금 · 참고)", "원", P["leaseLiab"], F_WON, SRC + " leaseLiab — 사용권자산의 대가라 현금 유입이 아니다. 가용 현금에서 제외")

gap("⑨ CAPEX 세부(연차별) — 합계는 finModel.js capex(1·2차 20억, 3~5차 50억)와 같게 배분한 예시")
capex_split = [("capex_platform", "플랫폼 개발 자산화", [800, 800, 1800, 1800, 1800]),
               ("capex_ai", "AI 모델 · 데이터 자산", [500, 500, 1400, 1400, 1400]),
               ("capex_infra", "서버 · 클라우드 인프라", [300, 300, 900, 900, 900]),
               ("capex_security", "보안 · 인증(ISMS-P 등)", [200, 200, 500, 500, 500]),
               ("capex_office", "사무 공간 · 장비", [200, 200, 400, 400, 400])]
for k, lab, v in capex_split:
    put(k, lab, "원", [x * 1000000 for x in v], F_WON, "배분은 예시 — 합계 준수")
cell(A, f"B{r}", "CAPEX 합계", BOLD)
for i in range(5):
    col = YC[i]
    cell(A, f"{col}{r}", f"=SUM({col}{AR['capex_platform']}:{col}{AR['capex_office']})", BLACK, F_WON, TOT, bold=True)
cell(A, f"I{r}", "finModel.js: 1·2차 2,000,000,000 · 3~5차 5,000,000,000", SUB)
AR["capexTotal"] = r
r += 1

gap("⑩ 월 배분 — 회원 증가 램프(가중치, 합이 0이 아니면 됨)")
header_row(A, r, ["", "연차", "", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], 1, SEC)
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
cell(A, f"B{r-5}", "1차연도", comment="finModel.js m1Ramp — 1차연도 월별 회원 증가 비중")

gap("⑪ 월 배분 — 초기 런칭 광고(가중치) · 모두 0이면 12개월 균등")
AR["launchPhaseRow"] = r
for y in range(5):
    cell(A, f"B{r}", YRS[y])
    for m in range(12):
        cell(A, f"{MC[m]}{r}", 1, BLUE, "0.0")
    r += 1

gap("⑫ 월 배분 — CAPEX 집행(가중치) · 모두 0이면 12개월 균등")
AR["capexPhaseRow"] = r
for y in range(5):
    cell(A, f"B{r}", YRS[y])
    for m in range(12):
        cell(A, f"{MC[m]}{r}", 1, BLUE, "0.0")
    r += 1

gap("⑬ 인건비 월 경로")
put("payMode", "월 배분 방식 — 1: 연간÷12 균등 / 2: 연속 채용 경로", "선택", 2, "0", "연간 합계는 둘 다 같다. 균등은 해가 바뀔 때 월 인건비가 계단처럼 뛰어 가짜 저점을 만든다", True)
put("payStart", "연속 채용 — 1차연도 1월 인건비", "원/월", 300000000, F_WON, "입력값(가정) — 약 35명 규모 착수 인력. 이후 연 합계를 지키며 직선으로 이어진다", True)

A.column_dimensions["A"].width = 12
A.column_dimensions["B"].width = 50
A.column_dimensions["C"].width = 8
for col in "DEFGH":
    A.column_dimensions[col].width = 16
for col in "IJKLMNO":
    A.column_dimensions[col].width = 12
A.column_dimensions["I"].width = 60
A.freeze_panes = "D5"


def AREF(key, yi=0, absolute=True):
    """가정 시트 참조 — 연차 배열이면 yi 열, 스칼라면 $D"""
    return f"'가정'!${YC[yi]}${AR[key]}"


def ASCALAR(key):
    return f"'가정'!$D${AR[key]}"


# ══════════════════════════════════════ 인력계획 ══════════════════════════════════════
H = wb.create_sheet("인력계획")
cell(H, "A1", "인력계획 — 직군별 인원 × 1인당 총인건비", TITLE)
cell(H, "A2", "1인당 총인건비 = 기본급 + 4대보험(회사부담) + 퇴직급여 + 복리후생. 기본 배분은 finModel.js 인건비 확정값에 맞춘 예시 — 직군 구성·단가를 바꿔 쓰십시오.", SUB)
header_row(H, 4, ["구분", "직군", "단위", "1차연도", "2차연도", "3차연도", "4차연도", "5차연도", "비고"])
jobs = [("dev", "플랫폼 개발(앱·웹·백엔드)"), ("ai", "AI · 데이터"), ("ops", "헬스케어 프로 지원 · 운영 · CS"),
        ("sales", "영업 · 제휴(기관 · 보험)"), ("mkt", "마케팅 · 콘텐츠"), ("mgmt", "경영지원(재무·법무·HR·보안)")]
heads = {"dev": [22, 70, 160, 340, 560], "ai": [12, 40, 95, 200, 330], "ops": [14, 60, 150, 335, 575],
         "sales": [8, 30, 75, 160, 270], "mkt": [6, 20, 45, 95, 160], "mgmt": [8, 25, 50, 90, 120]}
sal = {"dev": [105, 108, 111, 114, 117], "ai": [130, 134, 138, 142, 146], "ops": [75, 77, 79, 81, 83],
       "sales": [95, 98, 101, 104, 107], "mkt": [90, 93, 96, 99, 102], "mgmt": [97.5, 101, 104, 107, 110]}
HR = {}
hr = 5
section(H, hr, "① 인원(연평균 재직 기준)", 9); hr += 1
HR["headStart"] = hr
for k, lab in jobs:
    cell(H, f"B{hr}", lab); cell(H, f"C{hr}", "명", SUB)
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", heads[k][i], BLUE, F_CNT)
    HR["head_" + k] = hr; hr += 1
cell(H, f"B{hr}", "인원 합계", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=SUM({YC[i]}{HR['headStart']}:{YC[i]}{hr-1})", BLACK, F_CNT, TOT, bold=True)
cell(H, f"I{hr}", "finModel.js 주석: 1차 ~70명 · 5차 ~2,000명", SUB)
HR["headTotal"] = hr; hr += 2

section(H, hr, "② 1인당 연 총인건비(부대비용 포함)", 9); hr += 1
HR["salStart"] = hr
for k, lab in jobs:
    cell(H, f"B{hr}", lab); cell(H, f"C{hr}", "원/년", SUB)
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", int(round(sal[k][i] * 1000000)), BLUE, F_WON)
    HR["sal_" + k] = hr; hr += 1
hr += 1

section(H, hr, "③ 직군별 연 인건비 = 인원 × 1인당 총인건비", 9); hr += 1
HR["costStart"] = hr
for k, lab in jobs:
    cell(H, f"B{hr}", lab); cell(H, f"C{hr}", "원", SUB)
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", f"={YC[i]}{HR['head_'+k]}*{YC[i]}{HR['sal_'+k]}", BLACK, F_MIL)
    HR["cost_" + k] = hr; hr += 1
cell(H, f"B{hr}", "기타 인건비(성과급·주식보상 등 — 모델 정합 조정분)"); cell(H, f"C{hr}", "원", SUB)
# 기본값 = 모델 인건비 − 직군 합계(성과급 등으로 해석되는 잔여)
for i in range(5):
    base = sum(heads[k][i] * int(round(sal[k][i] * 1000000)) for k, _ in jobs)
    cell(H, f"{YC[i]}{hr}", P["payroll"][i] - base, BLUE, F_MIL)
cell(H, f"I{hr}", "입력값 — 기본값은 모델 인건비와 직군 합계의 차이", SUB)
HR["other"] = hr; hr += 1
cell(H, f"B{hr}", "인건비 합계 → 연간손익", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=SUM({YC[i]}{HR['costStart']}:{YC[i]}{HR['other']})", BLACK, F_MIL, TOT, bold=True)
HR["payTotal"] = hr; hr += 1
cell(H, f"B{hr}", "모델 확정값(가정)")
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"={AREF('payrollModel', i)}", GREEN, F_MIL)
HR["payModel"] = hr; hr += 1
cell(H, f"B{hr}", "차이(0이면 모델과 같음)")
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"={YC[i]}{HR['payTotal']}-{YC[i]}{HR['payModel']}", BLACK, F_MIL)
HR["payDiff"] = hr; hr += 1
cell(H, f"B{hr}", "1인당 평균 인건비")
HR["avgSal"] = hr
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=IF({YC[i]}{HR['headTotal']}=0,0,{YC[i]}{HR['payTotal']}/{YC[i]}{HR['headTotal']})", BLACK, F_WON)
hr += 2

section(H, hr, "④ 인건비 구성 분해(참고) — 1인당 총인건비를 기본급과 부대비용으로 나눈 값", 9); hr += 1
HR["rateStart"] = hr
for k, lab, v, note in [("r4", "4대보험(회사부담) — 기본급 대비", 0.105, "국민연금·건강·장기요양·고용·산재 합 근사"),
                        ("rRet", "퇴직급여 — 기본급 대비", 0.0833, "연 1개월분(1/12)"),
                        ("rWel", "복리후생 — 기본급 대비", 0.05, "가정")]:
    cell(H, f"B{hr}", lab); cell(H, f"C{hr}", "%", SUB); cell(H, f"D{hr}", v, BLUE, F_RATE); cell(H, f"I{hr}", note, SUB)
    HR[k] = hr; hr += 1
rsum = f"(1+$D${HR['r4']}+$D${HR['rRet']}+$D${HR['rWel']})"
for k, lab, expr in [("base", "기본급", "{c}{t}/" + rsum), ("ins4", "4대보험", "{c}{b}*$D$" + str(HR['r4'])),
                     ("ret", "퇴직급여", "{c}{b}*$D$" + str(HR['rRet'])), ("wel", "복리후생", "{c}{b}*$D$" + str(HR['rWel']))]:
    cell(H, f"B{hr}", lab)
    HR["dec_" + k] = hr
    for i in range(5):
        cell(H, f"{YC[i]}{hr}", "=" + expr.format(c=YC[i], t=HR["payTotal"], b=HR.get("dec_base", hr)), BLACK, F_MIL)
    hr += 1
cell(H, f"B{hr}", "구성 합계(=인건비 합계)", BOLD)
for i in range(5):
    cell(H, f"{YC[i]}{hr}", f"=SUM({YC[i]}{HR['dec_base']}:{YC[i]}{HR['dec_wel']})", BLACK, F_MIL, TOT, bold=True)
hr += 2

section(H, hr, "⑤ 인건비 월 경로(연속 채용) — 월 인건비가 전년 말 수준에서 이어지고, 연 합계는 보존", 9); hr += 1
cell(H, f"B{hr}", "해당 연차 1월 인건비")
HR["payS"] = hr
for i in range(5):
    v = f"={ASCALAR('payStart')}" if i == 0 else f"={YC[i-1]}{hr+1}"
    cell(H, f"{YC[i]}{hr}", v, GREEN if i == 0 else BLACK, F_WON)
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
    cell(H, f"{YC[i]}{hr}", f'=IF({ASCALAR("payMode")}=1,"균등 모드 — 해당 없음",IF(OR({s_}<0,{e_}<0),"음수 — 조정 필요",IF({e_}<{s_},"연중 감소 — 1월 인건비 과대","정상")))', BLACK)
hr += 1

H.column_dimensions["A"].width = 6
H.column_dimensions["B"].width = 44
H.column_dimensions["C"].width = 7
for col in "DEFGH":
    H.column_dimensions[col].width = 16
H.column_dimensions["I"].width = 44
H.freeze_panes = "D5"


# ══════════════════════════════════════ 연간손익 ══════════════════════════════════════
Y = wb.create_sheet("연간손익")
cell(Y, "A1", "연간 손익 · 투자 — 1~5차연도 세부 계정", TITLE)
cell(Y, "A2", "단위: 백만원(수치는 원으로 계산, 표시만 백만원) · 운영 지표는 명·건·곳 · 초록 = 다른 시트 연결 · 검정 = 수식", SUB)
header_row(Y, 4, ["구분", "계정", "산식", "1차연도", "2차연도", "3차연도", "4차연도", "5차연도", "5년 합계"])
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
yline("new", "순증 회원(CAC 대상)", lambda i: f"=MAX(0,{yv('me', i)}-{yv('mp', i)})", F_CNT, "연말 − 기초")
yline("gross_new", "총가입 필요량(이탈 보전 포함)", lambda i: f"={yv('new', i)}+ROUND({yv('mp', i)}*{ASCALAR('churn')},0)", F_CNT, "순증 + 기초×이탈률")
yline("active", "검진 예약(활성)", lambda i: f"={AREF('activeAbs', i)}", F_CNT, "가정", font=GREEN)
yline("mkt", "마케팅 동의 회원", lambda i: f"={AREF('mktConsent', i)}", F_CNT, "가정", font=GREEN, sum5=False)
yline("insts", "제휴 기관 합계", lambda i: f"={AREF('centers', i)}+{AREF('hospitals', i)}+{AREF('pharmacies', i)}", F_CNT, "검진센터+병원+약국", sum5=False)
yline("subFee", "구독료(월)", lambda i: "=0" if i == 0 else f"=MIN({ASCALAR('subCap')},{ASCALAR('subBase')}+{ASCALAR('subStep')}*{i-1})", F_WON, "1차 0 · 2차부터 기본+인상폭×(연차−2), 상한", sum5=False)
yline("paid", "유료 기관", lambda i: f"=ROUND({yv('insts', i)}*{ASCALAR('subPaid')},0)", F_CNT, "기관×유료 전환율", sum5=False)
yline("subGross", "구독 매출 총액(원천)", lambda i: f"={yv('paid', i)}*{yv('subFee', i)}*12", F_MIL, "유료 기관×월 구독료×12")
yline("buyers", "구매 회원", lambda i: f"=ROUND({yv('me', i)}*{ASCALAR('buyerRate')},0)", F_CNT, "연말 회원×구매 비율", sum5=False)
yline("svcUsers", "헬스케어 서비스 이용자", lambda i: f"=ROUND({yv('me', i)}*{ASCALAR('svcRate')},0)", F_CNT, "연말 회원×이용률")
yline("resv", "예약 건수", lambda i: f"=ROUND({yv('active', i)}*{AREF('resvPer', i)},0)", F_CNT, "검진 예약×예약 배수")
yline("insCases", "보험 DB 공급 건수", lambda i: f"=ROUND({yv('mkt', i)}*{ASCALAR('insConv')},0)", F_CNT, "누적 동의×공급 집행률(매년 재공급)")
yline("agentUsers", "AI Agent 구독자", lambda i: f"=ROUND({yv('me', i)}*{AREF('agentRate', i)},0)", F_CNT, "연말 회원×구독률", sum5=False)
yline("apiN", "API 계약", lambda i: f"={AREF('apiN', i)}", F_CNT, "가정", font=GREEN, sum5=False)

ysec("매출")
for c in cats:
    k = c["key"]
    yline("rev_" + k, f"제품판매 — {c['label']}",
          lambda i, k=k: f"=ROUND({yv('buyers', i)}*{ASCALAR('arpu_'+k)}*{ASCALAR('capture')}*{AREF('ramp', i)},0)",
          F_MIL, "구매회원×1인 지출×점유율×가동률", grp="제품")
yline("revP", "제품판매 소계(GMV 총액)", lambda i: f"=SUM({YC[i]}{YR['rev_supp']}:{YC[i]}{YR['rev_sports']})", F_MIL, "", total=True)
yline("revChk", "검진 연계 수수료", lambda i: f"={yv('active', i)}*{ASCALAR('chkFee')}", F_MIL, "검진 예약×건당 매출", grp="수수료")
yline("revSvc", "헬스케어 서비스 수수료", lambda i: f"={yv('svcUsers', i)}*{ASCALAR('svcFee')}", F_MIL, "이용자×수수료")
yline("revResv", "예약 서비스 수수료", lambda i: f"={yv('resv', i)}*{ASCALAR('resvFee')}", F_MIL, "예약 건수×수수료")
yline("sub_c", "AI 플랫폼 구독 — 검진센터분",
      lambda i: f"=IF({yv('insts', i)}=0,0,ROUND({yv('subGross', i)}*{AREF('centers', i)}/{yv('insts', i)},0))", F_MIL, "구독 총액×검진센터 비중", grp="구독")
yline("sub_h", "AI 플랫폼 구독 — 병원분",
      lambda i: f"=IF({yv('insts', i)}=0,0,ROUND({yv('subGross', i)}*{AREF('hospitals', i)}/{yv('insts', i)},0))", F_MIL, "구독 총액×병원 비중")
yline("sub_p", "AI 플랫폼 구독 — 약국분", lambda i: f"={yv('subGross', i)}-{yv('sub_c', i)}-{yv('sub_h', i)}", F_MIL, "총액 − 검진센터분 − 병원분")
yline("revSub", "AI 플랫폼 구독 소계(EMR·UIP 사용료)", lambda i: f"=SUM({YC[i]}{YR['sub_c']}:{YC[i]}{YR['sub_p']})", F_MIL, "", total=True)
yline("revIns", "보험 중개 수수료", lambda i: f"={yv('insCases', i)}*{ASCALAR('insFee')}", F_MIL, "공급 건수×건당 7만 — IM은 「시스템사용료+광고료」 정산(법률검토 전제)", grp="보험")
yline("revAd", "광고 · 제휴", lambda i: f"={yv('active', i)}*{AREF('adPer', i)}", F_MIL, "검진 예약×건당 광고", grp="신규")
yline("revAg", "AI Agent 프리미엄", lambda i: f"={yv('agentUsers', i)}*{ASCALAR('agentFee')}", F_MIL, "구독자×연 요금")
yline("revApi", "API · 데이터 · 분석(B2B)", lambda i: f"={yv('apiN', i)}*{ASCALAR('apiFee')}", F_MIL, "계약×연 계약액")
yline("rev", "매출액 합계", lambda i: f"={yv('revP', i)}+{yv('revChk', i)}+{yv('revSvc', i)}+{yv('revResv', i)}+{yv('revSub', i)}+{yv('revIns', i)}+{yv('revAd', i)}+{yv('revAg', i)}+{yv('revApi', i)}", F_MIL, "", total=True)

ysec("매출원가")
for c in cats:
    k = c["key"]
    yline("cogs_" + k, f"제품 원가 — {c['label']}", lambda i, k=k: f"=ROUND({yv('rev_'+k, i)}*{ASCALAR('cost_'+k)},0)", F_MIL, "카테고리 매출×원가율", grp="제품")
yline("cogsP", "제품 원가 소계", lambda i: f"=SUM({YC[i]}{YR['cogs_supp']}:{YC[i]}{YR['cogs_sports']})", F_MIL, "", total=True)
yline("chkCogs", "검진 3종 서비스 원가", lambda i: f"={yv('active', i)}*{ASCALAR('chkCost')}", F_MIL, "검진 예약×건당 원가", grp="서비스")
yline("svcCost", "헬스케어 서비스 원가", lambda i: f"=ROUND({yv('revSvc', i)}*{ASCALAR('svcCost')},0)", F_MIL, "서비스 매출×원가율")
yline("subCost", "구독 운영 원가", lambda i: f"=ROUND({yv('revSub', i)}*{ASCALAR('subCost')},0)", F_MIL, "구독 매출×원가율")
yline("payFee", "결제 대행 수수료", lambda i: f"=ROUND({yv('revP', i)}*{ASCALAR('payRate')},0)", F_MIL, "제품 매출×수수료율")
yline("cogs", "매출원가 합계", lambda i: f"={yv('cogsP', i)}+{yv('chkCogs', i)}+{yv('svcCost', i)}+{yv('subCost', i)}+{yv('payFee', i)}", F_MIL, "", total=True)
yline("gross", "매출총이익", lambda i: f"={yv('rev', i)}-{yv('cogs', i)}", F_MIL, "매출 − 원가", total=True)
yline("gm", "매출총이익률", lambda i: f"=IF({yv('rev', i)}=0,0,{yv('gross', i)}/{yv('rev', i)})", F_PCT, "", sum5=False)

ysec("판매관리비")
yline("cac", "회원확보비(CAC)", lambda i: f"={yv('new', i)}*{ASCALAR('cac')}", F_MIL, "순증 회원×CAC", grp="마케팅")
yline("brand", "브랜드 · 퍼포먼스 마케팅", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('brandRate')},0)", F_MIL, "매출×요율")
yline("launch", "초기 런칭 광고", lambda i: f"={AREF('launch', i)}", F_MIL, "가정(절대액)", font=GREEN)
yline("reward", "포인트(토큰) 적립", lambda i: f"=ROUND(({yv('revP', i)}-{yv('cogsP', i)})*{ASCALAR('rewardRate')},0)", F_MIL, "제품마진×적립률", grp="고객·사회")
yline("donation", "기부금(치료비 나눔)", lambda i: f"=ROUND(({yv('revP', i)}-{yv('cogsP', i)})*{ASCALAR('donationRate')},0)", F_MIL, "제품마진×기부율")
yline("pay", "인건비", lambda i: f"='인력계획'!{YC[i]}{HR['payTotal']}", F_MIL, "인력계획 합계", grp="인력", font=GREEN)
yline("rnd", "연구개발", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('rndRate')}*{ASCALAR('opexScale')},0)", F_MIL, "매출×요율×운영 스케일", grp="운영")
yline("cloud", "클라우드", lambda i: f"=ROUND({yv('active', i)}*{ASCALAR('cloudPer')}*{ASCALAR('opexScale')},0)", F_MIL, "검진 예약×단가×스케일")
yline("gpu", "GPU", lambda i: f"=ROUND({yv('active', i)}*{ASCALAR('gpuPer')}*{ASCALAR('opexScale')},0)", F_MIL, "검진 예약×단가×스케일")
yline("salesCost", "영업비", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('salesRate')}*{ASCALAR('opexScale')},0)", F_MIL, "매출×요율×스케일")
yline("adminCost", "관리비", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('adminRate')}*{ASCALAR('opexScale')},0)", F_MIL, "매출×요율×스케일")
yline("sga", "판매관리비 합계", lambda i: "=" + "+".join(yv(k, i) for k in ["cac", "brand", "launch", "reward", "donation", "pay", "rnd", "cloud", "gpu", "salesCost", "adminCost"]), F_MIL, "", total=True)

ysec("이익 — 모델 표기와 보정(감가상각 차감)")
yline("ebitModel", "영업이익(모델 표기 · 감가상각 미차감)", lambda i: f"={yv('gross', i)}-{yv('sga', i)}", F_MIL, "finModel.js ebit — 실질적으로 EBITDA", total=False)
yline("depr", "감가상각비", lambda i: f"=ROUND({ASCALAR('deprYear')}*" + (f"{ASCALAR('deprY1')}" if i == 0 else "1") + ",0)", F_MIL, "정상 연도 × (초년도 비율)")
yline("ebit", "영업이익(보정)", lambda i: f"={yv('ebitModel', i)}-{yv('depr', i)}", F_MIL, "모델 표기 − 감가상각", total=True)
yline("opm", "영업이익률(보정)", lambda i: f"=IF({yv('rev', i)}=0,0,{yv('ebit', i)}/{yv('rev', i)})", F_PCT, "", sum5=False)
yline("ebitda", "EBITDA", lambda i: f"={yv('ebit', i)}+{yv('depr', i)}", F_MIL, "보정 영업이익 + 감가상각")
yline("int", "이자비용", lambda i: f"={ASCALAR('interest')}", F_MIL, "가정", font=GREEN)
yline("pbt", "법인세차감전이익", lambda i: f"={yv('ebit', i)}-{yv('int', i)}", F_MIL, "보정 영업이익 − 이자")
yline("tax", "법인세(다음 해 3월 납부)", lambda i: f"=MAX(0,{yv('pbt', i)})*{ASCALAR('tax')}", F_MIL, "세전이익이 +일 때만")
yline("net", "당기순이익", lambda i: f"={yv('pbt', i)}-{yv('tax', i)}", F_MIL, "", total=True)

ysec("투자 · 현금")
yline("capex", "CAPEX", lambda i: f"='가정'!{YC[i]}{AR['capexTotal']}", F_MIL, "가정 CAPEX 합계", font=GREEN)
yline("dwc", "운전자본 증가", lambda i: f"=ROUND({yv('rev', i)}*{ASCALAR('wcRate')},0)", F_MIL, "매출×증가율")
yline("fcf", "잉여현금흐름(FCF · 보정)", lambda i: f"={yv('ebit', i)}-MAX(0,{yv('ebit', i)})*{ASCALAR('tax')}+{yv('depr', i)}-{yv('capex', i)}-{yv('dwc', i)}", F_MIL, "영업이익−세금(손실 시 0)+감가상각−CAPEX−운전자본", total=True)
yline("cumfcf", "누적 FCF(연 단위)", lambda i: f"={yv('fcf', 0)}" if i == 0 else f"={YC[i-1]}{yr}+{yv('fcf', i)}", F_MIL, "⚠ 연 단위 누적은 연중 저점을 보지 못한다 — 「현금·투자금」 시트 참조", sum5=False)

ysec("참고 — 합계에 넣지 않는 메모(투자 심사 대비)")
yline("netRev1", "순매출(제품 순액 · 대리인 가정)", lambda i: f"={yv('rev', i)}-{yv('cogsP', i)}", F_MIL, "매출 − 제품 원가 · 입점형이면 대리인일 가능성")
yline("netRev2", "순매출(포인트 이연 반영 · 상한)", lambda i: f"={yv('netRev1', i)}-{yv('reward', i)}", F_MIL, "적립 전액 이연 가정 — 실제는 사용률 반영(IFRS15)")
varr = f"({ASCALAR('brandRate')}+({ASCALAR('rndRate')}+{ASCALAR('salesRate')}+{ASCALAR('adminRate')})*{ASCALAR('opexScale')})"
yline("prodContrib", "제품판매 한계 공헌", lambda i: f"={yv('revP', i)}-{yv('cogsP', i)}-{yv('payFee', i)}-{yv('reward', i)}-{yv('donation', i)}-{yv('revP', i)}*{varr}", F_MIL, "제품 − 원가·결제·적립·기부·매출연동 판관비 — 적립금 생태계 비용")
yline("prodContribR", "제품판매 한계 공헌률", lambda i: f"=IF({yv('revP', i)}=0,0,{yv('prodContrib', i)}/{yv('revP', i)})", F_PCT, "약 −2.4%", sum5=False)
yline("insContrib", "보험 중개 공헌이익", lambda i: f"={yv('revIns', i)}*(1-{varr})", F_MIL, "원가 없음 · 매출연동 판관비만 차감")
yline("ebitExIns", "보험 제외 시 영업이익(보정)", lambda i: f"={yv('ebit', i)}-{yv('insContrib', i)}", F_MIL, "1차연도 이익이 보험 한 줄에 달려 있는 정도")
yline("effCac1", "실효 CAC(순증 기준)", lambda i: f"=IF({yv('new', i)}=0,0,({yv('cac', i)}+{yv('brand', i)}+{yv('launch', i)})/{yv('new', i)})", F_WON, "(CAC+브랜드+런칭)÷순증 · 모델 CAC 5천원과 병기", sum5=False)
yline("effCac2", "실효 CAC(총가입 기준)", lambda i: f"=IF({yv('gross_new', i)}=0,0,({yv('cac', i)}+{yv('brand', i)}+{yv('launch', i)})/{yv('gross_new', i)})", F_WON, "이탈 보전분 포함", sum5=False)

ysec("IM 공급표 대조 — 합계 밖(보험 매출 모수가 문서마다 다름 · 대표 결정 필요)")
yline("newConsent", "연 신규 동의", lambda i: f"={yv('mkt', i)}" if i == 0 else f"={yv('mkt', i)}-{YC[i-1]}{YR['mkt']}", F_CNT, "누적 동의의 연 증가분")
yline("imCases", "IM p7 공급 건수(연 신규 동의×60%)", lambda i: f"=ROUND({yv('newConsent', i)}*{ASCALAR('insConv')},0)", F_CNT, "현대해상 IM 작성프롬프트 v1.2:74 · IM v1.1 p7")
yline("imRev", "IM 기준 보험 매출", lambda i: f"={yv('imCases', i)}*{ASCALAR('insFee')}", F_MIL, "5년 누계가 모델 5차 연간값과 같아지는 착시 주의")
yline("imDiff", "모델 − IM 차이(보험 매출)", lambda i: f"={yv('revIns', i)}-{yv('imRev', i)}", F_MIL, "1차 0 · 2~5차 +84/+336/+840/+1,596억")

# ── 모델 대조 블록(finModel.js 실행값 스냅샷) ──
yr += 2
section(Y, yr, "finModel.js 대조 — 기본값일 때 차이가 0이어야 한다(모델값은 2026-09-13 finYears(5) 실행 스냅샷)", 9)
yr += 1
header_row(Y, yr, ["", "계정", "", "1차연도", "2차연도", "3차연도", "4차연도", "5차연도", ""])
yr += 1
YR["chkStart"] = yr
for key, lab, mk in [("rev", "매출액 합계", "revenue"), ("cogs", "매출원가 합계", "cogs"), ("gross", "매출총이익", "gross"),
                     ("sga", "판매관리비 합계", "sga"), ("ebitModel", "영업이익(모델 표기)", "ebit"), ("revP", "제품판매", "revProduct"),
                     ("revIns", "보험 중개", "revInsurance"), ("pay", "인건비", "payroll")]:
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
cell(M, "A1", "월별 예산 — 60개월 세부 계정", TITLE)
cell(M, "A2", "단위: 백만원 · 연간손익의 각 계정을 배분 기준에 따라 월로 편다. 오른쪽 끝에 연간 합계 대조(차이 0이어야 정상).", SUB)
MCOL = [CL(4 + t) for t in range(60)]            # D .. BK
YSUMC = [CL(4 + 60 + i) for i in range(5)]      # BL .. BP 연간 합계
YDIFC = [CL(4 + 65 + i) for i in range(5)]      # BQ .. BU 차이
cell(M, "A4", "구분", HDR, fill=NAVY); cell(M, "B4", "계정", HDR, fill=NAVY); cell(M, "C4", "배분 기준", HDR, fill=NAVY)
cell(M, "A5", "", HDR, fill=NAVY); cell(M, "B5", "", HDR, fill=NAVY); cell(M, "C5", "", HDR, fill=NAVY)
for t in range(60):
    y, m = divmod(t, 12)
    cell(M, f"{MCOL[t]}4", YRS[y] if m == 0 else "", HDR, fill=NAVY)
    cell(M, f"{MCOL[t]}5", f"{m+1}월", HDR, fill=NAVY, align=Alignment(horizontal="center"))
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
mline("ramp", "회원 증가 램프(가중)", "가정 ⑩", lambda t, y, m, c: f"='가정'!{MC[m]}{AR['rampRow']+y}", "0.0", font=GREEN)


def yrange(key, y):
    a, b = ycols(y)
    return f"${a}${MR[key]}:${b}${MR[key]}"


mline("newM", "월 신규 회원", "연간 순증 × 램프 비중",
      lambda t, y, m, c: f"=IF(SUM({yrange('ramp', y)})=0,'연간손익'!${YC[y]}${YR['new']}/12,'연간손익'!${YC[y]}${YR['new']}*{c}{MR['ramp']}/SUM({yrange('ramp', y)}))",
      F_CNT, reconcile_key="new")
mline("endM", "월말 누적 회원", "기초 회원 + 연내 누적 신규",
      lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['mp']}+SUM(${ycols(y)[0]}${MR['newM']}:{c}{MR['newM']})", F_CNT)
mline("w", "매출 인식 가중치", "월말 회원 ÷ 연내 월말 회원 합",
      lambda t, y, m, c: f"=IF(SUM({yrange('endM', y)})=0,1/12,{c}{MR['endM']}/SUM({yrange('endM', y)}))", '0.00%', reconcile_key="")


def by_weight(akey):
    return lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR[akey]}*{c}${MR['w']}"


msec("매출")
for cc in cats:
    mline("rev_" + cc["key"], f"제품판매 — {cc['label']}", "매출 가중", by_weight("rev_" + cc["key"]), reconcile_key="rev_" + cc["key"], grp="제품")
mline("revP", "제품판매 소계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['rev_supp']}:{c}{MR['rev_sports']})", total=True, reconcile_key="revP")
mline("revChk", "검진 연계 수수료", "매출 가중", by_weight("revChk"), reconcile_key="revChk", grp="수수료")
mline("revSvc", "헬스케어 서비스 수수료", "매출 가중", by_weight("revSvc"), reconcile_key="revSvc")
mline("revResv", "예약 서비스 수수료", "매출 가중", by_weight("revResv"), reconcile_key="revResv")
mline("revSub", "AI 플랫폼 구독(EMR·UIP)", "매출 가중", by_weight("revSub"), reconcile_key="revSub", grp="구독")
mline("revIns", "보험 중개 수수료", "매출 가중", by_weight("revIns"), reconcile_key="revIns", grp="보험")
mline("revEtc", "광고 · AI Agent · API", "매출 가중",
      lambda t, y, m, c: f"=('연간손익'!${YC[y]}${YR['revAd']}+'연간손익'!${YC[y]}${YR['revAg']}+'연간손익'!${YC[y]}${YR['revApi']})*{c}${MR['w']}",
      reconcile_key="", grp="신규")
mline("rev", "매출액 합계", "합계",
      lambda t, y, m, c: f"={c}{MR['revP']}+{c}{MR['revChk']}+{c}{MR['revSvc']}+{c}{MR['revResv']}+{c}{MR['revSub']}+{c}{MR['revIns']}+{c}{MR['revEtc']}",
      total=True, reconcile_key="rev")

msec("매출원가")
mline("cogsP", "제품 원가", "매출 가중", by_weight("cogsP"), reconcile_key="cogsP", grp="제품")
mline("chkCogs", "검진 3종 서비스 원가", "매출 가중", by_weight("chkCogs"), reconcile_key="chkCogs", grp="서비스")
mline("svcCost", "헬스케어 서비스 원가", "매출 가중", by_weight("svcCost"), reconcile_key="svcCost")
mline("subCost", "구독 운영 원가", "매출 가중", by_weight("subCost"), reconcile_key="subCost")
mline("payFee", "결제 대행 수수료", "매출 가중", by_weight("payFee"), reconcile_key="payFee")
mline("cogs", "매출원가 합계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['cogsP']}:{c}{MR['payFee']})", total=True, reconcile_key="cogs")
mline("gross", "매출총이익", "매출 − 원가", lambda t, y, m, c: f"={c}{MR['rev']}-{c}{MR['cogs']}", total=True, reconcile_key="gross")

msec("판매관리비")
mline("cac", "회원확보비(CAC)", "월 신규 회원 × CAC", lambda t, y, m, c: f"={c}{MR['newM']}*{ASCALAR('cac')}", reconcile_key="cac", grp="마케팅")
mline("brand", "브랜드 · 퍼포먼스 마케팅", "매출 가중", by_weight("brand"), reconcile_key="brand")
mline("launch", "초기 런칭 광고", "가정 ⑪ 배분",
      lambda t, y, m, c: f"=IF(SUM('가정'!$D${AR['launchPhaseRow']+y}:$O${AR['launchPhaseRow']+y})=0,'연간손익'!${YC[y]}${YR['launch']}/12,'연간손익'!${YC[y]}${YR['launch']}*'가정'!{MC[m]}{AR['launchPhaseRow']+y}/SUM('가정'!$D${AR['launchPhaseRow']+y}:$O${AR['launchPhaseRow']+y}))",
      reconcile_key="launch")
mline("reward", "포인트(토큰) 적립", "매출 가중", by_weight("reward"), reconcile_key="reward", grp="고객·사회")
mline("donation", "기부금(치료비 나눔)", "매출 가중", by_weight("donation"), reconcile_key="donation")
mline("pay", "인건비", "가정 ⑬ 방식(균등/연속 채용)",
      lambda t, y, m, c: f"=IF({ASCALAR('payMode')}=1,'연간손익'!${YC[y]}${YR['pay']}/12,'인력계획'!${YC[y]}${HR['payS']}+('인력계획'!${YC[y]}${HR['payE']}-'인력계획'!${YC[y]}${HR['payS']})*{m}/11)",
      reconcile_key="pay", grp="인력")
mline("rnd", "연구개발", "매출 가중", by_weight("rnd"), reconcile_key="rnd", grp="운영")
mline("cloud", "클라우드", "매출 가중", by_weight("cloud"), reconcile_key="cloud")
mline("gpu", "GPU", "매출 가중", by_weight("gpu"), reconcile_key="gpu")
mline("salesCost", "영업비", "매출 가중", by_weight("salesCost"), reconcile_key="salesCost")
mline("adminCost", "관리비", "매출 가중", by_weight("adminCost"), reconcile_key="adminCost")
mline("sga", "판매관리비 합계", "합계", lambda t, y, m, c: f"=SUM({c}{MR['cac']}:{c}{MR['adminCost']})", total=True, reconcile_key="sga")

msec("이익 · 투자")
mline("ebitModel", "영업이익(모델 표기)", "총이익 − 판관비", lambda t, y, m, c: f"={c}{MR['gross']}-{c}{MR['sga']}", reconcile_key="ebitModel")
mline("depr", "감가상각비", "연간 ÷ 12", lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['depr']}/12", reconcile_key="depr")
mline("ebit", "영업이익(보정)", "모델 표기 − 감가상각", lambda t, y, m, c: f"={c}{MR['ebitModel']}-{c}{MR['depr']}", total=True, reconcile_key="ebit")
mline("int", "이자비용", "연간 ÷ 12", lambda t, y, m, c: f"='연간손익'!${YC[y]}${YR['int']}/12", reconcile_key="int")
mline("pbt", "법인세차감전이익", "영업이익 − 이자", lambda t, y, m, c: f"={c}{MR['ebit']}-{c}{MR['int']}", total=True, reconcile_key="pbt")
mline("capex", "CAPEX 집행", "가정 ⑫ 배분",
      lambda t, y, m, c: f"=IF(SUM('가정'!$D${AR['capexPhaseRow']+y}:$O${AR['capexPhaseRow']+y})=0,'연간손익'!${YC[y]}${YR['capex']}/12,'연간손익'!${YC[y]}${YR['capex']}*'가정'!{MC[m]}{AR['capexPhaseRow']+y}/SUM('가정'!$D${AR['capexPhaseRow']+y}:$O${AR['capexPhaseRow']+y}))",
      reconcile_key="capex")
mline("cumOp", "누적 영업이익(보정)", "월 누적", lambda t, y, m, c: (f"={c}{MR['ebit']}" if t == 0 else f"={MCOL[t-1]}{mr}+{c}{MR['ebit']}"))

M.column_dimensions["A"].width = 9
M.column_dimensions["B"].width = 30
M.column_dimensions["C"].width = 24
for col in MCOL + YSUMC + YDIFC:
    M.column_dimensions[col].width = 10.5
M.freeze_panes = "D7"



# ══════════════════════════════════════ 현금·투자금(v1.1) ══════════════════════════════════════
from openpyxl.worksheet.datavalidation import DataValidation

C = wb.create_sheet("현금·투자금")
cell(C, "A1", "현금흐름 · 투자금 산정 — 월별 누적 현금 저점 기준(A 계획 · B 보수 · C 게이트 지연)", TITLE)
cell(C, "A2", "필요 총자금 = 누적 현금(조달 전) 최저점 + 안전 버퍼. 투자 요청액 = 필요 총자금 − 가용 현금 − 전략적 선급(10억 올림). 모델 밖 항목(임차·보증금·채용·일회성)은 현금에만 넣는다.", SUB)
header_row(C, 4, ["구분", "현금 레버", "A 계획", "B 보수", "C 게이트 지연", "단위", "설명"])
CR = {}
cr = 5
LV = ["C", "D", "E"]                                   # 블록별 레버 열
ROAD = [0, 0, 7 / 16, 7 / 16, 7 / 16, 1, 1, 1, 1, 1, 1, 1]
levers = [
    ("pre", "사전 구축기간(매출 발생 전)", [0, 6, 6], "개월", "0~24. 플랫폼 구축·채용·인허가 — 모델에는 없다", "0", True),
    ("prePay", "구축기간 인건비 비율(1차 1월 인건비 대비)", [0.5, 0.5, 0.5], "%", "착수 인력이 절반에서 시작", F_PCT, False),
    ("preOpex", "구축기간 월 운영비(개발도구·인프라·법무·사무)", [0, 100000000, 100000000], "원/월", "B·C는 실사·법무·등기를 여기에 포함", F_WON, False),
    ("lagP", "회수 지연 — 제품판매", [0, 0, 0], "개월", "카드 결제 — 사실상 즉시", "0", False),
    ("lagChk", "회수 지연 — 검진 연계", [0, 1, 1], "개월", "검진기관 월 정산", "0", False),
    ("lagSvc", "회수 지연 — 헬스케어 서비스", [0, 1, 1], "개월", "제휴처 월 정산", "0", False),
    ("lagResv", "회수 지연 — 예약 서비스", [0, 1, 1], "개월", "제휴처 월 정산", "0", False),
    ("lagSub", "회수 지연 — AI 플랫폼 구독", [0, 1, 1], "개월", "기관 후불 청구", "0", False),
    ("lagIns", "회수 지연 — 보험 DB 공급", [0, 2, 2], "개월", "공급분 보험사 월 정산 후 지급(정산 조건 협의)", "0", True),
    ("lagEtc", "회수 지연 — 광고·Agent·API", [0, 0, 0], "개월", "", "0", False),
    ("cogsLag", "매출원가 지급 지연", [0, 0, 0], "개월", "B·C는 공급사 신용을 의도적으로 뺀 보수 기준(1개월이면 필요자금 감소)", "0", False),
    ("wc", "운전자본 증가(매출 대비)", ["='가정'!$D$%d" % AR["wcRate"], 0, 0], "%", "A = 모델 2% · B·C = 회수 지연으로 명시 반영", F_PCT, False),
    ("rent", "1인당 월 임차료(관리비 포함)", [540000, 540000, 540000], "원/인·월", "[추정] 1인 3평 × 평당 월 18만 — 실제 임대 조건으로 교체", F_WON, False),
    ("depMonths", "임차보증금(월세 개월수)", [10, 10, 10], "개월", "[추정] 월세 10개월분", "0", False),
    ("depLook", "보증금 계약 인원 선행 기간", [6, 6, 6], "개월", "향후 N개월 최대 인원으로 계약 · 증액분만 예치", "0", False),
    ("adminHasRent", "관리비에 임차료 포함(1=포함 → 초과분만)", [1, 0, 0], "선택", "A는 모델 관리비에 일부 포함으로 본다", "0", False),
    ("hireRate", "채용 수수료(1인당 총인건비 대비)", [0.05, 0.05, 0.05], "%", "[추정] 헤드헌팅 15~20% × 외부 채용 비중 약 30%", F_PCT, False),
    ("oneOff", "일회성 거래비용(실사·법무·등기)", [150000000, 0, 0], "원", "첫 집행 달 · B·C는 구축기간 운영비에 포함", F_WON, False),
    ("prepay", "전략적 선급액(보험 DB 공급 대가)", [0, 0, 0], "원", "⚠ 선급은 보험 매출의 조기 회수이지 신규 자금이 아니다 — 회수에서 상계", F_WON, False),
    ("prepayAt", "선급 수령 기간 번호", [1, 1, 1], "기간", "1 = 1차 1월", "0", False),
    ("repay", "차입 원금 월 상환액", [0, 0, 0], "원/월", "기존 장기차입 만기·상환 조건으로 채울 것", F_WON, False),
    ("repayFrom", "상환 시작 기간 번호", [1, 1, 1], "기간", "", "0", False),
    ("repayTo", "상환 종료 기간 번호", [0, 0, 0], "기간", "0이면 상환 없음", "0", False),
    ("buf", "안전 버퍼", [6, 6, 6], "개월분", "1차연도 월평균 고정비 기준 — 요약에 저점 달 기준 환산 병기", "0", True),
]
for k, lab, vals, unit, note, fmt, keyf in levers:
    cell(C, f"B{cr}", lab)
    for bi in range(3):
        v = vals[bi]
        cell(C, f"{LV[bi]}{cr}", v, GREEN if isinstance(v, str) else BLUE, fmt, YELLOW if keyf else None)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR[k] = cr; cr += 1
dv = DataValidation(type="whole", operator="between", formula1="0", formula2="24", showErrorMessage=True,
                    errorTitle="사전 구축기간", error="0~24개월만 입력할 수 있습니다(구축 열이 24칸).")
C.add_data_validation(dv); dv.add(f"C{CR['pre']}:E{CR['pre']}")
cr += 1
section(C, cr, "공통 입력", 7); cr += 1
for k, lab, v, unit, note, fmt in [("cashAvail", "투자 시점 가용 현금(실잔액 · 리스부채 제외)", f"={ASCALAR('capital')}+{ASCALAR('surplus')}+{ASCALAR('longDebt')}", "원", "기본 = 자본금+잉여금+장기차입(28억). 클로징 기준일 실잔액으로 교체", F_WON),
                                   ("closeDate", "클로징 기준일", "입력", "", "예: 2026-12-31", None),
                                   ("imAmt", "IM에 적힌 투자 금액", 10000000000, "원", "HI-Fin_현대해상_IM v1.1 — 요청액과 다르면 경고", F_WON)]:
    cell(C, f"B{cr}", lab)
    cell(C, f"C{cr}", v, GREEN if (isinstance(v, str) and v.startswith("=")) else BLUE, fmt, YELLOW if k == "cashAvail" else None)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR[k] = cr; cr += 1
cr += 1
section(C, cr, "월 배분 · 커버리지(1~12월 가중, 매년 적용 · 보험 커버리지는 1차연도에만)", 7); cr += 1
PHC = [CL(9 + m) for m in range(12)]                  # I .. T
cell(C, f"B{cr}", "월", BOLD)
for m in range(12):
    cell(C, f"{PHC[m]}{cr}", f"{m+1}월", BOLD, align=Alignment(horizontal="center"))
cr += 1
PH = {}
for bi, tag in enumerate(["A", "B", "C"]):
    for key, lab in [("launch", "런칭 광고 배분"), ("capex", "CAPEX 배분"), ("cov", "보험 매출 커버리지(0~1)")]:
        cell(C, f"B{cr}", f"{tag} — {lab}")
        for m in range(12):
            if bi == 0 and key in ("launch", "capex"):
                src_row = AR["launchPhaseRow"] if key == "launch" else AR["capexPhaseRow"]
                cell(C, f"{PHC[m]}{cr}", f"='가정'!{MC[m]}{src_row}", GREEN, "0.00")
            else:
                if key == "launch":
                    v = [3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0][m]
                elif key == "capex":
                    v = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0][m]
                else:
                    v = [1] * 12 if bi == 0 else (ROAD if bi == 1 else [0] * 12)
                    v = v[m]
                cell(C, f"{PHC[m]}{cr}", v, BLUE, "0.00", YELLOW if key == "cov" else None)
        note = {"launch": "A = 가정 ⑪ 연결 · B·C = 선집행", "capex": "A = 가정 ⑫ 연결 · B·C = 분기 선집행",
                "cov": ["A = 전액", "B = 로드맵 부분 반영(1~2월 0 · 3~5월 7/16 · 6월~ 1) — 법률자문 4주·파일럿 8주", "C = 1차연도 미개시(법률·파일럿 게이트 지연)"][bi]}[key]
        cell(C, f"U{cr}", note, SUB)
        PH[(tag, key)] = cr; cr += 1
cr += 1

# ── 요약 ──
section(C, cr, "투자금 산정 결과", 7); cr += 1
header_row(C, cr, ["", "항목", "A 계획", "B 보수", "C 게이트 지연", "단위", "읽는 법"]); cr += 1
S_ROWS = [("low", "누적 현금 저점(조달 전)", "백만원", "음수의 크기만큼 현금이 먼저 나간다"),
          ("lowAt", "저점 시기", "기간", "이 달까지 버틸 자금이 있어야 한다"),
          ("fixed", "월 고정비(1차연도 월평균)", "백만원", "인건비+R&D+클라우드+GPU+관리비+이자"),
          ("buffer", "안전 버퍼", "백만원", "매출이 계획보다 늦을 때의 완충"),
          ("bufMonths", "버퍼 환산 — 저점 달 고정비 기준", "개월", "투자요청서에는 개월 수보다 하방 흡수력으로 표기"),
          ("need", "필요 총자금 = |저점| + 버퍼", "백만원", ""),
          ("totalRound", "총 필요 자금(10억 올림 · 참고)", "백만원", "가용 현금을 빼기 전"),
          ("cash", "(−) 투자 시점 가용 현금", "백만원", "공통 입력"),
          ("prepay", "(−) 전략적 선급", "백만원", "신규 자금이 아니라 매출 조기 회수"),
          ("req", "투자 요청액(신규 · 10억 올림)", "백만원", "투자요청서 기재액"),
          ("imGap", "IM 투자 금액 대비", "백만원", "+면 IM보다 더 필요"),
          ("runway", "요청액 조달 시 소진 시기", "기간", "계획 기간 내 소진 없음이 정상")]
for k, lab, unit, note in S_ROWS:
    cell(C, f"B{cr}", lab, BOLD if k in ("need", "req") else BLACK)
    cell(C, f"F{cr}", unit, SUB); cell(C, f"G{cr}", note, SUB)
    CR["s_" + k] = cr; cr += 1
cr += 1
section(C, cr, "점검", 7); cr += 1
CR["warnStart"] = cr
cr += 5

# ── 월별 그리드(구축 24열 + 본 기간 60열) ──
PRE = 24
GC = [CL(3 + j) for j in range(PRE + 60)]            # C .. CH
GL = GC[-1]


def grid_header(r0):
    cell(C, f"A{r0}", "", HDR, fill=NAVY); cell(C, f"B{r0}", "기간", HDR, fill=NAVY)
    cell(C, f"A{r0+1}", "", HDR, fill=NAVY); cell(C, f"B{r0+1}", "기간 번호(0 이하 = 구축기간)", HDR, fill=NAVY)
    for j, col in enumerate(GC):
        if j < PRE:
            lab = f"구축-{PRE-j}"; idx = j - PRE + 1
        else:
            t = j - PRE; lab = f"{t//12+1}차-{t%12+1:02d}"; idx = t + 1
        cell(C, f"{col}{r0}", lab, HDR, fill=NAVY, align=Alignment(horizontal="center"))
        cell(C, f"{col}{r0+1}", idx, HDR, "0", fill=NAVY, align=Alignment(horizontal="center"))


MRNG = lambda key: f"'월별예산'!$D${MR[key]}:$BK${MR[key]}"
VAR = f"({ASCALAR('brandRate')}+({ASCALAR('rndRate')}+{ASCALAR('salesRate')}+{ASCALAR('adminRate')})*{ASCALAR('opexScale')})"
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
        lambda col: f"=IF({I(col)}<1,IF({I(col)}>-{lv('pre')},{ASCALAR('payStart')}*{lv('prePay')}*12/INDEX({AVGSAL},1,1),0),{M_AT('pay', col)}*12/INDEX({AVGSAL},1,{YEAR(col)}))",
        fmt='#,##0.0', font=SUB)
    row("insRec", "보험 매출(커버리지 반영)",
        lambda col: f"=IF({I(col)}<1,0,{M_AT('revIns', col)}*IF({I(col)}<=12,INDEX({php('cov')},1,{I(col)}),1))", font=SUB)
    hr_first = GC[0]; hr_last = GC[-1]
    row("req", "보증금 필요액(향후 인원 기준)",
        lambda col: f"=MAX({col}{R['heads']}:INDEX(${hr_first}${R['heads']}:${hr_last}${R['heads']},1,MIN({PRE+60},{I(col)}+{PRE}+{lv('depLook')}-1)))*{lv('rent')}*{lv('depMonths')}",
        font=SUB)
    cell(C, f"A{r0}", "유입", BOLD)

    def lagged(key, lagk):
        return lambda col: f"=IF({I(col)}-{lv(lagk)}<1,0,{M_AT(key, col, '-' + lv(lagk))})"
    row("inP", "제품판매 회수", lagged("revP", "lagP"))
    row("inChk", "검진 연계 회수", lagged("revChk", "lagChk"))
    row("inSvc", "헬스케어 서비스 회수", lagged("revSvc", "lagSvc"))
    row("inResv", "예약 서비스 회수", lagged("revResv", "lagResv"))
    row("inSub", "AI 플랫폼 구독 회수", lagged("revSub", "lagSub"))
    row("insCol", "보험 DB 공급 회수(선급 상계 전)",
        lambda col: f"=IF({I(col)}-{lv('lagIns')}<1,0,INDEX(${hr_first}${R['insRec']}:${hr_last}${R['insRec']},1,{I(col)}+{PRE}-{lv('lagIns')}))")
    first = GC[0]
    prev = lambda col: GC[GC.index(col) - 1]
    # 선급 상계 — 잔액 보조행(다음 행)을 참조하므로 행 번호를 미리 잡는다
    r_off, r_bal = r0, r0 + 1
    recv = lambda col: f"IF({I(col)}={lv('prepayAt')},{lv('prepay')},0)"
    bal_prev = lambda col: ("0" if col == first else f"{prev(col)}{r_bal}")
    row("offset", "선급 상계(비현금)", lambda col: f"=IF({I(col)}<1,0,MIN({bal_prev(col)}+{recv(col)},{col}{R['insCol']}))")
    row("prepayBal", "선급 잔액(보조)", lambda col: f"={bal_prev(col)}+{recv(col)}-{col}{r_off}", font=SUB)
    row("inIns", "보험 DB 공급 회수(현금)", lambda col: f"={col}{R['insCol']}-{col}{R['offset']}")
    row("inEtc", "광고·Agent·API 회수", lagged("revEtc", "lagEtc"))
    row("inTot", "유입 합계", lambda col: f"={col}{R['inP']}+{col}{R['inChk']}+{col}{R['inSvc']}+{col}{R['inResv']}+{col}{R['inSub']}+{col}{R['inIns']}+{col}{R['inEtc']}", True, TOT)
    cell(C, f"A{r0}", "유출", BOLD)
    row("oCogs", "매출원가", lambda col: f"=IF({I(col)}-{lv('cogsLag')}<1,0,{M_AT('cogs', col, '-' + lv('cogsLag'))})")
    row("oCust", "포인트 적립 · 기부금", lambda col: f"={SAME('reward', col)}+{SAME('donation', col)}")
    row("oMkt", "CAC · 브랜드 마케팅", lambda col: f"={SAME('cac', col)}+{SAME('brand', col)}")
    row("oLaunch", "초기 런칭 광고",
        lambda col: f"=IF({I(col)}<1,0,INDEX('연간손익'!$D${YR['launch']}:$H${YR['launch']},1,{YEAR(col)})*IF(SUM({php('launch')})=0,1/12,INDEX({php('launch')},1,{MON(col)})/SUM({php('launch')})))")
    row("oCapex", "CAPEX",
        lambda col: f"=IF({I(col)}<1,0,INDEX('연간손익'!$D${YR['capex']}:$H${YR['capex']},1,{YEAR(col)})*IF(SUM({php('capex')})=0,1/12,INDEX({php('capex')},1,{MON(col)})/SUM({php('capex')})))")
    row("oPay", "인건비", lambda col: f"={SAME('pay', col)}")
    row("oOpex", "R&D · 클라우드 · GPU · 영업 · 관리", lambda col: "=" + "+".join(SAME(k, col) for k in ["rnd", "cloud", "gpu", "salesCost", "adminCost"]))
    row("oInt", "이자", lambda col: f"={SAME('int', col)}")
    row("oWc", "운전자본 증가", lambda col: f"={SAME('rev', col)}*{lv('wc')}")
    row("oTax", "법인세 납부(전년분 · 3월)",
        lambda col: f"=IF({I(col)}<1,0,IF(AND({MON(col)}=3,{YEAR(col)}>=2),INDEX('연간손익'!$D${YR['tax']}:$H${YR['tax']},1,{YEAR(col)}-1),0))")
    row("oCovSave", "(−) 보험 미개시분 매출연동 비용 절감",
        lambda col: f"=-IF({I(col)}<1,0,{M_AT('revIns', col)}*(1-IF({I(col)}<=12,INDEX({php('cov')},1,{I(col)}),1))*{VAR})")
    row("oRent", "임차료(인원 연동 · 모델 밖)",
        lambda col: f"=IF({I(col)}<1,{col}{R['heads']}*{lv('rent')},IF({lv('adminHasRent')}=1,MAX(0,{col}{R['heads']}*{lv('rent')}-{M_AT('adminCost', col)}),{col}{R['heads']}*{lv('rent')}))")
    row("oDep", "임차보증금 예치(증액분)",
        lambda col: (f"=MAX(0,{col}{R['req']})" if col == first else f"=MAX(0,{col}{R['req']}-MAX(${first}${R['req']}:{prev(col)}{R['req']}))"))
    row("oHire", "채용 수수료",
        lambda col: f"=MAX(0,{col}{R['heads']}-" + ("0" if col == first else f"{prev(col)}{R['heads']}") + f")*IF({I(col)}<1,INDEX({AVGSAL},1,1),INDEX({AVGSAL},1,{YEAR(col)}))*{lv('hireRate')}")
    row("oOne", "일회성 거래비용", lambda col: f"=IF({I(col)}=IF({lv('pre')}>0,1-{lv('pre')},1),{lv('oneOff')},0)")
    row("oPrePay", "구축기간 인건비", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),{ASCALAR('payStart')}*{lv('prePay')},0)")
    row("oPreOpex", "구축기간 운영비", lambda col: f"=IF(AND({I(col)}<1,{I(col)}>-{lv('pre')}),{lv('preOpex')},0)")
    row("oRepay", "차입 원금 상환", lambda col: f"=IF(AND({I(col)}>={lv('repayFrom')},{I(col)}<={lv('repayTo')}),{lv('repay')},0)")
    row("outTot", "유출 합계", lambda col: f"=SUM({col}{R['oCogs']}:{col}{R['oRepay']})", True, TOT)
    row("net", "순현금흐름", lambda col: f"={col}{R['inTot']}-{col}{R['outTot']}", True)
    r_cum = r0
    row("cum", "누적 현금(조달 전)", lambda col: (f"={col}{R['net']}" if col == first else f"={prev(col)}{r_cum}+{col}{R['net']}"), True, KEY)
    row("fixedM", "월 고정비(버퍼 환산용)", lambda col: "=" + "+".join(SAME(k, col) for k in ["pay", "rnd", "cloud", "gpu", "adminCost", "int"]), font=SUB)
    row("funded", "조달 후 누적 현금(가용+요청액+선급)",
        lambda col: f"=$C${CR['cashAvail']}+{LC}${CR['s_req']}+IF(AND({lv('prepay')}>0,{I(col)}>={lv('prepayAt')}),{lv('prepay')},0)+{col}{R['cum']}", font=SUB)
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
    cell(C, f"{LC}{CR['s_fixed']}", "=('연간손익'!$D$%d+'연간손익'!$D$%d+'연간손익'!$D$%d+'연간손익'!$D$%d+'연간손익'!$D$%d+'연간손익'!$D$%d)/12"
         % (YR["pay"], YR["rnd"], YR["cloud"], YR["gpu"], YR["adminCost"], YR["int"]), BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_buffer']}", f"=${LC}${CR['buf']}*{LC}{CR['s_fixed']}", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_bufMonths']}", f"=IFERROR({LC}{CR['s_buffer']}/INDEX($C${R['fixedM']}:${GL}${R['fixedM']},1,{pos}),0)", BLACK, "0.0")
    cell(C, f"{LC}{CR['s_need']}", f"=-{LC}{CR['s_low']}+{LC}{CR['s_buffer']}", BLACK, F_MIL, KEY, bold=True)
    cell(C, f"{LC}{CR['s_totalRound']}", f"=ROUNDUP({LC}{CR['s_need']}/1000000000,0)*1000000000", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_cash']}", f"=$C${CR['cashAvail']}", GREEN, F_MIL)
    cell(C, f"{LC}{CR['s_prepay']}", f"=${LC}${CR['prepay']}", GREEN, F_MIL)
    cell(C, f"{LC}{CR['s_req']}", f"=ROUNDUP(MAX(0,{LC}{CR['s_need']}-{LC}{CR['s_cash']}-{LC}{CR['s_prepay']})/1000000000,0)*1000000000", BLACK, F_MIL, YELLOW, bold=True)
    cell(C, f"{LC}{CR['s_imGap']}", f"={LC}{CR['s_req']}-$C${CR['imAmt']}", BLACK, F_MIL)
    cell(C, f"{LC}{CR['s_runway']}", f'=IFERROR(INDEX({lab},1,MATCH(1,$C${R["flag"]}:${GL}${R["flag"]},0)),"소진 없음")', BLACK, align=Alignment(horizontal="right"))

w = CR["warnStart"]
warns = [
    f'=IF(MAX(C{CR["pre"]}:E{CR["pre"]})>24,"⚠ 사전 구축기간이 24개월을 넘어 절삭됩니다","✓ 사전 구축기간 정상(0~24)")',
    f'=IF(COUNTIF(\'인력계획\'!D{HR["payWarn"]}:H{HR["payWarn"]},"정상")+COUNTIF(\'인력계획\'!D{HR["payWarn"]}:H{HR["payWarn"]},"균등 모드 — 해당 없음")=5,"✓ 인건비 월 경로 정상","⚠ 인건비 월 경로 이상 — 인력계획 점검 행 확인")',
    f'=IF(ABS(D{CR["s_req"]}-$C${CR["imAmt"]})>=1000000000,"⚠ IM 투자 금액("&TEXT($C${CR["imAmt"]}/100000000,"0")&"억)과 B 요청액("&TEXT(D{CR["s_req"]}/100000000,"0")&"억)이 다릅니다 — 문서 금액 통일 필요","✓ IM 금액과 B 요청액 일치")',
    f'=IF(SUM(C{CR["prepay"]}:E{CR["prepay"]})>0,"⚠ 전략적 선급 사용 중 — 투자금 헤드라인에 선급을 더하지 말 것","✓ 선급 없음")',
    f'=IF(\'연간손익\'!D{YR["ebitExIns"]}<0,"ⓘ 보험 제외 시 1차연도 보정 영업이익 "&TEXT(\'연간손익\'!D{YR["ebitExIns"]}/100000000,"0.0")&"억 — 1차 손익이 보험 한 줄에 달려 있음","")',
]
for i_, f_ in enumerate(warns):
    cell(C, f"B{w+i_}", f_, BLACK)

C.column_dimensions["A"].width = 6
C.column_dimensions["B"].width = 42
for col in GC:
    C.column_dimensions[col].width = 10
for col, wd in (("C", 15), ("D", 15), ("E", 15), ("F", 11), ("G", 14)):
    C.column_dimensions[col].width = wd
C.freeze_panes = "C5"


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
for k, lab, fmt in [("req", "투자 요청액(신규)", F_MIL), ("need", "필요 총자금", F_MIL), ("low", "누적 현금 저점", F_MIL), ("lowAt", "저점 시기", None),
                    ("buffer", "안전 버퍼", F_MIL), ("cash", "가용 현금", F_MIL), ("prepay", "전략적 선급", F_MIL), ("runway", "요청액 조달 시 소진 시기", None)]:
    cell(T, f"B{tr}", lab, BOLD if k == "req" else BLACK)
    cell(T, f"C{tr}", "=" + SEL(k), GREEN, fmt, YELLOW if k == "req" else None, bold=(k == "req"), align=Alignment(horizontal="right"))
    cell(T, f"D{tr}", "기간" if k in ("lowAt", "runway") else "백만원", SUB)
    TR[k] = tr; tr += 1
tr += 1

section(T, tr, "② 자금 사용처 — 저점까지 순소진을 계정별 유출 비중으로 배분 + 버퍼 − 가용 현금 − 선급", 5); tr += 1
header_row(T, tr, ["", "사용처", "저점까지 총유출(참고)", "비중", "요청액 배분"], 1)
tr += 1
CATS = [("매출원가", ["oCogs"]), ("포인트 적립 · 기부금", ["oCust"]), ("마케팅(CAC·브랜드·런칭)", ["oMkt", "oLaunch", "oCovSave"]),
        ("CAPEX(플랫폼·AI·인프라·보안·사무)", ["oCapex"]), ("인건비(구축기간 포함)", ["oPay", "oPrePay"]),
        ("R&D · 인프라 · 영업 · 관리", ["oOpex", "oPreOpex"]), ("임차 · 보증금 · 채용 · 일회성", ["oRent", "oDep", "oHire", "oOne"]),
        ("이자 · 세금 · 운전자본 · 차입 상환", ["oInt", "oTax", "oWc", "oRepay"])]


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
cell(T, f"B{tr}", "(−) 가용 현금"); cell(T, f"E{tr}", f"=-C{TR['cash']}", GREEN, F_MIL); tr += 1
cell(T, f"B{tr}", "(−) 전략적 선급"); cell(T, f"E{tr}", f"=-C{TR['prepay']}", GREEN, F_MIL); tr += 1
cell(T, f"B{tr}", "(+) 10억 단위 올림 조정"); cell(T, f"E{tr}", f"=C{TR['req']}-SUM(E{tr-4}:E{tr-1})", BLACK, F_MIL); tr += 1
cell(T, f"B{tr}", "투자 요청액(사용처 합계)", BOLD); cell(T, f"E{tr}", f"=SUM(E{tr-5}:E{tr-1})", BLACK, F_MIL, YELLOW, bold=True)
TR["useTotal"] = tr; tr += 2

section(T, tr, "③ 트랜치 — T1 클로징 · T2 마일스톤 달성 시", 5); tr += 1
cell(T, f"B{tr}", "T1 비율"); cell(T, f"C{tr}", 0.6, BLUE, F_PCT, YELLOW); TR["t1r"] = tr; tr += 1
cell(T, f"B{tr}", "T1 금액(10억 올림)", BOLD); cell(T, f"C{tr}", f"=MIN(C{TR['req']},ROUNDUP(C{TR['req']}*C{TR['t1r']}/1000000000,0)*1000000000)", BLACK, F_MIL, bold=True); TR["t1"] = tr; tr += 1
cell(T, f"B{tr}", "T2 금액", BOLD); cell(T, f"C{tr}", f"=C{TR['req']}-C{TR['t1']}", BLACK, F_MIL, bold=True); tr += 1
cell(T, f"B{tr}", "T1만 받았을 때 현금 소진 시기")


def t1_runway(R):
    lab = f"'현금·투자금'!$C${R['lab']}:${GL}${R['lab']}"
    cum = f"'현금·투자금'!$C${R['cum']}:${GL}${R['cum']}"
    return (f'IFERROR(INDEX({lab},1,MATCH(TRUE,INDEX(\'현금·투자금\'!$C${CR["cashAvail"]}+$C${TR["t1"]}+{cum}<0,0),0)),"소진 없음")')


cell(T, f"C{tr}", "=CHOOSE($C$%d,%s,%s,%s)" % (TR["sel"], t1_runway(RA), t1_runway(RB), t1_runway(RC)), BLACK, align=Alignment(horizontal="right"))
cell(T, f"D{tr}", "T2는 이 달 이전에 들어와야 한다", SUB)
TR["t1run"] = tr; tr += 1
cell(T, f"B{tr}", "T2 마일스톤(입력)", BOLD); tr += 1
for ms in ["보험 DB 공급 파일럿 Go 판정 — 응답 80% · 상담 40% · 청약 8%(리드라우팅 설계보고서 §5.4)",
           "법률의견서 — 보험업법(모집 자격) · 신용정보법 · 개인정보보호법 §17·§23",
           "현대해상 제3자 제공 동의 수집 실적 — 목표 인원 입력",
           "AI 플랫폼 유료 전환 기관 — 목표 기관 수 입력"]:
    cell(T, f"B{tr}", ms, BLUE); tr += 1
tr += 1
section(T, tr, "④ 문서 금액 정합", 5); tr += 1
cell(T, f"B{tr}", "IM에 적힌 투자 금액"); cell(T, f"C{tr}", f"='현금·투자금'!$C${CR['imAmt']}", GREEN, F_MIL); tr += 1
cell(T, f"B{tr}", "요청액 − IM 금액"); cell(T, f"C{tr}", f"=C{TR['req']}-C{tr-1}", BLACK, F_MIL); tr += 1
cell(T, f"B{tr}", "⚠ IM의 「1차연도 공급 대가(84억)로 투자 회수」 서사는 같은 84억을 투자 회수와 운영 현금에 두 번 쓴다 — IM 수정 필요", SUB)
T.column_dimensions["A"].width = 3
T.column_dimensions["B"].width = 54
T.column_dimensions["C"].width = 18
T.column_dimensions["D"].width = 12
T.column_dimensions["E"].width = 16


# ══════════════════════════════════════ 화면대조 ══════════════════════════════════════
S = wb.create_sheet("화면대조")
cell(S, "A1", "재무회계 온톨로지 화면 대조 — 화면은 1차연도 구조를 틱으로 흘리는 실시간 시뮬", TITLE)
cell(S, "A2", "화면 값은 누적 중인 순간값이라 절대액이 아니라 구성비를 봐야 한다. 화면 값 출처: 2026-09-13 캡처.", SUB)
header_row(S, 4, ["구분", "화면 항목", "화면 값(원)", "화면 구성비", "대응 계정(연간손익)", "1차연도 모델(백만원)", "모델 구성비", "차이(%p)", "산식 · 비고"])
sr = 5
scr_rev = [("제품판매 매출 · 건강쇼핑(GMV)", 4737000, ["revP"], "구매회원×1인 지출×점유율 70%×가동률 33% — 1차 매출 1위"),
           ("검진 연계 수수료 · 건강검진센터", 3850000, ["revChk"], "검진 예약×건당 2.5만(원가 2만 — 회원 확보 장치)"),
           ("헬스케어 서비스 수수료", 690000, ["revSvc"], "이용자×1.5만"),
           ("예약 서비스 수수료 · 골프·시설", 520000, ["revResv"], "예약 건수×1만"),
           ("EMR-UIP 사용료", 0, ["revSub"], "1차연도 무료(시장 선점)"),
           ("보험 중개 수수료 · 퍼미션 동의", 5180000, ["revIns"], "누적 동의×공급 집행률 60%×건당 7만 — 1차 매출 2위(32%)"),
           ("광고 · 제휴 매출", 0, ["revAd", "revAg", "revApi"], "2차연도부터(광고·Agent·API 합)")]
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
            ("검진·인프라 원가 · 매출원가", 3114500, ["chkCogs", "svcCost", "subCost"], "검진 3종 원가 + 서비스·구독 원가"),
            ("마케팅비 · 판관비", 2385194, ["cac", "brand", "launch"], "CAC + 브랜드 8% + 런칭 광고"),
            ("제품 원가 · 매출원가", 2084280, ["cogsP"], "카테고리 매출×원가율"),
            ("포인트(토큰적립) 비용", 1326360, ["reward"], "제품마진×50%"),
            ("기부금(치료비 나눔)", 795816, ["donation"], "제품마진×30%"),
            ("연구개발비", 403147, ["rnd", "cloud", "gpu"], "R&D + 클라우드 + GPU(화면은 합산)"),
            ("영업·관리비", 272185, ["salesCost", "adminCost"], "매출×요율×스케일 30%"),
            ("결제 대행 수수료", 104214, ["payFee"], "제품매출×2.2%"),
            ("감가상각비", 29840, ["depr"], "⚠ 시뮬은 전 연차 매출 0.2% 고정(3차연도에만 맞음) — 1차 모델 1.9%. 모델 영업이익과 함께 보정 필요")]
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
for t_ in ["이자·차입 — 화면 시뮬은 장기차입 2억(Finance.jsx FIN_LONGDEBT) · 이자 매출×0.18%, 모델은 장기차입 20억 · 이자 연 8억 고정 상수",
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
G = wb.create_sheet("안내", 0)
cell(G, "A1", "하이젠케어 전략적 투자요청서 — 투자금 산정 · 세부 예산 양식", Font(name=FONT, size=17, bold=True, color="1A2B4A"))
cell(G, "A2", "v1.1 · 2026-09-13 · 적대적 검토 19건 반영 · 기준 모델: finModel.js(재무회계 온톨로지 단일 소스) 기본 시나리오", SUB)
gr = 4
section(G, gr, "결론 — 투자금 산정 결과(가정을 바꾸면 자동 재계산)", 7); gr += 1
header_row(G, gr, ["", "항목", "A 계획", "B 보수", "C 게이트 지연", "단위", "비고"]); gr += 1
for k, lab, note in [("req", "투자 요청액(신규 · 10억 올림)", "필요 총자금 − 가용 현금 − 선급"),
                     ("need", "필요 총자금", "|저점| + 안전 버퍼"),
                     ("totalRound", "총 필요 자금(10억 올림)", "가용 현금 차감 전 · 참고"),
                     ("low", "누적 현금 저점", "조달 전"), ("lowAt", "저점 시기", ""),
                     ("bufMonths", "버퍼 — 저점 달 고정비 기준", "1차연도 평균 6개월분을 환산"),
                     ("cash", "가용 현금(리스 제외)", "현금·투자금 공통 입력"),
                     ("runway", "요청액 조달 시 소진 시기", "")]:
    cell(G, f"B{gr}", lab, BOLD if k == "req" else BLACK)
    for bi, LCc in enumerate(["C", "D", "E"]):
        fmt = None if k in ("lowAt", "runway") else ("0.0" if k == "bufMonths" else F_MIL)
        cell(G, f"{LCc}{gr}", f"='현금·투자금'!{LCc}{CR['s_'+k]}", GREEN, fmt, YELLOW if k == "req" else None, bold=(k == "req"),
             align=Alignment(horizontal="right"))
    cell(G, f"F{gr}", "기간" if k in ("lowAt", "runway") else ("개월" if k == "bufMonths" else "백만원"), SUB)
    cell(G, f"G{gr}", note, SUB)
    gr += 1
gr += 1
section(G, gr, "점검(자동)", 7); gr += 1
for i_ in range(5):
    cell(G, f"B{gr}", f"='현금·투자금'!B{CR['warnStart']+i_}", BLACK); gr += 1
gr += 1
section(G, gr, "세 기준", 7); gr += 1
for t_ in ["A 계획 — 모델의 연간 숫자를 월로 편 것. 매출 연동 비용은 매출 가중, 인건비는 연속 채용 경로. 사전구축 0 · 회수 지연 0 · 운전자본 매출 2% · 인원 연동 간접비 포함.",
           "B 보수 — 사전구축 6개월 · 보험 2개월/기관 수수료 1개월 회수 지연 · 보험 매출 로드맵 부분 반영(법률자문 4주·파일럿 8주) · 런칭광고·CAPEX 선집행. 공급사 신용은 의도적으로 제외.",
           "C 게이트 지연 — B에 더해 보험 DB 공급이 1차연도에 개시되지 못하는 경우(법률의견·파일럿 Go 판정 지연).",
           "투자요청서에는 B 요청액을 권고액, A를 최소 필요액으로 적고, C를 하방 시나리오로 병기한다. 가용 현금(28억)이 실제로 없다면 「총 필요 자금」을 적는다."]:
    cell(G, f"B{gr}", t_); gr += 1
gr += 1
section(G, gr, "시트 구성과 쓰는 순서", 7); gr += 1
for sh, role in [("가정", "① 회원·기관·단가·요율·CAPEX·월 배분(파란 글씨)"),
                 ("인력계획", "② 직군별 인원 × 1인당 총인건비 → 인건비 · 월 경로 점검"),
                 ("연간손익", "③ 1~5차 세부 계정 · 순매출·실효 CAC·보험 제외 이익 메모 · IM 공급표 대조 · finModel 대조(차이 0)"),
                 ("월별예산", "④ 60개월 세부 계정 — 오른쪽 끝 연간 합계 대조(차이 0)"),
                 ("현금·투자금", "⑤ A·B·C 레버(구축·회수·간접비·선급·상환·버퍼) → 저점 → 필요 총자금 → 요청액"),
                 ("투자조건", "⑥ 요청액 · 자금 사용처(순소진 배분) · 트랜치 · T1 소진 시기 · IM 금액 대조"),
                 ("화면대조", "⑦ 재무회계 온톨로지 화면과 1차연도 모델 구성비 대조")]:
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
    "1. finModel.js 영업이익(ebit)은 감가상각을 빼지 않은 값(실질 EBITDA)이다. 모델 「EBITDA」는 감가상각을 한 번 더 더해 연 5~10억 크고, 순이익·영업CF·FCF(연 3.9~7.8억)도 크다. 이 양식은 「모델 표기」와 「보정」을 나란히 둔다.",
    "2. 연 이자 8억 ÷ 장기차입 20억 = 암묵 이자율 40%(리스 포함 37.7%). 차입금과 연동되지 않은 고정 상수다. 금리 5%라면 필요 자금이 약 8~9억 준다. 모델값 확인 필요.",
    "3. 모델 KPI 런웨이는 1차연도 EBIT(+5.1억)로 번을 계산해 내부값이 Infinity가 되고, 화면에는 「흑자」로 뜬다. 같은 해 순이익은 −2.9억, 모델 FCF는 −16.2억이다.",
    "4. 모델의 1차연도 조달 29.2억에는 비현금인 리스부채 1.2억이 섞여 있다. 현금 조달은 28억이며, 월별 저점을 감당하지 못한다.",
    "5. 모델 FCF 산식 ebit×(1−세율)은 손실 연도에 세금 환급처럼 작동한다. 기본값은 5개년 EBIT가 모두 +라 발동하지 않지만, 보험 공급 집행률 30%면 1차 FCF에 7.1억의 가짜 환급이 들어간다. 이 양식은 손실 시 세금 0.",
    "6. 보험 DB 공급(20만×60%×7만 = 84억)은 1차연도 매출 2위(32%)이고 원가가 없어 이익에 그대로 반영된다. 같은 ±20% 충격으로는 인건비가 더 민감하지만, 공급 집행률은 하락 폭이 가장 불확실하다 — 두 근거를 함께 첨부할 것.",
    "7. 화면 시뮬의 감가상각은 전 연차 매출 0.2%로 고정돼 3차연도에만 맞는다(1차 모델 1.9%). 모델 영업이익과 함께 보정해야 한다.",
    "8. 사이트 사업계획(월·분기) 탭(finMonthlyY1)은 매출 연동 판관비와 인건비를 매월 1/12로 빼서 상반기 누적 영업손익이 −50.8억으로 나온다. 이 양식은 매출 가중·연속 채용으로 배분했다 — 제출 전 사이트도 같은 기준으로 맞출 것.",
    "9. 보험 매출 모수가 문서마다 다르다. 모델은 누적 동의에 매년 60%(5차 2,646억), IM p7은 연 신규 동의×60%(5차 1,050억). 검증보고서 v1.1의 「동일 산식」은 틀렸다. 1차연도·필요 자금은 같지만 2~5차가 크게 다르다 — 대표 결정 필요.",
    "10. 제품판매는 총액 인식(finModel.js)인데 공급 데이터는 무재고·직배송(순액) 구조다. 적립·기부 때문에 한계 공헌이 약 −2.4%라, 제품 매출은 이익이 아니라 적립금 생태계 비용이다.",
    "11. 운전자본 가정이 모델 안에서 세 갈래다(FCF 매출 2% 유출 · 영업CF 1% 유입 · BS 회전율). 투자요청서에 BS와 월별 현금표를 함께 싣기 전에 통일할 것."]:
    cell(G, f"B{gr}", t_); gr += 1
G.column_dimensions["A"].width = 3
G.column_dimensions["B"].width = 34
for col, wd in (("C", 17), ("D", 17), ("E", 17), ("F", 9), ("G", 26)):
    G.column_dimensions[col].width = wd

for ws in wb.worksheets:
    ws.sheet_view.showGridLines = False
wb.save(OUT)
print("saved", OUT)
json.dump({"CR": CR, "YR": YR, "MR": MR, "HR": HR, "AR": AR, "RA": RA, "RB": RB, "RC": RC, "TR": TR, "PH": {f"{k[0]}|{k[1]}": v for k, v in PH.items()}},
          open(OUT + ".map.json", "w", encoding="utf-8"), ensure_ascii=False)
print("rows 현금", cr, "투자조건", tr)
