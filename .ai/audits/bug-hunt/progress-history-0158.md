# 0157 交接歷史

以下是當時共同交接原文；目前狀態見 README。

- 0157：獨立確認並修復BH-0046：dev runtime script與preload未加base造成404；改用既有URL helper與實際server設定。12新actual-server cases（六base×兩模式，各含根／巢狀HTML）、完整Vite209tests／38files、lint/types/build與原範例PASS；三瀏覽器動態class及theme HMR共216觀測PASS，無整頁reload。qualified dev控制仍500，bootstrap已200，與BH-0004分開。46historical／34fixed／12unresolved，10blocked／4root gates／4原候選與新增關閉殘留候選及0038身分暫停保留。只請求CSS／runtime後close留native async handle，普通CSS亦重現，診斷程序已留證終止。下一批先分類此生命週期，再接development graph完整CSS／resource交付、Nuxt子CSS與Webpack競態。HEAD42ccdc182，本批未提交／推送。[0157](batches/0157-runtime-development-base.md)。
