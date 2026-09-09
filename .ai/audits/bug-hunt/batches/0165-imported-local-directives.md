# 0165 Imported local directives

## 基線與範圍

- 上輪0164 Vite local graph交付修正，279tests／252browser通過，屬有效進展。225來源雜湊一致，HEAD282a9fb88。
- 本批先處理plain root／中間檔沒有directives、leaf才有@compose的分類與交付；以Node及Vite custom resolver和actual dev/build重現。
- 47historical／35fixed／12unresolved、10blocked／4gates／4原候選與1host shutdown限制維持。0038身份確認未收到；不commit/push。

## 進行中

- preserveImports分類只檢查graph的master entry，local判斷仍限root；delivery transform也先對root做early return。先驗證這兩個接點，再重用現有Rust-backed local判定而不新增TS語義解析。

## 結果與修正

- compiler修前2FAIL／1PASS：Node及自訂resolver皆把plain root→plain bridge→local leaf誤判plain。Vite擴充矩陣修前24PASS／8FAIL，四mode的dev/build會輸出原樣@compose，缺少padding；保留原16controls。
- 把既有hasLocalStyleDirectives（仍讀Rust compileCSS結果）移到內部directives helper供分類與delivery共同使用；沒有新增TS parser／語義fallback。已在首次修改前為此既有檔補baseline hash（初始225+1）。
- preserveImports分類先保留master entry優先權，再檢查整張prepared graph的local directives。transform的delivery路徑不再只以root做early return；graph全為native時回傳原source、transformed=false，不讀取／命名host-owned resources。無delivery原single-source contract不變。
- 新3個compiler controls涵蓋兩種resolver、两層imports、local classification／dependencies／原root source保持、leaf compile及純native missing-resource不被接管。7focused及完整242tests／32files全PASS；compiler lint/types/build通過。
- Vite沒有產品source變更；改用新compiler後完整295tests／48files全PASS，含新增16個root-directive有／無controls。Vite lint/types/build與原範例build通過。
- actual三瀏覽器新repro使用root→bridge→leaf；root／bridge均native，leaf才compose，且qualified import保留external CSS與特殊字元SVG。CSS、root Modules及Sass（root含實際Sass變數）development／build，加build inline，共360observations全PASS；media窄化／還原、padding32px、external border7px、SVG exact bytes／MIME／query-fragment／canvasRGBA及child/resource HMR都驗證，bootID保持。此Sass證據只覆蓋這個retained CSS import圖，不代表全部Sass／Modules輸入組合。
- 3份公開文件同步plain-root行為，Site仍只更新現行contract.mdx，不建立不存在的content.mdx。Site prepare/lint與最後source/artifact保存見0165-final-checks.json；root gates未覆寫／未宣稱完成。

## 可直接接續

- 下一批接local ?url／其他query交付，並以pure Vite對照Modules跨import export ownership；再續retained Sass／maps／reference與resource owner、build-watch／刪除恢復、多base／assetFileNames／renderBuiltUrl、SSR assets及local graph lifecycle。
- Nuxt實際子CSS、Webpack graph／並行dist、BH-0029及10個benchmark問題、4root gates／4原候選與host shutdown限制均保留，不能以本批Vite結果代替其他host驗證。0038明確身分確認未收到；47historical／35fixed／12unresolved、10blocked維持。本批未commit/push。
