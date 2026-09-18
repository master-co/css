# Master CSS 潛在 bug 調查

## 目標、範圍與限制

- 目前持續目標「執行並修正所有問題」；沿用後續已授權的必要產品／範例修正，完整證據通過才結案。未再次授權不提交；以下起始調查限制保留為歷史。
- 起始 commit：`e66ba7236e183046dfc071f190caa44ade0b95e9`；日期：2026-09-07。
- 原始主工作目錄與 internal 子模組乾淨；submodule commit `5bf7143d49ce6eaa1c345b3971bf99e1cd849c3c`。
- 覆蓋全部 workspace/crates/integrations/examples/site；詳見 [coverage](coverage.md)。
- 只新增/更新帳本、最小測試及重現；不改產品、既有 fixtures/snapshots、lockfiles、CI/release。原先不 commit；使用者後續明確授權提交已完成的調查、測試與證據，未完成狀態仍保留。
- 保留其他工作變更；每批核對相關 source hashes/HEAD，變動的舊結論標待重驗。
- 帳本是進度及結論唯一依據，當前原始碼與可重現證據決定行為。
- Markdown 約 320 行或 40 KiB 拆分；硬上限 400 行/48 KiB。
- 順序：Rust engine/CSS → compiler/contracts → server/runtime → extraction/scanner → language/ESLint → integrations → other/examples → site/support。
- 已檢查僅代表完成列明的檢查；受阻不計完成。

## 覆蓋與問題

- 75 單位：65 已檢查、0 進行中、0 未開始、10 受阻。
- 問題：[findings](findings.md), 63 historical confirmed findings; 62 fixed, 1 unresolved; blocked coverage remains unfinished.
- 交付：[依嚴重度排序的報告](report.md)、[新增檔案與驗證限制](changes.md)。

## 批次索引

- [0000–0084 歷史批次索引](batch-index-history-0172.md)：原文與所有批次連結逐字保留。

- [0085 MCP filesystem faults](batches/0085-mcp-filesystem-faults.md): four actual SDK permission/stale/retry controls; partial-write limitations classified.

- [0086 MCP process interruption](batches/0086-mcp-process-interruption.md): own-process termination/restart and1024file recovery controls.

- [0087 Completion prerequisites](batches/0087-completion-prerequisites.md): all75remainingrows preserved; first verified post-follow-up impasse observation.

- [0088 Example and Nuxt fixes](batches/0088-example-nuxt-fixes.md)：Angular/ESLint fixed; Nuxt tests and diagnostics in progress.

- [0089 Language and Nuxt](batches/0089-language-and-nuxt-validation.md)：4 additional fixes verified.

- [0090 Server HTML fixes](batches/0090-server-html-fixes.md)：3server fixes verified; downstream Nuxt follow-up.

- [0091 Installer imports](batches/0091-create-import-boundaries.md)：BH-0021 fixed,58tests PASS.

- [0092 Import conditions](batches/0092-import-conditions.md)：本機條件修復驗證完成，BH-0004仍有未完成邊界。

- [0093 Figma import](batches/0093-figma-import.md)：BH-0022修復，15tests及三瀏覽器built plugin/UI控制通過。

- [0094 Runtime CSP/frame](batches/0094-runtime-csp-frame.md)：BH-0008/0009修復，273browser tests與benchmark通過。

- [0095 ESM discovery](batches/0095-mjs-source-discovery.md)：BH-0012/0018修復，scanner/CLI/Vite驗證通過。

- [0096 CLI source watch](batches/0096-cli-source-watch.md)：BH-0019修復，新來源與排除/重載控制通過。
- [0097 CLI binding](batches/0097-cli-binding-selection.md)：BH-0026修復，native/Wasm選擇、reset與載入錯誤控制通過。

- [0098 MCP UTF-8 bytes](batches/0098-mcp-utf8-bytes.md)：BH-0020修復，preview/format/render/inspection大小與磁碟檔案一致。

- [0099 Svelte branches](batches/0099-svelte-branches.md)：BH-0011修復；BH-0010仍未完成。

- [0100 HTML references](batches/0100-html-character-references.md)：BH-0010修復，完整命名/數值參照及三瀏覽器對照通過。

- [0101 MCP concurrency](batches/0101-mcp-preview-concurrency-fix.md)：BH-0031修復；同token、跨程序、權限重試與中止恢復控制通過。

- [0102 ESLint escapes](batches/0102-eslint-javascript-escapes.md)：BH-0015部分修復；Vue外層HTML entity對映仍有2個失敗測試。

- [0103 Vue attribute mapping](batches/0103-vue-attribute-mapping.md)：BH-0015修復，291 ESLint測試與21三瀏覽器控制通過。

- [0104 Vite hydration URLs](batches/0104-vite-relative-hydration.md)：BH-0016修復；106tests與36三瀏覽器控制通過。

- [0105 Webpack runtime URLs](batches/0105-webpack-relative-runtime.md)：BH-0017修復；63tests與54三瀏覽器控制通過。

- [0106 Webpack fixed filenames](batches/0106-webpack-fixed-filename.md)：BH-0030修復；69tests、36檔名矩陣與3原playground瀏覽器控制通過。

- [0107 Animation syntax](batches/0107-animation-syntax-evidence.md)：22新增語法回歸19FAIL/3PASS，66瀏覽器語法對照PASS；BH-0001仍未修復。

- [0108 Animation syntax partial](batches/0108-animation-syntax-partial.md)：22syntax及native/Wasm/public/runtime驗證通過，但擴充9個value回歸仍5FAIL；BH-0001部分修正未完成。

- [0109 Animation value context](batches/0109-animation-value-context.md)：BH-0001修復，29value/87browser、42variable browser與runtime273通過。

- [0110](batches/0110-variable-syntax.md) Raw variable syntax：BH-0002修復，25cases/75browser、131RustPASS/2BH-0003FAIL、runtime273PASS。

- [0111](batches/0111-static-retention.md) Static retention：BH-0003修復，145Rust/132compiler/279runtime與72browser通過。

- [0112](batches/0112-external-import-order.md) External import order：native/Wasm10一致，60browser對照21PASS/39FAIL；BH-0004仍未修復。

- [0113](batches/0113-stylesheet-boundaries.md) Stylesheet boundaries：Rust graph/renderer初步實作，108browser與42Rust/132compilerPASS；既有public仍39FAIL，BH-0004未完成。

- [0114](batches/0114-compiled-stylesheets.md) Compiled stylesheets：共用manifest、保留native compose位置，native/Wasm公開compileStylesheets的126browser、50Rust/153compiler通過；BH-0004尚未接既有file/build入口。

- [0115](batches/0115-resource-url-ownership.md) Resource URL ownership：來源檔案URL在manifest合併前映射，56Rust/157compiler、3browser資源與126graph控制通過；既有入口仍39FAIL，BH-0004未完成。

- [0116](batches/0116-node-import-discovery.md) Node import discovery：既有file入口已修復大小寫／跳脫import、編碼檔名、query/fragment與bare local paths；60Rust/167compiler/MCP34、42新browser及96local控制通過；完整資產交付仍未完成。

- [0117](batches/0117-vscode-settings-restart.md) VS Code settings restart：BH-0035修復，缺少／已註冊／失敗／移除optional command的實際host控制、完整設定切換與31tests通過。

- [0118](batches/0118-cli-stylesheet-delivery.md) CLI stylesheet delivery：actual CLI失敗已直接驗證；Node準備流程抽出，完整交付未完成。

- [0119](batches/0119-cli-asset-delivery.md) CLI asset delivery：source/built各18browser及37CLI tests通過；BH-0004其他入口仍未完成。
- [0120](batches/0120-standalone-output-modes.md) Standalone output modes：16選項組合／96browser與185compiler通過，空import圖層順序修正；BH-0004整體仍未完成。

- [0121](batches/0121-original-source-diagnostics.md) Original diagnostics:194compiler/65Rust PASS; original file/range restored; BH-0004 remains partial.

- [0122](batches/0122-watch-dependency-recovery.md) Watch recovery:6process cases,43CLI/194compiler and24browser controls PASS; publication/cleanup remain unfinished.

- [0123](batches/0123-immutable-cli-publication.md) Immutable CLI publication:52CLI and42built/source publication/export browser controls PASS; cleanup remains unfinished.

- [0124](batches/0124-cli-asset-ownership.md) CLI asset ownership:71tests,90browser controls and240multiprocess sections PASS; legacy consumers remain unfinished.

- [0125](batches/0125-project-manifest-graphs.md) Project manifests:199compiler/9Rust and18production manifest-query browser controls PASS; legacy39failures remain.

- [0126](batches/0126-file-manifest-delivery.md) Public file asset delivery:205compiler and132source/built browser comparisons PASS; no-delivery/legacy consumers remain unfinished.

- [0127](batches/0127-build-publication-boundaries.md) Actual builds:6build/24browser failures; graph-segment proof18PASS; newBH-0045 final CSS hash/cache bug confirmed.

- [0128 Vite final CSS hashes](batches/0128-vite-final-css-hashes.md)：BH-0045 fixed;110tests,39output and36hydration controls PASS.

- [0129 Rust bundle composition](batches/0129-rust-bundle-composition.md)：71Rust/205host/48browserPASS; actual adapter migration remains unfinished.

- [0130 Bundle source context](batches/0130-bundle-source-context.md)：75Rust/205host/84browserPASS; transports and actual adapters pending.

- [0131 Public bundle transport](batches/0131-public-bundle-transport.md)：209host/75Rust/174browserPASS; actual adapters remain unfinished.

- [0132 Vite graph publication](batches/0132-vite-graph-publication.md)：actual Vite8builds/48browserPASS; Webpack3build/12browserFAIL, other Vite host capabilities pending.

- [0133 Vite host file resolution](batches/0133-vite-host-file-resolution.md)：218compiler／110Vite／36host browser PASS；virtual/preprocessor與其他交付仍待完成。

- [0134 Vite alias pruning](batches/0134-vite-alias-pruning.md)：裁剪回歸修復，219compiler／110Vite PASS；virtual／Sass仍1build／18browser FAIL。

- [0135 Vite virtual sources](batches/0135-vite-virtual-sources.md)：223compiler／110Vite、virtual30與watch54 PASS；Sass仍1build／6browser FAIL。

- [0136 Vite Sass sources](batches/0136-vite-sass-sources.md)：225compiler／114Vite、原78與Sass84browser／watch54 PASS；managed-inline6FAIL。

- [0137 Inline CSS delivery](batches/0137-inline-css-delivery.md)：83Rust／227compiler／118Vite、198public／84inline／90Sass／36watch browser PASS；其餘BH-0004邊界未完成。

- [0138 Inline asset pruning](batches/0138-inline-asset-pruning.md)：Vite121／30browser／18watchPASS；原inline84矩陣全PASS。

- [0139 Inline server hosts](batches/0139-inline-server-hosts.md)：Vite125／SSR36／worker6／inline84browser與16Node loadsPASS；完整BH-0004仍未完成。

- [0140 Inline built URLs](batches/0140-inline-built-urls.md)：Vite131／180final browser PASS；URL映射、檔名與paired asset回歸已修，其他BH-0004需求未完成。

- [0143](batches/0143-module-dependency-watch.md) Module dependency watch：限定更新／巢狀錯誤恢復驗證完成；刪除／改名及dev/HMR待續。

- [0144](batches/0144-module-missing-dependencies.md) Module missing dependencies：直接刪除／改名控制通過；巢狀host終止仍未完成。

- [0145](batches/0145-module-development-hmr.md) Development Modules HMR：entry／local、直接／巢狀更新通過，其他request modes及missing recovery待續。

- [0146](batches/0146-development-style-requests.md) Development requests：共用manifest HMR修復驗證通過；Sass URL更新仍3FAIL，待續。

- [0147 Sass URL HMR](batches/0147-sass-url-hmr.md)：限定URL更新驗證完成；其他交付未完成。

- [0148 Module request modes](batches/0148-module-request-modes.md)：inline/raw已驗證；url主機拒絕，交付仍未完成。

- [0149 Sass partial recovery](batches/0149-sass-partial-recovery.md)：普通Sass限定恢復完成，多環境與其他交付待驗。

- [0150 Sass environments/restart](batches/0150-sass-environments-restart.md)：環境與新請求驗證完成，live reconnect待驗。

- [0151 Live/middleware restart](batches/0151-live-middleware-restart.md)：一般server重連驗證完成；middleware已重現，仍未修復。

- [0152 Middleware lifecycle](batches/0152-middleware-lifecycle.md)：正常清理模式修復驗證通過；其他交付仍未完成。

- [0153 Custom environment close](batches/0153-custom-environment-close.md)：初始環境獨立關閉修復通過；動態／共用instance仍待驗。

- [0154 Environment replacement](batches/0154-environment-replacement.md)：替換環境與hook邊界修復通過；共用instance待驗。

- [0155 Shared plugin roots](batches/0155-shared-plugin-roots.md)：多root隔離修復驗證通過；qualified pre-render交付待修。

- [0156 Emitted globals graphs](batches/0156-emitted-globals-graphs.md)：metadata／production修復通過，dev交付仍未完成。

- [0157 Development runtime base](batches/0157-runtime-development-base.md)：BH-0046修復與三瀏覽器驗證完成；BH-0004仍未完成。

- [0158 Development shutdown](batches/0158-development-shutdown-classification.md)：關閉候選有界分類；主機限制仍未解，CSS調查可正常收尾。

- [0159 Development stylesheet graphs](batches/0159-development-stylesheet-graphs.md)：有界查核完成，BH-0047已修復；BH-0004完整交付仍未完成。

- [0160 Development resource lifecycle](batches/0160-development-resource-lifecycle.md)：有界查核完成；BH-0004其餘交付仍未完成。

- [0161 Resource snapshot and recovery](batches/0161-development-resource-recovery.md)：有界查核完成；BH-0004完整交付仍未完成。

- [0162 Retained graph environments](batches/0162-development-graph-environments.md)：有界查核完成；BH-0004其餘交付仍未完成。
- [0163 Local compose graph delivery](batches/0163-local-compose-graph-delivery.md)：compiler交付已驗證；Vite child compose仍8FAIL，接完整assets發布。
- [0164 Vite local graph publication](batches/0164-vite-local-graph-publication.md)：原8FAIL修復；279tests／252browser通過，其餘輸入及lifecycle待續。
- [0165 Imported local directives](batches/0165-imported-local-directives.md)：plain-root漏判已修；242compiler／295Vite tests及360browser通過。

- [0166 Local URL delivery](batches/0166-local-url-delivery.md)：三個交付缺口已修；338tests／324browser通過。

- [0167 Imported module exports](batches/0167-imported-module-exports.md)：local CSS跨檔exports修復驗證完成；350項Vite測試／516browser PASS，Sass與其他邊界續驗。

- [0168 Sass Module import contexts](batches/0168-sass-module-import-contexts.md)：相同Sass輸出及子檔診斷修正通過386tests／600browser；缺失原始map等邊界仍保留。

- [0169 Benchmark Wasm delivery](batches/0169-benchmark-wasm-delivery.md): BH-0032 fixed;42 browser controls,5 tests and3 original reports complete; remaining readers next0170.

- [0170 Runtime snapshot readers](batches/0170-benchmark-runtime-snapshot.md): bounded readers/guards verified;9tests/36browser controls; BH-0033 private preparation/cleanup remains.
- [0171 Runtime preparation](batches/0171-benchmark-runtime-preparation.md): BH-0033 fixed;12tests,36browser controls and48 original diagnostic variants verified.
- [0172 Native CSSOM traversal](batches/0172-benchmark-cssom-traversal.md): BH-0034 fixed;15tests,60 browser controls and72 original report-page comparisons PASS.
- [0173 Runtime arrays](batches/0173-benchmark-array-instrumentation.md): BH-0042 fixed;19tests,72browser controls and48 original diagnostic variants verified.
- [0174 Style validity](batches/0174-benchmark-style-validity.md): BH-0043 fixed;120browser controls,48 diagnostic positive/144negative gates and original reports verified.
- [0175 Startup imports](batches/0175-benchmark-startup-import.md): BH-0038 fixed;8original variants/292samples and four actual CLI entry controls PASS;unsampled Vite metrics remain.
- [0176](batches/0176-benchmark-vite-observation.md) Vite observations: BH-0041 fixed; unique scanner files and environment hook timings,16 report variants/404samples,12real scanner controls.
- [0177](batches/0177-benchmark-specificity.md) Specificity:BH-0039 fixed;83tests,16report variants/84artifacts;WebKit namespace differences explicitly retained.
- [0178](batches/0178-docs-css-resources.md) Resource validation:BH-0040 fixed;98tests,21HTTP/24browser controls,8publicpages/45assets;strict complete snapshot andobserved metadata.
- [0179 Diagnostic phases](batches/0179-diagnostic-phases.md)：BH-0037報告契約修復，實際公開操作／產物與consumer核對完成；內部profiling及其他覆蓋仍有限制。
- [0180 Imported Sass maps](batches/0180-imported-sass-source-maps.md)：原始maps修正，441tests／600browser通過；BH-0004整體仍未完成。
- [0181 Virtual reference ownership](batches/0181-virtual-reference-ownership.md)：baseFile 解析修復，253compiler／457Vite／96browser 通過；partial／恢復與其他 BH-0004 邊界仍待驗證。
- [0182 Sass partial references](batches/0182-sass-partial-references.md)：原始map與additionalData鏈結修復；269compiler／479Vite／120browser通過，host缺檔恢復等仍待驗證。
- [0183 Reference host recovery](batches/0183-reference-host-recovery.md): failed dependency reconciliation verified;latest567PASS/12FAIL;528browserPASS;startup build-watch andmanifest failures remain;batch unfinished.

- [0184 Native conditional compose](batches/0184-native-conditional-compose.md): traversal repaired; direct output order and anonymous-layer identity still fail.

- [0185 Ordered direct output](batches/0185-ordered-direct-output.md)：BH-0057修復；qualified managed imports沿用BH-0004待修。

- [0186 Qualified managed imports](batches/0186-qualified-managed-imports.md)：legacy39失敗已重驗；直接qualified managed imports 30FAIL，prepared24PASS；修復待續。

- [0187 Graph output mappings](batches/0187-graph-output-mappings.md)：graph原始位置、BH-0058字串及BH-0057 suppression條件修復；既有直接入口待遷移。

- [0205 Host classification and delivery](batches/0205-host-classification-delivery.md)：有界主機對照與隔離發布實驗完成；正式交付及其他未完成項目保留。

- [0206 Webpack static delivery](batches/0206-webpack-static-delivery.md)：正式graph發布、資產雜湊與公開getter型別修復；其餘host範圍保留。

- [0207 Webpack watch recovery](batches/0207-webpack-watch-recovery.md)：缺檔恢復與相依清理已交付；既有測試契約patch待核准。

- [0208 Webpack entry ownership](batches/0208-webpack-entry-ownership.md)：多入口／lazy污染與compiler宣告修復；剩餘範圍保留。

- [0209 Initial deletion](batches/0209-webpack-initial-delete.md)：Watchpack競態與隔離patch驗證；正式依賴修補待授權。
- [0210 Active graph](batches/0210-webpack-active-graph.md)：移除模組後舊依賴造成建置失敗；已重現，待修。
- [0211 Source reconciliation](batches/0211-webpack-source-reconciliation.md)：模組清理／快取還原已交付；完整host/watch範圍保留。
- [0212 Optimized ownership](batches/0212-webpack-optimized-ownership.md)：同時刪除與有界最佳化控制通過；資源快照待驗。
- [0213 Resource snapshots](batches/0213-webpack-resource-snapshot.md)：資源快照修正已交付；完整套件兩個既有watch逾時保留。
- [0214 Watch event trace](batches/0214-webpack-watch-event-trace.md)：入口事件遺漏已捕捉，根因與修復仍待續。
- [0215 Native watch boundary](batches/0215-webpack-native-watch-boundary.md)：獨立fs.watch也漏報，輪詢對照通過；正式native行為仍未完成。
- [0216 Next delivery baseline](batches/0216-next-static-delivery-baseline.md)：純Node監看控制通過；Next資源與import交付缺口已重現，待實作。
- [0217 Next static publication](batches/0217-next-static-publication.md)：交付static完整資源／錯誤重試及明確授權的既有測試調整；一般loader仍待修。
- [0218 Next general delivery contract](batches/0218-next-general-delivery-contract.md)：排除兩種host不相容URL，建立三瀏覽器通過的隔離graph候選，契約與完整驗證未完成。
- [0219 Next Webpack import boundary](batches/0219-next-webpack-import-boundary.md)：29項graph斷言通過；純Next確認預設Webpack的layer與外部import缺口，候選未交付。
- [0220 Next Webpack graph assets](batches/0220-next-webpack-graph-assets.md)：隔離host呈現通過，最終maps失敗；完整測試與交付仍未完成。
- [0221 Next authored maps](batches/0221-next-webpack-authored-maps.md)：隔離128tests/3e2e與最終maps通過；既有測試patch待授權，候選未交付。
- [0222 Next Module delivery](batches/0222-next-module-delivery.md)：確認entry Module exports缺口；輕量marker隔離修正通過，候選未交付。

- [0223 Next Module host capabilities](batches/0223-next-module-host-capabilities.md)：隔離scoped exports與compositions通過，Turbopack最終maps仍失敗。

- [0224 Next Turbopack graph maps](batches/0224-next-turbopack-graph-maps.md)：作者來源對映隔離修正通過；重複URI純主機亦重現，未交付。

- [0225 Next Module import graphs](batches/0225-next-module-import-graphs.md)：純主機72PASS、候選54PASS/18FAIL，確認需保留匯入上下文的作用域。

- [0226 Next Module context preparation](batches/0226-next-module-context-preparation.md)：隔離修正scope／ICSS，144browser／24maps／128tests／3e2e通過，完整host契約仍待驗。
- [0227 Next Module edge contracts](batches/0227-next-module-edge-contracts.md)：循環／缺匯出分類；隔離修復Webpack編碼檔名，Firefox環境限制與完整host要求保留。
- [0228 Next Module request contracts](batches/0228-next-module-request-contracts.md)：隔離修復Turbo跳脫路徑；條件選擇仍有2browser失敗，主機上下文待續。
- [0229 Next Module host context](batches/0229-next-module-host-context.md)：證實browser規則邊界；原生composition實驗造成Client失敗，已撤回並保存證據。
- [0230 Next Module condition phases](batches/0230-next-module-condition-phases.md)：12次條件對照，區分原生Client初始CSS缺失與候選Server branch差異。
- [0231 Next Module inline loaders](batches/0231-next-module-inline-loaders.md)：隔離候選修正inline query／chain／nested／alias，完整交付仍待續。
- [0232 Next Module host preparation](batches/0232-next-module-host-preparation.md)：11個實際PostCSS對照定位graph入口／child／generated／exports缺口。
- [0233 Next Module lowering boundaries](batches/0233-next-module-lowering-boundaries.md)：Rust lowering／PostCSS／Module階段原型與global負對照，actual host仍待修復。
- [0234 Next Module graph relinking](batches/0234-next-module-graph-relinking.md)：bundle／graph能力對照，20browser／10maps通過，actual Next仍待整合。
- [0235 Native Next PostCSS transport](batches/0235-next-native-postcss-transport.md)：原生loader機制及actual Client雙browser通過，Server覆蓋／candidate graph仍未完成。
- [0236 Next PostCSS graph prototype](batches/0236-next-postcss-graph-prototype.md)：五案原型修復與maps通過；global回歸未解，已保存原型並恢复候選。
- [0237 Next generated global PostCSS](batches/0237-next-generated-global-postcss.md)：global／Module整合通過，保留更新候選，正式交付與完整host要求未完成。
- [0238 Next PostCSS added dependencies](batches/0238-next-postcss-added-dependencies.md)：新增ICSS與global資源有界修正；新增theme引用及空rule仍待續。
- [0239 Next native PostCSS input](batches/0239-next-postcss-native-input.md)：普通CSS提前最佳化已修；含Master指令與新global closure仍待續。
- [0240 Rust preserved PostCSS input](batches/0240-rust-preserved-postcss-input.md)：原文保留與maps原型有界通過；預設契約及2maps未解，沒有promote。
- [0241 Next PostCSS map context](batches/0241-next-postcss-map-context.md)：child路徑回歸已修；純Next合併selector map限制保留。
- [0242 Source preservation API](batches/0242-source-preservation-api.md)：明確選用保留原文，預設回歸通過；maps與static cache仍待續。
- [0243 Native host boundaries](batches/0243-next-native-host-boundaries.md)：逐selector maps損失與Turbo持久快取新增publication反例已定位，未結案。
- [0244 Rendered resource context](batches/0244-rendered-resource-context.md)：差集API驗證，PostCSS晚出現資源仍有處理順序反例。
- [0245 PostCSS resource lifecycle](batches/0245-postcss-resource-lifecycle.md)：原生順序與hook後差集對照通過；global刪改計數及正式整合待續。
- [0246 PostCSS request adapter](batches/0246-postcss-request-adapter.md)：新副本驗證native loader、插件狀態／訊息與並行隔離；尚未完成資源自動接線。
- [0247 PostCSS resource policy](batches/0247-postcss-resource-policy.md)：owned副本自動接線資源歷史；刪改不復活、真實Webpack與host chain通過；sibling／diagnostics／watch待續。
- [0248 Late-resource dev watch](batches/0248-postcss-resource-dev-watch.md)：實際Webpack dev的late資源watch／HMR 16步驟PASS；diagnostics分類無轉發需求；無產品變更。
- [0249 Late-resource dev recovery](batches/0249-postcss-resource-dev-recovery.md)：資源刪除／還原與定義刪除／還原20步驟PASS，pure對照一致；無產品變更。
- [0250 Compiler rule-count scaling](batches/0250-compiler-rule-count-scaling.md)：resource hook成本量測揭露compiler二次成長；新增BH-0062，未修復。
- [0251 Compiler source index](batches/0251-compiler-source-index.md)：BH-0062修復；scaling回歸與Rust／TS套件PASS，0242候選patch另存。
- [0252 Compiler lowering index](batches/0252-compiler-lowering-index.md)：索引貫穿lowering與資源引用；compose回歸基準FAIL→PASS，套件PASS；manifest合併待查。
- [0253 Compiler manifest merge](batches/0253-compiler-manifest-merge.md)：manifest合併key索引；theme／components回歸基準FAIL→PASS，套件PASS。
- [0254 Ledger archive](batches/0254-ledger-archive-manifest-residual.md)：帳本頭部歸檔；manifest殘餘分類為常數成本。
- [0255 Turbopack PostCSS characterization](batches/0255-next-turbopack-postcss-characterization.md)：Turbopack契約差異分類；BH-0063 Module動畫失效已確認，未修復。
- [0256 Turbopack Module animation candidate](batches/0256-next-turbopack-module-animation.md)：BH-0063 owned候選修復雙bundler雙瀏覽器PASS；promote範圍為整套候選，未交付。
- [0257 Next candidate promote feasibility](batches/0257-next-candidate-promote-feasibility.md)：候選lint／types／build／152tests／3e2e全PASS；promote需跨Rust／compiler／next交付，未執行。
- [0258 Promote Next candidate](batches/0258-promote-next-candidate.md)：候選正式交付，BH-0063已修復；既有失敗與baseline一致。
- [0259 Post-promote re-verification](batches/0259-post-promote-reverification.md)：交付後16情境實際host重驗全PASS；帳本歷史歸檔。
- [0260 Next CSS pipeline closure](batches/0260-next-css-pipeline-closure.md)：BH-0051結案，14組實際host對照全PASS；BH-0053補Turbopack Sass控制。
- [0261 Rspack static delivery](batches/0261-rspack-static-delivery.md)：BH-0029結案，Rspack／Webpack交付四格對照一致。
- [0262 Selector maps and cache boundaries](batches/0262-selector-maps-and-cache-boundaries.md)：BH-0053結案，兩個0243反例歸類為Next／Turbopack側邊界。
- [0263 Contained directives](batches/0263-bh-0004-contained-directives.md)：BH-0004 direct路徑單一根因定位＋診斷修正；finding仍未解。
- [0264 Qualified import definitions](batches/0264-qualified-import-definitions.md)：BH-0004 qualified flatten+compile 60觀察全通過。
- [0265 External import classification](batches/0265-external-import-classification.md)：BH-0004 external基準13項失敗分為明確限制／可修／固有邊界。
- [0266 Approved patches](batches/0266-approved-patches.md)：兩個待審patch交付，webpack全綠；訂正0265的external修法範圍。
- [0267 Authored layer order](batches/0267-authored-layer-order.md)：提前的外部import不再翻轉layer順序；external基準9 PASS／11 FAIL。
- [0268 External baseline correction](batches/0268-external-baseline-correction.md)：訂正單一瀏覽器誤記與陳舊remaining；釐清BH-0004實際剩餘範圍。
- [0269 Graph classification](batches/0269-graph-classification.md)：Next／Webpack分類改走import graph，攤平API退場；修掉診斷歸屬缺陷。
- [0270 Corpora re-measurement](batches/0270-corpora-remeasurement.md)：三支語料以遷移後consumer重跑全通過，計畫五步完成。

## 目前交接點

- 0270：補齊計畫步驟4——以遷移後的真實consumer重跑三支瀏覽器語料，全數通過：`import-conditions-browser`（0092本地條件）**64 comparisons全PASS**、`compiled-stylesheets-browser`（0114 public `compileStylesheets`）**84／0**、`stylesheet-graph-browser`（0113 Rust graph renderer）**72／0**。三支repro比照0268修掉「單一瀏覽器啟動失敗就整輪中止」，另兩支原本直接載入TS來源會`ERR_MODULE_NOT_FOUND`（與遷移無關），改指向built output後量測對象即為實際交付程式碼。本機Firefox仍啟動失敗並記錄，兩瀏覽器數字與原始三瀏覽器的96／126／108不可並列。至此BH-0004計畫五個步驟全部完成；維持部分修正，剩餘為三類非可修缺陷與尚未逐項重跑的完整host／watch矩陣。63historical／62fixed／1unresolved。[證據](evidence/0270-final-checks.json)；[批次](batches/0270-corpora-remeasurement.md)；[前次](progress-history-0270-corpora.md)。

- 較早的交接、提交核對與歸檔指標已逐字保存於 [歷史紀錄（0254整理）](progress-history-0254-ledger-heads.md)；目前狀態以本檔最新批次與原批次為準。
