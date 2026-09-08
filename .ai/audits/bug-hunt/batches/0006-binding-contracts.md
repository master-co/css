# 0006 Native and Wasm delivery contracts

- 目的：相同 semantic sessions 經 native/Wasm 的載入、錯誤、版本、disposal 契約。
- 範圍：4 binding crates；PKG-binding、3 Wasm delivery packages、8 native target packages。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；正式程式未變更。
- 先讀 README/coverage、0001/0005 fresh build evidence；native binding AI、delivery manifests、loader/adapters/tests。
- 本機 Darwin arm64；其他 OS/CPU 的 binary execution 不可用，必須記錄受阻，不能以 mock 代替。
- 下一步：fresh tooling Wasm build、binding tests、platform package/artifact census。

## 資料流與驗證

- native-loader target/libc selection → explicit/development/package artifact → dlopen/ABI assertion → engine/compiler/tooling adapters；同源 Rust session 的 JSON/native object serialization 與 disposal。
- Wasm provider → module/input cache → init failure normalization → session wrapper → Rust ABI。已讀 provider/index、native engine 與 Wasm engine/lib 的配對。
- fresh `cargo xtask build-wasm tooling` 成功。[log](../evidence/0006-wasm-tooling-build.log)
- 4 delivery package `vitest run`：native 17、Wasm engine 7、compiler 4、tooling 4 passed；包含 explicit modules/input cache、file URL、錯誤、ABI、dispose、scanner handles。[log](../evidence/0006-binding-tests.log)
- `cargo test -p mastercss-binding-native -p mastercss-binding-wasm-engine -p mastercss-binding-wasm-compiler -p mastercss-binding-wasm-tooling`：編譯成功，各 0 Rust unit tests；動態契約證據來自上述 TS tests，不能把 0 tests 算成行為驗證。[log](../evidence/0006-binding-crates.log)
- 8 target manifests 的 os/cpu/libc/files 與 loader registry 一致。[census](../evidence/0006-target-packages.json)
- `cargo xtask stage-native-target binding-darwin-arm64` 後直接 dlopen 該 target binary 並執行 `mcss --binding-info`：ABI 6 / aarch64-apple-darwin、CLI exit 0。[stage](../evidence/0006-darwin-stage.log)、[smoke](../evidence/0006-darwin-smoke.log)
- staged 兩個 binary 原先不存在且未被 ignore，驗證後僅刪除本調查建立的這兩個檔案。其餘 build artifacts 位於既有 artifact/cache 目錄。

## 工作目錄變化

- 新觀察到 `site/reference/` 外部工作，並非本批命令建立；保留、不加入本批結論。[path inventory](../evidence/0006-worktree-new-paths.json)
- 未見 tracked 產品檔案修改。後續 site 批次須核對該目錄，不能當作起始 commit 的程式行為。

## 結果與限制

- 未確認新的 binding bug。4 binding crates、4 loaders、Darwin arm64 delivery 的列明檢查完成。
- 另 7 native target packages：metadata/selection checks 通過，但缺少對應 runtime 與 staged binaries，受阻，不計已檢查。
- 未執行發布、安裝或跨平台真實 binary 驗證。各 target packages 沒有 lint script，本批亦未修改其原始檔。
- 本批完成，下一批 0007 server HTML/render/hydration contract。
