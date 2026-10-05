// Renders the Intent app icon: Daylight's day circle as a flat, bold symbol. One thick ring is
// the day's path: the part of the day already gone in the neutral colour, the rest of today in
// the accent colour, night in violet; the night half of the circle is filled and two short
// marks carry the horizon out of the ring. The sun (light appearance) or the full moon (dark)
// sits on the ring at "now", cut free by a small gap. No glows; the backgrounds are almost flat.
// Also a tinted (grayscale) variant, SVG masters, separate layers for Icon Composer and a
// preview sheet.
//   node tools/icon.mjs        → icon/Intent-icon-{light,dark,tinted}.{png,svg}, icon/layers/*, icon/Intent-icon-preview.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'icon');
const layersDir = path.join(out, 'layers');
fs.rmSync(layersDir, { recursive: true, force: true });
fs.mkdirSync(layersDir, { recursive: true });

// geometry (1024 grid)
const S = 1024, cx = 512, cy = 530, R = 286, W = 68;      // ring centre line and stroke
const BODY = 96, GAP = 26, aBody = -45;                     // sun / moon disc, the gap around it, its place on the ring
const HZ_IN = R + W / 2 + 20, HZ_OUT = R + W / 2 + 104, HZ_W = 30;   // horizon marks outside the ring
const deg = Math.PI / 180;
const at = (a) => [cx + R * Math.cos(a * deg), cy + R * Math.sin(a * deg)];   // 0° = right, -90° = top
const f = (n) => n.toFixed(1);
const P = (a) => at(a).map(f).join(' ');
const arc = (a0, a1) => `M ${P(a0)} A ${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${P(a1)}`;
const [bx, by] = at(aBody);
const MARIA = [[-0.3, -0.08, 0.3, 0.38], [0.3, -0.3, 0.2, 0.16], [0.42, 0.2, 0.12, 0.13]];   // simplified and asymmetric (never a face), disc units

const PALETTES = {
  light: {
    bg: ['#DCE6F5', '#F6E7DD'], past: '#1D2433', rest: '#F29A4A', night: '#7474C4', fill: 'rgba(116, 116, 196, 0.16)',
    horizon: '#1D2433', body: '#F29A4A', maria: null,
  },
  dark: {
    bg: ['#141827', '#1D1C30'], past: '#8A90A8', rest: '#F3F4F9', night: '#7E7ED0', fill: 'rgba(126, 126, 208, 0.18)',
    horizon: '#8A90A8', body: '#F3F4F9', maria: '#DADDE8',
  },
  tinted: {
    bg: ['#000000', '#000000'], past: '#8C8C8C', rest: '#FFFFFF', night: '#6A6A6A', fill: 'rgba(255, 255, 255, 0.1)',
    horizon: '#8C8C8C', body: '#FFFFFF', maria: '#D0D0D0',
  },
};

// background colour at a height, so the gap around the sun or moon matches what is behind it
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">\n${body}\n</svg>\n`;

function background(p) {
  return `  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="${S}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>`;
}
function symbol(p) {
  return `  <path d="${arc(0, 180)} Z" fill="${p.fill}"/>
  <g fill="none" stroke-width="${W}">
    <path d="${arc(180, aBody + 360)}" stroke="${p.past}"/>
    <path d="${arc(aBody, 0)}" stroke="${p.rest}"/>
    <path d="${arc(0, 180)}" stroke="${p.night}"/>
  </g>
  <path d="M ${cx - HZ_OUT} ${cy} H ${cx - HZ_IN} M ${cx + HZ_IN} ${cy} H ${cx + HZ_OUT}" stroke="${p.horizon}" stroke-width="${HZ_W}" stroke-linecap="round"/>`;
}
function body(p, cut = true) {
  const gap = cut ? `<circle cx="${f(bx)}" cy="${f(by)}" r="${BODY + GAP}" fill="${mix(p.bg[0], p.bg[1], by / S)}"/>\n  ` : '';
  const maria = p.maria ? MARIA.map(([u, v, rx, ry]) => `\n  <ellipse cx="${f(bx + u * BODY)}" cy="${f(by + v * BODY)}" rx="${f(rx * BODY)}" ry="${f(ry * BODY)}" fill="${p.maria}"/>`).join('') : '';
  return `  ${gap}<circle cx="${f(bx)}" cy="${f(by)}" r="${BODY}" fill="${p.body}"/>${maria}`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: S, height: S } });
async function png(svgText, file, transparent = false) {
  await tab.setContent(`<!doctype html><body style="margin:0;background:transparent"><div id="icon" style="width:${S}px;height:${S}px">${svgText}</div></body>`);
  await (await tab.$('#icon')).screenshot({ path: file, omitBackground: transparent });
}
const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');

const icons = {};
for (const [name, p] of Object.entries(PALETTES)) {
  const full = svg([background(p), symbol(p), body(p)].join('\n'));
  fs.writeFileSync(path.join(out, `Intent-icon-${name}.svg`), full);
  icons[name] = path.join(out, `Intent-icon-${name}.png`);
  await png(full, icons[name]);
  if (name === 'tinted') continue;
  const layers = { [`1-background-${name}`]: [background(p), false], [`2-day-circle-${name}`]: [symbol(p), true],
                   [`3-${name === 'light' ? 'sun' : 'moon'}`]: [body(p, false), true] };
  for (const [file, [content, transparent]] of Object.entries(layers)) {
    fs.writeFileSync(path.join(layersDir, `${file}.svg`), svg(content));
    await png(svg(content), path.join(layersDir, `${file}.png`), transparent);
  }
}

// preview sheet: the three appearances, both Home Screens, and real pixel sizes
const img = (name, size, extra = '') => `<img src="${dataUri(icons[name])}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${(size * 0.2237).toFixed(1)}px;display:block;${extra}" alt="">`;
const blank = (size, fill) => `<span style="width:${size}px;height:${size}px;border-radius:${(size * 0.2237).toFixed(1)}px;background:${fill};display:block"></span>`;
function home(name, wallpaper, tiles, labelColor, barColor) {
  const cells = [];
  for (let i = 0; i < 8; i++) {
    const ours = i === 5;
    cells.push(`<div class="cell">${ours ? img(name, 112, 'box-shadow:0 8px 20px -10px rgba(0,0,0,0.35)') : blank(112, tiles[i % tiles.length])}${ours ? `<span class="lbl" style="color:${labelColor}">Intent</span>` : `<span class="bar" style="background:${barColor}"></span>`}</div>`);
  }
  return `<div class="home" style="background:${wallpaper}">${cells.join('')}</div>`;
}
const ladder = (name, bg, color) => `<div class="ladder" style="background:${bg};color:${color}">${[[180, '60 pt @3x'], [120, '60 pt @2x'], [87, '29 pt @3x'], [58, '29 pt @2x'], [40, '20 pt @2x']].map(([s, t]) => `<figure>${img(name, s)}<figcaption>${t}</figcaption></figure>`).join('')}</div>`;
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#ECEBE7;color:#1F1F1D;font-family:-apple-system,'Segoe UI',system-ui,sans-serif}
#icon{width:1560px;padding:48px 56px 56px;box-sizing:border-box}
h1{margin:0;font-size:30px;letter-spacing:-0.02em}
.intro{margin:8px 0 0;font-size:15px;line-height:22px;color:#5C5B57;max-width:900px}
.big{display:flex;gap:56px;margin-top:36px}
.big figure{margin:0;display:flex;flex-direction:column;gap:14px}
.big figcaption{font-size:15px;font-weight:600}.big figcaption small{display:block;font-weight:400;color:#5C5B57;margin-top:2px}
h2{margin:44px 0 16px;font-size:18px}
.homes{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.home{border-radius:36px;padding:40px 44px;display:grid;grid-template-columns:repeat(4,112px);justify-content:space-between;row-gap:30px}
.cell{display:flex;flex-direction:column;align-items:center;gap:9px}
.lbl{font-size:14px;font-weight:500}.bar{width:52px;height:8px;border-radius:4px;margin-top:4px}
.ladders{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.ladder{border-radius:28px;padding:28px 32px;display:flex;align-items:flex-end;gap:30px}
.ladder figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px}.ladder figcaption{font-size:12px;opacity:0.75}
</style></head><body><div id="icon">
<h1>Intent — app icon</h1>
<p class="intro">Daylight’s day circle as a flat, bold symbol: one thick ring for the day (what is gone, the rest of today in the accent colour, night in violet), the night half filled, the horizon carried out of the ring, and the sun at now. By night the full moon takes its place. iOS switches between the two with the Home Screen’s light and dark appearance; the tinted version is used on a tinted Home Screen.</p>
<div class="big">
  <figure>${img('light', 300, 'box-shadow:0 24px 50px -24px rgba(40,46,80,0.45)')}<figcaption>Light<small>default, App Store</small></figcaption></figure>
  <figure>${img('dark', 300, 'box-shadow:0 24px 50px -24px rgba(0,0,0,0.6)')}<figcaption>Dark<small>dark Home Screen</small></figcaption></figure>
  <figure>${img('tinted', 300, 'box-shadow:0 24px 50px -24px rgba(0,0,0,0.6)')}<figcaption>Tinted<small>grayscale, iOS adds the tint</small></figcaption></figure>
</div>
<h2>On the Home Screen</h2>
<div class="homes">
  ${home('light', 'linear-gradient(160deg,#D9E2EE 0%,#EAE4EC 55%,#F1E6DF 100%)', ['#FFFFFF', '#F4F2EF', '#E9EDF3', '#FBF7F2'], '#1D2433', 'rgba(29,36,51,0.16)')}
  ${home('dark', 'linear-gradient(160deg,#0B0D14 0%,#141622 60%,#1B1B27 100%)', ['#2A2C36', '#23252E', '#30323C', '#272932'], '#F3F4F9', 'rgba(255,255,255,0.18)')}
</div>
<h2>Actual pixel sizes</h2>
<div class="ladders">
  ${ladder('light', '#F4F3F0', '#1F1F1D')}
  ${ladder('dark', '#14161E', '#F3F4F9')}
</div>
</div></body></html>`;
await tab.setViewportSize({ width: 1560, height: 1200 });
await tab.setContent(sheet, { waitUntil: 'load' });
await (await tab.$('#icon')).screenshot({ path: path.join(out, 'Intent-icon-preview.png') });
await browser.close();
console.log('icons:', Object.values(icons).map((p) => path.relative(root, p)).join(', '));
