#!/usr/bin/env bash
# 단일 JSX(HumanHealth_SuperApp_Skeleton (2).jsx)를 importmap + 브라우저 Babel로 렌더하는
# 미리보기 HTML(index.html, preview.html)을 생성한다. (Node 미설치 환경용)
set -e
cd "$(dirname "$0")"
# 소스의 진실 = src/ 폴더(_manifest.txt 순서). 데이터=data/dummy_data.js(plain), CSS=data/app.css.

cat > _h.txt <<'HEAD'
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HumanHealth SuperApp · Preview</title>
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
<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
</head>
<body>
<div id="root"><div id="loading">로딩 중… (CDN에서 React/지도를 불러오는 중)</div></div>
<script src="./data/dummy_data.js"></script>
<script src="./data/section_data.js"></script>
<script src="./data/demo_members.js"></script>
<script type="text/babel" data-type="module" data-presets="react">
import { createRoot as __createRoot } from "react-dom/client";
HEAD

cat > _t.txt <<'TAIL'

__createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>
TAIL

# src/ 컴포넌트 파일들을 manifest 순서대로 이어붙여 단일 Babel 모듈 생성
cat _h.txt > index.html
while IFS= read -r f; do
  [ -z "$f" ] && continue
  cat "$f" >> index.html
  printf '\n' >> index.html
done < <(sed 's/\r$//' src/_manifest.txt)
cat _t.txt >> index.html
cp index.html preview.html
rm _h.txt _t.txt
echo "rebuilt index.html / preview.html (src/ $(grep -c . src/_manifest.txt) files)"
