# UI texture integration verification

This integration pins `@master/ui@0.0.5`, `@master/internal-site@0.2.12` and `@master/internal-skills@0.1.6`.

## What changed

- Master UI 0.0.5 adds the `texture` component and one theme token, `--color-texture` (the strong line ink). The site's Project Manifest gains that token; it is the only change in the CSS contract. Every one of the 2246 deduplicated CSS segments and 58 delivery contracts is otherwise unchanged in count.
- Internal site 0.2.12 draws documentation stages (`Demo background="dots" | "grid" | "stripes" | "checkerboard"`) with UI's texture classes in the hairline ink instead of hand-written gradients. `--stripe-image` keeps its 8px tile and .5px lines, now written as UI's stripes recipe; `--ui-hatch` draws the same .5px stripes in the texture ink.
- The homepage token pane sets `--code-padding-x` to its inset instead of removing the code block's inline padding, so its text no longer sits on the pane's edge (each UI code line bleeds by that padding and pads its text back in).

## Measurements

- `test:css-contract`: only `projectManifest.value.theme[5].children[17].name` moved, `color-text-strong` to `color-texture`, from the inserted token.
- `test:style-delivery`: routes that load stage styles grew by up to 237 gzip and 237 Brotli bytes (the texture stylesheet); other routes grew by 4 bytes for the token. Ceilings are the exact measured values.
- Homepage token pane, production markup with the corrected rule applied: first line box at the pane's left edge, its text 16px in, tinted lines meeting both edges, the share label 16px from the right edge.
