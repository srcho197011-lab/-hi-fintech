/* ══════════════ 인사 · 계약 · 문서 화면(CorpAdmin.jsx) · CorpOps Phase 8 (조성래님 지시 2026-11-12) ══════════════
   세 지면을 한 파일에 둔다 — 같은 원천(corpAdmin.js)을 보고 표시 규약이 같기 때문이다.
     CorpHrSection        인사총무팀 M3 「조직 · 인사」
     CorpDocsSection      인사총무팀 M3 「총무 · 문서」
     CorpContractSection  경영기획팀 M1 「계약 대장」

   이 화면이 지키는 것
     · 주민등록번호는 **값을 보여 줄 자리가 없다.** 보유 여부 · 근거 · 보관 위치 · 파기 예정만 적는다.
       값을 담을 수 있게 되는 조건 넷을 화면에 적고, 넷이 서기 전에는 담지 않는다고 말한다.
     · 수집하지 않는 것을 **이름을 대고** 적는다. 안 적으면 「아직 안 넣었다」로 읽힌다.
     · 보존기한은 법령에서 온다. 원문 대조를 안 했으면 그렇게 적는다 — 조문 번호를 찍지 않는다.
     · 만료 경보는 고정 날짜를 주입해 계산한다. */

/* ── 인사 ─────────────────────────────────────────────────────────────── */
function CorpHrSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const V = React.useMemo(() => corpAdminPass(now), [now && now.getTime()]);
  const open = corpRrnOpen();
  const gateOn = CORP_RRN_GATE.filter((g) => g.ok).length;

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>조직 · 인사</b><span className="cl-sub">직무 정보만 — 개인정보를 늘리지 않습니다</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">재직 {corpHrOn().length} · 합류 전 {CORP_HR.length - corpHrOn().length}</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>

      <div className="cl-warn">
        <b>주민등록번호는 필드를 두되 값은 이 시스템이 들지 않습니다.</b> 근로소득 원천징수와 4대보험 취득신고에
        법정 필수 기재사항이라 뺄 수 없지만, 고유식별정보라 저장 시 암호화가 법정 의무인데 <b>서버가 없습니다</b>.
        브라우저 저장소는 평문이고, 브라우저에서 하는 암호화는 열쇠가 같은 자리에 있어 암호화가 아닙니다.
        <CorpDefn>
          <span className="cl-warn2">
          그래서 하이핀은 <b>보유 여부 · 수집 근거 · 보관 위치와 책임자 · 열람 이력 · 파기 예정일</b>까지만 듭니다.
          신고 제출은 세무대리인이 합니다 — 하이핀이 할 일은 값을 쥐는 것이 아니라 놓치지 않는 것입니다.
          </span>
        </CorpDefn>
      </div>

      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">인사 기록 <span className="cl-t">사번 대역 {CORP_HR_PREFIX}#### — 프로·운영본부 대역과 겹치지 않습니다</span></div>
          <table className="cl-tbl">
            <thead><tr><th>사번</th><th>성명</th><th>직위</th><th>소속</th><th>합류</th><th>전문영역</th><th>자격증</th><th>주민번호</th></tr></thead>
            <tbody>
              {CORP_HR.map((h) => (
                <tr key={h.name} className={h.on ? "" : "ad-off"}>
                  <td className="id">{h.no || "—"}</td>
                  <td>{h.name}{!h.on && <i className="ad-pend">합류 전</i>}</td>
                  <td className="id">{h.title}</td>
                  <td className="id">{h.teams.join(" · ")}</td>
                  <td className="id">{h.joined || "미정"}</td>
                  <td className="desc">{h.expertise.join(" · ")}</td>
                  <td className="id">{h.certs.length ? h.certs.join(" · ") : "—"}</td>
                  <td>{h.rrn
                    ? <span className={"ad-rrn" + (h.rrn.where && h.rrn.by !== "미지정" ? " ok" : " open")}>
                        {h.rrn.held ? "보유" : "미보유"} · {h.rrn.where || "보관처 미지정"}</span>
                    : <span className="ad-na">해당 없음</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cl-note">자격증은 <b>보유 사실</b>까지만 적고 번호는 받지 않습니다 — 번호 자체가 식별자입니다.</p>
        </div>

        <div className="cl-grid2">
          <div className="cl-sec">
            <div className="cl-h">주민번호 보관 — 값을 담을 수 있게 되는 조건
              <span className={"cl-flag" + (gateOn === CORP_RRN_GATE.length ? " on" : "")}>{gateOn} / {CORP_RRN_GATE.length} 충족</span></div>
            {CORP_RRN_GATE.map((g) => (
              <div key={g.k} className="cl-open">
                <span className={"ad-tag " + (g.ok ? "ok" : "no")}>{g.ok ? "충족" : "미충족"}</span>
                <b>{g.ko}</b><i>{g.d}</i>
              </div>
            ))}
            <p className="cl-note">넷이 <b>모두</b> 서야 값을 담습니다. 셋만 서면 담지 않습니다 — 암호화 없는 보관은 법정 의무 위반이고,
              접근 통제가 화면에만 있으면 통제가 아닙니다.</p>
          </div>

          <div className="cl-sec">
            <div className="cl-h">수집하지 않는 것 <span className="cl-t">이름을 대고 적습니다</span></div>
            <div className="ad-no">
              {["주민등록번호 값", "주소", "생년월일", "개인 연락처", "개인 이메일", "자격증 번호", "급여액", "인사 평가"].map((x) => (
                <span key={x} className="ad-nochip">{x}</span>
              ))}
            </div>
            <p className="cl-note"><b>수집하지 않는 것이 통제입니다.</b> 없는 자료는 샐 수 없습니다.
              「아직 안 넣었다」가 아니라 <b>넣지 않기로 한 것</b>이라 이름을 대고 적습니다.</p>
            {open.length > 0 && (
              <div className="cl-open">
                <span className="ad-tag no">보관 책임자 미지정 {open.length}명</span>
                <i>주민번호가 필요한 자리인데 누가 어디서 들고 있는지가 비어 있습니다 — 그게 사고입니다.</i>
              </div>
            )}
          </div>
        </div>

        <AdCheck V={V} />
      </div>
    </div>
  );
}

/* ── 계약 대장 ────────────────────────────────────────────────────────── */
function CorpContractSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const V = React.useMemo(() => corpAdminPass(now), [now && now.getTime()]);
  const rows = CORP_CT.map((c) => ({ c: c, a: corpCtAlert(c, now), k: corpCtCheck(c) }))
    .sort((x, y) => (x.a.d === null ? 1 : y.a.d === null ? -1 : x.a.d - y.a.d));
  const near = rows.filter((r) => r.a.k !== "ok" && r.a.k !== "none");

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>계약 대장</b><span className="cl-sub">만료 경보 — 임박한 순</span></div>
        <div className="cl-ctl">
          <span className={"ad-chip" + (near.length ? " warn" : "")}>{CORP_CT.length}건 · 경보 {near.length}</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>
      <div className="cl-warn">
        <b>만료일 없는 계약은 등록하지 않습니다.</b> 만료일이 없으면 경보를 세울 수 없고, 경보가 없는 대장은
        있으나 마나입니다. 자동갱신이어도 경보는 그대로 울립니다 — 갱신 시점이 조건이 바뀌는 자리이기 때문입니다.
        <CorpDefn>
          <span className="cl-warn2">갱신·해지 결정은 사람이 합니다. 이 화면은 기한이 왔다는 것까지만 말합니다.</span>
        </CorpDefn>
      </div>
      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">계약 <span className="cl-t">기준 {now.getFullYear()}-{String(now.getMonth() + 1).padStart(2, "0")}-{String(now.getDate()).padStart(2, "0")}</span></div>
          <table className="cl-tbl">
            <thead><tr><th>계약</th><th>상대</th><th>종류</th><th>주관</th><th>기간</th><th>금액</th><th>경보</th></tr></thead>
            <tbody>
              {rows.map(({ c, a, k }) => (
                <tr key={c.id} className={a.k === "over" || a.k === "d7" ? "bad" : ""}>
                  <td>{c.ko}{c.auto && <i className="ad-auto">자동갱신</i>}
                    <div className="ad-note">{c.note}</div></td>
                  <td className="id">{c.party}</td>
                  <td className="id">{c.kind}</td>
                  <td className="id">{c.owner}</td>
                  <td className="id">{c.from} ~ {c.to}</td>
                  <td className="n">{corpWon(c.amount)}<i>{c.cycle}</i></td>
                  <td><span className="ad-alert" style={{ color: a.c, borderColor: a.c }}>{a.ko}
                    {a.d !== null && <em>{a.d >= 0 ? "D-" + a.d : "+" + (-a.d) + "일"}</em>}</span>
                    {!k.ok && <i className="ad-bad">{k.errs[0]}</i>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cl-note">경보 단계 — {CORP_CT_ALERT.filter((x) => x.k !== "ok").map((x) => x.ko).join(" · ")}.
            <b> 만료 경과를 따로 둡니다</b> — 「임박」에 묻으면 이미 지난 건이 안 보입니다.</p>
        </div>
        <AdCheck V={V} />
      </div>
    </div>
  );
}

/* ── 문서 분류 · 보존기한 ─────────────────────────────────────────────── */
function CorpDocsSection() {
  const now = typeof corpOpsNow === "function" ? corpOpsNow() : new Date();
  const V = React.useMemo(() => corpAdminPass(now), [now && now.getTime()]);
  const unchecked = CORP_DOC_CLASS.filter((d) => !d.checked).length;
  const undec = CORP_DOC_CLASS.filter((d) => !corpKeepSet(d)).length;

  return (
    <div className="cl-wrap">
      <div className="cl-top">
        <div className="cl-ttl"><b>총무 · 문서</b><span className="cl-sub">분류와 보존기한</span></div>
        <div className="cl-ctl">
          <span className="ad-chip">{CORP_DOC_CLASS.length}종</span>
          <span className={"cl-verd" + (V.pass ? " on" : " bad")}>검산 {V.rows.length - V.fail.length - V.zero.length} / {V.rows.length}</span>
        </div>
      </div>
      <div className="cl-warn">
        보존기한은 <b>법령에서 옵니다</b>. 이 표의 {unchecked}종은 아직 <b>법령 원문 대조를 거치지 않았습니다</b> —
        그래서 근거가 되는 법률의 이름만 적고 <b>조문 번호는 적지 않습니다</b>. 확인하지 않은 조문을 화면에 찍으면
        읽는 사람이 그걸 믿고 쓰게 됩니다.
        <CorpDefn>
          <span className="cl-warn2">
          <b>두 축을 갈라 둡니다</b> — 「법정 연한」은 법령에서 오고, 「회사 보존」은 대표가 정합니다.
          회사 보존은 {CORP_DOC_CLASS.length - undec}종 정해졌고 {undec}종은 아직 미정입니다.
          둘을 한 칸에 적으면 어느 쪽이 근거인지 알 수 없게 됩니다.
          보관 자체는 저장소(바탕화면 폴더)가 하고, 이 화면은 <b>그 규칙을 적어 두는 자리</b>입니다.
          </span>
        </CorpDefn>
      </div>
      <div className="cl-body">
        <div className="cl-sec">
          <div className="cl-h">문서 분류 <span className="cl-t">법정 연한 · 회사 보존</span>
            <span className={"cl-flag" + (unchecked ? " bad" : " on")}>원문 미확인 {unchecked} / {CORP_DOC_CLASS.length}</span>
            <span className={"cl-flag" + (undec ? " hold" : " on")}>회사 보존 미정 {undec} / {CORP_DOC_CLASS.length}</span></div>
          <table className="cl-tbl">
            <thead><tr><th>분류</th><th>법정 연한</th><th>근거 법률</th><th>원문 대조</th>
              <th>회사 보존</th><th>정한 주체</th><th>예</th></tr></thead>
            <tbody>
              {CORP_DOC_CLASS.map((d) => (
                <tr key={d.k} className={d.keep === 0 ? "ad-perm" : ""}>
                  <td>{d.ko}</td>
                  <td className="n">{corpYearsKo(d.years)}</td>
                  <td className="id">{d.basisKo}</td>
                  <td><span className={"ad-tag " + (d.checked ? "ok" : "no")}>{d.checked ? "확인" : "미확인"}</span></td>
                  <td className="n">{!corpKeepSet(d) ? <span className="ad-un">미정</span>
                    : <b className={d.keep === 0 ? "ad-pm" : ""}>{corpKeepKo(d)}</b>}</td>
                  <td className="desc">{d.keepBy || <span className="ad-un">—</span>}</td>
                  <td className="desc">{d.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cl-note"><b>재무제표는 영구보관</b>이고 <b>회계장부 · 전표는 10년</b>입니다 — 대표가 그렇게 정했습니다.
            그래서 두 분류를 <b>갈라 두었습니다</b>. 한 분류로 묶어 두면 10년 뒤 장부를 버릴 때 재무제표가 함께 버려집니다.</p>
          <p className="cl-note">계약 대장의 각 계약은 이 분류 중 하나를 가리킵니다 — 계약과 문서가 끊기면
            보존기한이 어디서 오는지 알 수 없습니다. 자료실의 「보존」 칸도 이 표를 봅니다.</p>
        </div>
        <AdCheck V={V} />
      </div>
    </div>
  );
}

/* 세 지면이 같은 검산을 쓴다 — 셋이 같은 원천을 보기 때문이다 */
function AdCheck({ V }) {
  return (
    <div className="cl-sec">
      <div className="cl-h">검산 — 화면과 커밋 게이트 러너가 같은 함수를 봅니다</div>
      <table className="cl-tbl id">
        <thead><tr><th>항목</th><th>대상</th><th>결과</th><th>기대</th><th /></tr></thead>
        <tbody>
          {V.rows.map((r) => (
            <tr key={r.k} className={r.ok && r.n > 0 ? "" : "bad"}>
              <td>{r.ko}</td><td className="n">{r.n}건</td>
              <td className="n">{r.got}</td><td className="n">{r.want}</td>
              <td className="st">{!(r.n > 0) ? "대상 0 — 실패" : (r.ok ? "통과" : "실패")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cl-note">「필드가 없다」는 음성 명제라 그냥 0건으로 두면 아무것도 증명하지 않습니다 —
        사람 수 × 금지 필드 수를 <b>분모로 세어</b> 전수로 확인합니다.</p>
    </div>
  );
}
