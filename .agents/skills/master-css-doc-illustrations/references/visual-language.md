# Visual language

## Reference and status

An illustration is drawn in the site's own interface vocabulary: [`site/styles/system/DESIGN.md`](../../../../site/styles/system/DESIGN.md) (Moonstone / Obsidian) and its [tokens](../../../../site/styles/system/tokens.css). At the desktop article width the figure should be indistinguishable in kind from the UI around it: the same zinc surfaces, hairline contours, small radii, light regular Geist and converged shadows, at the same sizes. Read DESIGN.md before drawing; when it changes, the figures follow it through the shared tokens.

The user's earlier refinements still hold: **no background grid**, few labels and frames, strong alignment, deliberate spacing, and an engineering-drawing character. The user later rejected the first set (600 × 400 canvases with 20px labels, a grey canvas and resvg shadows) because, enlarged to the article width, its text and objects were far larger and heavier than the interface. The current set implements the 1:1 direction; [Hydration](../../../../site/assets/images/rendering-modes/source/hydration.ts) is the reference scene.

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

Separate artifacts from operations by shape, not by colour. The interface is monochrome; hue belongs to teaching specimens only, and brand gold never appears in a documentation figure.

## Type

Geist at the site's weights (`--ui-weight-regular` is 350 in English): object titles 14px medium in strong ink; notes 13px regular muted (`body` ink for a stated result); edge labels 12px muted; code 12.5px IBM Plex Mono; place captions as eyebrows (11px medium capitals tracked .14em). Keep labels horizontal and sentence case. Keep identifiers exact; long conditions go beside the edge they qualify, never inside a small object.

Icons are the Tabler outline set the interface uses, 16px at stroke 1.75, in muted ink. Choose one meaning per icon across the set (`fileCode` for CSS sources, `file` for outputs and pages, `cpu` for the engine, `layers` for definitions).

## Paths

- One hairline (`--ui-line-mark`, arrowed paths `--ui-text-disabled`) with an 8px chevron head, ending 2px short of its target. Join a branch with a short arrowless segment; round turns with an 8px radius.
- A solid line is the main flow. Dash a path only for a labelled condition or a compile-time reference; dashes carry no universal meaning.
- Give each arrow a visible shaft (at least ~20px) and the correct tangent, and give edge labels a real corridor clear of lines and objects.

## Themes and display

Light and dark share labels, objects and geometry; only the tokens differ, so dark mode is the design system's obsidian, never an inversion.

The image fills the tray's media width at every screen size and scales proportionally. Illustrations inside a tray are excluded from the prose media outline (`site/styles/docs-shell/prose.css`): the stage is told apart by tone. Other article `<img>` and `<video>` keep that inward 1px outline at 10% opacity; do not bake a perimeter into the image.
