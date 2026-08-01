# AI Notes For `mastercss-language`

## Responsibility

Editor-neutral document analysis, UTF-16 positions, formatting, semantic tokens, and
versioned language session IR.

Use `document.rs` for document analysis, `positions.rs` for offsets/ranges,
`formatting.rs` for edits, `semantic_tokens.rs` for tokens, and `session.rs` for the
wire session. Editor/LSP adaptation remains in TypeScript.

```sh
cargo test -p mastercss-language
cargo clippy -p mastercss-language --all-targets --all-features -- -D warnings
pnpm --filter @master/css-language-service test
```
