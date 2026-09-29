# Site dev compilation measurements (2026-09-30)

## Method

Run `site dev` on the same Mac and request `/en/reference/rules/modes`, `/en/guide`, then `/en/play` with `curl`. Read `compile-path` and `handle-request` durations from `site/.next/dev/trace`; HTTP wall time is from curl. The baseline trace was captured before these edits with Next 16.3.4. The final cold run used Next 16.3.7 after `site clean:next`. Durations vary with machine load, so single cold samples do not establish a median.

| Route | Baseline cold compile | Final cold compile | Baseline HTTP | Final HTTP | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Reference rules/modes | 15.893 s | 16.923 s | 17.154 s | 18.370 s | 30% target missed |
| Guide overview | 2.907 s | 2.041 s | 3.604 s (RSC request) | 2.389 s | HTTP down 34%; compile down 29.8%, narrowly missing 30% |
| Play | No baseline request | 0.337 s | No baseline request | 0.580 s | No comparable baseline |

The Reference compile was 14.859 s in an earlier clean run of the final route/data split, then 16.923 s in the final clean run. The variation and the remaining 16–18 s wait show that the cold Reference target is not met. Turbopack's trace only gives a route-level `compile-path` span here, so it does not identify a narrower module cost.

On a normal second `site dev` launch **without** `clean:next`, the same requests took:

| Route | Cached compile trace | HTTP |
| --- | ---: | ---: |
| Reference rules/modes | 0.009 s | 1.426 s |
| Guide overview | 0.007 s | 0.333 s |
| Play | 0.007 s | 0.245 s |

This is the main repeat-start improvement: ordinary `site dev` now retains the Turbopack cache, while `dev:site:clean` still clears it. Two consecutive `prepare-app` runs kept the modification times of the Reference catalog, route index, selected document JSON, `.pages.json`, search JSON, translation registry and copied raw source unchanged. The Play compiler output also kept its modification time across identical rebuilds.

## Edits and output checks

With an open browser, three Guide MDX saves reached the updated DOM in 3.914, 3.823 and 3.834 s (median 3.834 s). Three shared Markdown renderer saves took 3.877, 3.810 and 3.823 s (median 3.823 s). The corresponding Next `client-hmr-latency` events were roughly 3.0–3.5 s. The old trace contains 3.58–3.92 s events for a different Guide route, plus more variable events during other edits. It contains no controlled saves of the same files, so a before/after 30% median claim is unsupported; the final edit waits remain about 3.8 s.

`build:site`, site `lint`, `type-check`, `test:reference`, `test:llms`, `test:docs-examples`, `test:play`, `test:mdx-imports`, and `check:ai-context` passed. Lint reported 156 existing class-order warnings and no errors. A headless browser rendered Reference rule/token/recipe pages, the cascade-layers Guide page, and the Play iframe; Play's iframe had its template text and CSS rules. Generated Reference route data matched the complete catalog in a focused test. The static build included the token specimen only on the token page and the recipe specimen only on the recipe page.

Remaining cost: first cold Reference compilation and roughly 3.8 s edit-to-DOM latency. The existing baseline has no Play sample or matching edit samples; repeat controlled measurements on the original revision would be needed to calculate those improvement percentages.
