"""Renders the Daylight (dark) moon as a transparent PNG, in the same spirit as sun.py.

The moon is always full, whatever the date: a steady symbol, not an almanac.
Photographic cues, softened: the maria in roughly their real places on the near side,
bright young craters (Tycho with faint rays), regolith grain, the flat look of a full
moon lit straight on (Lommel–Seeliger at zero phase gives no limb darkening), only a
hint of rim shading to keep it round, and a cool halo.

  python3 tools/moon.py canvas/project
writes moon.png (high in the sky) and moon-low.png (rising: a touch flattened). Both are white.
"""
import sys
import numpy as np
from PIL import Image

S = 1024
R = 128

# (u, v, rx, ry, depth) in disc units, north up, as seen from the northern hemisphere.
# Centres follow the real selenographic positions projected onto the disc.
MARIA = [
    (-0.70, -0.08, 0.26, 0.50, 0.20),  # Oceanus Procellarum
    (-0.23, -0.52, 0.29, 0.24, 0.27),  # Mare Imbrium
    (0.02, -0.80, 0.40, 0.06, 0.13),   # Mare Frigoris
    (0.27, -0.46, 0.18, 0.16, 0.28),   # Mare Serenitatis
    (0.49, -0.13, 0.22, 0.19, 0.27),   # Mare Tranquillitatis
    (0.80, -0.29, 0.09, 0.13, 0.30),   # Mare Crisium
    (0.73, 0.14, 0.13, 0.21, 0.22),    # Mare Fecunditatis
    (0.55, 0.27, 0.09, 0.09, 0.21),    # Mare Nectaris
    (-0.25, 0.36, 0.20, 0.14, 0.20),   # Mare Nubium
    (-0.56, 0.41, 0.09, 0.10, 0.24),   # Mare Humorum
    (-0.47, -0.10, 0.13, 0.10, 0.18),  # Mare Insularum
    (-0.38, 0.17, 0.08, 0.07, 0.16),   # Mare Cognitum
    (0.06, -0.23, 0.08, 0.06, 0.18),   # Mare Vaporum
    (0.03, -0.04, 0.06, 0.04, 0.12),   # Sinus Medii
    (0.10, -0.33, 0.12, 0.06, 0.13),   # (between Imbrium and Serenitatis)
    (0.62, 0.04, 0.10, 0.12, 0.15),    # (Tranquillitatis to Fecunditatis)
    (0.53, 0.13, 0.07, 0.10, 0.14),    # (Tranquillitatis to Nectaris)
    (-0.45, 0.26, 0.12, 0.10, 0.14),   # (Nubium, Cognitum, Humorum, Procellarum)
]
# (u, v, radius, gain): Tycho, Copernicus, Kepler, Aristarchus, Proclus
BRIGHT = [(-0.14, 0.69, 0.030, 0.20), (-0.34, -0.17, 0.026, 0.16), (-0.61, -0.14, 0.018, 0.12),
          (-0.67, -0.40, 0.016, 0.14), (0.70, -0.28, 0.014, 0.12)]
TYCHO = BRIGHT[0]


def blur(a, sigma):
    radius = int(3 * sigma) + 1
    x = np.arange(-radius, radius + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2)); k /= k.sum()
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 0, a)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 1, a)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def render(lit_tint, mare_tint, halo, flatten=1.0, gain=1.0, seed=3):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:S, 0:S].astype(np.float64)
    u = (x - S / 2 + 0.5) / R
    v = (y - S / 2 + 0.5) / (R * flatten)
    rr = np.sqrt(u ** 2 + v ** 2)
    nz = np.sqrt(np.clip(1 - rr ** 2, 0, 1))

    def noise(sigma):
        n = blur(rng.standard_normal((S, S)), sigma)
        return n / n.std()

    # albedo: highlands with soft mottling, merging maria with ragged edges, bright craters,
    # Tycho's rays, small fresh craters, fine grain
    wu, wv = 0.07 * noise(28), 0.07 * noise(28)                   # domain warp: organic outlines
    edge = 0.12 * noise(10) + 0.06 * noise(4)
    uw, vw = u + wu, v + wv
    mask = np.zeros((S, S))
    for (cu, cv, rx, ry, depth) in MARIA:
        parts = [(cu, cv, rx, ry)] + [(cu + rng.uniform(-0.3, 0.3) * rx, cv + rng.uniform(-0.3, 0.3) * ry,
                                        rx * rng.uniform(0.55, 0.85), ry * rng.uniform(0.55, 0.85)) for _ in range(3)]
        for (pu, pv, px, py) in parts:
            d = np.sqrt(((uw - pu) / px) ** 2 + ((vw - pv) / py) ** 2) + edge
            mask = np.maximum(mask, depth * (1 - smoothstep(0.5, 1.15, d)))
    mask = blur(mask, 3)
    south = smoothstep(0.1, 0.7, v)                                 # the cratered southern highlands
    albedo = 0.86 + 0.03 * noise(30) - 0.03 * south * np.abs(noise(9)) - mask * (0.9 + 0.2 * noise(8))
    for (cu, cv, r0, g) in BRIGHT:
        d = np.sqrt((u - cu) ** 2 + (v - cv) ** 2)
        albedo += g * np.exp(-(d / r0) ** 2) + 0.35 * g * np.exp(-(d / (r0 * 4)) ** 2)
    tu, tv = TYCHO[0], TYCHO[1]
    td = np.sqrt((u - tu) ** 2 + (v - tv) ** 2)
    ta = np.arctan2(v - tv, u - tu)
    for ang, length, g in zip(rng.uniform(-np.pi, np.pi, 12), rng.uniform(0.4, 1.2, 12), rng.uniform(0.02, 0.045, 12)):
        da = np.angle(np.exp(1j * (ta - ang)))                     # wrapped angle difference
        albedo += g * np.exp(-(da * td / 0.02) ** 2) * np.exp(-td / length) * smoothstep(0.03, 0.08, td)
    for _ in range(90):
        r = np.sqrt(rng.uniform(0, 0.9)); th = rng.uniform(0, 2 * np.pi)
        cu, cv, r0 = r * np.cos(th), r * np.sin(th), rng.uniform(0.006, 0.014)
        albedo += rng.uniform(0.04, 0.10) * np.exp(-(((u - cu) ** 2 + (v - cv) ** 2) / r0 ** 2))
    albedo += 0.008 * noise(1.0)
    albedo = np.clip(albedo, 0.3, 1.1)

    # full moon, lit straight on: flat brightness, a hint of rim shading
    rim = 0.92 + 0.08 * nz ** 0.35
    t = np.clip((albedo - 0.5) / 0.36, 0, 1)[..., None]
    surface = np.array(mare_tint, float) * (1 - t) + np.array(lit_tint, float) * t
    rgb = surface * np.clip(gain * rim * albedo / 0.86, 0, 1.12)[..., None]
    disc_a = np.clip((1 + 0.9 / R - rr) * R / 1.8, 0, 1)

    # halo around the whole disc
    hd = np.clip(rr - 1.0, 0, None) * R
    h1 = halo[0] * np.exp(-hd / (0.16 * R))
    h2 = halo[1] * np.exp(-hd / (0.70 * R))
    h3 = halo[2] * np.exp(-hd / (2.0 * R))
    window = np.clip(1 - ((np.sqrt((x - S / 2) ** 2 + (y - S / 2) ** 2)) / (S / 2)) ** 2, 0, 1) ** 2
    h1, h2, h3 = h1 * window, h2 * window, h3 * window
    ga = 1 - (1 - h1) * (1 - h2) * (1 - h3)
    gcol = np.array(halo[3], float)

    a = disc_a + (1 - disc_a) * ga
    out_rgb = (np.clip(rgb, 0, 255) * disc_a[..., None] + gcol * (ga * (1 - disc_a))[..., None]) / np.maximum(a, 1e-6)[..., None]
    out = np.dstack([np.clip(out_rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    white = dict(lit_tint=(246, 247, 250), mare_tint=(184, 187, 196))      # white moonlight, no warm cast
    render(halo=(0.30, 0.16, 0.08, (224, 228, 238)), **white).save(f'{out}/moon.png', optimize=True)
    render(halo=(0.34, 0.20, 0.11, (224, 228, 238)), flatten=0.95, **white).save(f'{out}/moon-low.png', optimize=True)
    print('ok')
