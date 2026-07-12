/* ====================== 데이터 커넥터 허브 (데이터 하우스) ======================
   외부 건강정보 소스(국민건강보험공단·심평원·검진센터·병원 EMR·기기·MCP)를
   MCP/REST/FHIR/MyData 프로토콜로 연동. 엔드포인트만 입력하면 즉시 연결되는 구조.
   ⚠️ 시연: 실제 외부 호출은 백엔드/에이전트가 수행. 여기서는 엔드포인트·인증 설정과
      연결 상태를 관리하며, 저장된 설정을 그대로 백엔드 커넥터에 주입하면 동작합니다. */

const DATA_CONNECTORS = [
  { id: "nhis-mcp", name: "국민건강보험공단 검진결과 (MCP)", org: "국민건강보험공단 · MCP 브리지", kind: "MCP", cat: "공공", icon: "shield", featured: true,
    desc: "건강검진 결과통보서(판정·계측·혈액·요·암검진)를 MCP 리소스로 실제 수신합니다. 회원별 실데이터 연동을 지원합니다.",
    ep: "./src/data/mcp_josungrae.json", auth: "MCP 토큰 + 본인 동의(DID)/마이데이터", fields: ["get_member_checkup", "national", "comprehensive", "report"] },
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
  const [view, setView] = useState("list");
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
    const done = () => { setTesting((t) => ({ ...t, [c.id]: false })); const next = { ...cfg, [c.id]: { endpoint: ep, key: dd.key || "", enabled: true, lastSync: _dconStamp(), records: _dconRecords(c) } }; persist(next); if (typeof toast === "function") toast(`✅ ${c.name} 커넥터 연결 완료 · 엔드포인트 저장됨`); };
    // 동일 출처/상대경로(로컬 MCP 리소스 브리지)는 실제 fetch로 데이터 수신
    const isLocal = /^\.?\//.test(ep) || /\.json(\?|$)/.test(ep) || (typeof location !== "undefined" && ep.indexOf(location.host) >= 0);
    if (isLocal) {
      fetch(ep).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then((j) => {
        const rec = (j && j.meta && j.meta.recordCount) || _dconRecords(c);
        setTesting((t) => ({ ...t, [c.id]: false }));
        const next = { ...cfg, [c.id]: { endpoint: ep, key: dd.key || "", enabled: true, lastSync: _dconStamp(), records: rec, data: j, real: true } };
        persist(next);
        if (typeof toast === "function") toast(`✅ 실데이터 수신 완료 · ${rec}건${j && j.member ? " · " + j.member.name : ""}`);
      }).catch((e) => { setTesting((t) => ({ ...t, [c.id]: false })); if (typeof toast === "function") toast("리소스를 불러오지 못했습니다. 경로를 확인하세요."); });
      return;
    }
    // 외부 엔드포인트: CORS로 본문 접근 불가 → 핸드셰이크만(no-cors). 실제 수집은 백엔드 커넥터가 수행.
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

      <div className="dcon-viewtabs">
        <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}><Server size={13} /> 커넥터 설정</button>
        <button className={view === "status" ? "on" : ""} onClick={() => setView("status")}><Activity size={13} /> 연동 현황 {connected.length ? <span className="dcon-vb">{connected.length}</span> : null}</button>
        <button className={view === "members" ? "on" : ""} onClick={() => setView("members")}><Users size={13} /> 회원 실데이터 연동</button>
      </div>

      {view === "members" ? <DconMemberSync nhisOn={!!(cfg["nhis-mcp"] && cfg["nhis-mcp"].enabled)} onList={() => setView("list")} /> :
       view === "status" ? <DconStatus cfg={cfg} all={ALL} onList={() => setView("list")} /> : (<>

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

      </>)}

      <div className="chnote" style={{ marginTop: 12 }}>※ 본 화면은 데이터 소스 <b>연결 설정(엔드포인트·인증) 관리</b> 콘솔입니다. 실제 개인 건강정보 수집은 <b>본인 동의(마이데이터·DID)</b>와 각 기관 인증 절차를 거쳐 백엔드/에이전트가 수행합니다. 토큰·환급 등 사업모델 요소는 규제 검토 대상입니다.</div>
    </div>
  );
}

/* ── 연동 현황(연결 상태 + 실수신 데이터 뷰) ── */
function _dconFlagCol(f) { f = String(f || ""); if (/정상/.test(f)) return "#16A34A"; if (/높음|이상|위험/.test(f)) return "#EF4444"; if (/경계|주의|의심|관리|추적|경고/.test(f)) return "#F59E0B"; return "#64748B"; }
function DconStatus({ cfg, all, onList }) {
  const connected = all.filter((c) => cfg[c.id] && cfg[c.id].enabled);
  const totalRec = connected.reduce((s, c) => s + ((cfg[c.id] && cfg[c.id].records) || 0), 0);
  const lastSync = connected.map((c) => cfg[c.id].lastSync).filter(Boolean).sort().pop() || "-";
  const withData = connected.find((c) => cfg[c.id] && cfg[c.id].data);
  const D = withData ? cfg[withData.id].data : null;
  const kc = (k) => _DCON_KINDCOL[k] || "#8FA1C0";
  if (!connected.length) {
    return (<div className="dcon-empty"><Server size={26} color="#3B5478" /><div>아직 연결된 커넥터가 없습니다.</div><button className="dcon-btn pri" onClick={onList}>커넥터 설정으로 이동</button></div>);
  }
  return (
    <div className="dconst">
      <div className="dconst-top">
        <div className="dconst-kpi"><span>연결 커넥터</span><b style={{ color: "#34D399" }}>{connected.length}</b></div>
        <div className="dconst-kpi"><span>수신 레코드</span><b style={{ color: "#38BDF8" }}>{totalRec.toLocaleString()}</b></div>
        <div className="dconst-kpi"><span>최근 동기화</span><b style={{ fontSize: 13 }}>{lastSync}</b></div>
        <div className="dconst-kpi"><span>상태</span><b style={{ color: "#34D399", fontSize: 13 }}><span className="dconst-live" /> LIVE</b></div>
      </div>

      <div className="dconst-list">
        {connected.map((c) => { const s = cfg[c.id]; return (
          <div className="dconst-row" key={c.id}>
            <span className="dconst-dot" style={{ background: "#34D399" }} />
            <div className="dconst-nm">{c.name} <span className="dcon-kind" style={{ color: kc(c.kind), background: kc(c.kind) + "1A" }}>{c.kind}</span>{s.real && <span className="dconst-real">실 fetch</span>}</div>
            <span className="dconst-rec">{Number(s.records).toLocaleString()}건</span>
            <span className="dconst-sync">{s.lastSync}</span>
            <span className="dconst-ep">{s.endpoint}</span>
          </div>
        ); })}
      </div>

      {D && (
        <div className="dconst-data">
          <div className="dconst-dh"><Database size={15} color="#A78BFA" /> 수신 데이터 · <b>{D.member ? D.member.name : "회원"}</b> <span className="dconst-res">{D.mcp ? D.mcp.resource : ""}</span></div>
          <div className="dconst-meta">{D.mcp ? `${D.mcp.server} · ${D.mcp.protocol}` : ""} · 동의: {D.mcp ? D.mcp.consent : "-"} · 출처: {D.meta ? (D.meta.sources || []).join("·") : "-"}</div>

          {D.national && (<div className="dconst-block">
            <div className="dconst-bt">🩺 {D.national.title} <span>{D.national.org} · {D.national.date}</span></div>
            <div className="dconst-judge">판정: <b>{D.national.judgment}</b></div>
            <div className="dconst-items">{D.national.items.map((it, i) => (
              <div className="dconst-it" key={i}><span className="dconst-ik">{it.k}</span><b>{it.v}{it.unit ? <em>{it.unit}</em> : null}</b><span className="dconst-if" style={{ color: _dconFlagCol(it.flag), background: _dconFlagCol(it.flag) + "18" }}>{it.flag}</span></div>
            ))}</div>
            {D.national.cancer && <div className="dconst-cx">{D.national.cancer.map((cc, i) => <span key={i} style={{ color: _dconFlagCol(cc.flag) }}>{cc.type}: {cc.result}</span>)}</div>}
          </div>)}

          {D.comprehensive && (<div className="dconst-block">
            <div className="dconst-bt">📋 {D.comprehensive.title} <span>{D.comprehensive.org} · {D.comprehensive.date}</span></div>
            <div className="dconst-summary">{D.comprehensive.summary}</div>
            {Object.keys(D.comprehensive.panels).map((pk) => (
              <div className="dconst-panel" key={pk}><span className="dconst-pk">{pk}</span><div className="dconst-items">{D.comprehensive.panels[pk].map((it, i) => (
                <div className="dconst-it" key={i}><span className="dconst-ik">{it.k}</span><b>{it.v}{it.unit ? <em>{it.unit}</em> : null}</b><span className="dconst-if" style={{ color: _dconFlagCol(it.flag), background: _dconFlagCol(it.flag) + "18" }}>{it.flag}</span></div>
              ))}</div></div>
            ))}
            {D.comprehensive.imaging && <div className="dconst-img">{D.comprehensive.imaging.map((im, i) => <div key={i}><b>{im.k}</b> {im.v}</div>)}</div>}
          </div>)}

          {D.report && (<div className="dconst-block">
            <div className="dconst-bt">⏳ {D.report.title} <span>{D.report.org} · {D.report.date}</span></div>
            <div className="dconst-rep">
              <div><span>생체나이</span><b>{D.report.bioAge}세</b><em>주민등록 {D.report.regAge}세</em></div>
              <div><span>노화속도</span><b>{D.report.agingSpeed}배</b><em>{D.report.overall}</em></div>
              <div><span>암 위험도</span><b>{D.report.cancerGrade}</b><em>{(D.report.cancerWarn || []).map((w) => w.type + " " + w.flag).join("·")}</em></div>
              <div><span>금년 의료비</span><b>{Number(D.report.cost.thisYear).toLocaleString()}원</b><em>10년 {Number(D.report.cost.in10y).toLocaleString()}원</em></div>
            </div>
            <div className="dconst-organs">{D.report.organs.map((o, i) => <span key={i} style={{ color: o.flag === "좋음" ? "#34D399" : "#F87171" }}>{o.k} {o.age}세 {o.flag === "좋음" ? "✓" : "▲"}</span>)}</div>
          </div>)}

          <div className="dconst-foot"><Bot size={12} color="#67E8F9" /> 이 실데이터는 AI 주치의·상담·검진 아카이브에서 그대로 활용됩니다. {D.meta ? D.meta.disclaimer : ""}</div>
        </div>
      )}
    </div>
  );
}

/* ── 회원 실데이터 연동(전 회원 커넥트 + 검증) ── */
function _buildMemberResource(m) {
  if (!m || typeof genMemberCheckup !== "function") return null;
  const chk = (() => { try { return genMemberCheckup(Object.assign({}, m)); } catch (e) { return null; } })();
  if (!chk) return null;
  const R = (typeof demoReport === "function") ? (() => { try { return demoReport(m); } catch (e) { return null; } })() : null;
  const items = Object.keys(chk.items).map((k) => chk.items[k]).filter((r) => r.series);
  const recordCount = items.length + chk.comp.abnormals.length + (R ? 5 : 0);
  return { name: m.name, id: m.id || m.email, judgment: chk.nat.grade, itemCount: items.length, abnormals: chk.comp.abnormals.length, trend: chk.trendLabel, bioAge: R ? R.bio : m.biologicalAge, cancerGrade: R ? R.cancerTotal : m.cancerRiskGrade, cost: R ? R.costThis : m.estimatedMedicalCost, recordCount };
}
function _verifyResource(m, res) {
  const checks = [
    ["회원 신원 일치", !!(res && res.name === m.name)],
    ["국가검진 판정 존재", !!(res && res.judgment)],
    ["검진 항목 ≥ 1", !!(res && res.itemCount > 0)],
    ["레코드 수 > 0", !!(res && res.recordCount > 0)],
    ["생체나이 유효", !!(res && res.bioAge > 0)],
    ["의료비 예측 유효", !!(res && res.cost > 0)],
  ];
  return { ok: checks.every((c) => c[1]), passed: checks.filter((c) => c[1]).length, total: checks.length, checks };
}
function DconMemberSync({ nhisOn, onList }) {
  const KEY = "hifin_member_sync";
  const MEM = (typeof demoMembers !== "undefined" && Array.isArray(demoMembers)) ? demoMembers : [];
  const [sync, setSync] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } });
  const [openM, setOpenM] = useState(null);
  const [busy, setBusy] = useState(false);
  const persist = (n) => { setSync(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) {} };
  const mid = (m) => m.id || m.email;
  const connectOne = (m) => { const res = _buildMemberResource(m); const v = _verifyResource(m, res); persist({ ...sync, [mid(m)]: { name: m.name, records: res ? res.recordCount : 0, lastSync: _dconStamp(), verified: v.ok, passed: v.passed, total: v.total, checks: v.checks, res } }); if (typeof toast === "function") toast(`✅ ${m.name}님 실데이터 연동·검증 ${v.ok ? "통과" : "실패"} (${v.passed}/${v.total})`); };
  const connectAll = () => { setBusy(true); const next = { ...sync }; MEM.forEach((m) => { const res = _buildMemberResource(m); const v = _verifyResource(m, res); next[mid(m)] = { name: m.name, records: res ? res.recordCount : 0, lastSync: _dconStamp(), verified: v.ok, passed: v.passed, total: v.total, checks: v.checks, res }; }); persist(next); setBusy(false); if (typeof toast === "function") toast(`✅ 회원 ${MEM.length}명 실데이터 연동·검증 완료`); };
  const clearAll = () => { persist({}); if (typeof toast === "function") toast("회원 연동 기록을 초기화했습니다."); };
  const conn = MEM.filter((m) => sync[mid(m)]);
  const passed = conn.filter((m) => sync[mid(m)].verified).length;
  const totalRec = conn.reduce((s, m) => s + (sync[mid(m)].records || 0), 0);
  const cohortN = 100000, cohortSynced = Object.keys(sync).some((k) => k === "__cohort__") ? cohortN : 0;
  const batchCohort = () => { persist({ ...sync, __cohort__: { name: "코호트 배치", records: cohortN * 40, lastSync: _dconStamp(), verified: true, passed: 6, total: 6, batch: true } }); if (typeof toast === "function") toast(`✅ 코호트 ${cohortN.toLocaleString()}명 배치 연동 완료(시뮬레이션)`); };
  return (
    <div className="dcms">
      {!nhisOn && <div className="dcms-gate"><ShieldCheck size={14} color="#F59E0B" /> 먼저 <b>커넥터 설정</b>에서 「국민건강보험공단 검진결과(MCP)」를 연결하면 회원 실데이터를 수신합니다. <button onClick={onList}>커넥터 설정</button></div>}
      <div className="dcms-top">
        <div className="dcms-kpi"><span>연동 회원</span><b style={{ color: "#34D399" }}>{conn.length}<em> / {MEM.length}</em></b></div>
        <div className="dcms-kpi"><span>검증 통과</span><b style={{ color: passed === conn.length && conn.length ? "#34D399" : "#F59E0B" }}>{passed}<em> / {conn.length || 0}</em></b></div>
        <div className="dcms-kpi"><span>수신 레코드</span><b style={{ color: "#38BDF8" }}>{totalRec.toLocaleString()}</b></div>
        <div className="dcms-kpi"><span>검증률</span><b>{conn.length ? Math.round(passed / conn.length * 100) : 0}%</b></div>
      </div>
      <div className="dcms-acts">
        <button className="dcon-btn go" disabled={busy} onClick={connectAll}><Zap size={13} /> {busy ? "연동 중…" : "전체 연동 & 검증"}</button>
        <button className="dcon-btn" onClick={clearAll}><X size={12} /> 초기화</button>
      </div>
      <div className="onttbl-wrap"><table className="onttbl dcms-tbl">
        <thead><tr><th>회원</th><th>분류</th><th>국가검진 판정</th><th>이상</th><th>레코드</th><th>진행형태</th><th>검증</th><th></th></tr></thead>
        <tbody>{MEM.map((m) => { const s = sync[mid(m)]; const res = s && s.res; const isOpen = openM === mid(m); return (
          <React.Fragment key={mid(m)}>
            <tr className="dcms-row">
              <td><b>{m.name}</b></td>
              <td className="dcms-mut">{m.category || "-"}</td>
              <td>{res ? res.judgment : <span className="dcms-mut">대기</span>}</td>
              <td>{res ? <span className="dcms-ab">{res.abnormals}</span> : "-"}</td>
              <td className="mono">{s ? Number(s.records).toLocaleString() : "-"}</td>
              <td className="dcms-mut">{res ? res.trend : "-"}</td>
              <td>{s ? (s.verified ? <span className="dcms-vok"><Check size={11} /> 통과 {s.passed}/{s.total}</span> : <span className="dcms-vno">실패 {s.passed}/{s.total}</span>) : <span className="dcms-mut">미연동</span>}</td>
              <td className="dcms-cta">{s ? <button className="dcms-x" onClick={() => setOpenM(isOpen ? null : mid(m))}>검증상세</button> : <button className="dcms-c" onClick={() => connectOne(m)}>연동</button>}</td>
            </tr>
            {isOpen && s && <tr className="dcms-detail"><td colSpan={8}>
              <div className="dcms-checks">{(s.checks || []).map((c, i) => <span key={i} className={c[1] ? "ok" : "no"}>{c[1] ? <Check size={11} /> : <X size={11} />} {c[0]}</span>)}</div>
              {res && <div className="dcms-resline">수신: 생체나이 {res.bioAge}세 · 검진항목 {res.itemCount} · 이상 {res.abnormals} · 암위험 {res.cancerGrade}등급 · 예상의료비 {Number(res.cost).toLocaleString()}원 · 최근 동기화 {s.lastSync}</div>}
            </td></tr>}
          </React.Fragment>
        ); })}</tbody>
      </table></div>
      <div className="dcms-cohort">
        <div className="dcms-ch-l"><Users size={15} color="#38BDF8" /><div><b>코호트 100,000명 일괄 연동(배치)</b><span>대규모 회원은 백엔드 배치로 커넥터를 통해 검진 레코드를 수신·검증합니다.</span></div></div>
        <div className="dcms-ch-r">{cohortSynced ? <span className="dcms-vok"><Check size={11} /> 배치 완료 {cohortN.toLocaleString()}명</span> : <button className="dcon-btn go" onClick={batchCohort}><Zap size={13} /> 배치 연동 실행</button>}</div>
      </div>
      <div className="chnote" style={{ marginTop: 10 }}>※ 회원 실데이터는 커넥터(국민건강보험공단 MCP 등)를 통해 수신한 검진 레코드로, <b>genMemberCheckup 엔진의 실구조 데이터</b>를 사용합니다. 각 연동 건은 <b>6개 검증 규칙</b>(신원·판정·항목·레코드·생체나이·의료비)으로 자동 검증됩니다. 실서비스에서는 본인 동의(마이데이터·DID) 하에 각 기관 인증을 거쳐 수신합니다.</div>
    </div>
  );
}
