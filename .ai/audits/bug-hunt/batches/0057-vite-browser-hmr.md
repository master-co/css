# 0057 Vite Firefox/WebKit HMR

- Scope: existing actual Vite runtime browser controls on two other installed engines. Check base CSS/runtime ordering, valid CSS HMR, recovery after an invalid compose value, no full reload and preserved page marker. No0038 paused hosts, product or fixture changes.
- Read Vite package/AI, testing/accuracy/deeper data-flow policy, actual dev-hmr test and owning style-entry HMR/runtime injection/preload source.
- [Driver](../repros/vite-hmr-browser-copy.mjs) creates a new copy of the existing test inside each isolated package, changes browser import/launch only after exact marker counts. Existing tests and shared sources remain unchanged.
- Command per engine:`BH_BROWSER=<firefox|webkit> python3 .ai/audits/bug-hunt/repros/isolated-package.py packages/vite node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/vite-hmr-browser-copy.mjs`.
- [Source hashes](../evidence/0057-source-hashes.json); both engines PASS.

## Results

- [Firefox](../evidence/0057-firefox.log):2PASS/8.99s; [WebKit](../evidence/0057-webkit.log):2PASS/7.50s; both exit0 and isolated-tree cleanup. Existing Chromium0020 remains control.
- Actual assertions check display:block winning over component flex, preload/body ordering, global sheet before runtime, valid update to flex then invalid-value attempt and valid block recovery, retained window marker and no WebSocket full-reload message. The existing test waits300ms at the invalid input; it does not assert the invalid intermediate diagnostic, so no claim about diagnostic delivery/timing.
- No new product finding. Vite config-loader warnings are non-failing environment/toolchain observations. Remaining arbitrary plugin/event/device combinations are not covered by these finite controls.
- Only ledger/new repro changed; no persistent package test/fixture/source edit and no new package-local lint obligation.0052 blockers and0038 pause remain unchanged.
