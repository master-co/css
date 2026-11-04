# Community navigation hydration baseline — 2026-11-04

Commit `52cde877283b8f45f98349cdbbfd6f6ba82e2809` intentionally puts
Discussions and Issues before GitHub in the shared community navigation,
replaces the menu's Discord icon with the Issues bug icon, and keeps Discord
as a footer link. This review records the resulting hydration class inventory.
It does not change styling, source files, stylesheet budgets, or deployment.

The inspected production output is the retained artifact from CI run
`41845652531`, revision `bad31e3a4fb46e4e664922aa15c95b9bf239b8a2`, artifact
`13333655319`. The downloaded ZIP SHA-256 is
`643213badc6af93e020faf5c1a284e3105f5007f042f470f3e66200967e39ac0`.
The dirty local workspace was not rebuilt to produce this baseline.

Exactly **151 of 155 routes** change, across **76 deduplicated contracts**.
Each class list moves `tabler-icon-messages` and `ui-menu-external` before
`tabler-icon-brand-github` and replaces `tabler-icon-brand-discord` with
`tabler-icon-bug` there. Each hydration payload shrinks by **10 bytes**.
Only `classNames`, `hydrationBytes`, `hydrationSha256`, and their derived
contract IDs/route references change. The four standalone example routes
remain unchanged.

The normalized project manifest, all **2,287 exact CSS segments**, CSS bytes
and hashes for every route, hydration format version, and resource order are
unchanged. The final inventory still has **80 deduplicated contracts**.
An artifact-only copy of the existing verifier compares all delivered HTML,
CSS and hydration payloads against this narrowly updated baseline. The
manifest equality is additionally established by the original CI verifier:
its manifest comparison passed before it reported the navigation mismatch.

The original CI quality job failed on the old baseline and did not reach its
browser audit. This review does not turn that failed run into a passing CI
run; the next candidate must run the unchanged required checks again.

## Benchmark hydration baseline — 2026-11-05

Commit `a6175395f` restructured the benchmark article and its tables. The
subsequent clean `5f3fb77c70ee4484864fa794e296c4b32f94407e` build in CI run
`41876027070` retained that content change without an updated hydration baseline.
Its downloaded site ZIP SHA-256 is
`26e6512ffcf6cb7ba7df5082636475a6f265fffaf973bcaaf9830c126fa354ed`, matching
GitHub's artifact digest.

Exactly `/benchmarks` and `/tw/benchmarks` change from contract
`15d376f9875e37a7` to `a6c3fbfe020eadbe`. Their 104 classes and 2,842 hydration
bytes are unchanged; hydration replay order moves `benchmark-value` before
`ui-table`, and `ui-expand-control` / `ui-expand` before `ui-badge`.
Only `classNames`, `hydrationSha256`, and their derived contract IDs/route
references change. All 155 routes retain the same exact CSS bytes, hashes,
segment order, class sets and resource order; all 2,287 cataloged CSS segments
and the 80-contract count remain unchanged. No budget or verifier is relaxed.

The retained-artifact comparison used the original CI manifest comparison as
manifest evidence. A separate local build with the current compiler then
recomputed the complete project manifest and all route contracts; its canonical
verifier report exactly matches the retained CI report. This establishes the
source attribution independently of the artifact-only manifest reuse.

The failed CI run did not reach its site browser checks. Updating this narrowly
attributed baseline does not make that run pass; the final candidate must still
complete the unchanged static, browser and accessibility checks.

The local static audit additionally found that the new level-three
"Representative fixture" heading collided with the existing level-four heading
of the same name. The static comparison heading now has the explicit
`static-css-fixture` anchor. Existing explicit article anchors are retained;
the rendered English and Traditional Chinese pages must both pass the original
unique-ID and local-anchor checks after rebuilding.

The rebuilt local artifact passes all 155 routes, 16,202 local links and 56
Chromium/WebKit viewport/theme profiles with no failures. Its CSS contract,
asset audit, unchanged delivery budgets, site lint and types pass. The portable
documentation suite also passes 39/39 after updating its independently checked
payload expectations to the committed benchmark samples; chart code is unchanged.
This local artifact evidence does not certify Firefox or a deployed public site.
