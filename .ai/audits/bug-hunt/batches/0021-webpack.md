# 0021 Webpack module and asset lifecycle

- 目的：compiler modules→scanner/style collection→CSS/runtime/manifest assets、watch reset/replay/disposal。
- 範圍：PKG-webpack（runtime/static 支援依 options 為準）；compiler/tooling/internal/runtime 為參與下游。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal changes 保留。
- 已讀 package/AI、plugin.ts、scanner-lifecycle/usage-graph、runtime-e2e temporary fixture/build/server cleanup。
- buildPackage 只生成 package dist；tracked fixtures 不改，virtual placeholders 在 node_modules。下一步跑 tests 後核對 watcher/error paths。

## Results and BH-0017 (P2, confirmed)

- Baseline: `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-webpack exec vitest run`: 3 files / 48 PASS, exit 0. [log](../evidence/0021-tests.log). Includes real Webpack output + Chromium runtime/preloads/layer precedence; async module completion, per-compilation pending isolation, watch reset/replay/error recovery and Rspack source shapes.
- New `packages/webpack/tests/bug-hunt-relative-assets.test.ts`: run with the same command plus file path; 1 FAIL exit 1. [log](../evidence/0021-relative-assets.log). Root HTML control resolves the file; `pages/nested.html` references `./master-css-runtime.js`, resolving to nonexistent `dist/pages/master-css-runtime.js`, while emitted file is `dist/master-css-runtime.js`.
- Source: `packages/webpack/src/plugins/runtime-html-assets.ts:52` toPublicHref does not receive HTML directory; line 124 uses it for runtime script; line 160 discards asset fileName before transformHTML. Public output.publicPath='./' with nested emitted HTML triggers missing runtime and generated styles. Expected asset references must resolve to emitted files. Fix direction: pass HTML asset name and compute relative paths for relative/auto publicPath; preserve absolute/CDN paths. Separate from BH-0016 because Webpack owns this generator.
- First harness assumed quoted HTML attributes; production minification removes quotes. Corrected parser before attributing failure to product. No product conclusion from those harness failures.
- `pnpm --filter @master/css-webpack lint`: PASS. New test is the only package change; temporary fixture removed in finally.
- No other confirmed finding. Unchecked: devServer static HTML is outside documented plugin ownership; full host/plugin combinations not exhaustive.
- Completed. Next: Next config/loader/adapter state unit behavior, then isolated actual builds/HMR.
