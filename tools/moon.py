"""Renders the Daylight (dark) moon as a transparent PNG, in the same spirit as sun.py.

Photographic cues, softened: the maria in roughly their real places on the near side,
a few bright young craters, regolith grain, Lommel–Seeliger shading (the moon looks
flat-lit, not like a matte ball), a soft terminator, faint earthshine on the dark side
and a cool halo centred on the lit part.

The phase is the real one for the date on the screens, Sunday 4 October 2026: last
quarter, about 43 % lit, waning, so the left half is lit as seen from Europe.

  python3 tools/moon.py canvas/project
writes moon.png (high in the sky) and moon-low.png (rising: warmer, a touch flattened).
"""
import sys
import numpy as np
from PIL import Image

S = 1024
R = 128

# (u, v, rx, ry, depth) in disc units, north up, as seen from the northern hemisphere
MARIA = [
    (-0.50, 0.02, 0.30, 0.52, 0.30),   # Oceanus Procellarum
    (-0.28, -0.38, 0.26, 0.24, 0.36),  # Mare Imbrium
    (0.00, -0.66, 0.42, 0.07, 0.24),   # Mare Frigoris
    (0.15, -0.36, 0.15, 0.15, 0.34),   # Mare Serenitatis
    (0.30, -0.08, 0.21, 0.16, 0.34),   # Mare Tranquillitatis
    (0.66, -0.30, 0.11, 0.09, 0.36),   # Mare Crisium
    (0.56, 0.12, 0.12, 0.16, 0.28),    # Mare Fecunditatis
    (0.36, 0.27, 0.09, 0.09, 0.26),    # Mare Nectaris
    (-0.18, 0.36, 0.18, 0.13, 0.26),   # Mare Nubium
    (-0.50, 0.36, 0.09, 0.09, 0.30),   # Mare Humorum
    (0.00, -0.12, 0.08, 0.06, 0.20),   # Sinus Medii / Mare Vaporum
]
BRIGHT = [(-0.12, 0.72, 0.035, 0.30), (-0.30, -0.10, 0.028, 0.22), (-0.68, -0.27, 0.02, 0.32), (-0.55, -0.05, 0.018, 0.16)]


def blur(a, sigma):
    radius = int(3 * sigma) + 1
    x = np.arange(-radius, radius + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2)); k /= k.sum()
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 0, a)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 1, a)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def render(lit_tint, mare_tint, shine_tint, halo, flatten=1.0, seed=3, shade=0.24, veil=1.0):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:S, 0:S].astype(np.float64)
    u = (x - S / 2 + 0.5) / R
    v = (y - S / 2 + 0.5) / (R * flatten)
    rr = np.sqrt(u ** 2 + v ** 2)
    inside = rr <= 1
    nz = np.sqrt(np.clip(1 - rr ** 2, 0, 1))

    # albedo: highlands, maria with ragged edges, bright craters, grain
    wobble = blur(rng.standard_normal((S, S)), 14) ; wobble /= wobble.std()
    albedo = np.full((S, S), 0.86)
    for (cu, cv, rx, ry, depth) in MARIA:
        d = np.sqrt(((u - cu) / rx) ** 2 + ((v - cv) / ry) ** 2) + 0.18 * wobble
        albedo -= depth * (1 - smoothstep(0.75, 1.15, d))
    for (cu, cv, r0, gain) in BRIGHT:
        d = np.sqrt((u - cu) ** 2 + (v - cv) ** 2)
        albedo += gain * np.exp(-(d / r0) ** 2) + 0.35 * gain * np.exp(-(d / (r0 * 4)) ** 2)
    grain = blur(rng.standard_normal((S, S)), 1.2); grain /= grain.std()
    pits = blur(rng.standard_normal((S, S)), 3.5); pits /= pits.std()
    albedo += 0.025 * grain + 0.03 * np.clip(pits, -3, 0) * 0.5
    albedo = np.clip(albedo, 0.3, 1.1)

    # light: last quarter, slightly past (43 % lit), sun to the left and a little behind
    alpha = np.radians(98)
    L = np.array([-np.sin(alpha), 0.0, np.cos(alpha)])
    mu0 = u * L[0] + v * L[1] + nz * L[2]
    mu = nz
    ls = np.where(mu0 > 0, 2 * mu0 / (mu0 + mu + 1e-6), 0)          # Lommel–Seeliger, ~1 across the lit disc
    term = smoothstep(-0.03, 0.10, mu0)                               # soft terminator
    lit = np.clip(ls, 0, 1.15) * term

    lit_tint, mare_tint, shine_tint = (np.array(c, float) for c in (lit_tint, mare_tint, shine_tint))
    t = np.clip((albedo - 0.45) / 0.55, 0, 1)[..., None]
    surface = mare_tint * (1 - t) + lit_tint * t
    rgb = surface * (np.clip(1.12 * lit * albedo / 0.86, 0, 1.18))[..., None]
    rgb += shine_tint[None, None, :] * (0.032 * albedo * (1 - term))[..., None]       # earthshine, faint
    disc_a = np.clip((1 + 0.9 / R - rr) * R / 1.8, 0, 1)
    disc_a = np.where(inside | (disc_a > 0), disc_a, 0)
    edge = disc_a.copy()
    disc_a = disc_a * (shade + (1 - shade) * term)      # the unlit side lets the night sky through, like a faint silhouette

    # halo centred on the lit part
    hu, hv = u + 0.35, v
    hd = np.clip(np.sqrt(hu ** 2 + hv ** 2) - 0.85, 0, None) * R
    h1 = halo[0] * np.exp(-hd / (0.16 * R))
    h2 = halo[1] * np.exp(-hd / (0.70 * R))
    h3 = halo[2] * np.exp(-hd / (2.0 * R))
    window = np.clip(1 - ((np.sqrt((x - S / 2) ** 2 + (y - S / 2) ** 2)) / (S / 2)) ** 2, 0, 1) ** 2
    h1, h2, h3 = h1 * window, h2 * window, h3 * window
    ga = 1 - (1 - h1) * (1 - h2) * (1 - h3)
    ga = ga * (1 - edge * (1 - veil) * (1 - term))      # veil < 1 keeps the glow off the dark side
    gcol = np.array(halo[3], float)

    a = disc_a + (1 - disc_a) * ga
    out_rgb = (np.clip(rgb, 0, 255) * disc_a[..., None] + gcol * (ga * (1 - disc_a))[..., None]) / np.maximum(a, 1e-6)[..., None]
    out = np.dstack([np.clip(out_rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    render(lit_tint=(244, 246, 252), mare_tint=(166, 172, 186), shine_tint=(120, 136, 176),
           halo=(0.30, 0.16, 0.08, (206, 216, 255))).save(f'{out}/moon.png', optimize=True)
    render(lit_tint=(255, 236, 206), mare_tint=(190, 168, 150), shine_tint=(130, 120, 150),
           halo=(0.34, 0.20, 0.11, (255, 218, 182)), flatten=0.95, seed=5,
           shade=0.16, veil=0.45).save(f'{out}/moon-low.png', optimize=True)   # seen large: a quieter dark side
    print('ok')
