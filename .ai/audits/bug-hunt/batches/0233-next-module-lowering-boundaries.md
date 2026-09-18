# Batch 0233: Next Module lowering boundaries

Previous turn made progress:0232 reproduced10PostCSSbrowserfailures andestablishedpost-lowering/exportconstraints. Opening655sources/493sharedartifacts/49candidate sources/54candidate artifacts match0232;48remainingentries and0038pause retained.

Bounded work: inspectactualRustcompileCSSStylesheetGraph nativeCSS/generatedCSS fields andfinalrender globals, thenstageprototype usingexistingNextPostCSS/Module processors afterRustlowering. No compilerorNextproductchanges; do nottreatisolatedstage success ashostrepair.

## Rust欄位與全域邊界

4個actual native graph案例（compose、exports、components、shared）完成，並與public compileRenderedStylesheet輸出對照：

- asset.nativeCSS是原生輸入保留下來的規則；asset.generatedCSS也包含原生selector中@compose降低後的規則，如.direct／.shared。它不是「全部應維持global」的標記。
- classNames觸發的.brand全域component由後續render階段另外產生，在rendered.generatedCSS中，且附加到entry asset。
- shared輸出保留CSS資產邊界，@import已成為delivery URL，但composes仍保留原始specifier。這個差異在接回host graph時必須由真正的graph／bundle能力處理，不能假設所有request字串相同。

## 階段原型

audit-only原型使用現有Rust降低結果，再用Next所用的PostCSS與既有Module processor；沒有新增compiler／Next產品API，也沒有TS CSS語義fallback。

3個single-file案例共6個Chromium／WebKit觀測PASS：降低後padding經PostCSS變成48px；PostCSS改名後direct export存在；自訂component降低後仍有7px。最後一版另外保留rendered globals為global，普通.brand得到7px。

3個selector對映核對了原始file URL、line、column及完整原始source content。這僅涵蓋三個selector anchors；不代表generated-global maps、細部declaration anchors或完整圖已完成。

刻意把global CSS與Module CSS混合再scope，兩瀏覽器的普通.brand變成0px，且被錯誤新增為scoped Module export；這2個negative controls確認不能把全部compiled CSS一起scope。原型分別執行global PostCSS，尚未證明依賴單一AST/root的plugin或完整host行為，因此沒有採用為產品修復。

首次腳本引用不存在的next/dist/compiled/postcss而MODULE_NOT_FOUND；已改用Next自身依賴解析，修正後成功。原始失敗日誌保留，屬repro錯誤。

## 保存與下一步

只新增audit repro及帳本；原655來源輸入全部不變，加入新repro後656。493 shared artifacts、candidate49sources／54artifacts保持0231／0232。未建置實際Next app、未改產品／既有測試／依賴／Site，沒有commit／promotion；不重跑未受修改影響的package checks。

0232的10個actual host失敗仍未修；48個既有remaining entries逐字保留並追加本批約束，0038身分驗證暫停與Firefox／待授權patch照舊。

下一步驗證既有Rust prepareCSSStylesheetBundle／renderCSSStylesheetBundle 能否在host處理後依原圖重連imports/resources，保持specifier身份、scope、source maps和內容hash。再建立包含post-lowering authored assets與獨立generated globals的host邊界，接回實際Next並同時重跑0232五組失敗及local控制；不得以這6個機制PASS替代11個actualbuild對照。

[階段結果](../evidence/0233-stage-summary.json) · [原始證據與對映](../evidence/0233-stage-maps-globals.json) · [完整交接](../evidence/0233-final-checks.json)

