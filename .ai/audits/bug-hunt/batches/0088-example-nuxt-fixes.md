# 0088 Example and Nuxt fixes

## Scope and authorization

- User changed the goal to「執行並修正所有問題」after explicitly requesting completion of Nuxt, Angular, ESLint, Integration lab, benchmarks and nested hosts, followed by ledger cleanup. Necessary product/example fixes are now authorized. The full goal remains active; cleanup waits for completion. Dependency/lockfile/CI/release changes and unrelated Site edits remain excluded. No new commit requested for these fixes.
- Previous interrupted turn inspected sources but made no changes. This turn makes concrete product changes and tests them. Baseline commit `5ec506c0b`; foreign Site files preserved.
- Integration lab additional verification remains paused until explicit user confirmation of identity verification. The new goal is not such confirmation.

## BH-0028: fixed and verified

- `examples/eslint/index.css` now uses `var(--color-gray-100)` instead of the unsupported `$color-gray-100` syntax. No compiler fallback or diagnostic policy change.
- Original command `node scripts/with-typescript-tooling-compat.mjs node .ai/audits/bug-hunt/repros/eslint-examples.mjs` exits 0: modern and legacy diagnostics, in-memory duplicate removal and second-fix convergence PASS ([log](../evidence/0088-eslint-validation.log)).
- Package lint executed through the same compatibility wrapper: exits 1 with 5 intentional invalid-class errors and 18 warnings in example inputs, not a stylesheet loading failure ([log](../evidence/0088-eslint-lint.log)). Existing example inputs are preserved.

## BH-0024 / BH-0025: fixed and verified

- Express 5 routing uses static middleware and a named wildcard; static index serving is disabled so `/` reaches Master CSS SSR. CommonEngine explicitly allows local example hosts `localhost` and `127.0.0.1`; no wildcard host allowlist.
- Angular build keeps `@master/css-server` external, preserving its transitive css-tree runtime-relative package data.
- Initial corrected startup exposed missing browser Wasm ([log](../evidence/0088-angular-ssr.log)). The next run exposed CommonEngine host rejection after restoring actual SSR ([log](../evidence/0088-angular-wasm-ssr.log)); this was corrected rather than bypassing SSR.
- Final command: `BH_BROWSER_MATRIX=chromium,firefox,webkit python3 .ai/audits/bug-hunt/repros/isolated-package.py examples/angular node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/ssr-example.mjs angular`.
- Actual build, HTTP SSR with style#master-css, Chromium/Firefox/WebKit dynamic hidden→block→removal controls and no page errors PASS ([log](../evidence/0088-angular-browser-matrix.log)). The isolated tree and server were cleaned up. Angular has no package-local lint script. Existing CSS size warning remains advisory.

## BH-0044: Angular browser Wasm sidecar omitted, fixed

- Initial current build/startup succeeds but runtime fetch of `/artifacts/mastercss_binding_wasm_engine_bg.wasm` returns 500 and dynamic class observation cannot start. This is distinct from server-side css-tree relocation (BH-0025).
- Angular assets now copy the already-installed runtime package's distributed `artifacts/*.wasm` to `artifacts`, matching its bundled loader URL. No new dependency or binary added to source.
- Final three-browser original runtime controls above pass. No performance comparison is claimed.

## BH-0023 / BH-0036: implementation in progress

- Nuxt now publishes client manifest assets for progressive as well as runtime mode. Vite compiles styles in all supported modes, while Nuxt retains client startup and Nitro rendering; static mode retains generated utility CSS.
- Added `tests/bug-hunt-theme.test.ts` using the unchanged runtime fixture to assert computed theme color and emitted root variable.
- Package lint PASS ([log](../evidence/0088-nuxt-lint.log)). First original HMR run timed out at initial runtime display readiness ([log](../evidence/0088-nuxt-hmr.log), [result](../evidence/0088-nuxt-hmr.json)); no passing claim. Added console/HTTP/failure-state capture and a result-path override to the reproduction so historical evidence is not overwritten.
- Four-mode run hit the 120-second setup timeout on progressive, then did not complete the remaining build; the owned runner and descendants were deliberately terminated. No tests counted passing ([log](../evidence/0088-nuxt-tests.log)). Diagnostic HMR also timed out at initial runtime readiness with empty runtime CSS and unhydrated HTML ([log](../evidence/0088-nuxt-hmr-diagnostic.log), [state](../evidence/0088-nuxt-hmr-diagnostic.json)).
- Current follow-up adds pending-request capture and allows 120 seconds for initial runtime readiness without changing assertions. This run and an isolated package build remain live; do not restart from a missing log update alone. No Nuxt fixed claim.

## Remaining

- All other findings and blocked units remain open. No ledger cleanup or goal completion yet. Continue Nuxt diagnostics, then the remaining original failures; preserve fixed IDs and evidence.

## BH-0027 follow-up

- Removed the Webpack example template’s obsolete `./index.js` script; HtmlWebpackPlugin already injects `main.js`. Original build/browser/network assertion passes: generated main.js loads, no missing index.js request, heading computes to 48px, no browser console errors ([log](../evidence/0088-webpack-example.log)). Isolated copy and browser cleaned up. No package-local lint script.

## Latest validation and live handoff

- Isolated Nuxt package build PASS ([log](../evidence/0088-nuxt-build.log)). The network diagnostic run failed its 90-second server startup deadline after logging slow module/Vite/Nitro startup ([log](../evidence/0088-nuxt-network.log)); no runtime assertions ran. Prior jobs are terminal and copies cleaned up.
- A serial original HMR run is now live, with a 180-second startup deadline and 120-second initial runtime readiness deadline. Assertions are unchanged; this does not prove any performance contract. `exec` session 12874; [log](../evidence/0088-nuxt-serial-hmr.log). Poll that handle before restarting anything.
- AI context check PASS 2437 files. Product/test/repro whitespace check PASS. Scope: five fixed findings (24/25/27/28/44), Nuxt unverified, all other issues open. Historical source snapshots for changed files describe the prior revision; new current hashes recorded separately.

- Serial HMR session12874 completed: initial runtime and both native/runtime colors are correct; first class edit triggered a page reload while the harness read state ([log](../evidence/0088-nuxt-serial-hmr.log), [state](../evidence/0088-nuxt-serial-hmr.json)). Classified as observation timing, not a completed HMR matrix. The previous contract did not require reload-free updates.
- Reproduction now retries transient navigation/timeout observation and requires two seconds of stable navigation plus the original exact display/color/runtime conditions. Current bounded run: `exec` session91787; [log](../evidence/0088-nuxt-settled-hmr.log), result `0088-nuxt-settled-hmr.json` when written. Poll this live handle before restarting. After HMR passes, rerun production mode tests (earlier setup timeout remains unverified).
