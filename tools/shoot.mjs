// Renders .dc.html artboards to PNG with the canvas runtime, for visual review.
// Usage: node tools/shoot.mjs [--scale 2] [--out renders] File-1.dc.html File-2.dc.html ...
//        node tools/shoot.mjs --all            (every artboard listed in canvas.json)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const projectDir = path.join(root, 'canvas', 'project');
const runtime = process.env.DC_RUNTIME;

const args = process.argv.slice(2);
let scale = 2;
let outDir = path.join(root, 'renders');
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scale') scale = Number(args[++i]);
  else if (args[i] === '--out') outDir = path.resolve(args[++i]);
  else if (args[i] === '--all') {
    const index = JSON.parse(fs.readFileSync(path.join(projectDir, 'canvas.json'), 'utf8'));
    files.push(...index.order);
  } else files.push(args[i]);
}
if (!runtime || !fs.existsSync(runtime)) {
  console.error('Set DC_RUNTIME to the path of the canvas runtime (support.js).');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = url.endsWith('/support.js') ? runtime : path.join(projectDir, url.replace(/^\/project\//, ''));
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const index = fs.existsSync(path.join(projectDir, 'canvas.json'))
  ? JSON.parse(fs.readFileSync(path.join(projectDir, 'canvas.json'), 'utf8'))
  : { boards: {} };

// Google Fonts are fetched from Node (which trusts the proxy CA via NODE_EXTRA_CA_CERTS)
// and handed to the page, so Chromium never needs to accept the proxy certificate.
const fontCache = new Map();
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
async function fetchFont(url) {
  if (!fontCache.has(url)) {
    fontCache.set(url, (async () => {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      return { status: r.status, type: r.headers.get('content-type') || '', body: Buffer.from(await r.arrayBuffer()) };
    })());
  }
  return fontCache.get(url);
}

const browser = await chromium.launch();
for (const f of files) {
  const frame = index.boards[f] || { w: 390, h: 844 };
  const page = await browser.newPage({ viewport: { width: frame.w, height: frame.h }, deviceScaleFactor: scale });
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    try {
      const r = await fetchFont(route.request().url());
      await route.fulfill({ status: r.status, headers: { 'content-type': r.type, 'access-control-allow-origin': '*' }, body: r.body });
    } catch (e) { await route.abort(); }
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/project/${f}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const name = f.replace(/\.dc\.html$/, '');
  await page.screenshot({ path: path.join(outDir, `${name}.png`), clip: { x: 0, y: 0, width: frame.w, height: frame.h } });
  // Report anything that spills past the frame: a cheap overflow check.
  const spill = await page.evaluate(({ w, h }) => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > w + 0.5 || r.bottom > h + 0.5) out.push(`${el.tagName.toLowerCase()}.${el.className && el.className.baseVal === undefined ? el.className : ''} → ${Math.round(r.right)}×${Math.round(r.bottom)}`);
    }
    return out.slice(0, 8);
  }, { w: frame.w, h: frame.h });
  console.log(`${name}: ok${errors.length ? ' | errors: ' + errors.join(' ; ') : ''}${spill.length ? ' | spill: ' + spill.join(', ') : ''}`);
  await page.close();
}
await browser.close();
server.close();
