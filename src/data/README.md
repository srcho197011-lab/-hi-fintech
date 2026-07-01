# 데이터하우스 (src/data/)

HI-Fin Tech의 모든 데이터를 이 폴더로 일원화한다. 로딩 방식은 두 갈래다.

## 1) Babel 번들 데이터 (`src/_manifest.txt` 등재 → 단일 모듈로 컴파일)
앱 전역 상수로 사용된다(같은 스코프).

| 파일 | 내용 |
|---|---|
| `sectionData.js` | 섹션 도메인 데이터: 지갑(WALLET·EARN·USE·GUIDE·SEC)·NFT(NFT_*)·마이페이지(MY_*)·커뮤니티(CAV_COLORS·COMM_*)·재가돌봄(SVC_META·GENIEL) |
| `healthKnowledge.js` | 데이터하우스 온톨로지: NUTRITION_KB·DEVICE_KB·DIET_KB·SUPPORT_KB·SCREENING_KB·GROUP_KB·CASE_KB·ENTITY_DEFS |
| `healthOntology.js` | CHECKUP_ONTOLOGY(검진항목)·DISEASE_INSURANCE·ONTO_GOVERNANCE(의료법 준수) |
| `telemed.js` | 원격주치의: REGION_KB(전국 시·군·구)·DEPT_CATS(진료과)·genSpecialists·TELE_RULES(비대면 제도) |
| `checkupCenters.js` | 전국 검진기관 51곳(한건협·KMI·브랜드) + SIDO_RANK |
| `shopProducts.js` | 건강쇼핑 영양제 20종 + 건강적립금 모듈(healthReward, 판매가 25%)·runShopRewardTests |
| `demoMembers.js` | `DEMO_MEMBERS`(window.__HHDATA) 전역 별칭 |

## 2) Plain 스크립트 / JSON (Babel 미경유 — `<script>`/`fetch`로 로드)
대용량이라 컴파일 부담을 피하려 분리한다. **manifest에 넣지 않는다.**

| 파일 | 로드 | 노출/소비 |
|---|---|---|
| `demo_members.js` | `<script>` | `window.__HHDATA.DEMO_MEMBERS` (데모 16명) |
| `dummy_data.js` | `<script>` | `window.__HHDATA`(HEALTH_CONTENTS·KDCA·DISTRICTS·FULL_* 등) |
| `section_data.js` | `<script>` | `window.__HHDATA` 보강 |
| `kdca.json` / `kdca_qa.json` | `fetch` | AIDoctor 학습 코퍼스(664질환·1,947 Q&A) |
| `guidelines.json` | `fetch` | 임상 진료지침 Q&A |
| `hira.json` | `fetch` | 심평원 병원·약국(검진/병원) |
| `homecare.json` | `fetch` | 재가·돌봄 기관 |
| `report.json` | `fetch` | 개인 건강분석 리포트 |

> ⚠️ 대용량 JSON을 Babel 번들(manifest)로 옮기면 브라우저 Babel 컴파일이 폭증해 화면 정지·포터블 동결 위험. 반드시 plain/fetch 유지.

## 잔여(컴포넌트 내 상수 — 추후 이관 가능)
Shop(SHOP_*·MEMBER_PRODUCTS·SPORTS_*)·Insurance(INS_*·CHECK_*·PROVIDERS)·Checkup(REGIONS·CENTROID·CH_REC 등)·AIDoctor(HC_CATS·REC_Q·MD_*·ORGAN_DEPT 등)는 로직과 교차 배치되어 있어, 순차적으로 sectionData.js(또는 섹션별 파일)로 이관한다. *단일 스코프이므로 런타임 동작은 위치와 무관하며, 정리 목적의 이동이다.*
