/* ====================== 파일럿 체험회원 10,000명 · 가족(가구) 온톨로지 코호트 ======================
   결정적(mulberry32 시드) 생성기 — 매 로드 동일 데이터(재현 가능).
   ▸ 정합성 규칙: 진료과목·질병에 성별/연령 제약을 적용(남성 산부인과·여성 전립선암·청년 골다공증 등 방지).
   ▸ 가족(가구) 구조: 가구주·배우자·자녀·부(父)·모(母) 관계 + 연령/성별 정합성.
   ▸ 실제 온톨로지(DEPT_CATS·CHECKUP_ONTOLOGY·DISEASE_INSURANCE) 재사용. (시연용 합성·가명 데이터) */

function _mul32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function _pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function _wpick(rng, pairs) { const tot = pairs.reduce((s, p) => s + p[1], 0); let r = rng() * tot; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[0][0]; }
function _ri(n) { return Math.max(0, Math.round(n)); }

const _SURN = "김이박최정강조윤장임한오서신권황안송전홍고문양손배백허유남심노정하곽성차주우구민".split("");
const _GIVN_M = ["민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "준우", "현우", "건우", "우진", "선우", "서진", "정우", "승현", "유준", "은우", "지훈", "준서", "도현", "현준", "성민", "재윤", "동현", "태윤", "민재", "형준", "지환", "찬호", "영수", "종석", "상철", "광호", "덕수", "병철", "정호", "기훈", "재민", "우성", "준혁", "시윤", "이준", "서우", "하율", "지오", "시온", "라온", "은호", "유찬", "지운", "준영", "도경", "태오", "이안", "하람", "지율", "준수", "민규", "성현", "재현", "동욱", "상현", "규민", "세훈", "진우", "호준", "원준", "규현", "태현", "승우", "지성", "현서", "시현", "병국", "종배", "상수", "만수", "달수", "봉주"];
const _GIVN_F = ["서연", "서윤", "지우", "서현", "하은", "하윤", "민서", "지유", "윤서", "채원", "수아", "지아", "은서", "다은", "예은", "수빈", "소율", "예린", "유나", "채은", "지안", "하린", "서아", "가은", "윤아", "연서", "예원", "미영", "정숙", "영자", "순자", "경희", "은주", "혜정", "명숙", "수정", "지영", "현정", "선영", "옥순", "지원", "예진", "소윤", "하영", "다인", "시아", "아린", "리아", "유주", "예서", "소은", "은채", "나연", "채아", "세아", "다연", "소민", "예나", "서율", "나윤", "유하", "수현", "예빈", "채린", "민지", "지수", "혜원", "유진", "소연", "금자", "말순", "복희", "정희", "영숙", "춘자", "덕순"];
/* 음절 조합 생성 — 이름 다양성 대폭 확대(10만 명 중복 최소화) */
const _SYL1 = "민서도예시하주지준현건우선정승유은재동태형찬영종상광덕병기성진호윤원규세대경창석수용근명해다보가연소한나라아혜세라".split("");
const _SYL2_M = "준우호현훈서진민재원수혁규성철석환욱빈찬열일범택완길웅경헌".split("");
const _SYL2_F = "연윤우현서은아린빈율나희정숙영경미혜주원진솔별담슬화선옥자하안".split("");
const _SIDO = [["서울", 18], ["경기", 22], ["인천", 6], ["부산", 7], ["대구", 5], ["대전", 3], ["광주", 3], ["울산", 2], ["세종", 1], ["강원", 3], ["충북", 3], ["충남", 4], ["전북", 3], ["전남", 3], ["경북", 5], ["경남", 5], ["제주", 2]];

const _DEPT_DZ = {
  fm: ["고혈압", "당뇨병", "이상지질혈증", "비만", "대사증후군", "만성피로", "빈혈", "통풍", "고요산혈증", "골다공증", "감기"],
  cardio: ["협심증", "심근경색", "심혈관질환", "부정맥", "심부전", "심방세동", "말초동맥질환", "심장판막질환", "폐색전증", "기립성저혈압", "선천성심질환", "대동맥류"],
  endo: ["갑상선기능저하증", "갑상선기능항진증", "갑상선결절", "갑상선암", "쿠싱증후군", "부신기능저하증", "뇌하수체종양", "당뇨병성신경병증", "고프로락틴혈증", "저혈당증", "지질대사장애"],
  gastro: ["지방간", "위암", "대장암", "간경변", "역류성식도염", "위염", "위십이지장궤양", "과민성대장증후군", "크론병", "궤양성대장염", "담석증", "췌장염", "간염", "치질"],
  pulmo: ["천식", "만성폐쇄성폐질환", "폐암", "폐렴", "폐결핵", "기관지염", "간질성폐질환", "수면무호흡증", "기흉", "폐섬유증", "미만성범세기관지염"],
  nephro: ["만성콩팥병", "신부전", "급성신손상", "사구체신염", "신증후군", "다낭성신장질환", "요독증", "신장결석", "전해질불균형", "고칼륨혈증"],
  neuro: ["뇌졸중", "치매", "편두통", "뇌혈관질환", "파킨슨병", "간질", "다발성경화증", "말초신경병증", "삼차신경통", "긴장성두통", "본태성진전", "안면마비", "근위축성측삭경화증"],
  obgy: ["유방암", "자궁경부암", "갱년기장애", "자궁근종", "난소낭종", "자궁내막증", "자궁내막암", "다낭성난소증후군", "난소암", "임신성당뇨", "임신중독증", "질염", "골반염", "월경장애"],
  ped: ["소아비만", "소아천식", "성장지연", "ADHD", "수족구병", "성조숙증", "영유아 발달지연", "열성경련", "수두", "홍역", "로타바이러스장염", "신생아황달", "미숙아", "아토피피부염"],
  ortho: ["골절", "퇴행성관절염", "척추질환", "요통", "류마티스관절염", "추간판탈출증", "회전근개파열", "오십견", "척추측만증", "반월상연골손상", "인대손상", "골관절염"],
  derma: ["알레르기비염", "건선", "탈모", "대상포진", "여드름", "두드러기", "백반증", "무좀", "습진", "피부암", "사마귀", "지루피부염"],
  ophtha: ["근시", "백내장", "녹내장", "당뇨망막병증", "노안", "황반변성", "결막염", "안구건조증", "망막박리", "사시", "약시", "익상편"],
  ent: ["중이염", "어지럼증", "부비동염", "알레르기성비염", "이명", "돌발성난청", "편도염", "후두염", "메니에르병", "코골이", "인후두역류질환", "청력손실"],
  uro: ["전립선암", "요로결석", "전립선비대증", "발기부전", "방광암", "요실금", "신우신염", "방광염", "정계정맥류", "혈뇨", "과민성방광", "요도염"],
  psych: ["우울증", "불안장애", "불면증", "공황장애", "조현병", "양극성장애", "강박장애", "외상후스트레스장애", "알코올사용장애", "섭식장애", "적응장애", "신체화장애"],
  dental: ["치주질환", "충치", "치수염", "부정교합", "구내염", "사랑니매복", "구강암", "턱관절장애"],
  kmed: ["소화불량", "만성요통", "견비통", "수족냉증", "안면신경마비", "만성두통", "산후조리"],
};
// 정합성 규칙: 질병별 {sex? / min연령 / max연령}. 골다공증은 성별·연령 결합 규칙(아래 _eligibleDz)
const _DZ_RULES = {
  // 순환기·대사
  "고혈압": { min: 30 }, "당뇨병": { min: 30 }, "이상지질혈증": { min: 30 }, "대사증후군": { min: 30 }, "만성피로": { min: 20 }, "통풍": { sex: "남", min: 30 }, "고요산혈증": { min: 25 },
  "협심증": { min: 40 }, "심근경색": { min: 40 }, "심혈관질환": { min: 40 }, "부정맥": { min: 30 }, "심부전": { min: 45 }, "심방세동": { min: 45 }, "말초동맥질환": { min: 45 }, "심장판막질환": { min: 40 }, "기립성저혈압": { min: 40 }, "선천성심질환": { max: 18 }, "대동맥류": { min: 50 },
  // 내분비
  "갑상선기능저하증": { min: 20 }, "갑상선기능항진증": { min: 20 }, "갑상선암": { min: 30 }, "쿠싱증후군": { min: 20 }, "부신기능저하증": { min: 20 }, "뇌하수체종양": { min: 25 }, "당뇨병성신경병증": { min: 40 }, "지질대사장애": { min: 30 },
  // 소화기
  "지방간": { min: 25 }, "위암": { min: 40 }, "대장암": { min: 40 }, "간경변": { min: 40 }, "역류성식도염": { min: 20 }, "위십이지장궤양": { min: 20 }, "크론병": { min: 15 }, "궤양성대장염": { min: 15 }, "담석증": { min: 30 }, "췌장염": { min: 30 }, "간염": { min: 20 }, "치질": { min: 20 },
  // 호흡기
  "만성폐쇄성폐질환": { min: 45 }, "폐암": { min: 45 }, "폐결핵": { min: 15 }, "간질성폐질환": { min: 40 }, "수면무호흡증": { min: 30 }, "폐섬유증": { min: 45 },
  // 신장·비뇨
  "만성콩팥병": { min: 40 }, "신부전": { min: 40 }, "급성신손상": { min: 30 }, "사구체신염": { min: 15 }, "신증후군": { min: 15 }, "다낭성신장질환": { min: 30 }, "요독증": { min: 40 }, "신장결석": { min: 30 }, "고칼륨혈증": { min: 40 },
  "전립선암": { sex: "남", min: 45 }, "전립선비대증": { sex: "남", min: 45 }, "발기부전": { sex: "남", min: 30 }, "방광암": { min: 45 }, "요실금": { min: 40 }, "정계정맥류": { sex: "남", min: 15 }, "과민성방광": { min: 40 }, "요도염": { min: 18 },
  // 신경
  "뇌졸중": { min: 40 }, "치매": { min: 58 }, "뇌혈관질환": { min: 40 }, "파킨슨병": { min: 50 }, "다발성경화증": { min: 20 }, "말초신경병증": { min: 30 }, "삼차신경통": { min: 40 }, "본태성진전": { min: 40 }, "안면마비": { min: 20 }, "근위축성측삭경화증": { min: 45 },
  // 산부인과(여성)
  "유방암": { sex: "여", min: 30 }, "자궁경부암": { sex: "여", min: 25 }, "갱년기장애": { sex: "여", min: 45 }, "자궁근종": { sex: "여", min: 30 }, "난소낭종": { sex: "여", min: 15 }, "자궁내막증": { sex: "여", min: 20 }, "자궁내막암": { sex: "여", min: 45 }, "다낭성난소증후군": { sex: "여", min: 15, max: 45 }, "난소암": { sex: "여", min: 40 }, "임신성당뇨": { sex: "여", min: 20, max: 45 }, "임신중독증": { sex: "여", min: 18, max: 45 }, "질염": { sex: "여", min: 15 }, "골반염": { sex: "여", min: 15 }, "월경장애": { sex: "여", min: 12, max: 55 }, "산후조리": { sex: "여", min: 20, max: 45 },
  // 소아(상한)
  "소아비만": { max: 18 }, "소아천식": { max: 18 }, "성장지연": { max: 18 }, "ADHD": { min: 4, max: 18 }, "수족구병": { max: 12 }, "성조숙증": { min: 6, max: 13 }, "영유아 발달지연": { max: 7 }, "열성경련": { min: 1, max: 6 }, "수두": { max: 15 }, "홍역": { max: 15 }, "로타바이러스장염": { max: 5 }, "신생아황달": { max: 1 }, "미숙아": { max: 1 }, "사시": { max: 18 }, "약시": { max: 12 }, "부정교합": { max: 18 }, "척추측만증": { min: 10, max: 30 },
  // 근골격
  "골절": { min: 5 }, "퇴행성관절염": { min: 40 }, "요통": { min: 20 }, "만성요통": { min: 30 }, "견비통": { min: 30 }, "류마티스관절염": { min: 30 }, "추간판탈출증": { min: 25 }, "회전근개파열": { min: 40 }, "오십견": { min: 40 }, "골관절염": { min: 40 }, "척추질환": { min: 25 },
  // 피부
  "건선": { min: 18 }, "탈모": { min: 18 }, "대상포진": { min: 40 }, "여드름": { min: 12, max: 40 }, "백반증": { min: 10 }, "피부암": { min: 45 }, "지루피부염": { min: 15 },
  // 안·이비인후
  "백내장": { min: 50 }, "녹내장": { min: 40 }, "당뇨망막병증": { min: 40 }, "노안": { min: 45 }, "황반변성": { min: 50 }, "망막박리": { min: 40 }, "익상편": { min: 40 },
  "어지럼증": { min: 20 }, "이명": { min: 30 }, "돌발성난청": { min: 30 }, "메니에르병": { min: 30 }, "인후두역류질환": { min: 25 }, "청력손실": { min: 40 },
  // 정신·치과·기타
  "우울증": { min: 15 }, "불안장애": { min: 15 }, "불면증": { min: 18 }, "공황장애": { min: 18 }, "조현병": { min: 15, max: 45 }, "양극성장애": { min: 15 }, "강박장애": { min: 12 }, "외상후스트레스장애": { min: 12 }, "알코올사용장애": { min: 20 }, "섭식장애": { min: 12, max: 40 }, "적응장애": { min: 12 }, "신체화장애": { min: 18 },
  "치주질환": { min: 18 }, "구강암": { min: 45 }, "턱관절장애": { min: 15 }, "만성두통": { min: 20 },
};
// 질병 → KCD 대분류(장) 코드
const _DZ_KCD = {
  "고혈압": "I", "당뇨병": "E", "이상지질혈증": "E", "비만": "E", "대사증후군": "E", "만성피로": "R", "빈혈": "D", "통풍": "M", "고요산혈증": "E", "골다공증": "M", "감기": "J",
  "협심증": "I", "심근경색": "I", "심혈관질환": "I", "부정맥": "I", "심부전": "I", "심방세동": "I", "말초동맥질환": "I", "심장판막질환": "I", "폐색전증": "I", "기립성저혈압": "I", "선천성심질환": "Q", "대동맥류": "I",
  "갑상선기능저하증": "E", "갑상선기능항진증": "E", "갑상선결절": "E", "갑상선암": "C", "쿠싱증후군": "E", "부신기능저하증": "E", "뇌하수체종양": "E", "당뇨병성신경병증": "E", "고프로락틴혈증": "E", "저혈당증": "E", "지질대사장애": "E",
  "지방간": "K", "위암": "C", "대장암": "C", "간경변": "K", "역류성식도염": "K", "위염": "K", "위십이지장궤양": "K", "과민성대장증후군": "K", "크론병": "K", "궤양성대장염": "K", "담석증": "K", "췌장염": "K", "간염": "K", "치질": "K",
  "천식": "J", "만성폐쇄성폐질환": "J", "폐암": "C", "폐렴": "J", "폐결핵": "A", "기관지염": "J", "간질성폐질환": "J", "수면무호흡증": "G", "기흉": "J", "폐섬유증": "J", "미만성범세기관지염": "J",
  "만성콩팥병": "N", "신부전": "N", "급성신손상": "N", "사구체신염": "N", "신증후군": "N", "다낭성신장질환": "Q", "요독증": "N", "신장결석": "N", "전해질불균형": "E", "고칼륨혈증": "E",
  "뇌졸중": "I", "치매": "F", "편두통": "G", "뇌혈관질환": "I", "파킨슨병": "G", "간질": "G", "다발성경화증": "G", "말초신경병증": "G", "삼차신경통": "G", "긴장성두통": "G", "본태성진전": "G", "안면마비": "G", "근위축성측삭경화증": "G",
  "유방암": "C", "자궁경부암": "C", "갱년기장애": "N", "자궁근종": "D", "난소낭종": "N", "자궁내막증": "N", "자궁내막암": "C", "다낭성난소증후군": "E", "난소암": "C", "임신성당뇨": "O", "임신중독증": "O", "질염": "N", "골반염": "N", "월경장애": "N",
  "소아비만": "E", "소아천식": "J", "성장지연": "E", "ADHD": "F", "수족구병": "A", "성조숙증": "E", "영유아 발달지연": "F", "열성경련": "R", "수두": "A", "홍역": "A", "로타바이러스장염": "A", "신생아황달": "P", "미숙아": "P", "아토피피부염": "L",
  "골절": "S", "퇴행성관절염": "M", "척추질환": "M", "요통": "M", "류마티스관절염": "M", "추간판탈출증": "M", "회전근개파열": "M", "오십견": "M", "척추측만증": "M", "반월상연골손상": "S", "인대손상": "S", "골관절염": "M",
  "알레르기비염": "J", "건선": "L", "탈모": "L", "대상포진": "A", "여드름": "L", "두드러기": "L", "백반증": "L", "무좀": "A", "습진": "L", "피부암": "C", "사마귀": "A", "지루피부염": "L",
  "근시": "H", "백내장": "H", "녹내장": "H", "당뇨망막병증": "H", "노안": "H", "황반변성": "H", "결막염": "H", "안구건조증": "H", "망막박리": "H", "사시": "H", "약시": "H", "익상편": "H",
  "중이염": "H", "어지럼증": "R", "부비동염": "J", "알레르기성비염": "J", "이명": "H", "돌발성난청": "H", "편도염": "J", "후두염": "J", "메니에르병": "H", "코골이": "R", "인후두역류질환": "K", "청력손실": "H",
  "전립선암": "C", "요로결석": "N", "전립선비대증": "N", "발기부전": "N", "방광암": "C", "요실금": "N", "신우신염": "N", "방광염": "N", "정계정맥류": "I", "혈뇨": "R", "과민성방광": "N", "요도염": "N",
  "우울증": "F", "불안장애": "F", "불면증": "F", "공황장애": "F", "조현병": "F", "양극성장애": "F", "강박장애": "F", "외상후스트레스장애": "F", "알코올사용장애": "F", "섭식장애": "F", "적응장애": "F", "신체화장애": "F",
  "치주질환": "K", "충치": "K", "치수염": "K", "부정교합": "K", "구내염": "K", "사랑니매복": "K", "구강암": "C", "턱관절장애": "K",
  "소화불량": "K", "만성요통": "M", "견비통": "M", "수족냉증": "R", "안면신경마비": "G", "만성두통": "G", "산후조리": "O",
};
function _eligibleDz(pool, sex, age) {
  return (pool || []).filter((dz) => {
    const r = _DZ_RULES[dz];
    if (dz === "골다공증") { if (sex === "남") return age >= 60; return age >= 45; } // 여성 45+/남성 60+
    if (!r) return true;
    if (r.sex && r.sex !== sex) return false;
    if (r.min && age < r.min) return false;
    if (r.max && age > r.max) return false;
    return true;
  });
}
const _DZ_MARK = { "고혈압": "혈압", "심혈관질환": "콜레스테롤", "협심증": "콜레스테롤", "심근경색": "콜레스테롤", "당뇨병": "공복혈당", "당뇨망막병증": "당화혈색소", "이상지질혈증": "콜레스테롤", "지방간": "간수치", "간경변": "간수치", "간염": "간수치", "만성콩팥병": "신장기능", "신부전": "신장기능", "급성신손상": "신장기능", "요독증": "신장기능", "고칼륨혈증": "신장기능", "비만": "체질량지수", "대사증후군": "체질량지수", "소아비만": "체질량지수", "성장지연": "체질량지수", "통풍": "요산", "고요산혈증": "요산", "요로결석": "요산", "골다공증": "골밀도", "골절": "골밀도", "빈혈": "빈혈", "갑상선기능저하증": "갑상선기능", "갑상선기능항진증": "갑상선기능", "갑상선결절": "갑상선기능", "당뇨병성신경병증": "당화혈색소", "지질대사장애": "중성지방", "저혈당증": "공복혈당", "임신성당뇨": "공복혈당", "위암": "암검진", "대장암": "암검진", "간암": "암검진", "폐암": "암검진", "유방암": "암검진", "자궁경부암": "암검진", "자궁내막암": "암검진", "난소암": "암검진", "갑상선암": "암검진", "전립선암": "암검진", "방광암": "암검진", "피부암": "암검진", "구강암": "암검진" };
// 연령·성별별 진료과목 가중치 (obgy는 여성만)
function _deptWeights(age, sex) {
  let w;
  if (age < 19) w = [["ped", 42], ["derma", 12], ["ent", 12], ["ophtha", 10], ["dental", 12], ["ortho", 6], ["psych", 6]];
  else if (age < 40) w = [["fm", 14], ["gastro", 12], ["derma", 12], ["obgy", 10], ["psych", 12], ["ent", 10], ["ortho", 10], ["ophtha", 6], ["endo", 6], ["dental", 8], ["uro", 5]];
  else if (age < 60) w = [["fm", 12], ["cardio", 12], ["endo", 12], ["gastro", 12], ["ortho", 10], ["obgy", 8], ["uro", 6], ["neuro", 6], ["psych", 8], ["ophtha", 6], ["kmed", 6], ["nephro", 4]];
  else w = [["cardio", 14], ["endo", 12], ["neuro", 12], ["ortho", 12], ["gastro", 10], ["nephro", 8], ["ophtha", 8], ["uro", 8], ["pulmo", 6], ["kmed", 6], ["obgy", 4], ["fm", 4]];
  if (sex === "남") w = w.filter((x) => x[0] !== "obgy"); // 남성 산부인과 제외
  return w;
}
const RISK_LABELS = ["", "낮음", "보통", "주의", "높음", "매우 높음"];
const RISK_COLORS = ["", "#16A34A", "#0EA5E9", "#F59E0B", "#EF4444", "#B91C1C"];
const REL_ORDER = { "가구주": 0, "배우자": 1, "자녀": 2, "부": 3, "모": 4 };

function _deptLabel(k) { if (typeof DEPT_CATS !== "undefined") { const d = DEPT_CATS.find((x) => x.key === k); if (d) return d.label; } return k; }
function _markLabel(key, gi) { if (typeof CHECKUP_ONTOLOGY !== "undefined") { const o = CHECKUP_ONTOLOGY.find((x) => x.key === key); if (o) return o.grades[gi][0]; } return ["정상", "주의", "위험", "고위험"][gi]; }
const CHECK_KEYS = ["혈압", "공복혈당", "당화혈색소", "콜레스테롤", "중성지방", "간수치", "신장기능", "요산", "체질량지수", "빈혈", "갑상선기능", "골밀도", "암검진"];

// 개별 회원 생성 — fixed: {age, sex, sido, name, rel, hid, income}
function _genMember(idx, f) {
  const rng = _mul32(0x2545F491 + idx * 40503);
  const { age, sex, sido, name, rel, hid, income } = f;
  const deptKey = _wpick(rng, _deptWeights(age, sex));
  const pool = _eligibleDz(_DEPT_DZ[deptKey] || ["이상지질혈증"], sex, age);
  const pBase = age < 12 ? 0.10 : age < 20 ? 0.24 : age < 35 ? 0.40 : age < 55 ? 0.72 : age < 70 ? 0.92 : 0.98;
  const diseases = [];
  if (pool.length && rng() < pBase) {
    const n = 1 + (rng() < (age > 60 ? 0.6 : 0.28) ? 1 : 0) + (rng() < (age > 70 ? 0.34 : 0.08) ? 1 : 0);
    const sh = [...pool].sort(() => rng() - 0.5);
    for (let j = 0; j < Math.min(n, sh.length); j++) diseases.push(sh[j]);
  }
  const isChild = age < 19;
  const marks = {}; let worst = 0, abn = 0, childHealth = null;
  const dzMarks = new Set(diseases.map((d) => _DZ_MARK[d]).filter(Boolean));
  if (isChild) {
    // 아동/청소년 건강검진: 성장·시력·비만도·구강 (영유아/학생 검진 항목)
    childHealth = {
      "성장(키·체중)": _wpick(rng, [["정상 (25~90 %ile)", 70], ["주의 (10~25 %ile)", 18], ["저신장·성장지연 (<10 %ile)", 12]]),
      "시력": _wpick(rng, [["정상 (1.0 이상)", 55], ["경도 근시 (0.7~0.9)", 28], ["근시 (교정 필요)", 17]]),
      "비만도": _wpick(rng, [["정상", 62], ["과체중 (85~95 %ile)", 23], ["소아비만 (≥95 %ile)", 15]]),
      "구강(충치)": _wpick(rng, [["양호", 56], ["충치 주의", 30], ["충치 치료 필요", 14]]),
      "발달선별": _wpick(rng, [["정상", 82], ["추적관찰 권장", 13], ["정밀평가 필요", 5]]),
    };
    abn = Object.values(childHealth).filter((v) => !/^정상|^양호/.test(v)).length;
    worst = abn >= 3 ? 2 : abn >= 1 ? 1 : 0;
  } else {
    for (const key of CHECK_KEYS) {
      if ((key === "골밀도" || key === "암검진") && age < 30 && !dzMarks.has(key)) continue;
      let gi = 0;
      const ageBump = age > 65 ? 0.28 : age > 50 ? 0.18 : age > 30 ? 0.09 : 0.03;
      if (dzMarks.has(key)) gi = 2 + (rng() < 0.4 ? 1 : 0);
      else if (rng() < ageBump) gi = 1 + (rng() < 0.35 ? 1 : 0);
      if (gi > 0) { marks[key] = gi; abn++; if (gi > worst) worst = gi; }
    }
  }
  const checkupType = age < 7 ? "영유아 건강검진" : isChild ? "학생 건강검진" : "성인 건강검진";
  const adult = age >= 19;
  const smoker = adult && (sex === "남" ? rng() < 0.32 : rng() < 0.07);
  const drinker = adult && rng() < (sex === "남" ? 0.45 : 0.22);
  const exercise = Math.floor(rng() * 4);
  let risk = 1 + Math.min(2, diseases.length) + (worst >= 3 ? 2 : worst === 2 ? 1 : 0) + (smoker ? 1 : 0) + (age > 70 ? 1 : 0) - (exercise >= 2 ? 1 : 0);
  risk = Math.max(1, Math.min(5, risk));
  const bioDelta = isChild
    ? Math.round((abn * 0.7 - 0.4 + (rng() - 0.5) * 1.4) * 10) / 10  // 아동: 실제 나이 근처(±소폭)
    : Math.round(((risk - 2.5) * 3.2 + (smoker ? 2.5 : 0) - (exercise >= 2 ? 1.8 : 0) + (rng() - 0.5) * 3) * 10) / 10;
  const bioAge = Math.max(1, Math.round((age + bioDelta) * 10) / 10);
  const cancer = diseases.some((d) => /암$/.test(d));
  const severe = worst >= 3 || risk >= 4;
  // 의료비 세분화: ① 급여 본인부담 ② 비급여 ③ 기타 건강관리
  let clinical = isChild ? (90000 + diseases.length * 180000 + abn * 60000) : (140000 + risk * 260000 + diseases.length * 430000 + worst * 160000 + Math.max(0, age - 45) * 8000);
  clinical = Math.round(clinical * (0.85 + rng() * 0.35));
  const covered = clinical * (0.30 + rng() * 0.20);                                  // 급여 본인부담(급여 진료·입원·수술의 본인부담금)
  let uncovered = clinical * (0.22 + rng() * 0.22);                                   // 비급여(MRI·초음파·도수·상급병실·비급여약 등)
  if (cancer) uncovered += 4500000 + rng() * 5000000;                                 // 암: 표적·항암 등 고액 비급여
  else if (severe) uncovered += 300000 + rng() * 900000;
  let wellness = isChild ? (120000 + 60000) : (180000 + Math.max(0, age - 35) * 7000 + (exercise >= 2 ? 150000 : 50000)); // 영양제·검진·운동·의료기기·예방접종
  if (age >= 70) wellness += 400000;                                                  // 재활·간병 등
  wellness = wellness * (0.8 + rng() * 0.6);
  const r1 = Math.round(covered / 10000) * 10000, r2 = Math.round(uncovered / 10000) * 10000, r3 = Math.round(wellness / 10000) * 10000;
  const costBreakdown = { covered: r1, uncovered: r2, wellness: r3 };
  const cost = r1 + r2 + r3;
  const need = new Set();
  diseases.forEach((d) => (typeof DISEASE_INSURANCE !== "undefined" && DISEASE_INSURANCE[d] || []).forEach((x) => need.add(x)));
  if (isChild) { need.add("어린이보험"); need.add("어린이 실손보험"); }
  if (!need.size) need.add("실손보험");
  const coverages = [...need];
  const heldN = Math.round(coverages.length * (0.55 + rng() * 0.45));
  const gap = coverages.slice(heldN);
  const needy = (income === "저" && (cost > 2500000 || cancer || risk >= 4) && rng() < 0.72);
  return {
    id: "P" + String(idx + 1).padStart(5, "0"), name, sex, age, sido, hid, rel, deptKey, deptLabel: _deptLabel(deptKey),
    diseases, dzCount: diseases.length, marks, worst, abnormalCount: abn, isChild, childHealth, checkupType,
    risk, riskLabel: RISK_LABELS[risk], riskColor: RISK_COLORS[risk],
    bioAge, bioDelta, estCost: cost, costBreakdown, coverages, gap, hasGap: gap.length > 0,
    income, needy, smoker, drinker, exercise, cancer,
  };
}

// 가구(가족) 단위로 target명 생성
function _genCohort(target) {
  const out = []; let hh = 0, mi = 0;
  while (out.length < target) {
    hh++; const hid = "H" + String(hh).padStart(5, "0");
    const rng = _mul32(0x51ED0000 + hh * 2654435761);
    const type = _wpick(rng, [["single", 15], ["couple", 13], ["nuclear", 38], ["threegen", 10], ["singleparent", 12], ["elder", 12]]);
    const sido = _wpick(rng, _SIDO);
    const income = _wpick(rng, [["저", 22], ["중", 56], ["고", 22]]);
    const surA = _pick(rng, _SURN); let surB = _pick(rng, _SURN); if (surB === surA) surB = _pick(rng, _SURN); // 부/모(배우자) 성
    const _gv = (sex) => { if (rng() < 0.45) return _pick(rng, sex === "남" ? _GIVN_M : _GIVN_F); const a = _pick(rng, _SYL1); let b = _pick(rng, sex === "남" ? _SYL2_M : _SYL2_F); if (b === a) b = _pick(rng, sex === "남" ? _SYL2_M : _SYL2_F); return a + b; };
    const nm = (sex, sur) => sur + _gv(sex);
    const mem = []; // {age,sex,rel,name}
    const addHeadSpouse = (loA, hiA, spread) => {
      const a = _ri(loA + rng() * (hiA - loA)); const hSex = rng() < 0.5 ? "남" : "여";
      const hSur = hSex === "남" ? surA : surB; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSur) });
      const sSex = hSex === "남" ? "여" : "남"; const sa = Math.max(23, _ri(a + (rng() - 0.5) * spread));
      const sSur = hSex === "남" ? surB : surA; mem.push({ age: sa, sex: sSex, rel: "배우자", name: nm(sSex, sSur) });
      return Math.max(a, sa);
    };
    const addKids = (parentAge, maxN, minGap, gapSpan) => {
      const nc = 1 + Math.floor(rng() * maxN);
      for (let c = 0; c < nc; c++) { const ca = Math.max(0, _ri(parentAge - (minGap + rng() * gapSpan))); const kSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: ca, sex: kSex, rel: "자녀", name: nm(kSex, surA) }); }
    };
    if (type === "single") { const sex = rng() < 0.5 ? "남" : "여"; const a = _ri(24 + rng() * 46); mem.push({ age: a, sex, rel: "가구주", name: nm(sex, sex === "남" ? surA : surB) }); }
    else if (type === "elder") { const a = _ri(66 + rng() * 22); const hSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSex === "남" ? surA : surB) }); const sSex = hSex === "남" ? "여" : "남"; mem.push({ age: Math.max(62, _ri(a + (rng() - 0.5) * 6)), sex: sSex, rel: "배우자", name: nm(sSex, hSex === "남" ? surB : surA) }); }
    else if (type === "couple") { addHeadSpouse(30, 64, 8); }
    else if (type === "singleparent") { const a = _ri(38 + rng() * 20); const hSex = rng() < 0.5 ? "남" : "여"; mem.push({ age: a, sex: hSex, rel: "가구주", name: nm(hSex, hSex === "남" ? surA : surB) }); addKids(a, 2, 22, 18); }
    else if (type === "nuclear") { const p = addHeadSpouse(34, 56, 8); addKids(p, 3, 23, 16); }
    else { const p = addHeadSpouse(40, 56, 7); addKids(p, 2, 24, 12); const gpBase = p + 24 + rng() * 8; mem.push({ age: Math.min(96, _ri(gpBase)), sex: "여", rel: "모", name: nm("여", surB) }); if (rng() < 0.4) mem.push({ age: Math.min(98, _ri(gpBase + 2)), sex: "남", rel: "부", name: nm("남", surA) }); }
    for (const mm of mem) { if (out.length >= target) break; out.push(_genMember(mi++, { ...mm, sido, hid, income })); }
  }
  return out;
}

const PILOT_N = 100000;
let _cohort = null;
function pilotCohort() { if (!_cohort) _cohort = _genCohort(PILOT_N); return _cohort; }
let _house = null;
function pilotHouseholds() { if (_house) return _house; const map = {}; for (const m of pilotCohort()) (map[m.hid] || (map[m.hid] = [])).push(m); for (const k in map) map[k].sort((a, b) => (REL_ORDER[a.rel] - REL_ORDER[b.rel]) || (b.age - a.age)); _house = map; return map; }
function pilotFamily(hid) { return pilotHouseholds()[hid] || []; }

let _cohortAgg = null;
function pilotAgg() {
  if (_cohortAgg) return _cohortAgg;
  const c = pilotCohort(); const hh = pilotHouseholds();
  const byDept = {}, byDisease = {}, byRisk = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, bySidoSex = {}, ageBands = { "0~19": 0, "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대": 0, "70대+": 0 }, byRel = {};
  const markAbn = {}, byKcd = {}; let totalCost = 0, needyN = 0, needyCost = 0, gapN = 0, dzMembers = 0, childN = 0, sumCovered = 0, sumUncovered = 0, sumWellness = 0;
  for (const m of c) {
    if (m.isChild) childN++;
    if (m.costBreakdown) { sumCovered += m.costBreakdown.covered; sumUncovered += m.costBreakdown.uncovered; sumWellness += m.costBreakdown.wellness; }
    byDept[m.deptKey] = (byDept[m.deptKey] || 0) + 1;
    m.diseases.forEach((d) => { byDisease[d] = (byDisease[d] || 0) + 1; let ch = (typeof _DZ_KCD !== "undefined" && _DZ_KCD[d]) || "기타"; if (ch === "B") ch = "A"; byKcd[ch] = (byKcd[ch] || 0) + 1; });
    byRisk[m.risk]++; byRel[m.rel] = (byRel[m.rel] || 0) + 1;
    const band = m.age < 20 ? "0~19" : m.age < 30 ? "20대" : m.age < 40 ? "30대" : m.age < 50 ? "40대" : m.age < 60 ? "50대" : m.age < 70 ? "60대" : "70대+";
    ageBands[band]++;
    bySidoSex[m.sido + "|" + m.sex] = (bySidoSex[m.sido + "|" + m.sex] || 0) + 1;
    Object.keys(m.marks).forEach((k) => { if (m.marks[k] >= 2) markAbn[k] = (markAbn[k] || 0) + 1; });
    totalCost += m.estCost; if (m.needy) { needyN++; needyCost += m.estCost; } if (m.hasGap) gapN++; if (m.dzCount) dzMembers++;
  }
  _cohortAgg = { n: c.length, households: Object.keys(hh).length, childN, sumCovered, sumUncovered, sumWellness, byDept, byDisease, byKcd, dzTypes: Object.keys(byDisease).length, byRisk, bySidoSex, ageBands, byRel, markAbn, totalCost, needyN, needyCost, gapN, dzMembers, avgAge: Math.round(c.reduce((s, m) => s + m.age, 0) / c.length), avgCost: Math.round(totalCost / c.length), avgHouseholdSize: Math.round(c.length / Object.keys(hh).length * 10) / 10 };
  return _cohortAgg;
}

// 정합성 검증 — 성별/연령/가족 위반 스캔(목표: 0건)
let _audit = null;
function pilotAudit() {
  if (_audit) return _audit;
  const c = pilotCohort(); const hh = pilotHouseholds();
  let sex = 0, age = 0, fam = 0;
  for (const m of c) {
    if (m.deptKey === "obgy" && m.sex === "남") sex++;
    for (const dz of m.diseases) {
      const r = _DZ_RULES[dz];
      if (r) { if (r.sex && r.sex !== m.sex) sex++; if (r.min && m.age < r.min) age++; if (r.max && m.age > r.max) age++; }
      if (dz === "골다공증" && ((m.sex === "남" && m.age < 60) || (m.sex === "여" && m.age < 45))) age++;
    }
  }
  for (const k in hh) {
    const ms = hh[k]; const par = ms.filter((x) => x.rel === "가구주" || x.rel === "배우자");
    const sps = ms.filter((x) => x.rel === "배우자");
    if (sps.length && par.length === 2 && par[0].sex === par[1].sex) fam++;
    const minPar = par.length ? Math.min(...par.map((x) => x.age)) : 0;
    const maxPar = par.length ? Math.max(...par.map((x) => x.age)) : 0;
    ms.filter((x) => x.rel === "자녀").forEach((kid) => { if (minPar - kid.age < 16) fam++; });
    ms.filter((x) => x.rel === "부" || x.rel === "모").forEach((gp) => { if (gp.age - maxPar < 16) fam++; });
  }
  _audit = { n: c.length, households: Object.keys(hh).length, sex, age, fam, total: sex + age + fam, ok: (sex + age + fam) === 0 };
  return _audit;
}
