"""Builds Intent-Daylight-v2.html: the focused refinement of the Daylight prototype, with live
phones for both appearances. Stylesheets, script, images and the Geist font are embedded,
so the file opens offline in any browser. The v1 file is not touched.

  python3 tools/daylight_v2_file.py daylight/Intent-Daylight-v2.html
"""
import base64
import io
import json
import os
import sys

from PIL import Image

from daylight_file import PROJECT, embedded_font, icon_uri, read

SRC = os.path.join(os.path.dirname(__file__), '..', 'daylight', 'src')
COLUMNS = [
    ('today', '1 · Today', {}),
    ('today', '1 · Today, day view open', {'open': '1'}),
    ('setup', '2 · Set up a task', {}),
    ('plans', '3 · Plans', {}),
    ('session', '4 · Active session', {}),
    ('end', '5 · Session end', {}),
    ('progress', '6 · Progress', {}),
    ('progress', '6 · Progress, scrolled · All time', {'range': 'all', 'scroll': '190'}),
]


def src(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def png_uri(name, px):
    """A project image resized to what the prototype displays (at 2x)."""
    im = Image.open(os.path.join(PROJECT, name)).convert('RGBA').resize((px, px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def phones(theme):
    out = []
    for screen, label, attrs in COLUMNS:
        extra = ''.join(f' data-{k}="{v}"' for k, v in attrs.items())
        out.append(f'<figure><figcaption>{label}</figcaption><div class="phone" data-screen="{screen}" data-theme="{theme}"{extra}></div></figure>')
    return '\n'.join(out)


def build():
    assets = {'sun': png_uri('sun.png', 256), 'sunLow': png_uri('sun-low.png', 800)}
    icons = ''.join(f'<figure><img src="{icon_uri(k)}" alt="App icon, {k}" width="72" height="72"><figcaption>{k.title()}</figcaption></figure>' for k in ('light', 'dark'))
    css = read('daylight.css') + '\n' + read('daylight-dark.css') + '\n' + src('v2.css')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intent · Daylight v2</title>
{embedded_font()}
<style>
{css}
</style>
<style>
:root {{ --page: #E4E3DF; --text: #1F1F1D; --soft: #5C5B57; }}
html, body {{ margin: 0; background: var(--page); color: var(--text); }}
body {{ font-family: 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }}
.intro {{ padding: 40px 48px 8px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 24px 48px; max-width: 3400px; }}
.intro-text {{ max-width: 780px; }}
.intro h1 {{ margin: 0; font-size: 30px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; }}
.intro p {{ margin: 8px 0 0; font-size: 15px; line-height: 22px; color: var(--soft); }}
.icons {{ display: flex; gap: 16px; }}
.icons figure {{ margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }}
.icons img {{ width: 72px; height: 72px; border-radius: 16px; display: block; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 12px 24px -16px rgba(0, 0, 0, 0.5); }}
.icons figcaption {{ font-size: 12px; font-weight: 600; color: var(--soft); }}
.toolbar {{ margin: 20px 48px 0; display: flex; flex-wrap: wrap; gap: 12px 28px; align-items: center; }}
.tb {{ display: flex; align-items: center; gap: 10px; }}
.tb-l {{ font-size: 13px; font-weight: 600; color: var(--soft); }}
.tb-seg {{ display: flex; gap: 4px; padding: 3px; border-radius: 14px; background: rgba(0, 0, 0, 0.06); }}
.tb-seg button {{ height: 34px; padding: 0 14px; border: 0; border-radius: 11px; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: #3A3935; cursor: pointer; }}
.tb-seg button[aria-pressed='true'] {{ background: #FFFFFF; color: #1F1F1D; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); }}
.tb-hint {{ font-size: 13px; color: var(--soft); }}
.scroller {{ overflow-x: auto; padding: 8px 0 24px; }}
.grid {{ display: grid; grid-template-columns: repeat({len(COLUMNS)}, 390px); gap: 18px 40px; padding: 0 48px; width: max-content; }}
.rowhead {{ grid-column: 1 / -1; padding-top: 22px; }}
.rowhead span {{ position: sticky; left: 48px; display: inline-flex; align-items: baseline; gap: 10px; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }}
.rowhead small {{ font-size: 15px; font-weight: 500; color: var(--soft); }}
figure {{ margin: 0; display: flex; flex-direction: column; gap: 10px; }}
figcaption {{ font-size: 13px; font-weight: 600; color: var(--soft); }}
.phone {{ width: 390px; height: 844px; border-radius: 44px; overflow: hidden; position: relative; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 30px 60px -30px rgba(0, 0, 0, 0.45); }}
.notes {{ padding: 0 48px 48px; max-width: 820px; font-size: 13px; line-height: 19px; color: var(--soft); }}
.notes p {{ margin: 0 0 8px; }}
@media (max-width: 600px) {{
  .intro {{ padding: 28px 16px 4px; }}
  .toolbar {{ margin: 16px 16px 0; }}
  .grid {{ padding: 0 16px; gap: 16px 24px; }}
  .rowhead span {{ left: 16px; }}
  .notes {{ padding: 0 16px 32px; }}
}}
</style>
</head>
<body>
<header class="intro">
  <div class="intro-text">
    <h1>Intent — Daylight v2</h1>
    <p>A focused refinement of Daylight: a compact day circle that opens into a full day view, clearer task creation, a conversational session end and a lighter Progress screen. Every phone is live: tap the day circle, its markers, the start options, the session-end choices and the chart controls. All numbers are sample data.</p>
  </div>
  <div class="icons">{icons}</div>
</header>
<div class="toolbar" role="group" aria-label="Review options">
  <div class="tb"><span class="tb-l">Sample data</span><div class="tb-seg"><button type="button" data-set="data" data-value="default">Default</button><button type="button" data-set="data" data-value="long">Long names</button><button type="button" data-set="data" data-value="crowded">Crowded day</button></div></div>
  <div class="tb"><span class="tb-l">Clock</span><div class="tb-seg"><button type="button" data-set="clock" data-value="live">Live · <span class="live-time">--:--</span></button><button type="button" data-set="clock" data-value="500">08:20</button><button type="button" data-set="clock" data-value="1300">21:40</button></div></div>
  <span class="tb-hint">The sun shows from 06:00 to 18:00 and the moon otherwise, in either appearance.</span>
</div>
<main class="scroller">
<div class="grid">
<div class="rowhead"><span>Light appearance</span></div>
{phones('light')}
<div class="rowhead"><span>Dark appearance</span></div>
{phones('dark')}
</div>
</main>
<footer class="notes">
  <p>The day circle uses one 24-hour mapping: noon at the top, midnight at the bottom, clockwise. Tasks with a clock time sit at their time; tasks with a cue such as “after dinner”, or with no time, sit in their own group instead of an invented position. Sun and moon are symbols for the time of day, not astronomical positions. The current time follows this device and updates once a minute.</p>
  <p>With reduced motion turned on, the day view opens and closes with a short fade instead of the zoom. Status bar and home indicator are left to iOS: every screen keeps the top 54 px and the bottom 34 px clear.</p>
</footer>
<script>window.DAYLIGHT_ASSETS = {json.dumps(assets)};</script>
<script>
{src('v2.js')}
</script>
</body>
</html>
'''


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'Intent-Daylight-v2.html'
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    html = build()
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(out, f'{len(html) / 1e6:.1f} MB')
