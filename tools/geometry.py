"""Exact geometry for the mockups' data-bearing visuals.

Every visual that encodes the sample data is computed here, so bars, the cumulative
line and the session-progress marks match the numbers in the brief:
  7 days  = [2, 0, 1, 2, 1, 0, 2]  (Mon..Sun, 8 sessions)
  all time ends at 56, with level stretches where nothing was recorded
  session: 18:42 of 25:00 remaining  ->  74.8 % remaining, 25.2 % elapsed
"""
import math, json, sys

WEEK = [2, 0, 1, 2, 1, 0, 2]
DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
# Daily sessions from Mon 3 Aug to Sun 4 Oct (9 weeks). Weekly sums 6,8,2,0,8,9,9,6,8 = 56.
DAILY = [1,1,0,2,1,0,1,  2,1,1,0,2,1,1,  1,1,0,0,0,0,0,  0,0,0,0,0,0,0,
         0,2,1,2,1,1,1,  2,1,2,1,2,0,1,  1,2,1,2,1,1,1,  1,1,0,1,2,0,1,  2,0,1,2,1,0,2]
assert len(DAILY) == 63 and sum(DAILY) == 56 and DAILY[-7:] == WEEK and sum(DAILY[-14:-7]) == 6
ELAPSED = (25*60 - (18*60 + 42)) / (25*60)   # 0.252
assert abs(ELAPSED - 0.252) < 1e-9

def cumulative():
    out, t = [], 0
    for d in DAILY:
        t += d; out.append(t)
    return out

def bars(x0, x1, base, top, width=14, maxv=2, radius=None):
    """Column rects (path data, rounded data-end, square at baseline) for the week."""
    n = len(WEEK); slot = (x1 - x0) / n; r = width/2 if radius is None else radius
    res = []
    for i, v in enumerate(WEEK):
        cx = x0 + slot*(i + 0.5)
        h = (base - top) * v / maxv
        if v == 0:
            res.append({'day': DAYS[i], 'v': v, 'cx': round(cx, 2), 'd': None})
            continue
        l, rr, t = cx - width/2, cx + width/2, base - h
        rad = min(r, h)
        d = (f"M{l:.2f} {base:.2f} L{l:.2f} {t+rad:.2f} Q{l:.2f} {t:.2f} {l+rad:.2f} {t:.2f} "
             f"L{rr-rad:.2f} {t:.2f} Q{rr:.2f} {t:.2f} {rr:.2f} {t+rad:.2f} L{rr:.2f} {base:.2f} Z")
        if rad == width/2:  # full arch top
            d = (f"M{l:.2f} {base:.2f} L{l:.2f} {t+rad:.2f} A{rad:.2f} {rad:.2f} 0 0 1 {rr:.2f} {t+rad:.2f} L{rr:.2f} {base:.2f} Z")
        res.append({'day': DAYS[i], 'v': v, 'cx': round(cx, 2), 'top': round(t, 2), 'd': d})
    return res

def cum_line(x0, x1, base, top, maxv=60, step=True):
    """Cumulative line; each day is a point at day end. Level stretches stay level."""
    c = [0] + cumulative()
    n = len(c) - 1
    pts = []
    for i, v in enumerate(c):
        x = x0 + (x1 - x0) * i / n
        y = base - (base - top) * v / maxv
        pts.append((x, y))
    d = 'M' + ' L'.join(f"{x:.2f} {y:.2f}" for x, y in pts)
    area = d + f" L{pts[-1][0]:.2f} {base:.2f} L{pts[0][0]:.2f} {base:.2f} Z"
    # month ticks: day index of 1 Sep is 29 (3 Aug = index 0 start), 1 Oct = 59
    ticks = {'Aug': x0 + (x1-x0)*0/n, 'Sep': x0 + (x1-x0)*29/n, 'Oct': x0 + (x1-x0)*59/n}
    gap = (x0 + (x1-x0)*16/n, x0 + (x1-x0)*29/n)  # 19 Aug .. 31 Aug inclusive: level
    return {'d': d, 'area': area, 'end': pts[-1], 'ticks': ticks, 'gap': gap,
            'y': {v: base - (base-top)*v/maxv for v in (0, 20, 40, 60)}}

def quad_point(p0, p1, p2, t):
    return tuple((1-t)**2*a + 2*(1-t)*t*b + t**2*c for a, b, c in zip(p0, p1, p2))

def quad_at_fraction(p0, p1, p2, frac, n=4000):
    """Point at a fraction of arc length on a quadratic Bezier."""
    pts = [quad_point(p0, p1, p2, i/n) for i in range(n+1)]
    seg = [math.dist(pts[i], pts[i+1]) for i in range(n)]
    total = sum(seg); goal = total*frac; acc = 0
    for i, s in enumerate(seg):
        if acc + s >= goal:
            k = (goal-acc)/s
            return (pts[i][0] + (pts[i+1][0]-pts[i][0])*k, pts[i][1] + (pts[i+1][1]-pts[i][1])*k), total
        acc += s
    return pts[-1], total

if __name__ == '__main__':
    print(json.dumps({'elapsed': ELAPSED, 'cum_end': cumulative()[-1]}))


# ---------- organic shapes (Cairn) ----------

def cubic_point(p0, p1, p2, p3, t):
    u = 1 - t
    return tuple(u**3*a + 3*u*u*t*b + 3*u*t*t*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3))

def path_at_fraction(segments, frac, n=2000):
    """segments: list of cubic (p0,p1,p2,p3). Returns point at a fraction of total length."""
    pts = []
    for (p0, p1, p2, p3) in segments:
        for i in range(n):
            pts.append(cubic_point(p0, p1, p2, p3, i / n))
    pts.append(segments[-1][3])
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    total = sum(seg); goal = total * frac; acc = 0
    for i, s in enumerate(seg):
        if acc + s >= goal:
            k = (goal - acc) / s
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k), total
        acc += s
    return pts[-1], total

def segments_to_d(segments):
    f = lambda p: f"{p[0]:.1f} {p[1]:.1f}"
    d = 'M' + f(segments[0][0])
    for (_, p1, p2, p3) in segments:
        d += f" C{f(p1)} {f(p2)} {f(p3)}"
    return d + ' Z'

def pebble_rect(w, h, r=(46, 58, 50, 40), bulge=(3, 4, 3, 5), x=0, y=0):
    """A soft rectangle whose corners differ slightly and whose edges bow out a little,
    so it reads as a smooth stone rather than a UI card. r = (tl, tr, br, bl)."""
    tl, tr, br, bl = r; bt, brt, bb, bl_ = bulge; k = 0.56
    P = lambda a, b: (x + a, y + b)
    segs = [
        (P(tl, 0), P(w * 0.38, -bt), P(w * 0.62, -bt), P(w - tr, 0)),
        (P(w - tr, 0), P(w - tr * (1 - k), 0), P(w, tr * (1 - k)), P(w, tr)),
        (P(w, tr), P(w + brt, h * 0.4), P(w + brt, h * 0.6), P(w, h - br)),
        (P(w, h - br), P(w, h - br * (1 - k)), P(w - br * (1 - k), h), P(w - br, h)),
        (P(w - br, h), P(w * 0.62, h + bb), P(w * 0.38, h + bb), P(bl, h)),
        (P(bl, h), P(bl * (1 - k), h), P(0, h - bl * (1 - k)), P(0, h - bl)),
        (P(0, h - bl), P(-bl_, h * 0.6), P(-bl_, h * 0.4), P(0, tl)),
        (P(0, tl), P(0, tl * (1 - k)), P(tl * (1 - k), 0), P(tl, 0)),
    ]
    return segments_to_d(segs)


# ---------- Daylight: the day as the sun's circular path ----------
SOLAR_NOON = 12 + 50 / 60     # top of the circle; sunrise 07:00 and sunset 18:40 sit on the horizon

def sun_circle(h, cx, cy, r):
    """Point for clock time h (hours) on a 24 h circle, clockwise, solar noon at the top."""
    t = math.radians((h - SOLAR_NOON) * 15)
    return (cx + r * math.sin(t), cy - r * math.cos(t))
