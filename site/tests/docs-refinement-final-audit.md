# Final documentation and demo audit

This closes the full demo implementation and the subsequent document-by-document
refinement. The route ledger is `docs-refinement.json`; the earlier batch reports
record the individual source, prose and visual reviews rather than inferring them
from one shared stylesheet change.

## Delivered scope

- All **359 documentation routes** have independent prose and visual reviews.
- All **183 utility Reference pages** contain **711 teaching scenes**: 709 h3
  sections plus two standalone h2 sections, including imported MDX content.
- The Design System contains **87 Reference recipes in nine groups**, shared
  foundations, primitives, annotations, interaction controls, document components,
  benchmark charts, code presentation, interfaces and minimum compositions.
- Reference, Guide, installation and Brand demos use site-owned components.
  Native iframe widths, print, scrolling, animation, theme and focus behavior remain
  real browser behavior. Annotations do not join the demonstrated layout.
- Stable heading entrances, English prose, the existing Traditional Chinese fallback,
  Markdown, search and LLM exports are preserved. Clear's side-specific examples and
  descriptions are corrected. Shared tokens and artwork keep neutral canvases,
  blue subjects and violet comparisons consistent in both themes.
- No dependency, package API, preset semantic, internal submodule or release-flow
  changes are part of this work. All source changes are inside `site/`.

## Final production verification

The final clean `pnpm build:site` passes, including prepare, actual LLM generation,
Play compiler, Next compilation/types, 768 generated Next pages and postbuild.
The resulting static tree contains **1,147 HTML routes**.

| Check | Final result |
| --- | --- |
| Site type check | Pass |
| Reference tests | 20/20 |
| Documentation example tests | 32/32 |
| Stable post-build LLM/export tests | 32/32 |
| Teaching section coverage and compilation | 3/3; all 711 scenes |
| Full-source class validation after final badge | 1/1 |
| Design System catalog and component matrix | 12/12 across six profiles |
| Fresh concurrent loads, no-JavaScript document and final gallery | 18/18 after artifact-only rerun |
| Native demo behavior | 40/40 across four profiles, including affected media rerun |
| Representative production captures | 2/2; seven pages at three widths in both themes |
| Full production utility and migrated-page sweep | 792/792: 183 utilities and 15 migrated pages × four profiles |
| Full site lint | Pass: 0 errors, 9 warnings; final affected test lint also passes |
| CSS contract verification | Pass: reviewed snapshot updated; 2/2 variable tests and exact production verification |
| AI context/source budget | Pass: 2,882 files; four generated exclusions and one bounded exception |

Final browser profiles cover Chromium desktop and WebKit mobile, light/dark, with
additional 768px gallery profiles. The catalog check opens/closes all 87 native
disclosures with the keyboard and loads every actual preview. All 40 visible
component iframe previews were inspected. Final badge variants, loaded image assets,
18 component interfaces and catalog layout were captured in all six profiles;
the complete narrow/wide interface descriptions and all six profile specimens were
visually read. The fresh Design System entrance was also read at all three widths
and in both themes. Earlier batch reports cover complete reading views for all routes.

The behavior suite checks clear geometry, flex/grid dimensions, fixed/sticky scroll
contexts, actual viewport widths, hover/focus/theme/print conditions, accessible names
and descriptions, replay, reduced motion, keyboard controls and media geometry.
The old object-fit assertion expected the earlier fill-first 16:9 example. It now
checks all three authored pairs in equal square boxes, their actual fit and position,
and the source's natural ratio. All four affected profiles pass.

## Reviewed CSS change

The comparison is against the approved initial demo implementation baseline,
before the subsequent document refinement. A separate candidate snapshot was
generated and reviewed before touching the repository baseline.

| Production inventory | Before refinement | Final |
| --- | ---: | ---: |
| HTML routes | 1,145 | 1,147 |
| Deduplicated route contracts | 132 | 111 |
| Generated utility rules | 1,667 | 1,301 |
| Generated CSS segments | 1,902 | 1,483 |

All common generated rule definitions are identical: **zero changed rules**.
There are 37 newly used classes and 403 removed from the outer-page inventory.
These reflect explicit responsive foundation geometry, focus states, colors and
view-transition examples, and migration of legacy inline specimens into shared
components or isolated documents. They do not remove utilities from the engine.
The only new routes are the actual article and panel view-transition documents.

The global manifest differs only by three site-owned asset tokens:
`demo-asset-preview-size`, `color:demo-asset-dark` and `color:demo-asset-light`.
Generated segments have 103 additions and 522 removals, primarily changed per-route
variable subsets. Common root/light/dark variable declarations retain identical
values; 52 no-longer-used declarations leave this generated page inventory.
Site component CSS supplies the new canvas, catalog, document and annotation
presentation; native browser captures and geometry assertions verify that output.
No compiler or preset implementation was changed to obtain this result.

The final production sweep passes all 792 checks. The site-only CSS snapshot was
updated with this audit as its review reference, then verified against the same
built output. Both CSS variable tests and the exact production comparison pass.

## Existing failures and evidence limits

The nine lint warnings cover numeric spacing lesson aliases, teaching-source class
ordering, and existing blog/sponsor aliases. They are reported without automatic
rewrites of instructional code. No lint errors remain.

The original dogfood suite reported **five passed, one skipped and six failed**.
These are the same three legacy assertions in both Chromium profiles recorded in
the initial demo QA: white serializes as `lab(100 0 0)` rather than the expected
`oklch(1 0 none)`; the guide assertion selects a heading outside the assumed prose
margin rule; and the cascade test searches an obsolete heading title. Those results
were reported separately, without changing engine output or weakening those assertions.

One LLM run overlapped prepare's generated search writes and read intermediate
output. The stable post-build rerun passes all 32 tests. One final gallery run lost
its artifact directory when the legacy dogfood configuration cleared the shared
`site/test-results` root. It failed on artifact ENOENT, not a browser assertion;
all three desktop-light production tests passed in a fresh isolated output directory.
The legacy configuration then owned a dedicated dogfood output directory.

That cleanup removed earlier local screenshot directories after they had been
visually reviewed. Their batch notes and logs remain, but those historical image
paths are no longer retained artifacts. Fresh final production captures and the
complete utility sweep are retained in the directories below. No source was lost.
Platform-limited CSS effects retain explicit support notes; browser emulation does
not establish every physical input device, OS or assistive-technology combination.

## Retained evidence and reproduction

Current captures are under `site/test-results/production-load`,
`production-load-desktop-final`, `production-behavior`, `production-media-final`,
`production-representatives` and `production-sweep`. Historical batch reports are
`docs-refinement.md`, `docs-refinement-layout-typography.md`,
`docs-refinement-project-language.md`, `docs-refinement-final-pages.md` and `demo-qa.md`.

The remaining build and non-browser checks are listed in `demo-qa.md`. The browser
suite used for this audit has since been removed; the results above are historical.

Final logs: `/tmp/master-site-final-build.log`, `/tmp/master-ds-full-lint.log`,
`/tmp/master-final-audit-types.log`, `/tmp/master-site-final-sweep.log`,
`/tmp/master-site-production-load.log`, `/tmp/master-production-desktop-final.log`,
`/tmp/master-production-behavior.log`, `/tmp/master-production-media-final.log`,
`/tmp/master-production-representatives.log`, `/tmp/master-site-stable-llms.log`,
`/tmp/master-final-css-contract.log` and `/tmp/master-final-audit-ai.log`.
