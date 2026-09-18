# 0201 checkpoint preserved before scope expansion

- 0201：使用者授權binding專用型別打包修正，BH-0061發布宣告缺檔已修復；隔離預設build重現失敗，修正後7公開入口嚴格型別正反控制與runtime、binding25tests、lint通過；28個JS逐位元組相同，完整dist原子替換。其他3套件型別產物候選待隔離重建；raw20qualified／39external、全hosts/maps/recovery/gates/benchmarks/Site仍未完成。61historical/57fixed/4unresolved、10blocked、0038身分暫停維持；目標active，本批未提交。[證據](evidence/0201-final-checks.json)；[批次](batches/0201-published-declaration-closure.md)；[前次交接](progress-history-0201-declarations.md)。

| BH-0061 | P2 | 已修復 | binding發布宣告引用未產生的本地型別檔，嚴格TS使用端編譯失敗 | 授權binding專用DTS打包；7入口型別正反控制、25testsPASS，28JS相同；[0201](batches/0201-published-declaration-closure.md) |

## Before explicit two-patch approval

- 0202：tooling／language-server／MCP型別候選均由隔離預設build確認，BH-0061擴大範圍為部分修復；binding修復仍有效。兩份候選patch通過17入口嚴格型別、16library imports、LSP來源types／lint，84JS完全相同；尚待使用者授權三套件規則擴充，未套用產品或產物。61historical/56fixed/5unresolved、10blocked；0038身分暫停與其餘raw/hosts/maps/recovery/gates/benchmarks/Site未完成範圍保持。目標active，未提交。[證據](evidence/0202-final-checks.json)；[批次](batches/0202-cross-package-declarations.md)；[前次交接](progress-history-0202-declarations.md)。
