# Master CSS 調查交付

- 0162：retained graph環境交付查核完成，沒有修改產品程式。16actual-server cases涵蓋四mode、兩種per-environment設定的idle edge replacement，以及standalone／middleware restart；新entry／child更新、新舊CSS／resource版本與副本清理通過。完整Vite253tests、lint/types及96三瀏覽器觀測全PASS：restart重連／換新URL，後續CSS色彩與SVG像素更新且無額外reload。沿用來源未變的0161 built package；公開文件同步範圍。仍47historical／35fixed／12unresolved、10blocked／4gates／4原候選+1host shutdown限制；0038身分暫停維持。下一批接local-compose完整graph transform，再續virtual resource/reference owner、其他preprocessor／maps、Nuxt／Webpack及全部未完成要求。本批未commit/push；HEADb306e5d77。[0162](batches/0162-development-graph-environments.md)。

- 0161 handoff preserved verbatim in [history](progress-history-0162.md); original evidence and unfinished scope remain available.

- 0160 handoff preserved verbatim in [history](progress-history-0161.md); original results and incomplete scope remain available.

- 0159 handoff preserved verbatim in [history](progress-history-0160.md); original batch evidence and unfinished scope remain authoritative.

- 0158共同交接已逐字歸檔至[歷史紀錄](progress-history-0159.md)；關閉限制與未完成範圍保留。

- 0157共同交接原文已移至[歷史紀錄](progress-history-0158.md)，BH-0046證據及關閉候選沿用。

- 0155–0156共用交接已逐字歸檔至[歷史紀錄](progress-history-0157.md)，各批次證據與未完成範圍保留。

- 0152–0154共用交接已逐字移至[歷史紀錄](progress-history-0155.md)，批次證據與未完成項目保留。

- 0147–0151 共用交接原文已逐字歸檔至[歷史紀錄](progress-history-0153.md)，各批次證據與未完成事項保留。

起始 commit `e66ba7236`。提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。 進度與完整證據見 [README](README.md)、[coverage](coverage.md)、[findings](findings.md)。

47個歷史確認問題：35已修復、12未解決。0159修復BH-0047的pre-render manifest HMR；0157另修復BH-0046的development runtime base，詳見最新批次。0128已修復BH-0045：Vite命名前納入managed CSS，原始快取與獨立lazy CSS控制通過；詳見最新批次。以下保留修復前重現歷史；當前狀態以findings及最新批次為準。BH-0004仍部分修復；[0112](batches/0112-external-import-order.md)確認21次external hoist cascade錯誤及18次nested拒絕，完整交付仍待實作；[0113](batches/0113-stylesheet-boundaries.md)新Rust graph/renderer有108browserPASS，但既有public仍39FAIL，不能結案；[0114](batches/0114-compiled-stylesheets.md)公開graph編譯新增126browserPASS，既有file/build交付、URL base與API gates仍待完成；BH-0001已由[0109](batches/0109-animation-value-context.md)完成，原0108的5個value失敗均通過。BH-0002已由[0110](batches/0110-variable-syntax.md)修復；BH-0003亦由[0111](batches/0111-static-retention.md)完成，145Rust全通過。10blocked coverage及未分類候選仍未完成。

每項「重現與證據」包含命令、結果、控制組與新增測試／重現檔案。安全相關既有重現不重跑。

## 覆蓋與驗證

75 單位中65已檢查、10受阻，沒有未開始項目。Site 在0047後的255路徑更新已於0051重驗。已檢查只代表完成 coverage 所列的有界檢查。

| 分類 | 已檢查 | 受阻 |
|---|---:|---:|
| packages（36） | 29 | 7 |
| Rust crates（18） | 18 | 0 |
| examples（14） | 13 | 1 |
| site（1） | 1 | 0 |
| support（6） | 4 | 2 |

- Rust/TS scoped tests、binding 載入與 disposal、runtime 三瀏覽器、實際 editor/CLI/build/SSR/HMR 均有分批證據；詳見 README 批次索引。
- 0051目前Site：69內容+3migration測試、1145 HTML/CSS契約、lint/type-check、搜尋/Play/明暗/教學sm切換/8舊連結跳轉通過；17 Play測試來源未變。0054另外完成Firefox/WebKit相同有界互動控制。無修正產品。
- 既有 site dogfood：5通過、6失敗、1略過。失敗涉及已變動文件標題／間距與等價色彩字串比較，不能當作6個產品 bug；dev 同色彩斷言亦失敗。0046/0047/0051保留原始結果及排除理由。
- 根目錄4項既有檢查失敗：API census、公開 API golden、runtime size baseline、migration歷史契約提取。未改 golden、snapshot 或 evidence 基準。
- [新增檔案清單與限制](changes.md)。23個 package/crate測試檔與帳本內重現材料；部分回歸測試刻意失敗以保存 bug 證據。

## BH-0004 · P1 · 展開 CSS import 丟失條件與 layer

[crates/mastercss-compiler/src/imports.rs:201](/Users/aron/master/css/crates/mastercss-compiler/src/imports.rs:201)。本機 import 帶 media/supports/layer；應保留條件與層級，實際直接拼入內容，造成錯誤套用與 cascade。

修正方向：展開後包回條件與 layer，保留順序。 [重現與證據](batches/0005-project-graph.md)。

## BH-0006 · P1 · SSR CSS 未安全嵌入 HTML

[packages/server/src/render.ts:165](/Users/aron/master/css/packages/server/src/render.ts:165)。可控制的 encoded class 經解碼嵌入 style；應保持 CSS 資料邊界，實際可改變 HTML 結構並執行腳本。本機無害標記已驗證，不重跑。

修正方向：在 HTML raw-text 邊界安全序列化 CSS，或採外部 CSS 輸出，同時保持 CSS 語意。 [重現與證據](batches/0007-server-render.md)。

## BH-0013 · P1 · Unicode 前綴切片造成 Rust panic

[crates/mastercss-language/src/document.rs:218](/Users/aron/master/css/crates/mastercss-language/src/document.rs:218)。class 函式前有多位元組字元；應正常分析，512-byte 切點卻落在 UTF-8 字元內而 panic。未宣稱整個 LSP process 崩潰。

修正方向：將回溯切點校正到字元邊界。 [重現與證據](batches/0012-language-ir.md)。

## BH-0021 · P1 · Installer 破壞多行 import

[packages/create/src/transforms.ts:23](/Users/aron/master/css/packages/create/src/transforms.ts:23)。既有設定有多行 import；setup 應保持可解析，實際把新 import 插入舊 declaration 中間，導致建置無法啟動。

修正方向：依完整 import declaration 邊界插入並保留 directives/comments。 [重現與證據](batches/0031-create-setup.md)。

## BH-0022 · P1 · Figma 無法正確匯入自己的 export

[packages/figma/src/features/setCollectionVariables.ts:52](/Users/aron/master/css/packages/figma/src/features/setCollectionVariables.ts:52)。exporter 產出 definitions array；importer 應還原變數與 modes，實際寫出 0/key 等 metadata 名稱。實際函式由明示 mock Figma API 驗證，未操作真實檔案。

修正方向：先將支援的兩種資料形狀正規化，再寫入變數及 modes。 [重現與證據](batches/0033-figma-variables.md)。

## BH-0023 · P1 · Nuxt progressive 缺少 client manifest

[packages/nuxt/src/module.ts:255](/Users/aron/master/css/packages/nuxt/src/module.ts:255)。使用預設 progressive 模式；應取得 JSON 完成 hydration，實際 asset 未發布而回傳 HTML，client/runtime 無法啟動。真實建置及 Chromium 重現。

修正方向：所有需要 client manifest 的模式均發布對應 Nitro public asset。 [重現與證據](batches/0035-ssr-examples.md)。

## BH-0029 · P1 · Rspack static 模式漏掉 managed CSS

[packages/webpack/src/plugins/usage-graph.ts:35](/Users/aron/master/css/packages/webpack/src/plugins/usage-graph.ts:35)。Rspack/Rsbuild static 建置；應產出 class/native CSS，succeedModule 的 source 卻為 undefined，整個 module 被跳過，最後 CSS 為空。

修正方向：使用支援的 Rspack source API/時機，完成掃描再輸出；追加驗證目前暫停。 [重現與證據](batches/0038-integration-lab.md)。

## BH-0001 · P2 · CSS 字串與註解被當成動畫宣告

[crates/mastercss-engine/src/stylesheet_resources.rs:93](/Users/aron/master/css/crates/mastercss-engine/src/stylesheet_resources.rs:93)。raw CSS 字串或註解含動畫關鍵字；應只分析有效語法，實際遺漏或多產 keyframes，影響動畫與 emitted globals。

修正方向：使用 CSS lexer/結構化宣告分析，排除字串與註解。 [重現與證據](batches/0002-stylesheet-resources.md)。

## BH-0003 · P2 · static token 的依賴未保留

[crates/mastercss-engine/src/resources.rs:160](/Users/aron/master/css/crates/mastercss-engine/src/resources.rs:160)。static variable 引用其他 token；初始化或最後 class 刪除後，應仍有依賴 CSS，實際依賴消失而無法解析變數。

修正方向：static 資源也遞迴保留及計數依賴。 [重現與證據](batches/0003-static-resources.md)。

## BH-0005 · P2 · SSR 未解碼 numeric HTML references

[packages/server/src/decode-html.ts:7](/Users/aron/master/css/packages/server/src/decode-html.ts:7)。class 含十進位或十六進位 character reference；應與瀏覽器 class 一致，實際 class 不同或缺 CSS。

修正方向：完整解碼 HTML character references，核對分詞順序。 [重現與證據](batches/0007-server-render.md)。

## BH-0007 · P2 · 無 class 的 HTML 缺 static 初始資源

[packages/server/src/create-server-renderer.ts:56](/Users/aron/master/css/packages/server/src/create-server-renderer.ts:56)。Manifest 有 static theme/keyframes、HTML 無 class 屬性；應仍輸出初始資源，實際略過 snapshot 而缺樣式。

修正方向：讓空 class 集合也建立必要初始快照。 [重現與證據](batches/0007-server-render.md)。

## BH-0008 · P2 · 嚴格 CSP 下 external hydration 啟動失敗

[packages/runtime/src/hydration.ts:70](/Users/aron/master/css/packages/runtime/src/hydration.ts:70)。CSP 禁止動態程式求值；應可讀取 hydration 資料，實際 Function constructor 拋錯而中止 startup。既有證據不重跑。

修正方向：採可由 bundler 處理的載入或明確 JSON 讀取，維持 CSP 限制。 [重現與證據](batches/0008-runtime-hydration.md)。

## BH-0009 · P2 · iframe root 漏掉 class mutation

[packages/runtime/src/class-tracker.ts:67](/Users/aron/master/css/packages/runtime/src/class-tracker.ts:67)。Root 是其他 realm 的 iframe Document；class 更新應改 CSS，實際 instanceof Element 不成立而跳過。三瀏覽器重現。

修正方向：使用 root 所屬 realm 或適當 DOM 能力判斷節點。 [重現與證據](batches/0009-runtime-mutations.md)。

## BH-0010 · P2 · HTML extraction 未解 character references

[crates/mastercss-source/src/lib.rs:263](/Users/aron/master/css/crates/mastercss-source/src/lib.rs:263)。HTML class 含 character references；static extraction 應取得實際 class，實際保留 encoded 字串而漏產 CSS。與 BH-0005 根因獨立。

修正方向：在 Rust HTML adapter 解碼，維持來源位置契約。 [重現與證據](batches/0010-source-extraction.md)。

## BH-0011 · P2 · Svelte else 分支未提取

[packages/tooling/src/source/adapters/svelte.ts:75](/Users/aron/master/css/packages/tooling/src/source/adapters/svelte.ts:75)。class 只在 else 分支；應進入 static CSS，實際只遍歷 children，分支沒有样式。

修正方向：依實際 Svelte AST 遍歷 else 等分支並防止重複。 [重現與證據](batches/0010-source-extraction.md)。

## BH-0012 · P2 · scanModule 漏收 .mjs

[packages/tooling/src/scanner/core.ts:32](/Users/aron/master/css/packages/tooling/src/scanner/core.ts:32)。透過 scanModule 處理 .mjs；應如 .js 產生 CSS，實際 extension 快速篩選直接跳過。

修正方向：補齊並共用受支援副檔名契約。 [重現與證據](batches/0011-scanner-state.md)。

## BH-0014 · P2 · 跳脫字元後 semantic token 範圍偏移

[crates/mastercss-language/src/session.rs:267](/Users/aron/master/css/crates/mastercss-language/src/session.rs:267)。JS class 字串含 escaped quotes；高亮應對應 raw source，實際使用 decoded 長度，後續 token 前移。

修正方向：保留 decoded-to-raw mapping，再轉為 UTF-16 範圍。 [重現與證據](batches/0012-language-ir.md)。

## BH-0015 · P2 · 合法 Unicode escape 被 ESLint 誤報（部分修復）

0102已將JavaScript cooked字串送入Rust lint並對映來源範圍；Vue同時包含HTML entity時仍缺外層對映。完整plugin269PASS/2FAIL；已阻止已知錯誤範圍的autofix，但仍須恢復精確診斷及正確修正，不可標完成。[進度與下一步](batches/0102-eslint-javascript-escapes.md)。

[packages/eslint-plugin/src/utils/resolve-class-node.ts:89](/Users/aron/master/css/packages/eslint-plugin/src/utils/resolve-class-node.ts:89)。clsx 字串以 Unicode escape 表示 block；應認得合法 class，實際 raw 字串被當成 unknown。

修正方向：用 cooked 值解析語意，同時維持 raw offset 以安全修正。 [重現與證據](batches/0017-eslint-adapters.md)。

## BH-0016 · P2 · Vite 巢狀 HTML hydration URL 錯誤

[packages/vite/src/plugins/pre-render.ts:83](/Users/aron/master/css/packages/vite/src/plugins/pre-render.ts:83)。relative base 加巢狀 HTML；URL 應指向 emitted JSON，實際相對目前頁面解析到錯誤目錄，hydration 失敗。

修正方向：依輸出 HTML 所在目錄計算相對 asset URL。 [重現與證據](batches/0020-vite-runtime-html.md)。

## BH-0017 · P2 · Webpack 巢狀 HTML runtime URL 錯誤

[packages/webpack/src/plugins/runtime-html-assets.ts:52](/Users/aron/master/css/packages/webpack/src/plugins/runtime-html-assets.ts:52)。relative publicPath 加巢狀 HTML；應載入 emitted runtime，實際請求不存在的子目錄檔案而無法啟動。

修正方向：傳入 HTML asset name，區分相對與絕對 URL。 [重現與證據](batches/0021-webpack.md)。

## BH-0018 · P2 · Node/native CLI 預設 discovery 漏掉 .mjs

[packages/cli/src/generate.ts:12](/Users/aron/master/css/packages/cli/src/generate.ts:12)。專案有 .mjs；預設掃描應與明確指定檔案一致，實際漏產 CSS。Node 與 Rust CLI 均有正常控制組。

修正方向：同步兩端 discovery extensions；與 BH-0012 分開修正。 [重現與證據](batches/0028-cli-discovery.md)。

## BH-0019 · P2 · CLI watch 未觀察新增來源檔

[packages/cli/src/generate.ts:185](/Users/aron/master/css/packages/cli/src/generate.ts:185)。啟動後新增匹配頁面；應增量產 CSS，實際僅監看啟動時的具體檔案。既有檔案更新正常。

修正方向：監看搜尋根目錄並過濾來源，涵蓋新增及初始空集合。 [重現與證據](batches/0029-cli-watch.md)。

## BH-0024 · P2 · Angular 使用 Express5 不支援的 wildcard

[examples/angular/server.ts:28](/Users/aron/master/css/examples/angular/server.ts:28)。app() 註冊 *.* 或 *；應建立路由，實際均拋 Missing parameter name，server 無法啟動。另有 BH-0025 bundle 阻礙。

修正方向：使用 Express5 static middleware 與具名 catch-all，涵蓋根路徑。 [重現與證據](batches/0036-angular-laravel.md)。

## BH-0025 · P2 · Angular SSR 打包後找不到依賴資料

[examples/angular/angular.json:16](/Users/aron/master/css/examples/angular/angular.json:16)。正常建置成功，server啟動因 css-tree 的相對 `patch.json` require 搬到 bundle 位置而失敗。資料檔存在；直接與external載入通過，最小打包案例同樣失敗。屬範例依賴打包契約，未歸因於Master語意。

修正方向：保留依賴套件邊界或明確處理runtime資料。[重現與證據](batches/0050-angular-bundle.md)。

## BH-0026 · P2 · CLI 忽略 binding 選擇

[packages/cli/src/generate.ts:138](/Users/aron/master/css/packages/cli/src/generate.ts:138)。`generate --binding wasm` 應使用 Wasm，實際仍建立 native scanner。直接 native/Wasm 控制組均成功，觀察分別為1/0；CLI native/Wasm 均為1。

修正方向：明確將執行設定傳入 scanner 及相關路徑；未宣稱 CSS 差異。[重現與證據](batches/0048-cli-binding-selection.md)。

## BH-0028 · P2 · ESLint 範例 CSS 阻止規則載入

[examples/eslint/index.css:61](/Users/aron/master/css/examples/eslint/index.css:61)。執行現代範例 lint；應得到 class 診斷，實際 $color-gray-100 被 compiler 拒絕而先中止。

修正方向：將 stylesheet 變數引用改為原生 var()。 [重現與證據](batches/0037-eslint-examples.md)。

## BH-0030 · P2 · 固定輸出檔名與 runtime entry 衝突

[packages/webpack/src/plugins/runtime-entry.ts:14](/Users/aron/master/css/packages/webpack/src/plugins/runtime-entry.ts:14)。官方 playground 設 output.filename=bundle.js；應可 build，插件第二個 entry 也用同名輸出，編譯因重複 asset 中止。

修正方向：為 runtime entry 指定獨立檔名，或明確調整 multi-entry 輸出契約。 [重現與證據](batches/0042-nested-hosts.md)。

## BH-0031 · P2 · MCP 並行預覽套用缺少序列化（已修復）

0101同步認領token並以同帳號跨程序filesystem gate保護hash驗證到寫入。MCP34tests、built stdio20rounds、260critical sections及權限/中止恢復控制通過；外部writer與crash atomicity仍不保證。[修復與限制](batches/0101-mcp-preview-concurrency-fix.md)。以下保留原始問題證據。

[packages/mcp/src/context.ts:221](/Users/aron/master/css/packages/mcp/src/context.ts:221)。同一token同時套用兩次均成功；兩個基於相同原文的預覽也可都成功寫入同一檔案，後者覆蓋前者。依序重試／衝突控制正確拒絕；實際SDK並行也重現。

修正方向：原子認領token並協調重疊檔案的驗證與寫入。[同程序證據](batches/0053-mcp-preview-concurrency.md)；0082兩個OS程序10/10重疊配對也皆成功，單一instance鎖不足以涵蓋此情境。[多程序證據](batches/0082-mcp-multiprocess.md)。

## BH-0032 · P2 · Benchmark 未交付必要 Wasm

[benchmarks/shared/browser-lifecycle.ts:642](/Users/aron/master/css/benchmarks/shared/browser-lifecycle.ts:642)。lifecycle頁面只複製runtime JS與manifest，Wasm請求404導致初始載入測量逾時。一次性輸出加入套件既有sidecar後正常啟動。

修正方向：交付並統計sidecar。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0075原始delivery-mode報告亦在runtime頁面失敗，補sidecar控制恢復啟動。[Delivery證據](batches/0075-master-delivery-modes.md)。

## BH-0036 · P2 · Nuxt runtime 未編譯 theme 樣式

[packages/nuxt/src/module.ts:284](/Users/aron/master/css/packages/nuxt/src/module.ts:284) 關閉整個 Vite adapter；其 stylesheet 編譯因此未執行。實際 Nuxt runtime dev 頁面保留 raw `@theme`，`--color-host` 沒有定義，但 runtime 根據 emittedGlobals 略過該變數輸出，`fg:host` 與 native component 都顯示黑色。冷載入相同；測試頁補上原生變數後立即恢復預期 #123456。

修正方向：Nuxt 接管 runtime 注入時仍保留 stylesheet 編譯。原始 theme HMR 受阻，native CSS 控制組不代表原始 fixture 通過。[重現與證據](batches/0060-nuxt-dev-hmr.md)。

## BH-0038 · P2 · Startup benchmark 匯入 CLI 執行入口即退出

[benchmarks/shared/startup-diagnostics.ts:218](/Users/aron/master/css/benchmarks/shared/startup-diagnostics.ts:218)。將可執行bin當被動模組匯入；無subcommand令Commander退出1，第一個variant即失敗，沒有診斷報告。同一bin的正常generate命令及core被動匯入皆通過。

修正方向：被動import量測使用不執行CLI的入口，bin維持完整command量測。[證據](batches/0066-startup-diagnostics.md)。

## BH-0002 · P3 · raw var() 空白漏掉依賴

[crates/mastercss-engine/src/stylesheet_resources.rs:54](/Users/aron/master/css/crates/mastercss-engine/src/stylesheet_resources.rs:54)。直接交 raw stylesheet，var() 名稱前使用 tab 等 CSS whitespace；應保留變數，實際漏收。Compiler 正規化路徑已排除。

修正方向：依 CSS whitespace/token 規則辨識 var()。 [重現與證據](batches/0002-stylesheet-resources.md)。

## BH-0020 · P3 · MCP preview bytes 使用 UTF-16 長度

[packages/mcp/src/context.ts:184](/Users/aron/master/css/packages/mcp/src/context.ts:184)。Preview 含非 ASCII；應回報 UTF-8 bytes，實際用 .length，大小 metadata 錯誤。內容及 hash 正確。

修正方向：使用 Buffer.byteLength(text, 'utf8') 並同步統計。 [重現與證據](batches/0030-mcp-contracts.md)。

## BH-0027 · P3 · Webpack 範例請求不存在的 script

[examples/webpack/src/index.html:6](/Users/aron/master/css/examples/webpack/src/index.html:6)。模板手寫 `./index.js`，實際輸出 `main.js`，瀏覽器收到404與console error。自動注入的main/runtime與CSS仍正常，未造成整頁失效。

修正方向：移除多餘 script，由 HtmlWebpackPlugin 注入。[重現與證據](batches/0049-webpack-example-asset.md)。

## BH-0033 · P3 · Benchmark runtime 指標錯報零

[benchmarks/shared/browser-lifecycle-page.ts:251](/Users/aron/master/css/benchmarks/shared/browser-lifecycle-page.ts:251)。讀取全域facade不再提供的欄位；公開snapshot有46規則／1904bytes，benchmark卻報0。

修正方向：使用公開snapshot。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0076共享diagnostic reader把已採用progressive及1940bytes錯報0，46個class records全部報缺失。[Progressive證據](batches/0076-progressive-diagnostics.md)。

## BH-0034 · P3 · Benchmark 漏計 CSSStyleRule

[benchmarks/shared/browser-lifecycle-page.ts:288](/Users/aron/master/css/benchmarks/shared/browser-lifecycle-page.ts:288)。CSSStyleRule具有空cssRules時，遞迴計數略過自身。新增有效原生規則仍回報0→0。

修正方向：計入樣式規則自身並另行遍歷巢狀規則。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0076同根因把實際46CSSStyleRules計成0。[Progressive證據](batches/0076-progressive-diagnostics.md)。

## BH-0035 · P3 · VS Code 設定更新產生未處理的 ESLint 命令錯誤

[packages/vscode/src/extension.min.ts:423](/Users/aron/master/css/packages/vscode/src/extension.min.ts:423)。未安裝 ESLint 時更改 Master CSS 設定，無條件呼叫不存在的 `eslint.restart` 且未處理 promise，extension host 記錄未處理拒絕。相同 host 的手動 Master CSS 重啟會檢查命令是否存在，沒有此錯誤；hover及設定功能仍正常。

0117已修復：沿用已檢查可選命令的重啟路徑並處理設定事件的拒絕；實際VS Code與31tests通過。[修復證據](batches/0117-vscode-settings-restart.md)，[原始重現](batches/0059-vscode-settings.md)。

## BH-0037 · P3 · Compiler/extraction diagnostics 分階段指標未量測

[benchmarks/shared/compiler-diagnostics.ts:326](/Users/aron/master/css/benchmarks/shared/compiler-diagnostics.ts:326)。報告宣告136個指標，實際四fixture各只有17個；119個lowering/manifest等指標完全沒有樣本，原始碼未接上階段量測。現有CSS hash/marker檢查通過，缺值未被填成0。

Extraction亦有15個未量測IDs，兩次完整compose卻標為engine建立／規則生成，不能用作單次render的分階段成本。修正方向：讓診斷契約符合實際量測，或接上正確擁有者的階段量測。[Compiler證據](batches/0064-compiler-diagnostics.md)、[extraction證據](batches/0065-extraction-diagnostics.md)。

## BH-0039 · P3 · CSS structure benchmark 高估選擇器 specificity

[benchmarks/shared/css-structure.ts:354](/Users/aron/master/css/benchmarks/shared/css-structure.ts:354)。Universal誤加type權重，:is/:not/:has誤加pseudo-class自身權重；四個標準案例分別多1或10分。普通選擇器與Chromium實際cascade控制通過，問題僅在benchmark指標。

修正方向：依標準特殊偽類與universal規則計算。[證據](batches/0069-css-structure.md)。

## BH-0040 · P3 · Docs CSS size 將404HTML計為CSS

[benchmarks/docs-page-css-size/shared.ts:166](/Users/aron/master/css/benchmarks/docs-page-css-size/shared.ts:166)。404被排除於失敗判定，錯誤頁body仍被計成CSS且未保留狀態。實際HTTP控制中1079bytes HTML被報為CSS，Chromium沒有套用任何規則；200CSS及500拒絕控制正常。

修正方向：排除或明確標記失敗資源，避免誤計HTML。[證據](batches/0071-docs-css-size.md)。

## BH-0041 · P3 · Vite benchmark 誤報已掃描來源數

[benchmarks/shared/build-diagnostics.ts:242](/Users/aron/master/css/benchmarks/shared/build-diagnostics.ts:242)。Build/startup以hook次數當檔案數，包含被略過的virtual/CSS及重複HTML；實測報6，實際為2個檔案／3次scan。觀察前後CSS雜湊一致。

修正方向：計算符合定義的實際來源數，或使用準確的callback計數名稱。[證據](batches/0072-vite-scan-counts.md)。

## BH-0042 · P3 · Benchmark 陣列參數處理錯誤

[benchmarks/shared/interaction-cost-harness.ts:129](/Users/aron/master/css/benchmarks/shared/interaction-cost-harness.ts:129)。公開API接收一個class陣列，包裝器卻以參數數量計class；三個class新增／刪除各只計1。延後與抑制刪除策略在flush使用apply(runtime,names)，把陣列拆成多參數；回報已處理3個，實際3個規則全留下。相同陣列的baseline刪除正常。

修正方向：計算陣列元素並以單一陣列轉送刪除。[Wrapper證據](batches/0078-interaction-array-contract.md)；0079原始preseed的spread呼叫也未建立兩個指定class，正確陣列控制均建立。[Preseed證據](batches/0079-runtime-mutation-diagnostics.md)。

## BH-0043 · P3 · Benchmark 清理情境誤報樣式驗證成功

[benchmarks/shared/interaction-cost-page.ts:330](/Users/aron/master/css/benchmarks/shared/interaction-cost-page.ts:330)將`computedStyleValid`固定設為true。頁面就緒後停用CSS，實際對齊從center變為start，480個元素的清理情境仍回報樣式檢查通過；正常CSS控制組保持center。初始readiness確實檢查樣式，但情境結果沒有對應的樣式斷言。

修正方向：執行實際情境樣式驗證，或將未支援的指標標為不適用。DOM清理及trace重算通過，不等於該指標可信。[證據](batches/0084-style-invalidation-static.md)。

## 待驗證與限制

- BH-0025/0026/0027已於0048–0050確認；沒有待分類假設，仍有未完成覆蓋。
- Rspack／Rsbuild 追加 host 驗證於使用者再次回報 Trusted Access 提示後暫停；工具未提供分類原因，不能宣稱由 CSP／腳本測試觸發。等待使用者確認身分驗證後續做。
- 七個非本機 native targets 缺 OS／CPU／binary；Angular SSR、現代 ESLint 範例及部分 nested hosts 有明確阻礙，詳見 coverage。
- Figma collection API 使用明示 mock；Cloudflare live KV、remote deploy、Firebase 及完整平台矩陣未驗證。
- 根目錄／site 的既有測試失敗和環境差異見0040、0046、0047，不全列為產品 bug。
- 0060 Nuxt原始theme HMR因BH-0036受阻；測試用native變數對照的成功沒有計為該項完成。
- 0055 benchmark原始lifecycle與可靠長時間測量受BH-0032/0033/0034阻礙，未發布效能比較。
- 0056–0058 Next/Vite Firefox與WebKit HMR、LSP取消與版本／設定有界控制通過，未新增問題；0059另完成實際VS Code有界設定切換並確認BH-0035；更廣的取消／設定競態仍未窮舉。
- 0061–0063補齊九個可啟動範例的Firefox/WebKit有界控制，共18PASS；BH-0027仍有404，其他阻礙沒有因矩陣通過而清除。
- 0064–0066補完compiler/extraction八個CSS一致性控制及startup三個入口對照；BH-0037/0038仍阻礙詳細階段量測／原始startup報告。
- 0067 Vite startup四個獨立variant通過；0068/0069各16組原始建置與產物一致性檢查通過，BH-0039 specificity仍不正確，不能以報告成功代表指標全部可信。
- 0070八個build診斷產出／0071八個公開文件頁面蒐集完成；BH-0040失敗資源計量及BH-0041來源數仍不正確，原始報告成功未清除阻礙。
- 0073 cold/repeat32commands/16artifacts與0074 neutral14variants/448samples/trace重算通過；0075/0076原始delivery/progressive報告受BH-0032阻礙，0076另實測確認舊facade欄位與CSSOM計數誤報，controls不清除阻礙。
- 0077完成五個原始static互動及四模式64items切換控制，完整互動報告仍因BH-0032/0033受阻；0078確認BH-0042，未以控制組取代原始完整量測。
- 0079/0080原始mutation/style-invalidation報告受BH-0032阻礙；preseed參數BH-0042及observer/retention準備BH-0033另有精確原函式控制。0080兩個static子報告成功不代表完整矩陣完成。
- 0081已逐列保留75個單位的剩餘要求並核對16個benchmark入口證據；MCP多程序已於0082完成有界控制，仍可執行既有editor corpus及static子矩陣。完整目標未完成。[完成證據審查](batches/0081-completion-evidence-audit.md)。
- 已檢查只代表完成帳本列出的行為檢查，不表示沒有其他 bug。

- 0083既有editor corpus的16個選定hover／補全／語言模式與13組色彩呈現控制通過；僅涵蓋批次列明操作，其他運算式、診斷收斂與競態仍未窮舉。[證據](batches/0083-vscode-corpus.md)。

- 0085MCP實際權限錯誤下會部分寫入；舊token因已改變hash拒絕重試，新preview可完成剩餘檔案。現有契約未承諾多檔原子性，未新增問題。[證據](batches/0085-mcp-filesystem-faults.md)。

- 0086自有MCP程序中止控制觀察到1檔已更新、1023檔未更新；新程序拒絕舊token，新preview恢復全部內容。沒有持久token或crash原子性承諾，未新增問題。[證據](batches/0086-mcp-process-interruption.md)。

- 0087完成要求逐項核對仍不能證明全部完成：13個阻礙需對應主機／產物、產品或工具修正及使用者驗證；外部服務與未定義邊界的全面覆蓋仍缺必要條件。[完整未完成清單與接續條件](batches/0087-completion-prerequisites.md)。

- 連續三輪實際核對後，持續目標已標為blocked，沒有標完成。43項問題、13個受阻單位及其餘未證明範圍完整保留；解除條件見[0087](batches/0087-completion-prerequisites.md)。

- 目標重新啟用後，依規則重設停滯計數。恢復後第一次核對仍無解除條件；目標目前active、未完成，先前blocked紀錄保留。[新核對](evidence/0087-resumed-1-check-1.json)。

- 恢復後再連續三輪確認條件未變，目標已再次標為blocked；所有未完成要求與接續步驟保留於0087。



歷史進度原文移至 [修復報告歷史進度（0130整理）](report-history-0130.md)；目前狀態以原檔的最新交接為準。






0131–0133批次與提交交接原文移至 [report history0134](report-history-0134.md)；當前狀態以本檔最新紀錄為準。

0134：修復alias／custom resolver把專案CSS誤當套件而漏裁剪的回歸；改核對實際檔案是否在原名稱的套件根目錄。新增actual10build／54browser，修後36PASS／18FAIL及1Sass buildFAIL；36個裁剪／套件／明確保留控制全通過，剩餘為virtual匯入／入口與Sass入口／匯入。compiler219／Vite110、lint/types/build、既有resolver36／resource18及Site prepare/lint通過（75warnings）。下一批接非檔案來源載入與預處理，保留條件、資源、診斷與watch；不以拒絕計完成。歷史0131–0133交接逐字歸檔。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分暫停不變；HEADef7887f76，未提交／推送。[0134](batches/0134-vite-alias-pruning.md)。

0135：接通Vite virtual CSS來源載入，保留原始CSS、opaque ID/query與條件圖譜；graph-only loader子檔不再額外成為無條件入口。compiler223／Vite110、兩套件lint/types/build通過；13actual builds剩1SassFAIL，72browser為66PASS／6SassFAIL，其中virtual30與裁剪36全通過。既有resolver36／resource18／cache39、3種watch共54與純Vite控制18通過；早期watch非實體暫存路徑及錯用getWatchFiles屬harness問題，query截斷則已修復。Site prepare/lint通過（75warnings）；5artifacts不變，兩root API gates仍失敗。下一步接Sass入口／匯入預處理、virtual資源／reference與其他host路徑，再遷移Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEADef7887f76，本批未提交／推送。[0135](batches/0135-vite-virtual-sources.md)。

0136：Vite Sass入口／匯入改用主機預處理，保留CSS import條件、來源owner與partial依賴；修復additionalData重複、raw解析及CSS Modules匯出，baseFile無custom resolver亦可用。compiler225／Vite114、lint/types/build與原Vite範例通過；原host-inputs13build／78browser全PASS。擴充Sass15build全成功、90browser為84PASS／6managed-inlineFAIL；partial直接／條件／錯誤恢復共54PASS，另驗證一次預期Sass錯誤及原partial路徑。小SVG內嵌造成的network斷言及color格式斷言屬測試錯誤。Site prepare/lint通過（75warnings）；5artifacts與兩root API失敗hash不變。下一步修managed `?inline`完整字串／資產交付，再補preprocessor位置對映、Modules／其他host路徑與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEAD111046867，本批未提交／推送。[0136](batches/0136-vite-sass-sources.md)。

0137：managed CSS／Sass `?inline`改為獨立完整字串，Rust安全展開import並保留namespace／external邊界；修復URL誤改作者字串、IIFE／UMD路徑與graph-only假警告。83Rust／227compiler／118Vite及198public、84inline、90Sass、36watch瀏覽器對照PASS。early WebKit時序、pruning／lazy／其他格式、source maps與Webpack仍待驗證；compiler-Wasm+9642raw／2868gzip／1947brotli，runtime四產物不變。33fixed／12unresolved、10blocked、4root gates／4候選與0038暫停不變；HEAD087655705，未提交／推送。[0137](batches/0137-inline-css-delivery.md)。

0138：修復inline無條件發布，依Rust URL參照及實際輸出chunk裁剪子CSS／資源，保留共用anchor。Vite121／lint/types/build、10build／30browser、原inline84與watch18PASS；純Vite兩筆閒置資源保留列BASELINE。used字串仍有35byte anchor，其他格式／cycles／maps與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0138](batches/0138-inline-asset-pruning.md)。

0128–0130歷史進度逐字移至 [歷史進度（0139整理）](progress-history-0139.md)；目前狀態以本檔最新批次為準。

0139：修復SSR inline輸出本機file URL及繞過emitAssets設定；改用public base，關閉發布時搭配client資產。Vite125、SSR24build／36browser、Node16loads、worker6及原inline84browser全PASS；Site prepare/lint通過（75warnings）。首輪library格式設定與SSR弱斷言屬harness錯誤。自訂URL映射／maps／其他host與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0139](batches/0139-inline-server-hosts.md)。

0140：inline已接renderBuiltUrl的js／css主機映射、runtime URL與URI編碼；修復映射改變卻沿用CSS檔名、relative base的client／SSR資產不一致。Vite131／lint/types/build、最終URL36／paired12／inline84／pruning30／watch18browser全PASS；Site通過（75warnings）。來源序列化仍由Rust負責，automatic hooks／multi-environment／cycles仍待驗證；下一批Sass原始位置對映，再續其他host與Webpack。33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0140](batches/0140-inline-built-urls.md)。

使用者再次授權提交已完成部分：本次納入0141–0142已完成的查核紀錄、重現材料與原始證據；歷史HEAD／未提交描述保留為當時狀態。共用watch腳本僅提交與0142 inventory SHA-256一致的已驗證版本，0143擴充保留工作目錄。BH-0004產品／套件測試與其他對話Site變更未納入。0143直接子檔watch已6build／18browser PASS，新增dependency3tests與Modules9tests通過；但巢狀錯誤恢復最新6build／18browser為16PASS／2FAIL，Chromium恢復時請求不存在的JS／CSS資產，尚須區分watch事件時序、發布行為與腳本因素，不能宣稱修復完成。相關命令已結束；下一步先查事件與資產發布時序，再補穩定的恢復驗證及0143整批收尾，續dev/HMR、其他host與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分驗證暫停不變，目標保持active；此次未推送。[提交範圍與保存證據](evidence/0142-commit-validation.json)。

0145：development CSS／Sass Modules接入既有主機預處理與scoped匯出／usage流程，依root／composes子檔失效cache及Vite代理modules；修復managed entry缺少具名匯出與local Sass500。Vite160／lint/types/build／範例PASS；entry／local、直接／巢狀、三瀏覽器HMR72及production60對照PASS，逐步核對新HMR且無整頁reload。preset blue色彩oracle與首次baseFile/preserveImports接入錯誤分開留證。Site通過（75warnings），五產物不變。下一批dev inline／raw／url與普通Sass、其他host／Webpack；0144巢狀缺檔主機終止仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選與0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0145](batches/0145-module-development-hmr.md)。

0141–0144歷史進度逐字移至 [歷史進度（0146整理）](progress-history-0146.md)；目前狀態以本檔最新批次為準。

0146：修復共用manifest HMR hook丟棄普通CSS／inline／raw更新modules，保留原節點並合併virtual manifest；internal18、Vite160、Astro15與三套件lint/types/build、Vite／Astro範例均PASS。修後完整開發request矩陣93PASS／3FAIL；剩managed Sass ?url的link為/style.scss，但HMR送/style.scss.css?direct，更新路徑不匹配，已留WebSocket證據待修。另Modules HMR18PASS；URL原文oracle與pure冷啟動boot判定分開記錄。Site通過（75warnings），五產物不變；20段歷史逐字歸檔。下一批先修Sass direct URL HMR，再續其他request／host與Webpack；0144巢狀缺檔仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0146](batches/0146-development-style-requests.md)。

部分較早批次交接逐字保存於[0159歷史歸檔](progress-history-0159.md)，目前狀態以最新交接與原批次為準。
