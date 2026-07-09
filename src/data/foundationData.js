/* ====================== HI-Fin 기반 온톨로지 도메인 데이터셋 (결정적) ======================
   보안·AI전산·인사·총무·데이터거버넌스·Audit·블록체인 인스턴스 레코드. (시연용 합성 데이터) */
let _fndData = null;
function foundationData() {
  if (_fndData) return _fndData;
  const rng = _mul32(0xF0DA7A);
  const dt = (y) => y + "-" + String(1 + Math.floor(rng() * 7)).padStart(2, "0") + "-" + String(1 + Math.floor(rng() * 27)).padStart(2, "0");
  const ip = () => (10 + Math.floor(rng() * 240)) + "." + Math.floor(rng() * 255) + "." + Math.floor(rng() * 255) + "." + Math.floor(rng() * 255);
  const cohort = (typeof pilotCohort === "function") ? pilotCohort() : [];
  const depts = ["경영지원", "플랫폼개발", "AI연구", "데이터", "정보보안", "영업", "마케팅", "의료지원", "물류·SCM", "재무회계", "인사", "디자인"];

  const secTypes = ["비인가 접근", "악성코드", "피싱", "DDoS", "취약점 악용", "권한상승 시도", "데이터 유출시도"];
  const sev = [["높음", 12], ["중간", 38], ["낮음", 50]], secSt = [["차단", 70], ["조사중", 18], ["종결", 12]];
  const incidents = []; for (let i = 0; i < 680; i++) incidents.push({ id: "SEC" + String(i + 1).padStart(5, "0"), ts: dt(2026), type: _pick(rng, secTypes), severity: _wpick(rng, sev), source: ip(), status: _wpick(rng, secSt), target: "자산-" + (1 + Math.floor(rng() * 400)) });

  const svcTypes = ["API 서비스", "AI 모델", "데이터베이스", "메시지큐", "배치잡", "게이트웨이"], svcSt = [["정상", 86], ["저하", 10], ["장애", 4]];
  const svcNames = ["auth", "payment", "doctor-ai", "shop", "checkup", "wallet", "chain-node", "ontology", "notify", "search", "recommend", "ledger", "risk", "logistics"];
  const services = []; for (let i = 0; i < 48; i++) { const st = _wpick(rng, svcSt); services.push({ id: "SVC" + String(i + 1).padStart(4, "0"), name: _pick(rng, svcNames) + "-svc-" + (i % 6 + 1), type: _pick(rng, svcTypes), status: st, uptime: (st === "정상" ? 99.9 + rng() * 0.09 : st === "저하" ? 99 + rng() * 0.8 : 95 + rng() * 3).toFixed(2) + "%", cpu: Math.floor((st === "장애" ? 72 : 18) + rng() * 26) + "%", region: _pick(rng, ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]) }); }

  const posn = ["사원", "주임", "대리", "과장", "차장", "팀장", "이사"];
  const employees = []; for (let i = 0; i < 128; i++) { const m = cohort[(i * 137) % (cohort.length || 1)] || { name: "직원" + i }; employees.push({ id: "EMP" + String(i + 1).padStart(4, "0"), name: m.name || ("직원" + i), dept: _pick(rng, depts), position: _pick(rng, posn), join: (2016 + Math.floor(rng() * 10)) + "-" + String(1 + Math.floor(rng() * 12)).padStart(2, "0"), status: rng() < 0.94 ? "재직" : "휴직" }); }

  const asCat = ["노트북", "모니터", "서버", "사무가구", "법인차량", "SW 라이선스", "네트워크장비", "복합기"], asSt = [["사용중", 82], ["유휴", 12], ["수리", 4], ["폐기예정", 2]];
  const assets = []; for (let i = 0; i < 520; i++) { const c = _pick(rng, asCat); assets.push({ id: "AST" + String(i + 1).padStart(5, "0"), name: c + " #" + (1000 + i), category: c, value: (30 + Math.floor(rng() * 470)) * 10000, dept: _pick(rng, depts), status: _wpick(rng, asSt) }); }

  const dgDom = ["회원", "진료", "검진", "보험", "거래처", "제품", "주문", "정산", "마케팅", "블록체인"];
  const dataAssets = []; for (let i = 0; i < 420; i++) { const pii = rng() < 0.4; dataAssets.push({ id: "DAT" + String(i + 1).padStart(5, "0"), name: _pick(rng, dgDom) + "_" + _pick(rng, ["master", "fact", "dim", "log", "snapshot"]) + "_" + (i % 40), domain: _pick(rng, dgDom), quality: (88 + rng() * 11).toFixed(1), pii: pii ? "PII" : "일반", masking: pii ? "마스킹" : "—", owner: "스튜어드-" + (1 + Math.floor(rng() * 8)) }); }

  const auActs = ["로그인", "권한변경", "데이터 조회", "데이터 수정", "정산 승인", "계약 체결", "설정 변경", "데이터 내보내기"], auRes = [["성공", 92], ["거부", 8]];
  const auditLogs = []; for (let i = 0; i < 1600; i++) auditLogs.push({ id: "AUD" + String(i + 1).padStart(6, "0"), ts: dt(2026), actor: "EMP" + String(1 + Math.floor(rng() * 128)).padStart(4, "0"), action: _pick(rng, auActs), target: _pick(rng, dgDom), result: _wpick(rng, auRes), risk: _pick(rng, ["낮음", "낮음", "중간", "높음"]) });

  const txTypes = [["적립", 50], ["사용", 30], ["전송", 12], ["NFT 발행", 5], ["정산", 3]];
  const hex = (n) => "0x" + Math.floor(rng() * 0xffffffff).toString(16).padStart(8, "0") + Math.floor(rng() * 0xffffffff).toString(16).padStart(8, "0");
  const wallet = () => "0x" + Array.from({ length: 4 }, () => Math.floor(rng() * 0xffff).toString(16).padStart(4, "0")).join("") + "…";
  const txs = []; for (let i = 0; i < 1600; i++) { const ty = _wpick(rng, txTypes); txs.push({ id: "TX" + String(i + 1).padStart(6, "0"), hash: hex(), type: ty, amount: (Math.floor(rng() * 50000)).toLocaleString() + " HTK", htk: Math.floor(rng() * 50000), from: wallet(), to: wallet(), status: "confirmed" }); }
  /* 블록 그룹핑 — 블록당 4~9 TX, 순차 높이·이전해시 체인·검증자 */
  const VALIDATORS = ["HI-Node-01(Seoul)", "HI-Node-02(Busan)", "HI-Node-03(Gwangju)", "HI-Node-04(Daejeon)", "HI-Node-05(Jeju)"];
  const blocks = []; let cursor = 0, h = 1800000, prevHash = "0x0000000000000000(genesis)";
  while (cursor < txs.length) {
    const size = 4 + Math.floor(rng() * 6); const btx = txs.slice(cursor, cursor + size); const bh = hex();
    const ts = "2026-" + String(1 + Math.floor(rng() * 7)).padStart(2, "0") + "-" + String(1 + Math.floor(rng() * 27)).padStart(2, "0") + " " + String(Math.floor(rng() * 24)).padStart(2, "0") + ":" + String(Math.floor(rng() * 60)).padStart(2, "0") + ":" + String(Math.floor(rng() * 60)).padStart(2, "0");
    btx.forEach((t) => { t.block = h; t.blockHash = bh; });
    blocks.push({ height: h, ts, hash: bh, prevHash, validator: _pick(rng, VALIDATORS), txCount: btx.length, txIds: btx.map((t) => t.id), gas: (18 + Math.floor(rng() * 40)) + "K", htkSum: btx.reduce((s, t) => s + t.htk, 0) });
    prevHash = bh; cursor += size; h++;
  }

  _fndData = { incidents, services, employees, assets, dataAssets, auditLogs, txs, blocks, validators: VALIDATORS, wallets: cohort.length || 100000 };
  return _fndData;
}
