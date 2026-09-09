# 0152–0154 共用交接原文

本檔於0155逐字保存下列歷史交接。原HEAD與未提交描述為當時狀態；批次檔與證據不變。原文各出現於README、coverage、findings、changes、report。

- 0154：修復idle替換環境提前釋放scanner、per-environment hooks重複HMR listeners及晚啟動環境清掉client Sass依賴。清理時核對公開server registry／closed實例，listeners每scanner一次，dev Sass cache於configureServer清理。新8tests及Vite187tests／35files、focused28、lint/types/build／範例PASS；替換／hooks／restart五矩陣288browser／132SSR全PASS，Site PASS（75warnings）。初版applyToEnvironment錯誤假設、spy型別及空log觀察錯誤分開留證。182既有來源及五產物不變。下一批共用plugin instance多root並行，再續資源／reference與其他host；BH-0004整體、12unresolved／10blocked／4gates／4候選及0038身分暫停維持。HEAD8d40735be，未提交／推送。[0154](batches/0154-environment-replacement.md)。

- 0153：修復任一custom／SSR／client environment關閉就清理共用scanner的問題；記錄config初始環境使用者，最後一個關閉才釋放scanner／collection及HMR登記。修前pure3PASS／managed3FAIL，修後6actual-server cases及Vite179tests／34files、lint/types/build與範例PASS。新custom矩陣48browser／20SSR、兩組restart控制144browser／48SSR全PASS；Site prepare/lint PASS（75warnings）。新增6tests及重現，182既有來源及五產物不變；舊交接逐字歸檔。下一批共用instance、動態environment與hook旗標，再續資源／reference及其他host；BH-0004整體、12unresolved／10blocked／4gates／4候選和0038身分暫停維持。HEAD8d40735be，未提交／推送。[0153](batches/0153-custom-environment-close.md)。

- 0152：middleware restart生命週期修復：scanner／stylesheet collection依ResolvedConfig保存與清理，處理並行init、重複close、失敗重試及遲到init；HMR移除已關閉server登記。正常模式Vite173tests／33files、focused25、lint/types/build與範例PASS；middleware及一般server連續兩次重啟共144browser／48SSR全PASS。新增5tests，原HMR保留舊server失敗留證；Site prepare/lint PASS（75warnings）。三個Vite產品檔與兩份文件更新，180既有來源及五產物不變。下一批custom environment／共用instance生命週期，再續資源／reference與其他host／Webpack；BH-0004整體及12unresolved／10blocked／4gates／4候選未完成，0038身分暫停不變。HEAD8d40735be，本批未提交／推送。[0152](batches/0152-middleware-lifecycle.md)。
