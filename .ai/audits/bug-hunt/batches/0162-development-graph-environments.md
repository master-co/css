# 0162 Retained graph environment replacement and restart

## 基線與範圍

- 前輪0161完成snapshot一致性修復、237tests／48browser及帳本收尾，屬有效進展。216來源雜湊一致，HEADb306e5d77；未commit/push，0038身分暫停維持。
- 接BH-0004的retained child CSS／resource於custom environment replacement與restart的交付／清理；既有0154–0155普通Sass結果不能直接代替retained graph。

## 驗證範圍

- 新actual-server控制涵蓋四mode×perEnvironmentStartEnd兩設定的idle edge replacement：原環境先產生CSS／resource，替換後關閉old、client與SSR，再首次載入replacement的新entry與修改child；新舊asset版本須正確且最後清理。
- 四mode×standalone／middleware restart：舊resource副本須清理，新context發布不同URL；SSR載入及後續child修改須生效，同一新context的舊版本仍可讀；結果見下方。
- 47historical／35fixed／12unresolved、10blocked／4gates／4原候選與1host shutdown限制維持；local-compose／virtual owners、其他host與全部原有未完成要求保留。

## 結果與驗證

- 16actual-server cases全PASS：8idle replacements及8restart模式；逐一實際請求retained child CSS／SVG，核對status／MIME／bytes，檢查新entry、child更新、同context舊asset版本與最後清理。這批沒有修改正式產品程式。
- 完整Vite253tests／45files、lint/types通過。使用0161已建置、來源未變的Vite package執行新browser重現，未為測試／文件變更重建產品。
- 四mode×standalone／middleware×三browser×initial／restart／child-update／resource-update＝96observations全PASS。restart後bootID及resource URL改變；後續child色彩與SVG紅→藍通過computed style、canvas RGBA、HTTP exact bytes／MIME／query／fragment檢查，bootID不再改變。pageerror與HTTP錯誤均空；程序自然exit0。
- 公開文件同步已驗證的replacement／restart範圍；Site lint與最終source／artifact／cleanup核對見0162-final-checks.json。正式source、fixtures/snapshots、依賴與五個Wasm/runtime/manifest產物保持；歷史共同交接逐字歸檔。
- 下一批接local-compose的完整graph交付，再續virtual resource/reference owner、其他preprocessor／PostCSS／maps、Nuxt實際子CSS及Webpack graph／並行dist，與原全部未完成問題／root gates。47historical／35fixed／12unresolved及0038身分暫停不變；未commit/push。
- 已讀下一接點：LocalComposePlugin的resolveStylesheet雖preserveImports，但真正輸出仍呼叫transformStylesheet；公開MasterCSSStylesheetTransformOptions沒有delivery，內部transformLocalStylesheet走compileStylesheetResult及單字串renderCompiledManifestCSS。先以有local @compose、qualified child及nested external import的actual host控制重現；再從compiler擁有層評估現有graph／bundle API，不在Vite用字串攤平或重寫語義。
