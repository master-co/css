# Visual language

## Reference and status

An illustration is drawn in the site's own interface vocabulary: [`site/styles/system/DESIGN.md`](../../../../site/styles/system/DESIGN.md) (Moonstone / Obsidian) and its [tokens](../../../../site/styles/system/tokens.css). At the desktop article width the figure should be indistinguishable in kind from the UI around it: the same zinc surfaces, hairline contours, small radii, light regular Geist and converged shadows, at the same sizes. Read DESIGN.md before drawing; when it changes, the figures follow it through the shared tokens.

The user's earlier refinements still hold: **no background grid**, few labels and frames, strong alignment, deliberate spacing, and an engineering-drawing character. The user later rejected the first set (600 × 400 canvases with 20px labels, a grey canvas and resvg shadows) because, enlarged to the article width, its text and objects were far larger and heavier than the interface. [Hydration](../../../../site/assets/images/rendering-modes/source/hydration.ts) demonstrates the 1:1 material and scale; it is not a mandatory composition or proof that every existing diagram is finished. Later refinement asks for more precise visual meaning, with colour allowed when it helps explain the subject.

## Scale

The scene is **720 × 480** logical pixels: the wide media column is 720px and the figure shows at 648–720px inside its tray from tablet to desktop (712px at 1440, 648px at 1280 beside the contents rail), so 1 scene pixel ≈ 1 CSS pixel. Use interface sizes, never sizes chosen to survive scaling. Phones scale the same composition down; keep labels few and short, and rely on the HTML text description there. Do not enlarge the type or add a mobile variant.

## Material

Everything is painted by `--ui-*` tokens through [illustration.css](../../../../site/assets/images/rendering-modes/source/illustration.css); never write a raw colour or shadow into a scene.

- **Ground** — the figure is the tray's stage: `--ui-stage-light` over `--ui-surface-stage`. It has no frame of its own; the tray's ring is the example's one edge.
- **Artifact** (`sheet`) — a file, document, manifest or output: the sheet face, `--ui-elevation-rise-1`, radius 10, 13/16px insets. An icon and a title head it; content is a note, code lines or placeholder bars.
- **Operation** (`chip`) — a step that acts on artifacts: a control-sized chip like `ui-button` at rest (32px, radius 6, medium 13.5px, icon + verb).
- **Outcome** (`mark`) — an icon beside a title with no frame.
- **Place** — two places (build and browser, build time and request time) are parted by one `divider` hairline with an eyebrow over each side. Do not draw a filled zone or frame around a group: a tray and its stage are already two layers, and nothing inside may form a third.
- **Window** — only when the browser page is the subject: one contour, a tray-tone toolbar with its dots, no address.

Keep artifacts and operations distinguishable by shape even when colour also helps. These primitives are useful conventions, not an exhaustive list of subjects: draw a control, spacing guides, a code annotation or another faithful specimen when that communicates the lesson more directly. Preserve the same material ladder without turning every subject into a sheet.

## Colour with a purpose

The site's neutral chrome does not require an entirely monochrome explanation. Use colour when it makes a meaningful distinction easier to follow: the locally overridden area, related parts of a class and rule, two scopes, or a path that needs to stand apart. Choose the smallest useful palette; a figure may need one accent, several labelled categories, or none. Do not give every card a different hue by default.

Use theme-aware `--ui-tone-*` roles for explanatory annotations and the existing code roles for ordinary syntax highlighting. Keep a role's meaning consistent within the figure. Pair it with position, a label, a pattern or a boundary so the meaning survives without hue. Status colours and brand gold must not acquire unrelated meanings through decoration.

Distinguish the teaching subject's actual colour from an annotation. A blue padding band does not mean `px-lg` adds a blue background: mark it as an inspection guide in the caption and text equivalent, and confine it to the measured area. When the lesson is a real colour value, use that verified value for the specimen rather than substituting an annotation tone.

Use light washes to expose an area and firmer ink for its edge or label. Check the dark variant independently: equal alpha does not guarantee equal perceived prominence. Coloured accents should clarify the reading order without making the neutral shared structure disappear.

## Refine the drawing

Precision is visible in alignment and attachment, not additional ornament. Match comparison baselines, content widths and optical centres; align a ruler's endpoints with the dimension it measures. Connectors must start and end at meaningful locations, with coherent turns and clear corridors around labels. Route length should serve the relationship rather than decorate unused space.

Establish a focal subject, supporting relationships and quieter annotations. Use ink, placement and selective colour before making type larger or heavier. Remove repeated labels and redundant frames; keep enough local detail for the subject to remain recognizable. Judge whitespace around the actual subjects, not just around their bounding boxes. Refine contours and shadows after this hierarchy works.

## Type

Geist at the site's weights (`--ui-weight-regular` is 350 in English): object titles 14px medium in strong ink; notes 13px regular muted (`body` ink for a stated result); edge labels 12px muted; code 12.5px IBM Plex Mono; place captions as eyebrows (11px medium capitals tracked .14em). Keep labels horizontal and sentence case. Keep identifiers exact; long conditions go beside the edge they qualify, never inside a small object.

Icons are the Tabler outline set the interface uses, 16px at stroke 1.75, in muted ink. Choose one meaning per icon across the set (`fileCode` for CSS sources, `file` for outputs and pages, `cpu` for the engine, `layers` for definitions).

Keep identifiers intact when annotating syntax: contiguous spans may carry separate tones, but must not insert spaces or alter punctuation. A source fragment is the primary evidence; remove redundant copies in callouts when direct attachment already establishes the mapping. Avoid icons whose only role is to fill an otherwise unnecessary title bar.

## Paths

- One hairline (`--ui-line-mark`, arrowed paths `--ui-text-disabled`) with an 8px chevron head, ending 2px short of its target. Join a branch with a short arrowless segment; round turns with an 8px radius.
- A solid line is the main flow. Dash a path only for a labelled condition or a compile-time reference; dashes carry no universal meaning.
- Give each arrow a visible shaft (at least ~20px) and the correct tangent, and give edge labels a real corridor clear of lines and objects.
- An anatomy leader has no arrowhead: it identifies a range rather than an action or transfer. Match the source bracket and annotation's tone, and derive its attachment from measured content bounds. Keep muted colour mixes in a colour space that preserves the intended hue; inspect the actual output rather than assuming a neutral mix stays neutral.

## Themes and display

Light and dark share labels, objects and geometry; only the tokens differ, so dark mode is the design system's obsidian, never an inversion.

The image fills the tray's media width at every screen size and scales proportionally. Illustrations inside a tray are excluded from the prose media outline (`site/styles/docs-shell/prose.css`): the stage is told apart by tone. Other article `<img>` and `<video>` keep that inward 1px outline at 10% opacity; do not bake a perimeter into the image.
