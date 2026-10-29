# 圖示製作與精修

只有需要新增圖像或修改幾何／材質時才執行此流程。只是改排版或尺寸時，直接重用現有檔案。

## 構圖簡報

用一句話描述功能機制，再列出最少必要的形體、數量與關係。例如：

| 題目 | 主體與辨識機制 |
| --- | --- |
| Editor | 一張薄編輯平面、三行短線、中間聚焦框、獨立游標 |
| P3 | 柔和不對稱色域輪廓、內部三角形與三個取樣點、外側小座標軸；仍為單色 |
| Cascade layers | 五層等大薄片，均勻空隙，頂層一個小框 |
| Progressive rendering | 已有規則面板、分離的新片段、一個短轉接箭頭 |
| Scan | 一張來源頁、四個框角、單一掃描線；交會處留白 |

指定哪個元素最重要，哪些細節可刪。不要為了「豐富」增加徽章、底座、工具、第二個箭頭或無意義粒子。

## WebP 主圖

創作和修改 bitmap 時使用可用的圖片生成／編輯工具；不要把現有玻璃主圖重新描成一般線稿。如果使用內建 `image_gen`，傳入已查看的本地參考檔並設 `transparent_background: true`。SVG 幾何則直接修改原始碼。

先看 [視覺規範](visual-system.md) 的定案圖。新主題用它們作 **材質／光線／透視參考**，不要把參考主體形狀也複製到新題目。

### 淺色製作提示範本

以下可依需求精簡；將主題和形體數量換成任務內容。

```text
Create an original Master CSS homepage feature icon on a transparent square.
The supplied image is a style and material reference only, not the subject.
Use shallow oblique/isometric perspective, ultra-thin nearly colorless glass
planes, softly rounded corners, fine neutral zinc-gray contours, tiny subdued
edge glints and restrained overlap shading. Quiet, precise, spacious.
Light-UI material for white / pale-zinc cards. Real alpha transparency, no
background rectangle. Center optically; the main visible form occupies about
78–82% of the square's maximum extent.
Subject: [functional mechanism, exact essential objects and their relationships].
Occlusion: [which foreground feature interrupts which background lines].
No readable text, letters, numbers, logos, bright colors, blue cast, rainbow
refraction, thick extrusion, metallic bevels, bloom, broad cast shadows or
baked checkerboard. Keep separate objects visibly separated at 112 CSS pixels.
```

### 深色材質編輯提示範本

深色版從選中的淺色版編輯，另附定案深色圖作材質參考；不要各自獨立重新設計兩張。

```text
Image 1 is the edit target; Image 2 is the approved dark material reference.
Create the dark-UI lighting variant for a zinc-black card around #202023.
Preserve Image 1's exact canvas, geometry, object positions, size, perspective,
symbols, connectors, line count and transparent background. Change only
lighting and ink brightness.
Use nearly colorless transparent smoky glass, restrained soft gray luminance,
delicate subdued white edge highlights and pale zinc-gray strokes. Broad faces
remain smoky/translucent, not opaque white plates. Keep real alpha. No added
blue cast, glow, shadow, thick rims, bevels, text, symbols or background.
```

這些是目標，不是假設生成器必然遵守。回看明暗兩張，特別比對游標位置、層數、端點和相機角度；形體已漂移就修正圖片，不能靠不同 CSS translate／scale 假裝兩張對齊。

### 輸出與裁切

- 輸出透明 **384 × 384 WebP**。原套件使用品質 `0.96`；這是既有輸出基準，可依工具採用等價值。
- 同一對圖使用完全相同的裁切中心、方形邊長和縮放。原套件取兩張 `alpha > 96/255` 的 bounds 聯集，讓最大主要可見邊約占輸出 80%，再檢查光學中心。
- 計算主要 bounds 的門檻只用來找框，**不能把低 alpha 像素硬裁成透明**；柔和邊緣和透明度要保留。也要檢查聯集以外的淡亮邊沒有被截斷。
- 格式轉換與重採樣使用現有影像工具，不額外重畫材質、不烘焙底色、不加 CSS 陰影。
- 檔名沿用 `<stable-id>-light.webp`／`<stable-id>-dark.webp`。記錄使用工具、題目簡報、編輯意圖與輸出設定；不要記錄憑證或暫時無法復用的工具 ID 當成唯一參考。
- 原始 WebP 可能保有很淡的冷色，網站使用 `home-icon-artwork` 灰階呈現。交付到其他環境時，連同中性色處理一起交接，不能只拷貝 raw 圖就稱為完全一致。

## 清單圖示與歷史 Compact SVG

目前首頁清單重用對應的玻璃 WebP：lint 48px、agent tool 40px。先看實際尺寸的輪廓和核心符號；若細節失去辨識度，精修 WebP 的間隙、輪廓和線條密度，不改回 SVG。

以下保留原 32 單位 SVG 研究的製作參數，只有使用者另行要求向量版本或修復研究稿時才採用。研究稿應重新取捨細節，不把 96 單位圖等比縮到 32。

| 項目 | 既有 compact 基準 |
| --- | --- |
| 畫布 | `viewBox="0 0 32 32"` |
| 筆畫 | 輪廓 1.2、關鍵線／標記 1.25 單位 |
| 端點與轉角 | `stroke-linecap="round"`、`stroke-linejoin="round"` |
| 色彩 | `currentColor`，繼承網站 zinc 文字色 |
| 明暗層次 | 常見輪廓 opacity 約 .72、關鍵線 .84、淡面 fill-opacity .04；依鄰居校準 |
| 細節 | 留一個核心辨識機制，放大關鍵間隙與符號 |
| 顯示檢查 | 24／32／40px，明暗背景皆可讀 |

32 單位下的線粗是明確數字；bitmap 主圖的材質輪廓則看實際尺寸的視覺效果，不能把 compact 線寬直接套上去。

處理相交時優先切開後方 path，或調整物件位置留出空隙。不要用白色實心遮罩蓋掉後方線。附帶的 Scan SVG 展示來源頁輪廓、短線與掃描線的斷口安排。

SVG 保持靜態、可解析，沒有嵌入 bitmap、外部資源、動畫或依賴重複 ID 的 filter／mask／gradient；適合在同頁重複顯示。現有小圖直接用 path 與 opacity，不需新增依賴。

## 圖像驗收

主圖比較 64／80／96／112px，清單版另看 40／48px；放大檢查幾何，以實際用途尺寸作最後判斷。檢查透明 alpha、細邊完整、同一對圖的視覺定位、層數正確、關鍵形體分離、灰階後對比，以及與兩三張鄰居並排的重量。

單個修正只驗證受影響圖和相近使用位置；整套更新再檢查全圖錄。不要把「已寫入檔案」或「SVG 可解析」等同於視覺驗收。
