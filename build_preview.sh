#!/usr/bin/env bash
# 단일 JSX(HumanHealth_SuperApp_Skeleton (2).jsx)를 importmap + 브라우저 Babel로 렌더하는
# 미리보기 HTML(index.html, preview.html)을 생성한다. (Node 미설치 환경용)
set -e
cd "$(dirname "$0")"
# 소스의 진실 = src/ 폴더(_manifest.txt 순서). 데이터=data/dummy_data.js(plain), CSS=data/app.css.
# 참고: 백서반영표 자동 로그(src/data/wpAutoLog.js)는 여기서 갱신하지 않는다.
#       커밋 시 post-commit 훅(scripts/githooks/post-commit)만 갱신 → 일반 빌드/커밋 속도 유지.

cat > _h.txt <<'HEAD'
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
<title>HI-Fin Tech · AI 헬스케어·핀테크 임팩트기업</title>
<meta name="description" content="치료비 걱정 없는 평생 건강관리 생태계 — 건강검진·보험·건강쇼핑·건강금융을 잇는 AI 헬스케어·핀테크 임팩트기업" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HI-Fin Tech" />
<meta property="og:title" content="HI-Fin Tech · AI 헬스케어·핀테크 임팩트기업" />
<meta property="og:description" content="치료비 걱정 없는 평생 건강관리 생태계 — 건강검진·보험·건강쇼핑·건강금융을 잇는 AI 헬스케어 슈퍼앱" />
<meta property="og:image" content="https://www.hi-fintech.com/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://www.hi-fintech.com/" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="HI-Fin Tech · AI 헬스케어·핀테크 임팩트기업" />
<meta name="twitter:description" content="치료비 걱정 없는 평생 건강관리 생태계" />
<meta name="twitter:image" content="https://www.hi-fintech.com/og.png" />
<link rel="icon" type="image/png" href="./og.png" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<link rel="stylesheet" href="./data/app.css" />
<style>html,body{margin:0;padding:0;background:#EEF1F8;}#loading{font-family:sans-serif;padding:40px;color:#555;}.leaflet-container{font:inherit;}</style>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react/": "https://esm.sh/react@18.3.1/",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/": "https://esm.sh/react-dom@18.3.1/",
    "lucide-react": "https://esm.sh/lucide-react@0.460.0?deps=react@18.3.1"
  }
}
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
</head>
<body>
<div id="root"><div id="loading">로딩 중… (CDN에서 React/지도를 불러오는 중)</div></div>
<script src="./src/data/dummy_data.js"></script>
<script src="./src/data/section_data.js"></script>
<script src="./src/data/demo_members.js"></script>
<script type="text/babel" data-type="module" data-presets="react">
import { createRoot as __createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
HEAD

cat > _t.txt <<'TAIL'

__createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>
TAIL

# src/ 컴포넌트 파일들을 manifest 순서대로 이어붙여 단일 Babel 모듈 생성
# 무결성 가드 — OneDrive에서 소스가 일시적으로 비어/잘려 읽히면 파일이 통째로 누락된 번들이 조용히 만들어진다.
# 조립은 파이썬 단일 패스로 한다:
#   ① 셸 루프(파일당 프로세스 3개)보다 훨씬 빠르고
#   ② 읽은 바이트를 그 자리에서 세므로 크기를 '다시 재는' 경쟁 상태가 없다.
#      (OneDrive는 방금 쓴 대용량 파일의 stat 크기를 늦게 반영해, 사후 검사는 양방향 오탐을 낸다)
python - <<'PYBUILD' || exit 1
import io, os, sys
try: sys.stdout.reconfigure(encoding="utf-8"); sys.stderr.reconfigure(encoding="utf-8")   # 콘솔은 UTF-8 — 기본 cp949면 한글 오류메시지가 깨진다
except Exception: pass
out = io.open("index.html", "wb")
out.write(io.open("_h.txt", "rb").read())
n = 0
for line in io.open("src/_manifest.txt", encoding="utf-8"):
    f = line.strip()
    if not f:
        continue
    if not os.path.exists(f):
        sys.stderr.write("빌드 중단 — 소스를 찾을 수 없습니다: %s\n" % f); sys.exit(1)
    b = io.open(f, "rb").read()
    if not b.strip():
        sys.stderr.write("빌드 중단 — 소스가 비어 읽혔습니다: %s\n" % f); sys.exit(1)
    out.write(b); out.write(b"\n"); n += 1
out.write(io.open("_t.txt", "rb").read())
out.close()
PYBUILD
cp index.html preview.html
# 데이터/CSS 캐시버스팅(?v=hash) — 데이터·스타일 변경 시 배포 후 즉시 반영(브라우저 캐시 무효화)
VER=$(cat src/data/dummy_data.js src/data/section_data.js src/data/demo_members.js data/app.css 2>/dev/null | md5sum | cut -c1-10)
for F in index.html preview.html; do
  sed -i "s#\./data/app\.css#./data/app.css?v=$VER#g; s#\./src/data/dummy_data\.js#./src/data/dummy_data.js?v=$VER#g; s#\./src/data/section_data\.js#./src/data/section_data.js?v=$VER#g; s#\./src/data/demo_members\.js#./src/data/demo_members.js?v=$VER#g" "$F"
done
rm _h.txt _t.txt
echo "rebuilt index.html / preview.html (src/ $(grep -c . src/_manifest.txt) files)"
