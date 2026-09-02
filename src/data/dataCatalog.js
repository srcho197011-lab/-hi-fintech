/* ══════════════ 데이터 카탈로그(dataCatalog.js) — 데이터 운영계획 v1.1 §6 D-1 (2026-08-30 형 승인) ══════════════
   하이핀의 모든 데이터가 "어디에, 무엇이, 어떤 규약으로" 있는지의 단일 소스.
   ⚠️ 원칙:
     · 새 브라우저 저장 키는 여기 등재 후에만 코드에 넣을 수 있다 — scripts/check_data_catalog.py가 커밋 게이트.
     · 외부 소스는 출처·갱신 주기 등재 없이 사용 금지 · 회원 실데이터 수집은 ConsentNFT 범위 안에서만.
     · 이 파일은 문서가 아니라 계약 — 관제탑·에이전트·이관 러너(D-2)가 이 목록을 읽는다. */

/* ── 6계층 지도 ── */
const HIFIN_DATA_LAYERS = [
  { k: "L1", ko: "지식·생성기", where: "src/data/*.js → 번들", own: "Git+Vercel(커밋=버전)", note: "온톨로지·임계·대본·코호트 생성기(시드 규칙)" },
  { k: "L2", ko: "정적 대용량", where: "data/*.json", own: "Git(공공데이터 출처 표기)", note: "심평원 병의원·질환-케어 사전" },
  { k: "L3", ko: "회원 행동·시연 영속층", where: "localStorage/sessionStorage", own: "회원 기기(론칭 시 원장 DB 이관)", note: "금고·검진·보험·주문·동의·이벤트" },
  { k: "L4", ko: "산출 스냅샷·골든셋", where: "scripts/*.json · src/data/*Snapshot.js · fixtures/", own: "Git(러너 전용·수기 편집 금지)", note: "회귀·하네스·배치·주간학습" },
  { k: "L5", ko: "설계·검수 문서", where: "docs/(gitignore)", own: "로컬 전용", note: "프롬프트·검수표·코퍼스" },
  { k: "L6", ko: "외부 소스·커넥터", where: "HIFIN_EXTERNAL_SOURCES", own: "원천별 상이", note: "공공 의료·보험 + 업무 커넥터" },
];

/* ── 브라우저 저장 키 전수 등재(게이트 대상) — 자동 스캔(--emit) + 변수 간접 키 수동 보강 ── */
const HIFIN_KEYS_STATIC = ["hifin_addrbook", "hifin_agent_handoff", "hifin_agent_miss", "hifin_agent_pending", "hifin_agent_route", "hifin_agent_stats", "hifin_chain_snapshots", "hifin_claims", "hifin_connectors_custom", "hifin_divi_seen", "hifin_dl_ready", "hifin_easyread", "hifin_fin_params", "hifin_fin_scn", "hifin_force_onboard", "hifin_gov_votes", "hifin_hash_v2", "hifin_hashchain", "hifin_hashchain_legacy", "hifin_hi_sarg_log", "hifin_hi_unanswered", "hifin_hi_welcome", "hifin_hm_code", "hifin_ins_certs", "hifin_ins_deferred", "hifin_ins_guard", "hifin_lead_audit", "hifin_medrem", "hifin_mydata_req", "hifin_nodes", "hifin_notifs", "hifin_ocr_key", "hifin_pu_ready", "hifin_reggate", "hifin_rerate", "hifin_rpm_seen", "hifin_rx", "hifin_self_ins_v3", "hifin_self_ins_v4", "hifin_share_apply", "hifin_sharing_pool", "hifin_sid", "hifin_telem_raw", "hifin_telemetry", "hifin_wp_log", "pi_allocated",
  /* 변수 간접 키(상수·함수로 참조 — 스캔 밖) */ "hifin_events", "hifin_login_lock", "hifin_guard_cfg", "hifin_access_log",
  /* 백업 시스템(backupRestore.js) */ "hifin_backup_last", "hifin_restore_undo",
  /* 동의 게이트(consentGate.js — 리뉴얼 R1): 체험 회원 동의 상태(종류별 on·취득일) */ "hifin_consent2"];
const HIFIN_KEYS_PREFIX = ["hifin_access_log_", "hifin_adh_", "hifin_agent_mem_", "hifin_bills_", "hifin_careguard_", "hifin_careloop_", "hifin_careplan_", "hifin_chk_editlog_", "hifin_chk_edits_", "hifin_claim_used_", "hifin_consent_nft_", "hifin_famauto_", "hifin_famconsent_", "hifin_family_", "hifin_famlink_", "hifin_famspend_", "hifin_famtask_", "hifin_g2_", "hifin_g4_", "hifin_handoff_issued_", "hifin_hi_esc_", "hifin_hi_followups_", "hifin_hi_state_", "hifin_hi_welcomed_", "hifin_hm_resultseen_", "hifin_hm_rr_", "hifin_hm_stagecache_", "hifin_hm_touch_", "hifin_htk_tl_", "hifin_htkbal_", "hifin_leads_", "hifin_policies_", "hifin_price_", "hifin_pu_done_", "hifin_ref_", "hifin_ref_by_", "hifin_ref_done_", "hifin_reports_", "hifin_rpm_ack_", "hifin_shop_htk_", "hifin_shop_orders_", "hifin_soap_", "hifin_sub_due_seen_", "hifin_subs_", "hifin_topup_orders_", "hifin_vault_", "hifin_vault_v2_", "hifin_vaultlog_", "pi_seq_", "hifin_backup_", "hifin_handoff_result_"];

/* 키 그룹 규약(네임스페이스) — 새 키는 이 그룹 접두 중 하나를 따라야 한다(D-1 규약) */
const HIFIN_KEY_GROUPS = [
  { g: "vault", ko: "데이터 금고", pats: ["hifin_vault", "hifin_chain", "hifin_hash"], sensitive: "높음(가명 원본)" },
  { g: "health", ko: "검진·건강", pats: ["hifin_chk_", "hifin_adh_", "hifin_medrem", "hifin_rx", "hifin_soap_", "hifin_reports_"], sensitive: "높음" },
  { g: "insurance", ko: "보험·재무", pats: ["hifin_ins_", "hifin_claim", "hifin_rerate", "hifin_policies_", "hifin_htk", "hifin_self_ins", "hifin_bills_", "hifin_fin_"], sensitive: "높음" },
  { g: "commerce", ko: "커머스·구독", pats: ["hifin_shop_", "hifin_subs_", "hifin_sub_", "hifin_topup", "hifin_hi_esc_", "hifin_price_", "hifin_addrbook"], sensitive: "중간" },
  { g: "family", ko: "가족·돌봄", pats: ["hifin_fam", "hifin_care", "hifin_rpm_"], sensitive: "높음(제3자)" },
  { g: "agent", ko: "에이전트 상태", pats: ["hifin_hi_", "hifin_agent_"], sensitive: "중간(대화 맥락)" },
  { g: "consent", ko: "동의·보안", pats: ["hifin_consent_", "hifin_access_log", "hifin_guard", "hifin_login_lock", "hifin_reggate", "hifin_mydata"], sensitive: "높음(감사 대상)" },
  { g: "ops", ko: "계측·운영", pats: ["hifin_events", "hifin_consent2", "hifin_telem", "hifin_wp_log", "hifin_lead", "hifin_handoff_", "hifin_hm_", "hifin_nodes", "hifin_ocr", "hifin_backup"], sensitive: "낮음(경량 식별자만)" },
  { g: "growth", ko: "추천·거버넌스·기타", pats: ["hifin_ref_", "hifin_gov_", "hifin_sharing", "hifin_share", "hifin_divi", "hifin_g2_", "hifin_g4_", "hifin_pu_", "pi_", "hifin_easyread", "hifin_connectors"], sensitive: "낮음" },
  { g: "session", ko: "세션(휘발)", pats: ["hifin_sid", "hifin_hm_code", "hifin_hi_welcome", "hifin_dl_ready", "hifin_force_onboard"], sensitive: "낮음" },
];
function hifinKeyGroup(key) {
  for (const gr of HIFIN_KEY_GROUPS) for (const p of gr.pats) if (String(key).indexOf(p) === 0) return gr;
  return null;
}
function hifinCatalogKnown(key) {
  const k = String(key);
  if (HIFIN_KEYS_STATIC.indexOf(k) >= 0) return true;
  return HIFIN_KEYS_PREFIX.some((p) => k.indexOf(p) === 0);
}

/* ── 외부 데이터 소스·커넥터(§7 맵의 코드화) — url은 공식 도메인, phase는 운영계획 단계 ── */
const HIFIN_EXTERNAL_SOURCES = [
  { key: "datago-hira", ko: "공공데이터포털 · 심평원 병원정보서비스", url: "data.go.kr (API 15001698·15001699) · opendata.hira.or.kr", brings: "병의원·약국 현황(hira/checkup_orgs.json 원천)", status: "사용 중", phase: "D-1 정기 갱신 전환", cycle: "분기" },
  { key: "nhis-exam", ko: "건보공단 검진기관 정보", url: "nhis.or.kr (API 15001672)", brings: "국가검진기관·검진 항목(checkupCenters 원천)", status: "계획", phase: "D-1", cycle: "분기" },
  { key: "myhealthway", ko: "건강정보 고속도로(보건복지부 마이헬스웨이)", url: "myhealthway.go.kr", brings: "회원 동의 기반 진료·투약·검사 12종 113항목 — 금고 D2 실데이터의 공식 관문", status: "계획", phase: "D-2 핵심", cycle: "회원 동의 시" },
  { key: "egen", ko: "응급의료포털 E-Gen", url: "e-gen.or.kr", brings: "실시간 응급실 — A4 트리아지 안내", status: "계획", phase: "D-2", cycle: "실시간" },
  { key: "kdca-health", ko: "국가건강정보포털", url: "health.kdca.go.kr", brings: "질환 콘텐츠(disease_care 보강)", status: "계획", phase: "D-2", cycle: "반기" },
  { key: "mydata-credit", ko: "신용정보원 마이데이터 · 금감원 파인", url: "fine.fss.or.kr(내보험찾아줌)", brings: "보유 계약·실손 세대 실조회(insuranceCohort 대체)", status: "계획", phase: "D-2 핵심", cycle: "회원 동의 시" },
  { key: "ins-disclosure", ko: "생보·손보 공시실 · 보험개발원", url: "pub.insure.or.kr · kpub.knia.or.kr · kidi.or.kr", brings: "상품 공시·요율 통계(A2 비교·재산정 근거)", status: "계획", phase: "D-2", cycle: "월" },
  { key: "hyundai", ko: "현대해상 파트너 연동", url: "(전용 API)", brings: "리드·계약·정산(leadRouting 실연동)", status: "협의", phase: "협의", cycle: "실시간" },
  { key: "mfds", ko: "식품안전나라 · 의약품안전나라(식약처)", url: "foodsafetykorea.go.kr · nedrug.mfds.go.kr", brings: "건기식 기능성·의약품 상호작용(A3 라벨 검증·supp 확인)", status: "계획", phase: "D-1~D-2", cycle: "분기" },
  { key: "stats", ko: "KOSIS · 국민건강영양조사 · 장기요양", url: "kosis.kr · knhanes.kdca.go.kr · longtermcare.or.kr", brings: "유병률(관리포인트 근사 원천화)·재가기관 1,705 갱신", status: "일부 사용 중", phase: "D-1", cycle: "연" },
  { key: "work-github", ko: "업무 커넥터 · GitHub", url: "github.com(저장소 연동)", brings: "코드·게이트·배포 이력", status: "즉시 연결 가능", phase: "즉시", cycle: "실시간" },
  { key: "work-drive", ko: "업무 커넥터 · Google Drive/Gmail/Slack", url: "(Claude 커넥터)", brings: "형 검수 산출물 공유함·주간 리포트 발송", status: "즉시 연결 가능", phase: "즉시", cycle: "실시간" },
  { key: "work-chrome", ko: "업무 커넥터 · Claude in Chrome", url: "(연결됨)", brings: "공시실·포털 자료 수집 자동화(공개 자료·본인 계정 한정)", status: "연결됨", phase: "즉시", cycle: "수시" },
];

/* 조회 유틸 + 관리자 훅 */
function hifinCatalogSummary() {
  return { layers: HIFIN_DATA_LAYERS.length, keysStatic: HIFIN_KEYS_STATIC.length, keysPrefix: HIFIN_KEYS_PREFIX.length,
    groups: HIFIN_KEY_GROUPS.length, external: HIFIN_EXTERNAL_SOURCES.length };
}
try {
  if (typeof window !== "undefined") {
    window.__hifinCatalog = function (q) {
      try {
        if (typeof isAdminRole !== "function" || !isAdminRole()) return { error: "admin only" };
        if (q) return { key: q, known: hifinCatalogKnown(q), group: hifinKeyGroup(q) };
        return Object.assign(hifinCatalogSummary(), { layers: HIFIN_DATA_LAYERS, external: HIFIN_EXTERNAL_SOURCES.map((s) => s.key) });
      } catch (e) { return { error: String(e).slice(0, 160) }; }
    };
  }
} catch (e) {}
