# 0147–0151 共用交接原文

以下段落由五份主要帳本逐字移入；保留當時的驗證範圍、HEAD與未完成狀態。較新的進展見主要帳本與後續批次。

- 0151：一般server保持頁面連線、連續兩次restart與後續HMR，最終72browser／24SSR PASS；middleware重啟仍失敗。actual-server正常模式pure PASS／managed FAIL，HTML/CSS404、SSR缺scanner；新config的buildStart完成後才執行舊config的closeBundle，測試中略過舊清理後2PASS，僅定位控制而非修復。全Vite167PASS／1FAIL，lint/types PASS；pure讀取時序、診斷型別錯誤與HTTP404早期推測均分開更正。本批僅帳本／新測試／重現材料，183既有來源與五產物不變。下一步處理scanner及stylesheet collection生命週期所有權，再驗middleware／custom environments與其他交付。BH-0004及12unresolved／10blocked／4gates／4候選保持未完成；0038身分暫停不變。HEAD8d40735be，0151未提交／推送。[0151](batches/0151-live-middleware-restart.md)。

- 0150：修復Sass browser CSS訊息送進SSR channel、restart scanner初始化競速、舊URL回呼污染新server與HTTP回應後URL尚未登記的競速。新增3actual-server回歸；Vite166tests／lint/types/build／範例及Site PASS。環境48browser＋16SSR、原request96、partial36通過；舊連線重啟重連仍待驗，新請求控制不替代它。raw alias／顏色序列化oracle與本輪編輯錯誤分開留證。下一批live reconnect、middleware／custom environment，再續資源／reference與其他host／Webpack；12unresolved／10blocked／4gates／4候選及0038身分暫停保持。HEAD45747c24a，未提交／推送。[0150](batches/0150-sass-environments-restart.md)。

- 0149：修復普通Sass partial刪除／恢復：改用接收create/delete的公開hotUpdate，失效／預處理失敗時保留最後依賴，成功時替換。修前72觀測18FAIL；修後direct／nested partial144、原request96、Modules36與build watch18共294browser PASS；Vite163tests與focused6通過。小SVG內嵌的初版資源oracle錯誤分開保留；partial相對資源實際URL與內容通過。下一批client／SSR與restart隔離，再續資源／reference與其他host／Webpack；0144缺檔、0148Modules URL及12unresolved／10blocked／4gates／4候選仍未完成，0038身分暫停不變。HEAD45747c24a，未提交／推送。[0149](batches/0149-sass-partial-recovery.md)。

- 0148：CSS/Sass Modules的inline／raw初始與更新48browser、普通Sass URL控制6browser PASS；Vite8.2.2拒絕.module.css／.module.scss的?url，modules:false亦同。8個公開主機控制確認限制，24個瀏覽器失敗保留；不將拒絕視為交付完成。初版要求不存在的error.plugin屬oracle錯誤，已更正；本批僅重現與文件。下一批普通Sass partial／resource/reference ownership；Modules URL、0144巢狀缺檔、其他host／Webpack與12unresolved／10blocked／4gates／4候選仍未完成，0038身分暫停維持。HEAD45747c24a，未提交／推送。[0148](batches/0148-module-request-modes.md)。

- 0147：Sass ?url以公開middleware／module graph追蹤實際stylesheet URL並補送匹配link的CSS HMR；Vite162tests／lint/types/build／範例PASS，持續link的request96、Modules18、nested路徑24與連續更新9共147browser PASS。停用tracking對照3更新FAIL；精確alias不匹配query在pure Vite亦失敗，改目錄alias後通過，屬腳本設定錯誤。下一批Module request modes、partial／其他host與Webpack；0144巢狀缺檔仍未修復。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變。HEAD45747c24a，本批未提交／推送。[0147](batches/0147-sass-url-hmr.md)。
