"""Builds one self-contained HTML file with the first concept, Thread: the seven screens taken
straight from the canvas boards. The stylesheet and the Figtree font (SIL Open Font License)
are embedded, so the file opens offline in any browser.

  python3 tools/thread_file.py thread/Intent-Thread.html
"""
import os
import sys

from daylight_file import board, embedded_font, read

FONT_CSS = 'https://fonts.googleapis.com/css2?family=Figtree:wght@300..800&display=swap'
SCREENS = [
    ('Main', '1 · Today'),
    ('Thread-2-Setup', '2 · Set up a task'),
    ('Thread-3-Plans', '3 · Plans'),
    ('Thread-4-Session', '4 · Active session'),
    ('Thread-5-End', '5 · Session end'),
    ('Thread-6-Progress', '6 · Progress'),
    ('Thread-6b-Progress-All', '6 · Progress, scrolled · All time'),
]


def build():
    phones = '\n'.join(f'<figure><figcaption>{label}</figcaption><div class="phone">{board(name, {})}</div></figure>'
                       for name, label in SCREENS)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intent · Thread</title>
{embedded_font(FONT_CSS)}
<style>
{read('thread.css')}
</style>
<style>
:root {{ --page: #E8E5DE; --text: #1F1F1D; --soft: #5C5A55; }}
html, body {{ margin: 0; background: var(--page); color: var(--text); }}
body {{ font-family: 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }}
.intro {{ padding: 40px 48px 8px; max-width: 820px; }}
.intro h1 {{ margin: 0; font-size: 30px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; }}
.intro p {{ margin: 8px 0 0; font-size: 15px; line-height: 22px; color: var(--soft); }}
.scroller {{ overflow-x: auto; padding: 24px 0 24px; }}
.row {{ display: grid; grid-template-columns: repeat(7, 390px); gap: 40px; padding: 0 48px; width: max-content; }}
figure {{ margin: 0; display: flex; flex-direction: column; gap: 10px; }}
figcaption {{ font-size: 13px; font-weight: 600; color: var(--soft); }}
.phone {{ width: 390px; height: 844px; border-radius: 44px; overflow: hidden; position: relative; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 30px 60px -30px rgba(0, 0, 0, 0.45); }}
.notes {{ padding: 0 48px 48px; max-width: 820px; font-size: 13px; line-height: 19px; color: var(--soft); }}
.notes p {{ margin: 0 0 8px; }}
@media (max-width: 600px) {{
  .intro {{ padding: 28px 16px 4px; }}
  .row {{ padding: 0 16px; gap: 24px; }}
  .notes {{ padding: 0 16px 32px; }}
}}
</style>
</head>
<body>
<header class="intro">
  <h1>Intent — Thread</h1>
  <p>Pick up the thread. Work is one continuous thread: a single soft line links today’s next actions, becomes the hanging thread of the session timer, and records progress as a line that rests level in gaps instead of breaking. A yellow bead marks the next thing; tasks are beads, routines are loops. Cream, indigo and a restrained yellow, set in Figtree. Static mockups at iPhone size, 390 × 844; all numbers are sample data.</p>
</header>
<main class="scroller">
<div class="row">
{phones}
</div>
</main>
<footer class="notes">
  <p>Tradeoff: the line needs a left gutter, so text columns on Today and Set up are narrower, and the bead and loop meanings have to be learned. A long task list would need a rule for collapsing it so the thread stays readable.</p>
  <p>Status bar and home indicator are left to iOS: every screen keeps the top 54 px and the bottom 34 px clear. The session shows 18:42 of 25:00 left, so 25.2 % has elapsed and 74.8 % remains.</p>
</footer>
</body>
</html>
'''


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'Intent-Thread.html'
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    html = build()
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(out, f'{len(html) / 1e6:.1f} MB')
