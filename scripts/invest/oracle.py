# -*- coding: utf-8 -*-
"""투자금 산정 독립 계산기 — 엑셀 수식의 정답지.
finModel.js finYears() 산식을 그대로 옮기고(연간), 월별 배분·현금흐름·투자금은 드라이버 기준으로 계산한다.
엑셀과 같은 규칙을 쓰되 코드는 따로 짜서, 둘이 같은 값을 내는지로 서로를 검증한다."""
import json, math

import os
FIN_PATH = os.environ.get("HIFIN_FIN_JSON") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "_fin.json")
FIN = json.load(open(FIN_PATH, encoding="utf-8"))
P0 = FIN["P"]


def jround(x):
    """JS Math.round — .5는 +무한대 방향(엑셀 ROUND는 0에서 먼 쪽이라 음수에서만 다르다; 여기 값은 전부 양수)"""
    return math.floor(x + 0.5)


def annual(P, n=5):
    rows = []
    for y in range(n):
        me = P["membersEnd"][y]; mp = 0 if y == 0 else P["membersEnd"][y - 1]
        new = max(0, me - mp)
        active = P["activeAbs"][y]; mkt = P["mktConsentEnd"][y]
        insts = P["checkupCenters"][y] + P["hospitals"][y] + P["pharmacies"][y]
        subFee = 0 if y == 0 else min(P["subFeeCap"], P["subFeeBase"] + P["subFeeStep"] * (y - 1))
        paid = jround(insts * P["subPaidRate"]); revSub = paid * subFee * 12
        buyers = jround(me * P["productBuyerRate"]); ramp = P["productRamp"][y]
        cat = {}; revP = 0; cogsP = 0
        for c in P["productCats"]:
            rv = jround(buyers * c["arpu"] * P["productCapture"] * ramp); cst = jround(rv * c["cost"])
            cat[c["key"]] = (rv, cst); revP += rv; cogsP += cst
        revChk = active * P["checkupFee"]
        svcU = jround(me * P["serviceRate"]); revSvc = svcU * P["serviceCommission"]
        resv = jround(active * P["resvPerActive"][y]); revResv = resv * P["resvFee"]
        insC = jround(mkt * P["insConvRate"]); revIns = insC * P["insFeePerCase"]
        revAd = active * P["adPerActive"][y]
        agU = jround(me * P["aiAgentRate"][y]); revAg = agU * P["aiAgentFeeYear"]
        revApi = P["apiClients"][y] * P["apiFeeYear"]
        rev = revP + revChk + revSvc + revResv + revSub + revIns + revAd + revAg + revApi
        chkCogs = active * P["checkupCost3"]; svcCost = jround(revSvc * P["serviceCostRate"])
        subCost = jround(revSub * P["subCostRate"]); payFee = jround(revP * P["paymentRate"])
        cogs = cogsP + chkCogs + svcCost + subCost + payFee
        gross = rev - cogs
        cac = new * P["cac"]; launch = P["launchMkt"][y]
        brand = jround(rev * P["brandMktRate"]) + launch; mktg = cac + brand
        pm = revP - cogsP; reward = jround(pm * P["rewardRate"]); don = jround(pm * P["donationRate"])
        pay = P["payroll"][y]; os_ = P["opexScale"]
        rnd = jround(rev * P["rndRate"] * os_); cloud = jround(active * P["cloudPerActive"] * os_)
        gpu = jround(active * P["gpuPerActive"] * os_); sales = jround(rev * P["salesRate"] * os_)
        admin = jround(rev * P["adminRate"] * os_)
        sga = mktg + reward + don + pay + rnd + cloud + gpu + sales + admin
        ebit_model = gross - sga
        depr = jround(P["deprYear"] * (P["deprY1Rate"] if y == 0 else 1))
        rows.append(dict(y=y, me=me, mp=mp, new=new, active=active, mkt=mkt, insts=insts, subFee=subFee, paid=paid,
                         buyers=buyers, cat=cat, revP=revP, cogsP=cogsP, revChk=revChk, revSvc=revSvc, revResv=revResv,
                         revSub=revSub, revIns=revIns, revAd=revAd, revAg=revAg, revApi=revApi, rev=rev,
                         chkCogs=chkCogs, svcCost=svcCost, subCost=subCost, payFee=payFee, cogs=cogs, gross=gross,
                         cac=cac, launch=launch, brand=brand, mktg=mktg, reward=reward, don=don, pay=pay,
                         rnd=rnd, cloud=cloud, gpu=gpu, sales=sales, admin=admin, sga=sga,
                         ebit_model=ebit_model, depr=depr, ebit=ebit_model - depr,
                         capex=2000000000 if y < 2 else 5000000000))
    return rows


def monthly_cash(P, L):
    """L = 현금 레버. 반환: 월별 누적현금(조달 전), 저점, 필요자금"""
    A = annual(P)
    pre = L["preMonths"]
    cash = 0.0; low = 0.0; low_at = None; series = []
    # 사전 구축기간 — 매출 0, 1차연도 월 인건비 × 인력비율, 구축 운영비
    # 인건비 월 경로: mode 1 = 연간/12 균등(모델과 동일) · mode 2 = 연속 채용(전년 말에서 이어지는 직선, 연 합계 보존)
    paypath = []
    if L.get("payMode", 1) == 1:
        for y in range(5): paypath += [A[y]["pay"] / 12.0] * 12
    else:
        st = L["payStart"]
        for y in range(5):
            en = A[y]["pay"] / 6.0 - st
            paypath += [st + (en - st) * m / 11.0 for m in range(12)]
            st = en
    for k in range(pre):
        out = L["payStart"] * L["prePayRate"] + L["preOpexMonthly"]
        cash -= out; series.append(("구축-%d" % (pre - k), -out, cash))
        if cash < low: low, low_at = cash, "구축-%d" % (pre - k)
    # 본 기간 60개월
    rec = {k: [0.0] * 60 for k in L["lag"]}   # 매출 발생 → 회수 대기
    tax_due = {}
    for y in range(5):
        a = A[y]
        ramp = L["ramp"][y]; rs = sum(ramp)
        adds = [a["new"] * r / rs for r in ramp]
        ends = []; c = a["mp"]
        for x in adds:
            c += x; ends.append(c)
        W = sum(ends)
        launch_ph = L["launchPhase"][y]; lps = sum(launch_ph) or 1
        capex_ph = L["capexPhase"][y]; cps = sum(capex_ph) or 1
        pbt_year = 0.0
        for m in range(12):
            t = y * 12 + m
            w = ends[m] / W
            streams = dict(product=a["revP"] * w, checkup=a["revChk"] * w, service=a["revSvc"] * w,
                           resv=a["revResv"] * w, sub=a["revSub"] * w, ins=a["revIns"] * w,
                           etc=(a["revAd"] + a["revAg"] + a["revApi"]) * w)
            rev_m = sum(streams.values())
            var_cost = (a["cogs"] + a["reward"] + a["don"] + (a["brand"] - a["launch"]) + a["rnd"] + a["cloud"]
                        + a["gpu"] + a["sales"] + a["admin"]) * w
            cac_m = adds[m] * P["cac"]
            launch_m = a["launch"] * launch_ph[m] / lps
            pay_m = paypath[t]
            depr_m = a["depr"] / 12.0
            int_m = P["interestYear"] / 12.0
            pbt_m = rev_m - var_cost - cac_m - launch_m - pay_m - depr_m - int_m
            pbt_year += pbt_m
            # 현금 유입 — 회수 지연
            inflow = 0.0
            for s, v in streams.items():
                lag = L["lag"].get(s, 0)
                if lag == 0:
                    inflow += v
                elif t + lag < 60:
                    rec[s][t + lag] += v
                inflow += rec[s][t] if lag else 0
            wc = rev_m * L["wcRate"]
            capex_m = a["capex"] * capex_ph[m] / cps
            tax_m = tax_due.get(t, 0.0)
            outflow = var_cost + cac_m + launch_m + pay_m + int_m + wc + capex_m + tax_m
            cash += inflow - outflow
            series.append(("%d차-%02d월" % (y + 1, m + 1), inflow - outflow, cash))
            if cash < low: low, low_at = cash, "%d차-%02d월" % (y + 1, m + 1)
        # 법인세 — 연간 세전이익이 +일 때만, 다음 해 3월 납부(손실엔 환급 없음)
        tax_due[(y + 1) * 12 + 2] = max(0.0, pbt_year) * P["taxRate"]
    fixed_m = A[0]["pay"] / 12.0 + (A[0]["rnd"] + A[0]["cloud"] + A[0]["gpu"] + A[0]["admin"]) / 12.0 + P["interestYear"] / 12.0
    buffer = L["bufferMonths"] * fixed_m
    need = max(0.0, -low) + buffer
    return dict(low=low, low_at=low_at, buffer=buffer, need=need, series=series, fixed_m=fixed_m)


RAMP = [P0["m1Ramp"]] + [[1] * 12 for _ in range(4)]
FLAT = [[1] * 12 for _ in range(5)]
LEVER_A = dict(payMode=2, payStart=300000000, preMonths=0, prePayRate=0.5, preOpexMonthly=0, lag={}, wcRate=0.02, ramp=RAMP,
               launchPhase=FLAT, capexPhase=FLAT, bufferMonths=6)
LEVER_B = dict(payMode=2, payStart=300000000, preMonths=6, prePayRate=0.5, preOpexMonthly=100000000,
               lag=dict(ins=2, checkup=1, service=1, resv=1, sub=1), wcRate=0.0, ramp=RAMP,
               launchPhase=[[3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0]] + [[0] * 12 for _ in range(4)],
               capexPhase=[[1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]] * 5, bufferMonths=6)

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    A = annual(P0)
    ok = True
    for y, (a, m) in enumerate(zip(A, FIN["years"])):
        for k_o, k_m in [("rev", "revenue"), ("cogs", "cogs"), ("gross", "gross"), ("sga", "sga"), ("ebit_model", "ebit"), ("revP", "revProduct"), ("revIns", "revInsurance")]:
            if a[k_o] != m[k_m]:
                ok = False; print("불일치", y + 1, k_o, a[k_o], m[k_m])
    print("연간 산식 = finModel 일치:", ok)
    for nm, L in [("A 계획(균등인건비)", dict(LEVER_A, payMode=1)), ("A 계획(연속채용)", LEVER_A),
                  ("B 보수(균등인건비)", dict(LEVER_B, payMode=1)), ("B 보수(연속채용)", LEVER_B)]:
        r = monthly_cash(P0, L)
        print("%s  저점 %s %.1f억 · 버퍼 %.1f억 · 필요자금 %.1f억" % (nm, r["low_at"], r["low"] / 1e8, r["buffer"] / 1e8, r["need"] / 1e8))
