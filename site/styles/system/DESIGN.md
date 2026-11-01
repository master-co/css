# Site design system: Moonstone / Obsidian

The site's interface vocabulary. Light mode is moonstone (a clean zinc pearl), dark mode is obsidian (zinc-95 glass). The character is restrained and soft: light regular type, hairline contours, small radii, ink rather than blue. The homepage may compose its own layouts but uses these tokens.

## Files

| File | Scope | Loaded |
| --- | --- | --- |
| `mixins.css` | `--ui-sheet-face`, `--ui-focus-ring`, `--ui-label-type`, `--ui-eyebrow-type`: shared declarations the component files expand with `@apply` | foundation (Master CSS definitions) |
| `tokens.css` | `--ui-*` roles: surfaces, lines, text, light, elevation, radius, rhythm, motion, tones, status, code | foundation |
| `surfaces.css` | `ui-sheet`, `ui-well`, `ui-tray`, `ui-stage`, `ui-compare`, `ui-browser`, `ui-scroll` | documents |
| `controls.css` | `ui-button`, `ui-segmented`, `ui-field`, `ui-input`, `ui-select`, `ui-range`, `ui-check`, `ui-switch`, `ui-copy`, `ui-kbd`, `ui-tooltip`, `ui-menu` | interface |
| `code.css` | `ui-code`, `ui-tabs`, `ui-inline-code`, `ui-disclosure`, `ui-prompt`, `ui-tree` | documents |
| `prose.css` | `ui-callout` and the article flow helpers | documents |
| `shell.css` | `ui-header`, `ui-sidebar`, `ui-nav-group`, `ui-nav-link`, `ui-toc`, `ui-pagehead`, `ui-pager`, `ui-dialog`, `ui-results` | interface |
| `specimens.css` | `ui-item`, `ui-badge`, `ui-label`, `ui-legend`, `ui-measure`, `ui-leader`, `ui-axes`, `ui-swatch`, `ui-palette`, `ui-spacing`, `ui-player` | imported by the components that use it |
| `data.css` | `ui-table`, `ui-metrics`/`ui-metric`, `ui-bar`, `ui-source`, `ui-params`, `ui-steps`, `ui-index`, `ui-chart`, `ui-waterfall` | imported by the components that use it |

Pages load the system in ordered asset boundaries (`site/routes.ts`), each one stylesheet:

- **foundation**: `styles/globals.css`, the only Master CSS entry (`@import '@master/css'`). Every entry joins one project graph, so a second entry delivers the union of both; keep component files out of it.
- **interface**: `styles/interface.css`, every page in the site shell.
- **documents**: `styles/documents.css`, unless a page exports `documentStyles = false` because it renders no surfaces, code or prose (the Blog index, 404, the homepage icon handoff).

Interface and documents are local stylesheets: each emits the theme variables it uses once, so add a component file to an existing boundary stylesheet rather than as another import. Bare sections (`/examples`) load the foundation and import only the system files their page renders.

The approved visual specification is the published "Master CSS Site Design System：Moonstone" artifact.

## Rules

1. **Monochrome interface.** Chrome uses ink and pearl only. Hue appears in teaching specimens (`--ui-tone-*`, always named by a legend or label) and status (`--ui-status-*`). Brand gold (`data-variant="gold"`) belongs to the homepage and the brand page, one gold focus per view.
2. **Zinc neutrals.** Every neutral is the preset's zinc: hue 265 at chroma .0005–.003. Lines and shadows carry no hue of their own (`oklch(22% .002 265 / α)` and `oklch(18% 0 none / α)` in light mode, white and black alphas in dark mode). No blue sheen.
3. **One material ladder.** canvas → tray → stage → sheet → float; a well sits below its surroundings. Never invent a surface color. Light: canvas 98.6 · tray 96 · stage 98.9 · sheet 100 · well 96.6 · code 99.6. Dark: canvas 19.4 (zinc-95) · tray 17.4 · stage 20.4 · sheet 24.2 · float 26.4 · well 16.4 · code 21.2.
4. **Legible dark edges.** Dark lines are firmer than light ones so surfaces never blur into each other: hair .075 · contour .11 · divider .13 · strong .22 · mark .32 (white alpha); light: .065 · .095 · .12 · .2 · .3.
5. **Elevation order.** sink < flat < rise-1 < rise-1h < rise-2 < rise-3 < overlay. Hover lifts 0.5px to rise-1h; press sinks to the well. Do not express state by changing hue.
6. **Small concentric radii.** 3 / 4 / 6 / 8 / 10 / 14 with a 4px tray inset: tray 14 → stage, code, table and sheet 10; menu 8 → item 4; segmented track 6 + its padding → thumb 6. Nothing rounder except pills and dots.
7. **Light regular type.** English text runs at 350 (`:root:lang(en)` lowers `--ui-weight-regular`), Han text at 400. Headings are regular (400): size and ink carry the steps. Medium (460) marks a current entry, a control label or a small title; strong (500) is for `<strong>` and short emphasis only. Captions inside components (table heads, tray titles, metric names) are small sans in sentence case. Captions *over a group or a page* — sidebar groups, footer columns, the page kicker, "On this page", the pager's Previous/Next — are eyebrows (`--ui-eyebrow-type`): 11px sans capitals at medium weight, tracked .08em, 16px line; Han text keeps 12px and .04em. Never mono.
8. **Two widths on one edge.** A documentation article starts every block on one edge. Running text — paragraphs, lists, headings, callouts, rules, disclosures — keeps the reading measure (`--docs-text`, 41rem; the 18px lead runs to 1.125× it). Steps, page tabs, the pager and framed surfaces take the wide column (`--docs-wide`, the measure plus the 252px contents rail). Framed surfaces (code, trays, previews, tables, chart figures) hang past both edges by the prose bleed (up to 2rem from 52rem, always leaving a 1rem gutter to the window) and set their own words back by the same amount (`--hang`), so file names, code, first table cells, tray titles, chart labels and figure notes keep the text's edge; document steps hang on the end side only, so a step's code ends where every surface ends. Index cards are links, not frames: they keep the column's edges. Where the rail shows (80rem up), a page with contents gives the rail the wide column's room; the article and rail centre together, so every page starts on the same x. Gutters: 20px, 40px from 52rem, then 40→80px beside the sidebar.
9. **One reading rhythm.** Body 16/28 (`--line`); paragraphs part by ¾ line, wide blocks by 1 line, h2 opens on 2 lines and closes on ½, h3 on 1½ and ⅜, h4 on 1¼ and ¼; list items by ¼. Type scale: title 38/44 −.028em · h2 26/35 −.022em · h3 20/28 −.014em · lead 18/1.65 · small 14 · caption 13 · label 12.
10. **Converged shadows.** Every layer doubles offset and blur and pulls its spread in by half the offset. No single large blur.

## Shell

The shell follows the original documentation layout, refined:

- **Header** 60px, 32px gutters. Search leads the end group as a quiet hairline pill (glass + ⌘K, 30px tall, 11px / 13px insets — the round end takes a little more), 8px before the community icons; a plain glass in a full target on a phone; the homepage's wide header leaves it out. Section links are plain words (body ink, current one in strong ink at medium weight), no pill. The version is plain text with a chevron. End icons are 18px glyphs in 36px targets that only change ink on hover.
- **Sidebar** 276px with a 32px start gutter aligned with the logo; it starts with its first group, whose caption stands level with the page kicker and the contents caption (y = header + 56px). Group captions are muted eyebrows; entries are 14px muted on one hairline guide, 32px rows; the current entry inks a short 2px bar on the guide and takes medium weight.
- **Contents rail** (252px) is a ruler: every entry hangs a short tick before its title on one left edge; the section being read draws the long tick in ink. Subsections keep the edge and step down in ink (no indent). 13px entries in 34px rows; "On this page" is a muted eyebrow on the title edge, level with the page kicker.
- **Page head** a muted eyebrow kicker, a regular-weight title (fluid 30–38px), an 18px lead (a second lead line, such as a layout's subtitle, at reading size), then 48px of space — no rule — before the reading starts.
- **Page tabs** between sibling documents (`Tabs`, `ui-segmented[data-variant="underline"]`) are words on one hairline, the current one underlined in ink — the original's tabs, not a raised segmented thumb.
- **Search trigger** (`ui-search-trigger`, in the phone menu and on the 404) is a quiet row over one hairline with a flat `⌘K` hint; results in the dialog take a chip wash, never a raised frame.
- **Pager** is one hairline over two links, 80px below the article: an eyebrow (Previous / Next) over a 16px title with a muted arrow; ink on hover, no boxes.
- **Steps** hang on one hairline rail from flat 28px numbered rings (canvas face, strong contour, sans tabular figures) and take the wide column. A step title is 16px medium; its text is 14/24.5. A row step puts its text on two fifths and its code on three once the list is 38rem wide. A preview after the steps hangs like any surface and the rail runs into it.
- **Footer** in the documentation takes the article's wide column from the text's edge; elsewhere it is 72rem. Groups keep 11rem columns from the start (`auto-fill`), so a wide footer leaves the rest to the canvas. Link groups (Docs, Resources, Community) under strong-ink eyebrows, 14px links on a 32px pitch. One quiet legal row under a hairline: the notice and its links joined by dots at the start, the theme and language preferences at the end. No search field — the header carries search.

## Markup

| Layer | Convention |
| --- | --- |
| Root | One class per component, prefixed `ui-` |
| Part | `ui-<component>-<part>`, used only inside that component |
| Variant | Fixed vocabulary on data attributes: `data-variant`, `data-size`, `data-tone`, `data-elevation`, `data-background`, `data-padding`, `data-density`, `data-shape` |
| State | Native pseudo-classes and ARIA: `aria-pressed`, `aria-selected`, `aria-current`, `aria-checked`, `[open]`, `:checked`, `:disabled`. `data-state` only to show a static state in documentation; `data-result` for an action's outcome |
| Tokens | `--ui-*` roles; never raw palette steps in component CSS |
| Utilities | Master CSS classes compose layout inside content and specimens. They do not paint components, and shell components do not carry long utility lists |
| React | Components map one-to-one to classes; props only become data attributes |

Content and example markup keep teaching the preset vocabulary (`bg-surface-raised`, `shadow-lg`, …); `--ui-*` tokens are deliberately not utility tokens.

## Decisions and rejected directions

- **Owner direction (2026-11-01 refinement, second pass):** the layout had regressed against a mature documentation site: mixed measures (41rem prose, full-width rules and pager, code bleeding 32px past both edges), a cramped footer, missing tracking, captions competing with entries. Continue the system and refine; captions may be uppercase with proper tracking.
- Decided (round 1): one 46rem column with no bleed; the page head's closing hairline and the installation layout's italic subtitle removed (the subtitle is now the page head's second lead line); tracked sans eyebrows for group and page captions; borderless pager; footer regrouped into three columns with the search field removed.
- Rejected (round 1): keeping a 41rem text measure inside a wider column for code and examples — two right edges was the regression the owner saw. A 48rem column (Tailwind's) — at 16px light text it runs past 95 characters a line; 46rem keeps about 88.
- Rejected (round 1): centring a contents-less page in the full main area — the column jumped sideways between the Installation tabs and the next document.
- **Owner correction (round 2):** some components bled past the text on purpose — Installation suits the original wider layout, and the messiness came from squeezing steps, previews and code into the reading column. Search moves from the sidebar to the header's end, low-key.
- Decided (round 2): the two-width grid above, restoring the pre-Moonstone structure (text at 41rem, steps and surfaces wide, previews and code hanging 32px) with every edge aligned; the Installation content back to its original order; search as a header pill; index cards as free-standing hairline sheets (the tray showed empty grey cells under a short last row); rules an author sets before a section heading render as space; list markers in sans (filled disc, tabular figures); code in table cells as a fill without a hairline.
- Rejected (round 2): one 44–46rem column for everything (round 1) — it cramped steps beside their code and made previews small; the owner preferred the original's breadth. A 42rem text measure inside a 46rem column (critique) — two right edges a few pixels apart read as misalignment; the measure and the wide column now differ by a whole rail.
- Rejected (round 2): a search field in the sidebar's head — it pushed every group down and duplicated the header's job.
- Decided (round 3): the corner copy button sits on the first code line's centre and the panel's face fades in behind it, so a long line scrolls under it without running through the glass; a copy group's instruction reads as a sans caption, not as a right-aligned mono status; the 404 search field is 20rem; chart labels and figure notes take the hang.
- Rule (round 2): a rounded control's inner space is measured, not eyeballed — ink to edge on both sides; a pill's round end gets 1–2px more than its flat-feeling side.

- **Owner direction (2026-11-01 polish):** return the sidebar, contents rail and header to the original documentation's layout; light regular type; finer spacing and rhythm; smaller radii; zinc rather than cool neutrals; clearer dark edges; restrained and soft overall. This overrides the approved spec's 4/6/10/14/18/24 radii, 520/560/600 weights, hue-255 pearl and mono uppercase labels.
- Rejected: semibold (600) headings and 560 labels — too heavy against the 350 reading text, the "template" look the owner disliked.
- Rejected: mono uppercase tracked eyebrows for group captions, table heads and kickers — read as an AI-made signature; captions are small sans now.
- Rejected: the raised-sheet pill for the current sidebar entry and the sunken well for the current header link — the original ink bar and ink word are quieter.
- Rejected: hue 255 pearl with a .012-chroma ink for lines and .022-chroma shadows — the visible blue cast made the interface cold.
- Rejected: a darker obsidian canvas (17.4%) with .085 contours — surfaces and edges blurred together; the zinc-95 canvas with firmer lines separates them without raising the noise.
- Rejected (round 2): a shorter 48px phone header — the blog and homepage offsets are built on the 60px header, and the gain was small.
- Rejected (round 2): removing the tray's inner stage contour to avoid "card in card" — the tray is the system's example frame and the stage edge is what separates specimen from caption; instead the dark tray was lifted to 17.4% so it no longer reads as a hole.
- Rejected (round 2): unframed tables as in the original — the framed sheet keeps sticky heads and horizontal scroll legible; its radius and contour are now small and quiet.
- Rejected (round 3): a dark stage darker than the canvas (18.4% under a .12 black falloff) — specimens sat in a hole. The dark ladder now mirrors light: tray 17.4 < canvas 19.4 < stage 20.4, with a .08 falloff.
