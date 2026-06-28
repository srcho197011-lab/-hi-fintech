# HI-Fin Tech (Health-InsurFin Tech) — 홈페이지

헬스케어 · 금융보험 · 핀테크가 결합된 초개인화 AI 건강금융 플랫폼 프로토타입.

## 구성
- **정적 사이트** — 별도 빌드/서버 불필요. 브라우저에서 React(esm.sh CDN) + Babel standalone로 렌더.
- `index.html` — 배포되는 실제 화면(빌드 산출물)
- `data/` — 스타일(app.css)·더미데이터(*.js)·콘텐츠(*.json)·이미지
- `src/` — 컴포넌트 소스(.jsx). `build_preview.sh`가 manifest 순서로 이어붙여 `index.html` 생성
- `vercel.json` — 정적 배포 설정

## 로컬 미리보기
```bash
bash build_preview.sh          # src/ → index.html 재생성
py -m http.server 5599         # http://localhost:5599 접속
```

## 배포
GitHub에 푸시하면 Vercel이 자동 배포(정적). 빌드 명령 없음, 출력 디렉터리 = 루트.

> ⚠️ 본 사이트의 건강·보험·데모 회원 데이터는 **시연용 가상 데이터**이며 실제 의학적 진단·보험 심사를 대체하지 않습니다.
