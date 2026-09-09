# 0166 Local URL delivery

## 基線與範圍

- 上輪已提交0163–0165查核（fe170da1b）；228來源雜湊一致。上一goal turn為有效進展：查核收尾及提交完成。
- 本批驗證local CSS以?url交付，root／child的compose、qualified imports及資源是否保留；以actual Vite dev/build與瀏覽器為準，再區分其他query與pure Vite限制。
- BH-0004整體仍未完成；47historical／35fixed／12unresolved、10blocked／4root gates／4原候選+1host shutdown限制保持。0038身分確認未收到，不執行暫停追加驗證。此次不commit/push。

## 首輪證據

- CSS ?url正式build36、development72個三瀏覽器觀測全PASS，包含子檔compose、media切換、資源精確bytes／query-fragment／像素及child/resource HMR；bootID維持。
- 新16個actual Vite dev/build測試涵蓋?url及自訂?theme=dark。首次程序exit1但log只到RUN、沒有測試結算，原因未定，不當作產品失敗或PASS；同一handle確認terminal後第二次verbose得到完整16FAIL，皆為測試字串斷言僅接受min-width:700px。實際Vite輸出等價width >= 700px，browser窄／寬控制PASS；修正新測試接受兩種等價寫法，產品未改。
- installed Vite CSS load hook會在build把?url轉為?transform-only，因此local graph正常走現有交付；serve連結請求則重新進CSS transform。不能直接刪除isRawStyleRequest的url排除，否則可能把Vite載入的JavaScript誤當CSS。

## Sass URL retained graph HMR

- 實際Sass ?url瀏覽器初始／viewport控制通過，child update後失敗；新增8個actual-server回歸在四mode×兩base均FAIL，缺少對/style.scss的css-update。這是BH-0004既有graph範圍中的產品缺口，沿用ID。
- SassSourcePlugin原只從preprocessor cache尋找owner，retained CSS／resource是後續compiler graph透過Vite addWatchFile登記，因此漏送attached URL。更新時另外取Vite hotUpdate modules的Sass owner，沿用既有URL追蹤及失效／通知流程；不新增CSS語義或另設檔案監看。

- 首次owner補法只看更新module本身，8新回歸仍FAIL／2舊控制PASS；trace證明child是id=null、importers指向Sass proxy的file-only節點。修正改沿既有importers尋找owner，Set防循環且找到owner即停止該分支；10個新舊回歸PASS。加入不相干Sass URL不收到通知及每次內容與上一版不同的控制，再跑全套。

## Sass URL build identity

- 修前Sass development矩陣自然exit1，共72observations：36初始／viewport PASS、36更新FAIL；後續resource phase仍期待先前child新顏色，不能把這些連鎖失敗當獨立缺陷。修後72observations全PASS，child／resource更新及bootID維持。
- Sass ?url正式build在首mode即失敗、尚無browser觀測：Vite css-post找不到style.scss?transform-only內容。另8個actual-build對照為pure Vite4PASS／Master4FAIL，證實integration問題。
- Vite CSS URL token原先記原始Sass identity，transform-only卻被SassSourcePlugin解析成proxy；修正讓build Sass ?url在Vite建立token前先解析成同一proxy，URL module仍交給Vite load，transform-only child才載入prepared CSS。保留raw及Vite不支援Modules ?url的行為，未新增URL字串／CSS語義fallback。

## 全套回歸發現numeric slot

- URL修正後32focused PASS，但全套336PASS／1FAIL：原0164的local minifier test偶發丟失第二entry，留下--slot:3.40282e38abc5ae1aacae。原hash 206e6653abc5ae1aacae被CSS optimizer解析成數值dimension並改寫。此為BH-0004已做placeholder方案的未覆蓋產品問題，不是測試誤判。
- 新actual-build回歸在owned temp root選取SHA以數字+e+三位數字開頭的真实檔名；修前穩定FAIL。slot值加local-前綴變成CSS identifier，保留各entry獨立性，避免數值正規化。

## 最終驗證與下一步

- numeric slot修正3focused PASS；最終完整338tests／52files、Vite lint/types/build及原範例build PASS。新增Sass raw原文與Modules URL限制pure/plugin對照均通過。一次新負面控制的spy多載型別造成TS2339，改用原生matcher後8focused及types PASS，未改產品以遷就測試。
- 最終產物6個matrix共324三瀏覽器觀測全PASS：CSS ?url、Sass ?url及自訂?theme=dark，各dev72／build36。驗證兩層qualified imports、media窄／寬、leaf compose、外部CSS、資源MIME／exact bytes／query-fragment／canvas像素、child/resource HMR與bootID維持。所有程序自然結束；先前72個Sass HMR修後觀測是中間版，不重複算入324。
- Site prepare/lint PASS，0errors／75既有warnings；僅更新現行contract.mdx與Vite README，未建立不存在的content.mdx。5個runtime/compiler Wasm／runtime JS／manifest產物hash不變。來源保存與最終狀態見0166-final-checks.json。
- 這些只完成bounded local query交付；CSS Modules跨import export ownership、retained Sass／maps／reference/resource owner、build-watch／missing recovery、base／asset naming／SSR assets、local environment replacement/restart/close仍待驗證。下一批先以pure Vite比較Modules跨import export ownership，再續其他原要求。
- Nuxt子CSS實際browser、Webpack graph／shared-dist race、BH-0029與10個benchmark問題、4root gates、4原候選及1host shutdown限制保留；0038未收到明確身分確認。本批未commit/push，目標active；記錄阻礙不算完成。
