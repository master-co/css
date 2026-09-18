# Batch 0245: PostCSS resource lifecycle and context synchronization

## 目前交接點

上一批0244是progress：隔離rendered資源差集API通過，但post-processing補入的資源漏插件；整套重跑會重複副作用。本批驗證原生lifecycle及可行的hook後補入位置，沒有把全部插件必須看見未來生成內容當作native保證。

Opening確認原665selected sources／493shared artifacts不變；0242 API、0244 API和Next候選均保持。僅新增audit repro `repros/next-resource-lifecycle-stages.mjs`與證據／帳本，未修改產品、候選source／dist、existing tests／fixtures、依賴、CI、release或Site。未commit；0038仍等明確身分驗證。

## 原生執行順序與27組對照

直接讀目前安裝PostCSS8.5.23的`lib/lazy-result.js`：先依plugin順序執行Once，再執行可因AST變動重訪的visitors，最後依順序執行OnceExit；OnceExit後沒有再次visitor循環。路徑與檔案SHA保存在stage JSON。這是當前安裝實作的本地證據。

固定fixture有old global及尚未引用的late manifest定義。producer在Once／Declaration／OnceExit三種時間加入late引用；consumer在同三種時間處理late值。consumer Once永遠只執行一次、把old改成#123456並新增.once-1。三種策略各9組：

| 策略 | 新global有經consumer處理 | 意義 |
|---|---|---|
| 尾端bridge的Once／RootExit／OnceExit補入 | 4／9 | 2組在同一root hook階段補入太晚；另3組屬原生時間順序限制 |
| 每個user Once／OnceExit返回後補入＋RootExit | 6／9 | 全9組輸出與pure PostCSS一致，無重跑Once |
| Pure PostCSS，producer同時新增等價普通CSS定義 | 6／9 | 原生對照，未載入Master作這些case的資源生成 |

所有case都保留唯一old:#123456及唯一late定義。9組wrapper／pure的late值逐一相等；不是只比較總通過數。兩browser逐一驗證computed color／background。27×2=54個lifecycle browser觀察，另8個刪改context觀察，共62個斷言全部成立。

原始tail-only跑法9組／26browser觀察另存`0245-resource-lifecycle-tail-only.*`，完整27組擴充後另存final JSON／log，沒有覆蓋原始反例。

三種pure也未處理late的組合：Declaration新增→Once處理、OnceExit新增→Once處理、OnceExit新增→Declaration處理。不能以這三項要求任意較早hook看到尚未產生的內容；這是對失敗來源的證據分類，沒有豁免Master必須保留native順序與資源完整性的要求。

兩個Master-tail特有差異：Once新增→Once處理、OnceExit新增→OnceExit處理。prototype在producer root hook返回後呼叫0244 compiler差集，於後續consumer執行前補入generated nodes，兩者都修正。Declaration階段透過RootExit補入後，PostCSS原生dirty visitor循環處理新節點。沒有額外手動重訪或整套plugin重跑。

此probe只涵蓋plain plugin objects／單Root／已知fixture ownership。不是正式Next dispatcher；尚未驗證prepare回傳hooks、function plugin、Document、多root、helpers/result/messages、exception context、clone／merge metadata、Modules scope、source maps及watch。不能據此宣布任意plugin已安全或完整交付。

## global刪除／改名後的context

另一對照在初始CSS移除old宣告，或把其prop改為color-renamed，但保留引用。沿用初始emittedGlobals會抑制old補入；兩browser的card顏色退回繼承的green。把已知fixture的old外部計數歸零，Rust差集便輸出old，顏色恢復#111111。兩操作×兩context×兩browser=8個觀察。

這不是emittedGlobals API自行識別錯誤：呼叫方傳入的「仍存在」snapshot已不符合當前AST。正式host必須定義並維持所有權／刪改計數；不能盲用第一次render結果，也不能把本fixture的硬編碼歸零當成一般偵測方案。故BH-0004／BH-0053尚未結案。

## 可直接接續的下一步

- 0246先在新的owned Next副本設計request-local PostCSS adapter，保留0242原候選與0244 API。現有`webpack-postcss-loader.ts`保存native options物件，Next native loader以`await options.postcss()`取得`postcssWithPlugins`再process。這是可驗證接點，不能修改共享cached processor.plugins或全域plugin objects。
- 先以實際native loader建立bounded adapter測試：per-request manifest／context；包裝prepare結果和Once／OnceExit時維持this、helpers、錯誤與messages；資源插入標記必須符合既有global／Module所有權。不同並行options及來源不可污染，Once次數與pure輸出要有非空斷言。
- global刪改計數先確認Rust-backed現有resource能力及ownership資料能否提供正確snapshot；未驗證前不整合stale counts。不能以host文字猜測重寫Rust語義。
- 原0243 selector provenance及Turbo cache publication反例、完整Sass／watch／SSR等全保留；不要重做已排除的cache workaround。所有60個歷史remaining條目逐字保留，追加本批為61項歷史描述，非61個新bug。

維持61historical／57fixed／4unresolved及65checked／10blocked；pending approvals不變。Final核對原665sources／493shared artifacts、Next54／64、0242 API345／118與0244 API100／62全部不變；root新增repro後666selected sources。Next compiler link仍0242，HEAD與空index不變，goal active。全部probe與browser已終止；本批無product變更需package lint，script syntax及AI context檢查另記final evidence。

[Final checks](../evidence/0245-final-checks.json) · [Stage results](../evidence/0245-resource-lifecycle-stages.json) · [Summary](../evidence/0245-lifecycle-summary.json)
