# 新增檔案與驗證限制

0088 起使用者已授權「執行並修正所有問題」，新增產品／範例修正與一個 Nuxt theme 回歸測試。0089–0091另修正語言、SSR與installer，新增語言Rust與native/Wasm回歸測試；最新狀態及驗證見 [目前交接點](README.md#目前交接點)；下列內容是原調查 commit 的檔案歸屬與限制，保留作歷史。

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

0092–0093新增compiler import條件與Figma definitions/modes修復、最小測試與repros；詳細限制見批次。未提交；原有其他工作與fixtures/snapshots/dependencies/lockfiles/CI均保留。

0094–0095修復runtime CSP/iframe與scanner/CLI.mjs發現，新增回歸測試；3個舊hydration測試改驗證原生JSON module/error contract，未改fixtures/snapshots。0092新增測試baseManifest型別材料已補正。所有修復仍未新增commit，benchmark history僅留/tmp。

本次依使用者指示提交0093–0095已完成的5項修復及帳本/證據。0092 compiler部分修復和0096/0097進行中變更不納入產品提交；共用CLI/tooling檔案僅暫存0095的.mjs修改，與0095驗證hash一致。Site其他工作原樣保留，未推送。

0096/0097新增watch helper、glob/實際watch回歸、binding載入失敗/reset/CLI參數測試及built CLI觀察repro。兩批驗證完成，未提交；compiler部分修復與Site其他工作保留。

0098將MCP與Rust inspection bytes統一為UTF-8；新增/擴充byte metadata與native binding測試、built stdio重現。既有Rust emoji byte斷言由2改4，屬單位修正；未改fixtures/snapshots。所有新增修復仍未提交。

0099新增Svelte分支走訪、8個parser/scanner測試及實際Svelte/Vite三瀏覽器static互動repro。BH-0011修復；BH-0010未完成。未提交，保留其他工作及既有fixtures/snapshots/dependencies/lockfiles/CI。

0100新增Rust HTML attribute decoder/token reader、2231entry固定資料表與stdlib generator、Rust/TS回歸及browser corpus/static build重現。BH-0010已修復，既有JS/raw字串行為保留；新表與parser不進runtime engine。未改依賴/lockfile/fixtures/snapshots/CI，未提交，未清理帳本。

本次依使用者最新指示提交0096–0100已完成的5項修復（BH-0019/0026/0020/0011/0010）及對應測試、重現與帳本。提交前核對36個來源/測試/重現/其他工作雜湊一致；沿用各批最終測試、lint/types/build及browser證據。0092 compiler部分修復、0101並行重現與Site其他工作留在工作區；未推送、未清理帳本，目標仍active。

0101新增MCP私有跨程序preview gate、token認領與10個回歸測試，更新公開README的序列化/timeout/partial-write界線；新增built stdio及鎖壓力repros，既有fault/interruption repro僅增可選證據輸出路徑。BH-0031修復但本批未提交；0092部分修復、Site其他工作及全部阻礙保留。

0102新增ESLint私有JavaScript literal範圍/編碼helper，5規則傳遞cooked分析和來源對映，新增37個通過控制與2個仍失敗的Vue外層encoding回歸；現有fixtures/snapshots未改。對AST raw與source不一致情境暫不給不安全autofix，完整修復仍待外層HTML mapping。BH-0015未完成、不得作為已完成修復提交；MCP0101、compiler0092與Site其他工作保持原樣。

0103完成BH-0015 Vue外層HTML mapping，新增Rust mapping與tooling公開API，經xtask重新產生binding protocol，ESLint組合JS/HTML來源與替換編碼。ESLint291/tooling215/binding17/config4/Rust18及21三瀏覽器控制通過。0102原始失敗證據保留，由0103最終结果取代。

本次依使用者指示提交0101及0102–0103兩項已完成修復BH-0031/0015及必要測試/README/帳本/重現。0092 compiler部分修復和Site其他工作留在工作區，未推送。新增tooling API為刻意的相容擴充；未改依賴/lockfile/fixtures/snapshots/CI/release。25fixed/19unresolved、65checked/10blocked，目標仍active。

0104修復BH-0016 Vite page-relative hydration asset URL，共用既有toAssetHref並為兩個HTML入口傳入頁面路徑，明確空assetsDir正確發佈。新增6個production build矩陣測試與36三瀏覽器built驗證repro；Vite106tests/lint/types/build與原範例build通過。未提交，原fixtures/snapshots/依賴/lockfile/CI、compiler0092及Site其他工作保持原樣；26fixed/18unresolved、10blocked coverage。

0105完成BH-0017：Webpack每頁HTML asset href與注入entry的auto publicPath，新增14tests及45+9built三瀏覽器控制；完整63tests serial/lint/types/build/範例build通過。首次parallel shared-dist載入失敗與新test型別材料錯誤分開保留；前者仍待harness調查。未提交，原fixtures/snapshots/依賴/lockfile/CI、0104/0092及Site其他工作保留。27fixed/17unresolved、10blocked coverage。

0106完成BH-0030：runtime entry在固定/build-wide/callback檔名設定使用獨立content-hashed檔名，README記錄契約；新增6個真實production build測試，擴充browser repro，新增原playground API/browser控制。Webpack69tests、36+3browser及lint/types/build/範例build通過；官方playground缺工具仍blocked。未提交，0104/0105、compiler0092與Site其他工作保留；28fixed/16unresolved、10blocked coverage。

0107新增Rust render animation syntax22tests及直接讀取同組case的browser repro，19Rust回歸FAIL、66browser controls支持預期；不改產品，不改既有fixtures/snapshots/依賴/lockfile/CI。engine36baseline/Clippy通過，BH-0001/0002仍未完成。保留0104–0106修復/0092及Site其他工作，未提交。

本次提交以5dc6f2ad1為父提交：0104–0106三項完成修復BH-0016/0017/0030，連同必要測試/README/重現/帳本及0107已完成的語法調查證據。0107失敗回歸不代表產品修復；0092 compiler與0108 engine/lexer部分實作、新材料和Site其他工作均未提交。0108仍須重建Wasm及完成native/Wasm、下游、runtime/payload驗證。未推送，28fixed/16unresolved、10blocked保持。

0108未提交部分修正：新增Rust lexer/engine CSS詞法與動畫位置判讀，新增lexer3/value3及value-slot9測試與兩個binding/browser重現。22syntax及native/Wasm/public/runtime檢查通過；新slot9tests仍5FAIL，包含4個未完成實作引入的漏產，需繼續修正，BH-0001未fixed。Engine Wasm gzip增4503bytes、global/manifest不變；benchmark history只保留/tmp，不納入repo。0092與Site工作保留，無依賴/lockfile/既有fixtures/snapshots/CI/release變更。詳見0108。

0109完成BH-0001：Rust數值token、動畫欄位狀態及保留原位置的變數/mode/fallback/cycle處理；快取依incoming state重用，使用既有hash容器並排序最終名稱。擴充新tests/repros與共享10-case corpus，未動既有fixtures/snapshots/依賴/lockfile/CI/release。129Rust PASS及3個BH-0002/0003既有FAIL、CSS72/compiler127/server67/runtime273、87+42browser及auto語法差異控制均已分類。engine Wasm gzip增22484bytes；resource及runtime benchmark history只在/tmp。29fixed/15unresolved、10blocked不變；未commit/push，0092/Site工作保留。

本次依使用者指示，以e71cce539為父提交，提交0108–0109完成的BH-0001修復與測試/重現/帳本證據。20項來源雜湊逐一符合0109最終驗證；與0110交疊的4個engine檔案僅暫存0109已驗證內容，工作區0110版本保持原樣。0092 compiler、0110部分修改與Site其他工作不納入，benchmark history仍只留/tmp，未推送。
