# 국가건강정보포털 일괄 다운로더

질병관리청 건강정보(국가건강정보포털 등)를 **교육·연구 목적**으로 보존하기 위한
정중한(rate-limit) 일괄 다운로드 CLI입니다.

지원 자료원(`--source`):
- `general` — **일반건강정보** (health.kdca.go.kr, 약 660여 건, 기본값)
- `elderly` — **노인 건강정보** (약 64건)
- `youth` — **청소년 건강정보** (약 33건)
- `ccvd` — **심뇌혈관질환정보** (4건: 뇌졸중·뇌졸중 이후의 삶·심폐소생술·심근경색)
- `rdiz` — **희귀질환 헬프라인** 질환목록 (helpline.kdca.go.kr, 약 1,314건)
- `ptl` — **희귀질환 헬프라인 안내자료** (지원사업·통계·교육자료·저작권 등 13건)

- 표준 라이브러리만 사용 → **별도 설치 불필요** (Python 3.9+)
- 요청 간 지연·재시도·이어받기 내장 → 서버 부담 최소화
- 본문을 `txt`(순수 텍스트) + `html`(읽기 좋은 단일 문서)로 저장, `index.csv`/`manifest.json` 생성

## 빠른 시작

```powershell
# 폴더로 이동
cd "tools\health-downloader"

# 앞 20건만 테스트
py kdca_health_download.py --max 20

# 일반건강정보 전체(약 660여 건) 다운로드
py kdca_health_download.py --delay 1.5 --out download

# 노인 건강정보(약 64건) 다운로드
py kdca_health_download.py --source elderly --out download_elderly

# 청소년 건강정보(약 33건) 다운로드
py kdca_health_download.py --source youth --out download_youth

# 심뇌혈관질환정보(4건) 다운로드
py kdca_health_download.py --source ccvd --out download_ccvd

# 희귀질환 헬프라인(약 1,314건) 다운로드 — 양이 많으니 지연 넉넉히
py kdca_health_download.py --source rdiz --delay 1.5 --out download_rdiz

# 헬프라인 안내자료 묶음(13건) 다운로드
py kdca_health_download.py --source ptl --out download_ptl

# 아무 단일 페이지나 URL로 직접 받기(자료원에 없는 페이지)
py kdca_health_download.py --url "https://helpline.kdca.go.kr/cdchelp/ph/ptlcontents/selectPtlConSent.do?schSno=155&menu=F0101"
# 여러 개는 콤마로 구분
py kdca_health_download.py --url "URL1,URL2,URL3" --out download_misc
```

> Windows 콘솔에서 한글 로그가 깨지면 먼저 `chcp 65001` 또는 `$env:PYTHONUTF8="1"` 를 실행하세요.
> 스크립트 내부에서 출력 인코딩을 UTF-8로 보정하므로 파일 자체는 항상 UTF-8입니다.

## 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--source` | `general`/`elderly`/`youth`/`ccvd`/`rdiz`/`ptl` | `general` |
| `--url` | 단일/다중 페이지 URL 직접 다운로드(자료원 무시, 본문 자동탐지) | - |
| `--lclas N` | 카테고리 `lclasSn` (0 = 전체) | `0` |
| `--out DIR` | 출력 폴더 | `download` |
| `--formats txt,html` | 저장 형식(콤마 구분) | `txt,html` |
| `--delay SEC` | 요청 간 지연 초 (예의상 권장 1.0↑) | `1.0` |
| `--max N` | 최대 건수(0=전체, 테스트용) | `0` |
| `--start-page` / `--end-page` | 목록 페이지 범위 | `1` / 끝까지 |
| `--list-only` | 목록(`index.csv`)만 생성하고 종료 | off |
| `--no-resume` | 이미 받은 파일도 다시 받기 | off(기본 이어받기) |
| `--quiet` | 로그 최소화 | off |

## 출력 구조

```
download/
├─ index.csv         # cntnts_sn, title, url 전체 목록 (Excel 호환 UTF-8-SIG)
├─ manifest.json     # 수집 결과 메타(건수·글자수)
├─ txt/              # 6722_근 손실.txt ...
└─ html/             # 6722_근 손실.html ...
```

## 동작 방식

- **목록형**(general/elderly/youth): 목록 페이지에 `pageIndex` POST 순회, `fn_goView('<cntnts_sn>', ...)`에서 글 번호 수집(중복 제거, 빈 페이지에서 종료) → 상세 `...View.do?cntnts_sn=<번호>` GET, `id="print-content"` 본문 추출
- **개별 페이지형**(ccvd): 페이지네이션 없이 미리 정의된 콘텐츠 페이지(`*Main.do`)를 직접 GET
- **전체 1회 수신형**(rdiz): 희귀질환은 페이지네이션이 불안정하여 `pageUnit`을 키워 전체 목록을 한 번에 받음. `fn_moveDetail('<rdizCd>')`로 코드 수집 → 상세 `selectRdizInfDetail.do?rdizCd=<코드>` GET, `dic_detail` 본문·표에서 질환명 추출
- **단일 URL형**(`--url`): 자료원에 없는 임의의 페이지를 직접 GET. 본문 컨테이너를 자동탐지(`print-content`→`dic_detail`→`cont_set`→`view-con` 등)하고 제목은 `<h1>` 우선
- 모든 자료원은 세션 쿠키(JSESSIONID)를 유지하며 요청

## 책임 있는 사용

- 본 도구는 **조회가 허가된 공개 자료**를 교육 목적으로 보존하기 위한 용도입니다.
- 짧은 간격의 과도한 반복 요청은 피하세요(`--delay` 충분히, 야간/저부하 시간 권장).
- 재배포 시 **출처(질병관리청 국가건강정보포털)** 와 각 콘텐츠의 저작권·이용약관을 반드시 확인하세요.
  공공저작물은 일반적으로 출처표시(공공누리) 조건이 적용됩니다.
