# 0133 Vite host CSS file resolution

- Previous goal turn made progress: user-authorized commit `ef7887f76` recorded0131–0132 audit evidence and preserved104 excluded files. That commit did not include BH-0004 product work or0133. This continuation rechecked current sources and polled all three prior validation handles to terminal states before rebuilding. No new commit/push.
- Scope: asynchronous host resolution of CSS files for classification and graph registration, then actual Vite alias/custom-file/package-condition delivery. BH-0004 remains unfinished;0038 additional verification remains paused without identity confirmation.

## Changes and evidence basis

1. Compiler Node preparation accepts an asynchronous file resolver while retaining Rust dependency analysis and the existing Node fallback. A returned absolute file path is read from disk; `undefined` selects Node fallback; `null` preserves an external import. Files are visited once and attempted dependencies are reported before reading. No TypeScript CSS semantic parser was added.
2. `resolveStylesheet` supports this callback with `preserveImports: true`, detects entry markers throughout the prepared graph and preserves the original source. Collection registration accepts the same callback under `delivery.resolveImport` and stores the graph for composition. Sync file delivery rejects this callback rather than silently ignoring it.
3. Public exports intentionally add `MasterCSSStylesheetAsyncResolutionOptions` and `MasterCSSStylesheetImportResolver`. Registration checks abort/dispose state before and after awaited resolver calls, preventing partial source registration and subsequent child reads.
4. Vite's build classification and registration use `this.resolve(..., { skipSelf: true })`, honoring string/regex aliases, custom resolver plugins returning CSS filesystem paths, and package import/browser conditions. Explicit external resolutions remain external; the Master package's JavaScript root retains its Node CSS-style-entry fallback. Attempted imported files are watched.
5. Compiler/Vite READMEs and the formal Site directive contract document the verified paths and remaining host integration work. This is file resolution, not virtual-source loading or preprocessing. `@reference`, resource aliases, local-compose project loading/emitted globals, multi-entry/watch policies and other consumers still require work.

## Validation

| Check | Result |
|---|---|
| Compiler complete suite |218PASS across26files, including5 new host tests |
| Vite complete suite |110PASS across19files |
| Compiler/Vite lint and types |All PASS |
| Compiler then Vite final builds |PASS; completed before browser consumers |
| Actual Vite host file resolution |6builds/36browser comparisons PASS |
| Original Vite/Webpack corpus |16builds:13PASS/3WebpackFAIL;78browser:66PASS/12WebpackFAIL |
| Vite portion of original corpus |8builds/48browser PASS |
| Existing Vite resource corpus |3builds/18browser PASS |
| Existing naming/cache/lazy corpus |21builds/39browser PASS |
| Original Vite example build |TypeScript/Vite PASS |
| Site guide preparation and lint |PASS;0errors/75warnings |

- [Compiler218](../evidence/0133-compiler-tests-final.log), [Vite110](../evidence/0133-vite-tests.log); the five new [tests](../../../../packages/compiler/tests/bug-hunt-host-resolution.test.ts) cover transitive entry/definition/condition retention, undefined/null resolution, missing-file watch dependencies, abort and disposal. Compiler/Vite lint and type logs use `0133-{compiler,vite}-{lint,type-check}-final.log`.
- [Final host driver](../repros/vite-host-resolution.mjs), [expanded36](../evidence/0133-host-resolution-expanded.log): string alias with nested local CSS/layer, regex alias with supports, actual custom `resolveId`, distinct `import` versus `require` exports, separate `browser` versus `import` exports, and a transitive aliased entry containing native `@compose`. Chromium/Firefox/WebKit each verify screen/print computed colors and zero missing requests/page errors. Custom resolution checks also require recorded actual resolver calls.
- Initial driver [before](../evidence/0133-host-resolution-before.log) had24FAIL and6 weak transitive passes. Its initial transitive fixture only used plain native CSS, so those6passes did not establish compilation. Strengthening it to an aliased definition plus `@compose` yielded [6baselineFAIL](../evidence/0133-transitive-before.log). After implementation, the original five cases passed30comparisons before and after final builds; adding the independent browser-condition case passed36. Only the expanded final scope is claimed.
- The first focused new test fixture omitted a required `@compose` semicolon, causing3PASS/1FAIL. After correcting that, full compiler testing had217PASS/1FAIL because its assertion expected `color:blue`. [Diagnostic output](../evidence/0133-host-diagnostic.log) proves actual `.example{color:#00f}` and retained `layer(shared) print`; the assertion now checks the exact canonical rule. These are test errors, not product findings. Final full suite218PASS is authoritative.
- [Original actual corpus](../evidence/0133-actual-builds-final.log) retains the same three Webpack build and12Webpack browser failures as0132. [Resources18](../evidence/0133-resource-browser.log), [cache39](../evidence/0133-hash-matrix.log), [example](../evidence/0133-example-build.log), [Site prepare](../evidence/0133-site-prepare.log), [Site lint](../evidence/0133-site-lint.log). No existing fixtures/snapshots or dependency/release files changed.

## Limits and preservation

- [Five artifact hashes](../evidence/0133-artifact-hashes.json) exactly match0132; compiler-Wasm7159106raw/1593333gzip/988883brotli, engine/runtime artifacts unchanged. No Rust/ABI changes this batch, so native/Wasm rebuilding, Rust tests, codegen/parity and runtime benchmarks were not repeated. This adds build-time resolver calls and filesystem graph preparation; classification and registration currently prepare separately. No performance improvement is claimed.
- [API census](../evidence/0133-api-census.log) remains FAIL with identical0132 SHA256 `dc10f0ea4b46e12c21c6bdc6703bf56891d67411a80ad845344dba3bde6c45a4`. [Package golden](../evidence/0133-package-check.log) remains FAIL; its diff adds the two intentional public types and compiler surface hash. New log SHA256 `b2cfac3a639009654649b3b7361d49151a45a30fed94768bc1460b198c3d3152`. No golden refresh. Runtime size baseline and migration historical extraction gates remain open/not rerun.
- [Source hashes](../evidence/0133-source-hashes.json):13 changed/new sources and120 prior source/preservation hashes retained. Foreign Site configuration and generated agent instruction files remain byte-identical. Source whitespace and AI budgets are checked separately. All started validation jobs are terminal before batch completion.

## Direct continuation

1. Continue BH-0004 by reproducing actual Vite virtual CSS resolution/loading and Sass/preprocessor imports. Use the host's existing capabilities to provide source contents; do not silently reduce support to filesystem CSS or treat rejection as completion. Current `getBuildImportResolver` only returns absolute `.css` paths and both transforms skip null-prefixed virtual IDs.
2. Verify `@reference` and resource alias handling, plus local-compose project manifest/emitted globals when entries contain qualified external imports. Their existing Node/single-string paths do not consume this callback. Preserve original diagnostics and attempted watch dependencies while migrating.
3. Verify scoped source/pruning semantics, multiple managed entries, repeated slots/dedup, anonymous layers, separate/lazy chunks and build watch/HMR. Aliased local files currently inherit the resolver's non-relative package-ownership flag; validate intended native pruning before broadening claims.
4. Migrate Webpack registration and full asset publication until the existing3build/12browser failures pass. Keep Vite resource/cache controls. Legacy single-string corpus remains21PASS/39FAIL, last run0125; native/no-delivery/CLI no-export consumers and unsupported wrapper/diagnostic cases remain unfinished.
5. Counts remain45historical findings:33fixed/12unresolved;75coverage units:65checked/10blocked;4root gates and4unclassified candidates remain.0038 extra verification awaits explicit identity confirmation. Do not mark the goal complete or commit without another user request.
