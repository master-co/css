# 0148 Development CSS Modules request modes

- HEAD `45747c24a`；承接0147的176來源雜湊。前一批修復Sass URL HMR並完成147browser與162package tests，屬有效進展。
- 限定CSS/Sass Modules的inline/raw/url請求；本批不修改產品或既有fixtures/snapshots，不新增依賴，不提交／推送。

## 證據

| 證據 | 結果／分類 |
|---|---|
| `0148-module-inline-first.log`、`0148-module-raw-first.log` | CSS/Sass × pure/managed ×初始/更新×三browser，各24PASS。inline在手動注入前不影響頁面、注入後套用scoped selector；raw精確等於作者source。 |
| `0148-module-inline-final.log`、`0148-module-raw-final.log` | 最終repro版本重跑相同48browser，全PASS；檢查更新後payload與bootID，不以重新載入通過。 |
| `0148-module-url-host.log` | 最初4個public transformRequest与HTTP控制都收到Vite不支援Modules url訊息／500，腳本卻要求錯誤物件帶plugin字段；public thrown Error實際沒有該字段，故oracle誤判UNEXPECTED。 |
| `0148-module-url-host-final.log` | 移除無契約的plugin字段假設，保留精確主機錯誤訊息與HTTP500要求；CSS/Sass pure/managed四控制確認HOST_UNSUPPORTED。 |
| `0148-module-url-disabled.log` | 預期關閉Modules可作普通url的瀏覽器控制，實際24FAIL，全部無法載入`.module.*?url`。這些失敗保留，不當作修復完成。 |
| `0148-module-url-disabled-host.log` | 擴充pure/managed ×CSS/Sass ×modules enabled/false，共8個public transformRequest＋HTTP500控制，皆同一主機拒絕訊息。已讀安裝的Vite8.2.2：CSS load對isModuleCSSRequest直接拒絕，該分支未檢查css.modules開關。 |
| `0148-ordinary-url-control.log` | 同版repro保留普通managed Sass持續link更新，6browser PASS；Modules命名限制沒有延伸至一般Sass。 |

## 修改與結論

- 共用`vite-dev-style-requests.mjs`新增BH_MODULE、BH_MODULES_DISABLED。Modules檔名仍保留，使用Vite generateScopedName產生已知audit_example selector，不自行重作CSS Modules parser；inline手動注入／移除，raw不注入，精確比較source。
- 新增`vite-module-url-host.mjs`，透過Vite公開transformRequest與真實HTTP重現8個host controls。主程式exit0只表示成功觀察主機限制，**不代表Modules ?url交付已完成**。
- Vite README與Site既有directives contract補inline/raw行為及Vite8.2.2檔名限制，包含modules:false也不能繞過。沒有產品修復或新BH ID；限制保留在BH-0004後續交付範圍。
- 最終支援行為48＋普通URL6＝54browser PASS；另24browser FAIL與8HOST_UNSUPPORTED明確分列，不抵銷或隱藏。
- 本批只有重現與文件，沒有再次執行未變的162項套件suite；Vite lint及Site prepare/lint、語法／AI budget／來源保存詳見final-checks。0147的162tests與build是其當時的已驗證產品版本，未當成本批新執行結果。

## 接續與未完成

1. 下一批驗證普通Sass partial變更／刪除恢復及resource/reference ownership，使用真實持續stylesheet與原始檔案URL；保留direct、inline、url請求差異。
2. Modules ?url尚未交付。pure Vite拒絕是契約／限制證據，不是達成所有host行為；後續若交付要求包含此形式，仍須實作與驗證，不能以此次HOST_UNSUPPORTED結案。
3. 0144巢狀composition缺檔終止host、其他preprocessor/PostCSS、server restart、多root／SSR/shared environments、完整published maps與Webpack均仍待完成；原Webpack3build／12browser、legacy39browser失敗保留。
4. 45歷史findings為33fixed／12unresolved，75coverage為65checked／10blocked，另4root gates／4候選。0038仍等使用者明確確認身分驗證通過；整體目標active。
