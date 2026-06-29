#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국가건강정보포털(질병관리청) 일반건강정보 일괄 다운로더
https://health.kdca.go.kr/  ·  교육/연구 목적의 정중한 수집 도구

표준 라이브러리만 사용하므로 별도 설치가 필요 없습니다. (Python 3.9+)

목록 페이지:  /healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoMain.do  (POST, pageIndex)
상세 페이지:  /healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=XXXX  (GET)

[사용 예]
  py kdca_health_download.py                 # 일반건강정보 전체(약 660여 건) txt+html 저장
  py kdca_health_download.py --max 20        # 앞 20건만 (테스트)
  py kdca_health_download.py --list-only     # 목록(index.csv)만 만들고 종료
  py kdca_health_download.py --formats txt   # 본문 텍스트만 저장
  py kdca_health_download.py --delay 2.0     # 요청 간 2초 (서버 부하 최소화)

[책임 있는 사용 안내]
  - 본 도구는 '조회가 허가된 공개 자료'를 교육 목적으로 보존하기 위한 용도입니다.
  - 기본 지연(1초)·재시도·이어받기를 두어 서버에 부담을 주지 않도록 했습니다.
  - 재배포 시 출처(질병관리청 국가건강정보포털)와 각 콘텐츠의 저작권/이용약관을 반드시 확인하세요.
"""

import argparse
import csv
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from http.client import IncompleteRead

BASE = "https://health.kdca.go.kr"
LIST_PATH = "/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoMain.do"
VIEW_PATH = "/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do"

# lclasSn 참고(일반건강정보 메인). 0 = 전체 일반건강정보
CATEGORY_HINT = {"0": "일반건강정보(전체)"}

UA = "Mozilla/5.0 (compatible; KDCA-HealthInfo-EduArchiver/1.0; +educational use)"

# 국가기관 SSL 체인이 환경에 따라 검증 실패하는 경우가 있어 관대하게 처리
_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


# ----------------------------------------------------------------------------
# HTTP
# ----------------------------------------------------------------------------
def _request(url, data=None, retries=3, timeout=40):
    """GET(data=None) 또는 POST. 지수 백오프 재시도."""
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers={
                "User-Agent": UA,
                "Accept-Language": "ko-KR,ko;q=0.9",
                "Referer": BASE + LIST_PATH,
            })
            with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as resp:
                raw = resp.read()
            return raw.decode("utf-8", "replace")
        except (urllib.error.URLError, IncompleteRead, TimeoutError) as e:
            last_err = e
            wait = 2 ** attempt
            sys.stderr.write(f"  ! 요청 실패({e}) {wait}s 후 재시도 [{attempt+1}/{retries}]\n")
            time.sleep(wait)
    raise RuntimeError(f"요청 실패: {url} :: {last_err}")


def fetch_list_page(lclas, page):
    return _request(BASE + LIST_PATH, data={"lclasSn": str(lclas), "pageIndex": str(page)})


def fetch_detail(cntnts_sn):
    url = f"{BASE}{VIEW_PATH}?cntnts_sn={cntnts_sn}"
    return url, _request(url)


# ----------------------------------------------------------------------------
# 파싱
# ----------------------------------------------------------------------------
GOVIEW_RE = re.compile(r"fn_goView\('(\d+)'\s*,\s*'([^']*)'\)")


def parse_list(html):
    """목록 페이지 HTML에서 (cntnts_sn, title) 추출. 등장 순서 유지·중복 제거."""
    seen, out = set(), []
    for sn, title in GOVIEW_RE.findall(html):
        if sn not in seen:
            seen.add(sn)
            out.append((sn, _unescape(title).strip()))
    return out


class _ContentExtractor(HTMLParser):
    """class에 target 토큰이 포함된 첫 컨테이너의 텍스트/HTML 조각을 깊이추적으로 추출."""

    SKIP_TAGS = {"script", "style", "noscript"}
    BLOCK_TAGS = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "tr", "table", "section"}

    def __init__(self, target):
        super().__init__(convert_charrefs=True)
        # target: "view-con"(class 토큰) 또는 "id:contents"(id 정확매칭)
        if target.startswith("id:"):
            self.match_id, self.match_cls = target[3:], None
        else:
            self.match_id, self.match_cls = None, target
        self.capturing = False
        self.depth = 0          # 캡처 컨테이너 내부의 div 중첩 깊이
        self.skip_depth = 0     # script/style 내부 여부
        self.text_parts = []
        self.html_parts = []
        self._done = False

    def handle_starttag(self, tag, attrs):
        if self._done:
            return
        ad = dict(attrs)
        if not self.capturing:
            hit = (self.match_id is not None and ad.get("id") == self.match_id) or \
                  (self.match_cls is not None and tag == "div"
                   and self.match_cls in ad.get("class", ""))
            if hit:
                self.capturing = True
                self.depth = 1
            return
        # 캡처 중
        if tag in self.SKIP_TAGS:
            self.skip_depth += 1
            return
        if tag == "div":
            self.depth += 1
        if tag in self.BLOCK_TAGS:
            self.text_parts.append("\n")
        self.html_parts.append(self._fmt_tag(tag, attrs))

    def handle_startendtag(self, tag, attrs):
        if self.capturing and not self.skip_depth:
            self.html_parts.append(self._fmt_tag(tag, attrs, selfclose=True))
            if tag == "br":
                self.text_parts.append("\n")

    def handle_endtag(self, tag):
        if not self.capturing or self._done:
            return
        if tag in self.SKIP_TAGS:
            if self.skip_depth:
                self.skip_depth -= 1
            return
        if tag == "div":
            self.depth -= 1
            if self.depth <= 0:
                self._done = True
                self.capturing = False
                return
        self.html_parts.append(f"</{tag}>")
        if tag in self.BLOCK_TAGS:
            self.text_parts.append("\n")

    def handle_data(self, data):
        if self.capturing and not self.skip_depth and not self._done:
            self.text_parts.append(data)
            self.html_parts.append(data)

    @staticmethod
    def _fmt_tag(tag, attrs, selfclose=False):
        keep = {"href", "src", "alt", "colspan", "rowspan"}
        a = "".join(
            f' {k}="{v}"' for k, v in attrs if k in keep and v is not None
        )
        return f"<{tag}{a}{' /' if selfclose else ''}>"

    def get_text(self):
        txt = "".join(self.text_parts)
        txt = re.sub(r"[ \t ]+", " ", txt)
        txt = re.sub(r"\n[ \t]+", "\n", txt)
        txt = re.sub(r"\n{3,}", "\n\n", txt)
        return txt.strip()

    def get_html(self):
        return "".join(self.html_parts).strip()


def _unescape(s):
    return (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
             .replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " "))


def parse_detail(html):
    """상세 HTML → (title, body_text, body_html_fragment)."""
    m = re.search(r"<title>([^<]*)</title>", html)
    title = _unescape(m.group(1)).split("|")[0].strip() if m else ""
    # 본문 컨테이너 우선순위: id=print-content(순수 인쇄본문) → contents-Div → view-con(상위 래퍼)
    for target in ("id:print-content", "id:sub-content", "view-con"):
        ext = _ContentExtractor(target)
        try:
            ext.feed(html)
        except Exception:
            pass
        text = ext.get_text()
        if len(text) >= 80:
            return title, text, ext.get_html()
    return title, text, ext.get_html()


# ----------------------------------------------------------------------------
# 유틸
# ----------------------------------------------------------------------------
def safe_filename(name, maxlen=60):
    name = re.sub(r'[\\/:*?"<>|\r\n\t]+', "_", name).strip(" .")
    name = re.sub(r"\s+", " ", name)
    return (name[:maxlen].strip() or "untitled")


def build_html_doc(title, url, fragment):
    return (
        "<!DOCTYPE html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\">\n"
        f"<title>{title}</title>\n"
        "<style>body{font-family:'Malgun Gothic',sans-serif;max-width:780px;margin:40px auto;"
        "padding:0 16px;line-height:1.7;color:#222}img{max-width:100%}"
        "table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}"
        ".src{color:#888;font-size:13px;border-top:1px solid #eee;margin-top:32px;padding-top:12px}</style>\n"
        f"</head>\n<body>\n<h1>{title}</h1>\n{fragment}\n"
        f'<p class="src">출처: 질병관리청 국가건강정보포털 · <a href="{url}">{url}</a></p>\n'
        "</body>\n</html>\n"
    )


# ----------------------------------------------------------------------------
# 메인 수집 루틴
# ----------------------------------------------------------------------------
def collect_index(lclas, delay, start_page, end_page, log):
    items, page = [], start_page
    seen = set()
    while True:
        if end_page and page > end_page:
            break
        html = fetch_list_page(lclas, page)
        page_items = [it for it in parse_list(html) if it[0] not in seen]
        if not page_items:
            log(f"[목록] page {page}: 0건 → 종료")
            break
        for sn, title in page_items:
            seen.add(sn)
        items.extend(page_items)
        log(f"[목록] page {page}: {len(page_items)}건 (누적 {len(items)})")
        page += 1
        time.sleep(delay)
    return items


def run(args):
    os.makedirs(args.out, exist_ok=True)
    log = (lambda m: print(m, flush=True)) if not args.quiet else (lambda m: None)

    cat = CATEGORY_HINT.get(str(args.lclas), f"lclasSn={args.lclas}")
    log(f"=== 국가건강정보포털 다운로더 · {cat} ===")
    log(f"출력 폴더: {os.path.abspath(args.out)} · 지연 {args.delay}s · 형식 {','.join(args.formats)}")

    items = collect_index(args.lclas, args.delay, args.start_page, args.end_page, log)
    if args.max:
        items = items[:args.max]
    log(f"총 대상: {len(items)}건")

    # index.csv 저장
    index_path = os.path.join(args.out, "index.csv")
    with open(index_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["cntnts_sn", "title", "url"])
        for sn, title in items:
            w.writerow([sn, title, f"{BASE}{VIEW_PATH}?cntnts_sn={sn}"])
    log(f"[목록 저장] {index_path}")

    if args.list_only:
        log("--list-only 지정 → 본문 다운로드 생략")
        return

    txt_dir = os.path.join(args.out, "txt")
    html_dir = os.path.join(args.out, "html")
    if "txt" in args.formats:
        os.makedirs(txt_dir, exist_ok=True)
    if "html" in args.formats:
        os.makedirs(html_dir, exist_ok=True)

    manifest, ok, skip, fail = [], 0, 0, 0
    for i, (sn, list_title) in enumerate(items, 1):
        base = f"{sn}_{safe_filename(list_title)}"
        txt_file = os.path.join(txt_dir, base + ".txt")
        html_file = os.path.join(html_dir, base + ".html")

        need_txt = "txt" in args.formats and not (args.resume and os.path.exists(txt_file))
        need_html = "html" in args.formats and not (args.resume and os.path.exists(html_file))
        if not need_txt and not need_html:
            skip += 1
            log(f"  [{i}/{len(items)}] {sn} 이미 존재 → 건너뜀")
            continue

        try:
            url, html = fetch_detail(sn)
            title, text, fragment = parse_detail(html)
            title = title or list_title
            if need_txt:
                with open(txt_file, "w", encoding="utf-8") as f:
                    f.write(f"{title}\n출처: {url}\n{'='*50}\n\n{text}\n")
            if need_html:
                with open(html_file, "w", encoding="utf-8") as f:
                    f.write(build_html_doc(title, url, fragment))
            manifest.append({"cntnts_sn": sn, "title": title, "url": url,
                             "chars": len(text)})
            ok += 1
            log(f"  [{i}/{len(items)}] {sn} {title} ({len(text)}자) OK")
        except Exception as e:
            fail += 1
            log(f"  [{i}/{len(items)}] {sn} 실패: {e}")
        time.sleep(args.delay)

    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"category": cat, "lclasSn": args.lclas, "count": len(manifest),
                   "items": manifest}, f, ensure_ascii=False, indent=2)
    log(f"\n완료: 성공 {ok} · 건너뜀 {skip} · 실패 {fail} → {os.path.abspath(args.out)}")


def main():
    p = argparse.ArgumentParser(
        description="국가건강정보포털(질병관리청) 일반건강정보 일괄 다운로더 (교육 목적)",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--lclas", default="0", help="카테고리 lclasSn (기본 0 = 일반건강정보 전체)")
    p.add_argument("--out", default="download", help="출력 폴더 (기본 ./download)")
    p.add_argument("--formats", default="txt,html",
                   help="저장 형식 콤마구분: txt,html (기본 txt,html)")
    p.add_argument("--delay", type=float, default=1.0, help="요청 간 지연 초 (기본 1.0)")
    p.add_argument("--max", type=int, default=0, help="최대 건수 제한(0=전체, 테스트용)")
    p.add_argument("--start-page", type=int, default=1, help="시작 페이지")
    p.add_argument("--end-page", type=int, default=0, help="끝 페이지(0=끝까지)")
    p.add_argument("--list-only", action="store_true", help="목록(index.csv)만 생성")
    p.add_argument("--no-resume", dest="resume", action="store_false",
                   help="이미 받은 파일도 다시 받기(기본은 이어받기)")
    p.add_argument("--quiet", action="store_true", help="로그 최소화")
    args = p.parse_args()
    # Windows 콘솔(cp949)에서도 한글/기호 로그가 깨지거나 예외나지 않도록
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    args.formats = [x.strip() for x in args.formats.split(",") if x.strip()]
    try:
        run(args)
    except KeyboardInterrupt:
        sys.stderr.write("\n중단됨. 이어받기(--resume 기본)로 재실행하면 이어집니다.\n")
        sys.exit(130)


if __name__ == "__main__":
    main()
