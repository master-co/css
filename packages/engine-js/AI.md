# AI Notes For `@master/css-engine-js`

## Responsibility

The browser engine of the JS runtime engine plan: it executes compiled runtime programs (Rust still compiles manifests into them) with the semantics of the Rust `EngineSession`, returning JS objects. Zero dependencies; nothing here may import another package.

State: J1. `decodeProgram` (`src/program.ts`) decodes the binary program field for field as `crates/mastercss-engine/src/program.rs` does, returns `{ ok: false, error }` for malformed or unsupported input instead of throwing, and derives what Rust's `finish_program` does: built-in native utilities from `src/native-properties.ts` (generated from the Rust registry by `scripts/generate-native-properties.mjs`), default names and orders, static-first match order, custom media branches, and lookup indexes (static, key, token and function utilities, token prefixes bucketed by first character). `createEngineSession` decodes and throws `INVALID_PROGRAM` or `UNSUPPORTED_PROGRAM_VERSION`; its operations still return empty results. Variables carry no order field; `variableOrder` is declaration order.

## Gates

- `pnpm --filter @master/css-engine-js verify:program` re-encodes each decoded program in the Rust layout and requires the Rust bytes back, compares names, counts and keyframes with the manifest and the Rust session, and requires truncated and bit-flipped programs to be accepted or rejected exactly as the Rust engine does.

- `pnpm --filter @master/css-engine-js differential` runs the Rust engine (full Wasm, Node entry of `@master/css-binding-wasm-engine`) and this engine on the same program and classes and writes `.reports/differential.{md,json}`. Classes come from `parity/v2-language-corpus.json`, Rust engine and compiler string literals, site and examples markup, and seeded grammar fuzz (`--fuzz`, `--seed`). Any difference is a bug in this engine; Rust output is the reference.
- `pnpm --filter @master/css-engine-js check:size` checks the minified engine (≤ 30 KB br) and the CDN default page total (≤ 55 KB br). `--report` prints without failing.
- `pnpm --filter @master/css-engine-js bench:baseline --rc87 <dist>` compares the rc.87 JS runtime and the current runtime in a browser.
