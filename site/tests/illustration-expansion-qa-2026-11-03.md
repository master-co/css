# Additional documentation illustrations — 2026-11-03

## Scope and priority

20 new authored figures across 12 articles: four Guide pages and eight Reference pages. Each has a 720 × 480 composition exported at 1440 × 960 in both themes: 40 PNGs, counted as 20 figures. Existing images and working demos remain.

Priority is editorial judgment based on prerequisite reach, likelihood of a misleading mental model, and whether a drawing adds information beyond existing prose. It is not a traffic measurement. The existing Guide batch already covers delivery, layout foundations and installation; this expansion concentrates on precise scopes, exceptions and compiler mechanisms. Integrations remain code-first. Organization Blog content belongs to the Master repository and was not copied into this checkout.

| Rank | Priority | Figure / reader question | Article | Visible evidence |
| --- | --- | --- | --- | --- |
| 1 | P0 | `suffix-ownership`: where does a suffix stop? | `/guide/syntax-tutorial` | Intact source, exact substring brackets, visible class-separating whitespace |
| 2 | P0 | `padding-coverage`: what does a side override change? | `/guide/layout-system` | Equal content boxes; only the top inset changes from 24px to 8px |
| 3 | P0 | `descendant-depth`: children or all descendants? | `/reference/rules/selectors` | Identical DOM trees, actual hierarchy and underlined target links |
| 4 | P0 | `breakpoint-partition`: who owns the threshold? | `/guide/responsive-design` | Open and filled endpoints on aligned intervals |
| 5 | P0 | `registration-boundary`: does a native variable create a class? | `/reference/rules/modes` | Same declaration in two different enclosing blocks; only one registers p-card |
| 6 | P0 | `ambiguous-namespace`: what if two namespaces have the key? | `/reference/directives/definitions` | Two matched branches end at an ambiguity barrier, without an output rule |
| 7 | P0 | `important-recipe`: how much does the final ! affect? | `/reference/rules/declarations` | Three aligned declaration rows, each with an important marker |
| 8 | P0 | `token-dependency-chain`: why is another token emitted? | `/reference/rules/modes` | Connected dependency chain beside a disconnected unused token |
| 9 | P1 | `sibling-direction`: which siblings can match? | `/reference/rules/selectors` | Matched sibling order, outlined owner, forward target selections |
| 10 | P1 | `selector-list-branches`: does the second branch continue the first? | `/reference/rules/selectors` | Both alternatives start at the same owner and converge on one declaration |
| 11 | P1 | `fixed-name-reservation`: can a token replace a fixed name? | `/reference/rules/declarations` | Equal 240px parents; fixed width fills one, explicit variable sets 192px in the other |
| 12 | P1 | `condition-eligibility`: does generation mean the rule applies? | `/reference/rules/conditions` | One compiled query, two browser cases; matching enters the cascade |
| 13 | P1 | `layer-token-separation`: does a layer suffix move dependencies? | `/reference/rules/layers` | Token and consuming declaration remain in separate named output bands |
| 14 | P1 | `mixin-splice`: where do reused declarations go? | `/reference/directives/definitions` | Aligned surrounding lines; one call position becomes two declarations |
| 15 | P1 | `contents-insertion`: what does the wrapper surround? | `/reference/directives/definitions` | Dashed contents slot becomes a declaration inside the selector boundary |
| 16 | P1 | `static-branch-extraction`: must the scanner execute a branch? | `/guide/scanning-and-pruning` | Both complete literal arms have extraction paths; concatenation has no completed output |
| 17 | P2 | `independent-registrations`: does replacing a name replace its function? | `/reference/directives/definitions` | Separate lanes; only the static lane changes |
| 18 | P2 | `pruning-selector-branches`: does retention prove a DOM match? | `/reference/directives/pruning` | Comma-separated branch is removed; the descendant branch remains whole |
| 19 | P2 | `keyframe-reachability`: does retaining keyframes start animation? | `/reference/directives/pruning` | Safelist reaches the definition, without a class or animation declaration |
| 20 | P2 | `source-replacement`: does rescanning accumulate old classes? | `/reference/rules/extraction` | Matched before/after sets; shared r-md survives while padding membership changes |

## Sources and composition

- Editable scenes: `site/assets/images/reference-studies/source/<id>.ts`; local drawing rules: `illustration.css` in the same directory. Both image variants live one directory above.
- Shared captions and independent text descriptions: `site/reference/study-illustrations.ts`. The existing Reference registry and Markdown adapter serve the same explanations to HTML, search and Markdown/llms output, including the four Guide consumers.
- Local `materials.ts` resolves the published shared package's fonts and tokens, replacing stale pre-extraction asset URLs in its scene HTML. It reuses the existing drawing primitives and renderer. No dependency, installed package, shared design token or browser diagram runtime was added.
- The existing hydration, native anatomy and Guide studies supply the interface scale and materials. The [MDN combinator examples](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Combinators) provide a complementary teaching comparison: keep the DOM fixed and change the combinator. These figures expose that hierarchy directly instead of requiring the reader to reconstruct it from code.
- Each drawing isolates one question. Actual padding and width specimens use public compiler output; structural diagrams distinguish DOM branches, dependency references, alternative browser cases and compilation transforms. Their connectors do not imply performance or a shared timeline.
- Four paired contact sheets were reviewed for all 40 outputs. Refinements separate overlapping syntax leaders, preserve literal class whitespace, connect importance to all three declaration rows, include the real selector inside the media block, and correct the fixed-name comparison. The final changed variants were reviewed again at article scale.
- The fixed-name check initially revealed that `max-w-full` is also a fixed utility. The delivered figure uses `(width:var(--container-full))`, verified against actual generated CSS, to show the explicit variable comparison correctly.
- Removing accent color leaves brackets, indentation, underlines, endpoint shapes and before/after identity to carry the relationships. Notes qualify the drawings but do not supply their only evidence. This is author review, not observed reader research.

## Verification

- Renderer completed all 20 scenes in both themes with actual Geist and IBM Plex Mono; 40 PNGs have 1440 × 960 intrinsic dimensions and pass label bounds checks.
- Public compiler/MCP checks verified padding coverage, recipe importance, selector branches, query output and layer ownership. Additional executable assertions checked fixed spellings, explicit variables, registration, transitive tokens, ambiguity and keyframe safelist output. Existing compiler tests were inspected for mixin expansion and independent registrations; the documentation example suite validates the surrounding authored contracts.
- Browser measurements: padding specimens are 192 × 112 and 192 × 96, with padding `24px` and `8px 24px 24px`; width specimens are 240 × 64 and 192 × 64. The images therefore draw the declared dimensions at scene scale.
- 72 page profiles pass: all 12 articles at 390, 768 and 1440px in both themes, covering 120 new-figure checks. Each checks one active theme asset, proportional 3:2 sizing, media-width fill, bounds and keyboard-operated complete text descriptions. All 40 article figures were captured; composition review includes paired output sheets and desktop/mobile article crops.
- 24 additional profiles pass at 390px with 200% root text: one representative new figure per article in both themes, with the local theme deliberately opposite the OS preference. Figure bounds and expanded text descriptions remain usable. The no-JavaScript keyboard disclosure also passes on the selector figure.
- Site lint passes. Full type-check passes with zero errors and warnings; Astro reports 18 existing unused-symbol hints outside this change.
- Reference tests: 27 pass. The former one-figure-per-document marker assertion now validates every authored figure, balanced marker pairs, descriptions and search/portable output.
- Documentation example tests: 28 pass. LLM/search tests: 35 pass. MDX import tests: 2 pass. `prepare-app`, `build:llms`, Astro production build (153 pages), `git diff --check` and `check:ai-context` pass.

## Limits

On phones, the same composition scales proportionally; fine bitmap labels become small. Every figure therefore retains a readable HTML caption and a keyboard-operable full text description, independently of the image. Verification used Chromium, not a cross-browser matrix or a novice comprehension study. No deployment or commit was made.
