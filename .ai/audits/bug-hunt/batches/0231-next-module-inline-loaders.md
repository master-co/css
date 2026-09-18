# Batch 0231: Next Module inline loaders

Previous turn made progress:0230 separated native Client SSR/CSS mismatch from candidate Server condition drift. Opening654sources/493artifacts/48candidate sources/52candidate artifacts match0230. All46remainingentries and0038identitypause retained; no newapproval orcommit.

InstalledNext16.3.4publicTurbopackOptions andRuletypes contain no React/SSRconsumertransition hook; togetherwith0229trace this doesnot identify a supportedsolution. ContinueindependentWebpackinlineCSSModuleloaderboundary. NativeICSSparser splitsinlineprefix beforehostresolution andretainsit; candidatecurrentlyresolveswholeprefixasfilename. Testactualpure/candidatehostswithtransforminginlineLoaderqueries/chains beforechangingcode.

## 已完成的行為證據

- 0228候選的兩個原始案例都 build FAIL：把 inline loader JavaScript 當 CSS 讀入，PostCSS 在 `const` 報錯。純 Next 能執行 loader，但 Server 用法又發布未轉換的同名 selector，覆蓋 7px 結果為1px（4 browser FAIL）；Client-only 純 Next 對照4 browser PASS。
- 隔離候選先拆分 loader prefix／resource，交由 Webpack importModule 執行 loader，以私有 source loader 傳回 CSS/map，避免自行執行／解讀 loader 程式。query／chain 實際4 browser PASS。
- 新增 nested 對照：原生 Client2 PASS，初版候選因 entry context 找不到相對 loader 而 build FAIL。修正為 Webpack 原有 loader resolver 依實際 importing CSS 位置解析各段，再交回 importModule；也保留 resolveLoader alias 設定。
- 最終候選 nested、alias、chain Client 與 query／chain Server 共5 builds／10 browser PASS；native alias Client2 PASS。各段執行順序與 options 記錄在 inlineLoaderCalls。候選的 Server 不再發出純 Next 那份多餘的未轉換 CSS，7px 符合 loader 結果；原生 Server偏差另記，不能據此宣稱 full host parity。
- 共16次實際build：13完成、3已定位失敗；26 browser觀測22 PASS／4原生Server FAIL。中間版本結果保留，沒有混算成最終版本通過。
- 18 preparation controls全部PASS，涵蓋原14項及inline chain/options、分離query快取、錯誤不回退、原始source content對映。這些用可觀測假host驗證流程；上面的actualhost矩陣才是原生解析證據。

## 候選修改與限制

只修改 owned candidate 的 prepare-module-graph.ts、prepare-module.ts，新增 stylesheet-source-loader.ts。inline完整request參與graph/session快取，dependencies仍對映physical CSS；使用主機的loader resolver和importModule，不改Rust CSS語義。已準備完整10檔source patch並通過git apply --check；沒有套用至root。

原先四份Next既有測試patch／lightweight單測契約仍待各自授權，0230 Server條件／native Client SSR錯配、Sass完整pipeline/maps、inline loader動態dependencies/watch/recovery與其他原要求均未完成。不能以本批absolute/query/chain/nested/alias成功宣稱全部loader或Next交付完成。

產生patch時曾誤取diff header的字元偏移（留下b/，Path.relative_to失敗）；未寫出patch前即失敗，修正後apply-check通過，屬工具腳本錯誤。

## 驗證與交接

完整 candidate 128 tests、3 e2e、whole-package lint、audit types、build 全部 PASS；兩支重現腳本 syntax PASS。655個來源輸入（原654中652不變，另加候選patch）與493 shared artifacts核對完成；只有兩支audit腳本改動，root產品／既有測試／依賴／Site不變。候選現49 sources／54 artifacts，0230前版dist完整保存在owned backup。所有host與驗證程序結束，沒有commit、index空，沒有promotion。

AI context與最後交接檢查見final checks。46個既有remaining entries逐字保留並追加本批（47項），0038身分驗證暫停維持。既有測試patch未獲回覆，不套用至root。

下一批以 actual PostCSS／pre-post／Sass loaders 檢查完整子檔preparation和importLoaders順序；現在capture只委派明確inline chain，尚不能推論完整pipeline一致。再驗inline動態dependencies/watch/recovery與更精確map位置；0230條件失敗和所有原需求不縮減。

[實際host矩陣](../evidence/0231-host-matrix.json) · [流程控制](../evidence/0231-graph-controls-final.json)


[完整交接與全部未完成項目](../evidence/0231-final-checks.json)
