# 問題索引

嚴重度：P0 全域重大中斷；P1 常見核心流程錯誤；P2 有條件的功能錯誤；P3 低影響邊界問題。
驗證狀態：待驗證／已確認／已修復／已排除／待重驗。相同根因沿用固定 BH ID，保留變更理由。
產品 bug 必須具備可重現失敗與預期行為依據；既有測試失敗與環境限制分別記錄在批次。

| ID | 嚴重度 | 驗證狀態 | 問題 | 範圍／證據 |
|---|---|---|---|---|
| BH-0001 | P2 | 已修復 | CSS 字串／註解誤作動畫定義或宣告，遺漏／多產 keyframes | engine/render/compiler；0109語法位置、數值/簡寫欄位與變數上下文修復，87value/42variable browser及runtime273通過；[0109](batches/0109-animation-value-context.md)，[原始0002](batches/0002-stylesheet-resources.md) |
| BH-0002 | P3 | 已確認 | raw stylesheet var() 非 space 空白漏掉依賴；compiler 正規化路徑不受影響 | engine/render；[0002](batches/0002-stylesheet-resources.md#bh-0002--p3-已確認raw-stylesheet-var-空白漏掉依賴) |
| BH-0003 | P2 | 已確認 | static token 不保留動態依賴，初始化與最後 class 刪除後缺少 CSS 變數 | engine/compiler；[0003](batches/0003-static-resources.md) |
| BH-0004 | P1 | 已確認 | 展開 CSS import 丟失 media/supports/layer，條件與 cascade 失真 | compiler/project；0092本機情境修正，nested unresolved imports仍未完成；[0005](batches/0005-project-graph.md#bh-0004--p1-已確認展開匯入丟失條件與-cascade-layer) |
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
| BH-0029 | P1 | 已確認 | Rspack succeedModule 無 source，static 模式漏掉所有 managed CSS | Webpack/Rspack/Rsbuild；[0038](batches/0038-integration-lab.md)；追加驗證暫停 |
| BH-0030 | P2 | 已修復 | Webpack 固定 output.filename 與自動 runtime entry 衝突，playground 無法 build | webpack/playground；[0042](batches/0042-nested-hosts.md), [0106修復](batches/0106-webpack-fixed-filename.md) |
| BH-0031 | P2 | 已修復 | MCP 並行套用預覽重複接受 token，重疊檔案更新略過 stale-hash 保護 | mcp；[0053](batches/0053-mcp-preview-concurrency.md), [0082](batches/0082-mcp-multiprocess.md), [0101修復](batches/0101-mcp-preview-concurrency-fix.md) |
| BH-0032 | P2 | 已確認 | Browser lifecycle/delivery benchmark 未複製 Wasm sidecar，runtime 頁面無法啟動 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0075](batches/0075-master-delivery-modes.md), [0076](batches/0076-progressive-diagnostics.md), [0077](batches/0077-interaction-cost.md), [0079](batches/0079-runtime-mutation-diagnostics.md), [0080](batches/0080-style-invalidation-diagnostics.md) |
| BH-0033 | P3 | 已確認 | Benchmark 讀取已移除的 global runtime 欄位，規則數／CSS bytes 錯報零 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0076](batches/0076-progressive-diagnostics.md), [0077](batches/0077-interaction-cost.md), [0080](batches/0080-style-invalidation-diagnostics.md) |
| BH-0034 | P3 | 已確認 | Benchmark 把帶空 cssRules 的 CSSStyleRule 當群組，漏計原生樣式規則 | benchmarks；[0055](batches/0055-browser-lifecycle-metrics.md), [0076](batches/0076-progressive-diagnostics.md) |

| BH-0035 | P3 | 已確認 | VS Code 設定更新無條件呼叫可選的 eslint.restart，未安裝 ESLint 時產生未處理拒絕 | vscode；[0059](batches/0059-vscode-settings.md) |

| BH-0036 | P2 | 已修復 | Nuxt runtime 關閉 Vite stylesheet 編譯，raw @theme 未輸出變數但 runtime 視為已輸出 | nuxt/vite；[0060](batches/0060-nuxt-dev-hmr.md) |

| BH-0037 | P3 | 已確認 | Compiler/extraction diagnostics 宣告未量測階段指標，119／15個 IDs 無樣本，compose 被標為較窄引擎階段 | benchmarks；[0064](batches/0064-compiler-diagnostics.md), [0065](batches/0065-extraction-diagnostics.md) |

| BH-0038 | P2 | 已確認 | Startup benchmark 被動匯入 CLI bin，參數解析直接退出，第一個 variant 中止且無報告 | benchmarks；[0066](batches/0066-startup-diagnostics.md) |

| BH-0039 | P3 | 已確認 | CSS structure benchmark 高估 universal 與 :is/:not/:has specificity，四個標準案例錯誤 | benchmarks；[0069](batches/0069-css-structure.md) |

| BH-0040 | P3 | 已確認 | Docs CSS size collector 接受404HTML錯誤頁並計入CSS大小，省略失敗狀態 | benchmarks；[0071](batches/0071-docs-css-size.md) |

| BH-0041 | P3 | 已確認 | Vite build/startup diagnostics 將略過及重複hook計為已掃描檔案，6callback實為2files/3scans | benchmarks；[0072](batches/0072-vite-scan-counts.md) |

| BH-0042 | P3 | 已確認 | Benchmark 沿用多參數 class API，陣列計數少算且延後刪除 flush 假成功 | benchmarks；[0078](batches/0078-interaction-array-contract.md), [0079](batches/0079-runtime-mutation-diagnostics.md) |

| BH-0043 | P3 | 已確認 | Benchmark 清理情境寫死樣式驗證成功，CSS 失效仍回報通過 | benchmarks；[0084](batches/0084-style-invalidation-static.md) |

| BH-0044 | P2 | 已修復 | Angular browser build 未附帶 runtime Wasm sidecar | [0088 修正與三瀏覽器驗證](batches/0088-example-nuxt-fixes.md) |

43 confirmed (including benchmark tooling); 0 pending hypotheses. Blocked coverage remains unfinished. See linked batches for status history and evidence.

- 0056 Next Firefox/WebKit bounded HMR controls PASS; no new finding, confirmed total remains34.
- 0057 Vite Firefox/WebKit order/HMR/recovery controls PASS; no new finding.
- 0058 LSP cancellation/current-version/settings controls PASS; initial self-parent watchdog was harness error, no new finding.
- 0061 Firefox/WebKit example controls10PASS; no new finding, BH-0027 network404 still observed.
- 0062 Astro/Next/Svelte Firefox/WebKit controls6PASS; no new finding.
- 0063 Laravel Firefox/WebKit home CSS/login visibility2PASS; no new finding.

- 0067 independent Vite startup four fixture controls PASS; no new finding, original combined report still blocked byBH-0038.
- 0068 CSS output-size original16builds/artifact/sample controls PASS; no new finding.

- 0073 original cold/repeat32commands and16artifact controls PASS;0075 confirms existingBH-0032 on delivery-mode report; prototype metric zeros require distinct attribution recorded in batch. Total remains41.
- 0076 original progressive report failsBH-0032; same-page sidecar/native/public controls extend facadeBH-0033 andCSSOMcounterBH-0034. No newID.
- 0074 neutral browser14variants/448samples/trace sums PASS; initial180s audit timeout excluded, no new finding.

- 0077 five originalstatic scenarios/four mode toggle controlsPASS; original runtime startblockedBH-0032 andfacadeBH-0033.0078 addsBH-0042 withbaselinearraydeletioncontrol; total42.

- 0079 originalmutation report failsBH-0032; exactpreseed helper createsneitherclass whilearraycontrol createsbothBH-0042.0080 twooriginalstaticchildren PASS; runtimechildblockedBH-0032, observerpause/retainedseed preparation failsBH-0033.42total unchanged.

- 0081 completeness audit mapsremainingrequirements; no newfinding,42confirmed. No blockedunitcountedascomplete.
- 0082 extendsBH-0031 to twoOSprocesses:10/10overlappingpairs bothaccepted; sequentialstale anddifferentfilecontrolsPASS.42confirmed unchanged.

- 0083actual VS Code16selected corpus controls and13color-presentation sets PASS; namespace/mode limitations and TS dependency diagnostics distinguished. No new finding;42confirmed unchanged.

- 0085SDKfilesystemfault/retry behavior observed with4controls. No promised atomicity contract violated; no newfinding,43confirmed. Processcrashes and otherremainingcoverage still unverified.

- 0086process termination/restart controls record1updated/1023unchanged beforefreshpreviewrecovery; no persisted-token or crash-atomicity contract promised. No newfinding,43confirmed.

- 0087completion review:43confirmed unchanged;13blocked andexternal/open-ended coverage remain uncompleted. [Prerequisites](batches/0087-completion-prerequisites.md).

- 0087thirdsame-impasse observation: overallgoalmarkedblocked;43confirmed unchanged, none treatedasfixed orcompletedbyclassification.

- Resumedgoalrun1:43confirmed unchanged; freshprerequisite audit1, no newfinding orclearedcoverage.

- Resumedrun1thirdsame-impasse check: goalblocked again;43confirmed unchanged andnone countedfixed.


- 0088: 44 historical confirmed findings; BH-0024/0025/0027/0028/0044 fixed and verified, 39 remain unresolved. Nuxt BH-0023/0036 implementation remains under verification. Earlier counts describe their historical batches.

- 0089: BH-0013/0014 fixed with Rust/native/Wasm/editor tests; BH-0023/0036 fixed with original HMR and four-mode production tests. 44 historical confirmed findings:9 fixed,35 unresolved. [Evidence](batches/0089-language-and-nuxt-validation.md).

- 0090: BH-0005/0006/0007 fixed; server tests/lint/types/build and72 real-browser raw-text/CSS controls PASS.44historical confirmed:12fixed,32unresolved. [Evidence](batches/0090-server-html-fixes.md).

- 0091: BH-0021 fixed with58installer tests/lint/build;44historical confirmed:13fixed,31unresolved. [Evidence](batches/0091-create-import-boundaries.md).

- 0092：BH-0004本機條件/圖層修正經Rust34、TS126及96browser comparisons通過；nested unresolved imports仍未完成，維持已確認。[證據](batches/0092-import-conditions.md)。
- 0093：BH-0022已修復，15tests/lint/types/build及三瀏覽器的實際plugin/UI＋mock Figma API通過。44歷史確認：14已修復、30未解決；不宣稱真實Figma文件驗證。[證據](batches/0093-figma-import.md)。

- 0094：BH-0008/0009修復；273browser tests/lint/types/build與標準runtime benchmark通過。Global gzip減112bytes，無效manifest仍拒絕；18fixed的最終累計見0095。[證據](batches/0094-runtime-csp-frame.md)。
- 0095：BH-0012/0018修復；scanner80、NodeCLI28、RustCLI3、Vite99與實際三瀏覽器.mjs build通過。44歷史確認：18已修復、26未解決。[證據](batches/0095-mjs-source-discovery.md)。

- 0096/0097：BH-0019/0026修復；CLI34、scanner83tests及built native/Wasm reset/新增source控制通過。44歷史確認：20已修復、24未解決。[watch](batches/0096-cli-source-watch.md)、[binding](batches/0097-cli-binding-selection.md)。

- 0098：BH-0020修復，MCP24/Rust5/native inspection4tests、lint/types/build/Clippy及actual built stdio大小與磁碟檔案一致。44歷史確認：21已修復、23未解決。[證據](batches/0098-mcp-utf8-bytes.md)。

- 0099：BH-0011已修復，tooling208tests加原始Svelte回歸、lint/types/build及三瀏覽器Svelte/Vite分支互動通過；BH-0010仍失敗。44歷史確認：22已修復、22未解決。[證據](batches/0099-svelte-branches.md)。

- 0100：BH-0010已修復；完整2231named references、numeric/attribute規則與23312三瀏覽器/native/Wasm對照通過；Rust14/tooling212/CLI34/Vite99及actual static browser通過。44歷史確認：23已修復、21未解決。[證據](batches/0100-html-character-references.md)。

- 0101：BH-0031已修復；MCP34tests/lint/types/build、跨程序與built stdio20rounds、260critical sections和SDK權限/中止恢復控制通過。44歷史確認：24已修復、20未解決；local same-account cooperative範圍與限制見[批次](batches/0101-mcp-preview-concurrency-fix.md)。

- 0102：BH-0015保留已確認／部分修復。JavaScript直接literal與框架JS expression控制通過，但Vue外層HTML entity＋JS escape的2個範圍/修正回歸失敗；現269PASS/2FAIL。24fixed/20unresolved不變。[下一步](batches/0102-eslint-javascript-escapes.md)。

- 0103：BH-0015修復，ESLint291/tooling215/binding17/config4/Rust18與21實際Vue三瀏覽器控制通過。44歷史確認：25已修復、19未解決；詳見[批次](batches/0103-vue-attribute-mapping.md)。

- 0104：BH-0016修復，Vite106tests/lint/types/build、36built三瀏覽器控制與原範例build通過；44歷史確認：26已修復、18未解決。[證據](batches/0104-vite-relative-hydration.md)。

- 0105：BH-0017已修復；Webpack63tests serial/lint/types/build與54三瀏覽器完整runtime控制、原範例build通過。44歷史確認：27已修復、17未解決；首次parallel suite單項shared-dist載入失敗仍留harness調查。[批次](batches/0105-webpack-relative-runtime.md)。

- 0106：BH-0030已修復；Webpack69tests serial/lint/types/build、36檔名矩陣與3原playground瀏覽器控制通過。44歷史確認：28已修復、16未解決；官方nested命令/依賴及parallel harness限制仍未完成。[批次](batches/0106-webpack-fixed-filename.md)。

- 0107：BH-0001新增22獨立語法回歸（19FAIL/3PASS），三瀏覽器66對照支持預期；原BH-0001/0002仍FAIL。未修產品，28fixed/16unresolved不變；下批需詞法結構與名稱解碼，不能將新增證據視為修復。[批次](batches/0107-animation-syntax-evidence.md)。

- 0108：BH-0001仍部分修正。22syntax與native/Wasm/public/runtime檢查通過，但9個value回歸5FAIL（其中4個由未完成實作引入），三瀏覽器支持預期；舊Wasm雜湊及行為對照已保存。28fixed/16unresolved保持，不將其他green tests視為本問題修復。[下一步](batches/0108-animation-syntax-partial.md)。

- 0109：BH-0001已修復，包含0108的5個失敗。原22syntax、29value/8variable groups、native/Wasm22、87+42browser、CSS72/compiler127/server67及runtime273通過。全Rust另有BH-0002/0003既有3FAIL；29fixed/15unresolved，10blocked不變。[證據與效能代價](batches/0109-animation-value-context.md)。
