# 0056 Next Firefox/WebKit HMR

- Previous goal turn progress:0054 completed Site matrix,0055 confirmed measurement defects; no-progress classification does not apply. HEAD3d2f47768 unchanged; all stored Next source hashes match. Read current root instructions/routing/testing/accuracy packs, Next package/AI/test config,0024 and actual dev-hmr test/helpers.
- Scope same actual Next/Turbopack hydrated page, utility-over-component cascade, CSS HMR without reload on Firefox/WebKit. Extend one existing edit to five bounded valid compose changes. Chromium0024 remains control. No install, paused0038 work or product/fixture edits.
- [Audit driver](../repros/next-hmr-browser-copy.mjs) reads unchanged existing test, checks exact replacement markers, writes a new test only inside isolated package copy, selects browser and adds four edits. Existing test and fixtures in shared worktree unchanged. Each browser has its own isolated package/build/temporary server and cleanup.
- Command per engine: `BH_BROWSER=<firefox|webkit> python3 .ai/audits/bug-hunt/repros/isolated-package.py packages/next node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/next-hmr-browser-copy.mjs`. Both runs completed with exit0 and their disposable trees were removed.

## Evidence and classification

- [Firefox](../evidence/0056-firefox.log):1 test PASS,24.38s; [WebKit](../evidence/0056-webkit.log):1 test PASS,23.58s. The copied test asserts hydrated client, utility-over-component display, and five compose transitions retaining a window marker. No product failure observed in this bounded scenario. Chromium original0024 remains separate prior evidence.
- Vitest suppresses passing-test console output in this setup; conclusions derive from executed assertions and exit status, not an assumed console payload. Both logs retain the Vite configuration warning (extensionless config imports), which does not fail either run.
- [Source hashes](../evidence/0056-source-hashes.json) bind the six owning test/helper/adapter files. Only the audit driver and ledger were added; package production and existing tests/fixtures unchanged. No new package-local test file persisted, so no additional package lint obligation introduced.
- Remaining: dynamic request SSR outside adapter contract and arbitrary event/plugin/device combinations are not claimed.0052 blockers remain unfinished;0038 remains paused.
