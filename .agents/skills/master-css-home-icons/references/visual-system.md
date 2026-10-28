# 視覺基準與定案參考

## 版本與適用範圍

基準：Master CSS `rc`，commit `f7205ccdd`，2026-10-28。此版本包含 41 個主題、41 組明暗 WebP、15 個 compact SVG。首頁當時實際用到 34 個主題；其餘保留在圖錄，不為了湊滿數量插入首頁。

舊 96 × 96 SVG 留作可編輯構造研究，不是主圖成品。原提案的「主線 2、細線 1.5、純線條深度」已被柔和玻璃方向取代，不要用那些數字重設已定案的外觀。主圖有低對比的材質明暗；不以「最初禁止漸層」為由抹掉它。

## 材質、光線與色彩

| 項目 | 定案方向 | 常見偏差 |
| --- | --- | --- |
| 面 | 超薄、近乎無色的透光玻璃；適量柔和明暗 | 厚塑膠、白色實心板、陶瓷或黏土 |
| 輪廓 | 精細中性灰線，柔和轉角 | 粗黑輪廓、尖硬工業製圖 |
| 邊緣 | 少量窄亮邊，能描述薄度即可 | 粗白框、金屬倒角、全周高亮 |
| 深度 | 淺斜透視、間距與遮擋；局部輕微重疊陰影 | 巨大擠出、厚側面、浮空的大面積陰影 |
| 色彩 | zinc 灰階，白底柔灰，暗底煙灰玻璃 | 青藍冷光、彩虹色散、刻意暖褐 |
| 背景 | 真正 alpha；放到卡片上自然融合 | 烘焙白底、黑底、棋盤格或背景方塊 |
| 動態 | 靜態圖示 | 圖示自帶動畫、發光、模糊濾鏡 |

淺色版在白色／淺 zinc 卡片上保持細輪廓可見，反光不刺眼。深色版在約 `#202023` 的 zinc 卡片上呈煙灰透明材質，線條提亮但不變成不透明白板。

現有主圖的最終中性色由 `.home-icon-artwork { filter: grayscale(1); }` 保證；這是定案的一部分。不要用 `invert()`、`hue-rotate()`、混合模式、額外 drop-shadow 代替真正的深色材質。新圖從生成時就要求無冷色，接入仍沿用此 class。

## 形體與光學

- 共享淺斜投影方向，對齊同一物體上的平行線；沒有需套用到每一張圖的固定相機角度。看定案形體決定角度，不套另一套 UI 插圖的投影參數。
- 薄片邊角柔和，圓點小且少，連接線纖細、轉折舒緩。避免把每個符號改成胖圓柱或圓球。
- 主要形體最大可見邊約占畫布 78–82%，外圈留下空氣。細長結構、散點與堆疊可用光學判斷校正，不以每張填滿同樣 bounding box 為唯一目標。
- 先辨識外輪廓，再辨識一個核心機制，最後才是細節。縮到用途尺寸會變成噪點的線要移除或合併。
- 以系列鄰居比較重量：五層平面天然比單一游標重，應靠薄度、透明度與留白調節，避免靠大幅縮小整張圖處理。
- 主圖不要可讀文字、數字、品牌標誌或裝飾性 UI 細節；短 code strokes 是形狀，不需要生成文字。

## 遮擋與穿模

每次都指出哪些線位於前景、哪些屬於後景；透明材質不代表所有線都能無條件穿過物體。

- **Editor**：游標獨立於面板邊線，下面的輪廓或 code strokes 應斷開；游標尖端和面板角不要剛好相切。
- **Scan**：掃描線是主訊號；相交的 code strokes 留小斷口，四角框不要黏到頁面輪廓。
- **Cascade**：恰好五層，間距可數，各層的邊不能變成無法辨認的密線；頂層小框只屬於頂層。
- **Progressive**：既有面板、待加入片段和箭頭彼此留空；箭頭末端不能看起來刺入玻璃。
- 透明重疊可以存在，但要仍看得出物件的完整輪廓與前後。細線不能用背景色遮蓋來假裝挖空，否則切到另一種底色會露餡。

## 實際參考檔案

以下 WebP 保留成品原檔。查看時先看所需主題的 light／dark 一對；做顏色判斷時參照下方已套用灰階的首頁截圖。

| 主題 | 淺色 | 深色 | 用途 |
| --- | --- | --- | --- |
| Hover inspection | [light](approved/editor-hover-inspection-light.webp) | [dark](approved/editor-hover-inspection-dark.webp) | 最初選中的 B 材質；透明疊片與游標 |
| Editor | [light](approved/section-editor-light.webp) | [dark](approved/section-editor-dark.webp) | 校正游標、聚焦框與邊線遮擋 |
| 明暗模式 | [light](approved/design-theme-modes-light.webp) | [dark](approved/design-theme-modes-dark.webp) | 單一平面、柔和切面與小符號 |
| P3 | [light](approved/design-p3-gamut-light.webp) | [dark](approved/design-p3-gamut-dark.webp) | 非矩形輪廓，取樣點與座標線 |
| Cascade layers | [light](approved/design-cascade-layers-light.webp) | [dark](approved/design-cascade-layers-dark.webp) | 五層薄片與空隙 |
| Progressive | [light](approved/render-progressive-light.webp) | [dark](approved/render-progressive-dark.webp) | 分離片段、方向與留白 |
| Scan | [light](approved/mcp-scan-project-light.webp) | [dark](approved/mcp-scan-project-dark.webp) | 框角、頁面與掃描訊號 |

SVG 小圖參考：[Scan](approved/mcp-scan-project-compact.svg)、[Invalid classes](approved/lint-invalid-classes-compact.svg)、[Apply preview](approved/mcp-apply-preview-compact.svg)。

最終頁面比例參考（圖片是單一卡片裁切，檔名的 desktop／mobile 指原頁面 viewport）：

- [桌面淺色卡片](approved/bento-desktop-light.png)：文字和圖示分組、112px 圖框與間距。
- [桌面深色卡片](approved/bento-desktop-dark.png)：zinc 材質與文字對比。
- [390px 手機卡片](approved/bento-mobile-light.png)：圖示維持 7rem、左側標題與描述一起換行。
- [全寬 P3 卡片](approved/bento-p3-desktop-light.png)：圖文仍在同一組中，不把圖示推到整張卡片最遠端。

[manifest.json](approved/manifest.json) 記錄每份參考檔案的來源、尺寸和 SHA-256，方便確認是否仍為定案樣本。
