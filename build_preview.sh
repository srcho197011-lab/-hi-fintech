#!/usr/bin/env bash
# 단일 JSX(HumanHealth_SuperApp_Skeleton (2).jsx)를 importmap + 브라우저 Babel로 렌더하는
# 미리보기 HTML(index.html, preview.html)을 생성한다. (Node 미설치 환경용)
set -e
cd "$(dirname "$0")"

# ── 내비 인벤토리 신선도 게이트(설계 프롬프트 v2.1 §10-1) ──
# 감시 파일이 바뀌었는데 navInventory.js가 구버전이면 빌드 실패(재생성 안내).
# 비상 우회(1회용): HIFIN_NAV_BYPASS=1 — 콘솔에 드리프트 배지가 켜지고, 다음 커밋에서 해소해야 한다.
if [ "${HIFIN_NAV_BYPASS:-0}" = "1" ]; then
  python scripts/gen_nav_inventory.py --mark-bypass || true
else
  python scripts/gen_nav_inventory.py --check
fi
# 소스의 진실 = src/ 폴더(_manifest.txt 순서). 데이터=data/dummy_data.js(plain), CSS=data/app.css.
# 참고: 백서반영표 자동 로그(src/data/wpAutoLog.js)는 여기서 갱신하지 않는다.
#       커밋 시 post-commit 훅(scripts/githooks/post-commit)만 갱신 → 일반 빌드/커밋 속도 유지.

# ── 외부 자원 무결성(SRI · Phase 0) ──
# 외부 CDN 7종에 sha384 무결성 해시를 건다. CDN이 바뀐 파일을 내려주면 브라우저가 **실행을 거부**한다.
# ⚠️ 버전을 올리면 해시도 반드시 같이 갱신한다 — 안 하면 자원이 통째로 안 뜨고 화면이 빈다.
#    갱신: curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
# crossorigin="anonymous" 가 없으면 SRI 검증 자체가 서지 않는다(교차 출처 자원이라 CORS가 전제다).
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
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous" referrerpolicy="no-referrer" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" integrity="sha384-pmjIAcz2bAn0xukfxADbZIb3t8oRT9Sv0rvO+BR5Csr6Dhqq+nZs59P0pPKQJkEV" crossorigin="anonymous" referrerpolicy="no-referrer" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" integrity="sha384-wgw+aLYNQ7dlhK47ZPK7FRACiq7ROZwgFNg0m04avm4CaXS+Z9Y7nMu8yNjBKYC+" crossorigin="anonymous" referrerpolicy="no-referrer" />
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
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" integrity="sha384-eXVCORTRlv4FUUgS/xmOyr66XBVraen8ATNLMESp92FKXLAMiKkerixTiBvXriZr" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" integrity="sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js" integrity="sha384-EIcs2MbARRLcLs7Gv2wqqhhfMlcLeW9yuJsWki1r5iveN1F5gpzHOwAKycJqSQOI" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
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

# ── SRI 자기검사(Phase 0) ──
# 외부 자원을 하나 더 넣으면서 무결성 해시를 빠뜨리면 **그 자원만 조용히 무방비**가 된다.
# 그래서 외부 자원 수와 integrity 수가 같은지 빌드가 직접 센다. 다르면 빌드를 멈춘다.
_ext=$(grep -oE '(src|href)="https://(unpkg\.com|cdnjs\.cloudflare\.com)[^"]*"' index.html | wc -l | tr -d ' ')
_sri=$(grep -c 'integrity="sha384-' index.html | tr -d ' ')
if [ "$_ext" != "$_sri" ]; then
  echo "[SRI] 외부 자원 $_ext 개 중 무결성 $_sri 개 — 빠진 자원이 있습니다. build_preview.sh 의 head 템플릿을 확인하세요." >&2
  exit 1
fi
echo "rebuilt index.html / preview.html (src/ $(grep -c . src/_manifest.txt) files)"
