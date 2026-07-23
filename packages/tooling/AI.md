# AI Notes For `@master/css-tooling`

## Responsibility

`@master/css-tooling` is the consolidated Rust-backed developer-tooling surface for
lexing, source extraction, scanning, validation, lint, editor-neutral language
analysis, and the dependency-light diagnostics bridge.

## Owns

- Universal, native-only Node, and tooling-Wasm session loading.
- Feature subpaths under `lexer`, `source`, `scanner`, `validator`, `lint`, and
  `language`.
- Host CSS capability checks and source/file orchestration around Rust IR.
- Rust-generated, read-only built-in registry data for documentation and tooling.
- Private first-party Vue and Svelte extraction adapters used by the scanner.

## Does Not Own

- Any TypeScript semantic fallback.
- CSS directive compilation, project discovery, stylesheet composition, or complete
  project inspection; use `@master/css-compiler`.
- Shiki transformation or TextMate grammar assets; use
  `@master/css-language-service`.
- ESLint AST traversal, LSP transport, or framework/build lifecycle behavior.
- A third-party source-adapter registration API.

## Public Surface

- Universal root semantic session.
- `./lexer`, `./source`, `./validator`, `./lint`, and `./language`, with explicit
  `./node` entries for native sync execution.
- Node filesystem scanner under `./scanner/node`.
- `./builtins` for Rust-generated key-alias and native-value namespace registries.

Subpaths are responsibility boundaries inside one package, not independent packages.
Avoid adding convenience re-export files unless they define a deliberate documented
entrypoint.

## Key Directories

- `src/lexer`
- `src/source`
- `src/scanner`
- `src/validator`
- `src/lint`
- `src/language`
- `src/diagnostics`

## Risk Areas

- UTF-16 and source range correctness.
- Extraction false positives/negatives.
- Native CSS capability coordination.
- Lint edit plans and scanner state parity.
- Browser bundles accidentally importing Node code or native bindings.

## Validation

```sh
pnpm --filter @master/css-tooling test
pnpm --filter @master/css-tooling lint
pnpm --filter @master/css-tooling type-check
pnpm --filter @master/css-tooling build
```

Run downstream language-service, ESLint, compiler, and integration checks when the
corresponding subpath changes.
