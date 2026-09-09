# 0141–0144 歷史進度（0146整理）

以下為各主帳本既有進度段落原文；目前狀態以主帳本最新批次為準。

## README.md

- 0144：直接CSS／Sass Modules的子檔刪除／還原與改名後續更新，完成產物42browser PASS。巢狀缺檔會使Vite內部async loader拒絕未被捕捉並終止程序；pure Vite build與public preprocessCSS均獨立重現，恢復仍未完成。腳本增加輸入revision及BUNDLE_END產物快照，避免重複build completion與live dist重寫混淆；不宣稱重建期間原子發布。只改repro／帳本，產品來源未變。下一步續查公開host錯誤隔離能力，並驗證development Modules HMR，再接其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0144](batches/0144-module-missing-dependencies.md)。

- 0143：透過Vite原有resolver追蹤CSS／Sass Modules的巢狀composes依賴，cached／失敗caller亦登記watch；含NUL來源佔位值改保留明確preprocessed診斷。Vite158／lint/types/build／範例、Modules60／Sass90／inline84及巢狀恢復18browser全PASS；另直接watch18PASS。兩筆恢復404經事件trace確認為脚本誤消費ERROR後END，已改BUNDLE_END，非產品bug。純Vite缺少composed export仍產生undefined列baseline；Site通過（75warnings），五產物不變。下一批驗證子檔刪除／還原、改名，再續dev/HMR與其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，本批未提交／推送。[0143](batches/0143-module-dependency-watch.md)。

- 0142：修復managed CSS Modules匯出遺失，以及CSS／Sass Modules scoped names未進入scanner導致預設裁剪漏CSS；共用Vite預處理與既有scanner，cached模組重新登記usage。154Vite／lint/types/build／範例、20build／60Modules與Sass90／inline84browser通過；CSS/Sass root-edit watch6build／18browser通過。composition子檔單獨變更不觸發watch，純Vite亦重現且public preprocessCSS deps為空，仍未完成；下一步追依賴與dev/HMR，再續其他host與Webpack。5artifacts不變；33fixed／12unresolved、10blocked／4gates／4候選與0038身分暫停不變。HEAD3e44f4fb3，本批未提交／推送。[0142](batches/0142-css-modules.md)。

- 0141：Sass診斷已接原始partial位置、插值粗略位置及additionalData對映；另修Rust移除entry／reference指令造成位移、compiler local lowering漏傳source text。84Rust／230compiler／146Vite、lint/types/build、Sass90／watch18／public native-Wasm198browser與5build診斷／發布控制通過；Site通過（75warnings）。compiler-Wasm+2665raw／726gzip／458brotli，runtime四產物不變；兩root API失敗hash不變。下一批續Modules／其他預處理與PostCSS／virtual resources／local-compose／HMR，再接Webpack；完整發布map與其他host情境仍未完成。33fixed／12unresolved、10blocked／4gates／4候選及0038身分暫停不變；HEAD3e44f4fb3，本批未提交／推送。[0141](batches/0141-sass-diagnostic-locations.md)。

## coverage.md

0141：Sass診斷已接原始partial位置、插值粗略位置及additionalData對映；另修Rust移除entry／reference指令造成位移、compiler local lowering漏傳source text。84Rust／230compiler／146Vite、lint/types/build、Sass90／watch18／public native-Wasm198browser與5build診斷／發布控制通過；Site通過（75warnings）。compiler-Wasm+2665raw／726gzip／458brotli，runtime四產物不變；兩root API失敗hash不變。下一批續Modules／其他預處理與PostCSS／virtual resources／local-compose／HMR，再接Webpack；完整發布map與其他host情境仍未完成。33fixed／12unresolved、10blocked／4gates／4候選及0038身分暫停不變；HEAD3e44f4fb3，本批未提交／推送。[0141](batches/0141-sass-diagnostic-locations.md)。

0142：修復managed CSS Modules匯出遺失，以及CSS／Sass Modules scoped names未進入scanner導致預設裁剪漏CSS；共用Vite預處理與既有scanner，cached模組重新登記usage。154Vite／lint/types/build／範例、20build／60Modules與Sass90／inline84browser通過；CSS/Sass root-edit watch6build／18browser通過。composition子檔單獨變更不觸發watch，純Vite亦重現且public preprocessCSS deps為空，仍未完成；下一步追依賴與dev/HMR，再續其他host與Webpack。5artifacts不變；33fixed／12unresolved、10blocked／4gates／4候選與0038身分暫停不變。HEAD3e44f4fb3，本批未提交／推送。[0142](batches/0142-css-modules.md)。

0143：透過Vite原有resolver追蹤CSS／Sass Modules的巢狀composes依賴，cached／失敗caller亦登記watch；含NUL來源佔位值改保留明確preprocessed診斷。Vite158／lint/types/build／範例、Modules60／Sass90／inline84及巢狀恢復18browser全PASS；另直接watch18PASS。兩筆恢復404經事件trace確認為脚本誤消費ERROR後END，已改BUNDLE_END，非產品bug。純Vite缺少composed export仍產生undefined列baseline；Site通過（75warnings），五產物不變。下一批驗證子檔刪除／還原、改名，再續dev/HMR與其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，本批未提交／推送。[0143](batches/0143-module-dependency-watch.md)。

0144：直接CSS／Sass Modules的子檔刪除／還原與改名後續更新，完成產物42browser PASS。巢狀缺檔會使Vite內部async loader拒絕未被捕捉並終止程序；pure Vite build與public preprocessCSS均獨立重現，恢復仍未完成。腳本增加輸入revision及BUNDLE_END產物快照，避免重複build completion與live dist重寫混淆；不宣稱重建期間原子發布。只改repro／帳本，產品來源未變。下一步續查公開host錯誤隔離能力，並驗證development Modules HMR，再接其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0144](batches/0144-module-missing-dependencies.md)。

## findings.md

0141：Sass診斷已接原始partial位置、插值粗略位置及additionalData對映；另修Rust移除entry／reference指令造成位移、compiler local lowering漏傳source text。84Rust／230compiler／146Vite、lint/types/build、Sass90／watch18／public native-Wasm198browser與5build診斷／發布控制通過；Site通過（75warnings）。compiler-Wasm+2665raw／726gzip／458brotli，runtime四產物不變；兩root API失敗hash不變。下一批續Modules／其他預處理與PostCSS／virtual resources／local-compose／HMR，再接Webpack；完整發布map與其他host情境仍未完成。33fixed／12unresolved、10blocked／4gates／4候選及0038身分暫停不變；HEAD3e44f4fb3，本批未提交／推送。[0141](batches/0141-sass-diagnostic-locations.md)。

0142：修復managed CSS Modules匯出遺失，以及CSS／Sass Modules scoped names未進入scanner導致預設裁剪漏CSS；共用Vite預處理與既有scanner，cached模組重新登記usage。154Vite／lint/types/build／範例、20build／60Modules與Sass90／inline84browser通過；CSS/Sass root-edit watch6build／18browser通過。composition子檔單獨變更不觸發watch，純Vite亦重現且public preprocessCSS deps為空，仍未完成；下一步追依賴與dev/HMR，再續其他host與Webpack。5artifacts不變；33fixed／12unresolved、10blocked／4gates／4候選與0038身分暫停不變。HEAD3e44f4fb3，本批未提交／推送。[0142](batches/0142-css-modules.md)。

0143：透過Vite原有resolver追蹤CSS／Sass Modules的巢狀composes依賴，cached／失敗caller亦登記watch；含NUL來源佔位值改保留明確preprocessed診斷。Vite158／lint/types/build／範例、Modules60／Sass90／inline84及巢狀恢復18browser全PASS；另直接watch18PASS。兩筆恢復404經事件trace確認為脚本誤消費ERROR後END，已改BUNDLE_END，非產品bug。純Vite缺少composed export仍產生undefined列baseline；Site通過（75warnings），五產物不變。下一批驗證子檔刪除／還原、改名，再續dev/HMR與其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，本批未提交／推送。[0143](batches/0143-module-dependency-watch.md)。

0144：直接CSS／Sass Modules的子檔刪除／還原與改名後續更新，完成產物42browser PASS。巢狀缺檔會使Vite內部async loader拒絕未被捕捉並終止程序；pure Vite build與public preprocessCSS均獨立重現，恢復仍未完成。腳本增加輸入revision及BUNDLE_END產物快照，避免重複build completion與live dist重寫混淆；不宣稱重建期間原子發布。只改repro／帳本，產品來源未變。下一步續查公開host錯誤隔離能力，並驗證development Modules HMR，再接其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0144](batches/0144-module-missing-dependencies.md)。

## report.md

0141：Sass診斷已接原始partial位置、插值粗略位置及additionalData對映；另修Rust移除entry／reference指令造成位移、compiler local lowering漏傳source text。84Rust／230compiler／146Vite、lint/types/build、Sass90／watch18／public native-Wasm198browser與5build診斷／發布控制通過；Site通過（75warnings）。compiler-Wasm+2665raw／726gzip／458brotli，runtime四產物不變；兩root API失敗hash不變。下一批續Modules／其他預處理與PostCSS／virtual resources／local-compose／HMR，再接Webpack；完整發布map與其他host情境仍未完成。33fixed／12unresolved、10blocked／4gates／4候選及0038身分暫停不變；HEAD3e44f4fb3，本批未提交／推送。[0141](batches/0141-sass-diagnostic-locations.md)。

0142：修復managed CSS Modules匯出遺失，以及CSS／Sass Modules scoped names未進入scanner導致預設裁剪漏CSS；共用Vite預處理與既有scanner，cached模組重新登記usage。154Vite／lint/types/build／範例、20build／60Modules與Sass90／inline84browser通過；CSS/Sass root-edit watch6build／18browser通過。composition子檔單獨變更不觸發watch，純Vite亦重現且public preprocessCSS deps為空，仍未完成；下一步追依賴與dev/HMR，再續其他host與Webpack。5artifacts不變；33fixed／12unresolved、10blocked／4gates／4候選與0038身分暫停不變。HEAD3e44f4fb3，本批未提交／推送。[0142](batches/0142-css-modules.md)。

0143：透過Vite原有resolver追蹤CSS／Sass Modules的巢狀composes依賴，cached／失敗caller亦登記watch；含NUL來源佔位值改保留明確preprocessed診斷。Vite158／lint/types/build／範例、Modules60／Sass90／inline84及巢狀恢復18browser全PASS；另直接watch18PASS。兩筆恢復404經事件trace確認為脚本誤消費ERROR後END，已改BUNDLE_END，非產品bug。純Vite缺少composed export仍產生undefined列baseline；Site通過（75warnings），五產物不變。下一批驗證子檔刪除／還原、改名，再續dev/HMR與其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，本批未提交／推送。[0143](batches/0143-module-dependency-watch.md)。

0144：直接CSS／Sass Modules的子檔刪除／還原與改名後續更新，完成產物42browser PASS。巢狀缺檔會使Vite內部async loader拒絕未被捕捉並終止程序；pure Vite build與public preprocessCSS均獨立重現，恢復仍未完成。腳本增加輸入revision及BUNDLE_END產物快照，避免重複build completion與live dist重寫混淆；不宣稱重建期間原子發布。只改repro／帳本，產品來源未變。下一步續查公開host錯誤隔離能力，並驗證development Modules HMR，再接其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0144](batches/0144-module-missing-dependencies.md)。

## changes.md

0141：Sass診斷已接原始partial位置、插值粗略位置及additionalData對映；另修Rust移除entry／reference指令造成位移、compiler local lowering漏傳source text。84Rust／230compiler／146Vite、lint/types/build、Sass90／watch18／public native-Wasm198browser與5build診斷／發布控制通過；Site通過（75warnings）。compiler-Wasm+2665raw／726gzip／458brotli，runtime四產物不變；兩root API失敗hash不變。下一批續Modules／其他預處理與PostCSS／virtual resources／local-compose／HMR，再接Webpack；完整發布map與其他host情境仍未完成。33fixed／12unresolved、10blocked／4gates／4候選及0038身分暫停不變；HEAD3e44f4fb3，本批未提交／推送。[0141](batches/0141-sass-diagnostic-locations.md)。

0142：修復managed CSS Modules匯出遺失，以及CSS／Sass Modules scoped names未進入scanner導致預設裁剪漏CSS；共用Vite預處理與既有scanner，cached模組重新登記usage。154Vite／lint/types/build／範例、20build／60Modules與Sass90／inline84browser通過；CSS/Sass root-edit watch6build／18browser通過。composition子檔單獨變更不觸發watch，純Vite亦重現且public preprocessCSS deps為空，仍未完成；下一步追依賴與dev/HMR，再續其他host與Webpack。5artifacts不變；33fixed／12unresolved、10blocked／4gates／4候選與0038身分暫停不變。HEAD3e44f4fb3，本批未提交／推送。[0142](batches/0142-css-modules.md)。

0143：透過Vite原有resolver追蹤CSS／Sass Modules的巢狀composes依賴，cached／失敗caller亦登記watch；含NUL來源佔位值改保留明確preprocessed診斷。Vite158／lint/types/build／範例、Modules60／Sass90／inline84及巢狀恢復18browser全PASS；另直接watch18PASS。兩筆恢復404經事件trace確認為脚本誤消費ERROR後END，已改BUNDLE_END，非產品bug。純Vite缺少composed export仍產生undefined列baseline；Site通過（75warnings），五產物不變。下一批驗證子檔刪除／還原、改名，再續dev/HMR與其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，本批未提交／推送。[0143](batches/0143-module-dependency-watch.md)。

0144：直接CSS／Sass Modules的子檔刪除／還原與改名後續更新，完成產物42browser PASS。巢狀缺檔會使Vite內部async loader拒絕未被捕捉並終止程序；pure Vite build與public preprocessCSS均獨立重現，恢復仍未完成。腳本增加輸入revision及BUNDLE_END產物快照，避免重複build completion與live dist重寫混淆；不宣稱重建期間原子發布。只改repro／帳本，產品來源未變。下一步續查公開host錯誤隔離能力，並驗證development Modules HMR，再接其他host／Webpack。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0144](batches/0144-module-missing-dependencies.md)。
