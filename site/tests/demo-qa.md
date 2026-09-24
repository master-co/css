# Demo design system verification

The site owns the shared demo components, semantic theme roles, Reference scenes,
and MDX registration. No dependencies, preset semantics, public package APIs, or
shared `internal` submodule sources were changed for this work.

## Coverage

- 183 utility Reference pages, 709 third-level teaching headings and two standalone
  second-level teaching sections: 711 individually mounted scenes.
- `components/demo/reference/coverage.ts` records reviewed stable section IDs.
  The coverage test resolves MDX includes, checks every heading and mounted scene,
  and compiles all specimens with the public native renderer.
- Nine scene families are indexed in `/design-system`, with links to real Reference
  examples. The gallery also documents primitives, variants, composition, controls,
  layout constraints, code presentation and existing benchmark charts.
- Existing MDX and TSX demos use the site library. The MDX adapter removes shared
  auto-imports that would otherwise override the provider. Browser frames and
  installation previews use the same chrome while retaining native iframe and
  existing resize behavior.

## Remaining checks

Run from the repository root:

```sh
pnpm --filter site clean:next
pnpm build:site
pnpm --filter site exec tsx --test \
  components/demo/reference/reference-demo.test.ts utils/demo-mdx.test.ts
pnpm --filter site lint
pnpm --filter site type-check
pnpm --filter site prepare-app
pnpm --filter site test:reference
pnpm --filter site test:docs-examples
pnpm --filter site test:llms
pnpm --filter site test:syntax
pnpm --filter site test:css-contract
pnpm run check:ai-context
```

The browser suite used for the results below has since been removed. A clean Next
build was needed during the original review because incremental builds after
development occasionally omitted the emitted Master CSS manifest asset.

## Browser checks

Completed on 2026-09-22:

| Check | Result |
| --- | --- |
| Utility page matrix | 732 / 732 passed (183 pages × four viewport/theme projects) |
| Final behavior, migration and affected-media regression | 122 passed; two duplicate mobile screenshot cases intentionally skipped |
| Final cursor/order syntax-preview regression | 8 / 8 passed |
| Explicit representative captures | 42 images: seven routes × three widths × two themes |
| Production HTML migration scan | 1,145 routes; no rendered `demo`, `box`, `app-box` or `bg:stripe` classes |
| Scene compilation and MDX registration tests | 5 / 5 passed; all 711 scenes compiled |
| Reference / docs examples / llms / syntax tests | 13 / 6 / 13 / 14 passed |
| Lint | Passed, zero errors; 63 existing warnings remain |
| Type check / prepare-app / full site build | Passed |
| CSS contract | Passed; 132 hydration contracts, 1,667 generated rules, 1,902 exact CSS segments |
| AI context budget / whitespace validation | Passed |

The full matrix was followed by scoped regressions after fixing legacy MDX
imports, browser chrome, media fitting, and the last two syntax-table previews.
Generated screenshots and traces live under `site/test-results/`, which is
excluded from lint alongside the other generated browser reports.

The matrix uses Chromium at desktop and mobile sizes in both light and dark modes.
Every utility page loads and reveals every lazy iframe, checks page errors, console
errors, failed local responses and document overflow, and records a full-page image.
The gallery and six representative Reference routes also have 390, 768 and 1280px captures.

Behavior checks cover side-specific float clearing, flex growth, named grid areas,
fixed/sticky scrolling, native hover/theme/media/print conditions, accessible names
and descriptions, keyboard scroll and range controls, live size measurements,
image aspect ratios, animation replay and reduced motion. Print media is exercised
using the browser's actual media emulation; the UI opens the native print dialog.
Browser validation covers Chromium; platform-specific rendering and native print
dialog presentation remain browser/OS dependent.

## Intentional corrections

- Corrected the `clear` descriptions and right-float clearing snippet.
- Applied `grid-auto-columns` to the grid container.
- Used CSS space escapes in quoted `grid-template-areas` rows so their names match
  the demonstrated child regions.
- Fixed the caret-color MDX paragraph boundary that caused hydration errors.
- Allowed generated syntax declarations to wrap on narrow screens.
- Corrected the obsolete font-family guide link.
- Media comparisons retain the same sizing classes and reset only the property
  under comparison. The SVG artwork does not introduce a second fitting policy.

## Historical dogfood limitations

The former full dogfood suite reported six failures, representing three assertions
in both viewport projects. Those checks were not weakened:

1. The prose cascade test selected the hidden `Overview` heading, whose margin was
   zero, while expecting the visible heading's desktop/mobile margin.
2. The inline color test compared equivalent white colors as different serialized
   strings: `lab(100 0 0)` and `oklch(1 0 none)`.
3. The layer test looked for the obsolete heading “How layers control the cascade”.

The updated semantic demo test passed. The complete dogfood run finished
with five passes, these six failures, and one intentionally skipped case. The
remaining lint warnings concerned existing canonical names and class ordering.

## CSS contract review

Reviewed the production manifest and hydration rules against the previous snapshot,
and inspected browser output before updating `css-contract.snapshot.json`:

- Zero changed definitions among existing utility rules.
- Sixteen newly used utility classes, for the gallery, semantic demo colors,
  specimen geometry and responsive syntax wrapping.
- 250 classes no longer needed in document hydration manifests after replacing
  legacy chrome and moving specimens into independently compiled iframe documents.
- Thirteen new theme definitions: eleven demo color roles, radius and grid size.
  Existing variable definitions are unchanged. Additional mode entries come from
  the site demo theme declarations; other manifest settings are unchanged.
- Shared component CSS now owns the neutral grids, surfaces, annotations, focus
  states, browser chrome and control presentation.

This review is the QA reference for the updated CSS contract baseline.
