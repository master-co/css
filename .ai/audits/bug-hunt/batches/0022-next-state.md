# 0022 Next configuration, loader and adapter state

- Scope: PKG-next; compiler/tooling/internal/server/runtime downstream. Config aliases, loaders, build state, adapter output/cleanup.
- HEAD e66ba7236e183046dfc071f190caa44ade0b95e9 unchanged; foreign site/internal edits preserved.
- Read README, coverage Next row, package/AI, vitest config, adapter/build-state and neighboring tests. Dynamic SSR transformation explicitly outside package contract.
- Plan: existing seven unit files; exclude playground test because it builds a tracked fixture; actual host builds separate 0023 in isolated copy.

## Validation and conclusion

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-next exec vitest run tests/adapter.test.ts tests/build-state.test.ts tests/css-manifest-import-loader.test.ts tests/css-manifest-loader.test.ts tests/next-config.test.ts tests/static.test.ts tests/stylesheet-loader.test.ts`: 7 files / 57 PASS, exit 0. [log](../evidence/0022-tests.log).
- Real compiler/scanner/renderer exercised from host unit tests: manifest dependency graph, native CSS separation, static module/CSS incremental changes, excluded modules, loader dependency registration, disabled/runtime/static/progressive config, preservation of user instrumentation, async manifest startup, adapter deduplication, non-HTML exclusion, static export asset placement, reports and composed adapter order.
- Traced src/adapter.ts, build-state.ts, static.ts/static-loader.ts to compiler/scanner/server. Build-state init errors dispose resources; adapter uses finally; static sessions retain per-output lifetime intentionally. No unverified bug indexed from reads alone.
- No new package files. Remaining: actual Next builds/browser hydration/HMR. Completed bounded state batch.
