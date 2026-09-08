# 新增檔案與驗證限制

本次僅新增 `.ai/audits/bug-hunt/` 帳本、其中的證據／重現材料，以及下列 23 個測試檔。沒有修改正式產品、既有測試／snapshot／fixtures、依賴、lockfile、CI 或 release。使用者後續明確要求將已完成部分 commit；提交包含既有調查成果及其未完成／受阻記錄，不代表完整目標完成。故意失敗的回歸測試保存尚未修正問題的證據，不代表整體測試全數通過。

完整機器可讀清單見 [file inventory](evidence/0087-file-inventory.json)，行為、命令與各項結果見 [批次索引](README.md)；問題詳見 [報告](report.md)。

## 工作目錄歸屬

- 起始 HEAD：`e66ba7236e183046dfc071f190caa44ade0b95e9`；提交前驗證基準 HEAD：`3d2f47768c30e1678228fa04efcfc4b152e70120`。期間其他工作更新 site 與 internal；0047後的255路徑更新已於0051完成有界重驗，其他來源快照仍一致。
- 其他工作的 tracked 修改：`site/next.config.js`；untracked：`site/AGENTS.md`、`site/CLAUDE.md`。全部保留，不列入本次修改。
- internal 子模組目前 `169b5ee6f8b4ca9817fa82eb572e105a24f78d80`，工作目錄乾淨。
- 本次隔離副本中的建置產物不屬於產品修改；副本在驗證結束後清理，必要結果保留於 evidence。

## 驗證與限制

- 新增測試所涉及的 13 個 TypeScript package 均有 lint script，已執行；Rust 使用批次所列的 test／clippy 等檢查。
- 未新增測試的 benchmarks、shared、site internal 子模組等支援單位沒有 package-local lint script；驗證依各自可用工具執行。Laravel 的 lint 含 `--fix`，本輪未執行該寫入入口。
- 完整基準、刻意失敗的重現、既有測試失敗與環境限制分開保存；不更新 golden 或 snapshot 來取得通過。
- 非本機七個 native targets 缺少對應 OS／CPU／binary；三個 examples、nested hosts、benchmark lifecycle及Nuxt theme HMR的阻礙詳見 coverage，不計為已檢查。
- Figma API 使用明示 mock；遠端部署、live KV、Firebase 及未提供的平台沒有冒充實機驗證。
- 使用者回報 Trusted Access 提示後，0038 的追加 Rspack／Rsbuild host 檢查保持暫停。沒有工具提供分類原因；不得將推測寫成原因。既有安全重現不重跑。

## 新增測試（23）

- [crates/mastercss-compiler/tests/bug_hunt_import_qualifiers.rs](/Users/aron/master/css/crates/mastercss-compiler/tests/bug_hunt_import_qualifiers.rs)
- [crates/mastercss-engine/tests/bug_hunt_lifecycle.rs](/Users/aron/master/css/crates/mastercss-engine/tests/bug_hunt_lifecycle.rs)
- [crates/mastercss-engine/tests/bug_hunt_static_dependencies.rs](/Users/aron/master/css/crates/mastercss-engine/tests/bug_hunt_static_dependencies.rs)
- [crates/mastercss-language/tests/bug_hunt_unicode.rs](/Users/aron/master/css/crates/mastercss-language/tests/bug_hunt_unicode.rs)
- [crates/mastercss-lexer/tests/bug_hunt_boundaries.rs](/Users/aron/master/css/crates/mastercss-lexer/tests/bug_hunt_boundaries.rs)
- [crates/mastercss-render/tests/bug_hunt_stylesheet_resources.rs](/Users/aron/master/css/crates/mastercss-render/tests/bug_hunt_stylesheet_resources.rs)
- [packages/cli/tests/bug-hunt-watch.test.ts](/Users/aron/master/css/packages/cli/tests/bug-hunt-watch.test.ts)
- [packages/create/tests/bug-hunt-multiline-import.test.ts](/Users/aron/master/css/packages/create/tests/bug-hunt-multiline-import.test.ts)
- [packages/eslint-plugin/tests/bug-hunt.test.ts](/Users/aron/master/css/packages/eslint-plugin/tests/bug-hunt.test.ts)
- [packages/figma/tests/bug-hunt-roundtrip.test.ts](/Users/aron/master/css/packages/figma/tests/bug-hunt-roundtrip.test.ts)
- [packages/internal/tests/bug-hunt.test.ts](/Users/aron/master/css/packages/internal/tests/bug-hunt.test.ts)
- [packages/language-service/tests/bug-hunt.test.ts](/Users/aron/master/css/packages/language-service/tests/bug-hunt.test.ts)
- [packages/mcp/tests/bug-hunt-preview-bytes.test.ts](/Users/aron/master/css/packages/mcp/tests/bug-hunt-preview-bytes.test.ts)
- [packages/nuxt/tests/bug-hunt-progressive.test.ts](/Users/aron/master/css/packages/nuxt/tests/bug-hunt-progressive.test.ts)
- [packages/runtime/e2e/bug-hunt-frame.test.ts](/Users/aron/master/css/packages/runtime/e2e/bug-hunt-frame.test.ts)
- [packages/runtime/e2e/bug-hunt-hydration.test.ts](/Users/aron/master/css/packages/runtime/e2e/bug-hunt-hydration.test.ts)
- [packages/server/tests/bug-hunt.test.ts](/Users/aron/master/css/packages/server/tests/bug-hunt.test.ts)
- [packages/tooling/tests/language/bug-hunt.test.ts](/Users/aron/master/css/packages/tooling/tests/language/bug-hunt.test.ts)
- [packages/tooling/tests/lint/bug-hunt.test.ts](/Users/aron/master/css/packages/tooling/tests/lint/bug-hunt.test.ts)
- [packages/tooling/tests/scanner/bug-hunt.test.ts](/Users/aron/master/css/packages/tooling/tests/scanner/bug-hunt.test.ts)
- [packages/tooling/tests/source/bug-hunt.test.ts](/Users/aron/master/css/packages/tooling/tests/source/bug-hunt.test.ts)
- [packages/vite/tests/bug-hunt-relative-hydration.test.ts](/Users/aron/master/css/packages/vite/tests/bug-hunt-relative-hydration.test.ts)
- [packages/webpack/tests/bug-hunt-relative-assets.test.ts](/Users/aron/master/css/packages/webpack/tests/bug-hunt-relative-assets.test.ts)

## 帳本內重現材料

以下腳本的使用方式、控制組與適用限制以对应批次為準。不要一次執行全部腳本；部分證據刻意失敗，部分驗證依使用者要求暫停。

- [BH-0001-0002.mjs](repros/BH-0001-0002.mjs)
- [BH-0003.mjs](repros/BH-0003.mjs)
- [BH-0004.mjs](repros/BH-0004.mjs)
- [BH-0005-0006.mjs](repros/BH-0005-0006.mjs)
- [BH-0018-cli-mjs.mjs](repros/BH-0018-cli-mjs.mjs)
- [BH-0024-angular-routes.mjs](repros/BH-0024-angular-routes.mjs)
- [BH-0025-angular-bundle.mjs](repros/BH-0025-angular-bundle.mjs)
- [BH-0026-binding.mjs](repros/BH-0026-binding.mjs)
- [BH-0027-webpack-asset.mjs](repros/BH-0027-webpack-asset.mjs)
- [BH-0029-rspack.mjs](repros/BH-0029-rspack.mjs)
- [benchmark-controls.mts](repros/benchmark-controls.mts)
- [browser-lifecycle-metrics.mts](repros/browser-lifecycle-metrics.mts)
- [css-output-report.mjs](repros/css-output-report.mjs)
- [css-specificity-controls.mjs](repros/css-specificity-controls.mjs)
- [css-structure-report.mjs](repros/css-structure-report.mjs)
- [compiler-diagnostic-report.mjs](repros/compiler-diagnostic-report.mjs)
- [build-diagnostic-report.mjs](repros/build-diagnostic-report.mjs)
- [docs-css-report.mjs](repros/docs-css-report.mjs)
- [docs-css-http-controls.mjs](repros/docs-css-http-controls.mjs)
- [browser-smoke.mjs](repros/browser-smoke.mjs)
- [example-browser-matrix.mjs](repros/example-browser-matrix.mjs)
- [extraction-diagnostic-report.mjs](repros/extraction-diagnostic-report.mjs)
- [eslint-examples.mjs](repros/eslint-examples.mjs)
- [isolated-package.py](repros/isolated-package.py)
- [laravel-smoke.mjs](repros/laravel-smoke.mjs)
- [lsp-cancellation-settings.mts](repros/lsp-cancellation-settings.mts)
- [mcp-stdio.mjs](repros/mcp-stdio.mjs)
- [mcp-preview-concurrency.mts](repros/mcp-preview-concurrency.mts)
- [nuxt-dev-hmr.mjs](repros/nuxt-dev-hmr.mjs)
- [next-hmr-browser-copy.mjs](repros/next-hmr-browser-copy.mjs)
- [nested-build.mjs](repros/nested-build.mjs)
- [shared-contracts.mts](repros/shared-contracts.mts)
- [site-build.mjs](repros/site-build.mjs)
- [site-content.mjs](repros/site-content.mjs)
- [site-dev.mjs](repros/site-dev.mjs)
- [site-interactions.mjs](repros/site-interactions.mjs)
- [startup-vite-diagnostic.mjs](repros/startup-vite-diagnostic.mjs)
- [startup-diagnostic-report.mjs](repros/startup-diagnostic-report.mjs)
- [startup-bin-control.mjs](repros/startup-bin-control.mjs)
- [ssr-example.mjs](repros/ssr-example.mjs)
- [vite-scan-count-control.mjs](repros/vite-scan-count-control.mjs)
- [vite-hmr-browser-copy.mjs](repros/vite-hmr-browser-copy.mjs)
- [vscode-host.cjs](repros/vscode-host.cjs)
- [vscode-host.mjs](repros/vscode-host.mjs)
- [vscode-settings-host.cjs](repros/vscode-settings-host.cjs)
- [vscode-settings-host.mjs](repros/vscode-settings-host.mjs)

- [build-performance-report.mjs](repros/build-performance-report.mjs)
- [browser-css-cost-report.mjs](repros/browser-css-cost-report.mjs)
- [delivery-mode-controls.mjs](repros/delivery-mode-controls.mjs)
- [progressive-diagnostic-controls.mjs](repros/progressive-diagnostic-controls.mjs)

- [interaction-controls.mjs](repros/interaction-controls.mjs)
- [interaction-array-controls.mjs](repros/interaction-array-controls.mjs)

- [mutation-preseed-controls.mjs](repros/mutation-preseed-controls.mjs)
- [style-invalidation-controls.mjs](repros/style-invalidation-controls.mjs)

- [mcp-multiprocess.mjs](repros/mcp-multiprocess.mjs)

- [vscode-corpus-host.mjs](repros/vscode-corpus-host.mjs)
- [vscode-corpus-host.cjs](repros/vscode-corpus-host.cjs)
- [vscode-corpus-check.py](repros/vscode-corpus-check.py)

- [style-invalidation-static.py](repros/style-invalidation-static.py)
- [style-invalidation-style-control.mjs](repros/style-invalidation-style-control.mjs)

- [mcp-filesystem-faults.mjs](repros/mcp-filesystem-faults.mjs)

- [mcp-process-interruption.mjs](repros/mcp-process-interruption.mjs)
