# 0163 Local compose graph delivery

## 基線與範圍

- 上輪已提交BH-0047修復5e707ec75及0159–0162帳本282a9fb88，133排除檔案byte-identical，屬有效進展。218來源雜湊核對一致。
- 接BH-0004的local @compose根檔，qualified child含nested external import；先檢查四mode的actual dev/build。
- 更正0162下一接點的型別描述：當前MasterCSSStylesheetCompileOptions已含delivery，TransformOptions繼承它；但transformLocalStylesheet仍走單字串compileStylesheetResult，未消費graph交付結果。以當前來源為準，不能因繼承型別的存在就認定行為完成。
- 保留47historical／35fixed／12unresolved、10blocked／4gates／4原候選與1host shutdown限制；0038身分暫停維持。產品修改依持續目標既有授權；本輪不commit/push。

## 進行中

- 新增actual-server及build控制，先保存修前輸出，之後依compiler owning層結果選擇最小必要修正。

## 結果與分類

- 8原生child controls先PASS，只能证明條件與內容仍存在，不能代替瀏覽器cascade證據。再加child @compose的16cases為8PASS／8FAIL，四mode的dev/build都把未編譯@compose交給瀏覽器，缺少padding。歸BH-0004未完成local graph範圍，不增新ID。
- compiler transform在delivery存在時，使用既有Rust graph compiler及resolutionManifest，回傳entry code、retained stylesheets/resources與dependencies；Rust處理共同authoring definitions、compose位置、條件及resource relocation，TS只準備來源／主機URL並呈現globals。未傳delivery沿用既有single-source contract。
- 新source-supplied reference控制在根檔不存在於磁碟時揭露realpath要求錯誤；改沿用存在時realpath、否則resolve的來源identity。2引用globals／去重控制恢復PASS。新types為既有TransformResult追加optional stylesheets/resources；未改exports names／依賴。
- 4compiler controls涵蓋Node及host alias、child compose／根檔引用child definition、external條件／resource query-fragment、immutable回傳、reference globals與去重。首輪完整suite的2FAIL是測試期待blue、實際正確canonical #00f；改斷言後239tests／31files全PASS。lint/types/build通過。
- standalone compiler交付18browser觀測（supports真／假×三browser×900→500→900）全PASS：root使用child utility、conditional child padding32px、external border7px、SVG紅色RGBA及URL/MIME，page/HTTP errors空。首次脚本誤用preset/dist路徑尚未開始觀測即ENOENT；改由compiler package解析正式preset export後自然exit0。腳本錯誤不列產品缺陷。
- Vite完整269tests為261PASS／8FAIL，原253全部PASS、新原生child8PASS、新child compose8FAIL。這是未接delivery的實際產品失敗，不是既有fixture問題；仍需實作。Vite lint/types及原範例buildPASS；沒有修改Vite產品source。API census及package contracts命令exit1；census與0141比較僅package-manager命令banner／exit行差異，未修gates／未更新golden。

## 可直接接續

- LocalComposePlugin目前仍呼叫transformStylesheet而不傳delivery，僅return result.code。接已驗證的compiler assets結果；dev可重用publishDevStylesheets的Rust bundle／version lifecycle，build須將local assets納入發布與hash，不能只回root CSS遺漏children。
- 必須保留Vite對CSS Modules scoped exports／composes、Sass source mapping、SSR inline及raw的既有行為；不能一律外部化root而繞過Vite Modules轉換。另驗import order／layer／supports／media、resource/reference owner、後續編輯／刪除恢復、old版本／close清理。
- 續local plain-root imported directives、virtual root／child及host-specific reference/resource resolvers、其他preprocessors／PostCSS／maps、Nuxt實際子CSS、Webpack graph／並行dist及全部原未完成項目。0038明確身分確認仍未收到；本批不commit/push。
