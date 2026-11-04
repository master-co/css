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
