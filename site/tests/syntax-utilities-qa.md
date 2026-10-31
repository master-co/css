# Short utilities, atomic ordering and syntax migration

Scope: the preset gains 143 single-declaration fixed utilities, 100 direct-value functions such as `m(4)`, `b(1)` and `grow(1)`, and the `truncate` recipe. Within a layer tier, generated rules sort recipes, then single-declaration utilities by property family and coverage, then native declarations. Site, examples and documentation classes move from native declarations to the equivalent short utilities where the preset has one. Language version is 18 and binding ABI 31, after the base commit's ABI 30 and program 2.

## Exact CSS delivery review

Three production captures were compared, each from `bun run build:site` in its own checkout on 2026-11-01: the approved snapshot (cited approval `interior-redesign-qa.md#exact-css-delivery-review`), the frozen base `960cef42e`, and this change.

Differences between the approved snapshot and the base predate this change and are not part of it:

- Routes 448 → 366: the 88 per-package reference pages were consolidated into `/reference/packages`, and `/reference/packages`, `/reference/tools/cli` and `/reference/tools/mcp` with their `/tw` copies were added.
- Exact CSS segments 3,709 → 3,672, with 982 added and 1,019 removed. They include the keyframe slot wrappers that `960cef42e` removed (66 segments containing `master-css-keyframe` → 0) and `--opacity-media-ring` from `site/styles/docs-shell/materials.css`, recorded as pre-existing in `docs-quality-review.md`.
- The project manifest grew from 247,899 to 292,083 bytes at language version 17.

Differences between the base and this change:

- Routes 366 → 370: `/reference/direct-values` and `/reference/truncate`, plus their `/tw` copies.
- Unique segments stay at 3,672; 108 are replaced. After removing the generated class selector and normalizing `calc(N * 1px)` to `Npx`, 107 replacements keep the same scope and declarations, for example `.\(top\:0\){top:0}` → `.top\(0\){top:calc(0 * 1px)}`. The remaining one is `truncate`, which replaces `(text-overflow:ellipsis)` and its two companion declarations in the same scope.
- All 366 common route deliveries change. 180 deliver the same normalized rules in a new order: single-declaration utilities now precede native declarations. The other 186 also gain one `margin:0` rule, because the docs footer's invalid legacy class `m:0` became `m(0)`; the heading's computed margin was already zero from the preset base reset.
- The project manifest grows from 292,083 to 439,243 bytes and moves to language version 18 with 463 preset definitions.

Browser evidence: the base and changed dev servers were compared element by element on 22 routes, covering every element outside code samples and 37 layout, box, border, text, overflow, flex, color and order properties. Routes: `/`, `/design-system`, the syntax tutorial, the sizing, layout-system, spacing, style-declarations, colors, cascade-layers, typography, introduction, responsive-design, containers, elevation, view-transitions, motion, state-selectors, corner-radius, code-linting and Tailwind migration guides, and the layout-system and responsive-gallery examples. Every compared value matched. The only exceptions were home agent animations, whose values differed between repeated runs, and an element-index shift on the syntax tutorial, where a new `<strong>` in rewritten prose moved later elements. Runtime e2e passed 418 tests in Chromium and WebKit, including atomic ordering under LTR, RTL and `vertical-rl` writing modes. The new `truncate` reference demo was checked visually and shows the ellipsis.

Approved after reviewing the three-way delivery comparison, the semantic segment mapping and the browser evidence on 2026-11-01. The snapshot update cites this section. The verifier is unchanged.

## Known conditions

- `test:assets` reports `images/contents.svg` as unreferenced in both the base and this change.
- Firefox e2e was not run locally.
