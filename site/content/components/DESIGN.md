# Home design language: quiet precision

The homepage explains a precise tool, so it should look precise and stay quiet: neutral grays, near-flat surfaces, a thin line of light on raised edges, short contact shadows, and cards that stand directly on the ground. Every rule below has a token or primitive in `../design.css`; components use those names instead of palette steps.

## Principles

1. **Type carries the hierarchy.** Size, weight and gray level order the page. Color is a signal, not decoration.
2. **One neutral: zinc.** Every gray is a step of the preset's `zinc` family, a near-neutral with a faint cool, metallic cast. Home tokens alias the preset roles and the site roles in `styles/docs-shell/theme.css`, so the homepage, header, footer and docs share one system.
3. **One light, one accent.** Light falls from above. The primary action is solid ink; the gold signal (`--home-signal`, the preset's amber at the logo's hue) marks only live states, the path a change takes and the Master CSS figure in a chart. The hero silk and the closing field are the same gold, so the page carries one brand color; preset yellow appears only where a sample class names it.
4. **Figures explain mechanisms.** Every illustration shows something Master CSS actually does: classes becoming rules, layers ordering them, rules flowing to a delivery target. No ornamental art.
5. **Motion shows cause and effect.** Things move because data moves or state changes. Ambient motion is slow; everything stops for reduced motion.
6. **Truthful samples.** Code, diagnostics, completions and numbers come from the engine, linter, language service or committed benchmarks, and tests keep them that way.
7. **One left rail, two centered moments.** Every section header and figure hangs on the content edge. The hero and the closing invitation center, so the page opens and closes on one axis.
8. **One idea per figure.** A section shows one demo, or a few cards that each show one thing. When several samples make the same point, put them behind tabs in one figure instead of repeating the frame.
9. **Frame only what is a tool.** A frame (a card or a window) says "this is a UI you would use": editor windows, the lint bench, the agent session, bento cards that hold several capabilities. Diagrams, charts and drawings sit open on the ground at the content width, held by whitespace and at most one rule. The page alternates framed and open sections, a figure never nests more than two surfaces, and a logo or shape is never captioned with what it already says.

## Page structure

The page reads as a sequence, each section answering the next question a reader has:

| # | Section | Question | Figure |
| --- | --- | --- | --- |
| — | Hero | What is it? | The positioning line over a sheet of gold silk |
| 01 | Design system | What can I express? | Bento: modes, tokens, P3 palette, layout and motion, layers |
| 02 | Editor | Can I read it? | One editor: completion, hover, focused highlighting and color picker in turn |
| 03 | Rendering | How does CSS reach the browser? | A split editor, a processing rail and a live mode explainer that uses the generated CSS |
| 04 | CSS size | What does it cost? | Bar chart from the benchmark snapshot |
| 05 | Lint | How is it checked? | Rule bench: rules beside an editor, with the CLI and MCP server reporting the same check |
| 06 | AI agents | Can agents use it safely? | Agent session window, joined by a beam to a liquid-glass MCP server on a floor of classes |
| 07 | Workflow | Does it fit my stack? | Frameworks, impact graph, monorepo, routes |
| — | Call to action | How do I start? | A centered invitation, Get started and the install command |

Figures alternate in weight (colorful bento, quiet cards, diagram, chart, editor, session, logos) so no two neighbours look alike.

## Rhythm

- Sections are `--home-section-space` apart (96 → 168px) and every figure starts `--home-header-space` (48 → 80px) below its header. The page should feel unhurried: when in doubt, add air, not ornament.
- A section header is a single stack on the left rail, never two columns: eyebrow, title (`max-width: 22ch`, balanced), lead (`max-width: 38rem`), then a text link to the guide that goes deeper. Every numbered section has one, so the reader always knows where to read next.
- Drafting rails run 20px outside the content edges from `md`, so text and frames sit inside a ruled column instead of touching the line. In the hero they start below the fixed header and fade in.
- On the homepage the header's content sits on the same column (`.home-header`), so the logo and the last icon share the sections' edges; the docs keep their full-width header.
- Rulers run down the outside of each rail from `md`: a short tick every 16px and a longer one every 128px, the way a design tool measures its canvas. They are the page's drafting texture; a hatch band in the margins would read as someone else's.
- Inside cards: 28px padding on phones, 36px from `sm`, 40–44px from `lg`; the title sits 12px above its body; the figure starts a padding-width below the body and is pushed to the card's bottom so figures in a row share a baseline. A figure that cannot fill its card (a list, a marquee) grows to fill it instead of leaving a gap.

## Surfaces

From the page outward. Each home token aliases a role; light step first, dark second.

| Token | Role | Zinc steps | Use | Treatment |
| --- | --- | --- | --- | --- |
| `--home-ground` | `surface-canvas` (site) | 0–5 mix / 95 | The page and the canvas | Flat |
| `--home-tray` | `surface-shell` (site) | 5–10 mix / 95–100 mix | Reserved; no homepage surface uses it now | Flat: one soft step below the ground, no ring and no shadow |
| `--home-sheet` | `surface-raised` | white / 90 | Cards, windows, selected segments | Hairline ring, 1px top light, contact shadow (`--home-elevation-1`) |
| `--home-well` | `surface-canvas` (site) | 0–5 mix / 95 | Figures and code inside a sheet: a recess back down to the canvas | Groove (`--home-groove`) |
| `--home-float` | `surface-floating` | white / 80 | Popovers and menus | `--home-elevation-2` |
| `--home-ink` | `surface-ink` (site) | 90 / 5 | The primary action and the selected icon | Flat, 1px inner light |

Light mode stays clean and white: the ground is about `#f7f7f7` and sheets white, so structure comes from contours, not dark grounds. Text aliases `text-strong`, `text-body` and `text-muted`; `--home-text-faint` mixes 72% `text-muted` into the site's `text-subtle`, so annotations stay quiet but still read at 4.5:1 on the ground and on sheets in both schemes. Lines alias the site's `line-contour` (an 8.5% dark contour), `line-divider` and a 55% mix of `line-control`.

## Cards, inset and radii

- Cards stand directly on the page ground with their own 1px contour; there is no shell around a set of cards or the call to action, so no edge ever reads as a thick border. Cards in a grid sit 12px apart, 16px from `md`.
- Inside a card the figure may sit in a well 12px in (`--home-gap`), and nothing deeper: at most two surfaces.
- Radii nest concentrically, outer = inner + inset: well 8px, sheet 20px.
- Never put a sheet directly on a sheet; put a well between them.

## Light and shadow

- An edge is built from parts: a 1px dark contour holds the shape, a 1px inner light finishes the top edge (fainter on the left, the light comes from above and slightly left), and the shadow fades out in layers.
- `--home-edge`: the inner lights (`shadow-edge`).
- `--home-contact`: three contact layers, `.5px`, `2px` and `5px` deep at 4.5%, 2.5% and 1.6%, so the edge never looks cut out (`shadow-contact`). Depth starts at the sheets; nothing behind them carries a shadow.
- `--home-pressed`: two soft inner layers and a contour (`shadow-pressed`). Tracks are pressed into the ground; pressing a button swaps its outer shadow for this and nothing moves.
- Seams inside a bar are single 1px lines inset from both ends with a 1px light beside them, never full-height borders.
- The rest of the site uses the same light through `shadow-raised`, `shadow-floating` and `shadow-pressed` in `styles/docs-shell/theme.css`, with radii `r-lg` (wells), `r-xl` (controls and code), `r-2xl` (sheets) and `r-3xl` (shells). The docs' `--color-accent` and `--color-focus` are ink too, so active and focused states read the same on every page.

## Controls

- **Segmented control**: a soft pill track drawn with one 1px line, and a raised pill thumb (hairline, two soft shadows, a top highlight) that slides to the chosen option and takes its width. Until it is measured, the chosen option paints the raised look itself, so nothing jumps on hydration.
- **Buttons**: primary is ink, secondary is a sheet with a rule ring. Both use the 10px control radius and are 44px tall, and so is the install command beside them, whose copy button nests inside with a 6px concentric corner. Stacked on phones, a row of actions takes one shared width.
- **Links into the guide** (`.home-section-link`: a section's link, "See details", "How it works") are quiet: 14px, the faint text color, a 14px arrow that moves on hover. They follow the copy and never compete with the figure.
- **Focus**: a 2px ink outline, offset 2px.

## Glass

Only elements that float over the character matrix use `.home-glass`: the announcement pill and the install command. Glass is a translucent fill, 10px backdrop blur, inner light on the top and left, a barely-there dark contour (5%, 7% at the bottom) and a falloff that spreads wide and soft. Main content is always solid.

## Lines, guides and text

- `--home-hairline` separates, `--home-rule` divides, `--home-rule-strong` marks the selected item.
- Drafting guides: from `md`, each section draws rails 20px outside the content edges (`--home-rail`), a rule across its top and a cross where they meet (`--home-guide`). They sit behind content.
- `--home-text` is for display type, titles and data; `--home-text-body` for code; `--home-text-quiet` for prose; `--home-text-faint` for annotations.
- Code samples share the site's syntax palette in `styles/docs-shell/syntax-theme.css`: rose keywords, blue tags and functions, cyan properties, parchment strings and lavender numbers. Dark mode pairs soft colors with warm-white text on zinc-95; light mode deepens the same hues. Highlighted lines use a subdued amber wash. The hand-rendered editor figures alias those same roles through `--home-code-*`; code surfaces use `--color-code-surface`. Keep syntax colors intact on highlighted and diff lines, and maintain at least 4.5:1 text contrast in both modes. Success, warning and error retain green, amber and red independently of syntax colors; status tones (`.home-tone-*`) remain separate.

## Markers

The page labels itself with a few markers, and only these:

- **Section eyebrow** (`.home-eyebrow`): index, a short rule that draws in, and the section name. Every numbered section starts with one; the hero and the closing invitation have none.
- **Status marker** (`.home-status`): a dot and a word. `-live` uses the signal and is the only pulsing element in its figure.
- **Annotation marker** (`.home-annotation`): mono caps at `--home-label` that name parts of a figure. Cards carry no kicker above their title.
- **Tag** (`.home-tag`): mono caps in a hairline box for a state such as Default.
- **Units** in figures drop to mono at caption size, like a dimension on a drawing.

## Type scale

One scale, set in `../design.css`. Two sizes are fluid; everything else is fixed.

| Role | Token | Size | Weight and treatment |
| --- | --- | --- | --- |
| Display | `--home-display` | 44 → 84px | Medium, white glass on both lines, tracking `-0.045em`, line height 1.02. Also capped at 10.5% of the viewport height, and short laptop screens trim the hero's air, so the actions stay in the first screen |
| Section title | `--home-title` | 36 → 56px | Regular, tracking `-0.035em`, balanced, at most two lines |
| Lead | `--home-lead` | 17 → 20px | Regular, quiet gray, line height 1.6 |
| Card title | `--home-card-title` | 24px | Regular, tracking `-0.025em` |
| Body | `--home-body` | 16px | Regular, quiet gray, line height 1.6 |
| Caption | `--home-caption` | 13px | Regular, quiet gray |
| Label | `--home-label` | 11px | Mono caps, the eyebrow and annotations |
| Code | `--home-code` | 13px | Mono, tabular numbers |

Han text keeps its own tracking: under `:lang(zh)`, display and titles tighten only to `-0.015em`. Titles also use `word-break: keep-all`, so they break only at spaces and punctuation; a long Chinese title marks its phrase boundaries with `\u200b` in `public/dictionaries/tw.json` so it can still wrap between phrases on a phone.

## Copy

Plain and specific, the way the docs would say it. Say what the thing is or does, then stop: "A markup-driven CSS orchestration language for developers and AI agents", "Lint classes against your project". Headings are regular weight: soft and even, never bold. No superlatives, no slogans, no claims the samples cannot back up. Section leads run one or two sentences (about 20 words) and card descriptions one full sentence: long enough to say what the figure shows and why it matters, short enough that the figure leads. Details beyond that go to the guide behind a quiet link. Eyebrows are plain nouns (Design system, Editor, Rendering, CSS size, Lint, AI agents, Workflow).

## Data

- The CSS size chart uses each brand's colors for its gradient bars, with the Master CSS row in gold. Gridlines, ticks and text stay neutral. Bars share a square left edge; a slow brightness pulse never changes their measured lengths and stops for reduced motion.
- Third-party logos and brand icons keep their own colors; the gray system governs surfaces, lines and text, not other people's marks.
- Every figure that shows a number names its source and date, such as the benchmark snapshot, and the tests read the same file.

## Drafting material

The page borrows the quiet marks of a design tool, used sparingly so they read as structure, not decoration:

- **Guides and crosses**: rails outside the content, a rule between sections and a cross where they meet (`--home-guide`, `--home-rule-strong`).
- **Rulers**: ticks down the outside of each rail, restarting at each section's top so the first long tick meets the section's cross.
- **Hatch** (`.home-hatch`, `--home-hatch`: the site's 6% stripe tile): reserved, inactive or empty space inside a figure, and the footer's wordmark. Never a page texture.
- **Artboard marks** (`.home-marks`): four corner ticks about 6px outside an open figure or a window, in `--home-mark`. A box that already has its own border does not take them.
- **Light**: `--home-highlight` is the top-edge light on a sheet or glass, `--home-highlight-ink` the same on an ink surface; components use these instead of raw white.

## Windows and wells

- A **well** (`.home-bento-visual`) draws its contour in a layer above the figure, so a pane that fills it never hides the line and a pane's own edge never doubles it. Panes inside a well never carry their own outer border.
- An **editor window** (the editor stage, the lint bench, the agent session) has a bar: three dots, a file tab and a status on the right. It is the only place window chrome appears, and inside it every divider is a single 1px line: no bar border, well groove and ring stacking on one edge.
- A **code well** inside a card is just code in the well, with no bar. Docs code-block borders and fills are reset inside home figures.
- The **dot grid** marks a rendered preview, a canvas where markup becomes UI: the theme split, the gallery. Diagrams, palettes and code never sit on it.
- Problems are marked in the code with the word-mark directives the docs use (`@ERROR`, `@WARN`, `@MARK`), so the underline points at exactly what the rule reports; tests check the mark starts at the reported column.

## The hero silk

The hero is the positioning line, centered in white glass. A white veil keeps the face luminous while the curved body visibly refracts the silk beneath it. Slowly flowing surface normals bend the background, and a broad diagonal reflection crosses the complete title with a bright leading edge and a darker, more transparent trailing band. Near the pointer the body becomes clearer and catches a local rim of light, while the letter edges stay white. The reflected silk is mostly neutral, so the letters keep a white identity. A fine ambient contour keeps the silhouette visible on the light ground. The real heading owns layout, selection and accessibility; a distance-field mask follows its browser line breaks, and the canvas takes over only after a successful frame.

The cloth keeps its original three-fold surface, upper-left light, gold palette, satin sheen and film grain. Composition changes only its coverage: one loose, asymmetric sheet flows from the header through the title and past the actions. Its broad contour follows the title's height without tracing its rectangle or forming a horizontal band. The paragraph's measured bounds open a soft, skewed reading space that bends with the folds and continues toward the lower left rather than forming a closed halo; the lower edge recedes unevenly into the ground before the section's bottom rule. The header's center stays quiet. Static film grain belongs to the silk shader, leaving the polished letters clear; the cloth renders at 60% density and the title mask at up to 2× density.

- Color comes from CSS: the canvas's `color`, `caret-color` and `outline-color` are the silk's shadow, body and sheen, set with `light-dark()`, so dark mode is molten gold on the ground and light mode is champagne.
- The pointer lifts the cloth and carries a local reflection across the letters with a soft, frame-rate-independent response, including while crossing the homepage header. Clicking the open scene sends one wave through the folds and catches the same wave along the glass edges. A touch responds on release after a tap; scrolling and using a control do not trigger a wave. Scroll position eases into the cloth's flow.
- The announcement pill catches a passing sheen on hover or keyboard focus; the primary action's arrow moves a few pixels without changing its size.
- The silk fades in over 2.4 seconds on load, pauses off screen and in hidden tabs, and resumes without a phase jump. Reduced motion shows one still frame and removes pointer, ripple and arrow motion. Without WebGL the white DOM heading retains its contour and shadow on the plain ground; forced colors and print use solid text.
- No class names in the hero: rows of real classes appear only as the floor of the MCP figure.

## Design system figures

One eight-column bento grid holds all five cards: themes on the first row, primitives on the second, and the P3 palette across the full width as the last card. Each card's title links to its guide above one or two plain sentences. Its figure reads as an artifact from a design tool, drawn in the page's ruler vocabulary: hairlines, corner marks, measured guides and dimension lines, with one gold only for the active or selected moment. Cards in a row share a header track, so figures in a row start at one height.

- The theme preview is an artboard with corner marks: the same markup twice, `.light` and `.dark` named above it like frame names, split by a 1px guide and measured below by a dimension line. Its clips, guide, labels and token-line shares update together once per frame, while both real CSS interfaces retain their DOM. The guide turns gold while dragged or focused. Its one introduction pauses off screen and in hidden tabs, and interaction ends it. A vertical touch scrolls the page; horizontal movement drags the split. Shift plus an arrow adjusts one percentage point.
- The token sample is an editor pane with bare, quiet line numbers like the page's other editors, and soft-wraps with a hanging indent.
- The layout card overlays a 12-column layout grid, columns as quiet bands and gutters hatched as reserved space; the photo in hand marks its columns in gold on the rulers and shows its span classes on a tag. A native modal opens the original photo at its natural ratio with a view transition, names its span classes below it, protects background focus and returns focus to its trigger. The scroll lock preserves the page width, and the backdrop uses one quiet 6px blur.
- The layer stack is one SVG exploded drawing: five softly lit plates with a thin machined edge, inset seams, etched details and registration pins. Dashed extension lines locate the assembly; a numbered ruler and front-facing labels make its order readable. The `.btn` rule is struck on its plate; the engine-generated `.px-lg` wins on a lightly amber-tinted top plate and its actual declaration appears below. Hover and keyboard focus gently separate the five groups using only 2D transforms; reduced motion keeps the finished drawing.
- The P3 palette closes the grid: a native listbox with rounded, top-lit color prisms as tall as their chroma on one subtly outlined plate. The resting sculpture fits completely inside the well. Hover opens the complete field into its table, leaving restores its depth, keyboard focus opens it, and phones keep the table. The camera settles before pointer readouts change, and the small gutters belong to their nearest color. Clicking or tapping keeps a color selected; horizontal touch scrubs a row while vertical scrolling and pinch zoom remain native.
- Quiet annotations occupy the palette well's upper corners: Display P3 on the left, the color and tier counts from the source palette on the right. The selected color has an ink tag and a fine gold ring. One passive readout holds a small color chip, its real class, full CSS value and gamut; narrow cards put the value on a second line. It stays empty until a color is selected, with no toolbar, instructions or action buttons. Escape clears selection. Enlarged text remains complete, and color samples retain their actual colors under forced colors.
- The optional drawing module loads near the viewport, and large backing stores wait until the figure is visible. One P3 cache holds the field; exploration only draws its selection, and both surfaces together stay below 5.2 million pixels. Projection, size and theme changes rebuild the cache. Native options remain accessible and form a usable flat table before hydration or without Canvas. Idle, offscreen and hidden figures do not draw; reduced motion switches projection immediately.
- Hatch appears only where space is reserved, such as the layout grid's gutters. Tests check that every "See details" target exists.

## Editor stage

Section 02 introduces four features in open columns above one editor window standing directly on the page ground at the content width: one contour, a contact shadow and a long soft shadow, no shell. Each feature has a full-opacity illustration at the top left, a title and one sentence; each sentence is also its button's accessible description. Shared grid rows align the illustrations, titles and descriptions. At least 64rem of available width gives four columns with 96px illustrations; narrower layouts use two by two with 80px illustrations, falling to 64px below 40rem. Phones retain every title and description. Below 16rem of available width, enlarged text uses one column. The quiet guide link follows the window on the left rail.

- The chrome is quiet: a top-lit bar, domed neutral window lights and an open file tab that continues into the code surface. A faint seam separates the line gutter; fine indentation guides and a small gold gutter mark locate the current line. The top status shows the caret's line and column. A narrow bar gives the complete filename room to wrap and omits decorative symbols. The section caption and title also reflow with enlarged text. A slim footer retains the current feature on phones and gives playback a 44px target; reduced motion omits playback.
- The selected feature's hairline is ink; while touring it fills in gold. Progress updates only that leaf, without restyling the code. Hover gives an open column a faint wash on devices with hover; keyboard focus has an ink ring. Choosing a feature replays it once and rests at its revealed moment. Play starts immediately from its own control, then reading the feature copy or code holds it again. Pointer and keyboard focus hold independently. Hidden tabs, offscreen windows and explicit pause stop the clock and caret.
- The window holds one dense file: type a completion as the actual list narrows, inspect a class with a state and a query, step down the file to light each class context, then drag the color picker on the literal. Every scene reserves the same height. Reduced motion reveals the selected operation immediately, without a tour.
- Class strings rest in a quiet string color; the lit one takes semantic role colors on a faint signal wash. While a pane is open, other lines recede to one neutral gray that retains at least 4.5:1 contrast. The inspected class takes a fine gold underline, including the cells of a color decoration inside a literal.
- Floating panes share one contour, the page's top light and a soft contact shadow. They unfold from their source line and keep their edges between code rows. The hover names its source class in the same semantic colors, reveals intact CSS a line at a time and lists its named tokens below. Long CSS scrolls within the pane. Its native keywords, functions and numbers share the documentation syntax palette; the presentation retains every original character.
- Completions have a quiet result count, matched letters and the focused token's definition beside the list. Narrow windows retain that token below the results. Values break only after commas, never within a custom property name.
- The file has a keyboard-focusable native horizontal viewport. The tour moves only enough to leave breathing room around its word; touch, horizontal wheel or keyboard reading ends autoplay until Play. Arrow keys and Home/End navigate the file in both browser engines. Floating panes follow the actual scroll offset and remain inside the window. Resizing a settled scene keeps its current word visible; explicit reader scrolling retains control.
- Every class answers the reader's pointer with the real language-service hover, and that pane stays open while it is being read. A touch tap pins an inspection until another gesture or an outside tap; a swipe keeps native scrolling. The literal's swatch is a native button. Its picker offers the platform color control, a draggable plane, reset and close; manual opening moves keyboard focus into it, stays open after pointer exit and closes on Escape or an outside click. Explicit close restores the source swatch's focus. Picked text and CSS stay in sync, and the hex label chooses black or white by luminance.

## Rendering stage

Section 03 is one workbench using `HomeEditorWindow`, the same chrome as section 02. From 52rem, HTML sits above CSS on the left, a narrow processing rail occupies the middle, and the preview fills the right. Smaller screens keep both code surfaces, then the processor and preview, in a vertical reading order.

- `index.html` includes doctype, html, head and body. Its head gains a stylesheet link, server-generated style with hydration metadata, or runtime-created style, according to the selected mode. The reference and CSS filename can reveal each other using local focus and a small text highlight; explicit inspection also scrolls an off-screen target into view, leaving room for the fixed header and moving immediately under reduced motion. Keep the sample compact enough to show its class list with the reference; below 26rem of pane width, the class attribute continues on its own visual line. A soft right edge indicates horizontally scrollable code. Nonessential application markup is folded with an ellipsis.
- The preview is the mode explanation itself: the existing 64px theme-specific WebP (56px at the narrowest size), mode title, description and guide link live inside one example card. All mode copy comes from `deliveryModes`; it is not repeated beneath the controls. Native radio-derived custom properties switch the shadow-root content even without JavaScript. Each mode reserves the same space, so its text and icon never move the workbench.
- The preview's quiet dot grid marks a rendered canvas. Its intrinsic height reserves the longest mode's content, and its native content inset already uses the final spacing token, so arriving utility rules never change the workbench's height. The mode's guide link aligns at the bottom of its shared content area. On phones the canvas fits that content rather than leaving a fixed empty well.
- The late `bg-amber-10` class changes that card. “Add a class” and the preview's Apply/Replay action run the same chapter. Source and generated selectors, properties and values receive a short highlight that follows their text; indentation, line numbers, braces and trailing whitespace remain unpainted. Static flashes its existing rule again when it is reused.
- CSS displays actual Rust-engine rules in stylesheet order. Static pre-generates the late rule; progressive starts with first-screen rules, loads its deferred engine for the uncovered class, then generates the rule; runtime generates rules in the browser. The preview applies those same rules in an isolated declarative shadow root using real utility classes and timed CSSOM updates. An external stylesheet packet is never shown for runtime rendering.
- The processor is labelled only Compiler, Server or Runtime. Progressive changes from Server to a deferred/loading/ready Runtime. Measured solid curves occupy the rail and preview gutter: class capsules enter the processor, small light points return to CSS, and the resulting stylesheet or applied rule reaches the preview. Desktop class delivery lands on the preview's corresponding class text; narrow screens use a short downward entry. Caps remain clear of the engine labels and source text. Gold marks active generation, the changed words and the applied result.
- Code regions support keyboard focus and local scrolling. Reading by pointer, wheel or keyboard pauses playback and ends automatic mode changes. Code focus already present on load keeps the completed document. Pointer presence and keyboard focus independently hold automatic mode changes, including an interaction already present when the player loads; a mode chosen before loading also ends the tour. On phones, reaching a code region's vertical boundary continues scrolling the page. Each mode input sits inside its visible tab, so activating it does not scroll back to a hidden input above the figure. Pending application preserves the preview button's focus.
- Panes and the preview canvas reserve their largest state. Controls follow the desktop figure; below 52rem they precede it. Native radios work without JavaScript, and the server renders a completed scene. Reduced motion keeps that scene without autoplay. Pause, hidden tabs and leaving view stop the clock and flights; resizing clears stale coordinates. Decorative flight elements use data attributes, never new classes.
- Each timeline chapter has one short explanation of the selected delivery path, with all chapters sharing their largest text area. The timeline, playback and preview action have at least 44px targets. On phones the chapter names take the full width, with the explanation and playback beneath; on desktop they align beside the mode switch. With enlarged text, the chapters use two or one columns and the mode choice stacks before names can clip. Narrow pane headers omit decorative lights and duplicate status text. Gold marks only the chapter currently playing.
- Each timeline moment lasts 4.2 seconds, with source highlights and flights on the same clock. The completed mode holds for another 4.8 seconds before the tour changes modes, leaving time to connect the source, generated rule and applied result. Chapter seeks and this completed hold count visible time, preserving their remaining duration across hidden tabs or leaving the viewport.

## CSS size

The figure is open on the page ground, like the other drawings: no frame, sheet or rule. A slim header holds the measure (Brotli or raw) on the left and the source and snapshot date on the right; there is no headline number, because the Master CSS bar carries its own value. Rows carry no names: each bar is identified by its brand mark beside the value, with the name kept for screen readers, and every other page shows its ratio as a bare multiplier. Each bar is a strip of CSS text whose length is the page's CSS; the text streams slowly through the bar and fades at both ends, and the Master CSS bar alone takes the signal. Values sit on the ground's color so gridlines never cross them. Each row's full extent is a hatched track, the axis is a ruler (four ticks per labelled step), and artboard marks frame the chart. The axis leaves room past the longest bar for its value, more when the chart is narrow, where only the ends of the axis are labelled.

## Lint: one check, three surfaces

A rule bench that leads with the check. The rules are a list of titles hung from 1px hairlines, each with a 48px themed glass illustration of what it catches. The selected row has one softly rounded sheet with a subtle contour and an ink title; its artwork stays flush on that surface. During the tour, a thin signal track fills along the row's lower edge.

- The editor (ESLint) stands in front with layered elevation; the CLI and MCP server windows stand behind it, a step narrower, their tops tucked under its lower edge, and cascade on phones. Windows have a top-lit bar, domed window lights, a real tab that rises from the bar's line into the well, and at most two surfaces. All three share one status: a toned dot and a quiet word. Code is set at `--home-code` with quiet line numbers.
- Every rule plays one check. A gold beam, fading at both ends, reads exactly the longest line and carries its column as a gold tag on the ruler. The range is drawn as a dimension: end ticks, extension lines and a tinted `line:column` tag (tick numbers under it step aside). The squiggle is a crisp 1px sine, the gutter glyph sends one ring, and the problem line is just the rule and its location; until a check reports, that line is a hatched reserved slot, the same as the agent's first output.
- At that moment the CLI and MCP windows slide out from behind the editor and print the same location, severity and rule, and the location flashes in all three. A surface that does not run a rule stays empty and says "ESLint only".
- Fixable rules open a floating quick fix menu. The sort numbers each class's slot; the class pulled forward lifts and lands with a short settle while the others pass under it. The conflict fix strikes and folds the overridden class. After a fix the beam reads the line once more before the clean status.
- Messages and rule details live in the guide behind the header link. Tests check the ESLint report, the CLI and MCP tooling report and the end column the ruler draws.
- Every state shares one grid cell, so the section never shifts. Under reduced motion each rule opens on its problem and quick fix, and the fix applies without movement.

## AI agents: one scene

A framed tool window, and below it, open on the page, the server it calls as a quiet accent.

- The window is one sheet with a 1px contour outside it, elevation-3 and a top light over its panes. One fluid 16–28px inset aligns the chrome, the file tab (a real editor tab that opens into the code), the line gutter, the transcript, the output and the step bar (Manifest, Inspect, Lint, Preview, Apply). Session and Output labels distinguish the conversation and results. Every inline icon is 14px at a 1.75 stroke, and every seam is a single 1px line. Below 56rem the window shows one pane at a time behind folder tabs; below 24rem the traffic lights give their space to the tabs. The step bar names all five steps at every width, adds numbers on wide windows, and gives its controls at least 44px of height. Enlarged text in a window narrower than 16rem stacks the pane picker and chapter rail, wraps the complete filename and tool name, and allows an oversized class to continue onto the next line. Manifest values become a plain list and diagnostic metadata wraps in full at that size. The clean verdict gives its title a full row; every pane and chapter remains readable and selectable.
- The agent speaks beside Claude's brand mark, with Aron's messages and shared blog portrait on the right. The agent's calls and edits hang in its turn on one 40px themed glass artwork column, including the file-and-pencil Edit illustration. Each call has a status glyph; the latest opens to its `tools/call` arguments and result. Before the first result, the output is a hatched reserved slot.
- Each state shares one grid cell and fully fades out before the next fades in, so nothing moves and no two states ever show at once. The inspection card docks in the space the diff reserves. When the digests match, both catch the gold and a shield seal lands, then settles to the ok tone. The final lint call leaves a clean result with the file and its write receipt; Output names the tool that actually produced the current result.
- The server stands on a low, elliptical glass plate, joined to the window by its call beam. A lazily loaded 2D canvas draws the plate's thickness, engraved connections, optical ticks, contact shadows and glass lenses from the DOM's measured geometry. Its height follows the plate and core; minimum projected spacing keeps the setup targets separate as the lens size changes. Brand marks stay sharp native SVGs. The faint floor is cached at up to 2× density; a call's expanding wave reads the real classes and dissipates at the plate's edge, then its reply climbs back in ink. The lenses magnify the floor and catch one moving softbox, while the marks themselves stay still. Client names appear outside the rim on hover or keyboard focus and link to MCP setup; native CSS keeps them inside the content width, including the static fallback. Plain CSS keeps a complete still figure when canvas is unavailable.
- Gold appears only while a call is in flight or at the hash match. Canvas draws on demand for a call or changing light, stops off screen and in hidden tabs, and holds with the session's pause control. Reading the window holds the tour; the Play control itself stays live under the pointer so an explicit click starts it immediately. Choosing a pane also pauses it for touch reading. Chosen chapters and the no-script snapshot show complete text immediately. Results are real and tested against the preset, the tooling lint and `server.ts`, including the final zero-diagnostic check. Reduced motion shows the finished session, every step selectable, and a still scene.

## Workflow: one drawing per card, link in the header

Each Workflow card has a linked title and one plain sentence beside its glass icon, then an open drawing without a well. A subgrid keeps each row's drawings level. Canvas owns the materials and connections; brand marks, guide links, code and buttons remain native content above it.

- Four drawings share the rounded glass wafer, a separate side ribbon, upper-left softbox and neutral contact shadow in `workflow-painter.ts`. Cast shadows fade completely inside the open drawing, including beneath the low source. The clear center retains the actual connections underneath with a small displacement; narrow cut edges on both wafers and upright ribs bend the same backdrop a little farther. A broad reflected window and feathered rim stay inside the actual face, while the lower contour belongs only to the exposed side ribbon. Tint, rim light and shadow remain separate. Its scratch surface grows only to the largest sampled region and shares the scene's pixel limit. Frameworks gather on a broad platform above the integration plane and the compact ink source. Neutral reflections derive from their original SVG silhouettes, clearer near contact and fading into the glass; the mask is baked once. A lifted mark has a wider, lighter shadow and a slightly more distant reflection. All sixteen framework links remain visible on phones, folded into four rows with 44px touch targets.
- The monorepo has one plane per project, each with a local `index.css` and the same class resolving to that project's color. Route sheets rise above the shared definitions they use; native radios select the real, selectable stylesheet. Their leaves stack more closely on phones to retain the whole shadow. The impact graph follows definitions → classes → files → output through glass reading lanes, flowing down on narrow cards. The phone lanes become low glass shelves, with a deeper shared face beneath the two rows of files. The output rests on a compact, centered shelf that leaves the play control clear of its contour. Its outer nodes reserve space for the full cast shadow and keyboard ring. On phones, inputs to the central file converge above the outer files; their outputs converge below it, keeping connections clear of unrelated nodes.
- Gold belongs to the brief traveling head, its small arrival socket and the active connection. It does not tint the glass. `workflow-signal.ts` measures the same rounded or cubic path used by each wire. Short, smooth velocity shoulders lead into a steady cruise and quiet stop. The tapered wake samples the head's earlier positions, stretching in flight and gathering into the socket before the arrival ring fades. Framework signals pass through source, integration and logo in order, with each glass layer refracting its own incoming flight. Surface wires turn in the open gutters, clear of the original marks including their brand scales. Travel time follows the measured route length; the socket, reflection and logo catch the light on contact. The monorepo destination socket also waits for its local signal. Reading or choosing a guide reveals its settled destination and retains that light until the next choice. Definitions use body ink on the glass; lower-row connections rise through the center gutter on phones. Pointer drift moves an object and its contact together, so labels and wires share the same coordinates.
- Route segments use three equal seats with a compact continuous track and a sliding insert. The slash route keeps the same proportion as the longer paths. Native radio targets extend beyond the painted height to retain 44px hit areas; enlarged text stacks them without overlapping targets. CSS keeps selection and the insert working without JavaScript, and reduced motion removes the slide.
- Each drawing loads near the viewport, chooses its arrival time from the first paint, then sleeps until its next state. Short routes can rest earlier than long ones. That cadence stays fixed for the choice, so responsive reflow cannot dim an arrived logo or replay its light. Pointer, keyboard focus, explicit pause, hidden tabs and offscreen scenes stop the clock. Reduced motion keeps a still drawing with working controls; native content remains visible if Canvas cannot load or loses its context. Restoring the context preserves the selected route. Enlarged base text and forced colors use that native layout, with no clipped labels. Each drawing has its own pause control; backing stores cap at 2× density and two million pixels.

## The call to action

The close centers on the hero's axis, open on the page ground. A quiet opening line leads to a large, two-line destination and the two ways in (Get started, and the install command). Typography carries the invitation; below it, one gold point opens into a field of fine curved threads, an ordered surface growing from one starting point. A halo on the invitation extends behind the actions with transparent edges; the canvas has no background, so text and light share one space without a horizontal seam. The field fades into the ground before the footer. The command sits on a solid sheet; below 40rem the actions stack at one shared width, including the command's island wrapper. The full command stays on one line down to 320px and wraps when text is enlarged.

The 2D canvas loads only near the viewport, reveals once in 1.8 seconds, then sleeps. A passing pointer lifts and lights the nearby threads; a tap sends one finite wave. Keyboard focus brings the same light below the chosen action. The root stays anchored, every response settles, and offscreen or hidden scenes stop drawing. Reduced motion shows the complete still field; forced colors and print omit the drawing. The native heading, guide link, command and CSS starting point remain available without JavaScript or Canvas. Backing stores cap at two million pixels and 2× density.

## The footer

The homepage closes on its own footer (`HomeFooter`), an open colophon held by whitespace. Four equal navigation columns span the content width: Docs, Resources, Community and More, with quiet mono headings and generous link hit areas. Community uses the same text links as the other groups; there is no separate logotype or social icon strip. Phones arrange the groups in two columns and two rows. A single hairline separates navigation from the copyright and grouped legal links. All text in this bottom row is 12px; theme and language are native selects with icons and explicit accessible names, styled as quiet text without borders or hover fills. Links underline on hover, every control has a visible keyboard focus ring, and reduced motion removes transitions. The drafting rails continue from the page and fade. A lightly engraved wordmark spans the content column as a background behind the navigation, centered within the footer without adding height; the solid base row covers any overlap. It ignores pointer input and stays hidden from assistive technology. The docs keep the shared footer.

## Figures under the pointer

Looping figures hand over to the reader: pointing at a figure holds it in its revealed state (the completion menu, the hover card, the color picker, the quick fix), and keyboard focus does the same. In the editor stage every class in the file is a target, and the card shows the hover the language service returns for it. Dragging the theme preview's divider tints the token value in use in the card beside it. In Trace a change, pointing at or focusing a node traces its dependencies and dependents in Canvas, and a click pins that relation. Unrelated connections quieten while every label stays readable.

## Tours

A figure with several states tours them on its own while it is in view: the lint bench plays each rule's check, and the rendering section plays each mode on its four-moment timeline, moving the focus from station to station, with a segment that fills toward the next moment and a play button that pauses it. A hairline on the chosen item fills toward the next one. Pointer or focus inside the figure pauses the tour; choosing an item ends it. Under reduced motion there is no tour and the first state stays.

## Stable figures

Animated figures reserve the space of their largest state. Editor panes keep a docked problems panel and room for the longest diff, so a loop never moves the content around it. Every section is held to this: its height must not change while its figures run, measured through a full tour at 1440, 1024 and 390. Hover never changes a control's size either; a link's arrow moves, the link does not.

## Motion

- Easing: `--home-ease` for arrivals and responses, `--home-ease-inout` for loops.
- Durations: `--home-quick` (hover, press), `--home-base` (state changes), `--home-slow` (reveals). Ambient loops run 8 s or longer.
- The hero's pill, lead and actions arrive in reading order, rising 20px out of a 6px blur. The heading keeps its measured position as the white glass forms over 640ms, while the silk fades in behind it over 2.4 seconds.
- Below the hero, every header line and card rises as it scrolls in on a view timeline, so the stagger comes from position, not timers. Interactive figures pause when off screen.
- Under `prefers-reduced-motion: reduce`, loops stop and figures show their finished state.
- Write animations with longhand properties when a value uses a route variable; a variable inside the `animation` shorthand makes the build keep every preset keyframe.

## Depth

3D is used to separate meaning into planes, never as a gimmick:

- The hero silk is lit as a surface: folds catch a sheen and a glint from one light, and the pointer moves that light.
- The cascade layer figure explodes `@layer theme, base, defaults, components, utilities` into orthographic planes, so flat callouts beside it rise with their planes and stay level.
- The palette card's well holds extruded bars on a hatched floor plate, as tall as each swatch's oklch chroma; they rise in a diagonal wave on scroll and flatten into a table under the pointer or keyboard.
- The MCP figure stands liquid-glass client marks and the server on a wide, low, dial-rimmed floor of real classes; narrow widths tilt less.

Perspective is `--home-perspective`. A plane that carries content to read tilts less than 20° and settles flat. Diagram planes may tilt further when they only carry short labels, and anything longer turns to face the reader.

## Matrix

Rows of real classes from `ctaClassRows` (`glyphFieldLines`), which the tests lint, are the one place the page shows classes as texture: the floor of the MCP figure, the project the server reads. Nothing else uses classes as decoration.
