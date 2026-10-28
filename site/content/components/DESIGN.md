# Home design language: quiet precision

The homepage explains a precise tool, so it should look precise and stay quiet: neutral grays, near-flat surfaces, a thin line of light on raised edges, short contact shadows, and content wrapped in a recessed shell. Every rule below has a token or primitive in `../design.css`; components use those names instead of palette steps.

## Principles

1. **Type carries the hierarchy.** Size, weight and gray level order the page. Color is a signal, not decoration.
2. **One neutral: zinc.** Every gray is a step of the preset's `zinc` family, a near-neutral with a faint cool, metallic cast. Home tokens alias the preset roles and the site roles in `styles/docs-shell/theme.css`, so the homepage, header, footer and docs share one system.
3. **One light, one accent.** Light falls from above. The primary action is solid ink; the yellow signal marks only live states and the Master CSS figure in a chart.
4. **Figures explain mechanisms.** Every illustration shows something Master CSS actually does: classes becoming rules, layers ordering them, rules flowing to a delivery target. No ornamental art.
5. **Motion shows cause and effect.** Things move because data moves or state changes. Ambient motion is slow; everything stops for reduced motion.
6. **Truthful samples.** Code, diagnostics, completions and numbers come from the engine, linter, language service or committed benchmarks, and tests keep them that way.
7. **One left rail.** The hero copy, every section header and every figure hang on the content edge. Only the closing panel centers.
8. **One idea per figure.** A section shows one demo, or a few cards that each show one thing. When several samples make the same point, put them behind tabs in one figure instead of repeating the frame.

## Page structure

The page reads as a sequence, each section answering the next question a reader has:

| # | Section | Question | Figure |
| --- | --- | --- | --- |
| — | Hero | What is it? | Composer: classes typed, CSS generated, lint problem, fix; then editable on the page's runtime |
| 01 | Design system | What can I express? | Bento: modes, tokens, P3 palette, layout and motion, layers |
| 02 | Editor | Can I read it? | Four editor cards |
| 03 | Rendering | How does CSS reach the browser? | Flow diagram and mode cards |
| 04 | CSS size | What does it cost? | Bar chart from the benchmark snapshot |
| 05 | Lint | How is it checked? | Rule explorer: tabs beside one editor |
| 06 | AI agents | Can agents use it safely? | Agent session, MCP clients, tool list |
| 07 | Workflow | Does it fit my stack? | Frameworks, impact graph, monorepo, routes |
| — | Call to action | How do I start? | Dark panel over the class matrix |

Figures alternate in weight (colorful bento, quiet cards, diagram, chart, editor, session, logos) so no two neighbours look alike.

## Rhythm

- Sections are `--home-section-space` apart (80 → 144px) and every figure starts `--home-header-space` (40 → 60px) below its header.
- A section header is a single stack on the left rail, never two columns: eyebrow, title (`max-width: 24ch`, balanced), lead (`max-width: 38rem`), then a text link to the guide that goes deeper. Every numbered section has one, so the reader always knows where to read next.
- Drafting rails run 20px outside the content edges from `md`, so text and frames sit inside a ruled column instead of touching the line. In the hero they start below the fixed header and fade in.
- Inside cards: 24px padding on phones, 28px from `sm`; the title sits 6px above its body; the figure starts a padding-width below the body and is pushed to the card's bottom so figures in a row share a baseline. A figure that cannot fill its card (a list, a marquee) grows to fill it instead of leaving a gap.

## Surfaces

From the page outward. Each home token aliases a role; light step first, dark second.

| Token | Role | Zinc steps | Use | Treatment |
| --- | --- | --- | --- | --- |
| `--home-ground` | `surface-canvas` (site) | 0–5 mix / 95 | The page and the canvas | Flat |
| `--home-tray` | `surface-shell` (site) | 5–10 mix / 95–100 mix | The shell that wraps a set of cards, a stage or the call to action | Flat: one soft step below the ground, no ring and no shadow |
| `--home-sheet` | `surface-raised` | white / 90 | Cards, windows, selected segments | Hairline ring, 1px top light, contact shadow (`--home-elevation-1`) |
| `--home-well` | `surface-canvas` (site) | 0–5 mix / 95 | Figures and code inside a sheet: a recess back down to the canvas | Groove (`--home-groove`) |
| `--home-float` | `surface-floating` | white / 80 | Popovers and menus | `--home-elevation-2` |
| `--home-ink` | `surface-ink` (site) | 90 / 5 | The primary action and the selected icon | Flat, 1px inner light |

Light mode stays clean and white: the ground is about `#f7f7f7`, the shell about `#f1f1f1` and sheets white, so structure comes from contours, not dark grounds. Text aliases `text-strong`, `text-body` and `text-muted`; `--home-text-faint` mixes 72% `text-muted` into the site's `text-subtle`, so annotations stay quiet but still read at 4.5:1 on the ground and on sheets in both schemes. Lines alias the site's `line-contour` (an 8.5% dark contour), `line-divider` and a 55% mix of `line-control`.

## Shell, inset and radii

- Content sits in a shell → sheet → well stack. Every step in is the same 8px (`--home-gap`).
- Radii nest concentrically, outer = inner + inset: well 8px, sheet 16px, shell 24px.
- The hero stage and the call to action use the same shell as the bento sections, so the page opens and closes with one gesture.
- Never put a sheet directly on a sheet; put a well or a shell between them.

## Light and shadow

- An edge is built from parts: a 1px dark contour holds the shape, a 1px inner light finishes the top edge (fainter on the left, the light comes from above and slightly left), and the shadow fades out in layers.
- `--home-edge`: the inner lights (`shadow-edge`).
- `--home-contact`: three contact layers, `.5px`, `2px` and `5px` deep at 4.5%, 2.5% and 1.6%, so the edge never looks cut out (`shadow-contact`). Frames (the shells around the bento sections, the hero stage and the call to action) carry no shadow at all; depth starts at the sheets inside them.
- `--home-pressed`: two soft inner layers and a contour (`shadow-pressed`). Tracks are pressed into the shell; pressing a button swaps its outer shadow for this and nothing moves.
- Seams inside a bar are single 1px lines inset from both ends with a 1px light beside them, never full-height borders.
- The rest of the site uses the same light through `shadow-raised`, `shadow-floating` and `shadow-pressed` in `styles/docs-shell/theme.css`, with radii `r-lg` (wells), `r-xl` (controls and code), `r-2xl` (sheets) and `r-3xl` (shells). The docs' `--color-accent` and `--color-focus` are ink too, so active and focused states read the same on every page.

## Controls

- **Segmented control**: a recessed `--home-tray` track with a 4px inset; the selected segment is a sheet with a hairline ring and contact shadow; the others stay flush.
- **Mode cards** follow the same model at card size: the chosen mode is a raised sheet on the shell, the rest sit flush with it.
- **Buttons**: primary is ink, secondary is a sheet with a rule ring. Both use the 10px control radius.
- **Focus**: a 2px ink outline, offset 2px.

## Glass

Only elements that float over the character matrix use `.home-glass`: the announcement pill and the install command. Glass is a translucent fill, 10px backdrop blur, inner light on the top and left, a barely-there dark contour (5%, 7% at the bottom) and a falloff that spreads wide and soft. Main content is always solid.

## Lines, guides and text

- `--home-hairline` separates, `--home-rule` divides, `--home-rule-strong` marks the selected item.
- Drafting guides: from `md`, each section draws rails 20px outside the content edges (`--home-rail`), a rule across its top and a cross where they meet (`--home-guide`). They sit behind content.
- `--home-text` is for display type, titles and data; `--home-text-body` for code; `--home-text-quiet` for prose; `--home-text-faint` for annotations.
- Code samples pull Shiki's colors toward the body text so they read as structure. Status tones (`.home-tone-*`) are low-chroma too.

## Markers

The page labels itself with a few markers, and only these:

- **Section eyebrow** (`.home-eyebrow`): index, a short rule that draws in, and the section name. Every numbered section starts with one; the hero and the closing panel have none.
- **Status marker** (`.home-status`): a dot and a word. `-live` uses the signal and is the only pulsing element in its figure.
- **Annotation marker** (`.home-annotation`): mono caps at `--home-label` that name parts of a figure. Cards carry no kicker above their title.
- **Tag** (`.home-tag`): mono caps in a hairline box for a state such as Default.
- **Units** in figures drop to mono at caption size, like a dimension on a drawing.

## Type scale

One scale, set in `../design.css`. Two sizes are fluid; everything else is fixed.

| Role | Token | Size | Weight and treatment |
| --- | --- | --- | --- |
| Display | `--home-display` | 42 → 88px | Medium, tracking `-0.05em`, line height 1; the second line drops to the faint gray |
| Section title | `--home-title` | 32 → 48px | Medium, tracking `-0.04em`, balanced, at most two lines |
| Lead | `--home-lead` | 17 → 19px | Regular, quiet gray, line height 1.6 |
| Card title | `--home-card-title` | 18px | Medium, tracking `-0.015em` |
| Body | `--home-body` | 15px | Regular, quiet gray, line height 1.6 |
| Caption | `--home-caption` | 13px | Regular, quiet gray |
| Label | `--home-label` | 11px | Mono caps, the eyebrow and annotations |
| Code | `--home-code` | 13px | Mono, tabular numbers |

Han text keeps its own tracking: under `:lang(zh)`, display and titles tighten only to `-0.015em`. Titles also use `word-break: keep-all`, so they break only at spaces and punctuation; a long Chinese title marks its phrase boundaries with `\u200b` in `public/dictionaries/tw.json` so it can still wrap between phrases on a phone.

## Copy

Plain and specific, the way the docs would say it. Say what the thing is or does, then stop: "The markup-driven CSS language and framework", "Lint classes against your project". No superlatives, no slogans, no claims the samples cannot back up. Eyebrows are plain nouns (Design system, Editor, Rendering, CSS size, Lint, AI agents, Workflow).

## Data

- Charts are gray. Bars, gridlines and ticks use text and rule tokens; the Master CSS row alone uses the signal.
- Third-party logos and brand icons keep their own colors; the gray system governs surfaces, lines and text, not other people's marks.
- Every figure that shows a number names its source and date, such as the benchmark snapshot, and the tests read the same file.

## Windows and wells

- An **editor window** (the hero composer, the lint explorer, the agent session) has a bar: three dots, a file tab and a status on the right. It is the only place window chrome appears.
- A **code well** inside a card is just code in the well, with no bar. Docs code-block borders and fills are reset inside home figures.
- The **dot grid** marks a rendered preview, a canvas where markup becomes UI: the composer preview, the theme split, the gallery. Diagrams, palettes and code never sit on it.
- Problems are marked in the code with the word-mark directives the docs use (`@ERROR`, `@WARN`, `@MARK`), so the underline points at exactly what the rule reports; tests check the mark starts at the reported column.

## The live composer

The hero composer is a demo until the reader presses **Edit classes**. Then the class list becomes a one-line field and the page's own Master CSS runtime (`globalThis.masterCSSRuntime`, present because the site renders progressively) generates what they type: the preview button takes the classes, the panel lists each class's rule, and a class that generates nothing is marked in the warn tone and counted in the bar, where a live signal replaces the step list. Typing must pause for 300ms before the list reaches the runtime, so half-typed states such as `:ho` never become rules. The preview contains layout and paint while editing, so even `position:fixed` stays inside it. **Replay** returns to the demo. Pages without a runtime keep the composer read-only.

## Figures under the pointer

Looping figures hand over to the reader: pointing at a card holds its figure in the revealed state (the hover card, the completion menu, the color picker), and the focused-highlighting loop stops where it is. In Hover inspection every class in the sample is a target, and the card shows the rule the engine generated for it at build time. Dragging the theme preview's divider tints the token value in use in the card beside it. In Trace a change, pointing at a node keeps its dependencies and dependents lit and dims the rest, with pure CSS (`:has()` over `data-trace` word lists computed from the graph).

## Tours

A figure with several states tours them on its own while it is in view: the lint explorer steps through its rules, the rendering section through its modes. A hairline on the chosen item fills toward the next one. Pointer or focus inside the figure pauses the tour; choosing an item ends it. Under reduced motion there is no tour and the first state stays.

## Stable figures

Animated figures reserve the space of their largest state. Editor panes keep a docked problems panel and room for the longest diff, so a loop never moves the content around it.

## Motion

- Easing: `--home-ease` for arrivals and responses, `--home-ease-inout` for loops.
- Durations: `--home-quick` (hover, press), `--home-base` (state changes), `--home-slow` (reveals). Ambient loops run 8 s or longer.
- The hero arrives in reading order on load: pill, both display lines, lead, actions, then the stage, each rising 20px out of a 6px blur.
- Below the hero, every header line and card rises as it scrolls in on a view timeline, so the stagger comes from position, not timers. Interactive figures pause when off screen.
- Under `prefers-reduced-motion: reduce`, loops stop and figures show their finished state.
- Write animations with longhand properties when a value uses a route variable; a variable inside the `animation` shorthand makes the build keep every preset keyframe.

## Depth

3D is used to separate meaning into planes, never as a gimmick:

- The hero stage tilts back and flattens as it scrolls into place; its panes sit at different depths.
- The cascade layer figure explodes `@layer theme, base, defaults, components, utilities` into stacked planes.
- The palette matrix tilts into an isometric field and flattens on hover so it can be read; below `md` it is a flat, fluid grid.
- The MCP orbit rotates clients around the server on a tilted plane; clients dim as they pass behind it. The radius follows the card's width, and narrow cards tilt less and drop the client names.
- The call to action closes on a grid floor that recedes to a horizon and drifts slowly toward the reader.

Perspective is `--home-perspective`. A plane that carries content to read, like the hero stage, tilts less than 20° and settles flat. Diagram planes may tilt further when they only carry short labels, and anything longer turns to face the reader.

## Matrix

The character matrix (`GlyphField`) is written in real classes from `ctaClassRows`, which the tests lint. It appears twice: on the right of the hero, fading toward the copy and hidden on narrow screens, and behind the call to action, where it clears an oval behind the copy. Cells sit at 4% ink; a soft light follows the pointer or drifts when idle, and only cells decoding inside that light take the signal color.
