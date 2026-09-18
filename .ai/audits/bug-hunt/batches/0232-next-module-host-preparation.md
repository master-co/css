# Batch 0232: Next Module host preparation

Previous turn made progress:0231 fixed explicit inline loader execution and importer-relative/alias resolution in owned candidate; all required bounded checks passed. Opening655sources/493sharedartifacts/49candidate sources/54candidate artifacts match0231. All47remainingentries and0038identitypause retained.

Bounded task: actual pure/candidate NextWebpack Client CSS compositions with user PostCSS and orderedinline transforms. Verify childCSS receives the native host preparation pipeline, not only explicitinline loaders. Preserve fullscope andcaptured-source/map/dependency contracts.

## 重現結果

11次實際NextWebpack Client production builds全部完成；Chromium／WebKit共22個觀測，12 PASS／10 FAIL。所有失敗都在未修改的0231 graph候選；5個pure對照共10 PASS，原有local-compose候選控制2 PASS。沒有browser啟動、page/console或harness錯誤。

| 行為 | pure／既有local對照 | graph候選 | 證據涵義 |
|---|---|---|---|
| child CSS PostCSS把border1px改7px | 7px | 1px | child未經PostCSS |
| inline loader把1px改3px，再PostCSS改7px | 7px | 3px | 明確inline loader修正保留，但後續host pipeline遺漏 |
| entry CSS PostCSS把border1px改7px | 7px | 1px | 問題也涵蓋入口 |
| 編譯後padding2rem由PostCSS改3rem | pure預先lower與candidate local-compose均48px | 32px | 只在Rust編譯前執行PostCSS仍會漏掉產生的宣告 |
| PostCSS把.original改.direct，JS讀styles.direct | 有class且7px | 無class、黑字、0px | Module exports也在錯誤階段固定；只處理發布CSS不夠 |

postcss-generated的pure控制用明確等價的padding:2rem；candidate真正執行@compose p:2rem。candidate local控制有獨立globals入口，沿既有local transform路徑，實際證明Rust lowering → PostCSS → native CSS Module的處理順序可保留48px結果。

每份JSON包含輸入、build日誌、HTML class、完整CSS、CSSOM匹配規則與PostCSS事件。PostCSS Declaration在AST變更後可能重訪；不能把事件筆數直接當plugin呼叫次數。最後export案例另記Once／rename，純Next確實rename而candidate只處理wrapper，沒有看到original selector。

## 原始碼定位與修正約束

- stylesheet-loader先prepareEntry取得Module exports，再compileRenderedStylesheet／deliverNextStylesheet。
- 原有loader陣列仍讓PostCSS在Master loader之後執行，但拿到的是graph wrapper／export bridge；真正的asset bytes由webpack-css-loader.pitch直接emit，繞過PostCSS。
- 因此不能僅把PostCSS提到compile之前，也不能只在emit時轉換CSS；前者漏generated declarations，後者無法修復已固定的Module exports。修正還必須保持generated utility/global語義、map、import/resource圖與內容hash一致，不能用TS／regex重新實作Rust語義。
- compiler內部delivery compileGraph已有nativeCSS／generatedCSS欄位；render-delivery負責附加generated globals，但目前公開stylesheets只保留id/href/css/map。下一步先核對既有分層能力及來源邊界，再設計正確的host階段，不能為通過單一padding測試換成錯誤流程。

## 保存與交接

本批只擴充audit repro與帳本。655來源輸入中654不變；493 shared artifacts、candidate49sources／54artifacts完全保持0231。沒有產品修正／promotion／commit，index空；沒有重跑不受修改影響的套件tests/lint/build，0231的128tests／3e2e保留為歷史局部證據，不能排除本批已重現的10個失敗。

全部47個既有remaining entries逐字保留，追加PostCSS完整階段需求；0038身分驗證暫停、Firefox、待授權patch與其他host需求不變。案例是尚未交付候選的缺口，沿用BH-0004／BH-0051，不新增重複ID或擅稱正式root新增退化。

下一批從packages/compiler/src/stylesheet/{delivery,render-delivery}.ts及Next的prepare-module／stylesheet-delivery接續，查明Rust已lowered native CSS、generated globals與Module來源邊界可如何保留。建立同時覆蓋本批5個graph失敗案例與既有local控制的修正，再驗map、imports/resources與既有流程；pre/post/Sass和watch仍未完成。

[host矩陣](../evidence/0232-postcss-matrix.json) · [原始碼位置](../evidence/0232-pipeline-boundary.json) · [完整交接](../evidence/0232-final-checks.json)

