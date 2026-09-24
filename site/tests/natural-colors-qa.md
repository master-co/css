# Natural material colors — validation record

Reviewed on 2026-09-24 with Node 24.20.0 on macOS. The eight families add 104 fixed
colors and 16 mode-aware variables (base hue and text hue for each family).

## Design and compatibility

- Sand is golden; taupe is a quieter red-brown gray. Olive, sage and moss remain
  yellow-green, gray-green and fuller leaf green respectively. Petrol provides a
  cool mineral counterpoint; copper and terracotta separate golden warmth from red clay.
- Each of the thirteen OKLCH triples is explicit in the preset source. There is
  no runtime interpolation, new dependency, or color-analysis code in the runtime.
- The former 476 compiled variables are unchanged, including the existing 286
  palette colors and all existing mode aliases. A before/after comparison of their
  complete manifest records found no differences. No old colors required correction.
- `olive` intentionally changes from the CSS named color to the preset alias in
  classes such as `fg-olive` and `bg-olive`. `#808000` preserves the original color.
- `theme.css` remains the public entry and imports the internal `colors.css`.
  Fresh Rust compilation agrees with the checked-in manifest; native CSS is unchanged.

## Color measurements

All 104 colors fit Display P3. Only `petrol-60` and `petrol-70` are outside sRGB.
The largest original-to-mapped difference is 0.00179 ΔEOK. Both the authored and
CSS-mapped sRGB palettes have strictly decreasing OKLCH lightness.

Per-interval ΔEOK is divided by the numbered interval, so five-step intervals are
not treated as ten-step intervals. These palettes are guarded between 0.003 and
0.012 ΔEOK per numbered unit, with at most 5° of authored hue change between
neighbors and less than 3° of hue change after mapping. These are project design
bounds, not universal perceptual or accessibility thresholds. Pairwise comparisons
at 30, 50 and 70 also guard against converging material families and duplication of
their nearest existing families.

Minimum WCAG 2 contrast across the corresponding base, muted, raised and overlay
surfaces, calculated **after CSS gamut mapping to sRGB**:

| Family | Light text step | Minimum | Dark text step | Minimum |
| --- | ---: | ---: | ---: | ---: |
| sand | 60 | 4.71:1 | 30 | 6.94:1 |
| taupe | 60 | 5.63:1 | 30 | 6.37:1 |
| olive | 60 | 4.65:1 | 30 | 7.01:1 |
| sage | 60 | 5.01:1 | 30 | 6.71:1 |
| moss | 60 | 4.80:1 | 30 | 6.70:1 |
| petrol | 60 | 5.45:1 | 30 | 6.45:1 |
| copper | 60 | 4.62:1 | 30 | 6.72:1 |
| terracotta | 70 | 6.45:1 | 30 | 6.58:1 |

Terracotta 60 scored 4.4463:1 on the light muted surface, so its light text alias
uses 70. The tests compare unrounded values with 4.5; the table rounds for reading.
These results do not promise contrast on custom surfaces or after applying alpha.

## Visual review

The complete authored palette and sRGB version were reviewed on light and dark
canvases beside stone, gray, brown, orange, lime, green, teal and slate. The color
guide adds architecture, natural living and boutique object compositions using
actual preset classes, with independent light/dark documents.

Playwright checks covered 1280px Chromium and 390px WebKit in both host appearances:
104 visible color values, real clipboard copying in Chromium, keyboard focus,
six independently themed specimens, resolved SVG paints, no horizontal overflow,
and no page errors. Screenshots were inspected at desktop and phone sizes.

The review HTML includes a dark canvas switch, a CSS-mapped sRGB switch, existing
family comparisons and the contrast table. Generated files live under
`site/test-results/natural-colors/`; they are not committed.

**Limitation:** screenshots and numerical gamut checks do not establish calibrated
Display P3 hardware accuracy. No calibrated wide-gamut monitor inspection is claimed.

## Validation

- Preset: build, lint and type-check passed; 38 tests passed.
- Public CSS package: 76 tests passed.
- Color analysis: 10 tests passed.
- Site: prepare-app and type-check passed; Reference's 20 tests passed.
- Browser matrix: 8 tests passed across Chromium and WebKit.
- Runtime bundle size guard passed. Source/context budgets passed earlier; the
  final rerun reports an unrelated concurrent change in
  `packages/language-service/tests/shiki.test.ts` at 1,012 lines (limit: 1,000).
  All files added by this color change remain within their source budgets.
- Site lint: changed files and the complete site source both passed.

The initial whole-site lint run was stopped after 23 minutes: profiling showed
manifest discovery repeatedly scanning the ignored `.master` CSS cache. The same
`eslint .` command, configuration, dependency versions and current source files
then passed in an isolated source copy without ignored build caches. No lint rules
were disabled or relaxed, and the active development server was left running.

The initial browser run caught an unsupported WebKit clipboard permission in the
new test; copying is now checked through real Chromium clipboard access, with
palette rendering and focus checked in both engines. Concurrent edits to unrelated
code-block components briefly caused development-server errors; a subsequent
complete browser matrix and site type-check passed.

## Payload measurement

The runtime was rebuilt before and after the change with the same local toolchain.
Compression uses Node zlib, gzip level 9 and default Brotli options.

| Artifact | Raw before → after | Gzip before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| Default manifest | 82,513 → 90,882 B | 11,594 → 12,839 B | 9,374 → 10,265 B |
| Runtime global JS | 50,629 → 50,629 B | 14,198 → 14,198 B | 12,730 → 12,730 B |

Manifest cost: +8,369 B raw, +1,245 B gzip, +891 B Brotli. JavaScript is unchanged.
The manifest has 120 additional variable records to load/index; engine CPU and
heap were not benchmarked, and no performance improvement is claimed. Generated
CSS tests verify that unused colors are not emitted.

## Reproduce

Run from the repository root:

```sh
pnpm --filter @master/css-preset build
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset lint
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css test
pnpm --filter site exec tsx --test scripts/natural-colors-audit.test.ts
pnpm --filter site prepare-app
pnpm --filter site test:reference
pnpm --filter site lint
pnpm --filter site type-check
pnpm --filter @master/css-runtime build
pnpm run check:runtime-size
pnpm run check:ai-context
```

The browser matrix above used a running site at `http://localhost:3000`. Its
dogfood suite has since been removed, so the commands above reproduce only the
remaining checks. The review can be generated with:

```sh
mkdir -p site/test-results/natural-colors/review
pnpm --filter site exec tsx scripts/natural-colors-audit.ts > site/test-results/natural-colors/review/audit.json
pnpm --filter site exec tsx scripts/render-natural-colors-report.ts > site/test-results/natural-colors/review/palette-review.html
```
