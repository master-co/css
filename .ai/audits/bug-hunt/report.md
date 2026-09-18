# Master CSS 調查交付

- 0264：交付BH-0004 qualified import修正`fc879fad4`：展開帶`layer()`／`supports()`／media的import時，先把被匯入stylesheet頂層的`@settings`／`@theme`／`@custom-variant`／`@defaults`／`@components`／`@utilities`切出（保留copied source spans）放在wrapper之外，其餘照舊包進wrapper；無qualifier的import不走此路徑。qualified矩陣60觀察由20失敗變**0失敗**（direct-native／direct-wasm各2P/10F→12P/0F），native與Wasm一致。新增3項Rust測試；cargo fmt／clippy／**364tests**／codegen／parity、28套件build、compiler 57files/428tests、next 24files/152tests、102/107 tasks PASS；vite 23／nuxt 3／webpack 2／wasm 2在serial下與baseline逐項相同，未新增失敗；`external-import-order`不受影響（7P/13F不變）。BH-0004仍為部分修正，剩external import展開與完整graph遷移。63historical／62fixed／1unresolved。[證據](evidence/0264-final-checks.json)；[批次](batches/0264-qualified-import-definitions.md)；[前次](progress-history-0264-qualified-definitions.md)。

- 較早的交接、提交核對與歸檔指標已逐字保存於 [歷史紀錄（0254整理）](progress-history-0254-ledger-heads.md)；目前狀態以本檔最新批次與原批次為準。

起始 commit `e66ba7236`。提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。 進度與完整證據見 [README](README.md)、[coverage](coverage.md)、[findings](findings.md)。

47個歷史確認問題：41已修復、6未解決。0159修復BH-0047的pre-render manifest HMR；0157另修復BH-0046的development runtime base，詳見最新批次。0128已修復BH-0045：Vite命名前納入managed CSS，原始快取與獨立lazy CSS控制通過；詳見最新批次。以下保留修復前重現歷史；當前狀態以findings及最新批次為準。BH-0004仍部分修復；[0112](batches/0112-external-import-order.md)確認21次external hoist cascade錯誤及18次nested拒絕，完整交付仍待實作；[0113](batches/0113-stylesheet-boundaries.md)新Rust graph/renderer有108browserPASS，但既有public仍39FAIL，不能結案；[0114](batches/0114-compiled-stylesheets.md)公開graph編譯新增126browserPASS，既有file/build交付、URL base與API gates仍待完成；BH-0001已由[0109](batches/0109-animation-value-context.md)完成，原0108的5個value失敗均通過。BH-0002已由[0110](batches/0110-variable-syntax.md)修復；BH-0003亦由[0111](batches/0111-static-retention.md)完成，145Rust全通過。10blocked coverage及未分類候選仍未完成。

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

## BH-0004 · P1 · 展開 CSS import 丟失條件與 layer（部分修正）

`preserveNativeSource`已於0258隨compiler API交付。0263把低層`direct`路徑的失敗化約為單一根因：Master definition directive被包在native at-rule裡就無法lowering，而展開qualified import是文字包裹，必然把被匯入stylesheet的directive一起包進`@supports`／`@media`／`@layer`。0264交付修正：展開時先把被匯入stylesheet頂層的`@settings`／`@theme`／`@custom-variant`／`@defaults`／`@components`／`@utilities`切出wrapper並保留copied source spans，其餘照舊受qualifier約束；無qualifier的import不變。qualified flatten+compile矩陣的60個觀察由20失敗變為0失敗，`direct-native`與`direct-wasm`各從2 PASS／10 FAIL變成12 PASS／0 FAIL，兩個binding一致。仍待：`external-import-order`的外部import展開（7 PASS／13 FAIL）與nested未解析import的明確限制，以及完整public／host graph遷移。[修正與驗收](batches/0264-qualified-import-definitions.md)；[根因](batches/0263-bh-0004-contained-directives.md)。

## BH-0006 · P1 · SSR CSS 未安全嵌入 HTML

- Fixed; original details and evidence preserved verbatim in [history](report-fixed-p1-history-0183.md).

## BH-0013 · P1 · Unicode 前綴切片造成 Rust panic

- Fixed; original details and evidence preserved verbatim in [history](report-fixed-p1-history-0183.md).

## BH-0021 · P1 · Installer 破壞多行 import

- Fixed; original details and evidence preserved verbatim in [history](report-fixed-p1-history-0183.md).

## BH-0022 · P1 · Figma 無法正確匯入自己的 export

- Fixed; original details and evidence preserved verbatim in [history](report-fixed-p1-history-0183.md).

## BH-0023 · P1 · Nuxt progressive 缺少 client manifest

- Fixed; original details and evidence preserved verbatim in [history](report-fixed-p1-history-0183.md).

## BH-0029 · P1 · Rspack static managed CSS delivery (fixed)

Rspack modules still expose no source to `succeedModule`, but the usage graph rebuilds the complete module graph in `finishModules`, so the managed CSS is produced and shipped through the `@import` chain the static graph delivery emits — `.block{display:block}` lands in a chained part and every file on the chain is written to `dist/`. The original assertion only read `main.css`, which is just the 50-byte `@import` entry, and so read a normal delivery as a loss. A Webpack control matches Rspack cell for cell with and without `@preserve native`; authored native CSS requires that directive by design. The integration-lab host coverage paused with 0038 was not resumed. [Controls](batches/0261-rspack-static-delivery.md).

## BH-0051 · P1 · Next/Webpack native CSS compilation (fixed)

The top-level CSS rule disabled Next CSS support. The adapter composes the existing loader chains instead, and the repair shipped with the Next pipeline in 0258; `next-config.test.ts` now asserts the obsolete top-level rule is absent rather than requiring it. 0260 completed the outstanding host validation on the delivered tree: webpack css/scss/sass in build and dev, all three syntaxes with LightningCSS in build, and turbopack css in build — 14 runs, each Chromium and WebKit, every one `failures:0` with `cssSupportDisabled:false` and no intermittent timeout. With the 24 files/152 tests and 3 e2e from 0258 and the 15 actual-host scenarios from 0259, the listed scope is complete. [Controls](batches/0260-next-css-pipeline-closure.md).

## BH-0052 · P1 · Next/Webpack virtual URI resolution (fixed)

Three official virtual IDs bypassed resolve.alias and failed independently of CSS rules. Exact pre-resolution mapping preserves unrelated requests and user plugins;9controls,installed compiler and3browser runtime HMR pass. [Evidence](evidence/0183-next-virtual-findings.json).

## BH-0053 · P1 · Next/Turbopack Sass classification (fixed)

Raw Sass prepares before classification; 0260 re-ran the Turbopack controls on the delivered tree — scss in dev and build, a partial, and partial plus recovery — all Chromium and WebKit PASS. 0262 resolved the two counterexamples that trailed this row as boundaries outside Master: with `preserveNativeSource` the compiler hands over every per-selector anchor (10 PASS/0 FAIL, up from 6/4), but the installed Next `CssMinimizerPlugin.optimizeAsset` returns 6/4 for both settings, so the residual provenance loss is the minimizer; and the Turbopack persistent-cache publication failure reproduces verbatim with a pure Next loader that never loads Master. Native declaration granularity and the full Sass option/host boundaries move to the PKG-next coverage row. [Boundaries](batches/0262-selector-maps-and-cache-boundaries.md); [Controls](batches/0260-next-css-pipeline-closure.md).

## BH-0054 · P1 · Turbopack CSS Module exports (fixed)

Forcing general CSS type/output produced empty class exports even for pure CSS. Both css-module type and *.module.css suffix are required; type-only repair failed actual browsers. Working-tree CSS/SCSS/Sass dev/build and isolated CSS dev/build pass in Chromium, Firefox and WebKit. Isolated repair excludes unfinished Sass/Webpack/compiler changes and reuses existing workspace dependencies. [Evidence](evidence/0183-next-raw-turbo-module-discovery.json).

## BH-0055 · P1 · Entry reference metadata lost during expansion (fixed)

Pure CSS exposed the same loss as Sass. Next now renders original prepared input; compiler retains references through graph expansion and stylesheet collection registration/composition. Production initially failed in onBuildComplete, then passed after fixing the shared collection path. [Evidence](evidence/0183-next-source-offset-findings.json).

## BH-0056 · P1 · Rendered compose rules omitted (fixed)

Renderer received parser nativeCSS alone, dropping lowered compose rules. Rendering finalized CSS preserves both without duplication or exporting reference-only definitions. Compiler controls and actual Next dev/production pass. [Evidence](evidence/0183-next-source-offset-findings.json).

## BH-0057 · P1 · 原生條件內 compose 與直接輸出順序

已修復。Rust保留條件與匿名layer內的輸出位置；Node、universal native/Wasm、Rust project與mcss使用完整css，metadata維持獨立視圖。106compiler／14project+CLI Rust tests及180browser、原生CLI3、Next6驗證通過。Qualified child managed imports仍屬BH-0004，compiler全套311PASS/1FAIL保留。[0185證據](evidence/0185-final-checks.json)；[原始報告](progress-history-0185-ordered.md)。0187再修復graph native suppression丟失條件／匿名layer，18browserPASS；[補充證據](evidence/0187-suppression-finding.json)。

## BH-0058 · P2 · Graph compose marker 誤改作者字串

已修復。原先 raw replacen 選中字串內的 marker，將 composed CSS 寫入 content 並漏掉實際規則；改由 Rust lexer 定位真實 at-rule。Native/Wasm graph 修前6個browserFAIL，修後含原生／direct控制15PASS。[0187證據](evidence/0187-marker-finding.json)。

## BH-0063 · P1 · Turbopack Module 引用 global animation 失效（已修復）

`.module.css`中的`animation:fade`（preset animation）在Turbopack＋Master下被CSS Modules作用域化為`card_fade__…`，最終CSS沒有`@keyframes fade`，Chromium／WebKit的`getAnimations()`皆無frames；Webpack＋Master同一fixture正常。已修復並於0258交付（`5810c71ed`）：`nextGeneratedGlobalAnimations`從Master generatedCSS取出preset keyframes名稱，Turbopack無host PostCSS分支以`globalAnimations`建立module graph，讓`:local(fade)`還原為global `fade`並交付`@keyframes fade`；作者自訂`@keyframes`仍維持Module作用域。主工作樹實際host雙bundler雙瀏覽器PASS，`packages/next` 24files／152tests與3e2e PASS。[交付與驗證](batches/0258-promote-next-candidate.md)；[原始對照](batches/0255-next-turbopack-postcss-characterization.md)。

## BH-0062 · P1 · Stylesheet compile 對規則數二次成長（fixed）

[crates/mastercss-compiler/src/variant.rs:290](/Users/aron/master/css/crates/mastercss-compiler/src/variant.rs:290)、[output_mappings.rs:56](/Users/aron/master/css/crates/mastercss-compiler/src/output_mappings.rs:56)。`byte_offset_for_location`／`source_location`／`byte_to_utf16_offset`每次從來源開頭掃描，mapping與每條規則各呼叫多次；純CSS 200／400／800規則的rendered compile為109／387／1450ms，`preserveNativeSource`在800規則達72.5s，profile 90%在native binding。0251已修復：`source_index.rs`每來源一次的line-start／UTF-16索引供mapping anchor與native lowering共用；HEAD基準4000規則84.6s→1.05s，0242候選patch使preserveNativeSource 72.5s→96ms。[量測與profile](batches/0250-compiler-rule-count-scaling.md)。 [修復](batches/0251-compiler-source-index.md)。

## 已修復 P2 段落（逐字歸檔）

以下段落原文逐字保存於 [fixed P2 history](report-fixed-p2-history-0183.md)：BH-0001 · P2 · CSS 字串與註解被當成動畫宣告；BH-0003 · P2 · static token 的依賴未保留；BH-0005 · P2 · SSR 未解碼 numeric HTML references；BH-0007 · P2 · 無 class 的 HTML 缺 static 初始資源；BH-0008 · P2 · 嚴格 CSP 下 external hydration 啟動失敗；BH-0009 · P2 · iframe root 漏掉 class mutation；BH-0010 · P2 · HTML extraction 未解 character references；BH-0011 · P2 · Svelte else 分支未提取；BH-0012 · P2 · scanModule 漏收 .mjs；BH-0014 · P2 · 跳脫字元後 semantic token 範圍偏移。

## BH-0015 · P2 · 合法 Unicode escape 被 ESLint 誤報（部分修復）

0102已將JavaScript cooked字串送入Rust lint並對映來源範圍；Vue同時包含HTML entity時仍缺外層對映。完整plugin269PASS/2FAIL；已阻止已知錯誤範圍的autofix，但仍須恢復精確診斷及正確修正，不可標完成。[進度與下一步](batches/0102-eslint-javascript-escapes.md)。

[packages/eslint-plugin/src/utils/resolve-class-node.ts:89](/Users/aron/master/css/packages/eslint-plugin/src/utils/resolve-class-node.ts:89)。clsx 字串以 Unicode escape 表示 block；應認得合法 class，實際 raw 字串被當成 unknown。

修正方向：用 cooked 值解析語意，同時維持 raw offset 以安全修正。 [重現與證據](batches/0017-eslint-adapters.md)。

## BH-0016 · P2 · Vite 巢狀 HTML hydration URL 錯誤

已修復；原始報告逐字保留於 [P2 歷史](report-fixed-p2-history-0183.md)。

## BH-0017 · P2 · Webpack 巢狀 HTML runtime URL 錯誤

已修復；原始報告逐字保留於 [P2 歷史](report-fixed-p2-history-0183.md)。

## BH-0018 · P2 · Node/native CLI 預設 discovery 漏掉 .mjs

已修復；原始報告逐字保留於 [P2 歷史](report-fixed-p2-history-0183.md)。

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

## BH-0032 · P2 · Benchmark 未交付必要 Wasm (fixed0169)

[benchmarks/shared/browser-lifecycle.ts:642](/Users/aron/master/css/benchmarks/shared/browser-lifecycle.ts:642)。lifecycle頁面只複製runtime JS與manifest，Wasm請求404導致初始載入測量逾時。一次性輸出加入套件既有sidecar後正常啟動。

修正方向：交付並統計sidecar。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0075原始delivery-mode報告亦在runtime頁面失敗，補sidecar控制恢復啟動。[Delivery證據](batches/0075-master-delivery-modes.md)。

## BH-0036 · P2 · Nuxt runtime 未編譯 theme 樣式

[packages/nuxt/src/module.ts:284](/Users/aron/master/css/packages/nuxt/src/module.ts:284) 關閉整個 Vite adapter；其 stylesheet 編譯因此未執行。實際 Nuxt runtime dev 頁面保留 raw `@theme`，`--color-host` 沒有定義，但 runtime 根據 emittedGlobals 略過該變數輸出，`fg:host` 與 native component 都顯示黑色。冷載入相同；測試頁補上原生變數後立即恢復預期 #123456。

修正方向：Nuxt 接管 runtime 注入時仍保留 stylesheet 編譯。原始 theme HMR 受阻，native CSS 控制組不代表原始 fixture 通過。[重現與證據](batches/0060-nuxt-dev-hmr.md)。

## BH-0038 · P2 · Startup benchmark 匯入 CLI 執行入口即退出 (fixed0175)

[benchmarks/shared/startup-diagnostics.ts:218](/Users/aron/master/css/benchmarks/shared/startup-diagnostics.ts:218)。將可執行bin當被動模組匯入；無subcommand令Commander退出1，第一個variant即失敗，沒有診斷報告。同一bin的正常generate命令及core被動匯入皆通過。

修正方向：被動import量測使用不執行CLI的入口，bin維持完整command量測。[證據](batches/0066-startup-diagnostics.md)。

## BH-0048 / BH-0049 · P2 · Runtime startup and Webpack HMR delivery (fixed)

Serialized starts fix shared/Next/Webpack pending-runtime ownership. Direct import.meta.webpackHot fixes the delivered Webpack CommonJS-wrapper HMR failure. Next68+3e2e/Webpack74 and6actual-host browsercontrolsPASS; earlier shared156browser evidence remains scoped to unchanged sources. [Evidence and limits](evidence/0183-runtime-hosts-findings.json).

## BH-0050 · P2 · Separate HMR updates restore stale runtime inputs (fixed)

Latest manifest and emittedGlobals are retained independently.6newcontrols/168Vitebrowser observationsPASS;original6build-watch failures remain. [Evidence and scope](evidence/0183-runtime-inputs-finding.json).

## BH-0002 · P3 · raw var() 空白漏掉依賴

[crates/mastercss-engine/src/stylesheet_resources.rs:54](/Users/aron/master/css/crates/mastercss-engine/src/stylesheet_resources.rs:54)。直接交 raw stylesheet，var() 名稱前使用 tab 等 CSS whitespace；應保留變數，實際漏收。Compiler 正規化路徑已排除。

修正方向：依 CSS whitespace/token 規則辨識 var()。 [重現與證據](batches/0002-stylesheet-resources.md)。

## BH-0020 · P3 · MCP preview bytes 使用 UTF-16 長度

[packages/mcp/src/context.ts:184](/Users/aron/master/css/packages/mcp/src/context.ts:184)。Preview 含非 ASCII；應回報 UTF-8 bytes，實際用 .length，大小 metadata 錯誤。內容及 hash 正確。

修正方向：使用 Buffer.byteLength(text, 'utf8') 並同步統計。 [重現與證據](batches/0030-mcp-contracts.md)。

## BH-0027 · P3 · Webpack 範例請求不存在的 script

[examples/webpack/src/index.html:6](/Users/aron/master/css/examples/webpack/src/index.html:6)。模板手寫 `./index.js`，實際輸出 `main.js`，瀏覽器收到404與console error。自動注入的main/runtime與CSS仍正常，未造成整頁失效。

修正方向：移除多餘 script，由 HtmlWebpackPlugin 注入。[重現與證據](batches/0049-webpack-example-asset.md)。

## BH-0033 · P3 · Benchmark runtime 指標錯報零 (fixed0170–0171)

[benchmarks/shared/browser-lifecycle-page.ts:251](/Users/aron/master/css/benchmarks/shared/browser-lifecycle-page.ts:251)。讀取全域facade不再提供的欄位；公開snapshot有46規則／1904bytes，benchmark卻報0。

修正方向：使用公開snapshot。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0076共享diagnostic reader把已採用progressive及1940bytes錯報0，46個class records全部報缺失。[Progressive證據](batches/0076-progressive-diagnostics.md)。

## BH-0034 · P3 · Benchmark 漏計 CSSStyleRule (fixed0172)

[benchmarks/shared/browser-lifecycle-page.ts:288](/Users/aron/master/css/benchmarks/shared/browser-lifecycle-page.ts:288)。CSSStyleRule具有空cssRules時，遞迴計數略過自身。新增有效原生規則仍回報0→0。

修正方向：計入樣式規則自身並另行遍歷巢狀規則。[Lifecycle證據](batches/0055-browser-lifecycle-metrics.md)；0076同根因把實際46CSSStyleRules計成0。[Progressive證據](batches/0076-progressive-diagnostics.md)。

## BH-0035 · P3 · VS Code 設定更新產生未處理的 ESLint 命令錯誤

[packages/vscode/src/extension.min.ts:423](/Users/aron/master/css/packages/vscode/src/extension.min.ts:423)。未安裝 ESLint 時更改 Master CSS 設定，無條件呼叫不存在的 `eslint.restart` 且未處理 promise，extension host 記錄未處理拒絕。相同 host 的手動 Master CSS 重啟會檢查命令是否存在，沒有此錯誤；hover及設定功能仍正常。

0117已修復：沿用已檢查可選命令的重啟路徑並處理設定事件的拒絕；實際VS Code與31tests通過。[修復證據](batches/0117-vscode-settings-restart.md)，[原始重現](batches/0059-vscode-settings.md)。

## BH-0037 · P3 · Compiler/extraction diagnostics 分階段指標未量測 (fixed0179)

[benchmarks/shared/compiler-diagnostics.ts:326](/Users/aron/master/css/benchmarks/shared/compiler-diagnostics.ts:326)。報告宣告136個指標，實際四fixture各只有17個；119個lowering/manifest等指標完全沒有樣本，原始碼未接上階段量測。現有CSS hash/marker檢查通過，缺值未被填成0。

Extraction亦有15個未量測IDs，兩次完整compose卻標為engine建立／規則生成，不能用作單次render的分階段成本。修正方向：讓診斷契約符合實際量測，或接上正確擁有者的階段量測。[Compiler證據](batches/0064-compiler-diagnostics.md)、[extraction證據](batches/0065-extraction-diagnostics.md)。

0179改為30個實際公開操作／大小／計數指標，101tests、8variant／240samples與4report讀取端通過；首次／重複compose及修前CSS一致。未宣稱Rust內部分解已提供，完整benchmark覆蓋仍未完成。[驗證與限制](batches/0179-diagnostic-phases.md)。

## BH-0039 · P3 · CSS structure benchmark 高估選擇器 specificity (fixed0177)

[benchmarks/shared/css-structure.ts:354](/Users/aron/master/css/benchmarks/shared/css-structure.ts:354)。Universal誤加type權重，:is/:not/:has誤加pseudo-class自身權重；四個標準案例分別多1或10分。普通選擇器與Chromium實際cascade控制通過，問題僅在benchmark指標。

修正方向：依標準特殊偽類與universal規則計算。[證據](batches/0069-css-structure.md)。

Fixed0177: tuple comparison and selector-specific/nesting rules;83tests and16original report variants PASS. Browser controls59of60agree;independent pureHTML isolatesWebKit namespace differences,retained as a validation limitation. [Repair](batches/0177-benchmark-specificity.md).

## BH-0040 · P3 · Docs CSS size 將404HTML計為CSS (fixed0178)

[benchmarks/docs-page-css-size/shared.ts:166](/Users/aron/master/css/benchmarks/docs-page-css-size/shared.ts:166)。404被排除於失敗判定，錯誤頁body仍被計成CSS且未保留狀態。實際HTTP控制中1079bytes HTML被報為CSS，Chromium沒有套用任何規則；200CSS及500拒絕控制正常。

修正方向：排除或明確標記失敗資源，避免誤計HTML。[證據](batches/0071-docs-css-size.md)。

Fixed0178: strict complete resource collection withstatus/MIME checks,URL body-failure diagnostics andobserved metadata.98tests,21HTTP/24browser controls and8originalpages/45assets PASS. [Repair](batches/0178-docs-css-resources.md).

## BH-0041 · P3 · Vite benchmark 誤報已掃描來源數 (fixed0176)

[benchmarks/shared/build-diagnostics.ts:242](/Users/aron/master/css/benchmarks/shared/build-diagnostics.ts:242)。Build/startup以hook次數當檔案數，包含被略過的virtual/CSS及重複HTML；實測報6，實際為2個檔案／3次scan。觀察前後CSS雜湊一致。

修正方向：計算符合定義的實際來源數，或使用準確的callback計數名稱。[證據](batches/0072-vite-scan-counts.md)。 Fixed0176: actual completed nonempty scans, normalized-path deduplication and source artifacts; environment hook wrappers keep plugin identity. Four CSS comparisons,12scanner controls and16report variants/404samples PASS. [Repair evidence](batches/0176-benchmark-vite-observation.md).

## BH-0042 · P3 · Benchmark 陣列參數處理錯誤 (fixed0173)

[benchmarks/shared/interaction-cost-harness.ts:129](/Users/aron/master/css/benchmarks/shared/interaction-cost-harness.ts:129)。公開API接收一個class陣列，包裝器卻以參數數量計class；三個class新增／刪除各只計1。延後與抑制刪除策略在flush使用apply(runtime,names)，把陣列拆成多參數；回報已處理3個，實際3個規則全留下。相同陣列的baseline刪除正常。

修正方向：計算陣列元素並以單一陣列轉送刪除。[Wrapper證據](batches/0078-interaction-array-contract.md)；0079原始preseed的spread呼叫也未建立兩個指定class，正確陣列控制均建立。[Preseed證據](batches/0079-runtime-mutation-diagnostics.md)。

## BH-0043 · P3 · Benchmark 清理情境誤報樣式驗證成功 (fixed0174)

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

- 0064–0179 的逐批進度、提交交接與更早的歸檔指標逐字移至 [歷史進度（0259整理）](report-history-0259.md)；目前狀態以上方段落與最新批次為準。
