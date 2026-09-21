# -*- coding: utf-8 -*-
"""로컬 미리보기 서버 — 파이썬 기본 http.server에 Range(부분 요청) 지원을 더한 것.
   기본 서버는 Range를 무시해서 브라우저가 mp4를 건너뛰며 재생(탐색)하지 못한다 — 홍보영상의 막 이동 버튼이 로컬에서만 안 먹던 원인.
   사용: python scripts/serve_range.py [port] [bind]"""
import http.server, os, re, sys

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        if not m:
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.group(1), m.group(2)
        if a == '' and b == '':
            return super().send_head()
        start = int(a) if a else max(0, size - int(b))
        end = min(int(b), size - 1) if (a and b) else size - 1
        if start >= size or start > end:
            self.send_error(416, 'Requested Range Not Satisfiable'); return None
        f = open(path, 'rb'); f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        self._remain = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        remain = getattr(self, '_remain', None)
        if remain is None:
            return super().copyfile(source, outputfile)
        self._remain = None
        while remain > 0:
            buf = source.read(min(65536, remain))
            if not buf: break
            try: outputfile.write(buf)
            except (ConnectionError, BrokenPipeError): break
            remain -= len(buf)

    def end_headers(self):
        if not any(h.lower().startswith(b'accept-ranges') for h in getattr(self, '_headers_buffer', [])):
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

if __name__ == '__main__':
    port = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 5601))
    bind = sys.argv[2] if len(sys.argv) > 2 else ''
    http.server.ThreadingHTTPServer((bind, port), RangeHandler).serve_forever()
