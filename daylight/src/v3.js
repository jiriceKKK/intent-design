/* Intent · Daylight v3 — the interactions behind the prototype.
   Every phone renders from the sample data below; nothing is stored or sent anywhere.
   The day circle has one 24-hour mapping: noon at the top, midnight at the bottom, clockwise.
   A planned session is an arc: its start angle is the start time, its span the session length. */
(() => {
  'use strict';
  const ASSETS = window.DAYLIGHT_ASSETS || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const RAD = Math.PI / 180;

  // ---------- sample data ----------
  // at: start (minutes after midnight) or null · min: planned session length, null = no set length · cue: an event instead of a clock time
  const T = (id, name, action, at, min, cue = null) => ({ id, name, action, kind: 'task', at, min, cue });
  const R = (id, name, action, at, min, cue = null) => ({ id, name, action, kind: 'routine', at, min, cue });
  const DATA = {
    default: {
      today: [
        R('stretch', 'Morning stretch', 'Roll out the mat and stretch for five minutes.', 450, 5),
        T('budget', 'Budget', 'Open the shared budget sheet and check last month’s totals.', 780, 25),
        T('essay', 'Essay outline', 'Open the document and write three bullet points.', 990, 25),
        T('sources', 'Source review', 'Read the methods section and mark two quotes.', 1005, 25),
        R('piano', 'Piano', 'Play the C major scale slowly, hands separate.', 1110, null),
        R('reading', 'Evening reading', 'Read one page.', null, 5, 'After dinner'),
        T('errands', 'Errands', 'Buy stamps at the post office.', null, 15),
      ],
      unscheduled: ['Portfolio update'],
      finished: ['Literature list', 'Interview questions'],
    },
    long: {
      today: [
        R('stretch', 'Morning mobility and stretching routine before work', 'Roll out the mat by the window and stretch slowly for five minutes.', 450, 5),
        T('budget', 'Quarterly budget reconciliation for the community garden association', 'Open the shared budget sheet and compare last month’s totals with the bank statement.', 780, 25),
        T('essay', 'Quarterly research report for the regional planning committee', 'Open the shared draft and write three bullet points for the methodology section.', 990, 25),
        T('sources', 'Source review for the literature chapter on urban mobility', 'Read the methods section of the Lisbon tram study and mark two quotes worth citing.', 1005, 25),
        R('piano', 'Piano practice: scales and the Chopin nocturne in E-flat major', 'Play the C major scale slowly with each hand separately, then together.', 1110, null),
        R('reading', 'Evening reading from the philosophy anthology', 'Read one page of the current chapter before bed.', null, 5, 'After dinner'),
        T('errands', 'Errands in town before the post office closes', 'Buy stamps and send the signed lease back to the landlord.', null, 15),
      ],
      unscheduled: ['Portfolio update with the new case study and refreshed photography'],
      finished: ['Interview questions for the oral history project with former tram drivers', 'Literature list for the urban mobility chapter'],
    },
    dense: {
      today: [
        R('stretch', 'Morning stretch', 'Stretch for five minutes.', 450, 5),
        T('inbox', 'Inbox', 'Reply to the two urgent emails.', 540, 15),
        T('sync', 'Team sync prep', 'Write the agenda for the team sync.', 550, 15),
        T('dentist', 'Admin', 'Call the dentist about the appointment.', 555, 5),
        T('budget', 'Budget', 'Review the shared budget sheet.', 780, 25),
        T('logo', 'Portfolio update', 'Sketch three logo ideas.', 960, 30),
        T('essay', 'Essay outline', 'Open the document and write three bullet points.', 990, 25),
        T('sources', 'Source review', 'Read the methods section.', 1005, 25),
        R('piano', 'Piano', 'Practise scales for ten minutes.', 1010, 10),
        R('call', 'Call with Dad', 'Call Dad and ask about the trip.', 1170, null),
        T('weekly', 'Weekly review', 'Note the first step for tomorrow.', 1260, 15),
        R('reading', 'Evening reading', 'Read one page.', null, 5, 'After dinner'),
        R('plants', 'Plants', 'Water the plants on the balcony.', null, 5, 'After work'),
        T('stamps', 'Errands', 'Buy stamps at the post office.', null, 15),
      ],
      unscheduled: ['Tax return'],
      finished: ['Literature list', 'Interview questions', 'Inbox zero', 'Budget draft', 'Logo brief', 'Team sync notes', 'Dentist form'],
    },
  };
  const state = { data: 'default', clock: 'live', motion: 'full' };
  const data = () => DATA[state.data];
  const byId = (id) => data().today.find((i) => i.id === id);
  const focusTask = () => byId('essay');
  const reduced = () => state.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function nowMin() {
    if (state.clock !== 'live') return Number(state.clock);
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  const dateLabel = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');

  const timed = (it) => it.at != null;
  const endOf = (it) => it.at + (it.min || 0);
  const timeText = (it) => (!timed(it) ? (it.cue || 'No set time') : it.min ? `${hm(it.at)}–${hm(endOf(it))}` : `From ${hm(it.at)}`);
  const lenText = (it) => (it.min ? `${it.min} min` : 'no set length');
  const capText = (it) => `${it.kind === 'routine' ? 'Routine' : 'Task'} · ${lenText(it)}`;
  const spoken = (it) => `${it.name}. ${timed(it) ? (it.min ? `${hm(it.at)} to ${hm(endOf(it))}, ${it.min} minutes` : `starts ${hm(it.at)}, no set length`) : (it.cue || 'no set time')}`;

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
    if (!timed(it)) return '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="4.2" class="ic-dash" stroke-width="1.5" stroke-dasharray="2 1.8"/></svg>';
    return '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.2" fill="currentColor"/></svg>';
  }
  function tabbar(active) {
    const today = '<svg width="24" height="22" viewBox="0 0 24 22" fill="none" aria-hidden="true"><path d="M5 12 A 7 7 0 0 1 19 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19 12 A 7 7 0 0 1 5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/><path d="M1.5 12 H 22.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.95" cy="7.05" r="2.6" fill="currentColor"/></svg>';
    const plans = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="17" height="6" rx="3" stroke="currentColor" stroke-width="1.7"/><rect x="2.5" y="12.5" width="17" height="6" rx="3" stroke="currentColor" stroke-width="1.7"/></svg>';
    const progress = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 18 V 13 M 8 18 V 9 M 13 18 V 11 M 18 18 V 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const tab = (k, label, svg) => `<button type="button" class="dl-tab"${k === active ? ' aria-current="page"' : ''}>${svg}${label}</button>`;
    return `<nav class="dl-tabbar" aria-label="Main">${tab('today', 'Today', today)}${tab('plans', 'Plans', plans)}${tab('progress', 'Progress', progress)}</nav>
      <button type="button" class="dl-fab" aria-label="Add a task" style="color: var(--ink)">${I.plus.replace('width="14" height="14"', 'width="20" height="20"')}</button>`;
  }

  // ---------- the day circle geometry ----------
  const TH = 0.054;                                       // arc thickness as a share of the track radius
  const LANE = 2.6;                                       // lane spacing in arc thicknesses
  const ang = (m) => (m / 1440) * 360 - 180;            // degrees from the top, clockwise: noon 0°, 18:00 90°, midnight 180°
  const pt = (r, a) => [r * Math.sin(a * RAD), -r * Math.cos(a * RAD)];
  const P = (r, a) => { const [x, y] = pt(r, a); return `${f2(x)} ${f2(y)}`; };
  function arcD(r, a0, a1) {
    const span = Math.max(0, a1 - a0);
    return `M ${P(r, a0)} A ${f2(r)} ${f2(r)} 0 ${span > 180 ? 1 : 0} 1 ${P(r, a0 + span)}`;
  }
  function sectorD(ri, ro, a0, a1) {
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M ${P(ro, a0)} A ${f2(ro)} ${f2(ro)} 0 ${big} 1 ${P(ro, a1)} L ${P(ri, a1)} A ${f2(ri)} ${f2(ri)} 0 ${big} 0 ${P(ri, a0)} Z`;
  }
  /* The visible mark for one session at radius r, thickness t, rotated by off degrees (for the sweep).
     The capsule's outer ends are exactly the start and end times (the round caps are drawn inside the
     interval, not added to it). A session shorter than the stroke is thick becomes a radial pill as wide
     as its true duration. A start without a set length is a small ▸ whose back edge is the start time. */
  function shape(it, r, t, off) {
    const a0 = ang(it.at) + off;
    if (!it.min) {
      const a = a0 * RAD, u = [Math.sin(a), -Math.cos(a)], v = [Math.cos(a), Math.sin(a)];
      const B = [r * u[0], r * u[1]], h = t * 0.78, len = t * 1.3;
      const p1 = [B[0] + u[0] * h, B[1] + u[1] * h], p2 = [B[0] - u[0] * h, B[1] - u[1] * h], p3 = [B[0] + v[0] * len, B[1] + v[1] * len];
      return { type: 'tri', d: `M ${f2(p1[0])} ${f2(p1[1])} L ${f2(p3[0])} ${f2(p3[1])} L ${f2(p2[0])} ${f2(p2[1])} Z`, w: t * 0.24, foot: len, a0 };
    }
    const span = it.min / 4, L = span * RAD * r;
    if (L > t) {
      const c = (t / 2 / r) / RAD;
      return { type: 'arc', d: arcD(r, a0 + c, a0 + span - c), w: t, foot: L, a0, span };
    }
    const am = a0 + span / 2, w = Math.max(L, t * 0.3), h = Math.max(0, (t - w) / 2);
    return { type: 'pill', d: `M ${P(r - h, am)} L ${P(r + h, am)}`, w, foot: w, a0, span };
  }
  // overlapping or touching sessions step outward onto extra lanes; the first one keeps the base track
  function assignLanes(items, r, t) {
    const gap = (t * 0.5) / r / RAD, lanes = [];
    const sorted = items.filter(timed).slice().sort((a, b) => a.at - b.at || (b.min || 0) - (a.min || 0));
    return sorted.map((it) => {
      const s = shape(it, r, t, 0);
      const a0 = ang(it.at), a1 = a0 + Math.max(s.foot / r / RAD, it.min ? it.min / 4 : 0);
      let lane = 0;
      while (lanes[lane] && lanes[lane].some(([b0, b1]) => a0 < b1 + gap && b0 < a1 + gap)) lane += 1;
      (lanes[lane] = lanes[lane] || []).push([a0, a1]);
      return { it, lane, a0, a1 };
    });
  }
  // drawing order: long marks first, so short ones stay on top (and their hit areas win)
  const drawOrder = (list) => list.slice().sort((a, b) => (b.it.min || 0) - (a.it.min || 0) || a.it.at - b.it.at);

  function arcMarkup(it, cls = '') {
    const tri = !it.min ? ' a-tri' : '';
    const inner = it.kind === 'routine' && it.min ? '<path class="a-in"/>' : '';
    return `<g class="arc arc-${it.kind}${cls}" data-id="${it.id}"><path class="a-gap${tri}"/><path class="a-halo${tri}"/><path class="a-out${tri}"/>${inner}<path class="a-hit"/></g>`;
  }
  function paintArc(g, it, r, t, off) {
    const s = shape(it, r, t, off);
    const [gap, halo, out] = g.children;
    const inner = g.querySelector('.a-in');
    [gap, halo, out].forEach((p) => p.setAttribute('d', s.d));
    if (s.type === 'tri') {
      gap.setAttribute('stroke-width', f2(t * 0.42)); halo.setAttribute('stroke-width', f2(t * 1.1));
      out.setAttribute('stroke-width', f2(it.kind === 'routine' ? t * 0.24 : t * 0.16));
      out.style.stroke = it.kind === 'routine' ? 'var(--arc-routine)' : 'var(--arc-task)';
    } else {
      gap.setAttribute('stroke-width', f2(s.w + t * 0.42)); halo.setAttribute('stroke-width', f2(s.w + t * 1.15));
      out.setAttribute('stroke-width', f2(s.w));
      if (inner) {
        const iw = s.w - t * 0.5;
        inner.setAttribute('d', s.d); inner.setAttribute('stroke-width', f2(Math.max(iw, 0)));
        inner.style.display = iw > t * 0.14 ? '' : 'none';
      }
    }
    return s;
  }

  // the whole circle around (0, 0): night tint, horizon, track, sun or moon at now, arcs
  function dialBody(uid, r, m, dark, items, opts = {}) {
    const t = r * TH, nowA = ang(m), [nx, ny] = pt(r, nowA), S = r * 0.98;
    const img = dark ? ASSETS.moon : ASSETS.sun;
    const lanes = opts.lanes ? opts.lanes.map((lr, i) => `<circle class="d-lane" data-lane="${i + 1}" r="${f2(lr)}" style="opacity:0"/>`).join('') : '';
    return `<defs>
        <linearGradient id="nf-${uid}" x1="0" y1="0" x2="0" y2="${f2(r)}" gradientUnits="userSpaceOnUse"><stop offset="0" class="g-night-0"/><stop offset="1" class="g-night-1"/></linearGradient>
        <linearGradient id="nt-${uid}" x1="0" y1="0" x2="0" y2="${f2(r)}" gradientUnits="userSpaceOnUse"><stop offset="0" class="g-trk-0"/><stop offset="1" class="g-trk-1"/></linearGradient>
        <radialGradient id="gl-${uid}"><stop offset="0" class="g-glow-0"/><stop offset="1" class="g-glow-1"/></radialGradient>
      </defs>
      <circle cx="${f2(nx)}" cy="${f2(ny)}" r="${f2(r * 1.25)}" fill="url(#gl-${uid})"/>
      <path class="d-night" d="M ${f2(-r)} 0 A ${f2(r)} ${f2(r)} 0 0 0 ${f2(r)} 0 Z" fill="url(#nf-${uid})" style="fill:url(#nf-${uid})"/>
      <path class="d-horizon" d="M ${f2(-r * 1.45)} 0 H ${f2(r * 1.45)}"/>
      <path class="d-trk-day" d="M ${f2(-r)} 0 A ${f2(r)} ${f2(r)} 0 0 1 ${f2(r)} 0"/>
      <path class="d-trk-night" d="M ${f2(r)} 0 A ${f2(r)} ${f2(r)} 0 0 1 ${f2(-r)} 0" stroke="url(#nt-${uid})"/>
      ${lanes}
      <image class="d-now" href="${img}" x="${f2(nx - S / 2)}" y="${f2(ny - S / 2)}" width="${f2(S)}" height="${f2(S)}" preserveAspectRatio="xMidYMid meet"/>
      <g class="d-arcs">${items.map((x) => arcMarkup(x.it)).join('')}</g>`;
  }

  // ---------- Today ----------
  function groups(m) {
    const items = data().today;
    const tl = items.filter(timed).sort((a, b) => a.at - b.at);
    const upcoming = tl.filter((i) => endOf(i) > m), earlier = tl.filter((i) => endOf(i) <= m);
    const untimed = items.filter((i) => !timed(i));
    const next = upcoming[0] || untimed[0] || earlier[earlier.length - 1] || null;
    const drop = (list) => list.filter((i) => i !== next);
    return { next, later: drop(upcoming), untimed: drop(untimed), earlier: drop(earlier) };
  }
  function bigCard(it) {
    return `<article class="dl-glass t-card t-card-big" data-card="${it.id}">
      <div class="t-row"><span class="dl-chip">${chipIcon(it)}${esc(timeText(it))}</span><span class="dl-cap">${esc(capText(it))}</span></div>
      <p class="dl-label">${esc(it.name)}</p>
      <h2 class="dl-action">${esc(it.action)}</h2>
      <button type="button" class="dl-btn dl-btn-ink t-start">${I.play}Start</button>
    </article>`;
  }
  function smallCard(it) {
    return `<article class="dl-glass t-card t-card-small" data-card="${it.id}">
      <div class="t-small-main">
        <div class="t-row t-row-start"><span class="dl-chip dl-chip-s">${chipIcon(it)}${esc(timeText(it))}</span><span class="dl-cap">${esc(capText(it))}</span></div>
        <p class="dl-label">${esc(it.name)}</p>
        <p class="dl-action-sm">${esc(it.action)}</p>
      </div>
      <button type="button" class="dl-btn dl-btn-glass t-start-s">Start</button>
    </article>`;
  }
  const section = (title, list) => (list.length ? `<p class="dl-section">${title}</p>${list.map(smallCard).join('')}` : '');
  function detailCard(it) {
    return `<article class="dl-glass dv-card" aria-live="polite">
      <div class="t-row"><span class="dl-chip">${chipIcon(it)}${esc(timeText(it))}</span><span class="dl-cap">${esc(capText(it))}</span></div>
      <p class="dl-label">${esc(it.name)}</p>
      <h3 class="dl-action-sm">${esc(it.action)}</h3>
      <button type="button" class="dl-btn dl-btn-ink">${I.play}Start</button>
    </article>`;
  }
  const HINT = '<p class="dl-cap dv-hint">Tap an arc or a task to see it.</p>';

  // the expand badge sits off the circle's lower right, or lower left while the sun or moon is there
  function badgeStyle(nowA) {
    const d = Math.abs(((nowA - 135) % 360 + 540) % 360 - 180);
    const a = (d < 38 ? 225 : 135) * RAD, rr = 53;      // just outside the ring, in % of the dial box
    return `left:${f1(50 + rr * Math.sin(a))}%;top:${f1(50 - rr * Math.cos(a))}%`;
  }
  function todayScreen(ph, dark) {
    const m = nowMin(), uid = ph.dataset.uid, d = data();
    const g = groups(m);
    const nTimed = d.today.filter(timed).length, nUntimed = d.today.length - nTimed;
    const compact = assignLanes(d.today, 128, 128 * TH);
    const sel = ph.dataset.sel && byId(ph.dataset.sel);
    const untimedChips = d.today.filter((i) => !timed(i)).map((it) => `<button type="button" class="dv-chip" data-pick="${it.id}" aria-pressed="false" aria-label="${esc(spoken(it))}">${chipIcon(it)}<span>${esc(it.name)}${it.cue ? ` <small>${esc(it.cue)}</small>` : ''}</span></button>`).join('');
    return `<div class="c-daylight v3 scr-today${dark ? ' dl-dark' : ''}">
      <div class="t-scroll">
        <header class="t-head"><p class="dl-date">${dateLabel()}</p><h1 class="dl-title">Today</h1></header>
        <div class="t-dial">
          <button type="button" class="dial" data-act="open" aria-label="Your day: ${nTimed} at a set time, ${nUntimed} without one. Now ${hm(m)}. Open the day view.">
            <svg viewBox="-150 -150 300 300" aria-hidden="true"><circle class="d-focus" r="146"/>${dialBody(`${uid}c`, 128, m, dark, drawOrder(compact))}</svg>
            <span class="dial-badge" style="${badgeStyle(ang(m))}">${I.expand}</span>
          </button>
        </div>
        ${g.next ? bigCard(g.next) : ''}
        ${section('Later today', g.later)}${section('No set time', g.untimed)}${section('Earlier today', g.earlier)}
      </div>
      ${tabbar('today')}
      <div class="dv" role="dialog" aria-modal="true" aria-label="Your day" aria-hidden="true">
        <div class="dv-bg"></div>
        <div class="dv-scroll">
          <header class="dv-head"><div><p class="dl-date">${dateLabel()}</p><h2 class="dv-title">Your day</h2></div>
            <button type="button" class="dl-btn dl-btn-glass dv-close" data-act="close">${I.close}Close</button></header>
          <div class="dv-stage"><svg class="dv-svg" role="group" aria-label="Sessions at a set time"></svg></div>
          ${nUntimed ? `<section class="dv-untimed" aria-label="No set time"><p class="dl-section">No set time</p><div class="dv-chips">${untimedChips}</div></section>` : ''}
          <div class="dv-slot">${sel ? detailCard(sel) : HINT}</div>
        </div>
      </div>
    </div>`;
  }

  function paintCompact(ph) {
    ph.querySelectorAll('.dial .arc').forEach((g) => paintArc(g, byId(g.dataset.id), 128, 128 * TH, 0));
  }
  // once a minute: move the sun or moon (and its glow) along the track; re-render only when the task order changes
  const signature = (m) => { const g = groups(m); return [g.next && g.next.id, ...g.later.map((i) => i.id), '|', ...g.earlier.map((i) => i.id)].join(','); };
  function moveNow(ph) {
    const m = nowMin(), a = ang(m);
    if (signature(m) !== ph._sig) { render(ph); return; }
    ph.querySelectorAll('.dial > svg, .dv-svg').forEach((svg) => {
      const img = svg.querySelector('.d-now'), glow = img && img.parentNode.querySelector('circle[fill^="url(#gl"]');
      if (!img) return;
      const r = svg.classList.contains('dv-svg') ? ph._day.R0 : 128, S = r * 0.98, [x, y] = pt(r, a);
      img.setAttribute('x', f2(x - S / 2)); img.setAttribute('y', f2(y - S / 2));
      if (glow) { glow.setAttribute('cx', f2(x)); glow.setAttribute('cy', f2(y)); }
    });
    const dial = ph.querySelector('.dial'), badge = ph.querySelector('.dial-badge');
    if (dial) dial.setAttribute('aria-label', dial.getAttribute('aria-label').replace(/Now \d\d:\d\d/, `Now ${hm(m)}`));
    if (badge) badge.setAttribute('style', badgeStyle(a));
  }

  /* Fit the circle: the next-action card and its Start button must sit above the tab bar without
     scrolling. The circle gives up decorative space first (smaller phones, larger text), down to a floor. */
  function fitDial(ph) {
    const card = ph.querySelector('.t-card-big'), tab = ph.querySelector('.dl-tabbar');
    if (!card) return;
    const D0 = 262, MIN = 104;
    const limit = tab.offsetTop - 10;
    const over = card.offsetTop + card.offsetHeight - limit;
    const D = Math.round(Math.max(MIN, Math.min(D0, D0 - over)));
    ph.style.setProperty('--dial', `${D}px`);
  }

  // ---------- the day view: build, then animate between the Today circle and the full layout ----------
  function buildDay(ph) {
    const stage = ph.querySelector('.dv-stage'), svg = ph.querySelector('.dv-svg');
    stage.style.height = '';
    const m = nowMin(), dark = ph.dataset.theme === 'dark', items = data().today;
    const W = stage.offsetWidth, H = Math.max(stage.offsetHeight, 250);
    stage.style.height = `${H}px`;                       // fixed, so a detail card never moves the circle
    const pw = ph.querySelector('.c-daylight').offsetWidth;
    // lanes need room outside the base track; size the base radius so the outermost lane fits
    const probe = assignLanes(items, 140, 140 * TH);
    const nl = Math.max(1, ...probe.map((x) => x.lane + 1));
    const maxR = Math.min(pw / 2 - 12, H / 2 - 6);
    const R0 = Math.min(150, (maxR - 2) / (1 + TH * LANE * (nl - 1) + TH * 0.6));
    const t = R0 * TH, step = t * LANE;
    const list = assignLanes(items, R0, t).map((x) => ({ ...x, r: R0 + x.lane * step }));
    const order = drawOrder(list);
    const laneR = Array.from({ length: nl - 1 }, (_, i) => R0 + (i + 1) * step);
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<g class="dv-dial">${dialBody(`${ph.dataset.uid}x`, R0, m, dark, order, { lanes: laneR })}</g>`;
    const els = {};
    svg.querySelectorAll('.arc').forEach((g) => { els[g.dataset.id] = g; });
    order.forEach((x) => {
      const g = els[x.it.id];
      g.setAttribute('role', 'button'); g.setAttribute('tabindex', '-1'); g.setAttribute('aria-pressed', 'false');
      g.setAttribute('aria-label', spoken(x.it));
      x.g = g;
    });
    ph._day = { cx: W / 2, cy: H / 2, R0, t, step, list, order, nl, laneEls: [...svg.querySelectorAll('.d-lane')], dial: svg.querySelector('.dv-dial') };
    pose(ph, { k: 1, x: W / 2, y: H / 2, off: () => 0, sep: () => 1, lanes: () => 1 });
    hits(ph);
  }
  // hit areas: at least 44 pt along the track, and as deep as the neighbouring lanes allow
  function hits(ph) {
    const D = ph._day, minLen = 44;
    D.list.forEach((x) => {
      const s = shape(x.it, x.r, D.t, 0);
      const span = x.it.min ? x.it.min / 4 : s.foot / x.r / RAD;
      const mid = x.it.min ? x.a0 + span / 2 : x.a0 + span / 2;
      const hs = Math.max(span, minLen / x.r / RAD);
      const near = (lane) => D.list.some((y) => y !== x && y.lane === lane && y.a0 < x.a0 + hs && x.a0 - hs < y.a1);
      const hin = x.lane === 0 ? 16 : (near(x.lane - 1) ? D.step / 2 : 16);
      const hout = near(x.lane + 1) ? D.step / 2 : 18;
      x.g.querySelector('.a-hit').setAttribute('d', sectorD(x.r - hin, x.r + hout, mid - hs / 2, mid + hs / 2));
    });
  }
  function pose(ph, p) {
    const D = ph._day;
    D.dial.setAttribute('transform', `translate(${f2(p.x)} ${f2(p.y)}) scale(${p.k.toFixed(4)})`);
    D.list.forEach((x, i) => {
      x.cur = D.R0 + x.lane * D.step * p.sep(x, i);
      paintArc(x.g, x.it, x.cur, D.t, p.off(x, i));
      if (p.op) x.g.style.opacity = p.op(x, i).toFixed(3); else x.g.style.removeProperty('opacity');
    });
    D.laneEls.forEach((el, i) => { el.style.opacity = String(p.lanes(i + 1)); });
    D.pose = p;
  }
  // where the Today circle is right now, in the day view's coordinates
  function compactPose(ph) {
    const sc = ph.querySelector('.t-scroll'), dial = ph.querySelector('.dial'), wrap = dial.parentElement;
    const stage = ph.querySelector('.dv-stage'), dvs = ph.querySelector('.dv-scroll');
    const Dpx = dial.offsetWidth;
    const cx = wrap.offsetLeft + dial.offsetLeft + Dpx / 2, cy = wrap.offsetTop - sc.scrollTop + Dpx / 2;
    const sx = stage.offsetLeft, sy = stage.offsetTop - dvs.scrollTop;
    return { x: cx - sx, y: cy - sy, k: (Dpx * 128 / 300) / ph._day.R0 };
  }
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeGrow = (p) => 1 - Math.pow(1 - p, 4);
  const SWEEP = 26;                                         // degrees: the brief clockwise sweep before each arc settles

  function run(ph, dur, frame, done) {
    cancelAnimationFrame(ph._raf);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(now - t0, dur);
      frame(t);
      if (t < dur) ph._raf = requestAnimationFrame(step); else { ph._raf = 0; done(); }
    };
    ph._raf = requestAnimationFrame(step);
  }
  function setOpenAttrs(ph, open) {
    const dial = ph.querySelector('.dial');
    dial.setAttribute('aria-expanded', String(open));
    ph.querySelector('.dv').setAttribute('aria-hidden', String(!open));
    ph.querySelectorAll('.arc').forEach((g) => { if (g.closest('.dv-svg')) g.setAttribute('tabindex', open ? '0' : '-1'); });
  }
  /* Open: A) the circle grows from its place on Today into the centred day view while the arcs
     wind back a little; B) they sweep clockwise together; C) each eases into its scheduled angle;
     D) only the arcs that overlap step outward onto concentric lanes, keeping their angles.
     The horizon and the sun or moon never rotate. Reduced motion jumps to the final layout. */
  function openDay(ph) {
    if (ph.classList.contains('is-open')) return;
    const D = ph._day, from = compactPose(ph), svg = ph.querySelector('.dv-svg');
    ph._scroll = ph.querySelector('.t-scroll').scrollTop;
    ph.classList.add('is-open');
    svg.classList.remove('is-ready');
    setOpenAttrs(ph, true);
    const finish = () => {
      D.list.forEach((x) => x.g.style.removeProperty('opacity'));
      svg.classList.add('is-ready');
      ph.querySelector('.dv-close').focus({ preventScroll: true });
    };
    if (reduced()) {
      ph.classList.add('dv-on');
      pose(ph, { k: 1, x: D.cx, y: D.cy, off: () => 0, sep: () => 1, lanes: () => 1 });
      finish();
      return;
    }
    const n = D.order.length, stag = Math.min(22, 110 / Math.max(1, n - 1));
    const rank = new Map(D.list.slice().sort((a, b) => a.a0 - b.a0).map((x, i) => [x, i]));
    pose(ph, { ...from, off: () => 0, sep: () => 0, lanes: () => 0 });
    requestAnimationFrame(() => ph.classList.add('dv-on'));
    run(ph, 860, (t) => {
      const g = easeGrow(clamp01(t / 400));
      const wind = easeInOut(clamp01(t / 250));
      pose(ph, {
        k: lerp(from.k, 1, g), x: lerp(from.x, D.cx, g), y: lerp(from.y, D.cy, g),
        off: (x) => -SWEEP * wind * (1 - easeOut(clamp01((t - 210 - rank.get(x) * stag) / 380))),
        op: (x) => (t >= 860 ? 1 : 1 - 0.45 * wind * (1 - clamp01((t - 210 - rank.get(x) * stag) / 220))),
        sep: (x) => easeOut(clamp01((t - 560 - (x.lane - 1) * 50) / 240)),
        lanes: (l) => easeOut(clamp01((t - 560 - (l - 1) * 50) / 240)),
      });
    }, finish);
  }
  // Close: lanes fold back onto the track, then the circle shrinks back to its place on Today
  function closeDay(ph) {
    if (!ph.classList.contains('is-open')) return;
    const D = ph._day, svg = ph.querySelector('.dv-svg');
    svg.classList.remove('is-ready');
    ph.dataset.sel = '';
    paintSelection(ph);
    const sc = ph.querySelector('.t-scroll');
    if (ph._scroll != null) sc.scrollTop = ph._scroll;     // Today keeps its scroll position
    const done = () => {
      ph.classList.remove('is-open');
      setOpenAttrs(ph, false);
      pose(ph, { k: 1, x: D.cx, y: D.cy, off: () => 0, sep: () => 1, lanes: () => 1 });
      ph.querySelector('.dial').focus({ preventScroll: true });
    };
    ph.classList.remove('dv-on');
    if (reduced()) { setTimeout(done, 130); return; }
    const to = compactPose(ph), cur = D.pose || { k: 1, x: D.cx, y: D.cy };
    const start = { k: cur.k, x: cur.x, y: cur.y };
    const sep0 = new Map(D.list.map((x) => [x, x.lane ? (x.cur - D.R0) / (x.lane * D.step) : 0]));
    run(ph, 440, (t) => {
      const fold = easeOut(clamp01(t / 180)), g = easeInOut(clamp01((t - 110) / 330));
      pose(ph, {
        k: lerp(start.k, to.k, g), x: lerp(start.x, to.x, g), y: lerp(start.y, to.y, g),
        off: () => 0, sep: (x) => sep0.get(x) * (1 - fold), lanes: () => 1 - fold,
      });
    }, done);
  }
  function paintSelection(ph) {
    const id = ph.dataset.sel || '';
    const svg = ph.querySelector('.dv-svg');
    if (!svg) return;
    svg.classList.toggle('has-sel', !!id);
    svg.querySelectorAll('.arc').forEach((g) => g.setAttribute('aria-pressed', String(g.dataset.id === id)));
    ph.querySelectorAll('.dv-chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pick === id)));
    const it = id && byId(id);
    ph.querySelector('.dv-slot').innerHTML = it ? detailCard(it) : HINT;
  }
  function select(ph, id) {
    ph.dataset.sel = ph.dataset.sel === id ? '' : id;
    paintSelection(ph);
  }

  // ---------- Create a task ----------
  function miniCircle(it, size = 44) {
    const c = size / 2, r = size * 0.41, a = ang(it.at);
    const Q = (rr, aa) => { const [x, y] = pt(rr, aa); return `${f2(x + c)} ${f2(y + c)}`; };
    const span = it.min ? it.min / 4 : 0;
    const mark = span * RAD * r > 3
      ? `<path d="M ${Q(r, a)} A ${f2(r)} ${f2(r)} 0 0 1 ${Q(r, a + span)}" stroke="var(--arc-task)" stroke-width="${f1(size * 0.1)}" stroke-linecap="round"/>`
      : `<circle cx="${f2(pt(r, a)[0] + c)}" cy="${f2(pt(r, a)[1] + c)}" r="${f1(size * 0.085)}" fill="var(--arc-task)"/>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" aria-hidden="true"><path d="M ${f2(c - r)} ${c} A ${f2(r)} ${f2(r)} 0 0 0 ${f2(c + r)} ${c} Z" style="fill: var(--night); fill-opacity: var(--night-a)"/><circle cx="${c}" cy="${c}" r="${f2(r)}" stroke="var(--trk-day)" stroke-width="1.6"/><path d="M 0 ${c} H ${size}" stroke="var(--horizon)"/>${mark}</svg>`;
  }
  function setupScreen(ph, dark) {
    const it = focusTask(), uid = ph.dataset.uid, mode = ph.dataset.mode || 'time';
    const seg = [['now', 'Now'], ['time', 'At a time'], ['after', 'After…']]
      .map(([k, l]) => `<button type="button" data-act="mode" data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join('');
    const cue = {
      now: `<div class="dl-row su-cue"><span class="su-cue-ic">${I.play}</span><span class="su-cue-text"><span class="su-cue-t">Right away</span><span class="dl-cap">The session starts when you tap Start session</span></span></div>`,
      time: `<button type="button" class="dl-row su-cue">${miniCircle(it)}<span class="su-cue-text"><span class="su-cue-t">Today</span><span class="dl-cap">At a set time · ${it.min} min session</span></span><span class="su-time">${hm(it.at)}</span>${I.chev}</button>`,
      after: `<button type="button" class="dl-row su-cue"><span class="su-cue-ic"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" class="ic-routine" stroke-width="2"/></svg></span><span class="su-cue-text"><span class="su-cue-t">After dinner</span><span class="dl-cap">No clock time; it waits for the cue</span></span>${I.chev}</button>`,
    }[mode];
    const actions = mode === 'now'
      ? `<button type="button" class="dl-btn dl-btn-ink">${I.play}Start session</button>`
      : `<button type="button" class="dl-btn dl-btn-glass">${I.play}Start now</button><button type="button" class="dl-btn dl-btn-ink">Save task</button>`;
    return `<div class="c-daylight v3 scr-setup${dark ? ' dl-dark' : ''}" style="background: var(--sky)">
      <div class="su-dim"></div><div class="su-behind"></div>
      <section class="su-sheet" aria-label="New task">
        <span class="su-grab"></span>
        <header class="su-head"><button type="button" class="dl-btn dl-btn-text">Cancel</button><p>New task</p><span></span></header>
        <div class="su-body">
          <div class="su-group su-field"><label class="dl-label" for="t-${uid}">Task</label><textarea class="su-name" id="t-${uid}" rows="${it.name.length > 30 ? 2 : 1}" readonly>${esc(it.name)}</textarea></div>
          <div class="su-group su-field"><div class="su-labelrow"><label class="dl-label" for="s-${uid}">First step</label><span class="dl-cap">Small enough to start now</span></div>
            <textarea id="s-${uid}" rows="${it.action.length > 52 ? 3 : 2}" readonly>${esc(it.action)}</textarea></div>
          <div class="su-group su-when"><p class="dl-label">When to start</p><div class="dl-seg" role="group" aria-label="When to start">${seg}</div>${cue}</div>
          <div class="su-options"><p class="dl-section">Options</p><div class="su-opt-group">
            <div class="dl-row su-opt"><span class="su-opt-t">Reminder<span class="dl-cap">Optional</span></span><button type="button" class="dl-switch" role="switch" aria-checked="false" aria-label="Reminder"></button></div>
            <button type="button" class="dl-row su-opt"><span class="su-opt-t">Session<span class="dl-cap">${it.min} min · Countdown · 3 apps blocked</span></span>${I.chev}</button>
          </div></div>
        </div>
        <div class="su-actions ${mode === 'now' ? 'one' : 'two'}">${actions}</div>
      </section>
    </div>`;
  }

  // ---------- Plans ----------
  function plansScreen(ph, dark) {
    const d = data();
    const tasks = d.today.filter((i) => i.kind === 'task'), routines = d.today.filter((i) => i.kind === 'routine');
    const dashed = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" class="ic-dash" stroke-width="1.5" stroke-dasharray="2 2.6"/></svg>';
    const icon = (it) => (timed(it) ? miniCircle(it, 28) : dashed);
    const ready = (it) => `<article class="pl-task"><span class="pl-ic">${icon(it)}</span>
      <span class="pl-top"><span class="dl-label">${esc(it.name)}</span><span class="dl-cap pl-state pl-state-ready">Next step ready</span></span>
      <span class="dl-action-sm pl-action">${esc(it.action)}</span>
      <span class="pl-btns"><button type="button" class="dl-btn dl-btn-ink">${I.play.replace('width="16" height="16"', 'width="14" height="14"')}Resume</button><span class="dl-cap">${esc(timed(it) ? `Today ${hm(it.at)}` : 'No set time')}</span><button type="button" class="dl-btn dl-btn-text">Edit</button></span></article>`;
    const open = (name) => `<article class="pl-task"><span class="pl-ic">${dashed}</span>
      <span class="pl-top"><span class="dl-label">${esc(name)}</span><span class="dl-cap pl-state" style="font-weight: 600;">Not scheduled yet</span></span>
      <span class="dl-body">Not on your day yet. It waits here, no pressure.</span>
      <span class="pl-btns"><button type="button" class="dl-btn dl-btn-glass" style="padding: 0 16px;">Plan a first step</button><span style="flex: 1;"></span><button type="button" class="dl-btn dl-btn-text">Edit</button></span></article>`;
    const when = (it) => (timed(it) ? (it.min ? `${hm(it.at)} · ${it.min} min` : `from ${hm(it.at)} · no set length`) : `${(it.cue || 'no set time').toLowerCase()} · ${it.min} min`);
    const rt = (it) => `<article class="dl-row pl-routine"><span class="pl-ic" style="grid-row: auto;">${I.routine}</span>
      <span class="pl-routine-t"><b>${esc(it.name)}</b><span class="dl-cap">${esc(when(it))}</span></span>
      <button type="button" class="dl-btn dl-btn-text" style="height: 44px; font-size: 15px;">Edit</button></article>`;
    const nTasks = tasks.length + d.unscheduled.length;
    return `<div class="c-daylight v3 scr-plans${dark ? ' dl-dark' : ''}"><div class="scroll"><div class="pl-wrap">
      <header class="pl-head"><p class="dl-date">${nTasks} tasks · ${routines.length} routine${routines.length === 1 ? '' : 's'}</p><h1 class="dl-title">Plans</h1></header>
      <p class="dl-section">Tasks</p>
      <section class="dl-glass pl-group">${tasks.map(ready).join('')}${d.unscheduled.map(open).join('')}</section>
      <p class="dl-section">Routines</p>
      <section class="dl-glass pl-group">${routines.map(rt).join('')}<button type="button" class="dl-row pl-new"><span style="width: 40px; display: flex; justify-content: center;">${I.plus}</span><span style="font-size: 16px; font-weight: 600;">New routine</span></button></section>
    </div></div>${tabbar('plans')}</div>`;
  }

  // ---------- Active session ----------
  function sessionScreen(ph, dark) {
    const it = focusTask(), uid = ph.dataset.uid;
    const a = 0.252 * 2 * Math.PI, ex = 130 + 112 * Math.sin(a), ey = 130 - 112 * Math.cos(a);
    return `<div class="c-daylight v3 scr-session${dark ? ' dl-dark dl-deep' : ' dl-dusk'}"><div class="se-wrap">
      <div class="se-top"><span class="dl-pill-dusk dl-glass-dark se-name">${esc(it.name)}</span><span class="dl-pill-dusk dl-glass-dark">${I.shield}Blocking 3 apps</span></div>
      <h1 class="se-action">${esc(it.action)}</h1>
      <div class="se-mid"><div class="se-ring">
        <div class="se-disc"></div>
        <svg viewBox="0 0 260 260" fill="none" role="img" aria-label="25.2 percent of the session elapsed, 74.8 percent remaining">
          <defs><linearGradient id="ring-${uid}" x1="130" y1="18" x2="248" y2="136" gradientUnits="userSpaceOnUse"><stop offset="0" class="r-a"/><stop offset="1" class="r-b"/></linearGradient></defs>
          <circle cx="130" cy="130" r="112" stroke="var(--ring-track)" stroke-width="10"/>
          <circle cx="130" cy="130" r="112" pathLength="100" stroke-dasharray="25.2 100" stroke="url(#ring-${uid})" stroke-width="10" stroke-linecap="round" transform="rotate(-90 130 130)"/>
          <circle cx="${f2(ex)}" cy="${f2(ey)}" r="16" fill="var(--ring-glow)"/><circle cx="${f2(ex)}" cy="${f2(ey)}" r="7" fill="#FFFFFF"/>
        </svg>
        <div class="se-time"><p class="dl-timer" aria-label="18 minutes 42 seconds remaining">18:42</p><p class="dl-dusk-label">remaining of ${it.min} min</p></div>
      </div></div>
      <div class="se-controls">
        <button type="button" class="dl-btn dl-glass-dark se-stuck">I’m feeling stuck</button>
        <div class="se-row"><button type="button" class="dl-btn dl-glass-dark">${I.stop}End</button><button type="button" class="dl-btn dl-glass-dark">${I.pause}Pause</button></div>
      </div>
    </div></div>`;
  }

  // ---------- Session complete ----------
  const CUES = { tomorrow: 'Tomorrow · 16:30', dinner: 'Tomorrow · after dinner' };
  function endScreen(ph, dark) {
    const it = focusTask(), uid = ph.dataset.uid, step = ph.dataset.step || 'choose', cue = ph.dataset.cue || '';
    // the appearance picks the motif: the sun in light, the realistic moon in dark, at any hour
    const hero = dark
      ? `<div class="en-haze en-haze-moon"></div><img src="${ASSETS.moonLow}" alt="">`
      : `<div class="en-haze en-haze-sun"></div><img src="${ASSETS.sunLow}" alt="">`;
    const act = (key, icon, title, cap) => `<button type="button" class="en-act" data-act="end" data-step="${key}"><span class="en-ic">${icon}</span><span class="en-act-t"><b>${title}</b><span class="dl-cap">${cap}</span></span><span class="en-chev">${I.chev}</span></button>`;
    const done = (title, body, undo = 'choose', primary = 'Back to Today') => `<div class="en-done en-step" role="status"><span class="en-badge">${I.check(24)}</span><h2>${title}</h2><p class="dl-body">${body}</p>
      <div class="en-btns"><button type="button" class="dl-btn dl-btn-glass" data-act="end" data-step="${undo}">Undo</button><button type="button" class="dl-btn dl-btn-ink">${primary}</button></div></div>`;
    const name = esc(it.name), next = ph.dataset.next || 'Write the opening paragraph.';
    let body;
    if (step === 'choose') {
      body = `<div class="en-step"><p class="dl-section">What now?</p><div class="en-actions">
        ${act('finished', I.check(18), 'Task finished', `Mark ${name} as done`)}
        ${act('continue', I.play, 'Continue now', `Start another ${it.min} minutes`)}
        ${act('done', I.horizon, 'Done for today', 'Keep the task open')}</div></div>`;
    } else if (step === 'done') {
      const chips = ph.dataset.cues === '1'
        ? Object.entries(CUES).map(([k, l]) => `<button type="button" class="en-chip" data-act="end-cue" data-cue="${k}" aria-pressed="${cue === k}">${cue === k ? I.check(14) : ''}${l}</button>`).join('')
        : `<button type="button" class="dl-btn dl-btn-text en-addcue" data-act="end-addcue">${I.plus}Add a start time</button>`;
      const note = cue === 'tomorrow' ? 'Planned for tomorrow at 16:30. Tap again to remove the time.' : cue === 'dinner' ? 'Planned for tomorrow after dinner. Tap again to remove the cue.' : 'No time set. It waits in Plans until you choose one.';
      body = `<div class="en-step"><p class="dl-section">Done for today</p>
        <div class="en-next"><label for="n-${uid}">Next time, start with… <span class="dl-cap">Optional</span></label><input id="n-${uid}" data-next value="${esc(next)}"></div>
        <div class="en-cues">${chips}</div>
        <p class="dl-cap en-note">${note}</p>
        <div class="en-btns"><button type="button" class="dl-btn dl-btn-glass" data-act="end" data-step="notnow">Not now</button><button type="button" class="dl-btn dl-btn-ink" data-act="end" data-step="saved">Save next step</button></div></div>`;
    } else if (step === 'saved') {
      const n = esc(next.trim() || 'the next step');
      body = done('Next step saved', cue === 'tomorrow' ? `${name} is planned for tomorrow at 16:30, starting with: ${n}`
        : cue === 'dinner' ? `${name} is planned for tomorrow after dinner, starting with: ${n}` : `${name} waits in Plans, starting with: ${n} No time set.`, 'done');
    } else if (step === 'notnow') {
      body = done('Saved in Plans', `${name} stays open in Plans. No time set.`, 'done');
    } else if (step === 'finished') {
      body = done('Marked as done', `${name} moves to your finished tasks. Anything that follows on from it is a new task.`);
    } else {
      body = done(`Another ${it.min} minutes`, 'The next session starts now. The task stays open.', 'choose', 'Open session');
    }
    return `<div class="c-daylight v3 scr-end scr-end-${dark ? 'dark dl-dark' : 'light'}"><div class="en-wrap">
      <div class="en-sky"><div class="en-sky-bg"></div><div class="en-title"><h1 class="dl-title">Session complete.</h1><p>${it.min} min · ${name}</p></div></div>
      <div class="en-low"><div class="en-hero" aria-hidden="true">${hero}</div><section class="en-sheet" aria-label="What now">${body}</section></div>
    </div></div>`;
  }

  // ---------- Progress ----------
  const BARS = '<path d="M38.29 104 L38.29 31 A7 7 0 0 1 52.29 31 L52.29 104 Z"/><path d="M123.43 104 L123.43 71 A7 7 0 0 1 137.43 71 L137.43 104 Z"/><path d="M166 104 L166 31 A7 7 0 0 1 180 31 L180 104 Z"/><path d="M208.57 104 L208.57 71 A7 7 0 0 1 222.57 71 L222.57 104 Z"/><path d="M293.71 104 L293.71 31 A7 7 0 0 1 307.71 31 L307.71 104 Z"/>';
  const CUM = 'M28.00 124.00 L32.67 122.23 L37.33 120.47 L42.00 120.47 L46.67 116.93 L51.33 115.17 L56.00 115.17 L60.67 113.40 L65.33 109.87 L70.00 108.10 L74.67 106.33 L79.33 106.33 L84.00 102.80 L88.67 101.03 L93.33 99.27 L98.00 97.50 L102.67 95.73 L107.33 95.73 L112.00 95.73 L116.67 95.73 L121.33 95.73 L126.00 95.73 L130.67 95.73 L135.33 95.73 L140.00 95.73 L144.67 95.73 L149.33 95.73 L154.00 95.73 L158.67 95.73 L163.33 95.73 L168.00 92.20 L172.67 90.43 L177.33 86.90 L182.00 85.13 L186.67 83.37 L191.33 81.60 L196.00 78.07 L200.67 76.30 L205.33 72.77 L210.00 71.00 L214.67 67.47 L219.33 67.47 L224.00 65.70 L228.67 63.93 L233.33 60.40 L238.00 58.63 L242.67 55.10 L247.33 53.33 L252.00 51.57 L256.67 49.80 L261.33 48.03 L266.00 46.27 L270.67 46.27 L275.33 44.50 L280.00 40.97 L284.67 40.97 L289.33 39.20 L294.00 35.67 L298.67 35.67 L303.33 33.90 L308.00 30.37 L312.67 28.60 L317.33 28.60 L322.00 25.07';
  function chart(range, uid) {
    if (range === '7') {
      // the last seven days, ending today; sessions per day 2, 0, 1, 2, 1, 0, 2 (sample data)
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toLocaleDateString('en-GB', { weekday: 'short' }); });
      const xs = [45.29, 87.86, 130.43, 173, 215.57, 258.14, 300.71];
      return `<svg viewBox="0 0 326 124" width="326" height="124" fill="none" role="img" aria-label="Daily sessions over the last 7 days, ending today: 2, 0, 1, 2, 1, 0, 2">
        <path d="M24 24 H 322 M 24 64 H 322" stroke="var(--grid)"/><path d="M24 104 H 322" stroke="var(--base)"/>
        <text class="dl-axis" x="2" y="28">2</text><text class="dl-axis" x="2" y="68">1</text><text class="dl-axis" x="2" y="108">0</text>
        <g fill="var(--bar)">${BARS}</g>
        <circle cx="87.86" cy="104" r="3" fill="var(--zero)"/><circle cx="258.14" cy="104" r="3" fill="var(--zero)"/>
        ${days.map((d, i) => `<text class="dl-axis" x="${xs[i]}" y="121" text-anchor="middle"${i === 6 ? ' style="fill: var(--ink); font-weight: 700;"' : ''}>${i === 6 ? 'Today' : d}</text>`).join('')}
      </svg>`;
    }
    return `<svg viewBox="0 0 326 150" width="326" height="150" fill="none" role="img" aria-label="Cumulative sessions from 3 August to 4 October, rising to 56; level from 19 to 31 August, when no sessions were logged">
      <defs><linearGradient id="wash-${uid}" x1="0" y1="18" x2="0" y2="124" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--wash)" stop-opacity="0.22"/><stop offset="1" stop-color="var(--wash)" stop-opacity="0.02"/></linearGradient></defs>
      <path d="M28 18 H 322 M 28 53.33 H 322 M 28 88.67 H 322" stroke="var(--grid)"/><path d="M28 124 H 322" stroke="var(--base)"/>
      <text class="dl-axis" x="0" y="22">60</text><text class="dl-axis" x="0" y="57.3">40</text><text class="dl-axis" x="0" y="92.7">20</text><text class="dl-axis" x="0" y="128">0</text>
      <path d="${CUM} L322.00 124.00 L28.00 124.00 Z" fill="url(#wash-${uid})"/>
      <path d="${CUM}" stroke="var(--line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M107.33 84 V 80 H 163.33 V 84" stroke="var(--muted)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <text class="dl-axis" x="135.33" y="75" text-anchor="middle">None logged</text>
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
    const rt = d.today.find((i) => i.kind === 'routine' && !timed(i)) || d.today.find((i) => i.kind === 'routine');
    const a16 = ang(960), a18 = ang(1080), Q = (a, r) => pt(r, a).map((v) => v + 40);
    const [hx0, hy0] = Q(a16, 30), [hx1, hy1] = Q(a18, 30);
    return `<div class="c-daylight v3 scr-progress${dark ? ' dl-dark' : ''}"><div class="scroll"><div class="pr-wrap">
      <header class="pr-head"><h1 class="dl-title">Progress</h1><span class="dl-chip">Sample data</span></header>
      <section class="dl-glass pr-card">
        <div class="pr-rt-head"><p class="dl-label"><span>Finished tasks</span></p><span class="dl-chip pr-period">Last 7 days</span></div>
        <p class="pr-big">${fin.length} task${fin.length === 1 ? '' : 's'} finished</p>
        <ul class="pr-list">${fin.slice(0, showN).map((n) => `<li><span class="pr-check">${I.check(13)}</span><span>${esc(n)}</span></li>`).join('')}</ul>
        ${fin.length > showN ? `<button type="button" class="dl-btn dl-btn-text pr-more" data-act="showall">Show all ${fin.length}</button>` : ''}
      </section>
      <section class="dl-glass pr-card pr-sessions">
        <div class="pr-sess-top"><p><span class="dl-label">Sessions logged</span><span class="pr-stat"><b>56</b><span class="dl-cap">all time</span></span></p>
          <p class="pr-side"><span class="dl-cap"><b>8</b> last 7 days</span><span class="dl-cap"><b>6</b> previous 7 days</span></p></div>
        <div class="pr-div"></div>
        <div class="dl-seg pr-seg" role="group" aria-label="Chart range"><button type="button" data-act="range" data-range="7" aria-pressed="${range === '7'}">7 days</button><button type="button" data-act="range" data-range="all" aria-pressed="${range === 'all'}">All time</button></div>
        <div class="pr-chart-head"><p class="pr-chart-title">${range === '7' ? 'Daily sessions' : 'Total sessions'}</p><p class="dl-cap">${range === '7' ? 'Sessions per day' : 'Cumulative, 3 Aug – 4 Oct'}</p>${infoBtn('chart', uid, 'About this chart')}</div>
        ${pop('chart', uid)}
        <div class="pr-chart">${chart(range, uid)}</div>
      </section>
      <section class="dl-glass pr-card">
        <div class="pr-rt-head"><p class="dl-label">${I.routine.replace('width="20" height="20"', 'width="14" height="14"')}<span>${esc(rt.name)}</span></p><span class="dl-chip pr-period">Last 7 days</span></div>
        <div class="pr-rt-body"><div><p class="dl-action-sm">3 days recorded as done</p><p class="dl-body">1 planned day not recorded</p></div>
          <svg width="100" height="20" viewBox="0 0 100 20" role="img" aria-label="3 days recorded as done, 1 planned day not recorded"><circle class="pr-ring-on" cx="10" cy="10" r="8"/><circle class="pr-ring-on" cx="36" cy="10" r="8"/><circle class="pr-ring-on" cx="62" cy="10" r="8"/><circle class="pr-ring-off" cx="88" cy="10" r="7.2"/></svg></div>
      </section>
      <section class="dl-glass pr-card pr-pattern">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" role="img" aria-label="Most recorded starts between 16:00 and 18:00">
          <path d="M 10 40 A 30 30 0 0 0 70 40 Z" style="fill: var(--night); fill-opacity: var(--night-a)"/><circle cx="40" cy="40" r="30" stroke="var(--trk-day)" stroke-width="2"/><path d="M 4 40 H 76" stroke="var(--horizon)"/>
          <path d="M ${f1(hx0)} ${f1(hy0)} A 30 30 0 0 1 ${f1(hx1)} ${f1(hy1)}" stroke="var(--arc-task)" stroke-width="6" stroke-linecap="round"/>
        </svg>
        <div><div class="pr-pattern-top"><p class="dl-label">Most recorded starts</p>${infoBtn('pattern', uid, 'About this pattern')}</div>
          <p class="dl-stat" style="font-size: 22px; line-height: 26px;">16:00–18:00</p><p class="dl-cap">6 of the last 8 sessions</p>${pop('pattern', uid)}</div>
      </section>
    </div></div>${tabbar('progress')}</div>`;
  }

  const SCREENS = { today: todayScreen, setup: setupScreen, plans: plansScreen, session: sessionScreen, end: endScreen, progress: progressScreen };

  // ---------- rendering and interaction ----------
  function render(ph) {
    cancelAnimationFrame(ph._raf); ph._raf = 0;
    const old = ph.querySelector('.scroll, .t-scroll');
    const top = old ? old.scrollTop : (ph.dataset.scroll ? Number(ph.dataset.scroll) : 0);
    const wasOpen = ph.classList.contains('is-open');
    ph.innerHTML = SCREENS[ph.dataset.screen](ph, ph.dataset.theme === 'dark');
    const sc = ph.querySelector('.scroll, .t-scroll');
    if (ph.dataset.screen === 'today') {
      ph.style.removeProperty('--dial');
      paintCompact(ph);
      fitDial(ph);
      buildDay(ph);
      ph._sig = signature(nowMin());
      if (sc) sc.scrollTop = wasOpen && ph._scroll != null ? ph._scroll : top;
      if (wasOpen) {
        ph.classList.add('dv-on');
        setOpenAttrs(ph, true);
        ph.querySelector('.dv-svg').classList.add('is-ready');
      }
      paintSelection(ph);
    } else if (sc) sc.scrollTop = top;
  }

  const ACTIONS = {
    mode: (ph, el) => { ph.dataset.mode = el.dataset.mode; render(ph); },
    end: (ph, el) => {
      const input = ph.querySelector('[data-next]');
      if (input) ph.dataset.next = input.value;
      ph.dataset.step = el.dataset.step;
      if (el.dataset.step === 'choose') { ph.dataset.cue = ''; ph.dataset.cues = ''; ph.dataset.next = ''; }
      render(ph);
    },
    'end-addcue': (ph) => { const input = ph.querySelector('[data-next]'); if (input) ph.dataset.next = input.value; ph.dataset.cues = '1'; render(ph); },
    'end-cue': (ph, el) => { const input = ph.querySelector('[data-next]'); if (input) ph.dataset.next = input.value; ph.dataset.cue = ph.dataset.cue === el.dataset.cue ? '' : el.dataset.cue; render(ph); },
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
    if (tb) { setOption(tb.dataset.set, tb.dataset.value); return; }
    const ph = t.closest('.phone');
    if (!ph) return;
    const act = t.closest('[data-act]');
    if (ph.dataset.screen === 'today') {
      if (!ph.classList.contains('is-open')) { if (act && act.dataset.act === 'open') openDay(ph); return; }
      if (ph._raf) return;                                  // let the opening finish
      if (act && act.dataset.act === 'close') { closeDay(ph); return; }
      const arc = t.closest('.dv-svg .arc'), chip = t.closest('[data-pick]');
      if (arc) { select(ph, arc.dataset.id); return; }
      if (chip) { select(ph, chip.dataset.pick); return; }
      if (!t.closest('.dv-card') && ph.dataset.sel) { ph.dataset.sel = ''; paintSelection(ph); }
      return;
    }
    if (act && ACTIONS[act.dataset.act]) ACTIONS[act.dataset.act](ph, act, e);
  });
  document.addEventListener('keydown', (e) => {
    const ph = e.target.closest && e.target.closest('.phone');
    if (e.key === 'Escape') {
      const open = ph && ph.classList.contains('is-open') ? ph : document.querySelector('.phone.is-open:not([data-open])');
      if (open && !open._raf) { e.preventDefault(); closeDay(open); }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && ph && e.target.classList && e.target.classList.contains('arc')) {
      e.preventDefault(); select(ph, e.target.dataset.id);
    }
  });

  // ---------- review options (the toolbar above the phones) ----------
  function setOption(key, value) {
    state[key] = value;
    const body = document.body;
    if (key === 'text') body.classList.toggle('tx-l', value === 'large');
    if (key === 'size') body.classList.toggle('size-se', value === 'se');
    if (key === 'motion') body.classList.toggle('motion-reduced', value === 'reduced');
    paintToolbar();
    if (key === 'motion') return;
    document.querySelectorAll('.phone').forEach((ph) => {
      if (key === 'data') { ph.dataset.sel = ''; ph.dataset.all = ''; }
      render(ph);
    });
  }
  function paintToolbar() {
    document.querySelectorAll('[data-set]').forEach((b) => b.setAttribute('aria-pressed', String((state[b.dataset.set] || '') === b.dataset.value)));
    const live = document.querySelector('.live-time');
    if (live) { const d = new Date(); live.textContent = hm(d.getHours() * 60 + d.getMinutes()); }
  }
  // the sun or moon follows the device clock, once a minute
  function tick() {
    const d = new Date();
    setTimeout(() => {
      paintToolbar();
      if (state.clock === 'live') document.querySelectorAll('.phone[data-screen="today"]').forEach((ph) => { if (!ph._raf) moveNow(ph); });
      tick();
    }, (60 - d.getSeconds()) * 1000 - d.getMilliseconds() + 50);
  }

  function boot() {
    let uid = 0;
    state.text = 'standard'; state.size = 'standard';
    document.querySelectorAll('.phone').forEach((ph) => {
      ph.dataset.uid = `p${(uid += 1)}`;
      if (ph.dataset.open === '1') ph.classList.add('is-open', 'dv-on', 'no-anim');
      render(ph);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.phone.no-anim').forEach((ph) => ph.classList.remove('no-anim'))));
    paintToolbar();
    tick();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
  window.IntentV3 = { state, render, openDay, closeDay, setOption };   // used by the automated checks only
})();
