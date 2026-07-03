#!/usr/bin/env bash
# sm 로컬 미리보기 (포트 5603) — 세 앱 포트 분리로 충돌 방지
cd "$(dirname "$0")"
python -m http.server 5603
