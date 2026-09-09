# 0160 Development graph resource paths and lifecycle

## 基線與範圍

- 前輪0159完成215tests／96browser、BH-0047修復與完整帳本，屬有效進展。209來源雜湊一致；HEADb306e5d77，無新commit/push。0038追加驗證仍等待明確身分確認。
- 接續BH-0004未完成交付：先檢查resource特殊檔名、更新時的URL與可達性，再追retained graph於shared root／environment的生命週期。47historical／35fixed／12unresolved、10blocked／4gates／4原候選及1host shutdown限制保留。

## 進行中

- 新actual-server tests檢查static／progressive兩模式，普通、空白、#、?、%、Unicode SVG檔名，CSS原始URL以percent encoding表達，獨立query／fragment保留。必須取得確切SVG bytes與MIME；不能只用status200將HTML fallback當通過。
- 尚未有結果，不預先分類成產品bug。其他原有未完成項目與暫停範圍不縮减。

## 初步證據與修正

- 首輪12cases為8PASS／4FAIL；static及progressive的#／?檔名皆200但回HTML fallback。逐段encodeURIComponent後仍4FAIL：Vite 8.2.2 static／raw-fs內部decodeURI保留reserved編碼，後續檔案查找無法取得原檔。純Vite、無Master CSS plugin的五控制亦僅普通／空白／%成功，#與?回HTML，具體log保存；probe exit0只代表完成觀察。
- 0160-vite-tests-first：223PASS／4個同樣資源FAIL；lint/types通過。屬BH-0004新dev delivery接入主機靜態交付的缺口，不新增重複finding ID、不修改Vite依賴。
- 改將已註冊資源發布成context擁有、安全檔名的版本副本，再交Vite @fs服務，沿用主機MIME／Range／ETag。副本以資源URL digest命名；原始來源仍為dependency，關閉最後environment時移除該context暫存目錄。16focused通過；後續加Range及確切副本檔案清理控制。
- 新built-package瀏覽器重現將檢查四mode／三browser的child CSS edit、特殊檔名SVG變更及恢復，以canvas像素、query／fragment、exact bytes及bootID驗證；尚未有結果，不能宣称HMR已完成。

- 安全檔名副本初版完整227tests通過，新增Range與關閉檔案檢查12PASS。另補原server.fs.deny控制，兩模式皆抓到副本路徑繞過原檔deny的回歸（2FAIL）；資源映射保留source，服務前用Vite公開isFileLoadingAllowed核對原始來源，修後26focused通過。不能以副本路徑取代原檔的存取政策。
- 兩個既有font mock tests未走真實server close，留下兩個本輪字型副本目錄；已補mock context的afterEach清理，舊owned副本清單／hash及清理原因保存。actual-server關閉清理控制通過。此為測試生命週期缺口，與主機未完成async handle限制區分。

- 完整229tests及shared plugin兩root／已使用SSR environment關閉控制通過；built-package四mode／三browser的初始、child edit、SVG紅→藍→紅共48觀測全PASS，核對canvas RGBA、HTTP bytes／MIME／query／fragment與bootID不變。
- 追加舊版本交付控制重現：重新compose後舊resource URL404，舊child CSS URL回新bytes。屬BH-0004開發圖譜版本生命週期問題；單看當前頁面HMR48PASS不能證明此要求。改將CSS版本digest放入檔名，保留該context已發布的CSS／resource映射與副本，直到最後environment關閉；原inline字串或尚未完成的import可取回原版本。外部URL的內容仍由外部server管理。
- 此設計會按該context已發布的版本數保留CSS記憶體與resource暫存檔，最後關閉時全部釋放；不以任意TTL刪除仍可能被既有CSS字串引用的資產。獨立新測試驗證舊／新URL不同且各自bytes不變，修後驗證尚在進行。

## 最終查核與下一步

- 版本修正後32focused、完整231tests／42files、Vite lint/types/build、原Vite範例build通過。final resource矩陣48observations全PASS；已對新版URL再驗證四mode／三browser的child CSS與SVG HMR、像素、HTTP bytes及不reload。既有qualified/pre-render矩陣另行重跑，終態列於final-checks。
- Site文件同步已驗證的資源檔名、HMR、原檔deny、旧版本與關閉生命週期；Site lint零errors／75既有warnings。compiler／Rust／runtime本批未修改，五個Wasm/runtime/manifest產物需以最終hash核對。
- 公開API最低版本核對：[Vite 6.0.0 publicUtils](https://raw.githubusercontent.com/vitejs/vite/v6.0.0/packages/vite/src/node/publicUtils.ts)已匯出isFileLoadingAllowed；[static middleware](https://raw.githubusercontent.com/vitejs/vite/v6.0.0/packages/vite/src/node/server/middlewares/static.ts)接受ResolvedConfig與原始檔案路徑。這只是新增helper的surface核對，不宣稱完整Vite 6回歸已執行。
- 本批缺口歸BH-0004，無新finding ID。47historical／35fixed／12unresolved、65checked／10blocked、4root gates、4原候選與1host shutdown限制保持；0038明確身分確認仍未取得。不可將同一輪的成功HMR或有界cleanup控制推論成所有環境已完成。
- 下一批檢查資源刪除／恢復與發布讀取一致性，續custom environment replacement／restart的retained graph；再接local-compose實際圖譜、virtual resource/reference owner、其他preprocessor／PostCSS／maps、Nuxt與Webpack及全部原有未完成要求。未commit/push。
