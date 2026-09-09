# 0164 Vite local graph publication

## 基線與範圍

- 上輪0163 compiler delivery完成，239tests／18browser通過；Vite子檔compose仍8FAIL（完整261PASS／8FAIL）。221來源雜湊一致，HEAD282a9fb88；上輪屬有效進展。
- 接LocalComposePlugin的dev/build完整assets交付。現有SassSourcePlugin會先經Vite Modules/Sass預處理，保留imports，再產生CSS代理及scoped exports；新路徑須重用此行為。
- 47historical／35fixed／12unresolved、10blocked／4gates／4原候選與1host shutdown限制維持。0038身份確認未收到；不commit/push。

## 進行中

- 依既有compiler graph、dev snapshot與inline URL helpers實作local graph發布；不能只替換root CSS而漏發布children/resources。保留完整模式、Modules／Sass／SSR／HMR與hash驗證要求。

## 已確認的實作與證據

- LocalComposePlugin在resolve kind=local後，向transformStylesheet傳入既有delivery、Vite resolver、Sass原owner及watch callbacks。dev使用publishDevStylesheets的Rust bundle／版本資產服務；build inline重用既有inline URL/renderBuiltUrl流程；一般build以各入口獨立佔位規則保留原位置，最後由Rust graph組合再命名／發布完整CSS與resource assets。
- CSS Modules仍由既有SassSourcePlugin先經Vite預處理並提供scoped exports，沒有把已處理的根檔改成未scoped的CSS。新增8個actual-server/build controls驗證四mode的root scoped exports、SSR inline、raw source及child compose；此範圍不代表所有跨import Modules exports組合完成。
- 0163原8個child compose FAIL已修復，23focused全部PASS；首輪完整Vite269PASS。新增requests／命名／minifier控制後，最終279tests／48files全PASS；Vite lint/types/build與原範例buildPASS。Compiler僅README更新，lintPASS。
- 非同步local註冊順序原會改變provisional assets及最終hash；新order控制修前FAIL，改固定replacement處理順序後PASS。原CSS內位置仍由Rust slot composition保留，不依註冊順序排列CSS。
- 多入口browser首輪12FAIL，保存當時actual dist檢查：Vite minifier將兩個相同--slot:0規則合成selector list，導致未替換的佔位符成為唯一CSS。新增實際minified build回歸同樣FAIL；每個local slot使用不同hash值後PASS，修後多入口browser36PASS。這是本輪新增實作中發現並修正的缺陷，沿BH-0004，不新增歷史問題ID。
- 第一版requests測試錯把所有__MASTER_CSS_INLINE_字樣當未替換token；實際是既有合法runtime .replaceAll的_BASE字串。只檢查裸token後8requests通過，未更改產品遮蔽斷言。
- 多入口重現的第二份external CSS改用獨立.secondary規則，避免腳本額外向target加入無media限制的border，污染viewport控制；首輪真正產品失敗由独立minifier回歸證明。
- 最終browser重現檢查actual child compose padding32px、external border7px、media縮窄為0、restore、SVG exact bytes/MIME/query/fragment與canvasRGBA；開發模式child edit／image藍→紅更新且bootID不變。最終矩陣／程序狀態見0164-final-checks.json，包含修後多入口CSS順序及Module root exports。
- 公開Vite／compiler README及Site contract同步已驗證範圍。Site現行正式語義在contract.mdx，content.mdx不存在，不重建舊入口；只更新現行contract。Site prepare/lint完成（0errors／75既有warnings），未build Next或更改其他對話Next設定。

## 可直接接續

- 次批補local根檔沒有directives、只有imported child含directives的分類／交付；local ?url及其他query、Modules跨import exports語義（對照pure Vite）、retained Sass imports／original diagnostics與resource/reference owner。
- 再補local build-watch、刪除恢復／多入口重建、base／assetFileNames／renderBuiltUrl各組合、SSR asset策略、old versions／environment replacement／restart／close；不能直接沿用managed-entry證據宣稱local全部完成。
- 虛擬來源／其他preprocessors／PostCSS／maps、Nuxt實際子CSS、Webpack完整graph／並行dist與全部原問題、root gates、候選保留。0038未獲明確身分確認；本批未commit/push，47historical／35fixed／12unresolved及全部未完成範圍不變。
