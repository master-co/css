# Batch 0234: Next Module graph relinking

Previous turn made progress:0233 verified post-lowering stage/global boundaries and3selector maps. Opening656sources/493sharedartifacts/49candidate sources/54candidate artifacts match0233. All49remainingentries and0038identitypause retained.

## 實際API對照

5個host-processed CSS案例：layer/supports/screen import、原始specifier、既有resource、PostCSS新增resource、root／child同名resource。皆用現有public compiler，native／Wasm各5組bundle結果與5組graph結果一致；沒有新增產品API或TS語義fallback。

| 能力 | prepare/render bundle | compileStylesheets／Node rendered graph |
|---|---|---|
| 已知href重連及qualifier保留 | 可 | 可 |
| 原始child.module.css與已發布href不同 | 未提供alias時維持unresolved | host明確提供edge後重連 |
| managed CSS既有／新增resource | resourceURLs不轉寫managed內容 | per-owner resource表正確改寫 |
| root／child同名pixel.svg | 不提供owner-aware重寫 | 各自保留root／child URL及query/hash |
| 來源對映 | asset只有id/href/css，額外map欄位不傳遞 | raw graph有outputMappings；Node graph可串接先前PostCSS maps |

這是能力邊界比較，不是把bundle未承諾的功能列為產品bug。bundle.sources在這些只有managed slot的輸入為空；不能把它當完整managed圖來源資訊。

## 渲染與來源對映

修正後5個案例 × raw graph／Node mapped graph × Chromium／WebKit，共20 browser PASS；兩條路徑都保留48px padding／7px border與預期資源URL。HTTP請求與CSS資產完整記錄。條件案例僅涵蓋screen下的這組layer/supports組合，沒有推論所有條件矩陣。

Node mapped graph的root／child共10個selector anchors都對回原始file、line、column及完整source content，含前置Unicode註解。輸入來自獨立owned檔案，PostCSS sourceMap一路串接，驗完清除。未主張synthetic新規則、generated global或全部declaration位置都正確。

首輪maps 10 FAIL：root重現producer未設定to，和Next loader實際from/to不同，產生錯誤來源基準；child又用了空plugin陣列，和root配置不一致。改用Next的from/to設定及相同configured pipeline後10 PASS，未改期望位置或產品。

獨立empty-plugin對照確認：即使用正確from/to，空PostCSS流程輸出mappings=AAAA，第二行selector查詢只得到第一行位置；configured noop則保留第二行。這是producer稀疏map證據，actual Next空配置影響仍須驗證，不能一併宣稱修復。獨立probe首次以lexical symlink建立require而MODULE_NOT_FOUND，改realpath後成功，屬腳本解析錯誤，沒有更動依賴。

## 保存與可接續步驟

本批只新增audit repro／帳本；原656來源輸入全部不變，加入新repro後657。493 shared artifacts及candidate49sources／54artifacts不變；沒有actual Next build、產品改動、既有測試修改、commit或promotion。沒有重跑未受修改影響的package checks。

0232 actual host10FAIL仍未修；49個既有remaining entries逐字保留並追加本批約束。0038身分驗證暫停、Firefox、所有未授權patch及原有raw/host/Sass/watch等需求保持。

下一批把0233階段機制與本批graph重新編譯接到owned Next prototype：優先重用既有compileRenderedStylesheet/sourceMap/resolveImport與per-owner資源能力，不擴充bundle API。先建立不可變lowered CSS輸入交給原生PostCSS，保留正確resourcePath／options與dependencies，並防止外層wrapper再次執行plugin；同時保留global／Module邊界與跨AST plugin語義。重新跑0232五個actual失敗案例及local控制，再查空plugin maps與完整圖／watch。

[API與browser/map結果](../evidence/0234-graph-maps-corrected.json) · [empty map控制](../evidence/0234-empty-postcss-map.json) · [總核對](../evidence/0234-final-checks.json)
