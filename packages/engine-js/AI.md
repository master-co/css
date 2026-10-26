# AI Notes For `@master/css-engine-js`

## Responsibility

The browser engine of the JS runtime engine plan: it executes compiled runtime programs (Rust still compiles manifests into them) with the semantics of the Rust `EngineSession`, returning JS objects. Zero dependencies; nothing here may import another package.

J0 state: types and an empty session only. Every operation returns an empty result.

## Gates

- `pnpm --filter @master/css-engine-js differential` runs the Rust engine (full Wasm, Node entry of `@master/css-binding-wasm-engine`) and this engine on the same program and classes and writes `.reports/differential.{md,json}`. Classes come from `parity/v2-language-corpus.json`, Rust engine and compiler string literals, site and examples markup, and seeded grammar fuzz (`--fuzz`, `--seed`). Any difference is a bug in this engine; Rust output is the reference.
- `pnpm --filter @master/css-engine-js check:size` checks the minified engine (≤ 30 KB br) and the CDN default page total (≤ 55 KB br). `--report` prints without failing.
- `pnpm --filter @master/css-engine-js bench:baseline --rc87 <dist>` compares the rc.87 JS runtime and the current runtime in a browser.
