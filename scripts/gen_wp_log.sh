#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 백서반영표 자동 로그 생성기 — 실제 구현은 scripts/gen_wp_log.py 에 있다.
#
# 이 파일은 호출부(build_preview.sh · git post-commit 훅)가 그대로 쓰도록 남긴 껍데기다.
# 원래 여기 있던 bash 루프는 커밋 하나마다 grep·sed·awk 를 열 번 남짓 띄워
# 252커밋에 8분 53초가 걸렸다 — post-commit 훅이 매번 그만큼 멈춰 설 수는 없다.
# 같은 출력을 내는 파이썬 한 번 읽기로 옮겨 0.6초가 됐다.
#
# 트레일러 형식·파싱 규칙은 gen_wp_log.py 머리말에 적혀 있다.
# ─────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")/.."

PY=python
command -v "$PY" >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || {
  # 파이썬이 없는 환경(예: 정적 서빙)에서는 기존 파일을 그대로 둔다 — 빈 배열만 보장
  [ -f src/data/wpAutoLog.js ] || printf '/* auto */\nconst WP_AUTO_LOG = [];\n' > src/data/wpAutoLog.js
  exit 0
}

exec "$PY" scripts/gen_wp_log.py
