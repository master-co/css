# 0034 Browser example CSS delivery

- Bounded behavior: built example entry→CSS/runtime assets→visible browser DOM and class updates. Units EX-blank, EX-vite, EX-react, EX-lit, EX-webpack; Vite/Webpack/runtime upstream already checked.
- HEAD unchanged; README/coverage selected rows read; each package manifest, tsconfig, Vite/Webpack config, HTML and app entry read; docs routing pack loaded.
- Each package is copied before build; own dist/build files only. Browser smoke checks visible heading, existing counter click where present, hidden→block→remove runtime mutation (Lit ShadowRoot), unknown class boundary; static Vite checks emitted size utility computed width. Server/browser close in finally.
- Normal build is baseline; no rebuild-only coverage claim. Pending logs.

## Results

- Exact per-example isolated build+browser commands captured at beginning of logs: [blank](../evidence/0034-blank.log), [Vite](../evidence/0034-vite.log), [React](../evidence/0034-react.log), [Lit](../evidence/0034-lit.log), [Webpack](../evidence/0034-webpack.log). All exit 0.
- Actual Chromium: visible headings, counter update in Vite/React/Lit, runtime new element hidden→block plus unknown class and removal for blank/React/Lit/Webpack. Lit test targets actual shadow root. Vite static CSS size:40x! computes width160px. No page errors. Own server/browser/temp tree removed for each.
- Webpack reports existing large Wasm asset performance warning; no functional failure. A manual index.js script in Webpack template is a deferred asset-reference inspection item; this smoke does not assert every HTTP response.
- No new confirmed bug in these five examples. Remaining browser matrix/framework dev edit HMR inherits integration tests; no claim of every example HMR path. AI context size check PASS. Completed.
