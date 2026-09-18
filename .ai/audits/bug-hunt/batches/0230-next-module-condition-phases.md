# Batch 0230: Next Module condition phases

Opening: 654 tracked audit/source inputs, 493 shared artifacts, 48 candidate sources and 52 candidate artifacts match0229. Index empty; HEAD3b5c98d61c6dc69ee3546d9d4f822e9e835f308e. Candidate remains0228;0229 prototype rejected.

Bounded work: pure/candidate Turbopack mixed Server/Client consumers, varying package condition branches. Capture exported HTML classes, initial browser selectors and Client remount to distinguish server export resolution from browser CSS. Only owned audit fixtures; no product changes, candidate rebuilds or promotion. Chromium/WebKit only; Firefox and0038 identity pause remain. All45 prior remaining entries retained.

## 已驗證結果

12 次實際 Turbopack production build 全部完成，Chromium／WebKit 共 88 個「consumer × 初始／重新掛載」觀測：外觀 84 PASS／4 FAIL。這個外觀數字不包含條件分支正確性；另有 18 個純 Next／候選 branch 差異，其中 12 個為 Server、6 個為 Client 初始 HTML。兩瀏覽器結果一致，無瀏覽器啟動、頁面或 console 錯誤。

| 套件 exports 條件 | 純 Next Server | 純 Next Client 初始 → remount | 候選 | 分類 |
|---|---|---|---|---|
| 全部分支，mixed | react-server | import class 無對應 CSS → browser 正常 | 全部 browser | 原生 Client 初始 2 FAIL；候選 Server 條件錯誤 |
| browser/default，mixed | default | default → browser，皆正常 | 全部 browser | Server 載入的 default CSS 掩蓋 Client 初始差異 |
| browser/default，Client-only | 無 | default class 無對應 CSS → browser 正常 | 全部 browser | 原生 Client 初始 2 FAIL；與 mixed 對照定位缺少 SSR 分支 CSS |
| react-server/default，mixed | react-server | default → default | 全部 default | 候選 Server 條件錯誤 |
| import/default，mixed | import | import → import | 全部 import | 此範圍一致 |
| default-only，mixed | default | default → default | 全部 default | 此範圍一致 |

證據保存 exported HTML 的 probe tags、完整 CSS、每個元素命中的 CSSOM selector/declarations、初始與 remount class/origin、build 日誌。Client key 改變後，等待 data-revision=1 再觀察；這只是定位控制，不是產品修正。分支由 fixture 獨有 class 名稱判定，外觀與 branch 比較分開，不能用 7px 邊框通過掩蓋 Server branch 錯誤。

純 Next 全分支 mixed 的初始 HTML 含 import class，CSS 只有 react-server/browser；Client-only browser/default 的初始 HTML 含 default class，CSS 只有 browser。兩者 remount 後用 browser class 即恢復。這把0229原生委派實驗的 Client 失敗限縮到 SSR export 與瀏覽器 stylesheet 的條件不一致；不能歸咎 Master CSS、不能把重新掛載視為修復。候選的 Server 分支丟失則仍是 adapter 問題，沿用 BH-0004／BH-0051 範圍，不新增重複 ID。

## 保存與驗證

- 只擴充 audit repro；654 個既有來源輸入中653不變。493 shared artifacts、48 candidate sources、52 candidate artifacts 不變，候選保持0228。
- 12 個 host 程序均結束，owned temporary apps 已清除；正式產品、既有 tests/fixtures、依賴、lockfile、CI、Site 未修改，index 空，沒有 commit／promotion。
- node --check 與 AI context 檢查見 final checks。本批無 package code 變更，未重跑 package tests/lint/build；0228驗證保留為歷史，不宣稱新 PASS。
- Firefox 環境問題、0038 身分驗證暫停與45個既有 remaining entries 全保留，追加本批窄化結論；未完成不結案。

## 可接續下一步

同一個 CSS Module 在 Server、Client SSR 與 Client browser 有不同分支；下一批先檢查 host 是否有正式、可觀測的 graph/transition 能力讓 CSS publication 與 Module exports 共用消費者身份，不能依檔名／process／一律 browser 猜測。如果目前 loader API 仍沒有足夠資訊，保留具體交付限制，先推進獨立 inline-loader／qualified import／Sass source capture 工作；仍須保留 native Client 初始錯配與全部原要求。

[原始矩陣](../evidence/0230-condition-matrix.json) · [保存與全部未完成項目](../evidence/0230-final-checks.json)

