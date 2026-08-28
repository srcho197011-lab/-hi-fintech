/* ══════════════ 브랜드·고유명 토큰(brandTokens.js) — 설계 프롬프트 v2.1 §3-3 ══════════════
   제품·시스템 고유명의 단일 소스. 신규 산출물(인벤토리·코퍼스·신규 가이드 문구·콘솔 표기)은
   고유명을 리터럴로 쓰지 않고 이 토큰을 참조한다 — 이름이 바뀌면 여기 1곳 수정 + 재생성으로 전체가 따라온다.
   ⚠️ 범위: 신규 산출물 전용(빌드타임 치환). 기존 검증 문구의 소급 치환은 별도 승인 항목(§A2).
   구명칭은 label을 바꿀 때 aliases로 강등한다 — 회원은 옛 이름으로 계속 묻는다. */
const BRAND_TOKENS = [
  { token: "PLATFORM",  label: "하이핀",           aliases: ["하이핀텍", "하이핀테크", "hifin", "hi-fin", "hifintech"] },
  { token: "AGENT",     label: "하이",             aliases: ["하이 매니저", "AI 매니저", "하이 에이전트"] },
  { token: "COMPANY",   label: "하이젠케어",        aliases: ["글로벌예방금융", "하이젠케어(주)"] },
  { token: "PRO",       label: "헬스메이트 프로",    aliases: ["헬스메이트", "전문헬스메이트", "프로", "플래너"] },
  { token: "POINT",     label: "HTK",              aliases: ["적립금", "포인트", "건강토큰", "htk"] },
  { token: "FREE3",     label: "무료 3종 서비스",    aliases: ["무료3종", "3종서비스", "3종 세트"] },
  { token: "CHECKINS",  label: "검진대비보험",       aliases: ["무료보험", "검진보험", "건강검진대비보험"] },
  { token: "WALLETSEC", label: "나의 건강지갑",      aliases: ["건강지갑", "건강금융지갑"] },
  { token: "DOCK",      label: "하이 대화창",        aliases: ["하이 독", "AI 대화창"] },
];
/* 토큰 → 현재 라벨. 미등록 토큰은 그대로 반환(치환 실패를 조용히 삼키지 않도록 생성기에서 검증) */
function brandT(token) { const b = BRAND_TOKENS.find((x) => x.token === token); return b ? b.label : token; }
/* "{PLATFORM}" 꼴 문자열 치환 — 생성기(빌드타임)와 콘솔 표기에서 사용 */
function brandFill(str) { return String(str || "").replace(/\{([A-Z0-9_]+)\}/g, (_, t) => brandT(t)); }
/* 별칭 전개(질문 이해용) — label + aliases 전부 */
function brandAliases(token) { const b = BRAND_TOKENS.find((x) => x.token === token); return b ? [b.label].concat(b.aliases) : []; }
