# 新增檔案與驗證限制

- 0256：在owned副本完成BH-0063候選修復：`nextGeneratedGlobalAnimations`從Master generatedCSS取出preset keyframes名稱，Turbopack無host PostCSS分支以`globalAnimations`建立module graph，`:local(fade)`還原為global `fade`且`@keyframes fade`交付；`module-animation` Turbopack baseline FAIL→fixed／recheck PASS，Webpack對照全PASS（Chromium／WebKit）。剩餘generated／imported-keyframe與global-context FAIL歸類為Turbopack combined-root PostCSS契約差異，不新增finding。promote等於交付0232–0256整套13檔約800行候選，使用者決定先不promote；BH-0063改為owned候選修復，63historical／58fixed／5unresolved不變。[證據](evidence/0256-final-checks.json)；[批次](batches/0256-next-turbopack-module-animation.md)；[前次](progress-history-0256-next-turbopack-animation.md)。

- 較早的交接、提交核對與歸檔指標已逐字保存於 [歷史紀錄（0254整理）](progress-history-0254-ledger-heads.md)；目前狀態以本檔最新批次與原批次為準。

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

0110完成BH-0002：raw var()改用與animation共用的一次CSS斷詞，移除舊字串掃描，新增25-case Rust/browser共享corpus。75raw browser、63compiled controls與12預期語法拒絕/native-WasmPASS；131RustPASS/2BH-0003FAIL、CSS72/compiler127/server67/runtime273與lint/types/Clippy/parity通過。Wasm比0109減2353raw/687gzip/810brotli bytes，JS/manifest不變；resource及runtime benchmark完成，history只留/tmp。新driver的無效CSS編譯假設及手動probe缺options均分類為測試材料錯誤。未改依賴/lockfile/既有fixtures/snapshots/CI/release；0092與Site其他工作保留，本批未提交。[0110](batches/0110-variable-syntax.md)。

0111完成BH-0003：engine resources共用iterative依賴保留，static roots建立永久reference、inline中介傳遞依賴，對稱釋放及不產生初始化丟棄mutation。新增12Rust groups、5compiler shared-corpus tests、2runtime tests（三瀏覽器6控制）與browser/performance drivers；145Rust/CSS72/compiler132/server67/runtime279及72browser全通過。Wasm比0110減982raw/878gzip/267brotli，JS/manifest不變；static與runtime benchmark完成，原始history僅/tmp。新測試的API/Node載入/JSON型別/retention時序問題均分開記錄；Node預設Wasm loader另列待分類候選。本批無commit，0110/0092/Site工作保留，未動依賴/lockfile/既有fixtures/snapshots/CI/release。[0111](batches/0111-static-retention.md)。

0112新增external-import-order重現與帳本診斷，沒有產品修改：native/compiler-Wasm10cases同結果，60三瀏覽器對照21PASS/39FAIL，區分21實際cascade錯誤與18typed拒絕。保持BH-0004未完成，具體graph/stylesheet-boundary與host交付下一步見[0112](batches/0112-external-import-order.md)。既有0092/0110/0111及Site來源hash保持、未commit/push，不重跑暫停的0038追加驗證。

本次依使用者指示提交0110–0111的BH-0002/0003完成修復及0110–0112調查證據，以7e225b3da為父提交。完成來源與既有最終hash一致；提交前重跑engine/lexer/render測試。0092/0113 compiler部分修改、新graph及未完成測試與Site其他工作保留未提交；未推送，未納入benchmark原始history。當前0113接續點見README；goal仍active，0038追加驗證仍暫停。

0113新增compiler Rust stylesheet graph/renderer與共用source/reference載入，8Rust test groups/18-case corpus和108三瀏覽器資產控制通過；42Rust/132compiler、Clippy/lint/types/codegen通過。原public入口39FAIL保持，BH-0004未完成；未動binding protocol/host入口、依賴或runtime。本批不commit/push，下一步及測試材料錯誤分類見[0113](batches/0113-stylesheet-boundaries.md)。

0114新增Rust圖編譯、private native compose位置、native/Wasm ABI與公開compileStylesheets，透過xtask template產生protocol，未手改生成檔。50Rust/153compiler、binding17/Wasm4、126browser、built native/Wasm/Node sync及lint/types/build/Clippy/parity通過；原API golden與census仍FAIL，未改golden。既有file/build入口及URL ownership/base待接通，BH-0004未結案。runtime產物hash不變；compilerWasm當前大小與測試材料/實作錯誤分類見[0114](batches/0114-compiled-stylesheets.md)。未commit/push，保留Site與既有工作。



0115：Rust來源URL discovery與圖編譯resourceURLs映射完成有界驗證；56Rust/157compiler、binding17、3browser資源與126graph控制通過。既有入口60對照仍39FAIL，Node自動資源處理、references/decoded imports、診斷位置及file/project/build/CLI交付仍未完成，root gates保持FAIL。[0115](batches/0115-resource-url-ownership.md)。31fixed/13unresolved、65checked/10blocked不變；未commit/push。

0116：Node/Rust import discovery統一decoded CSS specifiers；既有file入口的escaped/encoded/query/bare local路徑與reference sourceText #截斷已修正。60Rust/167compiler/MCP34、42新browser與96local控制通過；原external60仍39FAIL。prepared reference/resource emission與file/project/build/CLI整體交付未完成，BH-0004保持未結案。31fixed/13unresolved、65checked/10blocked及root gates不變；[0116](batches/0116-node-import-discovery.md)。未commit/push。

0117：BH-0035已修復；actual VS Code缺少命令錯誤manual/settings從0/1降為0/0，registered/failing/removed controls與原設定/格式化功能通過，31tests及lint/types/full isolated buildPASS。32fixed/12unresolved；65checked/10blocked與4root gates保持。BH-0004接續0116，0038追加驗證仍暫停；未commit/push。[0117](batches/0117-vscode-settings-restart.md)。

提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。

0118：實際 source／built CLI 各18個三瀏覽器對照6PASS/12FAIL，確認外部import遭刪除、順序錯誤、巢狀條件拒絕與relative resource錯誤目錄；沿用BH-0004。已抽出Node filesystem/package graph準備流程供collection接續，167compiler/34CLI、42file browser及lint/types/build通過，兩項root API失敗hash不變。完整asset delivery仍未完成；32fixed/12unresolved、65checked/10blocked及4root gates保持。[0118](batches/0118-cli-stylesheet-delivery.md)。未commit/push，0038追加驗證仍暫停。

0119：CLI file export已接Rust graph，實際輸出相依CSS與resources；source/built各18browser全通過（原各12FAIL），reference資源、分入口native pruning與watch更新共37CLI tests通過。61Rust/168compiler/binding17、126graph與3resource browsers及lint/types/build/Clippy/codegen/parity通過。舊入口仍39FAIL，BH-0004保持部分修復；file/project/build/no-export、診斷位置、output exclusions與stale asset cleanup續作。32fixed/12unresolved、65checked/10blocked、4root gates不變；0038追加驗證仍暫停。未commit/push。[0119](batches/0119-cli-asset-delivery.md)。

本次提交整理（父提交 `927278b1c`）：僅納入 0118–0119 已完成的調查紀錄、驗證證據及 CLI 重現腳本；BH-0004 產品、測試與公開文件實作仍未提交，其他對話的 Site 變更保持原樣。證據對應各批來源雜湊所標識的工作區版本，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0119 的 55 個保留檔案雜湊全部一致；其後 0120 已修改 7 個相關來源／文件，0119 證據不代表這些新版本全部通過。0120 仍在進行：新增 layer probe 有 36 次失敗，須處理排除 native CSS 時空 import 仍宣告 layer、改變 cascade 的問題，再重跑輸出組合與 native/Wasm 驗證；0120 材料保留工作區。32 已修復／12 未解決、65 已檢查／10 受阻及 4 項 root gates 不變；0038 追加驗證仍等待明確身分確認。未推送。

0120：standalone collection 的 native／Master base／generated 與 preserveNativeCSS 共16組合已驗證；修正排除 native 後空 import 仍建立 layer 的問題，新增圖層探針由36FAIL降為0FAIL，三瀏覽器／screen-print共96PASS。63Rust／185compiler／37CLI／17binding及source、built CLI各18PASS；lint/types/build/Clippy/codegen/parity與Site prepare通過（lint 0errors/75既有warnings）。舊入口仍39FAIL，BH-0004未結案；下一批先重現資源URL改寫後的原始檔名／UTF-16診斷位置，再續既有入口與資產清理。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停保持。HEAD912a73b26；本批未提交／推送。[0120](batches/0120-standalone-output-modes.md)。

0121：BH-0004 graph 資源改寫後的 UTF-16 診斷位置、style definition 來源位置及 collection variant 檔名已修正；原7host／2Rust失敗回歸通過，擴充後194compiler／65Rust／37CLI／17binding通過，source/built診斷各4組、96output-mode與3resource browser通過。CLI首跑因與dist重建重疊而7FAIL，建置完成後37全通過；分類為排程錯誤。舊入口仍39FAIL，無range的錯誤及其他交付契約仍未完成。下一批重現資源／import移除與缺檔還原的watch恢復，續查stale sidecar清理。32fixed/12unresolved、65checked/10blocked、4root gates及0038身分暫停保持。HEAD912a73b26；未提交／推送。[0121](batches/0121-original-source-diagnostics.md)。

0122：CLI file-export watch 的缺少／刪除 import與resource恢復已修正，含新巢狀目錄與啟動缺檔共6情境；失敗期間頁面編輯在恢復後生效。43CLI／194compiler、source/built各12三瀏覽器控制及既有built export18通過；lint/types/build與Site prepare通過。移除import後不再請求資源或監看舊CSS，但stale sidecars仍在磁碟。下一批驗證發布中途寫入失敗與資產所有權／清理，不能以準備失敗恢復推論發布原子性。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停不變。HEAD912a73b26；未提交／推送。[0122](batches/0122-watch-dependency-recovery.md)。



0123：Node CLI 發布改用版本化、不可覆寫的 sidecars，完整寫好資產後才原子切換入口；原2失敗回歸、擴充9發布控制及完整52CLI通過，source/built各12發布browser、既有built export18與watch12通過。重複輸出bytes一致，寫入失敗及舊入口讀者仍可讀取原資產；lint/types/build通過。舊資產保留，所有權／清理、其他graph入口及39個legacy失敗仍未完成。下一批先驗證跨執行與多輸出資產所有權，再設計保留期限及中斷恢復，不能立即刪掉舊讀者依賴。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；本輪未提交／推送。[0123](batches/0123-immutable-cli-publication.md)。

0124：Node CLI 已加入跨執行的資產所有權、發布 journal 恢復及有期限清理；保留目前／上一版，其餘版本至少保留24小時（本輪採用已說明的預設，未收到偏好回覆）。71CLI、4個SIGKILL恢復控制、source/built各120跨程序臨界區及合計90browser對照通過，使用者修改／原有檔案、另一輸出與仍被引用的借用資產保留；lint/types/build通過。未記入journal的早期暫存檔與非協作writer等限制仍明列。下一批回到compileCSSFile／compileCSSManifestFile／compileProjectManifest及下游資產契約；最新legacy39FAIL仍未修復，不能用CLI子集結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；未提交／推送。[0124](batches/0124-cli-asset-ownership.md)。



0125：Node project manifest 改以原始逐檔 import/reference graph 交由 Rust 編譯；qualified local import 內有 external CSS 時可取得定義，保留 reference 依賴與 imported source 路徑。Rust9/compiler199/binding17/CLI71/Vite106/Webpack69及實際 production manifest query 三瀏覽器18對照通過；lint/types/build/Clippy/fmt/codegen/parity通過。跨入口原1FAIL為測試預期blue而實際正規化#00f，已更正並加反向順序控制。舊public仍21PASS/39FAIL，兩root API失敗hash與5runtime/compiler artifact hash不變。下一批先重現compileManifestFileSync的qualified external路徑，核對其nativeCSS契約再續file/build/no-export交付；不能以manifest-only結果結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；本批實作未提交／推送。[0125](batches/0125-project-manifest-graphs.md)。

0126：公開compileManifestFileSync新增明確delivery overload，沿用Node/Rust graph回傳完整CSS與resource資產；呼叫端須全部發布，css/nativeCSS/generatedCSS僅代表入口。6focused與205compiler、server67/MCP34/CLI71及source/built各66三瀏覽器對照通過；compiler lint/types/build通過。未指定delivery的3qualified external案例仍拒絕，最新完整legacy仍0125的39FAIL，BH-0004未結案。API census失敗hash不變，package golden新增2個刻意公開型別差異，未改golden。下一批重現實際Vite/Webpack CSS build入口並接asset publisher；native CLI/no-export與其餘契約續作。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；未提交／推送。[0126](batches/0126-file-manifest-delivery.md)。

0127：實際Vite/Webpack static CSS build各8輸入，共16build有6FAIL；成功build的60三瀏覽器對照36PASS/24FAIL，沿用BH-0004。直接插入或hoist import各12FAIL；明確分段的既有Rust graph原型18PASS，但真實bundle的slot定位/條件與資產發布尚未實作。另確認獨立BH-0045：Vite red→blue最終CSS不同卻同hash URL，fresh3PASS/保留舊回應3FAIL。現在45歷史問題：32fixed/13unresolved；65checked/10blocked、4root gates、4候選及0038身分暫停保持。下一步先建立compiler來源/範圍感知的bundle分段，再接graph註冊與發布，同時讓最終CSS與所有HTML/JS/preload引用取得正確內容hash；不能只改名CSS。此批只新增重現/證據，產品來源未改。HEAD1c6595586，未提交/推送。[0127](batches/0127-build-publication-boundaries.md)。






- Explicit completed-work commit: BH-0045 Vite source/test/README committed as `bb0989bb6` after fresh110tests/lint/types PASS. Completed0128–0130audit evidence and verbatim history archives are committed separately; unfinished BH-0004/0131 product work and foreign Site edits remain uncommitted and byte-preserved. Goal and all remaining counts stay open. [Commit verification](evidence/0130-commit-validation.json).

0131–0133批次與提交交接原文移至 [changes history0134](changes-history-0134.md)；當前狀態以本檔最新紀錄為準。

0134：修復alias／custom resolver把專案CSS誤當套件而漏裁剪的回歸；改核對實際檔案是否在原名稱的套件根目錄。新增actual10build／54browser，修後36PASS／18FAIL及1Sass buildFAIL；36個裁剪／套件／明確保留控制全通過，剩餘為virtual匯入／入口與Sass入口／匯入。compiler219／Vite110、lint/types/build、既有resolver36／resource18及Site prepare/lint通過（75warnings）。下一批接非檔案來源載入與預處理，保留條件、資源、診斷與watch；不以拒絕計完成。歷史0131–0133交接逐字歸檔。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分暫停不變；HEADef7887f76，未提交／推送。[0134](batches/0134-vite-alias-pruning.md)。

0135：接通Vite virtual CSS來源載入，保留原始CSS、opaque ID/query與條件圖譜；graph-only loader子檔不再額外成為無條件入口。compiler223／Vite110、兩套件lint/types/build通過；13actual builds剩1SassFAIL，72browser為66PASS／6SassFAIL，其中virtual30與裁剪36全通過。既有resolver36／resource18／cache39、3種watch共54與純Vite控制18通過；早期watch非實體暫存路徑及錯用getWatchFiles屬harness問題，query截斷則已修復。Site prepare/lint通過（75warnings）；5artifacts不變，兩root API gates仍失敗。下一步接Sass入口／匯入預處理、virtual資源／reference與其他host路徑，再遷移Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEADef7887f76，本批未提交／推送。[0135](batches/0135-vite-virtual-sources.md)。

0136：Vite Sass入口／匯入改用主機預處理，保留CSS import條件、來源owner與partial依賴；修復additionalData重複、raw解析及CSS Modules匯出，baseFile無custom resolver亦可用。compiler225／Vite114、lint/types/build與原Vite範例通過；原host-inputs13build／78browser全PASS。擴充Sass15build全成功、90browser為84PASS／6managed-inlineFAIL；partial直接／條件／錯誤恢復共54PASS，另驗證一次預期Sass錯誤及原partial路徑。小SVG內嵌造成的network斷言及color格式斷言屬測試錯誤。Site prepare/lint通過（75warnings）；5artifacts與兩root API失敗hash不變。下一步修managed `?inline`完整字串／資產交付，再補preprocessor位置對映、Modules／其他host路徑與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEAD111046867，本批未提交／推送。[0136](batches/0136-vite-sass-sources.md)。

0137：managed CSS／Sass `?inline`改為獨立完整字串，Rust安全展開import並保留namespace／external邊界；修復URL誤改作者字串、IIFE／UMD路徑與graph-only假警告。83Rust／227compiler／118Vite及198public、84inline、90Sass、36watch瀏覽器對照PASS。early WebKit時序、pruning／lazy／其他格式、source maps與Webpack仍待驗證；compiler-Wasm+9642raw／2868gzip／1947brotli，runtime四產物不變。33fixed／12unresolved、10blocked、4root gates／4候選與0038暫停不變；HEAD087655705，未提交／推送。[0137](batches/0137-inline-css-delivery.md)。

0138：修復inline無條件發布，依Rust URL參照及實際輸出chunk裁剪子CSS／資源，保留共用anchor。Vite121／lint/types/build、10build／30browser、原inline84與watch18PASS；純Vite兩筆閒置資源保留列BASELINE。used字串仍有35byte anchor，其他格式／cycles／maps與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0138](batches/0138-inline-asset-pruning.md)。

0128–0130歷史進度逐字移至 [歷史進度（0139整理）](progress-history-0139.md)；目前狀態以本檔最新批次為準。

0139：修復SSR inline輸出本機file URL及繞過emitAssets設定；改用public base，關閉發布時搭配client資產。Vite125、SSR24build／36browser、Node16loads、worker6及原inline84browser全PASS；Site prepare/lint通過（75warnings）。首輪library格式設定與SSR弱斷言屬harness錯誤。自訂URL映射／maps／其他host與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0139](batches/0139-inline-server-hosts.md)。

0140：inline已接renderBuiltUrl的js／css主機映射、runtime URL與URI編碼；修復映射改變卻沿用CSS檔名、relative base的client／SSR資產不一致。Vite131／lint/types/build、最終URL36／paired12／inline84／pruning30／watch18browser全PASS；Site通過（75warnings）。來源序列化仍由Rust負責，automatic hooks／multi-environment／cycles仍待驗證；下一批Sass原始位置對映，再續其他host與Webpack。33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0140](batches/0140-inline-built-urls.md)。



0145：development CSS／Sass Modules接入既有主機預處理與scoped匯出／usage流程，依root／composes子檔失效cache及Vite代理modules；修復managed entry缺少具名匯出與local Sass500。Vite160／lint/types/build／範例PASS；entry／local、直接／巢狀、三瀏覽器HMR72及production60對照PASS，逐步核對新HMR且無整頁reload。preset blue色彩oracle與首次baseFile/preserveImports接入錯誤分開留證。Site通過（75warnings），五產物不變。下一批dev inline／raw／url與普通Sass、其他host／Webpack；0144巢狀缺檔主機終止仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選與0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0145](batches/0145-module-development-hmr.md)。

0141–0144歷史進度逐字移至 [歷史進度（0146整理）](progress-history-0146.md)；目前狀態以本檔最新批次為準。

0146：修復共用manifest HMR hook丟棄普通CSS／inline／raw更新modules，保留原節點並合併virtual manifest；internal18、Vite160、Astro15與三套件lint/types/build、Vite／Astro範例均PASS。修後完整開發request矩陣93PASS／3FAIL；剩managed Sass ?url的link為/style.scss，但HMR送/style.scss.css?direct，更新路徑不匹配，已留WebSocket證據待修。另Modules HMR18PASS；URL原文oracle與pure冷啟動boot判定分開記錄。Site通過（75warnings），五產物不變；20段歷史逐字歸檔。下一批先修Sass direct URL HMR，再續其他request／host與Webpack；0144巢狀缺檔仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0146](batches/0146-development-style-requests.md)。

部分較早批次交接逐字保存於[0159歷史歸檔](progress-history-0159.md)，目前狀態以最新交接與原批次為準。

- 使用者再次授權提交已完成部分：0179的8個Benchmark程式／測試檔已提交 `d572f6bed`，本次重跑101tests與types通過（套件無lint script）；另同步0179–0180已收尾帳本、原始證據與2個重現腳本。389來源雜湊符合0180最終版本。0180產品修正仍依賴未完成的BH-0004 graph實作，連同套件測試、公開文件、其他對話Site變更與0181起始雜湊保留工作區；證據對應記錄的工作區來源，不能宣稱乾淨checkout可獨立重現。47historical／45fixed／2unresolved、65checked／10blocked、4root gates／4原候選及0038身分暫停保持，目標active。0181目前只有讀取與基線記錄，下一步建立retained Sass reference／virtual source資源所有權的聚焦重現；歷史HEAD及未提交敘述保留當時狀態。未推送。[提交核對](evidence/0180-commit-validation.json)。
