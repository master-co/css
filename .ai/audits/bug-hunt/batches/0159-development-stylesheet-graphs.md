# 0159 Development stylesheet graph delivery

## 基線、範圍與目前狀態

- 0158的71獨立控制與CSS調查收尾修正為有效進展；本批前來源雜湊一致，HEAD42ccdc182。0038身分暫停不變，未授權提交新工作。
- 接BH-0004 development qualified import500。原始重現見0158-qualified-dev-drained.log，四模式新HTTP graph測試已通過；整體dev／HMR、SSR與既有回歸仍驗證中，尚不能結案BH-0004。

## 實作方向

- 沿用compiler graph registration/composition與Rust bundle renderer的inlineImports；只有經Rust判定安全的子檔展開，含external imports等須保留的子圖透過開發端CSS URL交付。
- 新dev-stylesheet-delivery helper依context配置獨立private URL namespace，以暫時external origin通過Vite CSS pipeline，post hook移除該次namespace專屬origin，成為同源URL。沒有以TS重新實作CSS條件或匯入語義。
- CSS middleware回應已編譯子檔，內容版本query促使HMR重新取得；resource以owner/content雜湊命名，僅已註冊resource轉交Vite的/@fs回應及MIME處理，保留原query/fragment。current graph map隨compose更新，關閉依scanner environment ownership清理。
- serve註冊／組合接入delivery；entry分類保留imports／Sass owner，沿用Vite resolver。StyleEntry的dev來源已包含完整managed/native graph，不再將原始CSS重複插回。

## 目前證據與未完成

- 新4actual-server cases涵蓋static/runtime/pre-render/progressive；根CSS、條件child、external import與SVG200、MIME及query/fragment皆PASS。
- 首次4FAIL是新測試硬比supports空白、舊min-width序列化與color空白；實際Rust輸出為等價supports(display: grid)、width >= 700px。修正新測試只驗證同一條件，原始log保留，不算產品bug；瀏覽器仍須驗證寬／窄視窗行為。
- lint/types首次PASS；完整Vite tests正在進行。尚缺build及qualified瀏覽器/HMR矩陣、SSR／多root／資源變更與既有Sass/Modules相容性。
- local @compose的完整dev輸出、其他preprocessor/PostCSS、maps、resource/reference、其他host、Nuxt/Webpack及所有原有未完成範圍不縮減。46historical／34fixed／12unresolved、10blocked／4gates／4原候選+1host shutdown待辦仍維持。

## 續查證據（尚未收尾）

- 使用者授權的完成項目已提交8c16c3f42（BH-0046）及b306e5d77（0157–0158帳本），本批產品及材料保留未提交。前一輪為有效進展；0038暫停維持。
- 首輪完整Vite211PASS／2FAIL：兩個既有字型測試只認入口保留bare import；新Rust delivery可安全inline或保留child，已改為沿實際發布imports查font-face、Fira Mono及base。未改fixtures/snapshots。首次修正仍假定入口必有import，屬測試oracle錯誤；最後18focused通過。
- 首轮qualified browser為45PASS／3FAIL，兩production build通過；所有dev條件／external／資源初始與viewport控制通過，僅pre-render的theme變更保留舊SSR樣式。普通無qualified CSS的新actual-server控制亦重現，與BH-0004獨立；pre-render在manifest／emittedGlobals改變後發full-reload，progressive仍使用runtime HMR，native-only變更不reload。初版漏return changed已修正；首輪types的spy overload錯誤也修正。瀏覽器修後證據仍待。
- SSR新增控制先只查入口的layer而漏跟child，屬新oracle錯誤；改沿全部發布child後四mode皆重現layer(guard)兩次。StyleEntry serve註冊改用公共resolution.id，保留原id作HMR importer；build id不變。canonical後18focused全PASS。
- 第二輪完整Vite發現舊pre-render手動hook測試只傳file，缺少真實HmrContext必要server；新增最小ws spy並驗證full-reload，不以optional chaining隱藏主機契約。相關完整suite仍需終態與修後重跑。

## 最終結果與接續

- canonical後完整215tests／40files通過；既有pre-render單檔修正後5PASS。Vite lint/types/build與原master-css-vite-example build通過。首個範例指令誤用example.vite filter，沒有執行build，空log保留、不算PASS；改正package名稱才取得實際產物與terminal0。
- BH-0047（P2）確認並修復：普通CSS actual-server theme變更修前1FAIL、progressive對照PASS；修後兩cases及既有pre-render5PASS。built-plugin三瀏覽器supports真假兩矩陣共4production builds／96observations全PASS，涵蓋dev／production、wide／narrow／wide-again／theme-update、external巢狀匯入、resource、computed style及單一SSR style。bootID斷言確認pre-render theme後reload，progressive與其他階段不reload。
- BH-0004只完成本批明列development entries及SSR來源去重，不宣稱整體已修復。LocalCompose實際轉換仍走legacy；virtual loader／reference ownership、resource變更與URL特殊字元、共享root及environment對retained資產的生命週期仍缺驗證。Nuxt子CSS真實交付、Webpack並行dist、其他preprocessor／PostCSS／maps與全部原有未完成範圍保留。
- 47historical confirmed／35fixed／12unresolved、65checked／10blocked、4root gates、4原候選與1host shutdown限制；0038身分暫停維持。下一批先驗證graph資源更新與shared-root／environment，觀察CSS版本、資源URL及舊請求可達性，再按可重現失敗修正。本批無commit/push。
- 0158共同交接與較早長段落逐字歸檔，proof保存text／SHA及來源映射。一次帳本更新指令因輸入編碼失敗、未執行任何寫入；改用ASCII JSON傳遞後完成。來源／產物保存與全部命令終態見0159-final-checks.json。
