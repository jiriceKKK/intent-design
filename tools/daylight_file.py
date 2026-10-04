"""Builds one self-contained HTML file with Daylight in both appearances: the sun (light) and
the moon (dark), the same seven screens each, taken straight from the canvas boards.
Stylesheets, images and the Geist font (SIL Open Font License) are embedded, so the file
opens offline in any browser. If the font cannot be fetched, the page links Google Fonts.

  python3 tools/daylight_file.py daylight/Intent-Daylight.html
"""
import base64
import os
import re
import ssl
import sys
import urllib.request

PROJECT = os.path.join(os.path.dirname(__file__), '..', 'canvas', 'project')
SCREENS = [
    ('1-Today', '1 · Today'),
    ('2-Setup', '2 · Set up a task'),
    ('3-Plans', '3 · Plans'),
    ('4-Session', '4 · Active session'),
    ('5-End', '5 · Session end'),
    ('6-Progress', '6 · Progress'),
    ('6b-Progress-All', '6 · Progress, scrolled · All time'),
]
IMAGES = ['sun.png', 'sun-low.png', 'moon.png', 'moon-low.png']
FONT_CSS = 'https://fonts.googleapis.com/css2?family=Geist:wght@200..800&display=swap'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'


def read(name):
    with open(os.path.join(PROJECT, name), encoding='utf-8') as f:
        return f.read()


def data_uri(name, mime):
    with open(os.path.join(PROJECT, name), 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()


def fetch(url):
    cafile = os.environ.get('SSL_CERT_FILE') or ('/root/.ccr/ca-bundle.crt' if os.path.exists('/root/.ccr/ca-bundle.crt') else None)
    ctx = ssl.create_default_context(cafile=cafile)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return r.read()


def embedded_font():
    """@font-face rules for the latin and latin-ext subsets, with the woff2 files inlined."""
    try:
        css = fetch(FONT_CSS).decode()
        rules = []
        for block in re.findall(r'/\* (latin(?:-ext)?) \*/\s*(@font-face \{.*?\})', css, re.S):
            rule = block[1]
            url = re.search(r'url\((https://[^)]+\.woff2)\)', rule).group(1)
            woff2 = base64.b64encode(fetch(url)).decode()
            rules.append(rule.replace(url, 'data:font/woff2;base64,' + woff2))
        if rules:
            return '<style>\n' + '\n'.join(rules) + '\n</style>'
    except Exception as e:  # offline: fall back to the hosted font
        print('font not embedded:', e, file=sys.stderr)
    return f'<link rel="stylesheet" href="{FONT_CSS.replace("&", "&amp;")}">'


def board(name, images):
    s = read(f'{name}.dc.html')
    body = s[s.index('</helmet>') + len('</helmet>'):s.index('</x-dc>')].strip()
    for img, uri in images.items():
        body = body.replace(f'src="{img}"', f'src="{uri}"')
    return body


def build():
    images = {img: data_uri(img, 'image/png') for img in IMAGES}
    rows = [
        ('sun', 'Sun', 'light appearance', 'Daylight-'),
        ('moon', 'Moon', 'dark appearance', 'Daylight-Dark-'),
    ]
    grid = []
    for key, title, sub, prefix in rows:
        grid.append(f'<div class="rowhead"><span><i class="dot dot-{key}" aria-hidden="true"></i>{title} <small>· {sub}</small></span></div>')
        for screen, label in SCREENS:
            grid.append(f'<figure><figcaption>{label}</figcaption><div class="phone">{board(prefix + screen, images)}</div></figure>')
    css = read('daylight.css') + '\n' + read('daylight-dark.css')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intent · Daylight</title>
{embedded_font()}
<style>
{css}
</style>
<style>
:root {{ --page: #E4E3DF; --text: #1F1F1D; --soft: #5C5B57; }}
html, body {{ margin: 0; background: var(--page); color: var(--text); }}
body {{ font-family: 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }}
.intro {{ padding: 40px 48px 8px; max-width: 760px; }}
.intro h1 {{ margin: 0; font-size: 30px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; }}
.intro p {{ margin: 8px 0 0; font-size: 15px; line-height: 22px; color: var(--soft); }}
.scroller {{ overflow-x: auto; padding: 16px 0 24px; }}
.grid {{ display: grid; grid-template-columns: repeat(7, 390px); gap: 18px 40px; padding: 0 48px; width: max-content; }}
.rowhead {{ grid-column: 1 / -1; padding-top: 18px; }}
.rowhead span {{ position: sticky; left: 48px; display: inline-flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }}
.rowhead small {{ font-size: 15px; font-weight: 500; color: var(--soft); }}
.dot {{ width: 14px; height: 14px; border-radius: 7px; display: inline-block; }}
.dot-sun {{ background: #F29A4A; box-shadow: 0 0 0 4px rgba(242, 154, 74, 0.22); }}
.dot-moon {{ background: #F1F2F6; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18), 0 0 0 4px rgba(20, 24, 42, 0.12); }}
figure {{ margin: 0; display: flex; flex-direction: column; gap: 10px; }}
figcaption {{ font-size: 13px; font-weight: 600; color: var(--soft); }}
.phone {{ width: 390px; height: 844px; border-radius: 44px; overflow: hidden; position: relative; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 30px 60px -30px rgba(0, 0, 0, 0.45); }}
.notes {{ padding: 0 48px 48px; max-width: 760px; font-size: 13px; line-height: 19px; color: var(--soft); }}
@media (max-width: 600px) {{
  .intro {{ padding: 28px 16px 4px; }}
  .grid {{ padding: 0 16px; gap: 16px 24px; }}
  .rowhead span {{ left: 16px; }}
  .notes {{ padding: 0 16px 32px; }}
}}
</style>
</head>
<body>
<header class="intro">
  <h1>Intent — Daylight</h1>
  <p>The same seven screens in both appearances: the sun by day (light) and the moon by night (dark). Static mockups at iPhone size, 390 × 844. All numbers are sample data.</p>
</header>
<main class="scroller">
<div class="grid">
{chr(10).join(grid)}
</div>
</main>
<footer class="notes">
  <p>Status bar and home indicator are left to iOS: every screen keeps the top 54 px and the bottom 34 px clear. The session shows 18:42 of 25:00 left, so the ring is 25.2 % elapsed and 74.8 % remaining. The moon is always full; on Today it marks “now” on the sun’s path, not its real position in the sky.</p>
</footer>
</body>
</html>
'''


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'Intent-Daylight.html'
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    html = build()
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(out, f'{len(html) / 1e6:.1f} MB')
