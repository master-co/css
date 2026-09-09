# 0115 Resource URL ownership — BH-0004 remains partial

- Starting HEAD `2449e8664`; previous turn completed the user-requested evidence commit (progress), preserving the unfinished compiler implementation. Existing source hashes from0114 verified before this batch. No new commit/push.0038追加驗證 remains paused pending explicit identity confirmation.
- Scope: compiler-owned discovery and rewriting of stylesheet resource URLs before merging imported authoring definitions; native/Wasm transport and public graph/browser controls. Actual legacy file/project/build/CLI adoption, decoded import discovery and prepared references remain required.
- Status: bounded resource implementation and verification complete; full delivery remains unfinished. Preserve all13unresolved findings,10blocked coverage units and4root gates. No finding is closed by introducing an optional map.

## Implemented and verified

- Added Rust `stylesheet_resources.rs`. Existing cssparser tokens keep unquoted URL payloads and ordinary strings opaque. Lightning CSS validates complete URL/image-set values and prints mapped URLs; its parsed image-set options are traversed explicitly because their recursive image field is excluded from the derived visit-type mask. No new dependency or TypeScript semantic fallback.
- Existing `analyzeCSSDependencies` now returns `resources` with decoded URLs and UTF-16 ranges in the **original input**, including authoring bodies. Import ranges retain their existing sourceWithoutReferences convention; decoded import discovery has not been changed in this batch.
- Prepared `compileStylesheets` accepts optional `resourceURLs`, keyed by source ID and decoded URL. Rewriting happens before directive parsing/manifest merging, so native CSS, theme values and managed definitions composed from another file keep the original owner. Supplying the map requires every parsed relative URL to have a replacement. Replacements must be root-relative or absolute; hosts must choose absolute URLs across output origins. Omitting the map preserves previous behavior.
- Empty URLs and fragment-only local references are not rewritten. Import/reference/namespace preludes are excluded. Invalid or unrecognized URL/image-set grammar is preserved, not silently made valid. This does not claim support for every future URL-valued CSS function or modifier.
- Updated xtask contract and regenerated binding protocol; existing native/compiler-Wasm JSON transport carries the additive fields. Node analysis typing and compiler README/JSDoc updated. Updated the actual directive guide `site/app/[locale]/guide/directives/contract.mdx`, describing prepared-file guarantees and the explicit remaining consumer limitations; obsolete content.mdx was not recreated.

| Validation | Result / evidence |
|---|---|
| Before resource relocation |3browser failures: composed image, image-set and font requested output-relative paths; native author controls requested original paths. [before](../evidence/0115-browser-before.log) |
| Rust compiler |56PASS, including6new resource groups covering escaped names/URLs, image-set string options, opaque data/comment payloads, invalid values, query/fragments, managed/theme ownership, missing/relative mappings and original UTF-16 ranges. [final](../evidence/0115-rust-final.log) |
| Public compiler |157PASS, including4new native/Wasm discovery and relocation tests; [host](../evidence/0115-host-tests.log) |
| Actual resource requests |Native/Wasm outputs agree; Chromium/Firefox/WebKit compare relocated assets against native reference CSS. Image/font request paths, computed values, fragment references and actual FontFace loaded statuses match. [final](../evidence/0115-browser-final.log), [driver](../repros/resource-url-browser.mjs) |
| Existing graph boundaries |21cases/126browser comparisonsPASS after rebuild; [boundaries](../evidence/0115-boundary-browser.log) |
| Legacy public path |10native/Wasm cases agree,60browser comparisons21PASS/39FAIL, still21cascade errors/18typed refusals. Expected failing assertion/exit1; [legacy](../evidence/0115-legacy-browser.log) |
| Binding and checks |Binding17PASS; compiler/binding lint, types and buildPASS; compiler/native/compiler-Wasm all-target/all-feature Clippy, scoped Rustfmt, codegen and parityPASS. Rust crates have no npm lint. |
| Site docs |Final prepare-appPASS; site lint0errors/75existing warnings, no autofix. No additional Site product code changed. [prepare](../evidence/0115-site-prepare-final.log), [lint](../evidence/0115-site-lint.log) |
| Root gates |API census and package contract both remainFAIL; raw output hashes equal0114, no golden update. [summary](../evidence/0115-root-check-summary.json). Other runtime-size/migration failures remain indexed. |

- First resource tests2PASS/2FAIL: missing semicolon in the new compose test was a test-material error, corrected to established syntax. Image-set resource discovery was an implementation error: adding the IMAGES mask alone did not traverse options; explicit traversal of parsed options fixed it. Both attempts and final evidence retained. The temporary parse-error debug print was removed. The first TS test import name was corrected before executing it.
- Before-browser evidence used `document.fonts.check`, which WebKit returned true even for the bad-path case; wrong requests still directly prove the URL bug. The final driver additionally checks actual FontFace statuses to avoid using that weak signal alone. Font fixture is the existing local `site/out/fonts/IBMPlexMono-Medium.woff2` (SHA01d285447409c8a588692162439a038b8cbd7871309ee20267b0d2d91c6e8e22); it is read only, not added or modified.
- Compiler-Wasm grows23,502raw/8,130gzip/4,903brotli bytes from saved immediate0114binary. Current7,023,187raw/1,558,988gzip/970,103brotli, SHA628540d8d751c261f4faa1eff7c1af9e01852b15257e26c2449437901d5d8338. Runtime Wasm/JS/manifest hashes unchanged. No runtime benchmark: no engine/runtime hot-path change; resource tokenization/AST parsing adds compiler CPU/allocation work. [payload](../evidence/0115-payload.json).

## Direct continuation and remaining requirements

1. Use Rust resource discovery in the real Node file preparation/emission path to assign URLs and output resources. Current maps are caller-supplied; optional fields and prepared graph success do not complete legacy consumers.
2. Align Node prepared import discovery with decoded graph specifiers, and integrate existing reference-file resolution/dependencies. Preserve external relative import bases too: those preludes were deliberately not treated as ordinary resources here.
3. Preserve original diagnostic/source ranges through resource edits and reference removal. Resource analysis itself now has tested original-input positions; directive/lowering locations after rewriting are **not** claimed remapped. Cover imported namespace interactions, additional URL-valued syntax and nested native composition before broad adoption.
4. Migrate actual file/project/stylesheet/build/CLI output and reload paths; emit all assets, then rerun original60public, expanded21cases,96local controls and resources through those real consumers. Classify legacy string compiler native-compose order separately if that path remains.
5. Keep13unresolved findings,10blocked coverage units,4root gates and4unclassified candidates.0038追加驗證 still requires explicit identity confirmation. No new commit/push; goal remains active.

- Final handoff:12current source/material hashes and39preserved hashes verified; index empty, HEAD2449e8664, all test/build/browser tool handles terminal. AI-context and local evidence links checked. No commit/push.
