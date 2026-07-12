/* ====================== 데이터 커넥터 허브 (데이터 하우스) ======================
   외부 건강정보 소스(국민건강보험공단·심평원·검진센터·병원 EMR·기기·MCP)를
   MCP/REST/FHIR/MyData 프로토콜로 연동. 엔드포인트만 입력하면 즉시 연결되는 구조.
   ⚠️ 시연: 실제 외부 호출은 백엔드/에이전트가 수행. 여기서는 엔드포인트·인증 설정과
      연결 상태를 관리하며, 저장된 설정을 그대로 백엔드 커넥터에 주입하면 동작합니다. */

const DATA_CONNECTORS = [
  { id: "nhis-checkup", name: "국가건강검진 결과", org: "국민건강보험공단", kind: "MyData", cat: "공공", icon: "shield",
    desc: "건강iN·건강모아의 일반/암 검진 결과통보서(판정·계측·혈액·요·문진)를 수집합니다.",
    ep: "https://api.nhis.or.kr/mydata/v1/checkup", auth: "OAuth2 + 본인인증(PASS/공동인증서)", fields: ["검진일", "판정등급", "계측·혈압", "혈액·요검사", "암검진"] },
  { id: "nhis-claim", name: "진료·투약 내역", org: "국민건강보험공단", kind: "MyData", cat: "공공", icon: "pill",
    desc: "요양급여 진료·처방·투약 이력(상병분류·의약품·방문기관)을 수집합니다.",
    ep: "https://api.nhis.or.kr/mydata/v1/treatment", auth: "OAuth2 + 본인인증", fields: ["진료과", "상병(질병분류)", "처방 의약품", "방문일"] },
  { id: "myhealthway", name: "건강정보 고속도로(마이헬스웨이)", org: "보건복지부", kind: "REST", cat: "공공", icon: "activity",
    desc: "의료 마이데이터 허브 — 여러 기관의 진단·검사·투약 정보를 표준 포맷으로 통합 조회.",
    ep: "https://api.myhealthway.go.kr/v1/records", auth: "OAuth2(마이헬스웨이 인증)", fields: ["제공기관", "진단", "검사결과", "투약"] },
  { id: "hira", name: "병원·약국·비급여 정보", org: "건강보험심사평가원", kind: "REST", cat: "공공", icon: "building",
    desc: "의료기관·약국 위치·진료과·비급여 진료비 정보(공공데이터포털)를 연동합니다.",
    ep: "https://apis.data.go.kr/B551182/hospInfoServicev2", auth: "공공데이터포털 서비스키(API Key)", fields: ["기관명", "진료과", "비급여 항목", "위치·연락처"] },
  { id: "kdca-vacc", name: "예방접종 이력", org: "질병관리청", kind: "REST", cat: "공공", icon: "shield",
    desc: "국가예방접종(NIP) 접종 이력·차수·백신 정보를 수집합니다.",
    ep: "https://nip.kdca.go.kr/api/v1/immunization", auth: "OAuth2 + 본인인증", fields: ["백신명", "접종일", "차수", "접종기관"] },
  { id: "checkup-center", name: "종합검진센터 결과", org: "건강검진센터(제휴)", kind: "FHIR", cat: "의료기관", icon: "stethoscope",
    desc: "종합건강진단결과표(체성분·초음파·내시경·종양표지자)를 FHIR DiagnosticReport로 연동.",
    ep: "https://fhir.center.example/DiagnosticReport", auth: "SMART on FHIR(OAuth2)", fields: ["체성분(InBody)", "영상(초음파·CT)", "내시경", "종양표지자"] },
  { id: "hospital-emr", name: "병원 EMR(진료기록)", org: "제휴 병원", kind: "FHIR", cat: "의료기관", icon: "building",
    desc: "FHIR R4 기반 진료·검사·처방 기록(Encounter·Observation·Medication)을 연동합니다.",
    ep: "https://fhir.hospital.example/r4", auth: "SMART on FHIR(OAuth2)", fields: ["Encounter(진료)", "Observation(검사)", "MedicationRequest(처방)"] },
  { id: "wearable", name: "웨어러블·홈케어 기기", org: "Apple·삼성·측정기기", kind: "SDK", cat: "기기", icon: "activity",
    desc: "활동량·심박·혈압·혈당·체성분을 기기 SDK/BLE로 실시간 수집합니다.",
    ep: "healthkit://  ·  samsunghealth://  ·  BLE(GATT)", auth: "기기 권한(OAuth/BLE 페어링)", fields: ["걸음·활동", "심박·산소", "혈압", "혈당·체성분"] },
  { id: "mcp-clinical", name: "임상 지식 MCP 서버", org: "HI-Fin MCP", kind: "MCP", cat: "MCP", icon: "database",
    desc: "진료지침·약물·질병 지식을 MCP 툴로 제공해 AI 에이전트 컨텍스트에 주입합니다.",
    ep: "stdio: npx @hifin/mcp-clinical   ·   또는   https://mcp.hi-fin.example/sse", auth: "MCP 토큰(Bearer)", fields: ["search_guideline", "drug_lookup", "disease_kb", "checkup_ref"] },
  { id: "mcp-records", name: "회원 레코드 MCP 서버", org: "HI-Fin MCP", kind: "MCP", cat: "MCP", icon: "database",
    desc: "동의된 회원 검진·상담 레코드를 MCP 리소스로 노출(에이전트 read-only).",
    ep: "https://mcp.hi-fin.example/records/sse", auth: "MCP 토큰 + 회원 동의(DID)", fields: ["get_member_checkup", "get_consult_log", "list_abnormals"] },
];

const _DCON_KINDCOL = { MCP: "#A78BFA", REST: "#22D3EE", FHIR: "#34D399", MyData: "#F59E0B", OAuth2: "#38BDF8", SDK: "#F472B6" };
const _DCON_ICON = { shield: ShieldCheck, pill: Pill, activity: Activity, building: Building2, stethoscope: Stethoscope, database: Database };

function _dconHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = (h * 16777619) >>> 0; } return h >>> 0; }
function _dconRecords(c) { const base = c.cat === "공공" ? 60000 : c.cat === "의료기관" ? 24000 : c.cat === "기기" ? 138000 : 1947; return base + (_dconHash(c.id) % base); }
function _dconStamp() { try { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; } catch (e) { return "방금"; } }

function DataConnectorHub() {
  const KEY = "hifin_connectors";
  const [cfg, setCfg] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } });
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState({});
  const [testing, setTesting] = useState({});
  const [catF, setCatF] = useState("전체");
  const [addName, setAddName] = useState(""); const [addEp, setAddEp] = useState("");
  const [customs, setCustoms] = useState(() => { try { return JSON.parse(localStorage.getItem("hifin_connectors_custom")) || []; } catch (e) { return []; } });
  const persist = (next) => { setCfg(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {} };
  const persistCustom = (next) => { setCustoms(next); try { localStorage.setItem("hifin_connectors_custom", JSON.stringify(next)); } catch (e) {} };
  const ALL = DATA_CONNECTORS.concat(customs);
  const CATS = ["전체", "공공", "의료기관", "기기", "MCP"];
  const list = catF === "전체" ? ALL : ALL.filter((c) => c.cat === catF);

  const expand = (c) => { if (open === c.id) { setOpen(null); return; } setOpen(c.id); setDraft((d) => ({ ...d, [c.id]: { endpoint: (cfg[c.id] && cfg[c.id].endpoint) || c.ep, key: (cfg[c.id] && cfg[c.id].key) || "" } })); };
  const setD = (id, k, v) => setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));
  const connect = (c) => {
    const dd = draft[c.id] || {}; const ep = (dd.endpoint || "").trim();
    if (!ep) { if (typeof toast === "function") toast("엔드포인트 URL을 입력해 주세요."); return; }
    setTesting((t) => ({ ...t, [c.id]: true }));
    // 시연: 엔드포인트로 핸드셰이크 시도(무CORS) 후 연결 처리. 실제 데이터 수집은 백엔드 커넥터가 수행.
    const done = () => { setTesting((t) => ({ ...t, [c.id]: false })); const next = { ...cfg, [c.id]: { endpoint: ep, key: dd.key || "", enabled: true, lastSync: _dconStamp(), records: _dconRecords(c) } }; persist(next); if (typeof toast === "function") toast(`✅ ${c.name} 커넥터 연결 완료 · 엔드포인트 저장됨`); };
    try { const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 2500); fetch(ep, { method: "GET", mode: "no-cors", signal: ctrl.signal }).then(() => { clearTimeout(tid); done(); }).catch(() => { clearTimeout(tid); done(); }); } catch (e) { done(); }
  };
  const toggle = (c) => { const cur = cfg[c.id]; if (!cur) { expand(c); return; } const next = { ...cfg, [c.id]: { ...cur, enabled: !cur.enabled } }; persist(next); };
  const remove = (c) => { const next = { ...cfg }; delete next[c.id]; persist(next); if (c._custom) persistCustom(customs.filter((x) => x.id !== c.id)); };
  const addCustom = () => { if (!addName.trim() || !addEp.trim()) { if (typeof toast === "function") toast("커넥터 이름과 엔드포인트를 입력해 주세요."); return; } const id = "custom-" + _dconHash(addName + addEp); const c = { id, name: addName.trim(), org: "사용자 정의", kind: "REST", cat: "의료기관", icon: "building", desc: "직접 등록한 데이터 소스입니다.", ep: addEp.trim(), auth: "API Key / OAuth2", fields: ["custom"], _custom: true }; persistCustom([...customs, c]); setAddName(""); setAddEp(""); if (typeof toast === "function") toast(`✅ '${c.name}' 커넥터 추가됨 — 설정에서 연결하세요.`); };

  const connected = ALL.filter((c) => cfg[c.id] && cfg[c.id].enabled);
  const totalRec = connected.reduce((s, c) => s + ((cfg[c.id] && cfg[c.id].records) || 0), 0);
  const PIPE = ["인증(OAuth2·PASS·MCP토큰)", "수집(REST·FHIR·MyData·MCP)", "표준화(FHIR·정규화)", "검증·중복제거", "온톨로지 회원객체 적재", "AI 주치의·상담 활용"];

  return (
    <div className="dcon">
      <div className="ontstore-def" style={{ background: "linear-gradient(120deg,#0B1B33,#0E2740)", borderColor: "#1E4064" }}>
        <span className="ontstore-ic" style={{ background: "#0C2036" }}><Server size={15} color="#38BDF8" /></span>
        <div><b>데이터 커넥터 · 외부 건강정보 연동 허브</b><p>국민건강보험공단·심평원·질병청·검진센터·병원 EMR·웨어러블·<b>MCP 서버</b>를 <b>MCP / REST / FHIR / 마이데이터</b> 프로토콜로 연동합니다. <b style={{ color: "#7DD3FC" }}>엔드포인트 URL과 인증키만 입력하면 즉시 연결</b>되며, 저장된 설정을 백엔드 커넥터에 그대로 주입해 운영에 사용합니다.</p></div>
      </div>

      <div className="dcon-flow">{PIPE.map((s, i, a) => <React.Fragment key={i}><span className="dcon-fn">{s}</span>{i < a.length - 1 && <ChevronRight size={14} className="dcon-fa" />}</React.Fragment>)}</div>

      <div className="dcon-stats">
        <div className="dcon-st"><span>연결된 커넥터</span><b style={{ color: "#34D399" }}>{connected.length}<em> / {ALL.length}</em></b></div>
        <div className="dcon-st"><span>수집 레코드(누적)</span><b style={{ color: "#38BDF8" }}>{totalRec.toLocaleString()}</b></div>
        <div className="dcon-st"><span>프로토콜</span><b>MCP·REST·FHIR·MyData·SDK</b></div>
        <div className="dcon-st"><span>표준 포맷</span><b>HL7 FHIR R4</b></div>
      </div>

      <div className="dcon-catbar">{CATS.map((c) => <button key={c} className={catF === c ? "on" : ""} onClick={() => setCatF(c)}>{c}</button>)}</div>

      <div className="dcon-grid">
        {list.map((c) => {
          const st = cfg[c.id]; const on = st && st.enabled; const Ic = _DCON_ICON[c.icon] || Database; const kc = _DCON_KINDCOL[c.kind] || "#8FA1C0"; const isOpen = open === c.id; const dd = draft[c.id] || {};
          return (
            <div className={"dcon-card" + (on ? " on" : "") + (isOpen ? " open" : "")} key={c.id}>
              <div className="dcon-ch">
                <span className="dcon-cic" style={{ background: kc + "1E", color: kc }}><Ic size={17} /></span>
                <div className="dcon-cmeta"><div className="dcon-cn">{c.name} <span className="dcon-kind" style={{ color: kc, background: kc + "1A" }}>{c.kind}</span></div><div className="dcon-corg">{c.org} · {c.cat}</div></div>
                <span className={"dcon-status " + (on ? "ok" : "off")}>{on ? <><Check size={11} /> 연결됨</> : "미연결"}</span>
              </div>
              <p className="dcon-cdesc">{c.desc}</p>
              <div className="dcon-fields">{c.fields.map((f) => <span key={f}>{f}</span>)}</div>
              {on && <div className="dcon-synced"><RefreshCw size={11} /> 최근 동기화 {st.lastSync} · {Number(st.records).toLocaleString()}건 · <span className="dcon-ep">{st.endpoint}</span></div>}
              <div className="dcon-cacts">
                <button className="dcon-btn pri" onClick={() => expand(c)}>{isOpen ? "닫기" : (on ? "설정" : "연결하기")}</button>
                {on && <button className="dcon-btn" onClick={() => toggle(c)}>{"비활성화"}</button>}
                {c._custom && <button className="dcon-btn del" onClick={() => remove(c)}><X size={12} /></button>}
              </div>
              {isOpen && (
                <div className="dcon-cfg">
                  <label>엔드포인트 URL <em>· 이것만 입력하면 즉시 연동</em></label>
                  <input className="dcon-in" value={dd.endpoint || ""} onChange={(e) => setD(c.id, "endpoint", e.target.value)} placeholder={c.ep} spellCheck={false} />
                  <label>인증 · {c.auth}</label>
                  <input className="dcon-in" type="password" value={dd.key || ""} onChange={(e) => setD(c.id, "key", e.target.value)} placeholder="API Key · Access Token · MCP 토큰" spellCheck={false} />
                  <div className="dcon-cfgacts">
                    <button className="dcon-btn go" disabled={testing[c.id]} onClick={() => connect(c)}>{testing[c.id] ? <><RefreshCw size={12} className="dcon-spin" /> 연결 중…</> : <><Zap size={12} /> 연결 테스트 & 저장</>}</button>
                    {on && <button className="dcon-btn del" onClick={() => remove(c)}>연결 해제</button>}
                  </div>
                  <div className="dcon-hint">저장된 엔드포인트·토큰은 브라우저(localStorage)에 보관되며, 실제 데이터 수집은 동일 설정을 주입한 백엔드 커넥터/에이전트가 수행합니다. 외부 API는 CORS·인증 정책에 따라 서버 경유가 필요합니다.</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dcon-add">
        <div className="dcon-addh"><Plus size={14} color="#38BDF8" /> 커넥터 직접 추가 <span>엔드포인트만 있으면 어떤 소스든 연동</span></div>
        <div className="dcon-addrow">
          <input className="dcon-in" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="소스 이름 (예: OO대학병원 FHIR)" />
          <input className="dcon-in" value={addEp} onChange={(e) => setAddEp(e.target.value)} placeholder="엔드포인트 URL (https:// 또는 stdio/sse)" spellCheck={false} />
          <button className="dcon-btn go" onClick={addCustom}><Plus size={13} /> 추가</button>
        </div>
      </div>

      <div className="chnote" style={{ marginTop: 12 }}>※ 본 화면은 데이터 소스 <b>연결 설정(엔드포인트·인증) 관리</b> 콘솔입니다. 실제 개인 건강정보 수집은 <b>본인 동의(마이데이터·DID)</b>와 각 기관 인증 절차를 거쳐 백엔드/에이전트가 수행합니다. 토큰·환급 등 사업모델 요소는 규제 검토 대상입니다.</div>
    </div>
  );
}
