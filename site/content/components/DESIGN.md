# Home design language: quiet precision

The homepage explains a precise tool, so it should look precise and stay quiet: neutral grays, near-flat surfaces, a thin line of light on raised edges, short contact shadows, and content wrapped in a recessed shell. Every rule below has a token or primitive in `../design.css`; components use those names instead of palette steps.

## Principles

1. **Type carries the hierarchy.** Size, weight and gray level order the page. Color is a signal, not decoration.
2. **One neutral: zinc.** Every gray is a step of the preset's `zinc` family, a near-neutral with a faint cool, metallic cast. Home tokens alias the preset roles and the site roles in `styles/docs-shell/theme.css`, so the homepage, header, footer and docs share one system.
3. **One light, one accent.** Light falls from above. The primary action is solid ink; the yellow signal marks only live states and the Master CSS figure in a chart.
4. **Figures explain mechanisms.** Every illustration shows something Master CSS actually does: classes becoming rules, layers ordering them, rules flowing to a delivery target. No ornamental art.
5. **Motion shows cause and effect.** Things move because data moves or state changes. Ambient motion is slow; everything stops for reduced motion.
6. **Truthful samples.** Code, diagnostics, completions and numbers come from the engine, linter, language service or committed benchmarks, and tests keep them that way.

## Surfaces

From the page outward. Each home token aliases a role; light step first, dark second.

| Token | Role | Zinc steps | Use | Treatment |
| --- | --- | --- | --- | --- |
| `--home-ground` | `surface-canvas` (site) | 5 / 95 | The page and the canvas | Flat |
| `--home-tray` | `surface-shell` (site) | 10 / 100 | The shell that wraps a set of cards, a stage or the call to action | Recessed: darker than the ground, hairline ring |
| `--home-sheet` | `surface-raised` | white / 90 | Cards, windows, selected segments | Hairline ring, 1px top light, contact shadow (`--home-elevation-1`) |
| `--home-well` | `surface-canvas` (site) | 5 / 95 | Figures and code inside a sheet: a recess back down to the canvas | Groove (`--home-groove`) |
| `--home-float` | `surface-floating` | white / 80 | Popovers and menus | `--home-elevation-2` |
| `--home-ink` | `surface-ink` (site) | 90 / 5 | The primary action and the selected icon | Flat, 1px inner light |

Text aliases `text-strong`, `text-body`, `text-muted` and the site's `text-subtle` (zinc 40 / 60); lines alias `line-subtle`, `line-divider` and a 55% mix of `line-control`.

## Shell, inset and radii

- Content sits in a shell → sheet → well stack. Every step in is the same 8px (`--home-gap`).
- Radii nest concentrically, outer = inner + inset: well 8px, sheet 16px, shell 24px.
- The hero stage and the call to action use the same shell as the bento sections, so the page opens and closes with one gesture.
- Never put a sheet directly on a sheet; put a well or a shell between them.

## Light and shadow

- `--home-edge`: a 1px inner line of light on the top edge of raised surfaces.
- `--home-contact`: `0 1px 2px` at 7% black. Shadows stay close to the surface; only the hero shell adds a long, faint falloff.
- `--home-pressed`: an inner shadow. Tracks are pressed into the shell; pressing a button swaps its outer shadow for this and nothing moves.
- The rest of the site uses the same light through `shadow-raised`, `shadow-floating` and `shadow-pressed` in `styles/docs-shell/theme.css`, with radii `r-lg` (wells), `r-xl` (controls and code), `r-2xl` (sheets) and `r-3xl` (shells). The docs' `--color-accent` and `--color-focus` are ink too, so active and focused states read the same on every page.

## Controls

- **Segmented control**: a recessed `--home-tray` track with a 4px inset; the selected segment is a sheet with a hairline ring and contact shadow; the others stay flush.
- **Mode cards** follow the same model at card size: the chosen mode is a raised sheet on the shell, the rest sit flush with it.
- **Buttons**: primary is ink, secondary is a sheet with a rule ring. Both use the 10px control radius.
- **Focus**: a 2px ink outline, offset 2px.

## Glass

Only elements that float over the character matrix use `.home-glass`: the announcement pill and the install command. Glass is a translucent fill, 10px backdrop blur and a bright top rim. Main content is always solid.

## Lines, guides and text

- `--home-hairline` separates, `--home-rule` divides, `--home-rule-strong` marks the selected item.
- Drafting guides: from `md`, each section draws rails on the content edges, a rule across its top and a cross where they meet (`--home-guide`). They sit behind content.
- `--home-text` is for display type, titles and data; `--home-text-body` for code; `--home-text-quiet` for prose; `--home-text-faint` for annotations.
- Code samples pull Shiki's colors toward the body text so they read as structure. Status tones (`.home-tone-*`) are low-chroma too.

## Markers

The page labels itself with a few markers, and only these:

- **Section marker** (`.home-marker`): index, name and a rule that draws in. Every section starts with one, numbered in reading order.
- **Status marker** (`.home-status`): a dot and a word. `-live` uses the signal and is the only pulsing element in its figure.
- **Annotation marker** (`.home-annotation`, `.home-workflow-signal`): mono caps that name parts of a figure or a card.
- **Tag** (`.home-tag`): mono caps in a hairline box for a state such as Default.
- **Units** in figures drop to mono at caption size, like a dimension on a drawing.

## Type scale

| Role | Size | Notes |
| --- | --- | --- |
| Display | `--home-display` | Regular weight, tracking `-0.05em`; the second line drops to the quiet gray |
| Section title | `--home-title` | Regular weight, balanced wrapping, at most two lines |
| Lead | `--home-lead` | Quiet gray, pretty wrapping |
| Card title | 19px | Medium weight, tracking `-0.02em` |
| Body and captions | 14px, `--text-xs` | Quiet gray |
| Code and data | `--home-mono`, 11–13px | Tabular numbers |

## Copy

Short, plain sentences. Name what the reader gets, then stop. No claims the samples cannot back up.

## Data

- Charts are gray. Bars, gridlines and ticks use text and rule tokens; the Master CSS row alone uses the signal.
- Third-party logos sit in grayscale and take their own color only on hover.
- Every figure that shows a number names its source and date, such as the benchmark snapshot, and the tests read the same file.

## Stable figures

Animated figures reserve the space of their largest state. Editor panes keep a docked problems panel and room for the longest diff, so a loop never moves the content around it.

## Motion

- Easing: `--home-ease` for arrivals and responses, `--home-ease-inout` for loops.
- Durations: `--home-quick` (hover, press), `--home-base` (state changes), `--home-slow` (reveals). Ambient loops run 8 s or longer.
- Sections and cards reveal on scroll with view timelines. Interactive figures pause when off screen.
- Under `prefers-reduced-motion: reduce`, loops stop and figures show their finished state.
- Write animations with longhand properties when a value uses a route variable; a variable inside the `animation` shorthand makes the build keep every preset keyframe.

## Depth

3D is used to separate meaning into planes, never as a gimmick:

- The hero stage tilts back and flattens as it scrolls into place; its panes sit at different depths.
- The cascade layer figure explodes `@layer theme, base, defaults, components, utilities` into stacked planes.
- The palette matrix tilts into an isometric field and flattens on hover so it can be read.
- The MCP orbit rotates clients around the server on a tilted plane; clients dim as they pass behind it.
- The call to action closes on a grid floor that recedes to a horizon and drifts slowly toward the reader.

Perspective is `--home-perspective`. A plane that carries content to read, like the hero stage, tilts less than 20° and settles flat. Diagram planes may tilt further when they only carry short labels, and anything longer turns to face the reader.

## Matrix

The character matrix (`GlyphField`) is written in real classes from `ctaClassRows`, which the tests lint. It appears twice, behind the hero and behind the call to action, and always clears an oval behind the copy. Cells sit at 4% ink; a soft light follows the pointer or drifts when idle, and only cells decoding inside that light take the signal color.
