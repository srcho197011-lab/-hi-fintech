# HI-Human 사업 — 3개 앱 모노레포

헬스케어 · 금융보험 · 핀테크가 결합된 초개인화 AI 건강금융 플랫폼군. **세 개의 자매 앱을 형제 폴더로 분리 관리**합니다(디렉터리·미리보기·포트 충돌 방지).

## 폴더 구조
```
(저장소 루트)
├─ fin/   HI-Fin Tech (휴먼 건강금융)   — Vercel 루트 디렉터리: fin,  로컬 포트 5601
├─ pet/   HI-PET (펫 InsurFin)          — Vercel 루트 디렉터리: pet,  로컬 포트 5602
├─ sm/    Hi-Safety (AI-SM 안전관리)    — Vercel 루트 디렉터리: sm,   로컬 포트 5603
├─ tools/                              — 교육용 데이터 수집 도구
└─ *.md / 설계문서                       — 참고 문서(비배포)
```
- 세 앱 모두 **정적 사이트**(별도 빌드/서버 불필요, 브라우저에서 React esm.sh CDN + Babel standalone 렌더).
- **한 저장소**를 공유하되 각 앱은 서로의 부모가 아닌 **형제(sibling)** 이므로, 각 폴더를 개별 프로젝트 루트/사용자지정 디렉터리로 열 수 있습니다.

## 로컬 미리보기 (포트 분리)
```bash
# HI-Fin
cd fin && bash build_preview.sh && bash serve.sh   # http://localhost:5601
# HI-PET
cd pet && bash serve.sh                            # http://localhost:5602
# Hi-Safety
cd sm  && bash serve.sh                             # http://localhost:5603
```
> `fin/`만 소스 빌드(`build_preview.sh`: `src/` → `index.html`)를 사용합니다. `pet/`·`sm/`은 단일 `index.html`을 직접 편집합니다.

## 배포 (Vercel)
GitHub 푸시 시 Vercel이 자동 배포. **각 앱은 별도 Vercel 프로젝트**로, 프로젝트 설정의 **Root Directory**를 각각 `fin` · `pet` · `sm` 으로 지정합니다(빌드 명령 없음, 출력=해당 폴더 루트).

> ⚠️ 건강·보험·데모 회원 데이터는 **시연용 가상 데이터**이며 실제 의학적 진단·보험 심사를 대체하지 않습니다.
