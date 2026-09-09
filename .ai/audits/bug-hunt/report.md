# Master CSS 調查交付

起始 commit `e66ba7236`。提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。 進度與完整證據見 [README](README.md)、[coverage](coverage.md)、[findings](findings.md)。

45個歷史確認問題：32已修復、13未解決。0127新增BH-0045：Vite最終CSS內容改變但hash URL未改，實際快取回應控制仍顯示舊樣式；詳見最新批次。以下保留修復前重現歷史；當前狀態以findings及最新批次為準。BH-0004仍部分修復；[0112](batches/0112-external-import-order.md)確認21次external hoist cascade錯誤及18次nested拒絕，完整交付仍待實作；[0113](batches/0113-stylesheet-boundaries.md)新Rust graph/renderer有108browserPASS，但既有public仍39FAIL，不能結案；[0114](batches/0114-compiled-stylesheets.md)公開graph編譯新增126browserPASS，既有file/build交付、URL base與API gates仍待完成；BH-0001已由[0109](batches/0109-animation-value-context.md)完成，原0108的5個value失敗均通過。BH-0002已由[0110](batches/0110-variable-syntax.md)修復；BH-0003亦由[0111](batches/0111-static-retention.md)完成，145Rust全通過。10blocked coverage及未分類候選仍未完成。

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

## 0088 修復狀態

BH-0024、BH-0025、BH-0027、BH-0028 已修復並通過原始驗證；另確認並修復 Angular Wasm 資產遗漏 BH-0044。Nuxt BH-0023／0036 尚在驗證，不計已修復。[修正與證據](batches/0088-example-nuxt-fixes.md)。舊段落保留修正前問題與重現。

## 0089 修復狀態

BH-0013／0014 的 Unicode panic 與 semantic ranges 已修復，Rust、native／Wasm、language-service 驗證通過；Nuxt BH-0023／0036 通過原始8階段 HMR 與4模式 production 測試。[證據](batches/0089-language-and-nuxt-validation.md)。

## 0090 修復狀態

BH-0005／0006／0007 已修復；SSR 字元參照、靜態資源與style注入邊界通過測試，三瀏覽器72案例證明沒有script執行且CSS內容值不變。[證據](batches/0090-server-html-fixes.md)。

## 0091 修復狀態

BH-0021已修復；installer保留完整import邊界、shebang與directive prologue，58tests/lint/build通過。[證據](batches/0091-create-import-boundaries.md)。目前44個歷史確認問題中13已修復、31未解決。

## 0092–0093 修復進度

BH-0004本機條件與cascade層級通過96browser比較，但nested unresolved imports仍未完成。[0092](batches/0092-import-conditions.md)。BH-0022已修復，15tests及三瀏覽器built plugin/UI＋mock Figma API通過，真實Figma host仍未驗證。[0093](batches/0093-figma-import.md)。目前14已修復、30未解決，目標active。

## 0094–0095 修復進度

BH-0008/0009 runtime CSP/iframe更新已修復，273browser tests與standard benchmark通過。[0094](batches/0094-runtime-csp-frame.md)。BH-0012/0018 .mjs發現已修復，scanner/Node/native CLI/Vite及實際browser驗證通過；BH-0019/0026及BH-0004殘餘仍未完成。[0095](batches/0095-mjs-source-discovery.md)。目前18已修復、26未解決，目標active。

0096/0097：BH-0019新增檔監看與BH-0026 CLI binding選擇已修復；CLI34/scanner83tests、lint/types/build及built CLI native/Wasm重載控制通過。詳細範圍及限制見[0096](batches/0096-cli-source-watch.md)、[0097](batches/0097-cli-binding-selection.md)。

0098：BH-0020 UTF-8 byte metadata已修復；涵蓋MCP preview/format/render與Rust inspection來源，實際stdio預覽/套用後檔案大小一致。MCP24/Rust5/inspection4tests及lint/types/build通過。[證據](batches/0098-mcp-utf8-bytes.md)。目前21已修復、23未解決，10受阻覆蓋仍未完成。

0099：BH-0011 Svelte else/each/await分支提取已修復，三瀏覽器實際static分支互動、tooling208tests加原始回歸及lint/types/build通過。BH-0010仍未完成。[證據](batches/0099-svelte-branches.md)。目前22已修復、22未解決。

0100：BH-0010已修復，完整HTML attribute參照、ASCII class邊界與quoted/unquoted讀取經23312cases三瀏覽器/native/Wasm比對通過；Rust14、tooling212、CLI34、Vite99及實際static browser通過。Tooling Wasm gzip增14360bytes，runtime engine Wasm未變。[證據](batches/0100-html-character-references.md)。目前23已修復、21未解決。

0115：Rust來源URL discovery與圖編譯resourceURLs映射完成有界驗證；56Rust/157compiler、binding17、3browser資源與126graph控制通過。既有入口60對照仍39FAIL，Node自動資源處理、references/decoded imports、診斷位置及file/project/build/CLI交付仍未完成，root gates保持FAIL。[0115](batches/0115-resource-url-ownership.md)。31fixed/13unresolved、65checked/10blocked不變；未commit/push。

0116：Node/Rust import discovery統一decoded CSS specifiers；既有file入口的escaped/encoded/query/bare local路徑與reference sourceText #截斷已修正。60Rust/167compiler/MCP34、42新browser與96local控制通過；原external60仍39FAIL。prepared reference/resource emission與file/project/build/CLI整體交付未完成，BH-0004保持未結案。31fixed/13unresolved、65checked/10blocked及root gates不變；[0116](batches/0116-node-import-discovery.md)。未commit/push。

0117：BH-0035已修復；actual VS Code缺少命令錯誤manual/settings從0/1降為0/0，registered/failing/removed controls與原設定/格式化功能通過，31tests及lint/types/full isolated buildPASS。32fixed/12unresolved；65checked/10blocked與4root gates保持。BH-0004接續0116，0038追加驗證仍暫停；未commit/push。[0117](batches/0117-vscode-settings-restart.md)。

0118：實際 source／built CLI 各18個三瀏覽器對照6PASS/12FAIL，確認外部import遭刪除、順序錯誤、巢狀條件拒絕與relative resource錯誤目錄；沿用BH-0004。已抽出Node filesystem/package graph準備流程供collection接續，167compiler/34CLI、42file browser及lint/types/build通過，兩項root API失敗hash不變。完整asset delivery仍未完成；32fixed/12unresolved、65checked/10blocked及4root gates保持。[0118](batches/0118-cli-stylesheet-delivery.md)。未commit/push，0038追加驗證仍暫停。

0119：CLI file export已接Rust graph，實際輸出相依CSS與resources；source/built各18browser全通過（原各12FAIL），reference資源、分入口native pruning與watch更新共37CLI tests通過。61Rust/168compiler/binding17、126graph與3resource browsers及lint/types/build/Clippy/codegen/parity通過。舊入口仍39FAIL，BH-0004保持部分修復；file/project/build/no-export、診斷位置、output exclusions與stale asset cleanup續作。32fixed/12unresolved、65checked/10blocked、4root gates不變；0038追加驗證仍暫停。未commit/push。[0119](batches/0119-cli-asset-delivery.md)。

本次提交整理（父提交 `927278b1c`）：僅納入 0118–0119 已完成的調查紀錄、驗證證據及 CLI 重現腳本；BH-0004 產品、測試與公開文件實作仍未提交，其他對話的 Site 變更保持原樣。證據對應各批來源雜湊所標識的工作區版本，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0119 的 55 個保留檔案雜湊全部一致；其後 0120 已修改 7 個相關來源／文件，0119 證據不代表這些新版本全部通過。0120 仍在進行：新增 layer probe 有 36 次失敗，須處理排除 native CSS 時空 import 仍宣告 layer、改變 cascade 的問題，再重跑輸出組合與 native/Wasm 驗證；0120 材料保留工作區。32 已修復／12 未解決、65 已檢查／10 受阻及 4 項 root gates 不變；0038 追加驗證仍等待明確身分確認。未推送。

0120：standalone collection 的 native／Master base／generated 與 preserveNativeCSS 共16組合已驗證；修正排除 native 後空 import 仍建立 layer 的問題，新增圖層探針由36FAIL降為0FAIL，三瀏覽器／screen-print共96PASS。63Rust／185compiler／37CLI／17binding及source、built CLI各18PASS；lint/types/build/Clippy/codegen/parity與Site prepare通過（lint 0errors/75既有warnings）。舊入口仍39FAIL，BH-0004未結案；下一批先重現資源URL改寫後的原始檔名／UTF-16診斷位置，再續既有入口與資產清理。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停保持。HEAD912a73b26；本批未提交／推送。[0120](batches/0120-standalone-output-modes.md)。

0121：BH-0004 graph 資源改寫後的 UTF-16 診斷位置、style definition 來源位置及 collection variant 檔名已修正；原7host／2Rust失敗回歸通過，擴充後194compiler／65Rust／37CLI／17binding通過，source/built診斷各4組、96output-mode與3resource browser通過。CLI首跑因與dist重建重疊而7FAIL，建置完成後37全通過；分類為排程錯誤。舊入口仍39FAIL，無range的錯誤及其他交付契約仍未完成。下一批重現資源／import移除與缺檔還原的watch恢復，續查stale sidecar清理。32fixed/12unresolved、65checked/10blocked、4root gates及0038身分暫停保持。HEAD912a73b26；未提交／推送。[0121](batches/0121-original-source-diagnostics.md)。

0122：CLI file-export watch 的缺少／刪除 import與resource恢復已修正，含新巢狀目錄與啟動缺檔共6情境；失敗期間頁面編輯在恢復後生效。43CLI／194compiler、source/built各12三瀏覽器控制及既有built export18通過；lint/types/build與Site prepare通過。移除import後不再請求資源或監看舊CSS，但stale sidecars仍在磁碟。下一批驗證發布中途寫入失敗與資產所有權／清理，不能以準備失敗恢復推論發布原子性。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停不變。HEAD912a73b26；未提交／推送。[0122](batches/0122-watch-dependency-recovery.md)。

本次依使用者要求整理提交（父提交 `912a73b26`）：僅納入 0120–0122 已完成的調查紀錄、驗證證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作仍未完成整體交付，保留未提交；其他對話的 Site 變更保持原樣。81 個來源／保留檔案雜湊與 0122 最終記錄全部一致。證據對應這些工作區版本，重現腳本仍依賴未提交來源，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0123 已開始：發布寫入失敗破壞既有 CSS，以及覆寫使用者修改的 sidecar，兩項回歸均 FAIL；其測試與證據保留工作區，下一步完成不可覆寫資產與入口切換，再驗證所有權及清理。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選及 0038 身分驗證暫停均保持；未推送。

0123：Node CLI 發布改用版本化、不可覆寫的 sidecars，完整寫好資產後才原子切換入口；原2失敗回歸、擴充9發布控制及完整52CLI通過，source/built各12發布browser、既有built export18與watch12通過。重複輸出bytes一致，寫入失敗及舊入口讀者仍可讀取原資產；lint/types/build通過。舊資產保留，所有權／清理、其他graph入口及39個legacy失敗仍未完成。下一批先驗證跨執行與多輸出資產所有權，再設計保留期限及中斷恢復，不能立即刪掉舊讀者依賴。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；本輪未提交／推送。[0123](batches/0123-immutable-cli-publication.md)。

0124：Node CLI 已加入跨執行的資產所有權、發布 journal 恢復及有期限清理；保留目前／上一版，其餘版本至少保留24小時（本輪採用已說明的預設，未收到偏好回覆）。71CLI、4個SIGKILL恢復控制、source/built各120跨程序臨界區及合計90browser對照通過，使用者修改／原有檔案、另一輸出與仍被引用的借用資產保留；lint/types/build通過。未記入journal的早期暫存檔與非協作writer等限制仍明列。下一批回到compileCSSFile／compileCSSManifestFile／compileProjectManifest及下游資產契約；最新legacy39FAIL仍未修復，不能用CLI子集結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；未提交／推送。[0124](batches/0124-cli-asset-ownership.md)。

本次依使用者要求整理提交（父提交 `74e471917`）：僅納入 0123–0124 已完成的調查、證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作與其他對話的 Site 變更保留未提交。0124 的 12 個本批來源雜湊全部一致；80 個保留來源中，77 個一致，3 個已由進行中的 0125 修改（rust-contract.ts、protocol.ts、stylesheet/index.ts）。歷史證據對應各批來源雜湊的工作區版本，腳本依賴未提交實作，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0125 已開始 manifest-only project graph：compiler 197 tests、lint/types 通過；Rust project 8 PASS／1 FAIL，失敗為 structured_project_entries_merge_in_order 的 CSS 斷言，根因尚未分類。先檢查實際 CSS 與跨入口定義覆寫，再續 native 下游及 manifest loader 驗證；0125 實作、測試與證據均留工作區。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選保持未完成；0038 追加驗證仍等待明確身分確認。未推送。

0125：Node project manifest 改以原始逐檔 import/reference graph 交由 Rust 編譯；qualified local import 內有 external CSS 時可取得定義，保留 reference 依賴與 imported source 路徑。Rust9/compiler199/binding17/CLI71/Vite106/Webpack69及實際 production manifest query 三瀏覽器18對照通過；lint/types/build/Clippy/fmt/codegen/parity通過。跨入口原1FAIL為測試預期blue而實際正規化#00f，已更正並加反向順序控制。舊public仍21PASS/39FAIL，兩root API失敗hash與5runtime/compiler artifact hash不變。下一批先重現compileManifestFileSync的qualified external路徑，核對其nativeCSS契約再續file/build/no-export交付；不能以manifest-only結果結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；本批實作未提交／推送。[0125](batches/0125-project-manifest-graphs.md)。

0126：公開compileManifestFileSync新增明確delivery overload，沿用Node/Rust graph回傳完整CSS與resource資產；呼叫端須全部發布，css/nativeCSS/generatedCSS僅代表入口。6focused與205compiler、server67/MCP34/CLI71及source/built各66三瀏覽器對照通過；compiler lint/types/build通過。未指定delivery的3qualified external案例仍拒絕，最新完整legacy仍0125的39FAIL，BH-0004未結案。API census失敗hash不變，package golden新增2個刻意公開型別差異，未改golden。下一批重現實際Vite/Webpack CSS build入口並接asset publisher；native CLI/no-export與其餘契約續作。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；未提交／推送。[0126](batches/0126-file-manifest-delivery.md)。

0127：實際Vite/Webpack static CSS build各8輸入，共16build有6FAIL；成功build的60三瀏覽器對照36PASS/24FAIL，沿用BH-0004。直接插入或hoist import各12FAIL；明確分段的既有Rust graph原型18PASS，但真實bundle的slot定位/條件與資產發布尚未實作。另確認獨立BH-0045：Vite red→blue最終CSS不同卻同hash URL，fresh3PASS/保留舊回應3FAIL。現在45歷史問題：32fixed/13unresolved；65checked/10blocked、4root gates、4候選及0038身分暫停保持。下一步先建立compiler來源/範圍感知的bundle分段，再接graph註冊與發布，同時讓最終CSS與所有HTML/JS/preload引用取得正確內容hash；不能只改名CSS。此批只新增重現/證據，產品來源未改。HEAD1c6595586，未提交/推送。[0127](batches/0127-build-publication-boundaries.md)。

本次依使用者指示整理提交（父提交 `1c6595586`）：僅納入 0125–0127 已完成的調查、證據與五個重現腳本。BH-0004 的產品／測試／公開文件、0128 BH-0045 進行中實作及其他對話的 Site 變更均保留未提交。0127 記錄的 103 個來源／保留雜湊全部一致；歷史證據依賴未提交的工作區實作，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0128 已有 Vite 110 tests、lint/types/build、7 模式 21 builds／39 browser 對照通過，已知程序均結束；尚須完成 hook 順序影響的 runtime/progressive 控制、最終原始重現、文件與批次結案，BH-0045 保持未解決。32 已修復／13 未解決、65 已檢查／10 受阻、4 root gates、4 候選與0038身分暫停均保持；未推送。
