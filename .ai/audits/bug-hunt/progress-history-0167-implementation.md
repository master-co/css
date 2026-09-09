# 0167 investigation handoff preserved verbatim

- 0167進行中：CSS Modules @import的子檔exports遺失已確認；dev/build共240browser為144PASS／96FAIL，composes與pure Vite控制PASS。補充48browser證明plain CSS子檔可外洩到全域同名元素。新增2回歸FAIL，原338及2個composes控制PASS（全套340PASS／2FAIL）；產品尚未修。Vite一次Modules處理可保留分段原型，但composes注入內容無來源，需先解決來源與scoping context，再保留Rust import圖接回host。已修正公開文件，0164/0165根模組控制不能代替跨檔exports驗證。下一步續本批實作與回歸；47historical／35fixed／12unresolved、10blocked／4gates／4原候選+1host限制及0038身分暫停保持；HEADfe170da1b，未commit/push。[0167](batches/0167-imported-module-exports.md)。
