# Master CSS brand assets

Approved artwork from the Master brand identity v2. The source revision and SHA-256 of every imported asset are recorded in `manifest.json`. SVG paths and gradient stops are copied without modification.

## Choose the artwork

| Use | File |
| --- | --- |
| Header or horizontal signature | `logo/master-css/master-css-horizontal-on-light.svg` or `-on-dark.svg` |
| Standalone mark, at least 24px high | `logo/mark/master-mark-on-light.svg` or `-on-dark.svg` |
| Mark from 16px to below 24px high | `logo/mark/master-mark-small-on-light.svg` or `-on-dark.svg` |
| Stacked signature or lettering alone | `logo/master-css/master-css-stacked-*.svg` or `master-css-wordmark-*.svg` |
| Single-color reproduction | Supplied `*-black.svg`, `*-white.svg` or `master-mark-gold.svg` |
| Dimensional artwork, mark at least 64px high | `logo/mark/master-mark-dimensional-*.svg` or `logo/master-css/dimensional/` |
| Favicon | `icon/favicon.svg` (follows the system color scheme) and `icon/favicon.ico` |
| App icon or avatar | `icon/` and `icon/png/` |
| Social sharing | `social/master-css-*.svg` and `social/png/` |

Choose `on-light` for light backgrounds and `on-dark` for dark backgrounds. Both use a continuous vertical gold gradient with soft wing shading. The central ribbon runs from champagne `#FDE2A7` on light backgrounds or `#FCDD98` on dark backgrounds to `#E6B65D`; the wings start at `#EDC374`. Preserve every intermediate stop in the supplied SVG.

## Proportions and space

The standard mark canvas is `216.6 × 120`. The horizontal Master CSS signature canvas is `1197.53 × 130.26`. Preserve these proportions, including when reserving image dimensions in a page.

Leave half the mark's height around a standalone mark. Leave one wordmark x-height around a complete signature; the mark is 1.3 times that x-height. Use the horizontal signature at least 16 CSS pixels high, or 25mm wide in print. Use the small mark at least 16 CSS pixels high. Dimensional artwork is for large applications, with the mark at least 64px high; use flat artwork for headers and favicons.

## Refresh the repository copies

The canonical artwork is maintained in the Master repository under `brand/`. Edit its source generators there and commit the approved brand changes. To refresh the product copies, run these commands from the Master CSS repository root:

```sh
python3 site/scripts/sync-brand-assets.py --source /path/to/master
python3 site/scripts/sync-brand-assets.py --check
bun run --filter site prepare-app
bun run --filter site build:llms
```

The importer updates this download kit, the site's existing image URLs, its favicon, example copies, and the VS Code icon. `/images/logo.svg` retains the dark-background standalone mark; choose an explicit background variant from this kit for new placements. `/images/css-logotype@light.png` is the supplied 2× PNG used to render page sharing images. The source checkout is needed only for importing; verification works from the committed files alone. Keep generated files intact. This document is maintained in the Master repository at `site/content/brand/master-css/assets.md`; the product importer copies it into the download kit. Shared artwork supplied by `@master/internal-site` must be updated through a new package release before importing changed artwork into Master CSS.

## Usage policy

“Master CSS”, the logo and associated marks are trademarks owned by Aoyue Design. Use the supplied artwork to refer to the project or show integration, preserve its proportions, and do not imply official endorsement. Do not alter its colors, shape or orientation, add effects, or place it on merchandise without written consent. The complete policy is at https://master.co/brand/master-css#trademark-policy.
