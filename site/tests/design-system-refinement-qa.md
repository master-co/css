# Design system refinement QA — 2026-09-23

This record covers the reviewed site-only demo and documentation UI changes. The 183 committed utility Reference documents and the original Guide page structures were not edited in this round.

## Visual and behavior review

- Reviewed each changed shared component on its comparison page with the original, previous, and adopted versions plus a real Guide or Reference example. Checked 390, 768, and 1280 CSS-pixel widths in light and dark modes, including controls, focus, disclosures, scrolling, and reduced motion where relevant.
- The shared `Demo` canvas retains the neutral fine diagonal stripe. The Spacing Guide still shows its original pink stripe and has no page overflow at 390, 768, or 1280px.
- The production Design System initially overflowed at 390px because the benchmark gallery's implicit grid track expanded to the long label. The final build constrains the gallery and chart tracks, wraps that label, and reports zero page overflow at 390px. Reference `clear` loads its four real demos without mobile overflow.
- The 183 utility routes were audited against their authored section IDs in desktop/light, desktop/dark, mobile/light, and mobile/dark browsers: 40 batches passed, checking response, heading, ordered demos, page overflow, and browser errors.

## CSS contract review

The reviewed snapshot has 1,216 static routes, 135 hydration contracts, 1,603 generated rules, and 1,822 exact CSS segments. Compared with the previous 1,147-route snapshot, 69 review/demo routes were added and none removed. The global manifest hash is unchanged. All 1,291 common class names have identical generated rule text; 310 new classes support the authored demos and 9 obsolete classes are no longer used. No parser, preset, or public CSS semantics changed. `--radius-lg: .5rem` moved out of repeated inline theme CSS but remains in the shared production stylesheet with the same value.

## Validation

- `pnpm build:site` passed after clearing a stale `.next` production cache that referred to a missing generated `.master` CSS entry.
- Site lint passed with 0 errors and 31 pre-existing class-style warnings. Changed files were also linted after the final source edits.
- Site type-check, `test:reference` (20), `test:docs-examples` (13), `test:llms` (32), `test:css-contract`, and `check:ai-context` passed.
- Demo dogfood passed across desktop and mobile light/dark projects (42 passed, 2 platform-conditional skips). Benchmark dogfood passed across desktop, tablet, and mobile light/dark projects (12 passed); the latter checks the preserved Guide chart controls and data expansion separately from the new Design System chart gallery.
- Design System dogfood checked all 87 recipe disclosures, visible shared-demo iframes, keyboard operation, anchors, and document geometry in six desktop/tablet/mobile light/dark projects. Eleven cases passed in the full run; the final tablet/dark gallery case passed on focused rerun after accounting for the same fixed sandbox notice on its initial `about:blank` frame. The two original Guide representative pages (`guide/spacing` and `guide/installation/nextjs`) passed the four desktop/mobile light/dark checks (8/8).
- The first monolithic mobile/dark utility audit hit its 20-minute test limit while opening the next page. Splitting the same checks into 20-page batches produced the passing 40-batch result above.
- Initial demo and benchmark dogfood runs used stale assertions from the discarded Guide refactor (`.demo-measure-line`, `details.benchmark-data`, and a new page-CSS meter). Their final runs pass against the approved component interfaces and the original Guide controls. A test-harness attempt to inject script into the deliberately scriptless syntax-tutorial iframe is filtered by its exact browser message; other console and page errors remain failures.
- The Guide composition dogfood selector was also restored to `article .demo` for Guide pages while Reference keeps `.site-demo`; this preserves the original Guide component contract and its full-page overflow checks.
