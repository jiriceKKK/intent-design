/* Intent · Daylight v2 — the lightweight interactions behind the refined prototype.
   Every phone renders from the sample data below; nothing is stored or sent anywhere. */
(() => {
  'use strict';
  const ASSETS = window.DAYLIGHT_ASSETS || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- sample data ----------
  const task = (id, name, action, at, min = 25) => ({ id, name, action, kind: 'task', at, min });
  const routine = (id, name, action, at, cue, min = 5) => ({ id, name, action, kind: 'routine', at, cue, min });
  const DATA = {
    default: {
      today: [
        task('essay', 'Essay outline', 'Open the document and write three bullet points.', 990),
        routine('reading', 'Evening reading', 'Read one page.', null, 'After dinner'),
      ],
      unscheduled: ['Portfolio update'],
      finished: ['Essay outline', 'Source review'],
    },
    long: {
      today: [
        task('report', 'Quarterly research report for the regional planning committee', 'Open the shared draft and write three bullet points for the methodology section.', 990),
        routine('anthology', 'Evening reading from the philosophy anthology', 'Read one page of the current chapter before bed.', null, 'After dinner'),
      ],
      unscheduled: ['Portfolio update with the new case study and refreshed photography'],
      finished: ['Quarterly research report for the regional planning committee', 'Source review for the literature chapter on urban mobility'],
    },
    crowded: {
      today: [
        routine('stretch', 'Morning stretch', 'Stretch for five minutes.', 450, null),
        task('inbox', 'Inbox', 'Reply to the two urgent emails.', 540, 15),
        task('sync', 'Team sync prep', 'Write the agenda for the team sync.', 555, 15),
        task('dentist', 'Admin', 'Call the dentist about the appointment.', 570, 10),
        task('budget', 'Budget', 'Review the shared budget sheet.', 780),
        task('logo', 'Portfolio update', 'Sketch three logo ideas.', 960),
        task('essay', 'Essay outline', 'Open the document and write three bullet points.', 990),
        task('sources', 'Source review', 'Read the methods section.', 1005),
        routine('piano', 'Piano', 'Practise scales for ten minutes.', 1020, null, 10),
        task('weekly', 'Weekly review', 'Note the first step for tomorrow.', 1260, 15),
        routine('reading', 'Evening reading', 'Read one page.', null, 'After dinner'),
        routine('plants', 'Plants', 'Water the plants on the balcony.', null, 'After work'),
        task('stamps', 'Errands', 'Buy stamps at the post office.', null),
      ],
      unscheduled: ['Tax return'],
      finished: ['Essay outline', 'Source review', 'Inbox zero', 'Budget draft', 'Logo brief', 'Team sync notes', 'Dentist form'],
    },
  };
  const state = { data: 'default', clock: 'live' };
  const data = () => DATA[state.data];
  const firstTask = () => data().today.find((i) => i.kind === 'task');
  function nowMin() {
    if (state.clock !== 'live') return Number(state.clock);
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  const isDay = (m) => m >= 360 && m < 1080;      // a symbol, not astronomy: the sun from 06:00 to 18:00
  const dateLabel = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  const cueText = (it) => (it.at != null ? `Today · ${hm(it.at)}` : (it.cue || 'No set time'));
  const chipText = (it) => (it.at != null ? hm(it.at) : (it.cue || 'No set time'));
  const kindText = (it) => `${it.kind === 'routine' ? 'Routine' : 'Task'} · ${it.min} min`;

  // ---------- icons ----------
  const I = {
    play: '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M5.5 3.6 C 5.5 2.9, 6.3 2.5, 6.9 2.9 L 14.2 7.9 C 14.8 8.3, 14.8 9.2, 14.2 9.6 L 6.9 14.6 C 6.3 15, 5.5 14.6, 5.5 13.9 Z" fill="currentColor"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 2.5 L 11.5 11.5 M 11.5 2.5 L 2.5 11.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    expand: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M8.5 1.8 H 12.2 V 5.5 M 12.2 1.8 L 8.2 5.8 M 5.5 12.2 H 1.8 V 8.5 M 1.8 12.2 L 5.8 8.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M1.5 1.5 L 6.5 7 L 1.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/></svg>',
    check: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.6 8.3 L 6.6 11.2 L 12.4 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    info: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.2" stroke="currentColor" stroke-width="1.5"/><path d="M9 8.2 V 12.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="5.6" r="1.05" fill="currentColor"/></svg>',
    pause: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1.3" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1.3" fill="currentColor"/></svg>',
    stop: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="9" height="9" rx="2.2" stroke="currentColor" stroke-width="1.7"/></svg>',
    shield: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8 L 13.2 3.8 V 7.6 C 13.2 10.8, 11 13.2, 8 14.2 C 5 13.2, 2.8 10.8, 2.8 7.6 V 3.8 Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.8 8 L 7.4 9.6 L 10.4 6.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2 V 12 M 2 7 H 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    horizon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 13 A 5 5 0 0 1 15 13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2 13 H 18 M 6 16.5 H 14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    routine: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 10 A 6 6 0 1 1 13.6 5.2" class="ic-routine" stroke-width="1.8" stroke-linecap="round"/><path d="M11.2 4 L 14 4.6 L 13.4 7.4" class="ic-routine" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  function chipIcon(it) {
    if (it.kind === 'routine') return '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="4.2" class="ic-routine" stroke-width="1.8"/></svg>';
    if (it.at == null) return '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="4.2" class="ic-dash" stroke-width="1.5" stroke-dasharray="2 1.8"/></svg>';
    return '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.2" fill="currentColor"/></svg>';
  }
  function tabbar(active) {
    const today = `<svg width="24" height="22" viewBox="0 0 24 22" fill="none" aria-hidden="true"><path d="M5 12 A 7 7 0 0 1 19 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19 12 A 7 7 0 0 1 5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/><path d="M1.5 12 H 22.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.95" cy="7.05" r="2.6" fill="currentColor"/></svg>`;
    const plans = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="17" height="6" rx="3" stroke="currentColor" stroke-width="1.7"/><rect x="2.5" y="12.5" width="17" height="6" rx="3" stroke="currentColor" stroke-width="1.7"/></svg>';
    const progress = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 18 V 13 M 8 18 V 9 M 13 18 V 11 M 18 18 V 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const tab = (k, label, svg) => `<button type="button" class="dl-tab"${k === active ? ' aria-current="page"' : ''}>${svg}${label}</button>`;
    return `<nav class="dl-tabbar" aria-label="Main">${tab('today', 'Today', today)}${tab('plans', 'Plans', plans)}${tab('progress', 'Progress', progress)}</nav>
      <button type="button" class="dl-fab" aria-label="Add a task" style="color: var(--ink)">${I.plus.replace('width="14" height="14"', 'width="20" height="20"')}</button>`;
  }
  // a simple geometric full moon: soft disc, three quiet maria, faint halo
  function moonG(r, uid) {
    const maria = [[-0.3, -0.08, 0.3, 0.36], [0.32, -0.3, 0.2, 0.16], [0.42, 0.22, 0.12, 0.13]]
      .map(([u, v, rx, ry]) => `<ellipse class="moon-mare" cx="${f1(u * r)}" cy="${f1(v * r)}" rx="${f1(rx * r)}" ry="${f1(ry * r)}"/>`).join('');
    return `<defs><radialGradient id="moon-${uid}" cx="38%" cy="32%" r="75%"><stop offset="0" class="moon-a"/><stop offset="1" class="moon-b"/></radialGradient>
      <radialGradient id="mglow-${uid}"><stop offset="0.45" class="mg-0"/><stop offset="1" class="mg-1"/></radialGradient></defs>
      <circle r="${f1(r * 2.2)}" fill="url(#mglow-${uid})"/><circle class="moon-disc" r="${r}" fill="url(#moon-${uid})"/>${maria}`;
  }

  // ---------- the day circle: one 24-hour mapping, noon at the top, clockwise ----------
  const C = 150, R = 128, LANES = [128, 99, 71];
  const EXPANDED = { x: 27, y: 112, s: 1.12 };          // keep in step with .phone.is-open .hero in v2.css
  const ang = (m) => (m / 1440) * 360 - 180;
  const pt = (a, r = R) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];
  const arcLen = (a1, a2, r) => { let d = Math.abs(a1 - a2) % 360; if (d > 180) d = 360 - d; return (d * Math.PI * r) / 180; };
  function arcPath(a0, a1, r = R) {
    let span = a1 - a0;
    while (span <= 0) span += 360;
    span = Math.min(span, 359.5);
    const [x0, y0] = pt(a0, r), [x1, y1] = pt(a0 + span, r);
    return `M ${f1(x0)} ${f1(y0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
  }

  function layout(items, m) {
    const nowA = ang(m);
    const timed = items.filter((i) => i.at != null).sort((a, b) => a.at - b.at);
    const untimed = items.filter((i) => i.at == null);
    const marks = [];
    // markers that would overlap move to an inner ring at the same angle, so each keeps a line to its time
    timed.forEach((it) => {
      const a = ang(it.at);
      let lane = 0;
      const clash = (l) => (l === 0 && arcLen(a, nowA, R) < 32) || marks.some((p) => p.lane === l && arcLen(p.a, a, LANES[l]) < 27);
      while (lane < LANES.length - 1 && clash(lane)) lane++;
      const [x, y] = pt(a, R), [lx, ly] = pt(a, LANES[lane]);
      marks.push({ it, a, lane, x, y, lx, ly });
    });
    // tasks without a clock time: a tray inside the circle, then their own group under it
    const n = untimed.length, shown = Math.min(n, 4);
    const pillW = 16 + 78 + 6 + n * 30 + 6, pillLeft = 195 - pillW / 2;
    untimed.forEach((it, i) => {
      const k = Math.min(i, shown - 1);
      const px = pillLeft + 16 + 78 + 6 + 15 + i * 30;
      marks.push({ it, untimed: true, hidden: i >= shown, x: C + (k - (shown - 1) / 2) * 20, y: 192,
        lx: (px - EXPANDED.x) / EXPANDED.s, ly: (470 - EXPANDED.y) / EXPANDED.s });
    });
    const [nx, ny] = pt(nowA);
    marks.forEach((p, i) => {
      p.d = Math.min(i * 14, 64);       // a subtle stagger, capped so the whole move stays under ~430 ms
      let near = 44 / EXPANDED.s;                     // never more than a 44 pt target
      [...marks.filter((q) => q !== p).map((q) => [q.lx, q.ly]), [nx, ny]].forEach(([qx, qy]) => { near = Math.min(near, Math.hypot(qx - p.lx, qy - p.ly)); });
      p.hit = Math.max(near / 2, 10);
    });
    return { marks, nowA, pill: n ? { left: pillLeft, width: pillW } : null, tray: shown ? shown * 20 + 12 : 0 };
  }

  function circleSVG(uid, L, m) {
    const [nx, ny] = pt(L.nowA);
    const ticks = [0, 360, 720, 1080].map((t) => { const a = ang(t), [x1, y1] = pt(a, R - 9), [x2, y2] = pt(a, R - 4); return `<path class="tick" d="M ${f1(x1)} ${f1(y1)} L ${f1(x2)} ${f1(y2)}"/>`; }).join('');
    const conns = L.marks.filter((p) => !p.untimed && p.lane > 0)
      .map((p) => `<line class="conn" x1="${f1(p.x)}" y1="${f1(p.y)}" x2="${f1(p.lx)}" y2="${f1(p.ly)}" style="--d:${p.d}ms"/><circle class="orig" cx="${f1(p.x)}" cy="${f1(p.y)}" r="2.6" style="--d:${p.d}ms"/>`).join('');
    const now = isDay(m)
      ? `<image href="${ASSETS.sun}" x="-48" y="-48" width="96" height="96"/>`
      : moonG(12, uid);
    const marks = L.marks.map((p) => `<g class="mk mk-${p.it.kind}${p.untimed ? ' mk-u' : ''}${p.hidden ? ' mk-more' : ''}" data-id="${p.it.id}" role="button" tabindex="-1" aria-pressed="false" aria-label="${esc(p.it.name)}, ${esc(cueText(p.it))}" style="--x:${f1(p.x)}px;--y:${f1(p.y)}px;--lx:${f1(p.lx)}px;--ly:${f1(p.ly)}px;--d:${p.d}ms"><circle class="mk-hit" r="${f1(p.hit)}"/><circle class="mk-halo" r="13"/><circle class="mk-dot" r="${p.it.kind === 'routine' ? 6 : 6.5}"/></g>`).join('');
    return `<svg width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
      <defs><linearGradient id="rest-${uid}" gradientUnits="userSpaceOnUse" x1="${f1(nx)}" y1="${f1(ny)}" x2="150" y2="278"><stop offset="0" class="st-a"/><stop offset="1" class="st-b"/></linearGradient></defs>
      <circle class="focusring" cx="150" cy="150" r="146"/>
      <path class="nightfill" d="M 22 150 A 128 128 0 0 0 278 150 Z"/>
      <path class="horizon" d="M 10 150 H 290"/>
      <circle class="trk" cx="150" cy="150" r="128"/>
      <path class="nightline" d="M 278 150 A 128 128 0 0 1 22 150"/>
      <path class="rest" d="${arcPath(L.nowA, 180)}" stroke="url(#rest-${uid})"/>
      ${ticks}
      ${L.tray ? `<rect class="tray" x="${f1(C - L.tray / 2)}" y="181" width="${L.tray}" height="22" rx="11"/>` : ''}
      ${conns}
      <text class="nowtext" x="150" y="140" text-anchor="middle">${hm(m)}</text>
      <g class="now" transform="translate(${f1(nx)} ${f1(ny)})">${now}</g>
      ${marks}
    </svg>`;
  }

  // ---------- screens ----------
  function todayItems() {
    const m = nowMin(), items = data().today;
    const timed = items.filter((i) => i.at != null).sort((a, b) => a.at - b.at);
    const later = timed.filter((i) => i.at >= m), earlier = timed.filter((i) => i.at < m);
    return { ordered: [...later, ...items.filter((i) => i.at == null), ...earlier], earlier };
  }
  function bigCard(it) {
    return `<article class="dl-glass t-card t-card-big">
      <div class="t-row"><span class="dl-chip">${chipIcon(it)}${esc(chipText(it))}</span><span class="dl-cap">${kindText(it)}</span></div>
      <p class="dl-label">${esc(it.name)}</p>
      <h2 class="dl-action">${esc(it.action)}</h2>
      <button type="button" class="dl-btn dl-btn-ink t-start">${I.play}Start</button>
    </article>`;
  }
  function smallCard(it) {
    return `<article class="dl-glass t-card t-card-small">
      <div class="t-small-main">
        <div class="t-row t-row-start"><span class="dl-chip dl-chip-s">${chipIcon(it)}${esc(chipText(it))}</span><span class="dl-cap">${kindText(it)}</span></div>
        <p class="dl-label">${esc(it.name)}</p>
        <p class="dl-action-sm">${esc(it.action)}</p>
      </div>
      <button type="button" class="dl-btn dl-btn-glass t-start-s">Start</button>
    </article>`;
  }
  function markerCard(it) {
    return `<article class="dl-glass dv-card" aria-live="polite">
      <div class="t-row"><span class="dl-chip">${chipIcon(it)}${esc(cueText(it))}</span><span class="dl-cap">${kindText(it)}</span></div>
      <p class="dl-label">${esc(it.name)}</p>
      <h3 class="dl-action-sm">${esc(it.action)}</h3>
      <button type="button" class="dl-btn dl-btn-ink">${I.play}Start</button>
    </article>`;
  }

  // the expand badge sits off the circle's lower right, or lower left while the sun or moon is there
  function badge(nowA) {
    const near = arcLen(nowA, 135, 1) < (40 * Math.PI) / 180;
    const a = ((near ? 225 : 135) * Math.PI) / 180;
    return `left:${f1(288 + 98 * Math.sin(a) - 22)}px;top:${f1(136 - 98 * Math.cos(a) - 22)}px`;
  }
  function todayScreen(ph, dark) {
    const m = nowMin(), uid = ph.dataset.uid;
    const { ordered, earlier } = todayItems();
    const L = layout(data().today, m);
    const nTimed = data().today.filter((i) => i.at != null).length, nUntimed = data().today.length - nTimed;
    const cards = ordered.map((it, i) => `${earlier.length && it === earlier[0] ? '<p class="dl-section">Earlier today</p>' : ''}${i === 0 ? bigCard(it) : smallCard(it)}`).join('');
    const sel = ph.dataset.sel && data().today.find((i) => i.id === ph.dataset.sel);
    return `<div class="c-daylight v2 scr-today${dark ? ' dl-dark' : ''}">
      <header class="t-head"><p class="dl-date">${dateLabel()}</p><h1 class="dl-title">Today</h1><p class="dl-cap t-sum">${data().today.length} planned</p></header>
      <div class="t-list">${cards}</div>
      ${tabbar('today')}
      <button type="button" class="t-expand" data-act="open" aria-label="Open the day view" style="${badge(L.nowA)}"><span>${I.expand}</span></button>
      <div class="dv" role="dialog" aria-modal="true" aria-label="Your day" aria-hidden="true">
        <div class="dv-head"><div><p class="dl-date">${dateLabel()}</p><h2 class="dv-title">Your day</h2></div>
          <button type="button" class="dl-btn dl-btn-glass dv-close" data-act="close">${I.close}Close</button></div>
        ${L.pill ? `<div class="dv-untimed" style="left:${f1(L.pill.left)}px;width:${f1(L.pill.width)}px"><span class="dl-cap">No set time</span></div>` : ''}
        <div class="dv-slot">${sel ? markerCard(sel) : '<p class="dl-cap dv-hint">Tap a marker to see its task.</p>'}</div>
      </div>
      <div class="hero" role="button" tabindex="0" aria-expanded="false" aria-label="Day circle: ${nTimed} at a set time, ${nUntimed} without one. Now ${hm(m)}. Open the day view.">${circleSVG(uid, L, m)}</div>
    </div>`;
  }

  function miniCircle(at) {
    const a = ang(at), x = 22 + 18 * Math.sin((a * Math.PI) / 180), y = 22 - 18 * Math.cos((a * Math.PI) / 180);
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M 4 22 A 18 18 0 0 0 40 22 Z" class="nightfill"/><circle cx="22" cy="22" r="18" class="trk" style="stroke-width:2"/><path d="M 0 22 H 44" class="horizon" style="stroke-width:1"/><circle cx="${f1(x)}" cy="${f1(y)}" r="4.2" class="mk-dot" style="stroke-width:2"/></svg>`;
  }
  function setupScreen(ph, dark) {
    const it = firstTask(), uid = ph.dataset.uid, mode = ph.dataset.mode || 'time', at = it.at ?? 990;
    const seg = [['now', 'Now'], ['time', 'At a time'], ['after', 'After…']]
      .map(([k, l]) => `<button type="button" data-act="mode" data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join('');
    const cue = {
      now: `<div class="dl-row su-cue"><span class="su-cue-ic">${I.play}</span><span class="su-cue-text"><span class="su-cue-t">Right away</span><span class="dl-cap">The session starts as soon as you tap Start session</span></span></div>`,
      time: `<button type="button" class="dl-row su-cue">${miniCircle(at)}<span class="su-cue-text"><span class="su-cue-t">Today</span><span class="dl-cap">At a set time</span></span><span class="su-time">${hm(at)}</span>${I.chev}</button>`,
      after: `<button type="button" class="dl-row su-cue"><span class="su-cue-ic"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" class="ic-routine" stroke-width="2"/></svg></span><span class="su-cue-text"><span class="su-cue-t">After dinner</span><span class="dl-cap">No clock time; it waits for the cue</span></span>${I.chev}</button>`,
    }[mode];
    const actions = mode === 'now'
      ? `<button type="button" class="dl-btn dl-btn-ink">${I.play}Start session</button>`
      : `<button type="button" class="dl-btn dl-btn-glass">${I.play}Start now</button><button type="button" class="dl-btn dl-btn-ink">Save task</button>`;
    return `<div class="c-daylight v2 scr-setup${dark ? ' dl-dark' : ''}">
      <div class="su-dim"></div><div class="su-behind"></div>
      <section class="su-sheet">
        <span class="su-grab"></span>
        <header class="su-head"><button type="button" class="dl-btn dl-btn-text">Cancel</button><p>New task</p><span></span></header>
        <div class="su-body">
          <div class="su-group su-field"><label class="dl-label" for="t-${uid}">Task</label><textarea class="su-name" id="t-${uid}" rows="${it.name.length > 32 ? 2 : 1}" readonly>${esc(it.name)}</textarea></div>
          <div class="su-group su-field"><div class="su-labelrow"><label class="dl-label" for="s-${uid}">First step</label><span class="dl-cap">Small enough to start now</span></div>
            <textarea id="s-${uid}" rows="${it.action.length > 52 ? 3 : 2}" readonly>${esc(it.action)}</textarea></div>
          <div class="su-group su-when"><p class="dl-label">When to start</p><div class="dl-seg" role="group" aria-label="When to start">${seg}</div>${cue}</div>
          <div class="su-options"><p class="dl-section">Options</p><div class="su-opt-group">
            <div class="dl-row su-opt"><span class="su-opt-t">Reminder<span class="dl-cap">Optional</span></span><button type="button" class="dl-switch" role="switch" aria-checked="false" aria-label="Reminder"></button></div>
            <button type="button" class="dl-row su-opt"><span class="su-opt-t">Session<span class="dl-cap">25 min · Countdown · 3 apps blocked</span></span>${I.chev}</button>
          </div></div>
        </div>
        <div class="su-actions ${mode === 'now' ? 'one' : 'two'}">${actions}</div>
      </section>
    </div>`;
  }

  function plansScreen(ph, dark) {
    const d = data();
    const tasks = d.today.filter((i) => i.kind === 'task'), routines = d.today.filter((i) => i.kind === 'routine');
    const icon = (it) => (it.at != null ? miniCircle(it.at).replace(/width="44" height="44"/, 'width="26" height="26"')
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" class="ic-dash" stroke-width="1.5" stroke-dasharray="2 2.6"/></svg>');
    const ready = (it) => `<article class="pl-task"><span class="pl-ic">${icon(it)}</span>
      <span class="pl-top"><span class="dl-label">${esc(it.name)}</span><span class="dl-cap pl-state pl-state-ready">Next step ready</span></span>
      <span class="dl-action-sm" style="font-size: 17px; line-height: 22px;">${esc(it.action)}</span>
      <span class="pl-btns"><button type="button" class="dl-btn dl-btn-ink">${I.play.replace('width="16" height="16"', 'width="14" height="14"')}Resume</button><span class="dl-cap" style="flex: 1;">${esc(it.at != null ? `Today ${hm(it.at)}` : 'No set time')}</span><button type="button" class="dl-btn dl-btn-text">Edit</button></span></article>`;
    const open = (name) => `<article class="pl-task"><span class="pl-ic">${icon({})}</span>
      <span class="pl-top"><span class="dl-label">${esc(name)}</span><span class="dl-cap pl-state" style="font-weight: 600;">Not scheduled yet</span></span>
      <span class="dl-body">Not on your day yet. It waits here, no pressure.</span>
      <span class="pl-btns"><button type="button" class="dl-btn dl-btn-glass" style="padding: 0 16px;">Plan a first step</button><span style="flex: 1;"></span><button type="button" class="dl-btn dl-btn-text">Edit</button></span></article>`;
    const rt = (it) => `<article class="dl-row pl-routine"><span class="pl-ic" style="grid-row: auto;">${I.routine}</span>
      <span class="pl-routine-t"><b>${esc(it.name)}</b><span class="dl-cap">${esc(it.action.replace(/\.$/, ''))} · ${it.min} min · ${esc(it.at != null ? hm(it.at) : (it.cue || 'no set time').toLowerCase())}</span></span>
      <button type="button" class="dl-btn dl-btn-text" style="height: 44px; font-size: 15px;">Edit</button></article>`;
    const nTasks = tasks.length + d.unscheduled.length;
    return `<div class="c-daylight v2 scr-plans${dark ? ' dl-dark' : ''}"><div class="scroll"><div class="pl-wrap">
      <header class="pl-head"><p class="dl-date">${nTasks} tasks · ${routines.length} routine${routines.length === 1 ? '' : 's'}</p><h1 class="dl-title">Plans</h1></header>
      <p class="dl-section">Tasks</p>
      <section class="dl-glass pl-group">${tasks.map(ready).join('')}${d.unscheduled.map(open).join('')}</section>
      <p class="dl-section">Routines</p>
      <section class="dl-glass pl-group">${routines.map(rt).join('')}<button type="button" class="dl-row pl-new"><span style="width: 40px; display: flex; justify-content: center;">${I.plus}</span><span style="font-size: 16px; font-weight: 600;">New routine</span></button></section>
    </div></div><div class="bar" aria-hidden="true">Plans</div>${tabbar('plans')}</div>`;
  }

  function sessionScreen(ph, dark) {
    const it = firstTask(), uid = ph.dataset.uid;
    return `<div class="c-daylight v2 scr-session${dark ? ' dl-dark dl-deep' : ' dl-dusk'}">
      <div class="se-top"><span class="dl-pill-dusk dl-glass-dark se-name">${esc(it.name)}</span><span class="dl-pill-dusk dl-glass-dark">${I.shield}Blocking 3 apps</span></div>
      <h1 class="se-action">${esc(it.action)}</h1>
      <div class="se-disc"></div>
      <svg class="se-ring" width="390" height="844" viewBox="0 0 390 844" fill="none" role="img" aria-label="25.2 percent of the session elapsed, 74.8 percent remaining">
        <defs><linearGradient id="ring-${uid}" x1="195" y1="312" x2="313" y2="430" gradientUnits="userSpaceOnUse"><stop offset="0" class="r-a"/><stop offset="1" class="r-b"/></linearGradient></defs>
        <circle cx="195" cy="430" r="112" stroke="var(--ring-track)" stroke-width="10"/>
        <circle cx="195" cy="430" r="112" pathLength="100" stroke-dasharray="25.2 100" stroke="url(#ring-${uid})" stroke-width="10" stroke-linecap="round" transform="rotate(-90 195 430)"/>
        <circle cx="306.99" cy="431.41" r="16" fill="var(--ring-glow)"/><circle cx="306.99" cy="431.41" r="7" fill="#FFFFFF"/>
      </svg>
      <div class="se-time"><p class="dl-timer" aria-label="18 minutes 42 seconds remaining">18:42</p><p class="dl-dusk-label">remaining of 25 min</p></div>
      <div class="se-controls">
        <button type="button" class="dl-btn dl-glass-dark se-stuck">I’m feeling stuck</button>
        <div class="se-row"><button type="button" class="dl-btn dl-glass-dark">${I.stop}End</button><button type="button" class="dl-btn dl-glass-dark">${I.pause}Pause</button></div>
      </div>
    </div>`;
  }

  const CUES = { tomorrow: 'Tomorrow · 16:30', dinner: 'Tomorrow · after dinner' };
  function endScreen(ph, dark) {
    const it = firstTask(), uid = ph.dataset.uid, step = ph.dataset.step || 'choose', cue = ph.dataset.cue || '';
    const m = nowMin();
    const hero = isDay(m)
      ? `<div class="en-haze en-haze-sun"></div><img class="en-sun" src="${ASSETS.sunLow}" alt="">`
      : `<div class="en-haze en-haze-moon"></div><svg class="en-moon" width="160" height="160" viewBox="-80 -80 160 160" aria-hidden="true">${moonG(48, `${uid}e`)}</svg>`;
    const act = (key, icon, title, cap) => `<button type="button" class="en-act" data-act="end" data-step="${key}"><span class="en-ic">${icon}</span><span class="en-act-t"><b>${title}</b><span class="dl-cap">${cap}</span></span><span class="en-chev">${I.chev}</span></button>`;
    const done = (title, body, undo = 'choose') => `<div class="en-done" role="status"><span class="en-badge">${I.check(24)}</span><h2>${title}</h2><p class="dl-body">${body}</p>
      <div class="en-btns"><button type="button" class="dl-btn dl-btn-glass" data-act="end" data-step="${undo}">Undo</button><button type="button" class="dl-btn dl-btn-ink">Back to Today</button></div></div>`;
    const name = esc(it.name), next = 'Write the opening paragraph.';
    let body;
    if (step === 'choose') {
      body = `<p class="dl-section">What now?</p><div class="en-actions">
        ${act('finished', I.check(18), 'Task finished', `Mark ${name} as done`)}
        ${act('continue', I.play, 'Continue now', 'Start another 25 minutes')}
        ${act('done', I.horizon, 'Done for today', 'Keep the task open')}</div>`;
    } else if (step === 'done') {
      const chips = ph.dataset.cues === '1'
        ? Object.entries(CUES).map(([k, l]) => `<button type="button" class="en-chip" data-act="end-cue" data-cue="${k}" aria-pressed="${cue === k}">${cue === k ? I.check(14) : ''}${l}</button>`).join('')
        : `<button type="button" class="dl-btn dl-btn-text en-addcue" data-act="end-addcue">${I.plus}Add a start time</button>`;
      body = `<p class="dl-section">Done for today</p>
        <div class="en-next"><label for="n-${uid}">Next time, start with <span class="dl-cap">Optional</span></label><input id="n-${uid}" value="${next}"></div>
        <div class="en-cues">${chips}</div>
        <div class="en-btns"><button type="button" class="dl-btn dl-btn-glass" data-act="end" data-step="notnow">Not now</button><button type="button" class="dl-btn dl-btn-ink" data-act="end" data-step="saved">Save next step</button></div>`;
    } else if (step === 'saved') {
      body = done('Next step saved', cue === 'tomorrow' ? `${name} starts tomorrow at 16:30 with: ${next}`
        : cue === 'dinner' ? `${name} starts tomorrow after dinner with: ${next}` : `${name} waits in Plans with this next step. No time set.`, 'done');
    } else if (step === 'notnow') {
      body = done('Saved in Plans', `${name} stays open in Plans. No time set.`, 'done');
    } else if (step === 'finished') {
      body = done('Marked as done', `${name} moves to your finished tasks.`);
    } else {
      body = done('Another 25 minutes', 'The next session starts now.');
    }
    return `<div class="c-daylight v2 scr-end scr-end-${dark ? 'dark dl-dark' : 'light'}">
      ${hero}
      <div class="en-title"><h1 class="dl-title" style="font-size: 32px; line-height: 38px;">Session complete.</h1><p>25 min · ${name}</p></div>
      <section class="en-sheet">${body}</section>
    </div>`;
  }

  const BARS = '<path d="M38.29 104 L38.29 31 A7 7 0 0 1 52.29 31 L52.29 104 Z"/><path d="M123.43 104 L123.43 71 A7 7 0 0 1 137.43 71 L137.43 104 Z"/><path d="M166 104 L166 31 A7 7 0 0 1 180 31 L180 104 Z"/><path d="M208.57 104 L208.57 71 A7 7 0 0 1 222.57 71 L222.57 104 Z"/><path d="M293.71 104 L293.71 31 A7 7 0 0 1 307.71 31 L307.71 104 Z"/>';
  const CUM = 'M28.00 124.00 L32.67 122.23 L37.33 120.47 L42.00 120.47 L46.67 116.93 L51.33 115.17 L56.00 115.17 L60.67 113.40 L65.33 109.87 L70.00 108.10 L74.67 106.33 L79.33 106.33 L84.00 102.80 L88.67 101.03 L93.33 99.27 L98.00 97.50 L102.67 95.73 L107.33 95.73 L112.00 95.73 L116.67 95.73 L121.33 95.73 L126.00 95.73 L130.67 95.73 L135.33 95.73 L140.00 95.73 L144.67 95.73 L149.33 95.73 L154.00 95.73 L158.67 95.73 L163.33 95.73 L168.00 92.20 L172.67 90.43 L177.33 86.90 L182.00 85.13 L186.67 83.37 L191.33 81.60 L196.00 78.07 L200.67 76.30 L205.33 72.77 L210.00 71.00 L214.67 67.47 L219.33 67.47 L224.00 65.70 L228.67 63.93 L233.33 60.40 L238.00 58.63 L242.67 55.10 L247.33 53.33 L252.00 51.57 L256.67 49.80 L261.33 48.03 L266.00 46.27 L270.67 46.27 L275.33 44.50 L280.00 40.97 L284.67 40.97 L289.33 39.20 L294.00 35.67 L298.67 35.67 L303.33 33.90 L308.00 30.37 L312.67 28.60 L317.33 28.60 L322.00 25.07';
  function chart(range, uid) {
    if (range === '7') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const xs = [45.29, 87.86, 130.43, 173, 215.57, 258.14, 300.71];
      return `<svg width="326" height="124" viewBox="0 0 326 124" fill="none" role="img" aria-label="Daily sessions, Monday to Sunday: 2, 0, 1, 2, 1, 0, 2">
        <path d="M24 24 H 322 M 24 64 H 322" stroke="var(--grid)"/><path d="M24 104 H 322" stroke="var(--base)"/>
        <text class="dl-axis" x="2" y="28">2</text><text class="dl-axis" x="2" y="68">1</text><text class="dl-axis" x="2" y="108">0</text>
        <g fill="var(--bar)">${BARS}</g>
        <circle cx="87.86" cy="104" r="3" fill="var(--zero)"/><circle cx="258.14" cy="104" r="3" fill="var(--zero)"/>
        ${days.map((d, i) => `<text class="dl-axis" x="${xs[i]}" y="121" text-anchor="middle"${i === 6 ? ' style="fill: var(--ink); font-weight: 700;"' : ''}>${d}</text>`).join('')}
      </svg>`;
    }
    return `<svg width="326" height="150" viewBox="0 0 326 150" fill="none" role="img" aria-label="Cumulative sessions from 3 August to 4 October, rising to 56">
      <defs><linearGradient id="wash-${uid}" x1="0" y1="18" x2="0" y2="124" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--wash)" stop-opacity="0.22"/><stop offset="1" stop-color="var(--wash)" stop-opacity="0.02"/></linearGradient></defs>
      <path d="M28 18 H 322 M 28 53.33 H 322 M 28 88.67 H 322" stroke="var(--grid)"/><path d="M28 124 H 322" stroke="var(--base)"/>
      <text class="dl-axis" x="0" y="22">60</text><text class="dl-axis" x="0" y="57.3">40</text><text class="dl-axis" x="0" y="92.7">20</text><text class="dl-axis" x="0" y="128">0</text>
      <path d="${CUM} L322.00 124.00 L28.00 124.00 Z" fill="url(#wash-${uid})"/>
      <path d="${CUM}" stroke="var(--line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="322" cy="25.07" r="5.5" fill="var(--wash)" stroke="var(--mk-bg)" stroke-width="2"/>
      <text x="308" y="14" text-anchor="end" style="font-family: Geist, system-ui, sans-serif; font-size: 13px; font-weight: 700; fill: var(--ink);">56</text>
      <path d="M28 124 V 128 M 163.33 124 V 128 M 303.33 124 V 128" stroke="var(--base)"/>
      <text class="dl-axis" x="28" y="143">Aug</text><text class="dl-axis" x="163.3" y="143" text-anchor="middle">Sep</text><text class="dl-axis" x="303.3" y="143" text-anchor="middle">Oct</text>
    </svg>`;
  }
  const INFO = {
    chart: 'Counts only sessions logged in Intent. A day without a logged session shows as zero.',
    pattern: 'A pattern in your records, not a rule about when to work.',
  };
  const infoBtn = (k, uid, label) => `<button type="button" class="info" data-act="info" data-info="${k}" aria-expanded="false" aria-controls="pop-${k}-${uid}" aria-label="${label}">${I.info}</button>`;
  const pop = (k, uid) => `<p class="pop" id="pop-${k}-${uid}" hidden>${INFO[k]}</p>`;
  function progressScreen(ph, dark) {
    const d = data(), uid = ph.dataset.uid, range = ph.dataset.range || '7';
    const fin = d.finished, all = ph.dataset.all === '1';
    const showN = all || fin.length <= 4 ? fin.length : 3;
    const rt = d.today.find((i) => i.kind === 'routine' && i.at == null) || d.today.find((i) => i.kind === 'routine');
    const a16 = ang(960), a18 = ang(1080);
    const P = (a, r) => [40 + r * Math.sin((a * Math.PI) / 180), 40 - r * Math.cos((a * Math.PI) / 180)];
    const [hx0, hy0] = P(a16, 30), [hx1, hy1] = P(a18, 30);
    return `<div class="c-daylight v2 scr-progress${dark ? ' dl-dark' : ''}"><div class="scroll"><div class="pr-wrap">
      <header class="pr-head"><h1 class="dl-title">Progress</h1><span class="dl-chip">Sample data</span></header>
      <section class="dl-glass pr-card">
        <p class="pr-big">${fin.length} tasks finished</p>
        <ul class="pr-list">${fin.slice(0, showN).map((n) => `<li><span class="pr-check">${I.check(13)}</span><span>${esc(n)}</span></li>`).join('')}</ul>
        ${fin.length > showN ? `<button type="button" class="dl-btn dl-btn-text pr-more" data-act="showall">Show all ${fin.length}</button>` : ''}
      </section>
      <section class="dl-glass pr-card pr-sessions">
        <div class="pr-sess-top"><p><span class="dl-label">Sessions logged</span><span class="pr-stat"><b>56</b><span class="dl-cap">all time</span></span></p>
          <p class="pr-side"><span class="dl-cap"><b>8</b> last 7 days</span><span class="dl-cap"><b>6</b> previous 7 days</span></p></div>
        <div class="pr-div"></div>
        <div class="dl-seg pr-seg" role="group" aria-label="Chart range"><button type="button" data-act="range" data-range="7" aria-pressed="${range === '7'}">7 days</button><button type="button" data-act="range" data-range="all" aria-pressed="${range === 'all'}">All time</button></div>
        <div class="pr-chart-head"><p class="pr-chart-title">${range === '7' ? 'Daily sessions' : 'Total sessions'}</p><p class="dl-cap">${range === '7' ? 'Sessions per day' : 'Cumulative sessions'}</p>${infoBtn('chart', uid, 'About this chart')}</div>
        ${pop('chart', uid)}
        ${chart(range, uid)}
      </section>
      <section class="dl-glass pr-card">
        <div class="pr-rt-head"><p class="dl-label">${I.routine.replace('width="20" height="20"', 'width="14" height="14"')}<span>${esc(rt.name)}</span></p><span class="dl-chip pr-period">Last 7 days</span></div>
        <div class="pr-rt-body"><div><p class="dl-action-sm">3 days recorded as done</p><p class="dl-body">1 planned day not recorded</p></div>
          <svg width="100" height="20" viewBox="0 0 100 20" role="img" aria-label="3 days recorded as done, 1 planned day not recorded"><circle class="pr-ring-on" cx="10" cy="10" r="8"/><circle class="pr-ring-on" cx="36" cy="10" r="8"/><circle class="pr-ring-on" cx="62" cy="10" r="8"/><circle class="pr-ring-off" cx="88" cy="10" r="7.2"/></svg></div>
      </section>
      <section class="dl-glass pr-card pr-pattern">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" role="img" aria-label="Most recorded starts between 16:00 and 18:00">
          <path d="M 10 40 A 30 30 0 0 0 70 40 Z" class="nightfill"/><circle cx="40" cy="40" r="30" class="trk" style="stroke-width:2"/><path d="M 4 40 H 76" class="horizon" style="stroke-width:1"/>
          <path d="M ${f1(hx0)} ${f1(hy0)} A 30 30 0 0 1 ${f1(hx1)} ${f1(hy1)}" stroke="var(--rest-a)" stroke-width="6" stroke-linecap="round"/>
        </svg>
        <div><div class="pr-pattern-top"><p class="dl-label">Most recorded starts</p>${infoBtn('pattern', uid, 'About this pattern')}</div>
          <p class="dl-stat" style="font-size: 22px; line-height: 26px;">16:00–18:00</p><p class="dl-cap">6 of the last 8 sessions</p>${pop('pattern', uid)}</div>
      </section>
    </div></div><div class="bar" aria-hidden="true">Progress</div>${tabbar('progress')}</div>`;
  }

  const SCREENS = { today: todayScreen, setup: setupScreen, plans: plansScreen, session: sessionScreen, end: endScreen, progress: progressScreen };

  // ---------- rendering and interaction ----------
  function render(ph) {
    const sc = ph.querySelector('.scroll');
    const top = sc ? sc.scrollTop : (ph.dataset.scroll ? Number(ph.dataset.scroll) : null);
    ph.innerHTML = SCREENS[ph.dataset.screen](ph, ph.dataset.theme === 'dark');
    const sc2 = ph.querySelector('.scroll');
    if (sc2 && top != null) sc2.scrollTop = top;
    if (sc2) sc2.parentElement.classList.toggle('scrolled', sc2.scrollTop > 48);
    if (ph.dataset.screen === 'today') { syncDay(ph); paintSelection(ph); }
  }
  function syncDay(ph) {
    const open = ph.classList.contains('is-open');
    const hero = ph.querySelector('.hero');
    hero.setAttribute('aria-expanded', String(open));
    hero.setAttribute('role', open ? 'group' : 'button');
    hero.tabIndex = open ? -1 : 0;
    hero.querySelector('svg').setAttribute('aria-hidden', String(!open));
    ph.querySelector('.dv').setAttribute('aria-hidden', String(!open));
    ph.querySelectorAll('.mk').forEach((g) => g.setAttribute('tabindex', open ? '0' : '-1'));
  }
  function paintSelection(ph) {
    const id = ph.dataset.sel || '';
    ph.querySelectorAll('.mk').forEach((g) => g.setAttribute('aria-pressed', String(g.dataset.id === id)));
    const slot = ph.querySelector('.dv-slot');
    const it = id && data().today.find((i) => i.id === id);
    slot.innerHTML = it ? markerCard(it) : '<p class="dl-cap dv-hint">Tap a marker to see its task.</p>';
  }
  function openDay(ph) {
    if (ph.classList.contains('is-open')) return;
    ph.classList.add('is-open', 'is-sep');
    syncDay(ph);
    setTimeout(() => ph.querySelector('.dv-close').focus({ preventScroll: true }), reduced() ? 0 : 400);
  }
  function closeDay(ph) {
    ph.classList.remove('is-sep', 'is-open');
    ph.dataset.sel = '';
    syncDay(ph);
    paintSelection(ph);
    ph.querySelector('.hero').focus({ preventScroll: true });
  }
  function select(ph, id) {
    ph.dataset.sel = ph.dataset.sel === id ? '' : id;
    paintSelection(ph);
  }

  const ACTIONS = {
    mode: (ph, el) => { ph.dataset.mode = el.dataset.mode; render(ph); },
    end: (ph, el) => { ph.dataset.step = el.dataset.step; if (el.dataset.step === 'choose') { ph.dataset.cue = ''; ph.dataset.cues = ''; } render(ph); },
    'end-addcue': (ph) => { ph.dataset.cues = '1'; render(ph); },
    'end-cue': (ph, el) => { ph.dataset.cue = ph.dataset.cue === el.dataset.cue ? '' : el.dataset.cue; render(ph); },
    range: (ph, el) => { ph.dataset.range = el.dataset.range; render(ph); },
    showall: (ph) => { ph.dataset.all = '1'; render(ph); },
    info: (ph, el) => {
      const p = ph.querySelector(`#${el.getAttribute('aria-controls')}`);
      const open = el.getAttribute('aria-expanded') !== 'true';
      el.setAttribute('aria-expanded', String(open));
      p.hidden = !open;
    },
  };

  document.addEventListener('click', (e) => {
    const t = e.target;
    const tb = t.closest('[data-set]');
    if (tb) { state[tb.dataset.set] = tb.dataset.value; paintToolbar(); document.querySelectorAll('.phone').forEach(render); return; }
    const ph = t.closest('.phone');
    if (!ph) return;
    const act = t.closest('[data-act]');
    if (ph.dataset.screen === 'today') {
      if (!ph.classList.contains('is-open')) {
        if (t.closest('.hero') || (act && act.dataset.act === 'open')) openDay(ph);
        return;
      }
      if (act && act.dataset.act === 'close') { closeDay(ph); return; }
      const mk = t.closest('.mk');
      if (mk) { select(ph, mk.dataset.id); return; }
      if (!t.closest('.dv-card') && ph.dataset.sel) { ph.dataset.sel = ''; paintSelection(ph); }
      return;
    }
    if (act && ACTIONS[act.dataset.act]) ACTIONS[act.dataset.act](ph, act, e);
  });
  // a compact title bar fades in once a long screen is scrolled
  document.addEventListener('scroll', (e) => {
    const sc = e.target;
    if (sc.classList && sc.classList.contains('scroll')) sc.parentElement.classList.toggle('scrolled', sc.scrollTop > 48);
  }, true);
  document.addEventListener('keydown', (e) => {
    const ph = e.target.closest && e.target.closest('.phone');
    if (e.key === 'Escape') {
      const open = ph && ph.classList.contains('is-open') ? ph : document.querySelector('.phone.is-open');
      if (open) { e.preventDefault(); closeDay(open); }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && ph) {
      if (e.target.classList.contains('hero') && !ph.classList.contains('is-open')) { e.preventDefault(); openDay(ph); }
      else if (e.target.classList && e.target.classList.contains('mk')) { e.preventDefault(); select(ph, e.target.dataset.id); }
    }
  });

  function paintToolbar() {
    document.querySelectorAll('[data-set]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.set] === b.dataset.value)));
    const live = document.querySelector('.live-time');
    if (live) { const d = new Date(); live.textContent = hm(d.getHours() * 60 + d.getMinutes()); }
  }
  // the current-time indicator follows the device clock, once a minute
  function tick() {
    const d = new Date();
    setTimeout(() => {
      paintToolbar();
      if (state.clock === 'live') document.querySelectorAll('.phone[data-screen="today"], .phone[data-screen="end"]').forEach(render);
      tick();
    }, (60 - d.getSeconds()) * 1000 - d.getMilliseconds() + 50);
  }

  let uid = 0;
  document.querySelectorAll('.phone').forEach((ph) => {
    ph.dataset.uid = `p${(uid += 1)}`;
    if (ph.dataset.open === '1') ph.classList.add('is-open', 'is-sep', 'no-anim');
    render(ph);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.phone.no-anim').forEach((ph) => ph.classList.remove('no-anim'))));
  paintToolbar();
  tick();
  window.IntentV2 = { state, render, openDay, closeDay };   // used by the automated checks only
})();
