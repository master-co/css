# 0162 historical handoff archive

- 0161：修復BH-0004資源命名／發布讀取不一致。兩控制重現來源替換後舊href存入新bytes、來源刪除後copy失敗；改用同一Buffer計算版本並保存副本，發布不再重讀來源。237tests／lint／types／build、原Vite範例、四mode HTTP刪除恢復及48三瀏覽器觀測通過：缺檔有明確overlay／預期CSS500，舊版本仍可讀，恢復後更新像素並清除overlay、bootID不變。新fixture欄位錯誤已修正後重現，未算產品型別bug。仍47historical／35fixed／12unresolved、10blocked／4gates／4原候選+1host shutdown限制；0038身分暫停維持。下一批接retained graph custom environment replacement／restart，再續local-compose／virtual owner、其他preprocessor／maps、Nuxt／Webpack與全部未完成要求。本批未commit/push；HEADb306e5d77。[0161](batches/0161-development-resource-recovery.md)。
