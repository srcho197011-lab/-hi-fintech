/* ══════════════ 회원 스크립트 블록(hmScriptBlocks.js) — 지시서 프롬프트 v1.3 §3-S (P2 초판) ══════════════
   "대본 없는 통화는 없다" — 프로가 회원에게 말하는 모든 문장의 단일 소스.
   ⚠️ 원칙:
     · 문장은 사람이 만든다 — 블록은 전건 형 검수 후 approved:true. 엔진은 문장을 짓지 않는다.
     · approved:false 블록이 조립에 걸리면 그 카드는 발행 불가(§S-5 ①). 초판 39블록은 2026-08-29 형 검수 전건 승인(P2 게이트 통과).
     · 슬롯은 검증된 원천만 치환: {가명} {프로명} {구간표현}(clinicalBandLabel) {개입명}(INTERVENTIONS.ko)
       {예약처} {다음약속}. 슬롯 밖 자유 텍스트 유입 금지.
     · 금지: 진단·확정 표현("~입니다" 판정형) · 재권유 2회 · 카드 안에서 보장 설명 개시(A2 인계 블록만).
   id 체계: op(오프닝)·co(본론)·ak(제안)·br(분기)·cl(클로징)·ch(채널 규칙) + 일련번호. easy=쉬운말 변형. */
const HM_SCRIPT_BLOCKS = [
  /* ── ① 오프닝(4) ── */
  { id: "op-first", part: "opening", ko: "첫 연결", approved: true,
    t: "{가명}님, 안녕하세요. 하이핀 담당 {프로명}입니다. 검진 관련해서 확인드릴 게 있어 연락드렸어요 — 지금 2분 정도 괜찮으세요?" },
  { id: "op-again", part: "opening", ko: "재접촉", approved: true,
    t: "{가명}님, 하이핀 {프로명}입니다. 지난번에 말씀 나눈 것 이어서 짧게 안부 겸 연락드렸어요 — 잠깐 괜찮으세요?" },
  { id: "op-restart", part: "opening", ko: "정체 재개", approved: true,
    t: "{가명}님, 하이핀 {프로명}입니다. 한동안 챙겨드리지 못해서요 — 요즘 건강 관리는 어떠셨어요?" },
  { id: "op-unlock", part: "opening", ko: "락 해제 결합(결과+안내 1회 통합)", approved: true,
    t: "{가명}님, 하이핀 {프로명}입니다. 검진 결과가 도착해서, 결과 살펴보신 것과 앞으로 관리를 한 번에 정리해 드리려고 연락드렸어요." },
  /* ── ② 본론 — 등급 공통 도입(3) + 지표군(6) ── */
  { id: "co-h", part: "core", ko: "본론 도입 · H", approved: true,
    t: "이번 결과에서 {구간표현}으로 확인됐어요. 진단이 아니라 '의사 선생님 확인이 필요한 구간'이라는 뜻이에요." },
  { id: "co-m", part: "core", ko: "본론 도입 · M", approved: true,
    t: "이번 결과에서 {구간표현}으로 나왔어요. 당장 큰일이라는 게 아니라, 지금부터 관리하면 좋아질 수 있는 구간이에요." },
  { id: "co-l", part: "core", ko: "본론 도입 · L", approved: true,
    t: "수치 자체는 정상 범위인데, 흐름을 보면 지금 잡아두시는 게 좋아 보여요. 그래서 미리 연락드렸어요." },
  { id: "co-bp", part: "core", ko: "지표 보충 · 혈압", approved: true,
    t: "혈압은 하루에도 오르내려서, 병원 한 번 수치보다 꾸준한 기록이 더 정확해요." },
  { id: "co-sugar", part: "core", ko: "지표 보충 · 혈당", approved: true,
    t: "혈당은 식사·체중과 같이 움직여서, 검사 확인과 식단을 같이 보시는 게 좋아요." },
  { id: "co-lipid", part: "core", ko: "지표 보충 · 지질", approved: true,
    t: "콜레스테롤은 증상이 없어서 수치로만 관리가 돼요 — 그래서 확인 시점을 놓치지 않는 게 중요해요." },
  { id: "co-liver", part: "core", ko: "지표 보충 · 간", approved: true,
    t: "간 수치는 최근 음주나 드시는 약·영양제의 영향도 받아요. 그 부분도 같이 봐드릴게요." },
  { id: "co-body", part: "core", ko: "지표 보충 · 체격·근골격", approved: true,
    t: "체중·근육은 한 번에 바꾸는 게 아니라 강도를 맞춰 천천히 가는 게 안전해요." },
  { id: "co-organ", part: "core", ko: "지표 보충 · 신장·혈액 등", approved: true,
    t: "이 항목은 다른 수치와 같이 봐야 정확해서, 확인 검사를 한 번 권해드리는 거예요." },
  /* ── ③ 제안 — 개입 7유형(7) ── */
  { id: "ak-clinic", part: "ask", ko: "제안 · 진료 연결", approved: true,
    t: "지금 연결 가능한 의사 선생님께 먼저 보여드리는 걸 권해요. 제가 보내드리는 알림의 버튼 하나면 예약까지 돼요." },
  { id: "ak-recheck", part: "ask", ko: "제안 · 재검진", approved: true,
    t: "{예약처}에서 확인 검사를 한 번 받아보시면 좋겠어요. 원하시는 날짜로 제가 예약을 도와드릴게요." },
  { id: "ak-diet", part: "ask", ko: "제안 · 식단", approved: true,
    t: "식단은 거창한 게 아니라 한 끼 구성부터예요. {가명}님 수치에 맞춘 구성을 앱에 담아드렸어요 — 한번 보시겠어요?" },
  { id: "ak-supp", part: "ask", ko: "제안 · 영양 보충(상호작용 확인 포함)", approved: true,
    t: "도움이 될 수 있는 영양 성분을 담아드렸어요. 드시는 약이 있으면 겹치지 않는지부터 확인해 드릴게요." },
  { id: "ak-move", part: "ask", ko: "제안 · 운동 미션", approved: true,
    t: "무리한 운동보다, {가명}님께 맞는 강도로 시작하는 미션을 넣어드렸어요. 하루 한 번 체크만 해주시면 제가 흐름을 봐드려요." },
  { id: "ak-habit", part: "ask", ko: "제안 · 습관 미션(절주·복약 등)", approved: true,
    t: "작게 시작하는 게 제일 오래가요. 이번 주는 하나만 정해서 같이 체크해 봐요." },
  { id: "ak-family", part: "ask", ko: "제안 · 가족 케어 연결", approved: true,
    t: "가족분이 앱에서 함께 봐주시면 관리가 훨씬 수월해져요. 동의해 주시면 연결해 드릴게요." },
  /* ── ④ 분기 — 4반응(8: 기본+보충) ── */
  { id: "br-yes", part: "branch", ko: "수락", approved: true,
    t: "잘 생각하셨어요. 지금 바로 알림 보내드릴게요 — 버튼만 눌러주시면 끝나요." },
  { id: "br-yes2", part: "branch", ko: "수락 · 마무리 확인", approved: true,
    t: "완료되면 저한테도 표시가 와요. 잘 안 되면 언제든 다시 연락 주세요." },
  { id: "br-hold", part: "branch", ko: "보류(생각해볼게요)", approved: true,
    t: "네, 천천히 보셔도 돼요. 자료는 앱에 넣어드릴 테니 편하실 때 열어보세요." },
  { id: "br-hold2", part: "branch", ko: "보류 · 다음 약속", approved: true,
    t: "그럼 {다음약속}쯤 제가 한 번만 다시 여쭤볼게요. 부담은 안 드릴게요." },
  { id: "br-no", part: "branch", ko: "거절(괜찮아요) — 재권유 1회 한도", approved: true,
    t: "네, 알겠습니다. 부담 드리려는 건 아니에요. 필요하실 때 하이에게 말씀하시면 언제든 이어서 도와드려요." },
  { id: "br-q-serious", part: "branch", ko: "질문(심각한 거예요?) — 한 문장 원칙", approved: true,
    t: "그건 의사 선생님이 봐주셔야 정확해요 — 그래서 연결을 도와드리려는 거예요." },
  { id: "br-q-ins", part: "branch", ko: "질문(보험 관련) — A2 인계 전용", approved: true,
    t: "보장 쪽은 제가 화면 보면서 같이 확인해 드릴게요 — 잠깐 보장분석 화면으로 넘어가서 볼까요?" },
  { id: "br-q-cost", part: "branch", ko: "질문(비용 있어요?)", approved: true,
    t: "지금 안내드린 건 회원 부담 없이 이용하실 수 있어요. 비용이 생기는 단계에선 먼저 금액부터 보여드려요." },
  /* ── ⑤ 클로징(3) ── */
  { id: "cl-done", part: "closing", ko: "완결 확인형", approved: true,
    t: "예약 확인되면 앱으로 알림 가요. 궁금한 건 하이에게 물어보셔도 되고, 저한테 바로 연락 주셔도 돼요." },
  { id: "cl-promise", part: "closing", ko: "약속형", approved: true,
    t: "그럼 {다음약속}에 제가 먼저 연락드릴게요. 그 전에 필요하시면 언제든지요. 건강히 지내세요." },
  { id: "cl-open", part: "closing", ko: "미완결형(재큐 고지)", approved: true,
    t: "오늘은 여기까지만 할게요. 일주일 뒤에 진행 상황 한 번 봐드릴게요 — 편하게 계세요." },
  /* ── 쉬운말 변형(고령 — 문장당 1정보·한자어 회피)(6) ── */
  { id: "op-first-easy", part: "opening", easy: true, ko: "첫 연결 · 쉬운말", approved: true,
    t: "{가명}님, 안녕하세요. 건강 챙겨드리는 {프로명}이에요. 잠깐 통화 괜찮으세요?" },
  { id: "co-h-easy", part: "core", easy: true, ko: "본론 H · 쉬운말", approved: true,
    t: "이번 검사에서 한 가지가 높게 나왔어요. 병원에서 한 번 봐주시는 게 좋아요." },
  { id: "co-m-easy", part: "core", easy: true, ko: "본론 M · 쉬운말", approved: true,
    t: "조금 높은 항목이 하나 있어요. 지금부터 챙기면 좋아질 수 있어요." },
  { id: "ak-clinic-easy", part: "ask", easy: true, ko: "진료 연결 · 쉬운말", approved: true,
    t: "제가 의사 선생님 연결해 드릴게요. 문자 보내드리면 파란 버튼만 눌러주세요." },
  { id: "br-no-easy", part: "branch", easy: true, ko: "거절 · 쉬운말", approved: true,
    t: "네, 알겠어요. 필요하실 때 언제든 전화 주세요." },
  { id: "cl-done-easy", part: "closing", easy: true, ko: "클로징 · 쉬운말", approved: true,
    t: "예약되면 문자 가요. 궁금하면 저한테 전화 주세요. 건강하세요." },
  /* ── ⑦ 보험치료비 관리 사무(5) — §S-4 별도 블록군(P5 초안 → 2026-08-30 형 검수 승인 approved:true).
        기성 계약의 관리 사무만 — 신규 권유 문장 부재를 금지어 스캔이 보증. 승인 전엔 조립 미사용 ── */
  { id: "ad-claim-delay", part: "admin", ko: "청구 지연 안내", approved: true,
    t: "{가명}님, 지난번 청구하신 건 진행 상황을 확인해 봤어요. 심사가 조금 길어지고 있는데, 제가 계속 지켜보고 진행되는 대로 바로 알려드릴게요." },
  { id: "ad-expire-d30", part: "admin", ko: "만기 D-30 고지", approved: true,
    t: "{가명}님, 이용 중이신 서비스가 한 달 뒤 만기예요. 어떻게 하실지 지금 정하실 필요는 없고, 만기 전에 제가 한 번 더 정리해서 안내드릴게요." },
  { id: "ad-expire-d7", part: "admin", ko: "만기 D-7 확인", approved: true,
    t: "{가명}님, 만기가 일주일 앞이에요. 궁금하신 점 있으면 편하게 물어봐 주세요 — 결정은 {가명}님이 하시는 거고, 저는 정리만 도와드려요." },
  { id: "ad-rerate", part: "admin", ko: "재산정(인하 전용) 통지", approved: true,
    t: "{가명}님, 좋은 소식이에요. 건강 관리 기록이 반영돼서 부담이 줄어드는 재산정 대상이 되셨어요. 자세한 내용은 앱에서 확인하실 수 있게 넣어드렸어요." },
  { id: "ad-claim-done", part: "admin", ko: "청구 완결 확인", approved: true,
    t: "{가명}님, 청구하신 건 처리가 끝났어요. 지급 내역은 앱 알림으로 보내드렸고, 이상 있으면 저한테 바로 말씀해 주세요." },
  /* ── ⑧ L5~L8 생애 여정(6) — 2단계 P4 초안(형 검수 대기 approved:false · 조립 결선은 대본 v2에서) ── */
  { id: "lj-l5-rhythm", part: "lifejourney", ko: "L5 · 주기 점검", approved: false,
    t: "{가명}님, 관리 리듬 점검할 때가 됐어요. 이번에도 지난번처럼 가볍게 확인만 하면 돼요." },
  { id: "lj-l5-recheck", part: "lifejourney", ko: "L5 · 재검진 리듬", approved: false,
    t: "작년 이맘때 검진 받으셨죠 — 올해 것도 잡아두면 흐름이 이어져요. 날짜만 정해주시면 제가 준비할게요." },
  { id: "lj-l6-family", part: "lifejourney", ko: "L6 · 가족 확장", approved: false,
    t: "{가명}님 관리가 자리를 잡아서요 — 가족분들도 같이 보실래요? 동의만 해주시면 같은 방식으로 챙겨드려요." },
  { id: "lj-l7-rights", part: "lifejourney", ko: "L7 · 데이터 권리(권유 아님)", approved: false,
    t: "{가명}님 데이터의 주인은 {가명}님이에요. 어디까지 쓸지 정하는 화면을 알려드릴게요 — 결정은 언제든 바꿀 수 있어요." },
  { id: "lj-l8-rerate", part: "lifejourney", ko: "L8 · 재산정(인하 전용)", approved: false,
    t: "좋은 소식이에요. 몇 년 관리해 오신 기록이 반영돼서 부담이 줄어드는 재산정 대상이 되셨어요." },
  { id: "lj-l8-replan", part: "lifejourney", ko: "L8 · 생애 재설계", approved: false,
    t: "3년을 같이 봐왔으니 이제 큰 그림을 볼 차례예요. 앞으로의 계획을 한 번 정리해봐요 — 서두를 건 없어요." },
  /* ── ⑥ 채널 변형 규칙(2) — 문장 창작이 아니라 축약 규칙 ── */
  { id: "ch-notif", part: "channel", ko: "앱알림(2문장)", approved: true,
    t: "[규칙] core 도입 1문장 + ask 1문장으로 축약. 링크 버튼 1개(개입 원탭). 존대 유지·이모지 1개 이하." },
  { id: "ch-sms", part: "channel", ko: "문자(80자·링크 1)", approved: true,
    t: "[규칙] \"[하이핀] {가명}님, 검진 관련 안내드릴 내용이 있어요. 확인: {링크}\" 형식 고정 — 수치·등급 문구 문자 금지(데이터 경계)." },
];

/* 조회 유틸 — 조립기는 approved만 쓴다(§S-5 ①: 미승인 블록이 걸리면 카드 발행 불가) */
function hmBlock(id) { return HM_SCRIPT_BLOCKS.find((b) => b.id === id) || null; }
function hmBlocksByPart(part, easy) {
  return HM_SCRIPT_BLOCKS.filter((b) => b.part === part && !!b.easy === !!easy);
}
