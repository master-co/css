# 0003 Static variable dependencies

- 目的：static variable 無 class 使用時及 ensure/delete/refresh 後，依賴是否仍正確保留。
- 範圍：CRATE-mastercss-engine、CRATE-mastercss-compiler、PKG-compiler、PKG-preset。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9。
- 工作目錄：帳本、engine/render 新測試；產品檔案未變動。
- 已讀：engine manifest/resources 與 static resource 既有測試；後續載入 compiler/manifest/preset local context。
- 資料流：CSS theme static → manifest variables static/dependencies → initialize_variable_resources → theme CSS。
- BH-0003 待驗證；下一步 baseline 與最小 static/dynamic dependency 對照。

## 結果：BH-0003 P2 已確認

- 定位：`crates/mastercss-engine/src/resources.rs:160`，初始化 static variable 只增加本身 count/name，沒有走 dependency 註冊。
- 觸發：`@theme { --color-base: red; } @theme static { --color-brand: var(--color-base); }`，無 class 使用。
- 預期：static brand 與其動態 base 依賴都輸出，brand 可立即被 CSS 使用。
- 實際：僅 `@layer theme{:root{--color-brand:var(--color-base)}}`，base 缺失。ensure `fg:brand` 暫時補回，但 delete 後又移除 base，留下無法解析的 static token。
- public compileRenderedStylesheet 同樣重現；compiler 正確產出 dependencies，根因在 engine 執行。
- 預期依據：directive guide `@theme static` 保證初始資源；engine 既有 dependency 註冊/取消語意；對照動態 class 使用時的正確輸出。
- 修正方向：初始化 static variables 經既有 dependency traversal 保留完整依賴並維持 static reference baseline；涵蓋 cycle、共享依賴、inline 與 emitted globals，不新增 TS fallback。

## 證據

- `cargo test -p mastercss-compiler`：26 passed，exit 0。[baseline](../evidence/0003-compiler-baseline.log)
- `node --import tsx .ai/audits/bug-hunt/repros/BH-0003.mjs`：exit 0，列出 initial/ensure/delete/public compile 結果。[log](../evidence/0003-static-repro.log)
- `cargo test -p mastercss-engine --test bug_hunt_static_dependencies`：2 regressions failed，exit 101。[log](../evidence/0003-static-tests.log)
- 新檔：`crates/mastercss-engine/tests/bug_hunt_static_dependencies.rs`。`cargo clippy -p mastercss-engine --test bug_hunt_static_dependencies -- -D warnings` 通過。[log](../evidence/0003-clippy.log)
- 本批完成。其餘 manifest/selector/parser 邊界留 0004；不修改產品修補此問題。
