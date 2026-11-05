# Multilingual release CSS baseline review

The reviewed production build uses `PUBLIC_VERSION=2.0.0`,
`PUBLIC_URL=https://css.master.co`, `PUBLIC_COMMIT_REF=main`, portable images and
the exact published `@master/internal-site@0.2.1`. This approves the local CSS
baseline update after repairs #491 and #492. Final candidate CI, public Master
CSS package delivery and Cloudflare verification remain separate release gates.

## Exact contract and intentional changes

The previous snapshot SHA256 is
`6ede2fb08e5987918ee16927bcd55495f25d0e8d7b113737c957121adb1190cf`.
It records 155 routes, 80 distinct contracts and 2,287 exact segments. The new
unapproved report SHA256 is
`a44083b081cbbc49cf53dd55580be36eef871e1b15bfaec9aeeea740c5bef302`:
384 routes, 80 contracts and 2,279 segments. All 155 routes remain; 229 routes
were added by the multilingual content work. The complete project manifest is
equal. Snapshot v3, language v18 and the Manifest v6 public contract are retained.

- The document bundle is partitioned into Doc, callout, disclosure and prose
  assets with the same 163 rules and 399 declarations. Three prose selectors
  recognize the actual Astro slot wrappers and comparison component. The exact
  partition and delivery ceilings are reviewed in
  `local-i18n-style-qa-2026-11-05.md`. Asset order and whitespace change, so this
  update requires cascade review rather than accepting a whitespace-only claim.
- Japanese and Korean homepage headings gain their reviewed locale-specific
  wrapping rules. Existing English/Traditional Chinese base heading declarations
  remain equal. New localized document CSS matches its canonical English CSS.
- #491 restores the `reference-document` boundary on all five Reference editions
  and preserves caller classes. The six verifier tests include rejection of the
  old missing-boundary output; the full new artifact passes those assertions.
- #492 excludes `.ui-tree` descendants from prose `height:auto`, giving the tree
  component ownership of icon dimensions in either asset order. Public shared
  0.2.1 was verified against its owning CI archive and all 755 installed files.
  See `tree-icon-height-qa-2026-11-05.md` for the exact selector, 47-asset comparison
  and measured +6 gzip/+6 Brotli ceilings without padding.
- Retained hydration metadata changes only on `/reference/packages` and
  `/tw/reference/packages`: the shared DocumentOptions markup adds its existing
  native `ui-params` class. Each hydration payload grows from 2,313 to 2,325 bytes.
  No class is removed; hydration versions and resource order remain unchanged.
  Other retained-route hydration/class metadata is equal.

## Cascade and browser evidence

The initial AST order analysis identified 2,318 conservative same-property
inversion kinds. An AST-aware DOM matcher found nine actual overlaps in the
retained DOM: seven have unequal matching-branch specificity, one compares an
element with its separate `::before` target, and the equal-specificity tree-height
case is repaired by #492. The original matcher also omitted shorthand/longhand
and cross-condition competition; its nine matches alone cannot establish safety.

A separate browser comparison applies the exact old and new composite CSS to
the same frozen stable2 HTML. All 155 retained routes pass at 390px/light with
application JavaScript disabled. The 161 pairs include native hover, focus and
open states on actual Monorepo and Next.js disclosure controls. Every computed
property, custom property and `::before`/`::after` value is compared by value;
there are zero changed values and zero comparison failures. This compares the
top document and iframe elements; child documents are separate routes. Initial
async/locator failures remain retained. Four initial iframe clean-URL requests
failed in the analysis server; a minimal alias repair and four affected-parent
reruns pass with zero computed differences or console/resource errors. The two
child routes also passed their own direct comparisons. Original failures and
the exact four-case overlay remain recorded. The comparison scope excludes
other viewport/theme combinations, hydrated states and the 229 newly added routes.

The actual production verifier separately passes 384 pages, 42,640 local links,
204 Chromium/Firefox/WebKit profiles and 15 no-JavaScript profiles, with zero
failures. Focused Reference checks cover the five locales and anchor/table
behavior. These checks supply broader production coverage without changing the
scope claimed for the old/new computed-style comparison.

## Build identity and validation

Two full stable2 builds at clean `94578cf08ebc3ca3fb1cd85d29b49bd3c7074e58`
produce identical bytes for all 1,649 files. A preceding dirty-source build has
identical HTML/styles/assets; 200 text exports differ only in their truthful
source-revision/working-tree metadata. The current clean build's complete CSS
contract equals the browser-verified first report. No output normalization is
added to the deployment manifest comparison.

Site lint, Astro/Svelte/TypeScript checks, all 43 portable-export tests, the
frozen install and the exact 384-route/47-asset style audit pass. The CSS snapshot
update retains all exact segments, route mappings, hydration and manifest checks.

Local evidence: `/tmp/master-css-shared021-integration/`,
`/tmp/master-css-shared021-style-budget-review/` and
`/tmp/master-css-c2-cascade-review/`. Their reports preserve the actual producer
revisions, dirty-source boundaries and failed harness attempts. Final clean-C2
CI and actual public/edge acceptance must use that final revision's own artifacts.

## Astro installation guide follow-up

The production Astro integration now emits the utilities used by static pages,
so the five Astro installation guides remove the obsolete limitation callout.
In a new stable build, only those five routes change their CSS contract. The
hydration class list drops `tabler-icon-info-circle` and `ui-callout`; the
remaining class order, resource order and hydration version are unchanged.
All 384 route keys, the complete project manifest and all 2,279 exact CSS
segments are unchanged. Each affected route retains the same delivered CSS
SHA256, `a05cd9f33d911e2df3ba3d58985fb02b085572d2d266a624bf836a6e58ab8dac`.
