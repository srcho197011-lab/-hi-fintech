const CH_REC = [
  ["복부 초음파 (간·췌장)", "간·췌장 생체나이 높음"],
  ["당화혈색소·공복혈당", "당뇨 위험 동년배 ↑"],
  ["위·대장 내시경", "50대 권장 검진"],
  ["경동맥 초음파", "심뇌혈관 관리"],
  ["갑상선 초음파", "암 정기 관찰"],
];
const REGIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const NAME_TPL = [(d) => `메디체크 ${d}`, (d) => `${d} 종합건강검진센터`, (d) => `${d} 미래검진의원`, (d) => `${d} 바른건강검진센터`, (d) => `${d} 닥터스헬스 검진센터`, (d) => `하나로의료재단 ${d}`];
const TAGPOOL = [["종합검진", "위내시경", "복부초음파"], ["일반검진", "대장내시경", "갑상선초음파"], ["프리미엄종합", "뇌MRI", "심장CT"], ["종합검진", "수면내시경", "초음파"], ["일반검진", "암검진", "심전도"]];
const HOURS = ["평일 08:00–17:00", "평일 08:30–16:30", "평일 07:30–16:00", "평일 08:00–16:30"];
const REGION_CENTROID = { 서울: [37.5665, 126.978], 부산: [35.1796, 129.0756], 대구: [35.8714, 128.6014], 인천: [37.4563, 126.7052], 광주: [35.1595, 126.8526], 대전: [36.3504, 127.3845], 울산: [35.5384, 129.3114], 세종: [36.4801, 127.289], 경기: [37.2636, 127.0286], 강원: [37.8813, 127.7298], 충북: [36.6424, 127.489], 충남: [36.8151, 127.1139], 전북: [35.8242, 127.148], 전남: [34.9506, 127.4872], 경북: [36.5684, 128.7294], 경남: [35.228, 128.6811], 제주: [33.4996, 126.5312] };
const ANCHOR_COORDS = { "KMI 한국의학연구소 광화문센터": [37.5697, 126.9763], "세브란스 체크업 (신촌)": [37.5623, 126.9409], "삼성서울병원 건강의학센터": [37.4887, 127.086], "서울아산병원 건강증진센터": [37.526, 127.1086], "하나로의료재단 종로": [37.5707, 126.9814], "분당서울대병원 건강증진센터": [37.352, 127.1235], "한국건강관리협회 인천 (메디체크)": [37.4499, 126.6985], "가천대 길병원 건강증진센터": [37.4525, 126.7084], "가톨릭관동대 국제성모병원 검진센터": [37.5423, 126.6836] };
function mkCenter(id, r, name, tags, area, seed, pick, tier) {
  let rating = 4.3 + ((seed * 7) % 6) / 10; if (rating > 4.9) rating = 4.9;
  const orig = (tier >= 3 ? 1200000 : tier === 2 ? 780000 : 540000) + (seed % 5) * 20000;
  let price = Math.round(orig * (0.62 + (seed % 6) * 0.02) / 10000) * 10000;
  if (price >= orig) price = Math.round(orig * 0.68 / 10000) * 10000;
  const ac = ANCHOR_COORDS[name], base = REGION_CENTROID[r] || [36.5, 127.8];
  const lat = ac ? ac[0] : +(base[0] + (((seed * 53) % 100) - 50) / 1500).toFixed(5);
  const lng = ac ? ac[1] : +(base[1] + (((seed * 37) % 100) - 50) / 1500).toFixed(5);
  return { id, r, name, area, hours: HOURS[seed % 4], rating: +rating.toFixed(1), rev: 180 + (seed * 137) % 3200, tags, orig, price, pick: !!pick, lat, lng };
}
function genCenters() {
  const out = []; let id = 1;
  const anchors = [
    ["서울", "KMI 한국의학연구소 광화문센터", ["프리미엄종합", "뇌MRI", "심장CT"], "광화문역 도보 3분", 3],
    ["서울", "세브란스 체크업 (신촌)", ["프리미엄종합", "뇌·심혈관", "수면내시경"], "신촌역 도보 6분", 3],
    ["서울", "삼성서울병원 건강의학센터", ["프리미엄종합", "암정밀", "PET-CT"], "일원역 도보 5분", 3],
    ["서울", "서울아산병원 건강증진센터", ["종합검진", "심장", "소화기"], "풍납토성역 도보 8분", 3],
    ["서울", "하나로의료재단 종로", ["종합검진", "수면내시경", "복부초음파"], "종각역 도보 4분", 2],
    ["경기", "분당서울대병원 건강증진센터", ["프리미엄종합", "뇌MRI", "심장CT"], "정자역 도보 10분", 3],
    ["경기", "아주대병원 건강검진센터 (수원)", ["종합검진", "수면내시경", "초음파"], "아주대 인근", 2],
    ["인천", "한국건강관리협회 인천 (메디체크)", ["위내시경", "대장내시경", "복부초음파"], "예술회관역 9번 도보 2분", 2],
    ["인천", "가천대 길병원 건강증진센터", ["종합검진", "심장CT", "암정밀"], "인천터미널역 도보 6분", 2],
    ["인천", "가톨릭관동대 국제성모병원 검진센터", ["종합검진", "암검진", "수면내시경"], "검암역 도보 7분", 2],
    ["부산", "KMI 한국의학연구소 부산센터", ["프리미엄종합", "뇌MRI", "심장CT"], "서면역 도보 4분", 2],
    ["부산", "부산대병원 건강증진센터", ["종합검진", "암정밀", "소화기"], "양정역 도보 8분", 2],
    ["대구", "경북대병원 건강검진센터", ["종합검진", "암정밀", "심장"], "경대병원역 도보 3분", 2],
    ["대전", "충남대병원 건강증진센터", ["종합검진", "암정밀", "소화기"], "오룡역 도보 7분", 2],
    ["광주", "전남대병원 건강검진센터", ["종합검진", "암정밀", "심장"], "남광주역 도보 8분", 2],
    ["울산", "울산대병원 건강증진센터", ["종합검진", "암정밀", "심장"], "태화강역 인근", 2],
    ["강원", "강원대병원 건강검진센터 (춘천)", ["종합검진", "내시경", "초음파"], "남춘천역 도보 9분", 2],
    ["전북", "전북대병원 건강증진센터 (전주)", ["종합검진", "암정밀", "심장"], "전주 덕진동", 2],
    ["경남", "경상국립대병원 건강검진센터 (진주)", ["종합검진", "암정밀", "심장"], "진주 칠암동", 2],
    ["제주", "제주대병원 건강증진센터", ["종합검진", "내시경", "초음파"], "제주시 아라일동", 2],
  ];
  anchors.forEach((a, i) => out.push(mkCenter(id++, a[0], a[1], a[2], a[3], i + 1, true, a[4])));
  Object.keys(DISTRICTS).forEach((region) => {
    DISTRICTS[region].forEach((d, di) => {
      for (let j = 0; j < 2; j++) {
        const seed = di * 2 + j + 3;
        out.push(mkCenter(id++, region, NAME_TPL[(di + j) % NAME_TPL.length](d), TAGPOOL[(di + j) % TAGPOOL.length], `${d} 도보 ${3 + ((di + j) % 9)}분`, seed, (di * 2 + j) % 11 === 0, (di + j) % 5 === 0 ? 2 : 1));
      }
    });
  });
  return out;
}
const CENTERS = genCenters();

const won = (n) => n.toLocaleString("ko-KR") + "원";

const REGION_COUNTS = (() => { const m = {}; CENTERS.forEach((c) => { m[c.r] = (m[c.r] || 0) + 1; }); return m; })();
const KMAP = { 서울: [152, 110], 인천: [115, 128], 경기: [190, 158], 강원: [256, 100], 충북: [200, 196], 세종: [158, 212], 대전: [170, 234], 충남: [116, 214], 전북: [148, 280], 광주: [116, 326], 전남: [132, 352], 경북: [256, 200], 대구: [250, 254], 경남: [214, 318], 울산: [292, 282], 부산: [278, 322], 제주: [128, 444] };
function KoreaMap({ selected, onPick }) {
  const max = Math.max.apply(null, Object.values(REGION_COUNTS));
  const color = (n) => n >= 40 ? "#1E40C8" : n >= 25 ? "#2F5BEA" : n >= 15 ? "#5B6EF0" : n >= 10 ? "#7C8AF0" : "#A9B4F2";
  return (
    <svg viewBox="0 0 340 470" width="100%" style={{ maxWidth: 360, display: "block", margin: "4px auto 0" }}>
      <path d="M150,72 C122,74 112,104 116,140 C104,158 104,196 116,226 C108,256 116,300 134,338 C146,366 168,372 184,352 C206,332 212,312 232,300 C266,294 298,278 296,250 C298,222 276,206 266,188 C276,156 268,112 244,96 C220,80 196,72 172,70 Z" fill="#EEF3FD" stroke="#CFE0FF" strokeWidth="1.5" />
      <ellipse cx="128" cy="444" rx="30" ry="16" fill="#EEF3FD" stroke="#CFE0FF" strokeWidth="1.5" />
      {Object.keys(KMAP).map((r) => {
        const x = KMAP[r][0], y = KMAP[r][1], n = REGION_COUNTS[r] || 0, rad = 10 + (n / max) * 15, on = selected === r;
        return (
          <g key={r} style={{ cursor: "pointer" }} onClick={() => onPick(r)}>
            {on && <circle cx={x} cy={y} r={rad + 5} fill="none" stroke="#1E40C8" strokeWidth="2" />}
            <circle cx={x} cy={y} r={rad} fill={color(n)} opacity={on ? 1 : 0.9} />
            <text x={x} y={y - rad - 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1B2A52">{r}</text>
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{n}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CheckupSection() {
  const [cat, setCat] = useState("kmi");
  const cats = [["kmi", "KMI 대형검진", Building2], ["brand", "브랜드 검진기관", BadgeCheck], ["comp", "종합검진", ClipboardList], ["nat", "국가검진", ShieldCheck], ["biz", "기업검진", Users], ["rec", "AI 맞춤추천", Sparkles]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="checkup" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강검진</div><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>KMI 대형검진 · 브랜드 검진기관 · 종합·국가·기업검진 · AI 맞춤추천 · 전국 검진센터 비교·예약</div></div></div>
      <AiLinkBanner target="checkup" />
      <div className="chtabs">
        {cats.map(([k, t, Ic]) => <div key={k} className={`chtab ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}><Ic size={15} /> {t}</div>)}
        <div className={`reslink ${cat === "result" ? "on" : ""}`} onClick={() => setCat("result")}><FileText size={14} /> 검진결과·사후관리</div>
      </div>
      {cat === "kmi" && <BrandDirectory kmiOnly />}
      {cat === "brand" && <BrandDirectory />}
      {cat === "comp" && <CenterDirectory mode="comp" />}
      {cat === "nat" && <NationalCheckup />}
      {cat === "biz" && <BizCheckup />}
      {cat === "rec" && <AICheckupRec onGoCenters={() => setCat("comp")} />}
      {cat === "result" && <CheckupResults />}
    </div>
  );
}
/* 브랜드 검진기관 디렉토리(큐레이션 51곳) — KMI 대형검진센터 별도 카테고리 */
function BrandDirectory({ kmiOnly }) {
  const [brand, setBrand] = useState("전체");
  const [sido, setSido] = useState("전체");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(kmiOnly ? 12 : 10);
  const ALL = (typeof CHECKUP_INST !== "undefined") ? CHECKUP_INST : [];
  const META = (typeof CHECKUP_BRAND_META !== "undefined") ? CHECKUP_BRAND_META : {};
  const ssido = (s) => (typeof tmSidoShort === "function" ? tmSidoShort(s) : s);
  const base = ALL.filter((c) => kmiOnly ? c.b === "KMI한국의학연구소" : c.b !== "KMI한국의학연구소");
  const brands = kmiOnly ? [] : ["전체", ...Array.from(new Set(base.map((c) => c.b)))];
  const sidos = ["전체", ...Array.from(new Set(base.map((c) => c.sd)))];
  let list = base.filter((c) => (kmiOnly || brand === "전체" || c.b === brand) && (sido === "전체" || c.sd === sido) && (!q || (c.n + c.sd + c.sg + c.ad).includes(q)));
  const view = list.slice(0, shown);
  const card = (c, i) => { const m = META[c.b] || {}; return (
    <div className="center" key={i}>
      <div className="cimg" style={{ background: (m.col || "#2563EB") + "14" }}><Building2 size={40} color={m.col || "#2563EB"} /></div>
      <div className="cmain">
        <div className="cname">{c.b === "KMI한국의학연구소" ? `KMI ${c.n}` : c.n} <span className="cbadge" style={{ color: m.col, background: (m.col || "#2563EB") + "1A" }}>{m.short}</span></div>
        <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{ssido(c.sd)}</span> · <MapPin size={12} />{c.sg} · {c.t}{c.p !== "-" && <> · <Phone size={12} />{c.p}</>}</div>
        <div className="ctags"><span>{c.t}</span><span>{m.tier || "검진기관"}</span></div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{c.ad}</div>
      </div>
      <div className="cright">
        <span className="cbadge"><ShieldCheck size={10} /> 무료 검진보험</span>
        <div className="obtns"><button onClick={() => openConsult("건강검진 상담 — " + c.n)}>상담</button><button className="book" onClick={() => { if (typeof toast === "function") toast(`✅ (데모) ${c.b === "KMI한국의학연구소" ? "KMI " + c.n : c.n} 검진 예약이 접수되었습니다.`); }}>예약</button></div>
      </div>
    </div>
  ); };
  return (
    <>
      {kmiOnly && (
        <div className="kmibanner">
          <div className="kmibt"><Building2 size={18} /> KMI한국의학연구소 — 전국 대형 종합검진센터</div>
          <div className="kmibs">{CHECKUP_BRAND_META["KMI한국의학연구소"].tag} · 전국 <b>{base.length}</b>개 센터 · 대표 <b>1551-7070</b></div>
        </div>
      )}
      <div className="benefit">
        <span><Art name="badge" size={16} /> 무료 검진보험 자동가입</span>
        <span><Art name="sparkle" size={16} /> AI 맞춤 검사 추천</span>
        <span><Art name="badge" size={16} /> NFT 예약증 발행</span>
        <span><Art name="check" size={16} /> 검진결과 카톡 수신</span>
      </div>
      {!kmiOnly && (
        <><div className="bklbl" style={{ margin: "0 0 8px" }}>브랜드</div>
        <div className="regions">{brands.map((b) => <div key={b} className={`fsel ${brand === b ? "on" : ""}`} onClick={() => { setBrand(b); setShown(10); }}>{b === "전체" ? "전체" : (META[b]?.short || b)}</div>)}</div></>
      )}
      <div className="bklbl" style={{ margin: "10px 0 8px" }}>지역(시·도)</div>
      <div className="regions">{sidos.map((s) => <div key={s} className={`fsel ${sido === s ? "on" : ""}`} onClick={() => { setSido(s); setShown(kmiOnly ? 12 : 10); }}>{s === "전체" ? "전체" : ssido(s)}</div>)}</div>
      <div className="filterbar"><div className="fsearch"><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); setShown(kmiOnly ? 12 : 10); }} placeholder="기관명·지역·주소 검색" /></div></div>
      <div className="chcount">{kmiOnly ? "KMI 검진센터" : (brand === "전체" ? "브랜드 검진기관" : (META[brand]?.short || brand))} <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳 · 전체 큐레이션 {ALL.length}곳</div>
      {view.map((c, i) => card(c, i))}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 10)}>더 보기 ({list.length - shown}곳 더)</button>}
      <div className="chnote">※ 출처: 국민건강보험공단 병의원·검진기관 찾기 / 기관 공식 사이트(수집일 2026-06-27). "공식 사이트 확인" 항목은 정확한 주소를 기관 홈페이지에서 최종 확인 권장. 본 비교 정보는 이용자의 합리적 선택을 돕기 위한 것으로 의료법(의료광고 심의·환자 유인·알선 금지)을 준수합니다.</div>
    </>
  );
}

function CenterDirectory({ mode }) {
  const [region, setRegion] = useState("전체");
  const [sort, setSort] = useState("추천순");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(12);
  const [sel, setSel] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [detail, setDetail] = useState(null);
  const reset = () => setShown(12);
  const nat = mode === "nat";
  let list = CENTERS.filter((c) => (region === "전체" || c.r === region) && (!q || (c.name + c.r + c.area).includes(q)));
  if (sort === "가격낮은순") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "평점순") list = [...list].sort((a, b) => b.rating - a.rating);
  else list = [...list].sort((a, b) => (b.pick ? 1 : 0) - (a.pick ? 1 : 0));
  const view = list.slice(0, shown);
  return (
    <>
      <div className="benefit">
        {nat ? (<>
          <span><Art name="check" size={16} /> 공단검진 본인부담 0원</span>
          <span><Art name="badge" size={16} /> 무료 검진보험 자동가입</span>
          <span><Art name="doc" size={16} /> 공단검진+추가검사 결합</span>
          <span><Art name="badge" size={16} /> 결과 카톡 수신</span>
        </>) : (<>
          <span><Art name="percent" size={16} /> 검진센터 비교·최대 49% 우대가</span>
          <span><Art name="badge" size={16} /> 무료 검진보험 자동가입</span>
          <span><Art name="sparkle" size={16} /> AI 맞춤 검사 추천</span>
          <span><Art name="badge" size={16} /> NFT 예약증 발행</span>
        </>)}
      </div>
      <div className="mapcard">
        <div className="maphead" onClick={() => setShowMap((v) => !v)}>
          <div className="mt"><MapPin size={16} color="#2F5BEA" /> 전국 검진센터 분포 지도 ({CENTERS.length.toLocaleString()}곳)</div>
          <ChevronDown size={18} color="#9AA6BC" style={{ transform: showMap ? "rotate(180deg)" : "none", transition: ".2s" }} />
        </div>
        {showMap && (<>
          <KoreaMap selected={region} onPick={(r) => { setRegion(r); reset(); }} />
          <div className="maplegend"><span><i style={{ background: "#1E40C8" }} />40곳+</span><span><i style={{ background: "#2F5BEA" }} />25곳+</span><span><i style={{ background: "#5B6EF0" }} />15곳+</span><span><i style={{ background: "#7C8AF0" }} />10곳+</span><span><i style={{ background: "#A9B4F2" }} />~9곳</span></div>
          {region !== "전체" && <div className="mapsel">선택 지역: <b>{region}</b> · {(REGION_COUNTS[region] || 0).toLocaleString()}곳<button onClick={() => { setRegion("전체"); reset(); }}>전체 보기</button></div>}
        </>)}
      </div>
      <div className="bklbl" style={{ margin: "0 0 8px" }}>지역별 {nat ? "국가검진 지정 " : ""}검진센터</div>
      <div className="regions">{REGIONS.map((r) => <div key={r} className={`fsel ${region === r ? "on" : ""}`} onClick={() => { setRegion(r); reset(); }}>{r}</div>)}</div>
      <div className="filterbar">
        <div className="fsearch"><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="검진센터·지역·지하철역 검색" /></div>
        <div className="fsel" onClick={() => setSort(sort === "추천순" ? "가격낮은순" : sort === "가격낮은순" ? "평점순" : "추천순")}><Filter size={12} style={{ verticalAlign: "-2px" }} /> {sort}</div>
      </div>
      <div className="chcount">{region === "전체" ? "전국" : region} {nat ? "국가검진 지정 " : ""}검진센터 <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳 · 전국 {CENTERS.length.toLocaleString()}곳</div>
      {view.map((c) => (
        <div className="center" key={c.id}>
          <div className="cimg"><Art name="building" size={46} /></div>
          <div className="cmain" style={{ cursor: "pointer" }} onClick={() => setDetail(c)} title="병원 상세 보기">
            <div className="cname">{c.name}{nat ? <span className="cbadge"><Check size={10} /> 국가검진 지정</span> : c.pick && <span className="cbadge" style={{ color: "#7C3AED", background: "#F1ECFE" }}><Sparkles size={10} /> 추천</span>}</div>
            <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{c.r}</span> · <MapPin size={12} />{c.area} · <Clock size={12} />{c.hours} · <Star size={12} color="#F59E0B" />{c.rating} ({c.rev.toLocaleString()})</div>
            <div className="ctags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
          <div className="cright">
            {nat ? (<>
              <span className="cbadge"><Check size={10} /> 공단검진 무료</span>
              <div className="cprice"><div className="now" style={{ color: "var(--green)" }}>본인부담 0원</div><span style={{ fontSize: 11, color: "var(--soft)" }}>추가검사 별도</span></div>
            </>) : (<>
              <span className="cbadge"><ShieldCheck size={10} /> 무료 검진보험</span>
              <div className="cprice"><span className="orig">{won(c.orig)}</span><span className="disc">{Math.round((1 - c.price / c.orig) * 100)}%</span><div className="now">{won(c.price)}</div></div>
            </>)}
            <div className="obtns"><button onClick={() => openConsult("건강검진 예약")}>상담</button><button className="book" onClick={() => setSel(c)}>예약하기</button></div>
          </div>
        </div>
      ))}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 12)}>더 보기 ({(list.length - shown).toLocaleString()}곳 더)</button>}
      <div className="chnote">※ 표시된 가격·정보는 데모용 예시이며 실제 비용·운영정보는 검진센터·검진항목·옵션에 따라 다릅니다. 실데이터는 제휴 검진센터 DB 연동 시 반영됩니다. 의료기관 비교·가격 정보는 이용자의 합리적 선택을 돕기 위한 것으로, 특정 기관 직접 후기·의료광고는 의료법(의료광고 심의·환자 유인·알선 금지)을 준수합니다.</div>
      {sel && <BookingModal center={sel} mode={mode} onClose={() => setSel(null)} />}
      {detail && <CenterDetailModal center={detail} onClose={() => setDetail(null)} onBook={(c) => { setDetail(null); setSel(c); }} />}
    </>
  );
}

function AICheckupRec({ onGoCenters }) {
  const recs = [[Stethoscope, "복부 초음파 (간·췌장)", "간 54.4세·췌장 56.2세 — 생체나이 높음", "#7C3AED", "#F1ECFE"], [Activity, "당화혈색소·공복혈당", "당뇨병 위험 동년배보다 +6.2% 높음", "#F59E0B", "#FEF3E2"], [ClipboardList, "위·대장 내시경", "50대 권장 검진 주기 도래", "#2563EB", "#E8F1FE"], [Heart, "경동맥 초음파", "심뇌혈관 위험 관리", "#EF4444", "#FDECEC"], [ShieldCheck, "갑상선 초음파", "암 정기 관찰", "#16A34A", "#E7F8EE"]];
  return (<>
    <div className="airec">
      <div className="at"><Sparkles size={16} color="#7C3AED" /> 조성래님 맞춤 검사 추천</div>
      <div className="ap">프롬에이지 Premium 리포트(생체나이 52.5세 · 당뇨 위험 ↑ · 췌장암 경고)를 분석해 꼭 필요한 검사를 골라드려요.</div>
    </div>
    <div className="card">
      <div className="rct"><Stethoscope size={18} color="#7C3AED" /> 권장 검사 5</div>
      {recs.map(([Ic, t, d, col, bg]) => (
        <div className="adv" key={t}><span className="ic" style={{ background: bg }}><Ic size={18} color={col} /></span><div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div><button onClick={onGoCenters} style={{ alignSelf: "center", border: "1px solid var(--border)", background: "#fff", color: "var(--blue)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>센터 보기 ›</button></div>
      ))}
    </div>
    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div className="rct"><Sparkles size={18} color="#2F5BEA" /> 조성래님 맞춤 종합검진 패키지</div>
      <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>위 권장 검사를 묶은 맞춤 패키지예요. 전국 제휴 검진센터에서 합리적인 비용으로 예약할 수 있고, 예약 시 무료 검진보험이 자동 가입됩니다.</p>
      <button className="cbtn pri" onClick={onGoCenters}><ClipboardList size={15} /> 추천 센터에서 예약하기</button>
    </div>
  </>);
}

function CenterDetailModal({ center, onClose, onBook }) {
  const [tab, setTab] = useState("hospital");
  const wkrange = center.hours.replace("평일 ", "");
  const mapText = encodeURIComponent(`${center.name} ${center.r} ${center.area}`);
  const has = (k) => center.tags.some((t) => t.includes(k));
  const feats = [];
  if (has("내시경")) { feats.push("내시경 세부전문의가 내시경 직접 시행"); feats.push("용종 발견 시 당일 제거 가능"); }
  if (has("초음파")) feats.push("영상의학과 전문의가 직접 초음파 시행");
  if (has("MRI") || has("CT") || has("정밀") || has("PET")) feats.push("정밀 영상장비(CT·MRI) 보유");
  if (has("종합") || has("프리미엄")) feats.push("수검자별 맞춤 종합검진 설계");
  feats.push("검진 결과 카카오톡 알림 제공");
  const exams = [["신체계측·혈압", "키·몸무게·BMI·혈압 측정"], ["혈액검사", "간기능·혈당·지질·신장 기능"], ["소변검사", "요단백·요잠혈 등"], ["흉부 X-ray", "폐·심장 기본 영상"], ["심전도", "심장 리듬 확인"]];
  const tagExam = { "위내시경": "상부위장관(식도·위) 관찰", "대장내시경": "대장 용종·종양 관찰", "수면내시경": "수면 상태로 편안한 내시경", "복부초음파": "간·담낭·췌장·신장 확인", "갑상선초음파": "갑상선 결절 확인", "뇌MRI": "뇌혈관·뇌실질 정밀", "심장CT": "관상동맥 석회화·협착", "PET-CT": "전신 암 선별", "암검진": "주요 암 표지자·영상", "암정밀": "위·대장·간·췌장 정밀" };
  center.tags.forEach((t) => { if (tagExam[t]) exams.push([t, tagExam[t]]); });
  const others = [["국가 일반건강검진", "공단 지정 · 본인부담 0원"], ["프리미엄 종합검진", "주요 장기 정밀 패키지"], ["암 정밀검진", "위·대장·간·췌장 중심"]];
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk detailbk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt" style={{ fontSize: 15, lineHeight: 1.3 }}>{center.name}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="dtabs">
          <div className={`dtab ${tab === "exam" ? "on" : ""}`} onClick={() => setTab("exam")}>검사정보</div>
          <div className={`dtab ${tab === "hospital" ? "on" : ""}`} onClick={() => setTab("hospital")}>병원정보</div>
          <div className={`dtab ${tab === "other" ? "on" : ""}`} onClick={() => setTab("other")}>다른검진</div>
        </div>
        <div className="dbody">
          {tab === "hospital" && (<>
            <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.65, marginBottom: 14 }}>{center.name}은(는) 수많은 만성질환을 꾸준히 관리·치료하며, 여러분의 주치의로서 건강한 100세 인생을 함께 만들어가는 검진센터입니다. <b style={{ color: "#F59E0B" }}>★{center.rating}</b> ({center.rev.toLocaleString()})</p>
            <div className="dsec"><div className="dh">검진센터 특징</div>{feats.map((f, i) => <div className="feat" key={i}><span className="num">{i + 1}</span>{f}</div>)}</div>
            <div className="dsec"><div className="dh">진료시간</div>
              <table className="htbl"><thead><tr>{[["월", ""], ["화", ""], ["수", ""], ["목", ""], ["금", "blue"], ["토", "blue"], ["일", "sun"]].map(([d, c]) => <th key={d} className={c === "sun" ? "sun" : ""} style={c === "blue" ? { color: "#2563EB" } : {}}>{d}</th>)}</tr></thead>
                <tbody><tr>{["월", "화", "수", "목", "금"].map((d) => <td key={d}>{wkrange}</td>)}<td>08:30~13:30</td><td className="sun">휴진</td></tr></tbody></table>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>점심 13:00~14:00 · 일요일/공휴일 휴무</div>
            </div>
            <div className="dsec"><div className="dh">병원 위치</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}><MapPin size={13} color="#EF4444" style={{ verticalAlign: "-2px" }} /> {center.r} {center.area}</div>
              {center.lat && center.lng ? <MapView points={[{ name: center.name, addr: `${center.r} ${center.area}`, tag: "검진센터", lat: center.lat, lng: center.lng }]} accent="#2563EB" height={240} />
                : <div className="dmap"><div className="dmap-grid" /><span className="dmap-roadH" /><span className="dmap-roadV" /><span className="dmap-pin"><MapPin size={32} color="#EF4444" fill="#EF4444" /></span><span className="dmap-tag">{center.name}</span></div>}
            </div>
          </>)}
          {tab === "exam" && (<div className="dsec"><div className="dh">검사 항목</div>{exams.map(([n, d], i) => <div className="feat" key={i}><span className="num" style={{ background: "#EAF0FE", color: "#2563EB" }}>{i + 1}</span><div><b style={{ fontSize: 13 }}>{n}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{d}</div></div></div>)}</div>)}
          {tab === "other" && (<div className="dsec"><div className="dh">다른 검진 상품</div>{others.map(([n, d], i) => <div className="resitem" key={i} style={{ margin: "0 0 10px" }}><span className="ic" style={{ background: "#F1ECFE" }}><ClipboardList size={18} color="#7C3AED" /></span><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{n}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{d}</div></div><button className="cbtn" style={{ width: "auto", margin: 0, padding: "7px 12px" }} onClick={() => toast(`${n} 상품 상세는 준비 중입니다.`)}>보기</button></div>)}</div>)}
          <div className="chnote" style={{ marginTop: 4 }}>※ 본 병원 상세정보는 데모용 예시이며, 실제 정보는 공공데이터(건강보험공단 검진기관 등)·제휴 검진센터 DB 연동 시 반영됩니다.</div>
        </div>
        <div className="bkfoot"><button className="cbtn pri" style={{ margin: 0 }} onClick={() => onBook(center)}><CalendarCheck size={15} /> 예약하기</button></div>
      </div>
    </div>
  );
}

function BookingModal({ center, mode, onClose }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [done, setDone] = useState(false);
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 2); return d; });
  const slots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{done ? "예약 완료" : "검진 예약"}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          {!done ? (<>
            <div style={{ background: "#F7F9FC", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{center.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {center.r} · {center.area}</div>
              {mode === "nat" ? <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "var(--green)" }}>공단검진 본인부담 0원 <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 600 }}>· 추가검사 별도</span></div> : <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>{won(center.price)} <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 600, textDecoration: "line-through" }}>{won(center.orig)}</span></div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(120deg,#0E9F6E,#16A34A)", color: "#fff", borderRadius: 12, padding: "12px 14px", marginTop: 12, boxShadow: "0 12px 24px -16px rgba(16,163,74,.75)" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={20} color="#fff" /></span>
              <div style={{ fontSize: 12.8, fontWeight: 700, lineHeight: 1.5 }}>건강검진 예약과 동시에 <b style={{ color: "#FDE68A" }}>무상 건강검진 대비보험</b>이 자동 적용됩니다.</div>
            </div>
            <div className="bklbl">날짜 선택</div>
            <div className="cal">{days.map((d, i) => { const k = `${d.getMonth() + 1}/${d.getDate()}`; return (<div key={i} className={`calc ${date === k ? "on" : ""}`} onClick={() => setDate(k)}><div className="d">{d.getDate()}</div><div className="w">{W[d.getDay()]}</div></div>); })}</div>
            <div className="bklbl">시간 선택</div>
            <div className="slots">{slots.map((s) => <div key={s} className={`slot ${time === s ? "on" : ""}`} onClick={() => setTime(s)}>{s}</div>)}</div>
            <div className="bklbl">검진 항목</div>
            <div className="ctags">{center.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <button className="cbtn pri" style={{ opacity: date && time ? 1 : .5 }} disabled={!date || !time} onClick={() => setDone(true)}><CalendarCheck size={15} /> {date && time ? `${date} ${time} 예약 확정` : "날짜·시간을 선택하세요"}</button>
          </>) : (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>예약이 확정되었습니다</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{center.name}<br />{date} {time}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
                <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#E7F8EE" }}><ShieldCheck size={18} color="#16A34A" /></span><div><b style={{ fontSize: 13 }}>무료 검진보험 자동가입</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>추가 보험료 없이 검진 대비 보장이 적용됩니다.</div></div></div>
                <div className="resitem" style={{ margin: 0 }}><span className="ic"><BadgeCheck size={18} color="#7C3AED" /></span><div><b style={{ fontSize: 13 }}>NFT 예약증 발행</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>지갑에 SBT 예약증이 발행되고 알림톡이 발송됩니다.</div></div></div>
              </div>
              <button className="cbtn pri" style={{ marginTop: 16 }} onClick={onClose}>확인</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NationalCheckup() {
  const cancers = [[Stethoscope, "위암", "만 40세+ 2년"], [Activity, "대장암", "만 50세+ 1년"], [Brain, "간암", "고위험군 6개월"], [Heart, "유방암", "만 40세+ 2년"], [ShieldCheck, "자궁경부암", "만 20세+ 2년"], [Activity, "폐암", "고위험 흡연군"]];
  return (<>
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="rct"><ShieldCheck size={18} color="#16A34A" /> 일반건강검진 (국가검진)</div>
      <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>국가건강보험공단이 제공하는 무료 일반건강검진입니다. 대상자는 2년마다(비사무직 매년) 무료로 받을 수 있어요. 조성래님은 <b style={{ color: "var(--green)" }}>올해 검진 대상</b>입니다.</p>
      <div className="benefit" style={{ marginTop: 12, marginBottom: 0 }}><span><Art name="check" size={16} /> 본인부담 0원</span><span><Art name="check" size={16} /> 공단 검진 + 추가 검사 결합 가능</span><span><Art name="badge" size={16} /> 결과 카톡 수신</span></div>
      <button className="cbtn pri" onClick={() => toast("국가건강검진 대상자입니다. 검진센터 탭에서 예약을 진행하세요.")}><CalendarCheck size={15} /> 대상자 조회 후 예약하기</button>
    </div>
    <div className="card">
      <div className="rct"><Stethoscope size={18} color="#EF4444" /> 국가 암검진 6종</div>
      <div className="canc6">{cancers.map(([Ic, n, c]) => (<div className="cc6" key={n}><span className="ic"><Ic size={18} color="#2563EB" /></span>{n}<div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{c}</div></div>))}</div>
      <button className="cbtn" onClick={() => toast("올해 대상: 위암·대장암·간암 검진. 검진센터에서 예약 가능합니다.")}><ClipboardList size={15} /> 내 암검진 대상 항목 확인</button>
    </div>
    <CenterDirectory mode="nat" />
  </>);
}

function BizCheckup() {
  return (<div className="card">
    <div className="rct"><Users size={18} color="#2563EB" /> 기업·단체검진</div>
    <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>임직원 건강검진을 단체로 합리적인 비용에 예약하고, 결과를 한 번에 관리하세요. 대기업 수준의 검진 패키지를 단체할인가로 제공합니다.</p>
    <div className="benefit" style={{ marginTop: 12 }}><span><Art name="percent" size={16} /> 단체 할인</span><span><Art name="doc" size={16} /> 세금계산서 발행</span><span><Art name="badge" size={16} /> 임직원 검진 여정 관리</span></div>
    <div className="bklbl">기업코드 입력</div>
    <div style={{ display: "flex", gap: 8 }}>
      <input placeholder="예: HHIF-2026" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none" }} />
      <button className="cbtn pri" style={{ width: "auto", margin: 0, padding: "10px 18px" }} onClick={() => toast("기업검진 코드가 확인되었습니다. 제휴 혜택이 적용됩니다.")}>확인</button>
    </div>
    <button className="cbtn" style={{ marginTop: 10 }} onClick={() => openConsult("기업검진 도입")}><MessageSquare size={15} /> 기업검진 도입 문의</button>
  </div>);
}

function CheckupResults() {
  const [kakao, setKakao] = useState(true);
  return (<>
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="rct"><FileText size={18} color="#7C3AED" /> 내 검진 결과</div>
      <div className="resitem"><span className="ic"><Activity size={18} color="#7C3AED" /></span>
        <div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>프롬에이지 Premium 건강분석</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>메디에이지 · 검진일 2024.12.26 · 생체나이 52.5세</div></div>
        <button className="cbtn" style={{ width: "auto", margin: 0, padding: "8px 14px" }} onClick={() => toast("검진 결과가 연동되면 여기에서 확인할 수 있습니다.")}>결과 보기</button></div>
      <div className="resitem"><span className="ic" style={{ background: "#E8F1FE" }}><ClipboardList size={18} color="#2563EB" /></span>
        <div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>일반건강검진 결과</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>국가검진 · 2023.11 · 정상 B</div></div>
        <button className="cbtn" style={{ width: "auto", margin: 0, padding: "8px 14px" }} onClick={() => toast("검진 결과가 연동되면 여기에서 확인할 수 있습니다.")}>결과 보기</button></div>
    </div>
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="rct"><Stethoscope size={18} color="#16A34A" /> 사후관리 · 추적관찰</div>
      <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>추적관찰 병원은 이전 검진 결과를 이미 알고 있어, 필요한 재검·정밀검사를 이어서 관리해 드려요. 조성래님은 <b style={{ color: "#B45309" }}>간·췌장 복부초음파 추적</b>이 권장됩니다.</p>
      <button className="cbtn pri" onClick={() => nav("hospital")}><Building2 size={15} /> 추적관찰 병원 연결</button>
    </div>
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="ic" style={{ width: 40, height: 40, borderRadius: 11, background: "#FEF8E0", display: "grid", placeItems: "center" }}><MessageSquare size={20} color="#F2B544" /></span>
        <div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>결과 카카오톡으로 받기</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>검진 결과가 나오면 알림톡으로 보내드려요.</div></div>
        <div onClick={() => setKakao((v) => !v)} style={{ width: 44, height: 26, borderRadius: 999, background: kakao ? "var(--green)" : "#CBD5E1", position: "relative", cursor: "pointer", transition: ".2s", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 3, left: kakao ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: ".2s" }} />
        </div>
      </div>
    </div>
  </>);
}

/* ====================== 병원/예약 (심평원 공공데이터 연동) ====================== */
let _hiraPromise = null;
function loadHira() {
  if (!_hiraPromise) {
    _hiraPromise = fetch("./src/data/hira.json").then((r) => {
      if (!r.ok) throw new Error("데이터 로드 실패 (" + r.status + ")");
      return r.json();
    });
  }
  return _hiraPromise;
}
function useHira() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    let on = true;
    loadHira().then((d) => on && setState({ loading: false, error: null, data: d }))
      .catch((e) => on && setState({ loading: false, error: e.message, data: null }));
    return () => { on = false; };
  }, []);
  return state;
}
const SIDO_ORDER = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종시", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const TYPE_PRIORITY = ["상급종합", "종합병원", "병원", "요양병원", "한방병원", "치과병원", "의원", "한의원", "치과의원", "정신병원", "조산원", "보건의료원", "보건소", "보건지소", "보건진료소"];
const tpri = (t) => { const i = TYPE_PRIORITY.indexOf(t); return i < 0 ? 99 : i; };
const mapsHref = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const MAP_CAP = 1000;
const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 약국 운영정보(데모·추정): 심평원 기본데이터엔 운영시간이 없어 약국명 기반 결정적 해시로 생성.
function pharmOps(name, sgg) {
  let h = 0; const s = (name || "") + (sgg || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const night = h % 7 === 0;
  const holiday = h % 4 === 0;
  const open = ["08:30", "09:00", "09:30"][h % 3];
  const close = night ? "24:00" : ["18:00", "18:30", "19:00", "20:00"][(h >> 3) % 4];
  const sat = (h >> 5) % 3 === 0 ? "토 휴무" : "토 09:00~13:00";
  return { night, holiday, weekday: `${open}~${close}`, sat };
}

// 외부 링크는 실제 배포 도메인에서만 노출(미리보기 localhost는 외부 이동을 차단하므로 숨김).
const EXTERNAL_OK = typeof location !== "undefined" && !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
const directionsHref = (lat, lng) => `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`;
const normUrl = (u) => { if (!u) return ""; const s = String(u).trim(); return /^https?:\/\//i.test(s) ? s : "http://" + s; };
// 심평원 등록 홈페이지 중 'http://'만 있거나 도메인이 없는 쓰레기값 제외.
const validHomepage = (u) => { if (!u) return false; const s = String(u).trim().replace(/^https?:\/\//i, ""); return /[.][a-z가-힣]{2,}/i.test(s); };
// 공식 홈페이지가 없는 병원도 정보를 참고할 수 있는 네이버 검색 링크(병원마다 생성).
const naverHref = (name, region) => `https://search.naver.com/search.naver?query=${encodeURIComponent((name + " " + (region || "")).trim())}`;
const popupLink = (lat, lng) => EXTERNAL_OK ? `<br><a href="${directionsHref(lat, lng)}" target="_blank" rel="noreferrer" style="color:#2563EB;font-weight:700">길찾기(새 창) ›</a>` : "";

// Leaflet(OpenStreetMap) 지도 — window.L (UMD)로 로드, 마커클러스터 있으면 사용.
function MapView({ points, accent, focus, height }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const valid = React.useMemo(() => (points || []).filter((p) => p.lat && p.lng).slice(0, MAP_CAP), [points]);
  useEffect(() => {
    const L = window.L;
    if (!L || !ref.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([36.5, 127.8], 7);
      mapRef.current.attributionControl.setPrefix(false);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(mapRef.current);
    }
    const map = mapRef.current;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    const group = L.markerClusterGroup ? L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 }) : L.layerGroup();
    const bounds = [];
    valid.forEach((p) => {
      const m = L.marker([p.lat, p.lng]);
      m.bindPopup(`<div style="font-size:12.5px;line-height:1.5;min-width:150px"><b>${escHtml(p.name)}</b>${p.tag ? ` <span style="color:${accent || "#2563EB"};font-weight:700">· ${escHtml(p.tag)}</span>` : ""}<br>${escHtml(p.addr)}${p.tel ? `<br>☎ ${escHtml(p.tel)}` : ""}${popupLink(p.lat, p.lng)}</div>`);
      group.addLayer(m); bounds.push([p.lat, p.lng]);
    });
    group.addTo(map); layerRef.current = group;
    if (bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [valid, accent]);
  // 특정 위치로 포커스(카드의 '지도에서 보기' 클릭 시) — 외부 이동 없이 앱 내부 지도에서 처리.
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current || !focus || !focus.lat || !focus.lng) return;
    const map = mapRef.current;
    map.invalidateSize();
    map.setView([focus.lat, focus.lng], 16, { animate: true });
    L.popup({ offset: [0, -4] }).setLatLng([focus.lat, focus.lng])
      .setContent(`<div style="font-size:12.5px;line-height:1.5"><b>${escHtml(focus.name)}</b>${focus.addr ? `<br>${escHtml(focus.addr)}` : ""}${popupLink(focus.lat, focus.lng)}</div>`).openOn(map);
  }, [focus]);
  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);
  if (!window.L) return <div className="hload" style={{ marginTop: 0 }}>지도를 불러오지 못했습니다. (인터넷 연결·Leaflet 로드 확인)</div>;
  const noCoord = (points || []).length > 0 && valid.length === 0;
  return (
    <div>
      <div ref={ref} style={{ height: height || 360, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }} />
      <div style={{ fontSize: 11, color: "var(--soft)", marginTop: 6 }}>{noCoord ? "좌표 정보가 없어 위치를 표시할 수 없습니다." : "지도 © OpenStreetMap 기여자 · 좌표 출처: 심평원 공공데이터"}{points && points.length > MAP_CAP ? ` · 표시 ${MAP_CAP.toLocaleString()}/${points.length.toLocaleString()}곳(상위)` : ""}</div>
    </div>
  );
}

function MapCard({ title, points, accent, open, onToggle, focus, anchorRef }) {
  const [internal, setInternal] = useState(false);
  const isOpen = open !== undefined ? open : internal;
  const toggle = onToggle || (() => setInternal((v) => !v));
  return (
    <div className="mapcard" ref={anchorRef}>
      <div className="maphead" onClick={toggle}>
        <div className="mt"><MapPin size={16} color="#2F5BEA" /> {title}</div>
        <ChevronDown size={18} color="#9AA6BC" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: ".2s" }} />
      </div>
      {isOpen && <div style={{ marginTop: 10 }}><MapView points={points} accent={accent} focus={focus} /></div>}
    </div>
  );
}

