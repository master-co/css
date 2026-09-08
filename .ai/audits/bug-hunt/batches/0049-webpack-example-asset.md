# 0049 Webpack example script asset

- Scope BH-0027 only: real isolated Webpack build, emitted script URLs and Chromium requests. Read example manifest/config/template, webpack AI notes and0034. HEAD3d2f47768 unchanged. No product edits; example has no lint script.
- Source template includes `./index.js`, config emits `[name].js` with default main entry. Prior0034 checked runtime UI but did not assert every HTTP response. Need valid generated script control and actual failed request before classification.

## Results

- Command: `python3 .ai/audits/bug-hunt/repros/isolated-package.py examples/webpack node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/BH-0027-webpack-asset.mjs`; [log](../evidence/0049-webpack-asset.log). Build succeeds; aggregate exit1 at intended missing-asset assertion.
- **BH-0027 P3 confirmed**: `examples/webpack/src/index.html:6` contains `./index.js`; output only has `main.js` and the runtime/chunk scripts. Real Chromium requests index.js→404, main.js/runtime/manifest/Wasm→200. H1 visible, font48px control passes. Thus unnecessary broken asset request/console error, not whole-app or runtime failure.
- Expected all template script URLs resolve to emitted files. Fix direction: remove redundant handwritten script and rely on HtmlWebpackPlugin entry injection. No product edit.
- Server/browser closed and disposable tree removed by finally. Completed bounded asset check. Other browser/HMR combinations remain unclaimed. Next0050 resolve BH-0025 bundle ownership.
