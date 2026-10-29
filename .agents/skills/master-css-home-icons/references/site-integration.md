# 首頁接入基準

以下位置相對於實際使用的 Master CSS repository 根目錄。基準來自 `rc` 的 `f7205ccdd`；未來如檔案移動，先找目前擁有同一功能的元件，不重建過時的副本。舊 checkout 與開發服務的 port 都不是固定契約。

清單圖示依 2026-10-29 使用者更新統一為繪製 WebP，取代先前 SVG 接入；bento 及主圖材質規範不變。

## 資產與元件位置

| 位置 | 用途 |
| --- | --- |
| `site/assets/images/home/icons/artwork/` | 41 組 light／dark WebP；`source.json` 是製作紀錄 |
| `site/assets/images/home/icons/artwork.ts` | 型別化主圖對應 |
| `site/assets/images/home/icons/artwork.css` | `home-icon-artwork` 的 zinc 灰階處理 |
| `site/assets/images/home/icons/catalog.ts` | 全圖錄、語意 ID、target 與 compact 對應 |
| `site/assets/images/home/icons/*-compact.svg` | 15 張歷史 32 單位 SVG 研究稿，僅保留於圖錄 |
| `site/content/components/HomeIllustration.tsx` | 裝飾性明暗主圖；沿用網站圖片元件 |
| `site/content/components/HomeCompactIcon.tsx` | 重用 HomeIllustration 的裝飾性清單 WebP |
| `site/content/components/HomeBento.tsx` | 共用 bento header／card 與 section header |
| `site/content/home.css` | 實際大小、圖文排列、主題顯示規則 |
| `site/content/design-system/review/home-icons/` | 圖錄、尺寸預覽與接入說明；路由 `/design-system/review/home-icons`，noindex |

`catalog.ts` 的 `recommendedSize: 96` 是圖錄通用基準；**bento 實際尺寸是 112px**。不要只讀 catalog 就把首頁縮回 96px。`Icon` 是舊 SVG 構造研究，`artwork.light/dark` 才是定案主圖。

清單項目的 `recommendedSize` 為 lint 48、MCP 40；`CompactIcon` 也只是歷史研究稿，不能因為名稱是 compact 就用於目前首頁。

保持 server 元件與 client island 的邊界。現有 Editor、Lint、Agent islands 接收 server 端生成的圖示 ReactNode slots；不要為了顯示圖示把整個 catalog 或所有 SVG imports 搬進 client bundle。

## 位置與尺寸

| 位置 | 實際顯示大小 | 注意 |
| --- | --- | --- |
| Section heading | 64–80px | 不套 bento 的 7rem |
| Bento card | **7rem／112px** | 明暗圖都使用相同方框 |
| Editor feature／rendering mode | 64px | 配合既有段落與互動結構 |
| Lint item | 48px WebP | 使用對應明暗玻璃圖 |
| Agent tool row | 40px WebP | 使用對應明暗玻璃圖 |

HTML 圖片的 width／height 和圖片來源候選尺寸也要足以支援 112px；只改 CSS、保留過小的來源尺寸可能令正式站圖像模糊。`HomeBentoCard` 已傳 `size={112}`，沿用即可。

## Bento 結構與比例

所有 bento，包括 P3，使用同一個 header 結構：

```text
card
├─ header
│  └─ caption
│     ├─ copy
│     │  ├─ h3 > title link
│     │  └─ description
│     └─ illustration (7rem)
└─ visual / interactive demonstration
```

標題和描述是一個完整文字組；描述不跨到右側圖示下方。圖示依整個 caption 垂直置中，文字從上方起排，讓同列標題基線穩定。標題連結有 hover 底線與 keyboard focus 樣式，不另加 See details／How it works。

現有 caption 使用 `grid-template-columns: minmax(0, 44ch) 7rem`。44ch 上限讓全寬 P3 的圖示仍靠近文字組，不被推到整張卡片最右端。標題與描述間距為 .75rem。

圖文間距依 **header 可用內容寬度**，不是 viewport：

| Header 內容寬 | 間距 |
| --- | --- |
| 預設／窄卡 | 1.5rem／24px |
| 至少 22rem | 2rem／32px |
| 至少 28rem | 3rem／48px |

目前 header padding 為 `1.75rem 1.5rem 2rem`，網站 `--sm` 時 `2.25rem 2.25rem 2.5rem`，`--lg` 時 `2.5rem 2.75rem 2.75rem`。這些是已驗證配置，後續若使用者更改版面可調整；不要假設命名斷點等同 Tailwind 的數值。

**Container query 放 header，不放整張 subgrid card。** 卡片本身做 size containment 曾讓自動高度的 Tokens 程式碼區塊塌陷。保留同列 cards 的 header／visual 兩列 subgrid 對齊。

P3 的 header 是圖卡直接子元素；互動色盤放在其後，readout 留在色盤區內，不再把 caption 包進 PaletteExplorer。

Design system 順序：第一列明暗模式／Tokens 各半寬，第二列全寬 Wide-gamut color，最後一列 Layout and motion／Native CSS layers 各半寬。窄螢幕按相同內容順序堆疊。

## 接入範例

這些是現有元件的用法，不是要求新增另一份元件或 CSS。

```tsx
import { HomeBentoCard } from '~/site/content/components/HomeBento'

<HomeBentoCard
  body={translatedDescription}
  href={existingGuideHref}
  icon="design-p3-gamut"
  title={translatedTitle}>
  {existingInteractiveFigure}
</HomeBentoCard>
```

一般裝飾性使用可用 `HomeIllustration` 或 `HomeCompactIcon`；兩者都顯示明暗 WebP，已有 `aria-hidden`，圖片 alt 為空。不要再給裝飾圖一個重複標題的可存取名稱。

圖示單獨承擔資訊時，不使用上述隱藏包裝，直接用圖片 `alt` 提供名稱。文字要描述它傳達的資訊，不描述「一個玻璃圖示」。沿用目前主題對應的圖檔。

```tsx
import Image from '~/site/docs-shell/components/Image'

<Image src={matchingThemeArtwork} width={48} height={48}
  className="home-icon-artwork" alt={translatedMeaning} />
```

使用既有主題 class 選 light／dark 圖，兩者同方框、同光學裁切。不要另加瀏覽器 theme state 或圖示動畫，也不新增公開套件 API。

## 接入驗證

- 看 390／768／1280px、明暗模式的實際截圖；有翻譯時包含繁中。Bento 圖框維持 112px，文字不和圖示碰撞，無非預期裁切或水平溢出。
- 同列示範起點對齊，Tokens 程式碼區保持正常高度；P3、Editor、Lint、Rendering、Agent 原有鍵盤／點擊互動仍能使用。
- 圖錄載入、資產無缺圖、同頁多次顯示不產生 ID 衝突；新增圖示時同步對應清單和相關預覽。
- 改 site 時依現有腳本執行 `pnpm --filter site lint`、`type-check`、`prepare-app`；首頁內容或元件受影響時執行 `test:home`；AI／來源結構受影響時執行 `pnpm run check:ai-context`。
- 既有錯誤以當次實際輸出判定，不把歷史「7 個 type errors」當成永久允許失敗的清單。只修此次引入的問題，其他另行報告。
