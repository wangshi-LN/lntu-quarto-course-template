"""Loopback-only preview with single byte-range support for the video fixture."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.remaining=None
        file=Path(self.translate_path(self.path))
        value=self.headers.get('Range','')
        match=re.fullmatch(r'bytes=(\d*)-(\d*)',value)
        if not (match and file.is_file()):
            return super().send_head()
        size=file.stat().st_size
        left,right=match.groups()
        if not left and not right:
            self.send_error(416);return None
        start=int(left) if left else max(0,size-int(right))
        end=min(size-1,int(right)) if left and right else size-1
        if start<0 or start>=size or end<start:
            self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
        stream=file.open('rb');stream.seek(start)
        self.remaining=end-start+1
        self.send_response(206)
        self.send_header('Content-Type',self.guess_type(str(file)))
        self.send_header('Accept-Ranges','bytes')
        self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length',str(self.remaining))
        self.end_headers();return stream
    def copyfile(self,source,outputfile):
        try:
            if self.remaining is None:
                return super().copyfile(source,outputfile)
            while self.remaining:
                chunk=source.read(min(65536,self.remaining))
                if not chunk:break
                outputfile.write(chunk);self.remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):
            pass

if __name__=='__main__':
    print('Open http://127.0.0.1:18768/layouts.html',flush=True)
    ThreadingHTTPServer(('127.0.0.1',18768),partial(Handler,directory=str(ROOT))).serve_forever()
