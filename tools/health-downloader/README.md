# 국가건강정보포털 일괄 다운로더

질병관리청 **국가건강정보포털**(health.kdca.go.kr)의 *일반건강정보* 콘텐츠를
**교육·연구 목적**으로 보존하기 위한 정중한(rate-limit) 일괄 다운로드 CLI입니다.

- 표준 라이브러리만 사용 → **별도 설치 불필요** (Python 3.9+)
- 요청 간 지연·재시도·이어받기 내장 → 서버 부담 최소화
- 본문을 `txt`(순수 텍스트) + `html`(읽기 좋은 단일 문서)로 저장, `index.csv`/`manifest.json` 생성

## 빠른 시작

```powershell
# 폴더로 이동
cd "tools\health-downloader"

# 앞 20건만 테스트
py kdca_health_download.py --max 20

# 전체(약 660여 건) 다운로드
py kdca_health_download.py --delay 1.5 --out download
```

> Windows 콘솔에서 한글 로그가 깨지면 먼저 `chcp 65001` 또는 `$env:PYTHONUTF8="1"` 를 실행하세요.
> 스크립트 내부에서 출력 인코딩을 UTF-8로 보정하므로 파일 자체는 항상 UTF-8입니다.

## 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--lclas N` | 카테고리 `lclasSn` (0 = 일반건강정보 전체) | `0` |
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

- 목록: `gnrlzHealthInfoMain.do` 에 `pageIndex`를 POST하며 페이지를 순회, `fn_goView('<cntnts_sn>', ...)`에서 글 번호 수집(중복 제거, 빈 페이지에서 종료)
- 상세: `gnrlzHealthInfoView.do?cntnts_sn=<번호>` 를 GET, `id="print-content"` 영역의 본문만 추출

## 책임 있는 사용

- 본 도구는 **조회가 허가된 공개 자료**를 교육 목적으로 보존하기 위한 용도입니다.
- 짧은 간격의 과도한 반복 요청은 피하세요(`--delay` 충분히, 야간/저부하 시간 권장).
- 재배포 시 **출처(질병관리청 국가건강정보포털)** 와 각 콘텐츠의 저작권·이용약관을 반드시 확인하세요.
  공공저작물은 일반적으로 출처표시(공공누리) 조건이 적용됩니다.
