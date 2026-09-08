# 0061 Example Firefox/WebKit delivery matrix

- Previous0060 confirmed BH-0036 and narrowed the Nuxt blocker with actual controls; this continuation follows progress. HEAD3d2f47768/0034 source hashes unchanged, foreign changes preserved.
- Scope EX-blank/vite/react/lit/webpack existing builds and0034 browser controls on two additional installed engines. Read root/index and current configs/entries, relevant package manifests/AI and routing/testing/docs packs. No additional0038 hosts, product edits or fixtures.
- [Matrix driver](../repros/example-browser-matrix.mjs) builds each isolated example once, runs Firefox/WebKit against that output using [existing smoke](../repros/browser-smoke.mjs). Smoke now accepts explicitBH_BROWSER, defaults to original Chromium, and reports actual engine version.
- Command per example:`python3 .ai/audits/bug-hunt/repros/isolated-package.py examples/<name> node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/example-browser-matrix.mjs <kind>`. kindstatic forvite,lit forlit,runtime forblank/react/webpack.
- [Source hashes](../evidence/0061-source-hashes.json) match0034. Checks visible UI, existing counter, runtime hidden→block/unknown→remove (Lit ShadowRoot), Vite static160px utility. HTTP failures logged separately; known Webpack missingindex.js BH-0027 is not cleared by page-error assertions. All10engine/example controls PASS.

## Results

- Five original builds PASS. [Blank](../evidence/0061-blank.log), [Vite](../evidence/0061-vite.log), [React](../evidence/0061-react.log), [Lit](../evidence/0061-lit.log), [Webpack](../evidence/0061-webpack.log); [structured status](../evidence/0061-results.json). Firefox155.0 andWebKit26.6 each pass all5existing browser scenarios, no page errors.
- Webpack both engines still request missingindex.js (HTTP404/BH-0027). Browser controls show working main/runtime/visible UI/class changes, not successful delivery of every asset. Existing Wasm size warning remains non-failing. No new finding.
- Each disposable package built once and served to both engines; logs record cleanup and all processes exit0. No package/fixture edit or new package-local lint obligation. Remaining arbitrary browser/device/HMR/plugin paths are not claimed;13blocked units unchanged.
