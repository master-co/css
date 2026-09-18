# Batch 0254: Ledger head archive and manifest residual classification

## 目前交接點

0253後五份帳本逼近48 KiB硬上限（README 47.0K、coverage 47.3K、findings 47.1K）。本批把五份帳本頭部較早的交接、提交核對與歸檔指標逐字移到`progress-history-0254-ledger-heads.md`，每份帳本頭部只保留最新批次bullet與一條指標；README的「目前交接點」同樣只留最新bullet。歸檔後README 26.6K、coverage 44.9K、findings 44.7K、changes 39.7K、report 40.7K。沒有改寫任何歷史描述，沒有產品變更。0038仍暫停。

## Manifest殘餘分類

0253後`@components`在400→800仍約×2.6（27ms）。以0253狀態的帶符號owned binding取樣3200個定義：熱點為binding的JSON `serialize_str`（結果序列化，隨輸出線性）、`IndexMap::insert_full`與`clone_from`、`Map` drop與sip hash，沒有再出現線性搜尋或每定義重掃的frame。殘餘成長歸因於配置／序列化的常數與cache效應，不再是二次搜尋；規模小（800定義27ms），不新增finding，列為已分類觀察。[sample](../evidence/0254-components-sample.log)

## 帳本

- 62historical／58fixed／4unresolved；65checked／10blocked、pending approvals不變；goal active。
- 下一步：回到Next PostCSS主線（sibling歷史決策、Turbopack路徑）或其他open項目。

[Final checks](../evidence/0254-final-checks.json)
