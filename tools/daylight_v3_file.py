"""Builds Intent-Daylight-v3.html: the restored central day circle, curved session arcs and the
staged expansion, as live phones in both appearances. Stylesheets, script, the original sun and
moon renders and the Geist font are embedded, so the file opens offline in any browser.
The v1 and v2 files are not touched.

  python3 tools/daylight_v3_file.py daylight/Intent-Daylight-v3.html [--artifact out/page.html]

--artifact also writes the same page without the <html>/<head> wrapper, for hosts that add
their own document skeleton.
"""
import base64
import io
import json
import os
import re
import sys

from PIL import Image

from daylight_file import PROJECT, icon_uri, read

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'daylight', 'src')
COLUMNS = [
    ('today', '1 · Today', {}),
    ('today', '1 · Today · day view open', {'open': '1'}),
    ('setup', '2 · Create a task', {}),
    ('plans', '3 · Plans', {}),
    ('session', '4 · Active session', {}),
    ('end', '5 · Session complete', {}),
    ('end', '5 · Done for today', {'step': 'done'}),
    ('progress', '6 · Progress', {}),
]


def src(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def png_uri(name, px):
    """A project image resized to what the prototype displays (at 2x or more)."""
    im = Image.open(os.path.join(PROJECT, name)).convert('RGBA').resize((px, px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def geist():
    """The Geist @font-face rules already embedded in the v1 file (SIL Open Font License)."""
    with open(os.path.join(ROOT, 'daylight', 'Intent-Daylight.html'), encoding='utf-8') as f:
        rules = re.findall(r'@font-face \{.*?\}', f.read(), re.S)
    return '<style>\n' + '\n'.join(rules) + '\n</style>'


def phones(theme):
    out = []
    for screen, label, attrs in COLUMNS:
        extra = ''.join(f' data-{k}="{v}"' for k, v in attrs.items())
        out.append(f'<figure><figcaption>{label}</figcaption><div class="pw"><div class="phone" data-screen="{screen}" data-theme="{theme}"{extra}></div></div></figure>')
    return '\n'.join(out)


def seg(key, label, options):
    buttons = ''.join(f'<button type="button" data-set="{key}" data-value="{v}">{t}</button>' for v, t in options)
    return f'<div class="tb"><span class="tb-l" id="tb-{key}">{label}</span><div class="tb-seg" role="group" aria-labelledby="tb-{key}">{buttons}</div></div>'


PAGE_CSS = '''
/* Review page: a quiet stone ground so the phones carry all the colour; phones keep their own appearance. */
:root {
  --page: #E5E4E0; --text: #1F1F1D; --soft: #5A5954; --seg: rgba(31, 31, 29, 0.07); --seg-on: #FFFFFF; --seg-text: #3A3935;
  --seg-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); --edge: rgba(0, 0, 0, 0.07); --drop: rgba(0, 0, 0, 0.45);
  --pw: 390px; --ph: 844px; --k: 1;
  --ui: 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page: #151618; --text: #ECEBE7; --soft: #A5A49E; --seg: rgba(255, 255, 255, 0.08); --seg-on: rgba(255, 255, 255, 0.2); --seg-text: #D9D8D3;
    --seg-shadow: 0 2px 6px rgba(0, 0, 0, 0.4); --edge: rgba(255, 255, 255, 0.08); --drop: rgba(0, 0, 0, 0.8); color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --page: #151618; --text: #ECEBE7; --soft: #A5A49E; --seg: rgba(255, 255, 255, 0.08); --seg-on: rgba(255, 255, 255, 0.2); --seg-text: #D9D8D3;
  --seg-shadow: 0 2px 6px rgba(0, 0, 0, 0.4); --edge: rgba(255, 255, 255, 0.08); --drop: rgba(0, 0, 0, 0.8); color-scheme: dark;
}
html, body { margin: 0; background: var(--page); color: var(--text); }
body { font-family: var(--ui); -webkit-font-smoothing: antialiased; padding-inline: 0; }
.intro { padding: 36px 48px 4px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px 48px; max-width: 1400px; }
.intro-text { max-width: 760px; min-width: 0; }
.intro h1 { margin: 0; font-size: 30px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; text-wrap: balance; }
.intro p { margin: 8px 0 0; font-size: 15px; line-height: 22px; color: var(--soft); max-width: 68ch; }
.icons { display: flex; gap: 16px; }
.icons figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.icons img { width: 64px; height: 64px; border-radius: 14px; display: block; box-shadow: 0 0 0 1px var(--edge), 0 12px 24px -16px var(--drop); }
.icons figcaption { font-size: 12px; font-weight: 600; color: var(--soft); }
.toolbar { margin: 18px 48px 0; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; max-width: 1400px; }
.tb { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tb-l { font-size: 13px; font-weight: 600; color: var(--soft); }
.tb-seg { display: flex; flex-wrap: wrap; gap: 3px; padding: 3px; border-radius: 14px; background: var(--seg); }
.tb-seg button { min-height: 34px; padding: 0 12px; border: 0; border-radius: 11px; background: transparent; font: inherit; font-size: 13.5px; font-weight: 600; color: var(--seg-text); cursor: pointer; font-variant-numeric: tabular-nums; }
.tb-seg button[aria-pressed='true'] { background: var(--seg-on); color: var(--text); box-shadow: var(--seg-shadow); }
.tb-seg button:focus-visible { outline: 2px solid var(--text); outline-offset: 1px; }
.scroller { overflow-x: auto; padding: 6px 0 24px; }
.grid { display: grid; grid-template-columns: repeat(8, max-content); gap: 16px 36px; padding: 0 48px; width: max-content; }
.rowhead { grid-column: 1 / -1; padding-top: 22px; }
.rowhead span { position: sticky; left: 48px; display: inline-flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.rowhead small { font-size: 15px; font-weight: 500; color: var(--soft); }
.dot { width: 14px; height: 14px; border-radius: 7px; display: inline-block; flex: none; }
.dot-sun { background: #F29A4A; box-shadow: 0 0 0 4px rgba(242, 154, 74, 0.22); }
.dot-moon { background: #F1F2F6; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(120, 128, 170, 0.18); }
figure { margin: 0; display: flex; flex-direction: column; gap: 10px; }
figcaption { font-size: 13px; font-weight: 600; color: var(--soft); }
.pw { width: calc(var(--pw) * var(--k)); height: calc(var(--ph) * var(--k)); }
.phone {
  --st: 54px; --sb: 34px; --tabb: 26px;
  width: var(--pw); height: var(--ph); border-radius: 44px; overflow: hidden; position: relative; isolation: isolate;
  transform: scale(var(--k)); transform-origin: 0 0; box-shadow: 0 0 0 1px var(--edge), 0 30px 60px -30px var(--drop);
}
.size-se { --pw: 375px; --ph: 667px; }
.size-se .phone { --st: 20px; --sb: 0px; --tabb: 12px; border-radius: 30px; }
.notes { padding: 4px 48px 48px; max-width: 760px; font-size: 13.5px; line-height: 20px; color: var(--soft); display: flex; flex-direction: column; gap: 8px; }
.notes p { margin: 0; }
.notes b { color: var(--text); font-weight: 650; }
@media (max-width: 600px) {
  :root { --k: 0.84; }
  .intro { padding: 24px 16px 4px; }
  .toolbar { margin: 14px 16px 0; gap: 10px 16px; }
  .grid { padding: 0 16px; gap: 14px 20px; }
  .rowhead span { left: 16px; }
  .notes { padding: 4px 16px 32px; }
}
'''


def build(artifact=False):
    assets = {
        'sun': png_uri('sun.png', 320), 'moon': png_uri('moon.png', 320),
        'sunLow': png_uri('sun-low.png', 800), 'moonLow': png_uri('moon-low.png', 800),
    }
    icons = ''.join(f'<figure><img src="{icon_uri(k)}" alt="App icon, {k} appearance" width="64" height="64"><figcaption>{k.title()}</figcaption></figure>' for k in ('light', 'dark'))
    css = read('daylight.css') + '\n' + read('daylight-dark.css') + '\n' + src('v3.css')
    toolbar = ''.join([
        seg('data', 'Sample data', [('default', 'Default'), ('long', 'Long names'), ('dense', 'Dense day')]),
        seg('clock', 'Clock', [('live', 'Live · <span class="live-time">--:--</span>'), ('500', '08:20'), ('948', '15:48'), ('1300', '21:40')]),
        seg('text', 'Text', [('standard', 'Standard'), ('large', 'Larger')]),
        seg('size', 'Phone', [('standard', '390 × 844'), ('se', 'SE · 375 × 667')]),
        seg('motion', 'Motion', [('full', 'Full'), ('reduced', 'Reduced')]),
    ])
    head = f'''<title>Intent Daylight v3</title>
{geist()}
<style>
{PAGE_CSS}
</style>
<style>
{css}
</style>'''
    body = f'''<header class="intro">
  <div class="intro-text">
    <h1>Intent — Daylight v3</h1>
    <p>The day circle is back in the middle of Today, drawn as planned session arcs. Tap it: the circle grows into the day view, the arcs sweep clockwise into place and overlapping sessions step outward onto their own lanes. Every phone is live: tap arcs, the “No set time” tasks, the start options, the session-end choices and the chart range. All numbers are sample data.</p>
  </div>
  <div class="icons">{icons}</div>
</header>
<div class="toolbar" role="group" aria-label="Review options">{toolbar}</div>
<main class="scroller">
<div class="grid">
<div class="rowhead"><span><i class="dot dot-sun" aria-hidden="true"></i>Light appearance <small>· always the sun</small></span></div>
{phones('light')}
<div class="rowhead"><span><i class="dot dot-moon" aria-hidden="true"></i>Dark appearance <small>· always the moon</small></span></div>
{phones('dark')}
</div>
</main>
<footer class="notes">
  <p><b>One 24-hour mapping.</b> Noon at the top, midnight at the bottom, clockwise. The horizontal line is a day/night motif, not a sunrise or sunset calculation. An arc starts at the session’s start time and spans its planned length (16:30 for 25 min fills 16:30–16:55). A filled arc is a task, an outlined arc a routine, a ▸ a start without a set length. Tasks with a cue such as “After dinner”, or with no time, stay in the “No set time” group and never get a clock position.</p>
  <p><b>Theme picks the symbol, the clock picks its place.</b> Light always shows the sun and dark always the realistic moon, on Today, in the day view and at session end. Its position follows this device’s time (or the clock option above) and updates once a minute; switching appearance never changes the time shown.</p>
  <p><b>Motion.</b> Opening takes about 0.9 s: grow and centre, a short clockwise sweep, settle, then only the overlapping arcs step outward. Close reverses the grow and returns to Today at the same scroll position. With reduced motion (system setting or the option above) the day view appears directly in its final layout. Status bar and home indicator are left to iOS.</p>
</footer>
<script>window.DAYLIGHT_ASSETS = {json.dumps(assets)};</script>
<script>
{src('v3.js')}
</script>'''
    if artifact:
        return head + '\n' + body + '\n'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}
</head>
<body>
{body}
</body>
</html>
'''


if __name__ == '__main__':
    args = sys.argv[1:]
    art = None
    if '--artifact' in args:
        i = args.index('--artifact')
        art = args[i + 1]
        del args[i:i + 2]
    out = args[0] if args else 'Intent-Daylight-v3.html'
    for path, flag in ((out, False), (art, True)):
        if not path:
            continue
        os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
        html = build(artifact=flag)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(path, f'{len(html) / 1e6:.2f} MB')
