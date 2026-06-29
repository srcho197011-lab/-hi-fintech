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
import http.cookiejar
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

DEFAULT_BASE = "https://health.kdca.go.kr"
_PREFIX = "/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo"

# 본문 컨테이너 우선순위(class 토큰 또는 "id:..." 정확매칭)
DEFAULT_CONTAINERS = ("id:print-content", "view-con")
# --url 범용 모드에서 시도할 컨테이너 후보(앞에서부터 충분한 텍스트를 가진 첫 것 채택)
AUTO_CONTAINERS = ("id:print-content", "dic_detail", "id:cont_set", "con_area",
                   "id:div_page", "view-con", "id:contents", "id:sub-content")

# 목록 항목 추출 정규식
#  - goView형: fn_goView('<숫자 cntnts_sn>', '<제목>')  → id+제목
#  - rdiz형  : fn_moveDetail('<rdizCd>')                → id만(제목은 상세에서)
ITEM_RE_GOVIEW = re.compile(r"fn_goView\('(\d+)'\s*,\s*'([^']*)'\)")
ITEM_RE_RDIZ = re.compile(r"fn_moveDetail\('([A-Za-z0-9]+)'\)")
# 국가암정보센터 목록: <a href="view.do?cancer_seq=NN"> <span class="name">암이름</span>
ITEM_RE_CANCER = re.compile(r'cancer_seq=(\d+)"[^>]*>\s*<span class="name">([^<]+)</span>')
# 국가정신건강정보포털 목록: dissView('25','1형 양극성장애')
ITEM_RE_MHEALTH = re.compile(r"dissView\('(\d+)'\s*,\s*'([^']*)'\)")

# 게시판(bbs) 모드: cancer.go.kr egov 게시판 (--board)
# 앵커 안에 썸네일 img가 먼저 오므로 내부 전체를 잡아 태그 제거 후 제목 추출
BOARD_ITEM_RE = re.compile(r'view\.do\?article_seq=(\d+)[^"]*"[^>]*>(.*?)</a>', re.S)
BOARD_ATT_RE = re.compile(
    r'href="([^"]*download\.do[^"]*)"[^>]*>.*?<span>\s*([^<]+\.[A-Za-z0-9]{2,5})\s*</span>', re.S)

# 희귀질환 상세의 질환명(상단 표 thead 다음 첫 행의 2번째 td)
TITLE_RE_RDIZ = re.compile(
    r"</thead>\s*<tbody>\s*<tr>\s*<td[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>", re.S)

# 자료원(source) 정의.
#   목록형 키: base(기본 health), list, list_params(정적 POST 파라미터),
#             item_re, detail, detail_param(쿼리키), containers, title_re
#   개별페이지형 키: pages=[(slug, path)...]
SOURCES = {
    "general": {  # 일반건강정보 (약 660여 건, 9페이지)
        "list": f"{_PREFIX}/gnrlzHealthInfoMain.do",
        "detail": f"{_PREFIX}/gnrlzHealthInfoView.do",
        "name": "일반건강정보",
    },
    "elderly": {  # 노인 건강정보 (Old, 약 64건)
        "list": f"{_PREFIX}/gnrlzHealthInfoOld.do",
        "detail": f"{_PREFIX}/gnrlzHealthInfoOldView.do",
        "name": "노인 건강정보",
    },
    "youth": {  # 청소년 건강정보 (약 33건)
        "list": f"{_PREFIX}/gnrlzHealthInfoYouth.do",
        "detail": f"{_PREFIX}/gnrlzHealthInfoYouthView.do",
        "name": "청소년 건강정보",
    },
    "ccvd": {  # 심뇌혈관질환정보 (페이지네이션 목록이 아닌 개별 콘텐츠 페이지 묶음)
        "name": "심뇌혈관질환정보",
        "pages": [
            ("cbvcacdInfo",  "/healthinfo/biz/health/ccvdInfo/ccvcdInfo/cbvcacdInfoMain.do"),
            ("cbvcacdAfter", "/healthinfo/biz/health/ccvdInfo/ccvcdInfo/cbvcacdAfterMain.do"),
            ("cprInfo",      "/healthinfo/biz/health/ccvdInfo/cvcdInfo/cprInfoMain.do"),
            ("miInfo",       "/healthinfo/biz/health/ccvdInfo/cvcdInfo/miInfoMain.do"),
        ],
    },
    "ptl": {  # 희귀질환 헬프라인 안내/소개 콘텐츠(정적 포털 페이지 묶음)
        "base": "https://helpline.kdca.go.kr",
        "name": "희귀질환 헬프라인 안내자료",
        "containers": AUTO_CONTAINERS,
        "title_h1": True,
        # (slug=menu코드, schSno&menu) — 제목이 '소개' 등으로 겹쳐 menu코드로 파일명 구분
        "pages": [(slug, f"/cdchelp/ph/ptlcontents/selectPtlConSent.do?{q}") for slug, q in [
            ("B0101", "schSno=110&menu=B0101"),  # 지원사업 소개
            ("B0151", "schSno=139&menu=B0151"),  # 지원사업 신청 절차 안내
            ("B0201", "schSno=163&menu=B0201"),  # 소개
            ("B0301", "schSno=122&menu=B0301"),  # 소개
            ("B0501", "schSno=170&menu=B0501"),  # 주문절차 안내
            ("C0100", "schSno=123&menu=C0100"),  # 등록통계사업 소개
            ("C0300", "schSno=144&menu=C0300"),  # 자료 수집·분석
            ("C0400", "schSno=145&menu=C0400"),  # 통계 결과
            ("D0100", "schSno=169&menu=D0100"),  # 권역별 전문기관 소개
            ("F0101", "schSno=154&menu=F0101"),  # 전문교육자료 - 신규 희귀질환 지정신청
            ("F0101b", "schSno=155&menu=F0101"), # 전문교육자료 - 신규 희귀질환 지정신청(추가)
            ("F0102", "schSno=156&menu=F0102"),  # 산정특례 신청
            ("H0100", "schSno=124&menu=H0100"),  # 이용안내 - 저작권정책
        ]],
    },
    "cancer": {  # 국가암정보센터 전체암 보기 (다른 도메인, 100건, 단일 목록 페이지)
        "base": "https://www.cancer.go.kr",
        "list": "/lay1/program/S1T211C223/cancer/list.do",
        "list_params": {},
        "item_re": ITEM_RE_CANCER,
        "detail": "/lay1/program/S1T211C223/cancer/view.do",
        "detail_param": "cancer_seq",
        "containers": ("id:div_page",),
        "name": "국가암정보센터(전체암)",
    },
    "mhealth": {  # 국가정신건강정보포털 질환별 정보 (다른 도메인, 50종)
        "base": "https://www.mentalhealth.go.kr",
        "list": "/portal/disease/diseaseList.do",
        "list_params": {},
        "item_re": ITEM_RE_MHEALTH,
        "detail": "/portal/disease/diseaseDetail.do",
        "detail_param": "dissId",
        "containers": ("board_detail",),
        "name": "정신건강 질환정보",
    },
    "rdiz": {  # 희귀질환 헬프라인 질환목록 (다른 도메인, 약 1,389건)
        "base": "https://helpline.kdca.go.kr",
        "list": "/cdchelp/ph/rdiz/selectRdizInfList.do",
        "list_params": {"menu": "A0100"},
        # 페이지네이션이 불안정하여 pageUnit을 키워 전체를 1회에 수신(약 1,314건)
        "fetch_all": {"pageUnit": "5000"},
        "item_re": ITEM_RE_RDIZ,
        "detail": "/cdchelp/ph/rdiz/selectRdizInfDetail.do",
        "detail_param": "rdizCd",
        "containers": ("dic_detail",),
        "title_re": TITLE_RE_RDIZ,
        "name": "희귀질환(헬프라인)",
    },
}

# lclasSn 참고(일반건강정보 메인). 0 = 전체
CATEGORY_HINT = {"0": "전체"}

UA = "Mozilla/5.0 (compatible; KDCA-HealthInfo-EduArchiver/1.0; +educational use)"

# 국가기관 SSL 체인이 환경에 따라 검증 실패하는 경우가 있어 관대하게 처리
_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE

# 세션 쿠키(JSESSIONID 등)를 유지하는 전역 오프너 — 일부 사이트의 페이지네이션 일관성에 필요
_OPENER = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
    urllib.request.HTTPSHandler(context=_SSL),
)


# ----------------------------------------------------------------------------
# HTTP
# ----------------------------------------------------------------------------
def _request(url, data=None, retries=3, timeout=40):
    """GET(data=None) 또는 POST. 쿠키 유지 + 지수 백오프 재시도."""
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    parts = urllib.parse.urlsplit(url)
    referer = f"{parts.scheme}://{parts.netloc}/"
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers={
                "User-Agent": UA,
                "Accept-Language": "ko-KR,ko;q=0.9",
                "Referer": referer,
            })
            with _OPENER.open(req, timeout=timeout) as resp:
                raw = resp.read()
            return raw.decode("utf-8", "replace")
        except (urllib.error.URLError, IncompleteRead, TimeoutError) as e:
            last_err = e
            wait = 2 ** attempt
            sys.stderr.write(f"  ! 요청 실패({e}) {wait}s 후 재시도 [{attempt+1}/{retries}]\n")
            time.sleep(wait)
    raise RuntimeError(f"요청 실패: {url} :: {last_err}")


def src_base(src):
    return src.get("base", DEFAULT_BASE)


def detail_url(src, sid):
    param = src.get("detail_param", "cntnts_sn")
    return f"{src_base(src)}{src['detail']}?{param}={sid}"


def fetch_list_page(src, lclas, page):
    params = dict(src.get("list_params", {"lclasSn": "0"}))
    if "lclasSn" in params:
        params["lclasSn"] = str(lclas)
    params["pageIndex"] = str(page)
    return _request(src_base(src) + src["list"], data=params)


def fetch_detail(url):
    return _request(url)


def download_binary(url, path, retries=3, timeout=180):
    """첨부파일 등 바이너리를 내려받아 path에 저장. 저장 바이트수 반환."""
    parts = urllib.parse.urlsplit(url)
    referer = f"{parts.scheme}://{parts.netloc}/"
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": referer})
            with _OPENER.open(req, timeout=timeout) as resp:
                data = resp.read()
            with open(path, "wb") as f:
                f.write(data)
            return len(data)
        except (urllib.error.URLError, IncompleteRead, TimeoutError) as e:
            last_err = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"파일 다운로드 실패: {url} :: {last_err}")


# ----------------------------------------------------------------------------
# 파싱
# ----------------------------------------------------------------------------
def parse_list(html, item_re):
    """목록 페이지 HTML에서 (id, title) 추출. 등장 순서 유지·중복 제거.
    item_re의 group(1)=id, group(2)=제목(있으면)."""
    has_title = item_re.groups >= 2
    seen, out = set(), []
    for m in item_re.finditer(html):
        sid = m.group(1)
        if sid in seen:
            continue
        seen.add(sid)
        title = _unescape(m.group(2)).strip() if has_title else ""
        out.append((sid, title))
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


def parse_detail(html, containers=DEFAULT_CONTAINERS, title_re=None):
    """상세 HTML → (title, body_text, body_html_fragment)."""
    if title_re is not None:
        m = title_re.search(html)
        title = _unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""
    else:
        m = re.search(r"<title>([^<]*)</title>", html)
        title = _unescape(m.group(1)).split("|")[0].strip() if m else ""
    # 본문 컨테이너 우선순위대로 시도(첫 충분한 텍스트 채택)
    text, ext = "", None
    for target in containers:
        ext = _ContentExtractor(target)
        try:
            ext.feed(html)
        except Exception:
            pass
        text = ext.get_text()
        if len(text) >= 80:
            return title, text, ext.get_html()
    return title, text, (ext.get_html() if ext else "")


# ----------------------------------------------------------------------------
# 유틸
# ----------------------------------------------------------------------------
def safe_filename(name, maxlen=60):
    name = re.sub(r'[\\/:*?"<>|\r\n\t]+', "_", name).strip(" .")
    name = re.sub(r"\s+", " ", name)
    return (name[:maxlen].strip() or "untitled")


def url_slug(u):
    """URL에서 파일명용 짧은 식별자 생성(주요 쿼리키 우선, 없으면 경로 끝).
    끝 세그먼트가 contents/list 등 일반명이면 직전 세그먼트(예: S1T327C328) 사용."""
    parts = urllib.parse.urlsplit(u)
    qs = urllib.parse.parse_qs(parts.query)
    for k in ("schSno", "cntnts_sn", "rdizCd", "seq", "id", "sn"):
        if k in qs and qs[k]:
            return f"{k}-{qs[k][0]}"
    segs = [s for s in parts.path.split("/") if s]
    last = os.path.splitext(segs[-1])[0] if segs else "page"
    if last in ("contents", "list", "view", "index", "main", "sublink") and len(segs) >= 2:
        return segs[-2]
    return last or "page"


def _already_saved(args, txt_dir, html_dir, base):
    """요청된 모든 형식이 이미 저장돼 있으면 True(이어받기 판단)."""
    need = []
    if "txt" in args.formats:
        need.append(os.path.join(txt_dir, base + ".txt"))
    if "html" in args.formats:
        need.append(os.path.join(html_dir, base + ".html"))
    return bool(need) and all(os.path.exists(p) for p in need)


def build_html_doc(title, url, fragment):
    return (
        "<!DOCTYPE html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\">\n"
        f"<title>{title}</title>\n"
        "<style>body{font-family:'Malgun Gothic',sans-serif;max-width:780px;margin:40px auto;"
        "padding:0 16px;line-height:1.7;color:#222}img{max-width:100%}"
        "table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}"
        ".src{color:#888;font-size:13px;border-top:1px solid #eee;margin-top:32px;padding-top:12px}</style>\n"
        f"</head>\n<body>\n<h1>{title}</h1>\n{fragment}\n"
        f'<p class="src">출처: 질병관리청 · <a href="{url}">{url}</a></p>\n'
        "</body>\n</html>\n"
    )


# ----------------------------------------------------------------------------
# 메인 수집 루틴
# ----------------------------------------------------------------------------
def collect_index(src, lclas, delay, start_page, end_page, log):
    """자료원의 (id, title, url) 목록을 반환."""
    # 개별 페이지 묶음형(ccvd 등): 미리 정의된 페이지 목록
    if "pages" in src:
        items = [(slug, "", f"{src_base(src)}{path}") for slug, path in src["pages"]]
        log(f"[목록] 개별 콘텐츠 페이지 {len(items)}건")
        return items

    item_re = src.get("item_re", ITEM_RE_GOVIEW)

    # 전체 1회 수신형(rdiz 등): 큰 pageUnit으로 한 번에 받기(페이지네이션 우회)
    if "fetch_all" in src:
        base_params = dict(src.get("list_params", {}))
        # 세션 쿠키 확보용 1회 GET
        if base_params:
            _request(src_base(src) + src["list"] + "?" + urllib.parse.urlencode(base_params))
        params = dict(base_params)
        params.update(src["fetch_all"])
        params["pageIndex"] = "1"
        html = _request(src_base(src) + src["list"], data=params)
        parsed = parse_list(html, item_re)
        items = [(sid, title, detail_url(src, sid)) for sid, title in parsed]
        log(f"[목록] 전체 {len(items)}건 수신")
        return items

    # 페이지네이션 목록형: pageIndex 순회로 항목 id 수집
    items, page = [], start_page
    seen = set()
    while True:
        if end_page and page > end_page:
            break
        html = fetch_list_page(src, lclas, page)
        page_items = [it for it in parse_list(html, item_re) if it[0] not in seen]
        if not page_items:
            log(f"[목록] page {page}: 0건 → 종료")
            break
        for sid, title in page_items:
            seen.add(sid)
        items.extend((sid, title, detail_url(src, sid)) for sid, title in page_items)
        log(f"[목록] page {page}: {len(page_items)}건 (누적 {len(items)})")
        page += 1
        time.sleep(delay)
    return items


_LAY_RE = re.compile(r"/lay1/S1T(\d+)C(\d+)/(?:contents|sublink)\.do")


def collect_crawl(start_url, log, max_pages):
    """cancer.go.kr 메뉴 계층을 재귀 수집. 노드 S1TaCb의 자식 링크는 S1TbC* 패턴.
    시작이 leaf(자식 없음)면 부모(S1T?Ca)로 한 단계 올라가 형제들을 수집."""
    p = urllib.parse.urlsplit(start_url)
    origin = f"{p.scheme}://{p.netloc}"

    def get(path):
        return _request(origin + path)

    def children(path, html):
        m = re.search(r"/S1T(\d+)C(\d+)/", path)
        if not m:
            return []
        c = m.group(2)  # 이 노드의 C번호 → 자식의 T번호
        return sorted(set(re.findall(rf"/lay1/S1T{c}C\d+/(?:contents|sublink)\.do", html)))

    start_path = p.path
    h0 = get(start_path)
    # leaf이면 부모로 climb (부모 C == 시작노드 T)
    if not children(start_path, h0):
        m = re.search(r"/S1T(\d+)C(\d+)/", start_path)
        if m:
            par = re.search(rf"/lay1/S1T\d+C{m.group(1)}/(?:contents|sublink)\.do", h0)
            if par:
                start_path = par.group(0)
                log(f"[크롤] 시작 페이지가 leaf → 상위 메뉴로 이동: {start_path}")

    visited, leaves, queue = set(), [], [start_path]
    while queue and len(leaves) < max_pages:
        path = queue.pop(0)
        if path in visited:
            continue
        visited.add(path)
        try:
            html = get(path)
        except Exception as e:
            log(f"[크롤] {path} 실패: {e}")
            continue
        kids = children(path, html)
        for ch in kids:
            if "contents.do" in ch:
                if ch not in leaves:
                    leaves.append(ch)
            elif ch not in visited and ch not in queue:
                queue.append(ch)
        log(f"[크롤] {path} → 자식 {len(kids)} (수집 contents {len(leaves)})")
        time.sleep(0.2)
    return origin, leaves


EGEN_MENU_RE = re.compile(r'href="(/egen/[a-z_]+\.do\?contentsno=\d+)"[^>]*>(.*?)</a>', re.S)
EGEN_UI_IMG_RE = re.compile(r"banner|logo|icon|btn|aside|sns|family|footer|header|top|menu|bg_|btm|tab_")


def run_egen(args, log):
    """E-GEN(중앙응급의료센터) 응급처치 모드: 메뉴의 응급처치 페이지들을 돌며
    본문 텍스트 + 내용 인포그래픽 이미지(/images/egen/)를 다운로드."""
    url = args.egen
    p = urllib.parse.urlsplit(url)
    origin = f"{p.scheme}://{p.netloc}"
    log("=== 건강정보 다운로더 · E-GEN 응급처치 모드 ===")
    log(f"출력 폴더: {os.path.abspath(args.out)} · 지연 {args.delay}s")

    h = _request(url)
    seen, items = set(), []
    for href, txt in EGEN_MENU_RE.findall(h):
        if href in seen:
            continue
        t = re.sub(r"\s+", " ", _unescape(re.sub(r"<[^>]+>", " ", txt))).strip()
        if not t:
            continue
        seen.add(href)
        items.append((href, t))
    if args.max:
        items = items[:args.max]
    log(f"응급처치 페이지 {len(items)}건")

    txt_dir = os.path.join(args.out, "txt")
    img_dir = os.path.join(args.out, "images")
    os.makedirs(txt_dir, exist_ok=True)
    os.makedirs(img_dir, exist_ok=True)
    with open(os.path.join(args.out, "index.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["contentsno", "title", "url"])
        for href, t in items:
            w.writerow([re.search(r"contentsno=(\d+)", href).group(1), t, origin + href])

    manifest, ok, fail, nimg = [], 0, 0, 0
    for i, (href, title) in enumerate(items, 1):
        u = origin + href
        cno = re.search(r"contentsno=(\d+)", href).group(1)
        try:
            d = fetch_detail(u)
            _, text, _ = parse_detail(d, ("id:layoutContainer",))
            base = f"{cno}_{safe_filename(title)}"
            with open(os.path.join(txt_dir, base + ".txt"), "w", encoding="utf-8") as f:
                f.write(f"{title}\n출처: {u}\n{'='*50}\n\n{text}\n")
            bi = d.find('id="layoutContainer"')
            body = d[bi:] if bi >= 0 else d
            imgs = [s for s in dict.fromkeys(re.findall(r'<img[^>]*src="(/images/egen/[^"]+)"', body))
                    if not EGEN_UI_IMG_RE.search(s.lower())]
            files = []
            for s in imgs:
                fn = f"{cno}_{safe_filename(os.path.basename(s), 80)}"
                fp = os.path.join(img_dir, fn)
                if not (args.resume and os.path.exists(fp)):
                    download_binary(origin + s, fp)
                    nimg += 1
                    time.sleep(args.delay)
                files.append(fn)
            manifest.append({"contentsno": cno, "title": title, "url": u, "images": files})
            ok += 1
            log(f"  [{i}/{len(items)}] {cno} {title} (이미지 {len(files)}개) OK")
        except Exception as e:
            fail += 1
            log(f"  [{i}/{len(items)}] {cno} 실패: {e}")
        time.sleep(args.delay)

    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "egen", "count": len(manifest), "items": manifest},
                  f, ensure_ascii=False, indent=2)
    log(f"\n완료: 페이지 {ok} · 실패 {fail} · 이미지 {nimg}개 → {os.path.abspath(args.out)}")


def run_board(args, log):
    """cancer.go.kr 게시판(bbs) 모드: 글 목록을 돌며 본문 텍스트 + 첨부파일 다운로드."""
    list_url = args.board
    parts = urllib.parse.urlsplit(list_url)
    origin = f"{parts.scheme}://{parts.netloc}"
    board_dir = list_url.split("?")[0].rsplit("/", 1)[0] + "/"   # .../B/77/
    list_base, view_base = board_dir + "list.do", board_dir + "view.do"
    log(f"=== 건강정보 다운로더 · 게시판 모드 ===")
    log(f"게시판: {board_dir}")
    log(f"출력 폴더: {os.path.abspath(args.out)} · 지연 {args.delay}s")

    # 1) 글 목록 수집(cpage 순회, 새 글 없으면 종료)
    seen, items, cpage = set(), [], 1
    while cpage <= 500:
        h = _request(f"{list_base}?cpage={cpage}")
        rows = []
        for s, inner in BOARD_ITEM_RE.findall(h):
            if s in seen:
                continue
            # 태그를 줄바꿈으로 바꾸고 첫 비어있지 않은 줄을 제목으로(작성자/날짜 제외)
            lines = [x.strip() for x in _unescape(re.sub(r"<[^>]+>", "\n", inner)).splitlines()
                     if x.strip()]
            seen.add(s)
            rows.append((s, lines[0] if lines else s))
        if not rows:
            break
        items.extend(rows)
        log(f"[목록] cpage {cpage}: {len(rows)}건 (누적 {len(items)})")
        cpage += 1
        time.sleep(args.delay)
    if args.max:
        items = items[:args.max]
    log(f"총 글: {len(items)}건")

    txt_dir = os.path.join(args.out, "txt")
    file_dir = os.path.join(args.out, "files")
    os.makedirs(txt_dir, exist_ok=True)
    os.makedirs(file_dir, exist_ok=True)
    with open(os.path.join(args.out, "index.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["article_seq", "title", "url"])
        for s, t in items:
            w.writerow([s, t, f"{view_base}?article_seq={s}"])

    manifest, ok, fail, nfiles = [], 0, 0, 0
    for i, (seq, title) in enumerate(items, 1):
        url = f"{view_base}?article_seq={seq}"
        try:
            d = fetch_detail(url)
            _, text, _ = parse_detail(d, ("id:div_page", "id:contents"))
            base = f"{seq}_{safe_filename(title)}"
            with open(os.path.join(txt_dir, base + ".txt"), "w", encoding="utf-8") as f:
                f.write(f"{title}\n출처: {url}\n{'='*50}\n\n{text}\n")
            files = []
            for href, fn in BOARD_ATT_RE.findall(d):
                furl = origin + _unescape(href)
                fname = f"{seq}_{safe_filename(fn, 80)}"
                fpath = os.path.join(file_dir, fname)
                if args.resume and os.path.exists(fpath):
                    files.append(fname)
                    continue
                size = download_binary(furl, fpath)
                files.append(fname)
                nfiles += 1
                log(f"      첨부 저장: {fname} ({size//1024:,}KB)")
                time.sleep(args.delay)
            manifest.append({"article_seq": seq, "title": title, "url": url, "files": files})
            ok += 1
            log(f"  [{i}/{len(items)}] {seq} {title} (첨부 {len(files)}개) OK")
        except Exception as e:
            fail += 1
            log(f"  [{i}/{len(items)}] {seq} 실패: {e}")
        time.sleep(args.delay)

    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "board", "board": board_dir, "count": len(manifest),
                   "items": manifest}, f, ensure_ascii=False, indent=2)
    log(f"\n완료: 글 {ok} · 실패 {fail} · 첨부파일 {nfiles}개 → {os.path.abspath(args.out)}")


def run(args):
    os.makedirs(args.out, exist_ok=True)
    log = (lambda m: print(m, flush=True)) if not args.quiet else (lambda m: None)

    if args.egen:  # E-GEN 응급처치(본문+이미지) 모드
        return run_egen(args, log)

    if args.board:  # 게시판(첨부파일) 모드
        return run_board(args, log)

    if args.crawl:  # 섹션 자동수집: 계층(노드 S1TaCb의 자식 = S1TbC*)을 재귀 수집
        origin, paths = collect_crawl(args.crawl, log, args.max or 1000)
        if not paths:
            log("크롤: 하위 contents.do를 찾지 못했습니다(더 상위 메뉴 URL로 시도해 보세요).")
            return
        args.url = ",".join(origin + pp for pp in paths)
        args.max = 0  # 크롤이 이미 대상 수를 확정함
        log(f"[크롤] contents.do {len(paths)}건 → 다운로드")

    if args.url:  # 범용 단일/다중 URL 모드(자료원 무시)
        urls = [u.strip() for u in args.url.split(",") if u.strip()]
        src = {"name": "단일 URL", "containers": AUTO_CONTAINERS, "title_h1": True}
        items = [(url_slug(u), "", u) for u in urls]
        log(f"=== 건강정보 다운로더 · 단일 URL {len(items)}건 ===")
        log(f"출력 폴더: {os.path.abspath(args.out)} · 지연 {args.delay}s · 형식 {','.join(args.formats)}")
    else:
        src = SOURCES[args.source]
        cat = CATEGORY_HINT.get(str(args.lclas), f"lclasSn={args.lclas}")
        log(f"=== 국가건강정보포털 다운로더 · {src['name']}({cat}) ===")
        log(f"출력 폴더: {os.path.abspath(args.out)} · 지연 {args.delay}s · 형식 {','.join(args.formats)}")
        items = collect_index(src, args.lclas, args.delay, args.start_page, args.end_page, log)
    if args.max:
        items = items[:args.max]
    log(f"총 대상: {len(items)}건")

    # index.csv 저장
    index_path = os.path.join(args.out, "index.csv")
    with open(index_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "title", "url"])
        for sid, title, url in items:
            w.writerow([sid, title, url])
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
    for i, (sid, list_title, url) in enumerate(items, 1):
        # 제목을 미리 아는 목록형은 받기 전에 이어받기 판단(불필요한 요청 생략).
        # 제목을 모르는 개별페이지형(list_title="")은 받은 뒤 제목으로 파일명 결정.
        if list_title and args.resume:
            base = f"{sid}_{safe_filename(list_title)}"
            if _already_saved(args, txt_dir, html_dir, base):
                skip += 1
                log(f"  [{i}/{len(items)}] {sid} 이미 존재 → 건너뜀")
                continue
        try:
            html = fetch_detail(url)
            title, text, fragment = parse_detail(
                html, src.get("containers", DEFAULT_CONTAINERS), src.get("title_re"))
            if src.get("title_h1"):  # 범용 모드: 본문 첫 <h1> 우선, 없으면 breadcrumb 마지막 항목
                m = re.search(r"<h1[^>]*>(.*?)</h1>", fragment, re.S)
                h1 = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""
                if h1:
                    title = h1
                elif ">" in title:  # 예: "홈 >암예방과 검진>검진>국가암검진 사업"
                    title = title.split(">")[-1].strip()
            # 목록에서 얻은 제목(있으면)을 상세<title>보다 우선(예: 암센터 breadcrumb 회피)
            title = list_title or title or sid
            base = f"{sid}_{safe_filename(title)}"
            if args.resume and _already_saved(args, txt_dir, html_dir, base):
                skip += 1
                log(f"  [{i}/{len(items)}] {sid} {title} 이미 존재 → 건너뜀")
                continue
            txt_file = os.path.join(txt_dir, base + ".txt")
            html_file = os.path.join(html_dir, base + ".html")
            need_txt = "txt" in args.formats
            need_html = "html" in args.formats
            if need_txt:
                with open(txt_file, "w", encoding="utf-8") as f:
                    f.write(f"{title}\n출처: {url}\n{'='*50}\n\n{text}\n")
            if need_html:
                with open(html_file, "w", encoding="utf-8") as f:
                    f.write(build_html_doc(title, url, fragment))
            manifest.append({"id": sid, "title": title, "url": url,
                             "chars": len(text)})
            ok += 1
            log(f"  [{i}/{len(items)}] {sid} {title} ({len(text)}자) OK")
        except Exception as e:
            fail += 1
            log(f"  [{i}/{len(items)}] {sid} 실패: {e}")
        time.sleep(args.delay)

    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "url" if args.url else args.source,
                   "source_name": src["name"], "count": len(manifest),
                   "items": manifest}, f, ensure_ascii=False, indent=2)
    log(f"\n완료: 성공 {ok} · 건너뜀 {skip} · 실패 {fail} → {os.path.abspath(args.out)}")


def main():
    p = argparse.ArgumentParser(
        description="국가건강정보포털(질병관리청) 일반건강정보 일괄 다운로더 (교육 목적)",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--source", default="general", choices=sorted(SOURCES.keys()),
                   help="자료원: general(일반 약660)|elderly(노인 64)|youth(청소년 33)|"
                        "ccvd(심뇌혈관 4)|rdiz(희귀질환 약1,314)|ptl(헬프라인 안내 13)|"
                        "cancer(국가암정보센터 100)|mhealth(정신건강 질환 50). 기본 general")
    p.add_argument("--url", default=None,
                   help="단일 페이지 URL 직접 다운로드(자료원 무시, 본문 컨테이너 자동탐지). "
                        "콤마로 여러 개 지정 가능")
    p.add_argument("--board", default=None,
                   help="cancer.go.kr 게시판(bbs) list.do URL. 글 본문 + 첨부파일(PDF 등) 일괄 다운로드")
    p.add_argument("--crawl", default=None,
                   help="cancer.go.kr 페이지 URL. 좌측 메뉴에 걸린 같은 섹션 contents.do를 모두 자동 수집")
    p.add_argument("--egen", default=None,
                   help="e-gen.or.kr 응급처치 페이지 URL. 메뉴의 응급처치 페이지 본문 + 인포그래픽 이미지 일괄")
    p.add_argument("--lclas", default="0", help="카테고리 lclasSn (기본 0 = 전체)")
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
