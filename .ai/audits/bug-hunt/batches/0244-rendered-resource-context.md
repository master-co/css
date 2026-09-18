# Batch 0244: Rendered resource context and PostCSS late resources

## 目前交接點

0243保留兩項獨立host反例：compiler／Next optimizer的selector provenance，以及Turbopack持久cache讀不到loader新建revision。兩者沒有因本批API變更而完成。本批opening核對664個selected sources及493個shared artifacts不變。

只在新的`tmp/0244-global-resource-api`擁有Compiler副本修改API、新增4測試與Site contract候選；原0242 API及Next候選未變，Next compiler link仍指向0242。Root只新增audit repro／patch及更新帳本證據，未promote／commit。0038身分驗證追加測試仍暫停。

## API與驗證範圍

公開Node `compileRenderedStylesheet`與Wasm `compileBrowserStylesheet`新增optional `emittedGlobals`，將既有Rust render session支援的資源計數向下傳遞。Node的qualified delivered graph同樣接收context。輸入型別限定rendered API，不把未使用的選項放到一般compileStylesheet。

正計數代表外部已存在的global，不重複輸出；新引用的transitive variables與keyframes仍輸出；零計數不能抑制資源。輸入snapshot不可變；不提供選項則維持原standalone輸出。未新增TS語義fallback，沒有改Rust、依賴、CI、release或shared artifacts。

6份Compiler source＋1份新test＋1份owned Site contract，共8檔delta：`repros/compiler-rendered-resource-context-on-0242.patch`。此patch以0242 source-preservation候選為base；已在0242做read-only apply check，未實際套用。不得視為可獨立套用root的patch。0242原19檔patch保持原樣。

API說明使用現有`site/app/[locale]/guide/directives/contract.mdx`；AGENTS所列content.mdx當前不存在。文件明列資源差集本身不會執行host plugins，host仍負責新CSS處理順序與publication。Root Site保留其他工作的修改。

| 驗證 | 結果與限制 |
|---|---|
| 新API Node／Wasm、qualified graph、零計數 | 4 tests PASS；驗證transitive closure、keyframes、旧值保留、輸入未突變及省略選項行為 |
| Compiler完整suite＋必要recheck | 累計428項通過；不是宣稱單次full run全部綠燈 |
| Build／types／lint | PASS；lint在最後fixture型別修正後再檢查 |
| 已安裝Next PostCSS＋Chromium／WebKit | 3 cases × 2 browsers，共6個有明確斷言的觀察；包含必要FAIL反例，非整體closure通過 |

第一次新測試3FAIL來自observer未接受空白，修正regex並保留exactly-one舊宣告斷言，4PASS。完整suite初跑425PASS／1testFAIL／1suiteFAIL：preset symlink解析到0242與缺少parity corpus均為隔離環境錯誤。改為own preset copy、read-only parity link後，entry＋新測試8PASS，session2PASS；原有測試未改寫。型別初跑的新graph fixture缺resourceURL，補齊required callback後PASS。這些不是新產品bug。

## 實際PostCSS資源差集反例

`repros/next-resource-delta-stages.mjs`載入0244 built public API、目前安裝Next的PostCSS及兩個真browser。插件Once修改已存在old變數為#123456，若late變數存在則改成#fedcba，並新增late引用與.once-N副作用。第一次Once看不到尚未輸出的late global。

| 最終策略 | 舊值 | 新值 | Once次數 | 判斷 |
|---|---|---|---|---|
| 不傳context，整份manifest再render | #111111 | #abcdef | 1 | 舊插件修改被覆寫，新global未經插件 |
| 傳emittedGlobals，只補差集 | #123456 | #abcdef | 1 | 舊值保留、新資源存在，但新global未經插件 |
| 差集後整套plugin再跑一次 | #123456 | #fedcba | 2 | 新值有處理，但副作用重複 |

兩browser的computed color／background均吻合表格。差集API解決「補新資源時覆寫舊值」，沒有解決任意PostCSS插件完整closure。未將此局部成功計為BH-0004／BH-0053修復，未把whole-plugin rerun當正式流程。

## 下一步

- 0245先釐清並驗證原生PostCSS lifecycle在單次plugin執行中，新增resource能否及時回到完整AST讓後續處理看見。用Once新增引用、Declaration visitor新增引用及OnceExit新增引用三類有界反例，保持舊值、每plugin執行次數、所有新global處理與Modules ownership斷言；先做獨立stage repro，不直接重寫Next流程。
- 差集context須正確反映被刪除／重命名的global，不能僅盲用初始計數。若現有API不足，先以可重現刪除對照定位，再決定下層語義責任，避免在host重做Rust識別。
- 保留0243 map／Turbo cache反例及所有host未完成要求。不得重跑已排除的host read／context dependency／cacheable(false)，或以禁用cache、猜selector map、忽略plugin副作用结案。
- 原59個remaining條目逐字保留，追加本批更新為60個歷史條目；不是60個獨立bug。61historical／57fixed／4unresolved，65checked／10blocked及pending approvals保持。

已確認原664sources、493shared artifacts、0242 API345sources／118artifacts、Next54source／64dist不變；本批root新repro後共665selected sources。新owned API inventory另存，dependency symlinks列明。所有測試／build／browser已結束；HEAD與空index不變，goal active。

[Final checks](../evidence/0244-final-checks.json) · [Stage evidence](../evidence/0244-resource-delta-stages.json) · [API inventory](../evidence/0244-api-inventory.json)
