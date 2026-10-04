// Renders the Intent app icon from Daylight's day circle: the sun's path cut by the horizon,
// the rest of today as a bright arc with one dot for the next step, and the sun on the path
// (light appearance) or the white full moon (dark appearance). Also a tinted (grayscale)
// variant for the tinted Home Screen, separate layers for Icon Composer, and a preview sheet.
//   node tools/icon.mjs        → icon/Intent-icon-{light,dark,tinted}.png, icon/layers/*, icon/Intent-icon-preview.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'icon');
const layersDir = path.join(out, 'layers');
const project = path.join(root, 'canvas', 'project');
fs.mkdirSync(layersDir, { recursive: true });

// geometry (1024 grid)
const S = 1024, cx = 512, cy = 536, R = 318;
const hy = cy + 20;                                    // horizon a little below the centre: a bit more day than night
const deg = Math.PI / 180;
const at = (a) => [cx + R * Math.cos(a * deg), cy + R * Math.sin(a * deg)];   // 0° = right, -90° = top
const f = (n) => n.toFixed(1);
const P = (a) => at(a).map(f).join(' ');
const aSet = Math.asin((hy - cy) / R) / deg, aRise = 180 - aSet;
const aBody = -45, aNext = -14;
const arc = (a0, a1) => `M ${P(a0)} A ${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${P(a1)}`;
const [bx, by] = at(aBody), [nx, ny] = at(aNext), [sx, sy] = at(aSet);
const BODY_R = 72, BODY_IMG = BODY_R * 1024 / 128;      // sun.png / moon.png: disc radius is 1/8 of the image

const rgba = (c, a = c[3]) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const PALETTES = {
  light: {   // the light theme's sky, deeper: icons sit among saturated neighbours
    bg: [[0, '#8FB0DE'], [0.52, '#BDB7E2'], [1, '#F3C6AA']],
    glow: [255, 214, 160, 0.8], glow2: [250, 216, 196, 0.5],
    below: ['#3E3A8C', 0.2], horizon: [255, 255, 255, 0.55], past: 'rgba(255, 255, 255, 0.72)',
    rest: ['#FFB25E', '#F07E6E'], night: ['#4B4A9E', 0.75, 0.2], dot: ['#1D2433', '#FFFFFF'],
    body: 'sun.png', bodyFilter: 'saturate(1.3)',
  },
  dark: {
    bg: [[0, '#0E111C'], [0.5, '#161A2D'], [1, '#241F3A']],
    glow: [196, 206, 245, 0.3], glow2: [120, 104, 170, 0.3],
    below: ['#8C8CE0', 0.16], horizon: [255, 255, 255, 0.3], past: 'rgba(255, 255, 255, 0.42)',
    rest: ['#F3F5FD', '#B4B4EE'], night: ['#A4A4E8', 0.85, 0.15], dot: ['#F3F4F9', '#161A2D'],
    body: 'moon.png', bodyFilter: 'contrast(0.8) brightness(1.08)',   // softer maria at icon size
  },
  tinted: {
    bg: [[0, '#000000'], [1, '#000000']],
    glow: [255, 255, 255, 0.12], glow2: [255, 255, 255, 0],
    below: ['#FFFFFF', 0.1], horizon: [255, 255, 255, 0.3], past: 'rgba(255, 255, 255, 0.45)',
    rest: ['#FFFFFF', '#FFFFFF'], night: ['#FFFFFF', 0.6, 0.1], dot: ['#FFFFFF', '#000000'],
    body: 'moon.png', bodyFilter: 'grayscale(1) contrast(0.8) brightness(1.1)',
  },
};

function backgroundSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="${S}" gradientUnits="userSpaceOnUse">${p.bg.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
    <radialGradient id="glow" cx="${f(bx)}" cy="${f(by)}" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${rgba(p.glow)}"/><stop offset="1" stop-color="${rgba(p.glow, 0)}"/></radialGradient>
    <radialGradient id="glow2" cx="0" cy="${S}" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${rgba(p.glow2)}"/><stop offset="1" stop-color="${rgba(p.glow2, 0)}"/></radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#glow2)"/>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
</svg>`;
}

function pathSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" fill="none">
  <defs>
    <linearGradient id="below" x1="0" y1="${hy}" x2="0" y2="${cy + R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.below[0]}" stop-opacity="${p.below[1]}"/><stop offset="1" stop-color="${p.below[0]}" stop-opacity="0"/></linearGradient>
    <linearGradient id="horizon" x1="0" y1="0" x2="${S}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${rgba(p.horizon, 0)}"/><stop offset="0.16" stop-color="${rgba(p.horizon)}"/><stop offset="0.84" stop-color="${rgba(p.horizon)}"/><stop offset="1" stop-color="${rgba(p.horizon, 0)}"/></linearGradient>
    <linearGradient id="rest" x1="${f(bx)}" y1="${f(by)}" x2="${f(sx)}" y2="${f(sy)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.rest[0]}"/><stop offset="1" stop-color="${p.rest[1]}"/></linearGradient>
    <linearGradient id="night" x1="0" y1="${hy}" x2="0" y2="${cy + R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.night[0]}" stop-opacity="${p.night[1]}"/><stop offset="1" stop-color="${p.night[0]}" stop-opacity="${p.night[2]}"/></linearGradient>
  </defs>
  <path d="${arc(aSet, aRise)} Z" fill="url(#below)"/>
  <path d="M 0 ${hy} H ${S}" stroke="url(#horizon)" stroke-width="7"/>
  <path d="${arc(aRise, aBody + 360)}" stroke="${p.past}" stroke-width="22" stroke-linecap="round"/>
  <path d="${arc(aSet, aRise)}" stroke="url(#night)" stroke-width="24" stroke-linecap="round"/>
  <path d="${arc(aBody, aSet)}" stroke="url(#rest)" stroke-width="36" stroke-linecap="round"/>
  <circle cx="${f(nx)}" cy="${f(ny)}" r="25" fill="${p.dot[0]}" stroke="${p.dot[1]}" stroke-width="9"/>
</svg>`;
}

const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
const bodyImg = (p) => `<img src="${dataUri(path.join(project, p.body))}" style="position:absolute;left:${f(bx - BODY_IMG / 2)}px;top:${f(by - BODY_IMG / 2)}px;width:${BODY_IMG}px;height:${BODY_IMG}px;filter:${p.bodyFilter}">`;
const page = (inner) => `<!doctype html><html><body style="margin:0;background:transparent"><div id="icon" style="position:relative;width:${S}px;height:${S}px;overflow:hidden">${inner}</div></body></html>`;
const layer = (svg) => `<div style="position:absolute;inset:0">${svg}</div>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: S, height: S } });
async function shoot(html, file, transparent = false) {
  await tab.setContent(html, { waitUntil: 'load' });
  await (await tab.$('#icon')).screenshot({ path: file, omitBackground: transparent });
}

const icons = {};
for (const [name, p] of Object.entries(PALETTES)) {
  const file = path.join(out, `Intent-icon-${name}.png`);
  await shoot(page(layer(backgroundSvg(p)) + layer(pathSvg(p)) + bodyImg(p)), file);
  icons[name] = file;
  if (name === 'tinted') continue;
  fs.writeFileSync(path.join(layersDir, `1-background-${name}.svg`), backgroundSvg(p) + '\n');
  fs.writeFileSync(path.join(layersDir, `2-path-${name}.svg`), pathSvg(p) + '\n');
  await shoot(page(layer(backgroundSvg(p))), path.join(layersDir, `1-background-${name}.png`));
  await shoot(page(layer(pathSvg(p))), path.join(layersDir, `2-path-${name}.png`), true);
  await shoot(page(bodyImg(p)), path.join(layersDir, `3-${name === 'light' ? 'sun' : 'moon'}.png`), true);
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
<p class="intro">Daylight’s day circle: the horizon, the rest of today as a bright arc with one dot for the next step, and the sun marking now. By night the white full moon takes its place. iOS switches between the two with the Home Screen’s light and dark appearance; the tinted version is used on a tinted Home Screen.</p>
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
