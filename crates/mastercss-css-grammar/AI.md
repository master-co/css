# AI Notes For `mastercss-css-grammar`

## Responsibility

CSS syntax and value-grammar checks for compiler and tooling reports: token
structure, value status against mdn-data with css-tree's patch, declarations of
rules with UTF-16 ranges, and css-tree-shaped grammar errors. It is a port of
css-tree's parser, generator and lexer, so results match `@eslint/css-tree` 4.1.2;
`tests/parity.rs` holds fixtures recorded from that release.

Grammar knowledge is a report, never permission to generate a declaration.

## Routing

- `check.rs`: the public checks; start here.
- `parser.rs`, `stream.rs`, `generate.rs`, `strings.rs`: css-tree's parser, token
  stream and generator.
- `lexer/`, `definition/`, `tokenizer.rs`: value definition syntax matching
  (adapted from markuplint).
- `math.rs`: math-function structure and static type checks.
- `grammar.rs` and `data/`: the generated grammar. After updating mdn-data or
  `data/patch.json`, run `node scripts/generate-css-grammar-data.mjs` and update
  `MDN_DATA_VERSION` and `MASTER_CSS_GRAMMAR_DATA` in `packages/binding`.

Bindings expose the checks as `cssSyntaxStatus`, `cssValueStatus` and JSON
functions; `@master/css-binding/css-grammar` adapts them for hosts.

```sh
cargo test -p mastercss-css-grammar
cargo clippy -p mastercss-css-grammar --all-targets -- -D warnings
```
