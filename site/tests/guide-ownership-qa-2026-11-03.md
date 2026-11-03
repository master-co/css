# Guide ownership reorganization — 2026-11-03

## Decision and implementation sequence

Keep separate pages for separate reader tasks. Route-level styles teaches where
styles load and how definitions remain shared; it stays in Authoring. Rename
Scanning and pruning to Scanning class names and move it into Authoring; it teaches
complete source strings, changing values, discovery exceptions, bounded safelists
and diagnosis. Optimizing CSS delivery stays in Build and delivery and owns the
complete native pruning workflow after delivery ownership and measurement.

This avoids making routine component authoring depend on a performance audit and
avoids teaching native pruning twice. Reference continues to own directive syntax
and scope semantics. No compiler, scanner, rendering mode, framework or public
configuration behavior changes.

Execution:

1. Archive the committed source and build a packed consumer baseline separately
   from the concurrent homepage work. Preserve exact CSS and delivery reports.
2. Reorganize content, category order, purpose-specific links and public skill
   references. Preserve every route and existing heading anchor.
3. Keep runnable setup in two disclosures while preserving all eight source files,
   CLI commands, images and explanations in search and Markdown.
4. Exercise exported content, production browser behavior and actual public CLI
   examples. Review the exact CSS/hydration delta before recording the snapshot.

## Content and compatibility

Authoring order: Theme tokens → Global styles → Reusing styles → Route-level styles
→ Scanning class names → Authoring packages → Code linting. The previous duplicate
order for Reusing and Route-level is resolved. Build and delivery contains
Optimizing CSS delivery; a category does not need extra articles merely to be full.

The URL `/guide/scanning-and-pruning` remains canonical. Its `prune-native-css`,
`preserve-native-css` and `verify-pruning` anchors remain meaningful short handoffs
to the relevant Optimizing sections. Other existing anchors remain unchanged.
Source-scanning links retain that URL with the new title; native pruning links now
target Optimizing directly. New Chinese metadata follows the existing dictionary;
article bodies retain their existing English fallback, not a new full translation.

The source-policy figure stays with Scanning's new source section. The classless
native selector figure moves to Optimizing, retaining its accessible explanation
and search/Markdown representation. Optimizing retains its four delivery figures.
The complete two-page project and independent CLI reproduction are collapsible;
the actual Vite local-transform limitation stays visible outside the disclosure.

Public skill authoring/delivery references point to the separate task owners.
Ordinary styling still does not trigger the delivery audit. This changes the
public product skill source, not a managed shared-skill copy; no synchronization
or package publication is implied.

## Source and environment

Baseline CSS HEAD: `d6b77004bb24709c0f0be7bf7d307ee6f41ba0b8`.
Fresh isolated consumer: `/tmp/master-guide-reorganization/consumer`. It starts
from that committed source and receives only the paths in the evidence manifest.
Concurrent homepage, shared component and AI-coding edits are excluded.

The installed shared framework is the actual extracted archive
`master-internal-site-0.1.2.tgz`, SHA-256 `ed95c92aacfc2faa97f0ff681b202e6ff50f25eaa5ebada960168406c559d2ca`.
It is reused from the previous accepted style-delivery verification, rather than
packed from the concurrently modified Master sources. Public product dependencies
reuse existing checkout builds; this is not a clean registry installation test.
No pins, locks or committed paths point at the temporary consumer.

Node 24.22.1, Bun 1.4.4, Astro 7.4.2, Svelte 5.57.2 and Vite 8.3.5.
An archived checkout has no `.git`; preparation/export logs note that omission.
It affects Git-derived editorial metadata, not the content or CSS assertions.

## Exact CSS review and snapshot decision

In the isolated before/after comparison, all 155 routes retain identical CSS delivery metrics. The project manifest and
all 2,295 exact CSS segments are byte-identical. There are still 80 deduplicated
contracts and 44 external CSS assets. No delivery budget is raised.

Only `/guide/scanning-and-pruning` and its `/tw` equivalent change hydration:
2,953 → 3,018 bytes. The new class-map/source examples use two already-defined
syntax-highlighting classes: `mcss-semantic-enumMember` and
`mcss-semantic-role-utility-semantic`. No classes are removed; no CSS declarations
or resources change. Approve only that page contract replacement and this QA
reference in `css-contract.snapshot.json`.

During finalization, the parallel homepage task updated the shared snapshot and
budget. Its Scanning page contracts still exactly matched our original baseline.
The source snapshot therefore merges only our one contract and its two route IDs,
preserving every other current contract, CSS segment, project manifest and the
homepage approval reference. An exhaustive merge comparison verifies those
invariants. The isolated consumer keeps the standalone snapshot used by its
passing build check; combined homepage source was not rebuilt here. The concurrent
budget is retained without modification.

The following before/after CSS values are identical (bytes use the existing audit
compression defaults; these are not HTTP transfer/timing measurements):

| Route | Files | Import depth | Raw | Gzip | Brotli | Inline |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| route-level-styles | 21 | 1 | 127782 | 33205 | 28187 | 1790 |
| scanning-and-pruning | 17 | 1 | 112286 | 28655 | 24294 | 1790 |
| optimizing-css-delivery | 20 | 1 | 118910 | 31044 | 26299 | 1790 |

## Validation

- Fresh packed-consumer baseline and changed production builds: 155 routes.
- Search/Markdown: 39 tests, including category order, old anchor handoffs, single
  pruning workflow owner and complete runnable files inside disclosures.
- Reference: 27 tests. MDX imports: 2. Authoring audit: 3. Lint passes.
- Astro/Svelte/TypeScript: no errors or warnings; 18 existing Astro hints.
- Browser ownership test: 12 engine/locale/article combinations across Chromium
  and WebKit; categories, headings, old anchor navigation, internal targets and
  both complete disclosures pass.
- Figure test: 10 engine/theme/width combinations, five figures each, including
  theme override and 200% text. Chromium 390/768/1440; WebKit 390/1440.
- Document layout: six routes × light/dark × 390/768/1280 = 36 passing profiles,
  including disclosure contents and overflow. Screenshots retain readable text
  explanations for fine figure labels at narrow widths. Selected mobile article
  and light/dark figure captures were manually inspected.
- The existing public Vite/CLI delivery fixture passes again: local ownership,
  ready/focus states, initial and later utility generation, map-based pruning,
  exact safelist and preserved external styles. Vite local usage-set limitation
  remains demonstrated and explicitly documented.
- The new authored `@source` include/exclude example and bounded `@safelist` were
  copied from the article and executed through the public CLI: included TSX class
  survives, test-only class is excluded, then the explicit safelist includes it.
- Public skill validator and AI context/source budgets pass.

## Existing failures and scope limits

`test:docs-examples`: 27 pass, one existing failure in
`verifyLanguageExamples` (`Read the actual Guide settings table, not only gallery
fixtures`). The unchanged pre-reorganization packed consumer reproduces the same
failure. It is independent of this content reorganization and is not suppressed.

The shell's known duplicated SVG gradient IDs are unchanged. The document sweep
uses the previous exact route/ID/count baseline so they cannot hide a new duplicate
or prevent the remaining layout checks. No blanket SVG exclusion was added.

No site deployment, package release, push or merge. Browser evidence describes the
isolated committed-baseline-plus-this-change consumer, not a combined validation
of concurrent homepage work. No speed improvement is claimed for this editorial
change. Local evidence is kept in `.cache/guide-ownership-2026-11-03/` and the
isolated workspace; those generated files are ignored.
