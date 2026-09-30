"""Static artifact checks. Run from any directory with Python 3; no dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, json

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]; self.slides=[]; self.refs=[]; self.links=[]
    def handle_starttag(self, tag, items):
        a=dict(items)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='section' and 'slide' in a.get('class','').split():self.slides.append(a.get('id'))
        for key in ['src','data-src','href','data-background-image','poster']:
            if a.get(key):self.refs.append(a[key])
        if a.get('href','').startswith('#/'):self.links.append(unquote(a['href'][2:]))

def check(file, expected):
    source=file.read_text('utf-8'); p=Page(); p.feed(source)
    missing=[]
    for url in p.refs:
        parsed=urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:continue
        if not (file.parent/unquote(parsed.path)).exists():missing.append(url)
    for css in (ROOT/(file.stem+'_files')).rglob('*.css'):
        for url in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)',css.read_text('utf-8')):
            parsed=urlsplit(url)
            if not parsed.scheme and not parsed.netloc and parsed.path and not (css.parent/unquote(parsed.path)).exists():missing.append(str(css.relative_to(ROOT))+':'+url)
    duplicates=sorted({x for x in p.ids if p.ids.count(x)>1})
    badlinks=[x for x in p.links if x not in p.ids]
    result={'file':file.name,'slides':len(p.slides),'expected':expected,'missing_resources':sorted(set(missing)),'duplicate_ids':duplicates,'broken_slide_links':badlinks,'unresolved_shortcodes':'{{<' in source,'bytes':file.stat().st_size}
    result['pass']=len(p.slides)==expected and not(missing or duplicates or badlinks or result['unresolved_shortcodes'])
    return result

results=[check(ROOT/name,n) for name,n in [('course.html',6),('layouts.html',15),('course-single.html',6)]]
report={'checks':results,'pass':all(x['pass'] for x in results)}
(ROOT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(0 if report['pass'] else 1)
