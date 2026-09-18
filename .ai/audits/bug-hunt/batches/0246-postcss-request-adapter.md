# Batch 0246: Request-local native PostCSS adapter

## 目前交接點

0245是progress：27組lifecycle與62browser觀察建立了符合native順序的hook後差集位置，同時確認global刪改會讓context過期。本批依此建立新owned Next副本`tmp/0246-postcss-request-adapter/packages/next`，compiler link使用0244 API；原Next候選54source／64dist及其0242 compiler link保持不變。

新副本只修改`src/webpack-postcss-loader.ts`，新增`src/postcss-request-plugins.ts`與`tests/bug-hunt-postcss-request-plugins.test.ts`。正式root產品、既有測試／fixtures、Site、依賴／lockfile、CI／release與HEAD／空index未變。0038仍暫停，無commit／promotion。

## 已實作的adapter機制

- Dispatcher只在內部metadata帶有resource hook時，委派原本的options.postcss factory，再以其postcss建立request-local processor；保留factory receiver、參數、其餘設定與回傳欄位。沒有改共享processor.plugins或使用者plugin物件；沒有hook的原生路徑仍委派原options物件。
- 包裝normalized plugin的Once／OnceExit／RootExit，在使用者callback成功結束後呼叫resource hook，並在必要位置追加bridge；保留其他visitor的原生dirty traversal，不重跑Once或整套plugins。
- prepare仍由PostCSS每Result執行一次，使用native的合併規則；普通Once保留原plugin receiver，prepare產生的Once使用該Result的merged receiver，其餘visitors保持unbound。filtered visitor同樣保留result.lastPlugin對應身分。
- function plugin仍收到原Result；helpers不重建。使用者錯誤直接保留，resource階段CssSyntaxError由原生流程歸屬master-css-resources。警告、dependency／build／missing／context訊息及asset均經實際Next loader送回host callback。
- Resource hook拿到穩定的AST root：native visitor可能傳proxy，透過PostCSS proxyOf還原底層node，避免單Root被當成兩份計數狀態。單Document兩Root保留兩個身分，prepare不重複。

此版本提供hook機制，**尚未讓stylesheet-input-loader自動建立完整compiler resource policy**。測試中的hook使用0244 compiler API與固定fixture context；真實頁面目前沒有自動傳此metadata。不得把143tests／3e2e當成late-resource問題已解決。

## 測試及修正

| 檢查 | 結果／證據範圍 |
|---|---|
| 9組資源生命周期 | 實際載入安裝版Next原生PostCSS loader；編譯差集、唯一old／late值、Once次數及map存在符合預期 |
| prepare／helpers／訊息 | 原Result與postcss實體保留，receiver與lastPlugin一致，host收到完整訊息 |
| 錯誤／function plugin | 使用者Error物件不替換；resource CssSyntaxError有正確插件歸屬；legacy function只執行一次 |
| 並行request | 兩個同時執行的dispatcher共用凍結host plugins，各自輸出不同資源及來源，沒有交叉污染 |
| Document | 2Root／1prepare／2Once，resource hook看到2個穩定root |
| 完整套件 | 21files／143tests PASS，包含playground建置路徑；最後visitor身分修正再跑20項affected tests PASS |
| E2E | 3files／3tests PASS；位於最後production-source修改之後，但未啟動尚無自動接線的resource hook |
| Build／types／lint | 最終PASS；types使用owned0244 declarations，未跑會寫入共享依賴的reference builders |

新15項測試初跑13PASS／2FAIL：一般Error不會由PostCSS自動補plugin欄位，原斷言誤把CssSyntaxError規則套到Error；改以真正CssSyntaxError驗證歸屬，保留user Error identity測試。Document則真實暴露新adapter把proxy與root當成不同實體，修正proxyOf後15PASS。

之後補上lastPlugin精確身分斷言重現新adapter差異：callback的receiver雖正確，但helpers.result.lastPlugin仍是wrapper。修正所有visitor（含filtered）及function callback呼叫前的active plugin，最後20項focused tests通過。初次final lint發現新測試的this alias，改用Set保留同樣identity斷言後lint／types／20tests再次通過，未弱化期望值。

隔離建立腳本一次NameError與寫檔命令誤用workdir屬工具腳本錯誤；尚未寫入產品，修正後繼續既有owned副本。首輪程式錯誤、原始logs及之後複驗分開保存，沒有改寫為全部首跑通過。

## 可接續材料與下一步

`repros/next-postcss-request-adapter-on-0242.patch`為3檔delta，base是保留的0242 Next候選；read-only apply check通過，未套用原候選或root。新副本source56／dist66，原候選與0242／0244 API inventory全不變。副本依賴大多是指向既有workspace的read-only links，不能宣稱獨立乾淨checkout。

0247先完成resource policy的權責與snapshot同步，再接入stylesheet-input-loader／prepare-postcss：核對現有Rust-backed資源／emitted-global能力如何反映被刪除或改名的global、外部global與每Root ownership。不能盲用初始context，不能用TS重新實作CSS語義，也不能套用硬編碼fixture歸零規則。

自動接線後，必須以實際Next頁面重跑原postcss-added-global-reference失敗案例與native對照，保留old插件值、new global處理、Once次數、Modules export／global animation ownership、maps及依賴訊息；再驗同AST多種owned節點混合、Document錯誤／並行生命週期等尚未覆蓋場景。若source需修改，先等待讀者全部結束。

0243 selector provenance、Turbo persistent-cache publication、其他hosts／raw gates、完整Sass／watch／SSR、待核准patch及0038身分暫停全部保留。61個歷史remaining條目逐字保留，追加本批為62項描述；仍61historical／57fixed／4unresolved，65checked／10blocked。所有test／builder／E2E已終止，goal active。

[Final checks](../evidence/0246-final-checks.json) · [Candidate inventory](../evidence/0246-candidate-source.json) · [Patch check](../evidence/0246-patch-check.json)
