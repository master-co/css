# 帳本完整進度：0207 交接點

本表彙整目前帳本，不代表重新驗證所有歷史結論。已檢查僅限原列出的行為；受阻仍屬未完成。持續目標 active，未新增 commit。

| 統計 | 進度 |
|---|---|
| 歷史確認問題 | 61：57 已修復／4 未完成 |
| 覆蓋單位 | 75：65 已檢查／10 受阻 |
| 最新批次 | 0207：Webpack production static watch 缺檔恢復與相依清理已交付 |
| 最新驗證 | 29 watch、63 三瀏覽器輸出、lint／types／外部型別／範例 build 通過；交付後 2 regressions／9 watch 通過 |
| 既有測試限制 | 隔離副本含待核准 patch 時 80 tests 通過；根目錄既有 Webpack 測試未改，不宣稱完整套件測試已通過 |
| 上一項明確授權 | LSP 一行診斷預期修正已於 0203 套用並驗證；與 Webpack 待核准 patch 不同 |

## 所有問題

詳細證據及各問題原始批次見 [問題索引](findings.md)。

| ID | 嚴重度 | 目前狀態 | 問題 |
|---|---|---|---|
| BH-0001 | P2 | 已修復 | CSS 字串／註解誤作動畫定義或宣告，遺漏／多產 keyframes |
| BH-0002 | P3 | 已修復 | raw stylesheet var() 空白、註解、跳脫與名稱邊界漏掉／誤收依賴 |
| BH-0003 | P2 | 已修復 | static token 初始化與最後class刪除後遺失動態／transitive依賴 |
| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 |
| BH-0005 | P2 | 已修復 | numeric HTML references 未 decode，SSR class 與瀏覽器不同 |
| BH-0006 | P1 | 已修復 | encoded class 經 SSR style 注入變成可執行 script |
| BH-0007 | P2 | 已修復 | HTML 無 class 屬性時完全遺漏 static theme/keyframe 初始資源 |
| BH-0008 | P2 | 已修復 | external hydration 使用 Function，CSP 禁止 unsafe-eval 時 runtime 啟動失敗 |
| BH-0009 | P2 | 已修復 | iframe Document root 元素跨 realm，漏掉 class mutation |
| BH-0010 | P2 | 已修復 | Rust HTML source extraction 未解碼 class character references |
| BH-0011 | P2 | 已修復 | Svelte 提取略過 else 分支，static CSS 漏收 |
| BH-0012 | P2 | 已修復 | scanModule 缺少 .mjs 支援，原生 ESM class 不產生 CSS |
| BH-0013 | P1 | 已修復 | 語言分析 512-byte 前綴切入 Unicode 字元而 panic |
| BH-0014 | P2 | 已修復 | 解码後 token 長度直接用作原始語意範圍，跳脫引號後高亮偏移 |
| BH-0015 | P2 | 已修復 | ESLint 未解碼 JS Unicode escape，把合法 block 誤報 unknown |
| BH-0016 | P2 | 已修復 | Vite relative base 巢狀 HTML 的 hydration JSON URL 指向錯誤路徑 |
| BH-0017 | P2 | 已修復 | Webpack relative publicPath 的巢狀 HTML 注入不存在的 runtime URL |
| BH-0018 | P2 | 已修復 | Node/native CLI 預設 source discovery 漏掉 .mjs |
| BH-0019 | P2 | 已修復 | CLI watch 只監看啟動時已有檔案，新增頁面漏產 CSS |
| BH-0020 | P3 | 已修復 | MCP preview/format/render與Rust inspection bytes以UTF-16長度計算，Unicode大小錯誤 |
| BH-0021 | P1 | 已修復 | create installer 在多行 import 中間插入新 import，破壞既有設定語法 |
| BH-0022 | P1 | 已修復 | Figma importer 把自身 exporter 的 definitions array 當作巢狀物件，寫入錯誤變數名稱 |
| BH-0023 | P1 | 已修復 | Nuxt progressive 未發布 client manifest，JSON 請求回傳 HTML，hydration/runtime 啟動失敗 |
| BH-0024 | P2 | 已修復 | Angular Express5 無名 wildcard 路由註冊即拋錯 |
| BH-0025 | P2 | 已修復 | Angular SSR 打包搬移 css-tree 相對資料 require，啟動缺少 patch.json |
| BH-0026 | P2 | 已修復 | CLI generate --binding wasm 被忽略，仍建立 native scanner |
| BH-0027 | P3 | 已修復 | Webpack example 多餘 index.js 請求404；main/runtime正常 |
| BH-0028 | P2 | 已修復 | ESLint 現代範例 CSS 使用不支援的 $variable，規則載入失敗 |
| BH-0029 | P1 | 已確認 | Rspack succeedModule 無 source，static 模式漏掉所有 managed CSS |
| BH-0030 | P2 | 已修復 | Webpack 固定 output.filename 與自動 runtime entry 衝突，playground 無法 build |
| BH-0031 | P2 | 已修復 | MCP 並行套用預覽重複接受 token，重疊檔案更新略過 stale-hash 保護 |
| BH-0032 | P2 | 已修復 | Browser lifecycle/delivery benchmark 未複製 Wasm sidecar，runtime 頁面無法啟動 |
| BH-0033 | P3 | 已修復 | Benchmark 讀取已移除的 global runtime 欄位，規則數／CSS bytes 錯報零 |
| BH-0034 | P3 | 已修復 | Benchmark 把帶空 cssRules 的 CSSStyleRule 當群組，漏計原生樣式規則 |
| BH-0035 | P3 | 已修復 | VS Code 設定更新無條件呼叫可選的 eslint.restart，未安裝 ESLint 時產生未處理拒絕 |
| BH-0036 | P2 | 已修復 | Nuxt runtime 關閉 Vite stylesheet 編譯，raw @theme 未輸出變數但 runtime 視為已輸出 |
| BH-0037 | P3 | 已修復 | Compiler/extraction diagnostics 宣告未量測階段指標，119／15個 IDs 無樣本，compose 被標為較窄引擎階段 |
| BH-0038 | P2 | 已修復 | Startup benchmark 被動匯入 CLI bin，參數解析直接退出，第一個 variant 中止且無報告 |
| BH-0039 | P3 | 已修復 | CSS structure benchmark 高估 universal 與 :is/:not/:has specificity，四個標準案例錯誤 |
| BH-0040 | P3 | 已修復 | Docs CSS size collector 接受404HTML錯誤頁並計入CSS大小，省略失敗狀態 |
| BH-0041 | P3 | 已修復 | Vite build/startup diagnostics 將略過及重複hook計為已掃描檔案，6callback實為2files/3scans |
| BH-0042 | P3 | 已修復 | Benchmark 沿用多參數 class API，陣列計數少算且延後刪除 flush 假成功 |
| BH-0043 | P3 | 已修復 | Benchmark 清理情境寫死樣式驗證成功，CSS 失效仍回報通過 |
| BH-0044 | P2 | 已修復 | Angular browser build 未附帶 runtime Wasm sidecar |
| BH-0045 | P2 | 已修復 | Vite 在產生hash檔名後替換CSS placeholder，內容變更仍使用同一URL，快取可交付舊樣式 |
| BH-0046 | P2 | 已修復 | Vite dev runtime及preload忽略base，runtime／progressive的非根目錄頁面bootstrap404 |
| BH-0047 | P2 | 已修復 | Vite pre-render開發模式更新manifest後，頁面保留舊SSR樣式 |
| BH-0048 | P2 | 已修復 | Runtime初始化期間HMR將共用instance過早dispose，留下空CSSOM |
| BH-0049 | P2 | 已修復 | Webpack套件建置把module.hot包入私有CommonJS wrapper，交付runtime收不到HMR |
| BH-0050 | P2 | 已修復 | Manifest／emittedGlobals分別HMR時復原另一個舊輸入，樣式倒退或重複全域變數 |
| BH-0051 | P1 | 已確認 | Next --webpack 頂層CSS rule移除原生CSS loaders，CSS被當JS解析 |
| BH-0052 | P1 | 已修復 | Next/Webpack 三個 virtual URI 繞過 alias，無法編譯 runtime |
| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 |
| BH-0054 | P1 | 已修正 | Next/Turbopack 強制一般 CSS，CSS Module class 匯出為空 |
| BH-0055 | P1 | 已修復 | Next 入口及collection展開時丟失reference，引用自訂class無法編譯 |
| BH-0056 | P1 | 已修復 | compileRenderedStylesheet 遺漏lowered compose規則 |
| BH-0057 | P1 | 已修復 | 原生條件內compose、直接順序與匿名layer統一由Rust結構化輸出處理 |
| BH-0058 | P2 | 已修復 | Graph compose marker替換誤改作者字串並漏輸出樣式 |
| BH-0059 | P2 | 已修復 | compiler診斷與MCP預設glob漏.mjs，遺漏CSS／class trace |
| BH-0060 | P2 | 已修復 | 多檔診斷與MCP trace將class／警告錯指其他來源 |
| BH-0061 | P2 | 已修復 | 發布宣告引用缺失或未公開的型別路徑 |

## 所有覆蓋單位

每個單位已驗證的行為、限制及證據見 [覆蓋清單](coverage.md)。以下「已檢查」不等於所有入口、平台或環境皆已完成。

| 單位 | 位置 | 風險 | 覆蓋狀態 |
|---|---|---|---|
| PKG-astro | `packages/astro` | 中 | 已檢查 |
| PKG-binding | `packages/binding` | 高 | 已檢查 |
| PKG-binding-darwin-arm64 | `packages/binding-darwin-arm64` | 高 | 已檢查 |
| PKG-binding-darwin-x64 | `packages/binding-darwin-x64` | 高 | 受阻 |
| PKG-binding-linux-arm64-gnu | `packages/binding-linux-arm64-gnu` | 高 | 受阻 |
| PKG-binding-linux-arm64-musl | `packages/binding-linux-arm64-musl` | 高 | 受阻 |
| PKG-binding-linux-x64-gnu | `packages/binding-linux-x64-gnu` | 高 | 受阻 |
| PKG-binding-linux-x64-musl | `packages/binding-linux-x64-musl` | 高 | 受阻 |
| PKG-binding-wasm-compiler | `packages/binding-wasm-compiler` | 高 | 已檢查 |
| PKG-binding-wasm-engine | `packages/binding-wasm-engine` | 高 | 已檢查 |
| PKG-binding-wasm-tooling | `packages/binding-wasm-tooling` | 高 | 已檢查 |
| PKG-binding-win32-arm64-msvc | `packages/binding-win32-arm64-msvc` | 高 | 受阻 |
| PKG-binding-win32-x64-msvc | `packages/binding-win32-x64-msvc` | 高 | 受阻 |
| PKG-cli | `packages/cli` | 中 | 已檢查 |
| PKG-compiler | `packages/compiler` | 高 | 已檢查 |
| PKG-create | `packages/create` | 中 | 已檢查 |
| PKG-css | `packages/css` | 高 | 已檢查 |
| PKG-css-sv | `packages/css-sv` | 中 | 已檢查 |
| PKG-eslint-config | `packages/eslint-config` | 中 | 已檢查 |
| PKG-eslint-plugin | `packages/eslint-plugin` | 高 | 已檢查 |
| PKG-figma | `packages/figma` | 中 | 已檢查 |
| PKG-internal | `packages/internal` | 高 | 已檢查 |
| PKG-language-server | `packages/language-server` | 高 | 已檢查 |
| PKG-language-service | `packages/language-service` | 高 | 已檢查 |
| PKG-mcp | `packages/mcp` | 中 | 已檢查 |
| PKG-next | `packages/next` | 中 | 已檢查 |
| PKG-nuxt | `packages/nuxt` | 中 | 已檢查 |
| PKG-preset | `packages/preset` | 高 | 已檢查 |
| PKG-runtime | `packages/runtime` | 高 | 已檢查 |
| PKG-schema | `packages/schema` | 高 | 已檢查 |
| PKG-server | `packages/server` | 高 | 已檢查 |
| PKG-svelte | `packages/svelte` | 中 | 已檢查 |
| PKG-tooling | `packages/tooling` | 高 | 已檢查 |
| PKG-vite | `packages/vite` | 中 | 已檢查 |
| PKG-vscode | `packages/vscode` | 中 | 已檢查 |
| PKG-webpack | `packages/webpack` | 高 | 已檢查 |
| CRATE-mastercss-binding-native | `crates/mastercss-binding-native` | 高 | 已檢查 |
| CRATE-mastercss-binding-wasm-compiler | `crates/mastercss-binding-wasm-compiler` | 高 | 已檢查 |
| CRATE-mastercss-binding-wasm-engine | `crates/mastercss-binding-wasm-engine` | 高 | 已檢查 |
| CRATE-mastercss-binding-wasm-tooling | `crates/mastercss-binding-wasm-tooling` | 高 | 已檢查 |
| CRATE-mastercss-cli | `crates/mastercss-cli` | 高 | 已檢查 |
| CRATE-mastercss-compiler | `crates/mastercss-compiler` | 高 | 已檢查 |
| CRATE-mastercss-diagnostics | `crates/mastercss-diagnostics` | 高 | 已檢查 |
| CRATE-mastercss-engine | `crates/mastercss-engine` | 高 | 已檢查 |
| CRATE-mastercss-language | `crates/mastercss-language` | 高 | 已檢查 |
| CRATE-mastercss-lexer | `crates/mastercss-lexer` | 高 | 已檢查 |
| CRATE-mastercss-lint | `crates/mastercss-lint` | 高 | 已檢查 |
| CRATE-mastercss-project | `crates/mastercss-project` | 高 | 已檢查 |
| CRATE-mastercss-render | `crates/mastercss-render` | 高 | 已檢查 |
| CRATE-mastercss-scanner | `crates/mastercss-scanner` | 高 | 已檢查 |
| CRATE-mastercss-schema | `crates/mastercss-schema` | 高 | 已檢查 |
| CRATE-mastercss-source | `crates/mastercss-source` | 高 | 已檢查 |
| CRATE-mastercss-validator | `crates/mastercss-validator` | 高 | 已檢查 |
| CRATE-xtask | `crates/xtask` | 高 | 已檢查 |
| EX-angular | `examples/angular` | 中 | 已檢查 |
| EX-astro | `examples/astro` | 中 | 已檢查 |
| EX-blank | `examples/blank` | 中 | 已檢查 |
| EX-eslint | `examples/eslint` | 中 | 已檢查 |
| EX-eslint-legacy | `examples/eslint-legacy` | 中 | 已檢查 |
| EX-integration-lab | `examples/integration-lab` | 中 | 受阻 |
| EX-laravel | `examples/laravel` | 中 | 已檢查 |
| EX-lit | `examples/lit` | 中 | 已檢查 |
| EX-next.js | `examples/next.js` | 中 | 已檢查 |
| EX-nuxt.js | `examples/nuxt.js` | 中 | 已檢查 |
| EX-react | `examples/react` | 中 | 已檢查 |
| EX-svelte | `examples/svelte` | 中 | 已檢查 |
| EX-vite | `examples/vite` | 中 | 已檢查 |
| EX-webpack | `examples/webpack` | 中 | 已檢查 |
| SITE-main | `site` | 高 | 已檢查 |
| SUP-internal-workspace | `internal (submodule)` | 中 | 已檢查 |
| SUP-benchmarks | `benchmarks` | 中 | 受阻 |
| SUP-root | `root scripts/config` | 中 | 已檢查 |
| SUP-shared | `shared` | 中 | 已檢查 |
| SUP-parity | `parity + codegen/migration evidence` | 高 | 已檢查 |
| SUP-nested-hosts | `nested playground/fixtures` | 中 | 受阻 |

## 仍須完成的工作

| 項目 | 已有進度／剩餘工作 |
|---|---|
| BH-0004 | Node rendered／部分 CLI、Vite 與 Webpack static 已修；raw native/Wasm qualified 20 FAIL、原 external 39 FAIL 仍在，完整 public／host graph 遷移待完成 |
| BH-0029 | Rspack static CSS 遺漏；0038 追加 Rspack／Rsbuild／integration-lab browser／SSR 仍等待使用者明確確認身分驗證通過 |
| BH-0051 | Next/Webpack 管線部分修正；完整主機邊界及偶發 Sass mount／HMR timeout 待處理 |
| BH-0053 | Sass 原始位置、partial reference／恢復及部分 mappings 已驗；分離資產 maps、細部宣告 anchor、完整選項／主機／static／SSR 待完成 |
| Webpack／Next graph 交付 | 下一批先多入口／lazy entry、閒置資產裁剪及並行資源寫入；再 local compose／Modules／maps／Sass／custom resolver／development／HMR／Next 實際交付 |
| Vite 錯誤恢復 | 0195：42 PASS／23 FAIL；包含 20 個擴充 setup cleanup、原 config cleanup 與 2 個自訂 filter。純 Vite native watcher 初始建立限制另列，不能當產品修復 |
| 完整主機矩陣 | graph／watch／recovery／base／assets／renderBuiltUrl／SSR／Nuxt 等尚未全覆蓋；成功的局部矩陣不能外推 |
| 四項 root gates | API census、package API golden、runtime-size baseline、歷史 extraction 遷移仍未完成 |
| 測試契約與隔離 | Webpack 既有 2 個 watch 測試與 mock 的 patch 待授權；正式平行測試的 shared-dist 隔離仍待完成；compiler-Wasm 原 exact-result 測試仍因既有 sourceMappings 為 3 PASS／1 FAIL |
| Sass 環境 | compiler 預設 415 PASS／1 個缺 Sass 環境失敗；程序提供已安裝 Sass 後 416 PASS。正式可攜環境配置仍未完成 |
| Native 關閉與瀏覽器差異 | Vite immediate-close native async handle 關閉；WebKit 26.6 namespace universal cascade 差異仍待處理 |
| 平台 | Darwin x64、4 個 Linux、2 個 Windows target 的實際主機／binary／target std 證據仍不足 |
| Benchmark／nested hosts | 完整矩陣、可靠長時段／history／owner Rust profiling 及巢狀主機前置條件仍未完成 |
| Site | 其他工作更新後的完整重驗仍待完成；既有 Site 變更已保留 |

完整繼承的 21 條未完成要求及本批保存核對見 [0207 final checks](evidence/0207-final-checks.json)。原始失敗與測試腳本修正均留證；[0207 批次](batches/0207-webpack-watch-recovery.md) 提供直接接續命令及產物備份注意事項。
