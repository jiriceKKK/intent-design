# Intent — five visual concepts

Five independent visual directions for **Intent**, an iPhone app that helps people start meaningful work, stay with it and come back after interruptions. Every concept shows the same six screens with the same sample content, so they can be compared fairly:

1. Today · 2. Set up a task · 3. Plans · 4. Active session · 5. Session end · 6. Progress
(plus a seventh frame: Progress scrolled down, with the chart switched to "All time")

**Live canvas:** https://claude.ai/artifact/XbazTkHX2r56kDk6y1UcHg (private until shared from the page's Share menu).
Page *Five concepts*: one row per concept (plus Daylight's dark appearance as row 4b), one column per screen, all at 390 × 844. Page *Compare two*: pick any two concepts and a screen and see them side by side at the same scale (press Play on that board).

## The concepts

| | Concept | Central idea | Main weakness / tradeoff |
|---|---|---|---|
| 1 | **Thread** · cream, indigo, restrained yellow · Figtree | Work is one continuous thread. A soft line links today's actions, becomes the hanging thread of the session timer and records progress as a line that rests level in gaps instead of breaking. Beads are tasks and sessions; loops are routines. | The line needs a left gutter, so text columns get narrower; bead/loop meanings must be learned; long lists need a collapse rule. |
| 2 | **Threshold** · plaster, clay, plum night · Bricolage Grotesque | Every start is a small doorway, and it stays open. The arch is the one shape: the next action sits inside a dark doorway with its time in the crown and Start at the threshold; the session happens inside that room. Tasks are doorways, routines round windows. | Arches waste space and resist long or changing text; the dark hero can feel heavy or brand-like in daily use. |
| 3 | **Margin** · paper, ink, highlighter · Newsreader + IBM Plex Mono | The next sentence is the interface. An editorial page: serif headline for what to do, typed margin notes for times and labels, hairline rules instead of cards, one highlighter stroke per screen. | Little containment, so controls and states depend on precise typesetting (Dynamic Type, translation); can feel austere; word-only tabs are less glanceable. |
| 4 | **Daylight** · soft sky, glass, sun orange · Geist | Plans live in the light of your actual day. The day is the sun's circular path cut by the horizon (daylight above, evening below) with each action at its cue and a rendered sun marking now; glass panels and floating controls in the current iOS idiom; a session dims the room to dusk and ends with a sunrise. | Least ownable (closest to stock iOS); glass over gradients is demanding for contrast and performance; "after dinner" can only be placed approximately. |
| 5 | **Cairn** · limestone, sage, slate, lichen · Zen Maru Gothic | Leave a marker; it will still be there. Smooth, tactile stones: the next step rests on the largest one, the prepared next step is a marker for your future self, finished tasks stack into a small cairn. | Shaded objects add visual weight and render cost; irregular shapes are harder to keep consistent; the metaphor must never become a collection game. |

### Daylight dark (variant of 4)

Daylight's dark appearance, for when iOS is set to Dark Mode (canvas row 4b; also selectable on *Compare two*). The same circular path, cues, layout and content on a calm blue-black night sky, without stars. A rendered white moon takes the sun's place as the "now" marker and the light source, and accents change from sun orange to white moonlight and a soft violet. The moon is always full, whatever the date: a steady symbol rather than an almanac. Its place on the circle is the "now" marker, not its position in the real sky. The session goes one step darker than the planning screens, and at session end the moon rises behind the sheet.
Tradeoff: with every screen dark, the light-planning / dark-focus contrast of the light theme is gone, so the session has to go darker still to feel different; moonlight also makes finishing feel calm rather than celebratory.

### App icon

Daylight's day circle as a flat, bold symbol: one thick ring for the day (the part already gone, the rest of today in the accent colour, night in violet), the night half of the circle filled, two short marks carrying the horizon out of the ring, and the sun at "now", cut free from the ring by a small gap. In the dark icon the full moon takes the sun's place. No glows, and the backgrounds are almost flat, so the shape stays clear down to the smallest sizes. On iOS 18 and later the system switches between the two with the Home Screen's light or dark appearance; the tinted version is the grayscale source iOS colours on a tinted Home Screen. For iOS 26, the separate layers in `icon/layers/` can be put together in Icon Composer so the system can add its glass effects.

## Shared rules (all five)

- Same sample content everywhere; all numbers are labelled **sample data**.
- Session progress matches the numbers: 18:42 of 25:00 remaining → **74.8 % remaining, 25.2 % elapsed**.
- 7-day chart: Mon–Sun = 2, 0, 1, 2, 1, 0, 2 ("Daily sessions", "Sessions per day"). All-time chart: cumulative sessions from 3 Aug to 4 Oct ending at 56, level from 19 to 31 Aug where nothing was recorded ("Total sessions", "Cumulative sessions"). All chart geometry is computed in `tools/geometry.py`.
- Finished tasks lead the Progress hierarchy; session counts come second. No scores, rankings or streaks; start-time patterns are labelled as a pattern in the records, not a rule.
- Tasks and routines are told apart by shape, icon and label, never by colour alone.
- iOS draws the status bar and home indicator, so they are not painted in; every layout keeps the top 54 px and bottom 34 px clear.

## Files

- `canvas/project/` — the canvas source: one `.dc.html` board per screen, one stylesheet per concept, `canvas.json` (layout and notes). `Main.dc.html` is Thread · Today (the canvas entry board).
- `renders/` — every screen as a 780 × 1688 PNG (@2x). `renders/sheets/` — contact sheets per concept and per screen.
- `tools/shoot.sh` — renders boards to PNG with Playwright. It needs the canvas runtime (`support.js`, served by the Design artifact type and not included here): `DC_RUNTIME=/path/to/support.js ./tools/shoot.sh --all`.
- `tools/geometry.py` — sample data and exact geometry for charts and progress marks. `tools/sheet.py` — contact sheets.
- `daylight/Intent-Daylight.html` — one self-contained file with Daylight in both appearances, sun (light) and moon (dark), seven screens each; styles, images and font are embedded, so it opens offline in any browser. `daylight/Intent-Daylight.png` is the same page as an image. Rebuild both with `python3 tools/daylight_file.py daylight/Intent-Daylight.html`.
- `icon/` — the app icon at 1024 × 1024 without transparency: `Intent-icon-light.png` (default, also the App Store icon), `Intent-icon-dark.png`, `Intent-icon-tinted.png`, each with an SVG master; `Intent-icon-preview.png` shows them on light and dark Home Screens and at real pixel sizes; `layers/` holds the background, the day circle and the sun or moon as separate SVG/PNG layers. Rebuild with `node tools/icon.mjs`.
- `tools/sun.py`, `tools/moon.py` — procedural renders of the Daylight sun and the (always full) moon (`python3 tools/moon.py canvas/project` writes `moon.png` and `moon-low.png`).

## Hodnocení (česky)

**Co je ověřené a co ne.** Nic z toho nebylo testováno s lidmi. Ověřené je jen to, co jde zkontrolovat bez uživatelů: všechny obrazovky jsou vyrenderované a prošlé, grafy i ukazatele času jsou spočítané z čísel v zadání, kontrast hlavních textových barev je spočítaný (běžný text ≥ 4,5 : 1) a dotykové plochy mají aspoň 44 px. Všechno ostatní níže je můj designérský úsudek.

- **Thread** má nejblíž k vašim uvedeným preferencím a jeho metafora přímo odpovídá návratu bez viny. Riziko: linka zabírá levý okraj a delší seznamy budou potřebovat pravidlo pro sbalování.
- **Threshold** má nejsilnější a nejlépe zapamatovatelnou siluetu. Riziko: oblouky špatně snášejí dlouhý text a tmavé dveře mohou při každodenním používání působit těžce.
- **Margin** je nejklidnější a nejuniverzálnější. Riziko: skoro žádné kontejnery, takže hodně stojí na precizní sazbě; někomu může připadat strohý.
- **Daylight** nejvíc odpovídá současnému iOS. Riziko: má nejslabší vlastní identitu a sklo je náročné na kontrast i výkon.
- **Cairn** je nejhmatatelnější a nejvíc emocionální. Riziko: je vizuálně nejtěžší a jeho metafora nesmí sklouznout ke sbírání.
- **Daylight tmavý** (varianta Daylightu, ne šestý koncept) přenáší stejný systém do noci: místo slunce je tu bílý měsíc, vždy v úplňku bez ohledu na datum, na klidné modročerné obloze bez hvězd; akcenty mají barvu měsíčního světla. Riziko: když je tmavé všechno, mizí rozdíl mezi světlým plánováním a tmavým soustředěním, proto je sezení ještě o stupeň tmavší; měsíční světlo je chladnější, takže konec sezení působí spíš klidně než oslavně.

**Doporučené ověření s lidmi:** pětivteřinový test obrazovky Today („co uděláte teď?“), první klepnutí na Start, jestli lidé bez barev poznají úkol od rutiny, jestli Progress po pauze nevyvolává pocit viny a jestli jde v tmavém sezení přečíst čas a průběh; u tmavého Daylightu také, jestli lidé chápou měsíc jako značku „teď“.

**Omezení:** makety jsou statické (interaktivní je jen srovnávací tabule); nic nebylo zkoušeno na skutečném zařízení; písma jsou z Google Fonts; tmavý režim je navržený jen pro Daylight a Dynamic Type navržený není; Liquid Glass je napodobené pomocí CSS. Výběr nechávám na vás.
