# -*- coding: utf-8 -*-
"""정답지 v3 — 적대적 검토·판정 반영(엑셀 v1.1 규칙과 1:1). 엑셀과 별도 코드로 짜서 서로 검증한다.
연간 손익은 finModel.js와 같다(oracle.annual). 모델 밖 항목은 현금에만 넣는다."""
import math
import oracle as O

P0 = O.P0
HEADS = {"dev": [22, 70, 160, 340, 560], "ai": [12, 40, 95, 200, 330], "ops": [14, 60, 150, 335, 575],
         "sales": [8, 30, 75, 160, 270], "mkt": [6, 20, 45, 95, 160], "mgmt": [8, 25, 50, 90, 120]}
PRE_MAX = 24


def heads_total(y):
    return sum(v[y] for v in HEADS.values())


def run(P, L):
    A = O.annual(P)
    for a_ in A:
        a_["pbt"] = a_["ebit"] - P["interestYear"]
        a_["tax"] = max(0, a_["pbt"]) * P["taxRate"]
    pre = max(0, min(PRE_MAX, int(L["pre"])))
    # ── 월 인식(매출·비용) ──
    n = 60
    rv = {k: [0.0] * n for k in ("P", "Chk", "Svc", "Resv", "Sub", "Ins", "Etc")}
    cogsM = [0.0] * n; custM = [0.0] * n; cacM = [0.0] * n; brandM = [0.0] * n; launchM = [0.0] * n
    rndM = [0.0] * n; cloudM = [0.0] * n; gpuM = [0.0] * n; salesM = [0.0] * n; adminM = [0.0] * n
    capexM = [0.0] * n; revT = [0.0] * n; intM = [0.0] * n
    for y in range(5):
        a = A[y]; ramp = L["ramp"][y]; rs = sum(ramp)
        adds = [a["new"] * r / rs for r in ramp]
        ends = []; c = a["mp"]
        for x in adds:
            c += x; ends.append(c)
        W = sum(ends)
        for m in range(12):
            t = y * 12 + m; w = ends[m] / W
            rv["P"][t] = a["revP"] * w; rv["Chk"][t] = a["revChk"] * w; rv["Svc"][t] = a["revSvc"] * w
            rv["Resv"][t] = a["revResv"] * w; rv["Sub"][t] = a["revSub"] * w; rv["Ins"][t] = a["revIns"] * w
            rv["Etc"][t] = (a["revAd"] + a["revAg"] + a["revApi"]) * w
            revT[t] = sum(rv[k][t] for k in rv)
            cogsM[t] = a["cogs"] * w; custM[t] = (a["reward"] + a["don"]) * w
            cacM[t] = adds[m] * P["cac"]; brandM[t] = (a["brand"] - a["launch"]) * w
            lp = L["launchPh"]; launchM[t] = a["launch"] * lp[m] / sum(lp) if sum(lp) else a["launch"] / 12.0
            rndM[t] = a["rnd"] * w; cloudM[t] = a["cloud"] * w; gpuM[t] = a["gpu"] * w
            salesM[t] = a["sales"] * w; adminM[t] = a["admin"] * w
            cp = L["capexPh"]; capexM[t] = a["capex"] * cp[m] / sum(cp) if sum(cp) else a["capex"] / 12.0
            intM[t] = P["interestYear"] / 12.0
    # 인건비 연속 경로
    path = []; st = L["payStart"]
    for y in range(5):
        en = A[y]["pay"] / 6.0 - st
        path += [st + (en - st) * m / 11.0 for m in range(12)]
        st = en
    avgsal = [A[y]["pay"] / heads_total(y) for y in range(5)]
    varRate = P["brandMktRate"] + (P["rndRate"] + P["salesRate"] + P["adminRate"]) * P["opexScale"]
    # ── 기간 축(구축 24 + 본 60) ──
    cols = [(j - PRE_MAX + 1) for j in range(PRE_MAX)] + [t + 1 for t in range(n)]
    labels = ["구축-%d" % (PRE_MAX - j) for j in range(PRE_MAX)] + ["%d차-%02d" % (t // 12 + 1, t % 12 + 1) for t in range(n)]
    c0 = (1 - pre) if pre > 0 else 1
    heads = []
    for idx in cols:
        if idx < 1:
            heads.append((L["payStart"] * L["prePay"] * 12 / avgsal[0]) if idx > -pre else 0.0)
        else:
            t = idx - 1
            heads.append(path[t] * 12 / avgsal[t // 12])
    lag = L["lag"]
    cum = 0.0; series = []; maxreq = 0.0
    pre_bal = 0.0
    fixedM = []
    for j, idx in enumerate(cols):
        inflow = outflow = 0.0
        # 보증금 — 향후 N개월 최대 인원 × 월 임차료 × 보증금 개월, 증액분만
        look = heads[j:j + L["depLook"]]
        req = (max(look) if look else 0.0) * L["rent"] * L["depMonths"]
        dep_out = max(0.0, req - maxreq); maxreq = max(maxreq, req)
        hire = max(0.0, heads[j] - (heads[j - 1] if j > 0 else 0.0)) * (avgsal[(idx - 1) // 12] if idx >= 1 else avgsal[0]) * L["hireRate"]
        one = L["oneOff"] if idx == c0 else 0.0
        if idx < 1:
            active = idx > -pre
            if active:
                outflow = L["payStart"] * L["prePay"] + L["preOpex"] + heads[j] * L["rent"]
            outflow += dep_out + hire + one
            fixedM.append(0.0)
        else:
            t = idx - 1; y = t // 12; m = t % 12
            cov = L["insCov"][m] if y == 0 else 1.0

            def insRec(p):                       # p = 기간 번호(≥1)의 커버리지 반영 보험 매출
                tt = p - 1
                cv = L["insCov"][tt % 12] if tt < 12 else 1.0
                return rv["Ins"][tt] * cv

            def lagged(k, l):
                p = idx - l
                if p < 1:
                    return 0.0
                return insRec(p) if k == "Ins" else rv[k][p - 1]
            insCol = lagged("Ins", lag["Ins"])
            # 선급 상계(선입선출)
            recv = L["prepay"] if idx == L["prepayAt"] else 0.0
            offset = min(pre_bal + recv, insCol)
            pre_bal = pre_bal + recv - offset
            inflow = (lagged("P", lag["P"]) + lagged("Chk", lag["Chk"]) + lagged("Svc", lag["Svc"]) + lagged("Resv", lag["Resv"])
                      + lagged("Sub", lag["Sub"]) + (insCol - offset) + lagged("Etc", lag["Etc"]))
            pc = idx - L["cogsLag"]
            o_cogs = cogsM[pc - 1] if pc >= 1 else 0.0
            covSave = rv["Ins"][t] * (1 - cov) * varRate
            rent = heads[j] * L["rent"]
            rent_out = max(0.0, rent - adminM[t]) if L["adminHasRent"] == 1 else rent
            repay = L["repay"] if (L["repayFrom"] <= idx <= L["repayTo"]) else 0.0
            tax = A[y - 1]["tax"] if (m == 2 and y >= 1) else 0.0
            wc = revT[t] * L["wc"]
            outflow = (o_cogs + custM[t] + cacM[t] + brandM[t] + launchM[t] + capexM[t] + path[t] + rndM[t] + cloudM[t]
                       + gpuM[t] + salesM[t] + adminM[t] + intM[t] + wc + tax - covSave + rent_out + dep_out + hire + one + repay)
            fixedM.append(path[t] + rndM[t] + cloudM[t] + gpuM[t] + adminM[t] + intM[t])
        cum += inflow - outflow
        series.append((labels[j], idx, inflow, outflow, cum))
    cums = [s[4] for s in series]
    low = min(0.0, min(cums)); jl = cums.index(min(cums))
    low_at = labels[jl] if min(cums) < 0 else "저점 없음"
    y1 = A[0]
    fixed_avg = (y1["pay"] + y1["rnd"] + y1["cloud"] + y1["gpu"] + y1["admin"] + P["interestYear"]) / 12.0
    buffer = L["buf"] * fixed_avg
    need = -low + buffer
    req_new = math.ceil(max(0.0, need - L["cashAvail"] - L["prepay"]) / 1e9) * 1e9
    buf_months_at_low = buffer / fixedM[jl] if fixedM[jl] else None
    # 런웨이 — 가용 현금 + 요청액 + 선급 수령 반영 누적
    runway = "소진 없음"
    for (lab, idx, i_, o_, c_) in series:
        got_pre = L["prepay"] if (L["prepay"] and idx >= L["prepayAt"]) else 0.0
        if L["cashAvail"] + req_new + got_pre + c_ < 0:
            runway = lab; break
    return dict(low=low, low_at=low_at, fixed_avg=fixed_avg, buffer=buffer, need=need, req=req_new,
                total_round=math.ceil(need / 1e9) * 1e9, buf_months=buf_months_at_low, runway=runway, series=series, A=A)


RAMP = O.RAMP
ONES = [1] * 12
ROAD = [0, 0, 7 / 16, 7 / 16, 7 / 16, 1, 1, 1, 1, 1, 1, 1]
BASE = dict(pre=0, prePay=0.5, preOpex=0, lag=dict(P=0, Chk=0, Svc=0, Resv=0, Sub=0, Ins=0, Etc=0), wc=0.02, cogsLag=0,
            insCov=ONES, rent=540000, depMonths=10, depLook=6, adminHasRent=1, hireRate=0.05, oneOff=150000000,
            prepay=0, prepayAt=1, repay=0, repayFrom=1, repayTo=0, buf=6, payStart=300000000, ramp=RAMP, cashAvail=2800000000,
            launchPh=ONES, capexPh=ONES)
LA = dict(BASE)
LB = dict(BASE, pre=6, preOpex=100000000, lag=dict(P=0, Chk=1, Svc=1, Resv=1, Sub=1, Ins=2, Etc=0), wc=0.0,
          insCov=ROAD, adminHasRent=0, oneOff=0, launchPh=[3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0], capexPh=[1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0])
LC = dict(LB, insCov=[0] * 12)

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    # v1 규칙 재현(간접비·커버리지·선급 모두 끔)
    v1 = dict(LA, rent=0, depMonths=0, hireRate=0, oneOff=0)
    r = run(P0, v1)
    print("v1 규칙 재현 A: 저점 %.2f억 필요 %.2f억 (v1 = -36.78 / 80.89)" % (r["low"] / 1e8, r["need"] / 1e8))
    v1b = dict(LB, rent=0, depMonths=0, hireRate=0, oneOff=0, insCov=ONES)
    r = run(P0, v1b)
    print("v1 규칙 재현 B: 저점 %.2f억 필요 %.2f억 (v1 = -87.61 / 131.72)" % (r["low"] / 1e8, r["need"] / 1e8))
    print()
    for nm, L in (("A 계획", LA), ("B 보수", LB), ("C 게이트지연", LC)):
        r = run(P0, L)
        print("%-10s 저점 %7.1f억(%s) · 버퍼 %.1f억(저점달 기준 %.1f개월) · 필요 %7.1f억 · 총올림 %4.0f억 · 요청(신규) %4.0f억 · 런웨이 %s"
              % (nm, r["low"] / 1e8, r["low_at"], r["buffer"] / 1e8, r["buf_months"] or 0, r["need"] / 1e8,
                 r["total_round"] / 1e8, r["req"] / 1e8, r["runway"]))
