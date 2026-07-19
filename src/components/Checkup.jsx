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

/* ── 검진 대분류 분류: 각 검진기관의 성격 → 국가·개인·기업·특수 (공공검진지원은 별도 지원 프로그램) ── */
const CHECKUP_CATS = {
  "한국건강관리협회": ["nat", "personal", "special"],
  "KMI한국의학연구소": ["nat", "personal", "biz", "special"],
  "하나로의료재단": ["personal", "biz", "nat"],
  "서울의과학연구소(SCL)": ["personal", "special"],
  "한신메디피아": ["personal", "biz", "nat"],
  "삼성서울병원": ["nat", "personal", "biz", "special"],
  "서울대학교병원": ["nat", "personal", "biz", "special"],
  "세브란스": ["nat", "personal", "biz", "special"],
};
const CHECKUP_CAT_META = {
  nat: { label: "국가검진", color: "#16A34A", intro: "국민건강보험공단 지정기관에서 생애주기별 국가건강검진(일반·암검진)을 본인부담 0원으로 받을 수 있는 기관입니다." },
  personal: { label: "개인검진", color: "#2563EB", intro: "개인 맞춤 종합검진·정밀검진(암·심뇌혈관 등)을 제공하는 검진센터·병원입니다." },
  biz: { label: "기업검진", color: "#7C3AED", intro: "기업 임직원 단체검진·복지검진을 제공하는 기관입니다(B2B)." },
  special: { label: "특수검진", color: "#EA580C", intro: "산업안전보건법상 유해인자 노출 근로자의 특수건강진단을 수행하는 지정기관입니다." },
};
function checkupCats(c) { return CHECKUP_CATS[c.b] || ["personal"]; }
/* 다른 섹션(AI 주치의 등)에서 특정 검진 탭으로 진입하기 위한 인텐트 */
let _checkupTab = null;

/* ====== 응급신호 통합 뷰 — "이런 증상은 즉시 119" (증상 → 의심질환 → 행동) ======
   ※ 참고용 자가체크. 판단이 서지 않으면 무조건 119. 진단을 대체하지 않습니다. */
const EMERGENCY_GUIDE = [
  { area: "뇌·신경", col: "#DB2777", items: [
    ["갑자기 한쪽 팔다리 마비·얼굴 비뚤어짐·발음 어눌·시야장애", "뇌졸중", "즉시 119 (골든타임 4.5시간)"],
    ["번개 치듯 갑작스런 최악의 두통·목 뻣뻣함·구토", "뇌출혈·지주막하출혈", "즉시 119"],
    ["경련이 5분 이상 지속되거나 의식 회복 없이 반복", "경련지속상태", "즉시 119"],
  ] },
  { area: "심장·가슴", col: "#DC2626", items: [
    ["20분 이상 가슴을 쥐어짜는 통증·식은땀·왼팔/턱 방사통", "급성 심근경색", "즉시 119 (여성·고령·당뇨는 흉통 없이 소화불량·극심한 피로로도)"],
    ["찢어지는 듯한 갑작스런 가슴·등·복부 통증·실신", "대동맥박리·파열", "즉시 119"],
    ["실신·심한 어지럼과 함께 심하게 두근거림", "치명적 부정맥", "즉시 119"],
  ] },
  { area: "호흡·기도", col: "#0EA5E9", items: [
    ["숨이 심하게 차고 입술·얼굴이 파랗게 변함(청색증)", "천식·COPD 악화·기흉·폐색전증", "즉시 119"],
    ["침을 흘리며 삼키지 못하고 앉아서 고개 내밀고 힘겹게 숨쉼", "급성 후두개염(기도폐색)", "즉시 119"],
    ["한쪽 다리가 붓고 아프면서 갑자기 숨이 참·각혈", "폐색전증", "즉시 119"],
  ] },
  { area: "알레르기·쇼크", col: "#F59E0B", items: [
    ["입술·혀 부종·전신 두드러기·호흡곤란·어지럼", "아나필락시스", "에피네프린 주사 후 즉시 119"],
    ["고열·오한·의식저하·소변량 급감·혈압저하", "패혈증", "즉시 119"],
  ] },
  { area: "복부·소화", col: "#B45309", items: [
    ["피를 토하거나 짜장 같은 검은 변", "위장관 출혈", "즉시 응급실"],
    ["배가 판자처럼 딱딱하고 극심한 복통", "장천공·복막염", "즉시 응급실"],
    ["명치에서 등으로 뻗치는 극심한 통증·구토", "급성 췌장염·담관염", "즉시 응급실"],
  ] },
  { area: "대사·당뇨", col: "#7C3AED", items: [
    ["식은땀·손떨림·혼란 후 의식이 흐려짐", "저혈당", "의식 있으면 당분 섭취, 없으면 즉시 119"],
    ["심한 갈증·구토·과호흡·의식저하", "당뇨병성 케톤산증·고혈당", "즉시 응급실"],
  ] },
  { area: "눈", col: "#16A34A", items: [
    ["갑작스런 눈 통증·충혈·시력저하·구토·무지개 잔상", "급성 폐쇄각 녹내장", "즉시 안과 응급(실명 위험)"],
    ["번쩍임·날파리 급증과 함께 커튼이 시야를 가림", "망막박리", "즉시 안과(응급 수술 골든타임)"],
    ["갑자기 한쪽 귀가 안 들리고 이명·어지럼", "돌발성 난청", "72시간 내 즉시 이비인후과"],
  ] },
  { area: "감염·소아", col: "#0D9488", items: [
    ["고열 + 심한 두통·목 뻣뻣함·구토·자반(점상출혈)", "뇌수막염", "즉시 119"],
    ["소아가 경련 5분 이상·경련 후 목 뻣뻣·의식 안 돌아옴", "열성경련·뇌수막염 감별", "옆으로 눕히고 즉시 119"],
    ["아이가 소변·눈물 없이 축 처지고 못 먹음", "중증 탈수", "즉시 응급실"],
  ] },
  { area: "사지·혈관", col: "#4F46E5", items: [
    ["갑자기 한쪽 팔/다리가 창백·차갑고 심한 통증·감각저하", "급성 동맥폐색", "즉시 119 (6시간 골든타임)"],
    ["소변이 전혀 안 나오고 아랫배가 팽창·통증", "급성 요폐", "즉시 응급실(도뇨)"],
    ["4시간 이상 지속되는 통증성 발기", "지속발기증", "즉시 응급실(조직손상)"],
  ] },
  { area: "임신·산후", col: "#E11D48", items: [
    ["임신 20주 후 심한 두통·시야 번쩍임·상복부 통증·급격한 부종", "자간전증(임신중독증)", "즉시 진료, 경련 시 119"],
    ["출산 후 다량 하혈·발열·한쪽 다리가 붓고 아픔", "산후출혈·혈전", "즉시 진료/응급"],
  ] },
  { area: "정신 응급", col: "#6366F1", items: [
    ["자살 생각·자해 충동이 든다", "정신과적 응급", "자살예방상담 1393 · 즉시 응급실"],
    ["금주 후 심한 손떨림·환각·발한·경련·의식혼탁", "진전섬망(알코올 금단)", "즉시 응급실"],
  ] },
];
function EmergencyGuide() {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="card" style={{ background: "linear-gradient(135deg,#7F1D1D 0%,#B91C1C 55%,#DC2626 100%)", color: "#fff", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 30 }}>🚨</span>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>응급신호 — 이런 증상은 즉시 119</div>
            <div style={{ fontSize: 12.5, opacity: .92, marginTop: 3 }}>증상 → 의심질환 → 행동. 판단이 서지 않으면 <b>무조건 119</b>. 참고용 자가체크이며 진단을 대체하지 않습니다.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <a href="tel:119" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#B91C1C", fontWeight: 800, fontSize: 13.5, borderRadius: 9, padding: "9px 15px", textDecoration: "none" }}><Phone size={15} /> 119 응급 신고</a>
          <a href="tel:1393" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", color: "#fff", fontWeight: 800, fontSize: 13.5, borderRadius: 9, padding: "9px 15px", textDecoration: "none", border: "1px solid rgba(255,255,255,.5)" }}><Phone size={15} /> 자살예방 1393</a>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12, marginTop: 12 }}>
        {EMERGENCY_GUIDE.map((g, i) => (
          <div className="card" key={i} style={{ borderTop: `4px solid ${g.col}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 15, color: g.col, marginBottom: 8 }}><AlertTriangle size={16} /> {g.area}</div>
            {g.items.map((it, j) => (
              <div key={j} style={{ padding: "9px 0", borderTop: j ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.45 }}>{it[0]}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>의심: <b style={{ color: g.col }}>{it[1]}</b></div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2, color: "#DC2626" }}>→ {it[2]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function CheckupSection() {
  const [cat, setCat] = useState(_checkupTab || "nat");
  useEffect(() => { _checkupTab = null; }, []);
  const cats = [["nat", "국가검진", ShieldCheck], ["personal", "개인검진", BadgeCheck], ["biz", "기업검진", Users], ["special", "특수검진", AlertTriangle], ["public", "공공검진지원", HeartHandshake], ["rec", "AI 맞춤추천", Sparkles], ["doctor", "🩺 AI 주치의", Bot], ["emergency", "🚨 응급신호", AlertTriangle]];
  return (
    <div style={{ marginTop: 16 }}>
      <div className="aihead"><span className="aiico"><SecIcon k="checkup" /></span>
        <div><div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>건강검진</div><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>국가검진 · 개인검진 · 기업검진 · 특수검진 · 공공검진지원 — 검진기관 성격별 분류·비교·예약</div></div></div>
      <AiLinkBanner target="checkup" />
      <div className="chtabs">
        {cats.map(([k, t, Ic]) => <div key={k} className={`chtab ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}><Ic size={15} /> {t}</div>)}
        <div className={`reslink ${cat === "result" ? "on" : ""}`} onClick={() => setCat("result")}><FileText size={14} /> 검진결과·사후관리</div>
      </div>
      {cat === "nat" && <BrandDirectory catFilter="nat" />}
      {cat === "personal" && <BrandDirectory catFilter="personal" />}
      {cat === "biz" && <><BrandDirectory catFilter="biz" /><div style={{ marginTop: 14 }}><BizCheckup /></div></>}
      {cat === "special" && <SpecialCheckup />}
      {cat === "public" && <PublicSupport />}
      {cat === "rec" && <AICheckupRec onGoCenters={() => setCat("personal")} />}
      {cat === "doctor" && <div style={{ marginTop: 8 }}><div className="chnote" style={{ margin: "0 0 10px" }}>검진 관련이나 건강 궁금증을 AI 주치의에게 물어보세요. AI Super Agent에서 넘어온 상담도 여기서 이어집니다.</div><Chat acceptsSeed /></div>}
      {cat === "emergency" && <EmergencyGuide />}
      {cat === "result" && <CheckupResults />}
    </div>
  );
}
/* 브랜드 검진기관 디렉토리(큐레이션 51곳) — 한건협(공공·대중형)·KMI(대형) 별도 카테고리 */
const FEATURED_BRANDS = ["한국건강관리협회", "KMI한국의학연구소"];
function BrandDirectory({ only, catFilter }) {
  const single = !!only, isKahp = only === "한국건강관리협회", isKmi = only === "KMI한국의학연구소";
  const [brand, setBrand] = useState("전체");
  const [sido, setSido] = useState("전체");
  const [sgg, setSgg] = useState("전체");
  const [near, setNear] = useState(null); // 내 주변 활성 시 {name,sidoFull,sidoShort,sgg}
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(single ? 12 : 10);
  const [sel, setSel] = useState(null);
  const ALL = (typeof CHECKUP_INST !== "undefined") ? CHECKUP_INST : [];
  const META = (typeof CHECKUP_BRAND_META !== "undefined") ? CHECKUP_BRAND_META : {};
  const ssido = (s) => (typeof tmSidoShort === "function" ? tmSidoShort(s) : s);
  // 큐레이션 검진기관 → 예약 모달용 센터 객체(무가격). 한건협=기본형(공공), 그 외=고급형(프리미엄)
  const toCenter = (c) => ({ name: c.b === "KMI한국의학연구소" ? `KMI ${c.n}` : c.n, r: ssido(c.sd), area: c.sg, ad: c.ad, tags: [c.t, META[c.b]?.tier || "검진기관"], _noPrice: true, _plan: c.b === "한국건강관리협회" ? "basic" : "premium" });
  const rank = (s) => (typeof SIDO_RANK !== "undefined" && SIDO_RANK[s]) || 99;
  const base = ALL.filter((c) => only ? c.b === only : catFilter ? checkupCats(c).includes(catFilter) : !FEATURED_BRANDS.includes(c.b));
  const brands = single ? [] : ["전체", ...Array.from(new Set(base.map((c) => c.b)))];
  const brandList = base.filter((c) => single || brand === "전체" || c.b === brand);
  const sidos = ["전체", ...Array.from(new Set(brandList.map((c) => c.sd))).sort((a, b) => rank(a) - rank(b))];
  // 선택 시·도의 시·군·구(큐레이션 센터 보유분)
  const sggs = sido === "전체" ? [] : ["전체", ...Array.from(new Set(brandList.filter((c) => c.sd === sido).map((c) => c.sg))).sort((a, b) => a.localeCompare(b, "ko"))];
  const isPartner = (c) => c.b === "한신메디피아";
  // 내 주변 추천 — 회원 주소 기준. 같은 시·군·구 → 같은 시·도 순으로 정렬
  const findNear = () => {
    const r = (typeof memberRegion === "function") ? memberRegion() : null; if (!r) return;
    const hasSido = brandList.some((c) => c.sd === r.sidoFull);
    const hasSgg = brandList.some((c) => c.sd === r.sidoFull && c.sg === r.sgg);
    setNear(r); setSido(hasSido ? r.sidoFull : "전체"); setSgg(hasSgg ? r.sgg : "전체"); setQ(""); setShown(single ? 12 : 10);
    if (typeof toast === "function") toast(`📍 ${r.name}님 주소(${r.sidoShort} ${r.sgg}) 기준 근처 검진센터`);
  };
  const nearScore = (c) => near ? ((c.sg === near.sgg ? 0 : 1) + (c.sd === near.sidoFull ? 0 : 2)) : 0;
  let list = brandList.filter((c) => (sido === "전체" || c.sd === sido) && (sgg === "전체" || c.sg === sgg) && (!q || (c.n + c.sd + c.sg + c.ad).includes(q)));
  list = list.sort((a, b) => (near ? nearScore(a) - nearScore(b) : 0) || (isPartner(a) ? 0 : 1) - (isPartner(b) ? 0 : 1) || rank(a.sd) - rank(b.sd) || a.sg.localeCompare(b.sg, "ko"));
  const view = list.slice(0, shown);
  /* Phase 4 — 검진센터 실좌표 지도: 심평원(hira) 병원 데이터에서 명칭 매칭으로 좌표 확보, 핀에서 바로 예약 */
  const hiraGeo = useHira();
  const geoPts = React.useMemo(() => {
    const d = hiraGeo.data; if (!d) return [];
    const geo = checkupGeoAll(d);
    return list.map((c) => {
      const g = geo[c.n];
      if (!g) return null;
      return { name: c.b === "KMI한국의학연구소" ? `KMI ${c.n}` : c.n, addr: c.ad, tel: c.p !== "-" ? c.p : "", tag: c.t, lat: g.lat, lng: g.lng, _bk: { kind: "checkup", center: c } };
    }).filter(Boolean);
  }, [hiraGeo.data, list]);
  /* 지도 핀의 '바로 예약' → 예약 모달(지도 안에서 예약까지 — K2-3) */
  useEffect(() => {
    const h = (e) => { const d = e.detail; if (d && d.kind === "checkup" && d.center) setSel(d.center); };
    window.addEventListener("mapbook", h); return () => window.removeEventListener("mapbook", h);
  }, []);
  const card = (c, i) => { const m = META[c.b] || {}; const partner = isPartner(c); return (
    <div className={`center${partner ? " partner" : ""}`} key={i}>
      <div className="cimg" style={{ background: (m.col || "#2563EB") + "14" }}><Building2 size={40} color={m.col || "#2563EB"} /></div>
      <div className="cmain">
        <div className="cname">{c.b === "KMI한국의학연구소" ? `KMI ${c.n}` : c.n} <span className="cbadge" style={{ color: m.col, background: (m.col || "#2563EB") + "1A" }}>{m.short}</span>{partner && <span className="cbadge partnerbadge"><Sparkles size={9} /> 특별제휴</span>}</div>
        <div className="cmeta"><span style={{ fontWeight: 800, color: "#2563EB" }}>{ssido(c.sd)}</span> · <MapPin size={12} />{c.sg} · {c.t}{c.p !== "-" && <> · <Phone size={12} />{c.p}</>}</div>
        <div className="ctags"><span>{c.t}</span><span>{m.tier || "검진기관"}</span></div>
        <div className="ctags" style={{ marginTop: 4 }}>{checkupCats(c).map((k) => { const cm = CHECKUP_CAT_META[k]; return <span key={k} style={{ background: cm.color + "18", color: cm.color, fontWeight: 800, border: "none" }}>{cm.label}</span>; })}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{c.ad}</div>
      </div>
      <div className="cright">
        <span className="cbadge"><ShieldCheck size={10} /> 무료 검진보험</span>
        <div className="obtns"><button onClick={() => openConsult("건강검진 상담 — " + c.n)}>상담</button><button className="book" onClick={() => setSel(c)}>예약</button></div>
      </div>
    </div>
  ); };
  return (
    <>
      {catFilter && CHECKUP_CAT_META[catFilter] && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: CHECKUP_CAT_META[catFilter].color + "12", border: "1px solid " + CHECKUP_CAT_META[catFilter].color + "33", borderRadius: 14, padding: "13px 16px", marginBottom: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: CHECKUP_CAT_META[catFilter].color + "22", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 18, fontWeight: 900, color: CHECKUP_CAT_META[catFilter].color }}>{CHECKUP_CAT_META[catFilter].label[0]}</span>
          <div><div style={{ fontSize: 15, fontWeight: 900, color: "#12203F" }}>{CHECKUP_CAT_META[catFilter].label} · 전국 {base.length}개 기관</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{CHECKUP_CAT_META[catFilter].intro}</div></div>
        </div>
      )}
      {isKahp && (
        <div className="kmibanner kahp">
          <div className="kmibt"><HeartHandshake size={18} /> 한국건강관리협회 — 공공·대중형 건강검진</div>
          <div className="kmibs">비영리 공익법인의 합리적 비용 검진 · 국가건강검진·생애주기 검진 연계 · 전국 <b>{base.length}</b>개 검진·치과 기관 <span className="kahptag">사회적 가치</span></div>
        </div>
      )}
      {isKmi && (
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
      {!single && (
        <><div className="bklbl" style={{ margin: "0 0 8px" }}>브랜드</div>
        <div className="regions">{brands.map((b) => <div key={b} className={`fsel ${brand === b ? "on" : ""}`} onClick={() => { setBrand(b); setSido("전체"); setShown(10); }}>{b === "전체" ? "전체" : (META[b]?.short || b)}</div>)}</div></>
      )}
      <div className="bklbl" style={{ margin: "10px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>지역(시·도)</span>
        <button className="nearbtn" onClick={findNear}><MapPin size={13} /> 내 주변 검진센터</button></div>
      <div className="regions">{sidos.map((s) => <div key={s} className={`fsel ${sido === s ? "on" : ""}`} onClick={() => { setSido(s); setSgg("전체"); setNear(null); setShown(single ? 12 : 10); }}>{s === "전체" ? "전체" : ssido(s)}</div>)}</div>
      {geoPts.length > 0 && <MapCard title={`검진센터 위치 지도 (${geoPts.length}곳 · 심평원 실좌표 매칭 · 핀에서 바로 예약)`} accent="#2563EB" points={geoPts} />}
      {sido !== "전체" && sggs.length > 1 && (<>
        <div className="bklbl" style={{ margin: "10px 0 8px" }}>시·군·구</div>
        <div className="regions">{sggs.map((s) => <div key={s} className={`fsel ${sgg === s ? "on" : ""}`} onClick={() => { setSgg(s); setShown(single ? 12 : 10); }}>{s}</div>)}</div>
      </>)}
      {near && (<div className="nearinfo"><MapPin size={13} /> <b>{near.name}</b>님 주소 <b>{near.sidoShort} {near.sgg}</b> 기준 가까운 순 정렬{!brandList.some((c) => c.sd === near.sidoFull && c.sg === near.sgg) && <span className="nearnote"> · 해당 시·군·구 큐레이션 센터가 없어 같은 시·도에서 가까운 순으로 안내</span>}<button onClick={() => { setNear(null); setSido("전체"); setSgg("전체"); }}>해제</button></div>)}
      <div className="filterbar"><div className="fsearch"><Search size={15} /><input value={q} onChange={(e) => { setQ(e.target.value); setShown(single ? 12 : 10); }} placeholder="기관명·지역·주소 검색" /></div></div>
      <div className="chcount">{isKahp ? "한국건강관리협회" : isKmi ? "KMI 검진센터" : (brand === "전체" ? "브랜드 검진기관" : (META[brand]?.short || brand))} <b style={{ color: "var(--blue)" }}>{list.length.toLocaleString()}</b>곳 · 전체 큐레이션 {ALL.length}곳</div>
      {view.map((c, i) => card(c, i))}
      {shown < list.length && <button className="cbtn" onClick={() => setShown((x) => x + 10)}>더 보기 ({list.length - shown}곳 더)</button>}
      <div className="chnote">※ 출처: 국민건강보험공단 병의원·검진기관 찾기 / 기관 공식 사이트(수집일 2026-06-27). "공식 사이트 확인" 항목은 정확한 주소를 기관 홈페이지에서 최종 확인 권장. 본 비교 정보는 이용자의 합리적 선택을 돕기 위한 것으로 의료법(의료광고 심의·환자 유인·알선 금지)을 준수합니다.</div>
      {sel && <BookingModal center={toCenter(sel)} mode="comp" onClose={() => setSel(null)} />}
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
      <div className="chnote">※ 표시된 가격·정보는 예시이며 실제 비용·운영정보는 검진센터·검진항목·옵션에 따라 다릅니다. 실데이터는 제휴 검진센터 DB 연동 시 반영됩니다. 의료기관 비교·가격 정보는 이용자의 합리적 선택을 돕기 위한 것으로, 특정 기관 직접 후기·의료광고는 의료법(의료광고 심의·환자 유인·알선 금지)을 준수합니다.</div>
      {sel && <BookingModal center={sel} mode={mode} onClose={() => setSel(null)} />}
      {detail && <CenterDetailModal center={detail} onClose={() => setDetail(null)} onBook={(c) => { setDetail(null); setSel(c); }} />}
    </>
  );
}

/* 질환 → 아이콘·색상 매핑(검진 추천 카드) */
const CKUP_DZ_STYLE = {
  "당뇨병": [Activity, "#F59E0B", "#FEF3E2"], "고혈압": [Heart, "#EF4444", "#FDECEC"],
  "이상지질혈증": [Activity, "#DB2777", "#FCE7F3"], "간질환(지방간·간염)": [Stethoscope, "#7C3AED", "#F1ECFE"],
  "만성콩팥병": [ShieldCheck, "#0891B2", "#E0F2FE"], "암 위험": [ShieldCheck, "#16A34A", "#E7F8EE"],
  "대사증후군": [Activity, "#2563EB", "#E8F1FE"], "만성호흡기질환": [Stethoscope, "#0E7490", "#E0F2FE"],
};
function AICheckupRec({ onGoCenters }) {
  const dm = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const _self = !dm && typeof selfMember === "function" ? (() => { try { return selfMember(); } catch (e) { return null; } })() : null;
  const M = dm || _self;
  const nm = M ? M.name : "조성래";
  const prof = (M && typeof ciRiskProfile === "function") ? (() => { try { return ciRiskProfile(M); } catch (e) { return null; } })() : null;
  // 폴백: 온톨로지 위험이 없으면 연령대 표준 권장검사
  if (!prof || !prof.hasRisk) {
    const base = [[ClipboardList, "국가 일반건강검진", "기본 혈액·소변·혈압·시력 등 정기 점검", "#2563EB", "#E8F1FE"], [Stethoscope, "위·대장 내시경", "40대 이후 권장 검진 주기", "#7C3AED", "#F1ECFE"], [Heart, "경동맥 초음파·심전도", "심뇌혈관 예방 점검", "#EF4444", "#FDECEC"]];
    return (<>
      <div className="airec"><div className="at"><Sparkles size={16} color="#7C3AED" /> {nm}님 맞춤 검사 추천</div><div className="ap">검진 데이터 기반 표준 권장검사예요. 검진 결과를 연동하면 위험질환 맞춤 정밀검진을 추천해 드려요.</div></div>
      <div className="card"><div className="rct"><Stethoscope size={18} color="#7C3AED" /> 권장 검사</div>
        {base.map(([Ic, t, d, col, bg]) => (<div className="adv" key={t}><span className="ic" style={{ background: bg }}><Ic size={18} color={col} /></span><div style={{ flex: 1 }}><b>{t}</b><p>{d}</p></div><button onClick={onGoCenters} className="ckrecbtn">센터 보기 ›</button></div>))}
      </div>
    </>);
  }
  const rows = prof.rows.slice(0, 5);
  const gapRows = prof.rows.filter((r) => r.gaps.length);
  return (<>
    <div className="airec">
      <div className="at"><Sparkles size={16} color="#7C3AED" /> {nm}님 맞춤 검사 추천 <span className="ckonto">검진 × 보험 온톨로지</span></div>
      <div className="ap">검진 이상·질환을 <b>중대질환 온톨로지(CI_ONTOLOGY)</b>로 분석해, 위험질환별 꼭 필요한 <b>정밀검진</b>을 골라드려요. 진단비가 없는 질환은 <b>조기발견 검진</b>을 우선합니다.</div>
    </div>
    <div className="card">
      <div className="rct"><Stethoscope size={18} color="#7C3AED" /> 위험질환별 권장 정밀검진 <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{rows.length}개 질환</span></div>
      {rows.map((r) => { const [Ic, col, bg] = CKUP_DZ_STYLE[r.disease] || [Stethoscope, "#2563EB", "#E8F1FE"]; return (
        <div className="ckrow" key={r.disease}>
          <div className="ckrow-h"><span className="ic" style={{ background: bg }}><Ic size={17} color={col} /></span>
            <div style={{ flex: 1 }}><b>{r.disease}{r.source && !r.disease.includes(r.source) && <span className="cksrc">{r.source}</span>}</b><p>{r.note}</p></div>
            {r.gaps.length > 0 && <span className="ckgap" title={r.gaps.join("·") + " 진단비 미보유"}>진단비 공백 <b>{r.gaps.join("·")}</b></span>}
          </div>
          <div className="ckchips">{r.checkups.map((c) => <button key={c} className="ckchip" onClick={onGoCenters}>{c} <ChevronRight size={11} /></button>)}</div>
        </div>); })}
    </div>
    {gapRows.length > 0 && (
      <div className="card ckgapcard">
        <div className="rct"><ShieldCheck size={18} color="#B91C1C" /> 진단비 없는 질환 — 조기발견이 최선의 대비</div>
        <p style={{ fontSize: 12.5, color: "#7A2E2E", lineHeight: 1.6, margin: "2px 0 10px" }}>
          <b>{prof.gapDiseases.join(" · ")}</b>은(는) 아직 <b>중대질환 진단비가 없어</b> 발병 시 치료비 부담이 큽니다. 위 정밀검진으로 <b>조기에 발견</b>하고, 보험·치료비에서 <b>진단비 보완</b>을 함께 검토하세요.</p>
        <div className="ckgapbtns">
          <button className="cbtn pri" style={{ margin: 0 }} onClick={onGoCenters}><ClipboardList size={15} /> 추천 센터에서 예약</button>
          <button className="cbtn" style={{ margin: 0 }} onClick={() => { const cat = gapRows[0] && gapRows[0].gaps[0]; const CAT2PLAN = { "암": "general", "뇌": "brain", "심장": "heart", "신장": "liver", "간": "liver", "폐": "major" }; try { window.__hifinInsRoute = { tab: "premium", planKey: CAT2PLAN[cat] || "general" }; } catch (e) {} nav("insurance"); }}><ShieldCheck size={15} /> 진단비 보장 설계 · 간편가입</button>
        </div>
      </div>
    )}
    <div className="card" style={{ border: "1.5px solid #BFD0FF" }}>
      <div className="rct"><Sparkles size={18} color="#2F5BEA" /> {nm}님 맞춤 종합검진 패키지</div>
      <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>위 위험질환별 권장검사를 묶은 맞춤 패키지예요. 전국 제휴 검진센터에서 합리적인 비용으로 예약할 수 있고, 예약 시 무료 검진보험이 자동 가입됩니다.</p>
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
          <div className="chnote" style={{ marginTop: 4 }}>※ 본 병원 상세정보는 예시이며, 실제 정보는 공공데이터(건강보험공단 검진기관 등)·제휴 검진센터 DB 연동 시 반영됩니다.</div>
        </div>
        <div className="bkfoot"><button className="cbtn pri" style={{ margin: 0 }} onClick={() => onBook(center)}><CalendarCheck size={15} /> 예약하기</button></div>
      </div>
    </div>
  );
}

/* ── 검진 예약 커넥터 (UIP) — 제휴 검진센터 실제 예약 연동 스위치 ──
   status "pending"(연동 준비) → "live"(실연동)로 바꾸고 endpoint만 넣으면
   예약 확정 시 즉시 실제 예약이 전송(API)되거나 예약 페이지로 이동(URL)한다.
   ★ 실제 연동 확정 시 아래 status/endpoint/method 3개 값만 수정하면 즉시 시행. */
const PARTNER_BOOKING = {
  "한신메디피아": {
    partner: "한신메디피아",
    uipCode: "HANSHIN-MEDIPIA",   // UIP 통합연동 커넥터 식별자
    method: "uip",                 // "uip" | "api" | "url" | "tel"
    status: "pending",             // ★ 실연동 확정 시 "live"
    endpoint: "",                  // ★ 실제 UIP/예약 API 엔드포인트 또는 예약 URL
    tel: "1811-0303",              // 폴백 전화예약(예시)
    note: "UIP 통합연동 준비 중 — 연동 확정 시 예약 요청이 한신메디피아로 실시간 전송됩니다.",
  },
};
function getBooking(center) {
  if (!center) return null;
  const key = center.b || center.brand || "";
  if (PARTNER_BOOKING[key]) return PARTNER_BOOKING[key];
  const nm = center.name || center.n || "";
  for (const k in PARTNER_BOOKING) if (nm.indexOf(k) >= 0) return PARTNER_BOOKING[k];
  return null;
}
/* 예약 전송 — live면 실제 연동(URL 이동 또는 API POST), 아니면 요청 접수(대기) */
function submitCheckupBooking(center, payload) {
  const cfg = getBooking(center);
  if (cfg && cfg.status === "live" && cfg.endpoint) {
    if (cfg.method === "url") { try { window.open(cfg.endpoint, "_blank", "noopener"); } catch (e) {} return { mode: "live-url", cfg }; }
    try { fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {}); } catch (e) {}
    return { mode: "live-api", cfg };
  }
  return { mode: cfg ? "pending" : "demo", cfg };
}

/* ── 실물 리포트 원본 뷰어 — PDF 다운로드 없이 페이지 이미지로 바로 넘겨보기(개인정보 마스킹판) ── */
function ReportPdfViewer({ onClose }) {
  const PAGES = Array.from({ length: 31 }, (_, i) => "./data/docs/report_sample/p" + String(i + 1).padStart(2, "0") + ".jpg");
  return (
    <div className="voverlay" onClick={onClose}>
      <div className="viewer" onClick={(e) => e.stopPropagation()}>
        <div className="vhead">
          <div className="vt"><FileText size={17} color="#7C3AED" /> 실물 리포트 원본 <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B45309", background: "#FEF3E2", borderRadius: 999, padding: "3px 9px", marginLeft: 6 }}>31p · 개인정보 마스킹 샘플</span></div>
          <div className="vh-actions">
            <button className="close" onClick={onClose}><X size={15} /> 닫기</button>
          </div>
        </div>
        <div className="vbody" style={{ background: "#EDF0F6" }}>
          {PAGES.map((src, i) => (
            <img key={src} src={src} alt={"리포트 " + (i + 1) + "쪽"} loading="lazy" style={{ display: "block", width: "100%", maxWidth: 860, margin: "0 auto 12px", borderRadius: 8, boxShadow: "0 6px 18px -10px rgba(20,30,70,.35)" }} />
          ))}
          <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748B", padding: "6px 0 14px" }}>프롬에이지 Premium 실물 리포트(이름·등록번호 마스킹) — 신청 시 내 검진 데이터 기준으로 동일 구성이 생성됩니다.</div>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ center, mode, onClose }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [done, setDone] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [bookRes, setBookRes] = useState(null);
  /* 무료 검진대비보험 — 동의 1탭(명시적 옵트인) + 건너뛰기 허용(강매 금지). Phase1 J2-3·J2-6 */
  const [insAgree, setInsAgree] = useState(true);
  const [insCert, setInsCert] = useState(null);
  /* 무료 건강검진분석 리포트(3무 오퍼 ②) — 상세 접이 + 실물 샘플(신청자 이름 개인화) */
  const [repOpen, setRepOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const dmU = (typeof demoCurrentUser === "function") ? demoCurrentUser() : null;
  const myAge = dmU && dmU.regAge ? dmU.regAge : 54;
  const mySex = dmU && dmU.sex ? dmU.sex : "남";
  const partnerCfg = getBooking(center);
  /* 예약 모달 안 위치 지도 — 선택한 센터의 실좌표 핀(카카오맵 길안내 포함) */
  const hiraBk = useHira();
  const bkGeo = React.useMemo(() => (typeof hiraMatchCoords === "function") ? hiraMatchCoords(hiraBk.data, center.name, center.ad || `${center.r || ""} ${center.area || ""}`) : null, [hiraBk.data, center.name, center.ad]);
  const onConfirm = () => {
    const r = submitCheckupBooking(center, { center: center.name, brand: center.b, date, time, plan: (typeof planName !== "undefined" ? planName : ""), items: center.tags, freeIns: insAgree });
    /* 동의 시 실제 증서 발급 — 카피가 아니라 체인 기록·금고 감사로그·증서 저장(J2-5) */
    if (insAgree) {
      try {
        const certId = "CERT-" + Date.now().toString(36).toUpperCase();
        let block = null;
        const m = dmU || (typeof selfMember === "function" ? selfMember() : null);
        if (m && typeof chainAppend === "function" && typeof anonToken === "function") {
          const tk = anonToken(m);
          block = chainAppend({ type: "ins-cert", token: tk, note: `무상 검진대비보험 증서 발급(${center.name})` });
          try { vaultAccessLog(tk, "member", "검진대비보험 증서 발급"); } catch (e) {}
        }
        const rec = { id: certId, center: center.name, date, time, at: Date.now(), hash: block ? block.hash : null };
        try { const l = JSON.parse(localStorage.getItem("hifin_ins_certs") || "[]"); l.push(rec); localStorage.setItem("hifin_ins_certs", JSON.stringify(l)); } catch (e) {}
        setInsCert(rec);
      } catch (e) {}
    } else {
      try { localStorage.setItem("hifin_ins_deferred", JSON.stringify({ center: center.name, date, at: Date.now() })); } catch (e) {}
    }
    /* 리퍼럴 행동 보상 — 초대로 가입한 회원의 첫 검진 예약 시 추천인에게 +300 HTK(1회) */
    try { if (typeof refActionComplete === "function" && dmU && dmU.email) { const ra = refActionComplete(dmU.email); if (ra && typeof toast === "function") toast(`추천인 ${ra.owner.name}님께 검진 완료 보상 +${ra.reward} HTK가 적립됐어요.`); } } catch (e) {}
    setBookRes(r); setDone(true);
  };
  const rm = bookRes ? bookRes.mode : "demo";
  const doneTitle = rm === "pending" ? "예약 요청이 접수되었습니다" : rm === "live-url" ? "한신메디피아 예약 페이지로 이동" : rm === "live-api" ? "예약이 전송되었습니다" : "예약이 확정되었습니다";
  const COVERS = (typeof CHECK_COVERS !== "undefined") ? CHECK_COVERS : [];
  // 플랜 매칭: 국가검진/공공→기본형, 50만 미만→표준형, 50만 이상→고급형
  const PLAN_MAP = {
    basic: { name: "기본형", sub: "국가건강검진 연계 · 무상", col: 2 },
    standard: { name: "표준형", sub: "종합검진 50만원 미만 · 무상", col: 3 },
    premium: { name: "고급형", sub: "프리미엄검진 50만원 이상 · 무상", col: 4 },
  };
  const planKey = center._plan ? center._plan : (mode === "nat" ? "basic" : ((center.price || 0) < 500000 ? "standard" : "premium"));
  const P = PLAN_MAP[planKey] || PLAN_MAP.basic;
  const planName = P.name, planSub = P.sub, baseIdx = P.col;
  const colIdx = baseIdx;
  const W = ["일", "월", "화", "수", "목", "금", "토"];
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 2); return d; });
  const slots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">{done ? "예약 완료" : "검진 예약"}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        {showSample && typeof OriginalReport === "function" && <OriginalReport name={dmU && dmU.name ? dmU.name : "조성래"} sample onClose={() => setShowSample(false)} />}
        {showPdf && <ReportPdfViewer onClose={() => setShowPdf(false)} />}
        <div className="bkb">
          {!done ? (<>
            <div style={{ background: "#F7F9FC", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{center.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {center.r} · {center.area}</div>
              {center._noPrice ? <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800, color: "var(--blue)" }}>{(center.tags && center.tags[0]) || "검진"} · 검진비 기관 문의 <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 600 }}>· 무상 검진대비보험 자동적용</span></div> : mode === "nat" ? <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "var(--green)" }}>공단검진 본인부담 0원 <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 600 }}>· 추가검사 별도</span></div> : <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>{won(center.price)} <span style={{ fontSize: 11, color: "var(--soft)", fontWeight: 600, textDecoration: "line-through" }}>{won(center.orig)}</span></div>}
            </div>
            {bkGeo && typeof MapView === "function" && (
              <div style={{ marginTop: 10 }}><MapView points={[{ name: center.name, addr: `${center.r} ${center.area}`, tel: bkGeo.tel, tag: "검진센터", lat: bkGeo.lat, lng: bkGeo.lng }]} height={185} /></div>
            )}
            {partnerCfg && (
              <div style={{ marginTop: 12, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: "#1D4ED8" }}>
                  <Network size={14} /> {partnerCfg.partner} UIP 실시간 예약 연동
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 999, background: partnerCfg.status === "live" ? "#DCFCE7" : "#FEF3C7", color: partnerCfg.status === "live" ? "#15803D" : "#B45309" }}>{partnerCfg.status === "live" ? "● 실시간 연동" : "연동 준비중"}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#475569", marginTop: 5, lineHeight: 1.5 }}>{partnerCfg.status === "live" ? `예약 확정 시 ${partnerCfg.partner} 예약 시스템으로 실시간 전송됩니다.` : partnerCfg.note}</div>
              </div>
            )}
            <div onClick={() => setInsOpen((v) => !v)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(120deg,#0E9F6E,#16A34A)", color: "#fff", borderRadius: 12, padding: "12px 14px", marginTop: 12, boxShadow: "0 12px 24px -16px rgba(16,163,74,.75)" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={20} color="#fff" /></span>
              <div style={{ flex: 1, fontSize: 12.8, fontWeight: 700, lineHeight: 1.5 }}>건강검진 예약과 동시에 <b style={{ color: "#FDE68A" }}>무상 건강검진 대비보험</b>이 자동 적용됩니다. <u>보장 조회 ›</u></div>
              <ChevronDown size={18} color="#fff" style={{ transform: insOpen ? "rotate(180deg)" : "none", transition: ".2s", flexShrink: 0 }} />
            </div>
            {insOpen && (<>
              {/* 3문장 설명(무엇·왜무료·언제얼마) + 내 나이·성별 예시 + 인수사 — 접이식(컴팩트) */}
              <div className="bkins3">
                <div className="bkins3row"><b>무엇을?</b><span>검진에서 큰 병이 발견되면 치료 준비금을 드리는 보험이에요.</span></div>
                <div className="bkins3row"><b>왜 무료?</b><span>하이핀 회원 혜택이라 보험료는 0원 — 추가 입력도 없어요.</span></div>
                <div className="bkins3row"><b>언제 얼마?</b><span>{myAge}세 {mySex}성 기준, 암·뇌졸중·급성심근경색 진단 확정 시 최대 1,000만 원이에요.</span></div>
                <div className="bkins3co">인수: 현대해상 전속대리점 글로벌예방금융㈜ · 실제 보장·인수는 보험사 심사에 따릅니다 · <button onClick={(e) => { e.stopPropagation(); try { window.dispatchEvent(new CustomEvent("agentask", { detail: "검진대비보험은 어떤 병까지 보장돼요?" })); } catch (err) {} }}>🤖 하이에게 물어보기</button></div>
              </div>
              <div className="bkins">
                <div className="bkinst"><BadgeCheck size={14} color="#16A34A" /> 적용 플랜 <b style={{ color: "#16A34A" }}>{planName}</b> <span>{planSub}</span></div>
                <div className="bkinsrows">{COVERS.map((r, i) => { const amt = r[colIdx]; if (!amt || amt === "-") return null; return (<div className="bkinsrow" key={i}><span>{r[1]}</span><b>{amt}</b></div>); })}</div>
                <div className="bkinsnote">※ 기본·표준·고급형은 검진 예약 시 <b>무상 자동적용</b>됩니다. 마음케어진단은 기본형 100만원·표준형 200만원·고급형 300만원이 포함됩니다. 실제 보장·인수는 보험사 심사에 따릅니다.</div>
              </div>
            </>)}
            {/* 3무 오퍼 ② — 무료 건강검진분석 리포트(프롬에이지 Premium · 시가 3만원) */}
            <div onClick={() => setRepOpen((v) => !v)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(120deg,#6D28D9,#7C3AED)", color: "#fff", borderRadius: 12, padding: "12px 14px", marginTop: 10, boxShadow: "0 12px 24px -16px rgba(124,58,237,.7)" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}><FileText size={20} color="#fff" /></span>
              <div style={{ flex: 1, fontSize: 12.8, fontWeight: 700, lineHeight: 1.5 }}>검진 후 <b style={{ color: "#FDE68A" }}>건강검진분석 리포트</b>(시가 3만 원)를 무료로 드려요. <u>내용 보기 ›</u></div>
              <ChevronDown size={18} color="#fff" style={{ transform: repOpen ? "rotate(180deg)" : "none", transition: ".2s", flexShrink: 0 }} />
            </div>
            {repOpen && (
              <div className="bkrep">
                <div className="bkrep-t"><FileText size={13} color="#7C3AED" /> 프롬에이지 Premium — 검진 한 번으로 받는 5부 분석</div>
                <div className="bkrep-rows">
                  <div className="bkrep-row"><b>① 종합분석</b><span>생체나이·노화등수·노화속도와 위험 요약을 한 장으로</span></div>
                  <div className="bkrep-row"><b>② 생체나이</b><span>비만체형 + 심장·간·췌장·신장 5대 장기나이</span></div>
                  <div className="bkrep-row"><b>③ 질병 위험도 9종</b><span>당뇨·고혈압·뇌졸중·치매 등 — 8등급 + 경고신호·예방가이드</span></div>
                  <div className="bkrep-row"><b>④ 암 위험도 10종</b><span>위·대장·폐·췌장암 등 — 동년배 대비 상대 위험도</span></div>
                  <div className="bkrep-row"><b>⑤ 의료비 예측</b><span>금년·10년 후 예상 의료비와 외래·입원 일수</span></div>
                </div>
                <div className="bkrep-note">국민건강보험공단 1,000만 명 11년 코호트 + 연세의료원 바이오뱅크 16만 명 자료로 검증된 분석이에요. 의학적 진단을 대신하지 않아요.</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <button className="bkrep-sample" onClick={(e) => { e.stopPropagation(); setShowSample(true); }}><FileText size={14} /> {dmU && dmU.name ? dmU.name : "회원"}님 이름으로 실물 샘플 보기</button>
                  <button className="bkrep-sample" onClick={(e) => { e.stopPropagation(); setShowPdf(true); }}><FileText size={14} /> 실제 리포트 원본 넘겨보기 (31p·개인정보 마스킹)</button>
                </div>
              </div>
            )}
            {/* 동의 1탭 — 무동의 자동가입 금지(J2-3) · 원치 않으면 해제 = 보험 없이 예약(J2-6) */}
            <label className={"bkinsagree" + (insAgree ? " on" : "")}>
              <input type="checkbox" checked={insAgree} onChange={(e) => setInsAgree(e.target.checked)} />
              <span className="ba-box">{insAgree ? "✓" : ""}</span>
              <span className="ba-t">{insAgree ? <>무료 검진대비보험을 함께 가입할게요 <i>(계약 전 알릴 사항 확인 — 가입 내역은 블록체인에 기록)</i></> : <>보험 없이 예약만 할게요 <i>(나중에 하이에게 "검진보험 가입해줘"라고 하면 언제든 가입돼요)</i></>}</span>
            </label>
            {typeof TrustLine === "function" && <TrustLine ctx="booking" />}
            <div className="bklbl">날짜 선택</div>
            <div className="cal">{days.map((d, i) => { const k = `${d.getMonth() + 1}/${d.getDate()}`; return (<div key={i} className={`calc ${date === k ? "on" : ""}`} onClick={() => setDate(k)}><div className="d">{d.getDate()}</div><div className="w">{W[d.getDay()]}</div></div>); })}</div>
            <div className="bklbl">시간 선택</div>
            <div className="slots">{slots.map((s) => <div key={s} className={`slot ${time === s ? "on" : ""}`} onClick={() => setTime(s)}>{s}</div>)}</div>
            <div className="bklbl">검진 항목</div>
            <div className="ctags">{center.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <button className="cbtn pri" style={{ opacity: date && time ? 1 : .5 }} disabled={!date || !time} onClick={onConfirm}><CalendarCheck size={15} /> {date && time ? `${date} ${time} 예약 확정` : "날짜·시간을 선택하세요"}</button>
          </>) : (
            <div className="bkconfirm">
              <div className="ic"><Check size={30} color="#16A34A" /></div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{doneTitle}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{center.name}<br />{date} {time}</div>
              {partnerCfg && rm === "pending" && (
                <div style={{ marginTop: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px", textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#B45309", display: "flex", alignItems: "center", gap: 6 }}><Network size={13} /> {partnerCfg.partner} UIP 연동 준비중</div>
                  <div style={{ fontSize: 11.5, color: "#92400E", marginTop: 4, lineHeight: 1.5 }}>예약 요청이 접수되었습니다. 연동 확정 시 <b>{partnerCfg.partner}로 실시간 전송</b>되며, 그 전까지는 아래 번호로 즉시 예약하실 수 있습니다.</div>
                  <a href={`tel:${partnerCfg.tel}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#2563EB", borderRadius: 8, padding: "7px 13px", textDecoration: "none" }}><Phone size={13} /> {partnerCfg.partner} 전화예약 {partnerCfg.tel}</a>
                </div>
              )}
              {partnerCfg && rm === "live-url" && (<div style={{ marginTop: 10, fontSize: 12, color: "#1D4ED8" }}>새 창에서 {partnerCfg.partner} 예약을 완료해 주세요.</div>)}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, textAlign: "left" }}>
                {insAgree ? (<>
                  <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#E7F8EE" }}><ShieldCheck size={18} color="#16A34A" /></span><div><b style={{ fontSize: 13 }}>보장이 시작되었습니다 — 무상 검진대비보험 {planName}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>추가 보험료 없이 검진 대비 보장(마음케어진단 포함)이 적용됩니다.</div></div></div>
                  <div className="resitem" style={{ margin: 0 }}><span className="ic"><BadgeCheck size={18} color="#7C3AED" /></span><div><b style={{ fontSize: 13 }}>증서 발급 완료{insCert ? ` — ${insCert.id}` : ""}</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{insCert && insCert.hash ? <>블록체인 기록 <b style={{ color: "#16A34A" }}>위변조 없음 ✓</b> · 해시 {String(insCert.hash).slice(0, 10)}… · 데이터 금고에서 확인</> : "지갑에 SBT 증서가 발행되고 알림톡이 발송됩니다."}</div></div></div>
                  <div className="resitem" style={{ margin: 0, background: "#FFF7ED", borderRadius: 10, padding: "8px 10px" }}><span className="ic" style={{ background: "#FFEDD5" }}><Bot size={18} color="#EA580C" /></span><div><b style={{ fontSize: 13 }}>하이의 한 줄 브리핑</b><div style={{ fontSize: 11.5, color: "#7C5230" }}>"{date} {time} 검진 예약과 보험 준비까지 끝났어요 — 검진 전날 제가 준비사항을 알려드릴게요."</div></div></div>
                </>) : (
                  <div className="resitem" style={{ margin: 0 }}><span className="ic" style={{ background: "#EEF1F8" }}><ShieldCheck size={18} color="#64748B" /></span><div><b style={{ fontSize: 13 }}>보험 없이 예약되었습니다</b><div style={{ fontSize: 11.5, color: "var(--muted)" }}>검진일 전에 하이가 한 번만 다시 안내드릴게요 — 언제든 "검진보험 가입해줘"라고 말씀하세요.</div></div></div>
                )}
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

/* ── 특수검진 — ①첨단 정밀검사(유전자·바이오마커) ②산업안전보건법 특수건강진단 ── */
const PRECISION_SCREEN = [
  { dz: "파킨슨병 조기진단", color: "#7C3AED", ic: Brain, desc: "도파민 신경 손상을 뇌 AI영상·혈액 단백질로 증상 전 조기 포착", orgs: [
    { name: "휴런 (Heuron)", desc: "AI 뇌 MRI로 흑질 나이그로좀·뉴로멜라닌을 정량 — 파킨슨 조기진단 보조(정확도 90%+, 식약처 2등급 의료기기)", partner: true },
    { name: "피플바이오", desc: "혈액 내 알파-시누클레인 응집체 측정(CSIC·RT-QuIC 기반) 파킨슨 조기진단 기술" },
  ] },
  { dz: "치매(알츠하이머) 조기진단", color: "#2563EB", ic: Activity, desc: "혈액 한 방울로 아밀로이드·타우 등 바이오마커 위험을 평가", orgs: [
    { name: "피플바이오 알츠온(AlzOn)", desc: "혈액 베타-아밀로이드 응집도(MDS)로 알츠하이머 위험 평가" },
    { name: "퀀타매트릭스 알츠플러스", desc: "아밀로이드 베타 + LGALS3BP·ACE·페리오스틴 등 4종 바이오마커 통합 분석" },
  ] },
  { dz: "암 조기진단 (액체생검·유전자)", color: "#DC2626", ic: ShieldCheck, desc: "혈액 속 종양 DNA(ctDNA)·메틸화로 다종 암을 조기에 선별", orgs: [
    { name: "아이엠비디엑스(IMBDx) 캔서파인드", desc: "혈액 ctDNA·cfDNA 메틸레이션을 AI로 분석 — 다종 암 혈액 조기검진" },
    { name: "지노믹트리 얼리텍(EarlyTec)", desc: "메틸화 DNA 기반 대장암 등 조기진단" },
    { name: "젠큐릭스", desc: "액체생검 기반 암 예후·조기진단 검사" },
  ] },
  { dz: "발달장애·아동 질병예방 (유전체)", color: "#16A34A", ic: Users, desc: "신생아·아동 유전체로 선천질환·발달 위험을 조기 확인", orgs: [
    { name: "EDGC 지스캐닝", desc: "신생아 유전체 분석 — 선천성 염색체 이상·발달 관련 위험 조기 확인" },
    { name: "마크로젠 젠톡", desc: "질병예측 유전자검사(DTC) — 예방 중심 정밀의학" },
  ] },
];
/* 제휴사(샘플) 상세 혜택 — 휴런(Heuron) */
const PRECISION_PARTNERS = {
  "휴런 (Heuron)": {
    tagline: "AI 뇌영상 정밀검사 · 파킨슨·치매 조기진단",
    color: "#7C3AED",
    tech: "MRI 기반 AI가 뇌 흑질의 나이그로좀·뉴로멜라닌을 정량 분석해 파킨슨병을 증상 전 조기 진단 보조합니다. 정확도 90%+, 식약처 2등급 의료기기 인증(휴런NM·mPDia).",
    benefits: [
      ["정밀검사 우대가", "HI-Fin 회원 대상 휴런 AI 뇌영상 정밀검사 제휴 할인가 적용", Percent, "#7C3AED"],
      ["검사 후 지속케어", "검사 결과를 AI 주치의·데이터 하우스와 연동해 정기 추적·재검 알림 등 평생 케어", Activity, "#2563EB"],
      ["무상 검진대비보험", "정밀검사 예약 시 무상 건강검진 대비보험 자동 적용(마음케어진단 포함)", ShieldCheck, "#16A34A"],
      ["공공기관 지원 연계", "치매안심센터·지자체 어르신 건강지원·바우처 등 공공 지원제도와 연계 안내", Landmark, "#F59E0B"],
    ],
  },
};
function SpecialCheckup() {
  const [spot, setSpot] = useState(null);
  const TYPES = [
    ["배치전 건강진단", "유해업무 배치 전 기초 건강 상태 평가"],
    ["정기 특수건강진단", "유해인자별 주기(6~24개월) 정기 검진"],
    ["수시 건강진단", "직업성 증상·소견 발생 시 수시 실시"],
    ["임시 건강진단", "집단 발병 우려 시 지방고용노동청 명령"],
  ];
  const HAZARDS = [
    ["소음·진동", "청력·근골격"], ["분진(광물·목재)", "폐기능·흉부"],
    ["유기용제·중금속", "간·신장·혈액"], ["야간작업", "심혈관·수면"], ["방사선", "혈액·갑상선"],
  ];
  return (
    <>
      <div className="card" style={{ borderTop: "3px solid #7C3AED" }}>
        <div className="rct"><Sparkles size={18} color="#7C3AED" /> 첨단·특수 정밀검사 — 유전자 · 단백질 바이오마커 · AI영상</div>
        <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}>일반 검진으로 잡기 어려운 <b>파킨슨·치매·암·발달장애</b>를 <b>유전자·특수 단백질(바이오마커)·AI 뇌영상</b>으로 증상 전 조기 예측·선별하는 첨단 검사 기술과 대표 기관입니다. HI-Fin은 이들 정밀검사 기관과 연계해 <b>초기 위험 발굴 → 예방·관리</b>로 잇습니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10, marginTop: 10 }}>
          {PRECISION_SCREEN.map((g, i) => { const Ic = g.ic; return (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 14px", borderLeft: "4px solid " + g.color }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 900, color: g.color }}><Ic size={16} /> {g.dz}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "4px 0 6px", lineHeight: 1.5 }}>{g.desc}</div>
              {g.orgs.map((o, j) => (
                <div key={j} style={{ marginTop: 8, padding: o.partner ? "9px 10px" : 0, background: o.partner ? "#F5F3FF" : "transparent", border: o.partner ? "1px solid #DDD6FE" : "none", borderRadius: o.partner ? 10 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#12203F" }}>{o.name}</span>
                    {o.partner && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#7C3AED", background: "#EDE9FE", padding: "2px 7px", borderRadius: 999 }}>✨ 제휴사</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 1.45 }}>{o.desc}</div>
                  {o.partner
                    ? <button onClick={() => setSpot(o.name)} style={{ marginTop: 8, fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#7C3AED", border: "none", borderRadius: 8, padding: "6px 13px", cursor: "pointer" }}>제휴 혜택 보기 ›</button>
                    : <button onClick={() => openConsult("정밀검사 상담 — " + o.name)} style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: "#475569", background: "#F1F5F9", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 13px", cursor: "pointer" }}>상담 문의</button>}
                </div>
              ))}
            </div>
          ); })}
        </div>
        <div className="socsplit-extra" style={{ marginTop: 12 }}><Sparkles size={13} color="#7C3AED" /> HI-Fin 연계(예정): 정밀검사 결과를 <b>AI 주치의·데이터 하우스</b>와 연동해 개인 맞춤 예방·추적으로 순환</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 상기 기술·기관은 국내 대표 사례를 조사·정리한 것으로 대부분 <b>선별·진단 보조 목적</b>이며 확진을 대체하지 않습니다. 실제 검사는 의료기관 처방·전문의 상담이 필요하며 제휴·연계는 예정입니다. (출처: 각 사·식약처·언론보도)</div>
      </div>
      <div className="card" style={{ borderTop: "3px solid #EA580C", marginTop: 14 }}>
        <div className="rct"><AlertTriangle size={18} color="#EA580C" /> 특수건강진단 (산업안전보건법)</div>
        <p style={{ fontSize: 13, color: "#3a4659", lineHeight: 1.6 }}><b>유해인자에 노출되는 근로자</b>의 직업병을 조기 발견·예방하기 위해 사업주가 실시하는 법정 건강진단입니다. HI-Fin은 특수건강진단 지정기관과 연계해 <b>기업 근로자 검진 여정</b>을 관리합니다.</p>
        <div className="bklbl" style={{ marginTop: 6 }}>진단 유형</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
          {TYPES.map(([t, d], i) => (<div key={i} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 12px" }}><b style={{ fontSize: 12.5, color: "#C2410C" }}>{t}</b><div style={{ fontSize: 11, color: "#9A3412", marginTop: 3, lineHeight: 1.4 }}>{d}</div></div>))}
        </div>
        <div className="bklbl" style={{ marginTop: 12 }}>주요 유해인자 · 검사</div>
        <div className="ctags">{HAZARDS.map(([h, e], i) => <span key={i} style={{ background: "#FFEDD5", color: "#C2410C", border: "none", fontWeight: 700 }}>{h} → {e}</span>)}</div>
        <div className="chnote" style={{ marginTop: 10 }}>※ 대상 유해인자·검진 주기는 산업안전보건법 시행규칙에 따릅니다. 실제 대상 여부·주기는 사업장 작업환경측정·전문기관 확인이 필요합니다.</div>
      </div>
      <div style={{ marginTop: 14 }}><BrandDirectory catFilter="special" /></div>
      {spot && <PrecisionPartnerModal name={spot} onClose={() => setSpot(null)} />}
    </>
  );
}

/* 제휴사 스포트라이트 모달 — 브랜드 AI 뇌영상 비주얼 + 혜택 */
function PartnerBrainArt({ color }) {
  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", display: "block" }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><radialGradient id="pbg" cx="50%" cy="45%" r="65%"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient></defs>
      <rect width="200" height="120" fill="#0B1220" /><rect width="200" height="120" fill="url(#pbg)" />
      {/* scan lines */}
      <g stroke={color} strokeOpacity=".18" strokeWidth="1">{Array.from({ length: 9 }, (_, i) => <line key={i} x1="0" y1={13 * i + 8} x2="200" y2={13 * i + 8} />)}</g>
      {/* brain outline */}
      <path d="M70 78c-16-2-22-16-16-27 -4-12 8-24 22-20 6-9 24-9 30 0 14-4 26 8 22 20 6 11 0 25-16 27 -3 9-19 9-21 0 -1 2-2 2-3 2 -1 0-2 0-3-2 -2 9-18 9-21 0z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M100 34v46M84 46c8 4 8 12 0 16M116 46c-8 4-8 12 0 16M76 62c6 2 10 0 12-4M124 62c-6 2-10 0-12-4" fill="none" stroke={color} strokeWidth="1.6" strokeOpacity=".8" strokeLinecap="round" />
      {/* AI nodes */}
      <g fill={color}>{[[52, 40], [148, 44], [44, 84], [156, 86], [100, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}</g>
      <g stroke={color} strokeOpacity=".5" strokeWidth="1">{[[52, 40, 84, 46], [148, 44, 116, 46], [44, 84, 76, 62], [156, 86, 124, 62], [100, 100, 100, 80]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} />)}</g>
      <text x="100" y="115" textAnchor="middle" fontSize="8" fill={color} fontWeight="700" fontFamily="system-ui">AI Brain MRI · Nigrosome</text>
    </svg>
  );
}
function PrecisionPartnerModal({ name, onClose }) {
  const p = PRECISION_PARTNERS[name]; if (!p) return null;
  return (
    <div className="bkov" onClick={onClose}>
      <div className="bk" onClick={(e) => e.stopPropagation()}>
        <div className="bkh"><div className="bt">제휴사 · {name}</div><button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}><X size={20} color="#8A97AE" /></button></div>
        <div className="bkb">
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}><PartnerBrainArt color={p.color} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#12203F" }}>{name}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: p.color, padding: "3px 9px", borderRadius: 999 }}>✨ HI-Fin 제휴사</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginTop: 3 }}>{p.tagline}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.6 }}>{p.tech}</div>
          <div className="bklbl" style={{ marginTop: 12 }}>HI-Fin 회원 제휴 혜택</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {p.benefits.map(([t, d, Ic, col], i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 13px", borderTop: "3px solid " + col }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: col + "1A", display: "grid", placeItems: "center" }}><Ic size={17} color={col} /></span>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#12203F", marginTop: 7 }}>{t}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3, lineHeight: 1.45 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="cbtn pri" style={{ margin: 0 }} onClick={() => { onClose(); openConsult("정밀검사 예약·상담 — " + name); }}><CalendarCheck size={15} /> 정밀검사 예약·상담</button>
            <button className="cbtn" style={{ margin: 0 }} onClick={() => { onClose(); openConsult("제휴 혜택 문의 — " + name); }}>혜택 문의</button>
          </div>
          <div className="chnote" style={{ marginTop: 10 }}>※ 제휴 혜택·할인율·보장은 설계 예시(예정)이며, 실제 검사·보장·지원은 제휴기관·보험사·공공기관 정책 및 의료진 상담에 따릅니다.</div>
        </div>
      </div>
    </div>
  );
}

/* ── 공공검진지원 — 노인 건강지원·장애아동 재활지원 (나눔 연계) ── */
function SupportCard({ t, d, src, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px", borderLeft: "4px solid " + color }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#12203F" }}>{t}</div>
      <div style={{ fontSize: 12, color: "#475569", marginTop: 5, lineHeight: 1.55 }}>{d}</div>
      <div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 6 }}>근거·출처: {src}</div>
    </div>
  );
}
function PublicSupport() {
  const ELDER = [
    ["치매안심센터 무료 조기검진", "만 60세 이상 누구나 무료 치매 조기검진 · 진단검사비 최대 15만원·감별검사비 최대 11만원 지원(중위소득 120% 이하)", "보건복지부·치매안심센터"],
    ["노인맞춤돌봄서비스", "65세 이상 취약 노인 대상 안전확인·건강관리·사회참여 등 맞춤 돌봄 제공", "보건복지부"],
    ["치매 치료관리비 지원", "만 60세 이상 치매환자 진료비·약제비 본인부담 월 3만원 한도(중위소득 140% 이하)", "보건복지부"],
    ["노인성 질환 의료비 지원", "노인성 질환 예방·조기발견·치료에 필요한 비용 전부/일부 지원(국가·지자체)", "노인복지법"],
    ["노인 의료·돌봄 통합지원", "살던 곳에서 의료·요양·돌봄을 통합 제공하는 시범사업", "보건복지부·건보공단"],
  ];
  const KID = [
    ["발달재활서비스 바우처", "만 18세 미만 등록장애아동(중위소득 180% 이하)에게 언어·미술·음악·행동·놀이·심리운동 재활치료 바우처 지원", "장애아동복지지원법 제21조"],
    ["발달재활 제공기관", "장애인복지관·시·군·구 지정기관에서 서비스 제공(사회서비스 전자바우처에서 지역 기관 검색)", "사회서비스전자바우처"],
    ["권역 공공어린이재활병원", "장애·중증 아동의 재활치료·의료를 지역에서 받을 수 있는 공공 재활의료 기반", "보건복지부"],
    ["장애 조기발견·발달진단", "장애 조기발견 및 발달진단·부모상담 지원(9세 미만 장애 예견 아동 포함)", "발달재활서비스"],
  ];
  return (
    <>
      <div style={{ background: "linear-gradient(120deg,#0E9F6E,#16A34A)", color: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}><HeartHandshake size={18} /> 공공검진지원 — 건강 형평성을 위한 나눔</div>
        <p style={{ fontSize: 12.5, opacity: .95, marginTop: 6, lineHeight: 1.6 }}>HI-Fin이 지향하는 <b>어르신 건강</b>과 <b>장애아동 재활</b> 지원 제도·기관을 안내하고, 판매마진 나눔을 이 영역으로 순환시킵니다.</p>
      </div>

      <div className="card" style={{ borderTop: "3px solid #4F46E5" }}>
        <div className="rct"><Users size={18} color="#4F46E5" /> 어르신 건강·의료비 지원</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 9, marginTop: 8 }}>
          {ELDER.map((e, i) => <SupportCard key={i} t={e[0]} d={e[1]} src={e[2]} color="#4F46E5" />)}
        </div>
        <div className="socsplit-extra" style={{ marginTop: 12 }}><Sparkles size={13} color="#4F46E5" /> HI-Fin 연계(예정): <b>한국노인나눔재단</b>과 함께 판매마진 나눔을 <b>어르신 치료비 사각지대</b> 지원으로 순환</div>
      </div>

      <div className="card" style={{ borderTop: "3px solid #DB2777", marginTop: 14 }}>
        <div className="rct"><Activity size={18} color="#DB2777" /> 장애아동 재활 지원</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 9, marginTop: 8 }}>
          {KID.map((e, i) => <SupportCard key={i} t={e[0]} d={e[1]} src={e[2]} color="#DB2777" />)}
        </div>
        <div className="socsplit-extra" style={{ marginTop: 12 }}><Sparkles size={13} color="#DB2777" /> HI-Fin 연계(예정): <b>잼잼테라퓨틱스 · 장애아동복지 재단</b> 등과 함께 <b>장애아동 재활치료</b> 지원</div>
      </div>

      <button className="cbtn" style={{ marginTop: 12 }} onClick={() => openConsult("공공검진지원·나눔 문의")}><MessageSquare size={15} /> 공공검진지원·나눔 참여 문의</button>
      <div className="chnote" style={{ marginTop: 10 }}>※ 제도·지원금·대상 기준은 정부·지자체 정책(2025 기준)이며 변동될 수 있습니다. 제휴기관·연계는 예정이며, 실제 지원은 각 기관·제도의 신청·심사 절차에 따릅니다. 정확한 내용은 보건복지부·정부24·사회서비스전자바우처에서 확인하세요.</div>
    </>
  );
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

/* ====================== 병원/약국예약 (심평원 공공데이터 연동) ====================== */
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
/* 검진센터 전체(51곳) 좌표 일괄 매칭 — 심평원 8만 행을 '한 번만' 스캔해 캐시(성능: 51×80k → 1×80k) */
let _chkGeoCache = null;
function checkupGeoAll(data) {
  if (_chkGeoCache) return _chkGeoCache;
  try {
    if (!data || typeof CHECKUP_INST === "undefined") return {};
    const nz = (s) => String(s || "").replace(/\s/g, "");
    const nrm = (s) => String(s || "").replace(/\s|\(주\)|\(사\)|의료법인|재단법인|KMI/g, "");
    const T = CHECKUP_INST.map((c) => {
      const toks = String(c.ad || "").trim().split(/\s+/);
      const roadM = /([가-힣A-Za-z0-9·]+(?:로|길)\s*\d+(?:-\d+)?)/.exec(String(c.ad || ""));
      return { key: c.n, road: roadM ? nz(roadM[1]) : null, sgg: toks.length > 1 && /(시|군|구)$/.test(toks[1]) ? toks[1] : null, nm: nrm(c.n), hit: null };
    });
    const H = data.hospitals || [];
    for (let i = 0; i < H.length; i++) {
      const h = H[i]; if (!h[8] || !h[9]) continue;
      const ha = nz(h[4]); let n2 = null;
      for (let j = 0; j < T.length; j++) {
        const t = T[j]; if (t.hit) continue;
        if (t.road && ha.indexOf(t.road) >= 0 && (!t.sgg || ha.indexOf(t.sgg) >= 0)) { t.hit = h; continue; }
        if (t.nm.length >= 3 && (!t.sgg || ha.indexOf(t.sgg) >= 0)) {
          if (n2 === null) n2 = nrm(h[0]);
          if (n2 && (n2 === t.nm || n2.indexOf(t.nm) >= 0 || t.nm.indexOf(n2) >= 0)) t.hit = h;
        }
      }
    }
    const out = {};
    T.forEach((t) => { if (t.hit) out[t.key] = { lat: t.hit[9], lng: t.hit[8], addr: t.hit[4], tel: t.hit[5] }; });
    _chkGeoCache = out;
    return out;
  } catch (e) { return {}; }
}

/* 기관 → 심평원 실좌표 매칭(Phase 4 공용) — ①주소(도로명+번지) 우선 ②같은 시군구 내 이름 매칭 폴백.
   이름만으로 매칭하면 협회 지점처럼 유사 명칭이 타지역을 잡는 오류가 있어 주소를 1순위로 사용. */
function hiraMatchCoords(data, name, addr) {
  try {
    if (!data) return null;
    const H = data.hospitals || [];
    const nz = (s) => String(s || "").replace(/\s/g, "");
    const toks = String(addr || "").trim().split(/\s+/);
    const sgg = toks.length > 1 && /(시|군|구)$/.test(toks[1]) ? toks[1] : null;
    const roadM = /([가-힣A-Za-z0-9·]+(?:로|길)\s*\d+(?:-\d+)?)/.exec(String(addr || ""));
    const road = roadM ? nz(roadM[1]) : null;
    if (road) {
      for (let i = 0; i < H.length; i++) { const h = H[i]; if (!h[8] || !h[9]) continue; const ha = nz(h[4]); if (ha.indexOf(road) >= 0 && (!sgg || ha.indexOf(sgg) >= 0)) return { lat: h[9], lng: h[8], addr: h[4], tel: h[5] }; }
    }
    const norm = (s) => String(s || "").replace(/\s|\(주\)|\(사\)|의료법인|재단법인|KMI/g, "");
    const t = norm(name); if (t.length < 3) return null;
    let hit = null;
    for (let i = 0; i < H.length; i++) { const h = H[i]; const n2 = norm(h[0]); if (!h[8] || !h[9] || !n2) continue; if (sgg && nz(h[4]).indexOf(sgg) < 0) continue; if (n2 === t || n2.indexOf(t) >= 0 || t.indexOf(n2) >= 0) { hit = h; if (n2 === t) break; } }
    return hit ? { lat: hit[9], lng: hit[8], addr: hit[4], tel: hit[5] } : null;
  } catch (e) { return null; }
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
/* 의료법 준수 — 특정 의료기관만 선별 노출하면 환자 유인·알선 소지가 있어 전 기관 전수 표시(클러스터). */
const MAP_CAP = 120000;
const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 약국 운영정보(예시·추정): 심평원 기본데이터엔 운영시간이 없어 약국명 기반 결정적 해시로 생성.
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
/* 길안내 — 카카오맵 링크(웹·모바일 앱 연동). Phase 4: OSM 대체, 미리보기에서도 노출 */
const kakaoHref = (name, lat, lng) => `https://map.kakao.com/link/to/${encodeURIComponent(name || "목적지")},${lat},${lng}`;
const popupLink = (name, lat, lng) => `<br><a href="${kakaoHref(name, lat, lng)}" target="_blank" rel="noreferrer" style="color:#D97706;font-weight:800">🚕 카카오맵 길안내 ›</a>`;

// Leaflet(OpenStreetMap) 지도 — window.L (UMD)로 로드, 마커클러스터 있으면 사용.
function MapView({ points, accent, focus, height, cap }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const LIM = cap || MAP_CAP;
  const valid = React.useMemo(() => (points || []).filter((p) => p.lat && p.lng).slice(0, LIM), [points, LIM]);
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
    valid.forEach((p, i) => {
      const m = L.marker([p.lat, p.lng]);
      m.bindPopup(`<div style="font-size:12.5px;line-height:1.5;min-width:150px"><b>${escHtml(p.name)}</b>${p.tag ? ` <span style="color:${accent || "#2563EB"};font-weight:700">· ${escHtml(p.tag)}</span>` : ""}<br>${escHtml(p.addr)}${p.tel ? `<br>☎ ${escHtml(p.tel)}` : ""}${p.hrs ? `<br>🕐 ${escHtml(p.hrs)}` : ""}${popupLink(p.name, p.lat, p.lng)}${p._bk ? `<br><a href="#" class="mapbk" data-i="${i}" style="color:#16A34A;font-weight:800">✅ 이 기관 바로 예약 ›</a>` : ""}</div>`);
      group.addLayer(m); bounds.push([p.lat, p.lng]);
    });
    group._pts = valid;
    group.addTo(map); layerRef.current = group;
    /* 핀 팝업의 '바로 예약' — 지도에서 나가지 않고 예약 모달로(Phase 4 K2-3) */
    if (!map._bkWired) {
      map.on("popupopen", (e) => {
        try { const el = e.popup.getElement().querySelector(".mapbk"); if (el) el.onclick = (ev) => { ev.preventDefault(); const bi = parseInt(el.getAttribute("data-i"), 10); const pts = (layerRef.current && layerRef.current._pts) || []; if (pts[bi] && pts[bi]._bk) window.dispatchEvent(new CustomEvent("mapbook", { detail: pts[bi]._bk })); }; } catch (err) {}
      });
      map._bkWired = true;
    }
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
      .setContent(`<div style="font-size:12.5px;line-height:1.5"><b>${escHtml(focus.name)}</b>${focus.addr ? `<br>${escHtml(focus.addr)}` : ""}${popupLink(focus.name, focus.lat, focus.lng)}</div>`).openOn(map);
  }, [focus]);
  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);
  /* GPS 내 위치 — 위치 권한 허용 시 실제 현재 위치로 이동(Phase 4 K2-2) */
  const locate = () => {
    try {
      if (!navigator.geolocation) { if (typeof toast === "function") toast("이 기기에서 위치 기능을 지원하지 않아요."); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
        const L = window.L; const map = mapRef.current; if (!map || !L) return;
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 14, { animate: true });
        L.circleMarker([latitude, longitude], { radius: 8, color: "#2563EB", fillColor: "#3B82F6", fillOpacity: .75 }).addTo(map).bindPopup("📍 내 위치").openPopup();
      }, () => { if (typeof toast === "function") toast("위치 권한이 꺼져 있어요 — 회원 주소 기준으로 안내해 드려요."); }, { timeout: 6000 });
    } catch (e) {}
  };
  if (!window.L) return <div className="hload" style={{ marginTop: 0 }}>지도를 불러오지 못했습니다. (인터넷 연결·Leaflet 로드 확인)</div>;
  const noCoord = (points || []).length > 0 && valid.length === 0;
  return (
    <div>
      <div style={{ position: "relative" }}>
        <div ref={ref} style={{ height: height || 360, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }} />
        <button className="maploc" onClick={locate}><MapPin size={12} /> 내 위치</button>
      </div>
      <div style={{ fontSize: 11, color: "var(--soft)", marginTop: 6 }}>{noCoord ? "좌표 정보가 없어 위치를 표시할 수 없습니다." : "지도 © OpenStreetMap 기여자 · 좌표 출처: 심평원 공공데이터"}{points && points.length > LIM ? ` · 표시 ${LIM.toLocaleString()}/${points.length.toLocaleString()}곳(상위)` : ""}</div>
    </div>
  );
}

/* ══ 통합 기관 지도(Phase 4.5) — 병원·약국·검진센터·재가를 한 지도에서 유형 토글(K2-1).
   재가 데이터 로더(loadHomecare)는 Homecare.jsx의 기존 것을 재사용. ══ */
function UnifiedMapCard({ data }) {
  const [on, setOn] = useState({ hosp: true, pharm: false, chk: true, care: false });
  const [scope, setScope] = useState("near");
  const [hc, setHc] = useState(null);
  const [openMap, setOpenMap] = useState(true);
  useEffect(() => { let ok = true; loadHomecare().then((d) => { if (ok) setHc(d); }).catch(() => {}); return () => { ok = false; }; }, []);
  const reg = (typeof memberRegion === "function") ? memberRegion() : null;
  const sidoShort = reg ? reg.sidoShort : "서울";
  const pts = React.useMemo(() => {
    const out = [];
    const inScope = (s) => scope === "all" || String(s || "").indexOf(sidoShort) >= 0;
    if (data && on.hosp) {
      const set = new Set(data.sido.map((s, i) => [s, i]).filter(([s]) => inScope(s)).map(([, i]) => i));
      for (const h of data.hospitals) { if (!set.has(h[2]) || !h[8] || !h[9]) continue; out.push({ name: h[0], addr: h[4], tel: h[5], tag: data.type[h[1]], lat: h[9], lng: h[8], hrs: h[10] || "", _bk: { kind: "hospital", h } }); }
    }
    if (data && on.pharm) {
      const set = new Set(data.sido.map((s, i) => [s, i]).filter(([s]) => inScope(s)).map(([, i]) => i));
      for (const p of data.pharmacies) { if (!set.has(p[1]) || !p[5] || !p[6]) continue; out.push({ name: p[0], addr: p[3], tel: p[4], tag: "약국", lat: p[6], lng: p[5] }); }
    }
    if (data && on.chk && typeof CHECKUP_INST !== "undefined") {
      const geo = checkupGeoAll(data);
      CHECKUP_INST.forEach((c) => { if (!inScope(c.sd)) return; const g = geo[c.n]; if (g) out.push({ name: c.n, addr: c.ad, tel: c.p !== "-" ? c.p : "", tag: "검진센터", lat: g.lat, lng: g.lng, _bk: { kind: "checkup", center: c } }); });
    }
    if (hc && on.care) {
      for (const v of (hc.providers || [])) { const sname = (hc.sido || [])[v[1]]; if (!inScope(sname) || !v[6] || !v[7]) continue; out.push({ name: v[0], addr: v[3], tel: v[4], tag: "재가·요양", lat: v[7], lng: v[6] }); }
    }
    return out;
  }, [data, hc, on, scope, sidoShort]);
  const TOG = [["hosp", "병원", "#2563EB"], ["pharm", "약국", "#16A34A"], ["chk", "검진센터", "#7C3AED"], ["care", "재가·요양", "#DB2777"]];
  return (
    <div className="mapcard">
      <div className="maphead" onClick={() => setOpenMap((v) => !v)}>
        <div className="mt"><MapPin size={16} color="#2F5BEA" /> 통합 기관 지도 <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>({scope === "near" ? sidoShort + " 기준" : "전국"} · {pts.length.toLocaleString()}곳 · 핀에서 예약)</span></div>
        <ChevronDown size={18} color="#9AA6BC" style={{ transform: openMap ? "rotate(180deg)" : "none", transition: ".2s" }} />
      </div>
      {openMap && (<>
        <div className="umtogs" onClick={(e) => e.stopPropagation()}>
          {TOG.map(([k, t, col]) => <button key={k} className={"umtog" + (on[k] ? " on" : "")} style={on[k] ? { background: col, borderColor: col } : null} onClick={() => setOn({ ...on, [k]: !on[k] })}>{t}</button>)}
          <button className={"umtog" + (scope === "all" ? " on" : "")} style={scope === "all" ? { background: "#0F172A", borderColor: "#0F172A" } : null} onClick={() => setScope(scope === "all" ? "near" : "all")}>전국 보기</button>
        </div>
        <div style={{ marginTop: 8 }}><MapView points={pts} accent="#2563EB" cap={120000} /></div>
        <div style={{ fontSize: 10.5, color: "var(--soft)", marginTop: 4 }}>전체 {pts.length.toLocaleString()}곳을 클러스터(숫자 원)로 묶어 전수 표시해요 — 확대할수록 개별 핀으로 펼쳐집니다. ※ 심평원 공공데이터 기반 <b>전 의료기관 정보 제공</b>이며, 특정 의료기관의 추천·유인·알선이 아닙니다(의료법 준수).</div>
        {hc && hc.meta && hc.meta.demo && on.care && <div style={{ fontSize: 10.5, color: "#B45309", marginTop: 5 }}>⚠ 재가·요양 기관은 시연용 예시 데이터예요 — 장기요양기관 공시 실데이터로 교체 예정(tools/homecare_ingest.py).</div>}
      </>)}
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

