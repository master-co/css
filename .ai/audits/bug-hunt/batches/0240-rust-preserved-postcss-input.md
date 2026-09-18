# Batch 0240: Rust-owned preservation of PostCSS input

## 目前交接點與範圍

0239為progress：ordinary CSS原文分流已驗證，Master-bearing輸入仍有精確反例。Opening661selected inputs／493shared artifacts／Next54sources／64dist符合0239。沿用55個remaining歷史條目，新增限定原型進展，沒有縮小完整目標或改問題ID。

本批**Next候選仍是0239，src／dist完全不變**。兩個獨立Rust workspace只在audit tmp內，用per-command `MASTER_CSS_NATIVE_BINDING_PATH`載入各自node binary；root產品、root既有tests、共享native/Wasm產物、依賴、lockfile、CI/release及Site皆未更動。沒有commit或promotion。

## 原型一：只延後minify並不足夠

`tmp/0240-rust-lowering-prototype`僅從directive native printer移除minify，使用現有Cargo.lock／offline locked建置，獨立target dir。117個既有Rust compiler tests全PASS。

公開API階段結果：空rule、media空rule、theme空rule不再消失，相同宣告rules不再被合併；但comments仍由parser丟棄，值寫法仍由printer正規化。沒有更改TS語義或加入dependency。

四組actual Next案例，三種模式完整對照：

| plugin依賴的輸入 | 0239 candidate | 只停minify原型 | 純Next |
|---|---|---|---|
| theme＋空rule後加ICSS | build失敗 | 2browser PASS | 2browser PASS |
| theme＋兩條同宣告rule，只選.shared | 2FAIL | 2PASS | 2PASS |
| theme＋comment作為plugin開關 | 2FAIL | 2FAIL | 2PASS |
| theme＋原始margin四值寫法 | 2FAIL | 2FAIL | 2PASS |

這證明不能把停minify當作完整修正，原始失敗和對照完整保留。

## 原型二：Rust複製未變動區段

`tmp/0240-rust-preserved-source`使用現有Rust CSS lexer statement/block範圍、compiler已消耗定義的offset與原生lowering slots的location，只刪除已消耗定義、替換需要lowering的style/variant區段，其餘文字保留。包含巢狀container內未改動的siblings、comments、空rules及原始值。沒有在TS補回或解析CSS語義。

四個新增Rust controls通過：普通原文／空rules、Unicode及字串內假directive、media內lowered slot與未變sibling、全managed輸入沒有殘留native空白。仍不保證需lowering的整個style區段內每個原始token保持，也沒有宣稱所有CSS grammar／pruning／inline/source map情形已覆蓋。

原型一和二都只作實驗；第二版目前是無條件改變一部分compiler預設輸出，**不能直接promote**。全Rust compiler矩陣118PASS／3FAIL：既有theme native格式、escaped unknown at-rule的正規化字形、quoted marker的quote字形。已讀原斷言和實際輸出，未更動或削弱tests；正式設計要把source preservation限定在host準備階段，維持原預設契約。

## Actual host、maps與後續修正

第二版8actual builds全部成功／16browser PASS：上述四案，加local generated compose、combined-root theme修改、ICSS child global animation、子目錄theme圖片含空白檔名。這只證明bounded browser行為，不取代Rust預設契約和map驗證。

首輪18map assertions有14PASS／4FAIL。其中一項要求沒有自身宣告的ICSS-only rule輸出selector，是觀察腳本錯誤；延伸既有明確empty-fixture省略規則，且必須斷言沒有自身CSS，root／leaf仍要有精確定位。其餘三項是真實map問題。

Rust新增精確copy anchors：使用複製區段的source offsets、既有lexer token邊界和行起點，把原始UTF-16位置映射到輸出；不猜測CSS文字相似度。修正後重新跑8actual builds／16browser全部PASS，17個必要selector anchors中15PASS／2FAIL。comments案例完整sourcesContent缺theme的問題已修；剩下：

1. 最終合併的`.other_shared__` selector錨到sibling的原始column48，而非shared的26。實際輸出顯示最終CSS仍合併兩個selector；需定位後段optimizer與map鏈，不可只放寬欄位斷言。
2. ICSS child animation的originalSource少了`app/`，指到fixture root。需檢查native PostCSS AST序列化、global保護與相對map來源，不能改expected path掩蓋。

最終mapped原型cargo build／4focused tests／all-targets all-features clippy（-D warnings）通過；全Rust矩陣仍118PASS／3格式FAIL。一次生成Rust patch時newline字元escaping錯誤造成build失敗，已修正，保留兩份build logs並歸類為原型編輯腳本錯誤。

本批共28actual builds，27成功／1失敗；44browser PASS／10FAIL含所有baseline／第一版歷史反例。最新mapped原型為8build／16browser PASS，不能把aggregate數字當作全部修好。沒有重跑未修改Next套件的128tests／3e2e；0239證據仍是當前Next候選驗證，不能據此宣稱新Rust原型全面通過。

## 保存與下一步

- 第一版patch：`repros/next-rust-deferred-minify-prototype.patch`；117tests PASS但comments/value行為不足。
- 第二版初始patch：`repros/next-rust-preserved-source-initial.patch`；初始host binary `tmp/0240-rust-preserved-source/mastercss.node`保留。
- 最新mapped patch：`repros/next-rust-preserved-source-mapped-prototype.patch`，4個Rust source/test檔，root read-only apply-check PASS；binary為同目錄`mastercss-mapped.node`。完整source／binary雜湊見0240-rust-preserved-inputs-final.json。
- Cargo target在`tmp/0240-rust-target`，切換兩個原型的crate路徑需重建；不要覆寫已保存binary。Next仍用`tmp/master-next-copy-3z8i_q4c/packages/next`的0239候選，不要把預設binding全域改到原型。

0241從mapped原型接續，優先修兩個實際map反例並加對照；同時把source preservation設計為compiler擁有的明確host準備選項／API，保持預設輸出和現有tests，完成native/Wasm契約與必要文件再考慮交付。不得直接採用無條件printer替換或只覆寫golden。

新增global引用仍未修：0239證據證明空manifest會漏late globals，重新生成全manifest會覆蓋plugin已改變的變數。需要既有emitted-globals／session及PostCSS lifecycle的完整方案；新增child Master定義、synthetic edge刪改、ownership／metadata、Sass／watch／清理／SSR／Turbo／Firefox／raw gates及其他帳本項目全部保留。

0038仍等待explicit identity確認；既有pending approval與no-commit限制不變。Goal active。

[總核對](../evidence/0240-final-checks.json) · [全部host摘要](../evidence/0240-summary.json) · [最終maps](../evidence/0240-mapped-map-matrix.json) · [public stages](../evidence/0240-input-stages-mapped.json)
