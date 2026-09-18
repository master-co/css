# 問題索引

- 0266：使用者授權後交付兩個長期待審patch。`cb0233d56`把`plugin-runtime.test.ts`的兩個watch測試改為plugin實際實作的契約（replay錯誤進`compilation.errors`、未存在的reset路徑進`missingDependencies`），套用前後雜湊與記錄相符。`68ced2463`以`pnpm patch`正式交付`watchpack@2.5.2`的initial-scan修正（只有掃描確實找到的項目才移除missing watcher），`patch-commit`帶進的12個無關套件與版本漂移已還原，最終lockfile僅7 insertions／4 deletions。**`@master/css-webpack`因此12 files／88 tests全綠**（原2＋1 FAIL）；build 28/28、全套件103/107，未通過僅剩wasm×2、nuxt、vite，與baseline相同。另訂正0265：實測證明`same-layer`無法以`@layer`宣告修復（layer內順序而非layer順序），BH-0004 external可修項由4降為**2**（`different-layers`），修後基準為9 PASS／11 FAIL。pendingApprovals清空。63historical／62fixed／1unresolved。[證據](evidence/0266-final-checks.json)；[批次](batches/0266-approved-patches.md)；[前次](progress-history-0266-approved-patches.md)。

- 較早的交接、提交核對與歸檔指標已逐字保存於 [歷史紀錄（0254整理）](progress-history-0254-ledger-heads.md)；目前狀態以本檔最新批次與原批次為準。

嚴重度：P0 全域重大中斷；P1 常見核心流程錯誤；P2 有條件的功能錯誤；P3 低影響邊界問題。
驗證狀態：待驗證／已確認／已修復／已排除／待重驗。相同根因沿用固定 BH ID，保留變更理由。
產品 bug 必須具備可重現失敗與預期行為依據；既有測試失敗與環境限制分別記錄在批次。

| ID | 嚴重度 | 驗證狀態 | 問題 | 範圍／證據 |
|---|---|---|---|---|
| BH-0001 | P2 | 已修復 | CSS 字串／註解誤作動畫定義或宣告，遺漏／多產 keyframes | engine/render/compiler；0109語法位置、數值/簡寫欄位與變數上下文修復，87value/42variable browser及runtime273通過；[0109](batches/0109-animation-value-context.md)，[原始0002](batches/0002-stylesheet-resources.md) |
| BH-0002 | P3 | 已修復 | raw stylesheet var() 空白、註解、跳脫與名稱邊界漏掉／誤收依賴 | engine/render；0110共用CSS tokens，25cases/75browser、native/Wasm及runtime273通過；[0110](batches/0110-variable-syntax.md)；[原始0002](batches/0002-stylesheet-resources.md) |
| BH-0003 | P2 | 已修復 | static token 初始化與最後class刪除後遺失動態／transitive依賴 | engine/compiler；0111共用依賴圖保留與釋放，12Rust groups/132compiler/279runtime及72browser通過；[0111](batches/0111-static-retention.md)；[原始0003](batches/0003-static-resources.md) |
| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 | source-preservation已於0258交付。0263定位根因：definition directive被native at-rule包住無法lowering，源自展開qualified import時的文字包裹。0264交付`fc879fad4`把被匯入stylesheet頂層的六個definition family切出wrapper（保留copied source spans），qualified矩陣60觀察由20失敗變0失敗（direct-native／direct-wasm各12/0），native與Wasm一致；364 Rust tests、compiler 428、next 152 PASS，既有失敗serial下與baseline相同。0265分類、0266實測訂正後的`external-import-order`13項失敗：6項明確限制（nested未解析外部import，CSS不允許`@import`在條件／layer區塊內）、**2項可修**（`different-layers`，展開時補依作者順序的`@layer`宣告，實測red→blue，修後9P/11F）、**5項固有邊界**（`same-layer`決勝於layer內順序、`external-last`與`conditional-local`皆未分層，補`@layer`宣告實測無效）。仍待：該`@layer`宣告（會改CSS輸出，需授權）與完整public／host graph遷移。[0264](batches/0264-qualified-import-definitions.md)；[0263](batches/0263-bh-0004-contained-directives.md) |
| BH-0005 | P2 | 已修復 | numeric HTML references 未 decode，SSR class 與瀏覽器不同 | server；[0007](batches/0007-server-render.md) |
| BH-0006 | P1 | 已修復 | encoded class 經 SSR style 注入變成可執行 script | server；[0007](batches/0007-server-render.md#bh-0006--p1-已確認html-encoded-class-可逃出-style-並執行腳本) |
| BH-0007 | P2 | 已修復 | HTML 無 class 屬性時完全遺漏 static theme/keyframe 初始資源 | server；[0007](batches/0007-server-render.md) |
| BH-0008 | P2 | 已修復 | external hydration 使用 Function，CSP 禁止 unsafe-eval 時 runtime 啟動失敗 | runtime；[0008](batches/0008-runtime-hydration.md) |
| BH-0009 | P2 | 已修復 | iframe Document root 元素跨 realm，漏掉 class mutation | runtime；[0009](batches/0009-runtime-mutations.md) |
| BH-0010 | P2 | 已修復 | Rust HTML source extraction 未解碼 class character references | source/tooling；[0010](batches/0010-source-extraction.md) |
| BH-0011 | P2 | 已修復 | Svelte 提取略過 else 分支，static CSS 漏收 | tooling；[0010](batches/0010-source-extraction.md) |
| BH-0012 | P2 | 已修復 | scanModule 缺少 .mjs 支援，原生 ESM class 不產生 CSS | tooling/scanner；[0011](batches/0011-scanner-state.md) |
| BH-0013 | P1 | 已修復 | 語言分析 512-byte 前綴切入 Unicode 字元而 panic | language；[0012](batches/0012-language-ir.md) |
| BH-0014 | P2 | 已修復 | 解码後 token 長度直接用作原始語意範圍，跳脫引號後高亮偏移 | language/tooling；[0012](batches/0012-language-ir.md) |
| BH-0015 | P2 | 已修復 | ESLint 未解碼 JS Unicode escape，把合法 block 誤報 unknown | eslint-plugin/tooling/source；JS與Vue外層HTML mapping及fix encoding完成；[0017](batches/0017-eslint-adapters.md), [0102](batches/0102-eslint-javascript-escapes.md), [0103](batches/0103-vue-attribute-mapping.md) |
| BH-0016 | P2 | 已修復 | Vite relative base 巢狀 HTML 的 hydration JSON URL 指向錯誤路徑 | vite；[0020](batches/0020-vite-runtime-html.md), [0104修復](batches/0104-vite-relative-hydration.md) |
| BH-0017 | P2 | 已修復 | Webpack relative publicPath 的巢狀 HTML 注入不存在的 runtime URL | webpack；[0021](batches/0021-webpack.md), [0105修復](batches/0105-webpack-relative-runtime.md) |
| BH-0018 | P2 | 已修復 | Node/native CLI 預設 source discovery 漏掉 .mjs | cli；[0028](batches/0028-cli-discovery.md) |
| BH-0019 | P2 | 已修復 | CLI watch 只監看啟動時已有檔案，新增頁面漏產 CSS | cli；[0029](batches/0029-cli-watch.md) |
| BH-0020 | P3 | 已修復 | MCP preview/format/render與Rust inspection bytes以UTF-16長度計算，Unicode大小錯誤 | mcp；[0030](batches/0030-mcp-contracts.md) |
| BH-0021 | P1 | 已修復 | create installer 在多行 import 中間插入新 import，破壞既有設定語法 | create；[0031](batches/0031-create-setup.md) |
| BH-0022 | P1 | 已修復 | Figma importer 把自身 exporter 的 definitions array 當作巢狀物件，寫入錯誤變數名稱 | figma；[0033](batches/0033-figma-variables.md) |
| BH-0023 | P1 | 已修復 | Nuxt progressive 未發布 client manifest，JSON 請求回傳 HTML，hydration/runtime 啟動失敗 | nuxt/example；[0035](batches/0035-ssr-examples.md) |
| BH-0024 | P2 | 已修復 | Angular Express5 無名 wildcard 路由註冊即拋錯 | example；[0036](batches/0036-angular-laravel.md) |
| BH-0025 | P2 | 已修復 | Angular SSR 打包搬移 css-tree 相對資料 require，啟動缺少 patch.json | example/dependency bundling；[0050](batches/0050-angular-bundle.md) |
| BH-0026 | P2 | 已修復 | CLI generate --binding wasm 被忽略，仍建立 native scanner | cli；[0048](batches/0048-cli-binding-selection.md) |
| BH-0027 | P3 | 已修復 | Webpack example 多餘 index.js 請求404；main/runtime正常 | example；[0049](batches/0049-webpack-example-asset.md) |
| BH-0028 | P2 | 已修復 | ESLint 現代範例 CSS 使用不支援的 $variable，規則載入失敗 | EX-eslint；[0037](batches/0037-eslint-examples.md) |
| BH-0029 | P1 | 已修復 | Rspack succeedModule 無 source，static 模式漏掉所有 managed CSS | 0261在主工作樹重測：Rspack模組仍無source，但`usage-graph`的`finishModules`以完整module graph補齊，managed CSS經`main.css`的`@import`鏈交付（`.block{display:block}`在`master-css-…-3.css`），鏈上檔案都寫入`dist/`。原斷言只讀`main.css`未跟隨鏈。Webpack對照四格（±`@preserve native`）行為逐格相同；作者原生CSS需`@preserve native`屬既有預設。0038暫停的integration-lab追加host覆蓋未重啟。[0261](batches/0261-rspack-static-delivery.md)；[原始0038](batches/0038-integration-lab.md) |
| BH-0030 | P2 | 已修復 | Webpack 固定 output.filename 與自動 runtime entry 衝突，playground 無法 build | webpack/playground；[0042](batches/0042-nested-hosts.md), [0106修復](batches/0106-webpack-fixed-filename.md) |
| BH-0031 | P2 | 已修復 | MCP 並行套用預覽重複接受 token，重疊檔案更新略過 stale-hash 保護 | mcp；[0053](batches/0053-mcp-preview-concurrency.md), [0082](batches/0082-mcp-multiprocess.md), [0101修復](batches/0101-mcp-preview-concurrency-fix.md) |
| BH-0032 | P2 | 已修復 | Browser lifecycle/delivery benchmark 未複製 Wasm sidecar，runtime 頁面無法啟動 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0075](batches/0075-master-delivery-modes.md), [0076](batches/0076-progressive-diagnostics.md), [0077](batches/0077-interaction-cost.md), [0079](batches/0079-runtime-mutation-diagnostics.md), [0080](batches/0080-style-invalidation-diagnostics.md); [0169 fixed/verified](batches/0169-benchmark-wasm-delivery.md) |
| BH-0033 | P3 | 已修復 | Benchmark 讀取已移除的 global runtime 欄位，規則數／CSS bytes 錯報零 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0076](batches/0076-progressive-diagnostics.md), [0077](batches/0077-interaction-cost.md), [0080](batches/0080-style-invalidation-diagnostics.md);0169 original progressive guards falsely reject successful public snapshot hydration; [controls](batches/0169-benchmark-wasm-delivery.md);0170 readers/guards verified;0171 preparation/cleanup verified with12tests/36browser controls and48 diagnostic variants;[0170](batches/0170-benchmark-runtime-snapshot.md) [0171修復](batches/0171-benchmark-runtime-preparation.md) |
| BH-0034 | P3 | 已修復 | Benchmark 把帶空 cssRules 的 CSSStyleRule 當群組，漏計原生樣式規則 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0076](batches/0076-progressive-diagnostics.md);[0172修復](batches/0172-benchmark-cssom-traversal.md):15tests/60browser controls/72report-page comparisons |

| BH-0035 | P3 | 已修復 | VS Code 設定更新無條件呼叫可選的 eslint.restart，未安裝 ESLint 時產生未處理拒絕 | vscode；0117共用已檢查命令的restart並處理設定事件拒絕，實際VS Code四類控制與31tests通過；[0117](batches/0117-vscode-settings-restart.md)，[原始0059](batches/0059-vscode-settings.md) |

| BH-0036 | P2 | 已修復 | Nuxt runtime 關閉 Vite stylesheet 編譯，raw @theme 未輸出變數但 runtime 視為已輸出 | nuxt/vite；[0060](batches/0060-nuxt-dev-hmr.md) |

| BH-0037 | P3 | 已修復 | Compiler/extraction diagnostics 宣告未量測階段指標，119／15個 IDs 無樣本，compose 被標為較窄引擎階段 | benchmarks；[0064](batches/0064-compiler-diagnostics.md), [0065](batches/0065-extraction-diagnostics.md)；0179 actual public30metrics／8variants／240samples及4report consumer通過；內部profiling不再虛稱，[0179](batches/0179-diagnostic-phases.md) |

| BH-0038 | P2 | 已修復 | Startup benchmark 被動匯入 CLI bin，參數解析直接退出，第一個 variant 中止且無報告 | benchmarks；[0066](batches/0066-startup-diagnostics.md) ;[0175](batches/0175-benchmark-startup-import.md):8variants/292samples/four entry controls PASS |

| BH-0039 | P3 | 已修復 | CSS structure benchmark 高估 universal 與 :is/:not/:has specificity，四個標準案例錯誤 | benchmarks；[0069](batches/0069-css-structure.md);[0177](batches/0177-benchmark-specificity.md):83tests/16report variants PASS;59of60 normative browser controls agree,WebKit namespace deviation isolated |

| BH-0040 | P3 | 已修復 | Docs CSS size collector 接受404HTML錯誤頁並計入CSS大小，省略失敗狀態 | benchmarks；[0071](batches/0071-docs-css-size.md);[0178](batches/0178-docs-css-resources.md):98tests/21HTTP/24browser controls andoriginal8pages/45assets PASS |

| BH-0041 | P3 | 已修復 | Vite build/startup diagnostics 將略過及重複hook計為已掃描檔案，6callback實為2files/3scans | benchmarks；[0072](batches/0072-vite-scan-counts.md);[0176](batches/0176-benchmark-vite-observation.md):4fixture comparisons,12scanner controls,16report variants PASS |

| BH-0042 | P3 | 已修復 | Benchmark 沿用多參數 class API，陣列計數少算且延後刪除 flush 假成功 | benchmarks；[0078](batches/0078-interaction-array-contract.md), [0079](batches/0079-runtime-mutation-diagnostics.md) ;[0173](batches/0173-benchmark-array-instrumentation.md):19tests/72browser/48diagnostic variants PASS |

| BH-0043 | P3 | 已修復 | Benchmark 清理情境寫死樣式驗證成功，CSS 失效仍回報通過 | benchmarks；[0084](batches/0084-style-invalidation-static.md) ;[0174](batches/0174-benchmark-style-validity.md):120browser controls,48 positive/144negative diagnostic gates PASS |

| BH-0044 | P2 | 已修復 | Angular browser build 未附帶 runtime Wasm sidecar | [0088 修正與三瀏覽器驗證](batches/0088-example-nuxt-fixes.md) |
| BH-0045 | P2 | 已修復 | Vite 在產生hash檔名後替換CSS placeholder，內容變更仍使用同一URL，快取可交付舊樣式 | 0128在命名前納入managed CSS；原始6、輸出39、hydration36及Vite110通過；[0128](batches/0128-vite-final-css-hashes.md)；[原始0127](batches/0127-build-publication-boundaries.md) |
| BH-0046 | P2 | 已修復 | Vite dev runtime及preload忽略base，runtime／progressive的非根目錄頁面bootstrap404 | 0157修前2FAIL／2PASS；修後12actual-server cases、Vite209、216三瀏覽器動態class／theme HMR通過；[0157](batches/0157-runtime-development-base.md) |
| BH-0047 | P2 | 已修復 | Vite pre-render開發模式更新manifest後，頁面保留舊SSR樣式 | 普通CSS獨立控制修前1FAIL；manifest變更full-reload、native-only不reload、progressive走runtime；Vite215及96browser控制PASS；[0159](batches/0159-development-stylesheet-graphs.md) |
| BH-0048 | P2 | 已修復 | Runtime初始化期間HMR將共用instance過早dispose，留下空CSSOM | 共用bootstrap／Next／Webpack串接啟動；新增20個控制均PASS，共用路徑156browser及真實Next/Webpack6browserPASS；[0183](batches/0183-reference-host-recovery.md) / [核對](evidence/0183-runtime-hosts-findings.json) |
| BH-0049 | P2 | 已修復 | Webpack套件建置把module.hot包入私有CommonJS wrapper，交付runtime收不到HMR | 改用import.meta.webpackHot；舊產物3browserFAIL，新產物3browserPASS／頁面狀態保留；Webpack74tests／lint／types／範例PASS；[0183](batches/0183-reference-host-recovery.md) / [證據](evidence/0183-runtime-hosts-findings.json) |
| BH-0050 | P2 | 已修復 | Manifest／emittedGlobals分別HMR時復原另一個舊輸入，樣式倒退或重複全域變數 | 分別保留最新接受值；修前4unit/12browserFAIL，修復6新控制/168VitebrowserPASS；[0183](batches/0183-reference-host-recovery.md) / [證據](evidence/0183-runtime-inputs-finding.json) |
| BH-0051 | P1 | 已修復 | Next --webpack 頂層CSS rule移除原生CSS loaders，CSS被當JS解析 | 修復已於0258隨Next管線交付；`next-config.test.ts`改以`rules.some(rule => rule.test?.test('/tmp/example.css')) === false`斷言舊頂層rule缺席。0260交付版本14組實際host對照（webpack css／scss／sass的build與dev、三語法＋LightningCSS build、turbopack css build）每組Chromium＋WebKit `failures:0`、`cssSupportDisabled:false`；next 24files／152tests＋3e2e PASS。[0260](batches/0260-next-css-pipeline-closure.md)；[0258](batches/0258-promote-next-candidate.md) |
| BH-0052 | P1 | 已修復 | Next/Webpack 三個 virtual URI 繞過 alias，無法編譯 runtime | 精確beforeResolve對映；9控制、實際compiler與3瀏覽器runtime HMR通過；[證據](evidence/0183-next-virtual-findings.json) |
| BH-0053 | P1 | 已修復 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 缺陷本身由0260四組Turbopack對照驗證（scss dev／build／partial／partial+recovery，Chromium＋WebKit PASS）。0262把兩個0243尾隨反例歸類為Master以外：per-selector maps經`preserveNativeSource`在compiler階段10P/0F，但Next `CssMinimizerPlugin.optimizeAsset`後兩種設定都退回6P/4F；持久快取的新publication解析失敗在純Next最小loader對照下逐字重現。native declaration granularity與完整Sass option／host邊界改由PKG-next覆蓋列追蹤。[0262](batches/0262-selector-maps-and-cache-boundaries.md)；[0260](batches/0260-next-css-pipeline-closure.md)；[原始0243](batches/0243-next-native-host-boundaries.md) |
| BH-0054 | P1 | 已修正 | Next/Turbopack 強制一般 CSS，CSS Module class 匯出為空 | css-module型別及*.module.css後綴均須保留；工作區與隔離版本dev/build三瀏覽器通過；[證據](evidence/0183-next-raw-turbo-module-discovery.json) |
| BH-0055 | P1 | 已修復 | Next 入口及collection展開時丟失reference，引用自訂class無法編譯 | 原始reference metadata保留；dev/HMR、Turbopack/Webpack production通過；[證據](evidence/0183-next-source-offset-findings.json) |
| BH-0056 | P1 | 已修復 | compileRenderedStylesheet 遺漏lowered compose規則 | renderer改用完整編譯CSS；單元、建置及三瀏覽器通過；[證據](evidence/0183-next-source-offset-findings.json) |
| BH-0057 | P1 | 已修復 | 原生條件內compose、直接順序與匿名layer統一由Rust結構化輸出處理 | compiler106與project/CLI14Rust PASS；最終180browser＋CLI3＋Next6PASS；[0185](evidence/0185-final-checks.json)  0187補充graph native suppression條件／匿名layer修復，18browserPASS。[證據](evidence/0187-suppression-finding.json)。  0197原legacy候選432browserPASS；[重驗](batches/0197-legacy-compose-position.md) |
| BH-0058 | P2 | 已修復 | Graph compose marker替換誤改作者字串並漏輸出樣式 | 改依lexer實際at-rule位置替換；修前6browserFAIL、修後15PASS；[0187](evidence/0187-marker-finding.json) |
| BH-0059 | P2 | 已修復 | compiler診斷與MCP預設glob漏.mjs，遺漏CSS／class trace | [0193](batches/0193-inspection-mjs-discovery.md)；來源／stdio驗證；另有BH-0060 |
| BH-0060 | P2 | 已修復 | 多檔診斷與MCP trace將class／警告錯指其他來源 | 逐檔候選對照Rust分類；15新增測試及22built控制通過；[0194](batches/0194-inspection-source-attribution.md) |
| BH-0061 | P2 | 已修復 | 發布宣告引用缺失或未公開的型別路徑 | binding/tooling/LSP/MCP/Webpack沿用前批；0208補修compiler4個函式宣告，strictTS6通過，31compiler/30Webpack JS不變。[0208](batches/0208-webpack-entry-ownership.md)。 |
| BH-0062 | P1 | 已修復 | Stylesheet compile 對規則數二次成長，preserveNativeSource 再放大 10–35 倍 | 0251 root新增`source_index.rs`每來源索引；Mapper／native lowering改用，掃描函式語義以窮舉測試固定。HEAD基準4000規則84.6s FAIL→1.05s；0242候選對應patch使800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms，compiler428／Next151 PASS。0252把索引貫穿native／managed lowering與url()引用：compose 4000規則128.6s→1.55s、800規則562→76ms；manifest合併超線性另列待查。0253 manifest合併改key索引：theme／components 4000定義6.0s／7.9s→線性，800定義components 74→27ms。[0253](batches/0253-compiler-manifest-merge.md)；[0252](batches/0252-compiler-lowering-index.md)；[0251](batches/0251-compiler-source-index.md)；[0250](batches/0250-compiler-rule-count-scaling.md) |
| BH-0063 | P1 | 已修復 | Turbopack CSS Module 引用 Master global animation 時名稱被作用域化且無 keyframes，動畫不執行 | 0258交付`5810c71ed`：`nextGeneratedGlobalAnimations`從Master generatedCSS取出preset keyframes名稱，Turbopack無host PostCSS分支帶`globalAnimations`建立module graph，`:local(fade)`還原為global `fade`並交付`@keyframes`。主工作樹實際host `module-animation` Turbopack與Webpack皆`fade`／2 frames、Chromium／WebKit PASS；next 24files/152tests＋3e2e PASS。[0258](batches/0258-promote-next-candidate.md)；[0256](batches/0256-next-turbopack-module-animation.md)；[原始0255](batches/0255-next-turbopack-postcss-characterization.md) |

- 0066–0179 的逐批進度敘述逐字移至 [歷史進度（0259整理）](findings-history-0259.md)；目前狀態以上方表格與最新批次為準。
