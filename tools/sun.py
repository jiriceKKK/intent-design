"""Renders the Daylight sun as a transparent PNG: photographic cues, softened.

Realism comes from three things a flat orange dot lacks: limb darkening (the disc
is brighter in the middle and warmer at the edge), a faint granulated surface, and
bloom that falls off in stages like light scattering through haze. The 'edit' is
the grade: warm, slightly pastel, no hard lens flare.

  python3 tools/sun.py canvas/project
writes sun.png (afternoon sun) and sun-low.png (sun on the horizon, warmer and a
touch flattened by refraction).
"""
import sys
import numpy as np
from PIL import Image

S = 1024           # image size
R = 128            # disc radius in px (glow reaches the image edge, 4R)


def blur(a, sigma):
    """Separable gaussian blur (numpy only)."""
    radius = int(3 * sigma) + 1
    x = np.arange(-radius, radius + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2)); k /= k.sum()
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 0, a)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 1, a)


def render(core, limb, glow_inner, glow_mid, glow_outer, flatten=1.0, haze=1.0, seed=7):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:S, 0:S].astype(np.float64)
    dx, dy = x - S / 2 + 0.5, (y - S / 2 + 0.5) / flatten
    r = np.sqrt(dx ** 2 + dy ** 2)
    rho = r / R

    # disc: quadratic limb darkening
    mu = np.sqrt(np.clip(1 - rho ** 2, 0, 1))
    inten = 1 - 0.47 * (1 - mu) - 0.23 * (1 - mu) ** 2          # 1 at centre, 0.30 at the limb
    t = (inten - 0.30) / 0.70
    # granulation: fine cells plus a few broad mottles, fading towards the limb
    fine = blur(rng.standard_normal((S, S)), 1.6)
    broad = blur(rng.standard_normal((S, S)), 9.0)
    fine /= fine.std(); broad /= broad.std()
    texture = (0.022 * fine + 0.014 * broad) * mu
    t = np.clip(t + texture, 0, 1)
    core, limb = np.array(core, float), np.array(limb, float)
    disc_rgb = limb[None, None, :] * (1 - t[..., None] ** 0.8) + core[None, None, :] * (t[..., None] ** 0.8)
    disc_a = np.clip((R + 1.6 - r) / 3.2, 0, 1)

    # glow: corona, bloom, haze — combined like light (screen), windowed to the image edge
    d = np.clip(r - R * 0.96, 0, None)
    g1 = 0.88 * np.exp(-d / (0.22 * R))
    g2 = 0.42 * np.exp(-d / (0.80 * R))
    g3 = 0.20 * haze * np.exp(-d / (2.2 * R))
    window = np.clip(1 - (r / (S / 2)) ** 2, 0, 1) ** 2
    g1, g2, g3 = g1 * window, g2 * window, g3 * window
    ga = 1 - (1 - g1) * (1 - g2) * (1 - g3)
    w = np.stack([g1, g2, g3], -1) + 1e-9
    gcol = (w[..., 0:1] * np.array(glow_inner) + w[..., 1:2] * np.array(glow_mid) + w[..., 2:3] * np.array(glow_outer)) / w.sum(-1, keepdims=True)

    a = disc_a + (1 - disc_a) * ga
    rgb = (disc_rgb * disc_a[..., None] + gcol * (ga * (1 - disc_a))[..., None]) / np.maximum(a, 1e-6)[..., None]
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    render(core=(255, 253, 244), limb=(255, 200, 128),
           glow_inner=(255, 240, 206), glow_mid=(255, 218, 168), glow_outer=(255, 204, 156),
           haze=1.3).save(f'{out}/sun.png', optimize=True)
    render(core=(255, 238, 204), limb=(250, 132, 64),
           glow_inner=(255, 196, 132), glow_mid=(255, 160, 108), glow_outer=(246, 138, 118),
           flatten=0.93, haze=1.5, seed=11
           ).save(f'{out}/sun-low.png', optimize=True)
    print('ok')
