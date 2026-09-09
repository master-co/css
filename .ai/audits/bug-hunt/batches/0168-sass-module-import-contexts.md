# 0168 Sass Module import contexts

## Baseline and bounded scope

- Previous goal turn made progress:0167 verified local CSS Module imports and duplicate inputs with350 Vite tests and516 final browser observations.244 source hashes match;HEAD7b404ee4e. No commit/push in this continuation.
- Verify CSS/Sass Module roots importing distinct Sass inputs that compile to equal CSS: root scope, original resource bases, preprocessor callback counts/inputs, output modes and source locations. Broader BH-0004 and every original unfinished requirement remain open. Batch0038 identity confirmation is still absent.

## Reproduction and first fix

- Eight actual-server cases fail across four modes and CSS/SCSS Module roots. Different child source variables compile to identical CSS. postcss-import skips the second output, so the projection loses its root scope and the fallback preprocesses it again. CSS leaks as global.same; additionalData is called twice for that child.
- Plain CSS input equivalence from0167 cannot identify equivalent Sass output from different authored bytes. Do not compile a child again just to recover the discarded output.
- The Vite adapter appends a temporary per-file loud comment to imported Sass through the public additionalData hook. This prevents postcss-import from dropping distinct source identities. The projection removes the marker before Modules processing and from returned per-file output. Root input stays unchanged; user callbacks receive original source once, and supplied callback maps are retained. String additionalData uses the existing MagicString dependency to preserve original locations while appending the temporary comment.
- Initial eight regressions and23 related map/scope/duplicate controls pass (31 total). Expanded Sass syntax/output-mode/callback-map and actual-browser checks are still required. Do not treat this checkpoint as a completed fix.

## Expanded scope and diagnostics

-32 SCSS/indented Sass, CSS/SCSS root, expanded/compressed cases PASS. Async callbacks returning source strings or maps receive original source once; generated output contains no internal marker; actual SVG contents remain owned by the two separate directories.
- Four imported CSS/Sass diagnostics exposed the opaque module-source ID and generated ranges without a source explanation. Per-child PostCSS projection maps now recover exact plain CSS locations; duplicate single-input maps rebase to the duplicate file. Imported Sass whose map was discarded by Vite retains an explicitly preprocessed location. Existing root/partial source-map handling remains unchanged.19 new/existing diagnostic tests PASS; full validation still pending.

## Final verified checkpoint

- Full Vite386 tests/57 files PASS; lint/types/build and original Vite example PASS.10 browser matrices/600 observations PASS across CSS/SCSS roots, SCSS/indented Sass children, string/async-map/no additionalData, expanded/compressed/native-only inputs. Actual two-directory SVG bytes/MIME/query-fragment/pixels, conditions/external HTTP, class rename and child/resource HMR retain page state.
- Site prepare/lint PASS:0 errors/75 existing warnings. Five core artifacts and foreign Site files remain unchanged. Source hashes and final checks are recorded separately; no snapshots, fixtures, dependencies or commits changed.
- Previous interrupted turn was progress; all its commands had naturally terminated before interruption. This turn rechecked logs/process state and finished bookkeeping. Original Sass maps discarded by Vite remain a limitation, not completed precision support. All original BH-0004 requirements and12 unresolved findings remain.
- Next0169: repair BH-0032 benchmark runtime sidecar delivery and payload accounting, then other benchmark defects. Preserve the remaining Sass/partial/reference/virtual/watch/base/SSR/lifecycle and Nuxt/Webpack work. Batch0038 still awaits explicit identity confirmation. No commit/push.

## Requested commit checkpoint

- The user authorized committing completed work after the verification checkpoint above. Include the completed0167/0168 audit records, logs and repro materials only. Product/package-test changes depend on the still-unfinished BH-0004 graph work and remain outside this commit.247 source hashes and10 browser log hashes match;151 excluded files have preservation hashes. All unfinished items and the0038 identity pause remain. No push.
